import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Livrets Petit SPLAT! « Je fais le schéma en barres » (26/09/2026, idée de Gwenaël, décisions par
   questions à choix) : trois livrets de plus pour le monde 1 (jusqu'à 20, 50, 100 jetons),
   de nouvelles séries où l'élève dessine lui-même le schéma en barres.
   - 6 fiches, toutes « complète le schéma », schéma NON imprimé (diagram=draw) et
     bande sous le schéma (espace=1) ;
   - 9 cartes par fiche (grid=3x3), dessin resserré : la place gagnée va à la zone où l'élève
     fait son schéma ; « ? = …… » sous chaque carte à faire (reponse=1) ; l'ordre (« contraste
     tôt ») : une tache ; deux taches, 3 cartes sur 9 sans jetons posés (sansjetons=3) ; de 2 à 4
     taches (splats=mix4), 3 sans jetons (4 jusqu'au 26/09 au soir : « c'est un petit peu trop ») ; puis trois fiches de mélange avec 2 cartes sur 9 sans
     jetons, la première de 2 à 4 taches ; fiches 1 et 2 : 1 exemple résolu et 2 schémas donnés
     (exemple=1&donne=2) ; le corrigé met « ? » dans les cases et « ? = … » sous le schéma ;
   - la consigne dit « dessine le schéma » quand le schéma est à tracer, sans autre phrase ;
     la règle du livret est écrite une fois, sur la couverture ;
   - « Jetons autour » (jetons=0) devient aussi une case de Petit Splat classique ;
   - sur la page des livrets, une 2e série « Je fais le schéma en barres » dans l'onglet du monde 1
     (26/09 au soir, choix B : deux boutons au-dessus d'une seule rangée). */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL("../" + p, import.meta.url));
const petit = lire("outils/splat_tache_barre.html");
const render = lire("_sources/livret-petit-splat/render.py");
const page = lire("outils/livrets_splat.html");

function morceau(debut, fin) {
  const a = petit.indexOf(debut);
  const b = petit.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `morceau introuvable : ${debut}`);
  return petit.slice(a, b);
}

/* createItem hors navigateur (sans canvas : les jetons sont posés sans contrôle de place).
   Suffisant pour les NOMBRES d'une carte, pas pour rejouer une série exacte. */
function moteur() {
  const ctx = vm.createContext({ Math, document: { getElementById: () => null } });
  vm.runInContext(
    morceau("const SPLAT_SHAPES = [", "const PRINT_MATHS_GO_LOGO_SRC") +
    "let currentRand = Math.random;\n" +
    morceau("function hashSeed(seed) {", "function makeAutoSeed() {") +
    morceau("function createItem(", "function generateHiddenDots(") +
    `function generateDotPositions(count) { const arr = []; for (let k = 0; k < count; k++) arr.push({ x: 15 + rand() * 270, y: 15 + rand() * 170 }); return { arr, r: 8 }; }
     function generateHiddenDots() { return []; }
     globalThis.__graine = (g) => { currentRand = mulberry32(hashSeed(g)); };
     globalThis.__createItem = createItem;`,
    ctx
  );
  return ctx;
}

const SORTIES = ["livret_petit_splat_dessin", "livret_petit_splat_dessin_avance", "livret_petit_splat_dessin_expert"];

test("outil : « Mélange (2 à 4) » tire 2, 3 ou 4 taches, avec autant de tirages que « 2 à 6 »", () => {
  assert.match(petit, /<option value="mix4">Mélange \(2 à 4\)<\/option>\s*<option value="mix">Mélange Expert \(2 à 6\)<\/option>/);
  const ctx = moteur();
  const vus = new Set();
  for (let g = 0; g < 400; g++) {
    ctx.__graine("mix4-" + g);
    const c = ctx.__createItem("find_hidden", 20, "mix4");
    vus.add(c.numSplats);
    assert.ok(c.numSplats >= 2 && c.numSplats <= 4, `carte à ${c.numSplats} taches`);
    assert.equal(c.total, c.visible + c.numSplats * c.hiddenPerSplat);
  }
  assert.deepEqual([...vus].sort(), [2, 3, 4]);
  // même nombre de tirages : une seule branche, Math.floor(rand() * 3) + 2
  assert.match(petit, /splatMode === 'mix4'\) \{[\s\S]{0,300}numSplats = Math\.floor\(rand\(\) \* 3\) \+ 2;/);
});

