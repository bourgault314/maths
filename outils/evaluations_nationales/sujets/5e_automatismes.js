/* maths&go — Évaluation nationale de début de 5e, test spécifique « Automatismes » (DEPP, septembre 2026).
   Source : https://eduscol.education.gouv.fr/evaluations-nationales-5e — licence Etalab 2.0.
   Chaque question existe en version officielle (les valeurs du sujet 2026) et en version « jumelle » :
   même tâche, mêmes pièges (les distracteurs suivent l'analyse publiée par la DEPP, section 7.5 du document
   « Présentation des exercices et compétences »), autres nombres et, depuis le lot EN4b, autre « forme »
   (écriture, sens, disposition, figure) au même niveau que le sujet officiel. */
(function (racine) {
  "use strict";
  const { nb, nombreVersTexte, decaler, frac, enLettres, svg } = racine.EN;

  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const AUTO = (notion, libelle) => ({ appli: "Automatismes", notion, libelle, url: `/automatismes/?notions=${notion}&nombre=8` });
  const dec = (x) => nb(nombreVersTexte(x));
  const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const croissant = (choix) => choix.sort((x, y) => Number(x.html.replace(/\s/g, "").replace(",", ".")) - Number(y.html.replace(/\s/g, "").replace(",", ".")));

  // ---------- Figures ----------
  const BLEU = "#1f2cf0", BORD = "#4a1f1f";
  const poly = (pts, fill) => `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="${fill}" stroke="${BORD}" stroke-width="2" stroke-linejoin="round"/>`;
  // Figure partagée en parts égales : triangle (4), carré coupé par ses diagonales (4), hexagone (6), disque (8).
  function partage(forme, coloriees) {
    let parts = [];
    if (forme === "disque") {
      const O = [100, 100], R = 90, P = (i) => [O[0] + R * Math.cos((Math.PI / 4) * i - Math.PI / 2), O[1] + R * Math.sin((Math.PI / 4) * i - Math.PI / 2)];
      const s = Array.from({ length: 8 }, (_, i) => { const a = P(i), b = P(i + 1); return `<path d="M${O[0]} ${O[1]} L${a[0].toFixed(1)} ${a[1].toFixed(1)} A${R} ${R} 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)}Z" fill="${coloriees.includes(i) ? BLEU : "#fff"}" stroke="${BORD}" stroke-width="2" stroke-linejoin="round"/>`; }).join("");
      return svg(200, 200, s, `Figure partagée en 8 parts égales, ${coloriees.length} coloriée${coloriees.length > 1 ? "s" : ""}`, 240);
    }
    if (forme === "triangle") {
      const A = [10, 180], B = [210, 180], C = [110, 7], m = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
      const AB = m(A, B), BC = m(B, C), CA = m(C, A);
      parts = [[CA, BC, AB], [C, CA, BC], [A, AB, CA], [B, BC, AB]]; // la part du milieu d'abord, comme sur le sujet
    } else if (forme === "carre") {
      const O = [97, 97], P = [[7, 7], [187, 7], [187, 187], [7, 187]];
      parts = P.map((p, i) => [O, p, P[(i + 1) % 4]]);
    } else {
      const O = [100, 92], R = 88;
      const P = Array.from({ length: 6 }, (_, i) => [O[0] + R * Math.cos((Math.PI / 3) * i), O[1] + R * Math.sin((Math.PI / 3) * i)]);
      parts = P.map((p, i) => [O, p, P[(i + 1) % 6]]);
    }
    const s = parts.map((p, i) => poly(p, coloriees.includes(i) ? BLEU : "#fff")).join("");
    const l = forme === "triangle" ? 220 : forme === "carre" ? 194 : 200;
    return svg(l, forme === "carre" ? 194 : 188, s, `Figure partagée en ${parts.length} parts égales, ${coloriees.length} coloriée${coloriees.length > 1 ? "s" : ""}`, 240);
  }

  // Portion de droite graduée : deux grandes graduations (texteA, texteB), dix intervalles, quatre de plus après ; flèche sur la k-ième.
  function portionDroite(texteA, texteB, k) {
    const pas = 30, x0 = 46, y = 116, fin = x0 + 14 * pas + 22;
    let s = `<line x1="${x0 - 22}" y1="${y}" x2="${fin}" y2="${y}" stroke="#111" stroke-width="2"/>`;
    for (let i = 0; i <= 14; i++) {
      const grand = i === 0 || i === 10;
      s += `<line x1="${x0 + i * pas}" y1="${y - (grand ? 13 : 8)}" x2="${x0 + i * pas}" y2="${y + (grand ? 13 : 8)}" stroke="#111" stroke-width="${grand ? 2.6 : 1.4}"/>`;
    }
    const t = (x, txt) => `<text x="${x}" y="${y + 40}" font-size="22" text-anchor="middle" fill="#111">${txt}</text>`;
    s += t(x0, texteA) + t(x0 + 10 * pas, texteB);
    const xa = x0 + k * pas;
    s += `<text x="${xa}" y="24" font-size="22" text-anchor="middle" fill="#111">A</text><line x1="${xa}" y1="32" x2="${xa}" y2="82" stroke="#111" stroke-width="2.4"/><path d="M${xa - 10} 80 L${xa} 100 L${xa + 10} 80Z" fill="#111"/>`;
    return svg(fin + 10, y + 52, s, `Portion de droite graduée de ${texteA} à ${texteB}, flèche A`);
  }

  // Demi-droite graduée en centièmes (dixièmes en gras), de 0 à un peu plus loin que la flèche ; flèche sous `pos` dixièmes
  // (pos = 11 : la flèche est sous 1 + 1/10, comme sur le sujet ; pos = 7 : sous 7/10, avant l'unité).
  function regle(pos) {
    const pas = 5.2, x0 = 14, y = 74, n = Math.max(100, 10 * pos) + 4;
    let s = `<line x1="${x0}" y1="${y}" x2="${x0 + n * pas + 4}" y2="${y}" stroke="#111" stroke-width="2"/>`;
    for (let i = 0; i <= n; i++) {
      const dixieme = i % 10 === 0, cinq = i % 5 === 0;
      const h = dixieme ? 34 : cinq ? 24 : 15;
      const coul = i === 0 || i === 100 ? "#d61f26" : dixieme ? "#111" : "#8a8a8a";
      s += `<line x1="${(x0 + i * pas).toFixed(1)}" y1="${y - h}" x2="${(x0 + i * pas).toFixed(1)}" y2="${y}" stroke="${coul}" stroke-width="${dixieme ? 2.4 : 1}"/>`;
    }
    s += `<text x="${x0}" y="${y - 40}" font-size="26" font-weight="700" text-anchor="middle" fill="#111">0</text><text x="${x0 + 100 * pas}" y="${y - 40}" font-size="26" font-weight="700" text-anchor="middle" fill="#111">1</text>`;
    const xf = x0 + 10 * pos * pas;
    s += `<path d="M${xf} ${y + 6} L${xf + 12} ${y + 22} L${xf + 5} ${y + 22} L${xf + 5} ${y + 50} L${xf - 5} ${y + 50} L${xf - 5} ${y + 22} L${xf - 12} ${y + 22}Z" fill="#4472c4"/>`;
    return svg(x0 + n * pas + 16, y + 56, s, "Demi-droite graduée de 0 à 1 avec une flèche");
  }

  // ---------- Les 30 questions ----------
  // Lot EN4b (variété « dans la compétence ») : chaque sujet jumeau tire une « forme » (écriture, sens, disposition, figure)
  // au même niveau que le sujet officiel ; `forme` la nomme. Les pièges gardent le sens que leur donne la DEPP ;
  // les textes de la vue prof n'ont aucun mot genré.
  const Q = [];

  // 1 — plus grande fraction de même dénominateur
  Q.push({
    num: 1, domaine: "NC", competence: "Comparer des fractions de même dénominateur",
    entrainement: AUTO("NC10", "Comparer et encadrer des fractions"),
    generer(r, officiel) {
      const d = officiel ? 5 : r.parmi([3, 4, 6, 7, 8, 9, 10, 12]);
      const forme = officiel ? "juste-un-de-plus" : r.parmi(["juste-un-de-plus", "juste-deux-de-plus"]);
      const e = forme === "juste-un-de-plus" ? 1 : 2;
      const m = officiel || d < 5 ? 1 : r.parmi([1, 2]);
      return {
        forme,
        enonce: officiel || r.suivant() < 0.5 ? "Quel est le plus grand nombre parmi les nombres suivants ?" : "Parmi ces nombres, lequel est le plus grand ?",
        choix: [
          c(frac(d - m, d), false, "Ne sait pas comparer des fractions de même dénominateur."),
          c(frac(d, d), false, `Pense qu’une fraction est toujours inférieure ou égale à 1 et choisit ${d}/${d}, qui vaut 1.`),
          c(frac(1, d), false, "Lit mal la consigne et choisit le plus petit nombre au lieu du plus grand."),
          c(frac(d + e, d), true),
        ],
      };
    },
  });

  // 2 — 35 × 1 000 + 64
  Q.push({
    num: 2, domaine: "NC", competence: "Recomposer un nombre entier (milliers et unités)",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      let a = 35, b = 64, ordre = "produit-dabord", chiffres = 2;
      if (!officiel) {
        ordre = r.parmi(["produit-dabord", "somme-dabord"]);
        chiffres = r.parmi([2, 3]);
        do { a = r.entier(11, 98); b = chiffres === 2 ? r.entier(11, 98) : r.entier(101, 989); }
        while (a === b || a % 10 === 0 || b % 10 === 0 || new Set([a * 100 + b, a * 1000 + b, b * 100 + a, b * 1000 + a]).size < 4);
      }
      return {
        forme: `${ordre}-${chiffres}-chiffres`,
        enonce: ordre === "produit-dabord" ? `${a} × 1 000 + ${b} = …` : `${b} + ${a} × 1 000 = …`,
        choix: [
          c(nb(String(a * 100 + b)), false, `Confond ${a} milliers et ${a} centaines.`),
          c(nb(String(a * 1000 + b)), true),
          c(nb(String(b * 100 + a)), false, `Fait deux erreurs : confond milliers et centaines, et multiplie ${b} au lieu de ${a}.`),
          c(nb(String(b * 1000 + a)), false, officiel ? "Inverse la multiplication et l’addition du calcul." : `Inverse la multiplication et l’addition : multiplie ${b} par 1 000 au lieu de ${a}.`),
        ],
      };
    },
  });

  // 3 — lire (ou écrire) un grand nombre
  Q.push({
    num: 3, domaine: "NC", competence: "Associer l’écriture en chiffres d’un grand nombre à sa lecture",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      const m = officiel ? 11 : r.parmi([2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19]);
      const forme = officiel ? "lire" : r.parmi(["lire", "ecrire"]);
      const n = 10 * m, mots = majuscule(enLettres(n)), motsM = majuscule(enLettres(m));
      if (forme === "ecrire")
        return {
          forme,
          enonce: `« ${mots}-millions » s’écrit en chiffres :`,
          choix: [
            c(nb(String(n * 1000)), false, `Place ${n} dans la classe des milliers et non des millions : oublie trois zéros.`),
            c(nb(String(n * 1000000)), true),
            c(nb(String(m * 1000000000)), false, "Confond la classe des millions et celle des milliards."),
            c(nb(String(m * 1000000)), false, `Repère bien les millions mais oublie un zéro : écrit ${m} millions.`),
          ],
        };
      return {
        forme,
        enonce: `Le nombre ${nb(String(n * 1000000))} se lit :`,
        disposition: "ligne",
        choix: [
          c(`${mots}-mille`, false, `Place ${n} dans la classe des milliers et non des millions : oublie trois zéros.`),
          c(`${mots}-millions`, true),
          c(`${motsM} milliards`, false, "Confond la classe des millions et celle des milliards."),
          c(`${motsM} millions`, false, `Repère bien les millions mais oublie un zéro : lit ${m} millions.`),
        ],
      };
    },
  });

  // 4 — 8 × … = 48
  Q.push({
    num: 4, domaine: "NC", competence: "Connaître les tables de multiplication",
    entrainement: AUTO("NC04", "Calcul mental positif"), melange: false,
    generer(r, officiel) {
      let a = 8, b = 6;
      const forme = officiel ? "facteur-droite" : r.parmi(["facteur-droite", "facteur-gauche", "division"]);
      if (!officiel) do { a = r.entier(6, 9); b = r.entier(3, 9); } while (a === b || [b - 1, b, b + 1].includes(Math.floor((a * b) / 10)));
      const P = a * b, dz = Math.floor(P / 10);
      const enonce = { "facteur-droite": `${a} × … = ${P}`, "facteur-gauche": `… × ${a} = ${P}`, division: `${P} : ${a} = …` }[forme];
      return {
        forme, enonce,
        choix: croissant([
          c(String(dz), false, `Prend le chiffre des dizaines de ${P}, ${dz}.`),
          c(String(b - 1), false, `Ne connaît pas la table de ${a}.`),
          c(String(b), true),
          c(String(b + 1), false, `Ne connaît pas la table de ${a}.`),
        ]),
      };
    },
  });

  // 5 — complément à 100
  Q.push({
    num: 5, domaine: "NC", competence: "Déterminer un complément à 100",
    entrainement: AUTO("NC04", "Calcul mental positif"), melange: false,
    generer(r, officiel) {
      const t = officiel ? 7 : r.entier(1, 8);
      const u = officiel ? 5 : r.parmi([5, 5, 2, 3, 4, 6, 7, 8]);
      const forme = officiel ? "a-plus-trou" : r.parmi(["a-plus-trou", "trou-plus-a", "soustraction"]);
      const a = 10 * t + u, rep = 100 - a;
      const enonce = { "a-plus-trou": `${a} + … = 100`, "trou-plus-a": `… + ${a} = 100`, soustraction: `100 − ${a} = …` }[forme];
      return {
        forme, enonce,
        choix: [
          c(String(rep), true),
          c(String(rep + u), false, `Ne connaît pas ce complément et se sert d’un fait connu : ${10 * t} + ${100 - 10 * t} = 100.`),
          c(String(rep + 10), false, "Ne connaît pas ce complément et fait une erreur de retenue."),
          c(String(rep + u + 10), false, "Ne connaît pas ce complément ou ne sait pas le retrouver."),
        ].sort((x, y) => Number(x.html) - Number(y.html)),
      };
    },
  });

  // 6 — fraction d'une figure partagée en parts égales
  const FORMES = [["triangle", 4], ["carre", 4], ["hexagone", 6], ["disque", 8]];
  Q.push({
    num: 6, domaine: "NC", competence: "Déterminer la fraction d’une surface",
    entrainement: AUTO("NC13", "Fraction d’une quantité"),
    generer(r, officiel) {
      const [forme, n] = officiel ? FORMES[0] : r.parmi(FORMES);
      const k = officiel ? 1 : n === 4 ? r.parmi([1, 3]) : n === 6 ? r.parmi([1, 5]) : r.parmi([1, 3, 5, 7]);
      const coloriees = officiel ? [0] : r.melanger([...Array(n).keys()]).slice(0, k);
      // Lot EN10 : un jumeau n'est jamais le sujet officiel lui-même (triangle, part du milieu seule coloriée).
      if (!officiel && forme === "triangle" && k === 1 && coloriees[0] === 0) coloriees[0] = r.entier(1, 3);
      const f = (a, b) => `${a}/${b}`;
      return {
        // Lot EN10 : une seule part coloriée (comme le sujet officiel, 1/4) = le jumeau strict, « une-part-… » ; plusieurs parts
        // coloriées (3/4, 5/6, 3/8…) = plus dur, gardé pour la banque (HORS_STRICT).
        forme: k === 1 ? `une-part-${forme}` : forme,
        enonce: "Quelle fraction de la surface est coloriée ?",
        figure: partage(forme, coloriees),
        choix: [
          c(f(1, 2), false, "Estime à l’œil que la partie coloriée couvre la moitié, sans comparer les aires."),
          c(f(k, n - k), false, "Confond la proportion par rapport au total et par rapport au reste : parts bleues sur parts blanches."),
          c(f(k, n), true),
          c(f(n - k, n), false, "Interprète mal le mot « coloriée » : donne les parts blanches sur le total."),
        ],
      };
    },
  });

  // 7 — 126 + 99
  Q.push({
    num: 7, domaine: "NC", competence: "Additionner des nombres entiers sans poser l’opération",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      const forme = officiel ? "plus-99" : r.parmi(["plus-99", "99-plus", "plus-98"]);
      const m = forme === "plus-98" ? 2 : 1, presque = 100 - m;
      const a = officiel ? 126 : r.entier(1, 8) * 100 + r.entier(1, 8) * 10 + r.entier(m + 1, 9);
      const u = a % 10, H = Math.floor(a / 100);
      return {
        forme,
        enonce: forme === "99-plus" ? `99 + ${a} = …` : `${a} + ${presque} = …`,
        choix: [
          c(String(a + presque), true),
          c(String(a + 100 + m), false, `Ajoute 100 puis ajoute ${m} au lieu de l’enlever.`),
          c(String(H * 100 + u + presque % 10), false, `Additionne les chiffres des unités (${u} + ${presque % 10} = ${u + (presque % 10)}) et en déduit que le résultat se termine par ${u + (presque % 10)}.`),
          c(String(a + 100), false, `Ajoute 100 mais oublie d’enlever ${m}.`),
        ],
      };
    },
  });

  // 8 — 5 × 43 × 2
  Q.push({
    num: 8, domaine: "NC", competence: "Multiplier des nombres entiers en choisissant l’ordre des calculs",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      let n = 43;
      const forme = officiel ? "5-n-2" : r.parmi(["5-n-2", "2-n-5"]);
      if (!officiel) do n = r.entier(21, 98); while (n % 10 === 0 || n === 25 || n === 50);
      const [p, q] = forme === "5-n-2" ? [5, 2] : [2, 5];
      return {
        forme,
        enonce: `${p} × ${n} × ${q} = …`,
        choix: [
          c(String(p * n), false, `N’effectue que ${p} × ${n}.`),
          c(String(10 * n), true),
          c(String(q * n), false, `N’effectue que ${n} × ${q}.`),
          c(String(p * (n - q)), false, `Soustrait d’abord ${q} à ${n}, puis multiplie par ${p}.`),
        ],
      };
    },
  });

  // 9 — multiple de 50
  Q.push({
    num: 9, domaine: "NC", competence: "Reconnaître un multiple de 50",
    entrainement: AUTO("NC17", "Critères de divisibilité et exemples"),
    generer(r, officiel) {
      const forme = officiel ? "trois-chiffres" : r.parmi(["trois-chiffres", "quatre-chiffres"]);
      const m = officiel ? 4 : forme === "trois-chiffres" ? r.entier(2, 18) : r.entier(21, 59);
      const C = 50 * m;
      return {
        forme,
        enonce: "Quel nombre est un multiple de 50 ?",
        choix: [
          c(nb(String(C + 25)), false, `Se trompe dans un produit de la table de 50 (pense par exemple que 50 × ${m + 1} = ${nb(String(C + 25))}).`),
          c(nb(String(C)), true),
          c(nb(String(C + 10)), false, "Repère un multiple de 10, comme 50, sans vérifier que c’est un multiple de 50."),
          c(nb(String(C + 75)), false, "Confond multiple de 50 et multiple de 25 (ou de 5)."),
        ],
      };
    },
  });

  // 10 — 2,8 + 1,8
  Q.push({
    num: 10, domaine: "NC", competence: "Additionner des nombres décimaux",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      let a = 2, b = 1, x = 8, y = 8;
      const forme = officiel ? "memes-dixiemes" : r.parmi(["memes-dixiemes", "dixiemes-differents"]);
      if (!officiel) {
        a = r.entier(1, 7); b = r.entier(1, 8 - a);
        if (forme === "memes-dixiemes") { x = r.entier(6, 9); y = x; }
        else do { x = r.entier(2, 9); y = r.entier(2, 9); } while (x === y || x + y < 11);
      }
      return {
        forme,
        enonce: `${a},${x} + ${b},${y} est égal à…`,
        choix: [
          c(`${a + b},${x}`, false, forme === "memes-dixiemes" ? "N’additionne que les parties entières." : `N’additionne que les parties entières et garde les dixièmes de ${a},${x}.`),
          c(`${a + b + 1},${x + y - 10}`, true),
          c(`${a + b},${x + y}`, false, "Additionne à part les parties entières et les parties décimales, et écrit les deux résultats de chaque côté de la virgule."),
          c(`${a + b},${x + y - 10}`, false, "Oublie la retenue."),
        ],
      };
    },
  });

  // 11 — 525 : 5
  Q.push({
    num: 11, domaine: "NC", competence: "Diviser un nombre entier par un nombre à un chiffre",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      const forme = officiel ? "par-5" : r.parmi(["par-5", "par-2", "par-2-deux-cents"]);
      const d = forme === "par-5" ? 5 : 2, H = forme === "par-2-deux-cents" ? 2 : 1;
      const u = officiel ? 5 : d === 5 ? r.parmi([3, 7, 9]) : r.parmi([6, 7, 8, 9]);
      const n = d * (100 * H + u), chiffre = ((d * u) % 10) / d;
      return {
        forme,
        enonce: `${n} : ${d} = …`,
        choix: [
          c(`${H}${u}`, false, "Oublie le zéro des dizaines dans le quotient."),
          c(`${H}0${u}`, true),
          c(`${H}${u}0`, false, `Décompose bien (${d * 100 * H} : ${d} = ${100 * H} et ${d * u} : ${d} = ${u}) mais place le ${u} au rang des dizaines.`),
          c(`${H}${chiffre}`, false, "Divise chiffre par chiffre et ne traite pas le chiffre des dizaines."),
        ],
      };
    },
  });

  // 12 — 712/100
  Q.push({
    num: 12, domaine: "NC", competence: "Passer d’une fraction décimale à l’écriture à virgule",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer(r, officiel) {
      let n = "712", k = 2;
      if (!officiel) { n = `${r.entier(1, 9)}${r.entier(1, 9)}${r.entier(1, 9)}`; k = r.parmi([1, 2, 3]); }
      const D = 10 ** k;
      return {
        forme: ["dixiemes", "centiemes", "milliemes"][k - 1],
        enonce: `${frac(n, nb(String(D)))} = …`,
        choix: [
          c(decaler(n, -k), true),
          c(`${n},${D}`, false, `Remplace la barre de fraction par une virgule : ${nb(String(D))} devient la partie décimale.`),
          c(nb(String(Number(n) * D)), false, `Multiplie ${n} par ${nb(String(D))} au lieu de diviser.`),
          c(decaler(n, -(k + 1)), false, `Divise par ${nb(String(D * 10))} au lieu de ${nb(String(D))} : erreur de rang.`),
        ],
      };
    },
  });

  // 13 — nombre indiqué par la flèche (dix-millièmes, ou millièmes)
  Q.push({
    num: 13, domaine: "NC", competence: "Lire l’abscisse d’un point sur une portion de droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer(r, officiel) {
      // Les chiffres après la virgule de la grande graduation de gauche (jamais terminés par 0 : « 12,240 » ne s’écrit pas) ;
      // la flèche est sur la k-ième petite graduation.
      let E = 14, D = "618", k = 8;
      const forme = officiel ? "dix-milliemes" : r.parmi(["dix-milliemes", "milliemes"]);
      if (!officiel) {
        E = r.entier(2, 39);
        if (forme === "dix-milliemes") { const b = r.entier(1, 4); D = `${r.entier(1, 9)}${b}${r.entier(1, 8)}`; k = r.entier(2, 9 - b); }
        else { const a = r.entier(1, 7); D = `${a}${r.entier(1, 8)}`; k = r.entier(2, 9 - a); }
      }
      const base = `${E},${D}`, suivant = `${E},${D.slice(0, -1)}${Number(D.slice(-1)) + 1}`;
      const avant = D.slice(0, -1), tete = D.slice(0, -2);
      return {
        forme,
        enonce: "Quel est le nombre indiqué par la flèche ?",
        figure: portionDroite(base, suivant, k),
        choix: [
          c(`${base}${k}`, true),
          c(`${E},${avant.slice(0, -1)}${Number(avant.slice(-1)) + k}`, false, `Traite les parties du nombre comme des entiers, ou part de ${E},${avant} et ajoute ${k} graduations.`),
          c(`${E},${tete}${k}`, false, `Traite les parties du nombre comme des entiers : ${tete}${k} paraît plus petit que ${D.slice(0, -1)}${Number(D.slice(-1)) + 1}.`),
          c(`${base}0`, false, `Voit que la réponse a ${D.length + 1} chiffres après la virgule, mais ajoute un zéro sans tenir compte des graduations.`),
        ],
      };
    },
  });

  // 14 — ordre de grandeur d'un produit
  Q.push({
    num: 14, domaine: "NC", competence: "Estimer l’ordre de grandeur d’un produit",
    entrainement: AUTO("NC03", "Estimer et arrondir"), melange: false,
    generer(r, officiel) {
      let x = "9,8", y = "9,78", dessus = 0;
      if (!officiel) {
        const proche = () => r.parmi([[9, r.entier(5, 9)], [10, r.entier(1, 4)]]);
        const [e1, d1] = proche(), [e2, d2] = proche();
        dessus = (e1 === 10) + (e2 === 10);
        x = `${e1},${d1}`; y = `${e2},${d2}${r.entier(1, 9)}`;
        if (r.suivant() < 0.5) [x, y] = [y, x];
      }
      return {
        forme: ["deux-sous-10", "un-au-dessus-de-10", "deux-au-dessus-de-10"][dessus],
        enonce: `Quel nombre est le plus proche du résultat de cette multiplication ?<br><span class="calcul">${x} × ${y} ≈ …</span>`,
        choix: [
          c("10", false, "N’arrondit qu’un des deux nombres et oublie la suite du calcul."),
          c("100", true),
          c("1 000", false, "Se trompe sur l’ordre de grandeur d’un des facteurs en oubliant la virgule (le prend pour 100)."),
          c("10 000", false, "Se trompe sur l’ordre de grandeur des deux facteurs et calcule 100 × 100."),
        ],
      };
    },
  });

  // 15 — 5 dizaines et 3 centièmes
  const UNITES_NUM = {
    "dizaines-centiemes": ["dizaines", "centièmes", (a, b) => [`${a}0,0${b}`, `${a}0,${b}00`, `${b}00,${a}0`, String(b * 100 + a * 10)], "Confond dixièmes et dizaines, centièmes et centaines."],
    "centaines-centiemes": ["centaines", "centièmes", (a, b) => [`${a}00,0${b}`, `${a}00,${b}00`, `${b}00,0${a}`, String((a + b) * 100)], "Confond centaines et centièmes, dans les deux sens."],
    "dizaines-milliemes": ["dizaines", "millièmes", (a, b) => [`${a}0,00${b}`, `${a}0,${b}000`, nb(`${b}000`) + `,${a}`, nb(String(b * 1000 + a * 10))], "Confond dixièmes et dizaines, millièmes et milliers."],
  };
  Q.push({
    num: 15, domaine: "NC", competence: "Écrire un nombre décimal donné par ses unités de numération",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      let a = 5, b = 3;
      const forme = officiel ? "dizaines-centiemes" : r.parmi(Object.keys(UNITES_NUM));
      if (!officiel) do { a = r.entier(1, 9); b = r.entier(1, 9); } while (a === b);
      const [ug, ud, ecr, texteCroise] = UNITES_NUM[forme], [j, ieme, croise, confond] = ecr(a, b);
      const grand = { dixièmes: "dizaines", centièmes: "centaines", millièmes: "milliers" }[ud];
      return {
        forme,
        enonce: `Écrire le nombre qui correspond à ${a} ${ug} et ${b} ${ud}.`,
        choix: [
          c(j, true),
          c(ieme, false, `Traduit bien ${a} ${ug} mais écrit ${b} ${ud} « ${b}${"0".repeat(ieme.split(",")[1].length - 1)} » après la virgule (le « -ième » indique seulement la partie décimale).`),
          c(croise, false, texteCroise),
          c(confond, false, `Confond ${ud} et ${grand}.`),
        ],
      };
    },
  });

  // 16 — 15,3 − 2,4
  Q.push({
    num: 16, domaine: "NC", competence: "Soustraire des nombres décimaux",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      let A = 15, x = 3, B = 2, y = 4;
      const forme = officiel ? "deux-decimaux" : r.parmi(["deux-decimaux", "entier-moins-decimal"]);
      if (!officiel) {
        if (forme === "deux-decimaux") do { A = r.entier(11, 19); B = r.entier(2, 9); x = r.entier(1, 7); y = r.entier(x + 1, 9); } while (y - x === 5 || x + y === 10);
        else { A = r.entier(11, 19); B = r.entier(2, 9); x = 0; y = r.parmi([1, 2, 3, 4, 6, 7, 8, 9]); }
      }
      const premier = x === 0 ? String(A) : `${A},${x}`;
      return {
        forme,
        enonce: `${premier} − ${B},${y} = …`,
        choix: [
          c(`${A - B},${y - x}`, false, x === 0 ? `Écrit ${A} = ${A},0 puis fait ${y} − 0 au lieu de 0 − ${y} : un calcul sans retenue.` : "Inverse les chiffres des dixièmes pour faire un calcul sans retenue."),
          c(dec(A + x / 10 + B + y / 10), false, "Additionne les deux nombres au lieu de les soustraire."),
          c(dec(A + x / 10 - (B + y / 10)), true),
          c(`${A - B},${10 + x - y}`, false, "Oublie la retenue."),
        ],
      };
    },
  });

  // 17 — encadrer 9,998 par deux entiers
  Q.push({
    num: 17, domaine: "NC", competence: "Encadrer un nombre décimal par deux entiers consécutifs",
    entrainement: AUTO("NC02", "Comparer des décimaux"), disposition: "ligne",
    generer(r, officiel) {
      let E = 9, a = 9, b = 9, cc = 8;
      const forme = officiel ? "inegalites" : r.parmi(["inegalites", "entre"]);
      if (!officiel) { E = r.entier(1, 9); a = r.entier(1, 9); b = r.entier(0, 9); cc = r.entier(1, 9); }
      const x = `${E},${a}${b}${cc}`;
      const enc = forme === "inegalites" ? (m, n) => `${nb(String(m))} &lt; ${x} &lt; ${nb(String(n))}` : (m, n) => `Entre ${nb(String(m))} et ${nb(String(n))}`;
      const trois = 100 * E + 10 * a + b, deux = 10 * E + a, entier = 10 * trois + cc;
      return {
        forme,
        enonce: forme === "inegalites" ? `Quel encadrement de ${x} par deux nombres entiers est correct ?` : `Entre quels nombres entiers consécutifs se trouve ${x} ?`,
        choix: [
          c(enc(trois, trois + 1), false, `Ne regarde que les trois premiers chiffres, ${trois}, sans tenir compte de la virgule.`),
          c(enc(deux, deux + 1), false, `Ne regarde que les deux premiers chiffres, ${deux}.`),
          c(enc(E, E + 1), true),
          officiel ? c(enc(9999, 10000), false, "Ne comprend pas l’écriture décimale et prend 9,998 pour l’entier 9 998.")
            : c(enc(entier, entier + 1), false, `Ne comprend pas l’écriture décimale et prend ${x} pour l’entier ${nb(String(entier))}.`),
        ],
        melange: false,
      };
    },
  });

  // 18 — rang d'un chiffre (ou chiffre d'un rang)
  const RANGS_ENT = ["unités", "dizaines", "centaines", "milliers"], RANGS_DEC = ["dixièmes", "centièmes", "millièmes"];
  Q.push({
    num: 18, domaine: "NC", competence: "Connaître le rang d’un chiffre dans un nombre décimal",
    entrainement: AUTO("NC01", "Numération décimale"), disposition: "ligne",
    generer(r, officiel) {
      let chiffres = [1, 7, 3, 5, 8, 4, 2], i = 2; // i : rang décimal visé (2 = millièmes)
      const forme = officiel ? "rang-du-chiffre" : r.parmi(["rang-du-chiffre", "chiffre-du-rang"]);
      if (!officiel) { chiffres = r.melanger([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 7); i = r.parmi([0, 1, 2]); }
      const nombre = `${chiffres[0]} ${chiffres.slice(1, 4).join("")},${chiffres.slice(4).join("")}`;
      const voisin = i === 2 ? 1 : i === 0 ? 1 : r.parmi([0, 2]);
      if (forme === "chiffre-du-rang")
        return {
          forme,
          enonce: `Dans le nombre ${nombre}<br>quel est le chiffre des ${RANGS_DEC[i]} ?`,
          disposition: "grille",
          choix: [
            c(String(chiffres[4 + i]), true),
            c(String(chiffres[3]), false, "Ne voit pas la partie décimale : donne le chiffre des unités."),
            c(String(chiffres[2 - i]), false, `Voit bien l’écart avec les unités mais confond « ${RANGS_DEC[i]} » et « ${RANGS_ENT[i + 1]} ».`),
            c(String(chiffres[4 + voisin]), false, "Se trompe d’un rang."),
          ],
        };
      return {
        forme,
        enonce: `Dans le nombre ${nombre}<br>${chiffres[4 + i]} est le chiffre des…`,
        choix: [
          c(`${RANGS_DEC[i]}.`, true),
          c("unités.", false, `Ne voit pas la partie décimale et prend ${chiffres[4 + i]} pour le chiffre des unités.`),
          c(`${RANGS_ENT[i + 1]}.`, false, `Voit bien l’écart avec les unités mais confond « ${RANGS_ENT[i + 1]} » et « ${RANGS_DEC[i]} ».`),
          c(`${RANGS_DEC[voisin]}.`, false, "Se trompe d’un rang."),
        ],
      };
    },
  });

  // 19 — 3,6 × 100
  Q.push({
    num: 19, domaine: "NC", competence: "Multiplier un nombre décimal par 10, 100 ou 1 000",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      let a = 3, b = 6;
      const forme = officiel ? "fois-100" : r.parmi(["fois-100", "fois-10", "fois-1000"]);
      if (!officiel) { a = r.entier(1, 19); b = r.entier(1, 9); }
      const p = { "fois-10": 1, "fois-100": 2, "fois-1000": 3 }[forme], F = 10 ** p, z = "0".repeat(p);
      return {
        forme,
        enonce: `${a},${b} × ${nb(String(F))} = …`,
        choix: [
          c(`${a},${b}${z}`, false, `Multiplie seulement la partie décimale par ${nb(String(F))}, ou ajoute ${p === 1 ? "un zéro" : p === 2 ? "deux zéros" : "trois zéros"} à la fin.`),
          c(`${nb(String(a * F))},${b}`, false, `Multiplie seulement la partie entière par ${nb(String(F))}.`),
          c(`${a}${b}${z}`, false, `Multiplie par ${nb(String(F * 10))}, ou ajoute ${p === 1 ? "le zéro" : p === 2 ? "les deux zéros" : "les trois zéros"} de ${nb(String(F))} et enlève la virgule.`),
          c(nb(String(a * F + (b * F) / 10)), true),
        ],
      };
    },
  });

  // 20 — 12 × 1/2 permet de calculer…
  Q.push({
    num: 20, domaine: "NC", competence: "Associer une fraction simple à un pourcentage",
    entrainement: AUTO("PF03", "Pourcentage d’une quantité"), disposition: "ligne",
    generer(r, officiel) {
      const n = officiel ? 12 : r.parmi([8, 16, 20, 24, 28, 36, 40, 60]);
      const forme = officiel ? "moitie" : r.parmi(["moitie", "quart"]);
      if (forme === "quart")
        return {
          forme,
          enonce: `${n} × ${frac(1, 4)} permet de calculer…`,
          choix: [
            c(`25 % de ${n}.`, true),
            c(`50 % de ${n}.`, false, "Confond le quart et la moitié."),
            c(`1,4 % de ${n}.`, false, `Prend ${frac(1, 4)} pour 1,4.`),
            c(`1,25 % de ${n}.`, false, `Prend ${frac(1, 4)} pour « un et quart », 1,25.`),
          ],
        };
      return {
        forme,
        enonce: `${n} × ${frac(1, 2)} permet de calculer…`,
        choix: [
          c(`50 % de ${n}.`, true),
          c(`25 % de ${n}.`, false, "Confond la moitié et le quart."),
          c(`1,2 % de ${n}.`, false, `Prend ${frac(1, 2)} pour 1,2.`),
          c(`1,5 % de ${n}.`, false, `Prend ${frac(1, 2)} pour « un et demi », 1,5.`),
        ],
      };
    },
  });

  // 21 — 4/10 + 8/100
  Q.push({
    num: 21, domaine: "NC", competence: "Associer différentes écritures d’un nombre décimal",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer(r, officiel) {
      let a = 4, b = 8;
      const forme = officiel ? "dixiemes-dabord" : r.parmi(["dixiemes-dabord", "centiemes-dabord"]);
      if (!officiel) do { a = r.entier(1, 9); b = r.entier(1, 9); } while (a === b);
      return {
        forme,
        enonce: forme === "dixiemes-dabord" ? `${frac(a, 10)} + ${frac(b, 100)} = …` : `${frac(b, 100)} + ${frac(a, 10)} = …`,
        choix: [
          c(`0,${b}${a}`, false, "Inverse dixièmes et centièmes."),
          c(`${a}0${b}`, false, `Met les fractions sur 100 puis colle les numérateurs (${a}0 et ${b}) en oubliant les dénominateurs.`),
          c(`${a}${b}0`, false, "Met les fractions sur 1 000 puis colle les numérateurs en oubliant les dénominateurs."),
          c(`0,${a}${b}`, true),
        ],
      };
    },
  });

  // 22 — programme de calcul → calcul en ligne
  Q.push({
    num: 22, domaine: "NC", competence: "Traduire un programme de calcul par un calcul en ligne",
    entrainement: AUTO("PI01", "Exécuter un programme de calcul"), disposition: "ligne",
    generer(r, officiel) {
      let n = "2", a = "3,5", m = "0,1";
      const forme = officiel ? "ajoute-multiplie" : r.parmi(["ajoute-multiplie", "soustrait-multiplie", "ajoute-divise"]);
      if (!officiel) {
        a = `${r.entier(1, 5)},${r.entier(1, 9)}`;
        n = String(forme === "soustrait-multiplie" ? r.entier(6, 9) : r.entier(2, 9));
        m = forme === "ajoute-divise" ? r.parmi(["2", "4", "5", "10"]) : r.parmi(["0,1", "0,5", "10", "3", "4"]);
      }
      const [op, verbe] = { "ajoute-multiplie": ["+", "Je lui ajoute"], "soustrait-multiplie": ["−", "Je lui soustrais"], "ajoute-divise": ["+", "Je lui ajoute"] }[forme];
      const [fois, verbe2] = forme === "ajoute-divise" ? [":", "Je divise le résultat par"] : ["×", "Je multiplie le résultat par"];
      return {
        forme,
        enonce: `Voici un programme de calcul :<br>• Je choisis le nombre ${n}.<br>• ${verbe} ${a}.<br>• ${verbe2} ${m}.<br><strong>Quel calcul permet de trouver le résultat ?</strong>`,
        choix: [
          c(`( ${n} ${op} ${a} ) ${fois} ${m}`, true),
          c(`${n} ${op} ${a} ${fois} ${m}`, false, "Suit les étapes dans l’ordre mais n’utilise pas les parenthèses."),
          c(`${n} ${fois} ${m} ${op} ${a}`, false, "Remonte le programme sans changer les opérations."),
          c(`${n} ${op} ( ${a} ${fois} ${m} )`, false, `Applique « ${fois === "×" ? "la multiplication" : "la division"} est prioritaire » et met les parenthèses autour de ${fois === "×" ? "du produit" : "du quotient"}.`.replace("de du", "du")),
        ],
      };
    },
  });

  // 23 — 6 + 4 × 2
  Q.push({
    num: 23, domaine: "NC", competence: "Respecter les priorités de calcul",
    entrainement: AUTO("NC07", "Priorités opératoires"),
    generer(r, officiel) {
      let a = 6, b = 4, k = 2;
      const forme = officiel ? "plus-fois" : r.parmi(["plus-fois", "plus-fois", "moins-fois"]);
      if (forme === "moins-fois") {
        const v = () => [a - b * k, (a - b) * k, a - b - k, a * k - b];
        do { b = r.entier(2, 9); k = r.entier(2, 9); a = r.entier(b * k + 2, Math.max(b * k + 12, 30)); } while (a === b || new Set(v()).size < 4 || a - b - k <= 0);
        const [juste, gauche, tout, inverse] = v();
        return {
          forme,
          enonce: `${a} − ${b} × ${k} = …`,
          choix: [
            c(String(juste), true),
            c(String(gauche), false, `Calcule de gauche à droite : ${a} − ${b} = ${a - b} puis × ${k}.`),
            c(String(tout), false, `Soustrait tous les nombres (${a} − ${b} − ${k}) sans tenir compte de la multiplication.`),
            c(String(inverse), false, `Intervertit ${b} et ${a} : ${a} × ${k} puis − ${b}.`),
          ],
        };
      }
      const v = () => [a + b * k, (a + b) * k, a + b + k, a * k + b];
      if (!officiel) do { a = r.entier(2, 9); b = r.entier(2, 9); k = r.entier(2, 9); } while (a === b || new Set(v()).size < 4);
      const [juste, gauche, somme, inverse] = v();
      return {
        forme,
        enonce: `${a} + ${b} × ${k} = …`,
        choix: [
          c(String(juste), true),
          c(String(gauche), false, `Calcule de gauche à droite : ${a} + ${b} = ${a + b} puis × ${k}.`),
          c(String(somme), false, `Additionne tous les nombres (${a} + ${b} + ${k}) sans tenir compte de la multiplication.`),
          c(String(inverse), false, `Intervertit ${b} et ${a} : ${a} × ${k} puis + ${b}.`),
        ],
      };
    },
  });

  // 24 — fraction désignée par la flèche (centièmes et dixièmes)
  Q.push({
    num: 24, domaine: "NC", competence: "Lire une abscisse sous forme de fraction décimale",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer(r, officiel) {
      const forme = officiel ? "apres-1" : r.parmi(["apres-1", "apres-1", "avant-1"]);
      const t = officiel ? 1 : r.entier(1, 4);
      if (forme === "avant-1")
        return {
          forme,
          enonce: "Quel est le nombre désigné par la flèche ?",
          figure: regle(10 - t),
          choix: [
            c(frac(10 - t, 10), true),
            c(frac(100 - t, 100), false, "Voit que le nombre est juste avant 1 mais confond dixièmes et centièmes."),
            c(frac(t, 10), false, "Compte les dixièmes à partir de 1, et non à partir de 0."),
            c(frac(10 - t, 100), false, "Compte les graduations en gras comme des centièmes."),
          ],
        };
      return {
        forme,
        enonce: "Quel est le nombre désigné par la flèche ?",
        figure: regle(10 + t),
        choix: [
          c(frac(10 + t, 10), true),
          c(frac(100 + t, 100), false, "Voit que le nombre dépasse 1 mais confond dixièmes et centièmes."),
          c(frac(t, 10), false, "Oublie que la flèche est placée après l’unité."),
          c(frac(10 + t, 100), false, "Compte les graduations en gras comme des centièmes."),
        ],
      };
    },
  });

  // 25 — intercaler un décimal
  Q.push({
    num: 25, domaine: "NC", competence: "Intercaler un nombre décimal entre deux nombres",
    entrainement: AUTO("NC02", "Comparer des décimaux"),
    generer(r, officiel) {
      // Les deux bornes ne diffèrent que par leur dernier chiffre (cc et cc + 1).
      let E = 6, tete = "52", cc = 2, k = 4, j = 1;
      const forme = officiel ? "trois-decimales" : r.parmi(["trois-decimales", "deux-decimales", "une-decimale"]);
      if (!officiel) {
        E = r.entier(1, 19); cc = r.entier(1, 8); k = r.entier(1, 9); j = r.entier(1, 9);
        tete = forme === "trois-decimales" ? `${r.entier(1, 9)}${r.entier(1, 9)}` : forme === "deux-decimales" ? `${r.entier(1, 9)}` : "";
      }
      const debut = `${E},${tete}`, n = tete.length + 2;
      return {
        forme,
        enonce: `<span class="calcul">${debut}${cc} &lt; … &lt; ${debut}${cc + 1}</span><br>Quel nombre décimal peut-on écrire à la place des … ?`,
        choix: [
          c(`${debut}${cc}${k}`, true),
          c(`${debut}${cc}0`, false, `Ajoute simplement un 0 à ${debut}${cc} : ne voit pas que ${debut}${cc} et ${debut}${cc}0 sont égaux.`),
          c(`${debut}${(cc + 8) % 10}${j}`, false, `Voit que la réponse a ${n} chiffres après la virgule mais se trompe sur le chiffre ${["", "des dixièmes", "des centièmes", "des millièmes"][n - 1]}.`),
          c(`${debut}${cc + 1}0`, false, `Ajoute simplement un 0 à ${debut}${cc + 1} : ne voit pas que ${debut}${cc + 1} et ${debut}${cc + 1}0 sont égaux.`),
        ],
      };
    },
  });

  // 26 — volume d'un pavé droit
  const UNITES_VOL = [["cm", "cm³"], ["dm", "dm³"], ["m", "m³"]];
  Q.push({
    num: 26, domaine: "GM", competence: "Calculer le volume d’un pavé droit avec la formule",
    entrainement: AUTO("EG22", "Volumes de prismes et cylindres"), melange: false, disposition: "ligne",
    generer(r, officiel) {
      let L = 6, l = 5, h = 2;
      const forme = officiel ? "cotes" : r.parmi(["cotes", "dimensions"]);
      const [u, u3] = officiel ? UNITES_VOL[0] : r.parmi([UNITES_VOL[0], UNITES_VOL[0], UNITES_VOL[1], UNITES_VOL[2]]);
      const v = () => [L + l + h, L * l, L * l * h, L * L * l * l * h * h];
      if (!officiel) do { [L, l, h] = r.melanger([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3); } while (new Set(v()).size < 4 || L * L * l * l * h * h > 99999);
      const [somme, aire, V, carres] = v();
      return {
        forme,
        enonce: forme === "cotes" ? `Quel est le volume d’un pavé droit dont les côtés mesurent ${L} ${u}, ${l} ${u} et ${h} ${u} ?`
          : `Un pavé droit a pour longueur ${L} ${u}, pour largeur ${l} ${u} et pour hauteur ${h} ${u}. Quel est son volume ?`,
        choix: croissant([
          c(`${nb(String(somme))} ${u3}`, false, `Additionne les trois longueurs (${L} + ${l} + ${h}).`),
          c(`${nb(String(aire))} ${u3}`, false, `Calcule ${L} × ${l} et oublie la troisième longueur : confond aire et volume.`),
          c(`${nb(String(V))} ${u3}`, true),
          c(`${nb(String(carres))} ${u3}`, false, "Retrouve en partie la formule mais met chaque longueur au carré."),
        ]),
      };
    },
  });

  // 27 — 3/7 + 3/7
  Q.push({
    num: 27, domaine: "NC", competence: "Additionner des fractions de même dénominateur",
    entrainement: AUTO("NC11", "Additionner et soustraire des fractions"),
    generer(r, officiel) {
      let a = 3, d = 7;
      const forme = officiel ? "deux-termes" : r.parmi(["deux-termes", "deux-termes", "trois-termes"]);
      const n = forme === "deux-termes" ? 2 : 3;
      if (!officiel) { d = r.entier(n === 2 ? 5 : 7, n === 2 ? 9 : 10); a = r.entier(2, Math.floor((d - 1) / n)); }
      return {
        forme,
        enonce: `${Array(n).fill(frac(a, d)).join(" + ")} = …`,
        choix: [
          c(frac(a, d), false, "Garde le même dénominateur et, par extension, le même numérateur : n’additionne pas les numérateurs."),
          c(frac(n * a, d), true),
          c(frac(n * a, n * d), false, "Additionne les numérateurs entre eux et les dénominateurs entre eux."),
          c(frac(a ** n, d ** n), false, "Multiplie les numérateurs entre eux et les dénominateurs entre eux."),
        ],
      };
    },
  });

  // 28 — 780 × 0,1 = …
  Q.push({
    num: 28, domaine: "NC", competence: "Savoir que multiplier par 0,1 (0,01 ; 0,5) revient à diviser par 10 (100 ; 2)",
    entrainement: AUTO("NC04", "Calcul mental positif"), disposition: "ligne",
    generer(r, officiel) {
      const n = officiel ? 780 : r.entier(12, 98) * 10;
      const forme = officiel ? "0,1" : r.parmi(["0,1", "0,1", "0,01", "0,5"]);
      if (forme === "0,5")
        return {
          forme,
          enonce: `${n} × 0,5 = …`,
          choix: [
            c(`${n} : 2`, true),
            c(`${n} : ${frac(1, 2)}`, false, `Sait que 0,5 = ${frac(1, 2)} mais change la multiplication en division.`),
            c(`${n} × 0,05`, false, "Choisit l’écriture qui ressemble le plus à celle de l’énoncé."),
            c(`${n} × ${frac(5, 100)}`, false, "Confond cinq dixièmes et cinq centièmes."),
          ],
        };
      const p = forme === "0,1" ? 1 : 2, D = 10 ** p;
      return {
        forme,
        enonce: `${n} × ${forme} = …`,
        choix: [
          c(`${n} : ${nb(String(D))}`, true),
          c(`${n} : ${frac(1, nb(String(D)))}`, false, `Sait que ${forme} = ${frac(1, nb(String(D)))} mais change la multiplication en division.`),
          c(`${n} × ${p === 1 ? "0,01" : "0,001"}`, false, "Choisit l’écriture qui ressemble le plus à celle de l’énoncé."),
          c(`${n} × ${frac(1, nb(String(D * 10)))}`, false, p === 1 ? "Confond centième et dixième." : "Confond millième et centième."),
        ],
      };
    },
  });

  // 29 — « cinq fois trois cinquièmes »
  const PARTS = { 3: "tiers", 4: "quarts", 5: "cinquièmes", 6: "sixièmes", 7: "septièmes", 8: "huitièmes", 9: "neuvièmes", 10: "dixièmes" };
  Q.push({
    num: 29, domaine: "NC", competence: "Connaître le sens d’une fraction : b fois a/b est égal à a",
    entrainement: AUTO("NC12", "Produits, inverses et quotients de fractions"),
    generer(r, officiel) {
      let b = 5, a = 3;
      const forme = officiel ? "fois-avant" : r.parmi(["fois-avant", "multiplie-apres"]);
      if (!officiel) do { b = r.entier(3, 10); a = r.entier(2, b - 1); } while (a * b === b);
      const lu = forme === "fois-avant" ? `${enLettres(b)} fois ${enLettres(a)} ${PARTS[b]}` : `${enLettres(a)} ${PARTS[b]} multipliés par ${enLettres(b)}`;
      return {
        forme,
        enonce: `À quel nombre est égal : « ${lu} » ?`,
        choix: [
          c(String(a), true),
          c(String(a * b), false, `Ne traduit que les nombres entendus et calcule ${b} × ${a} = ${a * b}.`),
          c(String(b), false, `Choisit le nombre « ${enLettres(b)} » entendu deux fois dans l’énoncé.`),
          c(frac(a, b), false, `Ne traduit qu’une partie de l’énoncé : la fraction « ${enLettres(a)} ${PARTS[b]} ».`),
        ],
      };
    },
  });

  // 30 — grand nombre donné par ses unités de numération
  Q.push({
    num: 30, domaine: "NC", competence: "Écrire un grand nombre à partir de sa décomposition en mots",
    entrainement: AUTO("NC01", "Numération décimale"), disposition: "ligne",
    generer(r, officiel) {
      let a = 4, b = 8, cc = 40;
      const forme = officiel ? "du-plus-grand" : r.parmi(["du-plus-grand", "du-plus-petit"]);
      if (!officiel) { a = r.entier(1, 9); b = r.entier(1, 9); cc = 10 * r.entier(2, 9); }
      const N = a * 1e10 + b * 1e8 + cc * 10;
      const sansDizaines = nb(String(a * 1e10 + b * 1e8));
      const morceaux = [`${a} dizaines de milliards`, `${b} centaines de millions`, `${cc} dizaines`];
      const lu = forme === "du-plus-grand" ? `${morceaux[0]}, ${morceaux[1]} et ${morceaux[2]}` : `${morceaux[2]}, ${morceaux[1]} et ${morceaux[0]}`;
      const enTete = forme === "du-plus-grand" ? `${a}${b}${cc}` : `${cc}${b}${a}`;
      return {
        forme,
        enonce: `« ${lu} » correspond au nombre…`,
        choix: [
          c(nb(String(N)), true),
          c(nb(String(a * 1e7 + b * 1e5 + cc * 10)), false, "Confond milliards et millions, millions et milliers."),
          c(nb(enTete.padEnd(12, "0")), false, "Écrit les nombres donnés dans l’ordre, en tête du nombre, puis complète avec des zéros."),
          c(`${sansDizaines.slice(0, -3)}${cc}`, false, `Confond ${cc} dizaines et ${cc} unités.`),
        ],
      };
    },
  });


  // Lot EN10 (décidé avec Gwenaël le 14/11) : les formes qui ne sont PAS des jumeaux stricts (autre cas, autre sens, autre
  // écriture, autre difficulté, ou bonne réponse d'une autre nature). Rien n'est supprimé : elles restent dans `generer`
  // pour la banque par compétence ; le jumeau (EN.genererJumeau) les écarte. Le sujet officiel ne passe jamais par ici.
  const HORS_STRICT = {
    2: { formes: ["produit-dabord-3-chiffres", "somme-dabord-3-chiffres"], pourquoi: "26 361 : pas de zéro à écrire (35 064 en a un)" },
    3: { formes: ["ecrire"], pourquoi: "l'autre sens (écrire au lieu de lire)" },
    4: { formes: ["division"], pourquoi: "72 : 8 au lieu d'un facteur manquant" },
    5: { formes: ["soustraction"], pourquoi: "100 − 54 au lieu d'un complément" },
    6: { formes: ["triangle", "carre", "hexagone", "disque"], pourquoi: "3/4, 5/6, 3/8… au lieu d'une seule part coloriée (1/4) : plus dur. Le jumeau strict : une seule part (formes « une-part-… »)" },
    7: { formes: ["plus-98"], pourquoi: "+ 98 au lieu de + 99" },
    12: { formes: ["dixiemes", "milliemes"], pourquoi: "autre rang" },
    13: { formes: ["milliemes"], pourquoi: "droite graduée en millièmes au lieu de dix-millièmes" },
    15: { formes: ["dizaines-milliemes"], pourquoi: "millièmes au lieu de centièmes" },
    16: { formes: ["entier-moins-decimal"], pourquoi: "15 − 9,7 : autre cas" },
    18: { formes: ["chiffre-du-rang"], pourquoi: "l'autre sens (le chiffre au lieu du rang)" },
    20: { formes: ["quart"], pourquoi: "25 % au lieu de 50 %" },
    24: { formes: ["avant-1"], pourquoi: "fraction plus petite que 1" },
    25: { formes: ["une-decimale", "deux-decimales"], pourquoi: "moins de décimales : plus facile" },
    27: { formes: ["trois-termes"], pourquoi: "trois termes" },
    28: { formes: ["0,5"], pourquoi: "× 0,5 revient à ÷ 2 : autre cas" },
  };

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["5e-automatismes"] = {
    id: "5e-automatismes",
    niveau: "5e",
    titre: "Automatismes",
    annee: 2026,
    source: "DEPP — Évaluation nationale de début de cinquième, septembre 2024, 2025 et 2026 (test spécifique « Automatismes »), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/evaluations-nationales-5e",
    consignes: "Sans calculatrice. Pour chaque question, une seule réponse est juste.",
    domaines: { NC: "Nombres et calculs", GM: "Grandeurs et mesures" },
    // Groupes de maîtrise publiés par la DEPP pour ce test (sur 30), section 7.3.
    seuils: [{ max: 9, nom: "À besoins" }, { max: 17, nom: "Fragile" }, { max: 30, nom: "Satisfaisant" }],
    // Le même sujet est tombé en 2024, 2025 et 2026 (PDF Eduscol comparés : mêmes questions, réponses, figures et repères).
    officiels: [{ cle: "2026", annee: 2026, titre: "Le sujet officiel", detail: "Les vraies questions. Le même sujet est tombé en 2024, 2025 et 2026." }],
    questions: Q,
    horsStrict: HORS_STRICT,
  };
})(typeof window !== "undefined" ? window : globalThis);
