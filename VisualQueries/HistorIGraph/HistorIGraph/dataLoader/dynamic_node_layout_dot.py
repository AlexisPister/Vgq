from collections import defaultdict

import networkx as nx
import json
import pydot

import HistorIGraph.dataLoader.pipeline as pipeline
from HistorIGraph.dataLoader.dynamicLayoutDot import DotLayoutParser


def projection(G, node_type="MARRIAGE_ACT"):
    # TODO : it does not work for multigraphs
    G = nx.Graph(G)
    nodes_projection_set = [n for n, attrs in G.nodes.data() if attrs[pipeline.NODE_TYPE_KEY] == node_type]
    # G_projection = nx.bipartite.projected_graph(G, nodes_projection_set)
    G_projection = nx.bipartite.weighted_projected_graph(G, nodes_projection_set)

    return G_projection


class DynamicNodeLayout:
    def __init__(self, G_static, person_node_type, document_node_type, person_lines=True):
        self.G_static = G_static
        self.person_node_type = person_node_type
        self.document_node_type = document_node_type

        self.ts_to_documents = {}
        self.person_to_ts = {}

        self.nodesep = 0.15 #default

        self.options = {
            "graph_type": "digraph",
            "rankdir": "LR",
            # "splines": "false",
            # "newrank": "true"
            "nodesep": self.nodesep
        }

        self.pydot_graph = pydot.Dot(**self.options)

        self.person_lines = person_lines
        self.time_key = "date_year"

        self.json = None

    def build(self):
        self.build_nodes_per_ts()
        double_ts = False

        if self.person_lines:
            double_ts = True
            self.build_person_lines()

        self.build_ts_nodes(double_ts)

    def build_nodes_per_ts(self):
        if self.person_lines:
            self.build_nodes_per_ts_person_lines()
        else:
            # self.build_invisible_edges()
            self.build_nodes_per_ts_no_person_lines()

    def build_ts_nodes(self, double=False):
        times = sorted(list(self.ts_to_documents.keys()))

        if double:
            for i in range(len(times[:-1])):
                edge_ts = pydot.Edge(f"{times[i]}_before", f"{times[i]}_after")
                edge_between_ts = pydot.Edge(f"{times[i]}_after", f"{times[i + 1]}_before")
                self.pydot_graph.add_edge(edge_ts)
                self.pydot_graph.add_edge(edge_between_ts)
        else:
            for i in range(len(times[:-1])):
                edge_between_ts = pydot.Edge(times[i], times[i + 1])
                self.pydot_graph.add_edge(edge_between_ts)


    def build_invisible_edges(self):
        G_projected = projection(self.G_static, self.document_node_type)
        G_projected.graph["graph"] = self.options
        # G_projected = self.add_time_to_node_labels(G_projected)

        if "graph_type" in self.options:
            del self.options["graph_type"]

        self.pydot_graph = nx.nx_pydot.to_pydot(G_projected)
        for edge in self.pydot_graph.get_edge_list():
            edge.set_style("invis")

    def add_time_to_node_labels(self, G):
        mapping = {n: f"{n}_{attrs[self.time_key]}" if self.time_key in attrs else n for n, attrs in G.nodes.data()}
        G = nx.relabel_nodes(G, mapping)
        return G

    def build_nodes_per_ts_person_lines(self):
        for ts, documents in self.ts_to_documents.items():
            pydot_subgraph_ts_documents = pydot.Subgraph(rank="same")
            pydot_subgraph_ts_persons = pydot.Subgraph(rank="same")

            pydot_ts_node_before = pydot.Node(f"{ts}_before")
            pydot_ts_node_after = pydot.Node(f"{ts}_after")

            pydot_subgraph_ts_documents.add_node(pydot_ts_node_before)
            pydot_subgraph_ts_persons.add_node(pydot_ts_node_after)

            for document in documents:
                document_time_id = f"{document}_{ts}"
                pydot_document_node = pydot.Node(document_time_id, shape="rect")
                pydot_subgraph_ts_documents.add_node(pydot_document_node)

                person_nodes = [edge[0] for edge in self.G_static.in_edges(document)]
                for person in person_nodes:
                    person_time_id = f"{person}_{ts}"

                    pydot_person_node = pydot.Node(person_time_id, group=person)
                    pydot_subgraph_ts_persons.add_node(pydot_person_node)

                    document_to_node = pydot.Edge(document_time_id, person_time_id)
                    self.pydot_graph.add_edge(document_to_node)

            self.pydot_graph.add_subgraph(pydot_subgraph_ts_documents)
            self.pydot_graph.add_subgraph(pydot_subgraph_ts_persons)

    # TODO : layout with one node per person. Does not work yet with DOT. It would probably need invisible nodes
    def build_nodes_per_ts_no_person_lines(self):
        for ts, documents in self.ts_to_documents.items():
            pydot_subgraph_ts_documents = pydot.Subgraph(rank="same")
            pydot_ts_node = pydot.Node(ts)
            pydot_subgraph_ts_documents.add_node(pydot_ts_node)

            for document in documents:
                document_time_id = f"{document}"
                pydot_document_node = pydot.Node(document_time_id)
                pydot_subgraph_ts_documents.add_node(pydot_document_node)

                person_nodes = [edge[0] for edge in self.G_static.in_edges(document)]
                for person in person_nodes:
                    person_time_id = f"{person}"

                    pydot_person_node = pydot.Node(person_time_id)
                    self.pydot_graph.add_node(pydot_person_node)

                    document_to_node = pydot.Edge(document_time_id, person_time_id, dir="none")
                    self.pydot_graph.add_edge(document_to_node)

            self.pydot_graph.add_subgraph(pydot_subgraph_ts_documents)

    def build_person_lines(self):
        # Only the edges need to be explicit
        for person, times in self.person_to_ts.items():
            times = sorted(list(times))
            for i, ts in enumerate(times[:-1]):
                dot_node_id_source = f"{person}_{times[i]}"
                dot_node_id_target = f"{person}_{times[i + 1]}"
                pydot_edge = pydot.Edge(dot_node_id_source, dot_node_id_target)
                self.pydot_graph.add_edge(pydot_edge)

        # documents_ids = [n for n, attrs in self.G_static.nodes.data() if attrs[pipeline.NODE_TYPE_KEY] == self.document_node_type]
        # print(documents)
        #
        # for document_id in documents_ids:
        #     time = self.G_static.nodes(document_id)[time_key]
        #
        #     document_time_id = f"{document_id}_{time}"
        #     pydot_node = pydot.Node(document_time_id)
        #
        #     for person_id in self.G_static[document_id]:
        #         person_time_id = f"{person_id}_{time}"
        #         pydot_person_node = pydot.Node(person_time_id)

    def extract_time_slots(self):
        self.ts_to_documents = defaultdict(set)
        for n, attrs in self.G_static.nodes.data():
            print(n, attrs)
            if attrs[pipeline.NODE_TYPE_KEY] == self.document_node_type:
                ts = attrs[self.time_key]
                self.ts_to_documents[ts].add(n)

    def extract_person_to_times(self):
        self.person_to_ts = defaultdict(set)
        for n, attrs in self.G_static.nodes.data():
            if attrs[pipeline.NODE_TYPE_KEY] == self.document_node_type:
                ts = attrs[self.time_key]
                person_nodes = [edge[0] for edge in self.G_static.in_edges(n)]
                for person in person_nodes:
                    self.person_to_ts[person].add(ts)

    def dump_dot(self):
        lines = "lines" if self.person_lines else "nolines"
        fp = f"layouts/new_dot_layout_{lines}_{len(self.G_static)}_ns{self.nodesep}"
        self.pydot_graph.write(f"{fp}.dot")
        self.pydot_graph.write(f"{fp}.svg", format="svg")

    def run(self):
        self.extract_time_slots()
        self.extract_person_to_times()
        self.build()
        self.dump_dot()

    def to_json(self):
        path = "dump.txt"
        self.pydot_to_txt(path)
        dot_parser = DotLayoutParser(path, self.G_static)
        dot_parser.scale_dimensions()
        self.json = dot_parser.to_json()
        self.write_json()

    def pydot_to_txt(self, path=f"dump.txt"):
        self.pydot_graph.write(path, format="plain")

    def write_json(self):
        with open(pipeline.DYNAMIC_LAYOUT_PATH, "w+") as f:
            json.dump(self.json, f, indent=4)





def dynamic_node_layout_transform(G, person_lines=True):
    dynamic_node_layout = DynamicNodeLayout(G, "PERSON", "MARRIAGE_ACT", person_lines=person_lines)
    dynamic_node_layout.run()
    dynamic_node_layout.to_json()
