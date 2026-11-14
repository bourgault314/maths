// Contrôle du lot EN10 « jumeaux stricts » (décidé avec Gwenaël le 14/11/2026) : un sujet jumeau ne change que les nombres
// et la présentation, avec les mêmes pièges que le sujet officiel. Les formes qui changent le cas, le sens, l'écriture, la
// difficulté ou la nature de la bonne réponse restent dans le code (la future banque) : la table HORS_STRICT de chaque test
// Automatismes les nomme et le jumeau les écarte. Aussi : le jumeau d'un sujet officiel ne tire que les tâches de ce
// sujet (4e 2026 / 2024-2025), 5e Q6 (une seule part coloriée), 4e Problèmes Q18 (le piège de la DEPP tombe juste) et
// l'élision (« d’oranges », « d’élèves », « d’Inès », « d’huile ») dans tous les sujets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Tous les sujets que charge vraiment la page, dans son ordre.
for (const m of readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8").matchAll(/<script src="\.\/((?:sujets\/)?[\w]+\.js)\?v=[^"]+"><\/script>/g))
  if (m[1] !== "evaluation.js") require(`../outils/evaluations_nationales/${m[1]}`);
const EN = globalThis.EN, S = globalThis.EN_SUJETS;
const { hasard, construire, taches, tacheOfficielle, horsStrict } = EN;

const texte = (h) => String(h ?? "")
  .replace(/<svg[\s\S]*?aria-label="([^"]*)"[\s\S]*?<\/svg>/g, "[$1]")
  .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, "$1/$2")
  .replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const AUTOMATISMES = ["6e-automatismes", "5e-automatismes", "4e-automatismes", "3e-automatismes"];
const JUMEAUX = [...AUTOMATISMES, "6e-problemes", "4e-problemes"];
const N = 500;
// Le modèle d'un jumeau : 4e, un sur deux est le jumeau du sujet 2024-2025.
const modeleDe = (s, graine) => (s.officiels && s.officiels.length > 1 && graine % 2 ? s.officiels[1] : undefined);
const officielDe = (s, modele) => modele || s.officiels[0];
// Le premier mot de l'explication d'un piège (« Confond », « Prend », « Additionne »…) : la famille du piège, sans ses nombres.
const famille = (x) => texte(x.erreur).split(" ")[0];
// Familles qui s'adaptent à la forme et restent le même piège (décidé à l'audit du 14/11) : 5e Q23, « additionne tous les
// nombres » devient « soustrait tous les nombres » quand le calcul est une soustraction. 3e (positionnement, pièges écrits
// par nous, pas d'analyse DEPP) : Q4 et Q18 ont des pièges qui suivent les nombres, gardés tels quels par l'audit.
const MEME_PIEGE = { "5e-automatismes": { 23: { Additionne: ["Soustrait"] } } };
const PIEGES_LIBRES = { "3e-automatismes": [4, 18] };

test("HORS_STRICT : chaque forme citée existe dans la banque, aucune n'est celle du sujet officiel, il reste une forme stricte", () => {
  for (const id of AUTOMATISMES) {
    const s = S[id];
    assert.ok(s.horsStrict && Object.keys(s.horsStrict).length > 0, `${id} : table HORS_STRICT`);
    for (const [num, h] of Object.entries(s.horsStrict)) {
      const q = s.questions.find((x) => x.num === Number(num));
      assert.ok(q, `${id} Q${num} existe`);
      assert.ok(h.formes.length && h.pourquoi, `${id} Q${num} : formes et raison`);
      const vues = new Set();
      for (let g = 1; g <= 3000; g++) { const r = hasard(g * 7919 + 3); for (const t of taches(q)) vues.add(t.generer(r, false).forme); }
      for (const f of h.formes) assert.ok(vues.has(f), `${id} Q${num} : la forme « ${f} » n'existe pas (faute de frappe ?)`);
      for (const o of s.officiels) {
        const off = tacheOfficielle(q, o.annee).generer(hasard(1), true).forme;
        assert.ok(!h.formes.includes(off), `${id} Q${num} : la forme du sujet officiel ${o.cle} est écartée`);
      }
      assert.ok([...vues].some((f) => !h.formes.includes(f)), `${id} Q${num} : plus aucune forme stricte`);
    }
  }
});

