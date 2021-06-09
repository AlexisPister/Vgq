import * as d3 from 'd3';

class Selections {
    constructor(graph, graph_vis, simulation, graphPaint, cbUpdateDataset) {
        this.graph = graph;
        this.graph_vis = graph_vis;
        this.simulation = simulation;
        this.graphPaint = graphPaint;
        this.cbUpdateDataset = cbUpdateDataset;

        this.groupBy = d3.select('#group-by');
        this.fileUpload = d3.select('#input-file');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.groupBy.on('change', (e) => {
            let attributeSelected = e.target.value;

            this.graph.groupByOneValue(attributeSelected, 1);

            this.graph_vis.nodes_render();
            this.graph_vis.links_render();

            this.simulation.start();
            // this.simulation.restart(1);
        })

        this.fileUpload.on('change', (e) => {
            let file = e.target.files[0];

            let reader = new FileReader()
            reader.readAsText(file);

            reader.onload = () => {
                let text = reader.result.toString();
                let data = JSON.parse(text);
                this.cbUpdateDataset(data);
            }
        });
    }

}

export {Selections};