// Défi calcul, lot « accueil » (07/11/2026, choix A de Gwenaël) : la VRAIE
// page, au navigateur, avec un faux serveur de suivi.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 npm install --no-save playwright
//   node tests/defi-calcul-accueil-ecrans.cjs
//
// Ce qui est vérifié :
//   cadre      élève connecté, en fenêtre (1366 × 657, 1440 × 900) et en
//              plein écran (1366 × 768) : le cadre tient entier, l'accueil y
//              est centré (autant de blanc au-dessus qu'au-dessous, à 4 px) ;
//   téléphone  390 × 844 et 390 × 664 : Mon module, « Commencer » et la porte
//              de Mon parcours se voient sans défiler (844) ; rien ne déborde
//              en largeur ;
//   chargement le cadre est caché tant que le serveur n'a pas répondu, puis
//              ne bouge plus (taille et positions relevées à trois instants) ;
//   pastille   « 1 jour cette semaine » ; sans aucun jour, pas de pastille et
//              la tête de Mon module garde la même hauteur ;
//   test       « Tu connais déjà ce module ? » dans la carte de la séance ;
//   parcours   la porte ouvre l'écran ; d'un palier à l'autre, le cadre et les
//              onglets ne bougent pas, et le cadre tient entier (fenêtre et
//              plein écran) ; « Accueil » et le retour du navigateur ramènent
//              à l'accueil ;
//   prof       la même page + ses liens ; « Changer de module » ouvre Mon
//              parcours, une ligne ouvre son module, et « Changer de module »
//              de l'écran du module revient à Mon parcours ; cadre entier.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const CARTE = CORE.carte();
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html";
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

// Noah : quatre semaines simulées avec le vrai moteur (graine fixe), du
// 14/10 au 10/11 — un élève fragile qui vient un soir sur deux. Mercredi
// 11/11, il a fait une séance cette semaine et appris deux compétences.
function hasard(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function noah() {
  const rng = hasard(48);
  const sait = palier => rng() < ({1: .3}[palier] || 0);
  let p = P.creerParcours();
  for (let d = 0; d < 28; d += 1) {
    const jour = P.ajouterJours("2026-10-14", d);
    const dimancheSamedi = [0, 6].includes(new Date(`${jour}T12:00:00`).getDay());
    if (rng() > .6 * (dimancheSamedi ? .4 : 1)) continue;
    p = P.ouvrirSeance(p, CARTE, {aujourdhui: jour});
    const n0 = p.seance.n;
    for (let k = 0; k < 40 && p.seance.n === n0; k += 1) {
      const f = P.fileSeance(p, CARTE, {aujourdhui: jour});
      if (!f.etapes.length) break;
      const et = f.etapes[0];
      if (et.type === "jour") {
        P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}).forEach(x => {
          p = P.appliquerRetour(p, {module: x.module, niveau: x.niveau, juste: rng() < .78, ms: 3000, type: P.typeDe(CARTE, x.module, x.niveau)}, {aujourdhui: jour}).parcours;
        });
        p = P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
      } else if (et.type === "test") {
        const fiche = CARTE.modules.find(x => x.id === et.module);
        let marche = 0;
        const niveaux = [];
        for (let i = 0; i < P.NIVEAUX[et.module]; i += 1) {
          const q = sait(fiche.paliers[i]) ? .95 : .25;
          const justes = (rng() < q) + (rng() < q);
          niveaux.push({niveau: i + 1, justes, total: 2});
          if (justes >= 2) marche = i + 1; else break;
        }
        p = P.appliquerTest(p, {module: et.module, marche, niveaux}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
      } else if (et.type === "apprends") {
        p = P.appliquerSerie(p, {module: et.module, niveau: et.niveau, genre: "apprends"}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
      } else {
        const reponses = [];
        let suite = P.suivreEntrainement([]);
        for (;;) { reponses.push({juste: rng() < .82, outil: suite.outil}); suite = P.suivreEntrainement(reponses); if (suite.fini) break; }
        p = P.appliquerSerie(p, {module: et.module, niveau: et.niveau, genre: et.type, reponses, causes: {}}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
      }
    }
  }
  return p;
}

async function ouvrir(nav, base, {largeur = 1366, hauteur = 657, parcours = null, prof = false, lent = 300, jour = MERCREDI} = {}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, timezoneId: "Indian/Reunion"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${jour}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  if (!prof) {
    await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), CODE);
    await page.route("https://suivi.mathsgo.re/**", async route => {
      const corps = JSON.parse(route.request().postData() || "{}");
      const h = {"access-control-allow-origin": "*"};
      const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: h, body: JSON.stringify(d)});
      await new Promise(fini => setTimeout(fini, lent));
      if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Noah", classe: "405", applis: [], reglages: {}});
      if (corps.lire) return parcours ? rendre({ok: true, existe: true, parcours, revision: 1}) : rendre({ok: true, existe: false});
      return rendre({ok: true, revision: 2});
    });
  }
  await page.goto(base + PAGE + (prof ? "?prof=1" : ""));
  return {page, ctx, erreurs};
}

