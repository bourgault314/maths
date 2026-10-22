// Flash Anzan — le moteur (lot 1, 22/10/2026).
//
// Tout ce qui se calcule sans écran vit ici, pour être testé avec node --test :
// les bornes des réglages, le tirage des calculs, le calendrier d'affichage du
// Flash et les textes qui résument une séance. La page ne fait que dessiner.
//
// Le tirage est déterministe à graine donnée (mulberry32, comme Défi calcul et
// SPLAT!) : les tests rejouent des milliers de séances.
(function initFlashAnzanCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_FLASH_ANZAN_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // ---------------------------------------------------------------------
  // Les réglages
  // ---------------------------------------------------------------------
  const MODES = Object.freeze(["flash", "colonne"]);
  const BORNES = Object.freeze({
    chiffres: Object.freeze({min: 1, max: 5}),
    nombres: Object.freeze({min: 2, max: 30})
  });
  const CALCULS = Object.freeze([5, 10, 20]);
  // Temps par nombre, en dixièmes de seconde : de 0,1 s à 2 s par pas de
  // 0,1 s, puis de 2,5 s à 5 s par pas de 0,5 s.
  const TEMPS = Object.freeze([
    ...Array.from({length: 20}, (_, i) => i + 1),
    25, 30, 35, 40, 45, 50
  ]);
  // Temps limite du mode Colonne, en secondes ; 0 = sans limite.
  const LIMITES = Object.freeze([0, 10, 15, 20, 30, 45, 60]);
  const SONS = Object.freeze(["aucun", "bip"]);
  const OPERATIONS = Object.freeze(["plus", "plusmoins"]);

  // Les valeurs de départ sont celles des maquettes validées le 22/10/2026.
  const DEFAUTS = Object.freeze({
    flash: Object.freeze({operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 10, temps: 8, calculs: 10, son: "bip"}),
    colonne: Object.freeze({operations: "plusmoins", chiffresMin: 3, chiffresMax: 3, nombres: 8, limite: 0, calculs: 10})
  });

  const entier = (valeur, defaut) => (Number.isInteger(valeur) ? valeur : defaut);
  const borner = (valeur, min, max) => Math.min(max, Math.max(min, valeur));
  const dans = (liste, valeur, defaut) => (liste.includes(valeur) ? valeur : defaut);

  // Des réglages venus de n'importe où (localStorage, plus tard le compte de
  // l'élève) redeviennent des réglages valides : rien d'inconnu ne passe.
  function normaliser(mode, brut) {
    const m = dans(MODES, mode, "flash");
    const d = DEFAUTS[m];
    const b = brut && typeof brut === "object" ? brut : {};
    let chiffresMin = borner(entier(b.chiffresMin, d.chiffresMin), BORNES.chiffres.min, BORNES.chiffres.max);
    let chiffresMax = borner(entier(b.chiffresMax, d.chiffresMax), BORNES.chiffres.min, BORNES.chiffres.max);
    if (chiffresMin > chiffresMax) chiffresMax = chiffresMin;
    const r = {
      operations: dans(OPERATIONS, b.operations, d.operations),
      chiffresMin,
      chiffresMax,
      nombres: borner(entier(b.nombres, d.nombres), BORNES.nombres.min, BORNES.nombres.max),
      calculs: dans(CALCULS, b.calculs, d.calculs)
    };
    if (m === "flash") {
      r.temps = dans(TEMPS, b.temps, d.temps);
      r.son = dans(SONS, b.son, d.son);
    } else {
      r.limite = dans(LIMITES, b.limite, d.limite);
    }
    return r;
  }

  // Un pas vers le haut ou vers le bas dans une liste de valeurs permises.
  function pas(liste, valeur, sens) {
    const i = liste.indexOf(valeur);
    if (i < 0) return liste[0];
    return liste[borner(i + (sens > 0 ? 1 : -1), 0, liste.length - 1)];
  }

  // « de » et « à » restent dans l'ordre : monter le minimum au-dessus du
  // maximum pousse le maximum, et l'inverse.
  function changerChiffres(r, cote, sens) {
    const n = {...r};
    const {min, max} = BORNES.chiffres;
    if (cote === "min") {
      n.chiffresMin = borner(r.chiffresMin + sens, min, max);
      if (n.chiffresMin > n.chiffresMax) n.chiffresMax = n.chiffresMin;
    } else {
      n.chiffresMax = borner(r.chiffresMax + sens, min, max);
      if (n.chiffresMax < n.chiffresMin) n.chiffresMin = n.chiffresMax;
    }
    return n;
  }

  // ---------------------------------------------------------------------
  // Le hasard
  // ---------------------------------------------------------------------
  function mulberry32(graine) {
    let a = graine >>> 0;
    return function aleatoire() {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const entierEntre = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

  // Un nombre de exactement n chiffres : jamais de zéro devant, les zéros à
  // l'intérieur sont permis (305).
  function nombreDeChiffres(rng, n) {
    let texte = String(entierEntre(rng, 1, 9));
    for (let i = 1; i < n; i += 1) texte += String(entierEntre(rng, 0, 9));
    return Number(texte);
  }

  // Un calcul : une suite de termes {signe, valeur} et le total.
  //  - le premier nombre est toujours ajouté ;
  //  - en « + et − », le total en cours ne passe jamais sous zéro : une
  //    soustraction qui le rendrait négatif devient une addition.
  function tirerCalcul(reglages, rng) {
    const termes = [];
    let total = 0;
    for (let i = 0; i < reglages.nombres; i += 1) {
      const valeur = nombreDeChiffres(rng, entierEntre(rng, reglages.chiffresMin, reglages.chiffresMax));
      let signe = 1;
      if (i > 0 && reglages.operations === "plusmoins" && rng() < 0.5 && total - valeur >= 0) signe = -1;
      total += signe * valeur;
      termes.push({signe, valeur});
    }
    return {termes, total};
  }

  function tirerSeance(reglages, rng) {
    return Array.from({length: reglages.calculs}, () => tirerCalcul(reglages, rng));
  }

  // ---------------------------------------------------------------------
  // Le calendrier du Flash
  // ---------------------------------------------------------------------
  // Chaque instant se calcule depuis le top départ (jamais en enchaînant des
  // minuteries, qui dérivent) : le nombre i apparaît à i × T et disparaît un
  // peu avant (i + 1) × T. La coupure blanche (12 % de T, au moins 50 ms)
  // laisse voir deux nombres identiques qui se suivent.
  function coupure(tempsMs) {
    return Math.max(50, Math.round(tempsMs * 0.12));
  }

  // Ce qui doit être à l'écran t ms après le top départ.
  //  {index: -1 → rien encore, 0..n-1 → nombre courant ; visible ; fini}
  function etatAuTemps(t, nombres, tempsMs) {
    if (t < 0) return {index: -1, visible: false, fini: false};
    const index = Math.floor(t / tempsMs);
    if (index >= nombres) return {index: nombres, visible: false, fini: true};
    const dansLaCase = t - index * tempsMs;
    return {index, visible: dansLaCase < tempsMs - coupure(tempsMs), fini: false};
  }

  // ---------------------------------------------------------------------
  // Les textes
  // ---------------------------------------------------------------------
  // 0,8 s ; 2 s ; 2,5 s — à la française.
  function secondes(valeur) {
    const arrondi = Math.round(valeur * 10) / 10;
    return `${String(arrondi).replace(".", ",")} s`;
  }
  const tempsEnSecondes = dixiemes => dixiemes / 10;

  function texteChiffres(r) {
    if (r.chiffresMin === r.chiffresMax) return `${r.chiffresMin} chiffre${r.chiffresMin > 1 ? "s" : ""}`;
    return `${r.chiffresMin} à ${r.chiffresMax} chiffres`;
  }

  // Le résumé d'une séance (décompte, écran de fin ; plus tard l'historique).
  // ⚡ Flash · + et − · 2 à 3 chiffres · 10 nombres · 0,8 s
  function resume(mode, r, {avecMode = true} = {}) {
    const morceaux = [];
    if (avecMode) morceaux.push(mode === "flash" ? "⚡ Flash" : "📝 Colonne");
    if (r.operations === "plusmoins") morceaux.push("+ et −");
    morceaux.push(texteChiffres(r));
    morceaux.push(`${r.nombres} nombres`);
    if (mode === "flash") morceaux.push(secondes(tempsEnSecondes(r.temps)));
    else if (r.limite) morceaux.push(`${r.limite} s`);
    return morceaux.join(" · ");
  }

  // Le plus long nombre d'un calcul, signe compris : sert à fixer la taille
  // d'affichage une fois pour toutes.
  function largeurMax(reglages) {
    return reglages.chiffresMax + (reglages.operations === "plusmoins" ? 1 : 0);
  }

  return Object.freeze({
    MODES,
    BORNES,
    CALCULS,
    TEMPS,
    LIMITES,
    SONS,
    OPERATIONS,
    DEFAUTS,
    normaliser,
    pas,
    changerChiffres,
    mulberry32,
    nombreDeChiffres,
    tirerCalcul,
    tirerSeance,
    coupure,
    etatAuTemps,
    secondes,
    tempsEnSecondes,
    texteChiffres,
    resume,
    largeurMax
  });
});
