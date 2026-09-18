/* Petit Splat, parcours élève (18/09/2026) : la reprise ne saute plus de cartes.

   Les trois livrets Petit SPLAT! (Monde 1, Avancé, Expert) portent le même
   ?parcours=m1eN — c'est voulu : valider une fiche plus dure allume la même
   étoile du monde 1 — mais des cartes différentes (graine et cible). Or
   ?parcours= sert aussi de clé à la sauvegarde « en cours » : scanner la
   fiche 1 de l'Avancé rouvrait la reprise du Monde 1 et envoyait l'élève à la
   carte 7 d'une série qu'il n'avait jamais commencée.

   La sauvegarde porte maintenant l'empreinte de la série qui l'a écrite, et la
   reprise n'a lieu que sur cette série-là. Ces tests exécutent le code de la
   page tel quel : les fonctions et le bloc de reprise sont extraits du fichier. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const petit = readFileSync(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");
const CLE = "mathsgo-splat-parcours";

// Une fonction de premier niveau de la page, jusqu'à son accolade fermante en colonne 0.
function source(nom) {
  const debut = petit.indexOf(`function ${nom}(`);
  assert.ok(debut > 0, `${nom} introuvable`);
  return petit.slice(debut, petit.indexOf("\n}\n", debut) + 3);
}

// Un faux localStorage, pré-rempli.
function stockage(contenu) {
  const m = new Map([[CLE, JSON.stringify(contenu)]]);
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    lire: () => JSON.parse(m.get(CLE) || "{}"),
  };
}

// L'empreinte que la page calcule pour les réglages lus dans son adresse.
function empreinte({ seed, target, splats, exercise, grid = "3x4" }) {
  const valeurs = { targetVal: target, splatMode: splats, gameMode: exercise, gridSize: grid };
  const document = { getElementById: (id) => (id in valeurs ? { value: valeurs[id] } : null) };
  return new Function("document", "activeSeed", "getProblemType",
    `${source("eleveSignatureSerie")}\nreturn eleveSignatureSerie();`)(document, seed, () => "classic");
}

// Fiche 1 « Complète le schéma » de chaque livret (graines de _sources/livret-petit-splat/render.py).
const fiche1 = (seed, target) => empreinte({ seed, target, splats: "1", exercise: "find_hidden" });
const monde1 = () => fiche1("441132", "20");
const avance = () => fiche1("510115", "50");
const expert = () => fiche1("892863", "100");

// Le bloc de reprise de renderEleve, exécuté tel quel à l'ouverture d'une série de 12 cartes.
function ouvrir(store, serieAffichee) {
  const debut = petit.indexOf("if (eleveSerie.length && !eleveRepriseFaite && parcoursId) {");
  assert.ok(debut > 0, "bloc de reprise introuvable");
  const finTexte = "} catch (e) { /* stockage indisponible */ }";
  const fin = petit.indexOf(finTexte, debut);
  assert.ok(fin > debut, "fin du bloc de reprise introuvable");
  const bloc = petit.slice(debut, fin + finTexte.length) + "\n}";
  return new Function("localStorage", "ELEVE_STORE_KEY", "parcoursId", "eleveSignatureSerie", `
    let eleveSerie = new Array(12).fill({}), eleveRepriseFaite = false;
    let eleveIdx = 0, eleveEtoiles = 0, eleveResultats = [];
    ${bloc}
    return { eleveIdx, eleveEtoiles, eleveResultats };`)(store, CLE, "m1e1", () => serieAffichee);
}

test("les trois livrets, même étape m1e1, portent trois empreintes différentes", () => {
  assert.equal(new Set([monde1(), avance(), expert()]).size, 3);
  assert.equal(monde1(), fiche1("441132", "20"), "même adresse, même empreinte");
});

test("l'empreinte change avec chaque réglage qui change les cartes", () => {
  const base = { seed: "441132", target: "20", splats: "1", exercise: "find_hidden", grid: "3x4" };
  const ref = empreinte(base);
  for (const [cle, autre] of [["seed", "510115"], ["target", "50"], ["splats", "2"], ["exercise", "construct"], ["grid", "3x3"]]) {
    assert.notEqual(empreinte({ ...base, [cle]: autre }), ref, `${cle} change les cartes, donc l'empreinte`);
  }
});

test("la sauvegarde « en cours » porte l'empreinte de la série qui l'écrit, sans toucher l'étoile", () => {
  const store = stockage({ m1e1: { fait: true, etoiles: 12, cartes: 12, date: "2026-09-17" } });
  new Function("localStorage", "ELEVE_STORE_KEY", "parcoursId", "eleveRejeu", "eleveIdx", "eleveSerie",
    "eleveEtoiles", "eleveResultats", "eleveSignatureSerie",
    `${source("eleveSauverEnCours")}\neleveSauverEnCours();`)(
    store, CLE, "m1e1", null, 2, new Array(12).fill({}), 3, [true, true, true], monde1);
  const entree = store.lire().m1e1;
  assert.deepEqual(entree.enCours, { sig: monde1(), idx: 3, etoiles: 3, res: [true, true, true] });
  assert.equal(entree.fait, true, "l'étoile déjà gagnée reste allumée");
});

test("Monde 1 en pause à la carte 7 : la fiche 1 de l'Avancé ou de l'Expert démarre à la carte 1", () => {
  const pause = () => stockage({ m1e1: { enCours: { sig: monde1(), idx: 6, etoiles: 3, res: [true, true, true, true, true, true] } } });
  assert.equal(ouvrir(pause(), avance()).eleveIdx, 0, "Avancé : carte 1, pas carte 7");
  assert.equal(ouvrir(pause(), expert()).eleveIdx, 0, "Expert : carte 1, pas carte 7");
});

test("la même fiche reprend toujours là où l'élève s'était arrêté, pastilles comprises", () => {
  const store = stockage({ m1e1: { enCours: { sig: monde1(), idx: 6, etoiles: 3, res: [true, false, "ko", true, true, false] } } });
  const r = ouvrir(store, monde1());
  assert.equal(r.eleveIdx, 6);
  assert.equal(r.eleveEtoiles, 3);
  assert.deepEqual(r.eleveResultats, [true, false, "ko", true, true, false]);
});

test("une sauvegarde écrite avant le correctif (sans empreinte) n'est pas reprise, et l'étoile reste", () => {
  const store = stockage({ m1e1: { fait: true, etoiles: 10, cartes: 12, date: "2026-09-17",
                                   enCours: { idx: 5, etoiles: 5, res: [true, true, true, true, true] } } });
  assert.equal(ouvrir(store, monde1()).eleveIdx, 0);
  assert.equal(store.lire().m1e1.fait, true);
});
