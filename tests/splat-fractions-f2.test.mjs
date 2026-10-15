/* SPLAT! — « A — Jetons et parts » (lot F2, 15/10/2026) : le mode élève avec saisie, les jumelles,
   l'étiquette « 1 = d/d », les corrections et l'énoncé en 6/page.
   Décidé le 15/10 :
     - Écriture fraction : trois cases (entier, numérateur, dénominateur), la barre est tracée ; l'entier
       peut rester vide ; toute écriture de même valeur est juste (15/4, 3 + 6/8) ; comparaison en
       fractions exactes. Une case incomplète ou un dénominateur 0 est fausse (comme une case vide en A).
     - Écriture décimale : une seule case (« 3,75 », le point est accepté).
     - Le résultat envoyé au suivi garde sa forme : réussite ou échec par carte, aucune valeur libre.
     - Les fonctions nouvelles restent en fin de script : les tests des autres modes découpent le texte
       de la page entre leurs fonctions. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const pave = await readFile(new URL("../assets/js/mathsgo-pave-chiffres.js", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function ligne(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}
const FONCTIONS = ["frPgcd", "fr", "frNorm", "frAdd", "frEq", "ufChiffres", "ufFractionSaisie", "ufDecimalSaisi", "ufAttenduDe",
  "ufCaseJuste", "ufValiderCase", "ufPlaceEtiquetteUnite", "ufToucheDuPave", "ufNettoyerSaisie", "ufSauterCase", "jumelleCle"];
const m = new Function(`
  ${ligne("const UF_UNITE = ")}
  ${FONCTIONS.map(fn).join("\n")}
  return { ${FONCTIONS.join(", ")} };
`)();

// --- la saisie, comparée en fractions exactes -------------------------------------------------------
test("fraction : toute écriture de même valeur est juste, l'entier peut rester vide", () => {
  const v = m.ufFractionSaisie;
  const egal = (x, n, d) => assert.ok(x && m.frEq(x, m.fr(n, d)), JSON.stringify(x));
  egal(v("3", "3", "4"), 15, 4);
  egal(v("", "15", "4"), 15, 4);
  egal(v("3", "6", "8"), 15, 4);
  egal(v("4", "", ""), 4, 1);
  egal(v("", "8", "2"), 4, 1);
  egal(v("0", "1", "2"), 1, 2);
});
test("fraction : une case incomplète, un 0 en bas, des signes ou des lettres ne donnent aucune valeur", () => {
  const v = m.ufFractionSaisie;
  for(const a of [["", "", ""], ["3", "1", ""], ["3", "", "4"], ["3", "1", "0"], ["-1", "1", "2"], ["1", "1.5", "2"], ["a", "1", "2"],
    ["123", "1", "2"], ["1", "1234", "2"], ["1", "1", "123"], ["1e2", "1", "2"], [" ", " ", " "]]) assert.equal(v(...a), null, JSON.stringify(a));
});
test("décimal : virgule ou point, bornes, jamais de calcul en flottant", () => {
  const d = m.ufDecimalSaisi;
  assert.ok(m.frEq(d("3,75"), m.fr(15, 4)));
  assert.ok(m.frEq(d("3.75"), m.fr(15, 4)));
  assert.ok(m.frEq(d("2,50"), m.fr(5, 2)));
  assert.ok(m.frEq(d("1,4"), m.fr(7, 5)));
  assert.ok(m.frEq(d("4"), m.fr(4, 1)));
  for(const x of ["", ",", "3,", ",5", "1,2,3", "3,7555", "1234", "-2", "1e3", "0x10", "3 75", "NaN"]) assert.equal(d(x), null, x);
});
test("une case est juste d'après data-attendu, écrit par la page ; un attribut sale ne donne rien", () => {
  const casee = (attendu, mode, valeurs) => ({
    getAttribute: (k) => ({ "data-attendu":attendu, "data-uf":mode })[k],
    querySelectorAll: () => valeurs.map((value) => ({ value }))
  });
  assert.equal(m.ufCaseJuste(casee("15/4", "fraction", ["3", "3", "4"])), true);
  assert.equal(m.ufCaseJuste(casee("15/4", "fraction", ["3", "2", "4"])), false);
  assert.equal(m.ufCaseJuste(casee("15/4", "decimale", ["3,75"])), true);
  assert.equal(m.ufCaseJuste(casee("15/4", "decimale", ["3,7"])), false);
  assert.equal(m.ufCaseJuste(casee("5/0", "fraction", ["1", "1", "1"])), false);
  assert.equal(m.ufCaseJuste(casee("0/0", "fraction", ["1", "1", "1"])), false, "un dénominateur 0 attendu ne valide rien (a/0 = n/0 pour tout n)");
  assert.equal(m.ufCaseJuste(casee("0/0", "decimale", ["0"])), false);
  assert.equal(m.ufCaseJuste(casee("javascript:1", "fraction", ["1", "1", "1"])), false);
  assert.equal(m.ufCaseJuste(casee("", "fraction", [])), false);
});
test("les champs se nettoient : chiffres seulement, virgule unique en décimale, « + » et « / » sautent", () => {
  const champ = (value, cls) => ({ value, classList:{ contains:(c) => cls.includes(c) } });
  let c = champ("1a2-3", ["ufN"]); m.ufNettoyerSaisie(c); assert.equal(c.value, "123");
  c = champ("3.7,5x", ["ufDec"]); m.ufNettoyerSaisie(c); assert.equal(c.value, "3,75");
  const suivant = { focus(){ this.pris = true; } };
  const e = { ...champ("2", ["ufE"]), closest:() => ({ querySelectorAll:() => [e, suivant] }) };
  assert.equal(m.ufSauterCase(e, "+"), true); assert.equal(suivant.pris, true);
  assert.equal(m.ufSauterCase(e, "/"), false);
});

test("case rouge au pavé : chaque petite case garde sa marque jusqu'à ce qu'on y tape (pas de « 45 »)", () => {
  const boite = () => { const k = new Set(); return { classList:{ toggle:(c, on) => (on ? k.add(c) : k.delete(c)), contains:(c) => k.has(c) } }; };
  const boites = [boite(), boite(), boite()];
  const casee = (valeurs) => ({
    getAttribute: (k) => ({ "data-attendu":"29/6", "data-uf":"fraction" })[k],
    querySelectorAll: (q) => q === ".ufBoite" ? boites : valeurs.map((value) => ({ value }))
  });
  assert.equal(m.ufValiderCase(casee(["3", "4", "6"])), false);
  assert.deepEqual(boites.map((b) => b.classList.contains("ufFaux")), [true, true, true]);
  assert.equal(m.ufValiderCase(casee(["4", "5", "6"])), true);
  assert.deepEqual(boites.map((b) => b.classList.contains("ufFaux")), [false, false, false]);
  // le pavé remplace dans une petite case marquée ; la saisie retire la marque de CETTE petite case seulement
  assert.match(fn("elevePaveActiver"), /aRemplacer: champ => \{ const b = champ\.closest\("\.ufBoite"\); if\(b\) return b\.classList\.contains\("ufFaux"\);/);
  assert.match(html, /const b = c\.closest\("\.ufBoite"\);\n\s*if\(b\) b\.classList\.remove\("ufFaux"\);/);
  // et la marque se VOIT : une petite case pas encore retouchée reste rose, chiffres rouges, même active au pavé
  assert.match(html, /\n\s*\.ufBoite\.ufFaux\{background:#fee2e2\}/);
  assert.match(html, /\n\s*\.ufBoite\.ufFaux input\.eleveChamp\{background:transparent;color:#b91c1c\}/);
  assert.match(html, /body\.eleve-pave \.ufBoite\.ufFaux\.mg-pave-case-active\{background:#fee2e2\}/);
});

// --- le pavé : la touche facultative ----------------------------------------------------------------
test("la touche du pavé : « ▶ » en fraction, « , » en décimale, rien sans case UF", () => {
  const panneau = (mode) => ({ querySelector: () => mode ? { getAttribute: () => mode } : null });
  assert.equal(m.ufToucheDuPave(panneau("fraction")), "suivante");
  assert.equal(m.ufToucheDuPave(panneau("decimale")), "virgule");
  assert.equal(m.ufToucheDuPave(panneau(null)), null);
  assert.match(pave, /\n\s+touche: touche,/, "le composant offre pave.touche()");
  const corps = pave.slice(pave.indexOf("function touche(sorte)"), pave.indexOf("function touche(sorte)") + 1500);
  assert.match(corps, /"suivante"/); assert.match(corps, /"virgule"/);
  assert.match(pave, /Pourquoi|12 touches/, "les 12 touches de toujours restent la valeur par défaut");
  assert.match(fn("elevePaveActiver"), /typeof ufToucheDuPave === "function"/);
});

// --- l'étiquette « 1 = d/d » ---------------------------------------------------------------------------
test("l'étiquette se pose près d'un jeton entier, sans toucher un autre jeton ni sortir du plateau", () => {
  const bornes = { x:0, y:0, w:1360, h:660 }, r = 56;
  assert.equal(m.ufPlaceEtiquetteUnite([{ cx:100, cy:100, v:{ n:1, d:2 } }], r, bornes), null, "pas de jeton entier : rien");
  const e = m.ufPlaceEtiquetteUnite([{ cx:300, cy:300, v:{ n:4, d:4 } }], r, bornes);
  assert.equal(e.i, 0); assert.equal(e.cx, 300);
  assert.ok(e.y > 300, "dessous quand la place est libre");
  const haut = m.ufPlaceEtiquetteUnite([{ cx:300, cy:620, v:{ n:4, d:4 } }], r, bornes);
  assert.ok(haut.y < 620, "dessus quand le bas est trop près du bord");
  // jeton collé au bord gauche : l'étiquette glisse et reste dans le plateau
  const bord = m.ufPlaceEtiquetteUnite([{ cx:70, cy:300, v:{ n:2, d:2 } }], r, bornes);
  assert.ok(bord.cx - 116 >= 6, "pas de débord à gauche");
  assert.ok(bord.y > 300 + r, "toujours sous le jeton (glissée), pas renvoyée sur le côté");
  const coin = m.ufPlaceEtiquetteUnite([{ cx:1300, cy:610, v:{ n:2, d:2 } }], r, bornes);
  assert.ok(coin.cx + 116 <= 1354 && coin.y <= 654, "pas de débord dans le coin");
  const gene = m.ufPlaceEtiquetteUnite([{ cx:300, cy:300, v:{ n:4, d:4 } }, { cx:300, cy:430, v:{ n:4, d:4 } }], r, bornes);
  assert.equal(gene.i, 0); assert.ok(gene.y < 300 || gene.y > 430, "ne recouvre pas le jeton voisin");
});

// --- les jumelles -----------------------------------------------------------------------------------------
test("jumelles : même niveau, même écriture, même dénominateur, même sorte de caché", () => {
  const carte = (extra = {}, den = 4) => ({ family:"UF", den, _unit:{ niveau:3, ecriture:"", dens:[2, 4], parts:"", hiddenInteger:false, ...extra } });
  assert.equal(m.jumelleCle(carte()), m.jumelleCle(carte()));
  for(const autre of [carte({ niveau:4 }), carte({ ecriture:"decimale" }), carte({ hiddenInteger:true }), carte({}, 3), carte({ dens:[2] })])
    assert.notEqual(m.jumelleCle(carte()), m.jumelleCle(autre));
});

// --- la page ------------------------------------------------------------------------------------------------
test("menu et niveaux : « A — Jetons et parts », niveaux nommés, « 5 — Tout mélangé »", () => {
  assert.match(html, /<option value="UF">A — Jetons et parts<\/option>/);
  for(const nom of ["1 — Demis, une part par disque", "2 — Tiers et quarts, on regroupe", "3 — Demis, tiers, quarts, plusieurs parts",
    "4 — Cinquièmes à huitièmes, plusieurs parts", "5 — Tout mélangé"]) assert.ok(html.includes(`>${nom}</option>`), nom);
  assert.match(html, /lire\("fracNiveau", 1, 1, 5\)/);
  const niv5 = new Function(`${fn("ufNiveau")} return ufNiveau;`)();
  assert.deepEqual(niv5(5).dens, [2, 3, 4, 5, 6, 8]);
  assert.equal(niv5(5).depasse, true);
  assert.equal(niv5(5).unitaires, false);
});
test("le suivi garde sa forme : eleveValiderSplat ne transmet qu'une réussite ou un échec par carte", () => {
  const v = fn("eleveValiderSplat");
  assert.match(v, /ufValiderCase\(c\)/);
  assert.doesNotMatch(v, /ufFractionSaisie|ufDecimalSaisi/, "aucune valeur saisie n'est lue ici, ni envoyée");
});
test("les fonctions de A — Jetons et parts sont à la fin du script, après eleveNouvellesCartes", () => {
  const fin = html.indexOf("\nfunction eleveNouvellesCartes(");
  assert.ok(fin > 0);
  for(const nom of ["ufChiffres", "ufFractionSaisie", "ufDecimalSaisi", "ufCaseJuste", "ufCaseHtml", "ufCasesEleve", "ufClasseCorpsEleve",
    "ufPlaceEtiquetteUnite", "ufEtiquetteUniteEcran", "ufRendreCarteImprimee", "ufSixCorrection", "ufToucheDuPave"])
    assert.ok(html.indexOf(`\nfunction ${nom}(`) > fin, `${nom} avant eleveNouvellesCartes`);
});
test("renderEleveSplat n'appelle rien de plus pour A — Jetons et parts qu'un aiguillage", () => {
  const r = fn("renderEleveSplat");
  assert.match(r, /const uf = ufCasesEleve\(card\); bas = uf\.bas; haut = uf\.haut;/);
  assert.doesNotMatch(r, /ufCaseHtml|ufBrancher/);
});
test("l'impression : A — Jetons et parts a ses deux corrections courtes et son énoncé en 6/page", () => {
  assert.match(fn("sixColonneFamille"), /"UF"/);
  assert.match(fn("renderSixCorrectionIntoSvg"), /card\.family === "UF"\) ufSixCorrection\(g, card, part, mk\)/);
  assert.match(fn("syncPrintModeUI"), /const sixOk = kind === "table" \|\| act === "UF"/);
  assert.match(fn("renderCardIntoSvg"), /ufRendreCarteImprimee\(targetSvg, card, tEl, tText, \{ sixColonne:!!opts\.sixColonne, corrige:revealAnswers \}\)/);
});
