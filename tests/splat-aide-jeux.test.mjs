// Lot 3 « aides et carte » (08/11/2026, choix de Gwenaël sur les planches 7 et 8, puis par questions à choix) :
// - dans Petit SPLAT!, SPLAT! Classique et ÉquaSplat, un bouton « ? Comment faire » collé à « ◀ Carte des mondes »
//   (texte choisi le 08/11 : il montre comment on joue, pas la réponse ; « ? » seul sous 900 px) ouvre l'aide de l'étape : son film ou son tutoriel, sinon le film de son monde ; une
//   étape qui « dessine » ouvre le film « Dessine les jetons » ;
// - les mondes sans film ni tutoriel (Enquête, Système, Relatifs) n'ont PAS de bouton ;
// - sous le film, en face de « ‹ Carte des mondes », la pastille dit « Retour au jeu › » et rouvre l'adresse du jeu
//   lui-même : la reprise des outils remet l'élève sur sa carte.
// Ces tests EXÉCUTENT assets/js/splat-etapes.js, la carte (MONDES) et les fonctions des outils, extraites telles quelles.
// Le trajet complet (cartes jouées → ? Aide → film → Retour au jeu → même carte) a été joué au navigateur : voir la
// notice du lot.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
const intro = lire("outils/splat_intro.html");
const moduleEtapes = lire("assets/js/splat-etapes.js");
const OUTILS = {
  "Petit SPLAT!": lire("outils/splat_tache_barre.html"),
  "SPLAT! Classique": lire("outils/splat.html"),
  "ÉquaSplat": lire("outils/equasplat.html")
};

function chargerModule() {
  const fenetre = {};
  new Function("window", moduleEtapes)(fenetre);
  return fenetre.MathsGoSplatEtapes;
}
const E = chargerModule();

// ---------- la carte des mondes, exécutée (comme tests/splat-etape-suivante.test.mjs) ----------
const ctxU = vm.createContext({ encodeURIComponent });
{
  const a = univers.indexOf("const PS="), b = univers.indexOf("const PROF =");
  assert.ok(a > 0 && b > a, "bloc des mondes introuvable dans splat_univers.html");
  vm.runInContext(univers.slice(a, b) + ";globalThis.X=MONDES;", ctxU);
}
const MONDES = ctxU.X;

/* la règle de Gwenaël (08/11/2026), appliquée aux films de la carte */
function aidesDeLaCarte() {
  const out = {};
  for (const m of MONDES) {
    if (!m.actif) continue;
    const avecFilm = m.etapes.filter((e) => e.films && e.films.length);
    if (!avecFilm.length) continue; /* pas d'aide dans ce monde : pas de bouton */
    const filmDuMonde = avecFilm[0].films[0][0];
    const filmDessin = (avecFilm.find((e) => e.dessin) || {}).films;
    for (const e of m.etapes) {
      out[e.p] = e.films && e.films.length ? e.films[0][0]
        : e.dessin && filmDessin ? filmDessin[0][0]
        : filmDuMonde;
    }
  }
  return out;
}

test("splat-etapes.js : AIDES est la copie des films de la carte (le film de l'étape, sinon « dessine » pour une étape de dessin, sinon le film du monde)", () => {
  const attendu = aidesDeLaCarte();
  assert.deepEqual({ ...E.AIDES }, attendu,
    "les films de la carte ont changé : recopier dans assets/js/splat-etapes.js (AIDES) :\n" + JSON.stringify(attendu, null, 1) +
    "\npuis bumper son ?v= partout où il est chargé");
  // les choix du 08/11, écrits en clair
  assert.equal(E.AIDES.m1e6, "dessine", "étape 6 « Dessine en expert » : le film « Dessine les jetons »");
  assert.equal(E.AIDES.m1e3, "intro");
  assert.equal(E.AIDES.m2e1, "paquets");
  assert.equal(E.AIDES.m3e4, "equasplat");
  // Enquête, Système (et leurs Bonus), Relatifs : rien
  for (const p of ["enq10", "enq24", "enq11d", "sys25", "sys28d", "ech1", "m4e1", "m4e6"]) assert.equal(E.aide(p, "/outils/splat.html"), null, p);
  // chaque aide est une étape de la carte, et un film du lecteur
  const parcours = E.ETAPES.map((e) => e[0]);
  for (const [p, f] of Object.entries(E.AIDES)) {
    assert.ok(parcours.includes(p), `${p} n'est pas une étape de la carte`);
    assert.ok(f === "intro" ? /FILMS\.intro=film;/.test(intro) : new RegExp(`FILMS\\.${f}=\\(function\\(\\)\\{`).test(intro), `film « ${f} » inconnu du lecteur`);
  }
});

