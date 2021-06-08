import sys

import networkx as nx
from networkx.algorithms.isomorphism import GraphMatcher


class Matcher:
    def __init__(self):
        self.edge_type_key = None
        self.graph = None
        self.subgraph = None
        self.subgraphs_iter = None

    def node_match(self, n1, n2):
        if n2["id"] in self.subgraph.graph["node_constraints"].keys():
            constraint = self.subgraph.graph["node_constraints"][n2["id"]]
            sign = constraint["sign"]
            attribute = constraint["attribute"]

            if sign == "=":
                return n1[attribute] == n2[attribute]
            elif sign == "<=":
                return n1[attribute] <= n2[attribute]
            elif sign == ">=":
                return n1[attribute] >= n2[attribute]
            elif sign == "<":
                return n1[attribute] < n2[attribute]
            elif sign == ">":
                return n1[attribute] > n2[attribute]
        else:
            return True

    def edge_match(self, e1, e2):
        edge_types_e2 = [set()]
        for edge in list(e2.values()):
            edge_type = edge[self.edge_type_key]

            if type(edge_type) == list:
                new_edge_types_e2 = []
                for i, etype in enumerate(edge_type):
                    for set_edge_types in edge_types_e2:
                        new_set_types = set_edge_types.copy()
                        new_set_types.add(etype)
                        new_edge_types_e2.append(set_edge_types)
                edge_types_e2 = new_edge_types_e2
            else:
                for set_edge_types in edge_types_e2:
                    set_edge_types.add(edge_type)

        edge_types_e1 = set()
        for edge in list(e1.values()):
            edge_type = edge[self.edge_type_key]
            edge_types_e1.add(edge_type)

        for possible_edge_types in edge_types_e2:
            if possible_edge_types.issubset(edge_types_e1):
                return True
        return False

    def match_graphs(self, graph, subgraph, edge_type_key, induced_graph=True):
        self.graph = graph
        self.subgraph = subgraph
        self.edge_type_key = edge_type_key

        GM = GraphMatcher(graph, subgraph, node_match=self.node_match, edge_match=self.edge_match)
        if induced_graph:
            self.subgraphs_iter = GM.subgraph_isomorphisms_iter()
        else:
            self.subgraphs_iter = GM.subgraph_monomorphisms_iter()

        # return subgraphs_iter

    def matched_subgraphs_to_json(self):
        subgraphs_found = [list(subgraph.keys()) for subgraph in self.subgraphs_iter]
        nodes_matched = {node for subgraph in subgraphs_found for node in subgraph}

        matching = {
            "subgraphs": subgraphs_found,
            "matched_nodes": list(nodes_matched),
            "N_nodes": len(nodes_matched)
        }
        return matching

    def run(self, graph, subgraph, edge_type_key, induced_graph):
        self.match_graphs(graph, subgraph, edge_type_key, induced_graph)
        return self.matched_subgraphs_to_json()
