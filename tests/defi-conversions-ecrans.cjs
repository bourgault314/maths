// Défi conversions, lot 1 : les écrans au navigateur, à 390 × 844, 375 × 667
// et 1440 × 900 (375 × 667 ajouté à l'audit du 12/11). Le robot de
// vérification du lot A2 (tests/defi-conversions-robot.cjs) joue en plus
// TOUS les écrans de chaque étape, à 4 tailles et dans 2 moteurs.
//
// Hors CI : « npm run verifier » la lance quand la branche touche l'appli
// (scripts/verifier-navigateur.mjs), ou à la main :
//   node tests/defi-conversions-ecrans.cjs
//   CHROMIUM_EXECUTABLE_PATH=/chemin/chrome node tests/defi-conversions-ecrans.cjs
//   DEFI_CONVERSIONS_CAPTURES=/dossier node tests/defi-conversions-ecrans.cjs   (dépose les captures)
//
// Ce qui est joué (hasard figé : Math.random = 0,5 ; la page donne au test
// la question à l'écran, MATHSGO_DEFI_CONVERSIONS_ECRAN.question(), pour y
// répondre juste ou faux — lot 3a : les séries mêlées et sans les questions
// déjà vues ne se recalculent plus de l'extérieur) :
//   - l'accueil d'un nouveau visiteur, sans pied de page ;
//   - « Mes premiers repères » de bout en bout : On te montre, À toi (une
//     erreur, « Je ne sais pas »), À retenir, puis Je valide JUSTE APRÈS
//     (lot 3a : une erreur corrigée tout de suite, « Je ne sais pas »), la
//     coche le jour même ;
//   - une séance avec des étapes qui reviennent : « Je me souviens » (une
//     erreur, « Je ne sais pas »), Je valide mêlé (3 questions des étapes
//     d'avant aux places 3, 6 et 9), « Avant de partir », l'étape suivante ;
//   - la ceinture jaune gagnée, puis l'accueil avec ses étoiles ;
//   - « Effacer mon historique » posé par-dessus l'écran ;
//   - Mon parcours, Mon carnet, Comment ça marche ?, le mode professeur et
//     « Voir une série » ;
//   - (audit du 12/11) le concret de On te montre : le verre doseur, la
//     balance (10 tablettes), l'horloge ; et dans À toi des durées, chaque
//     question tient dans sa largeur (elles sortaient de l'écran).
// À chaque écran : le cadre tient entier dans la fenêtre. Pendant une
// séance : RIEN NE BOUGE — question, zone d'aide, pavé et bouton gardent leur
// place et leur taille pendant la frappe, quand la zone d'aide se remplit ou
// se vide, quand la correction vient, et d'une question à l'autre.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const G = require(path.join(RACINE, "outils/conversions/conversions_generateurs.js"));
const P = require(path.join(RACINE, "outils/conversions/defi_conversions_parcours.js"));
const CARTE = require(path.join(RACINE, "outils/conversions/conversions_carte.js"));
const PAGE = "/outils/conversions/defi_conversions.html";
const CAPTURES = process.env.DEFI_CONVERSIONS_CAPTURES || "";
const GRAINE = 50000;
const JOUR = "2026-11-11";
const TAILLES = [{nom: "390x844", largeur: 390, hauteur: 844}, {nom: "375x667", largeur: 375, hauteur: 667}, {nom: "1440x900", largeur: 1440, hauteur: 900}];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"};

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const chemin = decodeURIComponent(new URL(requete.url, "http://x").pathname);
    const fichier = path.join(RACINE, chemin);
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(resolve => serveur.listen(0, "127.0.0.1", () => resolve(serveur)));
}

// DEFI_CONVERSIONS_POLICE="DejaVu Sans" : jouer avec une autre police, plus
// large qu'Inter (lot 3a : sans Inter, l'accueil dépassait chez Code).
const POLICE = (process.env.DEFI_CONVERSIONS_POLICE || "").replace(/[^\w \-]/g, "");
async function ouvrir(navigateur, base, taille, {prof = false, parcours = null} = {}) {
  const contexte = await navigateur.newContext({viewport: {width: taille.largeur, height: taille.hauteur}});
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(String(e)));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  await page.clock.setFixedTime(new Date(`${JOUR}T10:00:00`));
  await page.addInitScript(([p, police]) => {
    Math.random = () => 0.5;
    if (p && !sessionStorage.getItem("pose")) { localStorage.setItem("mathsgo-defi-conversions-parcours", p); sessionStorage.setItem("pose", "1"); }
    // Lot 3a : une autre police (les vrais appareils n'ont pas Inter).
    if (police) document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = `*{font-family:"${police}",sans-serif !important}`;
      document.head.appendChild(s);
    });
  }, [parcours ? JSON.stringify(parcours) : null, POLICE]);
  await page.goto(`${base}${PAGE}${prof ? "?prof=1" : ""}`);
  await page.waitForSelector("#cadre > *");
  return {page, contexte, erreurs};
}

