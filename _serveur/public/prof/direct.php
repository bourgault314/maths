<?php
// Séance en direct, écran du TABLEAU — lot 1 « question éclair » (07/10/2026),
// lot 2 « questionnaire au tableau » (15/10/2026).
// Page du professeur, faite pour être projetée : elle ne contient AUCUN nom
// d'élève. Pendant la question, un compteur ; après « Dévoiler », des barres.
// Les réponses élève par élève n'entrent jamais dans le document : elles ne
// passent que dans le fichier téléchargé à la fin, fabriqué en mémoire.
//
// Lot 2 : le professeur peut ouvrir ici un QUESTIONNAIRE préparé (un fichier
// JSON chez lui, lu par questionnaire.js). Il reste dans ce navigateur : le
// serveur ne reçoit, question par question, que le nombre de réponses et la
// durée du chrono — et la bonne réponse au moment de « Dévoiler ». Les
// formules sont dessinées par KaTeX, copié ici (vendor/) parce que la
// politique de contenu n'accepte aucun script d'un autre domaine.
//
// On y arrive depuis « Ma classe » (bouton « Séance en direct »), dans le même
// onglet : la session du professeur est celle de l'onglet (sessionStorage),
// comme le verrou d'inactivité de 30 minutes, partagé avec prof/index.php.
require_once __DIR__ . '/../lib/entetes.php';
header('Content-Type: text/html; charset=utf-8');
$nonce = entetes_page();
// La version dans l'adresse est l'empreinte du fichier déposé : un nouveau
// dépôt n'est jamais masqué par le cache du navigateur.
$versionDe = static function (string $chemin): string {
    return is_file($chemin) ? substr(md5_file($chemin), 0, 10) : '0';
};
$versionQuestionnaire = $versionDe(__DIR__ . '/questionnaire.js');
$versionKatex = $versionDe(__DIR__ . '/../vendor/katex-0.18.2/katex.min.js');
$versionKatexCss = $versionDe(__DIR__ . '/../vendor/katex-0.18.2/katex.min.css');
// Serveur pro, lot 7 (31/10/2026) : la charte commune, comme Ma classe.
$versionCharte = $versionDe(__DIR__ . '/../suivi.css');
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="../favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<link rel="stylesheet" href="../vendor/katex-0.18.2/katex.min.css?v=<?= htmlspecialchars($versionKatexCss, ENT_QUOTES) ?>">
<title>Séance en direct | maths&amp;go</title>
<link rel="stylesheet" href="../suivi.css?v=<?= htmlspecialchars($versionCharte, ENT_QUOTES) ?>">
<style>
  /* Serveur pro, lot 7 (31/10/2026) : la charte (suivi.css) donne les
     couleurs, le texte, l'en-tête, les boutons, le menu déroulant, le
     message, la pastille et les fenêtres. Ne restent ici que l'écran du
     tableau, avec ses tailles À PART : la scène est PROJETÉE, elle se lit du
     fond de la classe (« grands nombres » de la charte, section 12). */
  html, body { height: 100%; }
  body { min-height: 0; }
  .barre { flex: 0 0 5px; }
  .entete { flex: 0 0 auto; }
  /* Le nom de la classe vient du professeur (40 caractères au plus) : il
     passe à la ligne plutôt que de pousser les boutons hors de l'écran. */
  #classe { white-space: normal; overflow-wrap: anywhere; min-width: 0; }
  .entete .qz-titre { min-width: 0; color: var(--muted); font-size: var(--texte-secondaire); font-weight: 600;
                      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .entete .droite { flex: 0 0 auto; }
  /* L'action du moment, en bas : la seule grande touche de la page. */
  button.grand { min-height: 56px; padding: 0 28px; font-size: 20px; border-radius: var(--arrondi-carte); }
  /* Tout tient dans l'écran projeté : la zone du milieu prend la place qui
     reste entre l'en-tête et les commandes, sans jamais faire défiler. */
  main { flex: 1 1 auto; min-height: 0; width: 100%; max-width: 1180px; margin: 0 auto;
         padding: 14px 20px 8px; display: flex; flex-direction: column; align-items: center;
         justify-content: center; text-align: center; }
  main.large { max-width: 1800px; padding: 12px 28px 4px; overflow: hidden; }
  /* Les titres de la scène restent GRAS : ils sont projetés et lus par les
     élèves (comme leurs titres à eux), pas par le professeur. */
  #scene h1 { margin: 0; font: 700 clamp(2rem, 5.2vw, 3.6rem)/1.1 var(--serif); color: var(--blue-dark); }
  #scene .sous { margin: 10px 0 0; color: var(--muted); font-size: clamp(1.05rem, 2vw, 1.4rem); }
  .adresse { margin: 16px 0 0; font-size: clamp(2rem, 6vw, 4.4rem); font-weight: 800;
             letter-spacing: .01em; color: var(--blue); }
  .etapes { margin: 12px 0 0; font-size: clamp(1.15rem, 2.4vw, 1.7rem); color: var(--ink); }
  .etapes b { color: var(--blue-dark); }
  .presents { margin: 18px 0 0; font-size: clamp(1.1rem, 2.2vw, 1.6rem); font-weight: 700; color: var(--muted);
              font-variant-numeric: tabular-nums; }
  .presents b { color: var(--blue-dark); font-size: 1.25em; }
  /* Pendant la question : un seul nombre, celui de toute la classe. */
  .compteur { margin: 8px 0 0; font-size: clamp(4.5rem, 17vw, 12rem); font-weight: 800; line-height: 1;
              color: var(--blue-dark); font-variant-numeric: tabular-nums; }
  .compteur small { font-size: .42em; font-weight: 700; color: var(--muted); }
  .jauge { width: min(720px, 90%); height: 16px; margin: 20px auto 0; border-radius: 999px;
           background: #e6ecf3; overflow: hidden; }
  .jauge i { display: block; height: 100%; width: 0; border-radius: 999px;
             background: linear-gradient(90deg, #08aaa5, #0b67b2); transition: width .4s ease; }
  /* Après « Dévoiler » : une barre par réponse, le nombre au-dessus, la lettre
     dessous. Aucun nom. La bonne réponse, si le professeur la désigne, passe
     au vert AVEC une coche (la couleur seule ne suffit pas à un œil daltonien). */
  .barres { flex: 1 1 auto; min-height: 0; width: 100%; max-width: 980px; margin: 14px auto 0;
            display: flex; align-items: stretch; justify-content: center; gap: clamp(10px, 3vw, 34px); }
  .barres button { flex: 1 1 0; max-width: 190px; min-height: 0; padding: 0; display: flex;
                   flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 0;
                   background: none; color: var(--ink); border: 0; border-radius: 14px; white-space: normal; }
  .barres button:hover { color: var(--ink); background: var(--bleu-pale); }
  .barres .combien { flex: 0 0 auto; font-size: clamp(1.6rem, 4vw, 2.8rem); font-weight: 800;
                     color: var(--blue-dark); font-variant-numeric: tabular-nums; }
  .barres .colonne { flex: 1 1 auto; min-height: 60px; display: flex; align-items: flex-end;
                     padding: 0 12%; border-bottom: 3px solid var(--blue-dark); }
  .barres .colonne i { display: block; width: 100%; min-height: 4px; border-radius: 10px 10px 0 0;
                       background: #0b67b2; transition: height .5s ease; }
  .barres .lettre { flex: 0 0 auto; padding: 6px 0 2px; font-size: clamp(1.8rem, 4.4vw, 3rem);
                    font-weight: 800; line-height: 1.1; color: var(--blue-dark); }
  .barres button.bonne .colonne i { background: var(--vert); }
  .barres button.bonne .lettre, .barres button.bonne .combien { color: var(--vert); }
  .barres button.bonne .lettre::after { content: " ✓"; }
  .bilan { margin: 8px 0 0; color: var(--muted); font-size: clamp(1rem, 1.8vw, 1.25rem); }

  /* ------------------------------------------------ lot 2 : le questionnaire
     Une question du fichier : l'énoncé en haut, l'image éventuelle à gauche,
     les réponses en cartes. Au dévoilement, chaque carte se remplit de sa
     barre et porte son nombre ; la bonne passe au vert avec une coche.
     CADRE FIXE (15/10/2026, choix de Gwenaël, « façon Kahoot ») : la bande
     de l'énoncé a toujours la même hauteur, les réponses remplissent toujours
     le reste, et le texte a la même taille à chaque question. La disposition,
     elle, suit le contenu (figure à gauche, figures en réponses, 2 à 6
     cartes). Seule une question qui ne tient pas rétrécit : --t réduit tout
     d'un même facteur (ajuster()) ; rien ne grandit jamais. */
  .q { --t: 1; width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column;
       gap: calc(var(--t) * 14px); text-align: left; }
  .q-haut { flex: 0 0 30%; min-height: 0; display: flex; align-items: center; gap: 20px; }
  .q-tete { flex: 1 1 auto; min-width: 0; }
  .q-num { font-weight: 800; color: var(--muted); letter-spacing: .03em; text-transform: uppercase;
           font-size: calc(var(--t) * clamp(.95rem, 1.4vw, 1.25rem)); }
  .q-enonce { margin: 2px 0 0; font-weight: 600; color: var(--blue-dark); line-height: 1.3;
              font-size: calc(var(--t) * clamp(1.5rem, min(3.9vw, 7vh), 5.4rem)); overflow-wrap: anywhere; }
  .q-corps { flex: 1 1 0; min-height: 0; display: flex; align-items: stretch; gap: calc(var(--t) * 24px); }
  .q-figure { flex: 0 0 36%; min-width: 0; min-height: 0; display: flex; align-items: center; justify-content: center;
              padding: 12px; background: #fff; border: 1px solid var(--line); border-radius: 16px; }
  .q-figure img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .q-reponses { flex: 1 1 auto; min-width: 0; min-height: 0; display: grid;
                grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr);
                gap: calc(var(--t) * 14px); }
  .rep { position: relative; display: flex; align-items: center; justify-content: flex-start; gap: calc(var(--t) * 18px);
         min-height: 0; padding: calc(var(--t) * 12px) calc(var(--t) * 22px);
         font: 400 16px/1.5 var(--sans); text-align: left; white-space: normal; color: var(--ink); background: #fff;
         border: 2px solid var(--line); border-radius: 16px; overflow: hidden; }
  button.rep { cursor: pointer; }
  button.rep:hover { color: var(--ink); background: #fff; border-color: #9fb6cf; }
  .rep .fond { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #dbe8f6; transition: width .6s ease; }
  .rep .l { position: relative; flex: 0 0 auto; display: grid; place-items: center;
            width: calc(var(--t) * clamp(44px, min(5.4vw, 9.5vh), 112px)); height: calc(var(--t) * clamp(44px, min(5.4vw, 9.5vh), 112px));
            border-radius: 12px; background: var(--blue); color: #fff; font-weight: 800;
            font-size: calc(var(--t) * clamp(1.4rem, min(3vw, 5.4vh), 3.6rem)); line-height: 1; }
  .rep .t { position: relative; min-width: 0; display: flex; flex-direction: column; align-items: flex-start;
            gap: 6px; font-size: calc(var(--t) * clamp(1.4rem, min(3.8vw, 6.8vh), 5rem)); line-height: 1.2;
            overflow-wrap: anywhere; }
  .rep .t img { display: block; max-width: 100%; max-height: calc(var(--t) * 22vh); width: auto; height: auto; }
  .rep .coche { position: relative; flex: 0 0 auto; color: var(--vert); font-weight: 800;
                font-size: calc(var(--t) * clamp(1.4rem, min(3.8vw, 6.8vh), 5rem)); }
  /* Le nombre a sa place réservée dès la question : rien ne bouge au
     dévoilement. La coche de la bonne réponse se pose SUR la lettre (elle ne
     prend aucune place). */
  .rep .reserve { visibility: hidden; }
  .rep .t .court { white-space: nowrap; overflow-wrap: normal; }
  .rep .l .coche { position: absolute; top: -.32em; right: -.32em; width: 1em; height: 1em; display: grid;
                   place-items: center; border-radius: 50%; background: #fff; color: var(--vert);
                   font-size: .62em; line-height: 1; box-shadow: 0 0 0 .12em var(--vert); }
  .rep .n { position: relative; flex: 0 0 auto; margin-left: auto; padding-left: 12px; font-weight: 800;
            color: var(--blue-dark); font-variant-numeric: tabular-nums;
            font-size: calc(var(--t) * clamp(1.2rem, min(3.2vw, 5.6vh), 4.2rem)); }
  /* Une réponse qui est une FIGURE : la lettre (et au dévoilement le
     nombre) sur une ligne au-dessus, la figure en grand dessous, et la barre
     en bas de la carte — une figure à fond blanc ne la cache pas. */
  .rep.avec-image { flex-direction: column; align-items: stretch; gap: calc(var(--t) * 8px);
                    padding-bottom: calc(var(--t) * 20px); }
  .rep-haut { position: relative; display: flex; align-items: center; gap: calc(var(--t) * 12px); }
  .rep.avec-image .t { flex: 1 1 0; min-height: 0; width: 100%; align-items: center; text-align: center; }
  .rep.avec-image .t img { flex: 1 1 0; min-height: calc(var(--t) * 10vh); width: 100%; max-height: none; object-fit: contain; }
  .rep.avec-image .fond { top: auto; height: calc(var(--t) * 12px); }
  .q.devoile .rep { border-color: #e3e9f0; }
  .q.devoile .rep .l { background: #3f6597; }
  .rep.bonne, .q.devoile .rep.bonne { border-color: var(--vert); box-shadow: inset 0 0 0 1px var(--vert); }
  .rep.bonne .fond { background: #cdebd5; }
  .q .rep.bonne .l { background: var(--vert); }
  .rep.bonne .n { color: var(--vert); }
  .q-chrono { flex: 0 0 auto; --p: 100%; display: grid; place-items: center; position: relative; border-radius: 50%;
              width: clamp(80px, min(8vw, 13vh), 140px); height: clamp(80px, min(8vw, 13vh), 140px);
              background: conic-gradient(var(--orange) var(--p), #e6ecf3 0); }
  .q-chrono::before { content: ""; position: absolute; inset: 9px; border-radius: 50%; background: var(--page); }
  .q-chrono b { position: relative; font-size: clamp(1.8rem, min(3.2vw, 5.4vh), 3.2rem); font-variant-numeric: tabular-nums; }
  .q-chrono.fini { background: #e6ecf3; }
  .katex { font-size: 1.08em; }   /* la boîte extérieure : KaTeX 0.18 ne l'a pas renommée */
  /* Le dépôt du questionnaire, avant d'ouvrir la séance. */
  .depot { margin: 26px auto 0; width: min(640px, 100%); padding: 18px 20px; border: 2px dashed #b8c6d6;
           border-radius: var(--arrondi-carte); background: var(--paper); }
  .depot.charge { border-style: solid; border-color: var(--line); text-align: left; }
  .depot.survol { border-color: var(--teal); background: var(--teal-pale); }
  .depot p { margin: 8px 0 0; color: var(--muted); }
  .depot .nom { margin: 0; font: 400 var(--titre-carte)/1.25 var(--serif); color: var(--blue-dark); }
  .depot .gestes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
  .depot ul { margin: 10px 0 0; padding-left: 20px; text-align: left; color: var(--rouge); font-weight: 600; }
  .depot.erreur { border-color: var(--rouge-bord); }
  /* 17/10/2026 : pour qui découvre la page — l'exemple, et comment en faire un. */
  .depot .aide { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 18px; margin-top: 12px;
                 padding-top: 10px; border-top: 1px solid var(--filet-doux); }
  /* Deux liens d'aide : des boutons dessinés comme des liens, à 44 px. */
  .depot .aide button { padding: 0 4px; color: var(--blue); background: none; border: 0;
                        font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
  .depot .aide button:hover { color: var(--blue-dark); background: none; }
  dialog.preparer { max-width: 760px; }
  .prep { flex: 1 1 auto; min-height: 0; overflow-y: auto; margin: 0; padding: 14px 20px 20px 44px; display: grid; gap: 16px; }
  .prep li::marker { font-weight: 800; color: var(--blue-dark); }
  .prep p { margin: 0 0 8px; }
  .prep textarea { display: block; margin: 0 0 8px; resize: vertical;
                   font: var(--texte-secondaire)/1.45 ui-monospace, Consolas, monospace; background: #fbfcfe; }
  .prep .insecable { white-space: nowrap; }
  .prep .erreurs { margin: 8px 0 0; padding-left: 20px; color: var(--rouge); font-weight: 600; }
  .commandes { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; gap: 10px 14px;
               flex-wrap: wrap; padding: 12px 16px 18px; }
  .commandes label { display: inline-flex; align-items: center; gap: 8px; margin: 0; color: var(--muted);
                     font-size: var(--texte-secondaire); font-weight: 600; }
  .commandes .case { min-height: var(--cible); cursor: pointer; }
  .commandes .case input { width: 20px; height: 20px; margin: 0; accent-color: var(--blue); }
  .commandes select { width: auto; }
  .compte { display: inline-flex; align-items: center; gap: 10px; color: var(--muted); font-weight: 700;
            font-variant-numeric: tabular-nums; }
  .compte b { font-size: 32px; line-height: 1.1; color: var(--blue-dark); }   /* « grand nombre » n1 */
  .compte .jauge { width: 170px; height: 12px; margin: 0; }
  .commandes .message { margin: 0; }
  /* Les fenêtres de décision : trois choix, l'un sous l'autre, le premier
     est celui qu'on vient faire. */
  dialog.fenetre:not(.apercu):not(.preparer) { max-width: 460px; }
  .fenetre .choix { display: grid; gap: 10px; margin-top: 14px; }
  .fenetre .choix button { white-space: normal; }
  /* L'aperçu : toutes les questions, bonnes réponses comprises — jamais
     pendant une séance (l'écran est projeté). */
  dialog.apercu { max-width: 1100px; height: calc(100% - 32px); max-height: none; display: none; }
  dialog.apercu[open] { display: flex; }
  .apercu-haut { flex: 0 0 auto; display: flex; align-items: center; gap: 12px; padding: 16px 20px;
                 border-bottom: 1px solid var(--filet-doux); }
  .apercu-haut h2 { margin: 0; flex: 1 1 auto; }
  .apercu-liste { flex: 1 1 auto; overflow: auto; padding: 8px 20px 24px; }
  .apercu-q { padding: 16px 0; border-bottom: 1px solid var(--filet-doux); }
  .apercu-q h3 { margin: 0; font-size: var(--texte-secondaire); color: var(--muted); text-transform: uppercase; letter-spacing: .03em; }
  .apercu-q .enonce { margin: 4px 0 10px; font-size: var(--titre-carte); font-weight: 600; color: var(--blue-dark); }
  .apercu-q .figure img { display: block; max-width: 100%; max-height: 260px; margin: 0 0 10px; }
  .apercu-q ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px;
                 grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
  .apercu-q li { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 2px solid var(--line);
                 border-radius: var(--arrondi); font-size: var(--titre-carte); }
  .apercu-q li img { display: block; max-width: 100%; max-height: 120px; }
  .apercu-q li .l { flex: 0 0 auto; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px;
                    background: var(--blue); color: #fff; font-weight: 800; line-height: 1; }
  .apercu-q li.bonne { border-color: var(--vert); background: var(--vert-pale); }
  .apercu-q li.bonne .l { background: var(--vert); }
  .apercu-q .pastille { margin-left: 8px; text-transform: none; letter-spacing: 0; }
  /* Au téléphone (le tableau se pilote parfois de là) : l'en-tête passe
     sur deux lignes au plus, la figure d'une question va au-dessus des
     réponses, et la barre du bas tient en trois rangées. */
  @media (max-width: 600px) {
    .entete { flex-wrap: wrap; row-gap: 6px; }
    .entete .qz-titre { display: none; }
    .q-corps { flex-direction: column; }
    .q-figure { flex: 0 0 34%; }
    .commandes { gap: 8px 10px; padding: 10px 16px 14px; }
    .commandes #case-tous { flex: 1 1 100%; justify-content: center; }
    .commandes #reglage-choix { font-size: 0; gap: 0; }        /* le menu dit déjà « A, B, C, D » */
    .commandes #reglage-choix select { font-size: var(--texte); }
    .commandes #action { flex: 1 1 100%; }
  }
</style>
</head>
<body>
<div class="barre"></div>
<header class="entete">
  <img src="../mathsgo-logo.png" alt="maths&go">
  <span class="titre">Séance en direct</span>
  <span class="pastille teal" id="classe" hidden></span>
  <span class="qz-titre" id="qz-titre" hidden></span>
  <span class="droite">
    <button type="button" class="secondaire" id="retour">Ma classe</button>
    <button type="button" class="danger" id="terminer" hidden>Terminer la séance</button>
  </span>
</header>

<main id="scene" aria-live="polite"></main>

<div class="commandes" id="commandes">
  <label class="case" id="case-tous" hidden><input type="checkbox" id="tous"> Dévoiler quand tous ont répondu</label>
  <span class="compte" id="compte" hidden></span>
  <p class="message erreur" id="message" hidden></p>
  <button type="button" class="secondaire" id="ouvrir-qz" hidden>📂 Questionnaire</button>
  <label id="reglage-choix" hidden>Réponses possibles
    <select id="choix" aria-label="Réponses possibles">
      <option value="2">A et B</option>
      <option value="3">A, B, C</option>
      <option value="4" selected>A, B, C, D</option>
      <option value="5">A à E</option>
      <option value="6">A à F</option>
    </select>
  </label>
  <button type="button" class="grand" id="action" hidden></button>
</div>

<input type="file" id="fichier" accept=".json,.txt,application/json,text/plain" hidden>

<dialog id="fin" class="fenetre">
  <div class="fenetre-tete"><h2>Terminer la séance ?</h2></div>
  <div class="fenetre-corps">
  <p id="fin-texte"></p>
  <div class="choix">
    <button type="button" id="fin-fichier">Télécharger le fichier, puis terminer</button>
    <button type="button" class="danger" id="fin-sans">Terminer sans fichier</button>
    <button type="button" class="secondaire" id="fin-non">Annuler</button>
  </div>
  </div>
</dialog>

<dialog id="apercu" class="fenetre apercu">
  <div class="apercu-haut">
    <h2 id="apercu-titre">Aperçu</h2>
    <button type="button" class="secondaire" id="apercu-fermer">Fermer</button>
  </div>
  <div class="apercu-liste" id="apercu-liste"></div>
</dialog>

<!-- 17/10/2026 : quitter le tableau pendant une séance. Elle reste ouverte
     (« ● Reprendre » dans la classe, pastille dans Mes classes) ; sans le tableau, elle
     s'arrête seule au bout de vingt minutes (lib/direct.php, VEILLE_DIRECT). -->
<dialog id="quitter" class="fenetre">
  <div class="fenetre-tete"><h2>Quitter le tableau ?</h2></div>
  <div class="fenetre-corps">
  <p>La séance reste ouverte : tu la reprends depuis la classe. Sans le tableau, elle s’arrête seule au bout de 20 minutes.</p>
  <div class="choix">
    <button type="button" id="quitter-oui">Quitter, la séance reste ouverte</button>
    <button type="button" class="danger" id="quitter-terminer">Terminer la séance</button>
    <button type="button" class="secondaire" id="quitter-non">Annuler</button>
  </div>
  </div>
</dialog>

<!-- 17/10/2026 : préparer un questionnaire avec une IA, pour un professeur
     qui découvre la page. Seulement avant d'ouvrir la séance : le texte collé
     contient les bonnes réponses, et l'écran est peut-être projeté. -->
<dialog id="preparer" class="fenetre preparer">
  <div class="apercu-haut">
    <h2>Préparer un questionnaire</h2>
    <button type="button" class="secondaire" id="preparer-fermer">Fermer</button>
  </div>
  <ol class="prep">
    <li>
      <p><b>Demande-le à ton IA</b> (ChatGPT, Claude, Le Chat…) : copie ce texte, colle-le dans ton IA et complète les crochets.</p>
      <textarea id="prompt-ia" readonly rows="6" spellcheck="false">Prépare-moi un questionnaire à choix multiples pour la « séance en direct » de suivi.mathsgo.re.

Sujet : [par exemple : les fractions]
Classe : [par exemple : 4e]
Nombre de questions : [par exemple : 10]
Chrono par question : [par exemple : 30 secondes, ou aucun]

Réponds UNIQUEMENT par un bloc de code JSON, sans rien avant ni après, de cette forme :

{
  "format": "mathsgo-questionnaire",
  "version": 1,
  "titre": "Fractions — 4e",
  "chrono": 30,
  "questions": [
    {
      "enonce": "Combien vaut $\\frac{3}{4}+\\frac{1}{8}$ ?",
      "choix": ["$\\frac{4}{12}$", "$\\frac{7}{8}$", "$\\frac{4}{8}$", "$1$"],
      "bonne": "B"
    }
  ]
}

Règles :
- de 2 à 6 réponses par question ; « bonne » est la lettre de la bonne réponse (A pour la première, B pour la deuxième…) ;
- des réponses fausses plausibles : les erreurs que font vraiment les élèves ;
- les formules entre deux $, en LaTeX ; dans le JSON, chaque \ s'écrit \\ (par exemple "$\\frac{1}{2}$") ;
- la virgule décimale s'écrit 2,5 ou $2{,}5$ ;
- « chrono » en secondes, de 5 à 600 ; enlève la ligne « chrono » s'il n'en faut pas ;
- pas d'image, sauf si tu sais exécuter du code : alors une figure SVG en base64, "image": "data:image/svg+xml;base64,…" (jamais un lien vers un site).
Vérifie que le JSON est valide avant de répondre.</textarea>
      <button type="button" class="secondaire" id="copier-prompt">Copier le texte</button>
    </li>
    <li>
      <p><b>Colle ici sa réponse</b>, ou enregistre son fichier et ouvre-le avec <span class="insecable">« 📂 Ouvrir un questionnaire »</span>.</p>
      <textarea id="colle" rows="5" spellcheck="false" placeholder="{ &quot;format&quot;: &quot;mathsgo-questionnaire&quot;, … }"></textarea>
      <button type="button" id="ouvrir-colle">Ouvrir ce questionnaire</button>
      <ul class="erreurs" id="colle-erreurs" hidden></ul>
    </li>
    <li><p><b>Vérifie</b> avec « Aperçu (avec les réponses) », puis ouvre la séance.</p></li>
  </ol>
</dialog>

<script src="../vendor/katex-0.18.2/katex.min.js?v=<?= htmlspecialchars($versionKatex, ENT_QUOTES) ?>"></script>
<script src="questionnaire.js?v=<?= htmlspecialchars($versionQuestionnaire, ENT_QUOTES) ?>"></script>
<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  // Les mêmes clés que « Ma classe » (prof/index.php) : la session et
  // l'instant du dernier geste vivent dans l'onglet, pour les deux pages.
  const CLE_JETON = "mathsgo-suivi-jeton";
  const CLE_GESTE = "mathsgo-suivi-prof-dernier-geste";
  const INACTIVITE_MS = 30 * 60 * 1000;

  let jeton = "";
  try { jeton = sessionStorage.getItem(CLE_JETON) || ""; } catch (_) {}
  const classeId = Number((/(?:^|[#&])classe=(\d+)/.exec(window.location.hash) || [])[1]) || 0;

  function versMaClasse() { window.location.replace("./"); }
  // Le bouton « Ma classe » (17/10/2026) : retour dans CETTE classe, pas dans
  // la liste. Ma classe lit l'ancre au démarrage, puis l'efface.
  function versLaClasse() { window.location.replace("./#classe=" + encodeURIComponent(classeId)); }
  // Pas de session dans cet onglet, ou pas de classe désignée : c'est à
  // « Ma classe » de s'en occuper (elle demande le mot de passe).
  if (!jeton || !classeId) { versMaClasse(); return; }

  // ---------------------------------------------------------- veille du poste
  // Trente minutes sans un geste : retour à « Ma classe », qui relit le même
  // instant rangé et déconnecte. La séance, elle, reste ouverte côté serveur
  // jusqu'à son échéance : on la retrouve en se reconnectant.
  function dernierGeste() {
    try { return Number(sessionStorage.getItem(CLE_GESTE)) || 0; } catch (_) { return 0; }
  }
  function noterGeste() {
    try { sessionStorage.setItem(CLE_GESTE, String(Date.now())); } catch (_) {}
  }
  function veilleDepassee() {
    const dernier = dernierGeste();
    return dernier > 0 && (Date.now() - dernier) >= INACTIVITE_MS;
  }
  if (veilleDepassee()) { versMaClasse(); return; }
  if (!dernierGeste()) noterGeste();
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(evenement => {
    window.addEventListener(evenement, noterGeste, {capture: true, passive: true});
  });
  setInterval(() => { if (veilleDepassee()) versMaClasse(); }, 60000);

  // ------------------------------------------------------------------- l'état
  let direct = null;        // l'état de la séance rendu par le serveur, ou null
  let connu = false;        // le serveur a répondu au moins une fois
  let rythme = 1500;
  let minuteur = 0;
  let enAction = false;     // un geste du professeur est en vol
  let dernierAppel = 0;     // numéro du dernier appel dont la réponse a été retenue
  let compteurAppels = 0;
  let pannes = 0;
  // Lot 5e : le serveur a répondu que la séance en direct n'est pas ouverte à
  // ce compte (réservée à l'administrateur pour l'instant). On le dit, on
  // n'interroge plus, et « Ma classe » ramène dans la classe.
  let reserve = "";

  async function api(action, corps = {}) {
    // Le jeton voyage dans le corps ET dans l'en-tête, comme dans « Ma classe ».
    const reponse = await fetch("../api/prof.php", {
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": "Bearer " + jeton},
      body: JSON.stringify(Object.assign({action, jeton, classe_id: classeId}, corps)),
      cache: "no-store"
    });
    const donnees = await reponse.json().catch(() => null);
    if (!reponse.ok || !donnees || !donnees.ok) {
      const erreur = new Error((donnees && donnees.erreur) || "Le serveur ne répond pas.");
      erreur.statut = reponse.status;
      erreur.raison = (donnees && donnees.raison) || "";
      throw erreur;
    }
    return donnees;
  }

  function messager(texte) {
    $("message").textContent = texte || "";
    $("message").hidden = !texte;
  }

  function surErreur(erreur) {
    if (erreur.raison === "direct_reserve") {
      reserve = erreur.message;
      window.clearTimeout(minuteur);
      messager("");
      dessiner();
      return;
    }
    // Session terminée, ou classe hors de portée : « Ma classe » saura dire quoi.
    if (erreur.statut === 401 || erreur.statut === 403 || erreur.statut === 404) { versMaClasse(); return; }
    messager(erreur.message);
  }

  // Une réponse n'est retenue que si elle est plus récente que la dernière
  // retenue : une interrogation partie AVANT un clic ne doit pas ramener
  // l'écran en arrière quand elle arrive après lui.
  function retenir(numeroAppel, donnees) {
    if (numeroAppel < dernierAppel) return false;
    dernierAppel = numeroAppel;
    connu = true;
    if ("direct" in donnees) direct = donnees.direct || null;
    if (donnees.classe && donnees.classe.libelle) {
      $("classe").textContent = donnees.classe.libelle;
      $("classe").hidden = false;
    }
    const propose = Number(donnees.rythme);
    if (propose >= 1000 && propose <= 30000) rythme = propose;
    return true;
  }

  // --------------------------------------------- lot 2 : le questionnaire chargé
  //
  // Il vit dans CE navigateur, et nulle part ailleurs. Ce qui le relie à la
  // séance du serveur : « liens », numéro de question du serveur → rang de la
  // question dans le fichier. Gardé dans l'onglet (sessionStorage) avec le
  // texte du fichier : une page rechargée par mégarde reprend où elle en était.
  // Sans le lecteur (fichier oublié au dépôt), la question éclair marche
  // toujours ; seul le questionnaire est refusé, en le disant.
  const QZ = window.MATHSGO_QUESTIONNAIRE || null;
  const SANS_LECTEUR = "Le lecteur de questionnaire manque sur le serveur : redépose prof/questionnaire.js.";
  const CLE_QZ = "mathsgo-direct-questionnaire-" + classeId;
  const CLE_TOUS = "mathsgo-direct-devoiler-tous";
  let qz = null;            // le questionnaire lu (questionnaire.js), ou null
  let qzEmpreinte = "";
  let qzTexte = "";
  let qzErreurs = [];       // ce que la dernière lecture a refusé
  let qzAttendu = null;     // {titre, empreinte} : à rouvrir après un rechargement
  let liens = {};           // numéro du serveur → rang dans qz.questions
  let prochaine = 0;        // rang de la prochaine question à lancer
  let devoilementDemande = 0;
  let finChrono = 0;        // instant (horloge locale) où le chrono du tableau atteint zéro
  let chronoDe = 0;         // numéro de la question à laquelle finChrono appartient

  // Une empreinte du texte (FNV-1a) : de quoi reconnaître le même fichier
  // rouvert, rien de plus — ce n'est pas un secret.
  function empreinteDe(texte) {
    let h = 0x811c9dc5;
    for (let i = 0; i < texte.length; i += 1) {
      h ^= texte.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return texte.length + "-" + h.toString(16);
  }

  function sauverQz() {
    try {
      if (!qz) { sessionStorage.removeItem(CLE_QZ); return; }
      const base = {empreinte: qzEmpreinte, titre: qz.titre, liens, prochaine};
      try {
        sessionStorage.setItem(CLE_QZ, JSON.stringify(Object.assign({texte: qzTexte}, base)));
      } catch (_) {
        // Trop lourd pour l'onglet (images) : on garde de quoi le reconnaître.
        sessionStorage.setItem(CLE_QZ, JSON.stringify(base));
      }
    } catch (_) {}
  }

  function verifierFormule(source) {
    if (!window.katex) return null;
    try {
      window.katex.renderToString("\\displaystyle " + source, OPTIONS_KATEX_STRICTES);
      return null;
    } catch (_) {
      return "à corriger";
    }
  }
  const OPTIONS_KATEX = {throwOnError: false, trust: false, strict: "ignore", maxSize: 20, maxExpand: 500};
  const OPTIONS_KATEX_STRICTES = Object.assign({}, OPTIONS_KATEX, {throwOnError: true});

  // Lit le texte d'un fichier. Rend true s'il est devenu LE questionnaire.
  function chargerTexte(texte) {
    const lu = QZ ? QZ.lire(texte, {verifierFormule}) : {ok: false, erreurs: [SANS_LECTEUR]};
    if (!lu.ok) {
      qzErreurs = lu.erreurs;
      if (direct) messager(lu.erreurs[0] + (lu.erreurs.length > 1 ? ` (et ${lu.erreurs.length - 1} autre${lu.erreurs.length > 2 ? "s" : ""})` : ""));
      return false;
    }
    const empreinte = empreinteDe(texte);
    qzErreurs = [];
    messager("");
    // Le même fichier que celui de la séance en cours : on reprend où on en était.
    const reprise = qzAttendu && qzAttendu.empreinte === empreinte;
    if (!reprise) { liens = {}; prochaine = 0; }
    qzAttendu = null;
    qz = lu.questionnaire;
    qzTexte = texte;
    qzEmpreinte = empreinte;
    sauverQz();
    return true;
  }

  async function chargerFichier(fichier) {
    if (!fichier) return;
    if (fichier.size > QZ.MAX_OCTETS_FICHIER) {
      qzErreurs = ["Le fichier est trop lourd (20 Mo au plus) : allège les images."];
      if (direct) messager(qzErreurs[0]);
      dessiner();
      return;
    }
    let texte = "";
    try { texte = await fichier.text(); }
    catch (_) {
      qzErreurs = ["Ce fichier ne s'ouvre pas. Glisse le fichier .json lui-même, pas son dossier."];
      if (direct) messager(qzErreurs[0]);
      dessiner();
      return;
    }
    chargerTexte(texte);
    dessiner();
  }

  function fermerQz() {
    qz = null; qzTexte = ""; qzEmpreinte = ""; qzErreurs = []; qzAttendu = null;
    liens = {}; prochaine = 0;
    sauverQz();
    dessiner();
  }

  // Au chargement de la page : un questionnaire était-il ouvert dans cet onglet ?
  (function reprendreQz() {
    let garde = null;
    try { garde = JSON.parse(sessionStorage.getItem(CLE_QZ) || "null"); } catch (_) {}
    if (!garde || typeof garde !== "object" || !QZ) return;
    const liensGardes = (garde.liens && typeof garde.liens === "object") ? garde.liens : {};
    const prochaineGardee = Number.isInteger(garde.prochaine) ? garde.prochaine : 0;
    if (typeof garde.texte === "string" && garde.texte) {
      const lu = QZ.lire(garde.texte);
      if (lu.ok) {
        qz = lu.questionnaire; qzTexte = garde.texte; qzEmpreinte = empreinteDe(garde.texte);
        liens = liensGardes; prochaine = prochaineGardee;
        return;
      }
    }
    if (typeof garde.empreinte === "string" && garde.empreinte) {
      qzAttendu = {titre: String(garde.titre || "ton questionnaire"), empreinte: garde.empreinte};
      liens = liensGardes; prochaine = prochaineGardee;
    }
  })();

  // La question du FICHIER posée sous ce numéro du serveur, ou null (question
  // posée à l'oral, ou questionnaire pas encore rouvert).
  function questionDuNumero(numero) {
    if (!qz || !Object.prototype.hasOwnProperty.call(liens, String(numero))) return null;
    return qz.questions[Number(liens[String(numero)])] || null;
  }
  function qzEnCours() { return Boolean(qz) && prochaine < qz.questions.length; }

  let devoilerQuandTous = true;
  try { devoilerQuandTous = localStorage.getItem(CLE_TOUS) !== "0"; } catch (_) {}
  $("tous").checked = devoilerQuandTous;
  $("tous").addEventListener("change", () => {
    devoilerQuandTous = $("tous").checked;
    try { localStorage.setItem(CLE_TOUS, devoilerQuandTous ? "1" : "0"); } catch (_) {}
    verifierDevoilementAuto();
  });

  // ------------------------------------------------------------------ les rendus
  //
  // Un rendu par TYPE de réponse (lib/direct.php, TYPES_DIRECT), comme sur
  // l'écran de l'élève. Pour ajouter un type : une entrée ici — ses commandes
  // (reglage), ses résultats au tableau (resultats), sa cellule dans le
  // fichier (cellule) — et rien d'autre ne change dans cette page.
  const LETTRES = ["A", "B", "C", "D", "E", "F"];
  const RENDUS = {
    choix: {
      commande: "reglage-choix",
      reglage() { return {choix: Number($("choix").value) || 4}; },
      resultats(scene, etat) {
        const combien = Math.max(2, Math.min(LETTRES.length, Number(etat.reglage && etat.reglage.choix) || 4));
        const repartition = etat.repartition || {};
        const lettres = LETTRES.slice(0, combien);
        const maximum = Math.max(1, ...lettres.map(lettre => Number(repartition[lettre]) || 0));
        const barres = document.createElement("div");
        barres.className = "barres";
        lettres.forEach(lettre => {
          const nombre = Number(repartition[lettre]) || 0;
          const barre = document.createElement("button");
          barre.type = "button";
          barre.classList.toggle("bonne", etat.bonne === lettre);
          barre.setAttribute("aria-pressed", etat.bonne === lettre ? "true" : "false");
          barre.setAttribute("aria-label", `Réponse ${lettre} : ${nombre}. Désigner comme bonne réponse.`);
          const haut = document.createElement("span");
          haut.className = "combien";
          haut.textContent = String(nombre);
          const colonne = document.createElement("span");
          colonne.className = "colonne";
          const plein = document.createElement("i");
          plein.style.height = nombre ? `${Math.max(3, Math.round(nombre / maximum * 100))}%` : "4px";
          colonne.append(plein);
          const bas = document.createElement("span");
          bas.className = "lettre";
          bas.textContent = lettre;
          barre.append(haut, colonne, bas);
          // Un clic désigne la bonne réponse ; un second clic la retire.
          barre.addEventListener("click", () => agir("direct.bonne", {bonne: etat.bonne === lettre ? null : lettre}));
          barres.append(barre);
        });
        scene.append(barres);
      },
      // Lot 2 : la même question, quand elle vient du questionnaire. Les cartes
      // portent le contenu de chaque réponse ; au dévoilement, leur barre.
      carte(question, k, etat) {
        const lettre = LETTRES[k];
        const devoile = etat.etat === "devoile";
        const carte = document.createElement(devoile ? "button" : "div");
        carte.className = "rep";
        if (devoile) {
          carte.type = "button";
          const repartition = etat.repartition || {};
          const maximum = Math.max(1, ...question.choix.map((_, i) => Number(repartition[LETTRES[i]]) || 0));
          const nombre = Number(repartition[lettre]) || 0;
          const fond = document.createElement("i");
          fond.className = "fond";
          carte.append(fond);
          // La barre pousse APRÈS le premier dessin : on la voit monter.
          window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
            fond.style.width = `${Math.round(nombre / maximum * 100)}%`;
          }));
          const estBonne = etat.bonne === lettre;
          carte.classList.toggle("bonne", estBonne);
          carte.setAttribute("aria-pressed", estBonne ? "true" : "false");
          carte.setAttribute("aria-label", `Réponse ${lettre} : ${nombre}. Désigner comme bonne réponse.`);
          carte.addEventListener("click", () => agir("direct.bonne", {bonne: estBonne ? null : lettre}));
        }
        const badge = document.createElement("span");
        badge.className = "l";
        badge.textContent = lettre;
        const contenu = document.createElement("span");
        contenu.className = "t";
        const choix = question.choix[k];
        if (choix.image) contenu.append(image(choix.image));
        if (choix.texte) {
          const texte = document.createElement("span");
          // Une réponse courte (un mot, un nombre et son unité) ne se coupe
          // jamais : « 24 cm² » reste sur une ligne ; si elle ne tient pas,
          // c'est la question qui rétrécit.
          const courte = choix.texte.length <= 12 || (choix.texte.length <= 18 && /\d/.test(choix.texte));
          if (courte) texte.className = "court";
          ecrire(texte, choix.texte, courte);
          contenu.append(texte);
        }
        // Une figure : la lettre et le nombre sur une ligne au-dessus d'elle.
        const ligneHaut = choix.image ? document.createElement("span") : carte;
        if (choix.image) {
          carte.classList.add("avec-image");
          ligneHaut.className = "rep-haut";
          carte.append(ligneHaut, contenu);
          ligneHaut.append(badge);
        } else {
          carte.append(badge, contenu);
        }
        // La bonne réponse : une coche posée sur la lettre. Le nombre est là
        // dès la question, invisible : la carte ne change pas au dévoilement.
        if (devoile && etat.bonne === lettre) {
          const coche = document.createElement("span");
          coche.className = "coche";
          coche.textContent = "✓";
          badge.append(coche);
        }
        const nombre = document.createElement("span");
        nombre.className = "n" + (devoile ? "" : " reserve");
        nombre.textContent = devoile ? String(Number((etat.repartition || {})[lettre]) || 0) : "00";
        ligneHaut.append(nombre);
        return carte;
      },
      cellule(reponse) { return reponse || ""; }
    }
  };

  // ------------------------------------------------------- textes et formules
  //
  // « texte $maths$ texte » : le texte par textContent, les formules par
  // KaTeX (sans « trust » : ni lien, ni HTML, ni style venus du fichier).
  // Typographie française : l'espace devant « ? ! : ; » et à l'intérieur des
  // guillemets ne se coupe pas (jamais un « ? » seul en début de ligne).
  function typographie(texte) {
    return texte.replace(/ ([?!:;»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
  }
  function ecrire(element, texte, insecable) {
    QZ.decouper(texte).morceaux.forEach(morceau => {
      if (morceau.maths === undefined) {
        const propre = typographie(morceau.texte);
        element.append(insecable ? propre.replace(/ /g, "\u00a0") : propre);
        return;
      }
      const span = document.createElement("span");
      if (window.katex) window.katex.render("\\displaystyle " + morceau.maths, span, OPTIONS_KATEX);
      else span.textContent = morceau.maths;
      element.append(span);
    });
  }
  function image(adresse) {
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.addEventListener("load", ajusterBientot);
    img.src = adresse;
    return img;
  }

  // --------------------------------------------------------------------- dessin

  function titre(texte) {
    const h1 = document.createElement("h1");
    h1.textContent = texte;
    return h1;
  }
  function ligne(classe, texte) {
    const p = document.createElement("p");
    p.className = classe;
    p.textContent = texte;
    return p;
  }
  function bouton(texte, classe, quandClic) {
    const b = document.createElement("button");
    b.type = "button";
    if (classe) b.className = classe;
    b.textContent = texte;
    b.addEventListener("click", quandClic);
    return b;
  }

  // Le cadre du questionnaire, avant d'ouvrir la séance : l'ouvrir, le
  // vérifier (aperçu), le changer. Rien de son contenu n'est montré ici.
  function cadreQuestionnaire() {
    const cadre = document.createElement("div");
    cadre.className = "depot" + (qz ? " charge" : "") + (qzErreurs.length ? " erreur" : "");
    cadre.id = "depot";
    if (qz) {
      const nom = document.createElement("p");
      nom.className = "nom";
      nom.textContent = "📋 " + qz.titre;
      const n = qz.questions.length;
      const avecChrono = qz.questions.filter(q => q.chrono).length;
      cadre.append(nom, ligne("", `${n} question${n > 1 ? "s" : ""}`
        + (avecChrono ? (avecChrono === n ? " · toutes avec chrono" : ` · ${avecChrono} avec chrono`) : " · sans chrono")));
      const gestes = document.createElement("div");
      gestes.className = "gestes";
      gestes.append(bouton("Aperçu (avec les réponses)", "secondaire", ouvrirApercu),
        bouton("Changer", "secondaire", () => $("fichier").click()),
        bouton("Retirer", "secondaire", fermerQz));
      cadre.append(gestes);
    } else {
      if (qzAttendu) cadre.append(ligne("", `Rouvre « ${qzAttendu.titre} » pour reprendre là où tu en étais.`));
      const gestes = document.createElement("div");
      gestes.className = "gestes";
      gestes.style.justifyContent = "center";
      gestes.append(bouton("📂 Ouvrir un questionnaire", "secondaire", () => $("fichier").click()));
      cadre.append(gestes, ligne("", "ou glisse le fichier ici"));
      // 17/10/2026 : pour qui découvre la page. Avant la séance seulement :
      // l'exemple s'ouvre en aperçu (bonnes réponses comprises) et le texte
      // collé les contient aussi — jamais sur un écran déjà projeté.
      if (!direct && !qzAttendu) {
        const aide = document.createElement("div");
        aide.className = "aide";
        aide.append(bouton("▶ Essayer avec l’exemple", "", essayerExemple),
          bouton("Comment préparer un questionnaire ?", "", ouvrirPreparer));
        cadre.append(aide);
      }
    }
    if (qzErreurs.length) {
      const liste = document.createElement("ul");
      qzErreurs.slice(0, 6).forEach(texte => {
        const li = document.createElement("li");
        li.textContent = texte;
        liste.append(li);
      });
      if (qzErreurs.length > 6) {
        const li = document.createElement("li");
        li.textContent = `… et ${qzErreurs.length - 6} autre(s).`;
        liste.append(li);
      }
      cadre.append(liste);
    }
    return cadre;
  }

  // Une question du questionnaire, pendant qu'elle est ouverte ou dévoilée.
  function dessinerQuestion(scene, question, etat) {
    const bloc = document.createElement("div");
    bloc.className = "q" + (etat.etat === "devoile" ? " devoile" : "");
    const haut = document.createElement("div");
    haut.className = "q-haut";
    const tete = document.createElement("div");
    tete.className = "q-tete";
    const num = document.createElement("div");
    num.className = "q-num";
    num.textContent = `Question ${question.numero} / ${qz.questions.length}`;
    tete.append(num);
    if (question.enonce) {
      const enonce = document.createElement("p");
      enonce.className = "q-enonce";
      ecrire(enonce, question.enonce);
      tete.append(enonce);
    }
    haut.append(tete);
    if (etat.etat === "question" && etat.reste !== null && etat.reste !== undefined) {
      const chrono = document.createElement("div");
      chrono.className = "q-chrono";
      chrono.id = "chrono";
      chrono.setAttribute("role", "timer");
      chrono.append(document.createElement("b"));
      haut.append(chrono);
    }
    const corps = document.createElement("div");
    corps.className = "q-corps";
    if (question.image) {
      const figure = document.createElement("div");
      figure.className = "q-figure";
      figure.append(image(question.image));
      corps.append(figure);
    }
    const reponses = document.createElement("div");
    reponses.className = "q-reponses";
    const n = question.choix.length;
    const avecImages = question.choix.some(c => c.image);
    // Trois réponses de texte : trois bandes pleine largeur (des mots
    // entiers y tiennent) ; trois figures : côte à côte.
    let colonnes = n === 3 ? (avecImages ? 3 : 1) : (n >= 5 ? 3 : 2);
    if (question.image) colonnes = n <= 3 && !avecImages ? 1 : 2;
    else if (avecImages && n === 4) colonnes = 4;
    reponses.style.setProperty("--cols", String(colonnes));
    question.choix.forEach((_, k) => reponses.append(RENDUS.choix.carte(question, k, etat)));
    corps.append(reponses);
    bloc.append(haut, corps);
    scene.append(bloc);
  }

  // La question tient-elle dans l'écran ? Sinon, tout rétrécit d'un même
  // facteur, par petits pas, jusqu'à tenir (jamais de défilement au tableau).
  let ajustement = 0;
  function ajusterBientot() {
    window.cancelAnimationFrame(ajustement);
    ajustement = window.requestAnimationFrame(ajuster);
  }
  function ajuster() {
    const scene = $("scene");
    const bloc = scene.querySelector(".q");
    if (!bloc) return;
    let t = 1;
    bloc.style.setProperty("--t", "1");
    const haut = bloc.querySelector(".q-haut");
    const deborde = () => scene.scrollHeight > scene.clientHeight + 1
      || bloc.scrollHeight > bloc.clientHeight + 1
      || haut.scrollHeight > haut.clientHeight + 1
      || [...bloc.querySelectorAll(".rep")].some(carte => carte.scrollHeight > carte.clientHeight + 1
        || carte.scrollWidth > carte.clientWidth + 1)
      || [...bloc.querySelectorAll(".rep .t")].some(texte => texte.scrollWidth > texte.clientWidth + 1);
    while (deborde() && t > 0.42) {
      t = Math.round((t - 0.06) * 100) / 100;
      bloc.style.setProperty("--t", String(t));
    }
  }
  window.addEventListener("resize", ajusterBientot);

  // Le chrono du tableau : un anneau qui se vide. C'est le SERVEUR qui tient la
  // fin (il refuse les réponses après) ; ici, l'affichage, et à zéro le
  // dévoilement.
  function majChrono() {
    if (!direct || direct.etat !== "question" || chronoDe !== direct.numero) return;
    const reste = Math.max(0, finChrono - Date.now());
    if (reste <= 0) devoilerMaintenant(false);
    const anneau = $("chrono");
    if (!anneau) return;
    const secondes = Math.ceil(reste / 1000);
    anneau.querySelector("b").textContent = String(secondes);
    const duree = Number(direct.duree) || 1;
    anneau.style.setProperty("--p", `${Math.min(100, reste / (duree * 1000) * 100)}%`);
    anneau.classList.toggle("fini", reste <= 0);
    anneau.setAttribute("aria-label", `${secondes} secondes`);
  }
  setInterval(majChrono, 200);

  function caleChrono() {
    if (!direct || direct.etat !== "question" || direct.reste === null || direct.reste === undefined) {
      chronoDe = 0;
      return;
    }
    // Le serveur compte en secondes entières : on ne recale l'horloge locale
    // que pour une nouvelle question, ou si elle s'écarte de plus d'une seconde
    // et demie (page restée cachée).
    const proposee = Date.now() + Number(direct.reste) * 1000 + 500;
    if (chronoDe !== direct.numero || Math.abs(proposee - finChrono) > 1500 || Number(direct.reste) === 0) {
      finChrono = Number(direct.reste) === 0 ? Date.now() : proposee;
      chronoDe = direct.numero;
    }
  }

  // Ce qui change le DESSIN de la scène. Le compteur et le chrono, eux, se
  // mettent à jour sans tout redessiner (les images ne clignotent pas).
  function cleScene() {
    const question = direct ? questionDuNumero(direct.numero) : null;
    if (direct && question) {
      return JSON.stringify(["qz", direct.etat, direct.numero, direct.bonne, direct.repartition, direct.reste !== null,
        qzEmpreinte, liens[String(direct.numero)]]);
    }
    const vue = direct ? Object.assign({}, direct, {reste: null, expire_dans: null}) : null;
    return JSON.stringify([connu, vue, qzEmpreinte, Boolean(qzAttendu), qzErreurs, prochaine, reserve]);
  }

  let derniereCle = "";
  function dessiner() {
    const cle = cleScene();
    if (cle !== derniereCle) {
      derniereCle = cle;
      dessinerScene();
    }
    dessinerCommandes();
    majChrono();
  }

  function dessinerScene() {
    const scene = $("scene");
    scene.textContent = "";
    scene.classList.remove("large");
    $("terminer").hidden = !direct;
    $("qz-titre").hidden = !(qz && direct);
    $("qz-titre").textContent = qz ? "· " + qz.titre : "";
    if (reserve) {
      scene.append(titre("Séance en direct"), ligne("sous", reserve));
      return;
    }
    if (!connu) return;

    if (!direct) {
      scene.append(titre("Séance en direct"));
      if (!qz) scene.append(ligne("sous", "Tu poses ta question à l’oral ou au tableau ; les élèves répondent sur leur écran."));
      scene.append(cadreQuestionnaire());
      return;
    }
    if (direct.etat === "attente" || !direct.type) {
      const etapes = document.createElement("p");
      etapes.className = "etapes";
      etapes.append("Entre ton code, puis clique sur ");
      const gras = document.createElement("b");
      gras.textContent = "Séance en direct";
      etapes.append(gras, ".");
      scene.append(titre("Rejoins la séance"), ligne("adresse", "suivi.mathsgo.re"), etapes);
      const presents = document.createElement("p");
      presents.className = "presents";
      const nombre = document.createElement("b");
      nombre.textContent = String(direct.connectes || 0);
      presents.append(nombre, ` connecté${(direct.connectes || 0) > 1 ? "s" : ""} sur ${direct.inscrits}`);
      scene.append(presents);
      if (qzAttendu && !qz) scene.append(cadreQuestionnaire());
      return;
    }
    const question = questionDuNumero(direct.numero);
    if (question) {
      scene.classList.add("large");
      dessinerQuestion(scene, question, direct);
      ajusterBientot();
      return;
    }
    const rendu = RENDUS[direct.type] || null;
    scene.append(titre("Question " + direct.numero));
    const sur = Math.max(direct.connectes || 0, direct.repondu || 0);
    if (direct.etat === "question") {
      const compteur = document.createElement("p");
      compteur.className = "compteur";
      compteur.append(String(direct.repondu));
      const petit = document.createElement("small");
      petit.textContent = " / " + sur;
      compteur.append(petit);
      const jauge = document.createElement("div");
      jauge.className = "jauge";
      const plein = document.createElement("i");
      plein.style.width = sur > 0 ? `${Math.min(100, Math.round(direct.repondu / sur * 100))}%` : "0";
      jauge.append(plein);
      scene.append(compteur, ligne("sous", direct.repondu > 1 ? "ont répondu" : "a répondu"), jauge);
      return;
    }
    // Dévoilée.
    if (rendu) rendu.resultats(scene, direct);
    const sans = Math.max(0, sur - direct.repondu);
    scene.append(ligne("bilan",
      `${direct.repondu} réponse${direct.repondu > 1 ? "s" : ""}`
      + (sans > 0 ? ` · ${sans} sans réponse` : "")
      + (direct.bonne ? "" : " · clique sur une barre pour désigner la bonne réponse")));
  }

  // La barre du bas : le compteur (questionnaire), la case « tous ont
  // répondu », le bouton du prochain geste.
  function dessinerCommandes() {
    const action = $("action");
    action.hidden = true;
    action.disabled = enAction;
    $("reglage-choix").hidden = true;
    $("compte").hidden = true;
    $("ouvrir-qz").hidden = true;
    $("case-tous").hidden = !direct;
    if (!connu) return;

    if (!direct) {
      action.textContent = "Ouvrir la séance";
      action.dataset.geste = "direct.ouvrir";
      action.hidden = false;
      return;
    }
    const question = direct.type ? questionDuNumero(direct.numero) : null;
    if (direct.etat === "question") {
      // Page rechargée en pleine question, questionnaire trop lourd pour
      // l'onglet : de quoi le rouvrir sans attendre le dévoilement.
      if (qzAttendu && !qz) {
        $("ouvrir-qz").textContent = `📂 Rouvrir « ${qzAttendu.titre} »`;
        $("ouvrir-qz").hidden = false;
      }
      if (question) {
        const sur = Math.max(direct.connectes || 0, direct.repondu || 0);
        const compte = $("compte");
        compte.textContent = "";
        const nombre = document.createElement("b");
        nombre.textContent = String(direct.repondu);
        const jauge = document.createElement("span");
        jauge.className = "jauge";
        const plein = document.createElement("i");
        plein.style.width = sur > 0 ? `${Math.min(100, Math.round(direct.repondu / sur * 100))}%` : "0";
        jauge.append(plein);
        compte.append(nombre, ` / ${sur} ont répondu `, jauge);
        compte.hidden = false;
      }
      action.textContent = "Dévoiler les réponses";
      action.dataset.geste = "direct.devoiler";
      action.hidden = false;
      return;
    }
    // En attente, ou question dévoilée : la suite.
    if (qzEnCours()) {
      action.textContent = `Question ${prochaine + 1} / ${qz.questions.length}  ▸`;
      action.dataset.geste = "qz.suivante";
      action.hidden = false;
      if (direct.etat === "devoile" && question) {
        const sur = Math.max(direct.connectes || 0, direct.repondu || 0);
        const sans = Math.max(0, sur - direct.repondu);
        messagerBilan(`${direct.repondu} réponse${direct.repondu > 1 ? "s" : ""}` + (sans > 0 ? ` · ${sans} sans réponse` : ""));
      }
      return;
    }
    if (direct.etat === "devoile" && question) {
      const sur = Math.max(direct.connectes || 0, direct.repondu || 0);
      const sans = Math.max(0, sur - direct.repondu);
      messagerBilan(`${direct.repondu} réponse${direct.repondu > 1 ? "s" : ""}` + (sans > 0 ? ` · ${sans} sans réponse` : "")
        + " · questionnaire terminé ✓");
    }
    // Sans questionnaire (ou après sa dernière question) : la question éclair
    // du lot 1, et de quoi ouvrir un questionnaire.
    $("ouvrir-qz").textContent = qzAttendu && !qz ? `📂 Rouvrir « ${qzAttendu.titre} »` : "📂 Questionnaire";
    $("ouvrir-qz").hidden = false;
    $("reglage-choix").hidden = false;
    action.textContent = "Lancer la question " + (direct.numero + 1);
    action.dataset.geste = "direct.question";
    action.hidden = false;
  }
  function messagerBilan(texte) {
    const compte = $("compte");
    compte.textContent = texte;
    compte.hidden = false;
  }

  // ------------------------------------------------------------------- gestes

  async function agir(geste, corps, apres) {
    if (enAction) return false;
    enAction = true;
    messager("");
    dessiner();
    const numeroAppel = ++compteurAppels;
    let reussi = false;
    try {
      const donnees = await api(geste, corps || {});
      if (retenir(numeroAppel, donnees) && apres) apres(donnees);
      reussi = true;
    } catch (erreur) {
      surErreur(erreur);
    } finally {
      enAction = false;
      caleChrono();
      dessiner();
    }
    return reussi;
  }

  // Dévoiler : au clic, à la fin du chrono, ou quand tous ont répondu. Avec la
  // bonne réponse du fichier s'il y en a une — c'est le premier instant où le
  // serveur la reçoit. Une seule demande par question.
  function devoilerMaintenant(auClic) {
    if (!direct || direct.etat !== "question") return;
    if (!auClic && devoilementDemande === direct.numero) return;
    if (enAction) { if (!auClic) window.setTimeout(() => devoilerMaintenant(false), 300); return; }
    const numero = direct.numero;
    devoilementDemande = numero;
    const question = questionDuNumero(numero);
    agir("direct.devoiler", question && question.bonne ? {bonne: question.bonne} : {}).then(reussi => {
      if (!reussi && devoilementDemande === numero) devoilementDemande = 0;
    });
  }
  function verifierDevoilementAuto() {
    if (!devoilerQuandTous || !direct || direct.etat !== "question") return;
    const connectes = Number(direct.connectes) || 0;
    if (connectes > 0 && Number(direct.repondu) >= connectes) devoilerMaintenant(false);
  }

  function lancerQuestionDuFichier() {
    if (!qzEnCours()) return;
    const rang = prochaine;
    const question = qz.questions[rang];
    // Le rang (17/10/2026) : le numéro affiché ici, pour que le téléphone dise le même.
    const reglage = {choix: question.choix.length, rang: question.numero};
    if (question.chrono) reglage.duree = question.chrono;
    agir("direct.question", {type: question.type, reglage}, donnees => {
      if (donnees.direct && donnees.direct.numero) {
        liens[String(donnees.direct.numero)] = rang;
        prochaine = rang + 1;
        sauverQz();
      }
    });
  }

  $("action").addEventListener("click", () => {
    const geste = $("action").dataset.geste;
    if (geste === "qz.suivante") {
      lancerQuestionDuFichier();
    } else if (geste === "direct.question") {
      const rendu = RENDUS.choix;
      agir(geste, {type: "choix", reglage: rendu.reglage()});
    } else if (geste === "direct.devoiler") {
      devoilerMaintenant(true);
    } else if (geste === "direct.ouvrir") {
      // Une séance neuve repart de la première question du questionnaire.
      agir(geste, {}, donnees => {
        if (donnees.direct && donnees.direct.numero === 0) { liens = {}; prochaine = 0; sauverQz(); }
      });
    } else if (geste) {
      agir(geste);
    }
  });

  // « Ma classe » (17/10/2026) : sans séance, on retourne dans la classe ;
  // pendant une séance, on demande — elle reste ouverte (« ● Reprendre » dans
  // la classe) et s'arrête seule vingt minutes après, ou on la termine ici,
  // fichier compris.
  let partirApresFin = false;
  $("retour").addEventListener("click", () => {
    if (!direct) { versLaClasse(); return; }
    $("quitter").showModal();
  });
  $("quitter-oui").addEventListener("click", versLaClasse);
  $("quitter-non").addEventListener("click", () => $("quitter").close());
  $("quitter-terminer").addEventListener("click", () => {
    $("quitter").close();
    partirApresFin = true;
    $("terminer").click();
  });
  $("ouvrir-qz").addEventListener("click", () => $("fichier").click());
  $("fichier").addEventListener("change", () => {
    const fichier = $("fichier").files && $("fichier").files[0];
    $("fichier").value = "";
    chargerFichier(fichier);
  });

  // Glisser le fichier sur la page — sauf pendant une question ouverte.
  function depotPermis() { return !direct || direct.etat !== "question" || Boolean(qzAttendu && !qz); }
  document.addEventListener("dragover", evenement => {
    if (!depotPermis()) return;
    evenement.preventDefault();
    const cadre = $("depot");
    if (cadre) cadre.classList.add("survol");
  });
  document.addEventListener("dragleave", () => {
    const cadre = $("depot");
    if (cadre) cadre.classList.remove("survol");
  });
  document.addEventListener("drop", evenement => {
    evenement.preventDefault();
    const cadre = $("depot");
    if (cadre) cadre.classList.remove("survol");
    if (!depotPermis()) return;
    const fichier = evenement.dataTransfer && evenement.dataTransfer.files && evenement.dataTransfer.files[0];
    chargerFichier(fichier);
  });

  // -------------------------------------- 17/10/2026 : l'exemple, et en préparer un
  //
  // L'exemple est dans questionnaire.js (QZ.exemple()) : rien à aller chercher.
  // Le texte collé passe par le MÊME chemin qu'un fichier (chargerTexte) : il
  // reste dans ce navigateur, rien ne part au serveur.
  function essayerExemple() {
    if (!QZ || direct) return;
    if (chargerTexte(QZ.exemple())) { dessiner(); ouvrirApercu(); }
    else dessiner();
  }

  function ouvrirPreparer() {
    if (direct) return;
    $("colle-erreurs").hidden = true;
    $("colle-erreurs").textContent = "";
    $("preparer").showModal();
  }
  $("preparer-fermer").addEventListener("click", () => $("preparer").close());

  $("copier-prompt").addEventListener("click", async () => {
    const texte = $("prompt-ia").value;
    let copie = false;
    try { await navigator.clipboard.writeText(texte); copie = true; } catch (_) {}
    if (!copie) {
      // Sans presse-papiers (ancien navigateur) : le texte sélectionné, Ctrl+C.
      $("prompt-ia").focus();
      $("prompt-ia").select();
      try { copie = document.execCommand("copy"); } catch (_) {}
    }
    $("copier-prompt").textContent = copie ? "Copié ✓" : "Sélectionné : fais Ctrl+C";
    window.setTimeout(() => { $("copier-prompt").textContent = "Copier le texte"; }, 2500);
  });

  $("ouvrir-colle").addEventListener("click", () => {
    if (direct) { $("preparer").close(); return; }
    const texte = $("colle").value;
    const liste = $("colle-erreurs");
    liste.textContent = "";
    if (!texte.trim()) {
      const li = document.createElement("li");
      li.textContent = "Colle d’abord la réponse de ton IA dans le cadre.";
      liste.append(li);
      liste.hidden = false;
      return;
    }
    if (chargerTexte(texte)) {
      $("colle").value = "";
      liste.hidden = true;
      $("preparer").close();
      dessiner();
      return;
    }
    // Les erreurs se lisent ici, à côté du texte ; le cadre derrière reste propre.
    qzErreurs.slice(0, 6).forEach(erreur => {
      const li = document.createElement("li");
      li.textContent = erreur;
      liste.append(li);
    });
    if (qzErreurs.length > 6) {
      const li = document.createElement("li");
      li.textContent = `… et ${qzErreurs.length - 6} autre(s).`;
      liste.append(li);
    }
    liste.hidden = false;
    qzErreurs = [];
    dessiner();
  });

  // --------------------------------------------------------------------- aperçu
  //
  // Toutes les questions, bonnes réponses comprises : pour vérifier le fichier
  // la veille. Seulement quand aucune séance n'est ouverte — l'écran est
  // peut-être déjà projeté.
  function ouvrirApercu() {
    if (!qz || direct) return;
    $("apercu-titre").textContent = "Aperçu — " + qz.titre;
    const liste = $("apercu-liste");
    liste.textContent = "";
    qz.questions.forEach(question => {
      const bloc = document.createElement("section");
      bloc.className = "apercu-q";
      const h3 = document.createElement("h3");
      h3.textContent = `Question ${question.numero}`;
      if (question.chrono) {
        const pastille = document.createElement("span");
        pastille.className = "pastille";
        pastille.textContent = `⏱ ${question.chrono} s`;
        h3.append(pastille);
      }
      bloc.append(h3);
      if (question.enonce) {
        const enonce = document.createElement("p");
        enonce.className = "enonce";
        ecrire(enonce, question.enonce);
        bloc.append(enonce);
      }
      if (question.image) {
        const figure = document.createElement("div");
        figure.className = "figure";
        figure.append(image(question.image));
        bloc.append(figure);
      }
      const ol = document.createElement("ol");
      question.choix.forEach((choix, k) => {
        const li = document.createElement("li");
        if (question.bonne === LETTRES[k]) li.className = "bonne";
        const badge = document.createElement("span");
        badge.className = "l";
        badge.textContent = LETTRES[k];
        li.append(badge);
        if (choix.image) li.append(image(choix.image));
        if (choix.texte) {
          const texte = document.createElement("span");
          ecrire(texte, choix.texte);
          li.append(texte);
        }
        if (question.bonne === LETTRES[k]) li.append(" ✓");
        ol.append(li);
      });
      bloc.append(ol);
      liste.append(bloc);
    });
    $("apercu").showModal();
  }
  $("apercu-fermer").addEventListener("click", () => $("apercu").close());

  // ------------------------------------------------------------ interrogation

  async function interroger() {
    if (enAction || reserve) return;
    const numeroAppel = ++compteurAppels;
    try {
      retenir(numeroAppel, await api("direct.etat"));
      if (pannes) { pannes = 0; messager(""); }
    } catch (erreur) {
      if (erreur.statut) { surErreur(erreur); return; }
      pannes += 1;
      if (pannes >= 2) messager("Connexion perdue. Nouvel essai…");
    }
    caleChrono();
    dessiner();
    verifierDevoilementAuto();
  }

  // Onglet caché (17/10/2026) : une interrogation par minute au lieu de
  // s'arrêter. C'est ce qui dit au serveur « le tableau est toujours là » :
  // sans elle, une séance menée pendant qu'on projette autre chose
  // s'arrêterait au bout de vingt minutes (lib/direct.php, VEILLE_DIRECT).
  const RYTHME_CACHE = 60000;
  function planifier() {
    window.clearTimeout(minuteur);
    if (reserve) return;
    const attente = document.visibilityState === "hidden" ? RYTHME_CACHE
      : (pannes >= 2 ? Math.min(rythme * 3, 10000) : rythme);
    minuteur = window.setTimeout(async () => { await interroger(); planifier(); }, attente);
  }
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") { planifier(); return; }
    if (veilleDepassee()) { versMaClasse(); return; }
    await interroger();
    planifier();
  });

  // --------------------------------------------------- terminer, et le fichier

  // Une cellule de tableur. Un prénom qui commencerait par « = », « + », « - »
  // ou « @ » serait pris pour une formule par Excel : on le neutralise.
  function cellule(valeur) {
    let texte = String(valeur === null || valeur === undefined ? "" : valeur);
    if (/^[=+\-@\t\r]/.test(texte)) texte = "'" + texte;
    return /[";\r\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
  }

  // Le fichier, en mémoire : une ligne par élève, une colonne par question,
  // puis le nombre de bonnes réponses (sur les questions où une bonne réponse
  // a été désignée). Point-virgule et marque d'ordre des octets : c'est ce
  // qu'un Excel français ouvre sans rien demander.
  function fabriquerFichier(contenu) {
    const questions = contenu.questions || [];
    const corrigees = questions.filter(question => question.bonne);
    const lignes = [];
    lignes.push(["Élève", ...questions.map(question => "Q" + question.numero),
      ...(corrigees.length ? [`Bonnes réponses (sur ${corrigees.length})`] : [])]);
    if (corrigees.length) {
      lignes.push(["Bonne réponse", ...questions.map(question => question.bonne || ""), ""]);
    }
    (contenu.eleves || []).forEach(eleve => {
      const reponses = eleve.reponses || {};
      const nom = eleve.prenom
        ? eleve.prenom + (eleve.initiale ? ` ${eleve.initiale}.` : "")
        : "(sans prénom)";
      const cases = questions.map(question => {
        const rendu = RENDUS[question.type];
        const reponse = reponses[String(question.numero)];
        return rendu ? rendu.cellule(reponse) : (reponse || "");
      });
      const ligneEleve = [nom, ...cases];
      if (corrigees.length) {
        ligneEleve.push(corrigees.filter(question => reponses[String(question.numero)] === question.bonne).length);
      }
      lignes.push(ligneEleve);
    });
    return "﻿" + lignes.map(l => l.map(cellule).join(";")).join("\r\n") + "\r\n";
  }

  // Le nom du fichier : la classe, le jour, et (lot 2) le titre du
  // questionnaire s'il y en avait un — rien qui gêne Windows.
  function nomDuFichier(contenu) {
    const propre = texte => String(texte || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const classe = propre((contenu.classe && contenu.classe.libelle) || "classe") || "classe";
    const jour = /^\d{4}-\d{2}-\d{2}$/.test(contenu.jour || "") ? contenu.jour : "";
    const sujet = propre(contenu.titre).slice(0, 40).replace(/-+$/g, "");
    return `seance-en-direct-${classe}${jour ? "-" + jour : ""}${sujet ? "-" + sujet : ""}.csv`;
  }

  function telecharger(nom, texte) {
    const blob = new Blob([texte], {type: "text/csv;charset=utf-8"});
    const adresse = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = adresse;
    lien.download = nom;
    document.body.append(lien);
    lien.click();
    lien.remove();
    window.setTimeout(() => URL.revokeObjectURL(adresse), 10000);
  }

  $("terminer").addEventListener("click", () => {
    const posees = direct ? direct.numero : 0;
    $("fin-texte").textContent = posees > 0
      ? "Les réponses de la séance seront effacées du serveur. Le fichier (une ligne par élève) est le seul endroit où elles resteront."
      : "Aucune question n’a été posée : il n’y a rien à télécharger.";
    $("fin-fichier").hidden = posees < 1;
    $("fin-sans").textContent = posees > 0 ? "Terminer sans fichier" : "Terminer la séance";
    $("fin").showModal();
  });
  $("fin-non").addEventListener("click", () => { partirApresFin = false; $("fin").close(); });
  // Échap ferme la fenêtre sans passer par « Annuler » (relevé par Code sur la
  // PR #1010) : sans cette ligne, le prochain « Terminer » ramenait dans la classe.
  $("fin").addEventListener("cancel", () => { partirApresFin = false; });

  async function terminer(avecFichier) {
    if (enAction) return;
    enAction = true;
    ["fin-fichier", "fin-sans", "fin-non"].forEach(id => { $(id).disabled = true; });
    try {
      if (avecFichier) {
        // Le fichier D'ABORD, l'effacement ensuite : si le téléchargement
        // échoue, la séance est encore là et l'on peut recommencer.
        const contenu = await api("direct.fichier");
        if (qz) contenu.titre = qz.titre;
        telecharger(nomDuFichier(contenu), fabriquerFichier(contenu));
      }
      const numeroAppel = ++compteurAppels;
      await api("direct.terminer");
      retenir(numeroAppel, {direct: null});
      // Le questionnaire reste ouvert, prêt pour une autre séance, depuis le début.
      liens = {}; prochaine = 0; devoilementDemande = 0;
      sauverQz();
      $("fin").close();
      messager("");
      if (partirApresFin) { versLaClasse(); return; }
    } catch (erreur) {
      $("fin").close();
      surErreur(erreur);
    } finally {
      partirApresFin = false;
      enAction = false;
      ["fin-fichier", "fin-sans", "fin-non"].forEach(id => { $(id).disabled = false; });
      dessiner();
    }
  }
  $("fin-fichier").addEventListener("click", () => terminer(true));
  $("fin-sans").addEventListener("click", () => terminer(false));

  interroger().then(planifier);
})();
</script>
</body>
</html>
