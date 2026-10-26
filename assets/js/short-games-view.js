/* Le catalogue et les liens directs partagent le même cadre de jeu. */
(function () {
  "use strict";
  const games = Object.freeze({
    luciole: "La Luciole",
    dodo: "Tec-tec bondissant",
    galets: "La pile de galets",
    cases: "Touche la case qui…",
    "carres-gloutons": "Les Carrés gloutons"
  });
  const cataloguePath = "/outils/?domain=jeux-recherches&notion=jeux-courts";
  function mount(container, game, onReturn) {
    if (!Object.hasOwn(games, game)) return () => {};
    const frame = document.createElement("iframe");
    frame.className = "short-game-frame";
    frame.title = games[game] + " — aire de jeu";
    if (game === "dodo") { frame.allowFullscreen = true; frame.classList.add("tec-tec-frame"); }
    if (game === "carres-gloutons") {
      frame.src = "/outils/club_maths/carres_gloutons.html?integre=1&v=1";
      frame.allowFullscreen = true;
    } else if (game === "galets") {
      frame.src = "/jeux-cadeaux/galets-riviere/index.html?integre=1&v=1";
    } else if (game === "dodo") {
      frame.src = "/jeux-cadeaux/tec-tec/index.html?integre=1&v=6";
    } else {
      frame.src = "/jeux-cadeaux/index.html?jeu=" + game + "&integre=1&v=9";
    }
    // La page de jeu ne voit ni la fenêtre du site, ni ce qui l'entoure. On lui
    // donne les deux : la hauteur de la fenêtre, et la place qui lui reste
    // vraiment une fois l'en-tête, le titre et le pied de page déduits.
    function autourDuCadre() {
      const cadre = frame.getBoundingClientRect();
      // Au-dessus : en-tête, fil d'Ariane, titre de la page.
      let autour = cadre.top + window.scrollY;
      // En dessous : ce qui reste sous le cadre dans chaque bloc qui le contient
      // (marges, puis le pied de page). On s'arrête avant <body>, dont la hauteur
      // minimale est celle de la fenêtre et ne mesurerait donc plus rien.
      for (let bloc = frame; bloc.parentElement && bloc.parentElement !== document.body; bloc = bloc.parentElement) {
        autour += Math.max(0, bloc.parentElement.getBoundingClientRect().bottom - bloc.getBoundingClientRect().bottom);
      }
      return autour;
    }
    let expanded = false, savedFrameStyle = "", savedOverflow = "";
    function expand(value) {
      if (game !== "dodo") return;
      if (value === expanded) { frame.contentWindow?.postMessage({ type: "mathsgo-short-game:expanded", expanded }, location.origin); return; }
      if (value) {
        savedFrameStyle = frame.style.cssText; savedOverflow = document.body.style.overflow;
        frame.style.cssText = "position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;min-height:0;z-index:2147483647;border:0;background:#edf0df";
        document.body.style.overflow = "hidden";
      } else { frame.style.cssText = savedFrameStyle; document.body.style.overflow = savedOverflow; }
      expanded = value;
      frame.contentWindow?.postMessage({ type: "mathsgo-short-game:expanded", expanded }, location.origin);
      if (!expanded) tell();
    }
    function tell() {
      const dispo = Math.max(260, window.innerHeight - autourDuCadre());
      try { frame.contentWindow?.postMessage({ type: "mathsgo-short-game:fenetre", height: window.innerHeight, dispo }, location.origin); } catch { /* Cadre pas encore prêt. */ }
    }
    function receive(event) {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type === "mathsgo-short-game:expand" && typeof event.data.expanded === "boolean") expand(event.data.expanded);
      if (event.data?.type === "mathsgo-short-game:return") onReturn();
      if (!expanded && event.data?.type === "mathsgo-short-game:height" && Number.isFinite(event.data.height)) {
        frame.style.height = Math.max(250, Math.min(1400, event.data.height)) + "px";
        tell();
      }
    }
    window.addEventListener("message", receive);
    window.addEventListener("resize", tell);
    frame.addEventListener("load", tell);
    container.replaceChildren(frame);
    return () => {
      if (expanded) expand(false);
      window.removeEventListener("message", receive);
      window.removeEventListener("resize", tell);
      frame.remove(); // Détruit aussi l’horloge et les commandes de la partie.
    };
  }
  window.MathsGoShortGames = Object.freeze({ games, mount, cataloguePath });
  const entry = document.querySelector("[data-short-game-entry]");
  if (entry) mount(entry, entry.dataset.shortGameEntry, () => location.assign(cataloguePath));
})();
