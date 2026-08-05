import {
  COULEURS,
  RAYONS,
  TYPOGRAPHIE,
} from "../packages/charte/src/charte.js";
import {
  basculerChiffreAide,
  basculerChoix,
  basculerUniteAide,
  creerEtatLecteur,
  demarrer,
  effacerSaisie,
  fermerAide,
  fermerCorrection,
  fermerCours,
  lireConfiguration,
  nombreReussites,
  NOTION_NC01,
  ouvrirAide,
  ouvrirCorrection,
  ouvrirCours,
  passerQuestionSuivante,
  questionCourante,
  recommencer,
  revelerReponse,
  saisirChiffre,
  tournerSolide,
  validerReponse,
} from "./src/etat-lecteur.js?v=9";
import { TYPE_REPONSE_ENTIER_NATUREL } from "../packages/contrats/src/question-v2.js?v=9";
import {
  obtenirNotionLecteur,
  RENDU_DIVISIBILITE,
  RENDU_SOLIDE,
  RENDU_VOLUME,
} from "./src/registre-lecteur.js?v=9";
import { COURS_SOLIDES_USUELS } from "../packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js?v=9";
import {
  creerCone,
  creerCube,
  creerCylindre,
  creerPave,
  creerPrisme,
  creerPyramide,
  dessinerSolide,
} from "../packages/objets/src/solides.js";

const application = document.querySelector("#application");
const rechercheInitiale = window.location.search;
let etat = creerEtatLecteur(lireConfiguration(rechercheInitiale));
let menuAccueilOuvert = rechercheInitiale.length === 0;
let menuSessionOuvert = false;
let pageCoursDivisibilite = 0;
let configurationMenu = {
  mode: "entrainement",
  aide: "disponible",
  nombreQuestions: 10,
  notion: NOTION_NC01,
};

const VOLUMES_MENU = Object.freeze([5, 10, 15, 20]);

const DOMAINES_MENU = Object.freeze([
  Object.freeze({
    id: "nombres-calculs",
    nom: "Nombres et calculs",
    notions: Object.freeze([NOTION_NC01]),
  }),
  Object.freeze({ id: "calcul-litteral-algebre", nom: "Calcul littéral et algèbre", notions: Object.freeze([]) }),
  Object.freeze({ id: "proportionnalite-fonctions-grandeurs", nom: "Proportionnalité, fonctions et grandeurs", notions: Object.freeze([]) }),
  Object.freeze({ id: "espace-geometrie", nom: "Espace et géométrie", notions: Object.freeze([]) }),
  Object.freeze({ id: "donnees-statistiques-probabilites", nom: "Données, statistiques et probabilités", notions: Object.freeze([]) }),
  Object.freeze({ id: "pensee-informatique", nom: "Pensée informatique", notions: Object.freeze([]) }),
]);

function definitionNotion() {
  return obtenirNotionLecteur(etat.configuration.notion);
}

function nomNotion() {
  return definitionNotion().nom;
}

function estEntrainement() {
  return etat.configuration.mode === "entrainement";
}

function aCoursNotion() {
  return definitionNotion().capacites.cours;
}

const nomsCouleurs = {
  bleu: COULEURS.bleu,
  bleuFonce: COULEURS.bleuFonce,
  turquoise: COULEURS.turquoise,
  orange: COULEURS.orange,
  encre: COULEURS.encre,
  texteAttenue: COULEURS.texteAttenue,
  page: COULEURS.page,
  papier: COULEURS.papier,
  fondDoux: COULEURS.fondDoux,
  ligne: COULEURS.ligne,
  reussite: COULEURS.reussite,
  erreur: COULEURS.erreur,
  attention: COULEURS.attention,
};
for (const [nom, valeur] of Object.entries(nomsCouleurs)) {
  document.documentElement.style.setProperty(`--mg-${nom}`, valeur);
}
document.documentElement.style.setProperty("--mg-titres", TYPOGRAPHIE.titres);
document.documentElement.style.setProperty("--mg-texte", TYPOGRAPHIE.texte);
document.documentElement.style.setProperty("--mg-rayon-petit", `${RAYONS.petit}px`);
document.documentElement.style.setProperty("--mg-rayon-moyen", `${RAYONS.moyen}px`);
document.documentElement.style.setProperty("--mg-rayon-grand", `${RAYONS.grand}px`);

