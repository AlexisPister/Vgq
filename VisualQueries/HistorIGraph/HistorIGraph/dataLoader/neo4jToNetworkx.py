from py2neo import Graph
# import networkx as nx
import json

import HistorIGraph.dataLoader.pipeline as pipeline


def neo4j_to_json(filename="database_out.json"):
    # graph = Graph('http://localhost:7474', username='neo4j', password='neo4j')
    graph = Graph('http://localhost:7474')

    graph.run("call apoc.export.json.all('{}')".format(filename))
    with open("/var/lib/neo4j/import/" + filename) as file:
        json_data = [json.loads(jline) for jline in file.read().splitlines()]

    neoid_to_id = get_neoid_to_id(json_data)

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
                pipeline.NODE_TYPE_KEY: entity["labels"][0],
            }
            nodes.append(node)
        elif entity["type"] == "relationship":
            if "properties" in entity:
                properties = entity["properties"]
            else:
                properties = {}

            link = {
                pipeline.EDGE_TYPE_KEY: entity["label"],
                "source": neoid_to_id[entity["start"]["id"]],
                "target": neoid_to_id[entity["end"]["id"]],
                **properties
            }
            links.append(link)

    graph_json = {
        "metadata": {
            "edgeType": pipeline.EDGE_TYPE_KEY,
            "entityType": pipeline.NODE_TYPE_KEY,
            "name": "name",
            # "entityTypes": [entity_type for entity_type in self.node_labels],
            # "attributes": [{"name": property.name, "type": property.type} for property in self.properties]
        },
        "nodes": nodes,
        "links": links
    }
    return graph_json


def get_neoid_to_id(json_data):
    map = {}
    for entity in json_data:
        if entity["type"] == "node":
            map[entity["id"]] = entity["properties"]["id"]
    return map


def json_to_nxGraph(json_data):
    from networkx.readwrite import json_graph
    json_data = {k: v for k, v in json_data.items() if k in ["nodes", "links"]}
    G = json_graph.node_link_graph(json_data, directed=True, multigraph=True)
    return G


if __name__ == "__main__":
    JSON = neo4j_to_json()
    G = json_to_nxGraph(JSON)
