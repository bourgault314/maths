// Défi calcul, lot K2 « le professeur » (28/11/2026, planches K2-3, K2-4 et
// K2-6 validées par Gwenaël) : la VRAIE page « Ma classe », au navigateur,
// sur une copie du VRAI serveur (PHP, SQLite), avec une classe de 24 élèves
// de 4e fabriquée par le VRAI moteur (3 semaines de séances), à l'ordinateur
// (1366 × 657) et au téléphone (390 × 844).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-K2-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-K2-ecrans.cjs
// Il faut php dans le PATH (comme pour _serveur/tests/lancer.php) ;
// CHROMIUM_EXECUTABLE_PATH pour un Chrome à soi.
//
// Les écrans NEUFS du lot, chacun : aucune erreur de page, rien ne sort sur
// le côté ;
//   onglet       « À aider » (6 élèves) à gauche et « Notre classe,
//                ensemble » dessous, « À reprendre en classe » à droite
//                (l'une sous l'autre au téléphone) ; « Où en est chacun »,
//                la grille : 24 lignes, une case par étoile, « Gagnée par » ;
//                « Qui s'entraîne » et « Moins de 3 séances » ; le tableau
//                « Étoiles », « À surveiller » ;
//   case         toucher une case : son détail par-dessus la page (rien ne
//                descend : la page garde sa hauteur) ;
//   prénoms      « N élèves sur 24 » : les prénoms et « Copier la liste » ;
//   fiche        la fenêtre de l'élève, onglet Défi calcul : « Étoiles », « À
//                surveiller », « Ses étoiles », « L'appli lui dit » ;
//   feuille      la fiche imprimée (sans couleur, des signes) ;
//   ⋯            « Revenir à… » puis « Recommencer Défi calcul à zéro », la
//                confirmation de la planche K2-6, la remise à zéro, puis
//                « Revenir à… » qui la défait ;
//   réglage      « Jusqu'à quelle ceinture », six ceintures l'une sous l'autre ;
//                « Autrement pour quelques élèves » : chaque « Choisir… » dans la fenêtre.

"use strict";
const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.join(__dirname, "..");
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const C = CORE.carte();
const SORTIE = process.env.SORTIE || "";
const AUJ = "2026-11-27";

