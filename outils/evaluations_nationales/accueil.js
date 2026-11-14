/* maths&go — Évaluations nationales : l'accueil de l'appli (lot EN-A1). On choisit sa classe, puis son test.
   Rien ne sort de l'appareil : la classe choisie et le dernier résultat de chaque test restent dans le navigateur. */
(function () {
  "use strict";
  const NIVEAUX = ["6e", "5e", "4e", "3e"];
  const CLE_NIVEAU = "mathsgo-en-niveau";
  const lire = (cle) => { try { return localStorage.getItem(cle); } catch (e) { return null; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, v); } catch (e) { /* stockage indisponible : tant pis */ } };
  // Couleur du dernier résultat : celle du groupe officiel (comme le bilan) ; gris s'il n'y a pas de repères.
  const RANG = { "À besoins": "g0", "Fragile": "g1", "Satisfaisant": "g2" };

  function choisir(niveau, retenir) {
    for (const n of NIVEAUX) {
      const actif = n === niveau;
      document.getElementById("onglet-" + n).setAttribute("aria-selected", String(actif));
      document.getElementById("onglet-" + n).tabIndex = actif ? 0 : -1;
      document.getElementById("liste-" + n).classList.toggle("cachee", !actif);
      document.getElementById("liste-" + n).setAttribute("aria-hidden", String(!actif));
    }
    if (retenir) ecrire(CLE_NIVEAU, niveau);
  }

  // Le dernier résultat de chaque test (celui que garde l'appli d'évaluation, clé mathsgo-en-<sujet>).
  document.querySelectorAll(".test[data-sujet]").forEach((carte) => {
    let d = null;
    try { d = JSON.parse(lire("mathsgo-en-" + carte.dataset.sujet) || "null"); } catch (e) { d = null; }
    const pastille = carte.querySelector(".der");
    if (!d || !Number.isFinite(d.score) || !Number.isFinite(d.total)) return;
    pastille.textContent = `${d.score} / ${d.total}`;
    pastille.className = "der " + (RANG[d.groupe] || "");
    pastille.hidden = false;
    carte.setAttribute("aria-label", `${carte.querySelector("strong").textContent}, ${carte.querySelector(".nb").textContent} — ton dernier résultat : ${d.score} sur ${d.total}${d.groupe ? ", " + d.groupe : ""}`);
  });

  const onglets = NIVEAUX.map((n) => document.getElementById("onglet-" + n));
  onglets.forEach((b, k) => {
    b.addEventListener("click", () => choisir(b.dataset.niveau, true));
    // Clavier : flèches gauche et droite d'un onglet à l'autre.
    b.addEventListener("keydown", (e) => {
      const pas = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!pas) return;
      e.preventDefault();
      const suivant = onglets[(k + pas + onglets.length) % onglets.length];
      choisir(suivant.dataset.niveau, true);
      suivant.focus();
    });
  });

  // ?niveau=4e (le retour depuis un test, un lien donné par le professeur), sinon la classe retenue, sinon la 6e.
  const demande = new URLSearchParams(location.search).get("niveau");
  const retenu = lire(CLE_NIVEAU);
  if (NIVEAUX.includes(demande)) choisir(demande, true);
  else choisir(NIVEAUX.includes(retenu) ? retenu : "6e", false);
})();
