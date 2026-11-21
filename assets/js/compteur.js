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
// l'adresse précédente sur le site, ni aucune donnée du stockage du navigateur
// (il en LIT deux dans l'onglet, le code de l'élève et sa propre marque, pour
// savoir s'il doit se taire — voir plus bas ; rien n'en part jamais). Et rien
// du tout quand on arrive du serveur de suivi : le compteur se tait.
//
// Ce que le compteur écrit sur l'appareil, et rien d'autre :
//   - mathsgo-compteur-ignorer (stockage durable), pour l'auteur du site :
//     ouvrir une page avec #ne-pas-me-compter range cette case, qui fait
//     ignorer ses visites sur CET appareil ; #me-compter la retire ;
//   - mathsgo-compteur-taire (mémoire de l'onglet, sessionStorage, valeur
//     « 1 », aucune donnée), la marque d'onglet décrite plus bas. Elle
//     disparaît avec l'onglet.
//
// Le compteur ne compte que sur mathsgo.re : ni en local, ni dans un cadre
// (iframe), ni pour un navigateur piloté par un robot, ni sur suivi.mathsgo.re
// (aucune page du serveur de suivi ne charge ce fichier).
//
// Ni pour un ÉLÈVE CONNECTÉ, ni pour qui VIENT DU SUIVI DE CLASSE (lot
// « petits correctifs de sécurité », 11/11/2026, constat F07 de l'audit GPT du
// 09/11 ; lot « compteur-silence-suivi », 21/11/2026, diagnostic GoatCounter
// du même jour). La règle tient depuis le 30/08 : aucune mesure d'audience dès
// qu'un élève est identifié par un code. Le compteur se tait sur l'un de ces
// signes, lus dans la page et l'onglet et nulle part ailleurs, jamais envoyés :
//   - la provenance : document.referrer commence par https://suivi.mathsgo.re
//     (l'espace élève, Ma classe). Le navigateur la garde au rechargement, au
//     retour arrière et dans un nouvel onglet ouvert depuis le suivi, et
//     Safari la donne aussi : c'est le signe qui tient quand le billet est
//     vide, usé, périmé ou refusé et qu'aucun code n'arrive dans l'onglet ;
//   - l'arrivée par un billet (#b=…), MÊME VIDE, avant que l'appli l'ait
//     échangé contre le code : le script du <head> de chaque appli suivie le
//     range dans window.MATHSGO_ENTREE.billet et efface l'adresse avant que ce
//     fichier, chargé en « defer », ne tourne ; un « #b= » vide, lui, n'est
//     pas effacé et reste lisible dans l'adresse. Les pages sans ce script
//     (les outils SPLAT! ouverts par « ?eleve=1&parcours=…#b=… ») gardent le
//     billet dans l'adresse le temps de l'échange : il est lu là aussi
//     (relecture Codex du 11/11/2026, D4) ;
//   - le code rangé par les applis suivies dans la mémoire de l'onglet
//     (sessionStorage, « mathsgo-suivi-code », lu comme eleve-retour-espace.js) ;
//   - la marque d'onglet « mathsgo-compteur-taire » : posée par ce fichier dès
//     qu'il voit l'un des deux premiers signes (provenance suivi ; billet dans
//     MATHSGO_ENTREE ou « b= » dans l'adresse), elle tait le compteur sur
//     toutes les pages suivantes du MÊME onglet — après un billet refusé et un
//     rechargement, après une déconnexion. Valeur « 1 », aucune donnée ; un
//     autre onglet ne la voit pas.
// Le professeur qui ouvre une fiche depuis Ma classe (#b=…&vue=fiche) n'est
// pas compté non plus : c'est aussi un billet, et il vient du suivi.
(function () {
  "use strict";

  var ADRESSE = "https://mathsgo.goatcounter.com/count";
  var HOTES_COMPTES = ["mathsgo.re", "www.mathsgo.re"];
  var CASE_IGNORER = "mathsgo-compteur-ignorer";
  var CASE_CODE_ELEVE = "mathsgo-suivi-code";
  var MARQUE_TAIRE = "mathsgo-compteur-taire";
  var PROVENANCE_SUIVI = "https://suivi.mathsgo.re";
  var ALPHABET_CODES = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

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

  // Les signes qui posent la marque d'onglet (voir l'en-tête). Rien de ce
  // qu'ils lisent ne sort de ces fonctions.
  function vientDuSuivi() {
    try {
      return String(document.referrer || "").indexOf(PROVENANCE_SUIVI) === 0;
    } catch (_erreur) {
      return false;
    }
  }

  function arriveParUnBillet() {
    try {
      var entree = window.MATHSGO_ENTREE;
      if (entree && typeof entree.billet === "string" && entree.billet !== "") return true;
    } catch (_erreur) {
      // Rien à lire : on regarde l'adresse.
    }
    try {
      // Le billet encore dans l'adresse : « b= », même vide, en tête du
      // fragment ou après un « & » (la même lecture que splat-parcours.js).
      // Un « #b= » vide n'est pas effacé par le script du <head> : c'est ici
      // qu'on le voit.
      if (/(?:^#|&)b=/.test(String(window.location.hash || ""))) return true;
    } catch (_erreur) {
      // Adresse illisible.
    }
    return false;
  }

  function lireMarqueTaire() {
    try {
      return window.sessionStorage.getItem(MARQUE_TAIRE) === "1";
    } catch (_erreur) {
      return false;
    }
  }

  function poserMarqueTaire() {
    try {
      window.sessionStorage.setItem(MARQUE_TAIRE, "1");
    } catch (_erreur) {
      // Mémoire de l'onglet refusée : le signe de CETTE page suffit à se taire.
    }
  }

  // Un élève connecté dans cet onglet ? (Voir l'en-tête.) Le code est lu
  // comme le lisent les moteurs des applis : majuscules, signes retirés, six
  // caractères de l'alphabet des codes. Il ne sort pas de cette fonction.
  function eleveConnecte() {
    var brut = "";
    try {
      brut = window.sessionStorage.getItem(CASE_CODE_ELEVE) || "";
    } catch (_erreur) {
      return false;
    }
    var code = String(brut).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (code.length !== 6) return false;
    for (var i = 0; i < code.length; i += 1) {
      if (ALPHABET_CODES.indexOf(code.charAt(i)) === -1) return false;
    }
    return true;
  }

  function aNePasCompter() {
    if (HOTES_COMPTES.indexOf(window.location.hostname) === -1) return true;
    if (dansUnCadre()) return true;
    if (document.visibilityState === "prerender") return true;
    if (estUnRobot()) return true;
    if (aTaire) return true;
    if (lireMarqueTaire()) return true;
    if (eleveConnecte()) return true;
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

  // Les signes du suivi, lus une fois, à l'arrivée sur la page : ils posent
  // la marque d'onglet, même en local ou dans un cadre (elle ne contient rien).
  var aTaire = vientDuSuivi() || arriveParUnBillet();
  if (aTaire) poserMarqueTaire();

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
