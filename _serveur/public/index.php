<?php
// Page d'accueil des élèves : un code, et les applis de sa classe. Rien d'autre.
// Depuis le lot 3 (03/09/2026), les liens vers les applis portent un billet
// d'entrée à usage unique (lib/billets.php), jamais le code lui-même.
require_once __DIR__ . '/lib/entetes.php';
header('Content-Type: text/html; charset=utf-8');
// Politique de contenu (voir lib/entetes.php) : seul le script portant ce
// nonce s'exécute dans la page.
$nonce = entetes_page();
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Espace élèves de maths&go : entre ton code pour retrouver tes activités.">
<!-- Lot 7 : icônes et logo servis d'ICI (copies du dépôt, vérifiées par un
     test). La politique de contenu n'autorise plus d'image d'un autre domaine. -->
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<title>Mon espace | maths&amp;go</title>
<style>
  :root {
    --blue: #063f86; --blue-dark: #052f67; --teal: #08aaa5; --orange: #f58220;
    --ink: #10294a; --muted: #5c6c82; --paper: #fff; --line: #d9e2ec; --page: #f6f8fb;
    --brand-gradient: linear-gradient(90deg, #08aaa5 0%, #0b67b2 44%, #f58220 72%, #f9bf3b 100%);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; flex-direction: column;
    background: var(--page); color: var(--ink);
    font: 16px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .barre { height: 5px; background: var(--brand-gradient); }
  header { padding: 14px 16px; background: var(--paper); border-bottom: 1px solid var(--line); }
  header img { display: block; height: 34px; width: auto; }
  main { flex: 1; width: 100%; max-width: 640px; margin: 0 auto; padding: 22px 16px 30px; }
  h1 { margin: 0 0 6px; font-family: Georgia, "Times New Roman", serif;
       font-size: clamp(1.5rem, 5vw, 2rem); line-height: 1.15; color: var(--blue-dark); }
  .sous-titre { margin: 0 0 22px; color: var(--muted); }
  .carte { background: var(--paper); border: 1px solid var(--line); border-radius: 14px;
           padding: 18px; box-shadow: 0 10px 26px rgba(22,47,82,.07); }
  label { display: block; margin-bottom: 8px; font-weight: 700; }
  input[type=text] {
    width: 100%; min-height: 56px; padding: 10px 14px;
    font-size: 1.6rem; font-weight: 700; letter-spacing: .22em; text-align: center;
    text-transform: uppercase; color: var(--blue-dark);
    border: 2px solid var(--line); border-radius: 12px; background: #fff;
  }
  input[type=text]:focus { outline: 3px solid rgba(11,103,178,.35); border-color: var(--blue); }
  button {
    min-height: 48px; padding: 0 20px; font-size: 1rem; font-weight: 700; font-family: inherit;
    color: #fff; background: var(--blue); border: 0; border-radius: 10px; cursor: pointer;
  }
  button:hover { background: var(--blue-dark); }
  button.secondaire { color: var(--muted); background: transparent; border: 1px solid var(--line);
                      min-height: 44px; font-size: .92rem; font-weight: 600; }
  button.secondaire:hover { color: var(--blue); background: #fff; border-color: var(--blue); }
  .actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
  .erreur { margin-top: 12px; padding: 10px 12px; border-radius: 10px;
            background: #fdecec; color: #a3261f; font-weight: 600; }
  .bonjour { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
  .classe { padding: 3px 10px; border-radius: 999px; background: #e6f6f5;
            color: #06716e; font-size: .82rem; font-weight: 800; }
  ul { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 12px; }
  .appli { display: flex; align-items: center; gap: 14px; padding: 16px;
           background: var(--paper); border: 1px solid var(--line); border-left: 5px solid var(--teal);
           border-radius: 12px; text-decoration: none; color: inherit; min-height: 44px; }
  .appli:hover { border-color: var(--blue); border-left-color: var(--blue); background: #f3f8fc; }
  .appli strong { display: block; font-size: 1.05rem; color: var(--blue-dark); }
  .appli span { color: var(--muted); font-size: .92rem; }
  .appli .fleche { margin-left: auto; flex: 0 0 auto; color: var(--blue); }
  .appli.bientot { border-left-color: var(--line); opacity: .65; cursor: default; }
  .aide { margin-top: 20px; color: var(--muted); font-size: .9rem; }
  footer { padding: 16px; border-top: 1px solid var(--line); background: var(--paper);
           color: var(--muted); font-size: .82rem; text-align: center; }
  footer a { display: inline-block; padding: 12px 8px; color: var(--muted); }
  [hidden] { display: none !important; }
</style>
</head>
<body>
<div class="barre"></div>
<header>
  <img src="mathsgo-logo.png" alt="maths&go">
</header>

<main>
  <section id="ecran-code">
    <h1>Mon espace</h1>
    <p class="sous-titre">Entre le code que ton professeur t’a donné.</p>
    <div class="carte">
      <!-- method="post" : en usage normal le JavaScript intercepte l'envoi, mais
           s'il ne s'exécute pas, le navigateur enverrait le formulaire lui-même —
           et en GET le code de l'élève se retrouverait dans la barre d'adresse. -->
      <form id="form-code" method="post" autocomplete="off">
        <label for="code">Ton code</label>
        <input id="code" name="code" type="text" inputmode="latin" maxlength="6"
               spellcheck="false" autocapitalize="characters" placeholder="••••••" required>
        <div class="actions">
          <button type="submit" id="valider">Entrer</button>
        </div>
      </form>
      <p class="erreur" id="erreur" hidden></p>
    </div>
    <p class="aide">Ton code compte 6 caractères. Il n’y a jamais de O ni de I : ce sont des zéros et des uns qui n’existent pas ici — si tu hésites, c’est un chiffre.</p>
  </section>

  <section id="ecran-espace" hidden>
    <div class="bonjour">
      <h1 id="titre">Mon espace</h1>
      <span class="classe" id="classe"></span>
    </div>
    <p class="sous-titre">Choisis une activité. Ton travail est enregistré tout seul.</p>
    <ul id="applis"></ul>
    <p class="aide">
      <button type="button" class="secondaire" id="changer">Se déconnecter</button>
    </p>
  </section>
</main>

<footer>
  <a href="https://mathsgo.re/">mathsgo.re</a> ·
  <a href="https://mathsgo.re/confidentialite.html">Confidentialité</a> ·
  CC BY-NC-SA 4.0
</footer>

<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">
(() => {
  "use strict";
  const CLE = "mathsgo-suivi-code";
  const $ = id => document.getElementById(id);

  // Le code n'est retenu que le temps de l'onglet (sessionStorage), pas d'une
  // visite à l'autre : sur un poste partagé au collège, l'espace ne doit pas
  // rouvrir « Bonjour Léa » au camarade suivant. Retaper six caractères est
  // le geste qui dit « c'est moi ». (L'appli, elle, garde le code sur
  // l'appareil : c'est là que vit « Ce n'est pas moi ».)
  function stockage() {
    try { return window.sessionStorage; } catch (_) { return null; }
  }
  function lireCode() {
    try { return stockage()?.getItem(CLE) || ""; } catch (_) { return ""; }
  }
  function ecrireCode(code) {
    try { code ? stockage()?.setItem(CLE, code) : stockage()?.removeItem(CLE); } catch (_) {}
  }
  function nettoyer(brut) {
    return (brut || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  }
  function afficherErreur(message) {
    $("erreur").textContent = message;
    $("erreur").hidden = !message;
  }

  // « Ce n'est pas moi » dans l'appli renvoie ici avec ?oublier=1 : l'espace
  // oublie à son tour le code de cet onglet — les deux domaines ont chacun
  // leur mémoire, un seul geste doit vider les deux — et l'adresse est
  // nettoyée pour qu'un rechargement ne recommence pas.
  function oublierSiDemande() {
    let demande = false;
    try { demande = new URLSearchParams(window.location.search).get("oublier") === "1"; } catch (_) {}
    if (!demande) return false;
    ecrireCode("");
    try { window.localStorage.removeItem(CLE); } catch (_) {}
    try { window.history.replaceState(null, "", window.location.pathname); } catch (_) {}
    return true;
  }

  const FLECHE = '<svg class="fleche" width="22" height="22" viewBox="0 0 24 24" fill="none" '
    + 'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" '
    + 'aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  // L'adresse de l'appli, avec le BILLET d'entrée (lot 3) — jamais le code :
  // une adresse entre dans l'historique du navigateur, et sur un poste
  // partagé l'historique garderait tous les codes de la classe. Le billet est
  // délivré par le serveur, vaut deux minutes et ne sert qu'une fois ; l'appli
  // l'échange contre le code et nettoie l'adresse.
  function adresseAppli(appli, billet) {
    return `${appli.url}#b=${encodeURIComponent(billet)}`
      + (appli.ancre ? `&ouvrir=${encodeURIComponent(appli.ancre)}` : "");
  }

  // Un billet neuf au moment du clic : celui reçu à l'entrée peut avoir
  // expiré si l'élève a pris son temps. Si le serveur ne répond pas, on part
  // avec le billet de l'entrée — il vaut peut-être encore.
  async function billetFrais(code) {
    try {
      const reponse = await fetch("api/eleve.php", {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=UTF-8"},
        body: JSON.stringify({code, billet: true}),
        cache: "no-store"
      });
      const donnees = await reponse.json().catch(() => null);
      if (reponse.ok && donnees && donnees.ok && typeof donnees.billet === "string") return donnees.billet;
    } catch (_) {}
    return "";
  }

  function afficherEspace(donnees, code) {
    $("titre").textContent = donnees.prenom ? `Bonjour ${donnees.prenom}` : "Mon espace";
    $("classe").textContent = donnees.classe || "";
    $("classe").hidden = !donnees.classe;

    const liste = $("applis");
    liste.textContent = "";
    const disponibles = (donnees.applis || []).filter(a => a.disponible && a.url);
    const bientot = (donnees.applis || []).filter(a => !a.disponible || !a.url);

    disponibles.forEach(appli => {
      const li = document.createElement("li");
      const lien = document.createElement("a");
      lien.className = "appli";
      // Le billet de l'entrée sert de secours (clic du milieu, « ouvrir dans un
      // nouvel onglet ») ; un clic ordinaire en demande un frais.
      lien.href = adresseAppli(appli, donnees.billet || "");
      lien.addEventListener("click", async event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (lien.dataset.enCours) return;
        lien.dataset.enCours = "1";
        const billet = await billetFrais(code);
        window.location.assign(adresseAppli(appli, billet || donnees.billet || ""));
        window.setTimeout(() => { delete lien.dataset.enCours; }, 2000);
      });
      lien.innerHTML = `<div><strong></strong><span></span></div>${FLECHE}`;
      lien.querySelector("strong").textContent = appli.nom;
      lien.querySelector("span").textContent = appli.description;
      li.appendChild(lien);
      liste.appendChild(li);
    });

    bientot.forEach(appli => {
      const li = document.createElement("li");
      const bloc = document.createElement("div");
      bloc.className = "appli bientot";
      bloc.innerHTML = "<div><strong></strong><span>Bientôt disponible.</span></div>";
      bloc.querySelector("strong").textContent = appli.nom;
      li.appendChild(bloc);
      liste.appendChild(li);
    });

    if (!liste.children.length) {
      const li = document.createElement("li");
      li.className = "aide";
      li.textContent = "Aucune activité n’est proposée à ta classe pour l’instant.";
      liste.appendChild(li);
    }

    $("ecran-code").hidden = true;
    $("ecran-espace").hidden = false;
  }

  async function ouvrir(code, silencieux) {
    afficherErreur("");
    try {
      // Le code part dans le CORPS de la requête, jamais dans l'adresse : une
      // adresse s'inscrit en clair dans les journaux de l'hébergeur.
      // « billet: true » : le serveur joint un billet d'entrée, pour les liens.
      const reponse = await fetch("api/eleve.php", {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=UTF-8"},
        body: JSON.stringify({code, billet: true}),
        cache: "no-store"
      });
      const donnees = await reponse.json().catch(() => null);
      if (!reponse.ok || !donnees || !donnees.ok) {
        // Seul un 404 prouve que le code ne vaut plus rien. Un serveur en
        // panne ou trop sollicité ne doit pas faire oublier un bon code.
        if (reponse.status === 404) ecrireCode("");
        if (silencieux && reponse.status === 404) return;
        if (silencieux) $("code").value = code;
        afficherErreur(reponse.status === 404
          ? "Ce code n’existe pas. Vérifie-le, ou demande à ton professeur."
          : (donnees && donnees.erreur) || "Le serveur ne répond pas. Réessaie dans un instant.");
        return;
      }
      ecrireCode(code);
      afficherEspace(donnees, code);
    } catch (_) {
      if (silencieux) $("code").value = code;
      afficherErreur("Pas de connexion. Réessaie dans un instant.");
    }
  }

  $("code").addEventListener("input", event => {
    const position = event.target.selectionStart;
    event.target.value = nettoyer(event.target.value);
    event.target.setSelectionRange(position, position);
  });

  $("form-code").addEventListener("submit", event => {
    event.preventDefault();
    const code = nettoyer($("code").value);
    if (code.length !== 6) { afficherErreur("Le code compte exactement 6 caractères."); return; }
    ouvrir(code, false);
  });

  // « Se déconnecter » (lot 7 : le même mot que dans l'appli, un seul geste à
  // apprendre). Le code est oublié, et RIEN du précédent élève ne reste dans la
  // page : ni son prénom, ni sa classe, ni ses activités.
  $("changer").addEventListener("click", () => {
    ecrireCode("");
    $("code").value = "";
    $("titre").textContent = "Mon espace";
    $("classe").textContent = "";
    $("classe").hidden = true;
    $("applis").textContent = "";
    afficherErreur("");
    $("ecran-espace").hidden = true;
    $("ecran-code").hidden = false;
    $("code").focus();
  });

  if (oublierSiDemande()) {
    $("code").focus();
  } else {
    const memorise = nettoyer(lireCode());
    if (memorise.length === 6) ouvrir(memorise, true);
  }
})();
</script>
</body>
</html>
