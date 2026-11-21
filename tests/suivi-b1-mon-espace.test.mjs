// Lot B1 « Mon espace redessiné » (suivi.mathsgo.re, 21/11/2026 — maquette du
// 20/11 et planches validées par Gwenaël, ses choix par questions : teintes A,
// insigne Anzan = grade Flash, mots des planches, rien sous une porte jamais
// ouverte, le gain de la semaine en vert dans la porte).
//
// Ce que ce test garde :
//  - Nunito servie PAR LE SERVEUR (politique de contenu : font-src 'self'),
//    copie exacte de assets/vendor/polices/, et seulement côté Mon espace et
//    Mes cours : l'écran du code ne change pas ;
//  - le bloc « Aujourd'hui », JOUÉ : à faire, ensuite, c'est fait ; Mes cours
//    jamais « faite » ; une activité finie pour de bon sautée ; la séance en
//    direct et l'évaluation devant tout ; la même hauteur dans tous les états ;
//  - les portes, JOUÉES : un ordre fixe (rien ne remonte), l'insigne seulement
//    quand quelque chose est gagné, la ligne qui ne répète pas l'insigne, le
//    gain en vert, rien sous une porte jamais ouverte ;
//  - rien de ce qui vient du serveur ou de la copie de l'onglet ne devient du
//    HTML.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/index.php");
const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") { profondeur -= 1; if (profondeur === 0) return source.slice(position, i + 1); }
  }
  throw new Error("bloc non fermé");
}
function fonction(nom) {
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(page);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(page, m.index);
}

// ------------------------------------------------------------ la police

test("Nunito est servie par le suivi : copie exacte du site, préchargée, et rien d'un autre domaine", () => {
  for (const nom of ["nunito-latin-wght-normal.woff2", "nunito-latin-ext-wght-normal.woff2"]) {
    const original = readFileSync(join(racine, "assets/vendor/polices", nom));
    const copie = readFileSync(join(racine, "_serveur/public/polices", nom));
    assert.ok(original.length > 10000 && original.equals(copie),
      `_serveur/public/polices/${nom} doit être la copie exacte de assets/vendor/polices/${nom} (et partir dans le dossier à déposer)`);
    // Avec son empreinte (10 caractères du md5, calculés par PHP) : gardée un an (lot A).
    const variable = nom.includes("ext") ? "versionNunitoExt" : "versionNunito";
    assert.match(style, new RegExp(`src: url\\(polices/${nom.replace(/\./g, "\\.")}\\?v=<\\?= htmlspecialchars\\(\\$${variable}, ENT_QUOTES\\) \\?>\\) format\\("woff2"\\);`));
    assert.match(page, new RegExp(`\\$${variable} = is_file\\(\\$nunito(Ext)?\\) \\? substr\\(md5_file\\(\\$nunito(Ext)?\\), 0, 10\\) : '0';`));
  }
  assert.match(page, /<link rel="preload" href="polices\/nunito-latin-wght-normal\.woff2\?v=<\?= htmlspecialchars\(\$versionNunito, ENT_QUOTES\) \?>" as="font" type="font\/woff2" crossorigin>/,
    "préchargée : le texte de Mon espace ne change pas de police sous les yeux de l'élève");
  assert.doesNotMatch(page, /fonts\.googleapis|fonts\.gstatic|mathsgo\.re\/assets\/vendor/, "aucune police d'un autre domaine");
  const manifeste = lire("_serveur/public/VERSION");
  assert.match(manifeste, / polices\/nunito-latin-wght-normal\.woff2\n/, "au manifeste : verifier.php dit si elle manque après le FTP");
});

