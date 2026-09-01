/**
 * Fiches à imprimer du Moulin de Pythagore — génération depuis le plateau.
 *
 * Il n'y a volontairement AUCUNE mise en page dupliquée ici : ce script ouvre
 * le plateau `outils/plateaux_manipulation/moulin_pythagore.html`, clique sur
 * son bouton « Fiche » pour chaque découpage, et enregistre la fenêtre
 * d'impression telle quelle en PDF. Si la consigne, le bilan ou la signature
 * changent dans le plateau, il suffit de relancer ce script : les fiches
 * publiées ne peuvent pas dériver de l'outil.
 *
 * Sorties :
 *   outils/plateaux_manipulation/fiches_moulin/moulin-pythagore-<clé>.pdf
 *   assets/img/thumbnails/pythagore/moulin-fiche-<clé>.png  (+ .webp)
 *   assets/img/thumbnails/pythagore/moulin-fiches-catalogue.png (+ .webp),
 *     la page 1 de la première fiche, pour la carte du catalogue
 *
 * La liste des découpages n'est pas recopiée ici : elle est lue dans le menu
 * déroulant du plateau, donc un douzième découpage ajouté à l'outil sera
 * fabriqué tout seul au prochain passage.
 *
 * Prérequis : npm install playwright && npx playwright install chromium
 * Usage     : node _sources/moulin-pythagore/generer_fiches.mjs
 *
 * Si un Chromium est déjà installé ailleurs sur la machine, on peut l'indiquer
 * par CHROMIUM_EXECUTABLE=/chemin/vers/chrome au lieu de le retélécharger.
 */

import { chromium } from "playwright";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("../../", import.meta.url));
const PORT = 8123;
const PLATEAU = "/outils/plateaux_manipulation/moulin_pythagore.html";
const DOSSIER_PDF = path.join(RACINE, "outils/plateaux_manipulation/fiches_moulin");
const DOSSIER_MINIATURES = path.join(RACINE, "assets/img/thumbnails/pythagore");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".pdf": "application/pdf"
};

// Un serveur local minimal : le plateau doit être servi en http pour que la
// fenêtre d'impression résolve ses images comme sur le site.
function servirLeDepot() {
  const serveur = http.createServer(async (requete, reponse) => {
    const chemin = path.join(RACINE, decodeURIComponent(requete.url.split("?")[0]));
    if (!chemin.startsWith(RACINE)) {
      reponse.writeHead(403);
      reponse.end();
      return;
    }
    try {
      const contenu = await fs.readFile(chemin);
      reponse.writeHead(200, { "content-type": TYPES[path.extname(chemin)] || "application/octet-stream" });
      reponse.end(contenu);
    } catch {
      reponse.writeHead(404);
      reponse.end();
    }
  });
  return new Promise((resoudre) => serveur.listen(PORT, () => resoudre(serveur)));
}

// Réduit un PNG à une largeur donnée, sur fond blanc, dans le navigateur.
async function redimensionner(page, png, largeur) {
  const donnees = await page.evaluate(async ({ base64, largeur }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const hauteur = Math.round((image.naturalHeight / image.naturalWidth) * largeur);
    const toile = document.createElement("canvas");
    toile.width = largeur;
    toile.height = hauteur;
    const contexte = toile.getContext("2d");
    contexte.fillStyle = "#ffffff";
    contexte.fillRect(0, 0, largeur, hauteur);
    contexte.drawImage(image, 0, 0, largeur, hauteur);
    return toile.toDataURL("image/png").split(",")[1];
  }, { base64: png.toString("base64"), largeur });
  return Buffer.from(donnees, "base64");
}

// Chromium sait encoder le WebP dans un canvas : pas d'outil externe à installer.
async function ecrireWebp(page, png, destination) {
  const donnees = await page.evaluate(async ({ base64, qualite }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const toile = document.createElement("canvas");
    toile.width = image.naturalWidth;
    toile.height = image.naturalHeight;
    toile.getContext("2d").drawImage(image, 0, 0);
    return toile.toDataURL("image/webp", qualite).split(",")[1];
  }, { base64: png.toString("base64"), qualite: 0.86 });
  const webp = Buffer.from(donnees, "base64");
  if (webp.length >= png.length) throw new Error(`Le WebP de ${path.basename(destination)} n'allège pas le PNG.`);
  await fs.writeFile(destination, webp);
  return webp.length;
}

