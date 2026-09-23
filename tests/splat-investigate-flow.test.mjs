import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `la fonction ${name} doit exister`);
  const end = html.indexOf(`function ${nextName}(`, start + 1);
  assert.notEqual(end, -1, `la fonction ${nextName} doit suivre ${name}`);
  return html.slice(start, end);
}

test("le menu garde un seul parcours C et les anciens liens CD ouvrent C", () => {
  assert.match(html, /<option value="C">C — Enquête/);
  assert.doesNotMatch(html, /<option value="CD">/);

  const normalizeSource = functionSource("normalizeLegacyInvestigateMode", "appliquerConfiguration");
  const normalizeLegacyInvestigateMode = Function(`return (${normalizeSource})`)();

  const legacy = new URLSearchParams("mode=CD&seed=42&cards=8");
  const normalized = normalizeLegacyInvestigateMode(legacy);
  assert.equal(normalized.get("mode"), "C");
  assert.equal(normalized.get("seed"), "42");
  assert.equal(normalized.get("cards"), "8");
  assert.equal(legacy.get("mode"), "CD");

  const current = new URLSearchParams("mode=C&seed=42");
  assert.equal(normalizeLegacyInvestigateMode(current), current);

  const applySource = functionSource("appliquerConfiguration", "addShareControl");
  assert.match(applySource, /params = normalizeLegacyInvestigateMode\(params\)/);
});

test("C Enquête et l'ancien C direct produisent les mêmes cartes avant affichage", () => {
  const generateSource = functionSource("generate", "genererSerieComposee");
  assert.match(
    generateSource,
    /else if\(act==="C"\)\{\s*c = genInvestigate\(rng\);\s*\}else if\(act==="CD"\)\{\s*c = genInvestigate\(rng\);/
  );

  const positionSource = functionSource("assignPositions", "genInvestigate");
  assert.doesNotMatch(positionSource, /_directSubstitution/);
  assert.match(positionSource, /card\.family === "C"/);
});

test("les schémas de situation utilisent des splats pour les couleurs", () => {
  const situationSource = functionSource("drawRelationSituationSchema", "drawRelationOwnerBrace");
  assert.match(situationSource, /d:blobPath\(pastX, y\+rowH\/2, f\(13\)\)/);
  // paysage (écran d'ordinateur, impression) : la pastille reste à boxX + 30, le nom à boxX + 54
  assert.match(situationSource, /const pastX = teteSit \? boxX \+ 18 \+ f\(13\) : boxX \+ 30;/);
  assert.match(situationSource, /const nomX = teteSit \? boxX \+ 18 \+ 2 \* f\(13\) \+ 10 : boxX \+ 54;/);
  assert.match(situationSource, /fill:taskSplatColor\(i, card\)/);
  assert.equal((situationSource.match(/el\("circle"/g) || []).length, 1, "seule la ligne visibles garde sa pastille");
});

test("le schéma regroupé remplace les noms de couleurs par leurs splats", () => {
  const groupsSource = functionSource("getRelationGroupedDisplayGroups", "relationPartNumberValue");
  assert.match(groupsSource, /splatIndex:i/);
  assert.match(groupsSource, /label: "visibles",\s*splatIndex:null/);

  const braceSource = functionSource("drawRelationOwnerBrace", "getRelationGroupedDisplayGroups");
  assert.match(braceSource, /ownerSplatColor/);
  assert.match(braceSource, /d:blobPath\(mid, y\+v\(33\), f\(15\)\)/);
  assert.match(braceSource, /"aria-label":label/);

  const groupedSource = functionSource("drawRelationGroupedSchema", "drawBarModelPartsInGroup");
  assert.match(groupedSource, /ownerSplatColor:taskSplatColor\(span\.splatIndex, card\)/);
});

test("l'équation du schéma regroupé suit le tableau et condense les x par tache", () => {
  const equationSource = functionSource("relationGroupedEquationLine", "relationPartNumberValue");
  const relationGroupedEquationLine = Function(
    "getRelationGroupedDisplayGroups",
    "getNumberedDisplayVarChar",
    "formatCoeffUnknownTerm",
    "relationPartNumberValue",
    "formatRelationNumber",
    `return (${equationSource})`
  )(
    () => { throw new Error("le groupe est fourni par le test"); },
    () => "x",
    (coefficient, variable) => coefficient === 1 ? variable : `${coefficient}${variable}`,
    part => Number(part.value ?? part.label),
    value => String(value)
  );

  const grouped = {
    totals:{trueTotal:44},
    groups:[
      {parts:[{kind:"x", coef:1}, {kind:"diff", value:20}]},
      {parts:[{kind:"x", coef:1}]},
      {parts:[{kind:"visible", value:10}]}
    ]
  };
  assert.deepEqual(relationGroupedEquationLine({}, grouped), {left:"x + 20 + x + 10", right:"44"});

  const extreme = {
    totals:{trueTotal:200},
    groups:[
      {parts:Array.from({length:8}, () => ({kind:"x", coef:1}))},
      {parts:[{kind:"x", coef:16}, {kind:"diff", value:20}]},
      {parts:[{kind:"visible", value:30}]}
    ]
  };
  assert.deepEqual(relationGroupedEquationLine({}, extreme), {left:"8x + 16x + 20 + 30", right:"200"});

  const groupedSource = functionSource("drawRelationGroupedSchema", "drawBarModelPartsInGroup");
  assert.match(groupedSource, /const groupedEquation = relationGroupedEquationLine\(card, grouped\)/);
  assert.match(groupedSource, /const fitLines = solved \? plan\.lines : \[groupedEquation\]/);
  assert.match(groupedSource, /const fitOps = solved \? plan\.ops : \[\]/);
});

test("la correction C compte quatre blocs : le cadre « Reformulation » ou « Tache de référence » (toujours dessiné), puis les trois schémas", () => {
  const printSource = functionSource("renderCardIntoSvg", "printSheet");
  const normalCorrection = printSource.match(/if\(card\._directSubstitution\)\{[\s\S]*?\}else\{([\s\S]*?)\n    \}/);
  assert.ok(normalCorrection, "la branche de correction C doit exister");
  const blocks = normalCorrection[1].match(/placeStep\(/g) || [];
  // lot E1 (22/09/2026) : un quatrième placeStep, le cadre « Reformulation », sous condition
  assert.equal(blocks.length, 4);
  assert.match(normalCorrection[1], /if\(reformulation\)\{\s*placeStep\(layer => drawRelationReformulationBox/);
  assert.match(normalCorrection[1], /drawRelationSituationSchema/);
  assert.match(normalCorrection[1], /drawRelationGroupedSchema/);
  assert.match(normalCorrection[1], /drawRelationOrderedSchema/);
});
