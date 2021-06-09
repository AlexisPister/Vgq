import * as d3 from 'd3';

import {globals} from "../globals.js";
import GraphVisCanvas from "./GraphVisCanvas.js";


export default class DynamicGraphVisCanvas extends GraphVisCanvas  {
    constructor(graph, canvas, isDragging, isZooming) {
        super(graph, canvas, isDragging, isZooming)
        this.graph = graph;
        this.canvas = canvas;
    }

    renderNode(d) {
        this.ctx.beginPath();
        if (this.entityTypeLegend.legend[d[this.graph.entityTypeKey]] == "circle") {
            this.ctx.arc(d.x, d.y, globals.RADIUS, 0, 2 * Math.PI, true);
        } else if (this.entityTypeLegend.legend[d[this.graph.entityTypeKey]] == "square") {
            this.ctx.rect(d.x - globals.RADIUS, d.y - globals.RADIUS, globals.RADIUS * 2, globals.RADIUS * 2);
        }
        this.ctx.fill();
        this.ctx.stroke();
    }
}