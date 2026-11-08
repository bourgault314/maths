// Serveur pro, lot 8 « retours du 31/10/2026 » — Mon espace (élève à code).
// Gwenaël, au retour d'une appli vers Mon espace : l'écran du code passait
// (« comme s'il refaisait une identification »), puis les tuiles se
// remplissaient et remontaient. Décisions (techniques, Claude) :
//  a) un script tout en haut de <head> cache l'écran du code dès le premier
//     rendu quand l'onglet garde un code (et que ce n'est pas ?oublier=1) ;
//  b) la dernière copie de l'espace est gardée dans le même sessionStorage
//     et redessinée tout de suite, puis remplacée par la réponse du serveur ;
//  c) un code supprimé (404) ramène l'écran du code, comme avant.
// Ce fichier EXÉCUTE les morceaux de la page (vraies fonctions, faux
// navigateur). Les mêmes cas sont joués dans un vrai navigateur par le banc
// du lot (gestes8.py, 19 cas).
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(racine, "_serveur/public/index.php"), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = page.slice(page.indexOf(BALISE) + BALISE.length, page.lastIndexOf("</script>"));
const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));

function fonction(nom) {
  const debut = script.search(new RegExp(`\\n  (async )?function ${nom}\\(`)) + 1;
  assert.ok(debut > 0, `fonction ${nom} introuvable`);
  const fin = script.indexOf("\n  }\n", debut) + 4;
  return script.slice(debut, fin);
}
function constante(nom) {
  const debut = script.indexOf(`  const ${nom} = `);
  assert.ok(debut >= 0, `constante ${nom} introuvable`);
  return script.slice(debut, script.indexOf(";\n", debut) + 2);
}
// Un faux sessionStorage (et un qui refuse tout : navigation privée).
function memoire(depart = {}) {
  const m = new Map(Object.entries(depart));
  return {getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m};
}
const classes = () => { const c = new Set(); return {add: x => c.add(x), remove: x => c.delete(x), has: x => c.has(x), c}; };

// ------------------------------------------------------------ a) le script du haut

const haut = (() => {
  const m = page.match(/<script id="avant-tout" nonce="<\?= htmlspecialchars\(\$nonce, ENT_QUOTES\) \?>">([\s\S]*?)<\/script>/);
  assert.ok(m, "le script du haut porte le nonce et son nom");
  return m[1];
})();

function jouerHaut({code = null, recherche = "", casse = false}) {
  const html = classes();
  const fenetre = {location: {search: recherche}, get sessionStorage() { if (casse) throw new Error("refusé"); return memoire(code ? {"mathsgo-suivi-code": code} : {}); }};
  new Function("window", "document", haut)(fenetre, {documentElement: {classList: html}});
  return html.has("retour");
}

