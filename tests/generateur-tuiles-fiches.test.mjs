import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Nouveau générateur des fiches avec les tuiles (lot 1, 21/11/2026) — outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html
// Six formes d'exercices (écrire, réduire, l'opposé, développer en lisant / en construisant le rectangle, factoriser),
// tout avec les tuiles, négatifs compris. Le moteur vit dans <script id="moteur-tuiles"> : on le fait tourner ici sans navigateur.
// Chaque réponse est recalculée INDÉPENDAMMENT du moteur : on remplace 𝑥 par plusieurs valeurs dans le texte affiché.
const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const page = lire("outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html");
const source = page.match(/<script id="moteur-tuiles">([\s\S]*?)<\/script>/)[1];
const M = vm.runInNewContext(`${source}\n;MoteurTuiles`, {});

// ---- calcul indépendant : la valeur d'un texte affiché (« (𝑥 − 3) × 2 », « −2𝑥(𝑥 + 1) », « (𝑥 + 2)² »…) pour 𝑥 = v
function valeur(texte, v) {
  let s = texte.replace(/−/g, "-").replace(/×/g, "*").replace(/ /g, "");
  s = s.replace(/\(([^()]*)\)²/g, "(($1)*($1))").replace(/x²/g, "(x*x)");
  s = s.replace(/(\d|x|\))(?=\(|x)/g, "$1*");
  assert.doesNotMatch(s, /[^0-9x()+\-*]/, `caractère inattendu dans « ${texte} »`);
  return Function("x", `return ${s};`)(v) + 0;   // + 0 : pas de « −0 »
}
const VALEURS = [-3, -1, 0, 2, 5, 7];
const memeValeur = (a, b, msg) => { for (const v of VALEURS) assert.equal(valeur(a, v), valeur(b, v), `${msg} (𝑥 = ${v}) : ${a} ≠ ${b}`); };
const valeurTas = (groupes, v) => groupes.reduce((t, [k, n]) => t + n * (k === "x2" ? v * v : k === "x" ? v : 1), 0) + 0;
const valeurBord = (l, v) => l.reduce((t, k) => t + (k.startsWith("-") ? -1 : 1) * (k.endsWith("x") ? v : 1), 0);
const valeurRect = (g, h, v) => { let t = 0; for (const a of g) for (const b of h) { const s = a.startsWith("-") !== b.startsWith("-") ? -1 : 1; t += s * (a.endsWith("x") ? v : 1) * (b.endsWith("x") ? v : 1); } return t; };
const reduite = (t) => { const k = t.replace(/^−/, "").split(/ [+−] /).map((m) => (/x²$/.test(m) ? 2 : /x$/.test(m) ? 1 : 0)); return k.every((d, i) => i === 0 || d < k[i - 1]); };

const ETATS = [];
for (const tuiles of ["x1", "x2"]) for (const negT of ["sans", "avec"]) for (const negR of ["sans", "paren", "partout"])
  for (const facteurs of [["nombre"], ["x"], ["double"], ["carre"], ["nombre", "x", "double", "carre"]]) ETATS.push({ tuiles, negT, negR, facteurs });

