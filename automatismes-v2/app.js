import {
  COULEURS,
  RAYONS,
  TYPOGRAPHIE,
} from "../packages/charte/src/charte.js";
import {
  basculerChiffreAide,
  basculerChoix,
  creerEtatLecteur,
  demarrer,
  effacerSaisie,
  fermerAide,
  fermerCorrection,
  fermerCours,
  lireConfiguration,
  nombreReussites,
  NOTION_NC01,
  NOTION_NC02,
  ouvrirAide,
  ouvrirCorrection,
  ouvrirCours,
  passerQuestionSuivante,
  questionCourante,
  recommencer,
  revelerReponse,
  selectionnerChampSaisie,
  saisirChiffre,
  tournerSolide,
  validerReponse,
} from "./src/etat-lecteur.js?v=17";
import {
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_CHOIX_UNIQUE,
} from "../packages/contrats/src/question-v2.js?v=17";
import {
  connaitNotionLecteur,
  obtenirNotionLecteur,
  RENDU_CARRES,
  RENDU_DIVISIBILITE,
  RENDU_SOLIDE,
  RENDU_VOLUME,
} from "./src/registre-lecteur.js?v=17";
import { COURS_SOLIDES_USUELS } from "../packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js?v=17";
import {
  creerCone,
  creerCube,
  creerCylindre,
  creerPave,
  creerPrisme,
  creerPyramide,
  dessinerSolide,
} from "../packages/objets/src/solides.js";
import {
  ACTION_TOUCHE_EFFACER,
  ACTION_TOUCHE_SAISIR,
  ACTION_TOUCHE_VALIDER,
  obtenirDispositionClavier,
} from "../packages/objets/src/clavier.js?v=17";
import { formulationCritereDivisibilite } from "../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/critere-precis.js?v=17";
import {
  nombre,
  puissance,
  variable,
  versHtmlSemantique,
} from "../packages/objets/src/expressions.js?v=17";
import {
  dessinerCarreQuadrille,
} from "../packages/objets/src/carre-quadrille.js?v=17";

const application = document.querySelector("#application");
const rechercheInitiale = window.location.search;
let etat = creerEtatLecteur(lireConfiguration(rechercheInitiale));
let menuAccueilOuvert = rechercheInitiale.length === 0;
let menuSessionOuvert = false;
let pageCoursCourante = 0;
let compteurSeries = 0;
let configurationMenu = {
  mode: "entrainement",
  aide: "disponible",
  nombreQuestions: 10,
  notion: NOTION_NC01,
};

const VOLUMES_MENU = Object.freeze([5, 10, 15, 20]);

function creerGraineSerie() {
  compteurSeries += 1;
  return `serie-${Date.now()}-${compteurSeries}`;
}

const DOMAINES_MENU = Object.freeze([
  Object.freeze({
    id: "nombres-calculs",
    nom: "Nombres et calculs",
    notions: Object.freeze([NOTION_NC01, NOTION_NC02]),
  }),
  Object.freeze({ id: "calcul-litteral-algebre", nom: "Calcul littéral et algèbre", notions: Object.freeze([]) }),
  Object.freeze({ id: "proportionnalite-fonctions-grandeurs", nom: "Proportionnalité, fonctions et grandeurs", notions: Object.freeze([]) }),
  Object.freeze({ id: "espace-geometrie", nom: "Espace et géométrie", notions: Object.freeze([]) }),
  Object.freeze({ id: "donnees-statistiques-probabilites", nom: "Données, statistiques et probabilités", notions: Object.freeze([]) }),
  Object.freeze({ id: "pensee-informatique", nom: "Pensée informatique", notions: Object.freeze([]) }),
]);

const LIBELLES_MODULES_MENU = Object.freeze({
  [NOTION_NC01]: Object.freeze({
    titre: "Critères de divisibilité",
    precision: "Par 2, 3, 5, 9 et 10",
  }),
  [NOTION_NC02]: Object.freeze({
    titre: "Carrés des entiers",
    precision: "De 0 à 12",
  }),
});

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

function estReponseNumerique(question) {
  return [TYPE_REPONSE_ENTIER_NATUREL, TYPE_REPONSE_DEUX_ENTIERS]
    .includes(question.reponse.type);
}

function rendrePuissance(base, exposant = 2) {
  return versHtmlSemantique(puissance(nombre(base), exposant));
}

