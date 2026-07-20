/*
 * Fabrication des codes de série MG1 (bêta du nouveau menu).
 *
 * Reproduction à l'identique de l'encodage de l'application actuelle
 * (auto/scripts/core/01-series-contracts.js) : c'est la passerelle qui
 * permet au nouveau menu de lancer une série dans le moteur existant via
 * l'adresse auto/#s=MG1-… . Le test mg1.test.js vérifie octet par octet
 * que les deux encodeurs produisent les mêmes codes.
 */
(() => {
  'use strict';

  const VERSION_SCHEMA = 1;
  const VERSION_GENERATEUR = '1.17.0';
  const PREFIXE = 'MG1-';
  const BORNE_SEED = 233280;
  const SERIES_INTERACTIVES = 10;

  function seedAleatoire() {
    if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      const donnees = new Uint32Array(1);
      globalThis.crypto.getRandomValues(donnees);
      return donnees[0] % BORNE_SEED;
    }
    return Math.floor(Math.random() * BORNE_SEED);
  }

  // JSON canonique : clés d'objet triées, pour que le même contenu donne
  // toujours exactement le même texte (et donc la même somme de contrôle).
  function jsonCanonique(valeur) {
    if (Array.isArray(valeur)) return '[' + valeur.map(jsonCanonique).join(',') + ']';
    if (valeur && typeof valeur === 'object') {
      return '{' + Object.keys(valeur).sort().map(cle => JSON.stringify(cle) + ':' + jsonCanonique(valeur[cle])).join(',') + '}';
    }
    return JSON.stringify(valeur);
  }

  function base64Url(texte) {
    const octets = new TextEncoder().encode(texte);
    let binaire = '';
    octets.forEach(octet => { binaire += String.fromCharCode(octet); });
    return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function crc32(texte) {
    let crc = 0xffffffff;
    for (let i = 0; i < texte.length; i++) {
      crc ^= texte.charCodeAt(i);
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * Fabrique le code MG1 d'une série.
   * @param {{niveau:string, nombreDeQuestions:number, idsCanoniques:string[],
   *          seed:number, aide:'with'|'without', mode:'presentation'|'interactive'}} serie
   * @param {Map<string, number>} codeParId — id canonique → code MG1 permanent
   */
  function encoderSerie(serie, codeParId) {
    const ids = [...new Set(serie.idsCanoniques)].sort();
    if (!ids.length) throw new Error('La série doit contenir au moins un automatisme.');
    const codes = ids.map(id => {
      if (!codeParId.has(id)) throw new Error('Automatisme inconnu : ' + id);
      return codeParId.get(id);
    });
    const compact = {
      v: VERSION_SCHEMA,
      g: VERSION_GENERATEUR,
      l: serie.niveau,
      q: serie.nombreDeQuestions,
      m: codes,
      s: serie.seed,
      a: serie.aide,
      x: serie.mode,
      b: serie.mode === 'interactive' ? SERIES_INTERACTIVES : 1
    };
    const contenu = base64Url(jsonCanonique(compact));
    return PREFIXE + contenu + '.' + crc32(contenu);
  }

  globalThis.MATHSGO_MG1 = Object.freeze({
    VERSION_SCHEMA,
    VERSION_GENERATEUR,
    SERIES_INTERACTIVES,
    BORNE_SEED,
    seedAleatoire,
    jsonCanonique,
    base64Url,
    crc32,
    encoderSerie
  });
})();
