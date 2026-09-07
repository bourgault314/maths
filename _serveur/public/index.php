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
  header { padding: 12px 16px; background: var(--paper); border-bottom: 1px solid var(--line);
           display: flex; align-items: center; gap: 10px; }
  header img { display: block; height: 34px; width: auto; }
  /* Le bout droit de l'en-tête n'existe que pour un élève entré : sa classe,
     et le geste pour sortir. Avant l'entrée, il n'y a rien à montrer. */
  .entete-droite { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  main { flex: 1; width: 100%; max-width: 780px; margin: 0 auto; padding: 22px 16px 30px; }
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
  .classe { padding: 4px 11px; border-radius: 999px; background: #e6f6f5;
            color: #06716e; font-size: .82rem; font-weight: 800; }
  /* Une seule mise en page pour toutes les tailles de liste : une colonne tant
     qu'il n'y a qu'une ou deux activités (la tuile reste large et la page ne
     paraît pas vide), deux ou trois dès qu'il y en a plus — sans rien réécrire
     le jour où une appli de plus est proposée à la classe. */
  ul { list-style: none; margin: 18px 0 0; padding: 0;
       display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
  .appli { display: flex; align-items: center; gap: 13px; padding: 15px 16px; height: 100%;
           background: var(--paper); border: 1px solid var(--line); border-left: 5px solid var(--teal);
           border-radius: 12px; text-decoration: none; color: inherit; min-height: 44px; }
  .appli:hover { border-color: var(--blue); border-left-color: var(--blue); background: #f3f8fc; }
  .appli .texte { min-width: 0; }
  .appli strong { display: block; font-size: 1.05rem; color: var(--blue-dark); }
  .appli span { color: var(--muted); font-size: .92rem; }
  .appli .fleche { margin-left: auto; flex: 0 0 auto; color: var(--blue); }
  /* Le dessin ne remplace jamais le nom : à 40 px, aucun pictogramme ne dit
     « critères de divisibilité ». Il sert à retrouver d'un coup d'œil une
     activité déjà connue, pas à la deviner. */
  .icone { flex: 0 0 auto; display: block; }
  /* Une activité annoncée mais pas ouverte. Elle est visiblement en retrait —
     fond plus pâle, titre gris, pas de liseré coloré — mais son DESSIN garde ses
     couleurs : le soleil de Solèy et l'orange de Splat sont justement ce qui
     donne envie d'y revenir. Grisés, les cinq à venir se ressemblaient tous
     (comparé au navigateur le 07/09/2026). La pastille dit le reste. */
  .appli.bientot { border-left-color: var(--line); background: #fbfcfe; cursor: default; }
  .appli.bientot strong { color: var(--muted); }
  .pastille { margin-left: auto; flex: 0 0 auto; background: #eef2f7; color: var(--muted);
              font-size: .68rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase;
              padding: 4px 9px; border-radius: 999px; }
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
  <div class="entete-droite" id="entete-droite" hidden>
    <span class="classe" id="classe"></span>
    <button type="button" class="secondaire" id="changer">Se déconnecter</button>
  </div>
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
    <h1 id="titre">Mon espace</h1>
    <p class="sous-titre">Choisis une activité. Ton travail est enregistré tout seul.</p>
    <ul id="applis"></ul>
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
  // l'appareil : c'est là que vit « Se déconnecter ».)
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

  // « Se déconnecter » dans l'appli renvoie ici avec ?oublier=1 : l'espace
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

  // Les dessins vivent dans la PAGE, pas dans la réponse du serveur : la
  // politique de contenu interdit une image d'un autre domaine, et surtout
  // rien de ce qui vient du serveur ne doit entrer dans la page autrement que
  // par textContent. La clé de l'appli (« defi-tables ») ne sert donc qu'à
  // choisir dans ce tableau ; une appli inconnue prend le dessin par défaut.
  const ICONES = {
    // Défi tables : des cases rangées en tableau, et le signe × dans la case
    // d'angle — comme l'en-tête d'un carré de Pythagore. Quatre cases et non
    // neuf : à 40 px, la taille où l'élève le voit vraiment, un × logé dans
    // une case de 8 px disparaît. Essayé, comparé au navigateur, écarté.
    "defi-tables":
      '<svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false">'
      + '<rect width="46" height="46" rx="12" fill="#eaf1fa"/><g transform="translate(9,9)">'
      + '<rect x="0" y="0" width="13" height="13" rx="3" fill="#063f86"/>'
      + '<rect x="15" y="0" width="13" height="13" rx="3" fill="#063f86"/>'
      + '<rect x="0" y="15" width="13" height="13" rx="3" fill="#063f86"/>'
      + '<rect x="15" y="15" width="13" height="13" rx="3" fill="#08aaa5"/>'
      + '<g stroke="#fff" stroke-width="2.6" stroke-linecap="round">'
      + '<path d="M4 4l5 5M9 4l-5 5"/></g>'
      + '</g></svg>',
    // Défi calcul : les quatre opérations, aux couleurs de la vignette du site
    // (bleu #0755b8 et orange #d95f02) — l'appli ne fait pas que des additions.
    "defi-calcul":
      '<svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false">'
      + '<rect width="46" height="46" rx="12" fill="#eaf1fa"/>'
      + '<g stroke="#0755b8" stroke-width="3.6" stroke-linecap="round">'
      + '<path d="M15 9.5v9M10.5 14h9"/><path d="M26.5 14h9"/></g>'
      + '<g stroke="#d95f02" stroke-width="3.6" stroke-linecap="round">'
      + '<path d="M11 27.5l8 8M19 27.5l-8 8"/><path d="M26.5 31.5h9"/></g>'
      + '<g fill="#d95f02"><circle cx="31" cy="26.5" r="2.2"/><circle cx="31" cy="36.5" r="2.2"/></g>'
      + '</svg>',
    // Automatismes : LE MÉTRONOME de la bibliothèque d'icônes du site
    // (assets/js/mathsgo-icon-library.js, clé « automatismes »), repris tel
    // quel — c'est le dessin déjà utilisé partout ailleurs sur mathsgo.re.
    "automatismes":
      '<svg class="icone" width="40" height="40" viewBox="0 0 64 64" aria-hidden="true"><path d="m18 53 6-43h16l6 4'
      + '3Z" fill="#eff6ff" stroke="#0b67b2" stroke-width="2.4" stroke-linejoin="round"/><g stroke="#08aaa5" stroke-w'
      + 'idth="1.7" stroke-linecap="round"><path d="M26.5 24h11"/><path d="M26.5 30h11"/><path d="M26.5 36h11"/><path'
      + ' d="M26.5 42h11"/></g><g data-mathsgo-metronome-needle="" transform="rotate(0 32 14.75)"><path d="M32 14.75V'
      + '45" fill="none" stroke="#f58220" stroke-width="3.2" stroke-linecap="round"/><circle cx="32" cy="45" r="3.1" '
      + 'fill="#f58220" stroke="#a8440b" stroke-width="1.2"/></g><rect data-mathsgo-metronome-pivot="" x="28.5" y="12'
      + '" width="7" height="5.5" rx="1.4" fill="#f9bf3b" stroke="#a85b08" stroke-width="1.2"/><path d="M15 53h34v6H1'
      + '5Z" fill="#0b67b2" stroke="#063f86" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    // Splat ! Équations : LE SPLAT de la même bibliothèque (clé « splat »),
    // repris tel quel SAUF la couleur, passée du violet au bleu maths&go.
    // Sur le site la lettre change chaque jour (daily-splat-letter.js) ; ici
    // elle reste « x », l'inconnue.
    "splat-equations":
      '<svg class="icone" width="40" height="40" viewBox="-2 -2 28 28" aria-hidden="true"><path d="M21.45 12c.529.4'
      + '93 1.283 1.157 1.472 1.73.189.573-.034 1.225-.337 1.709-.303.485-.991.847-1.481 1.2-.49.352-.965.666-1.459.9'
      + '16-.494.25-.993.462-1.506.584-.513.122-1.142.006-1.572.147-.43.141-.732.251-1.007.701-.274.451-.335 1.345-.6'
      + '4 2-.305.656-.703 1.578-1.19 1.935-.487.357-1.175.346-1.73.208-.555-.138-1.112-.681-1.598-1.038-.487-.357-.9'
      + '32-.712-1.322-1.105-.391-.392-.747-.801-1.022-1.251-.274-.45-.358-1.085-.625-1.45-.267-.365-.465-.619-.978-.'
      + '741-.513-.122-1.382.097-2.1.01-.718-.088-1.718-.182-2.208-.535-.49-.352-.692-1.01-.732-1.581-.04-.57.304-1.2'
      + '67.493-1.841.189-.573.389-1.105.642-1.598.253-.493.531-.958.875-1.358.343-.4.921-.676 1.185-1.043.265-.367.4'
      + '45-.634.403-1.159-.043-.526-.52-1.285-.658-1.995-.139-.709-.358-1.689-.174-2.264.184-.575.747-.971 1.277-1.1'
      + '85.53-.215 1.3-.103 1.903-.1.604.003 1.172.028 1.719.117.547.088 1.075.209 1.562.412.487.203.927.667 1.358.8'
      + '05.431.138.74.227 1.227.024.486-.202 1.061-.89 1.693-1.241.632-.352 1.497-.863 2.1-.866.604-.003 1.155.411 1'
      + '.522.849.368.438.499 1.204.683 1.779.184.575.335 1.123.42 1.67.085.548.133 1.088.091 1.613-.043.526-.348 1.0'
      + '88-.346 1.541.001.452.012.774.356 1.174.343.4 1.175.734 1.704 1.227Z" fill="#0b67b2" stroke="#052f67" stroke'
      + '-width="1.05"/><text x="12.4" y="14.2" text-anchor="middle" fill="#fff" font-family="Times New Roman, Times,'
      + ' serif" font-size="10" font-weight="700" font-style="italic">x</text></svg>',
    // Solèy : le soleil doré sur ciel violet, les couleurs de sa vignette. La
    // bibliothèque n'a qu'une icône « fractions » (des bandes) : elle irait à
    // n'importe quel outil de fractions et ne dit pas Solèy.
    "soley":
      '<svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false">'
      + '<rect width="46" height="46" rx="12" fill="#241b4d"/>'
      + '<circle cx="23" cy="23" r="7.5" fill="#ffc94d"/>'
      + '<g stroke="#ffc94d" stroke-width="2.8" stroke-linecap="round">'
      + '<path d="M23 8.5v3.5M23 34v3.5M8.5 23h3.5M34 23h3.5M12.8 12.8l2.5 2.5M30.7 30.7l2.5 2.5'
      + 'M33.2 12.8l-2.5 2.5M15.3 30.7l-2.5 2.5"/></g></svg>'
  };
  const ICONE_DEFAUT =
    '<svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false">'
    + '<rect width="46" height="46" rx="12" fill="#eaf1fa"/><g fill="#063f86">'
    + '<circle cx="17" cy="17" r="4"/><circle cx="29" cy="17" r="4"/>'
    + '<circle cx="17" cy="29" r="4"/><circle cx="29" cy="29" r="4"/></g></svg>';

  function icone(cle) {
    return Object.prototype.hasOwnProperty.call(ICONES, cle) ? ICONES[cle] : ICONE_DEFAUT;
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
    $("entete-droite").hidden = false;

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
      lien.innerHTML = `${icone(appli.cle)}<div class="texte"><strong></strong><span></span></div>${FLECHE}`;
      lien.querySelector("strong").textContent = appli.nom;
      lien.querySelector("span").textContent = appli.description;
      li.appendChild(lien);
      liste.appendChild(li);
    });

    bientot.forEach(appli => {
      const li = document.createElement("li");
      const bloc = document.createElement("div");
      bloc.className = "appli bientot";
      bloc.innerHTML = icone(appli.cle)
        + '<div class="texte"><strong></strong><span></span></div>'
        + '<span class="pastille">Bientôt</span>';
      bloc.querySelector("strong").textContent = appli.nom;
      bloc.querySelector(".texte span").textContent = appli.description || "";
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
    $("entete-droite").hidden = true;
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
