// Défi calcul, lot 7a « Les décimaux (1) » (14/11/2026) : la VRAIE page,
// au navigateur, élève connecté (faux serveur de suivi), au téléphone
// (390 × 664 et 390 × 844) et à l'ordinateur (1366 × 657 et 1366 × 768).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-7a-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-7a-ecrans.cjs
//
//   montrer   « On te montre » des 8 niveaux (D5, D6, D7) : les carrés de 100
//             qui calculent ; un toucher, un morceau, jusqu'au bout ; puis un
//             toucher de trop fait trembler la consigne, au 3e les carrés
//             brillent, la consigne garde sa hauteur ; rien ne sort du cadre ;
//   dessin    « Avec le dessin » : les carrés, aucun chiffre dessus ;
//   écrire    J'écris de la leçon : rien ne bouge pendant la frappe ;
//   palier    le test de D6 d'un élève au CM2 s'arrête au palier 3 (2
//             marches sur 3) ;
//   parcours  Mon parcours, palier 3, à l'ordinateur 1366 × 657.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const CARTE = CORE.carte();
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-16";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = [[390, 664], [390, 844], [1366, 657], [1366, 768], [1920, 1080]];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp"};


// Lot K1 « la carte » (25/11/2026) : Mon parcours et le test de module sont
// partis. Leurs cas deviennent : la carte d'un élève arrivé à l'étage, où
// les étoiles du lot sont là (leur nom, lu par le lecteur d'écran), et le
// cadre tient. La progression est jouée par le vrai moteur (version 12).
const P12K1 = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CARTE_K1 = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js")).carte();
function parcoursJusqua(etage, jour = "2026-11-25") {
  const six = Array.from({length: 6}, () => ({juste: true, ms: 2000}));
  let p = P12K1.creerParcours();
  for (let e = 1; e < etage; e += 1) {
    const dedans = P12K1.carteEleve(p, CARTE_K1, {aujourdhui: jour}).etages.find(x => x.etage === e).lignes.flatMap(l => l.etoiles.map(x => x.cle));
    for (const k of CARTE_K1.ordre.filter(c => dedans.includes(c))) {
      const [m, n] = k.split("-");
      const r = P12K1.appliquerTentative(p, {module: m, niveau: Number(n), reponses: six}, {aujourdhui: P12K1.ajouterJours(jour, -40), carte: CARTE_K1});
      if (!r.refuse) p = r.parcours;
    }
  }
  return p;
}
const etoilesSurLaCarte = page => page.evaluate(() => [...document.querySelectorAll("#carte-lignes .ck-case")].map(b => (b.getAttribute("aria-label") || "").replace(/[\u00a0\u202f]/g, " ")));

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

// Tout ce qui vient avant `jusqua` dans l'ordre du parcours est entré (boîte
// 4, revient dans 9 jours : pas de calculs du jour aujourd'hui).
function parcoursAvant(arret, ceintures = [null, null, null, null]) {
  const brut = {version: P.VERSION, modules: {}, ceintures, jours: ["2026-11-12", "2026-11-13"], seances: ["2026-11-12", "2026-11-13"]};
  for (const c of P.parcoursConstruit(CARTE)) {
    if (arret(c)) break;
    const k = P.NIVEAUX[c.module];
    const m = brut.modules[c.module] || (brut.modules[c.module] = {vu: "2026-11-13", b: Array(k).fill(0), e: Array(k).fill(null), d: Array(k).fill(null), s: Array(k).fill(null), a: Array(k).fill(0), f: Array(k).fill(0)});
    m.b[c.niveau - 1] = 4;
    m.e[c.niveau - 1] = "2026-11-25";
    m.d[c.niveau - 1] = "2026-11-01";
    m.s[c.niveau - 1] = "2026-11-10";
    m.a[c.niveau - 1] = 1;
  }
  return P.normaliserParcours(brut);
}

