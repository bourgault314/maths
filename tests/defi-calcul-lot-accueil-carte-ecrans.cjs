// Défi calcul, lot « l'accueil, c'est la carte » (28/11/2026, demande de
// Gwenaël ; choix A aux quatre questions, puis sa retouche du même jour :
// « 10 minutes » dans le bouton, « Comment ça marche ? » devient le « ? » de
// la ligne de la ceinture). La VRAIE page, au navigateur, avec un faux
// serveur de suivi, aux cinq formats (390 × 664, 390 × 844, 1366 × 657,
// 1366 × 768 en plein écran, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-accueil-carte-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-accueil-carte-ecrans.cjs
// Un format : FORMATS=1366x657 node tests/defi-calcul-lot-accueil-carte-ecrans.cjs
//
// Les écrans NEUFS du lot (règle du 15/11 : les anciens ne se revérifient
// pas), chacun : rien ne sort sur le côté ; à l'ordinateur, le cadre tient
// entier dans l'écran.
//   arrivée     élève à code neuf, élève en avance (CP, CE1, CE2 gagnés,
//               10 calculs du jour dus), visiteur, professeur : on arrive sur
//               la carte, sur l'étage de « Commencer » ; « Commencer ·
//               10 minutes » ; le but du jour ; le « ? » au bout de la ligne
//               de la ceinture ; la ligne de liens pour le visiteur seulement ;
//   attente     le serveur répond tard : rien ne se voit, puis la carte paraît
//               sur l'étage de l'élève (pas sur le CP) ;
//   onglets     à l'ordinateur, d'un onglet à l'autre : la même largeur de
//               cadre, « Commencer » et le « ? » à la même place, le nom de la
//               ceinture sur une ligne ; les onglets (390 px au lieu de 432)
//               gardent chaque compte entier, sur une ligne ;
//   ? et retour le « ? » ouvre « Comment ça marche ? » ; « ← La carte » ramène
//               à la carte, sur l'étage de « Commencer » ;
//   séance      « Commencer » lance la séance ; le retour dit « La carte » et y
//               ramène ; le bouton dit alors « Continuer » (séance ouverte) ;
//               le retour du navigateur ramène aussi à la carte.

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
const JOUR = "2026-11-27";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = process.env.FORMATS ? process.env.FORMATS.split(",").map(x => x.split("x").map(Number)) : [[390, 664], [390, 844], [1366, 657], [1366, 768], [1920, 1080]];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp", ".json": "application/json"};
const NBSP = " ";

// ------------------------------------------------------------------ les progressions, jouées par le moteur
const A = d => P.ajouterJours(JOUR, d);
const SIX = Array.from({length: 6}, () => ({juste: true, ms: 1500}));
function gagnerParContinuer(p, jour, combien) {
  for (let i = 0; i < combien; i += 1) {
    const c = P.etatSeance(p, CARTE, {aujourdhui: jour}).continuer;
    if (c.type === "paquet") {
      P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}).forEach(x => { p = P.appliquerRetour(p, {module: x.module, niveau: x.niveau, juste: true, ms: 2000}, {aujourdhui: jour, carte: CARTE}).parcours; });
      p = P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
      i -= 1;
      continue;
    }
    if (c.type !== "etoile") break;
    p = P.appliquerTentative(p, {module: c.module, niveau: c.niveau, reponses: SIX}, {aujourdhui: jour, carte: CARTE}).parcours;
  }
  return p;
}
// En avance : 75 étoiles gagnées il y a 9 jours (les bases, et la suite),
// 8 il y a 7 jours — des calculs du jour dus aujourd'hui.
const EN_AVANCE = gagnerParContinuer(gagnerParContinuer(P.creerParcours(), A(-9), 75), A(-7), 8);
const COURANT_AVANCE = P.carteEleve(EN_AVANCE, CARTE, {aujourdhui: JOUR}).courant;
const S_AVANCE = P.etatSeance(EN_AVANCE, CARTE, {aujourdhui: JOUR});

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

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(60); };
const espaces = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText : null; }, s).then(espaces);
const visible = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return Boolean(e && e.getClientRects().length && !e.closest("[hidden]")); }, s);

