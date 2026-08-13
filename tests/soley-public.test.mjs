import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const gamePath = new URL("outils/club_maths/soley.html", root);
const thumbnailPath = new URL("assets/img/thumbnails/jeux/soley.svg", root);
const logoPath = new URL("assets/img/mathsgo-logo-soley.png", root);
const cataloguePath = new URL("assets/js/catalogue-refonte-data.js", root);

// Depuis le découpage d'août 2026, la page est une coquille : le style vit dans
// soley/css/soley.css et le code dans soley/js/{levels,engine,render,ui}.js.
// Lecture normalisée en LF : un poste Windows peut avoir des copies de travail en CRLF.
const lire = (chemin) => fs.readFileSync(new URL(chemin, root), "utf8").replace(/\r\n/g, "\n");
const html = lire("outils/club_maths/soley.html");
const css = lire("outils/club_maths/soley/css/soley.css");
const js = {
  levels: lire("outils/club_maths/soley/js/levels.js"),
  engine: lire("outils/club_maths/soley/js/engine.js"),
  render: lire("outils/club_maths/soley/js/render.js"),
  ui: lire("outils/club_maths/soley/js/ui.js"),
};
const tout = html + css + js.levels + js.engine + js.render + js.ui;
const thumbnail = fs.readFileSync(thumbnailPath, "utf8");

function loadCatalogue() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(cataloguePath, "utf8"), context);
  return context.window.MATHSGO_CATALOGUE;
}

function createGameContext() {
  // La logique testable sans navigateur = données (levels.js) + moteur (engine.js).
  // engine.js ne touche au DOM qu'à l'intérieur de fonctions jamais appelées ici.
  const context = vm.createContext({
    localStorage: {
      getItem() { return null; },
      setItem() {}
    }
  });
  vm.runInContext(js.levels, context);
  vm.runInContext(js.engine, context);
  return context;
}

test("la coquille charge les modules découpés, dans l'ordre, sans script incorporé", () => {
  assert.match(html, /<link rel="stylesheet" href="soley\/css\/soley\.css">/);
  const ordre = [...html.matchAll(/<script src="soley\/js\/(\w+)\.js"><\/script>/g)].map(m => m[1]);
  assert.deepEqual(ordre, ["levels", "engine", "render", "ui"]);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<style>/);
  for (const [nom, texte] of Object.entries(js)) {
    assert.ok(texte.startsWith('"use strict";\n'), `${nom}.js doit rester en mode strict`);
  }
});

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
  assert.equal(classification.thumbnail, "assets/img/thumbnails/jeux/soley.svg?v=2");
  assert.match(resource.description, /60 niveaux/);
  assert.match(resource.description, /huit mondes/);
  assert.match(classification.cardDescription, /60 casse-têtes/);
});

