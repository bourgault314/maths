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
  assert.match(resource.description, /69 niveaux/);
  assert.match(resource.description, /neuf mondes/);
  assert.match(classification.cardDescription, /69 casse-têtes/);
});

test("les 69 solutions de référence gagnent et ramassent les 142 fruits", () => {
  const context = createGameContext();
  const worldCounts = vm.runInContext(
    "Object.fromEntries(WORLDS.map(({id})=>[id,LV.filter(level=>level.w===id).length]))",
    context
  );
  assert.deepEqual(
    { ...worldCounts },
    { lagon: 9, canne: 8, foret: 9, volcan: 7, pitons: 7, soleils: 8, marche: 6, tunnels: 8, mafate: 7 }
  );

  const structure = vm.runInContext(`(() => ({
    worlds: WORLDS.map(world => world.id),
    runs: LV.map(level => level.w).filter((world,index,all) => index === 0 || world !== all[index-1]),
    saveKeys: new Set(LV.map(level => level.w + ':' + level.name)).size,
    tunnels: LV.filter(level => level.w === 'tunnels').map(level => level.name)
  }))()`, context);
  assert.deepEqual(
    [...structure.worlds],
    ["lagon", "canne", "foret", "volcan", "pitons", "soleils", "marche", "tunnels", "mafate"]
  );
  assert.deepEqual([...structure.runs], [...structure.worlds]);
  assert.equal(structure.saveKeys, 69);
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

  assert.equal(summary.levels, 69);
  assert.equal(summary.fruits, 142);
  assert.equal(summary.declaredFruits, 142);
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

test("le miroir réfléchit net, à angle droit, avec sa barre à 45°", () => {
  /* retouche du 13/08 (proposition de la collègue) : plus aucune courbe de rayon */
  assert.match(js.render, /function mirrorBar/);
  assert.match(js.render, /class="mirbar"/);
  assert.doesNotMatch(js.render, /data-part="through"/);
  assert.doesNotMatch(js.render, /Q \$\{c\} \$\{c\}/);
  assert.doesNotMatch(js.engine, /through/);

  const context = createGameContext();
  vm.runInContext(js.render, context); /* déclarations pures, sans DOM au chargement */
  const geom = vm.runInContext(`(() => {
    const premiereLigne = s => {
      const m = s.match(/x1="([-\\d.]+)" y1="([-\\d.]+)" x2="([-\\d.]+)" y2="([-\\d.]+)"/);
      return { x1:+m[1], y1:+m[2], x2:+m[3], y2:+m[4] };
    };
    const monte = premiereLigne(mirrorBar(1,0));   // rayon vers la droite réfléchi vers le haut : « / »
    const descend = premiereLigne(mirrorBar(1,2)); // réfléchi vers le bas : « \\ »
    const flux = pieceFlow({t:'b',in:1,out:0}, {ins:[{dir:1,val:[1,2]}], outs:[{dir:0,val:[1,2]}]});
    return {
      penteMonte:(monte.y2-monte.y1)/(monte.x2-monte.x1),
      penteDescend:(descend.y2-descend.y1)/(descend.x2-descend.x1),
      segments:(flux.match(/class="beampath"/g)||[]).length,
      barre:flux.includes('class="mirbar"'),
      epaisseurConservee:flux.split('data-part').length === 3 && flux.includes('stroke-width="12"'),
      ecretage:flux.includes('<clipPath'),
      auCentre:/data-part="in"[^>]*x2="50" y2="50"/.test(flux),
      peintureOrdonnee:flux.indexOf('#101a33')<flux.indexOf('data-part')&&flux.indexOf('data-part')<flux.lastIndexOf('#cfe4ff'),
    };
  })()`, context);
  assert.ok(Math.abs(geom.penteMonte + 1) < 1e-9, "barre « / » attendue (pente -1 en repère écran)");
  assert.ok(Math.abs(geom.penteDescend - 1) < 1e-9, "barre « \\ » attendue (pente +1)");
  assert.equal(geom.segments, 2);
  assert.equal(geom.barre, true);
  assert.equal(geom.epaisseurConservee, true, "un demi garde son épaisseur fwidth([1,2])=12");
  assert.equal(geom.ecretage, true, "le rayon est écrêté le long de la ligne du miroir");
  assert.equal(geom.auCentre, true, "le segment d'entrée va jusqu'au centre (pleine largeur sur la face)");
  assert.equal(geom.peintureOrdonnee, true, "ordre : dos sombre, puis rayon, puis face claire");
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
    /* chantier « Comprendre » : le seuil ⌈5/8⌉ ET les 3 découvertes du monde précédent */
    lagon.slice(0, 5).forEach(i => save.done[LV[i].w + ':' + LV[i].name] = true);
    const canneA5 = mondeDeverrouille('canne'); /* 5 réussites < seuil 6 */
    save.done['lagon:La moitié de la moitié'] = true;
    const canneSansDec = mondeDeverrouille('canne'); /* 6 réussites mais 2 découvertes sur 3 */
    save.done['lagon:Les quatre quarts'] = true;
    const canneComplete = mondeDeverrouille('canne'); /* 7 réussites dont les 3 découvertes */
    const foretFermee = !mondeDeverrouille('foret'); /* la canne n'a encore rien */
    const canne = LV.map((l, i) => i).filter(i => LV[i].w === 'canne');
    canne.slice(0, 5).forEach(i => save.done[LV[i].w + ':' + LV[i].name] = true);
    const foretOuverte = mondeDeverrouille('foret'); /* ⌈5×8/8⌉ = 5, aucune découverte dans la canne */
    const volcanFerme = !mondeDeverrouille('volcan');
    const zi = LV.findIndex(l => l.name === 'Zigzag dans les roches');
    const k = 'lagon:Zigzag dans les roches';
    const fruitManquant = etoiles(zi);
    save.fruits[k] = 1; const fruitsComplets = etoiles(zi);
    save.pieces[k] = 3; const maitrise = etoiles(zi); /* sol de référence à 3 pièces depuis la refonte */
    save.pieces[k] = 4; const tropDePieces = etoiles(zi);
    const sansFruits = etoiles(0);
    return { seuils, parOk, avant, canneA5, canneSansDec, canneComplete, foretFermee, foretOuverte, volcanFerme,
      fruitManquant, fruitsComplets, maitrise, tropDePieces, sansFruits };
  })()`, context);

  assert.deepEqual([...r.seuils], [0, 6, 5, 6, 5, 5, 5, 4, 5]);
  assert.equal(r.parOk, true);
  assert.deepEqual([...r.avant], [true, false, false, false, false, false, false, false, false]);
  assert.equal(r.canneA5, false);
  assert.equal(r.canneSansDec, false, "6 réussites sans les 3 découvertes : la canne reste fermée");
  assert.equal(r.canneComplete, true);
  assert.equal(r.foretFermee, true);
  assert.equal(r.foretOuverte, true, "⌈5/8⌉ de la canne ouvre la forêt");
  assert.equal(r.volcanFerme, true);
  assert.equal(r.fruitManquant, 1);
  assert.equal(r.fruitsComplets, 2);
  assert.equal(r.maitrise, 3);
  assert.equal(r.tropDePieces, 2);
  assert.equal(r.sansFruits, 2);
  assert.match(js.engine, /save\.pieces\[lvId\(cur\)\]=Math\.min/);
  assert.match(js.ui, /classList\.contains\('locked'\)/);
  /* retouches du 13/08 : les étoiles sont dessinées en petits soleils, partout */
  assert.match(js.render, /function soleilIco/);
  assert.match(js.render, /function soleilRang/);
  assert.match(js.engine, /soleilRang\(e,3,26\)/);
  assert.match(js.ui, /petits soleils/);
  assert.match(js.ui, /stlegende/);
  assert.match(html, /id="stlegende"/);
  /* garde-fou étendu au lot 1 : zéro ★ où que ce soit (html, css, les 4 js) */
  assert.doesNotMatch(tout, /[★☆]/);
  assert.match(js.render, /Lambrequins v2/);
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
  assert.match(html, /meta name="description" content="Un jeu de réflexion en 69 niveaux/);
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
    { cards: 52, lines: 73, missingLevels: [], rendered: true }
  );
  const additions = vm.runInContext(`({
    fourche: CALC["La fourche"],
    impasse: CALC["L'impasse aux letchis"],
    demi: CALC["Les demi-tunnels"],
    reseau: CALC["Le grand réseau"],
    prisme: CALC["Le prisme scellé"],
    galerie: CALC["La galerie scellée"],
    verrous: CALC["Les verrous du cirque"],
    quatre: CALC["Les quatre quarts"]
  })`, context);
  assert.deepEqual([...additions.fourche], ["1 ÷ 2 = 1/2"]);
  assert.deepEqual([...additions.impasse], ["1/2 ÷ 2 = 1/4", "1/2 + 1/4 = 2/4 + 1/4 = 3/4"]);
  /* règle R1 (lot 1 « Comprendre ») : les totaux n/n s'écrivent partout */
  assert.deepEqual([...additions.demi], ["1 ÷ 2 = 1/2", "1/2 + 1/2 = 2/2 = 1"]);
  assert.deepEqual([...additions.reseau], ["1 ÷ 3 = 1/3", "1/3 ÷ 2 = 1/6"]);
  assert.deepEqual([...additions.prisme], ["1 ÷ 2 = 1/2"]);
  assert.deepEqual([...additions.galerie], ["1 ÷ 2 = 1/2"]);
  assert.deepEqual([...additions.verrous], ["1 ÷ 2 = 1/2", "1/2 + 1/2 = 2/2 = 1"]);
  assert.deepEqual([...additions.quatre], ["1 ÷ 2 = 1/2", "1/2 ÷ 2 = 1/4"]);
  assert.match(html, /id="hintov" role="dialog" aria-modal="true"/);
  assert.match(js.engine, /class="frac"/);
});

test("le chantier « Comprendre » : découvertes, points de cours et règle R1", () => {
  const context = createGameContext();
  const r = vm.runInContext(`(() => {
    const lagon = LV.filter(l => l.w === 'lagon').map(l => l.name);
    const decs = LV.filter(l => l.dec).map(l => l.name + ':' + l.dec);
    const q = LV.find(l => l.name === 'Les quatre quarts');
    const textes = id => COURS[id].etapes.map(e => (e.t || '') + ' ' + (e.eq || '')).join(' ');
    return {
      lagon, decs,
      coursIds: Object.keys(COURS),
      titres: Object.values(COURS).map(c => c.titre),
      grille: q.cols + 'x' + q.rows,
      pur: q.rocks.length === 0 && q.fruits.length === 0 && !q.gates && !q.fixed,
      outils: q.tools.map(t => t.t + ':' + t.in).join(','),
      cartes: Object.values(COURS).every(c => c.carte && typeof c.carte.t === 'string' && c.carte.t.length > 20),
      /* R5 : l'écriture mathématique vit SÉPARÉE du texte — jamais d'égalité dans une phrase */
      separation: Object.values(COURS).every(c =>
        c.etapes.every(e => !(e.t && e.t.includes(' = '))) && !c.carte.t.includes(' = ')),
      /* R3 + règle du 14/08 : un prédire révèle un NOM, jamais une STRATÉGIE que le
         niveau suivant demande de trouver — et on ne pose pas dans un cours une
         question que la consigne du niveau suivant pose déjà. Seul le quart en garde
         un : il nomme le 1/8, que rien d'autre n'annonce. */
      predire: !COURS.demi.predire && !COURS.tiers.predire
        && !!(COURS.quart.predire && COURS.quart.predire.question
              && COURS.quart.predire.reponse),
      /* R1 : aucun total non écrit dans les textes des cours */
      totaux: [textes('demi').includes('1/2 + 1/2 = 2/2 = 1'),
        textes('tiers').includes('1/3 + 1/3 + 1/3 = 3/3 = 1'),
        textes('quart').includes('1/4 + 1/4 + 1/4 + 1/4 = 4/4 = 1')],
      /* R2 (v8) : les DEUX registres se construisent — cases du mur ET rayons terminaux */
      terminaux: ['demi', 'tiers', 'quart'].map(id => {
        const svg = sceneCours(COURS[id].scene, () => 0).svg;
        return {
          cases: (svg.match(/data-terminal/g) || []).length,
          rayons: (svg.match(/data-rayon="terminal"/g) || []).length,
        };
      }),
      /* v9 : le mur est un ZOOM — chaque rayon terminal tombe dans l'intervalle
         horizontal de SA case de la dernière rangée */
      alignes: ['demi', 'tiers', 'quart'].every(id => {
        const svg = sceneCours(COURS[id].scene, () => 0).svg;
        const rayons = [...svg.matchAll(/<g data-rayon="terminal"><line [^>]*x2="([\\d.]+)"/g)].map(m => +m[1]);
        const cases = [...svg.matchAll(/<rect x="([\\d.]+)" y="[\\d.]+" width="([\\d.]+)"[^>]*data-terminal/g)]
          .map(m => [+m[1], +m[1] + +m[2]]);
        return rayons.length > 0 && rayons.length === cases.length
          && rayons.every((x, i) => x >= cases[i][0] && x <= cases[i][1]);
      }),
      /* R3 dans le panneau : la réponse du prédire est ABSENTE du HTML construit */
      panneau: ['demi', 'tiers', 'quart'].map(id => {
        const h = construireCours(id);
        return {
          id,
          carteSavoir: h.includes('Carte de savoir'),
          bouton: h.includes('cpredirebtn'),
          reponseCachee: !h.includes(COURS[id].predire && COURS[id].predire.reponse
            ? COURS[id].predire.reponse : '@jamais@'),
          scene: h.includes('class="cscene"') && h.includes('class="cfade"'),
          /* v9.1 : la scène seule porte le lien — plus de phrase-pont */
          sansPont: !h.includes('cpontphrase') && !h.includes('un zoom sur tes rayons'),
        };
      }),
    };
  })()`, context);
  assert.deepEqual([...r.lagon], ["Premier rayon", "Zigzag dans les roches", "Moitié-moitié",
    "La part perdue", "Partage en tiers", "Les quatre quarts", "La moitié de la moitié",
    "Quarts en croix", "Le tour du lagon"]);
  assert.deepEqual([...r.decs], ["Moitié-moitié:demi", "Partage en tiers:tiers", "Les quatre quarts:quart"]);
  assert.deepEqual([...r.coursIds], ["demi", "tiers", "quart"]);
  assert.deepEqual([...r.titres], ["Le demi", "Le tiers", "Le quart"]);
  assert.equal(r.grille, "9x7");
  assert.equal(r.pur, true, "une découverte est pure : sans roche, fruit, passe ni pièce scellée");
  assert.equal(r.outils, "s2:1,s2:0,s2:2", "trois prismes ÷2, orientations de la spec §4.3");
  assert.equal(r.cartes, true);
  assert.equal(r.separation, true, "R5 : les égalités vivent dans eq, jamais dans une phrase");
  assert.equal(r.predire, true);
  assert.deepEqual([...r.totaux], [true, true, true], "R1 : les 2/2, 3/3 et 4/4 sont écrits");
  assert.deepEqual([...r.terminaux].map(t => t.cases), [2, 3, 4], "R2 : la scène C3 montre bien QUATRE cases 1/4");
  assert.deepEqual([...r.terminaux].map(t => t.rayons), [2, 3, 4], "R2 (v8) : et QUATRE rayons 1/4 dans la cascade");
  assert.equal(r.alignes, true, "v9 : chaque rayon terminal tombe au-dessus de SA case (le zoom)");
  for (const p of r.panneau) {
    assert.equal(p.carteSavoir, true, `${p.id} : la phrase-carte est habillée en carte de savoir (R4)`);
    assert.equal(p.bouton, p.id === "quart",
      `${p.id} : bouton « À ton avis… » seulement là où une réponse existe`);
    assert.equal(p.reponseCachee, true, `${p.id} : la réponse du prédire n'est pas dans la page avant le toucher (R3)`);
    assert.equal(p.scene, true, `${p.id} : scène à deux registres présente`);
    assert.equal(p.sansPont, true, `${p.id} : plus de phrase-pont, la scène seule porte le lien (v9.1)`);
  }
  /* le câblage : overlay dans la coquille, séquence de victoire, sauvegarde, écran des niveaux */
  assert.match(html, /id="coursov" role="dialog" aria-modal="true" aria-labelledby="courstitre"/);
  assert.match(html, /id="coursfleche"/);
  assert.match(html, /id="coursok"/);
  /* le cours ne se déroule plus au chronomètre : plus de bouton « Revoir » dans le panneau
     (la relecture passe par « Revoir le cours » sur la carte du niveau) */
  assert.ok(!/id="coursrevoir"/.test(html));
  assert.match(js.engine, /if\(!save\.cours\)save\.cours=\{\};/);
  assert.match(js.engine, /const coursANouveau=!!\(L\.dec&&COURS\[L\.dec\]&&!save\.cours\[L\.dec\]\);/);
  assert.match(js.engine, /decouvertesReussies\(prev\)>=decouvertesMonde\(prev\)\.length/);
  assert.match(js.ui, /dont ses \$\{nbDec\} découvertes/);
  assert.match(js.ui, /Revoir le cours/);
  assert.match(js.render, /function decouverteIco/);
  assert.match(js.ui, /cours:construireCours,montrerCours,fermerCours/);
  assert.match(css, /#coursov\.show\{display:flex;\}/);
  assert.match(css, /\.csavoir\{/);
  assert.match(css, /\.lvcours\{/);
  /* écriture étagée SUR LE PLATEAU (décision du 14/08 sur maquette) : maisons et
     rayons en fractions empilées, les autres écritures inchangées */
  vm.runInContext(js.render, context);
  const plateau = vm.runInContext(`(() => ({
    maison: targetSVG({x:0, y:0, need:[1,4]}, null, '', ''),
    disp: targetSVG({x:0, y:0, need:[1,2], disp:"0,5"}, null, '', ''),
    douze: targetSVG({x:0, y:0, need:[1,12]}, null, '', ''),
    rayon: beamLblSVG(7, 100, 50, [3,4]),
    rayonEntier: beamLblSVG(8, 100, 50, [2,1]),
  }))()`, context);
  assert.ok(plateau.maison.includes('<g class="tneed">') && plateau.maison.includes('y1="71"'),
    "la maison 1/4 s'écrit en fraction empilée, barre dégagée du dénominateur (14/08)");
  assert.match(plateau.disp, /<text class="tneed"[^>]*>0,5<\/text>/,
    "les écritures décimales et pourcentages restent telles quelles");
  assert.ok(plateau.douze.includes('x1="40"'), "barre élargie pour les douzièmes");
  assert.match(plateau.rayon, /^<g class="beamlbl" data-seg="7"/);
  assert.ok(plateau.rayon.includes("font-size:23px") && (plateau.rayon.match(/<text/g) || []).length === 2,
    "l'étiquette de rayon 3/4 est empilée, chiffres à 23 px");
  assert.match(plateau.rayonEntier, /<text class="beamlbl"[^>]*>2<\/text>/,
    "un rayon entier garde son étiquette simple");
  assert.match(js.engine, /function sceneCours/);
  assert.match(js.engine, /function bandeLbl/);
  assert.match(js.engine, /function cEtiq/);
  /* mention Refraction (14/08, textes exacts de Gwenael) : courte au pied de la
     page, complète dans le panneau « D'où vient Solèy ? » */
  assert.match(html, /Solèy est librement adapté de Refraction \(Center for Game Science, université de Washington, 2010\)\./);
  assert.match(html, /id="aproposov" role="dialog" aria-modal="true"/);
  assert.match(html, /L'idée de Solèy vient de Refraction/);
  assert.match(html, /Merci aux créateurs de Refraction\./);
  assert.match(js.ui, /aproposbtn/);
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
  assert.match(thumbnail, />69 NIVEAUX</);
});

test("refonte : le fruit se mérite, les portes orientent, les fruits à valeur trient", () => {
  const context = createGameContext();
  const r = vm.runInContext(`(() => {
    const joue = (i, plan) => {
      cur = i; state.placed = {};
      for (const [ti,x,y] of plan) state.placed[x+","+y] = { def: LV[i].tools[ti], ti };
      return simulate();
    };
    /* P2 (AUDIT-33-IDEES.md, idée 11) : chaque niveau retouché ou nouveau porte un
       solMin — un plan gagnant qui ne ramasse PAS tous les fruits. Depuis l'essai
       du 15/08, la règle n'a PLUS d'exception : « La chambre close » et « Le tour
       close » a été redessinée au solveur et son fruit se mérite désormais comme
       les autres. Il ne reste qu'une exception, « Le tour du lagon » : l'essai du
       15/08 n'a pas su faire mieux que la version en ligne sur la couche fruits,
       le niveau est donc resté tel quel (décision de Gwenael). */
    const EXCEPTIONS = new Set(["Le tour du lagon"]);
    const failures = [];
    let couverts = 0;
    LV.forEach((l, i) => {
      if (!l.solMin) return;
      couverts++;
      const min = joue(i, l.solMin);
      if (!min.win) failures.push(l.name + " : solMin ne gagne pas");
      if (!EXCEPTIONS.has(l.name) && l.fruits.length && min.fruits.size >= l.fruits.length)
        failures.push(l.name + " : solMin ramasse tout, le fruit ne se mérite pas");
      if (l.solB) {
        const b = joue(i, l.solB);
        if (!b.win) failures.push(l.name + " : la deuxième architecture (solB) ne gagne pas");
      }
    });
    /* Portes orientées : bon côté accepte, mauvais côté bloque, sans porte inchangé. */
    const mk = p => ({w:'test',name:'t-porte',sub:'',cols:5,rows:3,
      suns:[{x:0,y:1,dir:1}],targets:[{x:3,y:1,need:[1,1],porte:p}],
      rocks:[],fruits:[],tools:[],sol:[]});
    const portes = [3,1,undefined].map(p => {
      LV.push(mk(p)); cur = LV.length-1; state.placed = {};
      const w = simulate().win; LV.pop(); return w;
    });
    /* Fruit à valeur : un rayon entier ne cueille pas un fruit marqué 1/2. */
    LV.push({w:'test',name:'t-val',sub:'',cols:5,rows:3,
      suns:[{x:0,y:1,dir:1}],targets:[{x:4,y:1,need:[1,1]}],
      rocks:[],fruits:[[2,1,[1,2]]],tools:[],sol:[]});
    cur = LV.length-1; state.placed = {};
    const val = simulate(); LV.pop();
    return { failures, couverts, portes, valWin: val.win, valFruits: val.fruits.size };
  })()`, context);
  assert.deepEqual([...r.failures], []);
  assert.equal(r.couverts, 13, "5 niveaux du lagon retouchés + 8 niveaux de la canne");
  assert.deepEqual([...r.portes], [true, false, true]);
  assert.equal(r.valWin, true);
  assert.equal(r.valFruits, 0, "le rayon entier ne cueille pas le fruit marqué 1/2");
});
