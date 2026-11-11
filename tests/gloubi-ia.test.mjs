import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Lot « Coffres magiques : le chemin des coffres et le cadeau Gloubi »
// (09/11/2026) — les quatre Gloubi des Carrés gloutons, sans page.
const G = createRequire(import.meta.url)("../assets/js/gloubi-ia.js");
const { masqueDe, gains, cadeaux, chaineOfferte, meilleursCoupsExacts, JOUEURS, SEGMENTS } = G._interne;

function graine(n) {
  let g = n | 0;
  return () => {
    g = (g + 0x6d2b79f5) | 0;
    let t = Math.imul(g ^ (g >>> 15), 1 | g);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const libres = m => SEGMENTS.map((_, i) => i).filter(i => !((m >>> i) & 1));
const cles = m => SEGMENTS.filter((_, i) => (m >>> i) & 1);

// Un plateau au hasard avec « n » segments déjà tracés.
function plateau(n, alea) {
  let m = 0;
  const l = SEGMENTS.map((_, i) => i);
  for (let k = 0; k < n; k += 1) {
    const j = k + Math.floor(alea() * (l.length - k));
    [l[k], l[j]] = [l[j], l[k]];
    m |= 1 << l[k];
  }
  return m >>> 0;
}

// Minimax sans élagage ni mémoire : la vérité, lente, pour les petits plateaux.
function verite(m) {
  if (m === 0xffffff) return 0;
  let best = -100;
  for (const i of libres(m)) {
    const g = gains(m, i);
    const suite = (m | (1 << i)) >>> 0;
    const v = g ? g + verite(suite) : -verite(suite);
    if (v > best) best = v;
  }
  return best;
}

test("Gloubi : 24 segments nommés comme dans la page, quatre crans du plus faible au plus fort", () => {
  assert.equal(G.SEGMENTS.length, 24);
  assert.ok(G.SEGMENTS.includes("h-0-0") && G.SEGMENTS.includes("v-2-3"));
  assert.deepEqual(G.CRANS, ["distrait", "gourmand", "malin", "champion"]);
  assert.equal(G.nomDuCran(1), "distrait");
  assert.equal(G.nomDuCran(4), "champion");
  assert.equal(G.nomDuCran(9), "champion");
  assert.equal(G.nomDuCran("n'importe quoi"), "gourmand", "un cran inconnu rend le Gloubi d'origine");
});

test("Gloubi : chaque cran trace toujours un segment libre, et rien sur un plateau plein", () => {
  const alea = graine(3);
  for (const cran of G.CRANS) {
    for (let k = 0; k < 120; k += 1) {
      const m = plateau(Math.floor(alea() * 24), alea);
      const coup = G.choisir(cran, cles(m), alea);
      assert.ok(SEGMENTS.includes(coup), `${cran} : ${coup}`);
      assert.ok(!cles(m).includes(coup), `${cran} trace un segment déjà pris`);
    }
    assert.equal(G.choisir(cran, SEGMENTS, alea), null);
  }
  assert.throws(() => G.choisir("malin", ["h-9-9"]), /segment inconnu/);
});

test("Gloubi : les trois premiers prennent toujours un carré offert ; le gourmand prend le plus gros", () => {
  const alea = graine(5);
  let vus = 0;
  for (let k = 0; k < 400; k += 1) {
    const m = plateau(8 + Math.floor(alea() * 14), alea);
    const fermants = libres(m).filter(i => gains(m, i) > 0);
    if (!fermants.length) continue;
    vus += 1;
    for (const cran of ["distrait", "gourmand", "malin"]) {
      const i = JOUEURS[cran](m, alea);
      assert.ok(gains(m, i) > 0, `${cran} laisse passer un carré`);
    }
    const max = Math.max(...fermants.map(i => gains(m, i)));
    assert.equal(gains(m, JOUEURS.gourmand(m, alea)), max);
  }
  assert.ok(vus > 50, "assez de plateaux avec un carré à prendre");
});

test("Gloubi : le distrait ne voit pas les cadeaux qu'il fait, le malin et le gourmand si", () => {
  const alea = graine(8);
  let distraitOffre = 0;
  for (let k = 0; k < 400; k += 1) {
    const m = plateau(6 + Math.floor(alea() * 6), alea);
    if (libres(m).some(i => gains(m, i) > 0)) continue;
    const surs = libres(m).filter(i => cadeaux(m, i) === 0);
    if (!surs.length) continue;
    assert.equal(cadeaux(m, JOUEURS.gourmand(m, alea)), 0, "le gourmand joue sans cadeau quand il peut");
    assert.equal(cadeaux(m, JOUEURS.malin(m, alea)), 0, "le malin aussi");
    if (cadeaux(m, JOUEURS.distrait(m, alea)) > 0) distraitOffre += 1;
  }
  assert.ok(distraitOffre > 10, `le distrait offre des carrés (${distraitOffre} fois)`);
});

// Les plateaux d'une vraie partie (deux malins), coup après coup.
function positionsDePartie(alea) {
  const vues = [];
  let m = 0;
  while (m !== 0xffffff) {
    vues.push(m);
    m = (m | (1 << JOUEURS.malin(m, alea))) >>> 0;
  }
  return vues;
}

test("Gloubi : obligé d'offrir, le malin offre la plus petite chaîne", () => {
  const alea = graine(13);
  let vus = 0;
  for (let k = 0; k < 200 && vus < 40; k += 1) {
    for (const m of positionsDePartie(alea)) {
      const l = libres(m);
      if (!l.length || l.some(i => gains(m, i) > 0) || l.some(i => cadeaux(m, i) === 0)) continue;
      vus += 1;
      const min = Math.min(...l.map(i => chaineOfferte(m, i)));
      assert.equal(chaineOfferte(m, JOUEURS.malin(m, alea)), min);
    }
  }
  assert.ok(vus >= 10, `plateaux sans coup sûr trouvés : ${vus}`);
});

test("Gloubi champion : le calcul exact donne la vraie valeur et joue un meilleur coup", () => {
  const alea = graine(21);
  for (let k = 0; k < 60; k += 1) {
    const m = plateau(24 - (5 + Math.floor(alea() * 5)), alea); // 5 à 9 segments libres
    const exact = meilleursCoupsExacts(m);
    assert.equal(exact.valeur, verite(m), "alpha-bêta = minimax complet");
    const i = JOUEURS.champion(m, alea);
    const g = gains(m, i);
    const suite = (m | (1 << i)) >>> 0;
    assert.equal(g ? g + verite(suite) : -verite(suite), exact.valeur, "le coup joué atteint la meilleure valeur");
  }
});

test("Gloubi champion : il sait refuser deux carrés pour garder la main (double coup)", () => {
  // Des plateaux de vraies parties où le meilleur coup N'EST PAS de prendre le
  // carré offert : le champion doit les trouver, le malin non.
  const alea = graine(34);
  let trouves = 0;
  for (let k = 0; k < 300 && trouves < 5; k += 1) for (const m of positionsDePartie(alea)) {
    if (libres(m).length > 12 || trouves >= 5) continue;
    const fermants = libres(m).filter(i => gains(m, i) > 0);
    if (!fermants.length) continue;
    const exact = meilleursCoupsExacts(m);
    if (exact.coups.some(i => gains(m, i) > 0)) continue; // prendre est (aussi) optimal
    trouves += 1;
    const i = JOUEURS.champion(m, alea);
    assert.equal(gains(m, i), 0, "le champion refuse le carré quand c'est mieux");
    assert.ok(gains(m, JOUEURS.malin(m, alea)) > 0, "le malin, lui, prend");
  }
  assert.ok(trouves >= 1, `positions de double coup trouvées : ${trouves}`);
});

function manche(eleve, cran, eleveCommence, alea) {
  let m = 0, tourEleve = eleveCommence, e = 0;
  while (m !== 0xffffff) {
    const i = tourEleve ? JOUEURS[eleve](m, alea) : JOUEURS[cran](m, alea);
    const k = gains(m, i);
    m = (m | (1 << i)) >>> 0;
    if (k) { if (tourEleve) e += k; } else tourEleve = !tourEleve;
  }
  return e;
}

test("Gloubi champion : il bat nettement le malin, et chaque coup reste rapide", () => {
  const alea = graine(55);
  const N = 300;
  let gagnesContreMalin = 0, gagnesContreChampion = 0, pire = 0;
  for (let k = 0; k < N; k += 1) {
    if (manche("malin", "malin", true, alea) + manche("malin", "malin", false, alea) > 9) gagnesContreMalin += 1;
    const t0 = performance.now();
    if (manche("malin", "champion", true, alea) + manche("malin", "champion", false, alea) > 9) gagnesContreChampion += 1;
    pire = Math.max(pire, performance.now() - t0);
  }
  const pMalin = gagnesContreMalin / N, pChampion = gagnesContreChampion / N;
  assert.ok(pChampion <= 0.25, `l'élève malin gagne ${Math.round(100 * pChampion)} % contre le champion (≤ 25 %)`);
  assert.ok(pChampion < pMalin - 0.1, `nettement moins que contre le malin (${Math.round(100 * pMalin)} %)`);
  assert.ok(pire < 400, `un match complet du champion tient en ${Math.round(pire)} ms`);
});