test("les 60 solutions de référence gagnent et ramassent les 135 fruits", () => {
  const context = createGameContext();
  const worldCounts = vm.runInContext(
    "Object.fromEntries(WORLDS.map(({id})=>[id,LV.filter(level=>level.w===id).length]))",
    context
  );
  assert.deepEqual(
    { ...worldCounts },
    { lagon: 8, foret: 9, volcan: 7, pitons: 7, soleils: 8, marche: 6, tunnels: 8, mafate: 7 }
  );

  const structure = vm.runInContext(`(() => ({
    worlds: WORLDS.map(world => world.id),
    runs: LV.map(level => level.w).filter((world,index,all) => index === 0 || world !== all[index-1]),
    saveKeys: new Set(LV.map(level => level.w + ':' + level.name)).size,
    tunnels: LV.filter(level => level.w === 'tunnels').map(level => level.name)
  }))()`, context);
  assert.deepEqual(
    [...structure.worlds],
    ["lagon", "foret", "volcan", "pitons", "soleils", "marche", "tunnels", "mafate"]
  );
  assert.deepEqual([...structure.runs], [...structure.worlds]);
  assert.equal(structure.saveKeys, 60);
  assert.deepEqual([...structure.tunnels], [
    "Le serpent", "La fourche", "Le tourbillon", "Le prisme scellé",
    "La galerie scellée", "Les demi-tunnels", "L'impasse aux letchis", "Le grand réseau"
  ]);

  const summary = vm.runInContext(`(() => {
    let fruits = 0, declaredFruits = 0;
    const failures = [];
    const additions = new Set([
      "Le serpent", "L'impasse aux letchis", "La fourche", "Le tourbillon",
      "Le prisme scellé", "La galerie scellée", "Les demi-tunnels",
      "Le grand réseau", "Les verrous du cirque"
    ]);
    LV.forEach((level, index) => {
      cur = index;
      state.placed = {};
      const occupied = new Set([
        ...level.suns.map(({x,y}) => x + "," + y),
        ...level.rocks.map(([x,y]) => x + "," + y),
        ...level.targets.map(({x,y}) => x + "," + y),
        ...level.fruits.map(([x,y]) => x + "," + y),
        ...(level.gates || []).map(({x,y}) => x + "," + y),
        ...(level.fixed || []).map(([,x,y]) => x + "," + y)
      ]);
      const usedTools = new Set();
      const solutionCells = new Set();
      for (const [toolIndex, x, y] of level.sol) {
        const cell = x + "," + y;
        if (!level.tools[toolIndex] || occupied.has(cell) || usedTools.has(toolIndex) || solutionCells.has(cell)) {
          failures.push(level.name + ": placement de solution invalide");
          continue;
        }
        usedTools.add(toolIndex);
        solutionCells.add(cell);
        state.placed[cell] = { def: level.tools[toolIndex], ti: toolIndex };
      }
      const result = simulate();
      if (!result.win) failures.push(level.name + ": solution non gagnante");
      if (result.fruits.size !== level.fruits.length) {
        failures.push(level.name + ": fruit manquant");
      }
      fruits += result.fruits.size;
      declaredFruits += level.fruits.length;

      if (additions.has(level.name)) {
        level.sol.forEach((_, omitted) => {
          state.placed = {};
          level.sol.forEach(([toolIndex,x,y], placement) => {
            if (placement !== omitted) state.placed[x + "," + y] = { def: level.tools[toolIndex], ti: toolIndex };
          });
          if (simulate().win) failures.push(level.name + ": placement déclaré non indispensable");
        });
      }
    });
    return { levels: LV.length, fruits, declaredFruits, failures };
  })()`, context);

  assert.equal(summary.levels, 60);
  assert.equal(summary.fruits, 135);
  assert.equal(summary.declaredFruits, 135);
  assert.deepEqual([...summary.failures], []);
});

test("les pièces scellées sont valides, bloquées et intégrées à la célébration", () => {
  const context = createGameContext();
  const fixed = vm.runInContext(`(() => {
    const failures = [];
    const byLevel = {};
    LV.filter(level => level.fixed?.length).forEach(level => {
      const seen = new Set();
      byLevel[level.name] = level.fixed.map(([def,x,y]) => {
        const cell = x + ',' + y;
        if (x < 0 || y < 0 || x >= level.cols || y >= level.rows || seen.has(cell)) {
          failures.push(level.name + ': pièce scellée invalide');
        }
        seen.add(cell);
        const occupied = [
          ...level.suns.map(s => s.x + ',' + s.y),
          ...level.targets.map(t => t.x + ',' + t.y),
          ...level.rocks.map(r => r[0] + ',' + r[1]),
          ...level.fruits.map(f => f[0] + ',' + f[1]),
          ...(level.gates || []).map(g => g.x + ',' + g.y)
        ];
        if (occupied.includes(cell) || level.sol.some(([,sx,sy]) => sx === x && sy === y)) {
          failures.push(level.name + ': collision avec une pièce scellée');
        }
        return def.t + '@' + cell;
      });
    });
    return { byLevel, failures };
  })()`, context);

  assert.deepEqual(
    Object.fromEntries(Object.entries(fixed.byLevel).map(([name,values]) => [name,[...values]])),
    {
      "Le prisme scellé": ["s2@4,3"],
      "La galerie scellée": ["b@7,1", "s2@7,4"],
      "Les verrous du cirque": ["s2@3,2", "m@8,4"]
    }
  );
  assert.deepEqual([...fixed.failures], []);
  assert.match(js.ui, /\(L\.fixed\|\|\[\]\)\.some\(f=>f\[1\]===x&&f\[2\]===y\)/);
  assert.match(js.render, /class="placed fixed-piece" data-cell=/);
  assert.match(js.render, /Pièce scellée : elle ne peut pas être déplacée/);
  assert.match(js.engine, /\.placed\[data-cell="\$\{cell\}"\] \.beampath/);
});

