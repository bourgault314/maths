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
    normaliseViewport();
    if (!/^\/outils\/bouliers\/rekenrek\//.test(currentSitePathname())) return;

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

  function normalisePath(value) {
    return String(value || "").replace(/\/index\.html$/, "/");
  }

  function findParent(pathname) {
    const routes = [
      [/^\/auto\//, "/outils/automatismes/", "Automatismes"],
      [/^\/outils\/labo-des-regularites\.html$/, "/outils/index.html?domain=algebre&notion=patterns", "Motifs et régularités"],
      [/^\/outils\/plateaux_manipulation\/le_grand_pari\.html$/, "/outils/index.html?domain=jeux-recherches&notion=explorations", "Explorations"],
      [/^\/outils\/club_maths\/(?:jeu_du_chaos|tables_modulaires)\.html$/, "/outils/index.html?domain=jeux-recherches&notion=explorations", "Explorations"],
      [/^\/outils\/club_maths\/(?:jeu_de_nim|yavalath)\.html$/, "/outils/index.html?domain=jeux-recherches&notion=strategie", "Stratégie"],
      [/^\/outils\/fabrication_materiel\/(?:cartes_premiers_1_100|grille_de_nombres)\.html$/, "/outils/index.html?domain=nombres-calculs&notion=divisibilite", "Divisibilité"],
      [/^\/outils\/fabrication_materiel\/numeration_decimale_maker\.html$/, "/outils/index.html?domain=nombres-calculs&notion=numeration", "Numération"],
      [/^\/outils\/bouliers\/rekenrek\//, "/outils/bouliers/rekenrek/", "Rekenrek"],
      [/^\/outils\/bouliers\/boulier_montessori\//, "/outils/bouliers/boulier_montessori/", "Boulier Montessori"],
      [/^\/outils\/bouliers\/abaque_de_gerbert\//, "/outils/bouliers/abaque_de_gerbert/", "Abaque de Gerbert"],
      [/^\/outils\/bouliers\/soroban\//, "/outils/bouliers/soroban/", "Soroban"],
      [/^\/outils\/bouliers\//, "/outils/bouliers/", "Bouliers et abaques"],
      [/^\/outils\/fractions\//, "/outils/index.html?domain=nombres-calculs&notion=fractions", "Fractions"],
      [/^\/outils\/conversions\//, "/outils/conversions/", "Conversions"],
      [/^\/outils\/engrenages\//, "/outils/engrenages/", "Engrenages"],
      [/^\/outils\/angles\//, "/outils/angles/", "Angles"],
      [/^\/outils\/tuiles_algebriques\//, "/outils/index.html?domain=algebre&collection=tuiles-algebriques", "Tuiles algébriques"],
      [/^\/outils\/nombres_relatifs\//, "/outils/nombres_relatifs/", "Nombres relatifs"],
      [/^\/outils\/plateaux_manipulation\//, "/outils/plateaux_manipulation/", "Plateaux de manipulation"],
      [/^\/outils\/club_maths\//, "/outils/club_maths/", "Club Maths"],
      [/^\/outils\/fabrication_materiel\//, "/outils/fabrication_materiel/", "Fabrication de matériel"],
      [/^\/outils\/equabarre\.html$/, "/outils/index.html?domain=nombres-calculs&notion=schemas-barres", "Schémas en barres"],
      [/^\/outils\/(?:equasplat|splat|splat_equations|splat_tache_barre)\.html$/, "/outils/index.html?domain=algebre&collection=splat", "Splat"],
      [/^\/outils\/(?:fractions_multiples_exerciseur|pourcentages_exerciceur)\.html$/, "/outils/", "Outils"],
      [/^\/outils\/(?:problemes_barres|pythabarre)\.html$/, "/outils/", "Outils"],
      [/^\/outils\//, "/outils/", "Outils"],
    ];
    const match = routes.find(([pattern]) => pattern.test(pathname));
    return match ? { href: match[1], label: match[2] } : null;
  }

  function alreadyHasParentNavigation(parent) {
    const current = normalisePath(currentSitePathname());
    return [...document.querySelectorAll("a[href]")].some((anchor) => {
      const label = [anchor.textContent, anchor.title, anchor.getAttribute("aria-label")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!/(retour|revenir|accueil|menu|sommaire|index|←|🏠|⌂)/i.test(label)) return false;
      try {
        const destination = new URL(anchor.href, window.location.href);
        return destination.origin === siteBaseUrl.origin
          && normalisePath(`/${destination.pathname.slice(siteBaseUrl.pathname.length).replace(/^\/+/, "")}`) !== current;
      } catch (_) {
        return false;
      }
    }) || [...document.querySelectorAll("a[href]")].some((anchor) => {
      try {
        const destination = new URL(anchor.href, window.location.href);
        return destination.origin === siteBaseUrl.origin
          && normalisePath(`/${destination.pathname.slice(siteBaseUrl.pathname.length).replace(/^\/+/, "")}`) === normalisePath(parent.href);
      } catch (_) {
        return false;
      }
    });
  }

  function install() {
    if (!document.body || document.querySelector("[data-mathsgo-parent-navigation]")) return;
    const declaredHref = document.body.dataset.mathsgoParentHref;
    const parent = declaredHref
      ? { href: declaredHref, label: document.body.dataset.mathsgoParentLabel || "la rubrique précédente" }
      : findParent(currentSitePathname());
    if (!parent || normalisePath(currentSitePathname()) === normalisePath(parent.href)) return;

    const declaredLink = document.body.dataset.mathsgoParentLink;
    if (declaredLink) {
      const link = document.querySelector(declaredLink);
      if (link) {
        link.href = siteUrl(parent.href);
        link.title = `Retour à ${parent.label}`;
        link.setAttribute("aria-label", `Retour à ${parent.label}`);
        return;
      }
    }

    if (alreadyHasParentNavigation(parent)) return;

    const style = document.createElement("style");
    style.dataset.mathsgoParentNavigation = "";
    style.textContent = `
      .mathsgo-parent-navigation {
        position: fixed;
        z-index: 2147483000;
        top: 50%;
        left: 0;
        width: 44px;
        height: 52px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        border: 1px solid rgba(15, 108, 249, .28);
        border-left: 0;
        border-radius: 0 14px 14px 0;
        background: rgba(255, 255, 255, .92);
        color: #0b5fc0;
        box-shadow: 0 4px 16px rgba(15, 23, 42, .16);
        font: 900 25px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
        text-decoration: none;
        transform: translateY(-50%);
        opacity: .86;
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        touch-action: manipulation;
      }
      .mathsgo-parent-navigation:hover,
      .mathsgo-parent-navigation:focus-visible {
        opacity: 1;
        color: #084f9e;
        background: #fff;
        outline: 3px solid rgba(245, 139, 31, .5);
        outline-offset: 2px;
      }
      @media (max-width: 520px) {
        .mathsgo-parent-navigation { width: 44px; height: 48px; border-radius: 0 12px 12px 0; }
      }
      @media print { .mathsgo-parent-navigation { display: none !important; } }
    `;

    const link = document.createElement("a");
    link.className = "mathsgo-parent-navigation";
    link.dataset.mathsgoParentNavigation = "";
    link.href = siteUrl(parent.href);
    link.textContent = "←";
    link.title = `Retour à ${parent.label}`;
    link.setAttribute("aria-label", `Retour à ${parent.label}`);

    document.head.appendChild(style);
    document.body.appendChild(link);
  }

  installMobileCompatibility();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
