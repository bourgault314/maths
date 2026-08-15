import {
  COULEURS,
  RAYONS,
  TYPOGRAPHIE,
} from "../packages/charte/src/charte.js?v=30";
import {
  avancerFractionAide,
  avancerCorrespondanceAide,
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
  notionCourante,
  ouvrirAide,
  ouvrirCorrection,
  ouvrirCours,
  passerQuestionSuivante,
  questionCourante,
  recommencer,
  revelerReponse,
  selectionnerChampSaisie,
  selectionnerRepereAide,
  choisirRangFractionAide,
  grouperUniteFractionAide,
  positionnerFractionAide,
  saisirCaractere,
  saisirChiffre,
  tournerSolide,
  validerReponse,
} from "./src/etat-lecteur.js?v=30";
import {
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  TYPE_REPONSE_CHOIX_UNIQUE,
} from "../packages/contrats/src/question-v2.js?v=30";
import {
  connaitNotionLecteur,
  obtenirNotionLecteur,
  RENDU_CARRES,
  RENDU_DIVISIBILITE,
  RENDU_FRACTIONS_DECIMAUX,
  RENDU_SOLIDE,
  RENDU_VOLUME,
  NOTION_FRACTIONS_SIMPLES_DECIMAUX,
} from "./src/registre-lecteur.js?v=30";
import {
  DOMAINES_AUTOMATISMES,
  MICRO_NOTIONS_AUTOMATISMES,
  normaliserIdentifiantMicroNotion,
} from "../packages/automatismes/src/identifiants.js?v=30";
import { COURS_SOLIDES_USUELS } from "../packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js?v=30";
import {
  creerCone,
  creerCube,
  creerCylindre,
  creerPave,
  creerPrisme,
  creerPyramide,
  dessinerSolide,
} from "../packages/objets/src/solides.js?v=30";
import {
  ACTION_TOUCHE_EFFACER,
  ACTION_TOUCHE_SAISIR,
  ACTION_TOUCHE_VALIDER,
  obtenirDispositionClavier,
} from "../packages/objets/src/clavier.js?v=30";
import { formulationCritereDivisibilite } from "../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/critere-precis.js?v=30";
import {
  caseVide,
  difference,
  egalite,
  groupe,
  inferieurStrict,
  nombre,
  produit,
  puissance,
  quotient,
  somme,
  texteCourt,
  variable,
  versHtmlEgalitesAlignees,
  versHtmlSemantique,
} from "../packages/objets/src/expressions.js?v=30";
import {
  dessinerCarreQuadrille,
} from "../packages/objets/src/carre-quadrille.js?v=30";
import { dessinerGrilleFraction } from "../packages/objets/src/fractions.js?v=30";
import { dessinerDoubleDroiteGraduee } from "../packages/objets/src/droite-graduee.js?v=30";
import { dessinerBandesFractionnairesSurRailDecimal } from "../packages/objets/src/bandes-fractions-rail.js?v=30";
import {
  dessinerMaterielNumerationDecimale,
  dessinerTableauNumerationDecimale,
} from "../packages/objets/src/numeration-decimale.js?v=30";
import {
  dessinerDemiAvecDixiemes,
  dessinerReorganisationCentiemes,
} from "../packages/objets/src/correspondances-decimales.js?v=30";
import {
  construireDonneesTableauDepuisFraction,
  formaterFractionEnDecimal,
  reduireFraction,
} from "../packages/objets/src/fractions-decimaux.js?v=30";
import {
  diagnostiquerDecimalVersNumerateur,
  diagnostiquerFractionLibre,
  diagnostiquerFractionVersDecimal,
} from "./src/diagnostic-fractions-decimaux.js?v=30";

const MICRO_NOTION_FRACTION_VERS_DECIMAL =
  MICRO_NOTIONS_AUTOMATISMES.FRACTION_VERS_DECIMAL;
const MICRO_NOTION_DECIMAL_VERS_FRACTION =
  MICRO_NOTIONS_AUTOMATISMES.DECIMAL_VERS_FRACTION;

const application = document.querySelector("#application");
const rechercheInitiale = window.location.search;
let etat = creerEtatLecteur(lireConfiguration(rechercheInitiale));
let menuAccueilOuvert = rechercheInitiale.length === 0;
let menuSessionOuvert = false;
let pageCoursCourante = 0;
let compteurSeries = 0;
const VOLUMES_MENU = Object.freeze([5, 10, 15, 20]);
let configurationMenu = {
  mode: etat.configuration.mode,
  aide: etat.configuration.aide,
  nombreQuestions: VOLUMES_MENU.includes(etat.configuration.nombreQuestions)
    ? etat.configuration.nombreQuestions
    : 10,
  notions: [...etat.configuration.notions],
};

function creerGraineSerie() {
  compteurSeries += 1;
  return `serie-${Date.now()}-${compteurSeries}`;
}

const DOMAINES_MENU = Object.freeze([
  Object.freeze({
    id: DOMAINES_AUTOMATISMES.NC,
    nom: "Nombres et calculs",
    notions: Object.freeze([
      NOTION_NC01,
      NOTION_NC02,
      NOTION_FRACTIONS_SIMPLES_DECIMAUX,
    ]),
  }),
  Object.freeze({
    id: DOMAINES_AUTOMATISMES.AL,
    nom: "Calcul littéral et algèbre",
    notions: Object.freeze([]),
  }),
  Object.freeze({
    id: DOMAINES_AUTOMATISMES.PF,
    nom: "Proportionnalité et fonctions",
    notions: Object.freeze([]),
  }),
  Object.freeze({
    id: DOMAINES_AUTOMATISMES.GM,
    nom: "Grandeurs et mesures",
    notions: Object.freeze([]),
  }),
  Object.freeze({
    id: DOMAINES_AUTOMATISMES.GE,
    nom: "Espace et géométrie",
    notions: Object.freeze([]),
  }),
  Object.freeze({
    id: DOMAINES_AUTOMATISMES.DS,
    nom: "Données, statistiques et probabilités",
    notions: Object.freeze([]),
  }),
  Object.freeze({
    id: DOMAINES_AUTOMATISMES.PI,
    nom: "Pensée informatique",
    notions: Object.freeze([]),
  }),
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
  [NOTION_FRACTIONS_SIMPLES_DECIMAUX]: Object.freeze({
    titre: "Fractions simples et décimaux",
    precision: "Dans les deux sens",
  }),
});

function identifiantNotionContexte() {
  if (etat.coursOuvert && etat.notionCoursOuverte) return etat.notionCoursOuverte;
  return notionCourante(etat) ?? etat.configuration.notions[0];
}

function definitionNotion(id = identifiantNotionContexte()) {
  return obtenirNotionLecteur(id);
}

function nomNotion(id = identifiantNotionContexte()) {
  return definitionNotion(id).nom;
}

function estEntrainement() {
  return etat.configuration.mode === "entrainement";
}

function aCoursNotion() {
  return definitionNotion().capacites.cours;
}

function estReponseNumerique(question) {
  return [
    TYPE_REPONSE_ENTIER_NATUREL,
    TYPE_REPONSE_DEUX_ENTIERS,
    TYPE_REPONSE_NOMBRE_DECIMAL,
    TYPE_REPONSE_FRACTION_EQUIVALENTE,
  ]
    .includes(question.reponse.type);
}

function rendrePuissance(base, exposant = 2) {
  return versHtmlSemantique(puissance(nombre(base), exposant));
}

function rendreNombreMathematique(valeur) {
  return versHtmlSemantique(nombre(valeur));
}

function noeudProduitCarre(base) {
  return produit(nombre(base), nombre(base));
}

function rendreProduitCarre(base) {
  return versHtmlSemantique(noeudProduitCarre(base));
}

function noeudRegleCarre() {
  return egalite(
    puissance(variable("a"), 2),
    produit(variable("a"), variable("a")),
  );
}

function rendreRegleCarre() {
  return versHtmlSemantique(noeudRegleCarre());
}

function rendreEgaliteCarre(base, { avecResultat = true } = {}) {
  const membres = [puissance(nombre(base), 2), noeudProduitCarre(base)];
  if (avecResultat) membres.push(nombre(base * base));
  return versHtmlSemantique(egalite(...membres));
}

function noeudChoixSensNotation(base, id) {
  if (id === "produit-facteurs-egaux") return noeudProduitCarre(base);
  if (id === "produit-par-deux") return produit(nombre(base), nombre(2));
  if (id === "somme-double") return somme(nombre(base), nombre(base));
  if (id === "somme-plus-deux") return somme(nombre(base), nombre(2));
  return null;
}

function rendreLibelleChoixCarres(question, choix) {
  if (familleQuestion(question) !== "sens-notation") return echapper(choix.libelle);
  const expression = noeudChoixSensNotation(baseQuestionCarres(question), choix.id);
  return expression ? versHtmlSemantique(expression) : echapper(choix.libelle);
}

function rendreTexteAvecExpression(texte, fragment, expression) {
  const position = texte.indexOf(fragment);
  if (position < 0) return echapper(texte);
  return `${echapper(texte.slice(0, position))}${versHtmlSemantique(expression)}${echapper(texte.slice(position + fragment.length))}`;
}

function nombrePagesCours() {
  return definitionNotion().pagesCours;
}

function definitionsSelectionnees(notions = etat.configuration.notions) {
  return notions.map(obtenirNotionLecteur);
}

function libelleNombreAutomatismes(nombre) {
  return `${nombre} automatisme${nombre === 1 ? "" : "s"}`;
}

function quotasEquilibres(nombreNotions, nombreQuestions) {
  if (nombreNotions < 1) return [];
  const minimum = Math.floor(nombreQuestions / nombreNotions);
  const reste = nombreQuestions % nombreNotions;
  return Array.from(
    { length: nombreNotions },
    (_, index) => minimum + (index < reste ? 1 : 0),
  );
}

function libelleRepartition(nombreNotions, nombreQuestions) {
  if (nombreNotions <= 1) return "";
  const quotas = quotasEquilibres(nombreNotions, nombreQuestions);
  return new Set(quotas).size === 1
    ? `${quotas[0]} par automatisme`
    : `répartition ${quotas.join(" + ")}`;
}

function trierNotionsMenu(notions) {
  const ordre = DOMAINES_MENU.flatMap((domaine) => domaine.notions);
  const selection = new Set(notions);
  return ordre.filter((notion) => selection.has(notion));
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
document.documentElement.style.setProperty("--mg-mathematiques", TYPOGRAPHIE.mathematiques);
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
  const selection = new Set(configurationMenu.notions);
  return DOMAINES_MENU
    .filter((domaine) => domaine.notions.length > 0)
    .map((domaine) => {
      const nombreSelectionne = domaine.notions.filter((notion) => selection.has(notion)).length;
      const selectionnee = nombreSelectionne > 0;
      const complete = nombreSelectionne === domaine.notions.length;
      return `<details class="theme-group ${selectionnee ? "has-selection" : ""} ${complete ? "is-complete" : ""}"
        data-theme="numbers" open>
        <summary class="theme-summary">
          <span class="theme-icon" aria-hidden="true">${rendreIconeNombresCalculs()}</span>
          <span class="theme-name">${echapper(domaine.nom)}</span>
          <span class="theme-count">${nombreSelectionne} / ${domaine.notions.length} <span class="theme-count-label">sélectionné${nombreSelectionne > 1 ? "s" : ""}</span></span>
          <span class="theme-chevron" aria-hidden="true"></span>
        </summary>
        <div class="theme-items">
          <div class="module-subgroup-items">
            ${domaine.notions.map((idNotion) => {
              const libelle = LIBELLES_MODULES_MENU[idNotion];
              const estSelectionnee = selection.has(idNotion);
              return `<label class="modrow ${estSelectionnee ? "is-selected" : ""}">
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
  const nombreSelectionne = configurationMenu.notions.length;
  const selectionValide = nombreSelectionne > 0
    && configurationMenu.notions.every(connaitNotionLecteur)
    && nombreSelectionne <= configurationMenu.nombreQuestions;
  const repartition = libelleRepartition(
    nombreSelectionne,
    configurationMenu.nombreQuestions,
  );
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
                  aria-pressed="${configurationMenu.nombreQuestions === volume}"
                  ${volume < nombreSelectionne ? "disabled" : ""}>${volume}</button>`).join("")}
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

    <div class="setup-action-shell ${selectionValide ? "" : "is-empty"}" aria-label="Résumé et lancement de la série">
      <div class="setup-action-bar">
        <div class="setup-summary" aria-live="polite">
          <strong>${selectionValide ? `${libelleNombreAutomatismes(nombreSelectionne)} sélectionné${nombreSelectionne === 1 ? "" : "s"}` : "Choisis au moins un automatisme"}</strong>
          <span>${configurationMenu.nombreQuestions} questions${repartition ? ` · ${echapper(repartition)}` : ""} · ${libelleMode(configurationMenu.mode)}</span>
        </div>
        <div class="launch-cluster">
          <span class="dnb-launch-context" role="img" aria-label="Épreuve DNB sans calculatrice" title="Épreuve sans calculatrice">
            ${rendreIconeCalculatriceBarree()}
          </span>
          <button class="generate-action" type="button" data-action="preparer" ${selectionValide ? "" : "disabled"}>Lancer la série</button>
        </div>
      </div>
    </div>
  </main>`;
}

function rendreListeNotionsSelectionnees({ compacte = false } = {}) {
  const definitions = definitionsSelectionnees();
  if (definitions.length === 1) return echapper(definitions[0].nom);
  const classe = compacte ? "liste-notions-selectionnees compacte" : "liste-notions-selectionnees";
  return `<ul class="${classe}" aria-label="Automatismes de la série">
    ${definitions.map(({ nom }) => `<li>${echapper(nom)}</li>`).join("")}
  </ul>`;
}

function rendreAccesCoursAvantSerie() {
  const cours = definitionsSelectionnees().filter(({ capacites }) => capacites.cours);
  if (cours.length === 0) return "";
  if (cours.length === 1) {
    return `<button class="bouton-secondaire bouton-large" data-action="cours-notion"
      data-notion="${echapper(cours[0].id)}">Voir le cours</button>`;
  }
  return `<details class="choix-cours-pret">
    <summary class="bouton-secondaire bouton-large">Voir les cours</summary>
    <nav class="liste-cours-pret" aria-label="Cours des automatismes sélectionnés">
      ${cours.map(({ id, nom }) => `<button class="bouton-secondaire" type="button"
        data-action="cours-notion" data-notion="${echapper(id)}">${echapper(nom)}</button>`).join("")}
    </nav>
  </details>`;
}

function rendreEcranPret() {
  const entrainement = estEntrainement();
  const nombreNotions = etat.configuration.notions.length;
  const repartition = libelleRepartition(nombreNotions, etat.configuration.nombreQuestions);
  return `
    <main class="ecran-pret ${etat.coursOuvert ? "cours-pret-ouvert" : ""}">
      <button class="retour-lancement" type="button" data-action="retour-menu">← Modifier</button>
      ${rendreMarque()}
      <p class="surtitre">Préparation au brevet</p>
      <h1>${entrainement ? "Prêt à t'entraîner ?" : "Prêt pour la classe ?"}</h1>
      <section class="resume-seance" aria-label="Contenu de la séance">
        <strong>${nombreNotions === 1 ? echapper(nomNotion(etat.configuration.notions[0])) : `${libelleNombreAutomatismes(nombreNotions)} sélectionnés`}</strong>
        ${nombreNotions === 1 ? "" : rendreListeNotionsSelectionnees()}
        <span>${etat.configuration.nombreQuestions} ${etat.configuration.nombreQuestions === 1 ? "question" : "questions"}${repartition ? ` · ${echapper(repartition)}` : ""}</span>
      </section>
      <div class="actions-pret">
        ${rendreAccesCoursAvantSerie()}
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
        <button class="bouton-entete bouton-menu" data-action="menu"
          aria-label="Menu" aria-expanded="${menuSessionOuvert}">
          <span aria-hidden="true">☰</span><strong>Menu</strong>
        </button>
        <button class="bouton-entete bouton-aide-entete" data-action="aide"
          aria-label="Aide"
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

function rendreChoix(question, rendreLibelle = (choix) => echapper(choix.libelle)) {
  const entrainement = estEntrainement();
  const correctionVisible = entrainement
    ? etat.correctionOuverte
    : etat.reponseRevelee || etat.correctionOuverte;
  return question.reponse.choix.map((choix) => {
    const selectionne = etat.selection.includes(choix.id);
    const attendu = question.reponse.attendus.includes(choix.id);
    // Après validation, un QCM doit devenir immédiatement lisible : le choix
    // de l'élève reste rouge s'il est faux et la bonne proposition apparaît
    // en vert, sans obliger à ouvrir l'explication détaillée.
    const reveleCorrect = (entrainement ? etat.validation !== null : correctionVisible) && attendu;
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
        <span>${rendreLibelle(choix)}</span>
        ${reveleCorrect ? '<span class="visuellement-cache">Correct</span>' : ""}
      </div>`;
    }
    const radio = question.reponse.type === "choix-unique";
    return `<button class="${classes}" data-action="choix" data-id="${echapper(choix.id)}"
      role="${radio ? "radio" : "checkbox"}" aria-checked="${selectionne}"
      aria-pressed="${selectionne}" ${etat.validation === null ? "" : "disabled"}>
      ${selectionFausse ? '<span class="icone-verdict" aria-hidden="true">×</span>' : ""}
      ${selectionJuste ? '<span class="icone-verdict" aria-hidden="true">✓</span>' : ""}
      ${reveleCorrect && !selectionJuste ? '<span class="icone-verdict" aria-hidden="true">✓</span>' : ""}
      <span>${rendreLibelle(choix)}</span>
      ${reveleCorrect ? '<span class="visuellement-cache">Réponse correcte</span>' : ""}
    </button>`;
  }).join("");
}

