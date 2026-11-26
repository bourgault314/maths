// Défi calcul, lot K1 — le correctif de la relecture de Codex du 26/11/2026 :
// les scénarios de la PAGE (points 10 à 14 du rapport) et de MON ESPACE
// (point 15), joués dans un vrai navigateur. Le moteur a son fichier
// (defi-calcul-lot-K1-correctif.test.mjs), le serveur le sien
// (_serveur/tests/lancer.php, « defi-calcul lot K1, correctif »).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-K1-correctif-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-K1-correctif-ecrans.cjs
// Sans PHP sur le poste, le trajet de Mon espace est sauté (et dit).
//
//   10  deux appareils répondent faux au MÊME premier calcul : la 2e
//       réponse ne compte pas, l'étoile reste, et c'est un AUTRE calcul qui
//       est posé ensuite ; la page rechargée entre les deux, aussi ;
//   11  un autre onglet, mis à jour, a écrit une progression plus récente :
//       « Effacer mon historique » n'y touche pas, l'envoi différé ne part
//       pas, les repères de synchronisation ne sont pas réécrits ;
//   12  le temps est rangé AVEC chaque réponse de Mes calculs du jour ;
//   13  la page rouverte ne renvoie pas ce que le serveur a déjà ; un 409
//       qui n'apporte rien n'est pas suivi d'un renvoi ;
//   14  l'étoile partie dans un paquet qui finit la séance garde « Je
//       tente » · « J'apprends » (planche K1-4) ; ils ouvrent une séance ;
//    7  à 9 minutes, après un « Je tente » raté, « Continuer » propose une
//       étoile qui tient encore (un autre « Je tente »), et la lance ;
//   15  Mon espace, avec le VRAI serveur PHP (serveur intégré, base de test,
//       vrai filtre) : la ceinture blanche-jaune remplie d'un quart, « ↑ +4
//       étoiles cette semaine » ; la semaine suivante, « 4 étoiles sur 14 »
//       (lot K1b : six étages ; avant, la ceinture jaune et 17 sur 44).

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const playwright = require("playwright");

// (RACINE=<autre arbre> : rejouer les mêmes scénarios sur la page d'avant le correctif.)
const RACINE = process.env.RACINE ? path.resolve(process.env.RACINE) : path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CARTE = CORE.carte();
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-25"; // un mercredi
const CODE = "7K3M9P";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const SEULS = process.env.CAS ? process.env.CAS.split(",") : null;
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp", ".json": "application/json"};

const SIX = Array.from({length: 6}, () => ({juste: true, ms: 2000}));
function gagner(p, cles, jour) {
  for (const k of cles) {
    const [m, n] = k.split("-");
    const r = P.appliquerTentative(p, {module: m, niveau: Number(n), reponses: SIX}, {aujourdhui: jour, carte: CARTE});
    if (!r.refuse) p = r.parcours;
  }
  return p;
}
// Léa : 17 étoiles des bases gagnées hier (mardi) ; elles reviennent aujourd'hui.
const lea = () => gagner(P.creerParcours(), CARTE.ordre.slice(0, 17), P.ajouterJours(JOUR, -1));
// (Lot K1b : pour Mon espace, 4 étoiles du CP — la ceinture blanche-jaune remplie d'un quart.)
const leaCP = () => gagner(P.creerParcours(), CARTE.ordre.slice(0, 4), P.ajouterJours(JOUR, -1));

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
const espaces = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText : null; }, s).then(espaces);
const T = (page, nom) => page.evaluate(n => window.__MATHSGO_DEFI_CALCUL_TEST__[n](), nom);

// Une page ouverte. `serveur` : le faux serveur de suivi de CETTE page —
// {parcours, revision} ce qu'il garde ; `ecrire(corps, s)` peut répondre
// autre chose qu'un 200 ({statut, donnees}). `s.ecrits` : les parcours reçus.
async function ouvrir(nav, base, {largeur = 390, hauteur = 844, code = CODE, serveur = null, avant = null, contexte = null} = {}) {
  const ctx = contexte || await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erreurs.push(m.text()); });
  const s = Object.assign({parcours: null, revision: 0, ecrits: [], lectures: 0, ecrire: null}, serveur || {});
  if (code) await page.addInitScript(c => sessionStorage.setItem("mathsgo-suivi-code", c), code);
  if (avant) await page.addInitScript(avant.script, avant.donnee);
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const rendre = (d, statut = 200) => route.fulfill({status: statut, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: {}});
    if (corps.lire) { s.lectures += 1; return rendre(s.parcours ? {ok: true, existe: true, parcours: s.parcours, revision: s.revision} : {ok: true, existe: false}); }
    s.ecrits.push(corps.parcours);
    const autre = s.ecrire ? await s.ecrire(corps, s, page) : null;
    if (autre) return rendre(autre.donnees, autre.statut);
    s.parcours = corps.parcours;
    s.revision += 1;
    return rendre({ok: true, revision: s.revision});
  });
  await page.goto(base + PAGE);
  for (let i = 0; i < 40; i += 1) {
    await page.clock.runFor(100);
    await page.waitForTimeout(25);
    if (await page.evaluate(() => !document.body.classList.contains("accueil-en-attente"))) break;
  }
  await pause(page, 200);
  return {page, ctx, erreurs, serveur: s};
}

