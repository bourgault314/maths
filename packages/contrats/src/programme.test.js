import test from "node:test";
import assert from "node:assert/strict";

import {
  PROFILS_DNB,
  PROGRAMMES,
  estActif,
  programmeEnVigueur,
  programmesDuProfilDNB,
  rangAnneeScolaire,
  validerProgrammeItem,
  validerReferenceProgramme,
} from "./programme.js";

// --- Années scolaires --------------------------------------------------------

test("une année scolaire bien formée se compare par son année de début", () => {
  assert.equal(rangAnneeScolaire("2027-2028"), 2027);
  assert.ok(rangAnneeScolaire("2028-2029") > rangAnneeScolaire("2027-2028"));
});

test("une année scolaire incohérente est refusée plutôt que comparée de travers", () => {
  assert.throws(() => rangAnneeScolaire("2027-2029"), /incohérente/);
  assert.throws(() => rangAnneeScolaire("2027"), /attendue/);
  assert.throws(() => rangAnneeScolaire(""), /attendue/);
});

// --- Calendrier officiel -----------------------------------------------------

test("le calendrier de montée en charge est respecté niveau par niveau", () => {
  // Arrêtés : CM1 et 6e en 2025, CM2 et 5e en 2026, 4e en 2027, 3e en 2028.
  assert.equal(programmeEnVigueur("6e", "2025-2026").id, "cycle3-2025");
  assert.equal(programmeEnVigueur("5e", "2026-2027").id, "cycle4-2026");
  assert.equal(programmeEnVigueur("4e", "2027-2028").id, "cycle4-2026");
  assert.equal(programmeEnVigueur("3e", "2028-2029").id, "cycle4-2026");
});

test("avant son entrée en vigueur, un niveau relève encore de l'ancien programme", () => {
  // C'est la période de transition : un élève de 3e en 2027-2028 suit
  // toujours le programme de 2020.
  assert.equal(programmeEnVigueur("3e", "2027-2028").id, "cycle4-2020");
  assert.equal(programmeEnVigueur("4e", "2026-2027").id, "cycle4-2020");
});

test("estActif remplace toute logique de calendrier dans les questions", () => {
  const reference = { programme: "cycle4-2026", niveau: "3e" };
  assert.equal(estActif(reference, "2028-2029"), true);
  assert.equal(estActif(reference, "2027-2028"), false);
});

test("un profil DNB désigne les programmes de sa session", () => {
  const programmes = programmesDuProfilDNB("dnb-2029");
  assert.equal(programmes.length, 1);
  assert.equal(programmes[0].id, "cycle4-2026");
  assert.deepEqual(programmesDuProfilDNB("dnb-inconnu"), []);
});

test("chaque profil DNB déclaré renvoie à des programmes existants", () => {
  for (const profil of Object.values(PROFILS_DNB)) {
    for (const id of profil.programmes) {
      assert.ok(PROGRAMMES[id], `profil ${profil.id} : programme « ${id} » inconnu`);
    }
  }
});

// --- Références --------------------------------------------------------------

test("une référence complète est acceptée", () => {
  const controle = validerReferenceProgramme({
    programme: "cycle4-2026",
    niveau: "4e",
    statut: "automatise",
    identifiant: "4-12",
  });
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("un niveau hors du programme cité est refusé", () => {
  // « CM1 » ne relève pas du cycle 4 : l'incohérence doit se voir.
  const controle = validerReferenceProgramme({
    programme: "cycle4-2026",
    niveau: "CM1",
    statut: "automatise",
  });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /ne couvre pas le niveau/);
});

test("enseigné et automatisé sont deux statuts distincts", () => {
  // Pythagore est enseigné en 4e mais n'est automatisme qu'en 3e : le
  // contrat doit savoir dire les deux.
  for (const statut of ["enseigne", "automatise"]) {
    const controle = validerReferenceProgramme({
      programme: "cycle4-2026", niveau: "4e", statut,
    });
    assert.equal(controle.valide, true, statut);
  }
  const refus = validerReferenceProgramme({
    programme: "cycle4-2026", niveau: "4e", statut: "important",
  });
  assert.equal(refus.valide, false);
});

test("un item de programme complet est validé", () => {
  const controle = validerProgrammeItem({
    id: "3-09",
    texte: "Reconnaître un multiple de 3 ou de 9.",
    domaine: 1,
    programme: "cycle4-2026",
    niveau: "3e",
    statut: "automatise",
    application: "2028-2029",
  });
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("un item sans texte officiel ni domaine valide est refusé", () => {
  const controle = validerProgrammeItem({
    id: "x", texte: "  ", domaine: 9,
    programme: "cycle4-2026", niveau: "3e", statut: "automatise",
  });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /texte/);
  assert.match(controle.erreurs.join(" "), /domaine/);
});
