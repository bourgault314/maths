// L'élève connecté ne retombe jamais sur le site (règle de Gwenaël du 08/11/2026).
//
// Une maman d'élève : sa fille « sort du suivi » — un appui de trop sur Retour,
// et la voilà sur l'accueil de mathsgo.re, sans rien qui lui dise qu'elle est
// encore connectée ni comment revenir. La règle : un élève arrivé par le suivi
// ne voit jamais le site ; quand il revient, c'est sur son menu à lui.
//
// Ce script est chargé, dans le <head> et SANS defer (il doit passer avant que
// la page ne se dessine), par les pages de navigation du site : l'accueil, le
// catalogue, les pages légales, les pages d'entrée (la liste exacte est tenue
// par tests/eleve-retour-espace.test.mjs). Si l'onglet garde le code d'un
// élève — c'est là, et seulement là, que les applis suivies le rangent
// (sessionStorage, « mathsgo-suivi-code ») —, la page ne s'affiche pas :
// l'onglet repart vers Mon espace, en REMPLAÇANT la page du site dans
// l'historique (un Retour ne la ressort pas).
//
// Sans code dans l'onglet (un visiteur, un professeur, un élève qui s'est
// déconnecté dans une appli), rien ne change. Le code n'est jamais lu ailleurs
// que dans l'onglet, jamais envoyé, jamais écrit dans une adresse.
(function () {
  "use strict";
  var ESPACE = "https://suivi.mathsgo.re/";
  var CLE = "mathsgo-suivi-code";

  function codeDansOnglet() {
    var brut = "";
    try { brut = window.sessionStorage.getItem(CLE) || ""; } catch (_) { return false; }
    // La même lecture que les moteurs des applis : majuscules, six caractères.
    var code = String(brut).toUpperCase().replace(/[^A-Z0-9]/g, "");
    return code.length === 6;
  }

  function renvoyer() {
    if (!codeDansOnglet()) return;
    try { document.documentElement.style.visibility = "hidden"; } catch (_) {}
    try { window.location.replace(ESPACE); } catch (_) {}
  }

  renvoyer();
  // Le bouton Retour peut ressortir la page d'un cache sans rejouer ce script
  // (cache arrière/avant de Chrome et de Safari) : on revérifie à ce moment-là.
  window.addEventListener("pageshow", function (evenement) {
    if (evenement && evenement.persisted) renvoyer();
  });
})();
