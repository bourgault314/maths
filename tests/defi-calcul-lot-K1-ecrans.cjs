// Défi calcul, lot K1 « la carte chez l'élève » (25/11/2026, planches K0-1 à
// K0-5a, K0-7, K1-1 à K1-4 validées par Gwenaël) : la VRAIE page, au
// navigateur, élève connecté par code (faux serveur de suivi), au téléphone
// (390 × 844) et à l'ordinateur (1366 × 768), en fenêtre et en plein écran.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-K1-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-K1-ecrans.cjs
// Un seul format : FORMATS=1366x768 node tests/defi-calcul-lot-K1-ecrans.cjs
//
// Les écrans NEUFS du lot, chacun : rien ne sort sur le côté ; à
// l'ordinateur, le cadre tient entier dans l'écran (la carte comprise, même
// au CM2 avec « Tente toute la ceinture ») ; au téléphone, la carte défile
// et son bas (« Continuer ») reste collé en bas de l'écran.
//   accueil      la ceinture, « Ceinture jaune · 17 étoiles sur 44 », le but
//                du jour, « Avant : tes N calculs du jour. », « Commencer » ;
//                « Tout est gagné. » ;
//   carte        les 4 étages, la ceinture et son compte, les lignes, « Mes
//                calculs du jour — encore N », « Continuer » ; le CM2 neuf ;
//   panneau      à gagner, fermée, déjà tentée, gagnée, professeur ; il se
//                pose par-dessus : la carte ne bouge pas, et le défilement est
//                le même avant et après ;
//   je tente     les ronds « 5 justes pour l'étoile », gagné et raté ;
//   jour         Mes calculs du jour, deux faux : « l'étoile est partie » ;
//   ceinture     « Tente toute la ceinture » réussi : l'écran de la ceinture ;
//   séance       une séance entière jusqu'à « Séance terminée » ;
//   notice       « Comment ça marche ? » ;
//   chargement   le cadre attend le serveur, puis ne bouge plus, l'accueil
//                centré (repris de defi-calcul-accueil-ecrans.cjs).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CARTE = CORE.carte();
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-25";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = process.env.FORMATS ? process.env.FORMATS.split(",").map(x => x.split("x").map(Number)) : [[390, 844], [1366, 768]];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp", ".json": "application/json"};

// ------------------------------------------------- des élèves, joués avec le vrai moteur
const SIX = Array.from({length: 6}, () => ({juste: true, ms: 2000}));
function gagner(p, cles, jour) {
  for (const k of cles) {
    const [m, n] = k.split("-");
    const r = P.appliquerTentative(p, {module: m, niveau: Number(n), reponses: SIX}, {aujourdhui: jour, carte: CARTE});
    if (!r.refuse) p = r.parcours;
  }
  return p;
}
const clesDeLEtage = (p, etage) => {
  const plan = P.carteEleve(p, CARTE, {aujourdhui: JOUR});
  const dedans = plan.etages.find(e => e.etage === etage).lignes.flatMap(l => l.etoiles.map(e => e.cle));
  return CARTE.ordre.filter(k => dedans.includes(k));
};
const ELEVES = {
  // Un élève qui arrive.
  neuf: () => P.creerParcours(),
  // Léa : 17 étoiles des bases gagnées hier ; elles reviennent aujourd'hui.
  lea: () => gagner(P.creerParcours(), CARTE.ordre.slice(0, 17), P.ajouterJours(JOUR, -1)),
  // Les bases et le CM1 gagnés il y a longtemps (et revus) : le CM2 s'ouvre, neuf.
  cm2: () => {
    let p = P.creerParcours();
    p = gagner(p, clesDeLEtage(p, 1), P.ajouterJours(JOUR, -40));
    p = gagner(p, clesDeLEtage(p, 2), P.ajouterJours(JOUR, -40));
    return p;
  },
  // Toutes les bases gagnées aujourd'hui, le professeur arrête aux bases : tout est gagné.
  toutGagne: () => { const p = P.creerParcours(); return gagner(p, clesDeLEtage(p, 1), JOUR); }
};

