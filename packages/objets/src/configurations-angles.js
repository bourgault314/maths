// Configurations d'angles maths&go — version 1, STATUT BROUILLON.
//
// Famille A du chantier « configurations géométriques » : les scènes
// d'angles du collège (sécantes, supplémentaires, complémentaires,
// bissectrice, parallèles coupées par une sécante, triangle, angle
// extérieur, quadrilatère), en TROIS couches séparées :
//
//   creerConfigurationAngles(options)   → l'instance (modèle sémantique
//     + géométrie calculée + RELATIONS connues par construction) ;
//   resoudreConfigurationAngles(...)    → la solution (mesure + étapes) ;
//   dessinerConfigurationAngles(...)    → le SVG (aucun théorème ici).
//
// Règle capitale : les relations (opposés, correspondants,
// alternes-internes…) sont établies par les DEMI-DROITES SIGNÉES,
// jamais par « en haut à gauche » — elles survivent à toute rotation
// et à tout miroir, et c'est testé.

import {
  RAD,
  angleInterieurPolygone,
  angleSigne,
  distance,
  normaliserAngle,
  pointsArc,
  secteurAngulaire,
  sommetsQuadrilatere,
  sommetsTriangle,
} from "./geometrie.js";
import { briquesSvg, clipDroiteAuCadre, echapper, formaterAngle } from "./figure.js";
import { COULEURS_ROLES } from "./figure.js";
import {
  angle as angleExpr,
  difference,
  egalite,
  mesure as mesureExpr,
  somme,
  versTexte,
  versUnicode,
} from "./expressions.js";

export const VERSION_CONFIGURATIONS_ANGLES = 1;

const { ligne, polyligne, croix, texte, px, enveloppeSvg } = briquesSvg;
const ENCRE = "#0f172a";

const dir = (deg) => [Math.cos(deg * RAD), Math.sin(deg * RAD)];
const oppose = (u) => [-u[0], -u[1]];

// mesure du secteur allant de la demi-droite versA à la demi-droite
// versB en passant du côté « intérieur » naturel (le plus petit secteur)
const mesureEntre = (u, v) => Math.abs(angleSigne(u, v)) / RAD;

// ---------------------------------------------------------------------------
// Construction des instances
// ---------------------------------------------------------------------------

function creerAngle(id, nom, sommet, versA, versB) {
  return { id, nom, sommet, versA, versB, mesureDeg: mesureEntre(versA, versB) };
}

/**
 * Crée une configuration d'angles.
 *
 * @param {object} options
 * @param {string} options.type — « secantes », « perpendiculaires »,
 *   « supplementaires », « complementaires », « bissectrice »,
 *   « paralleles-secante », « triangle », « angle-exterieur »,
 *   « quadrilatere »
 * @param {number} [options.angleDeg] — l'angle caractéristique
 * @param {number} [options.orientationDeg] — rotation d'ensemble
 * @param {boolean} [options.miroir]
 * @param {string} [options.lettres] — les lettres d'habillage
 * @param {[number,number,number]} [options.angles] — pour le triangle
 * @returns {object} instance : { type, sommets, droites, angles, relations,
 *   paralleles, description }
 */
