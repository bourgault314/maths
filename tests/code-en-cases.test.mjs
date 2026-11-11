// Le code en six cases (lot « code en cases », novembre 2026) : un seul module,
// assets/js/code-en-cases.js, pour l'entrée de Mon espace et la question
// « C'est toujours toi ? » des applis et de Mon espace. Ce fichier EXÉCUTE la
// saisie (frappe, correction d'une lettre au milieu, ⌫, collages de 6 et de
// 8 caractères, curseur déplacé par l'iPhone), puis vérifie que la copie du
// serveur est identique et que chaque page charge le module.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const racine = new URL("../", import.meta.url);
const lire = chemin => readFileSync(new URL(chemin, racine), "utf8");
const CEC = require("../assets/js/code-en-cases.js");

// --------------------------------------------------------------- la saisie seule

test("taper : chaque lettre va au bout, jamais plus de six", () => {
  let etat = {valeur: "", selection: -1};
  for (const lettre of "ABCDEFG") etat = CEC.saisir(etat.valeur, etat.valeur + lettre, etat.selection);
  assert.deepEqual(etat, {valeur: "ABCDEF", selection: -1});
});

test("minuscules, espaces et signes sont nettoyés", () => {
  assert.deepEqual(CEC.saisir("AB", "ABc", -1), {valeur: "ABC", selection: -1});
  assert.deepEqual(CEC.saisir("AB", "AB-", -1), {valeur: "AB", selection: -1});
  assert.deepEqual(CEC.saisir("AB", "AB ", 0), {valeur: "AB", selection: 0}, "un espace ne fait rien, même en correction");
});

test("corriger une lettre au milieu : la case choisie est remplacée, la suivante pleine devient active", () => {
  // Code plein « TQXNEZ » : l'élève touche la 3e case (indice 2) et tape Q.
  let etat = CEC.saisir("TQXNEZ", "TQXNEZQ", 2);
  assert.deepEqual(etat, {valeur: "TQQNEZ", selection: 3}, "maxlength n'empêche plus la lettre de remplacement");
  assert.equal(CEC.caseActive(etat.valeur, etat.selection), 3);
  // Corriger la DERNIÈRE case : on repasse en écriture normale.
  etat = CEC.saisir("TQQNEX", "TQQNEXZ", 5);
  assert.deepEqual(etat, {valeur: "TQQNEZ", selection: -1});
  assert.equal(CEC.caseActive(etat.valeur, etat.selection), -1, "six pleines : aucune case active");
});

test("corriger dans un code incomplet : au bout de ce qui est tapé, on reprend l'écriture au bout", () => {
  let etat = CEC.saisir("ABX", "ABXC", 2);
  assert.deepEqual(etat, {valeur: "ABC", selection: -1});
  assert.equal(CEC.caseActive(etat.valeur, etat.selection), 3, "la 4e case vide attend");
  etat = CEC.saisir(etat.valeur, etat.valeur + "D", etat.selection);
  assert.equal(etat.valeur, "ABCD");
});

test("⌫ efface depuis le bout, même pendant une correction", () => {
  assert.deepEqual(CEC.saisir("TQXNEZ", "TQXNE", 2), {valeur: "TQXNE", selection: -1});
  assert.deepEqual(CEC.saisir("A", "", -1), {valeur: "", selection: -1});
});

test("coller : six caractères utiles ou plus remplacent tout ; huit sont bornés à six", () => {
  assert.deepEqual(CEC.saisir("", "K7M2PX", -1), {valeur: "K7M2PX", selection: -1});
  assert.deepEqual(CEC.saisir("AB", "ABk7 m2-px", -1), {valeur: "K7M2PX", selection: -1}, "collage avec espaces et tirets");
  assert.deepEqual(CEC.saisir("", "K7M2PXQR", -1), {valeur: "K7M2PX", selection: -1}, "collage de huit");
  assert.deepEqual(CEC.saisir("TQXNEZ", "TQXNEZK7M2PX", 2), {valeur: "K7M2PX", selection: -1}, "collage pendant une correction");
});

test("le navigateur a tout remplacé (sélection) : on garde ce qu'il dit, nettoyé", () => {
  assert.deepEqual(CEC.saisir("TQXNEZ", "w", 3), {valeur: "W", selection: -1});
});

test("la règle de nettoyage de la page est appliquée (alphabet des codes)", () => {
  const sansO = brut => String(brut).toUpperCase().replace(/[^A-NP-Z2-9]/g, "");
  assert.deepEqual(CEC.saisir("AB", "ABO", -1, sansO), {valeur: "AB", selection: -1});
  assert.deepEqual(CEC.saisir("ABC", "ABC0", 1, sansO), {valeur: "ABC", selection: 1});
});

