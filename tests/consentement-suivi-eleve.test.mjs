import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(racine, "assets/js/consentement.js"), "utf8");

// Un test qui relit le TEXTE de consentement.js ne prouverait rien : ce qui
// compte est de savoir si la balise Google Analytics est posée dans la page.
// On EXÉCUTE donc le fichier dans un faux navigateur et on regarde ce qui a été
// ajouté à <head>.
//
// Ce que ça protège : un élève identifié par un code de suivi ne doit JAMAIS
// être mesuré. Le code de l'élève est un identifiant — il ouvre sa progression
// sans mot de passe — et l'espace élève s'adresse à des enfants de onze ans.

function fauxElement(tagName) {
  const el = {
    tagName,
    dataset: {},
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    children: [],
    hidden: false,
    setAttribute() {},
    getAttribute() { return null; },
    removeAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    appendChild(enfant) { this.children.push(enfant); return enfant; },
    append(...n) { this.children.push(...n); },
    insertBefore(enfant) { this.children.push(enfant); return enfant; },
    remove() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    focus() {},
    contains() { return false; }
  };
  return new Proxy(el, {
    get(cible, cle) {
      if (cle in cible) return cible[cle];
      return undefined;
    },
    set(cible, cle, valeur) { cible[cle] = valeur; return true; }
  });
}

function jouer({ codeSuivi = null, drapeau = undefined, choix = "granted" } = {}) {
  const rangement = new Map();
  if (choix) {
    rangement.set("mathsgo:consentement:v1", JSON.stringify({
      value: choix, version: 1, updatedAt: Date.now()
    }));
  }
  if (codeSuivi) rangement.set("mathsgo-suivi-code", codeSuivi);

  const head = fauxElement("head");
  const body = fauxElement("body");
  let cookies = "_ga=GA1.1.42; _ga_X8TVC83222=GS1.1; autre=1";

  const document = {
    readyState: "interactive",
    currentScript: {
      src: "https://mathsgo.re/assets/js/consentement.js",
      dataset: {}
    },
    head,
    body,
    documentElement: fauxElement("html"),
    createElement: fauxElement,
    createTextNode: (t) => ({ text: t }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    get cookie() { return cookies; },
    set cookie(v) {
      const nom = String(v).split("=")[0];
      cookies = cookies.split(";").map(s => s.trim())
        .filter(c => c.split("=")[0] !== nom).join("; ");
    }
  };

  const window = {
    location: {
      protocol: "https:",
      hostname: "mathsgo.re",
      search: "",
      pathname: "/outils/calcul_mental/defi_tables.html",
      href: "https://mathsgo.re/outils/calcul_mental/defi_tables.html"
    },
    localStorage: {
      getItem: (k) => (rangement.has(k) ? rangement.get(k) : null),
      setItem: (k, v) => rangement.set(k, String(v)),
      removeItem: (k) => rangement.delete(k)
    },
    addEventListener() {},
    removeEventListener() {},
    setTimeout: () => 0,
    clearTimeout() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => "" })
  };
  if (drapeau !== undefined) window.MATHSGO_SUIVI_ELEVE = drapeau;

  const navigator = {};
  new Function("window", "document", "navigator", "URLSearchParams", "Date", source)(
    window, document, navigator, URLSearchParams, Date
  );

  const balise = head.children.find(
    (el) => el.tagName === "script" && String(el.src || "").includes("googletagmanager")
  );
  return { baliseAnalytics: balise || null, cookiesRestants: cookies, api: window.mathsgoConsentement };
}

test("sans code de suivi et avec l’accord donné, la mesure d’audience se charge normalement", () => {
  const r = jouer({ codeSuivi: null, choix: "granted" });
  assert.ok(r.baliseAnalytics, "la balise Analytics devrait être posée sur une page publique ordinaire");
});

test("un élève dont le code est déjà rangé n’est jamais mesuré", () => {
  const r = jouer({ codeSuivi: "2F4FUL", choix: "granted" });
  assert.equal(r.baliseAnalytics, null,
    "aucune balise Analytics ne doit être posée quand un code de suivi est présent");
});

test("un élève qui arrive par le lien de l’espace élève n’est pas mesuré non plus", () => {
  // Le code vient d’arriver dans l’adresse : il n’est pas encore rangé, mais
  // l’appli a levé le drapeau avant que consentement.js ne démarre.
  const r = jouer({ codeSuivi: null, drapeau: true, choix: "granted" });
  assert.equal(r.baliseAnalytics, null,
    "le drapeau posé par l’appli doit suffire, dès la toute première visite");
});

test("les cookies de mesure laissés par une visite précédente sont effacés", () => {
  const r = jouer({ codeSuivi: "2F4FUL", choix: "granted" });
  assert.ok(!r.cookiesRestants.includes("_ga="), "le cookie _ga doit être effacé");
  assert.ok(!r.cookiesRestants.includes("_ga_"), "les cookies _ga_* doivent être effacés");
  assert.ok(r.cookiesRestants.includes("autre=1"), "les autres cookies ne doivent pas être touchés");
});

test("on ne demande rien à l’élève : l’état renvoyé est « refusé »", () => {
  const r = jouer({ codeSuivi: "2F4FUL", choix: null });
  assert.equal(r.baliseAnalytics, null);
  assert.equal(r.api.etat(), "denied",
    "un enfant de onze ans n’a pas à arbitrer une question de cookies");
});
