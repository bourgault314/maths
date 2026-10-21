import { esc } from "./generateurs/draw.js";
import { mathHtml } from "./math-format.js";
import { questionPrompt } from "./math-layout.js";
import { DOMAINES, formesEligibles } from "./seances.js";
import { modeleQuestion, reglageForme, ecrireReponse } from "./champs.js";
import { ICONES_DOMAINES } from "./icones-domaines.js";

export function bouton(texte, action, classe = "secondaire", attributs = "") {
  return `<button class="bouton ${classe}" data-action="${action}" ${attributs}>${texte}</button>`;
}

export function filtresHTML(filtre) {
  return `<div class="filtres" role="group" aria-label="Niveau">
    ${["6e", "5e", "4e", "3e", "brevet"]
      .map((niveau) => {
        const actif = filtre === niveau;
        return `<button class="bouton petit ${actif ? "primaire" : "secondaire"}"
        data-niveau="${niveau}" aria-pressed="${actif}">${niveau === "brevet" ? "Brevet" : niveau}</button>`;
      })
      .join("")}
  </div>`;
}

// Sur chaque carte : « n notions », ou « k sur n » dès que k notions du domaine sont cochées.
export function accueilHTML(familles, filtre, selection) {
  return `<section class="accueil">
    <h1>Automatismes</h1>
    ${filtresHTML(filtre)}
    <div class="domaines">${DOMAINES.map(([id, nom]) => {
      const liste = familles.filter((famille) => famille.domaine === id);
      const nombre = liste.length;
      const coches = liste.filter((famille) => selection.has(famille.id)).length;
      const compte = coches
        ? `${coches} sur ${nombre}`
        : `${nombre} notion${nombre > 1 ? "s" : ""}`;
      return `<button class="domaine-carte ${coches ? "avec-selection" : ""}" data-domaine="${id}" ${nombre ? "" : "disabled"}>
        <span class="icone" aria-hidden="true">${ICONES_DOMAINES[id] || ""}</span>
        <span class="nom">${nom}<small>${compte}</small></span><span class="chevron" aria-hidden="true">›</span>
      </button>`;
    }).join("")}</div>
    ${bouton("Entraînement brevet · 9 questions · 20 min", "brevet", "secondaire brevet")}
  </section>`;
}

/* La barre de lancement, en bas du cadre sur l'accueil et les domaines, dès qu'une notion est cochée :
   « N notions » · 5 · 10 · 15 · 20 · Lancer. Absente quand rien n'est coché. */
export function lancementHTML(compte, nombre) {
  if (!compte) return "";
  return `<div class="barre-lancement">
    <span class="compte" aria-live="polite">${compte} notion${compte > 1 ? "s" : ""}</span>
    ${nombreHTML(nombre)}${bouton("Lancer", "lancer", "orange")}
  </div>`;
}

function nombreHTML(nombre) {
  return `<div class="nombre-questions" role="group" aria-label="Nombre de questions">
    <span>Questions</span>${[5, 10, 15, 20]
      .map(
        (valeur) =>
          `<button class="bouton petit ${valeur === nombre ? "primaire" : "secondaire"}" data-nombre="${valeur}"
      aria-pressed="${valeur === nombre}">${valeur}</button>`,
      )
      .join("")}</div>`;
}

/* Le domaine : une case par notion (toute la ligne coche ou décoche), « Tout le domaine » en tête.
   Un tap ne lance rien : la série part de la barre de lancement. */
export function domaineHTML(domaine, familles, filtre, selection) {
  const nom = DOMAINES.find(([id]) => id === domaine)?.[1] || "Notions";
  const tout = familles.length && familles.every((famille) => selection.has(famille.id));
  return `<div class="entete-domaine"><span class="icone" aria-hidden="true">${ICONES_DOMAINES[domaine] || ""}</span>
    <h1>${nom}</h1></div>
    <div class="reglages-domaine">${filtresHTML(filtre)}</div>
    <div class="liste-notions groupe-selection">
      <label class="notion tout-domaine"><input type="checkbox" data-selection-domaine="${domaine}"
        ${tout ? "checked" : ""}><span class="nom">Tout le domaine</span></label>
      ${familles
        .map((famille) => {
          const formes = formesEligibles(famille, filtre);
          return `<label class="notion"><input type="checkbox" data-selection="${famille.id}"
          ${selection.has(famille.id) ? "checked" : ""}>
          <span class="nom">${esc(famille.nom)}<span class="badges">
            <span class="badge">${famille.niveaux.join(" · ")}</span>
            ${formes.some((forme) => forme.brevet) ? '<span class="badge brevet">Brevet</span>' : ""}
          </span></span></label>`;
        })
        .join("")}</div>`;
}