export function creerConfigurationAngles(options = {}) {
  const {
    type,
    angleDeg = 50,
    orientationDeg = 12,
    miroir = false,
    lettres = null,
  } = options;
  if (!(angleDeg > 0 && angleDeg < 180)) {
    throw new RangeError("configuration : l'angle caractéristique doit être entre 0° et 180° exclus");
  }
  const signe = miroir ? -1 : 1;
  const o = orientationDeg;
  const d = (deg) => dir(o + signe * deg);

  if (type === "secantes" || type === "perpendiculaires") {
    const alpha = type === "perpendiculaires" ? 90 : angleDeg;
    const [A, B, C, D, O] = (lettres ?? "ABCDO").split("");
    const u = d(0);
    const v = d(alpha);
    const angles = [
      creerAngle("O:u+.v+", `${A}${O}${B}`, O, u, v),
      creerAngle("O:v+.u-", `${B}${O}${C}`, O, v, oppose(u)),
      creerAngle("O:u-.v-", `${C}${O}${D}`, O, oppose(u), oppose(v)),
      creerAngle("O:v-.u+", `${D}${O}${A}`, O, oppose(v), u),
    ];
    return {
      type,
      version: 1,
      sommets: { [O]: [0, 0] },
      pointsSurRayons: { [A]: u, [B]: v, [C]: oppose(u), [D]: oppose(v) },
      droites: [
        { id: "d1", par: O, direction: u, lettres: [C, A] },
        { id: "d2", par: O, direction: v, lettres: [D, B] },
      ],
      angles,
      relations: [
        // perpendiculaires : chaque angle est DROIT par construction —
        // la relation se suffit à elle-même, sans mesure donnée
        ...(type === "perpendiculaires"
          ? angles.map((a) => ({ type: "droit", angles: [a.id] }))
          : []),
        { type: "opposes", angles: [angles[0].id, angles[2].id] },
        { type: "opposes", angles: [angles[1].id, angles[3].id] },
        ...angles.map((a, i) => ({
          type: "adjacents-supplementaires",
          angles: [a.id, angles[(i + 1) % 4].id],
        })),
      ],
      parallelisme: [],
      description: type === "perpendiculaires"
        ? "deux droites perpendiculaires"
        : `deux droites sécantes en ${O}, quatre angles`,
    };
  }

  if (type === "supplementaires" || type === "complementaires" || type === "bissectrice") {
    const total = type === "supplementaires" ? 180 : type === "complementaires" ? 90 : angleDeg;
    const premier = type === "bissectrice" ? angleDeg / 2 : angleDeg;
    if (type !== "bissectrice" && !(angleDeg < total)) {
      throw new RangeError(`configuration : l'angle doit être inférieur à ${total}°`);
    }
    const [A, X, B, O] = (lettres ?? "AXBO").split("");
    const u = d(0);
    const w = d(premier);
    const fin = d(total);
    const angles = [
      creerAngle("O:1", `${A}${O}${X}`, O, u, w),
      creerAngle("O:2", `${X}${O}${B}`, O, w, fin),
    ];
    const relations = [];
    if (type === "supplementaires") relations.push({ type: "adjacents-supplementaires", angles: [angles[0].id, angles[1].id] });
    if (type === "complementaires") relations.push({ type: "complementaires", angles: [angles[0].id, angles[1].id] });
    if (type === "bissectrice") relations.push({ type: "bissectrice", angles: [angles[0].id, angles[1].id], demiDroite: `[${O}${X})` });
    return {
      type,
      version: 1,
      sommets: { [O]: [0, 0] },
      pointsSurRayons: { [A]: u, [X]: w, [B]: fin },
      droites: [],
      demiDroites: [
        { id: "r1", par: O, direction: u },
        { id: "r2", par: O, direction: w },
        { id: "r3", par: O, direction: fin },
      ],
      angles,
      relations,
      parallelisme: [],
      description: type === "bissectrice"
        ? `la bissectrice [${O}${X}) partage l'angle ${A}${O}${B} en deux angles égaux`
        : `deux angles ${type} de sommet ${O}`,
    };
  }

  if (type === "paralleles-secante") {
    const [A, B, C, D, E, F, S, T] = (lettres ?? "ABCDEFST").split("");
    const u = d(0); // direction des parallèles
    const v = d(angleDeg); // direction de la sécante, de E vers F
    const angles = [];
    // huit secteurs : (sommet, signe sur la parallèle, signe sur la sécante)
    // sv est relatif à la direction GLOBALE v (E→F)
    const nomRayon = {
      E: { "u+": B, "u-": A, "v+": F, "v-": S },
      F: { "u+": D, "u-": C, "v+": T, "v-": E },
    };
    for (const sommet of [E, F]) {
      for (const su of [1, -1]) {
        for (const sv of [1, -1]) {
          const versU = su === 1 ? u : oppose(u);
          const versV = sv === 1 ? v : oppose(v);
          const cle = sommet === E ? "E" : "F";
          const nom = `${nomRayon[cle][su === 1 ? "u+" : "u-"]}${sommet}${nomRayon[cle][sv === 1 ? "v+" : "v-"]}`;
          angles.push({
            ...creerAngle(`${sommet}:u${su === 1 ? "+" : "-"}.v${sv === 1 ? "+" : "-"}`, nom, sommet, versU, versV),
            su,
            sv,
          });
        }
      }
    }
    const angleDe = (sommet, su, sv) =>
      angles.find((a) => a.sommet === sommet && a.su === su && a.sv === sv);
    const relations = [];
    // intérieur : côté sécante tourné vers l'AUTRE intersection
    // (en E : sv = +1 ; en F : sv = −1) — établi par les vecteurs, pas l'écran
    for (const su of [1, -1]) {
      for (const sv of [1, -1]) {
        relations.push({
          type: "correspondants",
          angles: [angleDe(E, su, sv).id, angleDe(F, su, sv).id],
        });
      }
      relations.push({
        type: "alternes-internes",
        angles: [angleDe(E, su, 1).id, angleDe(F, -su, -1).id],
      });
      relations.push({
        type: "alternes-externes",
        angles: [angleDe(E, su, -1).id, angleDe(F, -su, 1).id],
      });
      relations.push({
        type: "co-interieurs",
        angles: [angleDe(E, su, 1).id, angleDe(F, su, -1).id],
      });
    }
    for (const sommet of [E, F]) {
      relations.push({ type: "opposes", angles: [angleDe(sommet, 1, 1).id, angleDe(sommet, -1, -1).id] });
      relations.push({ type: "opposes", angles: [angleDe(sommet, 1, -1).id, angleDe(sommet, -1, 1).id] });
    }
    return {
      type,
      version: 1,
      sommets: { [E]: [0, 0], [F]: [v[0], v[1]] }, // F = E + 1·v (échelle libre)
      droites: [
        { id: "d1", par: E, direction: u, lettres: [A, B] },
        { id: "d2", par: F, direction: u, lettres: [C, D] },
        { id: "s", par: E, direction: v, lettres: [S, T] },
      ],
      angles,
      relations,
      parallelisme: [["d1", "d2"]],
      secante: "s",
      description: `deux droites parallèles (${A}${B}) et (${C}${D}) coupées par la sécante (${S}${T})`,
    };
  }

  if (type === "triangle" || type === "angle-exterieur") {
    const nom = lettres ?? "ABC";
    const sommets = sommetsTriangle(
      options.angles ? { angles: options.angles } : { angles: [65, 50, 65] },
    );
    const angles = sommets.map((v, i) => {
      const s = angleInterieurPolygone(sommets, i);
      return {
        id: `angle:${nom[i]}`,
        nom: `${nom[(i + 2) % 3]}${nom[i]}${nom[(i + 1) % 3]}`,
        sommet: nom[i],
        versA: dir(s.depart / RAD),
        versB: dir((s.depart + s.delta) / RAD),
        mesureDeg: s.mesureDeg,
      };
    });
    const relations = [{ type: "somme-triangle", angles: angles.map((a) => a.id), somme: 180 }];
    let exterieur = null;
    if (type === "angle-exterieur") {
      // prolonger [BC) au-delà de C : l'angle extérieur en C
      const [A, B, C] = [0, 1, 2].map((i) => sommets[i]);
      const prolonge = [C[0] + (C[0] - B[0]), C[1] + (C[1] - B[1])];
      exterieur = {
        id: "angle:exterieur",
        nom: `${nom[0]}${nom[2]}D`,
        sommet: nom[2],
        mesureDeg: 180 - angles[2].mesureDeg,
        pointProlonge: prolonge,
      };
      relations.push({ type: "adjacents-supplementaires", angles: [angles[2].id, exterieur.id] });
      relations.push({
        type: "angle-exterieur",
        angles: [exterieur.id, angles[0].id, angles[1].id],
      });
    }
    return {
      type,
      version: 1,
      nom,
      sommetsPolygone: sommets,
      angles: exterieur ? [...angles, exterieur] : angles,
      relations,
      parallelisme: [],
      description:
        type === "triangle"
          ? `les trois angles du triangle ${nom}`
          : `l'angle extérieur en ${nom[2]} du triangle ${nom}`,
    };
  }

  if (type === "quadrilatere") {
    const nom = lettres ?? "ABCD";
    const sommets = sommetsQuadrilatere({
      points: options.points ?? [[0, 0], [5, 0.4], [5.8, 3.6], [1, 4.1]],
    });
    const angles = sommets.map((v, i) => {
      const s = angleInterieurPolygone(sommets, i);
      return {
        id: `angle:${nom[i]}`,
        nom: `${nom[(i + 3) % 4]}${nom[i]}${nom[(i + 1) % 4]}`,
        sommet: nom[i],
        mesureDeg: s.mesureDeg,
      };
    });
    return {
      type,
      version: 1,
      nom,
      sommetsPolygone: sommets,
      angles,
      relations: [{ type: "somme-quadrilatere", angles: angles.map((a) => a.id), somme: 360 }],
      parallelisme: [],
      description: `les quatre angles du quadrilatère ${nom}`,
    };
  }

  throw new RangeError(`configuration : type inconnu « ${type} »`);
}

