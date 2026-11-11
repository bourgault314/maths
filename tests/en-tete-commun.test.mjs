// En-tête commun des applis suivies (variante A, planches du 31/10/2026, AGENTS.md
// « Applis suivies — modèle commun ») : pour l'élève à code, plus de barre au-dessus
// du cadre ; sur l'accueil de l'appli, la flèche, le titre et le plein écran DANS le
// cadre, et sous le titre UNE petite ligne « ● Suivi · Rania · 405 · Se déconnecter ».
// Mesuré au navigateur, dans les cinq applis : la ligne a les mêmes règles partout,
// elle est sous le titre et dans le cadre, son « Se déconnecter » est le vrai bouton,
// et le cadre tient entier dans l'écran de l'ordinateur. Sans code, rien ne change.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL("../", import.meta.url));
const charger = createRequire(import.meta.url);
let navigateur;
try {
  navigateur = charger("playwright").chromium;
} catch {
  /* Installation locale facultative en CI. */
}
const ignorer = navigateur ? false : "Playwright absent : exécuter ce contrôle dans l’environnement de revue équipé.";
const PLAFOND = 180000;

const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".ico": "image/x-icon"};
let serveur = null;
let base = "";
async function demarrerServeur() {
  if (serveur) return base;
  serveur = createServer(async (req, res) => {
    const chemin = resolve(racine, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!chemin.startsWith(racine.replace(/[\\/]$/, "") + sep) && chemin !== racine) { res.writeHead(403); res.end(); return; }
    try {
      const corps = await readFile(chemin);
      res.writeHead(200, {"Content-Type": TYPES[extname(chemin)] || "application/octet-stream"});
      res.end(corps);
    } catch {
      res.writeHead(404); res.end();
    }
  });
  await new Promise(ok => serveur.listen(0, "127.0.0.1", ok));
  base = `http://127.0.0.1:${serveur.address().port}`;
  return base;
}
after(() => serveur && serveur.close());

// Les cinq applis suivies : la page, le cadre blanc, le titre au-dessus de la ligne.
const APPLIS = {
  "Anzan": {page: "/outils/calcul_mental/flash_anzan.html", cadre: "#panel", titre: "#titre"},
  "Défi tables": {page: "/outils/calcul_mental/defi_tables.html", cadre: ".shell > .panel", titre: ".topbar .ec-nom"},
  "Coffres magiques": {page: "/outils/calcul_mental/coffres_magiques_solo.html", cadre: ".chemin-card", titre: ".chemin-card .ec-nom"},
  // Coffres : depuis le chemin des coffres (11/11/2026), l'accueil de l'élève connecté est « Tes coffres ».
  "Défi calcul": {page: "/outils/calcul_mental/defi_calcul_modules.html", cadre: ".shell > .panel", titre: ".topbar .ec-nom"},
  "SPLAT! carte": {page: "/outils/splat_univers.html", cadre: ".hero", titre: ".hero h1"}
};
const APPLIS_SUIVIES = ["defi-tables", "coffres", "flash-anzan", "splat", "defi-calcul"];

// Un faux serveur de suivi : Rania, 405. « horsligne » : les envois échouent (503) ;
// « detache » : le code ne vaut plus rien (404).
function fauxSuivi(mode) {
  return async route => {
    const url = route.request().url();
    let corps = {};
    try { corps = JSON.parse(route.request().postData() || "{}"); } catch { corps = {}; }
    const H = {"Access-Control-Allow-Origin": "*"};
    const json = (status, d) => route.fulfill({status, contentType: "application/json", body: JSON.stringify(d), headers: H});
    if (url.includes("/api/eleve.php")) {
      if (mode === "detache") return json(404, {});
      return json(200, {ok: true, prenom: "Rania", classe: "405", applis: APPLIS_SUIVIES, reglages: {}});
    }
    if (url.includes("/api/parcours.php")) {
      if (mode === "horsligne") return json(503, {});
      if (mode === "detache") return json(404, {});
      return json(200, corps.lire ? {ok: true, existe: false} : {ok: true, revision: 1});
    }
    if (url.includes("/api/records.php")) return json(200, {ok: true, records: []});
    if (url.includes("/api/direct.php")) return json(200, {ok: true, seance: null});
    return route.fulfill({status: 404, body: "", headers: H});
  };
}

