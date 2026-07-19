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
  lireConfiguration,
  nombreReussites,
  ouvrirAide,
  ouvrirCorrection,
  passerQuestionSuivante,
  questionCourante,
  recommencer,
  revelerReponse,
  validerSelection,
} from "./src/etat-lecteur.js";

const application = document.querySelector("#application");
let etat = creerEtatLecteur(lireConfiguration(window.location.search));

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

function rendreEcranPret() {
  const projection = etat.configuration.mode === "diaporama";
  return `
    <main class="ecran-pret">
      <div class="marque" aria-label="maths and go">
        <span class="marque-maths">maths</span><span class="marque-et">&amp;</span><span>go</span>
      </div>
      <p class="surtitre">Automatismes du DNB</p>
      <h1>${projection ? "Diaporama prêt" : "Prêt à commencer ?"}</h1>
      <section class="resume-seance" aria-label="Contenu de la séance">
        <strong>Critères de divisibilité</strong>
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
  return `
    <header class="entete-seance ${interactif ? "" : "entete-projection"}">
      <button class="bouton-entete" data-action="quitter" aria-label="Quitter la séance">Quitter</button>
      <span class="position" aria-label="Question ${index} sur ${total}">${index} / ${total}</span>
      ${interactif
        ? `<span class="score" aria-label="${nombreReussites(etat)} bonnes réponses">✓ ${nombreReussites(etat)}</span>
          <button class="bouton-entete bouton-aide" data-action="aide"
            ${aideDisponible ? "" : "disabled"}
            aria-expanded="${etat.aideOuverte}"
            aria-controls="panneau-aide">
            ${aideDisponible ? "Aide" : "Sans aide"}
          </button>`
        : `<span class="mode-court">Diaporama</span>`}
    </header>
    <div class="progression" aria-label="Progression : ${progression} %">
      <span style="width: ${progression}%"></span>
    </div>`;
}

function rendreChoix(question) {
  const interactif = etat.configuration.mode === "interactif";
  const choixVisibles = interactif
    ? question.reponse.choix
    : question.reponse.choix.filter((choix) => !choix.exclusif);
  return choixVisibles.map((choix) => {
    const selectionne = etat.selection.includes(choix.id);
    const attendu = question.reponse.attendus.includes(choix.id);
    const reveleCorrect = !interactif && etat.reponseRevelee && attendu;
    const estompe = !interactif && etat.reponseRevelee && !attendu;
    const classes = [
      "choix",
      selectionne ? "selectionne" : "",
      reveleCorrect ? "correct" : "",
      estompe ? "estompe" : "",
    ].filter(Boolean).join(" ");

    if (!interactif) {
      return `<div class="${classes}">
        ${reveleCorrect ? '<span class="coche" aria-hidden="true">✓</span>' : ""}
        <span>${echapper(choix.libelle)}</span>
        ${reveleCorrect ? '<span class="visuellement-cache">Correct</span>' : ""}
      </div>`;
    }
    return `<button class="${classes}" data-action="choix" data-id="${echapper(choix.id)}"
      aria-pressed="${selectionne}" ${etat.validation === null ? "" : "disabled"}>
      ${echapper(choix.libelle)}
    </button>`;
  }).join("");
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
      <button data-action="aide" ${aideDisponible ? "" : "disabled"}
        aria-expanded="${etat.aideOuverte}" aria-controls="panneau-aide">Aide</button>
      <button data-action="reponse" ${etat.reponseRevelee ? "disabled" : ""}>Réponse</button>
      <button data-action="correction" aria-expanded="${etat.correctionOuverte}"
        aria-controls="panneau-correction">Correction</button>
      <button data-action="suivant">${derniere ? "Terminer" : "Suivant"}</button>
    </nav>`;
}

function nombreQuestion(question) {
  return question.enonce.find((bloc) => bloc.id === "nombre")?.valeur;
}

