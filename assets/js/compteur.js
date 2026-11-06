// Compteur de visites de mathsgo.re — lot « compteur de visites » du 06/11/2026.
//
// Pourquoi ce fichier existe : savoir quelles pages du site sont ouvertes, et
// quelles fiches PDF sont téléchargées, sans cookie et sans savoir qui visite.
// Les nombres arrivent chez GoatCounter (tableau de bord : mathsgo.goatcounter.com).
//
// Pourquoi il est écrit ici, à la main, au lieu de reprendre le script officiel
// de GoatCounter : le stockage du navigateur de mathsgo.re contient les codes et
// les prénoms des élèves suivis (Défi tables, SPLAT!, Coffres…). Tout script qui
// tourne sur une page du site peut le lire. Celui-ci est le seul code du
// compteur ; il est servi par mathsgo.re et relu avec le reste du dépôt.
//
// CE QUI PART, ET RIEN D'AUTRE (tests/compteur-visites.test.mjs le vérifie) :
//   p  le chemin de la page, sans ce qui suit « ? » ou « # »
//      (/index.html est ramené à /, pour que les deux adresses comptent ensemble) ;
//   r  le site d'où l'on arrive, réduit à son nom (https://exemple.fr),
//      seulement quand c'est un AUTRE site que mathsgo.re ;
//   s  la largeur de l'écran ;
//   e  et t pour une fiche PDF : « true » et le nom du fichier.
// Jamais : le titre de la page (Défi tables y met le prénom), ce qui suit « ? »,
// l'adresse précédente sur le site, ni aucune donnée du stockage du navigateur.
//
// Rien n'est écrit sur l'appareil du visiteur. Une seule exception, pour
// l'auteur du site : ouvrir une page avec #ne-pas-me-compter range une case
// (mathsgo-compteur-ignorer) qui fait ignorer ses visites sur CET appareil ;
// #me-compter la retire.
//
// Le compteur ne compte que sur mathsgo.re : ni en local, ni dans un cadre
// (iframe), ni pour un navigateur piloté par un robot, ni sur suivi.mathsgo.re
// (aucune page du serveur de suivi ne charge ce fichier).
(function () {
  "use strict";

  var ADRESSE = "https://mathsgo.goatcounter.com/count";
  var HOTES_COMPTES = ["mathsgo.re", "www.mathsgo.re"];
  var CASE_IGNORER = "mathsgo-compteur-ignorer";

  function lireCaseIgnorer() {
    try {
      return window.localStorage.getItem(CASE_IGNORER) === "1";
    } catch (_erreur) {
      return false;
    }
  }

  function reglerCaseIgnorer(ignorer) {
    try {
      if (ignorer) window.localStorage.setItem(CASE_IGNORER, "1");
      else window.localStorage.removeItem(CASE_IGNORER);
      window.alert(ignorer
        ? "Compteur de visites : vos visites ne sont plus comptées sur cet appareil."
        : "Compteur de visites : vos visites sont de nouveau comptées sur cet appareil.");
    } catch (_erreur) {
      // Stockage refusé (navigation privée…) : rien à faire.
    }
  }

  function cheminPropre(chemin) {
    var propre = String(chemin || "/").split("#")[0].split("?")[0];
    propre = propre.replace(/\/index\.html$/i, "/");
    return propre || "/";
  }

  function siteDOrigine() {
    try {
      if (!document.referrer) return "";
      var origine = new URL(document.referrer);
      if (origine.protocol !== "https:" && origine.protocol !== "http:") return "";
      if (HOTES_COMPTES.indexOf(origine.hostname) !== -1) return "";
      return origine.protocol + "//" + origine.hostname;
    } catch (_erreur) {
      return "";
    }
  }

  function estUnRobot() {
    var n = window.navigator || {};
    return !!(n.webdriver || window.callPhantom || window._phantom || window.__nightmare);
  }

  function dansUnCadre() {
    try {
      return window.top !== window.self;
    } catch (_erreur) {
      return true;
    }
  }

  function aNePasCompter() {
    if (HOTES_COMPTES.indexOf(window.location.hostname) === -1) return true;
    if (dansUnCadre()) return true;
    if (document.visibilityState === "prerender") return true;
    if (estUnRobot()) return true;
    if (lireCaseIgnorer()) return true;
    return false;
  }

  function envoyer(donnees) {
    var morceaux = [];
    for (var cle in donnees) {
      if (!Object.prototype.hasOwnProperty.call(donnees, cle)) continue;
      var valeur = donnees[cle];
      if (valeur === "" || valeur === null || valeur === undefined) continue;
      morceaux.push(encodeURIComponent(cle) + "=" + encodeURIComponent(valeur));
    }
    // GoatCounter le demande : certains navigateurs gardent en cache une même adresse.
    morceaux.push("rnd=" + Math.random().toString(36).slice(2, 7));
    var url = ADRESSE + "?" + morceaux.join("&");
    try {
      if (window.navigator.sendBeacon && window.navigator.sendBeacon(url)) return;
    } catch (_erreur) {
      // sendBeacon refusé : on passe à l'image.
    }
    try {
      var image = new Image();
      image.referrerPolicy = "no-referrer";
      image.src = url;
    } catch (_erreur) {
      // Tant pis : une visite non comptée ne gêne personne.
    }
  }

  function compterUneFichePdf(evenement) {
    if (evenement.type === "auxclick" && evenement.button !== 1) return;
    var cible = evenement.target;
    var lien = cible && cible.closest ? cible.closest("a[href]") : null;
    if (!lien) return;
    var url;
    try {
      url = new URL(lien.getAttribute("href"), window.location.href);
    } catch (_erreur) {
      return;
    }
    if (!/\.pdf$/i.test(url.pathname)) return;
    if (HOTES_COMPTES.indexOf(url.hostname) === -1) return;
    if (aNePasCompter()) return;
    var nom = url.pathname.split("/").pop();
    try {
      nom = decodeURIComponent(nom);
    } catch (_erreur) {
      // Nom mal encodé : on le garde tel quel.
    }
    envoyer({ p: cheminPropre(url.pathname), t: nom, e: "true" });
  }

  if (window.location.hash === "#ne-pas-me-compter") {
    reglerCaseIgnorer(true);
    return;
  }
  if (window.location.hash === "#me-compter") {
    reglerCaseIgnorer(false);
  }

  document.addEventListener("click", compterUneFichePdf, true);
  document.addEventListener("auxclick", compterUneFichePdf, true);

  if (aNePasCompter()) return;
  envoyer({
    p: cheminPropre(window.location.pathname),
    r: siteDOrigine(),
    s: window.screen ? window.screen.width : "",
  });
})();