// Répondre au calcul affiché, juste ou faux ; `attente` secondes de travail
// avant (le temps actif de la séance). Rend le calcul auquel on a répondu.
async function repondre(page, juste, attente = 0) {
  for (let k = 0; k < 4; k += 1) {
    const e = await page.evaluate(() => { const t = window.__MATHSGO_DEFI_CALCUL_TEST__; return {calcul: t.calcul(), exemple: t.exempleAffiche ? t.exempleAffiche() : null, jeu: !document.getElementById("play").hidden}; });
    if (!e.jeu || !e.calcul) return null;
    if (e.exemple && e.exemple.exemple) { await page.click("#validate"); await pause(page, 400); continue; }
    if (attente) await page.clock.runFor(attente * 1000);
    const rep = juste ? CORE.reponseEcrite(e.calcul) : "99999";
    if (rep.includes("/")) {
      const [num, den] = rep.split("/");
      await page.keyboard.type(num); await page.keyboard.press("/"); await page.keyboard.type(den);
    } else await page.keyboard.type(rep);
    await page.keyboard.press("Enter");
    await pause(page, 1600);
    const faux = await page.evaluate(() => !document.getElementById("play").hidden && document.getElementById("answer-feedback").classList.contains("is-wrong"));
    if (faux) { await page.keyboard.press("Enter"); await pause(page, 600); }
    return e.calcul;
  }
  return null;
}
const enJeu = page => page.evaluate(() => !document.getElementById("play").hidden);
const boite = (parcours, c) => { const ligne = parcours.modules[c.module]; return ligne ? ligne.b[c.niveau - 1] : 0; };
async function photo(page, nom) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.waitForTimeout(700);
  await page.screenshot({path: path.join(SORTIE, `${nom}.png`)});
}
// Rien ne sort sur le côté ; à l'ordinateur, le cadre tient entier.
async function tient(page, largeur, hauteur, quoi) {
  const m = await page.evaluate(() => {
    const cadre = document.querySelector(".panel").getBoundingClientRect();
    const sortent = [...document.querySelectorAll(".panel *")].filter(e => {
      if (!e.getClientRects().length || e.closest("[hidden]")) return false;
      const st = getComputedStyle(e);
      if (st.position === "fixed" || st.visibility === "hidden") return false;
      const b = e.getBoundingClientRect();
      return b.width > 0 && (b.left < -0.5 || b.right > innerWidth + 0.5);
    }).map(e => e.id || e.className || e.tagName).slice(0, 4);
    return {large: document.documentElement.scrollWidth <= innerWidth, bas: cadre.bottom, sortent};
  });
  assert.equal(m.large, true, `${quoi} : pas de défilement de côté`);
  assert.deepEqual(m.sortent, [], `${quoi} : rien ne sort de l'écran`);
  if (largeur > 620) assert.ok(m.bas <= hauteur + 0.5, `${quoi} : le cadre tient entier (${Math.round(m.bas)} / ${hauteur})`);
}