const serveur = await servirLeDepot();
await fs.mkdir(DOSSIER_PDF, { recursive: true });
await fs.mkdir(DOSSIER_MINIATURES, { recursive: true });

const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
const base = `http://localhost:${PORT}`;

// Les découpages sont lus dans le plateau lui-même.
const sommaire = await navigateur.newPage();
await sommaire.goto(`${base}${PLATEAU}`);
const decoupages = await sommaire.evaluate(() =>
  [...document.querySelectorAll("#puzzleSelect option")].map((option) => ({
    cle: option.value,
    libelle: option.textContent.trim()
  }))
);
await sommaire.close();
console.log(`${decoupages.length} découpages trouvés dans le plateau.`);

for (const { cle, libelle } of decoupages) {
  const plateau = await navigateur.newPage({ viewport: { width: 1280, height: 820 } });
  await plateau.goto(`${base}${PLATEAU}?puzzle=${encodeURIComponent(cle)}&mode=eleves`);
  await plateau.waitForTimeout(700);

  // Miniature : le plateau tel qu'il s'ouvre, pièces dans a² et b², c² vide,
  // recadré au plus près du dessin pour que la carte ne montre pas du vide.
  const cadre = await plateau.evaluate(() => {
    const dessin = document.getElementById("world").getBoundingClientRect();
    const marge = 14;
    return {
      x: Math.max(0, dessin.x - marge),
      y: Math.max(0, dessin.y - marge),
      width: dessin.width + marge * 2,
      height: dessin.height + marge * 2
    };
  });
  const png = await plateau.screenshot({ clip: cadre, scale: "css" });
  // 720 px de large : la taille des autres miniatures du catalogue.
  const miniature = await redimensionner(plateau, png, 720);
  const cheminPng = path.join(DOSSIER_MINIATURES, `moulin-fiche-${cle}.png`);
  await fs.writeFile(cheminPng, miniature);
  const poidsWebp = await ecrireWebp(plateau, miniature, path.join(DOSSIER_MINIATURES, `moulin-fiche-${cle}.webp`));

  // Fiche : on intercepte la fenêtre d'impression pour récupérer son HTML.
  await plateau.evaluate(() => {
    window.__fiche = null;
    window.open = () => ({
      document: { open() {}, write(html) { window.__fiche = html; }, close() {} },
      focus() {}
    });
  });
  await plateau.click("#enonce");
  await plateau.waitForFunction(() => window.__fiche !== null, null, { timeout: 15000 });
  const html = await plateau.evaluate(() => window.__fiche);
  await plateau.close();

  const fiche = await navigateur.newPage();
  await fiche.setContent(
    html.replace("<head>", `<head><base href="${base}/outils/plateaux_manipulation/">`),
    { waitUntil: "networkidle" }
  );
  const cheminPdf = path.join(DOSSIER_PDF, `moulin-pythagore-${cle}.pdf`);
  await fiche.pdf({
    path: cheminPdf,
    format: "A4",
    landscape: true,
    printBackground: true,
    margin: { top: "7mm", bottom: "7mm", left: "7mm", right: "7mm" }
  });
  // Carte du catalogue : la page 1 de la toute première fiche, pour qu'on voie
  // tout de suite qu'il s'agit d'une feuille à photocopier.
  if (cle === decoupages[0].cle) {
    // En média « print » : la barre « Imprimer » de l'aperçu écran disparaît,
    // la miniature montre exactement ce qui sortira de l'imprimante.
    await fiche.emulateMedia({ media: "print" });
    const capture = await fiche.locator(".page").first().screenshot({ scale: "css" });
    const carte = await redimensionner(fiche, capture, 1404);
    const cheminCarte = path.join(DOSSIER_MINIATURES, "moulin-fiches-catalogue.png");
    await fs.writeFile(cheminCarte, carte);
    await ecrireWebp(fiche, carte, path.join(DOSSIER_MINIATURES, "moulin-fiches-catalogue.webp"));
    console.log(`  miniature du catalogue : ${Math.round(carte.length / 1024)} ko`);
  }

  await fiche.close();

  const poidsPdf = (await fs.stat(cheminPdf)).size;
  console.log(`  ${libelle} → fiche ${Math.round(poidsPdf / 1024)} ko, miniature ${Math.round(miniature.length / 1024)} ko (webp ${Math.round(poidsWebp / 1024)} ko)`);
}

await navigateur.close();
serveur.close();
console.log("Terminé.");
