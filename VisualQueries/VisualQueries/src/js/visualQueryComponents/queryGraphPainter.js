import * as d3 from 'd3';

import {GraphData} from "../graph/graphData.js";
import {GraphVisSvg} from "../graphVis/GraphVisSvg.js";
import {colorPalette} from "./colorPalette.js";
import EntityTypeLegend from "./EntityTypeLegend.js";
import {globals} from "../globals.js";
import GraphCreator from "./GraphCreator.js";

class QueryGraphPainter extends GraphCreator {
    constructor(svg, mainGraph, mainGraphVis, queryStateManager) {
        super(svg);
        this.mainGraph = mainGraph;
        this.mainGraphVis = mainGraphVis;
        this.queryStateManager = queryStateManager;
        this.astController = this.queryStateManager.astController;
        this.provenanceManager = this.queryStateManager.provenanceManager;

        this.plusSigns = null;

        this.colorPalette = new colorPalette(d3.select("#color-palette"), this.mainGraphVis.linkScale);
        this.entityTypeLegend = new EntityTypeLegend(document.querySelector("#legend-entityType"))
        this.entityTypeLegend.init(this.mainGraphVis.entityTypeLegend.legend);

        this.btnSubgraph = d3.select('#btn-subgraph-matching');
        this.setupBtnEvents();
    }

    initGraph(graphJson) {
        this.graph = new GraphData(graphJson);
        this.takeMetadataFromMainGraph();
    }

    initGraphVis() {
        this.graphVis = new GraphVisSvg(this.graph, this.svg, globals.RADIUS, this.mainGraphVis.entityTypeLegend, false, false, false, false, this.mainGraphVis.linkScale);
        this.graphVis.render();
        // this.renderPlusButtons();
    }

    takeMetadataFromMainGraph() {
        this.graph.entityTypes = this.mainGraph.entityTypes;
        this.graph.attributes = this.mainGraph.attributes;
    }

    setupEvents() {
        super.setupEvents();
        this.setupHover();
    }

    setupHover() {
        this.graphVis.nodes.on("mouseover", (e, d) => {
            d3.select(".CodeMirror")
                .style("background", "rgba(0, 0, 0, 0.2)");

            this.queryStateManager.highlightCypherPart(d.id);
            this.queryStateManager.highlightQueryEntity(d.id);
        })

        this.graphVis.nodes.on("mouseout", (e, d) => {
            d3.select(".CodeMirror")
                .style("background", "rgba(0, 0, 0, 0)");

            this.queryStateManager.unhighlightCypherPart(d.id);
            this.queryStateManager.unhighlightQueryEntity();
        })
    }

    updatePlusButtons = () => {
        let offsetY = this.graphVis.radius * 2;
        let offsetX = this.graphVis.radius / 2;
        this.plusSigns
            .attr("x", d => d.x + offsetX)
            .attr("y", d => d.y - offsetY)
            .attr("transform", d => " translate("+ (d.x + offsetX) + " " + (d.y - offsetY) + ") scale(0.2)" +
                " translate("+ (-(d.x + offsetX)) + " " + (-(d.y - offsetY)) + ")")
    }

    renderPlusButtons() {
        this.plusSigns = this.graphVis.gNodes
            .selectAll(".plus-sign")
            .data(this.graph.nodesRendered, (d) => d.id)
            .join("use")
                .classed('plus-sign', true)
                .attr("href", "#stored-plus-sign")
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                // .attr("transform", d => " translate("+ (d.x) + " " + (d.y) + ") scale(0.3) translate("+ (-d.x) + " " + (-d.y) + ")")
                .on("click", (d) => {
                    this.widgetCollection.initNewWidgetArea(d.id);
                })
    }

    setupBtnEvents() {
        this.btnSubgraph.on('click', (e) => {
            console.log("sent request graph", this.graph.data);
            fetch(URL_SUBGRAPH_MATCHING.toString(), {
                method: "POST",
                mode: "cors",
                headers: {
                    // 'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "graph": this.mainGraph.data,
                    "subgraph": this.graph.data,
                    "edgeTypeKey": this.mainGraph.edgeTypeKey
                })
            }).then(response => response.json() // .json(), etc.
            ).then(
                matching => {
                    console.log(matching);
                    let matchedNodes = matching["matched_nodes"];
                    this.mainGraphVis.highlightNodes(matchedNodes);
                    this.mainGraphVis.highlightLinks(matching["subgraphs"]);
                }
            );
        })
    }

    removeNode(node) {
        this.graph.removeNode(node.id);
        this.astController.removeNode(node.id);

        this.updateVis();
    }

    createNewNode(x, y) {
        let nodeId = this.astController.ast.scopeGlobal.next_id(1, "n");
        let nodeType = this.entityTypeLegend.selectedNodeType;
        let newNode = {"id": nodeId, "x": x, "y": y, [this.graph.entityTypeKey]: nodeType};
        this.graph.addNode(newNode);

        this.updateVis();
        this.setupMouseEvents();
        this.setupHover();
    }

    createNewLink(d1, d2) {
        let edgeType = this.colorPalette.selectedEdgeType;
        let linkId = this.astController.ast.scopeGlobal.next_id(2, "l");

        // We have to create twice the same object because d3 force will transform it in linksRendered
        let newLink = {"source": d1.id, "target": d2.id, "id": linkId, [this.graph.edgeTypeKey]: edgeType};
        this.graph.links.push(newLink);
        this.graph.linksRendered.push({...newLink});

        if (edgeType == globals.ANY_EDGETYPE) {
            edgeType = null;
        }

        let sourceType =  d1[this.graph.entityTypeKey];
        let targetType = d2[this.graph.entityTypeKey];
        if (sourceType == globals.ANY_NODETYPE) {
            sourceType = null;
        }
        if (targetType == globals.ANY_NODETYPE) {
            targetType = null;
        }

        this.updateVis();
        this.setupMouseEvents();

        this.astController.addLink(d1.id, d2.id, edgeType, sourceType, targetType);

        console.log("link added ", this.graph);
    }

    updateDragLine(e) {
        super.updateDragLine(e);
        this.dragLine
            .attr('stroke', this.colorPalette.selectedEdgeTypeColor);
    }

}

export {QueryGraphPainter};