// Défi calcul, lot P1 « tout ouvert » (refait, passe 2, 27/11/2026 ; planches
// P1-1, 2, 3, 5, 6, 7, 8, 9, options A, choisies par Gwenaël) : la VRAIE
// page, au navigateur, élève connecté par code (faux serveur de suivi), aux
// cinq formats (390 × 664, 390 × 844, 1366 × 657, 1366 × 768, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-P1-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-P1-ecrans.cjs
// Un format : FORMATS=1366x657 node tests/defi-calcul-lot-P1-ecrans.cjs
//
// Les écrans NEUFS du lot (règle du 15/11 : les anciens ne se revérifient
// pas), chacun : rien ne sort sur le côté ; à l'ordinateur, le cadre tient
// entier dans l'écran.
//   accueil     « Aujourd'hui : la ligne Jusqu'à 20 », sans « Avant : … »
//               (élève neuf) ; avec « Avant : tes N calculs du jour. » ;
//   carte       sous chaque ceinture « gagnée » ou « 18/20 », pas de
//               bandeau ; à l'ordinateur, sur les six onglets, la même
//               largeur de cadre et la même place pour « Continuer » ;
//   plus facile après un « Je tente » raté, le panneau propose « Plus
//               facile » et le nom de l'étoile ; il ouvre son panneau ;
//   gagnée      « Je tente » réussi du premier coup : « 5 justes sur 5. Elle
//               reviendra dans une semaine dans tes calculs du jour. » ;
//   raté        « Je tente » raté : « Continuer », « J'apprends »,
//               « Ensuite : … », « Mes 2 erreurs » ; et, quand « Continuer »
//               descend, la phrase et « (plus facile) » ;
//   séance      une séance entière : un faux à Mes calculs du jour, son 2e
//               calcul DE LA MÊME SORTE ; la ceinture blanche-jaune gagnée
//               (« Tu as gagné les 14 étoiles. », sans « s'ouvre ») ;
//               « Séance terminée » en lignes ;
//   fini        la dernière ceinture : « Tu as fini Défi calcul ! » ;
//   notice      « Comment ça marche ? » (planche P1-9 A).

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
const nom = (id, n) => { const t = CORE.nomCompetence(id, n).replace(/[\u00a0\u202f]/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); };