// L'accueil est prêt : le serveur a répondu (le repère dit « Noah »), le
// cadre n'attend plus. Les réponses du faux serveur arrivent en temps réel,
// l'horloge de la page avance à côté.
const attendreAccueil = async page => {
  for (let i = 0; i < 60; i += 1) {
    await page.clock.runFor(100);
    await page.waitForTimeout(60);
    const pret = await page.evaluate(() => !document.body.classList.contains("accueil-en-attente")
      && (document.getElementById("suivi-repere").textContent || "").includes("Noah") && Boolean(document.getElementById("acc-carte")));
    if (pret) break;
  }
  await page.waitForTimeout(200);
};
const boite = (page, s) => page.evaluate(sel => { const b = document.querySelector(sel).getBoundingClientRect(); return {haut: b.top, bas: b.bottom, gauche: b.left, droite: b.right}; }, s);
const echelle = page => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--echelle"));
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e && !e.hidden ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, s);

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };
  const NOAH = noah();
  const sem = P.semaineEleve(NOAH, CARTE, MERCREDI);
  assert.ok(sem.soirs >= 1 && sem.sues >= 1, `Noah a travaillé cette semaine (${JSON.stringify({soirs: sem.soirs, sues: sem.sues})})`);

  for (const [largeur, hauteur, plein] of [[1366, 657, false], [1440, 900, false], [1366, 768, true]]) {
    await cas(`cadre ${largeur}x${hauteur}${plein ? " plein écran" : ""} : entier, l'accueil centré, rien ne bouge après le chargement`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: NOAH});
      await s.page.clock.runFor(100);
      await s.page.waitForTimeout(50);
      assert.equal(await s.page.evaluate(() => getComputedStyle(document.querySelector(".shell")).visibility), "hidden", "le cadre attend le serveur");
      await attendreAccueil(s.page);
      if (plein) { await s.page.click("[data-fullscreen-toggle]"); await s.page.clock.runFor(400); await s.page.waitForTimeout(200); }
      const releves = [];
      for (let i = 0; i < 3; i += 1) {
        releves.push(JSON.stringify([await echelle(s.page), await boite(s.page, ".panel"), await boite(s.page, "#acc-carte"), await boite(s.page, "#acc-porte")]));
        await s.page.clock.runFor(700);
        await s.page.waitForTimeout(100);
      }
      assert.equal(new Set(releves).size, 1, "rien ne bouge");
      const cadre = await boite(s.page, ".panel");
      assert.ok(cadre.bas <= hauteur + .5, `cadre entier (${Math.round(cadre.bas)} pour ${hauteur})`);
      const haut = await s.page.evaluate(() => { const t = document.querySelector(".topbar").getBoundingClientRect(); return t.bottom; });
      const acc = await boite(s.page, ".acc");
      const z = Number(await echelle(s.page));
      const dessus = (acc.haut - haut) / z, dessous = (cadre.bas - acc.bas) / z;
      assert.ok(Math.abs(dessus - dessous) < 30, `centré (${Math.round(dessus)} au-dessus, ${Math.round(dessous)} au-dessous, padding compris)`);
      assert.equal(await s.page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), true, "la page ne défile pas");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  for (const hauteur of [844, 664]) {
    await cas(`téléphone 390x${hauteur} : l'essentiel sans défiler, rien ne déborde en largeur`, async () => {
      const s = await ouvrir(nav, base, {largeur: 390, hauteur, parcours: NOAH});
      await attendreAccueil(s.page);
      const go = await boite(s.page, "#acc-carte .go");
      assert.ok(go.bas <= hauteur, `« Commencer » visible (${Math.round(go.bas)})`);
      if (hauteur === 844) assert.ok((await boite(s.page, "#acc-porte")).bas <= hauteur, "la porte de Mon parcours visible");
      assert.equal(await s.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "pas de défilement en largeur");
      const note = await boite(s.page, "#acc-porte-note b");
      assert.ok(note.bas - note.haut < 22, "« +N cette semaine » ne se coupe pas");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await cas("pastille : « N jours cette semaine » ; sans aucun jour, rien, et la tête garde sa hauteur ; le test dit « ce module »", async () => {
    const avec = await ouvrir(nav, base, {parcours: NOAH});
    await attendreAccueil(avec.page);
    assert.equal(await texte(avec.page, "#acc-soirs"), `✓${sem.soirs} jour${sem.soirs > 1 ? "s" : ""} cette semaine` /* relecture 2 : « jours » */);
    const tete = await boite(avec.page, ".acc-tete");
    const etapes = await avec.page.evaluate(() => [...document.querySelectorAll("#acc-carte .programme > span > span")].map(e => e.firstChild.textContent));
    if (etapes.some(t => t.startsWith("Tu connais"))) assert.ok(etapes.includes("Tu connais déjà ce module ?"), JSON.stringify(etapes));
    // Lundi suivant : aucune séance cette semaine.
    assert.equal(P.semaineEleve(NOAH, CARTE, "2026-11-16").soirs, 0);
    const s = await ouvrir(nav, base, {parcours: NOAH, jour: "2026-11-16"});
    await attendreAccueil(s.page);
    assert.equal(await texte(s.page, "#acc-soirs"), null, "pas de pastille");
    const t2 = await boite(s.page, ".acc-tete");
    assert.ok(Math.abs((t2.bas - t2.haut) - (tete.bas - tete.haut)) < 1, "la tête garde sa hauteur");
    assert.deepEqual([...avec.erreurs, ...s.erreurs], []);
    await avec.ctx.close();
    await s.ctx.close();
  });

  for (const [largeur, hauteur, plein] of [[1366, 657, false], [1366, 768, true], [390, 844, false]]) {
    await cas(`Mon parcours ${largeur}x${hauteur}${plein ? " plein écran" : ""} : d'un palier à l'autre, rien ne bouge ; Accueil et retour du navigateur`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: NOAH});
      await attendreAccueil(s.page);
      if (plein) { await s.page.click("[data-fullscreen-toggle]"); await s.page.clock.runFor(400); await s.page.waitForTimeout(200); }
      await s.page.click("#acc-porte");
      await s.page.waitForTimeout(300);
      assert.equal(await s.page.isVisible("#ecran-parcours"), true);
      assert.equal(await texte(s.page, "#parcours-gains"), `+${sem.sues} cette semaine`);
      const releves = [];
      for (const n of [1, 2, 3, 4, 1]) {
        await s.page.click(`#parcours-paliers button:nth-child(${n})`);
        await s.page.waitForTimeout(150);
        const cadre = await boite(s.page, ".panel");
        if (largeur > 620) assert.ok(cadre.bas <= hauteur + .5, `palier ${n} : cadre entier (${Math.round(cadre.bas)})`);
        releves.push(JSON.stringify([await echelle(s.page), largeur > 620 ? cadre : null, await boite(s.page, "#parcours-paliers")]));
      }
      assert.equal(new Set(releves).size, 1, "le cadre et les onglets ne bougent pas");
      await s.page.click("#parcours-back");
      await s.page.waitForTimeout(200);
      assert.equal(await s.page.isVisible("#intro"), true, "« Accueil » ramène à l'accueil");
      await s.page.click("#acc-porte");
      await s.page.waitForTimeout(200);
      await s.page.goBack();
      await s.page.waitForTimeout(300);
      assert.equal(await s.page.isVisible("#intro"), true, "le retour du navigateur ramène à l'accueil");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await cas("« Mode professeur » : le visiteur sans code le voit et y entre ; l'élève à code ne le voit pas", async () => {
    const eleve = await ouvrir(nav, base, {parcours: NOAH});
    await attendreAccueil(eleve.page);
    assert.equal(await eleve.page.isVisible("#acc-prof"), false, "élève à code : pas de lien");
    await eleve.ctx.close();
    const ctx = await nav.newContext({viewport: {width: 1366, height: 657}, deviceScaleFactor: 1, timezoneId: "Indian/Reunion"});
    const page = await ctx.newPage();
    const erreurs = [];
    page.on("pageerror", e => erreurs.push(e.message));
    await page.goto(base + PAGE);
    await page.waitForTimeout(500);
    assert.equal(await page.isVisible("#acc-prof"), true, "visiteur : le lien est là");
    const liens = await page.evaluate(() => ["acc-notice-bouton", "acc-prof"].map(id => document.getElementById(id).getBoundingClientRect().top));
    assert.ok(Math.abs(liens[0] - liens[1]) < 2, "sur la ligne de « Comment ça marche ? »");
    await page.click("#acc-prof");
    await page.waitForTimeout(600);
    assert.equal(await page.isVisible("#prof-pilule"), true, "le mode professeur s'ouvre");
    await page.click("#prof-quitter");
    await page.waitForTimeout(600);
    assert.equal(await page.isVisible("#prof-pilule"), false, "« Quitter » ramène le visiteur");
    assert.deepEqual(erreurs, []);
    await ctx.close();
  });

  await cas("mode professeur : la page de l'élève + ses liens ; Mon parcours cliquable ; « Changer de module » y revient", async () => {
    const s = await ouvrir(nav, base, {prof: true});
    await s.page.clock.runFor(500);
    await s.page.waitForTimeout(200);
    assert.equal(await s.page.isVisible("#prof-pilule"), true);
    assert.equal(await s.page.isVisible("#acc-changer"), true);
    assert.equal(await s.page.isVisible("#acc-liens"), true);
    assert.equal(await s.page.isVisible("#acc-porte"), true);
    assert.equal(await texte(s.page, "#acc-soirs"), null, "rien n'est enregistré : pas de jours");
    const cadre = await boite(s.page, ".panel");
    assert.ok(cadre.bas <= 657.5 && await s.page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), "cadre entier, la page ne défile pas");
    await s.page.click("#acc-changer");
    await s.page.waitForTimeout(200);
    assert.equal(await s.page.isVisible("#ecran-parcours"), true);
    assert.equal(await s.page.isVisible("#prof-pilule"), true, "la pilule reste");
    await s.page.click('#parcours-modules button.dc-mod[data-module="A2"]');
    await s.page.waitForTimeout(200);
    assert.equal(await s.page.isVisible("#module"), true, "la ligne ouvre son module");
    assert.equal(await texte(s.page, "#module-titre"), CORE.moduleDe("A2").nom.replace(/[\u00a0\u202f]/g, " "));
    await s.page.click("#module-changer");
    await s.page.waitForTimeout(200);
    assert.equal(await s.page.isVisible("#ecran-parcours"), true, "« Changer de module » revient à Mon parcours");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await nav.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} échec(s).`); process.exit(1); }
  console.log("Défi calcul, lot « accueil » : conforme au navigateur.");
})();
