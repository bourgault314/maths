import { checkAnswer, normalize, VERSION } from "./core.js";
import { genererQuestion } from "./moteur.js";
import { mathHtml } from "./math-format.js";
import { fitMathExpressions } from "./math-layout.js";
import { esc } from "./generateurs/draw.js";
import { initialiserSuivi, enregistrerEssai, terminerSeance, vuesForme } from "./suivi.js";
import {
  creerSerie,
  famillesEligibles,
  formesEligibles,
  nouvelleGraine,
  DOMAINES,
} from "./seances.js";
import {
  monterReponse,
  modeleQuestion,
  reglageForme,
  lireChamps,
  insererTexte,
  monterClavier,
  monterSignes,
  lettresGrasses,
  largeurCasesExpression,
} from "./champs.js";
import {
  accueilHTML,
  domaineHTML,
  questionHTML,
  bilanHTML,
  brevetHTML,
  lancementHTML,
  coursHTML,
  compteurHTML,
  reglagesProjectionHTML,
  bouton,
  ICONES,
  NIVEAUX,
} from "./vues.js";

const catalogue = await fetch("./catalogue/catalogue.json").then((reponse) => reponse.json());
const alias = await fetch("./catalogue/alias-gpt.json").then((reponse) => reponse.json());
const parId = Object.fromEntries(catalogue.map((famille) => [famille.id, famille]));
const application = document.querySelector("#app");
const preferences = lirePreferences();
const CLE_PROJECTION = "mg-automatismes-projection";
// Les réglages du diaporama : ceux par défaut, puis ceux gardés sur l'appareil (lireReglagesProjection
// ne lit que CLE_PROJECTION, déclarée juste au-dessus).
const reglageProf = {
  nombre: 8,
  secondes: 45,
  delai: 4,
  correction: "each",
  automatique: false,
  aideOffice: false,
  ...lireReglagesProjection(),
};
const selection = new Set();
let filtre = preferences.niveau;
let ecran = "accueil";
let domaine = null;
let seance = null;
let champActif = null;
let clavierOuvert = false;
let horloge = null;
let dernierInstant = 0;
initialiserSuivi(catalogue);

function lirePreferences() {
  try {
    const valeur = JSON.parse(localStorage.getItem("mg-automatismes-prefs")) || {};
    // Une ancienne préférence « brevet » (ou rien) donne la 3e.
    const niveau = NIVEAUX.includes(valeur.niveau) ? valeur.niveau : "3e";
    return {
      niveau,
      nombre: [5, 10, 15, 20].includes(valeur.nombre) ? valeur.nombre : 10,
      garderAide: valeur.garderAide === true,
      clavierOrdinateur: valeur.clavierOrdinateur === true,
    };
  } catch {
    return { niveau: "3e", nombre: 10, garderAide: false, clavierOrdinateur: false };
  }
}

/* « Projeter » garde ses réglages sur l'appareil d'une fois sur l'autre (décision H) : temps de
   recherche, pause, correction, enchaîner, avec aide — pas le nombre de questions, qui vient de
   « Préparer la série ». Tout ce qui est lu est revérifié : une valeur abîmée ou hors bornes laisse le
   réglage par défaut. */
function lireReglagesProjection() {
  try {
    const valeur = JSON.parse(localStorage.getItem(CLE_PROJECTION)) || {};
    const borne = (x, min, max) => (Number.isInteger(x) && x >= min && x <= max ? x : undefined);
    const lus = {
      secondes: borne(valeur.secondes, 5, 600),
      delai: borne(valeur.delai, 0, 60),
      correction: ["each", "end"].includes(valeur.correction) ? valeur.correction : undefined,
      automatique: typeof valeur.automatique === "boolean" ? valeur.automatique : undefined,
      aideOffice: typeof valeur.aideOffice === "boolean" ? valeur.aideOffice : undefined,
    };
    return Object.fromEntries(Object.entries(lus).filter(([, x]) => x !== undefined));
  } catch {
    return {};
  }
}

function sauverReglagesProjection() {
  const { secondes, delai, correction, automatique, aideOffice } = reglageProf;
  try {
    localStorage.setItem(
      CLE_PROJECTION,
      JSON.stringify({ secondes, delai, correction, automatique, aideOffice }),
    );
  } catch {
    // Navigation privée ou stockage bloqué : les réglages valent pour cette page seulement.
  }
}

function sauverPreferences() {
  try {
    localStorage.setItem("mg-automatismes-prefs", JSON.stringify(preferences));
  } catch {
    avertir("Les préférences restent disponibles jusqu’à la fermeture de cette page.");
  }
}

function avertir(texte) {
  const message = document.querySelector("#message");
  message.textContent = texte;
  message.hidden = false;
  setTimeout(() => {
    message.hidden = true;
  }, 5000);
}

function cadre(contenu) {
  const question = ecran === "question";
  const projection = question && seance.mode === "project";
  document.body.dataset.ecran = ecran;
  document.body.classList.toggle("projection", projection);
  document.body.classList.toggle("tactile", tactile());
  document.body.classList.remove("clavier-ouvert");
  clavierOuvert = false;
  champActif = null;
  // L'accueil porte sa carte d'en-tête (logo, titre, Plein écran), le domaine sa carte qui le referme :
  // ni barre du cadre ni pied. Ailleurs, la barre du cadre porte « ← Retour » à gauche et Plein écran
  // à droite (dès 700 px). L'écran de question a sa propre barre.
  const menu = ecran === "accueil" || ecran === "domaine";
  document.body.classList.toggle("menu", menu);
  const pleinEcran = bouton(
    `${ICONES.pleinEcran}<span>Plein écran</span>`,
    "plein-ecran",
    "pastille plein-ecran-cadre",
    'aria-label="Plein écran"',
  );
  const barreCadre =
    question || menu
      ? ""
      : `<div class="barre-cadre">${bouton("← Retour", "retour", "discret petit")}
      <div class="barre-cadre-droite">${pleinEcran}</div></div>`;
  application.innerHTML = `<div class="coque">
    <main class="cadre">${barreCadre}<div class="contenu">${contenu}</div>
      ${ecran === "accueil" || ecran === "domaine" ? '<div id="lancement"></div>' : ""}</main>
  </div>`;
  relierActions();
  majLancement();
  ajusterAffichage();
}

// La barre de lancement suit la sélection (accueil et domaines) ; rien de coché, elle dit quoi faire.
function majLancement() {
  const zone = document.querySelector("#lancement");
  if (!zone) return;
  zone.innerHTML = lancementHTML(selection.size, preferences.nombre, filtre);
  relierActions(zone);
  ajusterAffichage();
}

