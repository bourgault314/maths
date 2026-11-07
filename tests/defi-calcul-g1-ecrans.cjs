// Défi calcul, lot G1 « journal + accueil » (07/11/2026) : la VRAIE page, au
// navigateur, avec un faux serveur de suivi qui répond.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 npm install --no-save playwright
//   node tests/defi-calcul-g1-ecrans.cjs
//
// Ce qui est vérifié :
//   journal    une séance jouée sur la page (Mes calculs du jour, deux
//              justes, 20 s entre deux gestes) arrive au serveur avec son
//              entrée de journal : 2 calculs, 2 justes, une minute au moins ;
//              les deux compétences passées en boîte 4 ont leur date `s` ;
//   accueil    (refait au lot « accueil », 07/11/2026) la pastille
//              « N soirs cette semaine », les gains sur la porte et dans
//              Mon parcours, « ↑ cette semaine » sur A2, au téléphone et sur
//              l'ordinateur (cadre entier) ;
//   arrêter    une étape arrêtée au milieu : son temps compte quand même ;
// Le correctif après la relecture de Codex (le temps ne se perd plus) :
//   recharger  la page rechargée au milieu d'une étape garde son temps
//              (dans l'appareil ET au serveur) ;
//   bilan      « Arrêter la séance » sur un bilan : le temps du bilan compte ;
//   une fois   onglet caché puis page fermée : le temps compte une fois,
//              pas deux, et un onglet caché ne compte pas.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const CODE = "7K3M9P";
const MERCREDI = "2026-11-11";
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp"};

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

// Léa a fait une séance mercredi (version 4 : sans journal), et l'entraînement
// raté a arrêté les nouveautés pour aujourd'hui : « Encore une séance », ce
// n'est que Mes calculs du jour — A2-1 et A2-2, en boîte 3, dus aujourd'hui.
function parcoursDeDepart(jour = MERCREDI) {
  return {
    version: 4, epoque: 0, prenom: "",
    modules: {A2: {vu: "2026-11-08", ok: null, b: [3, 3, 0, 0, 0], e: [jour, jour, null, null, null], a: [1, 1, 0, 0, 0], f: [1, 1, 0, 0, 0], x: [0, 0, 0, 0, 0], t: [0, 0, 0, 0, 0], c: {}}},
    seance: {jour: MERCREDI, etape: 0, n: 1, p: [0, 0, 0, 0, 3, 0, 0]},
    seances: [MERCREDI], jours: [MERCREDI]
  };
}

async function ouvrir(nav, base, {largeur = 390, hauteur = 844, jour = MERCREDI, parcours = parcoursDeDepart(), plein = false} = {}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, timezoneId: "Indian/Reunion"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${jour}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  await page.addInitScript(code => {
    sessionStorage.setItem("mathsgo-suivi-code", code);
    // Une horloge qu'on avance : le temps actif se mesure avec performance.now().
    window.__decalage = 0;
    const vrai = performance.now.bind(performance);
    performance.now = () => vrai() + window.__decalage;
  }, CODE);
  const serveur = {parcours, revision: 1, envois: []};
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const h = {"access-control-allow-origin": "*"};
    const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: h, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: {}});
    if (corps.lire) return rendre({ok: true, existe: true, parcours: serveur.parcours, revision: serveur.revision});
    serveur.revision += 1;
    serveur.parcours = corps.parcours;
    serveur.envois.push(corps.parcours);
    return rendre({ok: true, revision: serveur.revision});
  });
  await page.goto(base + PAGE);
  await page.waitForSelector("#acc-carte", {state: "visible"});
  await page.waitForTimeout(500);
  if (plein) {
    await page.click("[data-fullscreen-toggle]");
    await page.waitForTimeout(400);
  }
  return {page, ctx, erreurs, serveur};
}

