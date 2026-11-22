// (22/11/2026) Page des livrets SPLAT! : dans les cartes côte à côte (ordinateur), la pastille
// des fiches est TOUJOURS sous le titre. Avant, elle passait à la ligne seulement pour un titre
// long (« Échauffement » au monde 6, les cartes du monde 1 vers 830 px) et les boutons de cette
// carte tombaient plus bas que ceux des voisines. Mesuré au navigateur à 1440, 1280, 1024, 900
// et 830 px, tous les mondes et toutes les séries : boutons alignés partout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../outils/livrets_splat.html', import.meta.url), 'utf8');

test('cartes côte à côte : la pastille des fiches sous le titre, sur ordinateur seulement', () => {
  const debut = page.indexOf('@media (min-width:821px){');
  assert.ok(debut > 0, 'bloc ordinateur introuvable');
  const fin = page.indexOf('\n}', debut);
  const bloc = page.slice(debut, fin);
  assert.match(bloc, /\.grille:not\(\.n1\) \.liv \.titre\{flex-direction:column;align-items:flex-start/);
});

test('les boutons ne sont pas calés en bas de la carte (ouvrir « Le corrigé » ne doit rien faire bouger à côté)', () => {
  assert.doesNotMatch(page, /\.liv \.liens\{[^}]*margin-top:auto/);
});
