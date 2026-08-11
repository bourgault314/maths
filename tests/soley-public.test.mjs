import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const gamePath = new URL("outils/club_maths/soley.html", root);
const thumbnailPath = new URL("assets/img/thumbnails/jeux/soley.svg", root);
const logoPath = new URL("assets/img/mathsgo-logo-soley.png", root);
const cataloguePath = new URL("assets/js/catalogue-refonte-data.js", root);

const html = fs.readFileSync(gamePath, "utf8");
const thumbnail = fs.readFileSync(thumbnailPath, "utf8");

function loadCatalogue() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(cataloguePath, "utf8"), context);
  return context.window.MATHSGO_CATALOGUE;
}

function createGameContext() {
  const inlineScript = html.match(/<script>\s*("use strict";[\s\S]*?)<\/script>/)?.[1];
  assert.ok(inlineScript, "le script principal de Solèy doit rester incorporé à la page");
  const core = inlineScript.slice(0, inlineScript.indexOf("/* ===== Dessin ===== */"));
  assert.ok(core.length > 0, "la logique testable doit précéder le rendu");
  const context = vm.createContext({
    localStorage: {
      getItem() { return null; },
      setItem() {}
    }
  });
  vm.runInContext(core, context);
  return context;
}

test("Solèy est publié une seule fois, dans Jeux et Fractions", () => {
  const catalogue = loadCatalogue();
  const resource = catalogue.resources.find(({ path }) => path === "outils/club_maths/soley.html");
  const classification = catalogue.resourceClassifications["outils/club_maths/soley.html"];

  assert.ok(resource);
  assert.equal(
    catalogue.resources.filter(({ path }) => path === resource.path).length,
    1
  );
  assert.deepEqual([...resource.domains], ["jeux-recherches", "nombres-calculs"]);
  assert.deepEqual([...resource.notions], ["strategie", "fractions"]);
  assert.equal(resource.status, "published");
  assert.equal(resource.recent, true);
  assert.equal(classification.primaryGroup, "jeux");
  assert.equal("primaryNotion" in classification, false);
  assert.equal(classification.thumbnail, "assets/img/thumbnails/jeux/soley.svg?v=1");
});

test("les 51 solutions de référence gagnent et ramassent les 107 fruits", () => {
  const context = createGameContext();
  const worldCounts = vm.runInContext(
    "Object.fromEntries(WORLDS.map(({id})=>[id,LV.filter(level=>level.w===id).length]))",
    context
  );
  assert.deepEqual(
    { ...worldCounts },
    { lagon: 8, foret: 9, volcan: 7, pitons: 7, soleils: 8, marche: 6, mafate: 6 }
  );

  const summary = vm.runInContext(`(() => {
    let fruits = 0;
    const failures = [];
    LV.forEach((level, index) => {
      cur = index;
      state.placed = {};
      const occupied = new Set([
        ...level.suns.map(({x,y}) => x + "," + y),
        ...level.rocks.map(([x,y]) => x + "," + y),
        ...level.targets.map(({x,y}) => x + "," + y),
        ...level.fruits.map(([x,y]) => x + "," + y),
        ...(level.gates || []).map(({x,y}) => x + "," + y)
      ]);
      for (const [toolIndex, x, y] of level.sol) {
        if (!level.tools[toolIndex] || occupied.has(x + "," + y)) {
          failures.push(level.name + ": placement de solution invalide");
          continue;
        }
        state.placed[x + "," + y] = { def: level.tools[toolIndex], ti: toolIndex };
      }
      const result = simulate();
      if (!result.win) failures.push(level.name + ": solution non gagnante");
      if (result.fruits.size !== level.fruits.length) {
        failures.push(level.name + ": fruit manquant");
      }
      fruits += result.fruits.size;
    });
    return { levels: LV.length, fruits, failures };
  })()`, context);

  assert.equal(summary.levels, 51);
  assert.equal(summary.fruits, 107);
  assert.deepEqual([...summary.failures], []);
});

test("les rayons de victoire forment un graphe de propagation valide", () => {
  const context = createGameContext();
  const graph = vm.runInContext(`(() => {
    const failures = [];
    let mergeOutputs = 0;
    let branchedOutputs = 0;
    LV.forEach((level, index) => {
      cur = index;
      state.placed = {};
      level.sol.forEach(([toolIndex, x, y]) => {
        state.placed[x + "," + y] = { def: level.tools[toolIndex], ti: toolIndex };
      });
      const result = simulate();
      result.segs.forEach(segment => {
        if (segment.id < 0 || segment.parents.some(parent => parent >= segment.id)) {
          failures.push(level.name + ": dépendance non topologique");
        }
        if (!segment.viaType && segment.parents.length !== 0) {
          failures.push(level.name + ": un soleil possède un parent");
        }
        if (segment.viaType === "m") {
          mergeOutputs++;
          if (segment.parents.length !== 2) failures.push(level.name + ": addition sans deux entrées");
        } else if (segment.viaType && segment.parents.length !== 1) {
          failures.push(level.name + ": pièce simple sans parent unique");
        }
        if ((segment.viaType === "s2" || segment.viaType === "s3") && segment.parents.length === 1) {
          branchedOutputs++;
        }
      });
    });
    return { failures, mergeOutputs, branchedOutputs };
  })()`, context);

  assert.deepEqual([...graph.failures], []);
  assert.ok(graph.mergeOutputs > 0);
  assert.ok(graph.branchedOutputs > 0);
});