// La sélection reste après la série : « Menu » ramène l'élève à ses notions cochées (décision J).
function lancerSelection() {
  const ids = famillesEligibles(catalogue, filtre)
    .filter((famille) => selection.has(famille.id))
    .map((famille) => famille.id);
  if (!ids.length) return;
  lancer({ mode: "train", ids, nombre: preferences.nombre });
}

function afficherAccueil() {
  arreterHorloge();
  ecran = "accueil";
  seance = null;
  // Aucun domaine n'est ouvert : une série lancée d'ici revient ici.
  domaine = null;
  // L'entrée d'historique affichée est celle de l'accueil (état vide), jamais un domaine à l'écran caché.
  history.replaceState(null, "", location.pathname);
  cadre(accueilHTML(famillesEligibles(catalogue, filtre), filtre, selection, preferences.nombre));
}

/* Le domaine a sa place dans l'historique : le geste retour du téléphone le referme au lieu de
   quitter l'appli (popstate). Un identifiant inconnu (adresse, historique) ramène à l'accueil. Venu de
   l'historique (retour, avant, rechargement, fin de série), l'entrée affichée porte ce domaine. */
function afficherDomaine(id, depuisHistorique = false) {
  if (!domaineConnu(id)) return afficherAccueil();
  if (ecran === "accueil" && !depuisHistorique)
    history.pushState({ domaine: id }, "", location.pathname);
  else if (depuisHistorique) history.replaceState({ domaine: id }, "", location.pathname);
  ecran = "domaine";
  domaine = id;
  const familles = famillesEligibles(catalogue, filtre).filter((famille) => famille.domaine === id);
  cadre(domaineHTML(id, familles, filtre, selection));
  relierSelection();
}

function afficherBrevet() {
  arreterHorloge();
  ecran = "brevet";
  seance = null;
  cadre(brevetHTML());
}

function changerNiveau(niveau) {
  if (!NIVEAUX.includes(niveau)) return;
  filtre = niveau;
  preferences.niveau = niveau;
  sauverPreferences();
  // Les notions cochées qui ne sont plus de ce niveau quittent la sélection.
  const eligibles = new Set(famillesEligibles(catalogue, niveau).map((famille) => famille.id));
  for (const id of [...selection]) if (!eligibles.has(id)) selection.delete(id);
  if (ecran === "domaine") afficherDomaine(domaine);
  else afficherAccueil();
}

// L'aide affichée d'office ne vaut que pour le diaporama (réglage « Avec aide », ou la préférence
// garderAide) ; l'élève, lui, ouvre l'aide question par question.
function aideDOffice(mode, aideOffice) {
  return mode === "project" && Boolean(aideOffice || preferences.garderAide);
}

function nouvelEtat(question, mode, aideOffice) {
  const aideOuverte = aideDOffice(mode, aideOffice);
  return {
    reponses: question.fields.map(() => ""),
    aide: aideOuverte ? 1 : 0,
    aideOuverte,
    etape: false,
    erreurs: 0,
    message: "",
    juste: false,
    correction: false,
    terminee: false,
  };
}

/* L'identifiant d'une séance. crypto.randomUUID n'existe que sur une page sécurisée (HTTPS ou
   localhost) : sur une adresse de test comme http://192.168.1.13:8000, aucune série ne se lançait.
   Sinon, un UUID v4 tiré avec crypto.getRandomValues, disponible partout. */
function idSeance() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const octets = crypto.getRandomValues(new Uint8Array(16));
  octets[6] = (octets[6] & 0x0f) | 0x40;
  octets[8] = (octets[8] & 0x3f) | 0x80;
  const hexa = [...octets].map((octet) => octet.toString(16).padStart(2, "0")).join("");
  return `${hexa.slice(0, 8)}-${hexa.slice(8, 12)}-${hexa.slice(12, 16)}-${hexa.slice(16, 20)}-${hexa.slice(20)}`;
}

function lancer(options, questionsImposees) {
  arreterHorloge();
  const graine = options.graine || nouvelleGraine();
  const configuration = { ...reglageProf, filtre, ...options, graine };
  try {
    const vues = options.partagee ? () => 0 : vuesForme;
    const questions = questionsImposees || creerSerie(catalogue, configuration, vues);
    seance = {
      id: idSeance(),
      options: configuration,
      questions,
      index: 0,
      mode: configuration.mode || "train",
      phase: "recherche",
      pause: false,
      reste: configuration.secondes,
      transition: null,
      fin: Date.now() + 1200000,
      etats: questions.map((question) =>
        nouvelEtat(question, configuration.mode, configuration.aideOffice),
      ),
    };
    // La série a sa place dans l'historique : le geste retour du téléphone fait comme « Menu » au
    // lieu de quitter l'appli. « Encore une série » et « Refaire mes erreurs » réutilisent la place.
    // L'état retient le domaine d'origine : un rechargement pendant la série y ramène.
    if (!etatHistorique()?.serie)
      history.pushState({ serie: true, origine: domaine }, "", location.pathname);
    ecran = "question";
    afficherQuestion();
    demarrerHorloge();
  } catch (erreur) {
    avertir(erreur.message);
  }
}

function afficherQuestion() {
  ecran = "question";
  const question = questionCourante();
  const etat = etatCourant();
  if (!etat.visitee && seance.mode !== "exam") {
    etat.aideOuverte = aideDOffice(seance.mode, seance.options.aideOffice);
    etat.aide = etat.aideOuverte ? 1 : 0;
    etat.visitee = true;
  }
  garderClavier = false;
  delete document.body.dataset.clavierRange;
  cadre(questionHTML(seance, parId[question.famille], clavierVoulu()));
  document.body.classList.toggle(
    "avec-choix",
    question.fields.some((champ) => champ.options),
  );
  if (seance.mode !== "project") preparerSaisie(question, etat);
  else montrerProjection(question, etat);
  // K10 : le calcul de l'énoncé et la bonne réponse, comme les cases, en gras, lettres rondes grasses.
  document
    .querySelectorAll(".carte .question-expression, .carte .bonne strong")
    .forEach(lettresGrasses);
  // La police des lettres grasses ne se charge qu'à leur première apparition : on règle de nouveau
  // les tailles quand elle est là (sinon le calcul s'élargit après coup).
  if (
    document.querySelector(".lettre-grasse") &&
    !document.fonts.check("800 16px SplatLettres", "𝑥")
  )
    document.fonts.load("800 16px SplatLettres", "𝑥").then(ajusterAffichage);
  mettreAJourTemps();
  ajusterAffichage();
}

function questionCourante() {
  return seance.questions[seance.index];
}
function etatCourant() {
  return seance.etats[seance.index];
}