async function ouvrir(nav, nom, {largeur = 1366, hauteur = 650, telephone = false, mode = "ok"} = {}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, isMobile: telephone, hasTouch: telephone});
  if (mode === "visiteur") {
    await ctx.route("https://suivi.mathsgo.re/**", r => r.abort());
  } else {
    await ctx.route("https://suivi.mathsgo.re/**", fauxSuivi(mode));
    await ctx.addInitScript(() => sessionStorage.setItem("mathsgo-suivi-code", "ABC234"));
  }
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(String(e)));
  await page.goto(base + APPLIS[nom].page, {waitUntil: "networkidle"});
  await page.waitForTimeout(900);
  return {ctx, page, erreurs};
}

// Ce que la page montre de la ligne, et où.
const MESURER = ([cadreSel, titreSel]) => {
  const boite = s => { const e = typeof s === "string" ? document.querySelector(s) : s; if (!e) return null; const r = e.getBoundingClientRect(); return {haut: r.top, bas: r.bottom, gauche: r.left, droite: r.right, h: r.height}; };
  const ligne = document.getElementById("suivi-repere");
  const style = e => e ? getComputedStyle(e) : null;
  const sortie = ligne && ligne.querySelector(".sortie");
  const puce = ligne && ligne.querySelector(".puce");
  const prenom = ligne && ligne.querySelector(".repere-prenom");
  return {
    visible: Boolean(ligne && !ligne.hidden && ligne.getClientRects().length),
    texte: ligne ? ligne.textContent.replace(/\s+/g, " ").trim() : "",
    ligne: boite(ligne), cadre: boite(cadreSel), titre: boite(titreSel), sortie: boite(sortie),
    cible: sortie ? parseFloat(getComputedStyle(sortie, "::after").height) : 0,
    couleur: style(ligne)?.color, fond: style(ligne)?.backgroundColor, graisse: style(ligne)?.fontWeight, taille: style(ligne)?.fontSize,
    puce: style(puce)?.backgroundColor, puceVue: puce ? getComputedStyle(puce).display !== "none" : false,
    prenomGraisse: style(prenom)?.fontWeight, prenomCouleur: style(prenom)?.color,
    souligne: style(sortie)?.textDecorationLine, sortieTag: sortie ? sortie.tagName : "",
    vh: innerHeight
  };
};

test("la ligne de suivi : mêmes règles, mêmes valeurs, sous le titre et dans le cadre, dans les cinq applis", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const [largeur, hauteur, telephone, taille] of [[1366, 650, false, "13.76px"], [390, 844, true, "12.8px"]]) {
      for (const nom of Object.keys(APPLIS)) {
        const {ctx, page, erreurs} = await ouvrir(nav, nom, {largeur, hauteur, telephone});
        const m = await page.evaluate(MESURER, [APPLIS[nom].cadre, APPLIS[nom].titre]);
        const ou = `${nom} (${largeur} × ${hauteur})`;
        assert.deepEqual(erreurs, [], `${ou} : aucune erreur`);
        assert.equal(m.visible, true, `${ou} : la ligne est là`);
        assert.equal(m.texte, "Suivi · Rania · 405 · Se déconnecter", `${ou} : le texte court`);
        assert.equal(m.couleur, "rgb(80, 107, 125)", `${ou} : gris #506b7d`);
        assert.equal(m.fond, "rgba(0, 0, 0, 0)", `${ou} : plus de bandeau pâle`);
        assert.equal(m.graisse, "500", `${ou} : graisse 500`);
        // la taille de base (.86rem ou .8rem), à l'échelle de la colonne près pour les applis qui la réduisent
        assert.ok(Math.abs(parseFloat(m.taille) - parseFloat(taille)) < 0.05, `${ou} : taille ${m.taille} (attendu ${taille})`);
        assert.equal(m.puce, "rgb(20, 116, 71)", `${ou} : puce verte #147447`);
        assert.equal(m.prenomGraisse, "700", `${ou} : prénom en gras`);
        assert.equal(m.prenomCouleur, "rgb(20, 52, 81)", `${ou} : prénom couleur encre`);
        assert.equal(m.souligne, "underline", `${ou} : « Se déconnecter » souligné`);
        assert.equal(m.sortieTag, "BUTTON", `${ou} : c'est le vrai bouton`);
        // 44 px de haut (l'échelle de la colonne, sur ordinateur seulement, l'arrondit à peine)
        assert.ok(m.cible >= (telephone ? 44 : 43.5), `${ou} : « Se déconnecter » se touche sur 44 px (${m.cible})`);
        assert.ok(m.ligne.h < 30, `${ou} : une seule ligne (${m.ligne.h} px)`);
        assert.ok(m.ligne.haut >= m.titre.bas - 1, `${ou} : sous le titre`);
        assert.ok(m.ligne.haut >= m.cadre.haut && m.ligne.bas <= m.cadre.bas, `${ou} : dans le cadre`);
        await ctx.close();
      }
    }
  } finally {
    await nav.close();
  }
});

