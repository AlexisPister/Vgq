import py2neo
import json

import dataLoader.pipeline
import pipeline


class Property:
    def __init__(self, name, property_type, node_type):
        self.name = name
        self.type = property_type
        self.node_type = node_type
        self.domain = None

    def to_json(self):
        return {
            "name": self.name,
            "type": self.type,
            "entity_type": self.node_type,
            "domain": self.domain
        }


class Neo4jConnector:
    def __init__(self, neo_graph):
        self.neo_graph = neo_graph
        self.query_result = None
        self.json_name = None
        self.node_labels = None
        self.relation_types = None
        self.properties = None

        self.neoid_to_id = None

        self.find_node_labels()
        self.find_relationship_types()
        self.find_properties()
        self.compute_properties_domain()

    def find_node_labels(self):
        labels = self.run_cypher("""CALL db.labels()""")
        self.node_labels = [label["label"] for label in labels]

    def find_relationship_types(self):
        types = self.run_cypher("""CALL db.relationshipTypes""")
        self.relation_types = [r["relationshipType"] for r in types]

    def find_properties(self):
        properties = self.run_cypher("""
            MATCH (p)
            WITH distinct p, keys(p) as pKeys
            UNWIND pKeys as Key
            RETURN distinct labels(p) as labels, Key, apoc.map.get(apoc.meta.cypher.types(p), Key, [true]) as type
        """)
        self.properties = [Property(property['Key'], property['type'], property["labels"][0]) for property in
                           properties]

    def compute_properties_domain(self):
        for property in self.properties:
            self.compute_property_domain(property)

    def compute_property_domain(self, property):
        # TODO : Split between node and relationships properties
        domain_result = self.run_cypher(f"""
            MATCH (n) where EXISTS(n.{property.name}) return n.{property.name}
            UNION MATCH ()-[n]-() where EXISTS(n.{property.name}) return n.{property.name}
        """)
        domain_result = set([v[f"n.{property.name}"] for v in domain_result])
        print(property.name, property.type)
        if property.type in ["INTEGER", "FLOAT"]:
            property.domain = [min(domain_result), max(domain_result)]
            print(property.domain)
        elif property.type == "STRING":
            property.domain = list(domain_result)


    def run_cypher(self, cypher):
        result = self.neo_graph.run(cypher)
        result = result.data()
        return result

    def match_query(self, query):
        self.query_result = self.neo_graph.run(query)

    def to_json_file(self, filename="database_out.json"):
        self.json_name = filename
        self.neo_graph.run("call apoc.export.json.all('{}')".format(filename))

    def to_json(self):
        self.to_json_file()
        with open("/var/lib/neo4j/import/" + self.json_name) as file:
            json_data = [json.loads(jline) for jline in file.read().splitlines()]

        self.get_neoid_to_id(json_data)

        nodes = []
        links = []
        for entity in json_data:
            if entity["type"] == "node":
                if "properties" in entity:
                    properties = entity["properties"]
                else:
                    properties = {}
                node = {
                    **properties,
                    # "id": entity["id"],
                    "entity_type": entity["labels"][0],
                }
                nodes.append(node)
            elif entity["type"] == "relationship":
                if "properties" in entity:
                    properties = entity["properties"]
                else:
                    properties = {}

                link = {
                    "edgeType": entity["label"],
                    # "source": entity["start"]["id"],
                    # "target": entity["end"]["id"],
                    "source": self.neoid_to_id[entity["start"]["id"]],
                    "target": self.neoid_to_id[entity["end"]["id"]],
                    **properties
                }
                links.append(link)

        graph_json = {
            "metadata": self.generate_metadata(),
            "nodes": nodes,
            "links": links
        }
        return graph_json

    def generate_metadata(self):
        return {
            "edgeType": "edgeType",
            "nodeType": pipeline.NODE_TYPE_KEY,
            "name": "name",
            "entityTypes": [entity_type for entity_type in self.node_labels],
            "attributes": [{"name": property.name, "type": property.type} for property in self.properties]
        }

    def get_neoid_to_id(self, json_data):
        self.neoid_to_id = {}
        for entity in json_data:
            if entity["type"] == "node":
                self.neoid_to_id[entity["id"]] = entity["properties"]["id"]

    def process_query_result(self):
        print("Process Query Results")
        query_result_list = self.query_result.data()

        nodes_ids = set()
        links_ids = set()
        subgraphs_entities_ids = []
        for subgraph in reversed(query_result_list):

            # to remove automorphisms
            subgraph_entities_ids = self.subgraph_entities_id(subgraph)
            if subgraph_entities_ids in subgraphs_entities_ids:
                query_result_list.remove(subgraph)
                continue
            subgraphs_entities_ids.append(subgraph_entities_ids)

            for query_entity_id, matched_entity in subgraph.items():
                if type(matched_entity) == py2neo.data.Node:
                    # node_id = str(matched_entity.identity)
                    node_id = str(matched_entity["id"])
                    nodes_ids.add(node_id)

                    subgraph[query_entity_id] = {
                        "type": "node",
                        "labels": list(matched_entity.labels),
                        **dict(matched_entity),
                        "id": node_id
                    }

                else:
                    relation_type = type(matched_entity).__name__

                    # source_node_id = str(matched_entity.nodes[0].identity)
                    # target_node_id = str(matched_entity.nodes[1].identity)
                    source_node_id = str(self.neoid_to_id[str(matched_entity.nodes[0].identity)])
                    target_node_id = str(self.neoid_to_id[str(matched_entity.nodes[1].identity)])

                    links_ids.add((source_node_id, relation_type, target_node_id))

                    subgraph[query_entity_id] = {
                        "type": "relation",
                        "relation_type": relation_type,
                        "source": source_node_id,
                        "target": target_node_id,
                        **dict(matched_entity)
                    }

        return query_result_list, list(nodes_ids), list(links_ids)

    def subgraph_entities_id(self, subgraph):
        subgraph_entities_ids = set()
        for query_entity_id, matched_entity in subgraph.items():
            if type(matched_entity) == py2neo.data.Node:
                subgraph_entities_ids.add(matched_entity["id"])
            else:
                link_id = str(matched_entity.nodes[0].identity) + "-" + str(matched_entity.nodes[1].identity)
                subgraph_entities_ids.add(link_id)
        return subgraph_entities_ids