function preparerSaisie(question, etat) {
  const reponses = document.querySelector(".reponses");
  const modele = modeleQuestion(
    question,
    reglageForme(question, parId[question.famille], "gabarit"),
  );
  const monter = () => {
    const finie = etat.terminee && seance.mode !== "exam";
    monterReponse(reponses, question, etat.reponses, {
      modele,
      terminee: finie,
      lecture: finie,
      corriger: finie,
      etatCases: finie ? etat.etatCases : null,
      clavierEcran: tactile(),
      changer: recueillir,
      cibler: ciblerChamp,
      valider,
      choisir: (rang, valeur) => {
        etat.reponses[rang] = valeur;
        // Cartes à ranger et signes < = > : la case du calcul se remplit (ou se vide) aussitôt.
        if (modele.cas === "ranger" || modele.cas === "comparaison") monter();
      },
    });
    const signes = document.querySelector(".signes");
    if (signes && modele.cas === "comparaison" && !etat.terminee)
      monterSignes(signes, question.fields[0], etat.reponses[0], (valeur) => {
        etat.reponses[0] = valeur;
        monter();
      });
    ajusterAffichage();
  };
  monter();
  monterClavier(document.querySelector(".clavier"), question, { inserer });
  const premier = document.querySelector(".champ:not(:disabled)");
  // Le clavier s'ouvre dès l'arrivée partout où on le veut, aide ouverte ou non (coque V2, C5).
  if (premier && clavierVoulu()) ciblerChamp(premier);
}

// Diaporama (C10) : les cases vides dans le calcul ; « Réponse » les remplit, en vert.
function montrerProjection(question, etat) {
  const reponses = document.querySelector(".reponses");
  const montree = Boolean(etat.reponseMontree);
  monterReponse(reponses, question, montree ? question.fields.map((champ) => champ.answer) : [], {
    modele: modeleQuestion(question, reglageForme(question, parId[question.famille], "gabarit")),
    terminee: true,
    lecture: true,
    corriger: montree,
    etatCases: montree ? question.fields.map(() => "juste") : null,
    choisir: () => {},
  });
}

// K11 : « Réponse » ferme l'aide (comme « Explication » la cache depuis K3).
function basculerReponse() {
  if (seance?.mode !== "project") return;
  const etat = etatCourant();
  etat.reponseMontree = !etat.reponseMontree;
  if (etat.reponseMontree) etat.aideOuverte = false;
  afficherQuestion();
}

// Le clavier à l'écran : toujours sur un appareil tactile, sur ordinateur seulement si on l'a demandé
// (bouton clavier de la barre du haut, mémorisé). Un refus sur tactile vaut pour la page ouverte.
let clavierRefuse = false;
function clavierVoulu() {
  return tactile() ? !clavierRefuse : preferences.clavierOrdinateur;
}

function basculerClavier() {
  if (tactile()) clavierRefuse = !clavierRefuse;
  else {
    preferences.clavierOrdinateur = !preferences.clavierOrdinateur;
    sauverPreferences();
  }
  recueillir();
  afficherQuestion();
}

function telephone() {
  return matchMedia("(max-width: 680px)").matches;
}

function tactile() {
  return telephone() || matchMedia("(pointer: coarse)").matches;
}

// Toucher une case (parUtilisateur) fait revenir le clavier que l'aide avait rangé, et il reste.
let garderClavier = false;
function ciblerChamp(champ, parUtilisateur = false) {
  champActif = champ;
  if (parUtilisateur && document.body.dataset.clavierRange) {
    garderClavier = true;
    delete document.body.dataset.clavierRange;
  }
  // La case active est cerclée d'orange : toucher une case la rend active.
  document.querySelectorAll(".champ.active").forEach((autre) => autre.classList.remove("active"));
  champ.classList.add("active");
  if (!clavierVoulu() || ecran !== "question") return;
  clavierOuvert = true;
  document.querySelector(".clavier").hidden = false;
  document.body.classList.add("clavier-ouvert");
  ajusterAffichage();
}

function fermerClavier() {
  clavierOuvert = false;
  const clavier = document.querySelector(".clavier");
  if (clavier) clavier.hidden = true;
  document.body.classList.remove("clavier-ouvert");
  ajusterAffichage();
}

function inserer(texte) {
  champActif ||= document.querySelector(".champ:not(:disabled)");
  insererTexte(champActif, texte);
}

function recueillir() {
  if (ecran !== "question" || seance.mode === "project") return;
  etatCourant().reponses = lireChamps(
    document.querySelector(".reponses"),
    questionCourante(),
    etatCourant().reponses,
  );
}

function detailEssai(question, etat, juste) {
  return {
    famille: question.famille,
    forme: question.forme,
    graine: question.graine,
    juste: juste ? 1 : 0,
    aide: etat.aide,
    moteur: VERSION,
  };
}

function valider() {
  if (ecran !== "question") return;
  if (seance.mode === "project") return suivante();
  if (etatCourant().terminee && seance.mode !== "exam") return suivante();
  recueillir();
  if (seance.mode === "exam") return suivante();
  const question = questionCourante();
  const etat = etatCourant();
  const resultat = checkAnswer(question, etat.reponses);
  // Une réponse incomplète ou illisible n'est pas une réponse : on le dit, l'élève corrige.
  if (resultat.syntax) {
    etat.message = resultat.message;
    return afficherQuestion();
  }
  // Contrat §5.3 : un seul événement par question, à la première réponse.
  if (!etat.emis) {
    enregistrerEssai(detailEssai(question, etat, resultat.ok));
    etat.emis = true;
  }
  // Coque V2 (C6) : plus de second essai ; juste ou faux, la question est finie.
  etat.juste = resultat.ok;
  etat.terminee = true;
  etat.aideOuverte = false;
  etat.etatCases = etatDesCases(question, etat.reponses, resultat.ok);
  etat.erreurConnue = resultat.ok ? null : erreurConnue(question, etat.reponses);
  etat.message =
    resultat.ok || /Pas encore|Bien joué/.test(resultat.message) ? "" : resultat.message;
  if (!resultat.ok) etat.erreurs += 1;
  afficherQuestion();
}

// Juste ou faux, case par case quand le moteur compare champ par champ (« 47 = 6 × [7] + [4] » :
// la première verte, la seconde rouge) ; sinon toutes les cases ensemble.
function etatDesCases(question, reponses, juste) {
  const type = question.check?.type || "fields";
  if (juste || question.fields.length < 2 || !["fields", "numeric", "text"].includes(type))
    return question.fields.map(() => (juste ? "juste" : "faux"));
  const valeurs = question.check?.values || question.fields.map((champ) => champ.answer);
  return question.fields.map((champ, rang) => {
    const seul = { ...question, fields: [champ], check: { type, values: [valeurs[rang]] } };
    return checkAnswer(seul, [reponses[rang]]).ok ? "juste" : "faux";
  });
}

