import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Relecture du monde 1 par Gwenaël, lot 4 « la bande sous le schéma » (26/09/2026).
   Décisions prises par questions à choix :
   - une bande vide de 7,5 mm sous le schéma des fiches 4 et 5, sans accolade, toujours 12
     cartes, mêmes graines ; dans l'OUTIL, en option « Espace sous le schéma » (décochée par
     défaut : rien ne change pour qui ne la coche pas), cochée par le livret ;
   - taches et jetons REDISTRIBUÉS sur toute la largeur de la case (pas une image réduite),
     à leur taille imprimée, sans passer sous le cadre du total ;
   - le TIRAGE ne change pas : la table de dessin place tout sans aucun hasard ;
   - même bande sur la page de correction ; l'écran ne change pas, SAUF par le QR des
     fiches 4 et 5 (espace=1), qui montre le dessin de la feuille ;
   - « Schéma à tracer » ne fait plus grossir le dessin (Enquête, Système) ;
   - couverture : Prénom et Classe remontent dans leur case.
   Les 72 cartes réelles des livrets sont mesurées au navigateur par la preuve du lot
   (splat-relecture\lot4\preuve-lot4.py) ; ici, la table de dessin est rejouée hors
   navigateur sur des milliers de cartes du même genre. */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const petit = lire("outils/splat_tache_barre.html");
const render = lire("_sources/livret-petit-splat/render.py");

function morceau(debut, fin) {
  const a = petit.indexOf(debut);
  const b = petit.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `morceau introuvable : ${debut}`);
  return petit.slice(a, b);
}

function moteur() {
  const ctx = vm.createContext({ Math, document: { getElementById: () => null } });
  vm.runInContext(
    morceau("const SPLAT_SHAPES = [", "const PRINT_MATHS_GO_LOGO_SRC") +
    "let currentRand = Math.random;\n" +
    morceau("function hashSeed(seed) {", "function makeAutoSeed() {") +
    morceau("function createItem(", "function generateHiddenDots(") +
    morceau("/* ===== Espace sous le schéma", "function getSplatSvgBande(") +
    /* Hors navigateur, pas de canvas : les jetons visibles sont tirés comme dans l'outil
       (hors des taches, hors du coin du total), avec les contours en polygones. */
    `function generateDotPositions(count, maxTarget, splatShape, splats) {
       const r = maxTarget > 50 ? 5 : 8, arr = [];
       for (let k = 0; k < count; k++) {
         for (let essai = 0; essai < 400; essai++) {
           const x = 15 + rand() * 270, y = 15 + rand() * 170;
           if (x > 220 && y < 80) continue;
           if (splats.some(s => bandeDistanceTache(s, splatShape, x, y) < r + 6)) continue;
           if (arr.some(p => Math.hypot(p.x - x, p.y - y) < 2.2 * r)) continue;
           arr.push({ x, y }); break;
         }
       }
       return { arr, r };
     }
     function generateHiddenDots() { return []; }
     globalThis.__graine = (g) => { currentRand = mulberry32(hashSeed(g)); };
     globalThis.__sansHasard = () => { currentRand = () => { throw new Error("la table de dessin a tiré au hasard"); }; };
     globalThis.__api = { createItem, tableDeDessinBande, bandeDistanceTache, bandePolygones, BANDE_CADRE, BANDE_VUE_L };`,
    ctx
  );
  return ctx;
}

/* Écarts d'une carte redessinée, en rayons de jeton (et en unités pour les taches). */
function mesurer(api, item, d) {
  const r = d.dots.r, L = d.L;
  const forme = (s) => (s.pathIndex !== undefined ? s.pathIndex : item.splatShape);
  const m = { jeton: 99, tache: 99, bord: 99, cadre: 99, tacheTache: 999, tacheBord: 999, tacheCadre: 999 };
  d.dots.arr.forEach((a, i) => {
    d.dots.arr.forEach((b, j) => { if (j > i) m.jeton = Math.min(m.jeton, (Math.hypot(a.x - b.x, a.y - b.y) - 2 * r) / r); });
    d.splats.forEach((s) => { m.tache = Math.min(m.tache, (api.bandeDistanceTache(s, forme(s), a.x, a.y) - r) / r); });
    m.bord = Math.min(m.bord, (a.x - r) / r, (L - a.x - r) / r, (a.y - r) / r, (200 - a.y - r) / r);
    const dx = Math.max(0, L - api.BANDE_CADRE - a.x), dy = Math.max(0, a.y - api.BANDE_CADRE);
    m.cadre = Math.min(m.cadre, (Math.hypot(dx, dy) - r) / r);
  });
  d.splats.forEach((s, i) => {
    const rad = s.rot * Math.PI / 180;
    for (const [px, py] of api.bandePolygones()[forme(s) % 5]) {
      const x = (px - 150) * s.scale, y = (py - 100) * s.scale;
      const X = s.cx + x * Math.cos(rad) - y * Math.sin(rad), Y = s.cy + x * Math.sin(rad) + y * Math.cos(rad);
      m.tacheBord = Math.min(m.tacheBord, X, L - X, Y, 200 - Y);
      m.tacheCadre = Math.min(m.tacheCadre, Math.max(L - api.BANDE_CADRE - X, Y - api.BANDE_CADRE));
      d.splats.forEach((t, j) => { if (j !== i) m.tacheTache = Math.min(m.tacheTache, api.bandeDistanceTache(t, forme(t), X, Y)); });
    }
  });
  return m;
}

