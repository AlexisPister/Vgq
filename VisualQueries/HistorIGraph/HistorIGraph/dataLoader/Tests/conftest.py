import py2neo
import pytest


@pytest.fixture()
def graph_neo4j():
    return py2neo.Graph()
