// Défi calcul, lot K1b « les bases en trois classes » (26/11/2026, planches
// K1b-1 à K1b-9 validées par Gwenaël) : la VRAIE page, au navigateur, élève
// connecté par code (faux serveur de suivi) et professeur.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-K1b-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-K1b-ecrans.cjs
//
// Les écrans NEUFS du lot, chacun : rien ne sort sur le côté ; à
// l'ordinateur, le cadre tient entier dans l'écran.
//   onglets    six onglets sur UNE rangée, aucun mot coupé ni sorti de son
//              onglet, à 320, 360, 390 px de large et à l'ordinateur (fenêtre
//              et plein écran) ;
//   carte      élève neuf : « Ceinture blanche-jaune · 0 étoile sur 14 », les
//              quatre lignes du CP (lot P1 : le compte sous chaque ceinture,
//              plus de « Tente toute la ceinture ») ;
//   version 12 les neuf progressions jouées par le moteur d'avant
//              (tests/defi-calcul-lot-K1b-version-12.json) : la page les
//              relit, sans erreur, avec la ceinture et l'étage attendus, et
//              les écrit en version 14 (lot P1) ;
//   réglage    l'élève arrêté par le professeur à chaque étage (1 à 6) : les
//              étages au-delà ne sont pas montrés (lot P1 : plus d'étage
//              « fermé ») ; « Tout est gagné » quand l'étage du réglage est fini ;
//   ceintures  (retiré au lot P1) « Tente toute la ceinture » réussi aux six étages, l'un après
//              l'autre : « Tu as gagné les N étoiles. La ceinture … s'ouvre. »
//              (14, 20, 19, 33, 43, 12) ;
//   professeur « Ceinture blanche-jaune · CP », toutes les étoiles ouvertes ;
//   notice     « Comment ça marche ? » : six ceintures.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const V12 = require(path.join(RACINE, "tests/defi-calcul-lot-K1b-version-12.json"));
const CARTE = CORE.carte();
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-26";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp", ".json": "application/json"};
const ETOILES = [14, 20, 19, 33, 43, 22];
const NOMS = ["blanche-jaune", "jaune", "jaune-orange", "orange", "verte", "bleue"];

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