export function enonceHTML(question, pastille = "") {
  return `<div class="enonce">${pastille}<h1>${questionPrompt(question)}</h1>
    ${question.math ? `<div class="calcul">${mathHtml(question.math)}</div>` : ""}
    ${question.visual ? `<div class="figure">${question.visual}</div>` : ""}
  </div>`;
}

/* L'aide (coque V2, C5) : sous la carte, dans la zone de la question ; le clavier reste. En-tête :
   Aide · « Encore un indice » (l'ancienne « Une étape ») · ×. Correction après C7 (K1) : une question
   avec figure a aussi son aide SOUS la carte (sa phrase, et son dessin s'il n'est pas la figure) ; la
   bulle posée sur la figure n'existe que si la forme a un champ coinAide (rempli par les cahiers une
   fois le coin vérifié vide pour tous les tirages). */
function boutonIndice(question, etat) {
  if (!question.hints?.[1]?.text) return "";
  return bouton("Encore un indice", "etape", "indice", etat.etape ? "disabled" : "");
}

const COINS = ["haut-gauche", "haut-droite", "bas-gauche", "bas-droite"];
function enBulle(question, reglages) {
  return Boolean(question.visual && COINS.includes(reglages?.coinAide));
}

export function aideHTML(question, etat, projection = false, reglages = {}) {
  if (!etat.aideOuverte || enBulle(question, reglages)) return "";
  const dessin = question.hints?.[0]?.svg || "";
  const montrer = dessin && dessin !== question.visual;
  const fermer = projection
    ? ""
    : bouton("×", "fermer-aide", "fermer", 'aria-label="Fermer l’aide"');
  return `<section class="aide${projection ? " aide-projetee" : ""}" aria-label="Aide">
    <div class="aide-entete"><strong>${ICONES.aide}Aide</strong>
      <span class="aide-boutons">${boutonIndice(question, etat)}${fermer}</span></div>
    <p>${mathHtml(question.hints?.[0]?.text || "")}</p>
    ${montrer ? `<div class="dessin">${dessin}</div>` : ""}
    ${etat.etape ? `<div class="etape">${mathHtml(question.hints?.[1]?.text || "")}</div>` : ""}
  </section>`;
}

/* La figure de la question, toujours en place. Avec coinAide seulement, l'aide ouverte est une bulle
   posée dans ce coin de la figure. */
export function figureHTML(question, etat, reglages = {}) {
  if (!question.visual) return "";
  const bulle =
    etat.aideOuverte && enBulle(question, reglages)
      ? `<div class="bulle-aide ${reglages.coinAide}" role="note" aria-label="Aide">${ICONES.aide}
      <span>${mathHtml(question.hints?.[0]?.text || "")}</span>
      ${etat.etape ? `<span class="etape">${mathHtml(question.hints?.[1]?.text || "")}</span>` : ""}
      ${etat.etape ? "" : boutonIndice(question, etat)}</div>`
      : "";
  return `<div class="figure">${question.visual}${bulle}</div>`;
}

/* « Voir l'explication » (C7) : sous la question, au même endroit que l'aide, pas de fenêtre ; la
   solution de la question et son dessin (celui de l'aide, sauf s'il n'est que la figure). */
export function explicationHTML(question, fermer = true) {
  const dessin = question.hints?.[0]?.svg || "";
  const montrer = dessin && dessin !== question.visual;
  return `<section class="explication" aria-label="L’explication">
    <div class="aide-entete"><strong>L’explication</strong>
      ${fermer ? bouton("×", "explication", "fermer", 'aria-label="Cacher l’explication"') : ""}</div>
    <p class="solution">${mathHtml(question.solution || "")}</p>
    ${montrer ? `<div class="dessin">${dessin}</div>` : ""}
  </section>`;
}

export function pointsHTML(seance) {
  return `<nav class="navigation-points" aria-label="Questions de la série">
    ${seance.questions
      .map((question, rang) => {
        const classe = [
          rang === seance.index ? "active" : "",
          seance.etats[rang].reponses.some(Boolean) ? "rempli" : "",
        ];
        return `<button class="point ${classe.join(" ")}" data-question="${rang}"
        aria-label="Question ${rang + 1}" ${rang === seance.index ? 'aria-current="step"' : ""}>${rang + 1}</button>`;
      })
      .join("")}</nav>`;
}

