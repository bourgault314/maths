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
  function pickBackHost(requested) {
    if (requested && requested !== "auto") {
      const forced = document.querySelector(requested);
      if (forced) return forced;
    }
    return document.querySelector(".toolbar, header, .topbar, .app-header, .wrap > :first-child, .panel") || null;
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
      host.parentElement.insertBefore(link, host);
    } else if (host && host.parentElement) {
      host.insertBefore(link, host.firstChild);
    } else {
      link.dataset.mathsgoPlace = "inflow";
      document.body.insertBefore(link, document.body.firstChild);
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