// ----- la classe fabriquée (24 élèves de 4e, 3 semaines, 4 profils)
function fabriquerClasse() {
  let graine = 7;
  const alea = () => { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; };
  const causeDe = m => { const f = CORE.moduleDe(m); const e = f && f.erreurs ? f.erreurs : []; if (!e.length) return {}; const i = alea() < .6 ? 0 : Math.floor(alea() * e.length); return {[e[i].c]: 2}; };
  const PRENOMS = ["Anaïs", "Brice", "Chloé", "Dylan", "Emma", "Farid", "Gaël", "Hina", "Ilan", "Jade", "Kenzo", "Léa", "Maël", "Nina", "Océane", "Paul", "Rania", "Sacha", "Théo", "Ugo", "Valentin", "Wendy", "Yanis", "Zoé"];
  const PROFILS = {fort: [14, [1, 1, .97, .9, .75, .5], .9, .93], moyen: [11, [1, .9, .65, .45, .3, .15], .65, .78], faible: [9, [.85, .55, .3, .15, .1, 0], .4, .62], rare: [3, [.9, .7, .5, .3, .2, .1], .8, .8]};
  const QUI = ["moyen", "fort", "moyen", "faible", "fort", "moyen", "faible", "fort", "moyen", "fort", "rare", "moyen", "faible", "moyen", "moyen", "fort", "faible", "moyen", "rare", "moyen", "fort", "moyen", "rare", "moyen"];
  const jours = [];
  for (let d = -25; d <= 0; d += 1) { const j = P.ajouterJours(AUJ, d); const w = new Date(j + "T12:00:00Z").getUTCDay(); if (w >= 1 && w <= 5) jours.push(j); }
  const sortie = {};
  PRENOMS.forEach((prenom, n) => {
    const [nb, tente, apprend, retour] = PROFILS[QUI[n]];
    const choisis = new Set(jours.slice(-15).filter(() => alea() < nb / 15));
    let p = P.creerParcours();
    for (const J of jours.slice(-15)) {
      if (!choisis.has(J)) continue;
      p = P.ouvrirSeance(p, C, {aujourdhui: J, alea: alea()});
      let minutes = 0;
      for (let i = 0; i < 40 && minutes < 10; i += 1) {
        const c = P.etatSeance(p, C, {aujourdhui: J}).continuer;
        if (!c) break;
        if (c.type === "paquet") {
          P.tirerCalculsDuJour(p, C, {aujourdhui: J}).forEach(x => {
            const ju = alea() < retour; const ca = ju ? {} : causeDe(x.module);
            p = P.appliquerRetour(p, {module: x.module, niveau: x.niveau, juste: ju, ms: 2500, cause: Object.keys(ca)[0] ? Number(Object.keys(ca)[0]) : undefined}, {aujourdhui: J, carte: C}).parcours;
          });
          p = P.terminerCalculsDuJour(p, {aujourdhui: J, carte: C}).parcours; minutes += 2; p = P.noterTemps(p, 120); continue;
        }
        if (c.type !== "etoile") break;
        const et = c.etage || 1;
        if (c.action === "tente") {
          const ok = alea() < tente[et - 1];
          p = P.appliquerTentative(p, {module: c.module, niveau: c.niveau, reponses: ok ? Array(6).fill({juste: true, ms: 2200}) : [{juste: true, ms: 3000}, {juste: false, ms: 4000}, {juste: false, ms: 5000}], causes: ok ? {} : causeDe(c.module)}, {aujourdhui: J, carte: C, seance: true}).parcours;
          minutes += 1; p = P.noterTemps(p, 60);
        } else {
          const ok = alea() < apprend;
          const rep = ok ? [...Array(4).fill({juste: true, outil: "image"}), ...Array(6).fill({juste: true, outil: "aucun"})]
            : [{juste: true, outil: "image"}, {juste: false, outil: "image"}, {juste: false, outil: "aucun"}, {juste: false, outil: "aucun"}];
          p = P.appliquerSerie(p, {module: c.module, niveau: c.niveau, genre: "apprends", reponses: rep, causes: ok ? {} : causeDe(c.module)}, {aujourdhui: J, carte: C, seance: true}).parcours;
          minutes += 3; p = P.noterTemps(p, 180);
        }
      }
      if (P.seanceOuverte(p, J)) p = P.fermerSeance(p, C, {aujourdhui: J, force: true}).parcours;
    }
    sortie[prenom] = p;
  });
  return sortie;
}

