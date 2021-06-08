# Visual Graph Query


## Installation

The installation is meant to be used on a modern Ubuntu system.

**Note:** We recommend the use of a python virtual env manager like 
[conda](https://conda.io/docs/user-guide/install/index.html) or
[miniconda](https://docs.conda.io/en/latest/miniconda.html).

```
git clone https://gitlab.inria.fr/apister/visual-graph-query.git
cd visual-graph-query
conda env create -f env.yml
conda activate VisualQueries
```

### Install Neo4J

See https://debian.neo4j.com/ for installing neo4j on an Ubuntu system. To summarize:

```
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable latest' | sudo tee /etc/apt/sources.list.d/neo4j.list
sudo apt-get update
```

Then, install a password: 


```
bin/cypher-shell -d system
ALTER USER neo4j SET PASSWORD 'neo4j`;
:exit
```

Then, install the `apoc` plugin by moving its jar file from the `labs` directory to the `plugings` directory:

```
sudo mv /var/lib/neo4j/labs/apoc-4* /var/lib/neo4j/plugins
```

Add the following lines to `/etc/neo4j/neo4j.conf`:

```
dbms.security.procedures.unrestricted=apoc.*
apoc.export.file.enabled=true
apoc.import.file.enabled=true
apoc.trigger.enabled=true
apoc.ttl.enabled=true
apoc.uuid.enabled=true
```

Restart the neo4j server with `sudo neo4j restart`. Beware, after installing neo4j, the server might not restart properly, you will have to kill it manually with `sudo kill <proc>` with the right process number, and then restart it with `sudo start neo4j`

## Preparing the dataset

Execute the pipeline in the `dataLoader` directory:

```
cd dataLoader
python pipeline.py
```

This should execute without error. The database is now loaded in neo4j with the layout computed.

## Starting the backend

