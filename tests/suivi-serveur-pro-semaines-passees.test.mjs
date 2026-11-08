// Serveur pro, lot 5g « les semaines passées » (29/10/2026, décisions de
// Gwenaël du 26/10) : le lundi, la colonne « Cette semaine » de Défi tables
// repartait à zéro — plus moyen de faire le point sur la semaine écoulée, ni
// de voir l'élève qui n'est venu qu'une fois dans le mois.
//  1. Ma classe : la colonne devient « 4 dernières semaines », « 2 · 0 · 1 · 3 »,
//     la semaine en cours à droite et en gras ; pas de nouveau bouton ;
//  2. l'élève voit les siennes dans Mon parcours : « Mes 4 dernières semaines :
//     2 · 0 · 1 · 3 séances », sous la carte de ma table.
// Décisions techniques : des SÉANCES FINIES, le même nombre des deux côtés
// (PARCOURS.seancesParSemaine, une seule fonction) ; semaines du lundi au
// dimanche ; rien de nouveau enregistré (« seances » garde les 60 dernières) ;
// quand la borne des 60 coupe la fenêtre : « 16+ » (au moins) et « ? » (plus
// connu), jamais un faux chiffre ; le tri : la semaine en cours, puis la
// précédente.
//
// Sabotages attendus (chacun rend un test rouge) :
//   a) compter les JOURS (Set) au lieu des séances
//   b) arrêter la semaine en cours au dimanche (des dates futures comptées)
//   c) faire commencer la semaine le dimanche
//   d) oublier la borne (« 16 » au lieu de « 16+ », « 0 » au lieu de « ? »)
//   e) marquer « + » dès 60 séances même quand la plus ancienne est avant la fenêtre
//   f) trier sur la semaine précédente d'abord
//   g) mettre la semaine en cours à gauche, ou ne pas la mettre en gras
//   h) montrer la ligne de zéros à l'élève
//   i) écrire la ligne de l'élève avec un autre calcul que celui de la page prof
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const P = createRequire(import.meta.url)(join(racine, "outils/calcul_mental/defi_tables_mon_parcours.js"));
const page = lire("_serveur/public/prof/index.php");
const html = lire("outils/calcul_mental/defi_tables.html");

// Jeudi 29 octobre 2026 ; ses semaines : 5, 12, 19 et 26 octobre.
const JEUDI = "2026-10-29";
const jour = (n) => P.ajouterJours(JEUDI, n);
function avecSeances(seances) {
  const p = P.creerParcours();
  p.seances = seances;
  return P.normaliserParcours(p);
}
const textes = (p, aujourdhui = JEUDI) => P.seancesParSemaine(p, aujourdhui).map(P.texteSemaine).join(" · ");

test("les 4 dernières semaines : des séances finies, du lundi au dimanche, la semaine en cours en dernier", () => {
  // Rania, régulière : deux séances le même jour comptent deux fois (sabotage a).
  const rania = avecSeances(["2026-09-29", "2026-10-06", "2026-10-08", "2026-10-09",
    "2026-10-13", "2026-10-15", "2026-10-19", "2026-10-20", "2026-10-22", "2026-10-22", "2026-10-26", "2026-10-28"]);
  assert.deepEqual(P.seancesParSemaine(rania, JEUDI), [
    {lundi: "2026-10-05", seances: 3, plus: false},
    {lundi: "2026-10-12", seances: 2, plus: false},
    {lundi: "2026-10-19", seances: 4, plus: false},
    {lundi: "2026-10-26", seances: 2, plus: false}
  ]);
  assert.equal(textes(rania), "3 · 2 · 4 · 2");
  // Les bords : le dimanche 11 est dans la semaine du 5, le lundi 12 dans la
  // suivante (sabotage c) ; le 4 octobre (dimanche d'avant) est hors fenêtre.
  assert.equal(textes(avecSeances(["2026-10-04", "2026-10-11", "2026-10-12"])), "1 · 1 · 0 · 0");
  // Lucas, une fois dans le mois.
  assert.equal(textes(avecSeances(["2026-10-14"])), "0 · 1 · 0 · 0");
  // Noé, rien.
  assert.equal(textes(P.creerParcours()), "0 · 0 · 0 · 0");
  // Une date après aujourd'hui (horloge d'appareil fausse) ne compte pas (sabotage b).
  assert.equal(textes(avecSeances(["2026-10-30", "2026-10-31"])), "0 · 0 · 0 · 0");
});

