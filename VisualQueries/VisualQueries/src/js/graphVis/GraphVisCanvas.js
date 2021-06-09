// const LassoCanvas = require('canvas-lasso');
import {LassoCanvas} from "canvas-lasso";

import Legend from "../utils/legend";
import * as d3 from "d3";
import {globals} from "../globals";
import MatrixVis from "./MatrixVis";


export default class GraphVisCanvas {
    constructor(graph, canvas, isDragging, isZooming, isLasso=true) {
        this.graph = graph;
        this.canvas = canvas;
        this.ctx = canvas.node().getContext('2d');
        this.width = canvas.attr("width");
        this.height = canvas.attr("height");
        this.simulation = null;

        this.isDragging = isDragging;
        this.isZooming = isZooming;

        if (this.isDragging) {
            this.canvas.call(d3.drag()
                .subject(this.dragSubject)
                .on("start", this.dragStart)
                .on("drag", this.dragMove)
                .on("end", this.dragEnd)
            );
        }

        this.transform = d3.zoomIdentity;
        if (isLasso) {
            this.setupLasso();
        }

        if (this.isZooming) {
            this.setupZoom();
        }

        this.entityTypeLegend = new Legend(this.graph.entityTypes);
        this.entityTypeLegend.initAutoShapeLegend();

        this.highlightAllGraph();
    }

    setSimulation(simulation) {
        this.simulation = simulation;
    }

    setupZoom() {
        this.canvas
            .call(d3.zoom()
                .on("zoom", this.zoomAction))
    }

    setupLasso() {
        this.lasso = new LassoCanvas();
        this.lasso.init(this.canvas.node(),
            this.graph.nodesRendered,
            (selectedItems) => {
            console.log(selectedItems);
            selectedItems.forEach(item => item.selected = true);
        },
            (items) => {
            items.forEach(item => {
                item.selected = false;
            })
        },
            this.render,
            null,
            this.transform)
    }

    highlightAllGraph() {
        this.graph.nodesRendered.forEach((d, i) => {
            this.graph.nodesRendered[i]["highlighted"] = true;
        })
        this.graph.linksRendered.forEach((d, i) => {
            this.graph.linksRendered[i]["highlighted"] = true;
        })
    }

    renderNodes() {
        this.ctx.lineWidth = 1;
        this.graph.nodesRendered.forEach((d, i) => {
            if (d.highlighted) {
                this.ctx.globalAlpha = 1.0;
            } else {
                this.ctx.globalAlpha = globals.UNHIGHLIGHT_OPACITY;
            }

            if (d.selected) {
                this.ctx.strokeStyle = globals.SELECTION_COLOR;
                this.ctx.lineWidth = 5;
            } else {
                this.ctx.strokeStyle = "black";
                this.ctx.lineWidth = 1;
            }

            this.ctx.fillStyle = "white";

            this.renderNode(d);
        });
    }

    renderNode(d) {
        this.ctx.beginPath();
        if (this.entityTypeLegend.legend[d.entity_type] == "circle") {
            this.ctx.arc(d.x, d.y, globals.RADIUS, 0, 2 * Math.PI, true);
        } else if (this.entityTypeLegend.legend[d.entity_type] == "square") {
            this.ctx.rect(d.x - globals.RADIUS, d.y - globals.RADIUS, globals.RADIUS * 2, globals.RADIUS * 2);
        } else { // TODO Currentlu for subgraphs
            console.log("subgraph")
            // this.ctx.rect(d.x - globals.RADIUS, d.y - globals.RADIUS, globals.RADIUS * 2, globals.RADIUS * 2);

            this.matrixVis = new MatrixVis( this.ctx, globals.RADIUS * 2);
            this.matrixVis.render([[1,0,1], [0,1,1], [1, 1, 0]], d.x, d.y);

        }
        this.ctx.fill();
        this.ctx.stroke();
    }

    renderLinks() {
        this.graph.linksRendered.forEach((d) => {
            this.ctx.strokeStyle = this.linkScale ? this.linkScale(d[this.graph.edgeTypeKey]) : "black";

            this.setupLinkHighlight(d);
            this.renderLink(d);
        });
    }

    renderLink(link) {
        this.ctx.beginPath();

        let [x1, y1, x2, y2] = [link.source.x, link.source.y, link.target.x, link.target.y];

        let dx=x2-x1;
        let dy=y2-y1;
        let angle=Math.atan2(dy,dx);
        // let length=Math.sqrt(dx*dx+dy*dy);

        // to remove the bits overlapping the nodes
        x1 = globals.RADIUS * Math.cos(angle) + x1;
        x2 = x2 - globals.RADIUS * Math.cos(angle);
        y1 = globals.RADIUS * Math.sin(angle) + y1;
        y2 = y2 - globals.RADIUS * Math.sin(angle);

        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);

