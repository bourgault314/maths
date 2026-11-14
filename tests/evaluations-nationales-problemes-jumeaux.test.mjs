// Lot EN9b — jumeaux STRICTS des tests « Résolution de problèmes » de 6e et de 4e.
// Sur 2 000 graines, pour chacune des 38 questions : 4 réponses différentes, une seule juste ; la bonne réponse et
// chaque piège sont RECALCULÉS ici depuis ce que voit l'élève (énoncé, nombres écrits en lettres, longueurs écrites sur
// le dessin, carreaux comptés dans le dessin, pourcentages du diagramme), avec le raisonnement de la DEPP ; les limites
// décidées avec Gwenaël le 14/11 (DECISIONS-EN9b.md) sont vérifiées ; la vue prof n'a aucun mot genré.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/6e_problemes.js");
require("../outils/evaluations_nationales/sujets/4e_problemes.js");
const { hasard, construire, typo, enLettres } = globalThis.EN;
const S6 = globalThis.EN_SUJETS["6e-problemes"], S4 = globalThis.EN_SUJETS["4e-problemes"];
const GRAINES = 2000;

const texte = (h) => String(h)
  .replace(/<span class="mot-ordi">[^<]*<\/span>/g, "")
  .replace(/<span class="frac"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, "$1/$2")
  .replace(/<span class="mini-tab"[^>]*>([\s\S]*)<\/span>$/, (m, x) => x.replace(/<\/span><span[^>]*>/g, "|"))
  .replace(/<br>/g, " ").replace(/<[^>]+>/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const n = (s) => Number(String(s).replace(/\s/g, "").replace(",", "."));
// Écritures attendues, faites ici (pas celles des générateurs).
const grp = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const d = (x) => { const v = Math.round(x * 1e6) / 1e6; const [e, f] = String(v).split("."); return grp(e) + (f ? "," + f : ""); };
const d2 = (x) => { const [e, f] = (Math.round(x * 100) / 100).toFixed(2).split("."); return grp(e) + "," + f; };
const heure = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
const LETTRES = new Map();
for (let k = 0; k <= 100; k++) LETTRES.set(enLettres(k), k);
const lettres = (mot) => { const v = LETTRES.get(mot.toLowerCase()); assert.ok(v !== undefined, mot); return v; };
const GENRE = /\b(il|elle|ils|elles|lui-même|elle-même|venu|venue)\b(?! s’agit| faut| y a)/i;
const RESTE = /(\d) (km\/h|km²|m²|cm²|mm|cm|dm|km|m|mL|cL|dL|L|kg|g|min|h|%|€)(?![\p{L}\d²³])/u;
const aire = (P) => Math.abs(P.reduce((s, [x, y], i) => { const [u, v] = P[(i + 1) % P.length]; return s + x * v - u * y; }, 0)) / 2;
const dedans = (P, x, y) => { let r = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) r = !r; } return r; };
const textesFig = (fig) => [...fig.matchAll(/<text x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]+)<\/text>/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), att: m[3], t: m[4] }));

