import { esc } from "./generateurs/draw.js";
import { mathHtml } from "./math-format.js";
import { questionPrompt } from "./math-layout.js";
import { DOMAINES } from "./seances.js";
import { GROUPES } from "./groupes-domaines.js";
import { modeleQuestion, reglageForme, ecrireReponse } from "./champs.js";
import { iconeDomaine } from "./icones-domaines.js";

export function bouton(texte, action, classe = "secondaire", attributs = "") {
  return `<button class="bouton ${classe}" data-action="${action}" ${attributs}>${texte}</button>`;
}

/* Un réglage de « Préparer la série » : son étiquette, puis des boutons côte à côte (segments). */
function segmentHTML(libelle, boutons, classe = "", suite = "") {
  return `<div class="champ-reglage${classe}"><span class="etiquette-reglage">${libelle}</span>
    <div class="segments" role="group" aria-label="${libelle}">${boutons}</div>${suite}</div>`;
}

function segmentsHTML(valeurs, actif, attribut, texte = String) {
  return valeurs
    .map((valeur) => {
      const presse = valeur === actif;
      return `<button class="segment${presse ? " actif" : ""}" data-${attribut}="${valeur}"
        aria-pressed="${presse}">${texte(valeur)}</button>`;
    })
    .join("");
}

/* Les niveaux du menu. « Brevet » n'en est plus un (22/10) : 78 notions sur 81 en commun avec la 3e.
   Le filtre « brevet » reste dans le moteur (Entraînement brevet, anciens liens « niveau=brevet »). */
export const NIVEAUX = ["6e", "5e", "4e", "3e"];

function filtresHTML(filtre) {
  return segmentHTML("Niveau", segmentsHTML(NIVEAUX, filtre, "niveau"));
}

/* Le nombre de questions : des boutons à partir de 700 px ; au téléphone, une seule touche
   « 10 questions ▾ » pour tenir sur la ligne des niveaux. */
function nombreHTML(nombre) {
  const liste = [5, 10, 15, 20]
    .map((valeur) => {
      const choisi = valeur === nombre ? "selected" : "";
      return `<option value="${valeur}" ${choisi}>${valeur} questions</option>`;
    })
    .join("");
  const choix = `<label class="choix-nombre"><span class="sr-only">Nombre de questions</span>
    <select data-choix-nombre>${liste}</select></label>`;
  return segmentHTML(
    "Questions",
    segmentsHTML([5, 10, 15, 20], nombre, "nombre"),
    " champ-nombre",
    choix,
  );
}

function etapeHTML(numero, titre) {
  return `<h2 class="etape-menu"><span class="numero numero-${numero}" aria-hidden="true">${numero}</span>
    ${titre}</h2>`;
}

/* « k / n » : k notions cochées sur les n du domaine (« sélectionnée(s) » en plus dès 700 px). */
export function compteurHTML(coches, nombre) {
  const s = coches > 1 ? "s" : "";
  return `<span class="compteur-domaine" aria-label="${coches} notion${s} cochée${s} sur ${nombre}"
    >${coches} / ${nombre}<span class="mot-selection"> sélectionnée${s}</span></span>`;
}

/* L'accueil, d'après la V2 : la carte d'en-tête (logo maths&go, seul logo de l'appli, lien vers le
   site), « ① Préparer la série » (niveau, nombre de questions), « ② Choisir les automatismes » (une
   ligne par domaine, « k / n »), puis l'Entraînement brevet, une série toute prête. */
