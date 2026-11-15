// Défi conversions — la progression d'un élève (lot 1, 11/11/2026 ; le
// nouveau rythme, lot 3a, 14/11/2026).
//
// Copié puis adapté de Défi calcul et du modèle de fusion d'Anzan
// (outils/calcul_mental/flash_anzan_parcours.js, AGENTS.md « Fusion des
// données ») ; jamais partagé. Ce fichier ira tel quel sur le serveur de
// suivi (copie octet pour octet, pour la page prof et Mon espace) : il ne
// dépend d'aucun autre fichier et n'écrit aucun texte libre.
//
// LE RYTHME (choix de Gwenaël du 14/11, lot 3a)
//   - Une séance : « Je me souviens » (les étapes dont le retour est dû, 6
//     étapes au plus, les plus anciennes dues d'abord), puis Mon étape
//     (On te montre → À toi → Je valide, juste après), puis « Avant de
//     partir » (ce qui a été raté au début, redemandé ; rien n'y est compté).
//   - L'étape se valide LE JOUR MÊME (la coche) et elle REVIENT : le
//     lendemain (2 questions), 3 jours après, 1 semaine après, 2 semaines
//     après, puis une fois par mois (1 question). Trois retours réussis de
//     suite : l'étape est SOLIDE (l'étoile).
//     (Lot 3a-1 : le robot-élève du lot 2, rejoué sur ce fichier, avait
//     mesuré ces chiffres avec 6 ÉTAPES au plus et le retour à 2 semaines ;
//     avec 6 questions au plus et sans les 2 semaines, l'élève fragile ne
//     sait plus que 40 % à 6 semaines au lieu de 62 %.) Un retour raté ne retire rien : l'étape revient le
//     lendemain (2 questions), et le compteur repart de zéro.
//   - Une ceinture par palier (toutes ses étapes cochées), un liseré doré
//     quand toutes ses étoiles sont là ; la Légende des conversions : les
//     six ceintures dorées.
//
// LE FORMAT ENREGISTRÉ (version 2)
//
//   {version: 2, epoque, etapes: {code: [10 valeurs]}, reperes: {code:
//   [jour, rate]}, seances: {"1": [13 valeurs], …}}
//
//   etapes[code] :
//     0 vue          le premier « J'apprends » ouvert (date ou null)
//     1 entraînée    « À toi » réussi (date ou null) : « Je valide » se fait
//                    CE JOUR-LÀ, juste après. Un autre jour, « À toi » est à
//                    refaire d'abord. Repasse à null quand « Je valide » rate.
//     2 validée      la coche (date ou null) ; ne repasse jamais à null
//                    (sauf époque)
//     3 mode         0 pas validée · 1 par « Je valide » · 2 par « Tu
//                    connais déjà ? »
//     4 validations ratées de suite (0 à 9) : 2 → J'apprends en entier
//                    (« On te montre » compris) ; 3 → à reprendre en classe
//     5 retours réussis de suite (0 à 9) : 3 → solide
//     6 retours ratés de suite (0 à 9) : 3 → à reprendre en classe
//     7 dernier retour (date ou null)
//     8 solide       l'étoile (date ou null) ; ne repasse jamais à null
//     9 graine du dernier retour (0 aucune, 1 à 99 999) : la page refait la
//                    question du dernier retour pour ne pas la reposer
//   Le prochain retour n'est PAS enregistré : il se déduit (dernier retour,
//   ou la validation, plus 1, 3, 7, 14 ou 30 jours selon les retours réussis
//   de suite). Deux appareils ne peuvent donc pas se désaccorder sur lui.
//
//   La version 1 (7 valeurs : … 5 échauffements ratés, 6 dernier
//   échauffement) se lit encore : elle devient une version 2 à la lecture,
//   sans retour réussi ; le dernier échauffement, s'il vient après la
//   validation, devient le dernier retour.
//
//   reperes[code] : [jour, rate] la dernière fois que ce repère a été demandé
//     dans un retour de son étape (« Mes premiers repères »…), raté (1) ou
//     non (0) : le repère raté revient en premier, puis le plus ancien.
//
//   seances[n] : 13 valeurs, au modèle commun d'Anzan
//     0 jour · 1 rang de l'étape travaillée (0 si aucune) ·
//     2 « On te montre » vu (0/1) · 3 « À toi » (0 rien · 1 réussi ·
//     2 commencé) · 4 « Je valide » (0 rien · 1 réussie · 2 ratée) ·
//     5 « Je me souviens » : questions posées (0 à 12) · 6 justes (0 à 12) ·
//     7-9 rangs des étapes ratées (3 au plus) · 10 test : étapes validées ·
//     11 identifiant · 12 ordre
//
// Aucun prénom, aucun calcul, aucune réponse : des codes, des entiers, des
// dates. Les mêmes données donnent toujours le même JSON, octet pour octet.
(function initDefiConversionsParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_CONVERSIONS_PARCOURS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const VERSION = 2;
  const APPLI = "defi-conversions";
  const CLE_STOCKAGE = "mathsgo-defi-conversions-parcours";

  // Les codes figés (fiche § 1.4) et leurs rangs. Ce fichier ne charge pas
  // la carte : il doit rester seul sur le serveur.
  const CODES = Object.freeze(["R1", "R2", "P1", "C1", "C2", "D1", "Q1", "R3", "R4", "R5", "R6", "P2", "P3", "P4", "C3", "C4",
    "C5", "C6", "C7", "C8", "D2", "Q2", "R7", "R8", "R9", "A1", "A2", "D3", "Q3", "Q4", "A3", "V1", "D4", "D5", "Q5", "Q6",
    "A4", "R10", "V2", "V3", "V4", "Q7", "Q8", "D6", "G1", "P5", "P6", "Q9",
    // Carte v3 (12/11/2026) : rangs 49 à 52.
    "E1", "D7", "Q10", "A5",
    // Carte v4 (14/11/2026, lot 3b) : rangs 53 et 54.
    "C9", "Q11"]);
  const RANG = {};
  CODES.forEach((c, i) => { RANG[c] = i + 1; });
  const RANG_MAX = CODES.length;
  const MOTIF_ETAPE = /^(?:R(?:[1-9]|10)|P[1-6]|C[1-9]|A[1-5]|V[1-4]|D[1-7]|G1|Q(?:[1-9]|1[01])|E1)$/;
  const MOTIF_REPERE = /^(?:l(?:[1-9]|1[01])|m[1-8]|c[1-5]|a[1-7]|v[1-5])$/;

  const SEUILS = Object.freeze({
    // Je valide : 10 questions, 8 justes ; arrêt dès la 3e erreur (« Je ne
    // sais pas » compte comme une erreur). 7 questions de l'étape et 3 des
    // étapes déjà validées du palier, aux places 3, 6 et 9 (10 de l'étape
    // s'il n'y en a pas).
    valide: Object.freeze({questions: 10, justes: 8, arret: 3, dAvant: 3, places: Object.freeze([2, 5, 8])}),
    // À toi (réglages de Défi calcul du 30/10) : l'outil 2 justes, l'image 2
    // justes, puis rien jusqu'à 5 justes de suite ; une erreur ramène
    // l'image, deux de suite l'outil ; « Je ne sais pas » ramène l'outil ;
    // 25 au plus.
    entraine: Object.freeze({avecOutil: 2, sansOutil: 5, erreurs: 2, maximum: 25}),
    // Tu connais déjà ? : 3 questions par étape, une 4e si une est fausse,
    // 3 justes pour valider.
    test: Object.freeze({questions: 3, departage: 4, justes: 3}),
    // Les retours : dans combien de jours, selon les retours réussis de
    // suite (0, 1, 2, 3, puis 4 et plus) ; 2 questions au premier (le
    // lendemain, ou après un retour raté), 1 ensuite ; 6 étapes au plus
    // dans « Je me souviens » (12 questions au plus) ; 3 réussis de suite :
    // solide ; 3 ratés de suite : à reprendre.
    retours: Object.freeze({intervalles: Object.freeze([1, 3, 7, 14, 30]), questionsPremier: 2, questions: 1, etapesParSeance: 6,
      pourSolide: 3, aReprendre: 3, max: 9}),
    // Avant de partir : 3 questions au plus.
    avantDePartir: 3,
    ratees: Object.freeze({apprendsEnEntier: 2, aReprendre: 3, max: 9}),
    seances: 150
  });

  const ID_MAX = 999999;
  const ORDRE_MAX = 1000000;
  const GRAINE_MAX = 99999;
  const LONGUEUR = 10;
  const I = Object.freeze({jour: 0, etape: 1, montre: 2, atoi: 3, valide: 4, posees: 5, justes: 6, r1: 7, r2: 8, r3: 9, test: 10, id: 11, ordre: 12});
  // Les places d'une étape (pour lire le code sans compter).
  const E = Object.freeze({vue: 0, entrainee: 1, validee: 2, mode: 3, ratees: 4, reussis: 5, rates: 6, retour: 7, solide: 8, graine: 9});
  const Q_MAX = SEUILS.retours.etapesParSeance * SEUILS.retours.questionsPremier;
  const BORNES_SEANCE = [null, [0, RANG_MAX], [0, 1], [0, 2], [0, 2], [0, Q_MAX], [0, Q_MAX], [0, RANG_MAX], [0, RANG_MAX], [0, RANG_MAX], [0, RANG_MAX], [1, ID_MAX], [1, ORDRE_MAX]];

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
    return [null, null, null, 0, 0, 0, 0, null, null, 0];
  }

  // Une étape de la version 1 (7 valeurs) devient une étape de la version 2.
  function depuisVersion1(brut) {
    const validee = dateOuNull(brut[2]);
    const ech = dateOuNull(brut[6]);
    return [brut[0], brut[1], brut[2], brut[3], brut[4], 0, 0, validee && ech && ech > validee ? ech : null, null, 0];
  }

  function normaliserEtape(brut) {
    if (!Array.isArray(brut)) return null;
    if (brut.length === 7) brut = depuisVersion1(brut);
    if (brut.length !== LONGUEUR) return null;
    const max = SEUILS.retours.max;
    const e = [dateOuNull(brut[0]), dateOuNull(brut[1]), dateOuNull(brut[2]), entier(brut[3], 0, 2, 0),
      entier(brut[4], 0, SEUILS.ratees.max, 0), entier(brut[5], 0, max, 0), entier(brut[6], 0, max, 0), dateOuNull(brut[7]),
      dateOuNull(brut[8]), entier(brut[9], 0, GRAINE_MAX, 0)];
    if (!e[E.validee]) e[E.mode] = 0;
    else if (!e[E.mode]) e[E.mode] = 1;
    if (e[E.validee]) e[E.ratees] = 0;
    // Pas de retour avant la validation (ni sans elle) ; un compteur ne va
    // pas sans son dernier retour ; on ne réussit et rate pas à la fois.
    if (!e[E.validee] || (e[E.retour] && e[E.retour] < e[E.validee])) e[E.retour] = null;
    if (!e[E.retour]) { e[E.reussis] = 0; e[E.rates] = 0; e[E.graine] = 0; }
    if (e[E.reussis] && e[E.rates]) e[E.rates] = 0;
    if (!e[E.validee] || (e[E.solide] && e[E.solide] < e[E.validee])) e[E.solide] = null;
    // L'étoile vient avec le 3e retour réussi ; une fois là, elle reste.
    if (!e[E.solide] && e[E.reussis] >= SEUILS.retours.pourSolide) e[E.solide] = e[E.retour];
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
    if (s[I.justes] > s[I.posees]) s[I.justes] = s[I.posees];
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
  // Une donnée de la version 1 devient une version 2.
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

  // Les retours d'un appareil : [réussis, ratés, dernier, graine], en bloc.
  // Celui du retour le plus récent gagne ; le même jour sur les deux
  // appareils, le plus de réussis, puis le moins de ratés, puis la plus
  // grande graine (un choix fixe, le même dans les deux sens).
  function blocRetours(e) {
    return [e[E.reussis], e[E.rates], e[E.retour], e[E.graine]];
  }
  function meilleurBloc(a, b) {
    const da = a[2] || "";
    const db = b[2] || "";
    if (da !== db) return da > db ? a : b;
    if (a[0] !== b[0]) return a[0] > b[0] ? a : b;
    if (a[1] !== b[1]) return a[1] < b[1] ? a : b;
    return a[3] >= b[3] ? a : b;
  }

  function fusionnerEtapes(a, b) {
    const e = etapeVide();
    e[E.vue] = plusAncienne(a[E.vue], b[E.vue]);
    e[E.entrainee] = plusRecente(a[E.entrainee], b[E.entrainee]);
    e[E.validee] = plusAncienne(a[E.validee], b[E.validee]);
    if (e[E.validee]) {
      const ma = a[E.validee] === e[E.validee] ? a[E.mode] : 9;
      const mb = b[E.validee] === e[E.validee] ? b[E.mode] : 9;
      e[E.mode] = Math.min(ma, mb);
    }
    e[E.ratees] = e[E.validee] ? 0 : Math.max(a[E.ratees], b[E.ratees]);
    const bloc = meilleurBloc(blocRetours(a), blocRetours(b));
    [e[E.reussis], e[E.rates], e[E.retour], e[E.graine]] = bloc;
    e[E.solide] = plusAncienne(a[E.solide], b[E.solide]);
    return normaliserEtape(e);
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
  // montre, atoi, valide, posees, justes, ratees: [codes], test} ; posees,
  // justes et ratees : « Je me souviens »). Une séance déjà connue (même
  // identifiant) garde son ORDRE et son JOUR ; sinon l'ordre et le jour que
  // la page a gardés depuis la première note, sinon l'ordre suivant. Rend
  // {parcours, ordre, jour}.
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
      entier(s.posees, 0, Q_MAX, 0), entier(s.justes, 0, Q_MAX, 0), ratees[0] || 0, ratees[1] || 0, ratees[2] || 0, entier(s.test, 0, RANG_MAX, 0), id, ordre]);
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
    return Boolean(etapeDe(parcours, code)[E.validee]);
  }
  function estSolide(parcours, code) {
    return Boolean(etapeDe(parcours, code)[E.solide]);
  }

  // Ce que l'élève fait sur cette étape aujourd'hui :
  //   "apprends"  J'apprends en entier (jamais vue, ou 2 validations ratées
  //               de suite) ;
  //   "a-toi"     « À toi » (vue un autre jour, une validation ratée, ou
  //               « À toi » réussi un autre jour sans « Je valide ») ;
  //   "valide"    Je valide (« À toi » réussi aujourd'hui : juste après) ;
  //   "validee"
  // `prof` : en mode professeur, Je valide s'ouvre dès « À toi » réussi.
  function actionDe(parcours, code, jour, {prof = false} = {}) {
    const e = etapeDe(parcours, code);
    if (e[E.validee]) return "validee";
    if (e[E.entrainee] && (e[E.entrainee] === jour || prof)) return "valide";
    if (!e[E.vue] || e[E.ratees] === SEUILS.ratees.apprendsEnEntier) return "apprends";
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
    if (!e[E.vue]) e[E.vue] = jour;
    return poser(p, code, e);
  }

  // « À toi » réussi : « Je valide » vient juste après.
  function marquerEntrainee(parcours, code, jour) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    if (!e[E.vue]) e[E.vue] = jour;
    e[E.entrainee] = jour;
    return poser(p, code, e);
  }

  // La fin de « Je valide ». Réussie : la coche, une fois pour toutes (mode
  // 1) ; le premier retour sera le lendemain. Ratée : « À toi » à refaire
  // (entraînée → null), une ratée de plus.
  function noterValidation(parcours, code, reussie, jour) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    if (e[E.validee]) return p;
    if (reussie) { e[E.validee] = jour; e[E.mode] = 1; e[E.ratees] = 0; }
    else { e[E.entrainee] = null; e[E.ratees] = Math.min(SEUILS.ratees.max, e[E.ratees] + 1); }
    return poser(p, code, e);
  }

  // Une étape validée par « Tu connais déjà ? » (mode 2). Elle revient
  // ensuite comme les autres.
  function noterTest(parcours, code, jour) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    if (e[E.validee]) return p;
    e[E.validee] = jour;
    e[E.mode] = 2;
    e[E.ratees] = 0;
    return poser(p, code, e);
  }

  // ---------------------------------------------------------- les retours

  // La date du prochain retour d'une étape validée (null sinon) : le dernier
  // retour (ou la validation) plus 1, 3, 7, 14 ou 30 jours.
  function prochainRetourDe(e) {
    if (!e[E.validee]) return null;
    const depuis = e[E.retour] || e[E.validee];
    const k = SEUILS.retours.intervalles;
    return ajouterJours(depuis, k[Math.min(e[E.reussis], k.length - 1)]);
  }

  // Le prochain retour vu d'aujourd'hui : un dernier retour (ou une
  // validation) daté APRÈS aujourd'hui vient d'une horloge fausse (ou d'une
  // donnée trafiquée) : l'étape est due tout de suite, sinon elle ne
  // reviendrait plus avant longtemps.
  function dueLe(e, jour) {
    const d = prochainRetourDe(e);
    if (!d) return null;
    return (e[E.retour] || e[E.validee]) > jour ? jour : d;
  }

  // Les étapes dont le retour est dû ce jour-là, parmi `codes` : la plus
  // anciennement due d'abord, puis dans l'ordre des rangs.
  function retoursDus(parcours, jour, codes) {
    const p = normaliser(parcours);
    return (codes || CODES).filter(c => {
      const d = dueLe(etapeDe(p, c), jour);
      return d && d <= jour;
    }).sort((x, y) => {
      const dx = dueLe(etapeDe(p, x), jour);
      const dy = dueLe(etapeDe(p, y), jour);
      return dx === dy ? RANG[x] - RANG[y] : (dx < dy ? -1 : 1);
    });
  }

  // « Je me souviens » : [{code, questions}] — les 6 premières étapes dues,
  // dans l'ordre de retoursDus ; 2 questions quand aucun retour n'est réussi
  // de suite (le lendemain de la validation, ou d'un retour raté), 1 sinon.
  // Les autres attendent la séance suivante. Vide le premier jour (rien
  // n'est dû).
  function tirerSouvenirs(parcours, jour, codes) {
    const p = normaliser(parcours);
    const r = SEUILS.retours;
    return retoursDus(p, jour, codes).slice(0, r.etapesParSeance).map(code => ({
      code, questions: etapeDe(p, code)[E.reussis] === 0 ? r.questionsPremier : r.questions
    }));
  }

  // Un retour fini (toutes ses questions justes, ou non). `graine` : celle
  // des questions posées (la page la refait au retour suivant pour ne pas
  // reposer les mêmes). Réussi : un de plus de suite ; au 3e, l'étoile.
  // Raté : la coche et l'étoile restent ; l'étape revient le lendemain.
  function noterRetour(parcours, code, reussi, jour, graine) {
    const p = normaliser(parcours);
    const e = etapeDe(p, code);
    if (!e[E.validee]) return p;
    const max = SEUILS.retours.max;
    if (reussi) { e[E.reussis] = Math.min(max, e[E.reussis] + 1); e[E.rates] = 0; }
    else { e[E.reussis] = 0; e[E.rates] = Math.min(max, e[E.rates] + 1); }
    e[E.retour] = jour;
    e[E.graine] = entier(graine, 0, GRAINE_MAX, 0);
    if (!e[E.solide] && e[E.reussis] >= SEUILS.retours.pourSolide) e[E.solide] = jour;
    return poser(p, code, e);
  }

  // Le repère à demander dans le retour d'une étape de repères : `codes`
  // ses repères ; le raté de la dernière fois d'abord, puis celui qui n'a
  // pas été demandé depuis le plus longtemps (jamais demandé passe devant),
  // puis par code. `nombre` : combien (1 ou 2).
  function reperesARedemander(parcours, codes, nombre = 1) {
    const p = normaliser(parcours);
    return (codes || []).filter(c => MOTIF_REPERE.test(c)).slice().sort((x, y) => {
      const rx = p.reperes[x];
      const ry = p.reperes[y];
      const ratex = rx && rx[1] === 1 ? 0 : 1;
      const ratey = ry && ry[1] === 1 ? 0 : 1;
      if (ratex !== ratey) return ratex - ratey;
      const jx = rx ? rx[0] : "";
      const jy = ry ? ry[0] : "";
      if (jx !== jy) return jx < jy ? -1 : 1;
      return x < y ? -1 : x > y ? 1 : 0;
    }).slice(0, nombre);
  }

  // Un repère demandé dans un retour.
  function noterRepere(parcours, code, juste, jour) {
    const p = normaliser(parcours);
    if (!MOTIF_REPERE.test(code)) return p;
    p.reperes[code] = [jour, juste ? 0 : 1];
    return normaliser(p);
  }

  // « À reprendre en classe » (pour la page prof) : 3 « Je valide » ratés de
  // suite, ou 3 retours ratés de suite. L'élève n'est jamais bloqué.
  function aReprendre(parcours, code) {
    const e = etapeDe(normaliser(parcours), code);
    return e[E.ratees] >= SEUILS.ratees.aReprendre || e[E.rates] >= SEUILS.retours.aReprendre;
  }

  // ------------------------------------------------------- Je valide mélangé

  // Les 10 questions de « Je valide » : le code de l'étape à chaque place,
  // sauf aux places 3, 6 et 9, une étape déjà validée du même palier (`codes`
  // : les étapes du palier, dans l'ordre du parcours) — les plus proches
  // avant elle d'abord, puis après elle (validées par « Tu connais déjà ? »),
  // trois différentes si possible, sinon on recommence la liste. Aucune
  // validée : les 10 de l'étape.
  function planValidation(parcours, code, codes) {
    const p = normaliser(parcours);
    const v = SEUILS.valide;
    const liste = codes || [];
    const ici = liste.indexOf(code);
    const avantIci = liste.slice(0, Math.max(0, ici)).reverse();
    const apresIci = ici >= 0 ? liste.slice(ici + 1) : [];
    const autres = avantIci.concat(apresIci).filter(c => c !== code && estValidee(p, c));
    const plan = Array.from({length: v.questions}, () => code);
    if (autres.length) v.places.forEach((place, k) => { plan[place] = autres[k % autres.length]; });
    return plan;
  }

  // ------------------------------------------------------- À toi (l'entraînement)
  // `reponses` : [{juste, outil: "outil" | "image" | "aucun", jnsp?}].
  // « Je ne sais pas » (jnsp) compte comme une erreur et ramène l'outil.
  function suivreEntrainement(reponses) {
    const liste = Array.isArray(reponses) ? reponses.filter(Boolean) : [];
    const {avecOutil, sansOutil, erreurs, maximum} = SEUILS.entraine;
    let outil = "outil";
    let outilDuDebut = true;
    let justesAvecAide = 0;
    let justesSansAide = 0;
    let erreursDeSuite = 0;
    liste.forEach(r => {
      if (r.juste && !r.jnsp) {
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
        // Une erreur avec l'outil sous les yeux garde l'outil (choix de
        // Gwenaël du 11/11 au soir : moins d'aide après une erreur n'a pas
        // de sens). Ailleurs : une erreur ramène l'image, deux l'outil ;
        // « Je ne sais pas » ramène l'outil (choix du 14/11).
        if (outil !== "outil") {
          outilDuDebut = false;
          outil = r.jnsp || erreursDeSuite >= erreurs ? "outil" : "image";
        }
      }
    });
    const reussi = justesSansAide >= sansOutil;
    return {outil, reussi, fini: reussi || liste.length >= maximum, total: liste.length, justesDeSuite: justesSansAide, objectif: sansOutil};
  }

  // Je valide : où en est-on ? `resultats` : [true/false…] (« Je ne sais
  // pas » : false).
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
  function solides(parcours, codes) {
    const p = normaliser(parcours);
    return (codes || CODES).filter(c => estSolide(p, c));
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

  // Les ceintures (jaune, orange, verte, bleue, marron, noire : les couleurs
  // sont dans la carte). `paliers` : {n: [codes]}. Une ceinture : toutes les
  // étapes du palier cochées ; dorée : toutes solides aussi.
  function ceintures(parcours, paliers) {
    const p = normaliser(parcours);
    return Object.keys(paliers || {}).map(Number).sort((a, b) => a - b).map(n => {
      const codes = paliers[n] || [];
      const v = codes.filter(c => estValidee(p, c)).length;
      const s = codes.filter(c => estSolide(p, c)).length;
      const gagnee = codes.length > 0 && v === codes.length;
      return {n, total: codes.length, validees: v, solides: s, gagnee, doree: gagnee && s === codes.length};
    });
  }

  // La Légende des conversions : toutes les étapes cochées et solides.
  function legende(parcours) {
    const p = normaliser(parcours);
    return CODES.every(c => estSolide(p, c));
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
  // Mon espace (phase D ; gardé simple ici, éprouvé par les tests).
  function resumeTuile(parcours, {codes, aujourdhui} = {}) {
    const p = normaliser(parcours);
    const liste = codes || CODES;
    const v = liste.filter(c => estValidee(p, c));
    const debut = aujourdhui ? ajouterJours(aujourdhui, -6) : "";
    const gainSemaine = v.filter(c => etapeDe(p, c)[E.validee] >= debut).length;
    return {validees: v.length, solides: liste.filter(c => estSolide(p, c)).length, total: liste.length, legende: legende(p), gainSemaine};
  }

  function resumeProf(parcours, {aujourdhui} = {}) {
    const p = normaliser(parcours);
    const jours = new Set(listes(p).filter(s => s[I.valide] === 1 || s[I.test] > 0).map(s => s[I.jour]));
    const etapes = CODES.map(code => {
      const e = etapeDe(p, code);
      return {code, etat: e[E.validee] ? "validee" : e[E.vue] ? "en-cours" : "a-faire", validee: e[E.validee], mode: e[E.mode],
        solide: e[E.solide], rateesDeSuite: e[E.ratees], retoursRatesDeSuite: e[E.rates], prochainRetour: prochainRetourDe(e),
        aReprendre: e[E.ratees] >= SEUILS.ratees.aReprendre || e[E.rates] >= SEUILS.retours.aReprendre,
        sansSeance: Boolean(e[E.validee]) && !jours.has(e[E.validee])};
    });
    const debut = aujourdhui ? ajouterJours(aujourdhui, -6) : "";
    const souvRates = {};
    listes(p).filter(s => s[I.jour] >= debut).forEach(s => {
      [s[I.r1], s[I.r2], s[I.r3]].filter(Boolean).forEach(r => {
        const code = CODES[r - 1];
        (souvRates[code] = souvRates[code] || []).push(s[I.jour]);
      });
    });
    const toutes = listes(p);
    return {etapes, validees: etapes.filter(e => e.validee).length, solides: etapes.filter(e => e.solide).length,
      derniere: toutes.length ? toutes[toutes.length - 1][I.jour] : null,
      souvenirsRates: Object.keys(souvRates).map(code => ({code, jours: souvRates[code]})), legende: legende(p)};
  }

  function resumeSuivi(parcours, {aujourdhui} = {}) {
    const p = normaliser(parcours);
    const parJour = {};
    listes(p).forEach(s => {
      (parJour[s[I.jour]] = parJour[s[I.jour]] || []).push({
        etape: s[I.etape] ? CODES[s[I.etape] - 1] : null, apprends: s[I.montre] === 1 || s[I.atoi] > 0, entraine: s[I.atoi] === 1,
        valide: s[I.valide], souvPosees: s[I.posees], souvJustes: s[I.justes],
        souvRates: [s[I.r1], s[I.r2], s[I.r3]].filter(Boolean).map(r => CODES[r - 1]), test: s[I.test]
      });
    });
    const jours = Object.keys(parJour).sort().map(jour => ({jour, lignes: parJour[jour]}));
    return {appli: APPLI, aujourdhui: aujourdhui || null, connuDepuis: jours.length ? jours[0].jour : null,
      dernier: jours.length ? jours[jours.length - 1].jour : null, jours};
  }

  // ---------------------------------------------------------- le stockage
  // Sans code : sur l'appareil, sous mathsgo-defi-conversions-parcours. Une
  // donnée de la version 1 est lue, puis réécrite en version 2 au premier
  // geste (sauver).
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
    E,
    ID_MAX,
    ORDRE_MAX,
    GRAINE_MAX,
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
    estSolide: (parcours, code) => estSolide(normaliser(parcours), code),
    actionDe: (parcours, code, jour, options) => actionDe(normaliser(parcours), code, jour, options),
    monEtape: (parcours, codes) => monEtape(normaliser(parcours), codes),
    marquerVue,
    marquerEntrainee,
    noterValidation,
    noterTest,
    prochainRetour: (parcours, code) => prochainRetourDe(etapeDe(normaliser(parcours), code)),
    retoursDus,
    tirerSouvenirs,
    noterRetour,
    graineRetour: (parcours, code) => etapeDe(normaliser(parcours), code)[E.graine],
    reperesARedemander,
    noterRepere,
    aReprendre,
    planValidation,
    suivreEntrainement,
    suivreValidation,
    suivreMarche,
    validees,
    solides,
    carnet,
    ceintures,
    legende,
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
