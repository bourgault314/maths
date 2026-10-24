import { mathHtml } from "./math-format.js";
import { polynomial } from "./core.js";

export function symbolesQuestion(question) {
  if (question.fields.every((champ) => champ.options)) return [];
  // Les cahiers disent quelles touches la question ajoute au pavé (« ; », « × », « ² »…).
  if (Array.isArray(question.touches)) return ["−", "/", ...question.touches];
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
  // Les lettres A B C… seulement si une réponse attendue s'écrit en lettres (« AOB », « B ») :
  // décidé champ par champ, plus par famille (K4 : « 42 » en EG06-d n'en a pas besoin).
  const nomPoint = (reponse) => /^[A-Z][A-Z′']*$/.test(String(reponse).trim());
  if (question.fields.some((champ) => !champ.options && nomPoint(champ.answer))) {
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
    `champ case ${champ.kind === "expression" ? "expression" : ""}`,
    parent,
  );
  saisie.type = "text";
  saisie.value = valeur;
  saisie.setAttribute("aria-label", libelleAccessible(etiquette));
  saisie.autocomplete = "off";
  saisie.autocapitalize = "off";
  saisie.spellcheck = false;
  saisie.maxLength = 160;
  saisie.inputMode = options.clavierEcran ? "none" : "text";
  saisie.disabled = options.terminee;
  saisie.addEventListener("input", options.changer);
  saisie.addEventListener("focus", () => options.cibler(saisie));
  saisie.addEventListener("click", () => options.cibler(saisie, true));
  saisie.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Enter") {
      evenement.preventDefault();
      options.valider();
    }
  });
  return saisie;
}

/* Cases à cocher (cahier NC17-a : « 2 · 5 · 10 · Aucun ») : on touche tous les bons, puis Valider.
   La valeur est la liste des choix cochés, dans l'ordre des propositions, séparés par « ; » ; le choix
   exclusif (« Aucun ») décoche les autres, et inversement. */
const cochesDe = (valeur) =>
  String(valeur || "")
    .split(";")
    .map((morceau) => morceau.trim())
    .filter(Boolean);

function ajouterCoches(parent, champ, valeur, rang, options) {
  const choix = element("div", "choix coches", parent);
  choix.setAttribute("role", "group");
  choix.setAttribute("aria-label", libelleAccessible(champ.label));
  let cochees = cochesDe(valeur);
  const bonnes = cochesDe(champ.answer);
  const boutons = champ.options.map((proposition) => {
    const bouton = element("button", "choix-bouton", choix);
    bouton.type = "button";
    bouton.innerHTML = mathHtml(proposition);
    bouton.disabled = options.terminee;
    if (options.corriger) {
      const bon = bonnes.includes(String(proposition));
      bouton.classList.toggle("bon", bon);
      bouton.classList.toggle("faux", !bon && cochees.includes(String(proposition)));
    }
    bouton.onclick = () => {
      const texte = String(proposition);
      if (cochees.includes(texte)) cochees = cochees.filter((c) => c !== texte);
      else if (texte === champ.exclusif) cochees = [texte];
      else cochees = [...cochees.filter((c) => c !== champ.exclusif), texte];
      cochees = champ.options.map(String).filter((c) => cochees.includes(c));
      options.choisir(rang, cochees.join(" ; "));
      afficher();
    };
    return bouton;
  });
  const afficher = () =>
    boutons.forEach((bouton, indice) => {
      const coche = cochees.includes(String(champ.options[indice]));
      bouton.classList.toggle("selectionne", coche);
      bouton.setAttribute("aria-pressed", String(coche));
    });
  afficher();
}