async function ouvrir(nav, base, {largeur, hauteur, parcours = null}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), "7K3M9P");
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const h = {"access-control-allow-origin": "*"};
    const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: h, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: {}});
    if (corps.lire) return rendre({ok: true, existe: Boolean(parcours), parcours, revision: 1});
    return rendre({ok: true, revision: 2});
  });
  await page.goto(base + PAGE);
  for (let i = 0; i < 40; i += 1) { await page.clock.runFor(100); await page.waitForTimeout(25); }
  return {page, ctx, erreurs};
}

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(80); };
const appel = (page, nom, ...args) => page.evaluate(([n, a]) => window.__MATHSGO_DEFI_CALCUL_TEST__[n](...a), [nom, args]);
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, s);
async function taper(page, nombre) {
  for (const c of String(nombre).replace(".", ",")) await page.click(`#play [data-key="${c}"]`);
  await page.click("#validate");
  await pause(page, 300);
}
async function photo(page, nom) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.screenshot({path: path.join(SORTIE, `${nom}.png`)});
}
// Pas de défilement de côté, rien ne sort ; à l'ordinateur, le cadre entier.
async function tient(page, largeur, hauteur) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "pas de défilement de côté");
  if (largeur > 620) {
    const bas = await page.evaluate(() => document.querySelector(".panel:not([hidden])").getBoundingClientRect().bottom);
    assert.ok(bas <= hauteur + .5, `le cadre tient entier (${Math.round(bas)} / ${hauteur})`);
  }
}
const boiteDessin = page => page.evaluate(() => { const b = document.querySelector("#aide > svg").getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)].join(","); });
// La place d'un élément (rien ne doit bouger quand l'outil montre le geste).
// (Lot 7a, constat de Code sur la PR #1213 : sous Safari, la bande descend
// de 0,04 px quand elle brille, et l'arrondi au pixel faisait échouer la
// comparaison ; on compare à 1 px près, invisible à l'œil.)
const place = (page, sel) => page.evaluate(q => { const b = document.querySelector(q).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel);
const memePlace = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= 1);
const lignes = page => page.evaluate(() => [...document.querySelectorAll("#expression .lg > span")].map(l => ({classe: l.className, texte: l.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim()})));
const dessin = page => appel(page, "dessin");