export const ICONES = {
  questions:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2.5" ' +
    'fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 8h8M8 12h8M8 16h5" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  chrono:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" ' +
    'stroke="currentColor" stroke-width="2"/><path d="M12 9v4l3 2M9 2h6" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round"/></svg>',
  sansAide:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.55 ' +
    '1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.55 1.1-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 4l16 16" fill="none" ' +
    'stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  corrections:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" ' +
    'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clavier:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" ' +
    'rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 9h1M10 ' +
    '9h1M13.5 9h1M17 9h1M6.5 12.5h1M10 12.5h1M13.5 12.5h1M17 12.5h1M8 16h8" fill="none" ' +
    'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  pleinEcran:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 ' +
    '20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ' +
    'stroke-linejoin="round"/></svg>',
  cours:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.4c2.8-.9 5.3-.45 7.5 ' +
    "1.25v12c-2.2-1.7-4.7-2.15-7.5-1.25zM20.5 5.4c-2.8-.9-5.3-.45-7.5 1.25v12c2.2-1.7 4.7-2.15 " +
    '7.5-1.25z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round"/><path d="M12 6.8v11.8" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round"/></svg>',
  aide:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 ' +
    '10.8c.7.55 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.55 1.1-2.1A6 6 0 0 0 12 3z" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round"/></svg>',
};

/* Le haut de l'écran de question, sur une ligne, dans les trois modes (coque d'après la V2) :
   entraînement  ← Menu · n sur N · ✓ score (· clavier · plein écran sur ordinateur)
   brevet        ← Menu · n sur N · chrono (· clavier · plein écran sur ordinateur)
   projection    ← Quitter · n sur N · minuteur · Pause · plein écran
   Le nom de la notion (ou « Entraînement brevet ») est une pastille en tête de la carte. */
function boutonClavier(clavier) {
  const libelle = `${clavier ? "Cacher" : "Afficher"} le clavier`;
  return bouton(
    ICONES.clavier,
    "clavier",
    "secondaire icone-bouton clavier-bascule",
    `aria-pressed="${clavier}" aria-label="${libelle}" title="Clavier"`,
  );
}

export function barreQuestionHTML(seance, clavier) {
  const exam = seance.mode === "exam";
  const projection = seance.mode === "project";
  const justes = seance.etats.filter((e) => e.juste).length;
  const retour = projection ? "Quitter" : "Menu";
  const pleinEcran = bouton(
    ICONES.pleinEcran,
    "plein-ecran",
    "secondaire icone-bouton plein-ecran",
    'aria-label="Plein écran" title="Plein écran"',
  );
  const droite = projection
    ? `<span class="minuteur"><span id="temps" role="timer"></span></span>
      ${bouton(seance.pause ? "Reprendre" : "Pause", "pause", "secondaire pause")}${pleinEcran}`
    : `${
        exam
          ? '<span class="minuteur chrono"><span id="temps" role="timer"></span></span>'
          : `<span class="score-barre" aria-label="${justes} réponse${justes > 1 ? "s" : ""} juste${justes > 1 ? "s" : ""}">✓ ${justes}</span>`
      }<span class="outils-ordinateur">${boutonClavier(clavier)}${pleinEcran}</span>`;
  const menu = bouton(
    `<span aria-hidden="true">←</span><span class="mot">${retour}</span>`,
    "retour",
    "secondaire menu",
    `aria-label="${retour}"`,
  );
  return `<header class="barre-question">
    <div class="gauche">${menu}</div>
    <div class="centre"><strong class="position">${seance.index + 1} sur ${seance.questions.length}</strong></div>
    <div class="droite">${droite}</div></header>`;
}

/* La pastille en tête de la carte : le nom de la notion, ou « Entraînement brevet ». */
export function pastilleNotionHTML(seance, famille) {
  const nom = seance.mode === "exam" ? "Entraînement brevet" : famille?.nom || "";
  return `<span class="pastille-notion">${esc(nom)}</span>`;
}

/* Sous la carte, dans la zone des commandes : Passer · Valider (« ← » en plus au brevet). Aide et Cours
   ne sont plus ici : ils sont dans la carte, sous le calcul (outilsHTML). */
