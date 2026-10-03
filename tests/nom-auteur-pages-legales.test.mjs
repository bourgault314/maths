import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Décision du 03/10/2026 : le nom de l'auteur n'apparaît plus sur les pages
// du site, sauf sur les trois pages légales (mentions légales, confidentialité,
// licence). Les métadonnées invisibles (<meta name="author">, JSON-LD) restent.
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES_LEGALES = new Set(["mentions-legales.html", "confidentialite.html", "licence.html"]);
const IGNORES = new Set([".git", "node_modules", "tests", "_sources", "_serveur", "docs", "packages"]);

function pagesHtml(dossier, rel = "") {
  const out = [];
  for (const nom of readdirSync(dossier)) {
    if (IGNORES.has(nom)) continue;
    const abs = path.join(dossier, nom);
    const relatif = rel ? `${rel}/${nom}` : nom;
    if (statSync(abs).isDirectory()) out.push(...pagesHtml(abs, relatif));
    else if (nom.endsWith(".html")) out.push(relatif);
  }
  return out;
}

function texteVisible(html) {
  return html
    .replace(/<head[\s\S]*?<\/head>/i, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");
}

test("le nom de l'auteur n'est visible que sur les pages légales", () => {
  const pages = pagesHtml(racine);
  assert.ok(pages.length > 100, "le parcours des pages doit trouver le site");
  const fautifs = pages.filter((rel) => !PAGES_LEGALES.has(rel)
    && /Bourgault/.test(texteVisible(readFileSync(path.join(racine, rel), "utf8"))));
  assert.deepEqual(fautifs, []);
  for (const rel of PAGES_LEGALES) {
    assert.match(texteVisible(readFileSync(path.join(racine, rel), "utf8")), /Gwenaël Bourgault/, rel);
  }
});

test("le gabarit de « Toutes les ressources » ne remet pas le nom dans le pied", () => {
  const gabarit = readFileSync(path.join(racine, "scripts/lib/seo-publication.mjs"), "utf8");
  assert.doesNotMatch(gabarit, /<span>Gwenaël Bourgault<\/span>/);
});

test("« Toutes les ressources » : chaque lien garde son point (pas de « · » en début de ligne)", () => {
  const page = readFileSync(path.join(racine, "outils/toutes-les-ressources.html"), "utf8");
  const pied = page.match(/<footer>([\s\S]*?)<\/footer>/)[1];
  const separateurs = pied.match(/<span aria-hidden="true">·<\/span>/g) || [];
  const groupes = pied.match(/<span class="pied-groupe"><a [^>]+>[^<]+<\/a><span aria-hidden="true">·<\/span><\/span>/g) || [];
  assert.equal(groupes.length, 5);
  assert.equal(separateurs.length, groupes.length, "aucun point hors d'un groupe");
  const css = readFileSync(path.join(racine, "assets/css/annuaire-ressources.css"), "utf8");
  assert.match(css, /\.pied-groupe\s*\{[^}]*white-space:\s*nowrap/);
});
