from collections import defaultdict

import networkx as nx
import json

import HistorIGraph.dataLoader.pipeline as pipeline


def dynamic_layout_transform(G, weights=True):
    for n, attrs in G.nodes.data():
        # Conversion do not work if there is a "name" attribute for nodes
        if "name" in G.nodes[n]:
            G.nodes[n]["label"] = G.nodes[n]["name"]
            del G.nodes[n]["name"]

    g_projection = projection(G)
    g_projection = set_direction(g_projection)

    ts_to_nodes = extract_time_slots(g_projection)

    g_doubled = double_layers(g_projection, ts_to_nodes, weights)
    dot_graph = nx_to_dot(g_doubled, ts_to_nodes, weights)

    dynamic_layout = dot_to_dynamic_layout(dot_graph)
    path = f"{pipeline.LAYOUT_FOLDER}/dynamic_layout.json"
    dynamic_layout.save_to_file(path)


def load_dynamic_layout():
    path = f"{pipeline.LAYOUT_FOLDER}/dynamic_layout.json"
    with open(path, "r+") as f:
        json_dynamic_layout = json.load(f)
    return json_dynamic_layout


def projection(G, node_type="MARRIAGE_ACT"):
    # TODO : it does not work for multigraphs
    G = nx.Graph(G)
    nodes_projection_set = [n for n, attrs in G.nodes.data() if attrs[pipeline.NODE_TYPE_KEY] == node_type]
    # G_projection = nx.bipartite.projected_graph(G, nodes_projection_set)
    G_projection = nx.bipartite.weighted_projected_graph(G, nodes_projection_set)

    return G_projection


def set_direction(G, time_key="date_year"):
    G_dir = nx.DiGraph()

    for u, attrs in G.nodes.data():
        G_dir.add_node(u, **attrs)

    for u, v, attrs in G.edges.data():
        if G.nodes[u][time_key] < G.nodes[v][time_key]:
            G_dir.add_edge(u, v, **attrs)
        else:
            G_dir.add_edge(v, u, **attrs)

    return G_dir


def double_layers(G, ts_to_nodes, weights=True):
    G_doubled = nx.DiGraph()

    for ts, nodes in sorted(ts_to_nodes.items()):
        all_out_edges = [(u, v, attrs) for u, v, attrs in G.out_edges.data() if u in nodes]
        all_in_edges = [(u, v, attrs) for u, v, attrs in G.out_edges.data() if v in nodes]

        # all_out_edges = set()
        # all_in_edges = set()
        #
        # for n in nodes:
        #     out_edges = G.out_edges(n)
        #     in_edges = G.in_edges(n)
        #     # print(out_edges)
        #
        #     [all_in_edges.add(edge) for edge in in_edges]
        #     [all_out_edges.add(edge) for edge in out_edges]

        for u in nodes:
            G_doubled.add_edge(f"{u}_before", f"{u}_after")

        for edge in all_out_edges:
            u = edge[0]
            v = edge[1]
            weight = edge[2]["weight"]

            if weights:
                if v in nodes:
                    G_doubled.add_edge(f"{u}_before", f"{v}_after", weight=weight)
                else:
                    G_doubled.add_edge(f"{u}_after", f"{v}_before", weight=weight)
            else:
                if v in nodes:
                    G_doubled.add_edge(f"{u}_before", f"{v}_after")
                else:
                    G_doubled.add_edge(f"{u}_after", f"{v}_before")

    return G_doubled


def nx_to_dot(G, ts_to_nodes, weight):
    import pydot

    G.graph["graph"] = {
        "rankdir": 'LR',
        "splines": "false"
    }
    dot_graph = nx.nx_pydot.to_pydot(G)

    for ts, nodes in ts_to_nodes.items():
        dot_subgraph_before_rank = pydot.Subgraph(rank="same")
        dot_subgraph_after_rank = pydot.Subgraph(rank="same")

        for n in nodes:
            dot_node_before = pydot.Node(f"{n}_before", group=n)
            dot_node_after = pydot.Node(f"{n}_after", group=n)

            dot_subgraph_before_rank.add_node(dot_node_before)
            dot_subgraph_after_rank.add_node(dot_node_after)

        dot_graph.add_subgraph(dot_subgraph_before_rank)
        dot_graph.add_subgraph(dot_subgraph_after_rank)

    # Without the duplication of layers
    # for ts, nodes in ts_to_nodes.items():
    #     dot_subgraph_rank = pydot.Subgraph(rank="same")
    #     for n in nodes:
    #         dot_node = pydot.Node(n)
    #         dot_subgraph_rank.add_node(dot_node)
    #
    #     dot_graph.add_subgraph(dot_subgraph_rank)

    weight_str = 'weights' if weight else ""
    fp = f"layouts/example_{weight_str}"

    # dot_graph.write(f"{fp}.dot")
    # dot_graph.write(f"{fp}.svg", format="svg")

    return dot_graph


