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

// Le résumé de la barre de lancement : « n notion(s) sélectionnée(s) » (0 si rien n'est coché).
async function nombreCoche(page) {
  return Number.parseInt(await page.locator(".barre-lancement .resume strong").innerText()) || 0;
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
        // La barre est toujours là (décision G) : rien de coché, « Lancer la série » est grisé.
        assert.equal(await page.locator('[data-action="lancer"]').isDisabled(), true);
        await page.locator('[data-selection="NC27"]').check();
        await page.locator(".barre-lancement").getByText("1 notion sélectionnée").waitFor();
        await photo(page, "domaine", mesures);
        await page.locator('[data-action="lancer"]').click();
        await page.locator(".barre-question .centre").getByText("1 sur 10").waitFor();
        await question(page, base);
        await photo(page, "question-clavier", mesures);
        await verifierCommandes(page);
        await page.locator('[data-action="aide"]').click();
        // Coque V2 (C5) : au téléphone, le clavier reste avec l'aide ; l'ordinateur n'en a pas.
        assert.equal(await page.locator(".clavier").isVisible(), width === 390);
        await photo(page, "aide", mesures);
        await page.locator('[data-action="etape"]').click();
        assert.equal(await page.locator(".aide .dessin svg").count(), 1);
        await photo(page, "etape", mesures);
        await page.locator(".champ").first().click();
        await stabiliser(page);
        if (width === 390) {
          assert.equal(await page.locator(".clavier").isVisible(), true);
          const aide = await page.locator(".aide .dessin svg").boundingBox();
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
        await page.getByRole("button", { name: "Revenir à la question" }).click();
        await question(page, base);
        await page.locator(".champ").fill("999");
        await page.locator('[data-action="valider"]').click();
        // Coque V2 (C6) : plus de second essai ; la case barrée, la bonne réponse, « Voir l'explication ».
        assert.equal(await page.locator('[data-action="explication"]').isVisible(), true);
        assert.equal(await page.locator(".carte .case.faux").count(), 1);
        assert.equal(await page.locator(".bonne").isVisible(), true);
        assert.equal(await page.locator(".clavier").isVisible(), false, "Le clavier s’en va");
        await photo(page, "faux", mesures);
        await page.locator('[data-action="explication"]').click();
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
        // Plus de page Diaporama (décision H) : Projeter ouvre sa fenêtre (tablette, ordinateur).
        await page.goto(base);
        await page.locator('[data-domaine="nombres-calculs"]').click();
        await page.locator('[data-selection-domaine="nombres-calculs"]').check();
        if (width >= 700) {
          await page.locator('[data-action="projeter-reglages"]').click();
          await photo(page, "projeter", mesures);
          await page.locator('dialog [data-action="projeter"]').click();
        }
        await page.goto(`${base}?notion=NC27&forme=a&graine=123&mode=project`);
        await photo(page, "projection", mesures);
        await page.locator('[data-action="aide"]').first().click();
        await photo(page, "projection-aide", mesures);
        await page.goto(base);
        await page.locator('[data-action="brevet"]').click();
        await photo(page, "brevet-depart", mesures);
        await page.locator('[data-action="brevet-commencer"]').click();
        assert.equal(await page.locator('[data-action="aide"]').count(), 0);
        assert.equal(await page.locator(".etoiles").count(), 0, "Aucune étoile nulle part");
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

test(
  "sélection : deux notions de deux domaines, une seule série qui les mélange",
  { skip: ignorer, timeout: 90000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const erreurs = [];
    try {
      const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
      page.on("pageerror", (erreur) => erreurs.push(erreur.message));
      await page.goto(base);
      await page.locator('[data-domaine="nombres-calculs"]').click();
      await page.locator('[data-selection="NC27"]').check();
      await page.locator('[data-action="retour"]').click();
      await page.locator(".domaines").waitFor();
      // Accueil d'après la V2 : la pastille « k / n » du domaine.
      assert.match(
        await page
          .locator('[data-domaine="nombres-calculs"] .compteur-domaine')
          .evaluate((pastille) => pastille.firstChild.textContent),
        /^1 \/ \d+$/,
      );
      assert.equal(await nombreCoche(page), 1);
      await page.locator('[data-domaine="espace-geometrie"]').click();
      assert.equal(await page.locator('[data-selection="EG12"]').isChecked(), false);
      await page.locator('[data-selection="EG12"]').check();
      assert.equal(await nombreCoche(page), 2);
      await page.locator('[data-action="lancer"]').click();
      const notions = new Set();
      while ((await page.evaluate(() => document.body.dataset.ecran)) === "question") {
        notions.add(await page.locator(".pastille-notion").textContent());
        await page.locator('[data-action="passer"]').click();
        await page.locator('[data-action="suivante"]').click();
      }
      assert.deepEqual(
        [...notions].sort((a, b) => a.localeCompare(b, "fr")),
        ["Équations à une ou deux étapes", "Rapports trigonométriques"],
      );
      // « Changer de notions » (bilan) ramène au menu d'origine, la sélection reste (décision J).
      await page.locator('[data-action="changer"]').click();
      assert.equal(await page.evaluate(() => document.body.dataset.ecran), "domaine");
      assert.equal(await nombreCoche(page), 2);
      assert.deepEqual(erreurs, []);
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

test(
  "sélection : changer de niveau retire les notions qui n’en sont plus",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    try {
      const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
      await page.goto(base);
      await page.locator('[data-domaine="nombres-calculs"]').click();
      await page.locator('[data-selection-domaine="nombres-calculs"]').check();
      const avant = await nombreCoche(page);
      // Le niveau se choisit sur l'accueil (« Préparer la série ») : on referme le domaine.
      await page.locator(".domaine-tete").click();
      await page.locator('[data-niveau="6e"]').click();
      const apres = await nombreCoche(page);
      // Le compteur ne garde que les notions cochées encore visibles en 6e.
      await page.locator('[data-domaine="nombres-calculs"]').click();
      const cochees = await page.locator("[data-selection]:checked").count();
      assert.ok(apres < avant, `6e : moins de notions (${avant} → ${apres})`);
      assert.equal(apres, cochees, "Le compteur = les cases cochées de 6e");
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

test(
  "question : l’énoncé reste en place quand l’aide s’ouvre, le champ reste entier",
  { skip: ignorer, timeout: 90000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const mesurer = (page) =>
      page.evaluate(() => {
        const zone = document.querySelector(".espace-question").getBoundingClientRect();
        const champ = document.querySelector(".reponses").getBoundingClientRect();
        return {
          enonce: document.querySelector(".enonce").getBoundingClientRect().top,
          champEntier: champ.top >= zone.top - 1 && champ.bottom <= zone.bottom + 1,
        };
      });
    try {
      for (const [width, height, tactile] of [
        [390, 844, true],
        [820, 1180, true],
        [1180, 820, true],
        [1366, 768, false],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height },
          isMobile: tactile,
          hasTouch: tactile,
        });
        const nom = `${width}x${height}`;
        await page.goto(`${base}?notion=NC27&forme=a&graine=12`);
        await page.locator(".reponses").waitFor();
        await stabiliser(page);
        const avant = await mesurer(page);
        await page.locator('[data-action="aide"]').click();
        await page.locator(".aide").waitFor();
        await stabiliser(page);
        const apres = await mesurer(page);
        assert.ok(apres.champEntier, `${nom} : champ entier avec l’aide`);
        assert.ok(apres.enonce <= avant.enonce + 1, `${nom} : l’énoncé ne descend pas`);
        // Coque V2 : la carte est en haut, l'aide s'ajoute dessous ; l'énoncé ne bouge pas d'un pixel.
        assert.ok(Math.abs(apres.enonce - avant.enonce) <= 1, `${nom} : énoncé immobile`);
        await page.close();
      }
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
  "tablette : le clavier à l’écran apparaît dans le cadre et Valider reste visible",
  { skip: ignorer, timeout: 90000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const erreurs = [];
    await mkdir(captures, { recursive: true });
    const adresse = `${base}?notion=NC27&forme=a&graine=12`;
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
        // Sur tablette, le clavier est ouvert dès l'arrivée ; Aide · Passer · Valider sont dessous.
        const clavier = await page.locator(".clavier").evaluate((element) => ({
          cache: element.hidden,
          hauteur: element.getBoundingClientRect().height,
          largeur: element.getBoundingClientRect().width,
        }));
        assert.equal(clavier.cache, false, `${nom} : clavier ouvert à l’arrivée`);
        assert.ok(clavier.hauteur > 0, `${nom} : clavier visible`);
        // Coque V2 (C4) : pavé 5 colonnes, 560 px au plus (comme la maquette).
        assert.ok(clavier.largeur >= 300 && clavier.largeur <= 560, `${nom} : largeur du clavier`);
        assert.equal(await page.locator(".champ").first().getAttribute("inputmode"), "none");
        assert.ok(await dansEcran(page, '[data-action="passer"]'), `${nom} : Passer visible`);
        assert.ok(await dansEcran(page, '[data-action="valider"]'), `${nom} : Valider visible`);
        assert.equal(await page.locator(".touches .confirmer").count(), 0, `${nom} : pas de ✓`);
        assert.equal(
          await page.locator(".touches .symbole").count(),
          2,
          `${nom} : − et / au clavier`,
        );
        assert.ok(await dansEcran(page, ".champ"), `${nom} : champ visible`);
        assert.equal(
          await page.locator(".symboles").count(),
          0,
          `${nom} : symboles une seule fois`,
        );
        assert.ok(
          await page.evaluate(
            () =>
              document.querySelector(".coque").getBoundingClientRect().bottom <= innerHeight + 1,
          ),
          `${nom} : cadre entier dans l’écran`,
        );
        const echelle = await page.evaluate(() =>
          Number(getComputedStyle(document.documentElement).getPropertyValue("--echelle")),
        );
        assert.ok(echelle >= 0.98, `${nom} : rien ne rétrécit (${echelle})`);
        const consigne = await page
          .locator(".enonce h1")
          .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
        assert.ok(consigne >= 27, `${nom} : consigne lisible (${consigne}px)`);
        await page.screenshot({ path: resolve(captures, `${nom}-question-clavier.png`) });
        // Coque V2 (C1) : au doigt, pas de bouton ⌨ ni plein écran dans la barre (ordinateur seulement).
        assert.equal(
          await page.locator('[data-action="clavier"]').isVisible(),
          false,
          `${nom} : pas de ⌨`,
        );
        // Graine 12 : « x + 1 = 6 ».
        await page.locator('.touches button[aria-label="5"]').click();
        await page.locator('[data-action="valider"]').click();
        // Coque V2 (C6) : juste, la case verte et un ✓ à côté, sans phrase.
        await page.locator(".carte .case.juste + .coche, .carte .coche").first().waitFor();

        await page.goto(adresse);
        await page.locator(".reponses").waitFor();
        await page.locator('[data-action="aide"]').click();
        await stabiliser(page);
        assert.equal(
          await page.locator(".clavier").isVisible(),
          true,
          `${nom} : le clavier reste ouvert avec l’aide`,
        );
        const aide = await page.locator(".aide .dessin svg").boundingBox();
        const touches = await page.locator(".clavier").boundingBox();
        assert.ok(aide.y >= 0, `${nom} : dessin visible`);
        // Coque V2 : une seule place partout, le dessin sous la question, au-dessus du clavier.
        assert.ok(aide.y + aide.height <= touches.y, `${nom} : dessin au-dessus du clavier`);
        await page.screenshot({ path: resolve(captures, `${nom}-aide-clavier.png`) });
        await page.close();
      }

      const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
      await page.goto(adresse);
      await page.locator(".reponses").waitFor();
      await page.locator(".champ").first().click();
      await stabiliser(page);
      assert.equal(
        await page.locator(".clavier").isVisible(),
        false,
        "Ordinateur : pas de clavier",
      );
      assert.equal(await page.locator(".champ").first().getAttribute("inputmode"), "text");
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
        // Une écriture illisible n'est pas une réponse (message, on corrige) ; un nombre faux finit la question.
        assert.equal(
          await page.locator('[data-action="explication"], .erreur-connue').first().isVisible(),
          true,
        );
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
  "parcours : préférences, événements, Projeter et minuteurs",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    try {
      await question(page, base);
      await page.locator(".champ").fill("4");
      await page.locator('[data-action="valider"]').click();
      // Coque V2 (C6) : la question finie, Aide et Cours quittent la carte.
      assert.equal(await page.locator('[data-action="cours"]').count(), 0);
      await page.locator('[data-action="suivante"]').click();
      assert.match(await page.locator(".contenu").innerText(), /1 sans aide/);
      await page.goto(`${base}?notions=NC27&nombre=2&graine=123&niveau=brevet`);
      await page.locator('[data-action="aide"]').click();
      // Coque V2 (C5) : plus de case « Garder l'aide affichée » ; l'aide se referme à la question suivante.
      assert.equal(await page.locator("#garder-aide").count(), 0);
      await page.locator('[data-action="passer"]').click();
      await page.locator('[data-action="suivante"]').click();
      assert.equal(await page.locator(".aide").count(), 0, "Aide refermée à la question suivante");
      // Projeter (décision H) : le nombre vient de « Préparer la série », le reste de la fenêtre.
      await page.goto(base);
      await page.locator('[data-nombre="5"]').click();
      await page.locator('[data-domaine="nombres-calculs"]').click();
      await page.locator('[data-selection-domaine="nombres-calculs"]').check();
      await page.locator('[data-action="projeter-reglages"]').click();
      await page.locator("#secondes").fill("5");
      await page.locator("#delai").fill("0");
      await page.locator("#automatique").check();
      // P10 : plus de lien vers un autre écran ; la fenêtre rappelle la sélection et le nombre.
      assert.match(await page.locator(".rappel-selection").innerText(), /notions · 5 questions$/);
      await page.clock.install();
      await page.locator('[data-action="projeter"]').click();
      await page.clock.runFor(5400);
      assert.match(await page.locator(".barre-question .centre").innerText(), /2 sur 5/);
      await page.keyboard.press("Space");
      const temps = await page.locator("#temps").innerText();
      await page.clock.fastForward(10000);
      assert.equal(await page.locator("#temps").innerText(), temps, "Pause par espace");
      // Même adresse pendant le diaporama = un rechargement : on retrouve le domaine d'origine (P12).
      await page.goto(base);
      await page.locator(".domaine-tete").click();
      await page.locator('[data-action="brevet"]').click();
      await page.locator('[data-action="brevet-commencer"]').click();
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

test(
  "bilan (coque V2) : « Refaire mes erreurs » relance les mêmes questions ratées",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    try {
      await page.goto(`${base}?notions=NC04&nombre=10&graine=12`);
      const enonces = [];
      for (let rang = 0; rang < 10; rang++) {
        await page.locator(".carte").waitFor();
        enonces.push(await page.locator(".carte .reponses").innerText());
        // Toutes passées : dix erreurs à refaire, dans le même ordre, mêmes formes et graines.
        await page.locator('[data-action="passer"]').click();
        await page.locator('[data-action="suivante"]').click();
      }
      await page.locator(".grand-score").waitFor();
      assert.equal(await page.locator(".score").innerText(), "0 / 10");
      assert.equal(
        await page.locator(".actions-bilan button").first().innerText(),
        "Refaire mes erreurs",
      );
      // Les boutons du bilan restent visibles sans défiler, sous la liste (planche 10).
      const bouton = await page.locator('[data-action="refaire"]').boundingBox();
      assert.ok(bouton.y + bouton.height <= 844, "Refaire mes erreurs visible sans défiler");
      await page.locator('[data-action="refaire"]').click();
      await page.locator(".barre-question .centre").getByText("1 sur 10").waitFor();
      assert.equal(await page.locator(".carte .reponses").innerText(), enonces[0]);
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

test(
  "diaporama (coque V2) : ← · Aide · Réponse · Explication · →, la réponse en vert dans la case",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    try {
      await page.goto(`${base}?notion=NC04&forme=e&graine=12&mode=project`);
      await page.locator(".barre-projection").waitFor();
      assert.deepEqual(await page.locator(".barre-projection button").allInnerTexts(), [
        "←",
        "Aide",
        "Réponse",
        "Explication",
        "→",
      ]);
      // Graine 12 : « 0,4 × 2 = [ ] », la case vide tant que le professeur ne montre pas la réponse.
      assert.equal(await page.locator(".carte .calcul .case").innerText(), "");
      await page.locator('[data-action="reponse"]').click();
      assert.equal(await page.locator(".carte .calcul .case.juste").innerText(), "0,8");
      await page.locator('#commandes [data-action="aide"]').click();
      await page.locator(".aide .dessin svg").waitFor();
      await page.locator('[data-action="explication"]').click();
      await page.locator(".explication").waitFor();
      const tient = await page.evaluate(
        () => document.querySelector(".coque").getBoundingClientRect().bottom <= innerHeight + 1,
      );
      assert.ok(tient, "La coque tient dans l’écran");
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Corrections après C7 (K1) : la bulle cachait le point A (EG02-a, graine 9) et la lettre C (EG06-d).
// L'aide d'une question à figure passe sous la carte ; la figure reste entière et rien ne la couvre.
async function figureDecouverte(page) {
  return page.evaluate(() => {
    const figure = document.querySelector(".carte .figure > svg").getBoundingClientRect();
    const zone = document.querySelector(".espace-question").getBoundingClientRect();
    const haut = Math.max(figure.top, zone.top);
    const bas = Math.min(figure.bottom, zone.bottom);
    const couverts = [];
    for (let i = 1; i < 8; i++)
      for (let j = 1; j < 8; j++) {
        const x = figure.left + (figure.width * i) / 8;
        const y = haut + ((bas - haut) * j) / 8;
        const element = document.elementFromPoint(x, y);
        // La figure, ou la même figure annotée posée dans sa boîte (K6).
        if (!element?.closest(".carte .figure > svg, .carte .figure-aide"))
          couverts.push([Math.round(x), Math.round(y)]);
      }
    return couverts;
  });
}

// La boîte d'un élément dans la page (défilement de la zone compris).
const boitePage = (page, selecteur) =>
  page.evaluate((cible) => {
    const boite = document.querySelector(cible).getBoundingClientRect();
    const defilement = document.querySelector(".espace-question").scrollTop;
    return { x: boite.x, y: boite.y + defilement, width: boite.width, height: boite.height };
  }, selecteur);

// La place de la question DANS LA PAGE : sa position à l'écran plus le défilement de la zone (K7
// fait défiler la zone jusqu'au panneau d'aide ; la question ne doit pas changer de place).
const positionQuestion = (page) =>
  page.evaluate(() => {
    const defilement = document.querySelector(".espace-question").scrollTop;
    return [".carte .consigne", ".carte .reponses"].map(
      (selecteur) => document.querySelector(selecteur).getBoundingClientRect().top + defilement,
    );
  });

test(
  "figure (coque V2, K1) : l'aide sous la carte, rien sur la figure, la question ne bouge pas",
  { skip: ignorer, timeout: 90000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    try {
      for (const [width, height, tactile] of [
        [390, 844, true],
        [375, 667, true],
        [1366, 768, false],
      ]) {
        for (const adresse of ["notion=EG02&forme=a&graine=9", "notion=EG06&forme=d&graine=12"]) {
          const page = await browser.newPage({
            viewport: { width, height },
            isMobile: tactile,
            hasTouch: tactile,
          });
          const nom = `${adresse} ${width}x${height}`;
          await page.goto(`${base}?${adresse}`);
          await page.locator(".carte .figure svg").waitFor();
          await stabiliser(page);
          const avant = await positionQuestion(page);
          await page.locator('.carte [data-action="aide"]').click();
          await page.locator(".espace-question > .aide").waitFor();
          await stabiliser(page);
          assert.equal(await page.locator(".bulle-aide").count(), 0, `${nom} : pas de bulle`);
          assert.deepEqual(await figureDecouverte(page), [], `${nom} : rien ne couvre la figure`);
          const apres = await positionQuestion(page);
          apres.forEach((haut, rang) =>
            assert.ok(Math.abs(haut - avant[rang]) <= 1, `${nom} : la question ne bouge pas`),
          );
          await page.close();
        }
      }
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

test(
  "calcul long (coque V2) : réduit jusqu'à 70 %, puis à la ligne, la case reste dans l'écran",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    try {
      // Graine 12 : « 4,7 × 10² − 3 × 10 + 1,1 × 10⁻¹ = [ ] », trop long pour 390 px.
      await page.goto(`${base}?notion=NC15&forme=g&graine=12`);
      await page.locator(".carte .calcul .case").waitFor();
      await stabiliser(page);
      const mesure = await page.evaluate(() => {
        const calcul = document.querySelector(".carte .calcul");
        const carte = document.querySelector(".carte").getBoundingClientRect();
        const kase = document.querySelector(".carte .calcul .case").getBoundingClientRect();
        return {
          tient: calcul.scrollWidth <= calcul.clientWidth + 1,
          caseDansCarte: kase.left >= carte.left && kase.right <= carte.right,
        };
      });
      assert.ok(mesure.tient, "Le calcul tient dans la carte");
      assert.ok(mesure.caseDansCarte, "La case est dans la carte");
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Corrections après C7 (K2) : les 31 formes dont le dessin d'aide n'est pas la figure (29 lançables,
// liste de Codex, figures.json). La figure reste en place : rien ne bouge à l'ouverture de l'aide.
const FIGURES_AIDE_DIFFERENTE = (
  "NC19-d NC31-b EG02-a EG02-b EG02-c EG05-e EG06-a EG06-b EG06-c EG07-a EG07-b EG07-c EG07-d " +
  "DP01-a DP02-a DP02-e DP03-a DP04-c DP04-e DP08-c PI01-a PI02-a PI02-d PI02-e PI03-a PI03-d " +
  "PI03-g PI03-h PI03-i"
).split(" ");

test(
  "figures (coque V2, K2) : 29 formes, le calcul et les réponses ne bougent pas à l'aide",
  { skip: ignorer, timeout: 400000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const bouges = [];
    try {
      for (const [width, height, tactile] of [
        [390, 844, true],
        [375, 667, true],
        [820, 1180, true],
        [1366, 768, false],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height },
          isMobile: tactile,
          hasTouch: tactile,
        });
        for (const id of FIGURES_AIDE_DIFFERENTE) {
          const [notion, forme] = id.split("-");
          await page.goto(`${base}?notion=${notion}&forme=${forme}&graine=12`);
          await page.locator(".carte .figure svg").waitFor();
          await stabiliser(page);
          const avant = await positionQuestion(page);
          await page.locator('.carte [data-action="aide"]').click();
          await page.locator(".espace-question > .aide").waitFor();
          await stabiliser(page);
          const apres = await positionQuestion(page);
          const ecart = Math.max(...apres.map((haut, rang) => Math.abs(haut - avant[rang])));
          if (ecart > 1) bouges.push(`${id} ${width}x${height} : ${ecart.toFixed(1)} px`);
        }
        await page.close();
      }
      assert.deepEqual(bouges, []);
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

test(
  "figure (coque V2, K2) : avec aideSurFigure, le dessin d'aide prend exactement la boîte de la figure",
  { skip: ignorer, timeout: 90000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    try {
      for (const [width, height, tactile] of [
        [390, 844, true],
        [1366, 768, false],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height },
          isMobile: tactile,
          hasTouch: tactile,
        });
        // Aucune forme n'a encore aideSurFigure : le catalogue servi en reçoit un pour EG02-a.
        await page.route("**/catalogue/catalogue.json", async (route) => {
          const catalogue = await (await route.fetch()).json();
          catalogue
            .find((famille) => famille.id === "EG02")
            .formes.find((forme) => forme.id === "a").aideSurFigure = true;
          await route.fulfill({ json: catalogue });
        });
        await page.goto(`${base}?notion=EG02&forme=a&graine=9`);
        await page.locator(".carte .figure svg").waitFor();
        await stabiliser(page);
        const avant = await positionQuestion(page);
        const boite = await boitePage(page, ".carte .figure > svg");
        await page.locator('.carte [data-action="aide"]').click();
        await page.locator(".carte .figure-aide svg").waitFor();
        await stabiliser(page);
        const calque = await boitePage(page, ".carte .figure-aide svg");
        for (const cle of ["x", "y", "width", "height"])
          assert.ok(Math.abs(calque[cle] - boite[cle]) <= 1, `${width} : même ${cle}`);
        const apres = await positionQuestion(page);
        apres.forEach((haut, rang) =>
          assert.ok(Math.abs(haut - avant[rang]) <= 1, `${width} : la question ne bouge pas`),
        );
        assert.equal(await page.locator(".espace-question > .aide .dessin").count(), 0);
        await page.close();
      }
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Corrections après C7 (K3) : au diaporama, Réponse → Aide → Explication laissait les deux
// panneaux ouverts et le second dessin débordait (125 px). Un seul panneau, tous les dessins mesurés.
test(
  "diaporama (coque V2, K3) : l'explication prend la place de l'aide, rien ne défile",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const contenuVisible = () =>
      page.evaluate(() => {
        const zone = document.querySelector(".espace-question");
        const cadre = zone.getBoundingClientRect();
        const dessins = [...zone.querySelectorAll(".dessin svg")].map((dessin) => {
          const boite = dessin.getBoundingClientRect();
          return boite.top >= cadre.top - 1 && boite.bottom <= cadre.bottom + 1;
        });
        return { defile: zone.scrollHeight > zone.clientHeight + 1, dessins };
      });
    try {
      await page.goto(`${base}?notion=NC04&forme=e&graine=12&mode=project`);
      await page.locator(".barre-projection").waitFor();
      await page.locator('[data-action="reponse"]').click();
      await page.locator('#commandes [data-action="aide"]').click();
      await page.locator(".aide .dessin svg").waitFor();
      await stabiliser(page);
      assert.deepEqual(await contenuVisible(page), { defile: false, dessins: [true] }, "Aide");
      await page.locator('#commandes [data-action="explication"]').click();
      await page.locator(".explication").waitFor();
      await stabiliser(page);
      assert.equal(await page.locator(".espace-question > .aide").count(), 0, "Un seul panneau");
      assert.deepEqual(
        await contenuVisible(page),
        { defile: false, dessins: [true] },
        "Explication",
      );
      // Refermer l'explication ramène l'aide.
      await page.locator('#commandes [data-action="explication"]').click();
      await page.locator(".espace-question > .aide").waitFor();
      assert.equal(await page.locator(".explication").count(), 0);
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Corrections après C7 (K5) : en EG06-b, le « dessin d'aide » (90° / 180°) n'est pas la figure
// annotée ; il remplaçait l'angle de 60°. La figure reste celle de la question, le schéma va dessous.
test(
  "figure (coque V2, K5) : EG06-b garde son angle, le schéma d'aide est dans le panneau",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      await page.goto(`${base}?notion=EG06&forme=b&graine=12`);
      await page.locator(".carte .figure > svg").waitFor();
      await stabiliser(page);
      const figure = () => page.locator(".carte .figure > svg").evaluate((svg) => svg.outerHTML);
      const avant = await figure();
      const positions = await positionQuestion(page);
      await page.locator('.carte [data-action="aide"]').click();
      await page.locator(".espace-question > .aide .dessin svg").waitFor();
      await stabiliser(page);
      const apres = await figure();
      assert.equal(
        apres.replace(/ style="[^"]*"/, ""),
        avant.replace(/ style="[^"]*"/, ""),
        "La figure de la question reste la même",
      );
      assert.equal(await page.locator(".carte .figure-aide").count(), 0, "Pas de calque");
      (await positionQuestion(page)).forEach((haut, rang) =>
        assert.ok(Math.abs(haut - positions[rang]) <= 1, "La question ne bouge pas"),
      );
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Corrections 2 (K6) : un dessin d'aide de même boîte (viewBox) que la figure est la figure annotée
// (pointillés de EG02-a) : il se pose dans la boîte de la figure ; le panneau garde la phrase.
test(
  "figure annotée (coque V2, K6) : même boîte que la figure, le dessin d'aide prend sa place",
  { skip: ignorer, timeout: 300000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const ecarts = [];
    try {
      for (const [width, height, tactile] of [
        [390, 844, true],
        [375, 667, true],
        [820, 1180, true],
        [1366, 768, false],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height },
          isMobile: tactile,
          hasTouch: tactile,
        });
        for (const [notion, forme, graine] of [
          ["EG02", "a", 9],
          ["EG02", "a", 12],
          ["DP01", "a", 12],
          ["PI03", "a", 12],
        ]) {
          const nom = `${notion}-${forme} g${graine} ${width}x${height}`;
          await page.goto(`${base}?notion=${notion}&forme=${forme}&graine=${graine}`);
          await page.locator(".carte .figure svg").waitFor();
          await stabiliser(page);
          const avant = await positionQuestion(page);
          const boite = await boitePage(page, ".carte .figure > svg");
          await page.locator('.carte [data-action="aide"]').click();
          await page.locator(".espace-question > .aide").waitFor();
          await stabiliser(page);
          if (!(await page.locator(".carte .figure-aide svg").count())) {
            ecarts.push(`${nom} : pas de dessin sur la figure`);
          } else {
            const calque = await boitePage(page, ".carte .figure-aide svg");
            for (const cle of ["x", "y", "width", "height"])
              if (Math.abs(calque[cle] - boite[cle]) > 1) ecarts.push(`${nom} : ${cle} différent`);
          }
          if (await page.locator(".espace-question > .aide .dessin").count())
            ecarts.push(`${nom} : dessin répété dans le panneau`);
          const apres = await positionQuestion(page);
          apres.forEach((haut, rang) => {
            if (Math.abs(haut - avant[rang]) > 1) ecarts.push(`${nom} : la question bouge`);
          });
        }
        await page.close();
      }
      assert.deepEqual(ecarts, []);
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Corrections 2 (K7) : le panneau d'aide s'ouvrait sous le bas de l'écran (EG06-b, EG05-e). La zone
// défile juste assez pour le montrer ; la question garde sa place dans la page, la case reste visible.
test(
  "aide hors de vue (coque V2, K7) : la zone défile jusqu'au panneau, la case reste visible",
  { skip: ignorer, timeout: 120000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    try {
      for (const [width, height, tactile] of [
        [390, 844, true],
        [1366, 768, false],
      ]) {
        for (const [notion, forme] of [
          ["EG06", "b"],
          ["EG05", "e"],
        ]) {
          const page = await browser.newPage({
            viewport: { width, height },
            isMobile: tactile,
            hasTouch: tactile,
          });
          const nom = `${notion}-${forme} ${width}x${height}`;
          await page.goto(`${base}?notion=${notion}&forme=${forme}&graine=12`);
          await page.locator(".carte .figure svg").waitFor();
          await stabiliser(page);
          const avant = await positionQuestion(page);
          await page.locator('.carte [data-action="aide"]').click();
          await page.locator(".espace-question > .aide").waitFor();
          await stabiliser(page);
          const mesure = await page.evaluate(() => {
            const zone = document.querySelector(".espace-question");
            const cadre = zone.getBoundingClientRect();
            const dedans = (element) => {
              const boite = element.getBoundingClientRect();
              return boite.top >= cadre.top - 1 && boite.bottom <= cadre.bottom + 1;
            };
            const kase =
              document.querySelector(".champ.active") || document.querySelector(".carte .reponses");
            return {
              panneau: dedans(document.querySelector(".espace-question > .aide")),
              kase: kase.getBoundingClientRect().top >= cadre.top - 1,
              defile: zone.scrollTop,
            };
          });
          assert.ok(mesure.panneau, `${nom} : panneau d'aide entier à l'écran`);
          assert.ok(mesure.kase, `${nom} : la case reste visible`);
          const apres = await positionQuestion(page);
          apres.forEach((haut, rang) =>
            assert.ok(
              Math.abs(haut - avant[rang]) <= 1,
              `${nom} : la question garde sa place dans la page`,
            ),
          );
          await page.close();
        }
      }
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Corrections 3 (K9) : à 375 × 667, EG06-d tombait à × 0,44 (lettres illisibles). La figure ne
// descend plus sous 60 % de sa taille d'origine ; la zone défile, la case active reste visible.
test(
  "figure (coque V2, K9) : jamais sous 60 %, la case active reste visible",
  { skip: ignorer, timeout: 90000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    try {
      for (const [width, height] of [
        [375, 667],
        [390, 844],
      ]) {
        for (const notion of ["EG06&forme=d", "EG02&forme=a"]) {
          const page = await browser.newPage({
            viewport: { width, height },
            isMobile: true,
            hasTouch: true,
          });
          const nom = `${notion} ${width}x${height}`;
          await page.goto(`${base}?notion=${notion}&graine=12`);
          await page.locator(".carte .figure > svg").waitFor();
          await stabiliser(page);
          const mesure = await page.evaluate(() => {
            const figure = document.querySelector(".carte .figure > svg");
            const naturelle = figure.viewBox.baseVal.width;
            const zone = document.querySelector(".espace-question").getBoundingClientRect();
            const kase = document.querySelector(".champ.active").getBoundingClientRect();
            return {
              echelle: figure.getBoundingClientRect().width / naturelle,
              caseVisible: kase.top >= zone.top - 1 && kase.bottom <= zone.bottom + 1,
            };
          });
          assert.ok(mesure.echelle >= 0.595, `${nom} : figure à × ${mesure.echelle.toFixed(2)}`);
          assert.ok(mesure.caseVisible, `${nom} : case active visible`);
          await page.close();
        }
      }
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Corrections 3 (K10) : le calcul en gras (Nunito 800), les lettres rondes et grasses de SplatLettres ;
// un calcul long se réduit sur UNE ligne, la case à côté (NC20-b à 390 px).
test(
  "calcul (coque V2, K10) : en gras, lettres SplatLettres ; réponse numérique : la case à côté",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      await page.goto(`${base}?notion=NC20&forme=b&graine=12`);
      await page.locator(".carte .calcul .case").waitFor();
      await stabiliser(page);
      const mesure = await page.evaluate(() => {
        const calcul = document.querySelector(".carte .calcul");
        const texte = calcul.querySelector(".t");
        const kase = calcul.querySelector(".case").getBoundingClientRect();
        const lettre = calcul.querySelector(".math-variable");
        return {
          gras: Number(getComputedStyle(texte).fontWeight),
          police: getComputedStyle(lettre).fontFamily,
          lettre: lettre.textContent,
          lettreGrasse: Number(getComputedStyle(lettre).fontWeight),
          uneLigne: Math.abs(kase.top - texte.getBoundingClientRect().top) < kase.height,
          tient: calcul.scrollWidth <= calcul.clientWidth + 1,
        };
      });
      assert.equal(mesure.gras, 800, "Chiffres et signes en gras");
      assert.match(mesure.police, /^SplatLettres/, "Lettres SplatLettres");
      assert.equal(mesure.lettre, "𝑥", "La lettre mathématique ronde");
      assert.ok(mesure.lettreGrasse >= 700, "Lettre grasse");
      assert.ok(mesure.tient, "Le calcul tient dans la carte");
      // Depuis K12, la case d'une réponse-expression (NC20-b) passe dessous ; une réponse
      // numérique garde sa case à côté, sur la même ligne (NC07-a, 390 px).
      await page.goto(`${base}?notion=NC07&forme=a&graine=12`);
      await page.locator(".carte .calcul .case").waitFor();
      await stabiliser(page);
      const numerique = await page.evaluate(() => {
        const calcul = document.querySelector(".carte .calcul");
        const texte = calcul.querySelector(".t").getBoundingClientRect();
        const kase = calcul.querySelector(".case").getBoundingClientRect();
        return Math.abs(kase.top - texte.top) < kase.height && kase.left > texte.left;
      });
      assert.ok(numerique, "Réponse numérique : la case sur la même ligne que le calcul");
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Corrections 3 (K11) : au diaporama, l'explication était en petit (planche 19). Aide et explication
// à 28 px au moins ; « Réponse » ferme l'aide.
test(
  "diaporama (coque V2, K11) : textes à 28 px au moins, « Réponse » ferme l'aide",
  { skip: ignorer, timeout: 60000 },
  async () => {
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const taille = (selecteur) =>
      page.locator(selecteur).evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    try {
      await page.goto(`${base}?notion=NC04&forme=e&graine=12&mode=project`);
      await page.locator(".barre-projection").waitFor();
      await page.locator('#commandes [data-action="aide"]').click();
      await page.locator(".espace-question > .aide p").waitFor();
      assert.ok((await taille(".espace-question > .aide p")) >= 28, "Phrase d'aide à 28 px");
      await page.locator('[data-action="reponse"]').click();
      await page.locator(".carte .calcul .case.juste").waitFor();
      assert.equal(
        await page.locator(".espace-question > .aide").count(),
        0,
        "Réponse ferme l'aide",
      );
      await page.locator('#commandes [data-action="explication"]').click();
      await page.locator(".explication .solution").waitFor();
      await stabiliser(page);
      assert.ok((await taille(".explication .solution")) >= 28, "Explication à 28 px");
      const defile = await page
        .locator(".espace-question")
        .evaluate((zone) => zone.scrollHeight > zone.clientHeight + 1);
      assert.equal(defile, false, "Tout tient dans l'écran");
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Correction 4 (précision de K9) : une figure ne descend jamais sous 60 % de sa taille d'origine
// POUR GAGNER DE LA HAUTEUR ; la largeur de la carte reste une limite (un dessin de 600 px dans une
// carte de 329 px est forcément à 54,8 %, il sera redessiné dans les cahiers). Toutes les formes à
// figure, à 375 × 667 : aucune figure sous 60 % alors que la largeur permettait plus.
test(
  "figures (coque V2, K9 précisé) : jamais sous 60 % quand la largeur permet plus, 375 × 667",
  { skip: ignorer, timeout: 600000 },
  async () => {
    const { genererQuestion, formesDisponibles, generateurs } =
      await import("../automatismes/moteur.js");
    const formes = Object.keys(generateurs).flatMap((famille) =>
      formesDisponibles(famille)
        .filter((forme) => genererQuestion(famille, forme, 12).visual)
        .map((forme) => [famille, forme]),
    );
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const page = await browser.newPage({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });
    const trop = [];
    try {
      for (const [famille, forme] of formes) {
        await page.goto(`${base}?notion=${famille}&forme=${forme}&graine=12`);
        // Les formes que l'élève ne peut pas lancer (DP05-a, b) n'ouvrent pas de question.
        if (!(await page.locator(".carte .figure > svg").count())) continue;
        await stabiliser(page);
        const mesure = await page.evaluate(() => {
          const figure = document.querySelector(".carte .figure > svg");
          const naturelle = figure.viewBox.baseVal.width;
          return {
            echelle: figure.getBoundingClientRect().width / naturelle,
            largeur: figure.parentElement.clientWidth / naturelle,
          };
        });
        if (mesure.echelle < Math.min(0.6, mesure.largeur) - 0.005)
          trop.push(`${famille}-${forme} : × ${mesure.echelle.toFixed(3)}`);
      }
      assert.deepEqual(trop, []);
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);

// Correction 4 (K12) : une réponse-expression ne défile plus dans une case minuscule. Le calcul
// garde au moins 90 % de sa taille, finit par « = », la case passe dessous, assez large pour la
// réponse attendue entière.
test(
  "réponse-expression (coque V2, K12) : calcul ≥ 90 %, case dessous, réponse tapée entière visible",
  { skip: ignorer, timeout: 300000 },
  async () => {
    const { genererQuestion } = await import("../automatismes/moteur.js");
    const { serveur, base } = await serveurLocal();
    const browser = await ouvrirNavigateur();
    const ecarts = [];
    try {
      for (const [width, height, tactile] of [
        [390, 844, true],
        [375, 667, true],
        [820, 1180, true],
        [1366, 768, false],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height },
          isMobile: tactile,
          hasTouch: tactile,
        });
        for (const [famille, forme] of [
          ["NC20", "b"],
          ["NC19", "a"],
          ["NC22", "e"],
          ["NC24", "e"],
        ]) {
          const nom = `${famille}-${forme} ${width}x${height}`;
          const reponse = String(genererQuestion(famille, forme, 12).fields[0].answer);
          await page.goto(`${base}?notion=${famille}&forme=${forme}&graine=12`);
          await page.locator(".carte .champ").waitFor();
          await stabiliser(page);
          await page.locator(".carte .champ").click();
          await page.keyboard.type(reponse.replace(/−/g, "-"));
          const mesure = await page.evaluate((large) => {
            const zone = document.querySelector(".espace-question").getBoundingClientRect();
            const champ = document.querySelector(".carte .champ");
            const kase = champ.getBoundingClientRect();
            const calcul = document.querySelector(".carte .calcul:not(.phrase)");
            const style = getComputedStyle(champ);
            const contexte = document.createElement("canvas").getContext("2d");
            contexte.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            const place =
              champ.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
            return {
              rapport: calcul
                ? parseFloat(getComputedStyle(calcul).fontSize) / (large ? 42 : 34)
                : 1,
              dessous: calcul
                ? kase.top >= calcul.querySelector(".t").getBoundingClientRect().bottom - 2
                : true,
              entiere: kase.top >= zone.top - 1 && kase.bottom <= zone.bottom + 1,
              visible: contexte.measureText(champ.value).width <= place + 1,
            };
          }, width >= 700);
          if (mesure.rapport < 0.9) ecarts.push(`${nom} : calcul à ${mesure.rapport.toFixed(2)}`);
          if (!mesure.dessous) ecarts.push(`${nom} : case à côté du calcul`);
          if (!mesure.entiere) ecarts.push(`${nom} : case coupée`);
          if (!mesure.visible) ecarts.push(`${nom} : réponse tapée qui défile`);
        }
        await page.close();
      }
      assert.deepEqual(ecarts, []);
    } finally {
      await browser.close();
      await new Promise((fin) => serveur.close(fin));
    }
  },
);
