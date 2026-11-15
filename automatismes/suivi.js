const CLE = "mg-automatismes";
const LIMITE = 10000;
const CHAMPS = ["famille", "forme", "graine", "juste", "aide", "moteur"];

function stockageDuNavigateur() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function jourLocal(date) {
  const valeur = new Date(date);
  if (!Number.isFinite(valeur.getTime())) throw new TypeError("Date de séance invalide.");
  return [valeur.getFullYear(), valeur.getMonth() + 1, valeur.getDate()]
    .map((partie, index) => String(partie).padStart(index ? 2 : 4, "0"))
    .join("-");
}

function preparerFamilles(catalogue) {
  if (!Array.isArray(catalogue)) throw new TypeError("Catalogue attendu.");
  return new Map(
    catalogue.map((carte) => {
      if (!/^[A-Z]{2}\d{2}$/.test(carte.id)) throw new TypeError("Famille invalide.");
      const formes = carte.formes || carte.variantes || [];
      return [carte.id, Math.max(1, formes.length)];
    }),
  );
}

function verifierEssai(detail, familles) {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    throw new TypeError("Événement invalide.");
  }
  const cles = Reflect.ownKeys(detail);
  if (cles.length !== CHAMPS.length || !CHAMPS.every((cle) => cles.includes(cle))) {
    throw new TypeError("Les six champs du contrat sont obligatoires et exclusifs.");
  }
  if (
    !familles.has(detail.famille) ||
    typeof detail.forme !== "string" ||
    !/^[a-z]$/.test(detail.forme)
  ) {
    throw new TypeError("Identifiant d’automatisme invalide.");
  }
  if (!Number.isInteger(detail.graine) || detail.graine < 1 || detail.graine > 2147483647) {
    throw new RangeError("Graine invalide.");
  }
  if (![0, 1].includes(detail.juste) || ![0, 1, 2, 3].includes(detail.aide)) {
    throw new RangeError("Résultat invalide.");
  }
  if (typeof detail.moteur !== "string" || !/^\d+\.\d+\.\d+$/.test(detail.moteur)) {
    throw new TypeError("Version du moteur invalide.");
  }
  return Object.freeze(Object.fromEntries(CHAMPS.map((cle) => [cle, detail[cle]])));
}

function etatVide() {
  return { version: 1, journal: [], familles: {}, seances: [] };
}

function lireEtat(stockage, familles) {
  try {
    const lu = JSON.parse(stockage?.getItem(CLE) || "null");
    if (!lu || lu.version !== 1) return etatVide();
    const etat = etatVide();
    for (const detail of (Array.isArray(lu.journal) ? lu.journal : []).slice(-LIMITE)) {
      try {
        etat.journal.push(verifierEssai(detail, familles));
      } catch {
        // Une entrée locale corrompue ne bloque pas les autres.
      }
    }
    for (const famille of familles.keys()) {
      const ancienne = lu.familles?.[famille];
      if (!ancienne || typeof ancienne !== "object") continue;
      const series = (Array.isArray(ancienne.series) ? ancienne.series : [])
        .filter(
          (serie) =>
            /^[a-zA-Z0-9_-]{1,80}$/.test(serie?.id) &&
            /^\d{4}-\d{2}-\d{2}$/.test(serie?.date) &&
            ["jour", "train", "exam", "test"].includes(serie?.mode),
        )
        .slice(-100)
        .map(({ id, date, mode }) => ({ id, date, mode }));
      etat.familles[famille] = {
        decouverte: ancienne.decouverte === true,
        confirmee: ancienne.confirmee === true,
        series,
      };
    }
    etat.seances = (Array.isArray(lu.seances) ? lu.seances : [])
      .filter((id) => typeof id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(id))
      .slice(-1000);
    return etat;
  } catch {
    return etatVide();
  }
}

function copie(detail) {
  return { ...detail };
}

