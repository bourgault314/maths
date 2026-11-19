// Défi calcul, lot 3c « J'écris sur des calculs qui changent » (13/11/2026,
// décision 10 du lot 3) : J'écris tire son calcul à chaque fois, dans la
// sorte (et l'écriture) du J'écris de la leçon, jamais un calcul de la leçon
// ni un de la série. Une recette par niveau donne la consigne, les étapes et
// les dessins. Ce fichier tire des milliers de calculs par niveau et vérifie :
//  - la recette, sur le calcul de la leçon, redonne exactement son J'écris ;
//  - la sorte, l'écriture, les calculs interdits ;
//  - chaque étape est une égalité vraie, la dernière donne la réponse ;
//  - la consigne est vraie et n'écrit jamais la réponse ;
//  - le dessin : un par étape, de la même taille, rien de vert au début, ce
//    qui est trouvé reste trouvé, et aucune réponse écrite avant son étape.
// (DC3C_TIRAGES=5000 node --test … pour en tirer davantage.)

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");

const TIRAGES = Number(process.env.DC3C_TIRAGES || 1000);
const NIVEAUX = CORE.ORDRE.filter(cle => {
  const trouve = CORE.niveauDe(cle);
  return trouve && trouve.niveau.apprends;
});
const VERT = "#147447";
const blanc = texte => String(texte).replace(/[   ]/g, " ");
const graineDe = (cle, g) => (CORE.graineDe ? CORE.graineDe(`${cle}:${g}`) : g * 2654435761) >>> 0;

// ------------------------------------------------- lire une égalité écrite

// Les nombres d'un texte (« 1 000 », « 0,75 ») en valeurs.
const NOMBRE = /\d+(?:[   ]\d{3})*(?:,\d+)?/g;
const valeurDe = texte => Number(texte.replace(/[   ]/g, "").replace(",", "."));
const nombresDe = texte => (String(texte).match(NOMBRE) || []).map(valeurDe);

// Une expression écrite (« 2 × (15 − (5 + 3)) », « 1/6 de 42 € », « double
// de 14 », « 38 dizaines ») en nombre, ou null si elle a des mots.
function evaluer(expression) {
  let t = blanc(expression)
    .replace(/double de/g, "2 ×").replace(/moitié de/g, "0,5 ×")
    .replace(/(\d+(?:,\d+)?) dizaines/g, "($1 × 10)")
    .replace(/(\d+)\/(\d+(?: \d{3})*) de/g, "($1 / $2) ×")
    .replace(/ (g|kg|L|m|cm|€|billes|élèves)\b/g, "").replace(/ €/g, "");
  if (/[a-zA-Zéèàù?]/.test(t)) return null;
  const jetons = t.match(/\d+(?: \d{3})*(?:,\d+)?|[()+−×÷/]/g);
  if (!jetons || jetons.join("").replace(/ /g, "") !== t.replace(/ /g, "")) return null;
  let i = 0;
  const lire = () => {
    const j = jetons[i++];
    if (j === "(") { const v = somme(); i += 1; return v; }
    return valeurDe(j);
  };
  const fraction = () => {
    let v = lire();
    while (jetons[i] === "/") { i += 1; v /= lire(); }
    return v;
  };
  const produit = () => {
    let v = fraction();
    while (jetons[i] === "×" || jetons[i] === "÷") { const op = jetons[i++]; const w = fraction(); v = op === "×" ? v * w : v / w; }
    return v;
  };
  const somme = () => {
    let v = produit();
    while (jetons[i] === "+" || jetons[i] === "−") { const op = jetons[i++]; const w = produit(); v = op === "+" ? v + w : v - w; }
    return v;
  };
  const v = somme();
  return i === jetons.length ? v : null;
}
const proches = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
// Une égalité (« a = b = c ») vraie : chaque membre lisible a la même valeur.
function egaliteVraie(texte) {
  const membres = blanc(texte).split(" = ").map(evaluer);
  if (membres.some(v => v === null) || membres.length < 2) return null;
  return membres.every(v => proches(v, membres[0]));
}
// Lot 7e-2 (choix de Gwenaël) : la fraction d'une quantité s'écrit en mots,
// sans signe = (« Une part, c’est 50 g. », « 1/10 de 500 g, c’est 50 g. »,
// « La moitié de 14 L, c’est 7 L. ») : la phrase est vraie quand son nombre
// est la part, la moitié dite, pour le calcul `calcul`. null : pas une telle
// phrase.
function phraseVraie(texte, calcul) {
  const t = blanc(texte);
  const nb = x => valeurDe(x);
  let m;
  if ((m = /^Une part, c’est ([\d ,]+) (\S+)\.$/.exec(t)) && calcul.f3) return proches(nb(m[1]), calcul.f3.N / calcul.f3.d) && m[2] === calcul.f3.unite;
  // (Lot 7c, F4 : « Une part, c’est 50 g. », « 3/10 de 500 g, c’est 150 g. ».)
  if ((m = /^Une part, c’est ([\d ,]+) (\S+)\.$/.exec(t)) && calcul.f4) return proches(nb(m[1]), calcul.f4.N / calcul.f4.d) && m[2] === calcul.f4.unite;
  if ((m = /^(\d+)\/(\d+) de ([\d ,]+) (\S+), c’est ([\d ,]+) \4\.$/.exec(t))) return proches(nb(m[5]), nb(m[3]) * Number(m[1]) / Number(m[2]));
  if ((m = /^1\/(\d+) de ([\d ,]+) (\S+), c’est ([\d ,]+) \3\.$/.exec(t))) return proches(nb(m[4]), nb(m[2]) / Number(m[1]));
  if ((m = /^La moitié de ([\d ,]+) (\S+), c’est ([\d ,]+) \2\.$/.exec(t))) return proches(nb(m[3]), nb(m[1]) / 2);
  return null;
}
const avecReponse = (texte, reponse, ecrite = null) => (blanc(texte).includes("□/□") && ecrite
  // (Lot 6 « fraction à deux cases » : « 3 × □/□ = 2 » → « 3 × 2/3 = 2 ».)
  ? blanc(texte).replace("□/□", ecrite)
  : blanc(texte).replace(CORE.CASE, CORE.formaterNombre(reponse).replace(/[  ]/g, " ")));

