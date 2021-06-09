import * as d3 from 'd3';

import GraphVisCanvas from "./GraphVisCanvas.js";
import Legend from "../utils/legend.js";

class StaticGraphVisCanvas extends GraphVisCanvas {
    constructor(graph, canvas, isDragging, isZooming, linkScale, tooltipElementId= "main-graph-tooltip") {
        super(graph, canvas, isDragging, isZooming)

        // this.color =  d3.scaleOrdinal(d3.schemeCategory10);

        if (linkScale == null) {
            this.linkScale = d3.scaleOrdinal().domain(this.graph.edgeTypes).range(d3.schemeCategory10);
        } else {
            this.linkScale = linkScale;
        }

        this.tooltip = d3.select(`#${tooltipElementId}`);
        this.setupClickNodeEvent();
    }


    setupClickNodeEvent() {
        this.canvas.on("mousemove", (e) => {
            let node = this.findNode(this.transform.invertX(e.offsetX), this.transform.invertY(e.offsetY));

            if (node) {
                let html = "";
                for (const [name, value] of Object.entries(node)) {
                    html += `<span class="table-property-key">${name}</span>: ${value} <br>`;
                }

                this.tooltip
                    .style("visibility", "visible")
                    .style("top", `${e.pageY + 10}px`)
                    .style("left", `${e.pageX + 10}px`)
                    .html(html);
            } else {
                this.tooltip
                    .style("visibility", "hidden")
                    .html("")
            }
        })
    }
}

export {StaticGraphVisCanvas};