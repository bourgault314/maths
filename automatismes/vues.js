import { esc } from "./generateurs/draw.js";
import { mathHtml } from "./math-format.js";
import { questionPrompt } from "./math-layout.js";
import { DOMAINES, formesEligibles } from "./seances.js";
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

export function accueilHTML(familles, filtre) {
  return `<section class="accueil">
    <h1>Automatismes</h1>
    <p class="sous-titre">Choisis un domaine, puis une notion.</p>
    ${filtresHTML(filtre)}
    <div class="domaines">${DOMAINES.map(([id, nom]) => {
      const nombre = familles.filter((famille) => famille.domaine === id).length;
      return `<button class="domaine-carte" data-domaine="${id}" ${nombre ? "" : "disabled"}>
        <span class="icone" aria-hidden="true">${ICONES_DOMAINES[id] || ""}</span>
        <span class="nom">${nom}<small>${nombre} notion${nombre > 1 ? "s" : ""}</small></span><span class="chevron" aria-hidden="true">›</span>
      </button>`;
    }).join("")}</div>
    ${bouton("Entraînement brevet · 9 questions · 20 min", "brevet", "secondaire brevet")}
  </section>`;
}

export function domaineHTML(domaine, familles, filtre) {
  const nom = DOMAINES.find(([id]) => id === domaine)?.[1] || "Notions";
  return `<div class="entete-domaine"><span class="icone" aria-hidden="true">${ICONES_DOMAINES[domaine] || ""}</span>
    <h1>${nom}</h1></div>${filtresHTML(filtre)}
    ${bouton("Mélanger ce domaine · 8 questions", "melanger", "primaire")}
    <div class="liste-notions">${familles
      .map((famille) => {
        const formes = formesEligibles(famille, filtre);
        return `<button class="notion" data-notion="${famille.id}">
        <span class="nom">${esc(famille.nom)}<span class="badges">
          <span class="badge">${famille.niveaux.join(" · ")}</span>
          ${formes.some((forme) => forme.brevet) ? '<span class="badge brevet">Brevet</span>' : ""}
        </span></span><span class="chevron" aria-hidden="true">›</span>
      </button>`;
      })
      .join("")}</div>`;
}

export function enonceHTML(question) {
  return `<div class="enonce"><h1>${questionPrompt(question)}</h1>
    ${question.math ? `<div class="calcul">${mathHtml(question.math)}</div>` : ""}
    ${question.visual ? `<div class="figure">${question.visual}</div>` : ""}
  </div>`;
}

export function aideHTML(question, etat, garder, projection = false) {
  if (!etat.aideOuverte) return "";
  const dessin = question.hints?.[0]?.svg || "";
  if (projection)
    return `<section class="aide aide-projetee">${dessin}
    ${etat.etape ? `<div class="etape">${mathHtml(question.hints?.[1]?.text || "")}</div>` : ""}</section>`;

  return `<section class="aide" aria-label="Aide">
    <div class="aide-entete"><strong>Aide</strong>
      ${bouton("×", "fermer-aide", "discret petit", 'aria-label="Fermer l’aide"')}</div>
    ${dessin || `<p>${mathHtml(question.hints?.[0]?.text || "")}</p>`}
    ${etat.etape ? `<div class="etape">${mathHtml(question.hints?.[1]?.text || "")}</div>` : ""}
    <div class="aide-pied">${bouton("Une étape", "etape", "secondaire petit", etat.etape ? "disabled" : "")}
      <label><input type="checkbox" id="garder-aide" ${garder ? "checked" : ""}> Garder l’aide affichée</label>
    </div>
  </section>`;
}

