from py2neo import Graph

from HistorIGraph.dataLoader.neo4jLoader import load_actes_to_neo4j
import HistorIGraph.dataLoader.neo4jToNetworkx as neo4jToNetworkx
from HistorIGraph.dataLoader.networkx_transform import networkX_transforms, nx_to_neo4j
from HistorIGraph.dataLoader.neo4jTransforms import neo4j_transforms

EDGE_TYPE_KEY = "edgeType"
NODE_TYPE_KEY = "nodeType"

LAYOUT_FOLDER = "layouts"
DYNAMIC_LAYOUT_PATH = LAYOUT_FOLDER + "/dynamic_layout.json"

CANVAS_DIMS = [1200, 600]


def pipeline(path, N_actes=None):
    # graph = Graph('http://localhost:7474', username='neo4j', password='neo4j')
    graph = Graph('http://localhost:7474')
    graph.delete_all()

    print("loading xml in neo4j")
    load_actes_to_neo4j(path, N_actes)

    print("converting neo4j to networkx")
    json_data = neo4jToNetworkx.neo4j_to_json()
    G = neo4jToNetworkx.json_to_nxGraph(json_data)
    print(G.graph, G.nodes.data())

    print("networkx transforms")
    networkX_transforms(G)

    print("load graph back in neo4j")
    nx_to_neo4j(G, graph)

    print("neo4j transforms")
    neo4j_transforms(graph)