async function ouvrir(nav, base, {largeur, hauteur, parcours = null, code = true, prof = false, plein = false, retard = 0}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erreurs.push(m.text()); });
  if (code) await page.addInitScript(c => sessionStorage.setItem("mathsgo-suivi-code", c), "7K3M9P");
  let lacher = null;
  const attente = retard ? new Promise(r => { lacher = r; }) : null;
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: {}});
    if (corps.lire) {
      if (attente) await attente;
      return rendre(parcours ? {ok: true, existe: true, parcours, revision: 1} : {ok: true, existe: false});
    }
    return rendre({ok: true, revision: 2});
  });
  await page.goto(base + PAGE + (prof ? "&prof=1" : ""));
  if (!retard) {
    for (let i = 0; i < 40; i += 1) {
      await page.clock.runFor(100);
      await page.waitForTimeout(25);
      if (await page.evaluate(() => !document.body.classList.contains("accueil-en-attente"))) break;
    }
    if (plein) { await page.click("[data-fullscreen-toggle]"); await pause(page, 400); }
    await pause(page, 200);
  }
  return {page, ctx, erreurs, lacher};
}

async function photo(page, n) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.waitForTimeout(500);
  await page.screenshot({path: path.join(SORTIE, `${n}.png`)});
}

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

// Ce que montre la carte d'arrivée.
const arrivee = page => page.evaluate(() => {
  const $ = id => document.getElementById(id);
  const r = e => e.getBoundingClientRect();
  const ici = document.querySelector("#carte-etages .ck-onglet.ici");
  const aide = $("acc-notice-bouton"), porteur = $("carte-porteur"), nom = porteur.querySelector(".txt b");
  const lignesNom = nom ? (() => { const g = document.createRange(); g.selectNodeContents(nom); return new Set([...g.getClientRects()].map(x => Math.round(x.top))).size; })() : 0;
  return {
    intro: Boolean($("intro")),
    carte: !$("ecran-carte").hidden,
    onglet: [...document.querySelectorAll("#carte-etages .ck-onglet")].indexOf(ici) + 1,
    bouton: $("carte-continuer").firstChild.textContent,
    but: $("acc-but").hidden ? null : $("acc-but-texte").textContent,
    pied: !$("acc-pied").hidden,
    effacer: !$("acc-effacer").hidden, prof: !$("acc-prof").hidden, pilule: !$("prof-pilule").hidden,
    aideDansPorteur: aide.parentElement === porteur,
    aideCentre: Math.abs((r(aide).top + r(aide).bottom) / 2 - (r(porteur).top + r(porteur).bottom) / 2),
    aideDroite: r(porteur).right - r(aide).right,
    lignesNom,
    sortie: (document.getElementById("lien-retour") || {}).textContent || ""
  };
});

let echecs = 0;
async function cas(n, f) {
  try { await f(); console.log(`  ✓ ${n}`); }
  catch (e) { echecs += 1; console.log(`  ✗ ${n}\n      ${String(e && e.message || e).split("\n").join("\n      ")}`); }
}