test("toutes les formes × tous les réglages : chaque réponse est juste (recalculée sans le moteur)", () => {
  let n = 0;
  for (const etat of ETATS) for (const forme of M.ORDRE) for (const graine of [1, 77, 2026]) {
    const liste = M.reserve(forme, etat, graine, 40);
    // un exercice faux est écarté par le moteur : une réserve vide ou presque trahirait un tirage faux
    assert.ok(liste.length >= 6, `${forme} ${JSON.stringify(etat)} : ${liste.length} exercices seulement`);
    for (const it of liste) {
      n++;
      switch (forme) {
        case "ecrire":
          for (const v of VALEURS) assert.equal(valeurTas(it.tas, v), valeur(it.reponse, v), it.reponse);
          assert.ok(reduite(it.reponse), it.reponse);
          break;
        case "reduire":
          memeValeur(it.enonce, it.reponse, "réduction");
          for (const v of VALEURS) assert.equal(valeurTas(it.tas, v), valeur(it.enonce, v));
          for (const v of VALEURS) assert.equal(valeurTas(it.reste, v), valeur(it.reponse, v), "le corrigé en tuiles");
          assert.ok(reduite(it.reponse), it.reponse);
          if (etat.negT === "avec") assert.ok(it.paires.length > 0, `pas de paire nulle : ${it.enonce}`);
          else assert.doesNotMatch(it.enonce, /−/, "sans négatifs");
          break;
        case "oppose":
          for (const v of VALEURS) assert.equal(valeur(it.enonce, v) + valeur(it.reponse, v), 0, it.enonce);
          for (const v of VALEURS) assert.equal(valeurTas(it.tas, v), valeur(it.enonce, v));
          break;
        case "lire": case "construire":
          for (const l of it.lignes) memeValeur(it.enonce, l, "développement");
          for (const v of VALEURS) {
            assert.equal(valeurRect(it.gauche, it.haut, v) + 0, valeur(it.enonce, v), `rectangle de ${it.enonce}`);
            assert.equal(valeurBord(it.gauche, v) * valeurBord(it.haut, v) + 0, valeur(it.enonce, v), `bords de ${it.enonce}`);
          }
          if (it.lignes.length > 1) assert.ok(reduite(it.lignes[1]), it.lignes[1]);
          if (etat.negR === "sans") assert.doesNotMatch(it.enonce, /−/, "sans négatifs");
          if (etat.negR === "paren") assert.doesNotMatch(it.enonce, /^−/, "le facteur devant reste positif");
          break;
        case "factoriser":
          memeValeur(it.enonce, it.reponse, "factorisation");
          assert.match(it.reponse, /\)/, "la réponse est un produit");
          assert.ok(reduite(it.enonce), it.enonce);
          for (const v of VALEURS) assert.equal(valeurRect(it.gauche, it.haut, v) + 0, valeur(it.enonce, v));
          break;
      }
    }
  }
  assert.ok(n > 20000, `${n} exercices seulement`);
});

test("le moteur vérifie lui-même chaque exercice avant de le garder", () => {
  const faux = { forme: "lire", enonce: "2(x − 3)", lignes: ["2x − 5"], gauche: ["1", "1"], haut: ["x", "-1", "-1", "-1"] };
  assert.match(M.verifierItem(faux), /ligne fausse/);
  const signe = { forme: "lire", enonce: "2(x − 3)", lignes: ["2x − 6"], gauche: ["1", "1"], haut: ["x", "1", "1", "1"] };
  assert.match(M.verifierItem(signe), /rectangle ≠ produit/);
  assert.equal(M.verifierItem({ ...faux, lignes: ["2x − 6"] }), null);
});

test("même graine, mêmes exercices ; autre graine, autres exercices ; jamais deux fois le même", () => {
  const etat = { tuiles: "x2", negT: "avec", negR: "paren", facteurs: ["nombre", "x", "double", "carre"] };
  for (const forme of M.ORDRE) {
    const a = M.reserve(forme, etat, 5, 30).map((i) => i.cle);
    assert.deepEqual(M.reserve(forme, etat, 5, 30).map((i) => i.cle), a, forme);
    assert.notDeepEqual(M.reserve(forme, etat, 6, 30).map((i) => i.cle), a, forme);
    assert.equal(new Set(a).size, a.length, `${forme} : doublon`);
  }
  // une option d'une autre forme ne change pas les nombres (seules les options de la forme comptent)
  const e1 = M.reserve("ecrire", etat, 9, 20).map((i) => i.cle);
  assert.deepEqual(M.reserve("ecrire", { ...etat, negR: "partout", facteurs: ["carre"] }, 9, 20).map((i) => i.cle), e1);
});

test("les types de facteur cochés tournent : la fiche fait tous les cas", () => {
  const etat = { tuiles: "x2", negT: "avec", negR: "paren", facteurs: ["nombre", "x", "double", "carre"] };
  for (const forme of ["lire", "construire", "factoriser"]) {
    const l = Array.from(M.reserve(forme, etat, 3, 8), (i) => i.sous);   // tableau de ce contexte-ci (le moteur tourne dans vm)
    assert.deepEqual(l, ["nombre", "x", "double", "carre", "nombre", "x", "double", "carre"], forme);
  }
});

