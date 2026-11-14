// Défi calcul, lot 3c « J'écris sur des calculs qui changent » : au
// téléphone (390 × 844 et 390 × 664, la hauteur visible d'un iPhone dans
// Safari, avec le bandeau de suivi), J'écris de chaque niveau sur des
// calculs tirés choisis — le plus long à écrire, la consigne la plus longue,
// le dessin le plus large, et un au hasard — puis sur le calcul de la leçon,
// pour comparer. Rien ne déborde : pas de défilement de côté, le calcul, les
// étapes, la consigne et le dessin restent dans la carte, le pavé et le
// bouton aussi ; la page ne défile pas plus que pour la leçon.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier
// (il est listé dans scripts/verifier-navigateur.mjs).
//   node tests/defi-calcul-lot-3c-ecrans.cjs
//   DEFI_CALCUL_CAPTURES=/chemin node tests/defi-calcul-lot-3c-ecrans.cjs   (dépose les captures)
//   DEFI_CALCUL_NIVEAUX=A1-2,F6-1 node tests/defi-calcul-lot-3c-ecrans.cjs   (quelques niveaux)

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const AIDES = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_aides.js"));
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const CAPTURES = process.env.DEFI_CALCUL_CAPTURES || "";
const TAILLES = [{nom: "390x844", largeur: 390, hauteur: 844}, {nom: "390x664", largeur: 390, hauteur: 664}];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".json": "application/json"};

const NIVEAUX = (process.env.DEFI_CALCUL_NIVEAUX ? process.env.DEFI_CALCUL_NIVEAUX.split(",") : CORE.ORDRE)
  .filter(cle => CORE.niveauDe(cle) && CORE.niveauDe(cle).niveau.apprends);

// Les tirages à regarder, niveau par niveau : la graine du plus long à
// écrire (la plus longue étape), de la consigne la plus longue, du dessin le
// plus large, et une au hasard.
function tiragesDe(cle) {
  const largeur = ecris => Number((AIDES.dessinerImage(ecris.dessins[0]).match(/viewBox="0 0 ([\d.]+)/) || [0, 0])[1]);
  const notes = [];
  const vus = new Set();
  for (let g = 1; g <= 1500; g += 1) {
    const tire = CORE.ecrisTire(cle, {graine: g});
    if (!tire || vus.has(tire.calcul.texte)) continue;
    vus.add(tire.calcul.texte);
    notes.push({g, texte: tire.calcul.texte,
      etape: Math.max(...tire.ecris.etapes.map(e => e.texte.length)), consigne: (tire.ecris.consigne || "").length, dessin: largeur(tire.ecris)});
  }
  const meilleur = cle => notes.reduce((a, b) => (b[cle] > a[cle] ? b : a));
  const choix = [meilleur("etape"), meilleur("consigne"), meilleur("dessin"), notes[Math.floor(notes.length / 2)]];
  return [...new Map(choix.map(n => [n.g, n])).values()];
}

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(resolve => serveur.listen(0, "127.0.0.1", () => resolve(serveur)));
}

async function ouvrir(navigateur, base, taille) {
  const contexte = await navigateur.newContext({viewport: {width: taille.largeur, height: taille.hauteur}, deviceScaleFactor: 2, hasTouch: true, isMobile: true, timezoneId: "Indian/Reunion"});
  await contexte.addInitScript(() => { try { sessionStorage.setItem("mathsgo-suivi-code", "7K3M9P"); } catch (_) {} });
  await contexte.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "4e B"});
    if (corps.lire) return rendre({ok: true, existe: false, revision: 0});
    return rendre({ok: true, revision: 1});
  });
  await contexte.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  // (Les ressources hors du site — polices, mesure — sont coupées exprès.)
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erreurs.push(m.text()); });
  await page.goto(base + PAGE);
  await page.waitForTimeout(700);
  return {contexte, page, erreurs};
}