function ajouterChoix(parent, champ, valeur, rang, options) {
  if (champ.multiple) return ajouterCoches(parent, champ, valeur, rang, options);
  // Des phrases (cahier NC17-e) : les boutons l'un sous l'autre.
  const choix = element("div", champ.colonne ? "choix une-colonne" : "choix", parent);
  choix.setAttribute("role", "group");
  choix.setAttribute("aria-label", libelleAccessible(champ.label));
  champ.options.forEach((proposition, indice) => {
    const bouton = element("button", "choix-bouton", choix);
    bouton.type = "button";
    bouton.hidden = indice >= 4;
    bouton.innerHTML = mathHtml(proposition);
    bouton.disabled = options.terminee;
    bouton.classList.toggle("selectionne", String(proposition) === String(valeur));
    // Après la réponse : le choix de l'élève en rouge s'il est faux, le bon en vert.
    if (options.corriger) {
      const bon = String(proposition) === String(champ.answer);
      bouton.classList.toggle("bon", bon);
      bouton.classList.toggle("faux", !bon && String(proposition) === String(valeur));
    }
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

/* ------------------------------------------------------------------
   Les cases dans le calcul (coque d'après la V2, C3). Chaque question tombe dans un cas :
   - « gabarit » : la forme a un gabarit (ex. "1/4 = [0]", rempli par les cahiers) ; il passe en premier ;
   - « qcm » : tous les champs sont à choix (grille de gros boutons, pas de clavier) ;
   - « comparaison » : un champ < = > ; la case entre les deux nombres, les signes en grosses touches ;
   - « carres » : l'énoncé contient des □ ; chaque □ devient la case n° i, dans l'ordre ;
   - « ranger » : « Range… » ; les nombres en cartes à toucher, rangés dans [ ] < [ ] < [ ] ;
   - « calcule » : une seule case et l'énoncé commence par « Calcule » : « X = [ ] » ;
   - « seule » : tous les autres cas ; la case seule, centrée sous la phrase.
   Le modèle est un texte où « [i] » marque la case du champ i. Il n'est JAMAIS recollé en HTML :
   les morceaux de texte passent par mathHtml (comme l'énoncé), les cases sont des éléments DOM.
   ------------------------------------------------------------------ */
const SIGNES = ["<", "=", ">"];

function phrases(texte) {
  return String(texte)
    .trim()
    .split(/(?<=\.)\s+(?=\p{Lu})/u);
}

function sansPoint(texte) {
  return texte.replace(/\s*\.$/, "");
}

function finirConsigne(debut, autres) {
  return [`${sansPoint(debut.trim())}.`, ...autres].join(" ");
}

// « Complète : 3 □ 2,95 » → consigne « Complète. », calcul « 3 □ 2,95 ». Sans « : », la phrase entière
// est le calcul (la case reste dans la phrase).
function couper(prompt, repere) {
  const liste = phrases(prompt);
  const rang = liste.findIndex((phrase) => repere.test(phrase));
  if (rang < 0) return null;
  const autres = liste.filter((_, indice) => indice !== rang);
  const phrase = sansPoint(liste[rang]);
  const deuxPoints = phrase.match(/^([^:]*?)\s*:\s*(.+)$/u);
  let consigne = "";
  let calcul = phrase;
  if (deuxPoints && !repere.test(deuxPoints[1])) [, consigne, calcul] = deuxPoints;
  else if (/^Complète\s/.test(phrase)) [consigne, calcul] = ["Complète", phrase.slice(9)];
  // « 9/4 = □ + □/4, avec la dernière fraction inférieure à 1 » : la précision va dans la consigne.
  const precision = calcul.match(/^(.*?),\s+(\p{Ll}[^□…]*)$/u);
  if (precision && consigne) {
    calcul = precision[1];
    consigne = `${consigne}, ${precision[2]}`;
  }
  return { consigne: consigne ? finirConsigne(consigne, autres) : autres.join(" "), calcul };
}

function numeroter(calcul, repere) {
  let rang = 0;
  return calcul.replace(repere, () => `[${rang++}]`);
}

export function modeleQuestion(question, gabarit = question.gabarit) {
  const champs = question.fields;
  const prompt = String(question.prompt || "");
  if (gabarit) return { cas: "gabarit", consigne: null, modele: String(gabarit) };
  const signes = (champ) => champ.options && [...champ.options].sort().join("") === "<=>";
  if (champs.length === 1 && signes(champs[0])) {
    const coupe = couper(prompt, /□|…/);
    if (coupe) {
      return {
        cas: "comparaison",
        consigne: coupe.consigne,
        modele: numeroter(coupe.calcul, /□|…/g),
      };
    }
  }
  if (champs.every((champ) => champ.options)) return { cas: "qcm", consigne: null, modele: null };
  const cases = (prompt.match(/□/g) || []).length;
  if (cases && cases === champs.length && champs.every((champ) => !champ.options)) {
    const coupe = couper(prompt, /□/);
    // Sans consigne à part (« Quel chiffre faut-il mettre dans 1□5… ? »), la phrase garde sa case.
    return {
      cas: "carres",
      consigne: coupe.consigne || null,
      modele: numeroter(coupe.calcul, /□/g),
      phrase: !coupe.consigne,
    };
  }
  if (/^Range\b/.test(prompt) && champs.length > 1 && champs.every((champ) => !champ.options)) {
    const [entete, liste = ""] = sansPoint(phrases(prompt)[0]).split(/\s*:\s*/);
    const cartes = liste.split(/\s*;\s*/).filter(Boolean);
    if (cartes.length === champs.length) {
      const signe = /décroissant/.test(entete) ? ">" : "<";
      return {
        cas: "ranger",
        consigne: finirConsigne(entete, phrases(prompt).slice(1)),
        modele: champs.map((_, rang) => `[${rang}]`).join(` ${signe} `),
        cartes,
      };
    }
  }
  // « Calcule… » et « Calculer… » (PF03) ; depuis K10, aussi « Réduis », « Développe (et réduis) »,
  // « Factorise », « Simplifie » : « 3x² − x + x² + 5x − 7 = [ ] » (planche 12, NC20-b).
  const verbe = prompt.match(
    /^(?:Calculer?|Réduis|Développe|Factorise|Simplifie)(?![\p{L}])/u,
  )?.[0];
  if (champs.length === 1 && !champs[0].options && verbe) {
    const [premiere, ...autres] = phrases(prompt);
    const phrase = sansPoint(premiere);
    const avecDeuxPoints = phrase.match(
      /^((?:Calculer?|Réduis|Développe|Factorise|Simplifie)[^:]*?)\s*:\s*(.+)$/u,
    );
    const [consigne, calcul] = avecDeuxPoints
      ? [avecDeuxPoints[1], avecDeuxPoints[2]]
      : [verbe, phrase.slice(verbe.length).trim()];
    // « Calcule 3x + 1 pour x = 4 » n'est pas un calcul à compléter : la case reste seule.
    if (/\d/.test(calcul) && !/=|\spour\s/.test(calcul)) {
      const unite = champs[0].unit ? ` ${champs[0].unit}` : "";
      return {
        cas: "calcule",
        consigne: finirConsigne(consigne, autres),
        modele: `${calcul} = [0]${unite}`,
      };
    }
  }
  // K8 : une case seule avec une étiquette s'écrit dans la ligne, « COD = [ ] ° » ; une étiquette
  // qui décrit la saisie (« Toutes les solutions », « Diviseurs, séparés par ; ») prend « : ».
  const etiquette = champs.length === 1 && !champs[0].options ? champs[0].label || "" : "";
  if (etiquette && !/^(Réponse|Choisis)/.test(etiquette)) {
    const unite = champs[0].unit
      ? `${/^[°%]$/.test(champs[0].unit) ? "" : " "}${champs[0].unit}`
      : "";
    const lien = /=\s*$/.test(etiquette)
      ? ""
      : /[;,]|^(Toutes|Trois|Nombre)\b/.test(etiquette)
        ? " :"
        : " =";
    return { cas: "etiquette", consigne: null, modele: `${etiquette.trim()}${lien} [0]${unite}` };
  }
  // K8 : Abscisse / Ordonnée s'écrivent « A ( [ ] ; [ ] ) », le point pris dans l'énoncé s'il y est.
  if (
    champs.length === 2 &&
    champs.every((champ) => !champ.options) &&
    /^Abscisse/.test(champs[0].label || "") &&
    /^Ordonnée/.test(champs[1].label || "")
  ) {
    const point = prompt.match(/coordonnées de (?:l’image )?([A-Z]′?)(?![\p{L}\p{N}])/u)?.[1] || "";
    return {
      cas: "coordonnees",
      consigne: null,
      modele: `${point ? `${point} ` : ""}( [0] ; [1] )`,
    };
  }
  return { cas: "seule", consigne: null, modele: null };
}

// Le modèle en morceaux : texte, case, fraction dont un terme est une case, puissance « 2^[0] ».
export function morceauxModele(modele) {
  const bruts = String(modele)
    .split(/(\[\d+\])/)
    .map((morceau) => {
      const rang = morceau.match(/^\[(\d+)\]$/);
      return rang ? { case: Number(rang[1]) } : { texte: morceau };
    });
  const sortie = [];
  for (let i = 0; i < bruts.length; i++) {
    const morceau = bruts[i];
    if (!("case" in morceau)) {
      sortie.push(morceau);
      continue;
    }
    const avant = sortie.at(-1);
    const apres = bruts[i + 1];
    const numerateur = avant?.texte?.match(/^(.*?)(\(?[\w,]+\)?)\s*\/\s*$/u);
    const exposant = avant?.texte?.match(/^(.*?)([\w,]+)\^$/u);
    const denominateur = apres?.texte?.match(/^\s*\/\s*(\(?[\w,]+\)?)(.*)$/su);
    if (numerateur) {
      avant.texte = numerateur[1];
      sortie.push({ fraction: [{ texte: numerateur[2] }, morceau] });
    } else if (exposant) {
      avant.texte = exposant[1];
      sortie.push({ puissance: [{ texte: exposant[2] }, morceau] });
    } else if (denominateur) {
      sortie.push({ fraction: [morceau, { texte: denominateur[1] }] });
      apres.texte = denominateur[2];
    } else sortie.push(morceau);
  }
  return sortie.filter((morceau) => !("texte" in morceau) || morceau.texte.trim());
}

// Une réponse attendue telle qu'on l'écrit : virgule décimale, vrai signe moins.
export function ecrireReponse(valeur) {
  return String(valeur ?? "")
    .replace(/(\d)\.(\d)/g, "$1,$2")
    .replace(/(^|[\s(=;])-(?=[\d\p{L}(])/gu, "$1−");
}

// Quand un calcul trop long passe à la ligne, il se coupe proprement : un signe reste avec le terme
// qui le suit (« − 7 », pas « − » en fin de ligne) et rien ne se coupe dans une parenthèse.
function coupuresPropres(span) {
  const parcours = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
  let profondeur = 0;
  for (let noeud = parcours.nextNode(); noeud; noeud = parcours.nextNode()) {
    let texte = "";
    for (const caractere of noeud.textContent) {
      if (caractere === "(") profondeur += 1;
      if (caractere === ")") profondeur = Math.max(0, profondeur - 1);
      const avant = texte.at(-1);
      texte +=
        caractere === " " && (profondeur > 0 || /[+−×÷=(]/.test(avant || ""))
          ? "\u00a0"
          : caractere;
    }
    noeud.textContent = texte;
  }
}

function texteMath(parent, texte, classe = "t") {
  const span = element("span", classe, parent);
  span.innerHTML = mathHtml(texte.trim());
  if (classe === "t") coupuresPropres(span);
  return span;
}

function valeurAffichee(champ, valeur) {
  return champ.kind === "fraction"
    ? String(valeur || "").replace("/", " / ")
    : String(valeur || "");
}

// Une case : un champ de saisie, ou, une fois la question finie (ou au diaporama), sa valeur en
// lecture seule. Les valeurs de l'élève passent par textContent, jamais par innerHTML.
function creerCase(parent, question, rang, valeurs, options, contexte) {
  const champ = question.fields[rang];
  if (!champ) return;
  const etat = options.etatCases?.[rang];
  if (options.lecture || champ.options || contexte.cas === "ranger") {
    const vide = !valeurs[rang];
    const cadre = element(
      contexte.cas === "ranger" ? "button" : "span",
      `case ${vide ? "vide" : ""} ${etat || ""} ${contexte.cas === "ranger" ? "ordre" : ""}`,
      parent,
    );
    cadre.setAttribute("aria-label", libelleAccessible(champ.label));
    if (cadre.tagName === "BUTTON") {
      cadre.type = "button";
      cadre.disabled = Boolean(options.lecture || options.terminee);
    }
    if (contexte.cas === "ranger" && !vide) {
      const carte = contexte.cartes.find((entree) => entree.valeur === valeurs[rang]);
      if (carte) cadre.innerHTML = mathHtml(carte.texte);
      else cadre.textContent = valeurs[rang];
      cadre.onclick = () => options.choisir(rang, "");
    } else if (contexte.cas === "ranger") cadre.textContent = "…";
    else cadre.textContent = ecrireReponse(valeurAffichee(champ, valeurs[rang]));
    if (champ.kind === "expression") cadre.classList.add("expression");
    if (champ.large) cadre.classList.add("large");
    return;
  }
  if (champ.kind === "fraction") {
    const fraction = element("span", "fraction-saisie", parent);
    const morceaux = String(valeurs[rang] || "").split("/");
    ["Numérateur", "Dénominateur"].forEach((nom, partie) => {
      if (partie) element("span", "barre-fraction", fraction);
      const saisie = ajouterSaisie(fraction, champ, morceaux[partie] || "", nom, options);
      saisie.dataset.champ = rang;
      saisie.dataset.partie = partie;
    });
    return;
  }
  const saisie = ajouterSaisie(parent, champ, valeurs[rang] || "", champ.label, options);
  saisie.dataset.champ = rang;
  if (contexte.plusieurs) saisie.classList.add("petite");
  // Une réponse longue (une liste de diviseurs, un produit) : une case large dès le départ.
  if (champ.large) saisie.classList.add("large");
  // K12 : la case d'une réponse-expression sera assez large pour la réponse attendue entière
  // (largeurCasesExpression) ; la réponse reste en mémoire, jamais dans la page.
  if (reponseExpression(champ)) {
    saisie.classList.add("case-expression");
    reponsesAttendues.set(saisie, ecrireReponse(champ.answer));
  }
}

/* K12 — une réponse-expression : champ « expression », ou réponse attendue qui contient une lettre. */
const reponsesAttendues = new WeakMap();
export function reponseExpression(champ) {
  return Boolean(
    champ &&
    !champ.options &&
    (champ.kind === "expression" || /[a-zA-Z]/.test(String(champ.answer))),
  );
}

// La largeur de chaque case-expression : la réponse attendue mesurée dans la police de la case,
// + 30 %, au plus la largeur de la carte ; sans défilement interne pour les réponses du moteur.
export function largeurCasesExpression(racine) {
  const contexte = document.createElement("canvas").getContext("2d");
  racine.querySelectorAll("input.case-expression").forEach((saisie) => {
    const texte = reponsesAttendues.get(saisie);
    if (!texte) return;
    const style = getComputedStyle(saisie);
    contexte.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const bords = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"]
      .map((cle) => parseFloat(style[cle]) || 0)
      .reduce((a, b) => a + b, 0);
    const carte = saisie.closest(".carte");
    const max = carte ? carte.clientWidth - 28 : innerWidth - 32;
    const voulue = Math.ceil(contexte.measureText(texte).width * 1.3 + bords);
    saisie.style.width = `${Math.min(max, Math.max(voulue, parseFloat(style.minWidth) || 0))}px`;
  });
}

/* K10 : dans le calcul (écrit en gras), les lettres sont les lettres rondes et grasses d'ÉquaSplat
   (SplatLettres-BoldItalic). Cette police ne dessine que les lettres mathématiques d'Unicode
   (𝑎…𝑧, ℎ) : on remplace la lettre a…z par la sienne. MG Math reste pour le texte maigre. */
export function lettresGrasses(racine) {
  const lettre = (c) => (c === "h" ? "ℎ" : String.fromCodePoint(0x1d44e + c.charCodeAt(0) - 97));
  racine?.querySelectorAll(".math-variable").forEach((variable) => {
    variable.textContent = variable.textContent.replace(/[a-z]/g, lettre);
    variable.classList.add("lettre-grasse");
  });
}

function monterModele(parent, question, valeurs, options, contexte) {
  const ligne = element("div", contexte.phrase ? "calcul phrase" : "calcul", parent);
  const morceaux = morceauxModele(contexte.modele);
  morceaux.forEach((morceau, rang) => {
    const suivant = morceaux[rang + 1];
    // K12 : le calcul d'une réponse-expression se termine par « = » (accroché au dernier terme
    // par une espace insécable) ; la case passe sur la ligne suivante.
    const dessous =
      "texte" in morceau &&
      suivant &&
      "case" in suivant &&
      reponseExpression(question.fields[suivant.case]) &&
      /=\s*$/.test(morceau.texte);
    if (dessous) {
      // Dans le dernier bloc du calcul (inline-block) : sinon la ligne se coupe juste avant « = ».
      const texte = texteMath(ligne, morceau.texte.replace(/\s*=\s*$/, ""));
      (texte.querySelector(":scope > .math-expression:last-child") || texte).append("\u00a0=");
      ligne.classList.add("expression-dessous");
      element("span", "saut", ligne);
    } else if ("texte" in morceau) texteMath(ligne, morceau.texte);
    else if ("case" in morceau)
      creerCase(ligne, question, morceau.case, valeurs, options, contexte);
    else {
      const [haut, bas] = morceau.fraction || morceau.puissance;
      const bloc = element("span", morceau.fraction ? "fraction-case" : "puissance-case", ligne);
      for (const [partie, classe] of [
        [haut, "haut"],
        [bas, "bas"],
      ]) {
        const place = element("span", classe, bloc);
        if ("texte" in partie) texteMath(place, partie.texte, "");
        else creerCase(place, question, partie.case, valeurs, options, contexte);
        if (morceau.fraction && classe === "haut") element("span", "barre", bloc);
      }
    }
  });
  lettresGrasses(ligne);
  const coche = options.etatCases?.every((etat) => etat === "juste");
  if (coche) element("span", "coche", ligne).textContent = "✓";
}

// Les cartes à toucher de « Range… » : la valeur de chaque carte est celle du champ attendu qui lui
// est égal (« 7/4 » vaut « 1.75 »), pour que la vérification reste celle du moteur.
function cartesRanger(question, textes) {
  const attendues = question.fields.map((champ) => champ.answer);
  return textes.map((texte) => {
    let valeur = texte;
    try {
      const nombre = polynomial(texte)[0];
      valeur =
        attendues.find((attendue) => Math.abs(polynomial(attendue)[0] - nombre) < 1e-9) ?? texte;
    } catch {
      /* Écriture que l'analyseur ne lit pas : la carte garde son texte. */
    }
    return { texte, valeur };
  });
}

function monterCartes(parent, cartes, valeurs, options) {
  const rangee = element("div", "cartes-ordre", parent);
  const restantes = [...valeurs];
  for (const carte of cartes) {
    const bouton = element("button", "carte-nombre", rangee);
    bouton.type = "button";
    bouton.innerHTML = mathHtml(carte.texte);
    const place = restantes.indexOf(carte.valeur);
    if (place >= 0) restantes[place] = null;
    bouton.classList.toggle("pris", place >= 0);
    bouton.disabled = place >= 0 || Boolean(options.terminee || options.lecture);
    bouton.onclick = () => {
      const libre = valeurs.findIndex((valeur) => !valeur);
      if (libre >= 0) options.choisir(libre, carte.valeur);
    };
  }
}

/* La réponse de la question, dans la carte : cases dans le calcul, cartes à ranger, choix d'un QCM,
   ou case seule sous la phrase. options : terminee, lecture (valeurs sans saisie), etatCases
   (« juste » / « faux » par champ), clavierEcran, changer, cibler, valider, choisir(rang, valeur). */
export function monterReponse(parent, question, valeurs, options) {
  parent.replaceChildren();
  // Une copie : le modèle sert à chaque nouveau montage (une carte posée, un signe choisi).
  const contexte = { ...(options.modele || modeleQuestion(question)) };
  parent.dataset.cas = contexte.cas;
  contexte.plusieurs = question.fields.length > 1;
  if (contexte.cas === "ranger") {
    contexte.cartes = cartesRanger(question, contexte.cartes);
    monterCartes(parent, contexte.cartes, valeurs, options);
  }
  if (contexte.modele) return monterModele(parent, question, valeurs, options, contexte);
  question.fields.forEach((champ, rang) => {
    const groupe = element("div", "champ-groupe", parent);
    // Une seule case : pas d'étiquette « Réponse » ; plusieurs : leurs étiquettes restent.
    if (question.fields.length > 1 || (champ.label && !/^(Réponse|Choisis)/.test(champ.label))) {
      element("span", "libelle-champ", groupe).innerHTML = mathHtml(champ.label || "");
    }
    if (champ.options) return ajouterChoix(groupe, champ, valeurs[rang], rang, options);
    const ligne = element("div", "saisie-ligne", groupe);
    creerCase(ligne, question, rang, valeurs, options, contexte);
    if (champ.unit) element("span", "unite", ligne).textContent = champ.unit;
    if (options.etatCases?.[rang] === "juste" && rang === question.fields.length - 1)
      element("span", "coche", ligne).textContent = "✓";
  });
}

// Un réglage d'affichage d'une forme (gabarit, coinAide, erreurs) : celui de la question s'il existe,
// sinon celui de la forme dans le catalogue (les cahiers le rempliront forme par forme).
export function reglageForme(question, famille, cle) {
  return (
    question[cle] ?? famille?.formes?.find((forme) => forme.id === question.forme)?.[cle] ?? null
  );
}

// Comparer : les trois signes en grosses touches, à la place du clavier.
export function monterSignes(parent, champ, valeur, choisir) {
  parent.replaceChildren();
  parent.hidden = false;
  for (const signe of SIGNES.filter((entree) => champ.options.includes(entree))) {
    const bouton = element("button", "signe", parent);
    bouton.type = "button";
    bouton.textContent = signe;
    bouton.setAttribute("aria-label", { "<": "Inférieur", "=": "Égal", ">": "Supérieur" }[signe]);
    bouton.setAttribute("aria-pressed", String(signe === valeur));
    bouton.onpointerdown = (evenement) => evenement.preventDefault();
    bouton.onclick = () => choisir(signe);
  }
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
    // « ² » seul est minuscule et se confond avec 2 : la touche montre « □² », un exposant posé sur une case.
    if (/^[²³]$/.test(symbole)) {
      bouton.classList.add("exposant");
      bouton.innerHTML = `<span class="case-touche" aria-hidden="true">□</span>${symbole}`;
    }
    bouton.setAttribute("aria-label", `Insérer ${symbole}`);
    bouton.onpointerdown = (evenement) => evenement.preventDefault();
    bouton.onclick = () => inserer(symbole);
  });
}

/* Le pavé (coque V2, C4) : 5 colonnes, 3 rangées — 1 2 3 4 5 / 6 7 8 9 0 / , − / ⌫ (⌫ sur deux
   colonnes). Plus de touche ⇥ « case suivante » : on touche la case qu'on veut remplir (Tab reste au
   clavier de l'ordinateur). Les symboles propres à la question (sauf − et /, déjà sur le pavé) vont
   sur UNE rangée au-dessus, seulement quand la question en a besoin ; les lettres restent rondes
   (police MG Math, par mathHtml). */
export function monterClavier(parent, question, actions) {
  parent.replaceChildren();
  // La lettre de l'expression en tête de la rangée (« x + × ( ) ² »), comme sur la planche 16.
  const lettre = (symbole) => (/^[a-z]$/.test(symbole) ? 0 : 1);
  const autres = symbolesQuestion(question)
    .filter((symbole) => !["−", "/"].includes(symbole))
    .sort((a, b) => lettre(a) - lettre(b));
  if (autres.length) {
    monterSymboles(element("div", "clavier-symboles", parent), question, actions.inserer, autres);
  }
  const touches = element("div", "touches", parent);
  for (const touche of [..."1234567890", ",", "−", "/", "⌫"]) {
    const bouton = element("button", "", touches);
    bouton.type = "button";
    bouton.textContent = touche;
    if (["−", "/"].includes(touche)) bouton.classList.add("symbole");
    if (touche === "⌫") bouton.classList.add("effacer");
    bouton.setAttribute(
      "aria-label",
      touche === "⌫" ? "Effacer" : ["−", "/"].includes(touche) ? `Insérer ${touche}` : touche,
    );
    bouton.onpointerdown = (evenement) => evenement.preventDefault();
    bouton.onclick = () => actions.inserer(touche === "⌫" ? "effacer" : touche);
  }
}
