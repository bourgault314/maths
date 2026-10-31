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
  const cases = page.match(/<div class="cases" id="cases">([\s\S]*?)<\/div>/);
  assert.ok(cases, "les six cases entourent la vraie case de saisie");
  assert.match(cases[1], /<input id="code" name="code" type="text" inputmode="latin" maxlength="6"/);
  assert.equal((cases[1].match(/<span class="case" aria-hidden="true"><\/span>/g) || []).length, 6);
});

test("premier écran : grand logo centré, pas d'en-tête ; l'espace de l'élève le retrouve", () => {
  assert.match(page, /<body class="sur-code">/, "la page s'ouvre sur l'écran du code");
  assert.match(page, /body\.sur-code \.entete \{ display: none; \}/);
  assert.match(page, /<section id="ecran-code">\s*<img class="logo-accueil" src="mathsgo-logo\.png" alt="maths&amp;go" width="180" height="84">\s*<h1>Mon espace<\/h1>/);
  assert.match(page, /#ecran-code \{ text-align: center;/);
  assert.match(page, /\n  dessinerCases\(\);\n  if \(oublierSiDemande\(\)\) \{/,
    "les cases sont dessinées dès l'ouverture : la 1re attend avant même qu'on touche");
  const espace = page.slice(page.indexOf("  function afficherEspace("), page.indexOf("\n  }\n", page.indexOf("  function afficherEspace(")));
  assert.match(espace, /\$\("ecran-espace"\)\.hidden = false;\s*document\.body\.classList\.remove\("sur-code"\);/,
    "une fois entré, l'élève retrouve l'en-tête (sa classe, « Se déconnecter »)");
});

test("« Entrer » : toute la largeur au téléphone, centré sur ordinateur", () => {
  assert.match(page, /#form-code \.actions button \{ flex: 1 1 100%; \}/);
  assert.match(page, /@media \(min-width: 600px\) \{\s*#form-code \.actions \{ justify-content: center; \}\s*#form-code \.actions button \{ flex: 0 0 auto; min-width: 240px; \}\s*\}/);
});

// Ce bloc EXÉCUTE le code de la page (nettoyer, dessinerCases, curseurAuBout
// et les écouteurs de la case et du document), sur une fausse case qui se
// comporte comme un navigateur : une touche remplace la sélection (ou
// s'insère à la position du curseur), puis « input ».
function monterCases() {
  const debut = page.indexOf("  function nettoyer(brut) {");
  const finAides = page.indexOf("  function afficherErreur(message) {");
  const debutEcoute = page.indexOf('  $("code").addEventListener("input"');
  const finEcoute = page.indexOf("\n  });", page.indexOf('document.addEventListener("selectionchange"')) + "\n  });".length;
  assert.ok(debut > 0 && finAides > debut && debutEcoute > finAides && finEcoute > debutEcoute);
  const source = page.slice(debut, finAides) + page.slice(debutEcoute, finEcoute)
    + "\nreturn {dessinerCases};";

  const classes = () => {
    const ens = new Set();
    return {ens, add: c => ens.add(c), remove: c => ens.delete(c), toggle: (c, oui) => (oui ? ens.add(c) : ens.delete(c))};
  };
  const carres = Array.from({length: 6}, () => ({textContent: "", classList: classes()}));
  const conteneur = {classList: classes(), querySelectorAll: () => carres};
  const champ = {
    value: "", selectionStart: 0, selectionEnd: 0, ecouteurs: {},
    addEventListener(type, fn) { this.ecouteurs[type] = fn; },
    setSelectionRange(a, b = a) { this.selectionStart = a; this.selectionEnd = b; }
  };
  const documentFactice = {activeElement: champ, ecouteurs: {},
                           addEventListener(type, fn) { this.ecouteurs[type] = fn; }};
  const $ = id => ({code: champ, cases: conteneur})[id];
  const fonctions = new Function("$", "setTimeout", "document", source)($, fn => fn(), documentFactice);
  const evenement = () => ({target: champ, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }});
  const taper = texte => {
    for (const lettre of texte) {
      const i = champ.selectionStart;
      const j = Math.max(champ.selectionEnd, i);
      if (champ.value.length - (j - i) >= 6) continue; // maxlength="6"
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
  return {champ, conteneur, carres, taper, effacer, lire, active, evenement, document: documentFactice, ...fonctions};
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
  const ouvrir = page.slice(page.indexOf("  async function ouvrir(code, silencieux) {"), page.indexOf('  $("code").addEventListener("input"'));
  assert.equal((ouvrir.match(/if \(silencieux\) \{ \$\("code"\)\.value = code; dessinerCases\(\); \}/g) || []).length, 2);
  assert.doesNotMatch(ouvrir, /if \(silencieux\) \$\("code"\)\.value = code;/);
  const c = monterCases();
  c.champ.value = "ABC234";
  c.dessinerCases();
  assert.equal(c.lire(), "ABC234");
});