// ------------------------------------------------------------------ les progressions, jouées par le moteur du lot
const A = d => P.ajouterJours(JOUR, d);
const SIX = Array.from({length: 6}, () => ({juste: true, ms: 1500}));
const RATE = [{juste: false, ms: 3000}, {juste: false, ms: 3000}];
function gagnerParContinuer(p, jour, combien, jusquA = null) {
  for (let i = 0; i < combien; i += 1) {
    const c = P.etatSeance(p, CARTE, {aujourdhui: jour}).continuer;
    if (c.type === "paquet") {
      P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}).forEach(x => { p = P.appliquerRetour(p, {module: x.module, niveau: x.niveau, juste: true, ms: 2000}, {aujourdhui: jour, carte: CARTE}).parcours; });
      p = P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
      i -= 1;
      continue;
    }
    if (c.type !== "etoile" || (jusquA && jusquA(c))) break;
    p = P.appliquerTentative(p, {module: c.module, niveau: c.niveau, reponses: SIX}, {aujourdhui: jour, carte: CARTE}).parcours;
  }
  return p;
}
// Neuf : rien.
const NEUF = P.creerParcours();
// En cours : le CP gagné du premier coup il y a 8 jours (dû depuis hier),
// six étoiles du CE1 il y a 7 jours (dues aujourd'hui) — « Avant : tes 10
// calculs du jour. ».
const EN_COURS = gagnerParContinuer(gagnerParContinuer(P.creerParcours(), A(-8), 14), A(-7), 6);
// Presque une ceinture : 13 étoiles du CP gagnées il y a 8 jours ; la 14e se
// gagne à la séance, après Mes calculs du jour.
const PRESQUE = gagnerParContinuer(P.creerParcours(), A(-8), 13);
// Presque fini : toutes les étoiles du réglage « jusqu'au CP » gagnées hier
// sauf la dernière (réglage du professeur : étage 1) ; rien n'est dû.
const PRESQUE_FINI = gagnerParContinuer(P.creerParcours(), A(-1), 13);
// « Plus facile » : la première étoile à gagner d'un étage au-dessus du CE2
// qui, ratée, propose une étoile plus facile (élève neuf).
function etoileAvecPlusFacile(p) {
  for (const etage of P.carteEleve(p, CARTE, {aujourdhui: JOUR}).etages.filter(e => e.etage >= 3)) {
    for (const ligne of etage.lignes) {
      for (const e of ligne.etoiles) {
        if (e.etat !== "aGagner") continue;
        const r = P.appliquerTentative(p, {module: e.module, niveau: e.niveau, reponses: RATE}, {aujourdhui: JOUR, carte: CARTE});
        const facile = P.plusFacile(r.parcours, CARTE, e.module, e.niveau, {aujourdhui: JOUR});
        if (facile) return {etage: etage.etage, module: e.module, niveau: e.niveau, facile, parcours: r.parcours};
      }
    }
  }
  return null;
}
const PLUS_FACILE = etoileAvecPlusFacile(NEUF);
// « Continuer » descend : une leçon arrêtée deux fois au CE2 (l'élève n'est
// pas prêt) — « Continuer » propose une étoile plus facile ; l'élève tente
// la première étoile du CP et la rate.
function leconArretee() {
  let p = P.creerParcours();
  const haut = P.carteEleve(p, CARTE, {aujourdhui: JOUR}).etages.find(e => e.etage === 3).lignes[0].etoiles[0];
  const neuf = Array.from({length: 4}, () => ({juste: true, outil: "aucun"}));
  for (const d of [-2, -1]) {
    p = P.appliquerSerie(p, {module: haut.module, niveau: haut.niveau, genre: "apprends", reponses: neuf, causes: {}, tempsFini: true}, {aujourdhui: A(d), carte: CARTE}).parcours;
  }
  return {parcours: p, haut};
}
const DESCEND = leconArretee();

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

async function ouvrir(nav, base, {largeur, hauteur, parcours = null, reglages = {}}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erreurs.push(m.text()); });
  await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), "7K3M9P");
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages});
    if (corps.lire) return rendre(parcours ? {ok: true, existe: true, parcours, revision: 1} : {ok: true, existe: false});
    return rendre({ok: true, revision: 2});
  });
  await page.goto(base + PAGE);
  for (let i = 0; i < 40; i += 1) {
    await page.clock.runFor(100);
    await page.waitForTimeout(25);
    if (await page.evaluate(() => !document.body.classList.contains("accueil-en-attente"))) break;
  }
  await pause(page, 200);
  return {page, ctx, erreurs};
}

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(60); };
const espaces = t => String(t || "").replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText : null; }, s).then(espaces);
const T = (page, n) => page.evaluate(x => window.__MATHSGO_DEFI_CALCUL_TEST__[x](), n);
const enJeu = page => page.evaluate(() => !document.getElementById("play").hidden);
async function photo(page, n) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.waitForTimeout(700);
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

// Une réponse (juste ou fausse) au calcul à l'écran ; passe l'exemple résolu.
async function repondre(page, juste) {
  for (let k = 0; k < 4; k += 1) {
    const e = await page.evaluate(() => { const t = window.__MATHSGO_DEFI_CALCUL_TEST__; return {calcul: t.calcul(), exemple: t.exempleAffiche ? t.exempleAffiche() : null, jeu: !document.getElementById("play").hidden}; });
    if (!e.jeu || !e.calcul) return null;
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
    return e.calcul;
  }
  return null;
}
// La carte : la largeur du cadre et le haut de « Continuer », onglet par onglet.
async function mesuresCarte(page) {
  const liste = [];
  const n = await page.evaluate(() => document.querySelectorAll("#carte-etages .ck-onglet").length);
  for (let i = 0; i < n; i += 1) {
    await page.click(`#carte-etages .ck-onglet:nth-child(${i + 1})`);
    await pause(page, 300);
    liste.push(await page.evaluate(() => {
      const cadre = document.querySelector(".shell").getBoundingClientRect();
      const bouton = document.getElementById("carte-continuer").getBoundingClientRect();
      return {largeur: Math.round(cadre.width * 10) / 10, haut: Math.round(bouton.top * 10) / 10, gauche: Math.round(bouton.left * 10) / 10};
    }));
  }
  return liste;
}

