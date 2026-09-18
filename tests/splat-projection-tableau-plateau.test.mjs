/* Splat classique, écran de projection (usage libre, boutons ◀ ▶), 18/09/2026.
   En mode B « Paquets de jetons » avec cinq taches, le tableau de droite recouvrait
   le bord droit du plateau : centré sur x = 1240, il s'élargit avec le nombre de cases
   (largeur minimale par nombre) et son bord gauche repassait sous x = 956, là où
   s'arrête le plateau. Il reste désormais entre le plateau (+ 30) et le bord de la
   scène (1570), quitte à réduire ses cases ; le bouton Résoudre et les lignes écrites
   dessous suivent le tableau réellement dessiné. Et la première ligne d'équation ne
   remonte plus quand le bloc a deux ou trois lignes : il grandit vers le bas.

   Ce fichier dessine les cartes avec le vrai renderCard() de la page : toutes les
   fonctions de premier niveau du script sont chargées dans un bac à sable, sur un
   mini-DOM SVG qui garde les attributs. Aucune mesure de texte n'y est réelle : les
   positions testées ne dépendent que des attributs (x, width, transform…). */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const debutScript = html.indexOf("<script>\n");
assert.notEqual(debutScript, -1, "le script de la page doit exister");
const lignesScript = html.slice(debutScript + "<script>\n".length, html.indexOf("</script>", debutScript)).split("\n");

