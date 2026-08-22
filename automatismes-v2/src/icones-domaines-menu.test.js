import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  graineIconesDomainesDuJour,
  ICONES_DOMAINES_MENU,
  rendreIconeDomaineMenu,
} from "./registre-lecteur.js";

describe("icônes des quatre domaines du menu Studio", () => {
  it("garde une composition stable pendant une même journée", () => {
    const matin = graineIconesDomainesDuJour(new Date(2026, 7, 22, 8, 30));
    const soir = graineIconesDomainesDuJour(new Date(2026, 7, 22, 22, 15));
    const lendemain = graineIconesDomainesDuJour(new Date(2026, 7, 23, 8, 30));
    assert.equal(matin, soir);
    assert.notEqual(matin, lendemain);
    assert.equal(
      rendreIconeDomaineMenu(ICONES_DOMAINES_MENU.GEOMETRIE, matin),
      rendreIconeDomaineMenu(ICONES_DOMAINES_MENU.GEOMETRIE, soir),
    );
  });

  it("rend le boulier, le motif de Truchet, le diagramme et le parcours", () => {
    const graine = 0x20260822;
    const nombres = rendreIconeDomaineMenu(ICONES_DOMAINES_MENU.NOMBRES, graine);
    const geometrie = rendreIconeDomaineMenu(ICONES_DOMAINES_MENU.GEOMETRIE, graine);
    const donnees = rendreIconeDomaineMenu(ICONES_DOMAINES_MENU.DONNEES, graine);
    const informatique = rendreIconeDomaineMenu(ICONES_DOMAINES_MENU.INFORMATIQUE, graine);
    assert.match(nombres, /M7\.5 11\.5h21M7\.5 18h21M7\.5 24\.5h21/);
    assert.match(geometrie, /mathsgo-truchet-/);
    assert.match(geometrie, /stroke="#167f7b"/);
    assert.match(geometrie, /stroke="#f58220"/);
    assert.equal((donnees.match(/<rect /g) ?? []).length, 5);
    assert.match(informatique, /M12 4v28M18 4v28M24 4v28/);
    assert.match(informatique, /L27 8\.4Z/);
  });

  it("refuse les domaines et les graines inconnus", () => {
    assert.throws(() => rendreIconeDomaineMenu("mesures", 1), RangeError);
    assert.throws(() => rendreIconeDomaineMenu(ICONES_DOMAINES_MENU.NOMBRES, -1), RangeError);
    assert.throws(() => graineIconesDomainesDuJour(new Date("invalide")), TypeError);
  });
});
