const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const BASE = process.env.MATHSGO_URL
  ?? "http://127.0.0.1:4173/automatismes-v2/";
const CAPTURES = path.resolve(
  process.env.MATHSGO_CAPTURES ?? "/tmp/automatismes-v2-ge-reperage",
);

const VIEWPORTS = [
  { nom: "mobile-320x568", width: 320, height: 568 },
  { nom: "mobile-390x844", width: 390, height: 844 },
  { nom: "tablette-768x1024", width: 768, height: 1024 },
  { nom: "ordinateur-1366x768", width: 1366, height: 768 },
  { nom: "tni-1920x1080", width: 1920, height: 1080 },
];

function urlNotion(notion, graine, questions = 10, mode = "entrainement") {
  const url = new URL(BASE);
  url.searchParams.set("notion", notion);
  url.searchParams.set("questions", String(questions));
  url.searchParams.set("graine", graine);
  url.searchParams.set("mode", mode);
  return url.href;
}

async function attendreRendu(page) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function auditerDisposition(page, nomEtat, erreursNavigateur) {
  await attendreRendu(page);
  const mesures = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && rectangle.width > 0
        && rectangle.height > 0;
    };
    const debordements = [...document.querySelectorAll("body *")]
      .filter(visible)
      .map((element) => ({ element, rectangle: element.getBoundingClientRect() }))
      .filter(({ rectangle }) => rectangle.left < -1 || rectangle.right > innerWidth + 1)
      .filter(({ element }) => !element.closest("svg"))
      .slice(0, 10)
      .map(({ element, rectangle }) => ({
        balise: element.tagName.toLowerCase(),
        classe: element.className || "",
        gauche: Math.round(rectangle.left * 10) / 10,
        droite: Math.round(rectangle.right * 10) / 10,
      }));
    const cibles = [...document.querySelectorAll(
      ".cible-point-repere, .surface-placement-repere, .surface-interaction-repere-aide, .cible-axe-repere-aide, .champ-coordonnee",
    )].filter(visible).map((element) => {
      const rectangle = element.getBoundingClientRect();
      return {
        classe: element.className,
        largeur: rectangle.width,
        hauteur: rectangle.height,
      };
    });
    const panneaux = [...document.querySelectorAll(".panneau")]
      .filter(visible)
      .map((panneau) => ({
        debordement: panneau.scrollWidth - panneau.clientWidth,
        largeur: panneau.getBoundingClientRect().width,
      }));
    const reperes = [...document.querySelectorAll(".repere-cartesien-v2")]
      .filter(visible)
      .map((repere) => {
        const rectangle = repere.getBoundingClientRect();
        const svg = [...repere.querySelectorAll("svg")].find(visible);
        const svgRectangle = svg?.getBoundingClientRect();
        return {
          largeur: rectangle.width,
          svgLargeur: svgRectangle?.width ?? 0,
          svgHauteur: svgRectangle?.height ?? 0,
          aria: repere.getAttribute("aria-label") ?? "",
        };
      });
    const cartesQcm = [...document.querySelectorAll(".grille-qcm-repere .choix")]
      .filter(visible)
      .map((carte) => {
        const rectangle = carte.getBoundingClientRect();
        return {
          gauche: rectangle.left,
          haut: rectangle.top,
          largeur: rectangle.width,
          hauteur: rectangle.height,
          debordement: Math.max(0, carte.scrollWidth - carte.clientWidth),
        };
      });
    const valeursDistinctes = (valeurs) => valeurs.reduce((groupes, valeur) => {
      if (!groupes.some((existante) => Math.abs(existante - valeur) <= 2)) groupes.push(valeur);
      return groupes;
    }, []);
    const lettresRognees = [...document.querySelectorAll(".repere-cartesien-v2 svg text")]
      .filter((texte) => /^[A-NP-Z]$/.test(texte.textContent ?? ""))
      .filter(visible)
      .map((texte) => ({ texte, rectangle: texte.getBoundingClientRect(), svg: texte.ownerSVGElement.getBoundingClientRect() }))
      .filter(({ rectangle, svg }) => rectangle.left < svg.left - 1
        || rectangle.right > svg.right + 1
        || rectangle.top < svg.top - 1
        || rectangle.bottom > svg.bottom + 1)
      .map(({ texte }) => texte.textContent);
    const aide = {
      etapes: [...document.querySelectorAll(".etape-progression-aide")].filter(visible).length,
      actifs: [...document.querySelectorAll(".etape-progression-aide.actif")].filter(visible).length,
      terminees: [...document.querySelectorAll(".etape-progression-aide.terminee")].filter(visible).length,
      anciennesNavigations: [...document.querySelectorAll(".navigation-aide-repere")].filter(visible).length,
    };
    return {
      largeurFenetre: innerWidth,
      debordementDocument: Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ) - innerWidth,
      debordements,
      cibles,
      panneaux,
      reperes,
      qcm: {
        cartes: cartesQcm.length,
        lignes: valeursDistinctes(cartesQcm.map(({ haut }) => haut)).length,
        colonnes: valeursDistinctes(cartesQcm.map(({ gauche }) => gauche)).length,
        largeurs: cartesQcm.map(({ largeur }) => largeur),
        hauteurs: cartesQcm.map(({ hauteur }) => hauteur),
        debordements: cartesQcm.map(({ debordement }) => debordement),
      },
      lettresRognees,
      aide,
    };
  });

  assert.ok(
    mesures.debordementDocument <= 1,
    `${nomEtat} : débordement horizontal du document de ${mesures.debordementDocument}px`,
  );
  assert.deepEqual(mesures.debordements, [], `${nomEtat} : éléments hors fenêtre`);
  assert.ok(mesures.reperes.length > 0, `${nomEtat} : aucun repère visible`);
  for (const repere of mesures.reperes) {
    assert.ok(repere.largeur >= 278, `${nomEtat} : repère trop étroit (${repere.largeur}px)`);
    assert.ok(repere.svgLargeur > 0 && repere.svgHauteur > 0, `${nomEtat} : SVG sans taille`);
    assert.ok(repere.aria.length > 0, `${nomEtat} : repère sans nom accessible`);
  }
  for (const cible of mesures.cibles) {
    if (cible.classe.includes("surface-placement-repere") || cible.classe.includes("surface-interaction-repere-aide")) {
      assert.ok(cible.largeur >= 180 && cible.hauteur >= 180, `${nomEtat} : surface de placement trop petite`);
    } else {
      assert.ok(cible.largeur >= 44 && cible.hauteur >= 44, `${nomEtat} : cible tactile inférieure à 44px`);
    }
  }
  for (const panneau of mesures.panneaux) {
    assert.ok(panneau.debordement <= 1, `${nomEtat} : panneau débordant horizontalement`);
    assert.ok(panneau.largeur <= mesures.largeurFenetre + 1, `${nomEtat} : panneau plus large que la fenêtre`);
  }
  if (mesures.qcm.cartes === 4) {
    assert.equal(mesures.qcm.lignes, 2, `${nomEtat} : le QCM doit avoir deux lignes`);
    assert.equal(mesures.qcm.colonnes, 2, `${nomEtat} : le QCM doit avoir deux colonnes`);
    assert.ok(Math.max(...mesures.qcm.largeurs) - Math.min(...mesures.qcm.largeurs) <= 2, `${nomEtat} : largeurs QCM inégales`);
    assert.ok(Math.max(...mesures.qcm.hauteurs) - Math.min(...mesures.qcm.hauteurs) <= 2, `${nomEtat} : hauteurs QCM inégales`);
    assert.ok(mesures.qcm.debordements.every((valeur) => valeur <= 1), `${nomEtat} : couple QCM débordant`);
  }
  assert.deepEqual(mesures.lettresRognees, [], `${nomEtat} : lettre de point rognée`);
  assert.equal(mesures.aide.anciennesNavigations, 0, `${nomEtat} : ancienne navigation d'aide encore visible`);
  if (mesures.aide.etapes > 0 && mesures.aide.terminees < mesures.aide.etapes) {
    assert.equal(mesures.aide.actifs, 1, `${nomEtat} : une seule étape d'aide doit être active`);
  }
  assert.deepEqual(erreursNavigateur, [], `${nomEtat} : erreur dans le navigateur`);
  return mesures;
}