// -------------------------------------------------------------- les dessins

function nombresDuDessin(svg) {
  const nombres = new Set();
  for (const [, texte] of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
    const net = texte.replace(/[   ]/g, "").replace(/^[+−×÷-]/, "");
    if (/^\d+(,\d+)?$/.test(net)) nombres.add(Number(net.replace(",", ".")));
    const resultat = net.match(/=(\d+(,\d+)?)$/);
    if (resultat) nombres.add(Number(resultat[1].replace(",", ".")));
  }
  return nombres;
}
const vertsDe = svg => (svg.match(new RegExp(`(fill|stroke)="${VERT}"`, "g")) || []).length;
const viewBox = svg => svg.match(/viewBox="([^"]+)"/)[1];
// Les fractions et les décimaux de F1 : une graduation (« 1 », « 0,2 ») n'est
// pas une réponse écrite trop tôt — leur contrôle est à part.
const FRACTIONS = new Set(["F1", "F2", "F3", "F5", "F6", "F8", "F4", "F9", "F11"]);

function verifierDessins(cle, calcul, ecris) {
  const id = cle.split("-")[0];
  assert.equal(ecris.dessins.length, ecris.etapes.length + 1, `${cle} ${calcul.texte} : un dessin avant la première étape, puis un par étape`);
  const svgs = ecris.dessins.map(AIDES.dessinerImage);
  const taille = viewBox(svgs[0]);
  svgs.forEach((svg, k) => assert.equal(viewBox(svg), taille, `${cle} ${calcul.texte} : le dessin ${k} a la taille du premier`));
  const revele = AIDES.dessinerImage(ecris.solution.image);
  assert.equal(viewBox(revele), taille, `${cle} ${calcul.texte} : la réponse donnée a la même taille`);
  assert.equal(vertsDe(svgs[0]), 0, `${cle} ${calcul.texte} : rien de vert avant la première étape`);
  assert.notEqual(svgs[svgs.length - 1], svgs[0], `${cle} ${calcul.texte} : le dessin se remplit`);
  svgs.forEach((svg, k) => {
    if (k > 0) assert.ok(vertsDe(svg) >= vertsDe(svgs[k - 1]), `${cle} ${calcul.texte} : le dessin ${k} perd un morceau trouvé`);
  });
  if (!FRACTIONS.has(id)) {
    const reponses = ecris.etapes.map(etape => Number(etape.reponse));
    // (Les nombres du calcul et de la consigne sont écrits dès le début :
    // double de 15 = 10 + 10 + 5 + 5, le 10 du dessin n'est pas « 5 + 5 ».)
    // Les chiffres du calcul aussi : dans le tableau de numération, 800 ÷ 100
    // écrit son 8 dans sa colonne avant que l'élève ait trouvé 8.
    const chiffres = (String(calcul.texte).match(/\d/g) || []).map(Number);
    const ecrits = new Set([...nombresDe(calcul.texte), ...nombresDe(ecris.consigne || ""), ...chiffres]);
    // Une réponse est une donnée quand une étape d'avant (ou la sienne)
    // l'écrit déjà comme nombre du calcul : 46 + □ = 100 passe par 50, et
    // « 50 + □ = 100 » vaut 50 — le point 50 n'est pas la réponse. Au
    // contraire, 236 + 4 = 240 : 240 n'est écrit qu'après (« 240 + 3 »).
    const donnee = j => ecris.etapes.slice(0, j + 1).some(etape => nombresDe(etape.texte).includes(reponses[j]));
    svgs.forEach((svg, k) => {
      const trouvees = new Set(reponses.slice(0, k));
      const interdites = reponses.map((r, j) => (j >= k && !trouvees.has(r) && !ecrits.has(r) && !donnee(j) ? r : null)).filter(r => r !== null);
      for (const n of nombresDuDessin(svg)) assert.ok(!interdites.includes(n), `${cle} ${calcul.texte} : ${n} est écrit dans le dessin ${k}, avant d'être trouvé`);
    });
    return;
  }
  // Les fractions : la réponse n'est pas écrite avant l'étape qui la trouve.
  const n = ecris.etapes.length;
  const premiere = ecris.etapes.findIndex(etape => CORE.memeNombre(etape.reponse, calcul.reponse));
  ecris.dessins.forEach((d, k) => {
    if (k > premiere) return;
    if (d.outil === "barre-droite" && d.bas) assert.ok(String(d.bas.texte).includes("?") && !d.bas.trouve, `${cle} ${calcul.texte} : l'accolade garde « ? » au dessin ${k}`);
    if (d.outil === "fois-fraction") assert.ok(!d.trouve, `${cle} ${calcul.texte} : la case reste à trouver au dessin ${k}`);
    if (d.outil === "tout-parts") assert.ok(!d.trouve, `${cle} ${calcul.texte} : la part reste à trouver au dessin ${k}`);
  });
  const fin = ecris.dessins[n];
  // (Lot 6 : la fraction cherchée écrit « 2/3 » sur ses crochets.)
  if (fin.outil === "barre-droite") assert.ok((fin.bas && fin.bas.trouve) || Object.values(fin.ecrits || {}).some(e => e.trouve) || (fin.haut || []).some(h => h.trouve && h.texte === calcul.ecrite), `${cle} ${calcul.texte} : le dernier dessin écrit la réponse`);
}