function diagnosticErreurFractions() {
  const question = questionCourante(etat);
  if (!question || etat.validation?.juste !== false || etat.validation.omise) return null;
  const source = blocRationnelQuestion(question);
  if (!source) return null;
  if (question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL) {
    return diagnostiquerFractionVersDecimal({
      numerateur: source.numerateur,
      denominateur: source.denominateur,
      saisie: etat.saisie,
    });
  }
  if (question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE) {
    return diagnostiquerFractionLibre({
      numerateur: source.numerateur,
      denominateur: source.denominateur,
      numerateurSaisi: Number(etat.saisies[0]),
      denominateurSaisi: Number(etat.saisies[1]),
    });
  }
  if (
    question.classement.microNotion === MICRO_NOTION_DECIMAL_VERS_FRACTION
    && question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL
  ) {
    return diagnostiquerDecimalVersNumerateur({
      numerateur: question.reponse.attendu,
      denominateur: source.denominateur,
      valeur: Number(etat.saisie),
    });
  }
  return null;
}

function rendreRetourValidation() {
  if (etat.erreurValidation) {
    return `<p class="message message-erreur" role="alert"><span class="contenu-message">${echapper(etat.erreurValidation)}</span></p>`;
  }
  if (etat.validation === null) return "";
  if (etat.validation.juste) {
    return '<p class="message message-reussite" role="status"><span class="contenu-message"><strong>Bien joué !</strong> Ta réponse est correcte.</span></p>';
  }
  if (etat.validation.omise) {
    return '<p class="message message-erreur" role="status"><span class="contenu-message"><strong>Pas de réponse.</strong></span></p>';
  }
  const diagnostic = diagnosticErreurFractions();
  return `<p class="message message-erreur" role="status"><span class="contenu-message"><strong>À revoir.</strong> ${diagnostic
    ? echapper(diagnostic.message)
    : "Ta réponse reste affichée."}</span></p>`;
}

function rendreZoneRetour() {
  const question = questionCourante(etat);
  const qcm = question?.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE;
  const reponseAttendue = etat.validation?.omise && !qcm
    ? rendreReponseAttendueApresOmission(question)
    : "";
  return `<div class="zone-retour" aria-live="polite" aria-atomic="true">${rendreRetourValidation()}${reponseAttendue}</div>`;
}