async function capturer(page, nom) {
  const fichier = path.join(CAPTURES, `${nom}.png`);
  await attendreRendu(page);
  await page.screenshot({ path: fichier, fullPage: false });
  return fichier;
}

async function demarrer(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator('[data-action="demarrer"]').click();
  await page.locator(".carte-question-repere").waitFor();
  await attendreRendu(page);
}

async function fermerPanneauOuvert(page) {
  const fermeture = page.locator(
    '[data-action="fermer-aide"], [data-action="fermer-correction"], [data-action="fermer-cours"]',
  );
  for (let index = 0; index < await fermeture.count(); index += 1) {
    if (await fermeture.nth(index).isVisible()) {
      await fermeture.nth(index).click();
      return;
    }
  }
}

async function avancerUneQuestion(page) {
  await fermerPanneauOuvert(page);
  const valider = page.locator('[data-action="valider"]');
  const reponse = page.locator('[data-action="reponse"]');
  if (await valider.count() && await valider.first().isVisible()) await valider.first().click();
  else if (await reponse.count() && await reponse.first().isVisible()) await reponse.first().click();
  await fermerPanneauOuvert(page);
  await page.locator('[data-action="suivant"]').click();
  await page.locator(".carte-question-repere").waitFor();
}

async function allerQuestion(page, numero) {
  for (let courante = 1; courante < numero; courante += 1) {
    await avancerUneQuestion(page);
  }
  await attendreRendu(page);
}

