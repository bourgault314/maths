/* maths&go — Évaluation nationale de début de 4e, test spécifique « Automatismes » (DEPP, septembre 2026).
   Source : https://eduscol.education.gouv.fr/evaluations-nationales-4e — licence Etalab 2.0.
   Chaque question existe en version officielle (les valeurs du sujet 2026) et en version « jumelle » :
   même tâche, mêmes pièges (les distracteurs suivent l'analyse publiée par la DEPP, section 11.4 du document
   « Présentation des exercices et compétences »), autres nombres. */
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

  // Triangle IJK : angle α en I (en bas à gauche), γ en K (à droite), base légèrement montante comme sur le sujet.
  function triangleAngles(lettres, alpha, gamma) {
    const rad = (d) => (d * Math.PI) / 180, L = 100;
    const t = (L * Math.sin(rad(gamma))) / Math.sin(rad(alpha + gamma));
    let P = [[0, 0], [t * Math.cos(rad(alpha)), t * Math.sin(rad(alpha))], [L, 0]];
    const rot = rad(12);
    P = P.map(([x, y]) => [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    const W = 300, H = 150, m = 26;
    const k = Math.min((W - 2 * m) / (Math.max(...xs) - Math.min(...xs)), (H - 2 * m) / (Math.max(...ys) - Math.min(...ys)));
    const S = P.map(([x, y]) => [m + (x - Math.min(...xs)) * k, H - m - (y - Math.min(...ys)) * k]);
    const [I, J, K] = S;
    let s = `<polygon points="${S.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>`;
    const arc = (A, B, C, r, texte, double) => {
      const a1 = Math.atan2(B[1] - A[1], B[0] - A[0]), a2 = Math.atan2(C[1] - A[1], C[0] - A[0]);
      let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const arcR = (rr) => `<path d="M${pt(A[0] + rr * Math.cos(a1), A[1] + rr * Math.sin(a1))} A${rr} ${rr} 0 0 ${d > 0 ? 1 : 0} ${pt(A[0] + rr * Math.cos(a1 + d), A[1] + rr * Math.sin(a1 + d))}" fill="none" stroke="#111" stroke-width="1.2"/>`;
      const mid = a1 + d / 2, rt = r + 17;
      return arcR(r) + (double ? arcR(r - 4) : "") + `<text x="${(A[0] + rt * Math.cos(mid)).toFixed(1)}" y="${(A[1] + rt * Math.sin(mid) + 5).toFixed(1)}" font-size="13" text-anchor="middle" fill="#111">${texte}</text>`;
    };
    s += arc(I, K, J, 16, `${alpha}°`, false) + arc(K, I, J, 22, `${gamma}°`, true);
    const G = [(I[0] + J[0] + K[0]) / 3, (I[1] + J[1] + K[1]) / 3];
    const lab = (A, txt) => { const dx = A[0] - G[0], dy = A[1] - G[1], n = Math.hypot(dx, dy); return `<text x="${(A[0] + (dx / n) * 13).toFixed(1)}" y="${(A[1] + (dy / n) * 13 + 5).toFixed(1)}" font-size="15" text-anchor="middle" fill="#111">${txt}</text>`; };
    s += lab(I, lettres[0]) + lab(J, lettres[1]) + lab(K, lettres[2]);
    return svg(W, H, s, `Triangle ${lettres.join("")}`, 430);
  }

  // Droite graduée de 0 à 3, l'unité partagée en d parts, point A sur la k-ième graduation.
  function droiteFraction(d, k) {
    const u = 150, x0 = 24, y = 46, fin = x0 + 3 * u + 30;
    let s = `<line x1="${x0 - 14}" y1="${y}" x2="${fin}" y2="${y}" stroke="#111" stroke-width="1.6"/><path d="M${fin - 9} ${y - 6} L${fin} ${y} L${fin - 9} ${y + 6}" fill="none" stroke="#111" stroke-width="1.6"/>`;
    for (let i = 0; i <= 3 * d; i++) {
      const x = x0 + (i * u) / d;
      s += `<line x1="${x.toFixed(1)}" y1="${y - 7}" x2="${x.toFixed(1)}" y2="${y + 7}" stroke="#111" stroke-width="1.6"/>`;
    }
    for (let n = 0; n <= 3; n++) s += `<text x="${x0 + n * u}" y="${y + 30}" font-size="21" font-weight="700" text-anchor="middle" fill="#111">${n}</text>`;
    s += `<text x="${(x0 + (k * u) / d).toFixed(1)}" y="${y - 15}" font-size="21" font-weight="700" text-anchor="middle" fill="#111">A</text>`;
    return svg(fin + 6, 86, s, "Droite graduée de 0 à 3 avec le point A");
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

  // Triangle ABC : base AC horizontale, pied H de la hauteur issue de B à x1 de A.
  function triangleHauteur(x1, x2, h, c1, c2) {
    const b = x1 + x2, k = Math.min(250 / b, 130 / h), m = 24;
    const A = [m, m + h * k], C = [m + b * k, m + h * k], H = [m + x1 * k, m + h * k], B = [m + x1 * k, m];
    let s = `<polygon points="${[A, B, C].map((p) => p.join(",")).join(" ")}" fill="#e3e3e3" stroke="#333" stroke-width="1.6"/>`;
    s += `<line x1="${B[0]}" y1="${B[1]}" x2="${H[0]}" y2="${H[1]}" stroke="#333" stroke-width="1.6"/><rect x="${H[0] - 9}" y="${H[1] - 9}" width="9" height="9" fill="#cfcfcf" stroke="#333" stroke-width="1.2"/>`;
    const yf = A[1] + 14;
    s += `<line x1="${A[0] + 4}" y1="${yf}" x2="${C[0] - 4}" y2="${yf}" stroke="#333" stroke-width="1.6"/><path d="M${A[0] + 9} ${yf - 5} L${A[0]} ${yf} L${A[0] + 9} ${yf + 5}Z M${C[0] - 9} ${yf - 5} L${C[0]} ${yf} L${C[0] - 9} ${yf + 5}Z" fill="#333"/>`;
    const t = (x, y, txt, ancre = "middle") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="14" text-anchor="${ancre}" fill="#111">${txt}</text>`;
    s += t(A[0] - 8, A[1] + 2, "A", "end") + t(C[0] + 6, C[1] + 2, "C", "start") + t(B[0], B[1] - 7, "B");
    s += t((A[0] + B[0]) / 2 - 10, (A[1] + B[1]) / 2, String(c1), "end") + t((B[0] + C[0]) / 2 + 10, (B[1] + C[1]) / 2, String(c2), "start");
    s += t(B[0] + 8, (B[1] + H[1]) / 2 + 5, String(h), "start") + t((A[0] + C[0]) / 2, yf + 19, String(b));
    return svg(C[0] + m, yf + 26, s, `Triangle ABC avec la hauteur issue de B`);
  }

  // ---------- Les 22 questions ----------
  const Q = [];

  // 1 — multiplier par 0,1
  Q.push({
    num: 1, domaine: "NC", competence: "Connaître l’effet d’une multiplication par 0,1 (ou 0,01, 0,001)",
    entrainement: AUTO("NC01", "Numération décimale"), melange: false,
    generer(r, officiel) {
      const d = officiel ? 1 : r.parmi([1, 2, 2, 3]);
      const op = "0," + "0".repeat(d - 1) + "1", f1 = nb(String(10 ** d)), f2 = nb(String(10 ** (d + 1)));
      return {
        enonce: `Lorsqu’on multiplie un nombre par ${op} le nombre obtenu est…`,
        choix: [
          c(`${f1} fois plus petit.`, true),
          c(`${f2} fois plus petit.`, false, `Confond « diviser par ${f1} » et « diviser par ${f2} » : il compte aussi le « 0 » et la virgule devant le 1.`),
          c(`${f1} fois plus grand.`, false, `Confond « multiplier par ${op} » et « multiplier par ${f1} ».`),
          c(`${f2} fois plus grand.`, false, `Confond « multiplier par ${op} » et « multiplier par ${f2} » : il compte aussi le « 0 » et la virgule devant le 1.`),
        ],
      };
    },
  });

  // 2 — moitié d'un nombre pair de dizaines impaires
  Q.push({
    num: 2, domaine: "NC", competence: "Calculer la moitié d’un nombre entier pair",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      const N = officiel ? 7 : r.parmi([5, 9, 11, 13, 15, 17, 19]);
      const n = N * 10;
      return {
        enonce: `Combien vaut la moitié de ${n} ?`,
        choix: [
          c(String((N + 2) * 5), false, `Confond avec la moitié de ${(N + 2) * 10}.`),
          c(String(N * 5), true),
          c(String((N + 1) * 5), false, `Confond avec la moitié de ${(N + 1) * 10}.`),
          c(String((N - 1) * 5), false, `Confond avec la moitié de ${(N - 1) * 10}.`),
        ],
      };
    },
  });

  // 3 — fraction coloriée d'un disque
  Q.push({
    num: 3, domaine: "GM", competence: "Déterminer la fraction d’une surface",
    entrainement: AUTO("NC13", "Fraction d’une quantité"),
    generer(r, officiel) {
      let n = 8, k = 5;
      if (!officiel) { n = r.parmi([5, 6, 7, 8, 9, 10]); do k = r.entier(2, n - 2); while (2 * k === n); if (n === 5) k = r.parmi([2, 3]); }
      const blancs = Array.from({ length: n - k }, (_, i) => (n - 1 + i) % n);
      return {
        enonce: "Quelle fraction de la surface est coloriée ?",
        figure: disque(n, blancs, 70, `Disque partagé en ${n} parts égales, ${k} coloriées`),
        choix: [
          c(frac(n - k, k), false, "Confond la proportion par rapport au total et par rapport au reste : il donne les parts blanches sur les parts bleues."),
          c(frac(k, n), true),
          c(frac(n - k, n), false, "Interprète mal le mot « coloriée » : il donne les parts blanches sur le nombre total de parts."),
          c(frac(k, n - k), false, "Confond la proportion par rapport au total et par rapport au reste : il donne les parts bleues sur les parts blanches."),
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
      return {
        enonce: `${a} + ${b} = …`,
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
      let a = 5, b = 7;
      if (!officiel) { a = r.entier(2, 8); b = r.entier(a + 1, 9); }
      return {
        enonce: `${MOINS}${a} + ${b} = …`,
        choix: [
          c(String(b - a), true),
          c(neg(-(a + b)), false, `Gère mal les signes : il calcule ${MOINS}(${a} + ${b}).`),
          c(String(a + b), false, `Gère mal les signes : il calcule ${a} + ${b}.`),
          c(neg(a - b), false, `Gère mal les signes : il calcule ${MOINS}(${b} ${MOINS} ${a}).`),
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
      return {
        enonce: `${L} × ${L} + ${L} × ${p} + ${q} = …`,
        choix: [
          c(`${L}² + ${p + q}${L}`, false, `Réduit bien ${l} × ${l} mais ne respecte pas les priorités : il calcule ${p} + ${q} au lieu de réduire ${l} × ${p}.`),
          c(`2${L} + ${L}${p} + ${q}`, false, `Confond carré et double en réduisant ${l} × ${l}.`),
          c(`${L}² + ${p}${L} + ${q}`, true),
          c(`${1 + p + q}${L}`, false, `Ne tient pas compte de la nature de chaque terme et additionne tout : 1 + ${p} + ${q} = ${1 + p + q}.`),
        ],
      };
    },
  });

  // 7 — convertir des minutes en heures et minutes
  const SPECTACLES = [["Max assiste à un spectacle qui dure", "Max"], ["Léa regarde un film qui dure", "Léa"], ["Un match de rugby dure, avec la mi-temps,", ""], ["Une randonnée dure", ""]];
  Q.push({
    num: 7, domaine: "GM", competence: "Convertir une durée en heures et minutes",
    entrainement: AUTO("GM03", "Durées et horaires"),
    generer(r, officiel) {
      const reste = officiel ? 15 : r.parmi([5, 10, 20, 25, 30, 35]);
      const M = 120 + reste;
      const [debut] = officiel ? SPECTACLES[0] : r.parmi(SPECTACLES);
      return {
        enonce: `${debut} ${M} minutes, comment cette durée peut-elle s’écrire autrement ?`,
        choix: [
          c(`1 h ${M - 100} min`, false, "Compte 1 h pour 100 min, comme dans le système décimal."),
          c(`1 h ${reste} min`, false, `Décompose ${M} min en 120 min + ${reste} min mais oublie de convertir 120 min en 2 h.`),
          c(`2 h ${reste} min`, true),
          c(`2 h ${M - 100} min`, false, `Voit bien que ${M} min dépasse 2 h, mais reprend les ${M - 100} minutes dans le résultat.`),
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
      return {
        enonce: `${k} × ${a} + ${k} × ${b} = …`,
        choix: [
          c(String(k * 10), true),
          c(String(2 * k * 10), false, `Factorise de façon incomplète : il met ${k} en facteur deux fois, (${k} + ${k}) × (${a} + ${b}).`),
          c(String(k * b), false, `Ne factorise pas et ne calcule que le second produit, ${k} × ${b}.`),
          c(String(k * a), false, `Ne factorise pas et ne calcule que le premier produit, ${k} × ${a}.`),
        ],
      };
    },
  });

  // 9 — troisième angle d'un triangle
  const TRIPLETS = [["I", "J", "K"], ["A", "B", "C"], ["E", "F", "G"], ["R", "S", "T"], ["M", "N", "P"]];
  Q.push({
    num: 9, domaine: "EG", competence: "Calculer un angle d’un triangle connaissant les deux autres",
    entrainement: AUTO("EG07", "Angles d’un triangle"),
    generer(r, officiel) {
      let alpha = 50, gamma = 20, l = TRIPLETS[0];
      if (!officiel) {
        l = r.parmi(TRIPLETS);
        do { alpha = r.parmi([30, 35, 40, 45, 50, 55, 60, 65, 70]); gamma = r.parmi([20, 25, 30, 35, 40, 45]); }
        while (alpha === gamma || alpha + gamma === 90 || [alpha, gamma].includes(180 - alpha - gamma));
      }
      const beta = 180 - alpha - gamma;
      const vals = [[gamma, `Associe la notation ${l.join("")} à l’angle de sommet ${l[2]} et non à celui de sommet ${l[1]}.`], [alpha, `Associe la notation ${l.join("")} à l’angle de sommet ${l[0]} et non à celui de sommet ${l[1]}.`], [alpha + gamma, `Calcule ${alpha}° + ${gamma}° mais oublie de soustraire le résultat à 180°.`], [beta, ""]];
      vals.sort((x, y) => x[0] - y[0]);
      return {
        enonce: `La mesure de l’angle ${angLong(l.join(""))} est égale à…`,
        figure: triangleAngles(l, alpha, gamma),
        choix: vals.map(([v, e]) => c(`${v}°`, v === beta, e)),
        melange: false,
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
      return {
        enonce: `${E} + ${frac(a, 10)} + ${frac(b, 1000)} = …`,
        choix: [
          c(nb(`${E}${a}${b}`), false, "Écrit le nombre entier suivi des deux numérateurs, sans tenir compte des dénominateurs."),
          c(`${E},${a}0${b}`, true),
          c(`${E},${a}${b}`, false, `Ne tient pas compte du dénominateur 1 000 et place le ${b} juste après le ${a}.`),
          c(`${nb(String(E * 10))},${a}${b}`, false, `Ne tient pas compte du dénominateur 1 000 et voit en plus ${E} comme ${E} dizaines.`),
        ],
      };
    },
  });

  // 11 — distance en 30 min
  const ROULEURS = [["Un cycliste roule", [14, 16, 18, 20, 22, 24, 26]], ["Une coureuse court", [8, 10, 12, 14]], ["Un bateau navigue", [16, 20, 24, 28, 30]]];
  Q.push({
    num: 11, domaine: "OGD", competence: "Utiliser la proportionnalité pour calculer une distance",
    entrainement: AUTO("PF08", "Vitesse et grandeurs composées"),
    generer(r, officiel) {
      const [sujet, vitesses] = officiel ? ROULEURS[0] : r.parmi(ROULEURS);
      const v = officiel ? 18 : r.parmi(vitesses);
      return {
        enonce: `${sujet} pendant 30 min à la vitesse moyenne de ${v} km/h.<br><strong>Quelle distance parcourt-${sujet.startsWith("Une") ? "elle" : "il"} ?</strong>`,
        choix: [
          c(`${v} km`, false, `Reprend simplement les ${v} km de ${v} km/h.`),
          c(`${2 * v} km`, false, "Sait que 30 min est la moitié d’une heure, mais multiplie par 2 au lieu de diviser."),
          c(`${dec(v * 0.3)} km`, false, "Prend 30 min pour 0,3 h, comme dans le système décimal."),
          c(`${v / 2} km`, true),
        ],
      };
    },
  });

  // 12 — unités de numération
  const RANGS = [["milliers", "dizaines"], ["centaines", "unités"], ["unités", "centièmes"], ["dizaines", "dixièmes"]];
  Q.push({
    num: 12, domaine: "NC", competence: "Utiliser les unités de numération décimale",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      const n = officiel ? 43 : r.entier(1, 9) * 10 + r.entier(1, 9);
      const [u, v] = officiel ? RANGS[0] : r.parmi(RANGS);
      return {
        enonce: `Compléter par le nombre qui convient :<br><span class="calcul">${n} ${u} = … ${v}</span>`,
        choix: [
          c(decaler(String(n), -1), false, `Divise ${n} par 10 au lieu de le multiplier par 100 (pour 43 milliers, il pense 43 unités).`),
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
      // La bonne : 2q parts égales, 2p coloriées.
      const n = 2 * q, blancs = Array.from({ length: n - 2 * p }, (_, i) => i);
      let s = "";
      for (let i = 0; i < n; i++) s += secteur(39, 39, 36, (i * 360) / n, ((i + 1) * 360) / n, blancs.includes(i) ? "#fff" : BLEU);
      const fJuste = petite(78, 78, s, lbl(`disque en ${n} parts égales, ${2 * p} coloriées`));
      const piege = "Compte les parts bleues et le nombre total de parts sans tenir compte de leur taille.";
      return {
        enonce: `Dans quelle figure a-t-on colorié ${p}/${q} de la surface ?`,
        choixFigures: true,
        choix: [c(fBande, false, piege), c(fBandes, false, piege), c(fMorceaux, false, piege), c(fJuste, true)],
      };
    },
  });

  // 14 — différence de deux relatifs
  Q.push({
    num: 14, domaine: "NC", competence: "Soustraire des nombres entiers relatifs",
    entrainement: AUTO("NC05", "Opposés, sommes et différences de relatifs"),
    generer(r, officiel) {
      let a = 7, b = 5;
      if (!officiel) { a = r.entier(3, 9); b = r.entier(2, a - 1); }
      return {
        enonce: `${a} ${MOINS} (${MOINS}${b}) = …`,
        choix: [
          c(String(a + b), true),
          c(neg(-(a + b)), false, `Ne sait pas soustraire un relatif : il calcule ${MOINS}(${a} + ${b}).`),
          c(String(a - b), false, `Ne sait pas soustraire un relatif : il calcule ${a} ${MOINS} ${b}.`),
          c(neg(b - a), false, `Ne sait pas soustraire un relatif : il calcule ${MOINS}(${a} ${MOINS} ${b}).`),
        ],
      };
    },
  });

  // 15 — abscisse fractionnaire sur une droite graduée
  Q.push({
    num: 15, domaine: "NC", competence: "Déterminer l’abscisse d’un point sur une droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer(r, officiel) {
      let d = 4, k = 3;
      if (!officiel) { d = r.parmi([3, 4, 5, 6, 8]); k = r.entier(2, d - 1); }
      return {
        enonce: "Quelle est l’abscisse du point A ?",
        figure: droiteFraction(d, k),
        choix: [
          c(`0,${k}`, false, "Compte les parts entre l’origine et A et répond en dixièmes, sans tenir compte du partage de l’unité."),
          c(frac(k, d), true),
          c(frac(d, k), false, "Trouve sans doute le bon partage mais inverse l’écriture de la fraction."),
          c(String(k), false, "Compte les parts entre l’origine et A comme si la droite était graduée de 1 en 1."),
        ],
      };
    },
  });

  // 16 — 0,3 s'écrit aussi…
  Q.push({
    num: 16, domaine: "NC", competence: "Associer différentes écritures d’un nombre décimal",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer(r, officiel) {
      const a = officiel ? 3 : r.parmi([2, 4, 5, 6, 7, 8, 9]);
      return {
        enonce: `0,${a} s’écrit aussi…`,
        choix: [
          c(frac(1, a), false, `Associe 0,${a} à « un ${a === 3 ? "tiers" : "sur " + a} », ou prend ${a} pour le dénominateur.`),
          c(frac(a, 10), true),
          c(frac(a, 100), false, `Se trompe sur le rang du chiffre ${a} : centièmes au lieu de dixièmes.`),
          c(frac(0, a), false, "Remplace la virgule par la barre de fraction."),
        ],
        melange: false,
      };
    },
  });

  // 17 — substituer dans 1 + 3x
  Q.push({
    num: 17, domaine: "NC", competence: "Substituer un nombre à une lettre dans une expression",
    entrainement: AUTO("NC21", "Substituer et tester une égalité"),
    generer(r, officiel) {
      let k = 1, m = 3, v = 8;
      const vals = () => [k + m * v, (k + m) * v, k + 10 * m + v, 10 * (k + m) + v];
      if (!officiel) do { k = r.entier(1, 9); m = r.entier(2, 9); v = r.entier(2, 9); } while (k + m > 9 || new Set(vals()).size < 4);
      const X = lettre("x"), [juste, gauche, colle, colle2] = vals();
      return {
        enonce: `On donne l’expression A = ${k} + ${m}${X}.<br><strong>Quelle est la valeur de A pour ${X} = ${v} ?</strong>`,
        choix: [
          c(String(juste), true),
          c(String(gauche), false, `Remplace bien ${"x"} mais calcule de gauche à droite : ${k} + ${m} × ${v} = ${k + m} × ${v}.`),
          c(String(colle), false, `Lit ${m}x comme le nombre formé des chiffres ${m} et ${v} : ${k} + ${m}${v}.`),
          c(String(colle2), false, `Calcule ${k} + ${m} d’abord, puis lit ${k + m}x comme le nombre ${k + m}${v}.`),
        ].sort((x, y) => Number(x.html) - Number(y.html)),
        melange: false,
      };
    },
  });

  // 18 — conversion de capacité (deux rangs)
  const CONVERSIONS = [["L", "cL", "dL", "daL", "hL"], ["m", "cm", "dm", "dam", "hm"], ["g", "cg", "dg", "dag", "hg"], ["dm", "mm", "cm", "m", "dam"]];
  Q.push({
    num: 18, domaine: "GM", competence: "Convertir une mesure dans une autre unité",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer(r, officiel) {
      const n = officiel ? 75 : r.entier(1, 9) * 10 + r.entier(1, 9);
      const [u, v, a, b, cc] = officiel ? CONVERSIONS[0] : r.parmi(CONVERSIONS);
      const t = String(n);
      return {
        enonce: `Compléter l’égalité.<br><span class="calcul">${n} ${u} = … ${v}</span>`,
        choix: [
          c(decaler(t, -2), false, `Convertit en ${cc} (divise par 100).`),
          c(decaler(t, -1), false, `Convertit en ${b} (divise par 10).`),
          c(nb(decaler(t, 2)), true),
          c(nb(decaler(t, 1)), false, `Convertit en ${a} (multiplie par 10).`),
        ],
      };
    },
  });

  // 19 — quatrième proportionnelle
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
      return {
        enonce: "Le tableau suivant est un tableau de proportionnalité :",
        figure: `<table class="tableau-prop" aria-label="Tableau : première ligne ${a * m} et ${a}, deuxième ligne case vide et ${b}"><tr><td>${a * m}</td><td>${a}</td></tr><tr><td></td><td>${b}</td></tr></table>`,
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
    entrainement: AUTO("EG02", "Coordonnées dans le plan"), melange: false,
    generer(r, officiel) {
      let p = 3, q = 5, noms = ["D", "A", "B", "C"];
      if (!officiel) { do { p = r.entier(1, 5); q = r.entier(1, 5); } while (p === q); noms = r.melanger(["A", "B", "C", "D"]); }
      const dx = Number(`${p}.${q}`);
      const pts = [{ nom: noms[0], x: p, y: q }, { nom: noms[1], x: q, y: p }, { nom: noms[2], x: dx, y: 0 }, { nom: noms[3], x: 0, y: dx }];
      const pieges = { [noms[1]]: "Inverse l’abscisse et l’ordonnée.", [noms[2]]: `Confond (${p} ; ${q}) et le nombre ${p},${q}, qu’il place sur l’axe des abscisses.`, [noms[3]]: `Confond (${p} ; ${q}) et le nombre ${p},${q}, qu’il place sur l’axe des ordonnées.` };
      return {
        enonce: `On considère quatre points A, B, C et D dans le plan rapporté au repère ci-dessous :<br><strong>Quel point a pour coordonnées (${p} ; ${q}) ?</strong>`,
        figure: repere(pts),
        choix: ["A", "B", "C", "D"].map((n) => c(`le point ${n}`, n === noms[0], pieges[n])),
      };
    },
  });

  // 21 — calcul de l'aire d'un triangle
  const TRIANGLES = [[5, 9, 12, 13, 15], [9, 16, 12, 15, 20], [5, 16, 12, 13, 20], [6, 15, 8, 10, 17], [10, 18, 24, 26, 30], [8, 20, 15, 17, 25], [9, 5, 12, 15, 13], [16, 9, 12, 20, 15]];
  Q.push({
    num: 21, domaine: "GM", competence: "Calculer l’aire d’un triangle",
    entrainement: AUTO("EG09", "Aires"), melange: false,
    generer(r, officiel) {
      const [x1, x2, h, c1, c2] = officiel ? TRIANGLES[0] : r.parmi(TRIANGLES);
      const b = x1 + x2, autre = officiel ? c2 : r.parmi([c1, c2]);
      return {
        enonce: "On considère le triangle ABC représenté ci-dessous :<br><strong>Quel calcul donne son aire ?</strong>",
        figure: triangleHauteur(x1, x2, h, c1, c2),
        choix: [
          c(`${b} × ${h}`, false, "Repère bien le côté et la hauteur associée, mais oublie de diviser par 2."),
          c(frac(`${b} × ${h}`, 2), true),
          c(frac(`${autre} × ${h}`, 2), false, "Pense bien à diviser par 2 mais n’associe pas la hauteur au bon côté."),
          c(`${c1} × ${b} × ${c2}`, false, "Confond avec le périmètre, ou multiplie les trois côtés comme pour le volume d’un pavé."),
        ],
      };
    },
  });

  // 22 — encadrer 56/10 par deux entiers
  Q.push({
    num: 22, domaine: "NC", competence: "Encadrer une fraction décimale entre deux entiers consécutifs",
    entrainement: AUTO("NC10", "Comparer et encadrer des fractions"),
    generer(r, officiel) {
      const N = officiel ? 56 : r.entier(2, 9) * 10 + r.entier(1, 9);
      const E = Math.floor(N / 10), F = frac(N, 10);
      const enc = (a, b) => `${a} &lt; ${F} &lt; ${b}`;
      return {
        enonce: `Quel encadrement de ${F} par deux nombres entiers est correct ?`,
        choix: [
          c(enc(N - 1, N + 1), false, `Raisonne sur le numérateur ${N} sans tenir compte du dénominateur 10.`),
          c(enc(E - 1, E), false, `Prend ${E} comme borne supérieure au lieu de borne inférieure.`),
          c(enc(E, E + 1), true),
          c(enc(0, 1), false, `Prend ${frac(N, 10)} pour 0,${N} et l’encadre donc entre 0 et 1.`),
        ],
        melange: false,
      };
    },
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["4e-automatismes"] = {
    id: "4e-automatismes",
    niveau: "4e",
    titre: "Automatismes",
    annee: 2026,
    source: "DEPP — Évaluation nationale de début de quatrième, septembre 2026 (test spécifique « Automatismes »), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/evaluations-nationales-4e",
    consignes: "Sans calculatrice. Pour chaque question, une seule réponse est juste.",
    domaines: { NC: "Nombres et calculs", GM: "Grandeurs et mesures", OGD: "Organisation et gestion de données, fonctions", EG: "Espace et géométrie" },
    // Groupes de maîtrise publiés par la DEPP pour ce test (sur 22), section 11.2.
    seuils: [{ max: 6, nom: "À besoins" }, { max: 12, nom: "Fragile" }, { max: 22, nom: "Satisfaisant" }],
    questions: Q,
  };
})(typeof window !== "undefined" ? window : globalThis);