(async () => {
  assert.ok(COURANT_AVANCE > 1, "l'élève en avance n'est pas au CP");
  assert.ok(S_AVANCE.obligatoire > 0, "l'élève en avance a des calculs du jour");
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"]} : {});

  for (const [largeur, hauteur] of FORMATS) {
    const f = `${largeur}x${hauteur}`;
    const ordi = largeur > 620;
    const plein = largeur === 1366 && hauteur === 768;

    await cas(`${f} : l'arrivée — élève neuf, élève en avance, visiteur, professeur`, async () => {
      for (const [nom, o] of [["neuf", {}], ["avance", {parcours: EN_AVANCE}], ["visiteur", {code: false}], ["prof", {code: false, prof: true}]]) {
        const s = await ouvrir(nav, base, {largeur, hauteur, plein, ...o});
        const a = await arrivee(s.page);
        assert.equal(a.intro, false, `${nom} : plus d'écran d'accueil`);
        assert.equal(a.carte, true, `${nom} : on arrive sur la carte`);
        assert.equal(a.onglet, nom === "avance" ? COURANT_AVANCE : 1, `${nom} : l'étage de « Commencer »`);
        assert.equal(a.bouton, `Commencer · 10${NBSP}minutes`, `${nom} : le bouton`);
        assert.ok(a.but && espaces(a.but).startsWith("Aujourd’hui : la ligne"), `${nom} : le but du jour (${a.but})`);
        assert.ok(a.aideDansPorteur && a.aideCentre < 2 && a.aideDroite < 4, `${nom} : le « ? » au bout de la ligne de la ceinture`);
        if (ordi && nom !== "prof") assert.equal(a.lignesNom, 1, `${nom} : le nom de la ceinture sur une ligne`);
        assert.equal(a.pied, nom === "visiteur", `${nom} : la ligne de liens pour le visiteur seulement`);
        assert.equal(a.prof, nom === "visiteur", `${nom} : « Mode professeur »`);
        assert.equal(a.pilule, nom === "prof", `${nom} : la pilule du professeur`);
        assert.equal(a.effacer, false, `${nom} : rien à effacer sur un appareil vide`);
        if (nom === "avance") assert.equal(await texte(s.page, "#carte-continuer small"), `Avant : tes ${S_AVANCE.obligatoire} calculs du jour.`);
        await tient(s.page, largeur, hauteur, `arrivée ${nom}`);
        await photo(s.page, `${f}-01-arrivee-${nom}`);
        assert.deepEqual(s.erreurs, [], nom);
        await s.ctx.close();
      }
    });

    await cas(`${f} : le serveur répond tard — rien ne se voit, puis la carte paraît sur l'étage de l'élève`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: EN_AVANCE, retard: 1});
      await s.page.clock.runFor(300);
      await s.page.waitForTimeout(60);
      const cache = await s.page.evaluate(() => getComputedStyle(document.querySelector(".shell")).visibility);
      assert.equal(cache, "hidden", "le cadre attend");
      s.lacher();
      for (let i = 0; i < 30; i += 1) {
        await s.page.clock.runFor(100);
        await s.page.waitForTimeout(25);
        if (await s.page.evaluate(() => !document.body.classList.contains("accueil-en-attente"))) break;
      }
      await pause(s.page, 300);
      const a = await arrivee(s.page);
      assert.equal(a.onglet, COURANT_AVANCE, "l'étage de l'élève, pas le CP");
      assert.equal(await s.page.evaluate(() => getComputedStyle(document.querySelector(".shell")).visibility), "visible");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    if (ordi) {
      await cas(`${f} : d'un onglet à l'autre, le cadre, « Commencer » et le « ? » ne bougent pas`, async () => {
        const s = await ouvrir(nav, base, {largeur, hauteur, plein, parcours: EN_AVANCE});
        const n = await s.page.evaluate(() => document.querySelectorAll("#carte-etages .ck-onglet").length);
        const liste = [];
        for (let i = 0; i < n; i += 1) {
          await s.page.click(`#carte-etages .ck-onglet:nth-child(${i + 1})`);
          await pause(s.page, 300);
          liste.push(await s.page.evaluate(() => {
            const r = id => document.getElementById(id).getBoundingClientRect();
            return {largeur: Math.round(document.querySelector(".shell").getBoundingClientRect().width * 10) / 10,
              bouton: Math.round(r("carte-continuer").top * 10) / 10, aide: Math.round(r("acc-notice-bouton").left * 10) / 10 + "," + Math.round(r("acc-notice-bouton").top * 10) / 10};
          }));
          assert.equal((await arrivee(s.page)).lignesNom, 1, `onglet ${i + 1} : le nom de la ceinture sur une ligne`);
          // (Les onglets passent de 432 à 390 px : chaque compte reste dans son onglet, sur une ligne.)
          const dansLesOnglets = await s.page.evaluate(() => [...document.querySelectorAll("#carte-etages .ck-onglet")].every(o => { const r = o.getBoundingClientRect(); const m = o.querySelector("span").getBoundingClientRect(); return m.left >= r.left && m.right <= r.right && o.querySelector("span").getClientRects().length === 1; }));
          assert.ok(dansLesOnglets, `onglet ${i + 1} : chaque compte dans son onglet, sur une ligne`);
          await tient(s.page, largeur, hauteur, `onglet ${i + 1}`);
        }
        const de = k => liste.map(x => x[k]);
        assert.ok(Math.max(...de("largeur")) - Math.min(...de("largeur")) <= 1, `la même largeur (${de("largeur").join(", ")})`);
        assert.ok(Math.max(...de("bouton")) - Math.min(...de("bouton")) <= 1, `« Commencer » à la même place (${de("bouton").join(", ")})`);
        assert.equal(new Set(de("aide")).size, 1, `le « ? » à la même place (${de("aide").join(" ; ")})`);
        await photo(s.page, `${f}-02-dernier-onglet`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      });
    }

    await cas(`${f} : le « ? » ouvre « Comment ça marche ? » ; « ← La carte » ramène à la carte, sur l'étage de « Commencer »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, plein, parcours: EN_AVANCE});
      await s.page.click("#carte-etages .ck-onglet:nth-child(1)");
      await pause(s.page, 300);
      await s.page.click("#acc-notice-bouton");
      await pause(s.page, 400);
      assert.equal(await visible(s.page, "#notice"), true);
      assert.equal(await s.page.evaluate(() => document.querySelector("#notice-back .settings-back-label").textContent), "La carte");
      await tient(s.page, largeur, hauteur, "Comment ça marche ?");
      await photo(s.page, `${f}-03-notice`);
      await s.page.click("#notice-back");
      await pause(s.page, 400);
      const a = await arrivee(s.page);
      assert.equal(a.carte, true);
      assert.equal(a.onglet, COURANT_AVANCE, "revenu sur l'étage de « Commencer »");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : la séance — « ← La carte » y ramène, le bouton dit « Continuer » ; le retour du navigateur aussi`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, plein});
      await s.page.click("#carte-continuer");
      await pause(s.page, 1500);
      assert.equal(await visible(s.page, "#play"), true, "la séance commence");
      assert.equal(await s.page.evaluate(() => document.querySelector("#game-menu .game-menu-label").textContent), "La carte");
      assert.equal(await s.page.getAttribute("#game-menu", "aria-label"), "Arrêter et revenir à la carte");
      await photo(s.page, `${f}-04-seance`);
      await s.page.click("#game-menu");
      await pause(s.page, 500);
      let a = await arrivee(s.page);
      assert.equal(a.carte, true, "revenu sur la carte");
      assert.equal(a.bouton, "Continuer", "séance ouverte : « Continuer », sans la durée");
      await tient(s.page, largeur, hauteur, "carte, séance ouverte");
      await photo(s.page, `${f}-05-carte-seance-ouverte`);
      await s.page.click("#carte-continuer");
      await pause(s.page, 1200);
      assert.equal(await visible(s.page, "#play"), true, "« Continuer » reprend la séance");
      await s.page.goBack();
      await pause(s.page, 600);
      a = await arrivee(s.page);
      assert.equal(a.carte, true, "le retour du navigateur ramène à la carte");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `\n${echecs} cas en échec.` : "\nTout est bon.");
  process.exitCode = echecs ? 1 : 0;
})();
