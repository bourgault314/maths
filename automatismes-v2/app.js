import {
  COULEURS,
  COULEURS_RANGS_NUMERATION_DECIMALE,
  RAYONS,
  TYPOGRAPHIE,
} from "../packages/charte/src/charte.js?v=53";
import {
  actualiserInteractionRepereAide,
  avancerEchelleRepereAide,
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
  NOTION_ECRITURES_MULTIPLES_NOMBRE,
  NOTION_DROITE_GRADUEE,
  NOTION_LIRE_COORDONNEES_POINT,
  NOTION_PLACER_POINT_REPERE,
  NOTION_DECIMAL_VERS_FRACTION,
  NOTION_FRACTION_VERS_DECIMAL,
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
  choisirRangFractionAide,
  grouperUniteFractionAide,
  positionnerFractionAide,
  saisirCaractere,
  saisirChiffre,
  tournerSolide,
  validerReponse,
} from "./src/etat-lecteur.js?v=53";
import {
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
  TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "../packages/contrats/src/question-v2.js?v=53";
import {
  connaitNotionLecteur,
  DOMAINES_MENU,
  domainesMenuPourNiveau,
  graineIconesDomainesDuJour,
  LIBELLES_MODULES_MENU,
  NIVEAUX_PARCOURS,
  notionsVisiblesPourNiveau,
  obtenirNotionLecteur,
  RENDU_CARRES,
  RENDU_DIVISIBILITE,
  RENDU_ECRITURES_MULTIPLES,
  RENDU_DROITE_GRADUEE,
  RENDU_REPERAGE_PLAN,
  RENDU_FRACTIONS_DECIMAUX,
  RENDU_SOLIDE,
  RENDU_VOLUME,
  rendreIconeDomaineMenu,
  NOTION_FRACTIONS_SIMPLES_DECIMAUX,
} from "./src/registre-lecteur.js?v=53";
import {
  MICRO_NOTIONS_AUTOMATISMES,
  normaliserIdentifiantMicroNotion,
} from "../packages/automatismes/src/identifiants.js?v=53";
import { COURS_SOLIDES_USUELS } from "../packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js?v=53";
import {
  creerCone,
  creerCube,
  creerCylindre,
  creerPave,
  creerPrisme,
  creerPyramide,
  dessinerSolide,
} from "../packages/objets/src/solides.js?v=53";
import {
  ACTION_TOUCHE_EFFACER,
  ACTION_TOUCHE_SAISIR,
  ACTION_TOUCHE_VALIDER,
  obtenirDispositionClavier,
} from "../packages/objets/src/clavier.js?v=53";
import { formulationCritereDivisibilite } from "../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/critere-precis.js?v=53";
import {
  caseVide,
  difference,
  egalite,
  groupe,
  inferieurStrict,
  nombre,
  nombreDecimalAvecRangs,
  produit,
  puissance,
  quotient,
  somme,
  texteCourt,
  variable,
  versHtmlEgalitesAlignees,
  versHtmlSemantique,
} from "../packages/objets/src/expressions.js?v=53";
import {
  dessinerCarreQuadrille,
} from "../packages/objets/src/carre-quadrille.js?v=53";
import {
  dessinerDoubleDroiteGraduee,
  dessinerDroiteGraduee,
} from "../packages/objets/src/droite-graduee.js?v=53";
import {
  dessinerRepereCartesien,
  positionDansRepere,
} from "../packages/objets/src/repere-cartesien.js?v=53";
import { dessinerGrilleFraction } from "../packages/objets/src/fractions.js?v=53";
import { dessinerBandesFractionnairesSurRailDecimal } from "../packages/objets/src/bandes-fractions-rail.js?v=53";
import {
  dessinerConversionRangsNumerationDecimale,
  dessinerEchangeRangsNumerationDecimale,
  dessinerMaterielNumerationDecimale,
  dessinerTableauNumerationDecimale,
} from "../packages/objets/src/numeration-decimale.js?v=53";
import {
  dessinerDemiAvecDixiemes,
  dessinerReorganisationCentiemes,
} from "../packages/objets/src/correspondances-decimales.js?v=53";
import {
  construireDonneesTableauDepuisFraction,
  formaterFractionEnDecimal,
  formaterFractionEnDecimalSignee,
  reduireFraction,
} from "../packages/objets/src/fractions-decimaux.js?v=53";
import {
  diagnostiquerDecimalVersNumerateur,
  diagnostiquerFractionLibre,
  diagnostiquerFractionVersDecimal,
} from "./src/diagnostic-fractions-decimaux.js?v=53";
import {
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
  FAMILLE_UNITE_DEPASSEMENT,
  formaterPourcentageEnDecimal,
  lirePourcentageQuestion,
} from "../packages/automatismes/src/nombres-et-calculs/ecritures-multiples-nombre/questions.js?v=53";
import {
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_PLACER_POINT_REPERE,
  FORMULATION_COORDONNEE_SYMBOLIQUE,
  decoderCoordonnee,
  encoderCoordonnee,
  formaterCouple,
  formaterEntierRepere,
} from "../packages/automatismes/src/espace-et-geometrie/reperage-plan/questions.js?v=53";
import {
  diagnostiquerChoixQcmRepere,
  diagnostiquerCoordonneeSeule,
  diagnostiquerCoupleRepere,
} from "./src/diagnostic-reperage-plan.js?v=53";
const MICRO_NOTION_FRACTION_VERS_DECIMAL =
  MICRO_NOTIONS_AUTOMATISMES.FRACTION_VERS_DECIMAL;
const MICRO_NOTION_DECIMAL_VERS_FRACTION =
  MICRO_NOTIONS_AUTOMATISMES.DECIMAL_VERS_FRACTION;

const application = document.querySelector("#application");
const rechercheInitiale = window.location.search;
const arriveeSansParametre = rechercheInitiale.length === 0;
let etat = creerEtatLecteur(lireConfiguration(rechercheInitiale));
let menuAccueilOuvert = arriveeSansParametre;
let menuSessionOuvert = false;
let domaineMenuOuvert = null;
let pageCoursCourante = 0;
let etapeCoursRepere = 0;
let compteurSeries = 0;
const GRAINE_ICONES_DOMAINES = graineIconesDomainesDuJour();
const VOLUMES_MENU = Object.freeze([5, 10, 15, 20]);
let configurationMenu = {
  niveau: etat.configuration.niveau,
  mode: etat.configuration.mode,
  aide: etat.configuration.aide,
  nombreQuestions: VOLUMES_MENU.includes(etat.configuration.nombreQuestions)
    ? etat.configuration.nombreQuestions
    : 10,
  notions: arriveeSansParametre ? [] : [...etat.configuration.notions],
};

function creerGraineSerie() {
  compteurSeries += 1;
  return `serie-${Date.now()}-${compteurSeries}`;
}

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
  return etat.configuration.aide !== "indisponible"
    && definitionNotion().capacites.cours;
}

