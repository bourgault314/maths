import assert from "node:assert/strict";
import { it } from "node:test";

import { COULEURS_RANGS_NUMERATION_DECIMALE } from "../packages/charte/src/charte.js";

function installerFauxNavigateur(recherche) {
  const gestionnaires = new Map();
  const focusRecus = [];
  const optionsFocus = [];
  const corpsPanneau = { scrollTop: 0, dataset: {} };
  const zoneQuestion = { scrollTop: 0, dataset: { questionIndex: "" } };
  const panneau = {
    id: "",
    querySelector(selecteur) {
      return selecteur === ".corps-panneau" ? corpsPanneau : null;
    },
  };
  let html = "";
  const application = {
    get innerHTML() { return html; },
    set innerHTML(valeur) {
      html = valeur;
      corpsPanneau.scrollTop = 0;
      corpsPanneau.dataset = {};
      zoneQuestion.scrollTop = 0;
    },
    addEventListener(type, gestionnaire) {
      if (!gestionnaires.has(type)) gestionnaires.set(type, []);
      gestionnaires.get(type).push(gestionnaire);
    },
    querySelector(selecteur) {
      if (selecteur === '.menu-session, .panneau[role="dialog"], .panneau[aria-labelledby]') {
        return null;
      }
      if (selecteur === ".panneau") {
        const id = this.innerHTML.match(/<aside class="panneau[^"]*" id="([^"]+)"/)?.[1];
        if (!id) return null;
        panneau.id = id;
        return panneau;
      }
      if (selecteur === ".zone-question-scroll") {
        const index = this.innerHTML.match(/class="zone-question-scroll" data-question-index="([^"]+)"/)?.[1];
        if (index === undefined) return null;
        zoneQuestion.dataset.questionIndex = index;
        return zoneQuestion;
      }
      return { focus(options) { focusRecus.push(selecteur); optionsFocus.push(options); } };
    },
  };
  globalThis.window = {
    location: { search: recherche },
    addEventListener(type, gestionnaire) {
      if (!gestionnaires.has(type)) gestionnaires.set(type, []);
      gestionnaires.get(type).push(gestionnaire);
    },
  };
  globalThis.document = {
    title: "",
    activeElement: null,
    documentElement: { style: { setProperty() {} } },
    querySelector() { return application; },
  };
  globalThis.requestAnimationFrame = (rappel) => rappel();
  return { application, gestionnaires, focusRecus, optionsFocus, panneau, corpsPanneau, zoneQuestion };
}

function cliquer(gestionnaires, action, id, value, index, notion, niveau, rang, maximum, pas) {
  const cible = {
    dataset: { action, id, value, index, notion, niveau, rang, maximum, pas },
    closest(selecteur) { return selecteur === "[data-action]" ? this : null; },
  };
  gestionnaires.get("click")[0]({ target: cible });
}

function appuyer(gestionnaires, key, { shiftKey = false } = {}) {
  let preventions = 0;
  for (const gestionnaire of gestionnaires.get("keydown") ?? []) {
    gestionnaire({
      key,
      shiftKey,
      preventDefault() { preventions += 1; },
    });
  }
  return preventions;
}

