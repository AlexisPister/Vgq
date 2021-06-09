import * as d3 from 'd3';

import ConstraintWidget from "./constraintWidget.js";

class nominalConstraintWidget extends ConstraintWidget {
    constructor(constraint, domain, updateCb, removeCb) {
        super(constraint, domain, updateCb, removeCb);
        this.mainDiv.classed("nominal", true)
        this.selectedValues = constraint.value ? (Array.isArray(constraint.value) ? constraint.value : [constraint.value]) : [];
        this.fillWithSelectedValue();
    }

    initWidget() {
        super.initWidget();

        this.mainDiv
            .append("input")
            .attr("size", "5")
                .on("change", (e) => {
                    let newValue = e.target.value;
                    if (!this.selectedValues.includes(newValue)) {
                        this.addNewValue(newValue);
                    }
                })

        this.mainDiv.append("span").html("  ");

        this.enteredValueDiv = this.mainDiv
            .append("div")
            .style("display", "inline")

        // this.enteredValueDiv = this.mainDiv
        //     .append("div")
        //     .classed("ui stackable column grid", true)
    }

    addNewValue(newValue) {
        this.selectedValues.push(`${newValue}`);
        this.valueToDiv(newValue);
        this.update();
    }

    valueToDiv(value) {
        this.enteredValueDiv
            .append("div")
                .html(value)
            .classed("ui label", true)
    }

    fillWithSelectedValue() {
        if (this.selectedValues.length > 0) {
            this.selectedValues.forEach(v => {
                this.valueToDiv(v);
            })
        }
    }

    update() {
        super.update();
        this.constraint.update(this.selectedValues);
        this.updateCb();
    }
}

export {nominalConstraintWidget}