// ----- une copie du serveur, la classe 405
async function demarrer(etats) {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), "suivi-k2-"));
  fs.cpSync(path.join(RACINE, "_serveur/public"), dossier, {recursive: true});
  const base = path.join(dossier, "test.sqlite").replace(/\\/g, "/");
  fs.writeFileSync(path.join(dossier, "config.php"), `<?php return ['bd' => ['dsn' => 'sqlite:${base}'], 'origines' => ['https://mathsgo.re'], 'jeton_installation' => 'JETON-DE-TEST', 'records_depuis' => '2026-01-01T00:00:00.000000Z'];\n`);
  // Un port libre (un serveur resté ouvert d'une autre recette ne doit pas répondre à notre place).
  const port = await new Promise(resolve => { const t = require("node:net").createServer(); t.listen(0, "127.0.0.1", () => { const n = t.address().port; t.close(() => resolve(n)); }); });
  const php = cp.spawn("php", ["-S", `127.0.0.1:${port}`, "-t", dossier], {stdio: "ignore"});
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i += 1) { try { await fetch(url + "/api/eleve.php", {method: "POST", body: "{}"}); break; } catch (_) { await new Promise(r => setTimeout(r, 200)); } }
  const api = async (corps, jeton) => (await (await fetch(url + "/api/prof.php", {method: "POST", headers: Object.assign({"Content-Type": "application/json"}, jeton ? {Authorization: `Bearer ${jeton}`} : {}), body: JSON.stringify(corps)})).json());
  const installe = await fetch(url + "/installer.php", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: new URLSearchParams({jeton: "JETON-DE-TEST", identifiant: "gwenael", motdepasse: "motdepasse-de-test-2026"})});
  const texteInstalle = await installe.text();
  assert.match(texteInstalle, /Compte créé/, `le serveur de test s’installe : ${(texteInstalle.match(/class="message[^>]*>([^<]*)</) || [])[1]}`);
  const connexion = async () => (await api({action: "connexion", identifiant: "gwenael", motdepasse: "motdepasse-de-test-2026"})).jeton;
  const jeton = await connexion();
  assert.ok(jeton, "le serveur de test est installé");
  const classe = (await api({action: "classes.creer", libelle: "405", applis: ["defi-calcul"]}, jeton)).id;
  const prenoms = Object.keys(etats);
  await api({action: "eleves.ajouter", classe_id: classe, nombre: prenoms.length}, jeton);
  const ids = ((await api({action: "tableau", classe_id: classe, appli: "defi-calcul"}, jeton)).eleves || []).map(e => e.id).sort((a, b) => a - b);
  for (let i = 0; i < prenoms.length; i += 1) await api({action: "eleves.nommer", eleve_id: ids[i], prenom: prenoms[i], initiale: ""}, jeton);
  const sql = prenoms.map((p, i) => `INSERT INTO progressions (eleve_id, appli, donnees, maj_le, revision, donnees_avant) VALUES (${ids[i]}, 'defi-calcul', '${JSON.stringify(etats[p]).replace(/'/g, "''")}', '2026-11-27T15:00:00.000000Z', 1, NULL);`).join("\n");
  fs.writeFileSync(path.join(dossier, "seed.sql"), sql);
  cp.execFileSync("php", ["-r", `$p=new PDO("sqlite:${base}"); $p->exec(file_get_contents($argv[1]));`, path.join(dossier, "seed.sql")]);
  return {url, connexion, arreter: () => php.kill()};
}

function phpPresent() {
  try { return cp.spawnSync("php", ["-v"], {encoding: "utf8"}).status === 0; } catch (_) { return false; }
}

