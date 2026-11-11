// Page « Mon espace » de suivi.mathsgo.re — le premier écran des élèves.
// 04/10/2026 (Gwenaël) : la phrase sous la case du code était fausse (« ce
// sont des zéros et des uns… si tu hésites, c'est un chiffre ») — un code n'a
// ni O, ni I, ni 0, ni 1. Et le bouton « Entrer » était collé à gauche.
// 05/10/2026 (Gwenaël : « c'est le premier écran que voient les élèves, on
// peut leur faire un beau premier écran ») : le code en six cases, le logo
// grand et centré, sans en-tête sur cet écran (version A de la planche,
// sans les dessins des activités : « ils vont les voir à l'intérieur, et ça
// risque de changer »).
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

// Lot « code en cases » (novembre 2026) : le dessin et la saisie des six cases
// vivent dans le module commun code-en-cases.js (copie du serveur), le même que
// la question « C'est toujours toi ? ». Ces tests exécutent le module monté sur
// la case du code avec la règle de nettoyage de la page.
const CEC = createRequire(import.meta.url)("../_serveur/public/code-en-cases.js");

const page = await readFile(new URL("../_serveur/public/index.php", import.meta.url), "utf8");
const codes = await readFile(new URL("../_serveur/public/lib/codes.php", import.meta.url), "utf8");

test("plus de phrase sous la carte, plus de conseil faux : les six cases disent tout", () => {
  const alphabet = codes.match(/const ALPHABET_CODE = '([^']+)';/)[1];
  assert.ok(!/[O0I1]/.test(alphabet), "l'alphabet n'a ni O, ni 0, ni I, ni 1");
  assert.match(codes, /const LONGUEUR_CODE = 6;/, "six cases : le code a 6 caractères");
  assert.doesNotMatch(page, /<p class="aide">Ton code a 6 caractères/, "la phrase grise du bas est retirée");
  assert.doesNotMatch(page, /zéros et des uns|c’est un chiffre/, "plus de conseil vers un 0 ou un 1 qui n'existent pas");
  assert.doesNotMatch(page, /placeholder="••••••"/, "plus de points gris façon mot de passe");
  assert.match(page, /<label for="code" class="pour-lecteur">Ton code, 6 caractères<\/label>/,
    "l'étiquette reste pour un lecteur d'écran, cachée à l'œil");
  const cases = page.match(/<div class="cec" id="cases">([\s\S]*?)<\/div>/);
  assert.ok(cases, "les six cases entourent la vraie case de saisie");
  assert.match(cases[1], /<input id="code" class="cec-champ" name="code" type="text" inputmode="latin" maxlength="6"/);
  assert.equal((cases[1].match(/<span class="cec-case" aria-hidden="true"><\/span>/g) || []).length, 6);
  assert.match(page, /const casesCode = window\.MathsGoCodeEnCases\.monter\(\$\("code"\), \{nettoyer\}\);/,
    "le module commun tient la case, avec le nettoyage de la page");
});

