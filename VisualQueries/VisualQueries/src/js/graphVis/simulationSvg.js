import * as d3 from 'd3';

import {globals} from "../globals.js";
import {generateUndirectedLinkId} from "../utils/utils.js";

class SimulationSvg {
    constructor(graph, graph_vis, svg) {
        this.graph = graph;
        this.graph_vis = graph_vis;
        this.graph_vis.simulation = this;
        this.svg = svg;
        this.width = this.svg.attr("width");
        this.height = this.svg.attr("height");

        this.simulation = null;
    }

    init(){
        this.simulation = d3.forceSimulation(this.graph.nodesRendered)
            .force("link", d3.forceLink().id(function(d) { return d.id; }))
            .force("charge", d3.forceManyBody().strength(-15))
            .force("collision", d3.forceCollide().radius(() => globals.RADIUS * 2))
            .force("center", d3.forceCenter(this.svg.attr('width') / 2, this.svg.attr('height') / 2))
            .force("bounding", (alpha) => {
                for (let i = 0, n = this.graph.nodesRendered.length; i < n; ++i) {
                    let node = this.graph.nodesRendered[i];
                    if (node.x <= globals.RADIUS) {
                        node.x = globals.RADIUS;
                    } else if (node.x >= (this.width - globals.RADIUS - 2)) {
                        node.x = (this.width - globals.RADIUS - 2);
                    }
                    
                    if (node.y <= globals.RADIUS) {
                        node.y = globals.RADIUS;
                    } else if (node.y >= (this.height - globals.RADIUS - 2)) {
                        node.y = (this.height - globals.RADIUS - 2);
                    }
                }
        })

        this.simulation.force("link")
            .links(this.graph.linksRendered);
    }


    start(){
        this.simulation
            .nodes(this.graph.nodesRendered)
            .on("tick", () => {
                this.ticked();
            })

        this.simulation.force("link")
            .links(this.graph.linksRendered);

        this.restart(0.0001, 0);
    }

    stop(){
        this.simulation.stop();
    }

    restart(alpha = 1, alphaTarget= 0){
        this.simulation.alphaTarget(alphaTarget).alpha(alpha).restart();
    }

    findEdgePos(d, axis, node="source"){
        // let linkId = d.source.id.toString() + "-" + d.target.id.toString();
        let linkId = generateUndirectedLinkId(d.source.id, d.target.id);
        if (this.graph.linkCount[linkId] > 1) {
            if (this.linkOccurences[linkId] === undefined) {
                this.linkOccurences[linkId] = 1;
                return d[node][axis] + 3;
            }
            else if (this.linkOccurences[linkId] == 1) {
                this.linkOccurences[linkId] += 1;
                return d[node][axis] - 3;
            }
        } else {
            return d[node][axis];
        }
    }

    ticked = () => {
        this.graph_vis.links.each(function(parentDatum) {
            d3.select(this).selectAll("line")
                .attr("x1", function(d) { return parentDatum["source"].x; })
                .attr("y1", function(d) { return parentDatum["source"].y; })
                .attr("x2", function(d) { return parentDatum["target"].x; })
                .attr("y2", function(d) { return parentDatum["target"].y; });
        })

        // this.graph_vis.links.selectAll("line")
        //     .attr("x1", function(d) { return d["source"].x; })
        //     .attr("y1", function(d) { return d["source"].y; })
        //     .attr("x2", function(d) { return d["target"].x; })
        //     .attr("y2", function(d) { return d["target"].y; });

        if (this.graph_vis.circleNodes) {
            this.graph_vis.circleNodes
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
        }

        if (this.graph_vis.squareNodes) {
            this.graph_vis.squareNodes
                .attr("x", d => d.x - globals.RADIUS)
                .attr("y", d => d.y - globals.RADIUS)
        }

        if (this.graph_vis.starNodes) {
            this.graph_vis.starNodes
                .attr("transform", function(d) {
                    return `translate(${d.x} ,${d.y})`;
                })
        }

        this.graph_vis.text
            .attr("x", d => d.x + 8)
            .attr("y", d => d.y - 8)
    }

    addTickAction(func) {
        this.oldTicked = this.ticked;
        this.ticked = () => {
            this.oldTicked();
            func();
        }
    }

}

export {SimulationSvg};