function rendreReponseAttendueApresOmission(question) {
  if (!question) return "";
  const fractions = definitionNotion().rendu === RENDU_FRACTIONS_DECIMAUX;
  const libelle = question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
    ? "Une réponse possible"
    : "Réponse correcte";
  const reponse = fractions
    ? rendreReponseCorrecteFractions(question, blocRationnelQuestion(question))
    : rendreReponseCorrecte(question);
  return `<div class="reponse-attendue-omission"><span>${libelle}</span>${reponse}</div>`;
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
  if (bloc.type === "rationnel") {
    return bloc.ecriture === "fraction"
      ? rendreFractionEmpilee(bloc.numerateur, bloc.denominateur)
      : `<strong>${echapper(formaterFractionEnDecimal(bloc.numerateur, bloc.denominateur))}</strong>`;
  }
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
      <div class="zone-corps-panneau">
        <div class="corps-panneau">${contenu}</div>
        <p class="indicateur-defilement-panneau" data-indicateur-defilement hidden aria-hidden="true">
          Fais défiler <span aria-hidden="true">↓</span>
        </p>
      </div>
      ${pied ? `<div class="pied-panneau">${pied}</div>` : ""}
    </aside>`;
}

function classeVerdictReponseEleve() {
  if (etat.validation?.omise) return "reponse-omise";
  return etat.validation?.juste ? "reponse-juste" : "reponse-fausse";
}

function rendreReponseEleveOmise({ balise = "p" } = {}) {
  return `<${balise} class="rappel-reponse-eleve reponse-omise"><span>Ta réponse</span><strong class="reponse-vide" aria-label="Aucune réponse"></strong></${balise}>`;
}

function rendreReponseEleve(question) {
  if (!estEntrainement() || etat.validation === null) return "";
  if (etat.validation.omise) return rendreReponseEleveOmise();
  const reponse = question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL
    ? etat.saisie
    : [TYPE_REPONSE_DEUX_ENTIERS, TYPE_REPONSE_FRACTION_EQUIVALENTE]
        .includes(question.reponse.type)
      ? etat.saisies.join(
        question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE ? " / " : " × ",
      )
      : question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL
        ? etat.saisie
      : question.reponse.choix
      .filter((choix) => etat.selection.includes(choix.id))
      .map((choix) => choix.libelle)
      .join(", ");
  return `<p class="rappel-reponse-eleve ${classeVerdictReponseEleve()}"><span>Ta réponse</span><strong>${echapper(reponse)}</strong></p>`;
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
  if (question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL) {
    return [formaterFractionEnDecimal(
      question.reponse.attendu.numerateur,
      question.reponse.attendu.denominateur,
    )];
  }
  if (question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE) {
    return [`${question.reponse.attendu.numerateur} / ${question.reponse.attendu.denominateur}`];
  }
  return question.reponse.choix
    .filter((choix) => question.reponse.attendus.includes(choix.id))
    .map((choix) => choix.libelle);
}

function rendreReponseCorrecte(question) {
  const reponseNumerique = [
    TYPE_REPONSE_ENTIER_NATUREL,
    TYPE_REPONSE_DEUX_ENTIERS,
    TYPE_REPONSE_NOMBRE_DECIMAL,
  ].includes(question.reponse.type);
  return `<div class="reponses-correction ${reponseNumerique ? "reponses-correction-numerique" : ""}" aria-label="Réponse correcte">
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

function rendreEtapeCarres(numero, titre, classe = "", { html = false } = {}) {
  const contenu = html
    ? titre
    : echapper(titre).replaceAll(
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

function rendreSommeInteractive(nombre, numeroEtape = 1, criteres = []) {
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
    ${criteres.length === 0 ? "" : rendreRappelsCriteres(criteres)}
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
      ${peutComposer && chiffres.length > 0
        ? rendreSommeInteractive(
          nombre,
          peutObserver ? 2 : 1,
          critere === null ? [] : [critere],
        )
        : ""}
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
    ${rendreSommeInteractive(nombre, 2, [3, 9])}
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
        ${rendreExplicationParCriteres(question.correction[0]?.contenu)}
    </section>
    <section class="etape-correction correction-somme">
        ${rendreEtape(2, "Additionner tous les chiffres", "repere-somme")}
        <p class="calcul-correction">${echapper(chiffres.join(" + "))} <span>=</span> <strong>${somme}</strong></p>
        ${rendreVerdicts(question, [3, 9])}
        ${rendreExplicationParCriteres(question.correction[1]?.contenu)}
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

function rendreExplicationParCriteres(texte) {
  const [amorce = "", ...lignes] = String(texte ?? "")
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter(Boolean);
  return `<div class="explication-criteres-correction">
    <p class="amorce-criteres-correction">${echapper(amorce)}</p>
    <ul>${lignes.map((ligne) => {
      const correspondance = ligne.match(/^(Par \d+)\s*:\s*(.*)$/u);
      if (!correspondance) return `<li>${echapper(ligne)}</li>`;
      return `<li><strong>${echapper(correspondance[1])} :</strong> ${echapper(correspondance[2])}</li>`;
    }).join("")}</ul>
  </div>`;
}

function rendreCarteCoursDivisibilite(index) {
  if (index === 0) {
    return `<article class="carte-cours-divisibilite">
      <span class="numero-cours">1</span>
      <h3>Divisible : le reste est égal à 0</h3>
      <p class="definition-cours">Un nombre est divisible par un autre lorsque le reste de la division est nul, c’est-à-dire égal à 0.</p>
      <p class="modelage-cours">On peut alors partager en parts égales sans qu’il reste d’objet.</p>
      <div class="comparaison-partages">
        <section class="exemple-partage-cours cas-divisible-cours">
          <h4>Cas divisible par 3</h4>
          <div class="barre-partage partage-exact" aria-label="12 partagé en 3 parts égales de 4, reste zéro">
            <strong>12</strong><div><span>4</span><span>4</span><span>4</span></div><small>reste 0</small>
          </div>
          <p><strong>12 = 3 × 4 + 0</strong><span>Le reste est égal à 0 : 12 est divisible par 3.</span></p>
        </section>
        <section class="exemple-partage-cours cas-non-divisible-cours">
          <h4>Cas non divisible par 3</h4>
          <div class="barre-partage partage-avec-reste" aria-label="13 partagé en 3 parts égales de 4, reste un">
            <strong>13</strong><div><span>4</span><span>4</span><span>4</span><i>1</i></div><small>reste 1</small>
          </div>
          <p><strong>13 = 3 × 4 + 1</strong><span>Le reste n’est pas égal à 0 : 13 n’est pas divisible par 3.</span></p>
        </section>
      </div>
      <div class="equivalence-cours">
        <strong>Trois façons de dire la même chose</strong>
        <p aria-label="3 divise 12 équivaut à 12 est divisible par 3, qui équivaut à 12 est un multiple de 3">
          <span>3 divise 12</span><span class="suite-equivalence"><i aria-hidden="true">⇔</i><b>12 est divisible par 3</b></span><span class="suite-equivalence"><i aria-hidden="true">⇔</i><b>12 est un multiple de 3</b></span>
        </p>
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
      <p class="consequence-cours"><strong>À retenir :</strong> un nombre est divisible par 10 exactement quand il est divisible à la fois par 2 et par 5.</p>
    </article>`;
  }
  return `<article class="carte-cours-divisibilite">
    <span class="numero-cours">3</span>
    <h3>Pour 3 et 9, j’additionne tous les chiffres</h3>
    <div class="reperes-multiples-cours">
      <section>
        <h4>Pour être divisible par 3</h4>
        <p>La somme des chiffres doit être un multiple de 3 :</p>
        <strong>3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, …</strong>
      </section>
      <section>
        <h4>Pour être divisible par 9</h4>
        <p>La somme des chiffres doit être un multiple de 9 :</p>
        <strong>9, 18, 27, 36, 45, 54, 63, 72, 81, 90, …</strong>
      </section>
    </div>
    <div class="exemples-sommes-cours">
      <section><p aria-label="3 plus 7 plus 2 égale 12"><b>3</b><i>+</i><b>7</b><i>+</i><b>2</b><i>=</i><strong>12</strong></p><span>12 est multiple de 3, mais pas de 9.</span><em>372 est divisible par 3, mais pas par 9.</em></section>
      <section><p aria-label="7 plus 2 plus 9 égale 18"><b>7</b><i>+</i><b>2</b><i>+</i><b>9</b><i>=</i><strong>18</strong></p><span>18 est multiple de 3 et de 9.</span><em>729 est divisible par 3 et par 9.</em></section>
    </div>
    <div class="attention-cours attention-terminaisons-cours">
      <strong>Attention : le dernier chiffre ne suffit pas.</strong>
      <p><b>43</b> se termine par 3, mais 4 + 3 = 7 : il n’est pas divisible par 3.<br><b>49</b> se termine par 9, mais 4 + 9 = 13 : il n’est pas divisible par 9.</p>
    </div>
    <p class="consequence-cours"><strong>Lien utile :</strong> tout nombre divisible par 9 est aussi divisible par 3.</p>
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
    etat.validation && !etat.validation.juste && !etat.validation.omise ? "fausse" : "",
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
  const operation = (gauche, droite) => signe === "+"
    ? somme(gauche, droite)
    : difference(gauche, droite);
  return `<div class="calcul-aligne">${versHtmlEgalitesAlignees(egalite(
    operation(puissance(nombre(base), 2), nombre(terme)),
    operation(nombre(carre), nombre(terme)),
    nombre(resultat),
  ))}</div>`;
}

function rendreDecompositionCarre(base) {
  const reste = base - 10;
  const resultat = base * base;
  return `<section class="decomposition-carre">
    <h4>${rendrePuissance(base)} : partager ${base} en ${versHtmlSemantique(somme(nombre(10), nombre(reste)))}</h4>
    ${rendreCarreQuadrilleDansLecteur({
      cote: base,
      mode: "decomposition",
    })}
    <div class="calcul-decomposition">${versHtmlEgalitesAlignees(egalite(
      puissance(nombre(base), 2),
      produit(nombre(base), groupe(somme(nombre(10), nombre(reste)))),
      somme(produit(nombre(base), nombre(10)), produit(nombre(base), nombre(reste))),
      somme(nombre(base * 10), nombre(base * reste)),
      nombre(resultat),
    ))}</div>
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
          <p>4 rangées de 4 carreaux donnent <strong>${versHtmlSemantique(egalite(noeudProduitCarre(4), nombre(16)))}</strong>.</p>
          <p class="chaine-carre">${rendreEgaliteCarre(4)}</p>
          <p><strong>Le carré d'un nombre</strong> est le produit de ce nombre par lui-même.</p>
          <p class="regle-generale-carre">${rendreRegleCarre()}</p>
          <p class="alerte-carre">${rendrePuissance(4)} signifie ${rendreProduitCarre(4)}, <strong>pas ${versHtmlSemantique(produit(nombre(4), nombre(2)))}</strong>.</p>
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
          `<p>${rendreEgaliteCarre(base)}</p>`,
        ).join("")}
      </div>
      <p class="definition-cours">Ces résultats sont appelés des <strong>carrés parfaits</strong> : ce sont les carrés d’entiers.</p>
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
          <p class="chaine-carre">${rendreEgaliteCarre(8)}</p>
          <p>Le carré de 8 est 64.</p>
        </section>
        <section>
          <h4>Je retrouve l'entier</h4>
          ${rendreCarreQuadrilleDansLecteur({
            cote: 8,
            mode: "cote-inconnu",
            texteAlternatif: "Carré contenant 64 carreaux dont les côtés égaux sont à retrouver",
          })}
          <p>${versHtmlSemantique(egalite(nombre(64), noeudProduitCarre(8)))}, donc l'entier recherché est <strong>8</strong>.</p>
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
    "Retrouver les carrés de 11 et de 12",
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

function rendreBlocAideCarres(question, bloc) {
  const base = baseQuestionCarres(question) ?? 4;
  if (bloc.type === "puissance") {
    return rendrePuissance(bloc.base, bloc.exposant);
  }
  if (bloc.type !== "texte") return rendreBlocMathematique(bloc);
  if (["aide-produit", "aide-produit-zero"].includes(bloc.id)) {
    return rendreTexteAvecExpression(
      bloc.contenu,
      `${base} × ${base}`,
      noeudProduitCarre(base),
    );
  }
  if (bloc.id === "aide-egalite-a-preparer") {
    const cible = cibleQuestionCarres(question);
    return rendreTexteAvecExpression(
      bloc.contenu,
      `${cible} = □ × □`,
      egalite(nombre(cible), produit(caseVide(), caseVide())),
    );
  }
  if (bloc.id === "aide-definition") {
    return rendreTexteAvecExpression(
      bloc.contenu,
      "a au carré = a × a",
      noeudRegleCarre(),
    );
  }
  if (bloc.id === "aide-seconde-operation") {
    const signe = texteBloc(question, "operation");
    const terme = blocQuestion(question, "terme")?.valeur;
    return `Effectue seulement ensuite ${signe === "+" ? "l’addition" : "la soustraction"} de ${echapper(terme)}.`;
  }
  return echapper(bloc.contenu);
}

function rendreReponseEleveCarres(question) {
  if (familleQuestion(question) !== "sens-notation") return rendreReponseEleve(question);
  if (!estEntrainement() || etat.validation === null) return "";
  if (etat.validation.omise) return rendreReponseEleveOmise();
  const choix = question.reponse.choix.find(({ id }) => etat.selection.includes(id));
  const contenu = choix ? rendreLibelleChoixCarres(question, choix) : "";
  return `<p class="rappel-reponse-eleve ${classeVerdictReponseEleve()}"><span>Ta réponse</span><strong class="reponse-mathematique">${contenu}</strong></p>`;
}

function rendreReponseCorrecteCarres(question) {
  if (familleQuestion(question) !== "sens-notation") return rendreReponseCorrecte(question);
  const contenus = question.reponse.choix
    .filter(({ id }) => question.reponse.attendus.includes(id))
    .map((choix) => `<strong class="reponse-mathematique">${rendreLibelleChoixCarres(question, choix)}</strong>`)
    .join("");
  return `<div class="reponses-correction" aria-label="Réponse correcte">${contenus}</div>`;
}

function rendreBlocCorrectionCarres(question, bloc) {
  const famille = familleQuestion(question);
  const base = baseQuestionCarres(question);
  if (bloc.type === "puissance") {
    return rendreEgaliteCarre(bloc.base, { avecResultat: false });
  }
  if (bloc.type !== "texte") return rendreBlocMathematique(bloc);

  if (
    ["calcul-direct", "carre-quadrille"].includes(famille)
    && bloc.id === "correction-produit"
  ) {
    return `${versHtmlSemantique(egalite(noeudProduitCarre(base), nombre(base * base)))}.`;
  }
  if (famille === "retrouver-entier" && bloc.id === "correction-facteur-repete") {
    return `Le facteur ${base} est répété : ${versHtmlSemantique(egalite(nombre(base * base), noeudProduitCarre(base)))}.`;
  }
  if (famille === "sens-notation") {
    if (bloc.id === "correction-bonne-traduction") {
      return `La bonne traduction est ${rendreProduitCarre(base)} : le facteur ${base} apparaît deux fois.`;
    }
    if (bloc.id === "correction-produit-deux") {
      return `${versHtmlSemantique(produit(nombre(base), nombre(2)))} signifie « multiplier ${base} par 2 », pas « multiplier ${base} par lui-même ».`;
    }
    if (bloc.id === "correction-somme-double") {
      return `${versHtmlSemantique(somme(nombre(base), nombre(base)))} est une addition, pas un produit.`;
    }
    if (bloc.id === "correction-somme-plus-deux") {
      return `${versHtmlSemantique(somme(nombre(base), nombre(2)))} ajoute 2 au nombre ; cela ne donne pas son carré.`;
    }
  }
  if (famille === "reconnaitre-carres") {
    const valeur = Number(bloc.id.match(/^correction-nombre-(\d+)$/)?.[1]);
    if (Number.isSafeInteger(valeur)) {
      const racine = Math.sqrt(valeur);
      if (Number.isInteger(racine)) {
        return `${valeur} est un carré : ${versHtmlSemantique(egalite(nombre(valeur), noeudProduitCarre(racine)))}.`;
      }
      const inferieur = Math.floor(racine);
      const superieur = inferieur + 1;
      return `${valeur} n'est pas un carré : ${versHtmlSemantique(inferieurStrict(
        noeudProduitCarre(inferieur),
        nombre(valeur),
        noeudProduitCarre(superieur),
      ))}.`;
    }
  }
  return rendreBlocMathematique(bloc);
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
  const visuelPremiereEtape = famille === "sens-notation"
    ? rendreCarreQuadrilleDansLecteur({
        cote: base,
        mode: "aire-inconnue",
      })
    : "";
  const aides = question.aide?.blocs?.filter((bloc) => bloc.type === "texte") ?? [];
  const contenu = `${rendreRappelQuestion(question)}
    ${rendreAccesCoursDepuisAide()}
    ${visuel}
    <div class="etapes-aide-carres">
      ${aides.map((aide, index) => `<section class="outil-aide${visuelPremiereEtape && index === 0 ? " outil-aide-carre-operation" : ""}">
        ${rendreEtapeCarres(
          index + 1,
          rendreBlocAideCarres(question, aide),
          index === 0 ? "repere-observation" : "",
          { html: true },
        )}
        ${visuelPremiereEtape && index === 0 ? visuelPremiereEtape : ""}
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
  const famillesAvecCarre = new Set([
    "calcul-direct",
    "retrouver-entier",
    "sens-notation",
    "carre-quadrille",
  ]);
  const visuelCorrection = famillesAvecCarre.has(famille) && base >= 2
    ? `<div class="visuel-correction-carres">${rendreCarreQuadrilleDansLecteur({
        cote: base,
        mode: "sens",
        texteAlternatif: `Carré de ${base} carreaux sur chaque côté, soit ${base * base} carreaux en tout`,
      })}</div>`
    : "";
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
    ${rendreReponseEleveCarres(question)}
    ${visuelCorrection}
    ${erreurDouble ? `<p class="diagnostic-erreur-carre">Tu as calculé ${versHtmlSemantique(produit(nombre(base), nombre(2)))}. Le petit 2 demande deux facteurs égaux à ${base}.</p>` : ""}
    ${correctionCalculCourt || `<div class="etapes-correction-carres">
      ${blocs.map((bloc, index) => {
        const estConclusion = index === blocs.length - 1
          && !["sens-notation", "reconnaitre-carres"].includes(famille);
        return `<section class="etape-correction ${estConclusion ? "correction-conclusion" : "correction-observation"}">
        ${rendreEtape(index + 1, titres[index] ?? `Étape ${index + 1}`, estConclusion ? "repere-conclusion" : "repere-observation")}
        <p class="ligne-correction-carres">${rendreBlocCorrectionCarres(question, bloc)}</p>
      </section>`;
      }).join("")}
    </div>`}
    ${rendreReponseCorrecteCarres(question)}`;
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
  const profil = question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL
    ? "decimal-positif"
    : "entier-naturel";
  const disposition = obtenirDispositionClavier(profil);
  const touches = disposition.touches.map((touche) => {
    const attributAction = touche.action === ACTION_TOUCHE_SAISIR
      ? `${touche.valeur === "," ? 'data-action="caractere"' : 'data-action="chiffre"'} data-value="${echapper(touche.valeur)}"`
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
      style="--colonnes-clavier: ${disposition.colonnes}" aria-label="Clavier de saisie">
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
  const miseEnPageNumerique = entrainement && estReponseNumerique(question);
  const paveActif = miseEnPageNumerique && etat.validation === null;
  const classesMiseEnPage = [
    classesLecteur(),
    miseEnPageNumerique ? "question-numerique" : "",
    paveActif ? "avec-pave" : "",
  ].filter(Boolean).join(" ");
  return `
    <div class="${classesMiseEnPage}">
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
        : `<h1>Quel est le carré de ${rendreNombreMathematique(base)} ?</h1>
          <p class="precision">Choisis une seule réponse.</p>`;
    }
    return questionVerbale
      ? `<h1>${echapper(consigne)} ${rendreNombreMathematique(base)} ?</h1>
        <p class="egalite-carres phrase-reponse-carres"><span>Le carré de ${rendreNombreMathematique(base)} est</span>${rendreCaseReponseCarres(question)}<span>.</span></p>`
      : `<h1>${echapper(consigne)}</h1>
        <p class="egalite-carres">${rendrePuissance(base)} <span>=</span> ${rendreCaseReponseCarres(question)}</p>`;
  }
  if (famille === "retrouver-entier") {
    const cible = cibleQuestionCarres(question);
    if (blocQuestion(question, "produit-facteurs-egaux-cible")) {
      return `<h1>${echapper(consigne)}</h1>
        <p class="egalite-carres egalite-deux-champs">${rendreNombreMathematique(cible)}<span>=</span>
          ${rendreCaseReponseCarres(question, 0)}<span>×</span>${rendreCaseReponseCarres(question, 1)}</p>
        <p class="precision">Remplis les deux cases.</p>`;
    }
    if (blocQuestion(question, "egalite-carre-cible")) {
      return `<h1>${echapper(consigne)}</h1>
        <p class="egalite-carres">${rendreCaseReponseCarres(question, 0, { puissance: true })}<span>=</span>${rendreNombreMathematique(cible)}</p>`;
    }
    return `<h1>${echapper(consigne)} ${rendreNombreMathematique(cible)} ?</h1>
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
      ? `${echapper(consigne)} ${rendreNombreMathematique(base * base)} ${echapper(texteBloc(question, "question-trouver-cote"))}`
      : `Ce carré a ${rendreNombreMathematique(base)} ${motCarreau} sur chaque côté. Combien en contient-il en tout ?`;
    return `<h1>${questionComplete}</h1>
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
      <p class="egalite-carres calcul-court-question">${rendrePuissance(base)}<span>${echapper(signe)}</span>${rendreNombreMathematique(terme)}<span>=</span>${rendreCaseReponseCarres(question)}</p>
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
    aria-label="Réponses proposées">${rendreChoix(
      question,
      (choix) => rendreLibelleChoixCarres(question, choix),
    )}</div>`;
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

function blocRationnelQuestion(question) {
  return question.enonce.find((bloc) => bloc.type === "rationnel");
}

function rendreFractionEmpilee(
  numerateur,
  denominateur,
  { classe = "", numerateurHtml = null, denominateurHtml = null } = {},
) {
  const numerateurLisible = numerateurHtml ?? echapper(numerateur);
  const denominateurLisible = denominateurHtml ?? echapper(denominateur);
  const fractionACompleter = numerateurHtml !== null && denominateurHtml !== null;
  const semantique = fractionACompleter
    ? 'role="group" aria-label="Fraction à compléter"'
    : `role="math" aria-label="${echapper(numerateur)} sur ${echapper(denominateur)}"`;
  return `<span class="fraction-empilee ${classe}" ${semantique}>
    <span class="numerateur">${numerateurLisible}</span>
    <span class="barre-fraction" aria-hidden="true"></span>
    <span class="denominateur">${denominateurLisible}</span>
  </span>`;
}

function rendreEgaliteRationnelle(numerateur, denominateur) {
  return `<p class="egalite-rationnelle">
    ${rendreFractionEmpilee(numerateur, denominateur)}
    <span>=</span>
    <strong>${echapper(formaterFractionEnDecimal(numerateur, denominateur))}</strong>
  </p>`;
}

const RANGS_DECIMAUX = Object.freeze([
  Object.freeze({ id: "dixiemes", libelle: "dixièmes", denominateur: 10 }),
  Object.freeze({ id: "centiemes", libelle: "centièmes", denominateur: 100 }),
  Object.freeze({ id: "milliemes", libelle: "millièmes", denominateur: 1000 }),
]);
const ABREVIATIONS_RANGS_DECIMAUX = Object.freeze({
  unites: "Unit.",
  dixiemes: "Dix.",
  centiemes: "Cent.",
  milliemes: "Mill.",
});

function donneesTableauAvecRang(numerateur, denominateur) {
  const rang = RANGS_DECIMAUX.find(
    (element) => element.denominateur === denominateur,
  );
  if (!rang) {
    return construireDonneesTableauDepuisFraction(numerateur, denominateur);
  }
  const nombreDecimales = Math.log10(denominateur);
  const chiffres = String(numerateur).padStart(nombreDecimales + 1, "0");
  const partieEntiere = chiffres.slice(0, -nombreDecimales) || "0";
  const decimales = chiffres.slice(-nombreDecimales);
  return {
    ecritureDecimale: formaterFractionEnDecimal(numerateur, denominateur),
    colonnes: [
      { id: "unites", libelle: "Unités", chiffre: partieEntiere },
      { id: "dixiemes", libelle: "Dixièmes", chiffre: decimales[0] ?? null },
      { id: "centiemes", libelle: "Centièmes", chiffre: decimales[1] ?? null },
      { id: "milliemes", libelle: "Millièmes", chiffre: decimales[2] ?? null },
    ],
    dernierRang: rang.id,
  };
}

function rendreTableauNumeration(
  numerateur,
  denominateur,
  {
    afficherChiffres = true,
    colonneMiseEnEvidence = null,
    afficherLecture = afficherChiffres,
    annoncerEcriture = true,
  } = {},
) {
  const donnees = donneesTableauAvecRang(numerateur, denominateur);
  if (afficherChiffres) {
    const dessin = dessinerTableauNumerationDecimale({
      ecritureDecimale: donnees.ecritureDecimale,
      largeur: 560,
      rangMisEnEvidence: colonneMiseEnEvidence,
      afficherLecture,
      annoncerEcriture,
    });
    return rendreFigureFraction(dessin, "figure-tableau-numeration figure-tableau-numeration-svg");
  }
  const alternative = annoncerEcriture
    ? `Tableau de numération de ${donnees.ecritureDecimale}`
    : "Tableau de numération à compléter : lis les colonnes sans que le résultat soit annoncé";
  return `<figure class="figure-tableau-numeration">
    <table aria-label="${echapper(alternative)}">
      <thead><tr>${donnees.colonnes.map((colonne) =>
      `<th class="${colonne.id === colonneMiseEnEvidence ? "rang-cible" : ""}"><span class="libelle-rang-complet">${echapper(colonne.libelle)}</span><abbr class="libelle-rang-court" title="${echapper(colonne.libelle)}" aria-label="${echapper(colonne.libelle)}">${echapper(ABREVIATIONS_RANGS_DECIMAUX[colonne.id])}</abbr></th>`,
      ).join("")}</tr></thead>
      <tbody><tr>${donnees.colonnes.map((colonne) =>
        `<td class="${colonne.id === colonneMiseEnEvidence ? "rang-cible" : ""}">${afficherChiffres
          ? colonne.chiffre === null
            ? '<span aria-hidden="true">—</span>'
            : `<strong>${echapper(colonne.chiffre)}</strong>`
          : '<span class="case-tableau-vide" aria-hidden="true">?</span>'}</td>`,
      ).join("")}</tr></tbody>
    </table>
    ${afficherChiffres ? `<figcaption>${rendreEgaliteRationnelle(numerateur, denominateur)}</figcaption>` : ""}
  </figure>`;
}

function presentationQuestionFractions(question) {
  return question.classement.complements
    .find((complement) => complement.startsWith("presentation-"))
    ?.slice("presentation-".length) ?? "abstraite";
}

function rendreFigureFraction(dessin, classes = "", legende = "") {
  return `<figure class="figure-fraction ${classes}">
    ${dessin.svg}
    ${legende ? `<figcaption>${echapper(legende)}</figcaption>` : ""}
  </figure>`;
}

function rendreMaterielDecimalDepuisFraction(numerateur, denominateur, classes = "") {
  const centiemes = numerateur * (100 / denominateur);
  return rendreFigureFraction(
    dessinerMaterielNumerationDecimale({
      unites: Math.floor(centiemes / 100),
      dixiemes: Math.floor((centiemes % 100) / 10),
      centiemes: centiemes % 10,
      orientation: "horizontale",
      largeur: 560,
    }),
    `figure-materiel-decimal ${classes}`,
  );
}

function rendreBandesRailFractions(question, source, {
  solution = false,
  etape = "pieces",
  partiesPosees = undefined,
  classes = "",
} = {}) {
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  const profil = solution
    ? "solution"
    : direct
      ? "aide-nc03"
      : question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
        ? "aide-nc04-libre"
        : "aide-nc04-imposee";
  return rendreFigureFraction(
    dessinerBandesFractionnairesSurRailDecimal({
      numerateur: source.numerateur,
      denominateur: source.denominateur,
      profil,
      etape,
      ...(partiesPosees === undefined ? {} : { partiesPosees }),
      largeur: 720,
    }),
    `figure-bandes-rail ${classes}`,
  );
}

function nomPartFraction(denominateur, quantite = 1) {
  const singulier = {
    1: "unité",
    2: "demi",
    4: "quart",
    10: "dixième",
    100: "centième",
    1000: "millième",
  }[denominateur] ?? "part";
  if (quantite === 1) return singulier;
  return singulier === "demi" ? "demis" : `${singulier}s`;
}

function configurationDoubleDroiteFraction(numerateur, denominateur) {
  const valeur = numerateur / denominateur;
  const maximum = Math.max(1, Number.isInteger(valeur) ? valeur + 1 : Math.ceil(valeur));
  const nombreGraduations = maximum * denominateur;
  const graduations = nombreGraduations <= 32
    ? Array.from({ length: nombreGraduations + 1 }, (_, index) => index / denominateur)
    : [...Array.from({ length: maximum + 1 }, (_, index) => index), valeur]
      .sort((a, b) => a - b)
      .filter((element, index, liste) => index === 0 || element !== liste[index - 1]);
  const etiquettes = Object.fromEntries(
    graduations.filter((graduation) => !Number.isInteger(graduation))
      .map((graduation) => [String(graduation), ""]),
  );
  return { valeur, maximum, graduations, etiquettes };
}

function rendreDoubleDroiteRiche(
  numerateur,
  denominateur,
  {
    sens = MICRO_NOTION_FRACTION_VERS_DECIMAL,
    progression = null,
    reveler = false,
    compacte = false,
  } = {},
) {
  const { valeur, maximum, graduations, etiquettes } =
    configurationDoubleDroiteFraction(numerateur, denominateur);
  const progressionValide = Number.isInteger(progression)
    && progression >= 0
    && progression <= numerateur;
  const fractionCible = { type: "fraction", numerateur, denominateur };
  const decimalCible = formaterFractionEnDecimal(numerateur, denominateur);
  const pointsHaut = [{
    valeur,
    etiquette: sens === MICRO_NOTION_DECIMAL_VERS_FRACTION && !reveler ? "?" : fractionCible,
    couleur: COULEURS.bleu,
    position: "dessus",
  }];
  const pointsBas = [{
    valeur,
    etiquette: sens === MICRO_NOTION_FRACTION_VERS_DECIMAL && !reveler ? "?" : decimalCible,
    couleur: COULEURS.bleu,
    position: "dessous",
  }];
  if (progressionValide && progression > 0 && progression !== numerateur) {
    const valeurConstruite = progression / denominateur;
    pointsHaut.push({
      valeur: valeurConstruite,
      etiquette: { type: "fraction", numerateur: progression, denominateur },
      couleur: COULEURS.orange,
      position: "dessus",
    });
    pointsBas.push({
      valeur: valeurConstruite,
      etiquette: formaterFractionEnDecimal(progression, denominateur),
      couleur: COULEURS.orange,
      position: "dessous",
    });
  }
  const rendreVariante = (largeur, tailleEtiquette, classeVariante = "") =>
    rendreFigureFraction(
      dessinerDoubleDroiteGraduee({
        largeur,
        description: "Double droite graduée mettant en regard fractions et écritures décimales.",
        haut: {
          min: 0,
          max: maximum,
          graduations,
          etiquettes,
          points: pointsHaut,
          nom: "Fractions",
          tailleEtiquette,
        },
        bas: {
          min: 0,
          max: maximum,
          graduations,
          etiquettes,
          points: pointsBas,
          nom: "Décimaux",
          tailleEtiquette,
        },
      }),
      `figure-double-droite-fraction ${classeVariante}`,
    );
  if (compacte) return rendreVariante(560, 17);
  return `<div class="double-droite-responsive">
    ${rendreVariante(720, 20, "figure-double-droite-large")}
    ${rendreVariante(340, 18, "figure-double-droite-mobile")}
  </div>`;
}

function classesCaseRationnelle(active = false) {
  return [
    "case-reponse-rationnelle",
    active ? "active" : "",
    etat.validation?.juste ? "juste" : "",
    etat.validation && !etat.validation.juste && !etat.validation.omise ? "fausse" : "",
  ].filter(Boolean).join(" ");
}

function rendreChampFractionLibre(index) {
  const question = questionCourante(etat);
  const valeur = estEntrainement()
    ? etat.saisies[index]
    : etat.reponseRevelee || etat.correctionOuverte
      ? String(question.reponse.attendu[
        index === 0 ? "numerateur" : "denominateur"
      ])
      : "";
  const modifiable = estEntrainement() && etat.validation === null;
  const active = modifiable && etat.champSaisieActif === index;
  const contenu = echapper(valeur || (estEntrainement() ? "…" : "?"));
  if (!modifiable) {
    return `<output class="${classesCaseRationnelle(active)}">${contenu}</output>`;
  }
  return `<button class="${classesCaseRationnelle(active)}" type="button"
    data-action="champ-reponse" data-index="${index}"
    aria-label="${index === 0 ? "Numérateur" : "Dénominateur"}${valeur ? ` : ${echapper(valeur)}` : " à compléter"}"
    aria-pressed="${active}">${contenu}</button>`;
}

function rendreZoneReponseFractions(question) {
  const source = blocRationnelQuestion(question);
  if (question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL) {
    const valeur = estEntrainement()
      ? etat.saisie
      : etat.reponseRevelee || etat.correctionOuverte
        ? formaterFractionEnDecimal(
          question.reponse.attendu.numerateur,
          question.reponse.attendu.denominateur,
        )
        : "";
    return `<p class="egalite-question-rationnelle">
      ${rendreFractionEmpilee(source.numerateur, source.denominateur, { classe: "fraction-question" })}
      <span>=</span>
      <output class="${classesCaseRationnelle()} case-decimale">${echapper(valeur || (estEntrainement() ? "…" : "?"))}</output>
    </p>
    ${estEntrainement() && etat.validation === null ? '<p class="indication-clavier-physique">Chiffres · point ou virgule · Retour arrière · Entrée pour valider</p>' : ""}`;
  }
  const decimal = formaterFractionEnDecimal(
    source.numerateur,
    source.denominateur,
  );
  if (question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE) {
    return `<p class="egalite-question-rationnelle">
      <strong class="decimal-question">${echapper(decimal)}</strong><span>=</span>
      ${rendreFractionEmpilee("case", "case", {
        classe: "fraction-reponse",
        numerateurHtml: rendreChampFractionLibre(0),
        denominateurHtml: rendreChampFractionLibre(1),
      })}
    </p>
    ${estEntrainement() && etat.validation === null ? '<p class="precision">Choisis une case, puis saisis une fraction égale. Tab change de case.</p>' : ""}`;
  }
  const denominateur = blocQuestion(question, "denominateur-impose").valeur;
  const numerateur = estEntrainement()
    ? etat.saisie
    : etat.reponseRevelee || etat.correctionOuverte
      ? String(question.reponse.attendu)
      : "";
  return `<p class="egalite-question-rationnelle">
    <strong class="decimal-question">${echapper(decimal)}</strong><span>=</span>
    ${rendreFractionEmpilee(numerateur || "case", denominateur, {
      classe: "fraction-reponse",
      numerateurHtml: `<output class="${classesCaseRationnelle()}">${echapper(numerateur || (estEntrainement() ? "…" : "?"))}</output>`,
    })}
  </p>`;
}

function rendreLibelleChoixFraction(choix) {
  const correspondance = /^(\d+)\/(\d+)$/.exec(choix.libelle);
  return correspondance
    ? rendreFractionEmpilee(Number(correspondance[1]), Number(correspondance[2]))
    : echapper(choix.libelle);
}

function rendreQuestionFractionsDecimaux() {
  const question = questionCourante(etat);
  const consigne = texteBloc(question, "consigne") || "Complète l'égalité.";
  const source = blocRationnelQuestion(question);
  const presentation = presentationQuestionFractions(question);
  const qcm = question.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE;
  const doubleDroite = presentation === "double-droite";
  const cibleQcm = question.classement.microNotion === MICRO_NOTION_DECIMAL_VERS_FRACTION
    ? `<strong class="decimal-question">${echapper(formaterFractionEnDecimal(source.numerateur, source.denominateur))}</strong>`
    : rendreFractionEmpilee(source.numerateur, source.denominateur);
  const carteQuestion = `<main class="carte-question carte-question-fractions famille-${echapper(familleQuestion(question))}">
    <p class="etiquette-notion">${echapper(nomNotion())}</p>
    <h1>${echapper(consigne)}</h1>
    ${doubleDroite
      ? rendreDoubleDroiteRiche(source.numerateur, source.denominateur, {
        sens: question.classement.microNotion,
      })
      : ""}
    ${qcm
      ? `<p class="cible-qcm-rationnelle">${cibleQcm}</p>
        <div class="grille-choix grille-qcm-fractions ${estEntrainement() ? "" : "grille-projection"}"
          role="${estEntrainement() ? "radiogroup" : "group"}" aria-label="Réponses proposées">
          ${rendreChoix(question, question.classement.microNotion === MICRO_NOTION_DECIMAL_VERS_FRACTION
            ? rendreLibelleChoixFraction
            : undefined)}
        </div>`
      : rendreZoneReponseFractions(question)}
    ${estEntrainement() ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
  </main>`;
  return rendreCoqueLecteur(question, carteQuestion);
}

function rendreCommandesProgressionFraction(source, { retour, suite } = {}) {
  const libelleRetour = retour ?? `Retirer un ${nomPartFraction(source.denominateur)}`;
  const libelleSuite = suite ?? `Ajouter un ${nomPartFraction(source.denominateur)}`;
  return `<div class="commandes-progression-fraction">
    <button class="bouton-secondaire" type="button" data-action="pas-fraction-precedent"
      ${etat.pasFractionAide === 0 ? "disabled" : ""}>← ${echapper(libelleRetour)}</button>
    <button class="bouton-principal" type="button" data-action="pas-fraction-suivant"
      ${etat.pasFractionAide === source.numerateur ? "disabled" : ""}>${echapper(libelleSuite)} →</button>
  </div>`;
}

function rendreAidePoseBandesRiche(question, source) {
  const pas = etat.pasFractionAide;
  const terminee = pas === source.numerateur;
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  return `<section class="atelier-fraction atelier-pose-bandes">
    <p class="consigne-atelier"><strong>Pose les pièces sur le rail.</strong>
      Chaque pièce vaut un ${nomPartFraction(source.denominateur)} et garde exactement la même largeur.</p>
    ${rendreBandesRailFractions(question, source, {
      etape: "pieces",
      partiesPosees: pas,
      classes: "figure-bandes-rail-aide",
    })}
    ${direct ? `<label class="controle-curseur-fraction" for="curseur-fraction-aide">
      <span>${direct
        ? `${pas} ${nomPartFraction(source.denominateur, pas)} placé${pas > 1 ? "s" : ""} ; lis maintenant le point décimal.`
        : `${pas} pièce${pas > 1 ? "s" : ""} posée${pas > 1 ? "s" : ""} jusqu’au point donné.`}</span>
      <input id="curseur-fraction-aide" class="curseur-fraction" type="range"
        min="0" max="${source.numerateur}" step="1" value="${pas}"
        data-action="position-fraction" aria-label="Poser les pièces une à une sur le rail">
    </label>` : `<p class="controle-curseur-fraction">${pas} pièce${pas > 1 ? "s" : ""} posée${pas > 1 ? "s" : ""}. Ajoute ou retire une pièce ; le point cible indique où t’arrêter.</p>`}
    ${rendreCommandesProgressionFraction(source, {
      retour: `Reculer d’un ${nomPartFraction(source.denominateur)}`,
      suite: `Avancer d’un ${nomPartFraction(source.denominateur)}`,
    })}
    <p class="conclusion-atelier ${terminee ? "visible" : ""}" aria-live="polite">${terminee
      ? "Tu es arrivé au point demandé. L’autre écriture reste à trouver : complète le « ? » dans ta réponse."
      : "Avance jusqu’au point demandé ; le dernier terme restera masqué."}</p>
  </section>`;
}

function rendreAideGroupementRiche(question, source) {
  const unites = Math.floor(source.numerateur / source.denominateur);
  const reste = source.numerateur % source.denominateur;
  const groupes = etat.groupesFractionAide;
  const fusionnerReste = source.denominateur === 4 && reste === 2;
  const maximum = fusionnerReste ? 3 : 2;
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  const decimal = formaterFractionEnDecimal(source.numerateur, source.denominateur);
  const terminee = groupes === maximum;
  const etape = groupes === 0
    ? "pieces"
    : groupes === 1
      ? "groupes"
      : groupes === 2
        ? "unites"
        : "reste";
  const libelleEtat = groupes === 0
    ? direct
      ? `Les ${source.numerateur} ${nomPartFraction(source.denominateur, source.numerateur)} sont encore séparés.`
      : "Toutes les pièces posées sont encore séparées."
    : groupes === 1
      ? "Les contours des unités apparaissent."
      : groupes === 2
        ? fusionnerReste
          ? "Les unités sont retournées ; il reste encore deux quarts à réunir."
          : "Les unités complètes sont retournées."
        : "Les deux quarts restants forment maintenant un demi.";
  const libelleSuite = groupes === 0
    ? "Assembler les pièces"
    : groupes === 1
      ? "Retourner les unités"
      : "Fusionner les deux quarts";
  const membres = [direct
    ? quotient(nombre(source.numerateur), nombre(source.denominateur))
    : nombre(Number(decimal.replace(",", ".")), { decimales: decimal.split(",")[1]?.length ?? 0 })];
  if (direct && groupes >= 1) {
    const termes = [quotient(nombre(unites * source.denominateur), nombre(source.denominateur))];
    if (reste) termes.push(quotient(nombre(reste), nombre(source.denominateur)));
    membres.push(somme(...termes));
  }
  if (groupes >= 2) {
    const termes = [nombre(unites)];
    if (reste) termes.push(quotient(nombre(reste), nombre(source.denominateur)));
    membres.push(somme(...termes));
  }
  if (groupes >= 3 && fusionnerReste) {
    membres.push(somme(nombre(unites), quotient(nombre(1), nombre(2))));
  }
  membres.push(direct
    ? texteCourt("?")
    : quotient(texteCourt("?"), nombre(source.denominateur)));
  const decomposition = versHtmlEgalitesAlignees(egalite(...membres));
  return `<section class="atelier-fraction atelier-groupement">
    <p class="consigne-atelier"><strong>Pars de toutes les pièces.</strong>
      ${direct
        ? `Tu vois d’abord ${source.numerateur} ${nomPartFraction(source.denominateur, source.numerateur)}.`
        : "Tu as posé les pièces jusqu’au point décimal donné."}
      Assemble-les, forme les unités, puis transforme le reste si tu peux.</p>
    ${rendreBandesRailFractions(question, source, {
      etape,
      partiesPosees: source.numerateur,
    })}
    <div class="decomposition-guidee-fraction">${decomposition}</div>
    <p class="compteur-groupes">${libelleEtat}</p>
    <div class="commandes-progression-fraction">
      <button class="bouton-secondaire" type="button" data-action="groupe-unite-precedent"
        ${groupes === 0 ? "disabled" : ""}>← Étape précédente</button>
      <button class="bouton-principal" type="button" data-action="groupe-unite-suivant"
        ${terminee ? "disabled" : ""}>${libelleSuite} →</button>
    </div>
    <p class="conclusion-atelier ${terminee ? "visible" : ""}" aria-live="polite">${terminee
      ? `${unites} unité${unites > 1 ? "s" : ""} complète${unites > 1 ? "s" : ""}${reste ? fusionnerReste ? " et un demi" : ` et ${reste} ${nomPartFraction(source.denominateur, reste)}` : ", sans reste"}. À toi d’écrire le nombre correspondant au « ? ».`
      : "Groupe toutes les unités complètes avant de traiter ce qui reste."}</p>
  </section>`;
}

function rendreAideTableauRiche(question, source) {
  const cible = RANGS_DECIMAUX.find((rang) => rang.denominateur === source.denominateur);
  const selection = etat.rangFractionAide;
  const juste = selection === cible.id;
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  const materiel = source.denominateur === 1000
    ? ""
    : rendreMaterielDecimalDepuisFraction(
        source.numerateur,
        source.denominateur,
        "figure-materiel-aide",
      );
  return `<section class="atelier-fraction atelier-tableau-decimal">
    <p class="consigne-atelier"><strong>Que nomme le dénominateur ${source.denominateur} ?</strong>
      Choisis le rang du dernier chiffre. Le tableau reste visible et se remplit après ce choix.</p>
    <div class="choix-rang-fraction" role="radiogroup" aria-label="Choisir le rang décimal">
      ${RANGS_DECIMAUX.map((rang) => `<button type="button" class="${selection === rang.id ? "selectionne" : ""}"
        data-action="rang-fraction" data-rang="${rang.id}" role="radio"
        aria-checked="${selection === rang.id}">${rang.libelle}</button>`).join("")}
    </div>
    ${materiel}
    ${rendreTableauNumeration(source.numerateur, source.denominateur, {
      afficherChiffres: juste,
      colonneMiseEnEvidence: selection,
      afficherLecture: false,
      annoncerEcriture: !direct,
    })}
    <p class="conclusion-atelier ${juste ? "visible" : ""}" aria-live="polite">${selection === null
      ? "Lis le dénominateur, puis choisis la colonne correspondante."
      : juste
        ? "Oui. Les chiffres sont placés : lis le tableau dans le sens demandé, puis complète le « ? »."
        : `Ce n’est pas le rang nommé par ${source.denominateur}. Essaie une autre colonne.`}</p>
  </section>`;
}

function rendreCommandesCorrespondanceAide({ maximum, precedent, suivant }) {
  const etape = etat.etapeCorrespondanceAide;
  return `<div class="commandes-progression-fraction commandes-correspondance-aide">
    <button class="bouton-secondaire" type="button" data-action="correspondance-precedente"
      data-maximum="${maximum}" ${etape === 0 ? "disabled" : ""}>← ${echapper(precedent)}</button>
    <button class="bouton-principal" type="button" data-action="correspondance-suivante"
      data-maximum="${maximum}" ${etape === maximum ? "disabled" : ""}>${echapper(suivant[etape] ?? suivant.at(-1))} →</button>
  </div>`;
}

function rendreRailCorrespondanceLibre(decimal, entier, numerateurReste, denominateur) {
  const numerateur = entier * denominateur + numerateurReste;
  return rendreFigureFraction(
    dessinerBandesFractionnairesSurRailDecimal({
      numerateur,
      denominateur,
      profil: "aide-nc04-libre",
      etape: denominateur === 4 && numerateur % 4 === 2 ? "reste" : "lecture",
      partiesPosees: numerateur,
      largeur: 720,
    }),
    "figure-bandes-rail figure-correspondance-libre",
    `Les bandes atteignent exactement ${decimal}.`,
  );
}

function rendreConstructionCorrespondanceLibre(decimal, numerateurDecimal, denominateurDecimal) {
  const [entierTexte, decimalesTexte = ""] = decimal.split(",");
  const entier = Number(entierTexte);
  const dixiemes = decimalesTexte.padEnd(3, "0")[0] ?? "0";
  const centiemes = Number(decimalesTexte.padEnd(2, "0").slice(0, 2)) % 100;
  const etape = etat.etapeCorrespondanceAide;
  const demi = denominateurDecimal === 10 && dixiemes === "5";
  const quarts = denominateurDecimal === 100 && [25, 75].includes(centiemes);
  if (!demi && !quarts) {
    return `${rendreMaterielDecimalDepuisFraction(numerateurDecimal, denominateurDecimal, "figure-materiel-aide")}
      ${rendreTableauNumeration(numerateurDecimal, denominateurDecimal, {
        afficherChiffres: true,
        colonneMiseEnEvidence: RANGS_DECIMAUX.find(({ denominateur }) => denominateur === denominateurDecimal)?.id,
        afficherLecture: false,
        annoncerEcriture: false,
      })}`;
  }
  const unitesEntieres = entier > 0
    ? `<section class="unites-entieres-correspondance">
        <p><strong>Conserve d’abord ${entier} unité${entier > 1 ? "s" : ""} entière${entier > 1 ? "s" : ""}.</strong>
          Le matériel rouge ne change pas pendant qu’on transforme seulement la partie décimale.</p>
        ${rendreMaterielDecimalDepuisFraction(entier, 1, "figure-materiel-aide figure-unites-correspondance")}
      </section>`
    : "";
  if (demi) {
    const figure = rendreFigureFraction(
      dessinerDemiAvecDixiemes({
        etape: ["dixiemes", "demi", "comparaison"][etape],
        afficherEcritures: false,
        largeur: 560,
      }),
      "figure-correspondance-decimale figure-demi-dixiemes",
    );
    const rail = etape === 2 && entier > 0
      ? rendreRailCorrespondanceLibre(decimal, entier, 1, 2)
      : "";
    return `<p class="etape-manipulation"><strong>${etape + 1}. </strong>${etape === 0
      ? "Observe les cinq dixièmes verts : ils occupent exactement la moitié d’une unité."
      : etape === 1
        ? "Aligne maintenant la pièce jaune d’un demi sur la même longueur."
        : "Lis les deux matériels : ils représentent la même quantité."}</p>
      ${unitesEntieres}${figure}${rail}
      ${rendreCommandesCorrespondanceAide({
        maximum: 2,
        precedent: "Revenir",
        suivant: ["Aligner un demi", "Écrire la correspondance"],
      })}`;
  }
  const figure = rendreFigureFraction(
    dessinerReorganisationCentiemes({
      centiemes,
      etape: ["lignes", "quadrants", "comparaison"][etape],
      afficherEcritures: false,
      largeur: 560,
    }),
    "figure-correspondance-decimale figure-reorganisation-centiemes",
  );
  const rail = etape === 2
    ? rendreRailCorrespondanceLibre(decimal, entier, centiemes / 25, 4)
    : "";
  return `<p class="etape-manipulation"><strong>${etape + 1}. </strong>${etape === 0
    ? `Observe les ${centiemes} centièmes jaunes rangés dans l’unité.`
    : etape === 1
      ? "Réorganise les mêmes cases en blocs de 25, sans en ajouter ni en retirer."
      : "Aligne enfin les bandes de quarts : elles occupent exactement les mêmes blocs."}</p>
    ${unitesEntieres}${figure}${rail}
    ${rendreCommandesCorrespondanceAide({
      maximum: 2,
      precedent: "Revenir",
      suivant: ["Réorganiser les centièmes", "Aligner les quarts"],
    })}`;
}

function rendreAideUnitesRiche(source) {
  return `<section class="atelier-fraction atelier-unites">
    <p class="consigne-atelier"><strong>Regarde le dénominateur.</strong>
      Avec un dénominateur égal à 1, chaque part est déjà une unité entière.</p>
    <div class="tuiles-unites tuiles-unites-sans-nombres" aria-label="Des tuiles d’unités à compter">
      ${Array.from({ length: source.numerateur }, () => '<span aria-hidden="true"></span>').join("")}
    </div>
    <p class="conclusion-atelier visible">Compte les tuiles : le nombre d’unités que tu obtiens est le terme à écrire à la place de « ? ».</p>
  </section>`;
}

function rendreRappelQuestionFractions(question) {
  const source = blocRationnelQuestion(question);
  const decimal = formaterFractionEnDecimal(source.numerateur, source.denominateur);
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  const fractionLibre = question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE;
  const qcm = question.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE;
  const equation = direct
    ? `${rendreFractionEmpilee(source.numerateur, source.denominateur)}<span>=</span><strong>?</strong>`
    : qcm || fractionLibre
      ? `<strong>${echapper(decimal)}</strong><span>=</span>${rendreFractionEmpilee("?", "?")}`
      : `<strong>${echapper(decimal)}</strong><span>=</span>${rendreFractionEmpilee("?", source.denominateur)}`;
  return `<section class="rappel-question rappel-question-fractions" aria-label="Question en cours">
    <span>Question en cours</span>
    <p>${echapper(texteBloc(question, "consigne"))}</p>
    <div class="rappel-equation-fractions">${equation}</div>
  </section>`;
}

function rendreAideFractionLibreRiche(source) {
  const decimal = formaterFractionEnDecimal(source.numerateur, source.denominateur);
  const denominateurDecimal = 10 ** (decimal.split(",")[1]?.length ?? 0);
  const numerateurDecimal = Number(decimal.replace(",", ""));
  const cible = RANGS_DECIMAUX.find(
    ({ denominateur }) => denominateur === denominateurDecimal,
  );
  const selection = etat.rangFractionAide;
  const juste = selection === cible?.id;
  const construction = juste && denominateurDecimal !== 1000
    ? rendreConstructionCorrespondanceLibre(decimal, numerateurDecimal, denominateurDecimal)
    : "";
  return `<section class="atelier-fraction atelier-tableau-decimal atelier-fraction-libre">
    <p class="consigne-atelier"><strong>Quel est le dernier rang écrit ?</strong>
      Choisis-le à partir du seul nombre décimal. Il donnera le dénominateur d’une fraction décimale possible.</p>
    <div class="choix-rang-fraction" role="radiogroup" aria-label="Choisir le dernier rang écrit">
      ${RANGS_DECIMAUX.map((rang) => `<button type="button" class="${selection === rang.id ? "selectionne" : ""}"
        data-action="rang-fraction" data-rang="${rang.id}" role="radio"
        aria-checked="${selection === rang.id}">${rang.libelle}</button>`).join("")}
    </div>
    ${construction}
    ${denominateurDecimal === 1000 ? rendreTableauNumeration(numerateurDecimal, denominateurDecimal, {
      afficherChiffres: juste,
      colonneMiseEnEvidence: selection,
      afficherLecture: false,
      annoncerEcriture: false,
    }) : ""}
    <p class="chaine-fraction"><strong>${echapper(decimal)}</strong><span>=</span>${rendreFractionEmpilee("?", juste ? denominateurDecimal : "?")}</p>
    <p class="conclusion-atelier ${juste ? "visible" : ""}" aria-live="polite">${selection === null
      ? "Repère le dernier chiffre après la virgule, puis choisis son rang."
      : juste
        ? [10, 100].includes(denominateurDecimal) && (
          (denominateurDecimal === 10 && decimal.endsWith(",5"))
          || (denominateurDecimal === 100 && [25, 75].includes(Number(decimal.split(",")[1])))
        )
          ? "Oui. Construis la correspondance entre les deux matériels, puis écris une fraction possible."
          : "Oui. Le tableau est rempli : lis maintenant le numérateur. Une fraction équivalente sera aussi acceptée."
        : "Ce rang ne correspond pas au dernier chiffre écrit. Essaie une autre colonne."}</p>
  </section>`;
}

function rendreAtelierFractions(question, source) {
  if (question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE) {
    return rendreAideFractionLibreRiche(source);
  }
  if ([2, 4].includes(source.denominateur)) {
    const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
    if (
      source.numerateur > source.denominateur
      && (direct || etat.pasFractionAide === source.numerateur)
    ) {
      return rendreAideGroupementRiche(question, source);
    }
      return rendreAidePoseBandesRiche(question, source);
  }
  if ([10, 100, 1000].includes(source.denominateur)) {
    return rendreAideTableauRiche(question, source);
  }
  return rendreAideUnitesRiche(source);
}

function rendreAideFractionsDecimaux(question) {
  if (!etat.aideOuverte) return "";
  const source = blocRationnelQuestion(question);
  const atelier = rendreAtelierFractions(question, source);
  const contenu = `${rendreRappelQuestionFractions(question)}
    <p class="introduction-progression-aide">Construis la quantité étape par étape, puis reviens écrire toi-même la réponse.</p>
    <div class="contenu-atelier-aide-fractions" aria-live="polite">${atelier}</div>
    ${rendreAccesCoursDepuisAide()}`;
  return rendreCadrePanneau({
    type: "aide",
    surtitre: "Pendant la question",
    titre: "Me guider",
    contenu,
    classes: "panneau-aide-fractions panneau-fractions",
  });
}

function rendreReponseEleveFractions(question, source) {
  if (!estEntrainement() || etat.validation === null) return "";
  if (etat.validation.omise) return rendreReponseEleveOmise({ balise: "div" });
  if (question.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE) {
    return rendreReponseEleve(question);
  }
  if (question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL) {
    return `<p class="rappel-reponse-eleve ${classeVerdictReponseEleve()}"><span>Ta réponse</span><strong>${echapper(etat.saisie)}</strong></p>`;
  }
  const numerateur = question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
    ? etat.saisies[0]
    : etat.saisie;
  const denominateur = question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
    ? etat.saisies[1]
    : source.denominateur;
  return `<div class="rappel-reponse-eleve rappel-fraction-eleve ${classeVerdictReponseEleve()}"><span>Ta réponse</span>${rendreFractionEmpilee(numerateur, denominateur)}</div>`;
}

function rendreReponseCorrecteFractions(question, source) {
  const emballer = (contenu, classe = "") => `<div class="reponses-correction reponses-correction-fractions ${classe}" aria-label="Réponse correcte">${contenu}</div>`;
  if (question.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE) {
    const choix = question.reponse.choix.find(({ id }) => question.reponse.attendus.includes(id));
    if (!choix) return "";
    const contenu = question.classement.microNotion === MICRO_NOTION_DECIMAL_VERS_FRACTION
      ? rendreLibelleChoixFraction(choix)
      : `<strong>${echapper(choix.libelle)}</strong>`;
    return emballer(contenu);
  }
  if (question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL) {
    return emballer(`<strong>${echapper(formaterFractionEnDecimal(source.numerateur, source.denominateur))}</strong>`);
  }
  if (question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE) {
    const decimal = formaterFractionEnDecimal(source.numerateur, source.denominateur);
    const denominateurDecimal = 10 ** (decimal.split(",")[1]?.length ?? 0);
    const numerateurDecimal = Number(decimal.replace(",", ""));
    return emballer(rendreFractionEmpilee(numerateurDecimal, denominateurDecimal), "reponse-possible-fraction");
  }
  return emballer(rendreFractionEmpilee(source.numerateur, source.denominateur));
}

function diagnosticQcmFractions(question) {
  if (
    question.reponse.type !== TYPE_REPONSE_CHOIX_UNIQUE
    || etat.validation?.juste
    || etat.selection.length === 0
  ) return "";
  const diagnostic = question.correction?.find(
    (bloc) => bloc.id === `diagnostic-${etat.selection[0]}`,
  );
  return diagnostic
    ? `<p class="diagnostic-fraction"><strong>Ce qui a pu te piéger</strong><span>${echapper(diagnostic.contenu)}</span></p>`
    : "";
}

function chaineCorrectionFractions(question, source) {
  const decimal = formaterFractionEnDecimal(source.numerateur, source.denominateur);
  const fraction = rendreFractionEmpilee(source.numerateur, source.denominateur);
  if (question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL) {
    return `${fraction}<span>=</span><strong>${echapper(decimal)}</strong>`;
  }
  if (question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE) {
    const nombreDecimales = Math.max(0, decimal.split(",")[1]?.length ?? 0);
    const denominateurDecimal = 10 ** nombreDecimales;
    const numerateurDecimal = Number(decimal.replace(",", ""));
    const fractionDecimale = rendreFractionEmpilee(numerateurDecimal, denominateurDecimal);
    const reduite = reduireFraction(numerateurDecimal, denominateurDecimal);
    const equivalenteFamiliere = [1, 2, 4].includes(reduite.denominateur)
      && (reduite.numerateur !== numerateurDecimal
        || reduite.denominateur !== denominateurDecimal);
    return !equivalenteFamiliere
      ? `<strong>${echapper(decimal)}</strong><span>=</span>${fractionDecimale}`
      : `<strong>${echapper(decimal)}</strong><span>=</span>${fractionDecimale}<span>=</span>${rendreFractionEmpilee(reduite.numerateur, reduite.denominateur)}`;
  }
  return `<strong>${echapper(decimal)}</strong><span>=</span>${fraction}`;
}

function rendreDecompositionFractionSuperieure(numerateur, denominateur, {
  sens = MICRO_NOTION_FRACTION_VERS_DECIMAL,
} = {}) {
  const unites = Math.floor(numerateur / denominateur);
  const reste = numerateur % denominateur;
  const decimalTexte = formaterFractionEnDecimal(numerateur, denominateur);
  const decimales = decimalTexte.split(",")[1]?.length ?? 0;
  const source = quotient(nombre(numerateur), nombre(denominateur));
  const decomposition = somme(
    quotient(nombre(unites * denominateur), nombre(denominateur)),
    ...(reste ? [quotient(nombre(reste), nombre(denominateur))] : []),
  );
  const resteReduit = denominateur === 4 && reste === 2
    ? quotient(nombre(1), nombre(2))
    : reste
      ? quotient(nombre(reste), nombre(denominateur))
      : null;
  const mixte = somme(nombre(unites), ...(resteReduit ? [resteReduit] : []));
  const decimal = nombre(Number(decimalTexte.replace(",", ".")), { decimales });
  const membres = [source, decomposition, mixte, decimal];
  if (sens === MICRO_NOTION_DECIMAL_VERS_FRACTION) membres.reverse();
  return versHtmlEgalitesAlignees(egalite(...membres));
}

function rendreVisuelCorrectionFractions(question, source) {
  if (presentationQuestionFractions(question) === "double-droite") {
    return rendreDoubleDroiteRiche(source.numerateur, source.denominateur, {
      sens: question.classement.microNotion,
      reveler: true,
    });
  }
  if ([10, 100, 1000].includes(source.denominateur)) {
    const rang = RANGS_DECIMAUX.find(
      (element) => element.denominateur === source.denominateur,
    );
    return rendreTableauNumeration(source.numerateur, source.denominateur, {
      afficherChiffres: true,
      colonneMiseEnEvidence: rang.id,
    });
  }
  if ([2, 4].includes(source.denominateur)) {
    if (source.numerateur <= source.denominateur) {
      const centiemes = source.numerateur * (100 / source.denominateur);
      return rendreFigureFraction(
        dessinerGrilleFraction({
          colonnes: 10,
          lignes: 10,
          coloriees: centiemes,
          cote: 180,
          ecriture: false,
        }),
        "figure-grille-repere figure-correction-fraction",
      );
    }
    return rendreBandesRailFractions(question, source, {
      solution: true,
      etape: source.denominateur === 4 && source.numerateur % 4 === 2
        ? "reste"
        : "lecture",
      partiesPosees: source.numerateur,
      classes: "figure-correction-fraction",
    });
  }
  return `<div class="tuiles-unites correction-unites" aria-label="${source.numerateur} unités">
    ${Array.from({ length: source.numerateur }, (_, index) => `<span>${index + 1}</span>`).join("")}
  </div>`;
}

function rendreExplicationCorrectionFractions(question, source) {
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  const decimal = formaterFractionEnDecimal(source.numerateur, source.denominateur);
  const chaine = chaineCorrectionFractions(question, source);
  if (question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE) {
    const nombreDecimales = Math.max(0, decimal.split(",")[1]?.length ?? 0);
    const denominateurDecimal = 10 ** nombreDecimales;
    const numerateurDecimal = Number(decimal.replace(",", ""));
    const rangDecimal = RANGS_DECIMAUX.find(
      (element) => element.denominateur === denominateurDecimal,
    );
    const nomRang = rangDecimal?.libelle ?? "unités";
    return `<section class="etape-correction correction-observation">
      ${rendreEtape(1, "Lire le dernier rang écrit", "repere-observation")}
      <p><strong>${echapper(decimal)}</strong> s’arrête au rang des ${nomRang} :
        une fraction décimale peut donc avoir ${denominateurDecimal} au dénominateur.</p>
      ${rendreTableauNumeration(numerateurDecimal, denominateurDecimal, {
        afficherChiffres: true,
        afficherLecture: true,
        annoncerEcriture: true,
        colonneMiseEnEvidence: rangDecimal?.id ?? null,
      })}
    </section>
    <section class="etape-correction correction-conclusion">
      ${rendreEtape(2, "Écrire une réponse possible", "repere-conclusion")}
      <p>Lis le numérateur dans le tableau. Une fraction équivalente, réduite ou non, est tout aussi juste.</p>
      <p class="chaine-fraction">${chaine}</p>
    </section>`;
  }
  const rang = RANGS_DECIMAUX.find(
    (element) => element.denominateur === source.denominateur,
  );
  if (rang) {
    return `<section class="etape-correction correction-observation">
      ${rendreEtape(1, direct
        ? `Lire le dénominateur : ${source.denominateur} nomme les ${rang.libelle}`
        : `Lire ${decimal} jusqu’au rang des ${rang.libelle}`, "repere-observation")}
      <p>${direct
        ? `Le dernier chiffre du numérateur se place dans la colonne des <strong>${rang.libelle}</strong>.`
        : `Tous les chiffres lus en ${rang.libelle} donnent le numérateur ; ${source.denominateur} donne le dénominateur.`}</p>
    </section>
    <section class="etape-correction correction-conclusion">
      ${rendreEtape(2, "Lire le tableau rempli dans l’autre sens", "repere-conclusion")}
      ${rendreVisuelCorrectionFractions(question, source)}
      <p class="chaine-fraction">${chaine}</p>
    </section>`;
  }
  if ([2, 4].includes(source.denominateur) && source.numerateur <= source.denominateur) {
    const centiemes = source.numerateur * (100 / source.denominateur);
    const chaineRepere = direct
      ? `${rendreFractionEmpilee(source.numerateur, source.denominateur)}<span>=</span>${rendreFractionEmpilee(centiemes, 100)}<span>=</span><strong>${echapper(decimal)}</strong>`
      : `<strong>${echapper(decimal)}</strong><span>=</span>${rendreFractionEmpilee(centiemes, 100)}<span>=</span>${rendreFractionEmpilee(source.numerateur, source.denominateur)}`;
    return `<section class="etape-correction correction-observation">
      ${rendreEtape(1, direct
        ? "Transformer le repère en centièmes"
        : "Retrouver le repère dans une unité de 100 cases", "repere-observation")}
      <p>Un ${nomPartFraction(source.denominateur)} occupe ${100 / source.denominateur} cases sur 100 ;
        ${source.numerateur} ${nomPartFraction(source.denominateur, source.numerateur)} ${source.numerateur === 1 ? "en occupe" : "en occupent"} <strong>${centiemes}</strong>.</p>
      ${rendreVisuelCorrectionFractions(question, source)}
    </section>
    <section class="etape-correction correction-conclusion">
      ${rendreEtape(2, direct ? "Écrire les centièmes avec une virgule" : "Lire la fraction correspondante", "repere-conclusion")}
      <p class="chaine-fraction">${chaineRepere}</p>
    </section>`;
  }
  if ([2, 4].includes(source.denominateur)) {
    const unites = Math.floor(source.numerateur / source.denominateur);
    const reste = source.numerateur % source.denominateur;
    return `<section class="etape-correction correction-observation">
      ${rendreEtape(1, "Former toutes les unités complètes", "repere-observation")}
      ${rendreVisuelCorrectionFractions(question, source)}
      <p>${source.numerateur} = ${unites} × ${source.denominateur} + ${reste} : on obtient <strong>${unites} unité${unites > 1 ? "s" : ""}</strong>${reste ? ` et ${reste} ${nomPartFraction(source.denominateur, reste)}` : ", sans reste"}.</p>
    </section>
    <section class="etape-correction correction-conclusion">
      ${rendreEtape(2, reste ? "Convertir seulement ce qui reste" : "Lire le nombre d’unités", "repere-conclusion")}
      <div class="calcul-aligne decomposition-fraction-superieure">${rendreDecompositionFractionSuperieure(
        source.numerateur,
        source.denominateur,
        { sens: question.classement.microNotion },
      )}</div>
    </section>`;
  }
  return `<section class="etape-correction correction-observation">
    ${rendreEtape(1, "Compter les unités", "repere-observation")}
    ${rendreVisuelCorrectionFractions(question, source)}
    <p>Le dénominateur 1 signifie que chaque part vaut déjà une unité.</p>
  </section>
  <section class="etape-correction correction-conclusion">
    ${rendreEtape(2, "Conserver le même nombre", "repere-conclusion")}
    <p class="chaine-fraction">${chaine}</p>
  </section>`;
}

function rendreCorrectionFractionsDecimaux(question) {
  if (!etat.correctionOuverte) return "";
  const source = blocRationnelQuestion(question);
  const contenu = `${rendreRappelQuestionFractions(question)}
    ${rendreReponseEleveFractions(question, source)}
    ${diagnosticQcmFractions(question)}
    <div class="etapes-correction-fractions">
      ${rendreExplicationCorrectionFractions(question, source)}
    </div>
    <p class="titre-reponse-correcte">${question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE ? "Une réponse possible" : "Réponse correcte"}</p>
    ${rendreReponseCorrecteFractions(question, source)}`;
  return rendreCadrePanneau({
    type: "correction",
    surtitre: "Après la réponse",
    titre: "Correction expliquée",
    contenu,
    classes: "panneau-correction-fractions panneau-fractions",
  });
}

function rendreBandesRailCours(
  numerateur,
  denominateur,
  etape = "lecture",
  reveler = true,
  largeur = 720,
) {
  return rendreFigureFraction(
    dessinerBandesFractionnairesSurRailDecimal({
      numerateur,
      denominateur,
      profil: reveler ? "solution" : "aide-nc03",
      etape,
      partiesPosees: numerateur,
      largeur,
    }),
    "figure-bandes-rail figure-bandes-rail-cours",
  );
}

function rendreRepereVisuelCours(numerateur, denominateur) {
  return `<section class="repere-visuel-cours">
    ${rendreBandesRailCours(numerateur, denominateur, "lecture", true, 340)}
  </section>`;
}

function rendreRepereCentCentiemesCours() {
  return `<section class="repere-visuel-cours repere-cent-centiemes">
    ${rendreFigureFraction(dessinerGrilleFraction({
      colonnes: 10,
      lignes: 10,
      coloriees: 100,
      cote: 150,
      ecriture: false,
    }), "figure-grille-repere")}
    ${egalitesCours(fractionCours(100, 100), nombreCours(1))}
  </section>`;
}

function rendreRepereSeptUnitesCours() {
  return `<section class="repere-visuel-cours repere-sept-unites">
    <div class="tuiles-unites tuiles-unites-sans-nombres" aria-label="Sept unités identiques">
      ${Array.from({ length: 7 }, () => '<span aria-hidden="true"></span>').join("")}
    </div>
    ${egalitesCours(fractionCours(7, 1), nombreCours(7))}
  </section>`;
}

const ROLES_RANGS_COURS = Object.freeze({
  unites: "unites",
  dixiemes: "dixiemes",
  centiemes: "centiemes",
  milliemes: "milliemes",
});

function fractionCours(numerateur, denominateur, role = undefined) {
  return quotient(nombre(numerateur), nombre(denominateur), role ? { role } : {});
}

function nombreCours(valeur, role = undefined, decimales = undefined, rangsDecimaux = false) {
  return nombre(valeur, {
    ...(role ? { role } : {}),
    ...(decimales === undefined ? {} : { decimales }),
    ...(rangsDecimaux ? { rangsDecimaux: true } : {}),
  });
}

function egalitesCours(...membres) {
  return `<div class="calcul-aligne calcul-aligne-fractions">${versHtmlEgalitesAlignees(egalite(...membres))}</div>`;
}

function rendreReperesRangsCours() {
  return `<div class="reperes-rangs-cours">
    ${egalitesCours(
      fractionCours(1, 10, ROLES_RANGS_COURS.dixiemes),
      nombreCours(0.1, ROLES_RANGS_COURS.dixiemes, 1),
    )}
    ${egalitesCours(
      fractionCours(1, 100, ROLES_RANGS_COURS.centiemes),
      nombreCours(0.01, ROLES_RANGS_COURS.centiemes, 2),
    )}
    ${egalitesCours(
      fractionCours(1, 1000, ROLES_RANGS_COURS.milliemes),
      nombreCours(0.001, ROLES_RANGS_COURS.milliemes, 3),
    )}
  </div>`;
}

function rendreDecomposition147Cours({ sensInverse = false } = {}) {
  const membres = [
    fractionCours(147, 100),
    somme(
      fractionCours(100, 100, ROLES_RANGS_COURS.unites),
      fractionCours(40, 100, ROLES_RANGS_COURS.dixiemes),
      fractionCours(7, 100, ROLES_RANGS_COURS.centiemes),
    ),
    somme(
      nombreCours(1, ROLES_RANGS_COURS.unites),
      fractionCours(4, 10, ROLES_RANGS_COURS.dixiemes),
      fractionCours(7, 100, ROLES_RANGS_COURS.centiemes),
    ),
    nombreCours(1.47, undefined, 2, true),
  ];
  if (sensInverse) membres.reverse();
  return egalitesCours(...membres);
}

function rendreCarteCoursFractions(index) {
  if (index === 0) {
    return `<article class="carte-cours-fractions carte-cours-correspondance carte-cours-demi">
      <span class="numero-cours">1</span><h3>Construire un demi</h3>
      <p class="introduction-cours"><strong>1. Manipuler.</strong> Pose deux pièces d’un demi : elles reforment exactement une unité.</p>
      ${rendreBandesRailCours(2, 2, "pieces")}
      <p class="introduction-cours"><strong>2. Comparer.</strong> Cinq bandes d’un dixième remplissent exactement la même moitié.</p>
      ${rendreFigureFraction(dessinerDemiAvecDixiemes({
        etape: "comparaison",
        largeur: 560,
        afficherEcritures: true,
        afficherEquation: false,
      }), "figure-correspondance-decimale figure-cours-demi")}
      <p class="etape-abstraite-cours"><strong>3. Écrire.</strong> Les deux matériels ont la même longueur : ils nomment le même nombre.</p>
      ${egalitesCours(
        fractionCours(1, 2),
        fractionCours(5, 10, ROLES_RANGS_COURS.dixiemes),
        nombreCours(0.5, ROLES_RANGS_COURS.dixiemes, 1),
      )}
    </article>`;
  }
  if (index === 1) {
    return `<article class="carte-cours-fractions carte-cours-cpa carte-cours-quarts">
      <span class="numero-cours">2</span><h3>Construire des quarts</h3>
      <p class="introduction-cours"><strong>1. Manipuler.</strong> Quatre pièces d’un quart reforment une unité.</p>
      ${rendreBandesRailCours(4, 4, "pieces")}
      <p class="introduction-cours"><strong>2. Réorganiser.</strong> Les mêmes 25 centièmes, sans rien ajouter ni retirer, remplissent un bloc de 5 × 5 : c’est un quart du carré.</p>
      ${rendreFigureFraction(dessinerReorganisationCentiemes({ centiemes: 25, etape: "comparaison", largeur: 560, afficherEcritures: false }), "figure-correspondance-decimale figure-cours-quarts")}
      ${egalitesCours(
        fractionCours(1, 4),
        fractionCours(25, 100, ROLES_RANGS_COURS.centiemes),
        nombreCours(0.25, ROLES_RANGS_COURS.centiemes, 2),
      )}
      <p class="introduction-cours">Trois blocs identiques occupent trois quarts de l’unité.</p>
      ${rendreFigureFraction(dessinerReorganisationCentiemes({ centiemes: 75, etape: "comparaison", largeur: 560, afficherEcritures: false }), "figure-correspondance-decimale figure-cours-trois-quarts")}
      ${egalitesCours(
        fractionCours(3, 4),
        fractionCours(75, 100, ROLES_RANGS_COURS.centiemes),
        nombreCours(0.75, ROLES_RANGS_COURS.centiemes, 2),
      )}
    </article>`;
  }
  if (index === 2) {
    return `<article class="carte-cours-fractions carte-cours-rangs">
      <span class="numero-cours">3</span><h3>Nommer les rangs décimaux</h3>
      <p class="introduction-cours">L’unité est rouge, le dixième vert et le centième jaune. Le millième violet apparaît seulement dans le tableau.</p>
      ${rendreMaterielDecimalDepuisFraction(147, 100, "figure-materiel-cours")}
      ${rendreReperesRangsCours()}
      ${rendreTableauNumeration(725, 1000, { afficherChiffres: true, afficherLecture: true, colonneMiseEnEvidence: "milliemes" })}
      <p class="definition-cours"><strong>Notation :</strong> dans 0,725, le 7 est au rang des dixièmes, le 2 au rang des centièmes et le 5 au rang des millièmes.</p>
    </article>`;
  }
  if (index === 3) {
    return `<article class="carte-cours-fractions carte-cours-conversion-directe">
      <span class="numero-cours">4</span><h3>Fraction décimale vers décimal</h3>
      <p class="introduction-cours"><strong>1. Construire.</strong> Le matériel représente 1 unité, 4 dixièmes et 7 centièmes.</p>
      ${rendreMaterielDecimalDepuisFraction(147, 100, "figure-materiel-cours")}
      ${rendreTableauNumeration(147, 100, { afficherChiffres: true, afficherLecture: false, colonneMiseEnEvidence: "centiemes" })}
      <p class="etape-abstraite-cours"><strong>2. Écrire.</strong> Chaque signe égal est aligné : la quantité ne change pas.</p>
      ${rendreDecomposition147Cours()}
      <p class="definition-cours">Le dénominateur 100 place le dernier chiffre du numérateur dans les centièmes. Les zéros de position doivent être conservés.</p>
    </article>`;
  }
  if (index === 4) {
    return `<article class="carte-cours-fractions carte-cours-conversion-inverse">
      <span class="numero-cours">5</span><h3>Décimal vers fraction</h3>
      <p class="introduction-cours"><strong>Le demi.</strong> 0,5 signifie 5 dixièmes. Les cinq bandes vertes occupent la même moitié que la pièce jaune.</p>
      ${rendreFigureFraction(dessinerDemiAvecDixiemes({
        etape: "comparaison",
        largeur: 560,
        afficherEcritures: true,
        afficherEquation: false,
      }), "figure-correspondance-decimale")}
      ${egalitesCours(
        nombreCours(0.5, ROLES_RANGS_COURS.dixiemes, 1),
        fractionCours(5, 10, ROLES_RANGS_COURS.dixiemes),
        fractionCours(1, 2),
      )}
      <p class="introduction-cours"><strong>Les quarts.</strong> 0,75 signifie 75 centièmes. Réorganisés par blocs de 25, ils forment trois quarts.</p>
      ${rendreFigureFraction(dessinerReorganisationCentiemes({ centiemes: 75, etape: "comparaison", largeur: 560, afficherEcritures: false }), "figure-correspondance-decimale")}
      ${egalitesCours(
        nombreCours(0.75, ROLES_RANGS_COURS.centiemes, 2),
        fractionCours(75, 100, ROLES_RANGS_COURS.centiemes),
        fractionCours(3, 4),
      )}
      <p class="definition-cours">En réponse libre, 75/100 et 3/4 sont toutes les deux correctes. On ne réduit que si la consigne le demande.</p>
    </article>`;
  }
  return `<article class="carte-cours-fractions carte-cours-unites">
    <span class="numero-cours">6</span><h3>Former les unités, puis traiter le reste</h3>
    <section class="exemple-cours-superieur">
      <h4>Sept demis</h4>
      <p>On part bien des 7 pièces. Puis six demis forment 3 unités ; il reste 1 demi.</p>
      <div class="transformation-bandes-cours">
        <section><strong>Au départ : 7 demis</strong>${rendreBandesRailCours(7, 2, "pieces", false)}</section>
        <span class="fleche-transformation-cours" aria-hidden="true">↓</span>
        <section><strong>Après regroupement</strong>${rendreBandesRailCours(7, 2, "unites")}</section>
      </div>
      ${rendreDecompositionFractionSuperieure(7, 2)}
    </section>
    <section class="exemple-cours-superieur">
      <h4>Six quarts</h4>
      <p>On part des 6 quarts. Quatre quarts forment 1 unité ; les 2 quarts restants se fusionnent en 1 demi.</p>
      <div class="transformation-bandes-cours">
        <section><strong>Au départ : 6 quarts</strong>${rendreBandesRailCours(6, 4, "pieces", false)}</section>
        <span class="fleche-transformation-cours" aria-hidden="true">↓</span>
        <section><strong>Après regroupement</strong>${rendreBandesRailCours(6, 4, "reste")}</section>
      </div>
      ${rendreDecompositionFractionSuperieure(6, 4)}
    </section>
    <h4 class="titre-reperes-visuels">Quelques repères à automatiser</h4>
    <div class="reperes-visuels-cours">
      ${rendreRepereVisuelCours(3, 2)}
      ${rendreRepereVisuelCours(4, 2)}
      ${rendreRepereVisuelCours(5, 2)}
      ${rendreRepereCentCentiemesCours()}
      ${rendreRepereSeptUnitesCours()}
    </div>
    <p class="definition-cours definition-cours-quotient"><strong>À retenir en dernier :</strong> la barre de fraction signifie aussi une division. Diviser le numérateur par le dénominateur donne toujours la valeur, mais ici les repères et le matériel sont la première stratégie.</p>
  </article>`;
}

function rendreCoursFractionsDecimaux() {
  if (!etat.coursOuvert) return "";
  const total = nombrePagesCours();
  const titres = [
    "Construire un demi",
    "Construire des quarts",
    "Nommer les rangs décimaux",
    "Fraction décimale vers décimal",
    "Décimal vers fraction",
    "Dépasser l’unité",
  ];
  const derniere = pageCoursCourante === total - 1;
  const pied = `<nav class="navigation-cours" aria-label="Navigation dans le cours">
    <button class="bouton-secondaire" type="button" data-action="cours-precedent" ${pageCoursCourante === 0 ? "disabled" : ""}>Précédent</button>
    <div class="points-cours" aria-label="Page ${pageCoursCourante + 1} sur ${total}">${Array.from({ length: total }, (_, page) => `<span class="${page === pageCoursCourante ? "actif" : ""}"></span>`).join("")}</div>
    <button class="bouton-principal" type="button" data-action="${derniere ? "fermer-cours" : "cours-suivant"}">${derniere ? "J’ai compris" : "Suivant"}</button>
  </nav>`;
  return rendreCadrePanneau({
    type: "cours",
    surtitre: `Cours · ${pageCoursCourante + 1} / ${total}`,
    titre: titres[pageCoursCourante],
    contenu: `<div class="cours-une-carte">${rendreCarteCoursFractions(pageCoursCourante)}</div>`,
    pied,
    classes: "panneau-cours-fractions panneau-fractions",
  });
}

const RENDUS_COURS = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreCoursDivisibilite,
  [RENDU_CARRES]: rendreCoursCarres,
  [RENDU_FRACTIONS_DECIMAUX]: rendreCoursFractionsDecimaux,
  [RENDU_SOLIDE]: rendreCoursReconnaissance,
  [RENDU_VOLUME]: rendreCoursVolumes,
});

const RENDUS_AIDE = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreAideDivisibilite,
  [RENDU_CARRES]: rendreAideCarres,
  [RENDU_FRACTIONS_DECIMAUX]: rendreAideFractionsDecimaux,
  [RENDU_SOLIDE]: rendreAideSolides,
  [RENDU_VOLUME]: rendreAideVolumes,
});

const RENDUS_CORRECTION = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreCorrectionDivisibilite,
  [RENDU_CARRES]: rendreCorrectionCarres,
  [RENDU_FRACTIONS_DECIMAUX]: rendreCorrectionFractionsDecimaux,
  [RENDU_SOLIDE]: rendreCorrectionSolides,
  [RENDU_VOLUME]: rendreCorrectionVolumes,
});

const RENDUS_QUESTION = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreQuestionDivisibilite,
  [RENDU_CARRES]: rendreQuestionCarres,
  [RENDU_FRACTIONS_DECIMAUX]: rendreQuestionFractionsDecimaux,
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

function microNotionTrace(trace) {
  return normaliserIdentifiantMicroNotion(
    trace.classement?.microNotion ?? trace.microNotion,
  );
}

function rendreBilanFractionsDecimaux() {
  if (
    !estEntrainement()
    || !etat.configuration.notions.includes(NOTION_FRACTIONS_SIMPLES_DECIMAUX)
  ) {
    return "";
  }
  const traces = etat.traces.filter((trace) => [
    MICRO_NOTION_FRACTION_VERS_DECIMAL,
    MICRO_NOTION_DECIMAL_VERS_FRACTION,
  ].includes(microNotionTrace(trace)));
  const ligne = (microNotion, libelle) => {
    const sousEnsemble = traces.filter(
      (trace) => microNotionTrace(trace) === microNotion,
    );
    const reussites = sousEnsemble.filter((trace) => trace.juste).length;
    return `<p><span>${echapper(libelle)}</span><strong>${reussites} / ${sousEnsemble.length}</strong></p>`;
  };
  const aides = traces.filter((trace) => trace.aideConsultee).length;
  return `<section class="detail-bilan-fractions" aria-label="Détail fractions et décimaux">
    ${ligne(MICRO_NOTION_FRACTION_VERS_DECIMAL, "Fraction → décimal")}
    ${ligne(MICRO_NOTION_DECIMAL_VERS_FRACTION, "Décimal → fraction")}
    <p><span>Aides ouvertes</span><strong>${aides} / ${traces.length}</strong></p>
  </section>`;
}

function rendreBilan() {
  const entrainement = estEntrainement();
  const volume = etat.seance.nombreQuestions;
  const nombreNotions = etat.configuration.notions.length;
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
      <div class="notion-bilan">${nombreNotions === 1
        ? echapper(nomNotion(etat.configuration.notions[0]))
        : `<strong>${libelleNombreAutomatismes(nombreNotions)} révisés</strong>${rendreListeNotionsSelectionnees({ compacte: true })}`}</div>
      ${rendreBilanFractionsDecimaux()}
      ${entrainement ? `<p class="conseil-bilan">${echapper(conseil)}</p>` : ""}
      <div class="actions-bilan">
        <button class="bouton-principal bouton-large" data-action="nouvelle-serie">Nouvelle série</button>
        <button class="bouton-secondaire bouton-large" data-action="recommencer">Refaire la même série</button>
        <button class="bouton-secondaire bouton-large" data-action="retour-menu">Choisir une autre série</button>
      </div>
    </main>`;
}

export function doitAfficherIndicateurDefilementPanneau({
  scrollHeight,
  clientHeight,
  scrollTop,
}) {
  const deborde = scrollHeight > clientHeight + 2;
  const estEnHaut = scrollTop <= 8;
  return deborde && estEnHaut;
}

function installerIndicateurDefilementPanneau(panneau) {
  const corps = panneau?.querySelector?.(".corps-panneau");
  const indicateur = panneau?.querySelector?.("[data-indicateur-defilement]");
  if (!corps || !indicateur) return;
  const actualiser = () => {
    indicateur.hidden = !doitAfficherIndicateurDefilementPanneau(corps);
  };
  if (corps.dataset?.indicateurInstalle !== "true") {
    if (corps.dataset) corps.dataset.indicateurInstalle = "true";
    corps.addEventListener?.("scroll", actualiser, { passive: true });
  }
  globalThis.requestAnimationFrame?.(actualiser);
  document.fonts?.ready?.then?.(() => {
    if (corps.isConnected !== false) actualiser();
  });
}

function rendre({
  focusPanneau = false,
  focusSelector = "",
  reinitialiserDefilementPanneau = false,
} = {}) {
  const panneauAvant = application.querySelector?.(".panneau");
  const idPanneauAvant = panneauAvant?.id ?? "";
  const corpsPanneauAvant = panneauAvant?.querySelector?.(".corps-panneau");
  const positionPanneau = corpsPanneauAvant?.scrollTop ?? 0;
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
  const memePanneau = !reinitialiserDefilementPanneau
    && panneau?.id === idPanneauAvant;
  const doitRestaurerDefilement = memePanneau && positionPanneau > 0;
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
  installerIndicateurDefilementPanneau(panneau);
}

window.addEventListener("resize", () => {
  installerIndicateurDefilementPanneau(application.querySelector?.(".panneau"));
});

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
    if (VOLUMES_MENU.includes(volume) && volume >= configurationMenu.notions.length) {
      configurationMenu.nombreQuestions = volume;
    }
  }
  if (action === "choisir-notion") {
    const notionDemandee = cible.dataset.value;
    if (DOMAINES_MENU.some((domaine) => domaine.notions.includes(notionDemandee))) {
      const selection = new Set(configurationMenu.notions);
      if (selection.has(notionDemandee)) {
        selection.delete(notionDemandee);
      } else if (selection.size < VOLUMES_MENU.at(-1)) {
        selection.add(notionDemandee);
      }
      configurationMenu.notions = trierNotionsMenu([...selection]);
      if (configurationMenu.nombreQuestions < configurationMenu.notions.length) {
        configurationMenu.nombreQuestions = VOLUMES_MENU.find(
          (volume) => volume >= configurationMenu.notions.length,
        ) ?? VOLUMES_MENU.at(-1);
      }
    }
  }
  if (action === "preparer") {
    if (
      configurationMenu.notions.length === 0
      || configurationMenu.notions.some((notion) => !connaitNotionLecteur(notion))
      || configurationMenu.notions.length > configurationMenu.nombreQuestions
    ) return;
    etat = creerEtatLecteur({
      ...configurationMenu,
      notions: [...configurationMenu.notions],
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
  if (action === "caractere") {
    saisirCaractere(etat, cible.dataset.value);
    focusSelector = `[data-action="caractere"][data-value="${cible.dataset.value}"]`;
  }
  if (action === "effacer-saisie") {
    effacerSaisie(etat);
    focusSelector = '[data-action="effacer-saisie"]';
  }
  if (action === "valider") {
    validerReponse(etat);
    if (etat.correctionOuverte) {
      focusPanneau = true;
      reinitialiserDefilementPanneau = true;
    } else if (etat.validation !== null) {
      focusSelector = '[data-action="correction"]';
    }
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
  if (action === "repere-aide") {
    selectionnerRepereAide(etat, cible.dataset.value);
    focusSelector = `[data-action="repere-aide"][data-value="${cible.dataset.value}"]`;
  }
  if (action === "pas-fraction-precedent") {
    avancerFractionAide(etat, -1);
    focusSelector = '[data-action="pas-fraction-precedent"]';
  }
  if (action === "pas-fraction-suivant") {
    avancerFractionAide(etat, 1);
    focusSelector = etat.pasFractionAide === blocRationnelQuestion(questionCourante(etat))?.numerateur
      ? '[data-action="pas-fraction-precedent"]'
      : '[data-action="pas-fraction-suivant"]';
  }
  if (action === "groupe-unite-precedent") {
    grouperUniteFractionAide(etat, -1);
    focusSelector = '[data-action="groupe-unite-precedent"]';
  }
  if (action === "groupe-unite-suivant") {
    grouperUniteFractionAide(etat, 1);
    focusSelector = '[data-action="groupe-unite-precedent"]';
  }
  if (action === "rang-fraction") {
    choisirRangFractionAide(etat, cible.dataset.rang);
    focusSelector = `[data-action="rang-fraction"][data-rang="${cible.dataset.rang}"]`;
  }
  if (action === "correspondance-precedente") {
    avancerCorrespondanceAide(etat, -1, Number(cible.dataset.maximum));
    focusSelector = '[data-action="correspondance-precedente"]';
  }
  if (action === "correspondance-suivante") {
    avancerCorrespondanceAide(etat, 1, Number(cible.dataset.maximum));
    focusSelector = etat.etapeCorrespondanceAide === Number(cible.dataset.maximum)
      ? '[data-action="correspondance-precedente"]'
      : '[data-action="correspondance-suivante"]';
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
  if (action === "cours-notion") {
    menuSessionOuvert = false;
    pageCoursCourante = 0;
    ouvrirCours(etat, cible.dataset.notion);
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
  if (action === "suivant") {
    const sansValidationAvant = estEntrainement() && etat.validation === null;
    passerQuestionSuivante(etat);
    if (sansValidationAvant && etat.correctionOuverte) {
      focusPanneau = true;
      reinitialiserDefilementPanneau = true;
    }
  }
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

application.addEventListener("input", (evenement) => {
  const cible = evenement.target.closest?.('[data-action="position-fraction"]');
  if (!cible) return;
  positionnerFractionAide(etat, Number(cible.value));
  rendre({
    focusSelector: '[data-action="position-fraction"]',
  });
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
    } else {
      const question = questionCourante(etat);
      const champFocus = document.activeElement?.closest?.(
        '[data-action="champ-reponse"]',
      );
      if (
        estEntrainement()
        && etat.validation === null
        && question?.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
        && champFocus
      ) {
        const indexCourant = Number(champFocus.dataset.index);
        const index = !evenement.shiftKey && indexCourant === 0
          ? 1
          : evenement.shiftKey && indexCourant === 1
            ? 0
            : null;
        if (index !== null) {
          evenement.preventDefault?.();
          selectionnerChampSaisie(etat, index);
          rendre({
            focusSelector: `[data-action="champ-reponse"][data-index="${index}"]`,
          });
        }
      }
    }
    return;
  }
  if (menuSessionOuvert || etat.aideOuverte || etat.correctionOuverte || etat.coursOuvert) return;
  const question = questionCourante(etat);
  if (!question || etat.validation !== null || !estReponseNumerique(question)) return;
  if (/^[0-9]$/.test(evenement.key)) {
    evenement.preventDefault?.();
    saisirCaractere(etat, evenement.key);
    rendre({
      focusSelector: question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
        ? `[data-action="champ-reponse"][data-index="${etat.champSaisieActif}"]`
        : "",
    });
  } else if (
    question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL
    && [".", ","].includes(evenement.key)
  ) {
    evenement.preventDefault?.();
    saisirCaractere(etat, evenement.key);
    rendre();
  } else if (evenement.key === "Backspace") {
    evenement.preventDefault?.();
    effacerSaisie(etat);
    rendre({
      focusSelector: question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
        ? `[data-action="champ-reponse"][data-index="${etat.champSaisieActif}"]`
        : "",
    });
  } else if (evenement.key === "Enter") {
    evenement.preventDefault?.();
    validerReponse(etat);
    rendre({
      focusPanneau: etat.correctionOuverte,
      reinitialiserDefilementPanneau: etat.correctionOuverte,
    });
  }
});

application.addEventListener("focusin", (evenement) => {
  const cible = evenement.target.closest?.('[data-action="champ-reponse"]');
  if (!cible || etat.validation !== null) return;
  const index = Number(cible.dataset.index);
  if (etat.champSaisieActif === index) return;
  selectionnerChampSaisie(etat, index);
  rendre({
    focusSelector: `[data-action="champ-reponse"][data-index="${index}"]`,
  });
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