test("premier écran : grand logo centré, pas d'en-tête ; l'espace de l'élève le retrouve", () => {
  assert.match(page, /<body class="sur-code">/, "la page s'ouvre sur l'écran du code");
  assert.match(page, /body\.sur-code \.entete \{ display: none; \}/);
  assert.match(page, /<section id="ecran-code">\s*<img class="logo-accueil" src="mathsgo-logo\.png" alt="maths&amp;go" width="180" height="84">\s*<h1>Mon espace<\/h1>/);
  assert.match(page, /#ecran-code \{ text-align: center;/);
  assert.match(page, /\n  dessinerCases\(\);\n  const revenuDUneAppli = retourDepuisAppli\(\);\n  if \(oublierSiDemande\(\)\) \{/,
    "les cases sont dessinées dès l'ouverture : la 1re attend avant même qu'on touche");
  const espace = page.slice(page.indexOf("  function afficherEspace("), page.indexOf("\n  }\n", page.indexOf("  function afficherEspace(")));
  assert.match(espace, /\$\("ecran-espace"\)\.hidden = false;\s*document\.body\.classList\.remove\("sur-code"\);/,
    "une fois entré, l'élève retrouve l'en-tête (sa classe, « Se déconnecter »)");
});

test("« Entrer » : toute la largeur au téléphone, centré sur ordinateur", () => {
  assert.match(page, /#form-code \.actions button \{ flex: 1 1 100%; \}/);
  assert.match(page, /@media \(min-width: 600px\) \{\s*#form-code \.actions \{ justify-content: center; \}\s*#form-code \.actions button \{ flex: 0 0 auto; min-width: 240px; \}\s*\}/);
});

// Ce bloc EXÉCUTE le module des six cases (code-en-cases.js) monté sur une
// fausse case qui se comporte comme un navigateur : une touche remplace la
// sélection (ou s'insère à la position du curseur), puis « input ». La règle
// de nettoyage est celle de la page (nettoyer).
function monterCases() {
  const debut = page.indexOf("  function nettoyer(brut) {");
  const fin = page.indexOf("\n  }\n", debut) + "\n  }\n".length;
  assert.ok(debut > 0 && fin > debut);
  const nettoyer = new Function(page.slice(debut, fin) + "\nreturn nettoyer;")();

  const classes = () => {
    const ens = new Set();
    return {ens, add: c => ens.add(c), remove: c => ens.delete(c), contains: c => ens.has(c),
            toggle: (c, oui) => (oui ? ens.add(c) : ens.delete(c))};
  };
  const carres = Array.from({length: 6}, (_, i) => ({textContent: "", classList: classes(),
    getBoundingClientRect: () => ({left: i * 60, right: i * 60 + 52})}));
  const conteneur = {classList: classes(), querySelectorAll: () => carres};
  conteneur.classList.add("cec");
  const documentFactice = {activeElement: null, ecouteurs: {}, head: {appendChild() {}},
                           getElementById: () => null, createElement: () => ({}),
                           addEventListener(type, fn) { this.ecouteurs[type] = fn; }};
  const champ = {
    value: "", selectionStart: 0, selectionEnd: 0, ecouteurs: {}, parentNode: conteneur,
    ownerDocument: documentFactice, classList: classes(), attributs: {maxlength: "6"},
    removeAttribute(nom) { delete this.attributs[nom]; },
    addEventListener(type, fn) { this.ecouteurs[type] = fn; },
    setSelectionRange(a, b = a) { this.selectionStart = a; this.selectionEnd = b; }
  };
  documentFactice.activeElement = champ;
  const api = CEC.monter(champ, {nettoyer});
  const evenement = () => ({target: champ, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }});
  const taper = texte => {
    for (const lettre of texte) {
      const i = champ.selectionStart;
      const j = Math.max(champ.selectionEnd, i);
      champ.value = champ.value.slice(0, i) + lettre + champ.value.slice(j);
      champ.setSelectionRange(i + 1);
      champ.ecouteurs.input(evenement());
    }
  };
  const effacer = () => {
    const i = champ.selectionStart;
    if (i === 0) return;
    champ.value = champ.value.slice(0, i - 1) + champ.value.slice(i);
    champ.setSelectionRange(i - 1);
    champ.ecouteurs.input(evenement());
  };
  const lire = () => carres.map(c => c.textContent || "·").join("");
  const active = () => carres.findIndex(c => c.classList.ens.has("active"));
  ["focus", "click"].forEach(type => {
    const brut = champ.ecouteurs[type];
    champ.ecouteurs[type] = (e = {}) => brut(e);
  });
  return {champ, conteneur, carres, taper, effacer, lire, active, evenement, document: documentFactice,
          api, dessinerCases: () => api.dessiner()};
}

test("six cases : chaque caractère dans sa case, en majuscule, la suivante entourée", () => {
  const c = monterCases();
  c.champ.ecouteurs.focus();
  assert.ok(c.conteneur.classList.ens.has("actif"));
  assert.equal(c.active(), 0, "la 1re case attend");
  c.taper("k7-m");
  assert.equal(c.champ.value, "K7M", "majuscules, et rien d'autre que des lettres et des chiffres");
  assert.equal(c.lire(), "K7M···");
  assert.deepEqual(c.carres.map(x => x.classList.ens.has("pleine")), [true, true, true, false, false, false]);
  assert.equal(c.active(), 3);
  c.taper("4tz9");
  assert.equal(c.lire(), "K7M4TZ", "six au plus");
  assert.equal(c.active(), -1, "tout est rempli : aucune case n'attend, le geste suivant c'est « Entrer »");
  c.champ.ecouteurs.blur();
  assert.ok(!c.conteneur.classList.ens.has("actif"));
});

test("toucher la 1re case ne glisse pas une lettre au milieu : on écrit et on efface au bout", () => {
  const c = monterCases();
  c.champ.ecouteurs.focus();
  c.taper("K7M");
  c.champ.selectionStart = 0;          // le doigt pose le curseur au début…
  c.champ.ecouteurs.click();           // …la page le renvoie au bout
  c.taper("4");
  assert.equal(c.champ.value, "K7M4", "et pas « 4K7M »");
  c.champ.selectionStart = 1;
  c.champ.ecouteurs.focus();           // revenir dans la case : pareil
  c.effacer();
  assert.equal(c.champ.value, "K7M", "effacer enlève le dernier caractère");
  assert.equal(c.lire(), "K7M···");
  for (const touche of ["ArrowLeft", "Home", "ArrowRight", "End"]) {
    const e = {...c.evenement(), key: touche};
    e.preventDefault = function () { this.defaultPrevented = true; };
    c.champ.selectionStart = 0;
    c.champ.ecouteurs.keydown(e);
    assert.ok(e.defaultPrevented, `${touche} ne déplace pas le curseur`);
    assert.equal(c.champ.selectionStart, 3);
  }
  const lettre = {...c.evenement(), key: "a"};
  lettre.preventDefault = function () { this.defaultPrevented = true; };
  c.champ.ecouteurs.keydown(lettre);
  assert.ok(!lettre.defaultPrevented, "une lettre passe");
});

// Relecture du 05/10/2026 : sur l'iPhone, l'appui long (la loupe), la barre
// d'espace glissée et le double-tap déplacent le curseur ou sélectionnent le
// code SANS clic ni touche. Seul « selectionchange » le signale.
// Lot « code en cases » (remarque de Gwenaël du 08/11/2026 : « il faut tout
// effacer ») : toucher une case pleine la choisit, la lettre tapée la remplace.
test("une lettre se corrige sans tout effacer : toucher la case, taper la bonne lettre", () => {
  const c = monterCases();
  c.champ.ecouteurs.focus();
  c.taper("K7X4TZ");
  assert.equal(c.champ.attributs.maxlength, undefined, "le module tient la limite de six : la lettre de remplacement doit pouvoir entrer");
  c.champ.ecouteurs.click({clientX: 130});       // la 3e case
  assert.equal(c.active(), 2);
  assert.equal(c.champ.selectionStart, 6, "le curseur du navigateur reste au bout");
  c.taper("m");
  assert.equal(c.champ.value, "K7M4TZ");
  assert.equal(c.active(), 3, "la case pleine suivante devient la case active");
  c.effacer();
  assert.equal(c.champ.value, "K7M4T", "⌫ efface depuis le bout");
  assert.equal(c.active(), 5);
});

test("le curseur déplacé sans clic ni touche (loupe, double-tap de l'iPhone) revient au bout", () => {
  const c = monterCases();
  c.champ.ecouteurs.focus();
  c.taper("K7M");
  c.champ.setSelectionRange(0);                   // la loupe pose le curseur au début
  c.document.ecouteurs.selectionchange();
  c.taper("4");
  assert.equal(c.champ.value, "K7M4", "et pas « 4K7M »");
  c.champ.setSelectionRange(0, 4);                // double-tap : tout le code est sélectionné
  c.document.ecouteurs.selectionchange();
  c.taper("Z");
  assert.equal(c.champ.value, "K7M4Z", "la lettre suivante ne remplace pas le code");
  c.document.activeElement = null;                // une sélection ailleurs dans la page
  c.champ.setSelectionRange(1);
  c.document.ecouteurs.selectionchange();
  assert.equal(c.champ.selectionStart, 1, "n'est pas touchée");
});

test("un code remis dans la case par la page (serveur muet) se redessine dans les cases", () => {
  const ouvrir = page.slice(page.indexOf("  async function ouvrir(code, silencieux) {"), page.indexOf("  // La saisie elle-même"));
  assert.equal((ouvrir.match(/if \(silencieux\) \{ \$\("code"\)\.value = code; dessinerCases\(\); \}/g) || []).length, 2);
  assert.doesNotMatch(ouvrir, /if \(silencieux\) \$\("code"\)\.value = code;/);
  const c = monterCases();
  c.champ.value = "ABC234";
  c.dessinerCases();
  assert.equal(c.lire(), "ABC234");
});
