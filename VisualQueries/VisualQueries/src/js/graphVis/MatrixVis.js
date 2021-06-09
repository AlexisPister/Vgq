export default class MatrixVis {
    constructor(ctx, cellDim) {
        this.ctx = ctx;
        this.cellDim = cellDim;
    }

    render(adj, xCenter, yCenter) {
        this.length = adj.length;

        // this.ctx.strokeStyle = "black";
        // this.ctx.lineWidth = 1;
        // console.log("length ", this.length)

        for (let j = 0; j < this.length; j++) {
            for (let i = 0; i < this.length; i++) {
                if (adj[j][i] != 0) {
                    this.ctx.fillStyle = "black";
                } else {
                    this.ctx.fillStyle = "white";
                }
                // this.ctx.rect(this.compute_x(xCenter, i), this.compute_x(yCenter, j), this.cellDim, this.cellDim)
                this.ctx.fillRect(this.compute_x(xCenter, i), this.compute_x(yCenter, j), this.cellDim, this.cellDim)
            }
        }
    }

    compute_x(xCenter, i) {
        return xCenter + (i * this.cellDim) - ((this.length / 2) * this.cellDim)
    }
}