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
  fermerAide,
  fermerCorrection,
  fermerCours,
  lireConfiguration,
  nombreReussites,
  ouvrirAide,
  ouvrirCorrection,
  ouvrirCours,
  passerQuestionSuivante,
  questionCourante,
  recommencer,
  revelerReponse,
  tournerSolide,
  validerSelection,
} from "./src/etat-lecteur.js?v=7";
import { choisirDisposition } from "./src/disposition.js?v=7";
import { obtenirNotionLecteur } from "./src/registre-lecteur.js?v=7";
import { echapper } from "./src/rendus/outils-rendu.js?v=7";
import { obtenirRenduLecteur } from "./src/rendus/registre-rendus.js?v=7";

const application = document.querySelector("#application");
let etat = creerEtatLecteur(lireConfiguration(window.location.search));
let disposition = choisirDisposition({
  largeur: window.innerWidth ?? document.documentElement.clientWidth ?? 1024,
  mode: etat.configuration.mode,
});

function definitionNotion() {
  return obtenirNotionLecteur(etat.configuration.notion);
}

function nomNotion() {
  return definitionNotion().nom;
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

function texteAide() {
  const libelles = {
    ouverte: "aide affichée",
    disponible: "aide accessible",
    indisponible: "sans aide",
  };
  return libelles[etat.configuration.aide];
}

function rendreEcranPret() {
  const projection = etat.configuration.mode === "diaporama";
  return `
    <main class="ecran-pret mode-${etat.configuration.mode} disposition-${disposition}">
      <div class="marque" aria-label="maths and go">
        <span class="marque-maths">maths</span><span class="marque-et">&amp;</span><span>go</span>
      </div>
      <p class="surtitre">Automatismes du DNB</p>
      <h1>${projection ? "Diaporama prêt" : "Prêt à commencer ?"}</h1>
      <section class="resume-seance" aria-label="Contenu de la séance">
        <strong>${echapper(nomNotion())}</strong>
        <span>${etat.configuration.nombreQuestions} ${etat.configuration.nombreQuestions === 1 ? "question" : "questions"}</span>
        <span>${echapper(texteAide())}</span>
      </section>
      <button class="bouton-principal bouton-large" data-action="demarrer">
        ${projection ? "Lancer le diaporama" : "Commencer"}
      </button>
    </main>`;
}

function rendreEntete() {
  const index = etat.seance.etat.indexQuestion + 1;
  const total = etat.seance.nombreQuestions;
  const interactif = etat.configuration.mode === "interactif";
  const aideDisponible = etat.configuration.aide !== "indisponible";
  const progression = Math.round((index / total) * 100);
  const boutonCours = aCoursNotion()
    ? `<button class="bouton-entete bouton-cours" data-action="cours"
        aria-expanded="${etat.coursOuvert}" aria-controls="panneau-cours">Cours</button>`
    : "";
  return `
    <header class="entete-seance ${interactif ? "" : "entete-projection"} ${aCoursNotion() ? "avec-cours" : ""}">
      <button class="bouton-entete" data-action="quitter" aria-label="Quitter la séance">Quitter</button>
      <span class="position" aria-label="Question ${index} sur ${total}">${index} / ${total}</span>
      ${interactif
        ? `<span class="score" aria-label="${nombreReussites(etat)} bonnes réponses">✓ ${nombreReussites(etat)}</span>
          ${boutonCours}
          <button class="bouton-entete bouton-aide" data-action="aide"
            ${aideDisponible ? "" : "disabled"}
            aria-expanded="${etat.aideOuverte}"
            aria-controls="panneau-aide">
            ${aideDisponible ? "Aide" : "Sans aide"}
          </button>`
        : `<span class="mode-court">Diaporama</span>${boutonCours}`}
    </header>
    <div class="progression" aria-label="Progression : ${progression} %">
      <span style="width: ${progression}%"></span>
    </div>`;
}

function rendreRetourValidation() {
  if (etat.erreurValidation) {
    return `<p class="message message-erreur" role="alert">${echapper(etat.erreurValidation)}</p>`;
  }
  if (etat.validation === null) return "";
  return etat.validation.juste
    ? '<p class="message message-reussite" role="status"><strong>Bravo !</strong> Ta réponse est correcte.</p>'
    : '<p class="message message-erreur" role="status"><strong>Pas encore.</strong> Ta sélection est conservée. Tu peux regarder la correction.</p>';
}

function rendreActionsEleve() {
  if (etat.validation === null) {
    return `
      ${rendreRetourValidation()}
      <button class="bouton-principal bouton-large" data-action="valider">Valider</button>`;
  }
  return `
    ${rendreRetourValidation()}
    <div class="actions-eleve">
      <button class="bouton-secondaire" data-action="correction">Voir la correction</button>
      <button class="bouton-principal" data-action="suivant">
        ${etat.seance.etat.indexQuestion + 1 === etat.seance.nombreQuestions ? "Voir le bilan" : "Question suivante"}
      </button>
    </div>`;
}

function rendreBarreEnseignant() {
  const aideDisponible = etat.configuration.aide !== "indisponible";
  const derniere = etat.seance.etat.indexQuestion + 1 === etat.seance.nombreQuestions;
  return `
    <nav class="barre-enseignant" aria-label="Commandes du diaporama">
      <span class="libelle-enseignant" aria-hidden="true">Enseignant</span>
      <button data-action="aide" ${aideDisponible ? "" : "disabled"}
        aria-expanded="${etat.aideOuverte}" aria-controls="panneau-aide">Aide</button>
      <button class="commande-reponse ${etat.reponseRevelee ? "active" : ""}"
        data-action="reponse" ${etat.reponseRevelee ? "disabled" : ""}>
        ${etat.reponseRevelee ? "Réponse affichée" : "Réponse"}
      </button>
      <button data-action="correction" aria-expanded="${etat.correctionOuverte}"
        aria-controls="panneau-correction">Correction</button>
      <button data-action="suivant">${derniere ? "Terminer" : "Suivant"}</button>
    </nav>`;
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
  return [
    "lecteur",
    `mode-${etat.configuration.mode}`,
    `disposition-${disposition}`,
    panneau ? "panneau-ouvert" : "",
    classePanneau,
  ].filter(Boolean).join(" ");
}

function creerContexteRendu() {
  return {
    etat,
    question: questionCourante(etat),
    nomNotion: nomNotion(),
    rendreActionsEleve,
  };
}

function rendreQuestion() {
  const contexte = creerContexteRendu();
  const rendu = obtenirRenduLecteur(definitionNotion().rendu);
  const cours = aCoursNotion() && rendu.cours ? rendu.cours(contexte) : "";
  return `<div class="${classesLecteur()}">
    ${rendreEntete()}
    <div class="espace-lecteur">
      ${rendu.question(contexte)}
      ${rendu.aide(contexte)}
      ${rendu.correction(contexte)}
      ${cours}
    </div>
    ${etat.configuration.mode === "interactif" ? "" : rendreBarreEnseignant()}
  </div>`;
}
function rendreBilan() {
  const interactif = etat.configuration.mode === "interactif";
  return `
    <main class="ecran-pret ecran-bilan mode-${etat.configuration.mode} disposition-${disposition}">
      <p class="surtitre">Séance terminée</p>
      <h1>${interactif ? "Ton bilan" : "Diaporama terminé"}</h1>
      ${interactif
        ? `<p class="resultat-bilan"><strong>${nombreReussites(etat)}</strong><span>bonnes réponses sur ${etat.seance.nombreQuestions}</span></p>`
        : '<p class="texte-bilan">Toutes les questions ont été présentées.</p>'}
      <p class="notion-bilan">${echapper(nomNotion())}</p>
      <button class="bouton-principal bouton-large" data-action="recommencer">Recommencer</button>
    </main>`;
}

function rendre({ focusPanneau = false } = {}) {
  const phase = etat.seance.etat.phase;
  application.innerHTML = phase === "prete"
    ? rendreEcranPret()
    : phase === "terminee"
      ? rendreBilan()
      : rendreQuestion();
  document.title = phase === "en-cours"
    ? `Question ${etat.seance.etat.indexQuestion + 1} — Automatismes maths&go`
    : "Automatismes maths&go";
  if (focusPanneau) {
    requestAnimationFrame(() => application.querySelector(".panneau .fermer")?.focus());
  }
}

application.addEventListener("click", (evenement) => {
  const cible = evenement.target.closest("[data-action]");
  if (!cible) return;
  const action = cible.dataset.action;
  let focusPanneau = false;
  if (action === "demarrer") demarrer(etat);
  if (action === "quitter") etat = recommencer(etat);
  if (action === "choix") basculerChoix(etat, cible.dataset.id);
  if (action === "valider") validerSelection(etat);
  if (action === "aide") {
    ouvrirAide(etat);
    focusPanneau = etat.aideOuverte;
  }
  if (action === "fermer-aide") fermerAide(etat);
  if (action === "unite-aide") basculerUniteAide(etat);
  if (action === "chiffre-aide") basculerChiffreAide(etat, Number(cible.dataset.index));
  if (action === "reponse") revelerReponse(etat);
  if (action === "correction") {
    ouvrirCorrection(etat);
    focusPanneau = etat.correctionOuverte;
  }
  if (action === "fermer-correction") fermerCorrection(etat);
  if (action === "cours") {
    ouvrirCours(etat);
    focusPanneau = etat.coursOuvert;
  }
  if (action === "fermer-cours") fermerCours(etat);
  if (action === "tourner-gauche") tournerSolide(etat, -22);
  if (action === "tourner-droite") tournerSolide(etat, 22);
  if (action === "suivant") passerQuestionSuivante(etat);
  if (action === "recommencer") etat = recommencer(etat);
  rendre({ focusPanneau });
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

window.addEventListener?.("resize", () => {
  const suivante = choisirDisposition({
    largeur: window.innerWidth ?? document.documentElement.clientWidth ?? 1024,
    mode: etat.configuration.mode,
  });
  if (suivante === disposition) return;
  disposition = suivante;
  rendre();
});

rendre();
