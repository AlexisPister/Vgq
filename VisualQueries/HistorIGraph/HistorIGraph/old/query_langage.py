import copy

from textx import metamodel_from_str, get_children_of_type
import networkx as nx

import HistorIGraph

grammar = """
    Graph: statements*=Statement;
    Statement: Path | Constraint | FunctionDeclaration | FunctionCall;
    Path: nodesLists=Nodes (links=Link nodesLists=Nodes)+;
    NodeExpr: id=Node ("[" Attribute Operator AttributeExpr"]")?;
    Link: '-' (typeExpr=LinkAttribute)? '-';
    
    Expr: Constraint (EnsembleOperation Constraint)*;
    
    Or: op=And ('or' op=And)*;
    And: op=Not ('and' op=Not)*;
    Not: _not?='not' op=Constraint;
    
    Constraint: op=SingleConstraint | "(" op=Or ")";
    // MultiConstraint: constraints=SingleConstraint (EnsembleOperation constraints=SingleConstraint)*;
    SingleConstraint: left=NodeAttribute operator=Operator right=AttributeExpr;
    
    AttributeExpr: NodeAttribute | NUMBER | STRING;
    NodeAttribute: node=Node "." attribute=Attribute;
    
    LinkAttribute: types=Attribute ("OR" types=Attribute)*;
    EnsembleOperation: "or" | "and";
    Operator: ">" | "<" | "<=" | ">=" | "=";
    
    FunctionDeclaration: "Function " name=ID "(" parameters=ID ("," parameters=ID)* ") =" content=Path;
    FunctionCall: name=ID "(" args=ID ("," args=ID)* ")";
    
    Nodes: nodes=Node (","nodes=Node)*;
    Node: ID_;
    Attribute: ID;
    ID_: /[a-zA-Z0-9_]+/;
"""