// ------------------------------------------------- le vrai serveur de suivi (PHP)
function phpPresent() {
  try { return childProcess.spawnSync("php", ["-v"], {encoding: "utf8"}).status === 0; } catch (_) { return false; }
}
async function monterSuivi() {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), "suivi-k1-"));
  fs.cpSync(path.join(RACINE, "_serveur/public"), dossier, {recursive: true});
  const base = path.join(dossier, "test.sqlite").replace(/\\/g, "/");
  fs.writeFileSync(path.join(dossier, "config.php"), `<?php return ['bd' => ['dsn' => 'sqlite:${base}'], 'origines' => ['https://mathsgo.re'], 'jeton_installation' => 'JETON-DE-TEST', 'records_depuis' => '2026-01-01T00:00:00.000000Z'];\n`);
  const port = 8100 + Math.floor(Math.random() * 800);
  const php = childProcess.spawn("php", ["-S", `127.0.0.1:${port}`, "-t", dossier], {stdio: "ignore"});
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i += 1) {
    try { await fetch(url + "/api/eleve.php", {method: "POST", body: "{}"}); break; } catch (_) { await new Promise(f => setTimeout(f, 150)); }
  }
  const api = async (chemin, corps, jeton) => {
    const r = await fetch(url + chemin, {method: "POST", headers: Object.assign({"Content-Type": "application/json"}, jeton ? {Authorization: `Bearer ${jeton}`} : {}), body: JSON.stringify(corps)});
    return {statut: r.status, json: await r.json().catch(() => null)};
  };
  const installe = await fetch(url + "/installer.php", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({jeton: "JETON-DE-TEST", identifiant: "gwenael", motdepasse: "motdepasse-de-test-2026"})});
  assert.match(await installe.text(), /Compte créé/, "le serveur de test s'installe");
  const jeton = (await api("/api/prof.php", {action: "connexion", identifiant: "gwenael", motdepasse: "motdepasse-de-test-2026"})).json.jeton;
  const classe = (await api("/api/prof.php", {action: "classes.creer", libelle: "405", applis: ["defi-calcul"]}, jeton)).json.id;
  const code = (await api("/api/prof.php", {action: "eleves.ajouter", classe_id: classe, nombre: 1}, jeton)).json.eleves[0].code;
  return {url, api, code, fermer: () => { try { php.kill("SIGKILL"); } catch (_) {} try { fs.rmSync(dossier, {recursive: true, force: true}); } catch (_) {} }};
}

