/* Le catalogue et les liens directs partagent le même cadre de jeu. */
(function () {
  "use strict";
  const games = Object.freeze({
    luciole: "La Luciole",
    dodo: "Dodo bondissant",
    galets: "La pile de galets",
    tempo: "Tempo volcan"
  });
  const cataloguePath = "/outils/?domain=jeux-recherches&notion=jeux-courts";
  function mount(container, game, onReturn) {
    if (!Object.hasOwn(games, game)) return () => {};
    const frame = document.createElement("iframe");
    frame.className = "short-game-frame";
    frame.title = games[game] + " — aire de jeu";
    frame.src = "/jeux-cadeaux/index.html?jeu=" + game + "&integre=1&v=2";
    function receive(event) {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type === "mathsgo-short-game:return") onReturn();
      if (event.data?.type === "mathsgo-short-game:height" && Number.isFinite(event.data.height)) {
        frame.style.height = Math.max(250, Math.min(1400, event.data.height)) + "px";
      }
    }
    window.addEventListener("message", receive);
    container.replaceChildren(frame);
    return () => {
      window.removeEventListener("message", receive);
      frame.remove(); // Détruit aussi l’horloge et les commandes de la partie.
    };
  }
  window.MathsGoShortGames = Object.freeze({ games, mount, cataloguePath });
  const entry = document.querySelector("[data-short-game-entry]");
  if (entry) mount(entry, entry.dataset.shortGameEntry, () => location.assign(cataloguePath));
})();
