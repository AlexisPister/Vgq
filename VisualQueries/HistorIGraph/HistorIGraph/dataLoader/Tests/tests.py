from HistorIGraph.HistorIGraph.dataLoader import networkx_transform as nxt
from HistorIGraph.HistorIGraph.dataLoader import neo4jToNetworkx


def test_nx_transforms():
    json_data = neo4jToNetworkx.neo4j_to_json()
    G = neo4jToNetworkx.json_to_nxGraph(json_data)

    nxt.add_date_year(G)