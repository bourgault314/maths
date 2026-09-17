/* maths&go — moteur des schémas de pavés droits en perspective
   Utilisé par outils/espace/pave_droit.html : la même figure sert au tableau
   (vue « stable », le solide tourne) et à la fiche papier (vue « juste »,
   export SVG ou PNG). Aucune dépendance.

   Repère : x vers la droite (largeur), y vers le fond (profondeur), z vers le haut (hauteur).
   Sommets : A avant-gauche-bas, B avant-droit-bas, C arrière-droit-bas, D arrière-gauche-bas,
             E, F, G, H juste au-dessus de A, B, C, D.
*/
(function (root, fabrique) {
  const api = fabrique();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MathsGoPaveEspace = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ palette
     Reprise des couleurs des fiches Pythagore pour que l'écran et le papier
     racontent la même chose. */
  const PALETTE = {
    trait: "#17324D",     // arêtes vues
    cache: "#9aa7b4",     // arêtes cachées et diagonale de base
    accent: "#F28C28",    // la longueur cherchée
    surligne: "#08A6A6",  // triangle mis en avant
    avant: "#F6F8FA",
    haut: "#EAF8F7",
    droite: "#EDF1F5",
    fond: "#ffffff"
  };

  const POLICE_FICHE = "DejaVu Sans, Arial, Helvetica, sans-serif";

  /* --------------------------------------------------------------- géométrie */
  const NOMS = ["A", "B", "C", "D", "E", "F", "G", "H"];

  const FACES = [
    { id: "bas", sommets: ["A", "B", "C", "D"], normale: [0, 0, -1], teinte: "avant" },
    { id: "haut", sommets: ["E", "F", "G", "H"], normale: [0, 0, 1], teinte: "haut" },
    { id: "avant", sommets: ["A", "B", "F", "E"], normale: [0, -1, 0], teinte: "avant" },
    { id: "arriere", sommets: ["D", "C", "G", "H"], normale: [0, 1, 0], teinte: "avant" },
    { id: "gauche", sommets: ["A", "D", "H", "E"], normale: [-1, 0, 0], teinte: "droite" },
    { id: "droite", sommets: ["B", "C", "G", "F"], normale: [1, 0, 0], teinte: "droite" }
  ];

  const ARETES = [
    ["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"],
    ["E", "F"], ["F", "G"], ["G", "H"], ["H", "E"],
    ["A", "E"], ["B", "F"], ["C", "G"], ["D", "H"]
  ];

  function creerPave(largeur, profondeur, hauteur) {
    const L = Number(largeur), P = Number(profondeur), H = Number(hauteur);
    const sommets = {
      A: [0, 0, 0], B: [L, 0, 0], C: [L, P, 0], D: [0, P, 0],
      E: [0, 0, H], F: [L, 0, H], G: [L, P, H], H: [0, P, H]
    };
    const aretes = ARETES.map(function (paire) {
      const faces = FACES.filter(function (f) {
        return f.sommets.indexOf(paire[0]) >= 0 && f.sommets.indexOf(paire[1]) >= 0;
      }).map(function (f) { return f.id; });
      return { a: paire[0], b: paire[1], faces: faces };
    });
    return {
      dimensions: { L: L, P: P, H: H },
      sommets: sommets,
      aretes: aretes,
      faces: FACES,
      centre: [L / 2, P / 2, H / 2],
      rayon: Math.hypot(L, P, H) / 2
    };
  }

  const longueur3D = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

  /* ------------------------------------------------------------- projections
     Une projection est une matrice 2×3 : [ligne u ; ligne v].
     u = abscisse écran, v = ordonnée vers le HAUT (on inverse au tracé). */

  // Perspective cavalière : la face avant en vraie forme, fuyantes à `angle`
  // degrés réduites du coefficient `coef` (0,5 dans les manuels).
  function matriceCavaliere(coef, angleDeg) {
    const a = (angleDeg * Math.PI) / 180;
    return [
      [1, coef * Math.cos(a), 0],
      [0, coef * Math.sin(a), 1]
    ];
  }

  // Vue réelle : projection orthographique, caméra repérée par son azimut
  // (rotation autour de la verticale) et son élévation.
  // azimut 0 et élévation 0 = vue de face ; élévation 90 = vue de dessus.
  function matriceReelle(azimutDeg, elevationDeg) {
    const a = (azimutDeg * Math.PI) / 180;
    const e = (elevationDeg * Math.PI) / 180;
    const ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(e), se = Math.sin(e);
    return [
      [ca, -sa, 0],
      [sa * se, ca * se, ce]
    ];
  }

  // Mélange continu entre deux projections : c'est ce mélange qui fait passer
  // le dessin de la feuille à l'objet réel sans coupure.
  function melanger(M1, M2, t) {
    const u = Math.max(0, Math.min(1, t));
    const mix = (x, y) => x * (1 - u) + y * u;
    return [
      [mix(M1[0][0], M2[0][0]), mix(M1[0][1], M2[0][1]), mix(M1[0][2], M2[0][2])],
      [mix(M1[1][0], M2[1][0]), mix(M1[1][1], M2[1][1]), mix(M1[1][2], M2[1][2])]
    ];
  }

  const produitVectoriel = (p, q) => [
    p[1] * q[2] - p[2] * q[1],
    p[2] * q[0] - p[0] * q[2],
    p[0] * q[1] - p[1] * q[0]
  ];

  // Direction qui pointe vers l'observateur : c'est la direction que la
  // projection écrase, donc le produit vectoriel de ses deux lignes.
  const versObservateur = (M) => produitVectoriel(M[0], M[1]);

  /* --------------------------------------------------------------- projection
     Rend les points écran, les faces vues et les arêtes cachées. */
  function projeter(solide, M, vue) {
    const ech = vue.echelle, ox = vue.ox, oy = vue.oy;
    const pts = {};
    NOMS.forEach(function (n) {
      const p = solide.sommets[n];
      const u = M[0][0] * p[0] + M[0][1] * p[1] + M[0][2] * p[2];
      const v = M[1][0] * p[0] + M[1][1] * p[1] + M[1][2] * p[2];
      pts[n] = [ox + u * ech, oy - v * ech];
    });

    const obs = versObservateur(M);
    const vues = {};
    solide.faces.forEach(function (f) {
      const d = f.normale[0] * obs[0] + f.normale[1] * obs[1] + f.normale[2] * obs[2];
      vues[f.id] = d > 1e-9;
    });

    const aretes = solide.aretes.map(function (ar) {
      return {
        a: ar.a, b: ar.b,
        cachee: ar.faces.every(function (id) { return !vues[id]; })
      };
    });

    return { pts: pts, facesVues: vues, aretes: aretes, observateur: obs };
  }

  // Cadrage serré : on projette, on mesure, on ajuste à la boîte demandée.
  function cadrerAuPlusJuste(solide, M, boite) {
    const brut = projeter(solide, M, { echelle: 1, ox: 0, oy: 0 });
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    NOMS.forEach(function (n) {
      const p = brut.pts[n];
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    });
    const l = Math.max(x1 - x0, 1e-6), h = Math.max(y1 - y0, 1e-6);
    const ech = Math.min(boite.largeur / l, boite.hauteur / h);
    return {
      echelle: ech,
      ox: boite.x + (boite.largeur - l * ech) / 2 - x0 * ech,
      oy: boite.y + (boite.hauteur - h * ech) / 2 - y0 * ech
    };
  }

  // Cadrage stable : l'échelle ne dépend plus de l'orientation, le solide ne
  // respire donc pas quand on le fait tourner devant la classe.
  function cadrerStable(solide, boite, M) {
    const ech = (Math.min(boite.largeur, boite.hauteur) * 0.44) / Math.max(solide.rayon, 1e-6);
    const c = solide.centre;
    const u = M[0][0] * c[0] + M[0][1] * c[1] + M[0][2] * c[2];
    const v = M[1][0] * c[0] + M[1][1] * c[1] + M[1][2] * c[2];
    return {
      echelle: ech,
      ox: boite.x + boite.largeur / 2 - u * ech,
      oy: boite.y + boite.hauteur / 2 + v * ech
    };
  }

  /* ---------------------------------------------------------- placement auto
     Chaque étiquette cherche sa place : on essaie 24 directions autour du
     point à nommer et on garde celle qui s'éloigne le plus des traits et des
     étiquettes déjà posées, sans trop s'écarter de la direction naturelle. */

  function distancePointSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const n2 = dx * dx + dy * dy;
    let t = n2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / n2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function tailleTexte(texte, corps) {
    return { l: String(texte).length * corps * 0.58 + 2, h: corps * 1.02 };
  }

  // `marge` = le blanc qu'on veut voir rester entre deux étiquettes. Sans lui,
  // deux textes séparés de zéro pixel sont « sans recouvrement » et paraissent
  // pourtant collés : c'est ce qui faisait toucher « 3 cm » et « B ».
  function chevauchement(a, b, marge) {
    const m = marge || 0;
    const dx = Math.abs(a.x - b.x) - (a.l + b.l) / 2 - m;
    const dy = Math.abs(a.y - b.y) - (a.h + b.h) / 2 - m;
    if (dx >= 0 || dy >= 0) return 0;
    return Math.min(-dx, -dy);
  }

  function separer(posees, cadre, largeur, hauteur, marge) {
    // On repousse doucement les étiquettes qui se recouvrent, sans les faire
    // sauter : la position reste une fonction continue de l'orientation.
    // Le partage n'est pas égal : une lettre de sommet est accrochée à un point
    // précis, elle cède moins de terrain qu'une cote, qui peut glisser.
    // Petits pas, plus de tours : on converge vers la même place au lieu de
    // la dépasser. En classe, ce qui compte est que le dessin ne sursaute pas
    // d'une image à l'autre pendant qu'on tourne le solide.
    for (let tour = 0; tour < 40; tour++) {
      let bouge = false;
      for (let i = 0; i < posees.length; i++) {
        for (let j = i + 1; j < posees.length; j++) {
          const a = posees[i], b = posees[j];
          const r = chevauchement(a, b, marge);
          if (r <= 0) continue;
          let dx = b.x - a.x, dy = b.y - a.y;
          const n = Math.hypot(dx, dy);
          if (n < 0.01) { dx = 0; dy = 1; } else { dx /= n; dy /= n; }
          const ma = a.mobilite == null ? 1 : a.mobilite;
          const mb = b.mobilite == null ? 1 : b.mobilite;
          const somme = ma + mb > 0.01 ? ma + mb : 1;
          const d = (r + 1.2) * 0.5;
          a.x -= dx * d * (ma / somme); a.y -= dy * d * (ma / somme);
          b.x += dx * d * (mb / somme); b.y += dy * d * (mb / somme);
          bouge = true;
        }
      }
      // Une étiquette ne s'éloigne jamais de ce qu'elle nomme : sans cette
      // laisse, un « B » repoussé finirait par désigner le vide.
      posees.forEach(function (e) {
        if (!e.attache || !(e.laisse > 0)) return;
        const ex = e.x - e.attache[0], ey = e.y - e.attache[1];
        const d = Math.hypot(ex, ey);
        if (d > e.laisse) {
          e.x = e.attache[0] + (ex / d) * e.laisse;
          e.y = e.attache[1] + (ey / d) * e.laisse;
        }
      });
      if (cadre) {
        posees.forEach(function (e) {
          e.x = Math.max(e.l / 2 + 1, Math.min(largeur - e.l / 2 - 1, e.x));
          e.y = Math.max(e.h / 2 + 1, Math.min(hauteur - e.h / 2 - 1, e.y));
        });
      }
      if (!bouge) break;
    }
  }

  function placerEtiquettes(demandes, segments, options) {
    const opt = options || {};
    const ecart = opt.ecart || 13;
    const respiration = opt.marge == null ? 4 : opt.marge;
    // Jusqu'où une étiquette accepte de s'écarter du point ou de l'arête qu'elle nomme.
    const laisseDe = function (d, rayon) { return rayon * (d.style === "sommet" ? 1.35 : 2.4); };
    const posees = [];

    if (opt.fluide) {
      demandes.forEach(function (d) {
        const t = tailleTexte(d.texte, d.corps);
        // Pas d'écart supplémentaire ici : en classe le solide tourne, et une
        // étiquette posée plus loin fait un saut plus large quand elle change
        // de côté. La place se gagne par la marge de respiration.
        const r = ecart + Math.max(t.l, t.h) / 2 - d.corps * 0.25;
        posees.push({
          x: d.ancre[0] + d.dir[0] * r, y: d.ancre[1] + d.dir[1] * r,
          l: t.l, h: t.h, texte: d.texte, corps: d.corps, style: d.style,
          mobilite: d.mobilite, attache: d.ancre, laisse: laisseDe(d, r)
        });
      });
      // Respiration réduite pendant la rotation : juste de quoi décoller les
      // étiquettes, sans les faire voyager à chaque image.
      separer(posees, true, opt.largeur, opt.hauteur, respiration * 0.45);
      return posees;
    }

    // Les sommets choisissent leur place en premier : ils sont accrochés à un
    // point précis, alors qu'une cote peut toujours glisser le long de l'arête.
    const ordre = demandes.slice().sort(function (a, b) {
      return (b.priorite || 0) - (a.priorite || 0);
    });

    ordre.forEach(function (d) {
      const t = tailleTexte(d.texte, d.corps);
      const rayon = ecart + (d.ecartSup || 0) + Math.max(t.l, t.h) / 2 - d.corps * 0.25;
      const ancres = d.ancres || [d.ancre];
      const prefere = Math.atan2(d.dir[1], d.dir[0]);
      let meilleur = null;

      ancres.forEach(function (ancre, rangAncre) {
        for (let i = 0; i < 24; i++) {
          const angle = prefere + ((i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI) / 12;
          const x = ancre[0] + Math.cos(angle) * rayon;
          const y = ancre[1] + Math.sin(angle) * rayon;
          const cadre = {
            x: x, y: y, l: t.l, h: t.h, texte: d.texte, corps: d.corps, style: d.style,
            mobilite: d.mobilite, attache: ancre, laisse: laisseDe(d, rayon)
          };

          let proche = Infinity;
          for (let k = 0; k < segments.length; k++) {
            const sg = segments[k];
            proche = Math.min(proche, distancePointSegment(x, y, sg[0], sg[1], sg[2], sg[3]));
          }
          let collision = 0;
          for (let k = 0; k < posees.length; k++) collision += chevauchement(cadre, posees[k], respiration);

          const ecartAngle = Math.abs(((angle - prefere + Math.PI) % (2 * Math.PI)) - Math.PI);
          const marge = Math.max(t.l, t.h) / 2;
          const note = Math.min(proche, marge + 6) * 1.6
            - collision * 9
            - ecartAngle * 3.4
            - rangAncre * 1.5;
          if (!meilleur || note > meilleur.note) meilleur = { note: note, cadre: cadre };
        }
      });
      posees.push(meilleur.cadre);
    });

    separer(posees, true, opt.largeur, opt.hauteur, respiration);
    return posees;
  }

  /* ------------------------------------------------------------------- tracé */
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const n2 = (v) => (Math.round(v * 100) / 100);

  function texteSVG(x, y, contenu, corps, couleur, gras, halo, italique) {
    const h = halo
      ? ' paint-order="stroke" stroke="#ffffff" stroke-width="3.6" stroke-linejoin="round"'
      : "";
    return '<text x="' + n2(x) + '" y="' + n2(y + corps * 0.35) + '" font-size="' + corps +
      '" text-anchor="middle" fill="' + couleur + '"' +
      (gras ? ' font-weight="bold"' : "") +
      (italique ? ' font-style="italic"' : "") + h + ">" + esc(contenu) + "</text>";
  }

  function ligneSVG(p, q, couleur, epaisseur, tirets) {
    return '<line x1="' + n2(p[0]) + '" y1="' + n2(p[1]) + '" x2="' + n2(q[0]) + '" y2="' + n2(q[1]) +
      '" stroke="' + couleur + '" stroke-width="' + epaisseur + '" stroke-linecap="round"' +
      (tirets ? ' stroke-dasharray="' + tirets + '"' : "") + "/>";
  }

  // Petit carré de l'angle droit au sommet s, entre les deux points voisins.
  function angleDroitSVG(s, v1, v2, cote, couleur) {
    const u1 = [v1[0] - s[0], v1[1] - s[1]], u2 = [v2[0] - s[0], v2[1] - s[1]];
    const n1 = Math.hypot(u1[0], u1[1]) || 1, nn2 = Math.hypot(u2[0], u2[1]) || 1;
    const a = [s[0] + (u1[0] / n1) * cote, s[1] + (u1[1] / n1) * cote];
    const b = [s[0] + (u2[0] / nn2) * cote, s[1] + (u2[1] / nn2) * cote];
    const c = [a[0] + b[0] - s[0], a[1] + b[1] - s[1]];
    return '<polyline points="' + n2(a[0]) + "," + n2(a[1]) + " " + n2(c[0]) + "," + n2(c[1]) +
      " " + n2(b[0]) + "," + n2(b[1]) + '" fill="none" stroke="' + couleur + '" stroke-width="1.6"/>';
  }

  /* Les lettres affichées. On accepte "IJKLMNOP", ["I","J",…] ou {A:"I",…} ;
     tout ce qui manque garde la lettre d'origine, pour que la figure reste
     lisible pendant qu'on tape. */
  function lireLettres(demande) {
    const table = {};
    const liste = typeof demande === "string" ? Array.from(demande.trim()) : demande;
    NOMS.forEach(function (n, i) {
      let v = null;
      if (Array.isArray(liste)) v = liste[i];
      else if (liste && typeof liste === "object") v = liste[n];
      v = (v === undefined || v === null) ? "" : String(v).trim();
      table[n] = v || n;
    });
    return table;
  }

  // Un segment entre deux sommets : arête du solide, diagonale d'une face, ou
  // traversée de l'intérieur. C'est ce qui décide du trait plein ou pointillé.
  function placerSegment(solide, proj, a, b) {
    const arete = solide.aretes.find(function (ar) {
      return (ar.a === a && ar.b === b) || (ar.a === b && ar.b === a);
    });
    if (arete) {
      return { arete: true, cache: arete.faces.every(function (id) { return !proj.facesVues[id]; }) };
    }
    const face = solide.faces.find(function (f) {
      return f.sommets.indexOf(a) >= 0 && f.sommets.indexOf(b) >= 0;
    });
    if (face) return { arete: false, cache: !proj.facesVues[face.id] };
    // Ni arête ni diagonale de face : le segment traverse le pavé, on ne le
    // voit jamais — la règle des pointillés vaut aussi pour lui.
    return { arete: false, cache: true };
  }

  /* Construit le dessin complet. Renvoie { corps, svg } :
     `corps` = le contenu, `svg` = un document SVG autonome. */
  function dessiner(config) {
    const o = Object.assign({
      solide: null,
      projection: null,
      largeur: 520,
      hauteur: 380,
      marge: 34,
      palette: PALETTE,
      police: POLICE_FICHE,
      cadrage: "juste",          // "juste" (fiche) ou "stable" (classe)
      faces: true,
      nomsSommets: true,
      lettres: null,             // 8 lettres affichées à la place de A…H
      cotes: null,               // { L:"5 cm", P:"3 cm", H:"6 cm" } ou null
      segments: null,            // [{ a:"A", b:"G", nom:true, couleur:"accent" }]
      diagonaleBase: false,
      diagonaleGrande: false,
      nomDiagonales: false,        // raccourci : nomme les deux
      nomDiagonaleBase: false,
      nomDiagonaleGrande: false,
      angleDroitBase: false,
      triangle: null,            // ex. ["A","B","C"]
      rabattement: 0,            // 0 = dans le solide, 1 = posé à plat en vraie forme
      uniteRabattement: "cm",
      corpsSommet: 13,
      corpsCote: 11,
      etiquettesFluides: false,
      fondOpaque: false
    }, config);

    const pal = o.palette;
    const solide = o.solide;
    // Les lettres des sommets sont libres : la géométrie garde ses noms A…H,
    // seul l'affichage change. Une lettre manquante reprend celle d'origine.
    const lettres = lireLettres(o.lettres);

    // Un segment se trace entre deux sommets quelconques. Les deux anciennes
    // options « diagonale de la base » et « grande diagonale » sont désormais
    // deux segments comme les autres.
    const traits = [];
    if (o.diagonaleBase) {
      traits.push({ a: "A", b: "C", nom: !!(o.nomDiagonales || o.nomDiagonaleBase), couleur: "cache" });
    }
    if (o.diagonaleGrande) {
      traits.push({ a: "A", b: "G", nom: !!(o.nomDiagonales || o.nomDiagonaleGrande), couleur: "accent" });
    }
    (o.segments || []).forEach(function (t) {
      if (!t || !t.a || !t.b || t.a === t.b) return;
      if (NOMS.indexOf(t.a) < 0 || NOMS.indexOf(t.b) < 0) return;
      traits.push({ a: t.a, b: t.b, nom: !!t.nom, couleur: t.couleur || "accent" });
    });
    const boite = { x: o.marge, y: o.marge, largeur: o.largeur - 2 * o.marge, hauteur: o.hauteur - 2 * o.marge };
    // Quand un triangle est rabattu, le solide laisse la place à droite.
    let placeSolide = o.rabattement > 0
      ? { x: boite.x, y: boite.y, largeur: boite.largeur * (1 - 0.34 * o.rabattement), hauteur: boite.hauteur }
      : boite;

    // Les cotes s'écrivent en dehors du solide. Quand la plus large ne tient pas
    // dans la marge, on rétrécit un peu le dessin plutôt que de l'écraser contre
    // le bord. Cadrage de fiche seulement : en classe, l'échelle ne doit pas
    // changer quand on affiche les dimensions.
    if (o.cadrage !== "stable" && o.cotes) {
      let large = 0;
      ["L", "P", "H"].forEach(function (k) {
        if (o.cotes[k]) large = Math.max(large, tailleTexte(o.cotes[k], o.corpsCote).l);
      });
      const recul = Math.max(0, Math.min(
        Math.max(11, o.corpsSommet * 0.85) + large - o.marge,
        Math.min(o.largeur, o.hauteur) * 0.09
      ));
      if (recul > 0) {
        placeSolide = {
          x: placeSolide.x + recul, y: placeSolide.y + recul,
          largeur: placeSolide.largeur - 2 * recul, hauteur: placeSolide.hauteur - 2 * recul
        };
      }
    }

    const vue = o.cadrage === "stable"
      ? cadrerStable(solide, placeSolide, o.projection)
      : cadrerAuPlusJuste(solide, o.projection, placeSolide);
    const proj = projeter(solide, o.projection, vue);
    const pts = proj.pts;

    const out = [];
    if (o.fondOpaque) {
      out.push('<rect x="0" y="0" width="' + o.largeur + '" height="' + o.hauteur + '" fill="' + pal.fond + '"/>');
    }

    /* faces vues */
    if (o.faces) {
      solide.faces.forEach(function (f) {
        if (!proj.facesVues[f.id]) return;
        const pp = f.sommets.map(function (s) { return n2(pts[s][0]) + "," + n2(pts[s][1]); }).join(" ");
        out.push('<polygon points="' + pp + '" fill="' + pal[f.teinte] + '"/>');
      });
    }

    /* arêtes cachées puis vues */
    proj.aretes.forEach(function (ar) {
      if (ar.cachee) out.push(ligneSVG(pts[ar.a], pts[ar.b], pal.cache, 1.3, "4 3"));
    });

    // Les segments discrets passent sous les arêtes vues, les segments mis en
    // avant passent par-dessus : c'est ce qu'on veut regarder.
    traits.forEach(function (t) {
      if (t.couleur === "accent") return;
      t.pose = placerSegment(solide, proj, t.a, t.b);
      out.push(ligneSVG(pts[t.a], pts[t.b], pal.cache, 1.8, t.pose.cache ? "5 3" : ""));
    });

    proj.aretes.forEach(function (ar) {
      if (!ar.cachee) out.push(ligneSVG(pts[ar.a], pts[ar.b], pal.trait, 2));
    });

    traits.forEach(function (t) {
      if (t.couleur !== "accent") return;
      // Un segment qui traverse l'intérieur du pavé ne se voit pas : il se
      // dessine en pointillés, comme toute ligne cachée.
      t.pose = placerSegment(solide, proj, t.a, t.b);
      out.push(ligneSVG(pts[t.a], pts[t.b], pal.accent, 2.6, t.pose.cache ? "7 4" : ""));
    });

    /* triangle mis en avant, puis rabattu */
    let sommetsRabattus = null;
    if (o.triangle) {
      const T = o.triangle;
      const dansSolide = T.map(function (s) { return pts[s]; });
      const ppSolide = dansSolide.map(function (p) { return n2(p[0]) + "," + n2(p[1]); }).join(" ");
      out.push('<polygon points="' + ppSolide + '" fill="' + pal.surligne + '" fill-opacity="0.16" stroke="' +
        pal.surligne + '" stroke-width="2.6" stroke-linejoin="round" stroke-opacity="' +
        n2(1 - 0.45 * o.rabattement) + '"/>');
      let dessines = null;

      if (o.rabattement > 0) {
        const cible = poserAPlat(solide, T, {
          x: boite.x + boite.largeur * (1 - 0.32),
          y: boite.y + boite.hauteur * 0.30,
          largeur: boite.largeur * 0.32,
          hauteur: boite.hauteur * 0.62
        });
        const t = o.rabattement;
        dessines = dansSolide.map(function (p, i) {
          return [p[0] + (cible.pts[i][0] - p[0]) * t, p[1] + (cible.pts[i][1] - p[1]) * t];
        });
        sommetsRabattus = { noms: T, pts: dessines, info: cible.info, avancement: t };
        const pp = dessines.map(function (p) { return n2(p[0]) + "," + n2(p[1]); }).join(" ");
        out.push('<polygon points="' + pp + '" fill="' + pal.surligne + '" fill-opacity="0.22" stroke="' +
          pal.surligne + '" stroke-width="2.8" stroke-linejoin="round"/>');
      }
    }

    /* cotes */
    const segments = [];
    proj.aretes.forEach(function (ar) {
      segments.push([pts[ar.a][0], pts[ar.a][1], pts[ar.b][0], pts[ar.b][1]]);
    });
    traits.forEach(function (t) {
      segments.push([pts[t.a][0], pts[t.a][1], pts[t.b][0], pts[t.b][1]]);
    });

    const centreEcran = [
      (pts.A[0] + pts.G[0] + pts.B[0] + pts.H[0]) / 4,
      (pts.A[1] + pts.G[1] + pts.B[1] + pts.H[1]) / 4
    ];
    const versDehors = function (p) {
      const dx = p[0] - centreEcran[0], dy = p[1] - centreEcran[1];
      const n = Math.hypot(dx, dy) || 1;
      return [dx / n, dy / n];
    };

    const demandes = [];
    const leLong = function (p, q, parts) {
      return parts.map(function (u) {
        return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
      });
    };

    if (o.nomsSommets) {
      NOMS.forEach(function (nom) {
        demandes.push({
          ancre: pts[nom], dir: versDehors(pts[nom]), texte: lettres[nom],
          corps: o.corpsSommet, style: "sommet", priorite: 3, mobilite: 0.32
        });
      });
    }
    if (o.cotes) {
      const paires = [["L", "A", "B"], ["P", "B", "C"], ["H", "A", "E"]];
      paires.forEach(function (p) {
        const texte = o.cotes[p[0]];
        if (!texte) return;
        // Vue de dessus, vue de face… : une arête vue en bout se réduit à un
        // point, sa cote n'a plus de place et n'a plus de sens. On la retire.
        const vueEnBout = Math.hypot(pts[p[2]][0] - pts[p[1]][0], pts[p[2]][1] - pts[p[1]][1]);
        if (vueEnBout < o.corpsCote * 2.2) return;
        const ancres = leLong(pts[p[1]], pts[p[2]], [0.5, 0.36, 0.64, 0.26, 0.74]);
        // Sur une arête courte — la fuyante d'un pavé peu profond — la cote n'a
        // pas la place de se glisser entre les deux lettres des extrémités.
        // On l'écarte alors davantage du solide plutôt que de la coincer contre
        // un sommet ; l'écart varie continûment, le dessin ne saute pas.
        const place = tailleTexte(texte, o.corpsCote).l + o.corpsSommet * 1.9;
        const ecartSup = Math.max(0, Math.min((place - vueEnBout) * 0.26, o.corpsCote * 1.5));
        demandes.push({
          ancre: ancres[0], ancres: ancres, dir: versDehors(ancres[0]),
          texte: texte, corps: o.corpsCote, style: "cote", priorite: 2, ecartSup: ecartSup
        });
      });
    }
    traits.forEach(function (t) {
      if (!t.nom) return;
      const vif = t.couleur === "accent";
      const an = leLong(pts[t.a], pts[t.b], vif ? [0.5, 0.4, 0.6, 0.32] : [0.5, 0.38, 0.62, 0.3]);
      demandes.push({
        ancre: an[0], ancres: an, dir: versDehors(an[0]),
        texte: lettres[t.a] + lettres[t.b],
        corps: vif ? o.corpsCote + 1 : o.corpsCote,
        style: vif ? "accent" : "diag", priorite: 1
      });
    });
    if (o.angleDroitBase && proj.facesVues.bas) {
      out.push(angleDroitSVG(pts.B, pts.A, pts.C, 12, pal.trait));
    }

    /* triangle rabattu : côtés en vraie longueur et angle droit */
    if (sommetsRabattus && sommetsRabattus.avancement > 0.55) {
      const r = sommetsRabattus;
      const opacite = Math.min(1, (r.avancement - 0.55) / 0.35);
      const cTri = [(r.pts[0][0] + r.pts[1][0] + r.pts[2][0]) / 3,
                    (r.pts[0][1] + r.pts[1][1] + r.pts[2][1]) / 3];
      const horsTri = function (p) {
        const dx = p[0] - cTri[0], dy = p[1] - cTri[1];
        const n = Math.hypot(dx, dy) || 1;
        return [dx / n, dy / n];
      };
      out.push('<g opacity="' + n2(opacite) + '">');
      if (r.info.droit >= 0) {
        const i = r.info.droit;
        out.push(angleDroitSVG(r.pts[i], r.pts[(i + 1) % 3], r.pts[(i + 2) % 3], 11, pal.surligne));
      }
      r.info.cotes.forEach(function (c) {
        const p1 = r.pts[c.i], p2 = r.pts[c.j];
        const m = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
        const legende = c.texte + (o.uniteRabattement ? " " + o.uniteRabattement : "");
        // On sort la mesure PERPENDICULAIREMENT à son côté, juste assez loin
        // pour que le cadre du texte ne morde plus le trait.
        let nx = -(p2[1] - p1[1]), ny = p2[0] - p1[0];
        const nn = Math.hypot(nx, ny) || 1; nx /= nn; ny /= nn;
        const vers = horsTri(m);
        if (nx * vers[0] + ny * vers[1] < 0) { nx = -nx; ny = -ny; }
        const tt = tailleTexte(legende, o.corpsCote);
        const rr = Math.abs(nx) * tt.l / 2 + Math.abs(ny) * tt.h / 2 + o.corpsCote * 0.5;
        out.push(texteSVG(m[0] + nx * rr, m[1] + ny * rr, legende, o.corpsCote, pal.trait, false, true));
      });
      r.noms.forEach(function (nom, i) {
        const d = horsTri(r.pts[i]);
        const rr = o.corpsSommet * 0.95;
        out.push(texteSVG(r.pts[i][0] + d[0] * rr, r.pts[i][1] + d[1] * rr, lettres[nom] || nom, o.corpsSommet, pal.surligne, true, true));
      });
      out.push("</g>");
    }

    placerEtiquettes(demandes, segments, {
      ecart: Math.max(11, o.corpsSommet * 0.85),
      marge: Math.max(3, o.corpsCote * 0.42),
      fluide: o.etiquettesFluides,
      largeur: o.largeur, hauteur: o.hauteur
    }).forEach(function (e) {
      const couleur = e.style === "accent" ? pal.accent : (e.style === "diag" ? "#6b7885" : pal.trait);
      out.push(texteSVG(e.x, e.y, e.texte, e.corps, couleur, e.style === "sommet" || e.style === "accent", true));
    });

    const corps = out.join("");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + o.largeur + " " + o.hauteur +
      '" width="' + o.largeur + '" height="' + o.hauteur + '" font-family="' + o.police + '">' +
      corps + "</svg>";
    return { corps: corps, svg: svg, points: pts, projection: proj };
  }

  /* Le triangle sorti du solide, dessiné en vraie forme dans la boîte donnée. */
  function poserAPlat(solide, noms, boite) {
    const P = noms.map(function (n) { return solide.sommets[n]; });
    const c = longueur3D(P[0], P[1]);   // côté 0-1
    const a = longueur3D(P[1], P[2]);   // côté 1-2
    const b = longueur3D(P[0], P[2]);   // côté 0-2
    const x = (b * b + c * c - a * a) / (2 * c);
    const y = Math.sqrt(Math.max(0, b * b - x * x));
    let plans = [[0, 0], [c, 0], [x, -y]];

    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    plans.forEach(function (p) {
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    });
    const ech = Math.min(boite.largeur / Math.max(x1 - x0, 1e-6), boite.hauteur / Math.max(y1 - y0, 1e-6)) * 0.82;
    const ox = boite.x + (boite.largeur - (x1 - x0) * ech) / 2 - x0 * ech;
    const oy = boite.y + (boite.hauteur - (y1 - y0) * ech) / 2 - y0 * ech;
    const pts = plans.map(function (p) { return [ox + p[0] * ech, oy + p[1] * ech]; });

    // Quel sommet porte l'angle droit ?
    const cotes = [
      { i: 0, j: 1, v: c }, { i: 1, j: 2, v: a }, { i: 0, j: 2, v: b }
    ];
    const tri = cotes.slice().sort(function (p, q) { return p.v - q.v; });
    let droit = -1;
    if (Math.abs(tri[0].v * tri[0].v + tri[1].v * tri[1].v - tri[2].v * tri[2].v) < 1e-6 * Math.max(1, tri[2].v * tri[2].v)) {
      // le sommet opposé au plus grand côté
      const grand = tri[2];
      droit = [0, 1, 2].find(function (k) { return k !== grand.i && k !== grand.j; });
    }
    return {
      pts: pts,
      info: {
        droit: droit,
        cotes: cotes.map(function (k) {
          return { i: k.i, j: k.j, texte: formaterLongueur(k.v) };
        })
      }
    };
  }

  function formaterLongueur(v) {
    const arrondi = Math.round(v * 100) / 100;
    const exact = Math.abs(arrondi - Math.round(arrondi)) < 1e-9;
    const texte = exact ? String(Math.round(arrondi)) : arrondi.toFixed(2).replace(/0$/, "").replace(".", ",");
    return (exact ? "" : "≈ ") + texte;
  }

  /* ------------------------------------------------------- vues remarquables */
  const VUES = {
    dessin: { azimut: -35, elevation: 20 },      // proche du dessin en perspective
    face: { azimut: 0, elevation: 0 },
    dessus: { azimut: 0, elevation: 90 },
    acg: null                                     // calculée : le plan ACG de face
  };

  // Le plan vertical qui contient A, C et G est vu de face quand la caméra
  // regarde perpendiculairement à la droite (AC) : azimut = angle de AC.
  function vueTriangleACG(solide) {
    const L = solide.dimensions.L, P = solide.dimensions.P;
    const azimut = -(Math.atan2(P, L) * 180) / Math.PI;
    return { azimut: azimut, elevation: 0 };
  }

  return {
    PALETTE: PALETTE,
    POLICE_FICHE: POLICE_FICHE,
    NOMS: NOMS,
    creerPave: creerPave,
    lireLettres: lireLettres,
    matriceCavaliere: matriceCavaliere,
    matriceReelle: matriceReelle,
    melanger: melanger,
    projeter: projeter,
    dessiner: dessiner,
    cadrerAuPlusJuste: cadrerAuPlusJuste,
    cadrerStable: cadrerStable,
    longueur3D: longueur3D,
    formaterLongueur: formaterLongueur,
    vueTriangleACG: vueTriangleACG,
    VUES: VUES
  };
});
