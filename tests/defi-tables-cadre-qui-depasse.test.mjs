// Défi tables — lot « le cadre qui dépasse » (11/10/2026). Sur ordinateur, le
// cadre blanc doit tenir entier dans l'écran (règle de Gwenaël, 01/10).
// Mesuré au navigateur sur le main du 11/10 (élève à code, 1 366 × 768,
// 1 366 × 650, 1 024 × 600) : tout résultat avec des erreurs débordait (dès
// 4 erreurs ; 968 px pour 20 erreurs en 1 024 × 600), et « Comment ça
// marche ? » ouvert poussait le cadre jusqu'à 290 px sous l'écran (accueil)
// et 238 px (Mon parcours). Choix de Gwenaël (planches 1 à 4) :
//  A  — un résultat AVEC des erreurs se range sur deux colonnes (ordinateur) ;
//  N1 — la notice s'ouvre dans une fenêtre par-dessus (ordinateur) ;
// et le résultat se mesure comme l'accueil (× 0,75 au plus petit, jamais
// « page longue » à × 1). Au téléphone et sur tablette, rien ne bouge.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

// Le bloc CSS des deux colonnes, tel qu'il est écrit.
function blocDeuxColonnes() {
  const debut = html.indexOf("    @media (min-width: 1024px) {\n      .result.avec-erreurs {");
  assert.ok(debut > 0, "le bloc des deux colonnes existe, sous @media (min-width: 1024px)");
  return html.slice(debut, html.indexOf("\n    }\n", debut));
}

test("A · deux colonnes : seulement sur ordinateur, seulement avec des erreurs", () => {
  const bloc = blocDeuxColonnes();
  assert.match(bloc, /\.result\.avec-erreurs \{ max-width: none; display: grid; grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\); grid-template-rows: repeat\(7, auto\) 1fr;/);
  assert.match(bloc, /\.result\.avec-erreurs > \* \{ grid-column: 1; \}/, "verdict, « Et maintenant » et boutons à gauche");
  assert.match(bloc, /\.result\.avec-erreurs > \.corrections \{ grid-column: 2; grid-row: 1 \/ -1; margin: 0; \}/, "les erreurs et les réponses justes à droite, sur toute la hauteur");
  assert.match(bloc, /\.result\.avec-erreurs \.correction-list \{ grid-template-columns: 1fr 1fr; \}/, "deux erreurs par ligne");
  assert.match(bloc, /\.result\.avec-erreurs \.result-actions \{ display: grid; grid-template-columns: 1fr 1fr; gap: 9px; \}/, "les boutons : la grille du téléphone");
  // Chaque règle du bloc vise .result.avec-erreurs : rien d'autre ne bouge.
  for (const regle of bloc.split("\n").slice(1).filter(l => l.trim() && !l.trim().startsWith("/*"))) {
    assert.match(regle, /^\s*\.result\.avec-erreurs/, `règle hors du résultat avec erreurs : ${regle.trim()}`);
  }
  // Nulle part ailleurs (téléphone, tablette) : la classe n'existe que dans ce bloc.
  assert.equal(html.split(".result.avec-erreurs").length - 1, bloc.split(".result.avec-erreurs").length - 1);
});

test("A · la classe suit les erreurs, à chaque résultat ; les réponses justes restent ouvertes sur ordinateur", () => {
  assert.match(html, /zone\.replaceChildren\(\);\s*(\/\/[^\n]*\s*)*\$\("result"\)\.classList\.toggle\("avec-erreurs", wrongEntries\.length > 0\);\s*if \(wrongEntries\.length\) \{/);
  assert.match(html, /details\.open = window\.matchMedia\("\(min-width: 1040px\)"\)\.matches;\s*(\/\/[^\n]*\s*)*details\.addEventListener\("toggle", \(\) => ajusterEchelle\(\)\);/, "déplier les réponses justes remesure l'échelle");
});

// ajusterEchelle, EXÉCUTÉE (comme tests/defi-tables-mon-parcours-lot) : la
// hauteur du corps suit l'échelle.
function echelle({ecran, hauteur, largeur = 1366, fenetre = 768}) {
  const proprietes = {};
  const classes = new Set();
  const visibles = {parcours: false, lire: false, result: ecran === "result", intro: false, "mode-screen": false};
  const document = {
    documentElement: {style: {setProperty: (k, v) => { proprietes[k] = v; }, getPropertyValue: k => proprietes[k] || ""}},
    body: {classList: {contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c)},
      get offsetHeight() { return Math.round(hauteur * Number(proprietes["--echelle"] || 1)); }},
    getElementById: id => (id in visibles ? {hidden: !visibles[id]} : null),
    querySelector: () => null
  };
  const window = {innerWidth: largeur, innerHeight: fenetre, scrollY: 0, scrollTo: () => {}, matchMedia: () => ({matches: false})};
  const code = html.slice(html.indexOf("      const ECHELLE = Object.freeze("), html.indexOf('      window.addEventListener("resize", ajusterEchelle);'));
  new Function("document", "window", "retracerSauts", `${code}\najusterEchelle();`)(document, window, () => {});
  return Number(proprietes["--echelle"]);
}