test("aide() : le film, le retour au jeu lui-même, &depuis=jeu ; une adresse hors du site ou trop longue repasse par la carte", () => {
  const j = "/outils/splat_tache_barre.html?support=eleve&problem=classic&parcours=m1e3";
  assert.equal(E.aide("m1e3", j), "/outils/splat_intro.html?film=intro&suite=" + encodeURIComponent(j) + "&depuis=jeu");
  const eq = "/outils/equasplat.html?eleve=1&parcours=m3e1#data=" + "A".repeat(3600);
  const u = new URL(E.aide("m3e1", eq), "https://mathsgo.re");
  assert.equal(u.pathname, "/outils/splat_intro.html");
  assert.equal(u.searchParams.get("film"), "equasplat");
  assert.equal(u.searchParams.get("suite"), eq, "la série d'ÉquaSplat (#data=) revient entière");
  assert.equal(u.searchParams.get("depuis"), "jeu");
  const parCarte = "/outils/splat_intro.html?film=equasplat&suite=" + encodeURIComponent("/outils/splat_univers.html?jouer=m3e1") + "&depuis=jeu";
  for (const r of ["//evil.example/x", "/\\evil.example", "https://evil.example/", "javascript:alert(1)", "", null, undefined, "/" + "x".repeat(6000)])
    assert.equal(E.aide("m3e1", r), parCarte, String(r).slice(0, 30));
  assert.equal(E.aide("inconnu", j), null);
  assert.equal(E.aide("__proto__", j), null);
  assert.equal(E.aide("toString", j), null);
});

/* une fonction d'un outil, extraite telle quelle */
function fonction(src, nom) {
  const a = src.indexOf(`function ${nom}(`);
  assert.ok(a >= 0, `${nom} introuvable`);
  let i = src.indexOf("{", a), n = 0;
  for (let k = i; k < src.length; k++) {
    if (src[k] === "{") n++;
    else if (src[k] === "}" && --n === 0) return src.slice(a, k + 1);
  }
  throw new Error(nom);
}
function lienAide(nomOutil, varParcours, parcours, adresse) {
  const u = new URL(adresse, "https://mathsgo.re");
  const f = new Function("window", "location", varParcours,
    fonction(OUTILS[nomOutil], "eleveLienAideHtml") + "; return eleveLienAideHtml();");
  return f({ MathsGoSplatEtapes: E }, { pathname: u.pathname, search: u.search, hash: u.hash }, parcours);
}
const VARS = { "Petit SPLAT!": "parcoursId", "SPLAT! Classique": "parcoursId", "ÉquaSplat": "eleveParcours" };
const CLASSES = { "Petit SPLAT!": "eleve-aide", "SPLAT! Classique": "eleveAide", "ÉquaSplat": "eleveAide" };

