// Défi calcul, lot « la 6e complète » (27/11/2026) : la VRAIE page, au
// navigateur, élève connecté par code (faux serveur de suivi), au téléphone
// (390 × 844) et à l'ordinateur (1366 × 657).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-6e-complete-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-6e-complete-ecrans.cjs
// Un format : FORMATS=1366x657 node tests/defi-calcul-lot-6e-complete-ecrans.cjs
//
// Les écrans NEUFS du lot (règle du 15/11), chacun : rien ne sort sur le
// côté ; à l'ordinateur, le cadre tient entier dans l'écran.
//   choisir   « Où va la virgule ? » (planche 2) : trois cases à la place du
//             pavé, qui garde sa place (rien ne bouge d'un calcul à
//             l'autre) ; la case touchée en bleu ; juste : ✓ ; faux : la
//             bonne en vert ✓, la fausse en tirets ✗, la phrase dessous ;
//             « Nouveau : je choisis la bonne réponse. » ; les chiffres du
//             clavier ne tapent rien, les flèches choisissent ;
//   jour      Mes calculs du jour : un faux, le 2e calcul de la même sorte,
//             à choisir aussi ;
//   erreurs   le bilan « Mes erreurs » d'un « Je tente » raté ;
//   lecons    On te montre, J'écris (début, fin), À retenir des dix étoiles,
//             la carte par cœur de « 0,1 et 1/10 » ;
//   carte     l'étage « La 6e », ses 22 étoiles en six lignes ; à
//             l'ordinateur, la hauteur du cadre ne change pas d'un onglet à
//             l'autre (lot P1).

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
const JOUR = "2026-11-28";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = process.env.FORMATS ? process.env.FORMATS.split(",").map(x => x.split("x").map(Number)) : [[390, 844], [1366, 657]];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp", ".json": "application/json"};
const NEUVES = process.env.NIVEAUX ? process.env.NIVEAUX.split(",").map(k => [k.split("-")[0], Number(k.split("-")[1])])
  : [["D10", 1], ["D10", 2], ["D11", 1], ["D14", 1], ["D12", 1], ["D16", 1], ["F11", 3], ["F10", 1], ["P1", 1], ["P2", 1]];
const sp = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

// Une progression où toute la 6e d'avant est gagnée hier (la carte de 6e).
function sixiemeAvant() {
  let p = P.creerParcours();
  const six = Array.from({length: 6}, () => ({juste: true, ms: 1500}));
  const hier = P.ajouterJours(JOUR, -1);
  const cles = CARTE.lignes.filter(l => l.etage === 6).flatMap(l => l.cles).filter(k => !NEUVES.some(([id, n]) => `${id}-${n}` === k));
  for (let tour = 0; tour < 4; tour += 1) {
    for (const k of cles) {
      const [module, niveau] = k.split("-");
      const r = P.appliquerTentative(p, {module, niveau: Number(niveau), reponses: six}, {aujourdhui: hier, carte: CARTE});
      if (!r.refuse) p = r.parcours;
    }
  }
  return p;
}

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

