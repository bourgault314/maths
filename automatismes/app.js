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
  adresseSerie,
} from "./seances.js";
import {
  monterReponse,
  modeleQuestion,
  reglageForme,
  lireChamps,
  insererTexte,
  monterClavier,
  monterSignes,
} from "./champs.js";
import {
  accueilHTML,
  domaineHTML,
  questionHTML,
  professeurHTML,
  bilanHTML,
  brevetHTML,
  lancementHTML,
  coursHTML,
  bouton,
  ICONES,
} from "./vues.js";

const catalogue = await fetch("./catalogue/catalogue.json").then((reponse) => reponse.json());
const alias = await fetch("./catalogue/alias-gpt.json").then((reponse) => reponse.json());
const parId = Object.fromEntries(catalogue.map((famille) => [famille.id, famille]));
const application = document.querySelector("#app");
const preferences = lirePreferences();
const reglageProf = {
  nombre: 8,
  secondes: 45,
  delai: 4,
  correction: "each",
  automatique: false,
  aideOffice: false,
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
    const niveau = ["6e", "5e", "4e", "3e", "brevet"].includes(valeur.niveau)
      ? valeur.niveau
      : "brevet";
    return {
      niveau,
      nombre: [5, 10, 15, 20].includes(valeur.nombre) ? valeur.nombre : 10,
      garderAide: valeur.garderAide === true,
      clavierOrdinateur: valeur.clavierOrdinateur === true,
    };
  } catch {
    return { niveau: "brevet", nombre: 10, garderAide: false, clavierOrdinateur: false };
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
  // Pas d'en-tête hors du cadre : la barre du cadre porte « ← Retour » à gauche (sauf sur l'accueil)
  // et les pastilles Diaporama · Plein écran à droite. L'écran de question a sa propre barre.
  const pastilles = `<div class="barre-cadre-droite">
    ${ecran === "prof" ? "" : '<a class="pastille" href="?prof=1" data-action="prof">Diaporama</a>'}
    ${bouton(`${ICONES.pleinEcran}<span>Plein écran</span>`, "plein-ecran", "pastille", 'aria-label="Plein écran"')}
  </div>`;
  const barreCadre = question
    ? ""
    : `<div class="barre-cadre">${ecran === "accueil" ? "" : bouton("← Retour", "retour", "discret petit")}
      ${pastilles}</div>`;
  const pied = `<footer class="pied"><a class="logo" href="/" aria-label="Accueil maths et go">
    <img src="../assets/img/logos/mathsgo/logo-390.png" alt="maths&go"></a>
    <span>Sans calculatrice · Collège et brevet</span></footer>`;
  application.innerHTML = `<div class="coque">
    <main class="cadre">${barreCadre}<div class="contenu">${contenu}</div>
      ${ecran === "accueil" || ecran === "domaine" ? '<div id="lancement"></div>' : ""}</main>
    ${question ? "" : pied}
  </div>`;
  relierActions();
  majLancement();
  ajusterAffichage();
}

// La barre de lancement suit la sélection (accueil et domaines) ; rien de coché, pas de barre.
function majLancement() {
  const zone = document.querySelector("#lancement");
  if (!zone) return;
  zone.innerHTML = lancementHTML(selection.size, preferences.nombre);
  relierActions(zone);
  ajusterAffichage();
}

// La sélection de l'élève part avec sa série : elle est vidée au lancement.
function lancerSelection() {
  const ids = famillesEligibles(catalogue, filtre)
    .filter((famille) => selection.has(famille.id))
    .map((famille) => famille.id);
  if (!ids.length) return;
  selection.clear();
  lancer({ mode: "train", ids, nombre: preferences.nombre });
}

function afficherAccueil() {
  arreterHorloge();
  ecran = "accueil";
  seance = null;
  history.replaceState(null, "", location.pathname);
  cadre(accueilHTML(famillesEligibles(catalogue, filtre), filtre, selection));
}

