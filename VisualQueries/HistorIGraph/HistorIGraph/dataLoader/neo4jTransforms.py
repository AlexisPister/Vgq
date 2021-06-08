import HistorIGraph.dataLoader.neo4jLoader as neo4jLoader


def neo4j_transforms(graph):
    set_sex(graph)


def set_sex(graph):
    query_males = f"""
        MATCH (n:{neo4jLoader.PERSON})-[r]->(acte)
        WHERE r:{neo4jLoader.MENTIONED_AS_HUSBAND} OR r:{neo4jLoader.MENTIONED_AS_HUSBAND_FATHER} OR r
        :{neo4jLoader.MENTIONED_AS_WIFE_FATHER}
        SET n.sex = 'male' 
    """

    query_females = f"""
        MATCH (n:{neo4jLoader.PERSON})-[r]->(acte)
        WHERE r:{neo4jLoader.MENTIONED_AS_WIFE} OR r:{neo4jLoader.MENTIONED_AS_WIFE_MOTHER} OR r
        :{neo4jLoader.MENTIONED_AS_HUSBAND_MOTHER}
        SET n.sex = 'female' 
    """

    graph.run(query_males)
    graph.run(query_females)
