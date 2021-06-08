import sys

import networkx as nx
from flask import Flask, jsonify, request
from flask_cors import CORS
from py2neo import Graph


import HistorIGraph.neo4j_processing as neo4j_processing
from HistorIGraph.Neo4jConnector import Neo4jConnector
from HistorIGraph.dataLoader.dynamicLayoutDot import load_dynamic_layout

# sys.stdout = open('/home/alexis/output_apache2_flask.logs', 'w')
# print("VisualQueries begin")
# sys.stdout = sys.__stdout__ # Reset to the standard output
# print("SYS ", sys.path)

# JDF: I needed to change the parameters to Graph()
# graph_neo = Graph('http://localhost:7474', username='neo4j', password='neo4j')
graph_neo = Graph('http://localhost:7474')
neo4j_connector = Neo4jConnector(graph_neo)

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False
CORS(app)

current_request = [""]


@app.route("/", methods=["GET"])
def base():
    message = {"message": "endpoint"}
    return jsonify(message), 200


# @app.errorhandler(Exception)
# def server_error(err):
#     print("SERVER ERROR", str(err))
#     app.logger.exception(err)
#     return str(err), 500


@app.route("/loadData", methods=["POST"])
def load_data_neo4j():
    data = request.json
    main_graph_json = data["mainGraph"]
    edge_type_key = data["edgeTypeKey"]

    neo4j_processing.graph_json_to_neo4j(main_graph_json,
                                         edge_type_key=edge_type_key)
    return {}, 200


@app.route("/getDatabaseJson", methods=["GET"])
def ask_data_neo4j():
    database_json = neo4j_connector.to_json()

    properties = neo4j_connector.properties
    properties_json = [prop.to_json() for prop in properties]

    data = {
        "data": database_json,
        "properties": properties_json
    }

    return jsonify(data)


@app.route("/getProperties", methods=["GET"])
def ask_properties_neo4j():
    properties = neo4j_connector.properties
    properties_json = [prop.to_json() for prop in properties]
    return jsonify(properties_json)


def parse_query_request(flask_request):
    json_request = flask_request.json
    main_graph_json = json_request["mainGraph"]
    query = json_request["scriptRequest"]
    edge_types = json_request["edgeTypes"]
    edge_type_key = json_request["edgeTypeKey"]
    return query, main_graph_json, edge_types, edge_type_key


@app.route("/cypherMatch", methods=["POST"])
def cypher_to_match():
    query, main_graph_json, edge_types, edge_type_key = parse_query_request(request)
    current_request[0] = query

    print("Run Query ", query)
    neo4j_connector.match_query(query)
    matching_list, matched_nodes, matched_links = neo4j_connector.process_query_result()

    output = {
        "subgraph": None,
        "matching": {
            "matching_list": matching_list,
            "matched_links": matched_links,
            "matched_nodes": matched_nodes
        }
    }

    # Abort request if more recent one
    if current_request[0] != query:
        return "", 400

    print("Sending Result")
    # print(output)
    return jsonify(output)


@app.route("/cypher", methods=["POST"])
def cypher_request():
    cypher = request.data
    request_result = neo4j_connector.run_cypher(cypher)
    return jsonify(request_result)


@app.route("/getDynamicLayout", methods=["GET"])
def get_dynamic_layout():
    dynamic_layout_json = load_dynamic_layout()
    dynamic_layout_json["metadata"] = neo4j_connector.generate_metadata()
    return jsonify(dynamic_layout_json)


@app.route("/getAdjacency", methods=["POST"])
def get_adjacency():
    graph_json = request.json["graph"]
    print(graph_json)
    graph_json = {"nodes": graph_json["nodes"], "links": graph_json["links"]}
    print(graph_json)
    graph = nx.node_link_graph(graph_json, True, True)
    adjacency = nx.adjacency_data(graph)
    print(adjacency)
    return jsonify(adjacency)



debug = True
if __name__ == "__main__":
    if len(sys.argv) > 1:
        app.run(debug=debug, port=sys.argv[1])
    else:
        app.run(debug=debug, port=10090)
