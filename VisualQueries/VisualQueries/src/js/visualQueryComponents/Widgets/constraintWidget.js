import * as d3 from 'd3';
import * as cypherlib from 'cypher-compiler-js';

export default class ConstraintWidget {
    constructor(constraint, domain, updateCb, removeCb) {
        this.constraint = constraint;
        this.domain = domain;
        this.property = this.constraint.property;
        this.entityId = this.constraint.entityId;
        this.updateCb = updateCb;
        this.removeCb = removeCb;

        this.mainDiv = d3.create("div")
            .classed("widget ui segment", true);

        this.initWidget();
        this.initCross();
    }

    static widgetClass(entityId, property) {
        return `widget-${entityId}-${property}`;
    }

    initWidget() {
        this.mainDiv
            .classed(ConstraintWidget.widgetClass(this.entityId, this.property), true)
            .append("label")
                .html(this.property)
        this.mainDiv.node().innerHTML += "&nbsp;&nbsp";
    }

    initCross() {
        this.closeButton = this.mainDiv
            .append("i")
            .classed("window close outline icon", true)
                .style("position", "absolute")
                .style("right", "10px")
            .on("click", (e) => {
                this.removeCb(this);
            });
    }

    initEvents() {
        //
    }

    update() {
        if (this.constraint instanceof cypherlib.SimpleConstraint) {
            this.constraint.treeNode.disabled = false;
        } else if (this.constraint instanceof cypherlib.IntervalConstraint) {
            this.constraint.treeNode1.disabled = false;
            this.constraint.treeNode2.disabled = false;
        }
    }
}