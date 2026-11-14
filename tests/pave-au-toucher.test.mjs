// Lot « pavé au toucher » (14/11/2026) — retour des élèves sur les records de
// Défi tables : « sur téléphone, des fois, la touche n'est pas prise ».
//
// Cause mesurée : le pavé écrivait le chiffre au CLIC, quand le doigt se
// relève. Au téléphone, un 2e pouce posé avant que le 1er se relève (taper
// « 56 » vite, à deux pouces), ou un doigt qui glisse un peu, annule le clic :
// le chiffre se perd (les deux, même, quand les pouces se chevauchent).
//
// Correctif, le même dans les quatre pages qui ont un pavé contre la montre
// (Défi tables, Défi calcul, l'ancien Défi calcul, Flash Anzan) :
// brancherAuToucher() fait agir une touche du pavé, et Valider, dès que le
// doigt TOUCHE (pointerdown « touch ») ; le touchend annulé empêche le clic qui
// suivrait (ni chiffre en double, ni clic fantôme sur un bouton apparu sous
// le doigt) ; la souris, le clavier et les lecteurs d'écran passent par le clic.
//
// Ce qui se vérifie ici :
//   - au code : la même fonction dans les quatre pages, branchée sur toutes les
//     touches du pavé et sur Valider, et plus aucun ancien écouteur de clic ;
//   - en Node : la fonction elle-même, avec un faux bouton (toucher, souris,
//     clavier, bouton désactivé, appui sans clic) ;
//   - au navigateur (Chromium, doigts simulés par le protocole DevTools ;
//     sauté sans Playwright, obligatoire dans « npm run verifier ») : deux
//     pouces qui se chevauchent, doigt qui glisse, même touche deux fois vite,
//     souris, clavier, Valider pendant que l'autre pouce tient le dernier
//     chiffre, et le bouton-piège posé sous le doigt au moment de Valider.

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
const PAGES = {
  "Défi tables": lire("outils/calcul_mental/defi_tables.html"),
  "Défi calcul": lire("outils/calcul_mental/defi_calcul_modules.html"),
  "ancien Défi calcul": lire("outils/calcul_mental/defi_calcul.html"),
  "Flash Anzan": lire("outils/calcul_mental/flash_anzan.html"),
};

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

// ------------------------------------------------------------ ce que dit le code