// -------------------------------------------------------- les vérifications

function verifierEcris(cle, tire, lecon) {
  const {calcul, ecris} = tire;
  const modele = lecon.calculs.ecris;
  const nom = `${cle} ${calcul.texte}`;
  // La sorte et l'écriture de la leçon ; jamais un calcul de la leçon.
  assert.equal(CORE.sorteDansNiveau(cle, calcul), CORE.sorteDansNiveau(cle, modele), `${nom} : la sorte de la leçon`);
  assert.equal(calcul.forme, modele.forme, `${nom} : l'écriture de la leçon`);
  assert.equal(`${calcul.module}-${calcul.niveau}`, cle, `${nom} : un calcul du niveau`);
  assert.ok(!lecon.textes.includes(calcul.texte) && calcul.texte !== lecon.calculs.montre.texte, `${nom} : pas un calcul de la leçon`);
  // Les étapes : vraies, une case chacune, la dernière donne la réponse.
  assert.ok(ecris.etapes.length >= 1);
  ecris.etapes.forEach((etape, k) => {
    // (Lot 6 : ou la fraction à deux cases, « □/□ », qui est une réponse.)
    assert.equal(etape.texte.replace("□/□", CORE.CASE).split(CORE.CASE).length, 2, `${nom} : l'étape ${k + 1} a une case`);
    assert.ok(Number.isFinite(Number(etape.reponse)), `${nom} : l'étape ${k + 1} a une réponse`);
    const ecrite = avecReponse(etape.texte, etape.reponse, etape.ecrite);
    assert.equal(egaliteVraie(ecrite) ?? phraseVraie(ecrite, calcul), true, `${nom} : l'étape « ${etape.texte} » → ${etape.reponse} est vraie`);
  });
  assert.ok(CORE.memeNombre(ecris.etapes[ecris.etapes.length - 1].reponse, calcul.reponse), `${nom} : la dernière étape donne la réponse`);
  assert.ok(CORE.memeNombre(ecris.reponse, calcul.reponse), nom);
  // La consigne : vraie quand elle est une égalité sans « ? » ; jamais la
  // réponse (sauf si le calcul lui-même l'écrit).
  const consigne = blanc(ecris.consigne || "");
  const dansLeCalcul = new Set(nombresDe(calcul.texte));
  if (consigne.includes(" = ") && !consigne.includes("?")) {
    const vraie = egaliteVraie(consigne);
    if (vraie !== null) assert.equal(vraie, true, `${nom} : la consigne « ${consigne} » est vraie`);
  }
  // (Sauf quand la leçon elle-même le fait : F1-1, « 7/10 = ? » écrit le 10.)
  const voulu = [lecon.ecris.consigne || "", ...lecon.ecris.etapes.map(e => e.texte)].some(t => nombresDe(t).some(x => proches(x, Number(modele.reponse))))
    && !nombresDe(modele.texte).some(x => proches(x, Number(modele.reponse)));
  if (!dansLeCalcul.has(Number(calcul.reponse)) && !voulu) {
    assert.ok(!nombresDe(consigne).some(x => proches(x, Number(calcul.reponse))), `${nom} : la consigne « ${consigne} » n'écrit pas la réponse`);
    // Les étapes grisées non plus (elles se voient dès le début).
    ecris.etapes.forEach(etape => assert.ok(!nombresDe(etape.texte).some(x => proches(x, Number(calcul.reponse))), `${nom} : l'étape « ${etape.texte} » n'écrit pas la réponse`));
  }
  // « Dans 234, le chiffre des dizaines est 3. »
  const chiffre = consigne.match(/^Dans ([\d ]+), le chiffre des (dizaines|centaines|milliers) est (\d)\.$/);
  if (chiffre) {
    const rang = {dizaines: 10, centaines: 100, milliers: 1000}[chiffre[2]];
    assert.equal(Math.floor(valeurDe(chiffre[1]) / rang) % 10, Number(chiffre[3]), `${nom} : ${consigne}`);
  }
  verifierDessins(cle, calcul, ecris);
}