// ---------------------------------------------------------------------------
// Solveur — les relations font le travail, jamais le dessin
// ---------------------------------------------------------------------------

const PHRASES = {
  opposes: (n1, n2) =>
    `Les angles ${n1} et ${n2} sont opposés par le sommet, donc ils ont la même mesure.`,
  correspondants: (n1, n2, contexte) =>
    `${contexte} Les angles ${n1} et ${n2} sont correspondants, donc ils ont la même mesure.`,
  "alternes-internes": (n1, n2, contexte) =>
    `${contexte} Les angles ${n1} et ${n2} sont alternes-internes, donc ils ont la même mesure.`,
  "alternes-externes": (n1, n2, contexte) =>
    `${contexte} Les angles ${n1} et ${n2} sont alternes-externes, donc ils ont la même mesure.`,
  bissectrice: (n1, n2, demiDroite) =>
    `La demi-droite ${demiDroite} est la bissectrice, donc les angles ${n1} et ${n2} ont la même mesure.`,
};

/**
 * Résout la mesure d'un angle inconnu à partir des mesures données et
 * des relations de l'instance.
 *
 * @param {object} instance
 * @param {object} donnees — { valeurs: { idAngle: mesureDeg }, inconnue: idAngle }
 * @returns {{ inconnue, mesureDeg, relation, etapes }}
 */
