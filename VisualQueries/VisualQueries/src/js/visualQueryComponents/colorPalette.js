import {globals} from '../globals.js';

class colorPalette {
    constructor(divElement, d3Scale) {
        this.element = divElement;

        this.element.append("div")
            .classed("legend-title", true)
            .text("Link types")

        this.svg = this.element
            .append("div")
            .append("svg")
            .attr("width", 140)
            .attr("height", 160)

        this.colorScale = d3Scale;
        this.addAnyColor();
        this.attributeDomain = this.colorScale.domain();

        this.rects = null;
        this.initPalette();

        this.selectedEdgeType = this.attributeDomain[0];
        this.highlight(null, this.selectedEdgeType);
        this.selectedEdgeTypeColor = this.colorScale(this.selectedEdgeType);
        this.setupClickEvents();
    }

    addAnyColor() {
        this.colorScale.domain([globals.ANY_EDGETYPE, ...this.colorScale.domain()]);
        this.colorScale.range([globals.ANY_EDGETYPE_COLOR, ...this.colorScale.range()]);
    }

    initPalette(){
        this.rects = this.svg
            .selectAll("rect")
            .data(this.attributeDomain)
            .join("rect")
            .attr("width", 20)
            .attr("height", 10)
            .attr("x", 0)
            .attr("y", (d,i) => i * 20)
            .attr("fill", (d,i) => this.colorScale(d))
            .attr("stroke", globals.SELECTION_COLOR)
            .attr("stroke-width", 0)
            .on("mouseover", (e, d) => {
                this.highlight(e, d)
            })
            .on("mouseout", (e, d) => {
                if (this.selectedEdgeType != d) this.unHighlight(e, d);
            })

        this.texts = this.svg
            .selectAll("text")
            .data(this.attributeDomain)
            .join("text")
            .attr("x", 22)
            .attr("y", (d,i) => (i * 20) + 10)
            .style("font-size", globals.FONT_SIZE)
            .text(d => d)
            .on("mouseover", (e, d) => {
                this.highlight(e, d)
            })
            .on("mouseout", (e, d) => {
                if (this.selectedEdgeType != d) this.unHighlight(e, d);
            })
    }

    highlight = (ev, datum) => {
        this.rects.filter((d) => JSON.stringify(d) == JSON.stringify(datum))
            .style("stroke-width", 3)

        this.texts.filter((d) => JSON.stringify(d) == JSON.stringify(datum))
            .attr("fill", globals.SELECTION_COLOR)
    }

    unHighlight = (ev, datum) => {
        this.rects.filter((d) => JSON.stringify(d) == JSON.stringify(datum))
            .style("stroke-width", 0)

        this.texts.filter((d) => JSON.stringify(d) == JSON.stringify(datum))
            .attr("fill", "black")
    }

    setupClickEvents(){
        this.rects.on("click", (e, d) => {
            this.unHighlight(e, this.selectedEdgeType);
            this.highlight(e, d);
            this.selectedEdgeType = d;
            this.selectedEdgeTypeColor = this.colorScale(this.selectedEdgeType);
        })

        this.texts.on("click", (e, d) => {
            this.unHighlight(e, this.selectedEdgeType);
            this.highlight(e, d);
            this.selectedEdgeType = d;
            this.selectedEdgeTypeColor = this.colorScale(this.selectedEdgeType);
        })
    }
}

export {colorPalette};