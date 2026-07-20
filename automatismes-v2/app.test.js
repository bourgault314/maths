import assert from "node:assert/strict";
import { it } from "node:test";

function installerFauxNavigateur(recherche, largeur = 1024, hauteur = 768) {
  const gestionnaires = new Map();
  const application = {
    innerHTML: "",
    addEventListener(type, gestionnaire) {
      if (!gestionnaires.has(type)) gestionnaires.set(type, []);
      gestionnaires.get(type).push(gestionnaire);
    },
    querySelector() {
      return { focus() {} };
    },
  };
  globalThis.window = { location: { search: recherche }, innerWidth: largeur, innerHeight: hauteur };
  globalThis.document = {
    title: "",
    documentElement: { style: { setProperty() {} } },
    querySelector() { return application; },
  };
  globalThis.requestAnimationFrame = (rappel) => rappel();
  return { application, gestionnaires };
}

function cliquer(gestionnaires, action, id) {
  const cible = {
    dataset: { action, id },
    closest(selecteur) { return selecteur === "[data-action]" ? this : null; },
  };
  gestionnaires.get("click")[0]({ target: cible });
}

it("rend NC-01 depuis le registre et conserve son aide et sa correction", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=1&graine=fumee-registre",
  );
  await import(`./app.js?fumee=divisibilite-${Date.now()}`);
  assert.match(application.innerHTML, /Critères de divisibilité/);
  assert.match(application.innerHTML, /disposition-ordinateur/);
  cliquer(gestionnaires, "demarrer");
  assert.match(application.innerHTML, /Critères de divisibilité/);

  cliquer(gestionnaires, "aide");
  assert.match(application.innerHTML, /Un coup de pouce/);
  cliquer(gestionnaires, "fermer-aide");
  cliquer(gestionnaires, "choix", "aucun");
  cliquer(gestionnaires, "valider");
  cliquer(gestionnaires, "correction");
  assert.match(application.innerHTML, /Correction expliquée/);
});

it("choisit les compositions téléphone et TNI depuis le même lecteur", async () => {
  const telephone = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=1&graine=fumee-telephone",
    390,
  );
  await import(`./app.js?fumee=telephone-${Date.now()}`);
  assert.match(telephone.application.innerHTML, /disposition-telephone/);

  const tni = installerFauxNavigateur(
    "?mode=diaporama&notion=criteres-divisibilite&questions=1&graine=fumee-tni",
    1920,
  );
  await import(`./app.js?fumee=tni-${Date.now()}`);
  assert.match(tni.application.innerHTML, /disposition-tni/);

  const tniCompact = installerFauxNavigateur(
    "?mode=diaporama&notion=criteres-divisibilite&questions=1&graine=fumee-tni-compact",
    1280,
    720,
  );
  await import(`./app.js?fumee=tni-compact-${Date.now()}`);
  assert.match(tniCompact.application.innerHTML, /tni-compacte/);
});

it("réserve toujours le retour accessible et sépare les commandes élève", async () => {
  const { application, gestionnaires } = installerFauxNavigateur(
    "?notion=criteres-divisibilite&questions=1&graine=fumee-retour-stable",
    375,
    812,
  );
  await import(`./app.js?fumee=retour-stable-${Date.now()}`);
  cliquer(gestionnaires, "demarrer");
  assert.match(application.innerHTML, /class="zone-retour" aria-live="polite" aria-atomic="true"/);
  assert.match(application.innerHTML, /class="zone-commandes-eleve"/);
  assert.match(application.innerHTML, /data-action="valider"/);

  cliquer(gestionnaires, "valider");
  assert.match(application.innerHTML, /role="alert"/);
  assert.match(application.innerHTML, /class="zone-commandes-eleve"/);
  assert.match(application.innerHTML, /data-action="valider"/);
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