test("le lundi matin : la semaine en cours à 0, la semaine écoulée reste lisible juste à côté", () => {
  const rania = avecSeances(["2026-10-13", "2026-10-15", "2026-10-19", "2026-10-20", "2026-10-22", "2026-10-22", "2026-10-26", "2026-10-28"]);
  assert.equal(textes(rania, "2026-11-02"), "2 · 4 · 2 · 0");
  assert.equal(P.seancesParSemaine(rania, "2026-11-02")[3].lundi, "2026-11-02");
  // Le dimanche soir, encore la semaine du 26.
  assert.equal(textes(rania, "2026-11-01"), "0 · 2 · 4 · 2");
});

test("la borne des 60 séances gardées : « 16+ » et « ? », jamais un faux chiffre", () => {
  assert.equal(P.SEUILS.seance.garder, 60, "le moteur garde les 60 dernières séances");
  // Alice : 4 séances par jour pendant 15 jours (du 15 au 29) = 60.
  const alice = avecSeances(Array.from({length: 15}, (_, k) => [jour(-k), jour(-k), jour(-k), jour(-k)]).flat());
  assert.equal(alice.seances.length, 60);
  assert.deepEqual(P.seancesParSemaine(alice, JEUDI), [
    {lundi: "2026-10-05", seances: null, plus: false},
    {lundi: "2026-10-12", seances: 16, plus: true},
    {lundi: "2026-10-19", seances: 28, plus: false},
    {lundi: "2026-10-26", seances: 16, plus: false}
  ]);
  assert.equal(textes(alice), "? · 16+ · 28 · 16");
  // 61 envoyées : la plus ancienne tombe, la marque reste (normaliserParcours garde 60).
  const plus = avecSeances([jour(-20), ...alice.seances]);
  assert.equal(textes(plus), "? · 16+ · 28 · 16");
  // 59 : rien n'a pu être perdu, pas de marque (sabotage d à l'envers).
  const cinquanteNeuf = avecSeances(alice.seances.slice(1));
  assert.equal(textes(cinquanteNeuf), "0 · 15 · 28 · 16");
  // 60 dont la plus ancienne est AVANT la fenêtre : tout est connu (sabotage e).
  const avant = avecSeances([jour(-40), ...alice.seances.slice(1)]);
  assert.equal(avant.seances.length, 60);
  assert.equal(textes(avant), "0 · 15 · 28 · 16");
  // La plus ancienne le lundi même de la première semaine : cette semaine-là « + ».
  const lundi = avecSeances([...Array(59).fill("2026-10-28"), "2026-10-05"]);
  assert.equal(textes(lundi), "1+ · 0 · 0 · 59");
});

test("le tri de la colonne : la semaine en cours, puis la précédente", () => {
  const ordre = seances => P.ordreSemaines(P.seancesParSemaine(avecSeances(seances), JEUDI));
  const deuxPuisUn = ordre(["2026-10-20", "2026-10-26", "2026-10-27"]);
  const deuxPuisTrois = ordre(["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-26", "2026-10-27"]);
  const unPuisCinq = ordre(["2026-10-19", "2026-10-19", "2026-10-19", "2026-10-19", "2026-10-19", "2026-10-26"]);
  const rien = ordre([]);
  assert.ok(rien < unPuisCinq && unPuisCinq < deuxPuisUn && deuxPuisUn < deuxPuisTrois,
    `attendu : ${rien} < ${unPuisCinq} < ${deuxPuisUn} < ${deuxPuisTrois} (sabotage f)`);
  // « ? » passe sous zéro.
  assert.ok(P.ordreSemaines([{seances: null}, {seances: null}, {seances: null}, {seances: 0}]) < 0 + 1 && P.ordreSemaines([{}, {}, {seances: null}, {seances: 0}]) < rien + 1);
});