(async () => {
  if (!phpPresent()) { console.log("Lot K2 : PHP absent sur ce poste — la recette (le vrai serveur) n'est pas jouée ici."); return; }
  const s = await demarrer(fabriquerClasse());
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  const capture = async (page, nom, options = {}) => { if (SORTIE) await page.screenshot(Object.assign({path: path.join(SORTIE, `K2-${nom}.png`)}, options)); };
  let bilan = 0;
  for (const [format, vp] of [["ordinateur", {width: 1366, height: 657}], ["telephone", {width: 390, height: 844}]]) {
    const ouvrir = async () => {
      const ctx = await nav.newContext({viewport: vp, deviceScaleFactor: 2});
      await ctx.addInitScript(j => { sessionStorage.setItem("mathsgo-suivi-jeton", j); window.print = () => {}; }, await s.connexion());
      const page = await ctx.newPage();
      const erreurs = [];
      page.on("pageerror", e => erreurs.push(String(e)));
      await page.goto(s.url + "/prof/index.php");
      await page.waitForTimeout(1500);
      // L'onglet Défi calcul (le bouton de la rangée d'onglets, même caché au téléphone, où un menu le remplace).
      // La classe s'ouvre d'abord sur « La classe » : on attend qu'elle soit dessinée, puis on change d'onglet.
      await page.waitForFunction(() => document.querySelectorAll("#lc-tableau tbody tr").length >= 24, null, {timeout: 30000});
      await page.evaluate(() => document.querySelector('[data-appli="defi-calcul"]').click());
      await page.waitForFunction(() => !document.getElementById("vue-appli").hidden && !document.getElementById("entete-defi-calcul").hidden
        && document.querySelectorAll("#tableau tbody tr").length >= 24 && !document.getElementById("dc-ouest").hidden, null, {timeout: 30000});
      await page.waitForTimeout(800);
      return {ctx, page, erreurs};
    };
    const sansDebord = async (page, quoi) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), vp.width, `${format}, ${quoi} : rien ne sort sur le côté`);
    const cliquerEleve = (page, prenom) => page.evaluate(p => [...document.querySelectorAll("#tableau button.lien-eleve")].find(x => x.textContent === p).click(), prenom);

    // 1. L'onglet.
    let {ctx, page, erreurs} = await ouvrir();
    const lu = await page.evaluate(() => {
      const r = id => { const e = document.getElementById(id); if (!e || e.hidden) return null; const b = e.getBoundingClientRect(); return {x: b.left, y: b.top + scrollY, w: b.width, h: b.height}; };
      return {aider: r("dc-aider"), objectif: r("objectif"), reprendre: r("dc-reprendre"), ouest: r("dc-ouest"), qui: r("dc-qui"),
        prenomsAider: [...document.querySelectorAll("#dc-aider-liste li .lc-lien")].map(b => b.textContent),
        lignes: document.querySelectorAll("#dc-grille tbody tr").length, cases: document.querySelectorAll("#dc-grille button.dc-g-case").length,
        legende: document.getElementById("dc-grille-legende").innerText, peu: document.getElementById("dc-qui-peu").innerText,
        entete: [...document.querySelectorAll("#entete-defi-calcul th")].map(t => t.textContent.trim()).filter(Boolean),
        resume: document.getElementById("resume-classe").textContent};
    });
    assert.deepEqual(lu.prenomsAider, ["Gaël", "Maël", "Nina", "Rania", "Sacha", "Wendy"], `${format} : À aider`);
    if (format === "ordinateur") {
      assert.ok(lu.aider.x < lu.reprendre.x && Math.abs(lu.aider.y - lu.reprendre.y) < 2, `À aider à gauche, À reprendre à droite, en haut (${JSON.stringify([lu.aider, lu.reprendre])})`);
      assert.ok(Math.abs(lu.objectif.x - lu.aider.x) < 2 && lu.objectif.y > lu.aider.y + lu.aider.h - 1 && lu.objectif.y < lu.aider.y + lu.aider.h + 40, "Notre classe sous À aider, collée");
    } else {
      assert.ok(lu.aider.y < lu.objectif.y && lu.objectif.y < lu.reprendre.y, `au téléphone : À aider, Notre classe, À reprendre, l’une sous l’autre (${JSON.stringify([lu.aider, lu.objectif, lu.reprendre])})`);
    }
    assert.ok(lu.ouest.y > Math.max(lu.reprendre.y + lu.reprendre.h, lu.objectif.y + lu.objectif.h) && lu.qui.y > lu.ouest.y, "puis Où en est chacun, puis Qui s'entraîne");
    assert.equal(lu.lignes, 25, "24 élèves et « Gagnée par »");
    assert.equal(lu.cases, 24 * 20, "CE1 : 20 étoiles par élève");
    assert.match(lu.legende, /a réussi un retour[\s\S]*gagnée[\s\S]*ratée au dernier retour[\s\S]*perdue, à regagner[\s\S]*essayée, pas encore gagnée[\s\S]*à voir en classe[\s\S]*pas encore/);
    assert.match(lu.peu, /^Moins de 3 séances cette semaine : /);
    assert.deepEqual(lu.entete, ["Élève", "Ceinture", "Étoiles", "À surveiller", "Séances · 4 semaines", "Dernière activité"]);
    assert.match(lu.resume, /151 étoiles ouvertes dans l’appli, sur les 151 de la carte/);
    await sansDebord(page, "l'onglet");
    await capture(page, `${format}-onglet`, {fullPage: true});
    // 2. Une case de la grille : son détail par-dessus, rien ne descend.
    await page.evaluate(() => document.querySelector("#dc-grille button.dc-g-case.classe").scrollIntoView({block: "center"}));
    await page.waitForTimeout(300);
    const hauteur = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.evaluate(() => document.querySelector("#dc-grille button.dc-g-case.classe").click());
    await page.waitForTimeout(300);
    const detail = await page.evaluate(() => document.getElementById("pop-eleves").innerText);
    assert.match(detail, /Additionner au-delà de 100[\s\S]*Maël : à voir en classe[\s\S]*J’apprends arrêté 3 fois : à voir en classe/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), hauteur, "la page ne bouge pas");
    await capture(page, `${format}-case`);
    // 3. « N élèves sur 24 » : les prénoms, « Copier la liste ».
    await page.mouse.click(2, 2);
    await page.evaluate(() => { const b = document.querySelector("#dc-reprendre .bouton-nombre"); b.scrollIntoView({block: "center"}); b.click(); });
    await page.waitForTimeout(300);
    assert.match(await page.evaluate(() => document.getElementById("pop-eleves").innerText), /^Double et moitié confondus[\s\S]*Anaïs, Brice[\s\S]*Copier la liste$/);
    await capture(page, `${format}-prenoms`);
    assert.deepEqual(erreurs, [], `${format} : aucune erreur de page`);
    await ctx.close();

    // 4. La fiche de Maël, onglet Défi calcul, et sa feuille imprimée.
    ({ctx, page, erreurs} = await ouvrir());
    await cliquerEleve(page, "Maël");
    await page.waitForTimeout(800);
    await page.evaluate(() => { const t = [...document.querySelectorAll("#fe-onglets button")].find(x => x.textContent.trim() === "Défi calcul"); t && t.click(); });
    await page.waitForTimeout(500);
    const fiche = await page.evaluate(() => document.getElementById("fe-contenu").innerText);
    assert.match(fiche, /Étoiles\s+22 \/ 151[\s\S]*À surveiller\s+3[\s\S]*À voir en classe[\s\S]*Ses séances[\s\S]*Ses étoiles[\s\S]*L’appli lui dit : «/);
    assert.doesNotMatch(fiche, /prouvée|nouveauté|Compétences sues|mise de côté/);
    await capture(page, `${format}-fiche`);
    await page.evaluate(() => document.getElementById("dc-imprimer").click());
    await page.waitForTimeout(300);
    await page.emulateMedia({media: "print"});
    assert.match(await page.evaluate(() => document.getElementById("fd-corps").innerText), /^À surveiller[\s\S]*Ses étoiles[\s\S]*Pas encore commencé : [\s\S]*● a réussi un retour/);
    await capture(page, `${format}-feuille`, {fullPage: true});
    assert.deepEqual(erreurs, [], `${format} : la fiche, aucune erreur`);
    await ctx.close();

    // 5. Le réglage.
    ({ctx, page, erreurs} = await ouvrir());
    await page.evaluate(() => document.getElementById("regler-appli").click());
    await page.waitForTimeout(500);
    const reglage = await page.evaluate(() => document.getElementById("regler-corps").innerText);
    assert.match(reglage, /Jusqu’à quelle ceinture\s+Ceinture blanche-jaune · CP\s+Ceinture jaune · CE1\s+Ceinture jaune-orange · CE2\s+Ceinture orange · CM1\s+Ceinture verte · CM2\s+Ceinture bleue · 6e \(tout\)\s+Tout est ouvert jusqu’à cette ceinture\./);
    const xs = await page.evaluate(() => [...document.querySelectorAll('input[name="regler-defi-calcul-palier"]')].map(i => Math.round(i.getBoundingClientRect().left)));
    assert.equal(new Set(xs).size, 1, "les six ceintures l'une sous l'autre");
    await page.evaluate(() => document.getElementById("regler-defi-calcul-palier").scrollIntoView({block: "start"}));
    await capture(page, `${format}-reglage`);
    // « Autrement pour quelques élèves » : les ceintures ont des noms longs
    // (« Ceinture jaune-orange · CE2 ») — le nom passe à la ligne s'il le faut,
    // chaque « Choisir… » reste entier dans la fenêtre.
    const debords = await page.evaluate(() => {
      const corps = document.getElementById("regler-corps").getBoundingClientRect();
      return [...document.querySelectorAll("#regler-corps .plus-ligne")].filter(l => {
        const r = l.querySelector(".choisir").getBoundingClientRect();
        return r.right > corps.right + 1 || r.left < corps.left - 1;
      }).map(l => l.querySelector(".quoi").textContent);
    });
    assert.deepEqual(debords, [], `${format} : un « Choisir… » sort de la fenêtre`);
    await page.evaluate(() => document.querySelector("#regler-corps .plus-ligne").scrollIntoView({block: "center"}));
    await capture(page, `${format}-reglage-eleves`);
    await ctx.close();

    // 6. Le « ⋯ » : Recommencer à zéro, puis Revenir à… le défait (à l'ordinateur : une seule fois, le serveur est partagé).
    if (format === "ordinateur") {
      ({ctx, page, erreurs} = await ouvrir());
      // (Un défilement ferme les menus « ⋯ » : la ligne est amenée à l'écran d'abord.)
      const ouvrirMenu = async l => { await l.scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await l.locator("details.plus summary").click(); };
      const ligne = page.locator("#tableau tbody tr", {has: page.locator('button.lien-eleve:text-is("Rania")')});
      await ouvrirMenu(ligne);
      await page.waitForTimeout(300);
      assert.deepEqual(await ligne.locator("details.plus button").allTextContents(), ["Recommencer Défi calcul à zéro"], "pas encore de version d'avant : « Recommencer » seul");
      await capture(page, `${format}-menu`);
      await ligne.locator("details.plus button").click();
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => document.getElementById("boite-texte").innerText),
        "Recommencer Défi calcul à zéro pour Rania ?\nSes étoiles, sa ceinture et ses séances repartent de zéro, sur tous ses appareils. Pendant 7\u00a0jours, «\u00a0Revenir à…\u00a0» (dans le même menu «\u00a0⋯\u00a0») permet de faire marche arrière.");
      assert.equal(await page.evaluate(() => document.getElementById("boite-oui").textContent), "Recommencer à zéro pour Rania");
      await capture(page, `${format}-confirmation`);
      await page.click("#boite-oui");
      await page.waitForTimeout(2500);
      const apres = page.locator("#tableau tbody tr", {has: page.locator('button.lien-eleve:text-is("Rania")')});
      assert.match(await apres.innerText(), /rien reçu/);
      await ouvrirMenu(apres);
      await page.waitForTimeout(300);
      assert.deepEqual(await apres.locator("details.plus button").allTextContents(), ["Revenir à…", "Recommencer Défi calcul à zéro"]);
      await apres.locator("details.plus button", {hasText: "Revenir à…"}).click();
      await page.waitForTimeout(300);
      // (Correctif K2 : l'état d'avant est aussi gardé pour sept jours, sous son nom.)
      const libelles = await page.locator("#boite-version option").allTextContents();
      assert.match(libelles[0] || "", /^avant la remise à zéro du .+ — \d+\u00a0séances?$/, `« avant la remise à zéro » proposé en premier : ${JSON.stringify(libelles)}`);
      await capture(page, `${format}-revenir-a`);
      await page.click("#boite-oui");
      await page.waitForTimeout(300);
      await page.click("#boite-oui");
      await page.waitForTimeout(2500);
      assert.match(await page.locator("#tableau tbody tr", {has: page.locator('button.lien-eleve:text-is("Rania")')}).innerText(), /30 \/ 151/, "Revenir à… : ses étoiles reviennent");
      assert.deepEqual(erreurs, [], "le ⋯ : aucune erreur");
      await ctx.close();
    }
    bilan += 1;
    console.log(`${format} : les écrans neufs du lot K2 sont conformes.`);
  }
  await nav.close();
  s.arreter();
  assert.equal(bilan, 2);
  console.log("Lot K2 : recette des écrans réussie.");
})().catch(e => { console.error(e); process.exit(1); });
