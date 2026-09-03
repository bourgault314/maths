<?php
// Page « Ma classe » — réservée au professeur, protégée par mot de passe.
require_once __DIR__ . '/../lib/entetes.php';
header('Content-Type: text/html; charset=utf-8');
// Politique de contenu (voir lib/entetes.php) : seuls le moteur servi d'ici et
// le script portant ce nonce s'exécutent dans la page.
$nonce = entetes_page();
// Le moteur est une copie de outils/calcul_mental/defi_tables_mon_parcours.js
// (identité vérifiée par un test du dépôt). Sa version dans l'adresse suit son
// contenu : un nouveau fichier déposé n'est jamais masqué par le cache.
$moteur = __DIR__ . '/defi_tables_mon_parcours.js';
$versionMoteur = is_file($moteur) ? substr(md5_file($moteur), 0, 10) : '0';
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="https://mathsgo.re/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="https://mathsgo.re/favicon.svg">
<link rel="apple-touch-icon" href="https://mathsgo.re/assets/img/apple-touch-icon.png">
<title>Ma classe | maths&amp;go</title>
<style>
  :root {
    --blue: #063f86; --blue-dark: #052f67; --teal: #08aaa5; --orange: #f58220;
    --ink: #10294a; --muted: #5c6c82; --paper: #fff; --line: #d9e2ec; --page: #f6f8fb;
    --vert: #1a7f37; --rouge: #b42318;
    --brand-gradient: linear-gradient(90deg, #08aaa5 0%, #0b67b2 44%, #f58220 72%, #f9bf3b 100%);
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; flex-direction: column;
         background: var(--page); color: var(--ink);
         font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .barre { height: 5px; background: var(--brand-gradient); }
  header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
           padding: 12px 16px; background: var(--paper); border-bottom: 1px solid var(--line); }
  header img { display: block; height: 30px; width: auto; }
  header .titre { font-family: Georgia, serif; font-size: 1.15rem; color: var(--blue-dark); }
  header .droite { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  main { flex: 1; width: 100%; max-width: 1220px; margin: 0 auto; padding: 20px 16px 32px; }
  h1 { margin: 0 0 6px; font-family: Georgia, serif; font-size: clamp(1.4rem, 4vw, 1.9rem);
       color: var(--blue-dark); }
  h2 { margin: 26px 0 10px; font-family: Georgia, serif; font-size: 1.2rem; color: var(--blue-dark); }
  p.sous { margin: 0 0 18px; color: var(--muted); }
  .carte { background: var(--paper); border: 1px solid var(--line); border-radius: 14px;
           padding: 16px; box-shadow: 0 10px 26px rgba(22,47,82,.06); }
  label { display: block; margin: 12px 0 6px; font-weight: 700; font-size: .93rem; }
  input[type=text], input[type=password], input[type=number], select {
    width: 100%; min-height: 44px; padding: 8px 12px; font: inherit; color: var(--ink);
    border: 2px solid var(--line); border-radius: 10px; background: #fff; }
  /* Le prénom se saisit directement dans le tableau : discret tant qu'on n'y touche pas. */
  #tableau td input { min-height: 40px; padding: 6px 8px; font-weight: 600; border-color: transparent; background: transparent; }
  #tableau td input:hover { border-color: var(--line); background: #fff; }
  #tableau td input::placeholder { font-weight: 400; font-style: italic; color: #9aa9bb; }
  input:focus, select:focus { outline: 3px solid rgba(11,103,178,.3); border-color: var(--blue); }
  button { min-height: 44px; padding: 0 16px; font: inherit; font-weight: 700;
           color: #fff; background: var(--blue); border: 0; border-radius: 10px; cursor: pointer; }
  button:hover { background: var(--blue-dark); }
  button.secondaire { color: var(--blue); background: #fff; border: 2px solid var(--line); }
  button.secondaire:hover { border-color: var(--blue); background: #f3f8fc; }
  button.danger { color: var(--rouge); background: #fff; border: 2px solid #f3d3d0; }
  button.danger:hover { background: #fdecec; }
  button.petit, .bouton-lien { min-height: 44px; padding: 0 9px; font-size: .8rem; font-weight: 600; }
  /* Un lien qui doit se voir comme un bouton : la fiche s'ouvre dans le site. */
  .bouton-lien { display: inline-flex; align-items: center; justify-content: center;
                 color: var(--blue); background: #fff; border: 2px solid var(--line);
                 border-radius: 10px; text-decoration: none; }
  .bouton-lien:hover { border-color: var(--blue); background: #f3f8fc; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
  .message { margin: 14px 0 0; padding: 10px 12px; border-radius: 10px; font-weight: 600; }
  .message.erreur { background: #fdecec; color: var(--rouge); }
  .message.ok { background: #e6f6ea; color: var(--vert); }
  .classes { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px;
             grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
  .classes button { width: 100%; text-align: left; color: inherit; background: var(--paper);
                    border: 1px solid var(--line); border-left: 5px solid var(--teal);
                    border-radius: 12px; padding: 14px; font-weight: 400; min-height: 66px; }
  .classes button:hover { border-color: var(--blue); border-left-color: var(--blue); background: #f3f8fc; }
  .classes strong { display: block; font-size: 1.1rem; color: var(--blue-dark); }
  .classes span { color: var(--muted); font-size: .88rem; }
  .tableau-enveloppe { overflow-x: auto; margin-top: 12px; }
  table { width: 100%; border-collapse: collapse; background: var(--paper); font-size: .92rem; }
  th, td { padding: 8px 6px; text-align: left; border-bottom: 1px solid var(--line);
           white-space: nowrap; }
  #tableau td.actions-eleve { display: flex; gap: 6px; }
  th { background: #eef3f9; color: var(--blue-dark); font-size: .82rem;
       text-transform: uppercase; letter-spacing: .04em; }
  th button { min-height: 44px; padding: 0; color: var(--blue-dark); background: none;
              font: inherit; font-weight: 700; text-transform: inherit; letter-spacing: inherit; }
  th button:hover { background: none; text-decoration: underline; }
  /* En lecture seule, la colonne des codes n'existe pas. */
  #tableau.sans-codes th:nth-child(2), #tableau.sans-codes td.code { display: none; }
  td.code { font-family: ui-monospace, Consolas, monospace; font-weight: 700;
            letter-spacing: .08em; color: var(--blue-dark); }
  td.sans { color: var(--muted); font-style: italic; }
  .pastille { display: inline-block; padding: 2px 9px; border-radius: 999px;
              font-size: .8rem; font-weight: 800; }
  .p-vert { background: #e6f6ea; color: var(--vert); }
  .p-orange { background: #fdf0e3; color: #a15c11; }
  .p-gris { background: #eef1f5; color: var(--muted); }
  .message.info { background: #eef3f9; color: var(--blue-dark); }
  .classes .badge { display: block; margin-top: 4px; color: var(--muted); font-size: .82rem; }
  .classes button.partagee { border-left-color: var(--orange); }
  .profs { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .profs li { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 8px 12px;
              background: #fbfcfe; border: 1px solid var(--line); border-radius: 10px; }
  .profs li strong { color: var(--blue-dark); }
  .profs li .fin { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
  .profs li.vide { color: var(--muted); font-style: italic; border-style: dashed; }
  .profs .role { color: var(--muted); font-size: .86rem; }
  .retour-icone { display: inline-flex; align-items: center; gap: 6px; }
  .retour-icone svg { display: block; }
  .note-tableau { margin: 10px 0 0; font-size: .88rem; }
  .fragiles { margin-top: 14px; border-left: 5px solid var(--orange); }
  .fragiles strong { display: block; color: var(--blue-dark); font-family: Georgia, serif; font-size: 1.05rem; }
  .fragiles p { margin: 4px 0 10px; color: var(--muted); font-size: .88rem; }
  .fragiles ul { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; }
  .fragiles li { display: flex; align-items: baseline; gap: 6px; padding: 6px 12px; border-radius: 999px;
                 background: #fdf0e3; color: #8a4c0a; font-weight: 800; }
  .fragiles li span { font-size: .82rem; font-weight: 600; color: #a15c11; }
  .barre-outils { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
  .barre-outils .espace { margin-left: auto; }
  .fiche { display: none; }
  .fiche h2 { margin-top: 0; }
  .fiche table { font-size: 1rem; }
  .fiche td.code { font-size: 1.15rem; }
  .fiche td.numero { color: var(--muted); font-weight: 800; text-align: right; width: 2.4em; }
  /* Aperçu « code → prénom » dans la boîte « Coller la liste des prénoms ». */
  .apercu { list-style: none; margin: 10px 0 0; padding: 8px 12px; max-height: 200px; overflow: auto;
            background: #fbfcfe; border: 1px solid var(--line); border-radius: 10px;
            font-size: .9rem; line-height: 1.5; }
  .apercu li { display: flex; gap: 8px; align-items: baseline; }
  .apercu li .numero { flex: 0 0 2em; text-align: right; color: var(--muted); font-weight: 800; }
  .apercu li .code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .06em; }
  .apercu li.vide { color: var(--muted); font-style: italic; }
  .apercu li.alerte { color: var(--rouge); font-weight: 700; }
  dialog { border: 0; border-radius: 14px; padding: 18px; max-width: 420px; width: calc(100% - 32px);
           box-shadow: 0 20px 50px rgba(16,41,74,.28); }
  dialog::backdrop { background: rgba(16,41,74,.45); }
  footer { padding: 14px 16px; border-top: 1px solid var(--line); background: var(--paper);
           color: var(--muted); font-size: .82rem; text-align: center; }
  footer a { display: inline-block; padding: 12px 8px; color: var(--muted); }
  [hidden] { display: none !important; }
  /* Sous 700 px, le tableau devient une carte par élève : rien ne déborde,
     tout se lit d'un coup d'œil sur un téléphone. */
  @media (max-width: 700px) {
    .tableau-enveloppe { overflow-x: visible; }
    #tableau, #tableau tbody, #tableau tr, #tableau td { display: block; width: 100%; }
    #tableau thead { display: none; }
    #tableau tr { margin-bottom: 12px; padding: 8px 6px 12px; background: var(--paper);
                  border: 1px solid var(--line); border-left: 5px solid var(--teal); border-radius: 12px; }
    #tableau td { display: flex; align-items: center; gap: 10px; padding: 6px 10px;
                  border: 0; white-space: normal; }
    #tableau td::before { content: attr(data-libelle); flex: 0 0 104px; color: var(--muted);
                          font-size: .74rem; font-weight: 800; text-transform: uppercase;
                          letter-spacing: .04em; }
    #tableau td[data-libelle=""]::before { display: none; }
    #tableau td input { width: 100%; min-height: 44px; }
    #tableau td.actions-eleve { flex-wrap: wrap; gap: 8px; }
    #tableau td.actions-eleve button { flex: 1 1 auto; margin-left: 0 !important; }
  }
  @media print {
    .barre, header, footer, .barre-outils, .actions, #ecran-classe > *:not(.fiche) { display: none !important; }
    body { background: #fff; }
    main { max-width: none; padding: 0; }
    .fiche { display: block; }
    .fiche th, .fiche td { border-bottom: 1px solid #999; }
    .pied-impression { margin-top: 18px; display: flex; align-items: center;
                       justify-content: space-between; font-size: .78rem; color: #444; }
  }
</style>
</head>
<body>
<div class="barre"></div>
<header>
  <img src="https://mathsgo.re/assets/img/mathsgo-logo.png" alt="maths&go">
  <span class="titre">Ma classe</span>
  <span class="droite">
    <span id="qui" hidden></span>
    <button type="button" class="secondaire petit" id="mon-compte" hidden>Mon compte</button>
    <button type="button" class="secondaire petit" id="deconnexion" hidden>Se déconnecter</button>
  </span>
</header>

<main>
  <!-- Connexion -->
  <section id="ecran-connexion">
    <h1>Suivi des élèves</h1>
    <p class="sous">Espace réservé. Cette page n’est pas accessible aux élèves.</p>
    <div class="carte" style="max-width:420px">
      <form id="form-connexion" autocomplete="on">
        <label for="identifiant">Identifiant</label>
        <input id="identifiant" name="username" type="text" autocomplete="username" required>
        <label for="motdepasse">Mot de passe</label>
        <input id="motdepasse" name="password" type="password" autocomplete="current-password" required>
        <div class="actions"><button type="submit">Se connecter</button></div>
      </form>
      <p class="message erreur" id="erreur-connexion" hidden></p>
    </div>
  </section>

  <!-- Liste des classes -->
  <section id="ecran-classes" hidden>
    <h1>Mes classes</h1>
    <p class="sous">Choisis une classe, ou crée-en une nouvelle.</p>
    <ul class="classes" id="liste-classes"></ul>
    <h2>Nouvelle classe</h2>
    <div class="carte" style="max-width:420px">
      <form id="form-classe">
        <label for="libelle">Nom de la classe</label>
        <input id="libelle" type="text" maxlength="40" placeholder="405" required>
        <div class="actions"><button type="submit">Créer la classe</button></div>
      </form>
    </div>
    <p class="message" id="message-classes" hidden></p>

    <!-- Visible seulement pour le compte administrateur. -->
    <div id="bloc-profs" hidden>
      <h2>Professeurs</h2>
      <div class="carte" style="max-width:520px">
        <p class="sous" style="margin-bottom:12px">Chaque professeur ne voit que ses propres classes.
        Pour qu’un collègue voie une de tes classes, ouvre-la et partage-la.</p>
        <ul class="profs" id="liste-profs"></ul>
        <div class="actions">
          <button type="button" class="secondaire" id="ajouter-prof">Ajouter un professeur</button>
        </div>
        <p class="message" id="message-profs" hidden></p>
      </div>
    </div>
  </section>

  <!-- Une classe -->
  <section id="ecran-classe" hidden>
    <button type="button" class="secondaire petit retour-icone" id="retour"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Toutes mes classes</button>
    <h1 id="titre-classe"></h1>
    <p class="sous" id="resume-classe"></p>
    <p class="message" id="bandeau-droit" hidden></p>

    <div class="barre-outils">
      <button type="button" class="secondaire" id="ajouter">Ajouter des élèves</button>
      <button type="button" class="secondaire" id="coller-prenoms">Coller la liste des prénoms</button>
      <button type="button" class="secondaire" id="imprimer">Imprimer la liste des codes</button>
      <label for="tri" style="margin:0;font-size:.88rem;color:var(--muted);font-weight:600">Trier&nbsp;par</label>
      <select id="tri" style="width:auto;min-width:170px">
        <option value="prenom">Prénom</option>
        <option value="acquises">Tables acquises</option>
        <option value="travailler">Calculs à travailler</option>
        <option value="date">Dernière activité</option>
      </select>
      <button type="button" class="danger espace" id="supprimer-classe">Supprimer la classe</button>
    </div>

    <!-- Vue d'ensemble : ce qu'il faut revoir au tableau, pas élève par élève.
         Calculé dans le navigateur à partir des progressions déjà chargées. -->
    <div class="carte fragiles" id="fragiles" hidden>
      <strong>Les calculs qui coincent dans cette classe</strong>
      <p id="fragiles-sous"></p>
      <ul id="fragiles-liste"></ul>
    </div>

    <div class="tableau-enveloppe">
      <table id="tableau">
        <thead>
          <tr>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th>Code</th>
            <th><button type="button" data-tri="acquises">Tables acquises</button></th>
            <th><button type="button" data-tri="travailler">À travailler</button></th>
            <th>Mélange</th>
            <th>Expert</th>
            <th><button type="button" data-tri="date">Dernière activité</button></th>
            <th></th>
          </tr>
        </thead>
        <tbody id="corps"></tbody>
      </table>
    </div>
    <p class="message" id="message-classe" hidden></p>
    <p class="sous note-tableau">Ce tableau est un <strong>indicateur pédagogique, pas une preuve
    d’évaluation</strong> : la progression vient de l’appareil de l’élève, et quiconque connaît son code
    peut la modifier.</p>

    <!-- Partage : visible seulement pour le propriétaire de la classe. -->
    <div id="bloc-partage" hidden>
      <h2>Partager cette classe</h2>
      <div class="carte" style="max-width:560px">
        <p class="sous" style="margin-bottom:12px">Un collègue en <strong>lecture</strong> voit le tableau,
        sans les codes des élèves et sans rien pouvoir changer. En <strong>écriture</strong>, il voit les
        codes — avec un code, on ouvre l'appli comme l'élève et on peut modifier sa progression —,
        il peut ajouter des élèves, saisir les prénoms et donner un nouveau code. Toi seul peux
        supprimer la classe.</p>
        <ul class="profs" id="liste-partages"></ul>
        <div class="actions">
          <button type="button" class="secondaire" id="ajouter-partage">Partager avec un collègue</button>
        </div>
        <p class="message" id="message-partage" hidden></p>
      </div>
    </div>

    <!-- Fiche à imprimer : code ↔ élève -->
    <div class="fiche" id="fiche">
      <h2 id="fiche-titre"></h2>
      <table>
        <thead><tr><th>N°</th><th>Élève</th><th>Code</th><th>Découper</th></tr></thead>
        <tbody id="fiche-corps"></tbody>
      </table>
      <div class="pied-impression">
        <img src="https://mathsgo.re/assets/img/mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
      </div>
    </div>
  </section>

  <!-- Mon compte : changer son mot de passe. Avec un mot de passe temporaire
       (donné par l'administrateur), c'est le seul écran possible tant qu'un
       nouveau n'a pas été choisi — le serveur refuse tout le reste. -->
  <section id="ecran-compte" hidden>
    <button type="button" class="secondaire petit retour-icone" id="retour-compte"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Toutes mes classes</button>
    <h1>Mon compte</h1>
    <p class="sous" id="compte-qui"></p>
    <p class="message info" id="bandeau-temporaire" hidden>Ton mot de passe est temporaire : choisis-en un nouveau
    pour continuer. Il doit faire au moins 12 caractères.</p>
    <div class="carte" style="max-width:420px">
      <form id="form-motdepasse" autocomplete="on">
        <label for="mdp-ancien">Mot de passe actuel</label>
        <input id="mdp-ancien" name="password" type="password" autocomplete="current-password" required>
        <label for="mdp-nouveau">Nouveau mot de passe (12 caractères minimum)</label>
        <input id="mdp-nouveau" name="new-password" type="password" autocomplete="new-password" minlength="12" required>
        <label for="mdp-confirme">Nouveau mot de passe, une deuxième fois</label>
        <input id="mdp-confirme" name="confirm-password" type="password" autocomplete="new-password" minlength="12" required>
        <div class="actions"><button type="submit">Changer mon mot de passe</button></div>
      </form>
      <p class="message" id="message-compte" hidden></p>
    </div>
    <p class="sous" style="margin-top:14px">Après le changement, tes autres appareils seront déconnectés ; celui-ci reste connecté.</p>
  </section>
</main>

<footer>
  <a href="https://mathsgo.re/">mathsgo.re</a> · CC BY-NC-SA 4.0
</footer>

<dialog id="boite">
  <form method="dialog" id="form-boite">
    <p id="boite-texte" style="margin:0 0 10px;font-weight:600"></p>
    <div id="boite-champs"></div>
    <div class="actions" style="justify-content:flex-end">
      <button type="button" class="secondaire" id="boite-non">Annuler</button>
      <button type="submit" id="boite-oui">Confirmer</button>
    </div>
  </form>
</dialog>

<!-- Le moteur de « Mon parcours » du site, servi d'ICI (copie octet pour octet de
     outils/calcul_mental/defi_tables_mon_parcours.js, gardée identique par un test du
     dépôt) : un script chargé d'un autre domaine s'exécuterait avec les droits de la
     session du professeur, la politique de contenu ne l'autorise plus. -->
<script src="defi_tables_mon_parcours.js?v=<?= htmlspecialchars($versionMoteur, ENT_QUOTES) ?>"></script>
<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const PARCOURS = window.MATHSGO_DEFI_TABLES_MON_PARCOURS || null;
  const CLE_JETON = "mathsgo-suivi-jeton";
  let jeton = "";
  let classes = [];
  let classe = null;
  let eleves = [];
  let tri = {colonne: "prenom", sens: 1};
  let venaitDeSeConnecter = false;
  let estAdmin = false;
  let mdpTemporaire = false;
  let identifiant = "";
  let droitClasse = "proprietaire";
  let annuaire = [];

  try { jeton = sessionStorage.getItem(CLE_JETON) || ""; } catch (_) {}

  async function api(action, corps = {}) {
    // Le jeton voyage DANS LE CORPS, et pas seulement dans l'en-tête
    // Authorization : beaucoup d'hébergements Apache (dont OVH) ne transmettent
    // pas cet en-tête à PHP, et le serveur répondrait « session expirée » à
    // chaque action. L'en-tête reste envoyé pour les serveurs qui le passent.
    const charge = Object.assign({action}, corps);
    if (jeton) charge.jeton = jeton;
    const reponse = await fetch("../api/prof.php", {
      method: "POST",
      headers: jeton ? {"Content-Type": "application/json", "Authorization": "Bearer " + jeton}
                     : {"Content-Type": "application/json"},
      body: JSON.stringify(charge),
      cache: "no-store"
    });
    const donnees = await reponse.json().catch(() => null);
    if (!reponse.ok || !donnees || !donnees.ok) {
      const erreur = new Error((donnees && donnees.erreur) || "Le serveur ne répond pas.");
      erreur.statut = reponse.status;
      throw erreur;
    }
    return donnees;
  }

  function messager(id, texte, type) {
    const bloc = $(id);
    bloc.textContent = texte || "";
    bloc.className = "message " + (type || "");
    bloc.hidden = !texte;
  }

  function montrer(ecran) {
    ["ecran-connexion", "ecran-classes", "ecran-classe", "ecran-compte"].forEach(id => { $(id).hidden = id !== ecran; });
    const connecte = ecran !== "ecran-connexion";
    $("deconnexion").hidden = !connecte;
    $("qui").hidden = !connecte;
    // Avec un mot de passe temporaire, « Mon compte » est le seul écran : pas de
    // bouton pour y aller ni pour en sortir.
    $("mon-compte").hidden = !connecte || mdpTemporaire || ecran === "ecran-compte";
    $("retour-compte").hidden = mdpTemporaire;
  }

  async function deconnecter(silencieux) {
    try { if (jeton) await api("deconnexion"); } catch (_) {}
    jeton = "";
    estAdmin = false;
    mdpTemporaire = false;
    identifiant = "";
    droitClasse = "proprietaire";
    annuaire = [];
    try { sessionStorage.removeItem(CLE_JETON); } catch (_) {}
    montrer("ecran-connexion");
    if (!silencieux) messager("erreur-connexion", "", "");
  }

  // Une erreur écrite dans un écran masqué est une erreur perdue : l'utilisateur
  // se retrouve devant un formulaire muet et croit que c'est son mot de passe.
  // Si la zone prévue n'est pas à l'écran, le message va là où il regarde.
  function zoneVisible(id) {
    const bloc = $(id);
    const ecran = bloc && bloc.closest("section");
    return Boolean(bloc) && (!ecran || !ecran.hidden);
  }

  function surErreur(erreur, zone) {
    if (erreur.statut === 401) { deconnecter(true); messager("erreur-connexion", "Session terminée, reconnecte-toi.", "erreur"); return; }
    messager(zoneVisible(zone) ? zone : "erreur-connexion", erreur.message, "erreur");
  }

  // ---------------------------------------------------------------- lecture d'une progression

  function lireProgression(brut) {
    const vide = {acquises: [], melange: "—", etoiles: 0, travailler: null, parcours: null, lisible: Boolean(PARCOURS)};
    if (!PARCOURS || !brut) return vide;
    try {
      const parcours = PARCOURS.normaliserParcours(brut);
      const etat = PARCOURS.etatAffichage(parcours);
      let melange = "—";
      if (etat.melange.visible) melange = etat.melange.aJour ? "à jour" : "à refaire";
      else if (etat.acquises.length === PARCOURS.TABLES.length) melange = "toutes acquises";
      return {
        acquises: etat.acquises,
        melange,
        etoiles: etat.expert.niveau,
        travailler: PARCOURS.calculsATravailler ? PARCOURS.calculsATravailler(parcours) : null,
        parcours,
        lisible: true
      };
    } catch (_) { return vide; }
  }

  function dateLisible(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("fr-FR", {day: "2-digit", month: "2-digit", year: "2-digit"});
  }

  function nomAffiche(eleve) {
    if (!eleve.prenom) return "";
    return eleve.initiale ? `${eleve.prenom} ${eleve.initiale}.` : eleve.prenom;
  }

  // ---------------------------------------------------------------- tableau de la classe

  function trierEleves() {
    const clef = eleve => {
      if (tri.colonne === "acquises") return eleve.lu.acquises.length;
      if (tri.colonne === "travailler") return eleve.lu.travailler ? eleve.lu.travailler.length : -1;
      if (tri.colonne === "date") return eleve.maj_le || "";
      return (eleve.prenom || "￿").toLocaleLowerCase("fr");
    };
    eleves.sort((a, b) => {
      const x = clef(a), y = clef(b);
      if (x < y) return -1 * tri.sens;
      if (x > y) return 1 * tri.sens;
      return (a.code || "").localeCompare(b.code || "");
    });
  }

  function dessinerTableau() {
    trierEleves();
    const ecriture = droitClasse !== "lecture";
    $("tableau").classList.toggle("sans-codes", !ecriture);
    const corps = $("corps");
    corps.textContent = "";

    eleves.forEach(eleve => {
      const ligne = document.createElement("tr");

      const cNom = document.createElement("td");
      const champ = document.createElement("input");
      champ.type = "text";
      champ.value = nomAffiche(eleve);
      champ.placeholder = ecriture ? "Prénom et initiale" : "—";
      champ.maxLength = 44;
      champ.style.minWidth = "132px";
      if (ecriture) champ.addEventListener("change", () => nommer(eleve, champ));
      else { champ.readOnly = true; champ.tabIndex = -1; }
      cNom.appendChild(champ);

      const cCode = document.createElement("td");
      cCode.className = "code";
      cCode.textContent = eleve.code || "";

      const cAcquises = document.createElement("td");
      const nombre = eleve.lu.acquises.length;
      cAcquises.innerHTML = `<span class="pastille ${nombre ? "p-vert" : "p-gris"}">${nombre} / 9</span>`;
      if (nombre) cAcquises.title = "Tables " + eleve.lu.acquises.join(", ");

      const cTravailler = document.createElement("td");
      const combien = eleve.lu.travailler ? eleve.lu.travailler.length : null;
      if (combien === null) {
        cTravailler.innerHTML = '<span class="pastille p-gris">—</span>';
      } else {
        cTravailler.innerHTML = `<span class="pastille ${combien ? "p-orange" : "p-vert"}">${combien}</span>`;
        if (combien) cTravailler.title = eleve.lu.travailler.map(cle => PARCOURS.libelleFait(cle)).join(" · ");
      }

      const cMelange = document.createElement("td");
      const m = eleve.lu.melange;
      cMelange.innerHTML = m === "—"
        ? '<span class="pastille p-gris">—</span>'
        : `<span class="pastille ${m === "à refaire" ? "p-orange" : "p-vert"}">${m}</span>`;

      const cExpert = document.createElement("td");
      cExpert.textContent = eleve.lu.etoiles ? "★".repeat(eleve.lu.etoiles) : "—";
      cExpert.style.color = eleve.lu.etoiles ? "#c9860a" : "var(--muted)";
      cExpert.style.letterSpacing = ".08em";

      const cDate = document.createElement("td");
      const quand = dateLisible(eleve.maj_le);
      cDate.textContent = quand || "rien fait";
      if (!quand) cDate.className = "sans";

      const cActions = document.createElement("td");
      // La fiche vit dans l'appli du site : un seul gabarit, une seule vérité.
      // Depuis le lot 3, elle s'ouvre par un BILLET de lecture demandé au
      // serveur au moment du clic (voirFiche), jamais par le code dans
      // l'adresse : un collègue en lecture seule y a donc droit lui aussi.
      const fiche = document.createElement("button");
      fiche.type = "button";
      fiche.className = "secondaire petit";
      fiche.textContent = "Voir sa fiche";
      fiche.addEventListener("click", () => voirFiche(eleve, fiche));
      cActions.append(fiche);
      if (ecriture && eleve.restaurable) {
        // Le serveur garde la version précédente de chaque progression : un
        // écrasement (par quelqu'un qui avait le code, ou un « Recommencer à
        // zéro » malheureux) se répare d'un clic.
        const restaurer = document.createElement("button");
        restaurer.type = "button";
        restaurer.className = "secondaire petit";
        restaurer.textContent = "Version précédente";
        restaurer.title = "Restaurer la version précédente de sa progression";
        restaurer.addEventListener("click", () => restaurerProgression(eleve));
        cActions.append(restaurer);
      }
      if (ecriture) {
        const regen = document.createElement("button");
        regen.type = "button";
        regen.className = "secondaire petit";
        regen.textContent = "Nouveau code";
        regen.addEventListener("click", () => regenerer(eleve));
        const sup = document.createElement("button");
        sup.type = "button";
        sup.className = "danger petit";
        sup.textContent = "Supprimer";
        sup.addEventListener("click", () => supprimerEleve(eleve));
        cActions.append(regen, sup);
      }

      cNom.dataset.libelle = "";
      cCode.dataset.libelle = "Code";
      cAcquises.dataset.libelle = "Acquises";
      cTravailler.dataset.libelle = "À travailler";
      cMelange.dataset.libelle = "Mélange";
      cExpert.dataset.libelle = "Expert";
      cDate.dataset.libelle = "Activité";
      cActions.dataset.libelle = "";
      cActions.className = "actions-eleve";

      ligne.append(cNom, cCode, cAcquises, cTravailler, cMelange, cExpert, cDate, cActions);
      corps.appendChild(ligne);
    });

    dessinerFragiles();

    const sans = eleves.filter(e => !e.maj_le).length;
    $("resume-classe").textContent = eleves.length
      ? `${eleves.length} élève${eleves.length > 1 ? "s" : ""} · ${sans} n’${sans > 1 ? "ont" : "a"} encore rien fait`
      : "Aucun élève. Commence par en ajouter.";
    if (!PARCOURS) {
      messager("message-classe",
        "La progression ne peut pas être détaillée : le moteur de Défi tables (prof/defi_tables_mon_parcours.js) n’a pas pu être chargé — vérifie qu’il est bien déposé sur le serveur.",
        "erreur");
    }
    dessinerFiche();
  }

  // Ce qu'il faut revoir au tableau lundi matin. Aucune donnée de plus n'est
  // enregistrée : c'est un comptage sur les progressions déjà chargées.
  function dessinerFragiles() {
    const bloc = $("fragiles");
    const liste = $("fragiles-liste");
    liste.textContent = "";
    if (!PARCOURS || !PARCOURS.fragilesDeLaClasse) { bloc.hidden = true; return; }
    const parcoursDeLaClasse = eleves.map(eleve => eleve.lu.parcours).filter(Boolean);
    const fragiles = PARCOURS.fragilesDeLaClasse(parcoursDeLaClasse, {max: 6});
    if (!fragiles.length) { bloc.hidden = true; return; }
    $("fragiles-sous").textContent =
      `Sur ${parcoursDeLaClasse.length} élève${parcoursDeLaClasse.length > 1 ? "s" : ""} qui ont commencé.`;
    fragiles.forEach(fragile => {
      const li = document.createElement("li");
      const nom = document.createElement("b");
      nom.textContent = fragile.libelle;
      const combien = document.createElement("span");
      combien.textContent = `${fragile.eleves} élève${fragile.eleves > 1 ? "s" : ""}`;
      li.append(nom, combien);
      liste.appendChild(li);
    });
    bloc.hidden = false;
  }

  // ---------------------------------------------------------------- feuille imprimée

  // L'ORDRE DE LA FEUILLE IMPRIMÉE, calculé à UN SEUL endroit : les élèves qui
  // ont un prénom d'abord, par prénom, puis ceux qui n'en ont pas encore, par
  // code. « Coller la liste des prénoms » suit exactement cet ordre — c'est ce
  // qui garantit que le prénom n° 3 de la liste collée va au code de la ligne 3
  // de la feuille que le professeur a sous les yeux. Avant le lot 1 (02/09/2026),
  // le collage suivait l'ordre de CRÉATION des codes alors que la feuille les
  // rangeait par code : 8 associations fausses sur 8 en essai, chaque enfant
  // repartait avec le code d'un camarade.
  //
  // Fonction pure : ne modifie ni `eleves` ni le tri du tableau (qui, lui, suit
  // la colonne choisie par le professeur). Les codes se comparent caractère par
  // caractère (majuscules et chiffres) : le même ordre sur tous les navigateurs,
  // donc une feuille imprimée sur un poste et une liste collée sur un autre
  // parlent bien du même ordre.
  function ordreDeLaFeuille(liste) {
    return [...liste].sort((a, b) => {
      const x = (a.prenom || "").toLocaleLowerCase("fr");
      const y = (b.prenom || "").toLocaleLowerCase("fr");
      if (x && !y) return -1;
      if (!x && y) return 1;
      const parPrenom = x.localeCompare(y, "fr");
      if (parPrenom) return parPrenom;
      const cx = a.code || "", cy = b.code || "";
      return cx < cy ? -1 : cx > cy ? 1 : 0;
    });
  }

  function dessinerFiche() {
    $("fiche-titre").textContent = `Codes des élèves — ${classe.libelle}`;
    const corps = $("fiche-corps");
    corps.textContent = "";
    ordreDeLaFeuille(eleves).forEach((eleve, index) => {
      const ligne = document.createElement("tr");
      // Numéro de ligne : la liste collée se lit dans cet ordre, sans ambiguïté.
      const numero = document.createElement("td");
      numero.className = "numero";
      numero.textContent = String(index + 1);
      const nom = document.createElement("td");
      nom.textContent = nomAffiche(eleve) || "—";
      const code = document.createElement("td");
      code.className = "code";
      code.textContent = eleve.code;
      const vide = document.createElement("td");
      vide.textContent = "✂";
      vide.style.color = "#bbb";
      ligne.append(numero, nom, code, vide);
      corps.appendChild(ligne);
    });
  }

  // ---------------------------------------------------------------- actions

  async function chargerClasses() {
    try {
      const donnees = await api("classes.liste");
      classes = donnees.classes || [];
      const liste = $("liste-classes");
      liste.textContent = "";
      classes.forEach(uneClasse => {
        const li = document.createElement("li");
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.innerHTML = "<strong></strong><span></span>";
        bouton.querySelector("strong").textContent = uneClasse.libelle;
        bouton.querySelector("span").textContent =
          `${uneClasse.eleves} élève${uneClasse.eleves > 1 ? "s" : ""}`;
        if (uneClasse.droit !== "proprietaire") {
          bouton.classList.add("partagee");
          const badge = document.createElement("span");
          badge.className = "badge";
          badge.textContent = `partagée par ${uneClasse.proprietaire || "un collègue"} · `
            + (uneClasse.droit === "ecriture" ? "modifiable" : "lecture seule");
          bouton.appendChild(badge);
        }
        bouton.addEventListener("click", () => ouvrirClasse(uneClasse.id));
        li.appendChild(bouton);
        liste.appendChild(li);
      });
      if (!classes.length) {
        const li = document.createElement("li");
        li.style.color = "var(--muted)";
        li.textContent = "Aucune classe pour l’instant.";
        liste.appendChild(li);
      }
      montrer("ecran-classes");
      $("bloc-profs").hidden = !estAdmin;
      if (estAdmin) chargerProfs();
    } catch (erreur) { surErreur(erreur, "message-classes"); }
  }

  async function ouvrirClasse(id) {
    try {
      const donnees = await api("tableau", {classe_id: id, appli: "defi-tables"});
      classe = donnees.classe;
      droitClasse = classe.droit || "proprietaire";
      eleves = (donnees.eleves || []).map(eleve => Object.assign({}, eleve, {lu: lireProgression(eleve.parcours)}));
      $("titre-classe").textContent = classe.libelle;
      messager("message-classe", "", "");
      montrer("ecran-classe");
      appliquerDroits();
      dessinerTableau();
    } catch (erreur) { surErreur(erreur, "message-classes"); }
  }

  // ------------------------------------------------- droits sur la classe ouverte

  function appliquerDroits() {
    const proprietaire = droitClasse === "proprietaire";
    const ecriture = droitClasse !== "lecture";
    $("ajouter").hidden = !ecriture;
    $("coller-prenoms").hidden = !ecriture;
    $("imprimer").hidden = !ecriture;
    $("supprimer-classe").hidden = !proprietaire;
    $("bloc-partage").hidden = !proprietaire;
    messager("message-partage", "", "");
    if (proprietaire) {
      messager("bandeau-droit", "", "");
      chargerPartages();
    } else {
      messager("bandeau-droit", ecriture
        ? "Classe partagée avec toi : tu peux voir et modifier, mais pas supprimer la classe."
        : "Classe partagée avec toi en lecture seule : tu vois la progression, sans les codes des élèves, et tu ne modifies rien.", "info");
    }
  }

  // ------------------------------------------------------------ partage d'une classe

  async function chargerPartages() {
    const liste = $("liste-partages");
    liste.textContent = "";
    try {
      const donnees = await api("partages.liste", {classe_id: classe.id});
      const partages = donnees.partages || [];
      if (!partages.length) {
        const li = document.createElement("li");
        li.className = "vide";
        li.textContent = "Classe non partagée : tu es le seul à la voir.";
        liste.appendChild(li);
        return;
      }
      partages.forEach(partage => {
        const li = document.createElement("li");
        const nom = document.createElement("strong");
        nom.textContent = partage.identifiant;
        const role = document.createElement("span");
        role.className = "role";
        role.textContent = partage.droit === "ecriture" ? "voit et modifie" : "voit seulement";
        const fin = document.createElement("span");
        fin.className = "fin";
        const changer = document.createElement("button");
        changer.type = "button";
        changer.className = "secondaire petit";
        changer.textContent = partage.droit === "ecriture" ? "Passer en lecture" : "Autoriser à modifier";
        changer.addEventListener("click", () => partager(partage.prof_id,
          partage.droit === "ecriture" ? "lecture" : "ecriture"));
        const retirer = document.createElement("button");
        retirer.type = "button";
        retirer.className = "danger petit";
        retirer.textContent = "Retirer";
        retirer.addEventListener("click", () => retirerPartage(partage));
        fin.append(changer, retirer);
        li.append(nom, role, fin);
        liste.appendChild(li);
      });
    } catch (erreur) { surErreur(erreur, "message-partage"); }
  }

  async function partager(profId, droit) {
    try {
      await api("partages.ajouter", {classe_id: classe.id, prof_id: profId, droit});
      await chargerPartages();
      messager("message-partage", "Partage mis à jour.", "ok");
    } catch (erreur) { surErreur(erreur, "message-partage"); }
  }

  async function retirerPartage(partage) {
    const reponse = await demander(`Retirer ${partage.identifiant} de cette classe ? Il ne la verra plus.`);
    if (!reponse) return;
    try {
      await api("partages.supprimer", {classe_id: classe.id, prof_id: partage.prof_id});
      await chargerPartages();
      messager("message-partage", "Partage retiré.", "ok");
    } catch (erreur) { surErreur(erreur, "message-partage"); }
  }

  $("ajouter-partage").addEventListener("click", async () => {
    try {
      annuaire = (await api("profs.annuaire")).profs || [];
    } catch (erreur) { surErreur(erreur, "message-partage"); return; }
    if (!annuaire.length) {
      messager("message-partage",
        estAdmin ? "Aucun autre professeur pour l’instant : crée d’abord un compte depuis « Mes classes »."
                 : "Aucun autre professeur pour l’instant.", "erreur");
      return;
    }
    const reponse = await demander("Avec quel collègue partager cette classe ?", [
      {nom: "prof", libelle: "Professeur",
       options: annuaire.map(prof => ({valeur: String(prof.id), libelle: prof.identifiant}))},
      {nom: "droit", libelle: "Ce qu’il peut faire", valeur: "lecture", options: [
        {valeur: "lecture", libelle: "Voir seulement"},
        {valeur: "ecriture", libelle: "Voir et modifier"}
      ]}
    ]);
    if (!reponse) return;
    partager(parseInt(reponse.prof, 10), reponse.droit === "ecriture" ? "ecriture" : "lecture");
  });

  // ------------------------------------------------------------- comptes professeurs

  async function chargerProfs() {
    const liste = $("liste-profs");
    liste.textContent = "";
    try {
      const donnees = await api("profs.liste");
      (donnees.profs || []).forEach(prof => {
        const li = document.createElement("li");
        const nom = document.createElement("strong");
        nom.textContent = prof.identifiant;
        const role = document.createElement("span");
        role.className = "role";
        const morceaux = [];
        if (prof.identifiant === identifiant) morceaux.push("toi");
        if (prof.admin) morceaux.push("administrateur");
        if (prof.actif === false) morceaux.push("désactivé");
        if (prof.mdp_temporaire) morceaux.push("mot de passe temporaire, pas encore changé");
        // Formulation sans genre : l'application n'a pas à savoir qui est qui.
        morceaux.push(`${prof.classes} classe${prof.classes > 1 ? "s" : ""} créée${prof.classes > 1 ? "s" : ""}`
          + (prof.eleves ? ` (${prof.eleves} élève${prof.eleves > 1 ? "s" : ""})` : ""));
        // « partagée » sans dire par qui : la table des partages n'enregistre pas
        // l'auteur du partage, et ce compte pourra un jour en recevoir d'ailleurs.
        if (prof.partagees) morceaux.push(`${prof.partagees} reçue${prof.partagees > 1 ? "s" : ""} en partage`);
        role.textContent = morceaux.join(" · ");
        li.append(nom, role);
        if (prof.identifiant !== identifiant) {
          // Sur les autres comptes seulement : on ne se réinitialise pas, on ne
          // se désactive pas soi-même (le serveur le refuse aussi).
          const fin = document.createElement("span");
          fin.className = "fin";
          const reinit = document.createElement("button");
          reinit.type = "button";
          reinit.className = "secondaire petit";
          reinit.textContent = "Nouveau mot de passe";
          reinit.title = "Lui donner un mot de passe temporaire, qu'il devra changer";
          reinit.addEventListener("click", () => reinitialiserProf(prof));
          const etat = document.createElement("button");
          etat.type = "button";
          etat.className = prof.actif === false ? "secondaire petit" : "danger petit";
          etat.textContent = prof.actif === false ? "Réactiver" : "Désactiver";
          etat.addEventListener("click", () => (prof.actif === false ? reactiverProf(prof) : desactiverProf(prof)));
          const sup = document.createElement("button");
          sup.type = "button";
          sup.className = "danger petit";
          sup.textContent = "Supprimer";
          sup.title = prof.classes ? "Supprimer le compte et ses classes" : "Supprimer le compte";
          sup.addEventListener("click", () => supprimerProf(prof));
          fin.append(reinit, etat, sup);
          li.append(fin);
        }
        if (prof.actif === false) li.style.opacity = ".7";
        liste.appendChild(li);
      });
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  }

  async function reinitialiserProf(prof) {
    const reponse = await demander(
      `Donner un nouveau mot de passe à ${prof.identifiant} ? Ses sessions ouvertes seront fermées. Tu lui transmets le mot de passe temporaire de vive voix ; il devra en choisir un nouveau à sa prochaine connexion.`);
    if (!reponse) return;
    try {
      const donnees = await api("profs.reinitialiser", {prof_id: prof.id});
      await chargerProfs();
      // Affiché une seule fois : le serveur ne le garde que haché.
      messager("message-profs",
        `Mot de passe temporaire de ${prof.identifiant} : ${donnees.motdepasse} — note-le maintenant, il ne sera plus affiché.`,
        "ok");
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  }

  async function desactiverProf(prof) {
    const reponse = await demander(
      `Désactiver le compte de ${prof.identifiant} ? Il ne pourra plus se connecter. Ses classes, ses élèves et leurs progressions sont conservés ; tu pourras le réactiver.`);
    if (!reponse) return;
    try {
      await api("profs.desactiver", {prof_id: prof.id});
      await chargerProfs();
      messager("message-profs", `Compte de ${prof.identifiant} désactivé.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  }

  async function reactiverProf(prof) {
    try {
      await api("profs.reactiver", {prof_id: prof.id});
      await chargerProfs();
      messager("message-profs", `Compte de ${prof.identifiant} réactivé : il peut se reconnecter avec son mot de passe.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  }

  $("ajouter-prof").addEventListener("click", async () => {
    // Pas de mot de passe à choisir : le serveur en tire un temporaire, affiché
    // une fois, que le collègue remplace à sa première connexion. Personne
    // d'autre que lui ne connaît son vrai mot de passe.
    const reponse = await demander(
      "Nouveau professeur. Choisis-lui un identifiant ; tu recevras un mot de passe temporaire à lui transmettre de vive voix, qu'il changera à sa première connexion.",
      [{nom: "identifiant", libelle: "Identifiant", maxlength: 40}]);
    if (!reponse) return;
    try {
      const donnees = await api("profs.ajouter", {identifiant: reponse.identifiant});
      await chargerProfs();
      messager("message-profs",
        `Compte créé pour ${reponse.identifiant.trim()}. Mot de passe temporaire : ${donnees.motdepasse} — note-le maintenant, il ne sera plus affiché. Il ne verra aucune classe tant que tu ne lui en auras pas partagé une.`,
        "ok");
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  });

  async function supprimerProf(prof) {
    // Un compte qui possède des classes : on dit ce qui part avec, et on
    // propose l'autre voie (désactiver garde tout).
    const classes = prof.classes > 1 ? `ses ${prof.classes} classes` : "sa classe";
    const eleves = `${prof.eleves} élève${prof.eleves > 1 ? "s" : ""}`;
    const question = prof.classes
      ? `Supprimer le compte de ${prof.identifiant} ET ${classes} (${eleves}, avec leurs codes et leurs progressions) ? Cette action est définitive. Pour garder ${prof.classes > 1 ? "ses classes" : "sa classe"}, désactive plutôt le compte.`
      : `Supprimer le compte de ${prof.identifiant} ? Cette action est définitive.`;
    const reponse = await demander(question);
    if (!reponse) return;
    try {
      await api("profs.supprimer", {prof_id: prof.id, avec_classes: Boolean(prof.classes)});
      await chargerProfs();
      messager("message-profs", `Compte de ${prof.identifiant} supprimé.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  }

  async function nommer(eleve, champ) {
    const texte = champ.value.trim().replace(/\s+/g, " ");
    const morceaux = texte.split(" ");
    const prenom = morceaux[0] || "";
    const initiale = (morceaux[1] || "").replace(/\./g, "").slice(0, 1);
    try {
      await api("eleves.nommer", {eleve_id: eleve.id, prenom, initiale});
      eleve.prenom = prenom;
      eleve.initiale = initiale.toUpperCase();
      champ.value = nomAffiche(eleve);
      dessinerFiche();
      messager("message-classe", "", "");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  }

  // options.apercu(valeurs) → liste de {numero, code, texte, classe} affichée
  // sous les champs et recalculée à chaque frappe : ce que « Confirmer » va faire,
  // montré AVANT qu'on le fasse.
  function demander(texte, champs, options) {
    return new Promise(resolve => {
      $("boite-texte").textContent = texte;
      const zone = $("boite-champs");
      zone.textContent = "";
      const lireValeurs = () => {
        const sortie = {};
        (champs || []).forEach(champ => { sortie[champ.nom] = $("boite-" + champ.nom).value; });
        return sortie;
      };
      let apercu = null;
      let rafraichirApercu = () => {};
      if (options && options.apercu) {
        apercu = document.createElement("ul");
        apercu.className = "apercu";
        apercu.id = "boite-apercu";
        rafraichirApercu = () => {
          apercu.textContent = "";
          options.apercu(lireValeurs()).forEach(ligne => {
            const li = document.createElement("li");
            if (ligne.classe) li.className = ligne.classe;
            if (ligne.numero !== undefined) {
              const numero = document.createElement("span");
              numero.className = "numero";
              numero.textContent = ligne.numero + ".";
              li.appendChild(numero);
            }
            if (ligne.code) {
              const code = document.createElement("span");
              code.className = "code";
              code.textContent = ligne.code;
              const fleche = document.createElement("span");
              fleche.textContent = "→";
              li.append(code, fleche);
            }
            const texte = document.createElement("span");
            texte.textContent = ligne.texte;
            li.appendChild(texte);
            apercu.appendChild(li);
          });
        };
      }
      (champs || []).forEach(champ => {
        const etiquette = document.createElement("label");
        etiquette.textContent = champ.libelle;
        etiquette.htmlFor = "boite-" + champ.nom;
        let entree;
        if (champ.multiligne) {
          entree = document.createElement("textarea");
          entree.rows = 8;
          entree.style.width = "100%";
          entree.style.minHeight = "160px";
          entree.style.padding = "8px 12px";
          entree.style.font = "inherit";
          entree.style.border = "2px solid var(--line)";
          entree.style.borderRadius = "10px";
          entree.value = champ.valeur ?? "";
        } else if (champ.options) {
          entree = document.createElement("select");
          champ.options.forEach(option => {
            const choix = document.createElement("option");
            choix.value = option.valeur;
            choix.textContent = option.libelle;
            entree.appendChild(choix);
          });
          entree.value = champ.valeur ?? (champ.options[0] && champ.options[0].valeur) ?? "";
        } else {
          entree = document.createElement("input");
          entree.type = champ.type || "text";
          entree.value = champ.valeur ?? "";
          entree.autocomplete = champ.type === "password" ? "new-password" : "off";
          if (champ.min !== undefined) entree.min = champ.min;
          if (champ.max !== undefined) entree.max = champ.max;
          if (champ.maxlength !== undefined) entree.maxLength = champ.maxlength;
        }
        entree.id = "boite-" + champ.nom;
        zone.append(etiquette, entree);
      });
      if (apercu) {
        zone.appendChild(apercu);
        zone.addEventListener("input", rafraichirApercu);
        rafraichirApercu();
      }
      const boite = $("boite");
      const fermer = valeur => {
        boite.close();
        zone.removeEventListener("input", rafraichirApercu);
        $("form-boite").onsubmit = null;
        $("boite-non").onclick = null;
        resolve(valeur);
      };
      $("form-boite").onsubmit = event => {
        event.preventDefault();
        fermer(lireValeurs());
      };
      $("boite-non").onclick = () => fermer(null);
      boite.showModal();
    });
  }

  $("ajouter").addEventListener("click", async () => {
    const reponse = await demander("Combien d’élèves ajouter à cette classe ?",
      [{nom: "nombre", libelle: "Nombre d’élèves", type: "number", valeur: "25", min: 1, max: 60}]);
    if (!reponse) return;
    const nombre = parseInt(reponse.nombre, 10);
    if (!nombre || nombre < 1 || nombre > 60) {
      messager("message-classe", "Indique un nombre entre 1 et 60.", "erreur"); return;
    }
    try {
      await api("eleves.ajouter", {classe_id: classe.id, nombre});
      await ouvrirClasse(classe.id);
      messager("message-classe", `${nombre} code${nombre > 1 ? "s" : ""} créé${nombre > 1 ? "s" : ""}. Écris les prénoms en face, puis imprime la liste.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  });

  // Coller une liste de prénoms : quatre classes de vingt-huit, c'est cent dix
  // saisies à la main. Les prénoms sont attribués DANS L'ORDRE aux élèves qui
  // n'ont pas encore de nom, pris dans l'ordre de la feuille imprimée
  // (ordreDeLaFeuille : les sans-nom y sont rangés par code, jamais par date de
  // création). La boîte montre « code → prénom » avant qu'on confirme.
  function decouperPrenoms(texte) {
    return String(texte || "")
      .split(/[\r\n;,\t]+/)
      .map(morceau => morceau.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  // Les élèves sans prénom, dans l'ordre de la feuille imprimée.
  function sansPrenomDansLOrdre(liste) {
    return ordreDeLaFeuille(liste).filter(eleve => !eleve.prenom);
  }

  // Ce que le collage va faire, ligne par ligne, pour l'aperçu de la boîte.
  function apercuCollage(prenoms, sansNom) {
    if (!prenoms.length) return [{texte: "Colle les prénoms : l’aperçu s’affiche ici.", classe: "vide"}];
    const lignes = prenoms.slice(0, sansNom.length).map((prenom, index) =>
      ({numero: index + 1, code: sansNom[index].code, texte: prenom}));
    if (prenoms.length > sansNom.length) {
      const trop = prenoms.length - sansNom.length;
      lignes.push({texte: `${trop} prénom(s) en trop (${prenoms.slice(sansNom.length).join(", ")}) : ajoute des élèves ou enlève-les.`, classe: "alerte"});
    } else if (prenoms.length < sansNom.length) {
      const reste = sansNom.length - prenoms.length;
      lignes.push({texte: `${reste} code(s) restent sans prénom.`, classe: "vide"});
    }
    return lignes;
  }

  $("coller-prenoms").addEventListener("click", async () => {
    const bouton = $("coller-prenoms");
    if (bouton.disabled) return;
    // Désactivé jusqu'à la fin de la boucle : un double clic ne lance pas deux
    // collages sur les mêmes élèves.
    bouton.disabled = true;
    try {
      // La liste est rechargée AVANT de calculer l'ordre : un prénom saisi
      // entre-temps (autre onglet, collègue en écriture) ne décale pas tout.
      await ouvrirClasse(classe.id);
      const sansNom = sansPrenomDansLOrdre(eleves);
      if (!sansNom.length) {
        messager("message-classe", "Tous les élèves de cette classe ont déjà un prénom. Pour en changer un, écris directement dans le tableau.", "erreur");
        return;
      }
      const reponse = await demander(
        `Colle les prénoms, un par ligne, dans l’ordre de la feuille imprimée (numéros 1, 2, 3…). Ils iront aux ${sansNom.length} élève(s) qui n’ont pas encore de nom. Vérifie l’aperçu avant de confirmer.`,
        [{nom: "liste", libelle: "Un prénom par ligne (tu peux ajouter l’initiale : « Léa B »)", multiligne: true}],
        {apercu: valeurs => apercuCollage(decouperPrenoms(valeurs.liste), sansNom)});
      if (!reponse) return;
      const prenoms = decouperPrenoms(reponse.liste);
      if (!prenoms.length) {
        messager("message-classe", "Aucun prénom trouvé dans ce que tu as collé.", "erreur");
        return;
      }
      if (prenoms.length > sansNom.length) {
        messager("message-classe",
          `Tu as collé ${prenoms.length} prénoms pour ${sansNom.length} élève(s) sans nom. Ajoute d’abord des élèves, ou enlève les prénoms en trop.`,
          "erreur");
        return;
      }
      messager("message-classe", "Saisie en cours…", "");
      for (let index = 0; index < prenoms.length; index += 1) {
        const eleve = sansNom[index];
        const morceaux = prenoms[index].split(" ");
        const prenom = morceaux[0] || "";
        const initiale = (morceaux[1] || "").replace(/\./g, "").slice(0, 1);
        await api("eleves.nommer", {eleve_id: eleve.id, prenom, initiale});
      }
      await ouvrirClasse(classe.id);
      messager("message-classe",
        `${prenoms.length} prénom(s) enregistré(s). Vérifie l’ordre dans le tableau, puis imprime la liste des codes.`,
        "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
    finally { bouton.disabled = false; }
  });

  // « Voir sa fiche » (lot 3) : un billet de lecture, à usage unique, valable
  // deux minutes, glissé dans l'adresse de l'appli à la place du code — le
  // code n'entre plus dans l'historique de ce navigateur. L'onglet est ouvert
  // AVANT d'attendre le serveur (les navigateurs ne laissent ouvrir une
  // fenêtre que dans le geste du clic), puis dirigé vers la fiche.
  async function voirFiche(eleve, bouton) {
    const fenetre = window.open("about:blank", "_blank");
    if (fenetre) { try { fenetre.opener = null; } catch (_) {} }
    if (bouton) bouton.disabled = true;
    try {
      const r = await api("eleves.fiche", {eleve_id: eleve.id});
      const adresse = `https://mathsgo.re/outils/calcul_mental/defi_tables.html#b=${encodeURIComponent(r.billet)}&vue=fiche`;
      if (fenetre) fenetre.location.href = adresse;
      else window.location.assign(adresse);
    } catch (erreur) {
      if (fenetre) { try { fenetre.close(); } catch (_) {} }
      surErreur(erreur, "message-classe");
    } finally {
      if (bouton) bouton.disabled = false;
    }
  }

  async function regenerer(eleve) {
    const reponse = await demander(
      `Donner un nouveau code à ${nomAffiche(eleve) || "cet élève"} ? L’ancien (${eleve.code}) ne marchera plus. La progression est conservée.`);
    if (!reponse) return;
    try {
      const donnees = await api("eleves.regenerer", {eleve_id: eleve.id});
      eleve.code = donnees.code;
      dessinerTableau();
      messager("message-classe", `Nouveau code : ${donnees.code}`, "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  }

  async function restaurerProgression(eleve) {
    const reponse = await demander(
      `Revenir à la version précédente de la progression de ${nomAffiche(eleve) || "cet élève"} ? La version actuelle devient la « précédente » : tu pourras refaire l’inverse.`);
    if (!reponse) return;
    try {
      await api("eleves.restaurer", {eleve_id: eleve.id, appli: "defi-tables"});
      await ouvrirClasse(classe.id);
      messager("message-classe", "Version précédente restaurée. L’appli de l’élève la récupérera à sa prochaine ouverture.", "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  }

  async function supprimerEleve(eleve) {
    const reponse = await demander(
      `Supprimer ${nomAffiche(eleve) || "cet élève"} et toute sa progression ? Cette action est définitive.`);
    if (!reponse) return;
    try {
      await api("eleves.supprimer", {eleve_id: eleve.id});
      eleves = eleves.filter(autre => autre.id !== eleve.id);
      dessinerTableau();
      messager("message-classe", "Élève supprimé.", "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  }

  $("supprimer-classe").addEventListener("click", async () => {
    const reponse = await demander(
      `Supprimer la classe ${classe.libelle}, ses ${eleves.length} élève(s) et toutes leurs progressions ? Cette action est définitive.`);
    if (!reponse) return;
    try {
      await api("classes.supprimer", {classe_id: classe.id});
      await chargerClasses();
      messager("message-classes", "Classe supprimée.", "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  });

  $("imprimer").addEventListener("click", () => window.print());
  $("retour").addEventListener("click", () => { chargerClasses(); });

  document.querySelectorAll("th button[data-tri]").forEach(bouton => {
    bouton.addEventListener("click", () => {
      const colonne = bouton.dataset.tri;
      tri = {colonne, sens: tri.colonne === colonne ? -tri.sens : (colonne === "prenom" ? 1 : -1)};
      $("tri").value = colonne;
      dessinerTableau();
    });
  });

  $("tri").addEventListener("change", event => {
    const colonne = event.target.value;
    tri = {colonne, sens: colonne === "prenom" ? 1 : -1};
    dessinerTableau();
  });

  $("form-classe").addEventListener("submit", async event => {
    event.preventDefault();
    const libelle = $("libelle").value.trim();
    if (!libelle) return;
    try {
      const donnees = await api("classes.creer", {libelle, applis: ["defi-tables"]});
      $("libelle").value = "";
      await chargerClasses();
      ouvrirClasse(donnees.id);
    } catch (erreur) { surErreur(erreur, "message-classes"); }
  });

  $("form-connexion").addEventListener("submit", async event => {
    event.preventDefault();
    messager("erreur-connexion", "", "");
    try {
      const reponse = await fetch("../api/prof.php", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          action: "connexion",
          identifiant: $("identifiant").value,
          motdepasse: $("motdepasse").value
        })
      });
      const donnees = await reponse.json().catch(() => null);
      if (!reponse.ok || !donnees || !donnees.ok) {
        messager("erreur-connexion", (donnees && donnees.erreur) || "Connexion impossible.", "erreur");
        return;
      }
      jeton = donnees.jeton;
      try { sessionStorage.setItem(CLE_JETON, jeton); } catch (_) {}
      $("motdepasse").value = "";
      venaitDeSeConnecter = true;
      demarrer().finally(() => { venaitDeSeConnecter = false; });
    } catch (_) {
      messager("erreur-connexion", "Le serveur ne répond pas.", "erreur");
    }
  });

  $("deconnexion").addEventListener("click", () => deconnecter(false));

  // ------------------------------------------------------------------ mon compte

  function ouvrirCompte() {
    $("compte-qui").textContent = identifiant ? `Connecté en tant que ${identifiant}.` : "";
    $("bandeau-temporaire").hidden = !mdpTemporaire;
    messager("message-compte", "", "");
    ["mdp-ancien", "mdp-nouveau", "mdp-confirme"].forEach(id => { $(id).value = ""; });
    montrer("ecran-compte");
    $("mdp-ancien").focus();
  }

  $("mon-compte").addEventListener("click", ouvrirCompte);
  $("retour-compte").addEventListener("click", () => { chargerClasses(); });

  $("form-motdepasse").addEventListener("submit", async event => {
    event.preventDefault();
    const ancien = $("mdp-ancien").value;
    const nouveau = $("mdp-nouveau").value;
    if (nouveau.length < 12) { messager("message-compte", "Le nouveau mot de passe doit faire au moins 12 caractères.", "erreur"); return; }
    if (nouveau !== $("mdp-confirme").value) { messager("message-compte", "Les deux saisies du nouveau mot de passe ne sont pas identiques.", "erreur"); return; }
    try {
      await api("profs.motdepasse", {ancien, nouveau});
      mdpTemporaire = false;
      ["mdp-ancien", "mdp-nouveau", "mdp-confirme"].forEach(id => { $(id).value = ""; });
      await chargerClasses();
      messager("message-classes", "Mot de passe changé. Tes autres appareils sont déconnectés.", "ok");
    } catch (erreur) { surErreur(erreur, "message-compte"); }
  });

  // Une seule porte d'entrée : on demande qui on est (et si on est administrateur),
  // puis on affiche les classes.
  function demarrer() {
    return api("moi").then(donnees => {
      identifiant = donnees.identifiant;
      $("qui").textContent = donnees.identifiant;
      estAdmin = Boolean(donnees.admin);
      mdpTemporaire = Boolean(donnees.mdp_temporaire);
      if (mdpTemporaire) { ouvrirCompte(); return undefined; }
      return chargerClasses();
    }).catch(erreur => {
      deconnecter(true);
      if (!erreur) return;
      // Un refus juste après avoir tapé son mot de passe n'est PAS une session
      // expirée : c'est que le serveur n'a pas reçu le jeton qu'il vient de
      // donner. On le dit, au lieu de renvoyer l'utilisateur à un écran muet.
      if (erreur.statut === 401) {
        if (!venaitDeSeConnecter) return;
        messager("erreur-connexion",
          "Le serveur n'a pas gardé ta connexion. Préviens Gwenaël : le jeton de session ne lui parvient pas.",
          "erreur");
        return;
      }
      messager("erreur-connexion", erreur.message || "Le serveur ne répond pas.", "erreur");
    });
  }

  if (jeton) demarrer();
})();
</script>
</body>
</html>
