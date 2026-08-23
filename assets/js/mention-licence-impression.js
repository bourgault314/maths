/**
 * Mention de licence sur les documents imprimés — composant partagé maths&go.
 *
 * Ajoute, uniquement à l'impression, une petite ligne
 * « maths&go · mathsgo.re · CC BY-NC-SA 4.0 » en bas de chaque feuille.
 *
 * Rien n'est visible à l'écran, rien n'est ajouté au DOM tant que l'impression
 * n'est pas demandée, et tout est retiré une fois l'impression terminée : la
 * mise en page des outils n'est jamais modifiée en usage normal.
 *
 * Une seule ligne à ajouter dans une page pour en profiter :
 *   <script defer src="/assets/js/mention-licence-impression.js"></script>
 *
 * Pour la désactiver sur une page précise (rare) :
 *   <body data-mention-licence="non">
 */
(function () {
  "use strict";

  if (window.__mathsgoMentionLicenceImpression) return;
  window.__mathsgoMentionLicenceImpression = true;

  var TEXTE = "maths&go · mathsgo.re · CC BY-NC-SA 4.0";
  var CLASSE = "mathsgo-credit-impression";
  var CONTENEURS = ".sheet, .page, .feuille, .printPage, .print-page";

  function injecterStyle() {
    if (document.getElementById("mathsgoCreditImpressionStyle")) return;
    var style = document.createElement("style");
    style.id = "mathsgoCreditImpressionStyle";
    style.textContent =
      "." + CLASSE + "{display:none}" +
      "@media print{." + CLASSE + "{" +
      "display:block;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
      "font-size:6.5pt;line-height:1.2;letter-spacing:.01em;color:#9aa0a6;" +
      "text-align:center;text-decoration:none;background:none;border:none;" +
      "margin:1mm 0 0;padding:0;flex:0 0 auto}" +
      "." + CLASSE + "--ancre{position:absolute;left:0;right:0;bottom:1.5mm;" +
      "margin:0;z-index:2}" +
      "." + CLASSE + "--page{position:fixed;left:0;right:0;bottom:1.5mm;" +
      "margin:0;z-index:2}" +
      "}";
    (document.head || document.documentElement).appendChild(style);
  }

  function creerMention(modificateur) {
    var el = document.createElement("div");
    el.className = CLASSE + (modificateur ? " " + CLASSE + "--" + modificateur : "");
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("data-mathsgo-credit", "1");
    el.textContent = TEXTE;
    return el;
  }

  // Attention : beaucoup d'outils construisent leurs feuilles dans une zone
  // masquée à l'écran et révélée par @media print. On ne peut donc PAS filtrer
  // sur la visibilité au moment où l'on pose la mention : on retient toute
  // feuille qui a du contenu, sauf celles explicitement marquées [hidden].
  function estRetenu(el) {
    if (!el) return false;
    if (el.hasAttribute("hidden") || el.closest("[hidden]")) return false;
    return el.childElementCount > 0 || (el.textContent || "").trim().length > 0;
  }

  function poser() {
    if (document.body && document.body.getAttribute("data-mention-licence") === "non") return;
    injecterStyle();
    retirer();

    var conteneurs = Array.prototype.filter.call(
      document.querySelectorAll(CONTENEURS),
      estRetenu
    );

    if (conteneurs.length === 0) {
      // Page sans découpage en feuilles : une seule mention en fin de document.
      // Elle est posée en « fixed » et non dans le flux, car certains outils
      // bornent body à une feuille exacte avec overflow:hidden à l'impression :
      // une mention en fin de flux y serait rognée et n'apparaîtrait pas au PDF.
      if (document.body) document.body.appendChild(creerMention("page"));
      return;
    }

    conteneurs.forEach(function (conteneur) {
      if (conteneur.querySelector("[data-mathsgo-credit]")) return;
      // Si la feuille est déjà un repère de positionnement, on ancre la mention
      // en bas à droite sans toucher au flux ; sinon on l'ajoute en fin de flux.
      var position = window.getComputedStyle(conteneur).position;
      var ancree = position !== "static";
      conteneur.appendChild(creerMention(ancree ? "ancre" : ""));
    });
  }

  function retirer() {
    var anciennes = document.querySelectorAll("[data-mathsgo-credit]");
    Array.prototype.forEach.call(anciennes, function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  window.addEventListener("beforeprint", poser);
  window.addEventListener("afterprint", retirer);

  // Safari et anciens navigateurs : pas d'événement beforeprint.
  if (window.matchMedia) {
    var mq = window.matchMedia("print");
    var surChangement = function (e) {
      if (e.matches) poser();
      else retirer();
    };
    if (mq.addEventListener) mq.addEventListener("change", surChangement);
    else if (mq.addListener) mq.addListener(surChangement);
  }
})();
