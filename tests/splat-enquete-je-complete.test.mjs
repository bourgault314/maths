/* SPLAT! Enquête — « Je complète » : la barre complétée finit pile au bout de la référence
   (15/10/2026, vu par Gwenaël sur la page 2 du livret 2 des histoires : « Tom + 4 » dépassait Lila,
   et dans le schéma regroupé le bloc de Tom était plus long que les deux autres « Lila »).
   Décidé par Gwenaël : la case ajoutée (en pointillés) garde sa largeur lisible, c'est la tache
   qu'elle complète (la case juste avant) qui raccourcit d'autant — partout (écran et papier).
   Les fonctions de outils/splat.html sont EXÉCUTÉES telles quelles (extraites du fichier, dans une
   machine virtuelle node:vm), avec une mesure de texte fixe (longueur × taille × 0,6).
   1. À l'échelle de l'exemple (Lila 25, Noa 18, Tom 21 ; 64 coquillages) : « Tom + 4 » et
      « Noa + 7 » ont la longueur de Lila, sur le papier, à l'écran et au téléphone.
   2. Le schéma regroupé Noa | 7 | Tom | 4 | Lila : les trois groupes ont la même longueur.
   3. Sans case « ajout » (ou avec une case ajoutée déjà assez large), rien ne change.
   4. Une tache ne raccourcit jamais sous la largeur minimale d'une case (son nom reste lisible),
      et seule une tache juste avant la case ajoutée raccourcit. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function bloc(debut, fin){
  const start = html.indexOf(debut);
  assert.notEqual(start, -1, `${debut} introuvable`);
  return html.slice(start, html.indexOf(fin, start) + fin.length);
}
function ligne(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}

const contexte = vm.createContext({});
vm.runInContext(`
  const enqueteTexteLargeur = (t, fs) => String(t).length * fs * 0.6;
  const formatRelationNumber = (v) => String(v);
  ${ligne("const ENQ_LIGNE_ALIGNEE = ")}
  ${bloc("const ENQ_PROFIL_IMPRIME = {", "};")}
  ${ligne("const ENQ_PROFIL_ECRAN = ")}
  ${ligne("const ENQ_PROFIL_TEL = ")}
  ${fn("enqueteProfil")}
  ${fn("enqueteLargeursCases")}
  ${fn("enqueteEchelle")}
  ${fn("enqueteMotsTiennent")}
  ${fn("enqueteMiseEnPage")}
  globalThis.F = { enqueteProfil, enqueteLargeursCases, enqueteMiseEnPage };
`, contexte);
const { enqueteProfil, enqueteLargeursCases, enqueteMiseEnPage } = contexte.F;

const somme = (ws) => ws.reduce((a, b) => a + b, 0);
const proche = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg} : ${a.toFixed(3)} au lieu de ${b.toFixed(3)}`);
/* l'ancienne règle (main avant le 15/10/2026) : une case « nombre » ou « ajout » garde au moins cellMin */
const avant = (cells, s, P) => cells.map((c) => (c.kind === "tache" || c.kind === "part") ? c.v * s : Math.max(P.cellMin, c.v * s));

const tache = (v, de) => ({ kind:"tache", v, de });
const ajout = (v) => ({ kind:"ajout", v });
const nombre = (v) => ({ kind:"nombre", v });
const part = (v, de) => ({ kind:"part", v, de });

/* L'exemple de la page 2 du livret 2 des histoires : Lila, Noa et Tom ont ramassé 64 coquillages ;
   Lila en a 7 de plus que Noa et 4 de plus que Tom → Lila 25, Noa 18, Tom 21 (le même dessin que
   « je complète » de l'Enquête : deux taches complétées jusqu'à la grande). */
const LILA = 0, NOA = 1, TOM = 2;
function exemple(){
  const noa = [tache(18, NOA), ajout(7)], tom = [tache(21, TOM), ajout(4)], lila = [tache(25, LILA)];
  const rows = [
    { label:"Noa + 7", cells:noa, sous:[] },
    { label:"Tom + 4", cells:tom, sous:[] },
    { label:"Lila", cells:lila, sous:[] }
  ];
  return { rows, accolade:75, ligne:{ total:75, groupes:[
    { cells:noa, label:"Lila" }, { cells:tom, label:"Lila" }, { cells:lila, label:"Lila" }] },
  texteCellule:(c) => ["Lila", "Noa", "Tom"][c.de], motCellule:(c) => ["Lila", "Noa", "Tom"][c.de] };
}
const PROFILS = [["papier", { isPrint:true }], ["écran", {}], ["téléphone", { portrait:true }]];

