import {globals} from "../globals.js";

export default class GroupByTransformer {
    constructor() {
        //
    }

    groupNodesBySubgraphs() {
        this.nodesToSubgraphs = {};
        this.subgraphs.forEach((subgraph, i) => {

            let subgraphNode = this.subgraphToNode(subgraph, i);
            this.graph.nodesRendered.push(subgraphNode);

            Object.values(subgraph).forEach(entity => {
                if (entity["type"] == "node") {
                    let id = entity.id;
                    if (this.nodesToSubgraphs[id]) {
                        this.nodesToSubgraphs[id].push(subgraphNode);
                    } else {
                        this.nodesToSubgraphs[id] = [subgraphNode];
                    }
                }
            })
        })
    }

    generateSubgraphId(i){
        return `s${i}`;
    }

    // createSubgraphNodes() {
    //     this.subgraphs.forEach((subgraph, i) => {
    //         this.graph.nodesRendered.push(this.subgraphToNode(subgraph, i))
    //     })
    // }

    subgraphToNode(subgraph, index) {
        let nodeSubgraph = {
            id: this.generateSubgraphId(index),
            [this.graph.entityTypeKey]: globals.SUBGRAPH_NODE_TYPE,
            highlighted: true
        };

        // this.findSubgraphCoordinates(subgraph, nodeSubgraph);
        return nodeSubgraph;
    }

    // Get the "fx" value of any node of the subgraph for the new subgraph node. This work for the grouping by act.
    findSubgraphCoordinates(subgraph, nodeSubgraph) {
        Object.values(subgraph).forEach(entity => {
            if (entity.type == "node") {
                let node = this.graph.idToNode[entity.id];
                if (node["fx"]) {
                    nodeSubgraph["fx"] = node["fx"];
                }
                if (node["date_year"]) {
                    nodeSubgraph["date_year"] = node["date_year"];
                }
            }
        })
    }

    createSubgraphLinks() {
        for (let subgraphs of Object.values(this.nodesToSubgraphs)) {
            subgraphs.sort((s1, s2) => {
                return this.findSubgraphDate(s1) - this.findSubgraphDate(s2);
            })
            this.createLinksBetweenNodes(subgraphs);
        }
    }

    findSubgraphDate(subgraph) {
        if (subgraph["date_year"]){
            return subgraph["date_year"];
        } else {
            return 0;
        }
    }

    createLinksBetweenNodes(nodes) {
        // this.createCliques(nodes);
        this.createTemporalLine(nodes);
    }

    createCliques(nodes) {
        for (let i = 0; i < nodes.length - 1; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                let link = {
                   "source": nodes[i],
                   "target": nodes[j],
                    highlighted: true,
                    [this.graph.edgeTypeKey]: "duplication"
                }
                this.graph.linksRendered.push(link);
            }
        }
    }

    createTemporalLine(nodes) {
        for (let i = 0; i < nodes.length - 1; i++) {
            let link = {
               "source": nodes[i].id,
               "target": nodes[i + 1].id,
                highlighted: true,
                [this.graph.edgeTypeKey]: "duplication"
            }
            this.graph.linksRendered.push(link);
        }
    }

    run(graph, subgraphs, nodes, links) {
        this.graph = graph;
        this.graph.reset();
        this.subgraphs = subgraphs;

        this.groupNodesBySubgraphs();
        // this.createSubgraphNodes();
        this.createSubgraphLinks();

        console.log("to remove ", nodes);
        graph.removeNodes(nodes, true);
        // console.log("group finish");
        // console.log("nodesrendered ",graph.nodesRendered)
        // console.log("nodesrendered ",graph.linksRendered)
        console.log("group finished ", graph.nodesRendered, graph.linksRendered);
    }
}