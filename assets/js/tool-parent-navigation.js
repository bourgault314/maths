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

  function installDeclaredNavigation() {
    if (!document.body) return;
    const declaredHref = document.body.dataset.mathsgoParentHref;
    const declaredLink = document.body.dataset.mathsgoParentLink;
    if (!declaredHref || !declaredLink) return;

    const link = document.querySelector(declaredLink);
    if (!link) return;
    const label = document.body.dataset.mathsgoParentLabel || "la rubrique précédente";
    link.href = siteUrl(declaredHref);
    link.title = `Retour à ${label}`;
    link.setAttribute("aria-label", `Retour à ${label}`);
    makeHistoryAware(link);
  }

  installMobileCompatibility();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installDeclaredNavigation, { once: true });
  } else {
    installDeclaredNavigation();
  }
})();
