import { mathHtml } from "./math-format.js";

export function symbolesQuestion(question) {
  if (question.fields.every((champ) => champ.options)) return [];
  if (question.fields.every((champ) => champ.kind === "fraction")) return ["−"];
  const symboles = ["−", "/"];
  if (question.fields.some((champ) => champ.kind === "expression")) {
    const lettres = question.fields.flatMap((champ) => {
      return (
        String(champ.answer)
          .replace(/sqrt|pi/g, "")
          .match(/[a-z]/g) || []
      );
    });
    symboles.push("+", "×", "(", ")", "²", ...lettres);
  }
  if (
    question.check?.type === "set" ||
    question.fields.some((champ) => /sépar|solution|antécédent/i.test(champ.label))
  ) {
    symboles.push(";", "√");
  }
  if (question.famille === "NC29") symboles.push("Aucune solution");
  if (["EG06", "EG15", "PI04"].includes(question.famille)) {
    symboles.push(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  }
  if (/π|sqrt|√/.test(question.prompt + question.fields.map((champ) => champ.answer).join(" "))) {
    symboles.push("π", "√", "(", ")");
  }
  return [...new Set(symboles)];
}

function element(tag, classe, parent) {
  const noeud = document.createElement(tag);
  if (classe) noeud.className = classe;
  parent?.append(noeud);
  return noeud;
}

function libelleAccessible(texte) {
  return String(texte || "Réponse")
    .replace(/\[angle:([^\]]+)\]/g, "angle $1")
    .replace(/\[vector:([^\]]+)\]/g, "vecteur $1");
}

function ajouterSaisie(parent, champ, valeur, etiquette, options) {
  const saisie = element(
    "input",
    `champ ${champ.kind === "expression" ? "expression" : ""}`,
    parent,
  );
  saisie.type = "text";
  saisie.value = valeur;
  saisie.setAttribute("aria-label", libelleAccessible(etiquette));
  saisie.autocomplete = "off";
  saisie.autocapitalize = "off";
  saisie.spellcheck = false;
  saisie.maxLength = 160;
  saisie.placeholder = "…";
  saisie.inputMode = options.clavierEcran ? "none" : "text";
  saisie.disabled = options.terminee;
  saisie.addEventListener("input", options.changer);
  saisie.addEventListener("focus", () => options.cibler(saisie));
  saisie.addEventListener("click", () => options.cibler(saisie));
  saisie.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Enter") {
      evenement.preventDefault();
      options.valider();
    }
  });
  return saisie;
}

function ajouterChoix(parent, champ, valeur, rang, options) {
  const choix = element("div", "choix", parent);
  choix.setAttribute("role", "group");
  choix.setAttribute("aria-label", libelleAccessible(champ.label));
  champ.options.forEach((proposition, indice) => {
    const bouton = element("button", "choix-bouton", choix);
    bouton.type = "button";
    bouton.hidden = indice >= 4;
    bouton.innerHTML = mathHtml(proposition);
    bouton.disabled = options.terminee;
    bouton.classList.toggle("selectionne", String(proposition) === String(valeur));
    bouton.setAttribute("aria-pressed", String(String(proposition) === String(valeur)));
    bouton.onclick = () => {
      options.choisir(rang, String(proposition));
      choix.querySelectorAll("button").forEach((autre) => {
        autre.classList.toggle("selectionne", autre === bouton);
        autre.setAttribute("aria-pressed", String(autre === bouton));
      });
    };
  });
  if (champ.options.length > 4) ajouterPagesChoix(parent, choix);
}

function ajouterPagesChoix(parent, choix) {
  const navigation = element("div", "pages-choix", parent);
  const precedent = element("button", "bouton petit", navigation);
  const repere = element("span", "", navigation);
  const suivant = element("button", "bouton petit", navigation);
  precedent.textContent = "←";
  precedent.setAttribute("aria-label", "Choix précédents");
  suivant.textContent = "Autres choix →";
  const boutons = [...choix.querySelectorAll(".choix-bouton")];
  let page = 0;
  const afficher = () => {
    boutons.forEach((bouton, indice) => {
      bouton.hidden = Math.floor(indice / 4) !== page;
    });
    repere.textContent = `${page + 1} / ${Math.ceil(boutons.length / 4)}`;
    precedent.disabled = page === 0;
    suivant.disabled = (page + 1) * 4 >= boutons.length;
  };
  precedent.onclick = () => {
    page -= 1;
    afficher();
  };
  suivant.onclick = () => {
    page += 1;
    afficher();
  };
  afficher();
}

export function paginerChoixProjection(parent) {
  parent.querySelectorAll(".choix").forEach((choix) => {
    if (choix.children.length > 4) ajouterPagesChoix(parent, choix);
  });
}