test("au clavier d'ordinateur : ← et → déplacent la case choisie", () => {
  assert.equal(CEC.deplacer(-1, 6, "ArrowLeft"), 5);
  assert.equal(CEC.deplacer(5, 6, "ArrowLeft"), 4);
  assert.equal(CEC.deplacer(0, 6, "ArrowLeft"), 0);
  assert.equal(CEC.deplacer(4, 6, "ArrowRight"), 5);
  assert.equal(CEC.deplacer(5, 6, "ArrowRight"), -1, "au bout : écriture normale");
  assert.equal(CEC.deplacer(-1, 3, "ArrowRight"), -1);
  assert.equal(CEC.deplacer(2, 6, "Home"), 0);
  assert.equal(CEC.deplacer(2, 6, "End"), -1);
  assert.equal(CEC.deplacer(-1, 0, "ArrowLeft"), -1);
  assert.equal(CEC.deplacer(2, 6, "a"), null, "une lettre ne déplace rien");
});

// --------------------------------------------- monter() dans un faux document

function fauxDocument() {
  const ecouteursDoc = {};
  let actif = null;
  function element(balise) {
    const ecouteurs = {};
    const classes = new Set();
    const el = {
      tagName: balise.toUpperCase(), children: [], parentNode: null, attributs: {}, textContent: "",
      value: "", selectionStart: 0, selectionEnd: 0, id: "",
      classList: {
        add: (...c) => c.forEach(x => classes.add(x)), remove: (...c) => c.forEach(x => classes.delete(x)),
        contains: c => classes.has(c), toggle: (c, oui) => { (oui ? classes.add(c) : classes.delete(c)); return oui; }
      },
      get className() { return [...classes].join(" "); }, set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
      setAttribute(n, v) { this.attributs[n] = String(v); }, removeAttribute(n) { delete this.attributs[n]; },
      appendChild(enfant) { if (enfant.parentNode) enfant.remove(); enfant.parentNode = this; this.children.push(enfant); return enfant; },
      insertBefore(enfant, repere) { if (enfant.parentNode) enfant.remove(); enfant.parentNode = this; const i = this.children.indexOf(repere); this.children.splice(i < 0 ? this.children.length : i, 0, enfant); return enfant; },
      remove() { if (this.parentNode) { const l = this.parentNode.children; l.splice(l.indexOf(this), 1); this.parentNode = null; } },
      querySelectorAll(sel) { const c = sel.replace(".", ""); const res = []; const tour = n => n.children.forEach(e => { if (e.classList.contains(c)) res.push(e); tour(e); }); tour(this); return res; },
      addEventListener(type, f) { (ecouteurs[type] ||= []).push(f); },
      declencher(type, ev = {}) { (ecouteurs[type] || []).forEach(f => f(Object.assign({preventDefault() { this.defaultPrevented = true; }}, ev))); },
      setSelectionRange(a, b) { this.selectionStart = a; this.selectionEnd = b; },
      focus() { actif = this; this.declencher("focus"); },
      getBoundingClientRect() { return this._rect || {left: 0, right: 0}; },
      get ownerDocument() { return doc; }
    };
    return el;
  }
  const head = element("head");
  const body = element("body");
  const doc = {
    head, body, documentElement: body,
    createElement: element,
    getElementById: id => { const tour = n => { for (const e of n.children) { if (e.id === id) return e; const t = tour(e); if (t) return t; } return null; }; return tour(head) || tour(body); },
    addEventListener(type, f) { (ecouteursDoc[type] ||= []).push(f); },
    declencher(type) { (ecouteursDoc[type] || []).forEach(f => f({})); },
    get activeElement() { return actif; }
  };
  return doc;
}

function monterChamp() {
  const doc = fauxDocument();
  const form = doc.createElement("form");
  doc.body.appendChild(form);
  const champ = doc.createElement("input");
  champ.setAttribute("maxlength", "6");
  form.appendChild(champ);
  const api = CEC.monter(champ);
  const boite = champ.parentNode;
  const cases = boite.querySelectorAll(".cec-case");
  cases.forEach((c, i) => { c._rect = {left: i * 50, right: i * 50 + 44}; });
  const taper = brut => { champ.value = brut; champ.declencher("input"); };
  return {doc, champ, api, boite, cases, taper};
}

test("monter : six cases autour du champ, style posé une fois, maxlength retiré", () => {
  const {doc, champ, boite, cases} = monterChamp();
  assert.ok(boite.classList.contains("cec"));
  assert.equal(cases.length, 6);
  assert.ok(cases.every(c => c.attributs["aria-hidden"] === "true"));
  assert.equal(champ.attributs.maxlength, undefined);
  assert.ok(doc.getElementById(CEC.ID_STYLE));
  CEC.poserStyle(doc);
  assert.equal(doc.head.children.filter(e => e.id === CEC.ID_STYLE).length, 1);
});