// Une erreur connue de la forme : champ `erreurs` de la question ou de sa forme au catalogue, sous
// la forme [{ reponse: "0,49" (ou une liste, une par champ), phrase: "7 × 7 dixièmes…" }]. Les
// erreurs de famille du catalogue (des descriptions, sans réponse) ne se comparent pas.
function erreurConnue(question, reponses) {
  const liste = reglageForme(question, parId[question.famille], "erreurs");
  if (!Array.isArray(liste)) return null;
  const pareil = (a, b) => normalize(a) === normalize(b);
  const trouvee = liste.find((erreur) => {
    if (!erreur || typeof erreur !== "object" || !erreur.phrase) return false;
    const attendues = [].concat(erreur.reponse ?? erreur.reponses ?? []);
    return (
      attendues.length === reponses.length && attendues.every((r, i) => pareil(r, reponses[i]))
    );
  });
  return trouvee?.phrase || null;
}

function ouvrirAide(etape = false) {
  if (seance.mode === "exam") return;
  recueillir();
  const etat = etatCourant();
  etat.aideOuverte = true;
  etat.etape ||= etape;
  if (!etat.terminee) etat.aide = Math.max(etat.aide, etape ? 2 : 1);
  afficherQuestion();
}

// Au diaporama, l'explication cache l'aide (K3) : toucher Aide la referme et montre l'aide.
function basculerAide() {
  const etat = etatCourant();
  if (seance.mode === "project" && etat.correction) {
    etat.correction = false;
    etat.aideOuverte = false;
  }
  return etat.aideOuverte ? fermerAide() : ouvrirAide();
}

function fermerAide() {
  recueillir();
  etatCourant().aideOuverte = false;
  afficherQuestion();
}

// L'explication s'ouvre et se referme sous la question (C7). À l'élève, une fois la question finie ;
// au diaporama, quand le professeur la demande.
function basculerExplication() {
  if (seance.mode === "exam") return;
  recueillir();
  const etat = etatCourant();
  if (seance.mode === "train" && !etat.terminee) return;
  etat.correction = !etat.correction;
  // Élève : l'aide est déjà refermée (question finie). Diaporama : l'aide reste ouverte mais cachée
  // derrière l'explication, et revient quand on la referme (K3).
  if (etat.correction && seance.mode !== "project") etat.aideOuverte = false;
  afficherQuestion();
}

// Passer : la question est finie sans réponse ; la bonne réponse s'affiche, comme après une erreur.
function passer() {
  recueillir();
  if (seance.mode === "exam") return suivante();
  const etat = etatCourant();
  if (!etat.emis) {
    enregistrerEssai(detailEssai(questionCourante(), etat, false));
    etat.emis = true;
  }
  etat.terminee = true;
  etat.juste = false;
  etat.aideOuverte = false;
  etat.message = "";
  etat.erreurConnue = null;
  etat.etatCases = null;
  afficherQuestion();
}

function changerQuestion(rang) {
  if (!seance || rang < 0 || rang >= seance.questions.length) return;
  recueillir();
  seance.index = rang;
  seance.reste = seance.options.secondes;
  seance.transition = null;
  seance.pause = seance.phase === "correction";
  if (seance.phase === "correction")
    Object.assign(seance.etats[rang], { correction: true, reponseMontree: true });
  afficherQuestion();
}

function suivante() {
  recueillir();
  if (seance.index + 1 < seance.questions.length) return changerQuestion(seance.index + 1);
  if (
    seance.mode === "project" &&
    seance.options.correction === "end" &&
    seance.phase !== "correction"
  ) {
    seance.phase = "correction";
    seance.pause = true;
    return changerQuestion(0);
  }
  if (seance.mode === "exam") return confirmerFin();
  terminer();
}

function terminer() {
  recueillir();
  arreterHorloge();
  document.querySelector("dialog")?.remove();
  if (seance.mode === "exam")
    seance.questions.forEach((question, i) => {
      const etat = seance.etats[i];
      etat.juste = checkAnswer(question, etat.reponses).ok;
      etat.terminee = true;
      enregistrerEssai(detailEssai(question, etat, etat.juste));
    });
  if (seance.mode !== "project") {
    const resultats = seance.questions.map((question, i) =>
      detailEssai(question, seance.etats[i], seance.etats[i].juste),
    );
    terminerSeance(resultats, {
      id: seance.id,
      mode: seance.mode,
      formesEligibles: Object.fromEntries(
        catalogue
          .map((famille) => [
            famille.id,
            formesEligibles(famille, seance.mode === "exam" ? "brevet" : seance.options.filtre)
              .length,
          ])
          .filter(([, nombre]) => nombre > 0),
      ),
    });
  }
  ecran = "bilan";
  cadre(bilanHTML(seance, parId));
  document
    .querySelectorAll("details")
    .forEach((detail) => detail.addEventListener("toggle", ajusterAffichage));
}

// « Refaire mes erreurs » : une série avec les mêmes questions ratées (faux ou passées), même forme
// et même graine. Après le brevet, on les refait en entraînement (avec aide et cours).
function refaireErreurs() {
  const ratees = seance.questions.filter((_, rang) => !seance.etats[rang].juste);
  if (!ratees.length) return;
  const mode = seance.mode === "exam" ? "train" : seance.mode;
  const questions = ratees.map((question) =>
    genererQuestion(question.famille, question.forme, question.graine),
  );
  lancer({ ...seance.options, mode, nombre: questions.length }, questions);
}

function fenetre(contenu, fermer = "Fermer", titre = "") {
  fermerClavier();
  const dialogue = document.createElement("dialog");
  dialogue.className = "cours-dialog";
  // Avec un titre (le cours), le bouton de retour est en haut, à côté du titre.
  dialogue.innerHTML = titre
    ? `<div class="fenetre-entete"><h2>${titre}</h2>
      <form method="dialog"><button class="bouton secondaire petit">${fermer}</button></form></div>
      <div class="cours-contenu">${contenu}</div>`
    : `<div class="cours-contenu">${contenu}
    <form method="dialog"><button class="bouton primaire">${fermer}</button></form></div>`;
  document.body.append(dialogue);
  dialogue.addEventListener("close", () => dialogue.remove());
  dialogue.showModal();
  fitMathExpressions(dialogue);
  return dialogue;
}

function confirmerFin() {
  const dialogue = fenetre(
    `<h2>Terminer l’entraînement ?</h2>
    <p>Les corrections seront affichées.</p>${bouton("Terminer", "confirmer-fin", "orange")}`,
    "Continuer",
  );
  dialogue.querySelector('[data-action="confirmer-fin"]').onclick = terminer;
}