function nombrePagesCours() {
  return definitionNotion().pagesCours;
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

function rendreIconeCalculatriceBarree() {
  return `<svg class="dnb-launch-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="6" y="2.8" width="12.4" height="18.4" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <rect x="8.5" y="5.5" width="7.4" height="3.6" rx="1" fill="currentColor" opacity=".9"/>
    <circle cx="9.4" cy="12.6" r="1.05" fill="currentColor"/>
    <circle cx="12.2" cy="12.6" r="1.05" fill="currentColor"/>
    <circle cx="15" cy="12.6" r="1.05" fill="currentColor"/>
    <circle cx="9.4" cy="16.6" r="1.05" fill="currentColor"/>
    <circle cx="12.2" cy="16.6" r="1.05" fill="currentColor"/>
    <circle cx="15" cy="16.6" r="1.05" fill="currentColor"/>
    <path d="M3.6 21.4 20.4 2.6" fill="none" stroke="#f58220" stroke-width="3.4" stroke-linecap="round"/>
  </svg>`;
}

function rendreDomainesMenu() {
  return DOMAINES_MENU
    .filter((domaine) => domaine.notions.length > 0)
    .map((domaine) => {
      const selectionnee = domaine.notions.includes(configurationMenu.notion);
      const nombreSelectionne = selectionnee ? 1 : 0;
      return `<details class="theme-group ${selectionnee ? "has-selection is-complete" : ""}"
        data-theme="numbers" open>
        <summary class="theme-summary">
          <span class="theme-icon" aria-hidden="true">${rendreIconeNombresCalculs()}</span>
          <span class="theme-name">${echapper(domaine.nom)}</span>
          <span class="theme-count">${nombreSelectionne} / ${domaine.notions.length} <span class="theme-count-label">sélectionné</span></span>
          <span class="theme-chevron" aria-hidden="true"></span>
        </summary>
        <div class="theme-items">
          <div class="module-subgroup-items">
            ${domaine.notions.map((idNotion) => {
              const libelle = LIBELLES_MODULES_MENU[idNotion];
              const estSelectionnee = configurationMenu.notion === idNotion;
              return `<label class="modrow">
                <input type="checkbox" data-action="choisir-notion" data-value="${echapper(idNotion)}"
                  ${estSelectionnee ? "checked" : ""}>
                <span><strong>${echapper(libelle.titre)}</strong><small>${echapper(libelle.precision)}</small></span>
              </label>`;
            }).join("")}
          </div>
        </div>
      </details>`;
    })
    .join("");
}

function rendreMenuAccueil() {
  const entrainement = configurationMenu.mode === "entrainement";
  const notionSelectionnee = configurationMenu.notion !== null
    && connaitNotionLecteur(configurationMenu.notion);
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
        <div class="launch-cluster">
          <span class="dnb-launch-context" role="img" aria-label="Épreuve DNB sans calculatrice" title="Épreuve sans calculatrice">
            ${rendreIconeCalculatriceBarree()}
          </span>
          <button class="generate-action" type="button" data-action="preparer" ${notionSelectionnee ? "" : "disabled"}>Lancer la série</button>
        </div>
      </div>
    </div>
  </main>`;
}

function rendreEcranPret() {
  const entrainement = estEntrainement();
  return `
    <main class="ecran-pret ${etat.coursOuvert ? "cours-pret-ouvert" : ""}">
      <button class="retour-lancement" type="button" data-action="retour-menu">← Modifier</button>
      ${rendreMarque()}
      <p class="surtitre">Préparation au brevet</p>
      <h1>${entrainement ? "Prêt à t'entraîner ?" : "Prêt pour la classe ?"}</h1>
      <section class="resume-seance" aria-label="Contenu de la séance">
        <strong>${echapper(nomNotion())}</strong>
        <span>${etat.configuration.nombreQuestions} ${etat.configuration.nombreQuestions === 1 ? "question" : "questions"}</span>
      </section>
      <div class="actions-pret">
        <button class="bouton-secondaire bouton-large" data-action="cours">Voir le cours</button>
        <button class="bouton-principal bouton-large" data-action="demarrer">
          ${entrainement ? "Commencer" : "Commencer au tableau"}
        </button>
      </div>
      ${rendreCours()}
    </main>`;
}

function rendreEntete() {
  const index = etat.seance.etat.indexQuestion + 1;
  const total = etat.seance.nombreQuestions;
  const entrainement = estEntrainement();
  const aideDisponible = etat.configuration.aide !== "indisponible";
  const progression = Math.round((index / total) * 100);
  return `
    <header class="entete-seance ${entrainement ? "" : "entete-tableau"}">
      <div class="actions-entete">
        <button class="bouton-entete bouton-menu" data-action="menu" aria-expanded="${menuSessionOuvert}">
          <span aria-hidden="true">☰</span><strong>Menu</strong>
        </button>
        <button class="bouton-entete bouton-aide-entete" data-action="aide"
          ${aideDisponible ? "" : "disabled"} aria-expanded="${etat.aideOuverte}"
          aria-controls="panneau-aide"><span aria-hidden="true">?</span><strong>Aide</strong></button>
      </div>
      ${entrainement
        ? `<span class="score" aria-label="${nombreReussites(etat)} bonnes réponses">✓ ${nombreReussites(etat)}</span>`
        : '<span class="mode-court">Au tableau</span>'}
      <span class="position" aria-label="Question ${index} sur ${total}">${index} / ${total}</span>
    </header>
    <div class="progression" role="progressbar" aria-label="Progression des questions"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progression}">
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

function rendreBarreEleve(question) {
  if (etat.validation === null) {
    const saisieNumerique = estReponseNumerique(question);
    return `<nav class="barre-eleve barre-avant-validation ${saisieNumerique ? "barre-saisie-numerique" : ""}"
      aria-label="Actions de la question">
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

function rendreBlocMathematique(bloc) {
  if (bloc.type === "texte") return `<span>${echapper(bloc.contenu)}</span>`;
  if (bloc.type === "entier") return `<strong>${echapper(bloc.valeur)}</strong>`;
  if (bloc.type === "puissance") return rendrePuissance(bloc.base, bloc.exposant);
  return "";
}

function rendreBarreEnseignant() {
  const derniere = etat.seance.etat.indexQuestion + 1 === etat.seance.nombreQuestions;
  return `
    <nav class="barre-enseignant" aria-label="Commandes du mode Au tableau">
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
    .map(rendreBlocMathematique)
    .filter(Boolean)
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

const CONFIGURATION_PANNEAUX = Object.freeze({
  aide: Object.freeze({
    id: "panneau-aide",
    titreId: "titre-aide",
    actionFermer: "fermer-aide",
    ariaFermer: "Revenir à la question",
  }),
  correction: Object.freeze({
    id: "panneau-correction",
    titreId: "titre-correction",
    actionFermer: "fermer-correction",
    ariaFermer: "Revenir à la question",
  }),
  cours: Object.freeze({
    id: "panneau-cours",
    titreId: "titre-cours",
    actionFermer: "fermer-cours",
    ariaFermer: "Fermer le cours",
  }),
});

function rendreCadrePanneau({
  type,
  titre,
  contenu,
  surtitre = "",
  pied = "",
  classes = "",
}) {
  const configuration = CONFIGURATION_PANNEAUX[type];
  if (!configuration) throw new RangeError(`type de panneau inconnu : ${type}`);
  const classePied = pied ? "panneau-avec-pied" : "panneau-sans-pied";
  return `
    <div class="voile" data-action="${configuration.actionFermer}" aria-hidden="true"></div>
    <aside class="panneau panneau-${type} ${classePied} ${classes}" id="${configuration.id}"
      role="dialog" aria-modal="true" aria-labelledby="${configuration.titreId}">
      <div class="entete-panneau">
        <div>${surtitre ? `<p class="surtitre">${echapper(surtitre)}</p>` : ""}<h2 id="${configuration.titreId}">${echapper(titre)}</h2></div>
        <button class="fermer" data-action="${configuration.actionFermer}"
          aria-label="${configuration.ariaFermer}">Retour</button>
      </div>
      <div class="corps-panneau">${contenu}</div>
      ${pied ? `<div class="pied-panneau">${pied}</div>` : ""}
    </aside>`;
}

function rendreReponseEleve(question) {
  if (!estEntrainement() || etat.validation === null) return "";
  const reponse = question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL
    ? etat.saisie
    : question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS
      ? etat.saisies.join(" × ")
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
  if (question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS) {
    return [question.reponse.attendus.join(" × ")];
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

function rendreEtapeCarres(numero, titre, classe = "") {
  const contenu = echapper(titre).replaceAll(
    "□",
    '<span class="case-vide-aide" aria-label="case vide"></span>',
  );
  return `<div class="repere-etape ${classe}">
    <span aria-hidden="true">${numero}</span>
    <h3>${contenu}</h3>
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
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(diviseur)) return "";
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
  const diviseur = blocQuestion(question, "diviseur")?.valeur;
  if ([2, 3, 5, 9, 10].includes(diviseur)) return diviseur;
  const texte = question.enonce
    .filter((bloc) => bloc.type === "texte")
    .map((bloc) => bloc.contenu)
    .join(" ");
  const correspondance = texte.match(/(?:par|divisible par)\s+(2|3|5|9|10)\b/i);
  return correspondance ? Number(correspondance[1]) : null;
}

function rendreRappelsCriteres(criteres) {
  return `<div class="rappels-criteres-aide" aria-label="Critères à appliquer">
    ${criteres.map((critere) => `<p><strong>Critère par ${critere}</strong><span>${echapper(formulationCritereDivisibilite(critere))}</span></p>`).join("")}
  </div>`;
}

function rendreNombreAvecUnite(nombre) {
  const chiffres = [...String(nombre)];
  return `<span class="nombre-observe nombre-avec-unite">${chiffres.slice(0, -1).map((chiffre) => `<span>${chiffre}</span>`).join("")}<strong class="chiffre-unite-encadre">${chiffres.at(-1)}</strong></span>`;
}

function rendreMotifAide(motif, encadrerUnite) {
  return `<p class="motif-aide motif-aide-structure" aria-label="Nombre incomplet ${echapper(motif)}">
    ${[...motif].map((caractere, index, caracteres) => {
      const unite = encadrerUnite && index === caracteres.length - 1;
      const balise = unite ? "strong" : "span";
      return `<${balise} class="${unite ? "chiffre-unite-encadre" : ""}">${echapper(caractere)}</${balise}>`;
    }).join("")}
  </p>`;
}

function rendreSommeInteractive(nombre, numeroEtape = 1) {
  const chiffres = [...String(nombre)];
  const selectionnes = new Set(etat.chiffresSomme);
  const tousSelectionnes = chiffres.every((_, index) => selectionnes.has(index));
  const somme = chiffres.reduce((total, chiffre) => total + Number(chiffre), 0);
  const expression = `${chiffres.map((chiffre, index) => selectionnes.has(index) ? chiffre : "□").join(" + ")} = ${tousSelectionnes ? somme : "□"}`;
  return `<section class="outil-aide outil-somme">
    ${rendreEtape(numeroEtape, "Additionne tous les chiffres", "repere-somme")}
    <div class="chiffres-aide">${chiffres.map((chiffre, index) => `
      <button class="chiffre-aide ${selectionnes.has(index) ? "actif" : ""}"
        data-action="chiffre-aide" data-index="${index}" aria-pressed="${selectionnes.has(index)}">${chiffre}</button>`).join("")}</div>
    <output class="expression-aide" aria-live="polite" aria-atomic="true">${echapper(expression)}</output>
    <p class="consigne-manipulation">Appuie sur chaque chiffre : la somme apparaît quand ils sont tous sélectionnés.</p>
  </section>`;
}

function rendreAideSelectionNombres(question) {
  const critere = critereQuestion(question);
  const nombres = question.reponse.choix
    .filter((choix) => choix.id.startsWith("nombre-"))
    .map((choix) => Number(choix.libelle));
  const utiliseUnite = [2, 5, 10].includes(critere);
  const contenu = `
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
        ${rendreRappelsCriteres([critere])}
    </section>
    <section class="indices-aide aide-courte">
        <h3>Une seule règle, quatre vérifications</h3>
        <p>${utiliseUnite
          ? "Compare le chiffre encadré au critère rappelé ci-dessus."
          : "Calcule chaque somme, puis compare-la au critère rappelé ci-dessus."}</p>
        <p>Examine les nombres un par un, puis sélectionne ceux qui conviennent — ou « Aucun » si les quatre tests sont négatifs.</p>
    </section>`;
  return rendreCadrePanneau({
    type: "aide",
    surtitre: "Aide",
    titre: "Me guider",
    contenu,
  });
}

function rendreAideChiffreManquant(question) {
  const critere = critereQuestion(question);
  const motif = texteBloc(question, "nombre-a-completer");
  const utiliseUnite = [2, 5, 10].includes(critere);
  const strategie = question.aide?.blocs?.find(({ id }) =>
    ["verifier-tous", "partir-zero"].includes(id));
  const contenu = `
    ${rendreRappelQuestion(question)}
    ${rendreAccesCoursDepuisAide()}
    <section class="outil-aide aide-chiffre-manquant">
        ${rendreEtape(1, utiliseUnite ? "Regarde la place des unités" : "Écris la somme avec le chiffre manquant", utiliseUnite ? "repere-unites" : "repere-somme")}
        ${rendreMotifAide(motif, utiliseUnite)}
        ${utiliseUnite
          ? `${rendreRappelsCriteres([critere])}
            <p>${motif.at(-1) === "□" ? "Le chiffre manquant est justement l'unité." : `L'unité est déjà ${echapper(motif.at(-1))} : vérifie si changer l'autre chiffre peut modifier ce critère.`}</p>`
          : `<p class="expression-aide">${[...motif].join(" + ")} = ?</p>
            ${rendreRappelsCriteres([critere])}
            <p>Teste seulement les chiffres demandés par la consigne.</p>`}
    </section>
    ${strategie ? `<p class="indication-aide">${echapper(strategie.contenu)}</p>` : ""}`;
  return rendreCadrePanneau({
    type: "aide",
    surtitre: "Aide",
    titre: "Me guider",
    contenu,
  });
}

function rendreAideDivisibiliteGenerique(question) {
  const blocs = question.aide?.blocs ?? [];
  const nombre = nombreSourceAide(question);
  const outils = new Set((question.aide?.outils ?? []).map((outil) => outil.type));
  const chiffres = nombre === undefined ? [] : [...String(nombre)];
  const peutObserver = outils.has("observer-unites");
  const peutComposer = outils.has("composer-somme-chiffres");
  const critere = critereQuestion(question);
  const famille = familleQuestion(question);
  const idsSpecifiques = famille === "partage-court"
    ? new Set(["relier-partage", "partir-du-plus-petit"])
    : new Set();
  const indicationsSpecifiques = blocs.filter((bloc) => idsSpecifiques.has(bloc.id));
  const contenu = `
    ${rendreRappelQuestion(question)}
    ${rendreAccesCoursDepuisAide()}
    ${familleQuestion(question) === "partage-court" ? rendrePlateauPartage(question) : ""}
    ${peutObserver && chiffres.length > 0 ? `<section class="outil-aide outil-unites">
        ${rendreEtape(1, "Repère le chiffre des unités", "repere-unites")}
        <div class="nombre-aide" aria-label="Nombre ${nombre}, chiffre des unités ${chiffres.at(-1)}">${rendreNombreAvecUnite(nombre)}</div>
        ${critere === null ? "" : rendreRappelsCriteres([critere])}
      </section>` : ""}
      ${peutComposer && chiffres.length > 0 ? `${rendreSommeInteractive(nombre, peutObserver ? 2 : 1)}
        ${critere === null ? "" : rendreRappelsCriteres([critere])}` : ""}
    ${indicationsSpecifiques.length === 0 ? "" : `<section class="indices-aide aide-generique">
        <h3>À toi de conclure</h3>
        <ol>${indicationsSpecifiques.map((bloc) => `<li>${echapper(bloc.contenu)}</li>`).join("")}</ol>
    </section>`}`;
  return rendreCadrePanneau({
    type: "aide",
    surtitre: "Aide",
    titre: "Me guider",
    contenu,
  });
}

function rendreCorrectionSelectionNombres(question) {
  const critere = critereQuestion(question);
  const attendus = new Set(question.reponse.attendus);
  const utiliseUnite = [2, 5, 10].includes(critere);
  const contenu = `
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
    </section>`;
  return rendreCadrePanneau({
    type: "correction",
    surtitre: "Après la réponse",
    titre: "Correction expliquée",
    contenu,
  });
}

function rendreCorrectionDivisibiliteGenerique(question) {
  const correction = question.correction ?? [];
  const contenu = `
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
    </section>`;
  return rendreCadrePanneau({
    type: "correction",
    surtitre: "Après la réponse",
    titre: "Correction expliquée",
    contenu,
  });
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
  const unite = nombre.at(-1);
  const contenu = `
    ${rendreRappelQuestion(question)}
    ${rendreAccesCoursDepuisAide()}
    <section class="outil-aide outil-unites">
        ${rendreEtape(1, "Regarde le chiffre des unités", "repere-unites")}
        <div class="nombre-aide" aria-label="Nombre ${nombre}, chiffre des unités ${unite}">${rendreNombreAvecUnite(nombre)}</div>
        ${rendreRappelsCriteres([2, 5, 10])}
        <p class="question-guidage">À toi de décider quels critères conviennent.</p>
    </section>
    ${rendreSommeInteractive(nombre, 2)}
    ${rendreRappelsCriteres([3, 9])}
    <p class="indication-aide">Plusieurs réponses peuvent être correctes.</p>`;
  return rendreCadrePanneau({
    type: "aide",
    surtitre: "Aide",
    titre: "Me guider",
    contenu,
  });
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
  const contenu = `
    ${rendreRappelQuestion(question)}
    ${rendreReponseEleve(question)}
    <section class="etape-correction correction-unites">
        ${rendreEtape(1, "Regarder le chiffre des unités", "repere-unites")}
        <div class="nombre-correction" aria-label="Le chiffre des unités de ${nombre} est ${nombre.at(-1)}">
          ${chiffres.slice(0, -1).map((chiffre) => `<span>${chiffre}</span>`).join("")}
          <strong class="chiffre-unite-encadre">${nombre.at(-1)}</strong>
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
    </section>`;
  return rendreCadrePanneau({
    type: "correction",
    surtitre: "Après la réponse",
    titre: "Correction expliquée",
    contenu,
  });
}

function rendreCarteCoursDivisibilite(index) {
  if (index === 0) {
    return `<article class="carte-cours-divisibilite">
      <span class="numero-cours">1</span>
      <h3>Divisible : le reste est égal à 0</h3>
      <p class="definition-cours">Un nombre est divisible par un autre lorsque le reste de la division est nul, c’est-à-dire égal à 0.</p>
      <p class="modelage-cours">On peut alors partager en parts égales sans qu’il reste d’objet.</p>
      <div class="comparaison-partages">
        <section class="exemple-partage-cours">
          <div class="barre-partage partage-exact" aria-label="12 partagé en 3 parts égales de 4, reste zéro">
            <strong>12</strong><div><span>4</span><span>4</span><span>4</span></div><small>reste 0</small>
          </div>
          <p><strong>12 = 3 × 4 + 0</strong><span>Le reste est égal à 0 : 12 est divisible par 3.</span></p>
        </section>
        <section class="exemple-partage-cours">
          <div class="barre-partage partage-avec-reste" aria-label="13 partagé en 3 parts égales de 4, reste un">
            <strong>13</strong><div><span>4</span><span>4</span><span>4</span><i>1</i></div><small>reste 1</small>
          </div>
          <p><strong>13 = 3 × 4 + 1</strong><span>Le reste n’est pas égal à 0 : 13 n’est pas divisible par 3.</span></p>
        </section>
      </div>
    </article>`;
  }
  if (index === 1) {
    return `<article class="carte-cours-divisibilite">
      <span class="numero-cours">2</span>
      <h3>Pour 2, 5 et 10, je regarde le chiffre des unités</h3>
      <ul class="regles-unites-cours">
        <li><strong>Divisible par 2 :</strong><span>le chiffre des unités est 0, 2, 4, 6 ou 8.</span></li>
        <li><strong>Divisible par 5 :</strong><span>le chiffre des unités est 0 ou 5.</span></li>
        <li><strong>Divisible par 10 :</strong><span>le chiffre des unités est 0.</span></li>
      </ul>
      <div class="exemples-unites-cours" aria-label="Trois exemples">
        <p><strong class="nombre-unite-cours" aria-label="230, chiffre des unités 0"><span>2</span><span>3</span><b class="chiffre-unite-encadre">0</b></strong><span>Son chiffre des unités est 0 : il est divisible par 2, par 5 et par 10.</span></p>
        <p><strong class="nombre-unite-cours" aria-label="235, chiffre des unités 5"><span>2</span><span>3</span><b class="chiffre-unite-encadre">5</b></strong><span>Son chiffre des unités est 5 : il est divisible par 5, mais pas par 2 ni par 10.</span></p>
        <p><strong class="nombre-unite-cours" aria-label="236, chiffre des unités 6"><span>2</span><span>3</span><b class="chiffre-unite-encadre">6</b></strong><span>Son chiffre des unités est 6 : il est divisible par 2, mais pas par 5 ni par 10.</span></p>
      </div>
    </article>`;
  }
  return `<article class="carte-cours-divisibilite">
    <span class="numero-cours">3</span>
    <h3>Pour 3 et 9, j’additionne tous les chiffres</h3>
    <ul class="regles-unites-cours regles-sommes-cours">
      <li><strong>Divisible par 3 :</strong><span>la somme de tous les chiffres est un multiple de 3.</span></li>
      <li><strong>Divisible par 9 :</strong><span>la somme de tous les chiffres est un multiple de 9.</span></li>
    </ul>
    <div class="exemples-sommes-cours">
      <section><p aria-label="3 plus 7 plus 2 égale 12"><b>3</b><i>+</i><b>7</b><i>+</i><b>2</b><i>=</i><strong>12</strong></p><span>12 est multiple de 3, mais pas de 9.</span><em>372 est divisible par 3, mais pas par 9.</em></section>
      <section><p aria-label="7 plus 2 plus 9 égale 18"><b>7</b><i>+</i><b>2</b><i>+</i><b>9</b><i>=</i><strong>18</strong></p><span>18 est multiple de 3 et de 9.</span><em>729 est divisible par 3 et par 9.</em></section>
    </div>
  </article>`;
}

function rendreCoursDivisibilite() {
  if (!etat.coursOuvert) return "";
  const derniere = pageCoursCourante === 2;
  const titresPages = [
    "Comprendre « divisible »",
    "Critères pour 2, 5 et 10",
    "Critères pour 3 et 9",
  ];
  const contenu = `<div class="cours-une-carte" aria-live="polite">${rendreCarteCoursDivisibilite(pageCoursCourante)}</div>`;
  const pied = `<nav class="navigation-cours" aria-label="Navigation dans le cours">
        <button class="bouton-secondaire" type="button" data-action="cours-precedent" ${pageCoursCourante === 0 ? "disabled" : ""}>Précédent</button>
        <div class="points-cours" aria-label="Page ${pageCoursCourante + 1} sur 3">${[0, 1, 2].map((page) => `<span class="${page === pageCoursCourante ? "actif" : ""}"></span>`).join("")}</div>
        <button class="bouton-principal" type="button" data-action="${derniere ? "fermer-cours" : "cours-suivant"}">${derniere ? "J’ai compris" : "Suivant"}</button>
      </nav>`;
  return rendreCadrePanneau({
    type: "cours",
    surtitre: `Cours · ${pageCoursCourante + 1} / 3`,
    titre: titresPages[pageCoursCourante],
    contenu,
    pied,
    classes: "panneau-cours-divisibilite",
  });
}

function rendreAideSolides(question) {
  if (!etat.aideOuverte) return "";
  const bloc = blocSolide(question);
  const indice = question.aide?.blocs?.[0]?.contenu ?? "Observe la forme du solide.";
  const contenu = `
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
    </section>`;
  return rendreCadrePanneau({
    type: "aide",
    titre: "Observe sans deviner",
    contenu,
    classes: "panneau-solides",
  });
}

function rendreCorrectionSolides(question) {
  if (!etat.correctionOuverte) return "";
  const bloc = blocSolide(question);
  const propriete = question.correction?.[0]?.contenu ?? "";
  const conclusion = question.correction?.[1]?.contenu ?? "";
  const contenu = `
    <section class="etape-correction correction-observation">
        ${rendreEtape(1, "Observer les propriétés", "repere-observation")}
        ${rendreSolide(bloc, { taille: 320, mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme) })}
        <p>${echapper(propriete)}</p>
    </section>
    <section class="etape-correction correction-conclusion">
        ${rendreEtape(2, "Nommer le solide", "repere-conclusion")}
        <p class="conclusion-solide">${echapper(conclusion)}</p>
    </section>`;
  return rendreCadrePanneau({
    type: "correction",
    titre: "Correction expliquée",
    contenu,
    classes: "panneau-solides",
  });
}

function rendreCoursReconnaissance() {
  if (!etat.coursOuvert) return "";
  const contenu = `
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
    </div>`;
  return rendreCadrePanneau({
    type: "cours",
    surtitre: "Mémo visuel",
    titre: "Les six solides à reconnaître",
    contenu,
  });
}

function rendreAideVolumes(question) {
  if (!etat.aideOuverte) return "";
  const bloc = blocSolide(question);
  const aides = question.aide?.blocs ?? [];
  const contenu = `
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
    </div>`;
  return rendreCadrePanneau({
    type: "aide",
    titre: "Calcul guidé",
    contenu,
    classes: "panneau-solides",
  });
}

function rendreCorrectionVolumes(question) {
  if (!etat.correctionOuverte) return "";
  const titres = ["Écrire la formule", "Remplacer par les données", "Calculer", "Conclure avec l'unité"];
  const contenu = `
    <div class="etapes-correction-volume">
        ${question.correction.map((bloc, index) => `<section class="etape-correction ${index === 3 ? "correction-conclusion" : "correction-observation"}">
          ${rendreEtape(index + 1, titres[index], index === 3 ? "repere-conclusion" : "repere-observation")}
          <p class="ligne-calcul-volume">${echapper(bloc.contenu)}</p>
        </section>`).join("")}
    </div>`;
  return rendreCadrePanneau({
    type: "correction",
    titre: "Correction expliquée",
    contenu,
    classes: "panneau-solides",
  });
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
  const contenu = `
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
    ${commandesRotation()}`;
  return rendreCadrePanneau({
    type: "cours",
    surtitre: "Cours à comprendre",
    titre: "Du cube unité à la formule",
    contenu,
  });
}

function baseQuestionCarres(question) {
  const puissanceQuestion = question.enonce.find((bloc) => bloc.type === "puissance")
    ?? question.correction?.find((bloc) => bloc.type === "puissance");
  if (puissanceQuestion) return puissanceQuestion.base;
  const baseExplicite = blocQuestion(question, "base")?.valeur;
  if (Number.isSafeInteger(baseExplicite)) return baseExplicite;
  const cible = question.enonce.find((bloc) =>
    bloc.type === "entier" && bloc.id.includes("cible"),
  )?.valeur;
  const racine = Math.sqrt(cible);
  return Number.isSafeInteger(racine) ? racine : null;
}

function cibleQuestionCarres(question) {
  return question.enonce.find((bloc) =>
    bloc.type === "entier" && bloc.id.includes("cible"),
  )?.valeur;
}

function valeurChampReponse(question, index = 0) {
  if (estEntrainement()) {
    return question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS
      ? etat.saisies[index]
      : etat.saisie;
  }
  if (!etat.reponseRevelee && !etat.correctionOuverte) return "";
  return String(
    question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS
      ? question.reponse.attendus[index]
      : question.reponse.attendu,
  );
}

function rendreCaseReponseCarres(question, index = 0, { puissance = false } = {}) {
  const valeur = valeurChampReponse(question, index);
  const modifiable = estEntrainement() && etat.validation === null;
  const active = question.reponse.type !== TYPE_REPONSE_DEUX_ENTIERS
    || etat.champSaisieActif === index;
  const classes = [
    "case-reponse-carres",
    valeur ? "remplie" : "",
    active && modifiable ? "active" : "",
    etat.validation?.juste ? "juste" : "",
    etat.validation && !etat.validation.juste ? "fausse" : "",
    puissance ? "case-puissance" : "",
  ].filter(Boolean).join(" ");
  const contenu = puissance
    ? versHtmlSemantique(puissanceNoeudSaisie(valeur))
    : echapper(valeur || (estEntrainement() ? "…" : "?"));
  const etiquette = valeur
    ? `Champ ${index + 1}, valeur ${valeur}`
    : `Champ ${index + 1} à compléter`;
  if (modifiable) {
    return `<button class="${classes}" type="button" data-action="champ-reponse" data-index="${index}"
      aria-label="${echapper(etiquette)}" aria-pressed="${active}">${contenu}</button>`;
  }
  return `<output class="${classes}" aria-label="${echapper(etiquette)}">${contenu}</output>`;
}

function puissanceNoeudSaisie(valeur) {
  return puissance(variable(valeur || "□"), 2);
}

function rendreCarreQuadrilleDansLecteur(options) {
  const dessin = dessinerCarreQuadrille(options);
  return `<figure class="visuel-carre-quadrille">${dessin.svg}</figure>`;
}

function rendreCalculAligne(base, signe, terme, resultat) {
  const carre = base * base;
  return `<div class="calcul-aligne" aria-label="${base} au carré ${signe} ${terme} égale ${resultat}">
    <p><span>${rendrePuissance(base)} ${echapper(signe)} ${terme}</span><span>=</span><span>${carre} ${echapper(signe)} ${terme}</span></p>
    <p><span aria-hidden="true"></span><span>=</span><strong>${resultat}</strong></p>
  </div>`;
}

function rendreDecompositionCarre(base) {
  const reste = base - 10;
  const resultat = base * base;
  return `<section class="decomposition-carre">
    <h4>${rendrePuissance(base)} : partager ${base} en 10 + ${reste}</h4>
    ${rendreCarreQuadrilleDansLecteur({
      cote: base,
      mode: "decomposition",
    })}
    <div class="calcul-decomposition" aria-label="Calcul détaillé de ${base} au carré">
      <p><span>${rendrePuissance(base)}</span><span>=</span><span>${base} × (10 + ${reste})</span></p>
      <p><span></span><span>=</span><span>${base} × 10 + ${base} × ${reste}</span></p>
      <p><span></span><span>=</span><span>${base * 10} + ${base * reste}</span></p>
      <p><span></span><span>=</span><strong>${resultat}</strong></p>
    </div>
  </section>`;
}

function rendreCarteCoursCarres(index) {
  if (index === 0) {
    return `<article class="carte-cours-carres">
      <span class="numero-cours">1</span>
      <h3>Un carré : autant de rangées que de colonnes</h3>
      <div class="cours-carre-sens">
        ${rendreCarreQuadrilleDansLecteur({
          cote: 4,
          mode: "sens",
          texteAlternatif: "Carré de quatre rangées et quatre colonnes",
        })}
        <div>
          <p>4 rangées de 4 carreaux donnent <strong>4 × 4 = 16</strong>.</p>
          <p class="chaine-carre">${rendrePuissance(4)} <span>=</span> <strong>4 × 4</strong> <span>=</span> <strong>16</strong></p>
          <p><strong>Le carré d'un nombre</strong> est le produit de ce nombre par lui-même.</p>
          <p class="alerte-carre">${rendrePuissance(4)} signifie 4 × 4, <strong>pas 4 × 2</strong>.</p>
        </div>
      </div>
    </article>`;
  }
  if (index === 1) {
    const bases = Array.from({ length: 13 }, (_, base) => base);
    return `<article class="carte-cours-carres">
      <span class="numero-cours">2</span>
      <h3>Les carrés de 0 à 12</h3>
      <div class="table-carres-cours">
        ${bases.map((base) =>
          `<p>${rendrePuissance(base)} <span>=</span> <span>${base} × ${base}</span> <span>=</span> <strong>${base * base}</strong></p>`,
        ).join("")}
      </div>
      <p class="definition-cours">Ces résultats sont des <strong>nombres carrés</strong>, aussi appelés <strong>carrés parfaits</strong>.</p>
    </article>`;
  }
  if (index === 2) {
    return `<article class="carte-cours-carres">
      <span class="numero-cours">3</span>
      <h3>Retrouver ${rendrePuissance(11)} et ${rendrePuissance(12)}</h3>
      <p class="introduction-decomposition">On découpe le carré après 10 colonnes. Les deux zones réunies forment toujours le carré entier.</p>
      <div class="grille-decompositions-carres">
        ${rendreDecompositionCarre(11)}
        ${rendreDecompositionCarre(12)}
      </div>
    </article>`;
  }
  if (index === 3) {
    return `<article class="carte-cours-carres">
      <span class="numero-cours">4</span>
      <h3>Aller dans les deux sens</h3>
      <div class="cours-deux-sens-carres">
        <section>
          <h4>Je calcule le carré</h4>
          <p class="chaine-carre">${rendrePuissance(8)} <span>=</span> 8 × 8 <span>=</span> <strong>64</strong></p>
          <p>Le carré de 8 est 64.</p>
        </section>
        <section>
          <h4>Je retrouve l'entier</h4>
          ${rendreCarreQuadrilleDansLecteur({
            cote: 8,
            mode: "cote-inconnu",
            texteAlternatif: "Carré contenant 64 carreaux dont les côtés égaux sont à retrouver",
          })}
          <p>64 = 8 × 8, donc l'entier recherché est <strong>8</strong>.</p>
        </section>
      </div>
    </article>`;
  }
  return `<article class="carte-cours-carres">
    <span class="numero-cours">5</span>
    <h3>Dans un calcul, je commence par le carré</h3>
    <div class="exemples-calcul-court">
      <section><p>Je calcule d'abord le carré, puis l'addition.</p>${rendreCalculAligne(7, "+", 1, 50)}</section>
      <section><p>Je calcule d'abord le carré, puis la soustraction.</p>${rendreCalculAligne(4, "−", 3, 13)}</section>
    </div>
  </article>`;
}

function rendreCoursCarres() {
  if (!etat.coursOuvert) return "";
  const total = nombrePagesCours();
  const titres = [
    "Comprendre « au carré »",
    "Les carrés de 0 à 12",
    "Retrouver 11² et 12²",
    "Direct et inverse",
    "Calculer dans le bon ordre",
  ];
  const derniere = pageCoursCourante === total - 1;
  const contenu = `<div class="cours-une-carte" aria-live="polite">${rendreCarteCoursCarres(pageCoursCourante)}</div>`;
  const pied = `<nav class="navigation-cours" aria-label="Navigation dans le cours">
    <button class="bouton-secondaire" type="button" data-action="cours-precedent" ${pageCoursCourante === 0 ? "disabled" : ""}>Précédent</button>
    <div class="points-cours" aria-label="Page ${pageCoursCourante + 1} sur ${total}">${Array.from({ length: total }, (_, page) => `<span class="${page === pageCoursCourante ? "actif" : ""}"></span>`).join("")}</div>
    <button class="bouton-principal" type="button" data-action="${derniere ? "fermer-cours" : "cours-suivant"}">${derniere ? "J’ai compris" : "Suivant"}</button>
  </nav>`;
  return rendreCadrePanneau({
    type: "cours",
    surtitre: `Cours · ${pageCoursCourante + 1} / ${total}`,
    titre: titres[pageCoursCourante],
    contenu,
    pied,
    classes: "panneau-cours-carres",
  });
}

function rendreAideCarres(question) {
  if (!etat.aideOuverte) return "";
  const famille = familleQuestion(question);
  const base = baseQuestionCarres(question) ?? 4;
  let visuel = "";
  if (famille === "calcul-direct" && base > 0) {
    visuel = rendreCarreQuadrilleDansLecteur({ cote: base, mode: "aire-inconnue" });
  }
  if (famille === "retrouver-entier" && base > 0) {
    visuel = rendreCarreQuadrilleDansLecteur({
      cote: base,
      mode: "cote-inconnu",
      texteAlternatif: `Carré contenant ${cibleQuestionCarres(question)} carreaux dont les côtés égaux sont inconnus`,
    });
  }
  if (famille === "carre-quadrille") {
    const trouverCote = Boolean(blocQuestion(question, "carre-quadrille-aire"));
    visuel = trouverCote
      ? rendreCarreQuadrilleDansLecteur({ cote: base, mode: "cote-inconnu" })
      : rendreCarreQuadrilleDansLecteur({
          cote: base,
          mode: "aire-inconnue",
          miseEnEvidence: { ligne: 1, colonne: 1 },
        });
  }
  const aides = question.aide?.blocs?.filter((bloc) => bloc.type === "texte") ?? [];
  const contenu = `${rendreRappelQuestion(question)}
    ${rendreAccesCoursDepuisAide()}
    ${visuel}
    <div class="etapes-aide-carres">
      ${aides.map((aide, index) => `<section class="outil-aide">
        ${rendreEtapeCarres(index + 1, aide.contenu, index === 0 ? "repere-observation" : "")}
      </section>`).join("")}
    </div>`;
  return rendreCadrePanneau({
    type: "aide",
    titre: "Me guider",
    contenu,
    classes: "panneau-carres",
  });
}

function rendreCorrectionCarres(question) {
  if (!etat.correctionOuverte) return "";
  const famille = familleQuestion(question);
  const base = baseQuestionCarres(question);
  const erreurDouble = famille === "calcul-direct"
    && Number(etat.saisie) === base * 2
    && Number(etat.saisie) !== question.reponse.attendu;
  const titres = {
    "calcul-direct": ["Lire", "Écrire le produit", "Calculer", "Conclure"],
    "retrouver-entier": ["Chercher le facteur répété", "Écrire le carré", "Vérifier", "Conclure"],
    "sens-notation": ["Traduire", "Écarter le produit par 2", "Écarter l'addition", "Écarter l'ajout de 2"],
    "reconnaitre-carres": ["Vérifier la première carte", "Vérifier la deuxième carte", "Vérifier la troisième carte", "Vérifier la quatrième carte"],
    "carre-quadrille": ["Lire les dimensions", "Écrire le produit", "Relier à l'écriture au carré", "Conclure"],
    "calcul-court": ["Calculer le carré", "Effectuer la seconde opération", "Conclure"],
  }[famille] ?? [];
  const blocs = question.correction ?? [];
  const correctionCalculCourt = famille === "calcul-court"
    ? (() => {
        const signe = texteBloc(question, "operation");
        const terme = blocQuestion(question, "terme")?.valeur;
        return `<section class="correction-calcul-aligne">
          <p>On calcule d'abord le carré, puis ${signe === "+" ? "la somme" : "la différence"}.</p>
          ${rendreCalculAligne(base, signe, terme, question.reponse.attendu)}
        </section>`;
      })()
    : "";
  const contenu = `${rendreRappelQuestion(question)}
    ${rendreReponseEleve(question)}
    ${erreurDouble ? `<p class="diagnostic-erreur-carre">Tu as calculé ${base} × 2. Le petit 2 demande deux facteurs égaux à ${base}.</p>` : ""}
    ${correctionCalculCourt || `<div class="etapes-correction-carres">
      ${blocs.map((bloc, index) => {
        const estConclusion = index === blocs.length - 1
          && !["sens-notation", "reconnaitre-carres"].includes(famille);
        return `<section class="etape-correction ${estConclusion ? "correction-conclusion" : "correction-observation"}">
        ${rendreEtape(index + 1, titres[index] ?? `Étape ${index + 1}`, estConclusion ? "repere-conclusion" : "repere-observation")}
        <p class="ligne-correction-carres">${bloc.type === "puissance"
          ? `${rendrePuissance(bloc.base, bloc.exposant)} <span>=</span> <strong>${bloc.base} × ${bloc.base}</strong>`
          : rendreBlocMathematique(bloc)}</p>
      </section>`;
      }).join("")}
    </div>`}
    ${rendreReponseCorrecte(question)}`;
  return rendreCadrePanneau({
    type: "correction",
    surtitre: "Après la réponse",
    titre: "Correction expliquée",
    contenu,
    classes: "panneau-carres",
  });
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
    ${entrainement ? '<p class="indication-clavier-physique">Touches 0 à 9 · Retour arrière pour effacer · Entrée pour valider</p>' : ""}
  </section>`;
}

function rendreMotifChiffreManquant(question) {
  const motif = texteBloc(question, "nombre-a-completer");
  const saisieDansLaCase = question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL;
  const contenu = [...motif].map((caractere) => {
    if (caractere !== "□") return `<span>${echapper(caractere)}</span>`;
    if (!saisieDansLaCase) {
      return '<span class="symbole-chiffre-manquant" aria-label="Case à compléter">□</span>';
    }
    const valeur = estEntrainement()
      ? etat.saisie
      : etat.reponseRevelee
        ? String(question.reponse.attendu)
        : "";
    return `<output class="case-chiffre-manquant ${valeur ? "remplie" : ""}" aria-live="polite" aria-atomic="true"
      aria-label="${valeur ? `Chiffre saisi : ${echapper(valeur)}` : "Case à compléter"}">${echapper(valeur)}</output>`;
  }).join("");
  return `<p class="nombre-a-completer">${contenu}</p>`;
}

function rendrePaveMathsgo(question) {
  if (
    !estEntrainement()
    || etat.validation !== null
    || !estReponseNumerique(question)
  ) return "";
  const disposition = obtenirDispositionClavier("entier-naturel");
  const touches = disposition.touches.map((touche) => {
    const attributAction = touche.action === ACTION_TOUCHE_SAISIR
      ? `data-action="chiffre" data-value="${echapper(touche.valeur)}"`
      : touche.action === ACTION_TOUCHE_EFFACER
        ? 'data-action="effacer-saisie"'
        : touche.action === ACTION_TOUCHE_VALIDER
          ? 'data-action="valider"'
          : "";
    return `<button class="${echapper(touche.classe)}" type="button" ${attributAction}
      ${touche.ariaLabel ? `aria-label="${echapper(touche.ariaLabel)}"` : ""}>${echapper(touche.libelle)}</button>`;
  }).join("");
  return `<section class="pave-mathsgo-dock" aria-label="Saisie de la réponse">
    <div class="clavier-mathsgo" data-profil="${disposition.id}"
      style="--colonnes-clavier: ${disposition.colonnes}" aria-label="Clavier chiffres">
      ${touches}
    </div>
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
  if (famille === "chiffre-manquant") return "grille-chiffres";
  if (famille === "partage-court") {
    const ouiNon = question.reponse.choix?.length === 2
      && question.reponse.choix.every((choix) => ["oui", "non"].includes(choix.id));
    return `grille-partage ${ouiNon ? "grille-oui-non" : ""}`;
  }
  if (famille === "critere-precis") return "grille-oui-non";
  return "";
}

function rendreZoneReponseDivisibilite(question) {
  if (question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL) {
    if (familleQuestion(question) === "chiffre-manquant") {
      return estEntrainement()
        ? '<p class="indication-clavier-physique">Touches 0 à 9 · Retour arrière pour effacer · Entrée pour valider</p>'
        : "";
    }
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
      <p class="nombre-question">${echapper(nombreQuestion(question))}</p>`;
  }
  if (famille === "selection-nombres") {
    return `<h1>${echapper(texteBloc(question, "consigne"))}</h1>
      <p class="precision">Plusieurs réponses peuvent être correctes.</p>`;
  }
  if (famille === "chiffre-manquant") {
    return `<h1>${echapper(texteBloc(question, "consigne"))}</h1>
      ${rendreMotifChiffreManquant(question)}
      <p class="precision">${question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL ? "Entre un chiffre." : "Plusieurs chiffres sont peut-être possibles."}</p>`;
  }
  if (famille === "partage-court") {
    const ouiNon = question.reponse.choix?.length === 2
      && question.reponse.choix.every((choix) => ["oui", "non"].includes(choix.id));
    return `<h1>Partager sans reste</h1>
      <p class="situation-question">${rendrePhraseStructuree(question)}</p>
      ${rendrePlateauPartage(question)}
      ${ouiNon ? "" : `<p class="precision">${question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL ? "Entre le plus petit nombre à retirer." : "Plusieurs réponses peuvent être correctes."}</p>`}`;
  }
  return `<h1>${echapper(question.enonce[0]?.contenu ?? "Question")}</h1>`;
}

function rendreCoqueLecteur(question, carteQuestion) {
  const entrainement = estEntrainement();
  const paveActif = entrainement
    && etat.validation === null
    && estReponseNumerique(question);
  return `
    <div class="${classesLecteur()} ${paveActif ? "avec-pave" : ""}">
      ${rendreEntete()}
      <div class="espace-lecteur">
        <div class="zone-question-scroll" data-question-index="${etat.seance.etat.indexQuestion}">${carteQuestion}</div>
        ${rendreAide(question)}
        ${rendreCorrection(question)}
        ${rendreCours()}
      </div>
      <footer class="dock-question ${paveActif ? "dock-avec-pave" : ""}">
        ${rendrePaveMathsgo(question)}
        ${entrainement ? rendreBarreEleve(question) : rendreBarreEnseignant()}
      </footer>
      ${rendreMenuSession()}
    </div>`;
}

function rendreQuestionDivisibilite() {
  const question = questionCourante(etat);
  const entrainement = estEntrainement();
  const carteQuestion = `<main class="carte-question carte-question-divisibilite famille-${echapper(familleQuestion(question))}">
    <p class="etiquette-notion">${echapper(nomNotion())}</p>
    ${rendreContenuQuestionDivisibilite(question)}
    ${rendreZoneReponseDivisibilite(question)}
    ${entrainement ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
  </main>`;
  return rendreCoqueLecteur(question, carteQuestion);
}

function rendreQuestionSolides() {
  const question = questionCourante(etat);
  const bloc = blocSolide(question);
  const entrainement = estEntrainement();
  const carteQuestion = `<main class="carte-question carte-question-solides">
    <p class="etiquette-notion">${echapper(nomNotion())}</p>
    <h1>${echapper(question.enonce[0].contenu)}</h1>
    ${rendreSolide(bloc, { taille: entrainement ? 320 : 400 })}
    <p class="precision">${entrainement ? "Choisis une seule réponse." : "Choisissez le nom du solide."}</p>
    <div class="grille-choix grille-solides ${entrainement ? "" : "grille-projection"}"
      role="${entrainement ? "radiogroup" : "group"}" aria-label="Noms proposés">
      ${rendreChoix(question)}
    </div>
    ${entrainement ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
  </main>`;
  return rendreCoqueLecteur(question, carteQuestion);
}

function rendreQuestionVolumes() {
  const question = questionCourante(etat);
  const bloc = blocSolide(question);
  const entrainement = estEntrainement();
  const carteQuestion = `<main class="carte-question carte-question-solides carte-question-volumes">
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
  </main>`;
  return rendreCoqueLecteur(question, carteQuestion);
}

function rendreContenuQuestionCarres(question) {
  const famille = familleQuestion(question);
  const base = baseQuestionCarres(question);
  const consigne = question.enonce.find((bloc) => bloc.type === "texte")?.contenu
    ?? "Complète.";
  if (famille === "calcul-direct") {
    const questionVerbale = blocQuestion(question, "consigne-carre-de") !== undefined;
    const qcmDirect = question.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE;
    const encadrement = blocQuestion(question, "consigne-encadrer-resultat") !== undefined;
    if (qcmDirect) {
      return encadrement
        ? `<h1>Quel encadrement est correct ?</h1>
          <p class="expression-question-carres">${rendrePuissance(base)}</p>
          <p class="precision">Choisis une seule réponse.</p>`
        : `<h1>Quel est le carré de ${base} ?</h1>
          <p class="precision">Choisis une seule réponse.</p>`;
    }
    return questionVerbale
      ? `<h1>${echapper(consigne)} ${base} ?</h1>
        <p class="egalite-carres phrase-reponse-carres"><span>Le carré de ${base} est</span>${rendreCaseReponseCarres(question)}<span>.</span></p>`
      : `<h1>${echapper(consigne)}</h1>
        <p class="egalite-carres">${rendrePuissance(base)} <span>=</span> ${rendreCaseReponseCarres(question)}</p>`;
  }
  if (famille === "retrouver-entier") {
    const cible = cibleQuestionCarres(question);
    if (blocQuestion(question, "produit-facteurs-egaux-cible")) {
      return `<h1>${echapper(consigne)}</h1>
        <p class="egalite-carres egalite-deux-champs"><strong>${cible}</strong><span>=</span>
          ${rendreCaseReponseCarres(question, 0)}<span>×</span>${rendreCaseReponseCarres(question, 1)}</p>
        <p class="precision">Remplis les deux cases.</p>`;
    }
    if (blocQuestion(question, "egalite-carre-cible")) {
      return `<h1>${echapper(consigne)}</h1>
        <p class="egalite-carres">${rendreCaseReponseCarres(question, 0, { puissance: true })}<span>=</span><strong>${cible}</strong></p>`;
    }
    return `<h1>${echapper(consigne)} ${cible} ?</h1>
      <p class="egalite-carres phrase-reponse-carres"><span>L'entier recherché est</span>${rendreCaseReponseCarres(question)}<span>.</span></p>`;
  }
  if (famille === "sens-notation") {
    return `<h1>${echapper(consigne)}</h1>
      <p class="expression-question-carres">${rendrePuissance(base)}</p>
      <p class="precision">Choisis une seule réponse.</p>`;
  }
  if (famille === "reconnaitre-carres") {
    return `<h1>${echapper(consigne)}</h1>
      <p class="precision">Il peut y avoir une ou plusieurs réponses.</p>`;
  }
  if (famille === "carre-quadrille") {
    const trouverCote = Boolean(blocQuestion(question, "carre-quadrille-aire"));
    const motCarreau = base === 1 ? "carreau" : "carreaux";
    const questionComplete = trouverCote
      ? `${consigne} ${base * base} ${texteBloc(question, "question-trouver-cote")}`
      : `Ce carré a ${base} ${motCarreau} sur chaque côté. Combien en contient-il en tout ?`;
    return `<h1>${echapper(questionComplete)}</h1>
      ${trouverCote
        ? rendreCarreQuadrilleDansLecteur({
            cote: base,
            mode: "cote-inconnu",
            texteAlternatif: `Carré contenant ${base * base} carreaux, avec deux côtés égaux à retrouver`,
          })
        : rendreCarreQuadrilleDansLecteur({
            cote: base,
            mode: "aire-inconnue",
            texteAlternatif: `Carré quadrillé de ${base} rangées et ${base} colonnes, aire à calculer`,
          })}
      <p class="egalite-carres phrase-reponse-carres"><span>${trouverCote ? "Chaque côté compte" : "Nombre total de carreaux :"}</span>
        ${rendreCaseReponseCarres(question)}<span>${trouverCote ? `${motCarreau}.` : ""}</span></p>`;
  }
  if (famille === "calcul-court") {
    const signe = texteBloc(question, "operation");
    const terme = blocQuestion(question, "terme")?.valeur;
    return `<h1>${echapper(consigne)}</h1>
      <p class="egalite-carres calcul-court-question">${rendrePuissance(base)}<span>${echapper(signe)}</span><strong>${terme}</strong><span>=</span>${rendreCaseReponseCarres(question)}</p>
      <p class="precision">Calcule d'abord le carré.</p>`;
  }
  return `<h1>${echapper(consigne)}</h1>`;
}

function rendreZoneReponseCarres(question) {
  if (estReponseNumerique(question)) {
    return estEntrainement()
      ? '<p class="indication-clavier-physique">Touches 0 à 9 · Clique sur une case pour la choisir · Retour arrière pour effacer · Entrée pour valider</p>'
      : "";
  }
  const famille = familleQuestion(question);
  return `<div class="grille-choix ${famille === "reconnaitre-carres" ? "grille-carres-multiples" : "grille-carres-qcm"} ${estEntrainement() ? "" : "grille-projection"}"
    role="${question.reponse.type === "choix-unique" && estEntrainement() ? "radiogroup" : "group"}"
    aria-label="Réponses proposées">${rendreChoix(question)}</div>`;
}

function rendreQuestionCarres() {
  const question = questionCourante(etat);
  const carteQuestion = `<main class="carte-question carte-question-carres famille-${echapper(familleQuestion(question))}">
    <p class="etiquette-notion">${echapper(nomNotion())}</p>
    ${rendreContenuQuestionCarres(question)}
    ${rendreZoneReponseCarres(question)}
    ${estEntrainement() ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
  </main>`;
  return rendreCoqueLecteur(question, carteQuestion);
}

const RENDUS_COURS = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreCoursDivisibilite,
  [RENDU_CARRES]: rendreCoursCarres,
  [RENDU_SOLIDE]: rendreCoursReconnaissance,
  [RENDU_VOLUME]: rendreCoursVolumes,
});

const RENDUS_AIDE = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreAideDivisibilite,
  [RENDU_CARRES]: rendreAideCarres,
  [RENDU_SOLIDE]: rendreAideSolides,
  [RENDU_VOLUME]: rendreAideVolumes,
});

