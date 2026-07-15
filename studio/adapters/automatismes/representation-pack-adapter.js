/*
 * Adaptateur minimal entre Automatismes et les représentations maths&go.
 *
 * Le moteur de questions reste dans /auto : identifiants, aléatoire, réponses
 * et correction ne sont pas déplacés ici. Une question produit seulement une
 * définition de représentation ; cet adaptateur la rend avec le composant
 * officiel.
 */
(function (global) {
  'use strict';

  function requirePack() {
    if (!global.MATHSGO_REPRESENTATIONS) {
      throw new Error('Le pack maths&go doit être chargé avant l’adaptateur.');
    }
    return global.MATHSGO_REPRESENTATIONS;
  }

  function render(definition) {
    return requirePack().render(definition);
  }

  function validate(definition) {
    return requirePack().validateDefinition(definition);
  }

  global.MATHSGO_AUTOMATISMES_REPRESENTATIONS = Object.freeze({
    version: '1.0.0',
    render: render,
    validate: validate
  });
}(typeof window !== 'undefined' ? window : globalThis));