test("plus de barre au-dessus du cadre : la flèche et le plein écran sont dans le cadre ; « Se déconnecter » quitte vraiment", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    const FLECHE = {"Anzan": "#lien-retour", "Défi tables": "#lien-retour", "Coffres magiques": "#lien-retour", "Défi calcul": "#lien-retour"};
    for (const nom of Object.keys(FLECHE)) {
      const {ctx, page} = await ouvrir(nav, nom);
      const m = await page.evaluate(([cadre, fleche]) => {
        const r = s => document.querySelector(s)?.getBoundingClientRect();
        const c = r(cadre), f = r(fleche), p = document.querySelector("[data-fullscreen-toggle]:not([hidden])");
        const pr = p && p.getClientRects().length ? p.getBoundingClientRect() : null;
        return {cadreHaut: c.top, cadreBas: c.bottom, flecheHaut: f.top, flecheBas: f.bottom, href: document.querySelector(fleche).href,
          pleinHaut: pr ? pr.top : null, pleinBas: pr ? pr.bottom : null};
      }, [APPLIS[nom].cadre, FLECHE[nom]]);
      assert.ok(m.flecheHaut >= m.cadreHaut && m.flecheBas <= m.cadreBas, `${nom} : la flèche est dans le cadre`);
      assert.equal(m.href, "https://suivi.mathsgo.re/", `${nom} : la flèche mène à Mon espace`);
      assert.ok(m.pleinHaut !== null && m.pleinHaut >= m.cadreHaut, `${nom} : le plein écran est dans le cadre`);
      // « Se déconnecter » : le bouton de la ligne fait ce qu'il faisait (l'espace oublie le code).
      const depart = page.waitForRequest(r => r.url().startsWith("https://suivi.mathsgo.re/?oublier=1"), {timeout: 5000}).catch(() => null);
      await page.click("#suivi-repere .sortie");
      assert.ok(await depart, `${nom} : « Se déconnecter » renvoie l'espace vers ?oublier=1`);
      await ctx.close();
    }
  } finally {
    await nav.close();
  }
});

test("sans code, rien ne change : pas de ligne, la barre du site au-dessus du cadre, aucune classe de l'en-tête commun", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const nom of Object.keys(APPLIS)) {
      const {ctx, page, erreurs} = await ouvrir(nav, nom, {mode: "visiteur"});
      const m = await page.evaluate(() => ({
        ligne: (() => { const l = document.getElementById("suivi-repere"); return Boolean(l && !l.hidden && l.getClientRects().length); })(),
        classes: ["en-tete-cadre", "ec-dans-carte"].filter(c => document.body.classList.contains(c)),
        barreHorsCadre: (() => { const b = document.querySelector(".topbar"); return b ? !b.closest(".panel, .dialog-card") : null; })(),
        logo: (() => { const l = document.querySelector(".topbar > .brand, header .brand"); return l ? l.getClientRects().length > 0 : null; })()
      }));
      assert.deepEqual(erreurs, [], `${nom} : aucune erreur`);
      assert.equal(m.ligne, false, `${nom} : pas de ligne de suivi`);
      assert.deepEqual(m.classes, [], `${nom} : aucune classe de l'en-tête commun`);
      if (m.barreHorsCadre !== null) assert.equal(m.barreHorsCadre, true, `${nom} : la barre du site reste au-dessus du cadre`);
      if (m.logo !== null) assert.equal(m.logo, true, `${nom} : le logo du site est là`);
      await ctx.close();
    }
  } finally {
    await nav.close();
  }
});