test("la table de dessin : rien ne se touche, rien sous le cadre du total, sans aucun tirage", () => {
  const ctx = moteur();
  const api = ctx.__api;
  const pire = { jeton: 99, tache: 99, bord: 99, cadre: 99, tacheTache: 999, tacheBord: 999, tacheCadre: 999 };
  let cartes = 0, jetons = 0;
  for (const cible of [20, 50, 100]) {
    for (const taches of ["2", "3", "4", "5", "6"]) {
      for (let g = 1; g <= 1; g++) {
        ctx.__graine(`lot4-${cible}-${taches}-${g}`);
        const serie = Array.from({ length: 12 }, () => api.createItem("find_hidden", cible, taches));
        for (const item of serie) {
          const avant = JSON.stringify(item);
          for (const L of [api.BANDE_VUE_L["3x4"], api.BANDE_VUE_L["2x4"]]) {
            ctx.__sansHasard();
            const d = api.tableDeDessinBande(item, L);
            assert.equal(d.dots.arr.length, item.dots.arr.length, "autant de jetons qu'au tirage");
            assert.equal(d.splats.length, item.numSplats, "autant de taches");
            assert.deepEqual(api.tableDeDessinBande(item, L), d, "même carte, même dessin");
            const m = mesurer(api, item, d);
            for (const k of Object.keys(pire)) pire[k] = Math.min(pire[k], m[k]);
            cartes++; jetons += d.dots.arr.length;
          }
          assert.equal(JSON.stringify(item), avant, "la carte tirée n'est pas modifiée");
        }
      }
    }
  }
  assert.ok(cartes >= 300 && jetons > 2000, `${cartes} cartes, ${jetons} jetons`);
  // écarts en rayons de jeton (le palier confortable de la table de dessin)
  assert.ok(pire.jeton >= 0.99, `deux jetons à ${pire.jeton} rayon`);
  assert.ok(pire.tache >= 0.77, `jeton à ${pire.tache} rayon d'une tache`);
  assert.ok(pire.bord >= 0.39, `jeton à ${pire.bord} rayon du bord`);
  assert.ok(pire.cadre >= 0.79, `jeton à ${pire.cadre} rayon du cadre du total`);
  // les taches : séparées, dans le dessin, jamais sous le cadre du total (unités de la vue)
  assert.ok(pire.tacheTache >= 11.5, `deux taches à ${pire.tacheTache} unités`);
  assert.ok(pire.tacheBord >= 4.5, `tache à ${pire.tacheBord} unités du bord`);
  assert.ok(pire.tacheCadre > 0, "une tache passe sous le cadre du total");
});

test("les taches et les jetons gardent leur taille imprimée", () => {
  // avant la bande : 200 unités pour 35,5 mm ; avec la bande : 200 pour 27,2 mm (livret)
  const echelle = 35.5 / 27.2;
  const k = (nom) => Number(petit.match(new RegExp(`const ${nom} = ([\\d.]+);`))[1]);
  assert.ok(Math.abs(k("BANDE_ECHELLE_JETON") - echelle) < 0.02);
  assert.ok(Math.abs(k("BANDE_ECHELLE_TACHE") - echelle) < 0.02);
});

test("l'option « Espace sous le schéma » : décochée par défaut, retenue par le lien, bande de 7,5 mm", () => {
  assert.match(petit, /<input type="checkbox" id="espaceSchema" onchange="renderPages\(\)">\s*<span class="check-text" data-i18n="opt_espace">Espace sous le schéma<\/span>/);
  assert.doesNotMatch(petit, /id="espaceSchema"[^>]*checked/, "décochée par défaut");
  assert.match(petit, /'diagram', 'scale', 'espace', 'jetons', 'title', 'parcours'\]/);
  assert.match(petit, /espaceSchema\.checked = readBooleanParam\(params, 'espace', false\);/);
  assert.match(petit, /if \(problemType === 'classic' && document\.getElementById\('espaceSchema'\)\.checked\) params\.set\('espace', '1'\);/);
  assert.match(petit, /show\('espaceSchemaOption', isClassic, 'flex'\);/, "seulement pour le Petit Splat classique");
  // la fiche imprimée seulement (ni l'interactif ni le parcours élève), classique seulement
  assert.match(petit, /return !!\(c && c\.checked\) && !isTBI && !isEleve && getProblemType\(\) === 'classic';/);
  assert.match(petit, /\.activity-print-page \.grid\.avec-bande \.diagram-container \{ margin-bottom: calc\(5px \+ 7\.5mm\); \}/);
  // énoncé ET correction : createPageElement sert aux deux pages
  assert.match(petit, /const avecBande = bandeActive\(\);\s*if \(avecBande\) grid\.classList\.add\('avec-bande'\);/);
  assert.match(petit, /let htmlContent = avecBande \? getSplatSvgBande\(item, showVisualDots\) : getSplatSvg\(item, showVisualDots, hideVisualDotsUntilReveal\);/);
  // 12 et 8 cases redessinées ; 9 cases : la case reste haute, dessin d'origine
  assert.match(petit, /const BANDE_VUE_L = \{ '3x4': 450, '2x4': 690 \};/);
});

