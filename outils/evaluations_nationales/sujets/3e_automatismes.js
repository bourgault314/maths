/* maths&go — Outil de positionnement de 3e, « Automatismes » (bibliothèque d'outils de positionnement, Eduscol).
   Source : https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants
   — licence Etalab 2.0. 32 questions (A à AF sur le papier), attendus de fin de 4e, repères ≤ 9 / 10 à 17 / ≥ 18.
   Chaque question existe en version officielle (les questions et les quatre réponses de l'outil) et en version « jumelle » :
   même tâche, mêmes pièges, autres nombres et autre « forme » au même niveau. Eduscol ne publie pas l'analyse des pièges
   de cet outil : les explications de la vue prof sont écrites par maths&go (sans mot genré). */
(function (racine) {
  "use strict";
  const { nb, frac, lettre, svg, MOINS, de } = racine.EN;

  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const AUTO = (notion, libelle) => ({ appli: "Automatismes", notion, libelle, url: `/automatismes/?notions=${notion}&nombre=8` });
  const sup = (b, e) => `${b}<sup>${e}</sup>`;
  const rel = (x) => (x < 0 ? MOINS + Math.abs(x) : String(x));
  const dec = (x) => nb(String(Math.round(x * 1e6) / 1e6).replace(".", ","));
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
  const LETTRES = ["x", "a", "n", "t", "y"];
  // Monôme « k·L^p » écrit comme sur une copie : 1·x → x, −1·x → −x, p = 2 → x².
  const mono = (k, L, p = 1) => (k === 0 ? "0" : `${k === 1 ? "" : k === -1 ? MOINS : rel(k)}${lettre(L)}${p === 2 ? "²" : ""}`);
  const somme = (termes) => termes.map((t, i) => (i === 0 ? t : t.startsWith(MOINS) ? ` ${MOINS} ${t.slice(1)}` : ` + ${t}`)).join("");
  const distincts = (choix) => new Set(choix.map((x) => x.html)).size === choix.length;

  // ---------- Figures ----------
  const TRAIT = "#1d2733", GRIS = "#8a96a3";
  const txt = (x, y, t, taille = 16, ancre = "middle", style = "") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${taille}" text-anchor="${ancre}" fill="${TRAIT}"${style}>${t}</text>`;
  const ligne = (A, B, l = 1.6) => `<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" stroke="${TRAIT}" stroke-width="${l}"/>`;
  const polygone = (pts, fill = "none") => `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="${fill}" stroke="${TRAIT}" stroke-width="1.8" stroke-linejoin="round"/>`;
  const vec = (A, B) => [B[0] - A[0], B[1] - A[1]], lg = (v) => Math.hypot(v[0], v[1]), unit = (v) => [v[0] / lg(v), v[1] / lg(v)];
  // Petit carré d'angle droit au sommet S, entre les directions vers P et Q.
  function angleDroit(S, P, Q, t = 11) {
    const u = unit(vec(S, P)), w = unit(vec(S, Q));
    const a = [S[0] + u[0] * t, S[1] + u[1] * t], b = [a[0] + w[0] * t, a[1] + w[1] * t], d = [S[0] + w[0] * t, S[1] + w[1] * t];
    return `<polyline points="${[a, b, d].map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${TRAIT}" stroke-width="1.3"/>`;
  }
  // Arc d'angle au sommet S (entre P et Q) et sa mesure écrite à l'intérieur.
  function arcAngle(S, P, Q, mesure, r = 22) {
    const u = unit(vec(S, P)), w = unit(vec(S, Q));
    const a = [S[0] + u[0] * r, S[1] + u[1] * r], b = [S[0] + w[0] * r, S[1] + w[1] * r];
    const sens = u[0] * w[1] - u[1] * w[0] > 0 ? 1 : 0;
    const m = unit([u[0] + w[0], u[1] + w[1]]);
    return `<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} A${r} ${r} 0 0 ${sens} ${b[0].toFixed(1)} ${b[1].toFixed(1)}" fill="none" stroke="${TRAIT}" stroke-width="1.3"/>`
      + (mesure ? txt(S[0] + m[0] * (r + 20), S[1] + m[1] * (r + 20) + 5, `${mesure}°`, 15) : "");
  }
  // Nom d'un sommet, écarté du centre de la figure.
  const nomSommet = (S, G, nom) => { const u = unit(vec(G, S)); return txt(S[0] + u[0] * 16, S[1] + u[1] * 16 + 5, nom, 16); };
  const centre = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  // Triangle placé dans un cadre (largeur l × hauteur h, marge 34) à partir de trois points quelconques, retourné si demandé.
  function cadrer(pts, l, h, miroir) {
    let P = pts.map((p) => [miroir ? -p[0] : p[0], p[1]]);
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    const k = Math.min((l - 68) / (Math.max(...xs) - Math.min(...xs)), (h - 68) / (Math.max(...ys) - Math.min(...ys)));
    return P.map((p) => [34 + (p[0] - Math.min(...xs)) * k, 34 + (p[1] - Math.min(...ys)) * k]);
  }
  // Marque de codage (deux traits) au milieu d'un segment.
  function code(A, B) {
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], u = unit(vec(A, B)), n = [-u[1] * 6, u[0] * 6];
    return [-3, 3].map((d) => ligne([M[0] + u[0] * d - n[0], M[1] + u[1] * d - n[1]], [M[0] + u[0] * d + n[0], M[1] + u[1] * d + n[1]], 1.2)).join("");
  }

  // ---------- Les 32 questions (A à AF sur le papier) ----------
  const Q = [];

  // A (1) — produit de deux fractions
  Q.push({
    num: 1, domaine: "NC", competence: "Multiplier deux fractions",
    entrainement: AUTO("NC12", "Produits, inverses et quotients de fractions"),
    generer(r, officiel) {
      let a = 3, b = 5, cc = 3, d = 2, ch;
      const forme = officiel ? "calcul" : r.parmi(["calcul", "phrase"]);
      do {
        if (!officiel) { b = r.parmi([3, 4, 5, 7]); d = r.parmi([2, 3, 5, 7].filter((x) => pgcd(x, b) === 1)); a = r.entier(1, 5); cc = r.entier(2, 5); }
        ch = [
          c(frac(a * cc, b * d), true),
          c(frac(a * d, b * cc), false, "Multiplie « en croix », comme pour une division."),
          c(frac(a, b * d), false, "Multiplie les dénominateurs mais garde un seul numérateur."),
          c(frac(a * d * cc * b, b * d), false, `Met d’abord au même dénominateur (${b * d}), comme pour une addition, puis multiplie les numérateurs.`),
        ];
      } while (!officiel && (!distincts(ch) || pgcd(a, b) !== 1 || pgcd(cc, d) !== 1 || a * cc === b * d));
      return { forme, enonce: forme === "calcul" ? `${frac(a, b)} × ${frac(cc, d)} = …` : `Le produit de ${frac(a, b)} par ${frac(cc, d)} est égal à…`, choix: ch };
    },
  });

  // B (2) — moyenne
  const PRENOMS = ["Sarah", "Yanis", "Inès", "Noah", "Maëlys", "Enzo", "Lina", "Ilan"];
  Q.push({
    num: 2, domaine: "OGD", competence: "Calculer une moyenne",
    entrainement: AUTO("DP03", "Moyennes"),
    generer(r, officiel) {
      let notes = [13, 12, 18, 17, 20], prenom = "Sarah";
      const forme = officiel ? "cinq-notes" : r.parmi(["cinq-notes", "quatre-notes"]);
      const n = forme === "cinq-notes" ? 5 : 4;
      const stats = () => { const s = notes.slice().sort((x, y) => x - y); return { moy: notes.reduce((x, y) => x + y, 0) / n, med: n === 5 ? s[2] : (s[1] + s[2]) / 2, et: s[n - 1] - s[0] }; };
      if (!officiel) {
        prenom = r.parmi(PRENOMS);
        let st;
        do { notes = Array.from({ length: n }, () => r.entier(6, 20)); st = stats(); }
        while (!Number.isInteger(st.moy) || !Number.isInteger(st.med) || new Set([st.moy, st.med, st.et, n]).size < 4);
      }
      const { moy, med, et } = stats();
      return {
        forme,
        enonce: `Voici les notes ${de(prenom)} en mathématiques ce trimestre : ${notes.join(" – ")}<br>Quelle est sa moyenne ?`,
        choix: [
          c(String(n), false, `Donne le nombre de notes (${n}).`),
          c(String(et), false, `Calcule l’écart entre la plus grande et la plus petite note (${Math.max(...notes)} − ${Math.min(...notes)}).`),
          c(String(moy), true),
          c(String(med), false, "Range les notes et prend celle du milieu : confond moyenne et médiane."),
        ].sort((x, y) => Number(x.html) - Number(y.html)),
      };
    },
  });

  // C (3) — notation puissance
  Q.push({
    num: 3, domaine: "NC", competence: "Connaître la notation puissance",
    entrainement: AUTO("NC15", "Puissances"), melange: false,
    generer(r, officiel) {
      let a = 4, n = 5;
      const forme = officiel ? "puissance-vers-produit" : r.parmi(["puissance-vers-produit", "produit-vers-puissance"]);
      if (!officiel) do { a = r.entier(2, 7); n = r.entier(3, 6); } while (a === n);
      if (forme === "produit-vers-puissance")
        return {
          forme,
          enonce: `${Array(n).fill(a).join(" × ")} s’écrit aussi…`,
          choix: [
            c(sup(a, n), true),
            c(sup(n, a), false, "Inverse le nombre et l’exposant."),
            c(`${n} × ${a}`, false, "Confond la puissance et le produit par le nombre de facteurs."),
            c(`${a}${n}`, false, "Colle le nombre et le nombre de facteurs."),
          ],
        };
      return {
        forme,
        enonce: `${sup(a, n)} est une autre écriture de :`,
        choix: [
          c(Array(n).fill(a).join(" + "), false, `Confond la puissance et le produit ${a} × ${n} (addition répétée).`),
          c(Array(n).fill(a).join(" × "), true),
          c(Array(a).fill(n).join(" + "), false, "Inverse le nombre et l’exposant, et additionne."),
          c(`${a}${n}`, false, "Lit l’exposant comme un chiffre : colle les deux nombres."),
        ],
      };
    },
  });

  // D (4) — diviseur
  const DIVISEURS = { 100: [20, 25, 50], 60: [12, 15, 20, 30], 72: [12, 18, 24, 36], 90: [15, 18, 30, 45], 48: [12, 16, 24], 80: [16, 20, 40], 84: [12, 14, 21, 28] };
  Q.push({
    num: 4, domaine: "NC", competence: "Reconnaître un diviseur d’un nombre",
    entrainement: AUTO("NC18", "Diviseurs, nombres premiers et division euclidienne"),
    generer(r, officiel) {
      const forme = officiel ? "diviseur" : r.parmi(["diviseur", "divisible"]);
      let N = 100, d = 25, faux = [35, 15, 45];
      if (!officiel) {
        N = Number(r.parmi(Object.keys(DIVISEURS))); d = r.parmi(DIVISEURS[N]);
        const proches = [d - 10, d + 10, d + 20, d - 5, d + 5, d + 15, d + 2, d - 2].filter((x) => x > 3 && N % x !== 0 && x < N);
        faux = r.melanger(proches).slice(0, 3);
      }
      const choix = [c(String(d), true), ...faux.map((x) => c(String(x), false, x % 5 === 0 && N % 10 === 0 ? `Choisit un nombre qui « finit comme » ${N} (multiple de 5), sans vérifier que ${N} : ${x} tombe juste.` : `Confond diviseur et nombre proche d’un diviseur : ${N} : ${x} ne tombe pas juste.`))];
      return {
        forme,
        enonce: forme === "diviseur" ? `Quel nombre est un diviseur de ${N} ?` : `${N} est divisible par…`,
        choix: officiel ? [c("35", false, "Choisit un multiple de 5, comme 25, sans vérifier que 100 : 35 tombe juste."), c("15", false, "Choisit un multiple de 5 sans vérifier que 100 : 15 tombe juste."), c("25", true), c("45", false, "Choisit un multiple de 5 sans vérifier que 100 : 45 tombe juste.")] : choix,
      };
    },
  });

  // E (5) — appliquer un pourcentage
  const POURCENTS = [[40, 200], [20, 300], [25, 400], [30, 600], [60, 300], [75, 400], [40, 500], [20, 800], [10, 900], [50, 600]];
  Q.push({
    num: 5, domaine: "OGD", competence: "Appliquer un pourcentage",
    entrainement: AUTO("PF03", "Pourcentage d’une quantité"),
    generer(r, officiel) {
      let p = 40, N = 200, ch;
      const forme = officiel ? "groupe" : r.parmi(["groupe", "college"]);
      do {
        if (!officiel) [p, N] = r.parmi(POURCENTS);
        const u = forme === "groupe" ? "personnes" : "élèves";
        ch = [
          c(`${p} ${u}`, false, `Recopie le pourcentage : ${p} % devient ${p} ${u}.`),
          c(`${N / p} ${u}`, false, `Divise ${N} par ${p}.`),
          c(`${N / 10} ${u}`, false, `Calcule ${N} : 10 au lieu de ${p} % de ${N}.`),
          c(`${(N * p) / 100} ${u}`, true),
        ];
      } while (!officiel && (!distincts(ch) || !Number.isInteger(N / p)));
      return {
        forme,
        enonce: forme === "groupe" ? `Dans un groupe de ${N} personnes, ${p} % des personnes pratiquent une activité sportive.<br>Combien de personnes pratiquent une activité sportive dans ce groupe ?`
          : `Dans un collège de ${N} élèves, ${p} % des élèves mangent à la cantine.<br>Combien d’élèves mangent à la cantine ?`,
        choix: ch,
      };
    },
  });

  // F (6) — somme de relatifs
  Q.push({
    num: 6, domaine: "NC", competence: "Additionner des nombres relatifs",
    entrainement: AUTO("NC05", "Opposés, sommes et différences de relatifs"),
    generer(r, officiel) {
      let a = 7, b = 5;
      const forme = officiel ? "moins-a-plus-b" : r.parmi(["moins-a-plus-b", "b-plus-moins-a"]);
      if (!officiel) do { a = r.entier(3, 15); b = r.entier(2, 14); } while (a === b || a === 2 * b || b === 2 * a);
      const R = b - a;
      return {
        forme,
        enonce: forme === "moins-a-plus-b" ? `${MOINS}${a} + ${b} = …` : `${b} + (${MOINS}${a}) = …`,
        choix: [
          c(rel(-R), false, "Se trompe de signe."),
          c(rel(-(a + b)), false, "Ajoute les distances à zéro et garde le signe moins."),
          c(String(a + b), false, "Ajoute les distances à zéro sans tenir compte des signes."),
          c(rel(R), true),
        ],
      };
    },
  });

  // G (7) — périmètre d'un rectangle (figure codée)
  function rectangleCode(L, l, carre) {
    const W = 260, H = carre ? 200 : 170, x0 = 40, y0 = 34, w = carre ? 130 : 180, h = carre ? 130 : Math.max(70, Math.min(110, (180 * l) / L));
    const A = [x0, y0], B = [x0 + w, y0], C = [x0 + w, y0 + h], D = [x0, y0 + h];
    let s = polygone([A, B, C, D]) + [[A, B, D], [B, C, A], [C, D, B], [D, A, C]].map(([S, P, Q2]) => angleDroit(S, P, Q2, 10)).join("");
    s += code(A, B) + code(D, C) + (carre ? code(B, C) + code(A, D) : "");
    s += txt(x0 + w / 2, y0 - 10, L, 18) + (carre ? "" : txt(x0 + w + 16, y0 + h / 2 + 6, l, 18, "start"));
    return svg(W, H, s, carre ? `Carré codé de côté ${L} (l’unité est le cm)` : `Rectangle codé de longueur ${L} et de largeur ${l} (l’unité est le cm)`, 300);
  }
  Q.push({
    num: 7, domaine: "GM", competence: "Calculer le périmètre d’un rectangle",
    entrainement: AUTO("EG08", "Périmètres"), melange: false, disposition: "grille",
    generer(r, officiel) {
      let L = 4, l = 3, ch;
      const forme = officiel ? "rectangle" : r.parmi(["rectangle", "rectangle", "carre"]);
      do {
        if (!officiel) { L = r.entier(3, 9); l = forme === "carre" ? L : r.entier(2, L - 1); }
        const P = 2 * (L + l), A = L * l;
        ch = [
          c(`${L + l} cm`, false, forme === "carre" ? `Ne compte que deux côtés (${L} + ${l}).` : `Ajoute seulement la longueur et la largeur (${L} + ${l}) : un demi-périmètre.`),
          c(`${A} cm`, false, `Calcule ${L} × ${l} : confond périmètre et aire.`),
          c(`${P} cm`, true),
          c(`${2 * A} cm`, false, `Calcule ${L} × ${l} × 2 : mélange les formules de l’aire et du périmètre.`),
        ];
      } while (!officiel && !distincts(ch));
      return {
        forme,
        enonce: "On considère la figure ci-contre (l’unité est le cm) :<br>Combien vaut son périmètre ?",
        figure: rectangleCode(L, l, forme === "carre"),
        choix: ch.sort((x, y) => parseInt(x.html, 10) - parseInt(y.html, 10)),
      };
    },
  });

  // H (8) — programme de calcul → expression
  Q.push({
    num: 8, domaine: "NC", competence: "Traduire un programme de calcul par une expression littérale",
    entrainement: AUTO("NC19", "Traduire en calcul littéral"), melange: false,
    generer(r, officiel) {
      let k = 3, m = 2, L = "x";
      const forme = officiel ? "soustraire-puis-multiplier" : r.parmi(["soustraire-puis-multiplier", "ajouter-puis-multiplier"]);
      if (!officiel) { do { k = r.entier(2, 9); m = r.entier(2, 9); } while (k === m); L = r.parmi(["x", "x", "n", "t"]); }
      const X = lettre(L);
      const choix = forme === "soustraire-puis-multiplier" ? [
        c(`${X} × ${m} ${MOINS} ${k}`, false, "Fait les deux étapes dans l’ordre inverse."),
        c(`(${k} ${MOINS} ${X}) × ${m}`, false, `Écrit la soustraction à l’envers : « soustraire ${k} » devient ${k} ${MOINS} ${L}.`),
        c(`${X} ${MOINS} ${k} × ${m}`, false, "Suit les étapes dans l’ordre mais oublie les parenthèses."),
        c(`(${X} ${MOINS} ${k}) × ${m}`, true),
      ] : [
        c(`${X} × ${m} + ${k}`, false, "Fait les deux étapes dans l’ordre inverse."),
        c(`(${X} + ${m}) × ${k}`, false, "Échange les deux nombres du programme."),
        c(`${X} + ${k} × ${m}`, false, "Suit les étapes dans l’ordre mais oublie les parenthèses."),
        c(`(${X} + ${k}) × ${m}`, true),
      ];
      return {
        forme,
        enonce: `Voici un programme de calcul :<br>• Choisir un nombre<br>• ${forme === "soustraire-puis-multiplier" ? "Lui soustraire" : "Lui ajouter"} ${k}<br>• Multiplier le résultat par ${m}<br>Si l’on désigne par ${X} le nombre choisi, quelle est l’expression qui correspond à ce programme de calcul ?`,
        choix: officiel ? choix : r.melanger(choix),
      };
    },
  });

  // I (9) — angle d'un triangle rectangle (figure)
  const NOMS3 = [["E", "F", "G"], ["A", "B", "C"], ["R", "S", "T"], ["K", "L", "M"], ["P", "Q", "R"]];
  function triangleRectangle(noms, g, miroir) {
    // Angle droit au 2e sommet (F), angle connu au 3e (G) ; on cherche l'angle au 1er (E).
    const t = (g * Math.PI) / 180, F = [0, 0], G = [1, 0], E = [0, -Math.tan(t)];
    const [Ep, Fp, Gp] = cadrer([E, F, G], 300, 170, miroir), Ctr = centre([Ep, Fp, Gp]);
    const s = polygone([Ep, Fp, Gp]) + angleDroit(Fp, Ep, Gp, 11) + arcAngle(Gp, Fp, Ep, g, 26)
      + nomSommet(Ep, Ctr, noms[0]) + nomSommet(Fp, Ctr, noms[1]) + nomSommet(Gp, Ctr, noms[2]);
    return svg(300, 170, s, `Triangle ${noms.join("")} rectangle en ${noms[1]}, angle de sommet ${noms[2]} : ${g}°`, 320);
  }
  Q.push({
    num: 9, domaine: "EG", competence: "Calculer un angle aigu d’un triangle rectangle",
    entrainement: AUTO("EG07", "Angles d’un triangle"),
    generer(r, officiel) {
      let g = 35, noms = NOMS3[0], miroir = false;
      const forme = officiel ? "droite" : r.parmi(["droite", "retourne"]);
      if (!officiel) { do g = 5 * r.entier(5, 13); while (g === 45); noms = r.parmi(NOMS3); miroir = forme === "retourne"; }
      return {
        forme,
        enonce: `Combien mesure l’angle de sommet ${noms[0]} ?`,
        figure: triangleRectangle(noms, g, miroir),
        choix: [
          c(`${90 - g}°`, true),
          c(`${180 - g}°`, false, `Calcule 180° − ${g}° en oubliant l’angle droit.`),
          c("90°", false, "Donne la mesure de l’angle droit."),
          c(`${90 + g}°`, false, `Ajoute 90° et ${g}° au lieu de compléter à 180°.`),
        ],
      };
    },
  });

  // J (10) — valeur d'une expression
  Q.push({
    num: 10, domaine: "NC", competence: "Calculer la valeur d’une expression littérale",
    entrainement: AUTO("NC21", "Substituer et tester une égalité"),
    generer(r, officiel) {
      let a = 2, b = 1, x = 7, ch;
      const forme = officiel ? "ax-plus-b" : r.parmi(["ax-plus-b", "b-plus-ax"]);
      const L = "x";
      do {
        if (!officiel) { a = r.entier(2, 5); b = r.entier(1, 9); x = r.entier(3, 9); }
        ch = forme === "ax-plus-b" ? [
          c(String(a + x + b), false, `Remplace ${L} par ${x} mais additionne : ${a} + ${x} + ${b}.`),
          c(String(a * x + b), true),
          c(String(a * (x + b)), false, `Calcule ${a} × (${x} + ${b}) : n’applique pas la priorité de la multiplication.`),
          c(String(10 * a + x), false, `Colle les chiffres : ${a}${L} devient ${a}${x}, et s’arrête là.`),
        ] : [
          c(String(a + x + b), false, `Remplace ${L} par ${x} mais additionne : ${b} + ${a} + ${x}.`),
          c(String(a * x + b), true),
          c(String((a + b) * x), false, `Calcule de gauche à droite : (${b} + ${a}) × ${x}.`),
          c(String(10 * a + x), false, `Colle les chiffres : ${a}${L} devient ${a}${x}, et s’arrête là.`),
        ];
      } while (!officiel && !distincts(ch));
      return {
        forme,
        enonce: `On donne l’expression A = ${forme === "ax-plus-b" ? `${a}${lettre(L)} + ${b}` : `${b} + ${a}${lettre(L)}`}.<br>Pour ${lettre(L)} = ${x}, la valeur de A est…`,
        choix: ch.sort((u, v) => Number(u.html) - Number(v.html)),
      };
    },
  });

  // K (11) — différence de relatifs
  Q.push({
    num: 11, domaine: "NC", competence: "Soustraire des nombres relatifs",
    entrainement: AUTO("NC05", "Opposés, sommes et différences de relatifs"),
    generer(r, officiel) {
      let a = 2, b = 3;
      const forme = officiel ? "moins-a-moins-b" : r.parmi(["moins-a-moins-b", "moins-a-plus-moins-b"]);
      if (!officiel) do { a = r.entier(2, 12); b = r.entier(2, 12); } while (a === b);
      const d = Math.abs(a - b);
      return {
        forme,
        enonce: forme === "moins-a-moins-b" ? `${MOINS}${a} ${MOINS} ${b} = …` : `${MOINS}${a} + (${MOINS}${b}) = …`,
        choix: [
          c(rel(-(a + b)), true),
          c(rel(-d), false, "Fait la différence des distances à zéro et garde le signe moins."),
          c(String(d), false, "Fait la différence des distances à zéro sans tenir compte des signes."),
          c(String(a + b), false, "Ajoute les distances à zéro mais oublie le signe moins."),
        ],
      };
    },
  });

  // L (12) — puissance de 10
  const zeros = (n) => nb("1" + "0".repeat(n));
  Q.push({
    num: 12, domaine: "NC", competence: "Connaître les puissances de 10 (exposant positif)",
    entrainement: AUTO("NC15", "Puissances"), melange: false,
    generer(r, officiel) {
      const n = officiel ? 6 : r.entier(3, 8);
      const forme = officiel ? "puissance-vers-nombre" : r.parmi(["puissance-vers-nombre", "nombre-vers-puissance"]);
      if (forme === "nombre-vers-puissance")
        return {
          forme,
          enonce: `${zeros(n)} = …`,
          choix: [
            c(sup(10, n - 1), false, "Se trompe d’un rang."),
            c(sup(10, n), true),
            c(sup(10, n + 1), false, "Compte tous les chiffres du nombre, y compris le 1."),
            c(sup(n, 10), false, "Inverse le nombre et l’exposant."),
          ],
        };
      return {
        forme,
        enonce: `${sup(10, n)} = …`,
        choix: [
          c(String(10 * n), false, `Calcule 10 × ${n}.`),
          c(zeros(n - 1), false, "Écrit un zéro de moins."),
          c(zeros(n), true),
          c(nb(String(n) + "0".repeat(n)), false, `Écrit ${n} suivi de ${n} zéros.`),
        ],
      };
    },
  });

  // M (13) — tester une égalité
  Q.push({
    num: 13, domaine: "NC", competence: "Tester une égalité pour une valeur donnée",
    entrainement: AUTO("NC21", "Substituer et tester une égalité"),
    generer(r, officiel) {
      let v = 3, k = 7, L = "r";
      const forme = officiel ? "valeur-positive" : r.parmi(["valeur-positive", "valeur-negative"]);
      if (!officiel) { v = r.entier(3, 9); do k = r.entier(3, 9); while (k === v); L = r.parmi(["r", "x", "a", "t"]); }
      const X = lettre(L);
      if (forme === "valeur-negative")
        return {
          forme,
          enonce: `Pour ${X} = ${MOINS}${v}, quelle égalité est vraie ?`,
          choix: [
            c(`${X} × ${X} = ${MOINS}${v * v}`, false, `Pense que (${MOINS}${v}) × (${MOINS}${v}) est négatif.`),
            c(`${X} + ${v} = 0`, true),
            c(`${k} × ${X} = ${k * v}`, false, "Oublie le signe moins de la valeur."),
            c(`${X} ${MOINS} ${v} = 0`, false, "Oublie le signe moins de la valeur."),
          ],
        };
      return {
        forme,
        enonce: `Pour ${X} = ${v}, quelle égalité est vraie ?`,
        choix: [
          c(`${X} × ${X} = ${2 * v}`, false, `Confond ${L} × ${L} et 2 × ${L}.`),
          c(`${X} ${MOINS} ${v} = 0`, true),
          c(`${k} × ${X} = ${(k - 1) * v}`, false, `Se trompe dans le calcul de ${k} × ${v}.`),
          c(`${X} + ${v} = 0`, false, "Pense qu’un nombre ajouté à lui-même donne 0 : confond avec son opposé."),
        ],
      };
    },
  });

  // N (14) — égalité de Pythagore (figure)
  function triangleDroit(noms, sommetDroit, angle, miroir) {
    // Triangle rectangle au sommet noms[sommetDroit] ; les deux autres sommets se déduisent.
    const t = (angle * Math.PI) / 180, D = [0, 0], P = [Math.cos(t) * 1.3, -Math.sin(t) * 1.3], Q2 = [Math.sin(t) * 0.9, Math.cos(t) * 0.9];
    const pts = cadrer([P, D, Q2], 220, 190, miroir), Ctr = centre(pts);
    const autres = [0, 1, 2].filter((i) => i !== sommetDroit);
    const nomDe = [noms[autres[0]], noms[sommetDroit], noms[autres[1]]];
    const s = polygone(pts, "#c9ced4") + angleDroit(pts[1], pts[0], pts[2], 12) + pts.map((p, i) => nomSommet(p, Ctr, nomDe[i])).join("");
    return svg(220, 190, s, `Triangle ${noms.join("")} rectangle en ${noms[sommetDroit]}`, 240);
  }
  Q.push({
    num: 14, domaine: "EG", competence: "Connaître l’égalité de Pythagore",
    entrainement: AUTO("EG10", "Pythagore"),
    generer(r, officiel) {
      let noms = ["A", "B", "C"], i = 1, angle = 65, miroir = false;
      const forme = officiel ? "droit-au-milieu" : r.parmi(["droit-au-milieu", "droit-au-bout"]);
      if (!officiel) { noms = r.parmi([["A", "B", "C"], ["E", "F", "G"], ["R", "S", "T"], ["M", "N", "P"], ["I", "J", "K"]]); i = forme === "droit-au-milieu" ? 1 : r.parmi([0, 2]); angle = r.entier(20, 70); miroir = r.suivant() < 0.5; }
      const S = noms[i], [P, Q2] = noms.filter((x) => x !== S), hyp = P + Q2, c1 = P + S, c2 = S + Q2;
      const carre = (s) => `${s}<sup>2</sup>`;
      return {
        forme,
        enonce: "Parmi les 4 affirmations suivantes, une seule est correcte, laquelle ?",
        figure: triangleDroit(noms, i, angle, miroir),
        choix: [
          c(`${hyp} = ${c1} + ${c2}`, false, "Additionne les longueurs sans les élever au carré."),
          c(`${carre(hyp)} = ${carre(c1)} + ${carre(c2)}`, true),
          c(`${carre(c1)} = ${carre(hyp)} + ${carre(c2)}`, false, `Ne repère pas l’hypoténuse : le côté opposé à l’angle droit est [${hyp}].`),
          c(`${carre(c2)} = ${carre(c1.split("").reverse().join(""))} + ${carre(hyp)}`, false, `Ne repère pas l’hypoténuse : le côté opposé à l’angle droit est [${hyp}].`),
        ],
      };
    },
  });

  // O (15) — aire d'un rectangle
  Q.push({
    num: 15, domaine: "GM", competence: "Calculer l’aire d’un rectangle",
    entrainement: AUTO("EG09", "Aires"), melange: false,
    generer(r, officiel) {
      let L = 30, l = 20, u = "cm", ch;
      const forme = officiel ? "rectangle" : r.parmi(["rectangle", "carre"]);
      do {
        if (!officiel) { u = r.parmi(["cm", "cm", "m"]); L = r.parmi([4, 5, 6, 7, 8, 9, 12, 15, 20, 30, 40]); l = forme === "carre" ? L : r.parmi([3, 4, 5, 6, 10, 20].filter((x) => x < L)); }
        const A = L * l, P = 2 * (L + l);
        ch = [
          c(`${nb(String(P))} ${u}²`, false, `Calcule le périmètre (${P} ${u}) au lieu de l’aire.`),
          c(`${nb(String(A / 2))} ${u}²`, false, "Divise par 2, comme pour l’aire d’un triangle."),
          c(`${nb(String(A))} ${u}²`, true),
          c(`${nb(String(2 * A))} ${u}²`, false, `Calcule 2 × ${L} × ${l}.`),
        ];
      } while (!officiel && (!distincts(ch) || !Number.isInteger(L * l / 2)));
      return {
        forme,
        enonce: forme === "carre" ? `Quelle est l’aire d’un carré de côté ${L} ${u} ?` : `Quelle est l’aire d’un rectangle de longueur ${L} ${u} et de largeur ${l} ${u} ?`,
        choix: ch.sort((x, y) => Number(x.html.split(" ")[0].replace(/\s/g, "").replace(",", ".")) - Number(y.html.split(" ")[0].replace(/\s/g, "").replace(",", "."))),
      };
    },
  });

  // P (16) — réduire une expression du second degré
  Q.push({
    num: 16, domaine: "NC", competence: "Réduire une expression littérale",
    entrainement: AUTO("NC20", "Réduire et simplifier une expression"),
    generer(r, officiel) {
      let a = 2, b = 3, k = 4, d = 5, L = "n", ordre = [0, 1, 2, 3], ch;
      const forme = officiel ? "dans-l-ordre" : r.parmi(["dans-l-ordre", "melange"]);
      do {
        if (!officiel) { a = r.entier(2, 6); b = r.entier(2, 6); k = r.entier(2, 9); d = r.entier(1, 9); L = r.parmi(["n", "x", "a"]); ordre = forme === "melange" ? r.melanger([0, 1, 2, 3]) : [0, 1, 2, 3]; }
        const s = a + b + k + d;
        ch = [
          c(somme([mono(a + b, L, 2), mono(k, L), String(d)]), true),
          c(mono(2 * s, L), false, "Additionne tous les nombres sans tenir compte des lettres et des puissances."),
          c(mono(s, L, 2), false, "Additionne tous les nombres et met tout en « carré »."),
          c(somme([mono(a + b + k, L, 2), String(d)]), false, `Regroupe les termes en ${L}² et en ${L} comme des termes semblables.`),
        ];
      } while (!officiel && (!distincts(ch) || (forme === "melange" && ordre.join() === "0,1,2,3")));
      const termes = [mono(a, L, 2), mono(b, L, 2), mono(k, L), String(d)];
      return { forme, enonce: `Qu’obtient-on si l’on réduit l’expression ${somme(ordre.map((i) => termes[i]))} ?`, choix: ch };
    },
  });

  // Q (17) — quatrième proportionnelle dans un tableau
  function tableau(cases) {
    // cases : [haut-gauche, haut-droite, bas-gauche, bas-droite], "" pour la case vide
    const td = (v) => `<td>${v}</td>`;
    return `<table class="tableau-prop" aria-label="Tableau de proportionnalité à deux lignes et deux colonnes, une case vide"><tr>${td(cases[0])}${td(cases[1])}</tr><tr>${td(cases[2])}${td(cases[3])}</tr></table>`;
  }
  Q.push({
    num: 17, domaine: "OGD", competence: "Compléter un tableau de proportionnalité",
    entrainement: AUTO("PF02", "Calculer en proportionnalité"), melange: false,
    generer(r, officiel) {
      // Une colonne connue (p au-dessus de q), l'autre colonne a s en bas : la case vide vaut s × p / q.
      let p = 12, q = 6, s = 10, place = 1, ch;
      const forme = officiel ? "vide-en-haut" : r.parmi(["vide-en-haut", "vide-en-bas"]);
      do {
        if (!officiel) { const k = r.parmi([2, 3, 4, 5]); q = r.entier(2, 9); p = k * q; s = r.entier(2, 12); place = r.parmi([0, 1]); }
        const v = (s * p) / q, add = s + (p - q);
        ch = [c(dec((s * q) / p), false, `Divise par ${p / q} au lieu de multiplier.`), c(dec((p * q) / s), false, `Fait un « produit en croix » avec les mauvaises cases (${p} × ${q} : ${s}).`), c(String(add), false, `Ajoute ${p - q} (l’écart entre ${p} et ${q}) au lieu de multiplier.`), c(String(v), true)];
      } while (!officiel && (!distincts(ch) || s === q || s === p || !Number.isInteger((10 * s * q) / p) || !Number.isInteger((10 * p * q) / s)));
      // vide-en-haut : la colonne connue garde p en haut, q en bas ; vide-en-bas : on échange les deux lignes.
      let cases = place === 0 ? ["", p, s, q] : [p, "", q, s];
      if (forme === "vide-en-bas") cases = [cases[2], cases[3], cases[0], cases[1]];
      return {
        forme: `${forme}-${place === 0 ? "gauche" : "droite"}`,
        enonce: "On considère le tableau ci-dessous. Quel nombre doit-on placer dans la case vide pour que ce tableau soit un tableau de proportionnalité ?",
        figure: tableau(cases),
        choix: ch.sort((x, y) => Number(x.html.replace(",", ".")) - Number(y.html.replace(",", "."))),
      };
    },
  });

  // R (18) — réduire an − bn
  Q.push({
    num: 18, domaine: "NC", competence: "Réduire une somme algébrique de termes semblables",
    entrainement: AUTO("NC20", "Réduire et simplifier une expression"),
    generer(r, officiel) {
      let a = 2, b = 3, L = "n";
      const forme = officiel ? "resultat-negatif" : r.parmi(["resultat-negatif", "resultat-positif"]);
      if (!officiel) { do { a = r.entier(2, 9); b = r.entier(2, 9); } while (a === b || (forme === "resultat-negatif") !== (a < b)); L = r.parmi(["n", "x", "a", "y"]); }
      const d = a - b;
      const choix = officiel ? [
        c(mono(1, L, 2), false, `Multiplie ${L} par ${L}.`),
        c(mono(-1, L), true),
        c("0", false, "Pense que les termes s’annulent."),
        c(rel(-1), false, "Calcule 2 − 3 et oublie la lettre."),
      ] : [
        c(mono(d, L, 2), false, `Calcule ${a} − ${b} et multiplie ${L} par ${L}.`),
        c(mono(d, L), true),
        c(mono(-d, L), false, "Se trompe de signe."),
        c(rel(d), false, `Calcule ${a} − ${b} et oublie la lettre.`),
      ];
      return { forme, enonce: `Qu’obtient-on si l’on réduit l’expression ${mono(a, L)} ${MOINS} ${mono(b, L)} ?`, choix };
    },
  });

  // S (19) — puissance de 10 d'exposant négatif
  Q.push({
    num: 19, domaine: "NC", competence: "Connaître les puissances de 10 (exposant négatif)",
    entrainement: AUTO("NC15", "Puissances"), melange: false,
    generer(r, officiel) {
      const n = officiel ? 2 : r.entier(2, 6);
      const forme = officiel ? "puissance-vers-nombre" : r.parmi(["puissance-vers-nombre", "nombre-vers-puissance"]);
      const petit = (m) => "0," + "0".repeat(m - 1) + "1";
      if (forme === "nombre-vers-puissance")
        return {
          forme,
          enonce: `${petit(n)} = …`,
          choix: [
            c(sup(10, MOINS + n), true),
            c(sup(10, n), false, "Oublie le signe moins de l’exposant."),
            c(`${MOINS}${sup(10, n)}`, false, "Pense qu’un petit nombre s’écrit avec un nombre négatif."),
            c(sup(10, MOINS + (n - 1)), false, "Compte seulement les zéros après la virgule."),
          ],
        };
      return {
        forme,
        enonce: `${sup(10, MOINS + n)} = …`,
        choix: [
          c(`${MOINS}${sup(10, n)}`, false, "Pense qu’un exposant négatif donne un nombre négatif."),
          c(`${MOINS}${10 * n}`, false, `Calcule 10 × (${MOINS}${n}).`),
          c(petit(n), true),
          c("0," + "0".repeat(n - 1) + n, false, `Écrit ${n} à la place du 1.`),
        ],
      };
    },
  });

  // T (20) — image par une symétrie centrale (quadrillage)
  // Une figure est un polygone sur le quadrillage, coordonnées en carreaux, relatives à son coin haut-gauche (largeur 3, hauteur 2).
  const MOTIFS = [
    [[0, 0], [3, 0], [3, 1], [2, 1], [0, 2]], // le motif du sujet : cinq sommets, le petit segment horizontal puis l'oblique
    [[0, 0], [2, 0], [3, 2], [0, 2]],
    [[0, 0], [3, 0], [3, 2], [2, 2], [2, 1], [0, 1]],
    [[0, 0.5], [1, 0], [3, 0], [3, 2], [0, 2]],
  ];
  // Où écrire « Figure n » : au milieu de la bande d'un carreau de haut où la figure est la plus large (sur le sujet, la
  // partie rectangulaire), pas au milieu de la boîte englobante, qui tombe sur un trait.
  function placeEtiquette(pts) {
    const ys = pts.map((q) => q[1]), haut = Math.min(...ys), bas = Math.max(...ys);
    let meilleur = null;
    for (let y = haut + 0.5; y < bas; y += 1) {
      const xs = [];
      pts.forEach((A, k) => {
        const B = pts[(k + 1) % pts.length];
        if ((A[1] - y) * (B[1] - y) < 0) xs.push(A[0] + ((y - A[1]) * (B[0] - A[0])) / (B[1] - A[1]));
      });
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        if (!meilleur || xs[k + 1] - xs[k] > meilleur.l) meilleur = { x: (xs[k] + xs[k + 1]) / 2, y, l: xs[k + 1] - xs[k] };
    }
    return meilleur;
  }
  function symetrieCentrale(motif, places, miroirF) {
    // Comme le sujet (BOP3 « Automatismes », page 6, item T) : quadrillage de 12 × 10 carreaux, O en (6 ; 4), F en haut
    // à gauche (miroirF : retournée), les autres figures dans les trois autres coins ; places[k] = numéro (1 à 4) affiché
    // sur la figure k : 0 = symétrique centrale (la bonne), 1 = symétrique par rapport à l'axe vertical, 2 = par rapport à
    // l'axe horizontal, 3 = F simplement glissée, juste sous la symétrique centrale (elles partagent leur bord).
    const p = 26, x0 = 12, y0 = 12, O = [6, 4], C = 12, L = 10;
    let s = "";
    for (let i = 0; i <= C; i++) s += `<line x1="${x0 + i * p}" y1="${y0}" x2="${x0 + i * p}" y2="${y0 + L * p}" stroke="${GRIS}" stroke-width="0.8" stroke-dasharray="3 3"/>`;
    for (let j = 0; j <= L; j++) s += `<line x1="${x0}" y1="${y0 + j * p}" x2="${x0 + C * p}" y2="${y0 + j * p}" stroke="${GRIS}" stroke-width="0.8" stroke-dasharray="3 3"/>`;
    const base = motif.map(([x, y]) => [miroirF ? 3 - x : x, y]);
    const F = base.map(([x, y]) => [1 + x, 1 + y]);
    const images = [
      F.map(([x, y]) => [2 * O[0] - x, 2 * O[1] - y]), // symétrie centrale
      F.map(([x, y]) => [2 * O[0] - x, y]), // axe vertical
      F.map(([x, y]) => [x, 2 * O[1] - y]), // axe horizontal
      F.map(([x, y]) => [x + 7, y + 6]), // glissée, collée sous la symétrique centrale, comme sur le sujet
    ];
    const P = (pts) => pts.map(([x, y]) => [x0 + x * p, y0 + y * p]);
    const etiquette = (pts, t, gras) => { const e = placeEtiquette(pts); return txt(x0 + e.x * p, y0 + e.y * p + 4, t, 11, "middle", gras ? ' font-weight="700"' : ""); };
    // F : trait plus épais et nom en gras, comme sur le sujet.
    s += polygone(P(F), "#fff").replace('stroke-width="1.8"', 'stroke-width="2.6"') + etiquette(F, "Figure F", true);
    images.forEach((pts, k) => { s += polygone(P(pts), "#fff") + etiquette(pts, `Figure ${places[k]}`, false); });
    const Ox = x0 + O[0] * p, Oy = y0 + O[1] * p;
    s += ligne([Ox - 6, Oy - 6], [Ox + 6, Oy + 6], 2) + ligne([Ox - 6, Oy + 6], [Ox + 6, Oy - 6], 2) + txt(Ox + 12, Oy - 8, "O", 15, "start");
    return svg(C * p + 24, L * p + 24, s, "Quadrillage : figure F, point O et quatre figures numérotées", 420);
  }
  Q.push({
    num: 20, domaine: "EG", competence: "Reconnaître l’image d’une figure par une symétrie centrale",
    entrainement: AUTO("EG14", "Symétries"), melange: false,
    generer(r, officiel) {
      let motif = MOTIFS[0], places = [3, 1, 2, 4], miroirF = false;
      const forme = officiel ? "motif-du-sujet" : r.parmi(["motif-du-sujet", "autre-motif"]);
      if (!officiel) { motif = forme === "motif-du-sujet" ? MOTIFS[0] : r.parmi(MOTIFS.slice(1)); places = r.melanger([1, 2, 3, 4]); miroirF = r.suivant() < 0.5; }
      const choix = [1, 2, 3, 4].map((n) => {
        const k = places.indexOf(n);
        return c(`Figure ${n}`, k === 0, ["", "Confond symétrie centrale et symétrie par rapport à une droite verticale.", "Confond symétrie centrale et symétrie par rapport à une droite horizontale.", "Fait glisser la figure sans la retourner : confond symétrie et translation."][k]);
      });
      return { forme, enonce: "Quelle est l’image de la figure F par la symétrie de centre O ?", figure: symetrieCentrale(motif, places, miroirF), choix };
    },
  });

  // U (21) — nature d'un triangle à partir de deux angles (schéma à main levée)
  const NATURES = ["rectangle.", "équilatéral.", "isocèle mais pas équilatéral.", "ni rectangle, ni isocèle, ni équilatéral."];
  const ANGLES_U = { equilateral: [[60, 60]], rectangle: [[30, 60], [35, 55], [40, 50], [25, 65]], isocele: [[50, 80], [70, 40], [30, 75], [40, 70]], quelconque: [[35, 65], [50, 70], [40, 75], [55, 80]] };
  function triangleAngles(a1, a2) {
    const A = [0, 0], B = [1, 0], t1 = (a1 * Math.PI) / 180, t2 = (a2 * Math.PI) / 180;
    const x = Math.tan(t2) / (Math.tan(t1) + Math.tan(t2)), C = [x, -x * Math.tan(t1)];
    const pts = cadrer([A, B, C], 280, 170, false);
    const s = polygone(pts) + arcAngle(pts[0], pts[1], pts[2], a1, 24) + arcAngle(pts[1], pts[0], pts[2], a2, 24)
      + txt(270, 165, "schéma à main levée", 12, "end", ' font-style="italic"');
    return svg(280, 172, s, `Triangle dont deux angles mesurent ${a1}° et ${a2}° (schéma à main levée)`, 300);
  }
  Q.push({
    num: 21, domaine: "EG", competence: "Déterminer la nature d’un triangle avec la somme de ses angles",
    entrainement: AUTO("EG07", "Angles d’un triangle"), melange: false, disposition: "ligne",
    generer(r, officiel) {
      const forme = officiel ? "equilateral" : r.parmi(["equilateral", "rectangle", "isocele", "quelconque"]);
      let [a1, a2] = officiel ? [60, 60] : r.parmi(ANGLES_U[forme]);
      if (!officiel && r.suivant() < 0.5) [a1, a2] = [a2, a1];
      const juste = { equilateral: 1, rectangle: 0, isocele: 2, quelconque: 3 }[forme], a3 = 180 - a1 - a2;
      const pieges = {
        0: `Ne calcule pas le troisième angle (180° − ${a1}° − ${a2}° = ${a3}°) ou ne reconnaît pas l’angle droit.`,
        1: "Pense qu’un triangle est équilatéral dès que deux angles se ressemblent, ou se fie au dessin.",
        2: forme === "equilateral" ? "Voit deux angles égaux mais ne calcule pas le troisième, qui vaut aussi 60°." : "Ne calcule pas le troisième angle et ne compare pas les trois angles.",
        3: "Ne calcule pas le troisième angle, ou se fie au dessin à main levée.",
      };
      return {
        forme,
        enonce: "Le triangle ci-contre est…",
        figure: triangleAngles(a1, a2),
        choix: NATURES.map((t, i) => c(t, i === juste, i === juste ? "" : pieges[i])),
      };
    },
  });

  // V (22) — somme de fractions (un dénominateur multiple de l'autre)
  Q.push({
    num: 22, domaine: "NC", competence: "Additionner deux fractions",
    entrainement: AUTO("NC11", "Additionner et soustraire des fractions"),
    generer(r, officiel) {
      let a = 6, b = 4, cc = 5, k = 2, ch;
      const forme = officiel ? "petit-denominateur-dabord" : r.parmi(["petit-denominateur-dabord", "grand-denominateur-dabord"]);
      do {
        if (!officiel) { k = r.parmi([2, 2, 3]); b = r.entier(2, 5); a = r.entier(1, 2 * b); cc = r.entier(1, k * b - 1); }
        const D = k * b;
        ch = [
          c(frac(a + cc, b + D), false, "Additionne les numérateurs entre eux et les dénominateurs entre eux."),
          c(frac(a * k + cc, D), true),
          c(frac(a * D, b * cc), false, `Multiplie « en croix » (${a} × ${D} et ${b} × ${cc}).`),
          c(frac(a + cc, D), false, `Garde le dénominateur ${D} mais oublie de multiplier le numérateur ${a} par ${k}.`),
        ];
      } while (!officiel && (!distincts(ch) || cc % k === 0 || a % b === 0));
      const D = k * b;
      return {
        forme,
        enonce: forme === "petit-denominateur-dabord" ? `${frac(a, b)} + ${frac(cc, D)} = …` : `${frac(cc, D)} + ${frac(a, b)} = …`,
        choix: ch,
      };
    },
  });

  // W (23) — développer k(x + a)
  Q.push({
    num: 23, domaine: "NC", competence: "Développer avec la distributivité simple",
    entrainement: AUTO("NC22", "Développer par distributivité simple"),
    generer(r, officiel) {
      let k = 2, a = 5, L = "x", ch;
      const forme = officiel ? "plus" : r.parmi(["plus", "moins"]);
      do {
        if (!officiel) { k = r.entier(2, 9); a = r.entier(2, 9); L = r.parmi(["x", "x", "a", "y"]); }
        const op = forme === "plus" ? "+" : MOINS;
        ch = [
          c(`${mono(k, L)} ${op} ${k * a}`, true),
          c(`${lettre(L)} ${op} ${k * a}`, false, `Multiplie seulement ${a} par ${k}.`),
          c(`${mono(k, L)} ${op} ${a}`, false, `Multiplie seulement ${L} par ${k}.`),
          c(forme === "plus" ? `${lettre(L)} + ${k + a}` : `${lettre(L)} ${MOINS} ${k + a}`, false, `Ajoute ${k} au lieu de multiplier.`),
        ];
      } while (!officiel && !distincts(ch));
      return { forme, enonce: `Parmi les expressions suivantes, laquelle correspond au développement de ${k}(${lettre(L)} ${forme === "plus" ? "+" : MOINS} ${a}) ?`, choix: ch };
    },
  });

  // X (24) — entier + fraction
  Q.push({
    num: 24, domaine: "NC", competence: "Additionner un entier et une fraction",
    entrainement: AUTO("NC11", "Additionner et soustraire des fractions"),
    generer(r, officiel) {
      let n = 2, a = 1, d = 5, ch;
      const forme = officiel ? "entier-dabord" : r.parmi(["entier-dabord", "fraction-dabord"]);
      do {
        if (!officiel) { n = r.entier(2, 5); d = r.entier(3, 9); a = r.entier(1, d - 1); }
        ch = [
          c(frac(n + a, d), false, `Ajoute ${n} au numérateur seulement.`),
          c(frac(n * d + a, d), true),
          c(frac(n + a, d + n), false, `Ajoute ${n} au numérateur et au dénominateur.`),
          c(frac(n + a, d + 1), false, `Écrit ${n} = ${n}/1 puis additionne les numérateurs et les dénominateurs.`),
        ];
      } while (!officiel && (!distincts(ch) || pgcd(a, d) !== 1));
      return { forme, enonce: forme === "entier-dabord" ? `${n} + ${frac(a, d)} = …` : `${frac(a, d)} + ${n} = …`, choix: ch };
    },
  });

  // Y (25) — produit de deux monômes
  Q.push({
    num: 25, domaine: "NC", competence: "Multiplier deux expressions littérales simples",
    entrainement: AUTO("NC20", "Réduire et simplifier une expression"),
    generer(r, officiel) {
      let a = 2.5, b = 2, L = "x", ch;
      const forme = officiel ? "phrase" : r.parmi(["phrase", "calcul"]);
      do {
        if (!officiel) { a = r.parmi([1.5, 2.5, 3.5, 3, 4, 5, 6]); b = r.entier(2, 5); L = r.parmi(["x", "x", "a", "t"]); }
        const m = (k, p) => `${dec(k)}${lettre(L)}${p === 2 ? "²" : ""}`;
        ch = [c(m(a + b, 1), false, "Additionne au lieu de multiplier."), c(m(a + b, 2), false, `Additionne les nombres mais multiplie ${L} par ${L}.`), c(m(a * b, 1), false, `Multiplie les nombres mais oublie que ${L} × ${L} = ${L}².`), c(m(a * b, 2), true)];
      } while (!officiel && (!distincts(ch) || a === b));
      const m1 = `${dec(a)}${lettre(L)}`, m2 = `${b}${lettre(L)}`;
      return { forme, enonce: forme === "phrase" ? `Le produit de ${m1} par ${m2} est égal à :` : `${m1} × ${m2} = …`, choix: ch };
    },
  });

  // Z (26) — somme de deux fractions de dénominateurs premiers entre eux
  Q.push({
    num: 26, domaine: "NC", competence: "Additionner deux fractions de dénominateurs différents",
    entrainement: AUTO("NC11", "Additionner et soustraire des fractions"), melange: false,
    generer(r, officiel) {
      let p = 2, q = 3, ch;
      const forme = officiel ? "calcul" : r.parmi(["calcul", "phrase"]);
      do {
        if (!officiel) { p = r.entier(2, 6); q = r.entier(p + 1, 9); }
        ch = [c(frac(1, p + q), false, "Garde le numérateur 1 et additionne les dénominateurs."), c(frac(2, p + q), false, "Additionne les numérateurs entre eux et les dénominateurs entre eux."), c(frac(2, p * q), false, "Additionne les numérateurs mais multiplie les dénominateurs."), c(frac(p + q, p * q), true)];
      } while (!officiel && (!distincts(ch) || pgcd(p, q) !== 1));
      return { forme, enonce: forme === "calcul" ? `${frac(1, p)} + ${frac(1, q)} = …` : `La somme de ${frac(1, p)} et de ${frac(1, q)} est égale à…`, choix: ch };
    },
  });

  // AA (27) — carré d'un relatif
  Q.push({
    num: 27, domaine: "NC", competence: "Calculer le carré d’un nombre relatif",
    entrainement: AUTO("NC14", "Carrés, cubes et racines carrées"),
    generer(r, officiel) {
      const a = officiel ? 3 : r.entier(3, 9);
      const forme = officiel ? "parentheses" : r.parmi(["parentheses", "sans-parentheses"]);
      if (forme === "sans-parentheses")
        return {
          forme,
          enonce: `${MOINS}${a}² = …`,
          choix: [
            c(String(a * a), false, `Élève (${MOINS}${a}) au carré : ne voit pas que le carré porte seulement sur ${a}.`),
            c(String(2 * a), false, `Calcule ${a} × 2.`),
            c(rel(-a * a), true),
            c(rel(-2 * a), false, `Calcule ${a} × 2 et garde le signe moins.`),
          ],
        };
      return {
        forme,
        enonce: `(${MOINS}${a})² = …`,
        choix: [
          c(String(a * a), true),
          c(String(2 * a), false, `Calcule ${a} × 2 au lieu de ${a} × ${a}.`),
          c(rel(-a * a), false, `Pense que le carré d’un nombre négatif est négatif.`),
          c(rel(-2 * a), false, `Calcule (${MOINS}${a}) × 2.`),
        ],
      };
    },
  });

  // AB (28) — fraction × entier
  const FRACS_AB = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [2, 7], [3, 7]];
  Q.push({
    num: 28, domaine: "NC", competence: "Multiplier une fraction par un entier",
    entrainement: AUTO("NC12", "Produits, inverses et quotients de fractions"),
    generer(r, officiel) {
      let a = 2, b = 3, k = 2, ch;
      const forme = officiel ? "fraction-dabord" : r.parmi(["fraction-dabord", "entier-dabord"]);
      do {
        if (!officiel) { [a, b] = r.parmi(FRACS_AB); k = r.entier(2, 3); }
        ch = [
          c(frac(k * a ** k, b ** k), false, `Calcule (${a}/${b})<sup>${k}</sup> × ${k} : confond avec une puissance.`),
          c(frac(a * k, b * k), false, `Multiplie aussi le dénominateur par ${k}.`),
          c(frac(a * k, b), true),
          c(frac(a ** k, b ** k), false, `Calcule (${a}/${b})<sup>${k}</sup> : confond avec une puissance.`),
        ];
      } while (!officiel && !distincts(ch));
      return { forme, enonce: forme === "fraction-dabord" ? `${frac(a, b)} × ${k} = …` : `${k} × ${frac(a, b)} = …`, choix: ch };
    },
  });

  // AC (29) — nombre premier
  const COMPOSES = [[57, 3, 7], [51, 3, 7], [87, 3, 7], [91, 7, 3], [93, 3, 7], [119, 7, 3], [133, 7, 3], [111, 3, 7], [39, 3, 7], [69, 3, 7], [161, 7, 3], [203, 7, 3]];
  const PREMIERS = [[53, 3], [59, 7], [61, 7], [67, 3], [71, 7], [73, 3], [79, 7], [83, 7], [89, 3], [97, 7], [101, 3], [103, 7]];
  Q.push({
    num: 29, domaine: "NC", competence: "Reconnaître un nombre premier",
    entrainement: AUTO("NC18", "Diviseurs, nombres premiers et division euclidienne"), melange: false, disposition: "ligne",
    generer(r, officiel) {
      const forme = officiel ? "compose" : r.parmi(["compose", "premier"]);
      if (forme === "premier") {
        const [N, q] = r.parmi(PREMIERS);
        return {
          forme,
          enonce: `${N} est-il un nombre premier ?`,
          choix: [
            c(`Non car il est divisible par ${q}.`, false, `Ne vérifie pas la division : ${N} n’est pas divisible par ${q}.`),
            c("Non car il est impair.", false, "Confond « nombre premier » et « nombre pair ou impair »."),
            c(`Oui car il n’admet que deux diviseurs : 1 et ${N}.`, true),
            c("Oui car il est impair.", false, "Donne une bonne réponse avec une mauvaise raison : un nombre impair n’est pas forcément premier."),
          ],
        };
      }
      const [N, p, q] = officiel ? [57, 3, 7] : r.parmi(COMPOSES);
      return {
        forme,
        enonce: `${N} est-il un nombre premier ?`,
        choix: [
          c(`Non car il est divisible par ${q}.`, false, `Bonne conclusion, mauvaise raison : ${N} n’est pas divisible par ${q}.`),
          c(`Non car il est divisible par ${p}.`, true),
          c(`Oui car il n’admet que deux diviseurs : 1 et ${N}.`, false, `Ne cherche pas de diviseur : ${N} = ${p} × ${N / p}.`),
          c("Oui car il est impair.", false, "Pense qu’un nombre impair est forcément premier."),
        ],
      };
    },
  });

  // AD (30) — ordre de grandeur en puissance de 10
  Q.push({
    num: 30, domaine: "NC", competence: "Donner un ordre de grandeur avec une puissance de 10",
    entrainement: AUTO("NC16", "Notation scientifique"), melange: false,
    generer(r, officiel) {
      // N = (significatif à 2 ou 3 chiffres, commençant par 1 ou 2) suivi de z zéros ; ordre de grandeur 10^(chiffres − 1).
      let sig = "117", z = 3;
      const forme = officiel ? "trois-chiffres" : r.parmi(["trois-chiffres", "deux-chiffres"]);
      if (!officiel) { sig = forme === "trois-chiffres" ? `${r.entier(1, 2)}${r.entier(0, 4)}${r.entier(1, 9)}` : `${r.entier(1, 2)}${r.entier(1, 4)}`; z = r.entier(2, 6); }
      const e = sig.length + z - 1;
      const cands = [z, e - 1, e, e + 1];
      const ch = [
        c(sup(10, z), false, `Compte les zéros à la fin du nombre (${z}).`),
        c(sup(10, e - 1), false, "Se trompe d’un rang."),
        c(sup(10, e), true),
        c(sup(10, e + 1), false, `Compte tous les chiffres du nombre (${e + 1}).`),
      ];
      if (new Set(cands).size < 4) ch[0] = c(sup(10, e + 2), false, "Se trompe de deux rangs.");
      return { forme, enonce: `Un ordre de grandeur du nombre ${nb(sig + "0".repeat(z))} est :`, choix: ch.sort((x, y) => Number(x.html.match(/<sup>(\d+)/)[1]) - Number(y.html.match(/<sup>(\d+)/)[1])) };
    },
  });

  // AE (31) — développer kx(x + a)
  Q.push({
    num: 31, domaine: "NC", competence: "Développer et réduire une expression",
    entrainement: AUTO("NC22", "Développer par distributivité simple"),
    generer(r, officiel) {
      let k = 3, a = 2, L = "x", ch;
      const forme = officiel ? "plus" : r.parmi(["plus", "moins"]);
      const op = forme === "plus" ? "+" : MOINS;
      do {
        if (!officiel) { k = r.entier(2, 7); a = r.entier(2, 7); L = r.parmi(["x", "x", "a", "y"]); }
        ch = [
          c(mono(k * a, L, 2), false, `Multiplie tous les nombres et toutes les lettres ensemble (${k} × ${a} et ${L} × ${L}).`),
          c(`${mono(k * a, L)} ${op} ${a}`, false, `Multiplie ${k}${L} seulement par ${a}.`),
          c(`${mono(k, L, 2)} ${op} ${mono(a, L)}`, false, `Multiplie ${a} par ${L} mais oublie le facteur ${k}.`),
          c(`${mono(k, L, 2)} ${op} ${mono(k * a, L)}`, true),
        ];
      } while (!officiel && (!distincts(ch) || k === a));
      return { forme, enonce: `Quelle est la forme développée et réduite de ${mono(k, L)}(${lettre(L)} ${op} ${a}) ?`, choix: ch };
    },
  });

  // AF (32) — factoriser kx + ka
  Q.push({
    num: 32, domaine: "NC", competence: "Factoriser par un facteur commun",
    entrainement: AUTO("NC24", "Factoriser par facteur commun"),
    generer(r, officiel) {
      let k = 7, a = 2, L = "x", ch;
      const forme = officiel ? "lettre-dabord" : r.parmi(["lettre-dabord", "nombre-dabord"]);
      do {
        if (!officiel) { k = r.entier(2, 9); a = r.entier(2, 9); L = r.parmi(["x", "x", "a", "y"]); }
        ch = [
          c(mono(k + k * a, L), false, "Additionne les deux nombres et garde la lettre."),
          c(mono(k + a, L), false, `Additionne ${k} et ${a} : ne factorise pas.`),
          c(`${k} × ${lettre(L)} + ${k} × ${a}`, false, "Fait apparaître le facteur commun sans factoriser."),
          c(`${k}(${lettre(L)} + ${a})`, true),
        ];
      } while (!officiel && (!distincts(ch) || k === a));
      return { forme, enonce: `Quelle est la forme factorisée de la somme ${forme === "lettre-dabord" ? `${mono(k, L)} + ${k * a}` : `${k * a} + ${mono(k, L)}`} ?`, choix: ch };
    },
  });

  // Lot EN10 (décidé avec Gwenaël le 14/11) : les formes qui ne sont PAS des jumeaux stricts (autre cas, autre sens, autre
  // écriture, autre difficulté, ou bonne réponse d'une autre nature). Rien n'est supprimé : elles restent dans `generer`
  // pour la banque par compétence ; le jumeau (EN.genererJumeau) les écarte. Le sujet officiel ne passe jamais par ici.
  const HORS_STRICT = {
    3: { formes: ["produit-vers-puissance"], pourquoi: "l'autre sens" },
    4: { formes: ["divisible"], pourquoi: "« 80 est divisible par… » : autre tournure" },
    5: { formes: ["college"], pourquoi: "50 % au lieu de 40 % : plus facile" },
    6: { formes: ["b-plus-moins-a"], pourquoi: "14 + (−9) : écriture avec parenthèses" },
    8: { formes: ["ajouter-puis-multiplier"], pourquoi: "Lot EN10 : « ajouter 7 » au lieu de « soustraire 3 » : le piège « soustraction à l'envers » (3 − x) disparaît (même raison que Q23 et Q31)" },
    7: { formes: ["carre"], pourquoi: "un carré au lieu d'un rectangle" },
    11: { formes: ["moins-a-plus-moins-b"], pourquoi: "−7 + (−12) : autre écriture" },
    12: { formes: ["nombre-vers-puissance"], pourquoi: "l'autre sens" },
    13: { formes: ["valeur-negative"], pourquoi: "valeur négative : plus dur" },
    15: { formes: ["carre"], pourquoi: "un carré au lieu d'un rectangle" },
    18: { formes: ["resultat-positif"], pourquoi: "résultat positif : le piège « −1 » disparaît" },
    19: { formes: ["nombre-vers-puissance"], pourquoi: "l'autre sens" },
    21: { formes: ["quelconque", "rectangle", "isocele"], pourquoi: "la bonne réponse n'est plus « équilatéral »" },
    23: { formes: ["moins"], pourquoi: "6(a − 9) : différence au lieu d'une somme" },
    27: { formes: ["sans-parentheses"], pourquoi: "−6² au lieu de (−6)² : le piège s'inverse" },
    29: { formes: ["premier"], pourquoi: "79 est premier : la bonne réponse change de nature" },
    31: { formes: ["moins"], pourquoi: "5a(a − 7) : différence au lieu d'une somme" },
  };

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["3e-automatismes"] = {
    id: "3e-automatismes",
    famille: "Outil de positionnement",
    niveau: "3e",
    titre: "Automatismes",
    annee: 2026,
    source: "Bibliothèque d’outils de positionnement, classe de 3e, « Automatismes » (attendus de fin de 4e), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants",
    consignes: "Sans calculatrice. Pour chaque question, une seule réponse est juste.",
    domaines: { NC: "Nombres et calculs", OGD: "Organisation et gestion de données", GM: "Grandeurs et mesures", EG: "Espace et géométrie" },
    // Groupes de maîtrise de la notice Eduscol (sur 32).
    seuils: [{ max: 9, nom: "À besoins" }, { max: 17, nom: "Fragile" }, { max: 32, nom: "Satisfaisant" }],
    officiels: [{ cle: "outil", annee: 2026, titre: "Le test officiel", detail: "Les 32 vraies questions de l’outil de positionnement Eduscol." }],
    questions: Q,
    horsStrict: HORS_STRICT,
  };
})(typeof window !== "undefined" ? window : globalThis);