test("les demi-tunnels ne se contournent plus avec un rayon entier", () => {
  const context = createGameContext();
  const shortcut = vm.runInContext(`(() => {
    cur = LV.findIndex(level => level.name === 'Les demi-tunnels');
    const level = LV[cur];
    state.placed = {
      '2,4': { def: level.tools[2], ti: 2 },
      '2,6': { def: level.tools[3], ti: 3 },
      '8,6': { def: level.tools[4], ti: 4 },
      '8,4': { def: level.tools[1], ti: 1 }
    };
    const bypass = simulate();
    state.placed = {};
    level.sol.forEach(([toolIndex,x,y]) => {
      state.placed[x + ',' + y] = { def: level.tools[toolIndex], ti: toolIndex };
    });
    const intended = simulate();
    return {
      bypassWins: bypass.win,
      intendedWins: intended.win,
      intendedFruits: intended.fruits.size,
      hasSplit: intended.segs.some(segment => segment.viaType === 's2'),
      hasMerge: intended.segs.some(segment => segment.viaType === 'm' && segment.parents.length === 2 && segment.targetIndex >= 0)
    };
  })()`, context);

  assert.equal(shortcut.bypassWins, false);
  assert.equal(shortcut.intendedWins, true);
  assert.equal(shortcut.intendedFruits, 3);
  assert.equal(shortcut.hasSplit, true);
  assert.equal(shortcut.hasMerge, true);
});

