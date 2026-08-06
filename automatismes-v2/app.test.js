import assert from "node:assert/strict";
import { it } from "node:test";

function installerFauxNavigateur(recherche) {
  const gestionnaires = new Map();
  const focusRecus = [];
  const optionsFocus = [];
  const corpsPanneau = { scrollTop: 0 };
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
      zoneQuestion.scrollTop = 0;
    },
    addEventListener(type, gestionnaire) {
      if (!gestionnaires.has(type)) gestionnaires.set(type, []);
      gestionnaires.get(type).push(gestionnaire);
    },
    querySelector(selecteur) {
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
    documentElement: { style: { setProperty() {} } },
    querySelector() { return application; },
  };
  globalThis.requestAnimationFrame = (rappel) => rappel();
  return { application, gestionnaires, focusRecus, optionsFocus, panneau, corpsPanneau, zoneQuestion };
}

function cliquer(gestionnaires, action, id, value, index) {
  const cible = {
    dataset: { action, id, value, index },
    closest(selecteur) { return selecteur === "[data-action]" ? this : null; },
  };
  gestionnaires.get("click")[0]({ target: cible });
}

function appuyer(gestionnaires, key) {
  for (const gestionnaire of gestionnaires.get("keydown") ?? []) {
    gestionnaire({ key });
  }
}

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
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /2 \/ 3/);
  assert.match(application.innerHTML, /Critères pour 2, 5 et 10/);
  assert.match(application.innerHTML, /chiffre des unités/);
  assert.match(application.innerHTML, /aria-label="230, chiffre des unités 0"/);
  assert.match(application.innerHTML, /<span>2<\/span><span>3<\/span><b class="chiffre-unite-encadre">0<\/b>/);
  assert.match(application.innerHTML, /aria-label="235, chiffre des unités 5"/);
  assert.match(application.innerHTML, /aria-label="236, chiffre des unités 6"/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /3 \/ 3/);
  assert.match(application.innerHTML, /Critères pour 3 et 9/);
  assert.match(application.innerHTML, /372/);
  assert.match(application.innerHTML, /729/);
  assert.doesNotMatch(application.innerHTML, /implique|Une idée à la fois/);
  assert.doesNotMatch(application.innerHTML, /Série en cours/);
  cliquer(gestionnaires, "fermer-cours");
  const premierChoix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
  assert.ok(premierChoix);
  zoneQuestion.scrollTop = 120;
  cliquer(gestionnaires, "choix", premierChoix);
  assert.equal(zoneQuestion.scrollTop, 120);
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
  assert.doesNotMatch(application.innerHTML, /Solides usuels|Calculer un volume/);
  assert.doesNotMatch(application.innerHTML, /Avec aide|Sans aide|Diaporama|Crédits et remerciements|Ouvrir une série/);
  for (const volume of [5, 10, 15, 20]) {
    assert.match(application.innerHTML, new RegExp(`data-value="${volume}"`));
  }

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

it("parcourt les cinq familles NC-01, leur aide, leur réponse et leur correction", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=10&graine=fumee-cinq-familles",
  );
  await import(`./app.js?fumee=cinq-familles-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");

  const familles = new Set();
  for (let index = 0; index < 10; index += 1) {
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
    "?notion=criteres-divisibilite&questions=10&graine=multi-0",
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
