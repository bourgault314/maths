// Évaluations nationales, lot EN-A1 « l'accueil » (14/11/2026, choix de Gwenaël : onglets A, questions ratées depuis
// l'écran du test, bandeau à côté d'Automatismes) : la VRAIE page, au navigateur.
//
// Hors CI : « npm run verifier » la joue quand la branche touche l'appli ou « Explorer les outils »
// (scripts/verifier-navigateur.mjs) ; à la main :
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 npm install --no-save playwright
//   node tests/evaluations-nationales-accueil-ecrans.cjs
//
// Ce qui est vérifié :
//   accueil     1 366 × 657, 1 280 × 600, 1 440 × 900 : la page tient entière, chaque classe montre ses tests,
//               chacun avec son icône ;
//               d'un onglet à l'autre le cadre et les onglets ne bougent pas (au pixel) ; 390 × 844 et 360 × 740 :
//               rien ne déborde en largeur ;
//   mémoire     la classe choisie revient au prochain passage ; ?niveau= l'emporte ; le dernier résultat s'affiche
//               (couleur du groupe, gris sans repères) ;
//   test        la carte ouvre le test ; la flèche « 4e » ramène aux tests de 4e ; sans sujet → l'accueil ;
//               l'écran du choix tient dans 1 366 × 657 pour les 14 tests, carte des questions ratées comprise ;
//   ratées      un sujet passé (graine connue) garde ses questions ratées ; la carte « Refaire mes 2 questions
//               ratées » rejoue exactement ces questions, sur le jumeau du sujet 2024-2025 ; après les avoir refaites,
//               seule l'encore ratée reste ;
//   outils      les deux bandeaux côte à côte (même hauteur, même ligne) à 1 366, l'un sous l'autre à 390 ; la page
//               tient dans 1 366 × 700 comme avant.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
globalThis.window = globalThis;
require(path.join(RACINE, "outils/evaluations_nationales/en_commun.js"));
const pageEval = fs.readFileSync(path.join(RACINE, "outils/evaluations_nationales/evaluation.html"), "utf8");
for (const m of pageEval.matchAll(/<script src="\.\/((?:sujets\/)?[\w]+\.js)\?v=[^"]+"><\/script>/g))
  if (!/^(en_commun|evaluation)\.js$/.test(m[1])) require(path.join(RACINE, "outils/evaluations_nationales", m[1]));
const S = globalThis.EN_SUJETS;
const {construire, hasard} = globalThis.EN;
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp"};

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    let fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (fichier.startsWith(RACINE) && fs.existsSync(fichier) && fs.statSync(fichier).isDirectory()) fichier = path.join(fichier, "index.html");
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier)) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

const NIVEAUX = ["6e", "5e", "4e", "3e"];
const parNiveau = (n) => Object.values(S).filter(s => s.niveau === n).length;
// Math.random fixé : la graine d'un jumeau est 1 + floor(0,5 × 2147483646), que le test recalcule ici.
const GRAINE = 1 + Math.floor(0.5 * 2147483646);

