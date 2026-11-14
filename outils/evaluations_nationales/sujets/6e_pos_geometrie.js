/* maths&go — Outil de positionnement de 6e, « Espace et géométrie » (bibliothèque d'outils de positionnement, Eduscol).
   Source : https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants
   — licence Etalab 2.0. 14 questions, attendus de fin de CM2, repères de la notice ≤ 5 / 6 à 8 / ≥ 9. Sans calculatrice.
   Lot EN5a : le test officiel seulement, à l'identique (énoncés, réponses dans l'ordre de l'outil, figures redessinées en
   gardant les mesures de l'outil). Bonnes réponses : celles du corrigé Eduscol. Eduscol ne publie pas d'analyse des pièges
   pour cet outil : les explications de la vue prof sont écrites par maths&go (sans mot genré) et restent à relire. */
(function (racine) {
  "use strict";
  const { svg, COUL } = racine.EN;

  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const officielle = (contenu) => () => Object.assign({ melange: false }, contenu);
  const AUTO = (notion, libelle) => ({ appli: "Automatismes", notion, libelle, url: `/automatismes/?notions=${notion}&nombre=8` });
  // « ci-contre » sur ordinateur (la figure est à côté), « ci-dessous » au téléphone (la figure passe dessous).
  const CI = '<span class="mot-ordi insecable">ci-contre</span><span class="mot-tel insecable">ci-dessous</span>';

  // ---------- Petits outils de dessin ----------
  const NOIR = "#111", GRIS_FOND = "#e2e4e7", GRILLE = "#cfd5db", GRILLE_FINE = "#e8ecef";
  const f1 = (v) => +v.toFixed(1);
  const pts = (P) => P.map((p) => `${f1(p[0])},${f1(p[1])}`).join(" ");
  const seg = (A, B, l = 2, coul = NOIR, tirets) => `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}" stroke="${coul}" stroke-width="${l}"${tirets ? ` stroke-dasharray="${tirets}"` : ""} stroke-linecap="round"/>`;
  const poly = (P, fill = "none", l = 2) => `<polygon points="${pts(P)}" fill="${fill}" stroke="${NOIR}" stroke-width="${l}" stroke-linejoin="round"/>`;
  const txt = (x, y, t, taille = 15, ancre = "middle", gras) => `<text x="${f1(x)}" y="${f1(y)}" font-size="${taille}" text-anchor="${ancre}"${gras ? ' font-weight="700"' : ""} fill="${NOIR}">${t}</text>`;
  const milieu = (A, B) => [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const unit = (v) => { const n = Math.hypot(v[0], v[1]); return [v[0] / n, v[1] / n]; };
  // Codage d'un segment : n petits traits au milieu (1 : « | », 2 : « // »), ou un petit rond.
  function codage(A, B, n, rond, t = 1) {
    const M = milieu(A, B), u = unit([B[0] - A[0], B[1] - A[1]]), v = [-u[1], u[0]];
    if (rond) return `<circle cx="${f1(M[0])}" cy="${f1(M[1])}" r="${f1(4.5 * t)}" fill="#fff" stroke="${NOIR}" stroke-width="${f1(1.4 * t)}"/>`;
    let s = "";
    for (let k = 0; k < n; k++) {
      const d = (k - (n - 1) / 2) * 5 * t, C = [M[0] + u[0] * d, M[1] + u[1] * d];
      s += seg([C[0] - v[0] * 8 * t - u[0] * 2 * t, C[1] - v[1] * 8 * t - u[1] * 2 * t], [C[0] + v[0] * 8 * t + u[0] * 2 * t, C[1] + v[1] * 8 * t + u[1] * 2 * t], 1.6 * t);
    }
    return s;
  }
  // Petit carré d'angle droit au sommet S, côtés vers P et Q (t : taille).
  function angleDroit(S, P, Q, t = 11, fill = "none") {
    const u = unit([P[0] - S[0], P[1] - S[1]]), w = unit([Q[0] - S[0], Q[1] - S[1]]);
    const a = [S[0] + u[0] * t, S[1] + u[1] * t], b = [a[0] + w[0] * t, a[1] + w[1] * t], d = [S[0] + w[0] * t, S[1] + w[1] * t];
    return `<polygon points="${pts([S, a, b, d])}" fill="${fill}" stroke="${NOIR}" stroke-width="1.2"/>`;
  }
  // Quadrillage sur toute la figure : lignes tous les `pas` à partir de (ox, oy), lignes fines tous les `pas / fin`.
  function grille(W, H, ox, oy, pas, fin) {
    let s = "";
    const lignes = (p, coul, l) => {
      for (let x = ox - Math.floor(ox / p) * p; x <= W + 0.01; x += p) s += `<line x1="${f1(x)}" y1="0" x2="${f1(x)}" y2="${H}" stroke="${coul}" stroke-width="${l}"/>`;
      for (let y = oy - Math.floor(oy / p) * p; y <= H + 0.01; y += p) s += `<line x1="0" y1="${f1(y)}" x2="${W}" y2="${f1(y)}" stroke="${coul}" stroke-width="${l}"/>`;
    };
    if (fin) lignes(pas / fin, GRILLE_FINE, 0.8);
    lignes(pas, GRILLE, 1.1);
    return s;
  }
  // Symétrique d'un point par rapport à la droite (D1 D2).
  function reflet(P, D1, D2) {
    const u = unit([D2[0] - D1[0], D2[1] - D1[1]]), w = [P[0] - D1[0], P[1] - D1[1]];
    const k = w[0] * u[0] + w[1] * u[1], H = [D1[0] + k * u[0], D1[1] + k * u[1]];
    return [2 * H[0] - P[0], 2 * H[1] - P[1]];
  }

  // ---------- Figures ----------
  // Q1 : rectangle ABCD (350 × 200) et le segment [DE], E milieu de [BC].
  const Q1 = { A: [40, 236], B: [390, 236], C: [390, 36], D: [40, 36] };
  Q1.E = milieu(Q1.B, Q1.C);
  function figureQ1() {
    const { A, B, C, D, E } = Q1;
    const s = poly([A, B, C, D]) + seg(D, E) +
      txt(A[0] - 12, A[1] + 18, "A", 18) + txt(B[0] + 12, B[1] + 18, "B", 18) + txt(C[0] + 12, C[1] - 8, "C", 18) +
      txt(D[0] - 12, D[1] - 8, "D", 18) + txt(E[0] + 16, E[1] + 6, "E", 18);
    return svg(430, 262, s, "Rectangle ABCD ; E est le milieu de [BC] ; le segment [DE] est tracé", 380).replace('class="figure"', 'class="figure grande"');
  }

  // Q3 : rectangle ABCD (côtés DC et AB codés pareil), F milieu de [BC], la droite (EF) perpendiculaire à (BC), EC = EB.
  const Q3 = { A: [30, 236], B: [230, 236], C: [230, 36], D: [30, 36], E: [480, 136] };
  Q3.F = milieu(Q3.B, Q3.C);
  function figureQ3() {
    const { A, B, C, D, E, F } = Q3;
    const gris = "#d9dde2";
    let s = angleDroit(A, B, D, 20, gris) + angleDroit(B, C, A, 20, gris) + angleDroit(C, D, B, 20, gris) + angleDroit(D, A, C, 20, gris) + angleDroit(F, C, E, 20, gris);
    s += poly([A, B, C, D], "none", 1.6) + seg([12, F[1]], [E[0] + 16, F[1]], 1.4) + seg(C, E, 1.6) + seg(B, E, 1.6);
    s += codage(D, C, 2, false, 1.3) + codage(A, B, 2, false, 1.3) + codage(C, E, 0, true, 1.3) + codage(B, E, 0, true, 1.3);
    s += txt(D[0] - 8, D[1] - 8, "D", 21) + txt(C[0] + 4, C[1] - 8, "C", 21, "start") + txt(A[0] - 8, A[1] + 22, "A", 21) +
      txt(B[0] + 4, B[1] + 22, "B", 21, "start") + txt(F[0] + 6, F[1] + 22, "F", 21, "start") + txt(E[0] + 2, E[1] - 12, "E", 21);
    return svg(510, 272, s, "Rectangle ABCD, F milieu de [BC], la droite passant par F perpendiculaire à (BC), et le point E avec EB = EC", 420).replace('class="figure"', 'class="figure grande"');
  }

  // Q4 : quatre productions sur quadrillage, chacune avec la droite (f). Coordonnées relevées sur l'outil.
  const PRODUCTIONS = [
    { // 1 : vraie symétrie axiale (le second polygone est calculé).
      W: 507, H: 354, ox: 0, oy: 0, pas: 46, axe: [[160, 0], [318, 354]], f: [199, 58], titre: [494, 32],
      gauche: [[184, 91], [185, 229], [255, 248], [115, 318], [46, 229]], droite: null,
    },
    { // 2 : translation (même forme, même sens, décalée).
      W: 614, H: 289, ox: 40, oy: 52, pas: 65, axe: [[237, 0], [367, 289]], f: [262, 30], titre: [602, 32],
      gauche: [[40, 118], [105, 52], [235, 52], [235, 248], [105, 248], [40, 182]], decalage: 325,
    },
    { // 3 : symétrie centrale (demi-tour), pas axiale.
      W: 834, H: 355, ox: 25, oy: 0, pas: 76, axe: [[316, 0], [478, 355]], f: [354, 60], titre: [818, 44],
      gauche: [[25, 152], [177, 76], [329, 152], [177, 152], [253, 228], [329, 228], [329, 304], [100, 228]], centre: [406.5, 190],
    },
    { // 4 : un autre triangle, ni symétrique ni superposable par la droite.
      W: 663, H: 442, ox: 56, oy: 1, pas: 55, axe: [[316, 0], [410, 442]], f: [338, 34], titre: [648, 40],
      gauche: [[56, 276], [221, 111], [276, 276]], droite: [[432, 315], [559, 195], [628, 419]],
    },
  ];
  for (const p of PRODUCTIONS) {
    if (p.decalage) p.droite = p.gauche.map(([x, y]) => [x + p.decalage, y]);
    else if (p.centre) p.droite = p.gauche.map(([x, y]) => [2 * p.centre[0] - x, 2 * p.centre[1] - y]);
    else if (!p.droite) p.droite = p.gauche.map((P) => reflet(P, p.axe[0], p.axe[1]));
  }
  function production(k) {
    const p = PRODUCTIONS[k];
    let s = `<rect width="${p.W}" height="${p.H}" fill="#fff"/>` + grille(p.W, p.H, p.ox, p.oy, p.pas, 5);
    s += poly(p.gauche, GRIS_FOND, 2.4) + poly(p.droite, GRIS_FOND, 2.4) + seg(p.axe[0], p.axe[1], 4.5, "#333");
    // Les productions n'ont pas la même taille : les textes suivent, pour s'afficher pareil dans les quatre cases.
    const e = Math.max(p.H, p.W / 1.8);
    s += txt(p.f[0], p.f[1], "(f)", f1(0.062 * e), "start") + txt(p.titre[0], p.titre[1], `Production ${k + 1}`, f1(0.074 * e), "end", true);
    return `<svg class="fig-choix" viewBox="0 0 ${p.W} ${p.H}" role="img" aria-label="Production ${k + 1} : deux polygones de part et d’autre de la droite (f)" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  }

  // Q5 : deux pyramides à base carrée collées par leur base (octaèdre) : 6 sommets, 12 arêtes, dont 4 cachées.
  const SOLIDE = {
    S: { haut: [314, 8], gauche: [10, 192], droite: [480, 306], bas: [192, 476], avant: [276, 316], arriere: [234, 208] },
    vues: [["haut", "gauche"], ["haut", "droite"], ["haut", "avant"], ["gauche", "bas"], ["droite", "bas"], ["avant", "bas"], ["gauche", "avant"], ["avant", "droite"]],
    cachees: [["haut", "arriere"], ["arriere", "bas"], ["gauche", "arriere"], ["arriere", "droite"]],
  };
  function figureSolide() {
    const { S, vues, cachees } = SOLIDE;
    const s = cachees.map(([a, b]) => seg(S[a], S[b], 3, NOIR, "9 7")).join("") + vues.map(([a, b]) => seg(S[a], S[b], 5)).join("");
    return svg(490, 484, s, "Solide formé de deux pyramides à base carrée collées par leur base ; les arêtes cachées sont en pointillés", 230);
  }

  // Q6 : un carré gris partagé par ses deux diagonales, dans un grand carré posé sur la pointe (sommets aux milieux).
  const CARRES = { O: [163, 162], R: 156 };
  function figureCarres() {
    const { O, R } = CARRES, h = R / 2;
    const grand = [[O[0], O[1] - R], [O[0] + R, O[1]], [O[0], O[1] + R], [O[0] - R, O[1]]];
    const petit = [[O[0] - h, O[1] - h], [O[0] + h, O[1] - h], [O[0] + h, O[1] + h], [O[0] - h, O[1] + h]];
    const s = poly(grand, "none", 2) + poly(petit, GRIS_FOND, 2.6) + seg(petit[0], petit[2], 2.6) + seg(petit[1], petit[3], 2.6);
    return svg(326, 324, s, "Un carré gris partagé par ses deux diagonales, à l’intérieur d’un grand carré posé sur la pointe dont les sommets sont au milieu de ses côtés", 200);
  }

  // Q7 : cercle de centre D ; [FG] est un diamètre, [DE] un rayon.
  const CERCLE = { D: [214, 206], r: 186, angles: { G: -25.4, F: 154.6, E: 16.4 } };
  function figureCercle() {
    const { D, r, angles } = CERCLE;
    const P = (a) => [D[0] + r * Math.cos((a * Math.PI) / 180), D[1] + r * Math.sin((a * Math.PI) / 180)];
    const croix = (Q) => seg([Q[0] - 5, Q[1] - 5], [Q[0] + 5, Q[1] + 5], 2) + seg([Q[0] - 5, Q[1] + 5], [Q[0] + 5, Q[1] - 5], 2);
    const G = P(angles.G), F = P(angles.F), E = P(angles.E);
    const s = `<circle cx="${D[0]}" cy="${D[1]}" r="${r}" fill="none" stroke="#333" stroke-width="3"/>` + seg(F, G, 2.6, "#333") + seg(D, E, 2.6, "#333") +
      croix(D) + croix(E) + croix(F) + croix(G) + txt(D[0] - 8, D[1] - 16, "D", 28) + txt(G[0] + 12, G[1] + 8, "G", 28, "start") +
      txt(E[0] + 12, E[1] + 20, "E", 28, "start") + txt(F[0] - 14, F[1] + 10, "F", 28, "end");
    return svg(460, 414, s, "Cercle de centre D ; les points E, F et G sont sur le cercle ; les segments [FG] et [DE] sont tracés", 280);
  }

  // Q8 : trois triangles A (rectangle), B (équilatéral, côtés codés //) et C (deux côtés codés |).
  const TRIANGLES = (function () {
    const P3 = [163, 312], P4 = [415, 312], P2 = [289, 312 - 126 * Math.sqrt(3)];
    const n = unit([-(P2[1] - P3[1]), P2[0] - P3[0]]); // perpendiculaire à [P3 P2], vers la gauche
    const P1 = [P3[0] - n[0] * 168, P3[1] - n[1] * 168];
    const M = milieu(P2, P4), w = unit([P4[1] - P2[1], -(P4[0] - P2[0])]);
    const P5 = [M[0] + w[0] * 290, M[1] + w[1] * 290];
    return { P1, P2, P3, P4, P5 };
  })();
  function figureTriangles() {
    const { P1, P2, P3, P4, P5 } = TRIANGLES;
    let s = poly([P1, P2, P3], "none", 1.8) + poly([P2, P3, P4], "none", 1.8) + poly([P2, P4, P5], "none", 1.8);
    s += angleDroit(P3, P1, P2, 16) + codage(P2, P3, 2, false, 1.5) + codage(P3, P4, 2, false, 1.5) + codage(P2, P4, 2, false, 1.5) + codage(P2, P5, 1, false, 1.5) + codage(P4, P5, 1, false, 1.5);
    const centre = (a, b, cc) => [(a[0] + b[0] + cc[0]) / 3, (a[1] + b[1] + cc[1]) / 3 + 6];
    const [ga, gb, gc] = [centre(P1, P2, P3), centre(P2, P3, P4), centre(P2, P4, P5)];
    s += txt(ga[0] + 6, ga[1], "A", 26, "middle", true) + txt(gb[0], gb[1] + 14, "B", 26, "middle", true) + txt(gc[0] + 6, gc[1] - 6, "C", 26, "middle", true);
    return svg(620, 340, s, "Trois triangles accolés : A a un angle droit, B a ses trois côtés codés égaux, C a deux côtés codés égaux", 460);
  }

  // Q9 : quatre patrons d'un pavé droit de 2 × 2 × 1 (unités de 34,6). Rectangles en unités : [x, y, largeur, hauteur].
  const PATRONS = [
    { nom: "Sacha", o: [8, 10], faces: [[1, 0, 2, 1], [1, 1, 2, 2], [1, 3, 2, 1], [1, 4, 2, 2], [0, 1, 1, 2], [3, 1, 1, 2]], nomPos: [2, 6.9] },
    { nom: "Lillie", o: [182, 45], faces: [[0, 0, 2, 1], [0, 1, 2, 2], [2, 1, 1, 2], [3, 1, 2, 2], [5, 1, 1, 2], [3, 3, 2, 1]], nomPos: [2.7, 4.85] },
    { nom: "Yasmine", o: [425, 11], faces: [[0, 0, 2, 1], [2, 0, 2, 1], [4, 0, 2, 1], [2, 1, 2, 2], [2, 3, 2, 1], [2, 4, 2, 2]], nomPos: [3, 6.75] },
    { nom: "Léa", o: [665, 19], faces: [[3, 0, 2, 2], [0, 2, 2, 2], [2, 2, 1, 2], [3, 2, 2, 2], [5, 2, 1, 2], [2, 4, 1, 2]], nomPos: [3.7, 5.4] },
  ];
  function figurePatrons() {
    const u = 34.6;
    const dessin = (p, ox, oy, nom) => p.faces.map(([x, y, l, h]) => `<rect x="${f1(ox + x * u)}" y="${f1(oy + y * u)}" width="${f1(l * u)}" height="${f1(h * u)}" fill="none" stroke="${NOIR}" stroke-width="2"/>`).join("") +
      txt(ox + nom[0] * u, oy + nom[1] * u, p.nom, 21);
    const large = svg(884, 272, PATRONS.map((p) => dessin(p, p.o[0], p.o[1], p.nomPos)).join(""), "Quatre patrons dessinés par Sacha, Lillie, Yasmine et Léa", 640)
      .replace('class="figure"', 'class="figure mot-ordi"');
    // Au téléphone, les mêmes patrons sur deux rangées (sinon les prénoms deviennent illisibles) : seule la place change,
    // chaque prénom est écrit sous son patron.
    let t = "";
    PATRONS.forEach((p, k) => {
      const L = Math.max(...p.faces.map(([x, , l]) => x + l)), H = Math.max(...p.faces.map(([, y, , h]) => y + h));
      const ox = (k % 2) * 240 + 12 + (216 - L * u) / 2, oy = Math.floor(k / 2) * 262 + 8;
      t += dessin(p, ox, oy, [L / 2, H + 0.75]);
    });
    const petit = svg(480, 520, t, "Quatre patrons dessinés par Sacha, Lillie, Yasmine et Léa", 480).replace('class="figure"', 'class="figure mot-tel"').replace('style="max-width:480px"', 'style="max-width:420px;max-height:none"');
    return large + petit;
  }

  // Q10 : quadrillage (carreaux de 36,25) ; F hachurée et ses quatre « réductions » G, H, I, J. Sommets en carreaux.
  const REDUCTION = {
    F: [[11, 4], [15, 4], [15, 8], [17, 8], [17, 10], [11, 10]],
    G: [[0, 3], [2, 3], [2, 5], [4, 5], [4, 7], [0, 7]],
    H: [[5, 2], [7, 2], [7, 4], [8, 4], [8, 5], [5, 5]],
    I: [[3, 8], [4, 8], [4, 9], [5, 9], [5, 10], [3, 10]],
    J: [[10, 0], [12, 0], [12, 1], [13, 1], [13, 2], [10, 2]],
    nomPos: { F: [13.3, 6.6], G: [1.5, 5.5], H: [5.95, 3.7], I: [3.6, 9.6], J: [11.2, 1.25] },
  };
  function figureReduction() {
    const p = 36.25, ox = 25, oy = 11, W = 677, H = 404, X = ([x, y]) => [ox + x * p, oy + y * p];
    let s = `<defs><clipPath id="en5-f"><polygon points="${pts(REDUCTION.F.map(X))}"/></clipPath></defs>` + grille(W, H, ox, oy, p, 0);
    for (const k of ["G", "H", "I", "J"]) s += poly(REDUCTION[k].map(X), "#d9d9d9", 1.6);
    s += poly(REDUCTION.F.map(X), "#a9a9a9", 1.6);
    let hach = "";
    for (let d = -10; d <= 12; d += 2) hach += seg(X([11 + d, 4]), X([17 + d, 10]), 1.1, "#555");
    s += `<g clip-path="url(#en5-f)">${hach}</g>`;
    for (const k of ["F", "G", "H", "I", "J"]) { const [x, y] = X(REDUCTION.nomPos[k]); s += txt(x, y + 10, k, 28); }
    return svg(W, H, s, "Quadrillage : la figure F hachurée et quatre figures G, H, I et J", 460);
  }

  // Q11 : le trajet de la voiture. Quadrillage de 4 × 6 cases ; cases grises (colonne, ligne) comptées à partir de 1.
  const TRAJET = {
    cases: [[3, 3], [3, 4], [3, 5], [4, 1], [4, 2], [4, 3]], voiture: [2, 5], maison: [3, 1],
    debut: [["avance", 1], ["gauche"], ["avance", 2], ["droite"], ["avance", 1]],
  };
  function figureTrajet() {
    const L = 84, H = 46, x0 = 3, y0 = 3, X = (col) => x0 + (col - 1) * L, Y = (lig) => y0 + (lig - 1) * H;
    let s = "";
    for (const [col, lig] of TRAJET.cases) s += `<rect x="${X(col)}" y="${Y(lig)}" width="${L}" height="${H}" fill="#7b7f84"/>`;
    for (let i = 0; i <= 4; i++) s += seg([x0 + i * L, y0], [x0 + i * L, y0 + 6 * H], 2.4, NOIR);
    for (let j = 0; j <= 6; j++) s += seg([x0, y0 + j * H], [x0 + 4 * L, y0 + j * H], 2.4, NOIR);
    // La voiture (vers la droite), au bord droit de sa case, et la maison au bord droit de la sienne.
    const vx = X(TRAJET.voiture[0]) + L - 44, vy = Y(TRAJET.voiture[1]) + 12;
    s += `<g transform="translate(${vx} ${vy})"><path d="M2 22 L4 13 Q9 5 18 4 L28 4 Q34 5 37 12 L41 14 Q43 16 42 22 Z" fill="#9aa1a8" stroke="#222" stroke-width="1.4"/>
      <path d="M12 12 Q14 7 19 7 L21 7 L21 12 Z M24 7 L28 7 Q32 8 33 12 L24 12 Z" fill="#e8eef3" stroke="#222" stroke-width="1"/>
      <circle cx="11" cy="23" r="4.6" fill="#333" stroke="#222"/><circle cx="34" cy="23" r="4.6" fill="#333" stroke="#222"/>
      <circle cx="11" cy="23" r="1.8" fill="#ccc"/><circle cx="34" cy="23" r="1.8" fill="#ccc"/></g>`;
    const mx = X(TRAJET.maison[0]) + L - 46, my = Y(TRAJET.maison[1]) + 5;
    s += `<g transform="translate(${mx} ${my})"><path d="M4 18 L22 4 L42 18 Z" fill="#555" stroke="#222" stroke-width="1.3" stroke-linejoin="round"/>
      <rect x="9" y="18" width="28" height="18" fill="#f2f2f2" stroke="#222" stroke-width="1.3"/>
      <rect x="20" y="25" width="7" height="11" fill="#555"/><rect x="11" y="22" width="6" height="5" fill="#9aa1a8"/><rect x="29" y="22" width="6" height="5" fill="#9aa1a8"/>
      <rect x="30" y="6" width="5" height="8" fill="#555"/></g>`;
    return svg(4 * L + 6, 6 * H + 6, s, "Quadrillage de 4 colonnes et 6 lignes : le trajet grisé va de la voiture à la maison", 250);
  }
  // Pour les tests : où mène une suite d'instructions (colonne, ligne, direction 0 = droite, 1 = haut, 2 = gauche, 3 = bas).
  function suivre(instructions) {
    let [col, lig] = TRAJET.voiture, dir = 0;
    const passees = [];
    for (const [ordre, n] of instructions) {
      if (ordre === "gauche") dir = (dir + 1) % 4;
      else if (ordre === "droite") dir = (dir + 3) % 4;
      else for (let i = 0; i < n; i++) { col += [1, 0, -1, 0][dir]; lig += [0, -1, 0, 1][dir]; passees.push([col, lig]); }
    }
    return { col, lig, dir, passees };
  }

  // Q12 : six droites (coordonnées relevées sur l'outil).
  const DROITES = {
    j: [[44, 0], [167, 386]], k: [[330, 0], [455, 386]], i: [[0, 160], [494, 2]], h: [[0, 238], [494, 80]],
    g: [[0, 318], [494, 158]], f: [[0, 353], [494, 353]],
    noms: { j: [72, 38], k: [318, 34], i: [14, 140], h: [16, 219], g: [16, 298], f: [16, 374] },
  };
  function figureDroites() {
    let s = "";
    for (const d of ["j", "k", "i", "h", "g", "f"]) s += seg(DROITES[d][0], DROITES[d][1], 2.2, "#333");
    for (const [d, [x, y]] of Object.entries(DROITES.noms)) s += txt(x, y, d, 26, "middle");
    return svg(494, 386, s, "Six droites nommées f, g, h, i, j et k", 330);
  }

  // Q13 : quatre figures pour le programme « triangle équilatéral ABC, D milieu de [BC], perpendiculaire à (AB) passant par D ».
  // Chaque figure : A, B, C, le point D et la droite tracée. Le test vérifie que seule la figure 2 suit le programme.
  const PROGRAMMES = [
    { D: "AB", droite: "perpBC" }, // 1 : D milieu de [AB], perpendiculaire à (BC)
    { D: "BC", droite: "perpAB" }, // 2 : D milieu de [BC], perpendiculaire à (AB) — la bonne
    { D: "BC", droite: "parAB" }, // 3 : D milieu de [BC], parallèle à (AB)
    { D: "AB", droite: "perpAB" }, // 4 : D milieu de [AB], perpendiculaire à (AB) (passe par C)
  ];
  function geometrieProgramme(k, x0 = 0, y0 = 0) {
    const cote = 150, A = [x0 + 26, y0 + 150], B = [x0 + 26 + cote, y0 + 150], C = [x0 + 26 + cote / 2, y0 + 150 - (cote * Math.sqrt(3)) / 2];
    const p = PROGRAMMES[k], D = p.D === "AB" ? milieu(A, B) : milieu(B, C);
    let dir;
    if (p.droite === "perpBC") dir = unit([-(C[1] - B[1]), C[0] - B[0]]);
    else if (p.droite === "perpAB") dir = [0, 1];
    else dir = [1, 0];
    return { A, B, C, D, dir };
  }
  function figureProgrammes() {
    const Wc = 212, Hc = 210;
    let s = `<rect x="1" y="1" width="${2 * Wc}" height="${2 * Hc}" fill="#fff" stroke="${NOIR}" stroke-width="1.4"/>` +
      seg([1 + Wc, 1], [1 + Wc, 1 + 2 * Hc], 1.4) + seg([1, 1 + Hc], [1 + 2 * Wc, 1 + Hc], 1.4);
    for (let k = 0; k < 4; k++) {
      const x0 = 1 + (k % 2) * Wc, y0 = 1 + Math.floor(k / 2) * Hc;
      const { A, B, C, D, dir } = geometrieProgramme(k, x0, y0 + 14);
      const p = PROGRAMMES[k];
      s += `<polygon points="${pts([A, B, C])}" fill="#f6f6f6" stroke="${NOIR}" stroke-width="1.5"/>`;
      // La droite tracée, coupée au bord de sa case.
      const t = [-400, 400].map((m) => [D[0] + dir[0] * m, D[1] + dir[1] * m]);
      s += `<clipPath id="en5-p${k}"><rect x="${x0}" y="${y0}" width="${Wc}" height="${Hc}"/></clipPath><g clip-path="url(#en5-p${k})">${seg(t[0], t[1], 1.4)}</g>`;
      // Codages : D milieu (deux traits de chaque côté) ; côtés égaux du triangle (un trait).
      if (p.D === "AB") s += codage(A, D, 2) + codage(D, B, 2) + codage(A, C, 1) + codage(B, C, 1);
      else s += codage(C, D, 2) + codage(D, B, 2) + (k === 1 ? codage(A, C, 1) + codage(A, B, 1) : "");
      // Angle droit codé.
      if (p.droite === "perpBC") {
        const u = unit([C[0] - B[0], C[1] - B[1]]), k2 = (D[0] - B[0]) * u[0] + (D[1] - B[1]) * u[1], Hp = [B[0] + u[0] * k2, B[1] + u[1] * k2];
        s += angleDroit(Hp, B, D, 10, "#e3e6ea");
      } else if (p.droite === "perpAB") {
        const Hp = [D[0], A[1]];
        s += angleDroit(Hp, B, [D[0], D[1] - 40], 10, "#e3e6ea");
      }
      s += `<circle cx="${f1(D[0])}" cy="${f1(D[1])}" r="2" fill="${NOIR}"/>`;
      s += txt(A[0] - 4, A[1] + 17, "A", 15) + txt(B[0] + 4, B[1] + 17, "B", 15) + txt(C[0], C[1] - 7, "C", 15);
      s += p.D === "AB" ? txt(D[0] + 10, D[1] + 17, "D", 15) : txt(D[0] + 10, D[1] - 4, "D", 15, "start");
      s += txt(x0 + [Wc / 2, 74, Wc / 2, 52][k], y0 + Hc - 8, `Figure ${k + 1}`, 15, "middle", true); // jamais sur la droite tracée
    }
    return svg(2 * Wc + 2, 2 * Hc + 2, s, "Quatre figures numérotées de 1 à 4 : un triangle équilatéral ABC, un point D et une droite", 440).replace('class="figure"', 'class="figure tres-grande"');
  }

  // Q14 : quadrillage (carreaux de 31) ; A carré de 3 carreaux, B carré de 9 carreaux.
  const AGRANDI = { pas: 31, A: [0, 6, 3], B: [8, 0, 9] }; // [colonne, ligne, côté en carreaux]
  function figureAgrandi() {
    const { pas } = AGRANDI, ox = 21, oy = 19, W = 560, H = 318;
    let s = grille(W, H, ox, oy, pas, 0);
    for (const k of ["A", "B"]) {
      const [col, lig, n] = AGRANDI[k];
      s += `<rect x="${ox + col * pas}" y="${oy + lig * pas}" width="${n * pas}" height="${n * pas}" fill="${GRIS_FOND}" fill-opacity=".85" stroke="#444" stroke-width="2.4"/>`;
      s += txt(ox + (col + n / 2) * pas, oy + (lig + n / 2) * pas + 10, k, 28, "middle", true);
    }
    return svg(W, H, s, "Quadrillage : un petit carré A et un grand carré B", 460);
  }

  const Q = [];

  Q.push({
    num: 1, domaine: "EG", competence: "Compléter un programme de construction à partir d’une figure",
    generer: () => ({
      melange: false, figureACote: true, disposition: "ligne",
      enonce: `Un programme de construction de la figure ${CI} est en partie rédigé, il manque la troisième étape.<br><span class="programme">1. Tracer un rectangle ABCD.<br>2. Placer le point E au milieu du segment [BC].<br>3. …</span>`,
      apres: "<strong>Quelle est la troisième étape ?</strong>",
      figure: figureQ1(),
      choix: [
        c("Tracer le segment [CE].", false, "Repère le point E mais pas le segment ajouté : [CE] est déjà un morceau du rectangle."),
        c("Tracer le segment [AE].", false, "Lit mal les noms des sommets du rectangle (confond A et D)."),
        c("Tracer le segment [DE].", true),
        c("Tracer le segment [EB].", false, "Repère le point E mais pas le segment ajouté : [EB] est déjà un morceau du rectangle."),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "EG", competence: "Reconnaître un quadrilatère à partir d’une description (losange)",
    generer: officielle({
      enonce: "ABCD est un polygone à quatre côtés de longueur égale.<br>ABCD n’a pas d’angles droits.<br><strong>ABCD est un…</strong>",
      choix: [
        c("rectangle.", false, "Pense seulement « quatre côtés » et ne tient pas compte des côtés égaux ni de l’absence d’angle droit."),
        c("carré.", false, "Retient les quatre côtés égaux mais oublie qu’un carré a quatre angles droits."),
        c("triangle.", false, "Ne connaît pas le vocabulaire des polygones (un triangle a trois côtés)."),
        c("losange.", true),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "EG", competence: "Reconnaître un triangle rectangle à partir du codage",
    generer: () => ({
      melange: false, figureACote: true, disposition: "ligne",
      enonce: "Comment peut-on compléter la phrase <span class=\"insecable\">ci-dessous</span> ?<br><strong>La figure FEC est un…</strong>",
      figure: figureQ3(),
      choix: [
        c("triangle isocèle.", false, "Voit le codage EC = EB et l’attribue au triangle FEC."),
        c("triangle équilatéral.", false, "Pense que le codage des longueurs suffit, sans vérifier les trois côtés."),
        c("triangle rectangle.", true),
        c("losange.", false, "Ne repère pas le triangle FEC dans la figure et choisit une forme vue ailleurs."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "EG", competence: "Reconnaître deux figures symétriques par rapport à une droite",
    entrainement: AUTO("EG14", "Symétries"),
    generer: () => ({
      melange: false, choixFigures: true, disposition: "productions",
      enonce: "Observer ces productions.<br><strong>Quelle est celle représentant des figures symétriques par rapport à la droite (f) ?</strong>",
      choix: [
        c(production(0), true),
        c(production(1), false, "Voit deux figures pareilles de part et d’autre de la droite : confond symétrie et glissement (translation)."),
        c(production(2), false, "Voit deux figures « retournées » de part et d’autre de la droite : confond avec un demi-tour (symétrie centrale)."),
        c(production(3), false, "Voit deux triangles de part et d’autre de la droite, sans vérifier les distances à la droite."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "EG", competence: "Compter les arêtes d’un solide représenté en perspective",
    generer: () => ({
      melange: false,
      enonce: "Voici la représentation d’un solide constitué de deux pyramides.<br><strong>Combien d’arêtes possède ce solide ?</strong>",
      figure: figureSolide(),
      choix: [
        c("8 arêtes", false, "Compte seulement les arêtes en trait plein (les arêtes visibles)."),
        c("10 arêtes", false, "Oublie des arêtes cachées, ou en compte certaines deux fois et d’autres pas."),
        c("12 arêtes", true),
        c("6 arêtes", false, "Compte les sommets au lieu des arêtes."),
      ],
    }),
  });

  Q.push({
    num: 6, domaine: "EG", competence: "Dénombrer les carrés d’une figure complexe",
    generer: () => ({
      melange: false,
      enonce: "<strong>Combien y a-t-il de carrés dans cette figure ?</strong>",
      figure: figureCarres(),
      choix: [
        c("6", true),
        c("4", false, "Voit les quatre carrés formés autour des côtés du carré gris, mais pas le carré gris ni le grand carré."),
        c("5", false, "Oublie un carré : souvent le grand carré « sur la pointe », pas reconnu comme un carré."),
        c("2", false, "Ne voit que le carré gris et le grand carré, pas les carrés qu’on obtient en réunissant deux triangles."),
      ],
    }),
  });

  Q.push({
    num: 7, domaine: "EG", competence: "Connaître le vocabulaire du cercle (rayon)",
    generer: () => ({
      melange: false,
      enonce: "D est le centre du cercle ;<br>E, F et G appartiennent au cercle.<br><strong>Parmi les propositions suivantes, laquelle désigne un rayon du cercle ?</strong>",
      figure: figureCercle(),
      choix: [
        c("[DE]", true),
        c("D", false, "Confond le rayon et le centre du cercle."),
        c("[FG]", false, "Confond rayon et diamètre."),
        c("E", false, "Confond le rayon (un segment) et un point du cercle."),
      ],
    }),
  });

  Q.push({
    num: 8, domaine: "EG", competence: "Reconnaître un triangle isocèle à partir du codage",
    generer: () => ({
      melange: false, disposition: "ligne",
      enonce: "Voici une figure composée de 3 triangles A, B et C.<br>Comment peut-on compléter la phrase suivante ?<br><strong>Le triangle C est…</strong>",
      figure: figureTriangles(),
      choix: [
        c("un triangle quelconque.", false, "Ne lit pas le codage des côtés du triangle C."),
        c("un triangle équilatéral.", false, "Pense que le triangle C a ses trois côtés égaux : prend le codage du côté commun avec B."),
        c("un triangle rectangle.", false, "Attribue au triangle C l’angle droit codé dans le triangle A."),
        c("un triangle isocèle.", true),
      ],
    }),
  });

  Q.push({
    num: 9, domaine: "EG", competence: "Reconnaître un patron de pavé droit",
    generer: () => ({
      melange: false, disposition: "ligne",
      enonce: "Quatre élèves ont tracé le patron d’un même pavé droit.",
      figure: figurePatrons(),
      apres: "<strong>L’un d’eux s’est trompé. Lequel ?</strong>",
      choix: [
        c("Le patron de Lillie est faux.", false, "Pense qu’un patron doit être « en croix » : écarte celui de Lillie à cause de sa forme inhabituelle."),
        c("Le patron de Yasmine est faux.", false, "Pense qu’un patron doit être « en croix » : écarte celui de Yasmine à cause de sa forme en T."),
        c("Le patron de Sacha est faux.", false, "Ne sait pas reconnaître un patron, même le plus classique (en croix)."),
        c("Le patron de Léa est faux.", true),
      ],
    }),
  });

  Q.push({
    num: 10, domaine: "EG", competence: "Reconnaître la réduction d’une figure sur un quadrillage",
    generer: () => ({
      melange: false,
      enonce: "Observer la figure F, hachurée.<br>Elle a été réduite.<br><strong>Parmi les quatre figures G, H, I et J, laquelle correspond à cette réduction ?</strong>",
      figure: figureReduction(),
      choix: [
        c("Figure I", false, "Reconnaît la forme en L, mais ne vérifie pas que toutes les longueurs sont divisées par le même nombre."),
        c("Figure G", false, "Choisit la figure la plus grande, sans vérifier les longueurs une à une."),
        c("Figure J", false, "Reconnaît la forme en L, mais ne vérifie pas que toutes les longueurs sont divisées par le même nombre."),
        c("Figure H", true),
      ],
    }),
  });

  Q.push({
    num: 11, domaine: "EG", competence: "Décrire un déplacement sur un quadrillage (repère mobile)",
    generer: () => ({
      melange: false, choixACote: true, disposition: "ligne",
      enonce: "La voiture suit le trajet grisé pour se garer devant sa maison.<br>On code le début de son trajet comme suit :" +
        "<ul class=\"puces\"><li>La voiture avance d’une case.</li><li>Elle tourne à gauche.</li><li>Elle avance de deux cases.</li><li>Elle tourne à droite.</li><li>Elle avance d’une case.</li><li>…</li><li>…</li></ul>" +
        "<strong>Quelle est la fin de son trajet parmi les quatre réponses suivantes ?</strong>",
      figure: figureTrajet(),
      choix: [
        c("Elle tourne à gauche.<br>Elle avance de deux cases.", true),
        c("Elle tourne à gauche.<br>Elle avance d’une case.", false, "Trouve le bon sens mais compte mal les cases grises qui restent."),
        c("Elle tourne à droite.<br>Elle avance d’une case.", false, "Confond la gauche et la droite de la voiture, et compte mal les cases grises qui restent."),
        c("Elle tourne à droite.<br>Elle avance de deux cases.", false, "Compte bien les cases, mais confond la gauche et la droite de la voiture."),
      ],
    }),
  });

  Q.push({
    num: 12, domaine: "EG", competence: "Reconnaître des droites perpendiculaires",
    generer: () => ({
      melange: false,
      enonce: "Voici une figure dans laquelle sont dessinées des droites.<br><strong>Quelles droites semblent perpendiculaires ?</strong>",
      figure: figureDroites(),
      choix: [
        c("g et h", false, "Confond droites perpendiculaires et droites parallèles."),
        c("k et j", false, "Confond droites perpendiculaires et droites parallèles."),
        c("f et g", false, "Choisit deux droites qui se coupent, sans regarder si leur angle est droit."),
        c("h et k", true),
      ],
    }),
  });

  Q.push({
    num: 13, domaine: "EG", competence: "Associer une figure à un programme de construction",
    generer: () => ({
      melange: false, disposition: "deux-colonnes",
      enonce: "Voici un programme de construction :",
      apres: "<ul class=\"puces\"><li>Trace un triangle équilatéral ABC.</li><li>Place D le milieu de [BC].</li><li>Trace la perpendiculaire à (AB) passant par D.</li></ul><strong>Quelle est la figure associée à ce programme ?</strong>",
      figure: figureProgrammes(),
      choix: [
        c("Figure 1", false, "Place D au milieu de [AB] et trace la perpendiculaire à (BC) : inverse les deux segments du programme."),
        c("Figure 2", true),
        c("Figure 3", false, "Place bien D, mais confond perpendiculaire et parallèle."),
        c("Figure 4", false, "Trace bien une perpendiculaire à (AB), mais place D au milieu de [AB] au lieu de [BC]."),
      ],
    }),
  });

  Q.push({
    num: 14, domaine: "EG", competence: "Trouver le coefficient d’un agrandissement sur un quadrillage",
    generer: () => ({
      melange: false,
      enonce: "Observe les deux figures.<br><strong>Par quel nombre faut-il multiplier les longueurs pour passer de la figure A à la figure B ?</strong>",
      figure: figureAgrandi(),
      choix: [
        c("6", false, "Calcule l’écart entre les côtés (9 − 3 = 6) au lieu du rapport."),
        c("2", false, "Estime « deux fois plus grand » en regardant, sans compter les carreaux."),
        c("3", true),
        c("9", false, "Compare les aires (9 fois plus de carreaux) ou reprend la longueur du côté de B."),
      ],
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["6e-pos-geometrie"] = {
    id: "6e-pos-geometrie",
    niveau: "6e",
    famille: "Outil de positionnement",
    titre: "Espace et géométrie",
    annee: 2026,
    source: "Bibliothèque d’outils de positionnement, classe de 6e, « Espace et géométrie » (attendus de fin de CM2), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants",
    consignes: "Sans calculatrice. Pour chaque question, une seule réponse est juste.",
    jumeaux: false,
    domaines: { EG: "Espace et géométrie" },
    // Groupes de maîtrise de la notice Eduscol (sur 14).
    seuils: [{ max: 5, nom: "À besoins" }, { max: 8, nom: "Fragile" }, { max: 14, nom: "Satisfaisant" }],
    officiels: [{ cle: "outil", annee: 2026, titre: "Le test officiel", detail: "Les 14 vraies questions de l’outil de positionnement Eduscol." }],
    questions: Q,
    donnees: { Q1, Q3, PRODUCTIONS, reflet, SOLIDE, CARRES, CERCLE, TRIANGLES, PATRONS, REDUCTION, TRAJET, suivre, DROITES, PROGRAMMES, geometrieProgramme, AGRANDI },
  };
})(typeof window !== "undefined" ? window : globalThis);
