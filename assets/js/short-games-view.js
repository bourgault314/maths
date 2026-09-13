/* Le catalogue et les liens directs partagent le même cadre de jeu. */
(function () {
  "use strict";
  const games = Object.freeze({
    luciole: "La Luciole",
    dodo: "Dodo bondissant",
    galets: "La pile de galets",
    tempo: "Tempo volcan",
    "carres-gloutons": "Les Carrés gloutons"
  });
  const cataloguePath = "/outils/?domain=jeux-recherches&notion=jeux-courts";
  function mount(container, game, onReturn) {
    if (!Object.hasOwn(games, game)) return () => {};
    const frame = document.createElement("iframe");
    frame.className = "short-game-frame";
    frame.title = games[game] + " — aire de jeu";
    if (game === "carres-gloutons") {
      frame.src = "/outils/club_maths/carres_gloutons.html?integre=1&v=1";
      frame.allowFullscreen = true;
    } else {
      frame.src = "/jeux-cadeaux/index.html?jeu=" + game + "&integre=1&v=5";
    }
    // La page de jeu ne voit pas la fenêtre du site : on lui donne sa hauteur
    // pour qu'elle dimensionne son plateau sans la deviner.
    function tell() {
      try { frame.contentWindow?.postMessage({ type: "mathsgo-short-game:fenetre", height: window.innerHeight }, location.origin); } catch { /* Cadre pas encore prêt. */ }
    }
    function receive(event) {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type === "mathsgo-short-game:return") onReturn();
      if (event.data?.type === "mathsgo-short-game:height" && Number.isFinite(event.data.height)) {
        frame.style.height = Math.max(250, Math.min(1400, event.data.height)) + "px";
        tell();
      }
    }
    window.addEventListener("message", receive);
    window.addEventListener("resize", tell);
    frame.addEventListener("load", tell);
    container.replaceChildren(frame);
    return () => {
      window.removeEventListener("message", receive);
      window.removeEventListener("resize", tell);
      frame.remove(); // Détruit aussi l’horloge et les commandes de la partie.
    };
  }
  window.MathsGoShortGames = Object.freeze({ games, mount, cataloguePath });
  const entry = document.querySelector("[data-short-game-entry]");
  if (entry) mount(entry, entry.dataset.shortGameEntry, () => location.assign(cataloguePath));
})();
