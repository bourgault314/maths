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
  .classe-collee { flex: none; align-self: center; margin-right: 4px; padding: 0 8px 0 0; gap: 4px;
                   color: var(--blue-dark); background: none; border: 0; font: 400 var(--titre-carte)/1.2 var(--serif); }
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
  .outils-tableau .chercher svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  #tableau th[aria-sort="ascending"] button::after { content: " ▲"; font-size: .8em; }
  #tableau th[aria-sort="descending"] button::after { content: " ▼"; font-size: .8em; }
  /* La ligne entière ouvre la fenêtre de l'élève : plus de bouton par ligne.
     Le prénom est un bouton (le clavier y arrive), la flèche dit qu'on peut
     entrer. */
  #tableau tbody tr.cliquable { cursor: pointer; }
  #tableau tbody tr.cliquable:hover td { background: var(--survol); }
  .lien-eleve { min-height: 0; padding: 0; gap: 0; justify-content: flex-start; color: var(--blue-dark); background: none;
                border: 0; border-radius: 4px; font: inherit; font-weight: 600; text-align: left; white-space: nowrap; }
  .lien-eleve:hover, tr.cliquable:hover .lien-eleve { color: var(--blue); background: none; border: 0; text-decoration: underline; }
  td.nom.sans .lien-eleve { color: var(--muted); font-style: italic; font-weight: 400; }
  #tableau td.va { width: 36px; padding-left: 0; color: var(--blue); font-size: var(--titre-carte); text-align: right; }
  #tableau .seul-telephone { display: none; }
  #tableau td.aucun { color: var(--muted); font-style: italic; white-space: normal; }
  /* Les trois cartes du haut de Défi tables, côte à côte, de la même largeur
     (charte : .grille-cartes), sans filet de couleur. */
  /* La fenêtre de l'élève : la même dans les quatre applis (charte :
     .fenetre). ‹ › en haut à droite pour passer au précédent, au suivant. */
  dialog.fenetre-eleve { max-width: 640px; }
  .fenetre-eleve .fenetre-tete { position: relative; padding-right: 116px; }
  .fenetre-eleve .naviguer { position: absolute; top: 16px; right: 16px; display: flex; gap: 6px; }
  .fenetre-eleve .naviguer button { width: 44px; padding: 0; font-size: 22px; line-height: 1; }
  .fenetre-eleve .fenetre-tete h2 { overflow-wrap: anywhere; }
  .fiche-chiffres { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); margin: 4px 0 16px; }
  .fiche-chiffres > div { min-width: 0; padding: 10px 12px; background: var(--page); border: 1px solid var(--filet-doux); border-radius: var(--arrondi); }
  .fiche-chiffres dt { color: var(--muted); font-size: var(--texte-secondaire); }
  .fiche-chiffres dd { margin: 2px 0 0; font-weight: 700; }
  .fiche-chiffres dd small { display: block; font-weight: 400; }
  .fenetre-eleve h3 { margin: 16px 0 6px; font-size: 16px; color: var(--ink); }
  .fenetre-eleve h3:first-child { margin-top: 0; }
  .fe-vide { margin: 4px 0 8px; color: var(--muted); }
  .fe-alertes { display: flex; flex-wrap: wrap; gap: 6px; margin: -6px 0 12px; }
  .fe-alertes .alerte { margin-left: 0; }
  .cases-tables { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 4px; padding: 0; list-style: none; }
  .cases-tables li { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 10px;
                     font-weight: 700; background: var(--gris-pale); color: var(--muted); }
  .cases-tables li.passee { background: var(--vert-pale); color: var(--vert); }
  .cases-tables li.encours { background: var(--paper); color: var(--blue); border: 2px solid var(--blue); }
  .fe-retard { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
  .fe-gestes { margin: 18px 0 0; padding-top: 12px; border-top: 1px solid var(--filet-doux); }
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
  .fragiles strong { display: block; color: var(--blue-dark); font-family: Georgia, serif; font-size: 1.05rem; }
  .fragiles p { margin: 4px 0 10px; color: var(--muted); font-size: .88rem; }
  .fragiles ul { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; }
  .fragiles li { display: flex; align-items: baseline; gap: 6px; padding: 6px 12px; border-radius: 999px;
                 background: #fdf0e3; color: #8a4c0a; font-weight: 800; }
  .fragiles li span { font-size: .82rem; font-weight: 600; color: #a15c11; }
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
  /* La vue « Réglages » : une colonne de cartes, la plus utile en haut —
     Activités (chaque appli, ses réglages en retrait dessous), Partager, Nom
     de la classe, Supprimer la classe. */
  .reglages { max-width: 780px; }
  #bloc-activites > h2 { margin-top: 4px; }
  .reglages .sous { margin: -4px 0 10px; }
  .activite + .activite { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); }
  .activite-tete { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; margin: 0;
                   font-size: 1rem; cursor: pointer; }
  .activite-tete input, .sous-reglage > label > input { width: 20px; height: 20px; margin: 0; accent-color: var(--blue); }
  .sous-reglage { margin: 4px 0 6px 9px; padding: 4px 0 4px 20px; border-left: 3px solid #e6ecf3; }
  .sous-reglage > label { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; margin: 0;
                          font-size: .93rem; cursor: pointer; }
  .sous-reglage small { display: block; margin: -4px 0 0 28px; color: var(--muted); font-size: .84rem; line-height: 1.4; }
  .sous-reglage .titre-sous { margin: 4px 0 8px; font-size: .88rem; font-weight: 700; color: var(--ink); }
  .legende-partage { margin: 0 0 12px; padding: 0; list-style: none; color: var(--muted); font-size: .9rem; line-height: 1.45; }
  .legende-partage li + li { margin-top: 4px; }
  .legende-partage b { color: var(--ink); }
  .ligne-nom { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .ligne-nom input { flex: 1 1 160px; max-width: 260px; }
  .carte.danger-zone { border-left: 5px solid var(--rouge); }
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
  /* Lot « Qui voit quoi » (22/10/2026, planches 1 à 4 validées par Gwenaël) :
     la colonne « En plus » de l'onglet Élèves — une pastille par chose que
     l'élève voit EN PLUS de sa classe (l'appli entière, ou les mondes /
     niveaux qu'elle n'a pas) ; « — » sinon. Pour le propriétaire, la pastille
     est un bouton qui ouvre « Ce que voit Léa » ; pour un collègue, du texte.
     Sur téléphone, pas de colonne : les pastilles passent sous le prénom. */
  /* La colonne prend sa part (45 %) : deux pastilles tiennent sur une ligne,
     au-delà elles passent à la ligne — le tableau ne déborde jamais de son
     cadre de 720 px (le « ⋯ » resterait hors de l'écran). Une pastille trop
     longue pour sa ligne (Coffres : niveaux et opérations) coupe son texte
     au lieu d'élargir le tableau. */
  #tableau-eleves td.en-plus { width: 45%; white-space: normal; }
  #tableau-eleves td.en-plus .vide { color: #9aa9bb; }
  .ajout { display: inline-flex; align-items: center; gap: 6px; min-height: 30px; margin: 2px 6px 2px 0;
           padding: 3px 11px 3px 9px; border: 0; border-radius: 15px; background: #eaf0f7;
           color: var(--blue-dark); font: inherit; font-size: .82rem; font-weight: 700; white-space: normal;
           text-align: left; }
  .ajout i { flex: none; }
  button.ajout { cursor: pointer; }
  button.ajout:hover { background: #dbe6f2; }
  .ajout i { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 50%;
             background: var(--c, #0b67b2); color: #fff; font-style: normal; font-size: .72rem; font-weight: 800; }
  .ajouts-sous { display: none; }
  #corps-eleves tr.repere td { background: #fff7d6; transition: background .3s; }
  /* La fenêtre « Ce que voit Léa » (planche 2) : ce que la classe donne est
     coché, grisé, « par la classe » ; ce qu'on a donné à l'élève, « en plus »
     en vert ; le reste à cocher. Chaque clic enregistre ; « Fermer » ferme. */
  dialog.voit { max-width: 560px; max-height: calc(100vh - 32px); padding: 0; }
  dialog.voit[open] { display: flex; flex-direction: column; }
  .voit-tete { padding: 18px 20px 10px; }
  .voit-tete h2 { margin: 0 0 4px; font-size: 1.25rem; }
  .voit-tete p { margin: 0; color: var(--muted); font-size: .9rem; line-height: 1.45; }
  .voit-liste { flex: 1 1 auto; overflow-y: auto; padding: 4px 20px 6px; }
  .voit-liste[aria-busy="true"] { opacity: .6; cursor: progress; }
  .voit-liste .activite { padding: 6px 0; }
  .voit-liste .activite + .activite { margin-top: 0; padding-top: 6px; border-top: 1px solid #e6ecf3; }
  .voit-liste .activite-tete { display: flex; width: 100%; }
  .voit-liste .activite-tete small { display: block; color: var(--muted); font-size: .82rem; font-weight: 400; }
  .voit-liste .par-classe .activite-tete { cursor: default; }
  .voit-liste .par-classe .activite-tete strong { color: #6b7685; }
  .voit-liste .tag { margin-left: auto; padding: 2px 9px; border-radius: 999px; background: #f0f3f7;
                     color: #6b7685; font-size: .78rem; font-weight: 700; white-space: nowrap; }
  .voit-liste .tag.plus { background: #e2f4e4; color: #1b6b2e; }
  .voit-liste .sous-reglage { margin: 0 0 6px 9px; padding: 2px 0 6px 20px; }
  .voit-liste .titre-sous { margin: 4px 0 8px; font-size: .88rem; font-weight: 700; color: var(--muted); }
  .voit-liste .puce-monde.classe { border-style: solid; border-color: #d2d9e2; background: #f6f8fa; color: #6b7685; cursor: default; }
  .voit-liste .puce-monde.classe i { background: #cfd6df; color: #fff; }
  .voit-liste .puce-monde.classe input { cursor: default; }
  .voit-liste .puce-monde.classe::after, .voit-liste .cases-coffres label.classe::after {
    content: "par la classe"; margin-left: 2px; color: #8a96a5; font-size: .72rem; font-weight: 600; }
  .voit-liste .puce-monde.plus { box-shadow: 0 0 0 3px #e2f4e4; }
  .voit-liste .cases-coffres label.classe { color: #6b7685; cursor: default; }
  .voit-pied { display: flex; align-items: center; gap: 12px; padding: 12px 20px 16px; border-top: 1px solid #e6ecf3; }
  .voit-pied .message { margin: 0; padding: 0; background: none; font-size: .88rem; }
  .voit-pied button { margin-left: auto; }
  /* Lot « Qui voit quoi », lot 4b (24/10/2026) : « Le parcours de Rania » pour
     Anzan — l'écran « Mon historique » de l'élève, en lecture seule (planche 3
     du lot 4a) : le jour, le mode et ses réglages, le score sur les calculs
     faits, « arrêtée » dessous quand la séance s'est arrêtée en route. */
  .pa-compte { margin: 0 0 12px; color: var(--ink); font-weight: 700; }
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
  /* ⚙ Réglages (planche 4) : sous chaque appli, en lecture seule, à qui on a
     ouvert quelque chose en plus ; chaque prénom mène à sa ligne d'Élèves. */
  .en-plus-pour { margin: 0 0 6px 30px; color: var(--muted); font-size: .84rem; line-height: 1.5; }
  .sous-reglage .en-plus-pour { margin: 6px 0 0; }
  .en-plus-pour span { display: block; }
  .en-plus-pour b { color: #1b6b2e; font-weight: 700; }
  .en-plus-pour button { min-height: 28px; padding: 0; border: 0; background: none; color: var(--blue-dark);
                         font: inherit; font-weight: 600; text-decoration: underline; cursor: pointer; }
  .en-plus-pour button:hover { background: #eaf0f7; }
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
  /* Lot « splat-suivi-5 » (choix de Gwenaël sur maquettes, 08/10/2026) : sous SPLAT!,
     les mondes ouverts à la classe, monde par monde. Ouvert : bordure et rond de la
     couleur du monde (celle de la carte) ; fermé : pointillés gris. */
  .puces-mondes { display: flex; flex-wrap: wrap; gap: 8px; }
  .puce-monde { position: relative; display: inline-flex; align-items: center; gap: 7px; min-height: 44px; margin: 0;
                padding: 0 12px 0 8px; border: 2px solid var(--c); border-radius: 999px; background: #fff;
                color: var(--ink); font-size: .86rem; font-weight: 700; cursor: pointer; }
  .puce-monde i { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%;
                  background: var(--c); color: #fff; font-style: normal; font-size: .78rem; font-weight: 800; }
  .puce-monde input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
  .puce-monde.ferme { border-style: dashed; border-color: #b9c1cb; background: #f6f8fa; color: #6b7685; }
  .puce-monde.ferme i { background: #fff; color: #6b7685; border: 2px dashed #b9c1cb; width: 18px; height: 18px; }
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
  .tresors small { display: block; margin-top: 1px; color: var(--muted); font-size: .8rem; }
  .partie-en-cours { margin: 0 0 8px; color: var(--ink); font-size: .9rem; }
  .partie-en-cours b { color: var(--ink); }
  .tableau-operations { width: auto; min-width: min(100%, 560px); margin: 0; }
  .tableau-operations th, .tableau-operations td { padding: 7px 12px; font-size: .88rem; white-space: nowrap; }
  .tableau-operations th { background: #eef2f7; color: var(--ink); font-size: .74rem; letter-spacing: .04em; text-transform: uppercase; }
  .tableau-operations td.nombre { font-variant-numeric: tabular-nums; }
  p.sous.note-coffres { margin: 10px 0 0; font-size: .88rem; }
  /* Les réglages de Coffres (⚙ Réglages) : deux rangées de cases, comme les
     mondes de SPLAT! mais en cases simples (choix de Gwenaël, 21/10/2026). */
  .cases-coffres { display: flex; flex-wrap: wrap; gap: 4px 18px; margin: 0 0 6px; }
  .cases-coffres label { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; margin: 0;
                         font-size: .93rem; font-weight: 700; cursor: pointer; }
  .cases-coffres input { width: 20px; height: 20px; margin: 0; accent-color: var(--blue); }
  .cases-coffres[aria-busy="true"] label { opacity: .6; cursor: progress; }
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
  .eval-modeles .gestes button { padding: 0 12px; }
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
  }
  /* Lot « Qui voit quoi » (planche 3) : sur téléphone, pas de colonne « En
     plus » — les pastilles passent sous le prénom ; dans la fenêtre, les
     étiquettes « par la classe » se taisent (la case grisée le dit). */
  @media (max-width: 480px) {
    #tableau-eleves th.th-plus, #tableau-eleves td.en-plus { display: none; }
    .ajouts-sous { display: flex; flex-wrap: wrap; gap: 0 2px; margin: -4px 0 4px 8px; }
    .ajouts-sous .ajout { min-height: 26px; margin: 2px 4px 2px 0; padding: 1px 8px 1px 6px; border-radius: 13px; font-size: .74rem; }
    .ajouts-sous .ajout i { width: 15px; height: 15px; font-size: .62rem; }
    .voit-liste .tag { display: none; }
    .voit-liste .puce-monde.classe::after, .voit-liste .cases-coffres label.classe::after { content: none; }
  }
  /* Serveur pro, lot 5c (choix de Gwenaël, planche 5 du 25/10/2026) : au
     téléphone, le tableau reste un tableau — compact, une ligne par élève,
     trois colonnes (l'élève, le compte, le dernier jour). Le reste est dans
     la fenêtre de l'élève : on touche la ligne. Avant, une carte par élève
     (≈ 230 px chacune). */
  @media (max-width: 700px) {
    #tableau th.large, #tableau td.large { display: none; }
    #tableau th.seul-telephone, #tableau td.seul-telephone { display: table-cell; }
    #tableau th, #tableau td { padding: 10px 4px; }
    #tableau th { white-space: normal; line-height: 1.25; }
    #tableau th:first-child, #tableau td:first-child { padding-left: 10px; }
    #tableau .bonus-compte { display: none; }
    #tableau th:last-child:empty, #tableau td.va { display: none; }
    #tableau td.nom { max-width: 44vw; overflow: hidden; text-overflow: ellipsis; }
    .acquises-liste { display: none; }
    /* « Parfait : … » explique les niveaux de Coffres : cachés ici, ils sont
       (avec la même phrase) dans la fenêtre. */
    p.sous.note-coffres { display: none; }
    .outils-tableau .chercher { flex: 1 1 100%; }
    /* La liste de l'onglet Élèves reste un tableau : quatre colonnes courtes. */
    #tableau-eleves th, #tableau-eleves td { padding: 6px 4px; }
    #tableau-eleves td input { width: 100%; min-width: 0; min-height: 44px; }
    #tableau-eleves td.numero { width: 2em; padding-right: 6px; }
    .alerte { margin-left: 0; }
    /* Dans la fenêtre : deux chiffres par ligne, le nom du monde au-dessus
       de ses cases, le tableau par opération de Coffres resserré. */
    .fiche-chiffres { grid-template-columns: 1fr 1fr; }
    .detail-monde b { flex-basis: 100%; }
    .fenetre-eleve .tableau-operations { width: 100%; min-width: 0; }
    .fenetre-eleve .tableau-operations th, .fenetre-eleve .tableau-operations td { padding: 5px 3px; font-size: .76rem; white-space: normal; }
    .fenetre-eleve .tableau-operations th { font-size: .68rem; line-height: 1.2; letter-spacing: 0; text-transform: none; }
  }
  @media print {
    @page { margin: 12mm; }
    .barre, header, footer, .barre-outils, .actions, .rec-plein,
    #ecran-classe > *:not(.fiche):not(.bandelettes):not(.note-impression):not(.fiche-anzan) { display: none !important; }
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
    .pied-impression { margin-top: 18px; display: flex; align-items: center;
                       justify-content: space-between; font-size: .78rem; color: #444; }
  }
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

  <!-- Serveur pro, lot 5d (choix de Gwenaël, 25/10/2026) : plus d'écran
       « Mes classes ». À la connexion, une classe s'ouvre toujours (l'ancre de
       la séance en direct, sinon la dernière ouverte sur ce poste, sinon la
       première des siennes) ; on change de classe par « 405 ▾ », qui se termine
       par « + Nouvelle classe ». Professeurs est dans Mon compte. Il ne reste
       ici que l'écran d'un professeur qui n'a AUCUNE classe (un collègue au
       premier jour). -->
  <section id="ecran-premiere-classe" hidden>
    <div class="carte premiere-classe">
      <h1>Crée ta première classe</h1>
      <p class="sous">Donne-lui un nom (405, 6e B…), puis ajoute tes élèves : chacun reçoit un code pour entrer dans les applis.</p>
      <div class="actions">
        <button type="button" id="premiere-classe"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Nouvelle classe</button>
      </div>
      <p class="sous note">Si un collègue partage une de ses classes avec toi, elle s’ouvrira ici à ta prochaine connexion.</p>
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
      <div class="choix-appli-menu" id="choix-appli-menu" hidden>
        <button type="button" class="appli-selecteur" id="bouton-applis" aria-haspopup="true" aria-expanded="false" aria-controls="menu-applis"><span id="nom-appli"></span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="menu-classes menu-applis" id="menu-applis" hidden><ul id="menu-applis-liste" aria-label="Applis"></ul></div>
      </div>
      <div class="onglets" id="choix-appli" role="group" aria-label="Activité affichée">
        <button type="button" data-appli="defi-tables" aria-pressed="true">Défi tables</button>
        <button type="button" data-appli="coffres" aria-pressed="false">Coffres magiques</button>
        <button type="button" data-appli="flash-anzan" aria-pressed="false">Anzan</button>
        <button type="button" data-appli="splat" aria-pressed="false">SPLAT!</button>
      </div>
      <div class="onglets onglets-classe" role="group" aria-label="La classe">
      <button type="button" class="onglet-eleves" id="onglet-eleves" aria-pressed="false" aria-label="Élèves" title="Élèves : prénoms, codes, papiers" hidden><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span class="mot">Élèves</span></button>
      <button type="button" class="onglet-reglages" id="onglet-reglages" aria-pressed="false" aria-label="Réglages" title="Réglages de la classe" hidden><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span class="mot">Réglages</span></button>
      </div>
    </div>

    <!-- La vue de l'activité : ce qu'on regarde et ce qu'on fait avec l'appli. -->
    <div id="vue-appli">

    <!-- Serveur pro, lot 5c (choix de Gwenaël, maquette 8 du 25/10/2026) : les
         trois cartes du haut de Défi tables côte à côte, de la même largeur
         (charte : .grille-cartes), sans filet de couleur. -->
    <div class="grille-cartes cartes-haut">

    <!-- L'objectif commun de la classe. Aucun nom, aucun chiffre par élève :
         c'est ce qu'on peut montrer au tableau sans désigner personne. -->
    <div class="carte objectif" id="objectif" hidden>
      <strong>Notre classe, ensemble</strong>
      <div class="jauge-barre"><i id="objectif-barre"></i></div>
      <span class="compte" id="objectif-compte"></span>
      <ul class="lignes" id="objectif-lignes"></ul>
    </div>

    <!-- Vue d'ensemble : ce qu'il faut revoir au tableau, pas élève par élève.
         Calculé dans le navigateur à partir des progressions déjà chargées. -->
    <div class="carte fragiles" id="fragiles" hidden>
      <strong>Les calculs qui coincent dans cette classe</strong>
      <p id="fragiles-sous"></p>
      <ul id="fragiles-liste"></ul>
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

    <!-- Lot « Ma classe : élèves » (18/10/2026) : les boutons des élèves sont
         partis dans l'onglet Élèves ; ici, la progression seulement.
         Serveur pro, lot 5c : chercher un prénom au-dessus du tableau ; plus de
         « Trier par » — les titres de colonnes trient. La loupe est le dessin
         « search » de Feather Icons (licence MIT). -->
    <div class="outils-tableau" id="outils-tableau">
      <div class="chercher"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="search" id="chercher-eleve" placeholder="Chercher un élève" aria-label="Chercher un élève" autocomplete="off" spellcheck="false" maxlength="40"></div>
    </div>
    <!-- Le message de l'activité (fiche, version restaurée, moteur absent) :
         au-dessus du tableau, pas sous trente lignes. -->
    <p class="message" id="message-appli" hidden></p>
    <div class="tableau-enveloppe">
      <table id="tableau">
        <thead>
          <!-- Serveur pro, lot 5c : « large » = caché au téléphone (le tableau
               compact garde trois colonnes) ; « seul-telephone » = l'inverse.
               La dernière colonne, sans titre, porte la flèche « › ». -->
          <tr id="entete-defi-tables">
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th><button type="button" data-tri="acquises">Tables passées</button></th>
            <th class="large"><button type="button" data-tri="encours">En cours</button></th>
            <th class="large"><button type="button" data-tri="semaine">Cette semaine</button></th>
            <th class="large"><button type="button" data-tri="retard">En retard</button></th>
            <th><button type="button" data-tri="date">Dernière activité</button></th>
            <th></th>
          </tr>
          <!-- L'onglet Coffres magiques (lot « Coffres magiques sur le suivi »,
               21/10/2026, maquette 01 validée) : un niveau par colonne, le
               jour du dernier trésor. -->
          <tr id="entete-coffres" hidden>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th class="seul-telephone"><button type="button" data-tri="tresors">Trésors</button></th>
            <th class="large"><button type="button" data-tri="niveau1">Niveau 1</button></th>
            <th class="large"><button type="button" data-tri="niveau2">Niveau 2</button></th>
            <th class="large"><button type="button" data-tri="niveau3">Niveau 3</button></th>
            <th><button type="button" data-tri="date">Dernier trésor</button></th>
            <th></th>
          </tr>
          <!-- L'onglet Anzan (lot « Qui voit quoi », lot 4b, 24/10/2026) : le
               compte en calculs et en jours (on compte des calculs, pas des
               séances : une séance en fait 5, 10 ou 20), le jour de la
               dernière séance, et « Parcours » (ses dix dernières séances). -->
          <tr id="entete-anzan" hidden>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th><button type="button" data-tri="calculs">Calculs</button></th>
            <th class="large"><button type="button" data-tri="jours">Jours</button></th>
            <th><button type="button" data-tri="date">Dernière séance</button></th>
            <th></th>
          </tr>
          <!-- L'onglet SPLAT! (lot « splat-suivi-4 ») : ses colonnes à lui. -->
          <tr id="entete-splat" hidden>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th class="large">Mondes</th>
            <th><button type="button" data-tri="etapes">Étapes réussies</button></th>
            <th><button type="button" data-tri="date">Dernière activité</button></th>
            <th></th>
          </tr>
        </thead>
        <tbody id="corps"></tbody>
      </table>
    </div>
    <p class="sous note-coffres" id="note-coffres" hidden>Parfait : sans erreur ni solution montrée.</p>
    <p class="sous note-tableau">Ce tableau est un <strong>indicateur pédagogique, pas une preuve
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
      d’un élève, remplie : touche sa ligne, puis « Voir son parcours ».</p>
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
            <thead><tr><th title="Le numéro de la feuille prénom ↔ code et des bandelettes">N°</th><th>Élève</th><th>Code</th><th class="th-plus" title="Ce que l’élève voit en plus de sa classe">En plus</th><th></th></tr></thead>
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
      <!-- Ce que les élèves trouvent dans leur espace (lot « splat-suivi-4 »,
           conception D7) : une appli par ligne, ses réglages en retrait
           dessous. Décocher retire la tuile et n'efface rien : le serveur
           garde les progressions (classes.modifier ne change que la liste). -->
      <div id="bloc-activites">
        <h2>Activités</h2>
        <p class="sous">Ce que tes élèves trouvent dans leur espace.</p>
        <div class="carte" id="liste-activites">
          <div class="activite">
            <label class="activite-tete"><input type="checkbox" data-appli="defi-tables"> <strong>Défi tables</strong></label>
            <!-- Lot « Les records » : la case par classe (ouverte par défaut) —
                 décochée, les Légendes de la classe gardent l'escalier, ne
                 voient pas les records et n'y apparaissent pas. -->
            <div class="sous-reglage" id="rec-reglage" hidden>
              <label><input type="checkbox" id="case-records"> 🏆 Les records</label>
              <small>Le concours de temps des Légendes des tables. Décoché : cette classe ne le voit pas et n’y apparaît pas.</small>
            </div>
            <!-- Lot « Qui voit quoi » (planche 4) : sous chaque appli, en lecture
                 seule, les élèves à qui elle est ouverte EN PLUS de la classe
                 (rempli par poserEnPlusPour, d'après le tableau déjà lu). -->
            <div class="en-plus-pour" id="en-plus-defi-tables" hidden></div>
          </div>
          <div class="activite">
            <label class="activite-tete"><input type="checkbox" data-appli="coffres"> <strong>Coffres magiques</strong></label>
            <div class="en-plus-pour" id="en-plus-coffres" hidden></div>
            <!-- Lot « Coffres magiques sur le suivi » (21/10/2026, maquettes
                 02/03 validées) : les niveaux et les opérations accessibles
                 aux élèves, tout coché par défaut (rien d'écrit), enregistrés
                 à chaque clic ; la dernière case cochée d'un groupe ne se
                 décoche pas. Les trésors déjà ouverts restent. -->
            <div class="sous-reglage" id="coffres-reglages" hidden>
              <p class="titre-sous" id="titre-coffres-niveaux">Niveaux accessibles aux élèves</p>
              <div class="cases-coffres" id="cases-coffres-niveaux" role="group" aria-labelledby="titre-coffres-niveaux">
                <label><input type="checkbox" data-niveau="1"> Niveau 1</label>
                <label><input type="checkbox" data-niveau="2"> Niveau 2</label>
                <label><input type="checkbox" data-niveau="3"> Niveau 3</label>
              </div>
              <p class="titre-sous" id="titre-coffres-operations">Opérations accessibles</p>
              <div class="cases-coffres" id="cases-coffres-operations" role="group" aria-labelledby="titre-coffres-operations">
                <label><input type="checkbox" data-operation="1"> Addition</label>
                <label><input type="checkbox" data-operation="2"> Soustraction</label>
                <label><input type="checkbox" data-operation="3"> Multiplication</label>
                <label><input type="checkbox" data-operation="4"> Division</label>
              </div>
              <div class="en-plus-pour" id="en-plus-coffres-listes" hidden></div>
            </div>
          </div>
          <!-- Lot « Qui voit quoi », lot 4b (24/10/2026) : Anzan, fermé par
               défaut (la case suit la liste de la classe, comme les autres) ;
               pas de réglage de classe. Dessous, « En plus pour : Rania ». -->
          <div class="activite">
            <label class="activite-tete"><input type="checkbox" data-appli="flash-anzan"> <strong>Anzan</strong></label>
            <div class="en-plus-pour" id="en-plus-flash-anzan" hidden></div>
          </div>
          <div class="activite">
            <label class="activite-tete"><input type="checkbox" data-appli="splat"> <strong>SPLAT!</strong></label>
            <div class="en-plus-pour" id="en-plus-splat" hidden></div>
            <!-- Lot « splat-suivi-5 » : les mondes ouverts à la classe (tous par
                 défaut). Un monde fermé reste sur la carte de l'élève, grisé,
                 avec un cadenas ; rien n'est effacé. Les six mondes de la
                 carte, dans l'ordre (un test les compare au moteur). -->
            <div class="sous-reglage" id="mondes-ouverts" hidden>
              <p class="titre-sous" id="titre-mondes-ouverts">Mondes ouverts</p>
              <div class="puces-mondes" id="puces-mondes" role="group" aria-labelledby="titre-mondes-ouverts">
                <label class="puce-monde" data-monde="1"><input type="checkbox" data-monde="1"><i aria-hidden="true">1</i>Petit</label>
                <label class="puce-monde" data-monde="2"><input type="checkbox" data-monde="2"><i aria-hidden="true">2</i>Classique</label>
                <label class="puce-monde" data-monde="3"><input type="checkbox" data-monde="3"><i aria-hidden="true">3</i>Enquête</label>
                <label class="puce-monde" data-monde="4"><input type="checkbox" data-monde="4"><i aria-hidden="true">4</i>Système</label>
                <label class="puce-monde" data-monde="5"><input type="checkbox" data-monde="5"><i aria-hidden="true">5</i>Équations</label>
                <label class="puce-monde" data-monde="6"><input type="checkbox" data-monde="6"><i aria-hidden="true">6</i>Relatifs</label>
              </div>
              <div class="en-plus-pour" id="en-plus-splat-listes" hidden></div>
            </div>
          </div>
          <p class="message" id="message-activites" hidden></p>
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
      (celle que tu gardes). Onglet Anzan : touche la ligne d’un élève, puis
      <strong>« Imprimer »</strong> dans sa fenêtre. Chaque bouton n’imprime que sa feuille.</p>
      <div class="pied-impression">
        <img src="../mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
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

<!-- Lot « Qui voit quoi » (22/10/2026, planche 2) : « Ce que voit Léa ».
     Propriétaire seulement (Q2). Le contenu est construit par
     dessinerCeQueVoit (createElement et textContent : le prénom n'est jamais
     du HTML) ; chaque case enregistre aussitôt (eleves.acces) et le message
     du pied le dit ; « Fermer » ne fait que fermer. -->
<dialog id="voit" class="voit" aria-labelledby="voit-titre">
  <div class="voit-tete">
    <h2 id="voit-titre"></h2>
    <p id="voit-sous"></p>
  </div>
  <div class="voit-liste" id="voit-liste"></div>
  <div class="voit-pied">
    <p class="message" id="voit-message" role="status" hidden></p>
    <button type="button" class="secondaire" id="voit-fermer">Fermer</button>
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
     « Revenir à… » (le « ⋯ » de la ligne) est en bas de la fenêtre. -->
<dialog id="fenetre-eleve" class="fenetre fenetre-eleve" aria-labelledby="fe-titre">
  <div class="fenetre-tete">
    <div class="naviguer">
      <button type="button" class="secondaire" id="fe-precedent" aria-label="Élève précédent" title="Élève précédent">‹</button>
      <button type="button" class="secondaire" id="fe-suivant" aria-label="Élève suivant" title="Élève suivant">›</button>
    </div>
    <h2 id="fe-titre"></h2>
    <p id="fe-sous"></p>
  </div>
  <div class="fenetre-corps">
    <div id="fe-contenu"></div>
    <!-- Anzan : ses dernières séances (l'écran « Mon historique » de l'élève). -->
    <div id="fe-anzan" hidden>
      <p class="pa-compte" id="pa-compte"></p>
      <ol class="pa-liste" id="pa-liste" aria-label="Ses dernières séances"></ol>
      <p class="pa-note" id="pa-note"></p>
      <button type="button" class="secondaire pa-plus" id="pa-plus" hidden>Voir les séances précédentes</button>
    </div>
    <p class="fe-gestes" id="fe-gestes" hidden><button type="button" class="secondaire" id="fe-revenir" title="Revenir à une version précédente de sa progression">Revenir à…</button></p>
  </div>
  <div class="fenetre-pied">
    <button type="button" class="secondaire" id="fe-fermer">Fermer</button>
    <button type="button" id="fe-parcours" title="Son écran Mon parcours, sur mathsgo.re, dans un nouvel onglet" hidden>Voir son parcours</button>
    <button type="button" id="pa-imprimer" hidden>Imprimer ces séances</button>
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
    {cle: "splat", nom: "SPLAT!", unite: ["étape", "étapes"]}
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
  // Les tris de chaque activité : ceux de Défi tables sont lus dans la page.
  // Les colonnes qui trient, par appli : celles dont le titre est un bouton
  // (serveur pro, lot 5c : plus de menu « Trier par »). Coffres : « Trésors »
  // (le total, colonne du téléphone) et chaque niveau ; Anzan : les jours.
  const TRIS = {
    "defi-tables": ["prenom", "acquises", "encours", "semaine", "retard", "date"],
    "coffres": ["prenom", "tresors", "niveau1", "niveau2", "niveau3", "date"],
    "flash-anzan": ["prenom", "calculs", "jours", "date"],
    "splat": ["prenom", "etapes", "date"]
  };
  let SPLAT = window.MathsGoSplatParcours || null;
  let chargementSplat = null;
  let COFFRES = window.MathsGoCoffresParcours || null;
  let chargementCoffres = null;
  let ANZAN = window.MathsGoFlashAnzanParcours || null;
  let chargementAnzan = null;
  // Lot 4b : l'élève dont « Le parcours de… » (Anzan) est ouvert, et combien
  // de séances on y montre (10, puis 10 de plus à chaque « Voir les séances
  // précédentes », comme l'écran « Mon historique » de l'élève).
  let parcoursAnzanEleve = null;
  let parcoursAnzanAffiches = 10;
  let appliAffichee = "defi-tables";
  // La vue sous les onglets : "appli" (le tableau de l'activité), "eleves"
  // (lot « Ma classe : élèves », 18/10/2026 : propriétaire et collègues en
  // écriture) ou "reglages" (lot « Ma classe : réglages », 17/10/2026 :
  // propriétaire seulement).
  let vue = "appli";
  // Lot « Qui voit quoi » : l'élève dont la fenêtre « Ce que voit… » est ouverte.
  let voitEleve = null;
  // Lot 3b (relecture Codex du 22/10) : les enregistrements de la fenêtre
  // partent UN PAR UN, chacun calcule son état au moment de partir — jamais
  // d'après un état qu'une réponse pas encore reçue va changer.
  // Lot 3c (seconde relecture, le soir) : la file et le compteur sont PAR
  // ÉLÈVE (voitFiles, voitAttentes, sur eleve.id) — un envoi qui traîne ne
  // grise que la fenêtre de CET élève, pas celle des autres ; et chaque envoi
  // a un délai (DELAI_ACCES_MS), passé lequel la case revient.
  // voitOuverture : le numéro de la fenêtre ouverte (un message ne va qu'à
  // la fenêtre qui a fait le clic).
  const voitFiles = new Map();
  const voitAttentes = new Map();
  let voitOuverture = 0;
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
  let idsAffiches = [];
  let demandeAppli = 0;

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
  const ZONES_TEXTE = ["corps", "corps-eleves", "fiche-corps", "fiche-titre", "bandelettes-liste",
    "bandelettes-titre", "liste-profs", "liste-partages", "fragiles-liste",
    "fragiles-sous", "titre-classe", "resume-classe", "objectif-compte", "objectif-lignes",
    "qui", "compte-qui", "boite-texte", "menu-classes-liste", "titre-classe-colle", "nom-appli", "menu-applis-liste",
    "boite-champs", "secret-texte", "secret-valeur", "echues-texte", "supprimer-echues",
    // Lot E1 : la carte « Évaluations » et ses deux boîtes.
    "evaluations-zone", "em-titre", "em-tables", "em-types", "em-grille", "eo-titre", "eo-texte", "eo-durees",
    // Lot « Qui voit quoi » : la fenêtre « Ce que voit Léa » et les lignes
    // « En plus pour » des Réglages (des prénoms).
    "voit-titre", "voit-sous", "voit-liste", "en-plus-defi-tables", "en-plus-coffres", "en-plus-coffres-listes",
    "en-plus-splat", "en-plus-splat-listes",
    // Lot 4b : Anzan — « En plus pour », ses séances et sa feuille.
    "en-plus-flash-anzan", "pa-compte", "pa-liste", "pa-note", "fa-titre", "fa-compte", "fa-corps", "fa-note",
    // Lot 5c : la fenêtre de l’élève (un prénom).
    "fe-titre", "fe-sous", "fe-contenu"];
  const ZONES_MESSAGE = ["erreur-connexion", "message-classes", "message-premiere-classe", "message-classe", "message-appli",
    "message-profs", "message-partage", "message-compte", "bandeau-droit", "bandeau-annee",
    "message-activites", "message-records", "message-evaluations", "em-message", "message-nom", "message-supprimer",
    "voit-message"];
  const CHAMPS_A_VIDER = ["identifiant", "motdepasse",
    "mdp-ancien", "mdp-nouveau", "mdp-confirme", "em-nom", "chercher-eleve"];
  const BLOCS_A_CACHER = ["fiche", "bandelettes", "objectif", "fragiles", "bloc-profs",
    "bandeau-echues", "bloc-records", "bloc-evaluations", "vue-reglages", "onglet-reglages",
    "vue-eleves", "onglet-eleves", "menu-classes"];

  function viderZones() {
    ZONES_TEXTE.forEach(id => { const noeud = $(id); if (noeud) noeud.textContent = ""; });
    ZONES_MESSAGE.forEach(id => { const noeud = $(id); if (noeud) { noeud.textContent = ""; noeud.hidden = true; } });
    CHAMPS_A_VIDER.forEach(id => { const noeud = $(id); if (noeud) noeud.value = ""; });
    BLOCS_A_CACHER.forEach(id => { const noeud = $(id); if (noeud) noeud.hidden = true; });
    ["boite", "secret", "eval-modele", "eval-ouvrir", "voit", "fenetre-eleve"].forEach(id => {
      const boite = $(id);
      if (boite && boite.open) { try { boite.close(); } catch (_) {} }
    });
    // Lot 4b-bis : plus aucune feuille prête à sortir à l'imprimante.
    quitterImpressions();
    // Lot E1 : le plein écran de la répartition, s'il est ouvert.
    const plein = $("evaluation-plein");
    if (plein && plein.parentNode) plein.parentNode.removeChild(plein);
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
    voitEleve = null;
    parcoursAnzanEleve = null;
    // Lot 4b-bis (relecture Codex) : une classe ou un onglet encore en route
    // ne sera pas posé dans la page après la déconnexion.
    demandeAppli += 1;
    // Lot 3c : un envoi encore en route ne touchera plus à rien (sa classe
    // n'est plus la classe ouverte). Ses files et compteurs ne sont PAS
    // vidés (relecture Codex du 23/10) : chaque envoi décompte lui-même son
    // attente à l'arrivée, exactement une fois — vider ici faisait décompter
    // une vieille réponse sur l'attente d'un envoi de la session suivante.
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

  function surErreur(erreur, zone) {
    if (erreur.statut === 401) { deconnecter({message: "Session terminée, reconnecte-toi."}); return; }
    messager(zoneVisible(zone) ? zone : "erreur-connexion", erreur.message, "erreur");
  }

  // ---------------------------------------------------------------- lecture d'une progression

  function lireProgression(brut) {
    const vide = {acquises: [], couronne: null,
                  semaine: 0, retard: null, parcours: null, lisible: Boolean(PARCOURS),
                  enCours: {type: "rien", texte: "—", ordre: 0, tables: [], pleines: 0, total: 10},
                  seances: 0, longue: null};
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

  // L'élève est passé aussi : SPLAT! compte sur SES mondes (lot « Qui voit
  // quoi » : classe + ajouts, eleve.acces), les autres lecteurs l'ignorent.
  function elevesLus(cle, liste) {
    const lire = cle === "splat" ? lireSplat : cle === "coffres" ? lireCoffres : cle === "flash-anzan" ? lireAnzan : lireProgression;
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
      // Anzan (lot 4b) : les calculs faits, puis les jours d'entraînement ;
      // « Dernière séance » : le jour de la dernière séance.
      if (tri.colonne === "calculs") return (eleve.lu.calculs || 0) * 1000 + (eleve.lu.jours || 0);
      if (tri.colonne === "date" && appliAffichee === "flash-anzan") return eleve.lu.dernier || "";
      if (tri.colonne === "acquises") return eleve.lu.acquises.length;
      if (tri.colonne === "encours") return eleve.lu.enCours.ordre;
      if (tri.colonne === "semaine") return eleve.lu.seances;
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
  // « Revenir à… » (serveur pro, lot 5c : en bas de la fenêtre de l'élève,
  // avant derrière le « ⋯ » de sa ligne). Le serveur garde la version d'avant
  // le dernier enregistrement ET la fin de chacune des sept dernières
  // journées : un écrasement (par quelqu'un qui avait le code, ou un
  // « Recommencer à zéro » malheureux) se répare même si on ne s'en aperçoit
  // que le lendemain. Pas en lecture seule.
  function peutRevenir(eleve) {
    return droitClasse !== "lecture" && Boolean(eleve && (eleve.restaurable || (eleve.journees || []).length));
  }

  // Dans la liste de l'onglet Élèves : ce qui concerne l'élève lui-même.
  function poserGestesEleve(eleve, cActions) {
    const boutons = [];
    // Lot « Qui voit quoi » (D5, Q2) : « Ce que voit Léa… » en premier —
    // propriétaire seulement, comme le serveur (eleves.acces).
    if (droitClasse === "proprietaire") {
      boutons.push(boutonGeste(`Ce que voit ${prenomCourt(eleve)}…`, "secondaire", () => ouvrirCeQueVoit(eleve),
        "Ce qu’il voit dans son espace, et ce que tu peux lui ouvrir en plus"));
    }
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
      // Lot « Qui voit quoi » : la colonne « En plus » (une pastille par
      // ajout effectif, « — » sinon) et, pour le téléphone, les mêmes
      // pastilles sous le prénom (la colonne y est cachée, planche 3).
      const cPlus = celluleEnPlus(eleve);
      const sous = pastillesEnPlus(eleve);
      if (sous.length) {
        const bloc = document.createElement("div");
        bloc.className = "ajouts-sous";
        bloc.append(...sous);
        cNom.append(bloc);
      }
      const cActions = document.createElement("td");
      cActions.className = "actions-eleve";
      poserGestesEleve(eleve, cActions);
      ligne.dataset.eleve = String(eleve.id);
      ligne.append(cNumero, cNom, cCode, cPlus, cActions);
      corps.appendChild(ligne);
    });
  }

  // ------------------------------------------------ qui voit quoi (lot 3, 22/10/2026)
  //
  // Conception validée par Gwenaël (qui-voit-quoi, lot 1, planches 1 à 4) :
  // ce qu'un élève voit = ce que voit sa classe + ce qu'on lui a ouvert EN
  // PLUS ; on n'enlève jamais rien à un élève. Deux portes : ⚙ Réglages pour
  // la classe, la ligne de l'élève (menu ⋯ « Ce que voit Léa… », pastilles
  // de la colonne « En plus ») pour l'exception. Le serveur range les ajouts
  // (eleve.ajouts) et CALCULE ce que voit l'élève (eleve.acces : la règle
  // « classe + ajouts » n'est écrite qu'une fois, en PHP, lib/applis.php) ;
  // la page lit `acces` pour montrer, et n'écrit que `ajouts`
  // (eleves.acces, propriétaire seulement). Tout est construit par
  // createElement et textContent : un prénom n'est jamais du HTML, et aucun
  // code d'élève n'est écrit ici.

  // Ce qu'un élève peut recevoir en plus à l'intérieur d'une appli : les
  // listes de numéros qu'elle déclare au catalogue (lib/applis.php,
  // « reglages » entiers), avec les mots des Réglages (un test les compare
  // aux puces et aux cases de la page). `mot` : comment on nomme un numéro ;
  // `seul` : le mot suffit, sans le nom de l'appli (« le monde 3 »).
  const LISTES_PAR_ELEVE = {
    "coffres": [
      {nom: "niveaux", titre: "Niveaux ouverts", mot: "niveau {n}", feminin: false, seul: false,
       numeros: [[1, "Niveau 1"], [2, "Niveau 2"], [3, "Niveau 3"]]},
      {nom: "operations", titre: "Opérations ouvertes", mot: "opération {nom}", feminin: true, seul: false,
       numeros: [[1, "Addition"], [2, "Soustraction"], [3, "Multiplication"], [4, "Division"]]}
    ],
    "splat": [
      {nom: "mondes", titre: "Mondes ouverts", mot: "monde {n}", feminin: false, seul: true,
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

  // Ce qu'un élève voit EN PLUS de sa classe — ce qu'elle ne lui donne pas
  // déjà —, appli par appli, dans l'ordre de APPLIS :
  // [{appli, entiere, listes: [{liste, numeros}]}]. `entiere` : l'appli,
  // que la classe n'a pas, lui est ouverte en entier. Un ajout rattrapé par
  // la classe (D4) ne s'y voit pas : il est gardé, pas montré.
  function enPlusDe(eleve) {
    const acces = eleve && eleve.acces;
    if (!acces || !Array.isArray(acces.applis)) return [];
    const deLaClasse = (classe && classe.applis) || [];
    const sortie = [];
    APPLIS.forEach(appli => {
      if (!acces.applis.includes(appli.cle)) return;
      const parClasse = deLaClasse.includes(appli.cle);
      const listes = [];
      (LISTES_PAR_ELEVE[appli.cle] || []).forEach(liste => {
        const pourLui = numerosOuverts(acces.reglages, appli.cle, liste);
        const pourLaClasse = parClasse ? numerosOuverts(classe.reglages, appli.cle, liste) : [];
        // La classe a déjà tout ; ou l'appli lui est ouverte entière.
        if (pourLaClasse === null || (!parClasse && pourLui === null)) return;
        const numeros = (pourLui || liste.numeros.map(([numero]) => numero)).filter(numero => !pourLaClasse.includes(numero));
        if (numeros.length) listes.push({liste, numeros});
      });
      if (!parClasse) sortie.push({appli, entiere: listes.length === 0, listes});
      else if (listes.length) sortie.push({appli, entiere: false, listes});
    });
    return sortie;
  }

  // Une pastille par ajout effectif (planche 1) : « ⚡ Coffres magiques »
  // pour une appli entière ; « ③ SPLAT! Enquête » (le numéro dans la couleur
  // du monde, comme les puces des Réglages) pour des mondes ; « Coffres
  // magiques : niveau 2 » pour des niveaux ou des opérations. Propriétaire :
  // des boutons qui ouvrent « Ce que voit… » ; collègue : du texte (Q2).
  function pastillesEnPlus(eleve) {
    const cliquable = droitClasse === "proprietaire";
    return enPlusDe(eleve).map(plus => {
      const pastille = document.createElement(cliquable ? "button" : "span");
      pastille.className = "ajout";
      if (cliquable) {
        pastille.type = "button";
        pastille.title = `En plus de sa classe — voir ou changer ce que voit ${prenomCourt(eleve)}`;
        pastille.addEventListener("click", () => ouvrirCeQueVoit(eleve));
      } else {
        pastille.title = "En plus de sa classe";
      }
      const seule = plus.listes.length === 1 ? plus.listes[0] : null;
      if (plus.entiere) {
        pastille.textContent = `⚡ ${plus.appli.nom}`;
      } else if (seule && seule.liste.nom === "mondes") {
        seule.numeros.forEach(numero => {
          const rond = document.createElement("i");
          rond.setAttribute("aria-hidden", "true");
          rond.style.background = COULEURS_MONDES[numero] || "#0b67b2";
          rond.textContent = String(numero);
          pastille.append(rond);
        });
        const nomMonde = seule.numeros.length === 1 ? ` ${motDeMonde(seule.liste, seule.numeros[0])}` : "";
        pastille.append(document.createTextNode(`${plus.appli.nom}${nomMonde}`));
        pastille.setAttribute("aria-label", `${plus.appli.nom} : ${seule.numeros.map(numero => motDe(seule.liste, numero)).join(", ")} en plus`);
      } else {
        pastille.textContent = `${plus.appli.nom} : `
          + plus.listes.map(({liste, numeros}) => numeros.map(numero => motDe(liste, numero)).join(", ")).join(", ");
      }
      return pastille;
    });
  }

  // « Enquête » : le nom court d'un monde (celui des puces).
  function motDeMonde(liste, numero) {
    const trouve = liste.numeros.find(([n]) => n === numero);
    return trouve ? trouve[1] : "";
  }

  function celluleEnPlus(eleve) {
    const cellule = document.createElement("td");
    cellule.className = "en-plus";
    const pastilles = pastillesEnPlus(eleve);
    if (pastilles.length) {
      cellule.append(...pastilles);
    } else {
      const vide = document.createElement("span");
      vide.className = "vide";
      vide.textContent = "—";
      vide.title = "Rien de plus que sa classe";
      cellule.append(vide);
    }
    return cellule;
  }

  // Les ajouts après un geste dans la fenêtre — l'état COMPLET que la page
  // envoie (eleves.acces remplace la colonne entière, comme ⚙ Réglages
  // envoie la liste des mondes). Jamais de liste vide, jamais « [] » : pour
  // le serveur (PHP), {"splat": []} et {"splat": {}} sont la même chose —
  // SPLAT! ENTIÈRE (relevé par Code à l'application du lot 2). Donc :
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

  // « Enregistré : Léa voit Coffres magiques. », « Enregistré : le monde 3
  // est ouvert à Lucas. » (planche 2).
  function texteEnregistre(eleve, geste) {
    const prenom = prenomCourt(eleve);
    const appli = APPLIS.find(une => une.cle === geste.cle) || {nom: geste.cle};
    if (geste.liste === undefined) {
      return geste.ouvre ? `Enregistré : ${prenom} voit ${appli.nom}.` : `Enregistré : ${prenom} ne voit plus ${appli.nom}.`;
    }
    const liste = (LISTES_PAR_ELEVE[geste.cle] || []).find(une => une.nom === geste.liste);
    if (!liste) return "Enregistré.";
    const e = liste.feminin ? "e" : "";
    const quoi = `${liste.feminin ? "l’" : "le "}${motDe(liste, geste.numero)}${liste.seul ? "" : ` ${deNom(appli.nom)}`}`;
    return geste.ouvre ? `Enregistré : ${quoi} est ouvert${e} à ${prenom}.` : `Enregistré : ${quoi} n’est plus ouvert${e} à ${prenom}.`;
  }

  function ouvrirCeQueVoit(eleve) {
    if (!classe || droitClasse !== "proprietaire" || !eleve) return;
    voitEleve = eleve;
    voitOuverture += 1;
    messager("voit-message", "", "");
    dessinerCeQueVoit();
    const boite = $("voit");
    if (!boite.open) boite.showModal();
  }

  // Fermée (bouton ou Échap), la fenêtre oublie l'élève et ses prénoms. Un
  // enregistrement encore en route continue : sa réponse mettra à jour la
  // ligne de l'élève, sans rien réécrire dans la fenêtre fermée.
  function fermerCeQueVoit() {
    voitEleve = null;
    voitOuverture += 1;
    ["voit-titre", "voit-sous", "voit-liste"].forEach(id => { $(id).textContent = ""; });
    messager("voit-message", "", "");
  }

  // La fenêtre (planche 2) : toutes les applis que la page sait montrer, une
  // ligne chacune — par la classe : cochée, grisée, « par la classe » ; par
  // un ajout : cochée, « en plus » ; le reste à cocher. Sous une appli que la
  // classe a, ses mondes / niveaux / opérations : ceux de la classe grisés,
  // les autres à cocher un par un. Une appli que la classe n'a pas s'ouvre
  // ENTIÈRE (D3) : pas de puces. `garder` : la case à refocaliser après un
  // enregistrement (la fenêtre est redessinée).
  function dessinerCeQueVoit(garder) {
    const eleve = voitEleve;
    if (!eleve) return;
    const prenom = prenomCourt(eleve);
    $("voit-titre").textContent = `Ce que voit ${prenom}`;
    const sous = $("voit-sous");
    sous.textContent = "";
    const enPlus = document.createElement("b");
    enPlus.textContent = "en plus";
    sous.append(`Sa classe (${classe.libelle}) décide, et tu peux lui ouvrir des choses `, enPlus,
      `. Rien ne lui est retiré : ce que la classe a, ${prenom} l’a.`);
    const zone = $("voit-liste");
    zone.textContent = "";
    zone.setAttribute("aria-busy", "false");
    const acces = accesDe(eleve);
    const deLaClasse = (classe && classe.applis) || [];
    let aFocaliser = null;
    APPLIS.forEach(appli => {
      const parClasse = deLaClasse.includes(appli.cle);
      const pourLui = acces.applis.includes(appli.cle);
      const bloc = document.createElement("div");
      bloc.className = parClasse ? "activite par-classe" : "activite";
      const tete = document.createElement("label");
      tete.className = "activite-tete";
      const caseAppli = document.createElement("input");
      caseAppli.type = "checkbox";
      caseAppli.checked = parClasse || pourLui;
      caseAppli.disabled = parClasse;
      caseAppli.dataset.appli = appli.cle;
      const nom = document.createElement("span");
      const fort = document.createElement("strong");
      fort.textContent = appli.nom;
      nom.append(fort);
      tete.append(caseAppli, nom);
      if (parClasse || pourLui) {
        const etiquette = document.createElement("span");
        etiquette.className = parClasse ? "tag" : "tag plus";
        etiquette.textContent = parClasse ? "par la classe" : "en plus";
        tete.append(etiquette);
      }
      if (!parClasse) {
        caseAppli.addEventListener("change", () => changerCeQueVoit({cle: appli.cle, ouvre: caseAppli.checked}, caseAppli));
        if (garder && garder.cle === appli.cle && garder.liste === undefined) aFocaliser = caseAppli;
      }
      bloc.append(tete);
      const listes = LISTES_PAR_ELEVE[appli.cle] || [];
      if (parClasse && listes.length) {
        const dessous = document.createElement("div");
        dessous.className = "sous-reglage";
        listes.forEach(liste => {
          const pourLaClasse = numerosOuverts(classe.reglages, appli.cle, liste);
          const ouvertsLui = numerosOuverts(acces.reglages, appli.cle, liste);
          const titre = document.createElement("p");
          titre.className = "titre-sous";
          titre.id = `voit-${appli.cle}-${liste.nom}`;
          titre.textContent = liste.titre;
          const groupe = document.createElement("div");
          groupe.className = appli.cle === "splat" ? "puces-mondes" : "cases-coffres";
          groupe.setAttribute("role", "group");
          groupe.setAttribute("aria-labelledby", titre.id);
          liste.numeros.forEach(([numero, libelle]) => {
            const deClasse = !pourLaClasse || pourLaClasse.includes(numero);
            const ouvert = deClasse || !ouvertsLui || ouvertsLui.includes(numero);
            const etiquette = document.createElement("label");
            const caseNumero = document.createElement("input");
            caseNumero.type = "checkbox";
            caseNumero.checked = ouvert;
            caseNumero.disabled = deClasse;
            caseNumero.dataset.liste = liste.nom;
            caseNumero.dataset.numero = String(numero);
            if (appli.cle === "splat") {
              etiquette.className = `puce-monde ${deClasse ? "classe" : ouvert ? "plus" : "ferme"}`;
              etiquette.dataset.monde = String(numero);
              const rond = document.createElement("i");
              rond.setAttribute("aria-hidden", "true");
              rond.textContent = String(numero);
              etiquette.append(caseNumero, rond, libelle);
            } else {
              etiquette.className = deClasse ? "classe" : "";
              etiquette.append(caseNumero, ` ${libelle}`);
            }
            if (deClasse) {
              etiquette.title = "Ouvert par la classe";
            } else {
              caseNumero.addEventListener("change", () =>
                changerCeQueVoit({cle: appli.cle, liste: liste.nom, numero, ouvre: caseNumero.checked}, caseNumero));
              if (garder && garder.cle === appli.cle && garder.liste === liste.nom && garder.numero === numero) aFocaliser = caseNumero;
            }
            groupe.append(etiquette);
          });
          dessous.append(titre, groupe);
        });
        bloc.append(dessous);
      } else if (!parClasse && pourLui) {
        // Un ajout gardé alors que la classe a perdu l'appli (D4) peut ne
        // nommer que certains numéros : on le dit, sans puces (D3).
        const restreint = listes.map(liste => {
          const numeros = numerosOuverts(acces.reglages, appli.cle, liste);
          return numeros ? numeros.map(numero => motDe(liste, numero)).join(", ") : "";
        }).filter(Boolean);
        if (restreint.length) {
          const petit = document.createElement("small");
          petit.textContent = `Seulement : ${restreint.join(" · ")}`;
          nom.append(petit);
        }
      }
      zone.append(bloc);
    });
    // Un enregistrement de CET élève est encore en route (fenêtre rouverte
    // entre-temps) : tout reste grisé jusqu'à sa réponse, qui redessine la
    // fenêtre. Celle d'un autre élève n'attend rien (lot 3c).
    if (voitEnAttenteDe(eleve) > 0) {
      [...zone.querySelectorAll("input")].forEach(uneCase => { uneCase.disabled = true; });
      zone.setAttribute("aria-busy", "true");
      return;
    }
    if (aFocaliser) aFocaliser.focus();
  }

  function voitEnAttenteDe(eleve) {
    return voitAttentes.get(eleve.id) || 0;
  }

  // Chaque clic enregistre (eleves.acces) : la page envoie TOUT l'état
  // (ajoutsApres) ; le serveur répond le rangé et le calculé, que la page
  // reporte sur l'élève dans toutes les listes déjà lues. En cas d'erreur,
  // la case revient en arrière et le pied de la fenêtre le dit (comme les
  // puces des mondes des Réglages).
  //
  // Lot 3b (relecture Codex du 22/10/2026) : décocher le monde 4, fermer,
  // rouvrir AVANT la réponse puis cocher le 5 envoyait [3, 4, 5] — la
  // seconde fenêtre partait de l'état d'avant la première réponse, et le
  // monde 4 retiré était rouvert. Désormais les enregistrements font la queue
  // et chacun calcule l'état complet au moment de partir, d'après ce que le
  // serveur a répondu au précédent ; la fenêtre reste grisée tant qu'un
  // enregistrement est en route.
  //
  // Lot 3c (seconde relecture Codex, le soir) : la queue ne suffit pas quand
  // ce que la page croit savoir est FAUX — une réponse perdue en route (le
  // serveur a écrit, la page ne l'a pas su) ou un second onglet sur le même
  // élève. La page envoie donc aussi « avant », l'état rangé tel qu'elle le
  // connaît, et le serveur n'écrit que si c'est encore le sien ; sinon il
  // répond 409 avec l'état vrai, que la page reporte et redessine — le clic
  // est à refaire, rien n'a été rouvert. La file et le compteur sont par
  // élève ; l'attente est bornée (DELAI_ACCES_MS) ; une réponse arrivée après
  // « Se déconnecter » ou après un changement de classe n'est pas traitée.
  function changerCeQueVoit(geste, caseCochee) {
    const eleve = voitEleve;
    if (!eleve || !classe) return Promise.resolve();
    const ouverture = voitOuverture;
    const classeDepart = classe;
    voitAttentes.set(eleve.id, voitEnAttenteDe(eleve) + 1);
    const zone = $("voit-liste");
    [...zone.querySelectorAll("input")].forEach(uneCase => { uneCase.disabled = true; });
    zone.setAttribute("aria-busy", "true");
    const file = voitFiles.get(eleve.id) || Promise.resolve();
    const tour = file.then(() => envoyerCeQueVoit(eleve, geste, caseCochee, ouverture, classeDepart));
    voitFiles.set(eleve.id, tour.catch(() => {}));
    return tour;
  }

  async function envoyerCeQueVoit(eleve, geste, caseCochee, ouverture, classeDepart) {
    let erreurRecue = null;
    let etatRecu = null;
    const garde = new AbortController();
    const minuteur = setTimeout(() => garde.abort(), DELAI_ACCES_MS);
    try {
      // « avant » : ce que le serveur a rangé, tel qu'il l'a rendu (tableau ou
      // réponse précédente) — pas recalculé, pas nettoyé.
      const avant = eleve.ajouts || {};
      const ajouts = ajoutsApres(eleve.ajouts, geste);
      const reponse = await api("eleves.acces", {eleve_id: eleve.id, avant, ajouts}, {signal: garde.signal});
      etatRecu = {ajouts: reponse.ajouts || {}, acces: reponse.acces || null};
    } catch (erreur) {
      erreurRecue = erreur;
      // Délai dépassé, ou le navigateur n'a pas pu joindre le serveur
      // (TypeError « Failed to fetch ») : dans les deux cas le serveur a
      // peut-être écrit — même conseil, en français.
      if (erreur.name === "AbortError" || erreur.name === "TypeError") {
        erreurRecue = new Error(`Le serveur n’a pas répondu : recharge la page pour vérifier les accès ${deNom(prenomCourt(eleve))} avant de recommencer.`);
        erreurRecue.statut = 0;
      } else if (erreur.statut === 409 && erreur.donnees && erreur.donnees.ajouts) {
        // L'état vrai est dans le refus : la page le prend, comme une réponse.
        etatRecu = {ajouts: erreur.donnees.ajouts, acces: erreur.donnees.acces || null};
      }
    } finally {
      clearTimeout(minuteur);
      voitAttentes.set(eleve.id, Math.max(0, voitEnAttenteDe(eleve) - 1));
    }
    // Une autre session, une autre classe (ou la même, rouverte : son tableau
    // a été relu) : cette réponse ne vaut plus rien, on ne reporte rien. Mais
    // si une fenêtre est ouverte sur ce même élève (relu, donc un autre
    // objet), elle attendait cet envoi : on la redessine, pour qu'elle se
    // libère dès que plus rien n'est en route (relecture Codex du 23/10 :
    // elle restait grisée pour de bon).
    if (classe !== classeDepart) {
      if ($("voit").open && voitEleve && voitEleve.id === eleve.id) dessinerCeQueVoit();
      return;
    }
    if (etatRecu) reporterAcces(eleve, etatRecu.ajouts, etatRecu.acces);
    // Le message d'un enregistrement ne va qu'à la fenêtre qui a fait le
    // clic, encore ouverte ; celui d'une erreur, à la fenêtre de CET élève si
    // elle est ouverte (rouverte ou non), sinon sous les boutons d'Élèves.
    const memeEleve = $("voit").open && voitEleve === eleve;
    const memeFenetre = memeEleve && voitOuverture === ouverture;
    if (erreurRecue && memeFenetre) caseCochee.checked = !caseCochee.checked;
    // La fenêtre de l'élève, si elle est ouverte, suit ce que le serveur a rangé.
    if (memeEleve) dessinerCeQueVoit(!erreurRecue && memeFenetre ? geste : undefined);
    if (erreurRecue) {
      surErreur(erreurRecue, memeEleve ? "voit-message" : "message-classe");
    } else if (memeFenetre) {
      messager("voit-message", texteEnregistre(eleve, geste), "ok");
    }
  }

  // Un élève est le même dans toutes les activités : ses ajouts et ce qu'il
  // voit valent pour les listes déjà lues (SPLAT! recompte ses mondes), puis
  // l'onglet Élèves et les lignes « En plus pour » des Réglages suivent.
  function reporterAcces(eleve, ajouts, acces) {
    eleve.ajouts = ajouts;
    eleve.acces = acces;
    Object.keys(tableaux).forEach(cle => {
      (tableaux[cle] || []).forEach(autre => {
        if (autre.id !== eleve.id) return;
        autre.ajouts = ajouts;
        autre.acces = acces;
        if (cle === "splat") autre.lu = lireSplat(autre.parcours, autre);
      });
    });
    redessin.demander();
    poserEnPlusPour();
    // Lot 4b : une appli donnée (ou retirée) en plus fait apparaître (ou
    // disparaître) son onglet ; si c'était l'onglet affiché, on passe au
    // premier qui reste.
    const presentes = poserOnglets();
    if (presentes.length && !presentes.includes(appliAffichee)) afficherAppli(presentes[0]);
  }

  // ⚙ Réglages (planche 4) : sous chaque appli, en LECTURE SEULE, à qui elle
  // est ouverte en plus de la classe — « En plus pour Rania, Alice » (l'appli
  // entière) ou, sous les mondes / niveaux, « En plus pour monde 3 : Lucas,
  // Alice ». Chaque prénom mène à sa ligne de l'onglet Élèves, la seule porte
  // pour modifier. Lu dans le tableau déjà chargé : aucun appel de plus.
  function poserEnPlusPour() {
    const deLaClasse = (classe && classe.applis) || [];
    const ordre = ordreDeLaFeuille(eleves || []);
    const proprietaire = droitClasse === "proprietaire";
    APPLIS.forEach(appli => {
      const listes = LISTES_PAR_ELEVE[appli.cle] || [];
      const tete = $(`en-plus-${appli.cle}`);
      const dessous = listes.length ? $(`en-plus-${appli.cle}-listes`) : null;
      [tete, dessous].forEach(zone => { if (zone) { zone.textContent = ""; zone.hidden = true; } });
      if (!proprietaire || !tete) return;
      const entiers = [];
      const parNumero = new Map();
      ordre.forEach((eleve, index) => {
        enPlusDe(eleve).filter(plus => plus.appli.cle === appli.cle).forEach(plus => {
          if (!deLaClasse.includes(appli.cle)) {
            const precision = plus.listes.map(({liste, numeros}) => numeros.map(numero => motDe(liste, numero)).join(", ")).join(", ");
            entiers.push({eleve, numero: index + 1, precision});
            return;
          }
          plus.listes.forEach(({liste, numeros}) => numeros.forEach(numero => {
            const cle = `${liste.nom}:${numero}`;
            if (!parNumero.has(cle)) parNumero.set(cle, []);
            parNumero.get(cle).push({eleve, numero: index + 1, precision: ""});
          }));
        });
      });
      if (entiers.length) {
        tete.append(ligneEnPlusPour("", entiers));
        tete.hidden = false;
      }
      if (dessous) {
        listes.forEach(liste => liste.numeros.forEach(([numero]) => {
          const qui = parNumero.get(`${liste.nom}:${numero}`);
          if (!qui) return;
          dessous.append(ligneEnPlusPour(motDe(liste, numero), qui));
          dessous.hidden = false;
        }));
      }
    });
  }

  function ligneEnPlusPour(quoi, qui) {
    const ligne = document.createElement("span");
    const titre = document.createElement("b");
    titre.textContent = "En plus pour";
    ligne.append(titre, quoi ? ` ${quoi} : ` : " ");
    qui.forEach(({eleve, numero, precision}, rang) => {
      if (rang) ligne.append(", ");
      const lien = document.createElement("button");
      lien.type = "button";
      lien.textContent = nomAffiche(eleve) || `n° ${numero} (sans prénom)`;
      lien.title = "Aller à sa ligne dans l’onglet Élèves";
      lien.addEventListener("click", () => allerALEleve(eleve.id));
      ligne.append(lien);
      if (precision) ligne.append(` (${precision})`);
    });
    return ligne;
  }

  // Un prénom de « En plus pour » : l'onglet Élèves, sa ligne au milieu de
  // l'écran, surlignée un instant, et le focus sur son « ⋯ ».
  function allerALEleve(id) {
    ouvrirEleves();
    const ligne = [...document.querySelectorAll("#corps-eleves tr")].find(tr => tr.dataset.eleve === String(id));
    if (!ligne) return;
    ligne.scrollIntoView({block: "center"});
    ligne.classList.add("repere");
    window.setTimeout(() => ligne.classList.remove("repere"), 2000);
    const poignee = ligne.querySelector("summary");
    if (poignee) poignee.focus({preventScroll: true});
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

      // Les séances de la semaine, et l'élève qu'on ne voit plus.
      const cSemaine = document.createElement("td");
      const seances = document.createElement("span");
      seances.className = eleve.lu.seances ? "seances" : "seances zero";
      seances.textContent = eleve.lu.parcours ? String(eleve.lu.seances) : "—";
      cSemaine.append(seances);
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

      // Serveur pro, lot 5c : plus de bouton « Parcours » sur la ligne — la
      // ligne entière ouvre la fenêtre de l'élève, où « Voir son parcours »
      // ouvre l'écran Mon parcours (voirFiche, billet de lecture). Au
      // téléphone, trois colonnes : l'élève, les tables passées, le jour.
      [cEnCours, cSemaine, cRetard].forEach(large);
      ligne.append(cNom, cAcquises, cEnCours, cSemaine, cRetard, cDate);
      finirLigne(ligne, eleve, cNom);
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

  // Une cellule cachée au téléphone (le tableau compact garde trois colonnes).
  function large(cellule) {
    cellule.className = cellule.className ? `${cellule.className} large` : "large";
  }

  // La fin de chaque ligne d'élève, dans les quatre applis : la ligne entière
  // ouvre la fenêtre de l'élève (choix de Gwenaël, planche 4 du 25/10/2026).
  // Le prénom devient un bouton — le clavier y arrive, Entrée l'ouvre — et une
  // flèche « › » dit qu'on peut entrer (cachée au téléphone). Le prénom reste
  // posé par textContent.
  function finirLigne(ligne, eleve, cNom) {
    ligne.className = "cliquable";
    ligne.dataset.eleve = String(eleve.id);
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "lien-eleve";
    bouton.textContent = cNom.textContent;
    cNom.textContent = "";
    cNom.append(bouton);
    const va = document.createElement("td");
    va.className = "va";
    va.setAttribute("aria-hidden", "true");
    va.textContent = "›";
    ligne.append(va);
    ligne.addEventListener("click", () => ouvrirFenetreEleve(eleve));
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
  // tableau à l'écran. Tout est lu dans le tableau déjà chargé : aucun appel
  // au serveur pour l'ouvrir (« Voir son parcours » de Défi tables demande son
  // billet de lecture, comme avant, au moment du clic). Rien de ce que
  // renvoie le serveur ne devient du HTML ; aucun code d'élève.

  function ouvrirFenetreEleve(eleve) {
    if (!classe || !eleve) return;
    fenetreEleveId = eleve.id;
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
    ["fe-titre", "fe-sous", "fe-contenu"].forEach(id => { const zone = $(id); if (zone) zone.textContent = ""; });
  }

  function eleveDeLaFenetre() {
    return eleves.find(eleve => eleve.id === fenetreEleveId) || null;
  }

  // ‹ (pas = -1) et › (pas = +1) : l'élève voisin dans le tableau à l'écran.
  function voisinDeLaFenetre(pas) {
    const rang = idsAffiches.indexOf(fenetreEleveId);
    if (rang < 0) return null;
    const id = idsAffiches[rang + pas];
    return id === undefined ? null : eleves.find(eleve => eleve.id === id) || null;
  }

  function changerEleveDeLaFenetre(pas) {
    const autre = voisinDeLaFenetre(pas);
    if (!autre) return;
    const touche = document.activeElement;
    fenetreEleveId = autre.id;
    dessinerFenetreEleve();
    // Au bout du tableau, la flèche qui a le focus se désactive : le focus
    // passe à l'autre flèche, sinon il sort de la fenêtre et le clavier
    // ne la fait plus défiler.
    if (touche && touche.disabled && (touche.id === "fe-precedent" || touche.id === "fe-suivant")) {
      $(touche.id === "fe-precedent" ? "fe-suivant" : "fe-precedent").focus();
    }
  }

  function dessinerFenetreEleve() {
    const eleve = eleveDeLaFenetre();
    if (!eleve || !classe) { fermerFenetreEleve(); return; }
    const appli = APPLIS.find(a => a.cle === appliAffichee) || APPLIS[0];
    $("fe-titre").textContent = nomAffiche(eleve) || "Élève sans prénom";
    const rang = idsAffiches.indexOf(eleve.id);
    $("fe-sous").textContent = `${appli.nom} · ${classe.libelle}`
      + (rang >= 0 && idsAffiches.length > 1 ? ` · ${rang + 1} sur ${idsAffiches.length}` : "");
    $("fe-precedent").disabled = !voisinDeLaFenetre(-1);
    $("fe-suivant").disabled = !voisinDeLaFenetre(1);
    const zone = $("fe-contenu");
    zone.textContent = "";
    const anzan = appliAffichee === "flash-anzan" && Boolean(ANZAN);
    $("fe-anzan").hidden = !anzan;
    $("fe-parcours").hidden = true;
    $("pa-imprimer").hidden = true;
    if (anzan) {
      // Un autre élève : sa liste repart à 10 séances.
      if (!parcoursAnzanEleve || parcoursAnzanEleve.id !== eleve.id) ouvrirParcoursAnzan(eleve);
      else { parcoursAnzanEleve = eleve; dessinerParcoursAnzan(); }
    } else {
      fermerParcoursAnzan();
      if (appliAffichee === "splat") zone.append(contenuSplat(eleve));
      else if (appliAffichee === "coffres") zone.append(contenuCoffres(eleve));
      else if (appliAffichee === "flash-anzan") zone.append(paragrapheVide("Le moteur d’Anzan n’a pas pu être chargé."));
      else {
        zone.append(contenuDefiTables(eleve));
        $("fe-parcours").hidden = !(eleve.lu && eleve.lu.parcours);
      }
    }
    $("fe-gestes").hidden = !peutRevenir(eleve);
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

  // Défi tables dans la fenêtre (maquette 8) : les cinq chiffres de la ligne,
  // les alertes, ses neuf tables (passées en vert, en cours encadrée), et ses
  // calculs en retard — écrits : au téléphone, pas d'info-bulle.
  function contenuDefiTables(eleve) {
    const bloc = document.createElement("div");
    const lu = eleve.lu || {};
    if (!PARCOURS) { bloc.append(paragrapheVide("Le moteur de Défi tables n’a pas pu être chargé.")); return bloc; }
    if (!lu.parcours) { bloc.append(paragrapheVide("Rien reçu pour l’instant.")); return bloc; }
    const enCours = lu.enCours || {type: "rien", texte: "—"};
    let texteEnCours = enCours.texte;
    let precision = "";
    if (enCours.type === "table") {
      texteEnCours = `table de ${enCours.tables[0]}`;
      precision = `${enCours.pleines} sur ${enCours.total}`;
    } else if (enCours.type === "expert" && lu.couronne) {
      precision = "Légende des tables";
    }
    if (eleve.record && Number.isInteger(eleve.record.meilleur) && PARCOURS.formatTemps) {
      precision = [precision, `record : ${PARCOURS.formatTemps(eleve.record.meilleur)}`].filter(Boolean).join(" · ");
    }
    const retard = lu.retard ? lu.retard.length : null;
    bloc.append(ficheChiffres([
      ["Tables passées", `${lu.acquises.length} / ${PARCOURS.TABLES.length}`],
      ["En cours", texteEnCours, precision],
      ["Cette semaine", `${lu.seances} séance${lu.seances > 1 ? "s" : ""}`],
      ["En retard", retard === null ? "—" : `${retard} calcul${retard > 1 ? "s" : ""}`],
      ["Dernière activité", dateLisible(eleve.maj_le) || "rien reçu"]
    ]));
    const alertes = [];
    if (lu.longue) alertes.push(`${lu.longue.seances} séances sur la table de ${lu.longue.table}`);
    const absence = joursSansRien(eleve);
    if (absence !== null) alertes.push(`rien depuis ${absence} jours`);
    if (alertes.length) {
      const ligne = document.createElement("p");
      ligne.className = "fe-alertes";
      alertes.forEach(texte => {
        const alerte = document.createElement("span");
        alerte.className = "alerte";
        alerte.textContent = texte;
        ligne.append(alerte);
      });
      bloc.append(ligne);
    }
    const titre = document.createElement("h3");
    titre.textContent = "Ses tables";
    const cases = document.createElement("ul");
    cases.className = "cases-tables";
    const enCoursTables = enCours.type === "table" ? [enCours.tables[0]]
      : enCours.type === "tables" ? (enCours.tables || []) : [];
    PARCOURS.TABLES.forEach(table => {
      const caseTable = document.createElement("li");
      const passee = lu.acquises.includes(table);
      const encours = !passee && enCoursTables.includes(table);
      caseTable.className = passee ? "passee" : encours ? "encours" : "";
      caseTable.textContent = String(table);
      caseTable.setAttribute("aria-label", `table de ${table} : ${passee ? "passée" : encours ? "en cours" : "pas encore passée"}`);
      cases.append(caseTable);
    });
    const legende = document.createElement("p");
    legende.className = "aide";
    legende.textContent = "En vert : passée · encadrée : en cours.";
    bloc.append(titre, cases, legende);
    if (retard) {
      const titreRetard = document.createElement("h3");
      titreRetard.textContent = `Ses calculs en retard (${retard})`;
      const liste = document.createElement("ul");
      liste.className = "fe-retard";
      lu.retard.forEach(cle => {
        const item = document.createElement("li");
        item.className = "pastille orange";
        item.textContent = PARCOURS.libelleFait(cle);
        liste.append(item);
      });
      bloc.append(titreRetard, liste);
    }
    return bloc;
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
  function finirOnglet(lignes) {
    if (parLaClasse(appliAffichee)) return;
    $("objectif").hidden = true;
    $("fragiles").hidden = true;
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
    if (!PARCOURS || !PARCOURS.fragilesDeLaClasse) { bloc.hidden = true; return; }
    const parcoursDeLaClasse = eleves.map(eleve => eleve.lu.parcours).filter(Boolean);
    const fragiles = PARCOURS.fragilesDeLaClasse(parcoursDeLaClasse, {max: Infinity})
      .filter(fragile => fragile.eleves >= SEUIL_FRAGILES).slice(0, 6);
    if (!fragiles.length) { bloc.hidden = true; return; }
    $("fragiles-sous").textContent =
      `Sur ${parcoursDeLaClasse.length} élèves qui ont commencé · ${SEUIL_FRAGILES} élèves au moins par calcul.`;
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
        const caseEtape = document.createElement("span");
        caseEtape.className = ["et", bonus ? "bonus" : "", CASES_ETAPE[etats[etape[0]]] || ""].filter(Boolean).join(" ");
        caseEtape.textContent = String(etape[1]);
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

  function celluleNiveau(niveau) {
    const cellule = document.createElement("td");
    cellule.className = "tresors";
    if (!niveau || !niveau.tresors) {
      cellule.textContent = "—";
      cellule.classList.add("sans");
      return cellule;
    }
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
    cellule.append(ficheChiffres([
      ["Trésors", `${tresors} trésor${tresors > 1 ? "s" : ""}`, lu.parfaits ? `dont ${lu.parfaits} parfait${lu.parfaits > 1 ? "s" : ""}` : ""],
      ...[1, 2, 3].map(numero => {
        const niveau = niveaux.find(n => n.numero === numero);
        if (!niveau || !niveau.tresors) return [`Niveau ${numero}`, "—"];
        return [`Niveau ${numero}`, `${niveau.tresors} trésor${niveau.tresors > 1 ? "s" : ""}`,
          niveau.parfaits > 0 ? `dont ${niveau.parfaits} parfait${niveau.parfaits > 1 ? "s" : ""}` : ""];
      }),
      ["Dernier trésor", jourCourt(lu.dernier) || "—"]
    ]));
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

  function dessinerTableauCoffres(corps, ecriture, lignes = eleves) {
    $("fragiles").hidden = true;
    $("objectif").hidden = true;
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
      // leur total, « Trésors » (colonne du téléphone seulement).
      const cTresors = document.createElement("td");
      cTresors.className = "seul-telephone";
      const tresors = eleve.lu.tresors || 0;
      if (eleve.lu.lisible && tresors) cTresors.textContent = `${tresors} trésor${tresors > 1 ? "s" : ""}`;
      else { cTresors.textContent = "—"; cTresors.className = "seul-telephone sans"; }
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
      const cCalculs = document.createElement("td");
      const cJours = document.createElement("td");
      if (lu.commence) {
        const compte = document.createElement("b");
        compte.textContent = `${lu.calculs} calcul${lu.calculs > 1 ? "s" : ""}`;
        cCalculs.append(compte);
        cJours.textContent = `${lu.jours} jour${lu.jours > 1 ? "s" : ""}`;
      } else {
        cCalculs.textContent = "—";
        cCalculs.className = "sans";
        cJours.textContent = "—";
        cJours.className = "sans";
      }
      const cDate = document.createElement("td");
      const quand = jourCourt(lu.dernier);
      cDate.textContent = quand || "—";
      if (!quand) cDate.className = "sans";

      // Lot 5c : plus de « Parcours » — la ligne ouvre la fenêtre de l'élève,
      // avec ses dernières séances. Au téléphone, les jours se cachent.
      large(cJours);
      ligne.append(cNom, cCalculs, cJours, cDate);
      finirLigne(ligne, eleve, cNom);
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

  // « + et − · 3 chiffres · 8 nombres · 20 s » : les réglages d'une séance,
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
    if (mode === "flash") morceaux.push(`${String(Math.round(r.temps) / 10).replace(".", ",")}\u00a0s`);
    else if (r.limite) morceaux.push(`${r.limite}\u00a0s`);
    return morceaux.join(" · ");
  }

  // Ce que disent la fenêtre et sa feuille, lu une fois : le titre, le
  // compte (« 106 calculs · 10 jours d'entraînement », la phrase de la tuile
  // de l'élève, rendue par le moteur), les `combien` dernières séances (10 au
  // départ), combien il y en a en tout quand il y en a plus, et combien il en
  // reste à montrer.
  function parcoursAnzanDe(eleve, aujourdhui, combien = 10) {
    const lu = (eleve && eleve.lu) || {};
    const prenom = prenomCourt(eleve);
    const toutes = lu.historique || lu.dernieres || [];
    const seances = toutes.slice(0, combien).map(s => ({
      jour: jourAnzan(s.jour, aujourdhui),
      mode: s.mode === "flash" ? "⚡ Flash" : "📝 Colonne",
      reglages: reglagesAnzan(s.mode, s.reglages || {}),
      score: `${s.score}/${s.faits}`,
      arretee: Boolean(s.arretee)
    }));
    return {
      titre: `Le parcours ${deNom(prenom)}`,
      compte: lu.texte || `${prenom[0].toUpperCase()}${prenom.slice(1)} n’a pas encore fait de séance.`,
      seances,
      note: lu.seances > seances.length ? `Les ${seances.length} dernières séances, sur ${lu.seances}.` : "",
      reste: Math.max(0, toutes.length - seances.length)
    };
  }

  // Serveur pro, lot 5c : les séances vivent dans la fenêtre de l'élève (le
  // bloc « fe-anzan ») ; ouvrir le parcours d'un élève, c'est repartir à ses
  // dix dernières séances. La fenêtre elle-même s'ouvre par sa ligne.
  function ouvrirParcoursAnzan(eleve) {
    if (!classe || !eleve || !ANZAN) return;
    parcoursAnzanEleve = eleve;
    parcoursAnzanAffiches = 10;
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
    const vu = parcoursAnzanDe(eleve, undefined, parcoursAnzanAffiches);
    $("pa-compte").textContent = vu.compte;
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
    ["pa-compte", "pa-liste", "pa-note"].forEach(id => { $(id).textContent = ""; });
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
    // Les séances que montre la fenêtre (10, ou plus après « Voir les séances précédentes »).
    const vu = parcoursAnzanDe(eleve, undefined, parcoursAnzanAffiches);
    $("fa-titre").textContent = vu.titre;
    $("fa-compte").textContent = vu.compte;
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
      ["fa-titre", "fa-compte", "fa-corps", "fa-note"].forEach(id => { $(id).textContent = ""; });
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
  const MODES_IMPRESSION = ["imprime-recap", "imprime-bandelettes", "imprime-anzan"];
  let numeroImpression = 0;
  function quitterImpressions() {
    MODES_IMPRESSION.forEach(mode => document.body.classList.remove(mode));
    ["fa-titre", "fa-compte", "fa-corps", "fa-note"].forEach(id => { const noeud = $(id); if (noeud) noeud.textContent = ""; });
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
    try {
      const faits = await api("classes.supprimer_echues", {classes: liste.map(classe => classe.id)});
      const partis = faits.supprimees || [];
      // Lot 5d : on reste dans la classe ouverte — sauf si elle était du lot.
      await allerDansUneClasse(classe && classe.id);
      messager(zoneClasses(),
        `${partis.length} classe${partis.length > 1 ? "s" : ""} supprimée${partis.length > 1 ? "s" : ""} `
        + `(${partis.join(", ")}). Il n’en reste rien.`, "ok");
    } catch (erreur) {
      surErreur(erreur, zoneClasses());
      await allerDansUneClasse(classe && classe.id);
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
  async function chargerClasses() {
    const donnees = await api("classes.liste");
    classes = donnees.classes || [];
    annoncerFinAnnee(donnees, classes.length);
    return classes;
  }

  // La classe à ouvrir (lot 5d) : la première des demandées (l'ancre de la
  // séance en direct, la dernière ouverte sur ce poste, la classe déjà
  // ouverte) qui est encore dans la liste du professeur connecté ; sinon la
  // première des siennes qui ne soit pas de l'an dernier, sinon la première
  // de l'année, sinon la première. 0 : il n'a aucune classe.
  function classeAOuvrir(liste, demandees, echuesLues) {
    const ids = new Set((liste || []).map(uneClasse => uneClasse.id));
    const voulue = (demandees || []).find(id => id && ids.has(id));
    if (voulue) return voulue;
    const vieilles = new Set((echuesLues || []).map(uneClasse => uneClasse.id));
    const actuelles = (liste || []).filter(uneClasse => !vieilles.has(uneClasse.id));
    const choisie = actuelles.find(uneClasse => uneClasse.droit === "proprietaire") || actuelles[0] || (liste || [])[0];
    return choisie ? choisie.id : 0;
  }

  // Aller dans une classe (lot 5d) : c'est ce qui remplace « Mes classes » à
  // la connexion, après une classe supprimée, au retour de Mon compte et après
  // un mot de passe changé. La liste est relue ; une classe demandée qui n'y
  // est plus (supprimée, partage retiré, autre professeur sur ce poste)
  // n'ouvre rien, on passe à la suivante. Aucune classe : l'écran « Crée ta
  // première classe ». Déjà dans la bonne classe : rien n'est relu.
  async function allerDansUneClasse(...demandees) {
    try { await chargerClasses(); }
    catch (erreur) { surErreur(erreur, zoneClasses()); return; }
    const id = classeAOuvrir(classes, demandees, echues);
    if (!id) {
      quitterLaClasse();
      oublierDerniereClasse();
      montrer("ecran-premiere-classe");
      return;
    }
    if (classe && classe.id === id && !$("ecran-classe").hidden) return;
    await ouvrirClasse(id);
  }

  // Plus de classe ouverte (la dernière vient d'être supprimée) : la page
  // n'en garde rien qui puisse resservir.
  function quitterLaClasse() {
    demandeAppli += 1;
    fermerFenetreEleve();
    oublierRecherche();
    classe = null;
    eleves = [];
    tableaux = {};
    vue = "appli";
  }

  // Où dire ce qui arrive aux classes : en haut de la classe ouverte, ou sur
  // l'écran « Crée ta première classe ». (Aucun des deux à l'écran — au
  // démarrage —, surErreur se rabat sur la connexion.)
  function zoneClasses() {
    return $("ecran-premiere-classe").hidden ? "message-classes" : "message-premiere-classe";
  }

  // Ouvrir une classe — ou la relire, après un ajout d'élèves, un collage, une
  // restauration, un changement d'activités. Lot « splat-suivi-4 » : on lit le
  // tableau de l'activité à montrer (celle déjà affichée si c'est la même
  // classe, sinon le dernier choix de l'onglet, sinon la première de la
  // classe), et les listes des autres activités sont oubliées : elles seront
  // relues quand on les choisira.
  async function ouvrirClasse(id) {
    // Un changement d'onglet encore en route ne vaut plus : on relit tout.
    // Lot 4b-bis (relecture Codex du 24/10) : le numéro de CETTE ouverture —
    // une autre classe ouverte, ou « Se déconnecter » (oublierEtat), pendant
    // l'attente le rend périmé, et sa réponse n'est plus posée dans la page.
    demandeAppli += 1;
    const numero = demandeAppli;
    try {
      const memeClasse = Boolean(classe) && classe.id === id;
      const connue = classes.find(uneClasse => uneClasse.id === id);
      // La même classe, rouverte (un élève ajouté, une activité changée) :
      // un onglet qu'un élève a en plus (lot 4b) reste un choix possible.
      const voulue = appliAMontrer(lesApplisConnues((connue ? connue.applis : ["defi-tables"]).concat(memeClasse ? applisAMontrer() : [])),
        memeClasse ? appliAffichee : lireChoixAppli());
      const [donnees] = await Promise.all([api("tableau", {classe_id: id, appli: voulue}), chargerMoteurDe(voulue)]);
      if (numero !== demandeAppli || !jeton) return;
      classe = donnees.classe;
      droitClasse = classe.droit || "proprietaire";
      if (connue) connue.applis = classe.applis;
      // Une autre classe s'ouvre toujours sur son tableau, jamais sur ses
      // Réglages ni sur ses codes — sauf une classe sans aucun élève, qui
      // s'ouvre sur Élèves : c'est la seule chose utile à y faire.
      if (!memeClasse) {
        // Lot 5c : une autre classe repart sans prénom cherché, fenêtre fermée.
        oublierRecherche();
        fermerFenetreEleve();
        vue = (donnees.eleves || []).length === 0 && droitClasse !== "lecture" ? "eleves" : "appli";
      }
      // Une autre classe s'ouvre en haut de la page — son nom et son résumé —,
      // pas au milieu, là où on en était dans la précédente (lot 5a).
      if (!memeClasse) window.scrollTo(0, 0);
      appliAffichee = voulue;
      eleves = elevesLus(voulue, donnees.eleves);
      tableaux = {[voulue]: eleves};
      $("titre-classe").textContent = classe.libelle;
      $("titre-classe-colle").textContent = classe.libelle;
      retenirDerniereClasse(classe.id);
      messager("message-classes", "", "");
      messager("message-classe", "", "");
      messager("message-appli", "", "");
      messager("message-activites", "", "");
      messager("message-nom", "", "");
      messager("message-supprimer", "", "");
      montrer("ecran-classe");
      appliquerDroits();
      // La liste des classes était en retard (activités changées ailleurs) :
      // on passe à une activité que la classe a vraiment.
      const presentes = applisAMontrer();
      if (presentes.length && !presentes.includes(voulue)) { poserAppli(); await afficherAppli(presentes[0]); return; }
      poserAppli();
      dessinerTableau();
    } catch (erreur) {
      if (numero === demandeAppli && jeton) surErreur(erreur, zoneClasses());
    }
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
      const infos = el("span", "infos");
      const ligne = el("span", "ligne-1");
      ligne.appendChild(el("span", "", `${uneClasse.eleves} élève${uneClasse.eleves > 1 ? "s" : ""}`));
      const enCours = LIBELLES_DIRECT[uneClasse.direct];
      if (enCours) ligne.appendChild(el("em", "en-direct", enCours));
      infos.appendChild(ligne);
      if (uneClasse.droit !== "proprietaire") {
        infos.appendChild(el("span", "partage", `partagée par ${uneClasse.proprietaire || "un collègue"} · `
          + (uneClasse.droit === "ecriture" ? "modifiable" : "lecture seule")));
      }
      bouton.append(el("strong", "", uneClasse.libelle), infos);
      const ouverte = Boolean(classe) && classe.id === uneClasse.id;
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

  // Les onglets d'activité (lot « Qui voit quoi », lot 4b, 24/10/2026) :
  // celles de la classe, PLUS celles qu'un élève a en plus (eleve.acces,
  // calculé par le serveur — le même pour toutes les listes lues). Anzan
  // donné à Rania seule a ainsi son onglet ; la règle vaut pour toutes les
  // applis, une seule règle.
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

  // Le moteur qu'il faut à une activité (Défi tables : déjà dans la page).
  function chargerMoteurDe(cle) {
    if (cle === "splat") return chargerMoteurSplat();
    if (cle === "coffres") return chargerMoteurCoffres();
    if (cle === "flash-anzan") return chargerMoteurAnzan();
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
    $("entete-defi-tables").hidden = splat || coffres || anzan;
    $("entete-splat").hidden = !splat;
    $("entete-coffres").hidden = !coffres;
    $("entete-anzan").hidden = !anzan;
    $("note-coffres").hidden = !coffres;
    $("bloc-imprimer").hidden = splat || coffres || anzan;
    if (splat || coffres || anzan) $("fragiles").hidden = true;
    if (coffres || anzan) $("objectif").hidden = true;
    poserTris();
    poserActivites();
    // Lot « Les records » : la carte, Défi tables seulement (relue à chaque
    // ouverture de la classe). Pas dans les Réglages : elle n'y est pas.
    chargerRecords();
    // Lot E1 : la carte « Évaluations », Défi tables seulement, en écriture.
    // Dans les Réglages, ni lecture ni veille (evalVisible).
    poserEvaluations();
  }

  // Un onglet par activité à montrer (applisAMontrer) ; celui qu'on regarde
  // est souligné, aucun hors de la vue de l'activité. Rend la liste.
  function poserOnglets() {
    const presentes = applisAMontrer();
    document.querySelectorAll("#choix-appli button[data-appli]").forEach(bouton => {
      bouton.hidden = !presentes.includes(bouton.dataset.appli);
      bouton.setAttribute("aria-pressed", String(vue === "appli" && bouton.dataset.appli === appliAffichee));
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
      const bouton = el("button", "", onglet.textContent);
      bouton.type = "button";
      if (vue === "appli" && onglet.dataset.appli === appliAffichee) bouton.setAttribute("aria-current", "true");
      bouton.addEventListener("click", () => { fermerMenuApplis(); onglet.click(); });
      li.appendChild(bouton);
      liste.appendChild(li);
    });
    $("menu-applis").hidden = false;
    $("bouton-applis").setAttribute("aria-expanded", "true");
    const choisie = liste.querySelector('[aria-current="true"]') || liste.querySelector("button");
    if (choisie) choisie.focus();
  }

  function fermerMenuApplis(rendreLaMain) {
    const menu = $("menu-applis");
    if (!menu || menu.hidden) return;
    menu.hidden = true;
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
    if (vue !== "eleves" && vue !== "reglages") vue = "appli";
    $("vue-appli").hidden = vue !== "appli";
    $("vue-eleves").hidden = vue !== "eleves";
    $("vue-reglages").hidden = vue !== "reglages";
    $("onglet-eleves").setAttribute("aria-pressed", String(vue === "eleves"));
    $("onglet-reglages").setAttribute("aria-pressed", String(vue === "reglages"));
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
    if (!classe || !applisAMontrer().includes(cle)) return;
    const numero = ++demandeAppli;
    try {
      await chargerMoteurDe(cle);
      const fraiche = !tableaux[cle];
      const liste = tableaux[cle]
        || elevesLus(cle, (await api("tableau", {classe_id: classe.id, appli: cle})).eleves);
      if (numero !== demandeAppli || !jeton) return;
      // Lot 4b-bis (relecture Codex) : une liste fraîche dit ce que voit
      // chaque élève MAINTENANT (un autre onglet du navigateur a pu retirer
      // Anzan à Rania) — on le reporte sur les listes déjà lues, et une
      // activité que plus personne n'a ne s'affiche pas : son onglet part.
      if (fraiche) reporterAccesDeLaListe(liste);
      if (!applisAMontrer(liste).includes(cle)) {
        tableaux[cle] = liste;
        poserOnglets();
        const nom = (APPLIS.find(appli => appli.cle === cle) || {nom: cle}).nom;
        messager("message-appli", `${nom} n’est plus ouvert à aucun élève de cette classe.`, "info");
        return;
      }
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

  // ------------------------------------------------- activités de la classe (D7)

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
      zone.appendChild(el("p", "message info", "Une question éclair est en cours pour cette classe : termine la séance en direct avant d’ouvrir une évaluation."));
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

  async function changerRecords(caseRecords) {
    const ouvre = caseRecords.checked;
    caseRecords.disabled = true;
    try {
      await api("classes.modifier", {classe_id: classe.id, reglages: {"defi-tables": {records: ouvre}}});
      await ouvrirClasse(classe.id);
      messager("message-activites", `Les records ${ouvre ? "ouverts" : "fermés"} pour la ${classe.libelle}.`, "ok");
    } catch (erreur) {
      caseRecords.checked = !ouvre;
      surErreur(erreur, "message-activites");
    } finally {
      caseRecords.disabled = false;
    }
  }

  // Les cases des Réglages (propriétaire seulement : la vue n'existe que pour
  // lui). Chaque appli a sa ligne ; ses réglages, dessous, ne se montrent que
  // si la classe a l'appli (décochée, ils sont gardés pour la recocher).
  function poserActivites() {
    // Lot « Les records » : la case, seulement quand la classe a Défi tables.
    const presentesRecords = (classe && classe.applis) || [];
    $("rec-reglage").hidden = !presentesRecords.includes("defi-tables");
    $("case-records").checked = recordsOuvertsPourLaClasse();
    $("case-records").disabled = false;
    const presentes = (classe && classe.applis) || [];
    document.querySelectorAll("#liste-activites input[data-appli]").forEach(caseActivite => {
      caseActivite.checked = presentes.includes(caseActivite.dataset.appli);
      caseActivite.disabled = false;
    });
    // Lot « splat-suivi-5 » : les mondes ouverts, seulement quand la classe a SPLAT!.
    $("mondes-ouverts").hidden = !presentes.includes("splat");
    const ouverts = mondesOuverts();
    document.querySelectorAll("#mondes-ouverts input[data-monde]").forEach(caseMonde => {
      caseMonde.checked = !ouverts || ouverts.includes(Number(caseMonde.dataset.monde));
      caseMonde.disabled = false;
      poserPuce(caseMonde);
    });
    // Lot « Coffres magiques sur le suivi » : niveaux et opérations
    // accessibles, seulement quand la classe a Coffres ; tout coché par défaut.
    $("coffres-reglages").hidden = !presentes.includes("coffres");
    const niveaux = coffresOuverts("niveaux");
    const operations = coffresOuverts("operations");
    document.querySelectorAll("#coffres-reglages input[data-niveau]").forEach(caseNiveau => {
      caseNiveau.checked = !niveaux || niveaux.includes(Number(caseNiveau.dataset.niveau));
      caseNiveau.disabled = false;
    });
    document.querySelectorAll("#coffres-reglages input[data-operation]").forEach(caseOperation => {
      caseOperation.checked = !operations || operations.includes(Number(caseOperation.dataset.operation));
      caseOperation.disabled = false;
    });
    // Lot « Qui voit quoi » : sous chaque appli, « En plus pour … ».
    poserEnPlusPour();
  }

  // Les niveaux (1 à 3) ou les opérations (1 à 4) de Coffres magiques ouverts
  // à la classe ouverte (classe.reglages.coffres) : null quand tout l'est — le
  // cas de toute classe où personne n'a rien choisi.
  const NOMBRES_COFFRES = {niveaux: 3, operations: 4};
  function coffresOuverts(nom) {
    const reglages = classe && classe.reglages;
    const liste = reglages && reglages.coffres && reglages.coffres[nom];
    const nombre = NOMBRES_COFFRES[nom];
    if (!Array.isArray(liste)) return null;
    const ouverts = liste.filter(numero => Number.isInteger(numero) && numero >= 1 && numero <= nombre);
    return ouverts.length && ouverts.length < nombre ? ouverts : null;
  }

  // Cocher ou décocher un niveau ou une opération de Coffres magiques pour la
  // classe (choix de Gwenaël, 21/10/2026) : enregistré à chaque clic, comme
  // les mondes de SPLAT!, sans bouton « Enregistrer ». La dernière case
  // cochée d'un groupe ne se décoche pas (le message ne vient que si on
  // essaie). Rien n'est effacé : les trésors restent ; l'élève dont la partie
  // en cours ne tient plus repart à 0 clé, à sa prochaine ouverture.
  async function changerReglageCoffres(nom, caseCochee) {
    const attribut = nom === "niveaux" ? "niveau" : "operation";
    const cases = [...document.querySelectorAll(`#coffres-reglages input[data-${attribut}]`)];
    const voulus = cases.filter(uneCase => uneCase.checked).map(uneCase => Number(uneCase.dataset[attribut]));
    if (!voulus.length) {
      caseCochee.checked = true;
      messager("message-activites", nom === "niveaux"
        ? "Une classe garde au moins un niveau ouvert." : "Une classe garde au moins une opération ouverte.", "erreur");
      return;
    }
    const groupe = $(nom === "niveaux" ? "cases-coffres-niveaux" : "cases-coffres-operations");
    cases.forEach(uneCase => { uneCase.disabled = true; });
    groupe.setAttribute("aria-busy", "true");
    try {
      await api("classes.modifier", {classe_id: classe.id, reglages: {coffres: {[nom]: voulus}}});
      await ouvrirClasse(classe.id);
      messager("message-activites", "Réglages de Coffres magiques enregistrés.", "ok");
    } catch (erreur) {
      caseCochee.checked = !caseCochee.checked;
      surErreur(erreur, "message-activites");
    } finally {
      cases.forEach(uneCase => { uneCase.disabled = false; });
      groupe.setAttribute("aria-busy", "false");
    }
  }

  // Le dessin d'une case de monde suit la case (pointillés gris quand il est fermé).
  function poserPuce(caseMonde) {
    caseMonde.closest(".puce-monde").classList.toggle("ferme", !caseMonde.checked);
  }

  // Ouvrir ou fermer un monde de SPLAT! pour la classe (lot « splat-suivi-5 »,
  // choix de Gwenaël : monde par monde). Pas de question : rien n'est effacé et
  // un clic le rouvre. Un monde reste toujours ouvert (pour retirer SPLAT!, on
  // décoche SPLAT!). L'élève le voit à la prochaine page qu'il ouvre.
  async function changerMonde(caseMonde) {
    const numero = Number(caseMonde.dataset.monde);
    const ouvre = caseMonde.checked;
    const cases = [...document.querySelectorAll("#mondes-ouverts input[data-monde]")];
    const voulus = cases.filter(uneCase => uneCase.checked).map(uneCase => Number(uneCase.dataset.monde));
    if (!voulus.length) {
      caseMonde.checked = true;
      messager("message-activites", "Une classe garde au moins un monde ouvert.", "erreur");
      return;
    }
    poserPuce(caseMonde);
    cases.forEach(uneCase => { uneCase.disabled = true; });
    $("puces-mondes").setAttribute("aria-busy", "true");
    try {
      await api("classes.modifier", {classe_id: classe.id, reglages: {splat: {mondes: voulus}}});
      await ouvrirClasse(classe.id);
      messager("message-activites",
        `Monde ${numero} ${ouvre ? "ouvert" : "fermé"} pour la ${classe.libelle}.`, "ok");
    } catch (erreur) {
      caseMonde.checked = !ouvre;
      poserPuce(caseMonde);
      surErreur(erreur, "message-activites");
    } finally {
      cases.forEach(uneCase => { uneCase.disabled = false; });
      $("puces-mondes").setAttribute("aria-busy", "false");
    }
  }

  // Cocher : la tuile apparaît dans l'espace des élèves. Décocher : elle
  // disparaît, après confirmation, et RIEN n'est effacé — classes.modifier ne
  // change que la liste de la classe, les progressions restent en base. Une
  // classe garde au moins une activité (le serveur remettrait Défi tables).
  async function changerActivite(caseActivite) {
    const cle = caseActivite.dataset.appli;
    const nom = (APPLIS.find(appli => appli.cle === cle) || {nom: cle}).nom;
    const ajout = caseActivite.checked;
    const autres = ((classe && classe.applis) || []).filter(autre => autre !== cle);
    const voulues = ajout ? autres.concat([cle]) : autres;
    if (!lesApplisConnues(voulues).length) {
      caseActivite.checked = true;
      messager("message-activites", "Une classe garde au moins une activité.", "erreur");
      return;
    }
    if (!ajout && !await demander(
      `Retirer ${nom} de la classe ${classe.libelle} ? La tuile disparaît de l’espace des élèves. `
      + `Leur travail reste enregistré : rien n’est effacé.`,
      null, {oui: "Retirer de la classe"})) {
      caseActivite.checked = true;
      return;
    }
    const cases = document.querySelectorAll("#liste-activites input[data-appli]");
    cases.forEach(uneCase => { uneCase.disabled = true; });
    try {
      await api("classes.modifier", {classe_id: classe.id, applis: voulues});
      await ouvrirClasse(classe.id);
      messager("message-activites", ajout
        ? `${nom} ajouté : la tuile apparaît dans l’espace des élèves.`
        : `${nom} retiré de l’espace des élèves. Rien n’est effacé.`, "ok");
    } catch (erreur) {
      caseActivite.checked = !ajout;
      surErreur(erreur, "message-activites");
    } finally {
      cases.forEach(uneCase => { uneCase.disabled = false; });
    }
  }

  // ------------------------------------------------- droits sur la classe ouverte

  function appliquerDroits() {
    const proprietaire = droitClasse === "proprietaire";
    const ecriture = droitClasse !== "lecture";
    // Mener une séance en direct, c'est recevoir les réponses avec les
    // prénoms : pas en lecture seule (même règle que le serveur).
    $("seance-direct").hidden = !ecriture;
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
    const liste = $("liste-profs");
    liste.textContent = "";
    try {
      const donnees = await api("profs.liste");
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
    } catch (erreur) { surErreur(erreur, "message-profs"); }
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
  // et cette page se mettent à jour dans n'importe quel ordre.
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
      surErreur(erreur, "message-appli");
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
    if (eleve.restaurable) {
      const quand = dateLisible(eleve.maj_le);
      options.push({valeur: "avant",
        libelle: "avant le dernier enregistrement" + (quand ? ` (du ${quand})` : "")});
    }
    // Le compteur de l'activité affichée : « 12 calculs » pour Défi tables,
    // « 13 étapes » pour SPLAT! (le serveur compte ce que lib/applis.php lui dit).
    const unite = (APPLIS.find(appli => appli.cle === appliAffichee) || APPLIS[0]).unite;
    (eleve.journees || []).forEach(journee => {
      options.push({valeur: journee.jour,
        libelle: `fin de journée du ${jourLisible(journee.jour)} — ${journee.calculs} `
          + (journee.calculs > 1 ? unite[1] : unite[0])});
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
      // Lot 4b-bis (relecture Codex) : le dernier élève qui avait une appli
      // en plus est parti — son onglet aussi ; si c'était l'onglet affiché,
      // on passe au premier qui reste.
      const presentes = poserOnglets();
      if (presentes.length && !presentes.includes(appliAffichee)) afficherAppli(presentes[0]);
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
    try {
      const partie = classe.libelle;
      await api("classes.supprimer", {classe_id: classe.id});
      // Lot 5d : une autre classe s'ouvre (ou « Crée ta première classe »).
      await allerDansUneClasse();
      messager(zoneClasses(), `Classe ${partie} supprimée : il n’en reste rien.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-supprimer"); }
    finally { bouton.disabled = false; }
  });

  // Un menu « ⋯ » se referme au clic ailleurs et dès que la page défile
  // (il est en position fixe : il ne suivrait pas sa ligne).
  document.addEventListener("click", fermerMenus);
  window.addEventListener("scroll", () => fermerMenus(null), true);
  window.addEventListener("resize", () => fermerMenus(null));
  // Lot « Qui voit quoi » : « Fermer » ne fait que fermer (chaque clic a déjà
  // été enregistré) ; fermée (bouton ou Échap), la fenêtre oublie l'élève et
  // ses prénoms.
  $("voit-fermer").addEventListener("click", () => { $("voit").close(); });
  $("voit").addEventListener("close", fermerCeQueVoit);
  // Serveur pro, lot 5c : la fenêtre de l'élève. ‹ › (et les flèches du
  // clavier) passent au voisin dans le tableau ; « Fermer » ou Échap la
  // ferment, et elle oublie l'élève. « Voir son parcours » (Défi tables)
  // ouvre l'écran Mon parcours par un billet de lecture (voirFiche) ;
  // « Revenir à… » ferme la fenêtre avant ses deux questions.
  $("fe-precedent").addEventListener("click", () => changerEleveDeLaFenetre(-1));
  $("fe-suivant").addEventListener("click", () => changerEleveDeLaFenetre(1));
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
  $("fe-revenir").addEventListener("click", () => {
    const eleve = eleveDeLaFenetre();
    if (!eleve) return;
    fermerFenetreEleve();
    revenirA(eleve);
  });
  // Anzan : « Voir les séances précédentes » et « Imprimer ».
  $("pa-imprimer").addEventListener("click", imprimerParcoursAnzan);
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
  $("onglet-eleves").addEventListener("click", ouvrirEleves);
  $("onglet-reglages").addEventListener("click", ouvrirReglages);
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
  document.querySelectorAll("#liste-activites input[data-appli]").forEach(caseActivite => {
    caseActivite.addEventListener("change", () => changerActivite(caseActivite));
  });
  document.querySelectorAll("#mondes-ouverts input[data-monde]").forEach(caseMonde => {
    caseMonde.addEventListener("change", () => changerMonde(caseMonde));
  });
  document.querySelectorAll("#coffres-reglages input[data-niveau]").forEach(caseNiveau => {
    caseNiveau.addEventListener("change", () => changerReglageCoffres("niveaux", caseNiveau));
  });
  document.querySelectorAll("#coffres-reglages input[data-operation]").forEach(caseOperation => {
    caseOperation.addEventListener("change", () => changerReglageCoffres("operations", caseOperation));
  });
  $("case-records").addEventListener("change", () => changerRecords($("case-records")));
  $("records-plein-ecran").addEventListener("click", ouvrirRecordsPleinEcran);

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
      const donnees = await api("classes.creer", {libelle, applis: ["defi-tables"]});
      await chargerClasses();
      await ouvrirClasse(donnees.id);
    } catch (erreur) { surErreur(erreur, zoneClasses()); }
    finally { creationEnCours = false; }
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
  $("retour-compte").addEventListener("click", () => { vue = "appli"; allerDansUneClasse(classe && classe.id); });

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
    try {
      await api("profs.motdepasse", {ancien, nouveau});
      mdpTemporaire = false;
      ["mdp-ancien", "mdp-nouveau", "mdp-confirme"].forEach(id => { $(id).value = ""; });
      vue = "appli";
      await allerDansUneClasse(classe && classe.id, lireDerniereClasse());
      messager(zoneClasses(), "Mot de passe changé. Tes autres appareils sont déconnectés.", "ok");
    } catch (erreur) { surErreur(erreur, "message-compte"); }
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
    return api("moi").then(donnees => {
      identifiant = donnees.identifiant;
      $("qui").textContent = donnees.identifiant;
      estAdmin = Boolean(donnees.admin);
      mdpTemporaire = Boolean(donnees.mdp_temporaire);
      if (mdpTemporaire) { ouvrirCompte(); return undefined; }
      return allerDansUneClasse(classeDemandee(), lireDerniereClasse());
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
