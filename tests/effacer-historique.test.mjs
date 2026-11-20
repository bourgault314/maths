// Lot « Effacer l'historique » (06/11/2026, choix de Gwenaël) : dans Anzan,
// Défi calcul et Défi tables, « Effacer mon historique » (avec une question
// « Effacer / Garder ») existe pour le VISITEUR SANS CODE seulement, et
// n'efface que la case « sans code » de l'appareil. L'élève à code ne peut
// plus rien effacer — Défi tables compris (« Recommencer à zéro » envoyait le
// parcours vide au serveur et vidait ce que le professeur voit dans Ma
// classe) : pas de bouton, et un clic forcé ne fait rien. Défi tables : plus
// de prénom demandé dans Mon parcours (seulement à l'impression de la fiche),
// et le menu « ⋯ » se pose par-dessus l'écran — rien ne bouge quand on l'ouvre.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL("../", import.meta.url));
const lire = chemin => readFileSync(resolve(racine, chemin), "utf8");
const ANZAN = lire("outils/calcul_mental/flash_anzan.html");
const CALCUL = lire("outils/calcul_mental/defi_calcul_modules.html");
const CALCUL_CSS = lire("outils/calcul_mental/defi_calcul.css");
const TABLES = lire("outils/calcul_mental/defi_tables.html");

