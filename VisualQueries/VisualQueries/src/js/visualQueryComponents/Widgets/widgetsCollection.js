import * as d3 from 'd3';

import {EntityWidgets} from "./entityWidgets.js";

export default class WidgetsCollection {
    constructor(element, graph, graphPaint, astController, provenanceManager) {
        this.containerElement = element;
        this.mainGraph = graph;
        this.graphPaint = graphPaint;
        this.astController = astController;
        this.provenanceManager = provenanceManager;

        this.entityWidgetsList = [];
    }

    entityWidgetsIds() {
        return this.entityWidgetsList.map(e => e.entityId);
    }

    initFromConstraints(constraintsCollection) {
        this.entityWidgetsList = [];

        this.constraintsCollection = constraintsCollection;
        for (const entity in this.constraintsCollection.entityToConstraints) {
            let constraints =  this.constraintsCollection.entityToConstraints[entity];
            let entityWidgets = new EntityWidgets(entity, constraints, this.mainGraph, this.astController, this.provenanceManager);
            this.entityWidgetsList.push(entityWidgets);
        }
    }

    initNewWidgetArea() {
        let html = `<select>`

        html += `<option value='Entity'>Entity</option>`
        for (let entityId of this.graphPaint.graph.entityIds()) {
            if (!(this.entityWidgetsIds().includes(entityId))) {
                html += ` <option value="${entityId}">${entityId}</option>`
            }
        }
        html += "</select>";

        this.entityWidgetsCreationDiv = d3.create("div")
            .classed("entity-widgets-creation", true)
            .classed("ui segment", true)
            .html(html)
            .on("change", this.newEntityWidgetsCb)
    }

    newEntityWidgetsCb = (e) => {
        let entityId = e.target.selectedOptions[0].label;
        if (entityId != "Entity") {
            let entityWidgets = new EntityWidgets(entityId, [], this.mainGraph, this.astController, this.provenanceManager);
            this.entityWidgetsList.push(entityWidgets);
        }

        this.render();
    }

    render() {
        this.containerElement.html("");

        this.nestedContainerElement = this.containerElement
            .append("div")
            .classed("ui segments", true)

        this.entityWidgetsList.forEach((entityWidgets) => {
            this.nestedContainerElement.append(() => entityWidgets.containerElement.node());
            entityWidgets.render();
            // this.nestedContainerElement.append("br")
        });

        this.initNewWidgetArea();
        this.nestedContainerElement.append(() => this.entityWidgetsCreationDiv.node());
    }
}