async function capture(page, taille, nom) {
  if (!CAPTURES) return;
  fs.mkdirSync(CAPTURES, {recursive: true});
  await page.screenshot({path: path.join(CAPTURES, `${taille.nom}-${nom}.png`)});
}

// Le cadre tient entier : dans la fenêtre, et rien ne déborde de lui.
async function tientEntier(page, ou) {
  const m = await page.evaluate(() => {
    const c = document.getElementById("cadre");
    const r = c.getBoundingClientRect();
    return {bas: r.bottom, haut: window.innerHeight, deborde: c.scrollHeight - c.clientHeight, larg: r.right, l: window.innerWidth};
  });
  assert.ok(m.bas <= m.haut + 0.5, `${ou} : le cadre sort de la fenêtre (${m.bas} > ${m.haut})`);
  assert.ok(m.deborde <= 1, `${ou} : le contenu déborde du cadre de ${m.deborde} px`);
  assert.ok(m.larg <= m.l, `${ou} : le cadre sort en largeur`);
}

// La question tient dans sa largeur : rien ne sort du bloc « .q ».
async function questionEntiere(page, ou) {
  const sort = await page.evaluate(() => {
    const q = document.querySelector(".q");
    const r = q.getBoundingClientRect();
    return [...q.querySelectorAll("*")].filter(e => {
      const b = e.getBoundingClientRect();
      return b.width && (b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5);
    }).map(e => e.textContent);
  });
  assert.deepEqual(sort, [], `${ou} : la question sort de son cadre`);
}

// Un dessin de On te montre est entier : dans sa zone, sous l'étiquette.
async function dessinEntier(page, ou) {
  const m = await page.evaluate(() => {
    const d = document.querySelector(".zone .dessin").getBoundingClientRect();
    const z = document.querySelector(".zone").getBoundingClientRect();
    const e = document.querySelector(".zone .etiq").getBoundingClientRect();
    return {haut: d.top - e.bottom, bas: z.bottom - d.bottom, g: d.left - z.left, dr: z.right - d.right};
  });
  Object.entries(m).forEach(([k, v]) => assert.ok(v >= -0.5, `${ou} : le dessin sort de sa zone (${k} ${v})`));
}

// Les places des blocs d'une séance.
async function places(page) {
  return page.evaluate(() => {
    const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map(Math.round); };
    return {q: r(".q"), zone: r(".zone"), bas: r(".bas"), case: r(".case"), bouton: r("#cadre > .btn, #cadre > .duo"), jnsp: r("#cadre .jnsp")};
  });
}
function memesPlaces(a, b, ou) {
  for (const k of ["q", "zone", "bas", "bouton", "jnsp"]) assert.deepEqual(b[k], a[k], `${ou} : « ${k} » a bougé`);
}

