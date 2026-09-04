(function () {
  "use strict";

  // Mention « Sans cookie ni traceur · Confidentialité » en pied de chaque page.
  //
  // Depuis le lot 10b (04/09/2026), le site ne mesure plus son audience : Google
  // Analytics, la bannière de consentement et l'ancien script qui les portait
  // ont été retirés. Il n'y a donc plus rien à demander au
  // visiteur ; ce petit script se contente de deux choses :
  //   1. effacer, s'il en reste, les témoins que l'ancienne mesure d'audience
  //      avait pu laisser sur l'appareil (cookies _ga et choix de consentement) ;
  //   2. poser la mention en bas de la page, avec un lien vers la page
  //      Confidentialité — sauf si la page l'écrit déjà elle-même dans son pied
  //      (attribut data-mathsgo-confidentialite).
  //
  // Il ne lit rien d'autre, n'écrit rien d'autre, et ne contacte personne.

  var SCRIPT = document.currentScript;
  var PAGE_CONFIDENTIALITE = SCRIPT && SCRIPT.src
    ? new URL("../../confidentialite.html", SCRIPT.src).href
    : "/confidentialite.html";
  var TEXTE = "Sans cookie ni traceur";
  var LIEN = "Confidentialité";

  var STYLE = [
    ".mg-mention-slot{position:relative;z-index:2147482999;box-sizing:border-box;display:flex;",
    "flex:0 0 auto;width:100%;justify-content:center;padding:8px 12px max(18px,env(safe-area-inset-bottom));",
    "font-family:\"Segoe UI\",system-ui,-apple-system,BlinkMacSystemFont,sans-serif;text-align:center}",
    ".mg-mention-slot--fixe{position:fixed;right:max(8px,env(safe-area-inset-right));",
    "bottom:max(6px,env(safe-area-inset-bottom));width:auto;padding:0}",
    ".mg-mention{display:inline-block;padding:4px 7px;border-radius:8px;background:rgba(255,255,255,.72);",
    "color:#526d8d;font-size:.74rem;font-weight:600;line-height:1.3}",
    ".mg-mention a{color:inherit;text-decoration:underline;text-underline-offset:3px}",
    ".mg-mention a:hover,.mg-mention a:focus-visible{color:#07336b}",
    "@media print{.mg-mention-slot{display:none !important}}"
  ].join("");

  function effacerAnciensTemoins() {
    try {
      var noms = document.cookie
        .split(";")
        .map(function (item) { return item.split("=")[0].trim(); })
        .filter(function (nom) { return nom === "_ga" || nom.indexOf("_ga_") === 0; });
      noms.forEach(function (nom) {
        document.cookie = nom + "=; Max-Age=0; Path=/; SameSite=Lax";
        document.cookie = nom + "=; Max-Age=0; Path=/; Domain=" + window.location.hostname + "; SameSite=Lax";
        if (/(^|\.)mathsgo\.re$/.test(window.location.hostname)) {
          document.cookie = nom + "=; Max-Age=0; Path=/; Domain=.mathsgo.re; SameSite=Lax";
        }
      });
    } catch (_erreur) {}
    try {
      window.localStorage.removeItem("mathsgo:consentement:v1");
    } catch (_erreur) {}
  }

  function poserMention() {
    // La page écrit déjà la mention dans son propre pied : rien à ajouter.
    if (document.querySelector("[data-mathsgo-confidentialite]")) return;

    var style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    var slot = document.createElement("div");
    slot.className = "mg-mention-slot";

    // Page verrouillée en plein écran (jeux, plateaux) ou disposée en colonnes :
    // la mention se pose en petit, en bas à droite, au lieu de s'ajouter sous la page.
    var styleCorps = window.getComputedStyle(document.body);
    var styleRacine = window.getComputedStyle(document.documentElement);
    var ecranVerrouille = [styleCorps.overflow, styleCorps.overflowY, styleRacine.overflow, styleRacine.overflowY]
      .some(function (valeur) { return valeur === "hidden" || valeur === "clip"; });
    var colonnes = ["flex", "inline-flex"].indexOf(styleCorps.display) !== -1
      && (styleCorps.flexDirection === "row" || styleCorps.flexDirection === "row-reverse");
    slot.classList.toggle("mg-mention-slot--fixe", ecranVerrouille || colonnes);

    var mention = document.createElement("span");
    mention.className = "mg-mention";
    mention.appendChild(document.createTextNode(TEXTE + " · "));
    var lien = document.createElement("a");
    lien.href = PAGE_CONFIDENTIALITE;
    lien.textContent = LIEN;
    mention.appendChild(lien);

    slot.appendChild(mention);
    document.body.appendChild(slot);
  }

  function demarrer() {
    effacerAnciensTemoins();
    poserMention();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrer, { once: true });
  } else {
    demarrer();
  }
})();
