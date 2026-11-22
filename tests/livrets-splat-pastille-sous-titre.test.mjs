// (22/11/2026) Page des livrets SPLAT! : la pastille des fiches est TOUJOURS sous le titre, dans
// toutes les cartes de tous les mondes, sur ordinateur et sur téléphone. Avant, elle était à droite
// et passait dessous seulement pour un titre long (« Échauffement », « Deuxième tour 1 », « Le schéma
// en barres » au téléphone) : boutons décalés d'une carte à l'autre, et un même monde mélangeait les
// deux. Mesuré au navigateur (1440 à 830 px, 390 px), tous les mondes et toutes les séries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../outils/livrets_splat.html', import.meta.url), 'utf8');

test('la pastille des fiches sous le titre, dans toutes les cartes', () => {
  assert.match(page, /\n\.liv \.titre\{display:flex;flex-direction:column;align-items:flex-start/);
  // aucune règle plus bas ne la remet à droite (sur une largeur d'écran ou une sorte de carte)
  assert.doesNotMatch(page, /\.liv \.titre\{[^}]*flex-direction:row/);
  assert.doesNotMatch(page, /\.liv \.titre\{[^}]*space-between/);
});

test('les boutons ne sont pas calés en bas de la carte (ouvrir « Le corrigé » ne doit rien faire bouger à côté)', () => {
  assert.doesNotMatch(page, /\.liv \.liens\{[^}]*margin-top:auto/);
});
