// Lot « élision devant les prénoms » (23/10/2026). Gwenaël a lu « Le parcours
// de Axel » dans Ma classe : devant un prénom qui commence par une voyelle,
// « de » et « que » s'élident (« le parcours d'Axel », « de plus qu'Inès »).
// Règle choisie : voyelle, accentuée ou non, et Y suivi d'une consonne
// (d'Yves) ; « de » reste devant Y suivi d'une voyelle (de Yanis) et devant H
// (de Hugo : pour un prénom, les deux se disent). Ces tests EXÉCUTENT les
// vraies fonctions de chaque page, puis vérifient qu'aucun prénom n'est plus
// collé à un « de » ou un « que » écrit en dur.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const defiTables = lire("outils/calcul_mental/defi_tables.html");
const pageProf = lire("_serveur/public/prof/index.php");
const barres = lire("outils/problemes_barres.html");

// Sort le texte d'une fonction de la page : de « function nom( » à la
// première accolade fermante revenue au même retrait (les expressions
// régulières de cleanFrenchText contiennent des accolades).
function fonction(source, nom) {
  const debut = source.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, `${nom} est dans la page`);
  const retrait = source.slice(source.lastIndexOf("\n", debut) + 1, debut);
  const fin = source.indexOf(`\n${retrait}}\n`, debut);
  assert.ok(fin > debut, `fin de ${nom}`);
  return source.slice(debut, fin + retrait.length + 2);
}

function charger(source, noms) {
  const code = noms.map(nom => fonction(source, nom)).join("\n");
  return new Function(`${code}\nreturn {${noms.join(", ")}};`)();
}

const CAS_DE = [
  ["Léa", "de Léa"], ["Axel", "d’Axel"], ["axel", "d’axel"], ["Inès", "d’Inès"],
  ["Éloïse", "d’Éloïse"], ["Élodie", "d’Élodie"], ["Océane", "d’Océane"], ["Ugo", "d’Ugo"],
  ["Œlia", "d’Œlia"], ["Îlona", "d’Îlona"], ["Yves", "d’Yves"], ["Ylan", "d’Ylan"],
  ["Yanis", "de Yanis"], ["Yasmine", "de Yasmine"], ["Hugo", "de Hugo"], ["Hélène", "de Hélène"],
  ["l’élève", "de l’élève"], ["cet élève", "de cet élève"], ["un collègue", "d’un collègue"],
  ["Inès · 405", "d’Inès · 405"], ["", "de "]
];

for (const [page, source] of [["Défi tables", defiTables], ["la page prof", pageProf]]) {
  test(`${page} : deNom élide devant une voyelle, pas devant H ni Y + voyelle`, () => {
    const {deNom} = charger(source, ["seElide", "deNom"]);
    for (const [nom, attendu] of CAS_DE) assert.equal(deNom(nom), attendu, nom);
  });
}

test("la page prof : queNom (« Connecté en tant qu’Axel. »)", () => {
  const {queNom} = charger(pageProf, ["seElide", "queNom"]);
  assert.equal(queNom("axel"), "qu’axel");
  assert.equal(queNom("lea"), "que lea");
  assert.equal(queNom("yanis"), "que yanis");
  assert.equal(queNom("hugo"), "que hugo");
});

test("aucun prénom ni nom collé à un « de » ou un « que » écrit en dur", () => {
  const colle = /\b(de|que) \$\{[^}]*(prenom|qui|identifiant|nom)/gi;
  for (const [page, source] of [["defi_tables.html", defiTables], ["prof/index.php", pageProf]]) {
    assert.deepEqual(source.match(colle) || [], [], page);
  }
  assert.match(defiTables, /`La fiche \$\{deNom\(prenomAffiche\(\)\)\}`/);
  // Lot « Effacer l'historique » (06/11/2026) : la question ne dit plus le
  // prénom (« Effacer tout ton historique ? » pour tout le monde).
  assert.doesNotMatch(defiTables, /Effacer le parcours \$\{/);
  // Serveur pro, lot 5b : la fenêtre « Ce que voit … » (et son « vérifier les
  // accès de … avant », son « le monde 3 de SPLAT! ») a disparu ; « Régler … » ne colle aucun prénom à un « de ».
  assert.equal((pageProf.match(/`Classe \$\{deNom\(qui\)\}, partagée avec toi/g) || []).length, 2);
  assert.equal((pageProf.match(/\$\{deNom\(prof\.identifiant\)\}/g) || []).length, 7);
  assert.match(pageProf, /`Mot de passe temporaire \$\{deNom\(reponse\.identifiant\.trim\(\)\)\}, à lui/);
  assert.match(pageProf, /`Connecté en tant \$\{queNom\(identifiant\)\}\.`/);
});

test("Problèmes en barres : le filet corrige aussi « que » devant une voyelle", () => {
  const {cleanFrenchText} = charger(barres, ["cleanFrenchText"]);
  assert.equal(cleanFrenchText("Lina a 3 billes de plus que Anna."), "Lina a 3 billes de plus qu’Anna.");
  assert.equal(cleanFrenchText("Tom en a 2 fois moins que Inaya."), "Tom en a 2 fois moins qu’Inaya.");
  assert.equal(cleanFrenchText("de moins</mark> que Eden."), "de moins</mark> qu’Eden.");
  assert.equal(cleanFrenchText("Que Adam a-t-il ?"), "Qu’Adam a-t-il ?");
  assert.equal(cleanFrenchText("plus que Hugo"), "plus que Hugo", "pas devant un h");
  assert.equal(cleanFrenchText("plus que Lina"), "plus que Lina");
  assert.equal(cleanFrenchText("chaque élève"), "chaque élève", "« que » dans un mot");
  assert.equal(cleanFrenchText("Combien de images"), "Combien d’images", "l’ancien filet du « de » tient");
});

test("Problèmes en barres : les champs qui échappaient au filet y passent", () => {
  assert.match(barres, /"relationSentence", "relationRaw", "relationshipText",\s*"answer", "fillText", "reformulation"\s*\]\.forEach/,
    "la phrase réponse, le texte à compléter et la reformulation");
  assert.match(fonction(barres, "ratioMeaningText"), /return cleanFrenchText\("Le ratio "/, "la carte « Que signifie le ratio ? »");
});