export function creerSuivi(catalogue, options = {}) {
  const familles = preparerFamilles(catalogue);
  const stockage = options.stockage === undefined ? stockageDuNavigateur() : options.stockage;
  const cible = options.cible === undefined ? globalThis.window : options.cible;
  const maintenant = options.maintenant || (() => new Date());
  const etat = lireEtat(stockage, familles);
  let disponible = Boolean(stockage);

  function sauvegarder() {
    try {
      stockage?.setItem(CLE, JSON.stringify(etat));
    } catch {
      disponible = false;
    }
  }

  function progression(famille) {
    if (!familles.has(famille)) return null;
    etat.familles[famille] ||= { decouverte: false, confirmee: false, series: [] };
    return etat.familles[famille];
  }

  function enregistrerEssai(detail) {
    const evenement = verifierEssai(detail, familles);
    etat.journal.push(evenement);
    if (etat.journal.length > LIMITE) etat.journal.splice(0, etat.journal.length - LIMITE);
    if (evenement.juste) progression(evenement.famille).decouverte = true;
    sauvegarder();
    if (cible?.dispatchEvent && typeof globalThis.CustomEvent === "function") {
      cible.dispatchEvent(new CustomEvent("mathsgo:automatismes", { detail: evenement }));
    }
    return copie(evenement);
  }

  function serieReussie(resultats, famille, nombreFormes) {
    const questions = new Map();
    for (const resultat of resultats) {
      const cle = `${resultat.forme}@${resultat.graine}`;
      if (questions.has(cle)) return false;
      questions.set(cle, resultat);
    }
    const formes = new Set(resultats.map((resultat) => resultat.forme));
    return (
      resultats.length >= 5 &&
      resultats.every((resultat) => resultat.aide === 0) &&
      resultats.filter((resultat) => resultat.juste === 1).length / resultats.length >= 0.8 &&
      formes.size >= Math.min(5, nombreFormes)
    );
  }

  function terminerSeance(
    resultats,
    { id, mode = "train", date = maintenant(), formesEligibles = {} } = {},
  ) {
    if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(id)) {
      throw new TypeError("Identifiant de séance invalide.");
    }
    if (!["jour", "train", "exam", "test", "project"].includes(mode)) {
      throw new TypeError("Mode de séance invalide.");
    }
    if (!Array.isArray(resultats)) throw new TypeError("Résultats attendus.");
    const verifies = resultats.map((resultat) => verifierEssai(resultat, familles));
    const jour = jourLocal(date);
    const presentes = new Set(verifies.map((resultat) => resultat.famille));
    for (const famille of presentes) {
      const nombre = formesEligibles?.[famille] ?? familles.get(famille);
      if (!Number.isInteger(nombre) || nombre < 1 || nombre > familles.get(famille)) {
        throw new TypeError("Nombre de formes éligibles invalide.");
      }
    }
    if (etat.seances.includes(id) || mode === "project") return false;
    etat.seances.push(id);
    etat.seances = etat.seances.slice(-1000);
    for (const famille of presentes) {
      const groupe = verifies.filter((resultat) => resultat.famille === famille);
      const notion = progression(famille);
      if (groupe.some((resultat) => resultat.juste)) notion.decouverte = true;
      const nombre = formesEligibles?.[famille] ?? familles.get(famille);
      if (!serieReussie(groupe, famille, nombre)) continue;
      if (["jour", "train"].includes(mode) && notion.series.some((serie) => serie.date < jour)) {
        notion.confirmee = true;
      }
      notion.series.push({ id, date: jour, mode });
      notion.series = notion.series.slice(-100);
    }
    sauvegarder();
    return true;
  }

  function etoiles(famille) {
    const notion = progression(famille);
    if (!notion) return 0;
    if (notion.confirmee) return 3;
    const reussite =
      notion.decouverte || etat.journal.some((e) => e.famille === famille && e.juste);
    if (!notion.series.length) return reussite ? 1 : 0;
    const premiere = notion.series[0];
    const confirmee = notion.series
      .slice(1)
      .some((serie) => ["jour", "train"].includes(serie.mode) && serie.date > premiere.date);
    return confirmee ? 3 : 2;
  }

  function vuesForme(famille, forme) {
    return new Set(
      etat.journal
        .filter((evenement) => evenement.famille === famille && evenement.forme === forme)
        .map((evenement) => `${evenement.moteur}@${evenement.graine}`),
    ).size;
  }

  return {
    enregistrerEssai,
    terminerSeance,
    etoiles,
    vuesForme,
    lireJournal: () => etat.journal.map(copie),
    stockageDisponible: () => disponible,
  };
}

let suivi;

export function initialiserSuivi(catalogue, options) {
  suivi = creerSuivi(catalogue, options);
  return suivi;
}

function suiviCourant() {
  if (!suivi) throw new Error("Initialiser le suivi avec le catalogue avant de l’utiliser.");
  return suivi;
}

export const enregistrerEssai = (detail) => suiviCourant().enregistrerEssai(detail);
export const terminerSeance = (resultats, options) =>
  suiviCourant().terminerSeance(resultats, options);
export const etoiles = (famille) => suiviCourant().etoiles(famille);
export const vuesForme = (famille, forme) => suiviCourant().vuesForme(famille, forme);
export const lireJournal = () => suiviCourant().lireJournal();