const RENDUS_CORRECTION = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreCorrectionDivisibilite,
  [RENDU_CARRES]: rendreCorrectionCarres,
  [RENDU_SOLIDE]: rendreCorrectionSolides,
  [RENDU_VOLUME]: rendreCorrectionVolumes,
});

const RENDUS_QUESTION = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreQuestionDivisibilite,
  [RENDU_CARRES]: rendreQuestionCarres,
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
        <button class="bouton-principal bouton-large" data-action="nouvelle-serie">Nouvelle série</button>
        <button class="bouton-secondaire bouton-large" data-action="recommencer">Refaire la même série</button>
        <button class="bouton-secondaire bouton-large" data-action="retour-menu">Choisir une autre série</button>
      </div>
    </main>`;
}

function rendre({
  focusPanneau = false,
  focusSelector = "",
  reinitialiserDefilementPanneau = false,
} = {}) {
  const panneauAvant = application.querySelector?.(".panneau");
  const idPanneauAvant = panneauAvant?.id ?? "";
  const positionPanneau = panneauAvant?.querySelector?.(".corps-panneau")?.scrollTop ?? 0;
  const zoneQuestionAvant = application.querySelector?.(".zone-question-scroll");
  const indexQuestionAvant = zoneQuestionAvant?.dataset?.questionIndex ?? "";
  const positionQuestion = zoneQuestionAvant?.scrollTop ?? 0;
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
  const panneau = application.querySelector?.(".panneau");
  const corpsPanneau = panneau?.querySelector?.(".corps-panneau");
  const zoneQuestion = application.querySelector?.(".zone-question-scroll");
  const doitRestaurerQuestion = zoneQuestion?.dataset?.questionIndex === indexQuestionAvant
    && positionQuestion > 0;
  const doitRestaurerDefilement = !reinitialiserDefilementPanneau
    && panneau?.id === idPanneauAvant
    && positionPanneau > 0;
  if (doitRestaurerDefilement && corpsPanneau) corpsPanneau.scrollTop = positionPanneau;
  if (doitRestaurerQuestion && zoneQuestion) zoneQuestion.scrollTop = positionQuestion;
  const cibleFocus = focusPanneau
    ? application.querySelector(".menu-session button, .panneau .fermer")
    : focusSelector
      ? application.querySelector(focusSelector)
      : null;
  if (cibleFocus) {
    try {
      cibleFocus.focus({ preventScroll: true });
    } catch {
      cibleFocus.focus();
    }
  }
  if (doitRestaurerDefilement && corpsPanneau) {
    corpsPanneau.scrollTop = positionPanneau;
    globalThis.requestAnimationFrame?.(() => {
      corpsPanneau.scrollTop = positionPanneau;
    });
  }
  if (doitRestaurerQuestion && zoneQuestion) {
    zoneQuestion.scrollTop = positionQuestion;
    globalThis.requestAnimationFrame?.(() => {
      zoneQuestion.scrollTop = positionQuestion;
    });
  }
}

application.addEventListener("click", (evenement) => {
  const cible = evenement.target.closest("[data-action]");
  if (!cible) return;
  const action = cible.dataset.action;
  if (action === "interieur-menu") return;
  let focusPanneau = false;
  let focusSelector = "";
  let reinitialiserDefilementPanneau = false;
  if (action === "choisir-mode") {
    configurationMenu.mode = cible.dataset.value === "tableau" ? "tableau" : "entrainement";
  }
  if (action === "choisir-volume") {
    const volume = Number(cible.dataset.value);
    if (VOLUMES_MENU.includes(volume)) configurationMenu.nombreQuestions = volume;
  }
  if (action === "choisir-notion") {
    const notionDemandee = cible.dataset.value;
    if (DOMAINES_MENU.some((domaine) => domaine.notions.includes(notionDemandee))) {
      configurationMenu.notion = configurationMenu.notion === notionDemandee
        ? null
        : notionDemandee;
    }
  }
  if (action === "preparer") {
    if (!configurationMenu.notion || !connaitNotionLecteur(configurationMenu.notion)) return;
    etat = creerEtatLecteur({
      ...configurationMenu,
      graine: creerGraineSerie(),
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
  if (action === "champ-reponse") {
    selectionnerChampSaisie(etat, Number(cible.dataset.index));
    focusSelector = `[data-action="champ-reponse"][data-index="${cible.dataset.index}"]`;
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
    pageCoursCourante = 0;
    ouvrirCours(etat);
    focusPanneau = etat.coursOuvert;
  }
  if (action === "cours-precedent") {
    pageCoursCourante = Math.max(0, pageCoursCourante - 1);
    reinitialiserDefilementPanneau = true;
    focusSelector = '[data-action="cours-precedent"]';
  }
  if (action === "cours-suivant") {
    const dernierePage = nombrePagesCours() - 1;
    pageCoursCourante = Math.min(dernierePage, pageCoursCourante + 1);
    reinitialiserDefilementPanneau = true;
    focusSelector = pageCoursCourante === dernierePage
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
  if (action === "nouvelle-serie") {
    etat = creerEtatLecteur({
      ...etat.configuration,
      graine: creerGraineSerie(),
    });
    menuAccueilOuvert = false;
  }
  rendre({ focusPanneau, focusSelector, reinitialiserDefilementPanneau });
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
  if (!question || !estReponseNumerique(question)) return;
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