test("outil : « Jetons autour » décochée (jetons=0) vaut aussi en Petit Splat classique, sur les cartes « complète le schéma »", () => {
  assert.match(petit, /const sansJetons = !jetonsAutourCoche\(\);/);
  assert.match(petit, /const c = createItem\(gameMode, targetMax, splatMode\);\s*state\.push\(c\.mode === 'find_hidden' \? retirerJetonsSiBesoin\(c, sansJetons\) : c\);/);
  // la case est montrée en classique, « Une tache donnée » reste réservée aux Enquêtes
  assert.match(petit, /show\('relationHintOption', true, 'flex'\);\s*show\('giveOnePartLabel', !isClassic, ''\);/);
  assert.match(petit, /<label class="check-control" id="giveOnePartLabel">/);
  // lue pour tous les types, écrite dans le lien 🔗 et dans le QR de l'outil seulement décochée
  assert.match(petit, /if \(jetonsAutour\) jetonsAutour\.checked = readBooleanParam\(params, 'jetons', true\);/);
  assert.equal((petit.match(/if \(!jetonsAutourCoche\(\)\) params\.set\('jetons', '0'\);/g) || []).length, 2);
});

test("outil : ?sansjetons=N retire les jetons de N cartes, choisies par un hasard À PART (le tirage ne change pas)", () => {
  assert.match(petit, /let sansJetonsNombre = 0;/);
  assert.match(petit, /sansJetonsNombre = problemType === 'classic' && sj > 0 \? Math\.min\(sj, 12\) : 0;/);
  const bloc = morceau("if (problemType === 'classic' && !sansJetons && sansJetonsNombre > 0) {", "renderPages();");
  assert.match(bloc, /mulberry32\(hashSeed\(activeSeed \+ '\|sansjetons'\)\)/);
  assert.match(bloc, /state\[i\]\.mode === 'find_hidden' && state\[i\]\.visible > 0/);
  assert.doesNotMatch(bloc, /\brand\(\)/, "le choix ne consomme pas le hasard du tirage");
  assert.match(bloc, /for \(let k = 0; k < sansJetonsNombre && choix\.length; k\+\+\) \{\s*const j = Math\.floor\(r2\(\) \* choix\.length\);\s*retirerJetonsSiBesoin\(state\[choix\[j\]\], true\);\s*choix\.splice\(j, 1\);/, "N cartes, toutes différentes");
  // gardé dans le lien 🔗 et dans le QR de l'outil
  assert.equal((petit.match(/params\.set\('sansjetons', String\(sansJetonsNombre\)\)/g) || []).length, 2);
  // l'empreinte de la série change seulement quand jetons=0 ou sansjetons=N est posé
  assert.match(petit, /\+ \(jetonsAutourCoche\(\) \? '' : '\|jetons0'\)/);
  assert.match(petit, /'\|sansjetons' \+ sansJetonsNombre : ''\);/);
});

test("outil : la consigne dit « dessine le schéma » quand « Schéma à tracer » est cochée", () => {
  const f = morceau("function getInstructionHtml() {", "\n}\n");
  assert.match(f, /hd && hd\.checked \? 'dessine le schéma en barres, puis' : 'complète le schéma en barres,'/);
  assert.match(petit, /<input type="checkbox" id="hideDiagram" onchange="majSchemaATracer\(\)">/, "la consigne suit la case");
});