async function mesurer(page) {
  return page.evaluate(() => {
    const carte = document.getElementById("question-card");
    const c = carte.getBoundingClientRect();
    const hors = [];
    carte.querySelectorAll("*").forEach(e => {
      if (!e.checkVisibility || !e.checkVisibility() || (e.closest && e.closest(".sr-only"))) return;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.left < c.left - 1 || r.right > c.right + 1) hors.push(`${e.tagName.toLowerCase()}.${e.className && e.className.baseVal === undefined ? e.className : ""} ${Math.round(r.left)}–${Math.round(r.right)}`);
    });
    const coupe = [...carte.querySelectorAll("#expression, #expression *, .dc-consigne, .consigne")]
      .filter(e => e.checkVisibility() && !e.classList.contains("sr-only") && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== "visible").map(e => e.className || e.id);
    const boite = selecteur => { const e = document.querySelector(selecteur); if (!e || !e.checkVisibility()) return null; const r = e.getBoundingClientRect(); return {haut: r.top, bas: r.bottom}; };
    return {
      largeurPage: document.documentElement.scrollWidth, largeur: innerWidth,
      defile: Math.max(0, document.documentElement.scrollHeight - innerHeight),
      ecrit: carte.classList.contains("ecrit"), hors, coupe,
      lignes: [...document.querySelectorAll("#expression .lg > span")].map(l => l.innerText.replace(/\s+/g, " ").trim()),
      valider: boite("#validate"), pave: boite(".keypad"),
      echelle: getComputedStyle(document.documentElement).getPropertyValue("--echelle").trim()
    };
  });
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const navigateur = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  if (CAPTURES) fs.mkdirSync(CAPTURES, {recursive: true});
  const choix = new Map(NIVEAUX.map(cle => [cle, tiragesDe(cle)]));
  let vus = 0;
  const pires = [];
  try {
    for (const taille of TAILLES) {
      const session = await ouvrir(navigateur, base, taille);
      const {page, erreurs} = session;
      for (const cle of NIVEAUX) {
        const [id, n] = cle.split("-");
        // La leçon d'abord (son calcul fixe), pour comparer la hauteur.
        const lecon = CORE.niveauDe(cle).niveau.apprends;
        await page.evaluate(([i, m]) => window.__MATHSGO_DEFI_CALCUL_TEST__.ecrire(i, Number(m), "lecon"), [id, n]);
        await page.waitForTimeout(160);
        const reference = await mesurer(page);
        assert.equal(reference.lignes.length, lecon.ecris.etapes.length, `${cle} : J'écris de la leçon`);
        const tires = choix.get(cle);
        for (const tire of tires) {
          const ok = await page.evaluate(([i, m, g]) => window.__MATHSGO_DEFI_CALCUL_TEST__.ecrire(i, Number(m), g), [id, n, tire.g]);
          assert.equal(ok, true, `${cle} : le crochet « ecrire »`);
          await page.waitForTimeout(160);
          const m = await mesurer(page);
          const ou = `${taille.nom} · ${cle} · ${tire.texte}`;
          assert.deepEqual(erreurs, [], `${ou} : aucune erreur de console`);
          assert.equal(m.ecrit, true, `${ou} : l'écran J'écris`);
          const attendu = CORE.ecrisTire(cle, {graine: tire.g}).ecris.etapes.map(e => e.texte.replace(/[   ]/g, " ").replace(CORE.CASE, "").replace(/\s+/g, " ").trim());
          assert.equal(m.lignes.length, attendu.length, `${ou} : les étapes du calcul tiré`);
          assert.ok(m.largeurPage <= m.largeur, `${ou} : aucun défilement de côté (${m.largeurPage} > ${m.largeur})`);
          assert.deepEqual(m.hors, [], `${ou} : tout reste dans la carte`);
          assert.deepEqual(m.coupe, [], `${ou} : rien de coupé`);
          assert.ok(m.valider && m.pave, `${ou} : le pavé et le bouton sont là`);
          // Pas plus haut que la leçon (à une ligne près) : au téléphone, la
          // page peut défiler, mais un calcul tiré ne doit pas l'allonger.
          assert.ok(m.defile <= reference.defile + 24, `${ou} : la page défile de ${m.defile} px (leçon : ${reference.defile} px)`);
          pires.push({ou, defile: m.defile, lecon: reference.defile, echelle: m.echelle});
          if (CAPTURES) await page.screenshot({path: path.join(CAPTURES, `${taille.nom}-${cle}-${tire.g}.png`), fullPage: true});
          vus += 1;
        }
      }
      await session.contexte.close();
    }
  } finally {
    await navigateur.close();
    serveur.close();
  }
  const plusHaut = pires.filter(p => p.defile > 0).sort((a, b) => b.defile - a.defile).slice(0, 8);
  console.log(`lot 3c au téléphone : ${vus} écrans J'écris regardés (${NIVEAUX.length} niveaux, 2 tailles), rien ne déborde.`);
  if (plusHaut.length) console.log(`la page défile (px) : ${plusHaut.map(p => `${p.ou} ${p.defile} (leçon ${p.lecon})`).join(" ; ")}`);
})().catch(erreur => {
  console.error(erreur);
  process.exit(1);
});
