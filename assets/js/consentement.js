(function () {
  "use strict";

  const SCRIPT_ELEMENT = document.currentScript;
  const PRIVACY_URL = SCRIPT_ELEMENT && SCRIPT_ELEMENT.src
    ? new URL("../../confidentialite.html", SCRIPT_ELEMENT.src).href
    : "/confidentialite.html";
  const STORAGE_KEY = "mathsgo:consentement:v1";
  const CONSENT_VERSION = 1;
  const CHOICE_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
  const MEASUREMENT_ID = "G-X8TVC83222";
  const ANALYTICS_PAGE_LOCATION = SCRIPT_ELEMENT && SCRIPT_ELEMENT.dataset
    ? SCRIPT_ELEMENT.dataset.analyticsPageLocation || ""
    : "";
  const VALID_CHOICES = new Set(["granted", "denied"]);
  const IS_TRACKABLE_ORIGIN =
    window.location.protocol === "https:" &&
    (window.location.hostname === "mathsgo.re" || window.location.hostname.endsWith(".mathsgo.re"));
  const IS_PREVIEW = new URLSearchParams(window.location.search).has("apercu-cookies");

  let choice = readChoice();
  let analyticsLoaded = false;
  let banner = null;
  let manageSlot = null;
  let manageButton = null;
  let isSettingsView = false;

  function readChoice() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (
        !stored ||
        stored.version !== CONSENT_VERSION ||
        !VALID_CHOICES.has(stored.value) ||
        typeof stored.updatedAt !== "number" ||
        Date.now() - stored.updatedAt > CHOICE_LIFETIME_MS
      ) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return stored.value;
    } catch (_error) {
      return null;
    }
  }

  function saveChoice(value) {
    choice = value;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          value,
          version: CONSENT_VERSION,
          updatedAt: Date.now()
        })
      );
    } catch (_error) {
      // Le choix reste valable pour la page même si le stockage est indisponible.
    }
  }

  function initialiseConsentMode() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500
    });
  }

  function loadAnalytics() {
    if (!IS_TRACKABLE_ORIGIN || analyticsLoaded || choice !== "granted") return;

    analyticsLoaded = true;
    window.gtag("consent", "update", {
      analytics_storage: "granted"
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(MEASUREMENT_ID);
    script.dataset.mathsgoAnalytics = "true";
    document.head.appendChild(script);

    window.gtag("js", new Date());
    const analyticsConfig = {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      cookie_expires: 180 * 24 * 60 * 60,
      cookie_flags: "SameSite=Lax;Secure"
    };
    if (ANALYTICS_PAGE_LOCATION) analyticsConfig.page_location = ANALYTICS_PAGE_LOCATION;
    window.gtag("config", MEASUREMENT_ID, analyticsConfig);
  }

  function deleteAnalyticsCookies() {
    const names = document.cookie
      .split(";")
      .map(function (item) { return item.split("=")[0].trim(); })
      .filter(function (name) { return name === "_ga" || name.indexOf("_ga_") === 0; });

    names.forEach(function (name) {
      document.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax";
      document.cookie = name + "=; Max-Age=0; Path=/; Domain=" + window.location.hostname + "; SameSite=Lax";
      if (window.location.hostname.endsWith("mathsgo.re")) {
        document.cookie = name + "=; Max-Age=0; Path=/; Domain=.mathsgo.re; SameSite=Lax";
      }
    });
  }

  function setChoice(value) {
    saveChoice(value);

    if (value === "granted") {
      loadAnalytics();
    } else {
      window.gtag("consent", "update", {
        analytics_storage: "denied"
      });
      deleteAnalyticsCookies();
    }

    hideBanner();
    updateManageButton();
    document.dispatchEvent(new CustomEvent("mathsgo:consentement", {
      detail: { analytics: value }
    }));
  }

  function createInterface() {
    if (banner) return;

    banner = document.createElement("section");
    banner.className = "mg-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Choix des statistiques de fréquentation");
    banner.hidden = true;
    banner.innerHTML = [
      '<div class="mg-consent__inner">',
      '  <div class="mg-consent__text">',
      '    <strong class="mg-consent__title">Des statistiques, seulement avec votre accord.</strong>',
      '    <span class="mg-consent__description">maths&amp;go utilise Google Analytics pour comprendre quelles pages sont utiles. Aucun outil public n\'a besoin de ces statistiques pour fonctionner. <a class="mg-consent__privacy" href="' + PRIVACY_URL + '">En savoir plus</a>.</span>',
      '    <span class="mg-consent__status" aria-live="polite"></span>',
      '  </div>',
      '  <div class="mg-consent__actions">',
      '    <button type="button" class="mg-consent__button mg-consent__button--quiet" data-consent-action="deny">Refuser les statistiques</button>',
      '    <button type="button" class="mg-consent__button mg-consent__button--accept" data-consent-action="accept">Autoriser les statistiques</button>',
      '    <button type="button" class="mg-consent__close" data-consent-action="close" aria-label="Fermer les réglages">Fermer</button>',
      '  </div>',
      '</div>'
    ].join("");

    manageSlot = document.createElement("div");
    manageSlot.className = "mg-consent-manage-slot";
    manageSlot.hidden = true;

    const bodyStyle = window.getComputedStyle(document.body);
    const rootStyle = window.getComputedStyle(document.documentElement);
    const viewportLocked = [bodyStyle.overflow, bodyStyle.overflowY, rootStyle.overflow, rootStyle.overflowY]
      .some(function (value) { return value === "hidden" || value === "clip"; });
    const horizontalFlexLayout = ["flex", "inline-flex"].indexOf(bodyStyle.display) !== -1
      && (bodyStyle.flexDirection === "row" || bodyStyle.flexDirection === "row-reverse");
    manageSlot.classList.toggle("mg-consent-manage-slot--fixed", viewportLocked || horizontalFlexLayout);

    manageButton = document.createElement("button");
    manageButton.type = "button";
    manageButton.className = "mg-consent-manage";
    manageButton.textContent = "Gérer mes cookies";
    manageButton.setAttribute("aria-label", "Gérer mes choix de cookies");
    manageButton.hidden = true;

    banner.addEventListener("click", function (event) {
      const action = event.target.closest("[data-consent-action]");
      if (!action) return;

      if (action.dataset.consentAction === "accept") setChoice("granted");
      if (action.dataset.consentAction === "deny") setChoice("denied");
      if (action.dataset.consentAction === "close") hideBanner();
    });

    manageButton.addEventListener("click", function () {
      showBanner(true);
    });

    manageSlot.appendChild(manageButton);
    document.body.appendChild(banner);
    document.body.appendChild(manageSlot);
  }

  function showBanner(settingsView) {
    createInterface();
    isSettingsView = Boolean(settingsView);

    const status = banner.querySelector(".mg-consent__status");
    const closeButton = banner.querySelector(".mg-consent__close");

    if (isSettingsView && choice) {
      status.textContent = choice === "granted"
        ? "Les statistiques sont actuellement autorisées."
        : "Les statistiques sont actuellement refusées.";
    } else {
      status.textContent = "";
    }

    closeButton.hidden = !isSettingsView;
    banner.hidden = false;
    manageButton.hidden = true;
    manageSlot.hidden = true;

    window.requestAnimationFrame(function () {
      banner.classList.add("mg-consent--visible");
      const firstButton = banner.querySelector(".mg-consent__button--quiet");
      if (isSettingsView && firstButton) firstButton.focus({ preventScroll: true });
    });
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove("mg-consent--visible");
    window.setTimeout(function () {
      if (!banner.classList.contains("mg-consent--visible")) {
        banner.hidden = true;
        updateManageButton();
      }
    }, 180);
    updateManageButton();
  }

  function updateManageButton() {
    if (!manageButton) return;
    const directControl = document.querySelector("[data-mathsgo-consent-open]");
    const hidden = !choice || Boolean(directControl) || (banner && !banner.hidden);
    manageButton.hidden = hidden;
    manageSlot.hidden = hidden;
    manageButton.dataset.consentState = choice || "unset";
  }

  function start() {
    initialiseConsentMode();

    if (!IS_TRACKABLE_ORIGIN && !IS_PREVIEW) {
      window.mathsgoConsentement = Object.freeze({
        ouvrir: function () { showBanner(true); },
        accepter: function () { setChoice("granted"); },
        refuser: function () { setChoice("denied"); },
        etat: function () { return choice; }
      });
      return;
    }

    createInterface();

    if (navigator.globalPrivacyControl === true && !choice) {
      saveChoice("denied");
    }

    if (choice === "granted") loadAnalytics();
    if (!choice) showBanner(false);
    updateManageButton();

    window.mathsgoConsentement = Object.freeze({
      ouvrir: function () { showBanner(true); },
      accepter: function () { setChoice("granted"); },
      refuser: function () { setChoice("denied"); },
      etat: function () { return choice; }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