function echapper(valeur) {
  return String(valeur)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function texteAide() {
  const libelles = {
    ouverte: "aide affichée",
    disponible: "aide accessible",
    indisponible: "sans aide",
  };
  return libelles[etat.configuration.aide];
}

function libelleMode(mode = etat.configuration.mode) {
  return mode === "tableau" ? "Au tableau" : "S'entraîner";
}

function rendreMarque() {
  return `<a class="marque marque-officielle" href="/" aria-label="Accueil maths&go">
    <img src="/assets/img/mathsgo-logo-390.png" alt="maths&go" width="390" height="181">
  </a>`;
}

function rendreIconeNombresCalculs() {
  return `<svg viewBox="0 0 36 36" focusable="false">
    <rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#fffaf3" stroke="#173a5e" stroke-width="1.3"/>
    <g fill="none" stroke="#aebfd1" stroke-width="1.2" stroke-linecap="round">
      <path d="M7.5 11.5h21M7.5 18h21M7.5 24.5h21"/>
    </g>
    <g stroke="#fffdf8" stroke-width=".72">
      <circle cx="10.5" cy="11.5" r="2.55" fill="#08aaa5"/>
      <circle cx="16" cy="11.5" r="2.55" fill="#08aaa5"/>
      <circle cx="25.5" cy="11.5" r="2.55" fill="#0b67b2"/>
      <circle cx="12.5" cy="18" r="2.55" fill="#f58220"/>
      <circle cx="21" cy="18" r="2.55" fill="#f58220"/>
      <circle cx="26.5" cy="18" r="2.55" fill="#f58220"/>
      <circle cx="9.5" cy="24.5" r="2.55" fill="#0b67b2"/>
      <circle cx="18.5" cy="24.5" r="2.55" fill="#08aaa5"/>
      <circle cx="24" cy="24.5" r="2.55" fill="#08aaa5"/>
    </g>
  </svg>`;
}

function rendreDomainesMenu() {
  return DOMAINES_MENU
    .filter((domaine) => domaine.notions.length > 0)
    .map((domaine) => {
      const selectionnee = configurationMenu.notion === NOTION_NC01;
      const nombreSelectionne = selectionnee ? 1 : 0;
      return `<details class="theme-group ${selectionnee ? "has-selection is-complete" : ""}"
        data-theme="numbers" open>
        <summary class="theme-summary">
          <span class="theme-icon" aria-hidden="true">${rendreIconeNombresCalculs()}</span>
          <span class="theme-name">${echapper(domaine.nom)}</span>
          <span class="theme-count">${nombreSelectionne} / 1 <span class="theme-count-label">sélectionné</span></span>
          <span class="theme-chevron" aria-hidden="true"></span>
        </summary>
        <div class="theme-items">
          <div class="module-subgroup-items">
            <label class="modrow">
              <input type="checkbox" data-action="choisir-notion" data-value="${NOTION_NC01}"
                ${selectionnee ? "checked" : ""}>
              <span><strong>Critères de divisibilité</strong><small>Par 2, 3, 5, 9 et 10</small></span>
            </label>
          </div>
        </div>
      </details>`;
    })
    .join("");
}

function rendreMenuAccueil() {
  const entrainement = configurationMenu.mode === "entrainement";
  const notionSelectionnee = configurationMenu.notion === NOTION_NC01;
  return `<main class="menu-v10">
    <div class="app">
      <header class="header">
        <a class="logo-link" href="/" aria-label="Retour à l'accueil maths&go" title="Retour à l'accueil maths&go">
          <img class="logo" src="/assets/img/mathsgo-logo.png" alt="maths&go">
        </a>
        <div class="title">
          <h1>Automatismes<span class="title-cycle">DNB</span></h1>
        </div>
      </header>

      <div class="panel">
        <section class="settings-card" aria-labelledby="settingsTitle">
          <div class="section-heading">
            <span class="section-step section-step-settings" aria-hidden="true">1</span>
            <h2 id="settingsTitle">Préparer la série</h2>
          </div>
          <div class="controls-row">
            <div class="field field-mode">
              <label id="modeLabel">Utilisation</label>
              <div class="segmented-control" role="group" aria-labelledby="modeLabel">
                <button type="button" class="segment-btn ${entrainement ? "is-active" : ""}"
                  data-action="choisir-mode" data-value="entrainement" aria-pressed="${entrainement}">S'entraîner</button>
                <button type="button" class="segment-btn ${entrainement ? "" : "is-active"}"
                  data-action="choisir-mode" data-value="tableau" aria-pressed="${!entrainement}">Au tableau</button>
              </div>
            </div>
            <div class="field field-count">
              <label id="countLabel">Questions</label>
              <div class="segmented-control" role="group" aria-labelledby="countLabel">
                ${VOLUMES_MENU.map((volume) => `<button type="button" class="segment-btn ${configurationMenu.nombreQuestions === volume ? "is-active" : ""}"
                  data-action="choisir-volume" data-value="${volume}"
                  aria-pressed="${configurationMenu.nombreQuestions === volume}">${volume}</button>`).join("")}
              </div>
            </div>
          </div>
        </section>

        <section class="modules-card" aria-labelledby="modulesTitle">
          <div class="modules-toolbar">
            <div class="section-heading">
              <span class="section-step section-step-modules" aria-hidden="true">2</span>
              <h2 id="modulesTitle">Choisir les automatismes</h2>
            </div>
          </div>
          <div class="modules" aria-label="Domaines d'automatismes">
            ${rendreDomainesMenu()}
          </div>
        </section>
      </div>
    </div>

    <div class="setup-action-shell ${notionSelectionnee ? "" : "is-empty"}" aria-label="Résumé et lancement de la série">
      <div class="setup-action-bar">
        <div class="setup-summary" aria-live="polite">
          <strong>${notionSelectionnee ? "1 automatisme sélectionné" : "Choisis au moins un automatisme"}</strong>
          <span>${configurationMenu.nombreQuestions} questions · ${libelleMode(configurationMenu.mode)}</span>
        </div>
        <button class="generate-action" type="button" data-action="preparer" ${notionSelectionnee ? "" : "disabled"}>Lancer la série</button>
      </div>
    </div>
  </main>`;
}

function rendreEcranPret() {
  const entrainement = estEntrainement();
  return `
    <main class="ecran-pret">
      <button class="retour-lancement" type="button" data-action="retour-menu">← Modifier</button>
      ${rendreMarque()}
      <p class="surtitre">Préparation au brevet</p>
      <h1>${entrainement ? "Prêt à t'entraîner ?" : "Prêt pour la classe ?"}</h1>
      <section class="resume-seance" aria-label="Contenu de la séance">
        <span class="pastille-mode">${libelleMode()}</span>
        <strong>${echapper(nomNotion())}</strong>
        <span>${etat.configuration.nombreQuestions} ${etat.configuration.nombreQuestions === 1 ? "question" : "questions"}</span>
        <span>${echapper(texteAide())} · correction expliquée</span>
      </section>
      <section class="rappel-methode-pret" aria-label="Les deux observations à connaître">
        <p><strong>Chiffre des unités</strong><span>pour 2, 5 et 10</span></p>
        <p><strong>Somme de tous les chiffres</strong><span>pour 3 et 9</span></p>
      </section>
      <div class="actions-pret">
        <button class="bouton-secondaire bouton-large" data-action="cours">Voir le cours</button>
        <button class="bouton-principal bouton-large" data-action="demarrer">
          ${entrainement ? "Commencer" : "Commencer au tableau"}
        </button>
      </div>
      ${rendreCoursDivisibilite()}
    </main>`;
}

function rendreEntete() {
  const index = etat.seance.etat.indexQuestion + 1;
  const total = etat.seance.nombreQuestions;
  const entrainement = estEntrainement();
  const progression = Math.round((index / total) * 100);
  return `
    <header class="entete-seance ${entrainement ? "" : "entete-tableau"}">
      <button class="bouton-entete bouton-menu" data-action="menu" aria-expanded="${menuSessionOuvert}">Menu</button>
      ${entrainement
        ? `<span class="score" aria-label="${nombreReussites(etat)} bonnes réponses">✓ ${nombreReussites(etat)}</span>`
        : '<span class="mode-court">Au tableau</span>'}
      <span class="position" aria-label="Question ${index} sur ${total}">${index} / ${total}</span>
    </header>
    <div class="progression" aria-label="Progression : ${progression} %">
      <span style="width: ${progression}%"></span>
    </div>`;
}

function rendreChoix(question) {
  const entrainement = estEntrainement();
  const correctionVisible = entrainement
    ? etat.correctionOuverte
    : etat.reponseRevelee || etat.correctionOuverte;
  return question.reponse.choix.map((choix) => {
    const selectionne = etat.selection.includes(choix.id);
    const attendu = question.reponse.attendus.includes(choix.id);
    const reveleCorrect = correctionVisible && attendu;
    const estompe = !entrainement && correctionVisible && !attendu;
    const selectionJuste = entrainement && etat.validation !== null && selectionne && attendu;
    const selectionFausse = entrainement && etat.validation !== null && selectionne && !attendu;
    const classes = [
      "choix",
      selectionne ? "selectionne" : "",
      reveleCorrect ? "correct" : "",
      estompe ? "estompe" : "",
      selectionJuste ? "selection-juste" : "",
      selectionFausse ? "selection-fausse" : "",
    ].filter(Boolean).join(" ");

    if (!entrainement) {
      return `<div class="${classes}">
        ${reveleCorrect ? '<span class="coche" aria-hidden="true">✓</span>' : ""}
        <span>${echapper(choix.libelle)}</span>
        ${reveleCorrect ? '<span class="visuellement-cache">Correct</span>' : ""}
      </div>`;
    }
    const radio = question.reponse.type === "choix-unique";
    return `<button class="${classes}" data-action="choix" data-id="${echapper(choix.id)}"
      role="${radio ? "radio" : "checkbox"}" aria-checked="${selectionne}"
      aria-pressed="${selectionne}" ${etat.validation === null ? "" : "disabled"}>
      ${selectionFausse ? '<span class="icone-verdict" aria-hidden="true">×</span>' : ""}
      ${selectionJuste ? '<span class="icone-verdict" aria-hidden="true">✓</span>' : ""}
      <span>${echapper(choix.libelle)}</span>
    </button>`;
  }).join("");
}

function rendreRetourValidation() {
  if (etat.erreurValidation) {
    return `<p class="message message-erreur" role="alert">${echapper(etat.erreurValidation)}</p>`;
  }
  if (etat.validation === null) return "";
  return etat.validation.juste
    ? '<p class="message message-reussite" role="status"><strong>Bien joué !</strong> Ta réponse est correcte.</p>'
    : '<p class="message message-erreur" role="status"><strong>À revoir.</strong> Ta réponse reste affichée.</p>';
}

function rendreZoneRetour() {
  return `<div class="zone-retour" aria-live="polite" aria-atomic="true">${rendreRetourValidation()}</div>`;
}

function rendreBarreEleve() {
  const aideDisponible = etat.configuration.aide !== "indisponible";
  if (etat.validation === null) {
    return `<nav class="barre-eleve" aria-label="Actions de la question">
      <button class="bouton-secondaire" data-action="aide" ${aideDisponible ? "" : "disabled"}
        aria-expanded="${etat.aideOuverte}" aria-controls="panneau-aide">Aide</button>
      <button class="bouton-principal" data-action="valider">Valider</button>
    </nav>`;
  }
  return `<nav class="barre-eleve" aria-label="Actions après validation">
    <button class="bouton-secondaire" data-action="correction" aria-expanded="${etat.correctionOuverte}"
      aria-controls="panneau-correction">Voir l'explication</button>
    <button class="bouton-principal" data-action="suivant">
      ${etat.seance.etat.indexQuestion + 1 === etat.seance.nombreQuestions ? "Voir le bilan" : "Question suivante"}
    </button>
  </nav>`;
}

function rendreBarreEnseignant() {
  const aideDisponible = etat.configuration.aide !== "indisponible";
  const derniere = etat.seance.etat.indexQuestion + 1 === etat.seance.nombreQuestions;
  return `
    <nav class="barre-enseignant" aria-label="Commandes du mode Au tableau">
      <button data-action="aide" ${aideDisponible ? "" : "disabled"}
        aria-expanded="${etat.aideOuverte}" aria-controls="panneau-aide">Aide</button>
      ${aCoursNotion()
        ? `<button class="commande-cours" data-action="cours" aria-expanded="${etat.coursOuvert}"
          aria-controls="panneau-cours">Cours</button>`
        : ""}
      <button class="commande-reponse ${etat.reponseRevelee ? "active" : ""}"
        data-action="reponse" ${etat.reponseRevelee ? "disabled" : ""}>
        ${etat.reponseRevelee ? "Réponse affichée" : "Afficher la réponse"}
      </button>
      <button data-action="correction" aria-expanded="${etat.correctionOuverte}"
        aria-controls="panneau-correction">Correction</button>
      <button data-action="suivant">${derniere ? "Terminer" : "Suivant"}</button>
    </nav>`;
}

function rendreRappelQuestion(question) {
  const nombre = nombreQuestion(question);
  const phrase = question.enonce
    .filter((bloc) => bloc.id !== "nombre")
    .map((bloc) => bloc.type === "texte" ? bloc.contenu : bloc.valeur)
    .filter((contenu) => contenu !== undefined)
    .map(echapper)
    .join(" ");
  return `<section class="rappel-question" aria-label="Question en cours">
    <span>Question en cours</span>
    <p>${phrase}</p>
    ${nombre === undefined ? "" : `<strong>${echapper(nombre)}</strong>`}
  </section>`;
}

function rendreAccesCoursDepuisAide() {
  if (!aCoursNotion()) return "";
  return `<button class="aide-vers-cours" type="button" data-action="cours">
    <span>Besoin de revoir la règle ?</span><strong>Ouvrir le cours</strong>
  </button>`;
}

function rendreReponseEleve(question) {
  if (!estEntrainement() || etat.validation === null) return "";
  const reponse = question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL
    ? etat.saisie
    : question.reponse.choix
      .filter((choix) => etat.selection.includes(choix.id))
      .map((choix) => choix.libelle)
      .join(", ");
  return `<p class="rappel-reponse-eleve"><span>Ta réponse</span><strong>${echapper(reponse)}</strong></p>`;
}

function rendreMenuSession() {
  if (!menuSessionOuvert) return "";
  const index = etat.seance.etat.indexQuestion + 1;
  return `<div class="voile-menu" data-action="fermer-menu">
    <aside class="menu-session" data-action="interieur-menu" role="dialog" aria-modal="true" aria-labelledby="titre-menu-session">
      <div>
        <p class="surtitre">Série en cours</p>
        <h2 id="titre-menu-session">${echapper(nomNotion())}</h2>
        <p>Question ${index} sur ${etat.seance.nombreQuestions}</p>
      </div>
      <button class="bouton-principal" type="button" data-action="fermer-menu">Continuer la série</button>
      <button class="bouton-lien" type="button" data-action="quitter-vers-menu">Retour au choix de la série</button>
    </aside>
  </div>`;
}

function nombreQuestion(question) {
  return question.enonce.find((bloc) => bloc.id === "nombre")?.valeur;
}

function blocQuestion(question, id) {
  return question.enonce.find((bloc) => bloc.id === id);
}

function texteBloc(question, id) {
  return blocQuestion(question, id)?.contenu ?? "";
}

function familleQuestion(question) {
  return question.classement.famille;
}

function nombreSourceAide(question) {
  const source = question.aide?.outils?.find((outil) =>
    ["observer-unites", "composer-somme-chiffres"].includes(outil.type),
  )?.source;
  return source === undefined ? undefined : blocQuestion(question, source)?.valeur;
}

function libellesReponseCorrecte(question) {
  if (question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL) {
    return [String(question.reponse.attendu)];
  }
  return question.reponse.choix
    .filter((choix) => question.reponse.attendus.includes(choix.id))
    .map((choix) => choix.libelle);
}

function rendreReponseCorrecte(question) {
  return `<div class="reponses-correction" aria-label="Réponse correcte">
    ${libellesReponseCorrecte(question)
      .map((reponse) => `<strong>${echapper(reponse)}</strong>`)
      .join("")}
  </div>`;
}

function blocSolide(question) {
  return question.enonce.find((bloc) => bloc.type === "solide");
}

function creerModeleSolide({ forme, variante = "standard", mesures = {} }) {
  if (forme === "cube") return creerCube({ arete: mesures.arete ?? 4 });
  if (forme === "pave") {
    if (mesures.longueur) {
      return creerPave({
        longueur: mesures.longueur,
        largeur: mesures.largeur,
        hauteur: mesures.hauteur,
      });
    }
    return variante === "haut"
      ? creerPave({ longueur: 4.2, largeur: 3, hauteur: 5.2 })
      : creerPave({ longueur: 6, largeur: 3.3, hauteur: 2.8 });
  }
  if (forme === "prisme") {
    const hauteur = mesures.hauteur ?? 5;
    return variante === "triangle"
      ? creerPrisme({ base: "triangle-rectangle", cote1: 4, cote2: 3, hauteur })
      : creerPrisme({ cotes: 5, cote: 2.8, hauteur });
  }
  if (forme === "cylindre") {
    if (mesures.rayon) return creerCylindre({ rayon: mesures.rayon, hauteur: mesures.hauteur });
    return variante === "bas"
      ? creerCylindre({ rayon: 2.8, hauteur: 3.2 })
      : creerCylindre({ rayon: 2.1, hauteur: 4.7 });
  }
  if (forme === "pyramide") {
    return variante === "triangulaire"
      ? creerPyramide({ cotes: 3, cote: 4.4, hauteur: 4.8 })
      : creerPyramide({ cotes: 4, cote: 4.2, hauteur: 4.8 });
  }
  if (forme === "cone") {
    return variante === "large"
      ? creerCone({ rayon: 2.8, hauteur: 4 })
      : creerCone({ rayon: 2.2, hauteur: 4.8 });
  }
  throw new RangeError(`solide inconnu : ${forme}`);
}

function rendreSolide(bloc, {
  taille = 320,
  manipulable = false,
  mettreBasesEnValeur = false,
  afficherMesures = false,
  afficherHauteur = false,
  rotation = { lacetDeg: 0, tangageDeg: 0 },
} = {}) {
  const vue = bloc.vue ?? { lacetDeg: -30, tangageDeg: 16 };
  const svg = dessinerSolide(creerModeleSolide(bloc), {
    projection: "orthographique",
    lacetDeg: vue.lacetDeg + rotation.lacetDeg,
    tangageDeg: vue.tangageDeg + rotation.tangageDeg,
    taille,
    marge: 24,
    theme: "couleur",
    base: mettreBasesEnValeur,
    mesures: afficherMesures,
    hauteur: afficherHauteur,
    unite: bloc.mesures?.unite ?? "cm",
    cachees: "pointilles",
  });
  return `<div class="visuel-solide ${manipulable ? "solide-manipulable" : ""}"
    ${manipulable ? 'data-manipulable="true" tabindex="0" aria-label="Solide tournable"' : ""}>
    ${svg}
  </div>`;
}

function rendreDonneesVolume(bloc) {
  const m = bloc.mesures;
  const unite = echapper(m.unite);
  let donnees;
  if (bloc.forme === "cube") donnees = [["Côté", `${m.arete} ${unite}`]];
  else if (bloc.forme === "pave") {
    donnees = [
      ["Longueur", `${m.longueur} ${unite}`],
      ["Largeur", `${m.largeur} ${unite}`],
      ["Hauteur", `${m.hauteur} ${unite}`],
    ];
  } else if (bloc.forme === "prisme") {
    donnees = [
      ["Aire de la base", `${m.aireBase} ${unite}²`],
      ["Hauteur", `${m.hauteur} ${unite}`],
    ];
  } else {
    donnees = [
      ["Rayon", `${m.rayon} ${unite}`],
      ["Hauteur", `${m.hauteur} ${unite}`],
    ];
  }
  return `<dl class="donnees-volume">
    ${donnees.map(([nom, valeur]) => `<div><dt>${nom}</dt><dd>${valeur}</dd></div>`).join("")}
  </dl>`;
}

function commandesRotation() {
  return `<div class="commandes-rotation" aria-label="Tourner le solide">
    <button type="button" data-action="tourner-gauche" aria-label="Tourner le solide vers la gauche">← Tourner</button>
    <button type="button" data-action="tourner-droite" aria-label="Tourner le solide vers la droite">Tourner →</button>
  </div>`;
}

function rendreEtape(numero, titre, classe = "") {
  return `<div class="repere-etape ${classe}">
    <span aria-hidden="true">${numero}</span>
    <h3>${echapper(titre)}</h3>
  </div>`;
}

function rendreVerdicts(question, diviseurs) {
  const attendus = new Set(question.reponse.attendus);
  return `<div class="verdicts-correction">
    ${diviseurs.map((diviseur) => {
      const juste = attendus.has(String(diviseur));
      return `<div class="verdict-correction ${juste ? "positif" : "negatif"}">
        <span>par ${diviseur}</span>
        <strong>${juste ? "Oui" : "Non"}</strong>
      </div>`;
    }).join("")}
  </div>`;
}

function rendrePlateauPartage(question, { corrige = false } = {}) {
  const total = blocQuestion(question, "total")?.valeur;
  const diviseur = blocQuestion(question, "diviseur")?.valeur;
  if (!Number.isSafeInteger(total)) return "";
  if (!Number.isSafeInteger(diviseur)) {
    const attendus = new Set(question.reponse.attendus ?? []);
    return `<div class="plateau-partage plateau-groupes" aria-label="${total} éléments et plusieurs nombres de groupes à tester">
      <strong>${total}<small> éléments</small></strong>
      <span class="fleche-partage" aria-hidden="true">→</span>
      <div>${[2, 3, 5, 9, 10].map((groupe) => {
        const correct = attendus.has(String(groupe));
        const classe = corrige ? (correct ? "groupe-correct" : "groupe-incorrect") : "";
        return `<span class="${classe}">${groupe}<small>groupes</small>${corrige
          ? `<b aria-label="${correct ? "convient" : "ne convient pas"}">${correct ? "✓" : "×"}</b>`
          : ""}</span>`;
      }).join("")}</div>
    </div>`;
  }
  const reste = total % diviseur;
  const totalPartage = total - reste;
  const parPart = totalPartage / diviseur;
  const sacs = Array.from({ length: diviseur }, (_, index) => `
    <span class="sachet-partage" aria-label="Groupe ${index + 1}">
      <i aria-hidden="true"></i><b>${corrige ? parPart : "?"}</b>
    </span>`).join("");
  const totalAffiche = corrige && reste > 0 ? `${total} − ${reste} = ${totalPartage}` : total;
  return `<div class="plateau-partage" aria-label="${total} éléments à répartir dans ${diviseur} groupes">
    <strong>${totalAffiche}<small> éléments</small></strong>
    <span class="fleche-partage" aria-hidden="true">→</span>
    <div class="sachets-partage">${sacs}</div>
    ${corrige && reste > 0
      ? `<p class="reste-partage"><strong>${reste}</strong> élément${reste > 1 ? "s" : ""} à retirer</p>`
      : ""}
  </div>`;
}

function critereQuestion(question) {
  const texte = question.enonce
    .filter((bloc) => bloc.type === "texte")
    .map((bloc) => bloc.contenu)
    .join(" ");
  const correspondance = texte.match(/(?:par|divisible par)\s+(2|3|5|9|10)\b/i);
  return correspondance ? Number(correspondance[1]) : null;
}

function rappelCritereUnites(critere) {
  if (critere === 2) return "0, 2, 4, 6 ou 8";
  if (critere === 5) return "0 ou 5";
  return "0";
}

function rendreNombreAvecUnite(nombre) {
  const chiffres = [...String(nombre)];
  return `<span class="nombre-observe">${chiffres.slice(0, -1).map((chiffre) => `<span>${chiffre}</span>`).join("")}<strong>${chiffres.at(-1)}</strong></span>`;
}

function rendreAideSelectionNombres(question) {
  const critere = critereQuestion(question);
  const nombres = question.reponse.choix
    .filter((choix) => choix.id.startsWith("nombre-"))
    .map((choix) => Number(choix.libelle));
  const utiliseUnite = [2, 5, 10].includes(critere);
  return `
    <div class="voile" data-action="fermer-aide" aria-hidden="true"></div>
    <aside class="panneau panneau-aide" id="panneau-aide" role="dialog" aria-modal="true" aria-labelledby="titre-aide">
      <div class="entete-panneau">
        <div><p class="surtitre">Aide</p><h2 id="titre-aide">Me guider</h2></div>
        <button class="fermer" data-action="fermer-aide" aria-label="Revenir à la question">Retour</button>
      </div>
      ${rendreRappelQuestion(question)}
      ${rendreAccesCoursDepuisAide()}
      <section class="outil-aide aide-grille-nombres">
        ${rendreEtape(1, utiliseUnite ? "Observe les unités" : "Prépare les sommes", utiliseUnite ? "repere-unites" : "repere-somme")}
        <div class="grille-observation-aide">
          ${nombres.map((nombre) => `<article>
            ${utiliseUnite
              ? rendreNombreAvecUnite(nombre)
              : `<strong class="nombre-observe">${nombre}</strong><span class="somme-a-completer">${[...String(nombre)].join(" + ")} = ?</span>`}
          </article>`).join("")}
        </div>
      </section>
      <section class="indices-aide aide-courte">
        <h3>Une seule règle, six vérifications</h3>
        <p>${utiliseUnite
          ? `Pour ${critere}, l'unité doit être ${rappelCritereUnites(critere)}.`
          : `Pour ${critere}, calcule chaque somme puis demande-toi si elle est un multiple de ${critere}.`}</p>
        <p>Examine les nombres un par un, puis sélectionne ceux qui conviennent — ou « Aucun » si les six tests sont négatifs.</p>
      </section>
    </aside>`;
}

function rendreAideChiffreManquant(question) {
  const critere = critereQuestion(question);
  const motif = texteBloc(question, "nombre-a-completer");
  const utiliseUnite = [2, 5, 10].includes(critere);
  const chiffresFixes = [...motif].filter((caractere) => /\d/.test(caractere));
  return `
    <div class="voile" data-action="fermer-aide" aria-hidden="true"></div>
    <aside class="panneau panneau-aide" id="panneau-aide" role="dialog" aria-modal="true" aria-labelledby="titre-aide">
      <div class="entete-panneau">
        <div><p class="surtitre">Aide</p><h2 id="titre-aide">Me guider</h2></div>
        <button class="fermer" data-action="fermer-aide" aria-label="Revenir à la question">Retour</button>
      </div>
      ${rendreRappelQuestion(question)}
      ${rendreAccesCoursDepuisAide()}
      <section class="outil-aide aide-chiffre-manquant">
        ${rendreEtape(1, utiliseUnite ? "Regarde la place des unités" : "Écris la somme avec le chiffre manquant", utiliseUnite ? "repere-unites" : "repere-somme")}
        <p class="motif-aide">${echapper(motif)}</p>
        ${utiliseUnite
          ? `<p>Pour ${critere}, le chiffre des unités doit être <strong>${rappelCritereUnites(critere)}</strong>.</p>
            <p>${motif.at(-1) === "□" ? "Le chiffre manquant est justement l'unité." : `L'unité est déjà ${echapper(motif.at(-1))} : vérifie si changer l'autre chiffre peut modifier ce critère.`}</p>`
          : `<p class="expression-aide">${chiffresFixes.join(" + ")} + □ = ?</p>
            <p>Le résultat doit être un multiple de <strong>${critere}</strong>. Teste seulement les chiffres demandés par la consigne.</p>`}
      </section>
    </aside>`;
}

function rendreAideDivisibiliteGenerique(question) {
  const blocs = question.aide?.blocs ?? [];
  const nombre = nombreSourceAide(question);
  const outils = new Set((question.aide?.outils ?? []).map((outil) => outil.type));
  const chiffres = nombre === undefined ? [] : [...String(nombre)];
  const peutObserver = outils.has("observer-unites");
  const peutComposer = outils.has("composer-somme-chiffres");
  const expression = etat.chiffresSomme.length === 0
    ? `${chiffres.map(() => "□").join(" + ")} = □`
    : `${etat.chiffresSomme.map((index) => chiffres[index]).join(" + ")} = □`;
  return `
    <div class="voile" data-action="fermer-aide" aria-hidden="true"></div>
    <aside class="panneau panneau-aide" id="panneau-aide" role="dialog" aria-modal="true" aria-labelledby="titre-aide">
      <div class="entete-panneau">
        <div><p class="surtitre">Aide</p><h2 id="titre-aide">Me guider</h2></div>
        <button class="fermer" data-action="fermer-aide" aria-label="Revenir à la question">Retour</button>
      </div>
      ${rendreRappelQuestion(question)}
      ${rendreAccesCoursDepuisAide()}
      ${familleQuestion(question) === "partage-court" ? rendrePlateauPartage(question) : ""}
      ${peutObserver && chiffres.length > 0 ? `<section class="outil-aide outil-unites">
        ${rendreEtape(1, "Repère le chiffre des unités", "repere-unites")}
        <div class="nombre-aide" aria-label="Nombre ${nombre}">
          ${chiffres.slice(0, -1).map((chiffre) => `<span>${chiffre}</span>`).join("")}
          <button data-action="unite-aide" class="unite-aide ${etat.uniteReperee ? "actif" : ""}"
            aria-pressed="${etat.uniteReperee}">${chiffres.at(-1)}</button>
        </div>
      </section>` : ""}
      ${peutComposer && chiffres.length > 0 ? `<section class="outil-aide outil-somme">
        ${rendreEtape(peutObserver ? 2 : 1, "Construis la somme de tous les chiffres", "repere-somme")}
        <div class="chiffres-aide">${chiffres.map((chiffre, index) => `
          <button class="chiffre-aide ${etat.chiffresSomme.includes(index) ? "actif" : ""}"
            data-action="chiffre-aide" data-index="${index}" aria-pressed="${etat.chiffresSomme.includes(index)}">${chiffre}</button>`).join("")}</div>
        <output class="expression-aide">${echapper(expression)}</output>
      </section>` : ""}
      <section class="indices-aide aide-generique">
        <h3>À toi de vérifier</h3>
        <ol>${blocs.map((bloc) => `<li>${echapper(bloc.contenu)}</li>`).join("")}</ol>
      </section>
    </aside>`;
}

function rendreCorrectionSelectionNombres(question) {
  const critere = critereQuestion(question);
  const attendus = new Set(question.reponse.attendus);
  const utiliseUnite = [2, 5, 10].includes(critere);
  return `
    <div class="voile" data-action="fermer-correction" aria-hidden="true"></div>
    <aside class="panneau panneau-correction" id="panneau-correction" role="dialog" aria-modal="true" aria-labelledby="titre-correction">
      <div class="entete-panneau">
        <div><p class="surtitre">Après la réponse</p><h2 id="titre-correction">Correction expliquée</h2></div>
        <button class="fermer" data-action="fermer-correction" aria-label="Revenir à la question">Retour</button>
      </div>
      ${rendreRappelQuestion(question)}
      ${rendreReponseEleve(question)}
      <section class="etape-correction correction-observation">
        ${rendreEtape(1, utiliseUnite ? "Vérifier chaque unité" : "Vérifier chaque somme", utiliseUnite ? "repere-unites" : "repere-somme")}
        <div class="grille-diagnostics-nombres">
          ${question.reponse.choix.filter((choix) => choix.id.startsWith("nombre-")).map((choix) => {
            const nombre = Number(choix.libelle);
            const correct = attendus.has(choix.id);
            const chiffres = [...String(nombre)].map(Number);
            const somme = chiffres.reduce((total, chiffre) => total + chiffre, 0);
            return `<article class="${correct ? "diagnostic-positif" : "diagnostic-negatif"}">
              <div><strong>${nombre}</strong><span>${correct ? "Oui" : "Non"}</span></div>
              <p>${utiliseUnite
                ? `unité ${nombre % 10} · ${correct ? "critère vérifié" : "critère non vérifié"}`
                : `${chiffres.join(" + ")} = ${somme} · ${somme} ${correct ? "est" : "n'est pas"} multiple de ${critere}`}</p>
            </article>`;
          }).join("")}
        </div>
      </section>
      <section class="etape-correction correction-conclusion reponse-finale-correction">
        ${rendreEtape(2, "Conclure", "repere-conclusion")}
        <h3>Réponse correcte</h3>${rendreReponseCorrecte(question)}
      </section>
    </aside>`;
}

function rendreCorrectionDivisibiliteGenerique(question) {
  const correction = question.correction ?? [];
  return `
    <div class="voile" data-action="fermer-correction" aria-hidden="true"></div>
    <aside class="panneau panneau-correction" id="panneau-correction" role="dialog" aria-modal="true" aria-labelledby="titre-correction">
      <div class="entete-panneau">
        <div><p class="surtitre">Après la réponse</p><h2 id="titre-correction">Correction expliquée</h2></div>
        <button class="fermer" data-action="fermer-correction" aria-label="Revenir à la question">Retour</button>
      </div>
      ${rendreRappelQuestion(question)}
      ${rendreReponseEleve(question)}
      ${familleQuestion(question) === "partage-court" ? rendrePlateauPartage(question, { corrige: true }) : ""}
      <div class="correction-generique">
        ${correction.map((bloc, index) => `<section class="etape-correction ${index === correction.length - 1 ? "correction-conclusion" : "correction-observation"}">
          ${rendreEtape(index + 1, index === correction.length - 1 ? "Conclure" : "Vérifier")}
          <p>${echapper(bloc.contenu)}</p>
        </section>`).join("")}
      </div>
      <section class="etape-correction correction-conclusion reponse-finale-correction">
        <h3>Réponse correcte</h3>${rendreReponseCorrecte(question)}
      </section>
    </aside>`;
}

function rendreAideDivisibilite(question) {
  if (!etat.aideOuverte) return "";
  if (familleQuestion(question) === "selection-nombres") {
    return rendreAideSelectionNombres(question);
  }
  if (familleQuestion(question) === "chiffre-manquant") {
    return rendreAideChiffreManquant(question);
  }
  if (familleQuestion(question) !== "selection-diviseurs") {
    return rendreAideDivisibiliteGenerique(question);
  }
  const nombre = String(nombreQuestion(question));
  const blocs = question.aide?.blocs ?? [];
  const expression = etat.chiffresSomme.length === 0
    ? `${[...nombre].map(() => "□").join(" + ")} = □`
    : `${etat.chiffresSomme.map((index) => nombre[index]).join(" + ")} = □`;
  const chiffresSomme = [...nombre].map((chiffre, index) => `
    <button class="chiffre-aide ${etat.chiffresSomme.includes(index) ? "actif" : ""}"
      data-action="chiffre-aide" data-index="${index}" aria-pressed="${etat.chiffresSomme.includes(index)}">
      ${chiffre}
    </button>`).join("");
  const unite = nombre.at(-1);
  return `
    <div class="voile" data-action="fermer-aide" aria-hidden="true"></div>
    <aside class="panneau panneau-aide" id="panneau-aide" role="dialog" aria-modal="true" aria-labelledby="titre-aide">
      <div class="entete-panneau">
        <div><p class="surtitre">Aide</p><h2 id="titre-aide">Me guider</h2></div>
        <button class="fermer" data-action="fermer-aide" aria-label="Revenir à la question">Retour</button>
      </div>
      ${rendreRappelQuestion(question)}
      ${rendreAccesCoursDepuisAide()}
      <section class="outil-aide outil-unites">
        ${rendreEtape(1, blocs[0]?.contenu ?? "Observe le chiffre des unités.", "repere-unites")}
        <div class="nombre-aide" aria-label="Nombre ${nombre}">
          ${nombre.slice(0, -1).split("").map((chiffre) => `<span>${chiffre}</span>`).join("")}
          <button data-action="unite-aide" class="unite-aide ${etat.uniteReperee ? "actif" : ""}"
            aria-pressed="${etat.uniteReperee}" aria-label="Chiffre des unités : ${unite}">${unite}</button>
        </div>
        <p class="consigne-manipulation">Appuie sur le chiffre à observer.</p>
      </section>
      <section class="outil-aide outil-somme">
        ${rendreEtape(2, blocs[1]?.contenu ?? "Additionne tous les chiffres.", "repere-somme")}
        <div class="chiffres-aide">${chiffresSomme}</div>
        <output class="expression-aide">${echapper(expression)}</output>
        <p class="consigne-manipulation">Appuie sur les chiffres pour construire la somme.</p>
      </section>
      <section class="indices-aide">
        <h3>À vérifier ensuite</h3>
        <ul>${blocs.slice(2).map((bloc) => `<li>${echapper(bloc.contenu)}</li>`).join("")}</ul>
      </section>
    </aside>`;
}

function rendreCorrectionDivisibilite(question) {
  if (!etat.correctionOuverte) return "";
  if (familleQuestion(question) === "selection-nombres") {
    return rendreCorrectionSelectionNombres(question);
  }
  if (familleQuestion(question) !== "selection-diviseurs") {
    return rendreCorrectionDivisibiliteGenerique(question);
  }
  const nombre = String(nombreQuestion(question));
  const chiffres = [...nombre];
  const somme = chiffres.reduce((total, chiffre) => total + Number(chiffre), 0);
  const attendus = question.reponse.attendus;
  const reponses = attendus.includes("aucun") ? ["Aucun"] : attendus;
  return `
    <div class="voile" data-action="fermer-correction" aria-hidden="true"></div>
    <aside class="panneau panneau-correction" id="panneau-correction" role="dialog" aria-modal="true" aria-labelledby="titre-correction">
      <div class="entete-panneau">
        <div><p class="surtitre">Après la réponse</p><h2 id="titre-correction">Correction expliquée</h2></div>
        <button class="fermer" data-action="fermer-correction" aria-label="Revenir à la question">Retour</button>
      </div>
      ${rendreRappelQuestion(question)}
      ${rendreReponseEleve(question)}
      <section class="etape-correction correction-unites">
        ${rendreEtape(1, "Regarder le chiffre des unités", "repere-unites")}
        <div class="nombre-correction" aria-label="Le chiffre des unités de ${nombre} est ${nombre.at(-1)}">
          ${chiffres.slice(0, -1).map((chiffre) => `<span>${chiffre}</span>`).join("")}
          <strong>${nombre.at(-1)}</strong>
        </div>
        ${rendreVerdicts(question, [2, 5, 10])}
        <p>${echapper(question.correction[0]?.contenu ?? "")}</p>
      </section>
      <section class="etape-correction correction-somme">
        ${rendreEtape(2, "Additionner tous les chiffres", "repere-somme")}
        <p class="calcul-correction">${echapper(chiffres.join(" + "))} <span>=</span> <strong>${somme}</strong></p>
        ${rendreVerdicts(question, [3, 9])}
        <p>${echapper(question.correction[1]?.contenu ?? "")}</p>
      </section>
      <section class="etape-correction correction-conclusion">
        ${rendreEtape(3, "Conclure", "repere-conclusion")}
        <div class="reponses-correction" aria-label="Réponse correcte">
          ${reponses.map((reponse) => `<strong>${echapper(reponse)}</strong>`).join("")}
        </div>
        <p>${echapper(question.correction[2]?.contenu ?? "")}</p>
      </section>
    </aside>`;
}

function rendreCarteCoursDivisibilite(index) {
  if (index === 0) {
    return `<article class="carte-cours-divisibilite">
      <span class="numero-cours">1</span>
      <h3>Divisible signifie « sans reste »</h3>
      <p class="modelage-cours">Je partage en parts égales, puis je regarde le reste.</p>
      <div class="comparaison-partages">
        <div class="barre-partage partage-exact" aria-label="12 partagé en 3 parts égales de 4, reste zéro">
          <strong>12</strong><div><span>4</span><span>4</span><span>4</span></div><small>reste 0</small>
        </div>
        <div class="barre-partage partage-avec-reste" aria-label="13 partagé en 3 parts égales de 4, reste un">
          <strong>13</strong><div><span>4</span><span>4</span><span>4</span><i>1</i></div><small>reste 1</small>
        </div>
      </div>
      <p><strong>12 = 3 × 4 + 0</strong> : 12 est divisible par 3.<br><strong>13 = 3 × 4 + 1</strong> : 13 ne l’est pas.</p>
    </article>`;
  }
  if (index === 1) {
    return `<article class="carte-cours-divisibilite">
      <span class="numero-cours">2</span>
      <h3>Pour 2, 5 et 10 : je regarde l’unité</h3>
      <ul class="regles-unites-cours">
        <li><strong>par 2</strong><span>0, 2, 4, 6 ou 8</span></li>
        <li><strong>par 5</strong><span>0 ou 5</span></li>
        <li><strong>par 10</strong><span>0</span></li>
      </ul>
      <div class="exemples-contrastes-unites" aria-label="Trois exemples comparés">
        <p>23<strong>0</strong><span>2, 5 et 10</span></p>
        <p>23<strong>5</strong><span>5 seulement</span></p>
        <p>23<strong>6</strong><span>2 seulement</span></p>
      </div>
    </article>`;
  }
  if (index === 2) {
    return `<article class="carte-cours-divisibilite">
      <span class="numero-cours">3</span>
      <h3>Pour 3 et 9 : j’additionne tous les chiffres</h3>
      <div class="exemples-sommes-cours">
        <section><strong>372</strong><p>3 + 7 + 2 = <b>12</b></p><span>12 est multiple de 3, pas de 9.</span><em>372 est divisible par 3 seulement.</em></section>
        <section><strong>729</strong><p>7 + 2 + 9 = <b>18</b></p><span>18 est multiple de 3 et de 9.</span><em>729 est divisible par 3 et par 9.</em></section>
      </div>
    </article>`;
  }
  return `<article class="carte-cours-divisibilite">
    <span class="numero-cours">4</span>
    <h3>Je garde deux liens en tête</h3>
    <div class="liens-divisibilite"><strong>divisible par 9 <span>implique</span> divisible par 3</strong><strong>divisible par 10 <span>implique</span> divisible par 2 et par 5</strong></div>
    <div class="attention-cours"><strong>Attention au sens inverse</strong><p>Divisible par 3 ne signifie pas toujours divisible par 9.<br>Divisible par 5 ne signifie pas toujours divisible par 10.</p></div>
  </article>`;
}

function rendreCoursDivisibilite() {
  if (!etat.coursOuvert) return "";
  const derniere = pageCoursDivisibilite === 3;
  return `
    <div class="voile" data-action="fermer-cours" aria-hidden="true"></div>
    <aside class="panneau panneau-cours panneau-cours-divisibilite" id="panneau-cours"
      role="dialog" aria-modal="true" aria-labelledby="titre-cours">
      <div class="entete-panneau">
        <div><p class="surtitre">Cours · ${pageCoursDivisibilite + 1} / 4</p><h2 id="titre-cours">Les critères de divisibilité</h2></div>
        <button class="fermer" data-action="fermer-cours" aria-label="Fermer le cours">Retour</button>
      </div>
      <p class="introduction-cours">Une idée à la fois : observe l’exemple, puis dis la règle avec tes mots.</p>
      <div class="cours-une-carte" aria-live="polite">${rendreCarteCoursDivisibilite(pageCoursDivisibilite)}</div>
      <nav class="navigation-cours" aria-label="Navigation dans le cours">
        <button class="bouton-secondaire" type="button" data-action="cours-precedent" ${pageCoursDivisibilite === 0 ? "disabled" : ""}>Précédent</button>
        <div class="points-cours" aria-label="Page ${pageCoursDivisibilite + 1} sur 4">${[0, 1, 2, 3].map((page) => `<span class="${page === pageCoursDivisibilite ? "actif" : ""}"></span>`).join("")}</div>
        <button class="bouton-principal" type="button" data-action="${derniere ? "fermer-cours" : "cours-suivant"}">${derniere ? "J’ai compris" : "Suivant"}</button>
      </nav>
    </aside>`;
}

function rendreAideSolides(question) {
  if (!etat.aideOuverte) return "";
  const bloc = blocSolide(question);
  const indice = question.aide?.blocs?.[0]?.contenu ?? "Observe la forme du solide.";
  return `
    <div class="voile" data-action="fermer-aide" aria-hidden="true"></div>
    <aside class="panneau panneau-aide panneau-solides" id="panneau-aide" aria-labelledby="titre-aide">
      <div class="entete-panneau">
        <h2 id="titre-aide">Observe sans deviner</h2>
        <button class="fermer" data-action="fermer-aide" aria-label="Fermer l'aide">×</button>
      </div>
      ${rendreAccesCoursDepuisAide()}
      <section class="outil-aide outil-solide">
        ${rendreEtape(1, indice, "repere-observation")}
        ${rendreSolide(bloc, { taille: 360, manipulable: true, rotation: etat.rotationSolide })}
        ${commandesRotation()}
        <p class="consigne-manipulation">Fais glisser la figure ou utilise les boutons. Le nom n'est pas révélé.</p>
      </section>
      <section class="indices-aide">
        <h3>Ce qu'il faut regarder</h3>
        <p>Les faces planes, les surfaces courbes et la présence éventuelle d'un sommet en pointe.</p>
      </section>
    </aside>`;
}

function rendreCorrectionSolides(question) {
  if (!etat.correctionOuverte) return "";
  const bloc = blocSolide(question);
  const propriete = question.correction?.[0]?.contenu ?? "";
  const conclusion = question.correction?.[1]?.contenu ?? "";
  return `
    <div class="voile" data-action="fermer-correction" aria-hidden="true"></div>
    <aside class="panneau panneau-correction panneau-solides" id="panneau-correction" aria-labelledby="titre-correction">
      <div class="entete-panneau">
        <h2 id="titre-correction">Correction expliquée</h2>
        <button class="fermer" data-action="fermer-correction" aria-label="Fermer la correction">×</button>
      </div>
      <section class="etape-correction correction-observation">
        ${rendreEtape(1, "Observer les propriétés", "repere-observation")}
        ${rendreSolide(bloc, { taille: 320, mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme) })}
        <p>${echapper(propriete)}</p>
      </section>
      <section class="etape-correction correction-conclusion">
        ${rendreEtape(2, "Nommer le solide", "repere-conclusion")}
        <p class="conclusion-solide">${echapper(conclusion)}</p>
      </section>
    </aside>`;
}

function rendreCoursReconnaissance() {
  if (!etat.coursOuvert) return "";
  return `
    <div class="voile" data-action="fermer-cours" aria-hidden="true"></div>
    <aside class="panneau panneau-cours" id="panneau-cours" aria-labelledby="titre-cours">
      <div class="entete-panneau">
        <div>
          <p class="surtitre">Mémo visuel</p>
          <h2 id="titre-cours">Les six solides à reconnaître</h2>
        </div>
        <button class="fermer" data-action="fermer-cours" aria-label="Fermer le cours">×</button>
      </div>
      <p class="introduction-cours">On reconnaît un solide grâce à ses propriétés, pas grâce à sa position sur l'écran. Tourne les figures pour le vérifier.</p>
      ${commandesRotation()}
      <div class="grille-cours-solides">
        ${COURS_SOLIDES_USUELS.map((solide) => `
          <article class="carte-cours-solide">
            <h3>${echapper(solide.nom)}</h3>
            ${rendreSolide({ ...solide, vue: { lacetDeg: -34, tangageDeg: 18 } }, {
              taille: 240,
              manipulable: true,
              rotation: etat.rotationSolide,
              mettreBasesEnValeur: ["prisme", "cylindre"].includes(solide.forme),
            })}
            <p>${echapper(solide.phrase)}</p>
          </article>`).join("")}
      </div>
    </aside>`;
}

function rendreAideVolumes(question) {
  if (!etat.aideOuverte) return "";
  const bloc = blocSolide(question);
  const aides = question.aide?.blocs ?? [];
  return `
    <div class="voile" data-action="fermer-aide" aria-hidden="true"></div>
    <aside class="panneau panneau-aide panneau-solides" id="panneau-aide" aria-labelledby="titre-aide">
      <div class="entete-panneau">
        <h2 id="titre-aide">Calcul guidé</h2>
        <button class="fermer" data-action="fermer-aide" aria-label="Fermer l'aide">×</button>
      </div>
      ${rendreAccesCoursDepuisAide()}
      <section class="outil-aide outil-solide">
        ${rendreSolide(bloc, {
          taille: 300,
          manipulable: true,
          rotation: etat.rotationSolide,
          mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme),
          afficherMesures: ["cube", "pave", "cylindre"].includes(bloc.forme),
          afficherHauteur: bloc.forme === "cylindre",
        })}
        ${rendreDonneesVolume(bloc)}
        ${commandesRotation()}
      </section>
      <div class="etapes-aide-volume">
        ${aides.map((aide, index) => `<section class="outil-aide">
          ${rendreEtape(index + 1, aide.contenu, index === 0 ? "repere-observation" : "")}
        </section>`).join("")}
      </div>
    </aside>`;
}

function rendreCorrectionVolumes(question) {
  if (!etat.correctionOuverte) return "";
  const titres = ["Écrire la formule", "Remplacer par les données", "Calculer", "Conclure avec l'unité"];
  return `
    <div class="voile" data-action="fermer-correction" aria-hidden="true"></div>
    <aside class="panneau panneau-correction panneau-solides" id="panneau-correction" aria-labelledby="titre-correction">
      <div class="entete-panneau">
        <h2 id="titre-correction">Correction expliquée</h2>
        <button class="fermer" data-action="fermer-correction" aria-label="Fermer la correction">×</button>
      </div>
      <div class="etapes-correction-volume">
        ${question.correction.map((bloc, index) => `<section class="etape-correction ${index === 3 ? "correction-conclusion" : "correction-observation"}">
          ${rendreEtape(index + 1, titres[index], index === 3 ? "repere-conclusion" : "repere-observation")}
          <p class="ligne-calcul-volume">${echapper(bloc.contenu)}</p>
        </section>`).join("")}
      </div>
    </aside>`;
}

function rendreEmpilementCubes() {
  const projeter = (x, y, z) => [78 + (x - y) * 24, 56 + (x + y) * 13 - z * 27];
  const polygone = (points, classe) => `<polygon class="${classe}" points="${points.map((p) => p.join(",")).join(" ")}"/>`;
  let faces = "";
  const L = 3;
  const P = 2;
  const H = 2;
  for (let z = 0; z < H; z += 1) {
    for (let y = P - 1; y >= 0; y -= 1) {
      for (let x = 0; x < L; x += 1) {
        if (z === H - 1) faces += polygone([
          projeter(x, y, z + 1), projeter(x + 1, y, z + 1),
          projeter(x + 1, y + 1, z + 1), projeter(x, y + 1, z + 1),
        ], "face-haut");
        if (y === 0) faces += polygone([
          projeter(x, y, z), projeter(x + 1, y, z),
          projeter(x + 1, y, z + 1), projeter(x, y, z + 1),
        ], "face-avant");
        if (x === L - 1) faces += polygone([
          projeter(x + 1, y, z), projeter(x + 1, y + 1, z),
          projeter(x + 1, y + 1, z + 1), projeter(x + 1, y, z + 1),
        ], "face-droite");
      }
    }
  }
  return `<svg class="empilement-cubes" viewBox="0 0 180 145" role="img" aria-label="Empilement de 3 fois 2 fois 2 cubes unité">${faces}</svg>`;
}

function rendreCoursVolumes() {
  if (!etat.coursOuvert) return "";
  const question = questionCourante(etat);
  const bloc = blocSolide(question);
  const formule = bloc.forme === "cube"
    ? "V = côté × côté × côté"
    : bloc.forme === "pave"
      ? "V = longueur × largeur × hauteur"
      : bloc.forme === "prisme"
        ? "V = aire de la base × hauteur"
        : "V = π × rayon × rayon × hauteur";
  return `
    <div class="voile" data-action="fermer-cours" aria-hidden="true"></div>
    <aside class="panneau panneau-cours" id="panneau-cours" aria-labelledby="titre-cours">
      <div class="entete-panneau">
        <div><p class="surtitre">Cours à comprendre</p><h2 id="titre-cours">Du cube unité à la formule</h2></div>
        <button class="fermer" data-action="fermer-cours" aria-label="Fermer le cours">×</button>
      </div>
      <p class="introduction-cours">Le volume mesure la place occupée par un solide. On le mesure avec des cubes unité.</p>
      <div class="grille-cours-volume">
        <article class="carte-cours-solide">
          <span class="numero-cours">1</span><h3>Un cube unité</h3>
          ${rendreSolide({ forme: "cube", variante: "standard", mesures: { arete: 1, unite: "cm" }, vue: { lacetDeg: -32, tangageDeg: 18 } }, { taille: 200, afficherMesures: true })}
          <p>Un cube de côté 1 cm a un volume de <strong>1 cm³</strong>.</p>
        </article>
        <article class="carte-cours-solide">
          <span class="numero-cours">2</span><h3>Remplir sans trou</h3>
          ${rendreEmpilementCubes()}
          <p>3 × 2 × 2 = 12 cubes unité, donc le volume est <strong>12 cm³</strong>.</p>
        </article>
        <article class="carte-cours-solide carte-formule-volume">
          <span class="numero-cours">3</span><h3>L'invariant</h3>
          ${rendreSolide(bloc, {
            taille: 220,
            manipulable: true,
            rotation: etat.rotationSolide,
            mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme),
          })}
          <p class="formule-volume">${echapper(formule)}</p>
          <p>La vue peut changer ; la formule et le volume ne changent pas.</p>
        </article>
      </div>
      ${commandesRotation()}
    </aside>`;
}

function classesLecteur() {
  const panneau = etat.aideOuverte || etat.correctionOuverte || etat.coursOuvert;
  const classePanneau = etat.aideOuverte
    ? "aide-ouverte"
    : etat.correctionOuverte
      ? "correction-ouverte"
      : etat.coursOuvert
        ? "cours-ouvert"
        : "";
  return `lecteur mode-${etat.configuration.mode} ${panneau ? "panneau-ouvert" : ""} ${classePanneau}`;
}

function rendreClavierEntier(question) {
  const entrainement = estEntrainement();
  const valeurAffichee = entrainement
    ? etat.saisie || "…"
    : etat.reponseRevelee
      ? String(question.reponse.attendu)
      : "?";
  return `<section class="saisie-numerique" aria-label="Réponse numérique">
    <output class="afficheur-reponse ${etat.saisie ? "rempli" : ""}">${echapper(valeurAffichee)}</output>
    ${entrainement ? `<div class="clavier-mathsgo" aria-label="Clavier chiffres">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((chiffre) => `<button type="button" data-action="chiffre" data-value="${chiffre}">${chiffre}</button>`).join("")}
      <button class="touche-effacer" type="button" data-action="effacer-saisie" aria-label="Effacer le dernier chiffre">Effacer</button>
      <button type="button" data-action="chiffre" data-value="0">0</button>
      <span aria-hidden="true"></span>
    </div>` : ""}
  </section>`;
}

function rendrePhraseStructuree(question) {
  return question.enonce.map((bloc) => {
    if (bloc.type === "entier") {
      return `<strong>${echapper(bloc.valeur)}</strong>`;
    }
    if (bloc.type === "texte") return `<span>${echapper(bloc.contenu)}</span>`;
    return "";
  }).join(" ");
}

function classeGrilleDivisibilite(question) {
  const famille = familleQuestion(question);
  if (famille === "selection-nombres") return "grille-nombres";
  if (famille === "affirmation-divisibilite") {
    return question.reponse.choix.length === 2
      ? "grille-oui-non"
      : "grille-justifications";
  }
  if (famille === "chiffre-manquant") return "grille-chiffres";
  if (famille === "partage-court") return "grille-partage";
  if (famille === "critere-precis") return "grille-oui-non";
  return "";
}

function rendreZoneReponseDivisibilite(question) {
  if (question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL) {
    return rendreClavierEntier(question);
  }
  return `<div class="grille-choix ${classeGrilleDivisibilite(question)} ${estEntrainement() ? "" : "grille-projection"}"
    aria-label="Réponses proposées">${rendreChoix(question)}</div>`;
}

function rendreContenuQuestionDivisibilite(question) {
  const famille = familleQuestion(question);
  if (famille === "selection-diviseurs") {
    const nombre = nombreQuestion(question);
    return `<h1>${echapper(question.enonce[0].contenu)}</h1>
      <p class="nombre-question">${echapper(nombre)}<span aria-hidden="true">.</span></p>
      <p class="precision">${estEntrainement() ? "Plusieurs réponses sont peut-être possibles." : "Quels nombres proposés conviennent ?"}</p>`;
  }
  if (famille === "critere-precis") {
    return `<h1>${echapper(texteBloc(question, "consigne"))}</h1>
      <p class="nombre-question">${echapper(nombreQuestion(question))}</p>
      <p class="precision">Choisis Oui ou Non.</p>`;
  }
  if (famille === "selection-nombres") {
    return `<h1>${echapper(texteBloc(question, "consigne"))}</h1>
      <p class="precision">Observe chaque nombre. Plusieurs réponses sont attendues.</p>`;
  }
  if (famille === "affirmation-divisibilite") {
    return `<h1>${echapper(texteBloc(question, "consigne"))}</h1>
      <blockquote class="affirmation-question">${echapper(texteBloc(question, "affirmation"))}</blockquote>
      <p class="precision">Vérifie le critère avant de choisir.</p>`;
  }
  if (famille === "chiffre-manquant") {
    return `<h1>${echapper(texteBloc(question, "consigne"))}</h1>
      <p class="nombre-a-completer">${echapper(texteBloc(question, "nombre-a-completer"))}</p>
      <p class="precision">${question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL ? "Entre un chiffre." : "Plusieurs chiffres sont peut-être possibles."}</p>`;
  }
  if (famille === "partage-court") {
    return `<h1>Partager sans reste</h1>
      <p class="situation-question">${rendrePhraseStructuree(question)}</p>
      ${rendrePlateauPartage(question)}
      <p class="precision">${question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL ? "Entre le plus petit nombre à retirer." : "Relie la situation à un critère de divisibilité."}</p>`;
  }
  return `<h1>${echapper(question.enonce[0]?.contenu ?? "Question")}</h1>`;
}

function rendreQuestionDivisibilite() {
  const question = questionCourante(etat);
  const entrainement = estEntrainement();
  return `
    <div class="${classesLecteur()}">
      ${rendreEntete()}
      <div class="espace-lecteur">
        <main class="carte-question carte-question-divisibilite famille-${echapper(familleQuestion(question))}">
          <p class="etiquette-notion">${echapper(nomNotion())}</p>
          ${rendreContenuQuestionDivisibilite(question)}
          ${rendreZoneReponseDivisibilite(question)}
          ${entrainement ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
        </main>
        ${rendreAide(question)}
        ${rendreCorrection(question)}
        ${rendreCours()}
      </div>
      ${entrainement ? rendreBarreEleve() : rendreBarreEnseignant()}
      ${rendreMenuSession()}
    </div>`;
}

function rendreQuestionSolides() {
  const question = questionCourante(etat);
  const bloc = blocSolide(question);
  const entrainement = estEntrainement();
  return `
    <div class="${classesLecteur()}">
      ${rendreEntete()}
      <div class="espace-lecteur">
        <main class="carte-question carte-question-solides">
          <p class="etiquette-notion">${echapper(nomNotion())}</p>
          <h1>${echapper(question.enonce[0].contenu)}</h1>
          ${rendreSolide(bloc, { taille: entrainement ? 320 : 400 })}
          <p class="precision">${entrainement ? "Choisis une seule réponse." : "Choisissez le nom du solide."}</p>
          <div class="grille-choix grille-solides ${entrainement ? "" : "grille-projection"}"
            role="${entrainement ? "radiogroup" : "group"}" aria-label="Noms proposés">
            ${rendreChoix(question)}
          </div>
          ${entrainement ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
        </main>
        ${rendreAide(question)}
        ${rendreCorrection(question)}
        ${rendreCours()}
      </div>
      ${entrainement ? rendreBarreEleve() : rendreBarreEnseignant()}
      ${rendreMenuSession()}
    </div>`;
}

function rendreQuestionVolumes() {
  const question = questionCourante(etat);
  const bloc = blocSolide(question);
  const entrainement = estEntrainement();
  return `
    <div class="${classesLecteur()}">
      ${rendreEntete()}
      <div class="espace-lecteur">
        <main class="carte-question carte-question-solides carte-question-volumes">
          <p class="etiquette-notion">${echapper(nomNotion())}</p>
          <h1>${echapper(question.enonce[0].contenu)}</h1>
          <div class="figure-et-donnees">
            ${rendreSolide(bloc, {
              taille: entrainement ? 290 : 360,
              mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme),
              afficherMesures: ["cube", "pave", "cylindre"].includes(bloc.forme),
              afficherHauteur: bloc.forme === "cylindre",
            })}
            ${rendreDonneesVolume(bloc)}
          </div>
          <p class="precision">Calcul mental, sans calculatrice. Choisis une seule réponse.</p>
          <div class="grille-choix grille-solides grille-volumes ${entrainement ? "" : "grille-projection"}"
            role="${entrainement ? "radiogroup" : "group"}" aria-label="Volumes proposés">
            ${rendreChoix(question)}
          </div>
          ${entrainement ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
        </main>
        ${rendreAide(question)}
        ${rendreCorrection(question)}
        ${rendreCours()}
      </div>
      ${entrainement ? rendreBarreEleve() : rendreBarreEnseignant()}
      ${rendreMenuSession()}
    </div>`;
}

const RENDUS_COURS = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreCoursDivisibilite,
  [RENDU_SOLIDE]: rendreCoursReconnaissance,
  [RENDU_VOLUME]: rendreCoursVolumes,
});

const RENDUS_AIDE = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreAideDivisibilite,
  [RENDU_SOLIDE]: rendreAideSolides,
  [RENDU_VOLUME]: rendreAideVolumes,
});

const RENDUS_CORRECTION = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreCorrectionDivisibilite,
  [RENDU_SOLIDE]: rendreCorrectionSolides,
  [RENDU_VOLUME]: rendreCorrectionVolumes,
});

const RENDUS_QUESTION = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreQuestionDivisibilite,
  [RENDU_SOLIDE]: rendreQuestionSolides,
  [RENDU_VOLUME]: rendreQuestionVolumes,
});

function executerRendu(registre, ...parametres) {
  const rendu = registre[definitionNotion().rendu];
  if (!rendu) throw new Error(`rendu absent : ${definitionNotion().rendu}`);
  return rendu(...parametres);
}

function rendreCours() {
  if (!aCoursNotion()) return "";
  return executerRendu(RENDUS_COURS);
}

function rendreAide(question) {
  return executerRendu(RENDUS_AIDE, question);
}

function rendreCorrection(question) {
  return executerRendu(RENDUS_CORRECTION, question);
}

function rendreQuestion() {
  return executerRendu(RENDUS_QUESTION);
}

function rendreBilan() {
  const entrainement = estEntrainement();
  const volume = etat.seance.nombreQuestions;
  const conseil = volume < 10
    ? "Cette révision courte ne couvre pas toutes les formes. Choisis 10 questions pour une série standard."
    : "Ce score décrit cette série. Pour confirmer la maîtrise, réussis de nouveau une série à un autre moment.";
  return `
    <main class="ecran-pret ecran-bilan">
      <p class="surtitre">Séance terminée</p>
      <h1>${entrainement ? "Ton bilan" : "Séance terminée"}</h1>
      ${entrainement
        ? `<p class="resultat-bilan"><strong>${nombreReussites(etat)}</strong><span>bonnes réponses sur ${etat.seance.nombreQuestions}</span></p>`
        : '<p class="texte-bilan">Toutes les questions ont été présentées.</p>'}
      <p class="notion-bilan">${echapper(nomNotion())}</p>
      ${entrainement ? `<p class="conseil-bilan">${echapper(conseil)}</p>` : ""}
      <div class="actions-bilan">
        <button class="bouton-principal bouton-large" data-action="recommencer">Refaire cette série</button>
        <button class="bouton-secondaire bouton-large" data-action="retour-menu">Choisir une autre série</button>
      </div>
    </main>`;
}

function rendre({ focusPanneau = false, focusSelector = "" } = {}) {
  const phase = etat.seance.etat.phase;
  application.innerHTML = menuAccueilOuvert
    ? rendreMenuAccueil()
    : phase === "prete"
      ? rendreEcranPret()
      : phase === "terminee"
        ? rendreBilan()
        : rendreQuestion();
  document.title = menuAccueilOuvert
    ? "Préparation au brevet — Automatismes maths&go"
    : phase === "en-cours"
    ? `Question ${etat.seance.etat.indexQuestion + 1} — Automatismes maths&go`
    : "Automatismes maths&go";
  if (focusPanneau) {
    application.querySelector(".menu-session button, .panneau .fermer")?.focus();
  } else if (focusSelector) {
    application.querySelector(focusSelector)?.focus();
  }
}

application.addEventListener("click", (evenement) => {
  const cible = evenement.target.closest("[data-action]");
  if (!cible) return;
  const action = cible.dataset.action;
  if (action === "interieur-menu") return;
  let focusPanneau = false;
  let focusSelector = "";
  if (action === "choisir-mode") {
    configurationMenu.mode = cible.dataset.value === "tableau" ? "tableau" : "entrainement";
  }
  if (action === "choisir-volume") {
    const volume = Number(cible.dataset.value);
    if (VOLUMES_MENU.includes(volume)) configurationMenu.nombreQuestions = volume;
  }
  if (action === "choisir-notion") {
    configurationMenu.notion = configurationMenu.notion === NOTION_NC01 ? null : NOTION_NC01;
  }
  if (action === "preparer") {
    if (configurationMenu.notion !== NOTION_NC01) return;
    etat = creerEtatLecteur({
      ...configurationMenu,
      graine: `serie-${Date.now()}`,
    });
    menuAccueilOuvert = false;
  }
  if (action === "retour-menu") {
    menuAccueilOuvert = true;
    menuSessionOuvert = false;
  }
  if (action === "demarrer") demarrer(etat);
  if (action === "menu") {
    fermerAide(etat);
    fermerCorrection(etat);
    fermerCours(etat);
    menuSessionOuvert = true;
    focusPanneau = true;
  }
  if (action === "fermer-menu") {
    menuSessionOuvert = false;
    focusSelector = '[data-action="menu"]';
  }
  if (action === "quitter-vers-menu") {
    menuSessionOuvert = false;
    menuAccueilOuvert = true;
  }
  if (action === "choix") {
    basculerChoix(etat, cible.dataset.id);
    focusSelector = `[data-action="choix"][data-id="${cible.dataset.id}"]`;
  }
  if (action === "chiffre") {
    saisirChiffre(etat, Number(cible.dataset.value));
    focusSelector = `[data-action="chiffre"][data-value="${cible.dataset.value}"]`;
  }
  if (action === "effacer-saisie") {
    effacerSaisie(etat);
    focusSelector = '[data-action="effacer-saisie"]';
  }
  if (action === "valider") {
    validerReponse(etat);
    if (etat.validation !== null) focusSelector = '[data-action="correction"]';
  }
  if (action === "aide") {
    menuSessionOuvert = false;
    ouvrirAide(etat);
    focusPanneau = etat.aideOuverte;
  }
  if (action === "fermer-aide") {
    fermerAide(etat);
    focusSelector = '[data-action="aide"]';
  }
  if (action === "unite-aide") {
    basculerUniteAide(etat);
    focusSelector = '[data-action="unite-aide"]';
  }
  if (action === "chiffre-aide") {
    basculerChiffreAide(etat, Number(cible.dataset.index));
    focusSelector = `[data-action="chiffre-aide"][data-index="${cible.dataset.index}"]`;
  }
  if (action === "reponse") revelerReponse(etat);
  if (action === "correction") {
    menuSessionOuvert = false;
    ouvrirCorrection(etat);
    focusPanneau = etat.correctionOuverte;
  }
  if (action === "fermer-correction") {
    fermerCorrection(etat);
    focusSelector = '[data-action="correction"]';
  }
  if (action === "cours") {
    menuSessionOuvert = false;
    pageCoursDivisibilite = 0;
    ouvrirCours(etat);
    focusPanneau = etat.coursOuvert;
  }
  if (action === "cours-precedent") {
    pageCoursDivisibilite = Math.max(0, pageCoursDivisibilite - 1);
    focusSelector = '[data-action="cours-precedent"]';
  }
  if (action === "cours-suivant") {
    pageCoursDivisibilite = Math.min(3, pageCoursDivisibilite + 1);
    focusSelector = pageCoursDivisibilite === 3
      ? '[data-action="fermer-cours"].bouton-principal'
      : '[data-action="cours-suivant"]';
  }
  if (action === "fermer-cours") {
    fermerCours(etat);
    focusSelector = etat.seance.etat.phase === "prete" || !estEntrainement()
      ? '[data-action="cours"]'
      : '[data-action="aide"]';
  }
  if (action === "tourner-gauche") {
    tournerSolide(etat, -22);
    focusSelector = '[data-action="tourner-gauche"]';
  }
  if (action === "tourner-droite") {
    tournerSolide(etat, 22);
    focusSelector = '[data-action="tourner-droite"]';
  }
  if (action === "suivant") passerQuestionSuivante(etat);
  if (action === "recommencer") etat = recommencer(etat);
  rendre({ focusPanneau, focusSelector });
});

window.addEventListener?.("keydown", (evenement) => {
  if (evenement.key === "Escape") {
    let focusSelector = "";
    if (menuSessionOuvert) {
      menuSessionOuvert = false;
      focusSelector = '[data-action="menu"]';
    } else if (etat.aideOuverte) {
      fermerAide(etat);
      focusSelector = '[data-action="aide"]';
    } else if (etat.correctionOuverte) {
      fermerCorrection(etat);
      focusSelector = '[data-action="correction"]';
    } else if (etat.coursOuvert) {
      fermerCours(etat);
      focusSelector = etat.seance.etat.phase === "prete" || !estEntrainement()
        ? '[data-action="cours"]'
        : '[data-action="aide"]';
    }
    else return;
    rendre({ focusSelector });
    return;
  }
  if (evenement.key === "Tab") {
    const dialogue = application.querySelector?.(
      '.menu-session, .panneau[role="dialog"], .panneau[aria-labelledby]',
    );
    if (dialogue) {
      const focusables = [...dialogue.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      if (focusables.length > 0) {
        const premier = focusables[0];
        const dernier = focusables.at(-1);
        if (!dialogue.contains(document.activeElement)) {
          evenement.preventDefault?.();
          (evenement.shiftKey ? dernier : premier).focus();
        } else if (evenement.shiftKey && document.activeElement === premier) {
          evenement.preventDefault?.();
          dernier.focus();
        } else if (!evenement.shiftKey && document.activeElement === dernier) {
          evenement.preventDefault?.();
          premier.focus();
        }
      }
    }
    return;
  }
  if (menuSessionOuvert || etat.aideOuverte || etat.correctionOuverte || etat.coursOuvert) return;
  const question = questionCourante(etat);
  if (question?.reponse.type !== TYPE_REPONSE_ENTIER_NATUREL) return;
  if (/^[0-9]$/.test(evenement.key)) {
    evenement.preventDefault?.();
    saisirChiffre(etat, Number(evenement.key));
    rendre();
  } else if (evenement.key === "Backspace") {
    evenement.preventDefault?.();
    effacerSaisie(etat);
    rendre();
  } else if (evenement.key === "Enter") {
    evenement.preventDefault?.();
    validerReponse(etat);
    rendre();
  }
});

let debutGlissement = null;
application.addEventListener("pointerdown", (evenement) => {
  if (!evenement.target.closest(".solide-manipulable")) return;
  debutGlissement = { x: evenement.clientX, y: evenement.clientY };
});

application.addEventListener("pointerup", (evenement) => {
  if (!debutGlissement) return;
  const dx = evenement.clientX - debutGlissement.x;
  const dy = evenement.clientY - debutGlissement.y;
  debutGlissement = null;
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
  tournerSolide(etat, dx * 0.45, -dy * 0.3);
  rendre();
});

application.addEventListener("pointercancel", () => {
  debutGlissement = null;
});

rendre();
