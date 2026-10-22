// Les icônes du jour des domaines (décision L) : stables dans la journée, autres le lendemain,
// les quatre courbes de « Proportionnalité, fonctions » équilibrées sur un an.
import test from "node:test";
import assert from "node:assert/strict";
import { iconeDomaine, graineDuJour, TYPES_COURBES } from "../automatismes/icones-domaines.js";
import { DOMAINES } from "../automatismes/seances.js";

const IDS = DOMAINES.map(([id]) => id);
const jour = (rang, heure = 12) => new Date(2026, 0, 1 + rang, heure, 30);
const icones = (date) => IDS.map((id) => iconeDomaine(id, graineDuJour(date)));

test("P7 : la même icône toute une journée, une autre le lendemain", () => {
  for (let rang = 0; rang < 365; rang += 1) {
    const matin = icones(new Date(2026, 0, 1 + rang, 0, 1));
    assert.deepEqual(icones(new Date(2026, 0, 1 + rang, 23, 59)), matin, `jour ${rang}`);
    assert.notDeepEqual(icones(jour(rang + 1)), matin, `jour ${rang} → lendemain`);
  }
  assert.equal(iconeDomaine("nombres-calculs"), iconeDomaine("nombres-calculs", graineDuJour()));
  assert.throws(() => graineDuJour(new Date("pas une date")), TypeError);
});

test("P7 : sur 365 jours, les quatre courbes apparaissent chacune au moins 60 fois", () => {
  const vues = Object.fromEntries(TYPES_COURBES.map((type) => [type, 0]));
  for (let rang = 0; rang < 365; rang += 1) {
    const icone = iconeDomaine("proportionnalite-fonctions", graineDuJour(jour(rang)));
    vues[/data-courbe="(\w+)"/.exec(icone)[1]] += 1;
  }
  assert.deepEqual(Object.keys(vues).sort(), ["affine", "carre", "lineaire", "racine"]);
  for (const [type, nombre] of Object.entries(vues)) assert.ok(nombre >= 60, `${type} : ${nombre}`);
});

test("P7 : les croix dans le cadre, des clipPath uniques, aucune icône vide", () => {
  for (let rang = 0; rang < 365; rang += 1) {
    const dessins = icones(jour(rang));
    for (const [index, dessin] of dessins.entries()) {
      assert.match(dessin, /^<svg viewBox="0 0 36 36"[^>]*>.+<\/svg>$/, `${IDS[index]} vide`);
      assert.ok(/<(path|circle|rect)[^>]*>/.test(dessin.replace(/<rect x="3\.5"[^>]*>/g, "")));
    }
    // Les croix orange : des segments de 3,4 entiers dans le cadre (4 à 32), au moins une.
    const fonctions = dessins[IDS.indexOf("proportionnalite-fonctions")];
    const croix = /<path d="([^"]*)" fill="none" stroke="#f58220"/.exec(fonctions)[1];
    const departs = [...croix.matchAll(/M(-?[\d.]+) (-?[\d.]+)l3\.4 (-?3\.4)/g)];
    assert.ok(departs.length >= 2 && departs.length % 2 === 0, `jour ${rang} : ${croix}`);
    for (const [, x, y, dy] of departs) {
      const [x1, y1] = [Number(x), Number(y)];
      const y2 = y1 + Number(dy);
      assert.ok(x1 >= 4 && x1 + 3.4 <= 32, `jour ${rang} : croix hors du cadre (x ${x1})`);
      assert.ok(Math.min(y1, y2) >= 4 && Math.max(y1, y2) <= 32, `jour ${rang} : y ${y1}`);
    }
    // Les identifiants de clipPath de la page (5 icônes) sont tous différents.
    const ids = dessins.flatMap((dessin) =>
      [...dessin.matchAll(/clipPath id="([^"]+)"/g)].map((m) => m[1]),
    );
    assert.equal(new Set(ids).size, ids.length, `jour ${rang} : ${ids}`);
    assert.ok(ids.length >= 2);
  }
  assert.equal(iconeDomaine("domaine-inconnu", 1), "");
});
