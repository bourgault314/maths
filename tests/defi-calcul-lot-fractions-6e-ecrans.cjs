// Défi calcul, lot « les fractions de 6e » (28/11/2026) : la VRAIE page, au
// navigateur, élève connecté par code (faux serveur de suivi), au téléphone
// (390 × 844) et à l'ordinateur (1366 × 657).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-fractions-6e-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-fractions-6e-ecrans.cjs
//
// Les écrans NEUFS du lot (règle du 15/11), chacun : rien ne sort sur le
// côté ; à l'ordinateur, le cadre tient entier dans l'écran.
//   lecons     « Cinquièmes : en décimal » et « Fraction et quotient » : On te
//              montre, J'écris (début, fin), À retenir ;
//   virgule    J'écris de « Cinquièmes » : la touche « , » de la 2e ligne a
//              sa place dès la 1re (invisible) — le dessin et le pavé ne
//              bougent pas quand elle arrive ;
//   bandes     On te montre de « Cinquièmes » : les deux bandes posées sur la
//              droite en dixièmes (0,1 0,2 0,3, « ? »), « 2/5 = 4/10 = 0,4 » ;
//   dessins    l'entraînement avec le dessin : les flèches (7/5 = □,
//              1,4 = □/5, 3/□ = 0,6), le tout partagé (11 × 25/11 = □,
//              56/8 = □, 3 ÷ 7 = □/□, 12 × □/□ = 7) — la fraction d'une part
//              à la française, à sa taille.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-28";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = process.env.FORMATS ? process.env.FORMATS.split(",").map(x => x.split("x").map(Number)) : [[390, 844], [1366, 657]];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp", ".json": "application/json"};
const sp = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const LECONS = [["F1", 3], ["F11", 2]];
const DESSINS = [["F1", 3, "7/5 = □", "fois-fraction"], ["F1", 3, "1,4 = □/5", "fois-fraction"], ["F1", 3, "3/□ = 0,6", "fois-fraction"],
  ["F11", 2, "11 × 25/11 = □", "tout-parts"], ["F11", 2, "56/8 = □", "tout-parts"], ["F11", 2, "3 ÷ 7 = □/□", "tout-parts"], ["F11", 2, "12 × □/□ = 7", "tout-parts"]];

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}
async function ouvrir(nav, base, {largeur, hauteur}) {
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
    if (corps.lire) return rendre({ok: true, existe: false});
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
const boite = (page, sel) => page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(x => Math.round(x)); }, sel);
const memePlace = (a, b) => Boolean(a && b) && a.every((x, i) => Math.abs(x - b[i]) <= 1);
async function photo(page, n) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.waitForTimeout(300);
  await page.screenshot({path: path.join(SORTIE, `${n}.png`)});
}
async function tient(page, largeur, hauteur, quoi) {
  const m = await page.evaluate(() => {
    const cadre = document.querySelector(".panel:not([hidden])").getBoundingClientRect();
    const sortent = [...document.querySelectorAll(".panel:not([hidden]) *")].filter(e => {
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
const valideSeVoit = page => page.evaluate(() => { const p = document.querySelector(".panel:not([hidden])").getBoundingClientRect(); const v = document.querySelector("#validate").getBoundingClientRect(); return v.bottom <= p.bottom + .5 && v.bottom <= innerHeight + .5; });
async function taper(page, nombre) {
  for (const c of CORE.formaterNombre(nombre)) {
    if (!c.trim() || c === " " || c === " ") continue;
    await page.click(`#play [data-key="${c}"]`);
  }
}
async function repondreJuste(page, attendu) {
  if (typeof attendu.ecrite === "string" && attendu.ecrite.includes("/")) {
    const [num, den] = attendu.ecrite.split("/");
    await page.keyboard.type(num); await page.keyboard.press("/"); await page.keyboard.type(den);
  } else await taper(page, attendu.reponse);
  await page.click("#validate");
  await pause(page, 600);
}
// La plus petite taille de texte d'un dessin, en pixels à l'écran.
const plusPetitTexte = page => page.evaluate(() => {
  const svg = document.querySelector("#aide > svg");
  if (!svg) return null;
  const tailles = [...svg.querySelectorAll("text")].filter(t => t.textContent.trim()).map(t => t.getBoundingClientRect().height);
  return tailles.length ? Math.round(Math.min(...tailles) * 10) / 10 : null;
});

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

    await cas(`${f} : On te montre de « Cinquièmes » — les bandes sur la droite en dixièmes, « 2/5 = 4/10 = 0,4 »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await appel(s.page, "montrer", "F1", 3);
      await pause(s.page, 600);
      for (let i = 0; i < 2; i += 1) { await s.page.click("[data-reserve]"); await pause(s.page, 900); }
      await pause(s.page, 1200);
      assert.equal(await appel(s.page, "bandes").then(b => b && b.fini), true, "les deux bandes posées");
      const droite = sp(await s.page.evaluate(() => [...document.querySelectorAll("#play svg text")].map(t => t.textContent).join(" ")));
      assert.match(droite, /0 0,1 0,2 0,3 \?/, "les dixièmes sous la droite");
      assert.match(sp(await texte(s.page, "#play")), /2 cinquièmes = 4 dixièmes = 0,4/, "la trace, lue : 2/5 = 4/10 = 0,4");
      await tient(s.page, largeur, hauteur, "On te montre, bandes posées");
      await photo(s.page, `${f}-F1-3-montre-fini`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : les leçons — On te montre, J'écris (le dessin ne bouge pas, la touche « , » garde sa place), À retenir`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of LECONS) {
        const cle = `${id}-${n}`;
        const lecon = CORE.niveauDe(cle).niveau.apprends;
        await appel(s.page, "montrer", id, n);
        await pause(s.page, 600);
        await tient(s.page, largeur, hauteur, `${cle} : On te montre`);
        await photo(s.page, `${f}-${cle}-montre`);
        await appel(s.page, "ecrire", id, n, "lecon");
        await pause(s.page, 600);
        await tient(s.page, largeur, hauteur, `${cle} : J'écris`);
        assert.ok(await valideSeVoit(s.page), `${cle} : « Valider » se voit`);
        await photo(s.page, `${f}-${cle}-ecris`);
        const pave = await boite(s.page, "#question-card > .keypad");
        for (const [k, etape] of lecon.ecris.etapes.entries()) {
          const dessin = await boite(s.page, "#aide > svg");
          if (id === "F1") {
            const t = await s.page.evaluate(() => { const e = document.getElementById("touches"); return {hidden: e.hidden, vis: getComputedStyle(e).visibility}; });
            assert.equal(t.hidden, false, `${cle} : la place de la touche « , » (ligne ${k + 1})`);
            assert.equal(t.vis, k === 0 ? "hidden" : "visible", `${cle} : la touche « , » ${k === 0 ? "invisible" : "visible"} (ligne ${k + 1})`);
          }
          await repondreJuste(s.page, etape);
          if (k < lecon.ecris.etapes.length - 1) {
            assert.ok(memePlace(await boite(s.page, "#aide > svg"), dessin), `${cle} : le dessin ne bouge pas (ligne ${k + 2})`);
            assert.ok(memePlace(await boite(s.page, "#question-card > .keypad"), pave), `${cle} : le pavé ne bouge pas (ligne ${k + 2})`);
            await photo(s.page, `${f}-${cle}-ecris-${k + 2}`);
          }
        }
        assert.match(sp(await texte(s.page, "#answer-feedback")), /Bravo/, `${cle} : J'écris fini`);
        await tient(s.page, largeur, hauteur, `${cle} : J'écris fini`);
        await photo(s.page, `${f}-${cle}-ecris-fini`);
        await appel(s.page, "retenir", id, n, "");
        await pause(s.page, 400);
        if (largeur > 620) await tient(s.page, largeur, hauteur, `${cle} : À retenir`);
        await photo(s.page, `${f}-${cle}-retenir`);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : l'entraînement avec le dessin — les flèches, le tout partagé ; la fraction d'une part lisible`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      const tailles = [];
      for (const [id, n, t, outil] of DESSINS) {
        assert.ok(await appel(s.page, "poser", id, n, t, "image"), `posé : ${t}`);
        await pause(s.page, 600);
        const calcul = await appel(s.page, "calcul");
        assert.equal(sp(calcul.texte), sp(t));
        assert.equal(CORE.aideDe(calcul).outil, outil, t);
        assert.equal(await s.page.evaluate(() => document.getElementById("aide").hidden), false, `${t} : le dessin est là`);
        const svg = await s.page.evaluate(() => document.querySelector("#aide > svg").outerHTML);
        assert.ok(!/>\s*\d+\/\d+\s*</.test(svg), `${t} : aucune fraction avec une barre oblique dans le dessin`);
        const petit = await plusPetitTexte(s.page);
        if (outil === "tout-parts") tailles.push(petit);
        await tient(s.page, largeur, hauteur, `${t} : avec le dessin`);
        assert.ok(await valideSeVoit(s.page), `${t} : « Valider » se voit`);
        await photo(s.page, `${f}-dessin-${t.replace(/[^\w]+/g, "_")}`);
      }
      console.log(`        ${f} : la plus petite écriture des parts, en px : ${tailles.join(", ")}`);
      if (largeur <= 620) assert.ok(Math.min(...tailles) >= 9.5, `au téléphone, la fraction d'une part se lit (${Math.min(...tailles)} px)`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
