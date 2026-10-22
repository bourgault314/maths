// Accueil et menu de /automatismes/ (lot du 22/10/2026, décisions A à L) : l'accueil d'après la V2,
// le domaine ouvert, la barre de lancement, Projeter, et la façon de sortir d'une série.
import test from "node:test";
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
const ignorer = navigateur
  ? false
  : "Playwright absent : exécuter ce contrôle dans l’environnement de revue équipé.";

const TAILLES = [
  [390, 844, true],
  [375, 667, true],
  [820, 1180, true],
  [1366, 768, false],
  [1280, 720, false],
];

async function serveurLocal() {
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".json": "application/json",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  };
  const serveur = createServer(async (requete, reponse) => {
    const url = new URL(requete.url, "http://localhost");
    const chemin = resolve(
      racine,
      `.${url.pathname}${url.pathname.endsWith("/") ? "index.html" : ""}`,
    );
    if (!chemin.startsWith(racine + sep) && !chemin.startsWith(racine)) {
      reponse.writeHead(403).end();
      return;
    }
    try {
      reponse.setHeader("Content-Type", types[extname(chemin)] || "application/octet-stream");
      reponse.end(await readFile(chemin));
    } catch {
      reponse.writeHead(404).end();
    }
  });
  await new Promise((terminer) => serveur.listen(0, "127.0.0.1", terminer));
  return { serveur, base: `http://127.0.0.1:${serveur.address().port}/automatismes/` };
}

