/* SPLAT! Enquête — lot 1 « le schéma vide sous la carte 1 » (30/09/2026) : contrôle au
   NAVIGATEUR, hors CI (il lui faut playwright ; « npm run verifier » ne le lance pas).
     node scripts/serve-static.mjs &            (ou tout serveur du dépôt)
     MATHSGO_URL=http://127.0.0.1:4173 node tests/splat-enquete-schema-vide-regression.cjs
   Pour les 30 adresses de la progression en six livrets (graines d'essai du 30/09) :
   1. « modele=1 » ne change aucune carte (mêmes valeurs, indices, jetons, couleurs, positions) ;
   2. l'énoncé imprimé (4 par page) porte le schéma vide sur la carte 1, et nulle part ailleurs ;
      sans « modele=1 », ni sur la correction, ni en 6 par page, ni à l'écran : rien ;
   3. le schéma vide est le ① du corrigé de la même carte : mêmes cases (x, largeur, hauteur,
      couleurs), aucun chiffre écrit ;
   4. il tient dans la carte : sous le plateau, au-dessus du bas de la carte (2 160) ; sur les six
      fiches qui le reçoivent (13, 18, 22, 11d, 17d, 18d), il laisse au moins la moitié de la
      hauteur sous le plateau pour chercher. */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE = (process.env.MATHSGO_URL ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const ADRESSES = {
  "10-de-plus-que": "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=3010&cards=4&unknown=question",
  "11-de-moins-que": "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=0&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=3011&cards=4&unknown=question",
  "12-plus-ou-moins": "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=3012&cards=4&unknown=question",
  "13-trois-taches-une-reference": "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=2013&cards=4&unknown=question",
  "14-le-defi-une-reference-jetons-visibles": "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=30&totalMax=60&seed=2014&cards=4&unknown=question",
  "10d-trois-taches-en-chaine": "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=2110&cards=4&unknown=question",
  "11d-je-complete": "mode=C&clues=SENTENCE&splats=3&structure=COMPLETE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=2111&cards=4&unknown=question",
  "12d-reference-chaine-ou-je-complete": "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2112&cards=4&unknown=question",
  "13d-tout-dans-le-desordre": "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESORDRE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2113&cards=4&unknown=question",
  "14d-le-grand-defi-additif": "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESORDRE&mul=0&div=0&add=1&sub=1&deltaMax=25&visibleMin=1&visibleMax=3&totalMin=60&totalMax=120&seed=2114&cards=4&unknown=question",
  "15-fois-plus": "mode=C&clues=SENTENCE&splats=2&mul=1&div=0&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=3015&cards=4&unknown=question",
  "16-fois-moins": "mode=C&clues=SENTENCE&splats=2&mul=0&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=3016&cards=4&unknown=question",
  "17-fois-plus-ou-fois-moins-le-double-la-moitie": "mode=C&clues=SENTENCE&splats=2&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&vocab=1&seed=2017&cards=4&unknown=question",
  "18-trois-taches-deux-rapports-puis-ecart-et-rapport": "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2018&cards=4&unknown=question",
  "19-le-defi-toutes-operations-jetons-visibles": "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=30&totalMax=70&seed=2019&cards=4&unknown=question",
  "15d-chaine-deux-rapports": "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2115&cards=4&unknown=question",
  "16d-chaine-un-ecart-et-un-rapport": "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2116&cards=4&unknown=question",
  "17d-je-complete-avec-un-rapport": "mode=C&clues=SENTENCE&splats=3&structure=COMPLETE&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2117&cards=4&unknown=question",
  "18d-indices-composes": "mode=C&clues=SENTENCE&splats=2&compose=1&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2118&cards=4&unknown=question",
  "19d-le-grand-defi": "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESORDRE&mul=1&div=1&add=1&sub=1&deltaMax=25&visibleMin=1&visibleMax=3&totalMin=60&totalMax=120&seed=2119&cards=4&unknown=question",
  "20-des-taches-repetees": "mode=C&clues=SENTENCE&splats=2&repeat=3&mul=0&div=0&add=1&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=172&cards=4&unknown=question",
  "21-repetees-fois-plus-ou-moins": "mode=C&clues=SENTENCE&splats=2&repeat=3&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=34&cards=4&unknown=question",
  "22-sans-total": "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=3&cards=4&unknown=question",
  "23-sans-total-a-retourner": "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=0&div=1&add=0&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=9&cards=4&unknown=question",
  "24-le-defi-qui-rebondit": "mode=C&clues=SENTENCE&splats=2&repeat=3&noTotal=1&mul=1&div=1&add=1&sub=1&deltaMax=20&visibleMin=1&visibleMax=3&totalMin=30&totalMax=70&seed=2024&cards=4&unknown=question",
  "20d-deux-taches-reunies": "mode=C&clues=SENTENCE&splats=3&structure=HASARD&reunies=1&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=80&seed=2120&cards=4&unknown=question",
  "21d-repetees-a-trois-couleurs": "mode=C&clues=SENTENCE&splats=3&structure=HASARD&repeat=3&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=80&seed=2121&cards=4&unknown=question",
  "22d-les-indices-en-symboles": "mode=C&clues=SYMBOL&splats=3&structure=HASARD&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2122&cards=4&unknown=question",
  "23d-tres-grands-nombres": "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESORDRE&mul=1&div=1&add=1&sub=1&deltaMax=40&visibleMin=0&visibleMax=0&totalMin=100&totalMax=200&seed=2123&cards=4&unknown=question",
  "24d-unite-commune": "mode=C&clues=SENTENCE&splats=3&structure=UNITE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=90&seed=2124&cards=4&unknown=question"
};

/* les fiches qui apportent un nouveau dessin : elles reçoivent « modele=1 » au lot 2 (décidé le 30/09) */
const SCHEMA_VIDE = new Set(["13", "18", "22", "11d", "17d", "18d"]);

async function ouvrir(nav, query){
  const pg = await nav.newPage({ viewport: { width: 1400, height: 900 } });
  await pg.emulateMedia({ media: "print" }); // la feuille imprimée n'a de taille qu'en « print » (getBBox)
  await pg.goto(`${BASE}/outils/splat.html?${query}`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(300);
  return pg;
}
const CARTES = () => cards.map((c) => JSON.stringify([c.total, c.hidden, c.visible, c._rel && c._rel.hiddenValues,
  c._inv && c._inv.indices, c._rel && c._rel.colorMap, c._posH, c._posV, c._splats]));
/* imprime sans ouvrir la boîte d'impression ; renvoie, pour chaque carte de la feuille, ce qu'il y a */
const IMPRIMER = () => {
  const w = window.print; window.print = () => {}; printSheet(); window.print = w;
  return [...document.querySelectorAll("#printArea .pCard svg")].map((sv) => {
    const g = sv.querySelector("#enqueteSchemaVide");
    if(!g) return null;
    const ty = Number((g.getAttribute("transform").match(/translate\(0 (-?[\d.]+)\)/) || [])[1]);
    /* la boîte des dessins (sans le <defs> des hachures, qui compte pour 0,0) */
    const bs = [...g.children].filter((c) => c.tagName !== "defs").map((c) => c.getBBox());
    const b = { y: Math.min(...bs.map((x) => x.y)), height: Math.max(...bs.map((x) => x.y + x.height)) - Math.min(...bs.map((x) => x.y)) };
    const plateau = [...sv.querySelectorAll("rect")].find((r) => r.getAttribute("stroke") === "#334155" && r.getAttribute("rx") === "30");
    return { haut: ty + b.y, bas: ty + b.y + b.height, basPlateau: plateau ? Number(plateau.getAttribute("y")) + Number(plateau.getAttribute("height")) : null,
      /* les textes, sans le « 1 » du titre « ① Les barres » (dans son cercle) */
      texte: [...g.querySelectorAll("text")].filter((t) => !(t.previousElementSibling && t.previousElementSibling.tagName === "circle")).map((t) => t.textContent).join(" "),
      cases: [...g.querySelectorAll("rect")].filter((r) => r.getAttribute("stroke-width") === "3.5" && !r.closest("pattern"))
        .map((r) => ["x", "y", "width", "height", "fill", "stroke"].map((a) => r.getAttribute(a)).join(" ")) };
  });
};
/* le ① du corrigé de la carte 1, dessiné comme la correction imprimée le dessine */
const CORRIGE = () => {
  const NS = "http://www.w3.org/2000/svg", sv = document.createElementNS(NS, "svg");
  sv.setAttribute("viewBox", "0 0 1600 2200"); document.body.appendChild(sv);
  const g = document.createElementNS(NS, "g"); sv.appendChild(g);
  /* l'unité commune (lot « petite part », 01/10/2026) : le ① du corrigé est coupé en petites
     parts ; le schéma vide, lui, est la situation (comme le premier dessin du pas à pas) */
  drawEnqueteBarres(g, cards[0], { isPrint:true, situation:true });
  const cases = [...g.querySelectorAll("rect")].filter((r) => r.getAttribute("stroke-width") === "3.5" && !r.closest("pattern"))
    .map((r) => ["x", "y", "width", "height", "fill", "stroke"].map((a) => r.getAttribute(a)).join(" "));
  sv.remove();
  return cases;
};

(async () => {
  const nav = await chromium.launch();
  let n = 0;
  try{
    for(const [nom, q] of Object.entries(ADRESSES)){
      const sans = await ouvrir(nav, q + "&layout=4&print=statement");
      const avec = await ouvrir(nav, q + "&layout=4&print=statement&modele=1");
      assert.deepEqual(await avec.evaluate(CARTES), await sans.evaluate(CARTES), `${nom} : modele=1 a changé les cartes`);
      assert.ok((await sans.evaluate(IMPRIMER)).every((x) => x === null), `${nom} : schéma vide sans modele=1`);
      const feuille = await avec.evaluate(IMPRIMER);
      assert.ok(feuille[0], `${nom} : pas de schéma vide sur la carte 1`);
      assert.ok(feuille.slice(1).every((x) => x === null), `${nom} : schéma vide ailleurs que sur la carte 1`);
      const s = feuille[0];
      assert.doesNotMatch(s.texte, /\d/, `${nom} : un chiffre dans le schéma vide (« ${s.texte} »)`);
      /* 3. le même dessin que le ① du corrigé : les cases seules (le corrigé a en plus « Je retourne » et
         ses lignes à part au-dessus : on compare les cases à partir de la première) */
      const corr = await avec.evaluate(CORRIGE);
      /* repère : le coin de la première case (quand on complète, « noire + [ ] » élargit la colonne
         des noms : les barres se décalent d'un bloc vers la droite, leurs longueurs ne changent pas) */
      const decale = (liste) => { const [x0, y0] = liste[0].split(" ").map(Number); return liste.map((c) => { const p = c.split(" ");
        p[0] = String(Math.round((Number(p[0]) - x0) * 100) / 100); p[1] = String(Math.round((Number(p[1]) - y0) * 100) / 100); return p.join(" "); }); };
      assert.deepEqual(decale(s.cases), decale(corr), `${nom} : le schéma vide n'est pas le ① du corrigé`);
      /* 4. la place */
      assert.ok(s.basPlateau != null && s.haut >= s.basPlateau + 20, `${nom} : le schéma touche le plateau (${s.haut} / ${s.basPlateau})`);
      assert.ok(s.bas <= 2160, `${nom} : le schéma dépasse la carte (${s.bas})`);
      const reste = (2160 - s.bas) / (2160 - s.basPlateau);
      /* les six fiches qui reçoivent le schéma vide (un nouveau dessin) : au moins la moitié de la
         place reste pour chercher ; les autres (taches répétées à 7 lignes…) doivent seulement tenir */
      if(SCHEMA_VIDE.has(nom.split("-")[0])) assert.ok(reste >= 0.5, `${nom} : il ne reste que ${Math.round(100 * reste)} % de la place pour chercher`);
      /* rien sur la correction, rien en 6 par page, rien à l'écran */
      await sans.close(); await avec.close();
      for(const autre of ["&layout=4&print=correction&modele=1", "&layout=6&print=statement&modele=1"]){
        const pg = await ouvrir(nav, q + autre);
        assert.ok((await pg.evaluate(IMPRIMER)).every((x) => x === null), `${nom} : schéma vide avec ${autre}`);
        assert.equal(await pg.evaluate(() => document.querySelectorAll("#mainSvg #enqueteSchemaVide").length), 0, `${nom} : schéma vide à l'écran`);
        await pg.close();
      }
      console.log(`  ${nom} : ${s.cases.length} cases, ${Math.round(s.bas - s.haut)} de haut, ${Math.round(100 * reste)} % libre dessous`);
      n++;
    }
    /* le lien « Copier le lien » garde modele=1 seulement s'il était dans l'adresse */
    const q = ADRESSES[Object.keys(ADRESSES)[3]];
    for(const [suffixe, attendu] of [["&modele=1", true], ["", false]]){
      const pg = await ouvrir(nav, q + suffixe);
      assert.equal(await pg.evaluate(() => new URL(buildShareUrl()).searchParams.get("modele") === "1"), attendu, `lien copié${suffixe}`);
      await pg.close();
    }
    /* le mode élève ne le lit pas */
    const el = await ouvrir(nav, q + "&eleve=1&modele=1");
    assert.equal(await el.evaluate(() => document.querySelectorAll("#enqueteSchemaVide").length), 0, "mode élève");
    await el.close();
  }finally{
    await nav.close();
  }
  console.log(`${n} fiches contrôlées : cartes identiques, schéma vide sur la carte 1 seulement, même dessin que le corrigé, dans la carte.`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