// Le corps d'une fonction de la page, d'après son nom (jusqu'à l'accolade qui la ferme).
function corps(source, nom) {
  const debut = source.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, `fonction ${nom} introuvable`);
  let i = source.indexOf("{", debut), n = 0;
  for (; i < source.length; i += 1) {
    if (source[i] === "{") n += 1;
    else if (source[i] === "}" && (n -= 1) === 0) return source.slice(debut, i + 1);
  }
  throw new Error(nom);
}
function ecouteur(source, id) {
  const debut = source.indexOf(`$("${id}").addEventListener("click", () => {`);
  assert.ok(debut >= 0, `écouteur de ${id} introuvable`);
  return corps(source.slice(debut).replace(/^\$\("[^"]+"\)\.addEventListener\("click", \(\) => /, "function x() "), "x");
}

// ------------------------------------------------------------ ce que dit le code

test("Anzan : seul le visiteur sans code efface, et seulement la case « sans code »", () => {
  assert.match(corps(ANZAN, "peutEffacer"), /return caseVisiteur\(\) && !suiviActif\(\);/);
  const effacer = corps(ANZAN, "effacerHistorique");
  assert.match(effacer, /^function effacerHistorique\(\) \{\s*\n\s*if \(!peutEffacer\(\)\) return;/, "la garde en premier");
  assert.match(effacer, /PARCOURS\.effacer\(stockageAppareil\(\), ""\);/, "la case sans code, rien d'autre");
  assert.doesNotMatch(effacer, /SUIVI|envoy|CLE\b/, "rien vers le serveur, les réglages de l'appareil restent");
  assert.match(corps(ANZAN, "demanderEffacement"), /if \(!peutEffacer\(\)\) return;/);
  assert.match(ANZAN, /id="historique-effacer" hidden>Effacer mon historique</);
  assert.match(ANZAN, /Effacer tout ton historique&nbsp;\? Cette action ne peut pas être annulée\./);
});

test("Défi calcul : ni élève à code, ni élève qui arrive de son espace, ni mode professeur", () => {
  assert.match(corps(CALCUL, "peutEffacer"), /return !MODE_PROF && !suiviActif\(\) && !ENTREE\.billet && !entreeRefusee;/);
  const effacer = corps(CALCUL, "effacerHistorique");
  assert.match(effacer, /^function effacerHistorique\(\) \{\s*\n\s*if \(!peutEffacer\(\)\) return;/);
  assert.match(effacer, /PARCOURS\.effacer\(storage\(\), ""\);\s*\n\s*parcours = caseSansCode\(\);/);
  assert.doesNotMatch(effacer, /envoyer|sauverParcours/, "rien ne part au serveur");
  assert.match(ecouteur(CALCUL, "acc-effacer"), /if \(!peutEffacer\(\)\) return;/);
  // Lot « accueil » (07/11/2026) : une seule colonne ; « Comment ça marche ? »
  // et « Effacer mon historique » sur la même ligne, centrés ensemble ; la
  // question s'ouvre à la place de la porte et de la ligne.
  assert.match(CALCUL, /<div id="acc-bas" class="acc-bas">\s*<button id="acc-notice-bouton"[^>]*>Comment ça marche&nbsp;\?<\/button>\s*<button id="acc-effacer" class="lien-effacer" type="button" hidden>Effacer mon historique<\/button>/);
  assert.match(corps(CALCUL, "marquerEffacer"), /pied\.classList\.toggle\("est-ouverte", !\$\("acc-confirm"\)\.hidden\);/);
  assert.match(CALCUL_CSS, /\.acc-pied > \* \{ grid-area: 1 \/ 1; min-width: 0; \}/, "la question et le pied dans la même case");
  assert.match(CALCUL, /defi_calcul\.css\?v=2026111[0-9]-[0-9]+/, "la feuille modifiée change d'adresse (cache)");
});

test("Défi tables : la remise à zéro n'existe plus sous un code, même par un clic forcé", () => {
  assert.match(corps(TABLES, "peutEffacer"), /return !VUE_PROF && !suiviActif\(\) && !ENTREE\.billet && !entreeRefusee;/);
  const oui = ecouteur(TABLES, "parcours-confirm-yes");
  assert.match(oui, /^function x\(\) \{\s*\n(\s*\/\/[^\n]*\n)*\s*if \(VUE_PROF \|\| !peutEffacer\(\)\) return;\s*\n\s*parcours = PARCOURS\.remettreAZero\(parcours\);/);
  assert.doesNotMatch(oui, /envoyerAvantDeFermer/, "plus d'envoi immédiat du parcours vide");
  assert.match(ecouteur(TABLES, "parcours-reset"), /if \(VUE_PROF \|\| !peutEffacer\(\)\) return;/);
  assert.match(ecouteur(TABLES, "parcours-more"), /if \(VUE_PROF \|\| !peutEffacer\(\)\) return;/);
  assert.match(TABLES, /\$\("parcours-more"\)\.hidden = !VUE_PROF && !peutEffacer\(\);/, "le « ⋯ » disparaît pour l'élève à code");
  assert.match(TABLES, /<button id="parcours-reset" class="secondary" type="button">Effacer mon historique<\/button>/);
  assert.doesNotMatch(TABLES, /id="parcours-name"|id="parcours-rename"|state\.renaming|state\.nameSkipped/);
  // Le prénom de la fiche reste (R6).
  assert.match(TABLES, /<form id="fiche-prenom-form" class="fiche-prenom-form" hidden>/);
  // Le menu et la question se posent par-dessus l'écran.
  assert.match(TABLES, /\.parcours-options \{ position: absolute; top: calc\(100% \+ 8px\); right: 0; z-index: 40;/);
  assert.match(TABLES, /\.parcours-toolbar > \.parcours-confirm \{ position: absolute;/);
});

// ------------------------------------------------------------ au navigateur

const charger = createRequire(import.meta.url);
let navigateur;
try { navigateur = charger("playwright").chromium; } catch { /* Installation locale facultative en CI. */ }
const ignorer = navigateur ? false : "Playwright absent : exécuter ce contrôle dans l’environnement de revue équipé.";
const PLAFOND = 240000;

const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".webp": "image/webp", ".ico": "image/x-icon"};
let serveur = null, base = "";
async function demarrerServeur() {
  if (serveur) return base;
  serveur = createServer(async (req, res) => {
    const chemin = resolve(racine, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!chemin.startsWith(racine.replace(/[\\/]$/, "") + sep)) { res.writeHead(403); res.end(); return; }
    try { const d = await readFile(chemin); res.writeHead(200, {"Content-Type": TYPES[extname(chemin)] || "application/octet-stream"}); res.end(d); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(ok => serveur.listen(0, "127.0.0.1", ok));
  base = `http://127.0.0.1:${serveur.address().port}`;
  return base;
}
after(() => serveur && serveur.close());

// Un faux serveur de suivi qui RETIENT tout ce qu'on lui envoie : un élève à
// code qui arriverait à effacer enverrait un parcours d'époque plus haute.
function fauxSuivi(parcoursServeur, envois) {
  return async route => {
    const url = route.request().url();
    let c = {};
    try { c = JSON.parse(route.request().postData() || "{}"); } catch { c = {}; }
    const H = {"Access-Control-Allow-Origin": "*"};
    const json = d => route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(d), headers: H});
    if (url.includes("/api/eleve.php")) return json({ok: true, prenom: "Rania", classe: "405", applis: ["defi-tables", "flash-anzan", "defi-calcul"], reglages: {}});
    if (url.includes("/api/parcours.php")) {
      if (c.lire) return json(parcoursServeur ? {ok: true, existe: true, revision: 3, parcours: parcoursServeur} : {ok: true, existe: false});
      envois.push(c);
      return json({ok: true, revision: 4});
    }
    if (url.includes("/api/records.php")) return json({ok: true, records: []});
    if (url.includes("/api/direct.php")) return json({ok: true, seance: null});
    return route.fulfill({status: 404, body: "", headers: H});
  };
}

const APPLIS = {
  anzan: {page: "/outils/calcul_mental/flash_anzan.html", cle: "mathsgo-anzan-parcours", bouton: "#historique-effacer", oui: "#historique-confirm-oui", question: "#historique-confirm",
    graine: () => {
      const P = window.MathsGoFlashAnzanParcours;
      const r = {operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 10, calculs: 10, temps: 8, son: "bip"};
      let p = P.creer();
      [[11, "2026-11-02"], [12, "2026-11-05"]].forEach(([id, jour]) => { p = P.noterSeance(p, {id, mode: "flash", reglages: r, faits: 10, score: 8}, jour).parcours; });
      return JSON.parse(JSON.stringify(p));
    },
    avant: page => page.click("#vers-historique")},
  calcul: {page: "/outils/calcul_mental/defi_calcul_modules.html", cle: "mathsgo-defi-calcul-parcours", bouton: "#acc-effacer", oui: "#acc-confirm-oui", question: "#acc-confirm",
    graine: () => {
      const p = window.MATHSGO_DEFI_CALCUL_MON_PARCOURS.creerParcours();
      p.modules = {A1: {vu: "2026-11-02", ok: null, b: [5, 4, 2], e: ["2026-11-20", "2026-11-12", "2026-11-07"], a: [1, 1, 1], f: [0, 0, 0], x: [0, 0, 0], t: [0, 0, 0], c: {}}};
      p.jours = ["2026-11-02"];
      return p;
    },
    avant: async () => {}},
  tables: {page: "/outils/calcul_mental/defi_tables.html", cle: "mathsgo-defi-tables-parcours", bouton: "#parcours-reset", oui: "#parcours-confirm-yes", question: "#parcours-confirm",
    graine: () => {
      const P = window.MATHSGO_DEFI_TABLES_MON_PARCOURS;
      const p = P.creerParcours();
      p.tables[2].acquise = "2026-11-03";
      p.jours = ["2026-11-03"]; p.seances = ["2026-11-03"]; p.rang = 1;
      return JSON.parse(JSON.stringify(P.normaliserParcours(p)));
    },
    avant: async (page, eleve) => { await page.click("#open-parcours"); if (!eleve) await page.click("#parcours-more"); }}
};

async function ouvrir(nav, nom, {largeur, hauteur, eleve}) {
  const A = APPLIS[nom];
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, isMobile: largeur < 700, hasTouch: largeur < 700, timezoneId: "Indian/Reunion"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date("2026-11-06T17:00:00+04:00")});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(String(e)));
  // La graine, fabriquée par le moteur de la page elle-même.
  await ctx.route("https://suivi.mathsgo.re/**", r => r.abort());
  await page.goto(base + A.page, {waitUntil: "load"});
  const graine = await page.evaluate(A.graine);
  const envois = [];
  if (eleve) {
    await ctx.unroute("https://suivi.mathsgo.re/**");
    await ctx.route("https://suivi.mathsgo.re/**", fauxSuivi(graine, envois));
    await ctx.addInitScript(() => sessionStorage.setItem("mathsgo-suivi-code", "ABC234"));
  } else {
    await page.evaluate(([cle, g]) => { localStorage.setItem(cle, JSON.stringify(g)); localStorage.setItem("mathsgo-flash-anzan-v1", JSON.stringify({mode: "colonne"})); }, [A.cle, graine]);
  }
  await page.reload({waitUntil: "load"});
  await page.waitForTimeout(900);
  return {ctx, page, erreurs, envois};
}

const TAILLES = [[1440, 900], [390, 844]];

test("le visiteur sans code : le bouton, la question, « Garder » ne touche à rien, « Effacer » vide la case sans code et elle seule", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const nom of Object.keys(APPLIS)) {
      for (const [largeur, hauteur] of TAILLES) {
        const A = APPLIS[nom];
        const ou = `${nom} ${largeur}`;
        const {ctx, page, erreurs} = await ouvrir(nav, nom, {largeur, hauteur, eleve: false});
        await A.avant(page, false);
        assert.ok(await page.isVisible(A.bouton), `${ou} : le bouton est là`);
        assert.equal((await page.textContent(A.bouton)).trim(), "Effacer mon historique", `${ou} : son texte`);
        await page.click(A.bouton);
        assert.ok(await page.isVisible(A.question), `${ou} : la question`);
        assert.match(await page.textContent(A.question), /Effacer tout ton historique\s?\? Cette action ne peut pas être annulée\./);
        await page.click(`${A.question} button:not(.danger)`);
        assert.ok(await page.evaluate(cle => Boolean(localStorage.getItem(cle)), A.cle), `${ou} : « Garder » ne touche à rien`);
        if (nom === "tables") await page.click("#parcours-more"); // le menu s'est refermé
        await page.click(A.bouton);
        await page.click(A.oui);
        await page.waitForTimeout(300);
        const reste = await page.evaluate(cle => {
          const brut = localStorage.getItem(cle);
          return {brut, reglages: localStorage.getItem("mathsgo-flash-anzan-v1")};
        }, A.cle);
        if (nom === "tables") {
          // Défi tables : le parcours remis à zéro (époque + 1), rien d'autre dedans.
          const p = JSON.parse(reste.brut);
          assert.equal(p.epoque, 1, `${ou} : époque + 1`);
          assert.ok(!p.tables[2].acquise && !p.jours.length, `${ou} : la progression est partie`);
        } else {
          assert.equal(reste.brut, null, `${ou} : la case sans code est effacée`);
        }
        assert.ok(reste.reglages, `${ou} : les autres clés de l'appareil restent`);
        assert.deepEqual(erreurs, [], `${ou} : aucune erreur`);
        await ctx.close();
      }
    }
  } finally { await nav.close(); }
});

test("l'élève à code : pas de bouton, pas de « ⋯ » dans Défi tables, et un clic forcé n'efface ni n'envoie rien", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const nom of Object.keys(APPLIS)) {
      for (const [largeur, hauteur] of TAILLES) {
        const A = APPLIS[nom];
        const ou = `${nom} ${largeur} (élève)`;
        const {ctx, page, erreurs, envois} = await ouvrir(nav, nom, {largeur, hauteur, eleve: true});
        await A.avant(page, true);
        assert.match(await page.textContent("#suivi-repere"), /Rania/, `${ou} : l'élève est bien suivi (sinon le contrôle ne prouve rien)`);
        assert.equal(await page.isVisible(A.bouton), false, `${ou} : pas de bouton`);
        if (nom === "tables") assert.equal(await page.isVisible("#parcours-more"), false, `${ou} : pas de « ⋯ »`);
        const avant = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
        const nbEnvois = envois.length;
        await page.evaluate(([b, o]) => { document.querySelector(b).click(); document.querySelector(o).click(); }, [A.bouton, A.oui]);
        await page.waitForTimeout(1500);
        const apres = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
        for (const [cle, valeur] of Object.entries(avant)) {
          if (!/parcours/.test(cle) || /sync/.test(cle)) continue;
          assert.equal(apres[cle], valeur, `${ou} : la case ${cle} n'a pas bougé`);
        }
        assert.equal(envois.length, nbEnvois, `${ou} : rien n'est parti au serveur`);
        assert.equal(await page.isVisible(A.question), false, `${ou} : aucune question ouverte`);
        assert.deepEqual(erreurs, [], `${ou} : aucune erreur`);
        await ctx.close();
      }
    }
  } finally { await nav.close(); }
});

