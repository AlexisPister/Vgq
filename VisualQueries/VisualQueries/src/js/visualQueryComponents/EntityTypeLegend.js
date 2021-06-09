import * as d3 from 'd3';

import {globals} from "../globals.js";

export default class EntityTypeLegend {
    constructor(element) {
        this.element = element;
        this.setupSvgShapes();
    }

    initHeader() {
        this.headerElement = document.createElement("div");
        this.headerElement.classList.add("legend-title")
        this.headerElement.appendChild(document.createTextNode("Node Types"));
        this.element.appendChild(this.headerElement);
    }

    init(entityTypesLegend) {
        this.initHeader();
        this.entityTypesLegend = entityTypesLegend;
        this.legendElement = document.createElement("div");
        this.element.appendChild(this.legendElement);

        let i = 0;
        for (const [nodeType, shape] of Object.entries(entityTypesLegend)) {
            let entityTypeLegend = document.createElement("div");

            let svgShape;
            if (shape == "circle") {
                svgShape = this.circleSvg;
            } else if (shape == "square") {
                svgShape = this.rectSvg;
            } else if (shape == "star") {
                svgShape = this.starSvg;
            }

            this.setupSvgEvent(svgShape, nodeType);

            entityTypeLegend.appendChild(svgShape.node());

            let textLegend = document.createTextNode(nodeType);
            entityTypeLegend.appendChild(textLegend);
            entityTypeLegend.style.fontSize = `${globals.FONT_SIZE}px`;

            if (nodeType == globals.ANY_NODETYPE) {
                this.legendElement.prepend(entityTypeLegend);
            } else {
                this.legendElement.appendChild(entityTypeLegend);
            }

            entityTypeLegend.onclick = () => {
                this.unhighlightAll();
                this.selectedNodeType = nodeType;
                this.highlight(entityTypeLegend);
            }

            entityTypeLegend.onmouseover = () => {
                this.highlight(entityTypeLegend);
            }

            entityTypeLegend.onmouseout = () => {
                if (nodeType != this.selectedNodeType) this.unhighlight(entityTypeLegend);
            }
            
            // first selection
            if (i == 0) {
                this.selectedNodeType = nodeType;
                this.highlight(entityTypeLegend);
            }
            i++;
        }
    }

    highlight = (entityTypeLegend) => {
        entityTypeLegend.style.color = globals.SELECTION_COLOR;
        entityTypeLegend.querySelector("svg").childNodes[0].style.stroke = globals.SELECTION_COLOR;
    }

    unhighlight = (entityTypeLegend) => {
        entityTypeLegend.style.color = "black";
        entityTypeLegend.querySelector("svg").childNodes[0].style.stroke = "black";
    }

    unhighlightAll() {
        this.legendElement.childNodes.forEach(div => {
            this.unhighlight(div);
        })
    }

    setupSvgEvent(svgShape, nodeType) {
        svgShape.on("click", () => {
            this.selectedNodeType = nodeType;
        })
    }

    setupSvgShapes() {
        this.svgSize = globals.RADIUS * 2;
        this.circleSvg = d3.create("svg")
            .attr("width", this.svgSize)
            .attr("height", this.svgSize)
        this.circleSvg
            .append("circle")
            .attr("r", globals.RADIUS)
            .attr("cx", globals.RADIUS)
            .attr("cy", globals.RADIUS)
            .style("fill", globals.FILLSTYLE)
            .style("stroke", globals.STROKESTYLE)

        this.rectSvg = d3.create("svg")
            .attr("width", this.svgSize)
            .attr("height", this.svgSize)
        this.rectSvg
            .append("rect")
            .attr("width", globals.RADIUS * 2)
            .attr("height", globals.RADIUS * 2)
            .style("fill", globals.FILLSTYLE)
            .style("stroke", globals.STROKESTYLE)

        this.starSvg = d3.create("svg")
            .attr("width", this.svgSize)
            .attr("height", this.svgSize)
        this.starSvg
            .append("path")
            .attr("d", d3.symbol().type(d3.symbolStar).size(globals.RADIUS * 12))
            .attr("transform", `translate(${globals.RADIUS}, ${globals.RADIUS})`)
            .style("fill", globals.FILLSTYLE)
            .style("stroke", globals.STROKESTYLE)
    }

    svgRect(color) {
        let svg = d3.create("svg")
            .attr("width", this.svgSize)
            .attr("height", this.svgSize)
        svg
            .append("rect")
            .attr("width", globals.RADIUS * 2)
            .attr("height", globals.RADIUS * 2)
            .style("fill", color)
            .style("stroke", globals.STROKESTYLE)

        return svg.node();
    }
}