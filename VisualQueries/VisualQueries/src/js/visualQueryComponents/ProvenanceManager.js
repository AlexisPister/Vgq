import {
  initProvenance, Provenance, NodeID, createAction,
} from '@visdesignlab/trrack';
import { ProvVisCreator } from '@visdesignlab/trrack-vis';
import {parse, stringify} from 'flatted';



class NodeState {
    constructor(ast, cypher) {
        this.ast = ast;
        this.cypher = cypher;
    }
}

// TODO : Currently at each new state, the ast is recreated from the cypher.
export default class ProvenanceManager {
    constructor(astController, cypherEditor) {
        this.astController = astController;
        this.cypherEditor = cypherEditor;
        this.started = false;
    }

    init() {
        this.provenance = this.setupProvenance();
        this.graph = this.provenance.graph;
        this.setupObservers();
        this.provenance.done();
        this.started = true;
    }

    setupProvenance() {
        this.initialState = this.initState();
        const provenance = initProvenance(this.initialState);
        return provenance;
    }

    initState() {
        return new NodeState(null, this.astController.cypher);
        // return new NodeState(stringify(this.astController.ast), this.astController.cypher);
    }

    apply(action) {
        this.provenance.apply(action);
    }

    createNodeAction = createAction((state, ast) => {
        state.ast = ast;
    }).setLabel("Create Node")

    changeCypherAction = createAction((state, cypher) => {
        state.cypher = cypher;
    }).setLabel("Cypher Change");

    newConstraintAction = createAction((state, cypher) => {
        state.cypher = cypher;
    }).setLabel("New constraint");

    newLinkAction = createAction((state, cypher) => {
        state.cypher = cypher;
    }).setLabel("New Link")

    customCypherAction = (label) => {
        return createAction((state, cypher) => {
            state.cypher = cypher;
        }).setLabel(label)
    }

    customAstAction = (label) => {
        return createAction((state, ast) => {
            state.ast = ast;
        }).setLabel(label)
    }

    generateLinkCreationLabel(sourceId, targetId, type) {
        let typeStr = type ? `[:${type}]` : ""
        return `New Link ${sourceId}--${targetId}`;

        // TODO : not enough space to show big sentences
        // return `New Link ${sourceId}-${typeStr}-${targetId}`;
    }

    // TODO : AST is currently not JSON serializable because of the Scopes and Constraints. So it cannot be used as a state variable.
    setupObservers() {
        this.provenance.addObserver(
            (state) => state.ast,
            (state) => {
                this.astController.ast = parse(state);
                this.astController.constraintModification();
            }
        )

        this.provenance.addObserver(
            (state) => state.cypher,
            (cypher) => {
                console.log("observer", this.astController.isManualChange);

                if (!this.astController.isManualChange) {
                    this.astController.isWidgetChange = false;
                    this.astController.isManualChange = false;
                    this.astController.setAstFromCypher(cypher, true);
                }
            }
        )
    }

    isFinalNode() {
        console.log("nodes ", Object.keys(this.graph.nodes));
        let allNodes = Object.keys(this.graph.nodes);
        // return this.graph.nodes[this.graph.current] == allNodes[allNodes.length - 1];
        return this.graph.current == allNodes[allNodes.length - 1];

        // if (this.graph.nodes[this.graph.current].children.length == 0) {
        //     return true;
        // } else {
        //     return false;
        // }
    }

    setupGraphVis() {
        ProvVisCreator(document.getElementById('provenance-tree'), this.provenance, (id) => {
            this.provenance.goToNode(id);
        });
    }
}