test("l’accueil masque réellement le plateau et reprend la charte du site", () => {
  assert.match(html, /#play\.screen\{display:none;\}/);
  assert.match(html, /#play\.screen\.active\{display:flex;\}/);
  assert.match(html, /class="brandmark" href="\/"/);
  assert.match(html, /assets\/img\/mathsgo-logo-soley\.png/);
  assert.match(html, /assets\/js\/consentement\.js/);
  assert.match(html, /Gérer mes cookies/);
  assert.match(html, /aria-label="Recommencer le niveau"/);
  assert.match(html, /class="chip[^"]*"[^>]*aria-pressed=/);
});

test("le nouveau cours illustré conserve ses 44 fiches et ses fractions composées", () => {
  const context = createGameContext();
  const course = vm.runInContext(`(() => {
    const lines = Object.values(CALC).flat();
    return {
      cards: Object.keys(CALC).length,
      lines: lines.length,
      missingLevels: Object.keys(CALC).filter(name => !LV.some(level => level.name === name)),
      rendered: lines.every(line => calcLineHTML(line).includes('class="heq"'))
    };
  })()`, context);

  assert.deepEqual(
    { ...course, missingLevels: [...course.missingLevels] },
    { cards: 44, lines: 60, missingLevels: [], rendered: true }
  );
  assert.match(html, /id="hintov" role="dialog" aria-modal="true"/);
  assert.match(html, /class="frac"/);
});

test("le paysage mobile et le plein écran utilisent réellement tout le viewport", () => {
  assert.match(html, /@media \(orientation:landscape\)\{/);
  assert.match(html, /matchMedia\('\(orientation:landscape\)'\)/);
  assert.match(html, /height:100dvh/);
  assert.match(html, /env\(safe-area-inset-left\)/);
  assert.match(html, /--board-ratio/);
  assert.match(html, /aspect-ratio:var\(--board-ratio/);
  assert.match(html, /const boardW=Math\.max\(120,Math\.min\(availH\*ratio,availW-sidebarMin-gap\)\)/);
  assert.match(html, /pl\.style\.flexBasis=`\$\{boardW\}px`/);
  assert.match(html, /pl\.style\.height=`\$\{boardH\}px`/);
  assert.match(html, /min-width:44px;min-height:44px/);
  assert.match(html, /#topbar,#introline,#toolbox,#status\{flex-shrink:0;\}/);
  assert.match(html, /fsbtn\.addEventListener\('click',async/);
  assert.match(html, /requestFS\.call\(target\)/);
  assert.match(html, /const nativeFullscreen=typeof requestFS==='function'&&typeof exitFS==='function'/);
  assert.match(html, /const portrait=window\.matchMedia\('\(orientation:portrait\)'\)/);
  assert.match(html, /const hide=standalone\|\|\(!nativeFullscreen&&mobileDevice&&portrait\.matches\)/);
  assert.match(html, /fsbtn\.hidden=hide/);
  assert.match(html, /portrait\.addEventListener\('change',syncAvailability\)/);
  assert.match(html, /id="fsbtn"[^>]*hidden/);
  assert.match(html, /#fsbtn\[hidden\]\{display:none !important;\}/);
  assert.match(html, /Masquer la barre d’outils/);
  assert.match(html, /window\.visualViewport/);
  assert.doesNotMatch(html, /navigationUI:'hide'/);
  assert.doesNotMatch(html, /orientation:landscape\) and \(min-width:640px\)/);
  assert.doesNotMatch(html, /function fallback\(/);
});

test("la victoire propage chaque rayon jusqu’aux maisons avant les confettis", () => {
  assert.match(html, /\.beam\.win-draw,\.beampath\.win-draw/);
  assert.match(html, /@keyframes win-draw\{from\{stroke-dashoffset:var\(--win-length\)/);
  assert.match(html, /const pause=\.4,drawStart=\.1,SPEED=620/);
  assert.match(html, /const arrival=sg\.parents\.length\?Math\.max/);
  assert.match(html, /d\.ins\.map\(dir=>merges\[pk\]\[dir\]\.segId\)/);
  assert.match(html, /path\.getTotalLength\(\)/);
  assert.match(html, /p\.sg\.targetIndex>=0/);
  assert.doesNotMatch(html, /drawStart\+i\*0\.2/);
  assert.doesNotMatch(html, /@keyframes retractseg/);
});

test("le logo maths&go s’intègre au soleil sans plaque blanche", () => {
  assert.ok(fs.existsSync(logoPath));
  assert.match(html, /<img src="\/assets\/img\/mathsgo-logo-soley\.png" alt="maths&go"/);
  assert.match(html, /\.brandmark\{[\s\S]*?border:0;background:transparent/);
  assert.match(html, /html\{background:#241b4d;\}/);
  assert.match(html, /meta name="robots" content="index, follow, max-image-preview:large"/);
  assert.match(html, /filter:none/);
  assert.doesNotMatch(html, /#fffdf8/);
  assert.doesNotMatch(html, /#FFEEDA/);
  assert.doesNotMatch(html, /filter:grayscale\(1\)/);
});

test("la miniature Solèy respecte le format du catalogue", () => {
  assert.match(thumbnail, /<svg[^>]*width="720"[^>]*height="320"[^>]*viewBox="0 0 720 320"/);
  assert.match(thumbnail, /Solèy — jeu de fractions/);
  assert.match(thumbnail, />51 NIVEAUX</);
});
