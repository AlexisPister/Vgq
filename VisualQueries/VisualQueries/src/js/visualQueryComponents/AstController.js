import * as cypherlib from "cypher-compiler-js";
import {stringify} from 'flatted';

export default class AstController {
    constructor(ast, updateCypherFromAstCb, updateAstFromCypherCb, errorAstCb) {
        this.ast = ast;
        this.updateCypherFromAstCb = updateCypherFromAstCb;
        this.updateAstFromCypherCb = updateAstFromCypherCb;
        this.errorAstCb = errorAstCb;

        this.isManualChange = true;
        this.isWidgetChange = false;
        this.error = false;

        this.provenanceManager = null;
    }

    setProvenanceManager(provenanceManager) {
        this.provenanceManager = provenanceManager;
    }

    setAstFromCypher(cypher, provenanceCall=false) {
        console.log("set AST from cypher");
        this.cypher = cypher;

        const tree = cypherlib.parseCypher(this.cypher, this.errorAstCb);
        this.ast = cypherlib.parsePatterns(tree);
        //
        if (!(this.error) && this.provenanceManager.started && this.isManualChange) {
            this.provenanceManager.apply(this.provenanceManager.customCypherAction("Cypher Change")(this.cypher));
        }

        this.updateAstFromCypherCb(provenanceCall);

        this.resetFlags();
    }

    parseCypherErrorCb = (err) => {
        this.error = true;
        this.errorAstCb(err);
    }

    constraintModification(performRequest = true) {
        this.isWidgetChange = true;
        this.cypher = this.ast.toCypher();
        this.updateCypherFromAstCb(performRequest);
    }

    graphModification() {
        this.isWidgetChange = false;
        this.cypher = this.ast.toCypher();
        this.updateCypherFromAstCb();
    }

    resetFlags() {
        this.error = false;
        this.isManualChange = false;
        this.isWidgetChange = false;
    }

    addLink(sourceId, targetId, edgeType, sourceType, targetType) {
        this.ast.addLink(sourceId, targetId, edgeType, sourceType, targetType);
        // this.graphModification();

        if (this.provenanceManager) {
            let actionLabel = this.provenanceManager.generateLinkCreationLabel(sourceId, targetId, edgeType)
            this.provenanceManager.apply(this.provenanceManager.customCypherAction(actionLabel)(this.ast.toCypher()));
            // this.provenanceManager.apply(this.provenanceManager.customAstAction(actionLabel)(stringify(this.ast)));
        }
    }

    removeNode(nodeId) {
        let isNodeRemoved = this.ast.removeNode(nodeId);
        // this.graphModification();

        if (this.provenanceManager && isNodeRemoved) {
            let actionLabel = `Remove Node ${nodeId}`
            this.provenanceManager.apply(this.provenanceManager.customCypherAction(actionLabel)(this.ast.toCypher()));
        }
    }
}