import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Relecture du monde 1 (26/09/2026, idée de Gwenaël) — en vue professeur, chaque carte
   de la liste 📋 des mondes 1 (Petit SPLAT!) et 2 (SPLAT! Classique) ouvre CETTE carte
   seule dans ÉquaBarre, comme les équations des mondes 5 et 6 dans ÉquaSplat. Choix de
   Gwenaël : « ? » dans les cases au monde 1 (comme sur les livrets), la lettre au monde 2
   (comme son bouton « Résoudre »). On EXÉCUTE les données de outils/splat_univers.html,
   comme tests/splat-equations-monde5-progression.test.mjs. */

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
const equabarre = lire("outils/equabarre.html");

function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent, decodeURIComponent, escape, unescape, atob, btoa });
vm.runInContext(
  bloc("const PS=", "const PROF =") +
  bloc("const NOTES_MONDE", "const main=document") +
  ";globalThis.MONDES=MONDES;globalThis.eqBarreLiens=eqBarreLiens;globalThis.eqListeHtml=eqListeHtml;",
  ctx, { filename: "splat_univers.html" }
);
const MONDES = ctx.MONDES;
const decode = (url) => {
  assert.ok(url.startsWith("/outils/equabarre.html#data="), url);
  const b64 = url.slice(url.indexOf("#data=") + 6);
  return JSON.parse(Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
};
/* « 3𝑥 + 10 = 16 » (et « ✏️ » pour une carte à dessiner) → n, a, b */
function lireCarte(q) {
  const r = /^(\d*)𝑥(?: \+ (\d+))? = (\d+)(?: ✏️)?$/u.exec(q);
  assert.ok(r, `carte illisible : ${q}`);
  return { n: Number(r[1] || 1), a: Number(r[2] || 0), b: Number(r[3]) };
}

test("mondes 1 et 2 : chaque carte de la liste 📋 ouvre CETTE carte seule dans ÉquaBarre", () => {
  let vues = 0;
  [[0, "question", "carte"], [1, "letter", "équation"]].forEach(([mi, affichage, nom]) => {
    const m = MONDES[mi];
    m.etapes.forEach((e) => {
      assert.ok(Array.isArray(e.eqs) && e.eqs.length, `${m.nom}, ${e.t} : pas de liste`);
      const liens = ctx.eqBarreLiens(m, e);
      assert.ok(Array.isArray(liens), `${m.nom}, ${e.t} : pas de liens`);
      assert.equal(liens.length, e.eqs.length);
      liens.forEach((l, i) => {
        const { n, a, b } = lireCarte(e.eqs[i]);
        const d = decode(l);
        assert.equal(d.source, "splat");
        assert.equal(d.unknownDisplay, affichage, `${m.nom} : affichage de l'inconnue`);
        assert.equal(d.variable, "𝑥");
        assert.equal(d.lhsSide, "bottom", "convention d'ÉquaBarre : bas = haut");
        assert.deepEqual(d.top, [{ type: "number", value: b }], "le total en haut");
        /* les jetons visibles regroupés d'abord, puis une case par tache, comme l'outil */
        const attendu = (a ? [{ type: "number", value: a }] : []).concat(Array.from({ length: n }, () => ({ type: "x" })));
        assert.deepEqual(d.bottom, attendu, `${e.t}, carte ${i + 1} (${e.eqs[i]})`);
        assert.equal(d.x, (b - a) / n);
        assert.ok(Number.isInteger(d.x) && d.x > 0, `${e.eqs[i]} : une tache cache un nombre entier de jetons`);
        assert.ok(!l.includes("parcours") && !l.includes("eleve"), "ni parcours ni mode élève");
        vues++;
      });
      const html = ctx.eqListeHtml(e, m);
      assert.equal((html.match(/<a class="eqSeule" href="\/outils\/equabarre\.html#data=/g) || []).length, e.eqs.length);
      assert.ok(!html.includes("equasplat"));
      assert.ok(html.includes("Clique sur une " + (nom === "carte" ? "carte" : "\\u00e9quation") + " pour l\\u2019ouvrir seule dans \\u00c9quaBarre.") ||
                html.includes("Clique sur une " + nom + " pour l’ouvrir seule dans ÉquaBarre."), `${e.t} : la phrase d'aide`);
      /* la légende des cartes à dessiner reste là */
      if (e.eqs.some((q) => q.includes("✏"))) assert.ok(html.includes("carte \\u00e0 dessiner") || html.includes("carte à dessiner"));
    });
  });
  assert.equal(vues, 12 * 9, "6 fiches du monde 1 et 3 étapes du monde 2, 12 cartes chacune");
});

test("ÉquaBarre : les autres mondes n'y renvoient pas, et une liste illisible ne donne AUCUN lien", () => {
  MONDES.slice(2).forEach((m) => m.etapes.forEach((e) => {
    assert.equal(ctx.eqBarreLiens(m, e), null, m.nom);
    if (e.eqs) assert.ok(!ctx.eqListeHtml(e, m).includes("equabarre"), `${m.nom}, ${e.t}`);
  }));
  const m1 = MONDES[0], e = m1.etapes[4];
  /* une seule carte illisible (deux inconnues, reste qui ne se partage pas) : plutôt aucun lien que des liens décalés */
  assert.equal(ctx.eqBarreLiens(m1, { ...e, eqs: [...e.eqs.slice(1), "2𝑥 + 1 = 3𝑥"] }), null);
  assert.equal(ctx.eqBarreLiens(m1, { ...e, eqs: ["2𝑥 + 1 = 4"] }), null);
  assert.equal(ctx.eqBarreLiens(m1, { ...e, eqs: ["𝑥 + 5 = 5"] }), null, "une tache ne cache jamais 0");
  /* sans le monde (ancien appel), la liste reste du texte */
  assert.ok(!ctx.eqListeHtml(e).includes("<a "));
});

test("la carte des mondes passe bien le monde à la liste, en vue prof seulement", () => {
  assert.match(univers, /\(PROF&&e\.eqs\?'<p class="eqListeProf">[^\n]*' : '\+eqListeHtml\(e,m\)\+'<\/p>':''\)/);
});

test("ÉquaBarre lit toujours ce format (?data= / #data=, top / bottom, « question »)", () => {
  assert.match(equabarre, /function readImportRawPayload\(\)/);
  assert.match(equabarre, /hashParams\.has\("data"\)/);
  assert.match(equabarre, /payload\.top \|\| payload\.haut/);
  assert.match(equabarre, /payload\.bottom \|\| payload\.bas/);
  assert.match(equabarre, /rawDisplay === "question"/);
});