let echecs = 0;
async function cas(n, f) {
  try { await f(); console.log(`  ✓ ${n}`); }
  catch (e) { echecs += 1; console.log(`  ✗ ${n}\n      ${String(e && e.message || e).split("\n").join("\n      ")}`); }
}

(async () => {
  assert.ok(PLUS_FACILE, "une étoile qui propose « Plus facile »");
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"]} : {});
  const sEnCours = P.etatSeance(EN_COURS, CARTE, {aujourdhui: JOUR});
  const bilanCarte = {};

  for (const [largeur, hauteur] of FORMATS) {
    const f = `${largeur}x${hauteur}`;
    const ordi = largeur > 620;

    await cas(`${f} : l'accueil — « Aujourd'hui : la ligne … », sans puis avec « Avant : … »`, async () => {
      let s = await ouvrir(nav, base, {largeur, hauteur});
      assert.equal(await texte(s.page, "#acc-but"), "Aujourd’hui : la ligne Jusqu’à 20");
      assert.equal(await s.page.isVisible("#acc-but-avant"), false, "élève neuf : aucun calcul du jour, aucune ligne");
      await tient(s.page, largeur, hauteur, "accueil neuf");
      await photo(s.page, `${f}-01-accueil-neuf`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
      s = await ouvrir(nav, base, {largeur, hauteur, parcours: EN_COURS});
      assert.equal(await texte(s.page, "#acc-but"), `Aujourd’hui : la ligne ${sEnCours.but.ligne} Avant : tes ${sEnCours.obligatoire} calculs du jour.`);
      // « − » et « + » ne restent jamais seuls en début de ligne.
      const lignes = await s.page.evaluate(() => { const e = document.getElementById("acc-but-texte"); const r = document.createRange(); r.selectNodeContents(e); return [...r.getClientRects()].length; });
      assert.ok(lignes <= 2, `${lignes} lignes`);
      await tient(s.page, largeur, hauteur, "accueil avec calculs du jour");
      await photo(s.page, `${f}-02-accueil-avant`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : la carte — « gagnée » ou « 18/20 » sous chaque ceinture, pas de bandeau${ordi ? ", le même cadre sur les six onglets" : ""}`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: EN_COURS});
      await s.page.click("#acc-porte");
      await pause(s.page, 400);
      const attendu = P.carteEleve(EN_COURS, CARTE, {aujourdhui: JOUR}).etages.map(e => (e.ceinture ? "gagnée" : `${e.etoiles}/${e.total}`));
      const mots = await s.page.evaluate(() => [...document.querySelectorAll("#carte-etages .ck-onglet span")].map(x => x.textContent));
      assert.deepEqual(mots, attendu);
      assert.equal(await s.page.$("#carte-tente"), null, "plus de « Tente toute la ceinture »");
      const dansLesOnglets = await s.page.evaluate(() => [...document.querySelectorAll("#carte-etages .ck-onglet")].every(b => { const r = b.getBoundingClientRect(); const m = b.querySelector("span").getBoundingClientRect(); return m.left >= r.left && m.right <= r.right && b.querySelector("span").getClientRects().length === 1; }));
      assert.ok(dansLesOnglets, "chaque compte dans son onglet, sur une ligne");
      await tient(s.page, largeur, hauteur, "carte");
      await photo(s.page, `${f}-03-carte`);
      const m = await mesuresCarte(s.page);
      bilanCarte[f] = m;
      if (ordi) {
        const largeurs = m.map(x => x.largeur), hauts = m.map(x => x.haut);
        assert.ok(Math.max(...largeurs) - Math.min(...largeurs) <= 1, `la même largeur de cadre (${largeurs.join(", ")})`);
        assert.ok(Math.max(...hauts) - Math.min(...hauts) <= 1, `« Continuer » à la même place (${hauts.join(", ")})`);
      }
      await tient(s.page, largeur, hauteur, "carte, dernier onglet");
      await photo(s.page, `${f}-04-carte-bleue`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : « Plus facile » dans le panneau, après un « Je tente » raté`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: PLUS_FACILE.parcours});
      await s.page.click("#acc-porte");
      await pause(s.page, 300);
      await s.page.click(`#carte-etages .ck-onglet:nth-child(${PLUS_FACILE.etage})`);
      await pause(s.page, 300);
      await s.page.click(`#carte-lignes [data-cle="${PLUS_FACILE.module}-${PLUS_FACILE.niveau}"]`);
      await pause(s.page, 400);
      const panneau = await texte(s.page, "#carte-panneau");
      assert.match(panneau, /Tu as déjà tenté aujourd’hui\. Tu pourras retenter demain\./);
      assert.ok(panneau.includes(`Plus facile ${nom(PLUS_FACILE.facile.module, PLUS_FACILE.facile.niveau)}`), panneau);
      assert.ok(panneau.includes("J’apprends On te montre, puis tu t’entraînes."));
      await tient(s.page, largeur, hauteur, "panneau « Plus facile »");
      await photo(s.page, `${f}-05-panneau-plus-facile`);
      await s.page.click("#panneau-corps button:has-text('Plus facile')");
      await pause(s.page, 500);
      assert.deepEqual(await T(s.page, "panneau"), {module: PLUS_FACILE.facile.module, niveau: PLUS_FACILE.facile.niveau}, "il ouvre le panneau de l'étoile plus facile");
      await photo(s.page, `${f}-06-panneau-de-la-plus-facile`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : « Je tente » réussi du premier coup — « dans une semaine »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await s.page.click("#acc-commencer");
      await pause(s.page, 1500);
      for (let i = 0; i < 6 && await enJeu(s.page); i += 1) await repondre(s.page, true);
      await pause(s.page, 800);
      const bilan = await texte(s.page, "#result");
      assert.match(bilan, /Étoile gagnée/i);
      assert.match(bilan, /5 justes sur 5\. Elle reviendra dans une semaine dans tes calculs du jour\./);
      assert.doesNotMatch(bilan, /demain/);
      await tient(s.page, largeur, hauteur, "Étoile gagnée");
      await photo(s.page, `${f}-07-je-tente-gagnee`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : « Je tente » raté — « Continuer », « J'apprends », « Ensuite : … », « Mes 2 erreurs »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await s.page.click("#acc-commencer");
      await pause(s.page, 1500);
      const faux = [];
      for (let i = 0; i < 6 && await enJeu(s.page); i += 1) faux.push(await repondre(s.page, false));
      await pause(s.page, 800);
      const bilan = await texte(s.page, "#result");
      assert.match(bilan, /Ce calcul, on l’apprend ensemble\./);
      assert.doesNotMatch(bilan, /On cherche par où commencer/);
      const boutons = await s.page.evaluate(() => [...document.querySelectorAll("#result-suite button")].filter(b => b.offsetParent).map(b => `${b.textContent.trim()}:${b.className}`));
      assert.deepEqual(boutons.slice(0, 2), ["Continuer:primary", "J’apprends:secondary"]);
      const c = P.continuer(P.appliquerTentative(NEUF, {module: "A1", niveau: 1, reponses: RATE}, {aujourdhui: JOUR, carte: CARTE}).parcours, CARTE, {aujourdhui: JOUR});
      assert.equal(await texte(s.page, "#result-suite .ck-ensuite"), `Ensuite : ${nom(c.module, c.niveau)}`);
      assert.equal(await texte(s.page, "#corrections h2"), "Mes 2 erreurs");
      const lignes = await s.page.evaluate(() => [...document.querySelectorAll("#corrections li")].map(l => l.innerText.replace(/\s+/g, " ").trim()));
      assert.equal(lignes.length, 2);
      faux.filter(Boolean).forEach((calcul, i) => assert.ok(lignes[i].includes(CORE.reponseEcrite(calcul)) && lignes[i].includes("99 999"), lignes[i]));
      await tient(s.page, largeur, hauteur, "Je tente raté");
      await photo(s.page, `${f}-08-je-tente-rate`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : « Je tente » raté quand « Continuer » descend — la phrase et « (plus facile) »`, async () => {
      const c0 = P.continuer(DESCEND.parcours, CARTE, {aujourdhui: JOUR, sansPaquet: true});
      assert.equal(c0.raison, "plusFacile", "le moteur descend (leçon arrêtée deux fois)");
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: DESCEND.parcours});
      await s.page.click("#acc-porte");
      await pause(s.page, 300);
      await s.page.click(`#carte-lignes [data-cle="A1-1"]`);
      await pause(s.page, 300);
      await s.page.click("#panneau-corps button:has-text('Je tente')");
      await pause(s.page, 1200);
      for (let i = 0; i < 6 && await enJeu(s.page); i += 1) await repondre(s.page, false);
      await pause(s.page, 800);
      const bilan = await texte(s.page, "#result");
      assert.match(bilan, /On cherche par où commencer : «[\u00a0 ]Continuer[\u00a0 ]» te propose plus facile\./);
      const c = P.continuer(P.appliquerTentative(DESCEND.parcours, {module: "A1", niveau: 1, reponses: RATE}, {aujourdhui: JOUR, carte: CARTE}).parcours, CARTE, {aujourdhui: JOUR, sansPaquet: true});
      assert.equal(await texte(s.page, "#result-suite .ck-ensuite"), `Ensuite : ${nom(c.module, c.niveau)} (plus facile)`);
      await tient(s.page, largeur, hauteur, "Je tente raté, avec la phrase");
      await photo(s.page, `${f}-09-je-tente-rate-plus-facile`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : une séance — un faux à Mes calculs du jour, son 2e calcul de la même sorte ; la ceinture ; « Séance terminée » en lignes`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: PRESQUE});
      const dues = P.etatSeance(PRESQUE, CARTE, {aujourdhui: JOUR}).obligatoire;
      assert.ok(dues >= 2, `${dues} calculs du jour`);
      await s.page.click("#acc-commencer");
      await pause(s.page, 2000);
      // Mes calculs du jour : le premier faux, puis son 2e calcul faux aussi
      // (la règle B : elle revient demain), le reste juste.
      const premier = await repondre(s.page, false);
      const second = await T(s.page, "calcul");
      assert.equal(second.module, premier.module, "le 2e calcul : la même étoile");
      assert.equal(CORE.numeroDeSorte(second), CORE.numeroDeSorte(premier), `la même sorte (${premier.texte} → ${second.texte})`);
      assert.notEqual(second.texte, premier.texte, "d'autres nombres");
      await tient(s.page, largeur, hauteur, "le 2e calcul");
      await photo(s.page, `${f}-10-deuxieme-calcul`);
      await repondre(s.page, false);
      let tours = 0, ceinture = null;
      while (tours < 80) {
        tours += 1;
        if (await enJeu(s.page)) { await repondre(s.page, true); continue; }
        if (await s.page.isVisible("#carte-panneau")) { await s.page.click("#panneau-corps button.primary"); await pause(s.page, 800); continue; }
        if (await s.page.isVisible("#carte-continuer")) { await s.page.click("#carte-continuer"); await pause(s.page, 800); continue; }
        if (await s.page.isVisible("#result-ceinture")) {
          ceinture = await texte(s.page, "#result-ceinture");
          await tient(s.page, largeur, hauteur, "Ceinture blanche-jaune !");
          await photo(s.page, `${f}-11-ceinture`);
          await s.page.click("#ceinture-boutons button");
          await pause(s.page, 800);
          continue;
        }
        if (await texte(s.page, "#result-title") === "Séance terminée") break;
        const bouton = await s.page.$("#result-suite .ck-continuer:visible, #result-suite button.primary:visible");
        if (!bouton) break;
        await s.page.keyboard.press("Shift"); await pause(s.page, 59000); await s.page.keyboard.press("Shift");
        await bouton.click(); await pause(s.page, 800);
      }
      assert.ok(ceinture, "l'écran de la ceinture");
      assert.match(ceinture, /Ceinture blanche-jaune ! Tu as gagné les 14 étoiles\./);
      assert.doesNotMatch(ceinture, /s’ouvre|fini/);
      const fin = await T(s.page, "finDeSeance");
      assert.deepEqual(fin.retrouves, {justes: dues - 1, total: dues});
      assert.deepEqual(fin.ceintures, [1]);
      assert.equal(await texte(s.page, "#result-title"), "Séance terminée", await texte(s.page, "#result"));
      const lignes = await s.page.evaluate(() => [...document.querySelectorAll("#result-suite > .ck-fin-ligne, #result-suite > .ck-fin-titre")].map(e => e.innerText.replace(/\s+/g, " ").trim()));
      assert.equal(lignes[0], `✓ Mes calculs du jour ${dues - 1} retrouvés sur ${dues}`);
      assert.equal(lignes[1], "Ceinture blanche-jaune gagnée Les 14 étoiles.");
      assert.match(lignes[2], /^\d+ étoiles? gagnées?$/);
      await photo(s.page, `${f}-12-fin-de-seance`);
      await tient(s.page, largeur, hauteur, "Séance terminée");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : la dernière ceinture du réglage — « Tu as fini … »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: PRESQUE_FINI, reglages: {"defi-calcul": {etage: 1}}});
      await s.page.click("#acc-porte");
      await pause(s.page, 300);
      const c = P.continuer(PRESQUE_FINI, CARTE, {aujourdhui: JOUR, palier: 1, sansPaquet: true});
      await s.page.click(`#carte-lignes [data-cle="${c.module}-${c.niveau}"]`);
      await pause(s.page, 300);
      await s.page.click("#panneau-corps button:has-text('Je tente')");
      await pause(s.page, 1200);
      for (let i = 0; i < 6 && await enJeu(s.page); i += 1) await repondre(s.page, true);
      await pause(s.page, 800);
      const ecran = await texte(s.page, "#result-ceinture");
      assert.match(ecran, /Tu as gagné les 14 étoiles\./);
      assert.match(ecran, /Tu as fini tout ce que ton professeur a ouvert\./);
      await tient(s.page, largeur, hauteur, "dernière ceinture");
      await photo(s.page, `${f}-13-ceinture-derniere`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : « Comment ça marche ? » (planche P1-9 A)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await s.page.click("#acc-notice-bouton");
      await pause(s.page, 300);
      const t = await texte(s.page, "#notice");
      assert.match(t, /si c’est trop dur, il me propose plus facile\./);
      assert.match(t, /Gagnée du premier coup : dans une semaine\. Apprise : demain, puis dans 3 jours, 7 jours…/);
      assert.match(t, /Raté \? Je peux essayer plus facile, ou apprendre\./);
      assert.match(t, /Tout est ouvert\. Une ceinture est à moi quand j’ai toutes ses étoiles\./);
      assert.doesNotMatch(t, /Tente toute|s’ouvre/);
      await tient(s.page, largeur, hauteur, "Comment ça marche ?");
      await photo(s.page, `${f}-14-notice`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  if (SORTIE) fs.writeFileSync(path.join(SORTIE, "mesures-carte.json"), JSON.stringify(bilanCarte, null, 1));
  await nav.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} cas en échec`); process.exit(1); }
  console.log("tout est conforme");
})().catch(e => { console.error(e); process.exit(1); });