function ouvrirCours() {
  if (seance.mode === "exam") return;
  recueillir();
  if (!etatCourant().terminee) etatCourant().aide = 3;
  const question = questionCourante();
  const famille = parId[question.famille];
  let exemple = question;
  for (let i = 1; i <= 5; i++) {
    const graine = (question.graine + 104729 * i) % 2147483647 || 1;
    exemple = genererQuestion(question.famille, question.forme, graine);
    if (exemple.prompt !== question.prompt) break;
  }
  const cours = exemple.course || famille.cours || {};
  const regle =
    cours.rule === "Relie les deux grandeurs et conserve les unités."
      ? famille.cours?.regle || cours.rule
      : cours.regle || cours.rule || "";
  const dessin =
    cours.svg ||
    (famille.atlas
      ? `<img src="${esc(famille.atlas)}" alt="${esc(famille.atlasAlt || "Exemple")}">`
      : "");
  const entier = `<p>${mathHtml(regle)}</p>
    ${!cours.independentExample ? `<p>${mathHtml(exemple.prompt)}</p>` : ""}
    <div class="figure">${dessin}</div><p>${mathHtml(cours.exemple || cours.example || "")}</p>`;
  fenetre(coursHTML(famille, question, entier), "Revenir à la question", esc(famille.nom));
}

// Les champs de la fenêtre Projeter. Un champ absent (le nombre de questions, qui vient de
// « Préparer la série ») est sauté : il ne remet plus le réglage à son minimum.
function lireReglages() {
  if (!document.querySelector("dialog.reglages-dialog")) return;
  for (const [cle, min, max] of [
    ["nombre", 1, 40],
    ["secondes", 5, 600],
    ["delai", 0, 60],
  ]) {
    const champ = document.getElementById(cle);
    if (!champ) continue;
    const valeur = Number(champ.value);
    reglageProf[cle] = Number.isFinite(valeur)
      ? Math.max(min, Math.min(max, Math.round(valeur)))
      : min;
  }
  reglageProf.correction = document.querySelector("#correction")?.value === "end" ? "end" : "each";
  reglageProf.automatique = Boolean(document.querySelector("#automatique")?.checked);
  reglageProf.aideOffice = Boolean(document.querySelector("#aide-office")?.checked);
  sauverReglagesProjection();
}

// La sélection, sur l'écran de domaine : une case par notion, la case « tout » du domaine, la même
// liste `selection` pour l'élève et pour Projeter.
function relierSelection() {
  document.querySelectorAll("[data-selection]").forEach((caseNotion) => {
    caseNotion.onchange = () => {
      if (caseNotion.checked) selection.add(caseNotion.dataset.selection);
      else selection.delete(caseNotion.dataset.selection);
      majCasesTout();
      majLancement();
    };
  });
  document.querySelectorAll("[data-selection-domaine]").forEach((caseDomaine) => {
    caseDomaine.onclick = (evenement) => evenement.stopPropagation();
    caseDomaine.onchange = () => {
      const coche = caseDomaine.checked;
      caseDomaine
        .closest(".groupe-selection")
        .querySelectorAll("[data-selection]")
        .forEach((caseNotion) => {
          caseNotion.checked = coche;
          caseNotion.dispatchEvent(new Event("change"));
        });
    };
  });
}

// Cocher une notion met à jour sa ligne (.cochee) et le compteur de la carte du domaine, sans
// redessiner la liste.
function majCasesTout() {
  document.querySelectorAll(".notion [data-selection]").forEach((caseNotion) => {
    caseNotion.closest(".notion").classList.toggle("cochee", caseNotion.checked);
  });
  const tete = document.querySelector(".domaine-tete");
  if (tete) {
    const cases = [...document.querySelectorAll("[data-selection]")];
    const coches = cases.filter((caseNotion) => caseNotion.checked).length;
    tete.querySelector(".compteur-domaine").outerHTML = compteurHTML(coches, cases.length);
    tete.classList.toggle("avec-selection", coches > 0);
  }
  document.querySelectorAll("[data-selection-domaine]").forEach((caseDomaine) => {
    const cases = [
      ...caseDomaine.closest(".groupe-selection").querySelectorAll("[data-selection]"),
    ];
    caseDomaine.checked = cases.length > 0 && cases.every((caseNotion) => caseNotion.checked);
  });
}

function optionsProfesseur() {
  lireReglages();
  const disponibles = famillesEligibles(catalogue, filtre);
  const ids = disponibles
    .filter((famille) => selection.has(famille.id))
    .map((famille) => famille.id);
  if (!ids.length) {
    avertir("Choisis au moins une notion.");
    return null;
  }
  return {
    ...reglageProf,
    nombre: preferences.nombre,
    filtre,
    ids,
    graine: nouvelleGraine(),
    partagee: true,
  };
}

/* « Projeter » (décision H) : une petite fenêtre de réglages sur la sélection en cours, avec le nombre
   de questions de « Préparer la série ». Plus de page Diaporama. */
function ouvrirReglagesProjection() {
  if (!selection.size) return;
  const dialogue = document.createElement("dialog");
  dialogue.className = "cours-dialog reglages-dialog";
  dialogue.innerHTML = reglagesProjectionHTML(reglageProf, selection.size, preferences.nombre);
  document.body.append(dialogue);
  dialogue.addEventListener("close", () => {
    lireReglages();
    dialogue.remove();
  });
  relierActions(dialogue);
  dialogue.showModal();
}

function projeter() {
  const options = optionsProfesseur();
  document.querySelector("dialog.reglages-dialog")?.close();
  if (options) lancer({ ...options, mode: "project" });
}

function demarrerHorloge() {
  dernierInstant = Date.now();
  horloge = setInterval(avancerHorloge, 200);
}

function arreterHorloge() {
  clearInterval(horloge);
  horloge = null;
}

function avancerHorloge() {
  const maintenant = Date.now();
  const ecoule = (maintenant - dernierInstant) / 1000;
  dernierInstant = maintenant;
  if (ecran !== "question") return;
  if (seance.mode === "exam" && maintenant >= seance.fin) return terminer();
  if (seance.mode === "project" && !seance.pause && seance.phase !== "correction") {
    if (seance.transition !== null) {
      seance.transition = Math.max(0, seance.transition - ecoule);
      if (!seance.transition) suivante();
    } else {
      seance.reste = Math.max(0, seance.reste - ecoule);
      if (!seance.reste) rechercheTerminee();
    }
  }
  mettreAJourTemps();
}

function rechercheTerminee() {
  if (!seance.options.automatique) {
    seance.pause = true;
    afficherQuestion();
    return;
  }
  seance.transition = seance.options.delai;
  if (seance.options.correction === "each")
    Object.assign(etatCourant(), { correction: true, reponseMontree: true });
  afficherQuestion();
}

function mettreAJourTemps() {
  const element = document.querySelector("#temps");
  if (!element || !seance) return;
  const secondes =
    seance.mode === "exam"
      ? Math.max(0, (seance.fin - Date.now()) / 1000)
      : (seance.transition ?? seance.reste);
  const entier = Math.ceil(secondes);
  const prefixe =
    seance.phase === "correction"
      ? "Correction · "
      : seance.transition !== null
        ? "Suite dans "
        : "";
  element.textContent = `${prefixe}${Math.floor(entier / 60)}:${String(entier % 60).padStart(2, "0")}`;
}