test("Défi tables : le « ⋯ » et la question se posent par-dessus — rien ne bouge ; toucher ailleurs referme", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const [largeur, hauteur] of TAILLES) {
      const {ctx, page, erreurs} = await ouvrir(nav, "tables", {largeur, hauteur, eleve: false});
      await page.click("#open-parcours");
      const haut = () => page.evaluate(() => document.getElementById("parcours-matable").getBoundingClientRect().top);
      const h0 = await haut();
      await page.click("#parcours-more");
      assert.ok(await page.isVisible("#parcours-options"));
      assert.equal(await haut(), h0, `${largeur} : le menu ouvert, rien ne descend`);
      await page.click("#parcours-reset");
      assert.ok(await page.isVisible("#parcours-confirm"));
      assert.equal(await haut(), h0, `${largeur} : la question ouverte, rien ne descend`);
      const boite = await page.evaluate(() => { const r = document.getElementById("parcours-confirm").getBoundingClientRect(); return {g: r.left, d: r.right}; });
      assert.ok(boite.g >= 0 && boite.d <= largeur, `${largeur} : la question tient dans la largeur`);
      await page.mouse.click(20, hauteur - 40);
      assert.equal(await page.isVisible("#parcours-confirm"), false, `${largeur} : toucher ailleurs vaut « Garder »`);
      assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem("mathsgo-defi-tables-parcours")).tables[2].acquise), "rien n'est effacé");
      assert.deepEqual(erreurs, []);
      await ctx.close();
    }
  } finally { await nav.close(); }
});

