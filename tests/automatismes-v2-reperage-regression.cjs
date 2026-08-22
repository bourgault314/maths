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

function urlNotion(notion, graine, questions = 10) {
  const url = new URL(BASE);
  url.searchParams.set("notion", notion);
  url.searchParams.set("questions", String(questions));
  url.searchParams.set("graine", graine);
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
      ".cible-point-repere, .surface-placement-repere, .champ-coordonnee",
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
    if (cible.classe.includes("surface-placement-repere")) {
      assert.ok(cible.largeur >= 180 && cible.hauteur >= 180, `${nomEtat} : surface de placement trop petite`);
    } else {
      assert.ok(cible.largeur >= 44 && cible.hauteur >= 44, `${nomEtat} : cible tactile inférieure à 44px`);
    }
  }
  for (const panneau of mesures.panneaux) {
    assert.ok(panneau.debordement <= 1, `${nomEtat} : panneau débordant horizontalement`);
    assert.ok(panneau.largeur <= mesures.largeurFenetre + 1, `${nomEtat} : panneau plus large que la fenêtre`);
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
  ).filter({ visible: true });
  if (await fermeture.count()) await fermeture.first().click();
}

async function avancerUneQuestion(page) {
  await fermerPanneauOuvert(page);
  const valider = page.locator('[data-action="valider"]');
  if (await valider.count()) await valider.click();
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

async function placerPointCertainementFaux(page) {
  const surface = page.locator(".surface-placement-repere:visible");
  const bornes = await surface.evaluate((element) => ({
    xMin: Number(element.dataset.xMin),
    xMax: Number(element.dataset.xMax),
    yMin: Number(element.dataset.yMin),
    yMax: Number(element.dataset.yMax),
  }));
  const texte = await page.locator(".carte-question-repere h1").innerText();
  const correspondance = texte.match(/\(([−-]?\d+)\s*;\s*([−-]?\d+)\)/);
  assert.ok(correspondance, `coordonnées absentes de la consigne « ${texte} »`);
  const attendu = {
    x: Number(correspondance[1].replace("−", "-")),
    y: Number(correspondance[2].replace("−", "-")),
  };
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
  await page.getByText("Point provisoire", { exact: false }).waitFor();
  return { attendu, choisi };
}

async function auditerViewport(browser, viewport, rapport) {
  const page = await browser.newPage({ viewport });
  const erreursNavigateur = [];
  page.on("pageerror", (erreur) => erreursNavigateur.push(erreur.message));
  page.on("console", (message) => {
    if (message.type() === "error") erreursNavigateur.push(message.text());
  });

  await demarrer(
    page,
    urlNotion("lire-coordonnees-point", "audit-visuel-ge03", 10),
  );
  rapport.etats.push({
    nom: `${viewport.nom}-ge03-question`,
    mesures: await auditerDisposition(page, `${viewport.nom} · GE-03 question`, erreursNavigateur),
    capture: await capturer(page, `${viewport.nom}-ge03-question`),
  });

  await page.locator('[data-action="aide"]').click();
  rapport.etats.push({
    nom: `${viewport.nom}-ge03-aide`,
    mesures: await auditerDisposition(page, `${viewport.nom} · GE-03 aide`, erreursNavigateur),
    capture: await capturer(page, `${viewport.nom}-ge03-aide`),
  });

  await page.locator('.panneau [data-action="cours"]').click();
  rapport.etats.push({
    nom: `${viewport.nom}-cours-1`,
    mesures: await auditerDisposition(page, `${viewport.nom} · cours 1`, erreursNavigateur),
    capture: await capturer(page, `${viewport.nom}-cours-1`),
  });
  if (viewport.width === 320 || viewport.width === 768) {
    await page.locator('[data-action="cours-suivant"]').click();
    rapport.etats.push({
      nom: `${viewport.nom}-cours-2`,
      mesures: await auditerDisposition(page, `${viewport.nom} · cours 2`, erreursNavigateur),
      capture: await capturer(page, `${viewport.nom}-cours-2`),
    });
    await page.locator('[data-action="cours-suivant"]').click();
    rapport.etats.push({
      nom: `${viewport.nom}-cours-3`,
      mesures: await auditerDisposition(page, `${viewport.nom} · cours 3`, erreursNavigateur),
      capture: await capturer(page, `${viewport.nom}-cours-3`),
    });
  }

  await page.goto(urlNotion("placer-point-repere", "audit-visuel-ge04", 10), {
    waitUntil: "networkidle",
  });
  await page.locator('[data-action="demarrer"]').click();
  await page.locator(".surface-placement-repere:visible").waitFor();
  rapport.etats.push({
    nom: `${viewport.nom}-ge04-question`,
    mesures: await auditerDisposition(page, `${viewport.nom} · GE-04 question`, erreursNavigateur),
    capture: await capturer(page, `${viewport.nom}-ge04-question`),
  });
  const placement = await placerPointCertainementFaux(page);
  rapport.etats.push({
    nom: `${viewport.nom}-ge04-provisoire`,
    mesures: await auditerDisposition(page, `${viewport.nom} · GE-04 point provisoire`, erreursNavigateur),
    capture: await capturer(page, `${viewport.nom}-ge04-provisoire`),
  });
  await page.locator('[data-action="valider"]').click();
  await page.locator('[data-action="correction"]').click();
  rapport.etats.push({
    nom: `${viewport.nom}-ge04-correction`,
    mesures: await auditerDisposition(page, `${viewport.nom} · GE-04 correction`, erreursNavigateur),
    capture: await capturer(page, `${viewport.nom}-ge04-correction`),
    placement,
  });

  if (viewport.width === 1366) {
    await demarrer(
      page,
      urlNotion("lire-coordonnees-point", "audit-visuel-ge03", 10),
    );
    await allerQuestion(page, 7);
    assert.ok(await page.locator(".grille-qcm-repere").count(), "la question 7 doit être le QCM diagnostique");
    rapport.etats.push({
      nom: `${viewport.nom}-ge03-qcm`,
      mesures: await auditerDisposition(page, `${viewport.nom} · GE-03 QCM`, erreursNavigateur),
      capture: await capturer(page, `${viewport.nom}-ge03-qcm`),
    });
    await allerQuestion(page, 10);
    assert.equal(await page.locator(".cible-point-repere:visible").count(), 4, "la question 10 doit proposer quatre points");
    rapport.etats.push({
      nom: `${viewport.nom}-ge03-identifier`,
      mesures: await auditerDisposition(page, `${viewport.nom} · GE-03 identification`, erreursNavigateur),
      capture: await capturer(page, `${viewport.nom}-ge03-identifier`),
    });
  }

  await page.close();
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