export function accueilHTML(familles, filtre, selection, nombre) {
  const pleinEcran = bouton(
    ICONES.pleinEcran,
    "plein-ecran",
    "secondaire icone-bouton plein-ecran-cadre",
    'aria-label="Plein écran" title="Plein écran"',
  );
  return `<section class="accueil">
    <header class="entete-appli">
      <a class="logo-cadre" href="/" aria-label="Accueil maths et go">
        <img src="../assets/img/logos/mathsgo/logo-390.png" alt="maths&go"></a>
      <div class="titre-appli"><h1>Automatismes</h1><span>Collège · sans calculatrice</span></div>
      ${pleinEcran}
    </header>
    <section class="carte-menu">${etapeHTML(1, "Préparer la série")}
      <div class="reglages-serie">${filtresHTML(filtre)}${nombreHTML(nombre)}</div></section>
    <section class="carte-menu">${etapeHTML(2, "Choisir les automatismes")}
      <div class="domaines">${DOMAINES.map(([id, nom]) => {
        const liste = familles.filter((famille) => famille.domaine === id);
        const coches = liste.filter((famille) => selection.has(famille.id)).length;
        return `<button class="domaine-carte${coches ? " avec-selection" : ""}" data-domaine="${id}"
          ${liste.length ? "" : "disabled"}>
          <span class="icone" aria-hidden="true">${iconeDomaine(id)}</span>
          <span class="nom">${nom}</span>${compteurHTML(coches, liste.length)}
          <span class="chevron" aria-hidden="true">›</span></button>`;
      }).join("")}</div>
      <button class="domaine-carte ligne-brevet" data-action="brevet">
        <span class="icone" aria-hidden="true">${ICONES.chrono}</span>
        <span class="nom">Entraînement brevet<small>9 questions · 20 min · sans aide</small></span>
        <span></span><span class="chevron" aria-hidden="true">›</span></button>
    </section>
  </section>`;
}

/* La barre de lancement, toujours en bas (accueil et domaine, décision G). Rien de coché : elle dit
   quoi faire, boutons grisés. Sinon « n notions sélectionnées · 4e · 10 questions », Projeter (dès
   700 px) et « Lancer la série ». */
export function lancementHTML(compte, nombre, filtre) {
  const s = compte > 1 ? "s" : "";
  const titre = compte ? `${compte} notion${s} sélectionnée${s}` : "Aucune notion cochée";
  const detail = compte ? `${filtre} · ${nombre} questions` : "Coche des notions";
  const grise = compte ? "" : "disabled";
  return `<div class="barre-lancement${compte ? "" : " vide"}">
    <div class="resume" aria-live="polite"><strong>${titre}</strong><span>${detail}</span></div>
    <span class="lancer-groupe">${bouton("Projeter", "projeter-reglages", "secondaire projeter", grise)}
      ${bouton("Lancer la série", "lancer", "orange", grise)}</span>
  </div>`;
}

/* Le domaine ouvert, en plein écran (décision F) : en tête la carte du domaine (icône, nom, « k / n »,
   chevron) qu'on touche pour refermer ; « Tout sélectionner dans ce domaine » ; puis les notions par
   groupe, avec leurs sous-titres (deux colonnes dès 700 px). Étiquette de classe (« 4e ») sur les
   notions qui commencent dans la classe choisie, jamais en 6e. Un tap ne lance rien : la série part
   de la barre de lancement. */
export function domaineHTML(domaine, familles, filtre, selection) {
  const nom = DOMAINES.find(([id]) => id === domaine)?.[1] || "Notions";
  const coches = familles.filter((famille) => selection.has(famille.id)).length;
  const tout = familles.length > 0 && coches === familles.length;
  const ligne = (famille) => {
    const debut = NIVEAUX.find((niveau) => famille.niveaux.includes(niveau));
    const classe = debut === filtre && filtre !== "6e";
    const coche = selection.has(famille.id);
    return `<label class="notion${coche ? " cochee" : ""}">
      <input type="checkbox" data-selection="${famille.id}" ${coche ? "checked" : ""}>
      <span class="nom">${esc(famille.nom)}${classe ? `<span class="badge classe">${filtre}</span>` : ""}
      </span></label>`;
  };
  const grille = (liste) => `<div class="grille-notions">${liste.map(ligne).join("")}</div>`;
  const parId = Object.fromEntries(familles.map((famille) => [famille.id, famille]));
  const rangees = new Set();
  const blocs = (GROUPES[domaine] || [])
    .map(([titre, ids]) => {
      const liste = ids.filter((id) => parId[id] && !rangees.has(id)).map((id) => parId[id]);
      liste.forEach((famille) => rangees.add(famille.id));
      return liste.length ? `<h3 class="titre-groupe">${titre}</h3>${grille(liste)}` : "";
    })
    .join("");
  const reste = familles.filter((famille) => !rangees.has(famille.id));
  return `<section class="domaine-ouvert groupe-selection">
    <button class="domaine-tete${coches ? " avec-selection" : ""}" data-action="retour"
      aria-expanded="true" aria-label="Refermer ${nom}">
      <span class="icone" aria-hidden="true">${iconeDomaine(domaine)}</span>
      <span class="nom">${nom}</span>${compteurHTML(coches, familles.length)}
      <span class="chevron ouvert" aria-hidden="true">›</span></button>
    <div class="domaine-corps">
      <label class="notion tout-domaine">
        <input type="checkbox" data-selection-domaine="${domaine}" ${tout ? "checked" : ""}>
        <span class="nom">Tout sélectionner dans ce domaine</span></label>
      ${blocs}${reste.length ? grille(reste) : ""}
    </div></section>`;
}