test("render.py : les 6 fiches « je fais le schéma en barres », dans l'ordre choisi par Gwenaël", () => {
  assert.match(render, /_F = dict\(ex="find_hidden", espace=True, dessin=True, grid="3x3"\)/, "9 cartes, bande, schéma à faire");
  const bloc = render.slice(render.indexOf("FICHES_DESSIN = ["), render.indexOf("]\n", render.indexOf("FICHES_DESSIN = [")));
  const lignes = bloc.split("\n").filter((l) => l.includes("dict(n="));
  assert.equal(lignes.length, 6);
  const attendu = [['splats="1"', null], ['splats="2"', "sansjetons=3"], ['splats="mix4"', "sansjetons=3"],
                   ['splats="mix4"', "sansjetons=2"], ['splats="mix"', "sansjetons=2"], ['splats="mix"', "sansjetons=2"]];
  lignes.forEach((l, i) => {
    assert.ok(l.includes(`n=${i + 1},`) && l.includes("**_F"), l);
    assert.ok(l.includes(attendu[i][0]), `fiche ${i + 1} : ${attendu[i][0]}`);
    if (attendu[i][1]) assert.ok(l.includes(attendu[i][1]), `fiche ${i + 1} : ${attendu[i][1]}`);
    else assert.ok(!/jetons=/.test(l), `fiche ${i + 1} : des jetons posés`);
  });
  // le schéma n'est pas imprimé (le papier seulement) ; grille, bande et jetons valent aussi pour le QR
  assert.match(render, /\+ \("&diagram=draw&reponse=1" if f\.get\("dessin"\) else ""\)/);
  assert.match(render, /\+ \("&exemple=1&donne=2" if f\.get\("guide"\) else ""\)/);
  assert.equal((render.match(/guide=True/g) || []).length, 2, "fiches 1 et 2 seulement");
  assert.match(render, /f"&grid=\{f\['grid'\]\}" if f\.get\("grid"\)/);
  assert.match(render, /f"&sansjetons=\{f\['sansjetons'\]\}" if f\.get\("sansjetons"\)/);
  assert.match(render, /\+ "&qr=0"/, "un seul QR par page : celui du livret");
  // la couverture (idées de Gwenaël) : deux exemples « ? = … », avec et sans jetons posés, puis la règle
  assert.match(render, /'<b class="attention">ATTENTION&nbsp;!<\/b> Dans ce livret, tu ne dessines '\s*"<b>jamais de jetons<\/b>\. Quand aucun jeton n'est posé autour "\s*"des taches, ils sont tous cachés dessous\."/);
  assert.ok(!/REGLE_DESSIN = \(\s*["']✏/.test(render), "pas de crayon devant une phrase qui dit de ne pas dessiner");
  /* les deux exemples chacun dans son cadre, « ATTENTION ! » dans un cadre noir (noir et blanc) */
  assert.match(render, /\.duo \.ex\{border:1\.4px solid #94a3b8;border-radius:6px;padding:2\.5mm 3mm 3mm\}/);
  assert.match(render, /\.expl \.regle \.attention\{display:inline-block;border:1\.4px solid #0f172a;/);
  assert.match(render, /intro="Sous chaque carte, <b>fais le schéma en barres<\/b>, puis écris ta réponse&nbsp;: <b>\?&nbsp;=&nbsp;…<\/b>"/);
  assert.match(render, /titres=\["Avec des jetons posés", "Sans jeton posé"\]/);
  assert.match(render, /'<div class="rep"><span>\?&nbsp;=&nbsp;' \+ e\.hp \+ '<\/span><\/div>/);
});

test("render.py : trois niveaux, de nouvelles graines, les livrets d'origine inchangés", () => {
  for (const [nom, sortie, qr] of [["dessin", SORTIES[0], "qr/dessin"], ["dessin_avance", SORTIES[1], "qr/dessin-avance"], ["dessin_expert", SORTIES[2], "qr/dessin-expert"]]) {
    const i = render.indexOf(`NIVEAUX["${nom}"] = dict(`);
    assert.ok(i > 0, nom);
    const bloc = render.slice(i, render.indexOf("\n\n", i));
    assert.ok(bloc.includes(`sortie="${sortie}"`) && bloc.includes(`qr="${qr}"`), nom);
    assert.ok(bloc.includes("<br>Je fais le schéma en barres"), `${nom} : « Je fais le schéma en barres » en haut de la couverture`);
    assert.ok(bloc.includes("dessin=dict(COUV_DESSIN, profils="), `${nom} : les deux exemples de la couverture`);
    const graines = /graines=\{([^}]*)\}/.exec(bloc)[1];
    assert.doesNotMatch(graines, /GRAINE/);
    assert.equal((graines.match(/\d+:"\d+"/g) || []).length, 6);
    for (let n = 1; n <= 6; n++) assert.ok(existe(`_sources/livret-petit-splat/${qr}/fiche${n}.png`), `${qr}/fiche${n}.png`);
  }
  // les 6 fiches d'origine n'ont pas bougé
  assert.match(render, /dict\(n=1, t="Complète le schéma",  splats="1",   ex="find_hidden"\),/);
  assert.match(render, /dict\(n=6, t="Dessine en expert",   splats="mix", ex="construct"\),/);
  assert.match(render, /graines=\{1:"441132", 2:"929356", 3:"302672", 4:"514457", 5:"727304", 6:"514457"\}/);
});

test("les 12 PDF existent, la page des livrets les montre dans une 2e rangée du monde 1", () => {
  for (const s of SORTIES) for (const suf of ["", "_a_plier", "_correction", "_correction_a_plier"]) {
    assert.ok(existe(`outils/${s}${suf}.pdf`), `outils/${s}${suf}.pdf`);
    assert.ok(page.includes(`href="/outils/${s}${suf}.pdf"`), `lien vers ${s}${suf}.pdf`);
  }
  const m1 = page.slice(page.indexOf('id="monde-1"'), page.indexOf("</section>", page.indexOf('id="monde-1"')));
  const i1 = m1.indexOf('<h3 class="partie">Je complète le schéma');
  const i2 = m1.indexOf('<h3 class="partie">Je fais le schéma en barres');
  assert.ok(i1 > 0 && i2 > i1, "deux rangées : je complète, puis je dessine");
  assert.equal((m1.slice(i2).match(/<article class="liv">/g) || []).length, 3);
  for (const img of ["livret-petit-splat-dessin", "livret-petit-splat-dessin-avance", "livret-petit-splat-dessin-expert"]) {
    assert.ok(m1.includes(`/assets/img/thumbnails/splat/${img}.png?v=1`), img);
    for (const e of ["png", "webp"]) assert.ok(existe(`assets/img/thumbnails/splat/${img}.${e}`), `${img}.${e}`);
  }
  // les autres onglets ne changent pas : un seul nouvel intitulé de rangée
  assert.equal((page.match(/<h3 class="partie">Je fais le schéma en barres/g) || []).length, 1);
});

test("outil : le corrigé d'une fiche « Schéma à tracer » met « ? » dans les cases des taches et « ? = 6 » dessous", () => {
  assert.match(petit, /if \(isCorrectionPage \|\| estExemple \|\| estDonne\) \{[\s\S]{0,500}textHid = hideDiagram && !isTBI \? '\?' : item\.hiddenPerSplat;/, "« ? » : le nombre cherché");
  assert.match(petit, /if \(\(isCorrectionPage \|\| estExemple\) && hideDiagram && !isTBI && item\.mode === 'find_hidden'\) \{\s*diag\.classList\.add\('avec-reponse'\);\s*diag\.insertAdjacentHTML\('beforeend', `<div class="reponse-corr\$\{estExemple \? ' reponse-bas' : ''\}">\? = \$\{item\.hiddenPerSplat\}<\/div>`\);/);
  assert.match(petit, /\.diagram-container \.reponse-corr \{ position: absolute; left: 0; right: 0; top: calc\(100% \+ 2\.6mm\);/, "pas collé au schéma");
});

test("outil : aucune phrase en plus dans la consigne pour les cartes sans jetons (décision du 26/09/2026)", () => {
  const f = morceau("function getInstructionHtml() {", "\n}\n");
  assert.doesNotMatch(f, /jetonsAutourCoche|sansJetonsNombre/);
});

test("outil : ?exemple=N et ?donne=N — le guidage qui s'efface (fiches 1 et 2 des livrets)", () => {
  assert.match(petit, /let carteExemple = 0;/);
  assert.match(petit, /carteExemple = problemType === 'classic' && ex > 0 \? Math\.min\(ex, 12\) : 0;/);
  assert.match(petit, /const estExemple = carteExemple && hideDiagram && !isCorrectionPage && !isTBI\s*&& item\.mode === 'find_hidden' && state\.indexOf\(item\) < carteExemple;/);
  assert.match(petit, /const estDonne = !estExemple && carteSchemaDonne && hideDiagram && !isCorrectionPage && !isTBI\s*&& item\.mode === 'find_hidden' && rangCarte >= carteExemple && rangCarte < carteExemple \+ carteSchemaDonne;/);
  assert.match(petit, /if \(isCorrectionPage \|\| estExemple \|\| estDonne\) \{/, "schéma imprimé comme au corrigé");
  assert.match(petit, /if \(hideDiagram && !isCorrectionPage && !isTBI && !estExemple && !estDonne\) \{/, "leur schéma est imprimé");
  assert.match(petit, /if \(estExemple\) diag\.insertAdjacentHTML\('beforeend', '<div class="etiquette-exemple etiquette-bas">Exemple<\/div>'\);/);
  assert.match(petit, /\.diagram-container \.etiquette-exemple \{ position: absolute; top: calc\(100% \+ 1\.8mm\); right: 0;/, "sur la ligne de « ? = 7 » : ne cache aucun jeton");
  assert.match(petit, /\.diagram-container \.reponse-corr \{[^}]*text-align: left;/, "« ? = 7 » à gauche");
  // la réponse n'est écrite que pour l'exemple : schéma donné et cartes à faire ont « ? = …… »
  assert.match(petit, /if \(estDonne && ligneReponse\) \{[\s\S]{0,200}<div class="reponse-corr reponse-a-faire">\? = ……<\/div>/);
  assert.match(petit, /if \(ligneReponse && item\.mode === 'find_hidden'\) \{[\s\S]{0,200}<div class="reponse-corr reponse-a-faire">\? = ……<\/div>/);
  assert.doesNotMatch(render.slice(render.indexOf("def reglages(f):"), render.indexOf("def niveau_url(")), /exemple|donne|reponse/, "le papier seulement, pas le QR");
});

test("outil : 9 cases, schéma à faire — dessin resserré, la place va à la zone vide ; pointillés renforcés", () => {
  assert.match(petit, /if \(hideDiagram && !isTBI\) grid\.classList\.add\('schema-a-faire'\);/);
  assert.match(petit, /\.grid\.schema-a-faire \.part-splat \{ border-bottom: 1\.3px dashed #64748b; \}/, "visible en noir et blanc");
  assert.match(petit, /\.activity-print-page \.grid\.schema-a-faire\.grille-3x3 \.part-splat \{ flex: 0 0 125px; \}/);
  assert.match(petit, /\.activity-print-page \.grid\.schema-a-faire\.grille-3x3 \.diagram-container\.zone-vide \{ flex: 1 1 auto; \}/, "seule la zone VIDE grandit : un schéma imprimé garde sa taille");
  assert.match(petit, /diag\.innerHTML = ``;\s*diag\.classList\.add\('zone-vide'\);/);
});

test("outil : en 8 cases avec la bande, le schéma garde sa largeur de 12 cases, centré", () => {
  assert.match(petit, /if \(avecBande\) grid\.classList\.add\('avec-bande', 'grille-' \+ document\.getElementById\('gridSize'\)\.value\);/);
  assert.match(petit, /\.activity-print-page \.grid\.avec-bande\.grille-2x4 \.diagram-container \{ width: 56mm; max-width: 100%; margin-left: auto; margin-right: auto;/);
});

/* 26/09/2026 au soir — retours de Gwenaël sur les planches 13 et 14 :
   - « ? = …… » à compléter : 19 px, tenu par le bas ; sur une carte au schéma donné (9 cases), il
     descend en bas de la case, au niveau des cartes à faire (choix C) ;
   - le panneau : « Ligne ? = … » (reponse=1) avec « Schéma à tracer », et « Sans jetons » (0 à 6,
     ou « toutes » = « Jetons autour » décochée : une fiche entière sans jetons) ;
   - fiches 2 et 3 : 3 cartes sur 9 sans jetons, nouvelles graines ;
   - le dos : la tache de « Pour se souvenir » plus grosse. */
test("outil : « ? = …… » plus gros, tenu par le bas, en bas de la case sur un schéma donné", () => {
  assert.match(petit, /\.diagram-container \.reponse-corr \{[^}]*font-size: 19px;/);
  assert.match(petit, /\.diagram-container \.reponse-corr\.reponse-a-faire,\s*\.diagram-container \.reponse-corr\.reponse-bas \{ top: auto; bottom: calc\(-2\.6mm - 15px\); \}/);
  assert.match(petit, /\.grid\.schema-a-faire\.grille-3x3 \.diagram-container\.schema-donne \{ flex: 1 1 auto; \}/);
  assert.match(petit, /\.diagram-container\.schema-donne > \.diagram-inner \{ flex: 0 0 64px; \}/);
  assert.match(petit, /if \(estDonne \|\| estExemple\) diag\.classList\.add\('schema-donne'\);/);
  // sans la bande, la place sous le schéma est gardée (sinon la case coupait « ? = …… »)
  assert.match(petit, /grid\.classList\.add\('avec-ligne'\)/);
  assert.match(petit, /\.grid\.avec-ligne \.diagram-container \{ margin-bottom: calc\(5px \+ 7\.5mm\); \}/);
});

test("outil : les cases « Ligne ? = … » et « Sans jetons » du panneau", () => {
  assert.match(petit, /<input type="checkbox" id="ligneReponseCase" onchange="majLigneReponse\(\)">\s*<span class="check-text">Ligne \? = …<\/span>/);
  assert.match(petit, /<select id="sansJetonsChoix" onchange="majSansJetons\(\)"/);
  for (const v of ["0", "1", "2", "3", "4", "5", "6", "toutes"]) assert.match(petit, new RegExp(`<option value="${v}"`));
  assert.match(petit, /show\('ligneReponseLabel', isClassic && !!\(hdCase && hdCase\.checked\), 'flex'\);/);
  assert.match(petit, /show\('sansJetonsLabel', isClassic, 'flex'\);/);
  const f = morceau("function majSansJetons() {", "\n}\n");
  assert.match(f, /sel\.value === 'toutes'\) \{ if \(ja\) ja\.checked = false; sansJetonsNombre = 0; \}/);
  assert.match(petit, /if \(problemType === 'classic' && carteSchemaDonne\) params\.set\('donne', String\(carteSchemaDonne\)\);/);
});

test("render.py : nouvelles graines des fiches 2 et 3 (3 sans jetons), le dos à la tache plus grosse", () => {
  assert.match(render, /graines=\{1:"21310007", 2:"22310199", 3:"23310011", 4:"24310055", 5:"25310063", 6:"26310088"\}/);
  assert.match(render, /graines=\{1:"21420011", 2:"22421099", 3:"23420234", 4:"24420016", 5:"25420031", 6:"26420001"\}/);
  assert.match(render, /graines=\{1:"21531069", 2:"22533940", 3:"23530352", 4:"24531050", 5:"25530062", 6:"26530194"\}/);
  const dos = lire("_sources/livret-petit-splat/dos.html");
  assert.match(dos, /<svg width="58" height="52" viewBox="60 10 190 170">/);
});

test("page des livrets : deux boutons choisissent la série du monde 1 (choix B), sans JavaScript les deux rangées restent", () => {
  const m1 = page.slice(page.indexOf('id="monde-1"'), page.indexOf("</section>", page.indexOf('id="monde-1"')));
  assert.match(m1, /<div class="series-choix" role="group"[^>]*>\s*<button type="button" data-serie="complete" aria-pressed="true">Je complète le schéma<\/button>\s*<button type="button" data-serie="schema" aria-pressed="false">Je fais le schéma en barres<\/button>/);
  const a = m1.indexOf('<div class="serie" data-serie="complete">'), b = m1.indexOf('<div class="serie" data-serie="schema">');
  assert.ok(a > 0 && b > a, "deux séries, dans l'ordre");
  assert.equal((m1.slice(a, b).match(/<article class="liv">/g) || []).length, 3);
  assert.equal((m1.slice(b).match(/<article class="liv">/g) || []).length, 3);
  assert.match(page, /\.series-choix\{display:none\}\s*html\.js \.series-choix\{display:flex;/, "sans JavaScript, pas de boutons");
  assert.match(page, /html\.js \.serie > \.partie\{display:none\}/);
  assert.match(page, /s\.hidden = s\.dataset\.serie !== nom;/);
  // la série du premier bouton d'abord : « Je complète le schéma » au monde 1
  assert.match(page, /montre\(groupe\.querySelector\("button\[data-serie\]"\)\.dataset\.serie\);/, "« Je complète le schéma » d'abord");
  // deux groupes de boutons : le monde 1, et le monde 2 (« Avec ? » / « Avec une lettre », 26/09/2026)
  assert.equal((page.match(/class="series-choix"/g) || []).length, 2);
});

test("outil : la carte exemple a « ? = 7 » et EXEMPLE en bas de la case, comme les autres", () => {
  assert.match(petit, /`<div class="reponse-corr\$\{estExemple \? ' reponse-bas' : ''\}">\? = \$\{item\.hiddenPerSplat\}<\/div>`/);
  assert.match(petit, /<div class="etiquette-exemple etiquette-bas">Exemple<\/div>/);
  assert.match(petit, /if \(estDonne \|\| estExemple\) diag\.classList\.add\('schema-donne'\);/);
});