export function monterChamps(parent, question, valeurs, options) {
  parent.replaceChildren();
  question.fields.forEach((champ, rang) => {
    const groupe = element("div", "champ-groupe", parent);
    const etiquette = element("span", "libelle-champ", groupe);
    etiquette.innerHTML = mathHtml(champ.label || "Réponse");
    if (champ.options) return ajouterChoix(groupe, champ, valeurs[rang], rang, options);
    const ligne = element("div", "saisie-ligne", groupe);
    if (champ.kind === "fraction") {
      const fraction = element("div", "fraction-saisie", ligne);
      const morceaux = String(valeurs[rang] || "").split("/");
      ["Numérateur", "Dénominateur"].forEach((nom, partie) => {
        if (partie) element("span", "barre-fraction", fraction);
        const saisie = ajouterSaisie(fraction, champ, morceaux[partie] || "", nom, options);
        saisie.dataset.champ = rang;
        saisie.dataset.partie = partie;
      });
    } else {
      const saisie = ajouterSaisie(ligne, champ, valeurs[rang] || "", champ.label, options);
      saisie.dataset.champ = rang;
    }
    if (champ.unit) element("span", "unite", ligne).textContent = champ.unit;
  });
}

export function lireChamps(parent, question, valeurs) {
  return question.fields.map((champ, rang) => {
    const saisies = [...parent.querySelectorAll(`[data-champ="${rang}"]`)];
    if (!saisies.length) return valeurs[rang];
    if (champ.kind !== "fraction") return saisies[0].value;
    return saisies.some((saisie) => saisie.value)
      ? saisies.map((saisie) => saisie.value).join("/")
      : "";
  });
}

export function insererTexte(saisie, texte) {
  if (!saisie || saisie.disabled) return;
  const debut = saisie.selectionStart ?? saisie.value.length;
  const fin = saisie.selectionEnd ?? debut;
  const depuis = texte === "effacer" && debut === fin ? Math.max(0, debut - 1) : debut;
  const ajout = texte === "effacer" ? "" : texte;
  saisie.value = (saisie.value.slice(0, depuis) + ajout + saisie.value.slice(fin)).slice(0, 160);
  saisie.focus({ preventScroll: true });
  saisie.setSelectionRange(depuis + ajout.length, depuis + ajout.length);
  saisie.dispatchEvent(new Event("input", { bubbles: true }));
}

export function monterSymboles(parent, question, inserer, liste = symbolesQuestion(question)) {
  parent.replaceChildren();
  liste.forEach((symbole) => {
    const bouton = element("button", "bouton petit", parent);
    bouton.innerHTML = mathHtml(symbole);
    bouton.setAttribute("aria-label", `Insérer ${symbole}`);
    bouton.onpointerdown = (evenement) => evenement.preventDefault();
    bouton.onclick = () => inserer(symbole);
  });
}

export function monterClavier(parent, question, actions) {
  parent.replaceChildren();
  // Le clavier n'a plus de touche ✓ : « Valider » est sous le clavier, avec Aide et Passer (Gwenaël, 21/10).
  // Les deux premiers symboles de la forme prennent la place du ✓ ; les autres, s'il y en a, au-dessus.
  const symboles = symbolesQuestion(question);
  const [premier = "", second = ""] = symboles;
  const autres = symboles.slice(2);
  if (autres.length) {
    monterSymboles(
      element("div", "clavier-symboles", parent),
      { ...question },
      actions.inserer,
      autres,
    );
  }
  const touches = element("div", "touches", parent);
  const liste = [
    "7",
    "8",
    "9",
    "⌫",
    "4",
    "5",
    "6",
    "⇥",
    "1",
    "2",
    "3",
    premier,
    ",",
    "0",
    "00",
    second,
  ];
  liste.forEach((touche) => {
    const bouton = element("button", touche ? "" : "vide", touches);
    if (!touche) {
      bouton.disabled = true;
      bouton.setAttribute("aria-hidden", "true");
      return;
    }
    const symbole = touche === premier || touche === second;
    if (symbole) {
      bouton.classList.add("symbole");
      bouton.innerHTML = mathHtml(touche);
    } else bouton.textContent = touche;
    bouton.setAttribute(
      "aria-label",
      { "⌫": "Effacer", "⇥": "Champ suivant" }[touche] || (symbole ? `Insérer ${touche}` : touche),
    );
    bouton.onpointerdown = (evenement) => evenement.preventDefault();
    bouton.onclick = () => {
      if (touche === "⇥") actions.suivant();
      else actions.inserer(touche === "⌫" ? "effacer" : touche);
    };
  });
}
