import * as d3 from 'd3';
import Sortable from 'sortablejs';
import * as cypherlib from 'cypher-compiler-js';

import {nominalConstraintWidget} from "./nominalConstraintWidget.js";
import {categoricalConstraintWidget} from "./categoricalConstraintWidget.js";
import {numericConstraintWidget} from "./numericConstraintWidget.js";

class EntityWidgets {
    static entityWidgetsClass(entityId) {
        return `entity-widgets-${entityId}`;
    }

    constructor(entityId, constraints, mainGraph, astController, provenanceManager) {
        this.entityId = entityId;
        this.constraints = constraints;
        this.mainGraph = mainGraph;
        this.astController = astController;
        this.provenanceManager = provenanceManager;

        this.widgets = [];

        this.containerElement = null;

        this.initContainer();
        this.initHeader();
        this.initWidgetsFromConstraints();
        this.initNewWidgetArea();

        this.sortable = null;
        this.render();
    }

    initContainer() {
        this.containerElement = d3.create("div")
            .classed("ui segments", true)
    }

    initHeader() {
        this.headerElement = d3.create("div")
            .classed("widget-header ui segment", true)
            .html(`<p>${this.entityId}</p>`)
    }

    initWidgetsFromConstraints() {
        this.constraints.forEach(constraint => {
            const propertyStats = this.mainGraph.propertiesStats[constraint.property];
            this.addWidget(constraint, propertyStats.type, propertyStats.domain)
        })
    }

    initNewWidgetArea() {
        let html = `<select>`
        html += ` <option value="Attribute">Attribute</option>`
        for (let attribute of this.mainGraph.attributes) {
            html += ` <option value="${attribute.name}">${attribute.name}</option>`
        }
        html += "</select>";

        this.widgetCreationDiv = d3.create("div")
            .classed("widget-creation", true)
            .classed("ui segment", true)
            .html(html)
            .on("change", this.createNewConstraintWidget)
    }

    createNewConstraintWidget = (e) => {
        let attribute = e.target.selectedOptions[0].label;
        if (attribute != "Attribute") {
            let attributeDomain = this.mainGraph.propertiesStats[attribute].domain;
            let type = this.mainGraph.propertiesStats[attribute].type;

            let constraint;
            if (type == "INTEGER" || type == "FLOAT") {
                constraint = new cypherlib.NumericSimpleConstraint(this.entityId, attribute, null, null, null, null);
            } else {
                constraint = new cypherlib.SimpleConstraint(this.entityId, attribute, null, null, null, null);
            }

            this.astController.ast.addSimpleConstraint(constraint, true);
            this.addWidget(constraint, type, attributeDomain);

            // console.log(this.astController.ast.toCypher());
        }
        this.render();
    }

    addWidget(constraint, type, domain) {
        let newWidget;
        if (type == "STRING") {
            if (domain.length > 30) {
                newWidget = new nominalConstraintWidget(constraint, domain, this.updateWidgetCb, this.removeWidget);
            } else { // Categorical variable
                newWidget = new categoricalConstraintWidget(constraint, domain, this.updateWidgetCb, this.removeWidget);
            }
        } else if (type == 'INTEGER' || type == 'FLOAT') {
            console.log("CONSTRAINT ", constraint);
            newWidget = new numericConstraintWidget(constraint, domain, this.updateWidgetCb, this.removeWidget);
        }
        this.widgets.push(newWidget);
    }

    updateWidgetCb = (trueChange = true) => {
        if (trueChange) {
            this.provenanceManager.apply(this.provenanceManager.newConstraintAction(this.astController.ast.toCypher()));
        } else {
            this.astController.constraintModification(false);
        }

        // this.provenanceManager.apply(this.provenanceManager.customAstAction("new Constraint")(this.astController.ast));
    }

    removeWidget = (widget) => {
        this.widgets = this.widgets.filter(w => w != widget);
        this.astController.ast.removeConstraint(widget.constraint);
        this.render();
        this.astController.constraintModification();
    }

    render() {
        this.containerElement
            .html("")
        this.containerElement.append(() => this.headerElement.node());

        this.nestedElementsContainer = this.containerElement
            .append("div")
            .classed(EntityWidgets.entityWidgetsClass(this.entityId), true)
            .classed("ui segments", true)

        this.widgets.forEach((widget) => {
            this.nestedElementsContainer.append(() => widget.mainDiv.node());
            widget.initEvents();
        });

        this.initNewWidgetArea();
        this.nestedElementsContainer.append(() => this.widgetCreationDiv.node());

        this.sortable = new Sortable(this.nestedElementsContainer.node(), {
            filterPrevent: false,
            animation: 150
        })

        $('.ui.dropdown')
            .dropdown();
    }
}

export {EntityWidgets};