        this.renderLinkArrow(x2, y2, angle)

        this.ctx.stroke();
    }

    renderLinkArrow(x2, y2, angle) {
        this.ctx.lineTo(x2 - globals.ARROW_LENGTH * Math.cos(angle - Math.PI / 6), y2 - globals.ARROW_LENGTH  * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - globals.ARROW_LENGTH  * Math.cos(angle + Math.PI / 6), y2 - globals.ARROW_LENGTH  * Math.sin(angle + Math.PI / 6));
    }

    setupLinkHighlight(link) {
        if (link.highlighted) {
            this.ctx.globalAlpha = 1.0;
        } else {
            this.ctx.globalAlpha = globals.UNHIGHLIGHT_OPACITY;
        }
    }

    render = () => {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.translate(this.transform.x, this.transform.y);
        this.ctx.scale(this.transform.k, this.transform.k);

        this.renderLinks();
        this.renderNodes();

        this.ctx.restore();
    }

    highlightNodes(nodesList){
        nodesList.forEach(nodeId => {
            this.graph.nodeIdsToindex[nodeId]["highlighted"] = true;
        })
        this.render();
    }

    highlightNodesOnly(nodesList) {
        this.graph.nodesRendered
            .forEach((d, index) => {
                if (nodesList.includes(d["id"])) {
                    this.graph.nodesRendered[index]["highlighted"] = true;
                } else {
                    this.graph.nodesRendered[index]["highlighted"] = false;
                }
            })
        this.render();
    }

    selectNodes(nodesList){
        nodesList.forEach(nodeId => {
            this.graph.idToNode[nodeId]["selected"] = true;
        })
        this.render();
    }

    selectNodesOnly(nodesList) {
        this.graph.nodesRendered
            .forEach((d, index) => {
                if (nodesList.includes(d["id"])) {
                    this.graph.nodesRendered[index]["selected"] = true;
                } else {
                    this.graph.nodesRendered[index]["selected"] = false;
                }
            })
        this.render();
    }


    highlightLinks(linksList){
        // let linksIdsList = linksList.map((link) => link[0] + link[1] + link[2]);
        // this.highlightedLinks = linksIdsList;
        // console.log(linksIdsList);

        this.graph.linksRendered
            .forEach((d, index) => {
                if (linksList.includes(d["source"].id + d[this.graph.edgeTypeKey] + d["target"].id)) {
                    this.graph.linksRendered[index]["highlighted"] = true;
                } else {
                    this.graph.linksRendered[index]["highlighted"] = false;
                }
            })
        this.render();
    }

    selectLinksOnly(linksList) {
        this.graph.linksRendered
            .forEach((d, index) => {
                if (linksList.includes(d["source"].id + d[this.graph.edgeTypeKey] + d["target"].id)) {
                    this.graph.linksRendered[index]["selected"] = true;
                } else {
                    this.graph.linksRendered[index]["selected"] = false;
                }
            })
        this.render();
    }

    findNode(x, y) {
        const rSq = globals.RADIUS * globals.RADIUS;
        let i;
        for (i = this.graph.nodesRendered.length - 1; i >= 0; --i) {
          const node = this.graph.nodesRendered[i],
                dx = x - node.x,
                dy = y - node.y,
                distSq = (dx * dx) + (dy * dy);
          if (distSq < rSq) {
            return node;
          }
        }
        // No node selected
        return undefined;
    }

    dragSubject = (e) => {
        let x = this.transform.invertX(e.x);
        let y = this.transform.invertY(e.y);

        let node = this.findNode(x, y);
        if (node) {
            node.x = this.transform.applyX(node.x);
            node.y = this.transform.applyY(node.y);
        }

        return node
        // return this.simulation.simulation.find(this.transform.invertX(mouseCoordinates[0]), this.transform.invertY(mouseCoordinates[1]));
    }

    dragStart = (e) => {
        e.subject.x = this.transform.invertX(e.x);
        e.subject.y = this.transform.invertY(e.y);
    }

    dragMove = (e) => {
        e.subject.x = this.transform.invertX(e.x);
        e.subject.y = this.transform.invertY(e.y);
        this.render();
    }

    dragEnd = (e) => {
        e.subject.x = this.transform.invertX(e.x);
        e.subject.y = this.transform.invertY(e.y);
        this.render();
    }

    zoomAction = (e) => {
        this.transform = e.transform;
        this.lasso.transform = e.transform;
        this.render();
    }
}