export function correctionHTML(question) {
  return `<section class="correction" aria-label="Correction">
    <h2>Correction</h2><div class="solution">${mathHtml(question.solution || "")}</div>
    ${question.hints?.[0]?.svg ? `<div class="figure">${question.hints[0].svg}</div>` : ""}
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
  clavier:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 9h1M10 9h1M13.5 9h1M17 9h1M6.5 12.5h1M10 12.5h1M13.5 12.5h1M17 12.5h1M8 16h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  pleinEcran:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cours:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.4c2.8-.9 5.3-.45 7.5 1.25v12c-2.2-1.7-4.7-2.15-7.5-1.25zM20.5 5.4c-2.8-.9-5.3-.45-7.5 1.25v12c2.2-1.7 4.7-2.15 7.5-1.25z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6.8v11.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  aide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.55 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.55 1.1-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/* Le haut de l'écran de question, sur une ligne comme /auto/, dans les trois modes :
   entraînement  ← Menu · notion · n / N · ✓ score · clavier · plein écran · Cours
   brevet        ← Menu · Entraînement brevet · n / N · chrono · clavier · plein écran
   projection    ← Quitter · notion · n / N · minuteur · Pause · plein écran */
export function barreQuestionHTML(seance, famille, clavier) {
  const exam = seance.mode === "exam";
  const projection = seance.mode === "project";
  const justes = seance.etats.filter((e) => e.juste).length;
  const retour = projection ? "Quitter" : "Menu";
  const droite = projection
    ? `<span class="minuteur"><span id="temps" role="timer"></span></span>
      ${bouton(seance.pause ? "Reprendre" : "Pause", "pause", "secondaire pause")}`
    : exam
      ? `<span class="minuteur chrono"><span id="temps" role="timer"></span></span>
      ${bouton(ICONES.clavier, "clavier", "secondaire icone-bouton clavier-bascule", `aria-pressed="${clavier}" aria-label="${clavier ? "Cacher" : "Afficher"} le clavier" title="Clavier"`)}`
      : `<span class="score-barre" aria-label="${justes} réponse${justes > 1 ? "s" : ""} juste${justes > 1 ? "s" : ""}">✓ ${justes}</span>
      ${bouton(ICONES.clavier, "clavier", "secondaire icone-bouton clavier-bascule", `aria-pressed="${clavier}" aria-label="${clavier ? "Cacher" : "Afficher"} le clavier" title="Clavier"`)}`;
  return `<header class="barre-question">
    <div class="gauche">${bouton(`<span aria-hidden="true">←</span><span class="mot">${retour}</span>`, "retour", "discret menu", `aria-label="${retour}"`)}</div>
    <div class="centre"><span class="notion-nom">${exam ? "Entraînement brevet" : esc(famille.nom)}</span>
      <strong>${seance.index + 1} / ${seance.questions.length}</strong></div>
    <div class="droite">${droite}
      ${bouton(ICONES.pleinEcran, "plein-ecran", "secondaire icone-bouton plein-ecran", 'aria-label="Plein écran" title="Plein écran"')}
      ${exam || projection ? "" : bouton(`${ICONES.cours}<span>Cours</span>`, "cours", "cours-bouton")}
    </div></header>`;
}

export function actionsHTML(seance, etat) {
  if (seance.mode === "project") return actionsProjectionHTML(seance, etat);
  // À gauche, ce qui sert pendant la réponse : Aide (ou « ← » au brevet) ; à droite Passer · Valider.
  const gauche =
    seance.mode === "exam"
      ? bouton("←", "precedente", "secondaire precedente", 'aria-label="Question précédente"')
      : bouton(
          `${ICONES.aide}<span>Aide</span>`,
          "aide",
          "aide-bouton",
          `aria-pressed="${Boolean(etat.aideOuverte)}"`,
        );
  const suite =
    etat.terminee && seance.mode !== "exam"
      ? bouton("Suivante", "suivante", "orange")
      : bouton("Passer", "passer", "discret") + bouton("Valider", "valider", "orange");
  return `<div class="actions-question">${gauche}${suite}</div>`;
}

function actionsProjectionHTML(seance) {
  const fin = seance.options.correction === "end" && seance.phase !== "correction";
  return `<div class="actions-question barre-projection">
    ${bouton("←", "precedente", "secondaire", 'aria-label="Question précédente"')}
    ${bouton("Aide", "aide", "secondaire")}
    ${bouton("Une étape", "etape", "secondaire")}
    ${bouton("Correction", "correction", "secondaire", fin ? "disabled" : "")}
    ${bouton("→", "suivante", "orange", 'aria-label="Question suivante"')}
  </div>`;
}

export function questionHTML(seance, famille, garder, clavier = false) {
  const question = seance.questions[seance.index];
  const etat = seance.etats[seance.index];
  const projection = seance.mode === "project";
  const minuterie = projection || seance.mode === "exam";
  return `${barreQuestionHTML(seance, famille, clavier)}
    <progress class="progression" max="${seance.questions.length}" value="${seance.index + 1}"></progress>
    <div class="espace-question">
      ${enonceHTML(question)}${aideHTML(question, etat, garder, projection)}
      ${projection ? choixProjectionHTML(question) : '<div class="reponses"></div>'}
      ${etat.message ? `<p class="retour-reponse ${etat.juste ? "juste" : "faux"}" role="status">${esc(etat.message)}</p>` : ""}
      ${etat.erreurs && !etat.terminee ? bouton("Voir la correction", "correction", "discret") : ""}
      ${etat.correction ? correctionHTML(question) : ""}
    </div>
    ${minuterie ? pointsHTML(seance) : ""}
    <div id="commandes"><section class="clavier" aria-label="Clavier mathématique" hidden></section>${actionsHTML(seance, etat)}</div>`;
}

function choixProjectionHTML(question) {
  return question.fields
    .filter((champ) => champ.options)
    .map((champ) => {
      return `<div class="choix">${champ.options.map((choix) => `<div class="choix-bouton">${mathHtml(choix)}</div>`).join("")}</div>`;
    })
    .join("");
}

function reglageHTML(nom, libelle, valeur, min, max) {
  return `<label>${libelle}<input id="${nom}" type="number" min="${min}" max="${max}" value="${valeur}"></label>`;
}

export function professeurHTML(familles, filtre, options, selection) {
  return `<h1>Projeter au tableau</h1>
    <p class="sous-titre">Choisis les notions, règle le temps, puis projette.</p>${filtresHTML(filtre)}
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
      return `<details class="selection-domaine"><summary>
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

/* Le bilan d'une série : le score, puis chaque question avec son état (juste / juste avec l'aide /
   faux / passée) et sa correction dépliable. Pas d'étoiles, pas de notion : le parcours viendra après. */
export function bilanHTML(seance, parId) {
  const projection = seance.mode === "project";
  const exam = seance.mode === "exam";
  const justes = seance.etats.filter((etat) => etat.juste);
  const autonomes = justes.filter((etat) => etat.aide === 0).length;
  const dessins = justes.length - autonomes;
  const etatLigne = (etat) =>
    etat.juste
      ? etat.aide === 0
        ? ["juste", "✓", "Juste"]
        : ["aidee", "✓", "Juste, avec l’aide"]
      : etat.erreurs
        ? ["faux", "✗", "Faux"]
        : ["passee", "○", "Passée"];
  const titre = projection ? "Corrections" : exam ? "Entraînement brevet" : "Bilan";
  const sousTitre = exam
    ? `${justes.length} juste${justes.length > 1 ? "s" : ""} sur 9`
    : `${autonomes} sans aide · ${dessins} avec l’aide`;
  return `<h1>${titre}</h1>
    ${projection ? "" : `<div class="score">${justes.length} / ${seance.questions.length}</div><p class="resume-bilan">${sousTitre}</p>`}
    <div class="liste-resultats">${seance.questions
      .map((question, i) => {
        const [classe, signe, mot] = projection ? ["", "", ""] : etatLigne(seance.etats[i]);
        return `<details><summary><span class="numero">${i + 1}</span>
        <span class="resultat-nom">${esc(parId[question.famille].nom)}</span>
        ${projection ? "" : `<span class="etat-ligne ${classe}"><span aria-hidden="true">${signe}</span> ${mot}</span>`}
        <span class="voir">Voir la correction</span></summary>
        ${enonceHTML(question)}${correctionHTML(question)}</details>`;
      })
      .join("")}</div>
    <div class="actions-prof">${bouton(exam ? "Encore un entraînement" : "Encore une série", "encore", "primaire")}
      ${bouton("Retour", "accueil", "secondaire")}</div>`;
}

/* L'écran de départ du brevet : ce qui attend l'élève, en quatre mots, puis Commencer. */
export function brevetHTML() {
  return `<section class="brevet-depart">
    <h1>Entraînement brevet</h1>
    <ul class="brevet-regles">
      <li><strong>9 questions</strong>, comme la partie sans calculatrice de l’épreuve</li>
      <li><strong>20 minutes</strong> : le chrono démarre quand tu commences</li>
      <li><strong>Sans aide</strong> : ni dessin, ni cours</li>
      <li><strong>Les corrections à la fin</strong>, question par question</li>
    </ul>
    ${bouton("Commencer", "brevet-commencer", "primaire grand")}
  </section>`;
}