export function actionsHTML(seance, etat) {
  if (seance.mode === "project") return actionsProjectionHTML(seance, etat);
  const retour =
    seance.mode === "exam"
      ? bouton("←", "precedente", "secondaire precedente", 'aria-label="Question précédente"')
      : "";
  // Après la réponse (C6) : « Voir l'explication » (pas après une réponse juste) · « Question
  // suivante », ou « Voir le bilan » à la dernière question.
  const derniere = seance.index + 1 >= seance.questions.length;
  const explication = etat.correction ? "Cacher l’explication" : "Voir l’explication";
  const suite =
    etat.terminee && seance.mode !== "exam"
      ? (etat.juste ? "" : bouton(explication, "explication", "secondaire")) +
        bouton(derniere ? "Voir le bilan" : "Question suivante", "suivante", "primaire large")
      : bouton("Passer", "passer", "secondaire") + bouton("Valider", "valider", "orange large");
  return `<div class="actions-question">${retour}${suite}</div>`;
}

/* Aide · Cours : deux boutons discrets (38 px) juste sous le calcul, là où l'aide s'ouvre.
   Ni l'un ni l'autre au brevet ni au diaporama. */
export function outilsHTML(seance, etat) {
  if (seance.mode !== "train" || etat.terminee) return "";
  return `<div class="outils">
    <button class="outil" data-action="aide" aria-pressed="${Boolean(etat.aideOuverte)}">${ICONES.aide}Aide</button>
    <button class="outil" data-action="cours">${ICONES.cours}Cours</button>
  </div>`;
}

/* Diaporama (C10) : ← · Aide · Réponse (remplit la case en vert) · Explication · →, les mêmes mots
   qu'au téléphone ; « Encore un indice » est dans l'en-tête de l'aide. Correction « à la fin » :
   Réponse et Explication attendent la phase de correction. */
function actionsProjectionHTML(seance, etat) {
  const fin = seance.options.correction === "end" && seance.phase !== "correction";
  const presse = (actif) => `aria-pressed="${Boolean(actif)}"`;
  return `<div class="actions-question barre-projection">
    ${bouton("←", "precedente", "secondaire", 'aria-label="Question précédente"')}
    ${bouton("Aide", "aide", "secondaire", presse(etat.aideOuverte))}
    ${bouton("Réponse", "reponse", "secondaire", `${presse(etat.reponseMontree)} ${fin ? "disabled" : ""}`)}
    ${bouton("Explication", "explication", "secondaire", `${presse(etat.correction)} ${fin ? "disabled" : ""}`)}
    ${bouton("→", "suivante", "orange", 'aria-label="Question suivante"')}
  </div>`;
}

/* La consigne de la carte. Quand le calcul s'écrit avec ses cases (« 0,7 × 7 = [ ] »), la consigne
   ne garde que la phrase (« Calcule. ») ; sinon c'est l'énoncé entier, comme avant. */
function consigneHTML(question, modele) {
  if (modele.phrase) return `<h1 class="consigne sr-only">${questionPrompt(question)}</h1>`;
  const texte = modele.consigne ? mathHtml(modele.consigne) : questionPrompt(question);
  return `<h1 class="consigne">${texte}</h1>`;
}

/* Après la réponse (C6). Plus de phrase toute faite : la case barrée et la bonne réponse disent tout.
   Seules exceptions : la phrase courte d'une ERREUR CONNUE de la forme (champ erreurs), ou le message
   précis du moteur (« La valeur est juste. Écris-la sous forme irréductible. »). Puis « Bonne
   réponse » : l'égalité entière quand la question a un calcul, sinon les valeurs attendues. */
export function bonneReponseTexte(question, modele) {
  const valeurs = question.fields.map((champ) => ecrireReponse(champ.answer));
  if (modele?.modele) return modele.modele.replace(/\[(\d+)\]/g, (_, rang) => valeurs[rang] ?? "");
  if (question.fields.length === 1) {
    const unite = question.fields[0].unit;
    return `${valeurs[0]}${unite && !/^[°%]$/.test(unite) ? " " : ""}${unite || ""}`;
  }
  return question.fields
    .map((champ, rang) => `${champ.label ? `${champ.label} : ` : ""}${valeurs[rang]}`)
    .join(" · ");
}

function retourHTML(question, etat, modele) {
  if (!etat.terminee || etat.juste) return "";
  const phrase = etat.erreurConnue || etat.message;
  return `${phrase ? `<p class="erreur-connue" role="status">${mathHtml(phrase)}</p>` : ""}
    <div class="bonne"><span>Bonne réponse</span>
      <strong>${mathHtml(bonneReponseTexte(question, modele))}</strong></div>`;
}