// Le calcul d'un gabarit de cahier, ses cases en □ (bilan : « 6 □ 7 », « 33 = 7 × □ + □ »).
function gabaritTexte(question) {
  // Une case seule (« [0] ») n'apprend rien : pas de calcul à montrer.
  if (!question.gabarit || /^\s*\[0\]\s*$/.test(question.gabarit)) return "";
  return String(question.gabarit).replace(/\[\d+\]/g, "□");
}

export function enonceHTML(question, pastille = "") {
  const calcul = question.math || gabaritTexte(question);
  return `<div class="enonce">${pastille}<h1>${questionPrompt(question)}</h1>
    ${calcul ? `<div class="calcul">${mathHtml(calcul)}</div>` : ""}
    ${question.visual ? `<div class="figure">${question.visual}</div>` : ""}
  </div>`;
}

/* L'aide (coque V2, C5) : sous la carte, dans la zone de la question ; le clavier reste. En-tête :
   Aide · « Encore un indice » (l'ancienne « Une étape ») · ×. Correction après C7 (K1) : une question
   avec figure a aussi son aide SOUS la carte (sa phrase, et son dessin s'il n'est pas la figure) ; la
   bulle posée sur la figure n'existe que si la forme a un champ coinAide (rempli par les cahiers une
   fois le coin vérifié vide pour tous les tirages). */
function boutonIndice(question, etat) {
  if (!question.hints?.[1]?.text && !question.hints?.[1]?.svg) return "";
  return bouton("Encore un indice", "etape", "indice", etat.etape ? "disabled" : "");
}

const COINS = ["haut-gauche", "haut-droite", "bas-gauche", "bas-droite"];
function enBulle(question, reglages) {
  return Boolean(question.visual && COINS.includes(reglages?.coinAide));
}

// Un texte d'aide sur plusieurs lignes (cahier NC17-a : une question par diviseur).
const lignesHTML = (texte) =>
  String(texte || "")
    .split("\n")
    .map((ligne) => mathHtml(ligne))
    .join("<br>");

export function aideHTML(question, etat, projection = false, reglages = {}) {
  if (!etat.aideOuverte || enBulle(question, reglages)) return "";
  const dessin = question.hints?.[0]?.svg || "";
  // Un dessin d'aide « sur la figure » (aideSurFigure) se pose sur elle ; sinon il est ici.
  const montrer = dessin && dessin !== question.visual && !surFigure(question, reglages);
  const fermer = projection
    ? ""
    : bouton("×", "fermer-aide", "fermer", 'aria-label="Fermer l’aide"');
  const phrase = question.hints?.[0]?.text
    ? `<p>${mathHtml(question.hints[0].text)}</p>`
    : question.cahier
      ? ""
      : "<p></p>";
  // « Encore un indice » : sa phrase, et son dessin quand le cahier en donne un (la ligne barrée…).
  const indice = question.hints?.[1] || {};
  // Un indice dessiné (cahiers) prend la place de l'aide : son dessin, puis sa phrase, comme l'aide.
  // Empilés, les deux dessins cachaient le pavé au téléphone (NC18-g, retour de Code du 24/10).
  const remplace = Boolean(etat.etape && indice.svg && question.cahier);
  const image = montrer && !remplace ? `<div class="dessin">${dessin}</div>` : "";
  const etape = etat.etape
    ? `<div class="etape${remplace ? " a-la-place" : ""}">${indice.svg ? `<div class="dessin">${indice.svg}</div>` : ""}${lignesHTML(indice.text)}</div>`
    : "";
  // Les cahiers : le dessin d'abord, la phrase dessous (comme sur leurs pages).
  return `<section class="aide${projection ? " aide-projetee" : ""}" aria-label="Aide">
    <div class="aide-entete"><strong>${ICONES.aide}Aide</strong>
      <span class="aide-boutons">${boutonIndice(question, etat)}${fermer}</span></div>
    ${remplace ? "" : question.cahier ? image + phrase : phrase + image}
    ${etape}
  </section>`;
}

