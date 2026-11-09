/* SPLAT! — rouvrir une étape déjà réussie (lot « rejouer », décidé avec Gwenaël le 09/11/2026).

   Avant : l'élève qui rouvrait une étape à l'étoile allumée retombait sur la carte 1 des MÊMES
   cartes. Maintenant il voit d'abord « Étape réussie ! » (planches validées telles quelles dans
   splat-rejouer\) : l'étoile allumée, « Ta meilleure série : N cartes sur M du premier coup. »
   (omise sans nombre de cartes), puis
   - mondes 1 à 4 : « Je rejoue avec de nouvelles cartes ▶ » — la même adresse avec une autre
     graine (pour CHAQUE fiche d'une étape composée) et nouvelles=1 : d'autres nombres ;
   - mondes 5 et 6 (ÉquaSplat) : « Je rejoue la série ▶ », les mêmes équations ;
   et « Retour à la carte des mondes ». Seulement dans le parcours, quand rien n'est à reprendre.
   Rien ne change dans ce qui est enregistré, ni dans le moteur, ni au serveur.
   Ces tests exécutent les fonctions des pages telles qu'elles sont écrites (extraites des fichiers). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PARCOURS, fauxStockage, fauxOnglet } from "./splat-suivi-monde.mjs";

const lire = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const CLE = "mathsgo-splat-parcours";
const petit = lire("outils/splat_tache_barre.html");
const html = lire("outils/splat.html");
const equa = lire("outils/equasplat.html");
const univers = lire("outils/splat_univers.html");

function source(page, nom, retrait = "") {
  const debut = page.indexOf(`\n${retrait}function ${nom}(`);
  assert.ok(debut > 0, `${nom} introuvable`);
  const fin = page.indexOf(`\n${retrait}}\n`, debut + 1);
  return page.slice(debut + 1, fin + retrait.length + 3);
}
function stockage(contenu = {}) {
  const local = fauxStockage({ [CLE]: JSON.stringify(contenu) });
  local.lire = () => PARCOURS.charger(local, "").etapes;
  return local;
}
const moteurPage = (page) => ["eleveSuivi", "eleveEtapeLue", "eleveVuesReprise"].map((n) => source(page, n)).join("\n");

const PAGES = [["splat_tache_barre.html", petit, "renderEleveEtapeReussie", "fin-etoile on", "fin-sous", "fin-action", "fin-sorties", "fin-lien"],
               ["splat.html", html, "renderEleveEtapeReussieSplat", "finEtoile on", "finSous", "finAction", "finSorties", "finLien"]];
const FAITE = { fait: true, etoiles: 7, cartes: 12, vues: 2, essais: 3, date: "2026-11-05" };

/* ---------- « Ta meilleure série » : les trois pages ---------- */
for (const [nom, page, retrait, mot] of [["splat_tache_barre.html", petit, "", "carte"], ["splat.html", html, "", "carte"], ["equasplat.html", equa, "  ", "équation"]]) {
  const texte = new Function(`${source(page, "eleveMeilleureSerieTexte", retrait)}; return eleveMeilleureSerieTexte;`)();
  test(`${nom} : « Ta meilleure série : N ${mot}s sur M du premier coup. », omise sans nombre de cartes`, () => {
    assert.equal(texte({ etoiles: 7, cartes: 12, vues: 2 }, mot), `Ta meilleure série : 7 ${mot}s sur 12 du premier coup.`);
    assert.equal(texte({ etoiles: 1, cartes: 4, vues: 0 }, mot), `Ta meilleure série : 1 ${mot} sur 4 du premier coup.`);
    assert.equal(texte({ etoiles: 0, cartes: 4, vues: 4 }, mot), `Ta meilleure série : 0 ${mot} sur 4 du premier coup.`);
    assert.equal(texte({ fait: true, etoiles: 4, cartes: 0 }, mot), "", "cartes = 0 : la ligne est omise");
    assert.equal(texte({ fait: true, etoiles: 4 }, mot), "", "ancienne entrée sans « cartes » : la ligne est omise");
    // ÉquaSplat range « etoiles » = toutes les équations (une passée puis rejouée devient verte) :
    // « du premier coup » = les équations moins celles passées
    assert.equal(texte({ etoiles: 12, cartes: 12, vues: 2 }, mot), `Ta meilleure série : 10 ${mot}s sur 12 du premier coup.`);
  });
}