test("la même fonction brancherAuToucher dans les quatre pages", () => {
  const reference = corps(PAGES["Défi tables"], "brancherAuToucher");
  for (const [nom, source] of Object.entries(PAGES)) {
    assert.equal(corps(source, "brancherAuToucher"), reference, `${nom} : la fonction diffère de celle de Défi tables`);
  }
  assert.match(reference, /event\.pointerType !== "touch" \|\| bouton\.disabled/, "seul le doigt agit au toucher, jamais sur un bouton désactivé");
  assert.match(reference, /addEventListener\("touchend", event => \{\s*if \(toucheA && event\.cancelable\) event\.preventDefault\(\);/, "le clic qui suivrait est empêché");
});

test("toutes les touches du pavé et Valider passent par brancherAuToucher, plus aucun ancien écouteur de clic", () => {
  for (const nom of ["Défi tables", "Défi calcul", "ancien Défi calcul"]) {
    const source = PAGES[nom];
    assert.match(source, /document\.querySelectorAll\("\[data-key\]"\)\.forEach\(button => brancherAuToucher\(button, \(\) => \{/, `${nom} : le pavé`);
    assert.match(source, /brancherAuToucher\(\$\("validate"\), \(\) => next\(false\)\);/, `${nom} : Valider`);
    assert.doesNotMatch(source, /querySelectorAll\("\[data-key\]"\)\.forEach\(button => button\.addEventListener\("click"/, `${nom} : ancien écouteur du pavé`);
    assert.doesNotMatch(source, /\$\("validate"\)\.addEventListener\("click"/, `${nom} : ancien écouteur de Valider`);
  }
  const anzan = PAGES["Flash Anzan"];
  assert.match(anzan, /\$\("keypad"\)\.querySelectorAll\("button\[data-key\]"\)\.forEach\(b => brancherAuToucher\(b, \(\) => touche\(b\.dataset\.key\)\)\);/);
  assert.match(anzan, /brancherAuToucher\(\$\("valider"\), \(\) => valider\(false\)\);/);
  assert.doesNotMatch(anzan, /\$\("keypad"\)\.addEventListener\("click"/);
  assert.doesNotMatch(anzan, /\$\("valider"\)\.addEventListener\("click"/);
  // « Passer » reste au clic : passer un calcul par mégarde coûte plus cher
  // qu'un appui à refaire.
  assert.match(PAGES["Défi tables"], /\$\("skip"\)\.addEventListener\("click", \(\) => next\(true\)\);/);
});

// ------------------------------------------------------------ la fonction, en Node

function monter() {
  let maintenant = 1_000_000;
  const horloge = {now: () => maintenant};
  const brancher = new Function("Date", `${corps(PAGES["Défi tables"], "brancherAuToucher")}\nreturn brancherAuToucher;`)(horloge);
  const ecouteurs = {};
  const bouton = {disabled: false, addEventListener(type, fn) { (ecouteurs[type] ||= []).push(fn); }};
  let actions = 0;
  brancher(bouton, () => { actions += 1; });
  const envoyer = (type, champs = {}) => {
    const evenement = {cancelable: true, empeche: false, preventDefault() { this.empeche = true; }, ...champs};
    (ecouteurs[type] || []).forEach(fn => fn(evenement));
    return evenement;
  };
  return {bouton, envoyer, actions: () => actions, avancer: ms => { maintenant += ms; }};
}

test("au doigt : agit au toucher, une seule fois, et empêche le clic qui suit", () => {
  const b = monter();
  b.envoyer("pointerdown", {pointerType: "touch"});
  assert.equal(b.actions(), 1, "le chiffre est écrit dès le toucher");
  assert.equal(b.envoyer("touchend").empeche, true, "le clic du même appui est empêché");
  b.envoyer("click", {detail: 1});
  assert.equal(b.actions(), 1, "un clic qui passerait quand même n'écrit pas une 2e fois");
});

test("à la souris, au clavier, au lecteur d'écran : le clic agit, comme avant", () => {
  const souris = monter();
  souris.envoyer("pointerdown", {pointerType: "mouse", button: 0});
  assert.equal(souris.actions(), 0, "rien au bouton enfoncé");
  souris.envoyer("click", {detail: 1});
  assert.equal(souris.actions(), 1);
  const clavier = monter();
  clavier.envoyer("click", {detail: 0});
  assert.equal(clavier.actions(), 1, "Entrée ou Espace sur la touche");
  // Un toucher dont le clic n'est jamais venu, puis le clavier : le clavier agit.
  const melange = monter();
  melange.envoyer("pointerdown", {pointerType: "touch"});
  melange.envoyer("click", {detail: 0});
  assert.equal(melange.actions(), 2);
  // Un toucher sans clic (annulé), puis, longtemps après, un clic de souris : il agit.
  const tard = monter();
  tard.envoyer("pointerdown", {pointerType: "touch"});
  tard.avancer(5000);
  tard.envoyer("click", {detail: 1});
  assert.equal(tard.actions(), 2);
});

test("un bouton désactivé ne fait rien au toucher, et ne bloque pas le clic", () => {
  const b = monter();
  b.bouton.disabled = true;
  b.envoyer("pointerdown", {pointerType: "touch"});
  assert.equal(b.actions(), 0);
  assert.equal(b.envoyer("touchend").empeche, false);
});

// ------------------------------------------------------------ au navigateur

const charger = createRequire(import.meta.url);
let navigateur;
try { navigateur = charger("playwright").chromium; } catch { /* Installation locale facultative en CI. */ }
const ignorer = navigateur ? false : "Playwright absent : exécuter ce contrôle dans l’environnement de revue équipé.";
const PLAFOND = 240000;
const lancer = () => navigateur.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});

const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".webp": "image/webp",
  ".ico": "image/x-icon", ".mp3": "audio/mpeg", ".wav": "audio/wav"};
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
after(() => { if (serveur) serveur.close(); });

const attendre = ms => new Promise(ok => setTimeout(ok, ms));

// Chaque page, ouverte au téléphone jusqu'à la case de la réponse.
const APPLIS = {
  "Défi tables": {
    async ouvrir(page) {
      await page.goto(`${base}/outils/calcul_mental/defi_tables.html?test`);
      await page.getByText("Réglages libres").click();
      await page.locator('[data-table="7"]').first().click();
      await page.locator("#start").click();
      if (await page.locator("#launch-start").isVisible()) await page.locator("#launch-start").click();
      await page.waitForFunction(() => !document.querySelector('.keypad [data-key="5"]').disabled && document.getElementById("expression").textContent.includes("="), null, {timeout: 10000});
    },
    lire: page => page.evaluate(() => document.getElementById("inline-answer").textContent.trim()),
    touche: c => `.keypad [data-key="${c}"]`, valider: "#validate",
  },
  "Défi calcul": {
    async ouvrir(page) {
      await page.goto(`${base}/outils/calcul_mental/defi_calcul_modules.html?test&prof=1&module=A4&niveau=4`);
      await page.getByText("Je m’entraîne").first().click();
      await page.waitForFunction(() => document.getElementById("inline-answer"), null, {timeout: 10000});
    },
    lire: page => page.evaluate(() => document.getElementById("inline-answer").textContent.trim()),
    touche: c => `.keypad [data-key="${c}"]`, valider: "#validate",
  },
  "ancien Défi calcul": {
    async ouvrir(page) {
      await page.goto(`${base}/outils/calcul_mental/defi_calcul.html`);
      await page.locator("#start").click();
      await page.waitForFunction(() => !document.getElementById("validate").disabled, null, {timeout: 10000});
    },
    lire: page => page.evaluate(() => document.getElementById("answer").value),
    touche: c => `[data-key="${c}"]`, valider: "#validate",
  },
  "Flash Anzan": {
    async ouvrir(page) {
      // Sans limite de temps (0) : avec 10 s par calcul, la trentaine d'appuis
      // du test dépassait parfois le temps sur un PC lent, et le pavé
      // disparaissait en plein test (rouge une fois sur deux, sans rapport avec le lot).
      await page.addInitScript(() => localStorage.setItem("mathsgo-flash-anzan-v1", JSON.stringify({mode: "colonne",
        colonne: {operations: "plusmoins", chiffresMin: 2, chiffresMax: 3, nombres: 6, limite: 0, calculs: 5}})));
      await page.goto(`${base}/outils/calcul_mental/flash_anzan.html`);
      await page.locator("#partir").click();
      await page.waitForFunction(() => { const c = document.getElementById("case"); return c && c.offsetParent; }, null, {timeout: 15000});
    },
    lire: page => page.evaluate(() => document.getElementById("case").textContent.trim()),
    touche: c => `#keypad [data-key="${c}"]`, valider: "#valider",
  },
};

async function ouvrirAuTelephone(nav, appli) {
  const contexte = await nav.newContext({viewport: {width: 375, height: 667}, hasTouch: true, isMobile: true});
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", erreur => erreurs.push(erreur.message));
  await appli.ouvrir(page);
  await attendre(250);
  const cdp = await contexte.newCDPSession(page);
  const toucher = (type, points) => cdp.send("Input.dispatchTouchEvent", {type, touchPoints: points});
  const centre = async selecteur => {
    const r = await page.locator(selecteur).first().boundingBox();
    return {x: r.x + r.width / 2, y: r.y + r.height / 2};
  };
  const doigts = {
    async tap(selecteur, tenu = 60) {
      const a = await centre(selecteur);
      await toucher("touchStart", [{...a, id: 1}]); await attendre(tenu);
      await toucher("touchEnd", []); await attendre(40);
    },
    // Pouce A posé ; pouce B posé avant que A se relève ; A se relève ; B se relève.
    async deuxPouces(selA, selB) {
      const a = await centre(selA), b = await centre(selB);
      await toucher("touchStart", [{...a, id: 1}]); await attendre(50);
      await toucher("touchStart", [{...a, id: 1}, {...b, id: 2}]); await attendre(50);
      await toucher("touchEnd", [{...b, id: 2}]); await attendre(50);
      await toucher("touchEnd", []); await attendre(60);
    },
    async glisse(selecteur) {
      const a = await centre(selecteur);
      await toucher("touchStart", [{...a, id: 1}]);
      for (let i = 1; i <= 5; i += 1) { await attendre(16); await toucher("touchMove", [{x: a.x + 5 * i, y: a.y, id: 1}]); }
      await toucher("touchEnd", []); await attendre(60);
    },
  };
  return {contexte, page, erreurs, doigts, centre};
}

for (const [nom, appli] of Object.entries(APPLIS)) {
  test(`${nom} au téléphone : aucun chiffre perdu ni doublé (deux pouces, doigt qui glisse, même touche vite, souris, clavier)`, {skip: ignorer, timeout: PLAFOND}, async () => {
    await demarrerServeur();
    const nav = await lancer();
    try {
      const {page, erreurs, doigts} = await ouvrirAuTelephone(nav, appli);
      const vider = async () => { for (let i = 0; i < 8; i += 1) await doigts.tap(appli.touche("backspace")); };
      await doigts.tap(appli.touche("4")); await doigts.tap(appli.touche("9"));
      assert.equal(await appli.lire(page), "49", "deux appuis simples");
      await vider();
      await doigts.deuxPouces(appli.touche("5"), appli.touche("6"));
      assert.equal(await appli.lire(page), "56", "deux pouces qui se chevauchent (avant le lot : rien d'écrit)");
      await vider();
      await doigts.glisse(appli.touche("8"));
      assert.equal(await appli.lire(page), "8", "doigt qui glisse de 25 px (avant le lot : rien d'écrit)");
      await vider();
      await doigts.tap(appli.touche("4"), 30); await doigts.tap(appli.touche("4"), 30);
      assert.equal(await appli.lire(page), "44", "la même touche deux fois vite");
      await vider();
      await page.locator(appli.touche("3")).click(); await page.locator(appli.touche("2")).click();
      assert.equal(await appli.lire(page), "32", "à la souris, un seul chiffre par clic");
      await vider();
      await page.locator(appli.touche("7")).focus(); await page.keyboard.press("Space");
      assert.equal(await appli.lire(page), "7", "Espace sur une touche atteinte au clavier");
      assert.deepEqual(erreurs, []);
    } finally { await nav.close(); }
  });

  test(`${nom} au téléphone : Valider agit une fois, et le bouton apparu sous le doigt ne reçoit aucun clic`, {skip: ignorer, timeout: PLAFOND}, async () => {
    await demarrerServeur();
    const nav = await lancer();
    try {
      const {page, erreurs, doigts, centre} = await ouvrirAuTelephone(nav, appli);
      await doigts.tap(appli.touche("1"));
      const point = await centre(appli.valider);
      // Le piège : au toucher de Valider, un bouton se pose exactement sous le doigt.
      await page.evaluate(([selecteur, x, y]) => {
        window.__valide = 0; window.__fantome = 0;
        document.querySelector(selecteur).addEventListener("pointerdown", () => {
          window.__valide += 1;
          const piege = document.createElement("button");
          piege.style.cssText = `position:fixed;left:${x - 60}px;top:${y - 30}px;width:120px;height:60px;z-index:99999`;
          piege.addEventListener("click", () => { window.__fantome += 1; });
          document.body.appendChild(piege);
        }, {once: true});
      }, [appli.valider, point.x, point.y]);
      await doigts.tap(appli.valider, 80);
      await attendre(400);
      assert.deepEqual(await page.evaluate(() => [window.__valide, window.__fantome]), [1, 0]);
      assert.deepEqual(erreurs, []);
    } finally { await nav.close(); }
  });
}

test("Défi tables au téléphone : une série entière, chaque Valider touché pendant que l'autre pouce tient le dernier chiffre — 20 justes, un calcul à la fois", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await lancer();
  try {
    const appli = APPLIS["Défi tables"];
    const {page, erreurs, doigts} = await ouvrirAuTelephone(nav, appli);
    const etat = () => page.evaluate(() => ({compte: document.getElementById("question-count").textContent,
      calcul: document.getElementById("expression").textContent.replace(/\s/g, ""), enJeu: !document.getElementById("play").hidden}));
    const reponse = calcul => {
      let m;
      if ((m = calcul.match(/^(\d+)×(\d+)=$/))) return m[1] * m[2];
      if ((m = calcul.match(/^(\d+)×=(\d+)$/)) || (m = calcul.match(/^×(\d+)=(\d+)$/))) return m[2] / m[1];
      if ((m = calcul.match(/^(\d+)=(\d+)×$/)) || (m = calcul.match(/^(\d+)=×(\d+)$/)) || (m = calcul.match(/^(\d+)÷(\d+)=$/))) return m[1] / m[2];
      if ((m = calcul.match(/^(\d+)÷=(\d+)$/))) return m[1] / m[2];
      throw new Error(`calcul non reconnu : ${calcul}`);
    };
    let joues = 0;
    for (let tour = 0; tour < 25; tour += 1) {
      const avant = await etat();
      if (!avant.enJeu) break;
      const chiffres = String(reponse(avant.calcul)).split("");
      for (const c of chiffres.slice(0, -1)) await doigts.tap(appli.touche(c));
      await doigts.deuxPouces(appli.touche(chiffres.at(-1)), appli.valider);
      await attendre(300);
      const apres = await etat();
      joues += 1;
      if (apres.enJeu) assert.equal(Number.parseInt(apres.compte, 10), Number.parseInt(avant.compte, 10) + 1, `${avant.compte} ${avant.calcul} : un seul calcul validé`);
    }
    assert.equal(joues, 20);
    assert.match(await page.locator("#result").innerText(), /20\s+bonnes\s+réponses\s+sur\s+20/);
    assert.deepEqual(erreurs, []);
  } finally { await nav.close(); }
});
