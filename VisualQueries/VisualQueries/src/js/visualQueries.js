// import 'isomorphic-fetch';
import 'regenerator-runtime/runtime';
import * as d3 from "d3";

import {GraphData} from "./graph/graphData.js";
import {StaticGraphVisCanvas} from "./graphVis/StaticGraphVisCanvas.js";
import {Simulation} from "./graphVis/simulation.js";
import {Selections} from "./html_selection.js";
import {QueryStateManager} from "./visualQueryComponents/QueryStateManager.js";
import {globals} from './globals.js';
import DynamicGraphVisCanvas from "./graphVis/DynamicGraphVisCanvas.js";


class VisualQueries {
    constructor() {
        this.mainCanvas = d3.select("#canvas-main");
    }

    init = (data, properties) => {
        console.log("properties ", properties);
        this.data = data;
        this.graph = new GraphData(this.data);
        this.graph.initPropertiesStats(properties);
        // this.uploadDataBackend();

        this.graphVis = new StaticGraphVisCanvas(this.graph, this.mainCanvas, true, true);
        this.graphVis.render();

        this.simulation = new Simulation(this.graph, this.graphVis, this.mainCanvas);
        this.simulation.init();
        this.simulation.start();

        if (this.queryStateManager) {
            this.queryStateManager.codeMirror.toTextArea();
        }
        this.queryStateManager = new QueryStateManager(this.graph, this.graphVis);

        this.graphVis.render();
    }

    initDynamicLayout(data) {
        this.dynamicCanvas = d3.select("#canvas-dynamic-graph");
        this.dynamicGraphData = new GraphData(data);
        console.log("dynamic graph", this.dynamicGraphData);
        this.dynamicVis = new DynamicGraphVisCanvas(this.dynamicGraphData, this.dynamicCanvas, true, true);
        this.dynamicVis.render();
    }

    setupEvents() {
        this.selections = new Selections(this.graph, this.graphVis, this.simulation, this.graphPaint, this.init);
    }

    uploadDataBackend() {
        let urlLoadData = new URL(globals.URL_BACKEND);
        urlLoadData.pathname = urlLoadData.pathname + "/loadData";

        fetch(urlLoadData.toString(), {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "mainGraph": this.graph.data,
                "edgeTypes": this.graph.edgeTypes,
                "edgeTypeKey": this.graph.edgeTypeKey
            })
        })
    }

    async loadDataFromNeo4j() {
        let urlLoadData = new URL(globals.URL_BACKEND);
        urlLoadData.pathname = urlLoadData.pathname + "/getDatabaseJson";

        fetch(urlLoadData.toString(), {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(r => {
            return r.json()
        })
        .then(json => {
            this.init(json["data"], json["properties"]);
            // this.graph.initPropertiesStats(json);
        })


        let urlLoadDynamicLayout = new URL(globals.URL_BACKEND);
        urlLoadDynamicLayout.pathname = urlLoadDynamicLayout.pathname + "/getDynamicLayout";
        fetch(urlLoadDynamicLayout.toString(), {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(r => {
            return r.json()
        })
        .then(json => {
            // this.initDynamicLayout(json);
        })
    }

    loadPropertiesStatsFromNeo4j() {
        let urlLoadData = new URL(globals.URL_BACKEND);
        urlLoadData.pathname = urlLoadData.pathname + "/getProperties";

        fetch(urlLoadData.toString(), {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(r => {
            return r.json()
        })
        .then(json => {
            this.graph.initPropertiesStats(json);
        })
    }
}

export {VisualQueries}