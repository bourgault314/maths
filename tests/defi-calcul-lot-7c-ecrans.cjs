// Défi calcul, lot 7c « Les fractions » (16/11/2026) : la VRAIE page, au
// navigateur, élève connecté (faux serveur de suivi), aux 5 formats
// (390 × 664, 390 × 844, 1366 × 657, 1366 × 768, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-7c-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-7c-ecrans.cjs
//
//   montrer   « On te montre » des 6 niveaux : F4-1, les billes — le partage,
//             puis l'élève touche les parts qu'il prend (au 3e refus, la
//             case libre brille, rien ne bouge) ; F9-1 et F11-1, les bandes ;
//             les autres, le dessin et la réponse à écrire (jamais sur le
//             dessin) ;
//   dessin    « Avec le dessin » : la réponse n'est pas écrite ;
//   écrire    J'écris de la leçon : « Valider » se voit, rien ne bouge
//             pendant la frappe, le dessin reste à sa place ;
//   retenir   À retenir tient dans le cadre à l'ordinateur, sans défiler ;
//   poser     trois fractions, nombres mixtes, « 6 × □/6 = 5 », le calcul
//             au-delà de 30 parts (les deux flèches, annoncé) ;
//   parcours  Mon parcours d'un élève au CM1 et au CM2.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const CARTE = CORE.carte();
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-16";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = process.env.FORMATS ? process.env.FORMATS.split(",").map(x => x.split("x").map(Number)) : [[390, 664], [390, 844], [1366, 657], [1366, 768], [1920, 1080]];
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

// Tout ce qui vient avant `jusqua` dans l'ordre du parcours est entré (boîte
// 4, revient dans 9 jours : pas de calculs du jour aujourd'hui).
function parcoursAvant(arret, ceintures = [null, null, null, null]) {
  const brut = {version: P.VERSION, modules: {}, ceintures, jours: ["2026-11-12", "2026-11-13"], seances: ["2026-11-12", "2026-11-13"]};
  for (const c of P.parcoursConstruit(CARTE)) {
    if (arret(c)) break;
    const k = P.NIVEAUX[c.module];
    const m = brut.modules[c.module] || (brut.modules[c.module] = {vu: "2026-11-13", b: Array(k).fill(0), e: Array(k).fill(null), d: Array(k).fill(null), s: Array(k).fill(null), a: Array(k).fill(0), f: Array(k).fill(0)});
    m.b[c.niveau - 1] = 4;
    m.e[c.niveau - 1] = "2026-11-25";
    m.d[c.niveau - 1] = "2026-11-01";
    m.s[c.niveau - 1] = "2026-11-10";
    m.a[c.niveau - 1] = 1;
  }
  return P.normaliserParcours(brut);
}

async function ouvrir(nav, base, {largeur, hauteur, parcours = null}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), "7K3M9P");
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const h = {"access-control-allow-origin": "*"};
    const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: h, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: {}});
    if (corps.lire) return rendre({ok: true, existe: Boolean(parcours), parcours, revision: 1});
    return rendre({ok: true, revision: 2});
  });
  await page.goto(base + PAGE);
  for (let i = 0; i < 40; i += 1) { await page.clock.runFor(100); await page.waitForTimeout(25); }
  return {page, ctx, erreurs};
}

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(80); };
const appel = (page, nom, ...args) => page.evaluate(([n, a]) => window.__MATHSGO_DEFI_CALCUL_TEST__[n](...a), [nom, args]);
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, s);
async function taper(page, nombre) {
  for (const c of String(nombre).replace(".", ",")) await page.click(`#play [data-key="${c}"]`);
  await page.click("#validate");
  await pause(page, 300);
}
async function photo(page, nom) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.screenshot({path: path.join(SORTIE, `${nom}.png`)});
}
// Pas de défilement de côté, rien ne sort ; à l'ordinateur, le cadre entier.
async function tient(page, largeur, hauteur) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "pas de défilement de côté");
  if (largeur > 620) {
    const bas = await page.evaluate(() => document.querySelector(".panel:not([hidden])").getBoundingClientRect().bottom);
    assert.ok(bas <= hauteur + .5, `le cadre tient entier (${Math.round(bas)} / ${hauteur})`);
  }
}
const boiteDessin = page => page.evaluate(() => { const b = document.querySelector("#aide > svg").getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)].join(","); });
// La place d'un élément (rien ne doit bouger quand l'outil montre le geste).
// (Lot 7a, constat de Code sur la PR #1213 : sous Safari, la bande descend
// de 0,04 px quand elle brille, et l'arrondi au pixel faisait échouer la
// comparaison ; on compare à 1 px près, invisible à l'œil.)
const place = (page, sel) => page.evaluate(q => { const b = document.querySelector(q).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel);
const memePlace = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= 1);
const lignes = page => page.evaluate(() => [...document.querySelectorAll("#expression .lg > span")].map(l => ({classe: l.className, texte: l.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim()})));
const dessin = page => appel(page, "dessin");