/* La figure de la question, toujours en place. Avec coinAide seulement, l'aide ouverte est une bulle
   posée dans ce coin de la figure. Le dessin d'aide se pose EXACTEMENT dans la boîte de la figure
   (calque .figure-aide, dimensionné par ajusterQuestion), la figure gardant sa place, quand c'est la
   figure annotée : même boîte (même viewBox) que la figure (K6, les pointillés de EG02-a), ou forme
   marquée aideSurFigure (K2). Une boîte différente (le schéma « 90° / 180° » de EG06-b) va dans le
   panneau sous la carte. */
const boiteSVG = (svg) =>
  String(svg)
    .match(/viewBox="([^"]+)"/)?.[1]
    ?.trim()
    .replace(/\s+/g, " ");

export function surFigure(question, reglages = {}) {
  const dessin = question.hints?.[0]?.svg || "";
  if (!question.visual || !dessin || dessin === question.visual) return false;
  const memeBoite = boiteSVG(dessin) && boiteSVG(dessin) === boiteSVG(question.visual);
  return Boolean(reglages?.aideSurFigure || memeBoite);
}

export function figureHTML(question, etat, reglages = {}) {
  if (!question.visual) return "";
  const calque =
    etat.aideOuverte && surFigure(question, reglages)
      ? `<div class="figure-aide">${question.hints[0].svg}</div>`
      : "";
  const bulle =
    etat.aideOuverte && enBulle(question, reglages)
      ? `<div class="bulle-aide ${reglages.coinAide}" role="note" aria-label="Aide">${ICONES.aide}
      <span>${mathHtml(question.hints?.[0]?.text || "")}</span>
      ${etat.etape ? `<span class="etape">${mathHtml(question.hints?.[1]?.text || "")}</span>` : ""}
      ${etat.etape ? "" : boutonIndice(question, etat)}</div>`
      : "";
  return `<div class="figure${calque ? " aide-sur-figure" : ""}">${question.visual}${calque}${bulle}</div>`;
}

/* « Voir l'explication » (C7) : sous la question, au même endroit que l'aide, pas de fenêtre ; la
   solution de la question et son dessin (celui de l'aide, sauf s'il n'est que la figure). */