export function resoudreConfigurationAngles(instance, { valeurs = {}, inconnue } = {}) {
  const angleParId = (id) => {
    const a = instance.angles.find((x) => x.id === id);
    if (!a) throw new RangeError(`configuration : angle inconnu « ${id} »`);
    return a;
  };
  const cible = angleParId(inconnue);
  const nomC = (a) => a.nom;
  const contexteParallele = () => {
    const [d1, d2] = instance.parallelisme[0] ?? [];
    const nomDroite = (id) => {
      const droite = instance.droites.find((x) => x.id === id);
      return droite ? `(${droite.lettres.join("")})` : `(${id})`;
    };
    return instance.parallelisme.length
      ? `Les droites ${nomDroite(d1)} et ${nomDroite(d2)} sont parallèles et la droite ${nomDroite(instance.secante)} est une sécante.`
      : "";
  };

  for (const relation of instance.relations) {
    if (!relation.angles.includes(inconnue)) continue;
    const autres = relation.angles.filter((id) => id !== inconnue);
    if (!autres.every((id) => id in valeurs)) continue;

    if (relation.type === "droit") {
      const [d1, d2] = instance.droites;
      const nomDroite = (d) => `(${d.lettres.join("")})`;
      return {
        inconnue,
        mesureDeg: 90,
        relation: "droit",
        etapes: [
          {
            genre: "justification",
            texte: `Les droites ${nomDroite(d1)} et ${nomDroite(d2)} sont perpendiculaires, donc elles forment quatre angles droits.`,
          },
          { genre: "calcul", expression: egalite(angleExpr(nomC(cible)), mesureExpr(90, "°")) },
          {
            genre: "conclusion",
            texte: `Donc ${versUnicode(angleExpr(nomC(cible)))} = ${versUnicode(mesureExpr(90, "°"))}.`,
          },
        ],
      };
    }

    const egaux = ["opposes", "correspondants", "alternes-internes", "alternes-externes", "bissectrice"];
    if (egaux.includes(relation.type)) {
      const source = angleParId(autres[0]);
      const mesureDeg = valeurs[autres[0]];
      const phrase =
        relation.type === "bissectrice"
          ? PHRASES.bissectrice(nomC(source), nomC(cible), relation.demiDroite)
          : relation.type === "opposes"
            ? PHRASES.opposes(nomC(source), nomC(cible))
            : PHRASES[relation.type](nomC(source), nomC(cible), contexteParallele());
      return {
        inconnue,
        mesureDeg,
        relation: relation.type,
        etapes: [
          { genre: "justification", texte: phrase },
          {
            genre: "calcul",
            expression: egalite(angleExpr(nomC(cible)), angleExpr(nomC(source)), mesureExpr(mesureDeg, "°", { decimales: 1 })),
          },
          { genre: "conclusion", texte: `Donc ${versUnicode(angleExpr(nomC(cible)))} = ${versUnicode(mesureExpr(mesureDeg, "°", { decimales: 1 }))}.` },
        ],
      };
    }

    const sommes = {
      "adjacents-supplementaires": { total: 180, phrase: "forment un angle plat" },
      "co-interieurs": { total: 180, phrase: null },
      complementaires: { total: 90, phrase: "forment un angle droit" },
      "somme-triangle": { total: 180, phrase: null },
      "somme-quadrilatere": { total: 360, phrase: null },
    };
    if (relation.type in sommes) {
      const { total } = sommes[relation.type];
      const connus = autres.map((id) => ({ nom: nomC(angleParId(id)), valeur: valeurs[id] }));
      const mesureDeg = total - connus.reduce((s, c) => s + c.valeur, 0);
      if (!(mesureDeg > 0)) {
        throw new RangeError("configuration : les mesures données dépassent la somme totale");
      }
      const justification =
        relation.type === "somme-triangle"
          ? "La somme des mesures des angles d'un triangle est égale à 180°."
          : relation.type === "somme-quadrilatere"
            ? "La somme des mesures des angles d'un quadrilatère est égale à 360°."
            : relation.type === "complementaires"
              ? `Les angles ${connus[0].nom} et ${nomC(cible)} sont complémentaires : leur somme est égale à 90°.`
              : relation.type === "co-interieurs"
                ? `${contexteParallele()} Les angles ${connus[0].nom} et ${nomC(cible)} sont intérieurs du même côté de la sécante, donc supplémentaires.`
                : `Les angles ${connus[0].nom} et ${nomC(cible)} sont adjacents et ${sommes[relation.type].phrase} : leur somme est égale à 180°.`;
      return {
        inconnue,
        mesureDeg,
        relation: relation.type,
        etapes: [
          { genre: "justification", texte: justification },
          {
            genre: "calcul",
            expression: egalite(
              somme(...connus.map((c) => angleExpr(c.nom)), angleExpr(nomC(cible))),
              mesureExpr(total, "°"),
            ),
          },
          {
            genre: "calcul",
            expression: egalite(
              angleExpr(nomC(cible)),
              connus.reduce((expr, c) => difference(expr, mesureExpr(c.valeur, "°", { decimales: 1 })), mesureExpr(total, "°")),
              mesureExpr(mesureDeg, "°", { decimales: 1 }),
            ),
          },
          { genre: "conclusion", texte: `Donc ${versUnicode(angleExpr(nomC(cible)))} = ${versUnicode(mesureExpr(mesureDeg, "°", { decimales: 1 }))}.` },
        ],
      };
    }

    if (relation.type === "angle-exterieur") {
      // extérieur = somme des deux angles non adjacents
      const [exterieurId, ...interieurs] = relation.angles;
      if (inconnue !== exterieurId) continue;
      const connus = interieurs.map((id) => ({ nom: nomC(angleParId(id)), valeur: valeurs[id] }));
      const mesureDeg = connus.reduce((s, c) => s + c.valeur, 0);
      return {
        inconnue,
        mesureDeg,
        relation: relation.type,
        etapes: [
          {
            genre: "justification",
            texte: "L'angle extérieur d'un triangle est égal à la somme des deux angles intérieurs non adjacents.",
          },
          {
            genre: "calcul",
            expression: egalite(
              angleExpr(nomC(cible)),
              somme(...connus.map((c) => mesureExpr(c.valeur, "°", { decimales: 1 }))),
              mesureExpr(mesureDeg, "°", { decimales: 1 }),
            ),
          },
          { genre: "conclusion", texte: `Donc ${versUnicode(angleExpr(nomC(cible)))} = ${versUnicode(mesureExpr(mesureDeg, "°", { decimales: 1 }))}.` },
        ],
      };
    }
  }
  throw new RangeError(
    "configuration : aucune relation ne permet de trouver cet angle avec les mesures données",
  );
}