// Un navigateur et un serveur pour tout un test ; `page(largeur, hauteur, tactile, prefs)` ouvre une
// page neuve (préférences de l'appareil posées avant le chargement), les erreurs sont relevées.
async function banc(corps) {
  const { serveur, base } = await serveurLocal();
  const browser = await navigateur.launch({
    headless: true,
    ...(process.env.AUTOMATISMES_NAVIGATEUR
      ? { executablePath: process.env.AUTOMATISMES_NAVIGATEUR }
      : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const erreurs = [];
  const page = async (width = 1366, height = 768, tactile = false, prefs = null) => {
    const contexte = await browser.newContext({
      viewport: { width, height },
      isMobile: tactile,
      hasTouch: tactile,
    });
    const nouvelle = await contexte.newPage();
    nouvelle.on("pageerror", (erreur) => erreurs.push(`${width}x${height} ${erreur.message}`));
    if (prefs)
      await nouvelle.addInitScript((valeur) => {
        if (!sessionStorage.getItem("prefs-posees")) {
          localStorage.setItem("mg-automatismes-prefs", valeur);
          sessionStorage.setItem("prefs-posees", "1");
        }
      }, JSON.stringify(prefs));
    return nouvelle;
  };
  try {
    await corps({ base, page });
    assert.deepEqual(erreurs, []);
  } finally {
    await browser.close();
    await new Promise((fin) => serveur.close(fin));
  }
}

async function stabiliser(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((fin) => requestAnimationFrame(() => requestAnimationFrame(fin)));
  });
}

async function accueil(page, base, suite = "") {
  await page.goto(`${base}${suite}`);
  await page.locator(".domaine-carte").first().waitFor();
  await stabiliser(page);
}

const ecran = (page) => page.evaluate(() => document.body.dataset.ecran);
const boites = (page, selecteur) =>
  page.locator(selecteur).evaluateAll((elements) =>
    elements.map((element) => {
      const { top, bottom, left, right, width, height } = element.getBoundingClientRect();
      return { top, bottom, left, right, width, height, visible: element.offsetParent !== null };
    }),
  );

test(
  "P1 : l’accueil d’après la V2 — carte d’en-tête, ① Préparer, ② les domaines, la ligne brevet",
  { skip: ignorer, timeout: 120000 },
  () =>
    banc(async ({ base, page }) => {
      for (const [width, height, tactile] of TAILLES) {
        const nom = `${width}x${height}`;
        const onglet = await page(width, height, tactile, { niveau: "4e", nombre: 10 });
        await accueil(onglet, base);
        // Un seul logo dans l'appli : celui de la carte d'en-tête, lien vers le site.
        const logos = await onglet
          .locator('img[src*="logos/mathsgo"]')
          .evaluateAll((images) => images.map((image) => image.closest("a")?.getAttribute("href")));
        assert.deepEqual(logos, ["/"], `${nom} : un seul logo, lien vers /`);
        assert.equal(await onglet.locator(".entete-appli h1").innerText(), "Automatismes");
        assert.equal(
          await onglet.locator(".titre-appli span").innerText(),
          "Collège · sans calculatrice",
        );
        assert.deepEqual(
          await onglet
            .locator(".etape-menu")
            .evaluateAll((titres) =>
              titres.map((titre) => titre.textContent.replace(/\s+/g, " ").trim()),
            ),
          ["1 Préparer la série", "2 Choisir les automatismes"],
        );
        assert.equal(await onglet.locator(".pied").count(), 0, `${nom} : plus de pied`);
        assert.equal(await onglet.locator(".barre-cadre").count(), 0, `${nom} : pas de barre`);
        assert.equal(await onglet.getByText("Diaporama", { exact: true }).count(), 0);
        // Les cinq domaines et la ligne brevet : une colonne, même largeur.
        const cartes = await boites(onglet, ".domaines .domaine-carte, .ligne-brevet");
        assert.equal(cartes.length, 6, `${nom} : 5 domaines + le brevet`);
        const largeurs = cartes.map((carte) => Math.round(carte.width));
        assert.ok(Math.max(...largeurs) - Math.min(...largeurs) <= 1, `${nom} : ${largeurs}`);
        assert.ok(
          cartes.every((carte, rang) => !rang || carte.top >= cartes[rang - 1].bottom - 1),
          `${nom} : une seule colonne`,
        );
        if (width === 390) assert.equal(largeurs[0], 344, "390 : cartes de 344 px");
        if (width === 820) assert.equal(largeurs[0], 742, "820 : cartes de 742 px");
        assert.match(
          await onglet.locator(".ligne-brevet").innerText(),
          /Entraînement brevet\s+9 questions · 20 min · sans aide/,
        );
        assert.equal(
          await onglet
            .locator('[data-domaine="nombres-calculs"] .compteur-domaine')
            .evaluate((pastille) => pastille.firstChild.textContent.trim()),
          "0 / 28",
        );
        // Plein écran : à droite de la carte d'en-tête dès 700 px, absent au téléphone.
        const plein = await boites(onglet, ".entete-appli .plein-ecran-cadre");
        assert.equal(plein[0].visible, width >= 700, `${nom} : Plein écran`);
        // « Préparer » : une ligne au téléphone (niveaux + « 10 questions ▾ ») ; côte à côte dès 700.
        const niveaux = await boites(onglet, ".reglages-serie [data-niveau]");
        const reglage = await boites(
          onglet,
          width >= 700 ? ".reglages-serie [data-nombre]" : ".reglages-serie [data-choix-nombre]",
        );
        const milieux = [...niveaux, ...reglage].map((boite) => (boite.top + boite.bottom) / 2);
        assert.ok(Math.max(...milieux) - Math.min(...milieux) <= 8, `${nom} : une seule ligne`);
        assert.ok(reglage.every((boite) => boite.visible && boite.left >= niveaux.at(-1).right));
        // Rien ne déborde ; sur ordinateur, le cadre tient entier dans l'écran.
        const mesure = await onglet.evaluate(() => ({
          debord: document.documentElement.scrollWidth > innerWidth,
          bas: document.querySelector(".cadre").getBoundingClientRect().bottom,
        }));
        assert.equal(mesure.debord, false, `${nom} : pas de défilement horizontal`);
        if (!tactile) assert.ok(mesure.bas <= height, `${nom} : cadre entier (${mesure.bas})`);
        await onglet.context().close();
      }
    }),
);