test("la progression verrouillée et les étoiles se calculent juste", () => {
  const context = createGameContext();
  const r = vm.runInContext(`(() => {
    const seuils = WORLDS.map((w, i) => seuilMonde(i));
    const parOk = LV.every((l, i) => parNiveau(i) === l.sol.length && l.sol.length >= 1);
    const avant = WORLDS.map(w => mondeDeverrouille(w.id));
    const lagon = LV.map((l, i) => i).filter(i => LV[i].w === 'lagon');
    lagon.slice(0, 4).forEach(i => save.done[LV[i].w + ':' + LV[i].name] = true);
    const foretA4 = mondeDeverrouille('foret');
    save.done[LV[lagon[4]].w + ':' + LV[lagon[4]].name] = true;
    const foretA5 = mondeDeverrouille('foret');
    const volcanFerme = !mondeDeverrouille('volcan');
    const zi = LV.findIndex(l => l.name === 'Zigzag dans les roches');
    const k = 'lagon:Zigzag dans les roches';
    const fruitManquant = etoiles(zi);
    save.fruits[k] = 1; const fruitsComplets = etoiles(zi);
    save.pieces[k] = 2; const maitrise = etoiles(zi);
    save.pieces[k] = 3; const tropDePieces = etoiles(zi);
    const sansFruits = etoiles(0);
    return { seuils, parOk, avant, foretA4, foretA5, volcanFerme,
      fruitManquant, fruitsComplets, maitrise, tropDePieces, sansFruits };
  })()`, context);

  assert.deepEqual([...r.seuils], [0, 5, 6, 5, 5, 5, 4, 5]);
  assert.equal(r.parOk, true);
  assert.deepEqual([...r.avant], [true, false, false, false, false, false, false, false]);
  assert.equal(r.foretA4, false);
  assert.equal(r.foretA5, true);
  assert.equal(r.volcanFerme, true);
  assert.equal(r.fruitManquant, 1);
  assert.equal(r.fruitsComplets, 2);
  assert.equal(r.maitrise, 3);
  assert.equal(r.tropDePieces, 2);
  assert.equal(r.sansFruits, 2);
  assert.match(js.engine, /save\.pieces\[lvId\(cur\)\]=Math\.min/);
  assert.match(js.ui, /classList\.contains\('locked'\)/);
  assert.match(js.ui, /etoiles,parNiveau,seuilMonde,mondeDeverrouille/);
  assert.match(html, /id="winstars"/);
  assert.match(html, /id="defiline"/);
  assert.match(css, /\.wrow\.locked\{/);
  assert.match(css, /\.classebadge\{/);
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
  assert.match(css, /#play\.screen\{display:none;\}/);
  assert.match(css, /#play\.screen\.active\{display:flex;\}/);
  assert.match(html, /class="brandmark" href="\/"/);
  assert.match(html, /assets\/img\/mathsgo-logo-soley\.png/);
  assert.match(html, /assets\/js\/consentement\.js/);
  assert.match(html, /Gérer mes cookies/);
  assert.match(html, /aria-label="Recommencer le niveau"/);
  assert.match(js.ui, /class="chip[^"]*"[^>]*aria-pressed=/);
  assert.match(html, /meta name="description" content="Un jeu de réflexion en 60 niveaux/);
  assert.match(js.ui, /tunnels:`<path d="M4 42V25/);
});

test("le cours illustré couvre les nouveaux partages et les pièces scellées", () => {
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
    { cards: 51, lines: 71, missingLevels: [], rendered: true }
  );
  const additions = vm.runInContext(`({
    fourche: CALC["La fourche"],
    impasse: CALC["L'impasse aux letchis"],
    demi: CALC["Les demi-tunnels"],
    reseau: CALC["Le grand réseau"],
    prisme: CALC["Le prisme scellé"],
    galerie: CALC["La galerie scellée"],
    verrous: CALC["Les verrous du cirque"]
  })`, context);
  assert.deepEqual([...additions.fourche], ["1 ÷ 2 = 1/2"]);
  assert.deepEqual([...additions.impasse], ["1/2 ÷ 2 = 1/4", "1/2 + 1/4 = 2/4 + 1/4 = 3/4"]);
  assert.deepEqual([...additions.demi], ["1 ÷ 2 = 1/2", "1/2 + 1/2 = 1"]);
  assert.deepEqual([...additions.reseau], ["1 ÷ 3 = 1/3", "1/3 ÷ 2 = 1/6"]);
  assert.deepEqual([...additions.prisme], ["1 ÷ 2 = 1/2"]);
  assert.deepEqual([...additions.galerie], ["1 ÷ 2 = 1/2"]);
  assert.deepEqual([...additions.verrous], ["1 ÷ 2 = 1/2", "1/2 + 1/2 = 1"]);
  assert.match(html, /id="hintov" role="dialog" aria-modal="true"/);
  assert.match(js.engine, /class="frac"/);
});

test("le paysage mobile et le plein écran utilisent réellement tout le viewport", () => {
  assert.match(css, /@media \(orientation:landscape\)\{/);
  assert.match(js.ui, /matchMedia\('\(orientation:landscape\)'\)/);
  assert.match(css, /height:100dvh/);
  assert.match(css, /env\(safe-area-inset-left\)/);
  assert.match(js.ui, /--board-ratio/);
  assert.match(css, /aspect-ratio:var\(--board-ratio/);
  assert.match(js.ui, /const boardW=Math\.max\(120,Math\.min\(availH\*ratio,availW-sidebarMin-gap\)\)/);
  assert.match(js.ui, /pl\.style\.flexBasis=`\$\{boardW\}px`/);
  assert.match(js.ui, /pl\.style\.height=`\$\{boardH\}px`/);
  assert.match(css, /min-width:44px;min-height:44px/);
  assert.match(css, /#topbar,#introline,#toolbox,#status\{flex-shrink:0;\}/);
  assert.match(js.ui, /fsbtn\.addEventListener\('click',async/);
  assert.match(js.ui, /requestFS\.call\(target\)/);
  assert.match(js.ui, /const nativeFullscreen=typeof requestFS==='function'&&typeof exitFS==='function'/);
  assert.match(js.ui, /const portrait=window\.matchMedia\('\(orientation:portrait\)'\)/);
  assert.match(js.ui, /const hide=standalone\|\|\(!nativeFullscreen&&mobileDevice&&portrait\.matches\)/);
  assert.match(js.ui, /fsbtn\.hidden=hide/);
  assert.match(js.ui, /portrait\.addEventListener\('change',syncAvailability\)/);
  assert.match(html, /id="fsbtn"[^>]*hidden/);
  assert.match(css, /#fsbtn\[hidden\]\{display:none !important;\}/);
  assert.match(js.ui, /Masquer la barre d’outils/);
  assert.match(js.ui, /window\.visualViewport/);
  assert.doesNotMatch(tout, /navigationUI:'hide'/);
  assert.doesNotMatch(tout, /orientation:landscape\) and \(min-width:640px\)/);
  assert.doesNotMatch(tout, /function fallback\(/);
});

test("la victoire propage chaque rayon jusqu’aux maisons avant les confettis", () => {
  assert.match(css, /\.beam\.win-draw,\.beampath\.win-draw/);
  assert.match(css, /animation:win-draw[^;]*both/);
  assert.match(css, /@keyframes win-draw\{from\{stroke-dashoffset:var\(--win-length\)/);
  assert.match(js.engine, /const pause=\.4,drawStart=\.1,SPEED=620/);
  assert.match(js.engine, /const arrival=sg\.parents\.length\?Math\.max/);
  assert.match(js.engine, /d\.ins\.map\(dir=>merges\[pk\]\[dir\]\.segId\)/);
  assert.match(js.engine, /path\.getTotalLength\(\)/);
  assert.match(js.engine, /p\.sg\.targetIndex>=0/);
  assert.match(js.engine, /const T=\(pause\+lastArrival\+\.3\)\*1000/);
  assert.match(js.render, /class="placed fixed-piece" data-cell=/);
  assert.doesNotMatch(tout, /drawStart\+i\*0\.2/);
  assert.doesNotMatch(tout, /@keyframes retractseg/);
});

test("le logo maths&go s’intègre au soleil sans plaque blanche", () => {
  assert.ok(fs.existsSync(logoPath));
  assert.match(html, /<img src="\/assets\/img\/mathsgo-logo-soley\.png" alt="maths&go"/);
  assert.match(css, /\.brandmark\{[\s\S]*?border:0;background:transparent/);
  assert.match(css, /html\{background:#241b4d;\}/);
  assert.match(html, /meta name="robots" content="index, follow, max-image-preview:large"/);
  assert.match(css, /filter:none/);
  assert.doesNotMatch(tout, /#fffdf8/);
  assert.doesNotMatch(tout, /#FFEEDA/);
  /* le logo lui-même ne doit jamais être re-filtré (le gris des mondes verrouillés, lui, est voulu) */
  assert.doesNotMatch(css, /\.brandmark[^{]*\{[^}]*grayscale/);
});

test("la miniature Solèy respecte le format du catalogue", () => {
  assert.match(thumbnail, /<svg[^>]*width="720"[^>]*height="320"[^>]*viewBox="0 0 720 320"/);
  assert.match(thumbnail, /Solèy — jeu de fractions/);
  assert.match(thumbnail, />60 NIVEAUX</);
});