test("les états de la ligne : orange quand rien n'est parti, grise sans puce quand le code ne vaut plus rien — « Se déconnecter » toujours là", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const nom of ["Anzan", "Défi tables", "SPLAT! carte"]) {
      const h = await ouvrir(nav, nom, {mode: "horsligne"});
      if (nom === "Défi tables") { await h.page.click("text=Non, je commence à apprendre"); await h.page.waitForTimeout(400); }
      await h.page.waitForTimeout(800);
      const mh = await h.page.evaluate(MESURER, [APPLIS[nom].cadre, APPLIS[nom].titre]);
      assert.match(mh.texte, /^Suivi · travail gardé ici, pas encore envoyé · Se déconnecter$/, `${nom} : hors ligne`);
      assert.equal(mh.couleur, "rgb(138, 76, 10)", `${nom} : texte orange foncé`);
      assert.equal(mh.puce, "rgb(217, 130, 43)", `${nom} : puce orange`);
      await h.ctx.close();
      const d = await ouvrir(nav, nom, {mode: "detache"});
      if (nom === "Défi tables") { await d.page.click("text=Non, je commence à apprendre"); await d.page.waitForTimeout(400); }
      await d.page.waitForTimeout(800);
      const md = await d.page.evaluate(MESURER, [APPLIS[nom].cadre, APPLIS[nom].titre]);
      assert.equal(md.texte, "Ton code ne marche plus · demande le nouveau à ton professeur · Se déconnecter", `${nom} : code détaché`);
      assert.equal(md.couleur, "rgb(61, 74, 90)", `${nom} : texte gris foncé`);
      assert.equal(md.puceVue, false, `${nom} : pas de puce`);
      assert.ok(md.ligne.haut >= md.cadre.haut && md.ligne.bas <= md.cadre.bas, `${nom} : toujours dans le cadre`);
      await d.ctx.close();
    }
  } finally {
    await nav.close();
  }
});

test("sur ordinateur, le cadre de l'élève connecté tient entier dans l'écran — en fenêtre et en plein écran", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const nom of ["Anzan", "Défi tables", "Coffres magiques", "Défi calcul"]) {
      for (const [largeur, hauteur] of [[1366, 650], [1366, 768], [1280, 720]]) {
        const {ctx, page} = await ouvrir(nav, nom, {largeur, hauteur});
        const fenetre = await page.evaluate(sel => ({bas: document.querySelector(sel).getBoundingClientRect().bottom, vh: innerHeight}), APPLIS[nom].cadre);
        assert.ok(fenetre.bas <= fenetre.vh + 0.5, `${nom} ${largeur} × ${hauteur}, fenêtre : le bas du cadre (${Math.round(fenetre.bas)}) dans l'écran (${fenetre.vh})`);
        await page.click("[data-fullscreen-toggle]");
        await page.waitForTimeout(600);
        const plein = await page.evaluate(sel => ({bas: document.querySelector(sel).getBoundingClientRect().bottom, vh: innerHeight}), APPLIS[nom].cadre);
        assert.ok(plein.bas <= plein.vh + 0.5, `${nom} ${largeur} × ${hauteur}, plein écran : le bas du cadre (${Math.round(plein.bas)}) dans l'écran (${plein.vh})`);
        await ctx.close();
      }
    }
  } finally {
    await nav.close();
  }
});

