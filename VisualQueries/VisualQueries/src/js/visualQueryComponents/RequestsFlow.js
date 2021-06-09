import * as d3 from 'd3';

import {GraphData} from "../graph/graphData.js";
import {GraphVisSvg} from "../graphVis/GraphVisSvg.js";
import {SimulationSvg} from "../graphVis/simulationSvg.js";
import {colorPalette} from "./colorPalette.js";
import EntityTypeLegend from "./EntityTypeLegend.js";
import {globals} from "../globals.js";
import GraphCreator from "./GraphCreator.js";
import Legend from "../utils/legend.js";

export default class RequestFlow extends GraphCreator {
    constructor(svg) {
        super(svg);
        this.radius = 30;
    }

    initDefault() {
        let graphDefault = {
            "metadata": {
                "edgeType": "edgeType",
                "nodeType": "nodeType",
                "entityTypes": ["request"],
                // "attributes": [{"name": property.name, "type": property.type} for property in self.properties]
            },
            "nodes": [{"id": 1, "nodeType": "request", "x":10, "y":10}],
            "links": []
        }
        this.init(graphDefault);
    }


    initGraphVis() {
        let legend = new Legend(["request"], ["square"]);
        this.graphVis = new GraphVisSvg(this.graph, this.svg, this.radius, legend, false, false, false, false, null);
        this.graphVis.render();
    }

    createNewNode(x, y) {
        console.log("todo")
    }

    createNewLink(x, y) {
        console.log("todo")
    }

    removeNode(d) {
        console.log("todo")
    }
}