// La question à l'écran (lot 3a) : la page la donne.
async function ici(page) {
  return page.evaluate(() => window.MATHSGO_DEFI_CONVERSIONS_ECRAN.question());
}
async function repondre(page, juste = true) {
  const q = await ici(page);
  assert.ok(q, "une question à l'écran");
  // Relier, ranger (lot A2 bis) : au doigt, puis Valider.
  if (q.forme === "associer" || q.forme === "ranger") {
    if (q.forme === "associer") {
      const lien = juste ? q.bonnes : [q.bonnes[1], q.bonnes[0], q.bonnes[2]];
      for (let i = 0; i < 3; i += 1) { await page.locator(".assoc .obj").nth(i).click(); await page.locator(".assoc .mes").nth(lien[i]).click(); }
    } else {
      const ordre = juste ? q.ordre : [q.ordre[1], q.ordre[0], ...q.ordre.slice(2)];
      for (const k of ordre) await page.locator(".ranger button").nth(k).click();
    }
    await page.locator("#cadre .action").click();
  } else if (q.choix) {
    const i = juste ? q.bon : (q.bon + 1) % q.choix.length;
    await page.locator(".choix button").nth(i).click();
  } else {
    const r = Array.isArray(q.reponse) ? q.reponse : [q.reponse];
    const valeurs = juste ? r : r.map(x => `${x}1`);
    for (let k = 0; k < valeurs.length; k += 1) {
      if (k) await page.keyboard.press("Tab");
      for (const c of String(valeurs[k]).replace(/\s/g, "")) await page.keyboard.press(c === "," ? "Comma" : c);
    }
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(juste ? 850 : 200);
  return q;
}
// « Je ne sais pas » (lot 3a) : la correction, sans reproche.
async function jeNeSaisPas(page) {
  const q = await ici(page);
  await page.locator("#cadre .jnsp").click();
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#cadre .verd.neutre").getByText("Regarde bien la correction.").count(), 1, "« Je ne sais pas » : la correction, sans reproche");
  assert.equal(await page.locator("#cadre .verd.ko").count(), 0, "« Je ne sais pas » : pas de « Ce n'est pas ça »");
  assert.equal(await page.locator("#cadre .jnsp").evaluate(b => getComputedStyle(b).visibility), "hidden", "« Je ne sais pas » se cache (sa place reste)");
  return q;
}
async function bouton(page, texte) {
  await page.locator("#cadre button, #voile button").filter({hasText: texte}).first().click();
  await page.waitForTimeout(60);
}

// Faire glisser la poignée du haut du glisse-unité jusqu'à une unité.
async function glisserPoignee(page, cible) {
  const p = await page.locator(".gu2-poignee.dessus").boundingBox();
  const ici = await page.locator(".gu2-tete button.on").boundingBox();
  const c = await cible.boundingBox();
  const x0 = p.x + p.width / 2;
  await page.mouse.move(x0, p.y + p.height / 2);
  await page.mouse.down();
  await page.mouse.move(x0 + (c.x - ici.x), p.y + p.height / 2, {steps: 8});
  await page.mouse.up();
  await page.waitForTimeout(250);
}

async function scenarioPremierJour(navigateur, base, taille) {
  const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille);
  const ou = `${taille.nom} premier jour`;
  await tientEntier(page, `${ou}, accueil`);
  assert.equal(await page.locator("footer, .site-footer").count(), 0, "pas de pied de page");
  assert.equal(await page.getByText("Mes premiers repères").count(), 1);
  assert.equal(await page.getByText("Tu connais déjà").count(), 1);
  // Lot 3a : pas de « Je me souviens » le premier jour ; les six ceintures.
  assert.equal(await page.locator(".etape3 div").count(), 2, "le premier jour : J'apprends, Je valide");
  assert.equal(await page.locator(".cc-rang .cc").count(), 6, "les six ceintures");
  assert.equal(await page.locator(".cc-rang .cc.gagnee").count(), 0);
  await capture(page, taille, "01-accueil");
  await bouton(page, "Commencer");
  for (let i = 0; i < 3; i += 1) {
    await tientEntier(page, `${ou}, on te montre ${i + 1}`);
    if (i === 0) await capture(page, taille, "02-on-te-montre");
    await bouton(page, "Suivant");
    // « Suivant » sans le geste le joue : on reste sur ce temps.
    await page.waitForTimeout(3500);
    if ((await page.locator(".bseance .chip").textContent()).replace(/\s/g, "") === `${i + 1}/3`) await bouton(page, "Suivant");
  }
  // À toi : une erreur, « Je ne sais pas », puis juste jusqu'au bout. Rien ne bouge.
  const avant = await places(page);
  await tientEntier(page, `${ou}, à toi`);
  await capture(page, taille, "03-a-toi-outil");
  await repondre(page, false);
  memesPlaces(avant, await places(page), `${ou}, après une erreur`);
  await capture(page, taille, "04-a-toi-erreur");
  await bouton(page, "Suivant");
  memesPlaces(avant, await places(page), `${ou}, la question après l'erreur`);
  await jeNeSaisPas(page);
  memesPlaces(avant, await places(page), `${ou}, après « Je ne sais pas »`);
  await bouton(page, "Suivant");
  let i = 2;
  while (await page.locator(".retenir, .cahier").count() === 0 && i < 25) {
    memesPlaces(avant, await places(page), `${ou}, question ${i + 1}`);
    await repondre(page);
    i += 1;
  }
  assert.ok(await page.locator(".retenir, .cahier").count(), "À retenir après « À toi »");
  await tientEntier(page, `${ou}, à retenir`);
  assert.equal(await page.getByText("Je valide s'ouvre demain").count(), 0, "lot 3a : plus d'attente");
  await capture(page, taille, "05-a-retenir");
  let stocke = await page.evaluate(() => JSON.parse(localStorage.getItem("mathsgo-defi-conversions-parcours")));
  assert.equal(stocke.version, 2);
  assert.equal(stocke.etapes.R1[1], JOUR, "« À toi » réussi enregistré");
  assert.equal(stocke.etapes.R1[2], null, "pas encore validée");
  // Je valide, juste après : une erreur à la 4e, corrigée tout de suite ;
  // « Je ne sais pas » à la 6e. Rien ne bouge.
  await bouton(page, "Je valide");
  assert.equal(await page.locator(".bseance").getByText("Je valide").count(), 1);
  const vus = [];
  const avantV = await places(page);
  for (let k = 0; k < 10; k += 1) {
    memesPlaces(avantV, await places(page), `${ou}, Je valide ${k + 1}`);
    if (k === 3) {
      vus.push(await repondre(page, false));
      memesPlaces(avantV, await places(page), `${ou}, Je valide après l'erreur`);
      assert.equal(await page.locator(".zone .etiq").getByText("La bonne réponse").count(), 1, "la correction tout de suite");
      assert.equal(await page.getByText("Tu verras la correction à la fin.").count(), 0);
      await tientEntier(page, `${ou}, Je valide, la correction`);
      await capture(page, taille, "06-je-valide-erreur");
      await bouton(page, "Suivant");
    } else if (k === 5) {
      vus.push(await jeNeSaisPas(page));
      memesPlaces(avantV, await places(page), `${ou}, Je valide après « Je ne sais pas »`);
      await bouton(page, "Suivant");
    } else vus.push(await repondre(page));
  }
  assert.equal(new Set(vus.map(q => q.cle)).size, 10, "dix questions différentes");
  assert.equal(await page.getByText("Étape validée").count(), 1);
  assert.equal(await page.locator(".corr div").count(), 2, "les deux erreurs rappelées à la fin");
  assert.equal(await page.locator(".corr").getByText("je ne savais pas").count(), 1);
  await tientEntier(page, `${ou}, validée`);
  await capture(page, taille, "07-validee");
  stocke = await page.evaluate(() => JSON.parse(localStorage.getItem("mathsgo-defi-conversions-parcours")));
  assert.equal(stocke.etapes.R1[2], JOUR, "la coche le jour même");
  assert.equal(stocke.etapes.R1[3], 1);
  const s = Object.values(stocke.seances);
  assert.equal(s.length, 1);
  assert.deepEqual([s[0][1], s[0][2], s[0][3], s[0][4]], [1, 1, 1, 1], "séance : étape R1, On te montre vu, À toi réussi, Je valide réussie");
  // Revenu à l'accueil : l'étape suivante ; rien à se rappeler aujourd'hui.
  await bouton(page, "Accueil");
  await page.reload();
  await page.waitForSelector("#cadre > *");
  assert.equal(await page.locator(".carte.bleue").getByText("Quelle unité choisir").count(), 1);
  assert.equal(await page.locator(".etape3 div").count(), 2, "rien ne revient le jour même");
  await tientEntier(page, `${ou}, accueil le même jour`);
  // Effacer mon historique : par-dessus, rien ne bouge derrière.
  const cadreAvant = await page.locator("#cadre").boundingBox();
  await page.getByText("Effacer mon historique").click();
  assert.ok(await page.locator("#voile").isVisible());
  assert.deepEqual(await page.locator("#cadre").boundingBox(), cadreAvant, "le cadre ne bouge pas sous la question");
  await capture(page, taille, "08-effacer");
  await page.getByText("Oui, tout effacer").click();
  assert.equal(await page.getByText("Commencer").count(), 1);
  const efface = await page.evaluate(() => JSON.parse(localStorage.getItem("mathsgo-defi-conversions-parcours")));
  assert.deepEqual(efface, {version: 2, epoque: 1, etapes: {}, reperes: {}, seances: {}});
  assert.deepEqual(erreurs, []);
  await contexte.close();
}