function afficherDomaine(id) {
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

function afficherProfesseur() {
  arreterHorloge();
  ecran = "prof";
  history.replaceState(null, "", "?prof=1");
  cadre(professeurHTML(famillesEligibles(catalogue, filtre), filtre, reglageProf, selection));
  relierSelection();
}

function changerNiveau(niveau) {
  if (!["6e", "5e", "4e", "3e", "brevet"].includes(niveau)) return;
  if (ecran === "prof") lireReglages();
  filtre = niveau;
  preferences.niveau = niveau;
  sauverPreferences();
  // Les notions cochées qui ne sont plus de ce niveau quittent la sélection.
  const eligibles = new Set(famillesEligibles(catalogue, niveau).map((famille) => famille.id));
  for (const id of [...selection]) if (!eligibles.has(id)) selection.delete(id);
  if (ecran === "prof") afficherProfesseur();
  else if (ecran === "domaine") afficherDomaine(domaine);
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

function lancer(options, questionsImposees) {
  arreterHorloge();
  const graine = options.graine || nouvelleGraine();
  const configuration = { ...reglageProf, filtre, ...options, graine };
  try {
    const vues = options.partagee ? () => 0 : vuesForme;
    const questions = questionsImposees || creerSerie(catalogue, configuration, vues);
    seance = {
      id: crypto.randomUUID(),
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

function basculerReponse() {
  if (seance?.mode !== "project") return;
  etatCourant().reponseMontree = !etatCourant().reponseMontree;
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
  if (etat.correction) etat.aideOuverte = seance.mode === "project" && etat.aideOuverte;
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

function lireReglages() {
  for (const [cle, min, max] of [
    ["nombre", 1, 40],
    ["secondes", 5, 600],
    ["delai", 0, 60],
  ]) {
    const valeur = Number(document.getElementById(cle)?.value);
    reglageProf[cle] = Number.isFinite(valeur)
      ? Math.max(min, Math.min(max, Math.round(valeur)))
      : min;
  }
  reglageProf.correction = document.querySelector("#correction")?.value === "end" ? "end" : "each";
  reglageProf.automatique = Boolean(document.querySelector("#automatique")?.checked);
  reglageProf.aideOffice = Boolean(document.querySelector("#aide-office")?.checked);
}

// Une seule mécanique de sélection pour l'élève (écran de domaine) et le prof (page Diaporama) :
// une case par notion, une case « tout » par groupe, la même liste `selection`.
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

function majCasesTout() {
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
  return { ...reglageProf, filtre, ids, graine: nouvelleGraine(), partagee: true };
}

function projeter() {
  const options = optionsProfesseur();
  if (options) lancer({ ...options, mode: "project" });
}

function partager() {
  const options = optionsProfesseur();
  if (!options) return;
  const adresse = adresseSerie(options, location.href);
  const emplacement = document.querySelector("#lien-serie");
  emplacement.replaceChildren();
  emplacement.hidden = false;
  const lien = document.createElement("a");
  lien.href = adresse.href;
  lien.target = "_blank";
  lien.rel = "noopener";
  lien.textContent = "Ouvrir la série sur un écran ↗";
  emplacement.append(lien);
  const champ = document.createElement("input");
  champ.readOnly = true;
  champ.value = adresse.href;
  champ.setAttribute("aria-label", "Adresse de la série à copier");
  champ.onclick = () => champ.select();
  emplacement.append(champ);
  ajusterAffichage();
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

function retour() {
  if (ecran === "question") {
    arreterHorloge();
    if (seance.mode === "project") return afficherProfesseur();
    if (domaine) return afficherDomaine(domaine);
  }
  if (ecran === "accueil") {
    location.href = "/";
    return;
  }
  afficherAccueil();
}

function relierActions(racine = application) {
  const actions = {
    accueil: afficherAccueil,
    retour,
    prof: afficherProfesseur,
    brevet: afficherBrevet,
    "brevet-commencer": () => lancer({ mode: "exam", nombre: 9 }),
    lancer: lancerSelection,
    aide: () => (etatCourant().aideOuverte ? fermerAide() : ouvrirAide()),
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
    partager,
    "plein-ecran": () =>
      document.fullscreenElement
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen(),
    encore: () => lancer({ ...seance.options, graine: nouvelleGraine() }),
    refaire: refaireErreurs,
    changer: () => (domaine ? afficherDomaine(domaine) : afficherAccueil()),
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
  racine.querySelectorAll("[data-nombre]").forEach((element) => {
    element.onclick = () => {
      const valeur = Number(element.dataset.nombre);
      if (![5, 10, 15, 20].includes(valeur)) return;
      preferences.nombre = valeur;
      sauverPreferences();
      majLancement();
    };
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
   clavier. Le dessin d'aide grandit jusqu'à × 1,5 si la fenêtre fait 700 px de large ou plus, × 2,2 en
   projection. Si l'aide ne tient toujours pas, le clavier se range ; toucher une case le fait revenir
   (ciblerChamp). Sans aide ouverte, seule la figure se réduit (jusqu'à 60 %) pour que la question tienne.
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
    const base = parseFloat(getComputedStyle(calcul).fontSize);
    const trop = () => calcul.scrollWidth > calcul.clientWidth + 1;
    let taille = base;
    while (trop() && taille > base * 0.7) calcul.style.fontSize = `${(taille -= 1)}px`;
    calcul.style.flexWrap = "nowrap";
    while (trop() && taille > base * 0.7) calcul.style.fontSize = `${(taille -= 1)}px`;
    if (trop()) calcul.style.flexWrap = "wrap";
  });
}

function ajusterQuestion() {
  const zone = document.querySelector(".espace-question");
  if (!zone || ecran !== "question") return;
  reduireCalculs(zone);
  const projection = seance?.mode === "project";
  const aide = zone.querySelector(".aide .dessin svg, .explication .dessin svg");
  const figure = zone.querySelector(".carte .figure > svg");
  const aideOuverte = Boolean(zone.querySelector(".aide, .explication, .bulle-aide"));
  const trop = () => zone.scrollHeight > zone.clientHeight + 1;
  const depart = (dessin, maximum) => {
    const naturelle = dessin ? largeurNaturelle(dessin) : 0;
    return naturelle ? Math.min(maximum, dessin.parentElement.clientWidth / naturelle) : 0;
  };
  const maxAide = projection ? 2.2 : innerWidth >= 700 ? 1.5 : 1;
  const essayer = () => {
    let echelleAide = depart(aide, maxAide);
    let echelleFigure = depart(figure, 1);
    const planAide = 0.76 * Math.min(1, echelleAide);
    const planFigure = (aideOuverte ? 0.7 : 0.6) * echelleFigure;
    poserDessin(aide, echelleAide);
    poserDessin(figure, echelleFigure);
    while (trop() && aide && echelleAide - 0.02 >= planAide)
      poserDessin(aide, (echelleAide -= 0.02));
    while (trop() && figure && echelleFigure - 0.02 >= planFigure)
      poserDessin(figure, (echelleFigure -= 0.02));
  };
  essayer();
  const clavier = document.querySelector(".clavier");
  if (trop() && aideOuverte && clavier && !clavier.hidden && !garderClavier) {
    clavier.hidden = true;
    document.body.classList.remove("clavier-ouvert");
    document.body.dataset.clavierRange = "1";
    essayer();
  }
}

function ajusterEchelle() {
  const racine = document.documentElement;
  const coque = document.querySelector(".coque");
  const projection = document.body.classList.contains("projection");
  // Sans en-tête, la marge autour du cadre est la même partout : haut de la coque, pied, bas.
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
  if (params.get("prof") === "1") return afficherProfesseur();
  const niveau = params.get("niveau");
  if (["6e", "5e", "4e", "3e", "brevet"].includes(niveau)) filtre = niveau;
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
    return lancer({
      mode: "train",
      ids,
      nombre: Number(params.get("nombre")) || 8,
      graine,
      partagee: true,
    });
  }
  afficherAccueil();
}

window.addEventListener("resize", ajusterAffichage);
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