const NIVEAUX = [["F4", 1], ["F4", 2], ["F9", 1], ["F9", 2], ["F11", 1], ["F11", 2]];
const boite = (page, sel) => page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel);
const textesDessin = page => page.evaluate(() => [...document.querySelectorAll("#aide svg text")].map(t => t.textContent.replace(/[\u202f\u00a0]/g, " ").trim()));
const sp = t => String(t).replace(/[\u202f\u00a0]/g, " ");
// Taper une suite d'étapes : rien ne bouge pendant la frappe ; le dessin reste à sa place.
async function etapes(page, liste, cle) {
  for (const [k, etape] of liste.entries()) {
    const expression = await boite(page, "#expression");
    const dessinAvant = await boite(page, "#aide > svg");
    for (const c of CORE.formaterNombre(etape.reponse)) {
      if (!c.trim() || c === "\u202f") continue;
      await page.click(`#play [data-key="${c}"]`);
      assert.ok(memePlace(await boite(page, "#expression"), expression), `${cle} : rien ne bouge pendant la frappe`);
    }
    await page.click("#validate");
    await pause(page, 600);
    if (dessinAvant && k < liste.length - 1) assert.ok(memePlace((await boite(page, "#aide > svg")).slice(0, 3), dessinAvant.slice(0, 3)), `${cle} : le dessin ne bouge pas`);
  }
}
async function attendreQue(page, lire, essais = 40) {
  for (let i = 0; i < essais; i += 1) { const v = await lire(); if (v) return v; await pause(page, 100); }
  return lire();
}
// « Valider » se voit en entier.
// Lot 7d : l'écart entre le haut de la liste de Mon parcours et le haut de
// sa première ligne visible (0 px : la liste commence sur une ligne entière).
const ecartListe = page => page.evaluate(() => {
  const liste = document.querySelector("#parcours-modules");
  if (!liste) return null;
  const haut = liste.getBoundingClientRect().top;
  const ligne = [...liste.children].find(l => l.getBoundingClientRect().bottom > haut + 1);
  return ligne ? Math.round(ligne.getBoundingClientRect().top - haut) : null;
});
const valideSeVoit = page => page.evaluate(() => { const p = document.querySelector(".panel:not([hidden])").getBoundingClientRect(); const v = document.querySelector("#validate").getBoundingClientRect(); return v.bottom <= p.bottom + .5 && v.bottom <= innerHeight + .5; });

