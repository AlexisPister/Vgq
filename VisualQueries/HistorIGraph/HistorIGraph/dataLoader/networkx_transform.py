from collections import defaultdict

import networkx as nx
from py2neo import Node
import json
import os
import numpy as np

import HistorIGraph.dataLoader.pipeline as pipeline
import HistorIGraph.dataLoader.neo4jLoader as neo4jLoader
import HistorIGraph.dataLoader.neo4jToNetworkx as neo4jToNetworkx
import HistorIGraph.dataLoader.dynamicLayoutDot as dynamicLayoutDot
import HistorIGraph.dataLoader.dynamic_node_layout_dot as dynamic_node_layout_dot

# To link with front end
WIDTH = 1000
HEIGHT = 600


class NumpyEncoder(json.JSONEncoder):
    """ Special json encoder for numpy types """
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)


def networkX_transforms(G):
    add_date_year(G)
    # compute_layout(G, "spring", scale=WIDTH, center=[WIDTH / 2, HEIGHT / 2])
    # compute_layout(G, "spectral", scale=WIDTH, center=[WIDTH / 2, HEIGHT / 2])
    # compute_layout(G, "kamada", scale=WIDTH, center=[WIDTH / 2, HEIGHT / 2])

    # dynamicLayoutDot.dynamic_layout_transform(G, True)
    # dynamic_node_layout_dot.dynamic_node_layout_transform(G, person_lines=True)
    # add_x_time_constraint(G, 4000)


def compute_layout(G, alg, **kwargs):
    path = f"layout_{alg}_{len(G.nodes)}.json"

    if alg == "spring":
        if os.path.exists(path):
            with open(path, 'r') as f:
                positions = json.loads(f.read())
        else:
            positions = nx.spring_layout(G, **kwargs)
    elif alg == "kamada":
        if os.path.exists(path):
            with open(path, 'r') as f:
                positions = json.loads(f.read())
        else:
            positions = nx.kamada_kawai_layout(G, **kwargs)
    elif alg == "spectral":
        if os.path.exists(path):
            with open(path, 'r') as f:
                positions = json.loads(f.read())
        else:
            positions = nx.spectral_layout(G, **kwargs)

    for node_id, pos in positions.items():
        G.nodes[node_id]["x"] = pos[0]
        G.nodes[node_id]["y"] = pos[1]

    with open(path, 'w+') as f:
        f.write(json.dumps(positions, cls=NumpyEncoder))

    print("layout computation finished")


def add_x_time_constraint(G, width):
    ts_to_nodes = extract_time_slots(G)
    width_per_ts = width / len(ts_to_nodes)

    for i, (ts, nodes) in enumerate(sorted(ts_to_nodes.items())):
        for node in nodes:
            G.nodes[node]["fx"] = i * width_per_ts


def extract_time_slots(G, entity_type="MARRIAGE_ACT", time_key="date_year"):
    ts_to_nodes = defaultdict(set)
    for n, attrs in G.nodes.data():
        if attrs[pipeline.NODE_TYPE_KEY] == entity_type:
            ts = attrs[time_key]
            ts_to_nodes[ts].add(n)
    return ts_to_nodes


def add_date_year(G):
    for n, attrs in G.nodes.data():
        if attrs[pipeline.NODE_TYPE_KEY] == neo4jLoader.ACT:
            date = attrs[neo4jLoader.DATE]
            try:
                if len(date) == 4:
                    date_year = int(date)
                else:
                    date_year = int(date[-4:])
            except ValueError:
                date_year = None

            G.nodes[n]['date_year'] = date_year


def nx_to_neo4j(G, neo4j_graph):
    graph_json = nx.node_link_data(G)
    graph_json_to_neo4j(graph_json, neo4j_graph)


def graph_json_to_neo4j(graph_json, neo4j_graph):
    neo4j_graph.delete_all()
    for node in graph_json["nodes"]:
        node_neo = Node(node[pipeline.NODE_TYPE_KEY], **node)
        neo4j_graph.create(node_neo)
    for link in graph_json["links"]:
        source = link['source'] if type(link['source']) is int else f"'{link['source']}'"
        target = link['target'] if type(link['target']) is int else f"'{link['target']}'"

        cypher = f"""
            MATCH (a),(b)
            WHERE a.id = {source} and b.id = {target}
            CREATE (a)-[r:{link[pipeline.EDGE_TYPE_KEY]}]->(b)
        """
        neo4j_graph.run(cypher)


if __name__ == "__main__":
    # print("converting neo4j to networkx")
    json_data = neo4jToNetworkx.neo4j_to_json()
    G = neo4jToNetworkx.json_to_nxGraph(json_data)

    # print("networkx transforms")
    dynamic_node_layout_dot.dynamic_node_layout_transform(G, person_lines=True)
    # networkX_transforms(G)
