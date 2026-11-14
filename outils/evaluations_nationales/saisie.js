/* maths&go — Évaluations nationales : réponses tapées sur un pavé intégré (lot EN8a, « exemples de questions » Eduscol).
   Une question à réponse courte décrit ses lignes de réponse (`g.saisie.lignes`) : un modèle où chaque □ est une case
   (« C(□ ; □) », « 𝑥 = □° »), les valeurs attendues des cases et les pièges analysés par la fiche professeur.
   Pas de champ de saisie du navigateur : les cases sont des boutons, le pavé est celui de l'appli (pas de clavier du
   téléphone qui fait sauter la page), et le clavier de l'ordinateur marche aussi. Rien ne sort de l'appareil.
   Les fonctions de correction sont pures : les tests node les appellent directement.
   Lot EN8b : une ligne peut accepter une fraction (`fraction: true`, touche « fraction » au pavé : ce qui est déjà tapé
   devient le numérateur, la suite va au dénominateur ; la case s'affiche en fraction) ou une formule (`expression: true`,
   pavé avec 𝑛, +, −, ×, parenthèses ; toute écriture égale est acceptée, vérifiée en calculant la formule pour plusieurs
   valeurs de 𝑛). Les cases peuvent aussi être placées par la page (grille dont les lignes ont une case : `brancher`). */