async function ouvrir(nav, base, {largeur, hauteur, parcours = null}) {
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
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "6e", applis: [], reglages: {}});
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

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(80); };
const appel = (page, nom, ...args) => page.evaluate(([n, a]) => window.__MATHSGO_DEFI_CALCUL_TEST__[n](...a), [nom, args]);
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText : null; }, s).then(sp);
async function photo(page, n) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.waitForTimeout(300);
  await page.screenshot({path: path.join(SORTIE, `${n}.png`)});
}
async function tient(page, largeur, hauteur, quoi, {glisse = false} = {}) {
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
  // (Le glisse-nombres de « × 10 » (D2, D3) déborde de la même façon au
  // téléphone : la bande passe sous le cadre, ses colonnes vides. Écran
  // d'avant, pas de ce lot.)
  if (glisse) m.sortent = m.sortent.filter(x => x !== "place-value-strip");
  assert.equal(m.large, true, `${quoi} : pas de défilement de côté`);
  assert.deepEqual(m.sortent, [], `${quoi} : rien ne sort de l'écran`);
  if (largeur > 620) assert.ok(m.bas <= hauteur + 0.5, `${quoi} : le cadre tient entier (${Math.round(m.bas)} / ${hauteur})`);
}
const boite = (page, sel) => page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(x => Math.round(x)); }, sel);
const memePlace = (a, b) => Boolean(a && b) && a.every((x, i) => Math.abs(x - b[i]) <= 1);
const cases = page => page.evaluate(() => [...document.querySelectorAll("#choix .dc-choix-case")].map(b => ({t: b.textContent.replace(/[  ]/g, " "), c: b.className.replace("dc-choix-case", "").trim(), coche: b.getAttribute("aria-checked")})));
const valideSeVoit = page => page.evaluate(() => { const p = document.querySelector(".panel:not([hidden])").getBoundingClientRect(); const v = document.querySelector("#validate").getBoundingClientRect(); return v.bottom <= p.bottom + .5 && v.bottom <= innerHeight + .5; });
// Toucher la case d'une valeur (ou une autre que celle-là).
async function choisir(page, valeur, {autre = false} = {}) {
  const liste = await cases(page);
  const i = liste.findIndex(c => (sp(c.t) === sp(CORE.formaterNombre(valeur))) !== autre);
  assert.ok(i >= 0, `une case ${autre ? "autre que" : "pour"} ${valeur}`);
  await page.click(`#choix .dc-choix-case:nth-child(${i + 1})`);
  await pause(page, 150);
  return liste[i].t;
}
async function taper(page, nombre) {
  for (const c of CORE.formaterNombre(nombre)) {
    if (!c.trim() || c === " " || c === " ") continue;
    await page.click(`#play [data-key="${c}"]`);
  }
}
// Une réponse juste, au pavé ou dans les cases.
async function repondreJuste(page, attendu) {
  if (Array.isArray(attendu.choix)) await choisir(page, attendu.reponse);
  else if (typeof attendu.ecrite === "string" && attendu.ecrite.includes("/")) {
    const [num, den] = attendu.ecrite.split("/");
    await page.keyboard.type(num); await page.keyboard.press("/"); await page.keyboard.type(den);
  } else await taper(page, attendu.reponse);
  await page.click("#validate");
  await pause(page, 600);
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };

  for (const [largeur, hauteur] of FORMATS) {
    const f = `${largeur}x${hauteur}`;

    await cas(`${f} : « Je tente » Où va la virgule ? — les trois cases à la place du pavé, la case touchée, juste, faux`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      // La place du pavé sur un calcul ordinaire de 6e (« Décimal × un chiffre »).
      assert.ok(await appel(s.page, "tenter", "D11", 1));
      await pause(s.page, 500);
      const pave = await boite(s.page, "#question-card > .keypad");
      await photo(s.page, `${f}-choisir-0-avant`);
      await appel(s.page, "tenter", "D16", 1);
      await pause(s.page, 500);
      const calcul = await appel(s.page, "calcul");
      assert.ok(Array.isArray(calcul.choix), "un calcul à choisir");
      assert.equal(sp(await texte(s.page, "#annonce")), "Nouveau : je choisis la bonne réponse.");
      assert.equal((await cases(s.page)).length, 3);
      // (Au premier calcul, l'annonce « Nouveau : … » prend sa place, comme
      // toute annonce ; la place du pavé se compare au calcul suivant.)
      const choix = await boite(s.page, "#choix");
      const ici = await boite(s.page, "#question-card > .keypad");
      assert.ok(Math.abs((choix[1] + choix[3]) - (ici[1] + ici[3])) <= 1 && memePlace([choix[0], choix[2]], [ici[0], ici[2]]), "les cases sont en bas de la place du pavé, de sa largeur");
      assert.equal(await s.page.evaluate(() => document.querySelector("#expression .inline-answer") === null), true, "pas de case dans le calcul");
      assert.ok(await valideSeVoit(s.page), "« Valider » se voit");
      await tient(s.page, largeur, hauteur, "à choisir");
      await photo(s.page, `${f}-choisir-1`);
      // Les chiffres du clavier ne tapent rien ; la flèche choisit.
      await s.page.keyboard.type("10");
      assert.deepEqual((await cases(s.page)).map(c => c.c), ["", "", ""], "les chiffres ne tapent rien");
      await s.page.keyboard.press("ArrowRight");
      await pause(s.page, 100);
      assert.deepEqual((await cases(s.page)).map(c => c.c), ["est-choisie", "", ""], "la flèche choisit la première");
      // Valider sans rien : le message.
      await s.page.evaluate(() => { document.querySelectorAll("#choix .dc-choix-case").forEach(b => b.classList.remove("est-choisie")); });
      // La bonne, touchée : un trait bleu ; validée : ✓.
      await choisir(s.page, calcul.reponse);
      const touche = await cases(s.page);
      assert.equal(touche.filter(c => c.c === "est-choisie").length, 1);
      assert.ok(memePlace(await boite(s.page, "#choix"), choix), "rien ne bouge quand on touche");
      await photo(s.page, `${f}-choisir-2-touchee`);
      await s.page.click("#validate");
      await pause(s.page, 300);
      assert.deepEqual((await cases(s.page)).map(c => c.c).filter(Boolean), ["est-juste"]);
      assert.match(sp(await texte(s.page, "#answer-feedback")), /Juste/);
      await photo(s.page, `${f}-choisir-3-juste`);
      await pause(s.page, 2500);
      // Le calcul suivant (sans annonce) : le pavé a la place qu'il a sur un
      // calcul ordinaire de 6e. Une fausse — au test, ✗ sans la bonne.
      const deuxieme = await appel(s.page, "calcul");
      // (L'annonce du premier calcul fixe l'échelle de la série, comme toute
      // annonce : d'un calcul à l'autre de la série, rien ne bouge.)
      const pave16 = await boite(s.page, "#question-card > .keypad");
      // (À l'ordinateur, l'annonce partie, le calcul et le pavé remontent
      // ensemble, comme après toute annonce ; leur taille ne change pas.)
      assert.ok(memePlace(pave16.slice(2), ici.slice(2)) && Math.abs(pave16[0] - ici[0]) <= 1, `le pavé garde sa taille d'un calcul à l'autre (${ici} → ${pave16})`);
      if (largeur <= 620) assert.ok(memePlace(pave16, ici), "au téléphone, sa place aussi");
      assert.ok(memePlace((await boite(s.page, "#choix")).slice(2), choix.slice(2)), "les cases aussi");
      console.log(`        ${f} : le pavé d'un calcul ordinaire de 6e ${pave}, d'un calcul à choisir ${pave16}`);
      await photo(s.page, `${f}-choisir-5-deuxieme`);
      await choisir(s.page, deuxieme.reponse, {autre: true});
      await s.page.click("#validate");
      await pause(s.page, 300);
      assert.deepEqual((await cases(s.page)).map(c => c.c).filter(Boolean), ["est-faux"], "au test : la fausse, sans la bonne");
      await photo(s.page, `${f}-choisir-4-tente-faux`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : l'entraînement — faux : la bonne ✓, la fausse ✗, la phrase de méthode, sans dessin`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const t of [`37 × 29 = ${CORE.formaterNombre(1073)}, donc 3,7 × 2,9 = ${CORE.CASE}`, `3,8 × 2,9 est proche de ${CORE.CASE}`]) {
        assert.ok(await appel(s.page, "poser", "D16", 1, t), `posé : ${t}`);
        await pause(s.page, 500);
        const calcul = await appel(s.page, "calcul");
        await photo(s.page, `${f}-entraine-${calcul.forme}`);
        await choisir(s.page, calcul.reponse, {autre: true});
        await s.page.click("#validate");
        await pause(s.page, 500);
        const vu = await cases(s.page);
        assert.deepEqual(vu.map(c => c.c).filter(Boolean).sort(), ["est-faux", "est-juste"], `${t} : la bonne et la fausse`);
        assert.equal(sp(vu.find(c => c.c === "est-juste").t), sp(CORE.formaterNombre(calcul.reponse)));
        assert.match(sp(await texte(s.page, "#answer-feedback")), /est proche de/, "la phrase de méthode");
        assert.equal(await s.page.evaluate(() => document.getElementById("aide").hidden), true, "pas de dessin");
        await tient(s.page, largeur, hauteur, `${t} : la correction`);
        await photo(s.page, `${f}-entraine-${calcul.forme}-faux`);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : Mes calculs du jour — un faux, puis le 2e calcul de la même sorte, à choisir aussi`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      // (« apprends » : apprise il y a 4 jours, revenue une fois — elle est due aujourd'hui.)
      await appel(s.page, "jour", "D16", 1, `3,8 × 2,9 est proche de ${CORE.CASE}`, "apprends");
      await pause(s.page, 500);
      const premier = await appel(s.page, "calcul");
      assert.equal((await cases(s.page)).length, 3);
      await choisir(s.page, premier.reponse, {autre: true});
      await s.page.click("#validate");
      await pause(s.page, 400);
      await photo(s.page, `${f}-jour-faux`);
      await pause(s.page, 3000);
      await s.page.click("#validate");
      await pause(s.page, 500);
      const second = await appel(s.page, "calcul");
      assert.ok(second && Array.isArray(second.choix), "le 2e calcul est à choisir");
      assert.equal(CORE.sorteDe(second), CORE.sorteDe(premier), "de la même sorte");
      assert.notEqual(second.texte, premier.texte);
      assert.equal(sp(await texte(s.page, "#annonce")), "Un autre, pour vérifier.");
      await photo(s.page, `${f}-jour-deuxieme`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : le bilan d'un « Je tente » raté — Mes erreurs, la bonne réponse dans le calcul`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await appel(s.page, "tenter", "D16", 1);
      await pause(s.page, 500);
      for (let i = 0; i < 6; i += 1) {
        const c = await appel(s.page, "calcul");
        if (!c) break;
        await choisir(s.page, c.reponse, {autre: i < 2});
        await s.page.click("#validate");
        await pause(s.page, 2600);
      }
      await pause(s.page, 800);
      assert.equal(await s.page.evaluate(() => document.getElementById("result").hidden), false, "le bilan");
      assert.match(sp(await texte(s.page, "#corrections")), /Mes 2 erreurs/);
      await tient(s.page, largeur, hauteur, "le bilan");
      await photo(s.page, `${f}-bilan`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : les leçons des dix étoiles — On te montre, J'écris, À retenir ; la carte par cœur`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of NEUVES) {
        const cle = `${id}-${n}`;
        const lecon = CORE.niveauDe(cle).niveau.apprends;
        await appel(s.page, "montrer", id, n);
        await pause(s.page, 600);
        await tient(s.page, largeur, hauteur, `${cle} : On te montre`, {glisse: Boolean(lecon.manipule && lecon.manipule.outil === "glisse")});
        assert.ok(await valideSeVoit(s.page), `${cle} : « Valider » se voit`);
        await photo(s.page, `${f}-${cle}-montre`);
        // (D10-1 : « On te montre » est le glisse-nombres ; on passe au calcul.)
        if (lecon.manipule) await appel(s.page, "apprendre", id, n);
        await appel(s.page, "ecrire", id, n, "lecon");
        await pause(s.page, 600);
        await tient(s.page, largeur, hauteur, `${cle} : J'écris`);
        assert.ok(await valideSeVoit(s.page), `${cle} : « Valider » se voit (J'écris)`);
        await photo(s.page, `${f}-${cle}-ecris`);
        const etapes = lecon.ecris.etapes;
        for (const [k, etape] of etapes.entries()) {
          const dessin = await boite(s.page, "#aide > svg");
          if (Array.isArray(etape.choix)) {
            assert.equal((await cases(s.page)).length, 3, `${cle} : l'étape à choisir a ses trois cases`);
            await tient(s.page, largeur, hauteur, `${cle} : l'étape à choisir`);
            await photo(s.page, `${f}-${cle}-ecris-choix`);
          }
          await repondreJuste(s.page, etape);
          if (dessin && k < etapes.length - 1) assert.ok(memePlace((await boite(s.page, "#aide > svg")).slice(0, 3), dessin.slice(0, 3)), `${cle} : le dessin ne bouge pas`);
        }
        assert.match(sp(await texte(s.page, "#answer-feedback")), /Bravo/, `${cle} : J'écris fini`);
        await tient(s.page, largeur, hauteur, `${cle} : J'écris fini`);
        await photo(s.page, `${f}-${cle}-ecris-fini`);
        await appel(s.page, "retenir", id, n, "");
        await pause(s.page, 400);
        if (largeur > 620) await tient(s.page, largeur, hauteur, `${cle} : À retenir`);
        await photo(s.page, `${f}-${cle}-retenir`);
        if (id === "D10" && n === 2) {
          await appel(s.page, "retenir", id, n, "", true);
          await pause(s.page, 400);
          assert.equal(await s.page.evaluate(() => document.querySelectorAll("#retenir-image .dc-coeur").length), 1, "la carte par cœur");
          if (largeur > 620) await tient(s.page, largeur, hauteur, "la carte par cœur");
          await photo(s.page, `${f}-D10-2-carte-par-coeur`);
        }
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : la carte — l'étage « La 6e », 22 étoiles en six lignes ; le cadre garde sa hauteur`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: sixiemeAvant()});
      await s.page.click("#acc-porte");
      await pause(s.page, 800);
      const n = await s.page.evaluate(() => document.querySelectorAll("#carte-etages .ck-onglet").length);
      const hauteurs = [];
      for (let i = 0; i < n; i += 1) {
        await s.page.click(`#carte-etages .ck-onglet:nth-child(${i + 1})`);
        await pause(s.page, 400);
        hauteurs.push(await s.page.evaluate(() => Math.round(document.querySelector(".panel:not([hidden])").getBoundingClientRect().height)));
      }
      const c = await appel(s.page, "carte");
      const six = c.etages.find(e => e.etage === 6);
      assert.equal(six.total, 22);
      assert.equal(six.lignes.length, 6);
      await tient(s.page, largeur, hauteur, "la carte de 6e");
      console.log(`        ${f} : hauteur du cadre par onglet ${hauteurs.join(", ")}`);
      if (largeur > 620) assert.equal(new Set(hauteurs).size, 1, `la même hauteur sur les ${n} onglets (${hauteurs.join(", ")})`);
      await photo(s.page, `${f}-carte-6e`);
      // Le panneau de « 0,1 et 1/10 » : la fraction écrite comme sur le cahier.
      await s.page.click('#carte-lignes [data-cle="D10-2"]');
      await pause(s.page, 500);
      assert.match(sp(await texte(s.page, "#panneau-titre")), /0,1 et/);
      assert.equal(await s.page.evaluate(() => document.getElementById("panneau-titre").textContent.includes("/")), false, "pas de barre oblique");
      await photo(s.page, `${f}-carte-6e-panneau-D10-2`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
