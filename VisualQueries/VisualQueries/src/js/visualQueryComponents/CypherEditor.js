import * as d3 from 'd3';
import * as cypherlib from 'cypher-compiler-js';
import CodeMirror from "codemirror";
import '../../../node_modules/codemirror/mode/cypher/cypher.js'
import "../../../node_modules/codemirror/addon/search/searchcursor.js";

export default class CypherEditor {
    constructor(updateAstCb, astController, provenanceManager) {
        this.updateAstCb = updateAstCb;
        this.astController = astController;
        this.provenanceManager = provenanceManager;

        this.error = false;
        this.errorDiv = d3.select("#cypher-error");

        this.textArea = document.getElementById("script-request-input");

        this.cypher = this.textArea.textContent;
        this.astController.cypher = this.cypher;

        // if (codeMirror == null) {
            this.codeMirror = CodeMirror.fromTextArea(this.textArea, {
                lineNumbers: true,
                lineWrapping: true,
                viewportMargin: 50,
                mode: "cypher",
                // height: "auto"
            });
        // } else {
        //     this.codeMirror = codeMirror
        // }
        this.codeMirrorMarks = [];

        this.inputSelection = d3.select("#script-request-input");
        this.errorSelection = d3.select("#cypher-error");
        this.setupEvents();
    }

    start() {
        this.cypherChange();
    }

    changeCypher(cypher) {
        this.astController.isManualChange = false;
        this.codeMirror.getDoc().setValue(cypher);
    }

    setupEvents(){
         this.codeMirror.on("change", (e,d) => {
             this.astController.isManualChange = d.origin == "setValue" ? false : true;
             // console.log("trusted ", e, d, e.isTrusted, e.originalEvent, e.screenX);
             this.cypherChange();
        })
    }

    cypherChange() {
        this.errorSelection.node().textContent = "";
        this.cypher = this.codeMirror.getValue();

        console.log('cypher change ', this.cypher);
        if (this.astController.isManualChange) {
            try {
                this.astController.setAstFromCypher(this.cypher);
            } catch (err) {
                console.log(err);
                this.astController.error = true;
                if (err instanceof TypeError) {
                    this.errorDiv
                        .html("Error in Ast processing")
                } else {
                    console.log("TODO");
                }
            }
        }

        // this.astController.resetFlags();
        // this.astController.error = false;
    }

    cypherErrorCb = (err) => {
        this.astController.error = true;
        this.errorSelection.node().textContent = err;
    }

    highlightCypherPart(entityId) {
        let regexStr = `\\(${entityId}\\)|\\(${entityId}[:{][^)]*\\)`;
        let regex = new RegExp(regexStr);
        let mark;
        let cursor = this.codeMirror.getSearchCursor(regex);
        while(cursor.findNext()) {
            mark = this.codeMirror.markText(
              cursor.from(),
              cursor.to(),
              { className: "highlight"}
            );
            this.codeMirrorMarks.push(mark);
        }
    }

    unhighlightCypherPart(entityId) {
        this.codeMirrorMarks.forEach(mark => mark.clear());
    }

}