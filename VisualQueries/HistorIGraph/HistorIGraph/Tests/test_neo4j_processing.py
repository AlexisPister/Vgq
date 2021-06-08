from HistorIGraph.HistorIGraph.neo4j_processing import neo4j_database_to_json
from HistorIGraph.HistorIGraph.Neo4jConnector import Neo4jConnector

def test_neo4j_database_to_json(graph_neo4j):
    connector = Neo4jConnector(graph_neo4j)
    neo4j_database_to_json(connector)
    assert True

def test_neo4jConnector(graph_neo4j):
    connector = Neo4jConnector(graph_neo4j)
    connector.find_node_labels()
    print(connector.node_labels)

    properties = connector.find_properties()
    print(properties)

    database_json = connector.to_json()
    print(database_json)