// ------------------------------------------------------------------ la page
function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

async function ouvrir(nav, base, {largeur, hauteur, parcours = null, reglages = {}, prof = false, plein = false, adresse = ""}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erreurs.push(m.text()); });
  if (!prof) {
    await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), "7K3M9P");
    await page.route("https://suivi.mathsgo.re/**", async route => {
      const corps = JSON.parse(route.request().postData() || "{}");
      const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(d)});
      if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages});
      if (corps.lire) return rendre(parcours ? {ok: true, existe: true, parcours, revision: 1} : {ok: true, existe: false});
      return rendre({ok: true, revision: 2});
    });
  }
  await page.goto(base + PAGE + (prof ? "&prof=1" : "") + adresse);
  for (let i = 0; i < 40; i += 1) {
    await page.clock.runFor(100);
    await page.waitForTimeout(25);
    if (await page.evaluate(() => !document.body.classList.contains("accueil-en-attente"))) break;
  }
  await pause(page, 200);
  if (plein) { await page.click("[data-fullscreen-toggle]"); await pause(page, 400); }
  return {page, ctx, erreurs};
}

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(60); };
const espaces = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText : null; }, s).then(espaces);
const T = (page, nom) => page.evaluate(n => window.__MATHSGO_DEFI_CALCUL_TEST__[n](), nom);
async function photo(page, nom) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  // (Les animations CSS suivent le vrai temps, pas l'horloge de la page :
  // « Séance terminée » finit d'apparaître.)
  await page.waitForTimeout(700);
  await page.screenshot({path: path.join(SORTIE, `${nom}.png`)});
}

// Rien ne sort sur le côté ; à l'ordinateur, le cadre entier ; au
// téléphone, l'écran de la carte peut défiler mais son bas reste visible.
async function tient(page, largeur, hauteur, quoi) {
  const m = await page.evaluate(() => {
    const cadre = document.querySelector(".panel").getBoundingClientRect();
    const sortent = [...document.querySelectorAll(".panel *")].filter(e => {
      if (!e.getClientRects().length || e.closest("[hidden]")) return false;
      const s = getComputedStyle(e);
      if (s.position === "fixed" || s.visibility === "hidden") return false;
      const b = e.getBoundingClientRect();
      return b.width > 0 && (b.left < -0.5 || b.right > innerWidth + 0.5);
    }).map(e => e.id || e.className || e.tagName).slice(0, 4);
    return {large: document.documentElement.scrollWidth <= innerWidth, bas: cadre.bottom, sortent};
  });
  assert.equal(m.large, true, `${quoi} : pas de défilement de côté`);
  assert.deepEqual(m.sortent, [], `${quoi} : rien ne sort de l'écran`);
  if (largeur > 620) assert.ok(m.bas <= hauteur + 0.5, `${quoi} : le cadre tient entier (${Math.round(m.bas)} / ${hauteur})`);
}

// Répondre au calcul affiché : juste ou faux. Rend false s'il n'y en a pas.
async function repondre(page, juste) {
  for (let k = 0; k < 4; k += 1) {
    const e = await page.evaluate(() => { const t = window.__MATHSGO_DEFI_CALCUL_TEST__; return {calcul: t.calcul(), exemple: t.exempleAffiche ? t.exempleAffiche() : null, jeu: !document.getElementById("play").hidden}; });
    if (!e.jeu || !e.calcul) return false;
    if (e.exemple && e.exemple.exemple) { await page.click("#validate"); await pause(page, 400); continue; }
    const rep = juste ? CORE.reponseEcrite(e.calcul) : "99999";
    if (rep.includes("/")) {
      const [num, den] = rep.split("/");
      await page.keyboard.type(num); await page.keyboard.press("/"); await page.keyboard.type(den);
    } else await page.keyboard.type(rep);
    await page.keyboard.press("Enter");
    await pause(page, 1600);
    const faux = await page.evaluate(() => !document.getElementById("play").hidden && document.getElementById("answer-feedback").classList.contains("is-wrong"));
    if (faux) { await page.keyboard.press("Enter"); await pause(page, 600); }
    return true;
  }
  return false;
}
const enJeu = page => page.evaluate(() => !document.getElementById("play").hidden);

