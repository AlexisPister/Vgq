import HistorIGraph.dataLoader.pipeline as pipeline

N_ACTES = None

# path = "data/actes_051220.xml"
path = "data/echantillon-1757_1806-balises+ids.xml"

pipeline.pipeline(path, N_ACTES)
