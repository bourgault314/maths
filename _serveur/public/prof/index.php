<?php
// Page « Ma classe » — réservée au professeur, protégée par mot de passe.
require_once __DIR__ . '/../lib/entetes.php';
header('Content-Type: text/html; charset=utf-8');
// Politique de contenu (voir lib/entetes.php) : seuls le moteur servi d'ici et
// le script portant ce nonce s'exécutent dans la page. Serveur pro, lot 5f :
// la fenêtre de l'élève de Défi tables montre son écran Mon parcours, une page
// de mathsgo.re, dans un cadre — cette page-ci, et elle seule, l'autorise.
$nonce = entetes_page('https://mathsgo.re');
// Le moteur est une copie de outils/calcul_mental/defi_tables_mon_parcours.js
// (identité vérifiée par un test du dépôt). Sa version dans l'adresse suit son
// contenu : un nouveau fichier déposé n'est jamais masqué par le cache.
$moteur = __DIR__ . '/defi_tables_mon_parcours.js';
$versionMoteur = is_file($moteur) ? substr(md5_file($moteur), 0, 10) : '0';
// Lot « splat-suivi-4 » : le moteur de SPLAT! (copie de assets/js/splat-parcours.js,
// déposée au lot 3), chargé seulement quand on ouvre l'onglet SPLAT! d'une classe.
$moteurSplat = __DIR__ . '/splat-parcours.js';
$versionSplat = is_file($moteurSplat) ? substr(md5_file($moteurSplat), 0, 10) : '0';
// Lot « Coffres magiques sur le suivi » (21/10/2026) : le moteur de Coffres
// (copie de assets/js/coffres-parcours.js), chargé seulement quand on ouvre
// l'onglet Coffres magiques d'une classe.
$moteurCoffres = __DIR__ . '/coffres-parcours.js';
$versionCoffres = is_file($moteurCoffres) ? substr(md5_file($moteurCoffres), 0, 10) : '0';
// Lot « Qui voit quoi », lot 4b (24/10/2026) : le moteur d'Anzan (copie de
// outils/calcul_mental/flash_anzan_parcours.js, déposée au lot 4a), chargé
// seulement quand on ouvre l'onglet Anzan d'une classe.
$moteurAnzan = __DIR__ . '/flash_anzan_parcours.js';
$versionAnzan = is_file($moteurAnzan) ? substr(md5_file($moteurAnzan), 0, 10) : '0';
// Défi calcul (lot 2b, 31/10/2026) : ses DEUX moteurs, copies de
// outils/calcul_mental/defi_calcul_core.js (la carte, les noms, les erreurs
// connues et leurs exemples) et defi_calcul_mon_parcours.js (les boîtes,
// resumeProf), chargés seulement quand on ouvre l'onglet Défi calcul.
$moteurCalculCore = __DIR__ . '/defi_calcul_core.js';
$versionCalculCore = is_file($moteurCalculCore) ? substr(md5_file($moteurCalculCore), 0, 10) : '0';
$moteurCalcul = __DIR__ . '/defi_calcul_mon_parcours.js';
$versionCalcul = is_file($moteurCalcul) ? substr(md5_file($moteurCalcul), 0, 10) : '0';
// Lot E1 « les évaluations en classe » (15/10/2026) : le NOYAU de Défi tables
// (copie de outils/calcul_mental/defi_tables_core.js, identité vérifiée par un
// test), pour refaire le tirage d'une évaluation et la corriger ici.
$moteurCore = __DIR__ . '/defi_tables_core.js';
$versionCore = is_file($moteurCore) ? substr(md5_file($moteurCore), 0, 10) : '0';
// Serveur pro, lot 5a (25/10/2026) : la charte commune du serveur de suivi
// (suivi.css), chargée AVANT le style propre de la page. Son adresse porte son
// empreinte : une nouvelle charte déposée n'est jamais masquée par le cache,
// et une ancienne ne se mélange pas à une nouvelle page.
$charte = __DIR__ . '/../suivi.css';
$versionCharte = is_file($charte) ? substr(md5_file($charte), 0, 10) : '0';
// Lot « cours-appli » (08/11/2026) : le catalogue du livret de cours (chapitres,
// fiches, adresses), pour l'onglet « Cours » et sa fenêtre de réglage. Posé
// dans la page en données (un bloc « script » de type application/json, jamais exécuté).
require_once __DIR__ . '/../lib/cours.php';
$coursCatalogue = json_encode(cours_pour_le_prof(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
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
<link rel="stylesheet" href="../suivi.css?v=<?= htmlspecialchars($versionCharte, ENT_QUOTES) ?>">
<style>
  /* Serveur pro, lot 5a « la charte et la tête » (25/10/2026) : la charte
     commune (../suivi.css, chargée juste au-dessus) donne les couleurs, le
     texte, les titres, les trois boutons, les champs, la carte, la tuile, le
     message, les onglets, la pastille et le tableau. Ce style-ci ne garde que
     ce qui est propre à Ma classe. Avant, il recopiait tout cela à sa façon
     (22 tailles de texte, 21 sortes de boutons). */
  .carte.imprimer { max-width: 720px; margin-top: 18px; }
  .carte.imprimer .sous { margin: 4px 0 10px; }
  .liens-imprimer { margin: 0; padding-left: 20px; }
  .liens-imprimer li { margin: 6px 0; line-height: 1.5; }
  .cartes-tables { display: inline-flex; flex-wrap: wrap; gap: 4px 10px; margin-left: 4px; }
  .cartes-tables a { white-space: nowrap; }
  /* Le prénom se saisit directement dans la liste de l'onglet Élèves : discret
     tant qu'on n'y touche pas. Dans les tableaux des applis, c'est du texte. */
  #tableau-eleves td input { min-height: 40px; padding: 6px 8px; font-weight: 600; border-color: transparent; background: transparent; }
  #tableau-eleves td input:hover { border-color: var(--line); background: #fff; }
  #tableau-eleves td input::placeholder { font-weight: 400; font-style: italic; color: var(--indice); }
  #tableau td.nom { font-weight: 600; }
  /* L'en-tête (charte : .entete) : le nom de l'écran au milieu (titre-page). */
  .entete .qui { white-space: nowrap; }
  /* Serveur pro, lot 5d : plus d'écran « Mes classes ». Un professeur sans
     aucune classe voit une seule carte, « Crée ta première classe ». */
  .premiere-classe { max-width: 520px; margin: 24px auto 0; }
  .premiere-classe h1 { margin: 0 0 8px; }
  .premiere-classe .actions { margin: 16px 0 0; }
  .premiere-classe .note { margin: 16px 0 0; }
  #message-premiere-classe { max-width: 520px; margin: 12px auto 0; }
  #premiere-classe svg, #nouvelle-classe svg { display: block; flex: none; }
  li.vide { color: var(--muted); }
  /* La tête d'une classe (choix de Gwenaël, planche 1, 25/10/2026) : « 405 ▾ »
     ouvre la liste de ses classes, « Toutes mes classes » au bout ; « Séance
     en direct » à droite. Le menu se ferme par Échap, par un clic ailleurs ou
     au choix d'une classe. */
  .tete-classe { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .tete-classe h1 { margin: 0; }
  .tete-classe #seance-direct { margin-left: auto; }
  #resume-classe { margin: 2px 0 16px; }
  .choix-classe { position: relative; min-width: 0; }
  .choix-classe h1 button {
    min-height: var(--cible); max-width: 100%; padding: 0 8px 0 0; gap: 10px;
    color: var(--blue-dark); background: none; border: 0; border-radius: var(--arrondi);
    font: 400 var(--titre-page)/1.2 var(--serif); white-space: normal; text-align: left; }
  .choix-classe h1 button:hover { color: var(--blue); background: none; border: 0; }
  .choix-classe .rond { display: inline-grid; place-items: center; flex: none; width: 30px; height: 30px;
                        border-radius: 50%; background: var(--bleu-pale); color: var(--blue); }
  .choix-classe .rond svg { display: block; transition: transform .15s; }
  .choix-classe h1 button[aria-expanded="true"] .rond svg { transform: rotate(180deg); }
  .menu-classes { position: absolute; top: calc(100% + 6px); left: 0; z-index: 6; width: 340px;
                  max-height: min(70vh, 480px); overflow-y: auto; padding: 6px;
                  background: var(--paper); border: 1px solid var(--line); border-radius: var(--arrondi-carte);
                  box-shadow: var(--ombre-fenetre); }
  .menu-classes ul { margin: 0; padding: 0; list-style: none; }
  .menu-classes button { width: 100%; justify-content: flex-start; gap: 12px; padding: 0 12px;
                         color: var(--ink); background: none; border: 0; font-weight: 400; text-align: left; }
  /* Lot 5d : ce que disait la tuile d'une classe — « partagée par … » et la
     séance restée ouverte — est dans sa ligne du menu (340 px de large pour
     que « partagée par … · modifiable » tienne sur une ligne). */
  .menu-classes li button { align-items: center; padding: 8px 12px; white-space: normal; }
  .menu-classes .infos { display: flex; flex-direction: column; min-width: 0; }
  .menu-classes .infos .ligne-1 { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; }
  .menu-classes em.en-direct { padding: 1px 8px; border-radius: 999px; background: var(--orange-pale);
                               color: var(--orange-texte); font-size: var(--texte-secondaire); font-style: normal; font-weight: 700;
                               white-space: nowrap; }
  .menu-classes .infos .partage { color: var(--orange-texte); }
  .menu-classes button:hover { color: var(--ink); background: var(--survol); border: 0; }
  .menu-classes button strong { min-width: 48px; color: var(--blue-dark); }
  .menu-classes button span { color: var(--muted); font-size: var(--texte-secondaire); }
  .menu-classes button[aria-current="true"] { background: var(--bleu-pale); }
  .menu-classes button[aria-current="true"]::after { content: "✓"; margin-left: auto; color: var(--blue); font-weight: 700; }
  .menu-classes #nouvelle-classe { margin-top: 6px; gap: 8px; color: var(--blue); font-weight: 700; border-top: 1px solid var(--filet-doux);
                                   border-radius: 0 0 var(--arrondi) var(--arrondi); }
  /* Le « 405 ▾ » en petit, au début de la barre collée (téléphone). */
  /* Correctif des lots 5 (point 6) : un nom long (« Troisième groupe de
     remédiation ») ne pousse plus Élèves et Réglages hors de l'écran — il
     rétrécit et finit par « … » — plus vite que le nom de l'appli à côté
     (rétrécissement 4 contre 1), qui reste lisible. */
  .classe-collee { flex: 0 4 auto; min-width: 0; max-width: 45%; align-self: center; margin-right: 4px; padding: 0 8px 0 0; gap: 4px;
                   color: var(--blue-dark); background: none; border: 0; font: 400 var(--titre-carte)/1.2 var(--serif); }
  .classe-collee span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .classe-collee:hover { color: var(--blue); background: none; border: 0; }
  .classe-collee svg { display: block; flex: none; color: var(--blue); }
  /* Ouvert depuis la barre collée : le menu suit la barre, pas le haut de la page. */
  .menu-classes.depuis-barre { position: fixed; }
  /* La barre collée (choix de Gwenaël, 25/10/2026 : au téléphone, puis « à
     l'ordinateur aussi ») : 46 px, toute la largeur de la page, sur le fond de
     la page pour que rien ne se lise au travers. */
  .barre-onglets { position: sticky; top: 0; z-index: 5; margin-left: -16px; margin-right: -16px;
                   padding: 0 16px; background: var(--page); }
  .barre-onglets.collee { box-shadow: 0 8px 12px -10px rgba(16, 41, 74, .45); }
  /* Le sélecteur d'appli, quand les onglets ne tiennent plus : il a l'air de
     l'onglet choisi (trait bleu), avec la flèche du menu. */
  .barre-onglets.mode-selecteur > #choix-appli { display: none; }
  .choix-appli-menu { position: relative; display: flex; flex: 1 1 auto; min-width: 0; }
  .appli-selecteur { min-width: 0; max-width: 100%; margin-bottom: -2px; padding: 0 12px; gap: 6px; justify-content: flex-start;
                     color: var(--muted); background: none; border: 0; border-bottom: 3px solid transparent;
                     border-radius: var(--arrondi) var(--arrondi) 0 0; }
  .appli-selecteur:hover { color: var(--blue-dark); background: var(--bleu-pale); border: 0; border-bottom: 3px solid transparent; }
  .appli-selecteur.actif, .appli-selecteur.actif:hover { color: var(--blue-dark); border-bottom-color: var(--blue); }
  .appli-selecteur span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .appli-selecteur svg { display: block; flex: none; color: var(--blue); }
  .menu-applis { left: 0; width: 260px; }
  .tableau-enveloppe { margin-top: 12px; }
  th, td { white-space: nowrap; }
  /* Serveur pro, lot 5c « les tableaux et la fenêtre de l'élève » (choix de
     Gwenaël, maquettes 8 et 9 du 25/10/2026). Au-dessus du tableau : la
     recherche d'un prénom. Plus de « Trier par » : les titres de colonnes
     trient, la flèche dit laquelle et dans quel sens. */
  .outils-tableau { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 24px 0 0; }
  .outils-tableau .chercher { position: relative; flex: 0 1 300px; }
  .outils-tableau .chercher input { padding-left: 40px; }
  .outils-tableau .periode-coffres { margin: 0 0 0 auto; }
  .outils-tableau .chercher svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  #tableau th[aria-sort="ascending"] button::after { content: " ▲"; font-size: .8em; }
  #tableau th[aria-sort="descending"] button::after { content: " ▼"; font-size: .8em; }
  /* La ligne entière s'ouvre : plus de bouton par ligne. Le prénom est un
     bouton (le clavier y arrive), la flèche dit qu'on peut entrer. Serveur
     pro, lot 5f (retours de Gwenaël des 25, 26 et 28/10/2026) : la ligne
     ouvre la fenêtre de l'élève dans les quatre applis ; dans Défi tables,
     cette fenêtre montre son écran Mon parcours lui-même. */
  #tableau tbody tr.cliquable { cursor: pointer; }
  /* Lot 8 (retours du 31/10/2026) : la ligne entière s'allume, bleu très pâle
     (le « en cours » de la charte) — on voit d'un coup qu'elle s'ouvre. Sur
     le « ⋯ », elle s'éteint : lui seul s'allume, il n'ouvre pas la ligne. */
  #tableau tbody tr.cliquable:hover td { background: #eef6ff; }
  #tableau tbody tr.cliquable:has(td.geste .plus:hover) td { background: none; }
  .lien-eleve { min-height: 0; padding: 0; gap: 0; justify-content: flex-start; color: var(--blue-dark); background: none;
                border: 0; border-radius: 4px; font: inherit; font-weight: 600; text-align: left; white-space: nowrap; }
  .lien-eleve:hover, tr.cliquable:hover .lien-eleve { color: var(--blue); background: none; border: 0; text-decoration: underline; }
  td.nom.sans .lien-eleve { color: var(--muted); font-style: italic; font-weight: 400; }
  /* Le bout de la ligne : « ⋯ » (« Revenir à… », lot 5f — il était en bas de
     la fenêtre de l'élève, « trop visible ») puis la flèche. Le « ⋯ » ne
     grandit pas la ligne (marges négatives). Lot 8 : chacun sa colonne — le
     « ⋯ » dans la sienne, discret (sans cadre tant qu'on ne le survole
     pas) ; la flèche seule tout au bout, à la même place sur chaque ligne. */
  #tableau td.geste { width: 1%; padding-left: 8px; padding-right: 4px; text-align: center; white-space: nowrap; }
  #tableau td.va { width: 1%; padding-left: 0; text-align: right; white-space: nowrap; }
  /* Lot 5f : la page remonte au message d'un parcours refusé — sous la ligne
     des onglets, collée en haut, pas derrière elle. */
  #message-appli { scroll-margin-top: 84px; }
  #tableau td.geste .plus { display: inline-block; margin: -9px 0; vertical-align: middle; }
  #tableau td.geste .plus summary { color: var(--muted); background: none; border-color: transparent; }
  #tableau td.geste .plus summary:hover, #tableau td.geste .plus[open] summary,
  #tableau td.geste .plus summary:focus-visible { color: var(--blue-dark); background: var(--paper); border-color: var(--blue); }
  #tableau td.va .fleche { display: inline-block; width: 28px; vertical-align: middle;
                           color: var(--blue); font-size: var(--titre-carte); text-align: right; }
  #tableau .seul-telephone { display: none; }
  /* Lot S4a (08/11/2026) : au téléphone, ce que disent les colonnes cachées
     tient en une ligne sous le prénom (« table de 7 », « 1 à voir en classe »). */
  #tableau .indice-tel { display: none; }
  #tableau td.aucun { color: var(--muted); font-style: italic; white-space: normal; }
  /* Les trois cartes du haut de Défi tables, côte à côte, de la même largeur
     (charte : .grille-cartes), sans filet de couleur. */
  /* La fenêtre de l'élève : la même dans les quatre applis (charte :
     .fenetre). ‹ › en haut à droite pour passer au précédent, au suivant,
     puis ✕ pour la fermer (lot 5f). */
  .fenetre-eleve .fenetre-tete { position: relative; padding-right: 166px; }
  .fenetre-eleve .naviguer { position: absolute; top: 16px; right: 16px; display: flex; gap: 6px; }
  .fenetre-eleve .naviguer button { width: 44px; padding: 0; font-size: 22px; line-height: 1; }
  .fenetre-eleve .fenetre-tete h2 { overflow-wrap: anywhere; }
  /* Serveur pro, lot 5f (choix de Gwenaël du 28/10/2026, « ouvrir dans la
     même fenêtre avec une petite croix ») : dans Défi tables, la fenêtre est
     grande et montre son écran Mon parcours (mathsgo.re) dans un cadre. Plus
     d'onglet par élève : ‹ › passent au suivant, ✕ ferme. Au téléphone, elle
     prend tout l'écran. Le pied (« Fermer ») laisse la place au parcours. */
  .avec-parcours .fenetre-tete { padding-bottom: 10px; border-bottom: 1px solid var(--filet-doux); }
  .avec-parcours .fenetre-corps { display: flex; flex-direction: column; padding: 0; overflow: hidden; }
  .avec-parcours #fe-contenu { display: flex; flex: 1 1 auto; min-height: 0; }
  .avec-parcours .fenetre-pied { display: none; }
  .avec-parcours #fe-message { margin: 10px 20px 0; }
  .fe-cadre { display: flex; flex: 1 1 auto; min-height: 0; background: var(--page); }
  .fe-cadre iframe { display: block; flex: 1 1 auto; width: 100%; height: 100%; border: 0; }
  .fe-attente { margin: auto; padding: 24px; color: var(--muted); text-align: center; }
  /* « Ouvrir dans un onglet » : discret, sous le titre (pour imprimer sa
     fiche depuis un onglet à part, par exemple). */
  .fenetre-eleve .lien-onglet { min-height: 0; margin-top: 4px; padding: 0; color: var(--blue-dark); background: none; border: 0;
                                font: inherit; font-size: var(--texte-secondaire); text-decoration: underline; }
  .fenetre-eleve .lien-onglet:hover { color: var(--blue); background: none; border: 0; }
  .fiche-chiffres { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); margin: 4px 0 16px; }
  .fiche-chiffres > div { min-width: 0; padding: 10px 12px; background: var(--page); border: 1px solid var(--filet-doux); border-radius: var(--arrondi); }
  .fiche-chiffres dt { color: var(--muted); font-size: var(--texte-secondaire); }
  .fiche-chiffres dd { margin: 2px 0 0; font-weight: 700; }
  .fiche-chiffres dd small { display: block; font-weight: 400; }
  .fenetre-eleve h3 { margin: 16px 0 6px; font-size: 16px; color: var(--ink); }
  .fenetre-eleve h3:first-child { margin-top: 0; }
  .fe-vide { margin: 4px 0 8px; color: var(--muted); }
  .fenetre-eleve .partie-en-cours { margin: 0 0 12px; }
  /* Lot 2b (03/10/2026) : la ligne d'un élève se lit sans survol et
     s'imprime en noir et blanc — du texte, pas des cases de couleur. */
  .acquises-liste { margin-left: 7px; color: var(--muted); font-size: .86rem; }
  .en-cours b { color: var(--ink); }
  .en-cours .cases { color: var(--muted); }
  .en-cours.melange { color: #7a5a00; font-weight: 700; }
  .en-cours.expert { color: #8a5a00; font-weight: 800; letter-spacing: .06em; }
  .seances { font-weight: 800; color: var(--ink); }
  .seances.zero { color: var(--muted); font-weight: 600; }
  /* Serveur pro, lot 5g : « 2 · 0 · 1 · 3 », la semaine en cours à droite, en
     gras ; les semaines sans séance en gris. Du texte : lisible imprimé en
     noir et blanc. */
  .semaines { white-space: nowrap; color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }
  .semaines .zero { color: var(--muted); }
  .semaines .inconnu { color: var(--muted); font-weight: 600; }
  .semaines b { font-weight: 900; }
  /* Lot 8 (retours du 31/10/2026) : le séparateur a son propre nom. Il
     s'appelait « point » et prenait la pastille verte de « ● Ouvert à toute
     la classe » (lot 5b) : un rond vert entre chaque semaine. */
  .semaines .sep-semaine { color: var(--muted); }
  .alerte { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 999px;
            border: 1px solid #d9a3a3; background: #fff5f5; color: #9b2c2c;
            font-size: .78rem; font-weight: 800; white-space: nowrap; }
  /* Les gestes rares (revenir à une version, nouveau code, supprimer) sont
     rangés derrière « ⋯ » : quatre boutons par ligne faisaient déborder le
     tableau de 110 px à 1 220 px. */
  .plus { position: relative; }
  .plus summary { list-style: none; cursor: pointer; display: inline-flex; align-items: center;
                  justify-content: center; min-width: 44px; min-height: 44px; padding: 0 8px;
                  border: 1px solid var(--line); border-radius: 10px; background: var(--paper);
                  color: var(--blue-dark); font-weight: 800; }
  .plus summary::-webkit-details-marker { display: none; }
  .plus summary:hover { border-color: var(--blue); background: #f3f8fc; }
  /* En position fixe, placé par le script à l'ouverture : l'enveloppe du
     tableau défile en largeur, elle couperait un menu « absolu » sur les
     dernières lignes de la classe. */
  .plus[open] > div { position: fixed; z-index: 5;
                      display: grid; gap: 6px; min-width: 170px; padding: 8px;
                      background: var(--paper); border: 1px solid var(--line); border-radius: 12px;
                      box-shadow: 0 8px 24px rgba(16, 42, 67, .16); }
  .plus > div button { width: 100%; text-align: left; }
  td.code { font-family: ui-monospace, Consolas, monospace; font-weight: 700;
            letter-spacing: .08em; color: var(--blue-dark); }
  td.sans { color: var(--muted); font-style: italic; }
  .p-vert { background: #e6f6ea; color: var(--vert); }
  .p-orange { background: #fdf0e3; color: #a15c11; }
  .p-gris { background: #eef1f5; color: var(--muted); }
  #seance-direct .point { color: #f9bf3b; }
  .profs { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .profs li { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 8px 12px;
              background: #fbfcfe; border: 1px solid var(--line); border-radius: 10px; }
  .profs li strong { color: var(--blue-dark); }
  .profs li .fin { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
  .profs li.vide { color: var(--muted); font-style: italic; border-style: dashed; }
  .profs .role { color: var(--muted); font-size: .86rem; }
  /* Lot 5d : Professeurs, dans Mon compte — une ligne par professeur, ses
     gestes derrière « ⋯ ». */
  .profs.comptes li { flex-wrap: nowrap; gap: 12px; padding: 8px 8px 8px 12px; }
  .profs.comptes .qui-prof { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
  .profs.comptes .qui-prof strong { overflow-wrap: anywhere; }
  .profs.comptes li.eteint strong, .profs.comptes li.eteint .role { color: var(--muted); }
  .profs.comptes .plus { flex: none; }
  .carte-compte { max-width: 640px; }
  #ecran-compte h2 { margin-top: 24px; }
  .retour-icone svg { display: block; }
  #retour-compte { margin-bottom: 12px; }
  .note-tableau { margin: 10px 0 0; font-size: .88rem; }
  /* L'objectif de la classe : UN nombre, celui de tout le monde. Jamais un
     classement, jamais un prenom : c'est le seul tableau de la page ou aucun
     eleve n'est designe. Calcule ici, a partir des progressions deja chargees
     — aucune donnee de plus n'est demandee au serveur. */
  /* Lot 5c : les trois cartes du haut côte à côte (.grille-cartes), sans
     filet de couleur — la charte. */
  .objectif strong { display: block; color: var(--blue-dark); font-family: Georgia, serif; font-size: 1.05rem; }
  .objectif .jauge-barre { height: 10px; margin-top: 10px; border-radius: 999px;
                           background: #e6ecf3; overflow: hidden; }
  .objectif .jauge-barre i { display: block; height: 100%; border-radius: 999px;
                             background: linear-gradient(90deg, #08aaa5, #0b67b2); }
  .objectif .compte { display: block; margin-top: 8px; color: var(--ink);
                      font-size: 1.02rem; font-weight: 800; }
  .objectif .lignes { list-style: none; display: flex; flex-wrap: wrap; gap: 8px 18px;
                      margin: 10px 0 0; padding: 0; color: var(--muted); font-size: .9rem; }
  .objectif .lignes b { color: var(--ink); }
  .objectif .lignes .insecable { white-space: nowrap; }
  /* Lot S4c : SPLAT!, « Par monde ». */
  .splat-mondes strong { display: block; color: var(--blue-dark); font-family: Georgia, serif; font-size: 1.05rem; }
  .splat-mondes ul { list-style: none; margin: 8px 0 0; padding: 0; }
  .splat-mondes li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; padding: 5px 0; border-top: 1px solid var(--filet-doux); font-size: .9rem; color: var(--muted); }
  .splat-mondes li:first-child { border-top: 0; }
  .splat-mondes li > b { flex: 0 0 4.6em; color: var(--ink); }
  .splat-mondes li .bouton-nombre { color: var(--ink); font-weight: 800; }
  .splat-mondes .sous { margin: 8px 0 0; color: var(--muted); font-size: .88rem; }
  .splat-mondes .sous .bouton-nombre { color: var(--ink); font-weight: 800; }
  .fragiles strong { display: block; color: var(--blue-dark); font-family: Georgia, serif; font-size: 1.05rem; }
  .fragiles p { margin: 4px 0 10px; color: var(--muted); font-size: .88rem; }
  .fragiles ul { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; }
  .fragiles li { display: flex; align-items: baseline; gap: 6px; padding: 6px 12px; border-radius: 999px;
                 background: #fdf0e3; color: #8a4c0a; font-weight: 800; }
  .fragiles li span, .fragiles li .bouton-nombre { font-size: .82rem; font-weight: 600; color: #a15c11; }
  .barre-outils { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
  /* Lot « Ma classe : réglages » (17/10/2026, planches 1 à 5 validées par
     Gwenaël) : sous le nom de la classe, une rangée d'onglets TOUJOURS
     visible — les activités de la classe à gauche, « Réglages » au bout à
     droite (propriétaire seulement). Avant, le choix de l'activité n'existait
     qu'à partir de deux activités, et rien ne disait « Défi tables » à
     l'écran. */
  /* Serveur pro, lot 5a (planches 1 et 6 du 25/10/2026) : UNE ligne
     d'onglets. Les applis à gauche (charte : .onglets, elles défilent au
     téléphone et s'effacent vers la droite quand il y a une suite) ; au bout,
     « Élèves » et « Réglages », qui ne défilent jamais : toujours à portée de
     doigt, en dessin seul au téléphone (choix du 18/10, gardé). */
  .barre-onglets { display: flex; align-items: flex-end; margin: 4px 0 20px; border-bottom: 2px solid var(--line); }
  #bandeau-droit + #repere-onglets + .barre-onglets { margin-top: 14px; }
  .barre-onglets > .onglets { flex: 1 1 auto; min-width: 0; margin: 0; border-bottom: 0; }
  .barre-onglets > .onglets-classe { flex: none; overflow: visible; margin-left: 8px; }
  .onglets-classe > button { display: inline-flex; align-items: center; gap: 8px; }
  .onglets-classe > button svg { display: block; flex: none; }
  .barre-onglets > .onglets.suite { -webkit-mask-image: linear-gradient(90deg, #000 80%, transparent);
                                    mask-image: linear-gradient(90deg, #000 80%, transparent); }
  /* La vue « Réglages » : une colonne de cartes — Partager, Nom de la
     classe, Supprimer la classe. Serveur pro, lot 5b : les activités l'ont
     quittée (chaque appli se règle dans son onglet). */
  .reglages { max-width: 780px; }
  .reglages > .note-regler { margin: 0 0 18px; }
  .reglages .sous { margin: -4px 0 10px; }
  .legende-partage { margin: 0 0 12px; padding: 0; list-style: none; color: var(--muted); font-size: .9rem; line-height: 1.45; }
  .legende-partage li + li { margin-top: 4px; }
  .legende-partage b { color: var(--ink); }
  .ligne-nom { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .ligne-nom input { flex: 1 1 160px; max-width: 260px; }
  .carte.danger-zone { border-left: 5px solid var(--rouge); }
  /* Lot B2 « Ta liste dans Ma classe » (planches B2-1 et B2-2, mots choisis
     par Gwenaël) : la carte « Aujourd'hui, dans Mon espace », en tête. */
  .carte-jour .jour-intro { margin: 0 0 10px; color: var(--muted); font-size: .9rem; line-height: 1.45; }
  .jour-modes > label { display: flex; align-items: flex-start; gap: 9px; margin: 0; padding: 5px 0; font-size: .93rem; font-weight: 400; line-height: 1.4; cursor: pointer; }
  .jour-modes input[type=radio] { flex: none; width: 18px; height: 18px; margin: 1px 0 0; accent-color: var(--blue); }
  .jour-modes b { color: var(--ink); font-weight: 700; }
  .jour-modes span { color: var(--muted); }
  .jour-etapes { display: grid; grid-template-columns: auto minmax(0, 260px); justify-content: start; align-items: center; gap: 8px 16px; margin: 6px 0 2px 18px; }
  .jour-etapes[hidden] { display: none; }
  .jour-etapes label { margin: 0; font-weight: 700; font-size: .9rem; color: var(--ink); }
  .jour-etapes select { width: 100%; }
  .jour-apercu { margin: 12px 0 0; padding: 10px 12px; border-radius: 10px; background: var(--bleu-pale); color: var(--ink); font-size: .9rem; line-height: 1.45; }
  .jour-apercu b { color: var(--blue-dark); }
  /* Lot B3 : sous l'aperçu, les étapes que seuls quelques élèves ont. */
  .jour-apercu .jour-saut { display: block; margin-top: 5px; }
  .carte.danger-zone p { margin: 0 0 12px; color: var(--ink); font-size: .92rem; }
  /* L'onglet « Élèves » (lot « Ma classe : élèves », 18/10/2026) : les
     boutons de la classe, puis la feuille prénom ↔ code à l'écran — mêmes
     numéros, même ordre. Les codes ne sont écrits qu'ici. */
  #vue-eleves > .barre-outils { margin-top: 0; }
  #vue-eleves .tableau-enveloppe { max-width: 720px; }
  #tableau-eleves td.numero { width: 2.6em; padding-right: 10px; color: var(--muted); font-weight: 800; text-align: right; }
  #tableau-eleves td.actions-eleve { width: 1%; text-align: right; }
  #tableau-eleves td input { min-width: 150px; }
  p.sous.note-eleves { margin: 12px 0 0; font-size: .88rem; }
  /* Serveur pro, lot 5b « qui voit quoi » (choix de Gwenaël, planches 2, 3 et
     7 du 25/10/2026) : chaque appli se règle dans son onglet. En haut de
     l'onglet, une ligne : qui voit l'appli, et « Régler … » (propriétaire). */
  .qui-voit { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 0 0 16px;
              padding: 8px 8px 8px 16px; background: var(--paper); border: 1px solid var(--line); border-radius: 12px; }
  .qui-voit .etat { flex: 1 1 240px; min-width: 0; margin: 0; }
  .qui-voit .etat span { color: var(--muted); font-size: var(--texte-secondaire); }
  .qui-voit button { display: inline-flex; align-items: center; gap: 8px; }
  /* Lot 8 : la pastille vaut DANS cette ligne seulement. Écrite « .point »
     tout court, elle peignait aussi le séparateur des 4 semaines et le « ● »
     de « Reprendre la séance en direct ». */
  .qui-voit .point { display: inline-block; width: 10px; height: 10px; margin-right: 8px; border-radius: 50%;
                     background: var(--vert); vertical-align: 1px; }
  .qui-voit .point.quelques { background: var(--teal); }
  /* Un onglet d'appli que personne ne voit : grisé (choix de Gwenaël,
     planche 3) ; dedans, la carte « … est fermé à la 306 ». Lot 8 (retours
     du 31/10/2026) : plus de pastille « 1 » sur l'onglet d'une appli ouverte
     à quelques élèves — qui la voit est dit dans la ligne de l'onglet
     (« ● Ouvert à quelques élèves · Rania »). */
  #choix-appli > button.eteint { color: var(--indice); }
  #choix-appli > button.eteint[aria-pressed="true"] { color: var(--muted); }
  #menu-applis-liste button.eteint { color: var(--muted); }
  .appli-fermee { max-width: 640px; margin: 8px auto 24px; padding: 28px 24px; text-align: center; }
  .appli-fermee h2 { margin: 0 0 6px; }
  .appli-fermee p { margin: 0; color: var(--muted); font-size: var(--texte-secondaire); }
  .appli-fermee .actions { justify-content: center; margin-top: 16px; }
  /* La fenêtre « Régler … » : la case de la classe, les élèves en plus, les
     réglages de l'appli pour la classe. Rien n'est enregistré avant
     « Enregistrer ». */
  dialog.regler { max-width: 600px; }
  .regler h3 { margin: 18px 0 2px; font-size: 16px; color: var(--ink); }
  .regler .aide { margin: 0 0 8px; color: var(--muted); font-size: var(--texte-secondaire); }
  .regler .case-a-cocher { display: flex; align-items: center; gap: 10px; min-height: var(--cible); margin: 0;
                           font-weight: 600; cursor: pointer; }
  .regler .case-a-cocher input { flex: none; width: 20px; height: 20px; margin: 0; accent-color: var(--blue); }
  .regler .case-a-cocher .mots { min-width: 0; }
  .regler .case-a-cocher small { display: block; color: var(--muted); font-size: .82rem; font-weight: 400; }
  .regler .case-classe { font-size: 1.05rem; }
  .regler .grille-cases { display: grid; gap: 0 16px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .regler .grille-cases .case-a-cocher { font-weight: 400; }
  .regler .sans-prenom { color: var(--muted); font-style: italic; }
  .regler .deja { margin: 4px 0 0; color: var(--muted); font-size: var(--texte-secondaire); }
  .regler .cases-ligne { display: flex; flex-wrap: wrap; gap: 0 18px; }
  .regler .cases-ligne .case-a-cocher { font-weight: 400; }
  .regler .titre-liste { margin: 10px 0 0; font-size: .88rem; font-weight: 700; color: var(--ink); }
  /* Défi calcul (lot 1 « la séance ») : la durée et le palier, des choix ronds. */
  .regler .choix-nombre .case-a-cocher { min-width: 52px; }
  .regler .choix-nombre + .aide { margin-top: 2px; }
  /* Lot K2 : les six ceintures, l'une sous l'autre (planche K2-6). */
  .regler .choix-colonne { flex-direction: column; align-items: flex-start; }
  /* Lot K2 : l'explication sous la question d'une boîte (« Recommencer à
     zéro »), en texte normal. */
  .boite-detail { display: block; margin-top: 4px; font-weight: 400; }
  .regler .puces-mondes { margin-top: 6px; }
  /* « Un monde en plus pour quelques élèves » : une ligne par monde (niveau,
     opération) fermé à la classe ; « Choisir… » déplie les élèves dessous. */
  .regler .plus-ligne { border-top: 1px solid var(--filet-doux); }
  .regler .plus-ligne:last-child { border-bottom: 1px solid var(--filet-doux); }
  .regler .plus-ligne > summary { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 4px 0;
                                  list-style: none; cursor: pointer; }
  .regler .plus-ligne > summary::-webkit-details-marker { display: none; }
  .regler .plus-ligne .quoi { flex: none; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; }
  .regler .plus-ligne .qui { flex: 1 1 auto; min-width: 0; color: var(--muted); font-size: var(--texte-secondaire);
                             overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .regler .plus-ligne .qui.quelquun { color: var(--teal-texte); font-weight: 600; }
  .regler .plus-ligne .choisir { flex: none; display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px;
                                 border: 1px solid var(--line); border-radius: var(--arrondi); color: var(--blue);
                                 font-size: var(--texte-secondaire); font-weight: 700; background: var(--paper); }
  .regler .plus-ligne[open] .choisir { background: var(--bleu-pale); }
  .regler .plus-ligne .grille-cases { padding: 0 0 10px 4px; }
  /* Lot « cours-appli-3 » : le nom d'un chapitre peut être long
     (« Agrandissement et Thalès ») — il passe à la ligne, et les prénoms
     gardent toujours un peu de place. Lot K2 : pareil pour les ceintures
     de Défi calcul (« Ceinture jaune-orange · CE2 » au téléphone). */
  .regler .plus-ligne.cours-plus .quoi, .regler .plus-ligne.calcul-plus .quoi { flex: 0 1 auto; min-width: 0; }
  .regler .plus-ligne.cours-plus .qui, .regler .plus-ligne.calcul-plus .qui { flex: 1 1 4.6em; min-width: 4.6em; }
  .regler .rond-monde { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%;
                        color: #fff; font-size: .78rem; font-weight: 800; }
  .regler .fenetre-corps[aria-busy="true"] { opacity: .6; cursor: progress; }
  .regler .fenetre-tete { position: relative; padding-right: 76px; }
  .regler .naviguer { position: absolute; top: 16px; right: 16px; }
  .regler .naviguer button { width: 44px; padding: 0; font-size: 22px; line-height: 1; }
  /* Lot « Qui voit quoi », lot 4b (24/10/2026) : « Le parcours de Rania » pour
     Anzan — l'écran « Mon historique » de l'élève, en lecture seule (planche 3
     du lot 4a) : le jour, le mode et ses réglages, le score sur les calculs
     faits, « arrêtée » dessous quand la séance s'est arrêtée en route. */
  .pa-compte { margin: 0 0 12px; color: var(--ink); font-weight: 700; }
  /* Lot « grades » (07/11/2026) : le plus haut grade réussi, sous le compte. */
  .pa-grade { margin: -6px 0 12px; color: var(--ink); font-weight: 800; }
  .pa-filtres { margin: 0 0 12px; }
  h3.fe-periode { margin: 4px 0 8px; }
  h3.fe-periode ~ h3.fe-periode { margin-top: 18px; }
  .anzan-grade { display: block; margin-top: 2px; font-size: .8rem; font-weight: 700; color: var(--muted); white-space: nowrap; }
  /* Le grade et l'étape en cours (barème révisé, 22/11/2026) : sous le grade
     gagné, en maigre ; la ligne peut se couper après « · » (au téléphone,
     elle n'élargit pas le tableau). */
  .anzan-grade.en-cours { font-weight: 400; white-space: normal; }
  .pa-liste { margin: 0; padding: 0; list-style: none; border: 1px solid var(--line); border-radius: 12px; }
  .pa-liste li { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; align-items: center; gap: 10px;
                 min-height: 54px; padding: 6px 12px; border-bottom: 1px solid #edf3f7; }
  .pa-liste li:last-child { border-bottom: 0; }
  .pa-jour { font-weight: 800; font-size: .88rem; font-variant-numeric: tabular-nums; }
  .pa-mode { font-weight: 800; font-size: .93rem; }
  .pa-reglages { display: block; color: var(--muted); font-weight: 600; font-size: .78rem; line-height: 1.35; }
  .pa-score { text-align: right; font-weight: 900; font-size: 1.08rem; font-variant-numeric: tabular-nums; }
  .pa-score small { display: block; font-size: .7rem; font-weight: 800; color: #8a4c0a; }
  .pa-note { margin: 8px 2px 0; color: var(--muted); font-size: .84rem; }
  .pa-vide { margin: 4px 0 8px; color: var(--muted); }
  .pa-plus { display: block; width: 100%; margin: 10px 0 4px; }
  .pa-plus[hidden] { display: none; }
  /* Les six mondes : le dessin des pastilles de l'espace élève (index.php). */
  .mondes { display: inline-flex; gap: 5px; vertical-align: middle; }
  .mondes svg { display: block; }
  .bonus-compte { margin-left: 8px; color: #8a5a00; font-size: .84rem; font-weight: 800; white-space: nowrap; }
  /* SPLAT! dans la fenêtre de l'élève : une rangée de cases par monde, puis
     les Bonus (l'ancien « Détail » déplié sous la ligne). */
  .detail-monde { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 4px 0; }
  .detail-monde b { flex: 0 0 210px; color: var(--ink); font-size: .84rem; }
  .et { display: inline-grid; place-items: center; min-width: 28px; height: 26px; padding: 0 3px;
        border: 1.5px solid #c9d3e0; border-radius: 7px; background: #fff;
        color: var(--muted); font-size: .72rem; font-weight: 800; }
  .et.ok { border-color: var(--vert); background: var(--vert); color: #fff; }
  .et.aide { border-color: #c2570c; background: #c2570c; color: #fff; }
  .et.cours { border: 2px dashed #0b67b2; background: #eaf2fb; color: #0b67b2; }
  .et.bonus.ok { border-color: #f9bf3b; background: #f9bf3b; color: #4a3600; }
  .legende-detail { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px;
                    margin-top: 10px; color: var(--muted); font-size: .8rem; }
  .legende-detail span { display: inline-flex; align-items: center; gap: 6px; }
  .legende-detail .et { min-width: 18px; width: 18px; height: 18px; padding: 0; border-radius: 5px; }
  /* Lot S4c : les étapes se touchent (leur détail dans une bulle). */
  .detail-monde { position: relative; }
  button.et { min-height: 0; gap: 0; font: inherit; font-size: .72rem; font-weight: 800; cursor: pointer; }
  button.et:hover { border-color: var(--ink); background: #fff; color: var(--muted); }
  button.et.ok:hover { background: var(--vert); color: #fff; }
  button.et.aide:hover { background: #c2570c; color: #fff; }
  button.et.cours:hover { background: #eaf2fb; color: #0b67b2; }
  button.et.bonus.ok:hover { background: #f9bf3b; color: #4a3600; }
  button.et.choisie { box-shadow: 0 0 0 2px var(--ink); }
  /* Lot « splat-suivi-5 » (choix de Gwenaël sur maquettes, 08/10/2026) : sous SPLAT!,
     les mondes ouverts à la classe, monde par monde. Ouvert : bordure et rond de la
     couleur du monde (celle de la carte) ; fermé : pointillés gris. */
  .puces-mondes { display: flex; flex-wrap: wrap; gap: 8px; }
  .puce-monde { position: relative; display: inline-flex; align-items: center; gap: 7px; min-height: 44px; margin: 0;
                padding: 0 12px 0 8px; border: 2px solid var(--c); border-radius: 999px; background: #fff;
                color: var(--ink); font-size: .86rem; font-weight: 700; cursor: pointer; }
  .puce-monde i { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%;
                  background: var(--c); color: #fff; font-style: normal; font-size: .78rem; font-weight: 800; line-height: 1; }
  .puce-monde input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
  .puce-monde.ferme { border-style: dashed; border-color: #b9c1cb; background: #f6f8fa; color: #6b7685; }
  /* Lot 5b : le rond garde ses 22 px (bordure comprise, charte en border-box) —
     à 18 px, le chiffre débordait du rond en pointillés, décentré vers le bas. */
  .puce-monde.ferme i { background: #fff; color: #6b7685; border: 2px dashed #b9c1cb; }
  .puce-monde:focus-within { outline: 3px solid #7fb3e0; outline-offset: 2px; }
  .puces-mondes[aria-busy="true"] .puce-monde { opacity: .6; cursor: progress; }
  .puce-monde[data-monde="1"] { --c: #d9690c; } .puce-monde[data-monde="2"] { --c: #0b67b2; }
  .puce-monde[data-monde="3"] { --c: #be185d; } .puce-monde[data-monde="4"] { --c: #92400e; }
  .puce-monde[data-monde="5"] { --c: #08857f; } .puce-monde[data-monde="6"] { --c: #7b42b4; }
  /* dans le Détail : la rangée d'un monde fermé à la classe, plus pâle, avec un cadenas */
  .detail-monde.ferme { opacity: .5; }
  /* Lot « Coffres magiques sur le suivi » (21/10/2026, maquettes validées par
     Gwenaël) : dans la colonne d'un niveau, « 5 trésors » et dessous « dont 3
     parfaits » seulement au-dessus de zéro ; « — » si rien. Le Détail : la
     partie en cours sur une ligne, puis un tableau par opération (clés
     gagnées, aides ouvertes, solutions montrées, erreurs). */
  .tresors b { display: block; color: var(--ink); }
  /* Lot « le chemin des coffres » (09/11/2026, choix A de Gwenaël) : les trois coffres du niveau
     au-dessus du compte des trésors (onglet Coffres et fiche de l'élève). */
  .coffres-niveau { display: flex; gap: 1px; margin: 0 0 2px; }
  .coffres-niveau svg { display: block; flex: 0 0 auto; }
  .tresors small { display: block; margin-top: 1px; color: var(--muted); font-size: .8rem; }
  .partie-en-cours { margin: 0 0 8px; color: var(--ink); font-size: .9rem; }
  .partie-en-cours b { color: var(--ink); }
  .tableau-operations { width: auto; min-width: min(100%, 560px); margin: 0; }
  .tableau-operations th, .tableau-operations td { padding: 7px 12px; font-size: .88rem; white-space: nowrap; }
  .tableau-operations th { background: #eef2f7; color: var(--ink); font-size: .74rem; letter-spacing: .04em; text-transform: uppercase; }
  .tableau-operations td.nombre { font-variant-numeric: tabular-nums; }
  p.sous.note-coffres { margin: 10px 0 0; font-size: .88rem; }
  /* Le papier (lot 7). Deux impressions distinctes, jamais ensemble : les
     BANDELETTES à distribuer (numéro, prénom, adresse, code, consigne : une
     par élève, d'un seul tenant) et la FEUILLE prénom ↔ code, que le
     professeur garde. À l'écran, ni l'une ni l'autre ne s'affiche. */
  .fiche, .bandelettes, .note-impression { display: none; }
  /* Lot 4b : la feuille « Le parcours de Rania » (Anzan), seulement imprimée. */
  .fiche-anzan { display: none; }
  .fiche h2 { margin-top: 0; }
  .fiche table { font-size: 1rem; }
  .fiche td.code { font-size: 1.15rem; }
  .fiche td.numero { color: var(--muted); font-weight: 800; text-align: right; width: 2.4em; }
  .avertissement-papier { margin: 0 0 6mm; padding: 3mm 4mm; border: 1px solid #999;
                          border-radius: 2mm; font-size: .82rem; color: #333; }
  .bandelettes h2 { margin: 0 0 2mm; }
  .bandelettes-liste { list-style: none; margin: 0; padding: 0; }
  /* Une bandelette = une seule pièce, remise à l'élève : à gauche son numéro
     et son prénom, à droite l'adresse, son code et la consigne (lot « Ma
     classe : tri et bandelette », 21/10/2026). Avant, une souche (numéro et
     prénom) se détachait et restait au professeur ; elle ne protégeait rien
     — qui tape un code voit de toute façon le prénom et la classe — et une
     bandelette sans prénom pouvait s'échanger à la distribution. Le cadre en
     pointillés sépare les bandelettes sur la feuille ; plus de trait au milieu. */
  .bandelette { display: flex; align-items: stretch; margin: 0 0 2mm; line-height: 1.35;
                border: 1px dashed #8a8a8a; border-radius: 2mm;
                break-inside: avoid; page-break-inside: avoid; }
  .bandelette .identite { flex: 0 0 40mm; display: flex; align-items: center; gap: 3mm;
                          padding: 2mm 3mm; }
  .bandelette .identite .numero { font-weight: 800; color: #666; font-size: .85rem; }
  .bandelette .identite .nom { font-weight: 700; }
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
  dialog { border: 0; border-radius: var(--arrondi-carte); padding: 18px; max-width: 420px; width: calc(100% - 32px);
           color: var(--ink); box-shadow: var(--ombre-fenetre); }
  dialog::backdrop { background: rgba(16,41,74,.45); }
  /* Redit ici, même si la charte le dit : sans suivi.css (un dépôt FTP
     oublié), une règle d'affichage de la page ne doit jamais faire réapparaître
     ce qui est caché — la vue Élèves et ses codes, par exemple. */
  [hidden] { display: none !important; }
  /* Lot « 🏆 Les records » (09/10/2026, planche R5 validée par Gwenaël) : le
     temps d'une Légende à côté de sa couronne ; la carte sous le tableau (la
     ligue du professeur, toutes ses classes, ce que voient les élèves) ; le
     plein écran pour projeter ; la case par classe dans « Réglages », sous
     Défi tables (lot « Ma classe : réglages »). */
  td .rec-temps { margin-left: 6px; color: #7a5a00; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .rec-carte { max-width: 820px; margin-top: 18px; border-left: 5px solid #e3a81a; }
  .rec-tete { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
  .rec-tete strong { display: block; color: var(--blue-dark); font-family: Georgia, serif; font-size: 1.05rem; }
  .rec-tete p { margin: 2px 0 0; color: var(--muted); font-size: .88rem; }
  .rec-tete button { margin-left: auto; }
  .rec-deux { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 12px; }
  .rec-deux h3 { margin: 0 0 8px; font-size: .95rem; color: var(--blue); text-align: center; text-transform: uppercase; letter-spacing: .04em; }
  .rec-liste { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
  .rec-liste li { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; gap: 8px; min-height: 36px; padding: 3px 12px 3px 6px; border: 1px solid #d5e2ea; border-radius: 10px; background: #fff; font-weight: 700; }
  .rec-liste .rg { text-align: center; font-weight: 800; color: #3f5a6c; }
  .rec-liste li:nth-child(-n+3) .rg { font-size: 1.2rem; }
  .rec-liste .nom { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* Lot « qui est Mystère » (25/10/2026) : dans la carte seulement, le vrai
     prénom et la classe derrière « Mystère », en gris, toujours sur la ligne
     du dessous (jamais coupés par les points de suite, jamais sur le temps). */
  .rec-liste .nom.avec-qui { white-space: normal; overflow: visible; }
  .rec-qui { display: block; color: var(--muted); font-weight: 600; font-size: .86em; line-height: 1.25; overflow-wrap: anywhere; }
  .rec-liste .tps { font-variant-numeric: tabular-nums; font-weight: 800; white-space: nowrap; }
  /* Lot « après l'audit GPT » (D4, 14/10/2026) : « Retirer ce temps » au bout
     de chaque ligne de la carte (pas du plein écran, qu'on projette). */
  .rec-carte .rec-liste li { grid-template-columns: 30px minmax(0, 1fr) auto auto; }
  .rec-retirer { min-height: 32px; margin: 0 -6px 0 2px; padding: 4px 8px; border: 0; border-radius: 8px; background: none;
                 color: var(--muted); font: inherit; font-size: .8rem; font-weight: 600; cursor: pointer; }
  .rec-retirer:hover, .rec-retirer:focus-visible { background: #fdecec; color: #a4161a; }
  .rec-vide { margin: 8px 0 0; color: var(--muted); font-size: .9rem; text-align: center; }
  .rec-plein { position: fixed; inset: 0; z-index: 50; background: #fff; padding: 28px 48px; overflow: auto; }
  .rec-plein h1 { margin: 0; text-align: center; font-size: 2.6rem; }
  .rec-plein .fermer { position: absolute; top: 18px; right: 24px; }
  .rec-plein .rec-deux { max-width: 1100px; margin: 26px auto 0; gap: 40px; }
  .rec-plein .rec-deux h3 { font-size: 1.4rem; }
  .rec-plein .rec-liste li { min-height: 52px; font-size: 1.45rem; padding: 4px 18px 4px 10px; grid-template-columns: 48px minmax(0, 1fr) auto; }
  .rec-plein .rec-liste li:nth-child(-n+3) .rg { font-size: 1.9rem; }
  /* Lot E1 « les évaluations en classe » (15/10/2026, planches 2 et 3
     validées par Gwenaël) : la carte « 📝 Évaluations » de l'onglet Défi
     tables — la liste des modèles, le compteur pendant, la répartition sans
     nom après ; les deux boîtes (modèle, ouvrir) ; le plein écran. */
  .eval-carte { min-width: 0; }
  .eval-tete { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
  .eval-tete strong { display: block; color: var(--blue-dark); font-family: Georgia, serif; font-size: 1.05rem; }
  .eval-tete p { margin: 2px 0 0; color: var(--muted); font-size: .88rem; }
  .eval-tete .fin { margin-left: auto; display: flex; gap: 8px; }
  .eval-modeles { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 6px; }
  /* Correctif 5c-bis (25/10/2026) : depuis le lot 5c la carte est le tiers
     de la page (≈ 350 px) ; les deux boutons à droite ne laissaient plus que
     13 px au texte (un mot par ligne). Le texte prend la ligne ; les boutons
     passent dessous, à droite, dès qu'ils ne tiennent plus à côté. */
  .eval-modeles li { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px;
                     min-height: 44px; padding: 8px 8px 8px 12px; border: 1px solid var(--line); border-radius: 10px; background: #fbfcfe; }
  .eval-modeles li > .texte { flex: 1 1 240px; min-width: 0; overflow-wrap: anywhere; }
  .eval-modeles .gestes { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-left: auto; }
  /* Correctif des lots 5 (point 6) : « Ouvrir pour la Troisième groupe de
     remédiation » passe à la ligne dans son bouton au lieu d'élargir la page. */
  .eval-modeles .gestes { min-width: 0; max-width: 100%; }
  .eval-modeles .gestes button { max-width: 100%; padding: 0 12px; white-space: normal; text-align: center; }
  .eval-modeles b { display: block; color: var(--ink); }
  .eval-modeles span { display: block; color: var(--muted); font-size: .84rem; }
  .eval-modeles li.vide { display: block; color: var(--muted); font-style: italic; border-style: dashed; padding: 10px 12px; }
  .eval-cours { margin-top: 12px; padding: 12px 14px; border-radius: 12px; background: #eef3f9; }
  .eval-cours .etat { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .eval-cours .etat .pastille { font-size: .84rem; }
  .eval-cours .modele { font-weight: 700; color: var(--blue-dark); }
  .eval-cours .quand { color: var(--muted); font-size: .88rem; }
  .eval-compte { display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap; margin-top: 10px; }
  .eval-compte .gros { font-size: 2rem; font-weight: 800; color: var(--ink); font-variant-numeric: tabular-nums; line-height: 1.1; }
  .eval-compte .gros small { font-size: 1rem; font-weight: 600; color: var(--muted); margin-left: 4px; }
  .eval-repartition { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
  .eval-repartition div { padding: 10px 8px; border-radius: 10px; background: #fff; border: 1px solid var(--line); text-align: center; }
  .eval-repartition .n { display: block; font-size: 1.7rem; font-weight: 800; color: var(--blue-dark); line-height: 1.1; }
  .eval-repartition .l { display: block; margin-top: 2px; font-size: .8rem; color: var(--muted); font-weight: 700; }
  .eval-repartition div:first-child .n { color: var(--vert); }
  .eval-garde { margin: 10px 0 0; color: var(--muted); font-size: .86rem; }
  /* Lot E2 (15/10/2026, planche 7) : pendant, la liste « qui a commencé, qui a
     fini », dépliée, avec « Faire repasser » par élève. */
  .eval-liste { margin-top: 12px; }
  .eval-liste summary { cursor: pointer; color: var(--blue); font-weight: 700; font-size: .93rem; }
  .eval-eleves { list-style: none; margin: 8px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(330px, 100%), 1fr)); gap: 4px 10px; }
  .eval-eleves li { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: 32px; padding: 3px 6px 3px 8px; border-radius: 8px; background: #fff; border: 1px solid var(--line); font-size: .92rem; }
  .eval-eleves li b { font-weight: 700; color: var(--ink); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .eval-eleves li .e { margin-left: auto; font-size: .8rem; font-weight: 700; white-space: nowrap; }
  .eval-eleves li.fini .e { color: var(--vert); }
  .eval-eleves li.en-cours .e { color: #a15c11; }
  .eval-eleves li.close .e { color: var(--muted); }
  .eval-eleves li.rien .e { color: var(--muted); font-weight: 600; }
  .eval-eleves li button { flex: 0 0 auto; min-height: 26px; padding: 2px 8px; font-size: .78rem; white-space: nowrap; }
  .eval-dialog { max-width: 640px; }
  .eval-dialog h2 { margin: 0 0 4px; }
  .eval-dialog .deux { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
  .cases { display: flex; flex-wrap: wrap; gap: 6px; }
  .cases button { min-width: 44px; min-height: 40px; padding: 0 10px; border: 2px solid var(--line); border-radius: 10px;
                  background: #fff; color: var(--ink); font-size: .95rem; font-weight: 700; }
  .cases button:hover { border-color: var(--blue); background: #f3f8fc; }
  .cases button[aria-pressed="true"] { border-color: var(--blue); background: #eaf2fb; color: var(--blue-dark); }
  .radios label { display: flex; align-items: center; gap: 8px; min-height: 40px; margin: 0; font-weight: 600; font-size: .93rem; }
  .radios input[type=radio] { width: 18px; height: 18px; margin: 0; accent-color: var(--blue); }
  .radios input[type=number] { width: 76px; min-height: 36px; padding: 4px 8px; }
  .eval-calculs summary { cursor: pointer; margin: 12px 0 6px; font-weight: 700; font-size: .93rem; color: var(--blue); }
  .eval-calculs p { margin: 0 0 6px; color: var(--muted); font-size: .84rem; }
  .eval-calculs .table { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin: 3px 0; }
  .eval-calculs .table b { flex: 0 0 26px; color: var(--muted); font-size: .8rem; }
  .eval-calculs .table button { min-height: 30px; min-width: 50px; padding: 0 6px; font-size: .82rem; font-weight: 700; color: var(--ink);
                                background: #fff; border: 1.5px solid var(--line); border-radius: 7px; }
  .eval-calculs .table button.exclu { color: #9aa9bb; border-style: dashed; text-decoration: line-through; background: #f6f8fa; }
  .eval-calculs .table button.impose { color: #7a3e00; border-color: var(--orange); background: #fdf0e3; }
  .eval-plein { position: fixed; inset: 0; z-index: 50; background: #fff; padding: 28px 48px; overflow: auto; }
  .eval-plein h1 { margin: 0; text-align: center; font-size: 2.4rem; }
  .eval-plein .fermer { position: absolute; top: 18px; right: 24px; }
  .eval-plein .eval-repartition { max-width: 1000px; margin: 40px auto 0; gap: 24px; }
  .eval-plein .eval-repartition .n { font-size: 4.5rem; }
  .eval-plein .eval-repartition .l { font-size: 1.3rem; }
  .eval-plein p { text-align: center; font-size: 1.6rem; font-weight: 700; color: var(--blue-dark); margin-top: 30px; }
  @media (max-width: 700px) {
    .eval-modeles .gestes { flex: 1 1 100%; }
    .eval-modeles .gestes button { flex: 1 1 auto; }
    .eval-repartition { grid-template-columns: 1fr 1fr; }
    .eval-eleves { grid-template-columns: minmax(0, 1fr); }
    /* Téléphone : le bouton passe sous le prénom, rien ne déborde. */
    .eval-eleves li { flex-wrap: wrap; }
    .eval-eleves li button { margin-left: auto; }
    .eval-dialog .deux { grid-template-columns: 1fr; }
    .eval-plein { padding: 16px; }
  }
  @media (max-width: 700px) { .rec-deux { grid-template-columns: 1fr; } .rec-plein { padding: 16px; } }
  /* Téléphone (choix de Gwenaël, 18/10/2026, gardé le 25/10) : Élèves et
     Réglages n'y gardent que leur dessin, collés au bout de la ligne ; les
     mots reviennent dès la largeur d'une tablette. La tête de la classe : le
     nom et « Séance en direct » sur une ligne. */
  @media (max-width: 600px) {
    .barre-onglets > .onglets-classe { margin-left: 0; }
    .onglets-classe > button { padding: 0 12px; }
    .onglets-classe .mot { display: none; }
    .tete-classe #seance-direct { padding: 0 14px; }
    .menu-classes { width: min(340px, calc(100vw - 32px)); }
    .menu-classes.menu-applis { width: min(300px, calc(100vw - 32px)); }
    /* Serveur pro, lot 5b : la ligne « qui voit » garde le point et le
       mot fort, « Régler … » n'est plus que son rouage. */
    .qui-voit { flex-wrap: nowrap; padding: 6px 6px 6px 14px; }
    .qui-voit .etat { flex: 1 1 auto; }
    .qui-voit .etat span, .qui-voit button .mot { display: none; }
    .qui-voit button { width: var(--cible); padding: 0; justify-content: center; }
    .regler .grille-cases { grid-template-columns: 1fr 1fr; }
  }
  /* Serveur pro, lot 5c (choix de Gwenaël, planche 5 du 25/10/2026) : au
     téléphone, le tableau reste un tableau — compact, une ligne par élève,
     trois colonnes (l'élève, le compte, le dernier jour). Le reste est dans
     la fenêtre de l'élève : on touche la ligne. Avant, une carte par élève
     (≈ 230 px chacune). */
  /* Défi calcul (lot 2b, 31/10/2026, planches validées) : l'onglet, la carte
     « À reprendre en classe », la fenêtre d'un élève (ses compétences palier
     par palier, en étiquettes aux couleurs de l'appli : gris à apprendre, bleu
     en route, vert sue, rouge à revoir, rouge barré « à voir en classe »), et
     les deux feuilles imprimées (la fiche d'un élève, la grille de la classe),
     en noir et blanc : les symboles remplacent les couleurs. */
  /* Lot K2 « le professeur » (28/11/2026, planches K2-3 et K2-4) : « À
     aider » et « À reprendre en classe ». Les cartes d'erreur sont blanches,
     filet gris (lisibles en noir et blanc). */
  .dc-reprendre strong, .dc-aider > strong { display: block; color: var(--blue-dark); font-family: Georgia, serif; font-size: 1.05rem; font-weight: 400; }
  .dc-reprendre p.sous, .dc-aider p.sous { margin: 4px 0 10px; font-size: .88rem; }
  .dc-aider ul { list-style: none; margin: 6px 0 0; padding: 0; }
  .dc-aider li { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 2px 10px; align-items: baseline; padding: 9px 0; border-top: 1px solid var(--line); }
  .dc-aider li:first-child { border-top: 0; }
  /* Les prénoms : en gras, bleu foncé, sans soulignement (ils se touchent
     comme ceux du tableau : la fiche s'ouvre). */
  .dc-aider .lc-lien, .dc-g-nom .lc-lien { justify-self: start; color: var(--blue-dark); text-align: left; text-decoration: none; overflow-wrap: anywhere; }
  .dc-aider .lc-lien:hover, .dc-g-nom .lc-lien:hover { text-decoration: underline; }
  .dc-raison { font-size: .92rem; color: var(--ink); }
  .dc-raison small { display: block; color: var(--muted); font-size: .84rem; }
  .dc-pied { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 10px; }
  .dc-pied .sous { margin: 0; font-size: .86rem; }
  .dc-copier { min-height: 36px; min-width: 8.5em; padding: 0 12px; font-size: .9rem; }
  .dc-pop-pied { margin-top: 10px !important; }
  .dc-sous-titre { margin: 14px 0 0; font-size: .84rem; font-weight: 700; color: var(--muted); }
  .dc-sous-titre:first-child { margin-top: 0; }
  .dc-cartes-erreurs { list-style: none; margin: 0; padding: 0; }
  .dc-cartes-erreurs li { margin-top: 8px; padding: 10px 12px; background: var(--paper); border: 1px solid var(--line); border-radius: 10px; }
  .dc-tete-erreur { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .dc-tete-erreur b { color: var(--ink); }
  .dc-tete-erreur small { display: block; color: var(--muted); font-size: .84rem; }
  .dc-tete-erreur .bouton-nombre { font-weight: 700; white-space: nowrap; color: var(--ink); }
  .dc-exemple, .dc-dit { display: block; margin-top: 3px; font-size: .9rem; color: var(--ink); }
  .dc-dit i { font-style: normal; color: var(--muted); }
  .dc-cartes-erreurs a { display: inline-block; margin-top: 4px; font-size: .88rem; font-weight: 700; }
  .dc-note-bas { margin: 8px 0 0 !important; }
  /* Les cartes du haut de l'onglet Défi calcul (planche K2-3) : « À aider »
     à gauche, « Notre classe, ensemble » dessous, « À reprendre en
     classe » à droite — selon celles qui sont montrées (« À aider » et « À
     reprendre » n'existent que dans cet onglet). La 2e rangée prend la
     hauteur qui reste : « Notre classe » colle à « À aider ». Au
     téléphone, l'une sous l'autre, dans cet ordre. */
  @media (min-width: 601px) {
    .cartes-haut:has(> #dc-aider:not([hidden])):has(> #objectif:not([hidden])):has(> #dc-reprendre:not([hidden])) {
      grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: auto 1fr; align-items: start;
      grid-template-areas: "aider reprendre" "objectif reprendre"; }
    .cartes-haut:has(> #dc-aider:not([hidden])):not(:has(> #objectif:not([hidden]))):has(> #dc-reprendre:not([hidden])) {
      grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; grid-template-areas: "aider reprendre"; }
    .cartes-haut:not(:has(> #dc-aider:not([hidden]))):has(> #objectif:not([hidden])):has(> #dc-reprendre:not([hidden])) {
      grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; grid-template-areas: "objectif reprendre"; }
    .cartes-haut:has(> #dc-aider:not([hidden])):has(> #objectif:not([hidden])):not(:has(> #dc-reprendre:not([hidden]))) {
      grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; grid-template-areas: "aider objectif"; }
    .cartes-haut:has(> #dc-aider:not([hidden])):not(:has(> #objectif:not([hidden]))):not(:has(> #dc-reprendre:not([hidden]))) {
      grid-template-columns: minmax(0, 1fr); grid-template-areas: "aider"; }
    .cartes-haut:not(:has(> #dc-aider:not([hidden]))):not(:has(> #objectif:not([hidden]))):has(> #dc-reprendre:not([hidden])) {
      grid-template-columns: minmax(0, 1fr); grid-template-areas: "reprendre"; }
    .cartes-haut:has(> #dc-aider:not([hidden])) > #dc-aider { grid-area: aider; }
    .cartes-haut:has(> #dc-aider:not([hidden])) > #objectif, .cartes-haut:has(> #dc-reprendre:not([hidden])) > #objectif { grid-area: objectif; }
    .cartes-haut:has(> #dc-reprendre:not([hidden])) > #dc-reprendre { grid-area: reprendre; }
  }
  .dc-paliers { display: block; margin-top: 2px; color: var(--muted); font-size: .8rem; white-space: nowrap; }
  /* Lot 4 « les ceintures » : le dessin et le nom en un mot. */
  .dc-ceinture { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; white-space: nowrap; }
  .dc-ceinture-dessin { display: flex; }
  .dc-ceinture-dessin .ceinture { display: block; }
  td.dc-revoir .pastille + .pastille { margin-left: 4px; }
  .p-rouge { background: var(--rouge-pale); color: var(--rouge); }
  /* La fenêtre de l'élève. */
  .dc-bloc { margin: 0 0 14px; }
  .dc-bloc h3 { margin: 0 0 6px; font-size: .95rem; color: var(--blue-dark); }
  .dc-bloc h3 small { font-weight: 400; color: var(--muted); font-size: .84rem; }
  .dc-alerte { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
  .dc-alerte li { padding: 8px 12px; border: 1px solid var(--rouge-bord); border-radius: 10px; background: var(--rouge-pale); }
  .dc-alerte li b { color: var(--ink); }
  .dc-alerte li .dc-detail { display: block; color: var(--muted); font-size: .84rem; }
  .dc-alerte li .dc-detail i { font-style: normal; color: var(--rouge); font-weight: 700; }
  .dc-alerte li.dc-revoir { border-color: var(--orange-pale); background: var(--orange-pale); }
  .dc-alerte li.dc-revoir .dc-detail i { color: var(--orange-texte); }
  .dc-alerte li a { font-size: .86rem; font-weight: 700; white-space: nowrap; }
  .dc-module { display: grid; grid-template-columns: 200px 1fr; gap: 6px 10px; align-items: center; margin: 6px 0; }
  .dc-module b { color: var(--ink); font-size: .84rem; font-weight: 600; line-height: 1.25; }
  .dc-comps { display: flex; flex-wrap: wrap; gap: 6px; }
  .dc-comp { display: inline-grid; place-items: center; min-height: 26px; padding: 0 9px; border-radius: 8px; font-size: .8rem; font-weight: 700;
             border: 2px solid var(--line); background: #fff; color: var(--muted); }
  .dc-comp.route { border-color: var(--bleu-vif); background: #eaf2fb; color: var(--bleu-vif); }
  .dc-comp.su { border-color: var(--vert); background: var(--vert); color: #fff; }
  .dc-comp.revoir { border-color: var(--rouge); background: var(--rouge-pale); color: var(--rouge); }
  .dc-comp.classe { border-color: var(--rouge); background: var(--rouge); color: #fff; }
  .dc-legende { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 8px 0 14px; font-size: .82rem; color: var(--muted); }
  .dc-note { margin: -6px 0 14px; color: var(--muted); font-size: .84rem; }
  .dc-legende span { display: inline-flex; align-items: center; gap: 6px; }
  .dc-legende .dc-comp { min-height: 18px; padding: 0 6px; font-size: .7rem; }
  .dc-causes { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: .9rem; }
  .dc-causes li small { color: var(--muted); }
  .dc-semaine { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: .9rem; }
  .dc-semaine .dc-jours { display: inline-flex; gap: 8px; }
  .dc-semaine .dc-jours span { display: inline-flex; align-items: center; gap: 3px; color: var(--muted); font-size: .82rem; }
  .dc-semaine .dc-jours i { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--vert); }
  .dc-semaine .dc-jours i.ok { background: var(--vert); }
  .dc-outils { display: flex; justify-content: flex-end; margin: 0 0 8px; }
  /* Les deux feuilles, seulement imprimées. */
  .fiche-defi-calcul, .grille-defi-calcul { display: none; }
  @media (max-width: 700px) {
    #tableau th.large, #tableau td.large { display: none; }
    #tableau th.seul-telephone, #tableau td.seul-telephone { display: table-cell; }
    #tableau th, #tableau td { padding: 10px 4px; }
    #tableau th { white-space: normal; line-height: 1.25; }
    #tableau th:first-child, #tableau td:first-child { padding-left: 10px; }
    #tableau .bonus-compte { display: none; }
    /* Lot 5f : le « ⋯ » reste au téléphone, la flèche part ; les titres
       des colonnes passent sur deux lignes, pour que le « ⋯ » tienne
       (mesuré : 356 px pour 356 à 390 de large, dans les quatre applis).
       Lot 8 : la colonne de la flèche part avec elle, le « ⋯ » garde la
       sienne (même largeur qu'avant : 50 px). */
    #tableau td.geste { padding-left: 0; padding-right: 6px; }
    #tableau th.fin, #tableau td.va { display: none; }
    #tableau td.va .fleche { display: none; }
    #tableau th button[data-tri] { white-space: normal; text-align: left; }
    #tableau td.nom { max-width: 44vw; overflow: hidden; text-overflow: ellipsis; }
    .acquises-liste { display: none; }
    /* Défi calcul : le détail par palier et la ligne du haut se lisent dans la fenêtre. */
    .dc-paliers { display: none; }
    /* « Parfait : … » explique les niveaux de Coffres : cachés ici, ils sont
       (avec la même phrase) dans la fenêtre. */
    p.sous.note-coffres { display: none; }
    .outils-tableau .chercher { flex: 1 1 100%; }
    #tableau .indice-tel { display: block; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; color: var(--muted); font-size: .8rem; font-weight: 600; line-height: 1.25; }
    #tableau .indice-tel.fort { color: var(--rouge); }
    /* La liste de l'onglet Élèves reste un tableau : quatre colonnes courtes. */
    #tableau-eleves th, #tableau-eleves td { padding: 6px 4px; }
    #tableau-eleves td input { width: 100%; min-width: 0; min-height: 44px; }
    #tableau-eleves td.numero { width: 2em; padding-right: 6px; }
    .alerte { margin-left: 0; }
    /* Dans la fenêtre : deux chiffres par ligne, le nom du monde au-dessus
       de ses cases, le tableau par opération de Coffres resserré. */
    .fiche-chiffres { grid-template-columns: 1fr 1fr; }
    /* Lot 5f : le parcours d'un élève prend tout l'écran du téléphone. */
    .detail-monde b { flex-basis: 100%; }
    .dc-module { grid-template-columns: 1fr; gap: 4px; }
    .fenetre-eleve .tableau-operations { width: 100%; min-width: 0; }
    .fenetre-eleve .tableau-operations th, .fenetre-eleve .tableau-operations td { padding: 5px 3px; font-size: .76rem; white-space: normal; }
    .fenetre-eleve .tableau-operations th { font-size: .68rem; line-height: 1.2; letter-spacing: 0; text-transform: none; }
  }
  /* ------------------------------------------------------------------
     Lot S2 « Suivre ses élèves » (07/11/2026) : La classe, la fiche, et les
     deux cartes de Défi calcul. Couleurs de la charte, et celles des applis
     (COULEURS_APPLIS) pour leurs points et leurs barres.
     ------------------------------------------------------------------ */
  .barre-onglets > .onglets-vue { flex: none; overflow: visible; margin: 0 4px 0 0; border-bottom: 0; }
  .onglets-vue > button { display: inline-flex; align-items: center; gap: 8px; }
  .onglets-vue > button svg { display: block; flex: none; }
  .lc-cartes { margin-bottom: 16px; }
  .lc-carte strong, .dc-tete strong { display: block; color: var(--blue-dark); font-family: Georgia, serif; font-size: 1.05rem; font-weight: 400; }
  .lc-carte p.sous { margin: 2px 0 8px; font-size: .88rem; }
  .lc-liste, .fe-avoir { list-style: none; margin: 0; padding: 0; }
  .lc-liste li + li { border-top: 1px solid var(--filet-doux); }
  .lc-liste li.lc-vide { padding: 8px 0; color: var(--muted); }
  .lc-ligne { display: grid; grid-template-columns: minmax(84px, max-content) auto 1fr; align-items: baseline; gap: 2px 10px;
              width: 100%; min-height: var(--cible); padding: 7px 4px; color: var(--ink); background: none; border: 0;
              border-radius: 8px; font-weight: 400; text-align: left; white-space: normal; }
  .lc-ligne:hover { color: var(--ink); background: var(--survol); border: 0; }
  .lc-ligne .lc-nom { color: var(--blue-dark); }
  .lc-ligne .pastille { justify-self: start; font-size: .78rem; padding: 0 8px; }
  .lc-texte { min-width: 0; }
  .lc-texte b { font-weight: 700; }
  .lc-faire { grid-column: 3; display: block; color: var(--muted); font-size: .84rem; line-height: 1.35; }
  .lc-faire a { font-weight: 700; white-space: nowrap; }
  .lc-puce { display: inline-block; width: 9px; height: 9px; margin: 0 6px 1px 0; border-radius: 50%; vertical-align: middle; }
  .lc-plus { margin: 6px 4px 0; color: var(--muted); font-size: .88rem; }
  .lc-lien { min-height: 0; padding: 0; color: var(--blue); background: none; border: 0; font: inherit; font-weight: 700; text-decoration: underline; }
  .lc-lien:hover { color: var(--blue-dark); background: none; border: 0; }
  #lc-tableau td, #lc-tableau th { padding: 9px 10px; white-space: nowrap; }
  #lc-tableau th { white-space: normal; line-height: 1.25; vertical-align: bottom; }
  #lc-tableau th button { min-height: 0; padding: 0; color: inherit; background: none; border: 0; font: inherit; }
  #lc-tableau th[aria-sort="ascending"] button::after { content: " ▲"; font-size: .7em; }
  #lc-tableau th[aria-sort="descending"] button::after { content: " ▼"; font-size: .7em; }
  #lc-tableau td.sans { color: var(--muted); }
  #lc-tableau td.nom .lien-eleve { display: block; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #lc-tableau td.va .fleche { display: inline-block; width: 20px; color: var(--blue); font-size: var(--titre-carte); text-align: right; }
  .lc-semaine { display: inline-flex; gap: 2px; vertical-align: middle; }
  .lc-jour { display: inline-grid; place-items: center; width: 21px; height: 21px; border-radius: 6px;
             font-size: 13px; font-style: normal; font-weight: 800; line-height: 1; color: #fff; box-sizing: border-box; }
  .lc-jour.ok { background: var(--vert); }
  .lc-jour.rien { background: var(--gris-pale); }
  .lc-jour.futur { border: 1.5px dashed var(--line); }
  .lc-jour.inconnu { color: var(--muted); font-size: 11px; background: repeating-linear-gradient(-45deg, var(--gris-pale) 0 4px, var(--paper) 4px 7px); }
  /* Lot « code en cases » (planche validée par Gwenaël le 09/11/2026) : le
     cadre bleu d'aujourd'hui est DANS la case — l'anneau extérieur d'avant
     (3,5 px) mordait sur la case suivante, les cases n'ayant que 1 à 2 px
     d'écart. Sur ordinateur (1000 px et plus : à 820 px, la tablette, le
     tableau défile déjà de côté, il ne s'élargit pas), des cases plus grandes
     et plus espacées ; au
     téléphone, l'écart de 1 px reste (avec 3 px, la 7e case sortait de la
     colonne à 390 px). La petite case de la légende suit la même règle. */
  .lc-jour.aujourdhui { box-shadow: inset 0 0 0 2px var(--blue); }
  .lc-jour.ok.aujourdhui { box-shadow: inset 0 0 0 2px var(--blue-dark), inset 0 0 0 3.5px #fff; }
  @media (min-width: 1000px) {
    .lc-jour { width: 24px; height: 24px; font-size: 14px; }
    .lc-semaine { gap: 5px; }
  }
  /* Lot « la semaine précédente » (14/11/2026) : ‹ titre › au-dessus des 7
     jours. Les flèches gardent leur place (grisées au bout) et le titre sa
     largeur : changer de semaine ne déplace rien. Sur ordinateur, une ligne
     (« Semaine du 28 sept. », le plus long, tient entre les flèches au-dessus
     des 7 cases) ; en dessous de 1000 px, toujours deux lignes (« Cette /
     semaine », « Semaine du / 9 nov. ») : l'en-tête a la même hauteur dans
     les deux cas. */
  .lc-nav-semaine { display: flex; align-items: center; gap: 2px; }
  .lc-titre-semaine { flex: 1; min-width: 0; text-align: center; white-space: nowrap; }
  #lc-tableau th .lc-fleche-semaine { flex: none; display: inline-grid; place-items: center; width: 24px; height: 24px; padding: 0;
                                     color: var(--blue); background: var(--paper); border: 1px solid var(--line); border-radius: 7px; cursor: pointer; }
  #lc-tableau th .lc-fleche-semaine:hover:not(:disabled) { color: var(--blue-dark); background: var(--survol); }
  /* Grisée au bout : toujours là, à la même place, mais visiblement éteinte. */
  #lc-tableau th .lc-fleche-semaine:disabled { color: var(--muted); background: var(--gris-pale); border-color: var(--gris-pale); opacity: .55; cursor: default; }
  @media (min-width: 1000px) {
    /* Une seule ligne : le titre sur la ligne des autres titres, les flèches
       débordent dans la marge de la case (l'en-tête ne grandit pas). */
    .lc-nav-semaine { margin: -3px 0; }
  }
  @media (max-width: 999px) {
    .lc-titre-semaine > span { display: block; }
    #lc-tableau th .lc-fleche-semaine { width: 26px; height: 34px; }
  }
  .lc-note .lc-jour { width: 16px; height: 16px; font-size: 10px; vertical-align: -3px; margin: 0 2px; }
  .lc-note { margin-top: 10px; }
  .lc-unite { color: var(--muted); font-weight: 400; font-size: .86rem; }
  .lc-barre { display: inline-flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; }
  .lc-barre.sans { color: var(--muted); }
  .lc-jauge { display: inline-block; width: 36px; height: 6px; border-radius: 999px; background: var(--filet-doux); overflow: hidden; }
  .lc-jauge i { display: block; height: 100%; border-radius: 999px; }
  .lc-compte { color: var(--ink); font-size: .92rem; }
  /* La fiche : la même taille pour tous ses onglets (rien ne bouge quand on
     passe de l'un à l'autre) ; au téléphone, tout l'écran. */
  dialog.fenetre-eleve { max-width: 1080px; height: calc(100vh - 32px); }
  dialog.fenetre-eleve.avec-parcours { max-width: 1080px; }
  .fenetre-eleve.sans-pied .fenetre-pied { display: none; }
  .fenetre-eleve .fenetre-tete { padding-bottom: 0; border-bottom: 1px solid var(--filet-doux); }
  .fe-onglets { margin: 10px 0 0; border-bottom: 0; }
  .fe-onglets > button { padding: 0 14px; }
  .fe-ensemble { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px 36px; padding-top: 6px; }
  .fe-col > h3 { margin: 18px 0 8px; }
  .fe-col > h3:first-child { margin-top: 6px; }
  .fe-calendrier { display: grid; grid-template-columns: 40px repeat(7, minmax(0, 1fr)); gap: 5px; align-items: center; }
  .fe-jour-nom { color: var(--muted); font-size: .78rem; text-align: center; }
  .fe-semaine-nom { color: var(--muted); font-size: .78rem; }
  .fe-case { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 2px; height: 30px;
             border: 1px solid var(--filet-doux); border-radius: 7px; background: var(--paper); }
  .fe-case:not(.fait):not(.futur) { background: var(--gris-pale); border-color: var(--gris-pale); }
  .fe-case.futur { border-style: dashed; }
  /* Un jour pas connu (avant la coupure de l'historique) : « ? », rayé. */
  .fe-case.inconnu { color: var(--muted); font-size: .8rem; font-weight: 700;
                     background: repeating-linear-gradient(-45deg, var(--gris-pale) 0 4px, var(--paper) 4px 7px); }
  .fe-case.aujourdhui { box-shadow: 0 0 0 2px var(--blue); }
  .fe-case .lc-puce { width: 8px; height: 8px; margin: 0; }
  /* Lot S4b : un jour de travail se touche — il est mis en avant dans
     « Activité » (la liste reste, rien ne bouge). */
  button.fe-case { min-height: 0; width: auto; padding: 0; color: inherit; font: inherit; cursor: pointer; }
  button.fe-case:hover { background: var(--paper); border-color: var(--blue); }
  button.fe-case[aria-pressed="true"] { border-color: var(--blue-dark); box-shadow: 0 0 0 2px var(--blue-dark); background: #e8f1fa; }
  .fe-col.colle { position: sticky; top: 0; align-self: start; }
  .fe-jour-bloc.choisi { background: #e8f1fa; box-shadow: 0 0 0 6px #e8f1fa; border-radius: 2px; }
  .fe-jour-bloc.choisi .fe-jour-titre { color: var(--blue-dark); }
  .fe-resume { margin: 8px 0 4px; }
  .fe-legende { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 0; color: var(--muted); font-size: .84rem; }
  .fe-avoir li { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; align-items: baseline; padding: 6px 0; }
  .fe-avoir li + li { border-top: 1px solid var(--filet-doux); }
  .fe-avoir .pastille { font-size: .78rem; padding: 0 8px; }
  .fe-avoir .lc-faire { grid-column: 2; }
  .fe-ou { list-style: none; margin: 0; padding: 0; }
  .fe-ou li { display: grid; grid-template-columns: 30px minmax(110px, auto) 1fr auto; align-items: center; gap: 10px; padding: 5px 0; }
  .fe-icone svg { display: block; width: 28px; height: 28px; }
  .fe-ou .lien-onglet { margin: 0; font-size: .88rem; font-weight: 700; text-decoration: none; color: var(--blue); }
  .fe-jour-bloc { padding: 8px 0; border-top: 1px solid var(--filet-doux); }
  .fe-jour-titre { margin: 0 0 4px; font-weight: 700; }
  .fe-lignes { list-style: none; margin: 0; padding: 0; }
  .fe-lignes li { display: flex; align-items: baseline; justify-content: space-between; gap: 4px 12px; padding: 2px 0; font-size: .94rem; }
  .fe-chiffres { flex: none; color: var(--muted); font-size: .86rem; white-space: nowrap; }
  .fe-chiffres.faible, .dc-seances td.faible { color: var(--orange-texte); font-weight: 700; }
  .fe-plus { margin-top: 10px; }
  .fe-note { margin: 10px 0 0; color: var(--muted); font-size: .84rem; }
  .fe-ensemble > .fe-panne { grid-column: 1 / -1; margin: 0 0 4px; color: var(--rouge); font-weight: 600; }
  /* Défi calcul, dans la fiche : ses séances, ses compétences en cases. */
  .dc-seances { margin: 0; font-size: .9rem; }
  .dc-seances th, .dc-seances td { padding: 6px 10px; white-space: nowrap; }
  .dc-seances td:last-child { white-space: normal; }
  .dc-palier { margin: 12px 0 6px; font-size: .9rem; color: var(--ink); }
  .dc-palier small { font-weight: 400; color: var(--muted); }
  .dc-cases-grille { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 28px; }
  .dc-cases-ligne { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 26px; }
  .dc-cases-nom { min-width: 0; font-size: .84rem; line-height: 1.25; }
  .dc-cases { display: inline-flex; gap: 3px; flex: none; }
  .dc-case { display: inline-block; width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid var(--line); background: var(--paper); box-sizing: border-box; }
  .dc-case.su { background: var(--vert); border-color: var(--vert); }
  .dc-case.route { background: var(--bleu-vif); border-color: var(--bleu-vif); }
  .dc-case.revoir { background: var(--rouge-pale); border-color: var(--rouge); }
  .dc-case.classe { background: var(--rouge); border-color: var(--rouge); }
  .dc-legende .dc-case { width: 12px; height: 12px; }
  /* Lot S4b : une case se touche (ou se survole) — le nom de la
     compétence, dans une bulle au-dessus de la ligne (rien ne bouge). */
  .dc-cases-ligne { position: relative; }
  button.dc-case { min-height: 0; padding: 0; gap: 0; font: inherit; cursor: pointer; }
  button.dc-case:hover { border-color: var(--ink); }
  button.dc-case.gris:hover { background: var(--paper); }
  button.dc-case.choisie { box-shadow: 0 0 0 2px var(--ink); }
  .dc-bulle { position: absolute; right: 0; bottom: calc(100% - 2px); z-index: 3; max-width: min(320px, 100%);
              padding: 5px 9px; border-radius: 6px; background: var(--ink); color: #fff; font-size: .84rem; line-height: 1.3;
              pointer-events: none; }
  /* Défi calcul, dans l'onglet de la classe. */
  .dc-ouest, .dc-qui { position: relative; margin-top: 16px; }
  .dc-tete { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 4px 16px; }
  summary.dc-tete { min-height: var(--cible); align-items: center; cursor: pointer; list-style: none; }
  summary.dc-tete::-webkit-details-marker { display: none; }
  summary.dc-tete strong::after { content: " ▾"; color: var(--muted); font-family: var(--sans); font-size: .8em; }
  details[open] > summary.dc-tete strong::after { content: " ▴"; }
  details.dc-ouest:not([open]) { padding-bottom: 10px; }
  .dc-tete .sous { margin: 0; font-size: .86rem; }
  .dc-paliers-choix { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 10px; }
  .dc-paliers-choix button { min-height: 36px; padding: 0 14px; color: var(--blue-dark); background: var(--paper);
                             border: 1px solid var(--line); border-radius: 999px; font-size: .9rem; }
  .dc-paliers-choix button[aria-pressed="true"] { color: #fff; background: var(--blue); border-color: var(--blue); }
  /* Lot K2 : au téléphone, les onglets d'étage passent à la ligne
     (flex-wrap) — ils ne se chevauchent jamais (planche K2-4). */
  /* Lot K2 : « Où en est chacun », la grille. Une case par étoile, sept
     états lisibles en noir et blanc : plein foncé (a réussi un retour),
     plein clair (gagnée), plein clair et tirets (ratée au dernier retour),
     tirets (perdue), contour (essayée), contour et « ? » (à voir en
     classe), gris pâle (pas encore). Les prénoms restent à gauche quand la
     grille défile de côté. */
  .dc-grille { overflow-x: auto; margin-top: 6px; }
  .dc-grille table { border-collapse: separate; border-spacing: 0; }
  .dc-grille th, .dc-grille td { padding: 0; }
  .dc-g-nom { position: sticky; left: 0; z-index: 1; background: var(--paper); text-align: left; padding-right: 10px !important; white-space: nowrap; height: 24px; }
  .dc-g-nom .lc-lien { font-weight: 700; font-size: .9rem; }
  .dc-g-total { font-weight: 700; color: var(--ink); font-size: .9rem; }
  .dc-g-compte { padding-right: 12px !important; color: var(--muted); font-size: .82rem; white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
  .dc-g-bande { max-width: 0; padding: 0 0 3px 1px !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                text-align: left; font-size: .74rem; font-weight: 700; color: var(--ink); border-bottom: 4px solid var(--c); }
  .dc-g-sep { width: 9px; min-width: 9px; }
  .dc-g-bas td { border-top: 1px solid var(--line); }
  .dc-g-n { height: 22px; text-align: center; font-size: .72rem; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
  .dc-g-case { display: block; width: 18px; height: 18px; margin: 3px 2px; padding: 0; min-height: 0; box-sizing: border-box;
               border: 0; border-radius: 4px; font: 700 12px/14px var(--sans); text-align: center; color: var(--ink); cursor: pointer; }
  i.dc-g-case { display: inline-block; margin: 0; cursor: default; font-style: normal; }
  /* Dans la fenêtre de l'élève (ses étoiles), les cases sont plus petites. */
  .dc-cases .dc-g-case, .dc-legende .dc-g-case { width: 14px; height: 14px; margin: 0; font-size: 10px; line-height: 10px; }
  .dc-cases .dc-g-case.rate, .dc-cases .dc-g-case.perdue, .dc-cases .dc-g-case.essai, .dc-cases .dc-g-case.classe,
  .dc-legende .dc-g-case.rate, .dc-legende .dc-g-case.perdue, .dc-legende .dc-g-case.essai, .dc-legende .dc-g-case.classe { border-width: 1.5px; }
  .dc-g-case.tenu { background: var(--blue-dark); }
  .dc-g-case.gagnee { background: #9cbde3; }
  .dc-g-case.rate { background: #9cbde3; border: 2px dashed var(--ink); }
  .dc-g-case.perdue { background: var(--paper); border: 2px dashed var(--ink); }
  .dc-g-case.essai, .dc-g-case.classe { background: var(--paper); border: 2px solid var(--ink); }
  .dc-g-case.vide { background: var(--gris-pale); }
  button.dc-g-case:hover, button.dc-g-case[aria-expanded="true"] { box-shadow: 0 0 0 2px var(--bleu-vif); }
  .dc-grille-legende { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 12px 0 0; font-size: .84rem; color: var(--muted); }
  .dc-grille-legende span { display: inline-flex; align-items: center; gap: 6px; }
  .dc-alerte-ligne { margin: 10px 0 0; font-size: .92rem; color: var(--ink); font-weight: 600; }
  .dc-dit-fiche { display: block; color: var(--muted); }
  /* Lot S4b « des chiffres aux élèves » (08/11/2026) : « 5 élèves » se
     touche et montre les prénoms PAR-DESSUS la page (comme les barres de
     Défi calcul) ; un prénom ouvre la fiche. */
  .bouton-nombre { min-height: 0; padding: 0; gap: 0; color: inherit; background: none; border: 0; font: inherit;
                   font-weight: inherit; text-decoration: underline dotted; text-underline-offset: 3px; cursor: pointer; }
  .bouton-nombre:hover, .bouton-nombre[aria-expanded="true"] { color: var(--blue-dark); background: none; border: 0; text-decoration-style: solid; }
  .pop-eleves { position: absolute; z-index: 30; width: min(420px, calc(100vw - 16px)); padding: 12px 14px;
                background: var(--paper); border: 1px solid var(--line); border-radius: var(--arrondi-carte);
                box-shadow: var(--ombre-fenetre); font-size: .9rem; text-align: left; }
  .pop-eleves strong { display: block; margin-bottom: 6px; color: var(--blue-dark); }
  .pop-eleves p { margin: 4px 0 0; line-height: 1.6; }
  .pop-eleves ul { list-style: none; max-height: min(60vh, 460px); margin: 0; padding: 0; overflow: auto; }
  .pop-eleves li { display: grid; grid-template-columns: minmax(80px, auto) 1fr; gap: 2px 12px; align-items: baseline; padding: 6px 0; }
  .pop-eleves li + li { border-top: 1px solid var(--filet-doux); }
  .pop-eleves li .pastille { font-size: .76rem; padding: 0 7px; margin-right: 6px; }
  .pop-eleves .lc-lien { font-weight: 700; }
  .dc-qui-barres { display: grid; grid-template-columns: repeat(28, minmax(0, 1fr)); gap: 3px; align-items: end; margin: 14px 0 8px; }
  .dc-qui-jour { display: flex; flex-direction: column; align-items: stretch; gap: 3px; text-align: center; }
  .dc-qui-jour.lundi { margin-left: 8px; }
  .dc-qui-jour:first-child { margin-left: 0; }
  .dc-qui-jour small { min-height: 1.2em; color: var(--muted); font-size: .7rem; line-height: 1.2; }
  .dc-qui-tige { display: flex; align-items: flex-end; height: 64px; }
  .dc-qui-tige i { display: block; width: 100%; border-radius: 3px 3px 0 0; background: #9fb4c4; }
  .dc-qui-jour.semaine .dc-qui-tige i { background: var(--blue); }
  .dc-qui-lettre { color: var(--muted); font-size: .7rem; }
  .dc-qui-texte { margin: 4px 0 0; font-size: .92rem; }
  .qui-voit a.bouton { display: inline-flex; align-items: center; gap: 8px; }
  @media (max-width: 700px) {
    .barre-onglets > .onglets-vue .mot { display: none; }
    .onglets-vue > button { padding: 0 12px; }
    .qui-voit a.bouton { width: var(--cible); padding: 0; justify-content: center; }
    .qui-voit a.bouton .mot { display: none; }
    .lc-ligne { grid-template-columns: auto 1fr; }
    .lc-ligne .lc-texte, .lc-ligne .lc-faire { grid-column: 1 / -1; }
    #lc-tableau th.large, #lc-tableau td.large { display: none; }
    /* Correctif après Codex (point 9) : le prénom et les 7 jours tiennent
       dans la largeur, jusqu'à 320 px — le prénom prend ce qui reste, coupé
       « … » ; les cases et les marges rétrécissent. */
    #lc-tableau { width: 100%; table-layout: fixed; }
    #lc-tableau td, #lc-tableau th { padding: 8px 4px; }
    #lc-tableau th:first-child, #lc-tableau td:first-child { padding-left: 8px; }
    #lc-tableau th:nth-child(2) { width: 148px; }
    #lc-tableau td.nom { overflow: hidden; }
    #lc-tableau td.nom .lien-eleve { max-width: 100%; }
    #lc-tableau th.fin, #lc-tableau td.va { display: none; }
    .lc-semaine { gap: 1px; }
    .lc-jour { width: 19px; height: 19px; }
    dialog.fenetre-eleve, dialog.fenetre-eleve.avec-parcours { width: 100%; max-width: none; height: 100vh; height: 100dvh; max-height: none;
                                                               margin: 0; border-radius: 0; }
    .fenetre-eleve .fenetre-tete { padding: 14px 14px 0; }
    /* Correctif après Codex (point 8) : la place de ‹ › ✕ reste réservée à
       droite du prénom et de la classe (le prénom passe à la ligne, jamais
       dessous) ; les onglets de la fiche gardent toute la largeur. */
    .fenetre-eleve .naviguer { top: 12px; right: 12px; }
    .fenetre-eleve #fe-titre, .fenetre-eleve #fe-sous { padding-right: 146px; }
    /* Pas pour Défi tables : son écran Mon parcours garde toute la largeur. */
    .fenetre-eleve:not(.avec-parcours) .fenetre-corps { padding: 8px 14px 16px; }
    .fe-ensemble { grid-template-columns: 1fr; }
    .fe-ou li { grid-template-columns: 30px 1fr auto; }
    .fe-ou li .lc-barre { grid-column: 2; grid-row: 2; }
    .fe-ou li .lien-onglet { grid-column: 3; grid-row: 1 / span 2; }
    .fe-lignes li { flex-wrap: wrap; }
    .dc-cases-grille { grid-template-columns: 1fr; }
    .dc-qui-barres { gap: 1px; }
    .dc-qui-jour.lundi { margin-left: 4px; }
    .dc-qui-jour small { font-size: .6rem; }
  }
  /* Lot S4c : jusqu'à 380 px de large (iPhone SE, petits Android), « Mon
     compte » devient un bouton carré à icône (le mot reste pour les lecteurs
     d'écran) : avec « Se déconnecter » en entier, l'en-tête tient sur une
     ligne sans sortir de l'écran (la page faisait 378 px à 320). */
  @media (max-width: 380px) {
    /* Et les tableaux des applis tiennent dans la largeur, sans défiler de
       côté (Défi tables : 290 px pour 286, Défi calcul : 310) : titres et
       chiffres un cran plus petits, le prénom coupé « … » un peu plus tôt. */
    #tableau th { font-size: .78rem; }
    #tableau td { font-size: .9rem; }
    #tableau th, #tableau td { padding-left: 3px; padding-right: 3px; }
    #tableau th:first-child, #tableau td:first-child { padding-left: 8px; }
    #tableau td.nom { max-width: 30vw; }
    /* « 12 séances dessus » passe à la ligne plutôt que d'être coupé. */
    #tableau .indice-tel { white-space: normal; }
    .entete #mon-compte { position: relative; width: var(--cible); padding: 0; font-size: 0; }
    .entete #mon-compte::before { content: ""; position: absolute; inset: 0; width: 20px; height: 20px; margin: auto; background: currentColor;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E") center / contain no-repeat;
              mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E") center / contain no-repeat; }
  }
  @media print {
    @page { margin: 12mm; }
    .barre, header, footer, .barre-outils, .actions, .rec-plein,
    #ecran-classe > *:not(.fiche):not(.bandelettes):not(.note-impression):not(.fiche-anzan):not(.fiche-defi-calcul):not(.grille-defi-calcul) { display: none !important; }
    body { background: #fff; }
    main { max-width: none; padding: 0; }
    /* Le bouton pose la classe sur <body> juste avant window.print() et
       l'enlève au retour (afterprint) : une seule des deux feuilles sort, et
       celle qu'on a demandée. Sans classe — un Ctrl+P direct —, on n'imprime
       pas les codes de la classe par surprise : on imprime le mode d'emploi. */
    body.imprime-recap .fiche { display: block; }
    body.imprime-bandelettes .bandelettes { display: block; }
    body:not(.imprime-recap):not(.imprime-bandelettes):not(.imprime-anzan) .note-impression { display: block; }
    .fiche th, .fiche td { border-bottom: 1px solid #999; }
    /* Lot 4b : « Imprimer » du parcours Anzan. La fenêtre ouverte ne sort pas
       (une fenêtre modale s'imprimerait par-dessus) : la feuille, seule. */
    body.imprime-anzan .fiche-anzan { display: block; }
    body.imprime-anzan dialog { display: none !important; }
    .fiche-anzan h2 { margin: 0 0 2px; }
    .fiche-anzan .fa-compte { margin: 0 0 12px; font-weight: 700; }
    .fiche-anzan table { width: 100%; border-collapse: collapse; font-size: .95rem; }
    .fiche-anzan th { text-align: left; font-size: .8rem; color: #333; }
    .fiche-anzan th, .fiche-anzan td { padding: 6px 6px; border-bottom: 1px solid #999; }
    .fiche-anzan td.fa-score { text-align: right; font-weight: 800; white-space: nowrap; }
    .fiche-anzan .fa-note { margin: 8px 0 0; font-size: .85rem; color: #333; }
    .fiche-anzan .fa-pied { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-top: 18px; font-size: .78rem; color: #444; }
    /* Défi calcul (lot 2b) : la fiche d'un élève ou la grille de la classe,
       en noir et blanc — ✓ sue, ○ en route, ↻ à revoir, ✖ à voir en classe,
       · à apprendre. La fenêtre ne sort pas. */
    body.imprime-defi-calcul .fiche-defi-calcul, body.imprime-defi-calcul-grille .grille-defi-calcul { display: block; }
    body.imprime-defi-calcul dialog, body.imprime-defi-calcul-grille dialog { display: none !important; }
    body:not(.imprime-recap):not(.imprime-bandelettes):not(.imprime-anzan):not(.imprime-defi-calcul):not(.imprime-defi-calcul-grille) .note-impression { display: block; }
    body.imprime-defi-calcul .note-impression, body.imprime-defi-calcul-grille .note-impression { display: none !important; }
    .fiche-defi-calcul h2, .grille-defi-calcul h2 { margin: 0 0 2px; font-size: 1.3rem; }
    .fiche-defi-calcul .fd-sous, .grille-defi-calcul .fd-sous { margin: 0 0 12px; color: #333; font-size: .9rem; }
    .fiche-defi-calcul h3 { margin: 14px 0 4px; font-size: 1rem; }
    .fiche-defi-calcul table, .grille-defi-calcul table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    .fiche-defi-calcul th, .fiche-defi-calcul td, .grille-defi-calcul th, .grille-defi-calcul td { padding: 4px 6px; border-bottom: 1px solid #999; text-align: left; vertical-align: top; }
    .fiche-defi-calcul th, .grille-defi-calcul th { font-size: .78rem; color: #333; }
    /* Relecture Codex : la fiche tient en A4 portrait (une compétence par
       ligne dans sa cellule), la grille sort en paysage et ses titres de
       colonnes passent à la ligne. */
    .grille-defi-calcul { page: grille-defi-calcul; }
    @page grille-defi-calcul { size: A4 landscape; margin: 12mm; }
    .grille-defi-calcul th.fd-mod, .grille-defi-calcul td.fd-mod { text-align: center; }
    .grille-defi-calcul th.fd-mod { white-space: normal; font-weight: 700; }
    .grille-defi-calcul td.fd-mod { white-space: nowrap; }
    .fiche-defi-calcul td.fd-etats span { display: block; }
    .fiche-defi-calcul table { font-size: .85rem; }
    .fiche-defi-calcul ul { margin: 0; padding-left: 18px; }
    .fiche-defi-calcul .fd-legende, .grille-defi-calcul .fd-legende { margin: 10px 0 0; font-size: .8rem; color: #333; }
    .fd-pied { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-top: 18px; font-size: .78rem; color: #444; }
    .pied-impression { margin-top: 18px; display: flex; align-items: center;
                       justify-content: space-between; font-size: .78rem; color: #444; }
  }
  /* Serveur pro (31/10/2026) : la connexion a le dessin de l'entrée de
     l'élève — grand logo, titre et carte centrés, en haut de l'écran ; le
     bouton prend toute la largeur de la carte. L'en-tête n'y répète pas le
     titre : sur la connexion, il disparaît (la barre de couleur reste). Sans
     :has() (vieux navigateur), l'en-tête reste simplement affiché. */
  body:has(#ecran-connexion:not([hidden])) .entete { display: none; }
  #ecran-connexion { text-align: center; padding-top: 10px; }
  #ecran-connexion .logo-accueil { display: block; width: 180px; height: auto; margin: 4px auto 16px; }
  #ecran-connexion .carte { max-width: 420px; margin: 0 auto; text-align: left; }
  #ecran-connexion .actions button { flex: 1 1 100%; }
  /* Lot E « Arriver » (21/11/2026, planche E-5) : sur ordinateur, la connexion
     était petite au milieu d'un grand vide. À partir de 900 px : logo, titre,
     carte, champs et bouton plus grands ; le bloc descend d'une hauteur fixe.
     Sur un écran bas (768 px et moins, fenêtre de 720 px), tout se resserre
     pour que la carte ET le pied tiennent (mesuré à 1366 × 657). Le titre
     reste en Georgia (côté prof). En dessous de 900 px, rien ne change. */
  @media (min-width: 900px) {
    #ecran-connexion { padding-top: clamp(4px, 4vh, 48px); }
    #ecran-connexion .logo-accueil { width: 240px; margin: 0 auto 20px; }
    #ecran-connexion h1 { font-size: 2.6rem; }
    #ecran-connexion .sous { font-size: 1.05rem; margin-bottom: 24px; }
    #ecran-connexion .carte { max-width: 540px; padding: 18px 40px 32px; border-radius: 22px; }
    #ecran-connexion label { font-size: 1.1rem; margin-top: 14px; }
    #ecran-connexion input { min-height: 52px; font-size: 1.15rem; padding-left: 14px; }
    #ecran-connexion .actions { margin-top: 24px; }
    #ecran-connexion .actions button { min-height: 56px; font-size: 1.15rem; border-radius: 14px; }
  }
  @media (min-width: 900px) and (max-height: 720px) {
    #ecran-connexion .logo-accueil { width: 190px; margin-bottom: 14px; }
    #ecran-connexion h1 { font-size: 2.3rem; }
    #ecran-connexion .sous { margin-bottom: 10px; }
    #ecran-connexion .carte { padding: 12px 40px 26px; }
    #ecran-connexion label { margin-top: 10px; }
    #ecran-connexion .actions { margin-top: 20px; }
  }
  /* Lot « cours-appli » (08/11/2026) : l'onglet Cours n'a pas de tableau. Tout
     ce qui sert aux applis suivies (cartes, outils, tableau) s'efface ; restent
     la ligne « qui voit », la carte d'un onglet grisé, le message et le panneau. */
  #vue-appli.vue-cours > :not(#qui-voit):not(#appli-fermee):not(#message-appli):not(#cours-prof) { display: none !important; }
  .cours-prof h2 { margin: 0 0 2px; }
  .cours-prof > .sous { margin: 0 0 10px; }
  .cours-chap { margin: 14px 0 0; }
  .cours-chap > p { margin: 0 0 2px; font-weight: 700; color: var(--blue-dark); }
  .cours-chap > p span { font-weight: 400; color: var(--muted); font-size: var(--texte-secondaire); }
  .cours-niv { display: inline-block; margin-right: 6px; padding: 0 6px; border: 1.5px solid var(--teal-texte); border-radius: 6px;
               color: var(--teal-texte); font-size: 12.5px; font-weight: 700; }
  .cours-fiche { display: flex; align-items: baseline; gap: 10px; padding: 7px 0; border-top: 1px solid var(--filet-doux); }
  .cours-fiche .marque { flex: 0 0 1.1em; font-weight: 800; color: var(--vert); }
  .cours-fiche.fermee { color: var(--indice); }
  .cours-fiche.fermee .marque { color: var(--indice); }
  .cours-fiche .t { flex: 1 1 auto; min-width: 0; }
  .cours-fiche small { color: var(--muted); font-size: 13px; }
  .cours-fiche a { flex: 0 0 auto; font-size: var(--texte-secondaire); white-space: nowrap; }
  /* Lot « cours-ouvertures » (10/11/2026) : sous les fiches d'un chapitre,
     « Ouverte le » — une ligne par élève, une colonne par fiche que voit la
     classe (son numéro, 🎯 pour l'Entraînement brevet), le jour de la
     dernière ouverture ou rien. Au téléphone, le tableau glisse de côté et
     les prénoms restent en place. */
  .cours-ouv-env { margin: 10px 0 2px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .cours-ouv { width: auto; border-collapse: collapse; font-size: 13.5px; font-variant-numeric: tabular-nums; }
  .cours-ouv th, .cours-ouv td { padding: 5px 6px; border-bottom: 1px solid var(--filet-doux); text-align: center; white-space: nowrap; }
  .cours-ouv tr:last-child > * { border-bottom: 0; }
  .cours-ouv thead th { min-width: 3.6em; }
  .cours-ouv th:first-child { position: sticky; left: 0; z-index: 1; text-align: left; padding-right: 14px; }
  .cours-ouv tbody th { background: var(--paper); font-size: 13.5px; font-weight: 600; color: var(--ink);
                        max-width: 9.5em; overflow: hidden; text-overflow: ellipsis; }
  .cours-ouv td span { display: inline-block; padding: 1px 6px; border-radius: 6px; background: var(--teal-pale); color: var(--teal-texte); font-weight: 700; }
  .cours-personne { margin: 8px 0 0; color: var(--muted); font-size: var(--texte-secondaire); }
  .cours-nouveau { display: inline-block; margin-left: 4px; padding: 0 8px; border-radius: 999px; background: var(--orange-pale);
                   border: 1px solid #f0d2b0; color: var(--orange-texte); font-size: 12.5px; font-weight: 700; }
  .regler .cours-niveaux { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 2px; }
  .regler .cours-niveaux button { min-width: 56px; }
  .regler .cours-niveaux button[aria-pressed="true"] { background: var(--blue); border-color: var(--blue); color: #fff; }
  .regler .cours-boite { margin: 8px 0 0; padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--arrondi-carte); }
  .regler .cours-boite-tete { display: flex; align-items: center; gap: 8px; }
  .regler .cours-boite-tete .case-a-cocher { flex: 1 1 auto; font-weight: 700; color: var(--blue-dark); }
  .regler .cours-boite-tete button { flex: 0 0 auto; }
  .regler .cours-boite-nom { flex: 1 1 auto; min-width: 0; margin: 0; padding: 6px 0; font-weight: 700; color: var(--blue-dark); }
  .regler .cours-boite-nom small { display: block; color: var(--muted); font-size: .82rem; font-weight: 400; }
  .regler .cours-fiches { margin: 6px 0 0 30px; }
  .regler .cours-fiches .cours-fiche { align-items: center; }
  .regler .cours-fiches .case-a-cocher { flex: 1 1 auto; }
  .regler .cours-fiches.eteintes .case-a-cocher { opacity: .55; }
  .regler .cours-fiches .case-a-cocher .mots { font-weight: 400; }
  /* Lot « cours-appli-2 » (13/11/2026, choix de Gwenaël) : « Tout ouvrir » et
     « Tout fermer » pour le niveau affiché, à droite du titre des chapitres ;
     rien ne part avant « Enregistrer ». */
  .regler .cours-tous { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 16px 0 6px; }
  .regler .cours-tous h3 { flex: 1 0 100%; margin: 0 0 2px; }
  .regler .cours-tous button { min-height: 40px; padding: 6px 12px; font-size: var(--texte-secondaire); }
  /* Lot « cours-appli-2 » : l'onglet Cours devient un RÉSUMÉ (la grille élèves
     × fiches devenait illisible) — en tête, les élèves de la semaine ; une
     ligne par chapitre, « ouvert par N élèves sur M », qui se déplie : ses
     fiches avec le nombre d'élèves qui ont ouvert chacune, puis la grille
     complète, à déplier encore. */
  .cours-semaine { margin: 6px 0 2px; font-size: var(--texte); color: var(--ink); }
  .cours-semaine b { color: var(--blue-dark); }
  .cours-prof .cours-chap { margin: 0; border-top: 1px solid var(--filet-doux); }
  .cours-prof .cours-chap:first-of-type { margin-top: 10px; }
  .cours-chap-tete { display: flex; flex-wrap: wrap; justify-content: flex-start; align-items: baseline; gap: 2px 12px; width: 100%; min-height: 44px; margin: 0; padding: 10px 2px;
                     background: none; border: 0; border-radius: 0; color: var(--blue-dark); font: inherit; text-align: left; cursor: pointer; }
  .cours-chap-tete:hover { background: var(--survol); color: var(--blue-dark); border: 0; }
  .cours-chap-tete .nom { flex: 1 1 16em; min-width: 0; font-weight: 700; }
  .cours-chap-tete .nom::before { content: "▸"; display: inline-block; width: 1.1em; color: var(--blue); }
  .cours-chap-tete[aria-expanded="true"] .nom::before { content: "▾"; }
  .cours-chap-tete .nom small { font-weight: 400; color: var(--muted); font-size: var(--texte-secondaire); }
  /* Lot « cours-appli-3 » : « · en plus pour 2 élèves » allonge la ligne —
     au téléphone, elle passe à la ligne au lieu de sortir de la carte. */
  .cours-chap-tete .nom { white-space: normal; overflow-wrap: anywhere; }
  .cours-chap-tete .combien { flex: 0 0 auto; margin-left: 1.1em; color: var(--ink); font-size: var(--texte-secondaire); }
  .cours-chap-tete .combien b { color: var(--teal-texte); }
  .cours-chap-corps { padding: 0 0 12px 1.1em; }
  .cours-chap-corps > .titre-long { margin: 0 0 4px; color: var(--muted); font-size: var(--texte-secondaire); }
  .cours-fiche .ouvreurs { flex: 0 0 auto; color: var(--teal-texte); font-size: var(--texte-secondaire); font-weight: 700; white-space: nowrap; }
  .cours-fiche .ouvreurs.personne { color: var(--indice); font-weight: 400; }
  .cours-grille-bouton { margin: 8px 0 0; min-height: 40px; padding: 6px 12px; font-size: var(--texte-secondaire); }
  /* Au téléphone, le nombre d'élèves et « Voir ↗ » passent sous le titre de
     la fiche (le titre garde toute la largeur). */
  @media (max-width: 600px) {
    .cours-prof .cours-fiche { flex-wrap: wrap; row-gap: 2px; }
    .cours-prof .cours-fiche .t { flex: 1 0 calc(100% - 2.2em); }
    .cours-prof .cours-fiche .ouvreurs { margin-left: calc(1.1em + 10px); }
    .cours-prof .cours-fiche a { margin-left: auto; }
  }
  /* Lot « cours-appli-2 » : dans la fiche d'un élève, une fiche de cours
     ouverte est dans « Activité », avec un rond VIDE — ce n'est pas un jour
     de travail (choix de Gwenaël du 13/11) : rien dans le calendrier. */
  .lc-puce.cours { background: #fff !important; border: 2px solid #063f86; box-sizing: border-box; }
</style>
</head>
<body>
<div class="barre"></div>
<header class="entete">
  <img src="../mathsgo-logo.png" alt="maths&go">
  <span class="titre" id="titre-page">Suivi des élèves</span>
  <span class="droite">
    <span class="qui" id="qui" hidden></span>
    <button type="button" class="secondaire" id="mon-compte" hidden>Mon compte</button>
    <button type="button" class="secondaire" id="deconnexion" hidden>Se déconnecter</button>
  </span>
</header>

<main>
  <!-- Connexion -->
  <section id="ecran-connexion">
    <img class="logo-accueil" src="../mathsgo-logo.png" alt="maths&amp;go" width="180" height="84">
    <h1>Suivi des élèves</h1>
    <p class="sous">Espace réservé. Cette page n’est pas accessible aux élèves.</p>
    <div class="carte">
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

  <!-- Serveur pro, lot 5d (choix de Gwenaël, 25/10/2026) : plus d'écran
       « Mes classes ». À la connexion, une classe s'ouvre toujours (l'ancre de
       la séance en direct, sinon la dernière ouverte sur ce poste, sinon la
       première des siennes) ; on change de classe par « 405 ▾ », qui se termine
       par « + Nouvelle classe ». Professeurs est dans Mon compte. Il ne reste
       ici que l'écran d'un professeur qui n'a AUCUNE classe (un collègue au
       premier jour). -->
  <section id="ecran-premiere-classe" hidden>
    <div class="carte premiere-classe" id="carte-premiere-classe">
      <h1>Crée ta première classe</h1>
      <p class="sous">Donne-lui un nom (405, 6e B…), puis ajoute tes élèves : chacun reçoit un code pour entrer dans les applis.</p>
      <div class="actions">
        <button type="button" id="premiere-classe"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Nouvelle classe</button>
      </div>
      <p class="sous note">Si un collègue partage une de ses classes avec toi, elle s’ouvrira ici à ta prochaine connexion.</p>
    </div>
    <!-- Correctif des lots 5 (relecture Codex, point 3) : la liste des classes
         ou le tableau de la classe à ouvrir n'ont pas pu être lus (une classe
         vient d'être supprimée, le réseau a lâché). Ni la classe partie, ni
         « Crée ta première classe » : de quoi réessayer. Le message dessous
         dit ce qui a réussi et ce qui a échoué. -->
    <div class="carte premiere-classe" id="carte-reessayer" hidden>
      <h1>Ta classe n’a pas pu s’ouvrir</h1>
      <p class="sous">Le détail est juste en dessous. Réessaie dans un instant.</p>
      <div class="actions">
        <button type="button" id="reessayer-classe">Réessayer</button>
      </div>
    </div>
    <p class="message" id="message-premiere-classe" hidden></p>
  </section>

  <!-- Une classe -->
  <section id="ecran-classe" hidden>
    <!-- Séance en direct (07/10/2026) : le bouton ouvre l'écran du tableau
         (prof/direct.php) pour cette classe, dans le même onglet. Il est sur
         la ligne du retour, à droite : la barre d'outils est déjà pleine. -->
    <!-- Serveur pro, lot 5a (choix de Gwenaël, planche 1, 25/10/2026) : le nom
         de la classe ouvre la liste de ses classes. Lot 5d : « + Nouvelle
         classe » au bout de la liste (avant, « Toutes mes classes », qui
         ramenait aux tuiles). Les classes sont celles de classes.liste, déjà
         lue : le menu n'appelle pas le serveur. -->
    <div class="tete-classe">
      <div class="choix-classe">
        <h1><button type="button" id="bouton-classes" aria-haspopup="true" aria-expanded="false" aria-controls="menu-classes"><span id="titre-classe"></span><span class="rond" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button></h1>
        <div class="menu-classes" id="menu-classes" hidden>
          <ul id="menu-classes-liste" aria-label="Mes classes"></ul>
          <button type="button" id="nouvelle-classe"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Nouvelle classe</button>
        </div>
      </div>
      <button type="button" id="seance-direct">Séance en direct</button>
    </div>
    <p class="sous" id="resume-classe"></p>
    <p class="message" id="bandeau-droit" hidden></p>
    <!-- Lot 5d : ce que disait l'écran « Mes classes », en haut de la classe
         ouverte — le message des classes (créée, supprimée, mot de passe
         changé) et les deux bandeaux de l'année. Fin d'année (lot serveur A,
         06/09/2026) : le serveur ne supprime plus rien à l'ouverture de la
         liste des classes ; il dit ce qui ne sert plus, et le professeur
         décide. Une suppression définitive ne doit jamais être le prix d'un
         clic. -->
    <p class="message" id="message-classes" hidden></p>
    <p class="message" id="bandeau-annee" hidden></p>
    <div class="message info" id="bandeau-echues" hidden>
      <p id="echues-texte" style="margin:0 0 10px"></p>
      <div class="actions">
        <button type="button" class="danger" id="supprimer-echues"></button>
        <button type="button" class="secondaire" id="echues-plus-tard">Me le rappeler plus tard</button>
      </div>
    </div>
    <!-- Lot « Ma classe : réglages » (17/10/2026) : les onglets, toujours là.
         À gauche, les activités de la classe (un bouton caché pour celle
         qu'elle n'a pas) : on voit toujours de quelle appli est le tableau.
         Au bout à droite, « Réglages » : propriétaire seulement, il remplace
         la vue de l'activité par celle des réglages de la classe. Le dernier
         choix d'activité est retenu dans l'onglet du navigateur ; « Réglages »
         ne l'est pas (une classe s'ouvre toujours sur son tableau). Le rouage
         est le dessin « settings » de Feather Icons (licence MIT).
         Lot « Ma classe : élèves » (18/10/2026) : « Élèves » avant
         « Réglages » — les prénoms, les codes et les papiers de la classe,
         pour le propriétaire et les collègues en écriture. Il ne se retient
         pas non plus : ouvrir une classe devant les élèves ne montre jamais
         les codes. Les deux silhouettes sont le dessin « users » de Feather
         Icons (licence MIT). -->
    <!-- Serveur pro, lot 5a (choix de Gwenaël, 25/10/2026) : au téléphone, la
         ligne d'onglets reste collée en haut quand on descend, avec « 405 ▾ »
         en petit au début (caché tant que la barre n'est pas collée : le grand
         titre est alors à l'écran). Le repère dit où la barre se colle. -->
    <div id="repere-onglets"></div>
    <div class="barre-onglets" id="onglets">
      <button type="button" class="classe-collee" id="bouton-classes-colle" aria-haspopup="true" aria-expanded="false" aria-controls="menu-classes" hidden><span id="titre-classe-colle"></span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <!-- Le sélecteur d'appli (choix de Gwenaël, 25/10/2026) : quand les onglets
           des applis ne tiennent plus sur la ligne (téléphone aujourd'hui, et
           un jour l'ordinateur avec dix applis), « Défi tables ▾ » les remplace
           et ouvre leur liste. Sinon, caché : les onglets. -->
      <!-- Lot S2 « Suivre ses élèves » (choix de Gwenaël du 07/11/2026) : « La
           classe », le premier onglet — toutes applis ensemble. Il ne défile
           jamais avec les applis : il reste à gauche, même au téléphone (la
           maison est le dessin « home » de Feather Icons, licence MIT). -->
      <div class="onglets onglets-vue" role="group" aria-label="Toutes les applis">
        <button type="button" id="onglet-classe" aria-pressed="false"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg><span class="mot">La classe</span></button>
      </div>
      <div class="choix-appli-menu" id="choix-appli-menu" hidden>
        <button type="button" class="appli-selecteur" id="bouton-applis" aria-haspopup="true" aria-expanded="false" aria-controls="menu-applis"><span id="nom-appli"></span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="menu-classes menu-applis" id="menu-applis" hidden><ul id="menu-applis-liste" aria-label="Applis"></ul></div>
      </div>
      <div class="onglets" id="choix-appli" role="group" aria-label="Activité affichée">
        <button type="button" data-appli="defi-tables" aria-pressed="true">Défi tables</button>
        <button type="button" data-appli="coffres" aria-pressed="false">Coffres magiques</button>
        <button type="button" data-appli="flash-anzan" aria-pressed="false">Anzan</button>
        <button type="button" data-appli="defi-calcul" aria-pressed="false">Défi calcul</button>
        <button type="button" data-appli="splat" aria-pressed="false">SPLAT!</button>
        <button type="button" data-appli="cours" aria-pressed="false">Cours</button>
      </div>
      <div class="onglets onglets-classe" role="group" aria-label="La classe">
      <button type="button" class="onglet-eleves" id="onglet-eleves" aria-pressed="false" aria-label="Élèves" title="Élèves : prénoms, codes, papiers" hidden><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span class="mot">Élèves</span></button>
      <button type="button" class="onglet-reglages" id="onglet-reglages" aria-pressed="false" aria-label="Réglages" title="Réglages de la classe" hidden><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span class="mot">Réglages</span></button>
      </div>
    </div>

    <!-- Lot S2 : la vue « La classe » (planches 1 et 3, choix de Gwenaël du
         07/11/2026). En haut « À aider » et « À féliciter » (6 lignes au
         plus, les absents d'abord) ; puis une ligne par élève, toutes applis :
         ses 7 jours de la semaine (✓ un jour de travail), ses 4 dernières
         semaines en chiffres, où il en est dans chaque appli. Toucher une
         ligne ouvre sa fiche. Tout est lu dans les listes que la page lit déjà
         (resumeSuivi de chaque moteur) : aucune donnée de plus n'est demandée
         au serveur. Les prénoms sont posés par textContent. -->
    <div id="vue-classe" hidden>
      <p class="message" id="lc-message" hidden></p>
      <div class="grille-cartes lc-cartes">
        <div class="carte lc-carte" id="lc-aider">
          <strong>À aider</strong>
          <p class="sous">Qui ne vient plus, qui tourne en rond — et quoi faire.</p>
          <ul class="lc-liste" id="lc-aider-liste"></ul>
          <p class="lc-plus" id="lc-aider-plus" hidden></p>
        </div>
        <div class="carte lc-carte" id="lc-feliciter">
          <strong>À féliciter</strong>
          <p class="sous" id="lc-feliciter-sous">Ce qui a été gagné cette semaine.</p>
          <ul class="lc-liste" id="lc-feliciter-liste"></ul>
          <p class="lc-plus" id="lc-feliciter-plus" hidden></p>
        </div>
      </div>
      <div class="tableau-enveloppe">
        <table id="lc-tableau">
          <thead><tr id="lc-entete"></tr></thead>
          <tbody id="lc-corps"></tbody>
        </table>
      </div>
      <p class="sous lc-note"><span class="lc-jour ok" aria-hidden="true">✓</span> un jour de travail, dans au moins une appli
      · <span class="lc-jour aujourdhui" aria-hidden="true"></span> aujourd’hui. Le détail de chaque jour est dans la fiche de l’élève.</p>
    </div>

    <!-- La vue de l'activité : ce qu'on regarde et ce qu'on fait avec l'appli. -->
    <div id="vue-appli">

    <!-- Serveur pro, lot 5b (choix de Gwenaël, planches 2, 3 et 7 de l'étape 4,
         25/10/2026) : en haut de l'onglet, qui voit l'appli (« ● Ouvert à
         toute la 405 · … », « ● Ouvert à quelques élèves · Rania ») et
         « Régler … » (propriétaire seulement : la fenêtre #regler). Une appli
         que personne ne voit : l'onglet est grisé, et dedans la carte
         « … est fermé à la 405 » (poserQuiVoit). Le rouage est le dessin
         « settings » de Feather Icons (licence MIT). -->
    <div class="qui-voit" id="qui-voit" hidden>
      <p class="etat" id="qui-voit-etat"></p>
      <!-- Lot S2 (demande de Gwenaël du 07/11/2026 au soir) : Défi calcul en
           mode professeur (tous les menus, rien d'enregistré), dans un nouvel
           onglet — à côté de « Régler Défi calcul », du même modèle (au
           téléphone, le dessin seul). La flèche est le dessin
           « external-link » de Feather Icons (licence MIT). -->
      <a class="bouton secondaire" id="dc-mode-prof" href="https://mathsgo.re/outils/calcul_mental/defi_calcul_modules.html?prof=1" target="_blank" rel="noopener" aria-label="Ouvrir Défi calcul en mode professeur (nouvel onglet)" hidden><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg><span class="mot">Ouvrir Défi calcul en mode professeur</span></a>
      <button type="button" class="secondaire" id="regler-appli" hidden><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span class="mot" id="regler-appli-mot"></span></button>
    </div>
    <div class="carte appli-fermee" id="appli-fermee" hidden>
      <h2 id="af-titre"></h2>
      <p id="af-texte"></p>
      <div class="actions" id="af-actions">
        <button type="button" class="secondaire" id="af-quelques">Choisir quelques élèves</button>
        <button type="button" id="af-toute"></button>
      </div>
    </div>
    <!-- Lot « cours-appli » (08/11/2026) : l'onglet Cours n'a pas de tableau
         de progression ; il montre ce que voient les élèves de la classe,
         chapitre par chapitre (dessinerCoursProf), et depuis le lot
         « cours-ouvertures » (10/11/2026) le jour où chaque élève a ouvert
         chaque fiche pour la dernière fois. -->
    <div class="carte cours-prof" id="cours-prof" hidden></div>

    <!-- Serveur pro, lot 5c (choix de Gwenaël, maquette 8 du 25/10/2026) : les
         trois cartes du haut de Défi tables côte à côte, de la même largeur
         (charte : .grille-cartes), sans filet de couleur. -->
    <div class="grille-cartes cartes-haut">

    <!-- Défi calcul, lot K2 « le professeur » (28/11/2026, planche K2-3) :
         « À aider » — les élèves qui butent en ce moment, chacun une fois,
         pour sa raison la plus forte. AVEC les prénoms : à ne pas projeter.
         Toucher un prénom ouvre sa fiche. En haut à gauche, « Notre classe,
         ensemble » dessous (la grille de .cartes-haut, en CSS). -->
    <div class="carte dc-aider" id="dc-aider" hidden>
      <strong>À aider</strong>
      <p class="sous">Les élèves qui butent en ce moment · avec les prénoms : à ne pas projeter</p>
      <ul id="dc-aider-liste"></ul>
      <div class="dc-pied" id="dc-aider-pied"></div>
    </div>

    <!-- L'objectif commun de la classe. Aucun nom, aucun chiffre par élève :
         c'est ce qu'on peut montrer au tableau sans désigner personne. -->
    <div class="carte objectif" id="objectif" hidden>
      <strong>Notre classe, ensemble</strong>
      <div class="jauge-barre"><i id="objectif-barre"></i></div>
      <span class="compte" id="objectif-compte"></span>
      <ul class="lignes" id="objectif-lignes"></ul>
    </div>

    <!-- Lot S4c « les onglets d'appli » : SPLAT!, « Par monde » — pour chaque
         monde ouvert à la classe, combien l'ont fini, en cours, pas commencé
         (chaque nombre se touche : les prénoms, par-dessus la page), et qui a
         vu des réponses cette semaine. -->
    <div class="carte splat-mondes" id="splat-mondes" hidden>
      <strong>Par monde</strong>
      <ul id="splat-mondes-liste"></ul>
      <p class="sous" id="splat-mondes-vues"></p>
    </div>

    <!-- Vue d'ensemble : ce qu'il faut revoir au tableau, pas élève par élève.
         Calculé dans le navigateur à partir des progressions déjà chargées. -->
    <div class="carte fragiles" id="fragiles" hidden>
      <strong>Les calculs qui coincent dans cette classe</strong>
      <p id="fragiles-sous"></p>
      <ul id="fragiles-liste"></ul>
    </div>

    <!-- Défi calcul (lot 2b, 31/10/2026) : « À reprendre en classe » — les
         compétences rouges ou mises de côté chez au moins deux élèves (ou
         « à voir en classe » chez un seul), avec la cause d'erreur la plus
         fréquente du module et un calcul d'exemple REGÉNÉRÉ depuis la fiche
         (aucun calcul d'élève n'est enregistré), et « ouvrir en classe »,
         qui lance ce niveau dans l'appli en mode professeur. Calculé dans le
         navigateur, aucun nom : c'est ce qu'on peut montrer au tableau. -->
    <!-- Lot K2 (28/11/2026) : deux parties — « Les erreurs les plus
         fréquentes · depuis le début » (la cause, le module, « N élèves sur
         M » qui donne les prénoms par-dessus la page, un exemple regénéré,
         ce que l'appli dit à l'élève, « ouvrir en classe ») et « Les étoiles
         qui résistent · chez 2 élèves ou plus ». Aucun prénom à l'écran. -->
    <div class="carte dc-reprendre" id="dc-reprendre" hidden>
      <strong>À reprendre en classe</strong>
      <p class="sous">Ce qui coince chez plusieurs élèves · aucun prénom à l’écran : on peut projeter</p>
      <div id="dc-reprendre-corps"></div>
    </div>

    <!-- Lot E1 « les évaluations en classe » (15/10/2026, planches 2 et 3) :
         la carte « 📝 Évaluations », onglet Défi tables, propriétaire et
         collègues en écriture. Les modèles sont ceux du professeur connecté ;
         l'évaluation ouverte est celle de la classe. La correction se fait
         ici, avec le moteur servi par ce serveur : le serveur n'a que des
         graines et des réponses, jamais une note. -->
    <div class="carte eval-carte" id="bloc-evaluations" hidden>
      <div class="eval-tete">
        <div><strong>📝 Évaluations</strong><p>En classe · un passage par élève · réponses effacées au plus tard le lendemain</p></div>
        <div class="fin">
          <button type="button" class="secondaire" id="evaluations-plein-ecran" hidden>Plein écran</button>
          <button type="button" class="secondaire" id="nouveau-modele">Nouveau modèle</button>
        </div>
      </div>
      <div id="evaluations-zone"></div>
      <p class="message" id="message-evaluations" hidden></p>
    </div>

    </div>

    <!-- Lot K2 « le professeur » (28/11/2026, planches K2-3 et K2-4) :
         Défi calcul, « Où en est chacun » — un onglet par étage, une ligne
         par élève, une case par étoile (sept états lisibles en noir et
         blanc), une bande de couleur par ligne de la carte, « Gagnée par »
         en bas ; les prénoms restent à gauche quand la grille défile de côté.
         Toucher une case montre son détail PAR-DESSUS la page. (Elle
         remplace les barres par module du lot S2.) Puis « Qui s'entraîne » :
         les élèves par jour sur 4 semaines, qui n'est pas venu cette semaine
         et qui a fait moins de 3 séances (pas le lundi : la semaine
         commence). Aucun temps passé. -->
    <details class="carte dc-ouest" id="dc-ouest" hidden>
      <summary class="dc-tete"><strong>Où en est chacun</strong><span class="sous">une ligne par élève, une case par étoile · toucher une case : son détail</span></summary>
      <div class="dc-paliers-choix" id="dc-ouest-paliers" role="group" aria-label="Étage"></div>
      <div class="dc-grille" id="dc-grille"></div>
      <p class="dc-legende dc-grille-legende" id="dc-grille-legende"></p>
    </details>
    <div class="carte dc-qui" id="dc-qui" hidden>
      <div class="dc-tete"><strong>Qui s’entraîne</strong><span class="sous">élèves qui ont fait une séance, jour par jour · 4 semaines</span></div>
      <div class="dc-qui-barres" id="dc-qui-barres" aria-hidden="true"></div>
      <p class="dc-qui-texte" id="dc-qui-texte"></p>
      <p class="dc-qui-texte" id="dc-qui-peu" hidden></p>
    </div>

    <!-- Lot « Ma classe : élèves » (18/10/2026) : les boutons des élèves sont
         partis dans l'onglet Élèves ; ici, la progression seulement.
         Serveur pro, lot 5c : chercher un prénom au-dessus du tableau ; plus de
         « Trier par » — les titres de colonnes trient. La loupe est le dessin
         « search » de Feather Icons (licence MIT). -->
    <div class="outils-tableau" id="outils-tableau">
      <!-- Défi calcul (lot 2b) : la grille de la classe, en noir et blanc. -->
      <button type="button" class="secondaire" id="dc-imprimer-grille" title="La grille de la classe, module par module, en noir et blanc" hidden>Imprimer la grille</button>
      <div class="chercher"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="search" id="chercher-eleve" placeholder="Chercher un élève" aria-label="Chercher un élève" autocomplete="off" spellcheck="false" maxlength="40"></div>
      <!-- Lot S4c : Coffres magiques, « Depuis le début » ou « Cette semaine ». -->
      <div class="dc-paliers-choix periode-coffres" id="periode-coffres" role="group" aria-label="Période" hidden>
        <button type="button" data-periode="debut" aria-pressed="true">Depuis le début</button>
        <button type="button" data-periode="semaine" aria-pressed="false">Cette semaine</button>
      </div>
    </div>
    <!-- Le message de l'activité (fiche, version restaurée, moteur absent) :
         au-dessus du tableau, pas sous trente lignes. -->
    <p class="message" id="message-appli" hidden></p>
    <div class="tableau-enveloppe" id="enveloppe-tableau">
      <table id="tableau">
        <thead>
          <!-- Serveur pro, lot 5c : « large » = caché au téléphone (le tableau
               compact garde trois colonnes) ; « seul-telephone » = l'inverse.
               Les deux dernières colonnes, sans titre : le « ⋯ » (lot 8), puis
               la flèche « › » (« fin », cachée au téléphone). -->
          <tr id="entete-defi-tables">
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th><button type="button" data-tri="acquises">Tables passées</button></th>
            <th class="large"><button type="button" data-tri="encours">En cours</button></th>
            <th class="large"><button type="button" data-tri="semaine">Séances · 4 semaines</button></th>
            <th class="large"><button type="button" data-tri="retard">En retard</button></th>
            <th><button type="button" data-tri="date">Dernière activité</button></th>
            <th></th>
            <th class="fin"></th>
          </tr>
          <!-- L'onglet Coffres magiques (lot « Coffres magiques sur le suivi »,
               21/10/2026, maquette 01 validée) : un niveau par colonne, le
               jour du dernier trésor. -->
          <tr id="entete-coffres" hidden>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th><button type="button" data-tri="tresors">Trésors</button></th>
            <th class="large"><button type="button" data-tri="niveau1">Niveau 1</button></th>
            <th class="large"><button type="button" data-tri="niveau2">Niveau 2</button></th>
            <th class="large"><button type="button" data-tri="niveau3">Niveau 3</button></th>
            <th><button type="button" data-tri="date">Dernier trésor</button></th>
            <th></th>
            <th class="fin"></th>
          </tr>
          <!-- Lot S4c : Coffres magiques, « Cette semaine » — ce que son
               relevé jour par jour garde depuis lundi : trésors, parfaits, aides,
               solutions vues, jours. -->
          <tr id="entete-coffres-semaine" hidden>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th><button type="button" data-tri="s-tresors">Trésors</button></th>
            <th class="large"><button type="button" data-tri="s-parfaits">Parfaits</button></th>
            <th class="large"><button type="button" data-tri="s-aides">Aides</button></th>
            <th><button type="button" data-tri="s-solutions">Solutions vues</button></th>
            <th class="large"><button type="button" data-tri="s-jours">Jours</button></th>
            <th></th>
            <th class="fin"></th>
          </tr>
          <!-- L'onglet Anzan (lot « Qui voit quoi », lot 4b, 24/10/2026) : le
               compte en calculs et en jours (on compte des calculs, pas des
               séances : une séance en fait 5, 10 ou 20), le jour de la
               dernière séance, et « Parcours » (ses dix dernières séances). -->
          <!-- Lot S4c : par mode — Flash, Colonne (les calculs, et dessous le
               plus haut grade réussi dans ce mode). Au téléphone, le jour de
               la dernière séance passe sous le prénom. -->
          <tr id="entete-anzan" hidden>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th><button type="button" data-tri="flash">Flash</button></th>
            <th><button type="button" data-tri="colonne">Colonne</button></th>
            <th class="large"><button type="button" data-tri="jours">Jours</button></th>
            <th class="large"><button type="button" data-tri="date">Dernière séance</button></th>
            <th></th>
            <th class="fin"></th>
          </tr>
          <!-- L'onglet Défi calcul (lot 2b, 31/10/2026 ; lot K2, 28/11/2026) :
               la ceinture, les étoiles gagnées (et par classe dessous),
               combien sont à surveiller, les séances des 4 dernières
               semaines, le dernier jour. -->
          <tr id="entete-defi-calcul" hidden>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th class="large"><button type="button" data-tri="ceinture">Ceinture</button></th>
            <th><button type="button" data-tri="etoiles">Étoiles</button></th>
            <th class="large"><button type="button" data-tri="surveiller">À surveiller</button></th>
            <th class="large"><button type="button" data-tri="seances">Séances · 4 semaines</button></th>
            <th><button type="button" data-tri="date">Dernière activité</button></th>
            <th></th>
            <th class="fin"></th>
          </tr>
          <!-- L'onglet SPLAT! (lot « splat-suivi-4 ») : ses colonnes à lui. -->
          <tr id="entete-splat" hidden>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th class="large">Mondes</th>
            <th><button type="button" data-tri="etapes">Étapes réussies</button></th>
            <th><button type="button" data-tri="date">Dernière activité</button></th>
            <th></th>
            <th class="fin"></th>
          </tr>
        </thead>
        <tbody id="corps"></tbody>
      </table>
    </div>
    <p class="sous note-coffres" id="note-coffres" hidden>Parfait : sans erreur ni solution montrée.</p>
    <p class="sous note-tableau" id="note-tableau">Ce tableau est un <strong>indicateur pédagogique, pas une preuve
    d’évaluation</strong> : la progression vient de l’appareil de l’élève, et quiconque connaît son code
    peut la modifier.</p>

    <!-- Lot « Les records » (09/10/2026, planche R5) : la ligue du professeur
         — toutes ses classes. Depuis le lot « qui est Mystère » (25/10/2026),
         la carte montre au professeur qui est derrière un « Mystère »
         (« Mystère (Léa · 405) ») ; le plein écran, qu'on projette, montre
         exactement ce que voient les élèves. Propriétaire seulement, Défi
         tables seulement, et seulement quand une Légende a un temps. -->
    <div class="carte rec-carte" id="bloc-records" hidden>
      <div class="rec-tete">
        <div><strong>🏆 Les records</strong><p>Toutes tes classes · le plein écran montre ce que voient les élèves</p></div>
        <button type="button" class="secondaire" id="records-plein-ecran">Plein écran</button>
      </div>
      <div class="rec-deux">
        <div><h3>Cette semaine</h3><ol class="rec-liste" id="records-semaine"></ol><p class="rec-vide" id="records-semaine-vide" hidden>Personne cette semaine, pour l’instant.</p></div>
        <div><h3>De tous les temps</h3><ol class="rec-liste" id="records-toujours"></ol></div>
      </div>
      <p class="message" id="message-records" hidden></p>
    </div>

    <!-- Ce qu'on imprime pour la classe (lot R5 de Défi tables, 13/09/2026) :
         les papiers de l'élève vivent sur mathsgo.re, pas ici. La fiche vierge
         et la feuille des tables ne sont plus proposées dans l'appli élève
         (décision Q6) : c'est le professeur qui les distribue. -->
    <div class="carte imprimer" id="bloc-imprimer">
      <strong>À imprimer pour la classe</strong>
      <p class="sous">Les papiers de Défi tables, sur mathsgo.re (nouvel onglet). La fiche de suivi
      d’un élève, remplie : ouvre son parcours (touche sa ligne), puis « Imprimer sa fiche ».</p>
      <ul class="liens-imprimer">
        <li><a href="https://mathsgo.re/outils/calcul_mental/fiche_parcours_tables.pdf" target="_blank" rel="noopener">Fiche « Mon parcours des tables » vierge</a> — à remplir à la main, une page.</li>
        <li><a href="https://mathsgo.re/outils/calcul_mental/fiche_tables_multiplication.pdf" target="_blank" rel="noopener">Les tables de 2 à 10 sur une page</a> — à coller dans le cahier.</li>
        <li>Cartes recto verso à découper, une table par PDF :
          <span class="cartes-tables"><?php foreach (range(2, 10) as $table): ?><a href="https://mathsgo.re/outils/calcul_mental/cartes_table_<?= $table ?>.pdf" target="_blank" rel="noopener">table de <?= $table ?></a><?php endforeach; ?><a href="https://mathsgo.re/outils/calcul_mental/cartes_tables.pdf" target="_blank" rel="noopener">toutes les tables</a></span></li>
      </ul>
    </div>

    </div><!-- /vue-appli -->

    <!-- Lot « Ma classe : élèves » (18/10/2026, choix de Gwenaël du 17/10) :
         les prénoms, les codes et les papiers de la classe, au même endroit —
         propriétaire et collègues en écriture (un collègue « voir seulement »
         ne reçoit pas les codes du serveur et n'a pas l'onglet). Avant, les
         codes étaient dans chaque tableau d'appli : Ma classe ouverte avec le
         vidéoprojecteur allumé les montrait à toute la classe. La liste suit
         l'ordre et les numéros de la feuille prénom ↔ code (ordreDeLaFeuille). -->
    <div id="vue-eleves" hidden>
      <div class="barre-outils">
        <button type="button" class="secondaire" id="ajouter">Ajouter des élèves</button>
        <button type="button" class="secondaire" id="coller-prenoms">Coller la liste des prénoms</button>
        <button type="button" class="secondaire" id="imprimer-bandelettes" title="À découper et à distribuer : une par élève, avec son prénom et son code">Imprimer les bandelettes</button>
        <button type="button" class="secondaire" id="imprimer-recap" title="À garder : la liste de toute la classe, avec les prénoms et les codes">Imprimer la feuille prénom&nbsp;↔&nbsp;code</button>
      </div>
      <!-- Le message des boutons ci-dessus (ajout, collage, nouveau code) :
           juste sous eux, pas sous une liste de trente lignes. -->
      <p class="message" id="message-classe" hidden></p>
      <div id="liste-eleves">
        <p class="sous note-eleves">Mêmes numéros que sur la feuille prénom ↔ code et les bandelettes.</p>
        <div class="tableau-enveloppe">
          <table id="tableau-eleves">
            <thead><tr><th title="Le numéro de la feuille prénom ↔ code et des bandelettes">N°</th><th>Élève</th><th>Code</th><th></th></tr></thead>
            <tbody id="corps-eleves"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Lot « Ma classe : réglages » (17/10/2026) : tout ce qui règle la
         classe elle-même, au même endroit — propriétaire seulement (le
         serveur exige le propriétaire pour classes.modifier, partages.* et
         classes.supprimer). Avant, ces blocs étaient en bas de chaque onglet,
         sous le tableau. -->
    <div class="reglages" id="vue-reglages" hidden>
      <!-- Serveur pro, lot 5b : les activités ont quitté les Réglages — chaque
           appli se règle dans son onglet (« Régler … »). -->
      <p class="sous note-regler">Les applis de la classe se règlent dans leur onglet : « Régler Défi tables », « Régler SPLAT! »…</p>

      <!-- Lot B2 « Ta liste dans Ma classe » (21/11/2026, planches B2-1 et
           B2-2) : ce que le grand bouton de Mon espace propose aujourd'hui.
           Automatique (le lot B1) ou sa liste, dans l'ordre. Rien n'est
           envoyé avant « Enregistrer » ; propriétaire seulement, comme le
           reste des Réglages. Dessinée par poserJourClasse (textContent). -->
      <div id="bloc-jour">
        <h2>Aujourd’hui, dans Mon espace</h2>
        <div class="carte carte-jour">
          <p class="jour-intro">Le grand bouton en haut de l’espace des élèves. Il propose la première étape pas encore faite aujourd’hui, puis la suivante. Toutes les applis restent ouvertes.</p>
          <div class="jour-modes" role="radiogroup" aria-label="Le grand bouton de Mon espace">
            <label><input type="radio" name="jour-mode" id="jour-auto" value="auto"><span><b>Automatique :</b> <span id="jour-auto-texte"></span></span></label>
            <label><input type="radio" name="jour-mode" id="jour-liste" value="liste"><b>Ma liste, dans l’ordre</b></label>
            <div class="jour-etapes" id="jour-etapes" hidden>
              <label for="jour-1">D’abord</label><select id="jour-1"></select>
              <label for="jour-2">Puis</label><select id="jour-2"></select>
              <label for="jour-3">Puis</label><select id="jour-3"></select>
            </div>
            <!-- Lot B3 (21/11/2026, choix de Gwenaël, planche B3-6) : « Aucun »
                 — pas de bloc « Aujourd'hui » pour cette classe. Troisième
                 choix du même groupe, sous la liste : ses étapes restent
                 collées à « Ma liste ». -->
            <label><input type="radio" name="jour-mode" id="jour-aucun" value="aucun"><span><b>Aucun :</b> pas de grand bouton, les élèves choisissent.</span></label>
          </div>
          <p class="jour-apercu" id="jour-apercu"></p>
          <div class="actions">
            <button type="button" id="jour-enregistrer">Enregistrer</button>
          </div>
          <p class="message" id="message-jour" hidden></p>
        </div>
      </div>

      <!-- Partage : trois lignes, avec les mots des boutons (« Voir seulement »,
           « Voir et modifier »). La question posée avant de passer un collègue
           en écriture dit le reste (texteConfirmationPartage). -->
      <div id="bloc-partage">
        <h2>Partager cette classe</h2>
        <div class="carte">
          <ul class="legende-partage">
            <li><b>Voir seulement</b> : le tableau, sans les codes des élèves.</li>
            <li><b>Voir et modifier</b> : aussi l’onglet Élèves, avec les codes — avec un code, on entre dans l’appli comme l’élève et on peut changer sa progression. Il gère les élèves (ajout, prénoms, nouveau code, version précédente) et lance séances et évaluations.</li>
            <li><b>Toi seul</b> : supprimer un élève, renommer ou supprimer la classe.</li>
          </ul>
          <ul class="profs" id="liste-partages"></ul>
          <div class="actions">
            <button type="button" class="secondaire" id="ajouter-partage">Partager avec un collègue</button>
          </div>
          <p class="message" id="message-partage" hidden></p>
        </div>
      </div>

      <!-- Renommer la classe : le serveur le permettait (classes.modifier,
           propriétaire, 40 caractères), la page n'avait pas de bouton. -->
      <h2>Nom de la classe</h2>
      <div class="carte">
        <form class="ligne-nom" id="form-nom-classe">
          <input id="nom-classe" type="text" maxlength="40" aria-label="Nom de la classe" required>
          <button type="submit" class="secondaire" id="renommer-classe">Renommer</button>
        </form>
        <p class="message" id="message-nom" hidden></p>
      </div>

      <!-- Supprimer la classe : hors de la barre de tous les jours. La
           question, avec le bilan de l'année, ne change pas. -->
      <h2>Supprimer la classe</h2>
      <div class="carte danger-zone">
        <p>Les élèves, leurs codes et tout leur travail sont effacés. On ne peut pas revenir en arrière.</p>
        <button type="button" class="danger" id="supprimer-classe">Supprimer la classe</button>
        <p class="message" id="message-supprimer" hidden></p>
      </div>
    </div>

    <!-- Ce qui sort de l'imprimante (lot 7).

         1. LES BANDELETTES, à découper et à distribuer, une par élève et
            d'un seul tenant : son numéro, son prénom, l'adresse, son code et
            la consigne. Le prénom évite qu'elles s'échangent à la
            distribution ; il n'apprend rien à qui trouverait la bandelette
            et taperait le code — l'espace élève affiche de toute façon le
            prénom et la classe. Une bandelette perdue se règle par « Nouveau
            code » (menu ⋯ de l'onglet Élèves).
         2. LA FEUILLE PRÉNOM ↔ CODE, imprimée à part : la liste de toute la
            classe, prénoms et codes. Elle est faite pour rester dans le
            classeur du professeur, et elle le dit en haut. (Depuis la
            bandelette d'un seul tenant, 21/10/2026, ce n'est plus le SEUL
            papier qui associe un prénom à un code : lot « textes justes »,
            24/10/2026.) -->
    <div class="bandelettes" id="bandelettes">
      <h2 id="bandelettes-titre"></h2>
      <p class="avertissement-papier" id="bandelettes-consigne"></p>
      <ul class="bandelettes-liste" id="bandelettes-liste"></ul>
      <div class="pied-impression">
        <img src="../mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
      </div>
    </div>

    <div class="fiche" id="fiche">
      <h2 id="fiche-titre"></h2>
      <p class="avertissement-papier">Feuille à garder : la liste de toute la classe, prénoms et codes.
      Ne la laisse pas sur l’imprimante ni sur ton bureau ; jette-la à la déchiqueteuse
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

    <!-- Lot « Qui voit quoi », lot 4b (24/10/2026) : « Imprimer » du parcours
         Anzan d'un élève. Remplie au moment d'imprimer, vidée après : jamais de
         code, rien d'autre que ce que montre la fenêtre. -->
    <div class="fiche-anzan" id="fiche-anzan">
      <h2 id="fa-titre"></h2>
      <p class="fa-compte" id="fa-compte"></p>
      <p class="fa-compte" id="fa-grade"></p>
      <table>
        <thead><tr><th>Jour</th><th>Séance</th><th>Réglages</th><th>Réussis</th></tr></thead>
        <tbody id="fa-corps"></tbody>
      </table>
      <p class="fa-note" id="fa-note"></p>
      <div class="fa-pied">
        <img src="../mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
        <span></span>
      </div>
    </div>

    <!-- Ctrl+P sans passer par un bouton : on n'imprime pas les codes par
         surprise, on explique quel bouton appuyer. -->
    <div class="note-impression">
      <h2>Que veux-tu imprimer ?</h2>
      <p>Reviens à la page et choisis un bouton. Onglet Élèves : <strong>« Imprimer les bandelettes »</strong>
      (une par élève, à découper et à distribuer) ou <strong>« Imprimer la feuille prénom ↔ code »</strong>
      (celle que tu gardes). Onglet Anzan ou Défi calcul : touche la ligne d’un élève, puis
      <strong>« Imprimer »</strong> dans sa fenêtre ; Défi calcul a aussi <strong>« Imprimer la grille »</strong>
      au-dessus du tableau. Chaque bouton n’imprime que sa feuille.</p>
      <div class="pied-impression">
        <img src="../mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
      </div>
    </div>

    <!-- Défi calcul (lot 2b, 31/10/2026) : la fiche d'un élève (« Imprimer sa
         fiche » dans sa fenêtre) et la grille de la classe (« Imprimer la
         grille » au-dessus du tableau). Remplies au moment d'imprimer, vidées
         après ; noir et blanc, aucun code. -->
    <div class="fiche-defi-calcul" id="fiche-defi-calcul">
      <h2 id="fd-titre"></h2>
      <p class="fd-sous" id="fd-sous"></p>
      <div id="fd-corps"></div>
      <div class="fd-pied">
        <img src="../mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
        <span></span>
      </div>
    </div>
    <div class="grille-defi-calcul" id="grille-defi-calcul">
      <h2 id="gd-titre"></h2>
      <p class="fd-sous" id="gd-sous"></p>
      <div id="gd-corps"></div>
      <div class="fd-pied">
        <img src="../mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
        <span></span>
      </div>
    </div>

  </section>

  <!-- Mon compte : changer son mot de passe. Avec un mot de passe temporaire
       (donné par l'administrateur), c'est le seul écran possible tant qu'un
       nouveau n'a pas été choisi — le serveur refuse tout le reste.
       Lot 5d : « ‹ Ma classe » ramène à la classe ouverte, et Professeurs
       (administrateur seulement) est ici, sous le mot de passe : ce sont des
       réglages du compte, pas ceux d'une classe. -->
  <section id="ecran-compte" hidden>
    <button type="button" class="secondaire retour-icone" id="retour-compte"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Ma classe</button>
    <h1>Mon compte</h1>
    <p class="sous" id="compte-qui"></p>
    <p class="message info" id="bandeau-temporaire" hidden>Ton mot de passe est temporaire : choisis-en un nouveau
    pour continuer. Il doit faire 12 à 72 caractères.</p>
    <h2>Mon mot de passe</h2>
    <div class="carte carte-compte">
      <form id="form-motdepasse" autocomplete="on">
        <label for="mdp-ancien">Mot de passe actuel</label>
        <input id="mdp-ancien" name="password" type="password" autocomplete="current-password" required>
        <label for="mdp-nouveau">Nouveau mot de passe (12 à 72 caractères)</label>
        <input id="mdp-nouveau" name="new-password" type="password" autocomplete="new-password" minlength="12" required>
        <label for="mdp-confirme">Nouveau mot de passe, une deuxième fois</label>
        <input id="mdp-confirme" name="confirm-password" type="password" autocomplete="new-password" minlength="12" required>
        <div class="actions"><button type="submit">Changer mon mot de passe</button></div>
      </form>
      <p class="message" id="message-compte" hidden></p>
    </div>
    <p class="sous" style="margin-top:14px">Après le changement, tes autres appareils seront déconnectés ; celui-ci reste connecté.</p>

    <!-- Visible seulement pour le compte administrateur (le serveur revérifie).
         Lot 5d : une ligne par professeur, ses gestes derrière « ⋯ » (comme
         l'onglet Élèves) — avant, trois boutons de 44 px par collègue, dont
         deux rouges, qui passaient à la ligne. -->
    <div id="bloc-profs" hidden>
      <h2>Professeurs</h2>
      <div class="carte carte-compte">
        <p class="sous" style="margin-bottom:12px">Chaque professeur ne voit que ses propres classes.
        Pour qu’un collègue voie une de tes classes : ouvre-la, puis Réglages, « Partager cette classe ».</p>
        <ul class="profs comptes" id="liste-profs"></ul>
        <div class="actions">
          <button type="button" class="secondaire" id="ajouter-prof">Ajouter un professeur</button>
        </div>
        <p class="message" id="message-profs" hidden></p>
      </div>
    </div>
  </section>
</main>

<footer class="pied">
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

<!-- Lot E1 : la boîte d'un modèle d'évaluation (nouveau, ou à modifier). -->
<dialog id="eval-modele" class="eval-dialog">
  <h2 id="em-titre">Nouveau modèle</h2>
  <label for="em-nom">Nom</label>
  <input type="text" id="em-nom" maxlength="40" autocomplete="off">
  <label>Tables</label>
  <div class="cases" id="em-tables" role="group" aria-label="Tables"></div>
  <label>Questions</label>
  <div class="cases" id="em-types" role="group" aria-label="Types de question"></div>
  <div class="deux">
    <div>
      <label for="em-n">Nombre de questions</label>
      <select id="em-n"><option>10</option><option>15</option><option selected>20</option><option>25</option><option>30</option></select>
      <label>Chrono</label>
      <div class="radios">
        <label><input type="radio" name="em-chrono" value="question" checked> par question : <input type="number" id="em-secondes" min="3" max="60" value="8"> s</label>
        <label><input type="radio" name="em-chrono" value="global"> en tout : <input type="number" id="em-minutes" min="1" max="30" value="3"> min</label>
        <label><input type="radio" name="em-chrono" value="sans"> sans chrono</label>
      </div>
    </div>
    <div>
      <label>Tirage</label>
      <div class="radios">
        <label><input type="radio" name="em-tirage" value="memes" checked> mêmes calculs, ordre différent par élève</label>
        <label><input type="radio" name="em-tirage" value="identique"> identique pour tous</label>
        <label><input type="radio" name="em-tirage" value="differents"> tous différents</label>
      </div>
    </div>
  </div>
  <details class="eval-calculs" id="em-calculs">
    <summary>Calculs à exclure ou imposer</summary>
    <p>Un clic : <b>exclu</b> (ne sort jamais) · deux clics : <b>imposé</b> (sort une fois) · trois : normal.</p>
    <div id="em-grille"></div>
  </details>
  <p class="message erreur" id="em-message" hidden></p>
  <div class="actions">
    <button type="button" id="em-enregistrer">Enregistrer</button>
    <button type="button" class="secondaire" id="em-annuler">Annuler</button>
    <button type="button" class="danger" id="em-supprimer" style="margin-left:auto" hidden>Supprimer ce modèle</button>
  </div>
</dialog>

<!-- Serveur pro, lot 5b : « Régler Défi tables » (planches 2 et 3 de l'étape 4,
     maquettes « Régler SPLAT! » et « Régler Coffres » du 30/10/2026).
     Propriétaire seulement. Le contenu est construit par dessinerRegler
     (createElement et textContent : un prénom n'est jamais du HTML) ; rien
     n'est envoyé avant « Enregistrer ». Elle remplace « Ce que voit Léa » et
     les cases de Réglages › Activités. -->
<dialog id="regler" class="fenetre regler" aria-labelledby="regler-titre">
  <div class="fenetre-tete">
    <div class="naviguer"><button type="button" class="secondaire" id="regler-croix" aria-label="Fermer sans enregistrer" title="Fermer sans enregistrer">✕</button></div>
    <h2 id="regler-titre"></h2>
    <p id="regler-sous"></p>
  </div>
  <div class="fenetre-corps" id="regler-corps"></div>
  <div class="fenetre-pied">
    <p class="message" id="regler-message" role="status" hidden></p>
    <button type="button" class="secondaire" id="regler-annuler">Annuler</button>
    <button type="button" id="regler-enregistrer">Enregistrer</button>
  </div>
</dialog>

<!-- Serveur pro, lot 5c (choix de Gwenaël, maquette 8 du 25/10/2026) : UNE
     fenêtre pour voir un élève, la même dans les quatre applis. On touche sa
     ligne du tableau ; ‹ › passent au précédent, au suivant, dans l'ordre du
     tableau à l'écran (tri et recherche compris). Lecture seule : tout est lu
     dans le tableau déjà chargé, par le moteur de l'appli, et posé par
     createElement et textContent. Elle remplace « Parcours » (Défi tables,
     qui garde « Voir son parcours » dans un nouvel onglet), « Détail ▾ »
     (SPLAT!, Coffres) et la fenêtre « Le parcours de… » d'Anzan.
     Serveur pro, lot 5f (retours de Gwenaël des 25, 26 et 28/10/2026) :
     dans Défi tables, la fenêtre répétait la ligne ; elle montre maintenant
     son écran Mon parcours lui-même (mathsgo.re, dans un cadre, par le
     billet de lecture d'avant), en grand, au téléphone comme à l'ordinateur.
     ‹ › passent au suivant sans ouvrir d'onglet, ✕ ferme. « Revenir à… » est
     retourné dans le « ⋯ » de la ligne. -->
<!-- Lot S4b « des chiffres aux élèves » (08/11/2026) : la liste des prénoms
     d'un « 5 élèves » (calculs qui coincent, À reprendre en classe) ou d'un
     « Et 12 autres » (À aider, À féliciter, avec leurs raisons), posée
     PAR-DESSUS la page sous ce qu'on a touché. Un prénom ouvre la fiche ; la
     fiche fermée, la liste est toujours là. Remplie par textContent. -->
<div class="pop-eleves" id="pop-eleves" hidden></div>
<dialog id="fenetre-eleve" class="fenetre fenetre-eleve" aria-labelledby="fe-titre">
  <div class="fenetre-tete">
    <div class="naviguer">
      <button type="button" class="secondaire" id="fe-precedent" aria-label="Élève précédent" title="Élève précédent">‹</button>
      <button type="button" class="secondaire" id="fe-suivant" aria-label="Élève suivant" title="Élève suivant">›</button>
      <button type="button" class="secondaire" id="fe-croix" aria-label="Fermer" title="Fermer">✕</button>
    </div>
    <h2 id="fe-titre"></h2>
    <p id="fe-sous"></p>
    <!-- Lot S2 : la fiche de l'élève, la même depuis n'importe quel onglet —
         « Vue d'ensemble », puis un onglet par appli (planche 2). -->
    <button type="button" class="lien-onglet" id="fe-parcours" title="Son écran Mon parcours dans un nouvel onglet — pour imprimer sa fiche, par exemple" hidden>Ouvrir dans un onglet</button>
    <div class="onglets fe-onglets" id="fe-onglets" role="tablist" aria-label="La fiche"></div>
  </div>
  <div class="fenetre-corps" id="fe-corps">
    <!-- Correctif des lots 5 (point 5) : un parcours refusé se lit ici, pas
         derrière la fenêtre ; lot 5f : au-dessus du cadre du parcours. -->
    <p class="message" id="fe-message" hidden></p>
    <div id="fe-contenu"></div>
    <!-- Anzan : ses dernières séances (l'écran « Mon historique » de l'élève). -->
    <div id="fe-anzan" hidden>
      <p class="pa-compte" id="pa-compte"></p>
      <p class="pa-grade" id="pa-grade" hidden></p>
      <!-- Lot S4c : ses séances par mode — Toutes, Flash, Colonne, Grades. -->
      <div class="dc-paliers-choix pa-filtres" id="pa-filtres" role="group" aria-label="Ses séances" hidden></div>
      <ol class="pa-liste" id="pa-liste" aria-label="Ses dernières séances"></ol>
      <p class="pa-note" id="pa-note"></p>
      <button type="button" class="secondaire pa-plus" id="pa-plus" hidden>Voir les séances précédentes</button>
    </div>
  </div>
  <div class="fenetre-pied">
    <button type="button" class="secondaire" id="fe-fermer">Fermer</button>
    <button type="button" id="pa-imprimer" hidden>Imprimer ces séances</button>
    <button type="button" id="dc-imprimer" hidden>Imprimer sa fiche</button>
  </div>
</dialog>

<!-- Lot E1 : « Ouvrir pour la classe » — la durée, et c'est tout. -->
<dialog id="eval-ouvrir">
  <h2 id="eo-titre" style="margin:0 0 6px"></h2>
  <p class="sous" id="eo-texte" style="margin:0 0 6px"></p>
  <div class="cases" id="eo-durees" role="group" aria-label="Durée d’ouverture"></div>
  <div class="actions">
    <button type="button" id="eo-ouvrir">Ouvrir</button>
    <button type="button" class="secondaire" id="eo-annuler">Annuler</button>
  </div>
</dialog>

<!-- Le moteur de « Mon parcours » du site, servi d'ICI (copie octet pour octet de
     outils/calcul_mental/defi_tables_mon_parcours.js, gardée identique par un test du
     dépôt) : un script chargé d'un autre domaine s'exécuterait avec les droits de la
     session du professeur, la politique de contenu ne l'autorise plus. -->
<script type="application/json" id="cours-catalogue" nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>"><?= $coursCatalogue ?: '[]' ?></script>
<script src="defi_tables_core.js?v=<?= htmlspecialchars($versionCore, ENT_QUOTES) ?>"></script>
<script src="defi_tables_mon_parcours.js?v=<?= htmlspecialchars($versionMoteur, ENT_QUOTES) ?>"></script>
<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const PARCOURS = window.MATHSGO_DEFI_TABLES_MON_PARCOURS || null;
  // Lot E1 : le noyau de Défi tables, pour le tirage et la correction des évaluations.
  const CORE = window.MATHSGO_DEFI_TABLES_CORE || null;
  const CLE_JETON = "mathsgo-suivi-jeton";
  // Un mot à dire après le rechargement de la page : la déconnexion recharge,
  // et un message écrit avant serait emporté. Il vit le temps d'un onglet.
  const CLE_AVIS = "mathsgo-suivi-avis";
  // L'instant du dernier geste, rangé à côté du jeton (lot serveur B,
  // constat 7). Il survit au rechargement de la page comme le jeton, et pour
  // la même raison : sans lui, le verrou d'inactivité repartait de zéro à
  // chaque F5 et ne fermait donc jamais rien sur un poste partagé.
  const CLE_GESTE = "mathsgo-suivi-prof-dernier-geste";
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
  // Lot 5e : la séance en direct est réservée à l'administrateur pour
  // l'instant — c'est le serveur qui le dit (« moi », lib/direct.php) et qui
  // refuse ; la page ne fait que cacher le bouton.
  let directPermis = false;
  let mdpTemporaire = false;
  let identifiant = "";
  let droitClasse = "proprietaire";
  let annuaire = [];
  // Lot E1 « les évaluations en classe » : l'état de la carte « Évaluations ».
  let modeles = null;        // les modèles du professeur connecté, lus une fois
  let evaluation = null;     // l'état de l'évaluation de la classe ouverte, ou null
  let evalEclair = false;    // une question éclair occupe la classe
  let evalMinuteur = 0;
  let evalContenu = null;    // {cle, contenu, copies} : l'évaluation fermée, corrigée (une lecture par fermeture)
  let evalModele = null;     // le modèle dans la boîte : {id, nom, exclus: Set, imposes: Set}
  let evalDuree = 3600;
  let evalAOuvrir = null;
  // Les classes de l'année écoulée que le serveur propose de supprimer.
  let echues = [];

  // Lot « splat-suivi-4 » (08/10/2026) — « Ma classe » montre une activité à
  // la fois. Les activités que la page sait montrer, dans l'ordre du catalogue
  // (lib/applis.php) ; un test vérifie que chacune y est disponible et que
  // l'API la propose. `unite` : ce que compte « Revenir à… » (le compteur de
  // l'activité au catalogue).
  const APPLIS = [
    {cle: "defi-tables", nom: "Défi tables", unite: ["calcul", "calculs"]},
    // Coffres magiques (21/10/2026) : le serveur ne sait compter que des
    // entrées — ici les niveaux commencés (1 à 3).
    {cle: "coffres", nom: "Coffres magiques", unite: ["niveau commencé", "niveaux commencés"]},
    // Anzan (lot « Qui voit quoi », lot 4b, 24/10/2026) : après Coffres,
    // comme au catalogue. Le serveur compte les séances (son compteur).
    {cle: "flash-anzan", nom: "Anzan", unite: ["séance", "séances"]},
    // Défi calcul (lot 2b, 31/10/2026) : après Anzan, comme au catalogue. Le
    // serveur compte les séances finies (son compteur).
    {cle: "defi-calcul", nom: "Défi calcul", unite: ["séance", "séances"]},
    {cle: "splat", nom: "SPLAT!", unite: ["étape", "étapes"]},
    // L'appli Cours (lot « cours-appli », 08/11/2026) : un onglet comme les
    // autres, mais SANS SUIVI — aucune progression, rien dans « La classe »,
    // le bilan ou la fiche d'un élève (sansSuivi). Son onglet montre ce que
    // voient les élèves ; « Régler les cours » ouvre chapitres et fiches.
    {cle: "cours", nom: "Cours", unite: ["fiche", "fiches"], sansSuivi: true}
  ];
  // Le dernier choix, retenu le temps de l'onglet.
  const CLE_APPLI = "mathsgo-suivi-prof-appli";
  // Le moteur de SPLAT!, servi d'ici (copie du dépôt, lot 3), chargé à la
  // première ouverture de l'onglet SPLAT! : 60 ko qu'une classe sans SPLAT!
  // n'a pas à télécharger. Sa version dans l'adresse suit son contenu.
  const MOTEUR_SPLAT = "splat-parcours.js?v=<?= htmlspecialchars($versionSplat, ENT_QUOTES) ?>";
  // Le moteur de Coffres magiques, de même (lot « Coffres magiques sur le
  // suivi », 21/10/2026) : chargé à la première ouverture de son onglet.
  const MOTEUR_COFFRES = "coffres-parcours.js?v=<?= htmlspecialchars($versionCoffres, ENT_QUOTES) ?>";
  // Le moteur d'Anzan, de même (lot 4b) : chargé à la première ouverture de
  // son onglet.
  const MOTEUR_ANZAN = "flash_anzan_parcours.js?v=<?= htmlspecialchars($versionAnzan, ENT_QUOTES) ?>";
  // Les deux moteurs de Défi calcul (lot 2b) : le noyau d'abord (la carte,
  // les noms, les erreurs connues), puis la progression ; chargés à la
  // première ouverture de l'onglet Défi calcul.
  const MOTEUR_CALCUL_CORE = "defi_calcul_core.js?v=<?= htmlspecialchars($versionCalculCore, ENT_QUOTES) ?>";
  const MOTEUR_CALCUL = "defi_calcul_mon_parcours.js?v=<?= htmlspecialchars($versionCalcul, ENT_QUOTES) ?>";
  // Les tris de chaque activité : ceux de Défi tables sont lus dans la page.
  // Les colonnes qui trient, par appli : celles dont le titre est un bouton
  // (serveur pro, lot 5c : plus de menu « Trier par »). Coffres : « Trésors »
  // (le total, colonne du téléphone) et chaque niveau ; Anzan : les jours.
  const TRIS = {
    "defi-tables": ["prenom", "acquises", "encours", "semaine", "retard", "date"],
    "coffres": ["prenom", "tresors", "niveau1", "niveau2", "niveau3", "date",
      // Lot S4c : « Cette semaine ».
      "s-tresors", "s-parfaits", "s-aides", "s-solutions", "s-jours"],
    "flash-anzan": ["prenom", "flash", "colonne", "jours", "date"],
    // Défi calcul (lot 2b) : les compétences sues, ce qui est à revoir, les
    // séances des 4 dernières semaines, le dernier jour.
    // Lot 4 : la ceinture (la ceinture portée, puis ses barrettes).
    // Lot K2 : « Étoiles » (les étoiles gagnées), « À surveiller ».
    "defi-calcul": ["prenom", "ceinture", "etoiles", "surveiller", "seances", "date"],
    "splat": ["prenom", "etapes", "date"],
    "cours": ["prenom"]
  };
  let SPLAT = window.MathsGoSplatParcours || null;
  let chargementSplat = null;
  let COFFRES = window.MathsGoCoffresParcours || null;
  let chargementCoffres = null;
  let ANZAN = window.MathsGoFlashAnzanParcours || null;
  let chargementAnzan = null;
  // Défi calcul (lot 2b) : le noyau et le moteur de progression, et la carte
  // que rend le noyau (les modules, leurs paliers, l'ordre du parcours).
  let CALCUL_CORE = window.MATHSGO_DEFI_CALCUL_CORE || null;
  let CALCUL = window.MATHSGO_DEFI_CALCUL_MON_PARCOURS || null;
  let chargementCalcul = null;
  // Lot 4b : l'élève dont « Le parcours de… » (Anzan) est ouvert, et combien
  // de séances on y montre (10, puis 10 de plus à chaque « Voir les séances
  // précédentes », comme l'écran « Mon historique » de l'élève).
  let parcoursAnzanEleve = null;
  let parcoursAnzanAffiches = 10;
  // Lot S4c : le mode montré dans la fiche Anzan (null : toutes).
  let parcoursAnzanFiltre = null;
  let appliAffichee = "defi-tables";
  // La vue sous les onglets : "appli" (le tableau de l'activité), "eleves"
  // (lot « Ma classe : élèves », 18/10/2026 : propriétaire et collègues en
  // écriture) ou "reglages" (lot « Ma classe : réglages », 17/10/2026 :
  // propriétaire seulement).
  let vue = "appli";
  // Serveur pro, lot 5b : chaque envoi de « Régler … » a un délai, passé
  // lequel la fenêtre dit que le serveur n'a pas répondu (lot 3c).
  const DELAI_ACCES_MS = 15000;
  // Les élèves déjà lus de la classe ouverte, par activité (un appel
  // « tableau » par activité, refait seulement quand la classe change).
  let tableaux = {};
  // Les élèves dont le Détail SPLAT! est déplié.
  // Serveur pro, lot 5c : le prénom cherché au-dessus du tableau ; l'élève
  // montré dans la fenêtre ; l'ordre des élèves du tableau à l'écran (tri et
  // recherche compris), que ‹ › suivent.
  let recherche = "";
  let fenetreEleveId = null;
  // Lot 5f : le numéro de la dernière demande de parcours (Défi tables) —
  // une réponse arrivée après un ‹ ›, un ✕ ou un autre élève est oubliée.
  let demandeParcours = 0;
  let idsAffiches = [];
  let demandeAppli = 0;
  // Correctif des lots 5 (relecture Codex du 25/10/2026, point 1) : le numéro
  // de la session de la page. « Se déconnecter » (oublierEtat) l'avance : une
  // réponse demandée avant (la liste des classes, celle des professeurs, « moi »)
  // n'est plus posée dans la page — même si elle arrive après, réseau lent.
  let generation = 0;
  let demandeProfs = 0;
  // L'année scolaire en cours, dite par classes.liste (« annee_courante ») :
  // c'est elle, avec l'année de chaque classe, qui dit « de cette année »
  // (point 9) — pas la liste « echues », qui ne compte que les vieilles
  // classes mûres pour le ménage.
  let anneeCourante = "";
  // Arrivé par « #classe=… » avec un mot de passe temporaire : la classe du
  // lien, gardée le temps du changement obligatoire (point 10).
  let classeApresMotDePasse = 0;

  try { jeton = sessionStorage.getItem(CLE_JETON) || ""; } catch (_) {}

  // ------------------------------------------------------- verrou d'inactivité
  //
  // Sur un poste de salle des profs, l'onglet reste ouvert entre deux cours :
  // F5, retour arrière, onglet minimisé rouvert trois heures plus tard, on
  // retombait sur « Mes classes » sans rien taper. On mesure le TEMPS ÉCOULÉ
  // (l'horloge), pas un minuteur : une machine mise en veille n'avance pas ses
  // setTimeout, mais l'heure, elle, avance quand même.
  //
  // Lot serveur B (06/09/2026), constat 7 de l'audit du 05/09 : le verrou
  // NE SURVIVAIT PAS AU F5. `demarrer(Date.now())` était rejoué à chaque
  // démarrage de la page, donc un rechargement — ou un onglet rouvert le
  // lendemain matin — remettait le compteur à zéro et rendait « Mes classes »
  // à qui appuyait sur F5, pendant les quatre heures de la session serveur.
  // L'instant du dernier geste est donc rangé où le jeton l'est déjà : dans le
  // sessionStorage de l'onglet. `reprendre()` le relit au lieu de repartir de
  // l'horloge, et la page se déconnecte AVANT de montrer quoi que ce soit.
  //
  // `lire` et `ecrire` sont passés de l'extérieur : le test du dépôt joue la
  // fonction avec un rangement de poche, sans navigateur.
  function creerVeille(delaiMs, lire, ecrire) {
    let dernier = 0;
    const ranger = valeur => { if (ecrire) ecrire(valeur); };
    return {
      geste(maintenant) { if (dernier > 0) { dernier = maintenant; ranger(maintenant); } },
      demarrer(maintenant) { dernier = maintenant; ranger(maintenant); },
      // Au démarrage de la page : l'absence se mesure depuis le dernier geste
      // RANGÉ, pas depuis maintenant. Sans valeur rangée (premier passage,
      // onglet neuf), on repart de maintenant.
      reprendre(maintenant) {
        const range = lire ? lire() : 0;
        dernier = range > 0 ? range : maintenant;
        if (!(range > 0)) ranger(dernier);
        return dernier;
      },
      arreter() { dernier = 0; ranger(0); },
      active() { return dernier > 0; },
      doitFermer(maintenant) { return dernier > 0 && (maintenant - dernier) >= delaiMs; }
    };
  }
  const veille = creerVeille(
    INACTIVITE_MS,
    () => { try { return Number(sessionStorage.getItem(CLE_GESTE)) || 0; } catch (_) { return 0; } },
    valeur => {
      try {
        if (valeur > 0) sessionStorage.setItem(CLE_GESTE, String(valeur));
        else sessionStorage.removeItem(CLE_GESTE);
      } catch (_) {}
    }
  );

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

  // options.signal (lot 3c) : un AbortSignal pour borner l'attente — seul
  // eleves.acces s'en sert ; sans lui, rien ne change pour les autres appels.
  async function api(action, corps = {}, options = {}) {
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
      cache: "no-store",
      signal: options.signal
    });
    const donnees = await reponse.json().catch(() => null);
    if (!reponse.ok || !donnees || !donnees.ok) {
      const erreur = new Error((donnees && donnees.erreur) || "Le serveur ne répond pas.");
      erreur.statut = reponse.status;
      // Ce que le serveur a joint au refus (lot 3c : un 409 porte l'état vrai).
      erreur.donnees = donnees;
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

  // Le nom de l'écran, dans l'en-tête (serveur pro, lot 5a) : avant, il
  // disait « Ma classe » sur toutes les pages, connexion comprise.
  // Lot 5d : plus d'écran « Mes classes » ; à sa place, celui d'un professeur
  // qui n'a encore aucune classe.
  const TITRES_ECRANS = {"ecran-connexion": "Suivi des élèves", "ecran-premiere-classe": "Ma classe",
    "ecran-classe": "Ma classe", "ecran-compte": "Mon compte"};

  function montrer(ecran) {
    ["ecran-connexion", "ecran-premiere-classe", "ecran-classe", "ecran-compte"].forEach(id => { $(id).hidden = id !== ecran; });
    $("titre-page").textContent = TITRES_ECRANS[ecran] || "Suivi des élèves";
    fermerMenuClasses();
    fermerMenuApplis();
    // Lot E1 : hors de la classe, plus de lecture en boucle de l'évaluation.
    if (ecran !== "ecran-classe") arreterVeilleEvaluation();
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
  const ZONES_TEXTE = [
    // Lot B2, correctif (Codex, point 5) : la carte du jour de Mon espace
    // (ses listes, son aperçu, son texte automatique).
    "jour-1", "jour-2", "jour-3", "jour-apercu", "jour-auto-texte",
    "corps", "corps-eleves", "fiche-corps", "fiche-titre", "bandelettes-liste",
    "bandelettes-titre", "liste-profs", "liste-partages", "fragiles-liste",
    "fragiles-sous", "titre-classe", "resume-classe", "objectif-compte", "objectif-lignes",
    "qui", "compte-qui", "boite-texte", "menu-classes-liste", "titre-classe-colle", "nom-appli", "menu-applis-liste",
    "boite-champs", "secret-texte", "secret-valeur", "echues-texte", "supprimer-echues",
    // Lot E1 : la carte « Évaluations » et ses deux boîtes.
    "evaluations-zone", "em-titre", "em-tables", "em-types", "em-grille", "eo-titre", "eo-texte", "eo-durees",
    // Défi calcul (lot 2b) : la carte « À reprendre en classe » et les deux feuilles.
    "dc-reprendre-corps", "dc-aider-liste", "dc-aider-pied", "fd-titre", "fd-sous", "fd-corps", "gd-titre", "gd-sous", "gd-corps",
    // Serveur pro, lot 5b : la fenêtre « Régler … », la ligne « qui voit »
    // et la carte d’un onglet fermé (des prénoms, le nom de la classe).
    // (correctif, relecture Codex point 7 : le bouton « Ouvrir à toute la 405 »
    // et le mot « Régler SPLAT! » aussi — le nom de la classe restait dedans.)
    "regler-titre", "regler-sous", "regler-corps", "qui-voit-etat", "af-titre", "af-texte", "af-toute", "regler-appli-mot",
    // Lot 4b : Anzan — « En plus pour », ses séances et sa feuille.
    "pa-compte", "pa-liste", "pa-note", "fa-titre", "fa-compte", "fa-corps", "fa-note",
    // Lot 5c : la fenêtre de l’élève (un prénom).
    "fe-titre", "fe-sous", "fe-contenu",
    // Correctif des lots 5 : les records (des prénoms et des temps) — la
    // carte était cachée à la déconnexion, ses deux listes restaient.
    "records-semaine", "records-toujours",
    // Lot S2 : « La classe » (cartes et tableau), la fiche (ses onglets), et
    // les deux cartes de Défi calcul (des prénoms).
    "lc-aider-liste", "lc-aider-plus", "lc-feliciter-liste", "lc-feliciter-plus", "lc-entete", "lc-corps",
    "fe-onglets", "dc-grille", "dc-grille-legende", "dc-ouest-paliers", "dc-qui-barres", "dc-qui-texte", "dc-qui-peu",
    // Lot S4c : la carte « Par monde » de SPLAT!.
    "splat-mondes-liste", "splat-mondes-vues",
    // Lot S4b : la liste des prénoms (sous « 5 élèves »).
    "pop-eleves"];
  const ZONES_MESSAGE = ["erreur-connexion", "message-classes", "message-premiere-classe", "message-classe", "message-appli",
    "message-profs", "message-partage", "message-compte", "bandeau-droit", "bandeau-annee",
    "message-records", "message-evaluations", "em-message", "message-nom", "message-supprimer",
    "regler-message", "fe-message", "lc-message", "message-jour"];
  // Correctif des lots 5 (point 12) : le nom de la classe, dans ses Réglages.
  const CHAMPS_A_VIDER = ["identifiant", "motdepasse",
    "mdp-ancien", "mdp-nouveau", "mdp-confirme", "em-nom", "chercher-eleve", "nom-classe"];
  const BLOCS_A_CACHER = ["fiche", "bandelettes", "objectif", "fragiles", "bloc-profs",
    "bandeau-echues", "bloc-records", "bloc-evaluations", "vue-reglages", "onglet-reglages",
    "vue-eleves", "onglet-eleves", "menu-classes",
    // Lot S2 : la vue « La classe », les deux cartes de Défi calcul.
    "vue-classe", "dc-ouest", "dc-qui", "dc-aider", "pop-eleves",
    // Lot S4c : la carte « Par monde » de SPLAT!.
    "splat-mondes",
    // Serveur pro, lot 5b : la ligne « qui voit » et la carte d’un onglet grisé.
    "qui-voit", "appli-fermee"];

  function viderZones() {
    // Correctif B3 (Codex, point 13) : la carte « Aujourd'hui » aussi.
    viderCarteJour();
    ZONES_TEXTE.forEach(id => { const noeud = $(id); if (noeud) noeud.textContent = ""; });
    ZONES_MESSAGE.forEach(id => { const noeud = $(id); if (noeud) { noeud.textContent = ""; noeud.hidden = true; } });
    CHAMPS_A_VIDER.forEach(id => { const noeud = $(id); if (noeud) noeud.value = ""; });
    BLOCS_A_CACHER.forEach(id => { const noeud = $(id); if (noeud) noeud.hidden = true; });
    ["boite", "secret", "eval-modele", "eval-ouvrir", "regler", "fenetre-eleve"].forEach(id => {
      const boite = $(id);
      if (boite && boite.open) { try { boite.close(); } catch (_) {} }
    });
    // Lot 4b-bis : plus aucune feuille prête à sortir à l'imprimante.
    quitterImpressions();
    // Lot E1 : le plein écran de la répartition, s'il est ouvert — et celui
    // des records (correctif des lots 5).
    ["evaluation-plein", "records-plein"].forEach(id => {
      const plein = $(id);
      if (plein && plein.parentNode) plein.parentNode.removeChild(plein);
    });
  }

  // Correctif des lots 5 (relecture Codex du 25/10/2026, point 2) : ce que la
  // page garde d'UNE classe — ses prénoms, ses codes, ses tableaux, son nom,
  // ses fenêtres et ses feuilles prêtes à imprimer. Vidé dès que la classe
  // n'est plus là (supprimée, partage retiré), pas seulement à la
  // déconnexion : avant, après la dernière classe supprimée, « Crée ta
  // première classe » s'affichait mais les prénoms et les codes restaient
  // dans le document. Ce qui n'est pas à la classe reste : Professeurs, son
  // identifiant, le bandeau des classes de l'an dernier, la petite fenêtre.
  const ZONES_HORS_CLASSE = ["liste-profs", "qui", "compte-qui", "boite-texte", "boite-champs", "secret-texte",
    "secret-valeur", "echues-texte", "supprimer-echues"];
  const ZONES_DE_LA_CLASSE = ZONES_TEXTE.filter(id => !ZONES_HORS_CLASSE.includes(id));
  const MESSAGES_DE_LA_CLASSE = ["message-classe", "message-appli", "message-partage", "bandeau-droit",
    "message-records", "message-evaluations", "em-message", "message-nom", "message-supprimer",
    "regler-message", "fe-message", "lc-message", "message-jour"];

  function viderLaClasse() {
    // Lot B2 : le brouillon de la carte « Aujourd'hui, dans Mon espace » —
    // correctif B3 (Codex, point 13) : avec ses ronds et ses listes.
    viderCarteJour();
    ["eval-modele", "eval-ouvrir", "regler", "fenetre-eleve"].forEach(id => {
      const boite = $(id);
      if (boite && boite.open) { try { boite.close(); } catch (_) {} }
    });
    ZONES_DE_LA_CLASSE.forEach(id => { const noeud = $(id); if (noeud) noeud.textContent = ""; });
    MESSAGES_DE_LA_CLASSE.forEach(id => { const noeud = $(id); if (noeud) { noeud.textContent = ""; noeud.hidden = true; } });
    ["nom-classe", "chercher-eleve", "em-nom"].forEach(id => { const noeud = $(id); if (noeud) noeud.value = ""; });
    quitterImpressions();
    ["evaluation-plein", "records-plein"].forEach(id => {
      const plein = $(id);
      if (plein && plein.parentNode) plein.parentNode.removeChild(plein);
    });
  }

  function oublierEtat() {
    modeles = null;
    evaluation = null;
    evalContenu = null;
    arreterVeilleEvaluation();
    jeton = "";
    classes = [];
    classe = null;
    eleves = [];
    estAdmin = false;
    directPermis = false;
    mdpTemporaire = false;
    identifiant = "";
    droitClasse = "proprietaire";
    annuaire = [];
    echues = [];
    tri = {colonne: "prenom", sens: 1};
    appliAffichee = "defi-tables";
    vue = "appli";
    tableaux = {};
    recherche = "";
    fenetreEleveId = null;
    idsAffiches = [];
    lectureClasse = null;
    semaineClasse = 0;
    ongletFiche = "ensemble";
    reglage = null;
    reglageEnCours = false;
    jourBrouillon = null;
    parcoursAnzanEleve = null;
    anneeCourante = "";
    classeApresMotDePasse = 0;
    ligueRecords = null;
    // Lot 4b-bis (relecture Codex) : une classe ou un onglet encore en route
    // ne sera pas posé dans la page après la déconnexion.
    demandeAppli += 1;
    // Correctif des lots 5 (point 1) : ni une liste de classes, ni une liste de
    // professeurs, ni « moi » demandées avant.
    generation += 1;
    demandeProfs += 1;
    // Lot 5b : un « Enregistrer » encore en route ne touchera plus à rien
    // (il compare sa génération) ; reglageEnCours est remis à faux plus haut,
    // pour que « Régler … » s'ouvre tout de suite après une reconnexion.
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
    try { sessionStorage.removeItem(CLE_JETON); sessionStorage.removeItem(CLE_APPLI); } catch (_) {}
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

  // Correctif des lots 5 (relecture Codex, point 4) : le repli va dans l'écran
  // AFFICHÉ. Avant, toujours dans la connexion — cachée, elle aussi, quand
  // l'erreur arrivait sur Mon compte : la panne n'était lue par personne.
  const ZONE_DE_L_ECRAN = {"ecran-connexion": "erreur-connexion", "ecran-premiere-classe": "message-premiere-classe",
    "ecran-classe": "message-classes", "ecran-compte": "message-compte"};

  function zoneDeLEcranAffiche() {
    const ecran = Object.keys(ZONE_DE_L_ECRAN).find(id => $(id) && !$(id).hidden);
    return ecran ? ZONE_DE_L_ECRAN[ecran] : "erreur-connexion";
  }

  function surErreur(erreur, zone) {
    if (erreur.statut === 401) { deconnecter({message: "Session terminée, reconnecte-toi."}); return; }
    messager(zoneVisible(zone) ? zone : zoneDeLEcranAffiche(), erreur.message, "erreur");
  }

  // La raison d'une panne, dite au professeur : le message du serveur, ou —
  // le réseau coupé, sans réponse du tout — « Le serveur ne répond pas. »
  // (avant : « Failed to fetch », le texte anglais du navigateur).
  function raisonDe(erreur) {
    const texte = erreur && erreur.statut ? String(erreur.message || "") : "";
    return texte || "Le serveur ne répond pas.";
  }

  // ---------------------------------------------------------------- lecture d'une progression

  function lireProgression(brut) {
    const vide = {acquises: [], couronne: null,
                  semaine: 0, retard: null, parcours: null, lisible: Boolean(PARCOURS),
                  enCours: {type: "rien", texte: "—", ordre: 0, tables: [], pleines: 0, total: 10},
                  seances: 0, longue: null, semaines: null, ordreSemaines: -1e9};
    if (!PARCOURS || !brut) return vide;
    try {
      const parcours = PARCOURS.normaliserParcours(brut);
      const etat = PARCOURS.etatAffichage(parcours);
      // Lot 2b : « En cours », les séances de la semaine et la table qui
      // dure viennent du moteur (resumeProf), comme tout le reste.
      // (Un moteur d'avant le lot 2b, resté sur le serveur : la ligne se
      // lit quand même, sans ces trois colonnes.)
      const resume = PARCOURS.resumeProf ? PARCOURS.resumeProf(parcours) : {enCours: vide.enCours, seances: 0, longue: null};
      return {
        acquises: etat.acquises,
        // La couronne : pour l'info-bulle « Légende des tables » de « En cours ».
        couronne: etat.expert.couronne,
        // « N jours cette semaine », compté par le moteur (semaine du lundi,
        // heure de La Réunion) : le seul chiffre de temps de la page.
        semaine: etat.jours ? etat.jours.semaine : 0,
        // Lot mémoire (12/09/2026) : les calculs dus avant aujourd'hui et pas
        // encore refaits — l'élève n'a pas fait ses « calculs du jour ».
        retard: PARCOURS.calculsEnRetard ? PARCOURS.calculsEnRetard(parcours) : null,
        enCours: resume.enCours,
        seances: resume.seances,
        longue: resume.longue,
        // Lot 5g : les séances finies des 4 dernières semaines, et la clé de
        // leur tri (un moteur d'avant le lot 5g : rien, la case dit « — »).
        semaines: resume.semaines || null,
        ordreSemaines: Number.isFinite(resume.ordreSemaines) ? resume.ordreSemaines : -1e9,
        parcours,
        lisible: true
      };
    } catch (_) { return vide; }
  }

  // Lot « splat-suivi-4 » : la ligne SPLAT! d'un élève, lue par le moteur
  // (prof/splat-parcours.js) et par lui seul — la page ne touche jamais aux
  // étapes du parcours (un test y veille). Un élève sans parcours a ses six
  // mondes vides et « 0 / 37 » : resumeProf part d'un parcours vierge. Le total
  // est celui de la carte du moteur, jamais écrit ici.
  //
  // Lot « splat-suivi-5 » : quand la classe n'a pas tous ses mondes ouverts, les
  // comptes (étapes réussies, Bonus, séries en cours, carte de classe) ne portent
  // que sur les mondes ouverts — « 9 / 9 » quand les mondes 1 et 2 sont finis —
  // et les pastilles des mondes fermés sont grises. Le Détail, lui, garde tout le
  // travail de l'élève (les états de TOUTES les étapes).
  //
  // Lot « Qui voit quoi » (22/10/2026) : les mondes sont ceux de L'ÉLÈVE
  // (mondesDeLEleve : classe + ce qu'on lui a ouvert en plus) — un monde en
  // plus se montre en couleur et compte dans son « N / M ». `faitsClasse`
  // garde le compte sur les mondes de la CLASSE : c'est lui que la carte de
  // classe additionne (objectifSplat), son total restant celui de la classe.
  function lireSplat(brut, eleve) {
    const vide = {faits: 0, faitsClasse: 0, total: 0, bonus: 0, cours: 0, mondes: [], etats: {}, lisible: false};
    if (!SPLAT) return vide;
    try {
      const ouverts = mondesDeLEleve(eleve);
      const ouvert = numero => !ouverts || ouverts.includes(numero);
      const deLaClasse = mondesOuverts();
      const parLaClasse = numero => !deLaClasse || deLaClasse.includes(numero);
      const resumeSur = garder => SPLAT.resumeProf(brut || null, SPLAT.CARTE.ETAPES.filter(etape => garder(etape[4])),
        SPLAT.CARTE.BONUS.filter(etape => garder(etape[4])));
      const tout = SPLAT.resumeProf(brut || null);
      const resume = ouverts ? resumeSur(ouvert) : tout;
      const resumeClasse = String(deLaClasse) === String(ouverts) ? resume : (deLaClasse ? resumeSur(parLaClasse) : tout);
      return {faits: resume.faits, faitsClasse: resumeClasse.faits, total: resume.total, bonus: resume.bonus.faits,
              cours: resume.cours + resume.bonus.cours,
              mondes: tout.mondes.map(monde => (ouvert(monde.numero)
                ? (parLaClasse(monde.numero) ? monde : Object.assign({}, monde, {enPlus: true}))
                : Object.assign({}, monde, {etat: "ferme"}))),
              etats: tout.etapes, lisible: true};
    } catch (_) { return vide; }
  }

  // Les mondes de SPLAT! ouverts à la classe ouverte (classe.reglages, lot
  // « splat-suivi-5 ») : null quand ils le sont tous — le cas de toute classe où
  // personne n'a rien choisi. NOMBRE_MONDES : les mondes de la carte (un test le
  // compare au moteur, et aux six cases de « Activités de la classe »).
  const NOMBRE_MONDES = 6;
  function mondesOuverts() {
    const reglages = classe && classe.reglages;
    const liste = reglages && reglages.splat && reglages.splat.mondes;
    if (!Array.isArray(liste)) return null;
    const ouverts = liste.filter(numero => Number.isInteger(numero) && numero >= 1 && numero <= NOMBRE_MONDES);
    return ouverts.length && ouverts.length < NOMBRE_MONDES ? ouverts : null;
  }

  // Lot « Qui voit quoi » : les mondes ouverts à UN élève — ceux que le
  // serveur a calculés (eleve.acces : classe + ajouts, lot 2), null quand il
  // les a tous. Sans `acces` (un élève lu par un serveur d'avant le lot 2),
  // ceux de la classe. On n'enlève jamais à un élève : ce que la classe a, il
  // l'a — un `acces` qui dirait moins que la classe est complété par elle.
  function mondesDeLEleve(eleve) {
    const deLaClasse = mondesOuverts();
    const acces = eleve && eleve.acces;
    if (!acces || !Array.isArray(acces.applis)) return deLaClasse;
    // La classe les a tous : lui aussi.
    if (!deLaClasse) return null;
    const reglages = acces.reglages;
    const liste = reglages && reglages.splat && reglages.splat.mondes;
    // Rien d'écrit pour lui (SPLAT! entière en plus) : il les a tous.
    if (!Array.isArray(liste)) return null;
    const ouverts = [...new Set(liste.concat(deLaClasse))]
      .filter(numero => Number.isInteger(numero) && numero >= 1 && numero <= NOMBRE_MONDES).sort((a, b) => a - b);
    return ouverts.length && ouverts.length < NOMBRE_MONDES ? ouverts : null;
  }

  // Lot « Coffres magiques sur le suivi » (21/10/2026) : la ligne Coffres
  // d'un élève, lue par le moteur (prof/coffres-parcours.js) et par lui seul —
  // la page ne touche jamais aux compteurs du parcours. Un élève sans
  // parcours a ses trois niveaux à zéro : resumeProf part d'un parcours
  // vierge. Le moteur borne tout ce qu'il relit (une partie à 99 clés se lit
  // 10, un niveau 4 saute) : rien de ce qu'un appareil bricolé enverrait ne
  // déforme la page.
  function lireCoffres(brut) {
    const vide = {niveaux: [], operations: [], tresors: 0, parfaits: 0, dernier: null, partie: null, commence: false, lisible: false};
    if (!COFFRES) return vide;
    try {
      return Object.assign({}, COFFRES.resumeProf(brut || null), {lisible: true});
    } catch (_) { return vide; }
  }

  // Lot « Qui voit quoi », lot 4b (24/10/2026) : la ligne Anzan d'un élève,
  // lue par le moteur (prof/flash_anzan_parcours.js) et par lui seul — la page
  // ne touche jamais aux séances du parcours. resumeProf rend le compte (les
  // calculs faits, les jours d'entraînement), le jour de la dernière séance et
  // les dix dernières séances ; il relit et borne tout (une séance trafiquée
  // ne se lit pas). Un élève sans parcours : rien de commencé.
  function lireAnzan(brut) {
    const vide = {calculs: 0, justes: 0, jours: 0, seances: 0, premier: null, dernier: null, texte: "", dernieres: [],
      historique: [], commence: false, lisible: false};
    if (!ANZAN) return vide;
    try {
      // « historique » : toutes les séances gardées (500 au plus), la plus
      // récente en haut — pour « Voir les séances précédentes » du Parcours.
      return Object.assign({}, ANZAN.resumeProf(brut || null), {historique: ANZAN.historique(brut || null), lisible: true});
    } catch (_) { return vide; }
  }

  // Défi calcul (lot 2b, 31/10/2026) : la ligne d'un élève, lue par le moteur
  // (prof/defi_calcul_mon_parcours.js, resumeProf) et par lui seul, sur la
  // carte du noyau (prof/defi_calcul_core.js) — la page ne touche jamais aux
  // boîtes. Le moteur renormalise tout ce qu'il relit (un x à 9 redevient 0,
  // une liste trop longue est coupée) : rien de ce qu'un appareil bricolé
  // enverrait ne déforme la page. Un élève sans parcours : rien de commencé.
  function lireCalcul(brut) {
    const vide = {lisible: false, commence: false, sues: 0, entrees: 0, total: 0, paliers: [], modules: [], revoir: [],
      aVoir: 0, rouges: 0, causes: [], seances: {semaine: 0, quatreSemaines: 0, total: 0, jours: []}, dernier: null};
    if (!CALCUL || !CALCUL_CORE) return vide;
    try {
      return CALCUL.resumeProf(brut || null, CALCUL_CORE.carte(), CALCUL.jourLocal());
    } catch (_) { return vide; }
  }

  // L'élève est passé aussi : SPLAT! compte sur SES mondes (lot « Qui voit
  // quoi » : classe + ajouts, eleve.acces), les autres lecteurs l'ignorent.
  function elevesLus(cle, liste) {
    const lire = cle === "splat" ? lireSplat : cle === "coffres" ? lireCoffres : cle === "flash-anzan" ? lireAnzan
      : cle === "defi-calcul" ? lireCalcul : lireProgression;
    return (liste || []).map(eleve => Object.assign({}, eleve, {lu: lire(eleve.parcours, eleve)}));
  }

  // « ven. 02/10 » : le jour de la semaine dit plus vite qu'une année si
  // l'élève est venu cette semaine (lot 2b) ; à l'heure de La Réunion, comme
  // les journées du serveur.
  function dateLisible(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("fr-FR",
      {timeZone: "Indian/Reunion", weekday: "short", day: "2-digit", month: "2-digit"});
  }

  // Depuis combien de jours l'élève n'a rien fait : null tant que ce n'est
  // pas à signaler (jamais venu, ou venu il y a moins d'une semaine).
  function joursSansRien(eleve) {
    if (!PARCOURS || !eleve.maj_le) return null;
    const date = new Date(eleve.maj_le);
    if (isNaN(date)) return null;
    const jour = date.toLocaleDateString("en-CA", {timeZone: "Indian/Reunion"});
    const ecart = PARCOURS.ecartJours(jour, PARCOURS.jourLocal());
    return ecart >= PARCOURS.SEUILS.prof.absenceJours ? ecart : null;
  }

  // « mardi 8 septembre » : le jour tel que l'élève et le professeur l'ont
  // vécu. Le serveur découpe les journées à minuit HEURE DE LA RÉUNION
  // (lib/bd.php) ; l'affichage doit suivre le même fuseau, sinon un travail du
  // 8 au soir s'annoncerait « mercredi 9 » sur un ordinateur réglé sur Paris.
  function jourLisible(jour) {
    const date = new Date(String(jour) + "T12:00:00Z");
    if (isNaN(date)) return String(jour);
    return date.toLocaleDateString("fr-FR",
      {timeZone: "Indian/Reunion", weekday: "long", day: "numeric", month: "long"});
  }

  function nomAffiche(eleve) {
    if (!eleve.prenom) return "";
    return eleve.initiale ? `${eleve.prenom} ${eleve.initiale}.` : eleve.prenom;
  }

  // ---------------------------------------------------------------- tableau de la classe

  // Le tri « Prénom » (lot « Ma classe : tri et bandelette », 21/10/2026) :
  // de A à Z, exactement l'ordre de la feuille prénom ↔ code et de l'onglet
  // Élèves (ordreDeLaFeuille, comparaison à la française : Léa avant Lina,
  // Maëlys avant Manon) ; de Z à A, le même à l'envers. Les élèves sans prénom
  // restent en bas dans les deux sens. Avant, les prénoms se comparaient
  // caractère par caractère : Léa passait après Lucas.
  function trierEleves() {
    if (tri.colonne === "prenom") {
      const ordre = ordreDeLaFeuille(eleves);
      const avecPrenom = ordre.filter(eleve => eleve.prenom);
      const sansPrenom = ordre.filter(eleve => !eleve.prenom);
      if (tri.sens !== 1) avecPrenom.reverse();
      eleves.splice(0, eleves.length, ...avecPrenom, ...sansPrenom);
      return;
    }
    const clef = eleve => {
      // SPLAT! : les étapes réussies, puis les Bonus, puis une série en
      // cours, pour départager.
      if (tri.colonne === "etapes") return (eleve.lu.faits || 0) * 10000 + (eleve.lu.bonus || 0) * 10 + (eleve.lu.cours ? 1 : 0);
      // Coffres magiques : les trésors, puis les parfaits, puis une partie en cours.
      if (tri.colonne === "tresors") return (eleve.lu.tresors || 0) * 10000 + (eleve.lu.parfaits || 0) * 10 + (eleve.lu.partie ? 1 : 0);
      // Lot 5c : chaque niveau trie sur ses trésors, puis ses parfaits.
      if (/^niveau[123]$/.test(tri.colonne)) {
        const niveau = (eleve.lu.niveaux || []).find(n => n.numero === Number(tri.colonne.slice(-1)));
        return niveau ? (niveau.tresors || 0) * 10000 + (niveau.parfaits || 0) : -1;
      }
      // Anzan, « Jours » : les jours d'entraînement, puis les calculs.
      if (tri.colonne === "jours") return (eleve.lu.jours || 0) * 100000 + (eleve.lu.calculs || 0);
      // « Dernier trésor » : le jour du dernier trésor, pas la dernière activité.
      if (tri.colonne === "date" && appliAffichee === "coffres") return eleve.lu.dernier || "";
      // Lot S4c : Coffres, « Cette semaine ».
      if (/^s-/.test(tri.colonne)) {
        const semaine = semaineCoffres(eleve);
        return semaine ? semaine[tri.colonne.slice(2)] : -1;
      }
      // Anzan (lot 4b) : les calculs faits, puis les jours d'entraînement ;
      // « Dernière séance » : le jour de la dernière séance.
      if (tri.colonne === "calculs") return (eleve.lu.calculs || 0) * 1000 + (eleve.lu.jours || 0);
      // Lot S4c : Flash, Colonne — le plus haut grade du mode, puis ses calculs.
      if (tri.colonne === "flash" || tri.colonne === "colonne") {
        const grade = tri.colonne === "flash" ? eleve.lu.grade : eleve.lu.gradeColonne;
        return (grade || 0) * 1e7 + calculsParModeAnzan(eleve.lu || {})[tri.colonne];
      }
      if (tri.colonne === "date" && appliAffichee === "flash-anzan") return eleve.lu.dernier || "";
      // Défi calcul (lot 2b) : les compétences sues, puis les entrées ; « À
      // revoir » : à voir en classe d'abord, puis les rouges ; les séances
      // des 4 dernières semaines ; « Dernière activité » : le dernier jour
      // de travail lu dans le parcours.
      if (tri.colonne === "ceinture") return eleve.lu.ceintures ? eleve.lu.ceintures.porte * 10 + eleve.lu.ceintures.barrettes : -1;
      // Lot K2 : « Étoiles » — les étoiles gagnées, puis celles qui ont
      // réussi un retour ; « À surveiller » — les étoiles qui ont une raison
      // d'« À aider », celles à voir en classe d'abord.
      if (tri.colonne === "etoiles") { const c = compteEtoiles(eleve.lu); return c.gagnees * 1000 + c.tenues; }
      if (tri.colonne === "surveiller") { const r = raisonsAider(eleve.lu).filter(x => x.etoile); return r.filter(x => x.rang === 1).length * 1000 + r.length; }
      if (tri.colonne === "seances") return ((eleve.lu.seances && eleve.lu.seances.quatreSemaines) || 0) * 1000 + ((eleve.lu.seances && eleve.lu.seances.total) || 0);
      if (tri.colonne === "date" && appliAffichee === "defi-calcul") return eleve.lu.dernier || "";
      if (tri.colonne === "acquises") return eleve.lu.acquises.length;
      if (tri.colonne === "encours") return eleve.lu.enCours.ordre;
      if (tri.colonne === "semaine") return eleve.lu.ordreSemaines;
      if (tri.colonne === "retard") return eleve.lu.retard ? eleve.lu.retard.length : -1;
      return eleve.maj_le || "";
    };
    eleves.sort((a, b) => {
      const x = clef(a), y = clef(b);
      if (x < y) return -1 * tri.sens;
      if (x > y) return 1 * tri.sens;
      return (a.code || "").localeCompare(b.code || "");
    });
  }

  // Le menu « ⋯ » d'une ligne : sous son bouton, ou au-dessus quand il
  // sortirait par le bas de l'écran ; un seul ouvert à la fois.
  function placerMenu(plus, poignee, menu) {
    if (!plus.open) return;
    document.querySelectorAll("details.plus[open]").forEach(autre => { if (autre !== plus) autre.open = false; });
    const cadre = poignee.getBoundingClientRect();
    const hauteur = menu.getBoundingClientRect().height;
    const dessous = cadre.bottom + 4 + hauteur <= window.innerHeight;
    menu.style.top = `${dessous ? cadre.bottom + 4 : Math.max(4, cadre.top - 4 - hauteur)}px`;
    menu.style.right = `${Math.max(4, window.innerWidth - cadre.right)}px`;
  }

  function fermerMenus(evenement) {
    document.querySelectorAll("details.plus[open]").forEach(plus => {
      if (!evenement || !plus.contains(evenement.target)) plus.open = false;
    });
  }

  // Le prénom à saisir (lot « splat-suivi-4 ») — depuis le lot « Ma classe :
  // élèves » (18/10/2026), seulement dans la liste de l'onglet Élèves.
  function celluleNom(eleve, ecriture) {
    const cNom = document.createElement("td");
    const champ = document.createElement("input");
    champ.type = "text";
    champ.value = nomAffiche(eleve);
    // « Prénom » seul (21/10/2026) : l'initiale du nom (« Léa B. ») reste
    // possible pour départager deux Léa, mais rien ne l'impose.
    champ.placeholder = ecriture ? "Prénom" : "—";
    champ.maxLength = 44;
    if (ecriture) champ.addEventListener("change", () => nommer(eleve, champ));
    else { champ.readOnly = true; champ.tabIndex = -1; }
    cNom.appendChild(champ);
    return cNom;
  }

  // Dans les tableaux des applis, le prénom est du texte (lot « Ma classe :
  // élèves ») : un tableau projeté ne se modifie pas par mégarde, et il se
  // lit comme une liste, pas comme un formulaire.
  function celluleNomTexte(eleve) {
    const cNom = document.createElement("td");
    const nom = nomAffiche(eleve);
    cNom.className = nom ? "nom" : "nom sans";
    cNom.textContent = nom || "sans prénom";
    return cNom;
  }

  // Le code : seulement dans la liste de l'onglet Élèves.
  function celluleCode(eleve) {
    const cCode = document.createElement("td");
    cCode.className = "code";
    cCode.textContent = eleve.code || "";
    return cCode;
  }

  function celluleDate(eleve) {
    const cDate = document.createElement("td");
    const quand = dateLisible(eleve.maj_le);
    cDate.textContent = quand || "rien reçu";
    if (!quand) cDate.className = "sans";
    return cDate;
  }

  // Les gestes rares d'une ligne, derrière « ⋯ » (lot 2b) : un menu, un seul
  // ouvert à la fois. Sans geste, pas de « ⋯ ».
  function boutonGeste(texte, classeCss, action, titre) {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = classeCss;
    bouton.textContent = texte;
    if (titre) bouton.title = titre;
    bouton.addEventListener("click", action);
    return bouton;
  }

  function menuGestes(cActions, boutons) {
    if (!boutons.length) return;
    const plus = document.createElement("details");
    plus.className = "plus";
    const poignee = document.createElement("summary");
    poignee.textContent = "⋯";
    poignee.setAttribute("aria-label", "Autres actions");
    poignee.title = "Autres actions";
    const menu = document.createElement("div");
    menu.append(...boutons);
    plus.append(poignee, menu);
    menu.addEventListener("click", () => { plus.open = false; });
    plus.addEventListener("toggle", () => placerMenu(plus, poignee, menu));
    cActions.append(plus);
  }

  // Dans le tableau d'une appli : « Revenir à… », qui revient dans l'activité
  // affichée — il concerne sa progression, pas l'élève lui-même.
  // « Revenir à… », derrière le « ⋯ » au bout de sa ligne (serveur pro, lot
  // 5f — au lot 5c, il était en bas de la fenêtre de l'élève : « des gens
  // risquent de cliquer dessus »). Le serveur garde la version d'avant
  // le dernier enregistrement ET la fin de chacune des sept dernières
  // journées : un écrasement (par quelqu'un qui avait le code, ou un
  // « Recommencer à zéro » malheureux) se répare même si on ne s'en aperçoit
  // que le lendemain. Pas en lecture seule.
  function peutRevenir(eleve) {
    return droitClasse !== "lecture" && Boolean(eleve && (eleve.restaurable || (eleve.journees || []).length));
  }

  // Dans la liste de l'onglet Élèves : ce qui concerne l'élève lui-même.
  function poserGestesEleve(eleve, cActions) {
    // Serveur pro, lot 5b : plus de « Ce que voit Léa… » ici — ce qu'un élève
    // voit en plus se règle dans l'onglet de l'appli (« Régler … »).
    const boutons = [];
    boutons.push(
      // Choix de Gwenaël (18/10/2026) : l'élève qui a perdu son code, ou qui
      // en a un nouveau, repart avec SA bandelette, et rien à l'écran.
      boutonGeste("Imprimer sa bandelette", "secondaire", () => imprimer("bandelettes", eleve),
        "Sa bandelette seule, avec son numéro de la feuille"),
      boutonGeste("Nouveau code", "secondaire", () => regenerer(eleve))
    );
    // Supprimer un élève efface sa progression pour de bon : depuis le lot 11,
    // c'est au propriétaire de la classe, comme la supprimer. Un collègue en
    // écriture prépare et dépanne, il n'efface pas.
    if (droitClasse === "proprietaire") {
      boutons.push(boutonGeste("Supprimer", "danger", () => supprimerEleve(eleve)));
    }
    menuGestes(cActions, boutons);
  }

  // La liste de l'onglet Élèves : la feuille prénom ↔ code à l'écran — même
  // ordre et mêmes numéros que la feuille imprimée et les bandelettes
  // (ordreDeLaFeuille). Une saisie de prénom ne la redessine pas (nommer) :
  // la ligne ne saute pas sous le doigt ; l'ordre suit au prochain dessin.
  // En lecture seule, rien : ni l'onglet, ni les codes (le serveur ne les
  // envoie pas).
  function dessinerOngletEleves(ecriture) {
    const corps = $("corps-eleves");
    corps.textContent = "";
    $("liste-eleves").hidden = !ecriture || !eleves.length;
    // Une classe sans élève : « Ajouter des élèves » seul — rien à coller ni
    // à imprimer tant qu'il n'y a pas de code.
    ["coller-prenoms", "imprimer-bandelettes", "imprimer-recap"].forEach(id => { $(id).hidden = !ecriture || !eleves.length; });
    if (!ecriture) return;
    ordreDeLaFeuille(eleves).forEach((eleve, index) => {
      const ligne = document.createElement("tr");
      const cNumero = document.createElement("td");
      cNumero.className = "numero";
      cNumero.textContent = String(index + 1);
      const cNom = celluleNom(eleve, true);
      const cCode = celluleCode(eleve);
      const cActions = document.createElement("td");
      cActions.className = "actions-eleve";
      poserGestesEleve(eleve, cActions);
      ligne.dataset.eleve = String(eleve.id);
      ligne.append(cNumero, cNom, cCode, cActions);
      corps.appendChild(ligne);
    });
  }

  // ------------------------------------------------ qui voit quoi (lot 3, 22/10/2026)
  //
  // Conception validée par Gwenaël (qui-voit-quoi, lot 1, planches 1 à 4) :
  // ce qu'un élève voit = ce que voit sa classe + ce qu'on lui a ouvert EN
  // PLUS ; on n'enlève jamais rien à un élève. Depuis le serveur pro, lot 5b,
  // une seule porte : « Régler … » en haut de l'onglet de l'appli (la classe
  // ET les élèves en plus, plus bas). Le serveur range les ajouts
  // (eleve.ajouts) et CALCULE ce que voit l'élève (eleve.acces : la règle
  // « classe + ajouts » n'est écrite qu'une fois, en PHP, lib/applis.php) ;
  // la page lit `acces` pour montrer, et n'écrit que `ajouts`
  // (eleves.acces, propriétaire seulement). Tout est construit par
  // createElement et textContent : un prénom n'est jamais du HTML, et aucun
  // code d'élève n'est écrit ici.

  // Ce qu'un élève peut recevoir en plus à l'intérieur d'une appli : les
  // listes de numéros qu'elle déclare au catalogue (lib/applis.php,
  // « reglages » entiers). `titre` : le titre de ses cases dans « Régler … » ;
  // `mot` : comment on nomme un numéro (« seulement : monde 3 »).
  const LISTES_PAR_ELEVE = {
    "coffres": [
      {nom: "niveaux", titre: "Niveaux ouverts", mot: "niveau {n}",
       numeros: [[1, "Niveau 1"], [2, "Niveau 2"], [3, "Niveau 3"]]},
      {nom: "operations", titre: "Opérations ouvertes", mot: "opération {nom}",
       numeros: [[1, "Addition"], [2, "Soustraction"], [3, "Multiplication"], [4, "Division"]]}
    ],
    "splat": [
      {nom: "mondes", titre: "Mondes ouverts", mot: "monde {n}",
       numeros: [[1, "Petit"], [2, "Classique"], [3, "Enquête"], [4, "Système"], [5, "Équations"], [6, "Relatifs"]]}
    ]
  };

  // « Léa » (le prénom seul, comme sur les planches), ou « cet élève ».
  function prenomCourt(eleve) {
    return (eleve && eleve.prenom) || "cet élève";
  }

  // « les accès de Léa », « les accès d’Axel », « en tant qu’Inès » : devant un
  // nom qui commence par une voyelle, « de » et « que » s’élident (Y suivi
  // d’une consonne aussi : d’Yves, mais de Yanis). Devant un H, on garde
  // « de » : pour un prénom, les deux se disent.
  function seElide(mot) {
    return /^(?:[aeiouàâäéèêëîïôöùûüœæ]|y(?![aeiouàâäéèêëîïôöùûü]))/iu.test(String(mot || "").trim());
  }

  function deNom(nom) {
    return (seElide(nom) ? "d’" : "de ") + nom;
  }

  function queNom(nom) {
    return (seElide(nom) ? "qu’" : "que ") + nom;
  }

  // « monde 3 », « niveau 2 », « opération Division ».
  function motDe(liste, numero) {
    const trouve = liste.numeros.find(([n]) => n === numero);
    return liste.mot.replace("{n}", String(numero)).replace("{nom}", trouve ? trouve[1] : String(numero));
  }

  // Les numéros d'une liste ouverts d'après des réglages ({splat: {mondes:
  // [1, 2]}}) : null quand ils le sont tous (rien d'écrit, la convention du
  // serveur), bornés à la liste déclarée.
  function numerosOuverts(reglages, cle, liste) {
    const valeurs = reglages && reglages[cle] && reglages[cle][liste.nom];
    if (!Array.isArray(valeurs)) return null;
    const max = liste.numeros.length;
    const ouverts = [...new Set(valeurs.filter(numero => Number.isInteger(numero) && numero >= 1 && numero <= max))]
      .sort((a, b) => a - b);
    return ouverts.length && ouverts.length < max ? ouverts : null;
  }

  // Ce que voit l'élève, calculé par le serveur (eleve.acces) ; sans lui (un
  // serveur d'avant le lot 2), ce que voit sa classe.
  function accesDe(eleve) {
    const acces = eleve && eleve.acces;
    if (acces && Array.isArray(acces.applis)) return {applis: acces.applis, reglages: acces.reglages || {}};
    return {applis: (classe && classe.applis) || [], reglages: (classe && classe.reglages) || {}};
  }

  // Les ajouts après un geste — l'état COMPLET que la page envoie
  // (eleves.acces remplace la colonne entière). Jamais de liste vide, jamais
  // « [] » : pour le serveur (PHP), {"splat": []} et {"splat": {}} sont la
  // même chose — SPLAT! ENTIÈRE (relevé par Code à l'application du lot 2 de
  // « Qui voit quoi »). Donc :
  //  - une appli entière s'ouvre par un objet vide {} et se retire en
  //    SUPPRIMANT sa clé ;
  //  - un numéro décoché qui vide sa liste supprime la liste ; une appli
  //    qui n'a plus aucune liste perd sa clé (sinon elle deviendrait
  //    « entière ») ;
  //  - décocher un numéro d'une appli donnée entière ({}) : chaque liste est
  //    d'abord écrite en entier (« tout, sauf ce numéro »).
  // geste : {cle, ouvre} pour l'appli ; {cle, liste, numero, ouvre} pour un numéro.
  function ajoutsApres(ajouts, geste) {
    const suite = {};
    Object.keys(ajouts || {}).forEach(cle => {
      const ajout = ajouts[cle];
      if (!ajout || typeof ajout !== "object" || Array.isArray(ajout)) return;
      const copie = {};
      Object.keys(ajout).forEach(nom => { if (Array.isArray(ajout[nom]) && ajout[nom].length) copie[nom] = ajout[nom].slice(); });
      // Rien de lisible dans un ajout qui nommait des listes : on ne le
      // change pas en « appli entière ».
      if (Object.keys(ajout).length && !Object.keys(copie).length) return;
      suite[cle] = copie;
    });
    // Lot « cours-appli-3 » : un chapitre du livret en plus ({cle: "cours",
    // chapitre, ouvre}) — rangé dans l'ordre du livret ; plus aucun
    // chapitre : la clé part (jamais « cours: {} », que le serveur refuse).
    if (geste.chapitre !== undefined) {
      const avant = suite.cours && Array.isArray(suite.cours.chapitres) ? suite.cours.chapitres : [];
      const voulus = new Set(avant);
      if (geste.ouvre) voulus.add(geste.chapitre); else voulus.delete(geste.chapitre);
      const chapitres = COURS.map(ch => ch.id).filter(id => voulus.has(id));
      if (chapitres.length) suite.cours = {chapitres};
      else delete suite.cours;
      return suite;
    }
    if (geste.liste === undefined) {
      if (geste.ouvre) suite[geste.cle] = {};
      else delete suite[geste.cle];
      return suite;
    }
    let ajout = suite[geste.cle];
    if (ajout && !Object.keys(ajout).length) {
      (LISTES_PAR_ELEVE[geste.cle] || []).forEach(liste => { ajout[liste.nom] = liste.numeros.map(([numero]) => numero); });
    }
    if (!ajout) ajout = suite[geste.cle] = {};
    const numeros = new Set(ajout[geste.liste] || []);
    if (geste.ouvre) numeros.add(geste.numero);
    else numeros.delete(geste.numero);
    if (numeros.size) ajout[geste.liste] = [...numeros].sort((a, b) => a - b);
    else delete ajout[geste.liste];
    if (!Object.keys(ajout).length) delete suite[geste.cle];
    return suite;
  }

  // --------------------------------- « Aujourd'hui, dans Mon espace » (lot B2, 21/11/2026)
  //
  // Choix de Gwenaël (planches B2-1 et B2-2, questions à choix du 21/11) : en
  // tête des Réglages, ce que le grand bouton de Mon espace propose. Deux
  // choix : « Automatique » (le lot B1 : Défi tables, sinon la première
  // activité, puis Mes cours) ou « Ma liste, dans l'ordre » — D'abord / Puis /
  // Puis, parmi les portes ouvertes à la classe, avec les noms que voit
  // l'élève (« Mes cours »). Mes cours toujours en dernier : la choisir vide
  // et grise les listes qui suivent (le serveur refuse le reste). Rien n'est
  // envoyé avant « Enregistrer » : la carte travaille sur un brouillon. À
  // l'enregistrement, classes.modifier avec la liste et « avant » (la liste
  // rangée telle que la page la connaît : si un autre onglet l'a changée, 409
  // et la carte se remet sur l'état vrai). Même verrou que « Régler … ».
  // Tout est construit par createElement et textContent.
  let jourBrouillon = null;   // {classeId, depart, mode: "auto" | "liste" | "aucun", liste}

  function nomPourLEleve(cle) {
    return cle === "cours" ? "Mes cours" : nomDeLAppli(cle);
  }
  // Les portes ouvertes à la classe, dans l'ordre du catalogue (celui de Mon
  // espace). Correctif (Codex, point 9) : Mes cours seulement quand un
  // chapitre est ouvert à la classe — sinon les élèves ne la voient pas, et
  // l'aperçu la promettrait à tort.
  //
  // Lot B3 (21/11/2026, décision de Gwenaël après son groupe mixte 4e/3e, où
  // chaque élève a SES chapitres) : aussi les portes que seuls quelques élèves
  // ont — une appli « en plus », et Mes cours dès qu'un élève a au moins un
  // chapitre (de la classe ou en plus). Un élève qui n'a pas une porte de la
  // liste la saute.
  //
  // Correctif après la relecture Codex (points 1, 4 et 6) : les portes
  // viennent TOUTES du serveur, qui seul tient la règle (Mes cours : un
  // chapitre vraiment affichable). classe.portes : les portes possibles (la
  // classe et quelques élèves) ; classe.portes_classe : celles de la classe
  // seule ; eleve.acces.portes : celles de chaque élève. Elles arrivent avec
  // le tableau, avec chaque réponse de classes.modifier (200 et 409) et de
  // eleves.acces (« classe_portes ») ; la page les prend telles quelles et ne
  // fait que compter. Après un refus dont la relecture a échoué, les élèves de
  // la page peuvent être en retard : classe.effectifsPerimes, et la carte dit
  // « quelques élèves » au lieu d'un compte faux.
  const JOUR_AUCUN = "@aucun";
  function jourSansBloc(liste) {
    return Array.isArray(liste) && liste.length === 1 && liste[0] === JOUR_AUCUN;
  }
  function clesLues(liste) {
    return Array.isArray(liste) ? liste.filter(cle => typeof cle === "string") : [];
  }
  function porteDeLaClasse(cle) {
    return Boolean(classe) && clesLues(classe.portes_classe).includes(cle);
  }
  function eleveALaPorte(eleve, cle) {
    return Boolean(eleve && eleve.acces) && clesLues(eleve.acces.portes).includes(cle);
  }
  // null = toute la classe ; {avec, total} : la porte de quelques élèves ;
  // {inconnu: true} : une porte que le serveur dit possible alors qu'aucun
  // élève de la page ne l'a — ses élèves sont en retard (relecture ratée) :
  // « quelques élèves », jamais un « 0 élève » faux.
  function partDeLaPorte(cle) {
    const liste = eleves || [];
    if (porteDeLaClasse(cle) || !liste.length) return null;
    const avec = liste.filter(eleve => eleveALaPorte(eleve, cle)).length;
    if (!avec) return {inconnu: true};
    return avec >= liste.length ? null : {avec, total: liste.length};
  }
  function texteDeLaPart(part) {
    if (part.inconnu) return "quelques élèves";
    // Un nombre et son nom ne se séparent pas en fin de ligne (espaces insécables).
    return `${part.avec} élève${part.avec > 1 ? "s" : ""} sur ${part.total}`;
  }
  function portesDuJour() {
    const portes = classe ? clesLues(classe.portes) : [];
    return APPLIS.filter(appli => portes.includes(appli.cle)).map(appli => appli.cle);
  }
  // Les portes d'une réponse du serveur (tableau, classes.modifier, le
  // « classe_portes » de eleves.acces), posées sur la classe de la page.
  function poserPortesDeClasse(donnees) {
    if (!classe || !donnees) return;
    if (Array.isArray(donnees.portes)) classe.portes = clesLues(donnees.portes);
    if (Array.isArray(donnees.portes_classe)) classe.portes_classe = clesLues(donnees.portes_classe);
  }
  // Le mode automatique, comme Mon espace le calcule (etapesDuJour, lot B1).
  function jourAutomatique(portes) {
    // Lot B3 : l'activité est une porte de TOUTE la classe ; Mes cours suit
    // pour les élèves qui l'ont.
    const activites = portes.filter(cle => cle !== "cours" && porteDeLaClasse(cle));
    const liste = [];
    if (activites.includes("defi-tables")) liste.push("defi-tables");
    else if (activites.length) liste.push(activites[0]);
    if (portes.includes("cours")) liste.push("cours");
    return liste;
  }
  function jourDeLaClasse() {
    return classe && Array.isArray(classe.jour) ? classe.jour.filter(cle => typeof cle === "string") : [];
  }
  function memeListe(a, b) {
    return a.length === b.length && a.every((cle, i) => cle === b[i]);
  }
  // Une liste possible : des portes de la classe, sans doublon, trois au
  // plus ; rien après Mes cours.
  function listeDuJourPropre(liste, portes) {
    const propre = [];
    for (const cle of liste) {
      if (propre.length >= 3 || propre.includes("cours")) break;
      if (portes.includes(cle) && !propre.includes(cle)) propre.push(cle);
    }
    return propre;
  }

  function poserJourClasse(force) {
    if (!classe) return;
    const depart = jourDeLaClasse();
    const meme = jourBrouillon && jourBrouillon.classeId === classe.id && memeListe(jourBrouillon.depart, depart);
    if (force || !meme) {
      const aucun = jourSansBloc(depart);
      jourBrouillon = {classeId: classe.id, depart: depart.slice(), mode: aucun ? "aucun" : depart.length ? "liste" : "auto",
        liste: depart.length && !aucun ? depart.slice() : jourAutomatique(portesDuJour())};
      messager("message-jour", "", "");
    }
    dessinerJourClasse();
  }

  // Correctif (Codex, point 5) : rien de la carte d'une classe ne reste dans
  // une autre, ni après la déconnexion — brouillon, listes, aperçu, message.
  // Correctif après la relecture Codex (point 13) : aussi les trois ronds, la
  // valeur des listes et leur bloc — l'ancien choix ne reste pas lisible dans
  // le document (une fin de session sans rechargement). Appelée par
  // viderLaClasse et viderZones.
  function viderCarteJour() {
    jourBrouillon = null;
    ["jour-1", "jour-2", "jour-3", "jour-apercu", "jour-auto-texte"].forEach(id => { $(id).textContent = ""; });
    ["jour-1", "jour-2", "jour-3"].forEach(id => { $(id).value = ""; });
    ["jour-auto", "jour-liste", "jour-aucun"].forEach(id => { $(id).checked = false; });
    $("jour-etapes").hidden = true;
    messager("message-jour", "", "");
  }

  // Correctif (Codex, point 7) : le verrou des réglages rendu, les commandes
  // de la vue affichée se remettent à jour (elles ont pu être dessinées
  // grisées pendant l'attente, dans un autre onglet de la page).
  function rafraichirApresVerrou() {
    if (!classe) return;
    if (vue === "appli") poserQuiVoit();
    if (vue === "reglages") dessinerJourClasse();
  }

  function dessinerJourClasse() {
    const b = jourBrouillon;
    if (!b || !classe || b.classeId !== classe.id) return;
    const portes = portesDuJour();
    b.liste = listeDuJourPropre(b.liste, portes);
    const occupe = reglageEnCours;
    $("jour-auto").checked = b.mode === "auto";
    $("jour-liste").checked = b.mode === "liste";
    $("jour-aucun").checked = b.mode === "aucun";
    const auto = jourAutomatique(portes);
    const nomEtPart = cle => { const part = partDeLaPorte(cle); return part ? `${nomPourLEleve(cle)} (${texteDeLaPart(part)})` : nomPourLEleve(cle); };
    $("jour-auto-texte").textContent = auto.length ? `${auto.map(nomEtPart).join(", puis ")}.` : "aucune activité.";
    $("jour-etapes").hidden = b.mode !== "liste";
    [1, 2, 3].forEach(n => {
      const i = n - 1;
      const liste = $(`jour-${n}`);
      liste.textContent = "";
      if (i > 0) {
        const rien = document.createElement("option");
        rien.value = "";
        rien.textContent = "— rien —";
        liste.append(rien);
      }
      portes.forEach(cle => {
        const option = document.createElement("option");
        option.value = cle;
        const part = partDeLaPorte(cle);
        option.textContent = part ? `${nomPourLEleve(cle)} · ${texteDeLaPart(part)}` : nomPourLEleve(cle);
        option.disabled = b.liste.slice(0, i).includes(cle);
        liste.append(option);
      });
      liste.value = b.liste[i] || "";
      // Après « — rien — » ou après Mes cours : rien à choisir.
      liste.disabled = occupe || (i > 0 && (b.liste.length < i || b.liste[i - 1] === "cours"));
    });
    // Ce que voient les élèves.
    const voulue = b.mode === "liste" && b.liste.length ? b.liste : auto;
    const apercu = $("jour-apercu");
    apercu.textContent = "";
    if (b.mode === "aucun") apercu.append("Ce que voient les élèves : pas de grand bouton. Leur espace commence par Ma semaine et leurs activités.");
    else if (!voulue.length) apercu.append("Ce que voient les élèves : rien en haut de leur espace (aucune activité ouverte).");
    else {
      // Une liste vide : les élèves ont le choix automatique, et on le dit.
      apercu.append(b.mode === "liste" && !b.liste.length ? "Liste vide, donc automatique : " : "Ce que voient les élèves : ");
      voulue.forEach((cle, i) => {
        if (i) apercu.append(" → ");
        const nom = document.createElement("b");
        nom.textContent = nomPourLEleve(cle);
        apercu.append(nom);
      });
      apercu.append(voulue[voulue.length - 1] === "cours" ? " (Mes cours reste jusqu’au soir)." : ", puis « C’est fait ! ».");
      // Lot B3 : dit honnêtement les étapes que seuls quelques élèves ont.
      const partielles = voulue.map(cle => [cle, partDeLaPorte(cle)]).filter(([, part]) => part);
      if (partielles.length) {
        const saut = document.createElement("span");
        saut.className = "jour-saut";
        saut.textContent = `${partielles.map(([cle, part]) => `${nomPourLEleve(cle)} : pour ${texteDeLaPart(part)} seulement`).join(" ; ")}. `
          + (partielles.length > 1 ? "Les autres sautent ces étapes." : "Les autres sautent cette étape.");
        apercu.append(saut);
        if (b.mode === "liste" && !classe.effectifsPerimes) {
          const sans = (eleves || []).filter(eleve => !voulue.some(cle => eleveALaPorte(eleve, cle))).length;
          if (sans) {
            const reste = document.createElement("span");
            reste.className = "jour-saut";
            reste.textContent = `${sans} élève${sans > 1 ? "s n’ont" : " n’a"} aucune de ces étapes : le mode automatique à la place.`;
            apercu.append(reste);
          }
        }
        // Correctif (Codex, point 1) : les élèves n'ont pas pu être relus.
        if (classe.effectifsPerimes) {
          const relire = document.createElement("span");
          relire.className = "jour-saut";
          relire.textContent = "Le nombre d’élèves n’a pas pu être relu : recharge la page pour le voir.";
          apercu.append(relire);
        }
      }
    }
    ["jour-auto", "jour-liste", "jour-aucun", "jour-enregistrer"].forEach(id => { $(id).disabled = occupe; });
  }

  // Une liste déroulante changée : la suite se recolle derrière (sans
  // doublon) ; « — rien — » ou Mes cours ferment la liste à cet endroit.
  function choisirEtapeDuJour(i, valeur) {
    const b = jourBrouillon;
    if (!b || reglageEnCours) return;
    const ancienne = b.liste.slice();
    let liste = ancienne.slice(0, i);
    if (valeur) {
      liste.push(valeur);
      if (valeur !== "cours") liste = liste.concat(ancienne.slice(i + 1).filter(cle => cle !== valeur));
    }
    b.liste = listeDuJourPropre(liste, portesDuJour());
    messager("message-jour", "", "");
    dessinerJourClasse();
  }

  function choisirModeDuJour(mode) {
    const b = jourBrouillon;
    if (!b || reglageEnCours) return;
    b.mode = mode;
    if (mode === "liste" && !b.liste.length) b.liste = jourAutomatique(portesDuJour());
    messager("message-jour", "", "");
    dessinerJourClasse();
  }

  // Correctif après la relecture Codex (point 7) : la confirmation dit le
  // CHOIX enregistré, sans promettre une étape à toute la classe (Anzan pour
  // Noa seul) ; l'aperçu, juste au-dessus, dit qui voit quoi — relu après
  // l'envoi.
  function texteJourEnregistre(libelle, liste) {
    if (jourSansBloc(liste)) return `Enregistré : pas de grand bouton pour les élèves de la ${libelle}.`;
    if (!liste.length) return `Enregistré : la ${libelle} est en automatique.`;
    return `Enregistré : la liste de la ${libelle}.`;
  }

  async function enregistrerJour() {
    if (!classe || droitClasse !== "proprietaire" || !jourBrouillon || jourBrouillon.classeId !== classe.id) return;
    if (reglageEnCours) { messager("message-jour", "Un autre enregistrement est en route : réessaie dans un instant.", "info"); return; }
    const b = jourBrouillon;
    const voulue = b.mode === "liste" ? b.liste.slice() : b.mode === "aucun" ? [JOUR_AUCUN] : [];
    const classeId = classe.id;
    const libelle = classe.libelle;
    if (memeListe(voulue, b.depart)) { messager("message-jour", "Aucune modification dans cet onglet.", "info"); return; }
    const applisConnues = Array.isArray(classe.applis) ? classe.applis.slice() : [];
    const portesProposees = portesDuJour();
    const session = generation;
    const encoreLa = () => generation === session && Boolean(jeton);
    const memeClasse = () => Boolean(classe) && classe.id === classeId;
    // Correctif (Codex, point 5) : la navigation au départ de l'écriture. Une
    // autre classe (ou un autre onglet) demandée pendant l'envoi a la
    // priorité : la carte ne relit pas sa classe par-dessus — ce serait annuler
    // la navigation (ouvrirClasse avance demandeAppli).
    const navigation = demandeAppli;
    const relireSiPermis = async () => {
      const relu = demandeAppli === navigation && await relireBornee(classeId);
      if (!relu && memeClasse()) classe.effectifsPerimes = true;
      return relu;
    };
    reglageEnCours = true;
    dessinerJourClasse();
    messager("message-jour", "Enregistrement…", "info");
    try {
      let reponse = null;
      let erreur = null;
      try {
        // Correctif (Codex, point 1) : « avant » dit aussi les portes que la
        // carte connaît — une porte fermée dans un autre onglet donne 409 et
        // la carte se remet sur l'état vrai. Lot B3 : et celles qu'elle
        // PROPOSE (portes : la classe et quelques élèves) — une porte retirée
        // ailleurs au dernier élève qui l'avait donne 409 aussi.
        reponse = await appelBorne("classes.modifier", {classe_id: classeId, jour: voulue, avant: {jour: b.depart.slice(), applis: applisConnues, portes: portesProposees}});
      } catch (e) {
        erreur = e;
      }
      if (!encoreLa()) return;
      if (erreur && erreur.statut === 401) { surErreur(erreur, "message-jour"); return; }
      if (!memeClasse()) return;
      if (!erreur) {
        const ecrite = reponse && Array.isArray(reponse.jour) ? clesLues(reponse.jour) : voulue;
        classe.jour = ecrite;
        poserPortesDeClasse(reponse);
        // Correctif (Codex, point 7) : un autre onglet a pu donner Anzan à un
        // deuxième élève pendant l'envoi — les comptes sont relus avant d'être
        // montrés comme actuels.
        await relireSiPermis();
        if (!encoreLa() || !memeClasse()) return;
        if (!memeListe(jourDeLaClasse(), ecrite)) classe.jour = ecrite;
        reglageEnCours = false;
        poserJourClasse(true);
        messager("message-jour", texteJourEnregistre(libelle, ecrite), "ok");
        return;
      }
      if (erreur.statut === 409) {
        poserEtatDeClasse(erreur.donnees);
        // Lot B3 : ce que voit chaque élève a pu changer aussi (les comptes
        // « 1 élève sur 4 » en viennent) — la classe est relue. Correctif
        // (Codex, point 1) : si la lecture échoue, la carte tient l'état du
        // refus TEL QUEL — sa liste et ses portes, jamais recoupées avec les
        // élèves d'avant — et dit que les comptes sont à relire.
        await relireSiPermis();
        if (!encoreLa() || !memeClasse()) return;
        reglageEnCours = false;
        poserJourClasse(true);
        messager("message-jour", `La ${libelle} a été changée ailleurs : la carte montre l’état actuel, refais ton choix.`, "erreur");
        return;
      }
      // Correctif (Codex, point 8) : une réponse reçue mais illisible (un 200
      // tronqué, une page d'erreur de l'hébergeur) ne dit pas si c'est écrit —
      // comme une absence de réponse, on relit.
      if (erreur.statut && erreur.donnees) {
        messager("message-jour", erreur.message, "erreur");
        return;
      }
      // Sans réponse lisible : on relit la classe pour savoir ce qui est en place.
      const relu = await relireSiPermis();
      if (!encoreLa() || !memeClasse()) return;
      reglageEnCours = false;
      if (relu && memeListe(jourDeLaClasse(), voulue)) {
        poserJourClasse(true);
        messager("message-jour", texteJourEnregistre(libelle, voulue), "ok");
      } else if (relu) {
        poserJourClasse(true);
        messager("message-jour", "Pas enregistré : le serveur ne répond pas. La carte montre ce qui est en place : réessaie.", "erreur");
      } else {
        messager("message-jour", `Peut-être enregistré (le serveur n’a pas répondu). ${SANS_VERIFICATION}`, "erreur");
      }
    } finally {
      if (encoreLa()) {
        reglageEnCours = false;
        rafraichirApresVerrou();
      }
    }
  }

  // ------------------------------------------- « Régler … » (serveur pro, lot 5b)
  //
  // Choix de Gwenaël (étape 4, planches 2, 3 et 7 du 25/10/2026) : chaque
  // appli se règle DANS SON ONGLET. Une ligne en haut de l'onglet dit qui la
  // voit ; « Régler Défi tables » ouvre une fenêtre avec la case de la classe,
  // les élèves en plus et les réglages de l'appli pour la classe. C'est la
  // seule porte : les cases ont quitté Réglages, « Élèves › ⋯ › Ce que
  // voit… » et la colonne « En plus » ont disparu. Règle du 22/10 gardée :
  // pour un élève, on ne fait qu'AJOUTER (ce que la classe a, il l'a).
  //
  // Propriétaire seulement, comme le serveur (classes.modifier et
  // eleves.acces). Rien n'est envoyé avant « Enregistrer » : la fenêtre
  // travaille sur un brouillon. À l'enregistrement, la classe d'abord
  // (classes.modifier : la liste des applis, puis les réglages de CETTE
  // appli), puis chaque élève dont les ajouts changent (eleves.acces, avec
  // « avant », l'état rangé tel que la page le connaît : si un autre onglet
  // l'a changé, le serveur refuse au lieu d'écraser — lot 3c). Un refus
  // n'arrête pas les autres élèves ; la fenêtre dit ce qui est passé et ce
  // qui ne l'est pas, et se remet sur l'état relu du serveur.
  //
  // Tout est construit par createElement et textContent : un prénom n'est
  // jamais du HTML, et aucun code d'élève n'est écrit ici.
  let reglage = null;          // le brouillon de la fenêtre ouverte, ou null
  let reglageEnCours = false;  // un « Enregistrer » est en route

  // ------------------------------------------------ l'appli Cours (lot « cours-appli », 08/11/2026)
  //
  // Le catalogue du livret (lib/cours.json, posé dans la page par PHP) et le
  // réglage de la classe (classes.reglages.cours) : les chapitres ouverts, les
  // fiches fermées (« sans »), les fiches du nouveau programme ouvertes
  // (« avec »). Rien d'ouvert au départ (choix de Gwenaël du 08/11/2026).
  // Une fiche commune à deux chapitres (4e-TRI-03 en 4e et en 3e) a un seul
  // identifiant : la fermer la ferme dans les deux.
  const COURS = (() => {
    try {
      const brut = JSON.parse(document.getElementById("cours-catalogue").textContent || "[]");
      return Array.isArray(brut) ? brut.filter(c => c && typeof c.id === "string" && Array.isArray(c.fiches)) : [];
    } catch (_) { return []; }
  })();
  const NIVEAUX_COURS = ["CM2", "6e", "5e", "4e", "3e"].filter(n => COURS.some(c => c.niveau === n));

  function coursDeLaClasse() {
    const brut = (classe && classe.reglages && classe.reglages.cours) || {};
    const liste = nom => new Set(Array.isArray(brut[nom]) ? brut[nom].filter(x => typeof x === "string") : []);
    return {chapitres: liste("chapitres"), sans: liste("sans"), avec: liste("avec")};
  }
  function copierCours(c) {
    return {chapitres: new Set(c.chapitres), sans: new Set(c.sans), avec: new Set(c.avec)};
  }
  // Les listes dans l'ordre du catalogue (celui que range le serveur).
  function coursEnvoye(c) {
    const chapitres = COURS.map(ch => ch.id).filter(id => c.chapitres.has(id));
    const fiches = [];
    COURS.forEach(ch => {
      ch.fiches.forEach(f => { if (!fiches.includes(f.id)) fiches.push(f.id); });
      if (ch.brevet && !fiches.includes(ch.brevet.id)) fiches.push(ch.brevet.id);
    });
    return {chapitres, sans: fiches.filter(id => c.sans.has(id)), avec: fiches.filter(id => c.avec.has(id))};
  }
  function memesCours(a, b) {
    if (!a || !b) return a === b;
    return JSON.stringify(coursEnvoye(a)) === JSON.stringify(coursEnvoye(b));
  }
  function ficheOuverte(c, fiche) {
    return fiche.nouveau ? c.avec.has(fiche.id) : !c.sans.has(fiche.id);
  }
  function texteCoursOuverts(c) {
    const n = COURS.filter(ch => c.chapitres.has(ch.id)).length;
    if (!n) return "aucun chapitre ouvert : la tuile « Mes cours » n’apparaît pas encore";
    return `${n} chapitre${n > 1 ? "s" : ""} ouvert${n > 1 ? "s" : ""}`;
  }
  // Le niveau proposé en premier dans la fenêtre : celui du premier chapitre
  // ouvert, sinon le chiffre du nom de la classe (« 306 » → 3e), sinon le
  // premier niveau du livret. Ce n'est qu'un filtre d'affichage.
  function niveauDeDepart(c) {
    const ouvert = COURS.find(ch => c.chapitres.has(ch.id));
    if (ouvert) return ouvert.niveau;
    const chiffre = /^\s*([3-6])/.exec((classe && classe.libelle) || "");
    if (chiffre && NIVEAUX_COURS.includes(`${chiffre[1]}e`)) return `${chiffre[1]}e`;
    return NIVEAUX_COURS[NIVEAUX_COURS.length - 1] || "";
  }
  // « 4e-TRI-01 » ne se coupe pas au tiret (trait d'union insécable).
  function insecable(texte) {
    return String(texte || "").replace(/-/g, "\u2011");
  }
  function lienVoir(url) {
    const lien = el("a", "", "Voir ↗");
    lien.href = url;
    lien.target = "_blank";
    lien.rel = "noopener";
    return lien;
  }
  function etiquetteCoursNiveau(niveau) {
    return el("span", "cours-niv", niveau);
  }

  // L'onglet Cours, à chaque changement d'onglet, de vue ou de classe : seuls
  // y restent la ligne « qui voit », la carte d'un onglet grisé, le message
  // et le panneau des cours (le reste de la vue de l'activité est caché par
  // la feuille de style, classe « vue-cours »).
  function poserCours() {
    $("vue-appli").classList.toggle("vue-cours", appliAffichee === "cours");
    dessinerCoursProf();
  }

  // L'onglet Cours : ce que voient les élèves, chapitre par chapitre (les
  // fiches fermées en gris, « Voir ↗ » ouvre la fiche dans un nouvel onglet).
  //
  // Lot « cours-appli-2 » (13/11/2026, choix de Gwenaël : la grille élèves ×
  // fiches devenait illisible) : un RÉSUMÉ. En tête, combien d'élèves ont
  // ouvert au moins une fiche cette semaine (depuis lundi, jour de La
  // Réunion) ; puis une ligne par chapitre, « ouvert par N élèves sur M »
  // (au moins une de ses fiches, ou son Entraînement brevet, depuis qu'on
  // les note), qui se déplie : ses fiches, chacune avec le nombre d'élèves
  // qui l'ont ouverte ; puis la grille complète (« Élève par élève »), à
  // déplier encore. Rien n'est déplié au départ ; ce qui l'est le reste tant
  // que la page est ouverte (par classe). « Ouvert » n'est ni « lu » ni
  // « compris » : la page ne dit jamais « lu ».
  // Lot « cours-appli-3 » (14/11/2026) : la vue ne change pas, mais un
  // élève qui a un chapitre EN PLUS y est compté sur ce chapitre — et
  // seulement les élèves qui voient un chapitre comptent pour lui (« ouvert
  // par 1 élève sur 2 » pour un chapitre ouvert à deux élèves). Qui voit
  // quoi vient du serveur (eleve.acces, classe + ajouts) : la page ne refait
  // pas la règle.
  const coursDeplies = new Set();
  const coursGrilles = new Set();
  function elevesDuCours() {
    return appliAffichee === "cours" ? ordreDeLaFeuille(eleves || []).filter(eleve => accesDe(eleve).applis.includes("cours")) : [];
  }
  function chapitresVusPar(eleve) {
    const cours = accesDe(eleve).reglages.cours;
    return new Set(cours && Array.isArray(cours.chapitres) ? cours.chapitres : []);
  }
  // Combien de ces élèves ont ouvert au moins une de ces fiches (un jour
  // `depuis` ou après, si on le donne).
  function combienOntOuvert(liste, fiches, depuis) {
    return liste.filter(eleve => fiches.some(id => {
      const jour = jourOuvert(eleve, id);
      return Boolean(jour) && (!depuis || jour >= depuis);
    })).length;
  }
  function ouvertesDeLEleve(eleve) {
    return eleve && eleve.ouvertes && typeof eleve.ouvertes === "object" ? Object.keys(eleve.ouvertes) : [];
  }
  function dessinerCoursProf() {
    const panneau = $("cours-prof");
    const montrer = Boolean(classe) && vue === "appli" && appliAffichee === "cours" && (parLaClasse("cours") || elevesDuCours().length > 0);
    panneau.hidden = !montrer;
    panneau.textContent = "";
    if (!montrer) return;
    const c = coursDeLaClasse();
    const liste = elevesDuCours();
    const total = liste.length;
    const deLaClasse = ch => parLaClasse("cours") && c.chapitres.has(ch.id);
    const quiVoit = ch => (deLaClasse(ch) ? liste : liste.filter(eleve => chapitresVusPar(eleve).has(ch.id)));
    panneau.append(el("h2", "", `Ce que voient les élèves de la ${classe.libelle}`));
    if (total) {
      const lundi = lundiDuJour(aujourdhuiSuivi());
      const semaine = liste.filter(eleve => ouvertesDeLEleve(eleve).some(id => {
        const jour = jourOuvert(eleve, id);
        return Boolean(jour) && jour >= lundi;
      })).length;
      const phrase = el("p", "cours-semaine");
      if (semaine) phrase.append("Cette semaine, ", el("b", "", `${semaine} élève${semaine > 1 ? "s" : ""} sur ${total}`),
        semaine > 1 ? " ont ouvert au moins une fiche." : " a ouvert au moins une fiche.");
      else phrase.append("Cette semaine, personne n’a encore ouvert de fiche.");
      panneau.append(phrase);
    }
    panneau.append(el("p", "sous", "Pour chaque élève et chaque fiche, seul le dernier jour où la fiche a été ouverte depuis « Mes cours » est gardé. Ouvrir une fiche n’est pas la lire."));
    const ouverts = COURS.filter(ch => deLaClasse(ch) || quiVoit(ch).length > 0);
    if (!ouverts.length) {
      panneau.append(el("p", "", droitClasse === "proprietaire"
        ? "Aucun chapitre ouvert. « Régler les cours » pour en ouvrir un."
        : "Aucun chapitre ouvert."));
      return;
    }
    ouverts.forEach(ch => {
      const cleChap = `${classe.id}:${ch.id}`;
      const deplie = coursDeplies.has(cleChap);
      const bloc = el("div", "cours-chap");
      const nb = ch.fiches.length;
      const vus = ch.fiches.filter(f => ficheOuverte(c, f)).length;
      // Les fiches que voit la classe, sous le numéro que voient les élèves.
      const colonnes = ch.fiches.filter(f => ficheOuverte(c, f)).map(f => ({id: f.id, n: String(f.n), titre: f.h1}));
      if (ch.brevet && !c.sans.has(ch.brevet.id)) colonnes.push({id: ch.brevet.id, n: "🎯", titre: nomBrevetProf(ch)});
      const tete = el("button", "cours-chap-tete");
      tete.type = "button";
      tete.setAttribute("aria-expanded", String(deplie));
      const nom = el("span", "nom");
      const voient = quiVoit(ch);
      const surCombien = voient.length;
      const enPlus = deLaClasse(ch) ? "" : ` · en plus pour ${surCombien} élève${surCombien > 1 ? "s" : ""}`;
      nom.append(etiquetteCoursNiveau(ch.niveau), ch.chapitre || ch.titre, " ", el("small", "", `· ${vus} fiche${vus > 1 ? "s" : ""} sur ${nb}${enPlus}`));
      tete.append(nom);
      if (surCombien) {
        const combien = el("span", "combien");
        const n = combienOntOuvert(voient, colonnes.map(col => col.id));
        if (n) combien.append("ouvert par ", el("b", "", `${n} élève${n > 1 ? "s" : ""}`), ` sur ${surCombien}`);
        else combien.append("pas encore ouvert");
        tete.append(combien);
      }
      tete.addEventListener("click", () => {
        if (coursDeplies.has(cleChap)) coursDeplies.delete(cleChap); else coursDeplies.add(cleChap);
        dessinerCoursProf();
      });
      bloc.append(tete);
      if (deplie) {
        const corps = el("div", "cours-chap-corps");
        if (ch.titre && ch.titre !== ch.chapitre) corps.append(el("p", "titre-long", ch.titre));
        const rangees = ch.fiches.map(f => ({id: f.id, titre: `${f.n}. ${f.h1}`, ids: insecable(f.ids), type: f.type, nouveau: f.nouveau, url: f.url, ouverte: ficheOuverte(c, f)}));
        if (ch.brevet) rangees.push({id: ch.brevet.id, titre: `🎯 ${nomBrevetProf(ch)}`, ids: "", type: "", nouveau: false, url: ch.brevet.url, ouverte: !c.sans.has(ch.brevet.id)});
        rangees.forEach(r => {
          const rangee = el("div", `cours-fiche${r.ouverte ? "" : " fermee"}`);
          const marque = el("span", "marque", r.ouverte ? "✓" : "–");
          marque.setAttribute("aria-label", r.ouverte ? "ouverte à la classe" : "fermée à la classe");
          const t = el("span", "t", r.titre);
          if (r.nouveau) t.append(el("span", "cours-nouveau", "Nouveau programme"));
          const precision = [r.type, r.ids].filter(Boolean).join(" · ");
          if (precision) t.append(" ", el("small", "", `· ${precision}`));
          rangee.append(marque, t);
          if (r.ouverte && surCombien) {
            const n = combienOntOuvert(voient, [r.id]);
            rangee.append(el("span", `ouvreurs${n ? "" : " personne"}`, n ? `${n} élève${n > 1 ? "s" : ""}` : "personne"));
          }
          rangee.append(lienVoir(r.url));
          corps.append(rangee);
        });
        if (surCombien && colonnes.length && combienOntOuvert(voient, colonnes.map(col => col.id))) {
          const grille = coursGrilles.has(cleChap);
          const bouton = el("button", "secondaire cours-grille-bouton", grille ? "Élève par élève ▴" : "Élève par élève ▾");
          bouton.type = "button";
          bouton.setAttribute("aria-expanded", String(grille));
          bouton.addEventListener("click", () => {
            if (coursGrilles.has(cleChap)) coursGrilles.delete(cleChap); else coursGrilles.add(cleChap);
            dessinerCoursProf();
          });
          corps.append(bouton);
          if (grille) {
            const ouvertures = tableauOuvertures(colonnes, voient);
            if (ouvertures) corps.append(ouvertures);
          }
        }
        bloc.append(corps);
      }
      panneau.append(bloc);
    });
  }
  // En 4e, pas de brevet : « Exercices type » (comme l'espace élève, 09/11/2026).
  function nomBrevetProf(ch) {
    return ch.niveau === "4e" ? "Exercices type" : "Entraînement brevet";
  }

  // Lot « cours-ouvertures » (10/11/2026, décidé par Gwenaël) : pour chaque
  // élève et chaque fiche, « ouverte le … » (le jour de la dernière
  // ouverture depuis « Mes cours ») ou rien — ni nombre de fois, ni durée,
  // jamais « lue ». Le jour vient du serveur (tableau, champ « ouvertes »),
  // c'est celui de La Réunion. Personne dans le chapitre : une phrase, pas
  // une grille vide.
  const JOUR_ISO = /^\d{4}-\d{2}-\d{2}$/;
  function jourOuvert(eleve, fiche) {
    const jour = eleve && eleve.ouvertes && typeof eleve.ouvertes === "object" ? eleve.ouvertes[fiche] : null;
    return typeof jour === "string" && JOUR_ISO.test(jour) ? jour : null;
  }
  function tableauOuvertures(colonnes, liste) {
    if (!liste.length || !colonnes.length) return null;
    if (!liste.some(eleve => colonnes.some(col => jourOuvert(eleve, col.id)))) {
      return el("p", "cours-personne", "Personne n’a encore ouvert de fiche de ce chapitre.");
    }
    const enveloppe = el("div", "cours-ouv-env");
    const table = el("table", "cours-ouv");
    const tete = el("tr", "");
    const coin = el("th", "", "Ouverte le");
    coin.scope = "col";
    tete.append(coin);
    colonnes.forEach(col => {
      const th = el("th", "", col.n);
      th.scope = "col";
      th.title = col.n === "🎯" ? col.titre : `${col.n}. ${col.titre}`;
      th.setAttribute("aria-label", col.n === "🎯" ? col.titre : `Fiche ${col.n}`);
      tete.append(th);
    });
    const thead = el("thead", "");
    thead.append(tete);
    const tbody = el("tbody", "");
    liste.forEach(eleve => {
      const ligne = el("tr", "");
      const nom = el("th", "", nomAffiche(eleve) || "sans prénom");
      nom.scope = "row";
      ligne.append(nom);
      colonnes.forEach(col => {
        const jour = jourOuvert(eleve, col.id);
        const td = el("td", "");
        if (jour) {
          td.append(el("span", "", `${jour.slice(8, 10)}/${jour.slice(5, 7)}`));
          td.title = `ouverte le ${jourLisible(jour)}`;
        }
        ligne.append(td);
      });
      tbody.append(ligne);
    });
    table.append(thead, tbody);
    enveloppe.append(table);
    return enveloppe;
  }

  // Le niveau (un filtre d'affichage) : vaut pour les chapitres de la
  // classe ET pour ceux en plus. Le nombre sur un bouton : les chapitres de
  // ce niveau ouverts à la classe (rien quand elle n'a pas l'appli).
  function dessinerNiveauxCours(corps, b) {
    const c = b.cours;
    const niveau = reglage.niveauCours;
    if (NIVEAUX_COURS.length > 1) {
      corps.append(el("h3", "", "Niveau"));
      const rangee = el("div", "cours-niveaux");
      rangee.setAttribute("role", "group");
      rangee.setAttribute("aria-label", "Niveau");
      NIVEAUX_COURS.forEach(n => {
        const bouton = el("button", "secondaire", n);
        bouton.type = "button";
        bouton.setAttribute("aria-pressed", String(n === niveau));
        const ouverts = b.classeOuverte ? COURS.filter(ch => ch.niveau === n && c.chapitres.has(ch.id)).length : 0;
        if (ouverts) bouton.textContent = `${n} · ${ouverts}`;
        bouton.addEventListener("click", () => { reglage.niveauCours = n; dessinerRegler(); });
        rangee.append(bouton);
      });
      corps.append(rangee);
    }
  }

  // La fenêtre « Régler les cours » : le niveau (un filtre), puis les
  // chapitres de ce niveau, chacun avec ses fiches à déplier. Rien ne part
  // avant « Enregistrer ».
  function dessinerReglerCours(corps, b) {
    const c = b.cours;
    const niveau = reglage.niveauCours;
    dessinerNiveauxCours(corps, b);
    const chapitres = COURS.filter(ch => ch.niveau === niveau);
    // Lot « cours-appli-2 » (choix de Gwenaël du 13/11/2026) : « Tout ouvrir »
    // et « Tout fermer » cochent ou décochent les chapitres du niveau affiché
    // — les cases des fiches ne bougent pas (celles du nouveau programme
    // restent à cocher une par une) ; rien ne part avant « Enregistrer ».
    const tous = el("div", "cours-tous");
    tous.append(el("h3", "", `Chapitres de ${niveau}`));
    if (chapitres.length) {
      const ouverts = chapitres.filter(ch => c.chapitres.has(ch.id)).length;
      [["Tout ouvrir", true, ouverts === chapitres.length], ["Tout fermer", false, ouverts === 0]].forEach(([mot, ouvrir, inutile]) => {
        const bouton = el("button", "secondaire", mot);
        bouton.type = "button";
        bouton.disabled = inutile;
        bouton.addEventListener("click", () => {
          chapitres.forEach(ch => { if (ouvrir) c.chapitres.add(ch.id); else c.chapitres.delete(ch.id); });
          dessinerRegler();
        });
        tous.append(bouton);
      });
    }
    corps.append(tous);
    if (!chapitres.length) corps.append(el("p", "aide", "Pas encore de chapitre écrit pour ce niveau."));
    chapitres.forEach(ch => corps.append(boiteCours(b, ch, true)));
    corps.append(el("p", "aide", "Un chapitre coché s’ouvre avec toutes ses fiches, sauf celles du nouveau programme (à cocher une par une). "
      + "« Tout ouvrir » et « Tout fermer » ne changent que les chapitres de ce niveau. "
      + "Une fiche commune à la 4e et à la 3e se ferme dans les deux chapitres."));
  }

  // La boîte d'un chapitre : sa case (pour la classe, si `avecCase`) ou son
  // nom seul, et « Les fiches ▾ » qui déplie ses fiches à cocher (« sans » /
  // « avec » de la classe). Correctif de cours-appli-3 (relecture Codex,
  // point 2) : sorti de dessinerReglerCours pour servir aussi quand la classe
  // n'a pas Cours (« Leurs fiches »). Les fiches d'un chapitre fermé à la
  // classe sont grisées, sauf si des élèves l'ont en plus (elles valent pour eux).
  function boiteCours(b, ch, avecCase) {
    const c = b.cours;
    const boite = el("div", "cours-boite");
    const tete = el("div", "cours-boite-tete");
    const vus = ch.fiches.filter(f => ficheOuverte(c, f)).length;
    const precision = `${insecable(ch.id)} · ${vus} fiche${vus > 1 ? "s" : ""} sur ${ch.fiches.length}`;
    // Lot « cours-appli-2 » : le nom court du chapitre, celui que voient les élèves.
    let nom;
    if (avecCase) {
      nom = caseACocher(ch.chapitre || ch.titre, c.chapitres.has(ch.id), coche => {
        if (coche) c.chapitres.add(ch.id); else c.chapitres.delete(ch.id);
        dessinerRegler();
      }, precision);
    } else {
      nom = el("p", "cours-boite-nom", ch.chapitre || ch.titre);
      nom.append(el("small", "", precision));
    }
    const deplie = reglage.deplies.has(`cours:${ch.id}`);
    const bouton = el("button", "secondaire", deplie ? "Les fiches ▴" : "Les fiches ▾");
    bouton.type = "button";
    bouton.setAttribute("aria-expanded", String(deplie));
    bouton.addEventListener("click", () => {
      if (deplie) reglage.deplies.delete(`cours:${ch.id}`); else reglage.deplies.add(`cours:${ch.id}`);
      dessinerRegler();
    });
    tete.append(nom, bouton);
    boite.append(tete);
    if (deplie) {
      const vivantes = (b.classeOuverte && c.chapitres.has(ch.id)) || (b.coursPlus && b.coursPlus.get(ch.id) && b.coursPlus.get(ch.id).size > 0);
      const fiches = el("div", `cours-fiches${vivantes ? "" : " eteintes"}`);
      const rangees = ch.fiches.map(f => ({id: f.id, nouveau: f.nouveau, titre: `${f.n}. ${f.h1}`, precision: [f.type, insecable(f.ids)].filter(Boolean).join(" · "), url: f.url}));
      if (ch.brevet) rangees.push({id: ch.brevet.id, nouveau: false, titre: `🎯 ${nomBrevetProf(ch)}`, precision: "", url: ch.brevet.url});
      rangees.forEach(r => {
        const rangee = el("div", "cours-fiche");
        const texte = document.createDocumentFragment();
        texte.append(r.titre);
        if (r.nouveau) texte.append(" ", el("span", "cours-nouveau", "Nouveau programme"));
        const ouverte = r.nouveau ? c.avec.has(r.id) : !c.sans.has(r.id);
        rangee.append(caseACocher(texte, ouverte, coche => {
          if (r.nouveau) { if (coche) c.avec.add(r.id); else c.avec.delete(r.id); }
          else if (coche) c.sans.delete(r.id); else c.sans.add(r.id);
          dessinerRegler();
        }, r.precision), lienVoir(r.url));
        fiches.append(rangee);
      });
      boite.append(fiches);
    }
    return boite;
  }

  // Correctif de cours-appli-3 (relecture Codex, point 2) : la classe n'a
  // pas Cours, des élèves en ont des chapitres en plus — leurs fiches se
  // règlent ici (les mêmes listes « sans » / « avec » que pour la classe,
  // envoyées seules, sans rouvrir l'appli à la classe). Seuls les chapitres
  // du niveau affiché qu'au moins un élève a en plus (dans le brouillon).
  function dessinerFichesEnPlus(corps, b) {
    const niveau = reglage.niveauCours;
    const leurs = COURS.filter(ch => ch.niveau === niveau && b.coursPlus.get(ch.id) && b.coursPlus.get(ch.id).size > 0);
    if (!leurs.length) return;
    corps.append(el("h3", "", "Leurs fiches"));
    corps.append(el("p", "aide", "Toutes les fiches de ces chapitres sont ouvertes, sauf celles du nouveau programme (à cocher une par une)."));
    leurs.forEach(ch => corps.append(boiteCours(b, ch, false)));
  }

  // ------------------------------- des chapitres en plus pour quelques élèves (lot « cours-appli-3 »)
  //
  // Choix de Gwenaël (question à choix du 14/11/2026) : « En plus pour
  // quelques élèves », comme SPLAT! et Coffres — sous ce qui est ouvert à
  // toute la classe, une ligne par chapitre fermé à la classe (du niveau
  // affiché), « Choisir… » déplie les élèves ; et un raccourci, « Tout le
  // niveau 4e », qui coche ou décoche d'un coup tous ces chapitres pour un
  // élève. On ajoute, on ne retire jamais rien : un chapitre ouvert à la
  // classe n'a pas de ligne, et l'ajout d'un élève qu'il recouvre est gardé
  // (D4). Rien ne part avant « Enregistrer » (eleves.acces, avec « avant »).
  // Les fiches fermées et les fiches du nouveau programme ouvertes de la
  // classe valent aussi pour ces chapitres (le serveur, acces_de_l_eleve).
  //
  // L'état : b.coursPlus, Map chapitre → Set des élèves qui l'ont en plus.
  function coursPlusDesEleves() {
    const parChapitre = new Map(COURS.map(ch => [ch.id, new Set()]));
    (eleves || []).forEach(eleve => {
      const ajout = ajoutDe(eleve, "cours");
      (ajout && Array.isArray(ajout.chapitres) ? ajout.chapitres : []).forEach(id => {
        if (parChapitre.has(id)) parChapitre.get(id).add(eleve.id);
      });
    });
    return parChapitre;
  }
  function coursPlusDe(b, id) {
    if (!b.coursPlus.has(id)) b.coursPlus.set(id, new Set());
    return b.coursPlus.get(id);
  }
  function dessinerCoursEnPlus(corps, b) {
    const niveau = reglage.niveauCours;
    const fermes = COURS.filter(ch => ch.niveau === niveau && !(b.classeOuverte && b.cours.chapitres.has(ch.id)));
    corps.append(el("h3", "", b.classeOuverte ? "En plus pour quelques élèves" : "Ou seulement pour quelques élèves"));
    if (!COURS.some(ch => ch.niveau === niveau)) return;
    if (!fermes.length) {
      corps.append(el("p", "aide", `Tous les chapitres de ${niveau} sont ouverts à la ${classe.libelle} : rien à ajouter.`));
      return;
    }
    corps.append(el("p", "aide", b.classeOuverte
      ? `Les chapitres de ${niveau} fermés à la ${classe.libelle}. Rien n’est retiré à un élève : on ajoute.`
      : `Ils ont « Mes cours » dans leur espace, avec les chapitres choisis ici.`));
    if (fermes.length > 1) corps.append(ligneNiveauCours(niveau, fermes));
    fermes.forEach(ch => corps.append(ligneChapitrePlus(ch)));
  }
  // Une ligne : « Les puissances · Rania, Lucas · Choisir… ».
  function ligneCoursPlus(cleLigne, quoi, qui, quandChange) {
    const ligne = el("details", "plus-ligne cours-plus");
    ligne.open = reglage.deplies.has(cleLigne);
    ligne.addEventListener("toggle", () => {
      if (ligne.open) reglage.deplies.add(cleLigne); else reglage.deplies.delete(cleLigne);
    });
    const resume = document.createElement("summary");
    const quiTexte = el("span", "qui");
    const noms = ordreDeLaFeuille(eleves || []).filter(eleve => qui.has(eleve.id));
    quiTexte.textContent = noms.length ? listeDePrenoms(noms) : "personne";
    quiTexte.classList.toggle("quelquun", noms.length > 0);
    resume.append(quoi, quiTexte, el("span", "choisir", "Choisir…"));
    const grille = grilleDesEleves(qui, () => {
      const touchee = document.activeElement;
      const idTouche = touchee && touchee.dataset ? touchee.dataset.eleve : null;
      quandChange();
      // Redessinée (le raccourci du niveau et les lignes se suivent), la
      // fenêtre rend le focus à la case touchée.
      if (idTouche) dessinerReglerEnGardant(cleLigne, idTouche); else dessinerRegler();
    });
    grille.querySelectorAll("input").forEach((uneCase, index) => {
      const eleve = ordreDeLaFeuille(eleves || [])[index];
      uneCase.dataset.ligne = cleLigne;
      if (eleve) uneCase.dataset.eleve = String(eleve.id);
    });
    ligne.append(resume, grille);
    return ligne;
  }
  function ligneChapitrePlus(ch) {
    const b = reglage.brouillon;
    const quoi = el("span", "quoi", ch.chapitre || ch.titre);
    return ligneCoursPlus(`cours-plus:${ch.id}`, quoi, coursPlusDe(b, ch.id), () => {});
  }
  // Le raccourci : un élève y est coché s'il a TOUS ces chapitres en plus ;
  // le cocher les lui donne tous, le décocher les lui retire tous.
  function ligneNiveauCours(niveau, fermes) {
    const b = reglage.brouillon;
    const aTout = eleve => fermes.every(ch => coursPlusDe(b, ch.id).has(eleve.id));
    const qui = new Set((eleves || []).filter(aTout).map(eleve => eleve.id));
    const quoi = el("span", "quoi", `Tout le niveau ${niveau}`);
    return ligneCoursPlus(`cours-plus-niveau:${niveau}`, quoi, qui, () => {
      (eleves || []).forEach(eleve => {
        const avait = aTout(eleve);
        const veut = qui.has(eleve.id);
        if (veut && !avait) fermes.forEach(ch => coursPlusDe(b, ch.id).add(eleve.id));
        if (!veut && avait) fermes.forEach(ch => coursPlusDe(b, ch.id).delete(eleve.id));
      });
    });
  }
  // Les élèves qui ont au moins un chapitre en plus de ce que la classe a
  // (pour la ligne du haut : « · en plus pour 2 élèves »).
  function elevesCoursEnPlus() {
    const c = coursDeLaClasse();
    const ouverteALaClasse = parLaClasse("cours");
    return (eleves || []).filter(eleve => {
      const ajout = ajoutDe(eleve, "cours");
      return Boolean(ajout) && Array.isArray(ajout.chapitres)
        && ajout.chapitres.some(id => COURS.some(ch => ch.id === id) && !(ouverteALaClasse && c.chapitres.has(id)));
    });
  }


  function nomDeLAppli(cle) {
    return (APPLIS.find(appli => appli.cle === cle) || {nom: cle}).nom;
  }

  // Un élève a-t-il un ajout pour cette appli (rangé par le serveur) ?
  function ajoutDe(eleve, cle) {
    const ajouts = eleve && eleve.ajouts;
    const ajout = ajouts && ajouts[cle];
    return ajout && typeof ajout === "object" && !Array.isArray(ajout) ? ajout : null;
  }

  // Ce numéro lui est-il ajouté ? Oui si l'appli lui est donnée entière ({}),
  // ou si la liste le nomme.
  function numeroAjoute(eleve, cle, liste, numero) {
    const ajout = ajoutDe(eleve, cle);
    if (!ajout) return false;
    if (!Object.keys(ajout).length) return true;
    return Array.isArray(ajout[liste.nom]) && ajout[liste.nom].includes(numero);
  }

  // L'état réel, d'après la classe et les élèves déjà lus : le point de
  // départ du brouillon, et ce à quoi on le compare à l'enregistrement.
  function etatReglage(cle) {
    const listes = {};
    (LISTES_PAR_ELEVE[cle] || []).forEach(liste => {
      listes[liste.nom] = new Set(numerosOuverts(classe.reglages, cle, liste) || liste.numeros.map(([numero]) => numero));
    });
    const entiers = new Set();
    const parNumero = {};
    (eleves || []).forEach(eleve => {
      if (ajoutDe(eleve, cle)) entiers.add(eleve.id);
      (LISTES_PAR_ELEVE[cle] || []).forEach(liste => liste.numeros.forEach(([numero]) => {
        const cleNumero = `${liste.nom}:${numero}`;
        if (!parNumero[cleNumero]) parNumero[cleNumero] = new Set();
        if (numeroAjoute(eleve, cle, liste, numero)) parNumero[cleNumero].add(eleve.id);
      }));
    });
    return {
      cle,
      classeOuverte: parLaClasse(cle),
      records: cle === "defi-tables" ? recordsOuvertsPourLaClasse() : null,
      // Lot 1 « la séance » (planche 7) : la durée et le palier de la classe,
      // puis ceux que le professeur a donnés à quelques élèves (eleve.reglages).
      calcul: cle === "defi-calcul" ? calculDeLaClasse() : null,
      cours: cle === "cours" ? coursDeLaClasse() : null,
      coursPlus: cle === "cours" ? coursPlusDesEleves() : null,
      listes, entiers, parNumero
    };
  }

  function copierEtat(etat) {
    const listes = {};
    Object.keys(etat.listes).forEach(nom => { listes[nom] = new Set(etat.listes[nom]); });
    const parNumero = {};
    Object.keys(etat.parNumero).forEach(cle => { parNumero[cle] = new Set(etat.parNumero[cle]); });
    return {cle: etat.cle, classeOuverte: etat.classeOuverte, records: etat.records, calcul: etat.calcul ? copierCalcul(etat.calcul) : null,
            cours: etat.cours ? copierCours(etat.cours) : null,
            coursPlus: etat.coursPlus ? new Map([...etat.coursPlus].map(([id, qui]) => [id, new Set(qui)])) : null,
            listes, entiers: new Set(etat.entiers), parNumero};
  }

  // La ligne en haut de l'onglet : « ● Ouvert à toute la 405 · … » ou
  // « ● Ouvert à quelques élèves · Rania ». Un onglet que personne ne voit n'a
  // pas cette ligne : il a la carte « … est fermé à la 405 ». « Régler … »
  // pour le propriétaire seulement ; un collègue lit la ligne.
  function poserQuiVoit() {
    const ligne = $("qui-voit");
    const fermee = $("appli-fermee");
    const bouton = $("regler-appli");
    if (!classe || vue !== "appli") { ligne.hidden = true; fermee.hidden = true; $("cours-prof").hidden = true; return; }
    const cle = appliAffichee;
    // Lot S2 : « Ouvrir Défi calcul en mode professeur » (rien n'y est
    // enregistré : tous les droits l'ont).
    $("dc-mode-prof").hidden = cle !== "defi-calcul";
    const nom = nomDeLAppli(cle);
    const proprietaire = droitClasse === "proprietaire";
    const etat = $("qui-voit-etat");
    etat.textContent = "";
    $("regler-appli-mot").textContent = cle === "cours" ? "Régler les cours" : `Régler ${nom}`;
    bouton.setAttribute("aria-label", cle === "cours" ? "Régler les cours" : `Régler ${nom}`);
    bouton.hidden = !proprietaire;
    const point = el("i", "point");
    point.setAttribute("aria-hidden", "true");
    if (parLaClasse(cle)) {
      fermee.hidden = true;
      ligne.hidden = false;
      const fort = el("strong", "", `Ouvert à toute la ${classe.libelle}`);
      etat.append(point, fort);
      const details = detailsDeLaClasse(cle);
      if (details.length) etat.append(" ", el("span", "", `· ${details.join(" · ")}`));
      return;
    }
    const qui = ordreDeLaFeuille(eleves || []).filter(eleve => accesDe(eleve).applis.includes(cle));
    if (qui.length) {
      fermee.hidden = true;
      ligne.hidden = false;
      point.classList.add("quelques");
      etat.append(point, el("strong", "", "Ouvert à quelques élèves"), " ",
        el("span", "", `· ${listeDePrenoms(qui)}`));
      return;
    }
    // Personne : l'onglet est grisé, et dedans la carte (planche 7).
    ligne.hidden = true;
    fermee.hidden = false;
    $("af-titre").textContent = `${nom} est fermé à la ${classe.libelle}`;
    $("af-texte").textContent = proprietaire
      ? `Aucun élève de la ${classe.libelle} ne le voit dans son espace. Ouvre-le à toute la classe, ou seulement à quelques élèves.`
      : `Aucun élève de la ${classe.libelle} ne le voit dans son espace.`;
    $("af-toute").textContent = `Ouvrir à toute la ${classe.libelle}`;
    $("af-actions").hidden = !proprietaire;
    // Lot « cours-appli-3 » : Cours aussi, chapitre par chapitre.
    $("af-quelques").hidden = false;
    if (cle === "cours") $("af-texte").textContent = `Les élèves de la ${classe.libelle} n’ont pas « Mes cours » dans leur espace.`;
    // Pendant un enregistrement (le raccourci lui-même, ou la fenêtre), les
    // deux boutons attendent (correctif, point 2 : une seule écriture à la fois).
    ["af-toute", "af-quelques"].forEach(id => { $(id).disabled = reglageEnCours; });
  }

  // « Rania, Lucas, Alice et 2 autres » : trois prénoms au plus, sur une ligne.
  function listeDePrenoms(liste) {
    const noms = liste.map(eleve => nomAffiche(eleve) || "un élève sans prénom");
    if (noms.length <= 3) return noms.join(", ");
    const reste = noms.length - 3;
    return `${noms.slice(0, 3).join(", ")} et ${reste} autre${reste > 1 ? "s" : ""}`;
  }

  // Ce que dit la ligne après « Ouvert à toute la 405 » : les réglages de la
  // classe qui ne sont pas « tout », et combien d'élèves ont quelque chose en
  // plus — en mots courts.
  function detailsDeLaClasse(cle) {
    const details = [];
    if (cle === "defi-tables") details.push(recordsOuvertsPourLaClasse() ? "les records sont ouverts" : "sans les records");
    if (cle === "defi-calcul") details.push(...texteCalcul(calculDeLaClasse()));
    // Cours (lot « cours-appli-3 ») : rien pour la classe mais des élèves
    // en plus — la tuile apparaît pour eux, la ligne ne dit plus le contraire.
    const coursEnPlus = cle === "cours" ? elevesCoursEnPlus().length : 0;
    if (cle === "cours") {
      const c = coursDeLaClasse();
      details.push(coursEnPlus && !COURS.some(ch => c.chapitres.has(ch.id)) ? "aucun chapitre pour toute la classe" : texteCoursOuverts(c));
    }
    (LISTES_PAR_ELEVE[cle] || []).forEach(liste => {
      const ouverts = numerosOuverts(classe.reglages, cle, liste);
      if (!ouverts) return;
      if (liste.nom === "operations") {
        details.push(ouverts.map(numero => libelleDe(liste, numero).toLocaleLowerCase("fr")).join(", "));
      } else {
        // « mondes 1, 2, 5 », mais « niveau 2 » quand il n'y en a qu'un.
        details.push(ouverts.length > 1 ? `${liste.nom} ${ouverts.join(", ")}` : motDe(liste, ouverts[0]));
      }
    });
    const enPlus = (eleves || []).filter(eleve => (LISTES_PAR_ELEVE[cle] || []).some(liste => {
      const ouverts = numerosOuverts(classe.reglages, cle, liste);
      return ouverts && liste.numeros.some(([numero]) => !ouverts.includes(numero) && numeroAjoute(eleve, cle, liste, numero));
    })).length + coursEnPlus;
    if (enPlus) details.push(`en plus pour ${enPlus} élève${enPlus > 1 ? "s" : ""}`);
    return details;
  }

  // « Enquête », « Division » : le libellé d'un numéro.
  function libelleDe(liste, numero) {
    const trouve = liste.numeros.find(([n]) => n === numero);
    return trouve ? trouve[1] : String(numero);
  }

  function ouvrirRegler(cle) {
    if (!classe || droitClasse !== "proprietaire" || reglageEnCours) return;
    const depart = etatReglage(cle);
    reglage = {depart, brouillon: copierEtat(depart), classeId: classe.id, deplies: new Set()};
    messager("regler-message", "", "");
    dessinerRegler();
    occuperRegler(false);
    const boite = $("regler");
    if (!boite.open) boite.showModal();
  }

  // Fermée (Annuler, ✕ ou Échap), la fenêtre oublie son brouillon et ses
  // prénoms. Pendant un enregistrement, elle ne se ferme pas.
  function fermerRegler() {
    reglage = null;
    ["regler-titre", "regler-sous", "regler-corps"].forEach(id => { $(id).textContent = ""; });
    messager("regler-message", "", "");
  }

  function caseACocher(texte, coche, quandChange, petit) {
    const etiquette = el("label", "case-a-cocher");
    const uneCase = document.createElement("input");
    uneCase.type = "checkbox";
    uneCase.checked = Boolean(coche);
    uneCase.addEventListener("change", () => quandChange(uneCase.checked, uneCase));
    // Le texte et sa précision dans un seul bloc, l'une sous l'autre (dans
    // l'étiquette en flex, la précision passait à droite du texte).
    const mots = el("span", "mots");
    mots.append(texte);
    if (petit) mots.append(el("small", "", petit));
    etiquette.append(uneCase, mots);
    return etiquette;
  }

  // La grille des élèves (ordre et numéros de la feuille prénom ↔ code).
  function grilleDesEleves(coches, quandChange, precision) {
    const grille = el("div", "grille-cases");
    ordreDeLaFeuille(eleves || []).forEach((eleve, index) => {
      const nom = nomAffiche(eleve);
      const texte = nom ? document.createTextNode(nom) : el("span", "sans-prenom", `n° ${index + 1} (sans prénom)`);
      grille.append(caseACocher(texte, coches.has(eleve.id), coche => {
        if (coche) coches.add(eleve.id); else coches.delete(eleve.id);
        quandChange();
      }, precision ? precision(eleve) : ""));
    });
    return grille;
  }

  // Le dessin de la fenêtre, d'après le brouillon (redessinée à chaque case
  // qui change ce qu'on montre : la case de la classe, un monde).
  function dessinerRegler() {
    if (!reglage || !classe) return;
    const b = reglage.brouillon;
    const cle = b.cle;
    const nom = nomDeLAppli(cle);
    const listes = LISTES_PAR_ELEVE[cle] || [];
    $("regler-titre").textContent = cle === "cours" ? "Régler les cours" : `Régler ${nom}`;
    $("regler-sous").textContent = cle === "cours"
      ? `Les chapitres et les fiches que trouvent les élèves de la ${classe.libelle} dans « Mes cours ».`
      : `Ce que trouvent les élèves de la ${classe.libelle} dans leur espace.`;
    const corps = $("regler-corps");
    corps.textContent = "";
    corps.append(caseACocher(`Ouvert à toute la ${classe.libelle}`, b.classeOuverte, coche => {
      b.classeOuverte = coche;
      dessinerRegler();
    }));
    corps.lastChild.classList.add("case-classe");
    // L'appli Cours : chapitres et fiches, pour la classe seulement.
    // Lot « cours-appli-3 » : puis les chapitres en plus pour quelques
    // élèves (ou seulement pour eux, quand la classe n'a pas l'appli).
    if (cle === "cours") {
      messager("regler-message", "", "");
      if (!reglage.niveauCours) reglage.niveauCours = niveauDeDepart(b.cours);
      if (b.classeOuverte) dessinerReglerCours(corps, b);
      else {
        // Correctif (relecture Codex, point 3) : vrai même quand quelques
        // élèves l'ont en plus — le pied dit qui le voit.
        corps.append(el("p", "aide", `« Mes cours » n’est pas ouvert à toute la ${classe.libelle}.`));
        dessinerNiveauxCours(corps, b);
      }
      dessinerCoursEnPlus(corps, b);
      if (!b.classeOuverte) {
        dessinerFichesEnPlus(corps, b);
        direQuiVoit();
      }
      return;
    }
    if (!b.classeOuverte) {
      // La classe ne l'a pas : l'appli ENTIÈRE pour quelques élèves (D3).
      corps.append(el("h3", "", "Ou seulement pour quelques élèves"));
      corps.append(el("p", "aide", `Ils ont ${nom} dans leur espace.`));
      corps.append(grilleDesEleves(b.entiers, direQuiVoit, eleve => {
        // Un ajout gardé alors que la classe a perdu l'appli (D4) peut ne
        // nommer que certains numéros : on le dit.
        const ajout = ajoutDe(eleve, cle);
        if (!ajout || !Object.keys(ajout).length || !b.entiers.has(eleve.id)) return "";
        const seulement = listes.map(liste => (ajout[liste.nom] || []).map(numero => motDe(liste, numero)).join(", ")).filter(Boolean);
        return seulement.length ? `seulement : ${seulement.join(" · ")}` : "";
      }));
      direQuiVoit();
      // Relecture Codex (point 3) : Défi calcul ouvert à quelques élèves
      // seulement — leur durée et leur palier se voient et se changent ici
      // (sinon, ceux de la classe).
      if (cle === "defi-calcul") {
        const c = b.calcul;
        // Fermée à la classe, sa durée et son palier ne se changent pas ici :
        // ceux du départ (les lignes se lisent par rapport à eux).
        c.minutes = reglage.depart.calcul.minutes;
        c.palier = reglage.depart.calcul.palier;
        corps.append(...autrementPourQuelquesEleves());
        corps.append(el("p", "aide", `Les autres : ${c.minutes} minutes, ${PALIERS_CALCUL[c.palier - 1][2].replace(/^J/, "j")}.`));
      }
      return;
    }
    messager("regler-message", "", "");
    // La classe l'a : ses réglages pour la classe, puis ce qui est fermé à la
    // classe, à ouvrir en plus à quelques élèves.
    if (cle === "defi-tables" || cle === "defi-calcul" || listes.length) corps.append(el("h3", "", "Pour la classe"));
    if (cle === "defi-tables") {
      corps.append(caseACocher("🏆 Les records", b.records, coche => { b.records = coche; },
        `Le concours de temps des Légendes des tables. Décoché : la ${classe.libelle} ne le voit pas et n’y apparaît pas.`));
    }
    if (cle === "defi-calcul") corps.append(...choixCalcul());
    listes.forEach(liste => corps.append(...casesDeLaClasse(cle, liste)));
    const fermes = [];
    listes.forEach(liste => liste.numeros.forEach(([numero]) => {
      if (!b.listes[liste.nom].has(numero)) fermes.push({liste, numero});
    }));
    if (cle === "defi-calcul") { corps.append(...autrementPourQuelquesEleves()); return; }
    if (!listes.length) {
      corps.append(el("p", "deja", `Toute la ${classe.libelle} le voit déjà.`));
      return;
    }
    corps.append(el("h3", "", cle === "splat" ? "Un monde en plus pour quelques élèves" : "En plus pour quelques élèves"));
    if (!fermes.length) {
      corps.append(el("p", "aide", cle === "splat"
        ? `Tous les mondes sont ouverts à la ${classe.libelle} : rien à ajouter.`
        : `Tout est ouvert à la ${classe.libelle} : rien à ajouter.`));
      return;
    }
    corps.append(el("p", "aide", `${cle === "splat" ? "Les mondes fermés" : "Ce qui est fermé"} à la ${classe.libelle}. Rien n’est retiré à un élève : on ajoute.`));
    fermes.forEach(({liste, numero}) => corps.append(lignePlus(cle, liste, numero)));
  }

  // Les cases de la classe pour une liste (les mondes en puces, comme
  // avant dans Réglages ; les niveaux et opérations en cases). La dernière
  // case cochée ne se décoche pas : une classe garde au moins un monde.
  function casesDeLaClasse(cle, liste) {
    const b = reglage.brouillon;
    const ouverts = b.listes[liste.nom];
    const titre = el("p", "titre-liste", liste.titre);
    titre.id = `regler-${cle}-${liste.nom}`;
    const groupe = el("div", cle === "splat" ? "puces-mondes" : "cases-ligne");
    groupe.setAttribute("role", "group");
    groupe.setAttribute("aria-labelledby", titre.id);
    liste.numeros.forEach(([numero, libelle]) => {
      const changer = (coche, uneCase) => {
        if (!coche && ouverts.size === 1) {
          uneCase.checked = true;
          messager("regler-message", DERNIER_NUMERO[liste.nom] || "Il en faut au moins un.", "erreur");
          return;
        }
        if (coche) ouverts.add(numero); else ouverts.delete(numero);
        messager("regler-message", "", "");
        dessinerRegler();
        const pareil = $("regler-corps").querySelector(`input[data-liste="${liste.nom}"][data-numero="${numero}"]`);
        if (pareil) pareil.focus();
      };
      if (cle === "splat") {
        const puce = el("label", `puce-monde${ouverts.has(numero) ? "" : " ferme"}`);
        puce.dataset.monde = String(numero);
        const uneCase = document.createElement("input");
        uneCase.type = "checkbox";
        uneCase.checked = ouverts.has(numero);
        uneCase.dataset.liste = liste.nom;
        uneCase.dataset.numero = String(numero);
        uneCase.addEventListener("change", () => changer(uneCase.checked, uneCase));
        const rond = el("i", "", String(numero));
        rond.setAttribute("aria-hidden", "true");
        puce.append(uneCase, rond, libelle);
        groupe.append(puce);
      } else {
        const etiquette = caseACocher(libelle, ouverts.has(numero), changer);
        const uneCase = etiquette.querySelector("input");
        uneCase.dataset.liste = liste.nom;
        uneCase.dataset.numero = String(numero);
        groupe.append(etiquette);
      }
    });
    return [titre, groupe];
  }

  // Lot 1 « la séance » de Défi calcul (12/11/2026, planche 7 validée) :
  // « Pour la classe », la durée d'une séance (10 ou 15 minutes) et jusqu'où
  // va l'appli (les bases, CM1, CM2, vers la 6e) ; puis « Autrement pour
  // quelques élèves » : une ligne par valeur différente de celle de la
  // classe, sur le modèle de lignePlus. Le choix de l'élève l'emporte.
  // « Nouveautés par séance » (lot F1) n'existe plus.
  const MINUTES_CALCUL = [10, 15];
  // Lot K1b « les bases en trois classes » (26/11/2026) : l'appli a six
  // étages, un par classe. Le réglage part au serveur sous le nom « etage »
  // (1 le CP … 6 vers la 6e : tout) ; l'ancien « palier » (1 à 4), encore dans
  // une ligne de la base, nous revient déjà traduit (lib/applis.php,
  // reglages_anciens_repris). Dans ce fichier, l'état de la fenêtre garde son
  // nom d'avant (`palier`, `elevePalier`) : c'est le numéro de l'étage.
  // Lot K2 « le professeur » (28/11/2026, planche K2-6) : le réglage se dit
  // en ceintures (« Jusqu'à quelle ceinture »), la classe à côté. Les
  // données ne changent pas : c'est toujours l'étage, de 1 à 6.
  const PALIERS_CALCUL = [[1, "Ceinture blanche-jaune · CP", "Ceinture blanche-jaune · CP"],
    [2, "Ceinture jaune · CE1", "Ceinture jaune · CE1"], [3, "Ceinture jaune-orange · CE2", "Ceinture jaune-orange · CE2"],
    [4, "Ceinture orange · CM1", "Ceinture orange · CM1"], [5, "Ceinture verte · CM2", "Ceinture verte · CM2"],
    [6, "Ceinture bleue · 6e (tout)", "Ceinture bleue · 6e"]];
  const minutesValable = n => (MINUTES_CALCUL.includes(n) ? n : 10);
  const palierValable = n => (Number.isInteger(n) && n >= 1 && n <= PALIERS_CALCUL.length ? n : PALIERS_CALCUL.length);

  // Ce que la classe a (classe.reglages), et ce que chaque élève a de
  // différent (eleve.reglages, rangé à part par le serveur) : deux tables
  // élève → valeur. Un élève dont le choix est celui de la classe la suit.
  function calculDeLaClasse() {
    const r = (classe && classe.reglages && classe.reglages["defi-calcul"]) || {};
    const minutes = minutesValable(r.minutes);
    const palier = palierValable(r.etage);
    const eleveMinutes = new Map();
    const elevePalier = new Map();
    (eleves || []).forEach(eleve => {
      const propre = (eleve.reglages && eleve.reglages["defi-calcul"]) || {};
      if (MINUTES_CALCUL.includes(propre.minutes) && propre.minutes !== minutes) eleveMinutes.set(eleve.id, propre.minutes);
      if (Number.isInteger(propre.etage) && propre.etage >= 1 && propre.etage <= PALIERS_CALCUL.length && propre.etage !== palier) elevePalier.set(eleve.id, propre.etage);
    });
    return {minutes, palier, eleveMinutes, elevePalier};
  }

  function copierCalcul(c) {
    return {minutes: c.minutes, palier: c.palier, eleveMinutes: new Map(c.eleveMinutes), elevePalier: new Map(c.elevePalier)};
  }

  // Les élèves réglés autrement que la classe (dans un état de la fenêtre).
  function autrementQueLaClasse(c) {
    const ids = new Set();
    c.eleveMinutes.forEach((valeur, id) => { if (valeur !== c.minutes) ids.add(id); });
    c.elevePalier.forEach((valeur, id) => { if (valeur !== c.palier) ids.add(id); });
    return ids;
  }

  // La ligne de l'onglet : « 10 minutes · jusqu'à la 6e · autrement pour 2 élèves ».
  function texteCalcul(c) {
    const morceaux = [`${c.minutes} minutes`, PALIERS_CALCUL[c.palier - 1][2].replace(/^J/, "j")];
    const autrement = autrementQueLaClasse(c).size;
    if (autrement) morceaux.push(`autrement pour ${autrement} élève${autrement > 1 ? "s" : ""}`);
    return morceaux;
  }

  // Un groupe de boutons ronds (un seul choix), son titre et son aide.
  function choixRonds(id, titreTexte, options, valeur, quandChange, aideTexte) {
    const titre = el("p", "titre-liste", titreTexte);
    titre.id = id;
    const groupe = el("div", "cases-ligne choix-nombre");
    groupe.setAttribute("role", "radiogroup");
    groupe.setAttribute("aria-labelledby", id);
    options.forEach(([nombre, libelle]) => {
      const etiquette = el("label", "case-a-cocher");
      const rond = document.createElement("input");
      rond.type = "radio";
      rond.name = id;
      rond.value = String(nombre);
      rond.checked = valeur === nombre;
      rond.addEventListener("change", () => { if (rond.checked) quandChange(nombre); });
      etiquette.append(rond, el("span", "mots", libelle));
      groupe.append(etiquette);
    });
    return [titre, groupe, el("p", "aide", aideTexte)];
  }

  // Les six ceintures, l'une sous l'autre (planche K2-6).
  function enColonne(morceaux) {
    morceaux[1].classList.add("choix-colonne");
    return morceaux;
  }

  function choixCalcul() {
    const c = reglage.brouillon.calcul;
    // Changer la valeur de la classe redessine : les lignes « autrement »
    // sont les valeurs différentes de la nouvelle.
    return [
      ...choixRonds("regler-defi-calcul-minutes", "Durée d’une séance", MINUTES_CALCUL.map(n => [n, `${n} minutes`]), c.minutes,
        n => { c.minutes = n; dessinerReglerEnGardant("regler-defi-calcul-minutes"); },
        "15 minutes : plus de temps pour apprendre, pour une classe qui en a besoin."),
      ...enColonne(choixRonds("regler-defi-calcul-palier", "Jusqu’à quelle ceinture", PALIERS_CALCUL.map(([n, libelle]) => [n, libelle]), c.palier,
        n => { c.palier = n; dessinerReglerEnGardant("regler-defi-calcul-palier"); },
        "Tout est ouvert jusqu’à cette ceinture. Au-delà, l’élève ne voit pas les étages, et ce qu’il y a déjà gagné ne revient pas dans ses calculs du jour."))
    ];
  }

  // Redessine la fenêtre et rend le focus au rond (ou à la case) touché.
  function dessinerReglerEnGardant(nom, valeur = null) {
    const actif = document.activeElement;
    const valeurActive = actif && actif.value;
    dessinerRegler();
    const selecteur = valeur !== null ? `input[data-ligne="${nom}"][data-eleve="${valeur}"]` : `input[name="${nom}"][value="${valeurActive}"]`;
    const pareil = $("regler-corps").querySelector(selecteur);
    if (pareil) pareil.focus();
  }

  function autrementPourQuelquesEleves() {
    const c = reglage.brouillon.calcul;
    const lignes = [];
    MINUTES_CALCUL.filter(n => n !== c.minutes).forEach(n => lignes.push(ligneAutrement("minutes", n, `${n} minutes`, c.eleveMinutes)));
    PALIERS_CALCUL.filter(([n]) => n !== c.palier).forEach(([n, , libelle]) => lignes.push(ligneAutrement("palier", n, libelle, c.elevePalier)));
    return [el("h3", "", "Autrement pour quelques élèves"), el("p", "aide", "Le choix de l’élève l’emporte sur celui de la classe."), ...lignes];
  }

  // « 15 minutes · Rania, Lucas · Choisir… » : les élèves qui ont cette
  // valeur. Un élève n'a qu'une valeur par réglage : le cocher ici le retire
  // de l'autre ligne ; le décocher le rend à la classe.
  function ligneAutrement(nom, valeur, libelle, table) {
    const cleLigne = `calcul:${nom}:${valeur}`;
    const qui = new Set([...table.entries()].filter(([, v]) => v === valeur).map(([id]) => id));
    const ligne = el("details", "plus-ligne calcul-plus");
    ligne.open = reglage.deplies.has(cleLigne);
    ligne.addEventListener("toggle", () => {
      if (ligne.open) reglage.deplies.add(cleLigne); else reglage.deplies.delete(cleLigne);
    });
    const resume = document.createElement("summary");
    const quoi = el("span", "quoi", libelle);
    const quiTexte = el("span", "qui");
    const noms = ordreDeLaFeuille(eleves || []).filter(eleve => qui.has(eleve.id));
    quiTexte.textContent = noms.length ? listeDePrenoms(noms) : "personne";
    quiTexte.classList.toggle("quelquun", noms.length > 0);
    resume.append(quoi, quiTexte, el("span", "choisir", "Choisir…"));
    const grille = grilleDesEleves(qui, () => {
      (eleves || []).forEach(eleve => {
        if (qui.has(eleve.id)) table.set(eleve.id, valeur);
        else if (table.get(eleve.id) === valeur) table.delete(eleve.id);
      });
      const touchee = document.activeElement;
      const idTouche = touchee && touchee.dataset ? touchee.dataset.eleve : null;
      dessinerReglerEnGardant(cleLigne, idTouche);
    });
    grille.querySelectorAll("input").forEach((uneCase, index) => {
      const eleve = ordreDeLaFeuille(eleves || [])[index];
      uneCase.dataset.ligne = cleLigne;
      if (eleve) uneCase.dataset.eleve = String(eleve.id);
    });
    ligne.append(resume, grille);
    return ligne;
  }

  // La valeur propre d'un élève dans un état de la fenêtre (undefined : il
  // suit la classe).
  function valeurPropre(c, nom, id) {
    const table = nom === "minutes" ? c.eleveMinutes : c.elevePalier;
    return table.has(id) && table.get(id) !== c[nom] ? table.get(id) : undefined;
  }

  // Ce que la fenêtre envoie pour un élève : le paquet complet de sa colonne.
  // Relecture Codex (point 1) : seul ce que la fenêtre a CHANGÉ (brouillon
  // différent du départ) part, posé sur ses réglages ACTUELS (eleve.reglages,
  // remis à jour par un 409) — un palier donné dans un autre onglet n'est
  // pas effacé par une fenêtre qui ne touchait que la durée.
  function reglagesVoulus(eleve, c, d) {
    const actuels = eleve.reglages && typeof eleve.reglages === "object" && !Array.isArray(eleve.reglages) ? eleve.reglages : {};
    const propre = Object.assign({}, actuels["defi-calcul"] && typeof actuels["defi-calcul"] === "object" ? actuels["defi-calcul"] : {});
    // (Lot K1b : l'étage part sous le nom « etage ».)
    [["minutes", "minutes"], ["palier", "etage"]].forEach(([nom, envoye]) => {
      const voulu = valeurPropre(c, nom, eleve.id);
      if (voulu === valeurPropre(d, nom, eleve.id)) return;
      if (voulu === undefined) delete propre[envoye]; else propre[envoye] = voulu;
    });
    const tout = Object.assign({}, actuels);
    if (Object.keys(propre).length) tout["defi-calcul"] = propre; else delete tout["defi-calcul"];
    return tout;
  }

  function reglagesCanoniques(r) {
    const sortie = {};
    Object.keys(r || {}).sort().forEach(cle => {
      const reglage = r[cle];
      if (!reglage || typeof reglage !== "object") return;
      const copie = {};
      Object.keys(reglage).sort().forEach(nom => { copie[nom] = reglage[nom]; });
      if (Object.keys(copie).length) sortie[cle] = copie;
    });
    return JSON.stringify(sortie);
  }

  const DERNIER_NUMERO = {
    mondes: "Une classe garde au moins un monde ouvert.",
    niveaux: "Une classe garde au moins un niveau ouvert.",
    operations: "Une classe garde au moins une opération ouverte."
  };

  // Une ligne « ③ Enquête · Alice, Lucas · Choisir… » ; « Choisir… » déplie
  // les élèves dessous (un <details> : le clavier et le lecteur d'écran le
  // connaissent). Une ligne dépliée le reste quand la fenêtre se redessine.
  function lignePlus(cle, liste, numero) {
    const b = reglage.brouillon;
    const cleNumero = `${liste.nom}:${numero}`;
    if (!b.parNumero[cleNumero]) b.parNumero[cleNumero] = new Set();
    const qui = b.parNumero[cleNumero];
    const ligne = el("details", "plus-ligne");
    ligne.open = reglage.deplies.has(cleNumero);
    ligne.addEventListener("toggle", () => {
      if (ligne.open) reglage.deplies.add(cleNumero); else reglage.deplies.delete(cleNumero);
    });
    const resume = document.createElement("summary");
    const quoi = el("span", "quoi");
    if (cle === "splat") {
      const rond = el("span", "rond-monde", String(numero));
      rond.setAttribute("aria-hidden", "true");
      rond.style.background = COULEURS_MONDES[numero] || "#0b67b2";
      quoi.append(rond, libelleDe(liste, numero));
    } else {
      quoi.textContent = liste.nom === "niveaux" ? `Niveau ${numero}` : libelleDe(liste, numero);
    }
    const quiTexte = el("span", "qui");
    const poserQui = () => {
      const noms = ordreDeLaFeuille(eleves || []).filter(eleve => qui.has(eleve.id));
      quiTexte.textContent = noms.length ? listeDePrenoms(noms) : "personne";
      quiTexte.classList.toggle("quelquun", noms.length > 0);
    };
    poserQui();
    resume.append(quoi, quiTexte, el("span", "choisir", "Choisir…"));
    ligne.append(resume, grilleDesEleves(qui, poserQui));
    return ligne;
  }

  // Le pied, quand la classe n'a pas l'appli : qui la verra après
  // « Enregistrer ».
  function direQuiVoit() {
    if (!reglage) return;
    const b = reglage.brouillon;
    if (b.classeOuverte) return;
    // Cours (lot « cours-appli-3 ») : ceux qui ont au moins un chapitre en plus.
    const qui = ordreDeLaFeuille(eleves || []).filter(eleve => (b.cle === "cours"
      ? [...b.coursPlus.values()].some(ids => ids.has(eleve.id)) : b.entiers.has(eleve.id)));
    const nom = nomDeLAppli(b.cle);
    if (!qui.length) {
      messager("regler-message", `Personne ne verra ${nom}.`, "info");
      return;
    }
    const noms = qui.map(eleve => nomAffiche(eleve) || "un élève sans prénom");
    const sujet = noms.length === 1 ? noms[0]
      : noms.length <= 3 ? `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}` : `${noms.length} élèves`;
    messager("regler-message", `${sujet} ${noms.length > 1 ? "le voient" : "le voit"} dans ${noms.length > 1 ? "leur" : "son"} espace.`, "info");
  }

  // Ce qui part au serveur pour la classe : {applis?, reglages?, avant}, ou
  // null quand rien de la classe ne change. Les réglages de l'appli ne
  // partent que si la classe l'a (cachés, ils sont gardés tels quels).
  // Correctif (relecture Codex du 30/10, point 1) : « avant » — la liste des
  // applis et les réglages de CETTE appli tels que la page les croit rangés.
  // Un autre onglet les a changés entre-temps ? Le serveur refuse (409) au
  // lieu d'écraser (un monde refermé ailleurs serait rouvert, un Anzan
  // ajouté ailleurs retiré) : comme eleves.acces depuis le lot 3c.
  function changementsDeLaClasse(depart, b) {
    const charge = {};
    if (b.classeOuverte !== depart.classeOuverte) {
      const autres = ((classe && classe.applis) || []).filter(cle => cle !== b.cle);
      charge.applis = b.classeOuverte ? autres.concat([b.cle]) : autres;
    }
    if (b.classeOuverte) {
      const pourLAppli = {};
      if (b.cle === "defi-tables" && b.records !== depart.records) pourLAppli.records = b.records;
      if (b.cle === "defi-calcul" && b.calcul.minutes !== depart.calcul.minutes) pourLAppli.minutes = b.calcul.minutes;
      if (b.cle === "defi-calcul" && b.calcul.palier !== depart.calcul.palier) pourLAppli.etage = b.calcul.palier;
      // L'appli Cours : les trois listes partent ensemble dès que l'une change.
      if (b.cle === "cours" && !memesCours(b.cours, depart.cours)) Object.assign(pourLAppli, coursEnvoye(b.cours));
      (LISTES_PAR_ELEVE[b.cle] || []).forEach(liste => {
        const avant = [...depart.listes[liste.nom]].sort((x, y) => x - y);
        const apres = [...b.listes[liste.nom]].sort((x, y) => x - y);
        if (avant.join(",") !== apres.join(",")) pourLAppli[liste.nom] = apres;
      });
      if (Object.keys(pourLAppli).length) charge.reglages = {[b.cle]: pourLAppli};
    }
    // Correctif de cours-appli-3 (relecture Codex, point 2) : la classe sans
    // Cours, les fiches de ses élèves « en plus » — « sans » et « avec »
    // partent seuls (les chapitres de la classe ne sont pas touchés).
    if (!b.classeOuverte && b.cle === "cours" && !memesCours(b.cours, depart.cours)) {
      const {sans, avec} = coursEnvoye(b.cours);
      charge.reglages = {cours: {sans, avec}};
    }
    if (!Object.keys(charge).length) return null;
    charge.avant = avantDeLaClasse(b.cle);
    return charge;
  }

  // L'état de la classe tel que la page le connaît, pour « avant » : sa
  // liste d'applis, et les réglages d'une appli (« {} » quand tout est
  // ouvert, comme tableau les rend).
  function avantDeLaClasse(cle) {
    const reglages = (classe && classe.reglages) || {};
    const reglage = reglages[cle];
    return {
      applis: ((classe && classe.applis) || []).slice(),
      reglages: {[cle]: reglage && typeof reglage === "object" && !Array.isArray(reglage) ? reglage : {}}
    };
  }

  // Un 409 de la classe porte son état vrai (applis, reglages) : posé tout
  // de suite dans la page — même si la relecture qui suit ne passe pas, le
  // prochain « avant » sera juste.
  function poserEtatDeClasse(donnees) {
    if (!classe || !donnees) return;
    if (Array.isArray(donnees.applis)) classe.applis = donnees.applis.filter(cle => typeof cle === "string");
    if (donnees.reglages && typeof donnees.reglages === "object" && !Array.isArray(donnees.reglages)) classe.reglages = donnees.reglages;
    // Lot B2 : la liste du jour vraie, qui part avec un 409.
    if (Array.isArray(donnees.jour)) classe.jour = donnees.jour.filter(cle => typeof cle === "string");
    // Lot B3 : les portes possibles vraies (celles de la classe et celles de
    // quelques élèves), et celles de la classe seule — voir portesDuJour.
    poserPortesDeClasse(donnees);
  }

  // Un 409 d'un élève porte ses ajouts vrais (et ce qu'il voit) : posés sur
  // l'élève de la page (relecture Codex, point 5 : avant, le contenu du 409
  // n'était pas appliqué, et une relecture en panne laissait l'ancien).
  //
  // Correctif après la relecture Codex (point 6) : aussi la réponse d'un envoi
  // RÉUSSI (avant, elle était jetée : une relecture ratée laissait l'ancien
  // accès), sur toutes les listes déjà lues ; et les portes du jour de sa
  // classe (« classe_portes »), seulement si c'est encore la classe ouverte.
  function poserAccesDeLEleve(eleve, donnees) {
    if (!eleve || !donnees) return;
    if (donnees.ajouts && typeof donnees.ajouts === "object" && !Array.isArray(donnees.ajouts)) eleve.ajouts = donnees.ajouts;
    if (donnees.acces && typeof donnees.acces === "object" && Array.isArray(donnees.acces.applis)) eleve.acces = donnees.acces;
    reporterAccesDeLaListe([eleve]);
    const portes = donnees.classe_portes;
    if (classe && portes && typeof portes === "object" && portes.classe_id === classe.id) poserPortesDeClasse(portes);
  }

  // Deux états d'ajouts disent-ils la même chose ? Lus comme ajoutsApres
  // les lit (listes triées, vides écartées), clés rangées.
  function ajoutsCanoniques(ajouts) {
    const sortie = {};
    Object.keys(ajouts || {}).sort().forEach(cle => {
      const ajout = ajouts[cle];
      if (!ajout || typeof ajout !== "object" || Array.isArray(ajout)) return;
      const copie = {};
      Object.keys(ajout).sort().forEach(nom => {
        // Des numéros (mondes, niveaux) ou des chapitres du livret (Cours) :
        // « a - b » ne range pas des textes.
        if (Array.isArray(ajout[nom]) && ajout[nom].length) copie[nom] = [...new Set(ajout[nom])].sort((a, b) => (typeof a === "number" && typeof b === "number" ? a - b : String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0));
      });
      if (Object.keys(ajout).length && !Object.keys(copie).length) return;
      sortie[cle] = copie;
    });
    return JSON.stringify(sortie);
  }

  function memesAjouts(a, b) {
    return ajoutsCanoniques(a) === ajoutsCanoniques(b);
  }

  // Après une relecture : ce que la fenêtre voulait pour la classe est-il
  // en place ? (La case de la classe si la liste des applis est partie ;
  // les records et chaque liste envoyés.) Sert quand la réponse de l'écriture
  // s'est perdue (point 6) : en place = enregistré, sinon à refaire.
  function classeConforme(pourLaClasse, b, neuf) {
    if (pourLaClasse.applis && neuf.classeOuverte !== b.classeOuverte) return false;
    const voulu = pourLaClasse.reglages && pourLaClasse.reglages[b.cle];
    if (!voulu) return true;
    if ("records" in voulu && neuf.records !== b.records) return false;
    if ("minutes" in voulu && neuf.calcul.minutes !== b.calcul.minutes) return false;
    if ("etage" in voulu && neuf.calcul.palier !== b.calcul.palier) return false;
    if (("chapitres" in voulu || "sans" in voulu || "avec" in voulu) && !memesCours(neuf.cours, b.cours)) return false;
    return Object.keys(voulu).every(nom => {
      if (nom === "records" || nom === "minutes" || nom === "etage" || nom === "chapitres" || nom === "sans" || nom === "avec") return true;
      const a = [...b.listes[nom]].sort((x, y) => x - y).join(",");
      const c = [...(neuf.listes[nom] || [])].sort((x, y) => x - y).join(",");
      return a === c;
    });
  }

  // Les gestes d'un élève (ce que le brouillon change pour lui), dans la
  // partie de la fenêtre qu'on voit : l'appli entière quand la classe ne
  // l'a pas ; sinon, les numéros fermés à la classe (dans le brouillon).
  // Ce qu'on ne voit pas n'est pas touché : un ajout « rattrapé » par la
  // classe est gardé (D4).
  function gestesDe(eleve, depart, b) {
    const gestes = [];
    // Lot « cours-appli-3 » : les chapitres fermés à la classe (tous, si elle
    // n'a pas l'appli), tous niveaux confondus — le niveau affiché n'est
    // qu'un filtre. Un chapitre ouvert à la classe n'est pas touché (D4).
    if (b.cle === "cours") {
      COURS.forEach(ch => {
        if (b.classeOuverte && b.cours.chapitres.has(ch.id)) return;
        const avait = Boolean(depart.coursPlus && depart.coursPlus.get(ch.id) && depart.coursPlus.get(ch.id).has(eleve.id));
        const veut = Boolean(b.coursPlus && b.coursPlus.get(ch.id) && b.coursPlus.get(ch.id).has(eleve.id));
        if (avait !== veut) gestes.push({cle: "cours", chapitre: ch.id, ouvre: veut});
      });
      return gestes;
    }
    if (!b.classeOuverte) {
      const avait = depart.entiers.has(eleve.id);
      const veut = b.entiers.has(eleve.id);
      if (avait !== veut) gestes.push({cle: b.cle, ouvre: veut});
      return gestes;
    }
    (LISTES_PAR_ELEVE[b.cle] || []).forEach(liste => liste.numeros.forEach(([numero]) => {
      if (b.listes[liste.nom].has(numero)) return;
      const cleNumero = `${liste.nom}:${numero}`;
      const avait = Boolean(depart.parNumero[cleNumero] && depart.parNumero[cleNumero].has(eleve.id));
      const veut = Boolean(b.parNumero[cleNumero] && b.parNumero[cleNumero].has(eleve.id));
      if (avait !== veut) gestes.push({cle: b.cle, liste: liste.nom, numero, ouvre: veut});
    }));
    return gestes;
  }

  function occuperRegler(occupe) {
    const corps = $("regler-corps");
    corps.setAttribute("aria-busy", String(occupe));
    corps.querySelectorAll("input, summary").forEach(champ => {
      if (champ.tagName === "INPUT") champ.disabled = occupe;
      else champ.tabIndex = occupe ? -1 : 0;
    });
    ["regler-enregistrer", "regler-annuler", "regler-croix"].forEach(id => { $(id).disabled = occupe; });
  }

  // Un appel borné dans le temps : passé DELAI_ACCES_MS, l'attente s'arrête
  // et la page dit que le serveur ne répond pas (il a peut-être écrit :
  // tout est relu après).
  async function appelBorne(action, corps) {
    const garde = new AbortController();
    const minuteur = setTimeout(() => garde.abort(), DELAI_ACCES_MS);
    try {
      return await api(action, corps, {signal: garde.signal});
    } catch (erreur) {
      if (erreur.name === "AbortError" || erreur.name === "TypeError") {
        const muet = new Error("Le serveur ne répond pas.");
        muet.statut = 0;
        throw muet;
      }
      throw erreur;
    } finally {
      clearTimeout(minuteur);
    }
  }

  // La relecture qui suit un enregistrement, bornée elle aussi (correctif,
  // point 4) : avant, un « tableau » qui ne répondait pas laissait la fenêtre
  // grisée pour toujours. Vrai si la classe est relue, faux sinon.
  async function relireBornee(classeId) {
    const garde = new AbortController();
    const minuteur = setTimeout(() => garde.abort(), DELAI_ACCES_MS);
    try {
      return Boolean(await ouvrirClasse(classeId, {signal: garde.signal}));
    } catch (_) {
      return false;
    } finally {
      clearTimeout(minuteur);
    }
  }

  // Le mot de la fin, quand la relecture n'a pas pu se faire (point 4).
  const SANS_VERIFICATION = "La vérification n’a pas pu se faire : recharge la page pour voir l’état.";

  async function enregistrerRegler() {
    if (!reglage || reglageEnCours || !classe || droitClasse !== "proprietaire") return;
    const {depart, brouillon: b, classeId} = reglage;
    const nom = nomDeLAppli(b.cle);
    const libelle = classe.libelle;
    const pourLaClasse = changementsDeLaClasse(depart, b);
    const aChanger = (eleves || []).map(eleve => ({eleve, gestes: gestesDe(eleve, depart, b)}))
      .filter(({gestes}) => gestes.length);
    // Lot 1 « la séance » : les élèves de Défi calcul réglés autrement (ou
    // rendus à la classe) — eleves.reglages, un appel chacun.
    // Relecture Codex (point 3) : aussi quand l'appli n'est ouverte qu'à
    // quelques élèves.
    const aRegler = b.cle === "defi-calcul"
      ? (eleves || []).map(eleve => ({eleve, reglages: reglagesVoulus(eleve, b.calcul, depart.calcul)}))
        .filter(({eleve, reglages}) => reglagesCanoniques(reglages) !== reglagesCanoniques(eleve.reglages))
      : [];
    if (!pourLaClasse && !aChanger.length && !aRegler.length) { $("regler").close(); return; }
    if (pourLaClasse && pourLaClasse.applis && !lesApplisConnues(pourLaClasse.applis).length) {
      messager("regler-message", "Une classe garde au moins une activité.", "erreur");
      return;
    }
    if (pourLaClasse && pourLaClasse.applis && !b.classeOuverte && !await demander(
      `Retirer ${nom} de la classe ${libelle} ? La tuile disparaît de l’espace des élèves`
      + `${aChanger.length || depart.entiers.size ? " (sauf ceux qui l’ont en plus)" : ""}. `
      + (b.cle === "cours" ? "" : `Leur travail reste enregistré : rien n’est effacé.`),
      null, {oui: "Retirer de la classe"})) {
      return;
    }
    // La fenêtre a pu être fermée, ou la classe changée, pendant la question.
    if (!reglage || reglage.brouillon !== b || !classe || classe.id !== classeId) return;
    const session = generation;
    const encoreLa = () => generation === session && Boolean(jeton);
    // La classe ouverte est-elle toujours celle de la fenêtre ? (Supprimée
    // ou plus partagée pendant l'envoi : quitterLaClasse l'a refermée.)
    const memeClasse = () => Boolean(classe) && classe.id === classeId;
    reglageEnCours = true;
    occuperRegler(true);
    messager("regler-message", "Enregistrement…", "info");
    // Le verrou est rendu dans un finally gardé par la génération (point 4) :
    // quoi qu'il arrive, la fenêtre se libère — sauf si la page a changé de
    // session entre-temps (oublierEtat l'a déjà rendu, pour la session neuve).
    try {
      let classeEcrite = false;
      let erreurClasse = null;   // refusée (statut reçu) ou sans réponse (statut 0)
      let coupe = null;          // un 401 : la session est finie
      const reussis = [];        // écrits, réponse reçue
      const rates = [];          // {eleve, erreur} : refusés, ou sans réponse (statut 0)
      if (pourLaClasse) {
        try {
          const reponse = await appelBorne("classes.modifier", Object.assign({classe_id: classeId}, pourLaClasse));
          classeEcrite = true;
          // Correctif B3 (Codex, point 6) : les portes du jour d'après l'écriture.
          if (encoreLa() && memeClasse()) poserPortesDeClasse(reponse);
        } catch (erreur) {
          if (erreur.statut === 401) coupe = erreur;
          else {
            erreurClasse = erreur;
            if (erreur.statut === 409 && encoreLa() && memeClasse()) poserEtatDeClasse(erreur.donnees);
          }
        }
      }
      // La classe refusée : on n'envoie rien pour les élèves (le brouillon
      // formait un tout — « seulement pour Rania » n'a de sens que si la
      // classe est bien fermée).
      if (!coupe && !erreurClasse) {
        for (const {eleve, gestes} of aChanger) {
          if (!encoreLa() || !memeClasse()) break;
          let ajouts = eleve.ajouts || {};
          gestes.forEach(geste => { ajouts = ajoutsApres(ajouts, geste); });
          try {
            const reponse = await appelBorne("eleves.acces", {eleve_id: eleve.id, avant: eleve.ajouts || {}, ajouts});
            reussis.push(eleve);
            // Correctif B3 (Codex, point 6) : la réponse n'est plus jetée — ce
            // que voit l'élève, et les portes du jour de sa classe, tiennent même
            // si la relecture qui suit échoue. Vérifié APRÈS l'attente : la
            // classe ouverte est-elle toujours la sienne ?
            if (encoreLa() && memeClasse()) poserAccesDeLEleve(eleve, reponse);
          } catch (erreur) {
            if (erreur.statut === 401) { coupe = erreur; break; }
            if (erreur.statut === 409 && encoreLa() && memeClasse()) poserAccesDeLEleve(eleve, erreur.donnees);
            rates.push({eleve, erreur, ajouts});
          }
        }
        for (const {eleve, reglages} of aRegler) {
          if (coupe || !encoreLa() || !memeClasse()) break;
          try {
            await appelBorne("eleves.reglages", {eleve_id: eleve.id, avant: eleve.reglages || {}, reglages});
            if (!reussis.includes(eleve)) reussis.push(eleve);
          } catch (erreur) {
            if (erreur.statut === 401) { coupe = erreur; break; }
            if (erreur.statut === 409 && encoreLa() && erreur.donnees && erreur.donnees.reglages) eleve.reglages = erreur.donnees.reglages;
            rates.push({eleve, erreur, reglages});
          }
        }
      }
      // Déconnecté (et peut-être reconnecté) pendant l'envoi : cette réponse
      // n'est plus à cette page. Elle ne touche ni la fenêtre, ni l'état, ni
      // la session neuve — un vieux 401 ne la déconnecte pas (relecture du
      // lot 3d). oublierEtat a déjà remis reglageEnCours à faux.
      if (!encoreLa()) return;
      if (coupe) { surErreur(coupe, "regler-message"); return; }
      if (!memeClasse()) return;
      // Tout relire : la classe, ses élèves, ce que chacun voit (le serveur a
      // pu ranger autrement, un autre onglet a pu écrire). Bornée (point 4) ;
      // et si elle ne passe pas, rien n'est redessiné dessus (point 5).
      const relu = await relireBornee(classeId);
      if (!encoreLa()) return;
      if (!memeClasse()) return;
      const neuf = relu ? etatReglage(b.cle) : null;
      // Le bilan (point 6) : « refusé » (un statut reçu) n'est pas
      // « sans réponse » (statut 0). Sans réponse mais relu : ce qui est en
      // place est enregistré, le reste est à refaire ; pas relu : peut-être.
      const fait = [];
      const manques = [];
      let incertain = false;
      let finDite = false;   // la phrase de la classe changée ailleurs dit déjà « la fenêtre montre l'état actuel »
      const phrase = texte => (/[.!?…]$/.test(texte) ? texte : `${texte}.`);
      const prenomDe = eleve => nomAffiche(eleve) || "un élève sans prénom";
      if (pourLaClasse) {
        const sansReponse = erreurClasse && !erreurClasse.statut;
        if (classeEcrite) fait.push(`la ${libelle}`);
        else if (sansReponse && neuf && classeConforme(pourLaClasse, b, neuf)) {
          // Écrite, la réponse perdue : confirmée par la relecture. Les
          // élèves, eux, n'ont pas été envoyés (la classe n'avait pas
          // répondu) : ils restent à faire, la fenêtre le dit.
          fait.push(`la ${libelle}`);
          // Relecture Codex (point 2) : les réglages des élèves aussi.
          const pasEnvoyes = [];
          aChanger.concat(aRegler).forEach(({eleve}) => { if (!pasEnvoyes.includes(eleve)) pasEnvoyes.push(eleve); });
          if (pasEnvoyes.length) manques.push(`Pas enregistré pour ${pasEnvoyes.map(prenomDe).join(", ")} : la ${libelle} n’avait pas répondu.`);
        }
        else if (erreurClasse && erreurClasse.statut === 409) {
          // Un autre onglet a changé la classe (point 1) : rien n'est parti,
          // ni pour elle ni pour les élèves ; la fenêtre, relue, le dit.
          finDite = relu;
          manques.push(relu
            ? `La ${libelle} a été changée ailleurs : la fenêtre montre l’état actuel, refais ton réglage.`
            : `La ${libelle} a été changée ailleurs : rien n’est enregistré.`);
        }
        else if (!sansReponse) manques.push(phrase(`Rien d’enregistré pour la ${libelle} : ${raisonDe(erreurClasse)}`));
        else if (neuf) manques.push(phrase(`Pas enregistré pour la ${libelle} : ${raisonDe(erreurClasse)}`));
        else { incertain = true; manques.push(`Peut-être enregistré pour la ${libelle} (le serveur n’a pas répondu).`); }
      }
      const confirmes = reussis.slice();
      rates.forEach(({eleve, erreur, ajouts, reglages}) => {
        const sansReponse = !erreur.statut;
        if (sansReponse && neuf) {
          const relue = (eleves || []).find(autre => autre.id === eleve.id);
          const enPlace = relue && (reglages ? reglagesCanoniques(relue.reglages) === reglagesCanoniques(reglages) : memesAjouts(relue.ajouts || {}, ajouts));
          if (enPlace) { if (!confirmes.includes(eleve)) confirmes.push(eleve); return; }
        }
        if (!sansReponse) {
          manques.push(phrase(`Pas enregistré pour ${prenomDe(eleve)} : ${erreur.statut === 409 ? "un autre onglet l’a changé entre-temps" : raisonDe(erreur)}`));
        } else if (neuf) {
          manques.push(phrase(`Pas enregistré pour ${prenomDe(eleve)} : ${raisonDe(erreur)}`));
        } else {
          incertain = true;
          manques.push(`Peut-être enregistré pour ${prenomDe(eleve)} (le serveur n’a pas répondu).`);
        }
      });
      if (confirmes.length) fait.push(confirmes.length === 1 ? prenomDe(confirmes[0]) : `${confirmes.length} élèves`);
      if (!manques.length && relu) {
        occuperRegler(false);
        if ($("regler").open) $("regler").close();
        messager("message-appli", `${nom} : réglages enregistrés (${fait.join(" et ")}).`, "ok");
        return;
      }
      // Quelque chose n'est pas passé, ou n'a pas pu être vérifié : la
      // fenêtre reste et dit ce qui est enregistré et ce qui ne l'est pas.
      // Relue : sur l'état relu. Pas relue : telle quelle (jamais un
      // brouillon « actuel » sur des données qui ne le sont pas) ; son
      // prochain « Enregistrer » part avec « avant », le serveur tranche.
      if ($("regler").open && reglage && reglage.brouillon === b) {
        if (neuf) {
          const depliees = reglage.deplies;
          reglage = {depart: neuf, brouillon: copierEtat(neuf), classeId, deplies: depliees};
          dessinerRegler();
        }
        occuperRegler(false);
        const morceaux = [];
        if (fait.length) morceaux.push(phrase(`Enregistré : ${fait.join(" et ")}`));
        morceaux.push(...manques);
        if (!finDite) morceaux.push(relu ? "La fenêtre montre ce qui est enregistré maintenant : refais ce qui manque." : SANS_VERIFICATION);
        messager("regler-message", morceaux.join(" "), incertain || !relu || manques.length ? "erreur" : "ok");
      }
    } finally {
      if (encoreLa()) {
        reglageEnCours = false;
        // La ligne du haut (et les boutons de la carte, grisés pendant
        // l'enregistrement par poserQuiVoit) suivent le verrou rendu — et
        // la carte des Réglages (lot B2, correctif Codex, point 7).
        rafraichirApresVerrou();
      }
    }
  }

  // « Ouvrir à toute la 306 », depuis la carte d'un onglet grisé : un geste
  // sans perte (rien n'est effacé, un autre geste le retire), comme cocher
  // la case dans « Régler … ». Correctif (points 2, 3, 4) : il prend le même
  // verrou que la fenêtre (reglageEnCours — « Choisir quelques élèves » et
  // « Régler » attendent qu'il ait fini), il est borné, il envoie « avant »,
  // et une réponse d'une ancienne session ou d'une autre classe ne fait rien.
  async function ouvrirATouteLaClasse() {
    if (!classe || droitClasse !== "proprietaire" || reglageEnCours) return;
    const cle = appliAffichee;
    const nom = nomDeLAppli(cle);
    const classeId = classe.id;
    const session = generation;
    const encoreLa = () => generation === session && Boolean(jeton);
    const memeClasse = () => Boolean(classe) && classe.id === classeId;
    reglageEnCours = true;
    ["af-toute", "af-quelques"].forEach(id => { $(id).disabled = true; });
    try {
      const applis = ((classe.applis) || []).filter(autre => autre !== cle).concat([cle]);
      let erreur = null;
      try {
        await appelBorne("classes.modifier", {classe_id: classeId, applis, avant: {applis: ((classe.applis) || []).slice()}});
      } catch (e) {
        erreur = e;
      }
      if (!encoreLa()) return;
      if (erreur && erreur.statut === 401) { surErreur(erreur, "message-appli"); return; }
      if (!memeClasse()) return;
      if (erreur && erreur.statut === 409) poserEtatDeClasse(erreur.donnees);
      const relu = await relireBornee(classeId);
      if (!encoreLa() || !memeClasse()) return;
      const ouverte = ((classe.applis) || []).includes(cle);
      if (relu && ouverte) {
        messager("message-appli", cle === "cours"
          ? `Cours ouvert à toute la ${classe.libelle} : coche maintenant les chapitres dans « Régler les cours ».`
          : `${nom} ouvert à toute la ${classe.libelle} : la tuile apparaît dans l’espace des élèves.`, "ok");
      } else if (erreur && erreur.statut === 409) {
        messager("message-appli", relu
          ? `La ${classe.libelle} a été changée ailleurs : l’onglet montre l’état actuel, réessaie.`
          : `La ${classe.libelle} a été changée ailleurs : rien n’est enregistré. ${SANS_VERIFICATION}`, "erreur");
      } else if (erreur && erreur.statut) {
        messager("message-appli", erreur.message, "erreur");
      } else if (erreur) {
        messager("message-appli", relu
          ? `${nom} : pas enregistré pour la ${classe.libelle}. ${raisonDe(erreur)}`
          : `${nom} : peut-être ouvert à la ${classe.libelle} (le serveur n’a pas répondu). ${SANS_VERIFICATION}`, "erreur");
      } else {
        messager("message-appli", `${nom} ouvert à toute la ${classe.libelle}. ${SANS_VERIFICATION}`, "erreur");
      }
    } finally {
      // Les boutons se libèrent toujours (poserQuiVoit les suit aussi) ; le
      // verrou, seulement pour la session qui l'a pris.
      ["af-toute", "af-quelques"].forEach(id => { $(id).disabled = false; });
      if (encoreLa()) { reglageEnCours = false; rafraichirApresVerrou(); }
    }
  }

  function dessinerTableau() {
    trierEleves();
    const ecriture = droitClasse !== "lecture";
    // La liste de l'onglet Élèves suit chaque dessin du tableau (lot « Ma
    // classe : élèves ») : un nouveau code, un élève ajouté ou supprimé.
    dessinerOngletEleves(ecriture);
    const corps = $("corps");
    corps.textContent = "";
    // Lot « Qui voit quoi », lot 4b : les lignes de l'onglet — toute la
    // classe, ou, pour une appli que la classe n'a pas, les élèves qui l'ont
    // en plus (elevesDeLOnglet).
    const toutes = elevesDeLOnglet();
    // Serveur pro, lot 5c : la recherche ne garde que les prénoms cherchés ;
    // la ligne du haut et les cartes parlent toujours de toute la classe.
    const lignes = filtrerRecherche(toutes);
    idsAffiches = lignes.map(eleve => eleve.id);
    poserTris();
    $("outils-tableau").hidden = !toutes.length;
    const fin = () => {
      finirOnglet(toutes);
      direAucun(corps, toutes, lignes);
      // Lot S2 : « La classe » se redessine avec le tableau (un prénom
      // changé, une liste relue) ; ‹ › suivent alors SON ordre.
      // Correctif après Codex (point 1) : hors de La classe, ses zones sont
      // vidées — un élève supprimé, une autre classe ne laissent aucun
      // prénom dans le tableau ni dans les cartes cachés. De même pour les
      // cartes de Défi calcul hors de son onglet.
      if (vue === "classe") dessinerLaClasse();
      else viderZonesClasse();
      if (appliAffichee !== "defi-calcul") viderZonesCalcul();
      // Une fenêtre ouverte suit le nouveau dessin (un prénom changé, un
      // élève parti) ; elle se ferme si son élève n'est plus là.
      if (fenetreEleveId !== null) dessinerFenetreEleve();
    };
    // Lot « splat-suivi-4 » : l'onglet SPLAT! a ses colonnes et sa carte.
    if (appliAffichee === "splat") { dessinerTableauSplat(corps, ecriture, lignes); fin(); return; }
    // Lot « Coffres magiques sur le suivi » : l'onglet Coffres et ses niveaux.
    if (appliAffichee === "coffres") { dessinerTableauCoffres(corps, ecriture, lignes); fin(); return; }
    // Lot 4b : l'onglet Anzan et son compte.
    if (appliAffichee === "flash-anzan") { dessinerTableauAnzan(corps, ecriture, lignes); fin(); return; }
    // Lot 2b de Défi calcul : son onglet, ses cartes.
    if (appliAffichee === "defi-calcul") { dessinerTableauCalcul(corps, ecriture, lignes); fin(); return; }

    lignes.forEach(eleve => {
      const ligne = document.createElement("tr");

      const cNom = celluleNomTexte(eleve);

      const cAcquises = document.createElement("td");
      const nombre = eleve.lu.acquises.length;
      cAcquises.innerHTML = `<span class="pastille ${nombre ? "p-vert" : "p-gris"}">${nombre} / 9</span>`;
      // La liste s'écrit (lot 2b) : une info-bulle ne se lit ni au téléphone
      // ni sur une feuille. Les 9 tables : le compte suffit.
      if (nombre && nombre < 9) {
        const liste = document.createElement("span");
        liste.className = "acquises-liste";
        // Au-delà de la moitié, ce qui reste est plus court à lire.
        const reste = PARCOURS.TABLES.filter(table => !eleve.lu.acquises.includes(table));
        liste.textContent = reste.length <= 3 ? `reste ${reste.join(", ")}` : eleve.lu.acquises.join(", ");
        cAcquises.append(liste);
      }

      // « En cours » : une ligne courte (décision du 03/10), et la table qui
      // dure juste à côté.
      const cEnCours = document.createElement("td");
      const enCours = eleve.lu.enCours;
      const texte = document.createElement("span");
      texte.className = `en-cours ${enCours.type}`;
      if (enCours.type === "table") {
        const table = document.createElement("b");
        table.textContent = `table de ${enCours.tables[0]}`;
        const cases = document.createElement("span");
        cases.className = "cases";
        cases.textContent = ` · ${enCours.pleines} sur ${enCours.total}`;
        texte.append(table, cases);
      } else if (enCours.type === "tables") {
        const tables = document.createElement("b");
        tables.textContent = enCours.texte;
        texte.append(tables);
      } else {
        texte.textContent = enCours.texte;
        if (enCours.type === "rien") texte.style.color = "var(--muted)";
        if (enCours.type === "expert" && eleve.lu.couronne) texte.title = "Légende des tables";
      }
      cEnCours.append(texte);
      // Lot « Les records » : le record de la Légende à côté de sa couronne.
      if (eleve.record && Number.isInteger(eleve.record.meilleur) && PARCOURS.formatTemps) {
        const temps = document.createElement("span");
        temps.className = "rec-temps";
        temps.textContent = PARCOURS.formatTemps(eleve.record.meilleur);
        temps.title = "Son record aux 25 questions";
        cEnCours.append(temps);
      }
      if (eleve.lu.longue) {
        const alerte = document.createElement("span");
        alerte.className = "alerte";
        alerte.textContent = `${eleve.lu.longue.seances} séances dessus`;
        cEnCours.append(alerte);
      }

      // Les séances des 4 dernières semaines (lot 5g), et l'élève qu'on ne
      // voit plus.
      const cSemaine = document.createElement("td");
      cSemaine.append(celluleSemaines(eleve.lu));
      const absence = joursSansRien(eleve);
      if (absence !== null) {
        const alerte = document.createElement("span");
        alerte.className = "alerte";
        alerte.textContent = `rien depuis ${absence} jours`;
        cSemaine.append(alerte);
      }

      const cRetard = document.createElement("td");
      const retard = eleve.lu.retard ? eleve.lu.retard.length : null;
      if (retard === null) {
        cRetard.innerHTML = '<span class="pastille p-gris">—</span>';
      } else {
        cRetard.innerHTML = `<span class="pastille ${retard ? "p-orange" : "p-vert"}">${retard}</span>`;
        if (retard) cRetard.title = eleve.lu.retard.map(cle => PARCOURS.libelleFait(cle)).join(" · ");
      }

      const cDate = celluleDate(eleve);

      // Serveur pro, lot 5c : plus de bouton « Parcours » sur la ligne ; lot
      // 5f : à l'ordinateur, la ligne entière ouvre l'écran Mon parcours
      // (voirFiche, billet de lecture) ; au téléphone, la fenêtre de l'élève,
      // où « Voir son parcours » l'ouvre. Au téléphone, trois colonnes :
      // l'élève, les tables passées, le jour.
      [cEnCours, cSemaine, cRetard].forEach(large);
      ligne.append(cNom, cAcquises, cEnCours, cSemaine, cRetard, cDate);
      finirLigne(ligne, eleve, cNom);
      // Lot S4a : au téléphone, « En cours » est caché — sa ligne courte
      // passe sous le prénom (« table de 7 »), avec les séances qui durent.
      indiceTelephone(cNom, enCours.type === "table" ? `table de ${enCours.tables[0]}` : enCours.type === "rien" ? "" : enCours.texte, "");
      if (eleve.lu.longue) indiceTelephone(cNom, `${eleve.lu.longue.seances} séances dessus`, "fort");
      corps.appendChild(ligne);
    });

    dessinerObjectif();
    dessinerFragiles();

    $("resume-classe").textContent = resumeDeLaClasse(eleves);
    fin();
    if (!PARCOURS) {
      messager("message-appli",
        "La progression ne peut pas être détaillée : le moteur de Défi tables (prof/defi_tables_mon_parcours.js) n’a pas pu être chargé — vérifie qu’il est bien déposé sur le serveur.",
        "erreur");
    }
    dessinerPapier();
  }

  // ------------------------------------------------ lot 5c : lignes, recherche

  // Serveur pro, lot 5g : « 2 · 0 · 1 · 3 » — les séances finies de chacune
  // des 4 dernières semaines, la plus ancienne à gauche, la semaine en cours
  // à droite et en gras. « 16+ » : au moins (le moteur ne garde que les 60
  // dernières séances) ; « ? » : plus connu. Rien enregistré : tout est lu
  // dans le parcours (resumeProf).
  function celluleSemaines(lu) {
    const zone = document.createElement("span");
    zone.className = "semaines";
    if (!lu.parcours || !Array.isArray(lu.semaines) || !lu.semaines.length) {
      zone.classList.add("zero");
      zone.textContent = "—";
      return zone;
    }
    const derniere = lu.semaines.length - 1;
    const dates = [];
    lu.semaines.forEach((semaine, index) => {
      if (index) {
        const separateur = document.createElement("span");
        separateur.className = "sep-semaine";
        separateur.textContent = "\u00a0·\u00a0";
        zone.append(separateur);
      }
      const nombre = document.createElement(index === derniere ? "b" : "span");
      nombre.textContent = PARCOURS.texteSemaine(semaine);
      if (semaine.seances === 0 || semaine.seances === null) nombre.className = "zero";
      zone.append(nombre);
      dates.push(`${index === derniere ? "cette semaine" : `semaine du ${dateCourteSemaine(semaine.lundi)}`}\u00a0: ${PARCOURS.texteSemaine(semaine)}`);
    });
    // Lot S4b : l'unité, comme « jours » dans La classe — ici, des séances
    // (deux séances le même jour comptent deux).
    const unite = document.createElement("span");
    unite.className = "lc-unite";
    unite.textContent = " séances";
    zone.append(unite);
    zone.title = `Séances finies — ${dates.join(" · ")}`;
    return zone;
  }

  // « 5 oct. » : le lundi d'une semaine, sans l'année.
  function dateCourteSemaine(jour) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    return d.toLocaleDateString("fr-FR", {day: "numeric", month: "short"});
  }

  // Une cellule cachée au téléphone (le tableau compact garde trois colonnes).
  function large(cellule) {
    cellule.className = cellule.className ? `${cellule.className} large` : "large";
  }

  // La fin de chaque ligne d'élève, dans les quatre applis : la ligne entière
  // s'ouvre (choix de Gwenaël, planche 4 du 25/10/2026). Le prénom devient un
  // bouton — le clavier y arrive, Entrée l'ouvre — et une flèche « › » dit
  // qu'on peut entrer (cachée au téléphone). Le prénom reste posé par
  // textContent.
  // Serveur pro, lot 5f (retours de Gwenaël des 25, 26 et 28/10/2026) :
  //  - la ligne ouvre la fenêtre de l'élève, dans les quatre applis, au
  //    téléphone comme à l'ordinateur ; dans Défi tables, cette fenêtre
  //    montre son écran Mon parcours lui-même (montrerParcours) — aussi pour
  //    un élève qui n'a rien envoyé : son parcours vierge ;
  //  - « Revenir à… » retourne dans un « ⋯ » discret au bout de la ligne,
  //    avant la flèche : en écriture, et s'il y a une version à restaurer
  //    (peutRevenir). Toucher le « ⋯ » ou son menu n'ouvre pas la ligne.
  // Lot 8 (retours du 31/10/2026) : le « ⋯ » dans sa propre case (vide sur
  // les lignes qui n'en ont pas), la flèche seule dans la dernière : elle
  // est au même endroit sur toutes les lignes.
  function finirLigne(ligne, eleve, cNom) {
    ligne.className = "cliquable";
    ligne.dataset.eleve = String(eleve.id);
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "lien-eleve";
    bouton.textContent = cNom.textContent;
    cNom.textContent = "";
    cNom.append(bouton);
    const geste = document.createElement("td");
    geste.className = "geste";
    const gestes = [];
    if (peutRevenir(eleve)) {
      gestes.push(boutonGeste("Revenir à…", "secondaire", () => revenirA(eleve),
        "Revenir à une version précédente de sa progression"));
    }
    // Lot K2 de Défi calcul (28/11/2026, planche K2-6) : « Recommencer Défi
    // calcul à zéro », sous « Revenir à… » — qui le défait pendant 7 jours.
    // (Dans l'onglet Défi calcul, pour qui peut écrire dans la classe, comme
    // « Revenir à… », et un élève qui a déjà envoyé quelque chose.)
    if (appliAffichee === "defi-calcul" && droitClasse !== "lecture" && eleve.maj_le) {
      gestes.push(boutonGeste("Recommencer Défi calcul à zéro", "danger", () => recommencerCalcul(eleve),
        "Ses étoiles, sa ceinture et ses séances repartent de zéro"));
    }
    menuGestes(geste, gestes);
    const va = document.createElement("td");
    va.className = "va";
    const fleche = document.createElement("span");
    fleche.className = "fleche";
    fleche.setAttribute("aria-hidden", "true");
    fleche.textContent = "›";
    va.append(fleche);
    ligne.append(geste, va);
    ligne.addEventListener("click", evenement => {
      const cible = evenement && evenement.target;
      if (cible && typeof cible.closest === "function" && cible.closest(".plus")) return;
      ouvrirFenetreEleve(eleve);
    });
  }

  // La recherche (lot 5c) : sans majuscules ni accents — « lea » trouve Léa,
  // « mae » Maëlys. Un élève sans prénom se trouve par « sans prénom ».
  function sansAccents(texte) {
    return String(texte || "").toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function filtrerRecherche(liste) {
    const voulu = sansAccents(recherche).trim();
    if (!voulu) return liste;
    return liste.filter(eleve => sansAccents(nomAffiche(eleve) || "sans prénom").includes(voulu));
  }

  function oublierRecherche() {
    recherche = "";
    const champ = $("chercher-eleve");
    if (champ) champ.value = "";
  }

  // Lot S4a (08/11/2026) : au téléphone, une colonne cachée garde une ligne
  // courte sous le prénom (« table de 7 », « 1 à voir en classe ») ; à
  // l'ordinateur, rien (la colonne est là). Posé par textContent.
  function indiceTelephone(cNom, texte, genre) {
    if (!texte) return;
    cNom.append(el("span", `indice-tel${genre ? ` ${genre}` : ""}`, texte));
  }

  // Personne ne correspond : une ligne le dit, sous les titres de colonnes.
  function direAucun(corps, toutes, lignes) {
    if (lignes.length || !toutes.length) return;
    const ligne = document.createElement("tr");
    const cellule = document.createElement("td");
    cellule.className = "aucun";
    const entete = document.querySelector("#tableau thead tr:not([hidden])");
    cellule.colSpan = entete ? entete.children.length : 7;
    cellule.textContent = `Aucun élève ne correspond à « ${recherche.trim()} ».`;
    ligne.append(cellule);
    corps.append(ligne);
  }

  // ------------------------------------------------ lot 5c : la fenêtre de l'élève
  //
  // Choix de Gwenaël (planche 4 du 25/10/2026) : UNE fenêtre, la même dans les
  // quatre applis, ‹ › pour l'élève précédent ou suivant dans l'ordre du
  // tableau à l'écran. Coffres, SPLAT! et Anzan : tout est lu dans le tableau
  // déjà chargé, aucun appel au serveur. Rien de ce que renvoie le serveur ne
  // devient du HTML ; aucun code d'élève. Lot 5f : plus de « Revenir à… »
  // dedans (il est dans le « ⋯ » de la ligne), un ✕ en haut ; dans Défi
  // tables (choix de Gwenaël du 28/10/2026), la fenêtre montre son écran Mon
  // parcours dans un cadre, par le billet de lecture d'avant (montrerParcours).

  // Lot S2 : la FICHE de l'élève, la même depuis n'importe quel onglet. Elle
  // s'ouvre sur l'onglet de l'appli d'où l'on vient (« Vue d'ensemble »
  // depuis La classe).
  function ouvrirFenetreEleve(eleve, onglet) {
    if (!classe || !eleve) return;
    ongletFiche = onglet || (vue === "classe" ? "ensemble" : appliAffichee);
    joursFiche = 6;
    seancesFiche = 6;
    jourChoisiFiche = null;
    fenetreEleveId = eleve.id;
    messager("fe-message", "", "");
    dessinerFenetreEleve();
    const boite = $("fenetre-eleve");
    if (fenetreEleveId !== null && !boite.open) boite.showModal();
  }

  // Fermée (bouton, Échap, une autre classe, la déconnexion), elle oublie
  // l'élève.
  function fermerFenetreEleve() {
    const boite = $("fenetre-eleve");
    if (boite && boite.open) { try { boite.close(); } catch (_) {} }
    surFermetureFenetre();
  }

  function surFermetureFenetre() {
    fenetreEleveId = null;
    fermerParcoursAnzan();
    ["fe-titre", "fe-sous", "fe-contenu", "fe-onglets"].forEach(id => { const zone = $(id); if (zone) zone.textContent = ""; });
    // Lot 5f : le cadre du parcours part avec le reste (plus aucun prénom
    // dans la fenêtre) ; un billet encore en route ne rouvre rien
    // (montrerParcours regarde fenetreEleveId).
    delete $("fe-contenu").dataset.eleve;
    messager("fe-message", "", "");
  }

  function eleveDeLaFenetre() {
    return eleveParId(fenetreEleveId);
  }

  // Un élève, dans la liste regardée ou dans n'importe quelle liste lue (lot
  // S2 : la fiche réunit toutes les applis).
  function eleveParId(id) {
    if (id === null || id === undefined) return null;
    const dans = liste => (liste || []).find(eleve => eleve.id === id);
    return dans(eleves) || APPLIS.map(appli => dans(tableaux[appli.cle])).find(Boolean) || null;
  }

  // ‹ (pas = -1) et › (pas = +1) : l'élève voisin dans le tableau à l'écran.
  function voisinDeLaFenetre(pas) {
    const rang = idsAffiches.indexOf(fenetreEleveId);
    if (rang < 0) return null;
    const id = idsAffiches[rang + pas];
    return id === undefined ? null : eleveParId(id);
  }

  function changerEleveDeLaFenetre(pas) {
    const autre = voisinDeLaFenetre(pas);
    if (!autre) return;
    const touche = document.activeElement;
    fenetreEleveId = autre.id;
    joursFiche = 6;
    seancesFiche = 6;
    jourChoisiFiche = null;
    messager("fe-message", "", "");
    dessinerFenetreEleve();
    // Au bout du tableau, la flèche qui a le focus se désactive : le focus
    // passe à l'autre flèche, sinon il sort de la fenêtre et le clavier
    // ne la fait plus défiler.
    if (touche && touche.disabled && (touche.id === "fe-precedent" || touche.id === "fe-suivant")) {
      $(touche.id === "fe-precedent" ? "fe-suivant" : "fe-precedent").focus();
    }
  }

  function dessinerFenetreEleve() {
    const base = eleveDeLaFenetre();
    if (!base || !classe) { fermerFenetreEleve(); return; }
    const onglets = ongletsDeLaFiche(base.id);
    if (!onglets.includes(ongletFiche)) ongletFiche = "ensemble";
    const cle = ongletFiche;
    $("fe-titre").textContent = nomAffiche(base) || "Élève sans prénom";
    const rang = idsAffiches.indexOf(base.id);
    $("fe-sous").textContent = classe.libelle
      + (rang >= 0 && idsAffiches.length > 1 ? ` · ${rang + 1} sur ${idsAffiches.length}` : "");
    $("fe-precedent").disabled = !voisinDeLaFenetre(-1);
    $("fe-suivant").disabled = !voisinDeLaFenetre(1);
    dessinerOngletsFiche(onglets);
    const zone = $("fe-contenu");
    // L'élève dans la liste de l'appli de l'onglet (lue au besoin, sans
    // rappeler le serveur pour une liste déjà là).
    const appli = cle === "ensemble" ? null : cle;
    // Sa liste pas encore lue : la lecture de la classe (une seule, partagée
    // avec La classe et la Vue d'ensemble ; correctif après Codex, points 3
    // et 5) ; la fiche se redessine quand elle finit. Après une panne : la
    // phrase reste, rien n'est relancé tout seul.
    if (appli && listesManquantes().includes(appli)) {
      const lecture = lectureDeLaClasse();
      zone.textContent = "";
      delete zone.dataset.eleve;
      demandeParcours += 1;
      fermerParcoursAnzan();
      $("fe-anzan").hidden = true;
      $("fe-parcours").hidden = true;
      $("fenetre-eleve").classList.remove("avec-parcours");
      $("dc-imprimer").hidden = true;
      $("pa-imprimer").hidden = true;
      zone.append(paragrapheVide(lecture && lecture.fini
        ? `${textePanne([appli], lecture)}. Recharge la page pour réessayer.` : "Lecture de l’appli…"));
      poserPiedFiche();
      return;
    }
    const eleve = appli ? (eleveDe(appli, base.id) || base) : base;
    const anzan = appli === "flash-anzan" && Boolean(ANZAN);
    // Lot 5f : Défi tables, la grande fenêtre et son parcours — même sans
    // rien reçu (correctif des lots 5, point 8 : Mon parcours s'ouvre alors
    // vierge, avec son prénom et sa classe, et sa fiche s'imprime).
    const avecParcours = appli === "defi-tables";
    $("fenetre-eleve").classList.toggle("avec-parcours", avecParcours);
    $("fe-anzan").hidden = !anzan;
    $("fe-parcours").hidden = !avecParcours;
    $("pa-imprimer").hidden = true;
    // Défi calcul (lot 2b) : « Imprimer sa fiche », quand il y a quelque
    // chose à imprimer.
    $("dc-imprimer").hidden = !(appli === "defi-calcul" && CALCUL && CALCUL_CORE && eleve.lu && eleve.lu.commence);
    // Le tableau redessiné (un prénom changé, un autre élève enregistré)
    // redessine la fenêtre : le parcours déjà montré reste, sans nouveau
    // billet ni rechargement.
    if (avecParcours && zone.dataset.eleve === String(eleve.id)) { poserPiedFiche(); return; }
    zone.textContent = "";
    delete zone.dataset.eleve;
    if (anzan) {
      // Un autre élève : sa liste repart à 10 séances.
      if (!parcoursAnzanEleve || parcoursAnzanEleve.id !== eleve.id) ouvrirParcoursAnzan(eleve);
      else { parcoursAnzanEleve = eleve; dessinerParcoursAnzan(); }
    } else {
      fermerParcoursAnzan();
      if (!appli) zone.append(contenuEnsemble(base.id));
      else if (appli === "splat") zone.append(contenuSplat(eleve));
      else if (appli === "coffres") zone.append(contenuCoffres(eleve));
      else if (appli === "defi-calcul") zone.append(contenuCalcul(eleve));
      else if (appli === "flash-anzan") zone.append(paragrapheVide("Le moteur d’Anzan n’a pas pu être chargé."));
      else montrerParcours(eleve, zone);
    }
    poserPiedFiche();
  }

  // Le pied de la fiche : seulement quand il y a quelque chose à imprimer
  // (Défi calcul, Anzan) ; sinon ✕ suffit. La fenêtre garde sa taille.
  function poserPiedFiche() {
    const imprimer = !$("dc-imprimer").hidden || !$("pa-imprimer").hidden;
    $("fenetre-eleve").classList.toggle("sans-pied", !imprimer);
  }

  // Lot 5f (choix de Gwenaël du 28/10/2026) : l'écran Mon parcours de l'élève
  // DANS la fenêtre — la page de mathsgo.re, dans un cadre, ouverte par le
  // même billet de lecture qu'avant (eleves.fiche : usage unique, deux
  // minutes ; la classe en lecture suffit). Le temps du billet, une phrase
  // « Ouverture du parcours… ». Refusé : le message dans la fenêtre, au-dessus
  // du cadre (jamais dans un écran caché). Session terminée : la fenêtre se
  // ferme, la page le dit.
  // Le cadre est enfermé (sandbox) : la page du parcours garde ses scripts et
  // son adresse (mathsgo.re, pour parler au serveur et imprimer la fiche),
  // mais ne peut ni changer l'adresse de cette page-ci, ni la lire — c'est un
  // autre site pour le navigateur.
  async function montrerParcours(eleve, zone) {
    demandeParcours += 1;
    const demande = demandeParcours;
    const nom = deNom(nomAffiche(eleve) || "cet élève");
    zone.dataset.eleve = String(eleve.id);
    const cadre = document.createElement("div");
    cadre.className = "fe-cadre";
    const attente = document.createElement("p");
    attente.className = "fe-attente";
    attente.textContent = `Ouverture du parcours ${nom}…`;
    cadre.append(attente);
    zone.append(cadre);
    const session = generation;
    const encore = () => demande === demandeParcours && fenetreEleveId === eleve.id
      && ongletFiche === "defi-tables" && session === generation && Boolean(jeton);
    try {
      const reponse = await api("eleves.fiche", {eleve_id: eleve.id});
      if (!encore()) return;
      const vue = document.createElement("iframe");
      vue.title = `Mon parcours ${nom}`;
      vue.setAttribute("sandbox", "allow-scripts allow-same-origin allow-modals allow-popups allow-popups-to-escape-sandbox");
      vue.src = `https://mathsgo.re/outils/calcul_mental/defi_tables.html#b=${encodeURIComponent(reponse.billet)}&vue=fiche`;
      cadre.textContent = "";
      cadre.append(vue);
    } catch (erreur) {
      if (!encore()) return;
      if (erreur.statut === 401) { fermerFenetreEleve(); surErreur(erreur, "message-appli"); return; }
      // Rien gardé : ‹ › ou une nouvelle ouverture redemandent un billet.
      delete zone.dataset.eleve;
      attente.textContent = "";
      messager("fe-message", `Le parcours ${nom} n’a pas pu s’ouvrir. ${raisonDe(erreur)}`, "erreur");
    }
  }

  // Les chiffres d'un élève : [libellé, valeur, précision dessous (facultative)].
  function ficheChiffres(lignes) {
    const liste = document.createElement("dl");
    liste.className = "fiche-chiffres";
    lignes.forEach(([libelle, valeur, precision]) => {
      const bloc = document.createElement("div");
      const terme = document.createElement("dt");
      terme.textContent = libelle;
      const donnee = document.createElement("dd");
      donnee.append(document.createTextNode(valeur));
      if (precision) {
        const petit = document.createElement("small");
        petit.textContent = precision;
        donnee.append(petit);
      }
      bloc.append(terme, donnee);
      liste.append(bloc);
    });
    return liste;
  }

  function paragrapheVide(texte) {
    const p = document.createElement("p");
    p.className = "fe-vide";
    p.textContent = texte;
    return p;
  }

  // Lot « Qui voit quoi », lot 4b (24/10/2026) : une appli ouverte EN PLUS à
  // un élève a son onglet même quand la classe ne l'a pas (Anzan, donné à
  // Rania seule : sans ça, son travail ne se voyait nulle part). Dans cet
  // onglet, la classe ne compte pas : seulement les élèves qui voient l'appli
  // (eleve.acces, calculé par le serveur), et ceux qui y ont déjà du travail
  // enregistré (un ajout retiré n'efface rien : on continue de le voir).
  function parLaClasse(cle) {
    return ((classe && classe.applis) || []).includes(cle);
  }

  function elevesDeLOnglet() {
    if (parLaClasse(appliAffichee)) return eleves;
    return eleves.filter(eleve => voitLOnglet(eleve) || aDuTravail(eleve));
  }

  function voitLOnglet(eleve) {
    return accesDe(eleve).applis.includes(appliAffichee);
  }

  // Lot 4b-bis (relecture Codex) : « du travail », c'est ce que le moteur de
  // l'appli dit quand il en a l'idée (Anzan, Coffres : lu.commence — des
  // réglages enregistrés sans un calcul ne comptent pas) ; sinon, une
  // progression enregistrée.
  function aDuTravail(eleve) {
    const lu = eleve && eleve.lu;
    if (lu && typeof lu.commence === "boolean") return lu.commence;
    return Boolean(eleve && eleve.maj_le);
  }

  // Après le dessin d'un onglet d'appli que la classe n'a pas : la ligne
  // au-dessus du tableau le dit, et les cartes « de la classe » (Notre classe,
  // ensemble ; les calculs qui coincent) se taisent — elles parlent de toute
  // la classe, qui n'a pas cette activité.
  // Serveur pro, lot 5b : un onglet grisé (personne ne voit l'appli) sans
  // aucun travail reçu n'a ni tableau ni note dessous — seulement sa carte
  // « … est fermé à la 405 » (poserQuiVoit).
  function finirOnglet(lignes) {
    const vide = !parLaClasse(appliAffichee) && !lignes.length;
    $("enveloppe-tableau").hidden = vide;
    $("note-tableau").hidden = vide;
    if (vide) {
      $("bloc-imprimer").hidden = true;
      $("note-coffres").hidden = true;
      // La carte dit déjà que l'appli est fermée : la ligne du haut compte
      // seulement les élèves de la classe.
      $("objectif").hidden = true;
      $("fragiles").hidden = true;
      $("dc-reprendre").hidden = true;
      const n = (eleves || []).length;
      $("resume-classe").textContent = n ? `${n} élève${n > 1 ? "s" : ""}` : "Aucun élève. Commence par en ajouter.";
      return;
    }
    if (parLaClasse(appliAffichee)) return;
    $("objectif").hidden = true;
    $("fragiles").hidden = true;
    $("dc-reprendre").hidden = true;
    // Lot 4b-bis (remarque de Codex) : ceux qui l'ont encore, et ceux qui ne
    // l'ont plus mais dont le travail reste — comptés à part.
    const n = lignes.filter(voitLOnglet).length;
    const anciens = lignes.length - n;
    const debut = n
      ? `${n} élève${n > 1 ? "s" : ""} · en plus de la classe, qui n’a pas cette activité`
      : "Personne ne l’a en plus pour l’instant · la classe n’a pas cette activité";
    const fin = anciens
      ? ` · ${anciens} n’y ${anciens > 1 ? "ont" : "a"} plus accès (${anciens > 1 ? "leur" : "son"} travail reste)`
      : "";
    $("resume-classe").textContent = debut + fin;
  }

  // La ligne au-dessus du tableau : combien d'élèves, et combien n'ont encore
  // rien fait. Quand tout le monde a commencé, elle le DIT — « 6 élèves ·
  // 0 n'a encore rien fait » (lot 7) était faux de forme exactement le jour
  // où la carte de classe se tait (toute la classe a ouvert l'appli, personne
  // n'a encore acquis de table), alors que cette ligne est ce qui reste pour
  // le dire. Trouvé par Claude Code le 09/09/2026.
  // `aCommence` (lot 4b-bis) : ce qui compte comme « a commencé » — par
  // défaut une progression enregistrée ; pour Anzan, au moins un calcul.
  //
  // Lot « textes justes » (24/10/2026) : le serveur ne sait pas qui n'a « rien
  // fait » — il sait de qui il n'a RIEN REÇU (l'élève a pu travailler hors
  // ligne). La phrase dit donc ce que le serveur sait. `quoi` : « rien reçu »
  // par défaut, « aucun calcul reçu » pour Anzan.
  function resumeDeLaClasse(liste, aCommence = e => Boolean(e.maj_le), quoi = "rien reçu") {
    if (!liste.length) return "Aucun élève. Commence par en ajouter.";
    const sans = liste.filter(e => !aCommence(e)).length;
    const reste = sans === 0
      ? "tout le monde a commencé"
      : `${quoi} pour ${sans}`;
    return `${liste.length} élève${liste.length > 1 ? "s" : ""} · ${reste}`;
  }

  // L'objectif COMMUN de la classe, calculé sur les progressions déjà chargées :
  // aucun appel de plus, et surtout aucun élève désigné. Deux nombres, tous
  // deux additionnés : les tables acquises de tout le monde, et combien ont
  // travaillé cette semaine.
  function objectifDeLaClasse() {
    const lus = eleves.map(eleve => eleve.lu).filter(lu => lu.parcours);
    if (!PARCOURS || !eleves.length) return null;
    const total = eleves.length * PARCOURS.TABLES.length;
    return {
      eleves: eleves.length,
      fait: lus.reduce((somme, lu) => somme + lu.acquises.length, 0),
      total,
      semaine: lus.filter(lu => lu.semaine > 0).length
    };
  }

  function dessinerObjectif() {
    const bloc = $("objectif");
    const objectif = objectifDeLaClasse();
    // La carte ne s'affiche pas tant qu'AUCUNE TABLE n'est acquise dans la
    // classe. « Ensemble : 0 table acquise sur 54 » n'est pas un objectif :
    // c'est la phrase « 12 élèves · 12 n'ont encore rien fait », déjà écrite
    // juste au-dessus, redite sous une forme moins claire — et c'est exactement
    // ce qu'on refuse à l'élève (une barre vide ressemble à un reproche). La
    // carte « les calculs qui coincent » se tait déjà de la même façon.
    //
    // Le seuil porte sur les TABLES, pas sur les parcours enregistrés (essayé
    // le 09/09/2026, corrigé le jour même) : le jour de la distribution des
    // codes, toute la classe ouvre l'appli sans acquérir une table dans
    // l'heure — acquérir demande 20 questions en 1 min 30 avec 2 erreurs au
    // plus. Compter les parcours ramenait donc la barre à zéro exactement le
    // jour qu'on voulait éviter. Ce que la carte perd alors — « N élèves ont
    // travaillé cette semaine » — est déjà dit au-dessus du tableau, et de
    // façon plus utile (« 12 élèves · 2 n'ont encore rien fait »).
    if (!objectif || !objectif.total || !objectif.fait) { bloc.hidden = true; return; }
    const part = Math.max(0, Math.min(1, objectif.fait / objectif.total));
    $("objectif-barre").style.width = `${Math.round(part * 100)}%`;
    // Le singulier, comme sur la tuile de l'élève et sur l'accueil de l'appli :
    // « 1 table acquise », jamais « 1 tables acquises ». Cas rare mais réel —
    // c'est l'état d'une classe le lendemain de la distribution des codes.
    const pluriel = objectif.fait > 1 ? "s" : "";
    $("objectif-compte").textContent =
      `Ensemble : ${objectif.fait} table${pluriel} passée${pluriel} sur ${objectif.total}`;
    // Une seule petite ligne, et c'est le SIGNE DE VIE de la semaine : est-ce
    // que ça tourne, ou pas. « N élèves ont réussi leur mélange » a été écarté
    // le 08/09/2026 : ce nombre DESCEND quand un élève acquiert une table (son
    // mélange repasse « à refaire »), et un objectif de classe qui recule
    // pendant que la classe travaille est un mauvais chiffre.
    const lignes = $("objectif-lignes");
    lignes.textContent = "";
    const li = document.createElement("li");
    const b = document.createElement("b");
    b.textContent = `${objectif.semaine} élève${objectif.semaine > 1 ? "s" : ""}`;
    li.append(b, document.createTextNode(
      objectif.semaine > 1 ? " ont travaillé cette semaine" : " a travaillé cette semaine"));
    lignes.appendChild(li);
    bloc.hidden = false;
  }

  // Ce qu'il faut revoir au tableau lundi matin. Aucune donnée de plus n'est
  // enregistrée : c'est un comptage sur les progressions déjà chargées.
  // Choix de Gwenaël (18/10/2026) : un calcul ne « coince dans cette classe »
  // qu'à partir de 3 élèves. Raté par un ou deux, il se voit dans leur fiche ;
  // avant, un calcul raté par un seul élève pouvait s'afficher ici.
  const SEUIL_FRAGILES = 3;
  function dessinerFragiles() {
    const bloc = $("fragiles");
    const liste = $("fragiles-liste");
    liste.textContent = "";
    garderPopEleves();
    if (!PARCOURS || !PARCOURS.fragilesDeLaClasse) { bloc.hidden = true; return; }
    const parcoursDeLaClasse = eleves.map(eleve => eleve.lu.parcours).filter(Boolean);
    const fragiles = PARCOURS.fragilesDeLaClasse(parcoursDeLaClasse, {max: Infinity})
      .filter(fragile => fragile.eleves >= SEUIL_FRAGILES).slice(0, 6);
    if (!fragiles.length) { bloc.hidden = true; return; }
    $("fragiles-sous").textContent =
      `Sur ${parcoursDeLaClasse.length} élèves qui ont commencé · ${SEUIL_FRAGILES} élèves au moins par calcul.`;
    // Lot S4b : « 5 élèves » se touche — les prénoms, chacun ouvre sa fiche.
    // Le même moteur, élève par élève (rien de plus n'est lu).
    const aTravailler = eleves.filter(eleve => eleve.lu.parcours).map(eleve => ({eleve,
      cles: new Set(PARCOURS.fragilesDeLaClasse([eleve.lu.parcours], {max: Infinity}).map(f => f.cle))}));
    fragiles.forEach(fragile => {
      const li = document.createElement("li");
      const nom = document.createElement("b");
      nom.textContent = fragile.libelle;
      const qui = ordreDeLaFeuille(aTravailler.filter(a => a.cles.has(fragile.cle)).map(a => a.eleve));
      const combien = boutonNombre(`${fragile.eleves} élève${fragile.eleves > 1 ? "s" : ""}`, pop => {
        pop.append(el("strong", "", `${fragile.libelle} · à travailler`));
        pop.append(prenomsEnLiens(qui));
      });
      li.append(nom, combien);
      liste.appendChild(li);
    });
    bloc.hidden = false;
  }

  // ---------------------------------------------------------------- l'onglet SPLAT!
  //
  // Lot « splat-suivi-4 » (08/10/2026, conception D8, planche 4 validée) : une
  // ligne par élève — les six mondes en pastilles, les étapes réussies (« ✨ N »
  // pour les Bonus, comptés à part : choix Q3), la dernière activité —, et un
  // « Détail » qui déplie ses étapes, monde par monde. Tout est construit par
  // createElement et textContent : rien de ce que renvoie le serveur ne
  // devient du HTML. C'est le moteur qui lit le parcours (lireSplat).

  // Les couleurs des six mondes, celles de la carte des mondes et de la tuile
  // de l'espace élève (index.php) — le même dessin partout.
  const COULEURS_MONDES = {1: "#d9690c", 2: "#0b67b2", 3: "#be185d", 4: "#92400e", 5: "#08857f", 6: "#7b42b4"};
  const ETATS_MONDE = {vide: "pas commencé", cours: "en cours", fini: "fini", ferme: "fermé pour la classe"};
  // Un monde fermé à la classe (lot « splat-suivi-5 ») : anneau gris en pointillés,
  // chiffre gris, quel que soit le travail fait — le Détail le montre.
  const GRIS_FERME = "#949eaa";
  // L'état d'une étape (moteur) → la case du Détail.
  const CASES_ETAPE = {reussie: "ok", aide: "aide", cours: "cours", vide: ""};
  const SVG = "http://www.w3.org/2000/svg";

  function elementSvg(nom, attributs) {
    const element = document.createElementNS(SVG, nom);
    Object.keys(attributs).forEach(cle => element.setAttribute(cle, attributs[cle]));
    return element;
  }

  // La pastille d'un monde, dessinée comme dans l'espace élève (index.php,
  // pastilleMonde) : un rond de 24 px — vide, à moitié (en cours), plein
  // (fini) —, le numéro au centre (pied 0,35 em sous le centre), blanc cerné
  // de la couleur sur la moitié. Au survol : « Monde 3 · SPLAT! Enquête : 4 / 15 ».
  function pastilleMonde(monde) {
    const etat = Object.prototype.hasOwnProperty.call(ETATS_MONDE, monde.etat) ? monde.etat : "vide";
    const couleur = COULEURS_MONDES[monde.numero] || "#063f86";
    const dessin = elementSvg("svg", {class: `monde-p ${etat}`, width: "24", height: "24", viewBox: "0 0 24 24",
      focusable: "false"});
    const titre = elementSvg("title", {});
    // Lot « Qui voit quoi » : un monde ouvert à cet élève en plus de sa classe le dit au survol.
    titre.textContent = `Monde ${monde.numero} · ${monde.nom} : ${etat === "ferme" ? ETATS_MONDE.ferme : `${monde.faits} / ${monde.total}`}`
      + (monde.enPlus && etat !== "ferme" ? " · ouvert en plus de la classe" : "");
    dessin.append(titre);
    if (etat === "ferme") {
      dessin.append(elementSvg("circle", {cx: "12", cy: "12", r: "11", fill: "#fff", stroke: GRIS_FERME,
        "stroke-width": "2", "stroke-dasharray": "3.2 2.4"}));
      const chiffreFerme = elementSvg("text", {x: "12", y: "16.375", "text-anchor": "middle", "font-size": "12.5",
        "font-weight": "800", fill: GRIS_FERME});
      chiffreFerme.textContent = String(monde.numero);
      dessin.append(chiffreFerme);
      return dessin;
    }
    dessin.append(elementSvg("circle", {cx: "12", cy: "12", r: "11", fill: etat === "fini" ? couleur : "#fff",
      stroke: couleur, "stroke-width": "2"}));
    if (etat === "cours") dessin.append(elementSvg("path", {d: "M12 1A11 11 0 0 0 12 23Z", fill: couleur}));
    const chiffre = elementSvg("text", {x: "12", y: "16.375", "text-anchor": "middle", "font-size": "12.5",
      "font-weight": "800", fill: etat === "vide" ? couleur : "#fff"});
    if (etat === "cours") {
      chiffre.setAttribute("stroke", couleur);
      chiffre.setAttribute("stroke-width", "3");
      chiffre.setAttribute("stroke-linejoin", "round");
      chiffre.setAttribute("paint-order", "stroke");
    }
    chiffre.textContent = String(monde.numero);
    dessin.append(chiffre);
    return dessin;
  }

  // Les cases du Détail : une rangée par monde (numéros de la carte), puis une
  // rangée de Bonus par monde qui en a, puis la légende.
  // SPLAT! dans la fenêtre de l'élève (serveur pro, lot 5c ; avant, le
  // « Détail ▾ » déplié sous la ligne) : ses chiffres, puis une rangée de
  // cases par monde, les Bonus, la légende.
  // Lot S4c : ce que le parcours garde d'une étape (une date, les séries
  // commencées, les cartes réussies du premier coup, les réponses vues) — le
  // relevé des jours ne dit pas QUELLE étape a été jouée : la bulle s'en
  // tient à l'étape. Réussie : le jour de la première réussite ; en cours :
  // le dernier jour joué et la carte atteinte.
  function texteEtapeSplat(numero, bonus, etat, etape) {
    const nom = bonus ? `Bonus ${numero}` : `Étape ${numero}`;
    if (!etape || etat === "vide" || !etat) return `${nom} · pas encore commencée`;
    const morceaux = [];
    const series = etape.essais > 0 ? pluriel(etape.essais, "série") : "";
    const vues = etape.vues > 0 ? pluriel(etape.vues, "réponse vue", "réponses vues") : "";
    if (etat === "reussie" || etat === "aide") {
      morceaux.push(`${nom} · réussie${etape.date ? ` le ${jourCourtSemaine(etape.date)}` : ""}`);
      if (etape.cartes > 0) morceaux.push(`${etape.etoiles} sur ${etape.cartes} du premier coup`);
    } else {
      morceaux.push(`${nom} · en cours${etape.idx && etape.cartes ? ` : carte ${Math.min(etape.idx, etape.cartes)} sur ${etape.cartes}` : ""}`);
      if (etape.date) morceaux.push(`le ${jourCourtSemaine(etape.date)}`);
    }
    if (series) morceaux.push(series);
    if (vues) morceaux.push(vues);
    return morceaux.join(" · ");
  }

  // « mer. 04/11 » : un jour du parcours, sans heure.
  function jourCourtSemaine(jour) {
    const d = new Date(`${jour}T12:00:00Z`);
    return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", {timeZone: "UTC", weekday: "short", day: "2-digit", month: "2-digit"});
  }

  function contenuSplat(eleve) {
    const cellule = document.createElement("div");
    const lu = eleve.lu || {};
    if (!lu.lisible || !eleve.maj_le) { cellule.append(paragrapheVide("Rien reçu pour l’instant.")); return cellule; }
    cellule.append(ficheChiffres([
      ["Étapes réussies", `${lu.faits} / ${lu.total}`],
      ["Bonus", lu.bonus ? `✨ ${lu.bonus}` : "—"],
      ["Dernière activité", dateLisible(eleve.maj_le) || "rien reçu"]
    ]));
    const titre = document.createElement("h3");
    titre.textContent = "Ses étapes";
    cellule.append(titre);
    const etats = lu.etats || {};
    // Les mondes de L'ÉLÈVE (lot « Qui voit quoi ») : un monde ouvert à lui
    // seul n'a ni cadenas ni pâleur.
    const ouverts = mondesDeLEleve(eleve);
    // Lot S4c : chaque case se touche (ou se survole) — ce que le parcours
    // garde de l'étape, dans une bulle au-dessus de sa rangée (rien ne bouge).
    // Le parcours est relu par le moteur (normaliser : bornes, champs connus)
    // avant qu'on y lise l'étape.
    const normalise = SPLAT.normaliser(eleve.parcours || null);
    const rangee = (titre, etapes, bonus) => {
      if (!etapes.length) return;
      const div = document.createElement("div");
      // un monde fermé à la classe : sa rangée reste (le travail est là), plus pâle
      const ferme = Boolean(ouverts) && !ouverts.includes(etapes[0][4]);
      div.className = ferme ? "detail-monde ferme" : "detail-monde";
      const nom = document.createElement("b");
      nom.textContent = ferme ? `🔒 ${titre}` : titre;
      if (ferme) nom.title = "Monde fermé pour la classe";
      div.append(nom);
      etapes.forEach(etape => {
        const caseEtape = document.createElement("button");
        caseEtape.type = "button";
        caseEtape.className = ["et", bonus ? "bonus" : "", CASES_ETAPE[etats[etape[0]]] || ""].filter(Boolean).join(" ");
        caseEtape.textContent = String(etape[1]);
        const texte = texteEtapeSplat(etape[1], bonus, etats[etape[0]], normalise.etapes[etape[0]]);
        caseEtape.setAttribute("aria-label", texte);
        caseEtape.addEventListener("click", evenement => { evenement.stopPropagation(); montrerBulleCase(caseEtape, texte, true); });
        caseEtape.addEventListener("mouseenter", () => montrerBulleCase(caseEtape, texte, false));
        caseEtape.addEventListener("mouseleave", () => { if (!caseEtape.classList.contains("choisie")) cacherBulleCase(); });
        div.append(caseEtape);
      });
      cellule.append(div);
    };
    // CARTE : [parcours, numéro sur la carte, titre (vide), monde, numéro du monde].
    SPLAT.CARTE.MONDES.forEach(([numero, nom]) =>
      rangee(`Monde ${numero} · ${nom}`, SPLAT.CARTE.ETAPES.filter(etape => etape[4] === numero), false));
    SPLAT.CARTE.MONDES.forEach(([numero]) =>
      rangee(`✨ Bonus du monde ${numero}`, SPLAT.CARTE.BONUS.filter(etape => etape[4] === numero), true));
    const legende = document.createElement("div");
    legende.className = "legende-detail";
    [["et ok", "réussie"], ["et aide", "réussie avec des réponses vues"], ["et cours", "en cours"],
     ["et", "pas encore faite"], ["et bonus ok", "bonus"]].forEach(([classe, texte]) => {
      const morceau = document.createElement("span");
      const pastille = document.createElement("i");
      pastille.className = classe;
      morceau.append(pastille, document.createTextNode(texte));
      legende.append(morceau);
    });
    legende.append(el("span", "", "· toucher une étape : son détail"));
    cellule.append(legende);
    return cellule;
  }

  function dessinerTableauSplat(corps, ecriture, lignes = eleves) {
    $("fragiles").hidden = true;
    lignes.forEach(eleve => {
      const ligne = document.createElement("tr");
      const cNom = celluleNomTexte(eleve);

      const cMondes = document.createElement("td");
      const mondes = document.createElement("span");
      mondes.className = "mondes";
      mondes.setAttribute("role", "img");
      mondes.setAttribute("aria-label", eleve.lu.mondes
        .map(monde => `Monde ${monde.numero} : ${ETATS_MONDE[monde.etat] || ETATS_MONDE.vide}`).join(", "));
      eleve.lu.mondes.forEach(monde => mondes.append(pastilleMonde(monde)));
      cMondes.append(mondes);

      const cEtapes = document.createElement("td");
      const compte = document.createElement("span");
      compte.className = `pastille ${eleve.lu.faits ? "p-vert" : "p-gris"}`;
      compte.textContent = eleve.lu.lisible ? `${eleve.lu.faits} / ${eleve.lu.total}` : "—";
      cEtapes.append(compte);
      if (eleve.lu.bonus) {
        const bonus = document.createElement("span");
        bonus.className = "bonus-compte";
        bonus.textContent = `✨ ${eleve.lu.bonus}`;
        cEtapes.append(bonus);
      }

      const cDate = celluleDate(eleve);

      // Lot 5c : plus de « Détail ▾ » — la ligne ouvre la fenêtre de l'élève
      // (contenuSplat). Au téléphone, les mondes se cachent.
      large(cMondes);
      ligne.append(cNom, cMondes, cEtapes, cDate);
      finirLigne(ligne, eleve, cNom);
      corps.appendChild(ligne);
    });

    dessinerObjectifSplat();
    dessinerMondesSplat();

    $("resume-classe").textContent = resumeDeLaClasse(eleves);
    if (!SPLAT) {
      messager("message-appli",
        "La progression SPLAT! ne peut pas être détaillée : le moteur (prof/splat-parcours.js) n’a pas pu être chargé — vérifie qu’il est bien déposé sur le serveur.",
        "erreur");
    }
    dessinerPapier();
  }

  // « Notre classe, ensemble », version SPLAT! : les étapes réussies de tout
  // le monde, et combien d'élèves ont fini chaque monde. Comme pour Défi
  // tables : calculée sur ce qui est déjà chargé, aucun nom, aucun chiffre par
  // élève, et CACHÉE tant qu'aucune étape n'est réussie dans la classe (une
  // barre vide n'est pas un objectif). Les Bonus n'y entrent pas : ils sont
  // comptés à part (Q3).
  function objectifSplat() {
    if (!SPLAT || !eleves.length) return null;
    const lus = eleves.map(eleve => eleve.lu).filter(lu => lu.lisible);
    // Lot « splat-suivi-5 » : seulement les mondes ouverts à la classe.
    const ouverts = mondesOuverts();
    const ouvert = numero => !ouverts || ouverts.includes(numero);
    // Lot « Qui voit quoi » : les mondes ouverts à un élève en plus ne
    // comptent pas ici — la carte reste celle de la classe (faitsClasse).
    return {
      fait: lus.reduce((somme, lu) => somme + (typeof lu.faitsClasse === "number" ? lu.faitsClasse : lu.faits), 0),
      total: eleves.length * SPLAT.CARTE.ETAPES.filter(etape => ouvert(etape[4])).length,
      mondes: SPLAT.CARTE.MONDES.filter(([numero]) => ouvert(numero)).map(([numero]) => ({
        numero,
        finis: lus.filter(lu => lu.mondes.some(monde => monde.numero === numero && monde.etat === "fini")).length
      }))
    };
  }

  // Lot S4c « les onglets d'appli » : « Par monde ». Pour chaque monde ouvert
  // à la classe : combien l'ont fini, combien l'ont en cours, combien ne l'ont
  // pas commencé — chaque nombre se touche (les prénoms, par-dessus la page,
  // chacun ouvre sa fiche sur SPLAT!). Dessous : qui a vu des réponses cette
  // semaine (les jours de SPLAT!, lot S1). Rien de plus n'est lu.
  function dessinerMondesSplat() {
    const bloc = $("splat-mondes");
    const liste = $("splat-mondes-liste");
    const vues = $("splat-mondes-vues");
    liste.textContent = "";
    vues.textContent = "";
    garderPopEleves();
    const lus = elevesDeLOnglet().filter(eleve => eleve.lu && eleve.lu.lisible);
    if (!SPLAT || !lus.some(eleve => eleve.lu.faits || eleve.lu.cours)) { bloc.hidden = true; return; }
    const ouverts = mondesOuverts();
    SPLAT.CARTE.MONDES.filter(([numero]) => !ouverts || ouverts.includes(numero)).forEach(([numero, nom]) => {
      const groupes = {fini: [], cours: [], vide: []};
      lus.forEach(eleve => {
        const monde = eleve.lu.mondes.find(m => m.numero === numero);
        const etat = monde && (monde.etat === "fini" || monde.etat === "cours") ? monde.etat : "vide";
        groupes[etat].push(eleve);
      });
      const li = document.createElement("li");
      const titre = el("b", "", `Monde ${numero}`);
      titre.title = nom;
      li.append(titre);
      [["fini", "fini"], ["cours", "en cours"], ["vide", "pas commencé"]].forEach(([etat, mot]) => {
        const qui = ordreDeLaFeuille(groupes[etat]);
        const morceau = el("span", "");
        morceau.append(document.createTextNode(`${mot} `));
        if (qui.length) {
          morceau.append(boutonNombre(String(qui.length), pop => {
            pop.append(el("strong", "", `Monde ${numero} · ${mot}`));
            pop.append(prenomsEnLiens(qui, "splat"));
          }));
        } else morceau.append(el("b", "", "0"));
        li.append(morceau);
      });
      liste.append(li);
    });
    // Les réponses vues cette semaine (le lundi : celles du jour).
    const aujourdhui = aujourdhuiSuivi();
    const lundi = lundiDuJour(aujourdhui);
    const aides = [];
    lus.forEach(eleve => {
      const suivi = suiviApp("splat", eleve, aujourdhui);
      if (!suivi) return;
      const n = suivi.jours.filter(j => j.jour >= lundi).reduce((t, j) => t + j.lignes.reduce((u, l) => u + (l.vues > 0 ? l.vues : 0), 0), 0);
      if (n > 0) aides.push({eleve, n});
    });
    if (aides.length) {
      const qui = ordreDeLaFeuille(aides.map(a => a.eleve));
      vues.append(document.createTextNode("Des réponses vues cette semaine : "), boutonNombre(pluriel(aides.length, "élève"), pop => {
        pop.append(el("strong", "", "Réponses vues cette semaine"));
        const p = el("p", "");
        qui.forEach((eleve, i) => {
          if (i) p.append(document.createTextNode(", "));
          p.append(lienFiche(eleve, "splat"), document.createTextNode(` (${aides.find(a => a.eleve === eleve).n})`));
        });
        pop.append(p);
      }));
    } else vues.textContent = "Aucune réponse vue cette semaine.";
    bloc.hidden = false;
  }

  function dessinerObjectifSplat() {
    const bloc = $("objectif");
    const objectif = objectifSplat();
    const lignes = $("objectif-lignes");
    lignes.textContent = "";
    if (!objectif || !objectif.total || !objectif.fait) { bloc.hidden = true; return; }
    const part = Math.max(0, Math.min(1, objectif.fait / objectif.total));
    $("objectif-barre").style.width = `${Math.round(part * 100)}%`;
    const pluriel = objectif.fait > 1 ? "s" : "";
    $("objectif-compte").textContent =
      `Ensemble : ${objectif.fait} étape${pluriel} réussie${pluriel} sur ${objectif.total}`;
    // « Monde 1 fini par 6 élèves · monde 2 par 4 · … » — les mondes que
    // personne n'a finis ne sont pas cités.
    const finis = objectif.mondes.filter(monde => monde.finis > 0);
    if (finis.length) {
      const li = document.createElement("li");
      finis.forEach((monde, rang) => {
        // Un morceau par monde, qui ne se coupe pas en fin de ligne.
        const morceau = document.createElement("span");
        morceau.className = "insecable";
        const b = document.createElement("b");
        if (rang === 0) {
          morceau.append(document.createTextNode(`Monde ${monde.numero} fini par `));
          b.textContent = `${monde.finis} élève${monde.finis > 1 ? "s" : ""}`;
        } else {
          li.append(document.createTextNode(" · "));
          morceau.append(document.createTextNode(`monde ${monde.numero} par `));
          b.textContent = String(monde.finis);
        }
        morceau.append(b);
        li.append(morceau);
      });
      lignes.appendChild(li);
    }
    bloc.hidden = false;
  }

  // ------------------------------------------------------- l'onglet Coffres magiques
  //
  // Lot « Coffres magiques sur le suivi » (21/10/2026, maquette 01 validée par
  // Gwenaël) : une ligne par élève — un niveau par colonne (« 5 trésors », et
  // dessous « dont 3 parfaits » seulement au-dessus de zéro ; « — » si rien),
  // le jour du dernier trésor — et un « Détail » qui déplie la partie en cours
  // (« niveau 2 · addition et multiplication · 6 clés sur 10 ») puis un tableau
  // par opération : clés gagnées, aides ouvertes, solutions montrées, erreurs.
  // Pas de trésors par opération (Gwenaël a refusé : ça trompait), pas de carte
  // de classe. Tout est construit par createElement et textContent : rien de ce
  // que renvoie le serveur ne devient du HTML. C'est le moteur qui lit le
  // parcours (lireCoffres).

  // « 20 oct. 2026 » : le jour du dernier trésor, une date du parcours (jamais
  // une heure), telle que la maquette l'écrit.
  function jourCourt(jour) {
    if (!jour) return "";
    const date = new Date(String(jour) + "T12:00:00Z");
    if (isNaN(date)) return "";
    return date.toLocaleDateString("fr-FR", {timeZone: "Indian/Reunion", day: "numeric", month: "short", year: "numeric"});
  }

  // Lot « le chemin des coffres et le cadeau Gloubi » (09/11/2026, choix A
  // de Gwenaël) : au-dessus de « 5 trésors », les trois coffres du niveau
  // (bronze, argent, or : ses trois premiers trésors), le dessin de l'appli ;
  // à gagner, en pointillés. Rien de Gloubi côté professeur (choix du 09/11).
  const COULEURS_COFFRES = [["#c98446", "#7a4520", "#e7a96b"], ["#c4ccd6", "#5d6b7a", "#eef2f6"], ["#f6c13d", "#9a5b06", "#ffe08a"]];
  function coffresDuNiveau(gagnes, taille = 24) {
    const groupe = document.createElement("span");
    groupe.className = "coffres-niveau";
    groupe.setAttribute("role", "img");
    groupe.setAttribute("aria-label", `${gagnes} coffre${gagnes > 1 ? "s" : ""} sur 3`);
    COULEURS_COFFRES.forEach(([fond, bord, clair], index) => {
      const dessin = elementSvg("svg", {width: String(taille), height: String(taille), viewBox: "0 0 46 46", "aria-hidden": "true", focusable: "false"});
      if (index >= gagnes) {
        const trait = {fill: "#f4f7fb", stroke: "#b7c3d1", "stroke-width": "1.8", "stroke-dasharray": "3 2.4", "stroke-linejoin": "round"};
        dessin.append(elementSvg("path", Object.assign({d: "M9 20a14 9 0 0 1 28 0Z"}, trait)));
        dessin.append(elementSvg("rect", Object.assign({x: "9", y: "20", width: "28", height: "16", rx: "2.5"}, trait)));
      } else {
        dessin.append(elementSvg("path", {d: "M9 20a14 9 0 0 1 28 0Z", fill: fond, stroke: bord, "stroke-width": "1.8", "stroke-linejoin": "round"}));
        dessin.append(elementSvg("rect", {x: "9", y: "20", width: "28", height: "16", rx: "2.5", fill: fond, stroke: bord, "stroke-width": "1.8"}));
        dessin.append(elementSvg("rect", {x: "9", y: "18.5", width: "28", height: "4", fill: clair, stroke: bord, "stroke-width": "1.4"}));
        dessin.append(elementSvg("rect", {x: "19.5", y: "20.5", width: "7", height: "9", rx: "1.6", fill: clair, stroke: bord, "stroke-width": "1.4"}));
        dessin.append(elementSvg("path", {d: "M23 23.4v3.2", stroke: bord, "stroke-width": "1.8", "stroke-linecap": "round"}));
      }
      groupe.append(dessin);
    });
    return groupe;
  }

  function celluleNiveau(niveau) {
    const cellule = document.createElement("td");
    cellule.className = "tresors";
    if (!niveau || !niveau.tresors) {
      cellule.textContent = "—";
      cellule.classList.add("sans");
      return cellule;
    }
    cellule.append(coffresDuNiveau(Math.min(3, niveau.tresors)));
    const compte = document.createElement("b");
    compte.textContent = `${niveau.tresors} trésor${niveau.tresors > 1 ? "s" : ""}`;
    cellule.append(compte);
    if (niveau.parfaits > 0) {
      const parfaits = document.createElement("small");
      parfaits.textContent = `dont ${niveau.parfaits} parfait${niveau.parfaits > 1 ? "s" : ""}`;
      cellule.append(parfaits);
    }
    return cellule;
  }

  // Coffres dans la fenêtre de l'élève (serveur pro, lot 5c ; avant, le
  // Détail déplié sous la ligne) : ses trésors et ses trois niveaux, la partie
  // en cours (à partir d'une clé), puis les quatre opérations, dans l'ordre de
  // l'appli, même à zéro.
  function contenuCoffres(eleve) {
    const cellule = document.createElement("div");
    const lu = eleve.lu || {};
    if (!lu.lisible || !eleve.maj_le) { cellule.append(paragrapheVide("Rien reçu pour l’instant.")); return cellule; }
    const niveaux = lu.niveaux || [];
    const tresors = lu.tresors || 0;
    // Lot S4c : d'abord sa semaine (ses jours), puis tout depuis le début.
    const semaine = semaineCoffres(eleve);
    cellule.append(el("h3", "fe-periode", "Cette semaine"));
    if (semaine && semaine.jours) {
      cellule.append(ficheChiffres([
        ["Trésors", String(semaine.tresors), semaine.parfaits ? `dont ${semaine.parfaits} parfait${semaine.parfaits > 1 ? "s" : ""}` : ""],
        ["Aides", String(semaine.aides)],
        ["Solutions vues", String(semaine.solutions)],
        ["Jours", String(semaine.jours)]
      ]));
    } else cellule.append(paragrapheVide("Rien cette semaine."));
    cellule.append(el("h3", "fe-periode", "Depuis le début"));
    const depuis = ficheChiffres([
      ["Trésors", `${tresors} trésor${tresors > 1 ? "s" : ""}`, lu.parfaits ? `dont ${lu.parfaits} parfait${lu.parfaits > 1 ? "s" : ""}` : ""],
      ...[1, 2, 3].map(numero => {
        const niveau = niveaux.find(n => n.numero === numero);
        if (!niveau || !niveau.tresors) return [`Niveau ${numero}`, "—"];
        return [`Niveau ${numero}`, `${niveau.tresors} trésor${niveau.tresors > 1 ? "s" : ""}`,
          niveau.parfaits > 0 ? `dont ${niveau.parfaits} parfait${niveau.parfaits > 1 ? "s" : ""}` : ""];
      }),
      ["Dernier trésor", jourCourt(lu.dernier) || "—"]
    ]);
    // Les coffres de chaque niveau commencé, au-dessus de « 5 trésors » (lot du 09/11/2026).
    Array.from(depuis.children).forEach(bloc => {
      const m = /^Niveau ([1-3])$/.exec(bloc.children[0] && bloc.children[0].textContent || "");
      const niveau = m ? niveaux.find(n => n.numero === Number(m[1])) : null;
      if (niveau && niveau.tresors) bloc.children[1].prepend(coffresDuNiveau(Math.min(3, niveau.tresors), 28));
    });
    cellule.append(depuis);
    if (lu.partie) {
      const partie = document.createElement("p");
      partie.className = "partie-en-cours";
      const titre = document.createElement("b");
      titre.textContent = "Partie en cours : ";
      const cles = document.createElement("b");
      cles.textContent = `${lu.partie.cles} clé${lu.partie.cles > 1 ? "s" : ""} sur ${lu.partie.total}`;
      partie.append(titre, document.createTextNode(`niveau ${lu.partie.niveau} · ${lu.partie.operations} · `), cles);
      cellule.append(partie);
    }
    const table = document.createElement("table");
    table.className = "tableau-operations";
    const thead = document.createElement("thead");
    const enTete = document.createElement("tr");
    ["Opération", "Clés gagnées", "Aides ouvertes", "Solutions montrées", "Erreurs"].forEach(texte => {
      const th = document.createElement("th");
      th.textContent = texte;
      enTete.append(th);
    });
    thead.append(enTete);
    const tbody = document.createElement("tbody");
    (lu.operations || []).forEach(operation => {
      const tr = document.createElement("tr");
      const nom = document.createElement("td");
      nom.textContent = operation.nom[0].toUpperCase() + operation.nom.slice(1);
      tr.append(nom);
      [operation.cles, operation.aides, operation.solutions, operation.erreurs].forEach(valeur => {
        const td = document.createElement("td");
        td.className = "nombre";
        td.textContent = String(valeur);
        tr.append(td);
      });
      tbody.append(tr);
    });
    table.append(thead, tbody);
    cellule.append(table);
    const note = document.createElement("p");
    note.className = "aide";
    note.textContent = "Parfait : sans erreur ni solution montrée.";
    if (lu.parfaits) cellule.append(note);
    return cellule;
  }

  // Lot S4c « les onglets d'appli » : ce que Coffres note jour par jour (lot S1)
  // garde depuis lundi — trésors, parfaits, aides, solutions vues, jours.
  // null : rien de connu (l'appli ne rend aucun jour).
  let periodeCoffres = "debut";
  function semaineCoffres(eleve, aujourdhui = aujourdhuiSuivi()) {
    const suivi = suiviApp("coffres", eleve, aujourdhui);
    if (!suivi) return null;
    const lundi = lundiDuJour(aujourdhui);
    const jours = suivi.jours.filter(j => j.jour >= lundi && j.jour <= aujourdhui);
    const somme = {tresors: 0, parfaits: 0, aides: 0, solutions: 0, jours: jours.length};
    jours.forEach(j => j.lignes.forEach(l => {
      ["tresors", "parfaits", "aides", "solutions"].forEach(champ => { if (l[champ] > 0) somme[champ] += l[champ]; });
    }));
    return somme;
  }

  function choisirPeriodeCoffres(periode) {
    if (periode === periodeCoffres) return;
    periodeCoffres = periode;
    document.querySelectorAll("#periode-coffres button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.periode === periode)));
    poserAppli();
    dessinerTableau();
  }

  function dessinerTableauCoffres(corps, ecriture, lignes = eleves) {
    $("fragiles").hidden = true;
    $("objectif").hidden = true;
    if (periodeCoffres === "semaine") {
      lignes.forEach(eleve => {
        const ligne = document.createElement("tr");
        const cNom = celluleNomTexte(eleve);
        const semaine = semaineCoffres(eleve);
        const cellules = ["tresors", "parfaits", "aides", "solutions", "jours"].map(champ => {
          const td = document.createElement("td");
          const n = semaine ? semaine[champ] : 0;
          if (n > 0) td.append(el(champ === "tresors" ? "b" : "span", "", String(n)));
          else { td.textContent = "—"; td.className = "sans"; }
          return td;
        });
        [cellules[1], cellules[2], cellules[4]].forEach(large);
        ligne.append(cNom, ...cellules);
        finirLigne(ligne, eleve, cNom);
        corps.appendChild(ligne);
      });
      $("resume-classe").textContent = resumeDeLaClasse(eleves);
      dessinerPapier();
      return;
    }
    lignes.forEach(eleve => {
      const ligne = document.createElement("tr");
      const cNom = celluleNomTexte(eleve);
      const niveaux = eleve.lu.niveaux || [];
      const cNiveaux = [1, 2, 3].map(numero => celluleNiveau(niveaux.find(n => n.numero === numero)));

      const cDate = document.createElement("td");
      const quand = jourCourt(eleve.lu.dernier);
      cDate.textContent = quand || "—";
      if (!quand) cDate.className = "sans";

      // Lot 5c : plus de « Détail » — la ligne ouvre la fenêtre de l'élève
      // (contenuCoffres). Au téléphone, les trois niveaux laissent la place à
      // leur total, « Trésors ». Correctif des lots 5 (point 7) : « Trésors »
      // aussi à l'ordinateur — c'était le seul tri de l'ancien « Trier par »
      // que plus aucun titre ne donnait (le total, devant les trois niveaux).
      const cTresors = document.createElement("td");
      const tresors = eleve.lu.tresors || 0;
      if (eleve.lu.lisible && tresors) cTresors.textContent = `${tresors} trésor${tresors > 1 ? "s" : ""}`;
      else { cTresors.textContent = "—"; cTresors.className = "sans"; }
      cNiveaux.forEach(large);
      ligne.append(cNom, cTresors, ...cNiveaux, cDate);
      finirLigne(ligne, eleve, cNom);
      corps.appendChild(ligne);
    });

    $("resume-classe").textContent = resumeDeLaClasse(eleves);
    if (!COFFRES) {
      messager("message-appli",
        "La progression Coffres magiques ne peut pas être détaillée : le moteur (prof/coffres-parcours.js) n’a pas pu être chargé — vérifie qu’il est bien déposé sur le serveur.",
        "erreur");
    }
    dessinerPapier();
  }

  // ------------------------------------------------------------ l'onglet Anzan
  //
  // Lot « Qui voit quoi », lot 4b (24/10/2026, décisions de Gwenaël des 22 et
  // 23/10) : une ligne par élève — le compte en CALCULS (une séance en fait 5,
  // 10 ou 20 : compter les séances ne disait rien), les jours d'entraînement,
  // le jour de la dernière séance — et « Parcours », qui ouvre ses dix
  // dernières séances : l'écran « Mon historique » de l'élève, en lecture
  // seule. Pas de carte de classe (pas d'objectif commun à Anzan), aucun
  // bouton qui lance une activité. Tout est lu par le moteur (lireAnzan) et
  // posé par createElement et textContent : rien de ce que renvoie le serveur
  // ne devient du HTML, et aucun code d'élève n'est écrit ici.

  function dessinerTableauAnzan(corps, ecriture, lignes = eleves) {
    $("fragiles").hidden = true;
    $("objectif").hidden = true;
    lignes.forEach(eleve => {
      const ligne = document.createElement("tr");
      const cNom = celluleNomTexte(eleve);
      const lu = eleve.lu || {};
      // Lot S4c « les onglets d'appli » : par mode. Chaque colonne dit les
      // calculs faits dans ce mode (passages et entraînements aux grades
      // compris) et, dessous, le plus haut grade réussi dans ce mode (lots
      // « grades » et « grades-colonne » du 07/11/2026), puis le grade et
      // l'étape en cours (barème révisé du 22/11/2026 : un grade se gagne
      // étape par étape ; les mots viennent du moteur, resumeProf).
      const parMode = calculsParModeAnzan(lu);
      const cellule = (calculs, grade, enCours) => {
        const td = document.createElement("td");
        if (!lu.commence || !calculs) { td.textContent = "—"; td.className = "sans"; return td; }
        td.append(el("b", "", `${calculs} calcul${calculs > 1 ? "s" : ""}`));
        if (grade && ANZAN && ANZAN.nomGrade) td.append(el("small", "anzan-grade", `🥋 ${ANZAN.nomGrade(grade)}`));
        if (enCours) td.append(el("small", "anzan-grade en-cours", `En\u00a0cours\u00a0: ${enCours.split(" · ").map(m => m.replace(/ /g, "\u00a0")).join(" · ")}`));
        return td;
      };
      const cFlash = cellule(parMode.flash, lu.grade, lu.enCours);
      const cColonne = cellule(parMode.colonne, lu.gradeColonne, lu.enCoursColonne);
      const cJours = document.createElement("td");
      if (lu.commence) cJours.textContent = `${lu.jours} jour${lu.jours > 1 ? "s" : ""}`;
      else { cJours.textContent = "—"; cJours.className = "sans"; }
      const cDate = document.createElement("td");
      const quand = jourCourt(lu.dernier);
      cDate.textContent = quand || "—";
      if (!quand) cDate.className = "sans";

      // Lot 5c : plus de « Parcours » — la ligne ouvre la fenêtre de l'élève,
      // avec ses dernières séances. Au téléphone, les jours et le jour de la
      // dernière séance se cachent ; le jour passe sous le prénom (lot S4c).
      large(cJours);
      large(cDate);
      ligne.append(cNom, cFlash, cColonne, cJours, cDate);
      finirLigne(ligne, eleve, cNom);
      if (lu.commence && lu.dernier) indiceTelephone(cNom, jourAnzan(lu.dernier), "");
      corps.appendChild(ligne);
    });

    $("resume-classe").textContent = resumeDeLaClasse(eleves, aDuTravail, "aucun calcul reçu");
    if (!ANZAN) {
      messager("message-appli",
        "La progression Anzan ne peut pas être détaillée : le moteur (prof/flash_anzan_parcours.js) n’a pas pu être chargé — vérifie qu’il est bien déposé sur le serveur.",
        "erreur");
    }
    dessinerPapier();
  }

  // « 23 oct. » — l'année en plus quand ce n'est pas celle d'aujourd'hui :
  // comme « Mon historique » de l'élève. Le jour est une date du parcours
  // (jamais une heure), lue à l'heure de La Réunion.
  function jourAnzan(jour, aujourdhui = new Date()) {
    const date = new Date(String(jour) + "T12:00:00Z");
    if (!jour || isNaN(date)) return "";
    const fuseau = {timeZone: "Indian/Reunion"};
    const annee = d => d.toLocaleDateString("fr-FR", Object.assign({year: "numeric"}, fuseau));
    const options = Object.assign({day: "numeric", month: "short"}, fuseau);
    if (annee(date) !== annee(aujourdhui)) options.year = "numeric";
    return date.toLocaleDateString("fr-FR", options);
  }

  // « + et − · 3 chiffres · 8 nombres · 20 s » (Colonne), « 2 à 3 chiffres ·
  // 10 nombres · 0,8 s par nombre · 8 s en tout » (Flash) : les réglages d'une séance,
  // les mots de MATHSGO_FLASH_ANZAN_CORE.resume(mode, reglages, {avecMode:
  // false}) — le noyau n'est pas servi par le suivi, la petite fonction est
  // recopiée ici ; un test la compare au noyau sur tous les réglages.
  function reglagesAnzan(mode, r) {
    const morceaux = [];
    if (r.operations === "plusmoins") morceaux.push("+ et −");
    // Les espaces insécables du noyau (\u00a0) : « 10 nombres » ne se coupe pas.
    morceaux.push(r.chiffresMin === r.chiffresMax
      ? `${r.chiffresMin}\u00a0chiffre${r.chiffresMin > 1 ? "s" : ""}`
      : `${r.chiffresMin} à ${r.chiffresMax}\u00a0chiffres`);
    morceaux.push(`${r.nombres}\u00a0nombres`);
    // Flash : le temps par nombre et le temps du calcul en entier (lot
    // « entraînement 5 ou 10 », 07/11/2026) — « 0,8 s par nombre · 8 s en tout ».
    const sec = v => `${String(Math.round(v * 10) / 10).replace(".", ",")}\u00a0s`;
    if (mode === "flash") morceaux.push(`${sec(r.temps / 10)}\u00a0par\u00a0nombre`, `${sec(r.nombres * (r.temps / 10))}\u00a0en\u00a0tout`);
    else if (r.limite) morceaux.push(`${r.limite}\u00a0s`);
    return morceaux.join("\u00a0· "); // le point collé au morceau d'avant, comme le noyau
  }

  // Ce que disent la fenêtre et sa feuille, lu une fois : le titre, le
  // compte (« 106 calculs · 10 jours d'entraînement », la phrase de la tuile
  // de l'élève, rendue par le moteur), les `combien` dernières séances (10 au
  // départ), combien il y en a en tout quand il y en a plus, et combien il en
  // reste à montrer.
  // Lot S4c « les onglets d'appli » : le mode d'une séance — « flash »,
  // « colonne », ou « grade » (un passage de grade ou un entraînement au
  // grade, Flash ou Colonne).
  const FILTRES_ANZAN = [["flash", "⚡ Flash"], ["colonne", "📝 Colonne"], ["grade", "🥋 Grades"]];
  function modeAnzan(s) {
    if (s.mode === "grade" || s.mode === "entrainement") return "grade";
    return s.mode === "colonne" ? "colonne" : "flash";
  }

  // Par mode, pour l'onglet de la classe : les calculs faits en Flash et en
  // Colonne, passages et entraînements aux grades compris (le grade dit son
  // mode), sur les séances gardées.
  function calculsParModeAnzan(lu) {
    const compte = {flash: 0, colonne: 0};
    (lu.historique || []).forEach(s => {
      const colonne = s.mode === "colonne" || ((s.mode === "grade" || s.mode === "entrainement") && ANZAN && ANZAN.estGradeColonne && ANZAN.estGradeColonne(s.grade));
      compte[colonne ? "colonne" : "flash"] += s.faits > 0 ? s.faits : 0;
    });
    return compte;
  }

  function parcoursAnzanDe(eleve, aujourdhui, combien = 10, filtre = null) {
    const lu = (eleve && eleve.lu) || {};
    const prenom = prenomCourt(eleve);
    const gardees = lu.historique || lu.dernieres || [];
    const toutes = filtre ? gardees.filter(s => modeAnzan(s) === filtre) : gardees;
    const seances = toutes.slice(0, combien).map(s => {
      // Un grade (lot « grades », 07/11/2026) : les mots du moteur,
      // « 🥋 12e kyu · Étape 2 sur 3 · réussie » ou « 🎯 12e kyu · Entraînement · étape 2 sur 3 ».
      const grade = ANZAN && ANZAN.libelleGrade ? ANZAN.libelleGrade(s) : null;
      return {
        jour: jourAnzan(s.jour, aujourdhui),
        mode: grade ? grade.mode : (s.mode === "flash" ? "⚡ Flash" : "📝 Colonne"),
        reglages: grade ? grade.details : reglagesAnzan(s.mode, s.reglages || {}),
        score: `${s.score}/${s.faits}`,
        arretee: Boolean(s.arretee)
      };
    });
    return {
      titre: `Le parcours ${deNom(prenom)}`,
      compte: lu.texte || `${prenom[0].toUpperCase()}${prenom.slice(1)} n’a pas encore fait de séance.`,
      grade: lu.texteGrade || "",
      seances,
      note: filtre
        ? (toutes.length > seances.length ? `Les ${seances.length} dernières, sur ${toutes.length}.` : "")
        : (lu.seances > seances.length ? `Les ${seances.length} dernières séances, sur ${lu.seances}.` : ""),
      reste: Math.max(0, toutes.length - seances.length),
      // Combien de séances gardées dans chaque mode (le filtre ne montre que
      // les modes où il y en a).
      parMode: FILTRES_ANZAN.map(([cle]) => [cle, gardees.filter(s => modeAnzan(s) === cle).length])
    };
  }

  // Serveur pro, lot 5c : les séances vivent dans la fenêtre de l'élève (le
  // bloc « fe-anzan ») ; ouvrir le parcours d'un élève, c'est repartir à ses
  // dix dernières séances. La fenêtre elle-même s'ouvre par sa ligne.
  function ouvrirParcoursAnzan(eleve) {
    if (!classe || !eleve || !ANZAN) return;
    parcoursAnzanEleve = eleve;
    parcoursAnzanAffiches = 10;
    parcoursAnzanFiltre = null;
    dessinerParcoursAnzan();
  }

  // « Voir les séances précédentes » : 10 de plus, la fenêtre redessinée.
  function plusDeSeancesAnzan() {
    if (!parcoursAnzanEleve) return;
    parcoursAnzanAffiches += 10;
    dessinerParcoursAnzan();
  }

  function dessinerParcoursAnzan() {
    const eleve = parcoursAnzanEleve;
    if (!eleve) return;
    const vu = parcoursAnzanDe(eleve, undefined, parcoursAnzanAffiches, parcoursAnzanFiltre);
    $("pa-compte").textContent = vu.compte;
    // Lot S4c : Toutes · ⚡ Flash · 📝 Colonne · 🥋 Grades — seulement quand
    // il y a au moins deux modes ; le choix garde la place (rien ne bouge
    // au-dessus de la liste).
    const filtres = $("pa-filtres");
    filtres.textContent = "";
    const modes = vu.parMode.filter(([, n]) => n > 0);
    filtres.hidden = modes.length < 2;
    if (modes.length >= 2) {
      [[null, "Toutes"], ...FILTRES_ANZAN.filter(([cle]) => modes.some(([m]) => m === cle))].forEach(([cle, mot]) => {
        const n = cle ? modes.find(([m]) => m === cle)[1] : null;
        const bouton = el("button", "", n === null ? mot : `${mot} (${n})`);
        bouton.type = "button";
        bouton.setAttribute("aria-pressed", String(cle === parcoursAnzanFiltre));
        bouton.addEventListener("click", () => { parcoursAnzanFiltre = cle; parcoursAnzanAffiches = 10; dessinerParcoursAnzan(); });
        filtres.append(bouton);
      });
    }
    $("pa-grade").textContent = vu.grade;
    $("pa-grade").hidden = !vu.grade;
    const liste = $("pa-liste");
    liste.textContent = "";
    liste.hidden = !vu.seances.length;
    vu.seances.forEach(s => {
      const item = document.createElement("li");
      const jour = document.createElement("span");
      jour.className = "pa-jour";
      jour.textContent = s.jour;
      const milieu = document.createElement("span");
      const mode = document.createElement("span");
      mode.className = "pa-mode";
      mode.textContent = s.mode;
      const reglages = document.createElement("span");
      reglages.className = "pa-reglages";
      reglages.textContent = s.reglages;
      milieu.append(mode, reglages);
      const score = document.createElement("span");
      score.className = "pa-score";
      score.textContent = s.score;
      if (s.arretee) {
        const arretee = document.createElement("small");
        arretee.textContent = "arrêtée";
        score.append(arretee);
      }
      item.append(jour, milieu, score);
      liste.append(item);
    });
    $("pa-note").textContent = vu.note;
    $("pa-plus").hidden = !vu.reste;
    $("pa-imprimer").hidden = !vu.seances.length;
    // Lot « textes justes » (24/10/2026) : le bouton dit ce qu'il imprime —
    // les séances affichées, 10 puis plus après « Voir les séances précédentes ».
    // Court : « Imprimer les 10 séances affichées » passait sur deux lignes en 390.
    $("pa-imprimer").textContent = vu.seances.length === 1
      ? "Imprimer cette séance"
      : `Imprimer ces ${vu.seances.length} séances`;
  }

  // Fermée (bouton ou Échap), ou passée à une autre appli, la fenêtre
  // oublie l'élève.
  function fermerParcoursAnzan() {
    parcoursAnzanEleve = null;
    parcoursAnzanAffiches = 10;
    parcoursAnzanFiltre = null;
    ["pa-compte", "pa-grade", "pa-liste", "pa-note"].forEach(id => { $(id).textContent = ""; });
    $("pa-grade").hidden = true;
    $("pa-plus").hidden = true;
    $("pa-imprimer").hidden = true;
  }

  // « Imprimer » : la feuille, seule (la fenêtre ne sort pas), remplie le
  // temps de l'impression puis vidée. Rien d'autre que ce que montre la
  // fenêtre, aucun code : un collègue « voir seulement » peut l'imprimer.
  function imprimerParcoursAnzan() {
    const eleve = parcoursAnzanEleve;
    if (!eleve) return false;
    quitterImpressions();
    const numero = ++numeroImpression;
    // Les séances que montre la fenêtre (10, ou plus après « Voir les séances
    // précédentes » ; lot S4c : du mode choisi).
    const vu = parcoursAnzanDe(eleve, undefined, parcoursAnzanAffiches, parcoursAnzanFiltre);
    $("fa-titre").textContent = vu.titre;
    $("fa-compte").textContent = vu.compte;
    $("fa-grade").textContent = vu.grade;
    const corps = $("fa-corps");
    corps.textContent = "";
    vu.seances.forEach(s => {
      const ligne = document.createElement("tr");
      [s.jour, s.mode, s.reglages, s.arretee ? `${s.score} · arrêtée` : s.score].forEach((valeur, i) => {
        const cellule = document.createElement("td");
        cellule.textContent = valeur;
        if (i === 3) cellule.className = "fa-score";
        ligne.append(cellule);
      });
      corps.append(ligne);
    });
    $("fa-note").textContent = vu.note;
    document.body.classList.add("imprime-anzan");
    let fait = false;
    const nettoyer = () => {
      if (fait) return;
      fait = true;
      window.removeEventListener("afterprint", nettoyer);
      if (numero !== numeroImpression) return;
      document.body.classList.remove("imprime-anzan");
      ["fa-titre", "fa-compte", "fa-grade", "fa-corps", "fa-note"].forEach(id => { $(id).textContent = ""; });
    };
    window.addEventListener("afterprint", nettoyer);
    setTimeout(nettoyer, 60000);
    window.print();
    return true;
  }

  // ------------------------------------------------------- l'onglet Défi calcul
  //
  // Lot K2 « le professeur » (28/11/2026, planches K2-3, K2-4 et K2-6,
  // choix de Gwenaël du 28/11 — remplace l'onglet du lot 2b, construit avant
  // les étoiles). L'onglet répond à quatre questions, dans cet ordre :
  //  1. Qui a besoin d'aide ? « À aider » (avec les prénoms : à ne pas
  //     projeter) — chaque élève une fois, pour sa raison la plus forte
  //     (raisonsAider) ; « Notre classe, ensemble » dessous.
  //  2. Qu'est-ce qui coince dans la classe ? « À reprendre en classe »
  //     (aucun prénom à l'écran : on peut projeter) — les erreurs les plus
  //     fréquentes, avec un exemple REGÉNÉRÉ et ce que l'appli dit à
  //     l'élève ; les étoiles qui résistent chez 2 élèves ou plus.
  //  3. Où en est chacun ? La grille : une ligne par élève, une case par
  //     étoile, un onglet par étage, sept états lisibles en noir et blanc.
  //  4. Qui travaille ? « Qui s'entraîne ».
  // Puis le tableau (« Étoiles », « À surveiller »), la fenêtre de l'élève
  // (contenuCalcul) et ses feuilles imprimées, avec les mots de la grille.
  // Aucun temps n'est montré (choix du 07/11, redit le 28/11).
  // Tout est lu par le moteur (lireCalcul → resumeProf) et posé par
  // createElement et textContent : rien de ce que renvoie le serveur ne
  // devient du HTML, et aucun code d'élève n'est écrit ici. Aucun calcul
  // d'élève n'est enregistré : l'exemple d'une erreur est REGÉNÉRÉ depuis la
  // fiche du module (exempleErreur).

  const APPLI_CALCUL = "https://mathsgo.re/outils/calcul_mental/defi_calcul_modules.html";
  // Les sept états d'une étoile dans la grille (le moteur, etatGrille), leurs
  // mots, et leur signe sur une feuille en noir et blanc.
  const ETATS_GRILLE = ["tenu", "gagnee", "rate", "perdue", "essai", "classe", "vide"];
  const MOTS_GRILLE = {tenu: "a réussi un retour", gagnee: "gagnée", rate: "ratée au dernier retour", perdue: "perdue, à regagner",
    essai: "essayée, pas encore gagnée", classe: "à voir en classe", vide: "pas encore"};
  const SIGNES_GRILLE = {tenu: "●", gagnee: "○", rate: "↻", perdue: "✗", essai: "◇", classe: "?", vide: "·"};
  // Une étoile que l'élève a (même ratée à son dernier retour : elle reste).
  const gagneeGrille = etat => etat === "tenu" || etat === "gagnee" || etat === "rate";
  // « CP », « CE1 », … « 6e » : la classe d'un étage, en un mot.
  const CLASSES_ETAGES = {1: "CP", 2: "CE1", 3: "CE2", 4: "CM1", 5: "CM2", 6: "6e"};

  // « Compléments à 100 » : le nom court d'une compétence (le noyau), et le
  // nom du module.
  function nomCompetenceCalcul(id, niveau) {
    const nom = CALCUL_CORE ? CALCUL_CORE.nomCompetence(id, niveau) : "";
    return nom || `${nomModuleCalcul(id)} · niveau ${niveau}`;
  }

  function nomModuleCalcul(id) {
    const fiche = CALCUL_CORE ? CALCUL_CORE.moduleDe(id) : null;
    return fiche ? fiche.nom : id;
  }

  // « Le CP », « Le CE1 », … « La 6e » : les classes ne sont écrites que
  // là où le nom ne les dit pas (plus aucun depuis le lot K1b : un palier par
  // classe ; « Vers la 6e » est devenu « La 6e » au lot « la 6e complète »).
  function nomPalierCalcul(numero) {
    const palier = CALCUL_CORE ? CALCUL_CORE.PALIERS.find(p => p.n === numero) : null;
    if (!palier) return `Palier ${numero}`;
    return palier.nom.includes(palier.classes) || numero === CALCUL_CORE.PALIERS.length ? palier.nom : `${palier.nom} (${palier.classes})`;
  }
  // Les numéros des paliers du noyau (six depuis le lot K1b).
  const numerosDesPaliers = () => (CALCUL_CORE ? CALCUL_CORE.PALIERS.map(p => p.n) : []);
  // La ceinture portée, bornée à celles du noyau.
  const ceinturePortee = c => Math.max(0, Math.min(CALCUL_CORE.CEINTURES.length - 1, Math.floor(Number(c && c.porte) || 0)));

  // Le nom d'une cause d'erreur du module (« retour oublié »), ou "".
  function nomCauseCalcul(id, cause) {
    const fiche = CALCUL_CORE ? CALCUL_CORE.moduleDe(id) : null;
    const erreur = fiche && fiche.erreurs ? fiche.erreurs.find(e => e.c === cause) : null;
    return erreur ? erreur.nom : "";
  }

  // Un calcul d'exemple pour une cause d'erreur, REGÉNÉRÉ depuis la fiche du
  // module (jamais un calcul de l'élève : le serveur n'en garde aucun) : on
  // tire des calculs du niveau, puis on cherche la réponse fausse que la
  // cause reconnaît parmi des candidates tirées des nombres du calcul. Rend
  // {texte, reponse}, ou null. Un niveau donné d'abord (celui qui coince).
  const exemplesCalcul = new Map();
  function exempleErreur(id, cause, niveau = 0) {
    const cle = `${id}-${cause}-${niveau}`;
    if (exemplesCalcul.has(cle)) return exemplesCalcul.get(cle);
    let trouve = null;
    const fiche = CALCUL_CORE ? CALCUL_CORE.moduleDe(id) : null;
    if (fiche) {
      const niveaux = fiche.niveaux.map(n => n.n);
      const ordre = niveau && niveaux.includes(niveau) ? [niveau, ...niveaux.filter(n => n !== niveau)] : niveaux;
      // (Lot « couverture » de Défi calcul, 06/11/2026 : jusqu'à 6 écritures
      // par niveau — M10-1 en a 4, et la moitié-double est la 4e.)
      boucle: for (const n of ordre) for (let graine = 1; graine <= 6; graine += 1) for (let tour = 0; tour < 6; tour += 1) {
        const calcul = CALCUL_CORE.genererUn(`${id}-${n}`, graine, {tour});
        if (!calcul) continue;
        for (const reponse of candidatsErreur(calcul)) {
          const diagnostic = CALCUL_CORE.diagnostiquer(calcul, reponse);
          // (Lot 6 « fraction à deux cases » : une réponse en fraction s'écrit
          // en fraction, « 6 × ?/? = 5 → 6/5 ».)
          // Lot K2 : et ce que l'appli DIT à l'élève pour cette réponse (le
          // retour de l'erreur dans la fiche du module) — "" s'il échoue.
          if (diagnostic && diagnostic.c === cause) {
            trouve = {texte: calcul.texte, reponse: CALCUL_CORE.ecrireReponse ? CALCUL_CORE.ecrireReponse(calcul, reponse) : CALCUL_CORE.formaterNombre(reponse),
              dit: retourDeLErreur(fiche, cause, calcul, reponse)};
            break boucle;
          }
        }
      }
    }
    exemplesCalcul.set(cle, trouve);
    return trouve;
  }

  // Le texte que l'appli montre à l'élève pour cette erreur (fiche du
  // module, `erreurs[].retour(calcul, reponse)`), en une ligne ; "" s'il
  // n'y en a pas ou s'il échoue.
  function retourDeLErreur(fiche, cause, calcul, reponse) {
    try {
      const erreur = (fiche.erreurs || []).find(e => e.c === cause);
      const texte = erreur && typeof erreur.retour === "function" ? erreur.retour(calcul, reponse) : "";
      return typeof texte === "string" ? texte.replace(/\s+/g, " ").trim() : "";
    } catch (_) { return ""; }
  }

  function candidatsErreur(calcul) {
    // Correctif du lot « la 6e complète » (relecture de Codex du 28/11) : une
    // réponse à choisir (« Où va la virgule ? ») ne peut être fausse que
    // d'une des deux autres cases — l'exemple n'en invente pas d'autre.
    if (Array.isArray(calcul.choix)) return calcul.choix.filter(v => !CALCUL_CORE.memeNombre(v, calcul.reponse));
    const valeurs = [calcul.reponse, ...Object.values(calcul.donnees || {}).filter(v => typeof v === "number")];
    const trouves = new Set();
    // (Lot 6 : une réponse en fraction à deux cases garde sa valeur exacte,
    // 6/5 ou 7/3 — arrondie au millième, 7/3 ne se reconnaîtrait plus.)
    const exacte = Boolean(CALCUL_CORE.aFractionACases && CALCUL_CORE.aFractionACases(calcul.texte));
    const ajouter = v => { if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v !== calcul.reponse) trouves.add(exacte ? v : Math.round(v * 1000) / 1000); };
    valeurs.forEach(v => {
      for (let k = -3; k <= 3; k += 1) ajouter(v * Math.pow(10, k));
      [1, 2, 10, 20, 100, 1000].forEach(d => { ajouter(v + d); ajouter(v - d); });
      ajouter(Math.trunc(v));
    });
    valeurs.forEach(a => valeurs.forEach(b => {
      ajouter(a + b); ajouter(a - b); ajouter(b - a); ajouter(a * b);
      if (b) ajouter(a / b);
      ajouter(Math.trunc(a) * b + (a - Math.trunc(a)));
    }));
    return [...trouves];
  }

  // « ouvrir en classe » : ce niveau dans l'appli, en mode professeur (tous
  // les menus, rien d'enregistré).
  function lienOuvrirEnClasse(id, niveau) {
    const lien = document.createElement("a");
    lien.href = `${APPLI_CALCUL}?prof=1&module=${encodeURIComponent(id)}&niveau=${encodeURIComponent(String(niveau))}`;
    lien.target = "_blank";
    lien.rel = "noopener";
    lien.textContent = "ouvrir en classe ↗";
    lien.title = "Ce niveau dans Défi calcul, en mode professeur, dans un nouvel onglet";
    return lien;
  }

  // ----- la carte, étoile par étoile

  // Les étages, leurs lignes et leurs étoiles, dans l'ordre de la carte de
  // l'élève (le moteur, carteEleve, sur un parcours vide : tout est montré,
  // aucun réglage). Lu une fois.
  let planGrilleCalcul = null;
  function planCalcul() {
    if (planGrilleCalcul) return planGrilleCalcul;
    if (!CALCUL || !CALCUL_CORE || typeof CALCUL.carteEleve !== "function") return [];
    try {
      const plan = CALCUL.carteEleve(CALCUL.creerParcours(), CALCUL_CORE.carte(), {aujourdhui: CALCUL.jourLocal()});
      planGrilleCalcul = plan.etages.map(e => ({etage: e.etage, total: e.total,
        // (Les étoiles d'une ligne s'appellent ici `cases`.)
        lignes: e.lignes.map(({nom, etoiles}) => ({nom, cases: etoiles.map(x => ({cle: x.cle, module: x.module, niveau: x.niveau, etage: e.etage, ligne: nom}))}))}));
    } catch (_) { planGrilleCalcul = []; }
    return planGrilleCalcul;
  }
  const etoilesDuPlan = () => planCalcul().flatMap(e => e.lignes.flatMap(l => l.cases));

  // Ce que le moteur dit de chaque étoile d'un élève (resumeProf, modules) :
  // une table « A1-2 » → {etat, tentes, arrets, perdues, tenteLe, echeance,
  // entree}. Gardée tant que la lecture de l'élève (lu) ne change pas.
  const grillesLues = new WeakMap();
  const ETOILE_VIDE = Object.freeze({etat: "vide", tentes: 0, arrets: 0, perdues: 0, tenteLe: null, echeance: null, entree: null});
  function grilleDe(lu) {
    if (!lu || typeof lu !== "object") return new Map();
    if (grillesLues.has(lu)) return grillesLues.get(lu);
    const table = new Map();
    if (lu.lisible && lu.commence) {
      (lu.modules || []).forEach(m => {
        if (!Array.isArray(m.grille)) return;
        m.grille.forEach((etat, i) => {
          table.set(`${m.id}-${i + 1}`, {
            etat: ETATS_GRILLE.includes(etat) ? etat : "vide",
            tentes: (m.tentes && m.tentes[i]) || 0, arrets: (m.arrets && m.arrets[i]) || 0, perdues: (m.perdues && m.perdues[i]) || 0,
            tenteLe: (m.tenteLe && m.tenteLe[i]) || null, echeance: (m.echeances && m.echeances[i]) || null, entree: (m.entrees && m.entrees[i]) || null
          });
        });
      });
    }
    grillesLues.set(lu, table);
    return table;
  }
  const etoileDe = (lu, cle) => grilleDe(lu).get(cle) || ETOILE_VIDE;

  // Les étoiles gagnées d'un élève : en tout, et étage par étage (`touchees` :
  // celles où quelque chose a été fait).
  function compteEtoiles(lu) {
    const etages = planCalcul().map(e => {
      let gagnees = 0, touchees = 0;
      e.lignes.forEach(l => l.cases.forEach(x => {
        const etat = etoileDe(lu, x.cle).etat;
        if (gagneeGrille(etat)) gagnees += 1;
        if (etat !== "vide") touchees += 1;
      }));
      return {etage: e.etage, total: e.total, gagnees, touchees};
    });
    return {etages, gagnees: etages.reduce((s, e) => s + e.gagnees, 0), total: etages.reduce((s, e) => s + e.total, 0),
      tenues: etoilesDuPlan().filter(x => etoileDe(lu, x.cle).etat === "tenu").length};
  }

  // ----- « À aider » : les raisons, de la plus forte à la plus faible
  //
  // Une raison par étoile (la plus forte), puis deux raisons sans étoile :
  //  1. à voir en classe (J'apprends arrêté 3 fois, ou perdue 3 fois) ;
  //  2. « Je tente » raté 2 fois sur une étoile pas gagnée ;
  //  3. perdue au retour (deux retours ratés de suite) ;
  //  4. J'apprends arrêté 2 fois ;
  //  5. rien gagné depuis 5 séances (et encore quelque chose à gagner) ;
  //  6. calculs du jour : moins de 60 % de justes sur ses 3 dernières
  //     séances, avec au moins 8 calculs.
  // Rangées par force, puis dans l'ordre de la carte. [{rang, texte,
  // etoile}] — `etoile` : null pour 5 et 6.
  const AIDER = Object.freeze({seancesSansGain: 5, seancesCalculs: 3, calculsMin: 8, partJustes: 0.6});
  function raisonsAider(lu) {
    if (!lu || !lu.lisible || !lu.commence) return [];
    const raisons = [];
    let resteAGagner = false;
    etoilesDuPlan().forEach(x => {
      const e = etoileDe(lu, x.cle);
      if (!gagneeGrille(e.etat)) resteAGagner = true;
      let rang = 0, texte = "";
      if (e.etat === "classe") { rang = 1; texte = e.arrets >= 3 ? "J’apprends arrêté 3 fois" : "perdue 3 fois"; }
      else if (e.etat === "essai" && e.tentes >= 2) { rang = 2; texte = "« Je tente » raté 2 fois"; }
      else if (e.etat === "perdue") { rang = 3; texte = "perdue au retour"; }
      else if (e.etat === "essai" && e.arrets >= 2) { rang = 4; texte = "J’apprends arrêté 2 fois"; }
      if (rang) raisons.push({rang, texte, etoile: x});
    });
    const connu = v => typeof v === "number" && v >= 0;
    const recentes = Array.isArray(lu.recentes) ? lu.recentes : [];
    const derniers = recentes.slice(-AIDER.seancesSansGain);
    if (resteAGagner && derniers.length === AIDER.seancesSansGain
      && derniers.every(s => connu(s.nouveautes) && connu(s.prouvees) && s.nouveautes === 0 && s.prouvees === 0)) {
      raisons.push({rang: 5, texte: `rien gagné depuis ${AIDER.seancesSansGain} séances`, etoile: null});
    }
    let calculs = 0, justes = 0;
    recentes.slice(-AIDER.seancesCalculs).forEach(s => { if (connu(s.calculs) && connu(s.justes)) { calculs += s.calculs; justes += Math.min(s.justes, s.calculs); } });
    if (calculs >= AIDER.calculsMin && justes < AIDER.partJustes * calculs) {
      raisons.push({rang: 6, texte: `calculs du jour : ${justes} juste${justes > 1 ? "s" : ""} sur ${calculs} (${AIDER.seancesCalculs} dernières séances)`, etoile: null});
    }
    return raisons.sort((p, q) => p.rang - q.rang);
  }

  // « J’apprends arrêté 3 fois : Additionner au-delà de 100 » — la raison,
  // avec une majuscule.
  const majuscule = texte => texte.charAt(0).toUpperCase() + texte.slice(1);
  function texteRaison(raison) {
    return majuscule(raison.etoile ? `${raison.texte} : ${majuscule(nomCompetenceCalcul(raison.etoile.module, raison.etoile.niveau))}` : raison.texte);
  }

  // Les élèves à aider, dans l'ordre de la feuille : [{eleve, raisons}].
  function aiderCalcul() {
    return ordreDeLaFeuille(elevesDeLOnglet()).map(eleve => ({eleve, raisons: raisonsAider(eleve.lu)})).filter(a => a.raisons.length);
  }

  // ----- « À reprendre en classe » (aucun prénom à l'écran)

  // Les erreurs les plus fréquentes de la classe, depuis le début : par cause
  // d'un module, combien d'élèves l'ont faite (2 au moins), combien de fois.
  // Les plus partagées d'abord, 3 au plus. [{module, cause, eleves: [élève],
  // n}].
  function erreursFrequentesCalcul() {
    if (!CALCUL || !CALCUL_CORE) return [];
    const parCause = new Map();
    elevesDeLOnglet().forEach(eleve => {
      const lu = eleve.lu;
      if (!lu || !lu.lisible) return;
      (lu.causes || []).forEach(c => {
        if (!c.n || !nomCauseCalcul(c.module, c.cause)) return;
        const cle = `${c.module}:${c.cause}`;
        const o = parCause.get(cle) || {module: c.module, cause: c.cause, eleves: [], n: 0};
        o.eleves.push(eleve);
        o.n += c.n;
        parCause.set(cle, o);
      });
    });
    return [...parCause.values()].filter(o => o.eleves.length >= 2)
      .sort((p, q) => q.eleves.length - p.eleves.length || q.n - p.n || p.module.localeCompare(q.module) || p.cause - q.cause)
      .slice(0, 3);
  }

  // « ouvrir en classe » d'une erreur : la première étoile du module (dans
  // l'ordre de ses niveaux) qu'un de ces élèves n'a pas « tenue ».
  function niveauAReprendre(module, liste) {
    const niveaux = etoilesDuPlan().filter(x => x.module === module).map(x => x.niveau).sort((a, b) => a - b);
    return niveaux.find(n => liste.some(eleve => etoileDe(eleve.lu, `${module}-${n}`).etat !== "tenu")) || niveaux[0] || 1;
  }

  // Les étoiles qui résistent : « Je tente » raté ou J'apprends arrêté (pas
  // gagnée), perdue, ratée au dernier retour, à voir en classe — chez 2
  // élèves ou plus. Les « à voir en classe » d'abord, puis les plus
  // partagées, puis l'ordre de la carte ; 3 au plus.
  const RESISTE = ["classe", "essai", "perdue", "rate"];
  function etoilesQuiResistent() {
    const liste = elevesDeLOnglet().filter(eleve => eleve.lu && eleve.lu.lisible && eleve.lu.commence);
    const sortie = [];
    etoilesDuPlan().forEach((x, rang) => {
      const qui = liste.filter(eleve => RESISTE.includes(etoileDe(eleve.lu, x.cle).etat));
      if (qui.length < 2) return;
      const par = {tente: 0, arrete: 0, perdue: 0, rate: 0, classe: 0};
      qui.forEach(eleve => {
        const e = etoileDe(eleve.lu, x.cle);
        if (e.etat === "essai") par[e.tentes ? "tente" : "arrete"] += 1;
        else par[e.etat] += 1;
      });
      sortie.push({etoile: x, rang, qui, par});
    });
    return sortie.sort((p, q) => q.par.classe - p.par.classe || q.qui.length - p.qui.length || p.rang - q.rang).slice(0, 3);
  }

  // « 1 « Je tente » raté · 1 à voir en classe »
  function detailResiste(par) {
    const s = n => (n > 1 ? "s" : "");
    return [[par.tente, `« Je tente » raté${s(par.tente)}`], [par.arrete, `J’apprends arrêté${s(par.arrete)}`], [par.rate, `ratée${s(par.rate)} au retour`],
      [par.perdue, `perdue${s(par.perdue)}`], [par.classe, "à voir en classe"]].filter(([n]) => n).map(([n, mot]) => `${n} ${mot}`).join(" · ");
  }

  // ----- le tableau : une ligne par élève — sa ceinture, ses étoiles
  // gagnées (en tout, et par classe dessous), combien sont « à surveiller »
  // (les étoiles qui ont une raison d'« À aider »), ses séances des 4
  // dernières semaines, son dernier jour de travail.
  function dessinerTableauCalcul(corps, ecriture, lignes = eleves) {
    $("fragiles").hidden = true;
    lignes.forEach(eleve => {
      const ligne = document.createElement("tr");
      const cNom = celluleNomTexte(eleve);
      const lu = eleve.lu || {};
      const compte = compteEtoiles(lu);

      const cEtoiles = document.createElement("td");
      cEtoiles.append(el("span", `pastille ${compte.gagnees ? "p-vert" : "p-gris"}`, lu.commence ? `${compte.gagnees} / ${compte.total}` : "—"));
      // Par classe, celles où quelque chose a été fait : « CP 14/14 · CE1 20/20 ».
      const etages = lu.commence ? compte.etages.filter(e => e.touchees > 0) : [];
      if (etages.length) cEtoiles.append(el("span", "dc-paliers", etages.map(e => `${nomCourtPalier(e.etage)} ${e.gagnees}/${e.total}`).join(" · ")));

      const cSurveiller = document.createElement("td");
      cSurveiller.className = "dc-revoir";
      const surveiller = raisonsAider(lu).filter(r => r.etoile);
      if (!lu.commence) {
        cSurveiller.textContent = "—";
        cSurveiller.classList.add("sans");
      } else {
        const fort = surveiller.some(r => r.rang === 1);
        const pastille = el("span", `pastille ${surveiller.length ? (fort ? "p-rouge" : "p-orange") : "p-vert"}`,
          surveiller.length ? `${surveiller.length} à surveiller` : "0");
        if (surveiller.length) pastille.title = surveiller.map(texteRaison).join(" · ");
        cSurveiller.append(pastille);
      }

      const cSeances = document.createElement("td");
      const seances = lu.seances || {quatreSemaines: 0, semaine: 0};
      if (!lu.commence) { cSeances.textContent = "—"; cSeances.className = "sans"; }
      else {
        cSeances.append(el("b", "", String(seances.quatreSemaines)));
        if (seances.semaine) cSeances.append(document.createTextNode(` · ${seances.semaine} cette semaine`));
        // Le lundi, la semaine commence : rien en rouge (décision du 07/11).
        else if (seances.quatreSemaines && aujourdhuiSuivi() !== lundiDuJour(aujourdhuiSuivi())) cSeances.append(el("span", "alerte", "rien cette semaine"));
      }

      const cDate = document.createElement("td");
      const quand = jourCourtCalcul(lu.dernier);
      cDate.textContent = quand || "rien reçu";
      if (!quand) cDate.className = "sans";

      // Lot 4 « les ceintures » : la ceinture qu'il porte.
      const cCeinture = celluleCeinture(lu);

      // Au téléphone, « Ceinture », « À surveiller » et « Séances » se
      // cachent (le tableau tient en 356 px) : « N à surveiller » passe
      // sous le prénom.
      [cCeinture, cSurveiller, cSeances].forEach(large);
      ligne.append(cNom, cCeinture, cEtoiles, cSurveiller, cSeances, cDate);
      finirLigne(ligne, eleve, cNom);
      if (lu.commence && surveiller.length) indiceTelephone(cNom, `${surveiller.length} à surveiller`, "fort");
      corps.appendChild(ligne);
    });

    dessinerAider();
    dessinerObjectifCalcul();
    dessinerReprendre();
    dessinerOuEnEst();
    dessinerQuiSentraine();
    $("dc-imprimer-grille").hidden = !parLaClasse("defi-calcul") && !eleves.some(e => e.lu && e.lu.commence) || !CALCUL;
    // La ligne du haut dit aussi sur quoi on compte : les étoiles que
    // l'appli propose aujourd'hui, sur celles de la carte.
    const ouvertes = lignes.length && lignes[0].lu && lignes[0].lu.ouvert ? lignes[0].lu.ouvert.total : 0;
    const total = lignes.length && lignes[0].lu ? lignes[0].lu.total : 0;
    $("resume-classe").textContent = resumeDeLaClasse(eleves, aDuTravail)
      + (ouvertes && total ? ` · ${ouvertes} étoile${ouvertes > 1 ? "s" : ""} ouverte${ouvertes > 1 ? "s" : ""} dans l’appli, sur les ${total} de la carte` : "");
    if (!CALCUL || !CALCUL_CORE) {
      messager("message-appli",
        "La progression ne peut pas être détaillée : les moteurs de Défi calcul (prof/defi_calcul_core.js et prof/defi_calcul_mon_parcours.js) n’ont pas pu être chargés — vérifie qu’ils sont bien déposés sur le serveur.",
        "erreur");
    }
    dessinerPapier();
  }

  // Lot 4 « les ceintures » : la cellule du tableau (« — » tant que rien
  // n'est reçu), et la phrase de la fiche de l'élève.
  function celluleCeinture(lu) {
    const td = document.createElement("td");
    const c = lu && lu.ceintures;
    if (!lu || !lu.commence || !c || !CALCUL_CORE || !CALCUL_CORE.CEINTURES) { td.textContent = "—"; td.className = "sans"; return td; }
    const porte = ceinturePortee(c);
    const barrettes = Math.max(0, Math.min(3, Math.floor(Number(c.barrettes) || 0)));
    const bloc = document.createElement("span");
    bloc.className = "dc-ceinture";
    const dessin = document.createElement("span");
    dessin.className = "dc-ceinture-dessin";
    dessin.replaceChildren(CALCUL_CORE.elementCeinture(document, porte, {barrettes, taille: 34}));
    const nom = document.createElement("span");
    nom.textContent = CALCUL_CORE.CEINTURES[porte].court;
    bloc.append(dessin, nom);
    td.append(bloc);
    td.title = texteCeinture(c);
    return td;
  }
  function texteCeinture(c) {
    if (!c || !CALCUL_CORE || !CALCUL_CORE.CEINTURES) return "";
    const porte = ceinturePortee(c);
    const date = porte && Array.isArray(c.dates) ? jourCourtCalcul(c.dates[porte - 1]) : "";
    const barrettes = Math.max(0, Math.min(3, Math.floor(Number(c.barrettes) || 0)));
    return [CALCUL_CORE.CEINTURES[porte].nom + (date ? `, gagnée le ${date}` : ""),
      c.prochaine && barrettes ? `${barrettes} barrette${barrettes > 1 ? "s" : ""} vers la ${CALCUL_CORE.CEINTURES[c.prochaine].nom.toLowerCase()}` : ""].filter(Boolean).join(" · ");
  }

  // « CP », « CE1 », … « 6e » : l'étage, en un mot, sous le compte.
  function nomCourtPalier(numero) {
    return CLASSES_ETAGES[numero] || `palier ${numero}`;
  }

  // « ven. 27/11 » : le dernier jour de travail, une date du parcours.
  function jourCourtCalcul(jour) {
    if (!jour) return "";
    const date = new Date(String(jour) + "T12:00:00Z");
    if (isNaN(date)) return "";
    return date.toLocaleDateString("fr-FR", {timeZone: "Indian/Reunion", weekday: "short", day: "2-digit", month: "2-digit"});
  }

  // ----- « Notre classe, ensemble » : les étoiles gagnées de tout le monde,
  // sur toutes les étoiles de la carte, et combien ont fait une séance cette
  // semaine. Aucun nom ; CACHÉE tant qu'aucune étoile n'est gagnée dans la
  // classe (une barre vide n'est pas un objectif).
  function objectifCalcul() {
    if (!CALCUL || !eleves.length) return null;
    const lus = eleves.map(eleve => eleve.lu).filter(lu => lu && lu.lisible);
    const parEleve = etoilesDuPlan().length;
    return {
      fait: lus.reduce((somme, lu) => somme + compteEtoiles(lu).gagnees, 0),
      total: eleves.length * parEleve,
      semaine: lus.filter(lu => lu.seances.semaine > 0).length,
      seances: lus.reduce((somme, lu) => somme + lu.seances.semaine, 0)
    };
  }

  const nombreFr = n => Number(n).toLocaleString("fr-FR");

  function dessinerObjectifCalcul() {
    const bloc = $("objectif");
    const objectif = objectifCalcul();
    const lignes = $("objectif-lignes");
    lignes.textContent = "";
    if (!objectif || !objectif.total || !objectif.fait) { bloc.hidden = true; return; }
    const part = Math.max(0, Math.min(1, objectif.fait / objectif.total));
    $("objectif-barre").style.width = `${Math.round(part * 100)}%`;
    $("objectif-compte").textContent = `Ensemble : ${nombreFr(objectif.fait)} étoile${objectif.fait > 1 ? "s" : ""} sur ${nombreFr(objectif.total)}`;
    const li = document.createElement("li");
    const morceau = (texte, fort) => {
      const span = document.createElement("span");
      span.className = "insecable";
      span.append(document.createTextNode(texte));
      const b = document.createElement("b");
      b.textContent = fort;
      span.append(b);
      return span;
    };
    li.append(morceau("Cette semaine : ", `${objectif.semaine} élève${objectif.semaine > 1 ? "s" : ""} sur ${eleves.length}`),
      document.createTextNode(" · "), morceau("", `${objectif.seances} séance${objectif.seances > 1 ? "s" : ""}`));
    lignes.appendChild(li);
    bloc.hidden = false;
  }

  // « Copier la liste » : le texte dans le presse-papiers ; le bouton dit
  // « Copié » deux secondes, sans changer de largeur (rien ne bouge).
  function boutonCopier(texteDe) {
    const bouton = el("button", "secondaire dc-copier", "Copier la liste");
    bouton.type = "button";
    bouton.addEventListener("click", evenement => {
      evenement.stopPropagation();
      const texte = texteDe();
      try { if (navigator.clipboard) navigator.clipboard.writeText(texte); } catch (_) { /* le presse-papiers refusé : rien */ }
      bouton.textContent = "Copié ✓";
      setTimeout(() => { bouton.textContent = "Copier la liste"; }, 2000);
    });
    return bouton;
  }

  // ----- « À aider » (avec les prénoms : à ne pas projeter)
  function dessinerAider() {
    const bloc = $("dc-aider");
    const liste = $("dc-aider-liste");
    liste.textContent = "";
    $("dc-aider-pied").textContent = "";
    const qui = CALCUL && CALCUL_CORE ? aiderCalcul() : [];
    if (!qui.length) { bloc.hidden = true; return; }
    qui.forEach(({eleve, raisons}) => {
      const li = el("li", "");
      li.append(lienFiche(eleve));
      const raison = raisons[0];
      const dit = el("span", "dc-raison", texteRaison(raison));
      const autres = raisons.length - 1;
      const sous = [raison.etoile ? CLASSES_ETAGES[raison.etoile.etage] || "" : "",
        autres ? `et ${autres} autre${autres > 1 ? "s" : ""} chose${autres > 1 ? "s" : ""} : voir sa fiche` : ""].filter(Boolean).join(" · ");
      if (sous) dit.append(el("small", "", sous));
      li.append(dit);
      liste.append(li);
    });
    $("dc-aider-pied").append(boutonCopier(() => qui.map(({eleve, raisons}) => `${nomAffiche(eleve) || "sans prénom"} : ${texteRaison(raisons[0])}`).join("\n")),
      el("span", "sous", "toucher un prénom : sa fiche"));
    bloc.hidden = false;
  }

  // Les prénoms d'un « 18 élèves sur 24 », par-dessus la page, avec
  // « Copier la liste ».
  function popPrenoms(titre, groupes) {
    return pop => {
      pop.append(el("strong", "", titre));
      const tous = [];
      groupes.forEach(([mot, liste]) => {
        const qui = ordreDeLaFeuille(liste);
        if (!qui.length) return;
        const p = prenomsEnLiens(qui);
        if (mot) p.prepend(el("b", "", `${mot} (${qui.length}) : `));
        pop.append(p);
        qui.forEach(eleve => { if (!tous.includes(eleve)) tous.push(eleve); });
      });
      const pied = el("p", "dc-pop-pied");
      pied.append(boutonCopier(() => tous.map(eleve => nomAffiche(eleve) || "sans prénom").join("\n")));
      pop.append(pied);
    };
  }

  function dessinerReprendre() {
    const bloc = $("dc-reprendre");
    const corps = $("dc-reprendre-corps");
    corps.textContent = "";
    garderPopEleves();
    const erreurs = erreursFrequentesCalcul();
    const resistent = etoilesQuiResistent();
    if (!erreurs.length && !resistent.length) { bloc.hidden = true; return; }
    const sur = elevesDeLOnglet().length;
    if (erreurs.length) {
      corps.append(el("p", "dc-sous-titre", "Les erreurs les plus fréquentes · depuis le début"));
      const ul = el("ul", "dc-cartes-erreurs");
      erreurs.forEach(o => {
        const li = el("li", "");
        const tete = el("div", "dc-tete-erreur");
        const quoi = el("span", "");
        const nom = nomCauseCalcul(o.module, o.cause);
        quoi.append(el("b", "", nom.charAt(0).toUpperCase() + nom.slice(1)), el("small", "", nomModuleCalcul(o.module)));
        tete.append(quoi, boutonNombre(`${o.eleves.length} élèves sur ${sur}`, popPrenoms(nom.charAt(0).toUpperCase() + nom.slice(1), [["", o.eleves]])));
        li.append(tete);
        const niveau = niveauAReprendre(o.module, o.eleves);
        const exemple = exempleErreur(o.module, o.cause, niveau);
        if (exemple) {
          const ex = el("span", "dc-exemple", `ex. ${exemple.texte.replace(/□/g, "?")} · réponse donnée : `);
          ex.append(el("b", "", exemple.reponse));
          li.append(ex);
          if (exemple.dit) {
            const dit = el("span", "dc-dit");
            dit.append(el("i", "", "L’appli lui dit : "), document.createTextNode(`« ${exemple.dit} »`));
            li.append(dit);
          }
        }
        li.append(lienOuvrirEnClasse(o.module, niveau));
        ul.append(li);
      });
      corps.append(ul);
    }
    if (resistent.length) {
      corps.append(el("p", "dc-sous-titre", "Les étoiles qui résistent · chez 2 élèves ou plus"));
      const ul = el("ul", "dc-cartes-erreurs");
      resistent.forEach(r => {
        const li = el("li", "");
        const tete = el("div", "dc-tete-erreur");
        const quoi = el("span", "");
        const nom = majuscule(nomCompetenceCalcul(r.etoile.module, r.etoile.niveau));
        quoi.append(el("b", "", nom), el("small", "", `${CLASSES_ETAGES[r.etoile.etage] || ""} · ${r.etoile.ligne} · ${detailResiste(r.par)}`));
        const groupes = ETATS_GRILLE.filter(etat => RESISTE.includes(etat)).map(etat => {
          const liste = r.qui.filter(eleve => etoileDe(eleve.lu, r.etoile.cle).etat === etat);
          return [MOTS_GRILLE[etat].charAt(0).toUpperCase() + MOTS_GRILLE[etat].slice(1), liste];
        });
        tete.append(quoi, boutonNombre(`${r.qui.length} élèves sur ${sur}`, popPrenoms(nom, groupes)));
        li.append(tete, lienOuvrirEnClasse(r.etoile.module, r.etoile.niveau));
        ul.append(li);
      });
      corps.append(ul);
    }
    corps.append(el("p", "sous dc-note-bas", "toucher « … élèves » : les prénoms, et « Copier la liste »"));
    bloc.hidden = false;
  }

  // Ce que l'appli va faire d'une étoile qui coince (les règles du lot P1,
  // § 10 de defi-calcul-parcours-DECISIONS-26-11.md) : `e`, l'étoile lue
  // (etoileDe).
  function suiteCalcul(e) {
    const aujourdhui = CALCUL ? CALCUL.jourLocal() : "";
    const quand = jour => (jour && CALCUL && jour === CALCUL.ajouterJours(aujourdhui, 1) ? "demain" : jour && jour > aujourdhui ? `le ${jourCourtCalcul(jour)}` : "");
    if (e.etat === "classe") {
      if (e.arrets >= 3) {
        const retour = quand(e.echeance);
        return `J’apprends arrêté 3 fois : à voir en classe · ${retour ? `elle revient dans ses étoiles ${retour}` : "elle se rejoue déjà"}`;
      }
      return `perdue ${e.perdues} fois : à voir en classe`;
    }
    if (e.etat === "rate") return `ratée à son dernier retour · elle reste et revient ${quand(e.echeance) || "à sa prochaine séance"} ; ratée encore, elle part`;
    if (e.etat === "perdue") return `perdue au retour (deux retours ratés de suite) · à regagner par « Je tente » ou J’apprends${e.perdues > 1 ? ` · perdue ${e.perdues} fois` : ""}`;
    if (e.etat === "essai") {
      if (e.tentes >= 2) return "« Je tente » raté 2 fois · seulement J’apprends, jusqu’à ce qu’elle soit gagnée";
      const morceaux = [];
      if (e.tentes) morceaux.push(`« Je tente » raté${e.tenteLe ? ` le ${jourCourtCalcul(e.tenteLe)}` : ""}`);
      if (e.arrets) morceaux.push(`J’apprends arrêté ${e.arrets} fois · au 3e arrêt, elle sera à voir en classe`);
      return morceaux.join(" · ");
    }
    return "";
  }

  // La fenêtre de l'élève, Défi calcul : ses chiffres, ce qui coince chez lui
  // (« À voir en classe », puis « À surveiller »), ses séances, ses étoiles
  // étage par étage (la grille, ses mots), ses erreurs les plus fréquentes.
  function contenuCalcul(eleve) {
    const cellule = document.createElement("div");
    const lu = eleve.lu || {};
    if (!CALCUL || !CALCUL_CORE) { cellule.append(paragrapheVide("Les moteurs de Défi calcul n’ont pas pu être chargés.")); return cellule; }
    if (!lu.lisible || !lu.commence) { cellule.append(paragrapheVide("Rien reçu pour l’instant.")); return cellule; }
    const compte = compteEtoiles(lu);
    const raisons = raisonsAider(lu);
    const surveiller = raisons.filter(r => r.etoile);
    const aVoir = surveiller.filter(r => r.rang === 1).length;
    const ceinture = lu.ceintures && CALCUL_CORE.CEINTURES ? lu.ceintures : null;
    const ceintureDetail = ceinture ? texteCeinture(ceinture).split(" · ") : [];
    cellule.append(ficheChiffres([
      ...(ceinture ? [["Ceinture", CALCUL_CORE.CEINTURES[ceinturePortee(ceinture)].court,
        [ceintureDetail[0].replace(/^Ceinture \S+(, )?/, ""), (ceintureDetail[1] || "").replace(/ vers la .*$/, "")].filter(Boolean).join(" · ")]] : []),
      ["Étoiles", `${compte.gagnees} / ${compte.total}`, `dont ${compte.tenues} qui ${compte.tenues > 1 ? "ont" : "a"} réussi un retour`],
      ["À surveiller", String(surveiller.length), aVoir ? `dont ${aVoir} à voir en classe` : ""],
      ["Séances · 4 semaines", String(lu.seances.quatreSemaines), lu.seances.semaine ? `${lu.seances.semaine} cette semaine` : "aucune cette semaine"],
      ["Dernière activité", jourCourtCalcul(lu.dernier) || "rien reçu"]
    ]));
    // Ce qui ne tient pas à une étoile (rien gagné, calculs du jour) : une
    // ligne au-dessus des étoiles.
    raisons.filter(r => !r.etoile).forEach(r => cellule.append(el("p", "dc-alerte-ligne", texteRaison(r))));

    // Ce qui coince chez lui : les étoiles à voir en classe, puis toutes
    // celles qui ne sont ni gagnées ni vides, ou ratées au dernier retour.
    const etoilesQui = test => etoilesDuPlan().filter(x => test(etoileDe(lu, x.cle)));
    const blocAlerte = (titre, liste, classeCss) => {
      if (!liste.length) return;
      const bloc = el("div", "dc-bloc");
      bloc.append(el("h3", "", titre));
      const ul = el("ul", "dc-alerte");
      liste.forEach(x => {
        const e = etoileDe(lu, x.cle);
        const li = el("li", classeCss);
        li.append(el("b", "", nomCompetenceCalcul(x.module, x.niveau)), document.createTextNode(" "), lienOuvrirEnClasse(x.module, x.niveau),
          el("small", "dc-detail", `${CLASSES_ETAGES[x.etage] || ""} · ${x.ligne}`));
        li.append(el("span", "dc-detail", suiteCalcul(e)));
        const cause = ligneCauseEtoile(lu, x.module, x.niveau);
        if (cause) { cause.className = "dc-detail"; li.append(cause); }
        ul.append(li);
      });
      bloc.append(ul);
      cellule.append(bloc);
    };
    blocAlerte("À voir en classe", etoilesQui(e => e.etat === "classe"), "");
    blocAlerte("À surveiller", etoilesQui(e => e.etat === "perdue" || e.etat === "rate" || e.etat === "essai"), "dc-revoir");

    cellule.append(seancesCalcul(eleve));
    const blocEtoiles = el("div", "dc-bloc");
    blocEtoiles.append(etoilesEnCases(lu));
    cellule.append(blocEtoiles);

    // Ses erreurs les plus fréquentes (depuis le début : le serveur n'a pas
    // de semaine), 4 au plus, avec un exemple regénéré et ce que l'appli lui
    // dit.
    const causes = (lu.causes || []).filter(c => nomCauseCalcul(c.module, c.cause)).slice(0, 4);
    if (causes.length) {
      const bloc = el("div", "dc-bloc");
      const h3 = el("h3", "", "Ses erreurs les plus fréquentes ");
      h3.append(el("small", "", "· depuis le début"));
      bloc.append(h3);
      const ul = el("ul", "dc-causes");
      causes.forEach(c => {
        const li = el("li", "");
        li.append(el("b", "", nomCauseCalcul(c.module, c.cause)), document.createTextNode(` × ${c.n} · ${nomModuleCalcul(c.module)}`));
        const exemple = exempleErreur(c.module, c.cause);
        if (exemple) {
          li.append(el("small", "", ` · ex. ${exemple.texte.replace(/□/g, "?")} → ${exemple.reponse}`));
          if (exemple.dit) li.append(el("small", "dc-dit-fiche", `L’appli lui dit : « ${exemple.dit} »`));
        }
        ul.append(li);
      });
      bloc.append(ul);
      cellule.append(bloc);
    }
    return cellule;
  }

  // « ex. 61 + ? = 100 → 49 · chaque chiffre complété à 10 » — la cause la
  // plus fréquente du module chez l'élève, et un exemple regénéré à ce
  // niveau ; null quand aucune cause n'est connue.
  function ligneCauseEtoile(lu, id, niveau) {
    let meilleure = null;
    (lu.causes || []).filter(c => c.module === id).forEach(c => { if (!meilleure || c.n > meilleure.n) meilleure = c; });
    if (!meilleure) return null;
    const nom = nomCauseCalcul(id, meilleure.cause);
    if (!nom) return null;
    const exemple = exempleErreur(id, meilleure.cause, niveau);
    const morceau = document.createElement("small");
    if (exemple) {
      morceau.append(document.createTextNode(`ex. ${exemple.texte.replace(/□/g, "?")} → `));
      morceau.append(el("i", "", exemple.reponse), document.createTextNode(` · ${nom}`));
    } else {
      morceau.textContent = nom;
    }
    return morceau;
  }

  // ----------------------------------------------- Défi calcul : les feuilles

  // La fiche d'un élève, en noir et blanc : ses chiffres, ce qui coince, ses
  // étoiles étage par étage (signes), ses erreurs fréquentes. Les mots de
  // la grille ; rien d'autre que ce que montre la fenêtre, aucun code.
  function remplirFicheCalcul(eleve) {
    const lu = eleve.lu || {};
    const nom = nomAffiche(eleve) || "Élève sans prénom";
    $("fd-titre").textContent = `${nom} — Défi calcul`;
    const compte = compteEtoiles(lu);
    $("fd-sous").textContent = `${classe ? classe.libelle : ""} · ${jourLisible(CALCUL.jourLocal())} · ${compte.gagnees} étoile${compte.gagnees > 1 ? "s" : ""} sur ${compte.total} · ${lu.seances.quatreSemaines} séance${lu.seances.quatreSemaines > 1 ? "s" : ""} sur 4 semaines`;
    const corps = $("fd-corps");
    corps.textContent = "";
    const section = titre => corps.append(el("h3", "", titre));
    const raisons = raisonsAider(lu);
    const coincent = etoilesDuPlan().filter(x => ["classe", "perdue", "rate", "essai"].includes(etoileDe(lu, x.cle).etat));
    if (coincent.length || raisons.some(r => !r.etoile)) {
      section("À surveiller");
      const ul = document.createElement("ul");
      raisons.filter(r => !r.etoile).forEach(r => ul.append(el("li", "", texteRaison(r))));
      coincent.forEach(x => {
        const e = etoileDe(lu, x.cle);
        const li = document.createElement("li");
        li.append(el("b", "", `${SIGNES_GRILLE[e.etat]} ${nomCompetenceCalcul(x.module, x.niveau)} · ${CLASSES_ETAGES[x.etage] || ""}`),
          document.createTextNode(` — ${suiteCalcul(e)}`));
        const cause = ligneCauseEtoile(lu, x.module, x.niveau);
        if (cause) li.append(document.createTextNode(` — ${cause.textContent}`));
        ul.append(li);
      });
      corps.append(ul);
    }
    section("Ses étoiles");
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    ["Classe", "Ligne", "Étoiles"].forEach(t => tr.append(el("th", "", t)));
    thead.append(tr);
    table.append(thead);
    const tbody = document.createElement("tbody");
    // Un étage où rien n'est fait tient en une ligne, sous le tableau.
    const replies = [];
    planCalcul().forEach(etage => {
      const gagnees = compte.etages.find(e => e.etage === etage.etage) || {gagnees: 0, touchees: 0};
      if (!gagnees.touchees) { replies.push(`${nomPalierCalcul(etage.etage)} (${etage.total})`); return; }
      etage.lignes.forEach((ligne, index) => {
        const tr2 = document.createElement("tr");
        tr2.append(el("td", "", index === 0 ? `${CLASSES_ETAGES[etage.etage] || ""} · ${gagnees.gagnees}/${etage.total}` : ""), el("td", "", ligne.nom));
        const td = el("td", "fd-etats");
        ligne.cases.forEach(x => td.append(el("span", "", `${SIGNES_GRILLE[etoileDe(lu, x.cle).etat]} ${nomCompetenceCalcul(x.module, x.niveau)}`)));
        tr2.append(td);
        tbody.append(tr2);
      });
    });
    table.append(tbody);
    corps.append(table);
    if (replies.length) corps.append(el("p", "", `Pas encore commencé : ${replies.join(", ")}.`));
    const causes = (lu.causes || []).filter(c => nomCauseCalcul(c.module, c.cause)).slice(0, 4);
    if (causes.length) {
      section("Ses erreurs les plus fréquentes");
      const ul = document.createElement("ul");
      causes.forEach(c => {
        const exemple = exempleErreur(c.module, c.cause);
        ul.append(el("li", "", `${nomCauseCalcul(c.module, c.cause)} × ${c.n} · ${nomModuleCalcul(c.module)}`
          + (exemple ? ` · ex. ${exemple.texte.replace(/□/g, "?")} → ${exemple.reponse}${exemple.dit ? ` · l’appli lui dit : « ${exemple.dit} »` : ""}` : "")));
      });
      corps.append(ul);
    }
    corps.append(el("p", "fd-legende", ETATS_GRILLE.map(etat => `${SIGNES_GRILLE[etat]} ${MOTS_GRILLE[etat]}`).join("   ·   ")));
  }

  // La grille de la classe, imprimée : une ligne par élève, une colonne par
  // ligne de la carte (« 3/4 » étoiles gagnées, « ✓ » toutes, « ? » une à
  // voir en classe, « · » rien), les étoiles, les séances.
  function remplirGrilleCalcul() {
    $("gd-titre").textContent = `${classe ? classe.libelle : ""} — Défi calcul`;
    const lignes = elevesDeLOnglet();
    $("gd-sous").textContent = `${jourLisible(CALCUL.jourLocal())} · ${lignes.length} élève${lignes.length > 1 ? "s" : ""}`;
    const corps = $("gd-corps");
    corps.textContent = "";
    const colonnes = planCalcul().flatMap(e => e.lignes.map(l => ({etage: e.etage, nom: l.nom, cases: l.cases})));
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    tr.append(el("th", "", "Élève"));
    colonnes.forEach(c => tr.append(el("th", "fd-mod", `${CLASSES_ETAGES[c.etage] || ""} · ${c.nom}`)));
    ["Étoiles", "Séances · 4 sem."].forEach(t => tr.append(el("th", "fd-mod", t)));
    thead.append(tr);
    table.append(thead);
    const tbody = document.createElement("tbody");
    lignes.forEach(eleve => {
      const lu = eleve.lu || {};
      const ligne = document.createElement("tr");
      ligne.append(el("td", "", nomAffiche(eleve) || "sans prénom"));
      colonnes.forEach(c => {
        let texte = "·";
        if (lu.commence) {
          const etats = c.cases.map(x => etoileDe(lu, x.cle).etat);
          const gagnees = etats.filter(gagneeGrille).length;
          if (gagnees === etats.length) texte = "✓";
          else if (etats.some(etat => etat !== "vide")) texte = `${gagnees}/${etats.length}`;
          if (etats.includes("classe")) texte += " ?";
        }
        ligne.append(el("td", "fd-mod", texte));
      });
      const compte = compteEtoiles(lu);
      ligne.append(el("td", "fd-mod", lu.commence ? `${compte.gagnees} / ${compte.total}` : "—"),
        el("td", "fd-mod", lu.commence ? String(lu.seances.quatreSemaines) : "—"));
      tbody.append(ligne);
    });
    table.append(tbody);
    corps.append(table);
    corps.append(el("p", "fd-legende", "✓ toutes les étoiles de la ligne gagnées   ·   3/4 étoiles gagnées sur 4   ·   ? une étoile à voir en classe   ·   · rien encore"));
  }

  // « Imprimer sa fiche » (fenêtre) et « Imprimer la grille » (onglet) : la
  // feuille, seule, remplie le temps de l'impression puis vidée. Un collègue
  // « voir seulement » peut imprimer : aucun code n'y figure.
  function imprimerCalcul(quoi) {
    if (!CALCUL || !CALCUL_CORE || !classe) return false;
    const eleve = eleveDe("defi-calcul", fenetreEleveId);
    if (quoi === "eleve" && (!eleve || !eleve.lu || !eleve.lu.commence)) return false;
    quitterImpressions();
    const numero = ++numeroImpression;
    const classeCss = quoi === "eleve" ? "imprime-defi-calcul" : "imprime-defi-calcul-grille";
    if (quoi === "eleve") remplirFicheCalcul(eleve);
    else remplirGrilleCalcul();
    document.body.classList.add(classeCss);
    let fait = false;
    const nettoyer = () => {
      if (fait) return;
      fait = true;
      window.removeEventListener("afterprint", nettoyer);
      if (numero !== numeroImpression) return;
      document.body.classList.remove(classeCss);
      ["fd-titre", "fd-sous", "fd-corps", "gd-titre", "gd-sous", "gd-corps"].forEach(id => { $(id).textContent = ""; });
    };
    window.addEventListener("afterprint", nettoyer);
    setTimeout(nettoyer, 60000);
    window.print();
    return true;
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
  // Ce qui part chez l'enfant, d'un seul tenant : son numéro et son prénom,
  // l'adresse où entrer, son code, et « ton code est personnel ». Le prénom
  // sert à distribuer sans échange ; il ne protège ni n'expose rien de plus
  // que le code, puisque l'espace élève affiche le prénom à qui tape le code.
  // La vraie protection reste « Nouveau code » et « Revenir à… ».
  const CONSIGNE_BANDELETTE = "Ton code est personnel : ne le prête à personne.";
  const ADRESSE_ELEVE = "suivi.mathsgo.re";

  // `seulId` (lot « Ma classe : élèves ») : la bandelette d'un seul élève,
  // avec SON numéro de la feuille — le temps d'une impression (imprimer).
  function dessinerBandelettes(seulId) {
    $("bandelettes-titre").textContent = seulId
      ? `Bandelette à découper — ${classe.libelle}` : `Bandelettes à découper — ${classe.libelle}`;
    $("bandelettes-consigne").textContent = seulId
      ? "Découpe sur les pointillés et donne-la à l’élève. Même numéro que sur la feuille prénom\u00a0↔\u00a0code."
      : "Découpe sur les pointillés et donne à chaque élève sa bandelette. Mêmes numéros que sur la feuille prénom\u00a0↔\u00a0code.";
    const liste = $("bandelettes-liste");
    liste.textContent = "";
    ordreDeLaFeuille(eleves).forEach((eleve, index) => {
      if (seulId && eleve.id !== seulId) return;
      const item = document.createElement("li");
      item.className = "bandelette";

      const identite = document.createElement("div");
      identite.className = "identite";
      const numero = document.createElement("span");
      numero.className = "numero";
      numero.textContent = `n° ${index + 1}`;
      const nom = document.createElement("span");
      nom.className = "nom";
      nom.textContent = nomAffiche(eleve) || "—";
      identite.append(numero, nom);

      const part = document.createElement("div");
      part.className = "part";
      const marque = document.createElement("div");
      marque.className = "marque";
      marque.textContent = "maths&go";
      const appli = document.createElement("span");
      appli.className = "appli";
      appli.textContent = "Mon espace";
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

      item.append(identite, part);
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

  // Une impression à la fois, et seulement celle qu'on a demandée. `seul`
  // (lot « Ma classe : élèves », 18/10/2026) : la bandelette de cet élève
  // seulement ; la liste entière revient après l'impression.
  // Lot 4b-bis (relecture Codex du 24/10) : UNE impression à la fois. Si
  // « afterprint » n'est jamais venu (le filet de 60 s n'est pas passé), la
  // feuille précédente gardait sa classe : la feuille des codes sortait avec
  // le parcours Anzan. Chaque impression commence donc par retirer toutes les
  // autres et vider la feuille Anzan ; son nettoyage ne touche à rien si une
  // impression plus récente a commencé (numeroImpression). La déconnexion les
  // retire aussi (viderZones).
  const MODES_IMPRESSION = ["imprime-recap", "imprime-bandelettes", "imprime-anzan", "imprime-defi-calcul", "imprime-defi-calcul-grille"];
  let numeroImpression = 0;
  function quitterImpressions() {
    MODES_IMPRESSION.forEach(mode => document.body.classList.remove(mode));
    ["fa-titre", "fa-compte", "fa-corps", "fa-note", "fd-titre", "fd-sous", "fd-corps", "gd-titre", "gd-sous", "gd-corps"]
      .forEach(id => { const noeud = $(id); if (noeud) noeud.textContent = ""; });
  }

  function imprimer(quoi, seul) {
    if (droitClasse === "lecture") return false;
    const classeCss = quoi === "bandelettes" ? "imprime-bandelettes" : "imprime-recap";
    quitterImpressions();
    const numero = ++numeroImpression;
    if (seul && quoi === "bandelettes") dessinerBandelettes(seul.id);
    document.body.classList.add(classeCss);
    let fait = false;
    const nettoyer = () => {
      if (fait) return;
      fait = true;
      window.removeEventListener("afterprint", nettoyer);
      if (numero !== numeroImpression) return;
      document.body.classList.remove(classeCss);
      if (seul && classe) dessinerPapier();
    };
    window.addEventListener("afterprint", nettoyer);
    // Filet : si le navigateur n'envoie jamais « afterprint » (impression
    // annulée d'une drôle de façon), la classe ne reste pas collée au <body>.
    setTimeout(nettoyer, 60000);
    window.print();
    return true;
  }

  // ---------------------------------------------------------------- actions

  // Ce que la page dit de l'année scolaire.
  //
  // CHANGÉ LE 06/09/2026 : le serveur ne supprime plus rien à l'ouverture de
  // « Mes classes ». Il envoie « echues » — les classes de l'année écoulée qui
  // n'ont pas servi depuis trois semaines — et le professeur décide. Le
  // préavis de fin d'année, lui, ne change pas.
  function annoncerFinAnnee(donnees, combienEnCours) {
    echues = donnees.echues || [];
    montrerEchues();
    if (donnees.preavis_fin_annee && combienEnCours) {
      messager("bandeau-annee",
        `L’année scolaire ${donnees.annee_courante} se termine. Les classes de cette année seront `
        + `supprimées automatiquement à partir du 1er août : prénoms, codes et progressions, il n’en `
        + `restera rien. Imprime avant ce que tu veux garder, et supprime toi-même les classes que tu `
        + `ne veux plus voir.`, "info");
      return;
    }
    messager("bandeau-annee", "", "");
  }

  function texteDesEchues(liste) {
    const noms = liste.map(classe => classe.libelle).join(", ");
    const annees = [...new Set(liste.map(classe => classe.annee))].join(" et ");
    const plusieurs = liste.length > 1;
    return `${liste.length} classe${plusieurs ? "s" : ""} de l’année ${annees} `
      + `ne ${plusieurs ? "servent" : "sert"} plus (${noms}). `
      + `${plusieurs ? "Les" : "La"} supprimer maintenant ? Prénoms, codes et progressions : `
      + `il n’en restera rien. Si tu attends, le ménage automatique de l’été peut `
      + `${plusieurs ? "les" : "la"} supprimer sans prévenir.`;
  }

  function montrerEchues() {
    const bloc = $("bandeau-echues");
    if (!echues.length) {
      $("echues-texte").textContent = "";
      $("supprimer-echues").textContent = "";
      bloc.hidden = true;
      return;
    }
    $("echues-texte").textContent = texteDesEchues(echues);
    $("supprimer-echues").textContent = echues.length > 1
      ? `Supprimer ces ${echues.length} classes` : "Supprimer cette classe";
    bloc.hidden = false;
  }

  // « Me le rappeler plus tard » : le bandeau disparaît pour cette visite, et
  // revient à la prochaine ouverture. Rien n'est enregistré, rien n'est
  // supprimé — et rien n'est REPORTÉ : menage.php (tâche planifiée d'OVH, 2 août
  // et 2 septembre) supprime quand même ces classes. Le texte du bandeau le dit
  // (lot « textes justes », 24/10/2026 ; avant, « Plus tard » laissait croire
  // à un report).
  $("echues-plus-tard").addEventListener("click", () => {
    echues = [];
    montrerEchues();
  });

  $("supprimer-echues").addEventListener("click", async (evenement) => {
    const bouton = evenement.currentTarget;
    const liste = echues.slice();
    if (!liste.length) return;
    const reponse = await demander(
      `Supprimer définitivement ${liste.length > 1 ? "ces " + liste.length + " classes" : "cette classe"} `
      + `(${liste.map(classe => classe.libelle).join(", ")}) ? `
      + `Prénoms, codes et progressions seront effacés : il n’en restera rien. `
      + `Cette action est définitive — seule la sauvegarde du mois les contiendrait encore.`,
      null, {oui: liste.length > 1 ? `Supprimer ces ${liste.length} classes` : "Supprimer cette classe", danger: true});
    if (!reponse) return;
    bouton.disabled = true;
    const ouverte = classe ? classe.id : 0;
    try {
      let faits;
      try { faits = await api("classes.supprimer_echues", {classes: liste.map(classe => classe.id)}); }
      catch (erreur) {
        // Rien n'est sûr : la liste relue dit ce qui reste (la classe
        // ouverte, si elle n'y est plus, est oubliée tout de suite).
        surErreur(erreur, zoneClasses());
        await allerSansPerdre("", ouverte);
        return;
      }
      const partis = faits.supprimees || [];
      const dit = `${partis.length} classe${partis.length > 1 ? "s" : ""} supprimée${partis.length > 1 ? "s" : ""} `
        + `(${partis.join(", ")}). Il n’en reste rien.`;
      // Lot 5d : on reste dans la classe ouverte — sauf si elle était du lot.
      // Correctif des lots 5 (point 3) : elle était du lot — la page l'oublie
      // TOUT DE SUITE, avant de relire la liste ; si la liste ne vient pas,
      // elle ne reste pas à l'écran.
      if (ouverte && liste.some(uneClasse => uneClasse.id === ouverte)) quitterLaClasse();
      if (await allerSansPerdre(dit, ouverte)) messager(zoneClasses(), dit, "ok");
    } finally {
      bouton.disabled = false;
    }
  });

  // La pastille d'une classe dont une séance est ouverte (classes.liste,
  // « direct ») : dans sa ligne du menu « 405 ▾ » (lot 5d ; avant, sur sa tuile).
  const LIBELLES_DIRECT = {eclair: "● En direct", evaluation: "📝 Évaluation"};

  // Lire la liste des classes (classes.liste) : celles du menu « 405 ▾ », et
  // ce que le serveur dit de l'année (les deux bandeaux, en haut de la classe).
  // Lot 5d : elle n'affiche plus aucun écran — allerDansUneClasse le fait. Une
  // erreur remonte à l'appelant.
  // Correctif des lots 5 (relecture Codex, point 1) : une réponse périmée —
  // demandée avant « Se déconnecter », ou avant une navigation plus récente
  // (estAJour) — n'est pas posée : ni la liste, ni les bandeaux. Rien : null.
  async function chargerClasses(estAJour = () => true) {
    const depart = generation;
    const donnees = await api("classes.liste");
    if (depart !== generation || !jeton || !estAJour()) return null;
    classes = donnees.classes || [];
    anneeCourante = String(donnees.annee_courante || "");
    annoncerFinAnnee(donnees, classes.length);
    return classes;
  }

  // La classe à ouvrir (lot 5d) : la première des demandées (l'ancre de la
  // séance en direct, la dernière ouverte sur ce poste, la classe déjà
  // ouverte) qui est encore dans la liste du professeur connecté ; sinon la
  // première des siennes de cette année, sinon la première de cette année
  // (une classe partagée), sinon la première des siennes, sinon la première.
  // 0 : il n'a aucune classe.
  // Correctif des lots 5 (point 9) : « de cette année », c'est l'année de la
  // classe (« annee ») égale à l'année en cours (« annee_courante »), toutes
  // deux dites par classes.liste. Avant, « pas dans echues » : or « echues » ne
  // recense que les vieilles classes sans activité depuis 21 jours — une 301
  // de l'an dernier encore utilisée passait avant la 405 de cette année.
  function classeAOuvrir(liste, demandees, annee) {
    const toutes = liste || [];
    const ids = new Set(toutes.map(uneClasse => uneClasse.id));
    const voulue = (demandees || []).find(id => id && ids.has(id));
    if (voulue) return voulue;
    const deLAnnee = annee ? toutes.filter(uneClasse => uneClasse.annee === annee) : toutes;
    const choisie = deLAnnee.find(uneClasse => uneClasse.droit === "proprietaire") || deLAnnee[0]
      || toutes.find(uneClasse => uneClasse.droit === "proprietaire") || toutes[0];
    return choisie ? choisie.id : 0;
  }

  // Aller dans une classe (lot 5d) : c'est ce qui remplace « Mes classes » à
  // la connexion, après une classe supprimée, au retour de Mon compte et après
  // un mot de passe changé. La liste est relue ; une classe demandée qui n'y
  // est plus (supprimée, partage retiré, autre professeur sur ce poste)
  // n'ouvre rien, on passe à la suivante. Aucune classe : l'écran « Crée ta
  // première classe ». Déjà dans la bonne classe : rien n'est relu.
  //
  // Correctif des lots 5 (relecture Codex du 25/10/2026, points 1 à 4) :
  // - chaque aller porte un numéro (demandeAppli, celui des ouvertures de
  //   classe et des onglets) : un aller plus récent, une classe ouverte depuis
  //   le menu ou « Se déconnecter » le rendent périmé, et sa réponse ne change
  //   plus rien — ni la page, ni l'écran, et elle n'ouvre plus de classe ;
  // - la classe ouverte qui n'est plus dans la liste est oubliée TOUT DE SUITE
  //   (quitterLaClasse), avant même d'ouvrir la suivante ;
  // - une panne (la liste, ou le tableau de la classe à ouvrir) REMONTE à
  //   l'appelant, qui dit ensemble ce qui a réussi et ce qui a échoué
  //   (echecDeLaTransition). Vrai : arrivé ; faux : périmé.
  async function allerDansUneClasse(...demandees) {
    const numero = ++demandeAppli;
    const depart = generation;
    const aJour = () => numero === demandeAppli && depart === generation && Boolean(jeton);
    let lues = null;
    try { lues = await chargerClasses(aJour); }
    catch (erreur) { if (!aJour()) return false; throw erreur; }
    if (!lues || !aJour()) return false;
    if (classe && !classes.some(uneClasse => uneClasse.id === classe.id)) quitterLaClasse();
    const id = classeAOuvrir(classes, demandees, anneeCourante);
    if (!id) {
      if (classe) quitterLaClasse();
      oublierDerniereClasse();
      montrerSansClasse(false);
      return true;
    }
    if (classe && classe.id === id && !$("ecran-classe").hidden) return true;
    return ouvrirClasse(id, {remonter: true});
  }

  // Une transition ratée (correctif des lots 5, points 3 et 4) : la liste des
  // classes ou le tableau de la classe à ouvrir n'ont pas pu être lus. Le
  // message va dans l'écran AFFICHÉ et dit d'abord ce qui a déjà réussi
  // (« Classe 306 supprimée… », « Mot de passe changé… ») ; le geste pour
  // réessayer reste à portée : « Ma classe » sur Mon compte, « Réessayer »
  // quand plus aucune classe n'est ouverte. Rien d'une classe qui n'est plus
  // autorisée ne revient à l'écran.
  function echecDeLaTransition(erreur, avant) {
    if (erreur && erreur.statut === 401) { deconnecter({message: "Session terminée, reconnecte-toi."}); return; }
    const debut = avant ? avant + " " : "";
    if (!$("ecran-compte").hidden) {
      // Après un mot de passe temporaire changé, « Ma classe » revient.
      montrer("ecran-compte");
      messager("message-compte", `${debut}Ta classe n’a pas pu s’ouvrir. ${raisonDe(erreur)} Réessaie avec « Ma classe ».`, "erreur");
      return;
    }
    if (classe && !$("ecran-classe").hidden) {
      messager("message-classes", `${debut}La liste de tes classes n’a pas pu être relue. ${raisonDe(erreur)}`, "erreur");
      return;
    }
    montrerSansClasse(true);
    messager("message-premiere-classe", `${debut}Ta classe n’a pas pu s’ouvrir. ${raisonDe(erreur)}`, "erreur");
  }

  // Aller dans une classe, et dire la panne s'il y en a une (« avant » : ce qui
  // a déjà réussi). Vrai seulement si la classe (ou l'écran sans classe) est
  // à l'écran : l'appelant pose alors son message de réussite.
  async function allerSansPerdre(avant, ...demandees) {
    try { return await allerDansUneClasse(...demandees); }
    catch (erreur) { echecDeLaTransition(erreur, avant); return false; }
  }

  // L'écran sans classe ouverte : « Crée ta première classe » (il n'en a
  // aucune), ou — correctif des lots 5, point 3 — « Ta classe n'a pas pu
  // s'ouvrir » avec « Réessayer » (la liste ou le tableau en panne).
  function montrerSansClasse(enPanne) {
    $("carte-premiere-classe").hidden = enPanne;
    $("carte-reessayer").hidden = !enPanne;
    montrer("ecran-premiere-classe");
  }

  // Plus de classe ouverte (elle vient d'être supprimée, ou n'est plus
  // partagée) : la page n'en garde rien qui puisse resservir — ni dans ses
  // variables, ni dans le document (correctif des lots 5, point 2 :
  // viderLaClasse).
  function quitterLaClasse() {
    demandeAppli += 1;
    fermerFenetreEleve();
    oublierRecherche();
    arreterVeilleEvaluation();
    evaluation = null;
    evalContenu = null;
    ligueRecords = null;
    reglage = null;
    classe = null;
    droitClasse = "proprietaire";
    eleves = [];
    tableaux = {};
    lectureClasse = null;
    idsAffiches = [];
    vue = "appli";
    viderLaClasse();
  }

  // Où dire ce qui arrive aux classes : en haut de la classe ouverte, ou sur
  // l'écran « Crée ta première classe » — ou sur Mon compte quand c'est lui
  // qui est à l'écran (correctif des lots 5, point 4).
  function zoneClasses() {
    if (!$("ecran-compte").hidden) return "message-compte";
    return $("ecran-premiere-classe").hidden ? "message-classes" : "message-premiere-classe";
  }

  // Ouvrir une classe — ou la relire, après un ajout d'élèves, un collage, une
  // restauration, un changement d'activités. Lot « splat-suivi-4 » : on lit le
  // tableau de l'activité à montrer (celle déjà affichée si c'est la même
  // classe, sinon le dernier choix de l'onglet, sinon la première de la
  // classe), et les listes des autres activités sont oubliées : elles seront
  // relues quand on les choisira.
  // Correctif des lots 5 : vrai si la classe est à l'écran, faux si
  // l'ouverture est périmée ; avec {remonter: true} (allerDansUneClasse), une
  // panne remonte au lieu d'être dite ici.
  // Lot 5b, correctif (point 4) : {signal} borne la lecture — la relecture
  // qui suit un enregistrement (relireBornee) s'arrête avec sa garde, le
  // tableau ET le moteur ; arrêtée, elle rend faux sans rien dire (l'appelant
  // le dit).
  async function ouvrirClasse(id, options) {
    // Un changement d'onglet encore en route ne vaut plus : on relit tout.
    // Lot 4b-bis (relecture Codex du 24/10) : le numéro de CETTE ouverture —
    // une autre classe ouverte, ou « Se déconnecter » (oublierEtat), pendant
    // l'attente le rend périmé, et sa réponse n'est plus posée dans la page.
    demandeAppli += 1;
    const numero = demandeAppli;
    const signal = options && options.signal;
    try {
      const memeClasse = Boolean(classe) && classe.id === id;
      const connue = classes.find(uneClasse => uneClasse.id === id);
      // La même classe, rouverte (un élève ajouté, une appli réglée) : on
      // reste dans l'onglet regardé, même s'il vient d'être grisé (lot 5b :
      // chaque appli a toujours son onglet). Une autre classe : l'appli
      // choisie la dernière fois si elle l'a, sinon sa première.
      const voulue = memeClasse && APPLIS.some(appli => appli.cle === appliAffichee)
        ? appliAffichee
        : appliAMontrer(lesApplisConnues(connue ? connue.applis : ["defi-tables"]), lireChoixAppli());
      const [donnees] = await Promise.all([api("tableau", {classe_id: id, appli: voulue}, {signal}), avecSignal(chargerMoteurDe(voulue), signal)]);
      if (numero !== demandeAppli || !jeton) return false;
      classe = donnees.classe;
      droitClasse = classe.droit || "proprietaire";
      // Correctif des lots 5 (point 11) : le menu « 405 ▾ » relit cette ligne —
      // le nom (renommée dans Réglages) et le nombre d'élèves (ajoutés,
      // supprimés) suivent, pas seulement les activités.
      if (connue) {
        connue.applis = classe.applis;
        connue.libelle = classe.libelle;
        connue.eleves = (donnees.eleves || []).length;
      }
      // Une autre classe s'ouvre toujours sur son tableau, jamais sur ses
      // Réglages ni sur ses codes — sauf une classe sans aucun élève, qui
      // s'ouvre sur Élèves : c'est la seule chose utile à y faire.
      if (!memeClasse) {
        // Lot 5c : une autre classe repart sans prénom cherché, fenêtre fermée.
        oublierRecherche();
        fermerFenetreEleve();
        vue = (donnees.eleves || []).length === 0 && droitClasse !== "lecture" ? "eleves"
          // Lot S2 : sur « La classe », le premier onglet — sauf si l'on
          // regardait une appli la dernière fois (retenu le temps de l'onglet).
          : (["", "classe"].includes(lireChoixAppli()) ? "classe" : "appli");
      }
      // Une autre classe s'ouvre en haut de la page — son nom et son résumé —,
      // pas au milieu, là où on en était dans la précédente (lot 5a).
      if (!memeClasse) window.scrollTo(0, 0);
      // Lot S2, correctif après Codex (point 1) : rien de la classe d'avant
      // dans La classe ni dans les cartes de Défi calcul, même cachées.
      if (!memeClasse) { viderZonesClasse(); viderZonesCalcul(); }
      // Lot B2, correctif (Codex, point 5) : rien de la carte du jour d'une autre classe.
      if (!memeClasse) viderCarteJour();
      // Lot « la semaine précédente » : une autre classe repart sur la
      // semaine en cours.
      if (!memeClasse) semaineClasse = 0;
      appliAffichee = voulue;
      eleves = elevesLus(voulue, donnees.eleves);
      tableaux = {[voulue]: eleves};
      lectureClasse = null;
      $("titre-classe").textContent = classe.libelle;
      $("titre-classe-colle").textContent = classe.libelle;
      retenirDerniereClasse(classe.id);
      messager("message-classes", "", "");
      messager("message-classe", "", "");
      messager("message-appli", "", "");
      messager("message-nom", "", "");
      messager("message-supprimer", "", "");
      montrer("ecran-classe");
      appliquerDroits();
      // La liste des classes était en retard (activités changées ailleurs) :
      // une AUTRE classe s'ouvre sur une activité qu'elle a vraiment. La même
      // classe garde son onglet (grisé s'il le faut, lot 5b).
      const presentes = applisAMontrer();
      if (!memeClasse && presentes.length && !presentes.includes(voulue)) { poserAppli(); await afficherAppli(presentes[0]); return true; }
      poserAppli();
      dessinerTableau();
      return true;
    } catch (erreur) {
      if (numero !== demandeAppli || !jeton) return false;
      // Arrêtée par sa garde (relireBornee) : rien à dire ici.
      if (erreur && erreur.name === "AbortError") return false;
      if (options && options.remonter) throw erreur;
      surErreur(erreur, zoneClasses());
      return false;
    }
  }

  // Une attente qui s'arrête avec le signal (le chargement d'un moteur n'a
  // pas de signal à lui) ; sans signal, la promesse telle quelle.
  function avecSignal(promesse, signal) {
    if (!signal) return promesse;
    return new Promise((resolve, reject) => {
      const abandon = () => reject(Object.assign(new Error("aborted"), {name: "AbortError"}));
      if (signal.aborted) { abandon(); return; }
      signal.addEventListener("abort", abandon, {once: true});
      promesse.then(resolve, reject);
    });
  }

  // Un menu ouvert reste dans l'écran (correctif des lots 5, point 6) : au
  // téléphone, la barre collée commence par « 405 ▾ » — le menu des applis,
  // accroché à son sélecteur, finissait au-delà du bord droit et la page
  // défilait de côté. Il recule (marge négative) jusqu'à 16 px du bord, sans
  // jamais passer à gauche des 16 px de l'autre bord.
  function garderDansLEcran(menu) {
    menu.style.marginLeft = "";
    const r = menu.getBoundingClientRect();
    const trop = r.right - (document.documentElement.clientWidth - 16);
    if (trop > 0) menu.style.marginLeft = -Math.round(Math.min(trop, Math.max(0, r.left - 16))) + "px";
  }

  // --------------------------------------- le menu des classes (serveur pro, lot 5a)
  //
  // Choix de Gwenaël (planche 1, 25/10/2026) : le nom de la classe ouvre la
  // liste de ses classes — celles de classes.liste, déjà lue ; la classe
  // ouverte est cochée. Lot 5d (choix de Gwenaël, 25/10/2026) : plus d'écran
  // « Mes classes » ; « + Nouvelle classe » au bout du menu, et chaque ligne
  // dit ce que disait la tuile : la classe partagée par un collègue (et ce
  // qu'on peut y faire), la séance restée ouverte. Tout par textContent.

  function poserMenuClasses() {
    const liste = $("menu-classes-liste");
    liste.textContent = "";
    classes.forEach(uneClasse => {
      const li = document.createElement("li");
      const bouton = el("button");
      bouton.type = "button";
      const ouverte = Boolean(classe) && classe.id === uneClasse.id;
      // Correctif des lots 5 (point 11) : la classe ouverte se lit telle
      // qu'elle est maintenant — renommée, des élèves ajoutés ou supprimés —
      // et pas telle que classes.liste l'a rendue à la connexion.
      const libelle = ouverte ? classe.libelle : uneClasse.libelle;
      const nombre = ouverte ? eleves.length : uneClasse.eleves;
      const infos = el("span", "infos");
      const ligne = el("span", "ligne-1");
      ligne.appendChild(el("span", "", `${nombre} élève${nombre > 1 ? "s" : ""}`));
      const enCours = LIBELLES_DIRECT[uneClasse.direct];
      if (enCours) ligne.appendChild(el("em", "en-direct", enCours));
      infos.appendChild(ligne);
      if (uneClasse.droit !== "proprietaire") {
        infos.appendChild(el("span", "partage", `partagée par ${uneClasse.proprietaire || "un collègue"} · `
          + (uneClasse.droit === "ecriture" ? "modifiable" : "lecture seule")));
      }
      bouton.append(el("strong", "", libelle), infos);
      if (ouverte) bouton.setAttribute("aria-current", "true");
      bouton.addEventListener("click", () => {
        fermerMenuClasses();
        if (!ouverte) ouvrirClasse(uneClasse.id);
      });
      li.appendChild(bouton);
      liste.appendChild(li);
    });
  }

  // Le bouton qui a ouvert le menu : le grand titre, ou « 405 ▾ » de la barre
  // collée (téléphone) — le menu s'ouvre alors sous la barre, en position fixe.
  let menuOuvertPar = null;

  function ouvrirMenuClasses(bouton) {
    if (!classe) return;
    const depuis = bouton || $("bouton-classes");
    poserMenuClasses();
    const menu = $("menu-classes");
    menu.hidden = false;
    menuOuvertPar = depuis;
    depuis.setAttribute("aria-expanded", "true");
    if (depuis !== $("bouton-classes")) {
      const r = depuis.getBoundingClientRect();
      menu.classList.add("depuis-barre");
      menu.style.top = Math.round(r.bottom + 6) + "px";
      menu.style.left = Math.round(Math.max(16, r.left)) + "px";
    }
    garderDansLEcran(menu);
    const choisie = menu.querySelector('[aria-current="true"]') || $("nouvelle-classe");
    choisie.focus();
  }

  function fermerMenuClasses(rendreLaMain) {
    const menu = $("menu-classes");
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    menu.classList.remove("depuis-barre");
    menu.style.top = "";
    menu.style.left = "";
    menu.style.marginLeft = "";
    const depuis = menuOuvertPar || $("bouton-classes");
    menuOuvertPar = null;
    depuis.setAttribute("aria-expanded", "false");
    if (rendreLaMain) depuis.focus();
  }

  // --------------------------------------- la barre collée (serveur pro, lot 5a)
  //
  // Choix de Gwenaël (25/10/2026, au téléphone puis à l'ordinateur aussi) :
  // la ligne d'onglets reste collée en haut quand on descend (CSS : position
  // sticky). Collée, elle montre « 405 ▾ » en petit au début : changer de
  // classe ou d'appli d'un geste, où qu'on soit dans la page.
  function barreCollee() {
    return Boolean(classe) && !$("ecran-classe").hidden
      && $("repere-onglets").getBoundingClientRect().top < 0;
  }

  function marquerBarreCollee() {
    const collee = barreCollee();
    const barre = $("onglets");
    if (barre.classList.contains("collee") === collee) return;
    barre.classList.toggle("collee", collee);
    $("bouton-classes-colle").hidden = !collee;
    // Le menu ouvert depuis la barre ne reste pas suspendu quand elle se décolle.
    if (!collee && menuOuvertPar === $("bouton-classes-colle")) fermerMenuClasses();
    // La place a changé (« 405 ▾ » est apparu ou parti) : onglets ou sélecteur ?
    montrerOngletChoisi();
  }

  // Changer d'appli depuis la barre collée : on arrive au DÉBUT de l'appli,
  // juste sous la barre — pas au milieu de son tableau. La barre reste collée
  // (les 6 px passent sa marge du haut) : « 405 ▾ » ne disparaît pas.
  function remonterALaBarre() {
    if (!barreCollee()) return;
    window.scrollTo(0, Math.max(0, $("repere-onglets").getBoundingClientRect().top + window.scrollY + 6));
  }

  // ---------------------------------------- la dernière classe (serveur pro, lot 5a)
  //
  // À la connexion, la dernière classe ouverte s'ouvre directement (choix de
  // Gwenaël, 25/10/2026). Seul son NUMÉRO est gardé, sur l'appareil
  // (localStorage) : un numéro de classe n'est pas un secret (il est déjà dans
  // l'ancre « #classe= » de la séance en direct) et le serveur revérifie le
  // droit à chaque appel. Une classe qui n'est plus dans la liste du
  // professeur connecté (supprimée, partage retiré, autre professeur sur ce
  // poste) n'ouvre rien : allerDansUneClasse passe à une autre (lot 5d).
  const CLE_DERNIERE_CLASSE = "mathsgo-suivi-prof-derniere-classe";

  function lireDerniereClasse() {
    try { return Number(localStorage.getItem(CLE_DERNIERE_CLASSE)) || 0; } catch (_) { return 0; }
  }

  function retenirDerniereClasse(id) {
    try { localStorage.setItem(CLE_DERNIERE_CLASSE, String(id)); } catch (_) {}
  }

  function oublierDerniereClasse() {
    try { localStorage.removeItem(CLE_DERNIERE_CLASSE); } catch (_) {}
  }

  // ------------------------------------------- l'activité affichée (lot « splat-suivi-4 »)

  function lesApplisConnues(liste) {
    return APPLIS.filter(appli => (liste || []).includes(appli.cle)).map(appli => appli.cle);
  }

  // Les activités de la classe ouverte que la page sait montrer.
  function applisDeLaClasse() {
    return lesApplisConnues(classe && classe.applis);
  }

  // Les applis ouvertes (lot « Qui voit quoi », lot 4b, 24/10/2026) :
  // celles de la classe, PLUS celles qu'un élève a en plus (eleve.acces,
  // calculé par le serveur — le même pour toutes les listes lues). Depuis
  // le lot 5b, chaque appli a son onglet : celles-ci sont en clair, les
  // autres grisées (poserOnglets).
  function applisAMontrer(liste = eleves) {
    const enPlus = [];
    (liste || []).forEach(eleve => {
      const acces = eleve && eleve.acces;
      if (acces && Array.isArray(acces.applis)) acces.applis.forEach(cle => { if (!enPlus.includes(cle)) enPlus.push(cle); });
    });
    return lesApplisConnues(applisDeLaClasse().concat(enPlus));
  }

  // L'activité à montrer : celle qu'on voulait si la classe l'a, sinon la
  // première de la classe.
  function appliAMontrer(liste, voulue) {
    if (voulue && liste.includes(voulue)) return voulue;
    return liste[0] || "defi-tables";
  }

  function lireChoixAppli() {
    try { return sessionStorage.getItem(CLE_APPLI) || ""; } catch (_) { return ""; }
  }

  function retenirChoixAppli(cle) {
    try { sessionStorage.setItem(CLE_APPLI, cle); } catch (_) {}
  }

  // Le moteur de SPLAT!, chargé une fois, à la première ouverture de
  // l'onglet. Introuvable : null, et l'onglet le dit (dessinerTableauSplat).
  function chargerMoteurSplat() {
    if (!SPLAT && window.MathsGoSplatParcours) SPLAT = window.MathsGoSplatParcours;
    if (SPLAT) return Promise.resolve(SPLAT);
    if (!chargementSplat) {
      chargementSplat = new Promise(resolve => {
        const script = document.createElement("script");
        script.src = MOTEUR_SPLAT;
        script.addEventListener("load", () => { SPLAT = window.MathsGoSplatParcours || null; resolve(SPLAT); });
        script.addEventListener("error", () => { chargementSplat = null; resolve(null); });
        document.head.appendChild(script);
      });
    }
    return chargementSplat;
  }

  // Le moteur de Coffres magiques, de même : chargé une fois, à la première
  // ouverture de son onglet. Introuvable : null, et l'onglet le dit.
  function chargerMoteurCoffres() {
    if (!COFFRES && window.MathsGoCoffresParcours) COFFRES = window.MathsGoCoffresParcours;
    if (COFFRES) return Promise.resolve(COFFRES);
    if (!chargementCoffres) {
      chargementCoffres = new Promise(resolve => {
        const script = document.createElement("script");
        script.src = MOTEUR_COFFRES;
        script.addEventListener("load", () => { COFFRES = window.MathsGoCoffresParcours || null; resolve(COFFRES); });
        script.addEventListener("error", () => { chargementCoffres = null; resolve(null); });
        document.head.appendChild(script);
      });
    }
    return chargementCoffres;
  }

  // Le moteur d'Anzan, de même (lot 4b) : chargé une fois, à la première
  // ouverture de son onglet. Introuvable : null, et l'onglet le dit.
  function chargerMoteurAnzan() {
    if (!ANZAN && window.MathsGoFlashAnzanParcours) ANZAN = window.MathsGoFlashAnzanParcours;
    if (ANZAN) return Promise.resolve(ANZAN);
    if (!chargementAnzan) {
      chargementAnzan = new Promise(resolve => {
        const script = document.createElement("script");
        script.src = MOTEUR_ANZAN;
        script.addEventListener("load", () => { ANZAN = window.MathsGoFlashAnzanParcours || null; resolve(ANZAN); });
        script.addEventListener("error", () => { chargementAnzan = null; resolve(null); });
        document.head.appendChild(script);
      });
    }
    return chargementAnzan;
  }

  // Défi calcul (lot 2b) : ses deux moteurs, le noyau puis la progression,
  // à la première ouverture de l'onglet. Rend le moteur de progression, ou
  // null si l'un des deux manque.
  function chargerMoteurCalcul() {
    if (!CALCUL_CORE && window.MATHSGO_DEFI_CALCUL_CORE) CALCUL_CORE = window.MATHSGO_DEFI_CALCUL_CORE;
    if (!CALCUL && window.MATHSGO_DEFI_CALCUL_MON_PARCOURS) CALCUL = window.MATHSGO_DEFI_CALCUL_MON_PARCOURS;
    if (CALCUL && CALCUL_CORE) return Promise.resolve(CALCUL);
    if (!chargementCalcul) {
      const charger = (adresse, global) => new Promise(resolve => {
        if (window[global]) { resolve(window[global]); return; }
        const script = document.createElement("script");
        script.src = adresse;
        script.addEventListener("load", () => resolve(window[global] || null));
        script.addEventListener("error", () => resolve(null));
        document.head.appendChild(script);
      });
      chargementCalcul = charger(MOTEUR_CALCUL_CORE, "MATHSGO_DEFI_CALCUL_CORE")
        .then(core => { CALCUL_CORE = core; return core ? charger(MOTEUR_CALCUL, "MATHSGO_DEFI_CALCUL_MON_PARCOURS") : null; })
        .then(moteur => { CALCUL = moteur; if (!CALCUL || !CALCUL_CORE) chargementCalcul = null; return CALCUL && CALCUL_CORE ? CALCUL : null; });
    }
    return chargementCalcul;
  }

  // Le moteur qu'il faut à une activité (Défi tables : déjà dans la page).
  function chargerMoteurDe(cle) {
    if (cle === "splat") return chargerMoteurSplat();
    if (cle === "coffres") return chargerMoteurCoffres();
    if (cle === "flash-anzan") return chargerMoteurAnzan();
    if (cle === "defi-calcul") return chargerMoteurCalcul();
    return Promise.resolve(null);
  }

  // Ce qui change avec l'activité affichée : les onglets (un par activité de
  // la classe, TOUJOURS là depuis le lot « Ma classe : réglages » ; celui
  // qu'on regarde est souligné, aucun dans les Réglages), l'en-tête du
  // tableau, les tris, et ce qui est propre à Défi tables (« Les calculs qui
  // coincent », « À imprimer »).
  function poserAppli() {
    poserVue();
    poserOnglets();
    const splat = appliAffichee === "splat";
    const coffres = appliAffichee === "coffres";
    const anzan = appliAffichee === "flash-anzan";
    const calcul = appliAffichee === "defi-calcul";
    $("entete-defi-tables").hidden = splat || coffres || anzan || calcul;
    $("entete-splat").hidden = !splat;
    $("entete-coffres").hidden = !coffres || periodeCoffres === "semaine";
    $("entete-coffres-semaine").hidden = !coffres || periodeCoffres !== "semaine";
    $("periode-coffres").hidden = !coffres;
    $("entete-anzan").hidden = !anzan;
    $("entete-defi-calcul").hidden = !calcul;
    $("note-coffres").hidden = !coffres;
    $("bloc-imprimer").hidden = splat || coffres || anzan || calcul;
    if (splat || coffres || anzan || calcul) $("fragiles").hidden = true;
    if (coffres || anzan) $("objectif").hidden = true;
    if (!splat) $("splat-mondes").hidden = true;
    // Défi calcul (lot 2b) : sa carte « À reprendre en classe » et son bouton
    // « Imprimer la grille » n'existent que dans son onglet.
    if (!calcul) {
      ["dc-reprendre", "dc-imprimer-grille", "dc-ouest", "dc-qui", "dc-aider"].forEach(id => { $(id).hidden = true; });
    }
    poserTris();
    // Serveur pro, lot 5b : la ligne « qui voit » (ou la carte d'un onglet
    // grisé) en haut de l'onglet.
    poserQuiVoit();
    // Lot « cours-appli » : l'onglet Cours (sa vue et son panneau).
    poserCours();
    // Lot « Les records » : la carte, Défi tables seulement (relue à chaque
    // ouverture de la classe). Pas dans les Réglages : elle n'y est pas.
    chargerRecords();
    // Lot E1 : la carte « Évaluations », Défi tables seulement, en écriture.
    // Dans les Réglages, ni lecture ni veille (evalVisible).
    poserEvaluations();
  }

  // Serveur pro, lot 5b (choix de Gwenaël, planche 3 de l'étape 4) : chaque
  // appli a TOUJOURS son onglet. Ouverte à la classe, ou à quelques élèves
  // seulement : son nom (lot 8, 31/10/2026 : plus de pastille « Anzan 1 »,
  // la ligne de l'onglet dit qui la voit ; le lecteur d'écran l'entend
  // toujours). Ouverte à personne : grisée — dedans, de quoi l'ouvrir. Celui
  // qu'on regarde est souligné, aucun hors de la vue de l'activité. Rend la
  // liste des applis ouvertes (à la classe ou à quelqu'un).
  function poserOnglets() {
    const presentes = applisAMontrer();
    document.querySelectorAll("#choix-appli button[data-appli]").forEach(bouton => {
      const cle = bouton.dataset.appli;
      bouton.hidden = false;
      bouton.textContent = nomDeLAppli(cle);
      const quelques = parLaClasse(cle) ? 0 : (eleves || []).filter(eleve => accesDe(eleve).applis.includes(cle)).length;
      bouton.classList.toggle("eteint", !presentes.includes(cle));
      bouton.removeAttribute("title");
      if (quelques) {
        bouton.setAttribute("aria-label", `${nomDeLAppli(cle)}, ouvert à ${quelques} élève${quelques > 1 ? "s" : ""}`);
      } else if (!presentes.includes(cle)) {
        bouton.setAttribute("aria-label", `${nomDeLAppli(cle)}, fermé à la classe`);
      } else {
        bouton.removeAttribute("aria-label");
      }
      bouton.setAttribute("aria-pressed", String(vue === "appli" && cle === appliAffichee));
    });
    montrerOngletChoisi();
    return presentes;
  }

  // Serveur pro, lot 5a : au téléphone, la rangée des applis défile. L'onglet
  // choisi y est toujours ramené en vue (sans faire bouger la page), et la
  // rangée s'efface vers la droite tant qu'il reste des onglets à droite.
  function marquerSuiteOnglets() {
    const rangee = $("choix-appli");
    rangee.classList.toggle("suite", rangee.scrollLeft + rangee.clientWidth < rangee.scrollWidth - 2);
  }

  // Onglets ou sélecteur (choix de Gwenaël, 25/10/2026) : les onglets tant
  // qu'ils tiennent sur la ligne ; sinon « Défi tables ▾ ». La page mesure
  // elle-même : rien à régler quand une appli s'ajoute.
  function poserModeApplis() {
    const barre = $("onglets");
    const rangee = $("choix-appli");
    barre.classList.remove("mode-selecteur");
    const deborde = rangee.scrollWidth > rangee.clientWidth + 1;
    barre.classList.toggle("mode-selecteur", deborde);
    $("choix-appli-menu").hidden = !deborde;
    if (deborde) {
      const appli = APPLIS.find(une => une.cle === appliAffichee) || APPLIS[0];
      $("nom-appli").textContent = appli.nom;
      $("bouton-applis").classList.toggle("actif", vue === "appli");
    } else {
      fermerMenuApplis();
    }
    return deborde;
  }

  // La liste du sélecteur : les onglets qui seraient visibles, dans leur
  // ordre ; choisir une appli, c'est toucher son onglet (même chemin, mêmes
  // vérifications). L'appli regardée est cochée.
  function ouvrirMenuApplis() {
    if (!classe) return;
    const liste = $("menu-applis-liste");
    liste.textContent = "";
    document.querySelectorAll("#choix-appli button[data-appli]").forEach(onglet => {
      if (onglet.hidden) return;
      const li = document.createElement("li");
      // Lot 5b : le nom et le gris, comme l'onglet (lot 8 : plus de pastille).
      const bouton = el("button", onglet.classList.contains("eteint") ? "eteint" : "", nomDeLAppli(onglet.dataset.appli));
      if (onglet.hasAttribute("aria-label")) bouton.setAttribute("aria-label", onglet.getAttribute("aria-label"));
      bouton.type = "button";
      if (vue === "appli" && onglet.dataset.appli === appliAffichee) bouton.setAttribute("aria-current", "true");
      bouton.addEventListener("click", () => { fermerMenuApplis(); onglet.click(); });
      li.appendChild(bouton);
      liste.appendChild(li);
    });
    $("menu-applis").hidden = false;
    garderDansLEcran($("menu-applis"));
    $("bouton-applis").setAttribute("aria-expanded", "true");
    const choisie = liste.querySelector('[aria-current="true"]') || liste.querySelector("button");
    if (choisie) choisie.focus();
  }

  function fermerMenuApplis(rendreLaMain) {
    const menu = $("menu-applis");
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    menu.style.marginLeft = "";
    $("bouton-applis").setAttribute("aria-expanded", "false");
    if (rendreLaMain) $("bouton-applis").focus();
  }

  function montrerOngletChoisi() {
    if (poserModeApplis()) return;
    const rangee = $("choix-appli");
    const actif = rangee.querySelector('button[aria-pressed="true"]:not([hidden])');
    if (actif && rangee.scrollWidth > rangee.clientWidth) {
      const r = rangee.getBoundingClientRect();
      const a = actif.getBoundingClientRect();
      if (a.right > r.right - 24) rangee.scrollLeft += a.right - r.right + 40;
      else if (a.left < r.left) rangee.scrollLeft -= r.left - a.left + 8;
    }
    marquerSuiteOnglets();
  }

  // La vue sous les onglets : l'activité, les Élèves (lot « Ma classe :
  // élèves ») ou les Réglages (lot « Ma classe : réglages »). Un collègue n'a
  // pas l'onglet Réglages, un collègue « voir seulement » pas l'onglet
  // Élèves : pour eux, l'activité.
  function poserVue() {
    if (vue === "reglages" && droitClasse !== "proprietaire") vue = "appli";
    if (vue === "eleves" && droitClasse === "lecture") vue = "appli";
    if (vue !== "eleves" && vue !== "reglages" && vue !== "classe") vue = "appli";
    $("vue-appli").hidden = vue !== "appli";
    $("vue-classe").hidden = vue !== "classe";
    $("onglet-classe").setAttribute("aria-pressed", String(vue === "classe"));
    $("vue-eleves").hidden = vue !== "eleves";
    $("vue-reglages").hidden = vue !== "reglages";
    // Lot B2 : la carte suit la classe relue (un autre onglet, une appli
    // fermée) ; le brouillon reste tant que la liste rangée n'a pas changé.
    if (vue === "reglages" && classe) poserJourClasse(false);
    $("onglet-eleves").setAttribute("aria-pressed", String(vue === "eleves"));
    $("onglet-reglages").setAttribute("aria-pressed", String(vue === "reglages"));
    garderPopEleves();
  }

  function ouvrirEleves() {
    if (!classe || droitClasse === "lecture") return;
    vue = "eleves";
    poserAppli();
  }

  function ouvrirReglages() {
    if (!classe || droitClasse !== "proprietaire") return;
    vue = "reglages";
    $("nom-classe").value = classe.libelle;
    messager("message-nom", "", "");
    messager("message-supprimer", "", "");
    // Correctif (Codex, point 6) : rouvrir les Réglages de la même classe
    // garde le brouillon tant que la liste rangée n'a pas changé.
    poserJourClasse(false);
    poserAppli();
  }

  // Serveur pro, lot 5c : plus de menu « Trier par ». Une colonne que l'appli
  // ne connaît pas repart au prénom ; le titre de la colonne triée porte
  // aria-sort, que la flèche ▲ ▼ dessine (de A à Z = croissant).
  function poserTris() {
    const colonnes = TRIS[appliAffichee] || TRIS["defi-tables"];
    if (!colonnes.includes(tri.colonne)) tri = {colonne: "prenom", sens: 1};
    document.querySelectorAll("#tableau thead th").forEach(th => {
      const bouton = th.querySelector("button[data-tri]");
      if (bouton && bouton.dataset.tri === tri.colonne) th.setAttribute("aria-sort", tri.sens === 1 ? "ascending" : "descending");
      else th.removeAttribute("aria-sort");
    });
  }

  // Passer d'une activité à l'autre. La liste d'une activité déjà lue pour
  // cette classe est reprise telle quelle ; sinon un appel « tableau ». Deux
  // clics rapprochés : c'est le dernier qui gagne. Ne touche pas à la vue :
  // après un changement d'activités dans les Réglages, on y reste ; c'est le
  // clic sur un onglet d'activité qui en sort.
  async function afficherAppli(cle) {
    // Lot 5b : chaque appli a son onglet, même fermée (grisée).
    if (!classe || !APPLIS.some(appli => appli.cle === cle)) return;
    const numero = ++demandeAppli;
    try {
      await chargerMoteurDe(cle);
      const fraiche = !tableaux[cle];
      // Relecture Codex du lot 2b de Défi calcul : une liste lue SANS son
      // moteur (le script avait échoué) garde des résumés vides ; si le
      // moteur est là maintenant, on la relit — sans rappeler le serveur.
      if (tableaux[cle] && tableaux[cle].some(eleve => eleve.parcours && eleve.lu && eleve.lu.lisible === false)) {
        tableaux[cle] = elevesLus(cle, tableaux[cle]);
      }
      const classeId = classe.id;
      const donnees = tableaux[cle] ? null : await api("tableau", {classe_id: classeId, appli: cle});
      const liste = tableaux[cle] || elevesLus(cle, donnees.eleves);
      if (numero !== demandeAppli || !jeton) return;
      // Correctif B3 (Codex, point 6) : un tableau frais dit la classe ET ses
      // élèves du même instant — les deux sont repris ensemble, et seulement
      // si c'est encore la classe ouverte.
      if (!classe || classe.id !== classeId) return;
      if (donnees && donnees.classe && donnees.classe.id === classeId) reprendreLaClasse(donnees.classe);
      // Lot 4b-bis (relecture Codex) : une liste fraîche dit ce que voit
      // chaque élève MAINTENANT (un autre onglet du navigateur a pu retirer
      // Anzan à Rania) — on le reporte sur les listes déjà lues.
      if (fraiche) reporterAccesDeLaListe(liste);
      // Lot 5b : une appli que plus personne n'a s'affiche quand même — son
      // onglet est grisé, et dedans la carte « … est fermé à la 405 ».
      tableaux[cle] = liste;
      appliAffichee = cle;
      eleves = liste;
      retenirChoixAppli(cle);
      messager("message-appli", "", "");
      poserAppli();
      redessin.demander();
    } catch (erreur) {
      if (numero === demandeAppli) surErreur(erreur, "message-appli");
    }
  }

  // Correctif B3 (relecture Codex, point 6) : la classe d'un tableau frais
  // (changement d'onglet) remplace ce que la page en savait — ses activités,
  // ses réglages, sa liste du jour et ses portes —, comme ouvrirClasse ; le
  // droit et la séance en direct restent ceux de l'ouverture.
  function reprendreLaClasse(fraiche) {
    ["libelle", "applis", "reglages", "jour", "portes", "portes_classe"].forEach(nom => {
      if (fraiche[nom] !== undefined) classe[nom] = fraiche[nom];
    });
    delete classe.effectifsPerimes;
  }

  // Lot 4b-bis : ce que voit chaque élève (acces, ajouts), lu dans une liste
  // fraîche, vaut pour toutes les listes déjà lues (SPLAT! recompte ses
  // mondes).
  function reporterAccesDeLaListe(liste) {
    (liste || []).forEach(frais => {
      Object.keys(tableaux).forEach(cle => {
        (tableaux[cle] || []).forEach(autre => {
          if (autre.id !== frais.id || autre === frais) return;
          autre.ajouts = frais.ajouts;
          autre.acces = frais.acces;
          autre.reglages = frais.reglages;
          if (cle === "splat") autre.lu = lireSplat(autre.parcours, autre);
        });
      });
    });
  }

  // Un élève est le même dans toutes les activités : un prénom, un code
  // changés — ou un élève supprimé — valent pour les listes déjà lues.
  function reporterEleve(eleve, supprime) {
    Object.keys(tableaux).forEach(cle => {
      if (supprime) { tableaux[cle] = tableaux[cle].filter(autre => autre.id !== eleve.id); return; }
      tableaux[cle].forEach(autre => {
        if (autre.id !== eleve.id || autre === eleve) return;
        autre.prenom = eleve.prenom;
        autre.initiale = eleve.initiale;
        autre.code = eleve.code;
      });
    });
    if (supprime) tableaux[appliAffichee] = eleves;
  }

  // ------------------------------------------------ Suivre ses élèves, lot S2 : la classe et la fiche
  //
  // Choix de Gwenaël du 07/11/2026 (planches 1 à 3 du chantier « Suivre ses
  // élèves ») : un premier onglet « La classe » — en haut « À aider » et « À
  // féliciter », puis une ligne par élève, toutes applis ensemble (ses 7
  // jours de la semaine, ses 4 dernières semaines en chiffres) — et une FICHE
  // d'élève, la même depuis n'importe quel onglet : « Vue d'ensemble », puis
  // un onglet par appli pour le détail.
  // RIEN DE NOUVEAU N'EST DEMANDÉ AU SERVEUR : la page relit les listes
  // « tableau » qu'elle sait déjà lire, appli par appli, et chaque moteur rend
  // le même résumé (resumeSuivi, lot S1) — des nombres et des dates, jamais
  // une phrase, jamais un temps passé (décision du 07/11 : « aider l'élève,
  // pas le fliquer »). C'est la page qui écrit, et tout ce qui vient d'un
  // élève (prénoms compris) est posé par textContent : jamais du HTML.

  // Les couleurs des applis (le point de couleur du calendrier, la barre de
  // « Où il en est ») : celles de l'univers maths&go — le filet teal, le bleu,
  // l'orange et le jaune du dégradé de la marque, et le violet des mondes
  // SPLAT! (déjà dans cette page) pour Anzan.
  const COULEURS_APPLIS = {"defi-tables": "#08aaa5", "defi-calcul": "#0b67b2", "splat": "#f58220", "coffres": "#f9bf3b", "flash-anzan": "#7b42b4"};
  // Les dessins des applis, ceux des tuiles de Mon espace (index.php du
  // serveur, ICONES), recopiés tels quels : des constantes de la page, jamais
  // une donnée reçue.
  const ICONES_APPLIS = {
    "defi-tables": '<svg viewBox="0 0 46 46" aria-hidden="true" focusable="false"><rect width="46" height="46" rx="12" fill="#eaf1fa"/><g transform="translate(9,9)"><rect x="0" y="0" width="13" height="13" rx="3" fill="#063f86"/><rect x="15" y="0" width="13" height="13" rx="3" fill="#063f86"/><rect x="0" y="15" width="13" height="13" rx="3" fill="#063f86"/><rect x="15" y="15" width="13" height="13" rx="3" fill="#08aaa5"/><g stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M4 4l5 5M9 4l-5 5"/></g></g></svg>',
    "defi-calcul": '<svg viewBox="0 0 46 46" aria-hidden="true" focusable="false"><rect width="46" height="46" rx="12" fill="#eaf1fa"/><g stroke="#0755b8" stroke-width="3.6" stroke-linecap="round"><path d="M15 9.5v9M10.5 14h9"/><path d="M26.5 14h9"/></g><g stroke="#d95f02" stroke-width="3.6" stroke-linecap="round"><path d="M11 27.5l8 8M19 27.5l-8 8"/><path d="M26.5 31.5h9"/></g><g fill="#d95f02"><circle cx="31" cy="26.5" r="2.2"/><circle cx="31" cy="36.5" r="2.2"/></g></svg>',
    "coffres": '<svg viewBox="0 0 46 46" aria-hidden="true" focusable="false"><rect width="46" height="46" rx="12" fill="#eaf1fa"/><path d="M9 20a14 9 0 0 1 28 0Z" fill="#a77b50" stroke="#62412d" stroke-width="1.8" stroke-linejoin="round"/><rect x="9" y="20" width="28" height="16" rx="2.5" fill="#a77b50" stroke="#62412d" stroke-width="1.8"/><rect x="9" y="18.5" width="28" height="4" fill="#f9bf3b" stroke="#a85b08" stroke-width="1.4"/><rect x="19.5" y="20.5" width="7" height="9" rx="1.6" fill="#f9bf3b" stroke="#a85b08" stroke-width="1.4"/><path d="M23 23.4v3.2" stroke="#62412d" stroke-width="1.8" stroke-linecap="round"/></svg>',
    "flash-anzan": '<svg viewBox="0 0 46 46" aria-hidden="true" focusable="false"><rect width="46" height="46" rx="12" fill="#eaf1fa"/><rect x="7.5" y="9.5" width="31" height="27" rx="3.5" fill="#fff" stroke="#10294a" stroke-width="2.4"/><g stroke="#9fb4c4" stroke-width="1.4"><path d="M15 11v24M23 11v24M31 11v24"/></g><rect x="12" y="11.6" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="12" y="31.8" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="12" y="28.4" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="20" y="31.8" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="20" y="28.4" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="28" y="11.6" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="12" y="20.4" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="12" y="23.8" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="20" y="14.6" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="20" y="20.4" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="20" y="23.8" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="28" y="20.4" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="28" y="23.8" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="28" y="27.2" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="28" y="30.6" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="7.5" y="18" width="31" height="2" fill="#10294a"/></svg>',
    "splat": '<svg viewBox="-2 -2 28 28" aria-hidden="true" focusable="false"><path d="M21.45 12c.529.493 1.283 1.157 1.472 1.73.189.573-.034 1.225-.337 1.709-.303.485-.991.847-1.481 1.2-.49.352-.965.666-1.459.916-.494.25-.993.462-1.506.584-.513.122-1.142.006-1.572.147-.43.141-.732.251-1.007.701-.274.451-.335 1.345-.64 2-.305.656-.703 1.578-1.19 1.935-.487.357-1.175.346-1.73.208-.555-.138-1.112-.681-1.598-1.038-.487-.357-.932-.712-1.322-1.105-.391-.392-.747-.801-1.022-1.251-.274-.45-.358-1.085-.625-1.45-.267-.365-.465-.619-.978-.741-.513-.122-1.382.097-2.1.01-.718-.088-1.718-.182-2.208-.535-.49-.352-.692-1.01-.732-1.581-.04-.57.304-1.267.493-1.841.189-.573.389-1.105.642-1.598.253-.493.531-.958.875-1.358.343-.4.921-.676 1.185-1.043.265-.367.445-.634.403-1.159-.043-.526-.52-1.285-.658-1.995-.139-.709-.358-1.689-.174-2.264.184-.575.747-.971 1.277-1.185.53-.215 1.3-.103 1.903-.1.604.003 1.172.028 1.719.117.547.088 1.075.209 1.562.412.487.203.927.667 1.358.805.431.138.74.227 1.227.024.486-.202 1.061-.89 1.693-1.241.632-.352 1.497-.863 2.1-.866.604-.003 1.155.411 1.522.849.368.438.499 1.204.683 1.779.184.575.335 1.123.42 1.67.085.548.133 1.088.091 1.613-.043.526-.348 1.088-.346 1.541.001.452.012.774.356 1.174.343.4 1.175.734 1.704 1.227Z" fill="#0b67b2" stroke="#052f67" stroke-width="1.05"/><text x="12.4" y="14.2" text-anchor="middle" fill="#fff" font-family="Times New Roman, Times, serif" font-size="10" font-weight="700" font-style="italic">x</text></svg>'
  };
  const JOURS_SEMAINE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  // « À aider », « À féliciter » : 6 lignes au plus (décision du 07/11).
  const LIGNES_CARTE = 6;
  // Absent : rien depuis 7 jours, toutes applis confondues (le seuil de Défi
  // tables, SEUILS.prof.absenceJours).
  const JOURS_ABSENT = 7;
  let triClasse = {colonne: "prenom", sens: 1};
  // Lot « la semaine précédente » (choix de Gwenaël du 14/11/2026) : la
  // colonne des 7 jours de La classe peut reculer de semaine en semaine
  // (‹ et ›). Combien de semaines en arrière : 0, la semaine en cours. Jamais
  // gardé — ni stockage, ni adresse : recharger la page, rouvrir l'onglet ou
  // une autre classe revient à la semaine en cours.
  let semaineClasse = 0;
  // Après un clic sur ‹ ou ›, le bouton à remettre sous le doigt (clavier) :
  // l'en-tête est redessiné.
  let focusSemaine = "";
  // La lecture des listes qui manquent à « La classe » : une par classe
  // ouverte (rien n'est relu en boucle si le serveur refuse) ; remise à
  // zéro quand la classe est relue.
  let lectureClasse = null;
  // La fiche : l'onglet regardé (« ensemble » ou la clé d'une appli), les
  // jours montrés dans « Ce qu'il a fait », les séances de Défi calcul.
  let ongletFiche = "ensemble";
  let joursFiche = 6;
  let seancesFiche = 6;
  // Lot S4b : le jour touché dans son calendrier (mis en avant dans
  // « Activité »), oublié avec l'élève ou l'onglet.
  let jourChoisiFiche = null;

  // Les zones de La classe et des cartes de Défi calcul qui portent des
  // prénoms : vidées dès qu'elles ne sont plus redessinées (correctif après
  // Codex, point 1).
  const ZONES_LA_CLASSE = ["lc-aider-liste", "lc-aider-plus", "lc-feliciter-liste", "lc-feliciter-plus", "lc-entete", "lc-corps"];
  const ZONES_CALCUL_CLASSE = ["dc-ouest-paliers", "dc-grille", "dc-grille-legende", "dc-qui-barres", "dc-qui-texte", "dc-qui-peu",
    "dc-aider-liste", "dc-aider-pied", "dc-reprendre-corps"];
  function viderZonesIds(ids) {
    ids.forEach(id => { const zone = $(id); if (zone) zone.textContent = ""; });
  }
  function viderZonesClasse() {
    viderZonesIds(ZONES_LA_CLASSE);
    ["lc-aider-plus", "lc-feliciter-plus"].forEach(id => { const zone = $(id); if (zone) zone.hidden = true; });
  }
  function viderZonesCalcul() {
    viderZonesIds(ZONES_CALCUL_CLASSE);
    ["dc-ouest", "dc-qui", "dc-aider"].forEach(id => { const zone = $(id); if (zone) zone.hidden = true; });
  }

  // ----- les jours (des dates « 2026-11-12 », à l'heure de La Réunion)

  function jourPlus(jour, nombre) {
    const d = new Date(`${jour}T12:00:00Z`);
    if (isNaN(d)) return jour;
    d.setUTCDate(d.getUTCDate() + nombre);
    return d.toISOString().slice(0, 10);
  }

  function lundiDuJour(jour) {
    const d = new Date(`${jour}T12:00:00Z`);
    return isNaN(d) ? jour : jourPlus(jour, -((d.getUTCDay() + 6) % 7));
  }

  function joursEntre(avant, apres) {
    return Math.round((Date.parse(`${apres}T12:00:00Z`) - Date.parse(`${avant}T12:00:00Z`)) / 864e5);
  }

  function aujourdhuiSuivi() {
    return new Date().toLocaleDateString("en-CA", {timeZone: "Indian/Reunion"});
  }

  // « mercredi 11 nov. » ; « jeu. 12/11 » ; « 12/11 ».
  function jourEnClair(jour) {
    const d = new Date(`${jour}T12:00:00Z`);
    if (isNaN(d)) return String(jour);
    const texte = d.toLocaleDateString("fr-FR", {timeZone: "UTC", weekday: "long", day: "numeric", month: "short"});
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  function jourCourtChiffres(jourIso) {
    const d = new Date(`${jourIso}T12:00:00Z`);
    return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", {timeZone: "UTC", day: "2-digit", month: "2-digit"});
  }

  function pluriel(n, un, plusieurs) {
    return `${n} ${n > 1 ? (plusieurs || `${un}s`) : un}`;
  }

  // ----- ce que disent les moteurs

  function moteurSuivi(cle) {
    const moteur = {"defi-tables": PARCOURS, "defi-calcul": CALCUL, "splat": SPLAT, "coffres": COFFRES, "flash-anzan": ANZAN}[cle];
    return moteur && typeof moteur.resumeSuivi === "function" ? moteur : null;
  }

  // Le résumé d'un élève dans une appli, pour 4 semaines finissant à
  // `aujourdhui` — gardé avec l'élève lu (une liste relue est un autre objet).
  const memoSuivi = new WeakMap();
  function suiviApp(cle, eleve, aujourdhui) {
    const moteur = moteurSuivi(cle);
    if (!eleve || !moteur || !eleve.parcours) return null;
    let parEleve = memoSuivi.get(eleve);
    if (!parEleve) { parEleve = new Map(); memoSuivi.set(eleve, parEleve); }
    const cleMemo = `${cle}|${aujourdhui}`;
    if (!parEleve.has(cleMemo)) {
      let resume = null;
      try { resume = moteur.resumeSuivi(eleve.parcours, {aujourdhui}); } catch (_) { resume = null; }
      parEleve.set(cleMemo, resume && Array.isArray(resume.jours) ? resume : null);
    }
    return parEleve.get(cleMemo);
  }

  function eleveDe(cle, id) {
    return (tableaux[cle] || []).find(eleve => eleve.id === id) || null;
  }

  // Les applis du bilan (absent, jours de travail, la fiche) : toutes celles
  // du catalogue. Correctif après Codex (point 4) : une appli fermée depuis
  // garde le travail déjà fait (modèle commun) — il compte toujours « toutes
  // applis confondues ». Ce sont les mêmes listes « tableau » qu'avant.
  function applisDuBilan() {
    return APPLIS.filter(appli => !appli.sansSuivi).map(appli => appli.cle);
  }

  // Les colonnes de « La classe » : les applis de la classe, celles qu'un
  // élève a en plus (les onglets en clair, lot 5b), et celles où quelqu'un a
  // déjà du travail.
  function applisDeLaVue() {
    const ouvertes = applisAMontrer(elevesDeLaVue());
    return applisDuBilan().filter(cle => ouvertes.includes(cle) || (tableaux[cle] || []).some(aDuTravail));
  }

  // Les élèves de la classe : la même liste dans chaque lecture « tableau ».
  function elevesDeLaVue() {
    const lue = APPLIS.map(appli => tableaux[appli.cle]).find(liste => Array.isArray(liste));
    return lue || eleves || [];
  }

  function listesManquantes() {
    return applisDuBilan().filter(cle => !tableaux[cle]
      || (moteurSuivi(cle) === null && cle !== "defi-tables")
      || tableaux[cle].some(eleve => eleve.parcours && eleve.lu && eleve.lu.lisible === false));
  }

  // Une liste reçue, sans les élèves supprimés pendant l'attente : seulement
  // ceux de la classe telle que la page la connaît maintenant (un élève
  // supprimé quitte toutes les listes déjà lues, reporterEleve ; un élève
  // ajouté fait relire la classe, et `tableaux` avec elle).
  function sansSupprimes(liste) {
    const connus = new Set(elevesDeLaVue().map(eleve => eleve.id));
    return (liste || []).filter(eleve => connus.has(eleve.id));
  }

  // Lire ce qui manque (les moteurs, puis les listes), sans relire une liste
  // déjà là. Correctif après Codex (point 2) : une réponse ne s'écrit que
  // dans l'état pour lequel elle a été demandée — la même session
  // (generation), la même classe ET la même lecture de la classe
  // (ouvrirClasse refait `tableaux` : A → B → A, une relecture après un
  // ajout, une reconnexion rendent l'ancienne réponse périmée) ; un élève
  // supprimé pendant l'attente n'y revient pas. Chaque appli va au bout
  // (une panne n'arrête pas les autres) ; la première panne remonte ensuite.
  async function chargerApplis(cles) {
    const classeId = classe && classe.id;
    if (!classeId) return;
    const lesTableaux = tableaux;
    const session = generation;
    const aJour = () => tableaux === lesTableaux && generation === session && Boolean(jeton)
      && Boolean(classe) && classe.id === classeId;
    let panne = null;
    await Promise.all(cles.map(async cle => {
      try {
        await chargerMoteurDe(cle);
        if (!aJour()) return;
        if (tableaux[cle]) {
          if (tableaux[cle].some(eleve => eleve.parcours && eleve.lu && eleve.lu.lisible === false)) {
            tableaux[cle] = elevesLus(cle, tableaux[cle]);
            if (cle === appliAffichee) eleves = tableaux[cle];
          }
          return;
        }
        const donnees = await api("tableau", {classe_id: classeId, appli: cle});
        if (!aJour() || tableaux[cle]) return;
        tableaux[cle] = elevesLus(cle, sansSupprimes(donnees.eleves));
        reporterAccesDeLaListe(tableaux[cle]);
      } catch (erreur) {
        if (!panne) panne = erreur;
      }
    }));
    if (panne && aJour()) throw panne;
  }

  // La lecture des listes qui manquent, UNE par lecture de la classe (une
  // classe ouverte ou relue) : La classe et la fiche la partagent.
  // Correctif après Codex (points 3 et 5) : jamais relancée toute seule —
  // après une panne, ce qui manque le reste, et chaque dessin le dit à sa
  // place (marque.raison), sans écrire dans un message d'un autre écran ;
  // une session terminée passe par surErreur (la reconnexion). Recharger la
  // page, rouvrir la classe : une nouvelle lecture.
  function lectureAJour(marque) {
    return Boolean(marque) && lectureClasse === marque && Boolean(classe) && classe.id === marque.classeId
      && tableaux === marque.tableaux && generation === marque.session && Boolean(jeton);
  }

  // Lot « cours-appli-2 » (13/11/2026) : la fiche d'un élève montre aussi
  // les fiches de cours ouvertes (« Activité ») ; leur liste (« tableau » de
  // Cours, les jours d'ouverture) se lit avec les autres quand la classe a
  // l'appli Cours. Elle n'entre pas dans le bilan (jours de travail, absent,
  // La classe) : Cours reste sansSuivi.
  // Lot « cours-appli-3 » : aussi quand la classe ne l'a pas mais que des
  // élèves l'ont en plus (ce qu'ils voient est dans chaque tableau lu).
  function coursALire() {
    return Boolean(classe) && !tableaux.cours && (((classe && classe.applis) || []).includes("cours")
      || (eleves || []).some(eleve => Boolean(ajoutDe(eleve, "cours"))));
  }
  function listesALire() {
    return listesManquantes().concat(coursALire() ? ["cours"] : []);
  }

  function chargerLaClasse() {
    if (!classe) return;
    const marque = {classeId: classe.id, tableaux, session: generation, fini: false, raison: ""};
    lectureClasse = marque;
    messager("lc-message", "", "");
    chargerApplis(listesALire())
      .catch(erreur => {
        if (!lectureAJour(marque)) return;
        if (erreur && erreur.statut === 401) { surErreur(erreur, "lc-message"); return; }
        marque.raison = raisonDe(erreur);
      })
      .finally(() => {
        marque.fini = true;
        if (lectureAJour(marque)) redessin.demander();
      });
  }

  // La lecture de la classe ouverte : lancée si rien n'a été tenté pour elle.
  // null : rien ne manque.
  function lectureDeLaClasse() {
    if (!classe || !listesALire().length) return null;
    if (!lectureAJour(lectureClasse)) chargerLaClasse();
    return lectureClasse;
  }

  // « Coffres magiques n'a pas pu être lu : … » — ce qui manque encore à la
  // fin de la lecture (le serveur a refusé, un moteur n'a pas pu se charger).
  function textePanne(manquantes, marque) {
    const noms = manquantes.map(nomDeLAppli);
    const dit = noms.length > 1 ? `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]} n’ont pas pu être lus` : `${noms[0]} n’a pas pu être lu`;
    return `${dit}${marque && marque.raison ? ` (${marque.raison.replace(/\.$/, "")})` : ""}`;
  }

  // Le jour avant lequel les jours de travail d'un élève dans une appli ne
  // sont pas connus (null : rien n'est coupé). Correctif après Codex
  // (point 7) : resumeSuivi le dit pour les cinq applis (connuDepuis) — la
  // borne des 60 séances, des 500 d'Anzan, des 60 jours de SPLAT! et de
  // Coffres, des jours notés seulement depuis le lot S1. SPLAT! et Coffres disent aussi
  // le premier jour qu’ils ont noté quand c'est simplement le premier jour
  // joué : rien n'est coupé s'ils ne connaissent aucun travail d'avant —
  // sauf leur borne de 60 jours, qui coupe au moins 59 jours en arrière.
  //
  // Lot S2bis « les jours pas connus » (choix de Gwenaël, 08/11/2026) : les
  // jours que SPLAT! et Coffres ne notaient pas encore (avant le lot S1, le
  // 07/11) ne sont plus « pas connus » — ni « ? », ni « ≥ », ni « au moins »,
  // ni phrase : des cases vides et des chiffres simples, ce qu'on sait. Seule
  // leur borne des 60 jours reste une coupure : les 60 jours gardés sont
  // pleins et le plus ancien est APRÈS le premier jour noté (`depuis` du
  // parcours) — des jours notés ont été oubliés.
  function coupureDe(cle, eleve, aujourdhui) {
    const suivi = suiviApp(cle, eleve, aujourdhui);
    const depuis = suivi && suivi.connuDepuis;
    if (!depuis) return null;
    if (cle === "splat" || cle === "coffres") {
      const brut = eleve && eleve.parcours;
      const note = brut && typeof brut === "object" && typeof brut.depuis === "string" ? brut.depuis : "";
      if (!note || depuis <= note) return null;
    }
    return depuis;
  }

  // « 3 », « ≥ 3 » (au moins 3), « ? » : les jours d'une semaine, connue en
  // entier ou non.
  function compteSemaine(semaine) {
    if (!semaine.incomplete) return String(semaine.jours);
    return semaine.jours ? `≥ ${semaine.jours}` : "?";
  }

  function enJoursSemaine(s) {
    if (!s.incomplete) return pluriel(s.jours, "jour");
    return s.jours ? `au moins ${pluriel(s.jours, "jour")}` : "pas connu";
  }

  // Tout ce qu'on sait d'un élève, toutes applis : ses jours de travail, son
  // dernier jour, ses 4 semaines, s'il est absent, ce qui est à aider et à
  // féliciter. `aujourdhui` : la date de la page (heure de La Réunion).
  function bilanEleve(id, aujourdhui) {
    const lundi = lundiDuJour(aujourdhui);
    const debut = jourPlus(lundi, -21);
    const parApp = {};
    const jours = new Map();
    let dernier = null;
    let recu = false;
    let coupure = null;
    applisDuBilan().forEach(cle => {
      const eleve = eleveDe(cle, id);
      if (!eleve) return;
      if (eleve.maj_le) recu = true;
      const suivi = suiviApp(cle, eleve, aujourdhui);
      if (!suivi) return;
      parApp[cle] = {eleve, suivi};
      const depuis = coupureDe(cle, eleve, aujourdhui);
      if (depuis && (!coupure || depuis > coupure)) coupure = depuis;
      suivi.jours.forEach(j => {
        if (!jours.has(j.jour)) jours.set(j.jour, []);
        jours.get(j.jour).push(cle);
      });
      if (suivi.dernier && (!dernier || suivi.dernier > dernier)) dernier = suivi.dernier;
    });
    const semaines = [0, 1, 2, 3].map(k => {
      const debutSemaine = jourPlus(debut, 7 * k);
      let n = 0;
      for (let d = 0; d < 7; d += 1) if (jours.has(jourPlus(debutSemaine, d))) n += 1;
      // Correctif après Codex (point 7) : une semaine qui commence avant la
      // coupure n'est pas connue en entier — son nombre est « au moins ».
      return {lundi: debutSemaine, jours: n, incomplete: Boolean(coupure && coupure > debutSemaine)};
    });
    let absent = null;
    if (!recu) absent = {jamais: true};
    else if (!dernier) absent = {aucun: true};
    else if (joursEntre(dernier, aujourdhui) >= JOURS_ABSENT) absent = {jours: joursEntre(dernier, aujourdhui)};
    const bilan = {id, aujourdhui, lundi, debut, parApp, jours, dernier, semaines, absent, recu, coupure};
    bilan.aider = aiderDe(bilan);
    bilan.feliciter = feliciterDe(bilan);
    return bilan;
  }

  // « À aider » : absent (toutes applis), bloqué, à revoir, aidé — dans cet
  // ordre, chacun avec une phrase « que faire ». Tout est lu dans resumeSuivi
  // (les nombres) et resumeProf (le nom d'une compétence de Défi calcul).
  const RANGS_AIDER = {absent: 0, bloque: 1, revoir: 2, aide: 3};
  function aiderDe(bilan) {
    const liste = [];
    const ajouter = (genre, appli, texte, faire, lien) => liste.push({genre, appli, texte, faire, lien, rang: RANGS_AIDER[genre]});
    if (bilan.absent) {
      // Lot S4a (remarque de Gwenaël du 08/11/2026) : des mots sans genre —
      // la classe a des filles et des garçons (« ensemble », pas « avec lui »).
      if (bilan.absent.jamais) ajouter("absent", "", "Rien reçu, dans aucune appli", "Vérifier ensemble le code et la connexion.");
      else if (bilan.absent.aucun) ajouter("absent", "", "Rien de fini, dans aucune appli", "Faire une première séance ensemble.");
      else ajouter("absent", "", `Rien depuis ${bilan.absent.jours} jours, dans aucune appli`, "Lui demander ce qui l’empêche de travailler : son code, un appareil, le temps.");
    }
    Object.keys(bilan.parApp).forEach(cle => {
      const {eleve, suivi} = bilan.parApp[cle];
      (suivi.aider || []).forEach(a => {
        if (cle === "defi-tables" && a.type === "seances-longues") {
          ajouter("bloque", cle, `table de ${a.table} : ${a.seances} séances dessus`, "La reprendre ensemble : la bande, puis 5 calculs.");
        } else if (cle === "defi-calcul" && (a.type === "a-reprendre" || a.type === "rouges")) {
          const etat = a.type === "a-reprendre" ? "classe" : "revoir";
          const comps = ((eleve.lu && eleve.lu.revoir) || []).filter(c => c.etat === etat);
          const premiere = comps[0];
          // (Lot K2 : les mots des étoiles — « à voir en classe », « ratée
          // au retour ou perdue » — comme la grille de l'onglet Défi calcul.)
          const nom = premiere && CALCUL_CORE ? `« ${nomCompetenceCalcul(premiere.module, premiere.niveau)} »` : pluriel(a.competences, "étoile");
          const plus = comps.length > 1 ? ` et ${comps.length - 1} autre${comps.length > 2 ? "s" : ""}` : "";
          if (etat === "classe") {
            ajouter("bloque", cle, `${nom}${plus} à voir en classe`, "La reprendre en classe, ensemble.", premiere ? {module: premiere.module, niveau: premiere.niveau} : null);
          } else {
            ajouter("revoir", cle, `${nom}${plus} ratée${comps.length > 1 ? "s" : ""} au retour ou perdue${comps.length > 1 ? "s" : ""}`,
              "Ratée une fois, elle revient le lendemain ; perdue, elle se regagne par « Je tente » ou J’apprends.");
          }
        } else if (cle === "splat" && a.type === "reponses-vues") {
          ajouter("aide", cle, `${pluriel(a.vues, "réponse vue", "réponses vues")} cette semaine`, "Refaire l’étape ensemble, sans regarder la réponse.");
        } else if (cle === "coffres" && a.type === "solutions-vues") {
          ajouter("aide", cle, `${pluriel(a.solutions, "solution vue", "solutions vues")} cette semaine`, "Ouvrir un trésor ensemble, pas à pas.");
        }
      });
    });
    return liste.sort((p, q) => p.rang - q.rang);
  }

  // « À féliciter » : une table passée, un monde fini, un grade, beaucoup de
  // compétences sues — cette semaine.
  // Le lundi (choix de Gwenaël, question 2 du lot S2, 08/11/2026), la semaine qui
  // commence n'a encore rien gagné : on montre aussi ce qui a été gagné la
  // semaine d'avant — c'est le jour où l'on félicite en classe.
  function feliciterDe(bilan) {
    const liste = [];
    const lundi = bilan.aujourdhui === bilan.lundi;
    APPLIS.forEach(({cle}) => {
      const morceau = bilan.parApp[cle];
      if (!morceau) return;
      let f = (morceau.suivi.feliciter || []).slice();
      if (lundi) {
        const avant = suiviApp(cle, morceau.eleve, jourPlus(bilan.lundi, -1));
        (avant ? avant.feliciter || [] : []).forEach(x => {
          const meme = f.find(y => y.type === x.type && (x.type === "competences" || JSON.stringify(y) === JSON.stringify(x)));
          if (!meme) f.push(x);
          else if (x.type === "competences") f = f.map(y => (y === meme ? {type: "competences", competences: y.competences + x.competences} : y));
        });
      }
      if (cle === "defi-tables") {
        const tables = f.filter(x => x.type === "table").map(x => x.table).sort((a, b) => a - b);
        if (tables.length === 1) liste.push({appli: cle, texte: `table de ${tables[0]} passée`, rang: 0});
        else if (tables.length > 1) liste.push({appli: cle, texte: `tables de ${tables.slice(0, -1).join(", ")} et de ${tables[tables.length - 1]} passées`, rang: 0});
      } else if (cle === "splat") {
        f.filter(x => x.type === "monde").forEach(x => liste.push({appli: cle, texte: `monde ${x.monde} fini`, rang: 1}));
      } else if (cle === "flash-anzan") {
        f.filter(x => x.type === "grade").forEach(x => liste.push({appli: cle, texte: `${ANZAN && ANZAN.nomGrade ? ANZAN.nomGrade(x.grade) : `grade ${x.grade}`}${ANZAN && ANZAN.estGradeColonne && ANZAN.estGradeColonne(x.grade) ? " en Colonne" : ""} réussi`, rang: 2}));
      } else if (cle === "defi-calcul") {
        // Lot 6-0 (livré avec le lot F4) : la ceinture gagnée cette semaine.
        // (Lot K1b : six ceintures à gagner, dans l'ordre du noyau.)
        const NOMS_CEINTURES = ["ceinture blanche-jaune", "ceinture jaune", "ceinture jaune-orange", "ceinture orange", "ceinture verte", "ceinture bleue"];
        // (Lot K1b, choix de Gwenaël le 26/11 : la classe entre parenthèses,
        // « ceinture blanche-jaune (CP) gagnée » — sept couleurs à retenir sinon.)
        const CLASSES_CEINTURES = ["CP", "CE1", "CE2", "CM1", "CM2", "6e"];
        f.filter(x => x.type === "ceinture" && NOMS_CEINTURES[x.ceinture - 1]).forEach(x => liste.push({appli: cle, texte: `${NOMS_CEINTURES[x.ceinture - 1]} (${CLASSES_CEINTURES[x.ceinture - 1]}) gagnée`, rang: 2}));
        // (Lot K2 : en boîte 4 cette semaine — gagnées du premier coup, ou
        // montées par leurs retours.)
        f.filter(x => x.type === "competences").forEach(x => liste.push({appli: cle, texte: `${x.competences} étoiles gagnées ou confirmées cette semaine`, rang: 3, nombre: x.competences}));
      } else if (cle === "coffres") {
        // Lot S4a : Coffres n'avait aucune règle. Un trésor, c'est 10 clés
        // (une bonne séance) : 2 trésors ou plus dans la semaine, c'est
        // l'équivalent des 5 compétences sues de Défi calcul — un vrai pas,
        // pas le rythme ordinaire. Lu dans resumeSuivi (les trésors de chaque
        // jour), sans rien changer au moteur ni à ce que voit l'élève. Le
        // lundi, avec la semaine d'avant, comme les autres.
        const FELICITER_TRESORS = 2;
        const depuis = lundi ? jourPlus(bilan.lundi, -7) : bilan.lundi;
        const n = (morceau.suivi.jours || []).filter(j => j.jour >= depuis && j.jour <= bilan.aujourdhui)
          .reduce((somme, j) => somme + (j.lignes || []).reduce((t, l) => t + (Number.isInteger(l.tresors) && l.tresors > 0 ? l.tresors : 0), 0), 0);
        if (n >= FELICITER_TRESORS) liste.push({appli: cle, texte: `${n} trésors ouverts cette semaine`, rang: 4, nombre: n});
      }
    });
    return liste.sort((p, q) => p.rang - q.rang);
  }

  // ----- la vue « La classe »

  function ouvrirLaClasse() {
    if (!classe) return;
    vue = "classe";
    retenirChoixAppli("classe");
    semaineClasse = 0;
    messager("message-appli", "", "");
    poserAppli();
    redessin.demander();
  }

  // Le dessin (appelé par chaque redessin du tableau, quand la vue est là).
  function dessinerLaClasse() {
    if (!classe || vue !== "classe") return;
    const lecture = lectureDeLaClasse();
    const manquantes = listesManquantes();
    // Une lecture finie à laquelle il manque encore une appli (le serveur a
    // refusé, un moteur n'a pas pu être chargé) : on montre ce qu'on a, et on
    // le dit — jamais « Lecture… » pour toujours, jamais une relecture en
    // boucle.
    const enLecture = manquantes.length > 0 && !(lecture && lecture.fini);
    if (manquantes.length && !enLecture) messager("lc-message", `${textePanne(manquantes, lecture)} : ce qui suit ne le compte pas. Recharge la page pour réessayer.`, "erreur");
    else messager("lc-message", "", "");
    const aujourdhui = aujourdhuiSuivi();
    const liste = elevesDeLaVue();
    const bilans = new Map();
    if (!enLecture) liste.forEach(eleve => bilans.set(eleve.id, bilanEleve(eleve.id, aujourdhui)));
    const applis = applisDeLaVue();
    dessinerCartesClasse(liste, bilans, enLecture);
    dessinerTableauClasse(liste, bilans, applis, aujourdhui, enLecture, semaineDeLaVue(liste, bilans, aujourdhui, enLecture));
    const auTravail = [...bilans.values()].filter(b => b.semaines[3].jours > 0).length;
    $("resume-classe").textContent = enLecture ? `${pluriel(liste.length, "élève")}`
      : `${pluriel(liste.length, "élève")} · ${auTravail || aujourdhui !== lundiDuJour(aujourdhui) ? `${auTravail} au travail cette semaine` : "la semaine commence"}`;
  }

  function puceAppli(cle) {
    // Lot « cours-appli-2 » : Cours a un rond vide (pas un jour de travail).
    const puce = el("i", cle === "cours" ? "lc-puce cours" : "lc-puce");
    puce.style.background = COULEURS_APPLIS[cle] || "#5c6c82";
    puce.setAttribute("aria-hidden", "true");
    return puce;
  }

  // « À aider » et « À féliciter » : une ligne par élève (la raison la plus
  // forte), 6 au plus, les absents d'abord ; les autres en une phrase.
  // Toucher une ligne ouvre la fiche de l'élève.
  function dessinerCartesClasse(liste, bilans, enLecture) {
    const ordre = ordreDeLaFeuille(liste);
    const aider = [];
    const feliciter = [];
    ordre.forEach(eleve => {
      const b = bilans.get(eleve.id);
      if (!b) return;
      // Choix de Gwenaël (question 1 du lot S2, 08/11/2026) : une compétence
      // rouge de Défi calcul (ratée hier ou aujourd'hui, l'appli la redonne
      // le lendemain avec l'aide) n'est pas « à aider » dans la classe ; elle
      // reste dans « À voir » de la fiche. Une mise de côté, si.
      const raisons = b.aider.filter(raison => raison.genre !== "revoir");
      if (raisons.length) aider.push({eleve, raison: raisons[0]});
      if (b.feliciter.length) feliciter.push({eleve, raison: b.feliciter[0]});
    });
    aider.sort((p, q) => p.raison.rang - q.raison.rang);
    feliciter.sort((p, q) => p.raison.rang - q.raison.rang || (q.raison.nombre || 0) - (p.raison.nombre || 0));
    const etiquettes = {absent: ["absence", "rouge"], bloque: ["blocage", "orange"], revoir: ["à revoir", "orange"], aide: ["aide", ""]};
    const texteRaison = raison => {
      const texte = el("span", "lc-texte");
      if (raison.appli) {
        texte.append(puceAppli(raison.appli), el("b", "", nomDeLAppli(raison.appli)), document.createTextNode(` · ${raison.texte}`));
      } else {
        texte.append(document.createTextNode(raison.texte));
      }
      return texte;
    };
    const remplir = (id, lignes, vide, dessinerLigne) => {
      const ul = $(`${id}-liste`);
      ul.textContent = "";
      const plus = $(`${id}-plus`);
      plus.textContent = "";
      plus.hidden = true;
      garderPopEleves();
      if (enLecture) { ul.append(el("li", "lc-vide", "Lecture des applis…")); return; }
      if (!lignes.length) { ul.append(el("li", "lc-vide", vide)); return; }
      lignes.slice(0, LIGNES_CARTE).forEach(ligne => ul.append(dessinerLigne(ligne)));
      const reste = lignes.slice(LIGNES_CARTE);
      // Lot S4b : « Et 12 autres » se touche — la liste complète des
      // autres, chacun avec sa raison, par-dessus la page ; un prénom
      // ouvre la fiche (avant : les prénoms seuls, sans raison).
      if (reste.length) {
        plus.hidden = false;
        plus.append(boutonNombre(`Et ${reste.length} autre${reste.length > 1 ? "s" : ""}`, pop => {
          pop.append(el("strong", "", `${id === "lc-aider" ? "À aider" : "À féliciter"} · ${pluriel(reste.length, "autre")}`));
          const autres = document.createElement("ul");
          reste.forEach(({eleve, raison}) => {
            const li = document.createElement("li");
            const qui = el("span", "");
            qui.append(lienFiche(eleve, "ensemble"));
            const pourquoi = el("span", "");
            if (id === "lc-aider") {
              const [mot, couleur] = etiquettes[raison.genre];
              pourquoi.append(el("span", `pastille ${couleur}`, mot));
            }
            pourquoi.append(texteRaison(raison));
            li.append(qui, pourquoi);
            autres.append(li);
          });
          pop.append(autres);
        }));
      }
    };
    const ligneDeCarte = (eleve, pastille, couleur, raison, faire) => {
      const li = document.createElement("li");
      const bouton = el("button", "lc-ligne");
      bouton.type = "button";
      const nom = el("b", "lc-nom", nomAffiche(eleve) || "sans prénom");
      const chip = el("span", `pastille ${couleur}`, pastille);
      bouton.append(nom, chip, texteRaison(raison));
      if (faire) bouton.append(el("small", "lc-faire", faire));
      bouton.addEventListener("click", () => ouvrirFenetreEleve(eleve, "ensemble"));
      li.append(bouton);
      return li;
    };
    // Lot S4a : des libellés vides courts et justes — ils disent qu'aucune
    // règle ne s'est allumée, pas que tout va bien.
    remplir("lc-aider", aider, "Rien à signaler cette semaine.", ({eleve, raison}) => {
      const [mot, couleur] = etiquettes[raison.genre];
      return ligneDeCarte(eleve, mot, couleur, raison, raison.faire);
    });
    const lundi = aujourdhuiSuivi() === lundiDuJour(aujourdhuiSuivi());
    $("lc-feliciter-sous").textContent = lundi ? "Ce qui a été gagné la semaine dernière, et aujourd’hui." : "Ce qui a été gagné cette semaine.";
    remplir("lc-feliciter", feliciter, lundi ? "Pas de bravo la semaine dernière." : "Pas encore de bravo cette semaine.", ({eleve, raison}) =>
      ligneDeCarte(eleve, "bravo", "vert", raison, ""));
  }

  // ----- la semaine regardée (lot « la semaine précédente », 14/11/2026)

  // Le plus ancien jour que la page cherche : le 1er août de l'année
  // scolaire (ce jour-là, le serveur efface les classes de l'année écoulée,
  // purge_de_l_annee) — aucune classe n'a de travail plus ancien.
  function plancherDeLAnnee(aujourdhui) {
    const annee = Number(String(aujourdhui).slice(0, 4));
    const aout = `${annee}-08-01`;
    return aujourdhui >= aout ? aout : `${annee - 1}-08-01`;
  }

  // « 9 nov. », « 1er déc. » : le lundi d'une semaine (le nombre et le mois
  // ne se séparent pas en fin de ligne).
  function lundiEnClair(lundi) {
    const d = new Date(`${lundi}T12:00:00Z`);
    if (isNaN(d)) return String(lundi);
    const jour = d.getUTCDate();
    return `${jour === 1 ? "1er" : jour}\u00a0${d.toLocaleDateString("fr-FR", {timeZone: "UTC", month: "short"})}`;
  }

  // Un élève de la classe a-t-il un jour de travail connu avant `lundi` ?
  // D'abord les bilans déjà faits (ils voient les 3 semaines d'avant la
  // semaine regardée) ; sinon, 4 semaines par 4 semaines en arrière, jusqu'au
  // 1er août. Chaque appli garde ce qu'elle garde (60 séances de Défi tables
  // ou de Défi calcul, 60 jours de SPLAT! ou de Coffres, 500 séances
  // d'Anzan) : quand plus personne n'a rien de connu avant, ‹ s'arrête.
  function travailAvant(lundi, liste, bilansVus, aujourdhui) {
    const plancher = plancherDeLAnnee(aujourdhui);
    const avant = jours => jours.some(jour => jour < lundi && jour >= plancher);
    if ([...bilansVus.values()].some(b => avant([...b.jours.keys()]))) return true;
    for (let fin = jourPlus(lundi, -22); fin >= plancher; fin = jourPlus(fin, -28)) {
      const trouve = liste.some(eleve => applisDuBilan().some(cle => {
        const suivi = suiviApp(cle, eleveDe(cle, eleve.id), fin);
        return Boolean(suivi) && avant(suivi.jours.map(j => j.jour));
      }));
      if (trouve) return true;
    }
    return false;
  }

  // La semaine que montre la colonne des 7 jours : son lundi, les bilans à
  // y lire (ceux d'aujourd'hui pour la semaine en cours ; pour une semaine
  // passée, chaque élève vu au dimanche de cette semaine-là) et si ‹ peut
  // encore reculer. « À aider », « À féliciter », les 4 semaines, les applis,
  // « Dernière fois » et le tri restent ceux d'aujourd'hui (choix de
  // Gwenaël : les cartes ne suivent pas la flèche).
  function semaineDeLaVue(liste, bilans, aujourdhui, enLecture) {
    const lundi = jourPlus(lundiDuJour(aujourdhui), -7 * semaineClasse);
    if (enLecture) return {lundi, decalage: semaineClasse, bilans, avant: false};
    let vus = bilans;
    if (semaineClasse > 0) {
      const dimanche = jourPlus(lundi, 6);
      vus = new Map();
      liste.forEach(eleve => vus.set(eleve.id, bilanEleve(eleve.id, dimanche)));
    }
    return {lundi, decalage: semaineClasse, bilans: vus, avant: travailAvant(lundi, liste, vus, aujourdhui)};
  }

  // ‹ recule d'une semaine, › avance ; jamais après la semaine en cours.
  function changerSemaineClasse(pas) {
    semaineClasse = Math.max(0, semaineClasse + pas);
    focusSemaine = pas < 0 ? "apres" : "avant";
    redessin.demander();
  }

  // Le titre de la colonne : ‹ « Cette semaine » › ou ‹ « Semaine du 9 nov. » ›.
  // Les deux flèches gardent toujours leur place (grisées au bout), le titre
  // garde sa largeur : changer de semaine ne déplace rien.
  function titreSemaineClasse(semaine, enLecture) {
    const th = el("th", "lc-th-semaine");
    const rangee = el("div", "lc-nav-semaine");
    const fleche = (sens, dessin, nom, actif) => {
      const bouton = el("button", "lc-fleche-semaine");
      bouton.type = "button";
      bouton.id = `lc-semaine-${sens}`;
      bouton.setAttribute("aria-label", nom);
      bouton.title = nom;
      // Le chevron, dessiné nœud par nœud (une constante de la page).
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      [["viewBox", "0 0 24 24"], ["width", "16"], ["height", "16"], ["aria-hidden", "true"], ["fill", "none"], ["stroke", "currentColor"],
        ["stroke-width", "2.6"], ["stroke-linecap", "round"], ["stroke-linejoin", "round"]].forEach(([nom, valeur]) => svg.setAttribute(nom, valeur));
      const trait = document.createElementNS("http://www.w3.org/2000/svg", "path");
      trait.setAttribute("d", dessin);
      svg.append(trait);
      bouton.append(svg);
      bouton.disabled = !actif;
      bouton.addEventListener("click", () => changerSemaineClasse(sens === "avant" ? 1 : -1));
      return bouton;
    };
    const titre = el("span", "lc-titre-semaine");
    titre.setAttribute("aria-live", "polite");
    const [haut, bas] = semaine.decalage ? ["Semaine du", lundiEnClair(semaine.lundi)] : ["Cette", "semaine"];
    titre.append(el("span", "", haut), document.createTextNode(" "), el("span", "", bas));
    rangee.append(
      fleche("avant", "M15 5l-7 7 7 7", "Semaine précédente", !enLecture && semaine.avant),
      titre,
      fleche("apres", "M9 5l7 7-7 7", "Semaine suivante", !enLecture && semaine.decalage > 0));
    th.append(rangee);
    return th;
  }

  // La semaine d'un élève : 7 cases, ✓ les jours de travail, la case du jour
  // entourée, les jours à venir en pointillés. Rien de rouge, jamais.
  function caseSemaine(bilan, jour, aujourdhui) {
    const fait = bilan && bilan.jours.has(jour);
    // Un jour d'avant la coupure, sans travail connu : pas connu (« ? »), pas
    // « rien » (correctif après Codex, point 7).
    const inconnu = !fait && Boolean(bilan && bilan.coupure && jour < bilan.coupure);
    const genre = jour > aujourdhui ? "futur" : fait ? "ok" : inconnu ? "inconnu" : "rien";
    const c = el("i", `lc-jour ${genre}${jour === aujourdhui ? " aujourdhui" : ""}`, fait ? "✓" : genre === "inconnu" ? "?" : "");
    c.setAttribute("aria-hidden", "true");
    return c;
  }

  // `lundi` : la semaine à montrer (lot « la semaine précédente ») ; une
  // semaine passée n'a ni case du jour ni jour à venir.
  function celluleSemaineClasse(bilan, aujourdhui, lundi = lundiDuJour(aujourdhui)) {
    const zone = el("span", "lc-semaine");
    const enCours = lundi === lundiDuJour(aujourdhui);
    const nom = enCours ? "Cette semaine" : `Semaine du ${lundiEnClair(lundi)}`;
    const faits = [];
    for (let d = 0; d < 7; d += 1) {
      const jour = jourPlus(lundi, d);
      zone.append(caseSemaine(bilan, jour, aujourdhui));
      if (bilan && bilan.jours.has(jour)) faits.push(JOURS_SEMAINE[d]);
    }
    zone.setAttribute("role", "img");
    const pasConnu = Boolean(bilan && bilan.coupure && bilan.coupure > lundi);
    zone.setAttribute("aria-label", (faits.length ? `${nom} : ${faits.join(", ")}` : pasConnu ? `${nom} : pas connue` : enCours ? `${nom} : rien pour l’instant` : `${nom} : rien`)
      + (pasConnu && faits.length ? " (les autres jours ne sont pas tous connus)" : ""));
    return zone;
  }

  // « 5 · 4 · 2 · 3 jours » : les jours de travail de chacune des 4 dernières
  // semaines, la semaine en cours à droite, en gras.
  function celluleQuatreSemaines(bilan) {
    const zone = el("span", "semaines");
    if (!bilan || !bilan.recu) { zone.classList.add("zero"); zone.textContent = "—"; return zone; }
    bilan.semaines.forEach((semaine, index) => {
      if (index) zone.append(el("span", "sep-semaine", " · "));
      const nombre = el(index === 3 ? "b" : "span", semaine.incomplete ? "inconnu" : semaine.jours ? "" : "zero", compteSemaine(semaine));
      zone.append(nombre);
    });
    zone.append(el("span", "lc-unite", " jours"));
    zone.title = bilan.semaines.map((s, i) => `${i === 3 ? "cette semaine" : `semaine du ${jourCourtChiffres(s.lundi)}`} : ${enJoursSemaine(s)}`).join(" · ")
      + (bilan.coupure ? ` — les jours d’avant le ${jourCourtChiffres(bilan.coupure)} ne sont pas tous connus` : "");
    return zone;
  }

  // Où en est l'élève dans une appli : {fait, total, unite} (total null :
  // pas de barre), ou null quand il n'y a rien commencé.
  function ouEnEst(cle, eleve) {
    const lu = eleve && eleve.lu;
    if (!lu || lu.lisible === false) return null;
    if (cle === "defi-tables") return eleve.maj_le ? {fait: (lu.acquises || []).length, total: 9, unite: "tables"} : null;
    // (Lot K2 : les étoiles gagnées, comme le tableau de l'onglet.)
    if (cle === "defi-calcul") { if (!lu.commence) return null; const c = compteEtoiles(lu); return {fait: c.gagnees, total: c.total, unite: "étoiles"}; }
    if (cle === "splat") return eleve.maj_le ? {fait: lu.faits, total: lu.total, unite: "étapes"} : null;
    if (cle === "coffres") return lu.commence ? {fait: lu.tresors, total: null, unite: lu.tresors > 1 ? "trésors" : "trésor"} : null;
    if (cle === "flash-anzan") return lu.commence ? {fait: lu.calculs, total: null, unite: lu.calculs > 1 ? "calculs" : "calcul"} : null;
    return null;
  }

  function barreAppli(cle, mesure) {
    const zone = el("span", "lc-barre");
    if (!mesure) { zone.classList.add("sans"); zone.textContent = "—"; return zone; }
    if (mesure.total) {
      const jauge = el("span", "lc-jauge");
      const plein = el("i", "");
      plein.style.width = `${Math.round(Math.max(0, Math.min(1, mesure.fait / mesure.total)) * 100)}%`;
      plein.style.background = COULEURS_APPLIS[cle];
      jauge.append(plein);
      zone.append(jauge, el("span", "lc-compte", `${mesure.fait} / ${mesure.total}`));
    } else {
      zone.append(el("span", "lc-compte", `${mesure.fait} ${mesure.unite}`));
    }
    return zone;
  }

  function dessinerTableauClasse(liste, bilans, applis, aujourdhui, enLecture, semaine) {
    // La semaine regardée (‹ ›) : sans elle, la semaine en cours.
    const vue7 = semaine || {lundi: lundiDuJour(aujourdhui), decalage: 0, bilans, avant: false};
    const tete = $("lc-entete");
    tete.textContent = "";
    const titre = (texte, tri, large) => {
      const th = document.createElement("th");
      if (large) th.className = "large";
      if (tri) {
        const bouton = el("button", "", texte);
        bouton.type = "button";
        bouton.dataset.triClasse = tri;
        bouton.addEventListener("click", () => {
          triClasse = triClasse.colonne === tri ? {colonne: tri, sens: -triClasse.sens} : {colonne: tri, sens: tri === "prenom" ? 1 : -1};
          redessin.demander();
        });
        th.append(bouton);
        if (triClasse.colonne === tri) th.setAttribute("aria-sort", triClasse.sens === 1 ? "ascending" : "descending");
      } else th.textContent = texte;
      tete.append(th);
    };
    titre("Élève", "prenom");
    tete.append(titreSemaineClasse(vue7, enLecture));
    titre("4 dernières semaines", "semaines", true);
    applis.forEach(cle => titre(nomDeLAppli(cle), "", true));
    titre("Dernière fois", "dernier", true);
    tete.append(el("th", "fin", ""));
    const corps = $("lc-corps");
    corps.textContent = "";
    let lignes = ordreDeLaFeuille(liste);
    if (triClasse.colonne !== "prenom" && !enLecture) {
      const valeur = eleve => {
        const b = bilans.get(eleve.id);
        if (!b) return -1;
        if (triClasse.colonne === "semaines") return b.semaines.reduce((s, x) => s + x.jours, 0) * 10 + b.semaines[3].jours;
        return b.dernier ? Date.parse(`${b.dernier}T12:00:00Z`) : -1;
      };
      lignes = lignes.slice().sort((p, q) => (valeur(p) - valeur(q)) * triClasse.sens);
    } else if (triClasse.sens === -1) {
      const avec = lignes.filter(e => e.prenom).reverse();
      lignes = avec.concat(lignes.filter(e => !e.prenom));
    }
    idsAffiches = lignes.map(eleve => eleve.id);
    lignes.forEach(eleve => {
      const b = bilans.get(eleve.id);
      const ligne = document.createElement("tr");
      const cNom = el("td", "nom", nomAffiche(eleve) || "sans prénom");
      const cSemaine = document.createElement("td");
      cSemaine.append(celluleSemaineClasse(vue7.bilans.get(eleve.id), aujourdhui, vue7.lundi));
      const cQuatre = document.createElement("td");
      cQuatre.append(celluleQuatreSemaines(b));
      large(cQuatre);
      ligne.append(cNom, cSemaine, cQuatre);
      applis.forEach(cle => {
        const td = document.createElement("td");
        td.append(barreAppli(cle, ouEnEst(cle, eleveDe(cle, eleve.id))));
        large(td);
        ligne.append(td);
      });
      const cDate = el("td", "", b && b.dernier ? jourCourtCalcul(b.dernier) : (b && !b.recu ? "jamais" : "—"));
      if (!b || !b.dernier) cDate.classList.add("sans");
      large(cDate);
      ligne.append(cDate);
      // La fin de ligne commune (flèche, ligne entière qui ouvre) ; sans
      // « Revenir à… » ici : c'est un geste d'une appli, dans son onglet.
      finirLigne(ligne, {id: eleve.id, prenom: eleve.prenom, initiale: eleve.initiale}, cNom);
      ligne.querySelector("td.geste").remove();
      corps.append(ligne);
    });
    // Après ‹ ou › : le doigt (le clavier) reste sur la flèche touchée — ou
    // sur l'autre, quand celle-ci vient de se griser au bout.
    if (focusSemaine) {
      const voulu = $(`lc-semaine-${focusSemaine}`);
      const autre = $(`lc-semaine-${focusSemaine === "avant" ? "apres" : "avant"}`);
      focusSemaine = "";
      const cible = voulu && !voulu.disabled ? voulu : autre && !autre.disabled ? autre : null;
      if (cible) cible.focus({preventScroll: true});
    }
  }

  // ----- la fiche d'un élève

  // Les onglets de sa fiche : « Vue d'ensemble », puis chaque appli qu'il
  // voit (celles de la classe, celles qu'on lui a ouvertes en plus) ou où il
  // a déjà du travail — dans l'ordre du catalogue.
  function ongletsDeLaFiche(id) {
    const base = eleveParId(id);
    const voit = new Set((classe && classe.applis) || []);
    if (base) accesDe(base).applis.forEach(cle => voit.add(cle));
    return ["ensemble"].concat(APPLIS.filter(a => !a.sansSuivi).map(a => a.cle).filter(cle => {
      if (voit.has(cle)) return true;
      const eleve = eleveDe(cle, id);
      return Boolean(eleve && aDuTravail(eleve));
    }));
  }

  function dessinerOngletsFiche(onglets) {
    const rangee = $("fe-onglets");
    rangee.textContent = "";
    onglets.forEach(cle => {
      const bouton = el("button", "", cle === "ensemble" ? "Vue d’ensemble" : nomDeLAppli(cle));
      bouton.type = "button";
      bouton.setAttribute("role", "tab");
      bouton.setAttribute("aria-selected", String(cle === ongletFiche));
      bouton.dataset.onglet = cle;
      bouton.addEventListener("click", () => changerOngletFiche(cle));
      rangee.append(bouton);
    });
    const actif = rangee.querySelector('[aria-selected="true"]');
    if (actif && rangee.scrollWidth > rangee.clientWidth) {
      const r = rangee.getBoundingClientRect();
      const a = actif.getBoundingClientRect();
      if (a.right > r.right - 16) rangee.scrollLeft += a.right - r.right + 32;
      else if (a.left < r.left) rangee.scrollLeft -= r.left - a.left + 8;
    }
  }

  function changerOngletFiche(cle) {
    if (cle === ongletFiche) return;
    ongletFiche = cle;
    jourChoisiFiche = null;
    // Un billet de parcours encore en route (Défi tables) ne vaut plus pour
    // l'onglet suivant, même son erreur (correctif après Codex, point 5).
    demandeParcours += 1;
    seancesFiche = 6;
    messager("fe-message", "", "");
    dessinerFenetreEleve();
    $("fe-corps").scrollTop = 0;
  }

  // La « Vue d'ensemble » : à gauche son calendrier, « À voir », « Où il en
  // est » ; à droite « Ce qu'il a fait », jour par jour.
  function contenuEnsemble(id) {
    const zone = el("div", "fe-ensemble");
    // La lecture de la classe (une seule, partagée avec La classe) : la
    // fiche se redessine quand elle finit (redessin → dessinerTableau). Une
    // panne se dit ICI, dans le dessin de cette fiche (correctif après
    // Codex, points 3 et 5) : jamais relancée, jamais chez un autre élève.
    const lecture = lectureDeLaClasse();
    const manquantes = listesALire();
    if (manquantes.length && !(lecture && lecture.fini)) {
      zone.append(paragrapheVide("Lecture des applis…"));
      return zone;
    }
    if (manquantes.length) zone.append(el("p", "fe-note fe-panne", `${textePanne(manquantes, lecture)} : ce qui suit ne le compte pas. Recharge la page pour réessayer.`));
    const aujourdhui = aujourdhuiSuivi();
    const bilan = bilanEleve(id, aujourdhui);
    const gauche = el("div", "fe-col");
    const droite = el("div", "fe-col");

    // Son calendrier.
    gauche.append(el("h3", "", "Ses 4 dernières semaines"));
    const grille = el("div", "fe-calendrier");
    // Lot S4b : un jour de travail est un bouton (le mettre en avant dans
    // « Activité ») ; la grille est un groupe, son étiquette dit les jours.
    grille.setAttribute("role", "group");
    grille.append(el("span", "", ""));
    ["L", "M", "M", "J", "V", "S", "D"].forEach(l => grille.append(el("span", "fe-jour-nom", l)));
    const dits = [];
    for (let s = 0; s < 4; s += 1) {
      const lundi = jourPlus(bilan.debut, 7 * s);
      grille.append(el("span", "fe-semaine-nom", jourCourtChiffres(lundi)));
      for (let d = 0; d < 7; d += 1) {
        const jour = jourPlus(lundi, d);
        const applis = bilan.jours.get(jour) || [];
        const inconnu = !applis.length && jour <= aujourdhui && Boolean(bilan.coupure && jour < bilan.coupure);
        const c = el(applis.length ? "button" : "span", `fe-case${jour > aujourdhui ? " futur" : ""}${jour === aujourdhui ? " aujourdhui" : ""}${applis.length ? " fait" : ""}${inconnu ? " inconnu" : ""}`);
        if (inconnu) c.textContent = "?";
        if (applis.length) {
          c.type = "button";
          c.dataset.jour = jour;
          c.setAttribute("aria-pressed", String(jour === jourChoisiFiche));
          c.setAttribute("aria-label", `${jourEnClair(jour)} : ${applis.map(nomDeLAppli).join(", ")}`);
          c.addEventListener("click", () => choisirJourFiche(id, jour));
        }
        applis.forEach(cle => c.append(puceAppli(cle)));
        if (applis.length) dits.push(`${jourEnClair(jour)} : ${applis.map(nomDeLAppli).join(", ")}`);
        grille.append(c);
      }
    }
    grille.setAttribute("aria-label", dits.length ? dits.join(" ; ") : "Aucun jour de travail sur les 4 dernières semaines");
    gauche.append(grille);
    const resume = el("p", "fe-resume");
    resume.append(el("b", "", enJoursSemaine(bilan.semaines[3])), document.createTextNode(` cette semaine · ${enJoursSemaine(bilan.semaines[2])} la semaine dernière`));
    gauche.append(resume);
    const legende = el("p", "fe-legende");
    Object.keys(bilan.parApp).forEach(cle => {
      const morceau = el("span", "");
      morceau.append(puceAppli(cle), document.createTextNode(nomDeLAppli(cle)));
      legende.append(morceau);
    });
    if (grille.querySelector(".inconnu")) legende.append(el("span", "fe-legende-inconnu", "? pas connu"));
    if (legende.childNodes.length) gauche.append(legende);

    // À voir.
    gauche.append(el("h3", "", "À voir"));
    const aVoir = el("ul", "fe-avoir");
    const etiquettes = {absent: ["absence", "rouge"], bloque: ["blocage", "orange"], revoir: ["à revoir", "orange"], aide: ["aide", ""]};
    bilan.aider.forEach(raison => {
      const li = document.createElement("li");
      const [mot, couleur] = etiquettes[raison.genre];
      const texte = el("span", "lc-texte");
      if (raison.appli) texte.append(puceAppli(raison.appli), el("b", "", nomDeLAppli(raison.appli)), document.createTextNode(` · ${raison.texte}`));
      else texte.append(document.createTextNode(raison.texte));
      const faire = el("small", "lc-faire", raison.faire);
      if (raison.lien) faire.append(document.createTextNode(" "), lienOuvrirEnClasse(raison.lien.module, raison.lien.niveau));
      li.append(el("span", `pastille ${couleur}`, mot), texte, faire);
      aVoir.append(li);
    });
    bilan.feliciter.forEach(raison => {
      const li = document.createElement("li");
      const texte = el("span", "lc-texte");
      texte.append(puceAppli(raison.appli), el("b", "", nomDeLAppli(raison.appli)), document.createTextNode(` · ${raison.texte}`));
      li.append(el("span", "pastille vert", "bravo"), texte);
      aVoir.append(li);
    });
    if (aVoir.childNodes.length) gauche.append(aVoir);
    else gauche.append(paragrapheVide("Rien à signaler."));

    // Où il en est.
    const onglets = ongletsDeLaFiche(id).filter(cle => cle !== "ensemble");
    if (onglets.length) {
      gauche.append(el("h3", "", "Progression"));
      const ul = el("ul", "fe-ou");
      onglets.forEach(cle => {
        const li = document.createElement("li");
        const icone = el("span", "fe-icone");
        icone.innerHTML = ICONES_APPLIS[cle] || "";
        const nom = el("b", "", nomDeLAppli(cle));
        const mesure = ouEnEst(cle, eleveDe(cle, id));
        const barre = barreAppli(cle, mesure);
        if (mesure && mesure.total) barre.append(el("span", "lc-unite", mesure.unite));
        if (!mesure) { barre.textContent = ""; barre.append(el("span", "lc-unite", "pas commencé")); }
        const detail = el("button", "lien-onglet", "Détail ›");
        detail.type = "button";
        detail.addEventListener("click", () => changerOngletFiche(cle));
        li.append(icone, nom, barre, detail);
        ul.append(li);
      });
      gauche.append(ul);
    }

    // Ce qu'il a fait, jour par jour.
    droite.append(el("h3", "", "Activité"));
    const {jours, encore, notes} = joursDeLaFiche(id, aujourdhui, joursFiche);
    if (!jours.length) droite.append(paragrapheVide(bilan.recu ? "Aucun jour de travail pour l’instant." : "Rien reçu pour l’instant."));
    jours.forEach(({jour, lignes}) => {
      const bloc = el("div", `fe-jour-bloc${jour === jourChoisiFiche ? " choisi" : ""}`);
      bloc.dataset.jour = jour;
      bloc.append(el("p", "fe-jour-titre", jourEnClair(jour)));
      const ul = el("ul", "fe-lignes");
      lignes.forEach(({cle, ligne}) => {
        const [quoi, chiffres, faible] = texteLigne(cle, ligne);
        const li = document.createElement("li");
        const gaucheLigne = el("span", "lc-texte");
        gaucheLigne.append(puceAppli(cle), el("b", "", nomDeLAppli(cle)), document.createTextNode(quoi ? ` · ${quoi}` : ""));
        li.append(gaucheLigne);
        if (chiffres) li.append(el("span", `fe-chiffres${faible ? " faible" : ""}`, chiffres));
        ul.append(li);
      });
      bloc.append(ul);
      droite.append(bloc);
    });
    if (encore) {
      const plus = el("button", "secondaire fe-plus", "Voir les jours précédents");
      plus.type = "button";
      plus.addEventListener("click", () => { joursFiche += 7; dessinerFenetreEleve(); });
      droite.append(plus);
    }
    notes.forEach(note => droite.append(el("p", "fe-note", note)));
    zone.append(gauche, droite);
    return zone;
  }

  // Lot S4b : toucher un jour de son calendrier le met en avant dans
  // « Activité » — la liste reste, rien ne bouge ; le toucher de nouveau
  // l'oublie. Un jour plus ancien que ceux montrés : « Activité » en montre
  // assez pour l'atteindre (comme « Voir les jours précédents » ; le
  // calendrier a 4 semaines, donc 28 jours au plus). Puis, s'il est hors de
  // la vue, la fiche défile pour le montrer au milieu (choix de Gwenaël du
  // 08/11, planches Q4).
  function choisirJourFiche(id, jour) {
    jourChoisiFiche = jourChoisiFiche === jour ? null : jour;
    const corps = $("fe-corps");
    const blocDuJour = () => [...corps.querySelectorAll(".fe-jour-bloc")].find(b => b.dataset.jour === jour) || null;
    if (jourChoisiFiche && !blocDuJour()) {
      const {jours} = joursDeLaFiche(id, aujourdhuiSuivi(), 28);
      const rang = jours.findIndex(j => j.jour === jour);
      if (rang >= 0) joursFiche = Math.max(joursFiche, rang + 1);
      const haut = corps.scrollTop;
      dessinerFenetreEleve();
      corps.scrollTop = haut;
    } else {
      corps.querySelectorAll(".fe-case[data-jour]").forEach(c => c.setAttribute("aria-pressed", String(c.dataset.jour === jourChoisiFiche)));
      corps.querySelectorAll(".fe-jour-bloc").forEach(b => b.classList.toggle("choisi", b.dataset.jour === jourChoisiFiche));
    }
    const bloc = jourChoisiFiche ? blocDuJour() : null;
    if (!bloc) return;
    // À l'ordinateur (deux colonnes), la colonne du calendrier reste en
    // place pendant que la fiche défile jusqu'au jour — si elle tient dans
    // la fenêtre (sinon sa fin ne se lirait plus).
    const [gauche, droite] = corps.querySelectorAll(".fe-ensemble > .fe-col");
    const hauteur = colonne => colonne.lastElementChild ? colonne.lastElementChild.getBoundingClientRect().bottom - colonne.getBoundingClientRect().top : 0;
    if (gauche && droite && gauche.offsetTop === droite.offsetTop && hauteur(gauche) <= corps.clientHeight) gauche.classList.add("colle");
    const r = bloc.getBoundingClientRect();
    const rc = corps.getBoundingClientRect();
    if (r.top < rc.top || r.bottom > rc.bottom) bloc.scrollIntoView({block: "center", behavior: "smooth"});
  }

  // Lot « cours-appli-2 » (13/11/2026, choix de Gwenaël) : les fiches de
  // cours qu'un élève a ouvertes, rangées par jour — Map jour → lignes
  // {chapitre, niveau, fiches: [numéros], brevet}, une ligne par chapitre,
  // dans l'ordre du livret. Une fiche commune à deux chapitres (4e-TRI-03)
  // est rangée dans celui que la classe a ouvert, sinon dans le premier du
  // livret. Une fiche inconnue du catalogue, un jour mal formé : oubliés.
  function joursCoursDe(eleve) {
    const parJour = new Map();
    const ouvertes = eleve && eleve.ouvertes && typeof eleve.ouvertes === "object" ? eleve.ouvertes : {};
    const reglage = coursDeLaClasse();
    const place = new Map();
    COURS.filter(ch => reglage.chapitres.has(ch.id)).concat(COURS).forEach(ch => {
      ch.fiches.forEach(f => { if (!place.has(f.id)) place.set(f.id, {ch, n: f.n}); });
      if (ch.brevet && !place.has(ch.brevet.id)) place.set(ch.brevet.id, {ch, n: 0});
    });
    Object.keys(ouvertes).forEach(fiche => {
      const jour = jourOuvert(eleve, fiche);
      const ou = place.get(fiche);
      if (!jour || !ou) return;
      if (!parJour.has(jour)) parJour.set(jour, new Map());
      const parChapitre = parJour.get(jour);
      if (!parChapitre.has(ou.ch.id)) {
        parChapitre.set(ou.ch.id, {chapitre: ou.ch.chapitre || ou.ch.titre, niveau: ou.ch.niveau, rang: COURS.indexOf(ou.ch), fiches: [], brevet: false});
      }
      const ligne = parChapitre.get(ou.ch.id);
      if (ou.n) ligne.fiches.push(ou.n); else ligne.brevet = true;
    });
    const sortie = new Map();
    parJour.forEach((parChapitre, jour) => {
      sortie.set(jour, [...parChapitre.values()].sort((a, b) => a.rang - b.rang)
        .map(l => ({chapitre: l.chapitre, niveau: l.niveau, fiches: l.fiches.sort((a, b) => a - b), brevet: l.brevet})));
    });
    return sortie;
  }

  // Les jours de travail d'un élève, du plus récent au plus ancien, autant
  // qu'il en faut : les 4 dernières semaines, puis les 4 qui finissent au
  // jour de travail le plus récent d'avant… (chaque moteur relu « comme si on
  // était » à la fin de la période). Correctif après Codex (point 6) : plus
  // de plafond — on saute les mois sans travail, jusqu'au plus ancien jour
  // gardé (chaque tour avance d'au moins un jour connu vers le passé : la
  // boucle finit). `encore` : il y en a d'autres plus anciens. `notes` : ce
  // qu'une appli ne connaît plus (point 7 : ses jours commencent à une date).
  function joursDeLaFiche(id, aujourdhui, besoin) {
    const applis = applisDuBilan().filter(cle => eleveDe(cle, id));
    const tous = [];
    const notes = [];
    // Lot « cours-appli-2 » : ses fiches de cours ouvertes, rangées par jour
    // (le dernier jour d'ouverture de chaque fiche : c'est tout ce qu'on garde).
    const eleveCours = eleveDe("cours", id);
    const cours = eleveCours ? joursCoursDe(eleveCours) : new Map();
    if (cours.size) notes.push("Cours : pour chaque fiche, seul le dernier jour où elle a été ouverte est gardé ; ouvrir une fiche ne compte pas comme un jour de travail.");
    applis.forEach(cle => {
      const depuis = coupureDe(cle, eleveDe(cle, id), aujourdhui);
      if (!depuis) return;
      notes.push(depuis > aujourdhui
        ? `${nomDeLAppli(cle)} : ses jours de travail d’avant ne sont pas connus (l’appli ne les notait pas encore).`
        : `${nomDeLAppli(cle)} : les jours d’avant le ${jourCourtChiffres(depuis)} ne sont pas connus.`);
    });
    let fin = aujourdhui;
    let encore = false;
    while (fin) {
      const parJour = new Map();
      const debut = jourPlus(lundiDuJour(fin), -21);
      let suivant = null;
      applis.forEach(cle => {
        const eleve = eleveDe(cle, id);
        const suivi = suiviApp(cle, eleve, fin);
        if (!suivi) return;
        suivi.jours.forEach(j => {
          if (j.jour < debut || j.jour > fin) return;
          if (!parJour.has(j.jour)) parJour.set(j.jour, []);
          j.lignes.forEach(ligne => parJour.get(j.jour).push({cle, ligne}));
        });
        // Le jour de travail le plus récent d'avant cette période.
        const avant = suiviApp(cle, eleve, jourPlus(debut, -1));
        if (avant && avant.dernier && avant.dernier < debut && (!suivant || avant.dernier > suivant)) suivant = avant.dernier;
      });
      cours.forEach((lignes, jour) => {
        if (jour > fin) return;
        if (jour < debut) { if (!suivant || jour > suivant) suivant = jour; return; }
        if (!parJour.has(jour)) parJour.set(jour, []);
        lignes.forEach(ligne => parJour.get(jour).push({cle: "cours", ligne}));
      });
      [...parJour.keys()].sort().reverse().forEach(jour => {
        const lignes = parJour.get(jour);
        lignes.sort((p, q) => APPLIS.findIndex(a => a.cle === p.cle) - APPLIS.findIndex(a => a.cle === q.cle));
        tous.push({jour, lignes});
      });
      if (tous.length > besoin) { encore = true; break; }
      fin = suivant;
    }
    return {jours: tous.slice(0, besoin), encore, notes};
  }

  // Une ligne de « Ce qu'il a fait » : [ce qui a été fait, les chiffres,
  // faible]. Des nombres seulement (null : pas connu) ; jamais un temps.
  function texteLigne(cle, l) {
    const connu = v => typeof v === "number" && v >= 0;
    const morceaux = [];
    let chiffres = "";
    let faible = false;
    const score = (justes, total, mot) => {
      if (!connu(total) || total <= 0) return;
      chiffres = `${mot}${connu(justes) ? justes : "?"}/${total}`;
      faible = connu(justes) && justes * 2 < total;
    };
    // « 3 », « 3 et 4 », « 2, 3 et 4 ».
    const enListe = nombres => (nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} et ${nombres[nombres.length - 1]}` : String(nombres[0]));
    if (cle === "defi-tables" && l.hors === 1) {
      // Lot « le jour vert » (11/11/2026) : ce qui a été fait depuis
      // l'accueil, sans séance — une ligne par table, écrite comme une
      // ligne de séance (choix de Gwenaël : pas de mention « hors séance »).
      if (l.table) morceaux.push(`table de ${l.table}`);
      if (l.mesCalculs === 1) morceaux.push("Mes calculs du jour");
      if (l.apprends === 1) morceaux.push("J’apprends");
      if (l.entraine === 1) morceaux.push("entraînement");
      if (l.test === 1) morceaux.push("test réussi ✓");
      else if (l.test === 2) morceaux.push("test pas encore");
      if (l.melange === 1) morceaux.push("Mon mélange");
      if (l.melange === 1 && connu(l.score)) chiffres = `${l.score}/20`;
    } else if (cle === "defi-tables") {
      morceaux.push(l.table ? `table de ${l.table}` : connu(l.table) ? "révisions" : "une séance");
      // Lot « le jour vert » : le nombre d'étapes de la séance.
      if (connu(l.etapes) && l.etapes > 0) morceaux.push(pluriel(l.etapes, "étape"));
      if (l.test === 1) morceaux.push("test réussi ✓");
      else if (l.test === 2) morceaux.push("test pas encore");
      score(l.justes, l.calculs, "calculs du jour ");
    } else if (cle === "defi-calcul") {
      // Lot « le jour vert » : les modules avancés ce jour-là, par leur nom
      // (jamais leur code : un module sans nom connu n'est pas écrit).
      const modules = Array.isArray(l.modules) && CALCUL_CORE
        ? l.modules.map(id => { const fiche = CALCUL_CORE.moduleDe(id); return fiche ? fiche.nom : ""; }).filter(Boolean) : [];
      if (modules.length) morceaux.push(modules.join(", "));
      // (Lot K2 : les mots des étoiles.)
      if (connu(l.prouvees) && l.prouvees > 0) morceaux.push(`${pluriel(l.prouvees, "étoile gagnée", "étoiles gagnées")} à « Je tente »`);
      if (connu(l.nouveautes) && l.nouveautes > 0) morceaux.push(`${pluriel(l.nouveautes, "étoile gagnée", "étoiles gagnées")} par J’apprends`);
      if (!morceaux.length) morceaux.push(connu(l.calculs) ? "révisions seulement" : "une séance");
      score(l.justes, l.calculs, "calculs du jour ");
    } else if (cle === "flash-anzan") {
      const grade = l.grade && ANZAN && ANZAN.nomGrade ? ANZAN.nomGrade(l.grade) : "";
      // Barème révisé (22/11/2026) : un passage se fait étape par étape.
      const etape = l.etape && l.sur > 1 ? `, étape ${l.etape} sur ${l.sur}` : "";
      const mode = l.mode === "colonne" ? "Colonne" : l.mode === "grade" ? `grade ${grade}${etape}`.trim() : l.mode === "entrainement" ? `entraînement${grade ? ` au ${grade}${etape}` : ""}` : "Flash";
      morceaux.push(mode);
      // Lot « le jour vert » : un passage de grade dit son verdict.
      if (l.mode === "grade" && l.reussi === 1) morceaux.push(etape ? "réussie ✓" : "réussi ✓");
      else if (l.mode === "grade" && l.reussi === 0) morceaux.push("pas encore");
      score(l.justes, l.calculs, "");
      if (chiffres) chiffres += l.justes > 1 ? " justes" : " juste";
    } else if (cle === "splat") {
      // Lot « le jour vert » : l'étape réussie pour la première fois ce
      // jour-là, par son numéro ; les autres réussites du jour sont des
      // étapes refaites ; une série sans réussite, « pas encore réussie ».
      if (!Array.isArray(l.etapes)) {
        // Une ligne sans le détail (un moteur d'avant le lot) : comme avant.
        if (connu(l.series)) morceaux.push(pluriel(l.series, "série"));
        if (connu(l.reussies) && l.reussies > 0) morceaux.push(pluriel(l.reussies, "étape réussie", "étapes réussies"));
        if (connu(l.vues) && l.vues > 0) chiffres = pluriel(l.vues, "réponse vue", "réponses vues");
        return [morceaux.join(" · "), chiffres, faible];
      }
      const etapes = l.etapes.filter(n => typeof n === "number");
      const bonus = connu(l.bonus) ? l.bonus : 0;
      if (etapes.length) morceaux.push(`${etapes.length > 1 ? "étapes" : "étape"} ${enListe(etapes)} ${etapes.length > 1 ? "réussies" : "réussie"}`);
      if (bonus > 0) morceaux.push(pluriel(bonus, "bonus réussi", "bonus réussis"));
      const refaites = connu(l.reussies) ? Math.max(0, l.reussies - etapes.length - bonus) : 0;
      if (refaites > 0) morceaux.push(pluriel(refaites, "étape refaite", "étapes refaites"));
      if (!morceaux.length && connu(l.series)) morceaux.push(`${pluriel(l.series, "série")} · pas encore réussie`);
      if (connu(l.vues) && l.vues > 0) chiffres = pluriel(l.vues, "réponse vue", "réponses vues");
    } else if (cle === "cours") {
      // Lot « cours-appli-2 » : « Pourcentages : ouverture des fiches 2 et 5 »
      // (le nom, pas le participe : aucun accord à faire, et jamais « lue »).
      const fiches = Array.isArray(l.fiches) ? l.fiches.filter(n => typeof n === "number") : [];
      const quoi = [];
      // « fiche 10 » ne se coupe pas entre le mot et le numéro (espace insécable).
      if (fiches.length) quoi.push(fiches.length > 1 ? `des fiches\u00a0${enListe(fiches)}` : `de la fiche\u00a0${fiches[0]}`);
      if (l.brevet) quoi.push(l.niveau === "4e" ? "des Exercices type" : "de l’Entraînement brevet");
      if (quoi.length) morceaux.push(`${l.chapitre || "un chapitre"} : ouverture ${quoi.join(" et ")}`);
    } else if (cle === "coffres") {
      if (connu(l.tresors) && l.tresors > 0) morceaux.push(pluriel(l.tresors, "trésor"));
      if (connu(l.parfaits) && l.parfaits > 0) morceaux.push(pluriel(l.parfaits, "parfait"));
      // Lot « le jour vert » : les clés gagnées ce jour-là sans trésor, ou
      // la partie pas finie (ses clés sur 10, son niveau).
      if (!morceaux.length && connu(l.cles) && l.cles > 0) morceaux.push(pluriel(l.cles, "clé"));
      if (connu(l.partie) && l.partie > 0) morceaux.push(`partie en cours : ${l.partie} clé${l.partie > 1 ? "s" : ""} sur 10${connu(l.niveau) ? ` · niveau ${l.niveau}` : ""}`);
      if (!morceaux.length) morceaux.push("une partie");
      if (connu(l.solutions) && l.solutions > 0) chiffres = pluriel(l.solutions, "solution vue", "solutions vues");
      else if (connu(l.aides) && l.aides > 0) chiffres = pluriel(l.aides, "aide");
    }
    return [morceaux.join(" · "), chiffres, faible];
  }

  // ----- Défi calcul, « Où en est chacun » (lot K2, 28/11/2026, planches
  // K2-3 et K2-4 ; elle remplace les barres par module du lot S2) : un
  // onglet par étage, une ligne par élève, une case par étoile, une bande de
  // couleur par ligne de la carte, « Gagnée par » en bas. Les prénoms restent
  // collés à gauche quand la grille défile de côté. Toucher une case : son
  // détail PAR-DESSUS la page (ouvrirPopEleves, comme « 5 élèves »).
  let etageGrille = 0;
  // Les couleurs des bandes : celles de maths&go, dans l'ordre des lignes.
  const COULEURS_LIGNES = ["#08aaa5", "#0b67b2", "#f58220", "#1a7f37", "#063f86", "#f9bf3b", "#b42318", "#5c6c82", "#06716e"];

  // L'étage montré d'abord : le premier où un élève qui a commencé a encore
  // une étoile à gagner (une 4e qui a fini le CP arrive sur le CE1).
  function etageDeDepart(plan, lignes) {
    const lus = lignes.map(e => e.lu).filter(lu => lu && lu.commence);
    const etage = plan.find(e => lus.some(lu => e.lignes.some(l => l.cases.some(x => !gagneeGrille(etoileDe(lu, x.cle).etat)))));
    return (etage || plan[0]).etage;
  }

  // Le détail d'une case : l'étoile, l'élève, l'état en mots, la date.
  function detailCase(eleve, x) {
    return pop => {
      const e = etoileDe(eleve.lu, x.cle);
      pop.append(el("strong", "", majuscule(nomCompetenceCalcul(x.module, x.niveau))));
      pop.append(el("p", "", `${CLASSES_ETAGES[x.etage] || ""} · ${x.ligne}`));
      const p = el("p", "");
      p.append(lienFiche(eleve), document.createTextNode(` : ${MOTS_GRILLE[e.etat]}`));
      pop.append(p);
      const quand = [];
      if (gagneeGrille(e.etat) && e.entree) quand.push(`gagnée la première fois le ${jourCourtCalcul(e.entree)}`);
      if (e.etat === "tenu" || e.etat === "gagnee") {
        if (e.echeance) quand.push(`revient dans ses calculs du jour le ${jourCourtCalcul(e.echeance)}`);
      } else {
        const suite = suiteCalcul(e);
        if (suite) quand.push(suite);
      }
      if (quand.length) pop.append(el("p", "", quand.join(" · ")));
      const lien = el("p", "");
      lien.append(lienOuvrirEnClasse(x.module, x.niveau));
      pop.append(lien);
    };
  }

  function dessinerOuEnEst() {
    const bloc = $("dc-ouest");
    const lignes = elevesDeLOnglet();
    const plan = planCalcul();
    if (!CALCUL || !CALCUL_CORE || !plan.length || !lignes.some(e => e.lu && e.lu.commence)) {
      bloc.hidden = true;
      viderZonesIds(["dc-ouest-paliers", "dc-grille", "dc-grille-legende"]);
      return;
    }
    // Ouverte au départ (à l'ordinateur et au téléphone : la grille est la
    // vue principale) ; ensuite, comme le professeur l'a laissée.
    if (!bloc.dataset.pose) { bloc.open = true; bloc.dataset.pose = "1"; }
    if (!plan.some(e => e.etage === etageGrille)) etageGrille = etageDeDepart(plan, lignes);
    const onglets = $("dc-ouest-paliers");
    onglets.textContent = "";
    plan.forEach(e => {
      const bouton = el("button", "", `${CLASSES_ETAGES[e.etage] || e.etage} · ${e.total}`);
      bouton.type = "button";
      bouton.setAttribute("aria-label", `${nomPalierCalcul(e.etage)}, ${e.total} étoiles`);
      bouton.setAttribute("aria-pressed", String(e.etage === etageGrille));
      bouton.addEventListener("click", () => { etageGrille = e.etage; fermerPopEleves(); dessinerOuEnEst(); });
      onglets.append(bouton);
    });
    const etage = plan.find(e => e.etage === etageGrille);
    const eleves2 = ordreDeLaFeuille(lignes);
    const table = el("table", "");
    const thead = document.createElement("thead");
    const tete = document.createElement("tr");
    tete.append(el("th", "dc-g-nom", ""), el("th", "dc-g-compte", ""));
    etage.lignes.forEach((l, i) => {
      if (i) tete.append(el("th", "dc-g-sep", ""));
      const th = el("th", "dc-g-bande", l.nom);
      th.colSpan = l.cases.length;
      th.title = l.nom;
      th.style.setProperty("--c", COULEURS_LIGNES[i % COULEURS_LIGNES.length]);
      tete.append(th);
    });
    thead.append(tete);
    const tbody = document.createElement("tbody");
    eleves2.forEach(eleve => {
      const tr = document.createElement("tr");
      const nom = el("td", "dc-g-nom");
      nom.append(lienFiche(eleve));
      const gagnees = etage.lignes.reduce((s, l) => s + l.cases.filter(x => gagneeGrille(etoileDe(eleve.lu, x.cle).etat)).length, 0);
      tr.append(nom, el("td", "dc-g-compte", eleve.lu && eleve.lu.commence ? `${gagnees} / ${etage.total}` : "—"));
      etage.lignes.forEach((l, i) => {
        if (i) tr.append(el("td", "dc-g-sep", ""));
        l.cases.forEach(x => {
          const etat = etoileDe(eleve.lu, x.cle).etat;
          const td = document.createElement("td");
          const c = el("button", `dc-g-case ${etat}`, etat === "classe" ? "?" : "");
          c.type = "button";
          c.setAttribute("aria-label", `${nomAffiche(eleve) || "sans prénom"} · ${nomCompetenceCalcul(x.module, x.niveau)} : ${MOTS_GRILLE[etat]}`);
          c.setAttribute("aria-expanded", "false");
          c.addEventListener("click", evenement => { evenement.stopPropagation(); ouvrirPopEleves(c, detailCase(eleve, x)); });
          td.append(c);
          tr.append(td);
        });
      });
      tbody.append(tr);
    });
    const bas = el("tr", "dc-g-bas");
    bas.append(el("td", "dc-g-nom dc-g-total", "Gagnée par"), el("td", "dc-g-compte", "élèves"));
    etage.lignes.forEach((l, i) => {
      if (i) bas.append(el("td", "dc-g-sep", ""));
      l.cases.forEach(x => bas.append(el("td", "dc-g-n", String(eleves2.filter(eleve => gagneeGrille(etoileDe(eleve.lu, x.cle).etat)).length))));
    });
    tbody.append(bas);
    table.append(thead, tbody);
    $("dc-grille").replaceChildren(table);
    const legende = $("dc-grille-legende");
    legende.textContent = "";
    ETATS_GRILLE.forEach(etat => {
      const morceau = el("span", "");
      morceau.append(el("i", `dc-g-case ${etat}`, etat === "classe" ? "?" : ""), document.createTextNode(MOTS_GRILLE[etat]));
      legende.append(morceau);
    });
    bloc.hidden = false;
  }

  // ----- Lot S4b « des chiffres aux élèves » (08/11/2026) : un « 5 élèves »
  // se touche et montre les prénoms, PAR-DESSUS la page, sous ce qu'on a
  // touché (rien ne descend) ; un prénom ouvre sa fiche ; la fiche fermée,
  // la liste est toujours là, au même endroit. Une seule liste à la fois :
  // elle se ferme d'un clic ailleurs (hors de la fiche), d'Échap (fiche
  // fermée), en touchant de nouveau le nombre, ou quand ce qu'elle montre
  // est redessiné. Tout est posé par textContent.
  let ancrePopEleves = null;
  function ouvrirPopEleves(ancre, remplir) {
    const pop = $("pop-eleves");
    if (!pop.hidden && ancrePopEleves === ancre) { fermerPopEleves(); return; }
    fermerPopEleves();
    remplir(pop);
    ancrePopEleves = ancre;
    ancre.setAttribute("aria-expanded", "true");
    pop.hidden = false;
    const r = ancre.getBoundingClientRect();
    const large = document.documentElement.clientWidth;
    const gauche = Math.max(8, Math.min(r.left, large - pop.offsetWidth - 8));
    pop.style.left = `${Math.round(gauche + window.scrollX)}px`;
    pop.style.top = `${Math.round(r.bottom + window.scrollY + 6)}px`;
  }

  function fermerPopEleves() {
    const pop = $("pop-eleves");
    if (!pop) return;
    pop.hidden = true;
    pop.textContent = "";
    if (ancrePopEleves) ancrePopEleves.setAttribute("aria-expanded", "false");
    ancrePopEleves = null;
  }

  // Ce qu'on avait touché a été redessiné, ou n'est plus à l'écran (une
  // autre appli, une autre vue) : la liste part avec.
  function garderPopEleves() {
    if (ancrePopEleves && (!ancrePopEleves.isConnected || !ancrePopEleves.getClientRects().length)) fermerPopEleves();
  }

  // Le nombre qui se touche (« 5 élèves », « Et 12 autres »).
  function boutonNombre(texte, remplir) {
    const bouton = el("button", "bouton-nombre", texte);
    bouton.type = "button";
    bouton.setAttribute("aria-expanded", "false");
    bouton.addEventListener("click", evenement => { evenement.stopPropagation(); ouvrirPopEleves(bouton, remplir); });
    return bouton;
  }

  // Un prénom qui ouvre la fiche (sur l'onglet d'où l'on vient).
  function lienFiche(eleve, onglet) {
    const bouton = el("button", "lc-lien", nomAffiche(eleve) || "sans prénom");
    bouton.type = "button";
    bouton.addEventListener("click", () => ouvrirFenetreEleve(eleve, onglet));
    return bouton;
  }

  function prenomsEnLiens(liste, onglet) {
    const p = el("p", "");
    liste.forEach((eleve, i) => { if (i) p.append(document.createTextNode(", ")); p.append(lienFiche(eleve, onglet)); });
    return p;
  }

  function dessinerQuiSentraine() {
    const bloc = $("dc-qui");
    const lignes = elevesDeLOnglet();
    const peu = $("dc-qui-peu");
    peu.textContent = "";
    peu.hidden = true;
    if (!CALCUL || !lignes.some(e => e.lu && e.lu.commence)) {
      bloc.hidden = true;
      viderZonesIds(["dc-qui-barres", "dc-qui-texte"]);
      return;
    }
    const aujourdhui = aujourdhuiSuivi();
    const lundi = lundiDuJour(aujourdhui);
    const debut = jourPlus(lundi, -21);
    const parJour = new Map();
    const cetteSemaine = new Set();
    lignes.forEach(eleve => {
      const suivi = suiviApp("defi-calcul", eleve, aujourdhui);
      (suivi ? suivi.jours : []).forEach(j => {
        parJour.set(j.jour, (parJour.get(j.jour) || 0) + 1);
        if (j.jour >= lundi) cetteSemaine.add(eleve.id);
      });
    });
    const plus = Math.max(1, lignes.length);
    const barres = $("dc-qui-barres");
    barres.textContent = "";
    for (let d = 0; d < 28; d += 1) {
      const jour = jourPlus(debut, d);
      const n = parJour.get(jour) || 0;
      const colonne = el("span", `dc-qui-jour${jour >= lundi ? " semaine" : ""}${jour > aujourdhui ? " futur" : ""}${d % 7 === 0 ? " lundi" : ""}`);
      const valeur = el("small", "", jour > aujourdhui || !n ? "" : String(n));
      const barre = el("i", "");
      barre.style.height = `${jour > aujourdhui ? 0 : Math.round((n / plus) * 100)}%`;
      const lettre = el("span", "dc-qui-lettre", "LMMJVSD"[d % 7]);
      colonne.title = `${jourEnClair(jour)} : ${pluriel(n, "élève")}`;
      colonne.append(valeur, el("span", "dc-qui-tige", ""), lettre);
      colonne.querySelector(".dc-qui-tige").append(barre);
      barres.append(colonne);
    }
    const texte = $("dc-qui-texte");
    texte.textContent = "";
    texte.append(el("b", "", `Cette semaine : ${cetteSemaine.size} élève${cetteSemaine.size > 1 ? "s" : ""} sur ${lignes.length}.`));
    // Le lundi, la semaine commence : on ne dit pas encore qui n'est pas venu.
    if (aujourdhui !== lundi) {
      const absents = ordreDeLaFeuille(lignes).filter(e => !cetteSemaine.has(e.id));
      if (absents.length) {
        texte.append(document.createTextNode(` Pas de séance cette semaine : ${absents.map(e => {
          const dernier = e.lu && e.lu.dernier;
          return `${nomAffiche(e) || "sans prénom"} (${dernier ? `dernière séance le ${jourCourtChiffres(dernier)}` : "jamais"})`;
        }).join(", ")}.`));
      }
      // Lot K2 : moins de 3 séances cette semaine (absents compris) — pas
      // le lundi non plus.
      const moins = ordreDeLaFeuille(lignes).filter(e => ((e.lu && e.lu.seances && e.lu.seances.semaine) || 0) < 3);
      if (moins.length) {
        peu.append(el("b", "", "Moins de 3 séances cette semaine : "), document.createTextNode(`${moins.map(e => nomAffiche(e) || "sans prénom").join(", ")}.`));
        peu.hidden = false;
      }
    }
    bloc.hidden = false;
  }

  // ----- Défi calcul, dans la fiche : ses séances et ses compétences en
  // petites cases (planche 3, choix A du 07/11/2026 ; aucun temps passé).

  // Les séances d'un élève dans une appli, de la plus récente à la plus
  // ancienne, autant qu'il en faut : relues dans resumeSuivi, période de 4
  // semaines par période (comme « Ce qu'il a fait », sans plafond : on saute
  // les mois sans séance) — donc jamais un temps passé.
  // {seances: [{jour, ligne}], encore}.
  function seancesDeLAppli(cle, eleve, besoin) {
    const seances = [];
    let fin = aujourdhuiSuivi();
    while (fin && seances.length <= besoin) {
      const suivi = suiviApp(cle, eleve, fin);
      if (!suivi) break;
      suivi.jours.slice().reverse().forEach(j => {
        if (j.jour >= suivi.debut && j.jour <= fin) j.lignes.slice().reverse().forEach(ligne => seances.push({jour: j.jour, ligne}));
      });
      const avant = suiviApp(cle, eleve, jourPlus(suivi.debut, -1));
      fin = avant && avant.dernier && avant.dernier < suivi.debut ? avant.dernier : null;
    }
    return {seances: seances.slice(0, besoin), encore: seances.length > besoin};
  }

  function seancesCalcul(eleve) {
    const bloc = el("div", "dc-bloc");
    const {seances, encore} = seancesDeLAppli("defi-calcul", eleve, seancesFiche);
    bloc.append(el("h3", "", "Ses séances"));
    // La borne des 60 séances atteinte : celles d'avant ne sont plus connues
    // (correctif après Codex, point 7).
    const depuis = coupureDe("defi-calcul", eleve, aujourdhuiSuivi());
    const note = depuis ? el("p", "fe-note", `Les séances d’avant le ${jourCourtChiffres(depuis)} ne sont pas connues.`) : null;
    if (!seances.length) { bloc.append(paragrapheVide(depuis ? "Aucune séance connue." : "Aucune séance finie.")); if (note) bloc.append(note); return bloc; }
    const table = el("table", "dc-seances");
    const tete = document.createElement("tr");
    ["Jour", "Calculs du jour", "Ce qui a changé"].forEach(t => tete.append(el("th", "", t)));
    const thead = document.createElement("thead");
    thead.append(tete);
    const tbody = document.createElement("tbody");
    const connu = v => typeof v === "number" && v >= 0;
    seances.forEach(({jour, ligne: s}) => {
      const tr = document.createElement("tr");
      tr.append(el("td", "", jourCourtCalcul(jour)));
      const calculs = el("td", "");
      if (connu(s.calculs) && s.calculs > 0) {
        calculs.textContent = `${connu(s.justes) ? s.justes : "?"} / ${s.calculs} juste${s.justes > 1 ? "s" : ""}`;
        if (connu(s.justes) && s.justes * 2 < s.calculs) calculs.className = "faible";
      } else calculs.textContent = connu(s.calculs) ? "aucun" : "—";
      const quoi = [];
      // Lot K2 : les mots des étoiles (la séance garde `prouvees` : les
      // étoiles gagnées à « Je tente » ; `nouveautes` : par J'apprends ;
      // `rouges` : les étoiles perdues).
      if (connu(s.prouvees) && s.prouvees > 0) quoi.push(`${s.prouvees} gagnée${s.prouvees > 1 ? "s" : ""} à « Je tente »`);
      if (connu(s.nouveautes) && s.nouveautes > 0) quoi.push(`${s.nouveautes} gagnée${s.nouveautes > 1 ? "s" : ""} par J’apprends`);
      if (connu(s.rouges) && s.rouges > 0) quoi.push(`${s.rouges} perdue${s.rouges > 1 ? "s" : ""}`);
      tr.append(calculs, el("td", "", quoi.join(" · ") || "—"));
      tbody.append(tr);
    });
    table.append(thead, tbody);
    bloc.append(table);
    if (encore) {
      const plus = el("button", "secondaire fe-plus", "Voir les séances précédentes");
      plus.type = "button";
      plus.addEventListener("click", () => { seancesFiche += 10; dessinerFenetreEleve(); });
      bloc.append(plus);
    } else if (note) bloc.append(note);
    return bloc;
  }

  // Lot S4b : la bulle d'une case de compétence, au-dessus de sa ligne
  // (position absolue : rien ne bouge). Touchée, la case reste marquée
  // jusqu'à un clic ailleurs ; survolée, la bulle part avec la souris.
  function montrerBulleCase(c, texte, touchee) {
    const ligne = c.closest(".dc-cases-ligne, .detail-monde");
    if (!ligne) return;
    if (touchee && c.classList.contains("choisie")) { cacherBulleCase(); return; }
    cacherBulleCase();
    if (touchee) c.classList.add("choisie");
    const bulle = el("span", "dc-bulle", texte);
    ligne.append(bulle);
    // Lot S4c : une étape de SPLAT! — la bulle au-dessus de SA case, dans
    // la largeur de la rangée.
    if (ligne.classList.contains("detail-monde")) {
      const large = ligne.clientWidth;
      const gauche = Math.max(0, Math.min(c.offsetLeft + c.offsetWidth / 2 - bulle.offsetWidth / 2, large - bulle.offsetWidth));
      bulle.style.left = `${Math.round(gauche)}px`;
      bulle.style.right = "auto";
      bulle.style.bottom = `${Math.round(ligne.clientHeight - c.offsetTop + 4)}px`;
    }
  }

  function cacherBulleCase() {
    document.querySelectorAll(".dc-bulle").forEach(bulle => bulle.remove());
    document.querySelectorAll(".dc-case.choisie, .et.choisie").forEach(c => c.classList.remove("choisie"));
  }

  // Lot K2 : ses étoiles étage par étage, ligne par ligne, en petites cases
  // aux couleurs et aux mots de la grille. Un étage où rien n'est fait tient
  // en une ligne.
  function etoilesEnCases(lu) {
    const fragment = document.createDocumentFragment();
    fragment.append(el("h3", "", "Ses étoiles"));
    const replies = [];
    const compte = compteEtoiles(lu);
    planCalcul().forEach(etage => {
      const c = compte.etages.find(e => e.etage === etage.etage) || {gagnees: 0, touchees: 0};
      if (!c.touchees) { replies.push(`${nomPalierCalcul(etage.etage)} (${etage.total})`); return; }
      const h4 = el("h4", "dc-palier", nomPalierCalcul(etage.etage));
      h4.append(el("small", "", ` · ${c.gagnees} gagnée${c.gagnees > 1 ? "s" : ""} sur ${etage.total}`));
      fragment.append(h4);
      const grille = el("div", "dc-cases-grille");
      etage.lignes.forEach(l => {
        const ligne = el("div", "dc-cases-ligne");
        ligne.append(el("span", "dc-cases-nom", l.nom));
        const cases = el("span", "dc-cases");
        l.cases.forEach(x => {
          const etat = etoileDe(lu, x.cle).etat;
          // La case se touche (ou se survole) : le nom de l'étoile et son état.
          const c2 = el("button", `dc-case dc-g-case ${etat}`, etat === "classe" ? "?" : "");
          c2.type = "button";
          const nom = `${nomCompetenceCalcul(x.module, x.niveau)} : ${MOTS_GRILLE[etat]}`;
          c2.setAttribute("aria-label", nom);
          c2.addEventListener("click", evenement => { evenement.stopPropagation(); montrerBulleCase(c2, nom, true); });
          c2.addEventListener("mouseenter", () => montrerBulleCase(c2, nom, false));
          c2.addEventListener("mouseleave", () => { if (!c2.classList.contains("choisie")) cacherBulleCase(); });
          cases.append(c2);
        });
        ligne.append(cases);
        grille.append(ligne);
      });
      fragment.append(grille);
    });
    if (replies.length) fragment.append(el("p", "dc-note", `Pas encore commencé : ${replies.join(", ")}.`));
    const legende = el("div", "dc-legende");
    ETATS_GRILLE.forEach(etat => {
      const morceau = el("span", "");
      morceau.append(el("i", `dc-case dc-g-case ${etat}`, etat === "classe" ? "?" : ""), document.createTextNode(MOTS_GRILLE[etat]));
      legende.append(morceau);
    });
    legende.append(el("span", "", "· toucher une case : le nom de l’étoile"));
    fragment.append(legende);
    return fragment;
  }

  // ------------------------------------------------ 📝 Les évaluations (lot E1, 15/10/2026)
  //
  // La carte « Évaluations » de l'onglet Défi tables, pour le propriétaire et
  // les collègues en écriture (mêmes droits que la question éclair). Trois
  // états : rien d'ouvert (la liste des modèles du professeur connecté),
  // ouverte (le compteur, « Fermer »), fermée (la répartition sans nom, le
  // fichier, « Terminer »). La CORRECTION se fait ici, avec le moteur de Défi
  // tables servi par ce serveur (defi_tables_core.js, copie octet pour octet
  // de celui de l'appli) : le serveur n'a que des graines et des réponses,
  // jamais une question ni une note. Tout ce qui vient du serveur est posé
  // par textContent, jamais comme du HTML.
  const DUREES_OUVERTURE = [[1800, "30 min"], [3600, "1 h"], [7200, "2 h"]];
  const TYPES_EVAL = [["direct", "7 × 8 = ?"], ["missing", "7 × ? = 56"], ["division", "56 ÷ 8 = ?"]];

  function el(balise, classe, texte) {
    const noeud = document.createElement(balise);
    if (classe) noeud.className = classe;
    if (texte !== undefined) noeud.textContent = texte;
    return noeud;
  }

  function heureLisible(epoch) {
    const date = new Date(epoch * 1000);
    return `${date.getHours()} h ${String(date.getMinutes()).padStart(2, "0")}`;
  }

  // « demain 6 h 03 », « aujourd'hui 22 h 10 », ou la date.
  function instantLisible(epoch) {
    const date = new Date(epoch * 1000);
    const jour = new Date();
    const memeJour = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const demain = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate() + 1);
    const quand = memeJour(date, jour) ? "aujourd’hui" : memeJour(date, demain) ? "demain" : date.toLocaleDateString("fr-FR");
    return `${quand} ${heureLisible(epoch)}`;
  }

  // Lot « Ma classe : réglages » : ni dans les Réglages, ni dans une classe
  // sans élève (elle commence par « Ajouter des élèves », juste dessous).
  function evalVisible() {
    return Boolean(classe) && vue === "appli" && eleves.length > 0 && appliAffichee === "defi-tables" && droitClasse !== "lecture" && Boolean(CORE)
      // Lot 4b : un onglet Défi tables ouvert pour un élève en plus n'évalue pas la classe.
      && ((classe.applis || []).includes("defi-tables"));
  }

  function arreterVeilleEvaluation() {
    window.clearTimeout(evalMinuteur);
    evalMinuteur = 0;
  }

  async function poserEvaluations() {
    arreterVeilleEvaluation();
    const bloc = $("bloc-evaluations");
    bloc.hidden = !evalVisible();
    if (bloc.hidden) return;
    messager("message-evaluations", "", "");
    try {
      if (modeles === null) modeles = (await api("evaluation.modeles")).modeles || [];
      await lireEvaluation();
    } catch (erreur) {
      if (erreur.statut === 503) modeles = modeles || [];
      surErreur(erreur, "message-evaluations");
    }
  }

  async function lireEvaluation() {
    const classeId = classe.id;
    const donnees = await api("evaluation.etat", {classe_id: classeId});
    if (!classe || classe.id !== classeId || !evalVisible()) return;
    recevoirEvaluation(donnees);
  }

  // L'état reçu (evaluation.etat, .ouvrir, .fermer) : dessiné, et relu
  // toutes les quelques secondes tant que l'évaluation est ouverte.
  function recevoirEvaluation(donnees) {
    evaluation = donnees.evaluation || null;
    evalEclair = Boolean(donnees.eclair);
    const cle = evaluation ? `${evaluation.ouvert_le}:${evaluation.fin}` : "";
    if (!evaluation || !evalContenu || evalContenu.cle !== cle) evalContenu = null;
    dessinerEvaluations();
    arreterVeilleEvaluation();
    if (evaluation && evaluation.etat === "ouverte") {
      evalMinuteur = window.setTimeout(() => lireEvaluation().catch(() => {}), donnees.rythme || 3000);
    }
  }

  function dessinerEvaluations() {
    const zone = $("evaluations-zone");
    zone.textContent = "";
    $("evaluations-plein-ecran").hidden = !(evaluation && evaluation.etat === "fermee");
    $("nouveau-modele").hidden = Boolean(evaluation);
    if (!evaluation) { dessinerModeles(zone); return; }
    const cours = el("div", "eval-cours");
    const ouverte = evaluation.etat === "ouverte";
    const etat = el("div", "etat");
    etat.append(el("span", "pastille " + (ouverte ? "p-vert" : "p-gris"), ouverte ? "● Ouverte" : "■ Fermée"),
      el("span", "modele", evaluation.nom || "Évaluation"),
      el("span", "quand", ouverte
        ? `ouverte à ${heureLisible(evaluation.ouvert_le)} · se ferme à ${heureLisible(evaluation.fin)}`
        : `${heureLisible(evaluation.ouvert_le)} → ${heureLisible(evaluation.fin)} · ${evaluation.commences} élève${evaluation.commences > 1 ? "s" : ""} sur ${evaluation.inscrits} l’${evaluation.commences > 1 ? "ont" : "a"} faite`));
    cours.appendChild(etat);
    if (ouverte) {
      const compte = el("div", "eval-compte");
      const commences = el("span", "gros", String(evaluation.commences));
      commences.appendChild(el("small", "", `/ ${evaluation.inscrits} ont commencé`));
      const finis = el("span", "gros", String(evaluation.finis));
      finis.appendChild(el("small", "", "ont fini"));
      compte.append(commences, finis);
      const actions = el("div", "actions");
      const fermer = el("button", "danger", "Fermer maintenant");
      fermer.type = "button";
      fermer.addEventListener("click", fermerEvaluation);
      actions.appendChild(fermer);
      cours.append(compte, dessinerListeEleves(), actions);
    } else {
      cours.appendChild(dessinerRepartition(false));
      const actions = el("div", "actions");
      const telecharger = el("button", "", "Télécharger les résultats");
      telecharger.type = "button";
      telecharger.addEventListener("click", telechargerEvaluation);
      const terminer = el("button", "danger", "Terminer et effacer");
      terminer.type = "button";
      terminer.addEventListener("click", terminerEvaluation);
      actions.append(telecharger, terminer);
      cours.append(actions, el("p", "eval-garde",
        `Les résultats : une ligne par élève — note sur 20, score, temps, heure de début, calculs ratés. Les réponses restent sur le serveur jusqu’à ${instantLisible(evaluation.expire_le)}, puis sont effacées ; « Terminer et effacer » les efface tout de suite.`));
      if (!evalContenu) chargerContenuEvaluation().catch(erreur => surErreur(erreur, "message-evaluations"));
    }
    zone.appendChild(cours);
  }

  // Lot E2 (planche 7) : la liste des élèves de l'évaluation ouverte — qui n'a
  // pas commencé, qui en est où, qui a fini — et « Faire repasser » pour ceux
  // qui ont commencé : le passage est effacé, l'élève recommence avec un
  // autre tirage (un camarade a pris son code, « J'ai fini » cliqué trop
  // tôt). Dépliée par défaut (choix de Gwenaël) ; l'état du pli est gardé
  // d'un redessin à l'autre.
  let evalListeRepliee = false;
  function dessinerListeEleves() {
    const bloc = el("details", "eval-liste");
    bloc.open = !evalListeRepliee;
    bloc.addEventListener("toggle", () => { evalListeRepliee = !bloc.open; });
    bloc.appendChild(el("summary", "", "Qui a commencé, qui a fini"));
    const liste = el("ul", "eval-eleves");
    const n = evaluation.modele && evaluation.modele.n ? evaluation.modele.n : 0;
    (evaluation.eleves || []).forEach(eleve => {
      const ligne = el("li", eleve.etat);
      const nom = eleve.prenom ? eleve.prenom + (eleve.initiale ? ` ${eleve.initiale}.` : "") : "(sans prénom)";
      ligne.appendChild(el("b", "", nom));
      ligne.appendChild(el("span", "e", eleve.etat === "fini" ? "a fini ✓"
        : eleve.etat === "en-cours" ? `question ${eleve.question} / ${n}`
        : eleve.etat === "close" ? `temps écoulé · ${eleve.question} / ${n}` : "pas commencé"));
      if (eleve.etat !== "rien") {
        const repasser = el("button", "secondaire", "↺ Faire repasser");
        repasser.type = "button";
        repasser.addEventListener("click", () => faireRepasser(eleve, nom));
        ligne.appendChild(repasser);
      }
      liste.appendChild(ligne);
    });
    bloc.appendChild(liste);
    return bloc;
  }

  async function faireRepasser(eleve, nom) {
    if (!await demander(`Faire repasser ${nom} ? Ses réponses sont effacées, l’évaluation lui est proposée de nouveau, avec d’autres calculs.`,
      null, {oui: "Faire repasser", danger: true})) return;
    try {
      recevoirEvaluation(await api("evaluation.repasser", {classe_id: classe.id, eleve_id: eleve.id}));
      messager("message-evaluations", `${nom} peut repasser l’évaluation.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-evaluations"); }
  }

  function dessinerModeles(zone) {
    const liste = el("ul", "eval-modeles");
    if (evalEclair) {
      // Lot 5e : un collègue ne peut pas terminer la séance (réservée à
      // l'administrateur) — on ne lui demande pas de le faire.
      zone.appendChild(el("p", "message info", directPermis
        ? "Une question éclair est en cours pour cette classe : termine la séance en direct avant d’ouvrir une évaluation."
        : "Une séance en direct est en cours pour cette classe : l’évaluation pourra s’ouvrir quand elle sera terminée."));
    }
    if (!modeles || !modeles.length) {
      liste.appendChild(el("li", "vide", "Aucun modèle pour l’instant. Un modèle, c’est les tables, les types de questions, le nombre et le chrono : tu le prépares une fois, tu l’ouvres quand tu veux."));
    }
    (modeles || []).forEach(modele => {
      const ligne = el("li");
      const texte = el("div", "texte");
      texte.append(el("b", "", modele.nom), el("span", "", CORE.descriptionEvaluation(modele.reglage) || "modèle à revoir"));
      const modifier = el("button", "secondaire", "Modifier");
      modifier.type = "button";
      modifier.addEventListener("click", () => ouvrirBoiteModele(modele));
      const ouvrir = el("button", "", `Ouvrir pour la ${classe.libelle}`);
      ouvrir.type = "button";
      ouvrir.disabled = evalEclair;
      ouvrir.addEventListener("click", () => ouvrirBoiteOuvrir(modele));
      const gestes = el("div", "gestes");
      gestes.append(modifier, ouvrir);
      ligne.append(texte, gestes);
      liste.appendChild(ligne);
    });
    zone.appendChild(liste);
  }

  // ---- la correction, dans le navigateur

  async function chargerContenuEvaluation() {
    if (!evaluation) return null;
    const cle = `${evaluation.ouvert_le}:${evaluation.fin}`;
    if (evalContenu && evalContenu.cle === cle) return evalContenu;
    const contenu = await api("evaluation.fichier", {classe_id: classe.id});
    if (!evaluation || `${evaluation.ouvert_le}:${evaluation.fin}` !== cle) return null;
    evalContenu = {cle, contenu, copies: copiesEvaluation(contenu)};
    dessinerEvaluations();
    return evalContenu;
  }

  // Chaque élève : sa série refaite avec SES graines, corrigée avec SES
  // réponses. Sans graine, il n'a pas fait l'évaluation (copie: null).
  function copiesEvaluation(contenu) {
    return (contenu.eleves || []).map(eleve => {
      if (eleve.graine === null || eleve.graine === undefined) return {eleve, copie: null};
      const questions = CORE.genererEvaluationDeClasse(contenu.modele, {seance: contenu.graine, eleve: eleve.graine});
      return {eleve, copie: CORE.corrigerEvaluationDeClasse(questions, eleve.reponses || {})};
    });
  }

  // Les quatre cases : à 20 · de 16 à 19,5 · de 10 à 15,5 · en dessous de 10.
  function repartitionEvaluation(copies) {
    const cases = [0, 0, 0, 0];
    copies.forEach(({copie}) => {
      if (!copie) return;
      if (copie.note >= 20) cases[0] += 1;
      else if (copie.note >= 16) cases[1] += 1;
      else if (copie.note >= 10) cases[2] += 1;
      else cases[3] += 1;
    });
    return cases;
  }

  function dessinerRepartition(plein) {
    const bloc = el("div", "eval-repartition");
    const cases = evalContenu ? repartitionEvaluation(evalContenu.copies) : null;
    [["à 20"], ["de 16 à 19,5"], ["de 10 à 15,5"], ["en dessous de 10"]].forEach(([libelle], index) => {
      const boite = el("div");
      boite.append(el("span", "n", cases ? String(cases[index]) : "…"), el("span", "l", libelle));
      bloc.appendChild(boite);
    });
    if (!plein) return bloc;
    return bloc;
  }

  // ---- le fichier

  // Une cellule de tableur. Un prénom qui commencerait par « = », « + », « - »
  // ou « @ » serait pris pour une formule par Excel : on le neutralise.
  function celluleCsv(valeur) {
    let texte = String(valeur === null || valeur === undefined ? "" : valeur);
    if (/^[=+\-@\t\r]/.test(texte)) texte = "'" + texte;
    return /[";\r\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
  }

  function tempsLisible(dixiemes) {
    const secondes = Math.round(dixiemes / 10);
    return `${Math.floor(secondes / 60)} min ${String(secondes % 60).padStart(2, "0")} s`;
  }

  // Une ligne par élève : prénom, note sur 20, score, temps total, heure de
  // début, le détail des ratés (« 7 × 8 = ? → 54 », « → — » sans réponse).
  // Point-virgule et marque d'ordre des octets : un Excel français l'ouvre
  // sans rien demander.
  function fabriquerFichierEvaluation(copies) {
    const lignes = [["Élève", "Note sur 20", "Score", "Temps", "Début", "Calculs ratés"]];
    copies.forEach(({eleve, copie}) => {
      const nom = eleve.prenom ? eleve.prenom + (eleve.initiale ? ` ${eleve.initiale}.` : "") : "(sans prénom)";
      if (!copie) { lignes.push([nom, "", "n’a pas fait l’évaluation", "", "", ""]); return; }
      // Lot E3 (16/10/2026) : « 7 sur 10 », pas « 7 / 10 » — Excel en
      // français prenait « 7 / 10 » pour une date (le 7 octobre).
      const score = `${copie.score} sur ${copie.total}` + (copie.repondues < copie.total ? ` (${copie.repondues} répondue${copie.repondues > 1 ? "s" : ""})` : "");
      const rates = copie.rates.map(rate => `${rate.prompt} → ${rate.donnee === null ? "—" : rate.donnee}`).join(" · ");
      lignes.push([nom, String(copie.note).replace(".", ","), score, tempsLisible(copie.dixiemes), heureLisible(eleve.debut), rates]);
    });
    return "﻿" + lignes.map(ligne => ligne.map(celluleCsv).join(";")).join("\r\n") + "\r\n";
  }

  function nomDuFichierEvaluation(contenu) {
    const propre = texte => String(texte || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const libelle = propre(contenu.classe && contenu.classe.libelle) || "classe";
    const jour = /^\d{4}-\d{2}-\d{2}$/.test(contenu.jour || "") ? contenu.jour : "";
    const sujet = propre(contenu.nom).slice(0, 40).replace(/-+$/g, "");
    return `evaluation-tables-${libelle}${jour ? "-" + jour : ""}${sujet ? "-" + sujet : ""}.csv`;
  }

  function telechargerTexte(nom, texte) {
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

  async function telechargerEvaluation() {
    try {
      const charge = await chargerContenuEvaluation();
      if (!charge) return;
      telechargerTexte(nomDuFichierEvaluation(charge.contenu), fabriquerFichierEvaluation(charge.copies));
      messager("message-evaluations", "Résultats téléchargés. Quand tu as bien le fichier, clique sur « Terminer et effacer ».", "ok");
    } catch (erreur) { surErreur(erreur, "message-evaluations"); }
  }

  // ---- les gestes

  async function fermerEvaluation() {
    if (!await demander("Fermer l’évaluation maintenant ? Les élèves qui n’ont pas fini s’arrêtent là. Leurs réponses restent : tu pourras télécharger les résultats.",
      null, {oui: "Fermer maintenant", danger: true})) return;
    try {
      recevoirEvaluation(await api("evaluation.fermer", {classe_id: classe.id}));
      messager("message-evaluations", "Évaluation fermée : plus aucune réponse n’entre.", "ok");
    } catch (erreur) { surErreur(erreur, "message-evaluations"); }
  }

  async function terminerEvaluation() {
    if (!await demander("Terminer et effacer ? Les réponses de l’évaluation sont effacées du serveur. Le fichier des résultats est le seul endroit où elles restent.",
      null, {oui: "Terminer et effacer", danger: true})) return;
    try {
      await api("evaluation.terminer", {classe_id: classe.id});
      evaluation = null;
      evalContenu = null;
      arreterVeilleEvaluation();
      dessinerEvaluations();
      messager("message-evaluations", "Évaluation terminée : il n’en reste rien sur le serveur.", "ok");
    } catch (erreur) { surErreur(erreur, "message-evaluations"); }
  }

  function ouvrirBoiteOuvrir(modele) {
    evalAOuvrir = modele;
    evalDuree = 3600;
    $("eo-titre").textContent = `Ouvrir « ${modele.nom} » pour la ${classe.libelle} ?`;
    $("eo-texte").textContent = `Les élèves de la ${classe.libelle} verront « 📝 Évaluation » dans Défi tables. Elle se ferme toute seule au bout de :`;
    dessinerDurees();
    $("eval-ouvrir").showModal();
  }

  function dessinerDurees() {
    const zone = $("eo-durees");
    zone.textContent = "";
    DUREES_OUVERTURE.forEach(([secondes, libelle]) => {
      const bouton = el("button", "", libelle);
      bouton.type = "button";
      bouton.setAttribute("aria-pressed", String(secondes === evalDuree));
      bouton.addEventListener("click", () => { evalDuree = secondes; dessinerDurees(); });
      zone.appendChild(bouton);
    });
  }

  $("eo-annuler").addEventListener("click", () => $("eval-ouvrir").close());
  $("eo-ouvrir").addEventListener("click", async () => {
    const modele = evalAOuvrir;
    $("eval-ouvrir").close();
    if (!modele || !classe) return;
    try {
      recevoirEvaluation(await api("evaluation.ouvrir", {classe_id: classe.id, modele_id: modele.id, duree: evalDuree}));
      messager("message-evaluations", `Évaluation ouverte pour la ${classe.libelle}.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-evaluations"); }
  });

  // ---- la boîte d'un modèle

  function ouvrirBoiteModele(modele) {
    const reglage = modele ? CORE.normaliserReglageEvaluation(modele.reglage) || {} : {};
    evalModele = {id: modele ? modele.id : null, exclus: new Set(reglage.exclus || []), imposes: new Set(reglage.imposes || [])};
    $("em-titre").textContent = modele ? "Modifier le modèle" : "Nouveau modèle";
    $("em-nom").value = modele ? modele.nom : "";
    $("em-supprimer").hidden = !modele;
    messager("em-message", "", "erreur");
    dessinerCases("em-tables", CORE.ALL_TABLES.map(table => [table, String(table)]), reglage.tables || [2, 3, 4, 5, 6, 7, 8, 9], dessinerGrille);
    dessinerCases("em-types", TYPES_EVAL, reglage.types || ["direct", "missing", "division"], null);
    $("em-n").value = String(reglage.n || 20);
    if (![...$("em-n").options].some(option => option.value === $("em-n").value)) $("em-n").value = "20";
    const chrono = reglage.chrono || "question";
    document.querySelector(`input[name="em-chrono"][value="${chrono}"]`).checked = true;
    $("em-secondes").value = String(chrono === "question" && reglage.secondes ? reglage.secondes : 8);
    $("em-minutes").value = String(chrono === "global" && reglage.secondes ? Math.round(reglage.secondes / 60) : 3);
    document.querySelector(`input[name="em-tirage"][value="${reglage.tirage || "memes"}"]`).checked = true;
    $("em-calculs").open = evalModele.exclus.size > 0 || evalModele.imposes.size > 0;
    dessinerGrille();
    $("eval-modele").showModal();
  }

  // Une rangée de cases (tables, types) : des boutons enfoncés ou non.
  function dessinerCases(id, valeurs, cochees, apresClic) {
    const zone = $(id);
    zone.textContent = "";
    valeurs.forEach(([valeur, libelle]) => {
      const bouton = el("button", "", libelle);
      bouton.type = "button";
      bouton.dataset.valeur = String(valeur);
      bouton.setAttribute("aria-pressed", String(cochees.map(String).includes(String(valeur))));
      bouton.addEventListener("click", () => {
        bouton.setAttribute("aria-pressed", String(bouton.getAttribute("aria-pressed") !== "true"));
        if (apresClic) apresClic();
      });
      zone.appendChild(bouton);
    });
  }

  function casesCochees(id) {
    return [...$(id).querySelectorAll('button[aria-pressed="true"]')].map(bouton => bouton.dataset.valeur);
  }

  // La grille des calculs des tables cochées : une ligne par table, ×1 à ×10,
  // chaque calcul une fois (7 × 8 est sur la ligne ×7). Un clic : exclu ;
  // deux : imposé ; trois : normal.
  function dessinerGrille() {
    const zone = $("em-grille");
    zone.textContent = "";
    const tables = casesCochees("em-tables").map(Number);
    const vus = new Set();
    tables.forEach(table => {
      const ligne = el("div", "table");
      ligne.appendChild(el("b", "", `×${table}`));
      CORE.ALL_TABLES.forEach(multiplier => {
        const cle = `${Math.min(table, multiplier)}-${Math.max(table, multiplier)}`;
        if (vus.has(cle)) return;
        vus.add(cle);
        const bouton = el("button", evalModele.exclus.has(cle) ? "exclu" : evalModele.imposes.has(cle) ? "impose" : "", `${table}×${multiplier}`);
        bouton.type = "button";
        bouton.addEventListener("click", () => {
          if (evalModele.exclus.has(cle)) { evalModele.exclus.delete(cle); evalModele.imposes.add(cle); }
          else if (evalModele.imposes.has(cle)) { evalModele.imposes.delete(cle); }
          else { evalModele.exclus.add(cle); }
          bouton.className = evalModele.exclus.has(cle) ? "exclu" : evalModele.imposes.has(cle) ? "impose" : "";
        });
        ligne.appendChild(bouton);
      });
      zone.appendChild(ligne);
    });
    // Un calcul d'une table décochée ne compte plus.
    [...evalModele.exclus, ...evalModele.imposes].forEach(cle => {
      if (!vus.has(cle)) { evalModele.exclus.delete(cle); evalModele.imposes.delete(cle); }
    });
  }

  function lireBoiteModele() {
    const chrono = document.querySelector('input[name="em-chrono"]:checked').value;
    const secondes = chrono === "question" ? Number($("em-secondes").value)
      : chrono === "global" ? Math.round(Number($("em-minutes").value) * 60) : null;
    return {
      nom: $("em-nom").value.trim(),
      reglage: {
        tables: casesCochees("em-tables").map(Number),
        types: casesCochees("em-types"),
        n: Number($("em-n").value),
        chrono,
        secondes,
        tirage: document.querySelector('input[name="em-tirage"]:checked').value,
        exclus: [...evalModele.exclus],
        imposes: [...evalModele.imposes]
      }
    };
  }

  $("nouveau-modele").addEventListener("click", () => ouvrirBoiteModele(null));
  $("em-annuler").addEventListener("click", () => $("eval-modele").close());
  $("em-enregistrer").addEventListener("click", async () => {
    const lu = lireBoiteModele();
    const verifie = CORE.verifierReglageEvaluation(lu.reglage);
    if (!lu.nom) { messager("em-message", "Donne un nom au modèle.", "erreur"); return; }
    if (verifie.erreur) { messager("em-message", verifie.erreur, "erreur"); return; }
    try {
      const donnees = await api("evaluation.enregistrer_modele", {id: evalModele.id, nom: lu.nom, reglage: verifie.reglage});
      modeles = donnees.modeles || [];
      $("eval-modele").close();
      dessinerEvaluations();
      messager("message-evaluations", "Modèle enregistré.", "ok");
    } catch (erreur) { messager("em-message", erreur.message, "erreur"); }
  });
  $("em-supprimer").addEventListener("click", async () => {
    if (!evalModele || evalModele.id === null) return;
    $("eval-modele").close();
    if (!await demander(`Supprimer le modèle « ${$("em-nom").value.trim() || "sans nom"} » ?`,
      null, {oui: "Supprimer ce modèle", danger: true})) return;
    try {
      modeles = (await api("evaluation.supprimer_modele", {id: evalModele.id})).modeles || [];
      dessinerEvaluations();
      messager("message-evaluations", "Modèle supprimé.", "ok");
    } catch (erreur) { surErreur(erreur, "message-evaluations"); }
  });

  // ---- le plein écran, à projeter : la répartition, et personne de nommé

  function ouvrirEvaluationPleinEcran() {
    if (!evaluation || !evalContenu) return;
    const plein = el("div", "eval-plein");
    plein.id = "evaluation-plein";
    plein.setAttribute("role", "dialog");
    plein.setAttribute("aria-label", "Répartition de l’évaluation");
    const fermer = el("button", "secondaire fermer", "Fermer");
    fermer.type = "button";
    const titre = el("h1", "", `📝 ${evaluation.nom || "Évaluation"} — ${classe.libelle}`);
    const cases = repartitionEvaluation(evalContenu.copies);
    plein.append(fermer, titre, dessinerRepartition(true),
      el("p", "", cases[0] > 0 ? `${cases[0]} élève${cases[0] > 1 ? "s ont" : " a"} tout juste 👏` : ""));
    const surEchap = event => { if (event.key === "Escape") quitter(); };
    const quitter = () => { plein.remove(); document.removeEventListener("keydown", surEchap); $("evaluations-plein-ecran").focus(); };
    fermer.addEventListener("click", quitter);
    document.addEventListener("keydown", surEchap);
    document.body.appendChild(plein);
    fermer.focus();
  }
  $("evaluations-plein-ecran").addEventListener("click", ouvrirEvaluationPleinEcran);

  // ------------------------------------------------------ 🏆 Les records (lot du 09/10/2026)

  // La ligue du professeur connecté (records.ligue) : ses classes, les deux
  // top 10. Lue à l'ouverture d'une classe Défi tables dont il est propriétaire ;
  // la carte ne se montre que s'il y a au moins un temps.
  let ligueRecords = null;

  function formatTempsRecord(temps) {
    return PARCOURS && PARCOURS.formatTemps ? PARCOURS.formatTemps(temps) : `${(temps / 10).toFixed(1)} s`;
  }

  // retirable (lot « après l'audit GPT », D4) : dans la carte, chaque ligne a
  // son « Retirer » ; pas dans le plein écran, qui se projette.
  function ligneDeRecord(ligne, retirable = false) {
    const item = document.createElement("li");
    const rang = document.createElement("span");
    rang.className = "rg";
    rang.textContent = ["🥇", "🥈", "🥉"][ligne.rang - 1] || String(ligne.rang);
    const nom = document.createElement("span");
    nom.className = "nom";
    nom.textContent = ligne.nom;
    // Lot « qui est Mystère » (25/10/2026, demande de Gwenaël) : dans la carte
    // (retirable), le professeur voit qui est derrière « Mystère » —
    // « Mystère (Léa · 405) ». Le serveur rend déjà « eleve » au seul
    // professeur (records.ligue, D4) ; le plein écran, qu'on projette, et
    // l'appli des élèves gardent « Mystère » seul.
    if (retirable && ligne.eleve && ligne.nom === "Mystère") {
      const qui = document.createElement("span");
      qui.className = "rec-qui";
      qui.textContent = ligne.eleve.prenom === "Élève" ? `(${ligne.eleve.classe})` : `(${ligne.eleve.prenom} · ${ligne.eleve.classe})`;
      nom.classList.add("avec-qui");
      nom.append(" ", qui);
    }
    const temps = document.createElement("span");
    temps.className = "tps";
    temps.textContent = formatTempsRecord(ligne.temps);
    item.append(rang, nom, temps);
    if (retirable && ligne.eleve) {
      const retirer = document.createElement("button");
      retirer.type = "button";
      retirer.className = "rec-retirer";
      retirer.textContent = "Retirer";
      retirer.title = "Retirer ce temps";
      retirer.setAttribute("aria-label", `Retirer ce temps : ${ligne.eleve.prenom}, ${ligne.eleve.classe}, ${temps.textContent}`);
      retirer.addEventListener("click", () => retirerTemps(ligne));
      item.append(retirer);
    }
    return item;
  }

  // « Retirer ce temps » (décision de Gwenaël, 14/10/2026) : un temps qu'un
  // élève n'a pas couru (requête forgée) s'efface d'ici — son record et son
  // temps de la semaine ; son choix de nom reste, sa prochaine course compte.
  // Le serveur n'accepte que le propriétaire de la classe de l'élève.
  async function retirerTemps(ligne) {
    const qui = `${ligne.eleve.prenom} · ${ligne.eleve.classe}`;
    const reponse = await demander(`Retirer le temps ${deNom(qui)} (${formatTempsRecord(ligne.temps)}) ? Son record et son temps de la semaine s’effacent. Sa prochaine course compte à nouveau.`,
      null, {oui: "Retirer ce temps", danger: true});
    if (!reponse) return;
    try {
      const donnees = await api("records.retirer", {eleve_id: ligne.eleve.id});
      ligueRecords = donnees;
      dessinerRecords();
      messager("message-records", `Le temps ${deNom(qui)} est retiré.`, "ok");
      // Le tableau de la classe montre ce temps à côté de la couronne : relu.
      if (classe) await ouvrirClasse(classe.id);
    } catch (erreur) {
      messager("message-records", erreur.message, "erreur");
    }
  }

  function dessinerRecords() {
    const bloc = $("bloc-records");
    const visible = Boolean(ligueRecords) && appliAffichee === "defi-tables" && droitClasse === "proprietaire"
      && ((ligueRecords.toujours || []).length > 0);
    bloc.hidden = !visible;
    if (!visible) return;
    ["semaine", "toujours"].forEach(cle => {
      const liste = $(`records-${cle}`);
      liste.textContent = "";
      (ligueRecords[cle] || []).forEach(ligne => liste.append(ligneDeRecord(ligne, true)));
    });
    $("records-semaine-vide").hidden = (ligueRecords.semaine || []).length > 0;
  }

  async function chargerRecords() {
    ligueRecords = null;
    if (droitClasse !== "proprietaire" || appliAffichee !== "defi-tables" || vue !== "appli") { dessinerRecords(); return; }
    try {
      ligueRecords = await api("records.ligue");
    } catch (erreur) {
      // Serveur pas encore mis à niveau (503) ou panne : pas de carte, sans bruit.
      ligueRecords = null;
    }
    dessinerRecords();
  }

  // Le plein écran : le même tableau, en grand, pour le projeter (planche R5).
  function ouvrirRecordsPleinEcran() {
    if (!ligueRecords) return;
    const plein = document.createElement("div");
    plein.className = "rec-plein";
    plein.id = "records-plein";
    plein.setAttribute("role", "dialog");
    plein.setAttribute("aria-label", "Les records");
    const fermer = document.createElement("button");
    fermer.type = "button";
    fermer.className = "secondaire fermer";
    fermer.textContent = "✕ Fermer";
    const titre = document.createElement("h1");
    titre.textContent = "🏆 Les records";
    const deux = document.createElement("div");
    deux.className = "rec-deux";
    [["Cette semaine", "semaine"], ["De tous les temps", "toujours"]].forEach(([nom, cle]) => {
      const colonne = document.createElement("div");
      const h3 = document.createElement("h3");
      h3.textContent = nom;
      const liste = document.createElement("ol");
      liste.className = "rec-liste";
      (ligueRecords[cle] || []).forEach(ligne => liste.append(ligneDeRecord(ligne)));
      colonne.append(h3, liste);
      deux.append(colonne);
    });
    plein.append(fermer, titre, deux);
    const quitter = () => { plein.remove(); document.removeEventListener("keydown", surEchap); $("records-plein-ecran").focus(); };
    const surEchap = evenement => { if (evenement.key === "Escape") quitter(); };
    fermer.addEventListener("click", quitter);
    document.addEventListener("keydown", surEchap);
    document.body.append(plein);
    fermer.focus();
  }

  // La case « Les records » de la classe (réglage « defi-tables.records »,
  // vrai par défaut) : décochée, les Légendes de la classe gardent l'escalier.
  function recordsOuvertsPourLaClasse() {
    const reglages = classe && classe.reglages;
    return !(reglages && reglages["defi-tables"] && reglages["defi-tables"].records === false);
  }

  // ------------------------------------------------- droits sur la classe ouverte

  function appliquerDroits() {
    const proprietaire = droitClasse === "proprietaire";
    const ecriture = droitClasse !== "lecture";
    // Mener une séance en direct, c'est recevoir les réponses avec les
    // prénoms : pas en lecture seule (même règle que le serveur). Lot 5e :
    // et seulement si le serveur l'ouvre à ce compte (l'administrateur pour
    // l'instant).
    $("seance-direct").hidden = !ecriture || !directPermis;
    // Une séance restée ouverte se reprend d'ici (17/10/2026).
    $("seance-direct").textContent = "";
    if (classe && classe.direct === "eclair") {
      const point = document.createElement("span");
      point.className = "point";
      point.textContent = "● ";
      $("seance-direct").append(point, "Reprendre la séance en direct");
    } else {
      $("seance-direct").textContent = "Séance en direct";
    }
    $("ajouter").hidden = !ecriture;
    $("coller-prenoms").hidden = !ecriture;
    $("imprimer-bandelettes").hidden = !ecriture;
    $("imprimer-recap").hidden = !ecriture;
    $("onglet-eleves").hidden = !ecriture;
    $("onglet-reglages").hidden = !proprietaire;
    messager("message-partage", "", "");
    if (proprietaire) {
      messager("bandeau-droit", "", "");
      chargerPartages();
    } else {
      // Lot « Ma classe : réglages » (« j'ai pas trop compris », Gwenaël) : à
      // qui est la classe, avec les mots du partage (« voir et modifier »,
      // « voir seulement »), ce que le collègue peut faire et ce qui reste au
      // propriétaire. La page ne montre que les boutons auxquels il a droit.
      const connue = classes.find(uneClasse => uneClasse.id === (classe && classe.id));
      const qui = (connue && connue.proprietaire) || "un collègue";
      messager("bandeau-droit", ecriture
        ? `Classe ${deNom(qui)}, partagée avec toi (voir et modifier) : dans l’onglet Élèves, tu ajoutes des élèves, saisis les prénoms et donnes un nouveau code ; tu reviens aussi à une version précédente. Supprimer un élève ou la classe reste à ${qui}.`
        : `Classe ${deNom(qui)}, partagée avec toi (voir seulement) : tu vois la progression, sans les codes des élèves, et tu ne modifies rien.`, "info");
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
        changer.className = "secondaire";
        changer.textContent = partage.droit === "ecriture" ? "Passer en lecture" : "Autoriser à modifier";
        changer.addEventListener("click", () => demanderPuisPartager(partage,
          partage.droit === "ecriture" ? "lecture" : "ecriture"));
        const retirer = document.createElement("button");
        retirer.type = "button";
        retirer.className = "danger";
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
      + " et il pourra ajouter des élèves, saisir les prénoms, donner de nouveaux codes et restaurer"
      + " une version précédente. Il ne pourra ni supprimer un élève, ni renommer ou supprimer la classe.";
  }

  async function demanderPuisPartager(partage, droit) {
    const question = texteConfirmationPartage(partage.identifiant, droit, eleves.length);
    if (question && !await demander(question, null, {oui: "Autoriser"})) return;
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
    const reponse = await demander(`Retirer ${partage.identifiant} de cette classe ? Il ne la verra plus.`,
      null, {oui: "Retirer le partage", danger: true});
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
        estAdmin ? "Aucun autre professeur pour l’instant : crée d’abord son compte dans « Mon compte », partie Professeurs."
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
    ], {oui: "Partager"});
    if (!reponse) return;
    const droit = reponse.droit === "ecriture" ? "ecriture" : "lecture";
    const choisi = annuaire.find(prof => String(prof.id) === String(reponse.prof));
    const question = texteConfirmationPartage(choisi ? choisi.identifiant : "ce collègue", droit, eleves.length);
    if (question && !await demander(question, null, {oui: "Autoriser"})) return;
    partager(parseInt(reponse.prof, 10), droit);
  });

  // ------------------------------------------------------------- comptes professeurs

  async function chargerProfs() {
    // Correctif des lots 5 (point 1) : la liste demandée avant « Se
    // déconnecter », ou avant une lecture plus récente (après un geste sur un
    // collègue), n'est plus posée dans la page.
    const numero = ++demandeProfs;
    const depart = generation;
    const aJour = () => numero === demandeProfs && depart === generation && Boolean(jeton);
    const liste = $("liste-profs");
    liste.textContent = "";
    try {
      const donnees = await api("profs.liste");
      if (!aJour()) return;
      // Lot 5d : son propre compte en premier, les collègues ensuite.
      const profs = (donnees.profs || []).slice()
        .sort((a, b) => Number(b.identifiant === identifiant) - Number(a.identifiant === identifiant));
      profs.forEach(prof => {
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
        // Lot 5d : une ligne par professeur — qui il est à gauche, ses gestes
        // derrière « ⋯ » à droite (le menu de l'onglet Élèves, menuGestes).
        // Avant : trois boutons de 44 px, dont deux rouges, qui passaient à
        // la ligne dans une carte de 520 px.
        const quiProf = document.createElement("span");
        quiProf.className = "qui-prof";
        quiProf.append(nom, role);
        li.append(quiProf);
        if (prof.identifiant !== identifiant) {
          // Sur les autres comptes seulement : on ne se réinitialise pas, on ne
          // se désactive pas soi-même (le serveur le refuse aussi).
          menuGestes(li, [
            boutonGeste("Nouveau mot de passe", "secondaire", () => reinitialiserProf(prof),
              "Lui donner un mot de passe temporaire, qu'il devra changer"),
            prof.actif === false
              ? boutonGeste("Réactiver", "secondaire", () => reactiverProf(prof))
              : boutonGeste("Désactiver", "secondaire", () => desactiverProf(prof),
                "Il ne pourra plus se connecter ; ses classes sont gardées"),
            boutonGeste("Supprimer", "danger", () => supprimerProf(prof),
              prof.classes ? "Supprimer le compte et ses classes" : "Supprimer le compte")
          ]);
        }
        if (prof.actif === false) li.classList.add("eteint");
        liste.appendChild(li);
      });
    } catch (erreur) { if (aJour()) surErreur(erreur, "message-profs"); }
  }

  async function reinitialiserProf(prof) {
    const reponse = await demander(
      `Donner un nouveau mot de passe à ${prof.identifiant} ? Ses sessions ouvertes seront fermées. Tu lui transmets le mot de passe temporaire de vive voix ; il devra en choisir un nouveau à sa prochaine connexion.`,
      null, {oui: "Donner un nouveau mot de passe"});
    if (!reponse) return;
    try {
      const donnees = await api("profs.reinitialiser", {prof_id: prof.id});
      await chargerProfs();
      // Affiché une seule fois, DANS UNE BOÎTE que l'on referme : le serveur ne
      // le garde que haché, et il n'a pas à rester en clair dans la page.
      messager("message-profs", `Nouveau mot de passe temporaire pour ${prof.identifiant}.`, "ok");
      montrerSecret(`Mot de passe temporaire ${deNom(prof.identifiant)}, à lui transmettre de vive voix :`,
        donnees.motdepasse);
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  }

  async function desactiverProf(prof) {
    const reponse = await demander(
      `Désactiver le compte ${deNom(prof.identifiant)} ? Il ne pourra plus se connecter. Ses classes, ses élèves et leurs progressions sont conservés ; tu pourras le réactiver.`,
      null, {oui: "Désactiver le compte", danger: true});
    if (!reponse) return;
    try {
      await api("profs.desactiver", {prof_id: prof.id});
      await chargerProfs();
      messager("message-profs", `Compte ${deNom(prof.identifiant)} désactivé.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  }

  async function reactiverProf(prof) {
    try {
      await api("profs.reactiver", {prof_id: prof.id});
      await chargerProfs();
      messager("message-profs", `Compte ${deNom(prof.identifiant)} réactivé : il peut se reconnecter avec son mot de passe.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  }

  $("ajouter-prof").addEventListener("click", async () => {
    // Pas de mot de passe à choisir : le serveur en tire un temporaire, affiché
    // une fois, que le collègue remplace à sa première connexion. Personne
    // d'autre que lui ne connaît son vrai mot de passe.
    const reponse = await demander(
      "Nouveau professeur. Choisis-lui un identifiant ; tu recevras un mot de passe temporaire à lui transmettre de vive voix, qu'il changera à sa première connexion.",
      [{nom: "identifiant", libelle: "Identifiant", maxlength: 40}], {oui: "Créer le compte"});
    if (!reponse) return;
    try {
      const donnees = await api("profs.ajouter", {identifiant: reponse.identifiant});
      await chargerProfs();
      messager("message-profs",
        `Compte créé pour ${reponse.identifiant.trim()}. Il ne verra aucune classe tant que tu ne lui en auras pas partagé une.`,
        "ok");
      montrerSecret(`Mot de passe temporaire ${deNom(reponse.identifiant.trim())}, à lui transmettre de vive voix :`,
        donnees.motdepasse);
    } catch (erreur) { surErreur(erreur, "message-profs"); }
  });

  async function supprimerProf(prof) {
    // Un compte qui possède des classes : on dit ce qui part avec, et on
    // propose l'autre voie (désactiver garde tout).
    const classes = prof.classes > 1 ? `ses ${prof.classes} classes` : "sa classe";
    const eleves = `${prof.eleves} élève${prof.eleves > 1 ? "s" : ""}`;
    const question = prof.classes
      ? `Supprimer le compte ${deNom(prof.identifiant)} ET ${classes} (${eleves}, avec leurs codes et leurs progressions) ? Cette action est définitive. Pour garder ${prof.classes > 1 ? "ses classes" : "sa classe"}, désactive plutôt le compte.`
      : `Supprimer le compte ${deNom(prof.identifiant)} ? Cette action est définitive.`;
    const reponse = await demander(question, null, {oui: "Supprimer le compte", danger: true});
    if (!reponse) return;
    try {
      await api("profs.supprimer", {prof_id: prof.id, avec_classes: Boolean(prof.classes)});
      await chargerProfs();
      messager("message-profs", `Compte ${deNom(prof.identifiant)} supprimé.`, "ok");
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
      reporterEleve(eleve);
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
  // sous les champs et recalculée à chaque frappe : ce que le bouton va faire,
  // montré AVANT qu'on le fasse.
  //
  // options.oui : le VERBE du geste sur le bouton (« Supprimer cet élève »,
  // « Restaurer cette version »…) ; options.danger : le bouton en rouge, comme
  // la commande qui a ouvert la fenêtre. Lot « textes justes » (24/10/2026) :
  // avant, toutes les fenêtres disaient « Confirmer ». Un test vérifie que
  // chaque appel nomme son geste.
  function demander(texte, champs, options) {
    return new Promise(resolve => {
      $("boite-texte").textContent = texte;
      // Lot K2 : une explication sous la question, en texte normal.
      if (options && options.detail) $("boite-texte").append(el("span", "boite-detail", options.detail));
      const oui = $("boite-oui");
      oui.textContent = (options && options.oui) || "Confirmer";
      oui.className = options && options.danger ? "danger" : "";
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
          if (champ.placeholder) entree.placeholder = champ.placeholder;
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
        // Lot S2, correctif après Codex (point 1) : la question posée
        // (« Supprimer … et toute sa progression ? », avec son prénom) et ses champs
        // quittent le document avec la boîte — plus aucun prénom caché.
        $("boite-texte").textContent = "";
        zone.textContent = "";
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
    // Lot « retours de classe » (06/10/2026, décision de Gwenaël) : 25 pour
    // une classe vide (on crée la classe entière), 1 pour une classe qui a
    // déjà ses élèves (on ajoute un élève arrivé en cours d'année).
    const reponse = await demander("Combien d’élèves ajouter à cette classe ?",
      [{nom: "nombre", libelle: "Nombre d’élèves", type: "number", valeur: eleves.length ? "1" : "25", min: 1, max: 60}],
      {oui: "Ajouter"});
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
      lignes.push({texte: `${trop > 1 ? `${trop} prénoms` : "1 prénom"} en trop (${prenoms.slice(sansNom.length).join(", ")}) : ajoute des élèves ou enlève-les.`, classe: "alerte"});
    } else if (prenoms.length < sansNom.length) {
      const reste = sansNom.length - prenoms.length;
      lignes.push({texte: `${reste > 1 ? `${reste} codes restent` : "1 code reste"} sans prénom.`, classe: "vide"});
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
        messager("message-classe", "Tous les élèves de cette classe ont déjà un prénom. Pour en changer un, écris directement dans la liste.", "erreur");
        return;
      }
      const reponse = await demander(
        `Colle les prénoms, un par ligne, dans l’ordre de la feuille imprimée (numéros 1, 2, 3…). Ils iront ${sansNom.length > 1 ? `aux ${sansNom.length} élèves qui n’ont` : "à l’élève qui n’a"} pas encore de nom. Vérifie l’aperçu avant d’enregistrer.`,
        [{nom: "liste", libelle: "Un prénom par ligne (tu peux ajouter l’initiale : « Léa B »)", multiligne: true}],
        {apercu: valeurs => apercuCollage(decouperPrenoms(valeurs.liste), sansNom), oui: "Enregistrer les prénoms"});
      if (!reponse) return;
      const prenoms = decouperPrenoms(reponse.liste);
      if (!prenoms.length) {
        messager("message-classe", "Aucun prénom trouvé dans ce que tu as collé.", "erreur");
        return;
      }
      if (prenoms.length > sansNom.length) {
        messager("message-classe",
          `Tu as collé ${prenoms.length} prénoms pour ${sansNom.length} élève${sansNom.length > 1 ? "s" : ""} sans nom. Ajoute d’abord des élèves, ou enlève les prénoms en trop.`,
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
        `${prenoms.length > 1 ? `${prenoms.length} prénoms enregistrés` : "1 prénom enregistré"}. Vérifie-les dans la liste, puis imprime les bandelettes (à distribuer) et la feuille prénom ↔ code (à garder).`,
        "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
    finally { bouton.disabled = false; }
  });

  // « Voir son parcours » (lot 3, « Voir sa fiche » à l'époque) : un billet
  // de lecture, à usage unique, valable deux minutes, glissé dans l'adresse
  // de l'appli à la place du code — le code n'entre plus dans l'historique de
  // ce navigateur. L'onglet est ouvert AVANT d'attendre le serveur (les
  // navigateurs ne laissent ouvrir une fenêtre que dans le geste du clic),
  // puis dirigé vers le parcours. L'adresse reste « #b=…&vue=fiche » : le site
  // et cette page se mettent à jour dans n'importe quel ordre. Lot 5f : c'est
  // « Ouvrir dans un onglet », sous le prénom dans la fenêtre de Défi tables
  // (montrerParcours y montre le même parcours, dans la fenêtre).
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
      // Correctif des lots 5 (point 5) : la fenêtre de l'élève est encore
      // ouverte — le message s'y lit (avant, dans le tableau, derrière elle).
      const texte = `Le parcours ${deNom(nomAffiche(eleve) || "cet élève")} n’a pas pu s’ouvrir. ${raisonDe(erreur)}`;
      if ($("fenetre-eleve").open && erreur.statut !== 401) {
        messager("fe-message", texte, "erreur");
        // Au téléphone, la fenêtre défile : le message vient sous les yeux.
        try { $("fe-message").scrollIntoView({block: "nearest"}); } catch (_) {}
      } else if (erreur.statut !== 401 && zoneVisible("message-appli")) {
        // La fenêtre a été fermée pendant l'attente du billet — le message
        // au-dessus du tableau, et la page y remonte s'il est hors de
        // l'écran (lot 5f).
        messager("message-appli", texte, "erreur");
        try { $("message-appli").scrollIntoView({block: "nearest"}); } catch (_) {}
      } else {
        surErreur(erreur, "message-appli");
      }
    } finally {
      if (bouton) bouton.disabled = false;
    }
  }

  async function regenerer(eleve) {
    const reponse = await demander(
      `Donner un nouveau code à ${nomAffiche(eleve) || "cet élève"} ? L’ancien (${eleve.code}) ne marchera plus. La progression est conservée.`,
      null, {oui: "Donner un nouveau code"});
    if (!reponse) return;
    try {
      const donnees = await api("eleves.regenerer", {eleve_id: eleve.id});
      eleve.code = donnees.code;
      reporterEleve(eleve);
      redessin.demander();
      // Les élèves sans prénom sont rangés par code : un seul code nouveau peut
      // décaler les numéros de toute la feuille. On le dit, au lieu de laisser
      // une feuille imprimée cinq minutes plus tôt devenir fausse en silence.
      messager("message-classe",
        `Nouveau code : ${donnees.code}. Imprime sa bandelette (menu ⋯) — et, si des élèves n’ont pas encore de prénom, les numéros ont pu changer : réimprime la feuille prénom ↔ code.`,
        "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  }

  // « Revenir à… » : la version d'avant le dernier enregistrement, ou la fin
  // de l'une des sept journées gardées par le serveur. Deux boîtes : on
  // choisit, PUIS on confirme en nommant la date choisie — revenir en arrière
  // écrase le travail actuel, cela ne se fait pas d'un seul clic.
  function versionsProposees(eleve) {
    const options = [];
    // (Lot K2, correctif : l'état gardé par « Recommencer à zéro » vient en
    // premier — c'est lui qu'on cherche après une remise à zéro par erreur.)
    const unite = (APPLIS.find(appli => appli.cle === appliAffichee) || APPLIS[0]).unite;
    const libelleJournee = journee => `${journee.remise ? "avant la remise à zéro" : "fin de journée"} du ${jourLisible(journee.jour)} — ${journee.calculs}\u00a0`
      + (journee.calculs > 1 ? unite[1] : unite[0]);
    (eleve.journees || []).filter(journee => journee.remise).forEach(journee => {
      options.push({valeur: journee.jour, libelle: libelleJournee(journee)});
    });
    if (eleve.restaurable) {
      const quand = dateLisible(eleve.maj_le);
      options.push({valeur: "avant",
        libelle: "avant le dernier enregistrement" + (quand ? ` (du ${quand})` : "")});
    }
    // Le compteur de l'activité affichée : « 12 calculs » pour Défi tables,
    // « 13 étapes » pour SPLAT! (le serveur compte ce que lib/applis.php lui dit).
    (eleve.journees || []).filter(journee => !journee.remise).forEach(journee => {
      options.push({valeur: journee.jour, libelle: libelleJournee(journee)});
    });
    return options;
  }

  async function revenirA(eleve) {
    const options = versionsProposees(eleve);
    if (!options.length) {
      messager("message-appli", "Aucune version à restaurer pour cet élève.", "info");
      return;
    }
    const choix = await demander(
      `À quelle version revenir pour ${nomAffiche(eleve) || "cet élève"} ? Le serveur garde la fin de chacune des sept dernières journées.`,
      [{nom: "version", libelle: "Revenir à", options}], {oui: "Suivant"});
    if (!choix) return;
    const choisie = options.find(option => option.valeur === choix.version);
    if (!choisie) return;
    const reponse = await demander(
      `Revenir à « ${choisie.libelle} » pour ${nomAffiche(eleve) || "cet élève"} ? `
      + `La version actuelle devient la « précédente » : tu pourras refaire l’inverse.`,
      null, {oui: "Restaurer cette version"});
    if (!reponse) return;
    try {
      const corps = {eleve_id: eleve.id, appli: appliAffichee};
      if (choix.version !== "avant") corps.jour = choix.version;
      await api("eleves.restaurer", corps);
      await ouvrirClasse(classe.id);
      // Lot serveur B : ce n'est plus seulement « elle la récupérera », c'est
      // « elle l'adoptera ». Depuis que la restauration repose une époque plus
      // haute, un appareil resté ouvert sur l'ancien état ne le rend plus —
      // il se range. La phrase le dit, parce que c'est la question que
      // Gwenaël s'est posée devant l'écran le 06/09.
      messager("message-appli",
        `Version restaurée : ${choisie.libelle}. L’appareil de l’élève adoptera cette version à sa prochaine connexion.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-appli"); }
  }

  // Lot K2 de Défi calcul : « Recommencer Défi calcul à zéro » (le « ⋯ »
  // de la ligne, finirLigne). Le serveur construit le parcours neuf
  // (eleves.recommencer) : la page n'envoie rien d'autre que l'élève et
  // l'appli.
  async function recommencerCalcul(eleve) {
    const nom = nomAffiche(eleve);
    const reponse = await demander(
      `Recommencer Défi calcul à zéro pour ${nom || "l’élève"} ?`, null,
      {oui: `Recommencer à zéro pour ${nom || "l’élève"}`, danger: true,
       detail: "Ses étoiles, sa ceinture et ses séances repartent de zéro, sur tous ses appareils. Pendant 7\u00a0jours, «\u00a0Revenir à…\u00a0» (dans le même menu «\u00a0⋯\u00a0») permet de faire marche arrière."});
    if (!reponse) return;
    try {
      await api("eleves.recommencer", {eleve_id: eleve.id, appli: "defi-calcul"});
      await ouvrirClasse(classe.id);
      messager("message-appli",
        `Défi calcul repart de zéro pour ${nom || "l’élève"}. Son appareil prendra le parcours neuf à sa prochaine connexion ; «\u00a0Revenir à…\u00a0» le défait pendant 7\u00a0jours.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-appli"); }
  }

  async function supprimerEleve(eleve) {
    const reponse = await demander(
      `Supprimer ${nomAffiche(eleve) || "cet élève"} et toute sa progression ? Cette action est définitive.`,
      null, {oui: "Supprimer cet élève", danger: true});
    if (!reponse) return;
    try {
      await api("eleves.supprimer", {eleve_id: eleve.id});
      eleves = eleves.filter(autre => autre.id !== eleve.id);
      reporterEleve(eleve, true);
      redessin.demander();
      messager("message-classe", "Élève supprimé.", "ok");
      // Lot 5b : le dernier élève qui avait une appli en plus est parti — son
      // onglet reste, grisé (poserAppli le redessine, avec sa carte).
      poserAppli();
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  }

  // Le bilan de l'année, montré AVANT d'effacer — jamais enregistré.
  // « Combien sont allés au bout des tables » se compte ici, avec le moteur
  // déjà chargé pour le tableau : le serveur, lui, n'ouvre jamais une
  // progression. Rien de ce bilan ne survit à la suppression ; c'est pour ça
  // que la confirmation dit de le noter maintenant si on y tient.
  function combienAuBoutDesTables(liste) {
    if (!PARCOURS || !PARCOURS.TABLES) return null;
    if (!liste) return null;
    return liste.filter(eleve => eleve.lu.lisible && eleve.lu.acquises.length === PARCOURS.TABLES.length).length;
  }

  // Combien de prénoms sont RÉELLEMENT saisis — pas combien il y a d'élèves.
  // Lot 11 : la confirmation annonçait « Les 3 prénoms … seront supprimés »
  // dans une classe de trois élèves dont deux seulement étaient nommés. Elle
  // promettait d'effacer un prénom qui n'existait pas ; le professeur, lui,
  // relit ce chiffre pour savoir ce qu'il perd.
  function combienDePrenoms() {
    return eleves.filter(eleve => (eleve.prenom || "").trim() !== "").length;
  }

  // Lot « splat-suivi-4 » : le bilan parle des tables, quel que soit l'onglet
  // ouvert. `tables` : les élèves lus pour Défi tables (listeDefiTables) ; null
  // pour une classe sans Défi tables — le bilan dit alors seulement combien
  // d'élèves, et combien se sont entraînés.
  function texteBilanDeLaClasse(tables) {
    const auBout = combienAuBoutDesTables(tables);
    const actifs = (tables || eleves).filter(eleve => eleve.maj_le).length;
    return `${eleves.length} élève${eleves.length > 1 ? "s" : ""}, `
      + `${actifs} entraîné${actifs > 1 ? "s" : ""}`
      + (auBout === null ? "" : `, ${auBout} au bout des tables`);
  }

  // Les élèves de la classe lus pour Défi tables : ceux déjà lus, sinon un
  // appel « tableau » (depuis l'onglet SPLAT!). Classe sans Défi tables, ou
  // serveur qui ne répond pas : null, et le bilan se contente des élèves.
  async function listeDefiTables() {
    if (!applisDeLaClasse().includes("defi-tables")) return null;
    if (tableaux["defi-tables"]) return tableaux["defi-tables"];
    try {
      const donnees = await api("tableau", {classe_id: classe.id, appli: "defi-tables"});
      tableaux["defi-tables"] = elevesLus("defi-tables", donnees.eleves);
      return tableaux["defi-tables"];
    } catch (_) { return null; }
  }

  $("supprimer-classe").addEventListener("click", async () => {
    const bouton = $("supprimer-classe");
    if (bouton.disabled) return;
    const nommes = combienDePrenoms();
    // Depuis l'onglet SPLAT!, la liste de Défi tables peut demander un appel :
    // un second clic pendant ce temps n'ouvre pas une seconde question.
    bouton.disabled = true;
    const tables = await listeDefiTables();
    bouton.disabled = false;
    const reponse = await demander(
      `Supprimer la classe ${classe.libelle} ?\n\n`
      + `Bilan de l’année : ${texteBilanDeLaClasse(tables)}. Note ces chiffres maintenant si tu veux les `
      + `garder : rien n’en sera conservé.\n\n`
      + (nommes === 0 ? "Aucun prénom n’a été saisi. " : (nommes === 1 ? "Le prénom saisi, " : `Les ${nommes} prénoms saisis, `))
      + `${nommes === 0 ? "Les" : "les"} ${eleves.length} code${eleves.length > 1 ? "s" : ""} et toutes les progressions seront `
      + `supprimés. Cette action est définitive — seule la sauvegarde du mois les contient encore.`,
      null, {oui: "Supprimer la classe", danger: true});
    if (!reponse) return;
    bouton.disabled = true;
    const partie = classe.libelle;
    try { await api("classes.supprimer", {classe_id: classe.id}); }
    catch (erreur) { surErreur(erreur, "message-supprimer"); bouton.disabled = false; return; }
    bouton.disabled = false;
    // Correctif des lots 5 (relecture Codex, point 3) : la classe n'existe
    // plus — la page l'oublie TOUT DE SUITE (prénoms, codes, tableaux), même
    // si la suite ne peut pas être lue. Avant, une panne de la liste laissait
    // la classe supprimée à l'écran, utilisable, et « supprimée » effaçait le
    // message de la panne.
    quitterLaClasse();
    // Lot 5d : une autre classe s'ouvre (ou « Crée ta première classe »).
    const dit = `Classe ${partie} supprimée : il n’en reste rien.`;
    if (await allerSansPerdre(dit)) messager(zoneClasses(), dit, "ok");
  });

  // Un menu « ⋯ » se referme au clic ailleurs et dès que la page défile
  // (il est en position fixe : il ne suivrait pas sa ligne).
  document.addEventListener("click", fermerMenus);
  window.addEventListener("scroll", () => fermerMenus(null), true);
  window.addEventListener("resize", () => fermerMenus(null));
  // Serveur pro, lot 5b : « Régler … ». Annuler, ✕ ou Échap ferment sans
  // rien envoyer, sauf pendant un enregistrement (la fenêtre attend sa fin).
  $("regler-annuler").addEventListener("click", () => { if (!reglageEnCours) $("regler").close(); });
  $("regler-croix").addEventListener("click", () => { if (!reglageEnCours) $("regler").close(); });
  $("regler-enregistrer").addEventListener("click", enregistrerRegler);
  $("regler").addEventListener("cancel", evenement => { if (reglageEnCours) evenement.preventDefault(); });
  $("regler").addEventListener("close", fermerRegler);
  // Serveur pro, lot 5c : la fenêtre de l'élève. ‹ › (et les flèches du
  // clavier) passent au voisin dans le tableau ; « Fermer », ✕ (lot 5f) ou
  // Échap la ferment, et elle oublie l'élève. « Ouvrir dans un onglet »
  // (Défi tables) ouvre l'écran Mon parcours par un billet de lecture
  // (voirFiche). Lot 5f : « Revenir à… » n'est plus dans la fenêtre (le « ⋯ »
  // de la ligne).
  $("fe-precedent").addEventListener("click", () => changerEleveDeLaFenetre(-1));
  $("fe-suivant").addEventListener("click", () => changerEleveDeLaFenetre(1));
  $("fe-croix").addEventListener("click", fermerFenetreEleve);
  $("fe-fermer").addEventListener("click", fermerFenetreEleve);
  $("fenetre-eleve").addEventListener("close", surFermetureFenetre);
  $("fenetre-eleve").addEventListener("keydown", evenement => {
    if (evenement.altKey || evenement.ctrlKey || evenement.metaKey) return;
    if (evenement.key === "ArrowLeft") { evenement.preventDefault(); changerEleveDeLaFenetre(-1); }
    else if (evenement.key === "ArrowRight") { evenement.preventDefault(); changerEleveDeLaFenetre(1); }
  });
  $("fe-parcours").addEventListener("click", () => {
    const eleve = eleveDeLaFenetre();
    if (eleve) voirFiche(eleve, $("fe-parcours"));
  });
  // Anzan : « Voir les séances précédentes » et « Imprimer ».
  $("pa-imprimer").addEventListener("click", imprimerParcoursAnzan);
  // Défi calcul (lot 2b) : la fiche de l'élève (fenêtre), la grille (onglet).
  $("dc-imprimer").addEventListener("click", () => imprimerCalcul("eleve"));
  $("dc-imprimer-grille").addEventListener("click", () => imprimerCalcul("grille"));
  $("pa-plus").addEventListener("click", plusDeSeancesAnzan);
  // La recherche : chaque lettre redessine le tableau (la file de redessin :
  // jamais par-dessus un prénom en cours d'enregistrement).
  $("chercher-eleve").addEventListener("input", evenement => {
    recherche = String(evenement.target.value || "").slice(0, 40);
    redessin.demander();
  });

  $("imprimer-bandelettes").addEventListener("click", () => imprimer("bandelettes"));
  $("imprimer-recap").addEventListener("click", () => imprimer("recap"));
  // Lot 5d : « + Nouvelle classe », au bout du menu « 405 ▾ » (avant,
  // « Toutes mes classes »). Le menu se ferme avant la petite fenêtre.
  $("nouvelle-classe").addEventListener("click", () => { fermerMenuClasses(); creerClasse(); });
  $("premiere-classe").addEventListener("click", creerClasse);
  // Correctif des lots 5 (point 3) : « Réessayer », quand la liste ou la
  // classe à ouvrir n'ont pas pu être lues.
  $("reessayer-classe").addEventListener("click", () => { vue = "appli"; allerSansPerdre("", lireDerniereClasse()); });
  // Le menu des classes (serveur pro, lot 5a) : le nom l'ouvre et le ferme ;
  // Échap le ferme et rend la main au nom ; un clic ailleurs le ferme.
  $("bouton-classes").addEventListener("click", () => {
    if ($("menu-classes").hidden) ouvrirMenuClasses(); else fermerMenuClasses(true);
  });
  $("bouton-classes-colle").addEventListener("click", () => {
    if ($("menu-classes").hidden) ouvrirMenuClasses($("bouton-classes-colle")); else fermerMenuClasses(true);
  });
  window.addEventListener("scroll", () => {
    if (menuOuvertPar === $("bouton-classes-colle")) fermerMenuClasses();
    marquerBarreCollee();
  }, {passive: true});
  $("choix-appli").addEventListener("click", evenement => {
    if (evenement.target.closest && evenement.target.closest("button[data-appli]")) remonterALaBarre();
  });
  document.querySelectorAll(".onglets-classe > button").forEach(bouton => bouton.addEventListener("click", remonterALaBarre));
  document.addEventListener("keydown", evenement => {
    if (evenement.key === "Escape" && !$("menu-classes").hidden) { evenement.preventDefault(); fermerMenuClasses(true); }
    if (evenement.key === "Escape" && !$("menu-applis").hidden) { evenement.preventDefault(); fermerMenuApplis(true); }
  });
  document.addEventListener("click", evenement => {
    if (!evenement.target.closest || !evenement.target.closest(".choix-classe, #bouton-classes-colle")) fermerMenuClasses();
    if (!evenement.target.closest || !evenement.target.closest(".choix-appli-menu")) fermerMenuApplis();
  });
  $("bouton-applis").addEventListener("click", () => {
    if ($("menu-applis").hidden) ouvrirMenuApplis(); else fermerMenuApplis(true);
  });
  $("choix-appli").addEventListener("scroll", marquerSuiteOnglets, {passive: true});
  window.addEventListener("resize", () => { if (classe) { marquerBarreCollee(); montrerOngletChoisi(); } });
  // Lot S4b : la liste des prénoms est placée sous ce qu'on a touché ; une
  // autre largeur (la fenêtre, le téléphone tourné) la ferme. Au téléphone,
  // la barre d'adresse qui se cache change la hauteur seulement : elle reste.
  let largeurPop = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === largeurPop) return;
    largeurPop = window.innerWidth;
    fermerPopEleves();
  });
  $("onglet-eleves").addEventListener("click", ouvrirEleves);
  // Lot S2 : « La classe ».
  $("onglet-classe").addEventListener("click", () => { remonterALaBarre(); ouvrirLaClasse(); });
  // La liste des élèves d'une barre de « Où en est la classe » se ferme d'un
  // clic ailleurs, d'Échap, ou quand la page défile.
  // Lot S4b : un clic DANS la fiche ne la ferme pas (on revient à la liste
  // en fermant la fiche) ; Échap ferme d'abord la fiche ; même chose pour
  // la liste des prénoms d'un « 5 élèves ». La bulle d'une case de
  // compétence se ferme d'un clic ailleurs ou d'Échap.
  // Le chemin du clic est celui du moment où il a eu lieu : un bouton que
  // son propre clic redessine (un jour du calendrier) compte toujours comme
  // « dans la fiche ».
  document.addEventListener("click", evenement => {
    const chemin = typeof evenement.composedPath === "function" ? evenement.composedPath() : [evenement.target];
    const dans = choix => chemin.some(noeud => noeud && typeof noeud.matches === "function" && noeud.matches(choix));
    if (!dans("#pop-eleves, dialog")) fermerPopEleves();
    if (!dans(".dc-case, .detail-monde .et")) cacherBulleCase();
  });
  document.addEventListener("keydown", evenement => {
    if (evenement.key !== "Escape") return;
    cacherBulleCase();
    if (document.querySelector("dialog[open]")) return;
    fermerPopEleves();
  });
  $("onglet-reglages").addEventListener("click", ouvrirReglages);
  // Lot B2 : la carte « Aujourd'hui, dans Mon espace ».
  $("jour-auto").addEventListener("change", () => choisirModeDuJour("auto"));
  $("jour-liste").addEventListener("change", () => choisirModeDuJour("liste"));
  $("jour-aucun").addEventListener("change", () => choisirModeDuJour("aucun"));
  [1, 2, 3].forEach(n => $(`jour-${n}`).addEventListener("change", evenement => choisirEtapeDuJour(n - 1, evenement.target.value)));
  $("jour-enregistrer").addEventListener("click", enregistrerJour);
  // Renommer la classe (lot « Ma classe : réglages ») : classes.modifier avec
  // le seul nom — les activités et leurs réglages ne bougent pas. Le serveur
  // nettoie le nom (espaces, caractères de commande, 40 au plus) ; on affiche
  // celui qu'il a gardé, relu avec la classe.
  $("form-nom-classe").addEventListener("submit", async evenement => {
    evenement.preventDefault();
    if (!classe) return;
    const libelle = $("nom-classe").value.trim();
    if (!libelle) { messager("message-nom", "Donne un nom à la classe.", "erreur"); return; }
    if (libelle === classe.libelle) { messager("message-nom", "", ""); return; }
    const bouton = $("renommer-classe");
    if (bouton.disabled) return;
    bouton.disabled = true;
    try {
      await api("classes.modifier", {classe_id: classe.id, libelle});
      await ouvrirClasse(classe.id);
      $("nom-classe").value = classe.libelle;
      messager("message-nom", `La classe s’appelle maintenant ${classe.libelle}.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-nom"); }
    finally { bouton.disabled = false; }
  });
  document.querySelectorAll("#choix-appli button[data-appli]").forEach(bouton => {
    // Un onglet d'activité sort des Réglages (lot « Ma classe : réglages »).
    bouton.addEventListener("click", () => { vue = "appli"; afficherAppli(bouton.dataset.appli); });
  });
  // Serveur pro, lot 5b : « Régler … » en haut de l'onglet, et les deux
  // boutons de la carte d'un onglet grisé.
  $("regler-appli").addEventListener("click", () => ouvrirRegler(appliAffichee));
  $("af-quelques").addEventListener("click", () => ouvrirRegler(appliAffichee));
  $("af-toute").addEventListener("click", ouvrirATouteLaClasse);
  $("records-plein-ecran").addEventListener("click", ouvrirRecordsPleinEcran);

  // Lot S4c : Coffres, « Depuis le début » ou « Cette semaine ».
  document.querySelectorAll("#periode-coffres button").forEach(bouton => {
    bouton.addEventListener("click", () => choisirPeriodeCoffres(bouton.dataset.periode));
  });
  document.querySelectorAll("th button[data-tri]").forEach(bouton => {
    bouton.addEventListener("click", () => {
      const colonne = bouton.dataset.tri;
      tri = {colonne, sens: tri.colonne === colonne ? -tri.sens : (colonne === "prenom" ? 1 : -1)};
      // Passe par la file : un tri déclenché juste après une saisie de prénom
      // attend la réponse du serveur au lieu d'effacer la correction à l'écran.
      redessin.demander();
    });
  });

  // « + Nouvelle classe » (lot « Ma classe : élèves », 18/10/2026) : la petite
  // fenêtre, puis la classe s'ouvre — sur Élèves, puisqu'elle est vide.
  let creationEnCours = false;
  async function creerClasse() {
    if (creationEnCours) return;
    const reponse = await demander("Nouvelle classe",
      [{nom: "libelle", libelle: "Nom de la classe", maxlength: 40, placeholder: "405"}],
      {oui: "Créer la classe"});
    if (!reponse) return;
    const libelle = String(reponse.libelle || "").trim();
    if (!libelle) { messager(zoneClasses(), "Donne un nom à la classe.", "erreur"); return; }
    // Une création à la fois : deux clics faisaient deux classes du même nom,
    // impossibles à distinguer dans la liste.
    creationEnCours = true;
    try {
      let donnees;
      try { donnees = await api("classes.creer", {libelle, applis: ["defi-tables"]}); }
      catch (erreur) { surErreur(erreur, zoneClasses()); return; }
      // Correctif des lots 5 : le même chemin que les autres (une réponse
      // périmée ne change rien ; une panne se dit avec ce qui a réussi).
      await allerSansPerdre(`La classe ${libelle} est créée.`, donnees.id);
    } finally { creationEnCours = false; }
  }

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

  // L'écran du tableau est une autre page : la session et l'instant du dernier
  // geste la suivent (sessionStorage de l'onglet), la classe est dite dans
  // l'ancre — un numéro de classe n'est pas un secret, et le serveur revérifie
  // le droit à chaque appel.
  $("seance-direct").addEventListener("click", () => {
    if (classe) window.location.assign("direct.php#classe=" + encodeURIComponent(classe.id));
  });

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
    $("compte-qui").textContent = identifiant ? `Connecté en tant ${queNom(identifiant)}.` : "";
    $("bandeau-temporaire").hidden = !mdpTemporaire;
    messager("message-compte", "", "");
    ["mdp-ancien", "mdp-nouveau", "mdp-confirme"].forEach(id => { $(id).value = ""; });
    montrer("ecran-compte");
    // Lot 5d : Professeurs est ici (avant, sous les tuiles de « Mes classes »).
    // Administrateur seulement — et pas tant que son mot de passe est
    // temporaire : le serveur refuse alors tout le reste.
    const avecProfs = estAdmin && !mdpTemporaire;
    $("bloc-profs").hidden = !avecProfs;
    messager("message-profs", "", "");
    if (avecProfs) chargerProfs();
    $("mdp-ancien").focus();
  }

  $("mon-compte").addEventListener("click", ouvrirCompte);
  // « ‹ Ma classe » : la classe qu'on avait ouverte (lot 5d), sur son tableau
  // — jamais sur ses codes ni ses Réglages : la vue ne se retient pas (lot
  // « Ma classe : élèves »), et ouvrirClasse prendrait la classe pour la
  // « même » et garderait la vue.
  // Correctif des lots 5 (point 4) : une panne se lit sur Mon compte, et
  // « Ma classe » reste là pour réessayer.
  $("retour-compte").addEventListener("click", () => { vue = "appli"; allerSansPerdre("", classe && classe.id); });

  $("form-motdepasse").addEventListener("submit", async event => {
    event.preventDefault();
    const ancien = $("mdp-ancien").value;
    const nouveau = $("mdp-nouveau").value;
    // La même règle que le serveur, et comptée pareil : en OCTETS (M-03).
    // `nouveau.length` compte des caractères — « é » en vaut un ici, deux pour
    // bcrypt. Un contrôle en caractères laisserait donc passer une phrase que
    // le serveur refuse, et la collègue verrait un message venu d'ailleurs.
    const octets = new TextEncoder().encode(nouveau).length;
    if (octets < 12) { messager("message-compte", "Le nouveau mot de passe doit faire 12 à 72 caractères : celui-ci est trop court.", "erreur"); return; }
    if (octets > 72) { messager("message-compte", "Le nouveau mot de passe doit faire 12 à 72 caractères : celui-ci est trop long (les lettres accentuées comptent double).", "erreur"); return; }
    if (nouveau !== $("mdp-confirme").value) { messager("message-compte", "Les deux saisies du nouveau mot de passe ne sont pas identiques.", "erreur"); return; }
    try { await api("profs.motdepasse", {ancien, nouveau}); }
    catch (erreur) { surErreur(erreur, "message-compte"); return; }
    mdpTemporaire = false;
    ["mdp-ancien", "mdp-nouveau", "mdp-confirme"].forEach(id => { $(id).value = ""; });
    vue = "appli";
    // Correctif des lots 5 (point 10) : la classe du lien « #classe=… » par
    // lequel il est arrivé, gardée pendant le changement obligatoire, passe
    // d'abord (si elle est dans SA liste) ; elle ne sert qu'une fois.
    const duLien = classeApresMotDePasse;
    classeApresMotDePasse = 0;
    const dit = "Mot de passe changé. Tes autres appareils sont déconnectés.";
    if (await allerSansPerdre(dit, duLien, classe && classe.id, lireDerniereClasse())) messager(zoneClasses(), dit, "ok");
  });

  // Retour du tableau de la séance en direct (17/10/2026) : « Ma classe » y
  // ramène dans LA classe (direct.php#classe=… → ./#classe=…). L'ancre est
  // effacée aussitôt : un rechargement ne la rejoue pas. Une classe absente
  // de la liste (supprimée, partage retiré) n'ouvre rien : allerDansUneClasse
  // passe à la suivante (lot 5d).
  function classeDemandee() {
    const demandee = Number((/(?:^|[#&])classe=(\d+)/.exec(window.location.hash) || [])[1]) || 0;
    if (window.location.hash) {
      try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (_) {}
    }
    return demandee;
  }

  // Une seule porte d'entrée : on demande qui on est (et si on est administrateur),
  // puis une classe s'ouvre (lot 5d : plus d'écran « Mes classes »).
  function demarrer() {
    veille.reprendre(Date.now());
    // Correctif des lots 5 (point 1) : « moi » demandé avant une déconnexion
    // ne touche plus à la page.
    const depart = generation;
    return api("moi").then(donnees => {
      if (depart !== generation) return undefined;
      identifiant = donnees.identifiant;
      $("qui").textContent = donnees.identifiant;
      estAdmin = Boolean(donnees.admin);
      directPermis = donnees.direct === true;
      mdpTemporaire = Boolean(donnees.mdp_temporaire);
      // Correctif des lots 5 (point 10) : l'ancre est lue (et effacée) AVANT
      // le mot de passe temporaire — elle sert une fois, après son changement.
      const duLien = classeDemandee();
      if (mdpTemporaire) { classeApresMotDePasse = duLien; ouvrirCompte(); return undefined; }
      // Une panne de la liste ou du tableau n'est pas une session finie :
      // « Ta classe n'a pas pu s'ouvrir », avec « Réessayer » (point 3).
      return allerSansPerdre("", duLien, lireDerniereClasse());
    }).catch(erreur => {
      if (depart !== generation) return;
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
  if (jeton) {
    // Poste partagé : on décide AVANT d'afficher quoi que ce soit. Si la page
    // a été laissée plus de 30 minutes, le jeton part et l'écran de connexion
    // s'affiche — celui qui trouve l'onglet ne voit jamais les classes.
    veille.reprendre(Date.now());
    if (veille.doitFermer(Date.now())) deconnecter({recharger: true, avis: "inactivite"});
    else demarrer();
  }
})();
</script>
</body>
</html>
