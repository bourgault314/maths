/* maths&go — Évaluation nationale de début de 4e, test spécifique « Automatismes » (DEPP, septembre 2024, 2025 et 2026).
   Les questions 1 et 6 ont deux tâches : celle de 2026 (generer) et celle de 2024-2025 (variantes).
   Source : https://eduscol.education.gouv.fr/evaluations-nationales-4e — licence Etalab 2.0.
   Chaque question existe en version officielle (les valeurs du sujet 2026) et en version « jumelle » :
   même compétence, même niveau, mêmes pièges (les distracteurs suivent l'analyse publiée par la DEPP, section 11.4 du
   document « Présentation des exercices et compétences »). Lot EN4 : un jumeau ne change pas que les nombres — il tire
   aussi une « forme » (disposition, sens, écriture, figure tournée…), sans monter d'un niveau. */
(function (racine) {
  "use strict";
  const { nb, nombreVersTexte, decaler, frac, angLong, lettre, MOINS, svg } = racine.EN;

  // Un choix : texte affiché + juste/faux + l'erreur que trahit le piège (vue prof, après « l'élève … »).
  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const AUTO = (notion, libelle) => ({ appli: "Automatismes", notion, libelle, url: `/automatismes/?notions=${notion}&nombre=8` });
  const neg = (n) => (n < 0 ? MOINS + Math.abs(n) : String(n));
  const dec = (x) => nb(nombreVersTexte(x));
  const BLEU = "#5a64c8", BORD = "#252c5c", PALE = "#9b9bd6";

  // ---------- Figures ----------
  const pt = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  // Secteur de disque entre deux angles (en degrés, sens des aiguilles d'une montre depuis midi).
  function secteur(cx, cy, r, a1, a2, fill) {
    const P = (a) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
    const [x1, y1] = P(a1), [x2, y2] = P(a2);
    return `<path d="M${pt(cx, cy)} L${pt(x1, y1)} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${pt(x2, y2)} Z" fill="${fill}" stroke="${BORD}" stroke-width="1.3"/>`;
  }
  // Disque partagé en n secteurs égaux ; les secteurs « blancs » sont donnés par leurs numéros (0 = juste après midi).
  function disque(n, blancs, r = 70, etiquette) {
    let s = "";
    for (let i = 0; i < n; i++) s += secteur(r + 4, r + 4, r, (i * 360) / n, ((i + 1) * 360) / n, blancs.includes(i) ? "#fff" : BLEU);
    return svg(2 * r + 8, 2 * r + 8, s, etiquette || `Disque partagé en ${n} parts égales`, 230);
  }
  // Disque fait de morceaux de tailles différentes : [[fraction du tour, colorié ?], …] depuis midi.
  function disqueMorceaux(morceaux, r) {
    let s = "", a = 0;
    for (const [f, col] of morceaux) { s += secteur(r + 3, r + 3, r, a, a + f * 360, col ? BLEU : "#fff"); a += f * 360; }
    return s;
  }
  const petite = (l, h, contenu, etiquette) => `<svg class="fig-choix" viewBox="0 0 ${l} ${h}" role="img" aria-label="${etiquette}" xmlns="http://www.w3.org/2000/svg">${contenu}</svg>`;
  // Bande partagée verticalement : largeurs et parts coloriées.
  function bande(largeurs, coloriees, etiquette) {
    let s = "", x = 2;
    largeurs.forEach((w, i) => { s += `<rect x="${x.toFixed(1)}" y="20" width="${w.toFixed(1)}" height="40" fill="${coloriees[i] ? PALE : "#fff"}" stroke="${BORD}" stroke-width="1.6"/>`; x += w; });
    return petite(x + 2, 80, s, etiquette);
  }
  // Rectangle partagé horizontalement : hauteurs et parts coloriées.
  function bandes(hauteurs, coloriees, etiquette) {
    let s = "", y = 2;
    const u = 76 / hauteurs.reduce((a, b) => a + b, 0);
    hauteurs.forEach((h, i) => { s += `<rect x="2" y="${y.toFixed(1)}" width="100" height="${(h * u).toFixed(1)}" fill="${coloriees[i] ? PALE : "#fff"}" stroke="${BORD}" stroke-width="1.6"/>`; y += h * u; });
    return petite(104, 80, s, etiquette);
  }

  // Rotation (degrés) puis symétrie éventuelle d'une liste de points, et mise à l'échelle dans un cadre W × H (y vers le bas).
  function cadrer(P, rotation, miroir, W, H, m) {
    const rot = (rotation * Math.PI) / 180;
    let Q = P.map(([x, y]) => [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
    if (miroir) Q = Q.map(([x, y]) => [-x, y]);
    const xs = Q.map((p) => p[0]), ys = Q.map((p) => p[1]);
    const k = Math.min((W - 2 * m) / (Math.max(...xs) - Math.min(...xs)), (H - 2 * m) / (Math.max(...ys) - Math.min(...ys)));
    const largeur = (Math.max(...xs) - Math.min(...xs)) * k, hauteur = (Math.max(...ys) - Math.min(...ys)) * k;
    const dx = (W - largeur) / 2, dy = (H - hauteur) / 2;
    return { k, S: Q.map(([x, y]) => [dx + (x - Math.min(...xs)) * k, H - dy - (y - Math.min(...ys)) * k]) };
  }

  // Triangle de sommets lettres[0..2] et d'angles angles[0..2] (somme 180°) ; on écrit la mesure des angles « connus »
  // (indices), le troisième n'a pas de marque. rotation et miroir : le triangle peut être tourné et retourné.
  // Sujet officiel : sommets I (bas gauche), J (haut), K (droite), base inclinée de 12°.
  function triangleAngles(lettres, angles, connus, rotation = 12, miroir = false) {
    const rad = (d) => (d * Math.PI) / 180;
    const [a0, a1, a2] = angles.map(rad);
    const cote01 = Math.sin(a2) / Math.sin(a1); // côté P0P1, la base P0P2 mesure 1
    const P = [[0, 0], [cote01 * Math.cos(a0), cote01 * Math.sin(a0)], [1, 0]];
    const W = 320, H = 200;
    const { S } = cadrer(P, rotation, miroir, W, H, 26);
    let s = `<polygon points="${S.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>`;
    const arc = (A, B, C, r, texte, double) => {
      const a1 = Math.atan2(B[1] - A[1], B[0] - A[0]), a2 = Math.atan2(C[1] - A[1], C[0] - A[0]);
      let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const arcR = (rr) => `<path d="M${pt(A[0] + rr * Math.cos(a1), A[1] + rr * Math.sin(a1))} A${rr} ${rr} 0 0 ${d > 0 ? 1 : 0} ${pt(A[0] + rr * Math.cos(a1 + d), A[1] + rr * Math.sin(a1 + d))}" fill="none" stroke="#111" stroke-width="1.2"/>`;
      // La mesure s'écrit sur la bissectrice, assez loin du sommet pour tenir entre les deux côtés (plus l'angle est
      // fermé, plus elle s'éloigne), sans dépasser 42 % du plus petit des deux côtés.
      const cote = Math.min(Math.hypot(B[0] - A[0], B[1] - A[1]), Math.hypot(C[0] - A[0], C[1] - A[1]));
      const mid = a1 + d / 2, rt = Math.max(r + 14, Math.min(4 + 16 / Math.sin(Math.abs(d) / 2), 0.42 * cote));
      return arcR(r) + (double ? arcR(r - 4) : "") + `<text x="${(A[0] + rt * Math.cos(mid)).toFixed(1)}" y="${(A[1] + rt * Math.sin(mid) + 4.5).toFixed(1)}" font-size="13" text-anchor="middle" fill="#111">${texte}</text>`;
    };
    connus.forEach((i, n) => { s += arc(S[i], S[(i + 1) % 3], S[(i + 2) % 3], n === 0 ? 16 : 22, `${angles[i]}°`, n === 1); });
    const G = [(S[0][0] + S[1][0] + S[2][0]) / 3, (S[0][1] + S[1][1] + S[2][1]) / 3];
    const lab = (A, txt) => { const dx = A[0] - G[0], dy = A[1] - G[1], n = Math.hypot(dx, dy); return `<text x="${(A[0] + (dx / n) * 13).toFixed(1)}" y="${(A[1] + (dy / n) * 13 + 5).toFixed(1)}" font-size="15" text-anchor="middle" fill="#111">${txt}</text>`; };
    s += S.map((p, i) => lab(p, lettres[i])).join("");
    return svg(W, H, s, `Triangle ${lettres.join("")}`, 430);
  }

  // Triangle ABC (sommet B en face de la base AC), hauteur BH, base cotée par une flèche double, longueurs écrites.
  // rotation (0, 90, 180, 270) et miroir : le triangle peut être posé autrement ; les nombres restent droits.
  // Sujet officiel : base AC horizontale en bas, A à gauche.
  function triangleHauteur(x1, x2, h, c1, c2, lettres = ["A", "B", "C"], rotation = 0, miroir = false) {
    const b = x1 + x2;
    const A = [0, 0], C = [b, 0], H = [x1, 0], B = [x1, h];
    const cote = -0.11 * Math.max(b, h); // la flèche de la base, à l'extérieur (du côté opposé à B)
    const carre = 0.07 * Math.max(b, h), dir = x1 > 0 ? -1 : 1;
    const locaux = [A, B, C, H, [0, cote], [b, cote], [H[0] + dir * carre, 0], [H[0] + dir * carre, carre], [H[0], carre]];
    const W = 330, Hh = 230;
    const { S } = cadrer(locaux, rotation, miroir, W, Hh, 34);
    const [sA, sB, sC, sH, f1, f2, q1, q2, q3] = S;
    let s = `<polygon points="${[sA, sB, sC].map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="#e3e3e3" stroke="#333" stroke-width="1.6" stroke-linejoin="round"/>`;
    const seg = (P, Q) => `<line x1="${P[0].toFixed(1)}" y1="${P[1].toFixed(1)}" x2="${Q[0].toFixed(1)}" y2="${Q[1].toFixed(1)}" stroke="#333" stroke-width="1.6"/>`;
    s += seg(sB, sH);
    s += `<polygon points="${[sH, q1, q2, q3].map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="#cfcfcf" stroke="#333" stroke-width="1.2"/>`;
    // flèche double de la base
    const ux = (f2[0] - f1[0]) / Math.hypot(f2[0] - f1[0], f2[1] - f1[1]), uy = (f2[1] - f1[1]) / Math.hypot(f2[0] - f1[0], f2[1] - f1[1]);
    const tete = (P, sens) => { const [x, y] = P, bx = x + sens * 9 * ux, by = y + sens * 9 * uy; return `M${pt(x, y)} L${pt(bx - 5 * uy, by + 5 * ux)} L${pt(bx + 5 * uy, by - 5 * ux)}Z`; };
    s += seg([f1[0] + 3 * ux, f1[1] + 3 * uy], [f2[0] - 3 * ux, f2[1] - 3 * uy]) + `<path d="${tete(f1, 1)} ${tete(f2, -1)}" fill="#333"/>`;
    const G = [(sA[0] + sB[0] + sC[0]) / 3, (sA[1] + sB[1] + sC[1]) / 3];
    const t = (x, y, txt) => `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" font-size="14" text-anchor="middle" fill="#111">${txt}</text>`;
    const loin = (P, d, depuis = G) => { const dx = P[0] - depuis[0], dy = P[1] - depuis[1], n = Math.hypot(dx, dy) || 1; return [P[0] + (dx / n) * d, P[1] + (dy / n) * d]; };
    const milieu = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
    s += t(...loin(sA, 12), lettres[0]) + t(...loin(sB, 12), lettres[1]) + t(...loin(sC, 12), lettres[2]);
    s += t(...loin(milieu(sA, sB), 13), String(c1)) + t(...loin(milieu(sB, sC), 13), String(c2));
    // la hauteur : son nombre à côté du segment BH, du côté du plus grand des deux morceaux de base
    const mBH = milieu(sB, sH), vers = x1 >= x2 ? sA : sC;
    s += t(...loin(mBH, -13, vers), String(h));
    s += t(...loin(milieu(f1, f2), 14, milieu(sA, sC)), String(b));
    return svg(W, Hh, s, `Triangle ${lettres.join("")} avec la hauteur issue de ${lettres[1]}`, 400);
  }

  // Droite graduée de 0 à 3, l'unité partagée en d parts, point A sur la k-ième graduation.
  function droiteFraction(d, k, nom = "A") {
    const u = 150, x0 = 24, y = 46, fin = x0 + 3 * u + 30;
    let s = `<line x1="${x0 - 14}" y1="${y}" x2="${fin}" y2="${y}" stroke="#111" stroke-width="1.6"/><path d="M${fin - 9} ${y - 6} L${fin} ${y} L${fin - 9} ${y + 6}" fill="none" stroke="#111" stroke-width="1.6"/>`;
    for (let i = 0; i <= 3 * d; i++) {
      const x = x0 + (i * u) / d;
      s += `<line x1="${x.toFixed(1)}" y1="${y - 7}" x2="${x.toFixed(1)}" y2="${y + 7}" stroke="#111" stroke-width="1.6"/>`;
    }
    for (let n = 0; n <= 3; n++) s += `<text x="${x0 + n * u}" y="${y + 30}" font-size="21" font-weight="700" text-anchor="middle" fill="#111">${n}</text>`;
    s += `<text x="${(x0 + (k * u) / d).toFixed(1)}" y="${y - 15}" font-size="21" font-weight="700" text-anchor="middle" fill="#111">${nom}</text>`;
    return svg(fin + 6, 86, s, `Droite graduée de 0 à 3 avec le point ${nom}`);
  }

  // Repère : points [{nom, x, y}] ; abscisses de 0 à 5, ordonnées de −1 à 5.
  function repere(points) {
    const u = 34, ox = 40, oy = 214, xmin = -0.6, xmax = 5.8, ymin = -1.3, ymax = 5.9;
    const X = (v) => ox + v * u, Y = (v) => oy - v * u;
    let s = "";
    for (let i = 1; i <= 5; i++) s += `<line x1="${X(i)}" y1="${Y(ymin)}" x2="${X(i)}" y2="${Y(ymax - 0.3)}" stroke="#c9ced3" stroke-width="1"/>`;
    for (let j = -1; j <= 5; j++) if (j) s += `<line x1="${X(xmin)}" y1="${Y(j)}" x2="${X(xmax - 0.2)}" y2="${Y(j)}" stroke="#c9ced3" stroke-width="1"/>`;
    s += `<line x1="${X(xmin)}" y1="${Y(0)}" x2="${X(xmax)}" y2="${Y(0)}" stroke="#111" stroke-width="1.4"/><path d="M${X(xmax) - 7} ${Y(0) - 5} L${X(xmax)} ${Y(0)} L${X(xmax) - 7} ${Y(0) + 5}" fill="none" stroke="#111" stroke-width="1.4"/>`;
    s += `<line x1="${X(0)}" y1="${Y(ymin)}" x2="${X(0)}" y2="${Y(ymax)}" stroke="#111" stroke-width="1.4"/><path d="M${X(0) - 5} ${Y(ymax) + 7} L${X(0)} ${Y(ymax)} L${X(0) + 5} ${Y(ymax) + 7}" fill="none" stroke="#111" stroke-width="1.4"/>`;
    for (let i = 1; i <= 5; i++) s += `<text x="${X(i) + 3}" y="${Y(0) + 15}" font-size="12" fill="#111">${i}</text>`;
    for (let j = -1; j <= 5; j++) if (j) s += `<text x="${X(0) - 7}" y="${Y(j) + 4}" font-size="12" text-anchor="end" fill="#111">${neg(j)}</text>`;
    s += `<text x="${X(0) - 7}" y="${Y(0) + 15}" font-size="12" text-anchor="end" fill="#111">0</text>`;
    s += `<text x="${X(xmax) - 6}" y="${Y(0) + 30}" font-size="15" font-style="italic" font-family="Times New Roman,serif" fill="#111">x</text><text x="${X(0) - 22}" y="${Y(ymax) + 10}" font-size="15" font-style="italic" font-family="Times New Roman,serif" fill="#111">y</text>`;
    for (const p of points) {
      const x = X(p.x), y = Y(p.y), r = 5;
      s += `<path d="M${x - r} ${y - r} L${x + r} ${y + r} M${x - r} ${y + r} L${x + r} ${y - r}" stroke="#2747b0" stroke-width="2.2"/>`;
      s += `<text x="${x + 7}" y="${y - 8}" font-size="15" fill="#2747b0">${p.nom}</text>`;
    }
    return svg(X(xmax) + 10, Y(ymin) + 6, s, "Repère avec quatre points A, B, C et D", 370);
  }

  // Rectangle partagé en colonnes × lignes parts égales ; colories = numéros des parts coloriées (ligne par ligne).
  function rectanglePartage(colonnes, lignes, colories, etiquette, largeur = 220, petite = false) {
    const l = largeur / colonnes, h = Math.min(l, 150 / lignes) * (lignes === 1 ? 2.2 : 1);
    let s = "";
    for (let j = 0; j < lignes; j++) for (let i = 0; i < colonnes; i++)
      s += `<rect x="${(2 + i * l).toFixed(1)}" y="${(2 + j * h).toFixed(1)}" width="${l.toFixed(1)}" height="${h.toFixed(1)}" fill="${colories.includes(j * colonnes + i) ? (petite ? PALE : BLEU) : "#fff"}" stroke="${BORD}" stroke-width="1.6"/>`;
    const W = colonnes * l + 4, H = lignes * h + 4;
    return petite ? `<svg class="fig-choix" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" role="img" aria-label="${etiquette}" xmlns="http://www.w3.org/2000/svg">${s}</svg>` : svg(W, H, s, etiquette, 300);
  }
  const GRILLES = { 6: [3, 2], 8: [4, 2], 9: [3, 3], 10: [5, 2], 12: [4, 3] };
  // k parts coloriées parmi n, à des places tirées au hasard.
  const places = (r, n, k) => r.melanger([...Array(n).keys()]).slice(0, k);
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);

  // ---------- Les 22 questions ----------
  // Chaque sujet généré tire une « forme » (disposition, sens, écriture) dans la même compétence et au même niveau que le
  // sujet officiel ; `forme` la nomme (recette : chaque question doit en produire plusieurs).
  const Q = [];

  // 1 — multiplier par 0,1
  Q.push({
    num: 1, domaine: "NC", competence: "Connaître l’effet d’une multiplication par 0,1 (ou 0,01, 0,001)",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      const d = officiel ? 1 : r.parmi([1, 2, 2, 3]);
      const forme = officiel ? "effet" : r.parmi(["effet", "revient"]);
      const op = "0," + "0".repeat(d - 1) + "1", f1 = nb(String(10 ** d)), f2 = nb(String(10 ** (d + 1)));
      if (forme === "revient")
        return {
          forme: `revient-${d}`,
          enonce: `Multiplier un nombre par ${op} revient à…`,
          choix: [
            c(`le diviser par ${f1}.`, true),
            c(`le diviser par ${f2}.`, false, `Confond « diviser par ${f1} » et « diviser par ${f2} » : compte aussi le « 0 » et la virgule devant le 1.`),
            c(`le multiplier par ${f1}.`, false, `Confond « multiplier par ${op} » et « multiplier par ${f1} ».`),
            c(`le multiplier par ${f2}.`, false, `Confond « multiplier par ${op} » et « multiplier par ${f2} » : compte aussi le « 0 » et la virgule devant le 1.`),
          ],
        };
      return {
        forme: `effet-${d}`,
        enonce: `Lorsqu’on multiplie un nombre par ${op} le nombre obtenu est…`,
        choix: [
          c(`${f1} fois plus petit.`, true),
          c(`${f2} fois plus petit.`, false, `Confond « diviser par ${f1} » et « diviser par ${f2} » : compte aussi le « 0 » et la virgule devant le 1.`),
          c(`${f1} fois plus grand.`, false, `Confond « multiplier par ${op} » et « multiplier par ${f1} ».`),
          c(`${f2} fois plus grand.`, false, `Confond « multiplier par ${op} » et « multiplier par ${f2} » : compte aussi le « 0 » et la virgule devant le 1.`),
        ],
      };
    },
  });

  // 1 (sujets 2024 et 2025) — soustraire deux entiers en passant la dizaine : 14 − 6
  Q[0].annees = [2026];
  Q[0].variantes = [{
    id: "4e-soustraire", annees: [2024, 2025],
    competence: "Soustraire des nombres entiers sans poser l’opération",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      let a = 14, b = 6;
      // Les pièges de la DEPP : la moitié de a, la moitié du nombre pair juste en dessous, a − (b − 1).
      if (!officiel) do { a = r.parmi([12, 14, 16, 18]); b = r.entier(a - 9, 9); } while (new Set([a - b, a / 2, a / 2 - 1, a - b + 1]).size < 4 || (a === 14 && b === 6));
      // Sujet généré : la soustraction, ou la même différence cherchée comme un complément (b + … = a).
      const forme = officiel ? "difference" : r.parmi(["difference", "complement"]);
      return {
        forme,
        enonce: forme === "difference" ? `${a} ${MOINS} ${b} = …` : `${b} + … = ${a}`,
        choix: [
          c(String(a / 2 - 1), false, `Prend la moitié de ${a - 2} : ne maîtrise pas les tables d’addition ou les moitiés, ou fait une erreur de calcul.`),
          c(String(a - b + 1), false, `Calcule ${a} ${MOINS} ${b - 1} : ne maîtrise pas les tables d’addition ou fait une erreur de calcul.`),
          c(String(a - b), true),
          c(String(a / 2), false, `Prend la moitié de ${a} : ne maîtrise pas les tables d’addition ou fait une erreur de calcul.`),
        ],
      };
    },
  }];

  // 2 — moitié d'un nombre pair de dizaines impaires
  Q.push({
    num: 2, domaine: "NC", competence: "Calculer la moitié d’un nombre entier pair",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      const N = officiel ? 7 : r.parmi([5, 9, 11, 13, 15, 17, 19]);
      const n = N * 10;
      const forme = officiel ? "moitie" : r.parmi(["moitie", "division", "double"]);
      const enonce = { moitie: `Combien vaut la moitié de ${n} ?`, division: `${n} : 2 = …`, double: `Quel nombre a pour double ${n} ?` }[forme];
      return {
        forme, enonce,
        choix: [
          c(String((N + 2) * 5), false, `Confond avec la moitié de ${(N + 2) * 10}.`),
          c(String(N * 5), true),
          c(String((N + 1) * 5), false, `Confond avec la moitié de ${(N + 1) * 10}.`),
          c(String((N - 1) * 5), false, `Confond avec la moitié de ${(N - 1) * 10}.`),
        ],
      };
    },
  });

  // 3 — fraction coloriée d'une surface partagée en parts égales
  Q.push({
    num: 3, domaine: "GM", competence: "Déterminer la fraction d’une surface",
    entrainement: AUTO("NC13", "Fraction d’une quantité"),
    generer(r, officiel) {
      let n = 8, k = 5, forme = "disque", figure;
      if (officiel) figure = disque(8, [7, 0, 1], 70, "Disque partagé en 8 parts égales, 5 coloriées");
      else {
        // Un disque, une bande ou un quadrillage ; les parts coloriées sont n'importe où.
        forme = r.parmi(["disque", "bande", "grille"]);
        n = forme === "grille" ? r.parmi([6, 8, 9, 10, 12]) : r.parmi([5, 6, 7, 8, 9, 10]);
        do k = r.entier(2, n - 2); while (2 * k === n);
        const col = places(r, n, k), blancs = [...Array(n).keys()].filter((i) => !col.includes(i));
        const lib = `partagé en ${n} parts égales, ${k} coloriées`;
        if (forme === "disque") figure = disque(n, blancs, 70, `Disque ${lib}`);
        else if (forme === "bande") figure = rectanglePartage(n, 1, col, `Rectangle ${lib}`, Math.min(300, 40 * n));
        else figure = rectanglePartage(GRILLES[n][0], GRILLES[n][1], col, `Rectangle quadrillé ${lib}`, 46 * GRILLES[n][0]);
      }
      return {
        forme,
        enonce: "Quelle fraction de la surface est coloriée ?",
        figure,
        choix: [
          c(frac(n - k, k), false, "Confond la proportion par rapport au total et par rapport au reste : donne les parts blanches sur les parts bleues."),
          c(frac(k, n), true),
          c(frac(n - k, n), false, "Interprète mal le mot « coloriée » : donne les parts blanches sur le nombre total de parts."),
          c(frac(k, n - k), false, "Confond la proportion par rapport au total et par rapport au reste : donne les parts bleues sur les parts blanches."),
        ],
      };
    },
  });

  // 4 — addition d'entiers (ajouter un nombre proche d'une dizaine)
  Q.push({
    num: 4, domaine: "NC", competence: "Additionner des nombres entiers sans poser l’opération",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      let a = 168, t = 1, u = 8;
      if (!officiel) { t = r.entier(1, 3); u = r.parmi([7, 8, 9]); a = r.entier(10, 89) * 10 + r.entier(3, 9); }
      const b = 10 * t + u, haut = 10 * (t + 1);
      const forme = officiel ? "grand-dabord" : r.parmi(["grand-dabord", "petit-dabord"]);
      return {
        forme,
        enonce: forme === "grand-dabord" ? `${a} + ${b} = …` : `${b} + ${a} = …`,
        choix: [
          c(String(a + haut + (10 - u)), false, `Ajoute ${haut} puis ajoute ${10 - u} au lieu de l’enlever.`),
          c(String(a + haut), false, `Ajoute ${haut} et oublie d’enlever ${10 - u} ensuite.`),
          c(String(a + u), false, `Oublie d’ajouter ${10 * t} (ou fait une erreur de retenue).`),
          c(String(a + b), true),
        ],
      };
    },
  });

  // 5 — somme de deux relatifs
  Q.push({
    num: 5, domaine: "NC", competence: "Additionner des nombres entiers relatifs",
    entrainement: AUTO("NC05", "Opposés, sommes et différences de relatifs"),
    generer(r, officiel) {
      let a = 5, b = 7, ecriture = "negatif-dabord";
      // Sujet généré : le positif est plus grand ou plus petit (résultat positif ou négatif), écrit en premier ou en second.
      if (!officiel) { do { a = r.entier(2, 9); b = r.entier(2, 9); } while (a === b); ecriture = r.parmi(["negatif-dabord", "positif-dabord"]); }
      const R = b - a;
      const enonce = ecriture === "negatif-dabord" ? `${MOINS}${a} + ${b} = …` : `${b} + (${MOINS}${a}) = …`;
      return {
        forme: `${ecriture}-${R > 0 ? "positif" : "negatif"}`,
        enonce,
        choix: [
          c(neg(R), true),
          c(neg(-(a + b)), false, `Gère mal les signes : calcule ${MOINS}(${a} + ${b}).`),
          c(String(a + b), false, `Gère mal les signes : calcule ${a} + ${b}.`),
          c(neg(-R), false, R > 0 ? `Gère mal les signes : calcule ${MOINS}(${b} ${MOINS} ${a}).` : `Gère mal les signes : calcule ${a} ${MOINS} ${b} et garde le signe +.`),
        ],
      };
    },
  });

  // 6 — réduire a × a + a × 3 + 7
  Q.push({
    num: 6, domaine: "NC", competence: "Réduire une expression littérale",
    entrainement: AUTO("NC20", "Réduire et simplifier une expression"),
    generer(r, officiel) {
      const l = officiel ? "a" : r.parmi(["a", "x", "b", "y", "t"]);
      const p = officiel ? 3 : r.entier(2, 9), q = officiel ? 7 : r.entier(2, 9);
      const L = lettre(l);
      // Sujet généré : les trois termes dans n'importe quel ordre, le facteur numérique avant ou après la lettre.
      const termes = { carre: `${L} × ${L}`, produit: officiel || r.suivant() < 0.5 ? `${L} × ${p}` : `${p} × ${L}`, nombre: String(q) };
      const ordre = officiel ? ["carre", "produit", "nombre"] : r.melanger(["carre", "produit", "nombre"]);
      return {
        forme: ordre.join("-") + (termes.produit.startsWith(L) ? "" : "-nombre-devant"),
        enonce: `${ordre.map((x) => termes[x]).join(" + ")} = …`,
        choix: [
          c(`${L}² + ${p + q}${L}`, false, `Réduit bien ${l} × ${l} mais ne respecte pas les priorités : calcule ${p} + ${q} au lieu de réduire ${l} × ${p}.`),
          c(`2${L} + ${L}${p} + ${q}`, false, `Confond carré et double en réduisant ${l} × ${l}.`),
          c(`${L}² + ${p}${L} + ${q}`, true),
          c(`${1 + p + q}${L}`, false, `Ne tient pas compte de la nature de chaque terme et additionne tout : 1 + ${p} + ${q} = ${1 + p + q}.`),
        ],
      };
    },
  });

  // 6 (sujets 2024 et 2025) — réduire 2n + 3n
  Q[5].annees = [2026];
  Q[5].variantes = [{
    id: "4e-reduire-somme", annees: [2024, 2025],
    competence: "Réduire une expression littérale",
    entrainement: AUTO("NC20", "Réduire et simplifier une expression"),
    generer(r, officiel) {
      const l = officiel ? "n" : r.parmi(["n", "x", "a", "y", "t"]);
      const forme = officiel ? "somme" : r.parmi(["somme", "somme", "difference"]);
      let p = 2, q = 3;
      if (forme === "somme") { if (!officiel) do { p = r.entier(2, 7); q = r.entier(2, 7); } while (p === q || p + q === p * q || (p === 2 && q === 3)); }
      else do { p = r.entier(5, 9); q = r.entier(2, 6); } while (p - q < 2);
      const L = lettre(l);
      if (forme === "difference")
        return {
          forme,
          enonce: `Si l’on réduit l’expression ${p}${L} ${MOINS} ${q}${L} alors on obtient :`,
          choix: [
            c(`${p - q}${L}²`, false, `Repère le facteur commun et calcule bien ${p} ${MOINS} ${q}, mais met ${l}² en facteur au lieu de ${l}.`),
            c(`${p * q}${L}²`, false, `Confond la réduction et le produit : calcule ${p}${l} × ${q}${l}.`),
            c(`${p - q}${L}`, true),
            c(`${p * q}${L}`, false, `Met bien ${l} en facteur mais multiplie ${p} et ${q} au lieu de les soustraire.`),
          ],
        };
      return {
        forme,
        enonce: `Si l’on réduit l’expression ${p}${L} + ${q}${L} alors on obtient :`,
        choix: [
          c(`${p + q}${L}²`, false, `Repère le facteur commun et additionne bien ${p} et ${q}, mais met ${l}² en facteur au lieu de ${l}.`),
          c(`${p * q}${L}²`, false, `Confond somme et produit : calcule ${p}${l} × ${q}${l}.`),
          c(`${p + q}${L}`, true),
          c(`${p * q}${L}`, false, `Met bien ${l} en facteur mais multiplie ${p} et ${q} au lieu de les additionner.`),
        ],
      };
    },
  }];

  // 7 — convertir des minutes en heures et minutes (ou l'inverse)
  const SPECTACLES = [["Max assiste à un spectacle qui dure", "Max"], ["Léa regarde un film qui dure", "Léa"], ["Un match de rugby dure, avec la mi-temps,", ""], ["Une randonnée dure", ""]];
  Q.push({
    num: 7, domaine: "GM", competence: "Convertir une durée en heures et minutes",
    entrainement: AUTO("GM03", "Durées et horaires"),
    generer(r, officiel) {
      const forme = officiel ? "en-heures" : r.parmi(["en-heures", "en-heures", "en-minutes"]);
      const h = officiel ? 2 : r.parmi([2, 2, 3]);
      const reste = officiel ? 15 : h === 2 ? r.parmi([5, 10, 20, 25, 30, 35]) : r.parmi([5, 10, 15]);
      const M = 60 * h + reste;
      const [debut] = officiel ? SPECTACLES[0] : r.parmi(SPECTACLES);
      if (forme === "en-minutes")
        return {
          forme: `${forme}-${h}h`,
          enonce: `${debut} ${h} h ${reste} min. Combien cela fait-il de minutes ?`,
          choix: [
            c(`${100 * h + reste} min`, false, "Compte 100 min dans une heure, comme dans le système décimal."),
            c(`${60 + reste} min`, false, `Ne convertit qu’une des ${h} heures en minutes.`),
            c(`${M} min`, true),
            c(`${60 * h} min`, false, `Convertit bien les ${h} heures mais oublie d’ajouter les ${reste} minutes.`),
          ],
        };
      return {
        forme: `${forme}-${h}h`,
        enonce: `${debut} ${M} minutes, comment cette durée peut-elle s’écrire autrement ?`,
        choix: [
          c(`1 h ${M - 100} min`, false, "Compte 1 h pour 100 min, comme dans le système décimal."),
          c(`${h - 1} h ${reste} min`, false, `Décompose ${M} min en ${60 * h} min + ${reste} min mais se trompe en convertissant ${60 * h} min en heures.`),
          c(`${h} h ${reste} min`, true),
          c(`${h} h ${M - 100} min`, false, `Voit bien que ${M} min dépasse ${h} h, mais reprend les ${M - 100} minutes dans le résultat.`),
        ],
      };
    },
  });

  // 8 — factoriser pour calculer
  Q.push({
    num: 8, domaine: "NC", competence: "Utiliser la factorisation pour calculer mentalement",
    entrainement: AUTO("NC24", "Factoriser par facteur commun"),
    generer(r, officiel) {
      let k = 12, a = 7;
      if (!officiel) { k = r.entier(11, 19); a = r.parmi([2, 3, 4, 6, 7, 8]); }
      const b = 10 - a;
      // Sujet généré : le facteur commun à gauche ou à droite dans chaque produit.
      const places = officiel ? [0, 0] : [r.entier(0, 1), r.entier(0, 1)];
      const produit = (x, p) => (p === 0 ? `${k} × ${x}` : `${x} × ${k}`);
      return {
        forme: `facteur-${places.join("")}`,
        enonce: `${produit(a, places[0])} + ${produit(b, places[1])} = …`,
        choix: [
          c(String(k * 10), true),
          c(String(2 * k * 10), false, `Factorise de façon incomplète : met ${k} en facteur deux fois, (${k} + ${k}) × (${a} + ${b}).`),
          c(String(k * b), false, `Ne factorise pas et ne calcule que le second produit, ${k} × ${b}.`),
          c(String(k * a), false, `Ne factorise pas et ne calcule que le premier produit, ${k} × ${a}.`),
        ],
      };
    },
  });

  // 9 — troisième angle d'un triangle
  const TRIPLETS = [["I", "J", "K"], ["A", "B", "C"], ["E", "F", "G"], ["R", "S", "T"], ["M", "N", "P"], ["D", "E", "F"], ["U", "V", "W"]];
  Q.push({
    num: 9, domaine: "EG", competence: "Calculer un angle d’un triangle connaissant les deux autres",
    entrainement: AUTO("EG07", "Angles d’un triangle"),
    generer(r, officiel) {
      // Officiel : angles 50° en I et 20° en K, on cherche l'angle en J (IJK).
      let lettres = TRIPLETS[0], angles = [50, 110, 20], cherche = 1, rotation = 12, miroir = false;
      if (!officiel) {
        // Triangle de n'importe quelle forme (aigu ou obtus), tourné et retourné ; l'angle cherché à n'importe quel sommet.
        let x, y;
        do { x = 5 * r.entier(5, 23); y = 5 * r.entier(5, 23); }
        while (180 - x - y < 25 || x === y || x + y === 90 || [x, y].includes(180 - x - y));
        cherche = r.entier(0, 2);
        const autres = [0, 1, 2].filter((i) => i !== cherche);
        angles = [0, 0, 0]; angles[autres[0]] = x; angles[autres[1]] = y; angles[cherche] = 180 - x - y;
        lettres = r.melanger(r.parmi(TRIPLETS));
        rotation = r.entier(0, 359); miroir = r.suivant() < 0.5;
      }
      const autres = [0, 1, 2].filter((i) => i !== cherche);
      // Le nom de l'angle : le sommet cherché au milieu, les deux autres sommets autour (dans un ordre au hasard).
      const [g, d] = officiel ? autres : r.melanger(autres);
      const nom = lettres[g] + lettres[cherche] + lettres[d];
      const beta = angles[cherche], alpha = angles[g], gamma = angles[d];
      const vals = [[gamma, `Associe la notation ${nom} à l’angle de sommet ${lettres[d]} et non à celui de sommet ${lettres[cherche]}.`], [alpha, `Associe la notation ${nom} à l’angle de sommet ${lettres[g]} et non à celui de sommet ${lettres[cherche]}.`], [alpha + gamma, `Calcule ${alpha}° + ${gamma}° mais oublie de soustraire le résultat à 180°.`], [beta, ""]];
      vals.sort((x, y) => x[0] - y[0]);
      return {
        forme: `sommet-${["premier", "milieu", "dernier"][cherche]}${beta > 90 ? "-obtus" : ""}${miroir ? "-retourne" : ""}`,
        enonce: `La mesure de l’angle ${angLong(nom)} est égale à…`,
        figure: triangleAngles(lettres, angles, officiel ? [0, 2] : autres, rotation, miroir),
        choix: vals.map(([v, e]) => c(`${v}°`, v === beta, e)),
      };
    },
  });

  // 10 — recomposer 14 + 6/10 + 2/1000
  Q.push({
    num: 10, domaine: "NC", competence: "Associer différentes écritures d’un nombre décimal",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer(r, officiel) {
      let E = 14, a = 6, b = 2;
      if (!officiel) { E = r.entier(11, 98); a = r.entier(1, 9); b = r.entier(1, 9); }
      // Sujet généré : les trois morceaux dans n'importe quel ordre.
      const morceaux = { E: String(E), dixiemes: frac(a, 10), milliemes: frac(b, 1000) };
      const ordre = officiel ? ["E", "dixiemes", "milliemes"] : r.melanger(["E", "dixiemes", "milliemes"]);
      return {
        forme: ordre.join("-"),
        enonce: `${ordre.map((x) => morceaux[x]).join(" + ")} = …`,
        choix: [
          c(nb(`${E}${a}${b}`), false, "Écrit le nombre entier suivi des deux numérateurs, sans tenir compte des dénominateurs."),
          c(`${E},${a}0${b}`, true),
          c(`${E},${a}${b}`, false, `Ne tient pas compte du dénominateur 1 000 et place le ${b} juste après le ${a}.`),
          c(`${nb(String(E * 10))},${a}${b}`, false, `Ne tient pas compte du dénominateur 1 000 et voit en plus ${E} comme ${E} dizaines.`),
        ],
      };
    },
  });

  // 11 — distance parcourue pendant une durée simple (30 min, 15 min, 1 h 30 min)
  const ROULEURS = [["Un cycliste roule", [16, 20, 24, 28, 18, 22, 26]], ["Une coureuse court", [8, 10, 12, 14]], ["Un bateau navigue", [16, 20, 24, 28, 30]]];
  Q.push({
    num: 11, domaine: "OGD", competence: "Utiliser la proportionnalité pour calculer une distance",
    entrainement: AUTO("PF08", "Vitesse et grandeurs composées"),
    generer(r, officiel) {
      const [sujet, vitesses] = officiel ? ROULEURS[0] : r.parmi(ROULEURS);
      const forme = officiel ? "30min" : r.parmi(["30min", "30min", "15min", "1h30"]);
      const v = officiel ? 18 : r.parmi(forme === "15min" ? vitesses.filter((x) => x % 4 === 0) : vitesses);
      const pronom = sujet.startsWith("Une") ? "elle" : "il";
      const duree = { "30min": "30 min", "15min": "15 min", "1h30": "1 h 30 min" }[forme];
      const choix = {
        "30min": [
          c(`${v} km`, false, `Reprend simplement les ${v} km de ${v} km/h.`),
          c(`${2 * v} km`, false, "Sait que 30 min est la moitié d’une heure, mais multiplie par 2 au lieu de diviser."),
          c(`${dec(v * 0.3)} km`, false, "Prend 30 min pour 0,3 h, comme dans le système décimal."),
          c(`${v / 2} km`, true)],
        "15min": [
          c(`${v} km`, false, `Reprend simplement les ${v} km de ${v} km/h.`),
          c(`${4 * v} km`, false, "Sait que 15 min est le quart d’une heure, mais multiplie par 4 au lieu de diviser."),
          c(`${dec(v * 0.15)} km`, false, "Prend 15 min pour 0,15 h, comme dans le système décimal."),
          c(`${v / 4} km`, true)],
        "1h30": [
          c(`${v} km`, false, `Ne compte que la première heure : reprend les ${v} km de ${v} km/h.`),
          c(`${v / 2} km`, false, "Ne compte que la demi-heure."),
          c(`${dec(v * 1.3)} km`, false, "Prend 1 h 30 min pour 1,3 h, comme dans le système décimal."),
          c(`${dec(v * 1.5)} km`, true)],
      }[forme];
      return {
        forme,
        enonce: `${sujet} pendant ${duree} à la vitesse moyenne de ${v} km/h.<br><strong>Quelle distance parcourt-${pronom} ?</strong>`,
        choix,
      };
    },
  });

  // 12 — unités de numération (× 100 ou : 100 entre deux rangs)
  const RANGS = ["millièmes", "centièmes", "dixièmes", "unités", "dizaines", "centaines", "milliers"];
  Q.push({
    num: 12, domaine: "NC", competence: "Utiliser les unités de numération décimale",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      const n = officiel ? 43 : r.entier(1, 9) * 10 + r.entier(1, 9);
      // i : le rang de l'unité la plus grande ; l'autre est deux rangs en dessous.
      const i = officiel ? 6 : r.entier(2, 6), grand = RANGS[i], petit = RANGS[i - 2];
      const forme = officiel ? "vers-petit" : r.parmi(["vers-petit", "vers-grand"]);
      if (forme === "vers-grand") {
        const N = n * 100;
        return {
          forme: `${forme}-${grand}`,
          enonce: `Compléter par le nombre qui convient :<br><span class="calcul">${nb(String(N))} ${petit} = … ${grand}</span>`,
          choix: [
            c(nb(String(N * 100)), false, `Multiplie ${nb(String(N))} par 100 au lieu de le diviser.`),
            c(String(n), true),
            c(nb(String(N)), false, `Reprend simplement le nombre ${nb(String(N))} de l’énoncé.`),
            c(nb(String(N / 10)), false, `Se trompe d’un rang et divise ${nb(String(N))} par 10 seulement.`),
          ],
        };
      }
      return {
        forme: `${forme}-${grand}`,
        enonce: `Compléter par le nombre qui convient :<br><span class="calcul">${n} ${grand} = … ${petit}</span>`,
        choix: [
          c(decaler(String(n), -1), false, `Divise ${n} par 10 au lieu de le multiplier par 100 (43 milliers vus comme 43 unités).`),
          c(nb(String(n * 100)), true),
          c(String(n), false, `Reprend simplement le nombre ${n} de l’énoncé.`),
          c(nb(String(n * 10)), false, `Se trompe d’un rang et multiplie ${n} par 10 seulement.`),
        ],
      };
    },
  });

  // 13 — dans quelle figure a-t-on colorié p/q ?
  const CIBLES = [[3, 4], [2, 3], [3, 5], [4, 5], [2, 5]];
  Q.push({
    num: 13, domaine: "GM", competence: "Reconnaître une fraction d’une surface partagée en parts égales",
    entrainement: AUTO("NC09", "Fractions équivalentes et simplification"),
    generer(r, officiel) {
      const [p, q] = officiel ? CIBLES[0] : r.parmi(CIBLES);
      const lbl = (t) => `Figure : ${t}`;
      // Bande : p parts étroites coloriées, les parts blanches (plus larges ou plus étroites) couvrent autant.
      const w = 24, ww = (p * w) / (q - p);
      const fBande = bande([...Array(p).fill(w), ...Array(q - p).fill(ww)], [...Array(p).fill(true), ...Array(q - p).fill(false)], lbl(`rectangle en ${q} parts inégales, ${p} coloriées`));
      // Rectangle en bandes horizontales : une des parts coloriées est deux fois plus haute.
      const fBandes = bandes([...Array(p - 1).fill(1), 2, ...Array(q - p).fill(1)], [...Array(p).fill(true), ...Array(q - p).fill(false)], lbl(`rectangle en ${q} bandes inégales, ${p} coloriées`));
      // Disque en morceaux : 1/2, 1/4, 1/8… coloriés, le reste en parts blanches.
      const reste = 1 / 2 ** p;
      const morceaux = [...Array(q - p).fill([reste / (q - p), false]), ...Array.from({ length: p }, (_, i) => [1 / 2 ** (p - i), true])];
      const fMorceaux = petite(78, 78, disqueMorceaux(morceaux, 36), lbl(`disque en ${q} parts inégales, ${p} coloriées`));
      // La bonne figure : des parts égales (disque en 2q ou en q parts, bande en q parts, quadrillage 2 × q).
      const forme = officiel ? "disque-double" : r.parmi(["disque-double", "disque", "bande", "grille"]);
      let fJuste;
      if (forme === "disque-double" || forme === "disque") {
        const n = forme === "disque" ? q : 2 * q, k = forme === "disque" ? p : 2 * p;
        const col = officiel ? null : places(r, n, k);
        const blancs = officiel ? Array.from({ length: n - k }, (_, i) => i) : [...Array(n).keys()].filter((i) => !col.includes(i));
        let s = "";
        for (let i = 0; i < n; i++) s += secteur(39, 39, 36, (i * 360) / n, ((i + 1) * 360) / n, blancs.includes(i) ? "#fff" : BLEU);
        fJuste = petite(78, 78, s, lbl(`disque en ${n} parts égales, ${k} coloriées`));
      } else if (forme === "bande") {
        // Même gabarit que la bande piège (même hauteur, même longueur) : la bonne figure ne se repère pas à sa taille.
        const col = places(r, q, p);
        fJuste = bande(Array(q).fill((2 * p * w) / q), [...Array(q).keys()].map((i) => col.includes(i)), lbl(`rectangle en ${q} parts égales, ${p} coloriées`));
      } else {
        // Quadrillage 2 × q dans le même cadre que le rectangle en bandes piège.
        const col = places(r, 2 * q, 2 * p), lw = 100 / q;
        let s = "";
        for (let j = 0; j < 2; j++) for (let i = 0; i < q; i++) s += `<rect x="${(2 + i * lw).toFixed(1)}" y="${2 + j * 38}" width="${lw.toFixed(1)}" height="38" fill="${col.includes(j * q + i) ? PALE : "#fff"}" stroke="${BORD}" stroke-width="1.6"/>`;
        fJuste = petite(104, 80, s, lbl(`rectangle quadrillé en ${2 * q} parts égales, ${2 * p} coloriées`));
      }
      const piege = "Compte les parts bleues et le nombre total de parts sans tenir compte de leur taille.";
      // Lot EN4d (choix de Gwenaël, 14/11) : dans les jumeaux, la bonne figure n'est plus la seule en parts égales. Le
      // rectangle en bandes inégales laisse la place au piège classique « p pour q » : p parts coloriées et q parts
      // blanches, toutes égales (3 pour 4 = 3/7, pas 3/4). Sa forme n'est jamais celle de la bonne figure.
      let fPourQ = fBandes, piegePourQ = piege;
      if (!officiel) {
        const n = p + q, col = places(r, n, p);
        if (forme === "bande" || forme === "grille") {
          let sp = "";
          for (let i = 0; i < n; i++) sp += secteur(39, 39, 36, (i * 360) / n, ((i + 1) * 360) / n, col.includes(i) ? BLEU : "#fff");
          fPourQ = petite(78, 78, sp, lbl(`disque en ${n} parts égales, ${p} coloriées`));
        } else {
          fPourQ = bande(Array(n).fill((2 * p * w) / n), [...Array(n).keys()].map((i) => col.includes(i)), lbl(`rectangle en ${n} parts égales, ${p} coloriées`));
        }
        piegePourQ = `Lit ${p} parts coloriées pour ${q} parts blanches comme ${p}/${q} : compare les parts coloriées aux parts blanches au lieu de les compter sur le total.`;
      }
      return {
        forme,
        enonce: `Dans quelle figure a-t-on colorié ${p}/${q} de la surface ?`,
        choixFigures: true,
        choix: [c(fBande, false, piege), c(fPourQ, false, piegePourQ), c(fMorceaux, false, piege), c(fJuste, true)],
      };
    },
  });

  // 14 — différence de deux relatifs (on soustrait un négatif)
  Q.push({
    num: 14, domaine: "NC", competence: "Soustraire des nombres entiers relatifs",
    entrainement: AUTO("NC05", "Opposés, sommes et différences de relatifs"),
    generer(r, officiel) {
      let x = 7, b = 5;
      // Sujet généré : le premier nombre est positif ou négatif, le nombre soustrait plus petit ou plus grand en distance à zéro.
      if (!officiel) do { x = r.entier(2, 9) * (r.suivant() < 0.6 ? 1 : -1); b = r.entier(2, 9); } while (Math.abs(x) === b);
      const R = x + b, faux = x - b;
      return {
        forme: `${x > 0 ? "premier-positif" : "premier-negatif"}-${b > Math.abs(x) ? "grand" : "petit"}`,
        enonce: `${neg(x)} ${MOINS} (${MOINS}${b}) = …`,
        choix: [
          c(neg(R), true),
          c(neg(-R), false, `Ne sait pas soustraire un relatif : trouve l’opposé du résultat, ${neg(-R)}.`),
          c(neg(faux), false, `Ne sait pas soustraire un relatif : calcule ${neg(x)} ${MOINS} ${b}.`),
          c(neg(-faux), false, `Ne sait pas soustraire un relatif : calcule ${MOINS}(${neg(x)} ${MOINS} ${b}).`),
        ],
      };
    },
  });

  // 15 — abscisse fractionnaire sur une droite graduée
  Q.push({
    num: 15, domaine: "NC", competence: "Déterminer l’abscisse d’un point sur une droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer(r, officiel) {
      let d = 4, k = 3, nom = "A";
      // Sujet généré : le point est entre 0 et 1, entre 1 et 2 ou entre 2 et 3.
      if (!officiel) { d = r.parmi([3, 4, 5, 6, 8]); do k = r.entier(2, 3 * d - 1); while (pgcd(k, d) > 1); nom = r.parmi(["A", "B", "M", "P"]); }
      return {
        forme: `entre-${Math.floor(k / d)}-et-${Math.floor(k / d) + 1}`,
        enonce: `Quelle est l’abscisse du point ${nom} ?`,
        figure: droiteFraction(d, k, nom),
        choix: [
          c(dec(k / 10), false, `Compte les parts entre l’origine et ${nom} et répond en dixièmes, sans tenir compte du partage de l’unité.`),
          c(frac(k, d), true),
          c(frac(d, k), false, "Trouve sans doute le bon partage mais inverse l’écriture de la fraction."),
          c(String(k), false, `Compte les parts entre l’origine et ${nom} comme si la droite était graduée de 1 en 1.`),
        ],
      };
    },
  });

  // 16 — 0,3 s'écrit aussi…
  Q.push({
    num: 16, domaine: "NC", competence: "Associer différentes écritures d’un nombre décimal",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer(r, officiel) {
      const forme = officiel ? "dixiemes" : r.parmi(["dixiemes", "centiemes", "deux-chiffres"]);
      if (forme === "centiemes") {
        const a = r.parmi([2, 3, 4, 5, 6, 7, 8, 9]);
        return {
          forme, enonce: `0,0${a} s’écrit aussi…`,
          choix: [c(frac(1, a), false, `Associe 0,0${a} à « un sur ${a} » : prend ${a} pour le dénominateur.`), c(frac(a, 100), true), c(frac(a, 10), false, `Se trompe sur le rang du chiffre ${a} : dixièmes au lieu de centièmes.`), c(frac(a, nb("1000")), false, `Se trompe sur le rang du chiffre ${a} : millièmes au lieu de centièmes.`)],
        };
      }
      if (forme === "deux-chiffres") {
        const n = r.entier(1, 9) * 10 + r.entier(1, 9);
        return {
          forme, enonce: `0,${n} s’écrit aussi…`,
          choix: [c(frac(0, n), false, "Remplace la virgule par la barre de fraction."), c(frac(n, 100), true), c(frac(n, 10), false, `Se trompe sur le rang : prend ${n} dixièmes au lieu de ${n} centièmes.`), c(frac(n, nb("1000")), false, `Se trompe sur le rang : prend ${n} millièmes au lieu de ${n} centièmes.`)],
        };
      }
      const a = officiel ? 3 : r.parmi([2, 4, 5, 6, 7, 8, 9]);
      return {
        forme,
        enonce: `0,${a} s’écrit aussi…`,
        choix: [
          c(frac(1, a), false, `Associe 0,${a} à « un ${a === 3 ? "tiers" : "sur " + a} », ou prend ${a} pour le dénominateur.`),
          c(frac(a, 10), true),
          c(frac(a, 100), false, `Se trompe sur le rang du chiffre ${a} : centièmes au lieu de dixièmes.`),
          c(frac(0, a), false, "Remplace la virgule par la barre de fraction."),
        ],
      };
    },
  });

  // 17 — substituer dans 1 + 3x (ou 50 − 3x)
  Q.push({
    num: 17, domaine: "NC", competence: "Substituer un nombre à une lettre dans une expression",
    entrainement: AUTO("NC21", "Substituer et tester une égalité"),
    generer(r, officiel) {
      const forme = officiel ? "plus" : r.parmi(["plus", "plus", "moins"]);
      const l = officiel ? "x" : r.parmi(["x", "a", "n", "y", "t"]), E = officiel ? "A" : r.parmi(["A", "B", "E"]);
      const X = lettre(l);
      let k = 1, m = 3, v = 8;
      // Les pièges de la DEPP : de gauche à droite, « 3x » lu comme un nombre (3 et 8 collés), k + m calculé puis collé.
      const vals = forme === "plus"
        ? () => [k + m * v, (k + m) * v, k + 10 * m + v, 10 * (k + m) + v]
        : () => [k - m * v, (k - m) * v, k - (10 * m + v), 10 * (k - m) + v];
      if (!officiel) {
        if (forme === "plus") do { k = r.entier(1, 9); m = r.entier(2, 9); v = r.entier(2, 9); } while (k + m > 9 || new Set(vals()).size < 4);
        else do { k = r.entier(30, 60); m = r.entier(2, 5); v = r.entier(2, 9); } while (k - m * v < 2 || k - 10 * m - v === 0 || new Set(vals()).size < 4);
      }
      const op = forme === "plus" ? "+" : MOINS, [juste, gauche, colle, colle2] = vals();
      return {
        forme,
        enonce: `On donne l’expression ${E} = ${k} ${op} ${m}${X}.<br><strong>Quelle est la valeur de ${E} pour ${X} = ${v} ?</strong>`,
        choix: [
          [juste, c(neg(juste), true)],
          [gauche, c(neg(gauche), false, `Remplace bien ${l} mais calcule de gauche à droite : ${k} ${op} ${m} × ${v} = ${neg(k + (forme === "plus" ? m : -m))} × ${v}.`)],
          [colle, c(neg(colle), false, `Lit ${m}${l} comme le nombre formé des chiffres ${m} et ${v} : ${k} ${op} ${m}${v}.`)],
          [colle2, c(neg(colle2), false, `Calcule ${k} ${op} ${m} d’abord, puis lit le résultat suivi de ${l} comme le nombre ${neg(colle2)}.`)],
        ].sort((x, y) => x[0] - y[0]).map((x) => x[1]),
      };
    },
  });

  // 18 — conversion à deux rangs (× 100 ou : 100)
  const ECHELLES = [["hL", "daL", "L", "dL", "cL", "mL"], ["hm", "dam", "m", "dm", "cm", "mm"], ["hg", "dag", "g", "dg", "cg", "mg"], ["km", "hm", "dam", "m", "dm", "cm", "mm"]];
  Q.push({
    num: 18, domaine: "GM", competence: "Convertir une mesure dans une autre unité",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer(r, officiel) {
      const n = officiel ? 75 : r.entier(1, 9) * 10 + r.entier(1, 9);
      const e = officiel ? ECHELLES[0] : r.parmi(ECHELLES);
      // i : l'unité la plus grande ; l'autre est deux rangs plus petite.
      const i = officiel ? 2 : r.entier(2, e.length - 3), grand = e[i], petit = e[i + 2];
      const forme = officiel ? "vers-petit" : r.parmi(["vers-petit", "vers-grand"]);
      const t = String(n);
      if (forme === "vers-grand")
        return {
          forme,
          enonce: `Compléter l’égalité.<br><span class="calcul">${n} ${petit} = … ${grand}</span>`,
          choix: [
            c(nb(decaler(t, 2)), false, "Multiplie par 100 au lieu de diviser : se trompe de sens."),
            c(nb(decaler(t, 1)), false, "Multiplie par 10 : se trompe de sens et d’un rang."),
            c(decaler(t, -2), true),
            c(decaler(t, -1), false, `Convertit en ${e[i + 1]} (divise par 10).`),
          ],
        };
      return {
        forme,
        enonce: `Compléter l’égalité.<br><span class="calcul">${n} ${grand} = … ${petit}</span>`,
        choix: [
          c(decaler(t, -2), false, `Convertit en ${e[i - 2]} (divise par 100).`),
          c(decaler(t, -1), false, `Convertit en ${e[i - 1]} (divise par 10).`),
          c(nb(decaler(t, 2)), true),
          c(nb(decaler(t, 1)), false, `Convertit en ${e[i + 1]} (multiplie par 10).`),
        ],
      };
    },
  });

  // 19 — quatrième proportionnelle (tableau posé dans tous les sens)
  Q.push({
    num: 19, domaine: "OGD", competence: "Calculer une quatrième proportionnelle",
    entrainement: AUTO("PF02", "Calculer en proportionnalité"),
    generer(r, officiel) {
      let a = 4, m = 3, b = 9;
      const pieges = () => [b / m, b + a * m - a, (a * m * Math.ceil((2 * b) / a)) / 2];
      if (!officiel)
        do { a = r.entier(3, 9); m = r.entier(2, 5); b = m * r.entier(2, 6); }
        while (b <= a || (2 * b) % a === 0 || !pieges().every(Number.isInteger) || new Set([b * m, ...pieges()]).size < 4);
      const [p1, p2, p3] = pieges();
      // Tableau du sujet : [[a×m, a], [case vide, b]]. Sujet généré : colonnes ou lignes échangées, tableau couché ou debout.
      let g = [[String(a * m), String(a)], ["", String(b)]];
      const echCol = !officiel && r.suivant() < 0.5, echLig = !officiel && r.suivant() < 0.5, debout = !officiel && r.suivant() < 0.5;
      if (echCol) g = g.map((l) => [l[1], l[0]]);
      if (echLig) g = [g[1], g[0]];
      if (debout) g = [[g[0][0], g[1][0]], [g[0][1], g[1][1]]];
      const lignes = g.map((l) => `<tr>${l.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
      return {
        forme: `${echCol ? "colonnes-echangees" : "colonnes"}-${echLig ? "lignes-echangees" : "lignes"}${debout ? "-debout" : ""}`,
        enonce: "Le tableau suivant est un tableau de proportionnalité :",
        figure: `<table class="tableau-prop" aria-label="Tableau de proportionnalité à deux lignes et deux colonnes, une case vide">${lignes}</table>`,
        apres: "<strong>Quel nombre doit-on placer dans la case vide ?</strong>",
        choix: [
          c(String(b * m), true),
          c(String(p2), false, `Ajoute un même nombre au lieu de multiplier (${a} + ${b - a} = ${b} donc ${a * m} + ${b - a}).`),
          c(String(p3), false, `Utilise bien un coefficient, mais se trompe en le calculant (${a} × ${dec(Math.ceil((2 * b) / a) / 2)} pour faire ${b}).`),
          c(String(p1), false, `Enchaîne mal ses calculs : ${b} × ${a} : ${a * m} = ${p1}.`),
        ],
      };
    },
  });

  // 20 — point de coordonnées (3 ; 5)
  Q.push({
    num: 20, domaine: "EG", competence: "Repérer un point dans un repère orthonormé",
    entrainement: AUTO("EG02", "Coordonnées dans le plan"),
    generer(r, officiel) {
      let p = 3, q = 5, noms = ["D", "A", "B", "C"];
      if (!officiel) { do { p = r.entier(1, 5); q = r.entier(1, 5); } while (p === q); noms = r.melanger(["A", "B", "C", "D"]); }
      const dx = Number(`${p}.${q}`);
      const pts = [{ nom: noms[0], x: p, y: q }, { nom: noms[1], x: q, y: p }, { nom: noms[2], x: dx, y: 0 }, { nom: noms[3], x: 0, y: dx }];
      const pieges = { [noms[1]]: "Inverse l’abscisse et l’ordonnée.", [noms[2]]: `Confond (${p} ; ${q}) et le nombre ${p},${q}, placé sur l’axe des abscisses.`, [noms[3]]: `Confond (${p} ; ${q}) et le nombre ${p},${q}, placé sur l’axe des ordonnées.` };
      return {
        forme: `${p < q ? "abscisse-petite" : "abscisse-grande"}-bon-point-${noms[0]}`,
        enonce: `On considère quatre points A, B, C et D dans le plan rapporté au repère ci-dessous :<br><strong>Quel point a pour coordonnées (${p} ; ${q}) ?</strong>`,
        figure: repere(pts),
        choix: ["A", "B", "C", "D"].map((n) => c(`le point ${n}`, n === noms[0], pieges[n])),
        melange: false, // « le point A » à « le point D » restent dans l'ordre : le bon point est déjà tiré (noms)
      };
    },
  });

  // 21 — calcul de l'aire d'un triangle (posé dans tous les sens)
  const TRIANGLES = [[5, 9, 12, 13, 15], [9, 16, 12, 15, 20], [5, 16, 12, 13, 20], [6, 15, 8, 10, 17], [10, 18, 24, 26, 30], [8, 20, 15, 17, 25], [9, 5, 12, 15, 13], [16, 9, 12, 20, 15]];
  Q.push({
    num: 21, domaine: "GM", competence: "Calculer l’aire d’un triangle",
    entrainement: AUTO("EG09", "Aires"),
    generer(r, officiel) {
      const [x1, x2, h, c1, c2] = officiel ? TRIANGLES[0] : r.parmi(TRIANGLES);
      const b = x1 + x2, autre = officiel ? c2 : r.parmi([c1, c2]);
      // Sujet généré : le triangle tourné d'un quart de tour, d'un demi-tour…, ou retourné ; autres lettres.
      const rotation = officiel ? 0 : r.parmi([0, 90, 180, 270]), miroir = !officiel && r.suivant() < 0.5;
      const lettres = officiel ? ["A", "B", "C"] : r.parmi([["A", "B", "C"], ["E", "F", "G"], ["R", "S", "T"], ["M", "N", "P"]]);
      return {
        forme: `tourne-${rotation}${miroir ? "-retourne" : ""}`,
        enonce: `On considère le triangle ${lettres.join("")} représenté ci-dessous :<br><strong>Quel calcul donne son aire ?</strong>`,
        figure: triangleHauteur(x1, x2, h, c1, c2, lettres, rotation, miroir),
        choix: [
          c(`${b} × ${h}`, false, "Repère bien le côté et la hauteur associée, mais oublie de diviser par 2."),
          c(frac(`${b} × ${h}`, 2), true),
          c(frac(`${autre} × ${h}`, 2), false, "Pense bien à diviser par 2 mais n’associe pas la hauteur au bon côté."),
          c(`${c1} × ${b} × ${c2}`, false, "Confond avec le périmètre, ou multiplie les trois côtés comme pour le volume d’un pavé."),
        ],
      };
    },
  });

  // 22 — encadrer 56/10 (ou 356/100) par deux entiers
  Q.push({
    num: 22, domaine: "NC", competence: "Encadrer une fraction décimale entre deux entiers consécutifs",
    entrainement: AUTO("NC10", "Comparer et encadrer des fractions"),
    generer(r, officiel) {
      const forme = officiel ? "dixiemes" : r.parmi(["dixiemes", "centiemes"]);
      const D = forme === "dixiemes" ? 10 : 100;
      const N = officiel ? 56 : forme === "dixiemes" ? r.entier(2, 9) * 10 + r.entier(1, 9) : r.entier(2, 9) * 100 + r.entier(1, 9) * 10 + r.entier(1, 9);
      const E = Math.floor(N / D), F = frac(N, D);
      const enc = (a, b) => `${nb(String(a))} &lt; ${F} &lt; ${nb(String(b))}`;
      return {
        forme,
        enonce: `Quel encadrement de ${F} par deux nombres entiers est correct ?`,
        choix: [
          c(enc(N - 1, N + 1), false, `Raisonne sur le numérateur ${N} sans tenir compte du dénominateur ${D}.`),
          c(enc(E - 1, E), false, `Prend ${E} comme borne supérieure au lieu de borne inférieure.`),
          c(enc(E, E + 1), true),
          c(enc(0, 1), false, `Prend ${F} pour 0,${N} et l’encadre donc entre 0 et 1.`),
        ],
        melange: !officiel,
      };
    },
  });

  // Lot EN10 (décidé avec Gwenaël le 14/11) : les formes qui ne sont PAS des jumeaux stricts (autre cas, autre sens, autre
  // écriture, autre difficulté, ou bonne réponse d'une autre nature). Rien n'est supprimé : elles restent dans `generer`
  // pour la banque par compétence ; le jumeau (EN.genererJumeau) les écarte. Le sujet officiel ne passe jamais par ici.
  // Lot EN-J (revue de Codex du 15/11) : une autre écriture de même difficulté (autre tournure, autre ordre des termes) et
  // une bonne réponse qui est une catégorie (nature d'un triangle, oui ou non, égaux ou pas) reviennent dans le jumeau.
  const HORS_STRICT = {
    1: { formes: ["complement"], pourquoi: "Sujet 2024-2025 : « 6 + … = 14 » (complément) au lieu de « 14 − 6 ». La tâche de 2024-2025 n'est tirée que pour le jumeau du sujet 2024-2025 (tirerTache)" },
    2: { formes: ["double"], pourquoi: "« quel nombre a pour double 130 ? » : la question à l'envers (« 130 : 2 » est revenu dans le jumeau au lot EN-J)" },
    6: { formes: ["difference"], pourquoi: "Sujet 2024-2025 : « 8a − 3a » au lieu d'une somme (« 2n + 3n »). La tâche de 2024-2025 n'est tirée que pour le jumeau du sujet 2024-2025 (tirerTache)" },
    7: { formes: ["en-minutes-2h", "en-minutes-3h"], pourquoi: "l'autre sens (h min → min)" },
    9: { formes: ["sommet-milieu", "sommet-premier", "sommet-dernier", "sommet-milieu-retourne", "sommet-premier-retourne", "sommet-dernier-retourne"], pourquoi: "angle cherché aigu : le sujet cherche un angle obtus" },
    11: { formes: ["15min", "1h30"], pourquoi: "un quart d'heure ou 1 h 30 au lieu d'une demi-heure" },
    12: { formes: ["vers-petit-dixièmes", "vers-petit-unités", "vers-grand-milliers", "vers-grand-centaines", "vers-grand-dizaines", "vers-grand-unités", "vers-grand-dixièmes"], pourquoi: "unités décimales ou conversion vers une unité plus grande" },
    14: { formes: ["premier-negatif-grand", "premier-negatif-petit"], pourquoi: "premier nombre négatif : autre cas" },
    15: { formes: ["entre-1-et-2", "entre-2-et-3"], pourquoi: "fraction plus grande que 1" },
    16: { formes: ["centiemes", "deux-chiffres"], pourquoi: "centièmes au lieu de dixièmes" },
    18: { formes: ["vers-grand"], pourquoi: "conversion dans l'autre sens" },
    22: { formes: ["centiemes"], pourquoi: "centièmes au lieu de dixièmes" },
  };

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["4e-automatismes"] = {
    id: "4e-automatismes",
    niveau: "4e",
    titre: "Automatismes",
    annee: 2026,
    source: "DEPP — Évaluation nationale de début de quatrième, septembre 2024, 2025 et 2026 (test spécifique « Automatismes »), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/evaluations-nationales-4e",
    consignes: "Sans calculatrice. Pour chaque question, une seule réponse est juste.",
    domaines: { NC: "Nombres et calculs", GM: "Grandeurs et mesures", OGD: "Organisation et gestion de données, fonctions", EG: "Espace et géométrie" },
    // Groupes de maîtrise publiés par la DEPP pour ce test (sur 22), section 11.2.
    seuils: [{ max: 6, nom: "À besoins" }, { max: 12, nom: "Fragile" }, { max: 22, nom: "Satisfaisant" }],
    // Les sujets officiels jouables. 2024 et 2025 : le même sujet (PDF Eduscol identiques), questions 1 et 6 différentes de 2026,
    // repères de la DEPP différents (document « Présentation des exercices » 2024 et 2025, section 11.2 : 7 / 8 à 12 / 13).
    officiels: [
      { cle: "2026", annee: 2026, titre: "Le sujet officiel 2026", detail: "Les vraies questions de septembre 2026." },
      { cle: "2024-2025", annee: 2025, titre: "Le sujet officiel 2024 et 2025", detail: "Le même sujet ces deux années. Deux questions changent par rapport à 2026.",
        seuils: [{ max: 7, nom: "À besoins" }, { max: 12, nom: "Fragile" }, { max: 22, nom: "Satisfaisant" }] },
    ],
    questions: Q,
    horsStrict: HORS_STRICT,
  };
})(typeof window !== "undefined" ? window : globalThis);