// Trouvé pendant le lot : la barre entrée dans le cadre ajoutait sa hauteur au jeu ; le
// cadre débordait et le navigateur le faisait défiler en donnant le focus à la case
// réponse — la ligne était rognée en haut. La barre et le jeu s'empilent désormais.
test("pendant une série de Défi tables, la ligne reste entière en haut du cadre, qui ne défile pas", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const [largeur, hauteur, telephone] of [[1366, 650, false], [390, 844, true]]) {
      const {ctx, page, erreurs} = await ouvrir(nav, "Défi tables", {largeur, hauteur, telephone});
      await page.click("text=Non, je commence à apprendre");
      await page.locator("button:visible", {hasText: "conseillée"}).first().click();
      await page.locator("button:visible", {hasText: "Je passe le test"}).first().click();
      await page.locator("button:visible", {hasText: "C’est parti"}).first().click();
      await page.waitForTimeout(4500);
      const m = await page.evaluate(() => {
        const r = s => document.querySelector(s).getBoundingClientRect();
        const cadre = document.querySelector(".shell > .panel");
        return {serie: document.body.classList.contains("challenge-playing"), ligne: r("#suivi-repere"), cadre: r(".shell > .panel"), defile: cadre.scrollTop};
      });
      const ou = `${largeur} × ${hauteur}`;
      assert.deepEqual(erreurs, [], `${ou} : aucune erreur`);
      assert.equal(m.serie, true, `${ou} : une série est en cours`);
      assert.equal(m.defile, 0, `${ou} : le cadre n'a pas défilé`);
      assert.ok(m.ligne.top >= m.cadre.top && m.ligne.bottom <= m.cadre.bottom, `${ou} : la ligne est entière dans le cadre`);
      await ctx.close();
    }
  } finally {
    await nav.close();
  }
});

// Planche 16 du 31/10/2026, au soir (choix de Gwenaël, « tout blanc ») : le haut du cadre
// reste blanc — plus de bleu très pâle (planche 5) — et un trait fin gris passe SOUS la ligne
// de suivi, jusqu'aux bords du cadre.
test("le haut du cadre blanc, un trait fin gris sous le titre et la ligne, dans les quatre applis à cadre", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    const CADRES = {"Anzan": "#ecran-reglages .bandeau", "Défi tables": ".shell > .panel", "Coffres magiques": ".chemin-card", "Défi calcul": ".shell > .panel"};
    for (const [largeur, hauteur, telephone] of [[1366, 650, false], [390, 844, true]]) {
      for (const nom of Object.keys(CADRES)) {
        const {ctx, page} = await ouvrir(nav, nom, {largeur, hauteur, telephone});
        const m = await page.evaluate(sel => {
          const c = document.querySelector(sel), s = getComputedStyle(c), l = document.getElementById("suivi-repere");
          const bande = s.getPropertyValue("--haut-teinte") ? parseFloat(s.getPropertyValue("--haut-teinte")) : c.offsetHeight;
          const z = c.getBoundingClientRect().height / c.offsetHeight || 1;
          return {fond: s.backgroundColor, ombre: s.boxShadow, trait: s.borderBottomColor, bordure: s.borderBottomWidth,
            bandeBas: c.getBoundingClientRect().top + bande * z, ligneBas: l.getBoundingClientRect().bottom};
        }, CADRES[nom]);
        const ou = `${nom} (${largeur} × ${hauteur})`;
        assert.ok(!`${m.fond} ${m.ombre}`.includes("rgb(238, 246, 255)"), `${ou} : plus de bleu très pâle (${m.fond} / ${m.ombre})`);
        const anzan = m.fond === "rgb(255, 255, 255)" && m.trait === "rgb(227, 235, 240)" && m.bordure === "1px";
        const cadre = /inset/.test(m.ombre) && /^rgb\(255, 255, 255\) 0px \d+px 0px 0px inset, rgb\(227, 235, 240\) 0px \d+px 0px 0px inset/.test(m.ombre);
        assert.ok(anzan || cadre, `${ou} : le haut est blanc, avec le trait fin gris (${m.fond} / ${m.trait} / ${m.ombre})`);
        assert.ok(m.bandeBas >= m.ligneBas, `${ou} : le trait gris passe sous la ligne de suivi (${Math.round(m.bandeBas)} ≥ ${Math.round(m.ligneBas)})`);
        await ctx.close();
      }
    }
  } finally {
    await nav.close();
  }
});

