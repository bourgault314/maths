// Évaluations nationales, lot EN-D1 « la question grandit avec l'écran » (18/11/2026, choix de Gwenaël sur planches
// avant/après : au tableau, la question était minuscule) : la VRAIE page, au navigateur.
//
// Hors CI : « npm run verifier » la joue quand la branche touche l'appli (scripts/verifier-navigateur.mjs) ; à la main :
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 npm install --no-save playwright
//   node tests/evaluations-nationales-taille-ecran-ecrans.cjs
//
// Ce qui est vérifié :
//   tous les tests   1 280 × 720 (écran de tableau), 1 366 × 768 (collège), 1 920 × 1 080 (plein écran) : chaque question
//                    de chacun des 14 sujets officiels tient ENTIÈRE (pas de défilement dans le cadre, page pas plus haute
//                    que l'écran) — sauf si ajusterTaille a remis l'écran d'avant (« taille-base »), ce qui n'arrive que
//                    pour la question qui défilait déjà avant le lot (6e Géométrie Q13 en 1 366 × 768) ; --k jamais sous 1 ;
//   plus grand       1 280 × 720 : 3e Automatismes Q1 au moins 1,7 fois plus grande, énoncé d'au moins 36 px ;
//   plein écran      passer de 1 280 × 720 à 1 920 × 1 080 sans recharger : --k remonte ;
//   calculatrice     1 440 × 900 et 1 920 × 1 080 (4e Problèmes) : ouverte, elle ne recouvre pas le cadre ;
//   téléphone        390 × 844 : pas de --k, rien de changé (largeur et taille de l'énoncé d'avant).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp"};
const SUJETS = ["6e-automatismes", "6e-problemes", "6e-pos-automatismes", "6e-pos-nombres", "6e-pos-grandeurs",
  "6e-pos-geometrie", "5e-automatismes", "4e-automatismes", "4e-problemes", "4e-exemples-nombres",
  "4e-exemples-expressions", "4e-exemples-geometrie", "3e-automatismes", "3e-exemples-nombres"];

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    let fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (fichier.startsWith(RACINE) && fs.existsSync(fichier) && fs.statSync(fichier).isDirectory()) fichier = path.join(fichier, "index.html");
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier)) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

const MESURE = () => {
  const c = document.getElementById("q-corps"), e = document.getElementById("q-enonce");
  const k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--k")) || 1;
  return {
    k, base: document.documentElement.classList.contains("taille-base"),
    defile: c.scrollHeight - c.clientHeight,
    page: document.body.getBoundingClientRect().height - innerHeight,
    enonce: parseFloat(getComputedStyle(e).fontSize) * (parseFloat(getComputedStyle(e).zoom) || 1),
    num: document.getElementById("compteur").textContent,
  };
};