async function scenarioLendemain(navigateur, base, taille) {
  // Quatre étapes validées les jours d'avant (elles reviennent toutes
  // aujourd'hui), « À toi » de la cinquième réussi ce matin : la séance
  // commence par « Je me souviens », puis Je valide (mêlé).
  let p = P.creer();
  [["R1", "2026-11-05"], ["R2", "2026-11-06"], ["P1", "2026-11-07"], ["C1", "2026-11-09"]].forEach(([c, d]) => {
    p = P.marquerEntrainee(p, c, d);
    p = P.noterValidation(p, c, true, d);
  });
  p = P.marquerEntrainee(p, "C2", JOUR);
  const prets = CARTE.ORDRE.filter(c => CARTE.etape(c).pret);
  const souvenirs = P.tirerSouvenirs(p, JOUR, prets);
  assert.deepEqual(souvenirs.map(x => x.code), ["R1", "R2", "P1", "C1"]);
  const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {parcours: p});
  const ou = `${taille.nom} lendemain`;
  assert.deepEqual(await page.locator(".etape3 div").allTextContents(), ["①Je me souviens", "✓J'apprends", "③Je valide"]);
  await tientEntier(page, `${ou}, accueil`);
  await capture(page, taille, "09-accueil-souvenirs");
  await bouton(page, "C'est parti");
  // Je me souviens : 8 questions (2 par étape, mêlées), une erreur à la 1re,
  // « Je ne sais pas » à la 2e.
  assert.equal(await page.locator(".bseance").getByText("Je me souviens").count(), 1);
  assert.equal((await page.locator(".bseance .chip").textContent()).replace(/\s/g, ""), "1/8");
  const avant = await places(page);
  await capture(page, taille, "10-je-me-souviens");
  const vus = [await repondre(page, false)];
  memesPlaces(avant, await places(page), `${ou}, Je me souviens après l'erreur`);
  await tientEntier(page, `${ou}, Je me souviens, la correction`);
  await capture(page, taille, "11-je-me-souviens-erreur");
  await bouton(page, "Suivant");
  vus.push(await jeNeSaisPas(page));
  memesPlaces(avant, await places(page), `${ou}, Je me souviens après « Je ne sais pas »`);
  await bouton(page, "Suivant");
  for (let k = 2; k < 8; k += 1) {
    memesPlaces(avant, await places(page), `${ou}, Je me souviens ${k + 1}`);
    vus.push(await repondre(page));
  }
  assert.deepEqual(vus.map(q => q.code), ["R1", "R2", "P1", "C1", "R1", "R2", "P1", "C1"], "les étapes se mêlent");
  assert.equal(await page.getByText("6 justes sur 8").count(), 1);
  assert.equal(await page.getByText("Ce que tu as raté revient « Avant de partir ».").count(), 1);
  await tientEntier(page, `${ou}, fin de Je me souviens`);
  await capture(page, taille, "12-je-me-souviens-fin");
  let stocke = await page.evaluate(() => JSON.parse(localStorage.getItem("mathsgo-defi-conversions-parcours")));
  assert.deepEqual(["R1", "R2", "P1", "C1"].map(c => [stocke.etapes[c][5], stocke.etapes[c][6], stocke.etapes[c][7]]),
    [[0, 1, JOUR], [0, 1, JOUR], [1, 0, JOUR], [1, 0, JOUR]], "les retours notés : R1 et R2 ratés, P1 et C1 réussis");
  await bouton(page, "Mon étape : Je valide");
  // Je valide mêlé : aux places 3, 6 et 9, les étapes d'avant (les plus proches d'abord).
  const plan = P.planValidation(stocke, "C2", CARTE.etapesDuPalier(1).map(e => e.code));
  assert.deepEqual([plan[2], plan[5], plan[8]], ["C1", "P1", "R2"]);
  const avantV = await places(page);
  const vv = [];
  for (let k = 0; k < 10; k += 1) {
    memesPlaces(avantV, await places(page), `${ou}, Je valide ${k + 1}`);
    if (k === 2) await capture(page, taille, "13-je-valide-melange");
    vv.push(await repondre(page));
  }
  assert.deepEqual(vv.map(q => q.code), plan, "Je valide suit le plan mêlé");
  vv.forEach(q => assert.ok(!vus.some(x => x.cle === q.cle), `${ou} : « ${q.cle} » déjà vue dans Je me souviens`));
  assert.equal(await page.getByText("Étape validée").count(), 1);
  await tientEntier(page, `${ou}, validée`);
  // Avant de partir : ce qui a été raté (R1, R2), redemandé ; rien n'est compté.
  await bouton(page, "Avant de partir");
  assert.equal((await page.locator(".bseance .chip").textContent()).replace(/\s/g, ""), "1/2");
  await capture(page, taille, "14-avant-de-partir");
  const avantD = await places(page);
  const vd = [await repondre(page, false)];
  memesPlaces(avantD, await places(page), `${ou}, Avant de partir après l'erreur`);
  await bouton(page, "Suivant");
  vd.push(await repondre(page));
  assert.deepEqual(vd.map(q => q.code), ["R1", "R2"]);
  assert.equal(await page.getByText("rien n'est compté", {exact: false}).count(), 1);
  await tientEntier(page, `${ou}, fin de Avant de partir`);
  await capture(page, taille, "15-avant-de-partir-fin");
  const apres = await page.evaluate(() => JSON.parse(localStorage.getItem("mathsgo-defi-conversions-parcours")));
  assert.deepEqual(apres.etapes.R1, stocke.etapes.R1, "Avant de partir n'enregistre rien");
  assert.equal(apres.etapes.C2[2], JOUR);
  const s = Object.values(apres.seances);
  assert.equal(s.length, 1);
  assert.deepEqual([s[0][1], s[0][4], s[0][5], s[0][6], s[0][7], s[0][8]], [5, 1, 8, 6, 1, 2], "séance : C2, Je valide réussie, 8 souvenirs, 6 justes, R1 et R2 ratés");
  // L'étape suivante enchaîne sur J'apprends.
  await bouton(page, "Étape suivante");
  assert.equal(await page.locator(".bseance").getByText("Les euros et les centimes").count(), 1);
  await tientEntier(page, `${ou}, étape suivante`);
  // Mon parcours, Mon carnet, Comment ça marche ?
  await page.locator(".bseance .rond").click();
  await page.getByText("Mon parcours").click();
  await tientEntier(page, `${ou}, mon parcours`);
  assert.equal(await page.locator(".li2.ok").count(), 5);
  assert.equal(await page.locator(".pceinture").getByText("Ceinture jaune : 5 étapes validées sur 10").count(), 1);
  await capture(page, taille, "16-mon-parcours");
  await page.locator(".pal-tabs button").nth(3).click();
  assert.equal(await page.getByText("Ce palier est en préparation").count(), 1);
  await page.locator(".tete-ecran .rond").click();
  await page.getByText("Mon carnet").click();
  await tientEntier(page, `${ou}, carnet`);
  assert.equal(await page.locator(".carnet .carte-rep").count(), 10); // lot A2 ter : la règle (1 mm) en plus
  await capture(page, taille, "17-carnet");
  await page.locator(".tete-ecran .rond").click();
  await page.getByText("Comment ça marche ?").click();
  await tientEntier(page, `${ou}, comment ça marche`);
  assert.equal(await page.getByText("Pour le professeur : lancer l'appli en classe").count(), 1);
  assert.equal(await page.getByText("échauffement", {exact: false}).count(), 0, "lot 3a : plus d'échauffement");
  assert.deepEqual(erreurs, []);
  await contexte.close();
}

