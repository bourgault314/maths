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

test(
  "P2 : niveaux 6e · 5e · 4e · 3e, 3e par défaut, une préférence « brevet » devient 3e",
  { skip: ignorer, timeout: 60000 },
  () =>
    banc(async ({ base, page }) => {
      const actif = (onglet) =>
        onglet.locator('[data-niveau][aria-pressed="true"]').getAttribute("data-niveau");
      const neuve = await page(390, 844, true);
      await accueil(neuve, base);
      assert.deepEqual(
        await neuve
          .locator("[data-niveau]")
          .evaluateAll((boutons) => boutons.map((bouton) => bouton.textContent.trim())),
        ["6e", "5e", "4e", "3e"],
      );
      assert.equal(await actif(neuve), "3e", "Sans préférence : 3e");
      const ancienne = await page(1366, 768, false, { niveau: "brevet", nombre: 10 });
      await accueil(ancienne, base);
      assert.equal(await actif(ancienne), "3e", "{niveau: brevet} enregistré → 3e");
      await ancienne.locator('[data-niveau="5e"]').click();
      assert.match(
        await ancienne.evaluate(() => localStorage.getItem("mg-automatismes-prefs")),
        /"niveau":"5e"/,
      );
    }),
);

const DOMAINES_IDS = [
  "nombres-calculs",
  "proportionnalite-fonctions",
  "espace-geometrie",
  "donnees-probabilites",
  "pensee-informatique",
];

test(
  "P3 : le domaine ouvert — sa carte qui referme, les groupes, l’étiquette de classe, le geste retour",
  { skip: ignorer, timeout: 120000 },
  () =>
    banc(async ({ base, page }) => {
      const { GROUPES } = await import("../automatismes/groupes-domaines.js");
      const onglet = await page(1366, 768, false, { niveau: "4e", nombre: 10 });
      await accueil(onglet, base);
      const longueur = await onglet.evaluate(() => history.length);
      await onglet.locator('[data-domaine="nombres-calculs"]').click();
      const tete = onglet.locator(".domaine-ouvert > .domaine-tete");
      assert.equal(await tete.getAttribute("aria-expanded"), "true");
      assert.equal(await tete.getAttribute("aria-label"), "Refermer Nombres et calculs");
      assert.equal(await tete.locator(".icone svg").count(), 1);
      assert.match(await tete.innerText(), /Nombres et calculs\s+0 \/ 28/);
      assert.equal(
        (await onglet.locator(".tout-domaine").innerText()).trim(),
        "Tout sélectionner dans ce domaine",
      );
      assert.equal(await onglet.locator(".barre-cadre").count(), 0, "Pas de barre du cadre");
      assert.deepEqual(
        await onglet.locator(".titre-groupe").allInnerTexts(),
        GROUPES["nombres-calculs"].map(([titre]) => titre.toUpperCase()),
      );
      // Deux colonnes dès 700 px.
      const [une, deux] = await boites(onglet, ".grille-notions .notion");
      assert.ok(Math.abs(une.top - deux.top) < 1 && deux.left > une.right, "Deux colonnes");
      // Cocher : la ligne et le compteur suivent, la liste n'est pas redessinée.
      const ligne = onglet.locator(".grille-notions .notion").first();
      const temoin = await ligne.evaluateHandle((element) => element);
      await ligne.locator("input").check();
      assert.equal(await temoin.evaluate((element) => element.isConnected), true, "Même liste");
      assert.equal(await temoin.evaluate((element) => element.classList.contains("cochee")), true);
      assert.match(await tete.innerText(), /1 \/ 28/);
      assert.match(await tete.getAttribute("class"), /avec-selection/);
      await ligne.locator("input").uncheck();
      assert.equal(await temoin.evaluate((element) => element.classList.contains("cochee")), false);
      // Historique : ouvrir un domaine prend une place ; la carte la rend et ramène à l'accueil.
      assert.equal(await onglet.evaluate(() => history.length), longueur + 1);
      await tete.click();
      assert.equal(await ecran(onglet), "accueil");
      assert.equal(await onglet.evaluate(() => history.state), null);
      // Le geste retour du téléphone referme le domaine : on reste sur /automatismes/.
      const telephone = await page(390, 844, true, { niveau: "4e", nombre: 10 });
      await accueil(telephone, base);
      await telephone.locator('[data-domaine="espace-geometrie"]').click();
      assert.equal(await ecran(telephone), "domaine");
      const [une3, deux3] = await boites(telephone, ".grille-notions .notion");
      assert.ok(deux3.top >= une3.bottom, "Une colonne au téléphone");
      await telephone.goBack();
      await telephone.locator(".accueil").waitFor();
      assert.equal(await ecran(telephone), "accueil");
      assert.match(telephone.url(), /\/automatismes\/$/);
    }),
);

