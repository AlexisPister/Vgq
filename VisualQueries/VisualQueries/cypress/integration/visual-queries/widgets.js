/// <reference types="cypress" />

import {widgetSel} from "../../support/commands.js";

describe("add widgets", () => {
    beforeEach(() => {
        cy.visit('http://localhost:1234');
    })

    it('create one nominal constraint', () => {
        cy.cypher("MATCH (n)-[r]-(m) RETURN n");

        cy.get('.entity-widgets-creation')
            .children().select('n')

        cy.get('.widget-creation').children()
            .select('name')

        cy.get(".widget")
            .contains("name")

        cy.get('.widget')
            .find("input")
            .type("Alice")
            .type('{enter}')

        cy.isCypher('MATCH (n)-[r]-(m) WHERE n.name = "Alice" RETURN n')
    })

    it('chain several widgets', () => {
        cy.cypher("MATCH (n)-[r]-(m) RETURN n");

        cy.get('.entity-widgets-creation')
            .children().select('n')

        cy.get('.widget-creation').children()
            .select('sex')

        cy.contains(widgetSel("n", "sex"), "sex")
            .find("input[value=male]").click()
        cy.isCypher('MATCH (n)-[r]-(m) WHERE n.sex="male" RETURN n')

        cy.get('input[value=female]').click()
        cy.isCypher('MATCH (n)-[r]-(m) WHERE n.sex IN ["male", "female"] RETURN n')
    })
})