def dot_to_dynamic_layout(dot_graph):
    fp = f"dump.txt"
    dot_graph.write(fp, format="plain")

    dynamic_layout = DotLayoutParser(fp)
    dynamic_layout.merge_doubled_layers()

    return dynamic_layout


def extract_time_slots(G, time_key="date_year"):
    ts_to_nodes = defaultdict(set)
    for n, ts in G.nodes.data(time_key):
        ts_to_nodes[ts].add(n)
    return ts_to_nodes


class DotLayoutParser:
    def __init__(self, fp, G_init):
        self.G_init = G_init
        self.nodes = {}
        self.edges = []
        self.nodes_dedoubled = None
        self.edges_dedoubled = None

        self.json_data = None

        self.from_dot_txt(fp)

    def from_dot_txt(self, fp):
        with open(fp) as f:
            for line in f:
                line_parsed = line.split(" ")
                print(line_parsed)
                type = line_parsed[0]
                if type == "graph":
                    self.parse_graph(line_parsed)
                elif type == "node":
                    self.parse_node(line_parsed)
                elif type == "edge":
                    self.parse_edge(line_parsed)

    def parse_graph(self, line):
        self.scale = line[1]
        self.width = float(line[2])
        self.height = float(line[3])

        self.width_factor = pipeline.CANVAS_DIMS[0] / self.width
        self.height_factor = pipeline.CANVAS_DIMS[1] / self.height

    def parse_node(self, line):
        node_id = line[1]
        x = float(line[2])
        y = float(line[3])
        self.nodes[node_id] = [x, y]

    def parse_edge(self, line):
        self.edges.append((line[1], line[2], line[-2])) # source, target, solid/invis

    def scale_dimensions(self):
        for node_dims in self.nodes.values():
            node_dims[0] = int(node_dims[0] * self.width_factor)
            node_dims[1] = int(node_dims[1] * self.height_factor)

    def merge_doubled_layers(self):
        # Each node was doubled to find a good layout with dot.
        # This function is to merge those.
        self.merge_doubled_nodes()
        self.merge_doubled_edges()

    def merge_doubled_nodes(self):
        self.nodes_dedoubled = {}
        for node_id, pos in self.nodes.items():
            print(node_id, pos)
            node_id_parsed, which_layer = self.parse_node_id(node_id)

            if which_layer == "before":
                other_pos = self.nodes[node_id_parsed + "_after"]
            elif which_layer == "after":
                other_pos = self.nodes[node_id_parsed + "_before"]

            pos_updated = self.merge_positions(pos, other_pos)
            self.nodes_dedoubled[node_id_parsed] = pos_updated
        # print(self.nodes_dedoubled)
        self.nodes = self.nodes_dedoubled

    def merge_doubled_edges(self):
        self.edges_dedoubled = set()
        for edge in self.edges:
            self.edges_dedoubled.add((edge[0].rsplit("_", 1)[0], edge[1].rsplit("_", 1)[0]))
        self.edges_dedoubled = [list(edge) for edge in self.edges_dedoubled]
        # print(self.edges_dedoubled)
        self.edges = self.edges_dedoubled

    def merge_positions(self, pos1, pos2):
        pos1 = [float(pos1[0]), float(pos1[1])]
        pos2 = [float(pos2[0]), float(pos2[1])]
        return [(pos1[0] + pos2[0]) / 2, (pos1[1] + pos2[1]) / 2]

    def parse_node_id(self, node_id):
        node_id_parsed = node_id.rsplit("_", 1)
        return node_id_parsed[0], node_id_parsed[1]

    def save_to_file(self, path):
        if not self.json_data: self.to_json()

        with open(path, "w+") as f:
            json.dump(self.json_data, f, indent=4)

    def to_json(self):
        # We need the initial graph to get the node/edges attributes back
        nodes = self.process_nodes()
        edges = self.process_edges()

        # Metadata are generated from the backend
        self.json_data = {
            "nodes": nodes,
            "links": edges
        }

        return self.json_data

    def process_nodes(self):
        nodes = [{
            **self.G_init.nodes[node_id],
            "id": node_id,
            "x": pos[0],
            "y": pos[1],
        } for node_id, pos in self.nodes.items()]
        return nodes

    def process_edges(self):
        edges = [{
            **nx.Graph(self.G_init).edges[(edge[0], edge[1])], # TODO : handle Multigraphs
            "source": edge[0],
            "target": edge[1]
        } for edge in self.edges if edge[2] != "invis"]
        return edges