async function lireCibleEtBornesRepere(page, selecteurSurface) {
  const surface = page.locator(`${selecteurSurface}:visible`);
  const bornes = await surface.evaluate((element) => ({
    xMin: Number(element.dataset.xMin),
    xMax: Number(element.dataset.xMax),
    yMin: Number(element.dataset.yMin),
    yMax: Number(element.dataset.yMax),
    pas: Number(element.dataset.pas) || 1,
  }));
  const texte = await page.locator(".carte-question-repere h1").innerText();
  const correspondance = texte.match(/\(([−-]?\d+(?:[,.]\d+)?)\s*;\s*([−-]?\d+(?:[,.]\d+)?)\)/);
  assert.ok(correspondance, `coordonnées absentes de la consigne « ${texte} »`);
  return {
    surface,
    bornes,
    attendu: {
      x: Number(correspondance[1].replace("−", "-").replace(",", ".")),
      y: Number(correspondance[2].replace("−", "-").replace(",", ".")),
    },
  };
}

async function cliquerCoordonneeAide(page, x, y) {
  const { surface, bornes } = await lireCibleEtBornesRepere(
    page,
    ".panneau .surface-interaction-repere-aide",
  );
  await surface.scrollIntoViewIfNeeded();
  const rectangle = await surface.boundingBox();
  assert.ok(rectangle, "surface d'aide invisible");
  const proportionX = (x - bornes.xMin) / (bornes.xMax - bornes.xMin);
  const proportionY = 1 - (y - bornes.yMin) / (bornes.yMax - bornes.yMin);
  await page.mouse.click(
    rectangle.x + proportionX * rectangle.width,
    rectangle.y + proportionY * rectangle.height,
  );
  await attendreRendu(page);
}

function autreGraduation(valeur, minimum, maximum, pas) {
  return valeur + pas <= maximum ? valeur + pas : Math.max(minimum, valeur - pas);
}

async function placerPointCertainementFaux(page) {
  const { surface, bornes, attendu } = await lireCibleEtBornesRepere(
    page,
    ".surface-placement-repere",
  );
  let choisi = { x: bornes.xMin, y: bornes.yMin };
  if (choisi.x === attendu.x && choisi.y === attendu.y) {
    choisi = { x: bornes.xMax, y: bornes.yMax };
  }
  const rectangle = await surface.boundingBox();
  assert.ok(rectangle, "surface de placement invisible");
  const proportionX = (choisi.x - bornes.xMin) / (bornes.xMax - bornes.xMin);
  const proportionY = 1 - (choisi.y - bornes.yMin) / (bornes.yMax - bornes.yMin);
  await page.mouse.click(
    rectangle.x + proportionX * rectangle.width,
    rectangle.y + proportionY * rectangle.height,
  );
  await page.getByText("Point placé — tu peux le déplacer avant de valider.", { exact: true }).waitFor();
  assert.equal(
    await page.locator(".surface-placement-repere:visible").evaluate(
      (element) => element.matches(":focus-visible"),
    ),
    false,
    "un clic souris ne doit pas laisser le halo réservé au clavier",
  );
  return { attendu, choisi };
}

