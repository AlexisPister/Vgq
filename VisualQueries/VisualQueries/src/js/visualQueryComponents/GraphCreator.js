import * as d3 from "d3";
import {colorPalette} from "./colorPalette";
import EntityTypeLegend from "./EntityTypeLegend";
import {GraphData} from "../graph/graphData";
import {GraphVisSvg} from "../graphVis/GraphVisSvg";
import {SimulationSvg} from "../graphVis/simulationSvg";

export default class GraphCreator {
    constructor(svg) {
        this.svg = svg;
        this.svgContainer = d3.select(this.svg.node().parentNode);

        this.graph = null;

        this.dragLine = this.svg
            .append("path")
            .attr("stroke", "black")
            .attr("class", "dragLine")
            .attr("d", "M0,0L20,20")
            .style("visibility", "hidden");

        this.isLinkDragged = false;
        this.draggedNode = null;
    }

    init(graphJson) {
        $("#" + this.svg.attr("id").toString()).children(":not(.dragLine)").remove();
        this.initGraph(graphJson);
        this.initGraphVis();
        this.initSimulation();

        this.setupEvents();
        this.setupMenu();
    }

    initGraph(graphJson) {
        this.graph = new GraphData(graphJson);
    }

    // initGraphVis() {
    //     this.graphVis = new GraphVisSvg(this.graph, this.svg, null, false, false, false, false, null);
    //     this.graphVis.render();
    // }

    initSimulation() {
        this.simulation = new SimulationSvg(this.graph, this.graphVis, this.svg);
        this.simulation.init();
        this.simulation.start();
        // this.simulation.addTickAction(this.updatePlusButtons);
    }

    updateVis() {
        // this.renderPlusButtons();
        this.simulation.start();
        // this.simulation.restart(1, 0);
        this.graphVis.render();
    }

    setupEvents() {
        this.setupMouseEvents();
    }

    setupMenu() {
        this.menu = this.svgContainer
            .append("div")
                .style("position", "absolute")
                .style("top", "10px")
                .style("right", "10px")
            .classed("ui icon buttons", true)

        this.selectButton =this.menu
            .append("button")
            .attr("id", "button-select")
            .classed("ui button active", true)
            .on("click", (e) => {
                this.setAllModesFalse();
                this.setAllButtonsInactive();
                this.selectMode = true;
                e.target.classList.add("active");
            });
        this.selectButton
            .append("i")
            .classed("hand pointer outline icon", true)

        this.editButton = this.menu
            .append("button")
            .attr("id", "button-edit")
            .classed("ui button", true)
            .on("click", (e) => {
                this.setAllModesFalse();
                this.setAllButtonsInactive();
                this.editMode = true;
                e.target.classList.add("active");
            });
        this.editButton
            .append("i")
            .classed("edit icon", true)


        this.eraseButton =this.menu
            .append("button")
            .classed("ui button", true)
            .attr("id", "button-erase")
            .on("click", (e) => {
                this.setAllModesFalse();
                this.setAllButtonsInactive();
                this.eraseMode = true;
                e.target.classList.add("active");
            });
        this.eraseButton
            .append("i")
            .classed("eraser icon", true)

        this.selectMode = true;
    }

    setAllModesFalse() {
        this.eraseMode = false;
        this.selectMode = false;
        this.editMode = false;
    }

    setAllButtonsInactive() {
        this.selectButton.classed("active", false);
        this.editButton.classed("active", false);
        this.eraseButton.classed("active", false);
    }

    setupMouseEvents = () => {
        this.setupSvgEvents();
        this.setupGraphEvents();
    }

    setupSvgEvents = () => {
        this.svg
            .on("mousemove", (e, d) => {
                // console.log("svg mousemove ", this.selectMode, this.draggedNode);
                if (this.editMode) this.updateDragLine(e, d);
                if (this.selectMode && this.draggedNode) this.dragMove(e, d);
            })
            .on("mouseup", () => {
                if (this.editMode) this.hideDragLine();
                if (this.selectMode && this.draggedNode) this.dragEnd(e, d);
            })
            .on("mousedown", (e) => {
                if (this.editMode) {
                    if (this.isLinkDragged) {
                        this.isLinkDragged = false;
                        return;
                    }
                    this.createNewNode(d3.pointer(e)[0], d3.pointer(e)[1]);
                }
            })
    }

    setupGraphEvents() {
        this.graphVis.nodes
            .on("mousedown", (e, d) => {
                if (this.editMode) {
                    this.beginDragLine(e, d);
                } else if (this.selectMode) {
                    this.dragStart(e, d);
                }
            })
            .on("mouseup", (e, d) => {
                if (this.editMode) {
                    if (this.isLinkDragged) {
                        if (this.mousedownNode.id != d.id) this.createNewLink(this.mousedownNode, d);
                    }
                    this.isLinkDragged = false;
                } else if (this.selectMode) {
                    this.dragEnd(e, d);
                }
            })
            .on("click", (e, d) => {
                if (this.eraseMode) {
                    this.removeNode(d);
                }
            })

        this.graphVis.links
            .on("click", (e, d) => {
                if (this.eraseMode) {
                    // TODO
                    console.log(d);
                }
            })
    }

    dragStart = (e, d) => {
        this.draggedNode = d;
        console.log("start ", this.draggedNode);

        let [x, y] = d3.pointer(e);
        this.draggedNode.x = x;
        this.draggedNode.y = y;
    }

    dragMove = (e, d) => {
        console.log("move");
        let [x, y] = d3.pointer(e);
        this.draggedNode.x = x;
        this.draggedNode.y = y;
        // this.draggedNode.fx = x;
        // this.draggedNode.fy = y;
        // this.simulation.restart(1, 0);
        this.simulation.ticked();
    }

    dragEnd = (e, d, i) => {
        console.log("drag end")
        this.draggedNode = null;
    }

    beginDragLine(e, d) {
        e.stopPropagation();
        this.mousedownNode = d;
        this.isLinkDragged = true;

        this.dragLine
            .style("visibility", "visible")
            .attr(
                "d",
                "M" +
                (this.mousedownNode.x) +
                "," +
                (this.mousedownNode.y) +
                "L" +
                (this.mousedownNode.x) +
                "," +
                (this.mousedownNode.y)
            );
    }

    updateDragLine(e) {
        let coords = d3.pointer(e);
        if (!this.mousedownNode) return;
        this.dragLine
            .attr(
                "d",
                "M" +
                this.mousedownNode.x +
                "," +
                this.mousedownNode.y +
                "L" +
                (coords[0] - 2) +
                "," +
                (coords[1] - 2)
            )
    }

    hideDragLine() {
        this.dragLine
            .style("visibility", "hidden");
        this.isLinkDragged = false;
        this.mousedownNode = null;
    }


}