test("lot 3c : chaque recette redonne le J'écris de la leçon, sur son calcul", () => {
  assert.equal(NIVEAUX.length, 125, "lot 7a : D5, D6, D7 en plus ; lot 7b : D8, D9, M13 ; lot 7c : F4, F9, F11 ; lot 7d : M11, A9, C4, M9");
  const memes = x => blanc(JSON.stringify(x));
  NIVEAUX.forEach(cle => {
    const lecon = CORE.niveauDe(cle).niveau.apprends;
    const ecris = CORE.ecrisDuCalcul(cle, lecon.calculs.ecris);
    assert.ok(ecris, `${cle} : une recette`);
    assert.equal(blanc(ecris.consigne || ""), blanc(lecon.ecris.consigne || ""), `${cle} : la consigne`);
    assert.equal(memes(ecris.etapes), memes(lecon.ecris.etapes), `${cle} : les étapes`);
    assert.equal(memes(ecris.dessins), memes(lecon.ecris.dessins), `${cle} : les dessins`);
    assert.equal(memes(ecris.solution), memes(lecon.ecris.solution), `${cle} : la réponse donnée`);
  });
});

test("lot 3c : la leçon elle-même passe les mêmes contrôles", () => {
  NIVEAUX.forEach(cle => {
    const lecon = CORE.niveauDe(cle).niveau.apprends;
    // (Le calcul de la leçon est, par définition, un calcul de la leçon.)
    const {calcul, ecris} = {calcul: lecon.calculs.ecris, ecris: lecon.ecris};
    const ecrite = avecReponse(ecris.etapes[0].texte, ecris.etapes[0].reponse);
    assert.equal(egaliteVraie(ecrite) ?? phraseVraie(ecrite, calcul), true, `${cle} : ${ecris.etapes[0].texte}`);
    verifierDessins(cle, Object.assign({}, calcul, {module: calcul.module, niveau: 0}), ecris);
  });
});

