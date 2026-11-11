// Défi conversions — la progression d'un élève (lot 1, 11/11/2026).
//
// Copié puis adapté de Défi calcul et du modèle de fusion d'Anzan
// (outils/calcul_mental/flash_anzan_parcours.js, AGENTS.md « Fusion des
// données ») ; jamais partagé. Ce fichier ira tel quel sur le serveur de
// suivi au lot 2 (copie octet pour octet, pour la page prof et Mon espace) :
// il ne dépend d'aucun autre fichier et n'écrit aucun texte libre.
//
// LE FORMAT ENREGISTRÉ (version 1, fiche technique § 3.1)
//
//   {version: 1, epoque, etapes: {code: [7 valeurs]}, reperes: {code:
//   [jour, rate]}, seances: {"1": [13 valeurs], …}}
//
//   etapes[code] :
//     0 vue          le premier « J'apprends » ouvert (date ou null)
//     1 entraînée    « À toi » réussi (date ou null). Corrigé le 11/11 au
//                    soir : J'apprends et Je m'entraîne ne font plus qu'une
//                    étape ; cette date ouvre « Je valide » LE LENDEMAIN.
//                    Elle repasse à null quand « Je valide » rate.
//     2 validée      date ou null ; ne repasse jamais à null (sauf époque)
//     3 mode         0 pas validée · 1 par « Je valide » · 2 par « Tu
//                    connais déjà ? »
//     4 validations ratées de suite (0 à 9) : 2 → J'apprends en entier
//                    (« On te montre » compris) ; 3 → à reprendre en classe
//     5 échauffements ratés de suite (0 à 2) : à 2 → « On revoit »
//     6 dernier échauffement (date ou null)
//
//   seances[n] : 13 valeurs, au modèle commun d'Anzan
//     0 jour · 1 rang de l'étape travaillée (0 si aucune) ·
//     2 « On te montre » vu (0/1) · 3 « À toi » (0 rien · 1 réussi ·
//     2 commencé) · 4 « Je valide » (0 rien · 1 réussie · 2 ratée) ·
//     5 échauffement : questions posées · 6 justes · 7-9 rangs des étapes
//     ratées · 10 test : étapes validées · 11 identifiant · 12 ordre
//   (Corrigé le 11/11 au soir : seances[2] = « On te montre » vu et
//   seances[3] = « À toi » ; le format ne change pas.)
//
// Aucun prénom, aucun calcul, aucune réponse : des codes, des entiers, des
// dates. Les mêmes données donnent toujours le même JSON, octet pour octet.
(function initDefiConversionsParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_CONVERSIONS_PARCOURS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const VERSION = 1;
  const APPLI = "defi-conversions";
  const CLE_STOCKAGE = "mathsgo-defi-conversions-parcours";

  // Les codes figés (fiche § 1.4) et leurs rangs. Ce fichier ne charge pas
  // la carte : il doit rester seul sur le serveur.
  const CODES = Object.freeze(["R1", "R2", "P1", "C1", "C2", "D1", "Q1", "R3", "R4", "R5", "R6", "P2", "P3", "P4", "C3", "C4",
    "C5", "C6", "C7", "C8", "D2", "Q2", "R7", "R8", "R9", "A1", "A2", "D3", "Q3", "Q4", "A3", "V1", "D4", "D5", "Q5", "Q6",
    "A4", "R10", "V2", "V3", "V4", "Q7", "Q8", "D6", "G1", "P5", "P6", "Q9"]);
  const RANG = {};
  CODES.forEach((c, i) => { RANG[c] = i + 1; });
  const MOTIF_ETAPE = /^(?:R(?:[1-9]|10)|P[1-6]|C[1-8]|A[1-4]|V[1-4]|D[1-6]|G1|Q[1-9])$/;
  const MOTIF_REPERE = /^(?:l[1-9]|m[1-6]|c[1-4]|a[1-5]|v[1-4])$/;

  const SEUILS = Object.freeze({
    // Je valide : 10 questions, 8 justes ; arrêt dès la 3e erreur.
    valide: Object.freeze({questions: 10, justes: 8, arret: 3}),
    // À toi (ex « Je m'entraîne », réglages de Défi calcul du 30/10) :
    // l'outil 2 justes, l'image 2 justes, puis rien jusqu'à 5 justes de
    // suite ; une erreur ramène l'image, deux de suite l'outil ; 25 au plus.
    entraine: Object.freeze({avecOutil: 2, sansOutil: 5, erreurs: 2, maximum: 25}),
    // Tu connais déjà ? : 3 questions par étape, une 4e si une est fausse,
    // 3 justes pour valider.
    test: Object.freeze({questions: 3, departage: 4, justes: 3}),
    echauffement: Object.freeze({questions: 3, rateesPourRevoir: 2}),
    ratees: Object.freeze({apprendsEnEntier: 2, aReprendre: 3, max: 9}),
    seances: 150
  });

  const ID_MAX = 999999;
  const ORDRE_MAX = 1000000;
  const I = Object.freeze({jour: 0, etape: 1, montre: 2, atoi: 3, valide: 4, posees: 5, justes: 6, r1: 7, r2: 8, r3: 9, test: 10, id: 11, ordre: 12});
  const BORNES_SEANCE = [null, [0, 48], [0, 1], [0, 2], [0, 2], [0, 3], [0, 3], [0, 48], [0, 48], [0, 48], [0, 48], [1, ID_MAX], [1, ORDRE_MAX]];

  // ---------------------------------------------------------------- outils

  function entier(valeur, minimum, maximum, defaut) {
    const nombre = typeof valeur === "string" && /^-?\d+$/.test(valeur) ? Number(valeur) : valeur;
    if (!Number.isInteger(nombre)) return defaut;
    return Math.min(maximum, Math.max(minimum, nombre));
  }

  // Une vraie date (le serveur fait checkdate : l'année 0000 n'existe pas).
  function dateOuNull(valeur) {
    if (typeof valeur !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return null;
    const [annee, mois, jour] = valeur.split("-").map(Number);
    if (annee < 1 || mois < 1 || mois > 12 || jour < 1) return null;
    const dernier = new Date(Date.UTC(annee, mois, 0)).getUTCDate();
    return jour <= dernier ? valeur : null;
  }

  // Le jour LOCAL de l'appareil (à La Réunion, le jour UTC bascule à 4 h).
  function jourLocal(instant) {
    const d = instant instanceof Date ? instant : new Date(typeof instant === "number" ? instant : Date.now());
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function ajouterJours(jour, n) {
    const [a, m, j] = jour.split("-").map(Number);
    const d = new Date(Date.UTC(a, m - 1, j + n));
    return d.toISOString().slice(0, 10);
  }

  function plusAncienne(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a <= b ? a : b;
  }
  function plusRecente(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a >= b ? a : b;
  }

  // ---------------------------------------------------------------- le format

  function creer() {
    return {version: VERSION, epoque: 0, etapes: {}, reperes: {}, seances: {}};
  }

  function etapeVide() {
    return [null, null, null, 0, 0, 0, null];
  }

  function normaliserEtape(brut) {
    if (!Array.isArray(brut) || brut.length !== 7) return null;
    const e = [dateOuNull(brut[0]), dateOuNull(brut[1]), dateOuNull(brut[2]), entier(brut[3], 0, 2, 0),
      entier(brut[4], 0, SEUILS.ratees.max, 0), entier(brut[5], 0, SEUILS.echauffement.rateesPourRevoir, 0), dateOuNull(brut[6])];
    if (!e[2]) e[3] = 0;
    else if (!e[3]) e[3] = 1;
    if (e[2]) e[4] = 0;
    return e;
  }

  function estEtapeVide(e) {
    return e.every((v, i) => v === etapeVide()[i]);
  }

  function normaliserSeance(brut) {
    if (!Array.isArray(brut) || brut.length !== 13) return null;
    const jour = dateOuNull(brut[0]);
    if (!jour) return null;
    const s = [jour];
    for (let i = 1; i < 13; i += 1) {
      const [min, max] = BORNES_SEANCE[i];
      const v = typeof brut[i] === "number" || typeof brut[i] === "string" ? entier(brut[i], -1e15, 1e15, null) : null;
      if (v === null) return null;
      if ((i === I.id || i === I.ordre) && (v < min || v > max)) return null;
      s.push(Math.min(max, Math.max(min, v)));
    }
    return s;
  }

  // L'ORDRE DU TEMPS, le seul : l'ordre, puis l'identifiant. Jamais le jour
  // (l'horloge d'un appareil peut mentir), jamais le numéro (une place).
  function avant(x, y) {
    if (x[I.ordre] !== y[I.ordre]) return x[I.ordre] - y[I.ordre];
    return x[I.id] - y[I.id];
  }

  // La plus avancée de deux vues d'une même séance : le plus de travail
  // fait, puis le plus petit ordre, puis un choix fixe sur le texte (le
  // même dans les deux sens de la fusion).
  function avancement(s) {
    const atoi = s[I.atoi] === 1 ? 2 : s[I.atoi] === 2 ? 1 : 0;
    const valide = s[I.valide] ? 1 : 0;
    return [s[I.posees], valide, atoi, s[I.montre], s[I.test], s[I.justes]];
  }
  function plusAvancee(a, b) {
    const x = avancement(a);
    const y = avancement(b);
    for (let i = 0; i < x.length; i += 1) if (x[i] !== y[i]) return y[i] > x[i] ? b : a;
    if (a[I.ordre] !== b[I.ordre]) return b[I.ordre] < a[I.ordre] ? b : a;
    return JSON.stringify(b) > JSON.stringify(a) ? b : a;
  }

  function listes(p) {
    return Object.keys(p.seances).map(Number).sort((a, b) => a - b).map(n => p.seances[String(n)]);
  }

  // Range des séances propres : une par identifiant (la plus avancée), dans
  // l'ordre du temps, les 150 plus récentes, aux places 1, 2, 3…
  function ranger(p, liste) {
    const parId = new Map();
    liste.forEach(s => {
      const deja = parId.get(s[I.id]);
      parId.set(s[I.id], deja ? plusAvancee(deja, s) : s);
    });
    const triees = [...parId.values()].sort(avant);
    p.seances = {};
    triees.slice(Math.max(0, triees.length - SEUILS.seances)).forEach((s, i) => { p.seances[String(i + 1)] = s.slice(); });
    return p;
  }

  // À chaque lecture : un code inconnu est jeté, une date fausse devient
  // null, un entier sorti de ses bornes est ramené, une séance abîmée est
  // jetée. Les étapes et repères sont rangés par code (même JSON partout).
  function normaliser(brut) {
    const p = creer();
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return p;
    p.epoque = entier(brut.epoque, 0, ORDRE_MAX, 0);
    const etapes = brut.etapes && typeof brut.etapes === "object" && !Array.isArray(brut.etapes) ? brut.etapes : {};
    CODES.forEach(code => {
      if (!Object.prototype.hasOwnProperty.call(etapes, code) || !MOTIF_ETAPE.test(code)) return;
      const e = normaliserEtape(etapes[code]);
      if (e && !estEtapeVide(e)) p.etapes[code] = e;
    });
    const reperes = brut.reperes && typeof brut.reperes === "object" && !Array.isArray(brut.reperes) ? brut.reperes : {};
    Object.keys(reperes).filter(c => MOTIF_REPERE.test(c)).sort().forEach(code => {
      const r = reperes[code];
      if (!Array.isArray(r) || r.length !== 2) return;
      const jour = dateOuNull(r[0]);
      if (jour) p.reperes[code] = [jour, entier(r[1], 0, 1, 0)];
    });
    const seances = brut.seances && typeof brut.seances === "object" && !Array.isArray(brut.seances) ? brut.seances : {};
    const propres = [];
    Object.keys(seances).forEach(cle => {
      if (!/^[1-9]\d{0,2}$/.test(cle)) return;
      const s = normaliserSeance(seances[cle]);
      if (s) propres.push(s);
    });
    return ranger(p, propres);
  }

  function estVide(brut) {
    const p = normaliser(brut);
    return !Object.keys(p.etapes).length && !Object.keys(p.reperes).length && !Object.keys(p.seances).length;
  }

  function cloner(p) {
    return JSON.parse(JSON.stringify(p));
  }

  // ---------------------------------------------------------------- la fusion
  // La même dans les deux sens (fiche § 3.3).
  function fusionnerEtapes(a, b) {
    const e = etapeVide();
    e[0] = plusAncienne(a[0], b[0]);
    e[1] = plusRecente(a[1], b[1]);
    e[2] = plusAncienne(a[2], b[2]);
    if (e[2]) {
      const ma = a[2] === e[2] ? a[3] : 9;
      const mb = b[2] === e[2] ? b[3] : 9;
      e[3] = Math.min(ma, mb);
    }
    e[4] = e[2] ? 0 : Math.max(a[4], b[4]);
    const da = a[6] || "";
    const db = b[6] || "";
    e[5] = da === db ? Math.max(a[5], b[5]) : (da > db ? a[5] : b[5]);
    e[6] = plusRecente(a[6], b[6]);
    return e;
  }

  function fusionner(premier, second) {
    const a = normaliser(premier);
    const b = normaliser(second);
    if (a.epoque !== b.epoque) return a.epoque > b.epoque ? a : b;
    const f = creer();
    f.epoque = a.epoque;
    CODES.forEach(code => {
      const ea = a.etapes[code];
      const eb = b.etapes[code];
      if (ea || eb) f.etapes[code] = fusionnerEtapes(ea || etapeVide(), eb || etapeVide());
    });
    const codesReperes = [...new Set([...Object.keys(a.reperes), ...Object.keys(b.reperes)])];
    codesReperes.forEach(code => {
      const ra = a.reperes[code];
      const rb = b.reperes[code];
      if (!ra || !rb) { f.reperes[code] = (ra || rb).slice(); return; }
      if (ra[0] !== rb[0]) f.reperes[code] = (ra[0] > rb[0] ? ra : rb).slice();
      else f.reperes[code] = [ra[0], Math.max(ra[1], rb[1])];
    });
    ranger(f, listes(a).concat(listes(b)));
    return normaliser(f);
  }

  // ---------------------------------------------------------------- les séances

  function idLibre(parcours, tirage) {
    const p = normaliser(parcours);
    const pris = new Set(listes(p).map(s => s[I.id]));
    let id = Number.isInteger(tirage) && tirage >= 1 && tirage <= ID_MAX ? tirage : 1 + Math.floor(Math.random() * ID_MAX);
    while (pris.has(id)) id = id >= ID_MAX ? 1 : id + 1;
    return id;
  }

  // Le plus grand ordre connu, plus un ; à la borne, les ordres sont
  // d'abord resserrés 1, 2, 3… dans le même ordre. Modifie p.
  function ordreSuivant(p) {
    let plusGrand = 0;
    listes(p).forEach(s => { if (s[I.ordre] > plusGrand) plusGrand = s[I.ordre]; });
    if (plusGrand < ORDRE_MAX) return plusGrand + 1;
    const rangees = listes(p).slice().sort(avant);
    rangees.forEach((s, i) => { s[I.ordre] = i + 1; });
    ranger(p, rangees);
    return rangees.length + 1;
  }

  function seanceDeId(p, id) {
    return listes(p).find(s => s[I.id] === id) || null;
  }

  // Note la séance en cours (`seance` : {id, ordre?, jour?, etape: code,
  // montre, atoi, valide, posees, justes, ratees: [codes], test}). Une
  // séance déjà connue (même identifiant) garde son ORDRE et son JOUR ;
  // sinon l'ordre et le jour que la page a gardés depuis la première note,
  // sinon l'ordre suivant. Rend {parcours, ordre, jour}.
  function noterSeance(parcours, seance, jour) {
    const p = normaliser(parcours);
    const s = seance || {};
    const id = entier(s.id, 1, ID_MAX, null);
    if (id === null || id !== s.id) return {parcours: p, ordre: null, jour: null};
    const ratees = (Array.isArray(s.ratees) ? s.ratees : []).map(c => RANG[c] || 0).filter(Boolean).slice(0, 3);
    const deja = seanceDeId(p, id);
    let ordre;
    let leJour;
    if (deja) { ordre = deja[I.ordre]; leJour = deja[I.jour]; }
    else if (Number.isInteger(s.ordre) && s.ordre >= 1 && s.ordre <= ORDRE_MAX) { ordre = s.ordre; leJour = dateOuNull(s.jour) || dateOuNull(jour) || jourLocal(); }
    else { ordre = ordreSuivant(p); leJour = dateOuNull(jour) || jourLocal(); }
    const ligne = normaliserSeance([leJour, RANG[s.etape] || 0, s.montre ? 1 : 0, entier(s.atoi, 0, 2, 0), entier(s.valide, 0, 2, 0),
      entier(s.posees, 0, 3, 0), entier(s.justes, 0, 3, 0), ratees[0] || 0, ratees[1] || 0, ratees[2] || 0, entier(s.test, 0, 48, 0), id, ordre]);
    const autres = listes(p).filter(l => l[I.id] !== id);
    ranger(p, autres.concat([ligne]));
    return {parcours: p, ordre, jour: leJour};
  }

  // ---------------------------------------------------------- l'état des étapes

  function etapeDe(parcours, code) {
    const e = parcours.etapes[code];
    return e ? e.slice() : etapeVide();
  }

  function poser(p, code, e) {
    if (!MOTIF_ETAPE.test(code)) return p;
    const propre = normaliserEtape(e);
    if (propre && !estEtapeVide(propre)) p.etapes[code] = propre;
    else delete p.etapes[code];
    const range = {};
    CODES.forEach(c => { if (p.etapes[c]) range[c] = p.etapes[c]; });
    p.etapes = range;
    return p;
  }

  function estValidee(parcours, code) {
    return Boolean(etapeDe(parcours, code)[2]);
  }

  // Ce que l'élève fait sur cette étape aujourd'hui :
  //   "apprends"  J'apprends en entier (jamais vue, ou 2 validations ratées
  //               de suite) ;
  //   "a-toi"     « À toi » seulement (une validation ratée, ou 3 et plus) ;
  //   "valide"    Je valide (« À toi » réussi un jour d'avant) ;
  //   "demain"    « À toi » réussi aujourd'hui : Je valide s'ouvre demain ;
  //   "validee"
  // `prof` : en mode professeur, Je valide s'ouvre tout de suite.
  function actionDe(parcours, code, jour, {prof = false} = {}) {
    const e = etapeDe(parcours, code);
    if (e[2]) return "validee";
    if (e[1]) return e[1] < jour || prof ? "valide" : "demain";
    if (!e[0] || e[4] === SEUILS.ratees.apprendsEnEntier) return "apprends";
    return "a-toi";
  }

  // Mon étape : la première pas validée dans l'ordre du parcours, parmi
  // `codes` (les étapes prêtes des paliers ouverts) ; null si tout l'est.
  function monEtape(parcours, codes) {
    return codes.find(code => !estValidee(parcours, code)) || null;
  }

  // ---------------------------------------------------------- les gestes
  // Chacun rend un parcours NEUF.

  function marquerVue(parcours, code, jour) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    if (!e[0]) e[0] = jour;
    return poser(p, code, e);
  }

  // « À toi » réussi : Je valide s'ouvre le lendemain.
  function marquerEntrainee(parcours, code, jour) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    if (!e[0]) e[0] = jour;
    e[1] = jour;
    return poser(p, code, e);
  }

  // La fin de « Je valide ». Réussie : validée une fois pour toutes (mode
  // 1). Ratée : « À toi » à refaire (entraînée → null), une ratée de plus.
  function noterValidation(parcours, code, reussie, jour) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    if (e[2]) return p;
    if (reussie) { e[2] = jour; e[3] = 1; e[4] = 0; }
    else { e[1] = null; e[4] = Math.min(SEUILS.ratees.max, e[4] + 1); }
    return poser(p, code, e);
  }

  // Une étape validée par « Tu connais déjà ? » (mode 2).
  function noterTest(parcours, code, jour) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    if (e[2]) return p;
    e[2] = jour;
    e[3] = 2;
    e[4] = 0;
    return poser(p, code, e);
  }

  // Une question d'échauffement sur une étape.
  function noterEchauffementEtape(parcours, code, juste, jour) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    e[6] = jour;
    e[5] = juste ? 0 : Math.min(SEUILS.echauffement.rateesPourRevoir, e[5] + 1);
    return poser(p, code, e);
  }

  // Une question d'échauffement sur un repère du carnet.
  function noterEchauffementRepere(parcours, code, juste, jour) {
    const p = normaliser(parcours);
    if (!MOTIF_REPERE.test(code)) return p;
    p.reperes[code] = [jour, juste ? 0 : 1];
    return normaliser(p);
  }

  // « On revoit » fini : le compteur repart de zéro.
  function noterRevue(parcours, code) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    e[5] = 0;
    return poser(p, code, e);
  }

  // ---------------------------------------------------------- l'échauffement

  // L'échauffement est-il dû aujourd'hui ? Une fois par jour, dès qu'une
  // étape est validée (une séance du jour qui a posé une question compte).
  function echauffementFait(parcours, jour) {
    return listes(normaliser(parcours)).some(s => s[I.jour] === jour && s[I.posees] > 0);
  }
  function echauffementDu(parcours, jour, codes) {
    const p = normaliser(parcours);
    return codes.some(c => estValidee(p, c)) && !echauffementFait(p, jour);
  }

  // Les questions de l'échauffement (fiche § 0, décision 7) :
  //   Q1 un repère du carnet : raté la dernière fois, sinon le plus
  //      longtemps sans revenir ;
  //   Q2 la dernière étape validée, si elle l'a été un autre jour et n'est
  //      pas revenue depuis ;
  //   Q3 une ancienne : d'abord une ratée à son dernier échauffement, sinon
  //      la plus longtemps sans revenir.
  // Jamais deux questions de la même étape (un repère compte pour son étape
  // « Mes repères »). `codes` : les étapes prêtes ; `carnet` : [{code,
  // etape}] les repères du carnet.
  function tirerEchauffement(parcours, jour, codes, carnet) {
    const p = normaliser(parcours);
    const items = [];
    const prises = new Set();
    const reps = (carnet || []).slice().sort((x, y) => {
      const rx = p.reperes[x.code];
      const ry = p.reperes[y.code];
      const ratex = rx && rx[1] === 1 ? 0 : 1;
      const ratey = ry && ry[1] === 1 ? 0 : 1;
      if (ratex !== ratey) return ratex - ratey;
      const jx = rx ? rx[0] : "";
      const jy = ry ? ry[0] : "";
      if (jx !== jy) return jx < jy ? -1 : 1;
      return x.code < y.code ? -1 : x.code > y.code ? 1 : 0;
    });
    if (reps.length) {
      items.push({type: "repere", code: reps[0].code, etape: reps[0].etape});
      prises.add(reps[0].etape);
    }
    const validees = codes.filter(c => estValidee(p, c));
    const derniere = validees.slice().sort((x, y) => {
      const dx = etapeDe(p, x)[2];
      const dy = etapeDe(p, y)[2];
      return dx === dy ? RANG[y] - RANG[x] : (dx < dy ? 1 : -1);
    })[0];
    if (derniere && !prises.has(derniere)) {
      const e = etapeDe(p, derniere);
      if (e[2] < jour && (!e[6] || e[6] < e[2])) { items.push({type: "etape", code: derniere}); prises.add(derniere); }
    }
    const anciennes = validees.filter(c => !prises.has(c)).sort((x, y) => {
      const ex = etapeDe(p, x);
      const ey = etapeDe(p, y);
      const rx = ex[5] > 0 ? 0 : 1;
      const ry = ey[5] > 0 ? 0 : 1;
      if (rx !== ry) return rx - ry;
      const jx = ex[6] || "";
      const jy = ey[6] || "";
      if (jx !== jy) return jx < jy ? -1 : 1;
      return RANG[x] - RANG[y];
    });
    if (anciennes.length && items.length < SEUILS.echauffement.questions) items.push({type: "etape", code: anciennes[0]});
    return items;
  }

  // Une étape à revoir (ratée deux échauffements de suite), ou null.
  function aRevoir(parcours, codes) {
    const p = normaliser(parcours);
    return codes.find(c => estValidee(p, c) && etapeDe(p, c)[5] >= SEUILS.echauffement.rateesPourRevoir) || null;
  }

  // ------------------------------------------------------- À toi (l'entraînement)
  // `reponses` : [{juste, outil: "outil" | "image" | "aucun"}].
  function suivreEntrainement(reponses) {
    const liste = Array.isArray(reponses) ? reponses.filter(Boolean) : [];
    const {avecOutil, sansOutil, erreurs, maximum} = SEUILS.entraine;
    let outil = "outil";
    let outilDuDebut = true;
    let justesAvecAide = 0;
    let justesSansAide = 0;
    let erreursDeSuite = 0;
    liste.forEach(r => {
      if (r.juste) {
        erreursDeSuite = 0;
        if (r.outil === "aucun") justesSansAide += 1;
        else { justesAvecAide += 1; justesSansAide = 0; }
        if (outil === "outil" && outilDuDebut) {
          if (justesAvecAide >= avecOutil) { outil = "image"; justesAvecAide = 0; outilDuDebut = false; }
        } else if (outil === "outil") outil = "image";
        else if (outil === "image" && justesAvecAide >= avecOutil) { outil = "aucun"; justesAvecAide = 0; }
      } else {
        erreursDeSuite += 1;
        justesAvecAide = 0;
        justesSansAide = 0;
        outilDuDebut = false;
        outil = erreursDeSuite >= erreurs ? "outil" : "image";
      }
    });
    const reussi = justesSansAide >= sansOutil;
    return {outil, reussi, fini: reussi || liste.length >= maximum, total: liste.length, justesDeSuite: justesSansAide, objectif: sansOutil};
  }

  // Je valide : où en est-on ? `resultats` : [true/false…].
  function suivreValidation(resultats) {
    const r = Array.isArray(resultats) ? resultats : [];
    const erreurs = r.filter(x => !x).length;
    const justes = r.length - erreurs;
    const arrete = erreurs >= SEUILS.valide.arret;
    const fini = arrete || r.length >= SEUILS.valide.questions;
    return {justes, erreurs, fini, reussie: fini && !arrete && justes >= SEUILS.valide.justes};
  }

  // Tu connais déjà ? : une marche (une étape). 3 questions ; une 4e si
  // une est fausse ; 3 justes pour valider ; 2 fausses, c'est raté.
  function suivreMarche(resultats) {
    const r = Array.isArray(resultats) ? resultats : [];
    const erreurs = r.filter(x => !x).length;
    const justes = r.length - erreurs;
    if (justes >= SEUILS.test.justes) return {fini: true, reussie: true, total: erreurs ? 4 : 3};
    if (erreurs >= 2) return {fini: true, reussie: false, total: erreurs ? 4 : 3};
    return {fini: false, reussie: false, total: erreurs ? 4 : 3};
  }

  // ---------------------------------------------------------- ce qu'on lit

  function validees(parcours, codes) {
    const p = normaliser(parcours);
    return (codes || CODES).filter(c => estValidee(p, c));
  }

  // Le carnet : les repères des étapes validées (rien n'est enregistré :
  // il se déduit, deux appareils ne peuvent pas se désaccorder).
  function carnet(parcours, reperesParEtape) {
    const p = normaliser(parcours);
    const liste = [];
    Object.keys(reperesParEtape || {}).forEach(code => {
      if (estValidee(p, code)) reperesParEtape[code].forEach(r => liste.push({code: r, etape: code}));
    });
    return liste;
  }

  // Les médailles : les paliers dont toutes les étapes sont validées.
  // `paliers` : {n: [codes]}.
  function medailles(parcours, paliers) {
    const p = normaliser(parcours);
    return Object.keys(paliers).map(Number).filter(n => paliers[n].length && paliers[n].every(c => estValidee(p, c)));
  }

  // Le poids du parcours pour le serveur : clés (à tous les niveaux) et
  // octets du JSON (bornes du serveur : 2 000 clés, 40 000 octets).
  function mesurer(parcours) {
    const p = normaliser(parcours);
    let cles = 0;
    const compter = o => {
      if (o && typeof o === "object" && !Array.isArray(o)) Object.keys(o).forEach(k => { cles += 1; compter(o[k]); });
    };
    compter(p);
    return {cles, octets: new TextEncoder().encode(JSON.stringify(p)).length};
  }

  // ----------------------------------------- ce que verront la page prof et
  // Mon espace (lot 2 ; gardé simple ici, éprouvé par les tests).
  function resumeTuile(parcours, {codes, aujourdhui} = {}) {
    const p = normaliser(parcours);
    const liste = codes || CODES;
    const v = liste.filter(c => estValidee(p, c));
    const debut = aujourdhui ? ajouterJours(aujourdhui, -6) : "";
    const gainSemaine = v.filter(c => etapeDe(p, c)[2] >= debut).length;
    return {validees: v.length, total: liste.length, legende: CODES.every(c => estValidee(p, c)), gainSemaine};
  }

  function resumeProf(parcours, {aujourdhui} = {}) {
    const p = normaliser(parcours);
    const jours = new Set(listes(p).filter(s => s[I.valide] === 1 || s[I.test] > 0).map(s => s[I.jour]));
    const etapes = CODES.map(code => {
      const e = etapeDe(p, code);
      return {code, etat: e[2] ? "validee" : e[0] ? "en-cours" : "a-faire", validee: e[2], mode: e[3],
        rateesDeSuite: e[4], aReprendre: e[4] >= SEUILS.ratees.aReprendre, sansSeance: Boolean(e[2]) && !jours.has(e[2])};
    });
    const debut = aujourdhui ? ajouterJours(aujourdhui, -6) : "";
    const echRatees = {};
    listes(p).filter(s => s[I.jour] >= debut).forEach(s => {
      [s[I.r1], s[I.r2], s[I.r3]].filter(Boolean).forEach(r => {
        const code = CODES[r - 1];
        (echRatees[code] = echRatees[code] || []).push(s[I.jour]);
      });
    });
    const toutes = listes(p);
    return {etapes, validees: etapes.filter(e => e.validee).length, derniere: toutes.length ? toutes[toutes.length - 1][I.jour] : null,
      echRatees: Object.keys(echRatees).map(code => ({code, jours: echRatees[code]})), legende: CODES.every(c => estValidee(p, c))};
  }

  function resumeSuivi(parcours, {aujourdhui} = {}) {
    const p = normaliser(parcours);
    const parJour = {};
    listes(p).forEach(s => {
      (parJour[s[I.jour]] = parJour[s[I.jour]] || []).push({
        etape: s[I.etape] ? CODES[s[I.etape] - 1] : null, apprends: s[I.montre] === 1 || s[I.atoi] > 0, entraine: s[I.atoi] === 1,
        valide: s[I.valide], echPosees: s[I.posees], echJustes: s[I.justes],
        echRatees: [s[I.r1], s[I.r2], s[I.r3]].filter(Boolean).map(r => CODES[r - 1]), test: s[I.test]
      });
    });
    const jours = Object.keys(parJour).sort().map(jour => ({jour, lignes: parJour[jour]}));
    return {appli: APPLI, aujourdhui: aujourdhui || null, connuDepuis: jours.length ? jours[0].jour : null,
      dernier: jours.length ? jours[jours.length - 1].jour : null, jours};
  }

  // ---------------------------------------------------------- le stockage
  // Sans code (lot 1) : sur l'appareil, sous mathsgo-defi-conversions-parcours.
  function charger(stockage) {
    try {
      const brut = stockage && stockage.getItem(CLE_STOCKAGE);
      return normaliser(brut ? JSON.parse(brut) : null);
    } catch (e) {
      return creer();
    }
  }
  function sauver(stockage, parcours) {
    try {
      if (stockage) stockage.setItem(CLE_STOCKAGE, JSON.stringify(normaliser(parcours)));
      return true;
    } catch (e) {
      return false;
    }
  }
  // « Effacer mon historique » (visiteur sans code) : l'époque monte, rien
  // d'autre ne reste.
  function effacer(stockage) {
    try {
      const avantEffacer = charger(stockage);
      const p = creer();
      p.epoque = Math.min(ORDRE_MAX, avantEffacer.epoque + 1);
      if (stockage) stockage.setItem(CLE_STOCKAGE, JSON.stringify(p));
      return p;
    } catch (e) {
      return creer();
    }
  }

  return Object.freeze({
    VERSION,
    APPLI,
    CLE_STOCKAGE,
    CODES,
    RANG,
    SEUILS,
    I,
    ID_MAX,
    ORDRE_MAX,
    MOTIF_ETAPE,
    MOTIF_REPERE,
    creer,
    normaliser,
    estVide,
    cloner,
    fusionner,
    idLibre,
    noterSeance,
    seanceDeId,
    listes: parcours => listes(normaliser(parcours)),
    etapeDe: (parcours, code) => etapeDe(normaliser(parcours), code),
    estValidee: (parcours, code) => estValidee(normaliser(parcours), code),
    actionDe: (parcours, code, jour, options) => actionDe(normaliser(parcours), code, jour, options),
    monEtape: (parcours, codes) => monEtape(normaliser(parcours), codes),
    marquerVue,
    marquerEntrainee,
    noterValidation,
    noterTest,
    noterEchauffementEtape,
    noterEchauffementRepere,
    noterRevue,
    echauffementFait,
    echauffementDu,
    tirerEchauffement,
    aRevoir,
    suivreEntrainement,
    suivreValidation,
    suivreMarche,
    validees,
    carnet,
    medailles,
    mesurer,
    resumeTuile,
    resumeProf,
    resumeSuivi,
    charger,
    sauver,
    effacer,
    dateOuNull,
    jourLocal,
    ajouterJours
  });
});