test(
  "P3 : l’étiquette de classe — 19 notions en 5e, 13 en 4e, 12 en 3e, aucune en 6e",
  { skip: ignorer, timeout: 120000 },
  () =>
    banc(async ({ base, page }) => {
      const onglet = await page(1366, 768);
      await accueil(onglet, base);
      for (const [niveau, attendu] of [
        ["6e", 0],
        ["5e", 19],
        ["4e", 13],
        ["3e", 12],
      ]) {
        await onglet.locator(`[data-niveau="${niveau}"]`).click();
        let total = 0;
        for (const domaine of DOMAINES_IDS) {
          await onglet.locator(`[data-domaine="${domaine}"]`).click();
          const etiquettes = await onglet.locator(".notion .badge.classe").allInnerTexts();
          assert.ok(
            etiquettes.every((texte) => texte === niveau),
            `${niveau} : ${etiquettes}`,
          );
          total += etiquettes.length;
          const ids = await onglet
            .locator("[data-selection]")
            .evaluateAll((cases) => cases.map((caseNotion) => caseNotion.dataset.selection));
          assert.equal(new Set(ids).size, ids.length, `${domaine} : chaque notion une fois`);
          await onglet.locator(".domaine-tete").click();
        }
        assert.equal(total, attendu, `${niveau} : ${total} étiquettes`);
        assert.equal(await onglet.locator(".badge.brevet").count(), 0);
      }
    }),
);

const barre = (onglet) =>
  onglet
    .locator(".barre-lancement .resume")
    .evaluate((resume) => resume.innerText.replace(/\s*\n\s*/g, " · "));

test(
  "P4 : la barre toujours en bas — vide, puis la sélection ; 72 px au plus ; en bas d’un domaine court",
  { skip: ignorer, timeout: 120000 },
  () =>
    banc(async ({ base, page }) => {
      for (const [width, height, tactile] of TAILLES.slice(0, 4)) {
        const nom = `${width}x${height}`;
        const onglet = await page(width, height, tactile, { niveau: "4e", nombre: 10 });
        await accueil(onglet, base);
        assert.equal(await barre(onglet), "Aucune notion cochée · Coche des notions");
        assert.equal(await onglet.locator('[data-action="lancer"]').isDisabled(), true);
        assert.equal(await onglet.locator('[data-action="projeter-reglages"]').isDisabled(), true);
        let [boite] = await boites(onglet, ".barre-lancement");
        assert.ok(boite.height <= 72, `${nom} : barre vide de ${boite.height} px`);
        if (width === 1366) {
          const cartes = await boites(onglet, ".domaines .domaine-carte, .ligne-brevet");
          assert.ok(
            cartes.every((carte) => Math.round(carte.width) === 750),
            "1366 : 750 px",
          );
        }
        await onglet.locator('[data-domaine="donnees-probabilites"]').click();
        assert.ok((await boites(onglet, ".barre-lancement"))[0].height <= 72, `${nom} : domaine`);
        await onglet.locator("[data-selection]").nth(0).check();
        await onglet.locator("[data-selection]").nth(1).check();
        assert.equal(await barre(onglet), "2 notions sélectionnées · 4e · 10 questions");
        assert.equal(await onglet.locator('[data-action="lancer"]').isDisabled(), false);
        assert.equal(await onglet.locator('[data-action="lancer"]').innerText(), "Lancer la série");
        // Projeter : tablette et ordinateur seulement.
        assert.equal(
          await onglet.locator('[data-action="projeter-reglages"]').isVisible(),
          width >= 700,
          `${nom} : Projeter`,
        );
        [boite] = await boites(onglet, ".barre-lancement");
        assert.ok(boite.height <= 72, `${nom} : barre de ${boite.height} px`);
        assert.ok(boite.bottom <= height, `${nom} : barre dans l’écran`);
        await onglet.locator(".domaine-tete").click();
        assert.equal(await barre(onglet), "2 notions sélectionnées · 4e · 10 questions");
        await onglet.context().close();
      }
      // Au téléphone, sur un domaine court, la barre reste en bas de l'écran.
      const telephone = await page(390, 844, true);
      await accueil(telephone, base);
      await telephone.locator('[data-domaine="pensee-informatique"]').click();
      const [enBas] = await boites(telephone, ".barre-lancement");
      assert.ok(enBas.bottom >= 830, `Pensée informatique : bas de la barre à ${enBas.bottom}`);
      // Sur tablette, elle suit la liste.
      const tablette = await page(820, 1180, true);
      await accueil(tablette, base);
      await tablette.locator('[data-domaine="pensee-informatique"]').click();
      const [suit] = await boites(tablette, ".barre-lancement");
      const [liste] = await boites(tablette, ".domaine-ouvert");
      assert.ok(suit.top - liste.bottom < 20, "Tablette : la barre suit la liste");
    }),
);

