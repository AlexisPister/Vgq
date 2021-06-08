// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import ConstraintWidget from "../../src/js/visualQueryComponents/Widgets/constraintWidget.js";

Cypress.Commands.add('cypher', (cypher) => {
  cy.visit('http://localhost:1234');

  // Delete existing text
  cy.get('.CodeMirror')
      .first()
      .then(editor => {
          editor[0].CodeMirror.setValue('')
      })

  cy.get('.CodeMirror textarea')
      // .clear({ force: true })
      .type(cypher, {force:true})
})

function canonString(string) {
    return string.split(' ').join('').split('\n').join('');
}

Cypress.Commands.add('isCypher', (cypher) => {
    cy.get('.CodeMirror')
        .first()
        .then(editor => {
            const value = editor[0].CodeMirror.getValue()
            assert.equal(canonString(value), canonString(cypher))
        })

    // let editor = document.querySelector('.CodeMirror').CodeMirror;
    // let value = editor.getValue()
    // cy.log(value);

    // let a = cy.get('.CodeMirror textarea')
    //     .contains('MATCH')
})

Cypress.Commands.add('widgetSel', (entity, property) => {
    return `.${ConstraintWidget.widgetClass(entity, property)}`
})

export function widgetSel(entity, property) {
    return `.${ConstraintWidget.widgetClass(entity, property)}`
}
