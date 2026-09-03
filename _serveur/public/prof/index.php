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
<!-- Lot 7 : les icônes et le logo sont servis d'ICI. Avant, mathsgo.re (et
     tout ce qui est devant lui) apprenait l'adresse IP et l'horaire de chaque
     ouverture de l'espace des professeurs, à chaque fois, y compris avant la
     connexion. Copies octet pour octet des fichiers du dépôt, vérifiées par un
     test ; la politique de contenu n'autorise plus d'image d'ailleurs. -->
<link rel="icon" href="../favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
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
  /* Le papier (lot 7). Deux impressions distinctes, jamais ensemble : les
     BANDELETTES à distribuer (adresse, code, consigne — aucun prénom du côté
     donné à l'élève) et la FEUILLE prénom ↔ code, que le professeur garde.
     À l'écran, ni l'une ni l'autre ne s'affiche. */
  .fiche, .bandelettes, .note-impression { display: none; }
  .fiche h2 { margin-top: 0; }
  .fiche table { font-size: 1rem; }
  .fiche td.code { font-size: 1.15rem; }
  .fiche td.numero { color: var(--muted); font-weight: 800; text-align: right; width: 2.4em; }
  .avertissement-papier { margin: 0 0 6mm; padding: 3mm 4mm; border: 1px solid #999;
                          border-radius: 2mm; font-size: .82rem; color: #333; }
  .bandelettes h2 { margin: 0 0 2mm; }
  .bandelettes-liste { list-style: none; margin: 0; padding: 0; }
  /* Une bandelette = une souche (le professeur la détache et la garde : le
     numéro et le prénom, JAMAIS le code) et la partie remise à l'élève
     (l'adresse, le code, la consigne, JAMAIS le prénom). Séparées, aucune des
     deux n'associe un enfant à un code : ce lien n'existe que sur la feuille
     récapitulative, imprimée à part. */
  .bandelette { display: flex; align-items: stretch; margin: 0 0 2mm; line-height: 1.35;
                border: 1px dashed #8a8a8a; border-radius: 2mm;
                break-inside: avoid; page-break-inside: avoid; }
  .bandelette .souche { flex: 0 0 40mm; display: flex; align-items: center; gap: 3mm;
                        padding: 2mm 3mm; border-right: 1px dashed #8a8a8a; }
  .bandelette .souche .numero { font-weight: 800; color: #666; font-size: .85rem; }
  .bandelette .souche .nom { font-weight: 700; }
  .bandelette .part { flex: 1; padding: 2mm 4mm; }
  .bandelette .marque { font-family: Georgia, serif; font-weight: 700; font-size: .88rem; color: #063f86; }
  .bandelette .marque .appli { margin-left: 6px; font-family: inherit; font-weight: 400; color: #444; }
  .bandelette .adresse { font-weight: 700; font-size: .98rem; }
  .bandelette .code-ligne { display: flex; align-items: baseline; gap: 3mm; }
  .bandelette .code-ligne .etiquette { font-size: .8rem; color: #444; }
  .bandelette .code-ligne .code { font-family: ui-monospace, Consolas, monospace;
                                  font-size: 1.25rem; font-weight: 800; letter-spacing: .12em; }
  .bandelette .consigne { font-size: .78rem; }
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
    @page { margin: 12mm; }
    .barre, header, footer, .barre-outils, .actions,
    #ecran-classe > *:not(.fiche):not(.bandelettes):not(.note-impression) { display: none !important; }
    body { background: #fff; }
    main { max-width: none; padding: 0; }
    /* Le bouton pose la classe sur <body> juste avant window.print() et
       l'enlève au retour (afterprint) : une seule des deux feuilles sort, et
       celle qu'on a demandée. Sans classe — un Ctrl+P direct —, on n'imprime
       pas les codes de la classe par surprise : on imprime le mode d'emploi. */
    body.imprime-recap .fiche { display: block; }
    body.imprime-bandelettes .bandelettes { display: block; }
    body:not(.imprime-recap):not(.imprime-bandelettes) .note-impression { display: block; }
    .fiche th, .fiche td { border-bottom: 1px solid #999; }
    .pied-impression { margin-top: 18px; display: flex; align-items: center;
                       justify-content: space-between; font-size: .78rem; color: #444; }
  }
</style>
</head>
<body>
<div class="barre"></div>
<header>
  <img src="../mathsgo-logo.png" alt="maths&go">
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
        <div class="actions"><button type="submit" id="creer-classe">Créer la classe</button></div>
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
      <button type="button" class="secondaire" id="imprimer-bandelettes">Imprimer les bandelettes</button>
      <button type="button" class="secondaire" id="imprimer-recap">Imprimer la feuille prénom&nbsp;↔&nbsp;code</button>
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

    <!-- Ce qui sort de l'imprimante (lot 7).

         1. LES BANDELETTES, à découper et à distribuer. La partie remise à
            l'enfant porte l'adresse, son code et la consigne, et RIEN d'autre :
            une bandelette trouvée par terre est un code sans nom. La souche,
            que le professeur détache et garde, porte le numéro et le prénom, et
            PAS le code : une souche perdue est un nom sans code.
         2. LA FEUILLE PRÉNOM ↔ CODE, imprimée à part. C'est le seul papier qui
            associe les deux ; il est fait pour rester dans le classeur du
            professeur, et il le dit en haut. -->
    <div class="bandelettes" id="bandelettes">
      <h2 id="bandelettes-titre"></h2>
      <p class="avertissement-papier">Découpe sur les pointillés. Tu détaches la souche de gauche
      (numéro et prénom) et tu la gardes ; l’élève reçoit la partie de droite, qui ne porte pas son
      prénom. Les numéros sont les mêmes que sur la feuille prénom ↔ code.</p>
      <ul class="bandelettes-liste" id="bandelettes-liste"></ul>
      <div class="pied-impression">
        <img src="../mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
      </div>
    </div>

    <div class="fiche" id="fiche">
      <h2 id="fiche-titre"></h2>
      <p class="avertissement-papier">Feuille à garder : c’est le seul papier qui associe un prénom
      à un code. Ne la laisse pas sur l’imprimante ni sur ton bureau ; jette-la à la déchiqueteuse
      quand elle ne sert plus.</p>
      <table>
        <thead><tr><th>N°</th><th>Élève</th><th>Code</th></tr></thead>
        <tbody id="fiche-corps"></tbody>
      </table>
      <div class="pied-impression">
        <img src="../mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
      </div>
    </div>

    <!-- Ctrl+P sans passer par un bouton : on n'imprime pas les codes par
         surprise, on explique quel bouton appuyer. -->
    <div class="note-impression">
      <h2>Que veux-tu imprimer ?</h2>
      <p>Reviens à la page et choisis un bouton : <strong>« Imprimer les bandelettes »</strong>
      (une par élève, à découper et à distribuer) ou <strong>« Imprimer la feuille prénom ↔ code »</strong>
      (celle que tu gardes). Chaque bouton n’imprime que sa feuille.</p>
      <div class="pied-impression">
        <img src="../mathsgo-logo-print.png" alt="maths&go" style="height:26px">
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

<!-- Un secret que l'on ne montre qu'une fois (mot de passe temporaire d'un
     collègue). Avant, il restait écrit en clair dans la page jusqu'à la
     navigation suivante — sur un vidéoprojecteur ou un poste partagé, pour une
     durée indéterminée. -->
<dialog id="secret">
  <p id="secret-texte" style="margin:0 0 10px;font-weight:600"></p>
  <p style="margin:0 0 6px"><code id="secret-valeur" style="display:block;padding:10px 12px;
     background:#eef3f9;border-radius:10px;font-family:ui-monospace,Consolas,monospace;
     font-size:1.15rem;font-weight:700;letter-spacing:.06em;word-break:break-all"></code></p>
  <p class="sous" style="margin:0;font-size:.86rem">Note-le maintenant : il ne sera plus affiché.
  Il s’efface tout seul au bout de deux minutes.</p>
  <div class="actions" style="justify-content:flex-end">
    <button type="button" class="secondaire" id="secret-copier">Copier</button>
    <button type="button" id="secret-note">J’ai noté</button>
  </div>
</dialog>

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
  // Un mot à dire après le rechargement de la page : la déconnexion recharge,
  // et un message écrit avant serait emporté. Il vit le temps d'un onglet.
  const CLE_AVIS = "mathsgo-suivi-avis";
  const AVIS = {
    inactivite: "Tu as été déconnecté après 30 minutes sans rien faire sur cette page. Reconnecte-toi.",
    "serveur-muet": "Déconnexion faite sur cet appareil, mais le serveur n’a pas répondu. Si tu es sur un poste partagé, change ton mot de passe."
  };
  // Poste partagé : au bout de ce temps sans un geste, la page se déconnecte
  // seule. Le serveur, lui, ferme la session au bout de DUREE_SESSION_HEURES.
  const INACTIVITE_MS = 30 * 60 * 1000;
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

  // ------------------------------------------------------- verrou d'inactivité
  //
  // Sur un poste de salle des profs, l'onglet reste ouvert entre deux cours :
  // F5, retour arrière, onglet minimisé rouvert trois heures plus tard, on
  // retombait sur « Mes classes » sans rien taper. On mesure le TEMPS ÉCOULÉ
  // (l'horloge), pas un minuteur : une machine mise en veille n'avance pas ses
  // setTimeout, mais l'heure, elle, avance quand même.
  function creerVeille(delaiMs) {
    let dernier = 0;
    return {
      geste(maintenant) { if (dernier > 0) dernier = maintenant; },
      demarrer(maintenant) { dernier = maintenant; },
      arreter() { dernier = 0; },
      active() { return dernier > 0; },
      doitFermer(maintenant) { return dernier > 0 && (maintenant - dernier) >= delaiMs; }
    };
  }
  const veille = creerVeille(INACTIVITE_MS);

  // ------------------------------------------------------ redessins et saisies
  //
  // `nommer()` est asynchrone. Cliquer sur un en-tête de tri fait d'abord
  // perdre le focus au champ (donc partir la saisie), puis redessinait le
  // tableau à partir d'un prénom pas encore mis à jour : la correction
  // disparaissait de l'écran alors qu'elle était en base, et la collègue la
  // retapait dans la ligne d'un AUTRE élève. Ici, un redessin demandé pendant
  // qu'une saisie est en vol attend la dernière réponse.
  function creerFileRedessin(dessiner) {
    let enVol = 0;
    let enAttente = false;
    return {
      debut() { enVol += 1; },
      fin() {
        enVol = Math.max(0, enVol - 1);
        if (enVol === 0 && enAttente) { enAttente = false; dessiner(); }
      },
      demander() {
        if (enVol > 0) { enAttente = true; return false; }
        dessiner();
        return true;
      },
      combien() { return enVol; },
      enAttente() { return enAttente; }
    };
  }
  const redessin = creerFileRedessin(() => dessinerTableau());

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

  // ------------------------------------------------------------ se déconnecter
  //
  // Tout ce que la page peut contenir d'un élève ou d'un collègue. Après
  // « Se déconnecter », l'écran montrait bien le formulaire de connexion —
  // mais les 28 prénoms et les 28 codes étaient toujours dans le document :
  // Ctrl+U, Ctrl+S, l'inspecteur ou une extension les lisaient encore.
  const ZONES_TEXTE = ["corps", "fiche-corps", "fiche-titre", "bandelettes-liste",
    "bandelettes-titre", "liste-classes", "liste-profs", "liste-partages", "fragiles-liste",
    "fragiles-sous", "titre-classe", "resume-classe", "qui", "compte-qui", "boite-texte",
    "boite-champs", "secret-texte", "secret-valeur"];
  const ZONES_MESSAGE = ["erreur-connexion", "message-classes", "message-classe",
    "message-profs", "message-partage", "message-compte", "bandeau-droit"];
  const CHAMPS_A_VIDER = ["identifiant", "motdepasse", "libelle",
    "mdp-ancien", "mdp-nouveau", "mdp-confirme"];
  const BLOCS_A_CACHER = ["fiche", "bandelettes", "fragiles", "bloc-partage", "bloc-profs"];

  function viderZones() {
    ZONES_TEXTE.forEach(id => { const noeud = $(id); if (noeud) noeud.textContent = ""; });
    ZONES_MESSAGE.forEach(id => { const noeud = $(id); if (noeud) { noeud.textContent = ""; noeud.hidden = true; } });
    CHAMPS_A_VIDER.forEach(id => { const noeud = $(id); if (noeud) noeud.value = ""; });
    BLOCS_A_CACHER.forEach(id => { const noeud = $(id); if (noeud) noeud.hidden = true; });
    ["boite", "secret"].forEach(id => {
      const boite = $(id);
      if (boite && boite.open) { try { boite.close(); } catch (_) {} }
    });
  }

  function oublierEtat() {
    jeton = "";
    classes = [];
    classe = null;
    eleves = [];
    estAdmin = false;
    mdpTemporaire = false;
    identifiant = "";
    droitClasse = "proprietaire";
    annuaire = [];
    tri = {colonne: "prenom", sens: 1};
    veille.arreter();
  }

  function poserAvis(cle) {
    try { sessionStorage.setItem(CLE_AVIS, cle); } catch (_) {}
  }

  function lireAvis() {
    let cle = "";
    try { cle = sessionStorage.getItem(CLE_AVIS) || ""; sessionStorage.removeItem(CLE_AVIS); } catch (_) {}
    return AVIS[cle] || "";
  }

  // Fermer la session côté serveur. Le jeton est passé en paramètre parce qu'à
  // ce moment-là la page l'a déjà oublié : on vide d'abord, on prévient le
  // serveur ensuite. Deux essais — un wifi de collège qui hoquette ne doit pas
  // laisser une session ouverte pour rien.
  async function fermerSession(jetonAFermer) {
    if (!jetonAFermer) return true;
    for (let essai = 0; essai < 2; essai += 1) {
      try {
        const reponse = await fetch("../api/prof.php", {
          method: "POST",
          headers: {"Content-Type": "application/json", "Authorization": "Bearer " + jetonAFermer},
          body: JSON.stringify({action: "deconnexion", jeton: jetonAFermer}),
          cache: "no-store"
        });
        // 401 : la session n'existe déjà plus, c'est le résultat voulu.
        if (reponse.ok || reponse.status === 401) return true;
      } catch (_) {}
    }
    return false;
  }

  // On vide l'état ET le document AVANT toute attente : si le réseau traîne ou
  // si le rechargement tarde, la page ne contient déjà plus rien.
  function deconnecter(options) {
    const opt = options || {};
    const jetonAFermer = jeton;
    oublierEtat();
    viderZones();
    try { sessionStorage.removeItem(CLE_JETON); } catch (_) {}
    if (opt.avis) poserAvis(opt.avis);
    montrer("ecran-connexion");
    if (opt.message) messager("erreur-connexion", opt.message, "erreur");
    const fin = fermerSession(jetonAFermer);
    if (opt.recharger) {
      fin.then(serveurOk => {
        if (!serveurOk) poserAvis("serveur-muet");
        location.reload();
      });
    }
    return fin;
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
    if (erreur.statut === 401) { deconnecter({message: "Session terminée, reconnecte-toi."}); return; }
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
    dessinerPapier();
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
    $("fiche-titre").textContent = `Prénom ↔ code — ${classe.libelle}`;
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
      ligne.append(numero, nom, code);
      corps.appendChild(ligne);
    });
  }

  // LES BANDELETTES. Même ordre et mêmes numéros que la feuille prénom ↔ code
  // (ordreDeLaFeuille, une seule fonction pour les deux) : la ligne 3 de la
  // feuille est la bandelette n° 3.
  //
  // Ce qui part chez l'enfant : l'adresse où entrer, son code, et « ton code
  // est personnel ». Pas son prénom — une bandelette ramassée par terre ne dit
  // pas de qui elle est. Ce que le professeur détache et garde : le numéro et
  // le prénom. Pas le code — une souche oubliée n'ouvre rien.
  const CONSIGNE_BANDELETTE = "Ton code est personnel : ne le prête à personne.";
  const ADRESSE_ELEVE = "suivi.mathsgo.re";

  function dessinerBandelettes() {
    $("bandelettes-titre").textContent = `Bandelettes à découper — ${classe.libelle}`;
    const liste = $("bandelettes-liste");
    liste.textContent = "";
    ordreDeLaFeuille(eleves).forEach((eleve, index) => {
      const item = document.createElement("li");
      item.className = "bandelette";

      const souche = document.createElement("div");
      souche.className = "souche";
      const numero = document.createElement("span");
      numero.className = "numero";
      numero.textContent = `n° ${index + 1}`;
      const nom = document.createElement("span");
      nom.className = "nom";
      nom.textContent = nomAffiche(eleve) || "—";
      souche.append(numero, nom);

      const part = document.createElement("div");
      part.className = "part";
      const marque = document.createElement("div");
      marque.className = "marque";
      marque.textContent = "maths&go";
      const appli = document.createElement("span");
      appli.className = "appli";
      appli.textContent = "Défi tables";
      marque.appendChild(appli);
      const adresse = document.createElement("div");
      adresse.className = "adresse";
      adresse.textContent = ADRESSE_ELEVE;
      const ligneCode = document.createElement("div");
      ligneCode.className = "code-ligne";
      const etiquette = document.createElement("span");
      etiquette.className = "etiquette";
      etiquette.textContent = "ton code";
      const code = document.createElement("span");
      code.className = "code";
      code.textContent = eleve.code;
      ligneCode.append(etiquette, code);
      const consigne = document.createElement("div");
      consigne.className = "consigne";
      consigne.textContent = CONSIGNE_BANDELETTE;
      part.append(marque, adresse, ligneCode, consigne);

      item.append(souche, part);
      liste.appendChild(item);
    });
  }

  // En lecture seule, le serveur ne donne pas les codes : la feuille sortait
  // avec 28 lignes vides sous le titre « Codes des élèves », et la collègue
  // croyait à une panne. Maintenant elle n'est simplement pas construite.
  function dessinerPapier() {
    const ecriture = droitClasse !== "lecture";
    $("fiche").hidden = !ecriture;
    $("bandelettes").hidden = !ecriture;
    if (!ecriture) {
      $("fiche-corps").textContent = "";
      $("bandelettes-liste").textContent = "";
      $("fiche-titre").textContent = "";
      $("bandelettes-titre").textContent = "";
      return;
    }
    dessinerFiche();
    dessinerBandelettes();
  }

  // Une impression à la fois, et seulement celle qu'on a demandée.
  function imprimer(quoi) {
    if (droitClasse === "lecture") return false;
    const classeCss = quoi === "bandelettes" ? "imprime-bandelettes" : "imprime-recap";
    document.body.classList.add(classeCss);
    const nettoyer = () => {
      document.body.classList.remove(classeCss);
      window.removeEventListener("afterprint", nettoyer);
    };
    window.addEventListener("afterprint", nettoyer);
    // Filet : si le navigateur n'envoie jamais « afterprint » (impression
    // annulée d'une drôle de façon), la classe ne reste pas collée au <body>.
    setTimeout(nettoyer, 60000);
    window.print();
    return true;
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
    $("imprimer-bandelettes").hidden = !ecriture;
    $("imprimer-recap").hidden = !ecriture;
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
        changer.addEventListener("click", () => demanderPuisPartager(partage,
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

  // Passer un collègue en écriture, c'est lui donner LES CODES de la classe —
  // et avec un code on ouvre l'appli comme l'enfant. « Retirer » est juste à
  // côté et demande confirmation, lui : la protection était du mauvais côté.
  // Retirer un droit ne donne rien à personne : pas de question dans ce sens.
  function texteConfirmationPartage(identifiantCollegue, droit, nombreEleves) {
    if (droit !== "ecriture") return "";
    const combien = nombreEleves === 1
      ? "le code de l’élève"
      : (nombreEleves > 1 ? `les ${nombreEleves} codes des élèves` : "les codes des élèves");
    return `Autoriser ${identifiantCollegue} à modifier cette classe ? Il verra ${combien}`
      + " — avec un code, on ouvre l’appli comme l’élève et on peut changer sa progression —,"
      + " et il pourra ajouter des élèves, saisir les prénoms et donner de nouveaux codes.";
  }

  async function demanderPuisPartager(partage, droit) {
    const question = texteConfirmationPartage(partage.identifiant, droit, eleves.length);
    if (question && !await demander(question)) return;
    partager(partage.prof_id, droit);
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
    const droit = reponse.droit === "ecriture" ? "ecriture" : "lecture";
    const choisi = annuaire.find(prof => String(prof.id) === String(reponse.prof));
    const question = texteConfirmationPartage(choisi ? choisi.identifiant : "ce collègue", droit, eleves.length);
    if (question && !await demander(question)) return;
    partager(parseInt(reponse.prof, 10), droit);
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
      // Affiché une seule fois, DANS UNE BOÎTE que l'on referme : le serveur ne
      // le garde que haché, et il n'a pas à rester en clair dans la page.
      messager("message-profs", `Nouveau mot de passe temporaire pour ${prof.identifiant}.`, "ok");
      montrerSecret(`Mot de passe temporaire de ${prof.identifiant}, à lui transmettre de vive voix :`,
        donnees.motdepasse);
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
        `Compte créé pour ${reponse.identifiant.trim()}. Il ne verra aucune classe tant que tu ne lui en auras pas partagé une.`,
        "ok");
      montrerSecret(`Mot de passe temporaire de ${reponse.identifiant.trim()}, à lui transmettre de vive voix :`,
        donnees.motdepasse);
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

  // « Léa B » → prénom « Léa », initiale « B ». Une seule lecture pour la
  // saisie dans le tableau et pour la liste collée.
  function lireNom(texte) {
    const propre = String(texte || "").trim().replace(/\s+/g, " ");
    const morceaux = propre.split(" ");
    return {prenom: morceaux[0] || "", initiale: (morceaux[1] || "").replace(/\./g, "").slice(0, 1)};
  }

  async function nommer(eleve, champ) {
    const {prenom, initiale} = lireNom(champ.value);
    const avant = {prenom: eleve.prenom, initiale: eleve.initiale};
    // Mise à jour optimiste : ce qui vient d'être tapé est vrai tout de suite
    // pour le tableau et pour le papier. En cas de refus du serveur, on remet
    // l'ancien nom et on le dit. Pendant l'appel, aucun redessin (creerFileRedessin).
    eleve.prenom = prenom;
    eleve.initiale = initiale.toUpperCase();
    champ.value = nomAffiche(eleve);
    redessin.debut();
    try {
      await api("eleves.nommer", {eleve_id: eleve.id, prenom, initiale});
      dessinerPapier();
      messager("message-classe", "", "");
    } catch (erreur) {
      eleve.prenom = avant.prenom;
      eleve.initiale = avant.initiale;
      champ.value = nomAffiche(eleve);
      surErreur(erreur, "message-classe");
    } finally {
      redessin.fin();
    }
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

  // Un secret que l'on montre UNE fois : mot de passe temporaire d'un collègue.
  // Il quitte la page au premier des trois : « J'ai noté », fermeture de la
  // boîte, ou deux minutes.
  function montrerSecret(texte, valeur) {
    const boite = $("secret");
    if (!boite) return;
    $("secret-texte").textContent = texte;
    $("secret-valeur").textContent = valeur;
    let minuteur = 0;
    const effacer = () => {
      clearTimeout(minuteur);
      $("secret-valeur").textContent = "";
      $("secret-texte").textContent = "";
      $("secret-note").onclick = null;
      $("secret-copier").onclick = null;
      boite.removeEventListener("close", effacer);
      if (boite.open) { try { boite.close(); } catch (_) {} }
    };
    $("secret-note").onclick = effacer;
    $("secret-copier").onclick = () => {
      try { navigator.clipboard.writeText(valeur); } catch (_) {}
    };
    boite.addEventListener("close", effacer);
    minuteur = setTimeout(effacer, 120000);
    boite.showModal();
  }

  $("ajouter").addEventListener("click", async () => {
    const bouton = $("ajouter");
    if (bouton.disabled) return;
    const reponse = await demander("Combien d’élèves ajouter à cette classe ?",
      [{nom: "nombre", libelle: "Nombre d’élèves", type: "number", valeur: "25", min: 1, max: 60}]);
    if (!reponse) return;
    const nombre = parseInt(reponse.nombre, 10);
    if (!nombre || nombre < 1 || nombre > 60) {
      messager("message-classe", "Indique un nombre entre 1 et 60.", "erreur"); return;
    }
    // Désactivé pendant l'envoi : un double clic n'ajoute pas deux fois 25 codes.
    bouton.disabled = true;
    try {
      await api("eleves.ajouter", {classe_id: classe.id, nombre});
      await ouvrirClasse(classe.id);
      messager("message-classe", `${nombre} code${nombre > 1 ? "s" : ""} créé${nombre > 1 ? "s" : ""}. Écris les prénoms en face, puis imprime les bandelettes.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
    finally { bouton.disabled = false; }
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
        const {prenom, initiale} = lireNom(prenoms[index]);
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
      redessin.demander();
      // Les élèves sans prénom sont rangés par code : un seul code nouveau peut
      // décaler les numéros de toute la feuille. On le dit, au lieu de laisser
      // une feuille imprimée cinq minutes plus tôt devenir fausse en silence.
      messager("message-classe",
        `Nouveau code : ${donnees.code}. Réimprime sa bandelette — et, si des élèves n’ont pas encore de prénom, les numéros ont pu changer : réimprime la feuille prénom ↔ code.`,
        "ok");
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
      redessin.demander();
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

  $("imprimer-bandelettes").addEventListener("click", () => imprimer("bandelettes"));
  $("imprimer-recap").addEventListener("click", () => imprimer("recap"));
  $("retour").addEventListener("click", () => { chargerClasses(); });

  document.querySelectorAll("th button[data-tri]").forEach(bouton => {
    bouton.addEventListener("click", () => {
      const colonne = bouton.dataset.tri;
      tri = {colonne, sens: tri.colonne === colonne ? -tri.sens : (colonne === "prenom" ? 1 : -1)};
      $("tri").value = colonne;
      // Passe par la file : un tri déclenché juste après une saisie de prénom
      // attend la réponse du serveur au lieu d'effacer la correction à l'écran.
      redessin.demander();
    });
  });

  $("tri").addEventListener("change", event => {
    const colonne = event.target.value;
    tri = {colonne, sens: colonne === "prenom" ? 1 : -1};
    redessin.demander();
  });

  $("form-classe").addEventListener("submit", async event => {
    event.preventDefault();
    const bouton = $("creer-classe");
    if (bouton.disabled) return;
    const libelle = $("libelle").value.trim();
    if (!libelle) return;
    // Désactivé pendant l'envoi : deux clics faisaient deux classes du même
    // nom, impossibles à distinguer dans la liste.
    bouton.disabled = true;
    try {
      const donnees = await api("classes.creer", {libelle, applis: ["defi-tables"]});
      $("libelle").value = "";
      await chargerClasses();
      await ouvrirClasse(donnees.id);
    } catch (erreur) { surErreur(erreur, "message-classes"); }
    finally { bouton.disabled = false; }
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
      veille.demarrer(Date.now());
      venaitDeSeConnecter = true;
      demarrer().finally(() => { venaitDeSeConnecter = false; });
    } catch (_) {
      messager("erreur-connexion", "Le serveur ne répond pas.", "erreur");
    }
  });

  // Le rechargement est la seule façon d'être sûr que RIEN n'est resté dans le
  // document — une zone oubliée dans viderZones() ne survit pas à un reload.
  $("deconnexion").addEventListener("click", () => deconnecter({recharger: true}));

  // ---------------------------------------------------------- veille du poste
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(evenement => {
    window.addEventListener(evenement, () => veille.geste(Date.now()), {capture: true, passive: true});
  });
  function controlerVeille() {
    if (veille.doitFermer(Date.now())) deconnecter({recharger: true, avis: "inactivite"});
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") controlerVeille();
  });
  setInterval(controlerVeille, 60000);

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
    veille.demarrer(Date.now());
    return api("moi").then(donnees => {
      identifiant = donnees.identifiant;
      $("qui").textContent = donnees.identifiant;
      estAdmin = Boolean(donnees.admin);
      mdpTemporaire = Boolean(donnees.mdp_temporaire);
      if (mdpTemporaire) { ouvrirCompte(); return undefined; }
      return chargerClasses();
    }).catch(erreur => {
      deconnecter({silencieux: true});
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

  const avis = lireAvis();
  if (avis) messager("erreur-connexion", avis, "erreur");
  if (jeton) demarrer();
})();
</script>
</body>
</html>
