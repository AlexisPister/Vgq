import * as d3 from 'd3';
import '../../../node_modules/codemirror/mode/cypher/cypher.js'
import "../../../node_modules/codemirror/addon/search/searchcursor.js";

import {QueryResultTable} from "./QueryResultTable.js";
import {globals} from "../globals.js";
import CypherEditor from "./CypherEditor";
import WidgetsCollection from "./Widgets/widgetsCollection";
import {QueryGraphPainter} from "./queryGraphPainter";
import AstController from "./AstController.js";
import RequestFlow from "./RequestsFlow.js";
import ProvenanceManager from "./ProvenanceManager.js";

class QueryStateManager {
    constructor(mainGraph, mainGraphVis) {
        this.mainGraph = mainGraph;
        this.mainGraphVis = mainGraphVis;
        this.mainGraphVis.scriptLang = this;

        this.initSelections();
        this.astController = new AstController(null, this.updateCypherFromAst, this.updateAstFromCypher, this.errorAst);
        this.cypherEditor = new CypherEditor(this.updateAstFromCypher, this.astController);

        this.provenance = new ProvenanceManager(this.astController, this.cypherEditor);
        this.astController.setProvenanceManager(this.provenance);

        this.queryResultTable = new QueryResultTable(this.mainGraphVis);
        this.graphPaint = new QueryGraphPainter(this.paintSvg, this.mainGraph, this.mainGraphVis, this);
        this.widgetsCollection = new WidgetsCollection(this.widgetsCollectionsSelection, this.mainGraph, this.graphPaint, this.astController, this.provenance);

        // Flow graph tests
        // this.queryFlowGraph = new RequestFlow(this.queryFlowGraphSel);
        // this.queryFlowGraph.initDefault();

        this.cypherEditor.start();
        this.provenance.init();
        this.provenance.setupGraphVis();

        this.initGroupByEvent();
    }

    initSelections() {
        this.widgetsCollectionsSelection = d3.select("#div-widgets-collection");
        this.paintSvg = d3.select('#svg-paint');
        this.queryFlowGraphSel = d3.select('#request-flow-svg');
        this.groupByButton = d3.select('#btn-groupby');
    }

    initGroupByEvent() {
        this.groupByButton
            .on('click', () => {
                this.mainGraph.groupBySubgraphs(this.matchingResult, this.matchedNodes, this.matchedLinks);
                this.mainGraphVis.simulation.init();
                this.mainGraphVis.simulation.start();
                this.mainGraphVis.simulation.restart();
                // this.mainGraphVis.render();
            })
    }

    updateCypherFromAst = (request = true) => {
        this.astController.isManualChange = false;
        let cypherHTML = this.astController.ast.toCypherHTML();
        this.cypherEditor.codeMirror.getDoc().setValue(cypherHTML);

        if (request) this.requestDatabase(this.astController.cypher);
    }

    updateAstFromCypher = (provenanceCall) => {
        this.ast = this.astController.ast;

        if (provenanceCall && !(this.astController.isManualChange)) {
            this.updateCypherFromAst(false);
        }

        // graph paint creation
        this.subgraph = this.astController.ast.scopes[0].graph();
        this.processAstGraph();
        this.graphPaint.init(this.subgraph);

        // Visual constraints creation
        if (!(this.astController.isWidgetChange)) {
            this.updateWidgets();
        }

        // Database request
        this.requestDatabase(this.astController.cypher);
    }

    errorAst = (err) => {
        this.astController.error = true;
        this.cypherEditor.errorSelection.node().textContent = err;
    }

    updateWidgets() {
        this.astController.ast.transformWheres();
        this.widgetsCollection.initFromConstraints(this.ast.constraintsCollection);
        this.widgetsCollection.render();
    }

    processAstGraph() {
        this.subgraph.links = this.subgraph.links.map(l => {
            if (l.label == null) {
                l.label = globals.ANY_EDGETYPE;
            }
            return l
        })
        this.subgraph['metadata'] = {
            "attributes": this.mainGraph.attributes,
            "nodeType": "label",
            "edgeType": "label"
        };
    }

    requestDatabase(input){
        console.log("query")
        this.requestGraph();

        this.queryResultTable.setLoader();
        fetch(globals.URL_CYPHER_REQUEST.toString(), {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "mainGraph": this.mainGraph.data,
                "scriptRequest": input,
                "edgeTypes": this.mainGraph.edgeTypes,
                "edgeTypeKey": this.mainGraph.edgeTypeKey
            })
        }).then((response) => {
            if (response.status !== 200) {
                // if (this.errorDiv.html() == "") {
                //     this.errorDiv
                //         .html(response.status)
                //     this.queryResultTable.removeLoader();
                // }
            } else {
                response.json().then(
                    this.processMatching
                )
            }
        }).catch((error) => {
            if (this.cypherEditor.errorDiv.html() == "") {
                this.cypherEditor.errorDiv
                    .html(error)
                this.queryResultTable.removeLoader();
            }
        });
    }

    requestGraph() {
        fetch(globals.URL_ADJACENCY.toString(), {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "graph": this.graphPaint.graph
            })
        }).then((response) => {
            if (response.status !== 200) {
                //
            } else {
                response.json().then((json) => {
                        // console.log(json)
                    }
                )
            }
        })
    }

    processMatching = (matchingResponse) => {
        let matching = matchingResponse["matching"];

        this.matchingResult = matching["matching_list"];
        this.matchedNodes = matching["matched_nodes"];
        this.matchedLinks = matching["matched_links"];

        console.log("result matching: ", this.matchingResult);
        this.queryResultTable.initQueryResult(this.matchingResult);
        this.queryResultTable.removeLoader();
        this.queryResultTable.initTable();

        let linksIds = matching["matched_links"].map((link) => link[0] + link[1] + link[2]);
        this.mainGraphVis.highlightNodesOnly(matching["matched_nodes"]);
        this.mainGraphVis.highlightLinks(linksIds);
    }

    highlightCypherPart(entityId) {
        this.cypherEditor.highlightCypherPart(entityId);
    }

    unhighlightCypherPart(entityId) {
        this.cypherEditor.unhighlightCypherPart(entityId);
    }

    // TODO : works only for node, todo for links
    highlightQueryEntity(entityId) {
        if (this.matchingResult && this.matchingResult[0][entityId]) {
            this.selectedEntityIds = [];
            this.matchingResult.forEach((match) => {
                this.selectedEntityIds.push(match[entityId]["id"]);
            })
            this.mainGraphVis.selectNodesOnly(this.selectedEntityIds);
        }
    }

    unhighlightQueryEntity(entityId) {
        this.mainGraphVis.selectNodesOnly([]);
    }

    edgeToScript(d) {
        let edgeType = d[this.mainGraph.edgeTypeKey];
        let edgeStr = d.source.id + "-" + edgeType + "-" + d.target.id;
        return edgeStr;
    }
}

export {QueryStateManager}