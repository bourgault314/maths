const SIGNE = (valeur) => {
  const absolue = Math.abs(valeur);
  const texte = String(absolue).replace(".", ",");
  return valeur < 0 ? `−${texte}` : texte;
};
const COUPLE = ([x, y]) => `(${SIGNE(x)} ; ${SIGNE(y)})`;

export const DIAGNOSTICS_REPERAGE_PLAN = Object.freeze({
  E1: "inversion-abscisse-ordonnee",
  E2: "signe-abscisse",
  E3: "signe-ordonnee",
  E4: "zero-point-sur-axe",
  E5: "decalage-graduation",
  E6: "autre-erreur",
});

function resultat(code, message) {
  return Object.freeze({ code, mecanisme: DIAGNOSTICS_REPERAGE_PLAN[code], message });
}

/** Diagnostique deux positions graduées, pour une saisie ou un placement. */
export function diagnostiquerCoupleRepere({ attendu, recu, pas = 1 }) {
  if (
    !Array.isArray(attendu)
    || !Array.isArray(recu)
    || attendu.length !== 2
    || recu.length !== 2
    || [...attendu, ...recu, pas].some((valeur) => !Number.isFinite(valeur))
    || pas <= 0
  ) return null;
  const [x, y] = attendu;
  const [a, b] = recu;
  if (a === x && b === y) return null;

  if (
    (y === 0 && a === 0 && b === x)
    || (x === 0 && a === y && b === 0)
  ) {
    return resultat(
      "E4",
      `Le point est sur un axe : la coordonnée portée par l'autre axe vaut 0. La réponse est ${COUPLE(attendu)}.`,
    );
  }
  if (a === y && b === x) {
    return resultat(
      "E1",
      `Tu as inversé les coordonnées : l'abscisse se lit en premier, puis l'ordonnée. La réponse est ${COUPLE(attendu)}.`,
    );
  }
  if (x !== 0 && a === -x && b === y) {
    return resultat(
      "E2",
      `La position horizontale est du bon côté en distance, mais le signe de l'abscisse change. La réponse est ${COUPLE(attendu)}.`,
    );
  }
  if (y !== 0 && a === x && b === -y) {
    return resultat(
      "E3",
      `La position verticale est du bon côté en distance, mais le signe de l'ordonnée change. La réponse est ${COUPLE(attendu)}.`,
    );
  }
  if ((a === x && Math.abs(b - y) === pas) || (b === y && Math.abs(a - x) === pas)) {
    return resultat(
      "E5",
      `Tu es décalé d'une graduation. Repars de 0 et compte les intervalles jusqu'à ${COUPLE(attendu)}.`,
    );
  }
  return resultat(
    "E6",
    `Relis séparément la position horizontale, puis la position verticale. La réponse est ${COUPLE(attendu)}.`,
  );
}

export function diagnostiquerCoordonneeSeule({ axe, attendu, recu, pas = 1 }) {
  if (!["abscisse", "ordonnee"].includes(axe)) return null;
  if (![attendu, recu, pas].every(Number.isFinite) || pas <= 0 || attendu === recu) return null;
  const codeSigne = axe === "abscisse" ? "E2" : "E3";
  if (attendu === 0) {
    const axePorteur = axe === "abscisse" ? "ordonnées" : "abscisses";
    const coordonnee = axe === "abscisse" ? "abscisse" : "ordonnée";
    return resultat(
      "E4",
      `Le point est sur l'axe des ${axePorteur} : son ${coordonnee} vaut 0.`,
    );
  }
  if (recu === -attendu) {
    return resultat(
      codeSigne,
      `La distance à 0 est bonne, mais le côté de l'axe impose le signe ${attendu < 0 ? "moins" : "positif"}. La réponse est ${SIGNE(attendu)}.`,
    );
  }
  if (Math.abs(recu - attendu) === pas) {
    return resultat(
      "E5",
      `Tu es décalé d'une graduation sur l'axe des ${axe === "abscisse" ? "abscisses" : "ordonnées"}. La réponse est ${SIGNE(attendu)}.`,
    );
  }
  return resultat(
    "E6",
    `Repère la position du point sur l'axe ${axe === "abscisse" ? "horizontal" : "vertical"}. La réponse est ${SIGNE(attendu)}.`,
  );
}

export function diagnostiquerChoixQcmRepere(identifiant, attendu) {
  const messages = {
    inversion: ["E1", `Tu as inversé les coordonnées : l'abscisse se lit en premier, puis l'ordonnée. La réponse est ${COUPLE(attendu)}.`],
    "signe-abscisse": ["E2", `Tu as changé le signe de l'abscisse. Observe de quel côté de 0 se trouve le point. La réponse est ${COUPLE(attendu)}.`],
    "signe-ordonnee": ["E3", `Tu as changé le signe de l'ordonnée. Observe si le point est au-dessus ou au-dessous de 0. La réponse est ${COUPLE(attendu)}.`],
  };
  const diagnostic = messages[identifiant];
  return diagnostic ? resultat(diagnostic[0], diagnostic[1]) : resultat("E6", `Reprends l'abscisse, puis l'ordonnée. La réponse est ${COUPLE(attendu)}.`);
}