/* ---------- mondes 1 à 4 : quand l'écran s'affiche ---------- */
for (const [nom, page] of PAGES) {
  // eleveEtapeReussieLue : l'étape de la case, si elle est faite ; jamais hors parcours ni sur
  // une adresse déjà « nouvelles cartes »
  function lue({ etape, parcours = "p", search = "?parcours=p" }) {
    const store = stockage(etape ? { p: etape } : {});
    const onglet = fauxOnglet({ local: store });
    onglet.fenetre.location.search = search;
    return new Function("window", `
      const parcoursId = ${JSON.stringify(parcours)};
      let eleveSuiviObjet;
      ${moteurPage(page)}
      ${source(page, "eleveNouvellesCartesAdresse")}
      ${source(page, "eleveEtapeReussieLue")}
      return eleveEtapeReussieLue();`)(onglet.fenetre);
  }
  test(`${nom} : étape faite → l'écran ; pas faite, sans case, hors parcours, nouvelles=1 → rien`, () => {
    const e = lue({ etape: FAITE });
    assert.ok(e && e.fait && e.cartes === 12 && e.etoiles === 7);
    assert.equal(lue({ etape: { fait: false, etoiles: 0, cartes: 12, vues: 0, essais: 1, date: "2026-11-05" } }), null);
    assert.equal(lue({}), null);
    assert.equal(lue({ etape: FAITE, parcours: "", search: "" }), null, "hors parcours : jamais");
    assert.equal(lue({ etape: FAITE, search: "?parcours=p&seed=4&nouvelles=1" }), null, "série « nouvelles cartes » : directement la carte 1");
  });

  test(`${nom} : l'écran passe AVANT la carte 1 et l'écran de fin, la reprise passe avant lui`, () => {
    const rend = nom === "splat.html" ? source(page, "renderEleveSplat") : source(page, "renderEleve");
    const ecran = nom === "splat.html" ? "if(eleveAccueilReussie){ renderEleveEtapeReussieSplat(panneau); elevePaveSynchroniser(); return; }"
      : "if (eleveAccueilReussie) { renderEleveEtapeReussie(main); return; }";
    const fin = nom === "splat.html" ? "if(eleveIdx >= eleveSerie.length){ renderEleveFinSplat(panneau);" : "if (eleveIdx >= eleveSerie.length) { renderEleveFin(main); return; }";
    assert.ok(rend.includes(ecran), "l'écran est branché");
    assert.ok(rend.indexOf(ecran) < rend.indexOf(fin), "avant l'écran de fin et la carte");
    // décidé une fois, à la fin du bloc de reprise : seulement si rien n'a été repris (carte 1)
    const decide = "eleveAccueilReussie = eleveIdx === 0 ? eleveEtapeReussieLue() : null;";
    assert.ok(rend.includes(decide));
    assert.ok(rend.indexOf(decide) > rend.indexOf("stockage indisponible"), "après la reprise");
    assert.ok(rend.indexOf(decide) < rend.indexOf(ecran));
  });
}

