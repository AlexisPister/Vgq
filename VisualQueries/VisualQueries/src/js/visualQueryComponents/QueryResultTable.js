import * as d3 from 'd3';

// Semantic Ui Style is not working
import 'datatables.net-dt/css/jquery.dataTables.css';
import 'datatables.net-buttons-dt/css/buttons.dataTables.css';
// import 'datatables.net-se/css/dataTables.semanticui.css';
// import 'datatables.net-jqui/css/dataTables.jqueryui.min.css';

// import * as JSZip from 'jszip';
var $       = require( 'jquery' );
var dt      = require( 'datatables.net' )();
var buttons = require( 'datatables.net-buttons' )();
require( 'datatables.net-buttons/js/buttons.colVis.js' )();
require( 'datatables.net-buttons/js/buttons.html5.js' )();
require( 'datatables.net-buttons/js/buttons.flash.js' )();
require( 'datatables.net-buttons/js/buttons.print.js' )();
// import 'datatables.net-buttons';

class QueryResultTable {
    constructor(mainGraphVis) {
        this.mainGraphVis = mainGraphVis;
        this.queryResult = null;
        this.queryEntitiesIds = [];
        this.queryNodesIds = null;
        this.nNodes = null;

        // the width specification of DataTable do no seem to work, this hack works for now
        this.detailsColumnWidth = "50px";
        this.detailsColumnTrueWidth = "85px";

        this.tableElementSelector = "#query-result-datatable";
    }

    initQueryResult(queryResult) {
        this.queryResult = queryResult;
        if (this.queryResult.length > 0) {
            this.queryEntitiesIds = Object.keys(this.queryResult[0]);
            this.findQueryNodesIds();
            this.nNodes = this.queryNodesIds.length;
            this.widthPercent = 100 / this.queryEntitiesIds.length;
        }
    }

    findQueryNodesIds() {
        this.queryNodesIds = [];
        Object.entries(this.queryResult[0]).forEach((d) => {
            const [entityId, match] = d;
            if (!("relation_type" in match)) {
                this.queryNodesIds.push(entityId);
            }
        })
    }

    queryResultToTableColumns() {
        let columns = this.queryEntitiesIds.map((entityId) => {
            return {
                title: entityId,
                data: "",
                width: this.widthPercent + "%",
                render: (data, type, full, meta) => {
                    const properties = full[entityId]
                    let cellContent;
                    if (properties["relation_type"]) {
                        cellContent = full[entityId].relation_type;
                    } else if (properties["name"]){
                        cellContent = full[entityId].name;
                    } else if (properties["labels"]){
                        cellContent = full[entityId].labels[0];
                    }

                    let id = full[entityId]["id"] ? ` (${full[entityId].id})` : ""
                    cellContent = cellContent += id;
                    return cellContent
                }
            }
        })

        // detail button column
        columns.unshift({
            "width": this.detailsColumnWidth,
            "className": "details-control",
            "class": "details-control",
            "orderable": false,
            "data": null,
            "defaultContent": "",
            "title": "Option"
        });

        return columns
    }

    setLoader() {
        d3.select(this.tableElementSelector).node().innerHTML += "<div class='loader'></div>";
        d3.select(this.tableElementSelector).style("opacity", 0.5);
    }

    removeLoader() {
        d3.select(this.tableElementSelector)
            .html("");
        d3.select(this.tableElementSelector).style("opacity", 1);
    }

    initTable() {
        if (this.dataTable) {
            this.dataTable.destroy();
            $(this.tableElementSelector).empty();
        }

        let columnsDataTable = this.queryResultToTableColumns();
        this.dataTable = $(this.tableElementSelector).DataTable({
            autoWidth: true,
            paging: true,
            ordering: true,
            info: true,
            dom: 'Bfrtip',
            buttons: ['csv',
                'copy',
                {
                    text: 'Unselect',
                    action: ( e, dt, node, config ) => {
                        this.dataTable.$(".selected").toggleClass('selected');
                        this.mainGraphVis.selectNodesOnly([]);
                    }
                }],
            data: this.queryResult,
            columns: columnsDataTable
        })

        $(".details-control")
            .css('cssText', `width: ${this.detailsColumnWidth} !important`)
            .css("max-width", this.detailsColumnWidth)
            .css("word-break", "break-all")
            .css("white-space", "pre-line")

        this.initRowSelection();
        this.initRowClickEvent();
    }

    initRowSelection() {
        $(this.tableElementSelector + ' tbody').on('click', 'tr', (e) => {
            $(e.currentTarget).toggleClass('selected');
            let subgraphsSelected = this.dataTable.rows('.selected').data().toArray();

            let [nodesIds, linksIds] = this.subgraphsToNodesLinksIds(subgraphsSelected);

            this.mainGraphVis.selectNodesOnly(nodesIds);
            // this.mainGraphVis.highlightLinks(linksIds);
        });
    }

    initRowClickEvent() {
        $(this.tableElementSelector + ' tbody').on('click', 'td.details-control', (e) => {
            e.stopPropagation();
            let tr = $(e.currentTarget).closest('tr');
            let row = this.dataTable.row(tr);

            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('shown');
            } else {
                row.child(this.formatDetails(row.data())).show();
                tr.addClass('shown');
            }
        });
    }

    formatDetails(d) {
        let widthPercent = 100 / this.queryEntitiesIds.length;
        let html = '<div style="display: flex">'
        html += `<div style='width: ${this.detailsColumnTrueWidth};'></div>`
        html += "<div style='flex-grow: 1'>";
        for (const [entity, properties] of Object.entries(d)) {
            html += `<div style='display: inline-block; width: ${widthPercent}%; vertical-align: top;'>`
            for (const [name, value] of Object.entries(properties)) {
                html += `<span class="table-property-key">${name}</span>: ${value} <br>`;
            }
            html += "</div>"
        }
        html += "</div></div>";
        return html;
    }

    subgraphsToNodesLinksIds(subgraphs) {
        let nodesIds = [];
        let linksIds = [];
        subgraphs.forEach((match, i) => {
            this.queryEntitiesIds.forEach((queryEntityId) => {
                if (this.queryNodesIds.includes(queryEntityId)) {
                    let nodeMatch = match[queryEntityId]
                    let id = nodeMatch["id"];
                    if (!(nodesIds.includes(id))) {
                        nodesIds.push(id);
                    }
                } else {
                    let linkId = this.processLink(match[queryEntityId]);

                    if (!(linksIds.includes(linkId))) {
                        linksIds.push(linkId);
                    }
                }
            })
        })
        return [nodesIds, linksIds];
    }

    processLink(link) {
        return link.source.toString() + link['relation_type'] + link.target.toString();
    }
}

export {QueryResultTable};