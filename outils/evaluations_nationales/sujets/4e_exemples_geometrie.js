/* maths&go — « Exemples de questions et de tâches » Eduscol, 4e, fiche « Géométrie » (page « Accompagner les élèves en
   mathématiques – 4e, 3e et 2de »). Source : fiche élève et fiche professeur, licence Etalab 2.0.
   Lot EN8a : la fiche à l'identique (énoncés, réponses dans l'ordre de la fiche élève, figures redessinées), sans jumeau,
   sans calculatrice. L'exercice 7 est « au choix du professeur » : trois cartes à l'accueil, une par version (décision
   du 14/11). Les pièges des QCM suivent l'analyse de la fiche professeur, réécrite sans mot genré ; ceux que la fiche
   n'analyse pas sont de maths&go (nonPublie, liste dans la notice du lot). Les réponses à argumenter : la réponse
   finale se donne dans l'appli, l'argumentation va sur la feuille. Pas de repères publiés : pas de groupe au bilan. */
(function (racine) {
  "use strict";
  const { svg, lettre } = racine.EN;
  const { programme, cubes, vues, dessinVue } = racine.ENX;

  const c = (html, juste, erreur, nonPublie) => ({ html, juste: Boolean(juste), erreur: erreur || "", nonPublie: Boolean(nonPublie) });
  const officielle = (contenu) => () => Object.assign({ melange: false, choix: [] }, contenu);
  const ENCRE = "#143451";
  const txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.taille || 15}" font-weight="${o.gras === false ? 400 : 700}"${o.italique ? ' font-style="italic"' : ""} text-anchor="${o.ancre || "middle"}" fill="${o.coul || ENCRE}">${t}</text>`;

  // ---------- Q1 : le solide et ses vues ----------
  // Cellules [x, y, z] : x vers la droite, y vers le fond, z vers le haut. Le solide 3 est le bon ; le 1 a les bonnes vues de
  // face et de gauche mais pas celle de dessus ; le 2 a les bonnes vues de face et de dessus mais pas celle de gauche.
  const BASE = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0], [2, 1, 0]];
  const SOLIDES = [
    [[0, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0], [2, 1, 0], [1, 1, 1]],
    BASE.concat([[1, 0, 1], [1, 1, 1]]),
    BASE.concat([[1, 1, 1]]),
  ];
  const VUES = vues(SOLIDES[2]);
  function figureVues() {
    const C = 34, bas = 80;
    const morceaux = [["Vue de gauche", VUES.gauche, 6], ["Vue de face", VUES.face, 116], ["Vue de dessus", VUES.dessus, 260]];
    return svg(372, 108, morceaux.map(([nom, carreaux, x]) => dessinVue(carreaux, x, bas, C) + txt(x + 51, 102, nom, { taille: 12.5 })).join(""),
      "Trois vues du solide. Vue de gauche : deux carreaux en bas, un carreau au-dessus de celui de gauche. Vue de face : trois carreaux en bas, un carreau au-dessus de celui du milieu. Vue de dessus : deux rangées de trois carreaux", 300);
  }
  function figureSolide(k) {
    const r = cubes(SOLIDES[k], 32);
    return svg(Math.round(r.largeur), Math.round(r.hauteur), r.contenu, `Solide ${k + 1} en perspective, fait de ${SOLIDES[k].length} petits cubes`, 190).replace('class="figure"', 'class="figure fig-choix"');
  }

  // ---------- Q2 : la symétrie axiale ----------
  // EFCD aux mesures de la fiche (en cm) ; ABGH est son symétrique par rapport à (d) : A est l'image de C, B celle de F,
  // G celle de E et H celle de D (le segment [AB] est l'image de [FC]).
  const QUAD = (function () {
    const E = [0, 0], F = [6, 0], a = (24 * Math.PI) / 180, D = [3.6 * Math.cos(a), 3.6 * Math.sin(a)];
    // C : à 2,3 cm de D et à 4,2 cm de F (intersection de deux cercles, celle du bas).
    const dx = F[0] - D[0], dy = F[1] - D[1], d = Math.hypot(dx, dy), r1 = 2.3, r2 = 4.2;
    const l = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(r1 * r1 - l * l);
    const mx = D[0] + (l * dx) / d, my = D[1] + (l * dy) / d;
    const cands = [[mx + (h * dy) / d, my - (h * dx) / d], [mx - (h * dy) / d, my + (h * dx) / d]];
    const C = cands[0][1] > cands[1][1] ? cands[0] : cands[1];
    // L'axe (d) : passe par (5,5 ; 4,4), monte vers la droite (y vers le bas).
    const P0 = [5.5, 4.4], ang = (-33 * Math.PI) / 180, u = [Math.cos(ang), Math.sin(ang)];
    const sym = ([x, y]) => {
      const vx = x - P0[0], vy = y - P0[1], k = vx * u[0] + vy * u[1];
      return [2 * (P0[0] + k * u[0]) - x, 2 * (P0[1] + k * u[1]) - y];
    };
    return { E, F, C, D, A: sym(C), B: sym(F), G: sym(E), H: sym(D), P0, u };
  })();
  function figureSymetrie() {
    const k = 26, { E, F, C, D, A, B, G, H, P0, u } = QUAD;
    const d1 = [P0[0] - 6.2 * u[0], P0[1] - 6.2 * u[1]], d2 = [P0[0] + 6.4 * u[0], P0[1] + 6.4 * u[1]];
    // Le cadre suit les points et la droite (d), avec de la place pour les lettres.
    const tous = [E, F, C, D, A, B, G, H, d1, d2];
    const minX = Math.min(...tous.map((p) => p[0])), minY = Math.min(...tous.map((p) => p[1]));
    const maxX = Math.max(...tous.map((p) => p[0])), maxY = Math.max(...tous.map((p) => p[1]));
    const ox = 40 - minX * k, oy = 32 - minY * k;
    const X = ([x, y]) => [ox + x * k, oy + y * k];
    const seg = (p, q) => { const [a, b] = X(p), [c2, d] = X(q); return `<line x1="${a.toFixed(1)}" y1="${b.toFixed(1)}" x2="${c2.toFixed(1)}" y2="${d.toFixed(1)}" stroke="#222" stroke-width="1.6"/>`; };
    const pt = (p, nom, ddx, ddy) => { const [a, b] = X(p); return `<circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="2.2" fill="#222"/>` + txt((a + ddx).toFixed(1), (b + ddy).toFixed(1), nom, { taille: 17 }); };
    const lg = (p, q, t, ddx, ddy) => { const [a, b] = X(p), [c2, d] = X(q); return txt(((a + c2) / 2 + ddx).toFixed(1), ((b + d) / 2 + ddy).toFixed(1), t, { taille: 15, gras: false }); };
    const [la, lb] = X([d1[0] + 0.5, d1[1] - 0.25]);
    const contenu =
      seg(d1, d2) + txt((la + 10).toFixed(1), (lb + 22).toFixed(1), "(d)", { italique: true, taille: 18, gras: false }) +
      seg(E, F) + seg(F, C) + seg(C, D) + seg(D, E) + seg(A, B) + seg(B, G) + seg(G, H) + seg(H, A) +
      lg(E, F, "6 cm", 0, -9) + lg(E, D, "3,6 cm", -26, 16) + lg(D, C, "2,3 cm", -30, 8) + lg(F, C, "4,2 cm", 32, 0) +
      pt(E, "E", -11, -7) + pt(F, "F", 11, -7) + pt(D, "D", 14, -4) + pt(C, "C", 4, 21) +
      pt(A, "A", -14, 5) + pt(B, "B", 12, -7) + pt(G, "G", 4, 21) + pt(H, "H", 14, 16);
    return svg(Math.round((maxX - minX) * k + 80), Math.round((maxY - minY) * k + 64), contenu, "Le quadrilatère EFCD (EF = 6 cm, ED = 3,6 cm, DC = 2,3 cm, FC = 4,2 cm), la droite (d) et le quadrilatère ABGH de l’autre côté de (d)", 380).replace('class="figure"', 'class="figure symetrie"');
  }

  // ---------- Q3 : les deux cercles de même centre ----------
  function figureCercles() {
    const O = [150, 128], r1 = 52, r2 = 96, P = (r, deg) => [O[0] + r * Math.cos((deg * Math.PI) / 180), O[1] - r * Math.sin((deg * Math.PI) / 180)];
    const A = P(r1, 142), C = P(r1, -38), B = P(r2, 43), D = P(r2, 223);
    const f = (p) => p.map((v) => v.toFixed(1)).join(",");
    return svg(300, 256,
      `<circle cx="${O[0]}" cy="${O[1]}" r="${r2}" fill="none" stroke="#222" stroke-width="1.5"/><circle cx="${O[0]}" cy="${O[1]}" r="${r1}" fill="none" stroke="#222" stroke-width="1.5"/>` +
      `<polygon points="${[A, B, C, D].map(f).join(" ")}" fill="#d9d9d9" stroke="#222" stroke-width="1.6"/>` +
      `<line x1="${A[0]}" y1="${A[1]}" x2="${C[0]}" y2="${C[1]}" stroke="#222" stroke-width="1.2" stroke-dasharray="4 4"/><line x1="${B[0]}" y1="${B[1]}" x2="${D[0]}" y2="${D[1]}" stroke="#222" stroke-width="1.2" stroke-dasharray="4 4"/>` +
      `<circle cx="${O[0]}" cy="${O[1]}" r="2.6" fill="#222"/>` +
      txt(A[0] - 7, A[1] - 10, "A", { taille: 17 }) + txt(B[0] + 10, B[1] - 7, "B", { taille: 17 }) + txt(C[0] + 11, C[1] + 18, "C", { taille: 17 }) + txt(D[0] - 11, D[1] + 18, "D", { taille: 17 }),
      "Deux cercles de même centre O. A et C sont sur le petit cercle, B et D sur le grand. Le quadrilatère ABCD est grisé, ses diagonales en pointillés se coupent en O", 280);
  }

  // ---------- Q4 : le programme du lutin ----------
  const LUTIN = { repetitions: 4, angle: 90, pas: 160 };
  const figureLutin = () => programme([
    { cat: "evenement", chapeau: true, el: ["quand", { drapeau: true }, "pressé"] },
    { cat: "stylo", el: ["stylo en position d’écriture"] },
    { cat: "controle", el: ["répéter", { nombre: String(LUTIN.repetitions) }, "fois"], dedans: [
      { cat: "mouvement", el: ["tourner", { rotation: true }, "de", { nombre: String(LUTIN.angle) }, "degrés"] },
      { cat: "mouvement", el: ["avancer de", { nombre: String(LUTIN.pas) }] },
    ] },
  ], "Programme : quand le drapeau est pressé, stylo en position d’écriture, répéter 4 fois : tourner à gauche de 90 degrés, avancer de 160", 330);

  // ---------- Q5 : le repère ----------
  const POINTS = { A: [-4, 3], B: [5, -2], C: [1, -4] };
  function figureRepere() {
    const k = 24, x0 = 6, xMin = -6, xMax = 6, yMin = -5, yMax = 5, oy = 8;
    const X = (x) => x0 + (x - xMin + 0.4) * k, Y = (y) => oy + (yMax + 0.4 - y) * k;
    let s = "";
    for (let x = xMin; x <= xMax; x++) s += `<line x1="${X(x)}" y1="${Y(yMax + 0.4)}" x2="${X(x)}" y2="${Y(yMin - 0.4)}" stroke="#cfd5da" stroke-width="1"/>`;
    for (let y = yMin; y <= yMax; y++) s += `<line x1="${X(xMin - 0.4)}" y1="${Y(y)}" x2="${X(xMax + 0.4)}" y2="${Y(y)}" stroke="#cfd5da" stroke-width="1"/>`;
    s += `<line x1="${X(xMin - 0.4)}" y1="${Y(0)}" x2="${X(xMax + 0.4)}" y2="${Y(0)}" stroke="#222" stroke-width="1.5"/><line x1="${X(0)}" y1="${Y(yMax + 0.4)}" x2="${X(0)}" y2="${Y(yMin - 0.4)}" stroke="#222" stroke-width="1.5"/>`;
    const n = (v) => (v < 0 ? "−" + -v : String(v));
    for (let x = xMin; x <= xMax; x++) if (x !== 0) s += txt(X(x), Y(0) + 13, n(x), { taille: 12, gras: false, coul: "#333" });
    for (let y = yMin; y <= yMax; y++) if (y !== 0) s += txt(X(0) - 5, Y(y) + 4, n(y), { taille: 12.5, gras: false, coul: "#333", ancre: "end" });
    s += txt(X(0) - 4, Y(0) + 13, "0", { taille: 12, gras: false, coul: "#333", ancre: "end" });
    for (const [nom, [x, y]] of Object.entries(POINTS))
      s += `<path d="M${X(x) - 5} ${Y(y) - 5}l10 10M${X(x) + 5} ${Y(y) - 5}l-10 10" stroke="#3a46c9" stroke-width="2.2"/>` + txt(X(x) + 9, Y(y) - 8, nom, { coul: "#3a46c9", taille: 17 });
    return svg(Math.round(X(xMax + 0.4) + 6), Math.round(Y(yMin - 0.4) + 4), s,
      "Repère quadrillé, abscisses de −6 à 6 et ordonnées de −5 à 5, avec trois points marqués d’une croix : A, B et C", 330).replace('class="figure"', 'class="figure repere"');
  }

  // ---------- Q6 : le coin plié ----------
  const PLI = { angle: 30 };
  function figurePapier() {
    const x0 = 10, y0 = 10, xr = 262, yb = 158, P = [168, yb], L = 94, rad = (d) => (d * Math.PI) / 180;
    const a = rad(PLI.angle), Q = [xr, yb - (xr - P[0]) * Math.tan(a)], K2 = [P[0] + L * Math.cos(2 * a), yb - L * Math.sin(2 * a)];
    const f = (p) => p.map((v) => v.toFixed(1)).join(",");
    const arc = (r, d1, d2) => `M${(P[0] + r * Math.cos(rad(d1))).toFixed(1)} ${(yb - r * Math.sin(rad(d1))).toFixed(1)}A${r} ${r} 0 0 0 ${(P[0] + r * Math.cos(rad(d2))).toFixed(1)} ${(yb - r * Math.sin(rad(d2))).toFixed(1)}`;
    return svg(274, 172,
      `<polygon points="${f([x0, y0])} ${f([xr, y0])} ${f(Q)} ${f(P)} ${f([x0, yb])}" fill="#e8ebee" stroke="#333" stroke-width="1.6"/>` +
      `<polygon points="${f(P)} ${f(Q)} ${f(K2)}" fill="#cfd3d7" stroke="#333" stroke-width="1.6"/>` +
      `<path d="${arc(30, 2 * PLI.angle, 180)}" fill="none" stroke="#222" stroke-width="1.4"/>` +
      `<path d="${arc(22, PLI.angle, 2 * PLI.angle)}" fill="none" stroke="#222" stroke-width="1.4"/>` +
      `<text x="${P[0] - 36}" y="${yb - 34}" font-size="19" fill="#111" text-anchor="middle"><tspan font-style="italic" font-family="Cambria Math,Times New Roman,serif">x</tspan>°</text>` +
      txt(P[0] + 36, yb - 22, "30°", { taille: 16, gras: false, coul: "#111", ancre: "start" }),
      "Une feuille rectangulaire dont le coin en bas à droite est plié. Au bord du bas, l’angle marqué x° est entre le bord de la feuille et le bord du coin replié ; l’angle de 30° est entre la pliure et le bord du coin replié", 300);
  }

  // ---------- Q7 (au choix du professeur) ----------
  function figureEquilateral() {
    const s = 110, A = [18, 124], B = [18 + s, 124], C = [18 + 2 * s, 124], D = [18 + s / 2, 124 - (s * Math.sqrt(3)) / 2];
    const trait = (p, q) => `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="#222" stroke-width="1.5"/>`;
    const code = (p, q) => {
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2 - 0.35;
      return `<line x1="${(mx - 6 * Math.cos(a)).toFixed(1)}" y1="${(my - 6 * Math.sin(a)).toFixed(1)}" x2="${(mx + 6 * Math.cos(a)).toFixed(1)}" y2="${(my + 6 * Math.sin(a)).toFixed(1)}" stroke="#222" stroke-width="1.5"/>`;
    };
    const pt = (p, n, dx, dy) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="#222"/>` + txt((p[0] + dx).toFixed(1), (p[1] + dy).toFixed(1), n, { taille: 16 });
    return svg(260, 152, trait(A, C) + trait(A, D) + trait(D, B) + trait(D, C) + code(A, D) + code(D, B) + code(A, B) + code(B, C) +
      pt(A, "A", -11, 5) + pt(B, "B", 0, 21) + pt(C, "C", 11, 5) + pt(D, "D", 0, -9),
      "Les points A, B et C sont alignés. D est au-dessus. Les segments [AD], [DB], [AB] et [BC] sont codés de même longueur. Le segment [DC] est tracé", 300);
  }
  const ETAGERE = { RS: 42, TR: 40, ST: 58 };
  function figureEtagere() {
    const k = 2.2, R = [58, 22], T = [58 + ETAGERE.TR * k, 22], S = [58, 22 + ETAGERE.RS * k];
    return svg(170, 150,
      `<defs><pattern id="mur-en8" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#fff"/><line x1="0" y1="0" x2="0" y2="7" stroke="#666" stroke-width="1.2"/></pattern></defs>` +
      `<rect x="20" y="10" width="38" height="134" fill="url(#mur-en8)" stroke="#333" stroke-width="1.4"/>` +
      `<line x1="${R[0]}" y1="${R[1]}" x2="${T[0] + 12}" y2="${T[1]}" stroke="#222" stroke-width="1.8"/>` +
      `<line x1="${S[0]}" y1="${S[1]}" x2="${T[0]}" y2="${T[1]}" stroke="#555" stroke-width="1.4"/>` +
      txt(R[0] + 7, R[1] - 6, "R", { taille: 16, ancre: "start" }) + txt(T[0], T[1] - 6, "T", { taille: 16 }) + txt(S[0] + 7, S[1] + 6, "S", { taille: 16, ancre: "start" }),
      "Un mur vertical hachuré. L’étagère part du point R, en haut du mur, jusqu’au point T. Un support relie le point S du mur, sous R, au point T", 190);
  }
  const THALES = { AB: 3.2, BO: 4.8, BC: 1 };
  function figureThales() {
    const k = 40, A = [26, 132], B = [26 + THALES.AB * k, 132], O = [26 + (THALES.AB + THALES.BO) * k, 132];
    const C = [B[0], 132 - THALES.BC * k], OS = (THALES.BC * (THALES.AB + THALES.BO)) / THALES.AB, S = [O[0], 132 - OS * k];
    const croix = (p) => `<path d="M${p[0] - 4} ${p[1] - 4}l8 8M${p[0] + 4} ${p[1] - 4}l-8 8" stroke="#222" stroke-width="1.6"/>`;
    const droit = (p) => `<path d="M${p[0] - 10} ${p[1]}v-10h10" fill="none" stroke="#222" stroke-width="1.2"/>`;
    const cote = (x1, x2, y, t) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#222" stroke-width="1.3"/><path d="M${x1 + 7} ${y - 4}l-7 4 7 4M${x2 - 7} ${y - 4}l7 4 -7 4" fill="none" stroke="#222" stroke-width="1.3"/>` +
      `<line x1="${x1}" y1="136" x2="${x1}" y2="${y + 4}" stroke="#222" stroke-width="1" stroke-dasharray="3 3"/><line x1="${x2}" y1="136" x2="${x2}" y2="${y + 4}" stroke="#222" stroke-width="1" stroke-dasharray="3 3"/>` +
      txt((x1 + x2) / 2, y + 19, t, { taille: 15, gras: false });
    return svg(378, 216,
      `<line x1="${A[0]}" y1="${A[1]}" x2="${O[0]}" y2="${O[1]}" stroke="#222" stroke-width="1.6"/><line x1="${A[0]}" y1="${A[1]}" x2="${S[0]}" y2="${S[1]}" stroke="#222" stroke-width="1.6"/>` +
      `<line x1="${B[0]}" y1="${B[1]}" x2="${C[0]}" y2="${C[1]}" stroke="#222" stroke-width="1.6"/><line x1="${O[0]}" y1="${O[1]}" x2="${S[0]}" y2="${S[1]}" stroke="#222" stroke-width="1.6"/>` +
      droit(B) + droit(O) + croix(A) + croix(B) + croix(O) + croix(C) + croix(S) +
      txt(A[0] - 12, A[1] + 5, "A", { taille: 16 }) + txt(B[0] + 11, B[1] + 18, "B", { taille: 16 }) + txt(O[0] + 12, O[1] + 18, "O", { taille: 16 }) +
      txt(C[0], C[1] - 10, "C", { taille: 16 }) + txt(S[0], S[1] - 10, "S", { taille: 16 }) + txt(C[0] + 8, (B[1] + C[1]) / 2 + 6, "1 m", { taille: 15, gras: false, ancre: "start" }) +
      cote(A[0], B[0], 162, "3,20 m") + cote(B[0], O[0], 190, "4,80 m"),
      "Les points A, B et O sont alignés. C est au-dessus de B, avec BC = 1 m, et S au-dessus de O ; A, C et S sont alignés. Angles droits en B et en O. AB = 3,20 m et BO = 4,80 m", 360);
  }

  // ---------- Questions ----------
  const Q = [];

  Q.push({
    num: 1, domaine: "ESP", competence: "Relier un solide de petits cubes à ses vues",
    generer: officielle({
      enonce: "Un solide est constitué d’un assemblage de petits cubes identiques. On donne ci-dessous, différentes vues de ce solide.",
      figure: figureVues(),
      apres: "Un seul des trois solides représentés ci-dessous en perspective admet les trois vues précédentes.<br><strong>Entourer la réponse exacte.</strong>",
      disposition: "solides",
      choixFigures: true,
      choix: [
        c(figureSolide(0), false, "Ne tient pas compte de la vue de dessus."),
        c(figureSolide(1), false, "Ne tient pas compte de la vue de gauche."),
        c(figureSolide(2), true),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "TRANS", competence: "Utiliser la conservation des longueurs par une symétrie axiale",
    generer: officielle({
      enonce: "Le quadrilatère ABGH est le symétrique du quadrilatère EFCD par rapport à la droite (d). <strong>Quelle est la longueur AB ?</strong><br>Cocher la réponse exacte.",
      figure: figureSymetrie(),
      serre: true,
      choix: [
        c("2,3 cm", false, "Prend la longueur d’un autre côté de EFCD : se représente mal l’image d’un segment par la symétrie."),
        c("3,6 cm", false, "Prend la longueur d’un autre côté de EFCD : se représente mal l’image d’un segment par la symétrie."),
        c("4,2 cm", true),
        c("6 cm", false, "Fait glisser la figure (une translation) au lieu de la plier le long de (d) : c’est l’erreur la plus fréquente."),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "DEM", competence: "Reconnaître un quadrilatère à partir de ses diagonales",
    generer: officielle({
      enonce: "Sur la figure ci-dessous :<ul class=\"liste\"><li>les points A et C appartiennent à un même cercle de centre O.</li><li>les points B et D appartiennent à un même cercle de centre O.</li></ul>",
      figure: figureCercles(),
      apres: "<strong>Cocher la réponse exacte.</strong><br>Le quadrilatère ABCD est :",
      serre: true,
      choix: [
        c("un losange", false, "Voit des diagonales presque perpendiculaires, alors que rien (codage ou texte) ne permet de le dire."),
        c("un rectangle", false, "Pense que tout quadrilatère qui a ses côtés opposés de même longueur est un rectangle."),
        c("un parallélogramme", true),
        c("un carré", false, "Pense que tout quadrilatère qui a ses côtés opposés de même longueur est un carré, image renforcée par les diagonales et les cercles."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "ALGO", competence: "Lire un programme de déplacement",
    generer: officielle({
      enonce: "<strong>Que permet de construire, au lutin du logiciel Scratch, la séquence d’instructions <span class=\"mot-ordi\">ci-contre</span><span class=\"mot-tel\">ci-dessous</span> ?</strong>",
      figure: figureLutin(),
      apres: "Cocher la réponse exacte.",
      serre: true,
      choix: [
        c("un losange", false, "Voit quatre côtés de même longueur, mais ne tient pas compte du bloc « tourner de 90 degrés » (les angles droits)."),
        c("un rectangle", false, "Ne tient pas compte du bloc « avancer de 160 » : les quatre côtés ont la même longueur."),
        c("un carré", true),
        c("un triangle rectangle", false, "Ne tient pas compte du bloc « répéter 4 fois »."),
        c("un segment", false, "Ne tient pas compte du bloc « tourner de 90 degrés »."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "ESP", competence: "Lire des coordonnées et trouver celles d’un symétrique",
    generer: officielle({
      // La fiche dit « Placer le point A′… » : dans l'appli, on ne peut pas placer de point, la phrase devient « A′ est… ».
      enonce: "Donner les coordonnées du point C.<br>A′ est le symétrique du point A par rapport à l’axe des abscisses. Donner les coordonnées de ce point A′.<br>B′ est le symétrique du point B par rapport à l’origine du repère. Donner les coordonnées de ce point B′.",
      figure: figureRepere(),
      saisie: { lignes: [
        { modele: "C(□ ; □)", attendus: POINTS.C, pieges: [{ valeurs: [POINTS.C[1], POINTS.C[0]], erreur: "Échange l’abscisse et l’ordonnée du point C." }] },
        { modele: "A′(□ ; □)", attendus: [POINTS.A[0], -POINTS.A[1]], pieges: [{ valeurs: [-POINTS.A[0], POINTS.A[1]], erreur: "Prend, pour A′, le symétrique par rapport à l’axe des ordonnées : confond les deux axes, ou pense qu’une symétrie se fait toujours autour d’un axe vertical." }] },
        { modele: "B′(□ ; □)", attendus: [-POINTS.B[0], -POINTS.B[1]], pieges: [
          { valeurs: [POINTS.B[0], -POINTS.B[1]], erreur: "Fait, pour B′, la symétrie par rapport à l’axe des abscisses au lieu de la symétrie de centre O." },
          { valeurs: [-POINTS.B[0], POINTS.B[1]], erreur: "Fait, pour B′, la symétrie par rapport à l’axe des ordonnées au lieu de la symétrie de centre O." },
        ] },
      ] },
    }),
  });

  Q.push({
    num: 6, domaine: "DEM", competence: "Utiliser un pliage (symétrie) et un angle plat pour calculer un angle",
    indicateurs: [
      "Montre (schéma ou phrase) qu’en dépliant le coin, on retrouve un angle plat de 180°.",
      "Reconnaît que le pliage agit comme une symétrie axiale : l’angle qui complète x pour former l’angle plat mesure 2 × 30° = 60° (ou code que la pliure partage cet angle en deux angles de 30°).",
      "Écrit x + 60° = 180° et conclut : x = 120°.",
    ],
    generer: officielle({
      enonce: `Un morceau de papier rectangulaire a un coin plié, comme le représente l’image <span class=\"mot-ordi\">ci-contre</span><span class=\"mot-tel\">ci-dessous</span>. <strong>Quelle est la valeur, en degré, de ${lettre("x")} ?</strong>`,
      figure: figurePapier(),
      apres: "<strong>Argumenter la réponse.</strong>",
      preuve: true,
      saisie: { lignes: [{ modele: `${lettre("x")} = □°`, attendus: [180 - 2 * PLI.angle], pieges: [
        { valeurs: [150], nonPublie: true, erreur: "Retire un seul angle de 30° à l’angle plat : oublie que la pliure rabat aussi l’autre angle de 30°." },
        { valeurs: [60], nonPublie: true, erreur: "Donne l’angle formé par les deux angles de 30° au lieu de 𝑥." },
        { valeurs: [30], nonPublie: true, erreur: "Reprend l’angle donné sur la figure." },
      ] }] },
    }),
  });

  Q.push({
    num: 7, domaine: "DEM", competence: "Démontrer qu’un triangle est rectangle (angles)", annees: ["7a"],
    indicateurs: [
      "Reconnaît, grâce au codage, que le triangle ABD est équilatéral : ses angles mesurent 60°.",
      "Comme A, B et C sont alignés, l’angle ABC est plat : l’angle DBC mesure 180° − 60° = 120°.",
      "Reconnaît, grâce au codage, que le triangle BDC est isocèle en B, puis calcule ses deux autres angles : (180° − 120°) ÷ 2 = 30°.",
      "Additionne les angles adjacents : l’angle ADC mesure 60° + 30° = 90°, donc le triangle ADC est rectangle en D.",
    ],
    generer: officielle({
      enonce: "La figure codée comprend quatre segments de même longueur, et les points A, B, C sont alignés.",
      figure: figureEquilateral(),
      apres: "<strong>Le triangle ADC est rectangle en D. Vrai ou faux ?</strong><br><strong>Argumenter la réponse.</strong>",
      disposition: "ligne",
      preuve: true,
      choix: [
        c("Vrai", true),
        c("Faux", false, "Ne trouve pas l’angle droit : ne relie pas le triangle équilatéral ABD et le triangle isocèle BDC.", true),
      ],
    }),
    variantes: [
      {
        annees: ["7b"], competence: "Démontrer qu’un triangle est rectangle (réciproque du théorème de Pythagore)",
        indicateurs: [
          "Comprend que l’étagère est horizontale si le triangle RST est rectangle en R.",
          "Pense à la réciproque du théorème de Pythagore et prend [ST], le plus long côté, comme hypoténuse possible.",
          "Calcule ST² = 58² = 3 364 d’une part, RS² + TR² = 42² + 40² = 1 764 + 1 600 = 3 364 d’autre part.",
          "Conclut avec la réciproque du théorème de Pythagore : RST est rectangle en R, l’étagère est horizontale.",
        ],
        generer: officielle({
          enonce: "Allan a posé une étagère sur un mur vertical. On sait que RS = 42 cm, TR = 40 cm et ST = 58 cm. <strong>L’étagère est-elle horizontale ?</strong>",
          figure: figureEtagere(),
          apres: "<strong>Argumenter la réponse.</strong>",
          disposition: "ligne",
          preuve: true,
          choix: [
            c("Oui", true),
            c("Non", false, "N’utilise pas la réciproque du théorème de Pythagore, ou se trompe dans les calculs (58² = 42² + 40²).", true),
          ],
        }),
      },
      {
        annees: ["7c"], competence: "Calculer une longueur avec le théorème de Thalès",
        indicateurs: [
          "Reconnaît une configuration de Thalès (ou de triangles semblables) : (BC) et (OS) sont parallèles, car toutes deux perpendiculaires à (AO).",
          "Écrit correctement les rapports égaux : AB ÷ AO = AC ÷ AS = BC ÷ OS.",
          "Remplace les longueurs (AO = 3,20 + 4,80 = 8 m) et choisit l’égalité OS ÷ BC = AO ÷ AB.",
          "Résout : OS = 1 × 8 ÷ 3,2 = 2,5 m.",
        ],
        generer: officielle({
          enonce: "<strong>Déterminer la longueur OS.</strong>",
          figure: figureThales(),
          apres: "<strong>Détailler les calculs.</strong>",
          preuve: true,
          saisie: { lignes: [{ modele: "OS = □ m", attendus: [(THALES.BC * (THALES.AB + THALES.BO)) / THALES.AB], pieges: [
            { valeurs: [Math.round((THALES.BO / THALES.AB) * 100) / 100], nonPublie: true, erreur: "Utilise BO au lieu de AO = AB + BO dans le rapport de Thalès." },
          ] }] },
        }),
      },
    ],
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["4e-exemples-geometrie"] = {
    id: "4e-exemples-geometrie",
    famille: "Exemples de questions Eduscol",
    niveau: "4e",
    titre: "Géométrie",
    source: "Ministère de l’Éducation nationale — « Accompagner les élèves en mathématiques – 4e, 3e et 2de », exemples d’exercices de quatrième, fiche « Géométrie », Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/6858/accompagner-les-eleves-en-mathematiques-4e-3e-et-2de",
    consignes: "Sans calculatrice. Prévois une feuille pour les justifications. L’exercice 7 est au choix du professeur : prends la carte qu’on t’indique.",
    jumeaux: false,
    seuils: null, // Eduscol ne publie pas de repères pour ces exemples
    domaines: { ESP: "Représenter l’espace, se repérer", TRANS: "Transformations", DEM: "Géométrie plane pour démontrer", ALGO: "Exécuter un programme" },
    officiels: [
      { cle: "7a", annee: "7a", titre: "Avec l’exercice 7 : le triangle", detail: "Quatre segments de même longueur : le triangle ADC est-il rectangle ?", court: "exercice 7 : le triangle" },
      { cle: "7b", annee: "7b", titre: "Avec l’exercice 7 : l’étagère", detail: "L’étagère d’Allan est-elle horizontale ?", court: "exercice 7 : l’étagère" },
      { cle: "7c", annee: "7c", titre: "Avec l’exercice 7 : la longueur OS", detail: "Calculer une longueur dans une figure.", court: "exercice 7 : la longueur OS" },
    ],
    questions: Q,
    donnees: { SOLIDES, VUES, QUAD, LUTIN, POINTS, PLI, ETAGERE, THALES },
  };
})(typeof window !== "undefined" ? window : globalThis);
