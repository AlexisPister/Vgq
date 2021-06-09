export default class DraggableDiv {
    constructor(element, headerText) {
        this.element = element;
        this.element.classList.add("draggable")
        this.headerText = headerText;
        this.setupHeader()
        this.pos1, this.pos2, this.pos3, this.pos4 = 0;
    }

    setupHeader() {
        this.headerElement = document.createElement("div");
        this.headerElement.classList.add("draggable-header")
        this.headerElement.appendChild(document.createTextNode(this.headerText));
        this.headerElement.onmousedown = this.dragMouseDown
        this.element.appendChild(this.headerElement);
    }

    dragMouseDown = (e) => {
        e.preventDefault();
        // get the mouse cursor position at startup:
        this.pos3 = e.clientX;
        this.pos4 = e.clientY;
        document.onmouseup = this.closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = this.elementDrag;
    }

    elementDrag = (e) => {
        e.preventDefault();
        // calculate the new cursor position:
        this.pos1 = this.pos3 - e.clientX;
        this.pos2 = this.pos4 - e.clientY;
        this.pos3 = e.clientX;
        this.pos4 = e.clientY;
        // set the element's new position:
        this.element.style.top = (this.element.offsetTop - this.pos2) + "px";
        this.element.style.left = (this.element.offsetLeft - this.pos1) + "px";
    }

    closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }

    setupEntityTypes(entityTypesLegend, shapeToSvg) {
        for (const [entityType, shape] of Object.entries(entityTypesLegend)) {
            let entityTypeLegend = document.createElement("div");
            entityTypeLegend.appendChild(document.createTextNode(entityType));

            let svgShape = shapeToSvg[shape];
            entityTypeLegend.appendChild(svgShape);

            this.element.appendChild(entityTypeLegend);
        }
    }
}