test("à l'échelle de l'exemple : « Tom + 4 » et « Noa + 7 » finissent pile au bout de Lila", () => {
  for(const [nom, o] of PROFILS){
    const P = enqueteProfil(o), M = enqueteMiseEnPage(exemple(), P);
    for(const s of [M.s, M.sLigne]){
      /* sans quoi le test ne prouverait rien : à cette échelle, le « 4 » est bien élargi */
      assert.ok(4 * s < P.cellMin, `${nom} : le 4 tient déjà dans ${(4 * s).toFixed(0)} unités, l'exemple ne teste rien`);
      const lila = somme(enqueteLargeursCases([tache(25, LILA)], s, P));
      proche(lila, 25 * s, `${nom} : Lila garde sa longueur`);
      const tom = enqueteLargeursCases([tache(21, TOM), ajout(4)], s, P);
      assert.equal(tom[1], P.cellMin, `${nom} : la case en pointillés garde sa largeur lisible`);
      proche(somme(tom), lila, `${nom} : Tom + 4 a la longueur de Lila`);
      assert.ok(tom[0] < 21 * s, `${nom} : c'est la tache de Tom qui raccourcit`);
      proche(somme(enqueteLargeursCases([tache(18, NOA), ajout(7)], s, P)), lila, `${nom} : Noa + 7 a la longueur de Lila`);
      /* ce que faisait l'ancienne règle : Tom + 4 dépassait Lila */
      assert.ok(somme(avant([tache(21, TOM), ajout(4)], s, P)) > lila + 1, `${nom} : l'ancienne règle faisait dépasser Tom`);
    }
  }
});

test("schéma regroupé Noa | 7 | Tom | 4 | Lila : les trois groupes ont la même longueur", () => {
  for(const [nom, o] of PROFILS){
    const P = enqueteProfil(o), modele = exemple(), M = enqueteMiseEnPage(modele, P);
    const cells = modele.ligne.groupes.flatMap((g) => g.cells);
    const ws = enqueteLargeursCases(cells, M.sLigne, P);
    const groupes = [somme(ws.slice(0, 2)), somme(ws.slice(2, 4)), ws[4]];
    proche(groupes[0], groupes[2], `${nom} : le groupe de Noa a la longueur de Lila`);
    proche(groupes[1], groupes[2], `${nom} : le groupe de Tom a la longueur de Lila`);
    proche(somme(ws), 3 * 25 * M.sLigne, `${nom} : la barre du total vaut trois Lila`);
    /* la ligne ② tient dans sa largeur, comme avant */
    assert.ok(somme(ws) <= M.lineW + 0.5, `${nom} : ② dépasse sa largeur`);
  }
});

test("sans case « ajout » (ou avec une case ajoutée assez large), rien ne change", () => {
  const P = enqueteProfil({ isPrint:true });
  const barres = [
    [tache(4, 0), nombre(11), nombre(1)],
    [tache(6, 0), tache(6, 0), tache(6, 0), nombre(2)],
    [part(3, 0), part(3, 0), part(3, 0)],
    [tache(25, 0)],
    [tache(9, 1), nombre(1), tache(9, 1), nombre(1)],
    [tache(21, 2), ajout(40)] /* le 40 tient sans élargir : rien à reprendre */
  ];
  for(const cells of barres){
    for(const s of [4, 12, 16.4, 30, 55]){
      if(cells.some((c) => c.kind === "ajout" && c.v * s < P.cellMin)) continue;
      assert.deepEqual(enqueteLargeursCases(cells, s, P), avant(cells, s, P), `${JSON.stringify(cells)} à l'échelle ${s}`);
    }
  }
  /* l'épingle du lot G1 tient toujours */
  assert.deepEqual(enqueteLargeursCases([tache(4), ajout(11), nombre(1)], 30, P), [120, 330, P.cellMin]);
});

test("seule la tache juste avant raccourcit, et jamais sous la largeur minimale d'une case", () => {
  const P = enqueteProfil({ isPrint:true });
  /* une case ajoutée en tête, ou après un nombre : elle garde son minimum, ses voisines ne bougent pas */
  assert.deepEqual(enqueteLargeursCases([ajout(2), tache(20, 0)], 10, P), [P.cellMin, 200]);
  assert.deepEqual(enqueteLargeursCases([tache(20, 0), nombre(1), ajout(2)], 10, P), [200, P.cellMin, P.cellMin]);
  assert.deepEqual(enqueteLargeursCases([tache(20, 0), nombre(30), ajout(2)], 10, P), [200, 300, P.cellMin], "un nombre ne raccourcit pas");
  assert.deepEqual(enqueteLargeursCases([part(30, 0), ajout(2)], 10, P), [300, P.cellMin], "une petite part ne raccourcit pas");
  /* la case APRÈS la case ajoutée ne bouge pas */
  const ws = enqueteLargeursCases([tache(18, 0), ajout(4), tache(21, 1)], 16, P);
  assert.equal(ws[2], 21 * 16, "la tache suivante garde sa longueur");
  proche(ws[0] + ws[1], 22 * 16, "la tache complétée + sa case ajoutée valent 18 + 4");
  /* une petite tache : elle raccourcit jusqu'à cellMin, pas plus (son nom ou son initiale reste lisible) */
  const petite = enqueteLargeursCases([tache(3, 0), ajout(1)], 40, P);
  assert.equal(petite[0], P.cellMin, "la tache s'arrête à la largeur minimale");
  assert.equal(petite[1], P.cellMin, "la case ajoutée garde sa largeur");
  /* une tache déjà plus étroite que cellMin ne raccourcit pas du tout */
  const minuscule = enqueteLargeursCases([tache(2, 0), ajout(1)], 40, P);
  assert.deepEqual(minuscule, [80, P.cellMin]);
});