test(`${N} jumeaux par test : aucune forme hors strict ; 4 réponses différentes, une seule juste ; les pièges du sujet officiel toujours là`, () => {
  for (const id of JUMEAUX) {
    const s = S[id];
    const officiels = Object.fromEntries(s.officiels.map((o) => [o.cle, construire(s, hasard(1), o, null)]));
    for (let graine = 2; graine <= N + 1; graine++) {
      const modele = modeleDe(s, graine), off = officiels[officielDe(s, modele).cle];
      construire(s, hasard(graine), null, null, modele).forEach((it, i) => {
        const g = it.g, ou = `${id} Q${it.q.num} graine ${graine} (${g.forme || "—"})`;
        assert.ok(!horsStrict(s, it.q).includes(g.forme), `${ou} : forme hors du jumeau strict`);
        const textes = it.choix.map((x) => texte(x.html));
        assert.equal(it.choix.length, 4, ou);
        assert.equal(new Set(textes).size, 4, `${ou} : ${textes.join(" | ")}`);
        assert.equal(it.choix.filter((x) => x.juste).length, 1, `${ou} : une seule juste`);
        for (const x of it.choix) if (!x.juste) assert.ok(texte(x.erreur) && !/undefined|NaN/.test(x.erreur), `${ou} : piège sans explication`);
        if ((PIEGES_LIBRES[id] || []).includes(it.q.num)) return;
        const familles = new Set(it.choix.filter((x) => !x.juste).map(famille));
        const adapte = (MEME_PIEGE[id] || {})[it.q.num] || {};
        for (const f of new Set(off[i].choix.filter((x) => !x.juste).map(famille)))
          assert.ok(familles.has(f) || (adapte[f] || []).some((a) => familles.has(a)), `${ou} : le piège « ${f} … » du sujet officiel manque — ${it.choix.filter((x) => !x.juste).map((x) => texte(x.erreur)).join(" / ")}`);
      });
    }
  }
});

test("4e Automatismes : le jumeau du sujet 2026 ne tire que les tâches de 2026, celui du sujet 2024-2025 que les siennes", () => {
  const s = S["4e-automatismes"], [o2026, o2024] = s.officiels;
  const vus = { 2026: new Map(), "2024-2025": new Map() };
  for (let graine = 2; graine <= 2001; graine++)
    for (const modele of [undefined, o2026, o2024]) {
      const cle = (modele || o2026).cle;
      for (const it of construire(s, hasard(graine), null, [1, 6], modele)) {
        const k = `Q${it.q.num} ${it.t.id || "2026"} ${it.g.forme.replace(/-\d$/, "")}`;
        vus[cle].set(k, (vus[cle].get(k) || 0) + 1);
        const e = texte(it.g.enonce);
        if (cle === "2026") assert.ok(!/^\d+ − \d = …$|^\d \+ … = \d+$|l’expression \d\w [+−] \d\w alors/.test(e), `2026 graine ${graine} : ${e}`);
      }
    }
  // 2026 : « Lorsqu'on multiplie un nombre par 0,1… » (effet) et x × x + 3 × x + 7 dans tous les ordres.
  assert.deepEqual([...vus[2026].keys()].filter((k) => k.startsWith("Q1")).sort(), ["Q1 2026 effet"]);
  assert.ok([...vus[2026].keys()].every((k) => !k.includes("4e-")), [...vus[2026].keys()].join(", "));
  // 2024-2025 : « 14 − 6 » en différence seulement, « 2n + 3n » en somme seulement.
  assert.deepEqual([...vus["2024-2025"].keys()].sort(), ["Q1 4e-soustraire difference", "Q6 4e-reduire-somme somme"]);
});

test("5e Q6 : une seule part coloriée sur n parts égales (comme 1/4), mêmes pièges, quatre figures, jamais le sujet officiel", () => {
  const s = S["5e-automatismes"], figures = new Map();
  for (let graine = 2; graine <= 2001; graine++) {
    const it = construire(s, hasard(graine), null, [6])[0], g = it.g;
    const n = Number(texte(g.figure).match(/en (\d+) parts égales, 1 coloriée\]/)?.[1]);
    assert.ok([4, 6, 8].includes(n), `graine ${graine} : ${texte(g.figure)}`);
    assert.match(g.forme, /^une-part-(triangle|carre|hexagone|disque)$/);
    figures.set(g.forme, (figures.get(g.forme) || 0) + 1);
    const juste = texte(g.choix.find((x) => x.juste).html), faux = g.choix.filter((x) => !x.juste).map((x) => texte(x.html)).sort();
    assert.equal(juste, `1/${n}`);
    assert.deepEqual(faux, [`1/${n - 1}`, "1/2", `${n - 1}/${n}`].sort(), `graine ${graine}`);
    assert.notEqual(g.figure, construire(s, hasard(1), s.officiels[0], [6])[0].g.figure, `graine ${graine} : copie du sujet officiel`);
  }
  assert.equal(figures.size, 4, JSON.stringify(Object.fromEntries(figures)));
});

