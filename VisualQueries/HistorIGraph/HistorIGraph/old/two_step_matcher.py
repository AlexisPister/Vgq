from itertools import tee

from HistorIGraph.old.graph_matching import Matcher


class TwoStepMatcher(Matcher):
    def node_match(self, n1, n2):
        return True

    def parse_nodeAttribute(self, node_attr, candidate_graph_match):
        big_graph_node = [n1 for n1, n2 in candidate_graph_match.items() if n2 == node_attr.node][0]
        value = self.graph.nodes[big_graph_node][node_attr.attribute]
        return value

    def single_constraint_to_bool(self, single_constraint, candidate_graph_match):
        left = single_constraint.left
        left_value = self.parse_nodeAttribute(left, candidate_graph_match)

        operator = single_constraint.operator

        right = single_constraint.right
        print(type(right))
        if type(right) == "NodeAttribute":
            right_value = self.parse_nodeAttribute(right, candidate_graph_match)
        else:
            right_value = right

        print(left_value, operator, right_value)

        # self.graph.nodes[]

    def constraint_to_bool(self, constraint):
        if query_langage.Parser.get_type(constraint) == "SingleConstraint":
            return
        elif query_langage.Parser.get_type(constraint) in ["Or", "And", "Not"]:
            return constraint.op[0] or constraint.op[1]


            # for operand in constraint.op:
            #     return

    # TODO
    def apply_constraints(self, constraints):
        for graph_candidate_match in tee(self.subgraphs_iter):
            for constraint in constraints:
                self.constraint_to_bool(constraint)

    def run(self, graph, constraints, subgraph, edge_type_key, induced_graph=False):
        self.match_graphs(graph, subgraph, edge_type_key, induced_graph)
        self.apply_constraints(constraints)

        return self.matched_subgraphs_to_json()


if __name__ == "__main__":
    t = TwoStepMatcher()
    print(t.edge_type_key)
