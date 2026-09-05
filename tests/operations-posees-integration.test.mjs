import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const readText = (path) => readFileSync(new URL(path, root), "utf8");
const catalogueSource = readText("assets/js/catalogue-refonte-data.js");
const catalogueUi = readText("assets/js/catalogue-refonte.js");
const additionEntry = readText("outils/addition-posee/index.html");
const divisionEntry = readText("outils/division-posee/index.html");
const additionTeacher = readText("outils/addition-posee/addition-posee.html");
const additionStudent = readText("outils/addition-posee/addition-posee-interactive.html");
const generator = readText("outils/addition-posee/_generer_gabarit.py");

const context = vm.createContext({ window: {} });
vm.runInContext(catalogueSource, context);
const catalogue = context.window.MATHSGO_CATALOGUE;

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test("Calculs posés expose exactement une entrée Addition et une entrée Division", () => {
  const operations = Array.from(catalogue.collections || []).filter((entry) => (
    entry.presentation === "operation" && (entry.notions || []).includes("calculs-poses")
  ));
  assert.deepEqual(operations.map(({ id, title }) => ({ id, title })), [
    { id: "addition-posee", title: "Addition posée" },
    { id: "division-posee", title: "Division posée" }
  ]);
  for (const operation of operations) {
    assert.equal(operation.navigation, "hub");
    assert.equal(operation.collapseInNotion, true);
    assert.ok(existsSync(new URL(`outils/${operation.hub}`, root)));
  }
});

test("les opérations n’affichent ni badge ni formulation de collection", () => {
  for (const page of [additionEntry, divisionEntry]) {
    assert.doesNotMatch(page, /collection/i);
    assert.match(page, /Choisissez l’outil adapté/);
  }
  assert.match(catalogueUi, /function isOperationEntry\(collection\)/);
  assert.match(catalogueUi, /operationEntry \? "" : `<span class="collection-label">Collection<\/span>`/);
  assert.match(catalogueUi, /onlyOperationEntries \? "Choisir une opération"/);
  assert.match(catalogueUi, /operation-entry-card/);
  assert.match(catalogueUi, /splat:[\s\S]*?description:/);
  assert.doesNotMatch(
    catalogueUi.match(/"addition-posee": \{[\s\S]*?\n    \},/)?.[0] || "",
    /collection/i
  );
  assert.doesNotMatch(
    catalogueUi.match(/"division-posee": \{[\s\S]*?\n    \},/)?.[0] || "",
    /collection/i
  );
});

test("la page Addition posée relie les trois usages et conserve les URL directes", () => {
  assert.match(additionEntry, /<h1[^>]*>Addition posée<\/h1>/);
  assert.match(additionEntry, /Comprendre et projeter/);
  assert.match(additionEntry, /S’entraîner/);
  assert.match(additionEntry, /Imprimer et plastifier/);
  assert.match(additionEntry, /href="addition-posee\.html"/);
  assert.match(additionEntry, /href="addition-posee-interactive\.html"/);
  assert.match(additionEntry, /href="gabarit-addition-entiere\.pdf"/);
  assert.match(additionEntry, /href="gabarit-addition-decimale\.pdf"/);
  assert.match(additionTeacher, /href="\.\/">← Addition posée<\/a>/);
  assert.match(additionStudent, /href="\.\/">← Addition posée<\/a>/);
  assert.match(additionTeacher, /href="gabarit-addition-entiere\.pdf"[^>]*id="pdf-link"/);
  assert.doesNotMatch(additionTeacher, /data-mode="(?:integer|decimal)"/);
  assert.doesNotMatch(additionStudent, /data-mode="(?:integer|decimal)"/);
});