(async () => {
  const serveur = await servir();
  const BASE = `${`http://127.0.0.1:${serveur.address().port}`}/outils/evaluations_nationales/evaluation.html`;
  const navigateur = await chromium.launch();
  let n = 0;
  const ok = (m) => { n++; console.log("ok -", m); };
  const ouvrir = async (w, h, sujet) => {
    const c = await navigateur.newContext({viewport: {width: w, height: h}});
    const page = await c.newPage();
    const erreurs = [];
    page.on("pageerror", (e) => erreurs.push(String(e)));
    await page.goto(`${BASE}?sujet=${sujet}`);
    await page.locator("button.carte.officiel").first().click();
    await page.waitForTimeout(150);
    return {c, page, erreurs};
  };
  const suivante = async (page) => {
    const passer = page.locator("#passer");
    if (await passer.evaluate((b) => getComputedStyle(b).visibility !== "hidden")) await passer.click();
    else await page.locator("#valider").click();
    await page.waitForTimeout(40);
  };

  try {
    // ---- Chaque question de chaque test officiel tient entière, à trois tailles d'ordinateur ----
    for (const [w, h] of [[1280, 720], [1366, 768], [1920, 1080]]) {
      let questions = 0, agrandies = 0;
      const aLAncienne = [];
      for (const sujet of SUJETS) {
        const {c, page, erreurs} = await ouvrir(w, h, sujet);
        while (!(await page.locator("#bilan").isVisible())) {
          const m = await page.evaluate(MESURE);
          assert.ok(m.k >= 1, `${sujet} ${m.num} ${w}×${h} : --k = ${m.k} < 1`);
          if (m.base) aLAncienne.push(`${sujet} ${m.num}`);
          else {
            assert.ok(m.defile <= 0, `${sujet} ${m.num} ${w}×${h} : la question défile (${m.defile} px) à --k = ${m.k}`);
            assert.ok(m.page <= 0, `${sujet} ${m.num} ${w}×${h} : la page dépasse l'écran de ${m.page} px`);
          }
          questions++; if (m.k > 1) agrandies++;
          await suivante(page);
        }
        assert.deepEqual(erreurs, [], `${sujet} ${w}×${h} : erreurs JavaScript`);
        await c.close();
      }
      // « taille-base » (l'écran d'avant le lot) seulement pour les questions qui défilaient déjà avant : au 18/11/2026,
      // 6e Géométrie Q13 en 1 366 × 768, aucune en 1 280 × 720 ni en 1 920 × 1 080.
      assert.ok(aLAncienne.length <= (w === 1366 ? 1 : 0), `${w}×${h} : écran d'avant pour ${aLAncienne.join(", ")}`);
      ok(`${w}×${h} : ${questions} questions, toutes entières dans le cadre (${agrandies} agrandies` +
        (aLAncienne.length ? `, écran d'avant pour ${aLAncienne.join(", ")}` : "") + ")");
    }

    // ---- Plus grand au tableau ----
    {
      const {c, page} = await ouvrir(1280, 720, "3e-automatismes");
      const m = await page.evaluate(MESURE);
      assert.ok(m.k >= 1.7, `3e Q1 à 1 280 × 720 : --k = ${m.k}`);
      assert.ok(m.enonce >= 36, `3e Q1 à 1 280 × 720 : énoncé de ${m.enonce} px`);
      ok(`1 280 × 720 : 3e Q1 agrandie ${m.k} fois, énoncé de ${Math.round(m.enonce)} px (17 px avant le lot)`);
      // ---- Plein écran : la fenêtre change, la taille suit sans recharger ----
      await page.setViewportSize({width: 1920, height: 1080});
      await page.waitForTimeout(200);
      const g = await page.evaluate(MESURE);
      assert.ok(g.k > m.k, `après passage en 1 920 × 1 080 : --k = ${g.k} (avant ${m.k})`);
      assert.ok(g.defile <= 0 && g.page <= 0);
      ok(`passage en 1 920 × 1 080 sans recharger : --k ${m.k} → ${g.k}`);
      await c.close();
    }

    // ---- La calculatrice reste à côté du cadre ----
    for (const [w, h] of [[1440, 900], [1920, 1080]]) {
      const {c, page} = await ouvrir(w, h, "4e-problemes");
      for (let i = 0; i < 4; i++) await suivante(page);
      await page.locator("#calc-ouvrir").click();
      await page.waitForTimeout(150);
      const r = await page.evaluate(() => {
        const a = document.querySelector(".panel").getBoundingClientRect(), b = document.getElementById("calculatrice").getBoundingClientRect();
        return {chevauche: !(b.left >= a.right || b.right <= a.left || b.top >= a.bottom || b.bottom <= a.top), droite: b.right, large: innerWidth};
      });
      assert.ok(!r.chevauche, `${w}×${h} : la calculatrice recouvre le cadre`);
      assert.ok(r.droite <= r.large, `${w}×${h} : la calculatrice sort de l'écran`);
      ok(`${w}×${h} : la calculatrice s'ouvre à côté du cadre, sans le recouvrir`);
      await c.close();
    }

    // ---- Téléphone : rien ne change ----
    {
      const {c, page} = await ouvrir(390, 844, "3e-automatismes");
      const t = await page.evaluate(() => ({
        k: getComputedStyle(document.documentElement).getPropertyValue("--k").trim(),
        zoom: getComputedStyle(document.getElementById("q-enonce")).zoom,
        largeur: Math.round(document.querySelector(".shell").getBoundingClientRect().width),
      }));
      assert.equal(t.k, "", "390 × 844 : --k ne doit pas être posé");
      assert.equal(String(t.zoom), "1");
      assert.equal(t.largeur, 390);
      ok("390 × 844 : pas de --k, zoom 1, cadre pleine largeur (comme avant)");
      await c.close();
    }
  } finally {
    await navigateur.close();
    serveur.close();
  }
  console.log(`\n${n} vérifications au navigateur : tout est bon.`);
})().catch((e) => { console.error("ÉCHEC :", e.message); process.exitCode = 1; });