test(`lot 3c : ${TIRAGES} tirages par niveau — sorte, étapes, consigne, dessins`, () => {
  const resume = [];
  NIVEAUX.forEach(cle => {
    const lecon = CORE.niveauDe(cle).niveau.apprends;
    const vus = new Set();
    for (let g = 1; g <= TIRAGES; g += 1) {
      const tire = CORE.ecrisTire(cle, {graine: graineDe(cle, g)});
      assert.ok(tire, `${cle} : un calcul tiré (graine ${g})`);
      if (!vus.has(tire.calcul.texte)) verifierEcris(cle, tire, lecon);
      vus.add(tire.calcul.texte);
    }
    resume.push(`${cle} ${vus.size}`);
    assert.ok(vus.size >= 1, cle);
  });
});

test("lot 3c : la même graine rend le même calcul ; une autre en rend souvent un autre", () => {
  NIVEAUX.forEach(cle => {
    const a = CORE.ecrisTire(cle, {graine: 12345});
    const b = CORE.ecrisTire(cle, {graine: 12345});
    assert.equal(a.calcul.texte, b.calcul.texte, cle);
    const autres = new Set(Array.from({length: 40}, (_, g) => CORE.ecrisTire(cle, {graine: g + 1}).calcul.texte));
    // Les niveaux « par cœur » de fractions n'ont que 1 ou 2 calculs possibles.
    assert.ok(autres.size >= (["F2-1", "F2-2", "F1-2"].includes(cle) ? 1 : 2), `${cle} : ${autres.size} calcul(s) en 40 tirages`);
  });
});

test("lot 3c : jamais un calcul de la série en cours", () => {
  NIVEAUX.forEach(cle => {
    for (let g = 1; g <= 30; g += 1) {
      const serie = CORE.genererSerie(cle, {graine: g * 7, genre: "entraine", total: 20, exclure: CORE.niveauDe(cle).niveau.apprends.textes});
      const exclure = serie.map(c => c.texte);
      const tire = CORE.ecrisTire(cle, {graine: g, exclure});
      // Un niveau au tout petit vivier peut n'avoir plus rien : on garde
      // alors le J'écris de la leçon (null).
      if (tire) assert.ok(!exclure.includes(tire.calcul.texte), `${cle} : ${tire.calcul.texte} est déjà dans la série`);
    }
  });
});

test("lot 3c : les décisions de la recette (calculs écartés)", () => {
  const tous = (cle, n = 300) => new Set(Array.from({length: n}, (_, g) => CORE.ecrisTire(cle, {graine: g + 1}).calcul.texte));
  // Doubles : deux morceaux, comme la leçon (pas « double de 8 », pas « double de 124 »).
  for (const t of tous("M1-1")) assert.match(t, /^double de 1\d = /);
  for (const t of tous("M1-3")) assert.match(t, /^double de \d\d = /);
  // Repères : au-delà de 4 fois 25 (100 = 4 × 25).
  for (const t of tous("M5-1")) assert.ok(nombresDe(t).some(x => x >= 5 && x <= 7), t);
  // Garder l'égalité : dans le sens de la leçon (365 + 9 = 362 + □).
  for (const t of tous("C3-2")) { const [a, , c] = nombresDe(t); assert.ok(a > c, t); }
  // Fractions égales : au-delà de 12 parts, comme la leçon (les deux flèches) ;
  // F6-1 (lot 7e, programme du CE2) : sur les bandes, comme sa leçon.
  ["F6-1", "F6-2", "F6-3"].forEach(cle => { for (let g = 1; g <= 100; g += 1) assert.equal(CORE.ecrisTire(cle, {graine: g}).ecris.dessins[0].outil, cle === "F6-1" ? "barre-droite" : "fois-fraction", cle); });
  // Dixièmes, comme la leçon.
  for (const t of tous("F1-1")) assert.match(t, /^0,\d = \d\/□$/);
  // Fraction d'une quantité : l'unité change, la méthode non.
  assert.ok(tous("F3-2").size >= 5);
});
