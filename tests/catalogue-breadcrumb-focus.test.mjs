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
    /pendingBreadcrumbFocusLevel\s*=\s*"domain";\s*history\.back\(\);/s,
    "le retour d’une notion vers son domaine doit demander le focus du domaine",
  );
  assert.match(
    catalogueScript,
    /pendingBreadcrumbFocusLevel\s*=\s*"entry";\s*history\.go\(-entryHistoryOffset\);/s,
    "le retour vers l’entrée doit demander le focus du choix des domaines",
  );
});

test("le focus du fil d’Ariane ne modifie pas la position restaurée", () => {
  assert.match(
    catalogueScript,
    /function focusBreadcrumbDestination\(level\)\s*\{\s*if \(!level \|\| level !== viewLevel\(\)\) return;\s*title\.tabIndex = -1;\s*title\.focus\(\{ preventScroll: true \}\);\s*\}/s,
    "seule la destination attendue doit recevoir un focus sans défilement",
  );
  assert.match(
    catalogueScript,
    /window\.addEventListener\("popstate", \(event\) => \{\s*const breadcrumbFocusLevel = pendingBreadcrumbFocusLevel;\s*pendingBreadcrumbFocusLevel = "";[\s\S]*?window\.scrollTo\(\{ top: scrollY, behavior: "auto" \}\);\s*focusBreadcrumbDestination\(breadcrumbFocusLevel\);/,
    "la restauration existante doit rester prioritaire, puis le focus doit conserver cette position",
  );
});

