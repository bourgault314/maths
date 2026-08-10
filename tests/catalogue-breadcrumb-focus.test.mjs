import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalogueScript = await readFile(
  new URL("../assets/js/catalogue-refonte.js", import.meta.url),
  "utf8",
);

test("un retour historique du fil d’Ariane mémorise sa destination", () => {
  assert.match(
    catalogueScript,
    /pendingBreadcrumbFocusLevel\s*=\s*"domain";\s*pendingBreadcrumbFocusCard\s*=\s*state\.notion \|\| state\.collection;\s*history\.back\(\);/s,
    "le retour d’une notion vers son domaine doit mémoriser la carte à refocaliser",
  );
  assert.match(
    catalogueScript,
    /pendingBreadcrumbFocusLevel\s*=\s*"entry";\s*pendingBreadcrumbFocusCard\s*=\s*"";\s*history\.go\(-entryHistoryOffset\);/s,
    "le retour vers l’entrée doit demander le focus du choix des domaines",
  );
});

test("une navigation profonde recadre le haut après la stabilisation du rendu", () => {
  assert.match(
    catalogueScript,
    /function afterLayout\(callback\)\s*\{\s*window\.requestAnimationFrame\(\(\) => window\.requestAnimationFrame\(callback\)\);\s*\}/s,
    "le recadrage doit attendre deux animations pour laisser Safari stabiliser la nouvelle vue",
  );
  assert.match(
    catalogueScript,
    /function moveToTopAndFocus\(\)\s*\{\s*scrollInstantlyTo\(0\);\s*afterLayout\(\(\) => \{[\s\S]*?pageTitle\.focus\(\{ preventScroll: true \}\);\s*scrollInstantlyTo\(0\);\s*\}\);\s*\}/,
    "l’ouverture d’un domaine ou d’une notion doit confirmer le haut en dernier après stabilisation",
  );
});

test("Tous les domaines recadre explicitement Choisissez un domaine", () => {
  assert.match(
    catalogueScript,
    /function entryChooserTop\(\)\s*\{[\s\S]*?title\.getBoundingClientRect\(\)\.top\s*\+\s*window\.scrollY[\s\S]*?\}/,
    "la destination mobile doit être calculée depuis #results-title",
  );
  assert.match(
    catalogueScript,
    /function moveToEntryChooserAndFocus\(\)\s*\{\s*afterLayout\(\(\) => \{\s*const destinationY = entryChooserTop\(\);\s*focusBreadcrumbDestination\("entry"\);\s*scrollInstantlyTo\(destinationY\);\s*rememberCurrentScroll\(\);\s*\}\);\s*\}/s,
    "un retour direct sans entrée historique doit viser le choix des domaines après le rendu",
  );
  assert.match(
    catalogueScript,
    /const destinationY\s*=\s*breadcrumbFocusLevel\s*===\s*"entry"\s*\?\s*entryChooserTop\(\)\s*:\s*scrollY;/s,
    "un clic explicite sur Tous les domaines ne doit pas réutiliser le scroll sauvegardé",
  );
});

test("un popstate ordinaire conserve sa position et le focus ne la modifie pas", () => {
  assert.match(
    catalogueScript,
    /function focusBreadcrumbDestination\(level, cardId = ""\)[\s\S]*?const destination = level === "entry" \? title : \(returnedCard \|\| pageTitle\);[\s\S]*?destination\.focus\(\{ preventScroll: true \}\);/s,
    "le domaine doit focaliser la carte retrouvée plutôt qu’un titre masqué, et l’entrée son titre visible",
  );
  assert.match(
    catalogueScript,
    /window\.addEventListener\("popstate", \(event\) => \{[\s\S]*?const scrollY = Number\.isFinite\(event\.state\?\.scrollY\) \? event\.state\.scrollY : 0;\s*afterLayout\(\(\) => \{\s*const destinationY = breadcrumbFocusLevel === "entry"\s*\? entryChooserTop\(\)\s*:\s*scrollY;\s*focusBreadcrumbDestination\(breadcrumbFocusLevel, breadcrumbFocusCard\);\s*scrollInstantlyTo\(destinationY\);\s*if \(breadcrumbFocusLevel === "entry"\) rememberCurrentScroll\(\);\s*\}\);/,
    "sans clic explicite du fil d’Ariane, popstate doit restaurer event.state.scrollY puis focaliser sans défilement",
  );
});
