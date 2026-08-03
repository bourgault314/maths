export function echapper(valeur) {
  return String(valeur)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function rendreEtape(numero, titre, classe = "") {
  return `<div class="repere-etape ${classe}">
    <span aria-hidden="true">${numero}</span>
    <h3>${echapper(titre)}</h3>
  </div>`;
}

export function rendreEntetePanneau({
  idTitre,
  titre,
  actionFermer,
  surtitre = "",
}) {
  const libellesFermeture = {
    "fermer-aide": "Fermer l'aide",
    "fermer-correction": "Fermer la correction",
    "fermer-cours": "Fermer le cours",
  };
  const libelleFermeture = libellesFermeture[actionFermer] ?? `Fermer ${titre}`;
  return `<div class="entete-panneau">
    <div>
      ${surtitre ? `<p class="surtitre">${echapper(surtitre)}</p>` : ""}
      <h2 id="${echapper(idTitre)}">${echapper(titre)}</h2>
    </div>
    <button class="fermer" data-action="${echapper(actionFermer)}"
      aria-label="${echapper(libelleFermeture)}">×</button>
  </div>`;
}

export function rendreVoile(actionFermer) {
  return `<div class="voile" data-action="${echapper(actionFermer)}" aria-hidden="true"></div>`;
}