test("monter : taper, toucher la 3e case, corriger, puis ⌫ — les cases suivent", () => {
  const {champ, api, boite, cases, taper} = monterChamp();
  champ.focus();
  assert.ok(boite.classList.contains("actif"));
  taper("tqxnez");
  assert.equal(champ.value, "TQXNEZ");
  assert.deepEqual(cases.map(c => c.textContent).join(""), "TQXNEZ");
  assert.ok(cases.every(c => !c.classList.contains("active")), "six pleines : aucune case bleue");
  // L'élève touche la 3e case (x = 120).
  champ.declencher("click", {clientX: 120});
  assert.equal(api.selection, 2);
  assert.ok(cases[2].classList.contains("active") && cases[2].classList.contains("pleine"));
  assert.equal(champ.selectionStart, 6, "le curseur du navigateur reste au bout");
  taper("TQXNEZQ");
  assert.equal(champ.value, "TQQNEZ");
  assert.ok(cases[3].classList.contains("active"), "la case pleine suivante devient active");
  taper("TQQNE");
  assert.equal(champ.value, "TQQNE");
  assert.equal(api.selection, -1);
  assert.ok(cases[5].classList.contains("active"));
});

test("monter : le curseur déplacé sans clic (loupe, double-tap) revient au bout", () => {
  const {doc, champ, taper} = monterChamp();
  champ.focus();
  taper("ABC");
  champ.selectionStart = 0; champ.selectionEnd = 3;
  doc.declencher("selectionchange");
  assert.deepEqual([champ.selectionStart, champ.selectionEnd], [3, 3]);
});

test("monter : la page écrit dans le champ puis redessine ; vider efface tout", () => {
  const {champ, api, cases} = monterChamp();
  champ.value = "k7m2px";
  api.dessiner();
  assert.equal(champ.value, "K7M2PX");
  assert.equal(cases.map(c => c.textContent).join(""), "K7M2PX");
  api.vider();
  assert.equal(champ.value, "");
  assert.ok(cases.every(c => c.textContent === "" && !c.classList.contains("pleine")));
});

test("monter : ← au clavier choisit la dernière case, une lettre la remplace", () => {
  const {champ, api, taper} = monterChamp();
  champ.focus();
  taper("ABCDEF");
  const ev = {key: "ArrowLeft"};
  champ.declencher("keydown", ev);
  assert.equal(api.selection, 5);
  taper("ABCDEFZ");
  assert.equal(champ.value, "ABCDEZ");
});

// ----------------------------------------------------- la copie et les pages

test("la copie du serveur est identique, octet pour octet", () => {
  assert.equal(lire("_serveur/public/code-en-cases.js"), lire("assets/js/code-en-cases.js"));
});

const PAGES = [
  ["outils/calcul_mental/defi_tables.html", "./defi_tables_core.js"],
  ["outils/calcul_mental/defi_calcul_modules.html", "./defi_calcul_core.js"],
  ["outils/splat_univers.html", "../assets/js/splat-suivi.js"],
  ["outils/splat.html", "../assets/js/splat-suivi.js"],
  ["outils/splat_tache_barre.html", "../assets/js/splat-suivi.js"],
  ["outils/equasplat.html", "../assets/js/splat-suivi.js"],
  ["outils/calcul_mental/coffres_magiques_solo.html", "../../assets/js/coffres-suivi.js"],
  ["outils/club_maths/carres_gloutons.html", "../../assets/js/coffres-suivi.js"],
  ["outils/calcul_mental/flash_anzan.html", "./flash_anzan_suivi.js"]
];

for (const [page, apres] of PAGES) {
  test(`${page} charge le module AVANT ${apres}`, () => {
    const source = lire(page);
    const i = source.indexOf("assets/js/code-en-cases.js?v=");
    assert.ok(i > 0, "le module est chargé, avec sa version");
    const j = source.indexOf(apres + "?v=");
    assert.ok(j > i, "avant le script qui s'en sert");
  });
}

test("Mon espace charge la copie du serveur dans <head>, avec l'empreinte du fichier", () => {
  const page = lire("_serveur/public/index.php");
  const tete = page.slice(0, page.indexOf("</head>"));
  assert.match(tete, /<script src="code-en-cases\.js\?v=<\?= htmlspecialchars\(\$versionCases, ENT_QUOTES\) \?>"><\/script>/);
  assert.match(page, /\$versionCases = is_file\(\$cases\) \? substr\(md5_file\(\$cases\), 0, 10\) : '0';/);
  assert.match(page, /<div class="cec" id="cases">/);
  assert.match(page, /<div class="cec" id="garde-cases">/);
  assert.equal((page.match(/<span class="cec-case" aria-hidden="true"><\/span>/g) || []).length, 12, "six cases pour l'entrée, six pour la question");
});

test("les habillages des applis montent le module sur le champ de la question", () => {
  for (const f of ["assets/js/splat-suivi.js", "assets/js/coffres-suivi.js", "outils/calcul_mental/flash_anzan_suivi.js"]) {
    const s = lire(f);
    assert.match(s, /outilCases\.monter\(champ, \{nettoyer: nettoyerCodeSaisi\}\)/, f);
    assert.match(s, /if \(garde\.cases\) garde\.cases\.vider\(\);/, f);
  }
  for (const f of ["outils/calcul_mental/defi_tables.html", "outils/calcul_mental/defi_calcul_modules.html"]) {
    const s = lire(f);
    assert.match(s, /casesGarde = window\.MathsGoCodeEnCases\.monter\(champ, \{nettoyer: nettoyerCodeSaisi\}\);/, f);
    assert.match(s, /<div class="cec suivi-garde-cases">/, f);
  }
});
