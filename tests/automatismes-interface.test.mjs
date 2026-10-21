import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL("../", import.meta.url));
const captures = resolve(racine, "tests/captures/automatismes");
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

async function ouvrirNavigateur() {
  return navigateur.launch({
    headless: true,
    ...(process.env.AUTOMATISMES_NAVIGATEUR
      ? { executablePath: process.env.AUTOMATISMES_NAVIGATEUR }
      : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
}

async function stabiliser(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((fin) => requestAnimationFrame(() => requestAnimationFrame(fin)));
  });
}

async function photo(page, nom, mesures) {
  await page.locator(".cadre").waitFor();
  await stabiliser(page);
  const dimensions = page.viewportSize();
  const controle = await page.evaluate(() => {
    const cadre = document.querySelector(".cadre").getBoundingClientRect();
    const bodySelector = () =>
      document.body.dataset.ecran === "question"
        ? ".espace-question"
        : document.body.dataset.ecran === "accueil"
          ? ".contenu"
          : "[data-zone-non-existante]";
    return {
      largeur: innerWidth,
      hauteur: innerHeight,
      debordement: document.documentElement.scrollWidth > innerWidth + 1,
      contenuCoupe: [...document.querySelectorAll(bodySelector())].some(
        (zone) => zone.scrollHeight > zone.clientHeight + 2,
      ),
      cadre: { gauche: cadre.left, haut: cadre.top, droite: cadre.right, bas: cadre.bottom },
    };
  });
  if (dimensions.width > 680)
    assert.equal(controle.contenuCoupe, false, `${nom} : contenu essentiel entier`);
  assert.equal(controle.debordement, false, `${nom} : aucun débordement horizontal`);
  assert.ok(controle.cadre.bas <= dimensions.height + 1, `${nom} : cadre entier dans l’écran`);
  const fichier = `${dimensions.width}x${dimensions.height}-${nom}.png`;
  await page.screenshot({ path: resolve(captures, fichier) });
  mesures.push({ fichier, ...controle });
}

async function question(page, base, notion = "NC27", forme = "a") {
  await page.goto(`${base}?notion=${notion}&forme=${forme}&graine=123`);
  await page.locator(".reponses").waitFor();
  await stabiliser(page);
}

async function verifierCommandes(page) {
  const positions = await page.locator("#commandes").evaluate((commandes) => {
    return [...commandes.querySelectorAll('[data-action="passer"], [data-action="valider"]')].map(
      (element) => {
        const rect = element.getBoundingClientRect();
        return { haut: rect.top, bas: rect.bottom, gauche: rect.left, droite: rect.right };
      },
    );
  });
  assert.equal(positions.length, 2);
  for (const rect of positions) {
    assert.ok(rect.haut >= 0 && rect.bas <= page.viewportSize().height);
    assert.ok(rect.gauche >= 0 && rect.droite <= page.viewportSize().width);
  }
}

test(
  "interface : parcours et captures aux trois tailles du contrat",
  { skip: ignorer, timeout: 120000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const mesures = [];
    const erreurs = [];
    await mkdir(captures, { recursive: true });
    try {
      for (const [width, height] of [
        [390, 844],
        [1366, 768],
        [1280, 720],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height },
          isMobile: width === 390,
          hasTouch: width === 390,
        });
        await page.addInitScript(() => {
          crypto.getRandomValues = (tableau) => {
            tableau.fill(123);
            return tableau;
          };
        });
        page.on("pageerror", (erreur) => erreurs.push(erreur.message));
        await page.goto(base);
        await page.locator(".domaines").waitFor();
        await photo(page, "accueil", mesures);
        await page.locator('[data-domaine="nombres-calculs"]').click();
        await photo(page, "domaine", mesures);
        await question(page, base);
        await photo(page, "question-clavier", mesures);
        await verifierCommandes(page);
        await page.locator('[data-action="aide"]').click();
        assert.equal(await page.locator(".clavier").isVisible(), false);
        await photo(page, "aide", mesures);
        await page.locator('[data-action="etape"]').click();
        assert.equal(await page.locator(".aide svg").count(), 1);
        await photo(page, "etape", mesures);
        await page.locator(".champ").first().click();
        await stabiliser(page);
        if (width === 390) {
          assert.equal(await page.locator(".clavier").isVisible(), true);
          const aide = await page.locator(".aide svg").boundingBox();
          const commandes = await page.locator("#commandes").boundingBox();
          assert.ok(
            aide.y >= 0 && aide.y + aide.height <= commandes.y,
            "Dessin visible au-dessus du clavier",
          );
          await verifierCommandes(page);
        }
        await photo(page, "aide-clavier", mesures);
        await page.locator('[data-action="cours"]').click();
        await photo(page, "cours", mesures);
        await page.getByRole("button", { name: "J’ai compris" }).click();
        await question(page, base);
        await page.locator(".champ").fill("999");
        // Entrée vaut Valider (au téléphone le bouton s’efface derrière le ✓ du clavier).
        await page.locator(".champ").press("Enter");
        assert.equal(await page.locator('[data-action="correction"]').isVisible(), true);
        await photo(page, "faux", mesures);
        await page.locator('[data-action="correction"]').click();
        await photo(page, "correction", mesures);
        await page.locator('[data-action="suivante"]').click();
        await photo(page, "bilan", mesures);
        await question(page, base, "NC27", "b");
        await photo(page, "fraction", mesures);
        await question(page, base, "NC24", "a");
        await photo(page, "expression", mesures);
        await question(page, base, "EG19", "a");
        await photo(page, "qcm", mesures);
        await question(page, base, "EG12", "a");
        await photo(page, "geometrie", mesures);
        await page.goto(`${base}?prof=1`);
        await photo(page, "prof", mesures);
        await page.locator('[data-selection-domaine="nombres-calculs"]').check();
        await page.locator('[data-action="projeter"]').click();
        await page.goto(`${base}?notion=NC27&forme=a&graine=123&mode=project`);
        await photo(page, "projection", mesures);
        await page.locator('[data-action="aide"]').first().click();
        await photo(page, "projection-aide", mesures);
        await page.goto(base);
        await page.locator('[data-action="brevet"]').click();
        assert.equal(await page.locator('[data-action="aide"]').count(), 0);
        await photo(page, "brevet", mesures);
        await page.close();
      }
      assert.deepEqual(erreurs, []);
      await writeFile(resolve(captures, "mesures.json"), JSON.stringify(mesures, null, 2) + "\n");
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

async function dansEcran(page, selecteur) {
  const rect = await page.locator(selecteur).first().boundingBox();
  const { width, height } = page.viewportSize();
  return rect && rect.y >= 0 && rect.y + rect.height <= height + 1 && rect.x + rect.width <= width;
}

test(
  "écran de question : barre du haut, clavier ouvert sur tablette, Aide · Passer · ✓ sans doublon",
  { skip: ignorer, timeout: 120000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const erreurs = [];
    await mkdir(captures, { recursive: true });
    const adresse = `${base}?notion=NC27&forme=a&graine=12`;
    const tailleTexte = (page, selecteur) =>
      page.locator(selecteur).evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    try {
      for (const [width, height] of [
        [820, 1180],
        [1180, 820],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height },
          hasTouch: true,
          isMobile: true,
        });
        page.on("pageerror", (erreur) => erreurs.push(erreur.message));
        const nom = `${width}x${height}`;
        await page.goto(adresse);
        await page.locator(".reponses").waitFor();
        await stabiliser(page);
        // Le haut sur une ligne : Menu, notion et compteur, score, clavier, plein écran, Cours ; pas de logo.
        assert.equal(await page.locator(".entete-logo").count(), 0, `${nom} : pas de logo`);
        const barre = await page.locator(".barre-question").boundingBox();
        assert.ok(barre.height <= 64, `${nom} : barre du haut sur une ligne (${barre.height} px)`);
        for (const action of ["retour", "clavier", "plein-ecran", "cours"])
          assert.ok(
            await dansEcran(page, `.barre-question [data-action="${action}"]`),
            `${nom} : ${action}`,
          );
        assert.match(await page.locator(".score-barre").innerText(), /✓ 0/);
        // Le clavier est ouvert dès l’arrivée ; Aide et Passer sous lui ; ni symboles ni Valider en double.
        const clavier = await page.locator(".clavier").boundingBox();
        assert.ok(clavier && clavier.height > 0, `${nom} : clavier ouvert à l’arrivée`);
        assert.equal(await page.locator(".champ").first().getAttribute("inputmode"), "none");
        assert.equal(
          await page.locator(".symboles").count(),
          0,
          `${nom} : pas de symboles sous le champ`,
        );
        assert.equal(
          await page.locator('[data-action="valider"]').isVisible(),
          false,
          `${nom} : pas de Valider`,
        );
        assert.ok(await dansEcran(page, ".touches .confirmer"), `${nom} : ✓ visible`);
        assert.ok(
          await dansEcran(page, '.actions-question [data-action="aide"]'),
          `${nom} : Aide en bas`,
        );
        assert.ok(await dansEcran(page, '[data-action="passer"]'), `${nom} : Passer visible`);
        const aideBouton = await page.locator('[data-action="aide"]').boundingBox();
        assert.ok(aideBouton.y >= clavier.y + clavier.height, `${nom} : Aide sous le clavier`);
        assert.ok(
          clavier.width >= 330 && clavier.width <= 440,
          `${nom} : largeur du clavier ${clavier.width}`,
        );
        const echelle = await page.evaluate(() =>
          parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--echelle")),
        );
        assert.ok(echelle >= 0.98, `${nom} : cadre à l’échelle 1 (mesuré ${echelle})`);
        assert.ok(
          await page.evaluate(
            () =>
              document.querySelector(".coque").getBoundingClientRect().bottom <= innerHeight + 1,
          ),
          `${nom} : cadre entier dans l’écran`,
        );
        // La question se lit de loin.
        assert.ok((await tailleTexte(page, ".enonce h1")) >= 23, `${nom} : consigne`);
        assert.ok((await tailleTexte(page, ".question-expression")) >= 38, `${nom} : expression`);
        // Le bouton clavier cache le clavier et rend Valider ; un second appui le rouvre.
        await page.locator('[data-action="clavier"]').click();
        await stabiliser(page);
        assert.equal(await page.locator(".clavier").isVisible(), false, `${nom} : clavier caché`);
        assert.ok(await dansEcran(page, '[data-action="valider"]'), `${nom} : Valider revient`);
        await page.locator('[data-action="clavier"]').click();
        await stabiliser(page);
        assert.equal(await page.locator(".clavier").isVisible(), true, `${nom} : clavier rouvert`);
        if (width === 820)
          await page.screenshot({ path: resolve(captures, `${nom}-question-clavier.png`) });
        // Graine 12 : « x + 1 = 6 ».
        await page.locator('.touches button[aria-label="5"]').click();
        await page.locator(".touches .confirmer").click();
        await page.getByText("Réponse juste.").waitFor();
        assert.match(await page.locator(".score-barre").innerText(), /✓ 1/);

        await page.goto(adresse);
        await page.locator(".reponses").waitFor();
        await page.locator('[data-action="aide"]').click();
        await stabiliser(page);
        assert.equal(
          await page.locator(".clavier").isVisible(),
          true,
          `${nom} : clavier avec l’aide`,
        );
        assert.equal(
          await page.locator('[data-action="aide"]').getAttribute("aria-pressed"),
          "true",
          `${nom} : Aide marquée ouverte`,
        );
        const aide = await page.locator(".aide svg").boundingBox();
        const touches = await page.locator(".clavier").boundingBox();
        if (width === 820) {
          assert.ok(
            aide.y >= 0 && aide.y + aide.height <= touches.y,
            `${nom} : dessin au-dessus du clavier`,
          );
        } else {
          // Tablette couchée : le clavier est à droite de la question, pas en dessous.
          assert.ok(
            aide.x + aide.width <= touches.x && aide.y >= 0,
            `${nom} : dessin à gauche du clavier`,
          );
        }
        await page.screenshot({ path: resolve(captures, `${nom}-aide-clavier.png`) });
        await page.close();
      }

      // Ordinateur : pas de clavier ni de symboles ; le bouton clavier l’appelle, à droite, et c’est mémorisé.
      const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
      page.on("pageerror", (erreur) => erreurs.push(erreur.message));
      await page.goto(adresse);
      await page.locator(".reponses").waitFor();
      await page.locator(".champ").first().click();
      await stabiliser(page);
      assert.equal(
        await page.locator(".clavier").isVisible(),
        false,
        "Ordinateur : pas de clavier",
      );
      assert.equal(await page.locator(".symboles").count(), 0, "Ordinateur : pas de symboles");
      assert.equal(await page.locator(".champ").first().getAttribute("inputmode"), "text");
      assert.ok(await dansEcran(page, '[data-action="valider"]'), "Ordinateur : Valider");
      assert.ok((await tailleTexte(page, ".question-expression")) >= 56, "Ordinateur : expression");
      await page.locator('[data-action="clavier"]').click();
      await stabiliser(page);
      assert.equal(
        await page.locator(".clavier").isVisible(),
        true,
        "Ordinateur : clavier demandé",
      );
      assert.equal(
        await page.locator('[data-action="valider"]').isVisible(),
        false,
        "Ordinateur : ✓ seul",
      );
      const enonce = await page.locator(".enonce").boundingBox();
      const clavierOrdi = await page.locator(".clavier").boundingBox();
      assert.ok(enonce.x + enonce.width <= clavierOrdi.x, "Ordinateur : clavier à droite");
      await page.reload();
      await page.locator(".reponses").waitFor();
      await stabiliser(page);
      assert.equal(await page.locator(".clavier").isVisible(), true, "Ordinateur : choix mémorisé");
      await page.screenshot({ path: resolve(captures, "1366x768-clavier.png") });
      await page.close();
      assert.deepEqual(erreurs, []);
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

test(
  "sécurité : aucune saisie HTML réinjectée pour chaque type de réponse",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage();
    const charge = '<img src=x onerror="window.injection=1">';
    try {
      for (const [notion, forme] of [
        ["NC27", "a"],
        ["NC27", "b"],
        ["NC24", "a"],
        ["NC29", "a"],
        ["GM04", "b"],
      ]) {
        await question(page, base, notion, forme);
        for (const champ of await page.locator(".champ").all()) await champ.fill(charge);
        await page.locator('[data-action="aide"]').click();
        assert.equal(await page.locator(".reponses img, .reponses [onerror]").count(), 0);
        await page.locator('[data-action="valider"]').click();
        assert.equal(await page.locator('img[src="x"], [onerror]').count(), 0);
        assert.equal(await page.evaluate(() => window.injection), undefined);
        assert.equal(await page.locator('[data-action="correction"]').isVisible(), true);
      }
      await question(page, base, "EG19", "a");
      assert.ok(await page.locator(".choix-bouton").count());
      assert.equal(await page.locator(".choix-bouton:visible").count(), 4);
      await page.getByRole("button", { name: "Autres choix →" }).click();
      assert.equal(await page.locator(".choix-bouton:visible").count(), 2);
      assert.equal(await page.locator(".champ").count(), 0, "Le QCM n’accepte aucune saisie HTML");
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

test(
  "parcours : préférences, événements, partage et minuteurs",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    try {
      await question(page, base);
      await page.locator(".champ").fill("4");
      await page.locator('[data-action="valider"]').click();
      await page.locator('[data-action="cours"]').click();
      await page.getByRole("button", { name: "J’ai compris" }).click();
      await page.locator('[data-action="suivante"]').click();
      assert.match(await page.locator(".contenu").innerText(), /1 sans aide/);
      await page.goto(`${base}?notions=NC27&nombre=2&graine=123&niveau=brevet`);
      await page.locator('[data-action="aide"]').click();
      await page.locator("#garder-aide").check();
      await page.locator('[data-action="passer"]').click();
      await page.locator('[data-action="suivante"]').click();
      assert.equal(
        await page.locator(".aide").isVisible(),
        true,
        "Préférence appliquée à la question suivante",
      );
      await page.goto(`${base}?prof=1`);
      await page.locator('[data-selection-domaine="nombres-calculs"]').check();
      await page.locator("#nombre").fill("2");
      await page.locator("#secondes").fill("5");
      await page.locator("#delai").fill("0");
      await page.locator("#automatique").check();
      await page.locator('[data-action="partager"]').click();
      const lien = await page.locator("#lien-serie a").getAttribute("href");
      assert.match(lien, /notions=.*graine=\d+.*nombre=2.*niveau=brevet/);
      await page.clock.install();
      await page.locator('[data-action="projeter"]').click();
      await page.clock.runFor(5400);
      assert.match(await page.locator(".question-entete").innerText(), /2 \/ 2/);
      await page.keyboard.press("Space");
      const temps = await page.locator("#temps").innerText();
      await page.clock.fastForward(10000);
      assert.equal(await page.locator("#temps").innerText(), temps, "Pause par espace");
      await page.goto(base);
      await page.locator('[data-action="brevet"]').click();
      assert.equal(await page.locator(".navigation-points button").count(), 9);
      await page.clock.fastForward(1201000);
      await page.locator(".score").waitFor();
      assert.equal(
        await page.locator(".liste-resultats details").count(),
        9,
        "Corrections à la fin du chrono",
      );
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);