// F4-1 : les billes. Le partage (le tas, n/d fois), puis les parts prises ;
// au 3e toucher refusé (le tas vide), la case libre brille, rien ne bouge.
async function jouerBilles(s, m, cle, f) {
  const scene = await place(s.page, "#aide .dc-billes-scene");
  for (let k = 0; k < m.n / m.d; k += 1) {
    await s.page.click("#aide [data-tas]", {force: true});
    await pause(s.page, 300);
  }
  assert.equal((await appel(s.page, "billes")).tours, m.n / m.d, `${cle} : le partage`);
  assert.equal(await texte(s.page, "#aide .dc-billes p.consigne"), sp(m.consignePrendre), `${cle} : « ${sp(m.consignePrendre)} »`);
  await photo(s.page, `${f}-${cle}-billes-partage`);
  for (let i = 0; i < 3; i += 1) {
    await s.page.click("#aide [data-tas]", {force: true});
    await pause(s.page, 1900);
  }
  const montre = await attendreQue(s.page, async () => { const x = await appel(s.page, "montre"); return x && x.montre ? x : null; });
  assert.ok(montre && montre.brillent === 1, `${cle} : au 3e refus, la case libre brille`);
  assert.ok(memePlace(await place(s.page, "#aide .dc-billes-scene"), scene), `${cle} : les billes ne bougent pas (geste montré) ${scene} / ${await place(s.page, "#aide .dc-billes-scene")}`);
  await photo(s.page, `${f}-${cle}-billes-montre`);
  for (let k = 0; k < m.prendre; k += 1) {
    await s.page.click(`#aide [data-case="${k}"]`, {force: true});
    await pause(s.page, 400);
  }
  const fin = await appel(s.page, "billes");
  assert.ok(fin.fini && fin.prises.length === m.prendre, `${cle} : ${m.prendre} parts prises`);
  // (La fraction s'écrit en deux étages, avec sa lecture « 2 tiers » pour le lecteur d'écran.)
  assert.ok((await texte(s.page, "#aide .dc-billes .dc-trace")).endsWith(sp(m.traces[0].texte).replace(/^.* de /, " de ")), `${cle} : la trace`);
  assert.ok(memePlace(await place(s.page, "#aide .dc-billes-scene"), scene), `${cle} : les billes ne bougent pas (fini) ${scene} / ${await place(s.page, "#aide .dc-billes-scene")}`);
}
// F9-1, F11-1 : les bandes, geste après geste (le plan de la leçon).
async function jouerBandes(s, m, cle) {
  for (const e of m.etapes) {
    if (e.geste === "poser") await s.page.click(`#aide .dc-bande-reserve[data-reserve="${e.d}"]`, {force: true});
    else await s.page.click(`#aide [data-piece="${e.geste === "enlever" ? e.parmi[0] : e.piece}"]`, {force: true});
    await pause(s.page, 450);
  }
  assert.equal((await appel(s.page, "bandes")).fini, true, `${cle} : les bandes jouées jusqu'au bout`);
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
    await cas(`${f} : On te montre, Avec le dessin, J'écris et À retenir des 6 niveaux (F4, F9, F11)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of NIVEAUX) {
        const cle = `${id}-${n}`;
        const lecon = CORE.niveauDe(cle).niveau.apprends;
        await appel(s.page, "montrer", id, n);
        await pause(s.page, 500);
        assert.match(await texte(s.page, "#seance-fil"), /On te montre$/, cle);
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${f}-${cle}-montre`);
        if (lecon.manipule && lecon.manipule.outil === "billes") await jouerBilles(s, lecon.manipule, cle, f);
        else if (lecon.manipule) await jouerBandes(s, lecon.manipule, cle);
        else {
          const r = sp(CORE.formaterNombre(lecon.represente.reponse));
          if (cle !== "F11-2") assert.ok(!(await textesDessin(s.page)).includes(r), `${cle} : la réponse n'est pas sur le dessin`);
          assert.ok(await valideSeVoit(s.page), `${cle} : « Valider » se voit`);
          await etapes(s.page, [{reponse: lecon.represente.reponse}], cle);
          assert.match(await texte(s.page, "#answer-feedback"), /Bravo/, cle);
        }
        await photo(s.page, `${f}-${cle}-montre-fini`);
        await tient(s.page, largeur, hauteur);

        await appel(s.page, "ecrire", id, n, "lecon");
        await pause(s.page, 500);
        assert.ok(await valideSeVoit(s.page), `${cle} : « Valider » se voit`);
        await photo(s.page, `${f}-${cle}-ecris`);
        await etapes(s.page, await appel(s.page, "ecrisEnCours"), cle);
        await photo(s.page, `${f}-${cle}-ecris-fini`);
        await tient(s.page, largeur, hauteur);

        await appel(s.page, "retenir", id, n, "");
        await pause(s.page, 400);
        await photo(s.page, `${f}-${cle}-retenir`);
        if (largeur > 620) await tient(s.page, largeur, hauteur);
        assert.equal(await s.page.evaluate(() => { const r = document.querySelector("#result"); return r.scrollHeight <= r.clientHeight + 1; }), true, `${cle} : À retenir ne défile pas`);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : Avec le dessin — trois fractions, nombres mixtes, « 6 × □/6 = 5 », au-delà de 30 parts`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      const poses = [["F9", 2, "2/8 + 3/2 + 1/4 = □/8", "trois"], ["F9", 2, "(1 + 1/2) + (1 + 1/8) = 2 + □/8", "mixtes"], ["F11", 2, "6 × □/6 = 5", "fraction"], ["F11", 1, "2 × 9/4 = □/4", "grande"]];
      for (const [id, n, t, nom] of poses) {
        const ok = await appel(s.page, "poser", id, n, t.replace(/□/g, CORE.CASE), "image");
        const ok2 = ok || await appel(s.page, "poser", id, n, t.replace("(1 + 1/2) + (1 + 1/8)", "(1 + 1/8) + (1 + 1/2)").replace(/□/g, CORE.CASE), "image");
        assert.ok(ok2, `${t} : posé`);
        await pause(s.page, 500);
        const calcul = await appel(s.page, "calcul");
        const r = sp(CORE.formaterNombre(calcul.reponse));
        if (nom !== "fraction") assert.ok(!(await textesDessin(s.page)).includes(`${r}`) || nom === "mixtes", `${t} : la réponse n'est pas sur le dessin`);
        assert.ok(await valideSeVoit(s.page), `${t} : « Valider » se voit`);
        await photo(s.page, `${f}-pose-${nom}`);
        await tient(s.page, largeur, hauteur);
        await etapes(s.page, [{reponse: calcul.reponse}], t);
      }
      // Au-delà de 30 parts : annoncé, les deux flèches.
      assert.equal(await appel(s.page, "nouveaute", "F9", 2, "trop de parts", "image"), true);
      await pause(s.page, 500);
      assert.match(await texte(s.page, "#annonce"), /Nouveau : trop de parts pour les dessiner : je multiplie en haut et en bas\./);
      assert.ok((await textesDessin(s.page)).some(x => /^× \d+$/.test(x)), "les deux flèches");
      await photo(s.page, `${f}-F9-2-fleches`);
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : Mon parcours d'un élève au CM1 (F9-1) et au CM2 (F4, F9-2, F11-1)`, async () => {
      for (const [arret, ceintures, nom] of [[c => c.module === "F9" && c.niveau === 1, ["2026-11-01", null, null, null], "cm1"], [c => c.module === "F4" && c.niveau === 1, ["2026-11-01", "2026-11-05", null, null], "cm2"]]) {
        const s = await ouvrir(nav, base, {largeur, hauteur, parcours: parcoursAvant(arret, ceintures)});
        await s.page.click("#acc-porte");
        await pause(s.page, 800);
        assert.match(await texte(s.page, "#acc-parcours"), nom === "cm1" ? /Palier 2/ : /Palier 3/);
        assert.match(await texte(s.page, "#acc-parcours"), nom === "cm1" ? /Dénominateurs multiples/ : /Fraction d’une quantité/);
        const ecart = await ecartListe(s.page);
        assert.ok(ecart !== null && Math.abs(ecart) <= 1, `${nom} : la liste commence sur une ligne entière (${ecart} px)`);
        await photo(s.page, `${f}-mon-parcours-${nom}`);
        await tient(s.page, largeur, hauteur);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      }
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