test("les quatre ressources d’addition utilisent la même entrée technique", () => {
  const paths = [
    "outils/addition-posee/addition-posee.html",
    "outils/addition-posee/addition-posee-interactive.html",
    "outils/addition-posee/gabarit-addition-entiere.pdf",
    "outils/addition-posee/gabarit-addition-decimale.pdf"
  ];
  for (const path of paths) {
    const resource = catalogue.resources.find((candidate) => candidate.path === path);
    const classification = catalogue.resourceClassifications[path];
    assert.equal(resource?.status, "published", path);
    assert.deepEqual(Array.from(classification?.collections || []), ["addition-posee"], path);
    assert.equal(classification?.primaryNotion, "calculs-poses", path);
  }
  assert.equal(catalogue.resourceClassifications[paths[0]].primaryGroup, "manipuler");
  assert.equal(catalogue.resourceClassifications[paths[1]].primaryGroup, "entrainer");
  assert.equal(catalogue.resourceClassifications[paths[2]].primaryGroup, "imprimer");
  assert.equal(catalogue.resourceClassifications[paths[3]].primaryGroup, "imprimer");
  assert.equal(
    catalogue.resources.find(({ path }) => path === "outils/addition-posee/gabarit-addition-posee.pdf")?.status,
    "hidden"
  );
});

test("les miniatures d’addition sont distinctes, accessibles et au format 640 × 400", () => {
  const teacher = readText("assets/img/thumbnails/numeration/addition-posee.svg");
  const student = readText("assets/img/thumbnails/numeration/addition-posee-interactive.svg");
  for (const svg of [teacher, student]) {
    assert.match(svg, /viewBox="0 0 640 400"/);
    assert.match(svg, /role="img" aria-labelledby="title desc"/);
    assert.match(svg, /<title id="title">[^<]+<\/title>/);
    assert.match(svg, /<desc id="desc">[^<]+<\/desc>/);
  }
  assert.match(student, /cases distinctes/i);
  for (const name of ["gabarit-addition-entiere", "gabarit-addition-decimale"]) {
    const templatePng = readFileSync(new URL(`assets/img/thumbnails/numeration/${name}.png`, root));
    const templateWebp = readFileSync(new URL(`assets/img/thumbnails/numeration/${name}.webp`, root));
    assert.deepEqual(pngDimensions(templatePng), { width: 640, height: 400 });
    assert.equal(templateWebp.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(templateWebp.subarray(8, 12).toString("ascii"), "WEBP");
    assert.ok(templateWebp.length < templatePng.length);
  }
});

test("les gabarits entier et décimal sont séparés, vierges et régénérables", () => {
  const integerPdf = readFileSync(new URL("outils/addition-posee/gabarit-addition-entiere.pdf", root));
  const decimalPdf = readFileSync(new URL("outils/addition-posee/gabarit-addition-decimale.pdf", root));
  const legacyPdf = readFileSync(new URL("outils/addition-posee/gabarit-addition-posee.pdf", root));
  for (const pdf of [integerPdf, decimalPdf]) {
    const pdfSource = pdf.toString("latin1");
    assert.equal(pdf.subarray(0, 5).toString("ascii"), "%PDF-");
    assert.match(pdfSource, /\/MediaBox\s*\[\s*0\s+0\s+841\.8898\s+595\.2756\s*\]/);
  }
  assert.deepEqual(legacyPdf, decimalPdf, "L’ancienne URL doit rester une copie exacte du gabarit décimal.");
  assert.match(generator, /PAGE_WIDTH, PAGE_HEIGHT = landscape\(A4\)/);
  assert.match(generator, /INTEGER_ONLY_MARKERS = \["cM", "dM", "uM", "cm", "dm", "um", "c", "d", "u"\]/);
  assert.match(generator, /DECIMAL_INTEGER_MARKERS = \["dM", "uM", "cm", "dm", "um", "c", "d", "u"\]/);
  assert.match(generator, /DECIMAL_MARKERS = \["d", "c", "m", "dm", "cm", "mi"\]/);
  assert.match(generator, /gabarit-addition-entiere\.pdf/);
  assert.match(generator, /gabarit-addition-decimale\.pdf/);
  assert.match(generator, /copyfile\(decimal_output, LEGACY_OUTPUT\)/);
  assert.match(generator, /row_label\(c, "retenues"/);
  assert.match(generator, /row_label\(c, "premier terme"/);
  assert.match(generator, /row_label\(c, "second terme"/);
  assert.match(generator, /row_label\(c, "somme"/);
  assert.match(generator, /text\(c, "\+"/);
  assert.doesNotMatch(generator, /584|279|exemple|leçon/i);
});
