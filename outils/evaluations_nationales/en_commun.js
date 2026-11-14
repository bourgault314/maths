/* maths&go — Évaluations nationales : outils communs (hasard reproductible, écriture des nombres, figures).
   Chargé par la page et par les tests node (aucune dépendance). */
(function (racine) {
  "use strict";

  // Hasard reproductible : une graine donne toujours le même sujet.
  function hasard(graine) {
    let a = graine >>> 0;
    const suivant = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const entier = (min, max) => min + Math.floor(suivant() * (max - min + 1));
    const parmi = (liste) => liste[Math.floor(suivant() * liste.length)];
    const melanger = (liste) => {
      const copie = liste.slice();
      for (let i = copie.length - 1; i > 0; i--) {
        const j = Math.floor(suivant() * (i + 1));
        [copie[i], copie[j]] = [copie[j], copie[i]];
      }
      return copie;
    };
    return { suivant, entier, parmi, melanger };
  }

  const ESP = " "; // espace insécable entre les classes de chiffres

  // Écrit un nombre donné en chaîne « 1234,5 » ou nombre : groupes de trois à gauche de la virgule.
  function nb(valeur) {
    const texte = typeof valeur === "number" ? nombreVersTexte(valeur) : String(valeur);
    const [ent, dec] = texte.split(",");
    const signe = ent.startsWith("-") ? "−" : "";
    const chiffres = ent.replace("-", "");
    const groupes = [];
    for (let i = chiffres.length; i > 0; i -= 3) groupes.unshift(chiffres.slice(Math.max(0, i - 3), i));
    return signe + groupes.join(ESP) + (dec !== undefined ? "," + dec : "");
  }

  // 3.2 → "3,2" sans erreur d'arrondi (au plus 6 décimales).
  function nombreVersTexte(x) {
    let t = (Math.round(x * 1e6) / 1e6).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    return t.replace(".", ",");
  }

  // Décale la virgule d'un nombre écrit en texte : « 754,82 », +1 → « 7548,2 » ; −2 → « 7,5482 ».
  function decaler(texte, rangs) {
    let [ent, dec = ""] = texte.split(",");
    let chiffres = ent + dec;
    let position = ent.length + rangs;
    if (position <= 0) {
      chiffres = "0".repeat(1 - position) + chiffres;
      position = 1;
    }
    if (position >= chiffres.length) chiffres += "0".repeat(position - chiffres.length);
    let e = chiffres.slice(0, position).replace(/^0+(?=\d)/, "");
    let d = chiffres.slice(position).replace(/0+$/, "");
    return d ? e + "," + d : e;
  }

  // Fraction empilée.
  const frac = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
  // Angle avec son chapeau ; angLong pour un angle nommé par trois lettres (chapeau sur les trois).
  const ang = (lettre) => `<span class="chapeau">${lettre}</span>`;
  const angLong = (lettres) => `<span class="chapeau long">${lettres}</span>`;
  // Lettre du calcul littéral, en italique (𝑥 rond).
  const lettre = (l) => `<i class="lettre">${l}</i>`;
  const MOINS = "−"; // signe moins typographique

  // Nombres en lettres (orthographe rectifiée de 1990 : traits d'union partout), de 0 à 999 999.
  const UNITES = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
    "onze", "douze", "treize", "quatorze", "quinze", "seize"];
  const DIZAINES = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante" };
  function moinsDeCent(n) {
    if (n <= 16) return UNITES[n];
    if (n < 20) return "dix-" + UNITES[n - 10];
    const d = Math.floor(n / 10), u = n % 10;
    if (d <= 6) return DIZAINES[d] + (u === 0 ? "" : u === 1 ? "-et-un" : "-" + UNITES[u]);
    if (d === 7) return "soixante-" + (u === 1 ? "et-onze" : moinsDeCent(10 + u));
    if (d === 8) return u === 0 ? "quatre-vingts" : "quatre-vingt-" + UNITES[u];
    return "quatre-vingt-" + moinsDeCent(10 + u);
  }
  function moinsDeMille(n) {
    const c = Math.floor(n / 100), r = n % 100;
    if (c === 0) return moinsDeCent(r);
    const cent = c === 1 ? "cent" : UNITES[c] + "-cent" + (r === 0 ? "s" : "");
    return r === 0 ? cent : cent + "-" + moinsDeCent(r);
  }
  function enLettres(n) {
    if (n < 1000) return moinsDeMille(n);
    const m = Math.floor(n / 1000), r = n % 1000;
    let tete = m === 1 ? "mille" : moinsDeMille(m).replace(/-cents$/, "-cent").replace(/^quatre-vingts$/, "quatre-vingt") + "-mille";
    return r === 0 ? tete : tete + "-" + moinsDeMille(r);
  }

  // ---------- Figures (SVG) ----------
  const COUL = { trait: "#143451", lettre: "#0d6e45", grille: "#c3ccd4", bleu: "#7b83f0", bleuBord: "#2626c9" };

  function svg(largeur, hauteur, contenu, etiquette, largeurMax) {
    return `<svg class="figure" viewBox="0 0 ${largeur} ${hauteur}" style="max-width:${largeurMax || Math.round(Math.max(largeur * 1.15, 340))}px" role="img" aria-label="${etiquette || "Figure"}" xmlns="http://www.w3.org/2000/svg">${contenu}</svg>`;
  }

  function quadrillage(x0, y0, colonnes, lignes, pas, couleur, tirets) {
    let s = "";
    for (let i = 0; i <= colonnes; i++)
      s += `<line x1="${x0 + i * pas}" y1="${y0}" x2="${x0 + i * pas}" y2="${y0 + lignes * pas}" stroke="${couleur}" stroke-width="1"${tirets ? ' stroke-dasharray="3 3"' : ""}/>`;
    for (let j = 0; j <= lignes; j++)
      s += `<line x1="${x0}" y1="${y0 + j * pas}" x2="${x0 + colonnes * pas}" y2="${y0 + j * pas}" stroke="${couleur}" stroke-width="1"${tirets ? ' stroke-dasharray="3 3"' : ""}/>`;
    return s;
  }


  // ---------- Banque de tâches ----------
  // Une question du sujet = une case de compétence. Elle a sa tâche principale (ses propres champs, sujet le plus récent)
  // et parfois d'autres tâches connues pour la même case (`variantes`), par exemple la question d'une autre année.
  function taches(q) {
    return [q].concat((q.variantes || []).map((v) => Object.assign({ domaine: q.domaine, num: q.num }, v)));
  }
  // La tâche d'un sujet officiel : celle dont les années contiennent l'année demandée (sans années : toutes).
  function tacheOfficielle(q, annee) {
    return taches(q).find((t) => !t.annees || t.annees.includes(annee)) || q;
  }
  // Un sujet généré garde la structure (même nombre de questions, même ordre) et tire, dans chaque case, une des tâches
  // connues. On ne tire au hasard que s'il y a le choix : les sujets sans variantes gardent exactement leur suite de hasard.
  function tirerTache(q, r) {
    const t = taches(q);
    return t.length > 1 ? r.parmi(t) : q;
  }
  // Construit les questions d'un passage. officiel : l'entrée de sujet.officiels jouée, ou null pour un sujet généré.
  function construire(sujet, r, officiel, numeros) {
    const qs = numeros ? sujet.questions.filter((q) => numeros.includes(q.num)) : sujet.questions;
    return qs.map((q) => {
      const t = officiel ? tacheOfficielle(q, officiel.annee) : tirerTache(q, r);
      const g = t.generer(r, Boolean(officiel));
      const melange = g.melange ?? t.melange ?? q.melange ?? true;
      return { q, t, g, choix: melange ? r.melanger(g.choix) : g.choix.slice() };
    });
  }

  // ---------- Typographie française ----------
  // Espace insécable avant « ? : ; ! » et après « ; une fraction empilée reste collée au signe qui la suit ;
  // un nombre et son unité ne se séparent jamais (1 cm, 18 km/h, 2 h 15 min, 50°…). Seul le texte est touché,
  // jamais l'intérieur d'une balise (figures SVG).
  const UNITES_MESURE = "km/h|km²|mm²|mm³|cm²|cm³|dm²|dm³|m²|m³|mm|cm|dm|dam|hm|km|m|mL|cL|dL|daL|hL|L|mg|cg|dg|dag|hg|kg|g|min|h|s|°C|°|%|€";
  const RE_UNITE = new RegExp(`(\\d) (${UNITES_MESURE})(?![\\p{L}\\d²³])`, "gu");
  function typo(html) {
    return String(html).split(/(<[^>]+>)/).map((morceau) => (morceau.startsWith("<") ? morceau
      : morceau.replace(/ ([?:;!»])/g, "\u00a0$1").replace(/« /g, "«\u00a0").replace(RE_UNITE, "$1\u00a0$2"))).join("")
      .replace(/(<span class="frac"><span>[^<]*<\/span><span>[^<]*<\/span><\/span>)(\u00a0[?:;!»])/g, '<span class="insecable">$1$2</span>');
  }

  // ---------- Calculatrice (tests « Résolution de problèmes » : la DEPP l'intègre à la question) ----------
  // Calcule « 3×1,2+2 », « (55−15)÷4 »… : + − × ÷, parenthèses (celles qui manquent à la fin sont fermées), priorités
  // respectées, comme une calculatrice de collège. Renvoie un nombre, ou null si le calcul n'a pas de sens (division par
  // zéro, signe en trop, nombre trop grand).
  function calculer(expression) {
    let s = String(expression).replace(/\s/g, "").replace(/,/g, ".").replace(/[×*]/g, "*").replace(/[÷/:]/g, "/").replace(/[−–]/g, "-");
    const ouvertes = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
    if (ouvertes > 0) s += ")".repeat(ouvertes);
    let i = 0;
    const ERREUR = {};
    const nombre = () => {
      const m = /^(\d+(\.\d*)?|\.\d+)/.exec(s.slice(i));
      if (!m) throw ERREUR;
      i += m[0].length;
      return parseFloat(m[0]);
    };
    const facteur = () => {
      if (s[i] === "-") { i++; return -facteur(); }
      if (s[i] === "(") {
        i++;
        const v = somme();
        if (s[i] !== ")") throw ERREUR;
        i++;
        return v;
      }
      return nombre();
    };
    const produit = () => {
      let v = facteur();
      while (s[i] === "*" || s[i] === "/") {
        const op = s[i++], w = facteur();
        if (op === "/" && w === 0) throw ERREUR;
        v = op === "*" ? v * w : v / w;
      }
      return v;
    };
    const somme = () => {
      let v = produit();
      while (s[i] === "+" || s[i] === "-") {
        const op = s[i++], w = produit();
        v = op === "+" ? v + w : v - w;
      }
      return v;
    };
    try {
      if (!s) return null;
      const v = somme();
      if (i !== s.length || !Number.isFinite(v) || Math.abs(v) >= 1e12) return null;
      return Number(v.toPrecision(12)) + 0; // 3 × 1,2 = 3,6 (et pas 3,5999999999999996) ; + 0 efface « −0 »
    } catch (e) {
      return null;
    }
  }
  // Écran de la calculatrice : virgule, au plus 10 chiffres significatifs, pas d'espace entre les chiffres.
  function ecrireCalcul(v) {
    if (v === null) return "Erreur";
    const t = Number(v.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 10, useGrouping: false });
    return t === "-0" ? "0" : t.replace(".", ",").replace("-", "−");
  }

  racine.EN = { calculer, ecrireCalcul, typo, taches, tacheOfficielle, tirerTache, construire, hasard, nb, nombreVersTexte, decaler, frac, ang, angLong, lettre, MOINS, enLettres, svg, quadrillage, COUL, ESP };
})(typeof window !== "undefined" ? window : globalThis);
