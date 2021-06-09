import {globals} from "../globals.js";
import * as d3 from 'd3';

class GraphVisSvg {
    constructor(graph, svg, radius, nodeTypeLegend, isDragging, isZooming, isLasso, isMainGraph, linkScale) {
        this.graph = graph;
        this.svg = svg;
        this.radius = radius;
        this.nodeTypeLegend = nodeTypeLegend;
        this.simulation = null;
        this.scriptLang = null;
        this.isDragging = isDragging;
        this.isLasso = isLasso;
        this.isMainGraph = isMainGraph;

        this.nodesByTypes = {};

        // d3 selections
        this.gLinks = this.svg.append("g")
            .attr("class", "links");
        this.gNodes = this.svg.append("g")
            .attr("class", "nodes");
        this.nodes = null;
        this.links = null;
        this.circles = null;
        this.text = null;

        if (isZooming) {
            this.svg
                .call(d3.zoom().on("zoom", this.zoomAction));
        }

        this.color =  d3.scaleOrdinal(d3.schemePastel1);

        if (linkScale == null) {
            this.linkScale = d3.scaleOrdinal().domain(this.graph.edgeTypes).range(d3.schemeCategory10);
        } else {
            this.linkScale = linkScale;
        }

        this.selections();
    }

    lassoInit() {
        this.lassoRect = this.svg
            .append('svg')

        // A rect is needed for the dimensions
        this.lassoRect.append("rect")
            .attr('width', this.svg.attr('width'))
            .attr('height', this.svg.attr('height'))
            .attr('opacity', 0)

        this.lasso = d3.lasso()
            .closePathSelect(true)
            .closePathDistance(100)
            .items(this.circles)
            .targetArea(this.lassoRect)
            .on("start", this.lasso_start)
            .on("draw", this.lasso_draw)
            .on("end", this.lasso_end);
        this.lassoRect.call(this.lasso);
    }

    selections() {
        if (this.isMainGraph) {
            this.showNamesBox = d3.select("#names-box")
            this.showNamesBox.on("change", () => {
                this.text.style("visibility",  (d) => {
                    if (this.showNamesBox.node().checked) {
                        return "visible";
                    } else {
                        return "hidden";
                    }
                });
            })
        }
    }

    render() {
        this.nodes_render();
        this.links_render();
    }

    links_render() {
        // this.links = this.gLinks
        //     .selectAll("line")
        //     .data(this.graph.linksRendered)
        //     .join('line')
        //     .attr("stroke-width", "3")
        //     .attr('stroke', (d, i) => {
        //         return this.linkScale(d[this.graph.edgeTypeKey])
        //     });

        this.links = this.gLinks
            .selectAll(".edge")
            .data(this.graph.linksRendered)
            .join('g')
            .classed("edge", true)


        console.log("LINKS ", this.links)
        // this.links
        //     // .filter((d) => Array.isArray(d.label))
        //     .append("line")
        //     .attr("stroke-width", "3")
        //     .attr('stroke', (d, i) => {
        //         return "black";
        //         // return this.linkScale(d[this.graph.edgeTypeKey])
        //     });


        // Create one line per edge type
        this.links
            .selectAll("line")
            .data(d => {
                let nTypes = d[this.graph.edgeTypeKey].length;
                this.lastColor = nTypes == 1 ? null : d[this.graph.edgeTypeKey][nTypes - 1];

                return d[this.graph.edgeTypeKey];
            })
            .join('line')
            .attr("stroke-width", "3")
            .attr("stroke-dasharray", (d) => {
                if (this.lastColor == d) {
                    return "5";
                } else {
                    return "0";
                }
            })
            .attr('stroke', (d, i) => {
                // return "black";
                return this.linkScale(d)
            });
    }

