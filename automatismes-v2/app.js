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
} from "./src/etat-lecteur.js?v=6";
import {
  obtenirNotionLecteur,
  RENDU_DIVISIBILITE,
  RENDU_SOLIDE,
  RENDU_VOLUME,
} from "./src/registre-lecteur.js?v=6";
import { COURS_SOLIDES_USUELS } from "../packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js?v=6";
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
let etat = creerEtatLecteur(lireConfiguration(window.location.search));

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
    const radio = question.reponse.type === "choix-unique";
    return `<button class="${classes}" data-action="choix" data-id="${echapper(choix.id)}"
      role="${radio ? "radio" : "checkbox"}" aria-checked="${selectionne}"
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

function nombreQuestion(question) {
  return question.enonce.find((bloc) => bloc.id === "nombre")?.valeur;
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

function rendreAideDivisibilite(question) {
  if (!etat.aideOuverte) return "";
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
    <aside class="panneau panneau-aide" id="panneau-aide" aria-labelledby="titre-aide">
      <div class="entete-panneau">
        <h2 id="titre-aide">Un coup de pouce</h2>
        <button class="fermer" data-action="fermer-aide" aria-label="Fermer l'aide">×</button>
      </div>
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
  const nombre = String(nombreQuestion(question));
  const chiffres = [...nombre];
  const somme = chiffres.reduce((total, chiffre) => total + Number(chiffre), 0);
  const attendus = question.reponse.attendus;
  const reponses = attendus.includes("aucun") ? ["Aucun"] : attendus;
  return `
    <div class="voile" data-action="fermer-correction" aria-hidden="true"></div>
    <aside class="panneau panneau-correction" id="panneau-correction" aria-labelledby="titre-correction">
      <div class="entete-panneau">
        <h2 id="titre-correction">Correction expliquée</h2>
        <button class="fermer" data-action="fermer-correction" aria-label="Fermer la correction">×</button>
      </div>
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

function rendreQuestionDivisibilite() {
  const question = questionCourante(etat);
  const nombre = nombreQuestion(question);
  const interactif = etat.configuration.mode === "interactif";
  const sansDiviseur = question.reponse.attendus.includes("aucun");
  return `
    <div class="${classesLecteur()}">
      ${rendreEntete()}
      <div class="espace-lecteur">
        <main class="carte-question">
          <p class="etiquette-notion">${echapper(nomNotion())}</p>
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
        ${rendreCours()}
      </div>
      ${interactif ? "" : rendreBarreEnseignant()}
    </div>`;
}

function rendreQuestionSolides() {
  const question = questionCourante(etat);
  const bloc = blocSolide(question);
  const interactif = etat.configuration.mode === "interactif";
  return `
    <div class="${classesLecteur()}">
      ${rendreEntete()}
      <div class="espace-lecteur">
        <main class="carte-question carte-question-solides">
          <p class="etiquette-notion">${echapper(nomNotion())}</p>
          <h1>${echapper(question.enonce[0].contenu)}</h1>
          ${rendreSolide(bloc, { taille: interactif ? 320 : 400 })}
          <p class="precision">${interactif ? "Choisis une seule réponse." : "Choisissez le nom du solide."}</p>
          <div class="grille-choix grille-solides ${interactif ? "" : "grille-projection"}"
            role="${interactif ? "radiogroup" : "group"}" aria-label="Noms proposés">
            ${rendreChoix(question)}
          </div>
          ${interactif ? `<div class="zone-actions">${rendreActionsEleve()}</div>` : ""}
        </main>
        ${rendreAide(question)}
        ${rendreCorrection(question)}
        ${rendreCours()}
      </div>
      ${interactif ? "" : rendreBarreEnseignant()}
    </div>`;
}

function rendreQuestionVolumes() {
  const question = questionCourante(etat);
  const bloc = blocSolide(question);
  const interactif = etat.configuration.mode === "interactif";
  return `
    <div class="${classesLecteur()}">
      ${rendreEntete()}
      <div class="espace-lecteur">
        <main class="carte-question carte-question-solides carte-question-volumes">
          <p class="etiquette-notion">${echapper(nomNotion())}</p>
          <h1>${echapper(question.enonce[0].contenu)}</h1>
          <div class="figure-et-donnees">
            ${rendreSolide(bloc, {
              taille: interactif ? 290 : 360,
              mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme),
              afficherMesures: ["cube", "pave", "cylindre"].includes(bloc.forme),
              afficherHauteur: bloc.forme === "cylindre",
            })}
            ${rendreDonneesVolume(bloc)}
          </div>
          <p class="precision">Calcul mental, sans calculatrice. Choisis une seule réponse.</p>
          <div class="grille-choix grille-solides grille-volumes ${interactif ? "" : "grille-projection"}"
            role="${interactif ? "radiogroup" : "group"}" aria-label="Volumes proposés">
            ${rendreChoix(question)}
          </div>
          ${interactif ? `<div class="zone-actions">${rendreActionsEleve()}</div>` : ""}
        </main>
        ${rendreAide(question)}
        ${rendreCorrection(question)}
        ${rendreCours()}
      </div>
      ${interactif ? "" : rendreBarreEnseignant()}
    </div>`;
}

const RENDUS_COURS = Object.freeze({
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
  const interactif = etat.configuration.mode === "interactif";
  return `
    <main class="ecran-pret ecran-bilan">
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

rendre();