function basculerPause() {
  seance.pause = !seance.pause;
  if (!seance.pause && !seance.reste && seance.transition === null)
    seance.reste = seance.options.secondes;
  afficherQuestion();
}

const domaineConnu = (id) => typeof id === "string" && DOMAINES.some(([connu]) => connu === id);

/* Le seul lecteur de l'état d'historique (P12). Reconnus : { domaine } quand c'est un identifiant de
   DOMAINES, { serie: true } (son origine : un domaine connu, sinon l'accueil). Tout autre état (un
   domaine inconnu, du texte, un objet trafiqué) est traité comme vide et remplacé. */
function etatHistorique() {
  const etat = history.state;
  if (etat === null) return null;
  if (typeof etat === "object") {
    if (etat.serie === true)
      return { serie: true, origine: domaineConnu(etat.origine) ? etat.origine : null };
    if (domaineConnu(etat.domaine)) return { domaine: etat.domaine };
  }
  history.replaceState(null, "");
  return null;
}

// Le menu qui correspond à un état reçu (geste retour ou avant, rechargement). Une place de série sans
// série en cours (rechargement pendant une série) affiche le menu d'origine et prend son état.
function afficherMenuSelon(etat) {
  if (etat?.domaine) return afficherDomaine(etat.domaine, true);
  if (etat?.serie && etat.origine) return afficherDomaine(etat.origine, true);
  afficherAccueil();
}

/* Une place de série sans série en cours est MORTE (C1-bis, 22/10) : « Avant » après une sortie de
   série, ou la place d'une série perdue au rechargement. On ne l'affiche pas, on la quitte aussitôt
   (history.back) : l'écran du menu d'en dessous est déjà affiché, le popstate qui suit n'a rien à
   refaire. Deux places de série ne se suivent jamais (« Encore », « Refaire » réutilisent la place) :
   ce retour ne peut pas boucler. */
let placeMorteQuittee = false;
function quitterPlaceMorte() {
  placeMorteQuittee = true;
  history.back();
}
// L'état reçu est-il celui du menu déjà affiché ?
const dejaAffiche = (etat) =>
  (ecran === "accueil" && etat === null) || (ecran === "domaine" && etat?.domaine === domaine);

/* Sortir d'une série (Menu, Quitter, Retour et Changer de notions du bilan, geste retour) : on revient
   au menu d'où on l'a lancée — le domaine, ou l'accueil —, sélection gardée. Quand la série occupe une
   place dans l'historique, on la rend (history.back) : popstate affiche le menu de l'état précédent. */
function sortirDeLaSerie() {
  arreterHorloge();
  document.querySelectorAll("dialog").forEach((dialogue) => dialogue.remove());
  if (etatHistorique()?.serie) return history.back();
  if (domaine) afficherDomaine(domaine, true);
  else afficherAccueil();
}

function retour() {
  if (ecran === "question" || ecran === "bilan") return sortirDeLaSerie();
  if (ecran === "accueil") {
    location.href = "/";
    return;
  }
  // La carte du domaine referme : on rend la place prise dans l'historique si elle est à nous.
  if (ecran === "domaine" && etatHistorique()?.domaine) return history.back();
  afficherAccueil();
}

function relierActions(racine = application) {
  const actions = {
    // « Retour » du bilan du diaporama : comme « Menu », là d'où la série a été lancée.
    accueil: () => (ecran === "bilan" ? sortirDeLaSerie() : afficherAccueil()),
    retour,
    brevet: afficherBrevet,
    "brevet-commencer": () => lancer({ mode: "exam", nombre: 9 }),
    lancer: lancerSelection,
    aide: basculerAide,
    etape: () => ouvrirAide(true),
    clavier: basculerClavier,
    "fermer-aide": fermerAide,
    cours: ouvrirCours,
    correction: basculerExplication,
    explication: basculerExplication,
    reponse: basculerReponse,
    passer,
    valider,
    suivante,
    precedente: () => changerQuestion(seance.index - 1),
    pause: basculerPause,
    projeter,
    "projeter-reglages": ouvrirReglagesProjection,
    "plein-ecran": () =>
      document.fullscreenElement
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen(),
    encore: () => lancer({ ...seance.options, graine: nouvelleGraine() }),
    refaire: refaireErreurs,
    changer: () => sortirDeLaSerie(),
  };
  racine.querySelectorAll("[data-action]").forEach((element) => {
    element.onclick = (evenement) => {
      evenement.preventDefault();
      actions[element.dataset.action]?.();
    };
  });
  racine.querySelectorAll("[data-niveau]").forEach((element) => {
    element.onclick = () => changerNiveau(element.dataset.niveau);
  });
  // Le nombre de questions : boutons (à partir de 700 px) ou liste « 10 questions ▾ » (téléphone).
  const choisirNombre = (valeur) => {
    if (![5, 10, 15, 20].includes(valeur)) return;
    preferences.nombre = valeur;
    sauverPreferences();
    if (ecran === "accueil") afficherAccueil();
    else majLancement();
  };
  racine.querySelectorAll("[data-nombre]").forEach((element) => {
    element.onclick = () => choisirNombre(Number(element.dataset.nombre));
  });
  racine.querySelectorAll("[data-choix-nombre]").forEach((element) => {
    element.onchange = () => choisirNombre(Number(element.value));
  });
  racine.querySelectorAll("[data-domaine]").forEach((element) => {
    element.onclick = () => afficherDomaine(element.dataset.domaine);
  });
  racine.querySelectorAll("[data-question]").forEach((element) => {
    element.onclick = () => changerQuestion(Number(element.dataset.question));
  });
}

function ajusterAffichage() {
  requestAnimationFrame(() => {
    rectifierElisions(application);
    fitMathExpressions(application);
    ajusterQuestion();
    ajusterEchelle();
  });
}