async function enregistrerEtat(page, rapport, nom, erreursNavigateur, supplement = {}) {
  const libelle = nom.replaceAll("-", " · ");
  const etat = {
    nom,
    mesures: await auditerDisposition(page, libelle, erreursNavigateur),
    capture: await capturer(page, nom),
    ...supplement,
  };
  rapport.etats.push(etat);
  return etat;
}

async function auditerViewport(browser, viewport, rapport) {
  const contexte = await browser.newContext({ viewport });
  const page = await contexte.newPage();
  const erreursNavigateur = [];
  page.on("pageerror", (erreur) => erreursNavigateur.push(erreur.message));
  page.on("console", (message) => {
    if (message.type() === "error") erreursNavigateur.push(message.text());
  });

  await demarrer(
    page,
    urlNotion("lire-coordonnees-point", "recette-ge03-11", 20),
  );
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-couple-origine`, erreursNavigateur);

  await page.locator('[data-action="aide"]').click();
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-aide-1-choisir-abscisses`, erreursNavigateur);
  await page.locator('.panneau [data-action="repere-aide-axe"][data-axe="ordonnees"]:visible').click();
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-aide-1-mauvais-axe`, erreursNavigateur);
  await page.locator('.panneau [data-action="repere-aide-axe"][data-axe="abscisses"]:visible').click();
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-aide-2-projection-abscisse`, erreursNavigateur);
  await page.locator('.panneau [data-action="repere-aide-axe"][data-axe="ordonnees"]:visible').click();
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-aide-3-ecriture`, erreursNavigateur);

  await page.locator('.panneau [data-action="cours"]').click();
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge-cours-vocabulaire`, erreursNavigateur);
  if ([320, 768, 1366].includes(viewport.width)) {
    await page.locator('[data-action="cours-suivant"]').click();
    await page.locator('[data-action="cours-repere-etape"][data-value="2"]').click();
    await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-cours-methode`, erreursNavigateur);
    await page.locator('[data-action="cours-suivant"]').click();
    await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-cours-coordonnees-nulles`, erreursNavigateur);
  }
  await fermerPanneauOuvert(page);
  await fermerPanneauOuvert(page);

  await demarrer(page, urlNotion("lire-coordonnees-point", "recette-ge03-11", 20));
  await allerQuestion(page, 18);
  assert.equal(await page.locator(".grille-qcm-repere .choix").count(), 4, "la question 18 doit être le QCM au pas 0,25");
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-qcm-decimal`, erreursNavigateur);
  await page.locator('[data-action="valider"]').click();
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-qcm-omission`, erreursNavigateur);
  await page.locator('[data-action="correction"]').click();
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-qcm-correction`, erreursNavigateur);

  await demarrer(page, urlNotion("placer-point-repere", "recette-ge04-8", 20));
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-decimal`, erreursNavigateur);
  await page.locator('[data-action="aide"]').click();
  const aidePlacement = await lireCibleEtBornesRepere(
    page,
    ".panneau .surface-interaction-repere-aide",
  );
  const { attendu, bornes } = aidePlacement;
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-aide-1-abscisse`, erreursNavigateur);
  const ordonneeMauvaisAxe = bornes.yMax === 0 ? bornes.yMin : bornes.yMax;
  await cliquerCoordonneeAide(page, 0, ordonneeMauvaisAxe);
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-aide-1-mauvais-axe`, erreursNavigateur);
  await cliquerCoordonneeAide(
    page,
    autreGraduation(attendu.x, bornes.xMin, bornes.xMax, bornes.pas),
    0,
  );
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-aide-1-mauvaise-graduation`, erreursNavigateur);
  await cliquerCoordonneeAide(page, attendu.x, 0);
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-aide-2-ordonnee`, erreursNavigateur);
  await cliquerCoordonneeAide(
    page,
    bornes.xMin === 0 ? bornes.xMax : bornes.xMin,
    0,
  );
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-aide-2-mauvais-axe`, erreursNavigateur);
  await cliquerCoordonneeAide(
    page,
    0,
    autreGraduation(attendu.y, bornes.yMin, bornes.yMax, bornes.pas),
  );
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-aide-2-mauvaise-graduation`, erreursNavigateur);
  await cliquerCoordonneeAide(page, 0, attendu.y);
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-aide-3-guides`, erreursNavigateur);
  await cliquerCoordonneeAide(
    page,
    autreGraduation(attendu.x, bornes.xMin, bornes.xMax, bornes.pas),
    attendu.y,
  );
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-aide-3-mauvaise-intersection`, erreursNavigateur);
  await cliquerCoordonneeAide(page, attendu.x, attendu.y);
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-aide-terminee`, erreursNavigateur);
  if ([320, 1366].includes(viewport.width)) {
    await page.locator('.panneau [data-action="cours"]').click();
    await page.locator('[data-action="cours-suivant"]').click();
    await page.locator('[data-action="cours-repere-etape"][data-value="3"]').click();
    await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-cours-methode`, erreursNavigateur);
  }
  await fermerPanneauOuvert(page);
  await fermerPanneauOuvert(page);
  await page.locator('[data-action="valider"]').click();
  await page.locator('[data-action="correction"]').click();
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-correction-juste`, erreursNavigateur);

  await demarrer(page, urlNotion("placer-point-repere", "recette-ge04-8", 20));
  await allerQuestion(page, 17);
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-coin-extreme`, erreursNavigateur);
  const placement = await placerPointCertainementFaux(page);
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-coin-provisoire`, erreursNavigateur, { placement });
  await page.locator('[data-action="valider"]').click();
  await page.locator('[data-action="correction"]').click();
  await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-coin-correction`, erreursNavigateur, { placement });

  if (viewport.width === 1366) {
    const casLecture = [
      [2, "x-indexe-pas-05"],
      [3, "coin"],
      [4, "ordonnee-seule"],
      [6, "identifier"],
      [7, "axe-x"],
      [11, "axe-y"],
    ];
    for (const [numero, nom] of casLecture) {
      await demarrer(page, urlNotion("lire-coordonnees-point", "recette-ge03-11", 20));
      await allerQuestion(page, numero);
      await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-${nom}`, erreursNavigateur);
    }
    await demarrer(page, urlNotion("lire-coordonnees-point", "app-notation-3", 1));
    assert.match(await page.locator(".libelle-saisie-droite").innerText(), /^yF\s*=$/);
    await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-y-indexe`, erreursNavigateur);
    const casPlacement = [
      [3, "negatif"],
      [5, "axe-x-extreme"],
      [6, "origine"],
      [8, "axe-y"],
      [12, "coin-haut"],
      [18, "pas-025"],
      [19, "coin-bas"],
    ];
    for (const [numero, nom] of casPlacement) {
      await demarrer(page, urlNotion("placer-point-repere", "recette-ge04-8", 20));
      await allerQuestion(page, numero);
      await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-${nom}`, erreursNavigateur);
    }

    await demarrer(page, urlNotion("lire-coordonnees-point", "recette-ge03-11", 20, "tableau"));
    await allerQuestion(page, 18);
    await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-tableau-qcm`, erreursNavigateur);
    await page.locator('[data-action="reponse"]').click();
    await enregistrerEtat(page, rapport, `${viewport.nom}-ge03-tableau-reponse`, erreursNavigateur);

    await demarrer(page, urlNotion("placer-point-repere", "recette-ge04-8", 20, "tableau"));
    await allerQuestion(page, 18);
    await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-tableau-decimal`, erreursNavigateur);
    await page.locator('[data-action="reponse"]').click();
    await enregistrerEtat(page, rapport, `${viewport.nom}-ge04-tableau-reponse`, erreursNavigateur);
  }

  await contexte.close();
}

async function principal() {
  fs.mkdirSync(CAPTURES, { recursive: true });
  const navigateur = await chromium.launch({
    headless: true,
    executablePath: chromium.executablePath(),
  });
  const rapport = {
    base: BASE,
    captures: CAPTURES,
    viewports: VIEWPORTS,
    etats: [],
  };
  try {
    for (const viewport of VIEWPORTS) {
      await auditerViewport(navigateur, viewport, rapport);
    }
  } finally {
    await navigateur.close();
  }
  const fichierRapport = path.join(CAPTURES, "rapport.json");
  fs.writeFileSync(fichierRapport, `${JSON.stringify(rapport, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    etats: rapport.etats.length,
    captures: rapport.etats.length,
    dossier: CAPTURES,
    rapport: fichierRapport,
  }, null, 2));
}

principal().catch((erreur) => {
  console.error(erreur.stack || erreur);
  process.exitCode = 1;
});
