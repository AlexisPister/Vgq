class cypherQueryResult {
    constructor(queryResult, mainGraphVis) {
        this.queryResult = queryResult;
        this.mainGraphVis = mainGraphVis;

        this.queryEntitiesIds = Object.keys(this.queryResult[0]);
        this.queryNodesIds = null;
        this.findQueryNodesIds();

        this.nNodes = this.queryNodesIds.length;

        this.tableSelection = d3.select("#match_query-result-table");
    }

    findQueryNodesIds() {
        this.queryNodesIds = [];
        Object.entries(this.queryResult[0]).forEach((d) => {
            const [entityId, match] = d;
            if (typeof match === "object") {
                this.queryNodesIds.push(entityId);
            }
        })
    }

    createTableHeader() {
        this.rowQueryNodes = this.tableSelection
            .append("div")
            .classed("row row-match_query", "true")

        // overall subgraph column header
        this.rowQueryNodes
                .append("div")
                .classed("one wide column", true)

        this.queryNodesIds.forEach((queryNodeId) => {
            this.rowQueryNodes
                .append("div")
                .classed("column cell-match_query", true)
                .html(queryNodeId)
        });
    }

    createTable() {
        this.tableSelection.node().innerHTML = "";
        // this.tableSelection.classed(numWords(this.nNodes), true);
        this.tableSelection.node().className = "ui " + numWords(this.nNodes + 1) + " column center aligned padded grid";
        this.createTableHeader();

        this.queryResult.forEach((match, i) => {
            let matchRow = this.tableSelection
            .append("div")
            .classed("row row-match_query", "true");

            // overall subgraph column
            let cell = matchRow
                .append("div")
                .classed("one wide column cell-match_query", true)

            let nodesIds = [];
            let linksIds = [];
            this.queryEntitiesIds.forEach((queryEntityId) => {
                if (this.queryNodesIds.includes(queryEntityId)) {
                    let nodeMatch = match[queryEntityId]
                    let name = nodeMatch["name"];
                    let id = nodeMatch["id"];
                    nodesIds.push(id);

                    matchRow
                        .append("div")
                        .classed("column cell-match_query", true)
                        .html(name)
                } else {
                    linksIds.push(match[queryEntityId]);
                }
            })

            cell.on("mouseover", () => {
                console.log("hey");
                this.mainGraphVis.isStrongHighlight = true;
                this.mainGraphVis.highlightNodes(nodesIds, true);
                this.mainGraphVis.highlightLinks(linksIds, true);
            });
            cell.on("mouseout", () => {
                console.log("off");
                this.mainGraphVis.isStrongHighlight = false;
                this.mainGraphVis.highlightNodes([], true);
                this.mainGraphVis.highlightLinks([], true);
            })

        })
    }
}

export {cypherQueryResult};