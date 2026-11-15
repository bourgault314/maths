/* maths&go — Évaluation nationale de début de 6e, test spécifique « Automatismes » (DEPP, septembre 2026).
   Source : https://eduscol.education.gouv.fr/evaluations-nationales-6e — licence Etalab 2.0.
   Chaque question existe en version officielle (les valeurs du sujet 2026) et en version « jumelle » :
   même tâche, mêmes pièges (les distracteurs suivent l'analyse publiée par la DEPP, section 10.4 du document
   « Présentation et analyse des questions d'automatismes ») et, depuis le lot EN4c, autre « forme »
   (écriture, sens, disposition, figure) au même niveau que le sujet officiel. */
(function (racine) {
  "use strict";
  const { nb, decaler, frac, ang, enLettres, svg, quadrillage, COUL } = racine.EN;

  // Un choix : texte affiché + clé de comparaison + juste/faux + l'erreur que trahit le piège (vue prof).
  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const AUTO = (notion, libelle) => ({ appli: "Automatismes", notion, libelle, url: `/automatismes/?notions=${notion}&nombre=8` });
  // La forme du sujet officiel est la première de la liste : on ne tire au hasard que pour un jumeau.
  const forme = (r, officiel, liste) => (officiel ? liste[0] : r.parmi(liste));

  // ---------- Figures ----------
  // Droite graduée entre deux grands nombres (dix grands intervalles, chacun en dix) ; cadre vide sur la graduation rangFleche.
  function droiteGrandsNombres(debut, fin, rangFleche) {
    const L = 600, x0 = 92, y = 76;
    let s = `<line x1="${x0 - 14}" y1="${y}" x2="${x0 + L + 14}" y2="${y}" stroke="${COUL.trait}" stroke-width="2"/>`;
    for (let i = 0; i <= 100; i++) {
      const x = x0 + (i * L) / 100;
      const h = i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 5;
      s += `<line x1="${x}" y1="${y - h}" x2="${x}" y2="${y + (i % 10 === 0 ? 5 : 0)}" stroke="${COUL.trait}" stroke-width="${i % 10 === 0 ? 3 : 1.3}"/>`;
    }
    const boite = (x, yb, texte) =>
      `<rect x="${x - 88}" y="${yb}" width="176" height="40" rx="4" fill="#fff" stroke="${COUL.trait}" stroke-width="1.6"/>` +
      (texte ? `<text x="${x}" y="${yb + 29}" font-size="27" font-weight="600" text-anchor="middle" fill="${COUL.trait}">${texte}</text>` : "");
    const fleche = (x, y1, y2, haut) =>
      `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${COUL.trait}" stroke-width="1.6"/>` +
      (haut ? `<path d="M${x - 5} ${y2 + 8} L${x} ${y2} L${x + 5} ${y2 + 8}Z" fill="${COUL.trait}"/>` : `<path d="M${x - 5} ${y2 - 8} L${x} ${y2} L${x + 5} ${y2 - 8}Z" fill="${COUL.trait}"/>`);
    const xf = x0 + rangFleche * 60;
    s += boite(x0, 112, nb(String(debut))) + fleche(x0, 112, y + 8, true);
    s += boite(x0 + L, 112, nb(String(fin))) + fleche(x0 + L, 112, y + 8, true);
    s += boite(xf, 2, "") + fleche(xf, 42, y - 17, false);
    return svg(x0 * 2 + L, 156, s, "Droite graduée de " + nb(String(debut)) + " à " + nb(String(fin)));
  }

  // Demi-droite graduée en dixièmes : grands traits toutes les 5 graduations, seuls 0 et 1 sont écrits.
  // Le pas se resserre un peu quand la demi-droite va plus loin (3 unités), pour que la figure ne devienne pas trop large.
  function demiDroiteDixiemes(dixiemes, nombreUnites) {
    const x0 = 22, y = 62, n = Math.max(nombreUnites * 10 + 6, dixiemes + 4), pas = Math.min(20, 620 / n);
    const X = (i) => +(x0 + i * pas).toFixed(1);
    let s = `<line x1="${x0}" y1="${y}" x2="${X(n) + 10}" y2="${y}" stroke="${COUL.trait}" stroke-width="1.4"/>`;
    for (let i = 0; i <= n; i++) {
      const grand = i % 5 === 0;
      s += `<line x1="${X(i)}" y1="${y - (grand ? 11 : 7)}" x2="${X(i)}" y2="${y + (grand ? 11 : 7)}" stroke="${grand ? COUL.lettre : COUL.trait}" stroke-width="${grand ? 3 : 1.4}"/>`;
    }
    s += `<text x="${x0}" y="${y + 40}" font-size="28" font-weight="700" text-anchor="middle" fill="${COUL.lettre}">0</text>`;
    s += `<text x="${X(10)}" y="${y + 40}" font-size="28" font-weight="700" text-anchor="middle" fill="${COUL.lettre}">1</text>`;
    s += `<text x="${X(dixiemes)}" y="${y - 18}" font-size="28" font-weight="700" text-anchor="middle" fill="${COUL.lettre}">B</text>`;
    return svg(x0 * 2 + n * pas + 10, 112, s, "Demi-droite graduée avec le point B");
  }

  // Droite graduée de 0 à 1 partagée en d parts égales, `apres` graduations de plus après 1 (1 sur le sujet), points A et B.
  function droiteFraction(d, kA, kB, apres) {
    const L = apres === 1 ? 520 : Math.round((540 * d) / (d + apres)), x0 = 22, y = 60, pas = L / d;
    const X = (i) => +(x0 + i * pas).toFixed(1);
    let s = `<line x1="${x0}" y1="${y}" x2="${X(d + apres) + 10}" y2="${y}" stroke="${COUL.trait}" stroke-width="1.4"/>`;
    for (let i = 0; i <= d + apres; i++) {
      const repere = i === 0 || i === d || i === kA || i === kB;
      s += `<line x1="${X(i)}" y1="${y - 10}" x2="${X(i)}" y2="${y + 10}" stroke="${repere ? COUL.lettre : COUL.trait}" stroke-width="${repere ? 3 : 2}"/>`;
    }
    const t = (i, txt, dy) => `<text x="${X(i)}" y="${y + dy}" font-size="28" font-weight="700" text-anchor="middle" fill="${COUL.lettre}">${txt}</text>`;
    s += t(0, "0", 42) + t(d, "1", 42) + t(kA, "A", -18) + t(kB, "B", -18);
    return svg(x0 * 2 + L + apres * pas + 10, 110, s, "Droite graduée de 0 à 1 avec les points A et B");
  }

  const JAUNE = "#ffe100";
  // Rectangle partagé en bandes égales ; `coloriees` : rangs des bandes coloriées.
  // Lot EN-J : `debout` — la même bande dressée (parts empilées, la première en haut), dessinée à la même échelle.
  function bandeColoriee(parts, coloriees, debout) {
    const l = 26, h = 104, x0 = 4, y0 = 4;
    let s = "";
    for (let i = 0; i < parts; i++)
      s += debout ? `<rect x="${x0}" y="${y0 + i * l}" width="${h}" height="${l}" fill="${coloriees.includes(i) ? JAUNE : "#fff"}" stroke="#111" stroke-width="2"/>`
        : `<rect x="${x0 + i * l}" y="${y0}" width="${l}" height="${h}" fill="${coloriees.includes(i) ? JAUNE : "#fff"}" stroke="#111" stroke-width="2"/>`;
    const etiquette = `Rectangle partagé en ${parts} parts égales, ${coloriees.length} coloriées`;
    return debout ? svg(h + 8, parts * l + 8, s, etiquette, Math.round(((h + 8) * 340) / (parts * l + 8))) : svg(parts * l + 8, h + 8, s, etiquette);
  }

  // Disque partagé en parts égales (en partant du haut) ; `coloriees` : rangs des parts coloriées.
  function disqueColorie(parts, coloriees) {
    const O = [64, 64], R = 58, P = (i) => [O[0] + R * Math.sin((2 * Math.PI * i) / parts), O[1] - R * Math.cos((2 * Math.PI * i) / parts)];
    let s = "";
    for (let i = 0; i < parts; i++) {
      const a = P(i), b = P(i + 1);
      s += `<path d="M${O[0]} ${O[1]} L${a[0].toFixed(1)} ${a[1].toFixed(1)} A${R} ${R} 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)}Z" fill="${coloriees.includes(i) ? JAUNE : "#fff"}" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`;
    }
    return svg(128, 128, s, `Disque partagé en ${parts} parts égales, ${coloriees.length} coloriées`, 220);
  }

  // Rectangle (ou carré) sur quadrillage ; `marges` : carreaux libres à gauche, à droite, en haut, en bas (1 partout sur le sujet).
  function rectangleQuadrille(largeur, hauteur, carre, marges) {
    const pas = 22, m = marges || { g: 1, d: 1, h: 1, b: 1 };
    const col = largeur + m.g + m.d, lig = hauteur + m.h + m.b;
    let s = quadrillage(6, 6, col, lig, pas, carre ? "#9aa3ab" : COUL.grille, Boolean(carre));
    if (carre) s = `<rect x="6" y="6" width="${col * pas}" height="${lig * pas}" fill="#c3c3c3"/>` + s;
    s += `<rect x="${6 + m.g * pas}" y="${6 + m.h * pas}" width="${largeur * pas}" height="${hauteur * pas}" fill="${carre ? "rgba(110,110,240,.75)" : "none"}" stroke="${carre ? COUL.bleuBord : "#111"}" stroke-width="2.4"/>`;
    return svg(col * pas + 12, lig * pas + 12, s, carre ? "Carré dessiné sur un quadrillage" : "Rectangle dessiné sur un quadrillage");
  }

  // Pavé de petits cubes en perspective cavalière : dessus bleu, face avant rouge, côté vert.
  // miroir : le côté vert passe à gauche (la profondeur part vers le haut à gauche).
  const ROUGE = "#ff6f78", BLEU = "#6f78ef", VERT = "#73d17d";
  function paveCubes(L, l, h, miroir) {
    const a = 30, kx = 0.62 * a * Math.cos(Math.PI / 5), ky = 0.62 * a * Math.sin(Math.PI / 5);
    const fx = 10, fy = 10 + l * ky; // coin haut gauche de la face avant
    const P = (i, j, k) => [fx + i * a + k * kx, fy + (h - j) * a - k * ky]; // i le long de L, j hauteur, k profondeur
    const poly = (pts, fill) => `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="${fill}" stroke="#333" stroke-width="1"/>`;
    let s = "";
    for (let i = 0; i < L; i++) for (let j = 0; j < h; j++) s += poly([P(i, j, 0), P(i + 1, j, 0), P(i + 1, j + 1, 0), P(i, j + 1, 0)], ROUGE);
    for (let i = 0; i < L; i++) for (let k = 0; k < l; k++) s += poly([P(i, h, k), P(i + 1, h, k), P(i + 1, h, k + 1), P(i, h, k + 1)], BLEU);
    for (let k = 0; k < l; k++) for (let j = 0; j < h; j++) s += poly([P(L, j, k), P(L, j, k + 1), P(L, j + 1, k + 1), P(L, j + 1, k)], VERT);
    const W = 20 + L * a + l * kx, Hh = 20 + h * a + l * ky;
    if (miroir) s = `<g transform="translate(${W.toFixed(1)} 0) scale(-1 1)">${s}</g>`;
    return svg(W, Hh, s, `Pavé droit formé de petits cubes`);
  }

  // Deux angles sur quadrillage (sommets B et E). sens = −1 : côtés vers la gauche (sujet) ; +1 : vers la droite.
  function deuxAngles(angle1, angle2, sens) {
    const pas = 26, lig = 4, x0 = 4, y0 = 4;
    const col = sens < 0 ? angle2.sommet + 1 : angle2.sommet + Math.max(angle2.p, angle2.horiz) + 1;
    let s = `<rect x="${x0}" y="${y0}" width="${col * pas}" height="${lig * pas}" fill="#ececec"/>` + quadrillage(x0, y0, col, lig, pas, "#b9b9b9");
    const dessin = (sommetCol, a, lettres) => {
      const S = [x0 + sommetCol * pas, y0 + 3 * pas];
      const H = [S[0] + sens * a.horiz * pas, S[1]];
      const O = [S[0] + sens * a.p * pas, S[1] - a.q * pas];
      let t = `<line x1="${S[0]}" y1="${S[1]}" x2="${H[0]}" y2="${H[1]}" stroke="#111" stroke-width="1.6"/><line x1="${S[0]}" y1="${S[1]}" x2="${O[0]}" y2="${O[1]}" stroke="#111" stroke-width="1.6"/>`;
      const r = 17, th = Math.atan2(a.q, a.p);
      t += `<path d="M${S[0] + sens * r} ${S[1]} A${r} ${r} 0 0 ${sens < 0 ? 1 : 0} ${(S[0] + sens * r * Math.cos(th)).toFixed(1)} ${(S[1] - r * Math.sin(th)).toFixed(1)}" fill="none" stroke="#111" stroke-width="1.2"/>`;
      const lt = (p, txt, dx, dy) => `<text x="${p[0] + dx}" y="${p[1] + dy}" font-size="16" font-weight="700" fill="#111" text-anchor="middle">${txt}</text>`;
      t += lt(O, lettres[0], 3 * sens, -7) + lt(H, lettres[1], 3 * sens, 19) + lt(S, lettres[2], -5 * sens, 19);
      return t;
    };
    s += dessin(angle1.sommet, angle1, ["A", "C", "B"]) + dessin(angle2.sommet, angle2, ["D", "F", "E"]);
    return svg(col * pas + 8, lig * pas + 8, s, "Deux angles tracés sur un quadrillage");
  }

  // ---------- Les 23 questions ----------
  // Lot EN4c (variété « dans la compétence ») : chaque sujet jumeau tire une « forme » (écriture, sens, disposition, figure)
  // au même niveau que le sujet officiel ; `forme` la nomme. Le sujet officiel ne tire rien au hasard.
  // Les pièges gardent le sens que leur donne la DEPP ; les textes de la vue prof n'ont aucun mot genré.
  const Q = [];

  // 1 — écrire en chiffres un nombre dicté en lettres
  Q.push({
    num: 1, domaine: "NC", competence: "Écrire en chiffres un grand nombre donné en lettres",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["unites-un-chiffre", "unites-deux-chiffres"]);
      const A = officiel ? 76 : r.parmi([72, 73, 74, 75, 76, 77, 78, 79, 92, 93, 94, 95, 96, 97, 98, 99]);
      const B = officiel ? 4 : f === "unites-un-chiffre" ? r.entier(2, 9) : r.parmi([12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 25, 28, 30, 34, 35, 40, 45, 47, 50, 56, 60, 63]);
      const base = A < 90 ? 60 : 80;
      const p = String(B).padStart(3, "0");
      return {
        forme: f,
        enonce: `Le nombre ${enLettres(A * 1000 + B)} s’écrit :`,
        choix: [
          c(nb(String(A * 1000 + B)), true),
          c(`${A} 1${p}`, false, "Ne comprend pas le groupement des milliers."),
          c(`${base} ${A - base} 1 ${p}`, false, "Écrit en chiffres chaque mot entendu, l’un après l’autre."),
          c(nb(String((A - base) * 1000 + B)), false, "Ne retient que la fin du nombre entendu."),
        ],
      };
    },
  });

  // 2 — « N millièmes » (ou « N centièmes »)
  Q.push({
    num: 2, domaine: "NC", competence: "Associer une désignation orale (centièmes, millièmes) à l’écriture décimale",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["milliemes-deux-chiffres", "milliemes-un-chiffre", "centiemes-un-chiffre"]);
      const N = officiel ? 72 : f !== "milliemes-deux-chiffres" ? r.entier(2, 9)
        : r.parmi([23, 24, 25, 26, 27, 28, 29, 32, 34, 35, 36, 37, 38, 43, 45, 46, 47, 48, 53, 54, 56, 57, 58, 62, 63, 64, 65, 67, 68, 72, 73, 74, 75, 76, 78, 83, 84, 85, 86, 87, 92, 93, 94, 95, 96]);
      const mille = f !== "centiemes-un-chiffre";
      const u = mille ? "millièmes" : "centièmes", rang = mille ? "troisième" : "deuxième", mot = enLettres(N);
      const juste = mille ? (N < 10 ? `0,00${N}` : `0,0${N}`) : `0,0${N}`;
      const place = mille && N < 10 ? `0,${N}00` : `0,${N}0`;
      return {
        forme: f,
        enonce: `Quel nombre correspond à ${mot} ${u} ?`,
        choix: [
          c(place, false, `Sait que les ${u} sont au ${rang} rang après la virgule, mais ne lit pas « ${mot} » comme le nombre de ${u}.`),
          c(mille ? `${N},001` : `${N},01`, false, `Lit « ${mot} » comme des unités et ajoute un ${mille ? "millième" : "centième"}.`),
          c(mille ? `${N},1000` : `${N},100`, false, "Transcrit les mots en deux nombres juxtaposés."),
          c(juste, true),
        ],
      };
    },
  });

  // 3 — a + b/10 (ou b/10 + a)
  Q.push({
    num: 3, domaine: "NC", competence: "Passer d’une décomposition en fraction décimale à l’écriture décimale",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["entier-dabord", "fraction-dabord"]);
      const a = officiel ? 3 : r.entier(2, 9), b = officiel ? 2 : r.entier(1, 9);
      const virgule = "Repère les chiffres et sait qu’une virgule est attendue, mais la place mal.";
      return {
        forme: f,
        enonce: f === "entier-dabord" ? `${a} + ${frac(b, 10)} = …` : `${frac(b, 10)} + ${a} = …`,
        choix: [
          c(`0,${a}${b}`, false, virgule),
          c(`${a},${b}`, true),
          c(`${a}${b},0`, false, virgule),
          c(`${a}${b},10`, false, "Ne comprend pas la décomposition avec une fraction décimale."),
        ],
      };
    },
  });

  // 4 — k/100 (ou k/1000) en écriture décimale
  Q.push({
    num: 4, domaine: "NC", competence: "Écrire une fraction décimale sous forme décimale",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["centiemes", "milliemes", "centiemes-deux-chiffres"]);
      const rang = "Sait que ce n’est pas un entier mais se trompe de rang.", entier = "Fabrique un entier avec les nombres de la fraction.";
      if (f === "milliemes") {
        const k = r.entier(2, 9);
        return {
          forme: f,
          enonce: `Quel nombre est égal à la fraction ${frac(k, 1000)} ?`,
          choix: [c(`0,00${k}`, true), c(`0,0${k}`, false, rang), c(String(k), false, "Ne garde que le chiffre, sans son rang."), c(nb(String(k * 1000)), false, entier)],
        };
      }
      if (f === "centiemes-deux-chiffres") {
        let k;
        do k = r.entier(11, 99); while (k % 10 === 0);
        return {
          forme: f,
          enonce: `Quel nombre est égal à la fraction ${frac(k, 100)} ?`,
          choix: [c(`0,${k}`, true), c(decaler(String(k), -1), false, rang), c(String(k), false, "Ne garde que les chiffres, sans leur rang."), c(nb(String(k * 100)), false, entier)],
        };
      }
      const k = officiel ? 4 : r.entier(2, 9);
      return {
        forme: f,
        enonce: `Quel nombre est égal à la fraction ${frac(k, 100)} ?`,
        choix: [c(`0,0${k}`, true), c(`0,${k}`, false, rang), c(String(k), false, "Ne garde que le chiffre, sans son rang."), c(String(k * 100), false, entier)],
      };
    },
  });

  // 5 — relations entre unités de numération
  const UNITES_NUM = ["dizaines", "unités", "dixièmes", "centièmes", "millièmes"];
  Q.push({
    num: 5, domaine: "NC", competence: "Connaître les relations entre unités de numération",
    entrainement: AUTO("NC01", "Numération décimale"), disposition: "ligne",
    generer(r, officiel) {
      const f = forme(r, officiel, ["dix-fois", "en-nombre"]);
      const n = officiel ? 5 : r.entier(2, 9);
      const i = officiel ? 3 : r.parmi([2, 3]); // dixièmes ou centièmes
      const juste = UNITES_NUM[i + 1];
      const ordre = ["dixièmes", "millièmes", "unités", "dizaines"];
      if (i === 2) ordre.splice(0, 2, "centièmes", "millièmes"); // pour les dixièmes : la bonne réponse est « centièmes »
      const ecrit = (u) => (f === "dix-fois" ? `10 fois ${n} ${u}.` : `${10 * n} ${u}.`);
      return {
        forme: f,
        enonce: `${n} ${UNITES_NUM[i]} est égal à…`,
        choix: ordre.map((u) => c(ecrit(u), u === juste, u === "unités" ? "Ne comprend pas les relations entre unités de numération." : "Généralise à tort « cent = 10 × dix » aux autres unités.")),
      };
    },
  });

  // 6 — grande droite graduée (de m millions à m + 1 millions, ou centaines de mille, ou dizaines de millions)
  const UNITE_DROITE = { "millions": 1e6, "centaines-de-mille": 1e5, "dizaines-de-millions": 1e7 };
  Q.push({
    num: 6, domaine: "NC", competence: "Lire l’abscisse d’un point (grand nombre) sur une droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["millions", "centaines-de-mille", "dizaines-de-millions"]);
      const U = UNITE_DROITE[f];
      const m = officiel ? 2 : r.entier(1, 8), k = officiel ? 6 : r.parmi([2, 3, 4, 6, 7, 8]);
      const base = m * U;
      return {
        forme: f,
        enonce: "Quel grand nombre faut-il placer dans le cadre vide sur cette droite graduée ?",
        figure: droiteGrandsNombres(base, base + U, k),
        choix: [
          c(nb(String(base + (k * U) / 10)), true),
          c(nb(String(base + (k * U) / 100)), false, "Compte les grandes graduations mais place mal le chiffre."),
          c(nb(String(base + (k * U) / 10000)), false, "Compte les grandes graduations mais place mal le chiffre."),
          c(nb(String(base + k)), false, "Compte les graduations sans comprendre leur valeur."),
        ],
      };
    },
  });

  // 7 — abscisse décimale sur une demi-droite en dixièmes (B après 2, ou après 3)
  Q.push({
    num: 7, domaine: "NC", competence: "Lire l’abscisse décimale d’un point sur une demi-droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["apres-2", "apres-3"]);
      const U = f === "apres-2" ? 2 : 3;
      const b = officiel ? 2 : r.parmi([1, 2, 3, 4, 6, 7, 8, 9]);
      const n = 10 * U + b;
      return {
        forme: f,
        enonce: "Observer cette demi-droite graduée. Quelle est l’abscisse du point B ?",
        figure: demiDroiteDixiemes(n, U),
        choix: [
          c(`${U},${b}`, true),
          c(`1,${n - 10}`, false, "Repère l’unité puis compte les graduations suivantes sans leur donner de sens."),
          c(String(n), false, "Compte les graduations sans tenir compte de l’origine ni de l’unité."),
          c(`${10 * U},${b}`, false, `Voit que l’écart est inférieur à une unité mais ne l’applique pas entre 0 et ${U}.`),
        ],
      };
    },
  });

  // 8 — fraction sur une droite graduée
  Q.push({
    num: 8, domaine: "NC", competence: "Associer une fraction à un point d’une droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["une-graduation-apres-1", "plusieurs-graduations-apres-1"]);
      let d = 10, kA = 4, kB = 2;
      if (!officiel) {
        d = r.parmi([4, 5, 6, 8, 10]);
        do kA = r.entier(2, d - 1); while (kA * kA === d); // sinon le piège 1/kA vaudrait kA/d (1/2 = 2/4)
        kB = r.parmi([...Array(d - 1).keys()].map((i) => i + 1).filter((i) => i !== kA));
      }
      const apres = f === "une-graduation-apres-1" ? 1 : Math.ceil(d / 2) + 1;
      const unite = "Compte les graduations, mais l’unité n’a pas de sens dans ce comptage.";
      return {
        forme: f,
        enonce: "Quelle fraction correspond au point A ?",
        figure: droiteFraction(d, kA, kB, apres),
        choix: [
          c(frac(1, kA), false, unite),
          c(frac(kA, 1), false, unite),
          c(frac(kA, d), true),
          c(frac(d, kA), false, "Reconnaît un partage, mais pas l’écriture fractionnaire."),
        ],
      };
    },
  });

  // 9 — encadrer un entier
  Q.push({
    num: 9, domaine: "NC", competence: "Comparer et encadrer de grands nombres entiers",
    entrainement: AUTO("NC02", "Comparer des nombres"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["croissant", "decroissant"]);
      const e = officiel ? 4 : r.parmi([3, 4, 5]); // borne basse 10^e
      const bas = nb(String(10 ** e)), haut = nb(String(10 ** (e + 1)));
      // Comme sur le sujet : le nombre trop petit commence par un chiffre plus grand que le bon, le trop grand par un plus petit.
      const tire = (chiffres, premier) => String(premier) + Array.from({ length: chiffres - 1 }, () => r.entier(0, 9)).join("");
      const pj = officiel ? 8 : r.entier(3, 8);
      const juste = officiel ? "87842" : tire(e + 1, pj);
      const petit = officiel ? "9345" : tire(e, r.entier(pj + 1, 9));
      const grand = officiel ? "235412" : tire(e + 2, r.entier(2, pj - 1));
      const hors = "Ne donne pas de sens aux grands nombres : ce nombre est hors de l’intervalle.";
      return {
        forme: f,
        enonce: f === "croissant"
          ? `Choisir le nombre encadré par ${bas} et ${haut} :<br><span class="calcul">${bas} &lt; … &lt; ${haut}</span>`
          : `Choisir le nombre encadré par ${haut} et ${bas} :<br><span class="calcul">${haut} &gt; … &gt; ${bas}</span>`,
        choix: [
          c(nb(petit), false, hors),
          c(nb(juste), true),
          c(nb(grand), false, hors),
          c(nb(String(10 ** (e + 2) + 10 ** e)), false, hors),
        ],
      };
    },
  });

  // 10 — le plus petit décimal
  Q.push({
    num: 10, domaine: "NC", competence: "Comparer des nombres décimaux",
    entrainement: AUTO("NC02", "Comparer des décimaux"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["zero-aux-dixiemes", "dixiemes-non-nuls"]);
      let i = 1, t = 0, x = 8, y = 2, w = 9, z = 4, v = 3;
      if (!officiel) {
        i = r.entier(1, 7); t = f === "zero-aux-dixiemes" ? 0 : r.entier(1, 5);
        x = r.entier(1, 8); w = r.entier(x + 1, 9); y = r.entier(1, 9); z = r.entier(t + 2, 9); v = r.entier(1, 9);
      }
      return {
        forme: f,
        enonce: "Quel est le plus petit nombre parmi les suivants ?",
        choix: [
          c(`${i},${t}${x}${y}`, true),
          c(`${i},${z}`, false, "Traite la partie entière et la partie décimale comme deux nombres séparés."),
          c(`${i},${t}${w}`, false, "Comprend une décimale mais pas les suivantes."),
          c(`${i + 1},0${v}`, false, "Choisit le plus grand, ou ne compare que les parties décimales."),
        ],
      };
    },
  });

  // 11 — fraction coloriée
  Q.push({
    num: 11, domaine: "NC", competence: "Reconnaître une fraction comme partie d’une figure",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer(r, officiel) {
      // Lot EN-J : la bande du jumeau peut être coloriée par l'autre bout, ou dressée (coloriée en haut ou en bas) — les
      // parts coloriées restent d'un seul tenant, au bord, comme sur le sujet.
      const f = forme(r, officiel, ["bande-coloriee-a-gauche", "bande-coloriee-a-droite", "bande-debout-coloriee-en-haut", "bande-debout-coloriee-en-bas", "bande-parts-melangees", "disque"]);
      let n = 7, k = 3;
      if (!officiel) {
        n = r.entier(5, 9);
        do k = r.entier(2, n - 2); while (2 * k === n);
      }
      const rangs = [...Array(n).keys()];
      let coloriees = /a-droite|en-bas/.test(f) ? rangs.slice(n - k) : rangs.slice(0, k);
      if (f === "bande-parts-melangees" || f === "disque")
        do coloriees = r.melanger(rangs).slice(0, k); while (f === "bande-parts-melangees" && coloriees.every((i) => i < k));
      return {
        forme: f,
        enonce: "On a colorié les … de la figure.",
        figure: f === "disque" ? disqueColorie(n, coloriees) : bandeColoriee(n, coloriees, /^bande-debout/.test(f)),
        choix: [
          c(frac(k, n - k), false, "Compare la partie coloriée à la partie non coloriée, pas au tout."),
          c(frac(k, n), true),
          c(frac(n - k, n - k), false, "Ne comprend pas l’idée de proportion."),
          c(frac(n - k, n), false, "Donne la partie non coloriée."),
        ],
      };
    },
  });

  // 12 — complément à la dizaine
  Q.push({
    num: 12, domaine: "NC", competence: "Compléter à la dizaine supérieure",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["nombre-plus-trou", "trou-plus-nombre", "soustraction"]);
      const a = officiel ? 433 : r.entier(10, 98) * 10 + r.entier(3, 7);
      const rep = 10 - (a % 10), A = nb(String(a)), B = nb(String(a + rep));
      const calcul = f === "nombre-plus-trou" ? `${A} + … = ${B}` : f === "trou-plus-nombre" ? `… + ${A} = ${B}` : `${B} − ${A} = …`;
      return {
        forme: f,
        enonce: (f === "soustraction" ? "Quel est le résultat de ce calcul ?" : "Quel nombre permet de compléter l’égalité pour qu’elle soit vraie ?") + `<br><span class="calcul">${calcul}</span>`,
        choix: [
          c(String(rep + 1), false, `Compte de ${A} jusqu’à ${B} en comptant aussi ${A} : un de trop.`),
          c(String(rep - 1), false, "Se trompe dans le calcul."),
          c(String(rep), true),
          c(String(rep - 2), false, "Se trompe dans le calcul."),
        ],
      };
    },
  });

  // 13 — moitié d'un décimal
  Q.push({
    num: 13, domaine: "NC", competence: "Calculer la moitié d’un nombre décimal",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["dix-centiemes", "autres-centiemes"]);
      const a = officiel ? 8 : r.parmi([2, 4, 6, 8, 10, 12, 14, 16, 18]);
      const d = f === "dix-centiemes" ? 10 : r.parmi([12, 14, 16, 18]); // partie décimale, en centièmes
      const h = a / 2, m = d / 2;
      return {
        forme: f,
        enonce: `La moitié de ${a},${d} est…`,
        choix: [
          c(`${h},${2 * d}`, false, "Confond moitié et double (pour la partie décimale)."),
          c(`${h},${m}0`, false, "Choisit une écriture de même forme, sans erreur typique."),
          c(`${h},0${m}`, true),
          c(`${h},${m}`, false, "Lit le nombre décimal comme deux entiers juxtaposés."),
        ],
      };
    },
  });

  // 14 — × 10 (× 100, × 1 000)
  Q.push({
    num: 14, domaine: "NC", competence: "Multiplier un nombre décimal par 10, 100 ou 1 000",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["fois-10", "fois-100", "fois-1000", "fois-10-devant", "fois-100-devant", "fois-1000-devant"]);
      const p = /1000/.test(f) ? 3 : /100/.test(f) ? 2 : 1, F = nb(String(10 ** p));
      const t = officiel ? "754,82" : `${r.entier(1, 9)}${r.entier(0, 9)}${r.entier(1, 9)},${r.entier(1, 9)}${r.entier(1, 9)}`;
      const og = "N’a pas le sens de l’ordre de grandeur.";
      return {
        forme: f,
        enonce: `Calculer mentalement la multiplication suivante :<br><span class="calcul">${/devant/.test(f) ? `${F} × ${t}` : `${t} × ${F}`} = …</span>`,
        choix: [
          c(nb(decaler(t, -p - 1)), false, og),
          c(nb(decaler(t, -p)), false, "Décale la virgule dans le mauvais sens."),
          c(nb(decaler(t, p)), true),
          c(nb(decaler(t, p + 1)), false, og),
        ],
      };
    },
  });

  // 15 — décimal × entier
  Q.push({
    num: 15, domaine: "NC", competence: "Multiplier un nombre décimal par un entier",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["fois-5", "virgule-5", "fois-5-entier-devant", "virgule-5-entier-devant"]);
      let a = 3, b = 4, k = 5;
      if (!officiel) {
        a = r.entier(2, 9);
        if (/^fois-5/.test(f)) { k = 5; b = r.parmi([2, 4, 6, 8]); } else { b = 5; k = r.parmi([2, 4, 6, 8]); }
      }
      const j = (b * k) / 10, total = a * k + j;
      return {
        forme: f,
        enonce: `Voici un calcul :<br><span class="calcul">${/devant/.test(f) ? `${k} × ${a},${b}` : `${a},${b} × ${k}`} =</span><br>Quel est le résultat de ce calcul ?`,
        choix: [
          c(nb(decaler(String(total), -1)), false, "Multiplie correctement mais place mal la virgule, sans contrôler l’ordre de grandeur."),
          c(`${a * k},${j}`, false, "Multiplie séparément la partie entière et la partie décimale."),
          c(String(total), true),
          c(`${a * k}${j},0`, false, "Multiplie chaque partie séparément puis colle les résultats."),
        ],
      };
    },
  });

  // 16 — unité de longueur
  const LONGUEURS = [
    ["Une coccinelle peut mesurer", "7", "mm"], ["Une fourmi peut mesurer", "4", "mm"], ["Un grain de riz mesure environ", "6", "mm"],
    ["Un stylo mesure environ", "14", "cm"], ["Une gomme mesure environ", "5", "cm"], ["Un téléphone mesure environ", "15", "cm"],
    ["Une porte mesure environ", "2", "m"], ["Un bus mesure environ", "12", "m"], ["Une girafe peut mesurer", "5", "m"],
  ];
  Q.push({
    num: 16, domaine: "GM", competence: "Choisir l’unité de longueur adaptée",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["unite", "mesure"]);
      const [debut, val, unite] = officiel ? LONGUEURS[0] : r.parmi(LONGUEURS);
      return {
        forme: f,
        enonce: f === "unite" ? `Compléter avec l’unité qui convient.<br>${debut} ${val}…` : `Choisir la mesure qui convient.<br>${debut}…`,
        choix: ["mm", "cm", "m", "dm"].map((u) => c(f === "unite" ? u : `${val} ${u}`, u === unite, "N’a pas le sens de l’ordre de grandeur.")),
      };
    },
  });

  // 17 — périmètre d'un rectangle quadrillé
  Q.push({
    num: 17, domaine: "GM", competence: "Calculer le périmètre d’un rectangle sur quadrillage",
    entrainement: AUTO("EG08", "Périmètres"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["debout", "couche"]);
      let L = 4, H = 7;
      if (!officiel)
        do { const a = r.entier(2, 5), b = r.entier(4, 8); [L, H] = f === "debout" ? [a, b] : [b, a]; }
        while (L === H || L * H === 2 * (L + H) || L * H === 2 * (L + H) - 4 || L + H + 3 === L * H);
      const p = 2 * (L + H);
      const coherence = L + H + 3 === p - 4 || L + H + 3 === p ? L + H : L + H + 3;
      const vals = [[p - 4, "Compte les carreaux le long du bord intérieur."], [p, ""], [L * H, "Confond aire et périmètre."], [coherence, "Choisit une valeur sans lien avec une erreur typique."]];
      vals.sort((x, y) => x[0] - y[0]);
      return {
        forme: f,
        enonce: "Un rectangle est dessiné sur un quadrillage. Dans ce quadrillage, chaque carreau mesure 1 cm de côté.<br><strong>Quel est le périmètre, en centimètre, de ce rectangle ?</strong>",
        figure: rectangleQuadrille(L, H, false),
        choix: vals.map(([v, e]) => c(`${v} cm`, v === p, e)),
      };
    },
  });

  // 18 — rapport entre deux unités
  const SERIES = [["m", "dm", "cm", "mm"], ["g", "dg", "cg", "mg"], ["L", "dL", "cL", "mL"], ["km", "hm", "dam", "m"]];
  Q.push({
    num: 18, domaine: "GM", competence: "Connaître les rapports entre unités de mesure",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["fois-plus-grand", "fois-plus-petit", "combien-faut-il"]);
      let a = "m", b = "dm", ecart = 1;
      if (!officiel) {
        const s = r.parmi(SERIES), i = r.entier(0, 2);
        ecart = r.suivant() < 0.6 ? 1 : r.entier(1, 3 - i);
        a = s[i]; b = s[i + ecart];
      }
      const question = f === "fois-plus-grand" ? `1 ${a} c’est combien de fois plus grand que 1 ${b} ?`
        : f === "fois-plus-petit" ? `1 ${b} c’est combien de fois plus petit que 1 ${a} ?` : `Combien faut-il de ${b} pour faire 1 ${a} ?`;
      return {
        forme: f,
        enonce: `Le professeur demande à un élève : « ${question} »`,
        choix: [10, 100, 1000, 10000].map((v) => c(f === "combien-faut-il" ? nb(String(v)) : `${nb(String(v))} fois`, v === 10 ** ecart, "Ne comprend pas le lien entre les unités.")),
      };
    },
  });

  // 19 — conversion vers l'unité voisine (plus petite, ou plus grande)
  const PAIRES = [["cm", "mm"], ["dm", "cm"], ["m", "dm"], ["L", "dL"], ["g", "dg"]];
  Q.push({
    num: 19, domaine: "GM", competence: "Convertir une longueur dans l’unité voisine",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer(r, officiel) {
      const f = forme(r, officiel, ["vers-unite-plus-petite", "vers-unite-plus-grande"]);
      const [u, v] = officiel ? PAIRES[0] : r.parmi(PAIRES.slice(0, 3));
      if (f === "vers-unite-plus-grande") {
        let m;
        do m = r.entier(12, 98); while (m % 10 === 0);
        const t = String(10 * m);
        return {
          forme: f,
          enonce: `Compléter l’égalité : <span class="calcul">${t} ${v} = … ${u}</span>`,
          choix: [
            c(nb(decaler(t, -2)), false, "Ne comprend pas le lien entre les unités ni l’écriture décimale."),
            c(nb(decaler(t, -1)), true),
            c(nb(decaler(t, 1)), false, "Connaît le facteur 10 mais l’applique dans le mauvais sens."),
            c(nb(decaler(t, 2)), false, "Ne comprend pas le lien entre les unités."),
          ],
        };
      }
      const n = officiel ? 24 : r.entier(12, 98);
      const t = String(n);
      return {
        forme: f,
        enonce: `Compléter l’égalité : <span class="calcul">${n} ${u} = … ${v}</span>`,
        choix: [c(nb(decaler(t, -2)), false, "Ne comprend pas le lien entre les unités ni l’écriture décimale."), c(nb(decaler(t, -1)), false, "Connaît le facteur 10 mais l’applique dans le mauvais sens."), c(nb(decaler(t, 1)), true), c(nb(decaler(t, 2)), false, "Ne comprend pas le lien entre les unités.")],
      };
    },
  });

  // 20 — aire d'un carré quadrillé (quadrillage serré autour du carré, ou plus grand)
  Q.push({
    num: 20, domaine: "GM", competence: "Déterminer l’aire d’un carré sur quadrillage",
    entrainement: AUTO("EG09", "Aires"), disposition: "ligne",
    generer(r, officiel) {
      const f = forme(r, officiel, ["quadrillage-serre", "quadrillage-large"]);
      const cote = officiel ? 3 : r.parmi([3, 6, 7, 8]);
      let marges;
      if (f === "quadrillage-large") { const g = r.entier(1, 3), h = r.entier(1, 2); marges = { g, d: 4 - g, h, b: 3 - h }; }
      const vals = [[cote * (cote - 1), "Applique « côté × côté » de façon erronée."], [cote * cote, ""], [4 * cote, "Donne le périmètre en longueurs de carreau."], [cote * (cote + 2), "Choisit une valeur sans lien avec une erreur typique."]];
      vals.sort((x, y) => x[0] - y[0]);
      return {
        forme: f,
        enonce: "Un carré est dessiné sur un quadrillage. Chaque carreau de ce quadrillage fait 1 cm de côté.<br><strong>Quelle est l’aire de ce carré en cm² ?</strong>",
        figure: rectangleQuadrille(cote, cote, true, marges),
        choix: vals.map(([v, e]) => c(`${v} cm²`, v === cote * cote, e)),
      };
    },
  });

  // 21 — volume d'un pavé de cubes
  Q.push({
    num: 21, domaine: "GM", competence: "Déterminer le volume d’un pavé droit formé de cubes",
    entrainement: AUTO("EG20", "Vues et assemblages de cubes"), disposition: "ligne",
    generer(r, officiel) {
      const f = forme(r, officiel, ["une-couche-cote-a-droite", "une-couche-cote-a-gauche", "deux-couches-cote-a-droite", "deux-couches-cote-a-gauche"]);
      let L = 5, l = 4, h = 1;
      // Les pièges de la DEPP : face verte seule ; faces verte et rouge ; faces verte et bleue.
      const pieges = () => [[l * h, "Compte seulement les cubes de la face verte."], [l * h + L * h, "Compte les cubes des faces verte et rouge."], [l * h + L * l, "Compte les cubes des faces verte et bleue."]];
      if (!officiel)
        do { h = /^une/.test(f) ? 1 : 2; L = r.entier(3, 6); l = r.entier(2, 4); } while (L === l || new Set([L * l * h, ...pieges().map((x) => x[0])]).size < 4);
      const V = L * l * h;
      const vals = [[V, ""], ...pieges()];
      vals.sort((x, y) => x[0] - y[0]);
      return {
        forme: f,
        enonce: "Le pavé droit ci-dessous est composé de petits cubes de 1 cm³.<br><strong>Quel est le volume de ce pavé droit ?</strong>",
        figure: paveCubes(L, l, h, /gauche/.test(f)),
        choix: vals.map(([v, e]) => c(`${v} cm³`, v === V, e)),
      };
    },
  });

  // 22 — comparer deux angles
  Q.push({
    num: 22, domaine: "GM", competence: "Comparer deux angles indépendamment de la longueur de leurs côtés",
    entrainement: AUTO("EG06", "Angles et configurations"), disposition: "ligne",
    generer(r, officiel) {
      const f = forme(r, officiel, ["egaux-vers-la-gauche", "egaux-vers-la-droite", "courts-plus-ouverts-vers-la-gauche", "courts-plus-ouverts-vers-la-droite"]);
      const sens = /gauche/.test(f) ? -1 : 1;
      // longs = côtés longs ; courts = côtés courts. Égaux, ou bien l'angle aux côtés courts est le plus ouvert.
      let longs = { p: 4, q: 2, horiz: 3 }, courts = { p: 2, q: 1, horiz: 3 };
      let longEnPremier = true;
      if (!officiel) {
        if (/^egaux/.test(f)) {
          const m = r.parmi([[2, 1], [1, 1], [3, 1]]);
          longs = { p: m[0] * 2, q: m[1] * 2, horiz: r.entier(4, 5) };
          courts = { p: m[0], q: m[1], horiz: r.entier(2, 3) };
          if (longs.p > 6) longs = { p: 6, q: 2, horiz: 5 };
        } else {
          longs = r.parmi([{ p: 6, q: 1, horiz: 5 }, { p: 5, q: 1, horiz: 5 }, { p: 6, q: 2, horiz: 5 }]);
          courts = r.parmi([{ p: 2, q: 2, horiz: 2 }, { p: 1, q: 1, horiz: 2 }, { p: 2, q: 1, horiz: 2 }, { p: 1, q: 2, horiz: 2 }]);
        }
        longEnPremier = r.suivant() < 0.6;
      }
      const a1 = longEnPremier ? longs : courts, a2 = longEnPremier ? courts : longs;
      const l1 = Math.max(a1.p, a1.horiz), l2 = Math.max(a2.p, a2.horiz);
      const s1 = officiel ? 6 : sens < 0 ? l1 + 1 : 1;
      const s2 = officiel ? 12 : sens < 0 ? s1 + l2 + 2 : s1 + l1 + 2;
      const t1 = Math.atan2(a1.q, a1.p), t2 = Math.atan2(a2.q, a2.p);
      const egal = Math.abs(t1 - t2) < 1e-9;
      const juste = egal ? 0 : t1 > t2 ? 1 : 2;
      const B = ang("B"), E = ang("E");
      const nw = (t) => `<span class="insecable">${t}</span>`;
      const textes = [`Les angles ${B} et ${nw(E + " sont")} égaux.`, `L’angle ${B} est plus grand que ${nw("l’angle " + E + ".")}`, `L’angle ${B} est plus petit que ${nw("l’angle " + E + ".")}`, "On ne peut pas savoir."];
      // Le choix « B plus grand » (1) ou « B plus petit » (2) qui désigne l'angle aux côtés les plus longs.
      const longsPlusGrand = longEnPremier ? 1 : 2;
      const erreurs = [
        "Ne compare pas les ouvertures : les deux angles « se ressemblent ».",
        longsPlusGrand === 1 ? "Compare la longueur des côtés au lieu de l’ouverture." : "Compare des longueurs de côtés au lieu de l’ouverture.",
        longsPlusGrand === 2 ? "Compare la longueur des côtés au lieu de l’ouverture." : "Compare des longueurs de côtés au lieu de l’ouverture.",
        "Ne sait pas comparer des angles sans les mesurer ou les manipuler.",
      ];
      return {
        forme: f,
        enonce: `Louis a tracé deux angles ${B} et ${E}. Il souhaite les comparer.`,
        figure: deuxAngles({ ...a1, sommet: s1 }, { ...a2, sommet: s2 }, sens),
        choix: textes.map((t, i) => c(t, i === juste, erreurs[i])),
      };
    },
  });

  // 23 — unité de masse
  const MASSES = [
    ["Une balle de tennis de table pèse", "2,7", "g"], ["Une pièce de 1 euro pèse", "7,5", "g"], ["Une feuille de papier pèse", "5", "g"],
    ["Un paquet de sucre pèse", "1", "kg"], ["Un chat pèse", "4", "kg"], ["Une pastèque pèse", "6", "kg"], ["Une pomme pèse", "150", "g"],
  ];
  Q.push({
    num: 23, domaine: "GM", competence: "Choisir l’unité de masse adaptée",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"), disposition: "ligne",
    generer(r, officiel) {
      const f = forme(r, officiel, ["unite", "mesure"]);
      const [debut, val, unite] = officiel ? MASSES[0] : r.parmi(MASSES);
      return {
        forme: f,
        enonce: f === "unite" ? `${debut} ${val}…` : `Choisir la mesure qui convient.<br>${debut}…`,
        choix: [["kg", "kilogrammes (kg)"], ["g", "grammes (g)"], ["mm", "millimètres (mm)"], ["cL", "centilitres (cL)"]].map(([u, t]) =>
          c(f === "unite" ? t : `${val} ${u}`, u === unite, u === "mm" || u === "cL" ? "Ne relie pas la masse à une unité de masse." : "Choisit bien une unité de masse, mais pas le bon ordre de grandeur.")),
      };
    },
  });

  // Lot EN10 (décidé avec Gwenaël le 14/11) : les formes qui ne sont PAS des jumeaux stricts (autre cas, autre sens, autre
  // écriture, autre difficulté, ou bonne réponse d'une autre nature). Rien n'est supprimé : elles restent dans `generer`
  // pour la banque par compétence ; le jumeau (EN.genererJumeau) les écarte. Le sujet officiel ne passe jamais par ici.
  // Lot EN-J (revue de Codex du 15/11) : une autre écriture de même difficulté (autre tournure, autre ordre des termes) et
  // une bonne réponse qui est une catégorie (nature d'un triangle, oui ou non, égaux ou pas) reviennent dans le jumeau.
  const HORS_STRICT = {
    1: { formes: ["unites-deux-chiffres"], pourquoi: "92 063 n'a qu'un zéro intercalé (76 004 en a deux) : plus facile" },
    2: { formes: ["centiemes-un-chiffre", "milliemes-un-chiffre"], pourquoi: "« sept centièmes », « six millièmes » : autre rang ou deux zéros" },
    4: { formes: ["centiemes-deux-chiffres", "milliemes"], pourquoi: "73/100 n'a pas de zéro après la virgule ; 6/1000 en a deux" },
    6: { formes: ["dizaines-de-millions", "centaines-de-mille"], pourquoi: "autre ordre de grandeur sur la droite" },
    8: { formes: ["plusieurs-graduations-apres-1"], pourquoi: "la droite continue après 1 : plus dur" },
    10: { formes: ["dixiemes-non-nuls"], pourquoi: "le sujet a un 0 aux dixièmes (1,082) : c'est lui qui fait le piège" },
    11: { formes: ["disque", "bande-parts-melangees"], pourquoi: "parts mêlées ou disque : plus dur que la bande coloriée à gauche" },
    12: { formes: ["soustraction"], pourquoi: "730 − 727 : soustraction au lieu d'un complément" },
    13: { formes: ["autres-centiemes"], pourquoi: "10,18 ÷ 2 : le piège « 8,10 lu 8 et 10 » change" },
    14: { formes: ["fois-100", "fois-100-devant", "fois-1000", "fois-1000-devant"], pourquoi: "× 100 et × 1 000 : autre cas de la compétence" },
    15: { formes: ["virgule-5", "virgule-5-entier-devant"], pourquoi: "7,5 × 2 : autre cas" },
    16: { formes: ["mesure"], pourquoi: "on choisit la mesure, pas l'unité" },
    18: { formes: ["combien-faut-il", "fois-plus-petit"], pourquoi: "autre sens ou autre tournure" },
    19: { formes: ["vers-unite-plus-grande"], pourquoi: "conversion dans l'autre sens" },
    21: { formes: ["deux-couches-cote-a-gauche", "deux-couches-cote-a-droite"], pourquoi: "deux couches de cubes : plus dur" },
    23: { formes: ["mesure"], pourquoi: "on choisit la mesure, pas l'unité" },
  };

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["6e-automatismes"] = {
    id: "6e-automatismes",
    niveau: "6e",
    titre: "Automatismes",
    annee: 2026,
    source: "DEPP — Évaluation nationale de début de sixième, septembre 2024, 2025 et 2026 (test spécifique « Automatismes »), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/evaluations-nationales-6e",
    consignes: "Sans calculatrice. Pour chaque question, une seule réponse est juste.",
    domaines: { NC: "Nombres et calculs", GM: "Grandeurs et mesures" },
    // Groupes de maîtrise publiés par la DEPP pour ce test (sur 23).
    seuils: [{ max: 6, nom: "À besoins" }, { max: 12, nom: "Fragile" }, { max: 23, nom: "Satisfaisant" }],
    // Le même sujet est tombé en 2024, 2025 et 2026 (PDF Eduscol comparés : mêmes questions, réponses, figures et repères).
    officiels: [{ cle: "2026", annee: 2026, titre: "Le sujet officiel", detail: "Les vraies questions. Le même sujet est tombé en 2024, 2025 et 2026." }],
    questions: Q,
    horsStrict: HORS_STRICT,
  };
})(typeof window !== "undefined" ? window : globalThis);
