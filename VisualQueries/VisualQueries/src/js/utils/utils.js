function p() {
    console.log.apply(console, arguments);
}

// Array.prototype.contains = function(element){
//     return this.indexOf(element) > -1;
// }

// const request = async (fp) => {
//     const response = await fetch(fp);
//     const json = await response.json();
//     return json;
// }

export function generateUndirectedLinkId(node1, node2) {
    if (parseInt(node1) < parseInt(node2)) {
        return node1.toString() + "-" + node2.toString();
    } else {
        return node2.toString() + "-" + node1.toString();
    }
}

export function generateEntityClassName(entityId) {
    return `node-${entityId}`
}

// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
// const colorShade = (col, amt) => {
//   col = col.replace(/^#/, '')
//   if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2]
//
//   let [r, g, b] = col.match(/.{2}/g);
//   ([r, g, b] = [parseInt(r, 16) + amt, parseInt(g, 16) + amt, parseInt(b, 16) + amt])
//
//   r = Math.max(Math.min(255, r), 0).toString(16)
//   g = Math.max(Math.min(255, g), 0).toString(16)
//   b = Math.max(Math.min(255, b), 0).toString(16)
//
//   const rr = (r.length < 2 ? '0' : '') + r
//   const gg = (g.length < 2 ? '0' : '') + g
//   const bb = (b.length < 2 ? '0' : '') + b
//
//   return `#${rr}${gg}${bb}`
// }