async function cocher(onglet, domaine, rangs) {
  await onglet.locator(`[data-domaine="${domaine}"]`).click();
  for (const rang of rangs) await onglet.locator("[data-selection]").nth(rang).check();
}

test(
  "P5 : Projeter — la fenêtre de réglages, 10 questions, réglages gardés, le lien vers l’autre écran",
  { skip: ignorer, timeout: 120000 },
  () =>
    banc(async ({ base, page }) => {
      const onglet = await page(1366, 768, false, { niveau: "4e", nombre: 15 });
      await accueil(onglet, base);
      await onglet.locator('[data-nombre="10"]').click();
      await cocher(onglet, "donnees-probabilites", [0, 1]);
      await onglet.locator('[data-action="projeter-reglages"]').click();
      const fenetre = onglet.locator("dialog.reglages-dialog[open]");
      await fenetre.waitFor();
      assert.equal(
        await fenetre.locator(".rappel-selection").innerText(),
        "2 notions · 10 questions",
      );
      assert.equal(await fenetre.locator("#nombre").count(), 0, "Le nombre vient de Préparer");
      await fenetre.locator("#secondes").fill("20");
      await fenetre.locator("#correction").selectOption("end");
      // « Ouvrir sur un écran » : le lien du même diaporama, construit dans la page.
      await fenetre.locator('[data-action="partager"]').click();
      const lien = fenetre.locator("#lien-serie a");
      assert.equal(await lien.innerText(), "Ouvrir le diaporama sur un autre écran ↗");
      assert.equal(await lien.getAttribute("target"), "_blank");
      assert.equal(await lien.getAttribute("rel"), "noopener");
      const adresse = new URL(await lien.getAttribute("href"));
      assert.equal(adresse.searchParams.get("mode"), "project");
      assert.equal(adresse.searchParams.get("secondes"), "20");
      assert.equal(adresse.searchParams.get("correction"), "end");
      assert.equal(adresse.searchParams.get("nombre"), "10");
      assert.deepEqual(
        ["delai", "auto", "aide"].map((cle) => adresse.searchParams.get(cle)),
        ["4", "0", "0"],
      );
      // Projeter : un diaporama de 10 questions (le nombre de « Préparer »), minuteur réglé.
      await fenetre.locator('[data-action="projeter"]').click();
      await onglet.locator(".barre-question").waitFor();
      assert.equal(await onglet.locator(".position").innerText(), "1 sur 10");
      assert.equal(await onglet.locator("#temps").innerText(), "0:20");
      assert.equal(await onglet.locator("dialog[open]").count(), 0);
      // « Quitter » ramène au menu, avec la sélection.
      await onglet.locator('.barre-question [data-action="retour"]').click();
      assert.ok(["domaine", "accueil"].includes(await ecran(onglet)));
      assert.equal(await barre(onglet), "2 notions sélectionnées · 4e · 10 questions");
      // Les réglages sont gardés sur l'appareil (pas le nombre de questions).
      const garde = JSON.parse(
        await onglet.evaluate(() => localStorage.getItem("mg-automatismes-projection")),
      );
      assert.deepEqual(garde, {
        secondes: 20,
        delai: 4,
        correction: "end",
        automatique: false,
        aideOffice: false,
      });
      await onglet.reload();
      await cocher(onglet, "donnees-probabilites", [0]);
      await onglet.locator('[data-action="projeter-reglages"]').click();
      assert.equal(await onglet.locator("dialog[open] #secondes").inputValue(), "20");
      assert.equal(await onglet.locator("dialog[open] #correction").inputValue(), "end");
      await onglet.keyboard.press("Escape");
      // Le lien ouvre un DIAPORAMA sur l'autre écran : « ← Quitter », minuteur réglé.
      const ecranDeLaClasse = await page(1280, 720);
      await ecranDeLaClasse.goto(adresse.href);
      await ecranDeLaClasse.locator(".barre-question").waitFor();
      assert.match(await ecranDeLaClasse.locator(".barre-question .menu").innerText(), /Quitter/);
      assert.equal(await ecranDeLaClasse.locator("#temps").innerText(), "0:20");
      assert.equal(await ecranDeLaClasse.locator(".position").innerText(), "1 sur 10");
      // Plus de page Diaporama : ?prof=1 ouvre l'accueil, adresse nettoyée.
      await accueil(onglet, base, "?prof=1");
      assert.equal(await ecran(onglet), "accueil");
      assert.equal(await onglet.evaluate(() => location.search), "");
    }),
);