// Le titre de l'écran d'abord, la ligne dessous, partout (31/10/2026, choix de Gwenaël,
// planches 11 et 12) : sur un écran qui a son titre (« ← Mon parcours ⋯ », « Comment ça
// marche ? ») ou le fil de la séance (①②③④ + le nom de l'activité, centré), la ligne de
// suivi est JUSTE SOUS ce titre, au-dessus du reste de l'écran, dans la bande bleu pâle.
// Sans titre (une série hors séance), elle reste en haut du cadre.
const SOUS_TITRE = ([titreSel, suiteSel]) => {
  const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return {haut: b.top, bas: b.bottom, gauche: b.left, droite: b.right}; };
  const cadre = document.querySelector(".shell > .panel"), s = getComputedStyle(cadre);
  const z = cadre.getBoundingClientRect().height / cadre.offsetHeight || 1;
  return {ligne: r("#suivi-repere"), titre: r(titreSel), suite: r(suiteSel), cadre: r(".shell > .panel"),
    classe: document.body.classList.contains("ligne-sous-titre"),
    bandeBas: cadre.getBoundingClientRect().top + parseFloat(s.getPropertyValue("--haut-teinte") || "0") * z,
    defile: cadre.scrollTop};
};
async function verifierSousTitre(page, ou, titreSel, suiteSel) {
  const m = await page.evaluate(SOUS_TITRE, [titreSel, suiteSel]);
  assert.ok(m.titre && m.suite, `${ou} : le titre et la suite de l'écran sont là`);
  assert.equal(m.classe, true, `${ou} : body.ligne-sous-titre`);
  assert.ok(m.ligne.haut >= m.titre.bas - 1, `${ou} : la ligne est sous le titre (${Math.round(m.ligne.haut)} ≥ ${Math.round(m.titre.bas)})`);
  assert.ok(m.ligne.bas <= m.suite.haut + 1, `${ou} : la ligne est au-dessus du reste de l'écran (${Math.round(m.ligne.bas)} ≤ ${Math.round(m.suite.haut)})`);
  assert.ok(m.ligne.haut >= m.cadre.haut, `${ou} : la ligne est dans le cadre`);
  assert.ok(m.bandeBas >= m.ligne.bas, `${ou} : le trait gris passe sous le titre et la ligne`);
  assert.equal(m.defile, 0, `${ou} : le cadre n'a pas défilé`);
  return m;
}

// La flèche toujours en haut à gauche (planche 16 du 31/10/2026) : pendant la séance, le
// bouton de retour monte sur la ligne des étapes, au-dessus de la ligne de suivi.
async function verifierFlecheEnHaut(page, ou, filSel, telephone) {
  const m = await page.evaluate(sel => {
    const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return {haut: b.top, bas: b.bottom, gauche: b.left, droite: b.right, l: b.width}; };
    const label = document.querySelector("#game-menu .game-menu-label");
    // ce qui est ÉCRIT sur le fil (les ronds, les lettres du nom), pas la boîte du nom
    const morceaux = [...document.querySelector(sel).querySelectorAll("li, b")].flatMap(e => {
      if (e.tagName === "LI") return [e.getBoundingClientRect()];
      const texte = document.createRange(); texte.selectNodeContents(e); return [...texte.getClientRects()];
    }).filter(x => x.width);
    return {fleche: r("#game-menu"), fil: r(sel), ligne: r("#suivi-repere"), jeu: r("#play"),
      filGauche: Math.min(...morceaux.map(x => x.left)), label: label ? getComputedStyle(label).display : "none"};
  }, filSel);
  const milieu = b => (b.haut + b.bas) / 2;
  // (au téléphone, un nom d'activité long passe sous les étapes : la flèche reste à la hauteur du fil)
  assert.ok(milieu(m.fleche) >= m.fil.haut && milieu(m.fleche) <= m.fil.bas, `${ou} : la flèche est sur la ligne des étapes (${Math.round(milieu(m.fleche))} dans ${Math.round(m.fil.haut)}–${Math.round(m.fil.bas)})`);
  assert.ok(m.fleche.bas <= m.ligne.haut + 1, `${ou} : la flèche est au-dessus de la ligne de suivi`);
  assert.ok(Math.abs(m.fleche.gauche - m.jeu.gauche) < 2, `${ou} : la flèche est à gauche`);
  assert.ok(m.fleche.droite <= m.filGauche + 1, `${ou} : la flèche ne mord pas sur les étapes (${Math.round(m.fleche.droite)} ≤ ${Math.round(m.filGauche)})`);
  if (telephone) assert.equal(m.label, "none", `${ou} : au téléphone, la flèche est ronde, sans mot`);
}