/**
 * Rend la rédaction d'une solution, en profil « complet » (toutes les
 * étapes) ou « compact » (justification abrégée + résultat).
 * Chaque étape rend son texte, son écriture unicode et son texte
 * accessible — jamais de HTML concaténé.
 */
export function redigerConfigurationAngles(solution, { profil = "complet" } = {}) {
  const lignes = solution.etapes.map((etape) => ({
    genre: etape.genre,
    texte: etape.texte ?? null,
    unicode: etape.expression ? versUnicode(etape.expression) : null,
    accessible: etape.expression ? versTexte(etape.expression) : etape.texte,
  }));
  if (profil === "compact") {
    return lignes.filter((l) => l.genre !== "justification" || lignes.indexOf(l) === 0);
  }
  return lignes;
}

// ---------------------------------------------------------------------------
// Dessin — le SVG ne recalcule aucun théorème
// ---------------------------------------------------------------------------

const versEcran = (u) => [u[0], -u[1]]; // repère mathématique → écran

/**
 * Dessine la configuration.
 *
 * @param {object} instance
 * @param {object} [display] — { taille, hauteur, theme, montrer: [{ id,
 *   couleur, texte, arcs, secteur }], noms, marquesDroits }
 */
export function dessinerConfigurationAngles(instance, display = {}) {
  const largeur = display.taille ?? 360;
  const hauteur = display.hauteur ?? Math.round(largeur * 0.72);
  const theme = display.theme ?? "noir";
  const enCouleur = theme === "couleur";
  const couleurTrait = enCouleur ? "#1d4ed8" : ENCRE;
  const marge = 16;
  const montrer = display.montrer ?? [];
  const noms = display.noms ?? true;
  const morceaux = [];

  // — polygones (triangle, quadrilatère) : réutilise la géométrie réelle —
  if (instance.sommetsPolygone) {
    const sommets = instance.sommetsPolygone;
    const xs = sommets.map((p) => p[0]);
    const ys = sommets.map((p) => p[1]);
    const grandX = Math.max(...xs) - Math.min(...xs);
    const grandY = Math.max(...ys) - Math.min(...ys);
    const echelle = Math.min((largeur - 2 * 46) / grandX, (hauteur - 2 * 46) / grandY);
    const points = sommets.map((p) => [
      46 + (p[0] - Math.min(...xs)) * echelle,
      46 + (Math.max(...ys) - p[1]) * echelle,
    ]);
    const n = points.length;
    const centre = [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
    // prolongement éventuel (angle extérieur)
    const exterieur = instance.angles.find((a) => a.id === "angle:exterieur");
    if (exterieur) {
      const B = points[1];
      const C = points[2];
      const prolonge = [C[0] + (C[0] - B[0]) * 0.55, C[1] + (C[1] - B[1]) * 0.55];
      morceaux.push(ligne(C, prolonge, { couleur: couleurTrait, epaisseur: 2.5, pointilles: true }));
      morceaux.push(texte("D", [prolonge[0] + 12, prolonge[1] - 10], { couleur: couleurTrait, taille: 17 }));
    }
    // secteurs demandés (sous le contour)
    for (const [rang, demande] of montrer.entries()) {
      const a = instance.angles.find((x) => x.id === demande.id || x.nom === demande.id);
      if (!a) throw new RangeError(`configuration : angle à montrer inconnu « ${demande.id} »`);
      const couleur = demande.couleur ?? (enCouleur ? COULEURS_ROLES[rang % 3] : ENCRE);
      const indice = instance.nom.indexOf(a.sommet);
      const sommetEcran = indice >= 0 ? points[indice] : null;
      let secteurInfo;
      if (a.id === "angle:exterieur") {
        const B = points[1];
        const C = points[2];
        const prolonge = [C[0] + (C[0] - B[0]), C[1] + (C[1] - B[1])];
        secteurInfo = secteurAngulaire(C, points[0], prolonge);
        dessinerSecteur(morceaux, C, secteurInfo, a.mesureDeg, demande, couleur, enCouleur);
      } else {
        const s = angleInterieurPolygone(points, indice);
        secteurInfo = { depart: s.depart, delta: s.delta };
        dessinerSecteur(morceaux, sommetEcran, secteurInfo, a.mesureDeg, demande, couleur, enCouleur);
      }
    }
    // contour PAR-DESSUS les secteurs (le trait domine)
    for (let i = 0; i < n; i++) {
      morceaux.push(ligne(points[i], points[(i + 1) % n], { couleur: couleurTrait, epaisseur: 4 }));
    }
    if (noms) {
      points.forEach((p, i) => {
        const s = angleInterieurPolygone(points, i);
        const dehors = s.depart + s.delta / 2 + Math.PI;
        morceaux.push(
          texte(instance.nom[i], [p[0] + Math.cos(dehors) * 20, p[1] + Math.sin(dehors) * 20], {
            couleur: couleurTrait,
            taille: 19,
          }),
        );
      });
    }
    return enveloppeSvg(largeur, hauteur, instance.description, morceaux.join(""));
  }

  // — scènes de droites (sécantes, parallèles-sécante, demi-droites) —
  const centres = {};
  const nomsSommets = Object.keys(instance.sommets);
  if (nomsSommets.length === 1) {
    centres[nomsSommets[0]] = [largeur / 2, hauteur / 2];
  } else {
    // parallèles-sécante : les deux intersections de part et d'autre du centre
    const [premier, second] = nomsSommets;
    const v = versEcran(instance.droites.find((d) => d.id === instance.secante).direction);
    const demiEcart = Math.min(largeur, hauteur) * 0.24;
    centres[premier] = [largeur / 2 - v[0] * demiEcart, hauteur / 2 - v[1] * demiEcart];
    centres[second] = [largeur / 2 + v[0] * demiEcart, hauteur / 2 + v[1] * demiEcart];
  }

  // secteurs demandés d'abord (sous les traits)
  for (const [rang, demande] of montrer.entries()) {
    const a = instance.angles.find((x) => x.id === demande.id || x.nom === demande.id);
    if (!a) throw new RangeError(`configuration : angle à montrer inconnu « ${demande.id} »`);
    const sommetEcran = centres[a.sommet];
    const u = versEcran(a.versA);
    const v = versEcran(a.versB);
    const secteur = secteurAngulaire(sommetEcran, [sommetEcran[0] + u[0], sommetEcran[1] + u[1]], [sommetEcran[0] + v[0], sommetEcran[1] + v[1]]);
    const couleur = demande.couleur ?? (enCouleur ? COULEURS_ROLES[rang % 3] : ENCRE);
    dessinerSecteur(morceaux, sommetEcran, secteur, a.mesureDeg, demande, couleur, enCouleur);
  }

  // droites et demi-droites PAR-DESSUS
  for (const droite of instance.droites ?? []) {
    const par = centres[droite.par];
    const angleEcran = Math.atan2(-droite.direction[1], droite.direction[0]);
    const [p1, p2] = clipDroiteAuCadre(par, angleEcran, largeur, hauteur, marge);
    morceaux.push(ligne(p1, p2, { couleur: couleurTrait, epaisseur: 3.5 }));
    if (noms && droite.lettres) {
      // les lettres aux deux bouts, côté extérieur
      const normale = angleEcran + Math.PI / 2;
      for (const [bout, lettre] of [[p1, droite.lettres[0]], [p2, droite.lettres[1]]]) {
        morceaux.push(
          texte(lettre, [bout[0] + Math.cos(normale) * 14 - Math.cos(angleEcran) * 10 * Math.sign(bout === p1 ? -1 : 1), bout[1] + Math.sin(normale) * 14], {
            couleur: couleurTrait,
            taille: 16,
          }),
        );
      }
    }
  }
  for (const demiDroite of instance.demiDroites ?? []) {
    const par = centres[demiDroite.par];
    const u = versEcran(demiDroite.direction);
    const portee = Math.min(largeur, hauteur) / 2 - marge;
    morceaux.push(
      ligne(par, [par[0] + u[0] * portee, par[1] + u[1] * portee], { couleur: couleurTrait, epaisseur: 3.5 }),
    );
  }

  // sommets d'intersection : croix + nom
  for (const [nomSommet, position] of Object.entries(centres)) {
    morceaux.push(croix(position, { couleur: couleurTrait, taille: 5 }));
    if (noms) {
      morceaux.push(texte(nomSommet, [position[0] + 14, position[1] + 16], { couleur: couleurTrait, taille: 17 }));
    }
  }
  // points d'habillage sur les rayons
  if (noms && instance.pointsSurRayons) {
    const sommet = centres[nomsSommets[0]];
    const portee = Math.min(largeur, hauteur) / 2 - marge - 14;
    for (const [lettre, direction] of Object.entries(instance.pointsSurRayons)) {
      const u = versEcran(direction);
      morceaux.push(
        texte(lettre, [sommet[0] + u[0] * portee, sommet[1] + u[1] * portee], { couleur: couleurTrait, taille: 16 }),
      );
    }
  }

  return enveloppeSvg(largeur, hauteur, instance.description, morceaux.join(""));
}

function dessinerSecteur(morceaux, sommetEcran, secteur, mesureDeg, demande, couleur, enCouleur) {
  const rayon = demande.rayon ?? 30;
  const estDroit = Math.abs(mesureDeg - 90) < 1e-9;
  if (demande.secteur !== false) {
    const pointsSecteur = [sommetEcran, ...pointsArc(sommetEcran, rayon + 8, secteur.depart, secteur.delta)];
    morceaux.push(
      `<polygon points="${pointsSecteur.map((p) => `${px(p[0])},${px(p[1])}`).join(" ")}" fill="${couleur}" fill-opacity="0.16" stroke="none"/>`,
    );
  }
  if (estDroit) {
    const cote = rayon * 0.62;
    const p1 = [sommetEcran[0] + Math.cos(secteur.depart) * cote, sommetEcran[1] + Math.sin(secteur.depart) * cote];
    const fin = secteur.depart + secteur.delta;
    const p3 = [sommetEcran[0] + Math.cos(fin) * cote, sommetEcran[1] + Math.sin(fin) * cote];
    const p2 = [p1[0] + Math.cos(fin) * cote, p1[1] + Math.sin(fin) * cote];
    morceaux.push(polyligne([p1, p2, p3], { couleur, epaisseur: 3 }));
  } else {
    for (let k = 0; k < (demande.arcs ?? 1); k++) {
      morceaux.push(
        polyligne(pointsArc(sommetEcran, rayon - 5 * k, secteur.depart, secteur.delta), { couleur, epaisseur: 3.5 }),
      );
    }
  }
  const contenu =
    demande.texte === undefined ? formaterAngle(mesureDeg) : demande.texte === null ? null : echapper(demande.texte);
  if (contenu !== null && !(estDroit && demande.texte === undefined)) {
    const bissectrice = secteur.depart + secteur.delta / 2;
    morceaux.push(
      texte(contenu, [
        sommetEcran[0] + Math.cos(bissectrice) * (rayon + 20),
        sommetEcran[1] + Math.sin(bissectrice) * (rayon + 20),
      ], { couleur: enCouleur ? couleur : ENCRE, taille: 14, halo: 4 }),
    );
  }
}
