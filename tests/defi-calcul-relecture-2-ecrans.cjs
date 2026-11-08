// Défi calcul, relecture 2 (08/11/2026) : le lot « modules » au navigateur,
// élève connecté (un faux serveur de suivi répond).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   npm install --no-save playwright
//   node tests/defi-calcul-relecture-2-ecrans.cjs
//
// Ce qui est vérifié :
//   retenir    les 95 « À retenir » au petit iPhone (390 × 664) : rien ne
//              défile, la phrase et le dessin ne rapetissent pas sous 95 % ;
//              au téléphone ordinaire (390 × 844), jamais ;
//   valider    sur ordinateur (1366 × 768, fenêtre), J'écris d'A2-5 en
//              4 étapes : le cadre contient tout, « Valider » compris ;
//   dessin     au téléphone (390 × 844), le dessin de J'écris prend la place
//              (M1-1 : le schéma de la moitié, au moins 120 px de haut) et ne
//              bouge pas quand J'écris est fini ;
//   m1         Je représente de M1-1 par étapes, le schéma se remplit ;
//   a1         Je représente d'A1-1 : le schéma en barres ; « À retenir » :
//              les cinq paires en rangées du boulier ;
//   prof       la bande « Mode professeur » au téléphone : deux lignes, la
//              2e sans « · » en tête.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"};
const CONSTRUITS = CORE.MODULES.filter(fiche => fiche.construit).flatMap(fiche => fiche.niveaux.map(n => `${fiche.id}-${n.n}`));

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(resolve => serveur.listen(0, "127.0.0.1", () => resolve(serveur)));
}

async function ouvrir(navigateur, base, [largeur, hauteur], requete = "") {
  const eleve = !requete.includes("prof=1");
  const contexte = await navigateur.newContext({viewport: {width: largeur, height: hauteur}, hasTouch: largeur < 700, timezoneId: "Indian/Reunion"});
  const page = await contexte.newPage();
  await page.clock.install({time: new Date("2026-10-12T10:00:00+04:00")});
  const erreurs = [];
  page.on("console", message => { if (message.type() === "error") erreurs.push(message.text()); });
  page.on("pageerror", erreur => erreurs.push(`erreur de page : ${erreur.message}`));
  if (eleve) await page.addInitScript(() => { try { window.sessionStorage.setItem("mathsgo-suivi-code", "7K3M9P"); } catch (_) {} });
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const rendre = donnees => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(donnees)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "4e B"});
    if (corps.lire) return rendre({ok: true, existe: false, revision: 0});
    return rendre({ok: true, revision: 1});
  });
  await page.goto(`${base}/outils/calcul_mental/defi_calcul_modules.html?test${requete}`);
  await page.waitForTimeout(600);
  return {page, contexte, erreurs};
}