// Pour chaque question : la bonne réponse et les trois pièges attendus (textes), recalculés depuis ce que voit l'élève.
const ATTENDU6 = {
  1(e) {
    const m = e.match(/achète (\d+) (.+?) de ([\d,]+) (L|kg) (?:chacune|chacun)\. (?:Une|Un) .+? coute ([\d,]+) €\. Un des calculs ci-dessous permet de trouver le nombre total de (litres|kilogrammes) de/);
    assert.ok(m, e);
    const [, k, , q, u, p, mot] = m;
    assert.equal(mot, u === "L" ? "litres" : "kilogrammes");
    assert.ok(n(k) >= 6 && n(k) <= 20 && !Number.isInteger(n(q)) && !Number.isInteger(n(p)), e);
    return { juste: `${k} × ${q}`, pieges: [`${k} + ${q} + ${p}`, `${k} × ${q} × ${p}`, `${k} × ${p}`] };
  },
  2(e) {
    const m = e.match(/a acheté 3 .+? à (\d+,\d\d) € l’une? et .+? à ([\d,]+) €\. (?:Elle|Il) donne (\d+) €\./);
    assert.ok(m, e);
    const p = n(m[1]), q = n(m[2]), b = n(m[3]), total = 3 * p + q;
    assert.ok([10, 20].includes(b) && total < b && (Number.isInteger(q) || /,50$/.test(m[2])), e);
    return { juste: `${d2(b - total)} €`, pieges: [`${d2(total)} €`, `${d2(p + q)} €`, `${d2(b - p - q)} €`] };
  },
  3(e) {
    const m = e.match(/achète (\d+) (.+?) et paie (\d+) euros\. J’achète (\d+) \2\./);
    assert.ok(m, e);
    const G = n(m[1]), prix = n(m[3]), P = n(m[4]), un = prix / G;
    assert.ok(G === 3 * P && P >= 2 && P <= 5 && prix % 3 === 0 && !Number.isInteger(un), e);
    const eu = (x) => `${d(x)} ${x < 2 ? "euro" : "euros"}`;
    const exact = Math.abs(Math.round(un * 100) - un * 100) < 1e-9;
    return { juste: eu((prix * P) / G), pieges: [eu(prix - (G - P)), exact ? eu(un) : `environ ${eu(Math.round(un * 100) / 100)}`, "3 euros"] };
  },
  4(e) {
    const m = e.match(/j’augmente ce nombre de (\d+), j’obtiens (la moitié de|le double de) ([\d ]+)\./);
    assert.ok(m, e);
    const a = n(m[1]), N = n(m[3]), cible = m[2] === "la moitié de" ? N / 2 : 2 * N;
    assert.ok(a >= 2 && a <= 30 && N % 50 === 0, e);
    return { juste: grp(cible - a), pieges: [grp(cible + a), grp(N + a), grp(N - a)] };
  },
  5(e) {
    const m = e.match(/pour (\d+) personnes, il faut (\d+) .+? pour (\d+) personnes/);
    assert.ok(m, e);
    const [p1, I, p2] = [n(m[1]), n(m[2]), n(m[3])];
    assert.ok([3, 4].includes(p2 / p1), e);
    return { juste: String((I * p2) / p1), pieges: [String(p2), String(p2 + I), String(p1 * I)] };
  },
  6(e, choix) {
    const [a, b] = (e.match(/\d+/g) || []).map(Number);
    assert.ok(a > b && b >= 2 && a <= 6 && !/de chaque/.test(e), e);
    // Le nombre « rond » : un multiple de 5 strictement entre la somme et le produit.
    const rond = choix.map((c) => n(c)).find((v) => ![a * b, a + b, a - b].includes(v));
    assert.ok(rond % 5 === 0 && rond > a + b && rond < a * b, e);
    return { juste: String(a * b), pieges: [String(a + b), String(a - b), String(rond)] };
  },
  7(e) {
    const m = e.match(/a (trois|quatre) fois moins de .+? (?:que |qu’)\S+\. \S+ a (\d+) /);
    assert.ok(m, e);
    const k = m[1] === "trois" ? 3 : 4, x = n(m[2]);
    assert.ok(x % k === 0 && x >= 8 && x <= 30, e);
    return { juste: String(x * k), pieges: [String(x + k), String(x - k), String(x / k)] };
  },
  8(e) {
    const m = e.match(/les (\d+) pièces d’or .* donne (\d+) pièces .* garde les (\d+) dernières/);
    assert.ok(m, e);
    const [T, p, g] = [n(m[1]), n(m[2]), n(m[3])], k = (T - g) / p;
    assert.ok(Number.isInteger(k) && g >= p && g <= 2 * p - 1, e);
    assert.equal(Math.floor(T / p), k + 1, "la division seule donne la bonne réponse + 1");
    return { juste: String(k), pieges: [String(Math.floor(T / p)), String(k - 1), String(k + 2)] };
  },
  9(e) {
    const P = n(e.match(/à (\d+) euros par personne et par jour/)[1]);
    const N = lettres(e.match(/(\S+) (?:personnes|amis)/)[1]), J = lettres(e.match(/(\S+) jours/)[1]);
    assert.ok(P >= 10 && P <= 80 && N >= 2 && N <= 5 && J >= 2 && J <= 10 && J !== N, e);
    const eu = (x) => `${grp(x)} euros`;
    return { juste: eu(P * N * J), pieges: [eu(P * J), eu((N + J) * P), eu(P * N)] };
  },
  10(e) {
    assert.match(e, /à la même vitesse, mais \S+ a commencé/);
    const m = e.match(/a (?:parcouru|nagé|lu) (\d+) \S+, \S+ a (?:parcouru|nagé|lu) (\d+) \S+\. Combien .* en aura (?:parcouru|nagé|lu) (\d+) \?/);
    assert.ok(m, e);
    const [X, Y, D] = [n(m[1]), n(m[2]), n(m[3])];
    assert.ok([2, 3, 4].includes(X / Y), e);
    return { juste: String(X + D - Y), pieges: [String(X + D), String((X * D) / Y), String(Y + D)] };
  },
  11(e) {
    const m = e.match(/Sur (une carte|un plan de ville), 1 cm représente (\d+) (km|m) dans la réalité\. Trouver la distance dans la réalité d’un segment de 10 cm sur (la carte|le plan)\./);
    assert.ok(m, e);
    const v = n(m[2]), u = m[3];
    assert.equal(m[1] === "une carte", u === "km");
    assert.equal(m[4] === "la carte", u === "km");
    assert.ok(v >= 2 && v <= 9, e);
    return { juste: `${10 * v} ${u}`, pieges: [`${d(v / 10)} ${u}`, `${v} ${u}`, `${100 * v} ${u}`] };
  },
  12(e) {
    const D = n(e.match(/parcourt (\d+) km en une heure/)[1]);
    assert.ok(D % 4 === 0 && D >= 12 && D <= 120 && /un quart d’heure/.test(e), e);
    return { juste: `${D / 4} km`, pieges: [`${D / 2} km`, `${(3 * D) / 4} km`, `${D} km`] };
  },
  13(e) {
    const m = e.match(/^Un rectangle a un périmètre de ([\d ]+) m\. Sa longueur mesure (\d+) m\./);
    assert.ok(m, e);
    const P = n(m[1]), L = n(m[2]), l = (P - 2 * L) / 2;
    assert.ok(P % 4 === 0 && L >= 110 && L <= 200 && l > 0 && l < L, e);
    return { juste: `${grp(l)} m`, pieges: [`${grp(P - L)} m`, `${grp(P - 2 * L)} m`, `${grp(P / 4)} m`] };
  },
  14(e) {
    const m = e.match(/de (\d+) .+? identiques pèse (\d+) kg\./);
    assert.ok(m, e);
    const [k, M] = [n(m[1]), n(m[2])];
    assert.ok([0.4, 0.8].includes(M / k), e);
    return { juste: `${d(M / k)} kg`, pieges: [`${d(M / k)} g`, `${d(k / M)} kg`, `${d(k / M)} g`] };
  },
  15(e, choix, g) {
    // Les deux polygones relus dans le dessin (carreaux de 30, origine 4) : aires par la formule du lacet.
    const polys = [...g.figure.matchAll(/<polygon points="([^"]+)"/g)].map((m) => m[1].split(" ").map((p) => p.split(",").map((v) => (Number(v) - 4) / 30)));
    assert.equal(polys.length, 2);
    for (const P of polys) for (let i = 0; i < P.length; i++) {
      const [x, y] = P[i], [u, v] = P[(i + 1) % P.length];
      assert.ok(Number.isInteger(x) && Number.isInteger(y), "sommets sur les nœuds");
      assert.ok(x === u || y === v || Math.abs(x - u) === Math.abs(y - v), "côtés du quadrillage ou diagonales de carreaux");
    }
    const [A, B] = polys.map(aire);
    assert.ok([0.5, 1].includes(Math.abs(A - B)), `écart ${A} / ${B}`);
    // Chaque nom est écrit dans sa figure.
    for (const t of textesFig(g.figure)) {
      const P = polys[t.t === "Figure A" ? 0 : 1], x = (t.x - 4) / 30, y = (t.y - 4) / 30;
      for (const [dx, dy] of [[-0.85, -0.42], [0.85, -0.42], [-0.85, 0.08], [0.85, 0.08]]) assert.ok(dedans(P, x + dx, y + dy), `${t.t} dans sa figure`);
    }
    const textes = ["L’aire de la figure A est plus grande que celle de la figure B.", "L’aire de la figure A est plus petite que celle de la figure B.", "L’aire de la figure A est la même que celle de la figure B.", "On ne peut pas savoir quelle est la plus grande aire car les deux figures ne sont pas superposables."];
    const j = A > B ? 0 : 1;
    return { juste: textes[j], pieges: textes.filter((_, i) => i !== j) };
  },
  16(e, choix, g) {
    // Les longueurs écrites sur le dessin, rangées par chemin : celles du haut vont au chemin du haut.
    const lignes = [...g.figure.matchAll(/<polyline points="([^"]+)"/g)].map((m) => m[1].split(" ").map((p) => p.split(",").map(Number)));
    assert.equal(lignes.length, 2);
    const moy = (L) => L.reduce((s, p) => s + p[1], 0) / L.length;
    const [haut, bas] = moy(lignes[0]) < moy(lignes[1]) ? lignes : [lignes[1], lignes[0]];
    const longueurs = textesFig(g.figure).filter((t) => / m$/.test(t.t)).map((t) => ({ y: t.y, v: n(t.t.replace(" m", "")) }));
    const enHaut = longueurs.filter((t) => t.y < 92).map((t) => t.v), enBas = longueurs.filter((t) => t.y >= 92).map((t) => t.v);
    assert.equal(enHaut.length, haut.length - 1, "une longueur par segment, en haut");
    assert.equal(enBas.length, bas.length - 1, "une longueur par segment, en bas");
    const somme = (l) => l.reduce((a, b) => a + b, 0);
    const trois = haut.length === 4 ? enHaut : enBas, deux = haut.length === 4 ? enBas : enHaut;
    assert.equal(trois.length, 3);
    const tout = [...trois, ...deux];
    assert.ok(tout.every((v) => v % 10 === 0) && somme(deux) - somme(trois) >= 30 && somme(deux) - somme(trois) <= 80, tout.join());
    assert.ok(Math.min(...trois) < Math.min(...deux), "la plus petite longueur est sur le chemin le plus court");
    return { juste: `${somme(trois)} m`, pieges: [`${Math.min(...tout)} m`, `${somme(tout)} m`, `${somme(deux)} m`] };
  },
  17(e) {
    const m = e.match(/il faut (un|deux) litres? .* remplir complètement (\S+) /);
    assert.ok(m, e);
    const V = m[1] === "un" ? 1 : 2, k = lettres(m[2]), cl = (100 * V) / k;
    assert.ok([20, 25, 40, 50].includes(cl) && ![3, 6].includes(k), e);
    return { juste: `${d(cl)} cL`, pieges: [`${d(cl / 100)} cL`, `${d(k / V)} cL`, `${d(k / V / 100)} L`] };
  },
  18(e) {
    const m = e.match(/douche représente en moyenne (\d+) L d’eau et un bain (\d+) L d’eau\..*à la fin d’une semaine/);
    assert.ok(m, e);
    const [D, B] = [n(m[1]), n(m[2])];
    assert.ok(D >= 40 && D <= 90 && B >= 150 && B <= 250 && D % 10 === 0 && B % 10 === 0, e);
    return { juste: `${grp((B - D) * 7)} L`, pieges: [`${grp(D + B)} L`, `${grp(B * 7)} L`, `${grp((D + B) * 7)} L`] };
  },
  19(e) {
    const m = e.match(/dure (\d+) minutes\. .* un quart d’heure\. Le reste du temps, à partir de (\d+) h (\d+),/);
    assert.ok(m, e);
    const D = n(m[1]), t = 60 * n(m[2]) + n(m[3]);
    assert.ok([50, 55, 60].includes(D), e);
    assert.equal(Math.floor((t + D - 15) / 60), n(m[2]), "la bonne réponse ne change pas d'heure");
    return { juste: heure(t + D - 15), pieges: [heure(t + 15), heure(t + 15 + D), heure(t + D)] };
  },
};