function estReponseNumerique(question) {
  return [
    TYPE_REPONSE_ENTIER_NATUREL,
    TYPE_REPONSE_DEUX_ENTIERS,
    TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
    TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX,
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
  if (nombreQuestions < nombreNotions) {
    return `${nombreQuestions} automatismes tirés sans remise`;
  }
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

function notionsSelectionneesVisiblesMenu() {
  const visibles = new Set(notionsVisiblesPourNiveau(configurationMenu.niveau));
  return trierNotionsMenu(configurationMenu.notions)
    .filter((notion) => visibles.has(notion));
}

function definirSelectionMenu(notions) {
  configurationMenu.notions = trierNotionsMenu([...new Set(notions)]);
}

function libelleNiveauResume(niveau = configurationMenu.niveau) {
  return `${niveau} · Sans calculatrice`;
}

function libelleAide(aide = configurationMenu.aide) {
  return aide === "indisponible" ? "Sans aide" : "Avec aide";
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
for (const [rang, palette] of Object.entries(COULEURS_RANGS_NUMERATION_DECIMALE)) {
  document.documentElement.style.setProperty(`--mg-rang-${rang}`, palette.texte);
  document.documentElement.style.setProperty(
    `--mg-rang-${rang}-pedagogique`,
    palette.textePedagogique,
  );
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

function rendreIconeCalculatriceBarree(classe = "dnb-launch-icon") {
  return `<svg class="${echapper(classe)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
  return domainesMenuPourNiveau(configurationMenu.niveau)
    .map((domaine) => {
      const nombreSelectionne = domaine.notions.filter((notion) => selection.has(notion)).length;
      const selectionnee = nombreSelectionne > 0;
      const vide = domaine.notions.length === 0;
      const complete = !vide && nombreSelectionne === domaine.notions.length;
      const etatSelection = complete ? "true" : selectionnee ? "mixed" : "false";
      const ouvert = domaineMenuOuvert === domaine.id;
      const classes = [
        "theme-group",
        selectionnee ? "has-selection" : "",
        complete ? "is-complete" : "",
        vide ? "is-empty" : "",
      ].filter(Boolean).join(" ");
      return `<details class="${classes}"
        data-theme="${echapper(domaine.id)}" ${ouvert ? "open" : ""}>
        <summary class="theme-summary">
          <span class="theme-icon" aria-hidden="true">${rendreIconeDomaineMenu(domaine.icone, GRAINE_ICONES_DOMAINES)}</span>
          <span class="theme-name">${echapper(domaine.nom)}</span>
          <span class="theme-count">${nombreSelectionne} / ${domaine.notions.length}${vide ? "" : ` <span class="theme-count-label">sélectionné${nombreSelectionne === 1 ? "" : "s"}</span>`}</span>
          <span class="theme-chevron" aria-hidden="true"></span>
        </summary>
        <div class="theme-items">
          ${vide
            ? '<p class="theme-empty-message">Aucun automatisme disponible pour le moment.</p>'
            : `<button class="theme-select-all" type="button"
                data-action="selectionner-domaine" data-value="${echapper(domaine.id)}"
                role="checkbox" aria-checked="${etatSelection}"
                aria-label="${complete ? "Désélectionner" : "Sélectionner"} tous les automatismes de ${echapper(domaine.nom)}">
                <span class="theme-select-mark" aria-hidden="true">${complete ? "✓" : selectionnee ? "−" : ""}</span>
                <span>Tout sélectionner dans ce domaine</span>
              </button>
              <div class="module-subgroup-items">
              ${domaine.notions.map((idNotion) => {
              const libelle = LIBELLES_MODULES_MENU[idNotion];
              const estSelectionnee = selection.has(idNotion);
              return `<label class="modrow${estSelectionnee ? " is-selected" : ""}">
                <input type="checkbox" data-action="choisir-notion" data-value="${echapper(idNotion)}"
                  ${estSelectionnee ? "checked" : ""}>
                <span><strong>${echapper(libelle.titre)}</strong><small>${echapper(libelle.precision)}</small></span>
              </label>`;
            }).join("")}
            </div>`}
        </div>
      </details>`;
    })
    .join("");
}

function rendreMenuAccueil() {
  const entrainement = configurationMenu.mode === "entrainement";
  const avecAide = configurationMenu.aide !== "indisponible";
  const notionsSelectionnees = notionsSelectionneesVisiblesMenu();
  const nombreSelectionne = notionsSelectionnees.length;
  const notionsVisibles = notionsVisiblesPourNiveau(configurationMenu.niveau);
  const selection = new Set(configurationMenu.notions);
  const toutesVisiblesSelectionnees = notionsVisibles.length > 0
    && notionsVisibles.every((notion) => selection.has(notion));
  const selectionValide = nombreSelectionne > 0
    && notionsSelectionnees.every(connaitNotionLecteur);
  const repartition = libelleRepartition(
    nombreSelectionne,
    configurationMenu.nombreQuestions,
  );
  const barreLancement = nombreSelectionne > 0
    ? `<div class="setup-action-shell" aria-label="Résumé et lancement de la série">
      <div class="setup-action-bar">
        <div class="setup-summary" aria-live="polite">
          <strong>${libelleNombreAutomatismes(nombreSelectionne)} sélectionné${nombreSelectionne === 1 ? "" : "s"}</strong>
          <span>${echapper(libelleNiveauResume())} · ${configurationMenu.nombreQuestions} questions${repartition ? ` · ${echapper(repartition)}` : ""} · ${libelleMode(configurationMenu.mode)} · ${libelleAide()}</span>
        </div>
        <div class="launch-cluster">
          <span class="sans-calculatrice-context" role="img" aria-label="Série sans calculatrice" title="Série sans calculatrice">
            ${rendreIconeCalculatriceBarree("sans-calculatrice-icon")}
          </span>
          <button class="generate-action" type="button" data-action="preparer" ${selectionValide ? "" : "disabled"}>Lancer la série</button>
        </div>
      </div>
    </div>`
    : "";
  return `<main class="menu-v10${nombreSelectionne > 0 ? " has-launch-action" : ""}">
    <div class="app">
      <header class="header">
        <a class="logo-link" href="/" aria-label="Retour à l'accueil maths&go" title="Retour à l'accueil maths&go">
          <img class="logo" src="/assets/img/mathsgo-logo.png" alt="maths&go">
        </a>
        <div class="title">
          <h1>Automatismes<span class="title-cycle">Cycle 4 – DNB</span></h1>
        </div>
      </header>

      <div class="panel">
        <section class="settings-card" aria-labelledby="settingsTitle">
          <div class="section-heading">
            <span class="section-step section-step-settings" aria-hidden="true">1</span>
            <h2 id="settingsTitle">Préparer la série</h2>
          </div>
          <div class="controls-grid">
          <div class="controls-row">
            <div class="field field-level">
              <label id="levelLabel">Niveau</label>
              <div class="segmented-control segmented-level" role="group" aria-labelledby="levelLabel">
                ${NIVEAUX_PARCOURS.map((niveau, index) => `${index === NIVEAUX_PARCOURS.length - 1 ? '<span class="level-separator" aria-hidden="true"></span>' : ""}<button type="button"
                  class="segment-btn ${niveau === "DNB" ? "segment-btn-dnb" : ""} ${configurationMenu.niveau === niveau ? "is-active" : ""}"
                  data-action="choisir-niveau" data-value="${niveau}"
                  aria-pressed="${configurationMenu.niveau === niveau}"
                  ${niveau === "DNB" ? 'aria-label="DNB — révision de l’épreuve, sans calculatrice"' : ""}>
                  <span class="level-label">${niveau}</span>
                  ${niveau === "DNB" ? rendreIconeCalculatriceBarree("dnb-level-icon") : ""}
                </button>`).join("")}
              </div>
            </div>
            <div class="field field-help">
              <label id="helpLabel">Aide</label>
              <div class="segmented-control" role="group" aria-labelledby="helpLabel">
                <button type="button" class="segment-btn ${avecAide ? "is-active" : ""}"
                  data-action="choisir-aide" data-value="disponible" aria-pressed="${avecAide}">Avec aide</button>
                <button type="button" class="segment-btn ${avecAide ? "" : "is-active"}"
                  data-action="choisir-aide" data-value="indisponible" aria-pressed="${!avecAide}">Sans aide</button>
              </div>
            </div>
          </div>
          <div class="controls-row">
            <div class="field field-mode">
              <label id="modeLabel">Mode</label>
              <div class="segmented-control" role="group" aria-labelledby="modeLabel">
                <button type="button" class="segment-btn ${entrainement ? "is-active" : ""}"
                  data-action="choisir-mode" data-value="entrainement" aria-pressed="${entrainement}">S'entraîner</button>
                <button type="button" class="segment-btn ${entrainement ? "" : "is-active"}"
                  data-action="choisir-mode" data-value="tableau" aria-pressed="${!entrainement}">Au tableau</button>
              </div>
            </div>
            <div class="field field-count">
              <label id="countLabel">Nombre de questions</label>
              <div class="segmented-control" role="group" aria-labelledby="countLabel">
                ${VOLUMES_MENU.map((volume) => `<button type="button" class="segment-btn ${configurationMenu.nombreQuestions === volume ? "is-active" : ""}"
                  data-action="choisir-volume" data-value="${volume}"
                  aria-pressed="${configurationMenu.nombreQuestions === volume}">${volume}</button>`).join("")}
              </div>
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
            <div class="bulk-actions" role="group" aria-label="Sélection des automatismes">
              <button type="button" data-action="selectionner-tout"
                aria-label="Tout sélectionner" ${toutesVisiblesSelectionnees || notionsVisibles.length === 0 ? "disabled" : ""}>Tous</button>
              <button type="button" data-action="selectionner-aucun"
                aria-label="Tout désélectionner" ${configurationMenu.notions.length === 0 ? "disabled" : ""}>Aucun</button>
            </div>
          </div>
          <div class="modules" aria-label="Domaines d'automatismes">
            ${rendreDomainesMenu()}
          </div>
          <div class="menu-footer-row">
            <details class="acknowledgements">
              <summary>Remerciements</summary>
              <p>Un grand merci à Claire pour son regard pédagogique, ses relectures attentives et toutes ses précieuses idées, qui contribuent à améliorer ce projet.</p>
            </details>
            <span class="menu-footer-separator" aria-hidden="true">·</span>
            <button class="cookie-manage-link" type="button" data-mathsgo-consent-open
              onclick="window.mathsgoConsentement &amp;&amp; window.mathsgoConsentement.ouvrir()">Gérer mes cookies</button>
          </div>
        </section>
      </div>
    </div>

    ${barreLancement}
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
  if (etat.configuration.aide === "indisponible") return "";
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
      <p class="surtitre">${etat.configuration.niveau === "DNB" ? "Préparation au brevet" : `Automatismes de ${echapper(etat.configuration.niveau)}`}</p>
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
          ${aideDisponible ? "" : 'disabled aria-disabled="true" title="Aide désactivée pour cette série"'} aria-expanded="${etat.aideOuverte}"
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

function diagnosticErreurDroite() {
  const question = questionCourante(etat);
  if (
    !question
    || question.classement.notion !== NOTION_DROITE_GRADUEE
    || etat.validation?.juste !== false
    || etat.validation.omise
  ) return null;
  const bloc = blocDroiteGraduee(question);
  if (familleQuestion(question) === "placer-point") {
    const choisi = indiceChoisiDroite();
    const attendu = Number(question.reponse.attendus[0].slice(2));
    if (choisi !== null && Math.abs(choisi - attendu) === 1) {
      return { message: "Tu as choisi la graduation voisine. Vérifie ton point de départ avant de recompter les intervalles." };
    }
    return { message: "Retrouve le pas, puis repars de la valeur écrite la plus proche." };
  }
  if (question.reponse.type !== TYPE_REPONSE_NOMBRE_DECIMAL || etat.saisie === "") return null;
  const saisie = Number(etat.saisie.replace("−", "-").replace(",", "."));
  const attendu = question.reponse.attendu.numerateur / question.reponse.attendu.denominateur;
  const pas = bloc.pas.numerateur / bloc.pas.denominateur;
  if (attendu < 0 && Math.abs(saisie + attendu) < 1e-9) {
    return { message: "La distance est bonne, mais le point est à gauche de 0 : il faut conserver le signe moins." };
  }
  if (Math.abs(Math.abs(saisie - attendu) - pas) < 1e-9) {
    return { message: "Tu es décalé d’une graduation. Compte les intervalles à partir de la valeur connue, sans compter le trait de départ." };
  }
  if (familleQuestion(question) === "determiner-pas") {
    const ecartIndices = bloc.etiquettes[1] - bloc.etiquettes[0];
    const ecartValeurs = ecartIndices * pas;
    if (Math.abs(saisie - ecartValeurs) < 1e-9) {
      return { message: `Tu as trouvé l’écart total. Il faut encore le partager entre les ${ecartIndices} intervalles.` };
    }
  }
  return { message: "Ne suppose pas que le pas vaut 1 : compare les deux valeurs écrites et compte les intervalles qui les séparent." };
}

function diagnosticErreurReperagePlan() {
  const question = questionCourante(etat);
  if (
    !question
    || ![NOTION_LIRE_COORDONNEES_POINT, NOTION_PLACER_POINT_REPERE]
      .includes(question.classement.notion)
    || etat.validation?.juste !== false
    || etat.validation.omise
  ) return null;
  const bloc = blocRepereCartesien(question);
  if (!bloc) return null;
  const cible = question.classement.notion === NOTION_PLACER_POINT_REPERE
    ? decoderCoordonnee(question.reponse.attendus[0])
    : bloc.points?.find((point) => point.nom === bloc.nomPoint);
  if (!cible) return null;

  if (familleQuestion(question) === FAMILLE_DIAGNOSTIC_COORDONNEES) {
    return diagnostiquerChoixQcmRepere(etat.selection[0], [cible.x, cible.y]);
  }
  if (familleQuestion(question) === FAMILLE_LIRE_ABSCISSE_REPERE) {
    const recu = Number(etat.saisie.replace("−", "-"));
    return diagnostiquerCoordonneeSeule({ axe: "abscisse", attendu: cible.x, recu, pas: bloc.pas ?? 1 });
  }
  if (familleQuestion(question) === FAMILLE_LIRE_ORDONNEE) {
    const recu = Number(etat.saisie.replace("−", "-"));
    return diagnostiquerCoordonneeSeule({ axe: "ordonnee", attendu: cible.y, recu, pas: bloc.pas ?? 1 });
  }
  if (
    question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS
    || question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX
  ) {
    const recu = etat.saisies.map((saisie) =>
      Number(saisie.replace("−", "-").replace(",", ".")));
    return diagnostiquerCoupleRepere({ attendu: [cible.x, cible.y], recu, pas: bloc.pas ?? 1 });
  }
  const idChoisi = etat.selection[0];
  const choisi = familleQuestion(question) === FAMILLE_IDENTIFIER_POINT
    ? bloc.points?.find((point) => `point-${point.nom.toLowerCase()}` === idChoisi)
    : decoderCoordonnee(idChoisi);
  return choisi
    ? diagnostiquerCoupleRepere({ attendu: [cible.x, cible.y], recu: [choisi.x, choisi.y], pas: bloc.pas ?? 1 })
    : null;
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
    const question = questionCourante(etat);
    const precisionQcm = question?.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE
      ? " La réponse attendue est indiquée en vert."
      : "";
    return `<p class="message message-erreur" role="status"><span class="contenu-message"><strong>Pas de réponse.</strong>${precisionQcm}</span></p>`;
  }
  const diagnostic = diagnosticErreurFractions()
    ?? diagnosticErreurDroite()
    ?? diagnosticErreurReperagePlan();
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
      : `<strong>${echapper(formaterFractionEnDecimalSignee(bloc.numerateur, bloc.denominateur))}</strong>`;
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
    : [TYPE_REPONSE_DEUX_ENTIERS_RELATIFS, TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX]
      .includes(question.reponse.type)
      ? `(${etat.saisies.join(" ; ")})`
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
  if (question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS) {
    return [formaterCouple(...question.reponse.attendus)];
  }
  if (question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX) {
    return [formaterCouple(
      question.reponse.attendus[0].numerateur / question.reponse.attendus[0].denominateur,
      question.reponse.attendus[1].numerateur / question.reponse.attendus[1].denominateur,
    )];
  }
  if (question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL) {
    return [formaterFractionEnDecimalSignee(
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
    TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
    TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX,
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
  const profil = question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS
    ? "entier-relatif"
    : question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX
      ? "nombre-decimal"
    : question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL
      ? question.classement.notion === NOTION_DROITE_GRADUEE
      ? "nombre-decimal"
      : question.classement.notion === NOTION_LIRE_COORDONNEES_POINT
        ? (blocRepereCartesien(question)?.pas ?? 1) === 1
          ? "entier-relatif"
          : "nombre-decimal"
      : "decimal-positif"
    : "entier-naturel";
  const disposition = obtenirDispositionClavier(profil);
  const touches = disposition.touches.map((touche) => {
    const attributAction = touche.action === ACTION_TOUCHE_SAISIR
      ? `${[",", "−"].includes(touche.valeur) ? 'data-action="caractere"' : 'data-action="chiffre"'} data-value="${echapper(touche.valeur)}"`
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
  const guiderVersReponse = entrainement
    && etat.validation === null
    && question.classement.notion === NOTION_LIRE_COORDONNEES_POINT
    && estReponseNumerique(question);
  return `
    <div class="${classesMiseEnPage}">
      ${rendreEntete()}
      <div class="espace-lecteur">
        <div class="zone-question-scroll" data-question-index="${etat.seance.etat.indexQuestion}">${carteQuestion}</div>
        ${guiderVersReponse ? '<button class="indicateur-reponse-repere" type="button" data-action="voir-reponse-repere" hidden><span aria-hidden="true">↓</span> Répondre</button>' : ""}
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

const RANGS_DECIMAUX = Object.freeze([
  Object.freeze({ id: "dixiemes", libelle: "dixièmes", denominateur: 10 }),
  Object.freeze({ id: "centiemes", libelle: "centièmes", denominateur: 100 }),
  Object.freeze({ id: "milliemes", libelle: "millièmes", denominateur: 1000 }),
]);
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
  return rendreFigureDecimaleResponsive(
    (largeur) => dessinerTableauNumerationDecimale({
      ecritureDecimale: donnees.ecritureDecimale,
      largeur,
      rangFinal: donnees.dernierRang,
      rangMisEnEvidence: colonneMiseEnEvidence,
      afficherChiffres,
      afficherLecture,
      annoncerEcriture: afficherChiffres && annoncerEcriture,
    }),
    "figure-tableau-numeration figure-tableau-numeration-svg",
    { largeurMobile: 280 },
  );
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

const LARGEUR_FIGURE_DECIMALE = 560;
const LARGEUR_FIGURE_DECIMALE_MOBILE = 240;

/**
 * Rend deux géométries du même objet au lieu de réduire le SVG large.
 * Les SVG sont décoratifs : une seule description, portée par la figure, reste
 * exposée aux technologies d’assistance quel que soit le rendu affiché en CSS.
 */
function rendreFigureDeuxSourcesResponsive(
  creerDessin,
  classes = "",
  {
    largeur,
    largeurMobile,
    classeResponsive,
    legende = "",
  },
) {
  const dessinLarge = creerDessin(largeur);
  const dessinMobile = creerDessin(largeurMobile);
  const texteAlternatif = dessinLarge.texteAlternatif ?? "Figure mathématique";
  const rendreVariante = (dessin, classe) => `<div
      class="figure-deux-sources-variante ${classe}"
      style="--mg-largeur-figure-source:${dessin.largeur}px"
      aria-hidden="true">${dessin.svg}</div>`;
  return `<figure class="figure-fraction ${classes} figure-deux-sources-responsive ${classeResponsive}"
    role="img" aria-label="${echapper(texteAlternatif)}">
    ${rendreVariante(dessinLarge, "figure-deux-sources-variante-large")}
    ${rendreVariante(dessinMobile, "figure-deux-sources-variante-mobile")}
    ${legende ? `<figcaption>${echapper(legende)}</figcaption>` : ""}
  </figure>`;
}

function rendreFigureDecimaleResponsive(
  creerDessin,
  classes = "",
  {
    largeur = LARGEUR_FIGURE_DECIMALE,
    largeurMobile = LARGEUR_FIGURE_DECIMALE_MOBILE,
  } = {},
) {
  return rendreFigureDeuxSourcesResponsive(creerDessin, classes, {
    largeur,
    largeurMobile,
    classeResponsive: "figure-decimale-responsive",
  });
}

function rendreMaterielDecimalDepuisFraction(
  numerateur,
  denominateur,
  classes = "",
  largeur = 560,
) {
  const centiemes = numerateur * (100 / denominateur);
  return rendreFigureDecimaleResponsive(
    (largeurVariante) => dessinerMaterielNumerationDecimale({
      unites: Math.floor(centiemes / 100),
      dixiemes: Math.floor((centiemes % 100) / 10),
      centiemes: centiemes % 10,
      orientation: "horizontale",
      largeur: largeurVariante,
    }),
    `figure-materiel-decimal ${classes}`,
    { largeur, largeurMobile: Math.min(largeur, LARGEUR_FIGURE_DECIMALE_MOBILE) },
  );
}

function noeudDecimalDepuisEcriture(ecriture) {
  const correspondance = /^(\d+)(?:[,.](\d{1,3}))?$/.exec(String(ecriture));
  if (!correspondance) return null;
  const nombreDecimales = correspondance[2]?.length ?? 0;
  return nombreDecimalAvecRangs(
    Number(String(ecriture).replace(",", ".")),
    { decimales: nombreDecimales },
  );
}

function noeudDecimalDepuisFraction(numerateur, denominateur) {
  return noeudDecimalDepuisEcriture(
    formaterFractionEnDecimal(numerateur, denominateur),
  );
}

function rendreDecimalDepuisEcriture(ecriture) {
  const noeud = noeudDecimalDepuisEcriture(ecriture);
  return noeud ? versHtmlSemantique(noeud) : echapper(ecriture);
}

function rendreDecimalDepuisFraction(numerateur, denominateur) {
  return versHtmlSemantique(noeudDecimalDepuisFraction(numerateur, denominateur));
}

function rendreConversionRangsDepuisFraction(
  numerateur,
  denominateur,
  {
    etat,
    sens,
    profil = "solution",
    classes = "",
  },
) {
  const cible = RANGS_DECIMAUX.find((rang) => rang.denominateur === denominateur);
  if (!cible || denominateur === 1000) return "";
  return rendreFigureDecimaleResponsive(
    (largeur) => dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: formaterFractionEnDecimal(numerateur, denominateur),
      rangFinal: cible.id,
      etat,
      sens,
      profil,
      largeur,
    }),
    `figure-conversion-rangs ${classes}`,
  );
}

function rendreMethodeConversionRangs(
  numero,
  titre,
  contenu,
  classes = "",
  niveauTitre = 3,
) {
  const baliseTitre = niveauTitre === 4 ? "h4" : "h3";
  return `<section class="methode-conversion-rangs ${classes}">
    <${baliseTitre} class="titre-methode-conversion-rangs">
      <span>Méthode ${numero}</span>
      ${echapper(titre)}
    </${baliseTitre}>
    ${contenu}
  </section>`;
}

function rendreOutilCorrectionAdapte(titre, contenu, classes = "") {
  return `<section class="methode-conversion-rangs ${classes}">
    <h3 class="titre-methode-conversion-rangs">${echapper(titre)}</h3>
    ${contenu}
  </section>`;
}

function rendreOutilCours(numero, titre, contenu, classes = "") {
  return `<section class="outil-representation-cours ${classes}">
    <h4 class="titre-outil-representation-cours">
      <span>Outil ${numero}</span>
      ${echapper(titre)}
    </h4>
    ${contenu}
  </section>`;
}

function rendreBandesRailFractions(question, source, {
  solution = false,
  etape = "pieces",
  partiesPosees = undefined,
  classes = "",
  afficherReperesIntermediaires = false,
} = {}) {
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  const profil = solution
    ? "solution"
    : direct
      ? "aide-nc03"
      : question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
        ? "aide-nc04-libre"
        : "aide-nc04-imposee";
  return rendreFigureDeuxSourcesResponsive(
    (largeur) => dessinerBandesFractionnairesSurRailDecimal({
      numerateur: source.numerateur,
      denominateur: source.denominateur,
      profil,
      etape,
      ...(partiesPosees === undefined ? {} : { partiesPosees }),
      largeur,
      afficherReperesIntermediairesCours: afficherReperesIntermediaires,
    }),
    `figure-bandes-rail ${classes}`,
    {
      largeur: 720,
      largeurMobile: 340,
      classeResponsive: "figure-bandes-rail-aide-responsive",
    },
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
  if (question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE) {
    return `<p class="egalite-question-rationnelle">
      <strong class="decimal-question">${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong><span>=</span>
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
    <strong class="decimal-question">${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong><span>=</span>
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

function rendreLibelleChoixDecimal(choix) {
  return rendreDecimalDepuisEcriture(choix.libelle);
}

function rendreQuestionFractionsDecimaux() {
  const question = questionCourante(etat);
  const consigne = texteBloc(question, "consigne") || "Complète l'égalité.";
  const source = blocRationnelQuestion(question);
  const presentation = presentationQuestionFractions(question);
  const qcm = question.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE;
  const doubleDroite = presentation === "double-droite";
  const cibleQcm = question.classement.microNotion === MICRO_NOTION_DECIMAL_VERS_FRACTION
    ? `<strong class="decimal-question">${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong>`
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
            : rendreLibelleChoixDecimal)}
        </div>`
      : rendreZoneReponseFractions(question)}
    ${estEntrainement() ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
  </main>`;
  return rendreCoqueLecteur(question, carteQuestion);
}

function rendreCommandesProgressionFraction(source, {
  retour,
  suite,
  ajouterUnite = false,
} = {}) {
  const libelleRetour = retour ?? `Retirer un ${nomPartFraction(source.denominateur)}`;
  const libelleSuite = suite ?? `Ajouter un ${nomPartFraction(source.denominateur)}`;
  const peutAjouterUnite = ajouterUnite
    && etat.pasFractionAide + source.denominateur <= source.numerateur;
  return `<div class="commandes-progression-fraction">
    <button class="bouton-secondaire" type="button" data-action="pas-fraction-precedent"
      ${etat.pasFractionAide === 0 ? "disabled" : ""}>← ${echapper(libelleRetour)}</button>
    ${ajouterUnite ? `<button class="bouton-secondaire bouton-ajouter-unite-fraction" type="button"
      data-action="pas-fraction-unite" data-pas="${source.denominateur}"
      ${peutAjouterUnite ? "" : "disabled"}>Ajouter ${source.denominateur} quarts (1 unité)</button>` : ""}
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
      afficherReperesIntermediaires: true,
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
      ajouterUnite: !direct
        && source.denominateur === 4
        && source.numerateur > 8,
    })}
    ${terminee ? rendreSecondeLectureFractionFamiliere(question, source) : ""}
    <p class="conclusion-atelier ${terminee ? "visible" : ""}" aria-live="polite">${terminee
      ? "Tu es arrivé au point demandé. L’autre écriture reste à trouver : complète le « ? » dans ta réponse."
      : "Avance jusqu’au point demandé ; le dernier terme restera masqué."}</p>
  </section>`;
}

function rendreSecondeLectureFractionFamiliere(question, source) {
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  if (source.numerateur === 1 && source.denominateur === 2) {
    const figure = rendreFigureDecimaleResponsive(
      (largeur) => dessinerDemiAvecDixiemes({
        etape: "comparaison",
        afficherEcritures: direct,
        afficherEquation: false,
        largeur,
      }),
      "figure-correspondance-decimale figure-seconde-lecture-aide",
    );
    return `<section class="seconde-lecture-aide-fraction">
      <h3>Voir autrement avec les plaques</h3>
      <p>${direct
        ? "Cinq dixièmes occupent la même moitié que la bande d’un demi."
        : "La moitié coloriée et la bande atteignent exactement le même point."}</p>
      ${figure}
    </section>`;
  }
  if (
    source.denominateur === 4
    && source.numerateur < 4
    && [1, 3].includes(source.numerateur)
  ) {
    const centiemes = source.numerateur * 25;
    const figure = rendreFigureDecimaleResponsive(
      (largeur) => dessinerReorganisationCentiemes({
        centiemes,
        etape: "comparaison",
        afficherEcritures: direct,
        afficherEquation: false,
        largeur,
      }),
      "figure-correspondance-decimale figure-seconde-lecture-aide",
    );
    return `<section class="seconde-lecture-aide-fraction">
      <h3>Voir autrement avec la plaque de centièmes</h3>
      <p>${direct
        ? "Les mêmes cases jaunes se regroupent exactement en quarts de l’unité."
        : "Les cases jaunes et les quarts représentent exactement la même surface."}</p>
      ${figure}
    </section>`;
  }
  return "";
}

function rendreAideGroupementRiche(question, source) {
  const unites = Math.floor(source.numerateur / source.denominateur);
  const reste = source.numerateur % source.denominateur;
  const groupes = etat.groupesFractionAide;
  const fusionnerReste = source.denominateur === 4 && reste === 2;
  const maximum = fusionnerReste ? 3 : 2;
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
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
    : noeudDecimalDepuisFraction(source.numerateur, source.denominateur)];
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
      afficherReperesIntermediaires: true,
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
  const profil = direct ? "aide-nc03" : "aide-nc04";
  const etatDepart = direct ? "converti-rang-final" : "decompose";
  const etatArrivee = direct ? "decompose" : "converti-rang-final";
  const transformationMateriel = source.denominateur === 1000
    ? ""
    : `<div class="transformation-rangs-aide">
        <section>
          <strong>${direct ? `Au départ : la fraction en ${cible.libelle}` : "Décomposer le nombre donné dans ses rangs"}</strong>
          ${rendreConversionRangsDepuisFraction(source.numerateur, source.denominateur, {
            etat: etatDepart,
            sens: direct ? "fraction-vers-decimal" : "decimal-vers-fraction",
            profil,
            classes: "figure-conversion-rangs-aide",
          })}
        </section>
        ${juste ? `<span class="fleche-transformation-cours" aria-hidden="true">↓</span>
          <section>
            <strong>${direct ? "Échanger les pièces dans leurs rangs" : `Convertir les pièces en ${cible.libelle}`}</strong>
            ${rendreConversionRangsDepuisFraction(source.numerateur, source.denominateur, {
              etat: etatArrivee,
              sens: direct ? "fraction-vers-decimal" : "decimal-vers-fraction",
              profil,
              classes: "figure-conversion-rangs-aide",
            })}
          </section>` : ""}
      </div>`;
  const tableau = rendreTableauNumeration(source.numerateur, source.denominateur, {
    afficherChiffres: juste,
    colonneMiseEnEvidence: selection,
    afficherLecture: false,
    annoncerEcriture: !direct,
  });
  const methodes = source.denominateur === 1000
    ? tableau
    : `<div class="methodes-conversion-rangs methodes-conversion-rangs-aide">
        ${rendreMethodeConversionRangs(1, "Avec les plaques de couleurs", transformationMateriel, "methode-conversion-plaques")}
        ${rendreMethodeConversionRangs(2, "Avec le tableau de numération", tableau, "methode-conversion-tableau")}
      </div>`;
  const lecturesLocales = juste && direct && [10, 100].includes(source.denominateur)
    ? rendreLecturesLocalesFractionDecimale(source)
    : "";
  return `<section class="atelier-fraction atelier-tableau-decimal">
    <p class="consigne-atelier"><strong>Que nomme le dénominateur ${source.denominateur} ?</strong>
      Choisis le rang nommé par ce dénominateur : c’est jusqu’à ce rang qu’il faut lire le nombre.
      Le tableau reste visible et se remplit après ce choix.</p>
    <div class="choix-rang-fraction" role="radiogroup" aria-label="Choisir le rang décimal">
      ${RANGS_DECIMAUX.map((rang) => `<button type="button" class="${selection === rang.id ? "selectionne" : ""}"
        data-action="rang-fraction" data-rang="${rang.id}" role="radio"
        aria-checked="${selection === rang.id}">${rang.libelle}</button>`).join("")}
    </div>
    ${methodes}
    ${lecturesLocales}
    <p class="conclusion-atelier ${juste ? "visible" : ""}" aria-live="polite">${selection === null
      ? "Lis le dénominateur, puis choisis la colonne correspondante."
      : juste
        ? "Oui. Les chiffres sont placés : lis le tableau dans le sens demandé, puis complète le « ? »."
        : `Ce n’est pas le rang nommé par ${source.denominateur}. Essaie une autre colonne.`}</p>
  </section>`;
}

function rendreLecturesLocalesFractionDecimale(source) {
  const denominateur = source.denominateur;
  const unites = Math.floor(source.numerateur / denominateur);
  const reste = source.numerateur % denominateur;
  const dixiemes = denominateur === 100 ? Math.floor(reste / 10) : reste;
  const centiemes = denominateur === 100 ? reste % 10 : 0;
  const lignes = [];
  if (unites > 0) {
    lignes.push(`${rendreFractionEmpilee(unites * denominateur, denominateur)}<span>=</span><strong>${unites}</strong>`);
  }
  if (dixiemes > 0) {
    const numerateurDansRangFinal = denominateur === 100 ? dixiemes * 10 : dixiemes;
    const membres = [
      rendreFractionEmpilee(numerateurDansRangFinal, denominateur),
      ...(denominateur === 100 ? [rendreFractionEmpilee(dixiemes, 10)] : []),
      `<strong>${rendreDecimalDepuisEcriture(`0,${dixiemes}`)}</strong>`,
    ];
    lignes.push(rendreChaineHtml(membres));
  }
  if (centiemes > 0) {
    lignes.push(rendreChaineHtml([
      rendreFractionEmpilee(centiemes, 100),
      `<strong>${rendreDecimalDepuisEcriture(`0,0${centiemes}`)}</strong>`,
    ]));
  }
  if (lignes.length === 0) return "";
  return `<section class="lectures-locales-fraction-decimale">
    <h3>Lire chaque groupe dans son rang</h3>
    ${lignes.map((ligne) => `<p class="chaine-fraction">${ligne}</p>`).join("")}
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
  return rendreFigureDeuxSourcesResponsive(
    (largeur) => dessinerBandesFractionnairesSurRailDecimal({
      numerateur,
      denominateur,
      profil: "aide-nc04-libre",
      etape: denominateur === 4 && numerateur % 4 === 2 ? "reste" : "lecture",
      partiesPosees: numerateur,
      largeur,
    }),
    "figure-bandes-rail figure-correspondance-libre",
    {
      largeur: 720,
      largeurMobile: 340,
      classeResponsive: "figure-bandes-rail-aide-responsive",
      legende: `Les bandes atteignent exactement ${decimal}.`,
    },
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
    const materiel = `<div class="transformation-rangs-aide">
      <section>
        <strong>Décomposer le nombre donné dans ses rangs</strong>
        ${rendreConversionRangsDepuisFraction(numerateurDecimal, denominateurDecimal, {
          etat: "decompose",
          sens: "decimal-vers-fraction",
          profil: "aide-nc04",
          classes: "figure-conversion-rangs-aide",
        })}
      </section>
      <span class="fleche-transformation-cours" aria-hidden="true">↓</span>
      <section>
        <strong>Convertir ensuite les pièces dans le dernier rang</strong>
        ${rendreConversionRangsDepuisFraction(numerateurDecimal, denominateurDecimal, {
          etat: "converti-rang-final",
          sens: "decimal-vers-fraction",
          profil: "aide-nc04",
          classes: "figure-conversion-rangs-aide",
        })}
      </section>
    </div>`;
    const tableau = rendreTableauNumeration(numerateurDecimal, denominateurDecimal, {
        afficherChiffres: true,
        colonneMiseEnEvidence: RANGS_DECIMAUX.find(({ denominateur }) => denominateur === denominateurDecimal)?.id,
        afficherLecture: false,
        annoncerEcriture: false,
      });
    return `<div class="methodes-conversion-rangs methodes-conversion-rangs-aide">
      ${rendreMethodeConversionRangs(1, "Avec les plaques de couleurs", materiel, "methode-conversion-plaques")}
      ${rendreMethodeConversionRangs(2, "Avec le tableau de numération", tableau, "methode-conversion-tableau")}
    </div>`;
  }
  const unitesEntieres = entier > 0
    ? `<section class="unites-entieres-correspondance">
        <p><strong>Conserve d’abord ${entier} unité${entier > 1 ? "s" : ""} entière${entier > 1 ? "s" : ""}.</strong>
          Le matériel rouge ne change pas pendant qu’on transforme seulement la partie décimale.</p>
        ${rendreMaterielDecimalDepuisFraction(entier, 1, "figure-materiel-aide figure-unites-correspondance")}
      </section>`
    : "";
  if (demi) {
    const figure = rendreFigureDecimaleResponsive(
      (largeur) => dessinerDemiAvecDixiemes({
        etape: ["dixiemes", "demi", "comparaison"][etape],
        afficherEcritures: false,
        largeur,
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
  const figure = rendreFigureDecimaleResponsive(
    (largeur) => dessinerReorganisationCentiemes({
      centiemes,
      etape: ["lignes", "quadrants", "comparaison"][etape],
      afficherEcritures: false,
      largeur,
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
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  const fractionLibre = question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE;
  const qcm = question.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE;
  const equation = direct
    ? `${rendreFractionEmpilee(source.numerateur, source.denominateur)}<span>=</span><strong>?</strong>`
    : qcm || fractionLibre
      ? `<strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong><span>=</span>${rendreFractionEmpilee("?", "?")}`
      : `<strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong><span>=</span>${rendreFractionEmpilee("?", source.denominateur)}`;
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
    <p class="chaine-fraction"><strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong><span>=</span>${rendreFractionEmpilee("?", juste ? denominateurDecimal : "?")}</p>
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
      : `<strong>${rendreLibelleChoixDecimal(choix)}</strong>`;
    return emballer(contenu);
  }
  if (question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL) {
    return emballer(`<strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong>`);
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
    return `${fraction}<span>=</span><strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong>`;
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
      ? `<strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong><span>=</span>${fractionDecimale}`
      : `<strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong><span>=</span>${fractionDecimale}<span>=</span>${rendreFractionEmpilee(reduite.numerateur, reduite.denominateur)}`;
  }
  return `<strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong><span>=</span>${fraction}`;
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
  // Quand le reste est nul, la décomposition et l'écriture mixte ne font
  // que recopier les deux extrémités (8/4 = 8/4 = 2 = 2). Une fraction
  // qui cache un entier se lit directement : 8/4 = 2.
  const membres = reste === 0
    ? [source, decimal]
    : [source, decomposition, mixte, decimal];
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
    const tableau = rendreTableauNumeration(source.numerateur, source.denominateur, {
      afficherChiffres: true,
      colonneMiseEnEvidence: rang.id,
    });
    if (source.denominateur === 1000) return tableau;
    const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
    const etatDepart = direct ? "converti-rang-final" : "decompose";
    const etatArrivee = direct ? "decompose" : "converti-rang-final";
    const conclusion = `<p class="chaine-fraction">${chaineCorrectionFractions(question, source)}</p>`;
    const materiel = `<div class="transformation-rangs-correction">
      <section>
        <strong>${direct ? `Au départ : la fraction en ${rang.libelle}` : "Décomposer le nombre dans ses rangs"}</strong>
        ${rendreConversionRangsDepuisFraction(source.numerateur, source.denominateur, {
          etat: etatDepart,
          sens: direct ? "fraction-vers-decimal" : "decimal-vers-fraction",
          classes: "figure-conversion-rangs-correction",
        })}
      </section>
      <span class="fleche-transformation-cours" aria-hidden="true">↓</span>
      <section>
        <strong>${direct ? "Échanger ensuite les pièces dans leurs rangs" : `Convertir ensuite toutes les pièces en ${rang.libelle}`}</strong>
        ${rendreConversionRangsDepuisFraction(source.numerateur, source.denominateur, {
          etat: etatArrivee,
          sens: direct ? "fraction-vers-decimal" : "decimal-vers-fraction",
          classes: "figure-conversion-rangs-correction",
        })}
      </section>
    </div>${conclusion}`;
    const methodeTableau = `<p class="introduction-methode-rangs">${direct
      ? `Place le dernier chiffre du numérateur au rang des ${rang.libelle}.`
      : `Lis tous les chiffres jusqu’au rang des ${rang.libelle}.`}</p>
      ${tableau}${conclusion}`;
    return `<div class="methodes-conversion-rangs methodes-conversion-rangs-correction">
      ${rendreMethodeConversionRangs(1, "Avec les plaques de couleurs", materiel, "methode-conversion-plaques")}
      ${rendreMethodeConversionRangs(2, "Avec le tableau de numération", methodeTableau, "methode-conversion-tableau")}
    </div>`;
  }
  if ([2, 4].includes(source.denominateur)) {
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

function fractionFamiliereReduite(source) {
  const reduite = reduireFraction(source.numerateur, source.denominateur);
  return [2, 4].includes(reduite.denominateur) ? reduite : null;
}

function rendreChaineHtml(membres) {
  return membres.join("<span>=</span>");
}

function rendreCorrectionFractionFamiliere(question, source, {
  fractionLibre = false,
} = {}) {
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  const fractionSource = rendreFractionEmpilee(source.numerateur, source.denominateur);
  const decimalHtml = `<strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong>`;
  const estDeuxQuarts = source.numerateur === 2 && source.denominateur === 4;
  const utiliserPlaques = source.denominateur === 4
    && [1, 3].includes(source.numerateur);

  const visuelBandes = estDeuxQuarts
    ? `<div class="transformation-bandes-correction">
        <section><strong>Deux quarts séparés</strong>${rendreBandesRailFractions(question, source, {
          solution: true,
          etape: "pieces",
          partiesPosees: source.numerateur,
          classes: "figure-correction-fraction",
        })}</section>
        <span class="fleche-transformation-cours" aria-hidden="true">↓</span>
        <section><strong>Les deux quarts forment un demi</strong>${rendreBandesRailFractions(question, source, {
          solution: true,
          etape: "reste",
          partiesPosees: source.numerateur,
          classes: "figure-correction-fraction",
        })}</section>
      </div>`
    : rendreBandesRailFractions(question, source, {
        solution: true,
        etape: source.denominateur === 4 && source.numerateur % 4 === 2
          ? "reste"
          : "lecture",
        partiesPosees: source.numerateur,
        classes: "figure-correction-fraction",
      });

  let chaineBandes;
  if (source.numerateur > source.denominateur) {
    chaineBandes = rendreDecompositionFractionSuperieure(
      source.numerateur,
      source.denominateur,
      { sens: fractionLibre ? MICRO_NOTION_DECIMAL_VERS_FRACTION : question.classement.microNotion },
    );
  } else {
    const membres = estDeuxQuarts
      ? [fractionSource, rendreFractionEmpilee(1, 2), decimalHtml]
      : [fractionSource, decimalHtml];
    if (!direct || fractionLibre) membres.reverse();
    chaineBandes = rendreChaineHtml(membres);
  }

  const methodeBandes = `${visuelBandes}
    <div class="calcul-aligne decomposition-fraction-superieure">${chaineBandes}</div>`;

  let methodePlaques = "";
  if (utiliserPlaques) {
    const centiemes = source.numerateur * 25;
    const visuelPlaques = rendreFigureDecimaleResponsive(
      (largeur) => dessinerReorganisationCentiemes({
        centiemes,
        etape: "comparaison",
        largeur,
        afficherEcritures: true,
        afficherEquation: false,
      }),
      "figure-correspondance-decimale figure-correction-fraction",
    );
    const membresPlaques = [
      fractionSource,
      rendreFractionEmpilee(centiemes, 100),
      decimalHtml,
    ];
    if (!direct || fractionLibre) membresPlaques.reverse();
    methodePlaques = rendreMethodeConversionRangs(
      2,
      "Avec les plaques de couleurs",
      `${visuelPlaques}<p class="chaine-fraction">${rendreChaineHtml(membresPlaques)}</p>`,
      "methode-conversion-plaques",
    );
  }

  const rappelFractionDecimale = fractionLibre && !utiliserPlaques
    ? `<p class="precision">La fraction décimale issue du dernier rang reste aussi une réponse correcte :</p>
      <p class="chaine-fraction">${chaineCorrectionFractions(question, source)}</p>`
    : "";

  return `<section class="correction-methodes-rangs correction-outils-familiers">
    <p class="introduction-methode-rangs"><strong>${utiliserPlaques
      ? "Deux représentations sont utiles ici."
      : "Les bandes donnent ici la lecture la plus directe."}</strong>
      ${utiliserPlaques
        ? "Le rail situe le nombre ; les plaques montrent comment les centièmes se réorganisent en quarts."
        : "Elles conservent la taille d’un demi ou d’un quart et rendent les unités visibles."}</p>
    <div class="methodes-conversion-rangs methodes-conversion-rangs-correction">
      ${utiliserPlaques
        ? rendreMethodeConversionRangs(
            1,
            "Avec les bandes de fractions",
            methodeBandes,
            "methode-conversion-bandes",
          )
        : rendreOutilCorrectionAdapte(
            "Avec les bandes de fractions",
            methodeBandes,
            "methode-conversion-bandes",
          )}
      ${methodePlaques}
    </div>
    ${rappelFractionDecimale}
  </section>`;
}

function rendreExplicationCorrectionFractions(question, source) {
  const direct = question.classement.microNotion === MICRO_NOTION_FRACTION_VERS_DECIMAL;
  const decimal = formaterFractionEnDecimal(source.numerateur, source.denominateur);
  const chaine = chaineCorrectionFractions(question, source);
  if (question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE) {
    const familiere = fractionFamiliereReduite(source);
    if (familiere) {
      return rendreCorrectionFractionFamiliere(question, familiere, {
        fractionLibre: true,
      });
    }
    const nombreDecimales = Math.max(0, decimal.split(",")[1]?.length ?? 0);
    const denominateurDecimal = 10 ** nombreDecimales;
    const numerateurDecimal = Number(decimal.replace(",", ""));
    const rangDecimal = RANGS_DECIMAUX.find(
      (element) => element.denominateur === denominateurDecimal,
    );
    const nomRang = rangDecimal?.libelle ?? "unités";
    const sourceFractionDecimale = {
      numerateur: numerateurDecimal,
      denominateur: denominateurDecimal,
    };
    return `<section class="correction-methodes-rangs correction-fraction-libre-rangs">
      <p class="introduction-methode-rangs"><strong>Deux méthodes sont possibles.</strong>
        <strong>${rendreDecimalDepuisFraction(source.numerateur, source.denominateur)}</strong>
        s’arrête au rang des ${nomRang} : les plaques ou le tableau permettent de lire une fraction décimale de dénominateur ${denominateurDecimal}.</p>
      ${rendreVisuelCorrectionFractions(question, sourceFractionDecimale)}
      <p class="precision">Cette fraction décimale est une réponse possible ; toute fraction équivalente est aussi juste.</p>
    </section>`;
  }
  const rang = RANGS_DECIMAUX.find(
    (element) => element.denominateur === source.denominateur,
  );
  if (rang) {
    if (source.denominateur !== 1000) {
      return `<section class="correction-methodes-rangs">
        <p class="introduction-methode-rangs"><strong>Deux méthodes sont possibles.</strong>
          Choisis celle qui t’aide le mieux : elles conduisent au même nombre.</p>
        ${rendreVisuelCorrectionFractions(question, source)}
      </section>`;
    }
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
    return rendreCorrectionFractionFamiliere(question, source);
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
  {
    varianteMobile = true,
    largeurMobile = 340,
    formatMobile = "standard",
    mobileViewportSeulement = false,
    afficherReperesIntermediairesCours = false,
  } = {},
) {
  const rendreVariante = (
    largeurVariante,
    classeVariante = "",
    format = "standard",
  ) => rendreFigureFraction(
    dessinerBandesFractionnairesSurRailDecimal({
      numerateur,
      denominateur,
      profil: reveler ? "solution" : "aide-nc03",
      etape,
      partiesPosees: numerateur,
      largeur: largeurVariante,
      format,
      afficherReperesIntermediairesCours,
    }),
    `figure-bandes-rail figure-bandes-rail-cours ${classeVariante}`,
  );
  if (!varianteMobile || largeur <= largeurMobile) return rendreVariante(largeur);
  return `<div class="bandes-rail-cours-responsive${mobileViewportSeulement ? " bandes-rail-cours-responsive-mobile-strict" : ""}">
    ${rendreVariante(largeur, "figure-bandes-rail-cours-large")}
    ${rendreVariante(largeurMobile, "figure-bandes-rail-cours-mobile", formatMobile)}
  </div>`;
}

function rendreRepereCinqUnitesCours() {
  return `<section class="repere-cinq-unites-cours">
    <p><strong>Cinq pièces d’une unité</strong> atteignent la graduation 5.</p>
    ${rendreBandesRailCours(5, 1, "pieces", true, 720, { largeurMobile: 340, mobileViewportSeulement: true })}
    <p class="lecture-rang-cours">Avec un dénominateur 1, chaque pièce vaut déjà une unité.</p>
  </section>`;
}

function rendreEchangesRangsCours() {
  return `<div class="echanges-rangs-cours">
    <section>
      <h4>Une unité = dix dixièmes</h4>
      ${rendreFigureDecimaleResponsive(
        (largeur) => dessinerEchangeRangsNumerationDecimale({ echange: "unite-dixiemes", largeur }),
        "figure-echange-rangs-cours",
      )}
    </section>
    <section>
      <h4>Un dixième = dix centièmes</h4>
      ${rendreFigureDecimaleResponsive(
        (largeur) => dessinerEchangeRangsNumerationDecimale({ echange: "dixieme-centiemes", largeur }),
        "figure-echange-rangs-cours",
      )}
    </section>
    <section>
      <h4>Une unité = cent centièmes</h4>
      ${rendreFigureDecimaleResponsive(
        (largeur) => dessinerEchangeRangsNumerationDecimale({ echange: "unite-centiemes", largeur }),
        "figure-echange-rangs-cours",
      )}
    </section>
  </div>`;
}

function rendreConversionRangsCours({
  ecritureDecimale,
  etat,
  sens,
}) {
  return rendreFigureDecimaleResponsive(
    (largeur) => dessinerConversionRangsNumerationDecimale({
      ecritureDecimale,
      etat,
      sens,
      largeur,
    }),
    "figure-conversion-rangs-cours",
  );
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

function nombreCours(valeur, role = undefined, decimales = undefined) {
  return nombre(valeur, {
    ...(role ? { role } : {}),
    ...(decimales === undefined ? {} : { decimales }),
  });
}

function decimalCours(valeur, decimales) {
  return nombreDecimalAvecRangs(valeur, { decimales });
}

function egalitesCours(...membres) {
  return `<div class="calcul-aligne calcul-aligne-fractions">${versHtmlEgalitesAlignees(egalite(...membres))}</div>`;
}

function egalitesCoursPrincipales(...membres) {
  return `<div class="calcul-aligne calcul-aligne-fractions calcul-aligne-fractions-principales">${versHtmlEgalitesAlignees(egalite(...membres))}</div>`;
}

function rendreReperesRangsCours() {
  return `<div class="reperes-rangs-cours">
    ${egalitesCoursPrincipales(
      fractionCours(1, 10, ROLES_RANGS_COURS.dixiemes),
      decimalCours(0.1, 1),
    )}
    ${egalitesCoursPrincipales(
      fractionCours(1, 100, ROLES_RANGS_COURS.centiemes),
      decimalCours(0.01, 2),
    )}
    ${egalitesCoursPrincipales(
      fractionCours(1, 1000, ROLES_RANGS_COURS.milliemes),
      decimalCours(0.001, 3),
    )}
  </div>`;
}

function rendreDecomposition147Cours({ sensInverse = false } = {}) {
  const membres = [
    fractionCours(147, 100, ROLES_RANGS_COURS.centiemes),
    somme(
      fractionCours(100, 100, ROLES_RANGS_COURS.centiemes),
      fractionCours(40, 100, ROLES_RANGS_COURS.centiemes),
      fractionCours(7, 100, ROLES_RANGS_COURS.centiemes),
    ),
    somme(
      nombreCours(1, ROLES_RANGS_COURS.unites),
      fractionCours(4, 10, ROLES_RANGS_COURS.dixiemes),
      fractionCours(7, 100, ROLES_RANGS_COURS.centiemes),
    ),
    decimalCours(1.47, 2),
  ];
  if (sensInverse) membres.reverse();
  return egalitesCoursPrincipales(...membres);
}

function rendreLecture725Cours() {
  return egalitesCoursPrincipales(
    fractionCours(725, 1000, ROLES_RANGS_COURS.milliemes),
    decimalCours(0.725, 3),
  );
}

function rendreDecomposition354Cours() {
  return egalitesCoursPrincipales(
    decimalCours(3.54, 2),
    somme(
      nombreCours(3, ROLES_RANGS_COURS.unites),
      fractionCours(5, 10, ROLES_RANGS_COURS.dixiemes),
      fractionCours(4, 100, ROLES_RANGS_COURS.centiemes),
    ),
    somme(
      fractionCours(300, 100, ROLES_RANGS_COURS.centiemes),
      fractionCours(50, 100, ROLES_RANGS_COURS.centiemes),
      fractionCours(4, 100, ROLES_RANGS_COURS.centiemes),
    ),
    fractionCours(354, 100, ROLES_RANGS_COURS.centiemes),
  );
}

function rendreCarteCoursFractions(index, numeroCours = index + 1) {
  if (index === 0) {
    return `<article class="carte-cours-fractions carte-cours-correspondance carte-cours-demi">
      <span class="numero-cours">${numeroCours}</span><h3>Un demi : plusieurs écritures</h3>
      <p class="introduction-cours">Trois outils se complètent. Chacun permet de voir autre chose.</p>
      <div class="outils-representation-cours">
        ${rendreOutilCours(1, "Bandes de fractions sur la demi-droite graduée", `
          <p class="introduction-cours">Deux bandes représentant chacune ${versHtmlSemantique(fractionCours(1, 2))}, placées bout à bout, forment exactement une unité.</p>
          ${rendreBandesRailCours(2, 2, "pieces")}
          <p class="lecture-rang-cours">La première bande atteint 0,5.</p>
          ${egalitesCoursPrincipales(
            fractionCours(1, 2),
            decimalCours(0.5, 1),
          )}
        `, "outil-bandes-cours")}
        ${rendreOutilCours(2, "Plaques de couleurs", `
          <p class="introduction-cours">Dix dixièmes forment une unité. Cinq dixièmes en remplissent exactement la moitié.</p>
          ${rendreFigureDecimaleResponsive(
            (largeur) => dessinerDemiAvecDixiemes({
              etape: "dixiemes",
              largeur,
              afficherEcritures: true,
              afficherEquation: false,
            }),
            "figure-correspondance-decimale figure-cours-demi",
          )}
          ${egalitesCoursPrincipales(
            decimalCours(0.5, 1),
            fractionCours(5, 10, ROLES_RANGS_COURS.dixiemes),
            fractionCours(1, 2),
          )}
        `, "outil-plaques-cours")}
        ${rendreOutilCours(3, "Tableau de numération", `
          <p class="introduction-cours">Le chiffre 5 est au rang des dixièmes : on lit 0,5.</p>
          ${rendreTableauNumeration(5, 10, { afficherChiffres: true, afficherLecture: false, colonneMiseEnEvidence: "dixiemes" })}
        `, "outil-tableau-cours")}
      </div>
    </article>`;
  }
  if (index === 1) {
    return `<article class="carte-cours-fractions carte-cours-cpa carte-cours-quarts">
      <span class="numero-cours">${numeroCours}</span><h3>Un quart et trois quarts</h3>
      <p class="introduction-cours">Les mêmes trois outils se complètent pour comprendre les quarts.</p>
      <div class="outils-representation-cours">
        ${rendreOutilCours(1, "Bandes de fractions sur la demi-droite graduée", `
          <p class="introduction-cours">Quatre bandes représentant chacune ${versHtmlSemantique(fractionCours(1, 4))}, placées bout à bout, forment exactement une unité.</p>
          ${rendreBandesRailCours(4, 4, "pieces")}
          <p class="lecture-rang-cours">La demi-droite permet de lire les quarts successifs.</p>
          <div class="reperes-quarts-rail-cours">
            ${egalitesCours(fractionCours(1, 4), decimalCours(0.25, 2))}
            ${egalitesCours(
              fractionCours(2, 4),
              fractionCours(1, 2),
              decimalCours(0.5, 1),
            )}
            ${egalitesCours(fractionCours(3, 4), decimalCours(0.75, 2))}
          </div>
        `, "outil-bandes-cours")}
        ${rendreOutilCours(2, "Plaques de couleurs", `
          <p class="introduction-cours">Sans rien ajouter ni retirer, 25 centièmes se réorganisent en un quart de l’unité.</p>
          ${rendreFigureDecimaleResponsive(
            (largeur) => dessinerReorganisationCentiemes({ centiemes: 25, etape: "comparaison", largeur, afficherEcritures: true, afficherEquation: false }),
            "figure-correspondance-decimale figure-cours-quarts",
          )}
          ${egalitesCoursPrincipales(
            decimalCours(0.25, 2),
            fractionCours(25, 100, ROLES_RANGS_COURS.centiemes),
            fractionCours(1, 4),
          )}
          <p class="introduction-cours">75 centièmes se réorganisent de la même façon en trois quarts de l’unité.</p>
          ${rendreFigureDecimaleResponsive(
            (largeur) => dessinerReorganisationCentiemes({ centiemes: 75, etape: "comparaison", largeur, afficherEcritures: true, afficherEquation: false }),
            "figure-correspondance-decimale figure-cours-trois-quarts",
          )}
          ${egalitesCoursPrincipales(
            decimalCours(0.75, 2),
            fractionCours(75, 100, ROLES_RANGS_COURS.centiemes),
            fractionCours(3, 4),
          )}
        `, "outil-plaques-cours")}
        ${rendreOutilCours(3, "Tableau de numération", `
          <div class="tableaux-quarts-cours">
            <section>
              <strong>25 centièmes : 0,25</strong>
              ${rendreTableauNumeration(25, 100, { afficherChiffres: true, afficherLecture: false, colonneMiseEnEvidence: "centiemes" })}
            </section>
            <section>
              <strong>75 centièmes : 0,75</strong>
              ${rendreTableauNumeration(75, 100, { afficherChiffres: true, afficherLecture: false, colonneMiseEnEvidence: "centiemes" })}
            </section>
          </div>
        `, "outil-tableau-cours")}
      </div>
    </article>`;
  }
  if (index === 2) {
    return `<article class="carte-cours-fractions carte-cours-rangs">
      <span class="numero-cours">${numeroCours}</span><h3>Nommer les rangs décimaux</h3>
      <p class="introduction-cours">On ne change pas la quantité : on échange seulement les pièces.</p>
      ${rendreEchangesRangsCours()}
      <h4 class="titre-reperes-visuels">Les écritures des trois rangs</h4>
      ${rendreReperesRangsCours()}
      <h4 class="titre-reperes-visuels">Dans le tableau de numération</h4>
      <p class="introduction-cours">Le millième se place dans la colonne qui suit les centièmes.</p>
      ${rendreTableauNumeration(1, 1000, { afficherChiffres: true, afficherLecture: false, colonneMiseEnEvidence: "milliemes" })}
    </article>`;
  }
  if (index === 3) {
    return `<article class="carte-cours-fractions carte-cours-conversion-directe">
      <span class="numero-cours">${numeroCours}</span><h3>Lire une fraction décimale</h3>
      <p class="introduction-cours"><strong>But :</strong> trouver l’écriture décimale de ${versHtmlSemantique(fractionCours(147, 100, ROLES_RANGS_COURS.centiemes))}.</p>
      <div class="methodes-conversion-rangs methodes-conversion-rangs-cours">
        ${rendreMethodeConversionRangs(1, "Avec les plaques de couleurs", `
          <p class="introduction-cours">${versHtmlSemantique(fractionCours(147, 100, ROLES_RANGS_COURS.centiemes))} se lit « 147 centièmes ». Échangeons les pièces sans changer la quantité.</p>
          <div class="transformation-rangs-cours">
            <section>
              <strong>Au départ : 147 centièmes</strong>
              ${rendreConversionRangsCours({ ecritureDecimale: "1,47", etat: "converti-rang-final", sens: "fraction-vers-decimal" })}
            </section>
            <span class="fleche-transformation-cours" aria-hidden="true">↓</span>
            <section>
              <strong>Après les échanges : 1 unité, 4 dixièmes et 7 centièmes</strong>
              ${rendreConversionRangsCours({ ecritureDecimale: "1,47", etat: "decompose", sens: "fraction-vers-decimal" })}
            </section>
          </div>
          ${rendreDecomposition147Cours()}
        `, "methode-conversion-plaques", 4)}
        ${rendreMethodeConversionRangs(2, "Avec le tableau de numération", `
          <p class="introduction-cours">Le dénominateur 100 nomme les centièmes : le dernier chiffre de 147 se place dans la colonne des centièmes.</p>
          ${rendreTableauNumeration(147, 100, { afficherChiffres: true, afficherLecture: false, colonneMiseEnEvidence: "centiemes" })}
          ${egalitesCoursPrincipales(
            fractionCours(147, 100, ROLES_RANGS_COURS.centiemes),
            decimalCours(1.47, 2),
          )}
        `, "methode-conversion-tableau", 4)}
      </div>
      <div class="definitions-petits-rangs-cours">
        <p>7 centièmes s’écrit ${versHtmlSemantique(egalite(fractionCours(7, 100, ROLES_RANGS_COURS.centiemes), decimalCours(0.07, 2)))}.</p>
        <p>7 millièmes s’écrit ${versHtmlSemantique(egalite(fractionCours(7, 1000, ROLES_RANGS_COURS.milliemes), decimalCours(0.007, 3)))}.</p>
      </div>
      <section class="encadre-milliemes-cours">
        <h4>Jusqu’aux millièmes</h4>
        <p>${versHtmlSemantique(fractionCours(725, 1000, ROLES_RANGS_COURS.milliemes))} se lit « 725 millièmes » et s’écrit 0,725.</p>
        ${rendreTableauNumeration(725, 1000, { afficherChiffres: true, afficherLecture: false, colonneMiseEnEvidence: "milliemes" })}
        ${rendreLecture725Cours()}
      </section>
    </article>`;
  }
  if (index === 4) {
    return `<article class="carte-cours-fractions carte-cours-conversion-inverse">
      <span class="numero-cours">${numeroCours}</span><h3>Écrire un décimal sous forme de fraction</h3>
      <p class="introduction-cours"><strong>But :</strong> chercher une fraction décimale égale à 3,54.</p>
      <div class="methodes-conversion-rangs methodes-conversion-rangs-cours">
        ${rendreMethodeConversionRangs(1, "Avec les plaques de couleurs", `
          <p class="introduction-cours">3,54 représente 3 unités rouges, 5 dixièmes verts et 4 centièmes jaunes.</p>
          <div class="transformation-rangs-cours">
            <section>
              <strong>Décomposer 3,54 par rang</strong>
              ${rendreConversionRangsCours({ ecritureDecimale: "3,54", etat: "decompose", sens: "decimal-vers-fraction" })}
            </section>
            <span class="fleche-transformation-cours" aria-hidden="true">↓</span>
            <section>
              <strong>Convertir ensuite toutes les pièces en centièmes</strong>
              ${rendreConversionRangsCours({ ecritureDecimale: "3,54", etat: "converti-rang-final", sens: "decimal-vers-fraction" })}
            </section>
          </div>
          ${rendreDecomposition354Cours()}
        `, "methode-conversion-plaques", 4)}
        ${rendreMethodeConversionRangs(2, "Avec le tableau de numération", `
          <p class="introduction-cours">Dans le tableau, 3,54 se lit « 354 centièmes ».</p>
          ${rendreTableauNumeration(354, 100, { afficherChiffres: true, afficherLecture: false, colonneMiseEnEvidence: "centiemes" })}
          ${egalitesCoursPrincipales(
            decimalCours(3.54, 2),
            fractionCours(354, 100, ROLES_RANGS_COURS.centiemes),
          )}
        `, "methode-conversion-tableau", 4)}
      </div>
    </article>`;
  }
  if (index === "denominateur-impose") {
    return `<article class="carte-cours-fractions carte-cours-unites carte-cours-strategie">
      <span class="numero-cours">${numeroCours}</span><h3>Quand le dénominateur est donné</h3>
      <p class="definition-cours">Le dénominateur donne la taille des bandes. On les compte jusqu’au nombre décimal demandé.</p>
      <section class="exemple-cours-superieur">
        <h4>Écrire 3,5 en demis</h4>
        <p>Chaque bande vaut ${versHtmlSemantique(fractionCours(1, 2))}. Il faut 7 bandes pour atteindre 3,5.</p>
        ${rendreBandesRailCours(7, 2, "pieces", true, 720, { largeurMobile: 340, mobileViewportSeulement: true, afficherReperesIntermediairesCours: true })}
        ${egalitesCoursPrincipales(decimalCours(3.5, 1), fractionCours(7, 2))}
      </section>
      <section class="exemple-cours-superieur">
        <h4>Écrire 1,75 en quarts</h4>
        <p>Chaque bande vaut ${versHtmlSemantique(fractionCours(1, 4))}. Il faut 7 bandes pour atteindre 1,75.</p>
        ${rendreBandesRailCours(7, 4, "pieces", true, 720, { largeurMobile: 340, mobileViewportSeulement: true, afficherReperesIntermediairesCours: true })}
        ${egalitesCoursPrincipales(decimalCours(1.75, 2), fractionCours(7, 4))}
      </section>
      <section class="encadre-milliemes-cours">
        <h4>Quand les deux cases sont libres</h4>
        <p>On peut utiliser le dernier rang : ${versHtmlSemantique(egalite(decimalCours(0.8, 1), fractionCours(8, 10, ROLES_RANGS_COURS.dixiemes)))}. Une fraction équivalente convient aussi, par exemple ${versHtmlSemantique(fractionCours(80, 100, ROLES_RANGS_COURS.centiemes))}.</p>
      </section>
    </article>`;
  }
  return `<article class="carte-cours-fractions carte-cours-unites carte-cours-strategie">
    <span class="numero-cours">${numeroCours}</span><h3>Former les unités et reconnaître les entiers</h3>
    <p class="definition-cours">Le dénominateur donne la taille d’une pièce ; le numérateur indique combien de pièces on prend.</p>
    <section class="exemple-cours-superieur">
      <h4>Sept demis</h4>
      <p>${versHtmlSemantique(fractionCours(7, 2))} signifie sept bandes de longueur ${versHtmlSemantique(fractionCours(1, 2))}. Six demis forment 3 unités ; il reste 1 demi.</p>
      <div class="transformation-bandes-cours">
        <section><strong>Au départ : 7 demis</strong>${rendreBandesRailCours(7, 2, "pieces", false, 720, { largeurMobile: 340, mobileViewportSeulement: true, afficherReperesIntermediairesCours: true })}</section>
        <span class="fleche-transformation-cours" aria-hidden="true">↓</span>
        <section><strong>Après regroupement</strong>${rendreBandesRailCours(7, 2, "unites", true, 720, { largeurMobile: 340, mobileViewportSeulement: true })}</section>
      </div>
      ${rendreDecompositionFractionSuperieure(7, 2)}
    </section>
    <section class="exemple-cours-superieur">
      <h4>Six quarts</h4>
      <p>${versHtmlSemantique(fractionCours(6, 4))} signifie six bandes de longueur ${versHtmlSemantique(fractionCours(1, 4))}. Quatre quarts forment 1 unité. Les deux quarts restants se regroupent en un demi : ${versHtmlSemantique(egalite(fractionCours(2, 4), fractionCours(1, 2)))}.</p>
      <div class="transformation-bandes-cours">
        <section><strong>Au départ : 6 quarts</strong>${rendreBandesRailCours(6, 4, "pieces", false, 720, { largeurMobile: 340, mobileViewportSeulement: true, afficherReperesIntermediairesCours: true })}</section>
        <span class="fleche-transformation-cours" aria-hidden="true">↓</span>
        <section><strong>Après regroupement</strong>${rendreBandesRailCours(6, 4, "reste", true, 720, { largeurMobile: 340, mobileViewportSeulement: true })}</section>
      </div>
      ${rendreDecompositionFractionSuperieure(6, 4)}
    </section>
    <h4 class="titre-reperes-visuels">Repères des demis et des quarts</h4>
    <p class="introduction-cours">Les bandes permettent de relire plusieurs repères sans refaire tous les regroupements.</p>
    <div class="reperes-bandes-synthese-cours">
      <section>
        <strong>De demi en demi</strong>
        ${rendreBandesRailCours(5, 2, "pieces", true, 560, { largeurMobile: 340, afficherReperesIntermediairesCours: true })}
      </section>
      <section>
        <strong>De quart en quart</strong>
        ${rendreBandesRailCours(8, 4, "pieces", true, 560, { largeurMobile: 340, afficherReperesIntermediairesCours: true })}
      </section>
    </div>
    <h4 class="titre-reperes-visuels">Quand le dénominateur vaut 1</h4>
    ${rendreRepereCinqUnitesCours()}
    <p class="lecture-rang-cours">Ainsi, ${versHtmlSemantique(egalite(fractionCours(5, 1), nombreCours(5)))} et, plus généralement, ${versHtmlSemantique(egalite(quotient(variable("n"), nombre(1)), variable("n")))}. Les écritures ${versHtmlSemantique(egalite(fractionCours(4, 4), nombreCours(1)))} et ${versHtmlSemantique(egalite(fractionCours(100, 100), nombreCours(1)))} cachent aussi un entier.</p>
  </article>`;
}

function rendreCoursFractionsDecimaux() {
  if (!etat.coursOuvert) return "";
  const total = nombrePagesCours();
  const legacy = definitionNotion().id === NOTION_FRACTIONS_SIMPLES_DECIMAUX;
  const nc04 = definitionNotion().id === NOTION_DECIMAL_VERS_FRACTION;
  const pages = legacy
    ? [0, 1, 2, 3, 4, 5]
    : nc04
    ? [0, 1, 2, 4, "denominateur-impose"]
    : [0, 1, 2, 3, 5];
  const titres = legacy
    ? [
      "Un demi : plusieurs écritures",
      "Un quart et trois quarts",
      "Nommer les rangs décimaux",
      "Lire une fraction décimale",
      "Écrire un décimal en fraction",
      "Former les unités",
    ]
    : nc04
    ? [
      "Un demi : plusieurs écritures",
      "Un quart et trois quarts",
      "Nommer les rangs décimaux",
      "Écrire un décimal en fraction",
      "Quand le dénominateur est donné",
    ]
    : [
      "Un demi : plusieurs écritures",
      "Un quart et trois quarts",
      "Nommer les rangs décimaux",
      "Lire une fraction décimale",
      "Former les unités",
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
    contenu: `<div class="cours-une-carte">${rendreCarteCoursFractions(pages[pageCoursCourante], pageCoursCourante + 1)}</div>`,
    pied,
    classes: "panneau-cours-fractions panneau-fractions",
  });
}

function varianteQuestionEcrituresMultiples(question) {
  return question.classement.complements
    .find((complement) => complement.startsWith("variante-"))
    ?.slice("variante-".length) ?? "";
}

function presentationQuestionEcrituresMultiples(question) {
  return question.classement.complements
    .find((complement) => complement.startsWith("presentation-"))
    ?.slice("presentation-".length) ?? "abstraite";
}

function pourcentageQuestionEcrituresMultiples(question) {
  const pourcentage = lirePourcentageQuestion(question);
  if (!Number.isSafeInteger(pourcentage) || pourcentage < 1 || pourcentage > 250) {
    throw new Error("question NC-05 sans pourcentage entier entre 1 et 250");
  }
  return pourcentage;
}

function rendrePourcentage(valeur, classe = "") {
  return `<span class="ecriture-pourcentage ${classe}" role="math" aria-label="${echapper(valeur)} pour cent"><strong>${echapper(valeur)}</strong><span aria-hidden="true">%</span></span>`;
}

function valeurReponseAfficheeEcritures(question) {
  if (estEntrainement()) return etat.saisie || "…";
  if (!etat.reponseRevelee && !etat.correctionOuverte) return "?";
  return question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL
    ? formaterFractionEnDecimal(
      question.reponse.attendu.numerateur,
      question.reponse.attendu.denominateur,
    )
    : String(question.reponse.attendu);
}

function rendreCaseEcritures(question, { suffixe = "", ariaLabel = "Case à compléter" } = {}) {
  const valeur = valeurReponseAfficheeEcritures(question);
  const valeurAccessible = valeur === "…"
    ? "vide"
    : valeur === "?"
      ? "non révélée"
      : `${valeur}${suffixe === "%" ? " pour cent" : suffixe ? ` ${suffixe}` : ""}`;
  return `<span class="cible-ecriture-nc05">
    <output class="${classesCaseRationnelle()} case-ecriture-nc05" aria-live="polite" aria-atomic="true" aria-label="${echapper(`${ariaLabel} : ${valeurAccessible}`)}">${echapper(valeur)}</output>
    ${suffixe ? `<span class="suffixe-cible-nc05" aria-hidden="true">${echapper(suffixe)}</span>` : ""}
  </span>`;
}

function rendreFractionCibleEcritures(question, denominateur) {
  return rendreFractionEmpilee("case", denominateur, {
    classe: "fraction-reponse fraction-reponse-nc05",
    numerateurHtml: rendreCaseEcritures(question, {
      ariaLabel: "Numérateur à compléter",
    }),
    denominateurHtml: `<span>${echapper(denominateur)}</span>`,
  });
}

function rendreLibelleChoixEcritures(choix) {
  const fraction = /^(\d+)\/(\d+)$/.exec(choix.libelle);
  if (fraction) {
    return rendreFractionEmpilee(Number(fraction[1]), Number(fraction[2]));
  }
  const mixte = /^(\d+) \+ (\d+)\/(\d+)$/.exec(choix.libelle);
  if (mixte) {
    return `<span class="ecriture-mixte"><strong>${echapper(mixte[1])}</strong><span>+</span>${rendreFractionEmpilee(Number(mixte[2]), Number(mixte[3]))}</span>`;
  }
  const pourcentage = /^(\d+) %$/.exec(choix.libelle);
  if (pourcentage) return rendrePourcentage(Number(pourcentage[1]));
  if (/^\d+(?:,\d+)?$/.test(choix.libelle)) {
    return `<strong class="ecriture-decimale-nc05">${echapper(choix.libelle)}</strong>`;
  }
  return echapper(choix.libelle);
}

function denominateurQuestionEcritures(question) {
  return blocQuestion(question, "source-fraction")?.denominateur
    ?? blocQuestion(question, "denominateur-cible")?.valeur
    ?? blocQuestion(question, "denominateur-mixte")?.valeur
    ?? null;
}

function dimensionsGrilleEcritures(denominateur) {
  if (denominateur === 4) return { colonnes: 2, lignes: 2 };
  if (denominateur === 100) return { colonnes: 10, lignes: 10 };
  return { colonnes: denominateur, lignes: 1 };
}

function rendreUnitesAiresEcritures(
  numerateur,
  denominateur,
  { nombreUnites = null, classe = "" } = {},
) {
  const dimensions = dimensionsGrilleEcritures(denominateur);
  const totalUnites = nombreUnites
    ?? Math.max(1, Math.ceil(numerateur / denominateur));
  const figures = Array.from({ length: totalUnites }, (_, index) => {
    const coloriees = Math.max(
      0,
      Math.min(denominateur, numerateur - index * denominateur),
    );
    return rendreFigureFraction(
      dessinerGrilleFraction({
        ...dimensions,
        coloriees,
        cote: denominateur === 100 ? 132 : 128,
        ecriture: false,
      }),
      "figure-unite-aires-nc05",
    );
  }).join("");
  return `<div class="unites-aires-nc05 ${classe}" data-unites="${totalUnites}">${figures}</div>`;
}

function fractionSourceAiresEcritures(question) {
  const sourceFraction = blocQuestion(question, "source-fraction");
  if (sourceFraction?.type === "rationnel") {
    return {
      numerateur: sourceFraction.numerateur,
      denominateur: sourceFraction.denominateur,
    };
  }
  const partieEntiere = blocQuestion(question, "partie-entiere")?.valeur;
  const numerateurMixte = blocQuestion(question, "numerateur-mixte")?.valeur;
  const denominateurMixte = blocQuestion(question, "denominateur-mixte")?.valeur;
  if (
    Number.isSafeInteger(partieEntiere)
    && Number.isSafeInteger(numerateurMixte)
    && Number.isSafeInteger(denominateurMixte)
  ) {
    return {
      numerateur: partieEntiere * denominateurMixte + numerateurMixte,
      denominateur: denominateurMixte,
    };
  }
  const pourcentage = pourcentageQuestionEcrituresMultiples(question);
  return { numerateur: pourcentage, denominateur: 100 };
}

function fractionRepereAiresEcritures(question, pourcentage) {
  const source = fractionSourceAiresEcritures(question);
  if (source.denominateur !== 100) return source;
  const denominateur = denominateurQuestionEcritures(question);
  if (
    [2, 4, 5, 10].includes(denominateur)
    && (pourcentage * denominateur) % 100 === 0
  ) {
    return {
      numerateur: (pourcentage * denominateur) / 100,
      denominateur,
    };
  }
  const reduite = question.correction?.find(
    (bloc) => bloc.id === "correction-fraction-reduite",
  );
  if (reduite?.type === "rationnel" && [2, 4, 5, 10].includes(reduite.denominateur)) {
    return { numerateur: reduite.numerateur, denominateur: reduite.denominateur };
  }
  return null;
}

function rendreVisuelSourceEcritures(question, classe = "") {
  const source = fractionSourceAiresEcritures(question);
  return `<div class="modele-source-aires-nc05 ${classe}">
    ${rendreUnitesAiresEcritures(source.numerateur, source.denominateur)}
  </div>`;
}

function rendreEquivalenceAiresDepuisValeur(
  pourcentage,
  denominateurRepere = null,
  { centiemesColories = true, classe = "" } = {},
) {
  const nombreUnites = Math.max(1, Math.ceil(pourcentage / 100));
  const repereCompatible = [2, 4, 5, 10].includes(denominateurRepere)
    && (pourcentage * denominateurRepere) % 100 === 0;
  const centiemes = rendreUnitesAiresEcritures(
    centiemesColories ? pourcentage : 0,
    100,
    { nombreUnites, classe: "unites-centiemes-nc05" },
  );
  if (!repereCompatible) {
    return `<figure class="equivalence-aires-nc05 equivalence-aires-simple-nc05 ${classe}">
      ${centiemes}
      <figcaption>Chaque carré entier vaut 100 centièmes.</figcaption>
    </figure>`;
  }
  const numerateurRepere = (pourcentage * denominateurRepere) / 100;
  const repere = rendreUnitesAiresEcritures(
    numerateurRepere,
    denominateurRepere,
    { nombreUnites, classe: "unites-repere-nc05" },
  );
  return `<figure class="equivalence-aires-nc05 ${classe}">
    <div class="cote-equivalence-aires-nc05">
      ${repere}
      <p>${rendreFractionEmpilee(numerateurRepere, denominateurRepere)}</p>
    </div>
    <span class="egal-aires-nc05" role="math" aria-label="égal">=</span>
    <div class="cote-equivalence-aires-nc05">
      ${centiemes}
      <p>${centiemesColories
        ? rendreFractionEmpilee(pourcentage, 100)
        : "? centièmes"}</p>
    </div>
    <figcaption>La même unité est découpée autrement, mais la surface représentée ne change pas.</figcaption>
  </figure>`;
}

function rendreVisuelQuestionEcritures(question) {
  if (presentationQuestionEcrituresMultiples(question) !== "visuelle") return "";
  return `<section class="visuel-question-nc05" aria-label="Représentation de l’écriture donnée">
    ${rendreVisuelSourceEcritures(question)}
  </section>`;
}

function rendreVisuelAideEcritures(question, pourcentage) {
  const source = fractionSourceAiresEcritures(question);
  if (source.denominateur !== 100) {
    return rendreEquivalenceAiresDepuisValeur(
      pourcentage,
      source.denominateur,
      { centiemesColories: false, classe: "equivalence-aires-aide-nc05" },
    );
  }
  if (pourcentage <= 100) {
    return rendreFigureFraction(
      dessinerGrilleFraction({
        colonnes: 10,
        lignes: 10,
        coloriees: 0,
        cote: 150,
        ecriture: false,
      }),
      "figure-grille-aide-nc05",
      "Une unité partagée en 100 cases égales",
    );
  }
  return rendreVisuelSourceEcritures(question, "modele-source-aide-nc05");
}

function rendreVisuelCorrectionEcritures(question, pourcentage) {
  if (familleQuestion(question) === FAMILLE_RECONNAITRE_EQUIVALENCES) {
    return rendreDroiteEcritures(pourcentage, { equivalenceVisible: true });
  }
  const repere = fractionRepereAiresEcritures(question, pourcentage);
  return rendreEquivalenceAiresDepuisValeur(
    pourcentage,
    repere?.denominateur ?? null,
    { classe: "equivalence-aires-correction-nc05" },
  );
}

function rendreChaineQuestionEcritures(question) {
  const variante = varianteQuestionEcrituresMultiples(question);
  const pourcentage = pourcentageQuestionEcrituresMultiples(question);
  const decimal = formaterPourcentageEnDecimal(pourcentage);
  const fractionSource = blocQuestion(question, "source-fraction");
  const denominateur = denominateurQuestionEcritures(question);
  const partieEntiere = blocQuestion(question, "partie-entiere")?.valeur;
  const numerateurMixte = blocQuestion(question, "numerateur-mixte")?.valeur;
  const egal = '<span class="signe-egal-nc05" role="math" aria-label="égal">=</span>';

  if (variante === "pourcentage-vers-fraction-centiemes") {
    return `${rendrePourcentage(pourcentage)}${egal}${rendreFractionCibleEcritures(question, 100)}`;
  }
  if (variante === "pourcentage-vers-decimal") {
    return `${rendrePourcentage(pourcentage)}${egal}${rendreCaseEcritures(question, { ariaLabel: "Écriture décimale à compléter" })}`;
  }
  if (variante === "decimal-vers-pourcentage") {
    return `<strong class="ecriture-decimale-nc05">${echapper(decimal)}</strong>${egal}${rendreCaseEcritures(question, { suffixe: "%", ariaLabel: "Pourcentage à compléter" })}`;
  }
  if (variante === "fraction-vers-pourcentage") {
    return `${rendreFractionEmpilee(fractionSource.numerateur, fractionSource.denominateur)}${egal}${rendreCaseEcritures(question, { suffixe: "%", ariaLabel: "Pourcentage à compléter" })}`;
  }
  if (variante === "chaine-vers-pourcentage") {
    return `<strong class="ecriture-decimale-nc05">${echapper(decimal)}</strong>${egal}${rendreFractionEmpilee(fractionSource.numerateur, fractionSource.denominateur)}${egal}${rendreCaseEcritures(question, { suffixe: "%", ariaLabel: "Pourcentage à compléter" })}`;
  }
  if (variante === "chaine-vers-decimal") {
    return `${rendreCaseEcritures(question, { ariaLabel: "Écriture décimale à compléter" })}${egal}${rendreFractionEmpilee(fractionSource.numerateur, fractionSource.denominateur)}${egal}${rendrePourcentage(pourcentage)}`;
  }
  if (variante === "chaine-vers-fraction") {
    return `<strong class="ecriture-decimale-nc05">${echapper(decimal)}</strong>${egal}${rendreFractionCibleEcritures(question, denominateur)}${egal}${rendrePourcentage(pourcentage)}`;
  }
  if (variante === "unite-vers-entier") {
    return `${rendrePourcentage(100)}${egal}${rendreCaseEcritures(question, { ariaLabel: "Nombre à compléter" })}`;
  }
  if (variante === "mixte-vers-pourcentage") {
    return `<span class="ecriture-mixte"><strong>${echapper(partieEntiere)}</strong><span>+</span>${rendreFractionEmpilee(numerateurMixte, denominateur)}</span>${egal}${rendreCaseEcritures(question, { suffixe: "%", ariaLabel: "Pourcentage à compléter" })}`;
  }
  if (variante === "pourcentage-vers-mixte") {
    return `${rendrePourcentage(pourcentage)}${egal}<span class="ecriture-mixte"><strong>${echapper(partieEntiere)}</strong><span>+</span>${rendreFractionCibleEcritures(question, denominateur)}</span>`;
  }
  if (variante === "choix-unique") {
    return rendrePourcentage(pourcentage);
  }
  return `<strong class="ecriture-decimale-nc05">${echapper(decimal)}</strong>`;
}

function rendreQuestionEcrituresMultiples() {
  const question = questionCourante(etat);
  const reconnaissance = familleQuestion(question)
    === FAMILLE_RECONNAITRE_EQUIVALENCES;
  const selectionMultiple = question.reponse.type
    === TYPE_REPONSE_SELECTION_MULTIPLE;
  const carteQuestion = `<main class="carte-question carte-question-ecritures famille-${echapper(familleQuestion(question))}">
    <p class="etiquette-notion">${echapper(nomNotion())}</p>
    <h1>${echapper(texteBloc(question, "consigne"))}</h1>
    ${reconnaissance
      ? `<p class="cible-reconnaissance-nc05">${rendreChaineQuestionEcritures(question)}</p>
        <p class="precision">${selectionMultiple ? "Plusieurs réponses sont attendues." : "Choisis une seule réponse."}</p>
        <div class="grille-choix grille-choix-ecritures ${estEntrainement() ? "" : "grille-projection"}"
          role="${selectionMultiple || !estEntrainement() ? "group" : "radiogroup"}"
          aria-label="Écritures proposées">
          ${rendreChoix(question, rendreLibelleChoixEcritures)}
        </div>`
      : `${rendreVisuelQuestionEcritures(question)}
        <p class="chaine-question-nc05">${rendreChaineQuestionEcritures(question)}</p>
        ${estEntrainement() ? '<p class="indication-clavier-physique">Chiffres · virgule si nécessaire · Retour arrière · Entrée pour valider</p>' : ""}`}
    ${estEntrainement() ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
  </main>`;
  return rendreCoqueLecteur(question, carteQuestion);
}

function rendreDroiteEcritures(
  pourcentage,
  { equivalenceVisible = false, etiquetteSource = null } = {},
) {
  const valeur = pourcentage / 100;
  const depasseUn = valeur > 1;
  const max = depasseUn ? 3 : 1.25;
  const graduations = depasseUn
    ? [0, 0.5, 1, 1.5, 2, 2.5, 3]
    : [0, 0.25, 0.5, 0.75, 1, 1.25];
  const etiquette = equivalenceVisible
    ? `${formaterPourcentageEnDecimal(pourcentage)} = ${pourcentage} %`
    : etiquetteSource ?? `${pourcentage} %`;
  const construire = (largeur, classe) => rendreFigureFraction(
    dessinerDroiteGraduee({
      min: 0,
      max,
      graduations,
      largeur,
      nom: "Valeur",
      tailleEtiquette: 17,
      points: [{
        valeur,
        etiquette,
        couleur: COULEURS.orange,
        position: "dessous",
      }],
      description: equivalenceVisible
        ? `Le même point est repéré par ${formaterPourcentageEnDecimal(pourcentage)} et ${pourcentage} pour cent.`
        : "Le point correspondant à l’écriture déjà donnée est placé sur la droite graduée.",
    }),
    `figure-droite-nc05 ${classe}`,
  );
  return `<div class="droite-nc05-responsive">
    ${construire(680, "droite-nc05-large")}
    ${construire(320, "droite-nc05-mobile")}
  </div>`;
}

function etiquetteSourceAideEcritures(question) {
  const pourcentage = blocQuestion(question, "source-pourcentage")?.valeur;
  if (Number.isSafeInteger(pourcentage)) return `${pourcentage} %`;
  const decimal = blocQuestion(question, "source-decimale");
  if (decimal?.type === "rationnel") {
    return formaterPourcentageEnDecimal(
      (decimal.numerateur * 100) / decimal.denominateur,
    );
  }
  const fraction = blocQuestion(question, "source-fraction");
  if (fraction?.type === "rationnel") {
    return {
      type: "fraction",
      numerateur: fraction.numerateur,
      denominateur: fraction.denominateur,
    };
  }
  const partieEntiere = blocQuestion(question, "partie-entiere")?.valeur;
  const numerateur = blocQuestion(question, "numerateur-mixte")?.valeur;
  const denominateur = blocQuestion(question, "denominateur-mixte")?.valeur;
  if (
    Number.isSafeInteger(partieEntiere)
    && Number.isSafeInteger(numerateur)
    && Number.isSafeInteger(denominateur)
  ) {
    return "écriture donnée";
  }
  return "Même nombre";
}

function rendreChaineCompleteEcritures(question) {
  const pourcentage = pourcentageQuestionEcrituresMultiples(question);
  const decimal = formaterPourcentageEnDecimal(pourcentage);
  const fractionSource = blocQuestion(question, "source-fraction");
  const fractionReduite = question.correction?.find(
    (bloc) => bloc.id === "correction-fraction-reduite",
  );
  const denominateur = denominateurQuestionEcritures(question);
  const partieEntiere = Math.floor(pourcentage / 100);
  const reste = pourcentage % 100;
  const elements = [
    `<strong class="ecriture-decimale-nc05">${echapper(decimal)}</strong>`,
    rendreFractionEmpilee(pourcentage, 100),
  ];
  const fractionsAjoutees = new Set([`${pourcentage}/100`]);
  const ajouterFraction = (numerateur, denominateurFraction) => {
    const cle = `${numerateur}/${denominateurFraction}`;
    if (
      !Number.isSafeInteger(numerateur)
      || !Number.isSafeInteger(denominateurFraction)
      || fractionsAjoutees.has(cle)
    ) return;
    fractionsAjoutees.add(cle);
    elements.push(rendreFractionEmpilee(numerateur, denominateurFraction));
  };
  if (fractionSource) {
    ajouterFraction(fractionSource.numerateur, fractionSource.denominateur);
  } else if (fractionReduite?.type === "rationnel") {
    ajouterFraction(fractionReduite.numerateur, fractionReduite.denominateur);
  }
  if (
    pourcentage > 100
    && denominateur
    && reste > 0
    && (reste * denominateur) % 100 === 0
  ) {
    elements.push(`<span class="ecriture-mixte"><strong>${partieEntiere}</strong><span>+</span>${rendreFractionEmpilee((reste * denominateur) / 100, denominateur)}</span>`);
  }
  elements.push(rendrePourcentage(pourcentage));
  return `<p class="chaine-complete-nc05">${elements.join('<span class="signe-egal-nc05" role="math" aria-label="égal">=</span>')}</p>`;
}

function rendreAideEcrituresMultiples(question) {
  if (!etat.aideOuverte) return "";
  const pourcentage = pourcentageQuestionEcrituresMultiples(question);
  const visuelAide = rendreVisuelAideEcritures(question, pourcentage);
  const etapes = question.aide.blocs.map((bloc, index) => `<details class="etape-aide-nc05" ${index === 0 ? "open" : ""}>
    <summary><span>${index + 1}</span>${["Repérer", "Traduire %", "Relier", "Vérifier"][index]}</summary>
    <p>${echapper(bloc.contenu)}</p>
  </details>`).join("");
  const contenu = `<section class="rappel-question rappel-question-nc05">
      <span>Question en cours</span>
      <p class="chaine-question-nc05">${rendreChaineQuestionEcritures(question)}</p>
    </section>
    <div class="visuels-aide-nc05">${visuelAide}${rendreDroiteEcritures(pourcentage, {
      etiquetteSource: etiquetteSourceAideEcritures(question),
    })}</div>
    <div class="etapes-aide-nc05">${etapes}</div>
    ${rendreAccesCoursDepuisAide()}`;
  return rendreCadrePanneau({
    type: "aide",
    surtitre: "Un indice à la fois",
    titre: "Garder le même nombre",
    contenu,
    classes: "panneau-ecritures-multiples",
  });
}

function diagnosticsChoisisEcritures(question) {
  if (etat.validation?.juste !== false || etat.selection.length === 0) return "";
  return etat.selection
    .filter((id) => !question.reponse.attendus.includes(id))
    .map((id) => question.correction.find((bloc) => bloc.id === `diagnostic-${id}`))
    .filter(Boolean)
    .map((bloc) => `<p class="diagnostic-nc05"><strong>À vérifier</strong>${echapper(bloc.contenu)}</p>`)
    .join("");
}

function rendreCorrectionEcrituresMultiples(question) {
  if (!etat.correctionOuverte) return "";
  const pourcentage = pourcentageQuestionEcrituresMultiples(question);
  const contenu = `${rendreReponseEleve(question)}
    ${diagnosticsChoisisEcritures(question)}
    <p class="principe-correction-nc05">Le symbole <strong>%</strong> signifie « sur 100 ». On conserve donc exactement la même valeur.</p>
    ${rendreVisuelCorrectionEcritures(question, pourcentage)}
    <p class="titre-reponse-correcte">Réponse correcte</p>
    ${rendreChaineCompleteEcritures(question)}
    <p class="controle-grandeur-nc05">${pourcentage < 100
      ? "Le résultat est bien entre 0 et 1, car le pourcentage est inférieur à 100 %."
      : pourcentage === 100
        ? "Le résultat vaut exactement 1, car 100 % représente une unité entière."
        : "Le résultat est bien supérieur à 1, car le pourcentage dépasse 100 %."}</p>`;
  return rendreCadrePanneau({
    type: "correction",
    surtitre: "Après la réponse",
    titre: "Correction expliquée",
    contenu,
    classes: "panneau-ecritures-multiples",
  });
}

function rendreGrilleCoursPourcentage(pourcentage, classe = "") {
  return `<article class="carte-grille-pourcentage-nc05 ${classe}">
    ${rendreFigureFraction(
      dessinerGrilleFraction({
        colonnes: 10,
        lignes: 10,
        coloriees: pourcentage,
        cote: 138,
        ecriture: false,
      }),
      "figure-grille-cours-nc05",
    )}
    <p>${rendrePourcentage(pourcentage)}<span>=</span>${rendreFractionEmpilee(pourcentage, 100)}<span>=</span><strong>${echapper(formaterPourcentageEnDecimal(pourcentage))}</strong></p>
  </article>`;
}

function rendreRepereCoursEcritures(numerateur, denominateur) {
  const pourcentage = (numerateur * 100) / denominateur;
  return `<article class="carte-repere-nc05">
    <p>${rendreFractionEmpilee(numerateur, denominateur)}<span>=</span><strong>${echapper(formaterPourcentageEnDecimal(pourcentage))}</strong><span>=</span>${rendrePourcentage(pourcentage)}</p>
  </article>`;
}

function rendreCarteCoursEcritures(index) {
  if (index === 0) {
    return `<article class="carte-cours-nc05">
      <span class="numero-cours">1</span><h3>Une valeur, plusieurs écritures</h3>
      <p class="introduction-cours">Une fraction, un décimal et un pourcentage peuvent désigner exactement le même point.</p>
      ${rendreDroiteEcritures(75, { equivalenceVisible: true })}
      <p class="chaine-exemple-nc05"><strong>0,75</strong><span>=</span>${rendreFractionEmpilee(3, 4)}<span>=</span>${rendrePourcentage(75)}</p>
      <p class="definition-cours">L’écriture change ; la valeur et la position du nombre ne changent pas.</p>
    </article>`;
  }
  if (index === 1) {
    return `<article class="carte-cours-nc05">
      <span class="numero-cours">2</span><h3>« Pour cent » signifie « sur 100 »</h3>
      <div class="comparaison-grilles-nc05">
        ${rendreGrilleCoursPourcentage(7, "petit-pourcentage")}
        ${rendreGrilleCoursPourcentage(70)}
      </div>
      <p class="alerte-decimale-nc05"><strong>Attention :</strong> 7 % = 0,07, tandis que 70 % = 0,7.</p>
    </article>`;
  }
  if (index === 2) {
    return `<article class="carte-cours-nc05">
      <span class="numero-cours">3</span><h3>Construire avant d’utiliser le raccourci</h3>
      <div class="deux-tableaux-nc05">
        <section><h4>Quarante pour cent</h4>${rendreTableauNumeration(40, 100, { afficherChiffres: true, colonneMiseEnEvidence: "dixiemes" })}<p>${rendrePourcentage(40)} = <strong>0,4</strong></p></section>
        <section><h4>Quatre pour cent</h4>${rendreTableauNumeration(4, 100, { afficherChiffres: true, colonneMiseEnEvidence: "centiemes" })}<p>${rendrePourcentage(4)} = <strong>0,04</strong></p></section>
      </div>
      <p class="definition-cours">Le nombre de centièmes fixe la place de la virgule : on ne supprime jamais le zéro utile.</p>
    </article>`;
  }
  if (index === 3) {
    return `<article class="carte-cours-nc05">
      <span class="numero-cours">4</span><h3>D’un cinquième aux centièmes</h3>
      ${rendreEquivalenceAiresDepuisValeur(80, 5, {
        classe: "equivalence-aires-cours-nc05",
      })}
      <p class="chaine-exemple-nc05">${rendreFractionEmpilee(4, 5)}<span>=</span>${rendreFractionEmpilee(80, 100)}<span>=</span>${rendrePourcentage(80)}</p>
      <div class="reperes-cours-nc05">
        ${rendreRepereCoursEcritures(1, 2)}
        ${rendreRepereCoursEcritures(1, 4)}
        ${rendreRepereCoursEcritures(3, 4)}
        ${rendreRepereCoursEcritures(1, 5)}
      </div>
      <p class="definition-cours">On ne change pas la surface : on partage seulement la même unité en 100 parts.</p>
    </article>`;
  }
  if (index === 4) {
    return `<article class="carte-cours-nc05">
      <span class="numero-cours">5</span><h3>100 % est l’unité ; 120 % la dépasse</h3>
      ${rendreEquivalenceAiresDepuisValeur(120, 5, {
        classe: "equivalence-aires-cours-nc05",
      })}
      <p class="chaine-exemple-nc05 chaine-exemple-longue-nc05"><strong>1,2</strong><span>=</span>${rendreFractionEmpilee(12, 10)}<span>=</span>${rendreFractionEmpilee(6, 5)}<span>=</span><span class="ecriture-mixte"><strong>1</strong><span>+</span>${rendreFractionEmpilee(1, 5)}</span><span>=</span>${rendrePourcentage(120)}<span>=</span>${rendreFractionEmpilee(120, 100)}</p>
      <p class="definition-cours">Un pourcentage peut dépasser 100 % : il représente alors un nombre supérieur à 1.</p>
    </article>`;
  }
  return `<article class="carte-cours-nc05">
    <span class="numero-cours">6</span><h3>Le raccourci, puis le contrôle</h3>
    <div class="raccourcis-nc05">
      <section><span>Pourcentage → décimal</span><strong>÷ 100</strong><p>35 % = 0,35</p></section>
      <section><span>Décimal → pourcentage</span><strong>× 100</strong><p>1,4 = 140 %</p></section>
    </div>
    <ol class="strategies-nc05">
      <li><strong>Je lis la cible.</strong><span>Décimal, numérateur ou pourcentage ?</span></li>
      <li><strong>Je passe par « sur 100 ».</strong><span>Je garde la valeur exacte.</span></li>
      <li><strong>Je contrôle.</strong><span>Moins de 100 % : entre 0 et 1 ; plus de 100 % : au-dessus de 1.</span></li>
    </ol>
  </article>`;
}

function rendreCoursEcrituresMultiples() {
  if (!etat.coursOuvert) return "";
  const total = nombrePagesCours();
  const titres = [
    "Même nombre, même point",
    "Le sens de %",
    "Des centièmes au décimal",
    "Les repères utiles",
    "Atteindre et dépasser 1",
    "Méthode et contrôle",
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
    contenu: `<div class="cours-une-carte">${rendreCarteCoursEcritures(pageCoursCourante)}</div>`,
    pied,
    classes: "panneau-ecritures-multiples panneau-cours-ecritures",
  });
}

function blocDroiteGraduee(question) {
  return question.enonce.find((bloc) => bloc.type === "droite-graduee");
}

function blocRepereCartesien(question) {
  return question?.enonce?.find((bloc) => bloc.type === "repere-cartesien") ?? null;
}

function valeurDroite(bloc, indice) {
  return bloc.depart.numerateur / bloc.depart.denominateur
    + indice * bloc.pas.numerateur / bloc.pas.denominateur;
}

function texteValeurDroite(bloc, indice) {
  const denominateur = bloc.depart.denominateur * bloc.pas.denominateur;
  const numerateur = bloc.depart.numerateur * bloc.pas.denominateur
    + indice * bloc.pas.numerateur * bloc.depart.denominateur;
  return formaterFractionEnDecimalSignee(numerateur, denominateur);
}

function indiceChoisiDroite() {
  const correspondance = /^g-(\d+)$/.exec(etat.selection[0] ?? "");
  return correspondance ? Number(correspondance[1]) : null;
}

function rendreDroiteQuestion(bloc, {
  interactive = false,
  montrerAttendu = false,
  montrerChoix = false,
  classe = "",
} = {}) {
  const graduations = Array.from(
    { length: bloc.nombreIntervalles + 1 },
    (_, indice) => valeurDroite(bloc, indice),
  );
  const etiquettes = Object.fromEntries(
    graduations.map((valeur, indice) => [
      String(valeur),
      bloc.etiquettes.includes(indice) ? texteValeurDroite(bloc, indice) : "",
    ]),
  );
  const question = questionCourante(etat);
  const attendu = question?.reponse.attendus?.[0]?.startsWith("g-")
    ? Number(question.reponse.attendus[0].slice(2))
    : bloc.point?.indice;
  const choisi = indiceChoisiDroite();
  const pointsDonnes = bloc.points ?? (bloc.point ? [bloc.point] : []);
  const couleursPoints = [COULEURS.bleu, COULEURS.orange, COULEURS.turquoise];
  const points = pointsDonnes.length > 0
    ? pointsDonnes.map((point, index) => ({
      valeur: valeurDroite(bloc, point.indice),
      etiquette: point.nom,
      position: point.position ?? (index % 2 === 0 ? "dessus" : "dessous"),
      couleur: couleursPoints[index % couleursPoints.length],
    }))
    : [
      ...(montrerChoix && choisi !== null && choisi !== attendu
        ? [{ valeur: valeurDroite(bloc, choisi), etiquette: "Ton point", couleur: COULEURS.erreur, position: "dessus" }]
        : []),
      ...(montrerAttendu && attendu !== undefined
        ? [{ valeur: valeurDroite(bloc, attendu), etiquette: question?.enonce[0].contenu.match(/point ([A-Z])/)?.[1] ?? "Point attendu", couleur: COULEURS.reussite, position: "dessus" }]
        : montrerChoix && choisi !== null
          ? [{ valeur: valeurDroite(bloc, choisi), etiquette: "Ton point", position: "dessus" }]
          : []),
    ];
  const rendreVersion = (largeur, version) => {
    const dessin = dessinerDroiteGraduee({
      min: graduations[0],
      max: graduations.at(-1),
      graduations,
      etiquettes,
      points,
      largeur,
      tailleNombres: version === "mobile" ? 17 : 18,
      tailleEtiquette: version === "mobile" ? 19 : 20,
      stylePoints: "trait",
      coteNombres: "dessous",
      description: "Droite graduée avec deux valeurs de référence",
    });
    const commandes = interactive
      ? graduations.map((valeur, indice) => {
        const selectionne = choisi === indice;
        const x = 100 * (dessin.geometrie.xGauche
          + indice * (dessin.geometrie.xDroite - dessin.geometrie.xGauche) / bloc.nombreIntervalles) / dessin.largeur;
        const y = 100 * dessin.geometrie.yAxe / dessin.hauteur;
        return `<button class="cible-graduation ${selectionne ? "selectionnee" : ""}" type="button"
          data-action="choix" data-id="g-${indice}" role="radio" aria-checked="${selectionne}"
          aria-label="Placer le point sur la graduation ${indice + 1}"
          style="left:${x}%;top:${y}%"></button>`;
      }).join("")
      : "";
    return `<div class="droite-version-${version}">${dessin.svg}${commandes}</div>`;
  };
  return `<div class="droite-graduee-interactive ${classe}" role="${interactive ? "radiogroup" : "img"}"
    aria-label="${interactive ? "Choisis une graduation" : "Droite graduée"}">
    ${rendreVersion(760, "large")}${rendreVersion(350, "mobile")}
  </div>`;
}

function rendreQuestionDroiteGraduee() {
  const question = questionCourante(etat);
  const bloc = blocDroiteGraduee(question);
  const placement = familleQuestion(question) === "placer-point";
  const qcm = question.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE && !placement;
  const afficherAttendu = !estEntrainement() && etat.reponseRevelee && placement;
  const valeur = estEntrainement()
    ? etat.saisie
    : etat.reponseRevelee && question.reponse.attendu
      ? formaterFractionEnDecimalSignee(question.reponse.attendu.numerateur, question.reponse.attendu.denominateur)
      : "";
  const zone = placement
    ? `${rendreDroiteQuestion(bloc, { interactive: estEntrainement() && etat.validation === null, montrerAttendu: afficherAttendu, montrerChoix: estEntrainement() && indiceChoisiDroite() !== null })}
      <p class="precision">${estEntrainement() ? "Touche une graduation : le point s’y aimante." : "Indiquez la graduation choisie."}</p>`
    : qcm
      ? `${rendreDroiteQuestion(bloc)}<div class="grille-choix grille-qcm-droite" role="radiogroup">${rendreChoix(question)}</div>`
      : `${rendreDroiteQuestion(bloc)}<section class="saisie-numerique" aria-label="Réponse numérique">
          <span class="libelle-saisie-droite">${familleQuestion(question) === "determiner-pas" ? "pas" : `x<sub>${echapper(bloc.point?.nom ?? "")}</sub>`} =</span>
          <output class="afficheur-reponse ${valeur ? "rempli" : ""}">${echapper(valeur || (estEntrainement() ? "…" : "?"))}</output>
          ${estEntrainement() && etat.validation === null ? '<p class="indication-clavier-physique">Chiffres · virgule · signe moins si nécessaire · Entrée pour valider</p>' : ""}
        </section>`;
  const notationFraction = texteBloc(question, "notation") === "fraction";
  const consigne = texteBloc(question, "consigne");
  const consigneFraction = notationFraction
    ? consigne.replace(/(−?\d+)\/(\d+)/, (_, numerateur, denominateur) => rendreFractionEmpilee(numerateur, denominateur, { classe: "fraction-question-droite" }))
    : echapper(consigne);
  const carteQuestion = `<main class="carte-question carte-question-droite famille-${echapper(familleQuestion(question))}">
    <p class="etiquette-notion">${echapper(nomNotion())}</p>
    <h1>${consigneFraction}</h1>
    ${zone}
    ${estEntrainement() ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
  </main>`;
  return rendreCoqueLecteur(question, carteQuestion);
}

function rendreAideDroiteGraduee(question) {
  if (!etat.aideOuverte) return "";
  const bloc = blocDroiteGraduee(question);
  const titres = ["Repérer", "Compter", "Trouver le pas", "Se déplacer"];
  const etapes = question.aide.blocs.map((element, index) => `<details class="etape-aide-droite" ${index === 0 ? "open" : ""}><summary><span>${index + 1}</span>${titres[index] ?? "Contrôler"}</summary><p>${echapper(element.contenu)}</p></details>`).join("");
  const debut = bloc.etiquettes[0];
  const fin = bloc.etiquettes[1];
  const droiteExpliquee = rendreDroiteCoursAnnotee({
    depart: [bloc.depart.numerateur, bloc.depart.denominateur],
    pas: [bloc.pas.numerateur, bloc.pas.denominateur],
    intervalles: bloc.nombreIntervalles,
    etiquettes: bloc.etiquettes,
    point: bloc.point,
  }, [{ type: "accolade", debut, fin, texte: "deux valeurs connues" }, { type: "intervalles", debut, fin }]);
  let railFraction = "";
  if (texteBloc(question, "notation") === "fraction") {
    const placement = familleQuestion(question) === "placer-point";
    const indice = placement ? Number(question.reponse.attendus[0]?.slice(2)) : bloc.point?.indice;
    const denominateur = bloc.pas.denominateur;
    const numerateur = Math.max(1, Math.round(Math.abs(valeurDroite(bloc, indice)) * denominateur));
    railFraction = `<section class="rail-fraction-aide-droite"><h3>Construire les quarts</h3>${rendreBandesRailCours(placement ? numerateur : 1, denominateur, "pieces", placement, 600, { largeurMobile: 330, afficherReperesIntermediairesCours: true })}<p>${placement ? "Regroupe d’abord 4 quarts pour former 1 unité, puis place les quarts restants." : "Une unité est partagée en 4 parts égales : chaque intervalle vaut un quart."}</p></section>`;
  }
  return rendreCadrePanneau({
    type: "aide",
    surtitre: "Un indice à la fois",
    titre: "Lire l’échelle sans deviner",
    contenu: `${droiteExpliquee}<div class="etapes-droite">${etapes}</div>${railFraction}${rendreAccesCoursDepuisAide()}`,
    classes: "panneau-droite-graduee",
  });
}

function rendreCorrectionDroiteGraduee(question) {
  if (!etat.correctionOuverte) return "";
  const bloc = blocDroiteGraduee(question);
  const placement = familleQuestion(question) === "placer-point";
  const explication = question.correction.map((element) => `<p>${echapper(element.contenu)}</p>`).join("");
  return rendreCadrePanneau({
    type: "correction",
    surtitre: "Après la réponse",
    titre: "Correction expliquée",
    contenu: `${rendreReponseEleve(question)}${rendreDroiteQuestion(bloc, {
      montrerAttendu: placement,
      montrerChoix: placement,
      classe: "droite-correction",
    })}<div class="methode-droite">${explication}</div><p class="titre-reponse-correcte">Réponse correcte</p>${rendreReponseCorrecte(question)}`,
    classes: "panneau-droite-graduee",
  });
}

function donneesDroiteCours({ depart, pas, intervalles, etiquettes, point }) {
  return {
    depart: { numerateur: depart[0], denominateur: depart[1] },
    pas: { numerateur: pas[0], denominateur: pas[1] },
    nombreIntervalles: intervalles,
    etiquettes,
    ...(point ? { point } : {}),
  };
}

function rendreDroiteCoursAnnotee(configuration, annotations = []) {
  const bloc = donneesDroiteCours(configuration);
  const graduations = Array.from({ length: bloc.nombreIntervalles + 1 }, (_, indice) => valeurDroite(bloc, indice));
  const etiquettes = Object.fromEntries(graduations.map((valeur, indice) => [
    String(valeur), bloc.etiquettes.includes(indice) ? texteValeurDroite(bloc, indice) : "",
  ]));
  const points = bloc.point ? [{
    valeur: valeurDroite(bloc, bloc.point.indice), etiquette: bloc.point.nom,
    position: bloc.point.position ?? "dessus", couleur: COULEURS.bleu,
  }] : [];
  const rendreVersion = (largeur, version) => {
    const dessin = dessinerDroiteGraduee({
      min: graduations[0], max: graduations.at(-1), graduations, etiquettes, points,
      largeur, tailleNombres: version === "mobile" ? 17 : 18,
      tailleEtiquette: version === "mobile" ? 19 : 20, stylePoints: "trait",
      coteNombres: "dessous", description: "Droite graduée expliquée étape par étape",
    });
    const margeHaut = 58;
    const margeBas = annotations.some((annotation) => annotation.type === "valeurs") ? 52 : 30;
    const hauteur = dessin.hauteur + margeHaut + margeBas;
    const corps = dessin.svg.slice(dessin.svg.indexOf(">") + 1, dessin.svg.lastIndexOf("</svg>"));
    const x = (indice) => dessin.geometrie.xGauche + indice * (dessin.geometrie.xDroite - dessin.geometrie.xGauche) / bloc.nombreIntervalles;
    const y = dessin.geometrie.yAxe + margeHaut;
    const taille = version === "mobile" ? 13 : 16;
    const textes = (contenu, xTexte, yTexte, couleur = COULEURS.bleu, poids = 700) => `<text x="${xTexte}" y="${yTexte}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${taille}" font-weight="${poids}" fill="${couleur}">${echapper(contenu)}</text>`;
    const superpositions = annotations.map((annotation) => {
      const x1 = x(annotation.debut ?? annotation.indice ?? 0);
      const x2 = x(annotation.fin ?? annotation.indice ?? 0);
      if (annotation.type === "accolade") {
        const yy = y - 31;
        return `<path d="M ${x1} ${yy + 8} Q ${x1} ${yy} ${x1 + 8} ${yy} L ${x2 - 8} ${yy} Q ${x2} ${yy} ${x2} ${yy + 8}" fill="none" stroke="${COULEURS.turquoise}" stroke-width="3" stroke-linecap="round"/>${textes(annotation.texte, (x1 + x2) / 2, yy - 8, COULEURS.bleu)}`;
      }
      if (annotation.type === "intervalles") {
        return Array.from({ length: annotation.fin - annotation.debut }, (_, rang) => {
          const gauche = x(annotation.debut + rang);
          const droite = x(annotation.debut + rang + 1);
          return `<path d="M ${gauche + 3} ${y + 32} Q ${(gauche + droite) / 2} ${y + 45} ${droite - 3} ${y + 32}" fill="none" stroke="${COULEURS.orange}" stroke-width="2"/>${textes(String(rang + 1), (gauche + droite) / 2, y + 55, COULEURS.orange)}`;
        }).join("");
      }
      if (annotation.type === "sauts") {
        return Array.from({ length: Math.abs(annotation.fin - annotation.debut) }, (_, rang) => {
          const sens = annotation.fin >= annotation.debut ? 1 : -1;
          const gauche = x(annotation.debut + rang * sens);
          const droite = x(annotation.debut + (rang + 1) * sens);
          const milieu = (gauche + droite) / 2;
          return `<path d="M ${gauche} ${y - 14} Q ${milieu} ${y - 48} ${droite} ${y - 14}" fill="none" stroke="${COULEURS.turquoise}" stroke-width="3" stroke-linecap="round"/><path d="M ${droite - sens * 8} ${y - 21} L ${droite} ${y - 14} L ${droite - sens * 2} ${y - 25}" fill="none" stroke="${COULEURS.turquoise}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${textes(annotation.texte, milieu, y - 44, COULEURS.bleu)}`;
        }).join("");
      }
      if (annotation.type === "appel") {
        const tx = x1 + (annotation.decalage ?? 0);
        return `${textes(annotation.texte, tx, 16, COULEURS.bleu)}<path d="M ${tx} 22 L ${x1} ${y - 12}" fill="none" stroke="${COULEURS.turquoise}" stroke-width="2.5" stroke-linecap="round"/><path d="M ${x1 - 5} ${y - 20} L ${x1} ${y - 12} L ${x1 + 5} ${y - 20}" fill="none" stroke="${COULEURS.turquoise}" stroke-width="2.5"/>`;
      }
      if (annotation.type === "valeurs") {
        return annotation.elements.map((element) => textes(element.texte, x(element.indice), y + 52, element.couleur ?? COULEURS.bleu)).join("");
      }
      return "";
    }).join("");
    return `<div class="droite-version-${version}"><svg viewBox="0 0 ${largeur} ${hauteur}" width="${largeur}" height="${hauteur}" role="img" aria-label="Droite graduée annotée"><g transform="translate(0 ${margeHaut})">${corps}</g>${superpositions}</svg></div>`;
  };
  return `<div class="droite-graduee-interactive droite-cours droite-cours-annotee">${rendreVersion(760, "large")}${rendreVersion(350, "mobile")}</div>`;
}

function carteCoursDroite(index) {
  const entete = (numero, titre) => `<header class="entete-cours-droite"><span class="numero-cours">${numero}</span><h3>${titre}</h3></header>`;
  if (index === 0) return `<article class="carte-cours-droite">${entete(1, "Comprendre les mots")}
    ${rendreDroiteCoursAnnotee({ depart: [-3, 1], pas: [1, 1], intervalles: 7, etiquettes: [0, 3, 5], point: { nom: "A", indice: 5, position: "dessus" } }, [
      { type: "appel", indice: 1, texte: "graduation", decalage: -18 },
      { type: "appel", indice: 3, texte: "origine", decalage: 18 },
      { type: "intervalles", debut: 1, fin: 2 },
    ])}
    <p class="exemple-abscisse">Le point A est placé sur la graduation 2 : <strong>x<sub>A</sub> = 2</strong>.</p>
    <dl class="lexique-droite"><div><dt>Graduation</dt><dd>un trait sur la droite</dd></div><div><dt>Intervalle</dt><dd>l’espace entre deux traits</dd></div><div><dt>Origine</dt><dd>la graduation 0</dd></div><div><dt>Abscisse</dt><dd>le nombre qui repère un point</dd></div></dl>
    <p class="definition-cours"><strong>Sens :</strong> les nombres augmentent vers la droite et diminuent vers la gauche.</p></article>`;
  if (index === 1) return `<article class="carte-cours-droite">${entete(2, "Trouver le pas")}
    ${rendreDroiteCoursAnnotee({ depart: [-20, 1], pas: [10, 1], intervalles: 6, etiquettes: [0, 4] }, [{ type: "accolade", debut: 0, fin: 4, texte: "écart : 40" }, { type: "intervalles", debut: 0, fin: 4 }])}
    <ol class="methode-cours-droite"><li><strong>Écart :</strong> 20 − (−20) = 40.</li><li><strong>Intervalles :</strong> on compte 4 espaces.</li><li><strong>Pas :</strong> 40 ÷ 4 = 10.</li></ol>
    <p class="alerte-droite"><strong>Piège fréquent :</strong> 5 traits délimitent seulement 4 intervalles.</p></article>`;
  if (index === 2) return `<article class="carte-cours-droite">${entete(3, "Lire une abscisse")}
    ${rendreDroiteCoursAnnotee({ depart: [-2, 1], pas: [1, 2], intervalles: 8, etiquettes: [0, 4], point: { nom: "B", indice: 7, position: "dessus" } }, [{ type: "sauts", debut: 4, fin: 7, texte: "+ 0,5" }, { type: "valeurs", elements: [{ indice: 4, texte: "0" }, { indice: 5, texte: "0,5" }, { indice: 6, texte: "1" }, { indice: 7, texte: "1,5" }] }])}
    <ol class="methode-cours-droite"><li>De −2 à 0 : 2 ÷ 4 = <strong>0,5</strong>. C’est le pas.</li><li>Depuis 0, je fais 3 sauts de 0,5 vers la droite.</li></ol>
    <p class="definition-cours">Donc l’abscisse du point B est 1,5 : on écrit <strong>x<sub>B</sub> = 1,5</strong>.</p></article>`;
  if (index === 3) return `<article class="carte-cours-droite">${entete(4, "Placer un point")}
    ${rendreDroiteCoursAnnotee({ depart: [-1, 1], pas: [1, 4], intervalles: 8, etiquettes: [0, 4], point: { nom: "M", indice: 6, position: "dessus" } }, [{ type: "sauts", debut: 4, fin: 6, texte: "+ 0,25" }, { type: "valeurs", elements: [{ indice: 4, texte: "0" }, { indice: 5, texte: "0,25" }, { indice: 6, texte: "0,5" }] }])}
    <ol class="methode-cours-droite"><li>Le pas vaut <strong>0,25</strong>.</li><li>0,5 = 0 + 2 × 0,25 : je fais 2 sauts vers la droite.</li><li>Je touche la graduation ; le point s’y aimante.</li></ol></article>`;
  if (index === 4) return `<article class="carte-cours-droite carte-cours-droite-fractions">${entete(5, "Placer une fraction")}
    <p>Chaque unité est partagée en <strong>4 quarts</strong>. Je place 7 morceaux de <span class="fraction-dans-texte">${rendreFractionEmpilee(1, 4)}</span>.</p>
    ${rendreBandesRailCours(7, 4, "pieces", true, 720, { largeurMobile: 340, afficherReperesIntermediairesCours: true })}
    <p class="definition-cours">Les 4 premiers quarts fusionnent en 1 unité. Il reste 3 quarts : ${rendreFractionEmpilee(7, 4)} = 1 + ${rendreFractionEmpilee(3, 4)}.</p>
    <p class="precision-cours-droite">Le rail aide à construire le nombre ; la réponse se place ensuite sur la droite graduée.</p></article>`;
  return `<article class="carte-cours-droite">${entete(6, "Changer d’échelle")}
    ${rendreDroiteCoursAnnotee({ depart: [70, 1], pas: [1, 1], intervalles: 7, etiquettes: [0, 5], point: { nom: "P", indice: 3, position: "dessus" } }, [{ type: "intervalles", debut: 0, fin: 5 }, { type: "sauts", debut: 0, fin: 3, texte: "+ 1" }, { type: "valeurs", elements: [{ indice: 0, texte: "70" }, { indice: 1, texte: "71" }, { indice: 2, texte: "72" }, { indice: 3, texte: "73" }] }])}
    <p>De 70 à 75, l’écart vaut <strong>75 − 70 = 5</strong>. Il y a 5 intervalles : le pas vaut <strong>5 ÷ 5 = 1</strong>.</p>
    <p>Le zéro n’est pas dessiné, mais les deux valeurs connues suffisent. Depuis 70, je fais 3 sauts de 1 : <strong>P a pour abscisse 73</strong>.</p>
    <p class="definition-cours"><strong>Mon contrôle :</strong> sens → écart → intervalles → pas → position.</p></article>`;
}

function rendreCoursDroiteGraduee() {
  if (!etat.coursOuvert) return "";
  const titres = ["Vocabulaire", "Le pas", "Lire", "Placer", "Fractions", "Changer d’échelle"];
  const total = nombrePagesCours();
  const derniere = pageCoursCourante === total - 1;
  const pied = `<nav class="navigation-cours" aria-label="Navigation dans le cours">
    <button class="bouton-secondaire" type="button" data-action="cours-precedent" ${pageCoursCourante === 0 ? "disabled" : ""}>Précédent</button>
    <div class="points-cours" aria-label="Page ${pageCoursCourante + 1} sur ${total}">${Array.from({ length: total }, (_, page) => `<span class="${page === pageCoursCourante ? "actif" : ""}"></span>`).join("")}</div>
    <button class="bouton-principal" type="button" data-action="${derniere ? "fermer-cours" : "cours-suivant"}">${derniere ? "J’ai compris" : "Suivant"}</button>
  </nav>`;
  return rendreCadrePanneau({ type: "cours", surtitre: `Cours · ${pageCoursCourante + 1} / ${total}`, titre: titres[pageCoursCourante], contenu: `<div class="cours-une-carte">${carteCoursDroite(pageCoursCourante)}</div>`, pied, classes: "panneau-droite-graduee" });
}

function cibleRepereQuestion(question) {
  const bloc = blocRepereCartesien(question);
  if (!bloc) return null;
  if (question.classement.notion === NOTION_PLACER_POINT_REPERE) {
    const coordonnees = decoderCoordonnee(question.reponse.attendus[0]);
    return coordonnees ? { nom: bloc.nomPoint, ...coordonnees } : null;
  }
  return bloc.points?.find((point) => point.nom === bloc.nomPoint) ?? null;
}

function pointChoisiRepere(question) {
  const bloc = blocRepereCartesien(question);
  const id = etat.selection[0];
  if (!bloc || !id) return null;
  if (familleQuestion(question) === FAMILLE_IDENTIFIER_POINT) {
    return bloc.points?.find((point) => `point-${point.nom.toLowerCase()}` === id) ?? null;
  }
  if (familleQuestion(question) === FAMILLE_DIAGNOSTIC_COORDONNEES) {
    const cible = cibleRepereQuestion(question);
    if (!cible) return null;
    const variantes = {
      correct: { x: cible.x, y: cible.y },
      inversion: { x: cible.y, y: cible.x },
      "signe-abscisse": { x: -cible.x, y: cible.y },
      "signe-ordonnee": { x: cible.x, y: -cible.y },
    };
    return variantes[id] ? { nom: cible.nom, ...variantes[id] } : null;
  }
  const coordonnees = decoderCoordonnee(id);
  return coordonnees ? { nom: bloc.nomPoint, ...coordonnees } : null;
}

function optionsPointsRepere(question, {
  correction = false,
  attenduVisible = false,
} = {}) {
  const bloc = blocRepereCartesien(question);
  const cible = cibleRepereQuestion(question);
  const choisi = pointChoisiRepere(question);
  if (!bloc) return [];
  if (question.classement.notion === NOTION_LIRE_COORDONNEES_POINT) {
    if (familleQuestion(question) !== FAMILLE_IDENTIFIER_POINT || !correction) {
      return (bloc.points ?? []).map((point) => ({ ...point, role: "donne" }));
    }
    return (bloc.points ?? []).map((point) => ({
      ...point,
      role: point.nom === cible?.nom
        ? "attendu"
        : point.nom === choisi?.nom && point.nom !== cible?.nom
          ? "choisi"
          : "donne",
    }));
  }
  const points = [];
  if (choisi && (!attenduVisible || choisi.x !== cible?.x || choisi.y !== cible?.y)) {
    // Le nom est interne puisque le point choisi n'affiche pas de lettre. Il
    // doit néanmoins rester distinct de celui de la cible pour respecter le
    // contrat accessible de l'objet repère, y compris lorsque la cible est P.
    const nomInterne = cible?.nom === "P" ? "Q" : "P";
    points.push({ nom: nomInterne, x: choisi.x, y: choisi.y, role: correction ? "choisi" : "donne", afficherNom: false });
  }
  if (cible && attenduVisible) points.push({ ...cible, role: "attendu" });
  return points;
}

function donneesGeometrieRepereAide(bloc, dessin, mode) {
  const geometrie = dessin.geometrie;
  return `data-mode="${mode}" data-x-min="${bloc.xMin}" data-x-max="${bloc.xMax}" `
    + `data-y-min="${bloc.yMin}" data-y-max="${bloc.yMax}" data-pas="${bloc.pas ?? 1}" `
    + `style="left:${100 * geometrie.xGauche / dessin.largeur}%;top:${100 * geometrie.yHaut / dessin.hauteur}%;`
    + `width:${100 * (geometrie.xDroite - geometrie.xGauche) / dessin.largeur}%;`
    + `height:${100 * (geometrie.yBas - geometrie.yHaut) / dessin.hauteur}%"`;
}

function rendreInteractionAideRepere(bloc, dessin, interactionAide) {
  if (!interactionAide) return "";
  const geometrie = dessin.geometrie;
  const surface = (mode, libelle) => `<button class="surface-interaction-repere-aide" type="button"
    data-action="repere-aide-surface" ${donneesGeometrieRepereAide(bloc, dessin, mode)}
    aria-label="${echapper(libelle)}"></button>`;

  if (interactionAide.type === "axes") {
    const boutonAxe = (axe) => {
      const abscisses = axe === "abscisses";
      const prioritaire = interactionAide.axeAttendu === axe ? " prioritaire" : "";
      const style = abscisses
        ? `left:${100 * geometrie.xGauche / dessin.largeur}%;top:${100 * geometrie.yAxe / dessin.hauteur}%;width:${100 * (geometrie.xDroite - geometrie.xGauche) / dessin.largeur}%;height:44px;transform:translateY(-50%)`
        : `left:${100 * geometrie.xAxe / dessin.largeur}%;top:${100 * geometrie.yHaut / dessin.hauteur}%;width:44px;height:${100 * (geometrie.yBas - geometrie.yHaut) / dessin.hauteur}%;transform:translateX(-50%)`;
      return `<button class="cible-axe-repere-aide${prioritaire}" type="button"
        data-action="repere-aide-axe" data-axe="${axe}"
        aria-label="Axe ${abscisses ? "horizontal" : "vertical"}" style="${style}"></button>`;
    };
    return surface("axes", "Repère interactif : choisis l'axe demandé")
      + boutonAxe("abscisses") + boutonAxe("ordonnees");
  }

  if (interactionAide.type === "graduations") {
    return surface(
      "graduations",
      "Repère interactif : touche la graduation demandée ou utilise les flèches puis Entrée",
    );
  }

  if (interactionAide.type === "intersection") {
    return surface("intersection", "Repère interactif : place le point à l'intersection des deux directions");
  }

  if (interactionAide.type === "points") {
    return (bloc.points ?? []).map((point) => {
      const position = positionDansRepere(point.x, point.y, geometrie);
      return `<button class="cible-point-repere cible-point-aide" type="button"
        data-action="repere-aide-point" data-id="${echapper(point.nom)}"
        aria-label="Choisir le point ${echapper(point.nom)}"
        style="left:${100 * position.x / dessin.largeur}%;top:${100 * position.y / dessin.hauteur}%"></button>`;
    }).join("");
  }
  return "";
}

function rendreRepereV2(bloc, {
  question = null,
  interactive = false,
  identification = false,
  correction = false,
  attenduVisible = false,
  points = null,
  guides = [],
  cheminPlacement = null,
  classe = "",
  description = "Repère orthogonal gradué de 1 en 1",
  afficherNomsAxes = true,
  afficherLegendesAxes = false,
  axesMisesEnEvidence = [],
  mettreOrigineEnEvidence = false,
  interactionAide = null,
} = {}) {
  const pointsAffiches = points ?? (question
    ? optionsPointsRepere(question, { correction, attenduVisible })
    : []);
  const rendreVersion = (largeur, version) => {
    const dessin = dessinerRepereCartesien({
      xMin: bloc.xMin,
      xMax: bloc.xMax,
      yMin: bloc.yMin,
      yMax: bloc.yMax,
      pas: bloc.pas ?? 1,
      largeur,
      points: pointsAffiches,
      guides,
      cheminPlacement,
      afficherNomsAxes,
      afficherLegendesAxes,
      axesMisesEnEvidence,
      mettreOrigineEnEvidence,
      description,
    });
    const commandesIdentification = identification && question
      ? (bloc.points ?? []).map((point) => {
        const position = positionDansRepere(point.x, point.y, dessin.geometrie);
        const selectionne = etat.selection.includes(`point-${point.nom.toLowerCase()}`);
        return `<button class="cible-point-repere ${selectionne ? "selectionnee" : ""}" type="button"
          data-action="choix" data-id="point-${point.nom.toLowerCase()}" role="radio"
          aria-checked="${selectionne}" aria-label="Choisir le point ${point.nom}"
          style="left:${100 * position.x / dessin.largeur}%;top:${100 * position.y / dessin.hauteur}%"></button>`;
      }).join("")
      : "";
    const surfacePlacement = interactive && question
      ? `<button class="surface-placement-repere" type="button" data-action="placer-repere"
          data-x-min="${bloc.xMin}" data-x-max="${bloc.xMax}"
          data-y-min="${bloc.yMin}" data-y-max="${bloc.yMax}"
          data-pas="${bloc.pas ?? 1}"
          aria-label="Zone de placement. Touchez une intersection ou utilisez les quatre flèches du clavier."
          style="left:${100 * dessin.geometrie.xGauche / dessin.largeur}%;top:${100 * dessin.geometrie.yHaut / dessin.hauteur}%;width:${100 * (dessin.geometrie.xDroite - dessin.geometrie.xGauche) / dessin.largeur}%;height:${100 * (dessin.geometrie.yBas - dessin.geometrie.yHaut) / dessin.hauteur}%"></button>`
      : "";
    const commandesAide = rendreInteractionAideRepere(bloc, dessin, interactionAide);
    return `<div class="repere-version-${version}">${dessin.svg}${commandesIdentification}${surfacePlacement}${commandesAide}</div>`;
  };
  return `<div class="repere-cartesien-v2 ${classe}" role="${interactive || identification || interactionAide ? "group" : "img"}"
    aria-label="${interactionAide ? "Aide interactive dans le repère" : interactive ? "Place le point dans le repère" : identification ? "Choisis un point du repère" : "Repère orthogonal"}">
    ${rendreVersion(680, "large")}${rendreVersion(320, "mobile")}
  </div>`;
}

function rendreSaisieCoupleRepere(question, cible) {
  const valeurs = estEntrainement()
    ? etat.saisies
    : etat.reponseRevelee
      ? [formaterEntierRepere(cible.x), formaterEntierRepere(cible.y)]
      : ["", ""];
  const champ = (index, nom) => estEntrainement()
    ? `<button class="champ-coordonnee ${etat.champSaisieActif === index ? "actif" : ""} ${valeurs[index] ? "rempli" : ""}"
        type="button" data-action="champ-reponse" data-index="${index}"
        aria-label="${nom}${valeurs[index] ? ` : ${echapper(valeurs[index])}` : ", case vide"}">${echapper(valeurs[index] || "…")}</button>`
    : `<output class="champ-coordonnee ${valeurs[index] ? "rempli" : ""}">${echapper(valeurs[index] || "?")}</output>`;
  return `<section class="saisie-couple-repere" aria-label="Coordonnées du point ${echapper(cible.nom)}">
    <span class="nom-couple">${echapper(cible.nom)}(</span>${champ(0, "Abscisse")}<span class="separateur-couple">;</span>${champ(1, "Ordonnée")}<span class="nom-couple">)</span>
    ${estEntrainement() && etat.validation === null ? `<p class="indication-clavier-physique">Choisis une case · chiffres${question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX ? " · virgule" : ""} · signe moins · Entrée pour valider</p>` : ""}
  </section>`;
}

function rendreSaisieCoordonneeSeule(question, cible, axe) {
  const attendu = axe === "abscisse" ? cible.x : cible.y;
  const valeur = estEntrainement()
    ? etat.saisie
    : etat.reponseRevelee
      ? formaterEntierRepere(attendu)
      : "";
  const symbole = axe === "abscisse" ? "x" : "y";
  const formulationSymbolique = texteBloc(question, "formulation")
    === FORMULATION_COORDONNEE_SYMBOLIQUE;
  const libelle = formulationSymbolique
    ? `<span class="libelle-saisie-droite"><i class="variable-mathematique">${symbole}</i><sub>${echapper(cible.nom)}</sub> =</span>`
    : '<span class="libelle-reponse-coordonnee">Réponse :</span>';
  return `<section class="saisie-numerique saisie-coordonnee-seule" aria-label="${axe}">
    ${libelle}
    <output class="afficheur-reponse ${valeur ? "rempli" : ""}">${echapper(valeur || (estEntrainement() ? "…" : "?"))}</output>
    ${estEntrainement() && etat.validation === null ? '<p class="indication-clavier-physique">Chiffres · signe moins si nécessaire · Entrée pour valider</p>' : ""}
  </section>`;
}

function rendreQuestionReperagePlan() {
  const question = questionCourante(etat);
  const bloc = blocRepereCartesien(question);
  const cible = cibleRepereQuestion(question);
  const famille = familleQuestion(question);
  const placement = famille === FAMILLE_PLACER_POINT_REPERE;
  const identification = famille === FAMILLE_IDENTIFIER_POINT;
  const qcm = famille === FAMILLE_DIAGNOSTIC_COORDONNEES;
  const validationTerminee = estEntrainement() && etat.validation !== null;
  const attenduVisible = (!estEntrainement() && etat.reponseRevelee)
    || (validationTerminee && placement);
  const repere = rendreRepereV2(bloc, {
    question,
    interactive: placement && estEntrainement() && etat.validation === null,
    identification: identification && estEntrainement() && etat.validation === null,
    correction: validationTerminee,
    attenduVisible,
    description: placement
      ? "Repère orthogonal vide dans lequel placer un point"
      : `Repère orthogonal avec ${bloc.points?.length ?? 0} point${(bloc.points?.length ?? 0) > 1 ? "s" : ""} nommé${(bloc.points?.length ?? 0) > 1 ? "s" : ""}`,
  });
  let zoneReponse = "";
  if (placement) {
    zoneReponse = `<p class="precision precision-placement-repere">${estEntrainement()
      ? etat.selection.length > 0 && etat.validation === null
        ? "Point placé — tu peux le déplacer avant de valider."
        : "Touche une intersection : le point s'y aimante. Tu peux le déplacer avant de valider."
      : "Indiquez l'intersection choisie."}</p>`;
  } else if (identification) {
    zoneReponse = estEntrainement()
      ? '<p class="precision">Touche directement le point ou sa lettre.</p>'
      : etat.reponseRevelee
        ? `<p class="reponse-tableau-repere">Réponse : <strong>${echapper(cible.nom)}</strong></p>`
        : '<p class="precision">Quel point choisissez-vous ?</p>';
  } else if (qcm) {
    zoneReponse = `<div class="grille-choix grille-qcm-repere" role="radiogroup">${rendreChoix(question)}</div>`;
  } else if (famille === FAMILLE_LIRE_ABSCISSE_REPERE) {
    zoneReponse = rendreSaisieCoordonneeSeule(question, cible, "abscisse");
  } else if (famille === FAMILLE_LIRE_ORDONNEE) {
    zoneReponse = rendreSaisieCoordonneeSeule(question, cible, "ordonnée");
  } else {
    zoneReponse = rendreSaisieCoupleRepere(question, cible);
  }
  const carte = `<main class="carte-question carte-question-repere famille-${echapper(famille)}">
    <p class="etiquette-notion">${echapper(nomNotion())}</p>
    <h1>${echapper(texteBloc(question, "consigne"))}</h1>
    ${repere}${zoneReponse}
    ${estEntrainement() ? rendreZoneRetour() : '<div class="zone-retour" aria-hidden="true"></div>'}
  </main>`;
  return rendreCoqueLecteur(question, carte);
}

function titresAideRepere(famille, nombreEtapes) {
  const titres = famille === FAMILLE_PLACER_POINT_REPERE
    ? ["Repérer l'abscisse", "Repérer l'ordonnée", "Placer le point"]
    : famille === FAMILLE_IDENTIFIER_POINT
      ? ["Repérer l'abscisse", "Repérer l'ordonnée", "Identifier le point"]
      : famille === FAMILLE_LIRE_ABSCISSE_REPERE
        ? ["Identifier l'axe", "Projeter et lire"]
        : famille === FAMILLE_LIRE_ORDONNEE
          ? ["Identifier l'axe", "Projeter et lire"]
          : ["Lire l'abscisse", "Lire l'ordonnée", "Écrire les coordonnées"];
  return titres.slice(0, nombreEtapes);
}

function visuelAideRepere(question, cible, etape) {
  const famille = familleQuestion(question);
  const placement = famille === FAMILLE_PLACER_POINT_REPERE;
  const identification = famille === FAMILLE_IDENTIFIER_POINT;
  let guides = [];
  let cheminPlacement = null;
  let mettreOrigineEnEvidence = false;
  let points = placement ? [] : (blocRepereCartesien(question).points ?? [])
    .map((point) => ({ ...point, role: "donne" }));
  if (placement) {
    mettreOrigineEnEvidence = etape === 0;
    if (etape < 2 && etat.pointRepereAide) {
      points = [{ nom: "P", ...etat.pointRepereAide, role: "choisi", afficherNom: false }];
    }
    if (etape >= 1) {
      cheminPlacement = { x: cible.x, y: cible.y, etape: "horizontal" };
    }
    if (etape >= 2) {
      cheminPlacement = { x: cible.x, y: cible.y, etape: "complet" };
      const choisi = pointChoisiRepere(question) ?? etat.pointRepereAide;
      if (choisi) points = [{ nom: "P", ...choisi, role: "choisi", afficherNom: false }];
    }
  } else if (identification) {
    if (etape < 2 && etat.pointRepereAide) {
      points = [
        ...(blocRepereCartesien(question).points ?? []).map((point) => ({ ...point, role: "donne" })),
        { nom: "Z", ...etat.pointRepereAide, role: "choisi", afficherNom: false },
      ];
    }
    if (etape >= 1) cheminPlacement = { x: cible.x, y: cible.y, etape: "horizontal" };
    if (etape >= 2) cheminPlacement = { x: cible.x, y: cible.y, etape: "complet" };
  } else if (famille === FAMILLE_LIRE_ABSCISSE_REPERE) {
    if (etape >= 1) guides = [{ x: cible.x, y: cible.y, axe: "abscisses" }];
  } else if (famille === FAMILLE_LIRE_ORDONNEE) {
    if (etape >= 1) guides = [{ x: cible.x, y: cible.y, axe: "ordonnees" }];
  } else {
    if (etape >= 1) guides.push({ x: cible.x, y: cible.y, axe: "abscisses" });
    if (etape >= 2) guides.push({ x: cible.x, y: cible.y, axe: "ordonnees" });
  }
  return {
    points,
    guides,
    cheminPlacement,
    mettreOrigineEnEvidence,
  };
}

function interactionPourAideRepere(famille, etape) {
  if (etat.repereAideTerminee) return null;
  if (famille === FAMILLE_PLACER_POINT_REPERE) {
    if (etape === 0) return { type: "graduations", axeAttendu: "abscisses" };
    if (etape === 1) return { type: "graduations", axeAttendu: "ordonnees" };
    return { type: "intersection" };
  }
  if (famille === FAMILLE_IDENTIFIER_POINT) {
    if (etape === 0) return { type: "graduations", axeAttendu: "abscisses" };
    if (etape === 1) return { type: "graduations", axeAttendu: "ordonnees" };
    return { type: "points" };
  }
  if (famille === FAMILLE_LIRE_ABSCISSE_REPERE && etape === 0) {
    return { type: "axes", axeAttendu: "abscisses" };
  }
  if (famille === FAMILLE_LIRE_ORDONNEE && etape === 0) {
    return { type: "axes", axeAttendu: "ordonnees" };
  }
  if ([FAMILLE_LIRE_COORDONNEES, FAMILLE_DIAGNOSTIC_COORDONNEES].includes(famille)) {
    if (etape === 0) return { type: "axes", axeAttendu: "abscisses" };
    if (etape === 1) return { type: "axes", axeAttendu: "ordonnees" };
  }
  return null;
}

function rendreIndiceEchelleRepere(pas) {
  if (pas === 1) return "";
  const niveau = etat.niveauEchelleRepereAide;
  if (niveau === 0) {
    return '<button class="bouton-secondaire bouton-echelle-repere" type="button" data-action="repere-aide-echelle">M’aider à lire les graduations</button>';
  }
  const contenu = niveau === 1
    ? "Compare deux graduations chiffrées : quel écart lis-tu entre elles ?"
    : niveau === 2
      ? "Compte les petits intervalles entre ces deux valeurs, puis partage l'écart."
      : `Dernier indice : une petite graduation vaut ${formaterEntierRepere(pas)}.`;
  const suite = niveau < 3
    ? '<button class="bouton-secondaire bouton-echelle-repere" type="button" data-action="repere-aide-echelle">Encore un indice sur l’échelle</button>'
    : "";
  return `<div class="aide-echelle-repere" data-niveau-echelle="${niveau}"><p><strong>Échelle :</strong> ${echapper(contenu)}</p>${suite}</div>`;
}

function rendreRegleCoordonneesAide(famille, cible, etape) {
  if (
    etape !== 2
    || ![FAMILLE_LIRE_COORDONNEES, FAMILLE_DIAGNOSTIC_COORDONNEES].includes(famille)
  ) return "";
  return `<p class="regle-coordonnees-aide"><strong>${echapper(cible.nom)}(</strong><span class="coord-abscisse">abscisse</span> ; <span class="coord-ordonnee">ordonnée</span><strong>)</strong><span>1<sup>re</sup> coordonnée : abscisse ; 2<sup>e</sup> coordonnée : ordonnée.</span></p>`;
}

function rendreAideReperagePlan(question) {
  if (!etat.aideOuverte) return "";
  const bloc = blocRepereCartesien(question);
  const cible = cibleRepereQuestion(question);
  const famille = familleQuestion(question);
  const placement = famille === FAMILLE_PLACER_POINT_REPERE;
  const etapeMaximum = Math.max(0, question.aide.blocs.length - 1);
  const etape = Math.max(0, Math.min(etapeMaximum, Number(etat.repereAide ?? 0)));
  const titres = titresAideRepere(famille, question.aide.blocs.length);
  const configurationVisuelle = visuelAideRepere(question, cible, etape);
  const interactionAide = interactionPourAideRepere(famille, etape);
  const visualisation = rendreRepereV2(bloc, {
    ...configurationVisuelle,
    interactionAide,
    classe: "repere-aide",
    description: `Guide visuel, étape ${etape + 1} sur ${etapeMaximum + 1}`,
  });
  const blocAide = question.aide.blocs[etape];
  const pas = bloc.pas ?? 1;
  const rappelPas = rendreIndiceEchelleRepere(pas);
  const progression = `<ol class="progression-aide-repere aide-repere-${titres.length}" aria-label="Étapes de l'aide">
    ${titres.map((titre, index) => {
      const terminee = etat.repereAideTerminee || index < etape;
      const active = !etat.repereAideTerminee && index === etape;
      return `<li class="etape-progression-aide ${terminee ? "terminee" : ""} ${active ? "actif" : ""}"${active ? ' aria-current="step"' : ""}>
        <span>${terminee ? "✓" : index + 1}</span><span>${echapper(titre)}</span></li>`;
    }).join("")}
  </ol>`;
  const retour = etat.retourRepereAide
    ? `<p class="retour-interaction-repere retour-${etat.retourRepereAide.type}" role="status">${echapper(etat.retourRepereAide.message)}</p>`
    : "";
  const titrePanneau = placement
    ? "Construire la position du point"
    : famille === FAMILLE_LIRE_ABSCISSE_REPERE
      ? "Lire l'abscisse d'un point"
      : famille === FAMILLE_LIRE_ORDONNEE
        ? "Lire l'ordonnée d'un point"
        : famille === FAMILLE_IDENTIFIER_POINT
          ? "Identifier un point par ses coordonnées"
          : "Lire les coordonnées d'un point";
  return rendreCadrePanneau({
    type: "aide",
    surtitre: `Méthode en ${titres.length} étapes`,
    titre: titrePanneau,
    contenu: `${progression}${visualisation}<article class="contenu-etape-aide-repere" aria-live="polite"><p>${echapper(blocAide.contenu)}</p>${retour}${rappelPas}${rendreRegleCoordonneesAide(famille, cible, etape)}</article>${rendreAccesCoursDepuisAide()}`,
    classes: "panneau-reperage-plan",
  });
}

function coordonneesSurfaceRepereAide(cible, evenement) {
  const rectangle = cible.getBoundingClientRect();
  if (!(rectangle.width > 0) || !(rectangle.height > 0)) return null;
  const xMin = Number(cible.dataset.xMin);
  const xMax = Number(cible.dataset.xMax);
  const yMin = Number(cible.dataset.yMin);
  const yMax = Number(cible.dataset.yMax);
  const pas = Number(cible.dataset.pas) || 1;
  const proportionX = Math.max(0, Math.min(1, (evenement.clientX - rectangle.left) / rectangle.width));
  const proportionY = Math.max(0, Math.min(1, (evenement.clientY - rectangle.top) / rectangle.height));
  const nombreX = Math.round((xMax - xMin) / pas);
  const nombreY = Math.round((yMax - yMin) / pas);
  const nettoyer = (valeur) => Number(valeur.toFixed(10));
  return {
    x: nettoyer(xMin + Math.round(proportionX * nombreX) * pas),
    y: nettoyer(yMax - Math.round(proportionY * nombreY) * pas),
    proportionX,
    proportionY,
    rectangle,
    xMin,
    xMax,
    yMin,
    yMax,
    pas,
  };
}

function valeursEgalesRepere(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-9;
}

function definirRetourRepereAide(type, message, changement = {}) {
  actualiserInteractionRepereAide(etat, {
    ...changement,
    retour: { type, message },
  });
}

function axeAttenduAideRepere(question, etape = Number(etat.repereAide ?? 0)) {
  const famille = familleQuestion(question);
  if (famille === FAMILLE_LIRE_ABSCISSE_REPERE) return "abscisses";
  if (famille === FAMILLE_LIRE_ORDONNEE) return "ordonnees";
  if (
    [
      FAMILLE_LIRE_COORDONNEES,
      FAMILLE_DIAGNOSTIC_COORDONNEES,
      FAMILLE_IDENTIFIER_POINT,
      FAMILLE_PLACER_POINT_REPERE,
    ].includes(famille)
  ) return etape === 0 ? "abscisses" : "ordonnees";
  return null;
}

function retourMauvaisAxeRepere(axeAttendu) {
  return axeAttendu === "abscisses"
    ? "Tu as choisi l'axe des ordonnées. L'abscisse se lit sur l'axe horizontal."
    : "Tu as choisi l'axe des abscisses. L'ordonnée se lit sur l'axe vertical.";
}

function traiterAxeRepereAide(axe) {
  const question = questionCourante(etat);
  const etape = Number(etat.repereAide ?? 0);
  const attendu = axeAttenduAideRepere(question, etape);
  if (!question || !attendu || axe !== attendu) {
    definirRetourRepereAide("erreur", retourMauvaisAxeRepere(attendu));
    return false;
  }
  const abscisses = attendu === "abscisses";
  definirRetourRepereAide(
    "reussite",
    abscisses
      ? "Oui : c'est l'axe des abscisses. La projection verticale apparaît."
      : "Oui : c'est l'axe des ordonnées. La projection horizontale apparaît.",
    { etape: etape + 1 },
  );
  return true;
}

function traiterGraduationRepereAide(axe, valeur) {
  const question = questionCourante(etat);
  const cible = question ? cibleRepereQuestion(question) : null;
  const etape = Number(etat.repereAide ?? 0);
  const attendu = axeAttenduAideRepere(question, etape);
  if (!question || !cible || !attendu) return false;
  if (axe !== attendu) {
    definirRetourRepereAide("erreur", retourMauvaisAxeRepere(attendu));
    return false;
  }
  const abscisses = attendu === "abscisses";
  const valeurAttendue = abscisses ? cible.x : cible.y;
  const pointEssai = abscisses ? { x: valeur, y: 0 } : { x: 0, y: valeur };
  if (!valeursEgalesRepere(valeur, valeurAttendue)) {
    if ((blocRepereCartesien(question)?.pas ?? 1) < 1) avancerEchelleRepereAide(etat);
    definirRetourRepereAide(
      "erreur",
      `Ce n'est pas encore ${abscisses ? "l'abscisse" : "l'ordonnée"} demandée.`,
      { point: pointEssai },
    );
    return false;
  }
  const famille = familleQuestion(question);
  const etapeSuivante = Math.min(question.aide.blocs.length - 1, etape + 1);
  const messageNul = valeursEgalesRepere(valeurAttendue, 0)
    ? abscisses
      ? " L'abscisse est à O : le déplacement horizontal est nul."
      : " L'ordonnée est à O : le déplacement vertical est nul."
    : "";
  definirRetourRepereAide(
    "reussite",
    `${abscisses ? "Bonne abscisse" : "Bonne ordonnée"}.${messageNul}`,
    {
      etape: etapeSuivante,
      point: famille === FAMILLE_PLACER_POINT_REPERE || famille === FAMILLE_IDENTIFIER_POINT
        ? null
        : pointEssai,
    },
  );
  return true;
}

function traiterIntersectionRepereAide(x, y) {
  const question = questionCourante(etat);
  const cible = question ? cibleRepereQuestion(question) : null;
  if (!question || !cible || familleQuestion(question) !== FAMILLE_PLACER_POINT_REPERE) return false;
  const point = { x, y };
  basculerChoix(etat, encoderCoordonnee(x, y));
  if (!valeursEgalesRepere(x, cible.x) || !valeursEgalesRepere(y, cible.y)) {
    definirRetourRepereAide(
      "erreur",
      "Ce point n'est pas encore à l'intersection des deux directions.",
      { point },
    );
    return false;
  }
  definirRetourRepereAide(
    "reussite",
    "Oui : le point est à l'intersection des deux directions. Retourne à la question pour valider ton placement.",
    { point, terminee: true },
  );
  return true;
}

function traiterPointRepereAide(nom) {
  const question = questionCourante(etat);
  const cible = question ? cibleRepereQuestion(question) : null;
  if (!question || !cible || familleQuestion(question) !== FAMILLE_IDENTIFIER_POINT) return false;
  const identifiant = `point-${String(nom).toLowerCase()}`;
  basculerChoix(etat, identifiant);
  if (nom !== cible.nom) {
    definirRetourRepereAide("erreur", "Ce point n'est pas à l'intersection des deux guides.");
    return false;
  }
  definirRetourRepereAide(
    "reussite",
    "Oui : les deux guides se rencontrent sur ce point. Retourne à la question pour valider ton choix.",
    { terminee: true },
  );
  return true;
}

function traiterSurfaceRepereAide(cible, evenement) {
  const donnees = coordonneesSurfaceRepereAide(cible, evenement);
  if (!donnees) return false;
  if (cible.dataset.mode === "axes") {
    definirRetourRepereAide("information", "Clique directement sur l'un des deux axes.");
    return false;
  }
  if (cible.dataset.mode === "intersection") {
    return traiterIntersectionRepereAide(donnees.x, donnees.y);
  }
  if (cible.dataset.mode !== "graduations") return false;
  const question = questionCourante(etat);
  const axeAttendu = axeAttenduAideRepere(question);
  const xAxe = (0 - donnees.xMin) / (donnees.xMax - donnees.xMin);
  const yAxe = (donnees.yMax - 0) / (donnees.yMax - donnees.yMin);
  const distanceAxeOrd = Math.abs(donnees.proportionX - xAxe) * donnees.rectangle.width;
  const distanceAxeAbs = Math.abs(donnees.proportionY - yAxe) * donnees.rectangle.height;
  const seuil = 28;
  let axe = null;
  if (distanceAxeAbs <= seuil && distanceAxeOrd <= seuil) axe = axeAttendu;
  else if (distanceAxeAbs <= seuil) axe = "abscisses";
  else if (distanceAxeOrd <= seuil) axe = "ordonnees";
  if (!axe) {
    definirRetourRepereAide("information", "Clique directement sur une graduation de l'un des deux axes.");
    return false;
  }
  return traiterGraduationRepereAide(
    axe,
    axe === "abscisses" ? donnees.x : donnees.y,
  );
}

function guidesCorrectionRepere(question, cible) {
  if (familleQuestion(question) === FAMILLE_LIRE_ABSCISSE_REPERE) {
    return [{ x: cible.x, y: cible.y, axe: "abscisses" }];
  }
  if (familleQuestion(question) === FAMILLE_LIRE_ORDONNEE) {
    return [{ x: cible.x, y: cible.y, axe: "ordonnees" }];
  }
  return [
    { x: cible.x, y: cible.y, axe: "abscisses" },
    { x: cible.x, y: cible.y, axe: "ordonnees" },
  ];
}

function rendreCorrectionReperagePlan(question) {
  if (!etat.correctionOuverte) return "";
  const bloc = blocRepereCartesien(question);
  const cible = cibleRepereQuestion(question);
  const placement = familleQuestion(question) === FAMILLE_PLACER_POINT_REPERE;
  const diagnostic = diagnosticErreurReperagePlan();
  const schema = rendreRepereV2(bloc, {
    question,
    correction: true,
    attenduVisible: placement,
    guides: placement ? [] : guidesCorrectionRepere(question, cible),
    cheminPlacement: placement ? { x: cible.x, y: cible.y, etape: "complet" } : null,
    classe: "repere-correction",
    description: placement
      ? "Correction avec le point choisi et le point attendu"
      : "Correction de la lecture des coordonnées",
  });
  const legende = placement ? `<div class="legende-correction-repere">
    ${etat.selection.length > 0 && !etat.validation?.juste ? '<span class="legende-point-choisi"><i class="echantillon-point-correction echantillon-point-choisi" aria-hidden="true">×</i>Ton point (cercle pointillé)</span>' : ""}
    <span class="legende-point-attendu"><i class="echantillon-point-correction echantillon-point-attendu" aria-hidden="true">×</i>Point attendu</span>
  </div>` : "";
  const explication = question.correction.map((element) => `<p>${echapper(element.contenu)}</p>`).join("");
  return rendreCadrePanneau({
    type: "correction",
    surtitre: diagnostic ? `Diagnostic ${diagnostic.code}` : "Après la réponse",
    titre: diagnostic ? "Comprendre l'erreur" : "Correction expliquée",
    contenu: `${rendreReponseEleve(question)}${schema}${legende}${diagnostic ? `<p class="diagnostic-repere"><strong>${echapper(diagnostic.message)}</strong></p>` : ""}<div class="methode-repere">${explication}</div><p class="titre-reponse-correcte">Réponse correcte</p>${rendreReponseCorrecte(question)}`,
    classes: "panneau-reperage-plan",
  });
}

function blocCoursRepere(bornes = {}) {
  return {
    xMin: bornes.xMin ?? -4,
    xMax: bornes.xMax ?? 4,
    yMin: bornes.yMin ?? -3,
    yMax: bornes.yMax ?? 3,
    pas: bornes.pas ?? 1,
  };
}

function coupleColoreRepere(nom, x, y) {
  return `<strong class="couple-colore-repere">${echapper(nom)}(<span class="coord-abscisse">${echapper(formaterEntierRepere(x))}</span> ; <span class="coord-ordonnee">${echapper(formaterEntierRepere(y))}</span>)</strong>`;
}

function commandesEtapesCoursRepere(etapes) {
  return `<nav class="commandes-etapes-cours-repere etapes-cours-repere-${etapes.length}" aria-label="Étapes de la démonstration">
    ${etapes.map((titre, index) => `<button type="button" data-action="cours-repere-etape" data-value="${index}"
      class="${index === etapeCoursRepere ? "actif" : ""}" aria-pressed="${index === etapeCoursRepere}">
      <span>${index + 1}</span>${echapper(titre)}</button>`).join("")}
  </nav>`;
}

function carteCoursAxesRepere() {
  return `<article class="carte-cours-repere"><header class="entete-cours-repere"><span class="numero-page-cours-repere">Page 1</span><h3>Vocabulaire du repère</h3></header>
    ${rendreRepereV2(blocCoursRepere(), {
      afficherLegendesAxes: true,
      axesMisesEnEvidence: ["abscisses", "ordonnees"],
      classe: "repere-cours-axes",
      description: "Vocabulaire du repère : axe des abscisses orange, axe des ordonnées turquoise, origine O et graduations",
    })}
    <div class="lexique-repere lexique-repere-colore">
      <p class="coord-abscisse"><strong>Axe des abscisses</strong><span>l'axe horizontal</span></p>
      <p class="coord-ordonnee"><strong>Axe des ordonnées</strong><span>l'axe vertical</span></p>
      <p><strong>Origine O</strong><span>le croisement des deux axes</span></p>
      <p><strong>Graduations</strong><span>les petits traits régulièrement espacés</span></p>
    </div>
  </article>`;
}

function carteCoursLireRepere() {
  const etape = Math.max(0, Math.min(2, etapeCoursRepere));
  const guides = etape === 0
    ? [{ x: -3, y: 2, axe: "abscisses" }]
    : etape === 1
      ? [{ x: -3, y: 2, axe: "ordonnees" }]
      : [
        { x: -3, y: 2, axe: "abscisses" },
        { x: -3, y: 2, axe: "ordonnees" },
      ];
  const explications = [
    `<strong class="coord-abscisse">1 — Lire l'abscisse.</strong> Je projette A verticalement sur l'axe des abscisses et je lis −3.`,
    `<strong class="coord-ordonnee">2 — Lire l'ordonnée.</strong> Je projette A horizontalement sur l'axe des ordonnées et je lis 2.`,
    `<strong>3 — Écrire les coordonnées.</strong> J'écris ${coupleColoreRepere("A", -3, 2)}.`,
  ];
  return `<article class="carte-cours-repere"><header class="entete-cours-repere"><span class="numero-page-cours-repere">Page 2</span><h3>Lire les coordonnées du point A</h3></header>
    <p class="objectif-cours-repere">Je cherche les coordonnées de <strong>A</strong>.</p>
    ${commandesEtapesCoursRepere(["Lire l'abscisse", "Lire l'ordonnée", "Écrire"])}
    ${rendreRepereV2(blocCoursRepere({ xMin: -4, xMax: 3, yMin: -3, yMax: 3 }), {
      points: [{ nom: "A", x: -3, y: 2, role: "donne" }],
      guides,
      classe: "repere-cours-etape",
      description: `Lecture du point A, étape ${etape + 1} sur 3`,
    })}
    <p class="explication-etape-cours-repere" aria-live="polite">${explications[etape]}</p>
    ${etape === 2 ? '<div class="ordre-coordonnees"><span class="coord-abscisse">1<sup>re</sup> coordonnée : <strong>abscisse</strong></span><b>;</b><span class="coord-ordonnee">2<sup>e</sup> coordonnée : <strong>ordonnée</strong></span></div>' : ""}
  </article>`;
}

function carteCoursLireAxesRepere() {
  return `<article class="carte-cours-repere"><header class="entete-cours-repere"><span class="numero-page-cours-repere">Page 3</span><h3>Lire les coordonnées d'un point sur un axe</h3></header>
    ${rendreRepereV2(blocCoursRepere({ xMin: -3, xMax: 4, yMin: -3, yMax: 2 }), {
      points: [{ nom: "C", x: 3, y: 0, role: "donne" }, { nom: "D", x: 0, y: -2, role: "donne" }],
      description: "Lecture des points C et D situés sur les axes",
    })}
    <div class="cas-axes-explicites">
      <p>${coupleColoreRepere("C", 3, 0)}<span>C est sur l'axe des abscisses : son <strong class="coord-ordonnee">ordonnée vaut 0</strong>.</span></p>
      <p>${coupleColoreRepere("D", 0, -2)}<span>D est sur l'axe des ordonnées : son <strong class="coord-abscisse">abscisse vaut 0</strong>.</span></p>
    </div>
  </article>`;
}

function carteCoursPlacerRepere() {
  const etape = Math.max(0, Math.min(3, etapeCoursRepere));
  const cheminPlacement = etape === 0
    ? null
    : { x: 2, y: -1, etape: etape === 1 ? "horizontal" : "complet" };
  const points = etape === 3 ? [{ nom: "B", x: 2, y: -1, role: "donne" }] : [];
  const explications = [
    `<strong>1 — Partir de l'origine.</strong> Je repère O avant tout déplacement.`,
    `<strong class="coord-abscisse">2 — Déplacement horizontal.</strong> Depuis O, je vais jusqu'à l'abscisse 2.`,
    `<strong class="coord-ordonnee">3 — Déplacement vertical.</strong> Depuis 2, je descends jusqu'à l'ordonnée −1.`,
    `<strong>4 — Placer le point.</strong> Je marque ${coupleColoreRepere("B", 2, -1)} à l'intersection.`,
  ];
  return `<article class="carte-cours-repere"><header class="entete-cours-repere"><span class="numero-page-cours-repere">Page 2</span><h3>Placer le point B</h3></header>
    <p class="objectif-cours-repere">Je dois placer ${coupleColoreRepere("B", 2, -1)}.</p>
    ${commandesEtapesCoursRepere(["Partir de O", "Horizontal", "Vertical", "Placer"])}
    ${rendreRepereV2(blocCoursRepere(), {
      points,
      cheminPlacement,
      mettreOrigineEnEvidence: etape === 0,
      classe: "repere-cours-etape",
      description: `Placement du point B, étape ${etape + 1} sur 4`,
    })}
    <p class="explication-etape-cours-repere" aria-live="polite">${explications[etape]}</p>
  </article>`;
}

function carteCoursPlacerAxesRepere() {
  return `<article class="carte-cours-repere"><header class="entete-cours-repere"><span class="numero-page-cours-repere">Page 3</span><h3>Placer un point sur un axe</h3></header>
    ${rendreRepereV2(blocCoursRepere({ xMin: -3, xMax: 4, yMin: -3, yMax: 2 }), {
      points: [{ nom: "C", x: 3, y: 0, role: "donne" }, { nom: "D", x: 0, y: -2, role: "donne" }],
      description: "Points C et D placés sur les axes quand une coordonnée vaut zéro",
    })}
    <div class="cas-axes-explicites">
      <p>${coupleColoreRepere("C", 3, 0)}<span>Après l'abscisse 3, aucun déplacement vertical : C reste sur l'axe des abscisses.</span></p>
      <p>${coupleColoreRepere("D", 0, -2)}<span>L'abscisse 0 laisse D sur l'axe des ordonnées ; je descends jusqu'à −2.</span></p>
    </div>
  </article>`;
}

function carteCoursReperagePlan(index) {
  if (index === 0) return carteCoursAxesRepere();
  const lecture = identifiantNotionContexte() === NOTION_LIRE_COORDONNEES_POINT;
  if (index === 1) return lecture ? carteCoursLireRepere() : carteCoursPlacerRepere();
  return lecture ? carteCoursLireAxesRepere() : carteCoursPlacerAxesRepere();
}

function rendreCoursReperagePlan() {
  if (!etat.coursOuvert) return "";
  const lecture = identifiantNotionContexte() === NOTION_LIRE_COORDONNEES_POINT;
  const titres = lecture
    ? ["Vocabulaire", "Lire les coordonnées", "Coordonnées nulles"]
    : ["Vocabulaire", "Placer un point", "Coordonnées nulles"];
  const total = nombrePagesCours();
  const derniere = pageCoursCourante === total - 1;
  const pied = `<nav class="navigation-cours" aria-label="Navigation dans le cours">
    <button class="bouton-secondaire" type="button" data-action="cours-precedent" ${pageCoursCourante === 0 ? "disabled" : ""}>Précédent</button>
    <div class="points-cours" aria-label="Page ${pageCoursCourante + 1} sur ${total}">${Array.from({ length: total }, (_, page) => `<span class="${page === pageCoursCourante ? "actif" : ""}"></span>`).join("")}</div>
    <button class="bouton-principal" type="button" data-action="${derniere ? "fermer-cours" : "cours-suivant"}">${derniere ? "J'ai compris" : "Suivant"}</button>
  </nav>`;
  return rendreCadrePanneau({
    type: "cours",
    surtitre: `Cours · ${pageCoursCourante + 1} / ${total}`,
    titre: titres[pageCoursCourante],
    contenu: `<div class="cours-une-carte">${carteCoursReperagePlan(pageCoursCourante)}</div>`,
    pied,
    classes: "panneau-reperage-plan",
  });
}

const RENDUS_COURS = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreCoursDivisibilite,
  [RENDU_CARRES]: rendreCoursCarres,
  [RENDU_FRACTIONS_DECIMAUX]: rendreCoursFractionsDecimaux,
  [RENDU_ECRITURES_MULTIPLES]: rendreCoursEcrituresMultiples,
  [RENDU_DROITE_GRADUEE]: rendreCoursDroiteGraduee,
  [RENDU_REPERAGE_PLAN]: rendreCoursReperagePlan,
  [RENDU_SOLIDE]: rendreCoursReconnaissance,
  [RENDU_VOLUME]: rendreCoursVolumes,
});

const RENDUS_AIDE = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreAideDivisibilite,
  [RENDU_CARRES]: rendreAideCarres,
  [RENDU_FRACTIONS_DECIMAUX]: rendreAideFractionsDecimaux,
  [RENDU_ECRITURES_MULTIPLES]: rendreAideEcrituresMultiples,
  [RENDU_DROITE_GRADUEE]: rendreAideDroiteGraduee,
  [RENDU_REPERAGE_PLAN]: rendreAideReperagePlan,
  [RENDU_SOLIDE]: rendreAideSolides,
  [RENDU_VOLUME]: rendreAideVolumes,
});

const RENDUS_CORRECTION = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreCorrectionDivisibilite,
  [RENDU_CARRES]: rendreCorrectionCarres,
  [RENDU_FRACTIONS_DECIMAUX]: rendreCorrectionFractionsDecimaux,
  [RENDU_ECRITURES_MULTIPLES]: rendreCorrectionEcrituresMultiples,
  [RENDU_DROITE_GRADUEE]: rendreCorrectionDroiteGraduee,
  [RENDU_REPERAGE_PLAN]: rendreCorrectionReperagePlan,
  [RENDU_SOLIDE]: rendreCorrectionSolides,
  [RENDU_VOLUME]: rendreCorrectionVolumes,
});