// ------------------------------------------------------------------ les cas
let echecs = 0;
async function cas(nom, f) {
  if (SEULS && !SEULS.some(c => nom.startsWith(c))) return;
  try { await f(); console.log(`  ✓ ${nom}`); }
  catch (e) { echecs += 1; console.log(`  ✗ ${nom}\n      ${String(e && e.message || e).split("\n").join("\n      ")}`); }
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});

  await cas("10. deux appareils, le même premier calcul : la 2e réponse fausse ne fait pas partir l'étoile ; le calcul suivant en est un autre", async () => {
    let premier = null;
    const s = await ouvrir(nav, base, {serveur: {parcours: lea(), revision: 1,
      // Le premier envoi de la page rencontre l'AUTRE appareil : il a déjà répondu faux au calcul affiché ici.
      ecrire: async (corps, etat, page) => {
        if (premier) return null;
        premier = await T(page, "calcul");
        if (!premier) return null;
        const ailleurs = P.appliquerRetour(corps.parcours, {module: premier.module, niveau: premier.niveau, juste: false, ms: 1500, type: "P"}, {aujourdhui: JOUR, carte: CARTE});
        assert.equal(ailleurs.mouvement.secondAVenir, true);
        etat.parcours = ailleurs.parcours;
        etat.revision = 5;
        return {statut: 409, donnees: {ok: false, conflit: true, parcours: etat.parcours, revision: 5}};
      }}});
    await s.page.click("#acc-commencer");
    for (let i = 0; i < 30 && !premier; i += 1) await pause(s.page, 200);
    await pause(s.page, 1500);
    assert.ok(premier, "le premier calcul de Mes calculs du jour est à l'écran, et l'état de l'autre appareil est arrivé");
    assert.equal(await T(s.page, "genre"), "jour");
    const affiche = await T(s.page, "calcul");
    assert.deepEqual([affiche.module, affiche.niveau, affiche.texte], [premier.module, premier.niveau, premier.texte], "c'est toujours ce premier calcul qui est à l'écran");
    const avant = boite(await T(s.page, "parcours"), premier);
    assert.ok(avant > 0);
    // L'élève répond faux ici aussi, à ce même premier calcul.
    await repondre(s.page, false);
    let p = await T(s.page, "parcours");
    assert.equal(boite(p, premier), avant, "l'étoile est toujours là : cette réponse au premier calcul ne compte pas pour un 2e faux");
    assert.equal(p.modules[premier.module].pe[premier.niveau - 1], 0);
    // Un 2e calcul est posé, sur la même étoile, et ce n'est pas le même.
    const second = await T(s.page, "calcul");
    assert.deepEqual([second.module, second.niveau], [premier.module, premier.niveau], "le 2e calcul de la même étoile vient ensuite");
    assert.notEqual(second.texte, premier.texte, "un autre calcul que le premier");
    // Faux encore, au 2e calcul cette fois : l'étoile part, comme prévu.
    await repondre(s.page, false);
    p = await T(s.page, "parcours");
    assert.deepEqual([boite(p, premier), p.modules[premier.module].pe[premier.niveau - 1]], [0, 1], "deux calculs faux, le premier et le 2e : l'étoile part");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await cas("10. la page rechargée entre le premier calcul faux et le 2e : le 2e calcul est un AUTRE calcul", async () => {
    // Sur 6 étoiles de suite : le premier calcul, faux ; la page est rechargée ; le calcul reposé n'est jamais le même.
    for (let essai = 0; essai < 6; essai += 1) {
      const etat = {parcours: gagner(P.creerParcours(), CARTE.ordre.slice(essai, essai + 1), P.ajouterJours(JOUR, -1)), revision: 1};
      const s = await ouvrir(nav, base, {serveur: etat});
      await s.page.click("#acc-commencer");
      await pause(s.page, 2600);
      const premier = await repondre(s.page, false);
      assert.ok(premier, "un premier calcul");
      await pause(s.page, 1500);
      // (Le faux serveur a reçu la progression : le 2e calcul attend.)
      const t = await ouvrir(nav, base, {serveur: {parcours: s.serveur.parcours, revision: s.serveur.revision}, contexte: s.ctx});
      await t.page.click("#acc-commencer");
      await pause(t.page, 2600);
      const second = await T(t.page, "calcul");
      assert.ok(second, `${CARTE.ordre[essai]} : le 2e calcul est reposé`);
      assert.deepEqual([second.module, second.niveau], [premier.module, premier.niveau]);
      assert.notEqual(second.texte, premier.texte, `${CARTE.ordre[essai]} : pas le calcul déjà raté (${premier.texte})`);
      assert.deepEqual([...s.erreurs, ...t.erreurs], []);
      await s.ctx.close();
    }
  });

  await cas("11. un autre onglet a écrit une progression plus récente : « Effacer mon historique » n'y touche pas", async () => {
    // Un visiteur sans code, avec un historique sur l'appareil.
    const s = await ouvrir(nav, base, {code: "", avant: {script: d => { if (!localStorage.getItem("mathsgo-defi-calcul-parcours")) localStorage.setItem("mathsgo-defi-calcul-parcours", d); }, donnee: JSON.stringify(lea())}});
    assert.ok(await s.page.isVisible("#acc-effacer"), "« Effacer mon historique » est proposé au visiteur");
    await s.page.click("#acc-effacer");
    await pause(s.page, 200);
    assert.ok(await s.page.isVisible("#acc-confirm-oui"));
    // Pendant que la question est posée, un autre onglet (mis à jour) écrit la version d'après.
    // (Lot K1b : la page est en version 13 ; « plus récente » se calcule, P.VERSION + 1.)
    const recente = JSON.stringify({version: P.VERSION + 1, epoque: 0, modules: {A1: {b: [7, 7, 7]}}, futur: "ce que cette page ne sait pas lire"});
    await s.page.evaluate(d => localStorage.setItem("mathsgo-defi-calcul-parcours", d), recente);
    await s.page.click("#acc-confirm-oui");
    await pause(s.page, 300);
    assert.equal(await s.page.evaluate(() => localStorage.getItem("mathsgo-defi-calcul-parcours")), recente, "la progression plus récente est intacte, octet pour octet");
    assert.equal(await texte(s.page, "#suivi-repere"), "Page ancienne : recharge la page.");
    assert.equal(await s.page.isVisible("#acc-confirm-oui"), false, "la question se referme");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await cas("11. un autre onglet a écrit une progression plus récente : l'envoi différé ne part pas, les repères de synchronisation ne sont pas réécrits", async () => {
    const s = await ouvrir(nav, base, {serveur: {parcours: lea(), revision: 3}});
    const cles = () => s.page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("mathsgo-defi-calcul-")).map(k => [k, localStorage.getItem(k)]));
    const caseDuCode = (await cles()).find(([k]) => k.startsWith("mathsgo-defi-calcul-parcours:"));
    assert.ok(caseDuCode, "la case du code est sur l'appareil");
    const ecritsAvant = s.serveur.ecrits.length;
    // Un geste qui range la progression et programme un envoi (700 ms plus tard) : ouvrir la séance.
    await s.page.click("#acc-porte");
    await pause(s.page, 300);
    await s.page.evaluate(() => document.querySelector("#carte-lignes .ck-case.aGagner").click());
    await pause(s.page, 200);
    await s.page.evaluate(() => [...document.querySelectorAll("#panneau-corps button")].find(b => /Commencer|Je tente/.test(b.textContent)).click());
    await s.page.waitForTimeout(150);
    // Avant que l'envoi parte, un autre onglet écrit la version d'après dans la même case.
    const recente = JSON.stringify({version: P.VERSION + 1, epoque: 0, modules: {}, futur: 1});
    await s.page.evaluate(([k, d]) => localStorage.setItem(k, d), [caseDuCode[0], recente]);
    const reperes = (await cles()).filter(([k]) => k.startsWith("mathsgo-defi-calcul-sync"));
    await pause(s.page, 3500);
    assert.equal(s.serveur.ecrits.length, ecritsAvant, "rien n'est parti au serveur après l'arrivée de la version d'après");
    assert.equal(await s.page.evaluate(k => localStorage.getItem(k), caseDuCode[0]), recente, "la case est intacte");
    assert.deepEqual((await cles()).filter(([k]) => k.startsWith("mathsgo-defi-calcul-sync")), reperes, "les repères de synchronisation n'ont pas été réécrits");
    assert.equal(await texte(s.page, "#suivi-repere"), "Page ancienne : recharge la page.");
    await s.ctx.close();
  });

  await cas("12. Mes calculs du jour : le temps part AVEC chaque réponse, pas seulement au bilan", async () => {
    const s = await ouvrir(nav, base, {serveur: {parcours: lea(), revision: 1}});
    await s.page.click("#acc-commencer");
    await pause(s.page, 2600);
    assert.equal(await T(s.page, "genre"), "jour");
    // Vingt secondes de réflexion, puis une réponse juste.
    const calcul = await repondre(s.page, true, 20);
    await pause(s.page, 1500);
    const p = await T(s.page, "parcours");
    // (Une réponse lente à un calcul « par cœur » ne fait pas monter la boîte : on regarde le retour compté.)
    assert.deepEqual([p.seance.j[0], p.seance.j[1]], [1, 1], "le retour est compté, juste");
    assert.ok(p.modules[calcul.module].e[calcul.niveau - 1] > JOUR, "l'étoile reviendra un autre jour");
    assert.ok(p.seance.j[4] >= 20, `le temps est déjà dans la séance (${p.seance.j[4]} s) : rangé avec la réponse`);
    const envoye = s.serveur.ecrits[s.serveur.ecrits.length - 1];
    assert.ok(envoye && envoye.seance.j[4] >= 20 && envoye.seance.j[0] === 1, "et le serveur reçoit le temps et la réponse ensemble");
    assert.ok(!("prenom" in envoye), "le paquet envoyé ne porte pas de prénom");
    assert.equal(envoye.seance.parts.length, 11, "une part : l'onglet qui joue");
    assert.ok(envoye.seance.parts[0] >= 1 && envoye.seance.parts[0] <= 9999, "sa source, un nombre de 1 à 9 999");
    assert.equal(await s.page.evaluate(() => sessionStorage.getItem("mathsgo-defi-calcul-source")), String(envoye.seance.parts[0]), "gardée dans l'onglet");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await cas("13. la page rouverte ne renvoie pas ce que le serveur a déjà (l'envoi de fermeture était arrivé)", async () => {
    // Première visite : la page range la progression du serveur. Puis elle croit avoir un envoi en attente (dirty).
    const s = await ouvrir(nav, base, {serveur: {parcours: lea(), revision: 3}});
    await s.page.evaluate(code => {
      const M = window.MATHSGO_DEFI_CALCUL_MON_PARCOURS;
      const sync = M.chargerSync(localStorage, code);
      M.sauverSync(localStorage, code, Object.assign({}, sync, {revision: 3, dirty: true, maj: Date.now()}));
    }, CODE);
    assert.equal(s.serveur.ecrits.length, 0);
    // Réouverture : le serveur a la même progression, à la révision 4 (l'envoi de fermeture, dont la réponse n'a pas été lue).
    const t = await ouvrir(nav, base, {serveur: {parcours: s.serveur.parcours, revision: 4}, contexte: s.ctx});
    await pause(t.page, 4000);
    assert.equal(t.serveur.lectures, 1, "la page a lu le serveur");
    assert.equal(t.serveur.ecrits.length, 0, "et n'a rien renvoyé : le serveur avait déjà tout");
    const sync = await t.page.evaluate(code => window.MATHSGO_DEFI_CALCUL_MON_PARCOURS.chargerSync(localStorage, code), CODE);
    assert.deepEqual([sync.revision, sync.dirty], [4, false], "plus rien n'attend, la révision du serveur est notée");
    assert.match(await texte(t.page, "#suivi-repere"), /^Suivi · Léa · 405/, "la ligne du haut : suivi, rien en attente");
    await s.ctx.close();
  });

  await cas("13. un 409 qui n'apporte rien n'est pas suivi d'un renvoi", async () => {
    let conflits = 0;
    const s = await ouvrir(nav, base, {serveur: {parcours: lea(), revision: 1,
      // Le serveur a DÉJÀ exactement ce que la page envoie (un autre onglet l'a écrit) : conflit, avec ce même état.
      ecrire: async (corps, etat) => {
        if (conflits) return null;
        conflits += 1;
        etat.parcours = corps.parcours;
        etat.revision = 9;
        return {statut: 409, donnees: {ok: false, conflit: true, parcours: corps.parcours, revision: 9}};
      }}});
    await s.page.click("#acc-commencer");
    await pause(s.page, 6000);
    assert.equal(conflits, 1, "le conflit a eu lieu");
    assert.equal(s.serveur.ecrits.length, 1, "un seul envoi : pas de renvoi après un conflit qui n'apporte rien");
    const sync = await s.page.evaluate(code => window.MATHSGO_DEFI_CALCUL_MON_PARCOURS.chargerSync(localStorage, code), CODE);
    assert.deepEqual([sync.revision, sync.dirty], [9, false]);
    // La réponse suivante part normalement, sur la révision reçue.
    await repondre(s.page, true);
    await pause(s.page, 1500);
    assert.equal(s.serveur.ecrits.length, 2);
    assert.equal(s.serveur.revision, 10);
    await s.ctx.close();
  });

  for (const [largeur, hauteur] of [[390, 844], [1366, 657]]) {
    const f = `${largeur}x${hauteur}`;
    await cas(`14. ${f} : l'étoile partie dans un paquet qui finit la séance garde « Je tente » · « J'apprends » ; ils ouvrent une séance`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, serveur: {parcours: lea(), revision: 1}});
      // Le premier paquet (10 étoiles), une demi-minute par calcul.
      await s.page.click("#acc-commencer");
      await pause(s.page, 2600);
      for (let i = 0; i < 12 && await enJeu(s.page) && await T(s.page, "genre") === "jour"; i += 1) await repondre(s.page, true, 30);
      await pause(s.page, 800);
      assert.match(await texte(s.page, "#result"), /10 justes sur 10/);
      // Une étape de la carte (« Je tente », raté) : la séance n'est plus à sa première étape.
      await s.page.evaluate(() => document.querySelector("#result-suite .ck-continuer").click());
      await pause(s.page, 800);
      assert.equal(await T(s.page, "genre"), "tente");
      await repondre(s.page, false);
      await repondre(s.page, false);
      await pause(s.page, 800);
      // La carte, puis « Mes calculs du jour — encore 7 » : une minute par calcul, le temps de la séance passe.
      await s.page.evaluate(() => [...document.querySelectorAll("#result-suite button")].find(b => /La carte/.test(b.textContent)).click());
      await pause(s.page, 500);
      assert.match(await texte(s.page, "#carte-jour"), /encore 7/);
      await s.page.click("#carte-jour");
      await pause(s.page, 800);
      assert.equal(await T(s.page, "genre"), "jour");
      // La première étoile : deux calculs faux, elle part. Les autres : justes.
      const perdue = await repondre(s.page, false, 60);
      await repondre(s.page, false, 60);
      for (let i = 0; i < 10 && await enJeu(s.page); i += 1) await repondre(s.page, true, 60);
      await pause(s.page, 1200);
      const p = await T(s.page, "parcours");
      assert.equal(boite(p, perdue), 0, "l'étoile est partie");
      assert.equal(P.seanceOuverte(p, JOUR), false, "le paquet a fini la séance (le temps est passé)");
      // Le bilan : la ligne de l'étoile partie, SES deux boutons, et « Continuer » vers « Séance terminée ».
      await photo(s.page, `${f}-etoile-partie-seance-finie`);
      const ligne = espaces(await s.page.evaluate(() => document.querySelector("#result-suite .ck-ligne-partie").innerText));
      assert.match(ligne, /Deux calculs faux : l’étoile est partie\. Tu peux la regagner quand tu veux\./);
      const boutons = await s.page.evaluate(() => [...document.querySelectorAll("#result-suite .ck-ligne-partie button")].map(b => b.textContent.replace(/ /g, " ").trim()));
      assert.deepEqual(boutons, ["Je tente", "J’apprends"], "les deux boutons de la planche K1-4 sont là, même quand le paquet a fini la séance");
      assert.deepEqual(await s.page.evaluate(() => [...document.querySelectorAll("#result-suite > .boutons button")].map(b => b.textContent.trim())), ["Continuer"]);
      await tient(s.page, largeur, hauteur, "le bilan, la séance finie");
      // « Je tente » : une séance neuve s'ouvre, et la tentative commence sur cette étoile.
      const finies = p.seance.n;
      await s.page.evaluate(() => document.querySelector("#result-suite .ck-ligne-partie button").click());
      await pause(s.page, 800);
      assert.equal(await T(s.page, "genre"), "tente");
      const etape = await T(s.page, "etape");
      assert.deepEqual([etape.module, etape.niveau], [perdue.module, perdue.niveau]);
      const q = await T(s.page, "parcours");
      assert.deepEqual([P.seanceOuverte(q, JOUR), q.seance.n], [true, finies], "une séance neuve est ouverte, la précédente reste comptée");
      // Regagnée : six justes.
      for (let i = 0; i < 6 && await enJeu(s.page); i += 1) await repondre(s.page, true);
      await pause(s.page, 1200);
      assert.ok(boite(await T(s.page, "parcours"), perdue) > 0, "l'étoile est regagnée");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await cas("7. à 9 minutes, après un « Je tente » raté : « Continuer » propose une étoile qui tient encore, et la lance", async () => {
    const s = await ouvrir(nav, base, {serveur: {parcours: null, revision: 0}});
    await s.page.click("#acc-commencer");
    await pause(s.page, 2600);
    assert.equal(await T(s.page, "genre"), "tente");
    const ratee = await T(s.page, "etape");
    // Quatre calculs justes, une minute chacun ; trois minutes de plus à chercher ; puis deux faux : raté, à 9 minutes.
    for (let i = 0; i < 4; i += 1) await repondre(s.page, true, 60);
    for (let i = 0; i < 3; i += 1) { await s.page.clock.runFor(60000); await s.page.keyboard.press("Shift"); }
    await repondre(s.page, false, 60);
    await repondre(s.page, false, 60);
    await pause(s.page, 1000);
    const p = await T(s.page, "parcours");
    assert.ok(p.seance.j[4] > 420 && p.seance.j[4] <= 600, `la séance en est à ${p.seance.j[4]} secondes : J'apprends (4 minutes) ne tient plus, « Je tente » (1 minute) tient encore`);
    assert.equal(P.seanceOuverte(p, JOUR), true, "la séance reste ouverte");
    // La carte : « Continuer » dit une AUTRE étoile que celle qui vient d'être ratée.
    await s.page.evaluate(() => [...document.querySelectorAll("#result-suite button")].find(b => /La carte/.test(b.textContent)).click());
    await pause(s.page, 500);
    const suite = (await T(s.page, "seance")).continuer;
    assert.equal(suite.type, "etoile");
    assert.notDeepEqual([suite.module, suite.niveau], [ratee.module, ratee.niveau], "pas l'étoile ratée, dont il ne reste que J'apprends");
    assert.equal(suite.action, "tente");
    const nom = CORE.nomCompetence(suite.module, suite.niveau);
    assert.equal(espaces(await s.page.evaluate(() => document.querySelector("#carte-continuer small").innerText)), espaces(`Ensuite : ${nom.charAt(0).toUpperCase()}${nom.slice(1)}`));
    // Et il la lance : pas de « Séance terminée » alors qu'une étoile pouvait encore se tenter.
    await s.page.click("#carte-continuer");
    await pause(s.page, 2600);
    assert.equal(await T(s.page, "genre"), "tente", "« Continuer » lance le « Je tente » annoncé");
    const etape = await T(s.page, "etape");
    assert.deepEqual([etape.module, etape.niveau], [suite.module, suite.niveau]);
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  if (!phpPresent()) console.log("  – 15. Mon espace avec le vrai serveur : PHP absent sur ce poste, trajet non joué ici");
  else await cas("15. Mon espace, avec le VRAI serveur PHP : la ceinture blanche-jaune remplie d'un quart, « ↑ +4 étoiles cette semaine », puis « 4 étoiles sur 14 »", async () => {
    const suivi = await monterSuivi();
    try {
      const ecrit = await suivi.api("/api/parcours.php", {code: suivi.code, appli: "defi-calcul", parcours: leaCP(), base_revision: 0});
      assert.equal(ecrit.statut, 200, `la progression de version ${P.VERSION} est enregistrée par le vrai filtre`);
      const relu = await suivi.api("/api/parcours.php", {code: suivi.code, appli: "defi-calcul", lire: true, version: P.VERSION});
      assert.equal(relu.json.parcours.version, P.VERSION);
      assert.equal((await suivi.api("/api/parcours.php", {code: suivi.code, appli: "defi-calcul", lire: true})).statut, 400, "sans dire sa version, le serveur refuse (c'est ce que Mon espace envoyait)");
      // La semaine où les étoiles ont été gagnées (mercredi), au téléphone et à l'ordinateur ; puis la semaine suivante.
      for (const [largeur, hauteur, jour, attendu] of [[390, 844, JOUR, /^Défi calcul ↑ \+4 étoiles cette semaine blanche-jaune$/], [1366, 768, JOUR, /^Défi calcul ↑ \+4 étoiles cette semaine blanche-jaune$/],
        [390, 844, P.ajouterJours(JOUR, 7), /^Défi calcul 4 étoiles sur 14 blanche-jaune$/]]) {
        const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, timezoneId: "Indian/Reunion", locale: "fr-FR"});
        const page = await ctx.newPage();
        await page.clock.install({time: new Date(`${jour}T17:00:00+04:00`)});
        const erreurs = [];
        const lectures = [];
        page.on("pageerror", e => erreurs.push(e.message));
        page.on("response", r => { if (r.url().endsWith("/api/parcours.php")) lectures.push([r.status(), JSON.parse(r.request().postData() || "{}")]); });
        // L'élève entre par son code, comme en classe.
        await page.goto(suivi.url + "/");
        await page.fill("#code", suivi.code);
        await page.press("#code", "Enter");
        const lireTuile = () => page.evaluate(() => { const porte = document.querySelector('[data-cle="defi-calcul"]'); return porte ? {texte: porte.innerText, ceinture: porte.querySelectorAll(".insigne svg").length, nom: (porte.querySelector(".insigne") || {getAttribute: () => ""}).getAttribute("aria-label")} : null; });
        let tuile = null;
        for (let i = 0; i < 80; i += 1) {
          await page.clock.runFor(100);
          await page.waitForTimeout(50);
          tuile = await lireTuile();
          if (tuile && tuile.ceinture) break;
        }
        const quoi = `${largeur} × ${hauteur}, le ${jour}`;
        const calcul = lectures.filter(([, corps]) => corps.appli === "defi-calcul");
        assert.deepEqual(calcul.map(([statut, corps]) => [statut, corps.version]), [[200, P.VERSION]], `${quoi} : Mon espace lit Défi calcul en annonçant la version ${P.VERSION}, et le serveur répond`);
        assert.ok(tuile, `${quoi} : la tuile Défi calcul`);
        assert.match(espaces(tuile.texte), attendu, `${quoi} : la ligne de la tuile`);
        assert.deepEqual([tuile.ceinture, tuile.nom], [1, "Ceinture blanche-jaune"], `${quoi} : la ceinture de l'étage en cours est dessinée`);
        // Remplie d'un quart : 4 étoiles sur 14 (la couleur coupée au quart de la largeur).
        const coupe = await page.evaluate(() => { const r = document.querySelector('[data-cle="defi-calcul"] .insigne svg clipPath rect'); return r ? Number(r.getAttribute("width")) : null; });
        assert.equal(coupe, 16, `${quoi} : remplie d'un quart (17 sur 44)`);
        if (SORTIE) { fs.mkdirSync(SORTIE, {recursive: true}); await page.waitForTimeout(500); await page.screenshot({path: path.join(SORTIE, `${largeur}x${hauteur}-mon-espace-${jour}.png`)}); }
        assert.deepEqual(erreurs, []);
        await ctx.close();
      }
    } finally { suivi.fermer(); }
  });

  await nav.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} cas en échec`); process.exit(1); }
  console.log("tout est conforme");
})().catch(e => { console.error(e); process.exit(1); });
