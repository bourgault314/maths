<?php
// Séance en direct, écran de l'ÉLÈVE — lot 1 « question éclair » (07/10/2026).
// L'élève y arrive depuis son espace (index.php), avec le code que l'onglet
// retient déjà : rien à retaper, et jamais de code dans une adresse. La page
// interroge api/direct.php en boucle et ne montre que trois choses : attendre,
// répondre, regarder le tableau. Ni la répartition ni la bonne réponse
// n'arrivent ici : elles se découvrent au tableau.
require_once __DIR__ . '/lib/entetes.php';
header('Content-Type: text/html; charset=utf-8');
$nonce = entetes_page();
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<title>Séance en direct | maths&amp;go</title>
<style>
  :root {
    --blue: #063f86; --blue-dark: #052f67; --teal: #08aaa5; --orange: #f58220;
    --ink: #10294a; --muted: #5c6c82; --paper: #fff; --line: #d9e2ec; --page: #f6f8fb;
    --brand-gradient: linear-gradient(90deg, #08aaa5 0%, #0b67b2 44%, #f58220 72%, #f9bf3b 100%);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column;
    background: var(--page); color: var(--ink);
    font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .barre { height: 5px; background: var(--brand-gradient); }
  header { padding: 10px 16px; background: var(--paper); border-bottom: 1px solid var(--line);
           display: flex; align-items: center; gap: 10px; }
  header img { display: block; height: 34px; width: auto; }
  header a { margin-left: auto; display: inline-flex; align-items: center; min-height: 44px; padding: 0 14px;
             color: var(--muted); border: 1px solid var(--line); border-radius: 10px;
             font-size: .92rem; font-weight: 600; text-decoration: none; }
  header a:hover { color: var(--blue); border-color: var(--blue); background: #fff; }
  main { flex: 1; width: 100%; max-width: 560px; margin: 0 auto; padding: 18px 16px 22px;
         display: flex; flex-direction: column; justify-content: center; }
  .carte { background: var(--paper); border: 1px solid var(--line); border-radius: 16px;
           padding: 22px 18px 20px; box-shadow: 0 10px 26px rgba(22,47,82,.07); text-align: center; }
  h1 { margin: 0 0 4px; font-family: Georgia, "Times New Roman", serif;
       font-size: clamp(1.5rem, 6vw, 2rem); line-height: 1.15; color: var(--blue-dark); }
  .consigne { margin: 0; color: var(--muted); font-size: 1.05rem; }
  /* Les réponses : de grosses touches, deux par ligne. Une touche choisie se
     remplit et porte une coche — la couleur seule ne suffit pas. */
  .choix { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0 14px; }
  .choix button {
    position: relative; min-height: clamp(84px, 17vh, 132px); padding: 0; font-family: inherit;
    font-size: clamp(2.2rem, 9vw, 3.2rem); font-weight: 800; line-height: 1;
    color: var(--blue-dark); background: #fff; border: 3px solid #b8c7da; border-radius: 16px;
    cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  /* Le survol ne concerne ni la touche choisie (elle resterait blanche sur
     fond pâle sous la souris, donc illisible) ni les écrans tactiles, où il
     reste collé après le doigt. */
  @media (hover: hover) {
    .choix button:hover:not(:disabled):not(.choisie) { border-color: var(--blue); background: #f3f8fc; }
    .choix button.choisie:hover:not(:disabled) { background: var(--blue-dark); }
  }
  .choix button:focus-visible { outline: 3px solid rgba(11,103,178,.4); outline-offset: 2px; }
  .choix button.choisie { color: #fff; background: var(--blue); border-color: var(--blue-dark); }
  .choix button.choisie::after { content: "✓"; position: absolute; top: 8px; right: 12px;
                                 font-size: 1.3rem; font-weight: 800; }
  .choix button:disabled { cursor: default; }
  .choix button:disabled:not(.choisie) { color: #9aa9bb; border-color: var(--line); background: #f8fafc; }
  /* Un nombre impair de réponses : la dernière prend toute la ligne. */
  .choix.impair button:last-child { grid-column: 1 / -1; }
  .etat { min-height: 3.1em; margin: 0; font-size: 1.08rem; font-weight: 700; color: var(--blue-dark); }
  .etat small { display: block; margin-top: 2px; font-size: .92rem; font-weight: 500; color: var(--muted); }
  .etat.alerte { color: #a3261f; }
  .attente { display: flex; justify-content: center; gap: 8px; margin: 22px 0 6px; }
  .attente i { width: 12px; height: 12px; border-radius: 50%; background: var(--teal);
               animation: pouls 1.2s ease-in-out infinite; }
  .attente i:nth-child(2) { animation-delay: .2s; background: #0b67b2; }
  .attente i:nth-child(3) { animation-delay: .4s; background: var(--orange); }
  @keyframes pouls { 0%, 100% { opacity: .25; transform: scale(.8); } 50% { opacity: 1; transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { .attente i { animation: none; opacity: .7; } }
  .bouton { display: inline-flex; align-items: center; justify-content: center; min-height: 48px;
            margin-top: 18px; padding: 0 20px; color: #fff; background: var(--blue); border-radius: 10px;
            font-weight: 700; text-decoration: none; }
  .bouton:hover { background: var(--blue-dark); }
  .reseau { margin: 12px 0 0; color: #a15c11; font-size: .9rem; font-weight: 600; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
<div class="barre"></div>
<header>
  <img src="mathsgo-logo.png" alt="maths&go">
  <a href="./" id="retour">Mon espace</a>
</header>

<main>
  <div class="carte" id="carte" aria-live="polite">
    <h1 id="titre">Séance en direct</h1>
    <p class="consigne" id="consigne"></p>
    <div id="zone"></div>
    <p class="etat" id="etat" hidden></p>
    <div class="attente" id="attente" hidden aria-hidden="true"><i></i><i></i><i></i></div>
    <a class="bouton" href="./" id="vers-espace" hidden>Retour à mon espace</a>
    <p class="reseau" id="reseau" hidden>Connexion perdue. Nouvel essai…</p>
  </div>
</main>

<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">
(() => {
  "use strict";
  // La même clé que l'espace (index.php) : le code ne vit que dans l'onglet.
  const CLE = "mathsgo-suivi-code";
  const $ = id => document.getElementById(id);

  function lireCode() {
    try { return (window.sessionStorage.getItem(CLE) || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); }
    catch (_) { return ""; }
  }
  function oublierCode() {
    try { window.sessionStorage.removeItem(CLE); } catch (_) {}
  }

  const code = lireCode();
  // Pas de code dans cet onglet : c'est à l'espace de le demander.
  if (code.length !== 6) { window.location.replace("./"); return; }

  let direct = null;          // le dernier état reçu du serveur
  let connu = false;          // au moins une réponse du serveur est arrivée
  let rythme = 2500;
  let minuteur = 0;
  let enVol = false;
  let envoi = null;           // {numero, reponse} : une réponse partie, pas encore confirmée
  let echecEnvoi = false;
  let pannes = 0;

  async function appeler(corps) {
    const reponse = await fetch("api/direct.php", {
      method: "POST",
      headers: {"Content-Type": "text/plain;charset=UTF-8"},
      body: JSON.stringify(Object.assign({code}, corps || {})),
      cache: "no-store"
    });
    const donnees = await reponse.json().catch(() => null);
    return {statut: reponse.status, donnees};
  }

  // ------------------------------------------------------------------ les rendus
  //
  // Un rendu par TYPE de réponse (lib/direct.php, TYPES_DIRECT). Pour ajouter
  // un type — un entier au pavé de chiffres, une fraction en deux cases —, on
  // ajoute une entrée ici, et rien d'autre ne change dans cette page.
  // dessiner(zone, reglage, reponse, ouverte, envoyer) construit la zone de
  // réponse ; lire(reponse) dit la réponse en mots pour la ligne d'état.
  const LETTRES = ["A", "B", "C", "D", "E", "F"];
  const RENDUS = {
    choix: {
      dessiner(zone, reglage, reponse, ouverte, envoyer) {
        const combien = Math.max(2, Math.min(LETTRES.length, Number(reglage && reglage.choix) || 4));
        const grille = document.createElement("div");
        grille.className = "choix" + (combien % 2 ? " impair" : "");
        LETTRES.slice(0, combien).forEach(lettre => {
          const touche = document.createElement("button");
          touche.type = "button";
          touche.textContent = lettre;
          touche.disabled = !ouverte;
          touche.classList.toggle("choisie", reponse === lettre);
          touche.setAttribute("aria-pressed", reponse === lettre ? "true" : "false");
          touche.setAttribute("aria-label", "Réponse " + lettre);
          if (ouverte) touche.addEventListener("click", () => envoyer(lettre));
          grille.append(touche);
        });
        zone.append(grille);
      },
      lire(reponse) { return reponse; }
    }
  };

  function ecrireEtat(texte, petit, alerte) {
    const bloc = $("etat");
    bloc.textContent = "";
    bloc.hidden = !texte;
    bloc.classList.toggle("alerte", Boolean(alerte));
    if (!texte) return;
    bloc.append(document.createTextNode(texte));
    if (petit) {
      const ligne = document.createElement("small");
      ligne.textContent = petit;
      bloc.append(ligne);
    }
  }

  function dessiner() {
    const zone = $("zone");
    zone.textContent = "";
    $("attente").hidden = true;
    $("vers-espace").hidden = true;
    $("reseau").hidden = pannes < 2;

    if (!connu) {
      $("titre").textContent = "Séance en direct";
      $("consigne").textContent = "";
      ecrireEtat("");
      $("attente").hidden = false;
      return;
    }
    if (!direct) {
      $("titre").textContent = "Pas de séance en cours";
      $("consigne").textContent = "Elle s’affichera ici dès que ton professeur la lance.";
      ecrireEtat("");
      $("vers-espace").hidden = false;
      return;
    }
    const rendu = direct.type ? RENDUS[direct.type] : null;
    if (direct.etat === "attente" || !direct.type) {
      $("titre").textContent = "Séance en direct";
      $("consigne").textContent = "Regarde le tableau : la question arrive.";
      ecrireEtat("");
      $("attente").hidden = false;
      return;
    }
    $("titre").textContent = "Question " + direct.numero;
    if (!rendu) {
      // Un type que cette page ne connaît pas encore (page restée ouverte
      // pendant une mise à jour) : on le dit, sans rien casser.
      $("consigne").textContent = "Recharge la page pour répondre à cette question.";
      ecrireEtat("");
      return;
    }
    const ouverte = direct.etat === "question";
    // La réponse affichée : celle qui vient de partir, sinon celle du serveur.
    const enAttente = envoi && envoi.numero === direct.numero;
    const reponse = enAttente ? envoi.reponse : direct.reponse;
    rendu.dessiner(zone, direct.reglage, reponse, ouverte, envoyer);
    if (ouverte) {
      $("consigne").textContent = "Choisis ta réponse.";
      if (echecEnvoi) ecrireEtat("Réponse non envoyée.", "Touche-la de nouveau.", true);
      else if (enAttente) ecrireEtat("Envoi…");
      else if (reponse) ecrireEtat("Réponse envoyée : " + rendu.lire(reponse), "Tu peux encore changer.");
      else ecrireEtat("");
    } else {
      $("consigne").textContent = "Regarde le tableau.";
      ecrireEtat(reponse ? "Ta réponse : " + rendu.lire(reponse) : "Tu n’as pas répondu.");
    }
  }

  // Une signature de ce qui est à l'écran : on ne redessine que si elle
  // change, pour ne pas défaire un bouton sous le doigt toutes les 2,5 s.
  let derniereSignature = "";
  function redessinerSiBesoin() {
    const signature = JSON.stringify([connu, direct, envoi, echecEnvoi, pannes >= 2]);
    if (signature === derniereSignature) return;
    derniereSignature = signature;
    dessiner();
  }

  function recevoir(resultat) {
    if (resultat.statut === 404) {
      // Le code ne vaut plus rien (nouveau code, élève retiré) : retour à l'espace.
      oublierCode();
      window.location.replace("./");
      return false;
    }
    if (resultat.statut !== 200 || !resultat.donnees || !resultat.donnees.ok) return false;
    connu = true;
    direct = resultat.donnees.direct || null;
    const propose = Number(resultat.donnees.rythme);
    if (propose >= 1000 && propose <= 30000) rythme = propose;
    return true;
  }

  async function interroger() {
    if (enVol) return;
    enVol = true;
    try {
      const ok = recevoir(await appeler());
      pannes = ok ? 0 : pannes + 1;
    } catch (_) {
      pannes += 1;
    } finally {
      enVol = false;
    }
    redessinerSiBesoin();
  }

  async function envoyer(reponse) {
    if (!direct || direct.etat !== "question") return;
    const numero = direct.numero;
    envoi = {numero, reponse};
    echecEnvoi = false;
    redessinerSiBesoin();
    let ok = false;
    try {
      ok = recevoir(await appeler({numero, reponse}));
    } catch (_) {}
    // Une réponse plus récente est partie entre-temps : c'est elle qui compte.
    if (envoi && envoi.numero === numero && envoi.reponse === reponse) {
      envoi = null;
      echecEnvoi = !ok;
    }
    redessinerSiBesoin();
  }

  // La boucle : un appel, puis le suivant « rythme » millisecondes après la
  // RÉPONSE (jamais deux appels en vol). Onglet caché : on s'arrête, et on
  // reprend tout de suite au retour.
  function planifier() {
    window.clearTimeout(minuteur);
    if (document.visibilityState === "hidden") return;
    // Serveur muet : on espace les essais au lieu de marteler.
    const attente = pannes >= 2 ? Math.min(rythme * 3, 15000) : rythme;
    minuteur = window.setTimeout(async () => { await interroger(); planifier(); }, attente);
  }
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") { window.clearTimeout(minuteur); return; }
    await interroger();
    planifier();
  });
  // Retour d'un cache arrière/avant sans code dans l'onglet (« Se déconnecter »
  // est passé par là) : on ne remontre rien.
  window.addEventListener("pageshow", event => {
    if (event.persisted && lireCode().length !== 6) window.location.replace("./");
  });

  redessinerSiBesoin();
  interroger().then(planifier);
})();
</script>
</body>
</html>