test("le titre de l'écran d'abord, la ligne dessous : Défi tables (Mon parcours, Ma séance) et Défi calcul (Ma séance, Comment ça marche ?)", {skip: ignorer, timeout: PLAFOND}, async () => {
  await demarrerServeur();
  const nav = await navigateur.launch();
  try {
    for (const [largeur, hauteur, telephone] of [[1366, 650, false], [390, 844, true]]) {
      const taille = `${largeur} × ${hauteur}`;
      // Défi tables : Mon parcours, puis l'accueil (la barre revient en haut), puis la séance.
      let o = await ouvrir(nav, "Défi tables", {largeur, hauteur, telephone});
      await o.page.click("text=Non, je commence à apprendre");
      await o.page.locator("button:visible", {hasText: "conseillée"}).first().click();
      await o.page.waitForTimeout(400);
      await o.page.click("#open-parcours");
      await o.page.waitForTimeout(500);
      await verifierSousTitre(o.page, `Défi tables, Mon parcours (${taille})`, "#parcours-title", "#parcours .parcours-toolbar ~ :not(header):not([hidden])");
      await o.page.click("#parcours-back");
      await o.page.waitForTimeout(400);
      const accueil = await o.page.evaluate(() => ({classe: document.body.classList.contains("ligne-sous-titre"),
        premiere: document.querySelector(".shell > .panel > header.topbar") !== null}));
      assert.deepEqual(accueil, {classe: false, premiere: true}, `Défi tables, retour à l'accueil (${taille}) : la barre revient en haut du cadre`);
      await o.page.click("#acc-seance");
      await o.page.waitForTimeout(900);
      const m = await verifierSousTitre(o.page, `Défi tables, Ma séance (${taille})`, "#seance-fil", "#play .status");
      await verifierFlecheEnHaut(o.page, `Défi tables, Ma séance (${taille})`, "#seance-fil", telephone);
      const centre = await o.page.evaluate(() => { const f = document.querySelector("#seance-fil"), c = document.querySelector("#play").getBoundingClientRect();
        const enfants = [...f.children].map(e => e.getBoundingClientRect()).filter(b => b.width);
        const g = Math.min(...enfants.map(b => b.left)), d = Math.max(...enfants.map(b => b.right));
        return Math.abs((g + d) / 2 - (c.left + c.right) / 2); });
      assert.ok(centre < 4, `Défi tables, Ma séance (${taille}) : les étapes et le nom sont centrés (écart ${centre.toFixed(1)} px)`);
      assert.deepEqual(o.erreurs, [], `Défi tables (${taille}) : aucune erreur`);
      await o.ctx.close();
      // Défi calcul : la séance, puis « Comment ça marche ? ».
      o = await ouvrir(nav, "Défi calcul", {largeur, hauteur, telephone});
      await o.page.locator("#acc-seance button:visible").first().click();
      await o.page.waitForTimeout(1200);
      await verifierSousTitre(o.page, `Défi calcul, Ma séance (${taille})`, "#fil-seance", "#play .status");
      await verifierFlecheEnHaut(o.page, `Défi calcul, Ma séance (${taille})`, "#fil-seance", telephone);
      await o.page.click("#game-menu");
      await o.page.waitForTimeout(500);
      await o.page.locator("text=Comment ça marche").first().click();
      await o.page.waitForTimeout(500);
      await verifierSousTitre(o.page, `Défi calcul, Comment ça marche ? (${taille})`, "#notice-title", "#notice > .notice");
      assert.deepEqual(o.erreurs, [], `Défi calcul (${taille}) : aucune erreur`);
      await o.ctx.close();
    }
  } finally {
    await nav.close();
  }
});