const NIVEAUX = [["D5", 1], ["D5", 2], ["D6", 1], ["D6", 2], ["D6", 3], ["D7", 1], ["D7", 2], ["D7", 3]];
const boite = (page, sel) => page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel);

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };

  for (const [largeur, hauteur] of FORMATS) {
    const f = `${largeur}x${hauteur}`;
    await cas(`${f} : On te montre, Avec le dessin et J'écris des 8 niveaux (D5, D6, D7)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of NIVEAUX) {
        const cle = `${id}-${n}`;
        await appel(s.page, "montrer", id, n);
        await pause(s.page, 500);
        assert.match(await texte(s.page, "#seance-fil"), /On te montre$/, cle);
        const m = CORE.niveauDe(cle).niveau.apprends.manipule;
        const avant = await boite(s.page, "#aide .dc-carre-grand");
        await tient(s.page, largeur, hauteur);
        const scene = await boite(s.page, "#aide .dc-carre-scene");
        assert.ok(scene[0] >= 0 && scene[0] + scene[2] <= largeur + .5, `${cle} : les carrés tiennent en largeur`);
        let touchers = 0;
        for (let i = 0; i < 40; i += 1) {
          const e = await appel(s.page, "carreOp");
          if (!e || e.fini) break;
          await s.page.click("#aide .dc-carre-grand");
          await pause(s.page, 120);
          touchers += 1;
        }
        const e = await appel(s.page, "carreOp");
        assert.equal(e.fini, true, `${cle} : le geste va au bout`);
        assert.equal(e.fait, m.autre, `${cle} : toutes les cases`);
        assert.ok(memePlace(await boite(s.page, "#aide .dc-carre-grand"), avant), `${cle} : les carrés ne bougent pas`);
        assert.match(await texte(s.page, "#aide .dc-trace"), new RegExp(CORE.formaterNombre(CORE.niveauDe(cle).niveau.apprends.exemple.reponse).replace(/[  ]/g, " ").replace(",", "\\,")), `${cle} : la trace écrit la réponse`);
        // Trois touchers de trop : les carrés brillent, la consigne ne bouge pas.
        const consigne = await boite(s.page, "#aide .consigne");
        for (let i = 0; i < 3; i += 1) { await s.page.click("#aide .dc-carre-grand"); await pause(s.page, 150); }
        assert.equal((await appel(s.page, "montre")).montre, true, `${cle} : au 3e toucher de trop, les carrés brillent`);
        assert.ok(memePlace(await boite(s.page, "#aide .consigne"), consigne), `${cle} : la consigne garde sa place`);
        await photo(s.page, `${f}-${cle}-montre`);
        await tient(s.page, largeur, hauteur);

        assert.equal(await appel(s.page, "nouveaute", id, n, "", "image"), true);
        await pause(s.page, 500);
        assert.match(await texte(s.page, "#seance-fil"), /Avec le dessin$/, cle);
        // (Lot 6 « programmes 2 » : 2,3 + 4, un entier et un décimal, se
        // dessine dans le tableau de numération, qui écrit les deux nombres ;
        // les carrés, eux, n'écrivent rien.)
        const pose = await appel(s.page, "calcul");
        if (CORE.aideDe(pose).outil !== "numeration") assert.equal(await s.page.evaluate(() => document.querySelectorAll("#aide svg text").length), 0, `${cle} : aucun chiffre sur les carrés`);
        await photo(s.page, `${f}-${cle}-dessin`);
        await tient(s.page, largeur, hauteur);

        await appel(s.page, "ecrire", id, n, "lecon");
        await pause(s.page, 500);
        const etapes = await appel(s.page, "ecrisEnCours");
        const dessin = await boite(s.page, "#aide > svg");
        // « Valider » et le haut de J'écris se voient en entier (à 1366 × 657, des carrés trop hauts les poussaient dehors).
        assert.ok(await s.page.evaluate(() => { const p = document.querySelector(".panel:not([hidden])").getBoundingClientRect(); const v = document.querySelector("#validate").getBoundingClientRect(); return v.bottom <= p.bottom + .5 && v.bottom <= innerHeight + .5; }), `${cle} : « Valider » se voit`);
        for (const [k, etape] of etapes.entries()) {
          const expression = await boite(s.page, "#expression");
          for (const c of CORE.formaterNombre(etape.reponse)) {
            await s.page.click(`#play [data-key="${c}"]`);
            assert.ok(memePlace(await boite(s.page, "#expression"), expression), `${cle} : rien ne bouge pendant la frappe`);
          }
          await s.page.click("#validate");
          await pause(s.page, 600);
          // (Après la dernière étape, l'écran de fin se met en place.)
          // (Sa hauteur grandit de 2 à 3 px quand les lignes se remplissent,
          // comme dans tous les modules : on regarde sa place et sa largeur.)
          if (k < etapes.length - 1) assert.ok(memePlace((await boite(s.page, "#aide > svg")).slice(0, 3), dessin.slice(0, 3)), `${cle} : le dessin ne bouge pas`);
        }
        await photo(s.page, `${f}-${cle}-ecris`);
        await tient(s.page, largeur, hauteur);

        await appel(s.page, "retenir", id, n, "");
        await pause(s.page, 400);
        await photo(s.page, `${f}-${cle}-retenir`);
        if (largeur > 620) await tient(s.page, largeur, hauteur);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    // (Lot K1 : le cas « le test de D6 s'arrête au palier 3 » est retiré : plus de test de module.)

    await cas(`${f} : la carte (lot K1) — un élève au CM2 : D5, D6, D7`, async () => {
      for (const [nom, etage, motifs] of [
        ["cm2", 3, [/^Compléter à l’unité/, /^Additionner sans échange de dixièmes/, /^Soustraire sans échange de dixièmes/]]]) {
        const s = await ouvrir(nav, base, {largeur, hauteur, parcours: parcoursJusqua(etage)});
        await s.page.click("#acc-porte");
        await pause(s.page, 800);
        assert.equal(await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.carte().courant), etage, `${nom} : l'étage ${etage}`);
        const vues = await etoilesSurLaCarte(s.page);
        motifs.forEach(m => assert.ok(vues.some(v => m.test(v)), `${nom} : ${m} sur la carte (${vues.length} étoiles)`));
        await photo(s.page, `${f}-carte-${nom}`);
        await tient(s.page, largeur, hauteur);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      }
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
