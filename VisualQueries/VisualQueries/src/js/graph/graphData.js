import {globals} from "../globals.js";
import {generateUndirectedLinkId} from "../utils/utils.js";
import GroupByTransformer from "./groupByTransformer";

class GraphData {
    constructor(data) {
        this.loadData(data);
    }

    loadData(data){
        this.data = data;
        this.metadata = this.data["metadata"];
        this.attributes = this.metadata["attributes"];
        this.edgeTypeKey = this.metadata["edgeType"];
        this.entityTypeKey = this.metadata["nodeType"];
        this.entityTypes = this.metadata["entityTypes"];
        this.edgeTypes = [];

        this.nodes = data['nodes'];
        this.links = data['links'];
        this.nodesRendered = JSON.parse(JSON.stringify(this.nodes));
        this.linksRendered = JSON.parse(JSON.stringify(this.links));
        this.nodesByTypes = {};

        this.idToNode = null;
        this.createIdToNodeMap();
        this.setSourceTargetsAsReferences();

        console.log(this.nodesRendered);
        console.log(this.linksRendered);

        this.nodeIdsToindex = {};
        this.adj = [];
        this.createAdj();

        this.findEdgeTypes();
    }

    reset() {
        this.nodesRendered = JSON.parse(JSON.stringify(this.nodes));
        this.linksRendered = JSON.parse(JSON.stringify(this.links));
        this.setSourceTargetsAsReferences();
    }

    entityIds() {
        this.nodesIds = this.nodes.map(n => n.id);
        this.linksIds = this.links.map(l => l.id ? l.id : null);

        return this.nodesIds.concat(this.linksIds);
    }

    addNode(node) {
        this.nodes.push(node);
        this.nodesRendered.push(node);
        this.idToNode[node.id] = node;
    }

    removeNode(nodeId, onlyRendering=false) {
        if (!onlyRendering) {
            this.nodes = this.nodes.filter(node => node.id != nodeId);
            this.links = this.links.filter(link => link.source != nodeId && link.target != nodeId)
        }

        this.nodesRendered = this.nodesRendered.filter(node => node.id != nodeId);
        this.linksRendered = this.linksRendered.filter(link => link.source.id != nodeId && link.target.id != nodeId)
    }

    removeNodes(nodesIds, onlyRendering=false) {
        if (!onlyRendering) {
            this.nodes = this.nodes.filter(node => !nodesIds.includes(node));
            this.links = this.links.filter(link => !nodesIds.includes(link.source) && !nodesIds.includes(link.target))
        }

        this.nodesRendered = this.nodesRendered.filter(node => !nodesIds.includes(node.id));
        this.linksRendered = this.linksRendered.filter(link => !(nodesIds.includes(link.source.id)) && !(nodesIds.includes(link.target.id)))
    }

    initPropertiesStats(propertiesStats) {
        this.propertiesStats = {};
        propertiesStats.forEach((ps) => {
            this.propertiesStats[ps.name] = ps
        });

        console.log("stats ", this.propertiesStats);
    }

    getNodesByType(nodeType) {
        let nodes;
        if (nodeType) {
            nodes = this.nodesRendered.filter((n) => n[this.entityTypeKey] == nodeType);
        } else {
            nodes = this.nodesRendered.filter((n) => !(n[this.entityTypeKey]) || n[this.entityTypeKey] == globals.ANY_NODETYPE);
        }

        // if (this.nodesByTypes[nodeType]) {
        //     let nodesByTypeStr = this.nodesByTypes[nodeType].map((n) => JSON.stringify(n));
        //     nodes.forEach((n) => {
        //         if (!(nodesByTypeStr.contains(JSON.stringify(n)))) {
        //             this.nodesByTypes[nodeType].push(n)
        //         }
        //     })
        // }
        //  else {
        //     this.nodesByTypes[nodeType] = nodes;
        // }
        this.nodesByTypes[nodeType] = nodes;
        return this.nodesByTypes[nodeType];
    }

    setSourceTargetsAsReferences() {
        this.linksRendered.forEach(link => {
            link["source"] = this.idToNode[link["source"]];
            link["target"] = this.idToNode[link["target"]];
        })
    }

    createIdToNodeMap() {
        this.idToNode = {};
        this.nodesRendered.forEach((n) => {
            this.idToNode[n.id] = n;
        })
        // this.nodes.forEach((n) => {
        //     this.idToNode[n.id] = n;
        // })
    }

    linkRepetitionCount() {
        this.linkCount = {};
        this.linksRendered.forEach((link) => {
            // let linkId = link.source.id.toString() + "-"  + link.target.id.toString();
            let linkId = generateUndirectedLinkId(link.source.id, link.target.id);
            if (this.linkCount[linkId] == undefined) {
                this.linkCount[linkId] = 1;
            } else {
                this.linkCount[linkId] += 1;
            }
        })
    }

    createAdj(){
        this.nodeIdsToindex = {}
        let index = 0;
        this.nodes.forEach(node => {
            this.nodeIdsToindex[node.id] = index;
            index += 1;
        })

        this.adj = [];
        this.nodes.forEach(n => {
            this.adj.push([]);
        })

        this.links.forEach((link) => {
            this.adj[this.nodeIdsToindex[link["source"]]][this.nodeIdsToindex[link["target"]]] = 1;
        })
    }

    computeInducedAdj(nodes){
        let inducedAdj = this.adj
            .filter((el, ind) => nodes.includes(ind))
            .map(list => list.filter((el, ind) => nodes.includes(ind)))

        return inducedAdj
    }

    findEdgeTypes(){
        this.links.forEach((link) => {
            if (!this.edgeTypes.includes(link[this.edgeTypeKey])) this.edgeTypes.push(link[this.edgeTypeKey]);
        })
    }

    // groupBy(attribute){
    //     let group = d3.rollup(this.nodesRendered, (v) => v.length, (d) => d[attribute]);
    //     console.log(group);
    // }

    groupByOneValue(attribute, value) {
        let removedNodes = [];
        for (let i = this.nodesRendered.length - 1; i > -1; i-- ){
            if (this.nodesRendered[i][attribute] == value){
                let removedNode = this.nodesRendered.splice(i, 1)[0];
                removedNodes.push(removedNode);
            }
        }

        let removedNodesIds = removedNodes.map((node) => node.id);

        let removedEdges = [];
        for (let i = this.linksRendered.length - 1; i > -1; i-- ){
            if (this.linksRendered[i].source[attribute] == value || this.linksRendered[i].target[attribute] == value) {
                let removedEdge = this.linksRendered.splice(i, 1)[0];
                removedEdges.push(removedEdge);
            }
        }

        let groupNode = {'id': 'group' + value, 'group': value};
        this.nodesRendered.push(groupNode);

        removedEdges.forEach((edge) => {
            let n1 = edge.source
            let n2 = edge.target
            if (removedNodesIds.includes(n1.id) && removedNodesIds.includes(n2.id)) {
                console.log('no');
            } else if (removedNodesIds.includes(n1.d)) {
                let edgeNodeToGroup = {'source': groupNode.id, 'target': n2, 'value': 1};
                this.linksRendered.push(edgeNodeToGroup);
            } else if (removedNodesIds.includes(n2.id)) {
                let edgeNodeToGroup = {'source': groupNode.id, 'target': n1, 'value': 1};
                this.linksRendered.push(edgeNodeToGroup);
            }
        });

    }

    groupBySubgraphs(subgraphs, nodes, links) {
        let transformer = new GroupByTransformer()
        transformer.run(this, subgraphs, nodes, links);
    }
}


export {GraphData};