// La ceinture jaune : neuf étapes validées depuis longtemps, solides pour
// six d'entre elles, « À toi » de la dixième réussi ce matin.
async function scenarioCeinture(navigateur, base, taille) {
  const prets = CARTE.ORDRE.filter(c => CARTE.etape(c).pret);
  let p = P.creer();
  prets.slice(0, 9).forEach((c, i) => {
    const d = P.ajouterJours(JOUR, -(40 - i));
    p = P.noterTest(p, c, d);
    [1, 4, 11, 25].forEach((n, k) => { if (k < 3 || i < 6) p = P.noterRetour(p, c, true, P.ajouterJours(d, n), 100 + k); });
  });
  p = P.marquerEntrainee(p, prets[9], JOUR);
  const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {parcours: p});
  const ou = `${taille.nom} ceinture`;
  assert.match(await page.locator(".acc-palier .etoiles").textContent(), /9\s★/);
  await tientEntier(page, `${ou}, accueil`);
  await bouton(page, "C'est parti");
  for (let k = 0; k < 14 && !(await page.locator(".titre-fin").count()); k += 1) await repondre(page);
  if (await page.locator(".bseance").getByText("Je me souviens").count()) await page.locator("#cadre > .btn").last().click();
  for (let k = 0; k < 10 && !(await page.getByText("Étape validée").count()); k += 1) await repondre(page);
  await bouton(page, "Continuer");
  assert.equal(await page.getByText("Ceinture jaune !").count(), 1);
  assert.equal(await page.locator(".ceinture-gde svg").count(), 1);
  await tientEntier(page, `${ou}, ceinture gagnée`);
  await capture(page, taille, "18-ceinture-gagnee");
  await bouton(page, "Continuer");
  await page.waitForTimeout(100);
  assert.equal(await page.locator(".cc-rang .cc.gagnee").count(), 1, "la ceinture jaune sur l'accueil");
  assert.equal(await page.locator(".cc-tete").getByText("1 sur 6").count(), 1);
  await tientEntier(page, `${ou}, accueil avec la ceinture`);
  await capture(page, taille, "19-accueil-ceinture");
  assert.deepEqual(erreurs, []);
  await contexte.close();
}