function extrairePanneauAide(html) {
  return html.match(/<aside class="panneau panneau-aide[\s\S]*?<\/aside>/)?.[0] ?? "";
}

function extraireTableauNumeration(html) {
  const figures = [...html.matchAll(
    /<figure class="figure-fraction figure-tableau-numeration[^\"]*"[^>]*>[\s\S]*?<\/figure>/g,
  )];
  return figures.at(-1)?.[0] ?? "";
}

function verifierFigureDecimaleResponsive(html) {
  assert.match(html, /figure-decimale-responsive"\s+role="img" aria-label="[^"]+"/);
  assert.match(
    html,
    /class="figure-deux-sources-variante figure-deux-sources-variante-large"[\s\S]*?--mg-largeur-figure-source:560px[\s\S]*?aria-hidden="true"/,
  );
  assert.match(
    html,
    /class="figure-deux-sources-variante figure-deux-sources-variante-mobile"[\s\S]*?--mg-largeur-figure-source:(?:240|280)px[\s\S]*?aria-hidden="true"/,
  );
}

function verifierRailAideResponsive(html) {
  assert.match(html, /figure-bandes-rail-aide-responsive"\s+role="img" aria-label="[^"]+"/);
  assert.match(html, /--mg-largeur-figure-source:720px/);
  assert.match(html, /--mg-largeur-figure-source:340px/);
  assert.equal(
    (html.match(/class="figure-deux-sources-variante figure-deux-sources-variante-(?:large|mobile)"/g) ?? []).length >= 2,
    true,
  );
}

function avancerAuTableau(gestionnaires, nombreQuestions) {
  for (let index = 0; index < nombreQuestions; index += 1) {
    cliquer(gestionnaires, "reponse");
    cliquer(gestionnaires, "suivant");
  }
}

function avancerJusquaQuestion(application, gestionnaires, predicat, maximum = 20) {
  for (let index = 0; index < maximum; index += 1) {
    if (predicat(application.innerHTML)) return index;
    cliquer(
      gestionnaires,
      /mode-entrainement/.test(application.innerHTML) ? "valider" : "reponse",
    );
    cliquer(gestionnaires, "suivant");
  }
  assert.fail(`question attendue introuvable dans les ${maximum} questions`);
}

function verifierPaletteTableauNumeration(html) {
  for (const [rang, palette] of Object.entries(COULEURS_RANGS_NUMERATION_DECIMALE)) {
    assert.match(
      html,
      new RegExp(
        `data-rang="${rang}"[\\s\\S]*?class="nd-entete"[^>]*fill="${palette.principale}"`
        + `[\\s\\S]*?class="nd-cellule"[^>]*fill="${palette.fond}"`
        + `[\\s\\S]*?class="nd-nom-rang"[^>]*fill="${palette.encreEntete}"`
        + `[\\s\\S]*?class="nd-chiffre"[^>]*fill="${palette.textePedagogique}"`,
      ),
      `palette canonique absente pour ${rang}`,
    );
  }
}

function verifierOrdre(html, ...fragments) {
  let positionPrecedente = -1;
  for (const fragment of fragments) {
    const position = html.indexOf(fragment, positionPrecedente + 1);
    assert.ok(position > positionPrecedente, `ordre introuvable pour « ${fragment} »`);
    positionPrecedente = position;
  }
}

it("réaffiche le repère d'un panneau débordant lorsqu'il revient en haut", async () => {
  installerFauxNavigateur(
    "?notion=carres-entiers-0-a-12&questions=1&graine=repere-defilement",
  );
  const { doitAfficherIndicateurDefilementPanneau } = await import(
    `./app.js?fumee=repere-defilement-${Date.now()}`
  );
  const panneau = { scrollHeight: 620, clientHeight: 400, scrollTop: 0 };
  assert.equal(doitAfficherIndicateurDefilementPanneau(panneau), true);
  panneau.scrollTop = 8;
  assert.equal(doitAfficherIndicateurDefilementPanneau(panneau), true);
  panneau.scrollTop = 48;
  assert.equal(doitAfficherIndicateurDefilementPanneau(panneau), false);
  panneau.scrollTop = 0;
  assert.equal(doitAfficherIndicateurDefilementPanneau(panneau), true);
  panneau.scrollHeight = 402;
  assert.equal(doitAfficherIndicateurDefilementPanneau(panneau), false);
});

it("rend NC-01 depuis le registre et conserve son aide et sa correction", async () => {
  const { application, gestionnaires, focusRecus, optionsFocus, corpsPanneau, zoneQuestion } = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=1&graine=fumee-registre",
  );
  await import(`./app.js?fumee=divisibilite-${Date.now()}`);
  assert.match(application.innerHTML, /Critères de divisibilité/);
  cliquer(gestionnaires, "demarrer");
  assert.match(application.innerHTML, /Critères de divisibilité/);

  cliquer(gestionnaires, "aide");
  assert.match(application.innerHTML, /Me guider/);
  assert.match(application.innerHTML, /Question en cours/);
  assert.match(application.innerHTML, /Ouvrir le cours/);
  cliquer(gestionnaires, "cours");
  assert.match(application.innerHTML, /Comprendre « divisible »/);
  assert.match(application.innerHTML, /1 \/ 3/);
  assert.match(application.innerHTML, /class="corps-panneau"/);
  assert.match(application.innerHTML, /class="pied-panneau"/);
  assert.match(application.innerHTML, /reste de la division est nul/);
  assert.match(application.innerHTML, /12 = 3 × 4 \+ 0/);
  assert.match(application.innerHTML, /cas-divisible-cours[\s\S]*Cas divisible par 3[\s\S]*12 = 3 × 4 \+ 0/);
  assert.match(application.innerHTML, /cas-non-divisible-cours[\s\S]*Cas non divisible par 3[\s\S]*13 = 3 × 4 \+ 1/);
  assert.match(application.innerHTML, /3 divise 12/);
  assert.match(application.innerHTML, /12 est divisible par 3/);
  assert.match(application.innerHTML, /12 est un multiple de 3/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /2 \/ 3/);
  assert.match(application.innerHTML, /Critères pour 2, 5 et 10/);
  assert.match(application.innerHTML, /chiffre des unités/);
  assert.match(application.innerHTML, /aria-label="230, chiffre des unités 0"/);
  assert.match(application.innerHTML, /<span>2<\/span><span>3<\/span><b class="chiffre-unite-encadre">0<\/b>/);
  assert.match(application.innerHTML, /aria-label="235, chiffre des unités 5"/);
  assert.match(application.innerHTML, /aria-label="236, chiffre des unités 6"/);
  assert.match(application.innerHTML, /divisible par 10 exactement quand il est divisible à la fois par 2 et par 5/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /3 \/ 3/);
  assert.match(application.innerHTML, /Critères pour 3 et 9/);
  assert.match(application.innerHTML, /372/);
  assert.match(application.innerHTML, /729/);
  assert.doesNotMatch(application.innerHTML, /au plus quatre chiffres|ne dépasse pas 36/);
  assert.match(application.innerHTML, /3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, …/);
  assert.match(application.innerHTML, /9, 18, 27, 36, 45, 54, 63, 72, 81, 90, …/);
  assert.match(application.innerHTML, /43[\s\S]*4 \+ 3 = 7[\s\S]*pas divisible par 3/);
  assert.match(application.innerHTML, /49[\s\S]*4 \+ 9 = 13[\s\S]*pas divisible par 9/);
  assert.match(application.innerHTML, /tout nombre divisible par 9 est aussi divisible par 3/);
  assert.doesNotMatch(application.innerHTML, /Une idée à la fois/);
  assert.doesNotMatch(application.innerHTML, /Série en cours/);
  cliquer(gestionnaires, "fermer-cours");
  const premierChoix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
  assert.ok(premierChoix);
  zoneQuestion.scrollTop = 120;
  cliquer(gestionnaires, "choix", premierChoix);
  assert.equal(zoneQuestion.scrollTop, 120);
  assert.match(
    application.innerHTML,
    new RegExp(`class="choix selectionne" data-action="choix" data-id="${premierChoix}"[\\s\\S]*?aria-checked="true"[\\s\\S]*?aria-pressed="true"`),
  );
  assert.equal(focusRecus.at(-1), `[data-action="choix"][data-id="${premierChoix}"]`);
  assert.deepEqual(optionsFocus.at(-1), { preventScroll: true });
  cliquer(gestionnaires, "valider");
  cliquer(gestionnaires, "correction");
  assert.match(application.innerHTML, /Correction expliquée/);
  appuyer(gestionnaires, "Escape");
  assert.doesNotMatch(application.innerHTML, /Correction expliquée/);
  assert.equal(focusRecus.at(-1), '[data-action="correction"]');
  assert.deepEqual(optionsFocus.at(-1), { preventScroll: true });

  cliquer(gestionnaires, "aide");
  corpsPanneau.scrollTop = 180;
  const chiffresAide = [...application.innerHTML.matchAll(
    /data-action="chiffre-aide" data-index="(\d+)"[^>]*>(\d)<\/button>/g,
  )].map((correspondance) => ({ index: correspondance[1], chiffre: Number(correspondance[2]) }));
  assert.ok(chiffresAide.length > 0);
  corpsPanneau.scrollTop = 0;
  cliquer(gestionnaires, "chiffre-aide", undefined, undefined, chiffresAide[0].index);
  cliquer(gestionnaires, "chiffre-aide", undefined, undefined, chiffresAide[0].index);
  assert.equal(corpsPanneau.dataset.defilementCommence, undefined);
  corpsPanneau.scrollTop = 180;
  for (const { index } of chiffresAide) {
    cliquer(gestionnaires, "chiffre-aide", undefined, undefined, index);
  }
  assert.equal(corpsPanneau.scrollTop, 180);
  assert.deepEqual(optionsFocus.at(-1), { preventScroll: true });
  const somme = chiffresAide.reduce((total, { chiffre }) => total + chiffre, 0);
  assert.match(application.innerHTML, new RegExp(`= ${somme}<\\/output>`));
  cliquer(gestionnaires, "chiffre-aide", undefined, undefined, chiffresAide[0].index);
  assert.match(application.innerHTML, /= □<\/output>/);
  assert.match(application.innerHTML, /Critère par 3/);
  assert.match(application.innerHTML, /La somme de tous les chiffres doit être un multiple de 3/);
  assert.doesNotMatch(application.innerHTML, /Applique ensuite le critère/);
});

it("rend le cours en cinq pages et les six familles de NC-02", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=carres-entiers-1-a-12&questions=20&graine=fumee-nc02-six-familles",
  );
  await import(`./app.js?fumee=nc02-${Date.now()}`);
  assert.match(application.innerHTML, /Carrés des entiers de 0 à 12/);

  cliquer(gestionnaires, "cours");
  assert.match(application.innerHTML, /Comprendre « au carré »/);
  assert.match(application.innerHTML, /1 \/ 5/);
  assert.match(application.innerHTML, /Carré de quatre rangées et quatre colonnes/);
  assert.match(application.innerHTML, /<sup>2<\/sup>/);
  assert.match(application.innerHTML, /aria-label="a au carré égale a fois a"/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /Les carrés de 0 à 12/);
  assert.match(application.innerHTML, /2 \/ 5/);
  assert.match(application.innerHTML, /carrés parfaits/);
  assert.match(application.innerHTML, /aria-label="0 au carré égale 0 fois 0 égale 0"/);
  assert.match(application.innerHTML, /aria-label="12 au carré égale 12 fois 12 égale 144"/);
  assert.equal(
    (application.innerHTML.match(/class="mathsgo-expression" role="math" aria-label="\d+ au carré égale/g) ?? []).length,
    13,
  );
  assert.match(application.innerHTML, /144/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /Retrouver les carrés de 11 et de 12/);
  assert.doesNotMatch(application.innerHTML, /Retrouver 11² et 12²/);
  assert.match(application.innerHTML, /3 \/ 5/);
  assert.match(application.innerHTML, /11 × 10 \+ 11 × 1 = 121 carreaux/);
  assert.match(application.innerHTML, /11 × 10 \+ 11 × 1/);
  assert.match(application.innerHTML, /12 × 10 \+ 12 × 2/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /Direct et inverse/);
  assert.match(application.innerHTML, /4 \/ 5/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /Calculer dans le bon ordre/);
  assert.match(application.innerHTML, /5 \/ 5/);
  assert.match(application.innerHTML, /49 \+ 1/);
  assert.match(application.innerHTML, /<strong>50<\/strong>/);
  assert.doesNotMatch(application.innerHTML, /<ol>/);
  cliquer(gestionnaires, "fermer-cours");
  cliquer(gestionnaires, "demarrer");

  const familles = new Set();
  let deuxChampsVus = false;
  let questionCoteF5Vue = false;
  let qcmDirectVu = false;
  let encadrementVu = false;
  let selectionCarresParfaitsVue = false;
  let carresParfaitsVus = false;
  let puissanceSaisieVue = false;
  let nombreDansTitreDirectVu = false;
  let nombreDansTitreInverseVu = false;
  let nombreDansTitreQuadrilleVu = false;
  let termeCalculCourtVu = false;
  let aideF5AireNeutreVue = false;
  const famillesAvecCarreEnCorrection = new Set();
  for (let index = 0; index < 20; index += 1) {
    const famille = application.innerHTML.match(/famille-([a-z-]+)"/)?.[1];
    const f5TrouverAire = famille === "carre-quadrille"
      && application.innerHTML.includes("sur chaque côté. Combien en contient-il en tout ?");
    assert.ok(famille, `famille NC-02 absente à la question ${index + 1}`);
    familles.add(famille);
    assert.match(application.innerHTML, /Carrés des entiers de 0 à 12/);
    assert.doesNotMatch(application.innerHTML, /\^2|²/);
    if (
      famille === "carre-quadrille" &&
      application.innerHTML.includes("Combien y en a-t-il sur chaque côté ?")
    ) {
      questionCoteF5Vue = true;
    }
    if (
      famille === "calcul-direct" &&
      application.innerHTML.includes("Quel est le carré de") &&
      application.innerHTML.includes("grille-carres-qcm")
    ) {
      qcmDirectVu = true;
    }
    if (application.innerHTML.includes("Quel encadrement est correct ?")) {
      encadrementVu = true;
    }
    if (application.innerHTML.includes("Sélectionne tous les carrés parfaits.")) {
      selectionCarresParfaitsVue = true;
    }
    if (application.innerHTML.includes("Parmi ces nombres, lesquels sont des carrés parfaits ?")) {
      carresParfaitsVus = true;
    }
    if (application.innerHTML.includes("case-puissance")) {
      puissanceSaisieVue = true;
      assert.match(
        application.innerHTML,
        /<span class="mathsgo-puissance-base">□<\/span><sup>2<\/sup>/,
      );
    }
    if (application.innerHTML.includes("Quel est le carré de")) {
      nombreDansTitreDirectVu = true;
      assert.match(
        application.innerHTML,
        /Quel est le carré de <span class="mathsgo-expression" role="math" aria-label="(\d+)">\1<\/span> \?/,
      );
      assert.doesNotMatch(application.innerHTML, /Quel est le carré de \d+ \?/);
    }
    if (application.innerHTML.includes("Quel entier naturel a pour carré")) {
      nombreDansTitreInverseVu = true;
      assert.match(
        application.innerHTML,
        /Quel entier naturel a pour carré <span class="mathsgo-expression" role="math" aria-label="(\d+)">\1<\/span> \?/,
      );
      assert.doesNotMatch(application.innerHTML, /Quel entier naturel a pour carré \d+ \?/);
    }
    if (famille === "carre-quadrille") {
      nombreDansTitreQuadrilleVu = true;
      assert.doesNotMatch(
        application.innerHTML,
        /cq-rangees|cq-ligne-active|cq-colonne-active/,
      );
      assert.match(
        application.innerHTML,
        /<h1>Ce carré (?:a|contient) <span class="mathsgo-expression" role="math" aria-label="(\d+)">\1<\/span>/,
      );
    }
    if (famille === "calcul-court") {
      termeCalculCourtVu = true;
      assert.match(
        application.innerHTML,
        /calcul-court-question[\s\S]*?<span>[+−]<\/span><span class="mathsgo-expression" role="math" aria-label="(\d+)">\1<\/span><span>=<\/span>/,
      );
    }
    if (famille === "sens-notation") {
      assert.match(application.innerHTML, /Quelle écriture correspond/);
      assert.match(
        application.innerHTML,
        /data-id="produit-facteurs-egaux"[\s\S]*?class="mathsgo-expression" role="math"/,
      );
      assert.match(application.innerHTML, /aria-label="\d+ fois \d+"/);
      assert.match(application.innerHTML, /aria-label="\d+ plus 2"/);
    }

    cliquer(gestionnaires, "aide");
    assert.match(application.innerHTML, /Me guider/);
    assert.match(application.innerHTML, /Question en cours/);
    if (famille === "sens-notation") {
      const aide = application.innerHTML.match(
        /<aside class="panneau panneau-aide[\s\S]*?<\/aside>/,
      )?.[0] ?? "";
      assert.equal([...aide.matchAll(/<section class="outil-aide/g)].length, 3);
      assert.match(
        aide,
        /outil-aide outil-aide-carre-operation[\s\S]*?repere-etape[\s\S]*?visuel-carre-quadrille/,
      );
      assert.match(aide, /Quelle opération permet de trouver le nombre total de carreaux/);
      assert.match(aide, /aria-label="a au carré égale a fois a"/);
      assert.match(aide, /Repère le seul produit qui répète exactement le même facteur/);
      assert.match(aide, /class="cq-aire"[\s\S]*?>\?<\/text>/);
      assert.doesNotMatch(aide, /cq-ligne-active|cq-colonne-active/);
    }
    if (famille === "carre-quadrille") {
      const aide = application.innerHTML.match(
        /<aside class="panneau panneau-aide[\s\S]*?<\/aside>/,
      )?.[0] ?? "";
      assert.doesNotMatch(
        aide,
        /cq-rangees|cq-ligne-active|cq-colonne-active/,
      );
      if (f5TrouverAire) {
        aideF5AireNeutreVue = true;
        assert.match(
          aide,
          /Repère les (\d+) rangées du carré : chacune contient \1 carreaux\./,
        );
        assert.match(
          aide,
          /aria-label="Carré quadrillé de (\d+) rangées et \1 colonnes\. L&apos;aire est à trouver\."/,
        );
        assert.match(aide, /class="cq-aire"[^>]*>\?<\/text>/);
      }
    }
    if (application.innerHTML.includes("egalite-deux-champs")) {
      assert.equal(
        [...application.innerHTML.matchAll(/class="case-vide-aide"/g)].length,
        2,
      );
    }
    if (["calcul-direct", "carre-quadrille"].includes(famille)) {
      assert.ok(
        [...application.innerHTML.matchAll(/class="repere-etape/g)].length >= 2,
      );
    }
    cliquer(gestionnaires, "fermer-aide");

    const champs = [...application.innerHTML.matchAll(
      /data-action="champ-reponse" data-index="(\d+)"/g,
    )].map((correspondance) => correspondance[1]);
    const questionNumerique = champs.length > 0;
    if (champs.length === 2) {
      deuxChampsVus = true;
      assert.match(application.innerHTML, /question-numerique[^"]*avec-pave/);
      cliquer(gestionnaires, "champ-reponse", undefined, undefined, "0");
      cliquer(gestionnaires, "chiffre", undefined, "1");
      cliquer(gestionnaires, "champ-reponse", undefined, undefined, "1");
      cliquer(gestionnaires, "chiffre", undefined, "1");
      assert.match(application.innerHTML, /Champ 1, valeur 1/);
      assert.match(application.innerHTML, /Champ 2, valeur 1/);
    } else if (champs.length === 1) {
      assert.match(application.innerHTML, /question-numerique[^"]*avec-pave/);
      cliquer(gestionnaires, "chiffre", undefined, "1");
    } else {
      const choix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
      assert.ok(choix, `réponse NC-02 absente pour ${famille}`);
      cliquer(gestionnaires, "choix", choix);
    }
    cliquer(gestionnaires, "valider");
    assert.doesNotMatch(application.innerHTML, /avec-pave/);
    assert.doesNotMatch(
      application.innerHTML,
      /<p class="message [^"]+" role="(?:status|alert)">(?!<span class="contenu-message">)/,
    );
    if (questionNumerique) assert.match(application.innerHTML, /question-numerique/);
    else assert.doesNotMatch(application.innerHTML, /question-numerique/);
    cliquer(gestionnaires, "correction");
    assert.match(application.innerHTML, /Correction expliquée/);
    assert.match(application.innerHTML, /Réponse correcte/);
    if (questionNumerique) {
      assert.match(
        application.innerHTML,
        /reponses-correction reponses-correction-numerique" aria-label="Réponse correcte"/,
      );
    }
    if (["calcul-direct", "retrouver-entier", "sens-notation", "carre-quadrille"].includes(famille)) {
      if (application.innerHTML.includes("visuel-correction-carres")) {
        famillesAvecCarreEnCorrection.add(famille);
        assert.match(application.innerHTML, /visuel-correction-carres[\s\S]*visuel-carre-quadrille/);
      }
    } else {
      assert.doesNotMatch(application.innerHTML, /visuel-correction-carres/);
    }
    if (famille === "carre-quadrille") {
      assert.doesNotMatch(
        application.innerHTML,
        /cq-rangees|cq-ligne-active|cq-colonne-active/,
      );
    }
    if (famille === "sens-notation") {
      assert.match(application.innerHTML, /Écarter l&#039;ajout de 2/);
      assert.doesNotMatch(application.innerHTML, /correction-conclusion/);
      assert.match(
        application.innerHTML,
        /rappel-reponse-eleve [^" ]+"[\s\S]*?reponse-mathematique[\s\S]*?mathsgo-expression/,
      );
      assert.match(
        application.innerHTML,
        /reponses-correction" aria-label="Réponse correcte">[\s\S]*?reponse-mathematique[\s\S]*?mathsgo-expression/,
      );
    }
    if (["calcul-direct", "carre-quadrille"].includes(famille)) {
      assert.match(application.innerHTML, /aria-label="\d+ fois \d+ égale \d+"/);
    }
    if (famille === "calcul-court") {
      assert.match(application.innerHTML, /correction-calcul-aligne/);
      assert.match(application.innerHTML, /On calcule d'abord le carré/);
    }
    cliquer(gestionnaires, "fermer-correction");
    cliquer(gestionnaires, "suivant");
  }

  assert.equal(deuxChampsVus, true);
  assert.equal(questionCoteF5Vue, true);
  assert.equal(qcmDirectVu, true);
  assert.equal(encadrementVu, true);
  assert.equal(selectionCarresParfaitsVue, true);
  assert.equal(carresParfaitsVus, true);
  assert.equal(puissanceSaisieVue, true);
  assert.equal(nombreDansTitreDirectVu, true);
  assert.equal(nombreDansTitreInverseVu, true);
  assert.equal(nombreDansTitreQuadrilleVu, true);
  assert.equal(termeCalculCourtVu, true);
  assert.equal(aideF5AireNeutreVue, true);
  assert.deepEqual([...famillesAvecCarreEnCorrection].sort(), [
    "calcul-direct",
    "carre-quadrille",
    "retrouver-entier",
    "sens-notation",
  ]);
  assert.deepEqual([...familles].sort(), [
    "calcul-court",
    "calcul-direct",
    "carre-quadrille",
    "reconnaitre-carres",
    "retrouver-entier",
    "sens-notation",
  ]);
  assert.match(application.innerHTML, /Ton bilan/);
});

it("fige les deux QCM qui ont révélé les chiffres anciens sur iPhone", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=carres-entiers-0-a-12&questions=20&graine=repro-police-132",
  );
  await import(`./app.js?fumee=police-iphone-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  for (let numero = 1; numero <= 12; numero += 1) {
    const grille = application.innerHTML.match(
      /<div class="grille-choix grille-carres-qcm[\s\S]*?<\/div>/,
    )?.[0] ?? "";

    if (numero === 9) {
      assert.match(application.innerHTML, /famille-sens-notation/);
      const operations = [...grille.matchAll(
        /<span class="mathsgo-expression" role="math" aria-label="[^"]+">([^<]+)<\/span>/g,
      )].map((correspondance) => correspondance[1]).sort();
      assert.deepEqual(operations, ["4 + 2", "4 + 4", "4 × 2", "4 × 4"]);
      cliquer(gestionnaires, "aide");
      const aide = application.innerHTML.match(
        /<aside class="panneau panneau-aide[\s\S]*?<\/aside>/,
      )?.[0] ?? "";
      assert.match(
        aide,
        /aria-label="Carré quadrillé de 4 rangées et 4 colonnes\. L&apos;aire est à trouver\."/,
      );
      assert.match(aide, /class="cq-aire"[\s\S]*?>\?<\/text>/);
      assert.doesNotMatch(aide, /16 carreaux|cq-ligne-active|cq-colonne-active/);
      cliquer(gestionnaires, "fermer-aide");
    }

    if (numero === 12) {
      assert.match(application.innerHTML, /Quel encadrement est correct \?/);
      assert.match(application.innerHTML, /aria-label="6 au carré"/);
      const encadrements = [...grille.matchAll(
        /<span>(Entre \d+ et \d+)<\/span>/g,
      )].map((correspondance) => correspondance[1]);
      assert.equal(encadrements.length, 4);
      assert.doesNotMatch(grille, /mathsgo-expression/);
    }

    const champs = [...application.innerHTML.matchAll(
      /data-action="champ-reponse" data-index="(\d+)"/g,
    )].map((correspondance) => correspondance[1]);
    if (champs.length > 0) {
      for (const index of champs) {
        cliquer(gestionnaires, "champ-reponse", undefined, undefined, index);
        cliquer(gestionnaires, "chiffre", undefined, "1");
      }
    } else {
      const choix = application.innerHTML.match(
        /data-action="choix" data-id="([^"]+)"/,
      )?.[1];
      assert.ok(choix, `réponse absente à la question ${numero}`);
      cliquer(gestionnaires, "choix", choix);
    }
    cliquer(gestionnaires, "valider");

    if (numero === 9 || numero === 12) {
      cliquer(gestionnaires, "correction");
      if (numero === 9) {
        const rappel = application.innerHTML.match(
          /<p class="rappel-reponse-eleve[\s\S]*?<\/p>/,
        )?.[0] ?? "";
        assert.equal((rappel.match(/mathsgo-expression/g) ?? []).length, 1);
        assert.match(rappel, /<strong class="reponse-mathematique">/);
        assert.match(
          application.innerHTML,
          /reponses-correction" aria-label="Réponse correcte">[\s\S]*?<strong class="reponse-mathematique">[\s\S]*?mathsgo-expression/,
        );
      } else {
        assert.match(
          application.innerHTML,
          /rappel-reponse-eleve[\s\S]*?<strong>Entre \d+ et \d+<\/strong>/,
        );
        assert.match(
          application.innerHTML,
          /reponses-correction\s*" aria-label="Réponse correcte">[\s\S]*?<strong>Entre \d+ et \d+<\/strong>/,
        );
      }
      cliquer(gestionnaires, "fermer-correction");
    }

    if (numero < 12) cliquer(gestionnaires, "suivant");
  }
});

it("accepte 80 comme réponse fournie puis fausse dans les deux formes inverses de NC-02", async () => {
  const verbal = installerFauxNavigateur(
    "?notion=carres-entiers-0-a-12&questions=20&graine=saisie-72",
  );
  await import(`./app.js?fumee=saisie-inverse-tactile-${Date.now()}`);
  cliquer(verbal.gestionnaires, "demarrer");
  assert.match(verbal.application.innerHTML, /famille-retrouver-entier/);
  assert.match(verbal.application.innerHTML, /Quel entier naturel a pour carré/);
  cliquer(verbal.gestionnaires, "chiffre", undefined, "8");
  cliquer(verbal.gestionnaires, "chiffre", undefined, "0");
  assert.match(verbal.application.innerHTML, /Champ 1, valeur 80/);
  cliquer(verbal.gestionnaires, "valider");
  assert.match(verbal.application.innerHTML, /<strong>À revoir\.<\/strong>/);
  assert.match(
    verbal.application.innerHTML,
    /class="case-reponse-carres remplie fausse" aria-label="Champ 1, valeur 80">80<\/output>/,
  );
  assert.doesNotMatch(verbal.application.innerHTML, /Entre une|invalide/);

  const produit = installerFauxNavigateur(
    "?notion=carres-entiers-0-a-12&questions=20&graine=saisie-prod-125",
  );
  await import(`./app.js?fumee=saisie-inverse-clavier-${Date.now()}`);
  cliquer(produit.gestionnaires, "demarrer");
  assert.match(produit.application.innerHTML, /famille-retrouver-entier/);
  assert.match(produit.application.innerHTML, /egalite-deux-champs/);
  assert.equal(appuyer(produit.gestionnaires, "8"), 1);
  assert.equal(appuyer(produit.gestionnaires, "0"), 1);
  cliquer(produit.gestionnaires, "champ-reponse", undefined, undefined, "1");
  assert.equal(appuyer(produit.gestionnaires, "3"), 1);
  assert.match(produit.application.innerHTML, /Champ 1, valeur 80/);
  assert.match(produit.application.innerHTML, /Champ 2, valeur 3/);
  cliquer(produit.gestionnaires, "valider");
  assert.match(produit.application.innerHTML, /<strong>À revoir\.<\/strong>/);
  assert.doesNotMatch(produit.application.innerHTML, /Complète les deux cases|invalide/);
});

it("traite pareil une omission validée au clic ou avec Entrée", async () => {
  async function rendreOmission(methode, suffixe) {
    const { application, gestionnaires } = installerFauxNavigateur(
      "?notion=carres-entiers-1-a-12&questions=20&graine=fumee-nc02-six-familles",
    );
    await import(`./app.js?fumee=omission-${suffixe}-${Date.now()}`);
    cliquer(gestionnaires, "demarrer");
    if (methode === "clic") cliquer(gestionnaires, "valider");
    else assert.equal(appuyer(gestionnaires, "Enter"), 1);
    assert.doesNotMatch(application.innerHTML, /Correction expliquée/);
    assert.match(application.innerHTML, /Pas de réponse/);
    assert.match(
      application.innerHTML,
      /<p class="message message-erreur" role="status"><span class="contenu-message"><strong>Pas de réponse\.<\/strong><\/span><\/p>/,
    );
    assert.match(application.innerHTML, /Voir l'explication/);
    assert.match(application.innerHTML, /Réponse correcte/);
    assert.match(
      application.innerHTML,
      /reponses-correction reponses-correction-numerique" aria-label="Réponse correcte"/,
    );
    assert.doesNotMatch(application.innerHTML, /Ta réponse reste affichée/);
    return application.innerHTML;
  }

  assert.equal(
    await rendreOmission("clic", "clic"),
    await rendreOmission("entree", "entree"),
  );
});

it("distingue omission, mauvaise saisie et correction pour une fraction libre", async () => {
  const omission = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&questions=20&graine=first-2",
  );
  await import(`./app.js?fumee=omission-fraction-${Date.now()}`);
  cliquer(omission.gestionnaires, "demarrer");
  avancerJusquaQuestion(
    omission.application,
    omission.gestionnaires,
    (html) => /3,5/.test(html) && /Toutes les fractions égales sont acceptées/.test(html),
  );
  assert.match(omission.application.innerHTML, /3,5/);
  cliquer(omission.gestionnaires, "valider");
  assert.match(omission.application.innerHTML, /Pas de réponse/);
  assert.match(omission.application.innerHTML, /reponse-attendue-omission/);
  assert.match(omission.application.innerHTML, /reponses-correction-fractions/);
  assert.match(omission.application.innerHTML, /aria-label="35 sur 10"/);
  assert.doesNotMatch(omission.application.innerHTML, /Correction expliquée/);

  const erreur = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&questions=20&graine=first-2",
  );
  await import(`./app.js?fumee=erreur-fraction-${Date.now()}`);
  cliquer(erreur.gestionnaires, "demarrer");
  avancerJusquaQuestion(
    erreur.application,
    erreur.gestionnaires,
    (html) => /3,5/.test(html) && /Toutes les fractions égales sont acceptées/.test(html),
  );
  cliquer(erreur.gestionnaires, "champ-reponse", undefined, undefined, "0");
  cliquer(erreur.gestionnaires, "chiffre", undefined, "1");
  cliquer(erreur.gestionnaires, "valider");
  assert.match(
    erreur.application.innerHTML,
    /<p class="message message-erreur" role="alert"><span class="contenu-message">Complète les deux cases\.<\/span><\/p>/,
  );
  cliquer(erreur.gestionnaires, "champ-reponse", undefined, undefined, "1");
  cliquer(erreur.gestionnaires, "chiffre", undefined, "1");
  cliquer(erreur.gestionnaires, "valider");
  assert.match(erreur.application.innerHTML, /À revoir/);
  assert.match(
    erreur.application.innerHTML,
    /<p class="message message-erreur" role="status"><span class="contenu-message"><strong>À revoir\.<\/strong>[^<]*<\/span><\/p>/,
  );
  assert.match(erreur.application.innerHTML, /case-reponse-rationnelle fausse/);
  assert.doesNotMatch(erreur.application.innerHTML, /reponse-attendue-omission/);
  assert.doesNotMatch(erreur.application.innerHTML, /reponses-correction-fractions/);
  cliquer(erreur.gestionnaires, "correction");
  assert.match(erreur.application.innerHTML, /rappel-fraction-eleve reponse-fausse/);
  assert.match(erreur.application.innerHTML, /reponses-correction-fractions/);
  assert.match(erreur.application.innerHTML, /aria-label="35 sur 10"/);
});

it("distingue omission et mauvaise saisie dans le champ décimal de NC-03", async () => {
  const omission = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&questions=20&graine=qa-app-scenario-1",
  );
  await import(`./app.js?fumee=omission-decimale-${Date.now()}`);
  cliquer(omission.gestionnaires, "demarrer");
  avancerJusquaQuestion(
    omission.application,
    omission.gestionnaires,
    (html) => /aria-label="7 sur 2"/.test(html),
  );
  assert.match(omission.application.innerHTML, /aria-label="7 sur 2"/);
  cliquer(omission.gestionnaires, "valider");
  assert.match(omission.application.innerHTML, /Pas de réponse/);
  assert.match(omission.application.innerHTML, /reponse-attendue-omission/);
  assert.match(omission.application.innerHTML, /reponses-correction-fractions/);
  assert.match(omission.application.innerHTML, /Réponse correcte[\s\S]*3,5/);
  assert.match(omission.application.innerHTML, /Réponse correcte[\s\S]*mathsgo-role-unites[\s\S]*mathsgo-role-dixiemes/);
  assert.doesNotMatch(omission.application.innerHTML, /Correction expliquée/);

  const erreur = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&questions=20&graine=qa-app-scenario-1",
  );
  await import(`./app.js?fumee=erreur-decimale-${Date.now()}`);
  cliquer(erreur.gestionnaires, "demarrer");
  avancerJusquaQuestion(
    erreur.application,
    erreur.gestionnaires,
    (html) => /aria-label="7 sur 2"/.test(html),
  );
  cliquer(erreur.gestionnaires, "chiffre", undefined, "3");
  cliquer(erreur.gestionnaires, "caractere", undefined, ",");
  cliquer(erreur.gestionnaires, "chiffre", undefined, "2");
  cliquer(erreur.gestionnaires, "valider");
  assert.match(erreur.application.innerHTML, /À revoir/);
  assert.match(erreur.application.innerHTML, /case-reponse-rationnelle fausse/);
  assert.match(erreur.application.innerHTML, />3,2<\/output>/);
  assert.doesNotMatch(erreur.application.innerHTML, /reponse-attendue-omission/);
  assert.doesNotMatch(erreur.application.innerHTML, /reponses-correction-fractions/);
  assert.doesNotMatch(erreur.application.innerHTML, /Correction expliquée|3,5/);
  cliquer(erreur.gestionnaires, "correction");
  assert.match(erreur.application.innerHTML, /rappel-reponse-eleve reponse-fausse/);
  assert.match(erreur.application.innerHTML, /reponses-correction-fractions/);
  assert.match(erreur.application.innerHTML, /Réponse correcte[\s\S]*3,5/);
});

it("colore immédiatement la mauvaise proposition et la bonne réponse d’un QCM", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&questions=20&graine=case-0",
  );
  await import(`./app.js?fumee=qcm-verdict-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /Quelle fraction correspond à ce nombre/.test(html),
  );
  assert.match(application.innerHTML, /Quelle fraction correspond à ce nombre/);
  const ids = [...application.innerHTML.matchAll(/data-action="choix" data-id="([^"]+)"/g)]
    .map((correspondance) => correspondance[1]);
  const faux = ids.find((id) => id !== "fraction-correcte");
  assert.ok(faux);
  cliquer(gestionnaires, "choix", faux);
  cliquer(gestionnaires, "valider");
  assert.match(
    application.innerHTML,
    new RegExp(`class="choix selectionne selection-fausse"[\\s\\S]*data-id="${faux}"`),
  );
  assert.match(
    application.innerHTML,
    /class="choix correct" data-action="choix" data-id="fraction-correcte"/,
  );
  assert.doesNotMatch(application.innerHTML, /Correction expliquée/);
});

it("applique aussi les couleurs de rang aux choix décimaux d’un QCM NC-03", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&questions=20&graine=qcm-nc03-1",
  );
  await import(`./app.js?fumee=qcm-rangs-decimaux-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /Quelle est l’écriture décimale de cette fraction/.test(html),
  );
  assert.match(application.innerHTML, /Quelle est l’écriture décimale de cette fraction/);
  assert.match(application.innerHTML, /data-id="decimal-correct"[\s\S]*mathsgo-role-unites[\s\S]*mathsgo-role-dixiemes/);
  const faux = application.innerHTML.match(/data-action="choix" data-id="(?!decimal-correct)([^"]+)"/)?.[1];
  assert.ok(faux);
  cliquer(gestionnaires, "choix", faux);
  cliquer(gestionnaires, "valider");
  assert.match(application.innerHTML, /class="choix correct"[\s\S]*data-id="decimal-correct"[\s\S]*mathsgo-role-dixiemes/);
});

it("affiche en succès une sélection multiple entièrement correcte", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=carres-entiers-1-a-12&questions=20&graine=couleur-reponse-correcte",
  );
  await import(`./app.js?fumee=couleur-correcte-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  for (let index = 0; index < 20; index += 1) {
    const famille = application.innerHTML.match(/famille-([a-z-]+)"/)?.[1];
    if (famille === "reconnaitre-carres") break;
    const champs = [...application.innerHTML.matchAll(
      /data-action="champ-reponse" data-index="(\d+)"/g,
    )].map((correspondance) => correspondance[1]);
    if (champs.length > 0) {
      for (const champ of champs) {
        cliquer(gestionnaires, "champ-reponse", undefined, undefined, champ);
        cliquer(gestionnaires, "chiffre", undefined, "1");
      }
    } else {
      const choix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
      assert.ok(choix);
      cliquer(gestionnaires, "choix", choix);
    }
    cliquer(gestionnaires, "valider");
    cliquer(gestionnaires, "suivant");
  }

  assert.match(application.innerHTML, /famille-reconnaitre-carres/);
  const valeurs = [...application.innerHTML.matchAll(/data-action="choix" data-id="nombre-(\d+)"/g)]
    .map((correspondance) => Number(correspondance[1]));
  const carres = valeurs.filter((valeur) => Number.isInteger(Math.sqrt(valeur)));
  assert.ok(carres.length >= 1);
  for (const valeur of carres) cliquer(gestionnaires, "choix", `nombre-${valeur}`);
  cliquer(gestionnaires, "valider");
  assert.match(
    application.innerHTML,
    /<p class="message message-reussite" role="status"><span class="contenu-message"><strong>Bien joué !<\/strong> Ta réponse est correcte\.<\/span><\/p>/,
  );
  cliquer(gestionnaires, "correction");
  assert.match(application.innerHTML, /rappel-reponse-eleve reponse-juste/);
  assert.doesNotMatch(application.innerHTML, /rappel-reponse-eleve reponse-fausse/);
});

it("rend NC-03 et NC-04 dans une seule notion avec des repères cohérents en aide et correction", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=fumee-fractions",
  );
  await import(`./app.js?fumee=fractions-${Date.now()}`);

  assert.match(application.innerHTML, /Fractions simples et décimaux/);
  cliquer(gestionnaires, "cours");
  for (const [index, titre] of [
    [1, /Un demi : plusieurs écritures/],
    [2, /Un quart et trois quarts/],
    [3, /Nommer les rangs décimaux/],
    [4, /Lire une fraction décimale/],
    [5, /Écrire un décimal sous forme de fraction/],
    [6, /Former les unités et reconnaître les entiers/],
  ]) {
    assert.match(application.innerHTML, new RegExp(`${index} \\/ 6`));
    assert.match(application.innerHTML, titre);
    assert.match(application.innerHTML, /mathsgo-fraction|fraction-empilee|ecriture-fraction/);
    if (index <= 5) verifierFigureDecimaleResponsive(application.innerHTML);
    if (index === 1) {
      assert.match(application.innerHTML, /<span>Outil 1<\/span>\s*Bandes de fractions sur la demi-droite graduée/);
      assert.match(application.innerHTML, /<span>Outil 2<\/span>\s*Plaques de couleurs/);
      assert.match(application.innerHTML, /<span>Outil 3<\/span>\s*Tableau de numération/);
      assert.match(application.innerHTML, /figure-bandes-rail-cours-large/);
      assert.match(application.innerHTML, /figure-bandes-rail-cours-mobile/);
      assert.match(application.innerHTML, /Deux bandes représentant chacune/);
      assert.match(application.innerHTML, /1 sur 2 égale 0,5/);
      assert.match(application.innerHTML, /cd-bande-dixieme/);
      assert.match(application.innerHTML, /cd-reste-dixiemes/);
      assert.match(application.innerHTML, /data-afficher-ecritures="true"/);
      assert.doesNotMatch(application.innerHTML, /cd-piece-demi/);
      assert.match(application.innerHTML, /0,5 égale 5 sur 10 égale 1 sur 2/);
      assert.match(application.innerHTML, /mathsgo-role-unites">0<\/span>,/);
      assert.match(application.innerHTML, /mathsgo-role-dixiemes">5<\/span>/);
      assert.match(application.innerHTML, /figure-tableau-numeration/);
      assert.match(extraireTableauNumeration(application.innerHTML), /--mg-largeur-figure-source:280px/);
      verifierOrdre(
        application.innerHTML,
        "0,5 égale 5 sur 10 égale 1 sur 2",
        "Outil 3",
      );
      assert.match(application.innerHTML, /class="nd-virgule" data-separation="unites-dixiemes"/);
      assert.doesNotMatch(application.innerHTML, /barre de fraction signifie aussi une division/);
    }
    if (index === 2) {
      assert.match(application.innerHTML, /<span>Outil 1<\/span>\s*Bandes de fractions sur la demi-droite graduée/);
      assert.match(application.innerHTML, /<span>Outil 2<\/span>\s*Plaques de couleurs/);
      assert.match(application.innerHTML, /<span>Outil 3<\/span>\s*Tableau de numération/);
      assert.match(application.innerHTML, /cd-disposition-lignes/);
      assert.match(application.innerHTML, /cd-disposition-quadrants/);
      assert.match(application.innerHTML, /data-afficher-equation="false"/);
      assert.match(application.innerHTML, /0,25 égale 25 sur 100 égale 1 sur 4/);
      assert.match(application.innerHTML, /0,75 égale 75 sur 100 égale 3 sur 4/);
      assert.match(application.innerHTML, /1 sur 4 égale 0,25/);
      assert.match(application.innerHTML, /2 sur 4 égale 1 sur 2 égale 0,5/);
      assert.match(application.innerHTML, /3 sur 4 égale 0,75/);
      assert.doesNotMatch(application.innerHTML, /cd-numero-quadrant/);
      assert.equal((application.innerHTML.match(/figure-tableau-numeration/g) ?? []).length >= 2, true);
    }
    if (index === 3) {
      assert.match(application.innerHTML, /Une unité = dix dixièmes/);
      assert.match(application.innerHTML, /Un dixième = dix centièmes/);
      assert.match(application.innerHTML, /Une unité = cent centièmes/);
      assert.match(application.innerHTML, /data-echange="unite-centiemes"/);
      assert.match(application.innerHTML, /figure-echange-rangs-cours/);
      assert.match(application.innerHTML, /nd-echange-empreinte/);
      assert.match(application.innerHTML, /nd-echange-fraction-dixiemes/);
      assert.match(application.innerHTML, /nd-echange-fraction-centiemes/);
      assert.match(application.innerHTML, /1 sur 1000 égale 0,001/);
      assert.match(application.innerHTML, /class="nd-virgule" data-separation="unites-dixiemes"/);
      assert.doesNotMatch(application.innerHTML, /147 sur 100/);
    }
    if (index === 4) {
      assert.match(application.innerHTML, /<h4 class="titre-methode-conversion-rangs">/);
      assert.match(application.innerHTML, /<span>Méthode 1<\/span>\s*Avec les plaques de couleurs/);
      assert.match(application.innerHTML, /<span>Méthode 2<\/span>\s*Avec le tableau de numération/);
      assert.match(application.innerHTML, /147 sur 100 égale 100 sur 100 plus 40 sur 100 plus 7 sur 100/);
      assert.match(application.innerHTML, /data-etat="converti-rang-final" data-sens="fraction-vers-decimal"/);
      assert.match(application.innerHTML, /data-etat="decompose" data-sens="fraction-vers-decimal"/);
      assert.match(application.innerHTML, /data-rang-final="centiemes"/);
      assert.match(application.innerHTML, /mathsgo-role-dixiemes/);
      assert.match(application.innerHTML, /mathsgo-role-centiemes/);
      assert.match(application.innerHTML, /mathsgo-role-milliemes/);
      assert.match(application.innerHTML, /class="nd-virgule" data-separation="unites-dixiemes"/);
      assert.match(application.innerHTML, /725 sur 1000 égale 0,725/);
      assert.match(application.innerHTML, /7 sur 100 égale 0,07/);
      assert.match(application.innerHTML, /7 sur 1000 égale 0,007/);
      verifierOrdre(
        application.innerHTML,
        "Méthode 1",
        "Méthode 2",
      );
      assert.doesNotMatch(application.innerHTML, /Vérifier dans le tableau/);
      assert.doesNotMatch(application.innerHTML, /nd-piece nd-millieme/);
      assert.doesNotMatch(application.innerHTML, /Chaque signe égal est aligné/);
    }
    if (index === 5) {
      assert.match(application.innerHTML, /<h4 class="titre-methode-conversion-rangs">/);
      assert.match(application.innerHTML, /<span>Méthode 1<\/span>\s*Avec les plaques de couleurs/);
      assert.match(application.innerHTML, /<span>Méthode 2<\/span>\s*Avec le tableau de numération/);
      assert.match(application.innerHTML, /mathsgo-egalites-alignees/);
      assert.match(application.innerHTML, /3,54 égale 3 plus 5 sur 10 plus 4 sur 100/);
      assert.match(application.innerHTML, /300 sur 100 plus 50 sur 100 plus 4 sur 100/);
      assert.match(application.innerHTML, /354 sur 100/);
      assert.match(application.innerHTML, /data-etat="decompose" data-sens="decimal-vers-fraction"/);
      assert.match(application.innerHTML, /data-etat="converti-rang-final" data-sens="decimal-vers-fraction"/);
      assert.match(application.innerHTML, /class="nd-virgule" data-separation="unites-dixiemes"/);
      assert.match(application.innerHTML, /chercher une fraction décimale égale à 3,54/);
      assert.match(application.innerHTML, /Convertir ensuite toutes les pièces en centièmes/);
      verifierOrdre(
        application.innerHTML,
        "Méthode 1",
        "Méthode 2",
      );
      assert.doesNotMatch(application.innerHTML, /Vérifier dans le tableau/);
      assert.doesNotMatch(application.innerHTML, /Le dénominateur est imprimé/);
      assert.doesNotMatch(application.innerHTML, /Les deux cases sont libres/);
      assert.doesNotMatch(application.innerHTML, /0,75 égale 75 sur 100 égale 3 sur 4/);
      assert.doesNotMatch(application.innerHTML, /figure-bandes-rail/);
    }
    if (index === 6) {
      assert.match(application.innerHTML, /Le dénominateur donne la taille d’une pièce/);
      assert.match(application.innerHTML, /Au départ : 7 demis/);
      assert.match(application.innerHTML, /Au départ : 6 quarts/);
      assert.equal(
        (application.innerHTML.match(/bandes-rail-cours-responsive-mobile-strict/g) ?? []).length,
        5,
      );
      assert.equal(
        (application.innerHTML.match(/viewBox="0 0 340 232"/g) ?? []).length,
        5,
      );
      assert.equal(
        (application.innerHTML.match(/viewBox="0 0 260 154"/g) ?? []).length,
        2,
      );
      assert.match(application.innerHTML, /figure-bandes-rail-cours-large/);
      assert.match(application.innerHTML, /figure-bandes-rail-cours-mobile/);
      assert.match(application.innerHTML, /reste-fusionne-en-demi/);
      assert.match(application.innerHTML, /repere-intermediaire-cours/);
      assert.match(application.innerHTML, /Repères des demis et des quarts/);
      assert.match(application.innerHTML, /De demi en demi/);
      assert.match(application.innerHTML, /De quart en quart/);
      assert.match(
        application.innerHTML,
        /repere-intermediaire-cours[^>]*>0,75<\/text>/,
      );
      assert.match(application.innerHTML, /fraction de numérateur 5 et de dénominateur 2 vaut 2,5/);
      assert.match(application.innerHTML, /fraction de numérateur 8 et de dénominateur 4 vaut 2/);
      assert.match(application.innerHTML, /fraction de numérateur 5 et de dénominateur 1 vaut 5/);
      assert.match(application.innerHTML, /data-denominateur="1"/);
      assert.match(application.innerHTML, /100 sur 100 égale 1/);
      assert.doesNotMatch(application.innerHTML, /Choisir un outil/);
      assert.doesNotMatch(application.innerHTML, /barre de fraction se lit aussi « divisé par »/);
    }
    if (index < 6) cliquer(gestionnaires, "cours-suivant");
  }
  cliquer(gestionnaires, "fermer-cours");
  cliquer(gestionnaires, "demarrer");

  let directVu = false;
  let inverseVu = false;
  let libreVue = false;
  let droiteVue = false;
  let tableauVu = false;
  for (let index = 0; index < 20; index += 1) {
    assert.match(application.innerHTML, /carte-question-fractions/);
    assert.match(application.innerHTML, /fraction-empilee/);
    directVu ||= /famille-fraction-vers-decimal/.test(application.innerHTML);
    inverseVu ||= /famille-decimal-vers-fraction/.test(application.innerHTML);
    libreVue ||= /Toutes les fractions égales sont acceptées/.test(
      application.innerHTML,
    );
    if (/Toutes les fractions égales sont acceptées/.test(application.innerHTML)) {
      assert.match(
        application.innerHTML,
        /fraction-reponse" role="group" aria-label="Fraction à compléter"/,
      );
    }

    cliquer(gestionnaires, "aide");
    assert.match(application.innerHTML, /panneau-fractions/);
    assert.match(application.innerHTML, /contenu-atelier-aide-fractions/);
    assert.doesNotMatch(application.innerHTML, /1 · Un indice|2 · Voir|3 · Construire/);
    const aideDroite = /figure-double-droite-fraction|figure-bandes-rail/.test(application.innerHTML);
    const aideTableau = /figure-tableau-numeration/.test(application.innerHTML);
    droiteVue ||= aideDroite;
    tableauVu ||= aideTableau;
    assert.match(
      application.innerHTML,
      /figure-bandes-rail|figure-tableau-numeration|tuiles-unites|choix-rang-fraction/,
    );
    cliquer(gestionnaires, "fermer-aide");

    cliquer(gestionnaires, "correction");
    if (aideDroite) {
      assert.match(
        application.innerHTML,
        /figure-double-droite-fraction|figure-bandes-rail|figure-grille-repere|figure-correspondance-decimale/,
      );
    }
    if (aideTableau && !/Toutes les fractions égales sont acceptées/.test(application.innerHTML)) {
      assert.match(application.innerHTML, /figure-tableau-numeration/);
    }
    cliquer(gestionnaires, "fermer-correction");
    cliquer(gestionnaires, "reponse");
    assert.match(application.innerHTML, /Réponse affichée/);
    cliquer(gestionnaires, "suivant");
  }

  assert.equal(directVu, true);
  assert.equal(inverseVu, true);
  assert.equal(libreVue, true);
  assert.equal(droiteVue, true);
  assert.equal(tableauVu, true);
  assert.match(application.innerHTML, /Séance terminée/);
});

it("garde les centièmes et millièmes imposés sans révéler le décimal en aide NC-03", async () => {
  let contexte = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-rangs-app-141",
  );
  let { application, gestionnaires } = contexte;
  await import(`./app.js?fumee=rangs-nc03-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="429 sur 1000"/.test(html),
  );
  assert.match(application.innerHTML, /aria-label="429 sur 1000"/);
  cliquer(gestionnaires, "aide");
  let aide = extrairePanneauAide(application.innerHTML);
  verifierFigureDecimaleResponsive(aide);
  let tableau = extraireTableauNumeration(aide);
  assert.doesNotMatch(aide, /figure-conversion-rangs-aide/);
  assert.equal((tableau.match(/class="nd-chiffre"[^>]*>\?<\/text>/g) ?? []).length, 8);
  assert.equal((tableau.match(/class="nd-virgule"/g) ?? []).length, 2);
  assert.doesNotMatch(tableau, /0,429|data-ecriture-decimale|class="nd-lecture"/);
  cliquer(
    gestionnaires,
    "rang-fraction",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "milliemes",
  );
  aide = extrairePanneauAide(application.innerHTML);
  tableau = extraireTableauNumeration(aide);
  assert.match(tableau, /data-rang="unites" data-chiffre="0"/);
  assert.match(tableau, /data-rang="dixiemes" data-chiffre="4"/);
  assert.match(tableau, /data-rang="centiemes" data-chiffre="2"/);
  assert.match(tableau, /data-rang="milliemes" data-chiffre="9"/);
  assert.doesNotMatch(tableau, /0,429|data-ecriture-decimale|class="nd-lecture"/);
  verifierPaletteTableauNumeration(tableau);
  cliquer(gestionnaires, "fermer-aide");

  contexte = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-rangs-app-8581",
  );
  application = contexte.application;
  gestionnaires = contexte.gestionnaires;
  await import(`./app.js?fumee=rangs-nc03-centiemes-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="50 sur 100"/.test(html),
  );
  assert.match(application.innerHTML, /aria-label="50 sur 100"/);
  cliquer(gestionnaires, "aide");
  aide = extrairePanneauAide(application.innerHTML);
  tableau = extraireTableauNumeration(aide);
  assert.match(aide, /data-profil="aide-nc03" data-rang-final="centiemes"/);
  assert.match(aide, /data-etat="converti-rang-final" data-sens="fraction-vers-decimal"/);
  assert.equal((aide.match(/data-profil="aide-nc03"/g) ?? []).length, 2);
  assert.doesNotMatch(aide, /data-ecriture-decimale="0,50"|>0,50<|>0,5</);
  assert.equal((tableau.match(/class="nd-chiffre"[^>]*>\?<\/text>/g) ?? []).length, 8);
  assert.equal((tableau.match(/class="nd-virgule"/g) ?? []).length, 2);

  cliquer(
    gestionnaires,
    "rang-fraction",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "centiemes",
  );
  aide = extrairePanneauAide(application.innerHTML);
  tableau = extraireTableauNumeration(aide);
  assert.equal((aide.match(/data-profil="aide-nc03"/g) ?? []).length, 4);
  assert.match(aide, /data-etat="decompose" data-sens="fraction-vers-decimal"/);
  assert.match(tableau, /data-rang="unites" data-chiffre="0"/);
  assert.match(tableau, /data-rang="dixiemes" data-chiffre="5"/);
  assert.match(tableau, /data-rang="centiemes" data-chiffre="0"/);
  assert.doesNotMatch(tableau, /data-ecriture-decimale|class="nd-lecture"/);
  verifierPaletteTableauNumeration(tableau);
  cliquer(gestionnaires, "fermer-aide");
  cliquer(gestionnaires, "correction");
  verifierFigureDecimaleResponsive(application.innerHTML);
  assert.match(application.innerHTML, /transformation-rangs-correction/);
  assert.match(application.innerHTML, /<span>Méthode 1<\/span>\s*Avec les plaques de couleurs/);
  assert.match(application.innerHTML, /<span>Méthode 2<\/span>\s*Avec le tableau de numération/);
  assert.match(application.innerHTML, /data-profil="solution" data-rang-final="centiemes"/);
  assert.match(application.innerHTML, /data-etat="converti-rang-final" data-sens="fraction-vers-decimal"/);
  assert.match(application.innerHTML, /data-etat="decompose" data-sens="fraction-vers-decimal"/);
  assert.match(application.innerHTML, /data-ecriture-decimale="0,50"/);
});

it("garde les centièmes et millièmes imposés sans révéler le numérateur en aide NC-04", async () => {
  let contexte = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-rangs-app-4637",
  );
  let { application, gestionnaires } = contexte;
  await import(`./app.js?fumee=rangs-nc04-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="0,425"/.test(html),
  );
  assert.match(application.innerHTML, /mathsgo-role-milliemes">5<\/span>/);
  cliquer(gestionnaires, "aide");
  let aide = extrairePanneauAide(application.innerHTML);
  verifierFigureDecimaleResponsive(aide);
  let tableau = extraireTableauNumeration(aide);
  assert.doesNotMatch(aide, /figure-conversion-rangs-aide/);
  assert.equal((tableau.match(/class="nd-chiffre"[^>]*>\?<\/text>/g) ?? []).length, 8);
  assert.equal((tableau.match(/class="nd-virgule"/g) ?? []).length, 2);
  cliquer(
    gestionnaires,
    "rang-fraction",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "milliemes",
  );
  aide = extrairePanneauAide(application.innerHTML);
  tableau = extraireTableauNumeration(aide);
  assert.match(tableau, /data-rang="unites" data-chiffre="0"/);
  assert.match(tableau, /data-rang="dixiemes" data-chiffre="4"/);
  assert.match(tableau, /data-rang="centiemes" data-chiffre="2"/);
  assert.match(tableau, /data-rang="milliemes" data-chiffre="5"/);
  assert.doesNotMatch(tableau, /data-numerateur|data-denominateur|class="nd-lecture"/);
  verifierPaletteTableauNumeration(tableau);
  cliquer(gestionnaires, "fermer-aide");

  contexte = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-rangs-app-1265",
  );
  application = contexte.application;
  gestionnaires = contexte.gestionnaires;
  await import(`./app.js?fumee=rangs-nc04-centiemes-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="0,5"/.test(html) && /aria-label="case sur 100"/.test(html),
  );
  assert.match(application.innerHTML, /mathsgo-role-unites">0<\/span>,/);
  assert.match(application.innerHTML, /mathsgo-role-dixiemes">5<\/span>/);
  cliquer(gestionnaires, "aide");
  aide = extrairePanneauAide(application.innerHTML);
  tableau = extraireTableauNumeration(aide);
  assert.match(aide, /data-ecriture-decimale="0,50"/);
  assert.match(aide, /data-profil="aide-nc04" data-rang-final="centiemes"/);
  assert.match(aide, /data-legende="5\/10"/);
  assert.doesNotMatch(aide, /data-legende="5\/10=\?\/100"/);
  assert.doesNotMatch(aide, /50\/100|data-numerateur-cible|data-denominateur-cible/);
  assert.match(aide, /<span>Méthode 1<\/span>\s*Avec les plaques de couleurs/);
  assert.match(aide, /<span>Méthode 2<\/span>\s*Avec le tableau de numération/);
  assert.match(aide, /<h3 class="titre-methode-conversion-rangs">/);
  assert.equal((aide.match(/data-profil="aide-nc04"/g) ?? []).length, 2);
  assert.equal((tableau.match(/class="nd-chiffre"[^>]*>\?<\/text>/g) ?? []).length, 8);

  cliquer(
    gestionnaires,
    "rang-fraction",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "centiemes",
  );
  aide = extrairePanneauAide(application.innerHTML);
  tableau = extraireTableauNumeration(aide);
  assert.equal((aide.match(/data-profil="aide-nc04"/g) ?? []).length, 4);
  assert.match(aide, /data-etat="converti-rang-final" data-sens="decimal-vers-fraction"/);
  assert.match(aide, /data-legende="5\/10=\?\/100"/);
  assert.doesNotMatch(aide, /50\/100|data-numerateur-cible|data-denominateur-cible/);
  assert.match(tableau, /data-rang="unites" data-chiffre="0"/);
  assert.match(tableau, /data-rang="dixiemes" data-chiffre="5"/);
  assert.match(tableau, /data-rang="centiemes" data-chiffre="0"/);
  assert.doesNotMatch(tableau, /data-numerateur|data-denominateur|class="nd-lecture"/);
  verifierPaletteTableauNumeration(tableau);
  cliquer(gestionnaires, "fermer-aide");
  cliquer(gestionnaires, "correction");
  verifierFigureDecimaleResponsive(application.innerHTML);
  assert.match(application.innerHTML, /transformation-rangs-correction/);
  assert.match(application.innerHTML, /Deux méthodes sont possibles/);
  assert.match(application.innerHTML, /<span>Méthode 1<\/span>\s*Avec les plaques de couleurs/);
  assert.match(application.innerHTML, /<span>Méthode 2<\/span>\s*Avec le tableau de numération/);
  assert.match(application.innerHTML, /<h3 class="titre-methode-conversion-rangs">/);
  assert.doesNotMatch(application.innerHTML, /Lire le tableau rempli dans l’autre sens/);
  assert.match(application.innerHTML, /data-profil="solution" data-rang-final="centiemes"/);
  assert.match(application.innerHTML, /data-etat="decompose" data-sens="decimal-vers-fraction"/);
  assert.match(application.innerHTML, /data-etat="converti-rang-final" data-sens="decimal-vers-fraction"/);
  assert.match(application.innerHTML, /data-numerateur-cible="50" data-denominateur-cible="100"/);
});

it("corrige deux quarts avec les bandes et leur fusion, sans tableau ni grille de 100", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-1",
  );
  await import(`./app.js?fumee=correction-deux-quarts-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /famille-fraction-vers-decimal-quarts/.test(html)
      && /aria-label="2 sur 4"/.test(html),
  );

  assert.match(application.innerHTML, /aria-label="2 sur 4"/);
  cliquer(gestionnaires, "correction");

  assert.match(application.innerHTML, /correction-outils-familiers/);
  assert.match(application.innerHTML, /<h3 class="titre-methode-conversion-rangs">Avec les bandes de fractions<\/h3>/);
  assert.match(application.innerHTML, /Deux quarts séparés/);
  assert.match(application.innerHTML, /Les deux quarts forment un demi/);
  assert.match(application.innerHTML, /reste-fusionne-en-demi/);
  assert.match(application.innerHTML, /aria-label="1 sur 2"/);
  assert.match(application.innerHTML, /aria-label="0,5"/);
  assert.doesNotMatch(application.innerHTML, /figure-tableau-numeration|Avec le tableau de numération/);
  assert.doesNotMatch(application.innerHTML, /Avec les plaques de couleurs/);
  assert.doesNotMatch(application.innerHTML, /figure-grille-repere/);
  assert.doesNotMatch(application.innerHTML, /Transformer le repère en centièmes/);
});

it("corrige aussi 0,5 vers deux quarts avec les bandes seules", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-0",
  );
  await import(`./app.js?fumee=correction-deux-quarts-inverse-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /famille-decimal-vers-fraction-quarts/.test(html)
      && /aria-label="0,5"/.test(html)
      && /aria-label="case sur 4"/.test(html),
  );

  assert.match(application.innerHTML, /aria-label="0,5"/);
  cliquer(gestionnaires, "correction");

  assert.match(application.innerHTML, /<h3 class="titre-methode-conversion-rangs">Avec les bandes de fractions<\/h3>/);
  assert.match(application.innerHTML, /reste-fusionne-en-demi/);
  assert.match(application.innerHTML, /aria-label="1 sur 2"/);
  assert.match(application.innerHTML, /aria-label="2 sur 4"/);
  assert.doesNotMatch(application.innerHTML, /figure-tableau-numeration|Avec le tableau de numération/);
  assert.doesNotMatch(application.innerHTML, /Avec les plaques de couleurs/);
  assert.doesNotMatch(application.innerHTML, /figure-grille-repere/);
});

it("corrige un quart et trois quarts avec le rail puis les plaques, sans tableau", async () => {
  for (const { numerateur, centiemes, graine } of [
    { numerateur: 1, centiemes: 25, graine: "qa-quarts-v4-4" },
    { numerateur: 3, centiemes: 75, graine: "qa-quarts-v4-10" },
  ]) {
    const { application, gestionnaires } = installerFauxNavigateur(
      `?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=${graine}`,
    );
    await import(`./app.js?fumee=correction-${numerateur}-quart-${Date.now()}`);
    cliquer(gestionnaires, "demarrer");
    avancerJusquaQuestion(
      application,
      gestionnaires,
      (html) => /famille-fraction-vers-decimal-quarts/.test(html)
        && new RegExp(`aria-label="${numerateur} sur 4"`).test(html),
    );
    cliquer(gestionnaires, "correction");

    assert.match(application.innerHTML, /Deux représentations sont utiles ici/);
    assert.match(application.innerHTML, /<span>Méthode 1<\/span>\s*Avec les bandes de fractions/);
    assert.match(application.innerHTML, /<span>Méthode 2<\/span>\s*Avec les plaques de couleurs/);
    assert.match(application.innerHTML, /figure-bandes-rail/);
    assert.match(
      application.innerHTML,
      new RegExp(`data-objet="reorganisation-centiemes" data-centiemes="${centiemes}"`),
    );
    assert.match(application.innerHTML, new RegExp(`aria-label="${centiemes} sur 100"`));
    assert.doesNotMatch(application.innerHTML, /figure-tableau-numeration|Avec le tableau de numération/);
  }
});

it("corrige les fractions libres 0,25 et 0,75 avec le rail puis les plaques", async () => {
  for (const { decimal, numerateur, centiemes, graine } of [
    { decimal: "0,25", numerateur: 1, centiemes: 25, graine: "first-nc04-v4-7" },
    { decimal: "0,75", numerateur: 3, centiemes: 75, graine: "first-nc04-v4-245" },
  ]) {
    const { application, gestionnaires } = installerFauxNavigateur(
      `?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=${graine}`,
    );
    await import(`./app.js?fumee=correction-libre-${numerateur}-quart-${Date.now()}`);
    cliquer(gestionnaires, "demarrer");
    avancerJusquaQuestion(
      application,
      gestionnaires,
      (html) => new RegExp(`aria-label="${decimal}"`).test(html)
        && /Toutes les fractions égales sont acceptées/.test(html),
    );
    cliquer(gestionnaires, "correction");

    assert.match(application.innerHTML, /<span>Méthode 1<\/span>\s*Avec les bandes de fractions/);
    assert.match(application.innerHTML, /<span>Méthode 2<\/span>\s*Avec les plaques de couleurs/);
    assert.match(application.innerHTML, /figure-bandes-rail/);
    assert.match(
      application.innerHTML,
      new RegExp(`data-objet="reorganisation-centiemes" data-centiemes="${centiemes}"`),
    );
    assert.match(application.innerHTML, new RegExp(`aria-label="${numerateur} sur 4"`));
    assert.match(application.innerHTML, new RegExp(`aria-label="${centiemes} sur 100"`));
    assert.doesNotMatch(application.innerHTML, /figure-tableau-numeration|Avec le tableau de numération/);
  }
});

it("lit directement huit et douze quarts entiers sans recopier les mêmes membres", async () => {
  for (const { numerateur, entier, graine } of [
    { numerateur: 8, entier: 2, graine: "qa-quarts-v4-2" },
    { numerateur: 12, entier: 3, graine: "qa-quarts-v4-10" },
  ]) {
    const { application, gestionnaires } = installerFauxNavigateur(
      `?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=${graine}`,
    );
    await import(`./app.js?fumee=correction-entier-${numerateur}-quarts-${Date.now()}`);
    cliquer(gestionnaires, "demarrer");
    avancerJusquaQuestion(
      application,
      gestionnaires,
      (html) => /famille-fraction-vers-decimal-quarts/.test(html)
        && new RegExp(`aria-label="${numerateur} sur 4"`).test(html),
    );
    cliquer(gestionnaires, "correction");

    assert.match(
      application.innerHTML,
      new RegExp(`aria-label="${numerateur} sur 4 égale ${entier}"`),
    );
    assert.doesNotMatch(
      application.innerHTML,
      new RegExp(`${numerateur} sur 4 égale ${numerateur} sur 4|${entier} égale ${entier}`),
    );
  }
});

it("écrit aussi les entiers deux et trois comme huit et douze quarts sans doublon", async () => {
  for (const { numerateur, entier, graine } of [
    { numerateur: 8, entier: 2, graine: "qa-inverse-entier-21" },
    { numerateur: 12, entier: 3, graine: "qa-quarts-v4-14" },
  ]) {
    const { application, gestionnaires } = installerFauxNavigateur(
      `?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=${graine}`,
    );
    await import(`./app.js?fumee=correction-entier-inverse-${numerateur}-quarts-${Date.now()}`);
    cliquer(gestionnaires, "demarrer");
    avancerJusquaQuestion(
      application,
      gestionnaires,
      (html) => /famille-decimal-vers-fraction-quarts/.test(html)
        && new RegExp(`aria-label="${entier}"[\\s\\S]*?aria-label="case sur 4"`).test(html),
    );
    cliquer(gestionnaires, "correction");

    assert.match(
      application.innerHTML,
      new RegExp(`aria-label="${entier} égale ${numerateur} sur 4"`),
    );
    assert.doesNotMatch(
      application.innerHTML,
      new RegExp(`${numerateur} sur 4 égale ${numerateur} sur 4|${entier} égale ${entier}`),
    );
  }
});

it("construit 11 quarts dans les deux sens avec l’ajout d’une unité et sans fuite", async () => {
  const direct = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-quarts-v4-7",
  );
  await import(`./app.js?fumee=onze-quarts-direct-${Date.now()}`);
  cliquer(direct.gestionnaires, "demarrer");
  avancerJusquaQuestion(
    direct.application,
    direct.gestionnaires,
    (html) => /famille-fraction-vers-decimal-quarts/.test(html)
      && /aria-label="11 sur 4"/.test(html),
  );
  cliquer(direct.gestionnaires, "aide");
  let aide = extrairePanneauAide(direct.application.innerHTML);
  verifierRailAideResponsive(aide);
  assert.match(aide, /aria-label="11 sur 4"|numérateur 11 et de dénominateur 4/);
  assert.doesNotMatch(aide, /2,75/);
  cliquer(direct.gestionnaires, "fermer-aide");
  cliquer(direct.gestionnaires, "correction");
  assert.match(direct.application.innerHTML, /figure-bandes-rail/);
  assert.match(direct.application.innerHTML, /aria-label="11 sur 4 égale 8 sur 4 plus 3 sur 4 égale 2 plus 3 sur 4 égale 2,75"/);

  const inverse = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=first-nc04-v4-102",
  );
  await import(`./app.js?fumee=onze-quarts-inverse-${Date.now()}`);
  cliquer(inverse.gestionnaires, "demarrer");
  assert.match(inverse.application.innerHTML, /aria-label="2,75"/);
  assert.match(inverse.application.innerHTML, /aria-label="case sur 4"/);
  cliquer(inverse.gestionnaires, "aide");
  aide = extrairePanneauAide(inverse.application.innerHTML);
  verifierRailAideResponsive(aide);
  assert.match(aide, /data-action="pas-fraction-unite" data-pas="4"/);
  assert.match(aide, /Ajouter 4 quarts \(1 unité\)/);
  assert.doesNotMatch(aide, /11 sur 4|numérateur 11|Les 11 quarts|type="range"/);

  cliquer(
    inverse.gestionnaires,
    "pas-fraction-unite",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "4",
  );
  cliquer(
    inverse.gestionnaires,
    "pas-fraction-unite",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "4",
  );
  for (let index = 0; index < 3; index += 1) {
    cliquer(inverse.gestionnaires, "pas-fraction-suivant");
  }
  aide = extrairePanneauAide(inverse.application.innerHTML);
  assert.match(aide, /atelier-groupement/);
  assert.match(aide, /Tu as posé les pièces jusqu’au point décimal donné/);
  assert.doesNotMatch(aide, /11 sur 4|Les 11 quarts/);
  cliquer(inverse.gestionnaires, "fermer-aide");
  cliquer(inverse.gestionnaires, "correction");
  assert.match(inverse.application.innerHTML, /figure-bandes-rail/);
  assert.match(inverse.application.innerHTML, /aria-label="2,75 égale 2 plus 3 sur 4 égale 8 sur 4 plus 3 sur 4 égale 11 sur 4"/);
  assert.doesNotMatch(inverse.application.innerHTML, /figure-tableau-numeration/);
});

it("corrige la fraction libre 2,75 avec le rail et conserve 275 centièmes", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-quarts-v4-0",
  );
  await import(`./app.js?fumee=correction-libre-onze-quarts-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="2,75"/.test(html)
      && /Toutes les fractions égales sont acceptées/.test(html),
  );
  cliquer(gestionnaires, "correction");

  assert.match(application.innerHTML, /figure-bandes-rail/);
  assert.match(application.innerHTML, /aria-label="11 sur 4"/);
  assert.match(application.innerHTML, /aria-label="275 sur 100"/);
  assert.doesNotMatch(application.innerHTML, /figure-tableau-numeration|Avec le tableau de numération/);
});

it("emploie les deux méthodes pour les dixièmes et le tableau seul pour les millièmes", async () => {
  const dixiemes = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-1",
  );
  await import(`./app.js?fumee=methodes-dixiemes-${Date.now()}`);
  cliquer(dixiemes.gestionnaires, "demarrer");
  avancerJusquaQuestion(
    dixiemes.application,
    dixiemes.gestionnaires,
    (html) => /aria-label="1 sur 10"/.test(html),
  );

  assert.match(dixiemes.application.innerHTML, /aria-label="1 sur 10"/);
  cliquer(dixiemes.gestionnaires, "aide");
  let aide = extrairePanneauAide(dixiemes.application.innerHTML);
  assert.match(aide, /<h3 class="titre-methode-conversion-rangs">/);
  assert.match(aide, /<span>Méthode 1<\/span>\s*Avec les plaques de couleurs/);
  assert.match(aide, /<span>Méthode 2<\/span>\s*Avec le tableau de numération/);
  assert.match(aide, /data-profil="aide-nc03" data-rang-final="dixiemes"/);
  assert.doesNotMatch(aide, /data-ecriture-decimale="0,1"|>0,1</);
  cliquer(dixiemes.gestionnaires, "fermer-aide");
  cliquer(dixiemes.gestionnaires, "correction");
  assert.match(dixiemes.application.innerHTML, /data-profil="solution" data-rang-final="dixiemes"/);
  assert.match(dixiemes.application.innerHTML, /data-ecriture-decimale="0,1"/);

  const milliemes = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-74",
  );
  await import(`./app.js?fumee=correction-milliemes-tableau-${Date.now()}`);
  cliquer(milliemes.gestionnaires, "demarrer");
  avancerJusquaQuestion(
    milliemes.application,
    milliemes.gestionnaires,
    (html) => /famille-fraction-vers-decimal-milliemes/.test(html)
      && /aria-label="429 sur 1000"/.test(html),
  );

  assert.match(milliemes.application.innerHTML, /aria-label="429 sur 1000"/);
  cliquer(milliemes.gestionnaires, "correction");
  assert.match(milliemes.application.innerHTML, /figure-tableau-numeration/);
  assert.doesNotMatch(milliemes.application.innerHTML, /methodes-conversion-rangs-correction/);
  assert.doesNotMatch(milliemes.application.innerHTML, /figure-conversion-rangs-correction/);
  assert.doesNotMatch(milliemes.application.innerHTML, /Avec les plaques de couleurs/);
});

it("décompose 2,27 dans ses rangs avant de convertir les pièces en centièmes", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-497",
  );
  await import(`./app.js?fumee=correction-227-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="2,27"/.test(html),
  );

  assert.match(application.innerHTML, /aria-label="2,27"/);
  cliquer(gestionnaires, "correction");
  assert.match(application.innerHTML, /<span>Méthode 1<\/span>\s*Avec les plaques de couleurs/);
  assert.match(application.innerHTML, /<span>Méthode 2<\/span>\s*Avec le tableau de numération/);

  const debutDecomposition = application.innerHTML.indexOf(
    'data-etat="decompose" data-sens="decimal-vers-fraction"',
  );
  assert.notEqual(debutDecomposition, -1);
  const finDecomposition = application.innerHTML.indexOf("</svg>", debutDecomposition);
  const decomposition = application.innerHTML.slice(debutDecomposition, finDecomposition);
  assert.match(decomposition, /data-legende="2"/);
  assert.match(decomposition, /data-legende="2\/10"/);
  assert.match(decomposition, /data-legende="7\/100"/);
  assert.doesNotMatch(decomposition, /200\/100|20\/100/);

  const debutConversion = application.innerHTML.indexOf(
    'data-etat="converti-rang-final" data-sens="decimal-vers-fraction"',
  );
  assert.notEqual(debutConversion, -1);
  const finConversion = application.innerHTML.indexOf("</svg>", debutConversion);
  const conversion = application.innerHTML.slice(debutConversion, finConversion);
  assert.match(conversion, /data-legende="2=200\/100"/);
  assert.match(conversion, /data-legende="2\/10=20\/100"/);
  assert.match(conversion, /data-legende="7\/100"/);
});

it("réemploie la conversion canonique dans l’aide d’une fraction libre générique", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-5",
  );
  await import(`./app.js?fumee=libre-generique-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="1,03"/.test(html)
      && /Toutes les fractions égales sont acceptées/.test(html),
  );

  assert.match(application.innerHTML, /Toutes les fractions égales sont acceptées/);
  assert.match(application.innerHTML, /mathsgo-role-unites">1<\/span>,/);
  assert.match(application.innerHTML, /mathsgo-role-centiemes">3<\/span>/);
  cliquer(gestionnaires, "aide");
  let aide = extrairePanneauAide(application.innerHTML);
  assert.doesNotMatch(aide, /figure-conversion-rangs-aide|103\/100/);
  assert.match(aide, /aria-label="\? sur \?"/);

  cliquer(
    gestionnaires,
    "rang-fraction",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "centiemes",
  );
  aide = extrairePanneauAide(application.innerHTML);
  verifierFigureDecimaleResponsive(aide);
  const tableau = extraireTableauNumeration(aide);
  assert.equal((aide.match(/data-profil="aide-nc04"/g) ?? []).length, 4);
  assert.match(aide, /data-etat="decompose" data-sens="decimal-vers-fraction"/);
  assert.match(aide, /data-etat="converti-rang-final" data-sens="decimal-vers-fraction"/);
  assert.match(aide, /data-legende="1=\?\/100"/);
  assert.doesNotMatch(aide, /103\/100|3\/100|data-numerateur-cible|data-denominateur-cible/);
  assert.match(tableau, /data-rang="unites" data-chiffre="1"/);
  assert.match(tableau, /data-rang="dixiemes" data-chiffre="0"/);
  assert.match(tableau, /data-rang="centiemes" data-chiffre="3"/);
  assert.doesNotMatch(tableau, /data-numerateur|data-denominateur|class="nd-lecture"/);
  verifierPaletteTableauNumeration(tableau);
});

it("corrige une fraction libre générique avec les plaques ou le tableau", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-5",
  );
  await import(`./app.js?fumee=correction-libre-generique-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="1,03"/.test(html)
      && /Toutes les fractions égales sont acceptées/.test(html),
  );

  cliquer(gestionnaires, "correction");
  assert.match(application.innerHTML, /Deux méthodes sont possibles/);
  assert.match(application.innerHTML, /<span>Méthode 1<\/span>\s*Avec les plaques de couleurs/);
  assert.match(application.innerHTML, /<span>Méthode 2<\/span>\s*Avec le tableau de numération/);
  assert.match(application.innerHTML, /data-etat="decompose" data-sens="decimal-vers-fraction"/);
  assert.match(application.innerHTML, /data-etat="converti-rang-final" data-sens="decimal-vers-fraction"/);
  assert.match(application.innerHTML, /data-legende="1=100\/100"/);
  assert.match(application.innerHTML, /data-legende="3\/100"/);
  assert.match(application.innerHTML, /figure-tableau-numeration/);
  assert.match(application.innerHTML, /aria-label="103 sur 100"/);
  assert.match(application.innerHTML, /toute fraction équivalente est aussi juste/);
});

it("termine une série fractions avec un bilan local NC-03, NC-04 et aides", async () => {
  const { application, gestionnaires, focusRecus } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&questions=20&graine=fumee-bilan-fractions",
  );
  await import(`./app.js?fumee=bilan-fractions-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  for (let index = 0; index < 20; index += 1) {
    if (index === 0) {
      cliquer(gestionnaires, "aide");
      cliquer(gestionnaires, "fermer-aide");
    }
    const fractionLibre = /data-action="champ-reponse"/.test(
      application.innerHTML,
    );
    if (fractionLibre) {
      const champ = (champIndex) => ({
        dataset: { index: String(champIndex) },
        closest(selecteur) {
          return selecteur === '[data-action="champ-reponse"]' ? this : null;
        },
      });
      globalThis.document.activeElement = champ(0);
      appuyer(gestionnaires, "7");
      assert.equal(
        focusRecus.at(-1),
        '[data-action="champ-reponse"][data-index="0"]',
      );

      globalThis.document.activeElement = champ(0);
      assert.equal(appuyer(gestionnaires, "Tab"), 1);
      assert.equal(
        focusRecus.at(-1),
        '[data-action="champ-reponse"][data-index="1"]',
      );

      globalThis.document.activeElement = champ(1);
      const focusAvantSortie = focusRecus.length;
      assert.equal(appuyer(gestionnaires, "Tab"), 0);
      assert.equal(focusRecus.length, focusAvantSortie);

      globalThis.document.activeElement = champ(0);
      assert.equal(appuyer(gestionnaires, "Tab", { shiftKey: true }), 0);

      globalThis.document.activeElement = champ(1);
      assert.equal(appuyer(gestionnaires, "Tab", { shiftKey: true }), 1);
      globalThis.document.activeElement = champ(0);
      appuyer(gestionnaires, "Backspace");
      assert.equal(
        focusRecus.at(-1),
        '[data-action="champ-reponse"][data-index="0"]',
      );
      cliquer(gestionnaires, "champ-reponse", undefined, undefined, "0");
    }

    const choixIds = [...application.innerHTML.matchAll(
      /data-action="choix" data-id="([^"]+)"/g,
    )].map((correspondance) => correspondance[1]);
    if (choixIds.length > 0) {
      const choixFaux = choixIds.find((id) => !["decimal-correct", "fraction-correcte"].includes(id));
      cliquer(gestionnaires, "choix", choixFaux);
    } else {
      cliquer(gestionnaires, "chiffre", undefined, "0");
    }
    if (fractionLibre) {
      cliquer(gestionnaires, "champ-reponse", undefined, undefined, "1");
      cliquer(gestionnaires, "chiffre", undefined, "1");
    }
    cliquer(gestionnaires, "valider");
    assert.match(application.innerHTML, /À revoir/);
    cliquer(gestionnaires, "suivant");
  }

  assert.match(application.innerHTML, /Ton bilan/);
  assert.match(application.innerHTML, /Fraction → décimal/);
  assert.match(application.innerHTML, /Décimal → fraction/);
  assert.match(application.innerHTML, /Aides ouvertes/);
  assert.match(application.innerHTML, /1 \/ 20/);
});

it("garde l’atelier unique de Me guider masqué avant la construction", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=fumee-masques-fractions",
  );
  await import(`./app.js?fumee=masques-fractions-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  let libreVerifiee = false;
  let inverseVerifiee = false;
  for (let index = 0; index < 20; index += 1) {
    const libre = /Toutes les fractions égales sont acceptées/.test(application.innerHTML);
    const inverse = /famille-decimal-vers-fraction/.test(application.innerHTML);
    if (libre || (inverse && !inverseVerifiee)) {
      assert.match(application.innerHTML, /class="decimal-question">[\s\S]*?mathsgo-role-unites/);
      cliquer(gestionnaires, "aide");
      const aide = extrairePanneauAide(application.innerHTML);
      assert.match(aide, /<strong>\?<\/strong>|>\?<\/text>|à la place de « \? »|fraction-empilee/);
      assert.doesNotMatch(aide, /niveau-aide-fraction|1 · Un indice|2 · Voir|3 · Construire/);
      assert.match(aide, /mathsgo-role-unites/);
      if (libre) {
        assert.match(aide, /dernier rang écrit|fraction décimale|dernier rang/);
      }
      if (inverse) {
        assert.doesNotMatch(aide, /type="range"[^>]*max="/);
      }
      cliquer(gestionnaires, "fermer-aide");
      libreVerifiee ||= libre;
      inverseVerifiee ||= inverse;
    }
    cliquer(gestionnaires, "reponse");
    cliquer(gestionnaires, "suivant");
  }
  assert.equal(libreVerifiee, true);
  assert.equal(inverseVerifiee, true);
});

it("construit six quarts jusqu’à la fusion des deux quarts restants", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-15",
  );
  await import(`./app.js?fumee=six-quarts-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="6 sur 4"/.test(html),
  );
  assert.match(application.innerHTML, /aria-label="6 sur 4"/);
  cliquer(gestionnaires, "aide");
  verifierRailAideResponsive(application.innerHTML);
  assert.match(application.innerHTML, /Tu vois d’abord 6 quarts/);
  assert.match(application.innerHTML, /etape-pieces/);
  assert.doesNotMatch(application.innerHTML, /1,5/);
  cliquer(gestionnaires, "groupe-unite-suivant");
  assert.match(application.innerHTML, /etape-groupes/);
  cliquer(gestionnaires, "groupe-unite-suivant");
  assert.match(application.innerHTML, /etape-unites/);
  assert.match(application.innerHTML, /deux quarts à réunir/);
  cliquer(gestionnaires, "groupe-unite-suivant");
  assert.match(application.innerHTML, /etape-reste/);
  assert.match(application.innerHTML, /reste-fusionne-en-demi/);
  assert.match(application.innerHTML, /Deux quarts regroupés forment un demi/);
  assert.doesNotMatch(application.innerHTML, /1,5/);
});

it("construit directement sept demis en trois unités et un demi sans livrer 3,5", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-1",
  );
  await import(`./app.js?fumee=sept-demis-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="7 sur 2"/.test(html),
  );
  assert.match(application.innerHTML, /aria-label="7 sur 2"/);
  cliquer(gestionnaires, "aide");
  let aide = application.innerHTML.match(/<aside class="panneau panneau-aide[\s\S]*?<\/aside>/)?.[0] ?? "";
  assert.match(aide, /Tu vois d’abord 7 demis/);
  assert.match(aide, /etape-pieces/);
  assert.doesNotMatch(aide, /3,5/);

  cliquer(gestionnaires, "groupe-unite-suivant");
  aide = application.innerHTML.match(/<aside class="panneau panneau-aide[\s\S]*?<\/aside>/)?.[0] ?? "";
  assert.match(aide, /etape-groupes/);
  assert.match(aide, /7 sur 2 égale 6 sur 2 plus 1 sur 2 égale \?/);
  assert.doesNotMatch(aide, /3,5/);

  cliquer(gestionnaires, "groupe-unite-suivant");
  aide = application.innerHTML.match(/<aside class="panneau panneau-aide[\s\S]*?<\/aside>/)?.[0] ?? "";
  assert.match(aide, /etape-unites/);
  assert.match(aide, /7 sur 2 égale 6 sur 2 plus 1 sur 2 égale 3 plus 1 sur 2 égale \?/);
  assert.match(aide, /3 unités complètes et 1 demi/);
  assert.doesNotMatch(aide, /3,5/);
});

it("ne révèle jamais le numérateur d’une fraction impropre à construire en NC-04", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-1",
  );
  await import(`./app.js?fumee=inverse-impropre-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="2,5"/.test(html) && /aria-label="case sur 2"/.test(html),
  );
  assert.match(application.innerHTML, /2,5/);
  assert.match(application.innerHTML, /aria-label="case sur 2"/);
  cliquer(gestionnaires, "aide");
  for (let index = 0; index < 5; index += 1) {
    cliquer(gestionnaires, "pas-fraction-suivant");
  }
  assert.match(application.innerHTML, /Tu as posé les pièces jusqu’au point décimal donné/);
  assert.doesNotMatch(application.innerHTML, /5 sur 2/);
  assert.doesNotMatch(application.innerHTML, /Les 5 demis/);
  assert.match(application.innerHTML, /Toutes les pièces posées sont encore séparées/);
  cliquer(gestionnaires, "groupe-unite-suivant");
  cliquer(gestionnaires, "groupe-unite-suivant");
  const aide = application.innerHTML.match(/<aside class="panneau panneau-aide[\s\S]*?<\/aside>/)?.[0] ?? "";
  assert.match(aide, /2,5 égale 2 plus 1 sur 2 égale \? sur 2/);
  assert.doesNotMatch(aide, /5 sur 2/);
});

it("fait construire 0,5 avec les dixièmes puis la bande d’un demi sans livrer la fraction", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=qa-app-scenario-2",
  );
  await import(`./app.js?fumee=demi-dixiemes-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="0,5"/.test(html)
      && /Toutes les fractions égales sont acceptées/.test(html),
  );
  assert.match(application.innerHTML, /0,5/);
  assert.match(application.innerHTML, /Toutes les fractions égales sont acceptées/);
  cliquer(gestionnaires, "aide");
  cliquer(
    gestionnaires,
    "rang-fraction",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "dixiemes",
  );
  assert.match(application.innerHTML, /cd-bande-dixieme/);
  assert.doesNotMatch(application.innerHTML, /0,5 égale 5 sur 10|5 sur 10 égale 1 sur 2/);
  cliquer(
    gestionnaires,
    "correspondance-suivante",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "2",
  );
  assert.match(application.innerHTML, /cd-demi-sur-rail/);
  cliquer(
    gestionnaires,
    "correspondance-suivante",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "2",
  );
  assert.match(application.innerHTML, /cd-empreinte-dixiemes/);
  assert.match(application.innerHTML, /fraction-empilee/);
  assert.doesNotMatch(application.innerHTML, /0,5 égale 5 sur 10|5 sur 10 égale 1 sur 2/);
});

it("fait réorganiser 0,75 des lignes aux quadrants puis à la comparaison sans livrer l’égalité", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=fractions-simples-decimaux&mode=tableau&questions=20&graine=first-nc04-v4-245",
  );
  await import(`./app.js?fumee=trois-quarts-centiemes-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  avancerJusquaQuestion(
    application,
    gestionnaires,
    (html) => /aria-label="0,75"/.test(html)
      && /Toutes les fractions égales sont acceptées/.test(html),
  );
  assert.match(application.innerHTML, /0,75/);
  assert.match(application.innerHTML, /Toutes les fractions égales sont acceptées/);
  cliquer(gestionnaires, "aide");
  cliquer(
    gestionnaires,
    "rang-fraction",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "centiemes",
  );

  let aide = application.innerHTML.match(/<aside class="panneau panneau-aide[\s\S]*?<\/aside>/)?.[0] ?? "";
  assert.match(aide, /data-objet="reorganisation-centiemes" data-centiemes="75"[^>]*data-etape="lignes"/);
  assert.match(aide, /cd-disposition-lignes/);
  assert.match(aide, /data-afficher-ecritures="false"/);
  assert.doesNotMatch(aide, /0,75 égale 75 sur 100|75 sur 100 égale 3 sur 4/);

  cliquer(
    gestionnaires,
    "correspondance-suivante",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "2",
  );
  aide = application.innerHTML.match(/<aside class="panneau panneau-aide[\s\S]*?<\/aside>/)?.[0] ?? "";
  assert.match(aide, /data-etape="quadrants"/);
  assert.match(aide, /cd-disposition-quadrants/);
  assert.match(aide, /data-afficher-ecritures="false"/);
  assert.doesNotMatch(aide, /0,75 égale 75 sur 100|75 sur 100 égale 3 sur 4/);

  cliquer(
    gestionnaires,
    "correspondance-suivante",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "2",
  );
  aide = application.innerHTML.match(/<aside class="panneau panneau-aide[\s\S]*?<\/aside>/)?.[0] ?? "";
  assert.match(aide, /data-etape="comparaison"/);
  assert.match(aide, /cd-disposition-lignes/);
  assert.match(aide, /cd-disposition-quadrants/);
  assert.match(aide, /figure-correspondance-libre/);
  verifierRailAideResponsive(aide);
  assert.match(aide, /data-afficher-ecritures="false"/);
  assert.doesNotMatch(aide, /0,75 égale 75 sur 100|75 sur 100 égale 3 sur 4/);
});

it("propose le parcours DNB puis lance Au tableau sans saisie ni score", async () => {
  const { application, gestionnaires } = installerFauxNavigateur("");
  await import(`./app.js?fumee=menu-${Date.now()}`);

  assert.match(application.innerHTML, /class="menu-v10"/);
  assert.match(application.innerHTML, /Automatismes<span class="title-cycle">DNB/);
  assert.match(application.innerHTML, /Préparer la série/);
  assert.match(application.innerHTML, /S'entraîner/);
  assert.match(application.innerHTML, /Au tableau/);
  assert.match(application.innerHTML, /Choisir les automatismes/);
  assert.match(application.innerHTML, /Nombres et calculs/);
  assert.match(application.innerHTML, /M7\.5 11\.5h21M7\.5 18h21M7\.5 24\.5h21/);
  assert.match(application.innerHTML, /aria-label="Épreuve DNB sans calculatrice"/);
  assert.match(application.innerHTML, /class="dnb-launch-icon"/);
  assert.match(application.innerHTML, /M3\.6 21\.4 20\.4 2\.6/);
  assert.match(application.innerHTML, /Critères de divisibilité/);
  assert.match(application.innerHTML, /Carrés des entiers/);
  assert.match(application.innerHTML, /Fractions simples et décimaux/);
  assert.match(application.innerHTML, /0 \/ 3/);
  assert.match(application.innerHTML, /Choisis au moins un automatisme/);
  assert.match(application.innerHTML, /data-action="preparer" disabled/);
  assert.equal(
    [...application.innerHTML.matchAll(/class="modrow is-selected"/g)].length,
    0,
  );
  assert.doesNotMatch(application.innerHTML, /Solides usuels|Calculer un volume/);
  assert.doesNotMatch(application.innerHTML, /Avec aide|Sans aide|Diaporama|Crédits et remerciements|Ouvrir une série/);
  for (const volume of [5, 10, 15, 20]) {
    assert.match(application.innerHTML, new RegExp(`data-value="${volume}"`));
  }

  cliquer(gestionnaires, "choisir-notion", undefined, "criteres-divisibilite");
  assert.match(application.innerHTML, /1 \/ 3/);
  assert.doesNotMatch(application.innerHTML, /data-action="preparer" disabled/);
  assert.equal(
    [...application.innerHTML.matchAll(/class="modrow is-selected"/g)].length,
    1,
  );
  cliquer(gestionnaires, "choisir-mode", undefined, "tableau");
  cliquer(gestionnaires, "choisir-volume", undefined, "15");
  assert.match(application.innerHTML, /15 questions/);
  cliquer(gestionnaires, "preparer");
  assert.match(application.innerHTML, /Prêt pour la classe/);
  assert.match(application.innerHTML, /15 questions/);
  assert.doesNotMatch(application.innerHTML, /aide accessible|correction expliquée|Chiffre des unités<\/strong>|Somme de tous les chiffres<\/strong>|pastille-mode/);
  cliquer(gestionnaires, "cours");
  assert.match(application.innerHTML, /cours-pret-ouvert/);
  assert.match(application.innerHTML, /1 \/ 3/);
  cliquer(gestionnaires, "fermer-cours");
  cliquer(gestionnaires, "demarrer");

  assert.match(application.innerHTML, /Au tableau/);
  assert.doesNotMatch(application.innerHTML, /class="score"/);
  assert.doesNotMatch(application.innerHTML, /data-action="choix"/);
  assert.doesNotMatch(application.innerHTML, /data-action="valider"/);
  assert.match(application.innerHTML, /Afficher la réponse/);

  cliquer(gestionnaires, "menu");
  assert.match(application.innerHTML, /Série en cours/);
  assert.match(application.innerHTML, /Continuer la série/);
  cliquer(gestionnaires, "fermer-menu");
  cliquer(gestionnaires, "reponse");
  assert.match(application.innerHTML, /Réponse affichée/);
});

it("conserve la notion demandée par un lien direct", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=carres-entiers-0-a-12&questions=5&graine=lien-direct",
  );
  await import(`./app.js?fumee=lien-direct-${Date.now()}`);

  assert.match(application.innerHTML, /Prêt à t'entraîner/);
  assert.match(application.innerHTML, /Carrés des entiers de 0 à 12/);
  cliquer(gestionnaires, "retour-menu");
  assert.match(
    application.innerHTML,
    /data-value="carres-entiers-0-a-12"\s+checked/,
  );
  assert.equal(
    [...application.innerHTML.matchAll(/class="modrow is-selected"/g)].length,
    1,
  );
});

it("sélectionne, révise et rejoue plusieurs automatismes dans une même série", async () => {
  const { application, gestionnaires } = installerFauxNavigateur("");
  await import(`./app.js?fumee=multi-${Date.now()}`);

  assert.match(application.innerHTML, /Choisis au moins un automatisme/);
  assert.match(application.innerHTML, /data-action="preparer" disabled/);
  assert.equal(
    [...application.innerHTML.matchAll(/class="modrow is-selected"/g)].length,
    0,
  );
  cliquer(gestionnaires, "choisir-notion", undefined, "criteres-divisibilite");
  cliquer(gestionnaires, "choisir-notion", undefined, "carres-entiers-0-a-12");
  assert.match(application.innerHTML, /2 \/ 3 <span class="theme-count-label">sélectionnés/);
  assert.match(application.innerHTML, /2 automatismes sélectionnés/);
  assert.match(
    application.innerHTML,
    /data-value="criteres-divisibilite"\s+checked/,
  );
  assert.match(
    application.innerHTML,
    /data-value="carres-entiers-0-a-12"\s+checked/,
  );
  assert.equal(
    [...application.innerHTML.matchAll(/class="modrow is-selected"/g)].length,
    2,
  );

  cliquer(gestionnaires, "choisir-volume", undefined, "5");
  assert.match(application.innerHTML, /5 questions · répartition 3 \+ 2/);
  cliquer(gestionnaires, "preparer");
  assert.match(application.innerHTML, /2 automatismes sélectionnés/);
  assert.match(application.innerHTML, /Critères de divisibilité/);
  assert.match(application.innerHTML, /Carrés des entiers de 0 à 12/);
  assert.match(application.innerHTML, /Voir les cours/);

  cliquer(
    gestionnaires,
    "cours-notion",
    undefined,
    undefined,
    undefined,
    "carres-entiers-0-a-12",
  );
  assert.match(application.innerHTML, /Comprendre « au carré »/);
  assert.match(application.innerHTML, /1 \/ 5/);
  cliquer(gestionnaires, "fermer-cours");
  cliquer(
    gestionnaires,
    "cours-notion",
    undefined,
    undefined,
    undefined,
    "criteres-divisibilite",
  );
  assert.match(application.innerHTML, /Comprendre « divisible »/);
  assert.match(application.innerHTML, /1 \/ 3/);
  cliquer(gestionnaires, "fermer-cours");
  cliquer(gestionnaires, "demarrer");

  const notionsVues = new Set();
  for (let index = 0; index < 5; index += 1) {
    const estCarres = application.innerHTML.includes(
      '<p class="etiquette-notion">Carrés des entiers de 0 à 12</p>',
    );
    const notion = estCarres ? "carres" : "divisibilite";
    notionsVues.add(notion);

    cliquer(gestionnaires, "aide");
    assert.match(application.innerHTML, /Me guider/);
    cliquer(gestionnaires, "cours");
    assert.match(
      application.innerHTML,
      estCarres ? /Comprendre « au carré »/ : /Comprendre « divisible »/,
    );
    cliquer(gestionnaires, "fermer-cours");

    const champs = [...application.innerHTML.matchAll(
      /data-action="champ-reponse" data-index="(\d+)"/g,
    )].map((correspondance) => correspondance[1]);
    if (champs.length === 2) {
      for (const champ of champs) {
        cliquer(gestionnaires, "champ-reponse", undefined, undefined, champ);
        cliquer(gestionnaires, "chiffre", undefined, "0");
      }
    } else if (application.innerHTML.includes('data-action="chiffre"')) {
      cliquer(gestionnaires, "chiffre", undefined, "0");
    } else {
      const choix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
      assert.ok(choix);
      cliquer(gestionnaires, "choix", choix);
    }
    cliquer(gestionnaires, "valider");
    cliquer(gestionnaires, "correction");
    assert.match(application.innerHTML, /Correction expliquée/);
    cliquer(gestionnaires, "fermer-correction");
    cliquer(gestionnaires, "suivant");
  }

  assert.deepEqual([...notionsVues].sort(), ["carres", "divisibilite"]);
  assert.match(application.innerHTML, /2 automatismes révisés/);
  assert.match(application.innerHTML, /Critères de divisibilité/);
  assert.match(application.innerHTML, /Carrés des entiers de 0 à 12/);
  cliquer(gestionnaires, "recommencer");
  assert.match(application.innerHTML, /2 automatismes sélectionnés/);
  assert.match(application.innerHTML, /répartition 3 \+ 2/);
});

it("parcourt les cinq familles NC-01, leur aide, leur réponse et leur correction", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=20&graine=a",
  );
  await import(`./app.js?fumee=cinq-familles-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  const familles = new Set();
  const famillesAvecSomme = new Set();
  for (let index = 0; index < 20; index += 1) {
    const famille = application.innerHTML.match(/famille-([a-z-]+)"/)?.[1];
    assert.ok(famille, `famille absente à la question ${index + 1}`);
    familles.add(famille);

    const nombresF3 = famille === "selection-nombres"
      ? [...application.innerHTML.matchAll(/data-id="nombre-(\d+)"/g)]
        .map((correspondance) => correspondance[1])
      : [];
    if (famille === "selection-nombres") assert.equal(nombresF3.length, 4);

    cliquer(gestionnaires, "aide");
    assert.match(application.innerHTML, /Me guider/);
    assert.match(application.innerHTML, /Critère par (?:2|3|5|9|10)/);
    for (const nombre of nombresF3) {
      assert.match(application.innerHTML, new RegExp(`>${nombre}<`));
    }
    const chiffresGuidage = [...application.innerHTML.matchAll(
      /data-action="chiffre-aide" data-index="(\d+)"[^>]*>(\d)<\/button>/g,
    )].map((correspondance) => ({ index: correspondance[1], chiffre: Number(correspondance[2]) }));
    if (chiffresGuidage.length > 0) {
      famillesAvecSomme.add(famille);
      const cadreSomme = application.innerHTML.match(
        /<section class="outil-aide outil-somme">([\s\S]*?)<\/section>/,
      )?.[1];
      assert.ok(cadreSomme, `cadre de somme absent pour ${famille}`);
      assert.match(cadreSomme, /Critère par (?:3|9)/);
      assert.match(application.innerHTML, /= □<\/output>/);
      for (const { index: indexChiffre } of chiffresGuidage) {
        cliquer(gestionnaires, "chiffre-aide", undefined, undefined, indexChiffre);
      }
      const sommeGuidage = chiffresGuidage.reduce((total, { chiffre }) => total + chiffre, 0);
      assert.match(application.innerHTML, new RegExp(`= ${sommeGuidage}<\\/output>`));
    }
    if (famille === "selection-diviseurs") {
      for (const critere of [2, 3, 5, 9, 10]) {
        assert.match(application.innerHTML, new RegExp(`Critère par ${critere}`));
      }
      const cadreSomme = application.innerHTML.match(
        /<section class="outil-aide outil-somme">([\s\S]*?)<\/section>/,
      )?.[1];
      assert.match(cadreSomme, /Critère par 3/);
      assert.match(cadreSomme, /Critère par 9/);
    }
    cliquer(gestionnaires, "fermer-aide");

    if (famille === "partage-court" && application.innerHTML.includes('data-id="oui"')) {
      assert.match(application.innerHTML, /grille-partage grille-oui-non/);
    }

    if (application.innerHTML.includes('data-action="chiffre"')) {
      cliquer(gestionnaires, "chiffre", undefined, "0");
    } else {
      const choix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
      assert.ok(choix);
      cliquer(gestionnaires, "choix", choix);
    }
    cliquer(gestionnaires, "valider");
    cliquer(gestionnaires, "correction");
    assert.match(application.innerHTML, /Correction expliquée/);
    if (famille === "selection-diviseurs") {
      assert.equal(
        [...application.innerHTML.matchAll(/class="explication-criteres-correction"/g)].length,
        2,
      );
      for (const critere of [2, 3, 5, 9, 10]) {
        assert.match(application.innerHTML, new RegExp(`<strong>Par ${critere} :<\\/strong>`));
      }
    }
    cliquer(gestionnaires, "fermer-correction");
    cliquer(gestionnaires, "suivant");
  }

  assert.deepEqual([...familles].sort(), [
    "chiffre-manquant",
    "critere-precis",
    "partage-court",
    "selection-diviseurs",
    "selection-nombres",
  ]);
  assert.deepEqual([...famillesAvecSomme].sort(), [
    "critere-precis",
    "partage-court",
    "selection-diviseurs",
  ]);
  assert.match(application.innerHTML, /Ton bilan/);
  assert.match(application.innerHTML, /Pour confirmer la maîtrise/);
  assert.match(application.innerHTML, /data-action="nouvelle-serie">Nouvelle série/);
  assert.match(application.innerHTML, /data-action="recommencer">Refaire la même série/);
  assert.match(application.innerHTML, /data-action="retour-menu">Choisir une autre série/);
});

it("place une réponse unique dans la case du chiffre manquant", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=10&graine=inline-0",
  );
  await import(`./app.js?fumee=chiffre-inline-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  for (let index = 0; index < 10; index += 1) {
    const famille = application.innerHTML.match(/famille-([a-z-]+)"/)?.[1];
    if (famille === "chiffre-manquant") break;
    if (application.innerHTML.includes('data-action="chiffre"')) {
      cliquer(gestionnaires, "chiffre", undefined, "0");
    } else {
      const choix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
      assert.ok(choix);
      cliquer(gestionnaires, "choix", choix);
    }
    cliquer(gestionnaires, "valider");
    cliquer(gestionnaires, "suivant");
  }

  assert.match(application.innerHTML, /famille-chiffre-manquant/);
  assert.match(application.innerHTML, /<output class="case-chiffre-manquant "/);
  assert.doesNotMatch(application.innerHTML, /class="afficheur-reponse/);
  cliquer(gestionnaires, "chiffre", undefined, "5");
  assert.match(application.innerHTML, /<output class="case-chiffre-manquant remplie"[^>]*>5<\/output>/);
});

it("conserve le carré dans une question à plusieurs chiffres possibles", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=10&graine=multi-6",
  );
  await import(`./app.js?fumee=chiffre-multiple-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  for (let index = 0; index < 10; index += 1) {
    const famille = application.innerHTML.match(/famille-([a-z-]+)"/)?.[1];
    if (famille === "chiffre-manquant") break;
    if (application.innerHTML.includes('data-action="chiffre"')) {
      cliquer(gestionnaires, "chiffre", undefined, "0");
    } else {
      const choix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
      assert.ok(choix);
      cliquer(gestionnaires, "choix", choix);
    }
    cliquer(gestionnaires, "valider");
    cliquer(gestionnaires, "suivant");
  }

  assert.match(application.innerHTML, /famille-chiffre-manquant/);
  assert.match(application.innerHTML, /class="symbole-chiffre-manquant"[^>]*>□<\/span>/);
  assert.doesNotMatch(application.innerHTML, /class="case-chiffre-manquant/);
});

it("révèle dans la case la réponse au chiffre manquant en mode Au tableau", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?mode=tableau&notion=criteres-divisibilite&questions=10&graine=inline-0",
  );
  await import(`./app.js?fumee=chiffre-tableau-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  for (let index = 0; index < 10; index += 1) {
    if (application.innerHTML.includes("famille-chiffre-manquant")
      && application.innerHTML.includes('class="case-chiffre-manquant ')) break;
    cliquer(gestionnaires, "reponse");
    cliquer(gestionnaires, "suivant");
  }

  assert.match(application.innerHTML, /famille-chiffre-manquant/);
  assert.match(application.innerHTML, /<output class="case-chiffre-manquant "[^>]*><\/output>/);
  cliquer(gestionnaires, "reponse");
  assert.match(application.innerHTML, /<output class="case-chiffre-manquant remplie"[^>]*>[0-9]<\/output>/);
});

it("distingue refaire la même série et générer une nouvelle série", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=1&graine=bilan-actions",
  );
  await import(`./app.js?fumee=bilan-actions-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  const premiereQuestion = application.innerHTML;
  const choix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
  assert.ok(choix);
  cliquer(gestionnaires, "choix", choix);
  cliquer(gestionnaires, "valider");
  cliquer(gestionnaires, "suivant");

  cliquer(gestionnaires, "recommencer");
  cliquer(gestionnaires, "demarrer");
  assert.equal(application.innerHTML, premiereQuestion);

  const choixRejoue = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
  cliquer(gestionnaires, "choix", choixRejoue);
  cliquer(gestionnaires, "valider");
  cliquer(gestionnaires, "suivant");
  cliquer(gestionnaires, "nouvelle-serie");
  cliquer(gestionnaires, "demarrer");
  assert.notEqual(application.innerHTML, premiereQuestion);
});

it("rend les solides, les trois volumes, leurs aides et leurs cours sans erreur", async () => {
  const notions = ["solides-usuels", "volume-cube-pave", "volume-prisme", "volume-cylindre"];
  for (const notion of notions) {
    const { application, gestionnaires } = installerFauxNavigateur(
      `?notion=${notion}&questions=2&graine=fumee-${notion}`,
    );
    await import(`./app.js?fumee=${notion}-${Date.now()}`);
    cliquer(gestionnaires, "demarrer");
    assert.match(application.innerHTML, /<svg/);
    assert.match(application.innerHTML, /Choisis une seule réponse|Calcul mental, sans calculatrice/);

    cliquer(gestionnaires, "aide");
    assert.match(application.innerHTML, /Solide tournable/);

    cliquer(gestionnaires, "cours");
    if (notion === "solides-usuels") {
      assert.match(application.innerHTML, /Les six solides à reconnaître/);
    } else {
      assert.match(application.innerHTML, /Du cube unité à la formule/);
      assert.match(application.innerHTML, /Empilement de 3 fois 2 fois 2 cubes unité/);
      assert.match(application.innerHTML, /1 cm³/);
    }
  }
});