/* Le bloc de reprise de Petit SPLAT!, exécuté tel quel jusqu'à la décision de l'écran. */
function ouvrirPetit(etape, search = "?parcours=p") {
  const debut = petit.indexOf("if (eleveSerie.length && !eleveRepriseFaite && parcoursId) {");
  const decide = "eleveAccueilReussie = eleveIdx === 0 ? eleveEtapeReussieLue() : null;";
  const fin = petit.indexOf(decide, debut);
  assert.ok(debut > 0 && fin > debut, "bloc de reprise introuvable");
  const onglet = fauxOnglet({ local: stockage({ p: etape }) });
  onglet.fenetre.location.search = search;
  return new Function("window", `
    const parcoursId = "p", eleveSignatureSerie = () => "SIG";
    let eleveSerie = new Array(12).fill({}), eleveRepriseFaite = false, eleveIdx = 0, eleveEtoiles = 0, eleveResultats = [];
    let eleveSuiviObjet, eleveVues = 0, eleveAccueilReussie = null;
    ${moteurPage(petit)}
    ${source(petit, "eleveNouvellesCartesAdresse")}
    ${source(petit, "eleveEtapeReussieLue")}
    ${petit.slice(debut, fin + decide.length)}
    }
    return { eleveIdx, accueil: eleveAccueilReussie };`)(onglet.fenetre);
}
test("Petit SPLAT! : étape faite, rien en cours → l'écran ; une série interrompue reprend d'abord (pas d'écran)", () => {
  assert.ok(ouvrirPetit(FAITE).accueil, "l'écran");
  const r = ouvrirPetit({ ...FAITE, enCours: { sig: "SIG", idx: 3, etoiles: 2, res: [true, true, false] } });
  assert.deepEqual([r.eleveIdx, r.accueil], [3, null], "la reprise sur la carte 4");
  // une sauvegarde d'une AUTRE série (empreinte différente) ne se reprend pas : l'écran
  assert.ok(ouvrirPetit({ ...FAITE, enCours: { sig: "AUTRE", idx: 3, etoiles: 2, res: [true, true, false] } }).accueil);
  assert.equal(ouvrirPetit({ fait: false, etoiles: 0, cartes: 12, vues: 0, essais: 1, date: "2026-11-05" }).accueil, null);
});

