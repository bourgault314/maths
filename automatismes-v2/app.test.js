import assert from "node:assert/strict";
import { it } from "node:test";

function installerFauxNavigateur(recherche) {
  const gestionnaires = new Map();
  const focusRecus = [];
  const application = {
    innerHTML: "",
    addEventListener(type, gestionnaire) {
      if (!gestionnaires.has(type)) gestionnaires.set(type, []);
      gestionnaires.get(type).push(gestionnaire);
    },
    querySelector(selecteur) {
      return { focus() { focusRecus.push(selecteur); } };
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
  return { application, gestionnaires, focusRecus };
}

function cliquer(gestionnaires, action, id, value) {
  const cible = {
    dataset: { action, id, value },
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
  const { application, gestionnaires, focusRecus } = installerFauxNavigateur(
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
  assert.match(application.innerHTML, /Les critères de divisibilité/);
  assert.match(application.innerHTML, /1 \/ 4/);
  assert.match(application.innerHTML, /12 = 3 × 4 \+ 0/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /2 \/ 4/);
  assert.match(application.innerHTML, /23<strong>0/);
  assert.match(application.innerHTML, /23<strong>5/);
  assert.match(application.innerHTML, /23<strong>6/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /3 \/ 4/);
  assert.match(application.innerHTML, /372/);
  assert.match(application.innerHTML, /729/);
  cliquer(gestionnaires, "cours-suivant");
  assert.match(application.innerHTML, /4 \/ 4/);
  assert.match(application.innerHTML, /divisible par 10/);
  assert.doesNotMatch(application.innerHTML, /Série en cours/);
  cliquer(gestionnaires, "fermer-cours");
  const premierChoix = application.innerHTML.match(/data-action="choix" data-id="([^"]+)"/)?.[1];
  assert.ok(premierChoix);
  cliquer(gestionnaires, "choix", premierChoix);
  cliquer(gestionnaires, "valider");
  cliquer(gestionnaires, "correction");
  assert.match(application.innerHTML, /Correction expliquée/);
  appuyer(gestionnaires, "Escape");
  assert.doesNotMatch(application.innerHTML, /Correction expliquée/);
  assert.equal(focusRecus.at(-1), '[data-action="correction"]');
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

it("parcourt les six familles NC-01, leur aide, leur réponse et leur correction", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=10&graine=fumee-six-familles",
  );
  await import(`./app.js?fumee=six-familles-${Date.now()}`);
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
    if (famille === "selection-nombres") assert.equal(nombresF3.length, 6);

    cliquer(gestionnaires, "aide");
    assert.match(application.innerHTML, /Me guider/);
    for (const nombre of nombresF3) {
      assert.match(application.innerHTML, new RegExp(`>${nombre}<`));
    }
    cliquer(gestionnaires, "fermer-aide");

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
    "affirmation-divisibilite",
    "chiffre-manquant",
    "critere-precis",
    "partage-court",
    "selection-diviseurs",
    "selection-nombres",
  ]);
  assert.match(application.innerHTML, /Ton bilan/);
  assert.match(application.innerHTML, /Pour confirmer la maîtrise/);
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
