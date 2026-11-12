/* Les PDF restent les originaux à taille réelle ; seul le choix du lien change. */
(() => {
  "use strict";
  document.querySelectorAll("[data-paper-card]").forEach((card) => {
    const select = card.querySelector("select[data-paper-select]");
    if (!select) return;
    const preview = card.querySelector("[data-paper-preview]");
    const description = card.querySelector("[data-paper-description]");
    const links = card.querySelectorAll("[data-paper-link]");
    function update() {
      const option = select.options[select.selectedIndex];
      if (!option) return;
      preview.src = option.dataset.preview;
      preview.alt = option.dataset.label;
      description.textContent = option.dataset.description;
      links.forEach((link) => {
        link.href = option.value;
        link.setAttribute("aria-label", `${link.dataset.paperLink} : ${option.dataset.label} (PDF)`);
      });
    }
    select.addEventListener("change", update);
    // Le navigateur peut restaurer un choix lors d'un retour sur cette page.
    window.addEventListener("pageshow", update);
    update();
    card.querySelector("[data-paper-options]").hidden = false;
  });
})();