/* ---------- mondes 1 à 4 : l'écran lui-même ---------- */
function fauxDoc() {
  const elements = {};
  const doc = {
    elements,
    createElement: () => ({ className: "", innerHTML: "" }),
    getElementById(id) { return elements[id] || (elements[id] = { id, style: {}, onclick: null }); }
  };
  return doc;
}
for (const [nom, page, fonction, etoile, sous, action, sorties, lien] of PAGES) {
  function ecran(etape, { bonus = false } = {}) {
    const doc = fauxDoc(), main = { enfants: [], appendChild(n) { this.enfants.push(n); } }, panneau = { innerHTML: "" };
    const allees = [];
    const fenetre = { location: { pathname: "/outils/x.html", search: "?parcours=p&seed=974", hash: "", replace: (u) => allees.push(u) },
      MathsGoSplatEtapes: bonus ? { estBonus: () => true } : undefined };
    new Function("window", "document", "main", "panneau", "eleveAccueilReussie", `
      const parcoursId = "p", ELEVE_URL_MONDES = "/outils/splat_univers.html";
      let eleveSerie = [{ n: 1 }, { n: 2 }], eleveEnqueteDevoile, eleveSchemaEtape, eleveIndicesTel;
      const eleveIndicesAfficher = () => {}, renderCard = () => {}, eleveCadrerScene = () => {}, makeAutoSeed = () => "123456";
      ${source(page, "eleveLienMondesHtml")}
      ${source(page, "eleveMeilleureSerieTexte")}
      ${source(page, "eleveAdresseNouvellesCartes")}
      ${nom === "splat.html" ? source(page, "eleveGraineNeuve") + source(page, "eleveGraineSansTacheVide").replace(/appliquerConfiguration\(q\);\n\s*generate\(\);\n\s*return [^\n]*/, "return true;") : ""}
      ${source(page, "eleveRouvrirNouvellesCartes")}
      ${source(page, fonction)}
      ${fonction}(${nom === "splat.html" ? "panneau" : "main"});`)(fenetre, doc, main, panneau, etape);
    const texte = nom === "splat.html" ? panneau.innerHTML : main.enfants[0].innerHTML;
    return { texte, bouton: doc.elements.eleveNouvellesCartes, allees, tete: doc.elements.eleveTeteHaut };
  }
  test(`${nom} : « Étape réussie ! » tel que sur la planche (étoile allumée, meilleure série, bouton vert, retour à la carte)`, () => {
    const { texte } = ecran(FAITE);
    assert.ok(texte.includes(`<div class="${etoile}">⭐</div>`), "l'étoile allumée");
    assert.ok(texte.includes("<h2>Étape réussie !</h2>"));
    assert.ok(texte.includes(`<p class="${sous}">Ta meilleure série : 7 cartes sur 12 du premier coup.<br>Rejoue avec d’autres nombres : ton étoile reste allumée.</p>`));
    assert.ok(texte.includes(`<div class="${action}"><button id="eleveNouvellesCartes" type="button">Je rejoue avec de nouvelles cartes ▶</button></div>`));
    assert.match(texte, new RegExp(`<div class="${sorties}"><a class="${lien}" href="/outils/splat_univers.html[^"]*"[^>]*>Retour à la carte des mondes</a></div>`));
    assert.doesNotMatch(texte, /Rejouer la série|eleveRejouer"/, "pas d'autre bouton");
  });
  test(`${nom} : sans nombre de cartes (ancienne entrée), la ligne « meilleure série » est omise`, () => {
    const { texte } = ecran({ fait: true, etoiles: 5 });
    assert.ok(texte.includes(`<p class="${sous}">Rejoue avec d’autres nombres : ton étoile reste allumée.</p>`));
    assert.doesNotMatch(texte, /meilleure/);
  });
  test(`${nom} : « Je rejoue avec de nouvelles cartes » rouvre la même adresse, une autre graine, nouvelles=1 — rien n'est écrit`, () => {
    const { bouton, allees } = ecran(FAITE);
    bouton.onclick();
    assert.equal(allees.length, 1);
    const q = new URLSearchParams(allees[0].split("?")[1]);
    assert.ok(allees[0].startsWith("/outils/x.html?"));
    assert.equal(q.get("parcours"), "p");
    assert.equal(q.get("nouvelles"), "1");
    assert.notEqual(q.get("seed"), "974");
    assert.match(source(page, fonction), /^(?![\s\S]*(ecrire\(|eleveEffacerEnCours|eleveSauver|localStorage))/, "aucune écriture");
    // le clic passe par eleveRouvrirNouvellesCartes (partagée avec la fin d'une série réussie, 09/11/2026)
    assert.match(source(page, "eleveRouvrirNouvellesCartes"), /^(?![\s\S]*(ecrire\(|eleveEffacerEnCours|eleveSauver|localStorage))/, "aucune écriture");
  });
  if (nom === "splat.html") {
    test("splat.html : une fiche bonus dit ✨ et « ta tache bonus reste dorée », comme son écran de fin", () => {
      const { texte, tete } = ecran(FAITE, { bonus: true });
      assert.ok(texte.includes('<div class="finEtoile on">✨</div>'));
      assert.ok(texte.includes("ta tache bonus reste dorée."));
      assert.equal(tete.style.display, "none", "comme l'écran de fin : pas de barre « Carte k / N »");
    });
  }
}

/* ---------- l'adresse des nouvelles cartes ---------- */
test("Petit SPLAT! : même réglage, autre graine (jamais la même), nouvelles=1", () => {
  const adresse = new Function(`${source(petit, "eleveAdresseNouvellesCartes")}; return eleveAdresseNouvellesCartes;`)();
  const officielle = "?support=eleve&problem=classic&target=20&splats=mix&exercise=construct&seed=458563&parcours=m1e6";
  const tirages = ["458563", "458563", "777777"];
  const s = adresse(officielle, () => tirages.shift());
  const q0 = new URLSearchParams(officielle), q1 = new URLSearchParams(s);
  assert.equal(q1.get("seed"), "777777", "la graine d'origine est retirée");
  assert.equal(q1.get("nouvelles"), "1");
  for (const [k, v] of q0) if (k !== "seed") assert.equal(q1.get(k), v, k);
});

const PARTIES_M2 = Object.fromEntries([...univers.matchAll(/const (M2[A-Z0-9]+)="(mode=[UN][^"]*)"/g)].map((m) => [m[1], m[2]]));
const ETAPE7 = "?" + PARTIES_M2.M2A1 + "&eleve=1&parcours=m2e1&suite=" + encodeURIComponent(PARTIES_M2.M2A2) + ";" + encodeURIComponent(PARTIES_M2.M2A3);
const adresseSplat = new Function(`${source(html, "eleveAdresseNouvellesCartes")}; ${source(html, "eleveGraineNeuve")}; return { adresse: eleveAdresseNouvellesCartes, graine: eleveGraineNeuve };`)();
const graines = (search) => {
  const q = new URLSearchParams(search);
  return [q.get("seed"), ...String(q.get("suite") || "").split(";").filter(Boolean).map((p) => new URLSearchParams(p).get("seed"))];
};
test("splat.html : étape composée (étape 7) — CHAQUE fiche change de graine, réglages et ordre des fiches gardés", () => {
  assert.deepEqual(graines(ETAPE7), ["974", "477", "478"]);
  for (let i = 0; i < 200; i++) {
    const s = adresseSplat.adresse(ETAPE7, adresseSplat.graine);
    const g = graines(s);
    assert.equal(g.length, 3);
    ["974", "477", "478"].forEach((avant, k) => { assert.notEqual(g[k], avant); assert.equal(g[k].length, avant.length, "autant de chiffres"); });
    const q0 = new URLSearchParams(ETAPE7), q1 = new URLSearchParams(s);
    for (const [k, v] of q0) if (k !== "seed" && k !== "suite") assert.equal(q1.get(k), v, k);
    assert.equal(q1.get("nouvelles"), "1");
    const p0 = q0.get("suite").split(";"), p1 = q1.get("suite").split(";");
    p0.forEach((partie, k) => {
      const a = new URLSearchParams(partie), b = new URLSearchParams(p1[k]);
      a.delete("seed"); b.delete("seed");
      assert.equal(b.toString(), a.toString(), `fiche ${k + 2} : mêmes réglages`);
    });
  }
});
test("splat.html : l'empreinte de la série neuve garde sa longueur (le moteur n'en garde que 400 caractères) — la reprise marche", () => {
  const sig = new Function("window", `
    ${html.split("\n").find((l) => l.startsWith("const sharedNames = "))}
    ${html.split("\n").find((l) => l.startsWith("const ELEVE_HORS_EMPREINTE = "))}
    ${source(html, "eleveSignatureSerie")}
    return eleveSignatureSerie();`);
  const de = (search) => sig({ location: { search } });
  for (const nom of ["M2A1", "M2E4A", "M2E5A"]) {
    const officielle = nom === "M2A1" ? ETAPE7 : "?" + PARTIES_M2[nom] + "&eleve=1&parcours=x&suite=" + encodeURIComponent(PARTIES_M2[nom.replace("A", "B").replace(/^M2B/, "M2A")] || "");
    for (let i = 0; i < 50; i++) {
      const neuve = de(adresseSplat.adresse(officielle, adresseSplat.graine));
      assert.equal(neuve.length, de(officielle).length, nom);
      assert.ok(neuve.length <= 400, `${nom} : ${neuve.length} caractères`);
      assert.equal(PARCOURS.normaliser({ etapes: { m1e1: { enCours: { sig: neuve, idx: 1 } } } }).etapes.m1e1.enCours.sig, neuve, "gardée entière");
    }
  }
});
test("splat.html : une fiche qui tirerait une carte « tache vide » reprend une autre graine ; après 40 refus, la dernière", () => {
  const vus = [];
  let n = 0;
  const s = adresseSplat.adresse("?seed=974&mode=U", () => 100 + (n++), (q) => { vus.push(q.get("seed")); return q.get("seed") === "103"; });
  assert.deepEqual(vus, ["100", "101", "102", "103"]);
  assert.equal(new URLSearchParams(s).get("seed"), "103");
  let m = 0;
  const t = adresseSplat.adresse("?seed=974", () => 500 + (m++), () => false);
  assert.equal(new URLSearchParams(t).get("seed"), "539");
  assert.match(source(html, "eleveRouvrirNouvellesCartes"), /eleveAdresseNouvellesCartes\(window\.location\.search, eleveGraineNeuve, eleveGraineSansTacheVide\)/);
  assert.match(source(html, "renderEleveEtapeReussieSplat"), /getElementById\("eleveNouvellesCartes"\)\.onclick = eleveRouvrirNouvellesCartes;/);
});

/* ---------- les nombres changent vraiment (Petit SPLAT!, les six étapes du monde 1) ---------- */
const mondeUn = new Function(`
  let currentRand = Math.random;
  ${source(petit, "hashSeed")}
  ${source(petit, "mulberry32")}
  ${source(petit, "rand")}
  ${source(petit, "makeAutoSeed")}
  const SPLAT_SHAPES = [0, 1, 2, 3, 4, 5, 6, 7];
  const generateDotPositions = (n) => ({ arr: Array.from({ length: n }, (_, i) => ({ x: i, y: rand() })), r: 8 });
  const generateHiddenDots = (splats, n) => splats.map(() => Array.from({ length: n }, () => ({ x: rand(), y: 0 })));
  ${source(petit, "createItem")}
  ${source(petit, "eleveAdresseNouvellesCartes")}
  return {
    serie(search){
      const q = new URLSearchParams(search);
      currentRand = mulberry32(hashSeed(q.get("seed")));
      return Array.from({ length: 12 }, () => createItem(q.get("exercise"), Number(q.get("target")), q.get("splats")))
        .map((c) => [c.total, c.visible, c.hiddenPerSplat, c.numSplats].join(","));
    },
    nouvelle: (search) => eleveAdresseNouvellesCartes(search, makeAutoSeed)
  };
`)();
test("Petit SPLAT! : les six étapes du monde 1 — une série « nouvelles cartes » a d'autres nombres", () => {
  const etapes = [...univers.matchAll(/j:PS\+"(\?support=eleve[^"]*parcours=m1e\d)"/g)].map((m) => m[1]);
  assert.equal(etapes.length, 6);
  for (const officielle of etapes) {
    const a = mondeUn.serie(officielle);
    for (let i = 0; i < 20; i++) {
      const b = mondeUn.serie(mondeUn.nouvelle(officielle));
      assert.notDeepEqual(b, a, officielle);
      assert.ok(b.filter((x, k) => x !== a[k]).length >= 6, `${officielle} : la plupart des cartes changent`);
    }
  }
});

/* ---------- mondes 5 et 6 : ÉquaSplat ---------- */
function demarrer(entree) {
  const appels = [];
  new Function("appels", "entree", "window", `
    let eleveMode, eleveEqs, eleveVues, eleveSerieNotee, eleveRes, eleveResolues, eleveIdx = 0, eleveCompteeCourante, elevePasserVisible;
    const document = { body: { classList: { add() {} } } };
    const eleveLireEntree = () => entree, eleveSignatureSerie = () => "SIG", eleveChargerEquation = () => true;
    const eleveVuesReprise = () => 0, eleveEcranEtroit = () => false, eleveMajBarre = () => {}, eleveSurveillerResolution = () => {};
    const eleveFinDeSerie = () => appels.push("fin"), eleveEtapeReussie = (e) => appels.push(["ecran", e]);
    ${source(equa, "eleveDemarrerSerie", "  ")}
    eleveDemarrerSerie({ serie: new Array(12).fill({}) });`)(appels, entree, { setInterval: () => 1 });
  return appels;
}
test("ÉquaSplat : étape faite, rien à reprendre → l'écran ; reprise ou étape pas faite → comme avant", () => {
  assert.deepEqual(demarrer({ ...FAITE }), [["ecran", { ...FAITE }]]);
  assert.deepEqual(demarrer({ ...FAITE, enCours: { sig: "SIG", idx: 4, resolues: 4, res: [true, true, true, true] } }), [], "reprise sur l'équation 5");
  assert.deepEqual(demarrer({ ...FAITE, enCours: { sig: "SIG", idx: 12, resolues: 10, res: [...new Array(10).fill(true), "ko", "ko"] } }), ["fin"], "« Encore N équations ! »");
  assert.deepEqual(demarrer({ ...FAITE, enCours: { sig: "AUTRE", idx: 4, resolues: 4, res: [true] } }), [["ecran", { ...FAITE, enCours: { sig: "AUTRE", idx: 4, resolues: 4, res: [true] } }]]);
  assert.deepEqual(demarrer({ fait: false, etoiles: 0, cartes: 12, vues: 0 }), []);
  assert.deepEqual(demarrer(null), [], "sans parcours (pas de case) : rien");
});
function carton(entree) {
  const ajoutes = [], ecrit = [];
  let voile;
  const bouton = { ecouteurs: {}, addEventListener(t, f) { this.ecouteurs[t] = f; }, focus() { this.focusee = true; } };
  const document = { createElement: () => (voile = { className: "", innerHTML: "", retire: false, querySelector: () => bouton, remove() { this.retire = true; } }) };
  new Function("document", "ajoutes", "ecrit", "entree", `
    const eleveParcours = "m3e1", ELEVE_URL_MONDES = "/outils/splat_univers.html";
    const eleveHote = () => ({ appendChild: (n) => ajoutes.push(n) }), eleveEcrireEntree = (e) => ecrit.push(e);
    ${source(equa, "eleveLienMondesHtml", "  ")}
    ${source(equa, "eleveMeilleureSerieTexte", "  ")}
    ${source(equa, "eleveEtapeReussie", "  ")}
    eleveEtapeReussie(entree);`)(document, ajoutes, ecrit, entree);
  return { voile, bouton, ajoutes, ecrit };
}
test("ÉquaSplat : le carton « Étape réussie ! » tel que sur la planche ; « Je rejoue la série » relance les MÊMES équations sans rien écrire", () => {
  const { voile, bouton, ajoutes, ecrit } = carton({ fait: true, etoiles: 12, cartes: 12, vues: 2 });
  assert.equal(voile.className, "eleveVoile");
  assert.equal(ajoutes[0], voile, "posé sur la scène (eleveHote : plein écran compris)");
  const t = voile.innerHTML;
  assert.ok(t.startsWith('<div class="eleveCarton"><div class="finEtoile on">⭐</div><h2>Étape réussie !</h2>'));
  assert.ok(t.includes('<p class="finSous">Ta meilleure série : 10 équations sur 12 du premier coup.<br>Rejoue quand tu veux : ton étoile reste allumée.</p>'));
  assert.ok(t.includes('<div class="finAction"><button type="button" id="eleveRejouerSerie">Je rejoue la série ▶</button></div>'));
  assert.match(t, /<div class="finSorties"><a class="finLien" href="\/outils\/splat_univers\.html"[^>]*>Retour à la carte des mondes<\/a><\/div><\/div>$/);
  assert.ok(bouton.focusee, "le bouton a le focus : Entrée suffit");
  bouton.ecouteurs.click();
  assert.ok(voile.retire, "le carton s'en va : l'équation 1 est déjà là, dessous");
  assert.deepEqual(ecrit, [], "rien n'est écrit");
  assert.doesNotMatch(carton({ fait: true, etoiles: 12, cartes: 0 }).voile.innerHTML, /meilleure/, "sans cartes : ligne omise");
});