test("le résultat se mesure comme l'accueil : × 0,75 s'il ne tient pas, plus jamais × 1", () => {
  assert.equal(echelle({ecran: "result", hauteur: 700}), 1, "ce qui tient n'est pas touché");
  const z = echelle({ecran: "result", hauteur: 800});
  assert.ok(z < 1 && z <= 768 / 800 && z > 768 / 800 - 0.01, `réduit juste ce qu'il faut (${z})`);
  assert.equal(echelle({ecran: "result", hauteur: 1700, fenetre: 600, largeur: 1024}), 0.75, "20 erreurs : × 0,75, pas × 1 (avant : 968 px sous l'écran)");
  assert.equal(echelle({ecran: "result", hauteur: 1700, largeur: 402, fenetre: 740}), 1, "téléphone : jamais d'échelle");
  // Un autre écran sans mesure particulière garde son comportement (page longue à × 1).
  assert.equal(echelle({ecran: "aucun", hauteur: 1700}), 1);
});

test("N1 · la fenêtre de la notice : hors de la colonne, la même notice, ✕ pour fermer", () => {
  const fin = html.indexOf("  </main>");
  const fenetre = html.indexOf('<dialog id="notice-fenetre" class="notice-fenetre" aria-labelledby="notice-fenetre-titre">');
  assert.ok(fin > 0 && fenetre > fin, "après </main> : l'échelle de la colonne ne la réduit pas");
  const dialog = html.slice(fenetre, html.indexOf("</dialog>", fenetre));
  assert.match(dialog, /<h2 id="notice-fenetre-titre">Comment ça marche&nbsp;\?<\/h2>/);
  assert.match(dialog, /<button id="notice-fenetre-fermer" class="notice-fenetre-fermer" type="button" aria-label="Fermer"><svg/, "la croix est dessinée (centrée), pas un caractère");
  assert.match(dialog, /<div class="notice" data-notice><\/div>/, "remplie par poserNotices(), comme l'accueil et Mon parcours");
  assert.match(html, /\.notice-fenetre::backdrop \{/);
  // Les notices dépliables restent (téléphone, tablette).
  assert.match(html, /id="acc-notice" class="notice" data-notice hidden/);
  assert.match(html, /id="parcours-notice" class="notice" data-notice hidden/);
  assert.match(html, /brancherNoticeEnFenetre\(\);\s*\$\("acc-notice-bouton"\)\.addEventListener\("click"/);
});

// basculerNotice et la fenêtre, EXÉCUTÉES avec de faux éléments.
function notice(largeur) {
  const code = html.slice(html.indexOf("      let boutonDeLaNotice = null;"), html.indexOf("      /* ---------- Ma séance du jour"));
  const ecouteurs = {};
  const element = id => ({id, hidden: true, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, focus() { this.focus_ = true; },
    scrollIntoView() {}, addEventListener(type, f) { (ecouteurs[`${id}:${type}`] ||= []).push(f); }});
  const els = Object.fromEntries(["acc-notice", "acc-notice-bouton", "notice-fenetre-fermer"].map(id => [id, element(id)]));
  const fen = Object.assign(element("notice-fenetre"), {open: false, showModal() { this.open = true; }, close() { this.open = false; (ecouteurs["notice-fenetre:close"] || []).forEach(f => f()); }});
  els["notice-fenetre"] = fen;
  const window = {matchMedia: q => ({matches: q === "(min-width: 1024px)" && largeur >= 1024})};
  const api = new Function("$", "window", `${code}\nreturn {basculerNotice, brancherNoticeEnFenetre};`)(id => els[id] || null, window);
  api.brancherNoticeEnFenetre();
  return {api, els, fen, ecouteurs};
}

test("N1 · sur ordinateur, la fenêtre ; au téléphone et sur tablette, la notice dépliée comme avant", () => {
  const o = notice(1366);
  o.api.basculerNotice("acc-notice-bouton", "acc-notice");
  assert.equal(o.fen.open, true, "la fenêtre s'ouvre");
  assert.equal(o.els["acc-notice"].hidden, true, "rien ne se déplie sous l'accueil");
  assert.equal(o.els["acc-notice-bouton"].attrs["aria-expanded"], "true");
  o.ecouteurs["notice-fenetre-fermer:click"][0]();
  assert.equal(o.fen.open, false, "✕ ferme");
  assert.equal(o.els["acc-notice-bouton"].attrs["aria-expanded"], "false");
  assert.equal(o.els["acc-notice-bouton"].focus_, true, "le bouton reprend la main");
  o.api.basculerNotice("acc-notice-bouton", "acc-notice");
  o.ecouteurs["notice-fenetre:click"][0]({target: {}});
  assert.equal(o.fen.open, true, "un clic DANS la carte ne ferme pas");
  o.ecouteurs["notice-fenetre:click"][0]({target: o.fen});
  assert.equal(o.fen.open, false, "un clic sur le fond ferme");
  for (const largeur of [402, 820, 1023]) {
    const t = notice(largeur);
    t.api.basculerNotice("acc-notice-bouton", "acc-notice");
    assert.equal(t.fen.open, false, `${largeur} px : pas de fenêtre`);
    assert.equal(t.els["acc-notice"].hidden, false, `${largeur} px : la notice se déplie dessous`);
    t.api.basculerNotice("acc-notice-bouton", "acc-notice");
    assert.equal(t.els["acc-notice"].hidden, true, `${largeur} px : et se replie`);
  }
});