test("a) le script du haut : avant tout le reste, il cache l'écran du code à l'élève qui revient — et à lui seul", () => {
  const tete = page.slice(page.indexOf("<head>"), page.indexOf("</head>"));
  assert.ok(tete.indexOf('<script id="avant-tout"') < tete.indexOf("<link"), "avant la feuille de style et le reste");
  assert.equal(jouerHaut({code: "ABC234"}), true, "un code de six caractères dans l'onglet : on revient");
  assert.equal(jouerHaut({code: "ABC234", recherche: "?oublier=1"}), false, "« Se déconnecter » dans l'appli : l'écran du code");
  assert.equal(jouerHaut({code: "ABC234", recherche: "?x=1&oublier=1"}), false);
  assert.equal(jouerHaut({code: "ABC234", recherche: "?oublier=10"}), true, "seul « oublier=1 » compte");
  assert.equal(jouerHaut({code: null}), false, "pas de code : l'écran du code");
  assert.equal(jouerHaut({code: "abc"}), false, "un code qui n'en est pas un : l'écran du code");
  assert.equal(jouerHaut({code: "ABC234", casse: true}), false, "stockage refusé : rien ne casse, l'écran du code");
  assert.match(style, /html\.retour #ecran-code \{ display: none; \}/);
  assert.match(haut, /"mathsgo-suivi-code"/);
  assert.match(script, /const CLE = "mathsgo-suivi-code";/, "la même clé que la page");
});

test("a) la page enlève la classe dès qu'elle montre l'écran du code : ménage, erreur, démarrage sans code", () => {
  assert.match(fonction("revenirAuCode"), /document\.documentElement\.classList\.remove\("retour"\);/);
  const ouvrir = fonction("ouvrir");
  assert.equal((ouvrir.match(/document\.documentElement\.classList\.remove\("retour"\);/g) || []).length, 2, "les deux messages d'erreur");
  assert.match(script, /if \(oublierSiDemande\(\)\) \{\s*document\.documentElement\.classList\.remove\("retour"\);\s*\$\("code"\)\.focus\(\);\s*\} else \{\s*const memorise = nettoyer\(lireCode\(\)\);\s*if \(memorise\.length === 6\) ouvrir\(memorise, true\);\s*else document\.documentElement\.classList\.remove\("retour"\);\s*\}/);
});

// ------------------------------------------------------------ b) la copie de l'espace

function copieRejouee(depart = {}) {
  const stock = memoire(depart);
  let hautCourant = null;
  const f = new Function("stockage", "lireHaut", `const CLE = "mathsgo-suivi-code";\n${constante("CLE_COPIE")}\n${["lireCode", "ecrireCode", "oublierCopie", "lireCopie", "ecrireCopie", "garderCopie", "noterHaut"].map(fonction).join("\n")}\nlet hautCourant = null;\nreturn {lireCode, ecrireCode, lireCopie, garderCopie, noterHaut, poserHaut: h => { hautCourant = h; }};`)(() => stock);
  return {stock, ...f};
}
const DONNEES = {ok: true, prenom: "Rania", classe: "405", billet: "b".repeat(32), reglages: {splat: {mondes: [1]}},
  applis: [
    {cle: "defi-tables", nom: "Défi tables", description: "Les tables", url: "https://mathsgo.re/outils/calcul_mental/defi_tables.html", ancre: "parcours", disponible: true},
    {cle: "vieux", nom: "Annonce", description: "", url: null, disponible: false},
    {cle: "splat", nom: "SPLAT!", description: "Six mondes", url: "https://mathsgo.re/outils/splat_univers.html", disponible: true}]};

test("b) la copie : prénom, classe, tuiles dans l'ordre, jauges — ni billet, ni réglages, ni tuile fermée ; liée au code de l'onglet", () => {
  const r = copieRejouee({"mathsgo-suivi-code": "ABC234"});
  r.garderCopie("ABC234", DONNEES, {"defi-tables": {fait: 4, total: 9, compte: "4 tables passées sur 9"}});
  const brut = r.stock.getItem("mathsgo-suivi-espace");
  assert.ok(brut, "la copie est gardée dans le sessionStorage de l'onglet");
  assert.ok(!brut.includes("bbbbbbbb") && !/"billet"|"reglages"|"mondes"/.test(brut), "ni le billet (usage unique), ni les réglages");
  const copie = JSON.parse(brut);
  assert.deepEqual(Object.keys(copie), ["code", "prenom", "classe", "applis", "jauges", "haut"]);
  assert.deepEqual(copie.applis.map(a => a.cle), ["defi-tables", "splat"], "les tuiles ouvertes seulement, dans l'ordre du serveur");
  assert.equal(r.lireCopie("ABC234").prenom, "Rania");
  assert.equal(r.lireCopie("XYZ789"), null, "la copie d'un autre code ne sert pas");
  // Un élève qui s'est déconnecté entre-temps : rien n'est gardé.
  const sans = copieRejouee({});
  sans.garderCopie("ABC234", DONNEES, {});
  assert.equal(sans.stock.getItem("mathsgo-suivi-espace"), null);
});

test("b) la copie part avec le code : « Se déconnecter », ?oublier=1, code supprimé (ecrireCode(\"\"))", () => {
  const r = copieRejouee({"mathsgo-suivi-code": "ABC234"});
  r.garderCopie("ABC234", DONNEES, {});
  r.ecrireCode("ABC234");
  assert.ok(r.stock.getItem("mathsgo-suivi-espace"), "réécrire le même code ne l'efface pas");
  r.ecrireCode("");
  assert.equal(r.stock.getItem("mathsgo-suivi-code"), null);
  assert.equal(r.stock.getItem("mathsgo-suivi-espace"), null, "le code et la copie partent ensemble");
  assert.match(fonction("oublierSiDemande"), /ecrireCode\(""\);/, "?oublier=1 passe par ecrireCode");
  assert.match(fonction("revenirAuCode"), /ecrireCode\(""\);/, "« Se déconnecter » et le « précédent » aussi");
});

test("b) une copie abîmée ou trafiquée ne fait rien de plus qu'une copie absente : adresses de mathsgo.re seules", () => {
  const avec = copie => copieRejouee({"mathsgo-suivi-code": "ABC234", "mathsgo-suivi-espace": typeof copie === "string" ? copie : JSON.stringify(copie)}).lireCopie("ABC234");
  assert.equal(avec("{pas du json"), null);
  assert.equal(avec([]), null);
  assert.equal(avec({code: "ABC234"}), null, "sans tuiles");
  const lue = avec({code: "ABC234", prenom: "<b>x</b>", applis: [
    {cle: "a", url: "javascript:alert(1)"}, {cle: "b", url: "https://ailleurs.example/"}, {cle: "c", url: "https://mathsgo.re.ailleurs.example/"},
    {cle: "d", url: "//mathsgo.re/x"}, {cle: 5, url: "https://mathsgo.re/x"}, null, {cle: "ok", url: "https://mathsgo.re/outils/x.html"}],
    jauges: [1, 2], haut: "oui"});
  assert.deepEqual(lue.applis.map(a => a.cle), ["ok"], "une tuile ne mène qu'à https://mathsgo.re/");
  assert.deepEqual(lue.jauges, {}, "des jauges qui ne sont pas un objet : aucune");
  assert.equal(lue.haut, null);
  // Le prénom de la copie entre dans la page par textContent, comme celui du serveur.
  assert.match(fonction("afficherEspace"), /\$\("titre"\)\.textContent = donnees\.prenom \? `Bonjour \$\{donnees\.prenom\}` : "Mon espace";/);
  assert.doesNotMatch(fonction("afficherEspace"), /innerHTML = [^`]*donnees/, "rien de la copie en HTML");
});

test("b) les tuiles du haut (séance en direct, évaluation) sont notées à chaque lecture — quatre mots de l'évaluation, rien d'autre", () => {
  const r = copieRejouee({"mathsgo-suivi-code": "ABC234"});
  r.garderCopie("ABC234", DONNEES, {});
  r.noterHaut("ABC234", {direct: true, evaluation: null});
  assert.deepEqual(r.lireCopie("ABC234").haut, {direct: true, evaluation: null});
  r.noterHaut("XYZ789", {direct: false, evaluation: null});
  assert.deepEqual(r.lireCopie("ABC234").haut, {direct: true, evaluation: null}, "un autre code n'écrit rien");
  const resume = new Function(`${fonction("resumeEvaluation")}\nreturn resumeEvaluation;`)();
  assert.deepEqual(resume({etat: "ouverte", fini: 0, close: null, commence: 1, modele: "test1", questions: [1, 2]}),
    {etat: "ouverte", fini: false, close: false, commence: true});
  assert.deepEqual(resume({etat: "<b>"}), {etat: "", fini: false, close: false, commence: false});
  assert.equal(resume(null), null);
  assert.match(fonction("demanderDirect"), /hautCourant = \{direct: Boolean\(donnees\.direct\), evaluation: resumeEvaluation\(donnees\.evaluation\)\};\s*noterHaut\(code, hautCourant\);/);
});

// ------------------------------------------------------------ ouvrir : la copie, puis le serveur

// ouvrir() jouée avec un faux serveur et de faux dessins : on lit ce que la
// page a dessiné, et dans quel ordre. ATTENTE_JAUGES ramenée à 40 ms.
function jouerOuvrir({copie = null, copieCassee = false, reponse, jauges = Promise.resolve({"defi-tables": {compte: "4"}}), silencieux = true, code = "ABC234"}) {
  const journal = [];
  const zones = {code: {value: ""}, erreur: {}};
  const html = classes();
  let codeGarde = code;
  const source = `${constante("ATTENTE_JAUGES").replace("1000", "40")}\nlet ouverture = 0;\n${fonction("attendre")}\n${fonction("ouvrir")}\nreturn ouvrir;`;
  const ouvrir = new Function("window", "document", "fetch", "$", "lireCopie", "afficherEspace", "garderCopie", "ecrireCode", "lireCode",
    "lireJauges", "surveillerDirect", "revenirAuCode", "afficherErreur", "dessinerCases", "oublierCopie", source)(
    {setTimeout}, {documentElement: {classList: html}},
    () => (reponse instanceof Error ? Promise.reject(reponse) : Promise.resolve({ok: reponse.status === 200, status: reponse.status, json: () => Promise.resolve(reponse.corps)})),
    id => zones[id],
    c => (c === code ? copie : null),
    (donnees, c, j, h) => {
      if (copieCassee && donnees === copie) throw new TypeError("jauge illisible");
      journal.push(["dessin", donnees.prenom, Object.keys(j || {}).join(","), h === undefined ? "-" : JSON.stringify(h)]);
    },
    (c, donnees, j) => journal.push(["copie", Object.keys(j || {}).join(",")]),
    c => { codeGarde = c; journal.push(["code", c]); },
    () => codeGarde,
    () => jauges,
    () => { journal.push(["direct"]); return Promise.resolve(0); },
    () => journal.push(["menage"]),
    m => { if (m) journal.push(["erreur", m]); },
    () => {},
    () => journal.push(["oubli-copie"]));
  html.add("retour");
  return {fini: ouvrir(code, silencieux), journal, zones, html, deconnecter: () => { codeGarde = ""; }};
}
const OK = {status: 200, corps: {ok: true, prenom: "Rania", applis: []}};
const COPIE = {code: "ABC234", prenom: "Rania (copie)", applis: [], jauges: {"defi-tables": {compte: "3"}}, haut: {direct: true, evaluation: null}};

test("ouvrir — retour avec copie : la copie est dessinée AVANT toute réponse, puis le serveur la remplace, jauges comprises", async () => {
  const r = jouerOuvrir({copie: COPIE, reponse: OK});
  assert.deepEqual(r.journal, [["dessin", "Rania (copie)", "defi-tables", JSON.stringify(COPIE.haut)]], "tout de suite, sans attendre le serveur");
  await r.fini;
  assert.deepEqual(r.journal.slice(1), [["code", "ABC234"], ["dessin", "Rania", "defi-tables", "-"], ["copie", "defi-tables"]]);
});

test("ouvrir — première entrée : un seul dessin, jauges posées ; les tuiles du haut lues en même temps", async () => {
  const r = jouerOuvrir({reponse: OK, silencieux: false});
  await r.fini;
  assert.deepEqual(r.journal, [["code", "ABC234"], ["direct"], ["dessin", "Rania", "defi-tables", "-"], ["copie", "defi-tables"]]);
});

test("ouvrir — jauges trop lentes : la grille sans elles au bout de l'attente, puis un second dessin, complet", async () => {
  let rendre;
  const r = jouerOuvrir({reponse: OK, silencieux: false, jauges: new Promise(ok => { rendre = ok; })});
  await new Promise(ok => setTimeout(ok, 80));
  assert.deepEqual(r.journal, [["code", "ABC234"], ["direct"], ["dessin", "Rania", "", "-"]], "l'élève n'attend pas plus que l'attente plafonnée");
  rendre({"splat": {compte: "2"}});
  await r.fini;
  assert.deepEqual(r.journal.slice(3), [["dessin", "Rania", "splat", "-"], ["copie", "splat"]]);
});

test("ouvrir — code supprimé (404) au retour : le ménage, l'écran du code vide, pas de message (comme avant le lot 8)", async () => {
  const r = jouerOuvrir({copie: COPIE, reponse: {status: 404, corps: {ok: false}}});
  await r.fini;
  assert.deepEqual(r.journal.slice(1), [["code", ""], ["menage"]]);
});

test("ouvrir — serveur en panne au retour : l'espace de la copie reste, sans message ; sans copie : l'écran du code et le message", async () => {
  for (const reponse of [{status: 500, corps: {ok: false}}, new Error("réseau")]) {
    const avec = jouerOuvrir({copie: COPIE, reponse});
    await avec.fini;
    assert.deepEqual(avec.journal, [["dessin", "Rania (copie)", "defi-tables", JSON.stringify(COPIE.haut)]], "rien d'autre");
    assert.ok(avec.html.has("retour"));
    const sans = jouerOuvrir({reponse});
    await sans.fini;
    assert.equal(sans.journal.at(-1)[0], "erreur");
    assert.ok(!sans.html.has("retour"), "l'écran du code se remontre");
    assert.equal(sans.zones.code.value, "ABC234", "le code est remis dans la case");
  }
});

test("ouvrir — l'élève se déconnecte pendant l'attente des jauges : rien n'est dessiné ni gardé après", async () => {
  let rendre;
  const r = jouerOuvrir({reponse: OK, silencieux: false, jauges: new Promise(ok => { rendre = ok; })});
  await new Promise(ok => setTimeout(ok, 5));
  assert.deepEqual(r.journal, [["code", "ABC234"], ["direct"]]);
  r.deconnecter();
  rendre({"defi-tables": {compte: "4"}});
  await r.fini;
  assert.deepEqual(r.journal, [["code", "ABC234"], ["direct"]], "ni dessin, ni copie : l'écran du code reste");
  assert.match(fonction("garderCopie"), /if \(lireCode\(\) !== code\) return;/, "et garderCopie a la même garde");
});

// La vraie ouvrir() et la vraie revenirAuCode(), ensemble. Relecture du lot : la
// copie montre « Se déconnecter » AVANT la réponse du serveur, et cette réponse
// ne doit pas remettre le code (poste partagé : le suivant verrait l'espace).
for (const moment of ["api/eleve.php", "lireJauges"]) test(`ouvrir — « Se déconnecter » sur la copie, ${moment} encore en route : la réponse ne remet ni le code ni l'espace`, async () => {
  const journal = [];
  const zones = {};
  let codeGarde = "ABC234";
  let repondre;
  let rendreJauges;
  const source = `${constante("ATTENTE_JAUGES")}\nlet ouverture = 0;\n${fonction("attendre")}\n${fonction("ouvrir")}\n${fonction("revenirAuCode")}\nreturn {ouvrir, revenirAuCode};`;
  const {ouvrir, revenirAuCode} = new Function("window", "document", "fetch", "$", "lireCopie", "afficherEspace", "garderCopie", "ecrireCode", "lireCode",
    "lireJauges", "surveillerDirect", "afficherErreur", "dessinerCases", "arreterDirect", "oublierCopie", "poserSemaine", source)(
    {setTimeout}, {documentElement: {classList: classes()}, body: {classList: classes()}},
    () => new Promise(ok => { repondre = ok; }),
    id => (zones[id] ||= {classList: classes()}),
    () => COPIE,
    donnees => journal.push(["dessin", donnees.prenom]),
    () => journal.push(["copie"]),
    c => { codeGarde = c; journal.push(["code", c]); },
    () => codeGarde,
    () => new Promise(ok => { rendreJauges = ok; }),
    () => Promise.resolve(0),
    () => {}, () => {}, () => {}, () => {}, () => {});
  const fini = ouvrir("ABC234", true);
  assert.deepEqual(journal, [["dessin", "Rania (copie)"]], "la copie est à l'écran, le bouton aussi");
  const reponse = {ok: true, status: 200, json: () => Promise.resolve(OK.corps)};
  const avant = [["dessin", "Rania (copie)"]];
  if (moment === "api/eleve.php") {
    revenirAuCode();
    repondre(reponse);
  } else {
    repondre(reponse);
    await new Promise(ok => setTimeout(ok, 5));
    avant.push(["code", "ABC234"]);
    revenirAuCode();
    rendreJauges({"defi-tables": {compte: "4"}});
  }
  await fini;
  assert.equal(codeGarde, "", "le code reste oublié");
  assert.deepEqual(journal, [...avant, ["code", ""]], "ni code remis, ni espace redessiné, ni copie gardée");
});

test("ouvrir — copie illisible (ancien format, trafiquée) : oubliée, et le serveur redessine l'espace ; jamais de page vide", async () => {
  const r = jouerOuvrir({copie: COPIE, copieCassee: true, reponse: OK});
  await r.fini;
  assert.deepEqual(r.journal, [["oubli-copie"], ["code", "ABC234"], ["direct"], ["dessin", "Rania", "defi-tables", "-"], ["copie", "defi-tables"]]);
  const panne = jouerOuvrir({copie: COPIE, copieCassee: true, reponse: new Error("réseau")});
  await panne.fini;
  assert.equal(panne.journal.at(-1)[0], "erreur", "serveur en panne : l'écran du code et le message, pas une page vide");
  assert.ok(!panne.html.has("retour"));
});

// ------------------------------------------------------------ les tuiles du haut ne clignotent plus

test("surveillerDirect : le même élève (onglet qui revient au premier plan) garde ses tuiles ; un autre code fait le ménage", () => {
  const s = fonction("surveillerDirect");
  assert.match(s, /if \(directCode !== code\) arreterDirect\(\);/);
  assert.match(s, /const moi = \+\+directTour;/, "une seule boucle à la fois");
  assert.match(s, /return tour\(\);/, "la première lecture se laisse attendre (première entrée)");
  assert.match(fonction("arreterDirect"), /directTour \+= 1;\s*hautCourant = null;/);
  const a = fonction("afficherEspace");
  assert.match(a, /const dejaSuivi = directCode === code;/);
  assert.match(a, /if \(!dejaSuivi\) tuileEvaluation\.hidden = true;/);
  assert.match(a, /if \(!dejaSuivi\) surveillerDirect\(code\);/);
  assert.match(a, /const enHaut = hautCourant \|\| haut;/);
});