test("négatifs « partout » : un facteur négatif devant, aussi en tuiles (règle des signes)", () => {
  const l = M.reserve("lire", { tuiles: "x2", negT: "avec", negR: "partout", facteurs: ["nombre", "x"] }, 4, 40);
  const devant = l.filter((i) => i.enonce.startsWith("−"));
  assert.ok(devant.length >= 5, "des facteurs négatifs devant la parenthèse");
  for (const it of devant) assert.ok(it.gauche.every((k) => k.startsWith("-")), `le facteur ${it.enonce} est en tuiles rouges`);
  // rouge × rouge = vert : la tuile du produit est positive
  const svg = M.rectangle(["-1"], ["-1"]).html;
  assert.equal((svg.match(/class="tn"/g) || []).length, 2, "les deux bords rouges");
  assert.equal((svg.match(/class="tp"/g) || []).length, 1, "le produit vert");
});

test("dessin : la tuile 1 fait 4,4 mm partout (bords compris), 𝑥 = 3,4 unités, coins droits", () => {
  const r = M.rectangle(["x", "1"], ["x", "-1", "-1"]).html;
  const rects = [...r.matchAll(/<rect class="t[pn]" x="[^"]+" y="[^"]+" width="([^"]+)" height="([^"]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.equal(rects.length, 2 * 3 + 2 + 3, "6 tuiles dans le rectangle + 5 sur les bords");
  for (const [w, h] of rects) for (const c of [w, h]) assert.ok([4.4, 14.96].includes(c), `côté ${c} mm`);
  assert.doesNotMatch(r + M.tas([["x2", 1], ["x", 2], ["1", -3]]).html, /<rect class="t[pn]"[^>]*\brx=/);
  assert.match(M.rectangle(["1"], ["x"], { vide: "interieur" }).html, /stroke-dasharray/);
  assert.equal((M.rectangle(["1"], ["x"], { vide: "bords" }).html.match(/>\?</g) || []).length, 2);
  // les paires nulles sont entourées d'orange
  assert.match(M.paire("x", false).html, /stroke="#B45309"/);
});

test("la page : menu par formes, réglages grisés, vert / rouge par défaut, 𝑥 rond, impression après les polices", () => {
  for (const nom of ["Écrire l’expression", "Réduire", "L’opposé", "Développer", "Factoriser"]) assert.ok(page.includes(nom), nom);
  assert.match(page, /--pos:#72c475; --neg:#ef3f35;/);
  assert.match(page, /body\.couleurs-bg\{ --pos:#FFFFFF; --neg:#A3ADB4; \}/);
  assert.match(page, /couleurs: 'vr'/);
  assert.match(page, /@font-face\{font-family:SplatLettres;src:url\('\/assets\/fonts\/SplatLettres-BoldItalic\.woff2'\)[^}]*unicode-range:U\+1D434-1D467,U\+210E\}/);
  assert.match(page, /document\.fonts\.ready\.then\(\(\) => setTimeout\(\(\) => window\.print\(\), 80\)\)/);
  assert.match(page, /g\.classList\.toggle\('grise', !actif\)/);
  // pied des feuilles : le petit M du site et la licence, pas de Nom / Date, pas de pied de page d'appli
  assert.match(page, /<img src="\/favicon\.svg" alt="" width="17" height="17"><span>mathsgo\.re · CC BY-NC-SA 4\.0<\/span>/);
  assert.doesNotMatch(page, /Nom :|Date :|<footer\b/);
  assert.match(page, /<body\b[^>]*data-mathsgo-parent-place="#retourSlot"/);
});

test("l'ancienne version est gardée à part, hors catalogue et non indexée", () => {
  const ancien = lire("outils/tuiles_algebriques/generateur_exercices_calcul_litteral-ancien.html");
  assert.match(ancien, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(ancien, /rel="canonical"/);
  assert.doesNotMatch(lire("assets/js/catalogue-refonte-data.js"), /generateur_exercices_calcul_litteral-ancien/);
});
