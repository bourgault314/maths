(function () {
  "use strict";

  if (window.__mathsgoParentNavigationLoaded) return;
  window.__mathsgoParentNavigationLoaded = true;

  function normalisePath(value) {
    return String(value || "").replace(/\/index\.html$/, "/");
  }

  function findParent(pathname) {
    const routes = [
      [/^\/auto\//, "/outils/automatismes/", "Automatismes"],
      [/^\/outils\/bouliers\/rekenrek\//, "/outils/bouliers/rekenrek/", "Rekenrek"],
      [/^\/outils\/bouliers\/boulier_montessori\//, "/outils/bouliers/boulier_montessori/", "Boulier Montessori"],
      [/^\/outils\/bouliers\/abaque_de_gerbert\//, "/outils/bouliers/abaque_de_gerbert/", "Abaque de Gerbert"],
      [/^\/outils\/bouliers\/soroban\//, "/outils/bouliers/soroban/", "Soroban"],
      [/^\/outils\/bouliers\//, "/outils/bouliers/", "Bouliers et abaques"],
      [/^\/outils\/fractions\//, "/outils/fractions/index_fractions.html", "Fractions"],
      [/^\/outils\/conversions\//, "/outils/conversions/", "Conversions"],
      [/^\/outils\/engrenages\//, "/outils/engrenages/", "Engrenages"],
      [/^\/outils\/angles\//, "/outils/angles/", "Angles"],
      [/^\/outils\/tuiles_algebriques\//, "/outils/tuiles_algebriques/", "Tuiles algébriques"],
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
    const current = normalisePath(window.location.pathname);
    return [...document.querySelectorAll("a[href]")].some((anchor) => {
      const label = [anchor.textContent, anchor.title, anchor.getAttribute("aria-label")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!/(retour|revenir|accueil|menu|sommaire|index|←|🏠|⌂)/i.test(label)) return false;
      try {
        const destination = new URL(anchor.href, window.location.href);
        return destination.origin === window.location.origin
          && normalisePath(destination.pathname) !== current;
      } catch (_) {
        return false;
      }
    }) || [...document.querySelectorAll("a[href]")].some((anchor) => {
      try {
        const destination = new URL(anchor.href, window.location.href);
        return destination.origin === window.location.origin
          && normalisePath(destination.pathname) === normalisePath(parent.href);
      } catch (_) {
        return false;
      }
    });
  }

  function install() {
    if (!document.body || document.querySelector("[data-mathsgo-parent-navigation]")) return;
    const parent = findParent(window.location.pathname);
    if (!parent || normalisePath(window.location.pathname) === normalisePath(parent.href)) return;
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
        .mathsgo-parent-navigation { width: 42px; height: 48px; border-radius: 0 12px 12px 0; }
      }
      @media print { .mathsgo-parent-navigation { display: none !important; } }
    `;

    const link = document.createElement("a");
    link.className = "mathsgo-parent-navigation";
    link.dataset.mathsgoParentNavigation = "";
    link.href = parent.href;
    link.textContent = "←";
    link.title = `Retour à ${parent.label}`;
    link.setAttribute("aria-label", `Retour à ${parent.label}`);

    document.head.appendChild(style);
    document.body.appendChild(link);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