test("les trois outils : « ? Aide » pointe vers l'aide de l'étape (& échappés), rien sans parcours ni dans un monde sans aide", () => {
  const cas = [
    ["Petit SPLAT!", "m1e6", "/outils/splat_tache_barre.html?support=eleve&splats=mix&exercise=construct&parcours=m1e6", "dessine"],
    ["SPLAT! Classique", "m2e1", "/outils/splat.html?mode=A&eleve=1&parcours=m2e1&suite=x%3Dy", "paquets"],
    ["ÉquaSplat", "m3e2", "/outils/equasplat.html?eleve=1&parcours=m3e2#data=eyJzb3VyY2Ui", "equasplat"]
  ];
  for (const [o, p, adr, film] of cas) {
    const html = lienAide(o, VARS[o], p, adr);
    const m = html.match(new RegExp(`^<a class="${CLASSES[o]}" href="([^"]+)" title="Comment faire : le (film|tutoriel)" aria-label="Comment faire">\\? <span class="txt">Comment faire</span></a>$`));
    assert.ok(m, `${o} : ${html}`);
    assert.doesNotMatch(m[1], /&(?!amp;)/, `${o} : les & du lien sont échappés`);
    assert.equal(m[1].replace(/&amp;/g, "&"), E.aide(p, adr), o);
    assert.equal(new URL(m[1].replace(/&amp;/g, "&"), "https://mathsgo.re").searchParams.get("film"), film, o);
    // hors parcours, ou dans un monde sans aide : rien
    assert.equal(lienAide(o, VARS[o], "", adr), "", `${o} sans parcours`);
  }
  assert.equal(lienAide("SPLAT! Classique", "parcoursId", "enq12", "/outils/splat.html?eleve=1&parcours=enq12"), "");
  assert.equal(lienAide("SPLAT! Classique", "parcoursId", "sys27d", "/outils/splat.html?eleve=1&parcours=sys27d"), "");
  assert.equal(lienAide("ÉquaSplat", "eleveParcours", "m4e3", "/outils/equasplat.html?eleve=1&parcours=m4e3"), "");
  // sans splat-etapes.js (fichier pas chargé) : rien, et pas d'erreur
  const f = new Function("window", "location", "parcoursId", fonction(OUTILS["Petit SPLAT!"], "eleveLienAideHtml") + "; return eleveLienAideHtml();");
  assert.equal(f({}, { pathname: "/x", search: "", hash: "" }, "m1e1"), "");
});