test("6e Q14 : le jumeau strict multiplie par 10 (× 100 et × 1 000 restent pour la banque)", () => {
  const s = S["6e-automatismes"], formes = new Set();
  for (let graine = 2; graine <= 1001; graine++) {
    const g = construire(s, hasard(graine), null, [14])[0].g;
    formes.add(g.forme);
    assert.match(texte(g.enonce), /× 10 =|: 10 × \d/, texte(g.enonce));
    assert.doesNotMatch(texte(g.enonce), /× 1 ?000\b|\b1 ?000 ×|× 100\b|\b100 ×/, texte(g.enonce));
  }
  assert.deepEqual([...formes].sort(), ["fois-10", "fois-10-devant"]);
});

test("4e Problèmes Q18 : le piège de la DEPP (comparer le petit groupe au grand, puis compléter à 100 %) tombe toujours juste", () => {
  const s = S["4e-problemes"], contextes = new Set();
  for (let graine = 2; graine <= 2001; graine++) {
    const g = construire(s, hasard(graine), null, [18])[0].g, e = texte(g.enonce);
    const m = e.match(/de (\d+) \S+, (un seul|\d+) /);
    const T = Number(m[1]), k = m[2] === "un seul" ? 1 : Number(m[2]);
    assert.equal(5 * k, T, `le petit groupe est le cinquième du total (1 sur 4 comparé au grand) : ${e}`);
    const piege = g.choix.find((x) => /^Compare les /.test(texte(x.erreur)));
    assert.ok(piege, `piège DEPP absent : ${e}`);
    assert.equal(texte(piege.html), "75 %");
    assert.ok(!/fratrie de 5 enfants, un seul est gaucher/.test(e), "jamais le sujet officiel");
    assert.doesNotMatch(g.choix.map((x) => x.erreur).join(" "), /\bde [éeaiou]/, e);
    contextes.add(e.split(",")[0].replace(/\d+/, "#"));
  }
  assert.ok(contextes.size >= 3, [...contextes].join(" / "));
});

test("élision : de, que, le, la jamais devant une voyelle ou un h muet, dans tous les sujets (officiels, jumeaux et banque)", () => {
  // Pas d'élision devant un prénom en H ou en Y suivi d'une voyelle (de Hugo, de Yanis), ni devant un h aspiré (de huit,
  // la hauteur, de hm) : la règle du site ; ni devant une lettre de calcul ou un nom de figure (la valeur de A, de EFCD).
  const RE = /(?<![\p{L}’'])(de|que|le|la|ce|ne|je|me|se|lorsque|puisque|jusque) (?=([aeiouyàâéèêëîïôöùûüœæh][\p{L}’']*))/giu;
  const permis = (mot) => /^(\p{L}|[A-Z]{2,5}|H\p{L}*|Y[aeiouyàâéèêëîïôöùûü]\p{L}*|y[aeiou]\p{L}*|h(?!uile|eure|abit|erbe|istoire|iver|ôpita|ôte|omme|onneur|orloge|uître|ectare)\p{L}*)$/u.test(mot);
  const fautes = new Map();
  for (const [id, s] of Object.entries(S))
    for (const q of s.questions)
      for (const t of taches(q))
        for (let g = 0; g < 300; g++) {
          let G;
          try { G = t.generer(hasard(77 + g * 31337), g === 0); } catch (e) { continue; }
          const tout = [G.enonce, G.figure, ...(G.choix || []).flatMap((c) => [c.html, c.erreur]), JSON.stringify(G.grille || "")].map(texte).join(" | ");
          for (const m of tout.matchAll(RE)) if (!permis(m[2])) fautes.set(`${id} Q${q.num} : « ${m[1]} ${m[2]} »`, tout.slice(Math.max(0, m.index - 30), m.index + 40));
        }
  assert.deepEqual([...fautes.keys()], [], [...fautes.values()].join("\n"));
});

test("la fonction d'élision commune", () => {
  assert.equal(EN.de("oranges"), "d’oranges");
  assert.equal(EN.de("élèves gauchers"), "d’élèves gauchers");
  assert.equal(EN.de("huile essentielle de lavande"), "d’huile essentielle de lavande");
  assert.equal(EN.de("Inès"), "d’Inès");
  assert.equal(EN.que("Emma"), "qu’Emma");
  assert.equal(EN.elider("le", "élève"), "l’élève");
  assert.equal(EN.elider("la", "heure"), "l’heure");
  for (const mot of ["Hugo", "Yanis", "yaourt", "huit jours", "hauteur", "fraises", "Sarah"]) assert.equal(EN.de(mot), `de ${mot}`);
  assert.equal(EN.de("Yves"), "d’Yves");
});

test("la page : un jumeau est le jumeau d'un sujet officiel (le plus récent, ou celui du passage pour refaire ses questions ratées)", () => {
  const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
  assert.match(js, /const modele = officiel \|\| \(numeros && passation && passation\.modele\) \|\| officiels\[0\];/);
  assert.match(js, /construire\(sujet, hasard\(graine\), officiel, numeros, modele\)/);
  assert.match(js, /passation = \{ type, officiel, modele,/);
});