// ------------------------------------------------------------------ les cas
let echecs = 0;
async function cas(nom, f) {
  try { await f(); console.log(`  ✓ ${nom}`); }
  catch (e) { echecs += 1; console.log(`  ✗ ${nom}\n      ${String(e && e.message || e).split("\n").join("\n      ")}`); }
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  const lea = ELEVES.lea(), neuf = ELEVES.neuf(), cm2 = ELEVES.cm2(), toutGagne = ELEVES.toutGagne();

  for (const [largeur, hauteur] of FORMATS) {
    // (Au téléphone, pas de bouton « Plein écran » : la page l'est déjà.)
    for (const plein of largeur > 620 ? [false, true] : [false]) {
      const f = `${largeur}x${hauteur}${plein ? "-plein" : ""}`;
      const o = {largeur, hauteur, plein};

      await cas(`${f} : l'accueil (Léa, 17 étoiles ; puis tout gagné)`, async () => {
        const s = await ouvrir(nav, base, Object.assign({parcours: lea}, o));
        assert.equal(await texte(s.page, "#acc-compte"), "Ceinture jaune · 17 étoiles sur 44");
        assert.match(await texte(s.page, "#acc-but"), /^Aujourd’hui : l’étoile .+ Avant : tes \d+ calculs du jour\.$/);
        assert.equal(await texte(s.page, "#acc-commencer"), "Commencer");
        assert.equal(await texte(s.page, "#acc-bas"), "10 minutes La carte Comment ça marche ?");
        assert.ok(await s.page.isVisible("#acc-ceinture svg"), "la ceinture est dessinée");
        await tient(s.page, largeur, hauteur, "accueil");
        await photo(s.page, `${f}-accueil`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
        const t = await ouvrir(nav, base, Object.assign({parcours: toutGagne, reglages: {"defi-calcul": {palier: 1}}}, o));
        assert.ok(await t.page.isVisible("#acc-tout"), "« Tout est gagné. »");
        assert.match(await texte(t.page, "#acc-tout"), /^Tout est gagné\. Tes étoiles reviennent demain, pour voir si elles tiennent\. Je m’entraîne encore La carte S’entraîner ne fait perdre aucune étoile\.$/);
        assert.equal(await t.page.isVisible("#acc-commencer"), false);
        await tient(t.page, largeur, hauteur, "accueil, tout gagné");
        await photo(t.page, `${f}-accueil-tout-gagne`);
        assert.deepEqual(t.erreurs, []);
        await t.ctx.close();
      });

      await cas(`${f} : la carte (Léa, les bases) ; le panneau par-dessus, le défilement gardé`, async () => {
        const s = await ouvrir(nav, base, Object.assign({parcours: lea}, o));
        await s.page.click("#acc-porte");
        await pause(s.page, 300);
        assert.equal(await s.page.evaluate(() => document.querySelectorAll("#carte-etages > *").length), 4, "4 étages");
        assert.match(await texte(s.page, "#carte-porteur"), /Ceinture jaune.*17 étoiles sur 44/);
        assert.match(await texte(s.page, "#carte-jour"), /^Mes calculs du jour ?encore \d+ →?$/);
        assert.ok(await s.page.isVisible("#carte-continuer"));
        await tient(s.page, largeur, hauteur, "carte");
        // Le bas de la carte (« Continuer ») est dans l'écran.
        const bas = await s.page.evaluate(() => document.getElementById("carte-continuer").getBoundingClientRect().bottom);
        assert.ok(bas <= hauteur + 0.5, `« Continuer » dans l'écran (${Math.round(bas)} / ${hauteur})`);
        await photo(s.page, `${f}-carte`);
        // Le panneau : on descend d'abord (au téléphone, la carte défile).
        await s.page.evaluate(() => window.scrollTo(0, 260));
        await pause(s.page, 100);
        const avant = await s.page.evaluate(() => ({y: window.scrollY, ligne: document.querySelector("#carte-lignes").getBoundingClientRect().top}));
        await s.page.click('#carte-lignes [data-cle="A6-1"]');
        await pause(s.page, 300);
        assert.ok(await s.page.isVisible("#carte-panneau"), "le panneau s'ouvre");
        const pendant = await s.page.evaluate(() => ({y: window.scrollY, ligne: document.querySelector("#carte-lignes").getBoundingClientRect().top}));
        assert.deepEqual(pendant, avant, "le panneau ouvert, rien ne bouge dessous");
        const p = await s.page.evaluate(() => { const b = document.getElementById("carte-panneau").getBoundingClientRect(); return {haut: b.top, bas: b.bottom, g: b.left, d: b.right}; });
        assert.ok(p.haut >= 0 && p.bas <= hauteur + 0.5 && p.g >= 0 && p.d <= largeur + 0.5, "le panneau tient dans l'écran");
        // (Léa a des calculs du jour à faire : le panneau les demande d'abord.)
        assert.match(await texte(s.page, "#panneau-corps"), /Avant : tes 10 calculs du jour\. ?Commencer$/);
        await photo(s.page, `${f}-panneau`);
        await s.page.keyboard.press("Escape");
        await pause(s.page, 200);
        assert.equal(await s.page.isVisible("#carte-panneau"), false, "Échap le ferme");
        const apres = await s.page.evaluate(() => ({y: window.scrollY, ligne: document.querySelector("#carte-lignes").getBoundingClientRect().top}));
        assert.deepEqual(apres, avant, "le défilement est le même avant et après le panneau");
        // Fermée : « D'abord : … ».
        const fermee = await s.page.evaluate(() => { const b = document.querySelector("#carte-lignes .ck-case.fermee"); return b ? b.dataset.cle : null; });
        assert.ok(fermee, "une étoile fermée");
        await s.page.click(`#carte-lignes [data-cle="${fermee}"]`);
        await pause(s.page, 300);
        assert.match(await texte(s.page, "#panneau-corps"), /Fermée\. D’abord : /);
        await s.page.click("#panneau-fermer");
        await pause(s.page, 200);
        // Gagnée : « Je m'entraîne encore ».
        await s.page.click('#carte-lignes [data-cle="A1-1"]');
        await pause(s.page, 300);
        assert.match(await texte(s.page, "#panneau-corps"), /Je m’entraîne encore/);
        await s.page.click("#carte-voile", {position: {x: 5, y: 5}});
        await pause(s.page, 200);
        assert.equal(await s.page.isVisible("#carte-panneau"), false, "toucher le voile le ferme");
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      });

      await cas(`${f} : la carte du CM2, neuve, avec « Tente toute la ceinture »`, async () => {
        const s = await ouvrir(nav, base, Object.assign({parcours: cm2}, o));
        await s.page.click("#acc-porte");
        await pause(s.page, 300);
        const c = await T(s.page, "carte");
        assert.equal(c.courant, 3, "l'étage du CM2");
        assert.ok(await s.page.isVisible("#carte-tente"), "« Tente toute la ceinture »");
        assert.match(await texte(s.page, "#carte-tente"), /Tu sais déjà tout ça \? ?Tente toute la ceinture : 12 calculs\. ?Je tente/);
        await tient(s.page, largeur, hauteur, "carte du CM2");
        await photo(s.page, `${f}-carte-cm2`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      });

      await cas(`${f} : « Je tente » (élève neuf) — les ronds, gagné ; raté, puis le panneau « déjà tenté »`, async () => {
        const s = await ouvrir(nav, base, Object.assign({parcours: neuf}, o));
        await s.page.click("#acc-commencer");
        await pause(s.page, 2500);
        assert.equal(await T(s.page, "genre"), "tente", "la première étape : Je tente");
        // (Le fil, sous la ligne de suivi, n'écrit que l'étape : « Ma séance » est caché, comme depuis le lot 3b.)
        assert.match(espaces(await s.page.evaluate(() => document.getElementById("fil-seance").textContent)), /^Ma séanceJe tente : /);
        assert.match(await texte(s.page, "#fil-seance"), largeur > 620 ? /^Je tente : / : /^Je tente$/, "au téléphone, seul « Je tente »");
        assert.match(await texte(s.page, "#escalier"), /5 justes pour l’étoile/);
        const centres = await s.page.evaluate(() => [...document.querySelectorAll(".ck-points i")].map(i => {
          const r = i.getBoundingClientRect(), g = document.createRange(); g.selectNodeContents(i); const t = g.getBoundingClientRect();
          return Math.max(Math.abs((t.top + t.bottom - r.top - r.bottom) / 2), Math.abs((t.left + t.right - r.left - r.right) / 2));
        }));
        assert.equal(centres.length, 6);
        assert.ok(centres.every(e => e <= 1.5), `chiffres centrés dans les ronds (${centres.map(e => e.toFixed(1))})`);
        await tient(s.page, largeur, hauteur, "Je tente");
        await photo(s.page, `${f}-je-tente`);
        for (let k = 0; k < 6 && await enJeu(s.page); k += 1) await repondre(s.page, true);
        await pause(s.page, 500);
        assert.match(await texte(s.page, "#result"), /Étoile gagnée/i);
        assert.match(await texte(s.page, "#result"), /5 justes sur 5\. Elle reviendra demain dans tes calculs du jour\./);
        await tient(s.page, largeur, hauteur, "Étoile gagnée");
        await photo(s.page, `${f}-je-tente-gagnee`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
        // Raté : deux faux.
        const r = await ouvrir(nav, base, Object.assign({parcours: neuf}, o));
        await r.page.click("#acc-commencer");
        await pause(r.page, 2500);
        await repondre(r.page, false); await repondre(r.page, false);
        await pause(r.page, 600);
        assert.match(await texte(r.page, "#result"), /Ce calcul, on l’apprend ensemble\./);
        await tient(r.page, largeur, hauteur, "Je tente raté");
        await photo(r.page, `${f}-je-tente-ratee`);
        await r.page.click("#result-suite >> text=La carte");
        await pause(r.page, 300);
        await r.page.click('#carte-lignes [data-cle="A1-1"]');
        await pause(r.page, 300);
        assert.match(await texte(r.page, "#panneau-corps"), /Tu as déjà tenté aujourd’hui\. Tu pourras retenter demain\./);
        await photo(r.page, `${f}-panneau-deja-tente`);
        assert.deepEqual(r.erreurs, []);
        await r.ctx.close();
      });

      await cas(`${f} : Mes calculs du jour (Léa) — deux faux, l'étoile part ; le bilan`, async () => {
        const s = await ouvrir(nav, base, Object.assign({parcours: lea}, o));
        await s.page.click("#acc-commencer");
        await pause(s.page, 2500);
        assert.equal(await T(s.page, "genre"), "jour");
        await tient(s.page, largeur, hauteur, "Mes calculs du jour");
        let n = 0;
        while (await enJeu(s.page) && n < 40) { await repondre(s.page, n >= 2); n += 1; }
        await pause(s.page, 500);
        const bilan = await texte(s.page, "#result");
        assert.match(bilan, /Tes calculs du jour sont faits\.|Mes calculs du jour/);
        assert.match(bilan, /Deux calculs faux : l’étoile est partie\. Tu peux la regagner quand tu veux\./);
        assert.match(bilan, /Je tente/);
        await tient(s.page, largeur, hauteur, "bilan de Mes calculs du jour");
        await photo(s.page, `${f}-bilan-du-jour`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      });

      await cas(`${f} : « Tente toute la ceinture » réussi — l'écran de la ceinture, puis la carte du CM1`, async () => {
        const s = await ouvrir(nav, base, Object.assign({parcours: neuf}, o));
        await s.page.click("#acc-porte");
        await pause(s.page, 300);
        await s.page.click("#carte-tente-bouton");
        await pause(s.page, 800);
        assert.equal(await T(s.page, "genre"), "ceinture");
        await tient(s.page, largeur, hauteur, "toute la ceinture");
        for (let k = 0; k < 13 && await enJeu(s.page); k += 1) await repondre(s.page, true);
        await pause(s.page, 600);
        assert.match(await texte(s.page, "#result-ceinture"), /^Toutes les étoiles sont gagnées Ceinture jaune ! Tu as gagné les 44 étoiles\. La ceinture orange s’ouvre\./i);
        await tient(s.page, largeur, hauteur, "l'écran de la ceinture");
        await photo(s.page, `${f}-ceinture`);
        await s.page.click("#ceinture-boutons >> text=Ceinture suivante");
        await pause(s.page, 400);
        assert.equal((await T(s.page, "carte")).courant, 2);
        await tient(s.page, largeur, hauteur, "carte du CM1");
        await photo(s.page, `${f}-carte-cm1`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      });

      await cas(`${f} : le professeur — « Ceinture jaune · CP · CE1 · CE2 », les trois boutons, rien d'enregistré`, async () => {
        const s = await ouvrir(nav, base, Object.assign({prof: true}, o));
        await s.page.click("#acc-porte");
        await pause(s.page, 300);
        assert.match(await texte(s.page, "#carte-porteur"), /CP · CE1 · CE2/);
        assert.equal(await s.page.evaluate(() => document.querySelectorAll("#carte-lignes .ck-case.fermee").length), 0, "toutes les étoiles ouvertes");
        await s.page.click('#carte-lignes [data-cle="A2-3"]');
        await pause(s.page, 300);
        const corps = await texte(s.page, "#panneau-corps");
        ["Je tente", "J’apprends", "Je m’entraîne encore"].forEach(b => assert.ok(corps.includes(b), b));
        await tient(s.page, largeur, hauteur, "panneau du professeur");
        await photo(s.page, `${f}-prof-panneau`);
        assert.equal(await s.page.evaluate(() => Object.keys(localStorage).filter(k => /defi-calcul/.test(k)).length), 0, "rien d'enregistré");
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      });

      await cas(`${f} : « Comment ça marche ? »`, async () => {
        const s = await ouvrir(nav, base, Object.assign({parcours: lea}, o));
        await s.page.click("#acc-notice-bouton");
        await pause(s.page, 300);
        assert.match(await texte(s.page, "#notice"), /Ma séance\. 10 minutes : d’abord mes calculs du jour, puis je gagne des étoiles sur la carte\./);
        await tient(s.page, largeur, hauteur, "Comment ça marche ?");
        await photo(s.page, `${f}-notice`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      });
    }
  }

  // Le chargement (repris de defi-calcul-accueil-ecrans.cjs, écartée au lot
  // K1) : le cadre attend le serveur, puis ne bouge plus ; entier, l'accueil
  // centré dans le cadre.
  for (const [largeur, hauteur, plein] of [[1366, 657, false], [1440, 900, false], [1366, 768, true]]) {
    await cas(`${largeur}x${hauteur}${plein ? "-plein" : ""} : le chargement — le cadre attend le serveur, puis ne bouge plus ; l'accueil centré`, async () => {
      const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, timezoneId: "Indian/Reunion", locale: "fr-FR"});
      const page = await ctx.newPage();
      await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
      const erreurs = [];
      page.on("pageerror", e => erreurs.push(e.message));
      await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), "7K3M9P");
      await page.route("https://suivi.mathsgo.re/**", async route => {
        const corps = JSON.parse(route.request().postData() || "{}");
        await new Promise(fini => setTimeout(fini, 300));
        const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(d)});
        if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: {}});
        if (corps.lire) return rendre({ok: true, existe: true, parcours: lea, revision: 1});
        return rendre({ok: true, revision: 2});
      });
      await page.goto(base + PAGE);
      await page.clock.runFor(100);
      await page.waitForTimeout(50);
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".shell")).visibility), "hidden", "le cadre attend le serveur");
      for (let i = 0; i < 40 && await page.evaluate(() => document.body.classList.contains("accueil-en-attente")); i += 1) { await page.clock.runFor(100); await page.waitForTimeout(40); }
      if (plein) { await page.click("[data-fullscreen-toggle]"); await pause(page, 400); }
      const releve = () => page.evaluate(() => JSON.stringify(["--echelle", ".panel", "#acc-ceinture", "#acc-commencer", "#acc-bas"].map(s => {
        if (s.startsWith("--")) return getComputedStyle(document.documentElement).getPropertyValue(s);
        const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)];
      })));
      const releves = [];
      for (let i = 0; i < 3; i += 1) { releves.push(await releve()); await pause(page, 700); }
      assert.equal(new Set(releves).size, 1, `rien ne bouge (${releves.join(" / ")})`);
      const m = await page.evaluate(() => {
        const b = s => document.querySelector(s).getBoundingClientRect();
        return {cadre: b(".panel").bottom, haut: b(".topbar").bottom, acc: [b(".acc").top, b(".acc").bottom], z: Number(getComputedStyle(document.documentElement).getPropertyValue("--echelle")) || 1};
      });
      assert.ok(m.cadre <= hauteur + 0.5, `cadre entier (${Math.round(m.cadre)} / ${hauteur})`);
      const dessus = (m.acc[0] - m.haut) / m.z, dessous = (m.cadre - m.acc[1]) / m.z;
      assert.ok(Math.abs(dessus - dessous) < 30, `centré (${Math.round(dessus)} au-dessus, ${Math.round(dessous)} au-dessous)`);
      assert.deepEqual(erreurs, []);
      await ctx.close();
    });
  }

  // Une séance entière (un format suffit : les écrans sont ceux des cas
  // ci-dessus) : jusqu'à « Séance terminée », le temps compté.
  await cas("390x844 : une séance entière, jusqu'à « Séance terminée »", async () => {
    const [largeur, hauteur] = [390, 844];
    const s = await ouvrir(nav, base, {largeur, hauteur, parcours: neuf});
    await s.page.click("#acc-commencer");
    await pause(s.page, 2500);
    let tours = 0;
    while (tours < 120) {
      tours += 1;
      if (await enJeu(s.page)) { await repondre(s.page, true); continue; }
      if (await s.page.isVisible("#carte-panneau")) { await s.page.click("#panneau-corps button.primary"); await pause(s.page, 800); continue; }
      if (await s.page.isVisible("#carte-continuer")) { await s.page.click("#carte-continuer"); await pause(s.page, 800); continue; }
      if (await s.page.isVisible("#ceinture-boutons button")) { await s.page.click("#ceinture-boutons button"); await pause(s.page, 800); continue; }
      if (await texte(s.page, "#result-title") === "Séance terminée") break;
      const bouton = await s.page.$("#result-suite .ck-continuer:visible, #result-suite button.primary:visible");
      if (!bouton) break;
      // Une minute de jeu entre deux étapes (une touche : le temps est actif).
      await s.page.keyboard.press("Shift"); await pause(s.page, 59000); await s.page.keyboard.press("Shift");
      await bouton.click(); await pause(s.page, 800);
    }
    const fin = await texte(s.page, "#result");
    assert.match(fin, /^Séance terminée/);
    assert.match(fin, /Encore une séance/);
    assert.match(fin, /À demain/);
    assert.doesNotMatch(fin, /lun|mar|mer|jeu|ven/i, "pas de ligne des jours (décision du 25/11)");
    await tient(s.page, largeur, hauteur, "Séance terminée");
    await photo(s.page, "390x844-fin-de-seance");
    const p = await T(s.page, "parcours");
    assert.ok(p.journal && p.journal.minutes && p.journal.minutes.some(m => m >= 10), "le journal a ses minutes");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