test("les trois outils : le bouton suit « ◀ Carte des mondes » dans la barre, même pastille, « ? » seul au téléphone", () => {
  const t = OUTILS["Petit SPLAT!"], c = OUTILS["SPLAT! Classique"], q = OUTILS["ÉquaSplat"];
  // Petit SPLAT! et Classique : la carte perd son « margin-right:auto », c'est l'aide qui pousse le reste à droite
  assert.ok(t.includes("let html = `<div class=\"eleve-tete\">${eleveLienAideHtml() ? eleveLienMondesHtml('eleve-mondes avec-aide') + eleveLienAideHtml() : eleveLienMondesHtml()}<span><span class=\"mot\">Carte </span>${eleveIdx + 1} / ${eleveSerie.length}</span>`"));
  assert.match(t, /\.eleve-tete \.eleve-mondes\.avec-aide \{ margin-right: 0; \}/);
  assert.match(t, /\.eleve-tete \.eleve-aide \{ font-size: 13px; font-weight: 800; color: #1e40af; text-decoration: none; white-space: nowrap; padding: 4px 8px; border-radius: 999px; background: #e0e7ff; margin: 0 auto 0 -4px; \}/);
  assert.match(t, /@media \(max-width: 520px\) \{ \.eleve-tete \.eleve-mondes \.txt, \.eleve-tete \.eleve-aide \.txt \{ display: none; \}/);
  assert.ok(c.includes("tete.innerHTML = (eleveLienAideHtml() ? eleveLienMondesHtml(\"eleveMondes avecAide\") + eleveLienAideHtml() : eleveLienMondesHtml(\"eleveMondes\")) + `<span><span class=\"mot\">Carte </span>${eleveIdx + 1} / ${eleveSerie.length}</span>`"));
  assert.match(c, /\.eleveTete a\.eleveMondes\.avecAide\{margin-right:0\}/);
  assert.match(c, /\.eleveTete a\.eleveAide\{font-size:13px;font-weight:800;color:#1e40af;text-decoration:none;white-space:nowrap;padding:4px 8px;border-radius:999px;background:#e0e7ff;margin:0 auto 0 -4px\}/);
  assert.match(c, /@media \(max-width:520px\)\{\.eleveTete a\.eleveMondes \.txt,\.eleveTete a\.eleveAide \.txt\{display:none\}/);
  // ÉquaSplat : dans la barre sombre, juste après la carte
  assert.match(q, /return eleveLienMondesHtml\("eleveMondes"\) \+ eleveLienAideHtml\(\) \+\n/);
  assert.match(q, /#eleveBarre a\.eleveAide\{color:#dbeafe;text-decoration:none;font-size:13px;font-weight:800;background:rgba\(255,255,255,\.14\);\n\s*border-radius:999px;padding:4px 9px;white-space:nowrap;margin-left:-4px\}/);
  assert.match(q, /body\.importMode\.eleveMode #eleveBarre a\.eleveMondes \.txt,body\.importMode\.eleveMode #eleveBarre a\.eleveAide \.txt\{display:none\}/);
  // « Comment faire » en entier à partir de 900 px seulement
  assert.match(t, /@media \(max-width: 899px\) \{ \.eleve-tete \.eleve-aide \.txt \{ display: none; \} \}/);
  assert.match(c, /@media \(max-width:899px\)\{\.eleveTete a\.eleveAide \.txt\{display:none\}\}/);
  assert.match(q, /@media \(max-width:899px\)\{#eleveBarre a\.eleveAide \.txt\{display:none\}\}/);
  // au téléphone, la place du « ? » est reprise ailleurs : la barre reste sur une ligne (mesuré au navigateur, voir la notice)
  assert.match(t, /@media \(max-width: 400px\) \{ \.eleve-tete \.mot \{ display: none; \} \}/);
  assert.match(c, /@media \(max-width:400px\)\{\.eleveTete \.mot\{display:none\}\}/);
  const serre = q.match(/@media \(max-width:380px\)\{([\s\S]*?)\n  \}/);
  assert.ok(serre, "ÉquaSplat : la barre resserrée sous 380 px");
  assert.match(serre[1], /#eleveBarre\{gap:6px\}/);
  assert.match(serre[1], /\.elevePastilles\{gap:2px\}/);
  assert.match(serre[1], /#elevePasser\{padding:6px 10px\}/);
});

test("lecteur : ouvert par « ? Aide » (&depuis=jeu), la pastille de droite dit « Retour au jeu › » ; les autres entrées ne changent pas", () => {
  assert.match(intro, /const DEPUIS_JEU=new URLSearchParams\(location\.search\)\.get\('depuis'\)==='jeu';/);
  assert.match(intro, /if\(film\.passer&&!PRESENTATION&&!DEPUIS_CARTE\)\{\$\('passer'\)\.href=film\.passer;\$\('passer'\)\.hidden=false;if\(film\.passerTexte\)\$\('passer'\)\.textContent=film\.passerTexte;\n\s*if\(DEPUIS_JEU\)\$\('passer'\)\.textContent='Retour au jeu ›';\}/);
  // le tutoriel d'ÉquaSplat a aussi « 🎬 Voir le film » au milieu : au téléphone, la ligne se resserre pour tenir
  assert.match(intro, /\$\('pied'\)\.classList\.toggle\('serre',DEPUIS_JEU&&!!autre&&!\$\('passer'\)\.hidden\);/);
  const tel = intro.match(/@media \(max-width:640px\)\{([\s\S]*?)\n\}/)[1];
  assert.match(tel, /\.pied\.serre\{gap:0 6px\}\n\s*\.pied\.serre \.carte,\.pied\.serre \.passer\{padding:9px 12px\}\n\s*\.pied\.serre #autre\{padding:10px 2px\}/);
  const dep = intro.match(/const DEPUIS_JEU=[^\n]*\n/)[0];
  const val = (s) => new Function("location", dep + "return DEPUIS_JEU;")({ search: s });
  assert.equal(val("?film=intro&suite=%2Fx&depuis=jeu"), true);
  for (const s of ["?film=intro&suite=%2Fx", "?depuis=carte", "?depuis=jeux", "?depuis=JEU"]) assert.equal(val(s), false, s);
});
