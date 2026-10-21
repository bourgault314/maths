import { esc } from "./generateurs/draw.js";
import { mathHtml } from "./math-format.js";
import { questionPrompt } from "./math-layout.js";
import { DOMAINES, formesEligibles } from "./seances.js";

export function bouton(texte, action, classe = "secondaire", attributs = "") {
  return `<button class="bouton ${classe}" data-action="${action}" ${attributs}>${texte}</button>`;
}

export function etoilesHTML(nombre) {
  return `<span class="etoiles" aria-label="${nombre} étoile${nombre > 1 ? "s" : ""} sur 3">${"★".repeat(nombre)}${"☆".repeat(3 - nombre)}</span>`;
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
    <div class="seance-jour">${bouton("Ma séance du jour", "jour", "primaire")}
      <span>8 questions</span></div>
    ${filtresHTML(filtre)}
    <div class="domaines">${DOMAINES.map(([id, nom, icone]) => {
      const nombre = familles.filter((famille) => famille.domaine === id).length;
      return `<button class="domaine-carte" data-domaine="${id}" ${nombre ? "" : "disabled"}>
        <span class="icone" aria-hidden="true">${mathHtml(icone)}</span>
        <span class="nom">${nom}<small>${nombre} notions</small></span><span aria-hidden="true">›</span>
      </button>`;
    }).join("")}</div>
    ${bouton("Entraînement brevet · 9 questions · 20 min", "brevet", "secondaire brevet")}
  </section>`;
}

export function domaineHTML(domaine, familles, filtre, etoiles) {
  const nom = DOMAINES.find(([id]) => id === domaine)?.[1] || "Notions";
  return `<h1>${nom}</h1>${filtresHTML(filtre)}
    ${bouton("Mélanger ces notions", "melanger", "primaire")}
    <div class="liste-notions">${familles
      .map((famille) => {
        const formes = formesEligibles(famille, filtre);
        return `<button class="notion" data-notion="${famille.id}">
        <span class="nom">${esc(famille.nom)}<span class="badges">
          <span class="badge">${famille.niveaux.join(" · ")}</span>
          ${formes.some((forme) => forme.brevet) ? '<span class="badge brevet">Brevet</span>' : ""}
        </span></span>${etoilesHTML(etoiles(famille.id))}
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

export function actionsHTML(seance, etat) {
  if (seance.mode === "project") return actionsProjectionHTML(seance, etat);
  if (seance.mode === "exam") {
    return `<div class="actions-question"><div class="actions-gauche">
      ${bouton("←", "precedente", "secondaire", 'aria-label="Question précédente"')}
    </div><div class="actions-droite">
      ${bouton("Passer", "passer", "discret")}${bouton("Valider", "valider", "orange")}
    </div></div>`;
  }
  return `<div class="actions-question"><div class="actions-gauche">
    ${bouton("Aide", "aide", "secondaire")}${bouton("Cours", "cours", "discret")}
    </div><div class="actions-droite">
    ${
      etat.terminee
        ? bouton("Suivante", "suivante", "orange")
        : bouton("Passer", "passer", "discret") + bouton("Valider", "valider", "orange")
    }
    </div></div>`;
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

export function questionHTML(seance, famille, garder, etoiles) {
  const question = seance.questions[seance.index];
  const etat = seance.etats[seance.index];
  const projection = seance.mode === "project";
  const minuterie = projection || seance.mode === "exam";
  return `<div class="question-entete"><span>${esc(famille.nom)}</span>
    <strong>${seance.index + 1} / ${seance.questions.length}</strong>${etoilesHTML(etoiles(famille.id))}</div>
    <progress class="progression" max="${seance.questions.length}" value="${seance.index + 1}"></progress>
    ${minuterie ? minuteurHTML(projection, seance.pause) : ""}
    <div class="espace-question">
      ${enonceHTML(question)}${aideHTML(question, etat, garder, projection)}
      ${projection ? choixProjectionHTML(question) : '<div class="reponses"></div><div class="symboles"></div>'}
      ${etat.message ? `<p class="retour-reponse ${etat.juste ? "juste" : "faux"}" role="status">${esc(etat.message)}</p>` : ""}
      ${etat.erreurs && !etat.terminee ? bouton("Voir la correction", "correction", "discret") : ""}
      ${etat.correction ? correctionHTML(question) : ""}
    </div>
    ${minuterie ? pointsHTML(seance) : ""}
    <div id="commandes">${actionsHTML(seance, etat)}<section class="clavier" aria-label="Clavier mathématique" hidden></section></div>`;
}

function minuteurHTML(projection, pause) {
  return `<div class="minuteur"><span id="temps" role="timer"></span>
    ${projection ? bouton(pause ? "Reprendre" : "Pause", "pause", "secondaire petit") : ""}
    ${projection ? bouton("Plein écran", "plein-ecran", "discret petit", 'aria-label="Plein écran"') : ""}
  </div>`;
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
  return `<h1>Professeur</h1>${filtresHTML(filtre)}
    <div class="configuration-prof"><div class="reglages">
      ${reglageHTML("nombre", "Questions", options.nombre, 1, 40)}
      ${reglageHTML("secondes", "Recherche (s)", options.secondes, 5, 600)}
      ${reglageHTML("delai", "Pause entre questions (s)", options.delai, 0, 60)}
      <label>Correction<select id="correction">
        <option value="each" ${options.correction === "each" ? "selected" : ""}>Après chaque question</option>
        <option value="end" ${options.correction === "end" ? "selected" : ""}>À la fin</option>
      </select></label>
      <label><input id="automatique" type="checkbox" ${options.automatique ? "checked" : ""}> Enchaîner automatiquement</label>
      <label><input id="aide-office" type="checkbox" ${options.aideOffice ? "checked" : ""}> Aide affichée d’office</label>
    </div><div class="selection-notions">${DOMAINES.map(([domaine, nom]) => {
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
      ${bouton("Donner cette série à ma classe", "classe", "secondaire", 'disabled title="Disponible au lot suivi"')}
    </div><p id="lien-serie" hidden></p>`;
}

export function bilanHTML(seance, parId, etoiles) {
  const projection = seance.mode === "project";
  const justes = seance.etats.filter((etat) => etat.juste);
  const autonomes = justes.filter((etat) => etat.aide === 0).length;
  const dessins = justes.filter((etat) => etat.aide === 1 || etat.aide === 2).length;
  const familles = [...new Set(seance.questions.map((question) => question.famille))];
  return `<h1>${projection ? "Corrections" : "Ma séance"}</h1>
    ${
      projection
        ? ""
        : `<div class="score">${justes.length} / ${seance.questions.length}</div>
      <p>${autonomes} sans aide · ${dessins} avec le dessin</p>`
    }
    ${
      projection
        ? ""
        : familles
            .map((id) => {
              const indices = seance.questions
                .map((question, i) => (question.famille === id ? i : -1))
                .filter((i) => i >= 0);
              const nombre = indices.filter((i) => seance.etats[i].juste).length;
              return `<div class="resume-notion"><span>${esc(parId[id].nom)}</span>
        <progress max="${indices.length}" value="${nombre}"></progress>${etoilesHTML(etoiles(id))}</div>`;
            })
            .join("")
    }
    <div class="liste-resultats">${seance.questions
      .map((question, i) => {
        return `<details><summary>${i + 1}. ${esc(parId[question.famille].nom)}
        <span>${projection ? "" : seance.etats[i].juste ? "✓" : "○"} Voir la correction</span></summary>
        ${enonceHTML(question)}${correctionHTML(question)}</details>`;
      })
      .join("")}</div>
    <div class="actions-prof">${bouton("Encore une séance", "encore", "primaire")}
      ${bouton("Retour", "accueil", "secondaire")}</div>`;
}
