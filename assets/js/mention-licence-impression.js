/**
 * Mention de licence sur les documents imprimés — composant partagé maths&go.
 *
 * Ajoute, uniquement à l'impression, une petite ligne
 * « mathsgo.re · CC BY-NC-SA 4.0 » en bas de chaque feuille.
 *
 * Une feuille qui porte déjà une mention « mathsgo.re » est laissée telle quelle :
 * un outil qui imprime son propre pied de page ne se retrouve jamais avec deux
 * lignes empilées.
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

  var TEXTE = "mathsgo.re · CC BY-NC-SA 4.0";
  var CLASSE = "mathsgo-credit-impression";
  var CONTENEURS = ".sheet, .page, .feuille, .printPage, .print-page";

  // « visibility:visible » n'est pas decoratif : plusieurs outils impriment avec
  // « body * { visibility: hidden } » puis revelent leur seule zone imprimable.
  // Sans cette declaration, la mention est posee mais invisible sur le papier.
  function injecterStyle() {
    if (document.getElementById("mathsgoCreditImpressionStyle")) return;
    var style = document.createElement("style");
    style.id = "mathsgoCreditImpressionStyle";
    // « visibility:visible » n'est pas decoratif : plusieurs outils impriment avec
    // « body * { visibility: hidden } » puis revelent leur seule zone imprimable.
    // Sans cette declaration, la mention est posee mais invisible sur le papier.
    var apparence =
      "display:block;visibility:visible;" +
      "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
      "font-size:6.5pt;line-height:1.2;letter-spacing:.01em;color:#9aa0a6;" +
      "text-align:center;text-decoration:none;background:none;border:none;" +
      "margin:1mm 0 0;padding:0;flex:0 0 auto;";
    var ancre = "position:absolute;left:0;right:0;bottom:1.5mm;margin:0;z-index:2;";
    var pleinePage = "position:fixed;left:0;right:0;bottom:1.5mm;margin:0;z-index:2;";
    style.textContent =
      "." + CLASSE + "{display:none}" +
      // À l'écran, seule la variante « --ecran » s'affiche.
      "." + CLASSE + "--ecran{" + apparence + "}" +
      "." + CLASSE + "--ecran." + CLASSE + "--ancre{" + ancre + "}" +
      "@media print{" +
        "." + CLASSE + "{" + apparence + "}" +
        "." + CLASSE + "--ancre{" + ancre + "}" +
        "." + CLASSE + "--page{" + pleinePage + "}" +
      "}";
    (document.head || document.documentElement).appendChild(style);
  }

  // modificateurs : un ou plusieurs mots ("ecran", "ancre", "page"…)
  function creerMention(modificateurs) {
    var el = document.createElement("div");
    var classes = [CLASSE];
    String(modificateurs || "").split(/\s+/).forEach(function (mot) {
      if (mot) classes.push(CLASSE + "--" + mot);
    });
    el.className = classes.join(" ");
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

  // Certains outils impriment déjà leur propre pied de page (Petit Splat, Splat,
  // Splat Équations…). On ne doit JAMAIS en ajouter un deuxième : c'est la règle
  // qui évite les deux lignes empilées et mal alignées.
  function porteDejaUneMention(element) {
    if (!element) return false;
    var texte = element.textContent || "";
    if (texte.indexOf("mathsgo.re") !== -1) return true;
    if (texte.indexOf("maths&go") !== -1) return true;
    return false;
  }

  // À l'ÉCRAN seulement. Une feuille peut porter le LOGO du site au lieu de son
  // adresse écrite : la mention viendrait se poser par-dessus (constaté sur
  // box_barre_final et les deux générateurs de tuiles algébriques).
  //
  // Ce garde-fou ne vaut PAS pour l'impression : un logo dit d'où vient la
  // feuille, il ne dit pas ce qu'on a le droit d'en faire. L'appliquer au papier
  // priverait de licence toute feuille — et même toute page dont la seule
  // interface montre le logo — ce qui viderait ce chantier de son objet.
  var SELECTEUR_LOGO =
    'img[src*="mathsgo"], img[alt*="maths"], img[alt*="Maths"],' +
    'svg[aria-label*="aths"], svg[data-mathsgo-logo], [class*="footer-logo"], [class*="logo-mathsgo"]';

  function logoDe(element) {
    return element ? element.querySelector(SELECTEUR_LOGO) : null;
  }

  // Seul un logo situé EN BAS de la feuille gêne : c'est là que la mention ancrée
  // viendrait se poser. Un logo d'en-tête ne concerne pas la mention.
  function logoEnPiedDe(conteneur) {
    var logo = logoDe(conteneur);
    if (!logo) return null;
    var rl = logo.getBoundingClientRect();
    var rc = conteneur.getBoundingClientRect();
    if (!rl.height || !rc.height) return null;
    return (rc.bottom - rl.bottom) < rc.height * 0.2 ? logo : null;
  }

  function porteDejaUneMentionOuUnLogo(element) {
    if (porteDejaUneMention(element)) return true;
    return !!logoDe(element);
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
      if (document.body && !porteDejaUneMention(document.body)) {
        document.body.appendChild(creerMention("page"));
      }
      return;
    }

    // Certains outils emboîtent une feuille dans une autre (.page qui contient
    // .sheet). On ne garde que la plus intérieure, sinon la mention serait posée
    // deux fois sur la même feuille.
    conteneurs = conteneurs.filter(function (conteneur) {
      return !conteneurs.some(function (autre) {
        return autre !== conteneur && conteneur.contains(autre);
      });
    });

    var poses = [];
    conteneurs.forEach(function (conteneur) {
      if (conteneur.querySelector("[data-mathsgo-credit]")) return;
      if (porteDejaUneMention(conteneur)) return;
      // Si la feuille est déjà un repère de positionnement, on ancre la mention
      // en bas sans toucher au flux ; sinon on l'ajoute en fin de flux.
      //
      // Exception : une feuille dont le LOGO est en bas a déjà quelque chose à cet
      // endroit. Ancrer la mention l'imprimerait PAR-DESSUS (constaté sur
      // box_barre_final). On la glisse alors juste APRÈS le logo, à sa place
      // naturelle. La mettre en fin de flux ne marcherait pas : sur ces feuilles le
      // contenu est positionné en absolu et la mention remonterait tout en haut.
      var logo = logoEnPiedDe(conteneur);
      var position = window.getComputedStyle(conteneur).position;
      var ancree = position !== "static" && !logo;
      var mention = creerMention(ancree ? "ancre" : "");
      if (logo && logo.parentNode) {
        logo.parentNode.insertBefore(mention, logo.nextSibling);
      } else {
        conteneur.appendChild(mention);
      }
      poses.push({ conteneur: conteneur, mention: mention, ancree: ancree });
    });

    // Garde-fou : une feuille à hauteur fixe (générateurs de bandes, de disques,
    // de matériel…) déborderait d'une ligne, ce qui décalerait l'impression d'une
    // page entière. Dans ce cas on retire tout et on repasse sur une mention unique
    // en « fixed », que le navigateur répète sur chaque page imprimée.
    var deborde = poses.some(function (pose) {
      return !pose.ancree && pose.conteneur.scrollHeight > pose.conteneur.clientHeight + 1;
    });
    if (deborde) {
      retirer();
      if (document.body && !porteDejaUneMention(document.body)) {
        document.body.appendChild(creerMention("page"));
      }
    }
  }

  function retirer() {
    var anciennes = document.querySelectorAll("[data-mathsgo-credit]");
    Array.prototype.forEach.call(anciennes, function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  // ---------------------------------------------------------------------------
  // À l'écran : les outils qui montrent un aperçu de feuille doivent afficher la
  // même signature que ce qui sortira de l'imprimante. Les outils qui n'affichent
  // qu'une interface, ou dont les feuilles vivent dans une zone masquée révélée
  // par @media print, ne changent pas d'apparence.
  // ---------------------------------------------------------------------------

  var observateur = null;
  var minuterie = null;

  function estVisibleEcran(el) {
    var st = window.getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden") return false;
    var r = el.getBoundingClientRect();
    return r.width > 150 && r.height > 150;
  }

  // On ne transforme une feuille en repère de positionnement que si aucun de ses
  // descendants n'est positionné en absolu : sinon on déplacerait leur point de
  // référence, donc leur position à l'écran.
  function peutDevenirRepere(conteneur) {
    var enfants = conteneur.querySelectorAll("*");
    for (var i = 0; i < enfants.length; i++) {
      var pos = window.getComputedStyle(enfants[i]).position;
      if (pos === "absolute" || pos === "fixed") return false;
    }
    return true;
  }

  function poserEcran() {
    if (document.body && document.body.getAttribute("data-mention-licence") === "non") return;
    injecterStyle();

    var conteneurs = Array.prototype.filter.call(
      document.querySelectorAll(CONTENEURS), estRetenu
    ).filter(estVisibleEcran);

    conteneurs = conteneurs.filter(function (c) {
      return !conteneurs.some(function (a) { return a !== c && c.contains(a); });
    });

    conteneurs.forEach(function (conteneur) {
      if (conteneur.querySelector("[data-mathsgo-credit]")) return;
      if (porteDejaUneMentionOuUnLogo(conteneur)) return;

      // À l'écran, la mention est ANCRÉE en bas de la feuille, comme un vrai pied
      // de page : posée en fin de flux elle atterrirait là où le contenu s'arrête,
      // c'est-à-dire n'importe où, et pousserait les feuilles à hauteur fixe.
      var ancree = window.getComputedStyle(conteneur).position !== "static";
      if (!ancree && peutDevenirRepere(conteneur)) {
        conteneur.style.position = "relative";
        conteneur.setAttribute("data-mathsgo-repere", "1");
        ancree = true;
      }
      var mention = creerMention(ancree ? "ecran ancre" : "ecran");
      var debordAvant = conteneur.scrollHeight - conteneur.clientHeight;
      conteneur.appendChild(mention);
      if (!ancree && conteneur.scrollHeight - conteneur.clientHeight > debordAvant + 1) {
        conteneur.removeChild(mention);
      }
    });
  }

  function surveiller() {
    if (observateur || !window.MutationObserver || !document.body) return;
    observateur = new MutationObserver(function (mutations) {
      var pertinent = mutations.some(function (m) {
        return Array.prototype.some.call(m.addedNodes, function (n) {
          return n.nodeType === 1 && !n.hasAttribute("data-mathsgo-credit");
        }) || Array.prototype.some.call(m.removedNodes, function (n) {
          return n.nodeType === 1 && !n.hasAttribute("data-mathsgo-credit");
        });
      });
      if (!pertinent) return;
      // Les générateurs reconstruisent leurs feuilles à chaque « Générer » : on
      // repose la mention une fois les mutations retombées.
      window.clearTimeout(minuterie);
      minuterie = window.setTimeout(function () {
        observateur.disconnect();
        try { poserEcran(); } finally {
          observateur.observe(document.body, { childList: true, subtree: true });
        }
      }, 200);
    });
    observateur.observe(document.body, { childList: true, subtree: true });
  }

  function demarrer() {
    poserEcran();
    surveiller();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrer);
  } else {
    demarrer();
  }
  window.addEventListener("load", function () { window.setTimeout(poserEcran, 300); });

  window.addEventListener("beforeprint", poser);
  window.addEventListener("afterprint", function () { retirer(); poserEcran(); });

  // Safari et anciens navigateurs : pas d'événement beforeprint.
  if (window.matchMedia) {
    var mq = window.matchMedia("print");
    var surChangement = function (e) {
      if (e.matches) poser();
      else { retirer(); poserEcran(); }
    };
    if (mq.addEventListener) mq.addEventListener("change", surChangement);
    else if (mq.addListener) mq.addListener(surChangement);
  }
})();
