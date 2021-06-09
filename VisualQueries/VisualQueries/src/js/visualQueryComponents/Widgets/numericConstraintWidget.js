import * as d3 from 'd3';

// Parcel need require to import jquery-ui
require("jquery-ui-bundle");
import * as cypherlib from 'cypher-compiler-js';

import ConstraintWidget from "./constraintWidget.js";

class numericConstraintWidget extends ConstraintWidget {
    constructor(constraint, domain, updateCb, removeCb) {
        console.log("constraint: ", constraint);
        super(constraint, domain, updateCb, removeCb);
        this.mainDiv.classed("numeric", true);
    }

    initWidget() {
        super.initWidget();
        this.getInitValues();
        this.initBoundsElements();

        this.sliderId = `slider-${this.entityId}-${this.property}`

        this.slider = document.createElement("div");
        this.slider.id = this.sliderId;
        this.mainDiv.node().appendChild(this.slider);
    }

    initBoundsElements() {
        this.lowerBoundElement = d3.create("span")
            .html(this.lowerInit)

        this.upperBoundElement = d3.create("span")
            .html(this.upperInit)

        this.mainDiv.append(() => this.lowerBoundElement.node());
        this.mainDiv.append("span").html(" - ");
        this.mainDiv.append(() => this.upperBoundElement.node());
    }

    initEvents() {
        $(`#${this.sliderId}`).slider({
            range: true,
            min: this.domain[0],
            max: this.domain[1],
            values: [this.lowerInit, this.upperInit],
            stop: (e, ui) => {
                this.updateCb(true);
            },
            slide: ( event, ui ) => {
                this.lowerBoundElement.node().innerHTML = ui.values[0];
                this.upperBoundElement.node().innerHTML = ui.values[1];
                this.update(ui.values[0], ui.values[1]);
            }
        });
    }

    getInitValues() {
        if (this.constraint instanceof cypherlib.IntervalConstraint) {
            this.lowerInit = this.constraint.value[0];
            this.upperInit = this.constraint.value[1];
        } else if (this.constraint.value == null) {
            this.lowerInit = this.domain[0];
            this.upperInit = this.domain[1];
        } else if (this.constraint.op == "<") {
            this.lowerInit = this.domain[0];
            this.upperInit = this.constraint.value;
        } else if (this.constraint == ">") {
            this.lowerInit = this.constraint.value;
            this.upperInit = this.domain[0];
        }

        if (this.lowerInit < this.domain[0]) {
            this.lowerInit = this.domain[0]
        }
        if (this.upperInit > this.domain[1]) {
            this.upperInit = this.domain[1]
        }
    }

    update(lower, upper) {
        super.update();

        console.log("UPDATE", this.constraint);
        this.constraint.update(upper, lower);
        this.updateCb(false);
    }
}

export {numericConstraintWidget}