test("Défi calcul (ordinateur) : les deux liens sur la même ligne, centrés ensemble sous la porte ; sans rien à effacer, « Comment ça marche ? » seul et centré ; la question n'agrandit pas le cadre", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const eleve of [false, true]) {
      const {ctx, page, erreurs} = await ouvrir(nav, "calcul", {largeur: 1440, hauteur: 900, eleve});
      const mesurer = () => page.evaluate(() => {
        const r = s => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return {haut: b.top, bas: b.bottom, centre: (b.left + b.right) / 2, g: b.left, d: b.right}; };
        return {notice: r("#acc-notice-bouton"), effacer: document.getElementById("acc-effacer").hidden ? null : r("#acc-effacer"),
          module: r(".acc .matable"), porte: r("#acc-porte"), acc: r(".acc"), cadre: r(".panel"), echelle: getComputedStyle(document.documentElement).getPropertyValue("--echelle")};
      });
      const m = await mesurer();
      assert.ok(Math.abs(m.porte.centre - m.module.centre) < 2, "la porte de Mon parcours centrée sous Mon module");
      if (!eleve) {
        assert.ok(Math.abs(m.notice.haut - m.effacer.haut) < 2, "visiteur : même ligne");
        // (Avec « Mode professeur », 07/11/2026 : les trois liens centrés ensemble.)
        const ligne = await page.evaluate(() => { const b = [...document.querySelectorAll("#acc-bas > *")].filter(e => !e.hidden).map(e => e.getBoundingClientRect()); return (Math.min(...b.map(r => r.left)) + Math.max(...b.map(r => r.right))) / 2; });
        assert.ok(Math.abs(ligne - m.acc.centre) < 3, "les liens centrés ensemble");
        await page.click("#acc-effacer");
        const q = await mesurer();
        assert.equal(await page.isVisible("#acc-porte"), false, "la question prend la place de la porte");
        assert.equal(q.echelle, m.echelle, "le cadre ne change pas de taille");
        assert.ok(Math.abs(q.module.haut - m.module.haut) < 1, "rien au-dessus ne bouge");
        await page.click("#acc-confirm-non");
        assert.ok(await page.isVisible("#acc-porte"));
      } else {
        assert.equal(m.effacer, null);
        assert.ok(Math.abs(m.notice.centre - m.acc.centre) < 2, "élève : centré");
      }
      assert.deepEqual(erreurs, []);
      await ctx.close();
    }
  } finally { await nav.close(); }
});