    nodes_render() {
        this.graph.entityTypes.forEach((et) => {
            let shape = this.nodeTypeLegend.legend[et];
            if (shape == "circle") {
                this.circleNodes = this.gNodes
                    .selectAll("circle")
                    .data(this.graph.getNodesByType(et))
                    .join("circle")
                        .attr("r", this.radius)
                        .attr("fill", d => "white")
                        .attr("stroke", "black")
                        .classed("node", true)
            } else if (shape == "square") {
                this.squareNodes = this.gNodes
                    .selectAll("rect")
                    .data(this.graph.getNodesByType(et))
                    .join("rect")
                        .attr("width", this.radius * 2)
                        .attr("height", this.radius * 2)
                        .attr("fill", d => "white")
                        .attr("stroke", "black")
                        .classed("node", true)
            }
        })

        this.starNodes = this.gNodes
            .selectAll("path")
            .data(this.graph.getNodesByType(null))
            .join("path")
                .attr("d", d3.symbol().type(d3.symbolStar).size(this.radius * 12))
                .attr("fill", globals.FILLSTYLE)
                .attr("stroke", globals.STROKESTYLE)
                .classed("node", true)

        this.nodes = this.svg.selectAll(".node")


        this.text = this.gNodes.selectAll("text")
            .data(this.graph.nodesRendered)
            .join("text")
            .text((d) => d.id)


        if (this.isDragging) {
            this.nodes.call(d3.drag()
                .on("start", this.dragStart)
                .on("drag", this.dragMove)
                .on("end", this.dragEnd));
        }

        if (this.lasso) {
            this.lassoInit();
        }
    }

    highlightNodes(nodesList) {
        this.nodes
            .style("opacity", (d, i) => {
                if (nodesList.includes(d.id)) {
                    return 1
                } else {
                    return 0.4
                }
            })
    }

    edgeSelectionFromNodeList(nodeList){
        return this.links.filter((d, i) => nodeList.includes(d.source.id) & nodeList.includes(d.target.id));
    }

    highlightEdges(subgraphsList) {
        this.links
            .style("opacity", (d, i) => {
                for (let j = 0; j < subgraphsList.length; j++) {
                    let subgraph = subgraphsList[j];
                    if (subgraph.includes(d.target.id) && subgraph.includes(d.source.id)) {
                        return 1;
                    }
                }
                return 0.4;
            });
    }

    dragStart = (d, i) => {
        this.simulation.restart(1, 0);
        // this.simulation.simulation.stop() // stops the force auto positioning before you start dragging
    }

    dragMove = (e, d, i) => {
        d.px += e.dx;
        d.py += e.dy;
        d.x += e.dx;
        d.y += e.dy;

        // d.x += e.x;
        // d.y += e.y;
        d.fx = d.x;
        d.fy = d.y;
        this.simulation.restart(1, 0);
    }

    dragEnd = (e, d, i) => {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        // this.simulation.ticked();
        this.simulation.restart(1, 0);
    }

    zoomAction = (e, d) => {
        this.gNodes.attr("transform", e.transform);
        this.gLinks.attr("transform", e.transform);
    }

    lasso_start = () => {
        this.lasso.items()
            // .attr("r", this.radius) // reset size
            .classed("not_possible",true)
            .classed("selected",false);
    };

    lasso_draw = () => {
        // Style the possible dots
        this.lasso.possibleItems()
            .classed("not_possible",false)
            .classed("possible",true);

        // Style the not possible dot
        this.lasso.notPossibleItems()
            .classed("not_possible",true)
            .classed("possible",false);
    };

    lasso_end = () => {
        // Reset the color of all dots
        this.lasso.items()
            .classed("not_possible",false)
            .classed("possible",false);

        // Style the selected dots
        let lassoSelectedNodes = [];
        this.lasso.selectedItems()
            .classed("selected",true)
            .each((d) => {
                lassoSelectedNodes.push(d.id);
            })
            // .call((d) => console.log(i, d));
            // .attr("r",(d) => {
            //     console.log(d);
            //     return 7
            // });

        this.scriptLang.graphToScript(this.edgeSelectionFromNodeList(lassoSelectedNodes));
        // this.highlightEdges([lassoSelectedNodes])

        // Reset the style of the not selected dots
        this.lasso.notSelectedItems()
            // .attr("r",3.5);
    };

}

export {GraphVisSvg};