test(
  "P5 : une valeur abîmée dans le stockage de Projeter redonne le réglage par défaut, sans erreur",
  { skip: ignorer, timeout: 60000 },
  () =>
    banc(async ({ base, page }) => {
      for (const abime of [
        "{",
        '{"secondes":"abc","delai":-5,"correction":"<b>","automatique":"oui","aideOffice":1}',
        '{"secondes":999999,"delai":3.5}',
        "null",
      ]) {
        const onglet = await page(1366, 768);
        await onglet.addInitScript((valeur) => {
          if (!sessionStorage.getItem("abime")) {
            localStorage.setItem("mg-automatismes-projection", valeur);
            sessionStorage.setItem("abime", "1");
          }
        }, abime);
        await accueil(onglet, base);
        await cocher(onglet, "nombres-calculs", [0]);
        await onglet.locator('[data-action="projeter-reglages"]').click();
        const fenetre = onglet.locator("dialog[open]");
        assert.deepEqual(
          [
            await fenetre.locator("#secondes").inputValue(),
            await fenetre.locator("#delai").inputValue(),
            await fenetre.locator("#correction").inputValue(),
            await fenetre.locator("#automatique").isChecked(),
            await fenetre.locator("#aide-office").isChecked(),
          ],
          ["45", "4", "each", false, false],
          abime,
        );
        await onglet.context().close();
      }
    }),
);

test(
  "P6 : téléphone — ni Plein écran ni Projeter ; à 375 × 667, les 5 domaines entiers, le brevet coupé",
  { skip: ignorer, timeout: 90000 },
  () =>
    banc(async ({ base, page }) => {
      for (const [width, height, tactile] of TAILLES.slice(0, 4)) {
        const nom = `${width}x${height}`;
        const onglet = await page(width, height, tactile, { niveau: "4e", nombre: 10 });
        await accueil(onglet, base);
        await cocher(onglet, "nombres-calculs", [0]);
        await onglet.locator(".domaine-tete").click();
        const visibles = await onglet.evaluate(() =>
          [".plein-ecran-cadre", '[data-action="projeter-reglages"]'].map((selecteur) =>
            [...document.querySelectorAll(selecteur)].some((element) => element.offsetParent),
          ),
        );
        assert.deepEqual(visibles, [width >= 700, width >= 700], `${nom} : Plein écran, Projeter`);
        await onglet.context().close();
      }
      const petit = await page(375, 667, true, { niveau: "4e", nombre: 10 });
      await accueil(petit, base);
      const [zone] = await boites(petit, ".contenu");
      const domaines = await boites(petit, ".domaines .domaine-carte");
      const [brevet] = await boites(petit, ".ligne-brevet");
      assert.ok(
        domaines.every((carte) => carte.top >= zone.top && carte.bottom <= zone.bottom),
        "Les cinq domaines entiers",
      );
      assert.ok(
        brevet.top < zone.bottom - 8 && brevet.bottom > zone.bottom,
        `Le brevet commence dans l’écran et continue dessous (${brevet.top}-${brevet.bottom})`,
      );
      assert.ok(
        domaines.every((carte) => Math.round(carte.width) === 333),
        "375 : 333 px",
      );
    }),
);