const RENDUS_QUESTION = Object.freeze({
  [RENDU_DIVISIBILITE]: rendreQuestionDivisibilite,
  [RENDU_CARRES]: rendreQuestionCarres,
  [RENDU_FRACTIONS_DECIMAUX]: rendreQuestionFractionsDecimaux,
  [RENDU_ECRITURES_MULTIPLES]: rendreQuestionEcrituresMultiples,
  [RENDU_DROITE_GRADUEE]: rendreQuestionDroiteGraduee,
  [RENDU_REPERAGE_PLAN]: rendreQuestionReperagePlan,
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
    || !etat.configuration.notions.some((notion) => [
      NOTION_FRACTION_VERS_DECIMAL,
      NOTION_DECIMAL_VERS_FRACTION,
      NOTION_FRACTIONS_SIMPLES_DECIMAUX,
    ].includes(notion))
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

function installerIndicateurReponseRepere() {
  const zone = application.querySelector?.(".zone-question-scroll");
  const indicateur = application.querySelector?.(".indicateur-reponse-repere");
  const reponse = zone?.querySelector?.(
    ".saisie-couple-repere, .saisie-coordonnee-seule",
  );
  if (!zone || !indicateur || !reponse) return;
  const actualiser = () => {
    if (
      typeof zone.getBoundingClientRect !== "function"
      || typeof reponse.getBoundingClientRect !== "function"
    ) return;
    const cadre = zone.getBoundingClientRect();
    const cible = reponse.getBoundingClientRect();
    const deborde = zone.scrollHeight > zone.clientHeight + 2;
    indicateur.hidden = !deborde || cible.top < cadre.bottom - 24;
  };
  if (zone.dataset?.indicateurReponseInstalle !== "true") {
    if (zone.dataset) zone.dataset.indicateurReponseInstalle = "true";
    zone.addEventListener?.("scroll", actualiser, { passive: true });
  }
  globalThis.requestAnimationFrame?.(actualiser);
  document.fonts?.ready?.then?.(() => {
    if (zone.isConnected !== false) actualiser();
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
    ? `${configurationMenu.niveau === "DNB" ? "Préparation au brevet" : `Automatismes ${configurationMenu.niveau}`} — maths&go`
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
  const chercherCiblesFocus = (selecteur) => {
    if (!selecteur) return [];
    if (typeof application.querySelectorAll === "function") {
      return [...application.querySelectorAll(selecteur)];
    }
    const unique = application.querySelector?.(selecteur);
    return unique ? [unique] : [];
  };
  const candidatsFocus = focusPanneau
    ? chercherCiblesFocus(".menu-session button, .panneau .fermer")
    : chercherCiblesFocus(focusSelector);
  const cibleFocus = candidatsFocus.find((element) =>
    element.offsetParent !== null || element.getClientRects?.().length > 0)
    ?? candidatsFocus[0]
    ?? null;
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
  installerIndicateurReponseRepere();
}

window.addEventListener("resize", () => {
  installerIndicateurDefilementPanneau(application.querySelector?.(".panneau"));
  installerIndicateurReponseRepere();
});

application.addEventListener("toggle", (evenement) => {
  const groupe = evenement.target?.closest?.(".theme-group");
  if (!groupe?.dataset?.theme) return;
  if (groupe.open) {
    domaineMenuOuvert = groupe.dataset.theme;
    application.querySelectorAll?.(".theme-group[open]").forEach((autre) => {
      if (autre !== groupe) autre.open = false;
    });
  } else if (domaineMenuOuvert === groupe.dataset.theme) {
    domaineMenuOuvert = null;
  }
}, true);

application.addEventListener("click", (evenement) => {
  const cible = evenement.target.closest("[data-action]");
  if (!cible) return;
  const groupeDomaine = cible.closest?.(".theme-group");
  if (groupeDomaine?.dataset?.theme) domaineMenuOuvert = groupeDomaine.dataset.theme;
  const action = cible.dataset.action;
  if (action === "interieur-menu") return;
  if (action === "voir-reponse-repere") {
    const zone = application.querySelector?.(".zone-question-scroll");
    const reponse = zone?.querySelector?.(
      ".saisie-couple-repere, .saisie-coordonnee-seule",
    );
    if (zone && reponse) {
      const destination = Math.max(0, reponse.offsetTop - 18);
      zone.scrollTo?.({
        top: destination,
        behavior: globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
          ? "auto"
          : "smooth",
      });
    }
    return;
  }
  let focusPanneau = false;
  let focusSelector = "";
  let reinitialiserDefilementPanneau = false;
  if (action === "choisir-niveau" && NIVEAUX_PARCOURS.includes(cible.dataset.value)) {
    configurationMenu.niveau = cible.dataset.value;
  }
  if (action === "choisir-aide") {
    configurationMenu.aide = cible.dataset.value === "indisponible"
      ? "indisponible"
      : "disponible";
  }
  if (action === "choisir-mode") {
    configurationMenu.mode = cible.dataset.value === "tableau" ? "tableau" : "entrainement";
  }
  if (action === "choisir-volume") {
    const volume = Number(cible.dataset.value);
    if (VOLUMES_MENU.includes(volume)) {
      configurationMenu.nombreQuestions = volume;
    }
  }
  if (action === "selectionner-tout") {
    definirSelectionMenu([
      ...configurationMenu.notions,
      ...notionsVisiblesPourNiveau(configurationMenu.niveau),
    ]);
  }
  if (action === "selectionner-aucun") {
    definirSelectionMenu([]);
  }
  if (action === "selectionner-domaine") {
    const domaine = domainesMenuPourNiveau(configurationMenu.niveau)
      .find(({ id }) => id === cible.dataset.value);
    if (domaine && domaine.notions.length > 0) {
      domaineMenuOuvert = domaine.id;
      const selection = new Set(configurationMenu.notions);
      const complete = domaine.notions.every((notion) => selection.has(notion));
      domaine.notions.forEach((notion) => {
        if (complete) selection.delete(notion);
        else selection.add(notion);
      });
      definirSelectionMenu([...selection]);
    }
  }
  if (action === "choisir-notion") {
    const notionDemandee = cible.dataset.value;
    if (notionsVisiblesPourNiveau(configurationMenu.niveau).includes(notionDemandee)) {
      const selection = new Set(configurationMenu.notions);
      if (selection.has(notionDemandee)) {
        selection.delete(notionDemandee);
      } else {
        selection.add(notionDemandee);
      }
      definirSelectionMenu([...selection]);
    }
  }
  if (action === "preparer") {
    const notionsSelectionnees = notionsSelectionneesVisiblesMenu();
    if (
      notionsSelectionnees.length === 0
      || notionsSelectionnees.some((notion) => !connaitNotionLecteur(notion))
    ) return;
    etat = creerEtatLecteur({
      niveau: configurationMenu.niveau,
      mode: configurationMenu.mode,
      aide: configurationMenu.aide,
      nombreQuestions: configurationMenu.nombreQuestions,
      notions: notionsSelectionnees,
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
  if (action === "placer-repere" && evenement.detail !== 0) {
    const rectangle = cible.getBoundingClientRect();
    if (rectangle.width > 0 && rectangle.height > 0) {
      const proportionX = Math.max(0, Math.min(1, (evenement.clientX - rectangle.left) / rectangle.width));
      const proportionY = Math.max(0, Math.min(1, (evenement.clientY - rectangle.top) / rectangle.height));
      const xMin = Number(cible.dataset.xMin);
      const xMax = Number(cible.dataset.xMax);
      const yMin = Number(cible.dataset.yMin);
      const yMax = Number(cible.dataset.yMax);
      const pas = Number(cible.dataset.pas) || 1;
      const nombreX = Math.round((xMax - xMin) / pas);
      const nombreY = Math.round((yMax - yMin) / pas);
      const x = xMin + Math.round(proportionX * nombreX) * pas;
      const y = yMax - Math.round(proportionY * nombreY) * pas;
      basculerChoix(etat, encoderCoordonnee(x, y));
    }
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
  if (action === "repere-aide-axe") {
    const correcte = traiterAxeRepereAide(cible.dataset.axe);
    if (evenement.detail === 0) {
      const question = questionCourante(etat);
      const prochaineInteraction = interactionPourAideRepere(
        familleQuestion(question),
        Number(etat.repereAide ?? 0),
      );
      focusSelector = correcte && prochaineInteraction?.type === "axes"
        ? `[data-action="repere-aide-axe"][data-axe="${prochaineInteraction.axeAttendu}"]`
        : correcte && prochaineInteraction
          ? '[data-action="repere-aide-surface"]'
          : correcte
            ? '[data-action="fermer-aide"]'
          : `[data-action="repere-aide-axe"][data-axe="${cible.dataset.axe}"]`;
    }
  }
  if (action === "repere-aide-graduation") {
    const correcte = traiterGraduationRepereAide(
      cible.dataset.axe,
      Number(cible.dataset.valeur),
    );
    if (evenement.detail === 0) {
      const question = questionCourante(etat);
      const prochaineInteraction = interactionPourAideRepere(
        familleQuestion(question),
        Number(etat.repereAide ?? 0),
      );
      focusSelector = correcte && prochaineInteraction
        ? '[data-action="repere-aide-surface"]'
        : correcte
          ? '[data-action="fermer-aide"]'
          : `[data-action="repere-aide-graduation"][data-axe="${cible.dataset.axe}"][data-valeur="${cible.dataset.valeur}"]`;
    }
  }
  if (action === "repere-aide-surface" && evenement.detail !== 0) {
    traiterSurfaceRepereAide(cible, evenement);
  }
  if (action === "repere-aide-point") {
    const correcte = traiterPointRepereAide(cible.dataset.id);
    if (evenement.detail === 0) {
      focusSelector = correcte
        ? '[data-action="fermer-aide"]'
        : `[data-action="repere-aide-point"][data-id="${cible.dataset.id}"]`;
    }
  }
  if (action === "repere-aide-echelle") {
    avancerEchelleRepereAide(etat);
    if (evenement.detail === 0) focusSelector = '[data-action="repere-aide-echelle"]';
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
  if (action === "pas-fraction-unite") {
    avancerFractionAide(etat, Number(cible.dataset.pas));
    focusSelector = etat.pasFractionAide === blocRationnelQuestion(questionCourante(etat))?.numerateur
      ? '[data-action="pas-fraction-precedent"]'
      : '[data-action="pas-fraction-unite"]:not([disabled]), [data-action="pas-fraction-suivant"]';
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
    etapeCoursRepere = 0;
    ouvrirCours(etat);
    focusPanneau = etat.coursOuvert;
  }
  if (action === "cours-notion") {
    menuSessionOuvert = false;
    pageCoursCourante = 0;
    etapeCoursRepere = 0;
    ouvrirCours(etat, cible.dataset.notion);
    focusPanneau = etat.coursOuvert;
  }
  if (action === "cours-precedent") {
    pageCoursCourante = Math.max(0, pageCoursCourante - 1);
    etapeCoursRepere = 0;
    reinitialiserDefilementPanneau = true;
    focusSelector = '[data-action="cours-precedent"]';
  }
  if (action === "cours-suivant") {
    const dernierePage = nombrePagesCours() - 1;
    pageCoursCourante = Math.min(dernierePage, pageCoursCourante + 1);
    etapeCoursRepere = 0;
    reinitialiserDefilementPanneau = true;
    focusSelector = pageCoursCourante === dernierePage
      ? '[data-action="fermer-cours"].bouton-principal'
      : '[data-action="cours-suivant"]';
  }
  if (action === "cours-repere-etape") {
    const etape = Number(cible.dataset.value);
    if (Number.isInteger(etape) && etape >= 0 && etape <= 3) {
      etapeCoursRepere = etape;
      focusSelector = `[data-action="cours-repere-etape"][data-value="${etape}"]`;
    }
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
        && [
          TYPE_REPONSE_FRACTION_EQUIVALENTE,
          TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
          TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX,
        ]
          .includes(question?.reponse.type)
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
  const surfaceAideActive = document.activeElement?.closest?.(
    '[data-action="repere-aide-surface"]',
  );
  if (etat.aideOuverte && surfaceAideActive) {
    const mode = surfaceAideActive.dataset.mode;
    const question = questionCourante(etat);
    const bloc = question ? blocRepereCartesien(question) : null;
    const touchesDirection = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (bloc && (touchesDirection.includes(evenement.key) || evenement.key === "Enter")) {
      evenement.preventDefault?.();
      const axeAttendu = axeAttenduAideRepere(question);
      if (mode === "graduations") {
        if (evenement.key === "Enter") {
          const courant = etat.pointRepereAide ?? { x: 0, y: 0 };
          traiterGraduationRepereAide(
            axeAttendu,
            axeAttendu === "abscisses" ? courant.x : courant.y,
          );
        } else {
          const toucheDansLeBonSens = axeAttendu === "abscisses"
            ? ["ArrowLeft", "ArrowRight"].includes(evenement.key)
            : ["ArrowUp", "ArrowDown"].includes(evenement.key);
          if (!toucheDansLeBonSens) {
            definirRetourRepereAide("erreur", retourMauvaisAxeRepere(axeAttendu));
          } else {
            const courant = etat.pointRepereAide ?? { x: 0, y: 0 };
            const pas = bloc.pas ?? 1;
            const delta = ["ArrowRight", "ArrowUp"].includes(evenement.key) ? pas : -pas;
            const nettoyer = (valeur) => Number(valeur.toFixed(10));
            const point = axeAttendu === "abscisses"
              ? {
                x: nettoyer(Math.max(bloc.xMin, Math.min(bloc.xMax, courant.x + delta))),
                y: 0,
              }
              : {
                x: 0,
                y: nettoyer(Math.max(bloc.yMin, Math.min(bloc.yMax, courant.y + delta))),
              };
            const valeur = axeAttendu === "abscisses" ? point.x : point.y;
            definirRetourRepereAide(
              "information",
              `Graduation choisie au clavier : ${formaterEntierRepere(valeur)}. Appuie sur Entrée pour confirmer.`,
              { point },
            );
          }
        }
        const prochaineInteraction = interactionPourAideRepere(
          familleQuestion(question),
          Number(etat.repereAide ?? 0),
        );
        rendre({
          focusSelector: prochaineInteraction
            ? '[data-action="repere-aide-surface"]'
            : '[data-action="fermer-aide"]',
        });
        return;
      }
      if (mode === "intersection") {
        if (evenement.key === "Enter") {
          const point = etat.pointRepereAide ?? pointChoisiRepere(question) ?? { x: 0, y: 0 };
          const correcte = traiterIntersectionRepereAide(point.x, point.y);
          rendre({
            focusSelector: correcte
              ? '[data-action="fermer-aide"]'
              : '[data-action="repere-aide-surface"]',
          });
          return;
        }
        const courant = etat.pointRepereAide ?? pointChoisiRepere(question) ?? { x: 0, y: 0 };
        const deltas = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, 1],
          ArrowDown: [0, -1],
        };
        const [dx, dy] = deltas[evenement.key];
        const pas = bloc.pas ?? 1;
        const nettoyer = (valeur) => Number(valeur.toFixed(10));
        const point = {
          x: nettoyer(Math.max(bloc.xMin, Math.min(bloc.xMax, courant.x + dx * pas))),
          y: nettoyer(Math.max(bloc.yMin, Math.min(bloc.yMax, courant.y + dy * pas))),
        };
        basculerChoix(etat, encoderCoordonnee(point.x, point.y));
        definirRetourRepereAide(
          "information",
          "Déplace le point avec les flèches, puis appuie sur Entrée à l'intersection.",
          { point },
        );
        rendre({ focusSelector: '[data-action="repere-aide-surface"]' });
        return;
      }
    }
  }
  if (menuSessionOuvert || etat.aideOuverte || etat.correctionOuverte || etat.coursOuvert) return;
  const question = questionCourante(etat);
  if (
    question
    && etat.validation === null
    && question.classement.notion === NOTION_DROITE_GRADUEE
    && familleQuestion(question) === "placer-point"
    && ["ArrowLeft", "ArrowRight"].includes(evenement.key)
  ) {
    evenement.preventDefault?.();
    const ids = question.reponse.choix.map((choix) => choix.id);
    const selection = ids.indexOf(etat.selection[0]);
    const courant = selection === -1
      ? evenement.key === "ArrowLeft" ? ids.length : -1
      : selection;
    const suivant = Math.max(0, Math.min(ids.length - 1, courant + (evenement.key === "ArrowLeft" ? -1 : 1)));
    basculerChoix(etat, ids[suivant]);
    rendre({ focusSelector: `[data-action="choix"][data-id="${ids[suivant]}"]` });
    return;
  }
  if (
    question
    && etat.validation === null
    && question.classement.notion === NOTION_PLACER_POINT_REPERE
    && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(evenement.key)
  ) {
    evenement.preventDefault?.();
    const bloc = blocRepereCartesien(question);
    const courant = decoderCoordonnee(etat.selection[0]) ?? { x: 0, y: 0 };
    const deltas = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    const [dx, dy] = deltas[evenement.key];
    const pas = bloc.pas ?? 1;
    const x = Math.max(bloc.xMin, Math.min(bloc.xMax, courant.x + dx * pas));
    const y = Math.max(bloc.yMin, Math.min(bloc.yMax, courant.y + dy * pas));
    basculerChoix(etat, encoderCoordonnee(x, y));
    rendre({ focusSelector: '[data-action="placer-repere"]' });
    return;
  }
  if (!question || etat.validation !== null || !estReponseNumerique(question)) return;
  if (/^[0-9]$/.test(evenement.key)) {
    evenement.preventDefault?.();
    saisirCaractere(etat, evenement.key);
    rendre({
      focusSelector: question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
        || question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS
        || question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX
        ? `[data-action="champ-reponse"][data-index="${etat.champSaisieActif}"]`
        : "",
    });
  } else if (
    [TYPE_REPONSE_NOMBRE_DECIMAL, TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX]
      .includes(question.reponse.type)
    && [".", ","].includes(evenement.key)
  ) {
    evenement.preventDefault?.();
    saisirCaractere(etat, evenement.key);
    rendre();
  } else if (
    (
      question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS
      || question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX
      || (
        question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL
        && [NOTION_DROITE_GRADUEE, NOTION_LIRE_COORDONNEES_POINT]
          .includes(question.classement.notion)
      )
    )
    && ["-", "−"].includes(evenement.key)
  ) {
    evenement.preventDefault?.();
    saisirCaractere(etat, evenement.key);
    rendre();
  } else if (evenement.key === "Backspace") {
    evenement.preventDefault?.();
    effacerSaisie(etat);
    rendre({
      focusSelector: question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
        || question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS
        || question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX
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
