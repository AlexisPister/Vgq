import * as d3 from 'd3';

import {generateUndirectedLinkId} from '../utils/utils.js';
import {globals} from '../globals.js'

class Simulation {
    constructor(graph, graph_vis, canvas) {
        this.graph = graph;
        this.graph_vis = graph_vis;
        this.graph_vis.setSimulation(this);
        this.canvas = canvas;

        this.simulation = null;
    }

    init(){
        this.simulation = d3.forceSimulation(this.graph.nodesRendered)
            .force("link", d3.forceLink()
                .id(function(d) { return d.id; })
                .strength(1)
                .distance(50)
            )
            .force("charge", d3.forceManyBody().strength(-300))
            .force("collision", d3.forceCollide().radius(() => globals.RADIUS * 2))
            // .force("center", d3.forceCenter(this.canvas.attr('width') / 2, this.canvas.attr('height') / 2))

        this.simulation.force("link")
            .links(this.graph.linksRendered);
    }

    start(){
        this.simulation
            .nodes(this.graph.nodesRendered)

        // // To simulate before drawing
        // for (let i in d3.range(1000)){
        //     this.simulation.tick();
        // }

        this.simulation
            .on("tick", () => {
                this.ticked();
            })
            // .on('end', () => {
            //     console.log('restart');
            //     this.restart();
            // });

        // this.ticked();
    }

    stop(){
        this.simulation.stop();
    }

    restart(alpha = 1, alphaTarget= 0){
        this.simulation.alphaTarget(alphaTarget).alpha(alpha).restart();
    }

    ticked = () => {
        this.graph_vis.render();
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

    // ticked = () => {
    //     this.graph.linkRepetitionCount();
    //     this.linkOccurences = {};
    //
    //     this.graph_vis.links
    //         .attr("x1", (d) => {
    //             return this.findEdgePos(d, "x", "source");
    //         })
    //     this.linkOccurences = {};
    //     this.graph_vis.links
    //         .attr("x2", (d) => {
    //             return this.findEdgePos(d, "x", "target");
    //         })
    //     this.linkOccurences = {};
    //     this.graph_vis.links
    //         .attr("y1", (d) => {
    //             return this.findEdgePos(d, "y", "source");
    //         })
    //     this.linkOccurences = {};
    //     this.graph_vis.links
    //         .attr("y2", (d) => {
    //             return this.findEdgePos(d, 'y', "target");
    //         })
    //
    //         // .attr("y1", function(d) { return d["source"].y; })
    //         // .attr("x2", function(d) { return d["target"].x; })
    //         // .attr("y2", function(d) { return d["target"].y; });
    //
    //     this.graph_vis.nodes
    //         .attr("transform", function(d) {
    //             return "translate(" + d.x + "," + d.y + ")";
    //         })
    // }

}

export {Simulation};