async function scenarioProf(navigateur, base, taille) {
  const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {prof: true});
  const ou = `${taille.nom} prof`;
  await tientEntier(page, `${ou}, accueil`);
  assert.equal(await page.getByText("toutes les étapes, rien n'est enregistré").count(), 1);
  await page.getByText("Changer d'étape").click();
  await tientEntier(page, `${ou}, changer d'étape`);
  await page.getByText("Vers une unité plus petite").click();
  await page.getByText("Voir une série").click();
  await tientEntier(page, `${ou}, voir une série`);
  assert.equal(await page.locator("table.serie tr").count(), 10);
  const v = G.serie("C1", {usage: "valide", graine: GRAINE});
  assert.equal(await page.locator("table.serie tr").first().locator(".rp").textContent(), v[0].reponseTexte);
  await capture(page, taille, "13-voir-une-serie");
  await page.locator(".tete-ecran .rond").click();
  // À toi en mode prof : rien n'est enregistré ; les places tiennent.
  await page.getByText("J'apprends : à toi").click();
  const avant = await places(page);
  const caseAvant = (await places(page)).case;
  await page.keyboard.press("4");
  await page.keyboard.press("5");
  assert.deepEqual((await places(page)).case, caseAvant, "la case ne change pas de taille pendant la frappe");
  // Le glisse-unité de Gwenaël (lot A2) : on fait glisser la poignée
  // « L'unité de mesure » jusqu'à la dernière unité, au doigt (souris) ; les
  // deux poignées vont ensemble, les zéros remplissent, rien ne bouge autour.
  await glisserPoignee(page, page.locator(".gu2-tete button:not([disabled])").last());
  assert.equal(await page.locator(".gu2-tete button:not([disabled])").last().evaluate(b => b.classList.contains("on")), true, `${ou} : la poignée est arrivée`);
  // Lot 3a (« remettre les mots le chiffre des unités ») : les deux poignées
  // partout, au téléphone comme à l'ordinateur, et elles glissent ensemble.
  const pointes = await page.evaluate(() => [...document.querySelectorAll(".gu2-pointe")].filter(e => getComputedStyle(e).display !== "none").map(e => Math.round(e.getBoundingClientRect().x)));
  assert.equal(pointes.length, 2, `${ou} : les deux poignées sont là`);
  assert.equal(pointes[0], pointes[1], `${ou} : les deux poignées glissent ensemble`);
  assert.equal(await page.locator(".gu2-poignee.dessous").evaluate(e => getComputedStyle(e).display !== "none" && e.textContent), "Le chiffre des unités");
  // Le cadre du curseur entoure le chiffre en entier (il le coupait au téléphone).
  const coupe = await page.evaluate(() => {
    const c = document.querySelector(".gu2-curseur").getBoundingClientRect();
    const u = document.querySelector(".gu2-chiffres span.unite").getBoundingClientRect();
    return c.bottom + 0.5 < u.bottom || c.top - 0.5 > u.top;
  });
  assert.equal(coupe, false, `${ou} : le cadre du curseur coupe le chiffre`);
  memesPlaces(avant, await places(page), `${ou}, glisse-unité`);
  await tientEntier(page, `${ou}, à toi`);
  assert.equal(await page.evaluate(() => localStorage.getItem("mathsgo-defi-conversions-parcours")), null, "rien n'est enregistré");
  assert.deepEqual(erreurs, []);
  await contexte.close();
}