(function (racine) {
  "use strict";

  const TOUCHES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ",", "−", "←"];
  const FRACTION = "/"; // la touche « fraction » (au clavier : la barre oblique)
  // Pavés : nombres (13 touches), nombres et fractions (14 touches), formules (18 touches, sur 6 colonnes).
  const PAVES = {
    nombre: TOUCHES,
    fraction: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ",", "−", FRACTION, "←"],
    expression: ["7", "8", "9", "n", "(", ")", "4", "5", "6", "+", "−", "×", "1", "2", "3", "0", ",", "←"],
  };
  const MAX = 9; // signes par case
  const MAX_FRACTION = 11; // une fraction : 4/−3, −36/24…
  const MAX_EXPRESSION = 24; // une formule : 1+2(n−1)…
  const MARQUE = "□";
  const LETTRE = "𝑛"; // la lettre affichée (dans la case, la formule garde un n tout simple)

  // Le type d'une ligne : « nombre » (par défaut), « fraction » ou « expression ».
  const typeDe = (ligne) => (ligne && ligne.expression ? "expression" : ligne && ligne.fraction ? "fraction" : "nombre");
  const typeValide = (type) => (type === "fraction" || type === "expression" ? type : "nombre");

  // « −4 », « 2,5 », « −0,5 », « 3/2 », « −7/20 », « 4/−3 » → nombre ; une écriture incomplète (« − », « 3, », « 3/ »,
  // vide) ou un dénominateur nul → null.
  function lireNombre(texte) {
    const t = String(texte || "").trim();
    const m = /^(−?\d+(?:,\d+)?)(?:\/(−?\d+(?:,\d+)?))?$/.exec(t);
    if (!m) return null;
    const lire = (x) => Number(x.replace("−", "-").replace(",", "."));
    if (m[2] === undefined) return lire(m[1]);
    const d = lire(m[2]);
    return d === 0 ? null : lire(m[1]) / d;
  }
  // Le nombre attendu écrit comme sur une copie : « −4 », « 2,5 ».
  function ecrire(n) {
    const t = String(Math.round(n * 1e6) / 1e6).replace(".", ",");
    return t.replace("-", "−");
  }
  const egal = (a, b) => a !== null && b !== null && Math.abs(a - b) < 1e-9;
  // Une valeur attendue (ou d'un piège) : un nombre, ou une écriture (« 3/2 »).
  const valeurDe = (v) => (typeof v === "number" ? v : lireNombre(String(v)));

  // ---------- Formules (lot EN8b) ----------
  // Lit une formule en n tapée au pavé (« 2n−1 », « n+(n−1) », « 1+2(n−1) ») : renvoie la fonction n ↦ valeur, ou null
  // si la formule n'a pas de sens. Multiplication sous-entendue (2n, 2(n−1), n(n+1), (n+1)(n−1)), priorités respectées,
  // parenthèses fermées d'office à la fin (comme la calculatrice). Jamais eval : un petit lecteur de formules.
  function lireExpression(texte) {
    const t = String(texte || "").replace(/\s/g, "").replace(/𝑛/g, "n").replace(/[−–]/g, "-").replace(/[×*]/g, "*").replace(/,/g, ".");
    if (!t || !/^[0-9n+\-*().]+$/.test(t)) return null;
    const jetons = [];
    for (let i = 0; i < t.length;) {
      const m = /^\d+(\.\d+)?/.exec(t.slice(i));
      if (m) { jetons.push({ k: "nb", v: Number(m[0]) }); i += m[0].length; continue; }
      if (t[i] === ".") return null;
      jetons.push({ k: t[i] });
      i++;
    }
    // Multiplication sous-entendue : entre (nombre, n, « ) ») et (nombre, n, « ( »).
    const avecFois = [];
    for (const j of jetons) {
      const avant = avecFois[avecFois.length - 1];
      if (avant && /^(nb|n|\))$/.test(avant.k) && /^(nb|n|\()$/.test(j.k)) avecFois.push({ k: "*" });
      avecFois.push(j);
    }
    const ouvertes = avecFois.filter((j) => j.k === "(").length - avecFois.filter((j) => j.k === ")").length;
    if (ouvertes < 0) return null;
    for (let k = 0; k < ouvertes; k++) avecFois.push({ k: ")" });
    let i = 0;
    const ERREUR = {};
    // Arbre de la formule, puis une fonction qui le calcule.
    const facteur = () => {
      const j = avecFois[i];
      if (!j) throw ERREUR;
      if (j.k === "-" || j.k === "+") { i++; const f = facteur(); return j.k === "-" ? (n) => -f(n) : f; }
      if (j.k === "(") {
        i++;
        const f = somme();
        if (!avecFois[i] || avecFois[i].k !== ")") throw ERREUR;
        i++;
        return f;
      }
      if (j.k === "nb") { i++; return () => j.v; }
      if (j.k === "n") { i++; return (n) => n; }
      throw ERREUR;
    };
    const produit = () => {
      let f = facteur();
      while (avecFois[i] && avecFois[i].k === "*") { i++; const a = f, b = facteur(); f = (n) => a(n) * b(n); }
      return f;
    };
    const somme = () => {
      let f = produit();
      while (avecFois[i] && (avecFois[i].k === "+" || avecFois[i].k === "-")) {
        const op = avecFois[i++].k, a = f, b = produit();
        f = op === "+" ? (n) => a(n) + b(n) : (n) => a(n) - b(n);
      }
      return f;
    };
    try {
      const f = somme();
      return i === avecFois.length ? f : null;
    } catch (e) {
      return null;
    }
  }
  // Valeurs de n où deux formules sont comparées (des entiers, une décimale) : deux formules égales en ces 9 valeurs
  // sont égales (ce sont des polynômes de degré au plus 8 ; ici, de degré 1 ou 2).
  const ESSAIS = [0, 1, 2, 3, 4, 5, 7, 10, 0.5];
  function memeFormule(f, g) {
    return Boolean(f && g) && ESSAIS.every((n) => Math.abs(f(n) - g(n)) < 1e-9 * Math.max(1, Math.abs(g(n))));
  }
  // La formule n'utilise pas la lettre (« 7 » : le nombre de carrés d'une étape au lieu d'une formule).
  const sansLettre = (texte) => !/[n𝑛]/.test(String(texte));
  // Une formule écrite comme sur une copie : espaces autour de + − × (pas après un « ( » ni au début), 𝑛 en italique.
  function ecrireFormule(texte, html) {
    let sortie = "";
    const t = String(texte).replace(/𝑛/g, "n");
    for (let i = 0; i < t.length; i++) {
      const c = t[i], avant = t[i - 1];
      const binaire = (c === "+" || c === "−" || c === "×") && i > 0 && avant !== "(" && !/[+−×]/.test(avant);
      const lettre = html ? '<i class="lettre">n</i>' : LETTRE;
      sortie += c === "n" ? lettre : binaire ? ` ${c} ` : c;
    }
    return sortie.replace(/ $/, "");
  }
  // Une fraction tapée, écrite empilée (« −7/20 » : le moins devant la fraction).
  function ecrireFraction(texte) {
    const t = String(texte);
    if (!t.includes("/")) return t;
    const signe = t.startsWith("−") ? "−" : "";
    const [num, den] = t.replace(/^−/, "").split("/");
    return `${signe}<span class="frac"><span>${num}</span><span>${den || " "}</span></span>`;
  }
  // Ce que l'élève a tapé, écrit pour le bilan.
  function ecrireTape(texte, type) {
    if (type === "expression") return texte ? ecrireFormule(texte, true) : texte;
    const n = lireNombre(texte);
    if (n === null) return texte;
    return type === "fraction" && texte.includes("/") ? ecrireFraction(texte) : ecrire(n);
  }
  // Une valeur attendue écrite pour le bilan : « 3/2 » en fraction, une formule avec 𝑛, un nombre comme sur une copie.
  function ecrireAttendu(v, type) {
    if (type === "expression") return ecrireFormule(v, true);
    if (typeof v === "string" && v.includes("/")) return ecrireFraction(v);
    return ecrire(valeurDe(v));
  }
  // Une case est-elle écrite jusqu'au bout ?
  const complete = (texte, type) => (type === "expression" ? lireExpression(texte) !== null : lireNombre(texte) !== null);

  // Les cases d'une question, dans l'ordre : [{ ligne, rang, attendu, type }].
  function cases(saisie) {
    const liste = [];
    saisie.lignes.forEach((l, ligne) => l.attendus.forEach((attendu, rang) => liste.push({ ligne, rang, attendu, type: typeDe(l) })));
    return liste;
  }
  // Une ligne écrite avec ses valeurs (« C(1 ; −4) ») ; une case vide s'écrit « … ».
  function remplir(modele, valeurs) {
    let k = 0;
    return modele.replace(new RegExp(MARQUE, "g"), () => {
      const v = valeurs[k++];
      return v === undefined || v === null || v === "" ? "…" : v;
    });
  }
  // Une case juste ? (formule : égale à la formule attendue ; nombre ou fraction : même valeur.)
  function caseJuste(texte, attendu, type) {
    if (type === "expression") return memeFormule(lireExpression(texte), lireExpression(attendu));
    return egal(lireNombre(texte), valeurDe(attendu));
  }
  // Le piège d'une ligne fausse : mêmes valeurs (nombres, fractions égales comprises), même formule, ou formule sans 𝑛.
  function piegeDe(ligne, tapees) {
    const type = typeDe(ligne);
    return (ligne.pieges || []).find((p) => {
      if (type === "expression") return p.sansLettre ? tapees[0] !== "" && sansLettre(tapees[0]) && lireExpression(tapees[0]) !== null
        : memeFormule(lireExpression(tapees[0]), lireExpression(p.formule));
      return p.valeurs.every((v, i) => egal(lireNombre(tapees[i]), valeurDe(v)));
    });
  }

  // Corrige une réponse. valeurs : le texte tapé dans chaque case, dans l'ordre des cases.
  // Renvoie { juste, html (la réponse de l'élève), bonne (la réponse attendue), erreurs[] (pièges reconnus) }.
  // Une question compte 1 point si toutes ses cases sont justes (comme les grilles, décision du 14/11).
  function corriger(saisie, valeurs) {
    let k = 0, juste = true;
    const erreurs = [], lignesEleve = [], lignesBonnes = [];
    for (const l of saisie.lignes) {
      const type = typeDe(l);
      const tapees = l.attendus.map(() => valeurs[k++] || "");
      const ok = l.attendus.every((a, i) => caseJuste(tapees[i], a, type));
      if (!ok) {
        juste = false;
        const piege = piegeDe(l, tapees);
        if (piege) erreurs.push(piege.erreur);
      }
      // Une ligne de fractions ne se coupe pas (au téléphone, « = − » restait seul au bout de la ligne).
      const tenir = (h) => (type === "fraction" ? `<span class="insecable">${h}</span>` : h);
      lignesEleve.push(tenir(remplir(l.modele, tapees.map((t) => ecrireTape(t, type)))));
      lignesBonnes.push(tenir(remplir(l.modele, l.attendus.map((a) => ecrireAttendu(a, type)))));
    }
    return { juste, html: lignesEleve.join(" · "), bonne: lignesBonnes.join(" · "), erreurs };
  }

  // Ajoute une touche au texte d'une case (règles d'écriture d'un nombre, d'une fraction ou d'une formule).
  // type : « nombre » par défaut (les tests appellent aussi taper(texte, touche) seul).
  function taper(texte, touche, type) {
    type = typeValide(type);
    if (touche === "←") return Array.from(texte).slice(0, -1).join("");
    if (type === "expression") {
      if (texte.length >= MAX_EXPRESSION) return texte;
      const dernier = texte.slice(-1);
      if (touche === ",") return /\d/.test(dernier) && !/\d,\d*$/.test(texte) ? texte + "," : texte;
      if (/^\d$/.test(touche)) return dernier === "," || /\d/.test(dernier) ? (/(^|[^\d,])0$/.test(texte) ? texte.slice(0, -1) + touche : texte + touche) : texte + touche;
      if (dernier === ",") return texte; // « 2, » attend un chiffre
      if ("+−×".includes(touche)) {
        if (touche !== "−" && (texte === "" || dernier === "(")) return texte; // pas de « + » ni de « × » au début
        return /[+−×]$/.test(texte) ? texte.slice(0, -1) + touche : texte + touche; // deux signes de suite : le second gagne
      }
      if (touche === "n" || touche === "(") return texte + touche;
      if (touche === ")") {
        const ouvertes = (texte.match(/\(/g) || []).length - (texte.match(/\)/g) || []).length;
        return ouvertes > 0 && !/[+−×(]$/.test(texte) ? texte + ")" : texte;
      }
      return texte;
    }
    if (touche === "−") return texte.startsWith("−") ? texte.slice(1) : "−" + texte; // le moins change le signe
    if (texte.length >= (type === "fraction" ? MAX_FRACTION : MAX)) return texte;
    // La partie en cours : le dénominateur si la barre de fraction est posée.
    const barre = type === "fraction" ? texte.indexOf("/") : -1;
    const partie = barre >= 0 ? texte.slice(barre + 1) : texte;
    if (touche === FRACTION) return type === "fraction" && barre < 0 && /\d$/.test(texte) ? texte + "/" : texte;
    if (touche === ",") return partie.includes(",") ? texte : (/\d$/.test(partie) ? texte : texte + "0") + ",";
    if (/^\d$/.test(touche)) return /^−?0$/.test(partie) ? texte.slice(0, -1) + touche : texte + touche;
    return texte;
  }

  // Ce qu'une case affiche : une fraction empilée (le curseur dans la partie en cours), une formule avec 𝑛, un nombre.
  function rendu(texte, type, active) {
    const curseur = active ? '<span class="curseur" aria-hidden="true"></span>' : "";
    if (type === "fraction" && texte.includes("/")) {
      const signe = texte.startsWith("−") ? "−" : "";
      const [num, den] = texte.replace(/^−/, "").split("/");
      return `${signe}<span class="frac case-frac"><span>${num}</span><span>${den}${curseur}${den ? "" : '<span class="vide-den"> </span>'}</span></span>`;
    }
    if (type === "expression") return ecrireFormule(texte, true) + curseur;
    return texte + curseur;
  }

  // ---------- Affichage (navigateur seulement) ----------
  // Le pavé d'une question : celui des formules, des fractions ou des nombres.
  function pave(types) {
    const sorte = types.includes("expression") ? "expression" : types.includes("fraction") ? "fraction" : "nombre";
    const NOMS = { "←": "Effacer le dernier signe", "−": sorte === "expression" ? "Moins" : "Moins (change le signe)", [FRACTION]: "Fraction : la suite s’écrit au dénominateur", n: "La lettre n", "×": "Multiplié par", "(": "Parenthèse ouvrante", ")": "Parenthèse fermante", "+": "Plus" };
    const ICONE_FRACTION = '<svg class="ico-frac" viewBox="0 0 20 26" aria-hidden="true"><rect x="5" y="1.5" width="10" height="8" rx="1.5"/><path d="M2 13h16"/><rect x="5" y="16.5" width="10" height="8" rx="1.5"/></svg>';
    const etiquette = (t) => (t === FRACTION ? ICONE_FRACTION : t === "n" ? '<i class="lettre">n</i>' : t);
    return `<div class="pave pave-${sorte}" role="group" aria-label="Pavé pour écrire la réponse">${PAVES[sorte].map((t) =>
      `<button type="button" data-touche="${t}"${NOMS[t] ? ` aria-label="${NOMS[t]}"` : ""}>${etiquette(t)}</button>`).join("")}</div>`;
  }

  // Branche les cases déjà écrites dans zone (boutons .saisie-case[data-case], dans l'ordre) sur le pavé de la zone
  // (.pave) et sur le clavier de l'ordinateur. types : le type de chaque case. Une case peut être éteinte (grille : la
  // case « Écriture décimale » ne s'allume qu'avec « oui ») : elle est grisée, vide, et le pavé ne l'écrit pas.
  // aChange(pret) est appelé à chaque changement : pret = toutes les cases allumées écrites jusqu'au bout.
  // Renvoie { valeurs(), fermer(), allumer(i, oui), choisir(i) }.
  function brancher(zone, types, aChange, actives) {
    const boutons = [...zone.querySelectorAll(".saisie-case")];
    const valeurs = boutons.map(() => "");
    const allumees = boutons.map((b, i) => (actives ? actives[i] !== false : true));
    let active = allumees.indexOf(true);
    const rafraichir = () => {
      boutons.forEach((b, i) => {
        b.innerHTML = rendu(valeurs[i], types[i], i === active);
        b.classList.toggle("vide", !valeurs[i]);
        b.classList.toggle("eteinte", !allumees[i]);
        b.disabled = !allumees[i];
        b.setAttribute("aria-pressed", String(i === active));
      });
      aChange(valeurs.every((v, i) => !allumees[i] || complete(v, types[i])));
    };
    const frappe = (t) => {
      if (active < 0 || !allumees[active]) return;
      valeurs[active] = taper(valeurs[active], t, types[active]);
      rafraichir();
    };
    boutons.forEach((b, i) => b.addEventListener("click", () => { if (allumees[i]) { active = i; rafraichir(); } }));
    zone.querySelectorAll("[data-touche]").forEach((b) => b.addEventListener("click", () => frappe(b.dataset.touche)));
    // Clavier de l'ordinateur : chiffres, virgule ou point, signe moins, retour arrière, « / » (fraction), n + * x ( )
    // (formule) ; Entrée passe à la case suivante (sauf sur « Valider » et « Je ne sais pas », qui gardent leur Entrée).
    const TOUCHES_CLAVIER = { ",": ",", ".": ",", "-": "−", Backspace: "←", "/": FRACTION, n: "n", N: "n", "+": "+", "*": "×", x: "×", X: "×", "(": "(", ")": ")" };
    const clavier = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = /^[0-9]$/.test(e.key) ? e.key : TOUCHES_CLAVIER[e.key];
      if (t && (/^[0-9,−←]$/.test(t) || (t === FRACTION && types[active] === "fraction") || ("n+×()".includes(t) && types[active] === "expression"))) {
        e.preventDefault();
        frappe(t);
        return;
      }
      const surBouton = document.activeElement && document.activeElement.closest(".actions") && !document.activeElement.disabled;
      const nbAllumees = allumees.filter(Boolean).length;
      if (e.key === "Enter" && nbAllumees > 1 && !surBouton) {
        e.preventDefault();
        const pas = e.shiftKey ? boutons.length - 1 : 1;
        do active = (active + pas) % boutons.length; while (!allumees[active]);
        rafraichir();
        // Si une case avait le focus (après un clic), il suit la case active : une seule case a l'air sélectionnée.
        if (document.activeElement && document.activeElement.classList.contains("saisie-case")) boutons[active].focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", clavier);
    rafraichir();
    return {
      valeurs: () => valeurs.slice(),
      fermer: () => document.removeEventListener("keydown", clavier),
      // Allume ou éteint une case (une case éteinte est vidée) ; une case allumée devient la case active.
      allumer(i, oui) {
        allumees[i] = oui;
        if (!oui) {
          valeurs[i] = "";
          if (active === i) active = allumees.indexOf(true);
        } else active = i;
        rafraichir();
      },
    };
  }

  // Monte les lignes et le pavé dans zone. aChange(pret) est appelé à chaque touche : pret = toutes les cases écrites.
  // Renvoie { valeurs(), fermer() }.
  function monter(zone, saisie, typo, aChange) {
    const liste = cases(saisie);
    const lignes = saisie.lignes.map((l, i) => {
      let k = 0;
      const debut = saisie.lignes.slice(0, i).reduce((s, x) => s + x.attendus.length, 0);
      const html = typo(l.modele).replace(new RegExp(MARQUE, "g"), () => `<button type="button" class="saisie-case${l.expression ? " case-formule" : ""}" data-case="${debut + k++}" aria-pressed="false" aria-label="Case ${debut + k}"></button>`);
      return `<p class="saisie-ligne">${html}</p>`;
    }).join("");
    const types = liste.map((c) => c.type);
    zone.className = "choix saisie";
    zone.innerHTML = `<div class="saisie-lignes${saisie.enLigne ? " en-ligne" : ""}">${lignes}</div>${pave(types)}`;
    return brancher(zone, types, aChange);
  }

  racine.ENSaisie = { TOUCHES, PAVES, FRACTION, MARQUE, lireNombre, lireExpression, memeFormule, ecrire, ecrireTape, ecrireAttendu, ecrireFraction, ecrireFormule, typeDe, caseJuste, piegeDe, cases, remplir, corriger, taper, complete, pave, brancher, monter };
})(typeof window !== "undefined" ? window : globalThis);