async function ouvrir(nav, base, {largeur, hauteur, parcours = null, reglages = {}, prof = false, plein = false, jour = JOUR}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${jour}T17:00:00+04:00`)});
  const erreurs = [];
  const ecrits = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erreurs.push(m.text()); });
  if (!prof) {
    await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), "7K3M9P");
    await page.route("https://suivi.mathsgo.re/**", async route => {
      const corps = JSON.parse(route.request().postData() || "{}");
      const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(d)});
      if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages});
      if (corps.lire) return rendre(parcours ? {ok: true, existe: true, parcours, revision: 1} : {ok: true, existe: false});
      if (corps.parcours) ecrits.push(corps.parcours);
      return rendre({ok: true, revision: 2});
    });
  }
  await page.goto(base + PAGE + (prof ? "&prof=1" : ""));
  for (let i = 0; i < 40; i += 1) {
    await page.clock.runFor(100);
    await page.waitForTimeout(25);
    if (await page.evaluate(() => !document.body.classList.contains("accueil-en-attente"))) break;
  }
  await pause(page, 200);
  if (plein) { await page.click("[data-fullscreen-toggle]"); await pause(page, 400); }
  return {page, ctx, erreurs, ecrits};
}

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(60); };
const espaces = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText : null; }, s).then(espaces);
const T = (page, nom) => page.evaluate(n => window.__MATHSGO_DEFI_CALCUL_TEST__[n](), nom);
async function photo(page, nom) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.waitForTimeout(500);
  await page.screenshot({path: path.join(SORTIE, `${nom}.png`)});
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

// Les six onglets : une seule rangée ; chaque mot dans son onglet, sur une ligne.
async function onglets(page) {
  return page.evaluate(() => [...document.querySelectorAll("#carte-etages .ck-onglet")].map(b => {
    const r = b.getBoundingClientRect();
    const mot = b.querySelector("span");
    const m = mot.getBoundingClientRect();
    return {haut: Math.round(r.top), g: r.left, d: r.right, mg: m.left, md: m.right, lignes: mot.getClientRects().length, hMot: Math.round(m.height), mot: mot.textContent};
  }));
}

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

let echecs = 0;
async function cas(nom, f) {
  try { await f(); console.log(`  ✓ ${nom}`); }
  catch (e) { echecs += 1; console.log(`  ✗ ${nom}\n      ${String(e && e.message || e).split("\n").join("\n      ")}`); }
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"]} : {});

  // ------------------------------------------------ les onglets, la carte neuve
  for (const [largeur, hauteur, plein] of [[320, 640, false], [360, 740, false], [390, 844, false], [1366, 768, false], [1366, 768, true], [1366, 657, false], [1920, 1080, false]]) {
    const f = `${largeur}x${hauteur}${plein ? "-plein" : ""}`;
    await cas(`${f} : la carte d'un élève neuf — six onglets sur une rangée, la ceinture du CP`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, plein});
      // (Lot « l'accueil, c'est la carte » : la ceinture et son compte, dans la ligne de la ceinture.)
      assert.match(await texte(s.page, "#carte-porteur"), /Ceinture blanche-jaune 0 étoile sur 14/);
      await photo(s.page, `${f}-accueil`);
      // (Lot « l'accueil, c'est la carte » : on arrive sur la carte.)
      await pause(s.page, 300);
      const o = await onglets(s.page);
      assert.equal(o.length, 6, "six onglets");
      assert.equal(new Set(o.map(x => x.haut)).size, 1, `une seule rangée (${o.map(x => x.haut)})`);
      o.forEach((x, i) => {
        assert.equal(x.lignes, 1, `onglet ${i + 1} : « ${x.mot} » sur une ligne`);
        assert.ok(x.mg >= x.g + 1 && x.md <= x.d - 1, `onglet ${i + 1} : « ${x.mot} » dans son onglet (${Math.round(x.mg)}-${Math.round(x.md)} dans ${Math.round(x.g)}-${Math.round(x.d)})`);
      });
      // (Lot P1, planche P1-1 A : le compte sous chaque ceinture ; tout est ouvert.)
      assert.deepEqual(o.map(x => x.mot), ["0/14", "0/20", "0/19", "0/33", "0/43", "0/12"]);
      assert.match(await texte(s.page, "#carte-porteur"), /^Ceinture blanche-jaune 0 étoile sur 14$/);
      const lignes = await s.page.evaluate(() => [...document.querySelectorAll("#carte-lignes .ck-ligne")].length);
      assert.equal(lignes, P.carteEleve(P.creerParcours(), CARTE, {aujourdhui: JOUR}).etages[0].lignes.length, "les lignes du CP");
      assert.equal(lignes, 4, "quatre lignes au CP (planche K1b-1)");
      assert.equal(await s.page.$("#carte-tente"), null, "plus de « Tente toute la ceinture » (lot P1)");
      await tient(s.page, largeur, hauteur, "carte");
      await photo(s.page, `${f}-carte-neuf`);
      // Un autre étage : son onglet, puis sa carte (lot P1 : ouvert, comme tous).
      await s.page.click("#carte-etages .ck-onglet:nth-child(3)");
      await pause(s.page, 300);
      assert.match(await texte(s.page, "#carte-porteur"), /^Ceinture jaune-orange/);
      await tient(s.page, largeur, hauteur, "carte du CE2");
      await photo(s.page, `${f}-carte-ce2-fermee`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  // ------------------------------------------------ les progressions de version 12
  for (const [nom, t] of Object.entries(V12.temoins)) {
    for (const [largeur, hauteur] of [[390, 844], [1366, 768]]) {
      await cas(`${largeur}x${hauteur} : version 12 « ${nom} » — relue, la bonne ceinture, écrite en 14 (lot P1)`, async () => {
        const jour = t.vu.jour || JOUR;
        const s = await ouvrir(nav, base, {largeur, hauteur, parcours: t.parcours, jour});
        const attendu = P.carteEleve(P.normaliserParcours(t.parcours, {aujourdhui: jour}), CARTE, {aujourdhui: jour});
        // (Lot « l'accueil, c'est la carte » : on arrive sur la carte.)
        await pause(s.page, 300);
        const c = await T(s.page, "carte");
        assert.equal(c.courant, attendu.courant, "l'étage ouvert");
        assert.equal((await onglets(s.page)).length, 6);
        const porteur = await texte(s.page, "#carte-porteur");
        // (Lot « l'accueil, c'est la carte » : le « ? » de « Comment ça marche ? » est au bout de la ligne.)
        assert.match(porteur, /^Ceinture [a-z-]+ \d+ étoiles? sur \d+ \?$/);
        const n = attendu.etages.find(e => e.etage === attendu.courant);
        assert.ok(porteur.includes(`sur ${ETOILES[attendu.courant - 1]}`), `${porteur} : l'étage ${attendu.courant}`);
        assert.ok(n, "l'étage existe");
        const p = await T(s.page, "parcours");
        assert.equal(p.version, 14, "la page relit et garde la version 14 (lot P1)");
        await tient(s.page, largeur, hauteur, "carte reprise");
        await photo(s.page, `${largeur}x${hauteur}-v12-${nom}`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      });
    }
  }

  // ------------------------------------------------ le réglage du professeur, étage par étage
  for (let etage = 1; etage <= 6; etage += 1) {
    await cas(`390x844 : réglage « jusqu'à l'étage ${etage} » — au-delà, pas montré ; l'étage du réglage fini : « Tout est gagné »`, async () => {
      // L'élève a gagné tous les étages jusqu'à celui du réglage (aujourd'hui).
      let p = P.creerParcours();
      const six = Array.from({length: 6}, () => ({juste: true, ms: 2000}));
      for (let e = 1; e <= etage; e += 1) {
        const plan = P.carteEleve(p, CARTE, {aujourdhui: JOUR});
        const cles = plan.etages.find(x => x.etage === e).lignes.flatMap(l => l.etoiles.map(x => x.cle));
        for (const k of CARTE.ordre.filter(x => cles.includes(x))) {
          const [m, n] = k.split("-");
          const r = P.appliquerTentative(p, {module: m, niveau: Number(n), reponses: six}, {aujourdhui: JOUR, carte: CARTE});
          if (!r.refuse) p = r.parcours;
        }
      }
      const s = await ouvrir(nav, base, {largeur: 390, hauteur: 844, parcours: p, reglages: {"defi-calcul": {etage}}});
      assert.match(await texte(s.page, "#ecran-carte"), /Tout est gagné/, "la carte (l'accueil) le dit");
      // (Lot « l'accueil, c'est la carte » : on arrive sur la carte.)
      await pause(s.page, 300);
      const o = await onglets(s.page);
      // (Lot P1 : plus d'onglet « fermée » ; les étages au-delà du réglage ne sont pas montrés.)
      assert.equal(o.length, etage, `${etage} onglet(s), pas un de plus`);
      o.forEach((x, i) => assert.equal(x.mot, "gagnée", `étage ${i + 1} gagné`));
      await tient(s.page, 390, 844, "carte arrêtée");
      await photo(s.page, `390x844-reglage-${etage}`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  // ------------------------------------------------ les six ceintures, l'une après l'autre
  // (Lot P1, 27/11/2026 : « Tente toute la ceinture » n'existe plus — ce cas est retiré, nommé dans la note
  // « tests retirés » du lot. L'écran « Ceinture … ! » est joué par tests/defi-calcul-lot-P1-ecrans.cjs.)

  // ------------------------------------------------ le professeur, la notice
  for (const [largeur, hauteur] of [[390, 844], [1366, 768]]) {
    await cas(`${largeur}x${hauteur} : le professeur — « Ceinture blanche-jaune · CP », tout ouvert, rien d'enregistré`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, prof: true});
      // (Lot « l'accueil, c'est la carte » : on arrive sur la carte.)
      await pause(s.page, 300);
      assert.match(await texte(s.page, "#carte-porteur"), /^Ceinture blanche-jaune · CP/);
      assert.equal(await s.page.evaluate(() => document.querySelectorAll("#carte-lignes .ck-case.fermee").length), 0, "toutes les étoiles ouvertes");
      for (let n = 2; n <= 6; n += 1) {
        await s.page.click(`#carte-etages .ck-onglet:nth-child(${n})`);
        await pause(s.page, 200);
        assert.match(await texte(s.page, "#carte-porteur"), new RegExp(`^Ceinture ${NOMS[n - 1]} · ${["", "CE1", "CE2", "CM1", "CM2", "6e"][n - 1]}`));
        // L'ordre des étoiles d'une ligne : celui de la carte (une moitié du haut,
        // numérotée à la fin de son module, est à sa place).
        const vues = await s.page.evaluate(() => [...document.querySelectorAll("#carte-lignes .ck-case")].map(b => b.dataset.cle));
        const rang = k => CARTE.ordre.indexOf(k);
        const lignes = await s.page.evaluate(() => [...document.querySelectorAll("#carte-lignes .ck-ligne")].map(l => [...l.querySelectorAll(".ck-case")].map(b => b.dataset.cle)));
        lignes.forEach(l => assert.deepEqual(l, [...l].sort((a, b) => rang(a) - rang(b)), `étage ${n} : dans l'ordre de la carte`));
        assert.ok(vues.length > 0);
      }
      await tient(s.page, largeur, hauteur, "carte du professeur");
      await photo(s.page, `${largeur}x${hauteur}-prof`);
      assert.equal(await s.page.evaluate(() => Object.keys(localStorage).filter(k => /defi-calcul/.test(k)).length), 0, "rien d'enregistré");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${largeur}x${hauteur} : « Comment ça marche ? » — six ceintures`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await s.page.click("#acc-notice-bouton");
      await pause(s.page, 300);
      assert.match(await texte(s.page, "#notice"), /Tout est ouvert\. .*Six ceintures, de la blanche-jaune à la bleue, à gagner dans l’ordre que je veux\./); // (lot P1 : tout est ouvert, plus de « la suivante s’ouvre »)
      await tient(s.page, largeur, hauteur, "Comment ça marche ?");
      await photo(s.page, `${largeur}x${hauteur}-notice`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} cas en échec`); process.exit(1); }
  console.log("tout est conforme");
})().catch(e => { console.error(e); process.exit(1); });