// Les fonctions de premier niveau : chacune tient sur une ligne ou se ferme par une
// accolade seule en colonne 0 (aucune autre ligne de son corps n'y commence).
function fonctionsDeLaPage(){
  const sources = [];
  for(let i = 0; i < lignesScript.length; i++){
    if(!/^(async )?function [\w$]+\s*\(/.test(lignesScript[i])) continue;
    const ligne = lignesScript[i].trim();
    if(ligne.endsWith("}") && (ligne.match(/{/g) || []).length === (ligne.match(/}/g) || []).length){
      sources.push(lignesScript[i]);
      continue;
    }
    let j = i + 1;
    while(j < lignesScript.length && lignesScript[j] !== "}"){
      assert.doesNotMatch(lignesScript[j], /^\S/, `script de splat.html, ligne ${j + 1} : fonction mal découpée`);
      j++;
    }
    sources.push(lignesScript.slice(i, j + 1).join("\n"));
    i = j;
  }
  return sources;
}

// Une déclaration de premier niveau tenant sur une ligne (« const svg = … ; »).
function declarationDeLaPage(nom){
  const ligne = lignesScript.find(l => new RegExp(`^(const|let) ${nom} = .*;\\s*$`).test(l));
  assert.ok(ligne, `déclaration ${nom} introuvable dans splat.html`);
  return ligne;
}

function constanteDeRenderCard(nom){
  const m = html.match(new RegExp(`const ${nom} = (\\d+);`));
  assert.ok(m, `${nom} introuvable`);
  return Number(m[1]);
}

class NoeudSvg {
  constructor(tagName){
    this.tagName = tagName;
    this.attributs = new Map();
    this.enfants = [];
    this.parentNode = null;
    this.textContent = "";
  }
  setAttribute(nom, valeur){ this.attributs.set(nom, String(valeur)); }
  getAttribute(nom){ return this.attributs.has(nom) ? this.attributs.get(nom) : null; }
  appendChild(n){ return this.insertBefore(n, null); }
  insertBefore(n, ref){
    if(n.parentNode) n.parentNode.removeChild(n);
    const k = ref ? this.enfants.indexOf(ref) : -1;
    this.enfants.splice(k < 0 ? this.enfants.length : k, 0, n);
    n.parentNode = this;
    return n;
  }
  removeChild(n){
    const k = this.enfants.indexOf(n);
    if(k >= 0) this.enfants.splice(k, 1);
    n.parentNode = null;
    return n;
  }
  get firstChild(){ return this.enfants[0] || null; }
  addEventListener(){}
  getBBox(){ return { x: 0, y: 0, width: 0, height: 0 }; }
  num(nom){ return Number(this.getAttribute(nom)); }
  *descendants(){ for(const e of this.enfants){ yield e; yield* e.descendants(); } }
  parId(id){ for(const n of this.descendants()) if(n.getAttribute("id") === id) return n; return null; }
}

function proche(a, b, message){
  assert.ok(Math.abs(a - b) < 1e-6, `${message} : ${a} au lieu de ${b}`);
}

const scene = new NoeudSvg("svg");
const bacASable = vm.createContext({
  console,
  document: {
    createElementNS: (_ns, nom) => new NoeudSvg(nom),
    createElement: () => ({ getContext: () => null }),   // pas de toile : largeurs de texte estimées
    getElementById: id => ({ mainSvg: scene, activity: { value: "N" }, numColorMode: { checked: false } })[id] || null,
    body: { classList: { contains: () => false } },
    fullscreenElement: null
  }
});
vm.runInContext([
  ...fonctionsDeLaPage(),
  ...["activityEl", "svg", "xChar", "variableChars", "variableCharSet", "numberedQuestionMarkMode",
    "_textMeasureContext", "EQ_OP_ARROW_COLOR", "EQUATION_MATH_FONT"].map(declarationDeLaPage)
].join("\n"), bacASable);

const BAR_CENTER_X = constanteDeRenderCard("abBarCenterX");
const EQUATION_CENTER_X = constanteDeRenderCard("abEquationCenterX");
const EQUATION_START_Y = constanteDeRenderCard("abEquationStartY");

// Carte B telle que la fabrique le générateur (valeurs seulement : ni positions ni lettre).
function carteB(total, visibles, tache, taches){
  const hiddenByTask = Array.from({ length: taches }, () => [tache]);
  return { family: "N", total, visible: visibles, hidden: hiddenByTask.flat(), _num: { tasks: taches, H: tache, hiddenByTask } };
}

// Dessine la carte à l'étape donnée (0 = énoncé, 1 = tableau vide, 2 = tableau + Résoudre
// + équation, 3 = résolution) et relève ce que la page a réellement posé.
function rendre(carte, etape){
  bacASable.renderCard(carte, etape);
  const plateauGroupe = scene.parId("introTrayShift");
  const [, tx, , s] = plateauGroupe.getAttribute("transform").match(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)/);
  const plateau = plateauGroupe.enfants.find(n => n.tagName === "rect");
  const bordPlateau = Number(tx) + Number(s) * (plateau.num("x") + plateau.num("width"));
  const groupe = scene.parId("bottomBarModelAB");
  if(!groupe) return { bordPlateau };
  const cadre = groupe.enfants.find(n => n.tagName === "rect");
  const tableau = { x: cadre.num("x"), width: cadre.num("width"), y: cadre.num("y"), height: cadre.num("height") };
  tableau.centre = tableau.x + tableau.width / 2;
  const ySepare = groupe.enfants.find(n => n.tagName === "line").num("y1");
  const cases = groupe.enfants.filter(n => n.tagName === "rect" && n.num("y") === ySepare)
    .map(r => ({ x: r.num("x"), width: r.num("width") }));
  const textes = groupe.enfants.filter(n => n.tagName === "text" && n.textContent !== "");
  const dansTableau = t => t.num("y") >= tableau.y && t.num("y") <= tableau.y + tableau.height;
  const totalHaut = textes.find(t => dansTableau(t) && t.num("y") < ySepare);
  const textesCases = textes.filter(t => dansTableau(t) && t.num("y") > ySepare);
  const lignes = textes.filter(t => !dansTableau(t) && t.getAttribute("fill") !== "#b45309");
  const ordonnees = [...new Set(lignes.map(t => t.num("y")))].sort((a, b) => a - b);
  const egal = lignes.find(t => t.textContent === "=" && t.num("y") === ordonnees[0]);
  const bouton = groupe.enfants.find(n => n.getAttribute("id") === "btnEquabarSolveAB");
  const boutonX = bouton ? Number(bouton.getAttribute("transform").match(/translate\(([-\d.]+)/)[1]) : null;
  return { bordPlateau, tableau, cases, totalHaut, textesCases, ordonnees, egal, boutonX };
}

const GRAINE_18 = carteB(36, [21, 5], 2, 5);        // graine 18, carte 1 : 26 + 5𝑥 = 36
const CARTE_104 = carteB(104, [19], 17, 5);         // la carte de Gwenaël : six cases à deux chiffres
const TRES_LARGE = carteB(1000, [280], 120, 6);     // sept cases à trois chiffres : le cas extrême

test("à 5 taches, le tableau ne recouvre plus le plateau et reste dans la scène", () => {
  for(const carte of [GRAINE_18, CARTE_104, TRES_LARGE]){
    for(const etape of [1, 2, 3]){
      const { bordPlateau, tableau } = rendre(carte, etape);
      assert.ok(tableau.x >= bordPlateau + 20, `total ${carte.total}, étape ${etape} : tableau à x = ${tableau.x}`);
      assert.ok(tableau.x + tableau.width <= 1580, `total ${carte.total}, étape ${etape} : tableau jusqu'à ${tableau.x + tableau.width}`);
    }
  }
});

test("le tableau garde la même place d'une étape à l'autre", () => {
  for(const carte of [GRAINE_18, CARTE_104, TRES_LARGE]){
    const [un, deux, trois] = [1, 2, 3].map(etape => rendre(carte, etape).tableau);
    assert.deepEqual(deux, un);
    assert.deepEqual(trois, un);
  }
});

test("les cases réduites gardent leurs nombres à l'intérieur, en police lisible", () => {
  for(const carte of [GRAINE_18, CARTE_104, TRES_LARGE]){
    const { cases, textesCases } = rendre(carte, 3);
    assert.equal(textesCases.length, cases.length);
    textesCases.forEach((t, i) => {
      const police = t.num("font-size");
      assert.ok(police >= 44 && police <= 70, `police des cases : ${police}`);
      const largeurTexte = t.textContent.length * police * 0.56;   // estimation de la page
      assert.ok(largeurTexte <= cases[i].width - 2, `« ${t.textContent} » (${largeurTexte}) dans une case de ${cases[i].width}`);
    });
  }
  // la carte de Gwenaël tient en réduisant à peine : six cases de deux chiffres
  const police104 = rendre(CARTE_104, 3).textesCases[0].num("font-size");
  assert.ok(police104 >= 60 && police104 < 70, `police de la carte 104 : ${police104}`);
});

test("le total, le bouton Résoudre et l'équation suivent le tableau réellement dessiné", () => {
  for(const carte of [GRAINE_18, CARTE_104, TRES_LARGE]){
    const deux = rendre(carte, 2);
    proche(deux.totalHaut.num("x"), deux.tableau.centre, "total centré sur le tableau");
    proche(deux.boutonX + 56, deux.tableau.centre, "bouton Résoudre centré sur le tableau");
    const trois = rendre(carte, 3);
    // même écart signe égal / milieu du tableau que lorsque le tableau est centré sur abBarCenterX
    proche(trois.egal.num("x") - trois.tableau.centre, EQUATION_CENTER_X - BAR_CENTER_X, "équation sous le tableau");
  }
});

test("à 1 ou 2 taches, le tableau n'a pas bougé : centré sur abBarCenterX, police 70", () => {
  const uneTache = carteB(36, [21], 15, 1);        // 21 + 𝑥 = 36
  const deuxTaches = carteB(50, [20], 15, 2);      // 20 + 2𝑥 = 50
  const sansJeton = carteB(40, [], 20, 2);         // 2𝑥 = 40
  for(const carte of [uneTache, deuxTaches, sansJeton]){
    for(const etape of [1, 2, 3]){
      const { tableau, textesCases, egal } = rendre(carte, etape);
      proche(tableau.centre, BAR_CENTER_X, "milieu du tableau");
      textesCases.filter(t => /^\d+$/.test(t.textContent)).forEach(t => assert.equal(t.num("font-size"), 70));
      if(egal) assert.equal(egal.num("x"), EQUATION_CENTER_X);
    }
  }
});

test("la première ligne d'équation reste à abEquationStartY, le bloc grandit vers le bas", () => {
  const uneLigne = { family: "N", total: 12, visible: [], hidden: [12], _num: { tasks: 1, H: 12, hiddenByTask: [[12]] } };
  const deuxLignes = carteB(36, [21], 15, 1);
  const cas = [[uneLigne, 1], [deuxLignes, 2], [GRAINE_18, 3], [CARTE_104, 3]];
  for(const [carte, nbLignes] of cas){
    const deux = rendre(carte, 2);
    assert.deepEqual(deux.ordonnees, [EQUATION_START_Y], "étape 2 : la première équation seule, à sa place");
    const trois = rendre(carte, 3);
    assert.equal(trois.ordonnees.length, nbLignes);
    trois.ordonnees.forEach((y, i) => assert.equal(y, EQUATION_START_Y + i * 56));
    assert.ok(trois.ordonnees.at(-1) + 46 < 1000, "le bloc reste dans la scène");
  }
});

test("sans minX ni maxX, drawBarModelPartsInGroup centre toujours le tableau sur cx", () => {
  const g = new NoeudSvg("g");
  const parts = [{ value: 19 }, ...Array.from({ length: 5 }, () => ({ value: 17, hidden: true }))];
  const w = bacASable.drawBarModelPartsInGroup(g, 1240, 260, 104, parts, {
    rect: a => { const n = new NoeudSvg("rect"); for(const k in a) n.setAttribute(k, a[k]); return n; },
    line: a => { const n = new NoeudSvg("line"); for(const k in a) n.setAttribute(k, a[k]); return n; },
    text: (x, y, t, a) => { const n = new NoeudSvg("text"); n.setAttribute("x", x); n.setAttribute("y", y); for(const k in a) n.setAttribute(k, a[k]); n.textContent = t; return n; },
    w: 380, fontTop: 70, fontBottom: 70
  });
  const cadre = g.enfants[0];
  assert.equal(cadre.num("x"), 1240 - w / 2, "centré, même s'il dépasse à gauche");
  assert.ok(w > 600, `six cases de deux chiffres en police 70 : ${w}`);
});