(async () => {
  const serveur = await servir();
  const BASE = `http://127.0.0.1:${serveur.address().port}`;
  const ACC = `${BASE}/outils/evaluations_nationales/`;
  const navigateur = await chromium.launch();
  let n = 0;
  const ok = (m) => { n++; console.log("ok -", m); };
  const contexte = async (w, h) => {
    const c = await navigateur.newContext({viewport: {width: w, height: h}});
    await c.addInitScript(() => { Math.random = () => 0.5; });
    return c;
  };
  const tientEntier = (page) => page.evaluate(() => {
    const p = document.querySelector(".panel").getBoundingClientRect();
    return {bas: Math.round(p.bottom), haut: innerHeight, large: document.documentElement.scrollWidth <= innerWidth};
  });

  try {
    // ---- L'accueil : tient entier, chaque classe, rien ne bouge d'un onglet à l'autre ----
    for (const [w, h] of [[1366, 657], [1280, 600], [1440, 900]]) {
      const c = await contexte(w, h); const page = await c.newPage();
      await page.goto(ACC);
      let reference = null;
      for (const niv of NIVEAUX) {
        await page.click(`#onglet-${niv}`);
        const r = await page.evaluate((niv) => {
          const box = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.height)].join(","); };
          const liste = document.getElementById("liste-" + niv);
          const visibles = [...liste.querySelectorAll(".test")].filter(a => a.checkVisibility({visibilityProperty: true})).length;
          const icones = [...liste.querySelectorAll(".test .ico svg")].length;
          const autres = [...document.querySelectorAll(".liste")].filter(l => l !== liste).flatMap(l => [...l.querySelectorAll(".test")]).filter(a => a.checkVisibility({visibilityProperty: true})).length;
          return {cadre: box(".panel"), onglets: box(".niveaux"), source: box(".source"), visibles, autres, icones,
            choisi: document.querySelector('.niveaux [aria-selected="true"]').dataset.niveau};
        }, niv);
        assert.equal(r.choisi, niv);
        assert.equal(r.visibles, parNiveau(niv), `${niv} : ${parNiveau(niv)} tests`);
        assert.equal(r.autres, 0, `${niv} : aucune carte des autres classes`);
        assert.equal(r.icones, parNiveau(niv), `${niv} : chaque carte a son icône (icônes des domaines du site)`);
        const pos = [r.cadre, r.onglets, r.source].join(" ");
        if (reference === null) reference = pos;
        assert.equal(pos, reference, `${w}×${h} : rien ne bouge en passant à la ${niv}`);
        const t = await tientEntier(page);
        assert.ok(t.bas <= t.haut, `${w}×${h}, ${niv} : le cadre tient entier (${t.bas} > ${t.haut})`);
      }
      ok(`accueil ${w}×${h} : 4 classes, tests justes, rien ne bouge, tout tient`);
      await c.close();
    }
    for (const [w, h] of [[390, 844], [360, 740]]) {
      const c = await contexte(w, h); const page = await c.newPage();
      await page.goto(ACC);
      for (const niv of NIVEAUX) {
        await page.click(`#onglet-${niv}`);
        const t = await tientEntier(page);
        assert.ok(t.large, `${w} px, ${niv} : rien ne déborde en largeur`);
        const coupe = await page.evaluate(() => [...document.querySelectorAll(".test .nb")].filter(e => e.checkVisibility() && e.getClientRects().length > 1).length);
        assert.equal(coupe, 0, `${w} px, ${niv} : « N questions » jamais coupé`);
      }
      ok(`accueil ${w} px : rien ne déborde`);
      await c.close();
    }

    // ---- Mémoire de la classe, ?niveau=, dernier résultat ----
    {
      const c = await contexte(1366, 657); const page = await c.newPage();
      await page.goto(ACC);
      assert.equal(await page.getAttribute("#onglet-6e", "aria-selected"), "true", "première visite : la 6e");
      await page.click("#onglet-4e");
      await page.goto(ACC);
      assert.equal(await page.getAttribute("#onglet-4e", "aria-selected"), "true", "la classe choisie revient");
      await page.goto(ACC + "?niveau=3e");
      assert.equal(await page.getAttribute("#onglet-3e", "aria-selected"), "true", "?niveau= l'emporte");
      await page.evaluate(() => {
        localStorage.setItem("mathsgo-en-4e-automatismes", JSON.stringify({type: "officiel", officiel: "2026", score: 15, total: 22, groupe: "Fragile", date: "x"}));
        localStorage.setItem("mathsgo-en-4e-exemples-nombres", JSON.stringify({type: "officiel", officiel: "eduscol", score: 7, total: 9, groupe: null, date: "x"}));
      });
      await page.goto(ACC + "?niveau=4e");
      const pastilles = await page.evaluate(() => ["4e-automatismes", "4e-exemples-nombres", "4e-problemes"].map(id => {
        const p = document.querySelector(`[data-sujet="${id}"] .der`); return p.hidden ? null : `${p.textContent}|${p.className}`;
      }));
      assert.deepEqual(pastilles, ["15 / 22|der g1", "7 / 9|der ", null]);
      ok("mémoire : classe retenue, ?niveau=, dernier résultat à la couleur du groupe");

      // ---- La carte ouvre le test ; la flèche ramène aux tests de sa classe ----
      await page.click('[data-sujet="4e-problemes"]');
      await page.waitForURL(/evaluation\.html\?sujet=4e-problemes$/);
      assert.equal((await page.textContent("#retour-texte")).trim(), "4e");
      await page.click("#retour");
      await page.waitForURL(/evaluations_nationales\/\?niveau=4e$/);
      assert.equal(await page.getAttribute("#onglet-4e", "aria-selected"), "true");
      await page.goto(`${BASE}/outils/evaluations_nationales/evaluation.html`);
      await page.waitForURL(/evaluations_nationales\/$/);
      await page.goto(`${BASE}/outils/evaluations_nationales/evaluation.html?sujet=n-existe-pas`);
      await page.waitForURL(/evaluations_nationales\/$/);
      ok("test : la carte ouvre le test, la flèche « 4e » revient aux tests de 4e, sans sujet → l'accueil");
      await c.close();
    }

    // ---- L'écran du choix tient dans 1 366 × 657 pour les 14 tests, carte des ratées comprise ----
    for (const [w, h] of [[1366, 657], [1280, 600]]) {
      const c = await contexte(w, h); const page = await c.newPage();
      await page.goto(ACC);
      await page.evaluate((ids) => { for (const id of ids) localStorage.setItem("mathsgo-en-" + id, JSON.stringify({type: "officiel", officiel: null, modele: null, score: 15, total: 22, groupe: "Fragile", rates: [1, 2, 3, 4, 5, 6, 7], date: "x"})); }, Object.keys(S));
      for (const [id, s] of Object.entries(S)) {
        await page.goto(`${BASE}/outils/evaluations_nationales/evaluation.html?sujet=${id}`);
        const t = await tientEntier(page);
        assert.ok(t.bas <= t.haut, `${w}×${h}, ${id} : l'écran du choix tient entier (${t.bas} > ${t.haut})`);
        const carte = await page.isVisible("#refaire-accueil");
        assert.equal(carte, s.jumeaux !== false, `${id} : carte des ratées ${s.jumeaux !== false ? "présente" : "absente (pas de jumeaux)"}`);
        assert.equal(await page.isVisible("#dernier"), s.jumeaux === false, `${id} : la ligne « Ton dernier sujet » seulement sans la carte`);
      }
      ok(`écran du choix ${w}×${h} : les 14 tests tiennent, carte des ratées seulement avec des jumeaux`);
      await c.close();
    }

    // ---- Les questions ratées : gardées, refaites depuis l'écran du test, sur le bon modèle ----
    {
      const sujet = S["4e-automatismes"];
      const modele = sujet.officiels.find(o => o.cle === "2024-2025");
      const c = await contexte(1366, 657); const page = await c.newPage();
      const repondre = async (items, justes) => {
        for (let i = 0; i < items.length; i++) {
          const k = justes.has(items[i].q.num) ? items[i].choix.findIndex(x => x.juste) : items[i].choix.findIndex(x => !x.juste);
          await page.locator("#q-choix .choix-btn").nth(k).click();
          await page.click("#valider");
        }
      };
      await page.goto(`${BASE}/outils/evaluations_nationales/evaluation.html?sujet=4e-automatismes`);
      // Le sujet officiel 2024-2025 (graine 1) : tout juste sauf les questions 1 et 6.
      const officiel = construire(sujet, hasard(1), modele, null, modele);
      await page.locator("[data-officiel]").nth(1).click();
      await repondre(officiel, new Set(officiel.map(x => x.q.num).filter(q => q !== 1 && q !== 6)));
      const garde = await page.evaluate(() => JSON.parse(localStorage.getItem("mathsgo-en-4e-automatismes")));
      assert.deepEqual(garde.rates, [1, 6]);
      assert.equal(garde.modele, "2024-2025");
      assert.equal(garde.score, 20);
      await page.click("#retour-accueil");
      assert.equal((await page.textContent("#refaire-accueil-titre")).trim(), "Refaire mes 2 questions ratées");
      assert.ok(!(await page.isVisible("#dernier")));
      // La reprise : le jumeau du sujet 2024-2025 (Q1 « 14 − 6 » : une soustraction), questions 1 et 6 seulement.
      const reprise = construire(sujet, hasard(GRAINE), null, [1, 6], modele);
      await page.click("#refaire-accueil");
      assert.equal((await page.textContent("#q-num")).trim(), "Question 1 du sujet");
      assert.equal((await page.textContent("#compteur")).trim(), "Question 1 / 2");
      const enonce = (await page.textContent("#q-enonce")).replace(/\s+/g, " ").trim();
      assert.equal(enonce, reprise[0].g.enonce.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(), "le jumeau rejoué est celui que calcule le moteur");
      await repondre(reprise, new Set([1]));
      const apres = await page.evaluate(() => JSON.parse(localStorage.getItem("mathsgo-en-4e-automatismes")));
      assert.deepEqual(apres.rates, [6], "seule l'encore ratée reste");
      assert.equal(apres.score, 20, "le score du sujet ne change pas");
      await page.click("#retour-accueil");
      assert.equal((await page.textContent("#refaire-accueil-titre")).trim(), "Refaire ma question ratée");
      ok("ratées : gardées au bilan, refaites depuis l'écran du test sur le jumeau 2024-2025, seule l'encore ratée reste");
      await c.close();
    }

    // ---- « Explorer les outils » : deux bandeaux ----
    {
      const c = await contexte(1366, 700); const page = await c.newPage();
      await page.goto(`${BASE}/outils/index.html`);
      const r = await page.evaluate(() => {
        const [a, b] = [...document.querySelectorAll(".auto-features .auto-feature")].map(x => x.getBoundingClientRect());
        const cadre = document.querySelector(".main-panel");
        return {memeLigne: Math.round(a.top) === Math.round(b.top), memeHauteur: Math.round(a.height) === Math.round(b.height), cote: b.left > a.right,
          pied: Math.round(cadre.getBoundingClientRect().bottom), href: document.querySelector(".auto-feature-evaluations").getAttribute("href")};
      });
      assert.ok(r.memeLigne && r.memeHauteur && r.cote, "côte à côte, même hauteur");
      assert.equal(r.href, "evaluations_nationales/");
      assert.ok(r.pied <= 700, `le cadre de la page tient dans 1 366 × 700 (${r.pied})`);
      await page.click(".auto-feature-evaluations");
      await page.waitForURL(/evaluations_nationales\/$/);
      await c.close();
      const t = await contexte(390, 844); const tel = await t.newPage();
      await tel.goto(`${BASE}/outils/index.html`);
      const r2 = await tel.evaluate(() => {
        const [a, b] = [...document.querySelectorAll(".auto-features .auto-feature")].map(x => x.getBoundingClientRect());
        return {dessous: b.top >= a.bottom, large: document.documentElement.scrollWidth <= innerWidth};
      });
      assert.ok(r2.dessous && r2.large, "téléphone : l'un sous l'autre, rien ne déborde");
      await t.close();
      ok("Explorer les outils : bandeaux côte à côte (1 366), l'un sous l'autre (390), la page tient, le lien mène à l'accueil");
    }
    console.log(`\n${n} vérifications au navigateur : toutes réussies.`);
  } finally {
    await navigateur.close();
    serveur.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