test("l'écran du code et la question « C'est toujours toi ? » ne changent pas de police", () => {
  const regles = style.replace(/\/\*[\s\S]*?\*\//g, "").match(/[^{}]*\{[^{}]*Nunito[^{}]*\}/g).map(r => r.trim());
  const selecteurs = regles.filter(r => !r.startsWith("@font-face")).map(r => r.slice(0, r.indexOf("{")));
  assert.deepEqual(selecteurs.map(s => s.trim()), ["body:not(.sur-code) .entete, #ecran-espace, #ecran-cours"]);
  assert.doesNotMatch(style, /#ecran-code[^{]*\{[^}]*Nunito/);
  assert.doesNotMatch(style, /\.garde[^{]*\{[^}]*Nunito/);
  // L'écran du code garde son HTML (logo, titre, phrase, six cases).
  const code = page.slice(page.indexOf('<section id="ecran-code">'), page.indexOf('<section id="ecran-espace"'));
  assert.match(code, /<h1>Mon espace<\/h1>\s*<p class="sous-titre">Entre le code que ton professeur t’a donné\.<\/p>/);
});

// ------------------------------------------------------------ un faux document

class Noeud {
  constructor(nom) { this.nom = nom; this.enfants = []; this.attributs = {}; this.dataset = {}; this.className = "";
    this.hidden = false; this._texte = ""; this.href = ""; this.id = ""; this.onclick = null; this.innerHTML = "";
    this.proprietes = {}; const n = this;
    this.style = {setProperty(k, v) { n.proprietes[k] = v; }};
    this.classList = {
      add(c) { if (!n.className.split(" ").includes(c)) n.className = `${n.className} ${c}`.trim(); },
      remove(c) { n.className = n.className.split(" ").filter(x => x && x !== c).join(" "); },
      contains(c) { return n.className.split(" ").includes(c); }
    };
  }
  set textContent(v) { this.enfants = []; this._texte = String(v); }
  get textContent() { return this.enfants.length ? this.enfants.map(e => (typeof e === "string" ? e : e.textContent)).join("") : this._texte; }
  append(...n) { this.enfants.push(...n); }
  setAttribute(k, v) { this.attributs[k] = String(v); }
  addEventListener() {}
  tous(sortie = []) { this.enfants.forEach(e => { if (typeof e !== "string") { sortie.push(e); e.tous(sortie); } }); return sortie; }
}
const documentFaux = {createElement: nom => new Noeud(nom), createElementNS: (_e, nom) => new Noeud(nom), createTextNode: t => t};

// La section des portes et celle du bloc, jouées telles qu'elles sont écrites.
const debutPortes = page.indexOf("  // ======================================================== lot B1 : les portes");
const debutJour = page.indexOf("  // ===================================================== lot B1 : « Aujourd'hui »");
const finJour = page.indexOf("  // ------------------------------------------------------- la séance en direct");
const morceau = (de, a) => page.slice(page.indexOf(de), page.indexOf(a, page.indexOf(de)));
const DESSINS = morceau("  const COULEURS_MONDES = {", "  // ------------------------------------------- lot S3")
  .replace(/\n {2}function (?!elementSvg|coffresDuNiveau|pastilleMonde)\w+\([\s\S]*?\n {2}}\n/g, "\n");

function jouer(elements = {}, window = {}) {
  const $ = id => {
    if (!elements[id]) elements[id] = new Noeud(id);
    return elements[id];
  };
  return new Function("document", "window", "$", "icone", "adresseAppli", "ouvrirAppli", "CSS",
    `${DESSINS}\n${page.slice(debutPortes, finJour)}\nreturn {porteDe, insigneDe, ligneDe, poserJour, etapesDuJour};`)(
    documentFaux, window, $, cle => `<svg data-icone="${cle}"></svg>`, appli => `${appli.url}#b=billet`, () => {}, {escape: x => x});
}

const APPLI = cle => ({cle, nom: {"defi-tables": "Défi tables", "splat": "SPLAT!", "cours": "Mes cours", "coffres": "Coffres magiques",
  "flash-anzan": "Anzan", "defi-calcul": "Défi calcul"}[cle] || cle, url: `https://mathsgo.re/${cle}.html`, ancre: null, disponible: true});

// ------------------------------------------------------------ le bloc « Aujourd'hui »

function leBloc({applis, jauges = {}, faits = [], nCours = 3}) {
  const el = {};
  const {poserJour} = jouer(el);
  poserJour(applis.map(APPLI), jauges, {faits}, {billet: "b"}, "ABC234", nCours);
  const $ = id => el[id] || new Noeud(id);
  return {
    cache: el.jour.hidden, fini: el.jour.classList.contains("fini"),
    nom: $("jour-nom").textContent, sous: $("jour-sous").textContent,
    bouton: $("jour-bouton").hidden ? null : $("jour-bouton").textContent, href: $("jour-bouton").href,
    ensuite: $("jour-ensuite").textContent, faits: $("jour-faits").hidden ? null : $("jour-faits").enfants.map(e => e.textContent)
  };
}
const TABLES_DU_JOUR = {"defi-tables": {aujourdhui: {faite: false, texte: "🔔 …", quoi: "10 calculs, puis ton record"}}};

test("« Aujourd'hui », à faire : Défi tables d'abord (sa séance du jour), Mes cours ensuite", () => {
  const bloc = leBloc({applis: ["defi-tables", "coffres", "splat", "cours"], jauges: TABLES_DU_JOUR});
  assert.deepEqual([bloc.nom, bloc.sous, bloc.bouton, bloc.ensuite, bloc.fini],
    ["Défi tables", "10 calculs, puis ton record", "Commencer", "Ensuite : Mes cours", false]);
  assert.equal(bloc.href, "https://mathsgo.re/defi-tables.html#b=billet", "le bouton mène à l'appli avec le billet, jamais le code");
  assert.equal(leBloc({applis: ["defi-tables", "cours"]}).sous, "Ta première séance", "jamais ouverte : rien du moteur");
});

test("« Aujourd'hui », ensuite : Défi tables fait (son jour vert) → Mes cours, qui reste pour la journée", () => {
  const bloc = leBloc({applis: ["defi-tables", "splat", "cours"], jauges: TABLES_DU_JOUR, faits: ["defi-tables", "splat"]});
  assert.deepEqual([bloc.nom, bloc.sous, bloc.bouton, bloc.href, bloc.ensuite],
    ["Mes cours", "3 chapitres", "Ouvrir mes cours", "#cours", "✓ Défi tables"]);
  assert.equal(bloc.fini, false, "Mes cours n'est jamais « faite » : on ne sait pas si la leçon a été lue");
  const memeSiLaCopieLeDit = leBloc({applis: ["defi-tables", "cours"], faits: ["defi-tables", "cours"]});
  assert.deepEqual([memeSiLaCopieLeDit.nom, memeSiLaCopieLeDit.fini], ["Mes cours", false], "même si une copie trafiquée la dit faite");
});

test("« Aujourd'hui », c'est fait : « C'est fait ! », plus de bouton, ce qui a été fait", () => {
  const bloc = leBloc({applis: ["defi-tables", "coffres"], faits: ["defi-tables"], nCours: 0});
  assert.deepEqual([bloc.fini, bloc.nom, bloc.sous, bloc.bouton, bloc.faits, bloc.ensuite],
    [true, "C’est fait !", "Pour aujourd’hui, à toi de choisir.", null, ["✓ Défi tables"], ""]);
  // Le même bloc redessiné le lendemain repart à « à faire ».
  const lendemain = leBloc({applis: ["defi-tables", "coffres"], nCours: 0});
  assert.deepEqual([lendemain.fini, lendemain.bouton, lendemain.faits], [false, "Commencer", null]);
});

test("« Aujourd'hui » sans Défi tables : la première activité de la classe ; finie pour de bon, elle est sautée", () => {
  assert.equal(leBloc({applis: ["splat", "coffres", "cours"]}).nom, "SPLAT!");
  const splatFini = {splat: {fait: 40, total: 40}};
  const bloc = leBloc({applis: ["splat", "coffres", "cours"], jauges: splatFini});
  assert.deepEqual([bloc.nom, bloc.ensuite], ["Mes cours", ""], "SPLAT! fini pour de bon : on passe à la suite, sans « ✓ » de la journée");
  assert.equal(leBloc({applis: ["cours"]}).nom, "Mes cours", "une classe qui n'a que Mes cours");
  assert.equal(leBloc({applis: [], nCours: 0}).cache, true, "rien d'ouvert à la classe : pas de bloc");
});

test("« Aujourd'hui » : la séance en direct et l'évaluation passent devant ; même hauteur dans tous les états", () => {
  assert.match(style, /\.jour-zone > a:not\(\[hidden\]\) ~ \.jour-carte \{ display: none; \}/);
  const zone = page.slice(page.indexOf('<div class="jour-zone" id="jour-zone">'), page.indexOf('<section class="semaine"'));
  const ordre = ['id="direct-lien"', 'id="evaluation-lien"', 'id="jour"'].map(x => zone.indexOf(x));
  assert.ok(ordre[0] > 0 && ordre[1] > ordre[0] && ordre[2] > ordre[1], "les deux cartes-liens AVANT la carte de la journée");
  assert.match(style, /\.jour-carte \{ min-height: 182px; \}\n\s*@media \(max-width: 359px\) \{ \.jour-carte \{ min-height: 204px; \} \}/,
    "plus haut que le plus haut de ses états : rien ne bouge quand il change");
  assert.doesNotMatch(fonction("poserJour"), /\.style\.|scroll/, "le bloc ne change pas de taille par le script");
});

// ------------------------------------------------------------ les portes

function laPorte(cle, jauge, window = {}) {
  const {porteDe} = jouer({}, window);
  const li = porteDe(APPLI(cle), jauge, {billet: "b"}, "ABC234", 3);
  const porte = li.enfants[0];
  const noeuds = porte.tous();
  const insigne = noeuds.find(n => n.className.startsWith("insigne")) || null;
  const ligne = noeuds.find(n => n.className.startsWith("porte-ligne"));
  return {li, porte, insigne, ligne, texteInsigne: insigne ? insigne.textContent : null, texteLigne: ligne.textContent};
}

test("une porte jamais ouverte : son dessin et son nom, rien dessous, pas d'insigne", () => {
  for (const cle of ["defi-tables", "coffres", "flash-anzan", "defi-calcul", "splat"]) {
    const {insigne, texteLigne, porte} = laPorte(cle, null);
    assert.equal(insigne, null, cle);
    assert.equal(texteLigne, "", `${cle} : choix de Gwenaël du 21/11, rien sous le nom`);
    assert.equal(porte.dataset.cle, cle);
  }
});

test("l'insigne : seulement ce qui est gagné, jamais « débutant »", () => {
  assert.equal(laPorte("defi-tables", {aujourdhui: {quoi: "la table de 2"}}).insigne, null, "aucune table : pas de rang");
  const legende = laPorte("defi-tables", {compte: "9 tables passées sur 9", rang: {niveau: 10, cle: "legende", nom: "Légende des tables", lu: "Légende des tables"}});
  assert.deepEqual([legende.texteInsigne, legende.insigne.className, legende.texteLigne], ["Légende", "insigne legende", "9 tables passées sur 9"]);
  assert.equal(legende.insigne.attributs["aria-label"], "Mon rang : Légende des tables");
  assert.equal(laPorte("defi-tables", {compte: "x", rang: {niveau: 2, cle: "<img>", nom: "x"}}).insigne, null, "une clé de rang inconnue : rien");
  const CORE = {CEINTURES: [{nom: "Ceinture blanche", court: "blanche"}, {nom: "Ceinture jaune", court: "jaune"}, {nom: "Ceinture orange", court: "orange"}],
    elementCeinture: () => new Noeud("svg")};
  assert.equal(laPorte("defi-calcul", {fait: 3, total: 129, ceinture: {n: 0, barrettes: 0}}, {MATHSGO_DEFI_CALCUL_CORE: CORE}).insigne, null,
    "la ceinture blanche sans barrette n'est pas encore un gain");
  const calcul = laPorte("defi-calcul", {fait: 64, total: 129, ceinture: {n: 2, barrettes: 1}}, {MATHSGO_DEFI_CALCUL_CORE: CORE});
  assert.deepEqual([calcul.texteInsigne, calcul.texteLigne], ["orange", "64 compétences sues sur 129"]);
  const anzan = laPorte("flash-anzan", {texte: "162 calculs · 11 jours d’entraînement", grade: "10e kyu", colonne: "8e kyu"});
  assert.deepEqual([anzan.texteInsigne, anzan.texteLigne], ["10e kyu", "Colonne : 8e kyu"], "choix 1 : Flash dans l'insigne, Colonne dessous");
  const anzanSansGrade = laPorte("flash-anzan", {texte: "12 calculs · 2 jours d’entraînement", grade: "", colonne: ""});
  assert.deepEqual([anzanSansGrade.insigne, anzanSansGrade.texteLigne], [null, "12 calculs · 2 jours d’entraînement"]);
  const coffres = laPorte("coffres", {niveauGagne: 2, niveau: 3, coffres: 0, cles: "🔑 4 / 10"});
  assert.deepEqual([coffres.texteInsigne, coffres.texteLigne], ["Niveau 2", "🔑 4 / 10"]);
  assert.equal(laPorte("coffres", {niveauGagne: 0, niveau: 1, coffres: 0, cles: "🔑 3 / 10"}).insigne, null);
});

test("la semaine d'un gain : la ligne de la porte devient le gain, en vert", () => {
  const tables = laPorte("defi-tables", {compte: "4 tables passées sur 9", rang: {niveau: 2, cle: "argent", nom: "Argent"}, gain: "↑ table de 4 passée cette semaine"});
  assert.deepEqual([tables.texteLigne, tables.ligne.className, tables.texteInsigne], ["↑ table de 4 passée cette semaine", "porte-ligne gain", "Argent"]);
  assert.match(style, /\.porte-ligne\.gain \{ color: #147447; font-weight: 800; \}/);
});

test("SPLAT! et Mes cours : portes longues ; SPLAT! garde ses six mondes", () => {
  const splat = laPorte("splat", {fait: 13, total: 40, bonus: "✨ 1 bonus", mondes: [1, 2, 3, 4, 5, 6].map(n => ({numero: n, etat: n < 3 ? "fini" : "vide"}))});
  assert.equal(splat.li.className, "long");
  assert.equal(splat.texteLigne, "13 étapes sur 40 · ✨ 1 bonus");
  assert.equal(splat.porte.tous().filter(n => /monde-p/.test(n.attributs.class || "")).length, 6);
  const cours = laPorte("cours", null);
  assert.deepEqual([cours.li.className, cours.porte.id, cours.porte.href, cours.texteLigne], ["long", "cours-lien", "#cours", "3 chapitres"]);
});

test("rien du serveur ni de la copie ne devient du HTML ; les teintes sont celles des applis", () => {
  const code = page.slice(debutPortes, finJour);
  assert.deepEqual(code.match(/innerHTML[^;]*;/g), ["innerHTML = icone(appli.cle);", "innerHTML = CHECK_BLANC;", "innerHTML = icone(appli.cle);"],
    "seulement les dessins écrits dans la page");
  const piege = laPorte("defi-tables", {compte: "<img src=x onerror=alert(1)>", gain: ""});
  assert.equal(piege.texteLigne, "<img src=x onerror=alert(1)>", "écrit comme du texte");
  // Les teintes : relevées dans les dessins des applis et la charte, aucune inventée.
  const teintes = code.slice(code.indexOf("const TEINTES = {"), code.indexOf("};", code.indexOf("const TEINTES = {")));
  const couleurs = [...new Set(teintes.match(/#[0-9a-f]{6}/g))];
  const sources = lire("_serveur/public/suivi.css") + page.slice(page.indexOf("  const ICONES = {"), page.indexOf("  const ICONE_DEFAUT"))
    + lire("outils/calcul_mental/flash_anzan.html") + page.slice(page.indexOf("const COULEURS_MONDES"), page.indexOf("const ETATS_MONDE"));
  const court = c => (/^#(.)\1(.)\2(.)\3$/.test(c) ? `#${c[1]}${c[3]}${c[5]}` : c);
  for (const c of couleurs) assert.ok(sources.toLowerCase().includes(c) || sources.toLowerCase().includes(`${court(c)};`), `${c} doit venir de la charte ou d'une appli`);
});

test("l'ordre des portes est fixe : Mes cours, la classe, SPLAT! ; une porte courte seule devient longue", () => {
  const espace = fonction("afficherEspace");
  assert.match(espace, /const rang = a => \(a\.cle === "cours" \? 0 : a\.cle === "splat" \? 2 : 1\);/);
  assert.match(espace, /if \(courtes\.length % 2 && appli === courtes\[courtes\.length - 1\]\) li\.classList\.add\("long"\);/);
  // Grand écran (retour de Gwenaël, 21/11 : « les gros espaces blancs, non ») : portes toutes égales.
  assert.match(espace, /liste\.style\.setProperty\("--portes", String\(n <= 5 \? Math\.max\(n, 1\) : n === 6 \? 3 : 4\)\);/);
  assert.match(style, /#applis \{ grid-template-columns: repeat\(var\(--portes, 4\), minmax\(0, 1fr\)\); gap: 14px; \}/);
  assert.match(style, /\.porte, li\.long \.porte \{ display: flex; flex-direction: column; align-items: flex-start; min-height: 0;/, "pas de hauteur imposée : pas de grand vide");
  assert.match(style, /@media \(max-width: 359px\) \{\n\s*#applis \{ grid-template-columns: minmax\(0, 1fr\); gap: 10px; \}/, "petit téléphone : une porte par ligne");
});

test("la copie de l'onglet : « faits » ne vaut que le jour de la lecture, et seulement pour des applis connues", () => {
  const source = ["jourDeLAppareil", "jourValide", "espaceLu"].map(fonction).join("\n");
  const Vraie = Date;
  const horloge = class extends Vraie { constructor(...a) { if (a.length) super(...a); else super(2026, 10, 20, 16, 30); } };
  const espaceLu = new Function("Date", "JAUGES", `const CLE_ESPACE = "@espace";\nconst JOUR_VALIDE = /^\\d{4}-\\d{2}-\\d{2}$/;\n${source}\nreturn espaceLu;`)(
    horloge, {"defi-tables": {}, "splat": {}});
  const lu = jour => espaceLu({"@espace": {aujourdhui: jour, faits: ["defi-tables", "<img>", "__proto__", "splat"], jours: [], travail: true}}).faits;
  assert.deepEqual(lu("2026-11-20"), ["defi-tables", "splat"]);
  assert.deepEqual(lu("2026-11-19"), [], "une copie de la veille : rien n'est « fait » aujourd'hui");
  assert.match(fonction("lireJauges"), /if \(semaine\.jours\.includes\(aujourdhui\)\) espace\.faits\.push\(cle\);/, "faite = le jour vert de l'appli");
});

// Correctif « liens » (21/11/2026, capture iPhone de Gwenaël, son choix B) : le
// trait entre deux perles va d'un rond au suivant, jamais dessus, et il n'y en
// a pas de part et d'autre du jour entouré d'orange.
test("Ma semaine : les liens vont d'un rond à l'autre et laissent l'anneau du jour net", () => {
  const regle = /\.semaine-jours li:not\(:first-child\) \.case-jour::before \{([^}]*)\}/.exec(style);
  assert.ok(regle, "la règle du lien existe");
  assert.match(regle[1], /left: calc\(-2px - var\(--ecart\)\); width: var\(--ecart\);/, "départ hors de la bordure de 2 px, longueur = l'écart");
  assert.doesNotMatch(regle[1], /right: 100%/, "plus de départ depuis l'intérieur du rond");
  assert.equal((style.match(/\.case-jour::before \{ width:/g) || []).length, 0, "aucune longueur fixe ajoutée plus loin");
  assert.match(style, /\.semaine-jours \.aujourdhui \.case-jour::before,\n\s*\.semaine-jours \.aujourdhui \+ li \.case-jour::before \{ display: none; \}/);
  assert.match(lire("_serveur/public/suivi.css"), /\*, \*::before, \*::after \{ box-sizing: border-box; \}/, "la largeur d'un rond compte sa bordure");
  // L'écart = la largeur d'un jour moins celle d'un rond, au téléphone et en grand.
  const nombre = re => Number(re.exec(style)[1]);
  assert.equal(nombre(/\.semaine-jours \{ --ecart: (\d+)px; \}/), nombre(/\.semaine-jours li \{ flex-direction: column-reverse; gap: 8px; width: (\d+)px; \}/)
    - nombre(/\.semaine-jours \.case-jour \{ position: relative; width: (\d+)px;/), "téléphone");
  assert.equal(nombre(/ {4}\.semaine-jours \{ --ecart: (\d+)px; \}/), nombre(/ {4}\.semaine-jours li \{ width: (\d+)px; \}/)
    - nombre(/ {4}\.semaine-jours \.case-jour \{ width: (\d+)px;/), "grand écran");
});
