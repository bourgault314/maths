(function () {
  "use strict";

  if (window.__mathsgoParentNavigationLoaded) return;
  window.__mathsgoParentNavigationLoaded = true;

  const scriptSource = document.currentScript?.src
    || new URL("/assets/js/tool-parent-navigation.js", window.location.href).href;
  const siteBaseUrl = new URL("../../", scriptSource);

  function currentSitePathname() {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.origin !== siteBaseUrl.origin || !currentUrl.pathname.startsWith(siteBaseUrl.pathname)) {
      return currentUrl.pathname;
    }
    return `/${currentUrl.pathname.slice(siteBaseUrl.pathname.length).replace(/^\/+/, "")}`;
  }

  function siteUrl(pathname) {
    return new URL(String(pathname || "").replace(/^\/+/, ""), siteBaseUrl).href;
  }

  function normaliseViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;
    const parts = viewport.content
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !/^(?:maximum-scale|user-scalable)\s*=/i.test(part));
    if (!parts.some((part) => /^width\s*=\s*device-width$/i.test(part))) {
      parts.unshift("width=device-width");
    }
    if (!parts.some((part) => /^initial-scale\s*=/i.test(part))) {
      parts.push("initial-scale=1");
    }
    viewport.content = parts.join(", ");
  }

  function installMobileCompatibility() {
    if (!/^\/outils\/bouliers\/rekenrek\//.test(currentSitePathname())) return;
    normaliseViewport();

    document.documentElement.dataset.mathsgoMobileFamily = "rekenrek";
    document.querySelectorAll(".toolbar").forEach((toolbar) => {
      [...toolbar.children].forEach((child) => {
        const isControlGroup = child.matches(".toolbar-group, .toolbar-left, .score-board");
        const isTitle = child.matches(".app-title, #app-title, .toolbar-title")
          || (!isControlGroup && !child.querySelector("button, select, input, a"));
        if (isTitle) child.classList.add("mathsgo-mobile-toolbar-title");
      });
    });

    if (document.querySelector('link[data-mathsgo-mobile-compat="rekenrek"]')) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = new URL("assets/css/rekenrek-mobile-compat.css?v=1", siteBaseUrl).href;
    stylesheet.dataset.mathsgoMobileCompat = "rekenrek";
    stylesheet.addEventListener("load", () => {
      window.requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    }, { once: true });
    document.head.appendChild(stylesheet);
  }

  function makeHistoryAware(link) {
    if (window.self !== window.top) {
      link.target = "_top";
      return;
    }

    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (window.history.length <= 1 || !document.referrer) return;

      try {
        const previous = new URL(document.referrer);
        const current = new URL(window.location.href);
        if (previous.origin !== siteBaseUrl.origin || previous.href === current.href) return;
      } catch (_) {
        return;
      }

      event.preventDefault();
      window.history.back();
    });
  }


  const BACK_STYLE_ID = "mathsgo-back-style";
  const BACK_CLASS = "mathsgo-back";

  function ensureBackStyles() {
    if (document.getElementById(BACK_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = BACK_STYLE_ID;
    style.textContent = `
a.${BACK_CLASS}{
  box-sizing:border-box;display:inline-flex;align-items:center;gap:.4em;
  min-height:44px;min-width:44px;padding:0 .7em;
  font:600 15px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  color:#0b67b2;background:#fff;border:1px solid #cfe0f0;border-radius:12px;
  text-decoration:none;cursor:pointer;flex:0 0 auto;order:-999;align-self:center;
  -webkit-tap-highlight-color:transparent;
}
a.${BACK_CLASS}:hover{background:#eaf5ff}
.${BACK_CLASS}-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
a.${BACK_CLASS}.${BACK_CLASS}--compact{padding:0;justify-content:center;min-width:44px}
a.${BACK_CLASS}.${BACK_CLASS}--compact .${BACK_CLASS}-label{display:none}
.${BACK_CLASS}-row > :not(a.${BACK_CLASS}){margin-top:0;margin-bottom:0}
a.${BACK_CLASS}.${BACK_CLASS}--dark{color:#eaf5ff;background:#1d2733;border-color:#3d4b5c}
a.${BACK_CLASS}.${BACK_CLASS}--dark:hover{background:#2a3644}
a.${BACK_CLASS}:focus-visible{outline:2px solid #0b67b2;outline-offset:2px}
a.${BACK_CLASS} svg{width:20px;height:20px;flex:0 0 auto;display:block}
a.${BACK_CLASS} .${BACK_CLASS}-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:11em}
a.${BACK_CLASS}[data-mathsgo-place="inflow"]{margin:10px;align-self:flex-start;width:fit-content}
@media (max-width:430px){
  a.${BACK_CLASS} .${BACK_CLASS}-label{display:none}
  a.${BACK_CLASS}{padding:0;justify-content:center}
}
@media print{ a.${BACK_CLASS}{display:none !important} }
`;
    document.head.appendChild(style);
  }

  function buildBackLink(href, label) {
    const link = document.createElement("a");
    link.className = BACK_CLASS;
    link.href = href;
    link.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"'
      + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>'
      + '<span class="' + BACK_CLASS + '-label"></span>';
    link.querySelector("." + BACK_CLASS + "-label").textContent = label;
    return link;
  }


  function applyContrast(link) {
    try {
      let node = link.parentElement;
      let background = "";
      while (node && node !== document.documentElement) {
        const value = window.getComputedStyle(node).backgroundColor;
        const parts = value.match(/[\d.]+/g);
        if (parts && parts.length >= 3 && (parts.length < 4 || Number(parts[3]) > 0.5)) {
          background = value;
          break;
        }
        node = node.parentElement;
      }
      if (!background) return;
      const [r, g, b] = background.match(/[\d.]+/g).map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luminance < 0.5) link.classList.add(BACK_CLASS + "--dark");
    } catch (_) { /* contraste facultatif */ }
  }

  // Aucun mode épinglé ici, et il ne doit pas y en avoir : la flèche punaisée
  // par-dessus la page est ce qui avait rendu Nim injouable sur téléphone, et ce
  // que la PR #254 a retiré. Le bouton se pose dans le flux, à l'intérieur d'un
  // conteneur de la page, ou pas du tout. Deux tests montent la garde.
  const TITLE_ROW_SELECTOR = "h1, h2, .app-title, .sb-title, .toolbar-title, .title";
  const BRAND_SELECTOR = ".brand, .brand-text, .brand-logo, .logo, .logo-link, [class*=\"brand\"]";

  // Le premier titre de la page, en écartant ceux qui vivent dans un bloc de marque :
  // le bouton s'y retrouvait coincé entre le logo maths&go et le nom de l'appli.
  function pickHeading() {
    for (const candidat of document.querySelectorAll(TITLE_ROW_SELECTOR)) {
      if (candidat.closest(BRAND_SELECTOR)) continue;
      const boite = candidat.getBoundingClientRect();
      if (boite.width === 0 && boite.height === 0) continue;
      return candidat;
    }
    return null;
  }

  function pickBackHost(requested) {
    if (requested && requested !== "auto") {
      const forced = document.querySelector(requested);
      if (forced) return forced;
    }
    return document.querySelector(".toolbar, header, .topbar, .app-header, .wrap > :first-child, .panel") || null;
  }

  // Le bouton et le titre partagent-ils vraiment la même ligne ?
  function partagentLaLigne(link, heading) {
    const bouton = link.getBoundingClientRect();
    const titre = heading.getBoundingClientRect();
    if (!bouton.width || !titre.width) return true;
    return bouton.top < titre.bottom - 2 && titre.top < bouton.bottom - 2;
  }

  // Dans une colonne étroite, le libellé renvoie le titre à la ligne : on ne garde
  // alors que la flèche, en 44 x 44. On CONSTATE le renvoi à la ligne au lieu de le
  // prédire — une comparaison de largeurs faite au premier repaint tombait sur une
  // rangée encore à zéro et n'agissait jamais. Et si même la flèche seule ne suffit
  // pas à les réunir, on rend le libellé : le sacrifier n'apporterait rien.
  function ajusterCompacite(link, heading) {
    link.classList.remove(BACK_CLASS + "--compact");
    if (partagentLaLigne(link, heading)) return;
    link.classList.add(BACK_CLASS + "--compact");
    if (!partagentLaLigne(link, heading)) link.classList.remove(BACK_CLASS + "--compact");
  }

  function poserEnRangee(link, heading) {
    const rangee = document.createElement("div");
    rangee.className = BACK_CLASS + "-row";
    heading.parentElement.insertBefore(rangee, heading);
    rangee.appendChild(link);
    rangee.appendChild(heading);
    const ajuster = () => ajusterCompacite(link, heading);
    // La page n'a pas fini de se mettre en place quand on arrive : on remesure au
    // premier repaint, une fois tout chargé, puis à chaque changement de largeur.
    window.requestAnimationFrame(ajuster);
    window.addEventListener("load", ajuster);
    let attente = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(attente);
      attente = window.setTimeout(ajuster, 150);
    });
  }

  function installGeneratedNavigation() {
    if (!document.body) return;
    const declaredHref = document.body.dataset.mathsgoParentHref;
    if (!declaredHref) return;
    if (document.querySelector("." + BACK_CLASS)) return;
    // Filet de sécurité : si la page contient déjà un lien vers la même destination,
    // on ne fabrique rien (on éviterait sinon deux boutons retour côte à côte).
    const already = siteUrl(declaredHref);
    for (const existing of document.querySelectorAll("a[href]")) {
      if (existing.href === already) return;
    }

    const label = document.body.dataset.mathsgoParentLabel || "la rubrique précédente";
    const href = siteUrl(declaredHref);
    ensureBackStyles();
    const link = buildBackLink(href, label);
    link.title = `Retour à ${label}`;
    link.setAttribute("aria-label", `Retour à ${label}`);

    const host = pickBackHost(document.body.dataset.mathsgoParentPlace);
    if (host && /^H[1-6]$/.test(host.tagName) && host.parentElement) {
      // Le repli « .wrap > :first-child » tombe parfois sur le titre de la page
      // (les deux Soroban, par exemple). Entrer dedans collerait le bouton au nom
      // de l'appli — « SorobanSoroban interactif » à la lecture d'écran — et
      // ferait doubler la hauteur du titre. On se pose juste au-dessus.
      link.dataset.mathsgoPlace = "inflow";
      poserEnRangee(link, host);
    } else if (host && host.parentElement) {
      host.insertBefore(link, host.firstChild);
    } else {
      // Aucune barre d'outils : on partage la ligne du premier titre de la page.
      // Poser le bouton juste au-dessus du titre marchait, mais ajoutait une ligne
      // entière — 44 px de vide en haut de chaque générateur. On enveloppe donc le
      // titre et le bouton dans une rangée, pour qu'ils tiennent côte à côte.
      const heading = pickHeading();
      link.dataset.mathsgoPlace = "inflow";
      if (heading && heading.parentElement && heading.parentElement !== document.body) {
        poserEnRangee(link, heading);
      } else {
        document.body.insertBefore(link, document.body.firstChild);
      }
    }
    applyContrast(link);
    makeHistoryAware(link);
  }

  function installDeclaredNavigation() {
    if (!document.body) return;
    const declaredHref = document.body.dataset.mathsgoParentHref;
    const declaredLink = document.body.dataset.mathsgoParentLink;
    if (!declaredHref) return;
    if (!declaredLink) return;

    const link = document.querySelector(declaredLink);
    if (!link) return;
    document.body.dataset.mathsgoParentWired = "declared";
    const label = document.body.dataset.mathsgoParentLabel || "la rubrique précédente";
    link.href = siteUrl(declaredHref);
    link.title = `Retour à ${label}`;
    link.setAttribute("aria-label", `Retour à ${label}`);
    makeHistoryAware(link);
  }

  function installNavigation() {
    installDeclaredNavigation();
    if (document.body && document.body.dataset.mathsgoParentWired === "declared") return;
    installGeneratedNavigation();
  }

  installMobileCompatibility();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installNavigation, { once: true });
  } else {
    installNavigation();
  }
})();