export function explicationHTML(question, fermer = true) {
  const entete = `<div class="aide-entete"><strong>L’explication</strong>
      ${fermer ? bouton("×", "explication", "fermer", 'aria-label="Cacher l’explication"') : ""}</div>`;
  // Les cahiers : les calculs les uns sous les autres, les « = » alignés, puis les étapes, puis le
  // dessin complété (choix de Gwenaël du 21/10).
  if (question.explication) {
    const { calc = [], etapes = [], svg = "" } = question.explication;
    const lignes = calc
      .map(
        ([gauche, droite]) =>
          `<tr><td class="gauche">${mathHtml(gauche)}</td><td class="droite">${mathHtml(droite)}</td></tr>`,
      )
      .join("");
    return `<section class="explication" aria-label="L’explication">${entete}
      ${lignes ? `<table class="calculs">${lignes}</table>` : ""}
      ${etapes.length ? `<ol class="etapes">${etapes.map((e) => `<li>${mathHtml(e)}</li>`).join("")}</ol>` : ""}
      ${svg ? `<div class="dessin">${svg}</div>` : ""}
    </section>`;
  }
  const dessin = question.hints?.[0]?.svg || "";
  const montrer = dessin && dessin !== question.visual;
  return `<section class="explication" aria-label="L’explication">${entete}
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
  // Un cahier peut nommer la question plus précisément que sa famille (« Diviseurs », « Multiple commun »).
  const question = seance.questions?.[seance.index];
  const nom =
    seance.mode === "exam" ? "Entraînement brevet" : question?.pastille || famille?.nom || "";
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
   qu'au téléphone ; « Encore un indice » est dans l'en-tête de l'aide. Un seul panneau à la fois
   sous la question (K3) : l'explication prend la place de l'aide, qui revient quand on la referme. Correction « à la fin » :
   Réponse et Explication attendent la phase de correction. */
function actionsProjectionHTML(seance, etat) {
  const fin = seance.options.correction === "end" && seance.phase !== "correction";
  const presse = (actif) => `aria-pressed="${Boolean(actif)}"`;
  return `<div class="actions-question barre-projection">
    ${bouton("←", "precedente", "secondaire", 'aria-label="Question précédente"')}
    ${bouton("Aide", "aide", "secondaire", presse(etat.aideOuverte && !etat.correction))}
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
export function bonneReponseTexte(question, modele, court = false) {
  // Un cahier écrit sa bonne réponse (« Non : 6 + 9 + 0 + 4 = 19 ») ; le bilan garde la forme courte.
  if (question.bonne && !court) return question.bonne;
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
      ${projection && etat.correction ? "" : aideHTML(question, etat, projection, reglages)}
      ${etat.correction ? explicationHTML(question, !projection) : ""}
    </div>
    <div id="commandes">${seance.mode === "exam" ? pointsHTML(seance) : ""}
      <section class="clavier" aria-label="Clavier mathématique" hidden></section>
      <div class="signes" role="group" aria-label="Signe" hidden></div>${actionsHTML(seance, etat)}</div>`;
}

function reglageHTML(nom, libelle, valeur, min, max) {
  return `<label>${libelle}<input id="${nom}" type="number" min="${min}" max="${max}" value="${valeur}"></label>`;
}

// La réponse résumée d'une ligne du bilan : la valeur après le dernier « = » ; avec un gabarit de
// cahier, l'égalité entière (« 33 = 7 × 4 + 5 », pas « 7 × 4 + 5 »).
function resumeReponse(question, modele) {
  const texte = bonneReponseTexte(question, modele, true);
  return question.gabarit ? texte : texte.replace(/^.* = /, "");
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
        <em class="resultat-reponse">${mathHtml(resumeReponse(question, modele))}</em>
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
// Le texte d'un morceau de cours : les mots en <b>…</b> des cahiers restent en gras, rien d'autre.
const texteCours = (texte) =>
  String(texte)
    .split(/(<b>.*?<\/b>)/)
    .map((morceau) =>
      /^<b>.*<\/b>$/.test(morceau) ? `<b>${mathHtml(morceau.slice(3, -4))}</b>` : mathHtml(morceau),
    )
    .join("");

export function coursHTML(famille, question, entier) {
  // Les morceaux viennent de la question quand un cahier les écrit (avec leurs dessins), sinon du catalogue.
  const morceaux = question.course?.morceaux || famille.cours?.morceaux;
  if (!Array.isArray(morceaux) || !morceaux.length) return entier;
  const actif = morceaux.find((morceau) => morceau.formes?.includes(question.forme));
  const morceauHTML = (morceau) => `<div class="morceau${morceau === actif ? " actif" : ""}">
    <h3>${esc(morceau.titre || "")}</h3><p>${texteCours(morceau.texte || "")}</p>
    ${morceau.svg ? `<div class="dessin">${morceau.svg}</div>` : ""}
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

/* « Projeter » (tablette, ordinateur) : les réglages du diaporama dans une petite fenêtre, sur la
   sélection en cours ; un seul bouton d'action, « Projeter » (P10, 22/10). */
export function reglagesProjectionHTML(options, compte, nombre) {
  const choix = (valeur, texte) =>
    `<option value="${valeur}" ${options.correction === valeur ? "selected" : ""}>${texte}</option>`;
  const coche = (actif) => (actif ? "checked" : "");
  return `<div class="fenetre-entete"><h2>Projeter au tableau</h2>
      <form method="dialog"><button class="fermer" aria-label="Fermer">×</button></form></div>
    <p class="rappel-selection">${compte} notion${compte > 1 ? "s" : ""} · ${nombre} questions</p>
    <div class="reglages-projection">
      ${reglageHTML("secondes", "Temps de recherche (s)", options.secondes, 5, 600)}
      ${reglageHTML("delai", "Pause entre deux questions (s)", options.delai, 0, 60)}
      <label>Correction<select id="correction">${choix("each", "Après chaque question")}
        ${choix("end", "À la fin")}</select></label>
      <label class="coche-reglage"><input id="automatique" type="checkbox" ${coche(options.automatique)}>
        Enchaîner automatiquement</label>
      <label class="coche-reglage"><input id="aide-office" type="checkbox" ${coche(options.aideOffice)}>
        Avec aide (le dessin reste affiché)</label>
    </div>
    <div class="actions-projection">${bouton("Projeter", "projeter", "orange")}</div>`;
}
