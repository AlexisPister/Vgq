class Globals {
    constructor() {
        this.LOCALHOST = true;

        if (this.LOCALHOST) {
            this.URL_BACKEND = new URL("http://127.0.0.1:10090");
        } else {
            this.URL_BACKEND = new URL("https://apister.lri.fr/vq");
        }

        if (this.LOCALHOST) {
            this.URL_CYPHER_REQUEST = new URL('http://127.0.0.1:10090/cypherMatch');
        } else {
            this.URL_CYPHER_REQUEST = new URL('https://apister.lri.fr/vq/cypherMatch');
        }

        if (this.LOCALHOST) {
            this.URL_ADJACENCY = new URL('http://127.0.0.1:10090/getAdjacency');
        } else {
            this.URL_ADJACENCY = new URL('https://apister.lri.fr/vq/getAdjacency');
        }

        this.ANY_EDGETYPE = "Any";
        this.ANY_NODETYPE = "Any";
        this.ANY_EDGETYPE_COLOR = "gray";

        this.SUBGRAPH_NODE_TYPE = "subgraph";


        this.FONT_SIZE = 12;
        this.RADIUS = 9;
        this.ARROW_LENGTH = 10;
        this.STROKESTYLE = "black";
        this.FILLSTYLE = "white";
        this.SHAPES = ["circle", "square"];

        this.SELECTION_COLOR = "#78afe5"
        this.UNHIGHLIGHT_OPACITY = 0.20;
    }
}

const globals = new Globals();
export {globals};