const texte = (page, s) => page.evaluate(sel => {
  const e = document.querySelector(sel);
  return e && !e.hidden ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null;
}, s);
const boite = (page, s) => page.evaluate(sel => { const b = document.querySelector(sel).getBoundingClientRect(); return {haut: b.top, bas: b.bottom, gauche: b.left, droite: b.right}; }, s);

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };
  let apresSeance = null;

  await cas("journal : une séance jouée sur la page arrive au serveur avec son entrée", async () => {
    const s = await ouvrir(nav, base);
    await s.page.click("#acc-carte");
    for (let i = 0; i < 6; i += 1) {
      const c = await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul());
      if (!c) break;
      for (const signe of String(c.reponse).replace(".", ",")) await s.page.click(`#play [data-key="${signe}"]`);
      await s.page.click("#validate");
      // 20 s avant le geste suivant (après la réponse : le calcul juste reste
      // « rapide », la boîte monte).
      await s.page.evaluate(() => { window.__decalage += 20000; });
      await s.page.waitForTimeout(1300);
    }
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().seances.length === 2, null, {timeout: 8000});
    const p = await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours());
    assert.equal(p.version, 6, "version 6 depuis le correctif du lot S1 (le numéro des séances)");
    assert.deepEqual(p.seances, [MERCREDI, MERCREDI]);
    assert.equal(p.journal.numero[0], -1, "la séance d'avant le journal : pas de numéro");
    assert.equal(Math.floor(p.journal.numero[1] / 10000), 2, "la séance jouée : la 2e de la journée");
    assert.deepEqual([p.journal.calculs, p.journal.justes, p.journal.nouveautes, p.journal.prouvees, p.journal.rouges], [[-1, 2], [-1, 2], [-1, 0], [-1, 0], [-1, 0]]);
    assert.equal(p.journal.minutes[0], -1, "la séance d'avant le journal : pas connue");
    assert.ok(p.journal.minutes[1] >= 1, `durée : ${p.journal.minutes[1]} min`);
    assert.deepEqual(p.modules.A2.b.slice(0, 2), [4, 4]);
    assert.deepEqual(p.modules.A2.s.slice(0, 2), [MERCREDI, MERCREDI], "sues aujourd'hui");
    assert.deepEqual(p.seance.j, [0, 0, 0, 0, 0, 0]);
    await s.page.waitForTimeout(1500);
    const envoye = s.serveur.envois[s.serveur.envois.length - 1];
    assert.ok(envoye && envoye.journal && envoye.journal.calculs[1] === 2, "le journal est parti au serveur");
    apresSeance = envoye;
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  // Lot « accueil » (07/11/2026) : l'accueil refait lit la semaine du moteur.
  await cas("accueil : la pastille des soirs, les gains sur la porte et dans Mon parcours, « ↑ cette semaine »", async () => {
    assert.ok(apresSeance, "la séance a été jouée");
    for (const [largeur, hauteur] of [[390, 844], [1366, 657]]) {
      const s = await ouvrir(nav, base, {parcours: apresSeance, largeur, hauteur});
      const attendu = await s.page.evaluate(() => {
        const P = window.MATHSGO_DEFI_CALCUL_MON_PARCOURS;
        const sem = P.semaineEleve(window.__MATHSGO_DEFI_CALCUL_TEST__.parcours(), window.MATHSGO_DEFI_CALCUL_CORE.carte(), P.jourLocal());
        return {soirs: sem.soirs, sues: sem.sues};
      });
      assert.ok(attendu.soirs >= 1 && attendu.sues >= 2, JSON.stringify(attendu));
      assert.equal(await texte(s.page, "#acc-soirs"), `✓${attendu.soirs} soir${attendu.soirs > 1 ? "s" : ""} cette semaine`);
      assert.ok((await texte(s.page, "#acc-porte-note")).endsWith(` · +${attendu.sues} cette semaine`));
      assert.equal(await s.page.locator("#acc-semaine").count(), 0, "plus de ligne « N fois cette semaine »");
      const cadre = await boite(s.page, ".panel");
      if (largeur > 620) assert.ok(cadre.bas <= hauteur, `cadre entier (${Math.round(cadre.bas)} pour ${hauteur})`);
      await s.page.click("#acc-porte");
      await s.page.waitForTimeout(300);
      assert.equal(await texte(s.page, "#parcours-gains"), `+${attendu.sues} cette semaine`);
      assert.ok(await s.page.locator('#parcours-modules .dc-mod[data-module="A2"] small b.monte').count() >= 1, "A2 a avancé cette semaine");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    }
  });

  await cas("arrêter au milieu : le temps de l'étape compte quand même", async () => {
    const s = await ouvrir(nav, base);
    await s.page.click("#acc-carte");
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul(), null, {timeout: 5000});
    const c = await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul());
    await s.page.evaluate(() => { window.__decalage += 30000; });
    for (const signe of String(c.reponse).replace(".", ",")) await s.page.click(`#play [data-key="${signe}"]`);
    await s.page.click("#validate");
    await s.page.waitForTimeout(400);
    // La flèche de retour : la séance s'arrête au milieu de Mes calculs du jour.
    await s.page.click("#game-menu");
    await s.page.waitForTimeout(600);
    const p = await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours());
    assert.equal(p.seance.p[0], 1, "la séance reste ouverte");
    assert.equal(p.seance.j[0], 1, "un calcul du jour compté");
    assert.ok(p.seance.j[4] >= 30, `le temps de l'étape compte (${p.seance.j[4]} s)`);
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  // Les calculs du jour : tape la réponse du calcul à l'écran, puis Valider.
  const repondre = async page => {
    const c = await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul());
    for (const signe of String(c.reponse).replace(".", ",")) await page.click(`#play [data-key="${signe}"]`);
    await page.click("#validate");
  };
  const lireJ = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().seance.j);

  await cas("recharger au milieu d'une étape : le temps est gardé, dans l'appareil et au serveur", async () => {
    const s = await ouvrir(nav, base);
    await s.page.click("#acc-carte");
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul(), null, {timeout: 5000});
    // 40 s de réflexion, puis la réponse au 1er calcul.
    await s.page.evaluate(() => { window.__decalage += 40000; });
    await repondre(s.page);
    await s.page.waitForTimeout(300);
    assert.equal((await lireJ(s.page))[4], 0, "rien n'est encore versé : l'étape n'est pas finie");
    await s.page.reload();
    await s.page.waitForSelector("#acc-carte", {state: "visible"});
    await s.page.waitForTimeout(800);
    const j = await lireJ(s.page);
    assert.equal(j[0], 1, "le calcul fait est là, la séance toujours ouverte");
    assert.ok(j[4] >= 40 && j[4] < 45, `le temps de l'étape est gardé (${j[4]} s)`);
    await s.page.waitForTimeout(1500);
    const envoye = s.serveur.envois[s.serveur.envois.length - 1];
    assert.ok(envoye && envoye.seance.j[4] >= 40, `et au serveur (${envoye && envoye.seance.j[4]} s)`);
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await cas("« Arrêter la séance » sur un bilan : le temps passé sur le bilan compte", async () => {
    // Une séance à deux étapes : Mes calculs du jour, puis une nouveauté.
    const depart = parcoursDeDepart();
    depart.seance.p = [0, 0, 0, 0, 0, 0, 0];
    const s = await ouvrir(nav, base, {parcours: depart});
    await s.page.click("#acc-carte");
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul(), null, {timeout: 5000});
    for (let i = 0; i < 6; i += 1) {
      if (!(await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul()))) break;
      await s.page.evaluate(() => { window.__decalage += 10000; });
      await repondre(s.page);
      await s.page.waitForTimeout(1300);
    }
    await s.page.waitForSelector("#result button.arreter", {state: "visible", timeout: 8000});
    const avant = await lireJ(s.page);
    assert.equal(avant[0], 2, "Mes calculs du jour finis");
    assert.ok(avant[4] >= 20, `le temps de l'étape, versé à la fin (${avant[4]} s)`);
    // 50 s à lire le bilan, puis « Arrêter la séance ».
    await s.page.evaluate(() => { window.__decalage += 50000; });
    const envois = s.serveur.envois.length;
    await s.page.click("#result button.arreter");
    await s.page.waitForSelector("#acc-carte", {state: "visible"});
    const apres = await lireJ(s.page);
    assert.ok(apres[4] - avant[4] >= 50 && apres[4] - avant[4] < 55, `le bilan compte (+${apres[4] - avant[4]} s)`);
    await s.page.waitForTimeout(1500);
    assert.ok(s.serveur.envois.length > envois && s.serveur.envois[s.serveur.envois.length - 1].seance.j[4] === apres[4], "et c'est parti au serveur");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await cas("onglet caché puis page fermée : le temps compte une fois ; caché, il ne compte pas", async () => {
    const s = await ouvrir(nav, base);
    await s.page.click("#acc-carte");
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul(), null, {timeout: 5000});
    const visibilite = etat => s.page.evaluate(v => {
      Object.defineProperty(document, "visibilityState", {configurable: true, get: () => v});
      document.dispatchEvent(new Event("visibilitychange"));
    }, etat);
    // 25 s après le clic sur la séance, l'onglet se cache.
    await s.page.evaluate(() => { window.__decalage += 25000; });
    await visibilite("hidden");
    const cache = (await lireJ(s.page))[4];
    assert.ok(cache >= 25 && cache < 28, `versé en se cachant (${cache} s)`);
    await s.page.waitForTimeout(800);
    const parti = s.serveur.envois[s.serveur.envois.length - 1];
    assert.ok(parti && parti.seance.j[4] === cache, "et envoyé au serveur en se cachant");
    // 10 minutes cachées, puis la page se ferme : rien de plus.
    await s.page.evaluate(() => { window.__decalage += 600000; });
    await s.page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", {persisted: false})));
    assert.equal((await lireJ(s.page))[4], cache, "fermée après cachée : pas compté deux fois");
    // L'onglet revient : le compte reprend au premier geste, pas avant.
    await visibilite("visible");
    await s.page.evaluate(() => { window.__decalage += 120000; });
    await repondre(s.page);
    await s.page.evaluate(() => { window.__decalage += 15000; });
    await visibilite("hidden");
    const ensuite = (await lireJ(s.page))[4];
    assert.ok(ensuite - cache >= 15 && ensuite - cache < 18, `le temps caché ne compte pas, la suite oui (+${ensuite - cache} s)`);
    await visibilite("hidden");
    assert.equal((await lireJ(s.page))[4], ensuite, "caché deux fois : une seule fois");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await nav.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} échec(s).`); process.exit(1); }
  console.log("Défi calcul, lot G1 : journal et accueil conformes au navigateur.");
})();