function rendreAide(question) {
  if (!etat.aideOuverte) return "";
  const nombre = String(nombreQuestion(question));
  const blocs = question.aide?.blocs ?? [];
  const expression = etat.chiffresSomme.length === 0
    ? "Sélectionne les chiffres utiles."
    : `${etat.chiffresSomme.map((index) => nombre[index]).join(" + ")} = □`;
  const chiffresSomme = [...nombre].map((chiffre, index) => `
    <button class="chiffre-aide ${etat.chiffresSomme.includes(index) ? "actif" : ""}"
      data-action="chiffre-aide" data-index="${index}" aria-pressed="${etat.chiffresSomme.includes(index)}">
      ${chiffre}
    </button>`).join("");
  const unite = nombre.at(-1);
  return `
    <div class="voile" data-action="fermer-aide" aria-hidden="true"></div>
    <aside class="panneau panneau-aide" id="panneau-aide" aria-labelledby="titre-aide">
      <div class="entete-panneau">
        <h2 id="titre-aide">Un coup de pouce</h2>
        <button class="fermer" data-action="fermer-aide" aria-label="Fermer l'aide">×</button>
      </div>
      <section class="outil-aide">
        <h3>${echapper(blocs[0]?.contenu ?? "Observe le chiffre des unités.")}</h3>
        <div class="nombre-aide" aria-label="Nombre ${nombre}">
          ${nombre.slice(0, -1).split("").map((chiffre) => `<span>${chiffre}</span>`).join("")}
          <button data-action="unite-aide" class="unite-aide ${etat.uniteReperee ? "actif" : ""}"
            aria-pressed="${etat.uniteReperee}" aria-label="Chiffre des unités : ${unite}">${unite}</button>
        </div>
      </section>
      <section class="outil-aide">
        <h3>${echapper(blocs[1]?.contenu ?? "Additionne tous les chiffres.")}</h3>
        <div class="chiffres-aide">${chiffresSomme}</div>
        <output class="expression-aide">${echapper(expression)}</output>
      </section>
      <ul class="indices-aide">
        ${blocs.slice(2).map((bloc) => `<li>${echapper(bloc.contenu)}</li>`).join("")}
      </ul>
    </aside>`;
}

function rendreCorrection(question) {
  if (!etat.correctionOuverte) return "";
  const titres = ["Chiffre des unités", "Somme des chiffres", "Conclusion"];
  return `
    <div class="voile" data-action="fermer-correction" aria-hidden="true"></div>
    <aside class="panneau panneau-correction" id="panneau-correction" aria-labelledby="titre-correction">
      <div class="entete-panneau">
        <h2 id="titre-correction">Correction expliquée</h2>
        <button class="fermer" data-action="fermer-correction" aria-label="Fermer la correction">×</button>
      </div>
      ${question.correction.map((bloc, index) => `
        <section class="etape-correction">
          <h3>${titres[index]}</h3>
          <p>${echapper(bloc.contenu)}</p>
        </section>`).join("")}
    </aside>`;
}

function rendreQuestion() {
  const question = questionCourante(etat);
  const nombre = nombreQuestion(question);
  const interactif = etat.configuration.mode === "interactif";
  const sansDiviseur = question.reponse.attendus.includes("aucun");
  return `
    <div class="lecteur mode-${etat.configuration.mode} ${etat.aideOuverte || etat.correctionOuverte ? "panneau-ouvert" : ""}">
      ${rendreEntete()}
      <div class="espace-lecteur">
        <main class="carte-question">
          <p class="etiquette-notion">Critères de divisibilité</p>
          <h1>${echapper(question.enonce[0].contenu)}</h1>
          <p class="nombre-question">${echapper(nombre)}<span aria-hidden="true">.</span></p>
          <p class="precision">${interactif ? "Plusieurs réponses sont peut-être possibles." : "Quels nombres proposés conviennent ?"}</p>
          <div class="grille-choix ${interactif ? "" : "grille-projection"}" aria-label="Réponses proposées">
            ${rendreChoix(question)}
          </div>
          ${!interactif && etat.reponseRevelee && sansDiviseur
            ? '<p class="reponse-aucun" role="status">Réponse : aucun des nombres proposés.</p>'
            : ""}
          ${interactif ? `<div class="zone-actions">${rendreActionsEleve()}</div>` : ""}
        </main>
        ${rendreAide(question)}
        ${rendreCorrection(question)}
      </div>
      ${interactif ? "" : rendreBarreEnseignant()}
    </div>`;
}

function rendreBilan() {
  const interactif = etat.configuration.mode === "interactif";
  return `
    <main class="ecran-pret ecran-bilan">
      <p class="surtitre">Séance terminée</p>
      <h1>${interactif ? "Ton bilan" : "Diaporama terminé"}</h1>
      ${interactif
        ? `<p class="resultat-bilan"><strong>${nombreReussites(etat)}</strong><span>bonnes réponses sur ${etat.seance.nombreQuestions}</span></p>`
        : '<p class="texte-bilan">Toutes les questions ont été présentées.</p>'}
      <p class="notion-bilan">Critères de divisibilité</p>
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
  if (action === "suivant") passerQuestionSuivante(etat);
  if (action === "recommencer") etat = recommencer(etat);
  rendre({ focusPanneau });
});

rendre();
