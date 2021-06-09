import * as d3 from 'd3';

import ConstraintWidget from "./constraintWidget.js";

class categoricalConstraintWidget extends ConstraintWidget {
    constructor(constraint, domain, updateCb, removeCb) {
        super(constraint, domain, updateCb, removeCb)
        this.mainDiv.classed("categorical", true);

    }

    initWidget() {
        this.selectedValues = this.constraint.value ? (Array.isArray(this.constraint.value) ? this.constraint.value : [this.constraint.value]) : [];
        // this.selectedValues = this.constraint.value;
        super.initWidget();
        this.initCheckboxes();
    }

    initCheckboxes() {
        this.checkBoxesContainer = this.mainDiv

        this.domain.forEach((c) => {
            let checkbox = this.checkBoxesContainer
                .append("div")
                .classed("ui checkbox", true)

            let input = checkbox.append("input")
                .attr("type", "checkbox")
                .attr("value", c)

            if (this.selectedValues.includes(c)) {
                checkbox.classed("checked", true);
                input.attr("checked", "");
            }

            checkbox.append("label").html(c);
            this.checkBoxesContainer.append("span").html("  ");

            checkbox.on("click", (e) => {
                let domainValue = e.target.value;
                if (this.selectedValues.includes(domainValue)) {
                    this.selectedValues = this.selectedValues.filter(v => v != domainValue);
                } else {
                    this.selectedValues.push(domainValue);
                }
                this.update();
            });
        })
    }

    update() {
        super.update();
        this.constraint.update(this.selectedValues);
        this.updateCb();
    }
}

export {categoricalConstraintWidget};
