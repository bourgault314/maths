import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Rubrique « Volumes » et appli « Le volume du pavé droit et du cube » (26/11/2026).

const racine = new URL("../", import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, racine), "utf8");

function chargerCatalogue() {
  const contexte = vm.createContext({ window: {} });
  vm.runInContext(lire("assets/js/catalogue-refonte-data.js"), contexte);
  return contexte.window.MATHSGO_CATALOGUE;
}
const catalogue = chargerCatalogue();
const page = lire("outils/volumes/volume_pave.html");

test("la notion Volumes existe dans Grandeurs et mesures, avec sa description et son icône", () => {
  const notion = catalogue.notions.find((n) => n.id === "volumes");
  assert.ok(notion, "notion volumes absente");
  assert.equal(notion.domain, "proportionnalite-mesures");
  assert.equal(notion.title, "Volumes");
  const script = lire("assets/js/catalogue-refonte.js");
  assert.match(script, /volumes: \{\n\s+description: "[^"]+",\n\s+keywords: "[^"]+",\n\s+icon: "volume"/);
  assert.match(lire("assets/js/mathsgo-icon-library.js"), /\n {6}volume: `<svg /);
  assert.match(lire("outils/bibliotheque-icones.html"), /volume:"Volumes"/);
});

test("l’appli est publiée dans Volumes et s’affiche aussi dans Espace, solides et patrons", () => {
  const chemin = "outils/volumes/volume_pave.html";
  const ressource = catalogue.resources.find((r) => r.path === chemin);
  assert.ok(ressource);
  assert.equal(ressource.status, "published");
  assert.deepEqual(Array.from(ressource.domains), ["proportionnalite-mesures", "geometrie"]);
  const classement = catalogue.resourceClassifications[chemin];
  assert.equal(classement.primaryNotion, "volumes");
  assert.deepEqual(Array.from(classement.alsoInNotions), ["espace-constructions"]);
  const unites = catalogue.resourceClassifications["outils/conversions/conversions_unites_volumes.html"];
  assert.equal(unites.primaryNotion, "conversions", "Unités de volume en 3D reste dans Conversions");
  assert.deepEqual(Array.from(unites.alsoInNotions), ["volumes"]);
});

test("alsoInNotions ajoute une notion sans retirer la notion principale", () => {
  const script = lire("assets/js/catalogue-refonte.js");
  const bloc = script.match(/function resourceBelongsToNotion\(resource, notionId\) \{[\s\S]*?\n {2}\}/);
  assert.ok(bloc);
  const bac = { classifications: {} };
  vm.runInNewContext(`const resourceClassification = (r) => this.classifications[r.path] || {};\n${bloc[0]}\nthis.f = resourceBelongsToNotion;`, bac);
  bac.classifications = {
    a: { primaryNotion: "conversions", alsoInNotions: ["volumes"] },
    b: { primaryNotion: "conversions", alsoInNotions: ["volumes"], hiddenFromNotions: ["volumes"] }
  };
  const a = { path: "a", notions: ["conversions"] };
  assert.equal(bac.f(a, "conversions"), true);
  assert.equal(bac.f(a, "volumes"), true);
  assert.equal(bac.f(a, "angles"), false);
  assert.equal(bac.f({ path: "b", notions: [] }, "volumes"), false, "hiddenFromNotions garde le dernier mot");
});

test("la miniature existe en png et en webp plus légère", () => {
  const png = statSync(new URL("assets/img/thumbnails/volumes/volume-pave.png", racine)).size;
  const webp = statSync(new URL("assets/img/thumbnails/volumes/volume-pave.webp", racine)).size;
  assert.ok(webp < png);
});

test("la page suit les règles des applis : retour déclaré, pas de pied, pas de mention cookies", () => {
  assert.match(page, /data-mathsgo-parent-href="\/outils\/index\.html\?domain=proportionnalite-mesures&amp;notion=volumes"/);
  assert.match(page, /data-mathsgo-parent-link="#retour"/);
  assert.match(page, /<a class="rond" id="retour" href="\.\.\/index\.html\?domain=proportionnalite-mesures&amp;notion=volumes"/);
  assert.match(page, /tool-parent-navigation\.js/);
  assert.doesNotMatch(page, /site-footer|mention-confidentialite|Sans cookie/);
  assert.doesNotMatch(page, /<script[^>]+src="https?:/, "aucun script venu d’un autre site");
});

test("l’œil cache le calcul ; la formule s’écrit L × ℓ × h et c × c × c", () => {
  assert.match(page, /id="btnOeil" aria-pressed="false"/);
  assert.match(page, /\.calcul\.cache \.contenu\{visibility:hidden\}/);
  assert.match(page, /if\(g>0\.12 && e>=3 && !etat\.cache\)/, "les nombres des couches écartées se cachent aussi");
  assert.match(page, /<i>L<\/i><small>longueur<\/small>/);
  assert.match(page, /<i>ℓ<\/i><small>largeur<\/small>/);
  assert.match(page, /<i>h<\/i><small>hauteur<\/small>/);
  assert.match(page, /<i>c<\/i>³/);
});
