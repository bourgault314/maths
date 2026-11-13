/* maths&go — Évaluation nationale de début de 5e, test spécifique « Automatismes » (DEPP, septembre 2026).
   Source : https://eduscol.education.gouv.fr/evaluations-nationales-5e — licence Etalab 2.0.
   Chaque question existe en version officielle (les valeurs du sujet 2026) et en version « jumelle » :
   même tâche, mêmes pièges (les distracteurs suivent l'analyse publiée par la DEPP, section 7.5 du document
   « Présentation des exercices et compétences »), autres nombres. */
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
  // Figure partagée en parts égales : triangle (4), carré coupé par ses diagonales (4), hexagone (6).
  function partage(forme, coloriees) {
    let parts = [];
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

  // Demi-droite graduée en centièmes (dixièmes en gras), de 0 à 1 + (t+1)/10 environ ; flèche sous 1 + t/10.
  function regle(t) {
    const pas = 5.2, x0 = 14, y = 74, n = 100 + 10 * t + 4;
    let s = `<line x1="${x0}" y1="${y}" x2="${x0 + n * pas + 4}" y2="${y}" stroke="#111" stroke-width="2"/>`;
    for (let i = 0; i <= n; i++) {
      const dixieme = i % 10 === 0, cinq = i % 5 === 0;
      const h = dixieme ? 34 : cinq ? 24 : 15;
      const coul = i === 0 || i === 100 ? "#d61f26" : dixieme ? "#111" : "#8a8a8a";
      s += `<line x1="${(x0 + i * pas).toFixed(1)}" y1="${y - h}" x2="${(x0 + i * pas).toFixed(1)}" y2="${y}" stroke="${coul}" stroke-width="${dixieme ? 2.4 : 1}"/>`;
    }
    s += `<text x="${x0}" y="${y - 40}" font-size="26" font-weight="700" text-anchor="middle" fill="#111">0</text><text x="${x0 + 100 * pas}" y="${y - 40}" font-size="26" font-weight="700" text-anchor="middle" fill="#111">1</text>`;
    const xf = x0 + (100 + 10 * t) * pas;
    s += `<path d="M${xf} ${y + 6} L${xf + 12} ${y + 22} L${xf + 5} ${y + 22} L${xf + 5} ${y + 50} L${xf - 5} ${y + 50} L${xf - 5} ${y + 22} L${xf - 12} ${y + 22}Z" fill="#4472c4"/>`;
    return svg(x0 + n * pas + 16, y + 56, s, "Demi-droite graduée de 0 à 1 avec une flèche");
  }

  // ---------- Les 30 questions ----------
  const Q = [];

  // 1 — plus grande fraction de même dénominateur
  Q.push({
    num: 1, domaine: "NC", competence: "Comparer des fractions de même dénominateur",
    entrainement: AUTO("NC10", "Comparer et encadrer des fractions"),
    generer(r, officiel) {
      const d = officiel ? 5 : r.parmi([3, 4, 6, 7, 8, 9]);
      return {
        enonce: "Quel est le plus grand nombre parmi les nombres suivants ?",
        choix: [
          c(frac(d - 1, d), false, "Ne sait pas comparer des fractions de même dénominateur."),
          c(frac(d, d), false, `Pense qu’une fraction est toujours inférieure ou égale à 1 et choisit ${d}/${d}, qui vaut 1.`),
          c(frac(1, d), false, "Lit mal la consigne et choisit le plus petit nombre au lieu du plus grand."),
          c(frac(d + 1, d), true),
        ],
      };
    },
  });

  // 2 — 35 × 1 000 + 64
  Q.push({
    num: 2, domaine: "NC", competence: "Recomposer un nombre entier (milliers et unités)",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      let a = 35, b = 64;
      if (!officiel) do { a = r.entier(11, 98); b = r.entier(11, 98); } while (a === b || a % 10 === 0 || b % 10 === 0);
      return {
        enonce: `${a} × 1 000 + ${b} = …`,
        choix: [
          c(nb(String(a * 100 + b)), false, `Confond ${a} milliers et ${a} centaines.`),
          c(nb(String(a * 1000 + b)), true),
          c(nb(String(b * 100 + a)), false, `Fait deux erreurs : il confond milliers et centaines et inverse ${a} et ${b}.`),
          c(nb(String(b * 1000 + a)), false, "Inverse la multiplication et l’addition du calcul."),
        ],
      };
    },
  });

  // 3 — lire un grand nombre
  Q.push({
    num: 3, domaine: "NC", competence: "Associer l’écriture en chiffres d’un grand nombre à sa lecture",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      const m = officiel ? 11 : r.entier(12, 19);
      const n = 10 * m;
      return {
        enonce: `Le nombre ${nb(String(n * 1000000))} se lit :`,
        disposition: "ligne",
        choix: [
          c(`${majuscule(enLettres(n))}-mille`, false, `Place ${n} dans la classe des milliers et non des millions : il oublie trois zéros.`),
          c(`${majuscule(enLettres(n))}-millions`, true),
          c(`${majuscule(enLettres(m))} milliards`, false, "Confond la classe des millions et celle des milliards."),
          c(`${majuscule(enLettres(m))} millions`, false, `Repère bien les millions mais oublie un zéro : il lit ${m} millions.`),
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
      if (!officiel) do { a = r.entier(6, 9); b = r.entier(3, 9); } while (a === b || [b - 1, b, b + 1].includes(Math.floor((a * b) / 10)));
      const dz = Math.floor((a * b) / 10);
      return {
        enonce: `${a} × … = ${a * b}`,
        choix: croissant([
          c(String(dz), false, `Prend le chiffre des dizaines du résultat, ${dz}, pour compléter l’égalité.`),
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
      const t = officiel ? 7 : r.parmi([1, 2, 3, 4, 5, 6, 8]);
      const a = 10 * t + 5, rep = 100 - a;
      return {
        enonce: `${a} + … = 100`,
        choix: [
          c(String(rep), true),
          c(String(rep + 5), false, `Ne connaît pas ce complément et se sert d’un fait connu : ${10 * t} + ${100 - 10 * t} = 100.`),
          c(String(rep + 10), false, "Ne connaît pas ce complément et fait une erreur de retenue."),
          c(String(rep + 15), false, "Ne connaît pas ce complément ou ne sait pas le retrouver."),
        ],
      };
    },
  });

  // 6 — fraction d'une figure partagée en parts égales
  const FORMES = [["triangle", 4], ["carre", 4], ["hexagone", 6]];
  Q.push({
    num: 6, domaine: "NC", competence: "Déterminer la fraction d’une surface",
    entrainement: AUTO("NC13", "Fraction d’une quantité"),
    generer(r, officiel) {
      const [forme, n] = officiel ? FORMES[0] : r.parmi(FORMES);
      const k = officiel ? 1 : n === 4 ? r.parmi([1, 3]) : r.parmi([1, 5]);
      const coloriees = officiel ? [0] : r.melanger([...Array(n).keys()]).slice(0, k);
      const f = (a, b) => `${a}/${b}`;
      return {
        enonce: "Quelle fraction de la surface est coloriée ?",
        figure: partage(forme, coloriees),
        choix: [
          c(f(1, 2), false, "Estime à l’œil que la partie coloriée couvre la moitié, sans comparer les aires."),
          c(f(k, n - k), false, "Confond la proportion par rapport au total et par rapport au reste : parts bleues sur parts blanches."),
          c(f(k, n), true),
          c(f(n - k, n), false, "Interprète mal le mot « coloriée » : il donne les parts blanches sur le total."),
        ],
      };
    },
  });

  // 7 — 126 + 99
  Q.push({
    num: 7, domaine: "NC", competence: "Additionner des nombres entiers sans poser l’opération",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      const a = officiel ? 126 : r.entier(1, 8) * 100 + r.entier(1, 8) * 10 + r.entier(1, 9);
      const u = a % 10, H = Math.floor(a / 100);
      return {
        enonce: `${a} + 99 = …`,
        choix: [
          c(String(a + 99), true),
          c(String(a + 101), false, `Ajoute 100 puis ajoute 1 au lieu de l’enlever : ${a} + 101.`),
          c(String(H * 100 + u + 9), false, `Additionne les chiffres des unités (${u} + 9 = ${u + 9}) et en déduit que le résultat se termine par ${u + 9}.`),
          c(String(a + 100), false, "Ajoute 100 mais oublie d’enlever 1."),
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
      if (!officiel) do n = r.entier(21, 98); while (n % 10 === 0 || 5 * n === 10 * n || 5 * (n - 2) === 2 * n);
      return {
        enonce: `5 × ${n} × 2 = …`,
        choix: [
          c(String(5 * n), false, `N’effectue que 5 × ${n}.`),
          c(String(10 * n), true),
          c(String(2 * n), false, `N’effectue que ${n} × 2.`),
          c(String(5 * (n - 2)), false, `Soustrait d’abord 2 à ${n}, puis multiplie par 5.`),
        ],
      };
    },
  });

  // 9 — multiple de 50
  Q.push({
    num: 9, domaine: "NC", competence: "Reconnaître un multiple de 50",
    entrainement: AUTO("NC17", "Critères de divisibilité et exemples"),
    generer(r, officiel) {
      const m = officiel ? 4 : r.entier(2, 18);
      const C = 50 * m;
      return {
        enonce: "Quel nombre est un multiple de 50 ?",
        choix: [
          c(nb(String(C + 25)), false, `Se trompe dans un produit de la table de 50 (il pense par exemple que 50 × ${m + 1} = ${C + 25}).`),
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
      let a = 2, b = 1, x = 8;
      if (!officiel) { a = r.entier(1, 7); b = r.entier(1, 8 - a); x = r.entier(6, 9); }
      return {
        enonce: `${a},${x} + ${b},${x} est égal à…`,
        choix: [
          c(`${a + b},${x}`, false, "N’additionne que les parties entières."),
          c(`${a + b + 1},${2 * x - 10}`, true),
          c(`${a + b},${2 * x}`, false, "Additionne à part les parties entières et les parties décimales, et écrit les deux résultats de chaque côté de la virgule."),
          c(`${a + b},${2 * x - 10}`, false, "Oublie la retenue."),
        ],
      };
    },
  });

  // 11 — 525 : 5
  Q.push({
    num: 11, domaine: "NC", competence: "Diviser un nombre entier par un nombre à un chiffre",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      let d = 5, u = 5;
      if (!officiel) { d = r.parmi([5, 2]); u = d === 5 ? r.parmi([3, 7, 9]) : r.parmi([6, 7, 8, 9]); }
      const n = d * (100 + u), chiffre = ((d * u) % 10) / d;
      return {
        enonce: `${n} : ${d} = …`,
        choix: [
          c(`1${u}`, false, "Oublie le zéro des dizaines dans le quotient."),
          c(`10${u}`, true),
          c(`1${u}0`, false, `Décompose bien (${d * 100} : ${d} = 100 et ${d * u} : ${d} = ${u}) mais place le ${u} au rang des dizaines.`),
          c(`1${chiffre}`, false, "Divise chiffre par chiffre et ne traite pas le chiffre des dizaines."),
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
      if (!officiel) { n = `${r.entier(1, 9)}${r.entier(1, 9)}${r.entier(1, 9)}`; k = r.parmi([1, 2, 2, 3]); }
      const D = 10 ** k;
      return {
        enonce: `${frac(n, nb(String(D)))} = …`,
        choix: [
          c(decaler(n, -k), true),
          c(`${n},${D}`, false, `Remplace la barre de fraction par une virgule : ${D} devient la partie décimale.`),
          c(nb(String(Number(n) * D)), false, `Multiplie ${n} par ${nb(String(D))} au lieu de diviser.`),
          c(decaler(n, -(k + 1)), false, `Divise par ${nb(String(D * 10))} au lieu de ${nb(String(D))} : il se trompe de rang.`),
        ],
      };
    },
  });

  // 13 — nombre indiqué par la flèche (dix-millièmes)
  Q.push({
    num: 13, domaine: "NC", competence: "Lire l’abscisse d’un point sur une portion de droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer(r, officiel) {
      let E = 14, a = 6, b = 1, cc = 8, k = 8;
      if (!officiel) { E = r.entier(2, 39); a = r.entier(1, 9); b = r.entier(1, 4); cc = r.entier(0, 8); k = r.entier(2, 9 - b); }
      const base = `${E},${a}${b}${cc}`, suivant = `${E},${a}${b}${cc + 1}`;
      return {
        enonce: "Quel est le nombre indiqué par la flèche ?",
        figure: portionDroite(base, suivant, k),
        choix: [
          c(`${base}${k}`, true),
          c(`${E},${a}${b + k}`, false, `Traite les parties du nombre comme des entiers, ou part de ${E},${a}${b} et ajoute ${k} graduations.`),
          c(`${E},${a}${k}`, false, `Traite les parties du nombre comme des entiers : ${a}${k} lui paraît plus petit que ${a}${b}${cc + 1}.`),
          c(`${base}0`, false, "Voit qu’il faut quatre chiffres après la virgule, mais ajoute un zéro sans tenir compte des graduations."),
        ],
      };
    },
  });

  // 14 — ordre de grandeur d'un produit
  Q.push({
    num: 14, domaine: "NC", competence: "Estimer l’ordre de grandeur d’un produit",
    entrainement: AUTO("NC03", "Estimer et arrondir"), melange: false,
    generer(r, officiel) {
      let x = "9,8", y = "9,78";
      if (!officiel) {
        const proche = () => r.parmi([[9, r.entier(5, 9)], [10, r.entier(1, 4)]]);
        const [e1, d1] = proche(), [e2, d2] = proche();
        x = `${e1},${d1}`; y = `${e2},${d2}${r.entier(1, 9)}`;
        if (r.suivant() < 0.5) [x, y] = [y, x];
      }
      return {
        enonce: `Quel nombre est le plus proche du résultat de cette multiplication ?<br><span class="calcul">${x} × ${y} ≈ …</span>`,
        choix: [
          c("10", false, "N’arrondit qu’un des deux nombres et oublie la suite du calcul."),
          c("100", true),
          c("1 000", false, "Se trompe sur l’ordre de grandeur d’un des facteurs en oubliant la virgule (il le prend pour 100)."),
          c("10 000", false, "Se trompe sur l’ordre de grandeur des deux facteurs et calcule 100 × 100."),
        ],
      };
    },
  });

  // 15 — 5 dizaines et 3 centièmes
  Q.push({
    num: 15, domaine: "NC", competence: "Écrire un nombre décimal donné par ses unités de numération",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer(r, officiel) {
      let a = 5, b = 3;
      if (!officiel) do { a = r.entier(1, 9); b = r.entier(1, 9); } while (a === b);
      return {
        enonce: `Écrire le nombre qui correspond à ${a} dizaines et ${b} centièmes.`,
        choix: [
          c(`${a}0,0${b}`, true),
          c(`${a}0,${b}00`, false, `Traduit bien ${a} dizaines mais écrit ${b} centièmes « ${b}00 » après la virgule (le « -ième » lui indique seulement la partie décimale).`),
          c(`${b}00,${a}0`, false, "Confond dixièmes et dizaines, centièmes et centaines."),
          c(String(b * 100 + a * 10), false, "Confond centièmes et centaines."),
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
      if (!officiel) do { A = r.entier(11, 19); B = r.entier(2, 9); x = r.entier(1, 7); y = r.entier(x + 1, 9); } while (y - x === 5 || x + y === 10);
      const juste = A + x / 10 - (B + y / 10);
      return {
        enonce: `${A},${x} − ${B},${y} = …`,
        choix: [
          c(`${A - B},${y - x}`, false, "Inverse les chiffres des dixièmes pour faire un calcul sans retenue."),
          c(dec(A + x / 10 + B + y / 10), false, "Additionne les deux nombres au lieu de les soustraire."),
          c(dec(juste), true),
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
      if (!officiel) { E = r.entier(1, 9); a = r.entier(1, 9); b = r.entier(0, 9); cc = r.entier(1, 9); }
      const x = `${E},${a}${b}${cc}`;
      const enc = (m, n) => `${nb(String(m))} &lt; ${x} &lt; ${nb(String(n))}`;
      const trois = 100 * E + 10 * a + b, deux = 10 * E + a, entier = 10 * trois + cc;
      return {
        enonce: `Quel encadrement de ${x} par deux nombres entiers est correct ?`,
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

  // 18 — rang d'un chiffre
  const RANGS_ENT = ["unités", "dizaines", "centaines", "milliers"], RANGS_DEC = ["dixièmes", "centièmes", "millièmes"];
  Q.push({
    num: 18, domaine: "NC", competence: "Connaître le rang d’un chiffre dans un nombre décimal",
    entrainement: AUTO("NC01", "Numération décimale"), disposition: "ligne",
    generer(r, officiel) {
      let chiffres = [1, 7, 3, 5, 8, 4, 2], i = 2; // i : rang décimal visé (2 = millièmes)
      if (!officiel) { chiffres = r.melanger([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 7); i = r.parmi([0, 1, 2]); }
      const nombre = `${chiffres[0]} ${chiffres.slice(1, 4).join("")},${chiffres.slice(4).join("")}`;
      const voisin = i === 2 ? 1 : i === 0 ? 1 : r.parmi([0, 2]);
      return {
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
    num: 19, domaine: "NC", competence: "Multiplier un nombre décimal par 100",
    entrainement: AUTO("NC04", "Calcul mental positif"),
    generer(r, officiel) {
      let a = 3, b = 6;
      if (!officiel) { a = r.entier(1, 19); b = r.entier(1, 9); }
      return {
        enonce: `${a},${b} × 100 = …`,
        choix: [
          c(`${a},${b}00`, false, "Multiplie seulement la partie décimale par 100, ou ajoute deux zéros à la fin."),
          c(`${nb(String(a * 100))},${b}`, false, "Multiplie seulement la partie entière par 100."),
          c(`${a}${b}00`, false, "Multiplie par 1 000, ou ajoute les deux zéros de 100 et enlève la virgule."),
          c(nb(String(a * 100 + b * 10)), true),
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
      const quart = !officiel && r.suivant() < 0.4;
      if (quart)
        return {
          enonce: `${n} × ${frac(1, 4)} permet de calculer…`,
          choix: [
            c(`25 % de ${n}.`, true),
            c(`50 % de ${n}.`, false, "Confond le quart et la moitié."),
            c(`1,4 % de ${n}.`, false, `Prend ${frac(1, 4)} pour 1,4.`),
            c(`1,25 % de ${n}.`, false, `Prend ${frac(1, 4)} pour « un et quart », 1,25.`),
          ],
        };
      return {
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
      if (!officiel) do { a = r.entier(1, 9); b = r.entier(1, 9); } while (a === b);
      return {
        enonce: `${frac(a, 10)} + ${frac(b, 100)} = …`,
        choix: [
          c(`0,${b}${a}`, false, "Inverse dixièmes et centièmes."),
          c(`${a}0${b}`, false, `Met les fractions sur 100 puis colle les numérateurs (${a}0 et ${b}) en oubliant les dénominateurs.`),
          c(`${a}${b}0`, false, `Met les fractions sur 1 000 puis colle les numérateurs en oubliant les dénominateurs.`),
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
      if (!officiel) { n = String(r.entier(2, 9)); a = `${r.entier(1, 9)},${r.entier(1, 9)}`; m = r.parmi(["0,1", "0,5", "10", "3", "4"]); }
      return {
        enonce: `Voici un programme de calcul :<br>• Je choisis le nombre ${n}.<br>• Je lui ajoute ${a}.<br>• Je multiplie le résultat par ${m}.<br><strong>Quel calcul permet de trouver le résultat ?</strong>`,
        choix: [
          c(`( ${n} + ${a} ) × ${m}`, true),
          c(`${n} + ${a} × ${m}`, false, "Suit les étapes dans l’ordre mais ne sait pas utiliser les parenthèses."),
          c(`${n} × ${m} + ${a}`, false, "Remonte le programme sans changer les opérations."),
          c(`${n} + ( ${a} × ${m} )`, false, "Applique « la multiplication est prioritaire » et met les parenthèses autour du produit."),
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
      const v = () => [a + b * k, (a + b) * k, a + b + k, a * k + b];
      if (!officiel) do { a = r.entier(2, 9); b = r.entier(2, 9); k = r.entier(2, 9); } while (a === b || new Set(v()).size < 4);
      const [juste, gauche, somme, inverse] = v();
      return {
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
      const t = officiel ? 1 : r.entier(1, 4);
      return {
        enonce: "Quel est le nombre désigné par la flèche ?",
        figure: regle(t),
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
      let E = 6, a = 5, b = 2, cc = 2, k = 4, j = 1;
      if (!officiel) { E = r.entier(1, 19); a = r.entier(1, 9); b = r.entier(1, 9); cc = r.entier(0, 8); k = r.entier(1, 9); j = r.entier(1, 9); }
      const debut = `${E},${a}${b}`;
      return {
        enonce: `<span class="calcul">${debut}${cc} &lt; … &lt; ${debut}${cc + 1}</span><br>Quel nombre décimal peut-on écrire à la place des … ?`,
        choix: [
          c(`${debut}${cc}${k}`, true),
          c(`${debut}${cc}0`, false, `Ajoute simplement un 0 à ${debut}${cc} : il ne voit pas que ${debut}${cc} et ${debut}${cc}0 sont égaux.`),
          c(`${debut}${(cc + 8) % 10}${j}`, false, "Voit qu’il faut quatre chiffres après la virgule mais se trompe sur le chiffre des millièmes."),
          c(`${debut}${cc + 1}0`, false, `Ajoute simplement un 0 à ${debut}${cc + 1} : il ne voit pas que ${debut}${cc + 1} et ${debut}${cc + 1}0 sont égaux.`),
        ],
      };
    },
  });

  // 26 — volume d'un pavé droit
  Q.push({
    num: 26, domaine: "GM", competence: "Calculer le volume d’un pavé droit avec la formule",
    entrainement: AUTO("EG22", "Volumes de prismes et cylindres"), melange: false, disposition: "ligne",
    generer(r, officiel) {
      let L = 6, l = 5, h = 2;
      const v = () => [L + l + h, L * l, L * l * h, L * L * l * l * h * h];
      if (!officiel) do { [L, l, h] = r.melanger([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3); } while (new Set(v()).size < 4 || L * L * l * l * h * h > 99999);
      const [somme, aire, V, carres] = v();
      return {
        enonce: `Quel est le volume d’un pavé droit dont les côtés mesurent ${L} cm, ${l} cm et ${h} cm ?`,
        choix: croissant([
          c(`${nb(String(somme))} cm³`, false, `Additionne les trois longueurs (${L} + ${l} + ${h}).`),
          c(`${nb(String(aire))} cm³`, false, `Calcule ${L} × ${l} et oublie la troisième longueur : il confond aire et volume.`),
          c(`${nb(String(V))} cm³`, true),
          c(`${nb(String(carres))} cm³`, false, "Retrouve en partie la formule mais met chaque longueur au carré."),
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
      if (!officiel) { d = r.entier(5, 9); a = r.entier(2, Math.floor((d - 1) / 2)); }
      return {
        enonce: `${frac(a, d)} + ${frac(a, d)} = …`,
        choix: [
          c(frac(a, d), false, "Garde le même dénominateur et, par extension, le même numérateur : il n’additionne pas les numérateurs."),
          c(frac(2 * a, d), true),
          c(frac(2 * a, 2 * d), false, "Additionne les numérateurs entre eux et les dénominateurs entre eux."),
          c(frac(a * a, d * d), false, "Multiplie les numérateurs entre eux et les dénominateurs entre eux."),
        ],
      };
    },
  });

  // 28 — 780 × 0,1 = …
  Q.push({
    num: 28, domaine: "NC", competence: "Savoir que multiplier par 0,1 revient à diviser par 10",
    entrainement: AUTO("NC04", "Calcul mental positif"), disposition: "ligne",
    generer(r, officiel) {
      const n = officiel ? 780 : r.entier(12, 98) * 10;
      const p = officiel ? 1 : r.parmi([1, 1, 2]);
      const op = p === 1 ? "0,1" : "0,01", D = 10 ** p;
      return {
        enonce: `${n} × ${op} = …`,
        choix: [
          c(`${n} : ${nb(String(D))}`, true),
          c(`${n} : ${frac(1, nb(String(D)))}`, false, `Sait que ${op} = ${frac(1, nb(String(D)))} mais change la multiplication en division.`),
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
      if (!officiel) do { b = r.entier(3, 10); a = r.entier(2, b - 1); } while (a * b === b);
      return {
        enonce: `À quel nombre est égal : « ${enLettres(b)} fois ${enLettres(a)} ${PARTS[b]} » ?`,
        choix: [
          c(String(a), true),
          c(String(a * b), false, `Ne lit que le début de l’énoncé et calcule ${b} × ${a} = ${a * b}.`),
          c(String(b), false, `Choisit le nombre « ${enLettres(b)} » qu’il entend deux fois dans l’énoncé.`),
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
      if (!officiel) { a = r.entier(1, 9); b = r.entier(1, 9); cc = 10 * r.entier(2, 9); }
      const N = a * 1e10 + b * 1e8 + cc * 10;
      const sansDizaines = nb(String(a * 1e10 + b * 1e8));
      return {
        enonce: `« ${a} dizaines de milliards, ${b} centaines de millions et ${cc} dizaines » correspond au nombre…`,
        choix: [
          c(nb(String(N)), true),
          c(nb(String(a * 1e7 + b * 1e5 + cc * 10)), false, "Confond milliards et millions, millions et milliers."),
          c(nb(`${a}${b}${cc}`.padEnd(12, "0")), false, "Écrit les nombres donnés dans l’ordre, en tête du nombre, puis complète avec des zéros."),
          c(`${sansDizaines.slice(0, -3)}${cc}`, false, `Confond ${cc} dizaines et ${cc} unités.`),
        ],
      };
    },
  });

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
  };
})(typeof window !== "undefined" ? window : globalThis);
