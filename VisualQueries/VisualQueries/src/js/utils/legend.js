import {globals} from "../globals.js";

export default class Legend {
    constructor(domainList, shapes = null) {
        this.domainList = domainList;

        this.legend = {};
        if (shapes) {
            if (domainList.length != shapes.length) {
                throw "domainList and shapes should have same length";
            }
            this.domainList.forEach((domainValue, i) => {
                this.legend[domainValue] = shapes[i]
            })
        }
    }

    initAutoShapeLegend() {
        let shapes = [...globals.SHAPES];

        // Person goes to circle by default
        if (this.domainList.includes("PERSON")) {
             this.legend["PERSON"] = "circle";
             shapes = shapes.filter(s => s != "circle");
        }

        for (let value of this.domainList) {
            if (value != "PERSON") {
                this.legend[value] = shapes.pop();
            }
        }

        this.legend[globals.ANY_NODETYPE] = "star";
    }
}