test("à l'écran, seul espace=1 (QR des fiches 4 et 5) montre le dessin de la feuille", () => {
  assert.match(petit, /return !!\(c && c\.checked\) && getProblemType\(\) === 'classic' && item\.mode === 'find_hidden';/);
  assert.match(petit, /\(eleveDessinBande\(item\) \? getSplatSvgBande\(item, true, true, BANDE_VUE_L\['3x4'\]\) : getSplatSvg\(item, !estConstruct, false, true\)\)/);
  // le cadre du total se cale sur la vraie largeur du dessin
  assert.match(petit, /viewBox="0 0 \$\{L\} 200" data-vbw="\$\{L\}"/);
  // la lecture du paramètre vaut pour tous les supports (pas seulement la fiche)
  const lecture = petit.indexOf("espaceSchema.checked = readBooleanParam");
  const fiche = petit.indexOf("if (document.getElementById('supportMode').value === 'print') {\n        const showCorr");
  assert.ok(lecture > 0 && fiche > lecture, "lu avant la partie réservée à la fiche");
});

test("render.py : l'espace sur les fiches 4 et 5 seulement, et leur QR le porte", () => {
  assert.match(render, /dict\(n=4, t="Deux taches",\s+splats="2",\s+ex="find_hidden", espace=True\),/);
  assert.match(render, /dict\(n=5, t="Plein de taches !",\s+splats="mix", ex="find_hidden", espace=True\),/);
  assert.equal((render.match(/espace=True/g) || []).length, 2);
  assert.equal((render.match(/\+ \("&espace=1" if f\.get\("espace"\) else ""\)/g) || []).length, 2, "fiche imprimée et QR");
});

test("« Schéma à tracer » : le schéma est caché, pas retiré (le dessin ne grossit plus)", () => {
  const cellule = morceau("function renderRelationCell(", "function createPageElement(");
  assert.doesNotMatch(cellule, /diag\.innerHTML = ``;/);
  assert.match(cellule, /const aTracer = hideDiagram && !isCorrectionPage && !isTBI;\s*if \(aTracer\) diag\.classList\.add\('schema-a-tracer'\);/);
  assert.match(petit, /\.schema-a-tracer > \* \{ visibility: hidden; \}/);
});

test("couverture : Prénom et Classe en haut de leur case, la case garde sa taille", () => {
  const couv = lire("_sources/livret-petit-splat/couverture.html");
  // 4 + 11 mm avant, 2,2 + 12,8 mm après : même hauteur
  assert.match(couv, /\.ident \.champ\{flex:1;border:1\.4px solid #5b6574;border-radius:6px;padding:2\.2mm 4mm 12\.8mm\}/);
});

test("« Jetons autour » (Enquêtes, Système) : cochée par défaut ; décochée, mêmes cartes sans jetons visibles", () => {
  assert.match(petit, /<input type="checkbox" id="jetonsAutour" checked onchange="startGen\(\)">\s*<span class="check-text">Jetons autour<\/span>/);
  assert.match(petit, /jetonsAutour\.checked = readBooleanParam\(params, 'jetons', true\);/);
  assert.match(petit, /if \(!jetonsAutourCoche\(\)\) params\.set\('jetons', '0'\);/, "écrit seulement décochée");
  assert.match(petit, /'espace', 'jetons', 'title', 'parcours'\]/);
  assert.match(petit, /const sansJetons = problemType !== 'classic' && !jetonsAutourCoche\(\);/);
  for (const f of ["createRelation2Item", "createRelation3Item", "createSums3Item"])
    assert.match(petit, new RegExp(`state\\.push\\(retirerJetonsSiBesoin\\(${f}\\(targetMax\\), sansJetons\\)\\);`));
  // la carte est tirée d'abord (même hasard), puis on retire les jetons visibles
  const ctx = vm.createContext({});
  vm.runInContext(morceau("function retirerJetonsSiBesoin(", "function generateHiddenDotsBySplat(") + "globalThis.f = retirerJetonsSiBesoin;", ctx);
  const j = (o) => JSON.parse(JSON.stringify(o));   // objets venus du contexte vm
  const carte = () => ({ total: 19, visible: 4, hidden: 15, parts: [{ value: 5 }, { value: 10 }], dots: { arr: [{ x: 1, y: 2 }], r: 8 } });
  assert.deepEqual(j(ctx.f(carte(), false)), carte(), "cochée : rien ne change");
  const sans = j(ctx.f(carte(), true));
  assert.equal(sans.visible, 0);
  assert.equal(sans.total, 15, "le total devient la somme des taches");
  assert.deepEqual(sans.dots, { arr: [], r: 8 });
  assert.deepEqual(sans.parts, carte().parts, "mêmes taches");
});
