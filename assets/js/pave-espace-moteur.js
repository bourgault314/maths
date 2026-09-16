/* maths&go — moteur des schémas de pavés droits en perspective
   Partagé par outils/espace/generateur_pave_droit.html (fiches papier)
   et outils/espace/pave_droit.html (appli de classe). Aucune dépendance.

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

  function chevauchement(a, b) {
    const dx = Math.abs(a.x - b.x) - (a.l + b.l) / 2;
    const dy = Math.abs(a.y - b.y) - (a.h + b.h) / 2;
    if (dx >= 0 || dy >= 0) return 0;
    return Math.min(-dx, -dy);
  }

  function separer(posees, cadre, largeur, hauteur) {
    // On repousse doucement les étiquettes qui se recouvrent, sans les faire
    // sauter : la position reste une fonction continue de l'orientation.
    for (let tour = 0; tour < 14; tour++) {
      let bouge = false;
      for (let i = 0; i < posees.length; i++) {
        for (let j = i + 1; j < posees.length; j++) {
          const a = posees[i], b = posees[j];
          const r = chevauchement(a, b);
          if (r <= 0) continue;
          let dx = b.x - a.x, dy = b.y - a.y;
          const n = Math.hypot(dx, dy);
          if (n < 0.01) { dx = 0; dy = 1; } else { dx /= n; dy /= n; }
          const d = (r + 1.2) / 2;
          a.x -= dx * d; a.y -= dy * d;
          b.x += dx * d; b.y += dy * d;
          bouge = true;
        }
      }
      if (!bouge) break;
    }
    if (cadre) {
      posees.forEach(function (e) {
        e.x = Math.max(e.l / 2 + 1, Math.min(largeur - e.l / 2 - 1, e.x));
        e.y = Math.max(e.h / 2 + 1, Math.min(hauteur - e.h / 2 - 1, e.y));
      });
    }
  }

  function placerEtiquettes(demandes, segments, options) {
    const opt = options || {};
    const ecart = opt.ecart || 13;
    const posees = [];

    if (opt.fluide) {
      demandes.forEach(function (d) {
        const t = tailleTexte(d.texte, d.corps);
        const r = ecart + Math.max(t.l, t.h) / 2 - d.corps * 0.25;
        posees.push({
          x: d.ancre[0] + d.dir[0] * r, y: d.ancre[1] + d.dir[1] * r,
          l: t.l, h: t.h, texte: d.texte, corps: d.corps, style: d.style
        });
      });
      separer(posees, true, opt.largeur, opt.hauteur);
      return posees;
    }

    // Les sommets choisissent leur place en premier : ils sont accrochés à un
    // point précis, alors qu'une cote peut toujours glisser le long de l'arête.
    const ordre = demandes.slice().sort(function (a, b) {
      return (b.priorite || 0) - (a.priorite || 0);
    });

    ordre.forEach(function (d) {
      const t = tailleTexte(d.texte, d.corps);
      const rayon = ecart + Math.max(t.l, t.h) / 2 - d.corps * 0.25;
      const ancres = d.ancres || [d.ancre];
      const prefere = Math.atan2(d.dir[1], d.dir[0]);
      let meilleur = null;

      ancres.forEach(function (ancre, rangAncre) {
        for (let i = 0; i < 24; i++) {
          const angle = prefere + ((i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI) / 12;
          const x = ancre[0] + Math.cos(angle) * rayon;
          const y = ancre[1] + Math.sin(angle) * rayon;
          const cadre = { x: x, y: y, l: t.l, h: t.h, texte: d.texte, corps: d.corps, style: d.style };

          let proche = Infinity;
          for (let k = 0; k < segments.length; k++) {
            const sg = segments[k];
            proche = Math.min(proche, distancePointSegment(x, y, sg[0], sg[1], sg[2], sg[3]));
          }
          let collision = 0;
          for (let k = 0; k < posees.length; k++) collision += chevauchement(cadre, posees[k]);

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

    separer(posees, true, opt.largeur, opt.hauteur);
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

  const DIAGONALES = {
    base: ["A", "C"],
    grande: ["A", "G"]
  };

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
      cotes: null,               // { L:"5 cm", P:"3 cm", H:"6 cm" } ou null
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
    const boite = { x: o.marge, y: o.marge, largeur: o.largeur - 2 * o.marge, hauteur: o.hauteur - 2 * o.marge };
    // Quand un triangle est rabattu, le solide laisse la place à droite.
    const placeSolide = o.rabattement > 0
      ? { x: boite.x, y: boite.y, largeur: boite.largeur * (1 - 0.34 * o.rabattement), hauteur: boite.hauteur }
      : boite;

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

    if (o.diagonaleBase) {
      const d = DIAGONALES.base;
      const cachee = !proj.facesVues.bas;
      out.push(ligneSVG(pts[d[0]], pts[d[1]], pal.cache, 1.8, cachee ? "5 3" : ""));
    }

    proj.aretes.forEach(function (ar) {
      if (!ar.cachee) out.push(ligneSVG(pts[ar.a], pts[ar.b], pal.trait, 2));
    });

    if (o.diagonaleGrande) {
      // La grande diagonale traverse l'intérieur du pavé : on ne la voit pas,
      // elle se dessine donc en pointillés comme toute ligne cachée.
      const d = DIAGONALES.grande;
      out.push(ligneSVG(pts[d[0]], pts[d[1]], pal.accent, 2.6, "7 4"));
    }

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
    if (o.diagonaleBase) segments.push([pts.A[0], pts.A[1], pts.C[0], pts.C[1]]);
    if (o.diagonaleGrande) segments.push([pts.A[0], pts.A[1], pts.G[0], pts.G[1]]);

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
          ancre: pts[nom], dir: versDehors(pts[nom]), texte: nom,
          corps: o.corpsSommet, style: "sommet", priorite: 3
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
        demandes.push({
          ancre: ancres[0], ancres: ancres, dir: versDehors(ancres[0]),
          texte: texte, corps: o.corpsCote, style: "cote", priorite: 2
        });
      });
    }
    if ((o.nomDiagonales || o.nomDiagonaleBase) && o.diagonaleBase) {
      const an = leLong(pts.A, pts.C, [0.5, 0.38, 0.62, 0.3]);
      demandes.push({ ancre: an[0], ancres: an, dir: versDehors(an[0]), texte: "AC", corps: o.corpsCote, style: "diag", priorite: 1 });
    }
    if ((o.nomDiagonales || o.nomDiagonaleGrande) && o.diagonaleGrande) {
      const an = leLong(pts.A, pts.G, [0.5, 0.4, 0.6, 0.32]);
      demandes.push({ ancre: an[0], ancres: an, dir: versDehors(an[0]), texte: "AG", corps: o.corpsCote + 1, style: "accent", priorite: 1 });
    }
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
        out.push(texteSVG(r.pts[i][0] + d[0] * rr, r.pts[i][1] + d[1] * rr, nom, o.corpsSommet, pal.surligne, true, true));
      });
      out.push("</g>");
    }

    placerEtiquettes(demandes, segments, {
      ecart: Math.max(11, o.corpsSommet * 0.85),
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