function rectifierElisions(racine) {
  racine.querySelectorAll("span.math-expression").forEach((expression) => {
    if (
      expression.textContent === "n" &&
      /^['’]est\b/u.test(expression.nextSibling?.textContent || "")
    ) {
      expression.replaceWith(document.createTextNode("n"));
    }
  });
}

/* La règle de taille de la coque V2 (fonction ajuster de la maquette, portée ici). Priorité : la
   question (texte + cases) > la figure de la question (≥ 70 %) > le dessin d'aide (≥ 76 %) > le
   clavier. La figure fait partie de la question : sa taille se fixe à l'arrivée et ne change plus
   quand l'aide s'ouvre (K1). Le dessin d'aide grandit jusqu'à × 1,5 si la fenêtre fait 700 px de
   large ou plus, × 2,2 en projection. Si l'aide ne tient toujours pas, le clavier se range ; toucher
   une case le fait revenir (ciblerChamp). Sans aide ouverte, seule la figure se réduit (jusqu'à
   60 %) pour que la question tienne.
   Les pourcentages se comptent sur la taille de départ du dessin, ramenée à sa taille naturelle au
   plus : un dessin du moteur plus large que la colonne (550 px) part déjà réduit à la largeur. */
function largeurNaturelle(dessin) {
  return dessin.viewBox?.baseVal?.width || parseFloat(dessin.getAttribute("width")) || 0;
}

function poserDessin(dessin, echelle) {
  if (!dessin) return;
  dessin.style.width = `${Math.round(largeurNaturelle(dessin) * echelle)}px`;
  dessin.style.maxWidth = "none";
  dessin.style.maxHeight = "none";
  dessin.style.height = "auto";
  dessin.dataset.echelle = echelle.toFixed(2);
}

function reduireCalculs(zone) {
  // Un calcul trop long pour la largeur se réduit (comme fitMathExpressions), jamais sous 70 %.
  zone.querySelectorAll(".carte .calcul:not(.phrase)").forEach((calcul) => {
    calcul.style.fontSize = "";
    calcul.style.flexWrap = "";
    calcul.classList.remove("long");
    // K12 : la case d'une réponse-expression est sur la ligne suivante ; seul le calcul se mesure,
    // et il ne descend pas sous 90 % (70 % pour une réponse numérique, la case à côté).
    const dessous = calcul.classList.contains("expression-dessous");
    const caches = dessous ? [...calcul.querySelectorAll(":scope > .saut, :scope > .case")] : [];
    caches.forEach((element) => (element.style.display = "none"));
    const plancher = dessous ? 0.9 : 0.7;
    const base = parseFloat(getComputedStyle(calcul).fontSize);
    const trop = () => calcul.scrollWidth > calcul.clientWidth + 1;
    let taille = base;
    while (trop() && taille - 1 >= base * plancher) calcul.style.fontSize = `${(taille -= 1)}px`;
    calcul.style.flexWrap = "nowrap";
    while (trop() && taille - 1 >= base * plancher) calcul.style.fontSize = `${(taille -= 1)}px`;
    if (trop()) calcul.style.flexWrap = "wrap";
    // Encore trop large : le texte du calcul passe à la ligne entre ses termes, la case suit.
    if (trop()) calcul.classList.add("long");
    if (dessous) calcul.style.flexWrap = "wrap";
    caches.forEach((element) => (element.style.display = ""));
  });
  largeurCasesExpression(zone);
}

// La taille de la figure trouvée à l'arrivée sur la question (même question, même fenêtre) : ouvrir ou
// fermer l'aide, l'explication ou la bulle ne la change plus (K1) — la question ne bouge pas (R5b).
let figureGardee = { cle: "", echelle: 1 };
function ajusterQuestion() {
  const zone = document.querySelector(".espace-question");
  if (!zone || ecran !== "question") return;
  reduireCalculs(zone);
  const projection = seance?.mode === "project";
  // Tous les dessins visibles sous la carte (K3 : querySelectorAll, pas seulement le premier).
  const aides = [...zone.querySelectorAll(".aide .dessin svg, .explication .dessin svg")];
  const figure = zone.querySelector(".carte .figure > svg");
  const aideOuverte = Boolean(zone.querySelector(".aide, .explication"));
  const trop = () => zone.scrollHeight > zone.clientHeight + 1;
  const depart = (dessin, maximum) => {
    const naturelle = dessin ? largeurNaturelle(dessin) : 0;
    return naturelle ? Math.min(maximum, dessin.parentElement.clientWidth / naturelle) : 0;
  };
  const maxAide = projection ? 2.2 : innerWidth >= 700 ? 1.5 : 1;
  const cle = [seance.id, seance.index, innerWidth, innerHeight].join("|");
  if (figure && figureGardee.cle === cle) poserDessin(figure, figureGardee.echelle);
  else if (figure) {
    aides.forEach((dessin) => poserDessin(dessin, 0.2));
    let echelleFigure = depart(figure, 1);
    // K9 : jamais sous 60 % de la taille d'origine (viewBox), 70 % avec l'aide ouverte — sauf si
    // la colonne est déjà plus étroite que ça. Au-delà, la zone défile (montrerCaseActive).
    const planFigure = Math.min(echelleFigure, aideOuverte ? 0.7 : 0.6);
    poserDessin(figure, echelleFigure);
    while (trop() && echelleFigure - 0.02 >= planFigure)
      poserDessin(figure, (echelleFigure -= 0.02));
    figureGardee = { cle, echelle: echelleFigure };
  }
  // Le dessin d'aide posé sur la figure (aideSurFigure) prend exactement sa boîte : rien ne bouge.
  const calque = zone.querySelector(".carte .figure > .figure-aide");
  if (calque && figure) {
    // Un SVG n'a pas d'offsetLeft : on mesure sa boîte par rapport à celle de la figure.
    const boite = figure.getBoundingClientRect();
    const cadre = figure.parentElement.getBoundingClientRect();
    Object.assign(calque.style, {
      left: `${boite.left - cadre.left}px`,
      top: `${boite.top - cadre.top}px`,
      width: `${boite.width}px`,
      height: `${boite.height}px`,
    });
  }
  // Les dessins se réduisent ensemble, du même facteur, chacun jusqu'à 76 % de son départ.
  const essayer = () => {
    const departs = aides.map((dessin) => depart(dessin, maxAide));
    const poser = (facteur) =>
      aides.forEach((dessin, rang) => {
        const plancher = 0.76 * Math.min(1, departs[rang]);
        poserDessin(dessin, Math.max(plancher, departs[rang] * facteur));
      });
    let facteur = 1;
    poser(facteur);
    const plancher = Math.min(...departs.map((d) => (0.76 * Math.min(1, d)) / (d || 1)));
    while (trop() && aides.length && facteur - 0.02 >= plancher) poser((facteur -= 0.02));
  };
  essayer();
  const clavier = document.querySelector(".clavier");
  if (trop() && aideOuverte && clavier && !clavier.hidden && !garderClavier) {
    clavier.hidden = true;
    document.body.classList.remove("clavier-ouvert");
    document.body.dataset.clavierRange = "1";
    essayer();
  }
  montrerCaseActive(zone);
  montrerPanneauAide(zone);
}

/* K9 : si la question ne tient pas au-dessus du clavier (la figure ne descend plus sous 60 %), la
   zone défile juste assez pour que la case active reste visible. */
function montrerCaseActive(zone) {
  const kase = zone.querySelector(".champ.active") || zone.querySelector(".carte .reponses");
  if (!kase) return;
  const cadre = zone.getBoundingClientRect();
  const boite = kase.getBoundingClientRect();
  if (boite.bottom > cadre.bottom + 1)
    zone.scrollTop += Math.min(boite.bottom - cadre.bottom, boite.top - cadre.top);
}

/* K7 : si, malgré les réductions, le panneau d'aide s'ouvre en partie sous le bas de la zone, la
   zone défile toute seule juste assez pour le montrer (comme scrollIntoView « nearest », sans
   animation). La question ne change pas de place dans la page ; la case active doit rester visible :
   si les deux ne tiennent pas ensemble, la case passe d'abord (on s'arrête quand elle atteindrait le
   haut de la zone). */
function montrerPanneauAide(zone) {
  const panneau = zone.querySelector(":scope > .aide");
  if (!panneau) return;
  const cadre = zone.getBoundingClientRect();
  const boite = panneau.getBoundingClientRect();
  if (boite.bottom <= cadre.bottom + 1) return;
  const besoin = Math.min(boite.bottom - cadre.bottom, boite.top - cadre.top);
  const kase = zone.querySelector(".champ.active") || zone.querySelector(".carte .reponses");
  const marge = kase ? kase.getBoundingClientRect().top - cadre.top : besoin;
  const pas = Math.max(0, Math.min(besoin, marge));
  if (pas > 0) zone.scrollTop += pas;
}

function ajusterEchelle() {
  const racine = document.documentElement;
  const coque = document.querySelector(".coque");
  const projection = document.body.classList.contains("projection");
  // Sans en-tête, la marge autour du cadre est la même partout : haut et bas de la coque.
  const marge = 72;
  racine.style.setProperty("--echelle", "1");
  racine.style.setProperty("--hauteur-cadre", `${innerHeight - marge}px`);
  // L'écran de question occupe toute la hauteur et règle lui-même ses tailles (ajusterQuestion).
  if (telephone() || !coque || projection || ecran === "question") return;
  // Défi tables : mesurer aussi le contenu, puis retenir la plus grande échelle qui tient.
  const zone = ecran === "accueil" ? document.querySelector(".contenu") : null;
  const tient = (echelle) => {
    racine.style.setProperty("--echelle", echelle.toFixed(3));
    racine.style.setProperty("--hauteur-cadre", `${innerHeight / echelle - marge}px`);
    return (
      coque.getBoundingClientRect().bottom <= innerHeight - 4 &&
      (!zone || zone.scrollHeight <= zone.clientHeight + 1)
    );
  };
  if (tient(1)) return;
  let min = 0.75;
  let max = 1;
  for (let i = 0; i < 10; i++) {
    const milieu = (min + max) / 2;
    if (tient(milieu)) min = milieu;
    else max = milieu;
  }
  tient(min);
}

function lireAdresse() {
  const params = new URLSearchParams(location.search);
  // L'ancienne page Diaporama (?prof=1) n'existe plus : l'adresse ouvre l'accueil.
  if (params.get("prof") === "1") history.replaceState(null, "", location.pathname);
  // Rechargement (P12) : dans un domaine, on y reste. Pendant une série (elle est perdue), on affiche
  // le menu d'origine et on rend la place : l'entrée d'avant est ce menu. La place garde son état de
  // série : atteinte plus tard par « Avant », elle est reconnue morte (C1-bis).
  const etat = etatHistorique();
  if (!location.search && etat?.domaine) return afficherDomaine(etat.domaine, true);
  if (!location.search && etat?.serie) {
    afficherMenuSelon(etat);
    history.replaceState(etat, "", location.pathname);
    return quitterPlaceMorte();
  }
  const niveau = params.get("niveau");
  if (NIVEAUX.includes(niveau)) filtre = niveau;
  const valeur = Number(params.get("graine"));
  const graine =
    Number.isInteger(valeur) && valeur > 0 && valeur <= 2147483647 ? valeur : nouvelleGraine();
  const notion = params.get("notion");
  if (parId[notion]?.valide) {
    let forme = params.get("forme") || "a";
    if (/^\d+$/.test(forme)) forme = parId[notion].formes[Number(forme)]?.id;
    else if (!/^[a-z]$/.test(forme)) forme = alias[forme]?.forme;
    if (parId[notion].formes.some((entree) => entree.id === forme)) {
      const question = genererQuestion(notion, forme, graine);
      const mode = params.get("mode") === "project" ? "project" : "train";
      return lancer({ mode, ids: [notion], nombre: 1, graine }, [question]);
    }
  }
  const ids = (params.get("notions") || "").split(",").filter((id) => parId[id]?.valide);
  if (ids.length) {
    // Tout ce qui vient de l'adresse est relu et borné : un lien trafiqué ne peut rien imposer d'autre.
    const entier = (cle, min, max, defaut) => {
      const x = Number(params.get(cle));
      return params.has(cle) && Number.isInteger(x) && x >= min && x <= max ? x : defaut;
    };
    const options = {
      mode: "train",
      ids,
      nombre: entier("nombre", 1, 40, 8),
      graine,
      partagee: true,
    };
    // Un ancien lien « niveau=brevet » tire ses questions au niveau brevet, comme avant, pour cette
    // série seulement : le niveau choisi sur l'appareil ne change pas.
    if (niveau === "brevet") options.filtre = "brevet";
    return lancer(options);
  }
  afficherAccueil();
}

window.addEventListener("resize", ajusterAffichage);
// Retour et avant (P12) : piloté par l'état reçu. Sur une question ou le bilan, on sort de la série
// comme avec « Menu » ; ailleurs, on affiche le menu de l'état (domaine connu, sinon l'accueil), et
// une place de série, morte, est quittée sans rien afficher.
window.addEventListener("popstate", () => {
  const etat = etatHistorique();
  if (ecran === "question" || ecran === "bilan") {
    arreterHorloge();
    document.querySelectorAll("dialog").forEach((dialogue) => dialogue.remove());
    // Encore une place de série (retour depuis une série plus récente) : on continue à sortir.
    if (etat?.serie) return history.back();
    return afficherMenuSelon(etat);
  }
  if (etat?.serie) return quitterPlaceMorte();
  const revenu = placeMorteQuittee;
  placeMorteQuittee = false;
  if (revenu && dejaAffiche(etat)) return;
  afficherMenuSelon(etat);
});
document.addEventListener("keydown", (evenement) => {
  if (ecran !== "question" || seance.mode !== "project" || document.querySelector("dialog[open]"))
    return;
  if (evenement.key === " ") {
    evenement.preventDefault();
    basculerPause();
  }
  if (evenement.key === "ArrowRight") suivante();
  if (evenement.key === "ArrowLeft") changerQuestion(seance.index - 1);
});
document.fonts.ready.then(ajusterAffichage);
lireAdresse();
