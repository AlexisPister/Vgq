from bs4 import BeautifulSoup

from py2neo import Graph, Node, Relationship

# In the data
ACTE = "ACTE"
DATE = "date"
EPOUX = "epoux"
EPOUSE = "epouse"
PERE = "pere"
MERE = "mere"
TEMOINS = "temoins"
TEMOIN = "temoin"
PRENOM = "prenom"
NOM = "nom"
CONDITION = "condition"

# Neo4j Nodes/Relationships names
PERSON = "PERSON"
ACT = "MARRIAGE_ACT"

# MENTIONED_AS_HUSBAND = "MENTIONED_AS_HUSBAND"
# MENTIONED_AS_WIFE = "MENTIONED_AS_WIFE"
# MENTIONED_AS_HUSBAND_FATHER = "MENTIONED_AS_HUSBAND_FATHER"
# MENTIONED_AS_HUSBAND_MOTHER = "MENTIONED_AS_HUSBAND_MOTHER"
# MENTIONED_AS_WIFE_FATHER = "MENTIONED_AS_WIFE_FATHER"
# MENTIONED_AS_WIFE_MOTHER = "MENTIONED_AS_WIFE_MOTHER"
# MENTIONED_AS_WITNESS = "MENTIONED_AS_WITNESS"

MENTIONED_AS_HUSBAND = "HUSBAND"
MENTIONED_AS_WIFE = "WIFE"
MENTIONED_AS_HUSBAND_FATHER = "HUSBAND_FATHER"
MENTIONED_AS_HUSBAND_MOTHER = "HUSBAND_MOTHER"
MENTIONED_AS_WIFE_FATHER = "WIFE_FATHER"
MENTIONED_AS_WIFE_MOTHER = "WIFE_MOTHER"
MENTIONED_AS_WITNESS = "WITNESS"


def find_name(person_markup):
    # find global name from epoux, temoin, etc markups
    prenom = person_markup.find(PRENOM)
    nom = person_markup.find(NOM)
    condition = person_markup.find(CONDITION)

    if condition:
        condition_txt = condition.text
    else:
        condition_txt = None

    if prenom is not None and nom is not None:
        label = prenom.text + " " + nom.text
        return prenom.text, nom.text, label, condition_txt
    else:
        return None, None, None, None


def get_node(ID, ids_to_nodes, firstname, lastname, fullname, condition):
    if ID in ids_to_nodes:
        node = ids_to_nodes[ID]
    else:
        if condition:
            node = Node(PERSON, id=ID, firstname=firstname, lastname=lastname,
                        name=fullname, condition=condition)
        else:
            node = Node(PERSON, id=ID, firstname=firstname, lastname=lastname,
                        name=fullname)
        ids_to_nodes[ID] = node
    return node


def process_role(role, ids_to_nodes):
    ID = role.get("id")
    if ID is not None:
        firstname, lastname, label, condition = find_name(role)
        if label is not None:
            node = get_node(ID, ids_to_nodes, firstname, lastname,
                            label, condition)
            return node
    return None


def test_date(date):
    try:
        date_int = int(date)
        return True
    except Exception as e:
        try:
            date_int = int(date[-4:])
            return True
        except Exception as e:
            return False



def load_actes_to_neo4j(actes_path, limit=None):
    graph = Graph('http://localhost:7474')
    graph.delete_all()
    count = 0

    soup = actes_fp_to_soup(actes_path)
    ids_to_nodes = {}

    for acte in soup.find_all(ACTE):
        try:
            acte_id = acte.get("id")
            # We add an 'a' to differ acts and persons ids
            acte_id = "a" + str(acte_id)

            is_date_valid = False
            date = acte.find(DATE)
            if date:
                date_txt = date.text
                is_date_valid = test_date(date_txt)

            if not is_date_valid:
                continue

            pere_epoux_node = None
            pere_epouse_node = None
            mere_epoux_node = None
            mere_epouse_node = None
            epoux_node = None
            epouse_node = None

            # EPOUX
            epoux = acte.find(EPOUX)
            if epoux is not None:
                epoux_node = process_role(epoux, ids_to_nodes)

                pere = epoux.find(PERE)
                if pere is not None:
                    pere_epoux_node = process_role(pere, ids_to_nodes)

                mere = epoux.find(MERE)
                if mere is not None:
                    mere_epoux_node = process_role(mere, ids_to_nodes)

            # EPOUSE
            epouse = acte.find(EPOUSE)
            if epouse is not None:
                epouse_node = process_role(epouse, ids_to_nodes)

                pere = epouse.find(PERE)
                if pere is not None:
                    pere_epouse_node = process_role(pere, ids_to_nodes)

                mere = epouse.find(MERE)
                if mere is not None:
                    mere_epouse_node = process_role(mere, ids_to_nodes)

            # TEMOINS
            temoins = acte.find_all(TEMOIN)
            temoins_nodes = []
            if temoins is not None:
                for temoin in temoins:
                    temoin_node = process_role(temoin, ids_to_nodes)
                    temoins_nodes.append(temoin_node)

            if epoux_node or epouse_node:
                count += 1
                acte_node = Node(ACT, id=acte_id, date=date_txt)
                # graph.create(acte_node)

                if epoux_node:
                    # graph.create(epoux_node)
                    graph.create(Relationship(epoux_node,
                                              MENTIONED_AS_HUSBAND,
                                              acte_node))
                if epouse_node:
                    graph.create(Relationship(epouse_node,
                                              MENTIONED_AS_WIFE,
                                              acte_node))

                if pere_epoux_node:
                    graph.create(Relationship(pere_epoux_node,
                                              MENTIONED_AS_HUSBAND_FATHER,
                                              acte_node))
                if mere_epoux_node:
                    graph.create(Relationship(mere_epoux_node,
                                              MENTIONED_AS_HUSBAND_MOTHER,
                                              acte_node))
                if pere_epouse_node:
                    graph.create(Relationship(pere_epouse_node,
                                              MENTIONED_AS_WIFE_FATHER,
                                              acte_node))
                if mere_epouse_node:
                    graph.create(Relationship(mere_epouse_node,
                                              MENTIONED_AS_WIFE_MOTHER,
                                              acte_node))

                for temoin_node in temoins_nodes:
                    if temoin_node:
                        graph.create(Relationship(temoin_node,
                                                  MENTIONED_AS_WITNESS,
                                                  acte_node))

            if limit is not None and count == limit:
                break
        except Exception as e:
            print(acte_id)
            print(e)


def actes_fp_to_soup(actes_path):
    with open(actes_path) as fp:
        soup = BeautifulSoup(fp, "xml")
    return soup


if __name__ == "__main__":
    load_actes_to_neo4j("../../data/actes_051220.xml", limit=50)