export function questionHTML(seance, famille, clavier = false) {
  const question = seance.questions[seance.index];
  const etat = seance.etats[seance.index];
  const projection = seance.mode === "project";
  const modele = modeleQuestion(question, reglageForme(question, famille, "gabarit"));
  const reglages = {
    coinAide: reglageForme(question, famille, "coinAide"),
    aideSurFigure: reglageForme(question, famille, "aideSurFigure") === true,
  };
  const avantReponse = !etat.terminee && etat.message;
  return `${barreQuestionHTML(seance, clavier)}
    <progress class="progression" max="${seance.questions.length}" value="${seance.index + 1}"></progress>
    <div class="espace-question">
      <section class="carte enonce">${pastilleNotionHTML(seance, famille)}${consigneHTML(question, modele)}
        ${question.math ? `<div class="calcul">${mathHtml(question.math)}</div>` : ""}
        ${figureHTML(question, etat, reglages)}
        <div class="reponses"></div>
        ${avantReponse ? `<p class="erreur-connue" role="status">${esc(etat.message)}</p>` : ""}
        ${seance.mode === "train" ? retourHTML(question, etat, modele) : ""}
        ${outilsHTML(seance, etat)}
      </section>
      ${aideHTML(question, etat, projection, reglages)}
      ${etat.correction ? explicationHTML(question, !projection) : ""}
    </div>
    <div id="commandes">${seance.mode === "exam" ? pointsHTML(seance) : ""}
      <section class="clavier" aria-label="Clavier mathématique" hidden></section>
      <div class="signes" role="group" aria-label="Signe" hidden></div>${actionsHTML(seance, etat)}</div>`;
}

function reglageHTML(nom, libelle, valeur, min, max) {
  return `<label>${libelle}<input id="${nom}" type="number" min="${min}" max="${max}" value="${valeur}"></label>`;
}

export function professeurHTML(familles, filtre, options, selection) {
  return `<h1>Diaporama</h1>
    <p class="sous-titre">Au tableau : choisis les notions, règle le temps, puis projette.</p>${filtresHTML(filtre)}
    <div class="configuration-prof"><div class="reglages"><h2>Réglages</h2>
      ${reglageHTML("nombre", "Questions", options.nombre, 1, 40)}
      ${reglageHTML("secondes", "Recherche (s)", options.secondes, 5, 600)}
      ${reglageHTML("delai", "Pause entre questions (s)", options.delai, 0, 60)}
      <label>Correction<select id="correction">
        <option value="each" ${options.correction === "each" ? "selected" : ""}>Après chaque question</option>
        <option value="end" ${options.correction === "end" ? "selected" : ""}>À la fin</option>
      </select></label>
      <label><input id="automatique" type="checkbox" ${options.automatique ? "checked" : ""}> Enchaîner automatiquement</label>
      <label><input id="aide-office" type="checkbox" ${options.aideOffice ? "checked" : ""}> Aide affichée d’office</label>
    </div><div class="selection-notions"><h2>Notions</h2>${DOMAINES.map(([domaine, nom]) => {
      const liste = familles.filter((famille) => famille.domaine === domaine);
      const coches = liste.length && liste.every((famille) => selection.has(famille.id));
      return `<details class="selection-domaine groupe-selection"><summary>
        <input type="checkbox" data-selection-domaine="${domaine}" aria-label="Choisir ${nom}" ${coches ? "checked" : ""}>
        ${nom} <span>${liste.length}</span></summary>
        ${liste
          .map(
            (famille) => `<label><input type="checkbox" data-selection="${famille.id}"
          ${selection.has(famille.id) ? "checked" : ""}> ${esc(famille.nom)}</label>`,
          )
          .join("")}
      </details>`;
    }).join("")}</div>
    </div><div class="actions-prof">${bouton("Projeter au tableau", "projeter", "primaire")}
      ${bouton("Ouvrir sur un écran", "partager", "secondaire")}
    </div><p id="lien-serie" hidden></p>`;
}

/* Le bilan d'une série : le score, puis chaque question (son énoncé, comme /auto/) avec son état
   (juste / juste avec l'aide / faux / passée) et sa correction dépliable. Pas d'étoiles : le parcours viendra après. */