const ATTENDU4 = {
  1(e) {
    const m = e.match(/à (\d+) € le kilogramme\. Combien vais-je payer pour acheter (\d+) kg/);
    assert.ok(m, e);
    const [p, k] = [n(m[1]), n(m[2])];
    assert.ok(p >= 2 && p <= 6 && k >= 3 && k <= 8, e);
    return { juste: `${p * k} €`, pieges: [`${k} €`, `${p + k - 1} €`, `${p + k} €`] };
  },
  2(e, choix, g) {
    const P = n(e.match(/périmètre de ce terrain est de (\d+) m/)[1]);
    const cotes = textesFig(g.figure).map((t) => n(t.t.replace(" m", "")));
    assert.equal(cotes.length, 4);
    const [C, ...E] = cotes;
    assert.ok(E[0] === E[1] && E[1] === E[2] && C < E[0] && cotes.every((v) => v % 5 === 0), cotes.join());
    const somme = C + 3 * E[0];
    return { juste: `${P - somme} m`, pieges: [`${P} m`, `${somme} m`, `${E[0] - C} m`] };
  },
  3(e) {
    const m = e.match(/Sa vitesse est de (\d+) km\/h\. .* est (trois|quatre) fois plus rapide\. Le trajet (?:de |d’)\S+ dure (\d+) minutes/);
    assert.ok(m, e);
    const k = m[2] === "trois" ? 3 : 4, t = n(m[3]);
    assert.ok(t % k === 0 && t >= 12 && t <= 30 && t / k !== k, e);
    return { juste: `${t / k} min`, pieges: [`${t * k} min`, `${t + k} min`, `${k} min`] };
  },
  4(e) {
    const m = e.match(/achète (\d+) .+? et paie ([\d,]+) €, \S+ achète (\d+) .+? et paie ([\d,]+) €\. Combien paierait \S+ pour (\d+) /);
    assert.ok(m, e);
    const [k1, p1, k2, p2, k] = [n(m[1]), n(m[2]), n(m[3]), n(m[4]), n(m[5])], u = p1 / k1;
    assert.ok(Math.abs(p2 / k2 - u) < 1e-9 && k1 === k - 1 && k2 === k + 1 && k >= 5 && k <= 12 && Math.abs(u - 1) > 1e-9, e);
    return { juste: `${d2(u * k)} €`, pieges: [`${d2(p2 - 1)} €`, `${d2(p1 + 1)} €`, `${d2(u)} €`] };
  },
  5(e) {
    const m = e.match(/a acheté 10 .+? identiques pour (\d+) €\. Combien coutent 15 de ces/);
    assert.ok(m, e);
    const P = n(m[1]);
    assert.ok(P % 2 === 0 && P !== 10, e);
    return { juste: `${(P * 15) / 10} €`, pieges: [`${10 + P + 15} €`, "15 €", `${P + 5} €`] };
  },
  6(e) {
    const D = n(e.match(/(?:parcours|trajet) de (\d+) km/)[1]), q = /au tiers/.test(e) ? 3 : /au quart/.test(e) ? 4 : 0;
    assert.ok([60, 120, 180, 240].includes(D) && q, e);
    const autres = q === 3 ? [6, 5, 4] : [3, 5, 6];
    return { juste: `${D / q} km`, pieges: autres.map((x) => `${D / x} km`) };
  },
  7(e, choix, g) {
    // Les carreaux boisés comptés dans le dessin : 4 petits arbres par carreau (la légende en a un).
    const arbres = (g.figure.match(/stroke="#2f9e44" stroke-width="1\.2"/g) || []).length;
    const carreaux = arbres / 4 - 1;
    const cadre = g.figure.match(/<rect x="4" y="4" width="(\d+)" height="(\d+)" fill="none" stroke="#222"/);
    const R = (n(cadre[1]) / 30) * (n(cadre[2]) / 30);
    assert.match(g.figure, /<rect x="[\d.]+" y="[\d.]+" width="60" height="60" fill="#ececec"/, "légende de 2 × 2 carreaux");
    assert.match(g.figure, />1 km²</);
    assert.ok(carreaux % 4 === 0 && carreaux >= 24 && carreaux <= 44, `carreaux ${carreaux}`);
    return { juste: `${carreaux / 4} km²`, pieges: [`${carreaux} km²`, `${R} km²`, "4 km²"] };
  },
  8(e) {
    const liste = e.split("contient ")[1].split(". On prend")[0].split(/, | et /);
    assert.equal(liste.length, 4, e);
    const parts = liste.map((x) => { const m = x.match(/^(\d+) (?:\S+ )?((?:au|à la|à l’) ?.+)$/); assert.ok(m, x); return { k: n(m[1]), gout: m[2] }; });
    const T = parts.reduce((s, p) => s + p.k, 0), quart = parts.filter((p) => p.k * 4 === T), max = Math.max(...parts.map((p) => p.k));
    assert.equal(quart.length, 1, e);
    assert.equal(parts.filter((p) => p.k === max).length, 1, "un seul parfum le plus nombreux");
    assert.ok(T >= 12 && T <= 28 && /25 %/.test(e), e);
    return { juste: `${quart[0].gout}.`, pieges: parts.filter((p) => p !== quart[0]).map((p) => `${p.gout}.`) };
  },
  9(e) {
    const m = e.match(/marche (\d+) m pour faire le tour .* est de (\d+) m\./);
    assert.ok(m, e);
    const [P, L] = [n(m[1]), n(m[2])], l = P / 2 - L;
    assert.ok(P % 4 === 0 && P >= 60 && P <= 200 && L % 2 === 0 && l > 0 && l < L, e);
    return { juste: `${l} m`, pieges: [`${(P - L) / 2} m`, `${P / 4} m`, `${P - 2 * L} m`] };
  },
  10(e) {
    const [[, b], [, dd]] = [...e.matchAll(/1\/(\d+)/g)].map((m) => [1, n(m[1])]);
    assert.ok([[2, 4], [4, 8], [2, 8], [3, 9], [5, 10]].some(([x, y]) => x === b && y === dd), e);
    return { juste: `${dd / b + 1}/${dd}`, pieges: [`2/${b + dd}`, `2/${dd}`, `1/${b + dd}`] };
  },
  11(e) {
    const m = e.match(/^Avec (\d+) L (?:de lait|d’eau de mer) on obtient 1 kg de (\S+)\. Pour obtenir 100 g de \2,/);
    assert.ok(m, e);
    const X = n(m[1]);
    assert.ok([[20, "beurre"], [10, "fromage"], [30, "sel"]].some(([v, p]) => v === X && p === m[2]), e);
    return { juste: `${X / 10} L`, pieges: [`${grp(X * 100)} L`, `${X} cL`, `${X * 10} L`] };
  },
  12(e) {
    const m = e.match(/pendant (\d+) minutes et \S+ utilise (\d+) litres d’eau\. .* pendant (\d+) minutes\./);
    assert.ok(m, e);
    const [td, V, tb] = [n(m[1]), n(m[2]), n(m[3])], q = V / td;
    assert.ok(Number.isInteger(q) && q >= 8 && q <= 15 && td >= 5 && td <= 10 && tb - td >= 2 && tb - td <= 6, e);
    assert.ok(!e.includes(`${q} L`), "le débit n'est jamais écrit");
    return { juste: `${q * (tb - td)} L`, pieges: [`${V * 2} L`, `${q} L`, `${q * tb} L`] };
  },
  13(e, choix, g) {
    // Les lettres et la largeur de la bande, relues sur la figure : la lettre du haut est la grande longueur.
    const t = textesFig(g.figure), lettresFig = t.filter((x) => /italic/.test(x.att)), k = n(t.find((x) => !/italic/.test(x.att)).t);
    const B = lettresFig.reduce((a, x) => (x.y < a.y ? x : a)).t, A = lettresFig.find((x) => x.t !== B).t;
    assert.ok(k >= 2 && k <= 6 && lettresFig.filter((x) => x.t === A).length === 2, "deux fois la petite lettre");
    assert.ok([["a", "b"], ["x", "y"], ["m", "n"]].some(([p, q]) => p === A && q === B), `${A} ${B}`);
    return { juste: `${k}(${B} − ${A})`, pieges: [`${k}(${B} + ${A})`, `${k}${A}`, `${k}${B}`] };
  },
  14(e) {
    const m = e.match(/de (\d+) m²\. .* longueur (\d+) m\./);
    assert.ok(m, e);
    const [A, L] = [n(m[1]), n(m[2])], l = A / L;
    assert.ok(Number.isInteger(l) && l < L, e);
    return { juste: `${l} m`, pieges: [`${(2 * A) / L} m`, `${A + L} m`, `${A - L} m`] };
  },
  15(e) {
    const m = e.match(/nécessite (\d+) minutes\. On lui demande de réaliser (\d+) (\S+) en trois heures\./);
    assert.ok(m, e);
    const [dd, k, objets] = [n(m[1]), n(m[2]), m[3]], manque = dd * k - 180;
    assert.ok([13, 16, 17, 18].includes(dd) && manque >= 1 && manque <= 20, e);
    // Les trois pièges sont des phrases fausses : il fabrique en vrai floor(180 / d) objets.
    const vrai = Math.floor(180 / dd), haut = 3 * Math.ceil(60 / dd), bas = 3 * Math.floor(60 / dd);
    assert.ok(haut > vrai && bas < vrai && (dd * k) / 3 < 120, e);
    return {
      juste: `NON. Il lui manquera ${enLettres(manque)} minute${manque > 1 ? "s" : ""}.`,
      pieges: [`OUI. Il pourra fabriquer ${enLettres(haut)} ${objets}.`, `NON. Il pourra fabriquer seulement ${enLettres(bas)} ${objets}.`, "OUI. Il lui faudra moins de deux heures."],
    };
  },
  16(e) {
    const m = e.match(/livre de (\d+) pages\. Chaque jour \S+ en lit 10 %\. Combien lit-\S+ de pages en (\d+) jours/);
    assert.ok(m, e);
    const [P, j] = [n(m[1]), n(m[2])];
    assert.ok(P % 10 === 0 && P >= 110 && P <= 250 && j >= 3 && j <= 9, e);
    return { juste: `${(P / 10) * j} pages`, pieges: [`${10 * j} pages`, "10 pages", `${P / 10} pages`] };
  },
  17(e) {
    const m = e.match(/^Il faut (\d+) g de .+? pour obtenir 1 g de .+?\. .* avec 1 kg de/);
    assert.ok(m, e);
    const X = n(m[1]);
    assert.ok([80, 5, 4, 50].includes(X), e);
    return { juste: `${d(1000 / X)} g`, pieges: [`${X} g`, `${d(1000 / X)} kg`, `${X} kg`] };
  },
  18(e) {
    const m = e.match(/de (\d+) \S+, (un seul|\d+) /);
    assert.ok(m, e);
    const T = n(m[1]), k = m[2] === "un seul" ? 1 : n(m[2]), g = T - k, compare = (100 * k) / g;
    assert.ok(T >= 4 && T <= 20 && k < g && Number.isInteger((100 * g) / T), e);
    return { juste: `${(100 * g) / T} %`, pieges: [`${(100 * k) / T} %`, `${g} %`, Number.isInteger(compare) ? `${100 - compare} %` : `${100 - k} %`] };
  },
  19(e, choix, g) {
    const M = n(e.match(/pèse (\d+) g\./)[1]);
    const pc = textesFig(g.figure).filter((t) => / %$/.test(t.t)).map((t) => n(t.t.replace(" %", "")));
    assert.equal(pc.length, 2, "deux pourcentages écrits, le troisième à trouver");
    const [p1, p2] = pc, p3 = 100 - p1 - p2, masses = [p1, p2, p3].map((p) => (M * p) / 100);
    assert.ok(M !== 100 && masses.every(Number.isInteger), e);
    // L'étiquette de la petite part s'écrit dehors (reliée par un trait) quand la part fait moins de 15 %.
    assert.equal(/<path d="M[\d.]+ [\d.]+L[\d.]+ [\d.]+H/.test(g.figure), p1 < 15);
    const tete = texte(choix[0]).split("|Masse")[0];
    const tab = (m, p) => `${tete}|Masse (g)|${m.join("|")}|%|${p.join("|")}`;
    const P = [100, p1, p2, p3];
    return {
      juste: tab([M, ...masses], P),
      pieges: [tab([M, p1, p2, p3], [M, p1, p2, p3]), tab([M, p1, masses[1], masses[2]], P), tab([M, masses[0], p2, p3], P)],
    };
  },
};

function verifier(S, ATTENDU) {
  const vus = {};
  for (let graine = 2; graine < 2 + GRAINES; graine++) {
    for (const it of construire(S, hasard(graine), null, null)) {
      const num = it.q.num, e = texte(it.g.enonce + " " + (it.g.apres || "")), choix = it.choix.map((c) => c.html);
      const ici = `${S.id} q${num} graine ${graine}`;
      const textes = it.choix.map((c) => texte(c.html));
      assert.equal(new Set(textes).size, 4, `${ici} : quatre réponses différentes (${textes.join(" / ")})`);
      assert.equal(it.choix.filter((c) => c.juste).length, 1, `${ici} : une seule juste`);
      const att = ATTENDU[num](e, choix, it.g);
      assert.equal(texte(it.choix.find((c) => c.juste).html), att.juste, `${ici} : bonne réponse`);
      assert.deepEqual(it.choix.filter((c) => !c.juste).map((c) => texte(c.html)).sort(), att.pieges.slice().sort(), `${ici} : pièges`);
      for (const c of it.choix) {
        if (c.juste) continue;
        assert.ok(c.erreur && /^[A-ZÀÉ].*\.$/.test(c.erreur), `${ici} : piège sans explication complète`);
        assert.ok(!GENRE.test(c.erreur), `${ici} : mot genré dans « ${c.erreur} »`);
      }
      // « de » et « que » s'élident devant un prénom en voyelle (règle du site : d’Inès, qu’Emma ; de Hugo, de Yanis).
      for (const morceau of [e, ...it.choix.map((c) => c.erreur)]) assert.ok(!/\b(de|que) [AEIOUÀÂÉÈÊÎÏÔÙÛŒ]/.test(morceau), `${ici} : élision oubliée : ${morceau}`);
      for (const morceau of [it.g.enonce, it.g.apres || "", ...choix, ...it.choix.map((c) => c.erreur)]) {
        const t = typo(morceau).split(/<[^>]+>/).join("|");
        assert.ok(!RESTE.test(t), `${ici} : unité séparée de son nombre : ${t.match(RESTE)}`);
      }
      // Le bilan reprend le vrai coefficient du jumeau (« quatre fois moins », « quatre fois plus rapide »).
      if (it.g.competence) assert.ok(e.includes(it.g.competence.match(/« (\S+) fois/)[1] + " fois"), `${ici} : intitulé du bilan`);
      (vus[num] = vus[num] || new Set()).add(e + (it.g.figure || ""));
    }
  }
  // Un jumeau change vraiment : beaucoup d'énoncés différents par question.
  for (const [num, l] of Object.entries(vus)) assert.ok(l.size >= 3, `${S.id} q${num} : ${l.size} énoncés différents seulement`);
}

test("6e : 19 jumeaux stricts sur 2 000 graines (réponses recalculées, pièges de la DEPP, limites des décisions)", () => verifier(S6, ATTENDU6));
test("4e : 19 jumeaux stricts sur 2 000 graines (réponses recalculées, pièges de la DEPP, limites des décisions)", () => verifier(S4, ATTENDU4));

test("les recalculs reconnaissent le sujet officiel (le test ne valide pas n'importe quoi)", () => {
  for (const [S, ATTENDU] of [[S6, ATTENDU6], [S4, ATTENDU4]]) {
    for (const it of construire(S, hasard(1), S.officiels[0], null)) {
      const e = texte(it.g.enonce + " " + (it.g.apres || ""));
      let att;
      try { att = ATTENDU[it.q.num](e, it.choix.map((c) => c.html), it.g); } catch (err) { continue; } // limites propres aux jumeaux
      assert.equal(texte(it.choix.find((c) => c.juste).html), att.juste, `${S.id} q${it.q.num}`);
    }
  }
});

test("banques des figures : 8 paires d'aires (4 « A plus petite », 4 « A plus grande ») et 6 zones boisées d'un seul tenant", () => {
  const { FORMES_AIRES, PAIRES_AIRES } = S6.donnees;
  assert.equal(PAIRES_AIRES.length, 8);
  const sens = PAIRES_AIRES.map(([a, b]) => Math.sign(aire(FORMES_AIRES[a]) - aire(FORMES_AIRES[b])));
  assert.equal(sens.filter((s) => s < 0).length, 4);
  assert.equal(sens.filter((s) => s > 0).length, 4);
  const { ZONES_BOIS } = S4.donnees;
  assert.equal(Object.keys(ZONES_BOIS).length, 6);
  const comptes = new Set();
  for (const [nom, z] of Object.entries(ZONES_BOIS)) {
    const cases = [];
    z.forEach((l, y) => [...l].forEach((ch, x) => ch === "X" && cases.push(`${x},${y}`)));
    comptes.add(cases.length);
    assert.ok(cases.length % 4 === 0 && cases.length >= 24 && cases.length <= 44, nom);
    assert.ok(z.length >= 5 && z.every((l) => l.length === z[0].length), `${nom} : rectangle d'au moins 5 lignes (place de la légende)`);
    const vu = new Set([cases[0]]), pile = [cases[0]];
    while (pile.length) {
      const [x, y] = pile.pop().split(",").map(Number);
      for (const v of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) if (cases.includes(v) && !vu.has(v)) { vu.add(v); pile.push(v); }
    }
    assert.equal(vu.size, cases.length, `${nom} : zone d'un seul tenant`);
  }
  assert.equal(comptes.size, 6, "six superficies différentes");
});

test("chaque question tire bien ses contextes et ses formes (pas une seule version)", () => {
  // 6e Q16 : dessin parfois retourné ; 6e Q15 : les 8 paires sortent ; 4e Q7 : les 6 zones sortent ; 4e Q19 : les 4 objets.
  const paires = new Set(), retourne = new Set(), zones = new Set(), objets = new Set();
  for (let graine = 2; graine < 400; graine++) {
    const q6 = Object.fromEntries(construire(S6, hasard(graine), null, null).map((it) => [it.q.num, it.g]));
    paires.add(q6[15].paire.join("/"));
    retourne.add(q6[16].chemins.retourne);
    const q4 = Object.fromEntries(construire(S4, hasard(graine), null, null).map((it) => [it.q.num, it.g]));
    zones.add(q4[7].plan.colonnes + "x" + q4[7].plan.lignes);
    objets.add(q4[19].composition.noms[0]);
  }
  assert.equal(paires.size, 8);
  assert.equal(retourne.size, 2);
  assert.equal(zones.size, 6);
  assert.equal(objets.size, 4);
});
