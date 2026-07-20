(function () {
  "use strict";

  if (window.__mathsgoPrinterShellLoaded) return;
  window.__mathsgoPrinterShellLoaded = true;

  const scriptSource = document.currentScript?.src
    || new URL("/assets/js/printer-shell.js", window.location.href).href;
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

  const configurations = {
    "/outils/fractions/disque_maker.html": {
      family: "fraction-discs",
      title: "Disques de fractions",
      parentHref: "/outils/index.html?domain=nombres-calculs&notion=fractions",
      parentLabel: "Fractions",
      workspace: "main",
      settings: ".sidebar",
      preview: ".preview-area",
      page: ".page",
      print: "#print",
      summary: "#printSummary",
    },
    "/outils/fabrication_materiel/cartes_premiers_1_100.html": {
      family: "number-cards",
      title: "Cartes de nombres",
      parentHref: "/outils/index.html?domain=nombres-calculs&notion=divisibilite",
      parentLabel: "Divisibilité",
      settings: ".settings-panel",
      preview: "#preview-area",
      page: ".page-a4",
      generate: "#generate-button",
      print: "#print-button",
      summaryText() {
        const min = Number(document.querySelector("#range-min")?.value);
        const max = Number(document.querySelector("#range-max")?.value);
        const perPage = document.querySelector("#layout-select")?.value === "4x4" ? 16 : 9;
        const count = Number.isFinite(min) && Number.isFinite(max) && max >= min ? max - min + 1 : 0;
        const sidePages = count ? Math.ceil(count / perPage) : 0;
        return `A4 portrait · ${count || "—"} cartes · ${sidePages * 2 || "—"} pages (rectos puis versos)`;
      },
    },
    "/outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html": {
      family: "algebra-tiles",
      title: "Fiches de calcul littéral",
      parentHref: "/outils/index.html?domain=algebre&collection=tuiles-algebriques",
      parentLabel: "Tuiles algébriques",
      workspace: ".app",
      settings: ".controls",
      preview: ".preview-wrap",
      page: ".page",
      generate: "#generateBtn",
      print: "#printBtn",
      managesOwnScale: true,
      summaryText() {
        const format = document.querySelector("#format")?.value === "landscape" ? "A4 paysage" : "A4 portrait";
        const exercises = document.querySelector("#count")?.value || "—";
        const pages = Number(document.querySelector("#pages")?.value || 1);
        const printMode = document.querySelector("#printMode")?.value || "student";
        const totalPages = ["sequence", "duplex"].includes(printMode) ? pages * 2 : pages;
        const labels = { student: "fiche élève", answer: "corrigé", sequence: "sujet puis corrigé", duplex: "recto-verso" };
        return `${format} · ${exercises} exercices/page · ${totalPages} page${totalPages > 1 ? "s" : ""} · ${labels[printMode] || printMode}`;
      },
    },
    "/outils/automatismes/CM_Livret_A5.html": {
      family: "mental-math-booklet",
      title: "Livret A5 de calcul mental",
      parentHref: "/outils/automatismes/",
      parentLabel: "Automatismes",
      settings: ".topbar",
      preview: ".wrap",
      page: ".sheet",
      print: "#btnPrint",
      summaryText() {
        const sheets = document.querySelectorAll("#pages .sheet").length;
        const exercises = document.querySelector("#selN")?.value || "—";
        return `Livret A5 · ${exercises} fiches · ${sheets || "—"} feuilles A4 paysage · recto-verso bord court`;
      },
    },
  };

  const icon = {
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/></svg>',
    preview: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>',
    generate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
    print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/></svg>',
  };

  function createButton(action, label, iconMarkup, primary = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mg-printer-action${primary ? " is-primary" : ""}`;
    button.dataset.printerAction = action;
    button.innerHTML = `${iconMarkup}<span>${label}</span>`;
    return button;
  }

  function createWorkspace(config, settings, preview) {
    if (config.workspace) {
      const existing = document.querySelector(config.workspace);
      if (existing) return existing;
    }

    const workspace = document.createElement("main");
    workspace.className = "mg-printer-workspace";
    settings.parentNode.insertBefore(workspace, settings);
    workspace.append(settings, preview);
    return workspace;
  }

  function cleanLegacyLabels(config) {
    if (config.family === "fraction-discs") {
      const labels = ["Bases", "Recto", "Verso", "Calages"];
      document.querySelectorAll(".tabs-nav .tab-btn").forEach((button, index) => {
        if (labels[index]) button.textContent = labels[index];
      });
    }
  }

  function install() {
    const config = configurations[currentSitePathname()];
    if (!config || !document.body) return;

    const settings = document.querySelector(config.settings);
    const preview = document.querySelector(config.preview);
    const originalGenerate = config.generate ? document.querySelector(config.generate) : null;
    const originalPrint = document.querySelector(config.print);
    if (!settings || !preview || !originalPrint) return;

    cleanLegacyLabels(config);
    document.body.classList.add("mathsgo-printer-shell");
    document.body.dataset.mathsgoPrinterFamily = config.family;
    document.body.dataset.mathsgoPrinterView = "settings";
    settings.classList.add("mg-printer-settings");
    preview.classList.add("mg-printer-preview");
    originalPrint.dataset.mathsgoOriginalPrint = "";
    if (originalGenerate) originalGenerate.dataset.mathsgoOriginalGenerate = "";

    const workspace = createWorkspace(config, settings, preview);
    workspace.classList.add("mg-printer-workspace");

    const previewPane = document.createElement("section");
    previewPane.className = "mg-printer-preview-pane";
    previewPane.setAttribute("aria-label", "Aperçu avant impression");
    workspace.insertBefore(previewPane, preview);
    previewPane.appendChild(preview);

    let summary = config.summary ? document.querySelector(config.summary) : null;
    if (summary) {
      summary.classList.add("mg-printer-summary", "mg-printer-summary-existing");
    } else {
      summary = document.createElement("div");
      summary.className = "mg-printer-summary";
      summary.setAttribute("aria-live", "polite");
      previewPane.insertBefore(summary, preview);
    }

    const header = document.createElement("header");
    header.className = "mg-printer-header";
    header.innerHTML = `
      <a class="mg-printer-brand" href="${siteUrl("/outils/")}" aria-label="Ouvrir les outils maths&go">
        <img src="${siteUrl("/assets/img/mathsgo-logo-390.png")}" alt="maths&go">
      </a>
      <div class="mg-printer-heading">
        <a class="mg-printer-back" href="${siteUrl(config.parentHref)}">← ${config.parentLabel}</a>
        <h1>${config.title}</h1>
      </div>
      <div class="mg-printer-view-tabs" role="group" aria-label="Vue affichée">
        <button type="button" class="is-active" data-printer-view="settings">${icon.settings}<span>Réglages</span></button>
        <button type="button" data-printer-view="preview">${icon.preview}<span>Aperçu</span></button>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "mg-printer-actions";
    const previewAction = createButton("preview", "Aperçu", icon.preview);
    actions.appendChild(previewAction);
    if (originalGenerate) actions.appendChild(createButton("generate", "Générer", icon.generate, true));
    actions.appendChild(createButton("print", "Imprimer / PDF", icon.print, !originalGenerate));
    header.appendChild(actions);
    workspace.parentNode.insertBefore(header, workspace);

    const viewButtons = [...header.querySelectorAll("[data-printer-view]")];
    function setView(view, focus = false) {
      const nextView = view === "preview" ? "preview" : "settings";
      document.body.dataset.mathsgoPrinterView = nextView;
      viewButtons.forEach((button) => {
        const active = button.dataset.printerView === nextView;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      window.requestAnimationFrame(() => {
        fitPreviewPages();
        window.dispatchEvent(new Event("resize"));
        if (focus) (nextView === "preview" ? summary : settings).focus?.({ preventScroll: true });
      });
    }

    function updateSummary() {
      if (typeof config.summaryText === "function") summary.textContent = config.summaryText();
      const pageCount = preview.querySelectorAll(config.page).length;
      const printAction = actions.querySelector('[data-printer-action="print"]');
      if (printAction) {
        printAction.disabled = pageCount === 0;
        printAction.title = pageCount === 0 ? "Générez d’abord un aperçu" : "Ouvrir la boîte de dialogue d’impression";
      }
    }

    function fitPreviewPages() {
      if (config.managesOwnScale || window.matchMedia("print").matches) return;
      const availableWidth = Math.max(0, previewPane.clientWidth - 28);
      preview.querySelectorAll(config.page).forEach((page) => {
        page.dataset.mathsgoPrinterPage = "";
        page.style.removeProperty("zoom");
        const naturalWidth = page.offsetWidth;
        if (naturalWidth > 0 && availableWidth > 0) {
          page.style.zoom = String(Math.min(1, availableWidth / naturalWidth));
        }
      });
    }

    header.addEventListener("click", (event) => {
      const viewButton = event.target.closest("[data-printer-view]");
      if (viewButton) {
        setView(viewButton.dataset.printerView, true);
        return;
      }

      const action = event.target.closest("[data-printer-action]")?.dataset.printerAction;
      if (action === "preview") {
        if (window.matchMedia("(max-width: 760px)").matches) setView("preview", true);
        else previewPane.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      if (action === "generate" && originalGenerate) {
        originalGenerate.click();
        setView("preview", false);
      }
      if (action === "print") originalPrint.click();
    });

    settings.addEventListener("input", updateSummary);
    settings.addEventListener("change", () => {
      updateSummary();
      window.requestAnimationFrame(fitPreviewPages);
    });

    const observer = new MutationObserver(() => {
      updateSummary();
      window.requestAnimationFrame(fitPreviewPages);
    });
    observer.observe(preview, { childList: true, subtree: true });

    const resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => window.requestAnimationFrame(fitPreviewPages))
      : null;
    resizeObserver?.observe(previewPane);
    window.addEventListener("resize", () => window.requestAnimationFrame(fitPreviewPages));
    window.addEventListener("beforeprint", () => {
      preview.querySelectorAll(config.page).forEach((page) => page.style.removeProperty("zoom"));
    });
    window.addEventListener("afterprint", () => window.requestAnimationFrame(fitPreviewPages));

    summary.tabIndex = -1;
    settings.tabIndex = -1;
    updateSummary();
    window.requestAnimationFrame(fitPreviewPages);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