test("resumeProf rend les semaines (le même calcul que la ligne de l'élève), même pour un parcours vide", () => {
  const p = avecSeances(["2026-10-14", "2026-10-26"]);
  const r = P.resumeProf(p, JEUDI);
  assert.deepEqual(r.semaines, P.seancesParSemaine(p, JEUDI));
  assert.equal(r.ordreSemaines, P.ordreSemaines(r.semaines));
  const vide = P.resumeProf(P.creerParcours(), JEUDI);
  assert.equal(vide.semaines.map(P.texteSemaine).join(" · "), "0 · 0 · 0 · 0");
  // Rien de nouveau dans le parcours : la clé « seances » existait déjà.
  assert.deepEqual(Object.keys(P.creerParcours()).sort(), Object.keys(P.normaliserParcours(p)).sort());
  assert.match(lire("_serveur/public/lib/applis.php"), /'seances'/);
});

test("Ma classe : « 4 dernières semaines », la semaine en cours à droite et en gras", () => {
  const debut = page.indexOf('<tr id="entete-defi-tables">');
  const entete = page.slice(debut, page.indexOf("</tr>", debut));
  assert.match(entete, /<th class="large"><button type="button" data-tri="semaine">4 dernières semaines<\/button><\/th>/);
  assert.doesNotMatch(entete, /Cette semaine/);
  // La cellule, dessinée par la page avec le vrai moteur.
  const source = page.slice(page.indexOf("  function celluleSemaines(lu) {"), page.indexOf("  function large(cellule) {"));
  const fabriquer = tag => ({tag, className: "", textContent: "", enfants: [], title: "",
    classList: {add(c) { this.el.className = `${this.el.className} ${c}`.trim(); }},
    append(...e) { this.enfants.push(...e); }});
  const document = {createElement(tag) { const el = fabriquer(tag); el.classList.el = el; return el; }};
  const cellule = new Function("document", "PARCOURS", `${source}\nreturn celluleSemaines;`)(document, P);
  const texte = el => (el.enfants.length ? el.enfants.map(texte).join("") : el.textContent);
  const rania = avecSeances(["2026-10-06", "2026-10-08", "2026-10-13", "2026-10-26", "2026-10-28", "2026-10-28"]);
  const zone = cellule({parcours: rania, semaines: P.seancesParSemaine(rania, JEUDI)});
  assert.equal(texte(zone), "2 · 1 · 0 · 3");
  // Lot 8 (retours du 31/10/2026) : le séparateur s'appelle « sep-semaine ».
  // Il s'appelait « point » et prenait la pastille verte de « ● Ouvert à
  // toute la classe » (une règle .point globale du lot 5b) : un rond vert
  // entre chaque semaine. La pastille ne vaut plus que dans sa ligne.
  const separateurs = zone.enfants.filter(e => e.className === "sep-semaine");
  assert.deepEqual(separateurs.map(e => e.textContent), ["\u00a0·\u00a0", "\u00a0·\u00a0", "\u00a0·\u00a0"]);
  const nombres = zone.enfants.filter(e => e.className !== "sep-semaine");
  assert.ok(!zone.enfants.some(e => e.className === "point"), "plus de « point » dans la case");
  const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
  assert.match(style, /\.semaines \.sep-semaine \{ color: var\(--muted\); \}/, "le séparateur, en gris : du texte");
  assert.doesNotMatch(style, /^\s*\.point[ ,.{]/m, "aucune règle « .point » globale : elle repeindrait tout ce qui s'appelle « point »");
  assert.match(style, /\.qui-voit \.point \{ display: inline-block; width: 10px; height: 10px;/, "la pastille de « qui voit », dans sa ligne seulement");
  assert.match(style, /#seance-direct \.point \{ color: #f9bf3b; \}/, "le « ● » jaune de « Reprendre la séance en direct » redevient un simple caractère");
  assert.deepEqual(nombres.map(e => e.tag), ["span", "span", "span", "b"], "la semaine en cours, et elle seule, en gras (sabotage g)");
  assert.equal(nombres[3].textContent, "3", "à droite : la semaine en cours");
  assert.equal(nombres[2].className, "zero", "une semaine sans séance en gris");
  assert.match(zone.title, /semaine du 5 oct\. : 2 · semaine du 12 oct\. : 1 · semaine du 19 oct\. : 0 · cette semaine : 3/);
  // Pas de parcours : un tiret, comme avant.
  assert.equal(texte(cellule({parcours: null, semaines: null})), "—");
  // La page lit tout dans resumeProf, et trie sur la clé du moteur.
  assert.match(page, /semaines: resume\.semaines \|\| null,/);
  assert.match(page, /if \(tri\.colonne === "semaine"\) return eleve\.lu\.ordreSemaines;/);
  assert.match(page, /cSemaine\.append\(celluleSemaines\(eleve\.lu\)\);\s*const absence = joursSansRien\(eleve\);/, "« rien depuis N jours » reste dans la case");
  // Pas de nouveau bouton : la colonne reste « large » (cachée au téléphone).
  assert.match(page, /\[cEnCours, cSemaine, cRetard\]\.forEach\(large\);/);
});

test("Mon parcours : « Mes 4 dernières semaines : … séances » sous ma table, par le même calcul", () => {
  assert.match(html, /<div id="parcours-matable" class="parcours-row is-ma-table parcours-matable"><\/div>\s*<!--[^]*?-->\s*<p id="parcours-semaines" class="semaine parcours-semaines" hidden><\/p>/);
  const debut = html.indexOf("      function renderSemaines() {");
  assert.ok(debut > 0);
  const source = html.slice(debut, html.indexOf("\n      }\n", debut) + 8);
  assert.match(source, /PARCOURS\.seancesParSemaine\(parcours\)/, "le même calcul que la colonne de Ma classe (sabotage i)");
  assert.match(html, /renderMaTable\(\$\("parcours-matable"\), etat, tableEnCours\(etat\)\);\s*renderSemaines\(\);/);
  const zone = {hidden: true, enfants: [], replaceChildren() { this.enfants = []; }, append(...e) { this.enfants.push(...e); }};
  const document = {createElement: tag => ({tag, textContent: ""})};
  const dessiner = (parcours, vueProf) => {
    new Function("$", "PARCOURS", "parcours", "VUE_PROF", "document", `${source}\nrenderSemaines();`)(() => zone, {...P, seancesParSemaine: p => P.seancesParSemaine(p, JEUDI)}, parcours, vueProf, document);
    return zone.hidden ? null : zone.enfants.map(e => (typeof e === "string" ? e : e.tag === "b" ? `[${e.textContent}]` : e.textContent)).join("");
  };
  const lucas = avecSeances(["2026-10-14"]);
  assert.equal(dessiner(lucas, false), "Mes 4 dernières semaines : 0 · 1 · 0 · [0] séances");
  assert.equal(dessiner(P.creerParcours(), false), null, "aucune séance : rien à l'élève (sabotage h)");
  assert.equal(dessiner(P.creerParcours(), true), "Mes 4 dernières semaines : 0 · 0 · 0 · [0] séances", "le professeur la lit toujours");
  // Le moteur est bien rechargé par les navigateurs (cache-buster) et la
  // page prof sert la même copie (test suivi-moteur-copie).
  assert.match(html, /<script src="\.\/defi_tables_mon_parcours\.js\?v=20261108-1"><\/script>/);
  // Ordinateur : la ligne prend la rangée 2 de la colonne de droite, le tableau
  // couvre les quatre rangées.
  assert.match(html, /\.parcours-corps > \.parcours-semaines \{ grid-column: 2; grid-row: 2;/);
  assert.match(html, /\.calculs-tableau \{ grid-column: 1; grid-row: 1 \/ span 4;/);
  assert.match(html, /\.calculs-tete \{ grid-column: 2; grid-row: 3; \}/);
  assert.match(html, /\.parcours-suite \{ grid-column: 2; grid-row: 4;/);
});