class Parser:
    def __init__(self, edge_types, edge_type_key="edgeTypes"):
        self.edge_types = edge_types
        self.edge_type_key = edge_type_key
        self.mm = metamodel_from_str(grammar)
        self.graph = None
        self.functions = {}
        self.constraints = []

    @staticmethod
    def get_type(obj):
        return obj.__class__.__name__

    def is_valid_edge_type(self, edge_type):
        if edge_type not in self.edge_types:
            raise Exception("edge type not recognised")

    def parse_edge_type_expr(self, expr):
        edge_types = []
        if expr is None:
            edge_types.append(self.edge_types[0])
        elif len(expr.types) == 1:
            self.is_valid_edge_type(expr.types[0])
            edge_types.append(expr.types[0])
        else:
            for type in expr.types:
                self.is_valid_edge_type(type)
                edge_types = edge_types + [type]
        return edge_types

    def parse_path(self, path):
        for i in range(len(path.nodesLists) - 1):
            edge_type_expr = path.links[i].typeExpr
            edge_type = self.parse_edge_type_expr(edge_type_expr)

            edge_key = ",".join(edge_type)

            if len(edge_type) == 1:
                edge_type = edge_type[0]

            for node in path.nodesLists[i].nodes:
                for node2 in path.nodesLists[i + 1].nodes:
                    self.graph.add_edge(node, node2, key=edge_key)
                    self.graph.edges[node, node2, edge_key][self.edge_type_key] = edge_type

            # if edge_type_expr is None:
            #     edge_type = self.edge_types[0]
            #
            # if edge_type_expr not in self.edge_types:
            #     raise Exception("edge type not recognized")
            #
            # self.graph.add_edge(path.nodes[i], path.nodes[i + 1], key=edge_type)
            # self.graph.edges[path.nodes[i], path.nodes[i + 1], edge_type][self.edge_type_key] = edge_type

    # def parse_path(self, path):
    #     for i in range(len(path.nodes) - 1):
    #         edge_type = path.links[i].type
    #
    #         if edge_type is None:
    #             edge_type = self.edge_types[0]
    #
    #         if edge_type not in self.edge_types:
    #             raise Exception("edge type not recognized")
    #
    #         self.graph.add_edge(path.nodes[i], path.nodes[i + 1], key=edge_type)
    #         self.graph.edges[path.nodes[i], path.nodes[i + 1], edge_type][self.edge_type_key] = edge_type

    def parse_operand(self, operand):
        return

    def parse_single_constraint(self, single_constraint):
        # self.constraints.append(constraint)
        node_attribute = single_constraint.left
        node = node_attribute.node
        attribute = node_attribute.attribute
        operator = single_constraint.operator

        right_expr = single_constraint.right
        return node, attribute, operator, right_expr
        # if self.get_type(right_expr) == "NodeAttribute":
        #     expr_value = NodeConstraint(right_expr.node, right_expr.attribute, None)
        # else:
        #     expr_value = right_expr

    def parse_constraint(self, constraint):
        self.constraints.append(constraint)

        # self.constraints.append(constraint)
        # node_attribute = constraint.left
        # node = node_attribute.node
        # attribute = node_attribute.attribute
        #
        # operator = constraint.operator
        #
        # right_expr = constraint.right
        # if self.get_type(right_expr) == "NodeAttribute":
        #     expr_value = NodeConstraint(right_expr.node, right_expr.attribute, None)
        # else:
        #     expr_value = right_expr
        #
        # node_constraint = {
        #     "sign": operator,
        #     "attribute": attribute
        # }
        # self.graph.graph["node_constraints"][node] = node_constraint
        # self.graph.nodes[node][attribute] = expr_value

    def parse_function_declaration(self, function_declaration):
        self.functions[function_declaration.name] = function_declaration
        # print(function_declaration.name, function_declaration.parameters)

    def instantiate_path(self, path, node_map):
        instantiated_path = copy.copy(path)
        for nodeList in instantiated_path.nodesLists:
            for i in range(len(nodeList.nodes)):
                nodeList.nodes[i] = node_map[nodeList.nodes[i]]

        return instantiated_path

    def parse_function_call(self, func_call):
        function = self.functions[func_call.name]

        if len(function.parameters) != len(func_call.args):
            raise Exception("Number of parameters not correct")

        param_to_instance = {}
        for param, arg in zip(function.parameters, func_call.args):
            param_to_instance[param] = arg

        instantiated_path = self.instantiate_path(function.content, param_to_instance)
        self.parse_path(instantiated_path)

    def script_to_graph(self, str_request):
        self.graph = nx.MultiGraph()
        self.graph.graph["node_constraints"] = {}

        model = self.mm.model_from_str(str_request)

        for statement in model.statements:
            if self.get_type(statement) == "Path":
                self.parse_path(statement)
            elif self.get_type(statement) == "Constraint":
                self.parse_constraint(statement)
            elif self.get_type(statement) == "FunctionDeclaration":
                self.parse_function_declaration(statement)
            elif self.get_type(statement) == "FunctionCall":
                self.parse_function_call(statement)

        for node in self.graph.nodes:
            self.graph.nodes[node]["id"] = node

        return self.graph, self.constraints


if __name__ == "__main__":
    model_str = """
            A -type2 OR type1- B,C,D -- E,F
            10382 -type1- 10384

            (A.x = B.x or (B.x = C.y and C.y = D.y))
            B.y = C.y or C.y = D.y

            Function f(a,b,c) = a -- b, c
            f(x,y,z)
        """

    # model_str = """
    #            Function f(a,b,c) = a -type2- b, c
    #            f(x,y,z)
    #        """

    # model_str = """
    #                A -- B -- C -- D
    #
    #                A.x = B.x OR (B.x = C.y AND B.x = C.x)
    # """

    parser = Parser(edge_types=["type1", "type2"], edge_type_key='edgeType')
    graph, constraints = parser.script_to_graph(model_str)

    print(graph.nodes.data())
    print(graph.edges.data())
    # model = mm.model_from_str(model_str)
    #
    # print(model)
    # print(model.statements)
