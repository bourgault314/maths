/* Le jeu existant garde ses règles ; seul son cadre change dans le catalogue. */
(function () {
  "use strict";
  if (new URLSearchParams(location.search).get("integre") !== "1" || window.parent === window) return;
  document.documentElement.classList.add("carres-integres");
  document.addEventListener("DOMContentLoaded", () => {
    const shell = document.querySelector(".shell");
    const overlay = document.getElementById("intro-overlay");
    const intro = overlay.querySelector(".intro");
    const returnLink = document.querySelector(".result-actions a");
    returnLink.href = "/outils/?domain=jeux-recherches&notion=jeux-courts";
    returnLink.addEventListener("click", event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      window.parent.postMessage({ type: "mathsgo-short-game:return" }, location.origin);
    });
    let pending = 0, lastHeight = 0;
    function reportHeight() {
      pending = 0;
      if (document.fullscreenElement || document.webkitFullscreenElement || document.documentElement.classList.contains("fullscreen-fallback")) return;
      let height = Math.ceil(shell.getBoundingClientRect().height);
      if (!overlay.hidden) height = Math.max(height, intro.scrollHeight + 24);
      if (height === lastHeight) return;
      lastHeight = height;
      window.parent.postMessage({ type: "mathsgo-short-game:height", height }, location.origin);
    }
    function scheduleHeight() {
      if (!pending) pending = requestAnimationFrame(reportHeight);
    }
    const resize = new ResizeObserver(scheduleHeight);
    resize.observe(shell);
    resize.observe(intro);
    const visibility = new MutationObserver(scheduleHeight);
    visibility.observe(overlay, { attributes: true, attributeFilter: ["hidden"] });
    visibility.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("fullscreenchange", scheduleHeight);
    document.addEventListener("webkitfullscreenchange", scheduleHeight);
    window.addEventListener("pagehide", () => {
      resize.disconnect();
      visibility.disconnect();
      cancelAnimationFrame(pending);
    }, { once: true });
    scheduleHeight();
  }, { once: true });
})();
