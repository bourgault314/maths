// L'élève connecté ne retombe jamais sur le site (règle de Gwenaël du 08/11/2026).
//
// Une maman d'élève : sa fille « sort du suivi » — un appui de trop sur Retour,
// et la voilà sur l'accueil de mathsgo.re, sans rien qui lui dise qu'elle est
// encore connectée ni comment revenir. La règle : un élève arrivé par le suivi
// ne voit jamais le site ; quand il revient, c'est sur son menu à lui.
//
// Ce script est chargé, dans le <head> et SANS defer (il doit passer avant que
// la page ne se dessine), par les pages de navigation du site et ses carrefours : l'accueil, le
// catalogue, les pages légales, les pages d'entrée, la page des livrets SPLAT! (la liste exacte est tenue
// par tests/eleve-retour-espace.test.mjs). Si l'onglet garde le code d'un
// élève — c'est là, et seulement là, que les applis suivies le rangent
// (sessionStorage, « mathsgo-suivi-code ») —, la page ne s'affiche pas :
// l'onglet repart vers Mon espace, en REMPLAÇANT la page du site dans
// l'historique (un Retour ne la ressort pas).
//
// Sans code dans l'onglet (un visiteur, un professeur, un élève qui s'est
// déconnecté), rien ne change. Le code n'est jamais lu ailleurs que dans
// l'onglet, jamais envoyé, jamais écrit dans une adresse.
//
// « Se déconnecter » SUR MON ESPACE passe par ici (08/11/2026, défaut trouvé
// par l'audit et confirmé par une relecture indépendante). Les deux domaines
// ont chacun la mémoire de leur onglet : Mon espace ne peut vider que la
// sienne. Le code que les applis gardaient sur mathsgo.re restait, et dans
// le même onglet un Retour rouvrait l'appli au nom de l'élève précédent —
// l'élève suivant, même après avoir tapé SON code, pouvait travailler dans le
// parcours de l'autre. Mon espace envoie donc l'onglet sur
// https://mathsgo.re/?sortie=1 : ce script, AVANT toute autre chose, vide la
// mémoire de l'onglet côté mathsgo.re (TOUT le sessionStorage : code,
// identité, dernier geste, mondes, réglages — une clé ajoutée demain par une
// appli partirait aussi ; le localStorage, où les parcours sont rangés sous
// une empreinte, n'est pas touché), PUIS rend l'onglet à l'écran du code de
// Mon espace (adresse fixe, rien repris de l'adresse reçue), sans que
// l'accueil se montre et sans trace dans l'historique (replace).
//
// N'importe qui peut faire un lien vers ?sortie=1 : il ne peut que
// déconnecter l'onglet qui l'ouvre, vers une adresse fixe — aucun renvoi vers
// un autre site, aucune donnée lue ni envoyée.
(function () {
  "use strict";
  var ESPACE = "https://suivi.mathsgo.re/";
  var ECRAN_DU_CODE = "https://suivi.mathsgo.re/?oublier=1";
  var CLE = "mathsgo-suivi-code";
  var ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

  function codeDansOnglet() {
    var brut = "";
    try { brut = window.sessionStorage.getItem(CLE) || ""; } catch (_) { return false; }
    // La même lecture que les moteurs des applis (codeValide de
    // splat-parcours.js, defi_tables_mon_parcours.js…) : majuscules, signes
    // retirés, six premiers caractères, tous dans l'alphabet des codes.
    var code = String(brut).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (code.length !== 6) return false;
    for (var i = 0; i < code.length; i += 1) if (ALPHABET.indexOf(code.charAt(i)) < 0) return false;
    return true;
  }

  function cacher() {
    try { document.documentElement.style.visibility = "hidden"; } catch (_) {}
  }

  // Le paramètre exact sortie=1 (pas « sortie=10 », pas « xsortie=1 »).
  function sortieDemandee() {
    try { return new URLSearchParams(window.location.search).get("sortie") === "1"; } catch (_) { return false; }
  }

  function sortir() {
    cacher();
    try { window.sessionStorage.clear(); } catch (_) {}
    try { window.location.replace(ECRAN_DU_CODE); } catch (_) {}
  }

  function renvoyer() {
    if (sortieDemandee()) { sortir(); return; }
    if (!codeDansOnglet()) return;
    cacher();
    try { window.location.replace(ESPACE); } catch (_) {}
  }

  renvoyer();
  // Le bouton Retour peut ressortir la page d'un cache sans rejouer ce script
  // (cache arrière/avant de Chrome et de Safari) : on revérifie à ce moment-là.
  window.addEventListener("pageshow", function (evenement) {
    if (evenement && evenement.persisted) renvoyer();
  });
})();