const defile = page => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
async function taper(page, nombre) {
  for (const signe of CORE.formaterNombre(nombre).replace(/\s/g, "").replace(".", ",")) await page.click(`#play [data-key="${signe}"]`);
}
async function apprendre(page, cle) {
  const [id, n] = cle.split("-");
  await page.evaluate(([i, k]) => window.__MATHSGO_DEFI_CALCUL_TEST__.apprendre(i, k), [id, Number(n)]);
  await page.waitForTimeout(400);
}
const hauteurDessin = page => page.evaluate(() => {
  const svg = document.querySelector("#aide > svg");
  return svg ? Math.round(svg.getBoundingClientRect().height) : 0;
});
const hautDessin = page => page.evaluate(() => Math.round(document.querySelector("#aide > svg").getBoundingClientRect().top));

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const navigateur = await chromium.launch();
  let echecs = 0;
  const essai = async (nom, corps) => {
    try { await corps(); console.log(`ok     ${nom}`); } catch (erreur) { echecs += 1; console.log(`ÉCHEC  ${nom}\n  ${String(erreur.message || erreur).split("\n").join("\n  ")}`); }
  };

  for (const [taille, plancher] of [[[390, 664], .95], [[390, 844], 1]]) {
    await essai(`retenir ${taille.join("x")} : les 95 « À retenir » tiennent, sans rapetisser sous ${plancher * 100} %`, async () => {
      const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille);
      const petits = [];
      for (const cle of CONSTRUITS) {
        const [id, n] = cle.split("-");
        assert.ok(await page.evaluate(([i, k]) => window.__MATHSGO_DEFI_CALCUL_TEST__.retenir(i, k), [id, Number(n)]), cle);
        await page.waitForTimeout(120);
        const z = await page.evaluate(() => Number(getComputedStyle(document.documentElement).getPropertyValue("--retenir-z")) || 1);
        assert.ok(await defile(page) <= 1, `${cle} : rien ne défile`);
        if (z < plancher - 1e-9) petits.push(`${cle} : ${z}`);
      }
      assert.deepEqual(petits, [], "le dessin d'« À retenir » ne rapetisse pas");
      assert.deepEqual(erreurs, []);
      await contexte.close();
    });
  }

  await essai("valider 1366x768 : J'écris d'A2-5, le cadre contient tout", async () => {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, [1366, 768]);
    await apprendre(page, "A2-5");
    const ap = CORE.niveauDe("A2-5").niveau.apprends;
    await taper(page, ap.represente.reponse);
    await page.click("#validate");
    await page.waitForSelector("#question-card.ecrit", {timeout: 8000});
    for (const etape of ap.ecris.etapes) {
      const m = await page.evaluate(() => {
        const carte = document.getElementById("question-card");
        const v = document.getElementById("validate").getBoundingClientRect();
        return {deborde: carte.scrollHeight - carte.clientHeight, coupe: v.bottom - carte.getBoundingClientRect().bottom};
      });
      assert.ok(m.deborde <= 1 && m.coupe <= 1, `rien ne dépasse du cadre (${JSON.stringify(m)})`);
      await taper(page, etape.reponse);
      await page.click("#validate");
      await page.waitForTimeout(300);
    }
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  await essai("dessin 390x844 : le dessin de J'écris prend la place, et ne bouge pas à la fin", async () => {
    const b = await ouvrir(navigateur, base, [390, 844]);
    await apprendre(b.page, "M1-1");
    const m1 = CORE.niveauDe("M1-1").niveau.apprends;
    for (const etape of m1.represente.etapes) { await taper(b.page, etape.reponse); await b.page.click("#validate"); await b.page.waitForTimeout(300); }
    await b.page.click("#validate");
    await b.page.waitForSelector("#question-card.ecrit", {timeout: 8000});
    assert.ok(await hauteurDessin(b.page) >= 120, "le schéma de la moitié est grand");
    const haut = await hautDessin(b.page);
    for (const etape of m1.ecris.etapes) { await taper(b.page, etape.reponse); await b.page.click("#validate"); await b.page.waitForTimeout(300); }
    await b.page.waitForTimeout(500);
    assert.ok(Math.abs(await hautDessin(b.page) - haut) <= 2, "le dessin ne bouge pas quand le pavé s'efface");
    assert.deepEqual(b.erreurs, []);
    await b.contexte.close();
  });

  await essai("m1 : Je représente de M1-1 par étapes, le schéma se remplit", async () => {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, [390, 844]);
    await apprendre(page, "M1-1");
    const nom = () => page.evaluate(() => document.getElementById("seance-fil").textContent);
    assert.match(await nom(), /Je représente/);
    assert.ok(await page.isVisible("#question-card.ecrit"), "joué comme J'écris");
    const r = CORE.niveauDe("M1-1").niveau.apprends.represente;
    const verts = () => page.evaluate(() => [...document.querySelectorAll("#aide > svg text")].filter(t => t.getAttribute("fill") === "#147447").map(t => t.textContent));
    assert.deepEqual(await verts(), []);
    await taper(page, r.etapes[0].reponse);
    await page.click("#validate");
    await page.waitForTimeout(300);
    assert.ok((await verts()).includes("20"), "10 + 10 = 20 remplit sa case");
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  await essai("a1 : A1-1 en barres ; « À retenir », les paires en rangées du boulier", async () => {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, [390, 844]);
    assert.ok(await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.retenir("A1", 1)));
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({
      perles: document.querySelectorAll("#retenir-image circle").length,
      cahier: document.querySelector("#result-retenir .cahier").textContent,
      large: Math.round(document.querySelector("#retenir-image svg").getBoundingClientRect().width / document.querySelector("#result-retenir").getBoundingClientRect().width * 100)
    }));
    assert.equal(r.perles, 50);
    assert.equal(r.cahier, "Je recopie cela dans mon cahier.");
    assert.ok(r.large >= 85, `le dessin prend la largeur (${r.large} %)`);
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  await essai("prof 390x844 : la bande « Mode professeur » sur deux lignes propres", async () => {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, [390, 844], "&prof=1");
    const b = await page.evaluate(() => {
      const r = e => e.getBoundingClientRect();
      const p = document.getElementById("prof-pilule");
      const [point1, point2] = p.querySelectorAll(".pp-point");
      return {mode: r(p.querySelector("b")).top, quitter: r(document.getElementById("prof-quitter")).top, texte: r(p.querySelector(".pp-texte")).top,
        point1: getComputedStyle(point1).display, point2: r(point2).top, gauche: r(p.querySelector(".pp-texte")).left - r(p).left};
    });
    assert.ok(Math.abs(b.mode - b.quitter) <= 3, "« Mode professeur · Quitter » sur la 1re ligne");
    assert.ok(b.texte > b.mode + 8, "la phrase sur la 2e ligne");
    assert.equal(b.point1, "none");
    assert.ok(Math.abs(b.point2 - b.mode) <= 3, "le « · » qui reste est sur la 1re ligne");
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  await navigateur.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} échec(s).`); process.exit(1); }
  console.log("Défi calcul, relecture 2 : conforme au navigateur.");
})().catch(erreur => { console.error(erreur); process.exit(1); });