export function bilanHTML(seance, parId) {
  const projection = seance.mode === "project";
  const exam = seance.mode === "exam";
  const justes = seance.etats.filter((etat) => etat.juste);
  const autonomes = justes.filter((etat) => etat.aide === 0).length;
  const dessins = justes.length - autonomes;
  const ratees = seance.etats.length - justes.length;
  const etatLigne = (etat) =>
    etat.juste
      ? etat.aide === 0
        ? ["juste", "✓", "Juste"]
        : ["aidee", "✓", "Juste, avec l’aide"]
      : etat.erreurs
        ? ["faux", "✗", "Faux"]
        : ["passee", "○", "Passée"];
  const titre = projection ? "Corrections" : exam ? "Entraînement brevet" : "Bilan";
  // Coque V2 (C9) : « n / N » seul, en grand ; dessous, sans aide · avec l'aide.
  const score = `<div class="grand-score"><div class="score">${justes.length} / ${seance.questions.length}</div>
    <p class="resume-bilan">${autonomes} sans aide · ${dessins} avec l’aide</p></div>`;
  const liste = seance.questions
    .map((question, i) => {
      const [classe, signe, mot] = projection ? ["", "", ""] : etatLigne(seance.etats[i]);
      const famille = parId[question.famille];
      const modele = modeleQuestion(question, reglageForme(question, famille, "gabarit"));
      return `<details><summary>${
        projection
          ? `<span class="numero">${i + 1}</span>`
          : `<span class="etat-ligne ${classe}" aria-label="${mot}">${signe}</span>`
      }
        <span class="resultat-nom">${questionPrompt(question)}</span>
        <em class="resultat-reponse">${mathHtml(bonneReponseTexte(question, modele).replace(/^.* = /, ""))}</em>
        <span class="voir">Voir la correction</span></summary>
        ${enonceHTML(question)}${explicationHTML(question, false)}</details>`;
    })
    .join("");
  // « Refaire mes erreurs » en premier, sur toute la largeur (choix de Gwenaël, 21/10), absent sans erreur.
  const actions = projection
    ? `${bouton("Encore une série", "encore", "primaire")}${bouton("Retour", "accueil", "secondaire")}`
    : `${ratees ? bouton("Refaire mes erreurs", "refaire", "orange refaire") : ""}
      ${bouton("Changer de notions", "changer", "secondaire")}
      ${bouton(exam ? "Encore un entraînement" : "Encore une série", "encore", "primaire")}`;
  return `<h1>${titre}</h1>${projection ? "" : score}
    <div class="liste-resultats">${liste}</div>
    <div class="actions-prof actions-bilan">${actions}</div>`;
}

/* Le cours (C8), dans sa fenêtre. Quand le cours de la famille est découpé en morceaux (champ
   cours.morceaux du catalogue : [{ titre, texte, exemple, formes: ["e", …] }], rempli par les
   cahiers), en haut « Pour cette question » et le morceau du type de question en cours, encadré ;
   dessous « Le reste du cours ↓ ». Sinon, le cours entier, comme avant. */
export function coursHTML(famille, question, entier) {
  const morceaux = famille.cours?.morceaux;
  if (!Array.isArray(morceaux) || !morceaux.length) return entier;
  const actif = morceaux.find((morceau) => morceau.formes?.includes(question.forme));
  const morceauHTML = (morceau) => `<div class="morceau${morceau === actif ? " actif" : ""}">
    <h3>${esc(morceau.titre || "")}</h3><p>${mathHtml(morceau.texte || "")}</p>
    ${morceau.exemple ? `<div class="exemple">${mathHtml(morceau.exemple)}</div>` : ""}</div>`;
  const reste = morceaux
    .filter((morceau) => morceau !== actif)
    .map(morceauHTML)
    .join("");
  return `${actif ? `<div class="sepa">Pour cette question</div>${morceauHTML(actif)}` : ""}
    ${reste ? `<div class="sepa">${actif ? "Le reste du cours ↓" : "Le cours"}</div>${reste}` : ""}`;
}

/* L'écran de départ du brevet : ce qui attend l'élève, en quatre mots, puis Commencer. */
export function brevetHTML() {
  const tuiles = [
    [ICONES.questions, "9 questions"],
    [ICONES.chrono, "20 minutes"],
    [ICONES.sansAide, "Sans aide"],
    [ICONES.corrections, "Corrections à la fin"],
  ];
  return `<section class="brevet-depart">
    <h1>Entraînement brevet</h1>
    <div class="brevet-tuiles">${tuiles
      .map(([icone, mot]) => `<div class="tuile">${icone}<span>${mot}</span></div>`)
      .join("")}</div>
    ${bouton("Commencer", "brevet-commencer", "primaire grand")}
  </section>`;
}
