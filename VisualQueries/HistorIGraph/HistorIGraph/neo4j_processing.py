from py2neo import Graph, Node

import HistorIGraph

def graph_json_to_neo4j(graph_json, edge_type_key, node_type="Person"):
    graph_neo = Graph()
    graph_neo.delete_all()
    for node in graph_json["nodes"]:
        node_neo = Node(node_type, **node)
        graph_neo.create(node_neo)
    for link in graph_json["links"]:
        graph_neo.run(f"""
            MATCH (a),(b)
            WHERE a.id = {link["source"]} and b.id = {link["target"]}
            CREATE (a)-[r:{link[edge_type_key]}]->(b)
        """)


def cypher_result_to_nodes(result, attribute_return="id"):
    nodes = set()
    subgraphs = []
    for item in result:
        subgraph = []
        for node_match in list(item.values()):
            subgraph.append(node_match[attribute_return])
            nodes.add(node_match[attribute_return])
        subgraphs.append(subgraph)

    return list(nodes), subgraphs


def neo4j_database_to_json(neo4_connector):
    nodes = neo4_connector.run_cypher("MATCH (n) RETURN n")

    nodes_entry = []
    for node in nodes:
        node = node["n"]
        node_entry = {
            "id": node.identity,
            "label": list(node.labels)[0],
            **dict(node)
        }
        nodes_entry.append(node_entry)

    links = neo4_connector.run_cypher("MATCH ()-[r]-() RETURN r")
    links_entries = []
    for link in links:
        link = link['r']
        link_entry = {
            "id": link.identity,
            "edgetype": type(link).__name__,
            **dict(link)
        }
        links_entries.append(link_entry)

    return {
        "metadata": [],
        "nodes": nodes_entry,
        "links": links_entries
    }


if __name__ == "__main__":
    g = Graph()
    r = g.run("MATCH ()-[r]-() RETURN r")
    # r = g.run("MATCH (n) RETURN DISTINCT n")
    for i, l in enumerate(r):
        if i % 200 == 0:
            print(i)