// Le concret de On te montre (audit du 12/11) et les durées au téléphone.
async function scenarioConcret(navigateur, base, taille) {
  const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {prof: true});
  const ou = `${taille.nom} concret`;
  const choisir = async nom => {
    await page.getByText("Changer d'étape").click();
    await page.locator("#cadre").getByText(nom, {exact: true}).first().click();
  };
  const caseRemplie = async attendu => {
    const t = await page.locator(".q .case").first().textContent();
    assert.equal(t.replace(/\s/g, ""), attendu, `${ou} : la case de On te montre`);
  };
  // Les relations des bases : la règle, le verre doseur, la balance.
  await choisir("Les relations des bases");
  await page.getByText("J'apprends : on te montre").click();
  // Lot A2 ter : « Suivant » sans avoir touché le mètre joue le geste (le
  // mètre s'ouvre tout seul, la case se remplit) ; le second appui passe au
  // temps suivant.
  await page.getByText("Suivant").click();
  await page.waitForTimeout(1200);
  await caseRemplie("100");
  assert.equal(await page.locator(".dessin.verre").count(), 0, "on reste sur le mètre");
  await page.getByText("Suivant").click();
  assert.equal(await page.locator(".dessin.verre").count(), 1, "le verre doseur");
  await tientEntier(page, `${ou}, verre doseur`);
  await page.locator(".dessin.verre").click();
  await caseRemplie("100");
  await dessinEntier(page, `${ou}, verre doseur`);
  await tientEntier(page, `${ou}, verre doseur gradué`);
  await capture(page, taille, "14-verre-doseur");
  await page.getByText("Suivant").click();
  for (let k = 0; k < 9; k += 1) await page.locator(".dessin.balance").click();
  assert.equal((await page.locator(".q .case").first().textContent()).trim(), "", `${ou} : 9 tablettes, pas encore`);
  await page.locator(".dessin.balance").click();
  await caseRemplie("1000");
  await dessinEntier(page, `${ou}, balance`);
  await tientEntier(page, `${ou}, balance`);
  await capture(page, taille, "15-balance");
  await page.getByText("Suivant").click();
  // Heures et minutes : l'horloge, 4 quarts d'heure.
  await choisir("Heures et minutes");
  await page.getByText("J'apprends : on te montre").click();
  for (let k = 0; k < 3; k += 1) await page.locator(".dessin.horloge").click();
  assert.equal((await page.locator(".q .case").first().textContent()).trim(), "", `${ou} : 3 quarts d'heure, pas encore`);
  await page.locator(".dessin.horloge").click();
  await caseRemplie("60");
  await dessinEntier(page, `${ou}, horloge`);
  await tientEntier(page, `${ou}, horloge`);
  await capture(page, taille, "16-horloge");
  await page.getByText("Suivant").click();
  await page.getByText("Suivant").click();
  await questionEntiere(page, `${ou}, 1 h 10 min`);
  // À toi des durées : chaque question tient dans sa largeur, rien ne bouge.
  for (const [nom, code] of [["Heures et minutes", "D1"], ["La demi-heure, le quart d'heure", "D2"]]) {
    await page.locator(".bseance .rond").click();
    await choisir(nom);
    await page.getByText("J'apprends : à toi").click();
    const avant = await places(page);
    for (let i = 0; i < 6; i += 1) {
      await questionEntiere(page, `${ou}, ${code} question ${i + 1}`);
      memesPlaces(avant, await places(page), `${ou}, ${code} question ${i + 1}`);
      await tientEntier(page, `${ou}, ${code} question ${i + 1}`);
      if (i === 0) await capture(page, taille, `17-${code}-a-toi`);
      await repondre(page);
    }
  }
  assert.deepEqual(erreurs, []);
  await contexte.close();
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const navigateur = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echec = null;
  try {
    for (const taille of TAILLES) {
      await scenarioPremierJour(navigateur, base, taille);
      await scenarioLendemain(navigateur, base, taille);
      await scenarioCeinture(navigateur, base, taille);
      await scenarioProf(navigateur, base, taille);
      await scenarioConcret(navigateur, base, taille);
      console.log(`✓ ${taille.nom}`);
    }
  } catch (e) {
    echec = e;
  } finally {
    await navigateur.close();
    serveur.close();
  }
  if (echec) { console.error(echec); process.exitCode = 1; } else console.log("Défi conversions : écrans verts.");
})();
