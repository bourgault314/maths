<?php
// Page d'accueil des élèves : un code, et les applis de sa classe. Rien d'autre.
// Depuis le lot 3 (03/09/2026), les liens vers les applis portent un billet
// d'entrée à usage unique (lib/billets.php), jamais le code lui-même.
require_once __DIR__ . '/lib/entetes.php';
header('Content-Type: text/html; charset=utf-8');
// Politique de contenu (voir lib/entetes.php) : seul le script portant ce
// nonce s'exécute dans la page.
$nonce = entetes_page();
// Les moteurs des activites, copies du depot servies d'ici (prof/), sont
// charges par la page pour lire un parcours : eux seuls connaissent les regles
// (tables acquises, rang ; etapes reussies, mondes finis). Leur version dans
// l'adresse suit leur contenu, comme dans prof/index.php : un nouveau fichier
// depose n'est jamais masque par le cache.
function version_moteur(string $fichier): string
{
    $chemin = __DIR__ . '/prof/' . $fichier;
    return is_file($chemin) ? substr(md5_file($chemin), 0, 10) : '0';
}
$versionMoteur = version_moteur('defi_tables_mon_parcours.js');
$versionSplat = version_moteur('splat-parcours.js');
$versionCoffres = version_moteur('coffres-parcours.js');
$versionAnzan = version_moteur('flash_anzan_parcours.js');
$versionCalculCore = version_moteur('defi_calcul_core.js');
$versionCalcul = version_moteur('defi_calcul_mon_parcours.js');
// Serveur pro (31/10/2026) : la charte commune, chargée AVANT le style de la
// page, avec son empreinte dans l'adresse (comme prof/index.php).
$charte = __DIR__ . '/suivi.css';
$versionCharte = is_file($charte) ? substr(md5_file($charte), 0, 10) : '0';
// Lot « code en cases » : le dessin du code en six cases, commun avec les
// applis (copie octet pour octet de assets/js/code-en-cases.js), chargé dans
// <head> pour que les cases soient dessinées dès le premier rendu.
$cases = __DIR__ . '/code-en-cases.js';
$versionCases = is_file($cases) ? substr(md5_file($cases), 0, 10) : '0';
// Lot B1 « Mon espace redessiné » : Nunito, servie d'ici (font-src 'self'),
// avec son empreinte dans l'adresse — gardée un an (lot A, .htaccess).
$nunito = __DIR__ . '/polices/nunito-latin-wght-normal.woff2';
$versionNunito = is_file($nunito) ? substr(md5_file($nunito), 0, 10) : '0';
$nunitoExt = __DIR__ . '/polices/nunito-latin-ext-wght-normal.woff2';
$versionNunitoExt = is_file($nunitoExt) ? substr(md5_file($nunitoExt), 0, 10) : '0';
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Lot 8 (retours du 31/10/2026) : l'élève qui REVIENT dans cet onglet (son
     code y est encore, et ce n'est pas « Se déconnecter ») ne voit plus
     passer l'écran du code le temps que le serveur réponde — « comme s'il
     refaisait une identification ». Ce script, avant tout le reste, le cache
     dès le premier rendu ; la page le remontre si le code ne vaut plus rien.
     Il porte un nom (« avant-tout ») : le grand script de la page reste le
     seul sans nom, celui que lisent les tests. -->
<script id="avant-tout" nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">
try {
  if (/^[A-Z0-9]{6}$/.test(window.sessionStorage.getItem("mathsgo-suivi-code") || "")
      && !/[?&]oublier=1(&|$)/.test(window.location.search)) {
    document.documentElement.classList.add("retour");
  }
} catch (_) {}
</script>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Espace élèves de maths&go : entre ton code pour retrouver tes activités.">
<!-- Lot 7 : icônes et logo servis d'ICI (copies du dépôt, vérifiées par un
     test). La politique de contenu n'autorise plus d'image d'un autre domaine. -->
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<title>Mon espace | maths&amp;go</title>
<link rel="stylesheet" href="suivi.css?v=<?= htmlspecialchars($versionCharte, ENT_QUOTES) ?>">
<link rel="preload" href="polices/nunito-latin-wght-normal.woff2?v=<?= htmlspecialchars($versionNunito, ENT_QUOTES) ?>" as="font" type="font/woff2" crossorigin>
<script src="code-en-cases.js?v=<?= htmlspecialchars($versionCases, ENT_QUOTES) ?>"></script>
<style>
  /* Serveur pro (31/10/2026) : la charte (suivi.css) donne les couleurs, le
     texte, l'en-tête, la carte, les boutons, le message et le pied ; ne
     restent ici que les six cases du code et les tuiles avec leurs jauges.
     Seule exception voulue (choix de Gwenaël, 31/10/2026) : côté élève, les
     titres restent GRAS (« Mon espace », « Bonjour Rania ») ; la charte les
     dessine fins pour le professeur. */
  h1 { font-weight: 700; }
  /* Le nom de la classe vient du professeur (40 caractères au plus) : au
     téléphone, il passe à la ligne et « Se déconnecter » reste à l'écran. */
  .entete .droite { flex: 0 1 auto; min-width: 0; }
  #classe { white-space: normal; overflow-wrap: anywhere; }
  #changer { flex: none; }
  .sous-titre { margin: 0 0 22px; color: var(--muted); }
  /* « Entrer » (04/10/2026) : sous la case du code, centrée, le bouton était
     collé à gauche. Téléphone : toute la largeur, comme la case ; ordinateur :
     centré, largeur moyenne. */
  #form-code .actions button { flex: 1 1 100%; }
  @media (min-width: 600px) {
    #form-code .actions { justify-content: center; }
    #form-code .actions button { flex: 0 0 auto; min-width: 240px; }
  }
  /* Le premier écran (05/10/2026, Gwenaël : « c'est le premier écran que
     voient les élèves, on peut leur faire un beau premier écran ») : sur
     l'écran du code seulement, plus de barre d'en-tête ; le logo, grand,
     centré, le titre et la carte centrés dessous. La carte reste en HAUT de
     l'écran : sur un téléphone, le clavier cache toute la moitié du bas. Une
     fois l'élève entré, son espace retrouve l'en-tête (sa classe, « Se
     déconnecter »). */
  body.sur-code .entete { display: none; }
  #ecran-code { text-align: center; padding-top: 10px; }
  /* Lot 8 : posée par le script du haut quand l'élève revient avec son code. */
  html.retour #ecran-code { display: none; }
  .logo-accueil { display: block; width: 180px; height: auto; margin: 4px auto 16px; }
  #ecran-code h1 { font-size: 2.15rem; line-height: 1.15; }
  #ecran-code .sous-titre { margin-bottom: 22px; }
  #ecran-code .carte { max-width: 430px; margin: 0 auto; padding: 22px 18px; text-align: left; }
  /* Le code en six cases (05/10/2026) : l'élève voit qu'il en faut six et
     combien il en reste, et compare case par case avec sa bandelette. Une
     seule vraie case de saisie, invisible, posée sur les six cases dessinées :
     le clavier, effacer, la touche « OK » restent ceux d'une case normale.
     On écrit toujours au bout et on efface depuis le bout (voir
     dessinerCases) : toucher la 1re case ne doit pas glisser une lettre au
     milieu du code. */
  .pour-lecteur { position: absolute; width: 1px; height: 1px; overflow: hidden;
                  clip: rect(0 0 0 0); white-space: nowrap; }
  /* Lot « code en cases » (11/2026) : le dessin vit dans le module commun
     code-en-cases.js (le même que la question « C'est toujours toi ? » des
     applis) ; ici, seulement ses mesures et la charte — l'entrée garde
     exactement sa taille d'avant. Ce que le module ajoute : toucher une case
     pleine la choisit, la lettre tapée la remplace. */
  #cases { --cec-max: 372px; --cec-ecart: 8px; --cec-hauteur: 62px; --cec-police: 1.75rem;
           --cec-ecart-etroit: 5px; --cec-hauteur-etroite: 56px; --cec-police-etroite: 1.45rem;
           --cec-ligne: var(--line); --cec-bleu: var(--blue); --cec-encre: var(--blue-dark); }
  /* Une seule mise en page pour toutes les tailles de liste : une colonne tant
     qu'il n'y a qu'une ou deux activités (la tuile reste large et la page ne
     paraît pas vide), deux ou trois dès qu'il y en a plus — sans rien réécrire
     le jour où une appli de plus est proposée à la classe. */
  ul { list-style: none; margin: 18px 0 0; padding: 0;
       display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
  .appli { display: flex; align-items: center; gap: 13px; padding: 15px 16px; height: 100%;
           background: var(--paper); border: 1px solid var(--line); border-left: 5px solid var(--teal);
           border-radius: 12px; text-decoration: none; color: inherit; min-height: 44px; }
  /* Lot « cours-ouvertures » (10/11/2026) : le survol seulement avec une
     souris. Sur iPhone, un toucher pose le survol et l’y laisse — la dernière
     carte touchée restait bleue au retour d'une fiche. */
  @media (hover: hover) {
    .appli:hover { border-color: var(--blue); border-left-color: var(--blue); background: var(--survol); }
  }
  .appli .texte { min-width: 0; }
  .appli strong { display: block; font-size: var(--texte); color: var(--blue-dark); }
  .appli span { color: var(--muted); font-size: var(--texte-secondaire); }
  .appli .fleche { margin-left: auto; flex: 0 0 auto; color: var(--blue); }
  /* Le dessin ne remplace jamais le nom : à 40 px, aucun pictogramme ne dit
     « critères de divisibilité ». Il sert à retrouver d'un coup d'œil une
     activité déjà connue, pas à la deviner. */
  .icone { flex: 0 0 auto; display: block; }
  /* Lot « retours de classe » (06/10/2026, décision de Gwenaël) : plus de
     tuiles « Bientôt » — une appli n'apparaît que lorsqu'elle existe (le
     serveur ne les envoie plus, lib/applis.php). */
  /* SPLAT! (lot « splat-suivi-3 », 07/10/2026, choix B de Gwenaël) : une
     pastille par monde dans la couleur du monde sur la carte — vide, à moitié
     (en cours), pleine (fini) —, le compte des étapes réussies dessous, et les
     Bonus à part, dans une pastille dorée. */
  .mondes { display: flex; flex-wrap: wrap; gap: 8px; }
  .monde-p { display: block; flex: 0 0 auto; overflow: visible; }
  /* Les trois coffres d'un niveau (lot « le chemin des coffres », 09/11/2026). */
  .coffres-niveau { display: inline-flex; gap: 2px; }
  .coffres-niveau svg { display: block; flex: 0 0 auto; }
  li.aide { margin-top: 20px; grid-column: 1 / -1; }
  /* Lot S3 « Mon espace côté élève » (chantier « Suivre ses élèves », choix
     de Gwenaël du 07/11/2026, planches 4 et 5) : « Ma semaine », sept cases
     du lundi au dimanche, ✓ les jours où l'élève a travaillé, toutes applis
     ensemble ; on parle de JOURS (des élèves travaillent le matin), jamais
     d'un temps passé. Rien de rouge : un jour sans travail est une case
     vide, comme un jour à venir (en pointillés). La carte est posée entre
     les tuiles du haut (séance en direct, évaluation) et les activités ; elle
     reste dans le document même cachée, pour que l'écart au-dessus des
     activités ne bouge pas (12 px, comme après les tuiles du haut). */
  .semaine { margin: 12px 0 0; padding: 14px 16px 15px; background: var(--paper);
             border: 1px solid var(--line); border-radius: 12px; }
  .semaine h2 { margin: 0 0 10px; font: 700 var(--texte)/1.3 var(--sans); color: var(--blue-dark); }
  .semaine + ul { margin-top: 12px; }
  .semaine-ligne { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px 22px; }
  .semaine-jours { list-style: none; margin: 0; padding: 0; display: grid;
                   grid-template-columns: repeat(7, minmax(0, 40px)); gap: 8px; flex: 0 1 328px; }
  .semaine-jours li { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; }
  .semaine-jours .lettre { color: var(--muted); font-size: .74rem; font-weight: 700; line-height: 1; }
  .semaine-jours .case-jour { display: grid; place-items: center; width: 100%; aspect-ratio: 1;
                              border: 1.5px solid #cfdae6; border-radius: 9px; background: #fff; }
  .semaine-jours .avenir .case-jour { border-style: dashed; border-color: #dbe3ec; background: transparent; }
  .semaine-jours .fait .case-jour { border-color: #147447; background: #147447; }
  .semaine-jours .case-jour svg { width: 58%; height: auto; }
  .semaine-jours .aujourdhui .case-jour { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--blue); }
  .semaine-jours .aujourdhui .lettre { color: var(--blue-dark); }
  .semaine-compte { margin: 0 0 4px; color: var(--ink); font-size: var(--texte-secondaire); }
  .semaine-compte:empty { display: none; }
  .semaine-compte strong { font-weight: 800; }
  /* L'appli Cours (lot « cours-appli », 08/11/2026, choix de Gwenaël) : la
     tuile « Mes cours » est la PREMIÈRE de la liste des activités, comme les
     autres (« est-ce qu'on sépare vraiment Mes cours ? … tu peux tout
     laisser ») ; dessous, le nombre de chapitres ouverts, pas de phrase.
     Puis deux écrans dans la page : la liste des chapitres et le sommaire
     d'un chapitre (#cours, #cours=3e-PYT). Trois touches jusqu'à une fiche ;
     « ← » remonte d'un niveau. */
  .cours-tete { position: relative; display: flex; align-items: center; min-height: 44px; margin: 0 0 16px; }
  .cours-tete .rond { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
                      background: var(--paper); border: 1.5px solid var(--line); color: var(--blue); }
  @media (hover: hover) { .cours-tete .rond:hover { background: var(--survol); } }
  .cours-tete h1 { position: absolute; left: 54px; right: 54px; margin: 0; text-align: center; font-size: 24px; }
  .cours-sur { display: block; margin: 0 0 3px; color: var(--teal-texte); font-size: 13px; font-weight: 700;
               letter-spacing: .05em; text-transform: uppercase; }
  #cours-corps ul { grid-template-columns: 1fr; margin-top: 0; gap: 10px; }
  #cours-corps .appli { height: auto; }
  /* Lot « cours-appli-2 » (13/11/2026, choix de Gwenaël sur planches, version 1) :
     dans la liste des chapitres, la bande de gauche prend la couleur du DOMAINE
     (celles du catalogue du site), le nom du domaine est écrit au-dessus, en
     petites capitales, et le chapitre porte son nom court, en gros (le titre
     long reste en haut de l'écran du chapitre). Le domaine est ÉCRIT : la
     couleur n'est qu'un repère en plus. Une classe à plusieurs niveaux : la
     liste est rangée sous « 4e », puis « 3e ». */
  .cours-niveau { display: flex; align-items: center; gap: 10px; margin: 22px 0 10px;
                  font: 400 22px/1.2 var(--serif); color: var(--blue-dark); }
  .cours-niveau:first-child { margin-top: 4px; }
  .cours-niveau::after { content: ""; flex: 1 1 auto; height: 1px; background: var(--line); }
  #cours-corps .cours-chap { border-left: 6px solid var(--domaine, var(--teal)); padding: 13px 14px 13px 15px; }
  @media (hover: hover) { #cours-corps .cours-chap:hover { border-left-color: var(--domaine, var(--blue)); } }
  .cours-chap .cours-domaine { display: block; margin: 0 0 2px; color: var(--domaine-texte); font-size: 12.5px; font-weight: 800;
                               letter-spacing: .05em; text-transform: uppercase; }
  .cours-chap .cours-domaine:empty { display: none; }
  .cours-chap strong { font-size: 19px; line-height: 1.25; }
  .cours-titre { margin: 2px 0 14px; font: 400 26px/1.25 var(--serif); color: var(--blue-dark); }
  .som-liste { display: grid; gap: 10px; }
  .som-carte { display: flex; align-items: center; gap: 12px; padding: 13px 14px; background: var(--paper);
               border: 1px solid var(--line); border-radius: 14px; color: inherit; text-decoration: none; }
  @media (hover: hover) { .som-carte:hover, .som-autre:hover { border-color: var(--blue); background: var(--survol); } }
  .som-carte .n { flex: 0 0 32px; height: 32px; border-radius: 50%; display: grid; place-items: center;
                  background: var(--ink); color: #fff; font-weight: 800; }
  .som-carte .t { flex: 1 1 auto; min-width: 0; }
  .som-carte .t b { display: block; color: var(--blue-dark); line-height: 1.3; }
  .som-carte .t small { display: block; margin-top: 5px; color: var(--muted); font-size: var(--texte-secondaire); }
  .som-carte .fleche { flex: 0 0 auto; color: var(--blue); }
  .som-autre { display: block; margin: 12px 0 0; padding: 12px 14px; background: var(--paper); border: 1.5px solid var(--ink);
               border-radius: 14px; color: var(--blue-dark); font-weight: 700; text-decoration: none; }
  .som-autre small { display: block; font-weight: 400; color: var(--muted); font-size: var(--texte-secondaire); }
  /* « C'est toujours toi ? » (lot « code en cases », 11/2026) : la même
     question que dans les applis, après dix minutes sans geste. La carte est
     posée PAR-DESSUS l'écran : rien ne bouge dessous, et tout ce qui est
     dessous est inerte tant qu'elle est là. La ligne d'erreur garde sa place
     même vide (la carte ne grandit pas). Au téléphone, la carte est en haut :
     le clavier couvre le bas. */
  .garde { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center;
           padding: 16px; background: rgba(20, 52, 81, .55); }
  .garde[hidden] { display: none; }
  /* Lot « toujours toi » (11/11/2026, choix de Gwenaël) : la carte est une
     petite copie de l'écran d'entrée (titre, une ligne, le cadre blanc des six
     cases avec « Entrer »). Son dessin vit dans le module commun
     code-en-cases.js (.cec-garde), le même que dans les applis ; ici, le titre
     dans la police des titres de Mon espace et les couleurs de la charte. */
  .garde-carte .cec-garde-titre { font-family: var(--serif); font-weight: 700; color: var(--blue-dark); }
  #garde-cases { --cec-ligne: var(--line); --cec-bleu: var(--blue); --cec-encre: var(--blue-dark); }
  @media (max-width: 700px), (max-height: 560px) {
    .garde { align-items: flex-start; padding-top: max(16px, min(9vh, 80px)); overflow-y: auto; }
  }

  /* ======================================================================
     Lot B1 « Mon espace redessiné » (audit du 20/11/2026, maquette validée
     par Gwenaël le 21/11). Nunito côté élève — Mon espace et Mes cours ;
     l'écran du code et la question « C'est toujours toi ? » ne changent pas.
     ====================================================================== */
  @font-face { font-family: "Nunito"; font-style: normal; font-display: swap; font-weight: 200 1000;
    src: url(polices/nunito-latin-wght-normal.woff2?v=<?= htmlspecialchars($versionNunito, ENT_QUOTES) ?>) format("woff2");
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
  @font-face { font-family: "Nunito"; font-style: normal; font-display: swap; font-weight: 200 1000;
    src: url(polices/nunito-latin-ext-wght-normal.woff2?v=<?= htmlspecialchars($versionNunitoExt, ENT_QUOTES) ?>) format("woff2");
    unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }
  body:not(.sur-code) .entete, #ecran-espace, #ecran-cours { --sans: "Nunito", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --serif: var(--sans); font-family: var(--sans); }
  body:not(.sur-code) .entete button { font-family: var(--sans); }
  #ecran-espace h1, #ecran-cours h1 { font-family: var(--sans); font-weight: 900; letter-spacing: -.01em; }
  #ecran-espace > h1 { margin: 0 0 10px; font-size: 30px; line-height: 1.15; }
  main.etroit:has(#ecran-espace:not([hidden])) { max-width: 720px; padding-top: 16px; }

  /* --- Le bloc « Aujourd'hui » : une seule chose à faire, en grand. Trois
     cartes possibles à la même place (séance en direct, évaluation, la
     journée) ; une seule se voit. Même hauteur dans tous ses états. ------ */
  .jour-zone { margin: 0 0 12px; }
  .jour-carte { position: relative; display: flex; flex-direction: column; gap: 11px; min-height: 176px;
                padding: 14px 16px 16px; border-radius: 22px; background: var(--blue-dark); color: #fff;
                text-decoration: none; box-shadow: 0 10px 26px rgba(5, 47, 103, .18); }
  .jour-zone > a:not([hidden]) ~ .jour-carte { display: none; }
  /* La même hauteur dans tous les états : plus que le plus haut d'entre eux
     (un sous-titre sur deux lignes au petit téléphone). */
  .jour-carte { min-height: 182px; }
  @media (max-width: 359px) { .jour-carte { min-height: 204px; } }
  .jour-haut { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; min-height: 20px; }
  .jour-tete { display: block; margin: 0; color: #f9bf3b; font: 900 16px/20px var(--sans); white-space: nowrap; }
  .jour-quoi { display: flex; align-items: center; gap: 13px; min-height: 54px; }
  .jour-icone { flex: 0 0 54px; width: 54px; height: 54px; display: grid; place-items: center;
                border-radius: 16px; background: #fff; }
  .jour-icone .icone { width: 42px; height: 42px; }
  .jour-icone .icone > rect:first-child[width="46"] { fill: #fff; }
  .jour-textes { min-width: 0; }
  .jour-textes strong { display: block; font-size: 22px; line-height: 1.15; font-weight: 900; color: #fff; }
  .jour-textes span { display: block; margin-top: 2px; font-size: 15.5px; line-height: 1.3; color: rgba(255, 255, 255, .86); }
  .jour-bouton { display: flex; align-items: center; justify-content: center; min-height: 50px; margin-top: auto;
                 padding: 0 16px; border-radius: 14px; background: #fff; color: var(--blue-dark);
                 border-bottom: 4px solid var(--orange); font: 900 19px/1.2 var(--sans); text-decoration: none; }
  @media (hover: hover) { .jour-bouton:hover, a.jour-carte:hover .jour-bouton { background: #fff4e6; color: var(--blue-dark); } }
  .jour-ensuite { margin: 0; min-width: 0; font-size: 14px; line-height: 20px; color: rgba(255, 255, 255, .8);
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .jour-faits { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; min-height: 50px; margin: auto 0 0; }
  .jour-faits span { padding: 5px 12px; border-radius: 999px; background: rgba(255, 255, 255, .12);
                     color: #fff; font-size: 14.5px; font-weight: 800; white-space: nowrap; }
  .jour-ensuite b { color: #fff; font-weight: 800; }
  /* Lot B2 : le chemin de la journée (« ✓ Défi tables → SPLAT! → Mes cours »),
     écrit avec la ligne « Ensuite » ; seul l'ordinateur le montre (plus bas). */
  .jour-chemin { display: none; }
  /* Correctif (Codex, point 10) : trois étapes faites, en texte (deux lignes
     au plus) ; au petit téléphone, le compte au lieu des noms cochés. */
  .jour-faits.compact { gap: 2px 12px; }
  .jour-faits.compact span { padding: 0; background: none; font-size: 14px; font-weight: 700; color: rgba(255, 255, 255, .9); }
  .jour-ensuite .compte { display: none; }
  @media (max-width: 359px) {
    .jour-ensuite .noms { display: none; }
    .jour-ensuite .compte { display: inline; }
  }
  /* Le clavier : sur le bleu nuit, l'anneau bleu de la charte ne se verrait pas. */
  .jour-carte .jour-bouton:focus-visible, a.jour-carte:focus-visible { outline: 3px solid #f9bf3b; outline-offset: 3px; box-shadow: none; }
  .porte:focus-visible { outline: 3px solid var(--blue); outline-offset: 2px; }
  .jour-carte.fini .jour-icone { background: #08aaa5; }
  .jour-carte.fini .jour-icone svg { width: 34px; height: 34px; }
  .jour-direct .jour-tete { color: #ffb36b; }
  .jour-direct .jour-tete::before { content: ""; display: inline-block; width: 10px; height: 10px; margin-right: 7px;
                                    border-radius: 50%; background: var(--orange); vertical-align: 1px; }

  /* --- Ma semaine, en perles ------------------------------------------- */
  .semaine { margin: 0 0 12px; padding: 8px 14px 7px; border-radius: 18px; }
  .semaine h2 { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; margin: 0; }
  .semaine-ligne { flex-wrap: nowrap; align-items: center; justify-content: space-between; gap: 10px; }
  .semaine-jours { position: relative; display: flex; gap: 0; flex: 0 1 auto; grid-template-columns: none; }
  .semaine-jours li { flex-direction: column-reverse; gap: 8px; width: 33px; }
  .semaine-jours .case-jour { position: relative; width: 26px; height: 26px; aspect-ratio: auto; border-radius: 50%;
                              border: 2px solid #cfdae6; background: #fff; }
  /* Les liens entre les perles (correctif du 21/11, capture de Gwenaël) : avant,
     le trait partait du bord INTÉRIEUR du rond (right: 100% compte depuis
     l'intérieur de la bordure de 2 px) — il mordait sur le rond et passait sur
     l'anneau orange du jour. Il va maintenant exactement d'un rond au suivant
     (--ecart = largeur d'un jour - largeur d'un rond), et il n'y en a pas de
     part et d'autre du jour entouré d'orange : l'anneau reste net. */
  .semaine-jours { --ecart: 7px; }
  .semaine-jours li:not(:first-child) .case-jour::before { content: ""; position: absolute; top: 50%;
                              left: calc(-2px - var(--ecart)); width: var(--ecart); height: 2px; margin-top: -1px; background: #cfdae6; }
  .semaine-jours .aujourdhui .case-jour::before,
  .semaine-jours .aujourdhui + li .case-jour::before { display: none; }
  .semaine-jours .fait .case-jour { border-color: #08aaa5; background: #08aaa5; }
  .semaine-jours .avenir .case-jour { border-style: dashed; border-color: #cfdae6; background: transparent; }
  .semaine-jours .aujourdhui .case-jour { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--orange); }
  .semaine-jours .lettre { font-size: 12px; font-weight: 800; }
  .semaine-compte { margin: 0; text-align: right; line-height: 1.15; color: var(--muted); font-size: 13.5px; white-space: nowrap; }
  .semaine-compte strong { display: block; color: var(--blue-dark); font-size: 21px; font-weight: 900; }
  @media (max-width: 359px) {
    .semaine-ligne { flex-wrap: wrap; justify-content: center; row-gap: 4px; }
    .semaine-compte { width: 100%; text-align: center; }
    .semaine-compte strong { display: inline; font-size: 16px; }
  }

  /* --- Les portes ------------------------------------------------------ */
  .portes-titre { margin: 2px 0 9px; font: 900 18px/1.2 var(--sans); color: var(--blue-dark); }
  #applis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
  #applis > li.long { grid-column: 1 / -1; }
  .porte { position: relative; display: flex; flex-direction: column; height: 100%; min-height: 112px;
           padding: 11px 12px 10px; border-radius: 18px; text-decoration: none; color: var(--ink);
           background: var(--porte-fond, #fff); border: 1px solid rgba(16, 41, 74, .08);
           border-bottom: 5px solid var(--porte-bord, var(--teal)); }
  @media (hover: hover) { .porte:hover { border-color: var(--porte-bord, var(--blue)); } }
  .porte .icone { width: 40px; height: 40px; flex: none; }
  /* Sur la porte, le dessin sans son carré de fond (sauf Solèy : son ciel violet fait le dessin). */
  .porte:not([data-cle="soley"]) .icone > rect:first-child[width="46"] { fill: transparent; }
  .porte-nom { display: block; margin-top: 6px; font-size: 16.5px; line-height: 1.2; font-weight: 900; color: var(--blue-dark); }
  .porte-ligne { display: block; margin-top: 2px; font-size: 13.5px; line-height: 1.3; font-weight: 700; color: #3c5068;
                 overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  /* La semaine d'un gain (lot S3) : le gain, en vert, à la place de la ligne. */
  .porte-ligne.gain { color: #147447; font-weight: 800; }
  .porte-ligne .coffres-niveau svg { width: 22px; height: 22px; }
  .porte-ligne.avec-dessin { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; -webkit-line-clamp: unset; }
  .porte-ligne .cle { font-weight: 800; color: #7a5a00; white-space: nowrap; }
  /* L'insigne : ce que l'élève a gagné, en haut à droite. Les quatre ont la
     même forme et la même taille ; pas d'insigne tant que rien n'est gagné. */
  .insigne { position: absolute; top: 9px; right: 9px; display: inline-flex; align-items: center; gap: 5px;
             height: 26px; padding: 0 9px 0 7px; border-radius: 999px; background: #fff;
             border: 1px solid rgba(16, 41, 74, .14); color: var(--ink); font-size: 13px; font-weight: 900;
             line-height: 1; white-space: nowrap; }
  .insigne svg { display: block; flex: none; }
  .insigne.legende, .insigne.etoiles, .insigne.or { background: linear-gradient(135deg, #fff1c2, #ffe08a); color: #6b4a00; border-color: #e6c25a; }
  .insigne.bronze { background: #f7e9dc; color: #7a4416; border-color: #e6c9ad; }
  .insigne.argent { background: #eef1f4; color: #465563; border-color: #d3dbe3; }
  .insigne.platine { background: #e8f4f8; color: #2c5d70; border-color: #bfdde8; }
  .insigne i { width: 12px; height: 12px; border-radius: 50%; display: inline-block;
               box-shadow: inset 0 -2px 0 rgba(0, 0, 0, .18), inset 0 1px 0 rgba(255, 255, 255, .7); }
  .insigne.bronze i { background: linear-gradient(135deg, #e0a06a, #b8722f); }
  .insigne.argent i { background: linear-gradient(135deg, #e6ebf0, #98a5b3); }
  .insigne.or i { background: linear-gradient(135deg, #ffe17a, #d9a300); }
  .insigne.platine i { background: linear-gradient(135deg, #e6f6fa, #7db7c9); }
  /* Les portes longues : SPLAT! (ses six mondes à droite) et Mes cours. */
  li.long .porte { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center;
                   column-gap: 12px; min-height: 0; padding: 10px 13px 9px; }
  li.long .porte-nom { margin-top: 0; }
  li.long .mondes { gap: 4px; flex-wrap: nowrap; }
  li.long .monde-p { width: 22px; height: 22px; }
  li.long .mondes { gap: 3px; }
  /* Petit téléphone (moins de 360 px) : une porte par ligne, l'insigne ne
     passe jamais sur le dessin. */
  @media (max-width: 359px) {
    #applis { grid-template-columns: minmax(0, 1fr); gap: 10px; }
    .porte { min-height: 0; }
  }
  @media (max-width: 380px) {
    li.long .porte { grid-template-columns: 40px minmax(0, 1fr); row-gap: 8px; }
    li.long .mondes { grid-column: 1 / -1; }
  }
  /* --- Grand écran (900 px et plus) : une mise en page à lui. En haut, le
     bloc « Aujourd'hui » et « Ma semaine » côte à côte, même hauteur, les
     jours centrés ; dessous, les portes sur quatre colonnes (les portes
     longues sur deux). Rien d'autre ne change. ---------------------------- */
  @media (min-width: 900px) {
    main.etroit:has(#ecran-espace:not([hidden])) { max-width: 1040px; padding-top: 26px; }
    #ecran-espace { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); column-gap: 18px; align-items: stretch; }
    #ecran-espace > h1 { grid-column: 1 / -1; font-size: 38px; margin-bottom: 16px; }
    #ecran-espace > .jour-zone { grid-column: 1; margin: 0; }
    #ecran-espace > .semaine { grid-column: 2; margin: 0; display: flex; flex-direction: column; justify-content: center;
                               padding: 14px 16px; border-radius: 22px; }
    #ecran-espace > .semaine[hidden] { display: none !important; }
    #ecran-espace > .jour-zone:has(+ .semaine[hidden]) { grid-column: 1 / -1; }
    .semaine .semaine-ligne { flex-direction: column; align-items: center; gap: 10px; }
    .semaine-jours { --ecart: 8px; }
    .semaine-jours li { width: 40px; }
    .semaine-jours .case-jour { width: 32px; height: 32px; }
    .semaine-jours .lettre { font-size: 13px; }
    .semaine-compte { text-align: center; font-size: 15px; }
    .semaine-compte strong { font-size: 26px; }
    .semaine h2 { position: static; width: auto; height: auto; overflow: visible; clip: auto; margin: 0 0 10px;
                  text-align: center; font: 900 17px/1.2 var(--sans); color: var(--blue-dark); }
    #ecran-espace > .portes-titre, #ecran-espace > #applis { grid-column: 1 / -1; }
    .portes-titre { margin: 24px 0 12px; font-size: 21px; }
    /* Les portes : toutes de la même taille, serrées sur leur contenu (pas de
       grand vide — retour de Gwenaël sur la capture de Code, 21/11). Le nombre
       de colonnes suit le nombre de portes (--portes, posé par la page) : une
       seule rangée jusqu'à cinq, trois colonnes pour six, quatre au-delà. */
    #applis { grid-template-columns: repeat(var(--portes, 4), minmax(0, 1fr)); gap: 14px; }
    #applis > li.long { grid-column: auto; }
    .porte, li.long .porte { display: flex; flex-direction: column; align-items: flex-start; min-height: 0;
                             padding: 14px 15px 12px; border-radius: 18px; }
    .porte .icone { width: 46px; height: 46px; }
    .porte-nom, li.long .porte-nom { margin-top: 8px; font-size: 18px; }
    .porte-ligne { font-size: 14.5px; }
    li.long .mondes { margin-top: 10px; gap: 4px; }
    li.long .monde-p { width: 24px; height: 24px; }
    @media (max-width: 1023px) { #applis[data-portes="5"] { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .insigne { top: 14px; right: 14px; height: 28px; font-size: 14px; }
    .jour-carte, .jour-carte.fini { min-height: 164px; padding: 18px 22px 20px; gap: 12px; }
    .jour-icone { flex-basis: 64px; width: 64px; height: 64px; }
    .jour-icone .icone { width: 50px; height: 50px; }
    .jour-textes strong { font-size: 26px; }
    .jour-textes span { font-size: 16.5px; }
    .jour-tete, .jour-ensuite { font-size: 16px; }
    /* Le bouton à droite de l'activité : la carte se lit d'un coup d'œil. */
    .jour-carte, .jour-carte.fini { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: auto 1fr;
                                    align-items: center; column-gap: 24px; }
    .jour-haut { grid-column: 1 / -1; align-self: start; }
    .jour-bouton, .jour-faits { margin: 0; min-width: 210px; min-height: 54px; font-size: 20px; }
    .jour-faits { justify-content: center; }
    /* Lot B2 (choix de Gwenaël, planche B2-7) : dès que la journée a deux
       étapes, le chemin remplace « Ensuite ». Fait = coché, blanc atténué ;
       en cours = gras, blanc ; à venir = gris ; flèches grises. Une seule
       ligne : un nom trop long se coupe d'une ellipse, « Aujourd'hui » jamais. */
    .jour-carte.avec-chemin .jour-ensuite { display: none; }
    .jour-carte.avec-chemin .jour-chemin:not([hidden]) { display: flex; }
    .jour-tete { flex: none; }
    .jour-chemin { align-items: baseline; gap: 7px; min-width: 0; margin: 0; overflow: hidden; white-space: nowrap;
                   font-size: 16px; line-height: 20px; color: rgba(255, 255, 255, .6); }
    .jour-chemin > span { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .jour-chemin > .fleche { flex: none; color: rgba(255, 255, 255, .45); }
    .jour-chemin > .fait { color: rgba(255, 255, 255, .8); }
    .jour-chemin > .en-cours { flex-shrink: 0; color: #fff; font-weight: 800; }
    /* Correctif (Codex, point 10) : les étapes faites ne prennent jamais la
       place du titre — deux lignes au plus, à droite. */
    .jour-faits { max-width: 300px; }
    .jour-faits.compact { max-width: 260px; justify-content: flex-end; text-align: right; }
  }
</style>
</head>
<body class="sur-code">
<div class="barre"></div>
<header class="entete">
  <img src="mathsgo-logo.png" alt="maths&go">
  <div class="droite" id="entete-droite" hidden>
    <span class="pastille teal" id="classe"></span>
    <button type="button" class="secondaire" id="changer">Se déconnecter</button>
  </div>
</header>

<main class="etroit">
  <section id="ecran-code">
    <img class="logo-accueil" src="mathsgo-logo.png" alt="maths&amp;go" width="180" height="84">
    <h1>Mon espace</h1>
    <p class="sous-titre">Entre le code que ton professeur t’a donné.</p>
    <div class="carte">
      <!-- method="post" : en usage normal le JavaScript intercepte l'envoi, mais
           s'il ne s'exécute pas, le navigateur enverrait le formulaire lui-même —
           et en GET le code de l'élève se retrouverait dans la barre d'adresse. -->
      <form id="form-code" method="post" autocomplete="off">
        <label for="code" class="pour-lecteur">Ton code, 6 caractères</label>
        <div class="cec" id="cases">
          <input id="code" class="cec-champ" name="code" type="text" inputmode="latin" maxlength="6"
                 spellcheck="false" autocapitalize="characters" autocorrect="off" required>
          <span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span>
        </div>
        <div class="actions">
          <button type="submit" id="valider">Entrer</button>
        </div>
      </form>
      <p class="message erreur" id="erreur" hidden></p>
    </div>
    <!-- 05/10/2026 : plus de phrase sous la carte — les six cases disent qu'il
         faut six caractères. -->
  </section>

  <section id="ecran-espace" hidden>
    <h1 id="titre">Mon espace</h1>
    <!-- Lot B1 : le bloc « Aujourd'hui ». Trois cartes à la même place ; la
         séance en direct et l'évaluation passent devant tout (règle CSS :
         une carte-lien visible cache la carte de la journée). -->
    <div class="jour-zone" id="jour-zone">
      <a class="jour-carte jour-direct" id="direct-lien" href="direct.php" hidden>
        <span class="jour-haut"><span class="jour-tete">En direct</span></span>
        <span class="jour-quoi"><span class="jour-icone"><svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false"><rect width="46" height="46" rx="12" fill="#fdf0e3"/><rect x="9" y="11" width="28" height="19" rx="3" fill="#fff" stroke="#063f86" stroke-width="2.4"/><path d="M19 36h8M23 30v6" stroke="#063f86" stroke-width="2.4" stroke-linecap="round"/><g fill="#f58220"><rect x="14" y="21" width="4" height="5" rx="1"/><rect x="21" y="16" width="4" height="10" rx="1"/><rect x="28" y="19" width="4" height="7" rx="1"/></g></svg></span><span class="jour-textes"><strong>Séance en direct</strong><span>Ton professeur a lancé une séance.</span></span></span>
        <span class="jour-bouton">Rejoindre la classe</span>
      </a>
      <a class="jour-carte" id="evaluation-lien" href="#" hidden>
        <span class="jour-haut"><span class="jour-tete">Aujourd’hui</span></span>
        <span class="jour-quoi"><span class="jour-icone"><svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false"><rect width="46" height="46" rx="12" fill="#fdf0e3"/><rect x="11" y="8" width="21" height="29" rx="3" fill="#fff" stroke="#063f86" stroke-width="2.4"/><path d="M16 16h11M16 22h11M16 28h6" stroke="#063f86" stroke-width="2.2" stroke-linecap="round"/><path d="M27.5 35.5l1.2-5.2 9.4-9.4 4 4-9.4 9.4z" fill="#f58220" stroke="#9a4b00" stroke-width="1.6" stroke-linejoin="round"/></svg></span><span class="jour-textes"><strong>Évaluation de tables</strong><span id="evaluation-lien-texte">Commencer l’évaluation.</span></span></span>
        <span class="jour-bouton">Commencer</span>
      </a>
      <section class="jour-carte" id="jour" aria-labelledby="jour-tete" hidden>
        <div class="jour-haut"><h2 class="jour-tete" id="jour-tete">Aujourd’hui</h2><p class="jour-ensuite" id="jour-ensuite"></p><p class="jour-chemin" id="jour-chemin" hidden></p></div>
        <div class="jour-quoi"><span class="jour-icone" id="jour-icone"></span><span class="jour-textes"><strong id="jour-nom"></strong><span id="jour-sous"></span></span></div>
        <a class="jour-bouton" id="jour-bouton" href="#">Commencer</a>
        <p class="jour-faits" id="jour-faits" hidden></p>
      </section>
    </div>
    <section class="semaine" id="semaine" aria-labelledby="semaine-titre" hidden>
      <h2 id="semaine-titre">Ma semaine</h2>
      <div class="semaine-ligne">
        <ol class="semaine-jours" id="semaine-jours"></ol>
        <p class="semaine-compte" id="semaine-compte"></p>
      </div>
    </section>
    <h2 class="portes-titre" id="portes-titre">Mes activités</h2>
    <ul id="applis" aria-labelledby="portes-titre"></ul>
  </section>

  <!-- L'appli Cours : la liste des chapitres (#cours) et le sommaire d'un
       chapitre (#cours=3e-PYT), dessinés par la page (dessinerCours) avec
       textContent : rien du serveur ne devient du HTML. Une fiche s'ouvre sur
       mathsgo.re, dans le même onglet ; son bouton « ◀ Mes cours » ramène ici,
       au chapitre (#cours=…). Seul le JOUR où l'élève touche une fiche est
       noté pour son professeur (lot « cours-ouvertures », noterOuverture). -->
  <section id="ecran-cours" hidden>
    <div class="cours-tete">
      <a class="rond" id="cours-retour" href="#" aria-label="Mon espace"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M19 12H5M11 6l-6 6 6 6"></path></svg></a>
      <h1>Mes cours</h1>
    </div>
    <div id="cours-corps"></div>
  </section>
</main>

<!-- 08/09/2026 : le pied ne propose plus qu'une seule chose, et elle reste
     ici. Il offrait auparavant deux sorties vers mathsgo.re, dont une page de
     confidentialité écrite pour un visiteur du site — elle parle de cookies et
     de mesure d'audience, elle dit « maths&go ne crée pas de compte élève » à
     un enfant qui se croit connecté, et son bouton « Retour à l'accueil » le
     déposait sur l'accueil du site. La licence n'est plus rappelée ici :
     l'espace est un service, pas un document ; elle est dite dans infos.php. -->
<footer class="pied">
  <a href="infos.php">Infos et confidentialité</a>
</footer>

<!-- « C'est toujours toi ? » : hors de <main>, de l'en-tête et du pied, qui
     deviennent inertes tant qu'elle est posée. Les mots sont ceux des applis. -->
<div id="garde" class="garde" role="dialog" aria-modal="true" aria-labelledby="garde-titre" hidden>
  <div class="garde-carte cec-garde">
    <p id="garde-titre" class="cec-garde-titre">C’est toujours toi&nbsp;?</p>
    <div class="cec-garde-ligne">
      <p id="garde-erreur" class="cec-garde-erreur" role="alert" hidden></p>
      <p class="cec-garde-consigne">Retape ton code pour continuer.</p>
    </div>
    <form id="garde-form" class="cec-garde-cadre" method="post" autocomplete="off">
      <label class="pour-lecteur" for="garde-code">Ton code, 6 caractères</label>
      <div class="cec" id="garde-cases">
        <input id="garde-code" class="cec-champ" type="text" inputmode="latin" maxlength="6" autocapitalize="characters"
               autocomplete="off" autocorrect="off" spellcheck="false" aria-describedby="garde-erreur">
        <span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span><span class="cec-case" aria-hidden="true"></span>
      </div>
      <button type="submit" id="garde-oui" class="cec-garde-entrer">Entrer</button>
    </form>
    <button type="button" id="garde-non" class="cec-garde-non">Non, ce n’est pas moi</button>
  </div>
</div>

<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">
(() => {
  "use strict";
  const CLE = "mathsgo-suivi-code";
  // « Se déconnecter » vide aussi la mémoire de l'onglet côté mathsgo.re
  // (08/11/2026) : l'accueil du site, avec ?sortie=1, la vide et renvoie ici
  // avec ?oublier=1 (assets/js/eleve-retour-espace.js). Adresse fixe.
  const SORTIE_PAR_LE_SITE = "https://mathsgo.re/?sortie=1";
  const $ = id => document.getElementById(id);

  // Le code n'est retenu que le temps de l'onglet (sessionStorage), pas d'une
  // visite à l'autre : sur un poste partagé au collège, l'espace ne doit pas
  // rouvrir « Bonjour Léa » au camarade suivant. Retaper six caractères est
  // le geste qui dit « c'est moi ». Les applis, sur mathsgo.re, gardent leur
  // propre copie du code dans la mémoire de LEUR onglet (sessionStorage du
  // site, que cette page ne peut pas toucher) : « Se déconnecter » vide les
  // deux, ici par revenirAuCode, là-bas par le passage par ?sortie=1.
  function stockage() {
    try { return window.sessionStorage; } catch (_) { return null; }
  }
  function lireCode() {
    try { return stockage()?.getItem(CLE) || ""; } catch (_) { return ""; }
  }
  function ecrireCode(code) {
    try { code ? stockage()?.setItem(CLE, code) : stockage()?.removeItem(CLE); } catch (_) {}
    // Lot 8 : la copie de l'espace part avec le code (« Se déconnecter »,
    // ?oublier=1, un code que le serveur ne connaît plus).
    if (!code) { oublierCopie(); oublierGeste(); }
  }

  // Lot 8 (retours du 31/10/2026) : la DERNIÈRE COPIE de l'espace — prénom,
  // classe, tuiles dans leur ordre, jauges, tuiles du haut (séance en direct,
  // évaluation). Elle vit dans le même sessionStorage que le code, le même
  // temps (l'onglet), et part avec lui. Au retour d'une appli, elle est
  // redessinée tout de suite, puis remplacée par la réponse du serveur.
  // Rien n'y entre que ce que la page a déjà affiché ; tout en ressort par
  // textContent, et une tuile ne mène qu'à une adresse de mathsgo.re.
  const CLE_COPIE = "mathsgo-suivi-espace";
  function oublierCopie() {
    try { stockage()?.removeItem(CLE_COPIE); } catch (_) {}
  }
  function lireCopie(code) {
    let copie = null;
    try { copie = JSON.parse(stockage()?.getItem(CLE_COPIE) || "null"); } catch (_) { return null; }
    if (!copie || typeof copie !== "object" || copie.code !== code || !Array.isArray(copie.applis)) return null;
    copie.applis = copie.applis.filter(appli => appli && typeof appli === "object" && typeof appli.cle === "string"
      && typeof appli.url === "string" && /^https:\/\/mathsgo\.re\//.test(appli.url));
    if (!copie.jauges || typeof copie.jauges !== "object" || Array.isArray(copie.jauges)) copie.jauges = {};
    if (!copie.haut || typeof copie.haut !== "object") copie.haut = null;
    // Lot B2 : la liste du jour de la classe, gardée avec le reste — sinon,
    // au retour d'une appli, le bloc « Aujourd'hui » montrerait d'abord le
    // mode automatique, puis sauterait à la liste à la réponse du serveur.
    // Relue comme ce qui vient du serveur : trois clés au plus, parmi les
    // portes de la copie elle-même (correctif Codex, point 13 : pas la liste
    // des moteurs de jauge — une appli ouverte sans jauge reste dans la liste).
    const portesCopie = copie.applis.map(appli => appli.cle);
    copie.jour = Array.isArray(copie.jour) ? copie.jour.filter(cle => typeof cle === "string"
      && portesCopie.includes(cle)).slice(0, 3) : [];
    return copie;
  }
  function ecrireCopie(copie) {
    try { stockage()?.setItem(CLE_COPIE, JSON.stringify(copie)); } catch (_) {}
  }
  function garderCopie(code, donnees, jauges) {
    if (lireCode() !== code) return;
    const ancienne = lireCopie(code);
    const copie = {
      code,
      prenom: typeof donnees.prenom === "string" ? donnees.prenom : "",
      classe: typeof donnees.classe === "string" ? donnees.classe : "",
      applis: (donnees.applis || []).filter(appli => appli.disponible && appli.url).map(appli => ({
        cle: appli.cle, nom: appli.nom, description: appli.description, url: appli.url,
        ancre: appli.ancre || null, disponible: true})),
      jauges: jauges || {},
      haut: hautCourant || (ancienne ? ancienne.haut : null),
      // Lot B2 : la liste du jour (relue par lireCopie).
      jour: Array.isArray(donnees.jour) ? donnees.jour.filter(cle => typeof cle === "string").slice(0, 3) : []
    };
    // L'appli Cours (lot « cours-appli ») : ses chapitres, seulement si la
    // classe l'a — au retour d'une fiche, l'écran du chapitre se dessine tout
    // de suite, sans passer par Mon espace. Relus par coursLus, comme ce qui
    // vient du serveur.
    if (Array.isArray(donnees.cours)) copie.cours = donnees.cours;
    ecrireCopie(copie);
  }
  // Les tuiles du haut, notées à chaque lecture de api/direct.php : elles
  // reviennent à leur place au retour, au lieu de pousser la grille après.
  function noterHaut(code, haut) {
    const copie = lireCopie(code);
    if (!copie || lireCode() !== code) return;
    copie.haut = haut;
    ecrireCopie(copie);
  }
  function nettoyer(brut) {
    return (brut || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  }
  // Les six cases (module commun code-en-cases.js, lot « code en cases ») :
  // elles recopient la vraie case de saisie, invisible ; la case suivante à
  // remplir est entourée de bleu, et quand les six sont pleines aucune ne
  // l'est (le geste suivant, c'est « Entrer »). Toucher une case pleine la
  // choisit : la lettre tapée la remplace. Le curseur du navigateur, lui,
  // reste toujours au bout (loupe et double-tap de l'iPhone compris).
  const casesCode = window.MathsGoCodeEnCases.monter($("code"), {nettoyer});
  function dessinerCases() { casesCode.dessiner(); }
  function afficherErreur(message) {
    $("erreur").textContent = message;
    $("erreur").hidden = !message;
  }

  // ------------------------------------------------ « C'est toujours toi ? »
  //
  // Lot « code en cases » (décidé par Gwenaël le 09/11/2026 ; constat F01 de
  // l'audit GPT du 09/11). Jusqu'ici, Mon espace n'avait AUCUN délai : laissé
  // ouvert, n'importe qui ouvrait une appli sous le nom de l'élève (une tuile
  // demande un billet neuf, et l'appli repart avec dix minutes devant elle).
  // Désormais, la même question que dans les applis : après dix minutes sans
  // geste, la carte « C'est toujours toi, Léa ? » couvre l'écran ; le bon code
  // (comparé ICI, aucun appel au serveur) rend l'écran, « Non » ou trois
  // erreurs font exactement « Se déconnecter ».
  //
  // Tant que la question est posée, rien ne part : pas de billet (les tuiles
  // et le reste de la page sont inertes, et chaque geste est retenu avant
  // qu'il n'arrive à une tuile), pas d'ouverture de fiche notée, plus de
  // lecture de la séance en direct. Le même contrôle est fait au chargement
  // (avant de dessiner quoi que ce soit), au retour dans l'onglet, au retour
  // par « précédent », et chaque minute.
  //
  // L'instant du dernier geste vit dans la mémoire de l'ONGLET, à côté du code :
  // un F5 ne remet pas le compteur à zéro. Un code sans instant (onglet ouvert
  // avant ce lot, mémoire abîmée, instant venu du futur) vaut « trop vieux » :
  // la question, jamais « actif depuis maintenant » (repris de l'audit GPT).
  // Dix minutes pile suffisent (>=, repris de l'audit GPT : les applis
  // disaient « plus de dix minutes »).
  const GARDE_INACTIVITE_MS = 10 * 60 * 1000;
  const GARDE_ESSAIS_MAX = 3;
  const CLE_GESTE = "mathsgo-suivi-dernier-geste";
  let gardeVisible = false;
  let gardeEssais = 0;

  function lireGeste() {
    let brut = null;
    try { brut = stockage()?.getItem(CLE_GESTE); } catch (_) { return 0; }
    const lu = Number(brut);
    return Number.isSafeInteger(lu) && lu > 0 && lu <= Date.now() ? lu : 0;
  }
  function noterGeste(instant) {
    try { stockage()?.setItem(CLE_GESTE, String(instant)); } catch (_) {}
  }
  function oublierGeste() {
    try { stockage()?.removeItem(CLE_GESTE); } catch (_) {}
  }
  function absenceTropLongue() {
    return nettoyer(lireCode()).length === 6 && Date.now() - lireGeste() >= GARDE_INACTIVITE_MS;
  }

  // Le RETOUR D'UNE APPLI (la flèche ←, ou le lien « Mon espace » de la ligne
  // de suivi) : l'élève y travaillait, Mon espace ne l'a pas vu. Le compteur
  // repart de zéro au chargement SEULEMENT si les trois choses sont vraies :
  //  — l'adresse porte ?retour=1 (seuls les liens de retour DES APPLIS le
  //    mettent ; pas le bouton « Mon espace » de l'accueil du site, ni les
  //    fiches de cours) ;
  //  — on arrive par un lien (navigation « navigate ») : ni F5, ni précédent ;
  //  — la page d'avant est sur le site (l'origine de SORTIE_PAR_LE_SITE) :
  //    une adresse tapée à la main n'a pas de page d'avant.
  // Ces liens ne se touchent que dans une appli qui ne pose pas sa propre
  // question (elle retient tous les gestes tant qu'elle la pose). L'adresse
  // est nettoyée tout de suite : un F5 ou un retour arrière ne la rejoue pas.
  // Ce n'est pas une preuve d'identité (l'audit GPT le rappelle) : c'est
  // l'activité vue par l'appli qu'on reprend ; voir « Et un pirate ? » de la
  // notice pour les cas qui restent.
  function retourDepuisAppli() {
    let demande = false;
    try { demande = new URLSearchParams(window.location.search).get("retour") === "1"; } catch (_) {}
    if (!demande) return false;
    try { window.history.replaceState(null, "", window.location.pathname + window.location.hash); } catch (_) {}
    let type = "";
    try { type = (performance.getEntriesByType("navigation")[0] || {}).type || ""; } catch (_) {}
    let origine = "";
    try { origine = document.referrer ? new URL(document.referrer).origin : ""; } catch (_) {}
    let site = "";
    try { site = new URL(SORTIE_PAR_LE_SITE).origin; } catch (_) { return false; }
    return type === "navigate" && origine !== "" && origine === site;
  }

  // Tout ce qui est sous la carte devient inerte : ni doigt, ni clavier, ni
  // lecteur d'écran n'y arrivent, et rien n'y bouge.
  function poserInerte(oui) {
    document.querySelectorAll("header.entete, main, footer.pied").forEach(bloc => { bloc.inert = oui; });
  }

  const casesGarde = window.MathsGoCodeEnCases.monter($("garde-code"), {nettoyer});
  function erreurGarde(message) {
    $("garde-erreur").textContent = message;
    $("garde-erreur").hidden = !message;
  }

  function montrerGarde() {
    if (gardeVisible) return;
    gardeVisible = true;
    gardeEssais = 0;
    // Une ouverture encore en route ne redessine plus rien, et la séance en
    // direct n'est plus lue (ses tuiles restent où elles sont, dessous).
    ouverture += 1;
    directTour += 1;
    window.clearTimeout(directMinuteur);
    poserInerte(true);
    const copie = lireCopie(nettoyer(lireCode()));
    const prenom = copie && typeof copie.prenom === "string" ? copie.prenom : "";
    $("garde-titre").textContent = prenom ? `C’est toujours toi, ${prenom} ?` : "C’est toujours toi ?";
    erreurGarde("");
    casesGarde.vider();
    $("garde").hidden = false;
    try { $("garde-code").focus({preventScroll: true}); } catch (_) {}
  }

  function cacherGarde() {
    gardeVisible = false;
    gardeEssais = 0;
    erreurGarde("");
    casesGarde.vider();
    $("garde").hidden = true;
    poserInerte(false);
  }

  function verifierGarde() {
    if (!gardeVisible && absenceTropLongue()) montrerGarde();
    return gardeVisible;
  }

  // « C'est moi » : le code tapé doit être celui de l'onglet. Bon : l'écran
  // revient, relu depuis le serveur (billets neufs, séance en direct).
  // « Non », ou trois erreurs : « Se déconnecter », exactement.
  function repondreGarde(cestMoi) {
    if (!gardeVisible) return;
    if (!cestMoi) { seDeconnecter(); return; }
    const code = nettoyer(lireCode());
    if (code.length === 6 && casesGarde.valeur() === code) {
      noterGeste(Date.now());
      cacherGarde();
      ouvrir(code, true);
      return;
    }
    gardeEssais += 1;
    if (gardeEssais >= GARDE_ESSAIS_MAX) { seDeconnecter(); return; }
    erreurGarde("Ce n’est pas le bon code.");
  }

  $("garde-form").addEventListener("submit", event => {
    event.preventDefault();
    repondreGarde(true);
  });
  $("garde-non").addEventListener("click", () => repondreGarde(false));

  // Chaque geste passe d'abord ici, avant d'arriver à ce qu'il touche (phase
  // de capture). Question posée : seuls les gestes DANS la carte passent.
  // Absence trop longue : le geste est retenu et la question posée — il
  // n'ouvre rien. Sinon : il compte comme activité. Le clic et le clic du
  // milieu sont regardés aussi : un lien s'ouvre parfois sans « pointerdown »
  // (clavier, clic du milieu ; repris de l'audit GPT).
  function retenir(event) {
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
  }
  function noterActivite(event) {
    const cible = event.target;
    const dansLaGarde = cible && typeof cible.closest === "function" && cible.closest("#garde");
    if (gardeVisible) { if (!dansLaGarde) retenir(event); return; }
    if (absenceTropLongue()) { retenir(event); montrerGarde(); return; }
    if (nettoyer(lireCode()).length === 6) noterGeste(Date.now());
  }
  ["pointerdown", "touchstart", "keydown", "click", "auxclick"].forEach(type => {
    document.addEventListener(type, noterActivite, {capture: true, passive: false});
  });
  // Un contrôle par minute : la question est déjà là quand la classe
  // suivante s'installe.
  window.setInterval(verifierGarde, 60000);

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
    // Coffres magiques (21/10/2026) : le coffre — couvercle bombé, ferrure
    // dorée et serrure — aux couleurs de la vignette du site (bois, or).
    "coffres":
      '<svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false">'
      + '<rect width="46" height="46" rx="12" fill="#eaf1fa"/>'
      + '<path d="M9 20a14 9 0 0 1 28 0Z" fill="#a77b50" stroke="#62412d" stroke-width="1.8" stroke-linejoin="round"/>'
      + '<rect x="9" y="20" width="28" height="16" rx="2.5" fill="#a77b50" stroke="#62412d" stroke-width="1.8"/>'
      + '<rect x="9" y="18.5" width="28" height="4" fill="#f9bf3b" stroke="#a85b08" stroke-width="1.4"/>'
      + '<rect x="19.5" y="20.5" width="7" height="9" rx="1.6" fill="#f9bf3b" stroke="#a85b08" stroke-width="1.4"/>'
      + '<path d="M23 23.4v3.2" stroke="#62412d" stroke-width="1.8" stroke-linecap="round"/></svg>',
    // Anzan (lot « Qui voit quoi », lot 4a, 23/10/2026, idée de Gwenaël) : le
    // soroban de la vignette du site — le cadre et la barre bleu nuit, les
    // perles vert d'eau quand elles comptent (3 tiges, 1 + 3 perles : à 40 px,
    // les 4 perles du bas se touchent). Il affiche 2, 7, 4.
    "flash-anzan":
      '<svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false">'
      + '<rect width="46" height="46" rx="12" fill="#eaf1fa"/>'
      + '<rect x="7.5" y="9.5" width="31" height="27" rx="3.5" fill="#fff" stroke="#10294a" stroke-width="2.4"/>'
      + '<g stroke="#9fb4c4" stroke-width="1.4"><path d="M15 11v24M23 11v24M31 11v24"/></g>'
      + '<rect x="12" y="11.6" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="12" y="31.8" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="12" y="28.4" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="20" y="31.8" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="20" y="28.4" width="6" height="3" rx="1.5" fill="#c9d8e4"/><rect x="28" y="11.6" width="6" height="3" rx="1.5" fill="#c9d8e4"/>'
      + '<rect x="12" y="20.4" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="12" y="23.8" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="20" y="14.6" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="20" y="20.4" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="20" y="23.8" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="28" y="20.4" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="28" y="23.8" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="28" y="27.2" width="6" height="3" rx="1.5" fill="#087a71"/><rect x="28" y="30.6" width="6" height="3" rx="1.5" fill="#087a71"/>'
      + '<rect x="7.5" y="18" width="31" height="2" fill="#10294a"/></svg>',
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
    // SPLAT! : LE SPLAT de la même bibliothèque (clé « splat »), repris tel
    // quel SAUF la couleur, passée du violet au bleu maths&go. Sur le site la
    // lettre change chaque jour (daily-splat-letter.js) ; ici elle reste « x »,
    // l'inconnue. (Clé « splat-equations » jusqu'au 07/10/2026.)
    "splat":
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
      + 'M33.2 12.8l-2.5 2.5M15.3 30.7l-2.5 2.5"/></g></svg>',
    // L'appli Cours (lot « cours-appli », 08/11/2026) : un livre ouvert.
    "cours": '<svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false"><rect width="46" height="46" rx="12" fill="#e6f6f5"/><path d="M23 14c-4-3-9-3.5-13-2.5v21c4-1 9-.5 13 2.5z" fill="#fff" stroke="#063f86" stroke-width="2.4" stroke-linejoin="round"/><path d="M23 14c4-3 9-3.5 13-2.5v21c-4-1-9-.5-13 2.5z" fill="#fff" stroke="#063f86" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 18c2.5-.5 4.5-.2 6 .6M14 23c2.5-.5 4.5-.2 6 .6" stroke="#08aaa5" stroke-width="2.2" stroke-linecap="round"/><path d="M26 18.6c1.5-.8 3.5-1.1 6-.6M26 23.6c1.5-.8 3.5-1.1 6-.6" stroke="#f58220" stroke-width="2.2" stroke-linecap="round"/></svg>'
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

  // Un clic ordinaire sur une tuile : un billet frais, puis l'appli. Le clic
  // du milieu ou « ouvrir dans un nouvel onglet » prennent l'adresse de la
  // tuile, avec le billet de l'entrée.
  async function ouvrirAppli(event, lien, appli, code, billetEntree) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    // Défense en profondeur : le geste a déjà été retenu plus haut.
    if (verifierGarde()) return;
    if (lien.dataset.enCours) return;
    lien.dataset.enCours = "1";
    const billet = await billetFrais(code, appli);
    // La question a pu être posée, ou l'élève a pu partir, pendant l'attente :
    // on ne part pas.
    if (gardeVisible || lireCode() !== code) { delete lien.dataset.enCours; return; }
    // Correctif S3 (Codex, nº 4) : le serveur ne connaît plus ce code — on
    // ne part pas avec l'ancien billet, on fait le ménage.
    if (billet === null) {
      delete lien.dataset.enCours;
      if (lireCode() === code) revenirAuCode();
      return;
    }
    // Lot B2, correctif (relecture Codex, point 11) : la porte n'est plus
    // ouverte à l'élève (ou son adresse a changé) depuis le dessin — l'espace
    // est relu au lieu de partir vers une appli fermée.
    if (billet === false) {
      delete lien.dataset.enCours;
      ouvrir(code, true);
      return;
    }
    window.location.assign(adresseAppli(appli, billet || billetEntree));
    window.setTimeout(() => { delete lien.dataset.enCours; }, 2000);
  }

  // Un billet neuf au moment du clic : celui reçu à l'entrée peut avoir
  // expiré si l'élève a pris son temps. Si le serveur ne répond pas, on part
  // avec le billet de l'entrée — il vaut peut-être encore. null : le serveur
  // dit que ce code n'existe plus (404) — seul cas où l'on ne part pas.
  // Lot B2, correctif (Codex, point 11) : la réponse dit aussi les portes
  // ouvertes à l'élève MAINTENANT ; si celle du clic n'y est plus, ou plus à la
  // même adresse, false : on ne part pas.
  async function billetFrais(code, appli) {
    try {
      const reponse = await fetch("api/eleve.php", {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=UTF-8"},
        body: JSON.stringify({code, billet: true}),
        cache: "no-store"
      });
      const donnees = await reponse.json().catch(() => null);
      if (reponse.ok && donnees && donnees.ok && typeof donnees.billet === "string") {
        if (appli && Array.isArray(donnees.applis)
          && !donnees.applis.some(a => a && a.cle === appli.cle && a.disponible && a.url === appli.url)) return false;
        return donnees.billet;
      }
      if (reponse.status === 404) return null;
    } catch (_) {}
    return "";
  }

  // ------------------------------------------------------------------ la jauge
  //
  // Ce que la tuile d'une activité COMMENCÉE montre en plus : pour Défi tables,
  // une barre, le compte (« 4 tables passées sur 9 ») et le rang ; pour SPLAT!,
  // une pastille par monde et le compte (« 13 étapes réussies sur 37 »). Trois
  // règles tiennent tout ce qui suit :
  //  1. la grille ne dépend jamais de la jauge. Depuis le lot 8 (31/10/2026),
  //     elle attend ses jauges un court instant (ATTENTE_JAUGES) pour
  //     s'afficher d'un coup, puis s'affiche sans elles. Un serveur muet, une
  //     réponse illisible, un moteur qui ne se charge pas : la tuile reste
  //     exactement ce qu'elle était, sans message d'erreur. L'élève doit
  //     pouvoir ouvrir son activité même quand la jauge échoue ;
  //  2. rien de ce que le serveur renvoie n'entre dans la page autrement que
  //     par textContent — c'est la règle du serveur depuis le premier lot, et
  //     un parcours est un objet fabriqué par un appareil d'élève ;
  //  3. c'est le MOTEUR de l'activité qui lit son parcours, jamais cette page :
  //     « acquise », « rang », « étape réussie », « monde fini » sont ses
  //     règles à lui, et elles changent (celles de Défi tables ont changé le
  //     08/09/2026). La page ne fait que l'appeler.
  //
  // Une entrée par activité qui sait se raconter : où est son moteur (servi
  // d'ici, copie du dépôt — politique de contenu : jamais un script de
  // mathsgo.re dans cette page), sous quel nom il s'installe dans la fenêtre,
  // et son lecteur. Tant qu'une activité n'a pas d'entrée ici, elle n'a pas de
  // jauge — et rien ne casse.
  const JAUGES = {
    "defi-tables": {
      url: "prof/defi_tables_mon_parcours.js?v=<?= htmlspecialchars($versionMoteur, ENT_QUOTES) ?>",
      global: "MATHSGO_DEFI_TABLES_MON_PARCOURS",
      lecteur: (P, brut, reglages) => {
        // Un parcours illisible (pas un objet) : rien du tout, comme avant —
        // le moteur en ferait un parcours neuf, et la pastille « la table
        // de 2 » d'un élève qui n'a rien.
        if (!brut || typeof brut !== "object" || Array.isArray(brut)) return null;
        const parcours = P.normaliserParcours(brut);
        const etat = P.etatAffichage(parcours);
        const fait = etat.acquises.length;
        const total = P.TABLES.length;
        const aujourdhui = aujourdhuiDefiTables(P, parcours, reglages);
        // Pas de barre ni de compte tant qu'AUCUNE table n'est acquise :
        // activité ouverte et jouée sans encore réussir une table — il faut
        // 20 bonnes réponses en 1 min 30 avec 2 erreurs au plus, et le jour de
        // la distribution des codes, c'est toute la classe. « 0 table acquise
        // sur 9 » au-dessus d'une barre vide est le reproche qu'on refuse ;
        // c'est le même seuil que la carte de classe du professeur (09/09/2026).
        // Lot « fignolage du 22/10 » (choix de Gwenaël) : la pastille
        // « Aujourd'hui » seule, elle, se montre (« la table de 2 »). Un élève
        // qui n'a jamais ouvert Défi tables n'a pas de parcours sur le
        // serveur : le lecteur n'est même pas appelé, il n'a rien.
        if (!fait) return aujourdhui ? {aujourdhui} : null;
        return {
          fait, total,
          // Mot pour mot la phrase de l'accueil de Défi tables.
          compte: `${fait} table${fait > 1 ? "s" : ""} passée${fait > 1 ? "s" : ""} sur ${total}`,
          rang: badgeDefiTables(P, etat),
          // Plus de « Mon mélange à faire » : le mélange est libre (lot « un
          // seul système », 05/10/2026).
          note: "",
          aujourdhui
        };
      }
    },
    // SPLAT! (lot « splat-suivi-3 », 07/10/2026, choix B de Gwenaël) : les six
    // mondes en pastilles — vide, à moitié (en cours), pleine (fini) — et le
    // compte des étapes réussies, les Bonus à part. Le total est celui de la
    // carte (37 étapes), jamais écrit ici.
    // Lot « splat-suivi-5 » (08/10/2026, choix de Gwenaël) : quand le professeur
    // n'a pas ouvert tous les mondes à la classe, les mondes fermés sont des
    // pastilles grises en pointillés, et les comptes ne portent que sur les
    // mondes ouverts (« 9 étapes réussies sur 9 » quand les mondes 1 et 2 sont
    // finis). C'est le moteur qui lit la liste rendue par le serveur.
    "splat": {
      url: "prof/splat-parcours.js?v=<?= htmlspecialchars($versionSplat, ENT_QUOTES) ?>",
      global: "MathsGoSplatParcours",
      lecteur: (P, brut, reglages) => {
        const ouverts = typeof P.mondesDeReglages === "function" ? P.mondesDeReglages(reglages) : null;
        const ouvert = numero => !ouverts || ouverts.includes(numero);
        const tout = P.resumeProf(brut);
        const resume = ouverts
          ? P.resumeProf(brut, P.CARTE.ETAPES.filter(etape => ouvert(etape[4])), P.CARTE.BONUS.filter(etape => ouvert(etape[4])))
          : tout;
        const fait = resume.faits;
        // Même règle que Défi tables : rien tant qu'aucune étape n'est réussie
        // (une série en cours, ou un Bonus seul, ne fait pas encore de jauge).
        if (!fait) return null;
        const bonus = resume.bonus.faits;
        return {
          fait, total: resume.total,
          compte: `${fait} étape${fait > 1 ? "s" : ""} réussie${fait > 1 ? "s" : ""} sur ${resume.total}`,
          bonus: bonus ? `✨ ${bonus} bonus` : "",
          mondes: tout.mondes.map(monde => ({numero: monde.numero, etat: ouvert(monde.numero) ? monde.etat : "ferme"}))
        };
      }
    },
    // Coffres magiques (lot « Coffres magiques sur le suivi », 21/10/2026,
    // planche validée par Gwenaël) : une ligne par niveau commencé — « Niveau
    // 1 : 5 trésors », « Niveau 3 : pas encore de trésor » — et, au bout de
    // la ligne du niveau de la partie en cours, « 🔑 6 / 10 ». Rien tant que
    // l'élève n'a ni trésor ni partie en cours (une partie à 0 clé n'est
    // qu'un choix de réglages : elle ne se montre pas). C'est le moteur qui
    // lit le parcours (resumeTuile) ; les mots sont écrits ici.
    "coffres": {
      url: "prof/coffres-parcours.js?v=<?= htmlspecialchars($versionCoffres, ENT_QUOTES) ?>",
      global: "MathsGoCoffresParcours",
      lecteur: (P, brut) => {
        const resume = P.resumeTuile(brut);
        if (resume.vide) return null;
        // Lot « le chemin des coffres et le cadeau Gloubi » (09/11/2026,
        // choix A de Gwenaël) : « Niveau 1 » puis ses trois coffres (bronze,
        // argent, or : gagnés en couleur, à gagner en pointillés), comme sur la
        // carte « Tes coffres » de l'appli ; rien de Gloubi.
        const lignes = resume.lignes.map(ligne => ({
          texte: `Niveau ${ligne.niveau}`,
          coffres: Math.max(0, Math.min(3, ligne.coffres || 0)),
          bonus: ligne.cles !== null ? `\u{1F511} ${ligne.cles} / ${ligne.total}` : ""
        }));
        // Lot B1 : l'insigne, le plus haut niveau où un coffre est gagné ; la
        // ligne, le niveau de la partie en cours (sinon ce même niveau), ses
        // trois coffres et la clé.
        const gagnes = resume.lignes.filter(ligne => ligne.coffres > 0);
        const enCours = resume.lignes.find(ligne => ligne.cles !== null) || gagnes[gagnes.length - 1] || resume.lignes[0];
        return {
          lignes,
          niveauGagne: gagnes.length ? gagnes[gagnes.length - 1].niveau : 0,
          niveau: enCours.niveau,
          coffres: Math.max(0, Math.min(3, enCours.coffres || 0)),
          cles: enCours.cles !== null ? `\u{1F511} ${enCours.cles} / ${enCours.total}` : ""
        };
      }
    },
    // Anzan (lot « Qui voit quoi », lot 4a, 23/10/2026, choix de Gwenaël) :
    // une seule ligne, « 230 calculs · 5 jours d'entraînement » — on compte
    // des calculs, pas des séances (une séance fait 5, 10 ou 20 calculs), et
    // des jours distincts. Rien tant qu'aucun calcul n'est fait. Les mots
    // sont ceux du moteur (texteResume) : les mêmes dans « Mon historique ».
    "flash-anzan": {
      url: "prof/flash_anzan_parcours.js?v=<?= htmlspecialchars($versionAnzan, ENT_QUOTES) ?>",
      global: "MathsGoFlashAnzanParcours",
      lecteur: (P, brut) => {
        const resume = P.resumeTuile(brut);
        if (resume.vide) return null;
        // Lot B1 : les grades réussis, nommés par le moteur (« 10e kyu »).
        const prof = typeof P.resumeProf === "function" ? P.resumeProf(brut) : {};
        const nom = n => (n && typeof P.nomGrade === "function" ? P.nomGrade(n) : "");
        return {lignes: [{texte: resume.texte, bonus: ""}], texte: resume.texte,
          grade: nom(prof.grade), colonne: nom(prof.gradeColonne)};
      }
    },
    // Défi calcul (lot 2b, 31/10/2026, planche validée par Gwenaël) : une
    // jauge et « 6 compétences sues sur 129 » — le compte de l'accueil de
    // l'appli (la carte, par le noyau). Rien tant qu'aucune compétence n'est
    // sue (une barre vide ressemble à un reproche : même règle que Défi
    // tables). Deux moteurs : le noyau d'abord (la carte), puis la
    // progression (resumeProf), le même fichier que la page du professeur.
    "defi-calcul": {
      avant: {url: "prof/defi_calcul_core.js?v=<?= htmlspecialchars($versionCalculCore, ENT_QUOTES) ?>", global: "MATHSGO_DEFI_CALCUL_CORE"},
      url: "prof/defi_calcul_mon_parcours.js?v=<?= htmlspecialchars($versionCalcul, ENT_QUOTES) ?>",
      global: "MATHSGO_DEFI_CALCUL_MON_PARCOURS",
      // Lot 4 « les ceintures » (14/11/2026) : la ceinture qu'il porte, avec
      // ses barrettes, devant le compte ; le compte sur ce que l'appli
      // propose (les modules construits) jusqu'au palier réglé pour l'élève.
      lecteur: (P, brut, reglages) => {
        const CORE = window.MATHSGO_DEFI_CALCUL_CORE;
        if (!CORE) return null;
        const resume = P.resumeProf(brut, CORE.carte());
        const jusqua = typeof P.reglagesDeSeance === "function" ? P.reglagesDeSeance(reglages).palier : 4;
        const paliers = ((resume.ouvert && resume.ouvert.paliers) || []).filter(p => p.palier <= jusqua);
        const sues = paliers.reduce((somme, p) => somme + p.sues, 0);
        const total = paliers.reduce((somme, p) => somme + p.total, 0);
        if (!sues) return null;
        const c = resume.ceintures || {porte: 0, barrettes: 0};
        const ceinture = CORE.CEINTURES && CORE.CEINTURES[c.porte];
        return {
          fait: sues, total,
          compte: `${ceinture ? `${ceinture.nom} · ` : ""}${sues} compétence${sues > 1 ? "s" : ""} sue${sues > 1 ? "s" : ""} sur ${total}`,
          ceinture: ceinture && typeof CORE.elementCeinture === "function" ? {n: c.porte, barrettes: c.barrettes} : null,
          bonus: ""
        };
      }
    }
  };
  const moteursEnCours = {};

  // Lot « fignolage du 22/10 » (planche 3, choix de Gwenaël). Le badge de la
  // tuile Défi tables : Bronze, Argent, Or, Platine tant qu'aucune étoile
  // n'est gagnée (les rangs de l'appli, inchangés) ; puis les étoiles (★ à
  // ★★★★) ; à la couronne, « 👑 Légende des tables ». « Diamant » (4 étoiles)
  // n'apparaît plus ici — l'écart avec l'en-tête de l'appli est accepté.
  // Le nombre d'étoiles est celui que rend le moteur (etat.expert.niveau).
  function badgeDefiTables(P, etat) {
    const etoiles = Number(etat.expert && etat.expert.niveau) || 0;
    if (etoiles >= P.ETOILES_MAX) return P.rang(P.RANGS.length - 1);
    if (etoiles >= 1) return {niveau: etoiles, cle: "etoiles", nom: "★".repeat(etoiles),
      lu: `${etoiles} étoile${etoiles > 1 ? "s" : ""}`};
    return etat.rang && etat.rang.niveau > 4 ? P.rang(4) : etat.rang;
  }

  // Lot « fignolage du 22/10 » : ce que dit la pastille « Aujourd'hui » de la
  // tuile Défi tables — la PROCHAINE chose à faire, lue dans la séance du jour
  // par le moteur (ouvrirSeance + programmeDeSeance, la même source que la
  // carte « Ma séance du jour » de l'appli) ; rien n'est deviné ici, et le
  // moteur n'est pas modifié.
  //  - la séance pas encore jouée, ou commencée : « 🔔 Aujourd'hui : » + la
  //    1re étape qui reste, puis la 1re étape qui se dit autrement (quatre
  //    marches de la table de 5 ne font qu'une « table de 5 ») ;
  //  - une séance finie aujourd'hui et rien en cours : « ✓ Séance du jour
  //    faite », ou « ✓ Séance faite · encore 26 calculs » s'il reste des
  //    calculs dus.
  // Les records : la classe les a fermés (réglage de Ma classe) → la séance
  // d'une Légende rejoue la couronne (« puis 👑 ») ; sinon elle court
  // (« puis ton record »).
  // Limite connue : la table que l'élève a choisie (« Changer de table ») vit
  // sur son appareil, pas sur le serveur. La pastille annonce la table que la
  // séance prend d'elle-même (tableDeSeance) : elle ne ment pas sur ce qu'il
  // y a à faire, au pire sur le numéro de la table.
  function motEtapeDefiTables(P, etape) {
    if (etape.type === "revision") return `${etape.calculs}\u00a0calcul${etape.calculs > 1 ? "s" : ""}`;
    if (etape.type === "melange") return "Mon mélange";
    if (etape.type === "etoile") return P.symboleEtoile(etape.etoile);
    if (etape.type === "course") return "ton record";
    if (Number.isInteger(etape.table)) return `la table de\u00a0${etape.table}`;
    return "";
  }

  function aujourdhuiDefiTables(P, parcours, reglages) {
    const jour = P.jourLocal();
    const seance = P.ouvrirSeance(parcours, {aujourdhui: jour});
    if (!seance.faites.length && P.bilanSeances(parcours, jour).aujourdhui > 0) {
      const dus = P.dusDuJour(parcours, jour).length;
      return dus
        ? {faite: true, texte: `✓ Séance faite · encore ${dus}\u00a0calcul${dus > 1 ? "s" : ""}`}
        : {faite: true, texte: "✓ Séance du jour faite"};
    }
    const reglage = reglages && typeof reglages === "object" ? reglages["defi-tables"] : null;
    const records = !(reglage && typeof reglage === "object" && reglage.records === false);
    const options = records ? {records: {meilleur: null}} : {};
    const mots = P.programmeDeSeance(parcours, seance, jour, options).etapes
      .map(etape => motEtapeDefiTables(P, etape)).filter(Boolean);
    if (!mots.length) return null;
    const ensuite = mots.find(mot => mot !== mots[0]);
    const quoi = `${mots[0]}${ensuite ? `, puis ${ensuite}` : ""}`;
    return {faite: false, texte: `\u{1F514} Aujourd’hui\u00a0: ${quoi}`, quoi};
  }

  // Un moteur est chargé UNE fois, et seulement si son activité a un parcours
  // à habiller : 70 ko qu'un élève qui n'a rien commencé n'a aucune raison de
  // télécharger. C'est le même fichier que celui de la page du professeur,
  // gardé identique au dépôt par un test.
  // Lot 2b de Défi calcul : une activité peut demander un script AVANT son
  // moteur (`avant` : le noyau, que le moteur lit) ; s'il manque, pas de
  // jauge.
  function chargerScript(url, global) {
    if (window[global]) return Promise.resolve(window[global]);
    return new Promise(resolve => {
      const script = document.createElement("script");
      script.src = url;
      script.addEventListener("load", () => resolve(window[global] || null));
      script.addEventListener("error", () => resolve(null));
      document.head.appendChild(script);
    });
  }

  function chargerMoteur(cle) {
    const jauge = JAUGES[cle];
    if (window[jauge.global] && (!jauge.avant || window[jauge.avant.global])) return Promise.resolve(window[jauge.global]);
    if (moteursEnCours[cle]) return moteursEnCours[cle];
    moteursEnCours[cle] = (jauge.avant ? chargerScript(jauge.avant.url, jauge.avant.global) : Promise.resolve(true))
      .then(prealable => (prealable ? chargerScript(jauge.url, jauge.global) : null));
    return moteursEnCours[cle];
  }

  // Le parcours d'une activité, lu comme tout le reste : le code dans le CORPS
  // d'un POST, jamais dans l'adresse. Toute avarie rend null.
  async function lireParcours(code, cle) {
    try {
      const reponse = await fetch("api/parcours.php", {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=UTF-8"},
        body: JSON.stringify({code, appli: cle, lire: true}),
        cache: "no-store"
      });
      if (!reponse.ok) return null;
      const donnees = await reponse.json().catch(() => null);
      if (!donnees || !donnees.ok || !donnees.existe || !donnees.parcours) return null;
      return donnees.parcours;
    } catch (_) { return null; }
  }

  // Les couleurs des six mondes SPLAT!, celles de la carte des mondes
  // (outils/splat_univers.html, « --c ») : orange, bleu, framboise, cannelle,
  // sarcelle, violet.
  const COULEURS_MONDES = {1: "#d9690c", 2: "#0b67b2", 3: "#be185d", 4: "#92400e", 5: "#08857f", 6: "#7b42b4"};
  const ETATS_MONDE = {vide: "pas commencé", cours: "en cours", fini: "fini", ferme: "fermé pour ta classe"};
  // Un monde que ton professeur n'a pas encore ouvert (lot « splat-suivi-5 ») :
  // anneau gris en pointillés, chiffre gris.
  const GRIS_FERME = "#949eaa";
  const SVG = "http://www.w3.org/2000/svg";

  function elementSvg(nom, attributs) {
    const element = document.createElementNS(SVG, nom);
    Object.keys(attributs).forEach(cle => element.setAttribute(cle, attributs[cle]));
    return element;
  }

  // Une pastille de monde : un rond de 24 px dans la couleur du monde — vide,
  // à moitié (en cours) ou plein (fini) — et le numéro du monde au centre.
  // Dessinée en SVG pour que le chiffre soit centré quelle que soit la police :
  // son pied est posé 0,35 em sous le centre, la moitié de la hauteur d'un
  // chiffre. Sur la pastille à moitié, le chiffre est blanc cerné de la
  // couleur du monde : il se lit d'un seul tenant des deux côtés (essayé :
  // un chiffre de couleur cerné de blanc se lisait en deux morceaux).
  // Coffres magiques (lot « le chemin des coffres », 09/11/2026) : les trois
  // coffres d'un niveau, le dessin de l'appli (couvercle bombé, ferrure,
  // serrure) ; à gagner, en pointillés gris. Lu « 2 coffres sur 3 ».
  const COULEURS_COFFRES = [["#c98446", "#7a4520", "#e7a96b"], ["#c4ccd6", "#5d6b7a", "#eef2f6"], ["#f6c13d", "#9a5b06", "#ffe08a"]];
  function coffresDuNiveau(gagnes) {
    const groupe = document.createElement("span");
    groupe.className = "coffres-niveau";
    groupe.setAttribute("role", "img");
    groupe.setAttribute("aria-label", `${gagnes} coffre${gagnes > 1 ? "s" : ""} sur 3`);
    COULEURS_COFFRES.forEach(([fond, bord, clair], index) => {
      const dessin = elementSvg("svg", {width: "30", height: "30", viewBox: "0 0 46 46", "aria-hidden": "true", focusable: "false"});
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

  function pastilleMonde(monde) {
    const etat = Object.prototype.hasOwnProperty.call(ETATS_MONDE, monde.etat) ? monde.etat : "vide";
    const couleur = COULEURS_MONDES[monde.numero] || "#063f86";
    const dessin = elementSvg("svg", {class: `monde-p ${etat}`, width: "24", height: "24", viewBox: "0 0 24 24",
      "aria-hidden": "true", focusable: "false"});
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

  // Lot 8 (retours du 31/10/2026) : la LECTURE des jauges est séparée de leur
  // POSE. lireJauges ne touche pas à la page : elle rend {clé: jauge} (rien
  // pour une activité sans parcours, illisible, ou dont le moteur manque).
  // La page pose ensuite toutes les jauges d'un coup, avant de montrer la
  // grille (afficherEspace) : plus de tuiles qui se remplissent ni qui
  // remontent sous les yeux de l'élève.
  // ------------------------------------------- lot S3 : Ma semaine, les gains
  //
  // Chantier « Suivre ses élèves », lot S3 (choix de Gwenaël du 07/11/2026).
  // RIEN DE NOUVEAU N'EST DEMANDÉ AU SERVEUR : la page relit les parcours
  // qu'elle lit déjà pour les jauges, et chaque moteur rend le même résumé
  // que pour la page du professeur (resumeSuivi, lot S1) — des jours et des
  // nombres, jamais un temps passé (« aider l'élève, pas le fliquer »).
  //  - un jour de travail : la règle de chaque moteur (une séance finie, une
  //    étape jouée, un trésor ouvert) ; une connexion seule ne compte pas ;
  //  - les gains : ceux de « À féliciter » (une table passée, un monde fini,
  //    un grade), et pour Défi calcul les compétences devenues sues ;
  //  - la tuile épurée : la phrase sous le nom de l'appli reste tant que le
  //    serveur n'a aucun parcours de l'élève pour elle (jamais ouverte).
  // Le tout est rangé avec les jauges sous la clé CLE_ESPACE (une clé
  // d'appli ne commence jamais par « @ ») : la copie de l'onglet le garde
  // avec elles, et poserLesJauges ne lit que les clés des applis.
  const CLE_ESPACE = "@espace";

  // La date de l'appareil de l'élève, « 2026-11-12 » : celle qu'utilisent
  // les applis elles-mêmes pour dater une séance.
  function jourDeLAppareil(instant) {
    const d = instant instanceof Date ? instant : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function jourDecale(jour, nombre) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    d.setDate(d.getDate() + nombre);
    return jourDeLAppareil(d);
  }
  function lundiDeJour(jour) {
    const d = new Date(`${jour}T12:00:00`);
    return Number.isNaN(d.getTime()) ? jour : jourDecale(jour, -((d.getDay() + 6) % 7));
  }
  const JOUR_VALIDE = /^\d{4}-\d{2}-\d{2}$/;
  // Correctif S3 (Codex, nº 5) : une VRAIE date du calendrier (« 2026-02-31 »
  // a la forme, mais pas la date).
  function jourValide(jour) {
    if (typeof jour !== "string" || !JOUR_VALIDE.test(jour)) return false;
    const d = new Date(`${jour}T12:00:00`);
    return !Number.isNaN(d.getTime()) && jourDeLAppareil(d) === jour;
  }

  // Ce qu'une appli dit de la semaine : ses jours de travail depuis lundi,
  // s'il a déjà travaillé une fois, et ce qu'elle félicite. null : le moteur
  // ne sait pas le dire (une copie d'avant le lot S1).
  function semaineDe(P, brut, aujourdhui) {
    if (!P || typeof P.resumeSuivi !== "function") return null;
    const resume = P.resumeSuivi(brut, {aujourdhui});
    if (!resume || !Array.isArray(resume.jours)) return null;
    const lundi = lundiDeJour(aujourdhui);
    return {
      jours: resume.jours.map(j => j && j.jour).filter(j => jourValide(j) && j >= lundi && j <= aujourdhui),
      travail: Boolean(resume.dernier),
      feliciter: Array.isArray(resume.feliciter) ? resume.feliciter : []
    };
  }

  // « 4 », « 4 et 6 », « 2, 4 et 6 ».
  function enListe(nombres) {
    return nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} et ${nombres[nombres.length - 1]}` : String(nombres[0]);
  }

  // Le gain d'une appli cette semaine, en mots (vide : rien de gagné).
  function gainDe(cle, P, brut, semaine, aujourdhui) {
    const f = semaine ? semaine.feliciter : [];
    const nombres = (type, champ) => f.filter(x => x && x.type === type && Number.isInteger(x[champ]))
      .map(x => x[champ]).sort((a, b) => a - b);
    if (cle === "defi-tables") {
      const tables = nombres("table", "table");
      if (!tables.length) return "";
      return tables.length > 1 ? `↑ tables de ${tables.slice(0, -1).join(", ")} et de ${tables[tables.length - 1]} passées cette semaine` : `↑ table de ${tables[0]} passée cette semaine`;
    }
    if (cle === "splat") {
      const mondes = nombres("monde", "monde");
      if (!mondes.length) return "";
      return mondes.length > 1 ? `↑ mondes ${enListe(mondes)} finis cette semaine` : `↑ monde ${mondes[0]} fini cette semaine`;
    }
    if (cle === "flash-anzan") {
      const grades = nombres("grade", "grade");
      const nom = grades.length && typeof P.nomGrade === "function" ? P.nomGrade(grades[grades.length - 1]) : "";
      return nom ? `↑ ${nom} réussi cette semaine` : "";
    }
    if (cle === "defi-calcul") {
      // Les compétences devenues sues depuis lundi, lues par le moteur
      // (resumeProf : le jour où chacune est devenue sue).
      const CORE = window.MATHSGO_DEFI_CALCUL_CORE;
      if (!CORE || typeof P.resumeProf !== "function") return "";
      const lundi = lundiDeJour(aujourdhui);
      const resume = P.resumeProf(brut, CORE.carte(), aujourdhui);
      let n = 0;
      (resume.modules || []).forEach(m => (m.sues || []).forEach(jour => {
        if (typeof jour === "string" && jour >= lundi && jour <= aujourdhui) n += 1;
      }));
      return n ? `↑ +${n} cette semaine` : "";
    }
    return "";
  }

  async function lireJauges(donnees, code) {
    const jauges = {};
    const aLire = (donnees.applis || [])
      .filter(appli => appli.disponible && appli.url && JAUGES[appli.cle])
      .map(appli => appli.cle);
    if (!aLire.length) return jauges;
    const parcours = await Promise.all(aLire.map(cle => lireParcours(code, cle)));
    if (!parcours.some(Boolean)) return jauges;
    // Un moteur par activité, et seulement pour celles qui ont un parcours.
    const moteurs = await Promise.all(aLire.map((cle, i) => (parcours[i] ? chargerMoteur(cle) : null)));
    // Lot S3 : la semaine, toutes applis ensemble, et les applis ouvertes.
    const aujourdhui = jourDeLAppareil();
    const espace = {aujourdhui, jours: [], travail: false, faits: [], ouvertes: aLire.filter((cle, i) => Boolean(parcours[i]))};
    aLire.forEach((cle, i) => {
      const P = moteurs[i];
      if (!parcours[i] || !P) return;
      let jauge = null;
      try { jauge = JAUGES[cle].lecteur(P, parcours[i], donnees.reglages || {}); } catch (_) { jauge = null; }
      let semaine = null;
      try { semaine = semaineDe(P, parcours[i], aujourdhui); } catch (_) { semaine = null; }
      if (semaine) {
        semaine.jours.forEach(jour => { if (!espace.jours.includes(jour)) espace.jours.push(jour); });
        if (semaine.travail) espace.travail = true;
        // Lot B1 : le jour vert d'aujourd'hui, pour le bloc « Aujourd'hui ».
        if (semaine.jours.includes(aujourdhui)) espace.faits.push(cle);
      }
      let gain = "";
      try { gain = gainDe(cle, P, parcours[i], semaine, aujourdhui); } catch (_) { gain = ""; }
      if (gain) jauge = Object.assign({}, jauge || {}, {gain});
      if (jauge) jauges[cle] = jauge;
    });
    espace.jours.sort();
    jauges[CLE_ESPACE] = espace;
    return jauges;
  }


  // ======================================================== lot B1 : les portes
  //
  // Lot B1 « Mon espace redessiné » (21/11/2026, maquette et planches validées
  // par Gwenaël). Une porte par activité, sur deux colonnes (quatre au grand
  // écran) ; SPLAT! (ses six mondes) et Mes cours en portes longues. L'ORDRE
  // NE CHANGE JAMAIS — Mes cours, les activités de la classe, SPLAT! : l'élève
  // retrouve ses portes à la même place, et rien ne remonte quand une jauge
  // arrive après coup. Chaque porte : son dessin, en haut à droite un INSIGNE
  // (ce qui est gagné — rien tant que rien ne l'est), son nom, et une ligne qui
  // dit où l'élève en est ; la semaine d'un gain, la ligne devient le gain, en
  // vert. Tout est écrit par textContent ou createElement : rien du serveur ni
  // de la copie de l'onglet ne devient du HTML.
  // Les teintes : celles des dessins des applis et de la charte (choix A).
  const TEINTES = {
    "cours":        {fond: "#ffffff", bord: "#063f86"},
    "defi-tables":  {fond: "#eaf1fa", bord: "#0b67b2"},
    "coffres":      {fond: "#fdf0e3", bord: "#a77b50"},
    "flash-anzan":  {fond: "#fdfbf6", bord: "#10294a"},
    "defi-calcul":  {fond: "#e6f6f5", bord: "#08aaa5"},
    "splat":        {fond: "#ffffff", bord: "#be185d"},
    "automatismes": {fond: "#eff6ff", bord: "#f58220"},
    "soley":        {fond: "#ffffff", bord: "#241b4d"}
  };
  const TEINTE_DEFAUT = {fond: "#ffffff", bord: "#08aaa5"};
  const PORTES_LONGUES = ["cours", "splat"];
  // La couronne de Défi tables (le dessin de l'appli, defi_tables.html).
  const COURONNE = "M2 6.5 7.2 11 12 3l4.8 8L22 6.5 19.6 17H4.4Z M4.4 18.5h15.2v1.5H4.4Z";

  function dessinCouronne() {
    const svg = elementSvg("svg", {width: "16", height: "14", viewBox: "0 0 24 20", "aria-hidden": "true", focusable: "false"});
    svg.append(elementSvg("path", {d: COURONNE, fill: "currentColor"}));
    return svg;
  }
  // Une perle du soroban (le dessin d'Anzan).
  function dessinPerle() {
    const svg = elementSvg("svg", {width: "16", height: "12", viewBox: "0 0 16 12", "aria-hidden": "true", focusable: "false"});
    svg.append(elementSvg("path", {d: "M8 1v10", stroke: "#9fb4c4", "stroke-width": "1.4"}));
    svg.append(elementSvg("rect", {x: "1", y: "3", width: "14", height: "6", rx: "3", fill: "#087a71"}));
    return svg;
  }
  // Le coffre d'or (le dessin de Coffres magiques).
  function dessinCoffre() {
    const svg = elementSvg("svg", {width: "18", height: "18", viewBox: "8 12 30 26", "aria-hidden": "true", focusable: "false"});
    svg.append(elementSvg("path", {d: "M9 20a14 9 0 0 1 28 0Z", fill: "#f6c13d", stroke: "#9a5b06", "stroke-width": "2", "stroke-linejoin": "round"}));
    svg.append(elementSvg("rect", {x: "9", y: "20", width: "28", height: "16", rx: "2.5", fill: "#f6c13d", stroke: "#9a5b06", "stroke-width": "2"}));
    svg.append(elementSvg("rect", {x: "19.5", y: "20.5", width: "7", height: "9", rx: "1.6", fill: "#ffe08a", stroke: "#9a5b06", "stroke-width": "1.6"}));
    return svg;
  }
  const texteCourt = valeur => (typeof valeur === "string" ? valeur.slice(0, 60) : "");

  // L'insigne d'une porte : Défi tables, le rang (les étoiles, la couronne) ;
  // Défi calcul, la ceinture ; Anzan, le grade Flash (choix 1 : le grade
  // Colonne est sur la ligne du bas) ; Coffres, le plus haut niveau où un
  // coffre est gagné. Rien quand rien n'est gagné (pas de « débutant »).
  const CLES_RANG = ["bronze", "argent", "or", "platine", "diamant", "legende", "etoiles"];
  function insigneDe(cle, jauge) {
    if (!jauge || typeof jauge !== "object") return null;
    const insigne = document.createElement("span");
    insigne.className = "insigne";
    if (cle === "defi-tables" && jauge.rang && jauge.rang.niveau && CLES_RANG.includes(jauge.rang.cle)) {
      const r = jauge.rang;
      insigne.classList.add(r.cle);
      if (r.cle === "legende") insigne.append(dessinCouronne(), document.createTextNode("Légende"));
      else if (r.cle === "etoiles") insigne.append(document.createTextNode(texteCourt(r.nom)));
      else {
        const point = document.createElement("i");
        point.setAttribute("aria-hidden", "true");
        insigne.append(point, document.createTextNode(texteCourt(r.nom)));
      }
      insigne.setAttribute("aria-label", `Mon rang : ${texteCourt(r.lu || r.nom)}`);
      return insigne;
    }
    const CORE = window.MATHSGO_DEFI_CALCUL_CORE;
    if (cle === "defi-calcul" && jauge.ceinture && CORE && typeof CORE.elementCeinture === "function") {
      const n = Math.max(0, Math.min(4, Math.floor(Number(jauge.ceinture.n) || 0)));
      const barrettes = Math.max(0, Math.min(3, Math.floor(Number(jauge.ceinture.barrettes) || 0)));
      const ceinture = CORE.CEINTURES && CORE.CEINTURES[n];
      if ((!n && !barrettes) || !ceinture) return null;
      insigne.append(CORE.elementCeinture(document, n, {barrettes, taille: 22}), document.createTextNode(ceinture.court));
      insigne.setAttribute("aria-label", ceinture.nom);
      return insigne;
    }
    if (cle === "flash-anzan" && jauge.grade) {
      insigne.append(dessinPerle(), document.createTextNode(texteCourt(jauge.grade)));
      insigne.setAttribute("aria-label", `Flash : ${texteCourt(jauge.grade)} réussi`);
      return insigne;
    }
    if (cle === "coffres" && Number.isInteger(jauge.niveauGagne) && jauge.niveauGagne > 0) {
      insigne.append(dessinCoffre(), document.createTextNode(`Niveau ${jauge.niveauGagne}`));
      return insigne;
    }
    return null;
  }

  // La ligne du bas : où l'élève en est, jamais une répétition de l'insigne.
  // Une porte jamais ouverte n'a pas de ligne (choix de Gwenaël, 21/11).
  function ligneDe(cle, jauge, nCours) {
    const ligne = document.createElement("span");
    ligne.className = "porte-ligne";
    if (cle === "cours") { ligne.textContent = nCours > 1 ? `${nCours} chapitres` : "1 chapitre"; return ligne; }
    if (!jauge || typeof jauge !== "object") return ligne;
    // La semaine d'un gain (lot S3) : le gain, en vert, à la place de la ligne.
    if (typeof jauge.gain === "string" && jauge.gain) {
      ligne.classList.add("gain");
      ligne.textContent = jauge.gain;
      return ligne;
    }
    if (cle === "coffres" && Number.isInteger(jauge.niveau)) {
      ligne.classList.add("avec-dessin");
      ligne.append(coffresDuNiveau(Math.max(0, Math.min(3, jauge.coffres || 0))));
      if (jauge.cles) {
        const cles = document.createElement("span");
        cles.className = "cle";
        cles.textContent = texteCourt(jauge.cles);
        ligne.append(cles);
      }
      return ligne;
    }
    if (cle === "flash-anzan") { ligne.textContent = jauge.colonne ? `Colonne : ${texteCourt(jauge.colonne)}` : texteCourt(jauge.texte); return ligne; }
    if (cle === "defi-calcul" && jauge.fait) {
      ligne.textContent = `${jauge.fait} compétence${jauge.fait > 1 ? "s" : ""} sue${jauge.fait > 1 ? "s" : ""} sur ${jauge.total}`;
      return ligne;
    }
    if (cle === "splat" && jauge.fait) {
      ligne.textContent = `${jauge.fait} étape${jauge.fait > 1 ? "s" : ""} sur ${jauge.total}` + (jauge.bonus ? ` · ${texteCourt(jauge.bonus)}` : "");
      return ligne;
    }
    if (typeof jauge.compte === "string") ligne.textContent = jauge.compte;
    return ligne;
  }

  function porteDe(appli, jauge, donnees, code, nCours) {
    const li = document.createElement("li");
    if (PORTES_LONGUES.includes(appli.cle)) li.className = "long";
    const porte = document.createElement("a");
    porte.className = "porte";
    // La clé vient du catalogue du serveur, pas de l'élève.
    porte.dataset.cle = appli.cle;
    const teinte = Object.prototype.hasOwnProperty.call(TEINTES, appli.cle) ? TEINTES[appli.cle] : TEINTE_DEFAUT;
    porte.style.setProperty("--porte-fond", teinte.fond);
    porte.style.setProperty("--porte-bord", teinte.bord);
    if (appli.cle === "cours") { porte.id = "cours-lien"; porte.href = "#cours"; }
    else {
      // Le billet de l'entrée sert de secours (clic du milieu, « ouvrir dans
      // un nouvel onglet ») ; un clic ordinaire en demande un frais.
      porte.href = adresseAppli(appli, donnees.billet || "");
      porte.addEventListener("click", event => ouvrirAppli(event, porte, appli, code, donnees.billet || ""));
    }
    porte.innerHTML = icone(appli.cle);
    const textes = document.createElement("span");
    textes.className = "porte-textes";
    const nom = document.createElement("strong");
    nom.className = "porte-nom";
    nom.textContent = appli.nom;
    textes.append(nom, ligneDe(appli.cle, jauge, nCours));
    porte.append(textes);
    if (appli.cle === "splat" && jauge && Array.isArray(jauge.mondes)) {
      const mondes = document.createElement("span");
      mondes.className = "mondes";
      mondes.setAttribute("role", "img");
      mondes.setAttribute("aria-label", jauge.mondes
        .map(monde => `Monde ${monde.numero} : ${ETATS_MONDE[monde.etat] || ETATS_MONDE.vide}`).join(", "));
      jauge.mondes.forEach(monde => mondes.append(pastilleMonde(monde)));
      porte.append(mondes);
    }
    const insigne = insigneDe(appli.cle, jauge);
    if (insigne) porte.append(insigne);
    li.append(porte);
    return li;
  }

  // ===================================================== lot B1 : « Aujourd'hui »
  //
  // Une seule chose à faire, en grand. On montre la première étape pas encore
  // faite AUJOURD'HUI — « faite » = le jour vert de l'appli (resumeSuivi de son
  // moteur, la même règle que « Ma semaine ») ; une activité finie pour de bon
  // est sautée ; Mes cours n'est jamais « faite » (on ne peut pas savoir si une
  // leçon a été lue) : quand c'est son tour, elle reste pour la journée. Rien
  // n'est verrouillé : toutes les portes restent ouvertes. La séance en direct
  // et l'évaluation passent devant (règle CSS : leur carte, visible, cache
  // celle-ci). Le bloc garde la même hauteur dans tous ses états.
  //
  // Les étapes : la LISTE choisie par le professeur pour la classe (lot B2,
  // « Ma classe › Réglages » : d'abord, puis, puis — reçue avec les données de
  // l'élève, « jour ») quand elle donne au moins une de ses portes ; sinon le
  // mode AUTOMATIQUE du lot B1 : Défi tables quand la classe l'a, sinon la
  // première activité de la classe, puis Mes cours (l'idée de Gwenaël).
  const CHECK_BLANC = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function etapesDuJour(visibles, jour) {
    if (Array.isArray(jour) && jour.length) {
      const choisies = [];
      jour.forEach(cle => {
        const appli = visibles.find(a => a.cle === cle);
        if (appli && !choisies.includes(appli) && choisies.length < 3) choisies.push(appli);
      });
      // Mes cours seulement au bout (le serveur le garantit ; une copie
      // trafiquée ne fait pas mieux).
      const place = choisies.findIndex(a => a.cle === "cours");
      if (place >= 0 && place !== choisies.length - 1) choisies.splice(place, 1);
      if (choisies.length) return choisies;
    }
    const activites = visibles.filter(appli => appli.cle !== "cours");
    const liste = [];
    const tables = activites.find(appli => appli.cle === "defi-tables");
    if (tables) liste.push(tables); else if (activites.length) liste.push(activites[0]);
    const cours = visibles.find(appli => appli.cle === "cours");
    if (cours) liste.push(cours);
    return liste.slice(0, 3);
  }
  function termineePourDeBon(appli, jauge) {
    return appli.cle === "splat" && Boolean(jauge) && jauge.total > 0 && jauge.fait >= jauge.total;
  }
  function sousTitre(appli, jauge, nCours) {
    if (appli.cle === "cours") return nCours > 1 ? `${nCours} chapitres` : "1 chapitre";
    if (!jauge) return "Ta première séance";
    if (appli.cle === "defi-tables" && jauge.aujourdhui && typeof jauge.aujourdhui.quoi === "string" && jauge.aujourdhui.quoi) return jauge.aujourdhui.quoi;
    return "Reprends où tu en es";
  }
  // Lot B2 : en haut à droite, deux lignes écrites ensemble, et la feuille de
  // style choisit (rien ne saute quand la fenêtre change de taille) :
  //  - au téléphone, « Ensuite : X » tant qu'il reste une étape après celle du
  //    bouton ; sinon ce qui est fait aujourd'hui (« ✓ Défi tables ») ;
  //  - sur ordinateur (900 px et plus), dès que la journée a deux étapes ou
  //    plus, le CHEMIN de la journée : « ✓ Défi tables → SPLAT! → Mes cours »
  //    (fait = coché, en cours = gras, à venir = gris). À « C'est fait ! »,
  //    rien en haut à droite.
  function poserChemin(chemin, liste, estFaite, enCours) {
    chemin.textContent = "";
    liste.forEach((appli, i) => {
      if (i) {
        const fleche = document.createElement("span");
        fleche.className = "fleche";
        fleche.setAttribute("aria-hidden", "true");
        fleche.textContent = "→";
        chemin.append(fleche);
      }
      const etape = document.createElement("span");
      etape.className = estFaite(appli) ? "fait" : appli === enCours ? "en-cours" : "a-venir";
      etape.textContent = estFaite(appli) ? `✓ ${appli.nom}` : appli.nom;
      chemin.append(etape);
    });
  }
  function poserJour(visibles, jauges, espace, donnees, code, nCours) {
    const carte = $("jour");
    const bouton = $("jour-bouton");
    const ensuite = $("jour-ensuite");
    const chemin = $("jour-chemin");
    const faitsDuJour = $("jour-faits");
    const liste = etapesDuJour(visibles, donnees.jour);
    if (!liste.length) { carte.hidden = true; return; }
    const faits = espace ? espace.faits : [];
    const estFaite = appli => appli.cle !== "cours"
      && (faits.includes(appli.cle) || termineePourDeBon(appli, jauges[appli.cle] || null));
    const reste = liste.filter(appli => !estFaite(appli));
    const faites = liste.filter(appli => estFaite(appli) && faits.includes(appli.cle));
    carte.hidden = false;
    ensuite.textContent = "";
    chemin.textContent = "";
    faitsDuJour.textContent = "";
    if (!reste.length) {
      carte.classList.add("fini");
      carte.classList.remove("avec-chemin");
      chemin.hidden = true;
      $("jour-icone").innerHTML = CHECK_BLANC;
      $("jour-nom").textContent = "C’est fait !";
      $("jour-sous").textContent = "Pour aujourd’hui, à toi de choisir.";
      bouton.hidden = true;
      // Correctif (Codex, point 10) : trois étapes faites — une ligne de texte
      // qui peut passer sur deux lignes, au lieu de trois pastilles : le bloc
      // garde sa hauteur.
      if (faites.length >= 3) faitsDuJour.classList.add("compact"); else faitsDuJour.classList.remove("compact");
      faites.forEach(appli => {
        const fait = document.createElement("span");
        fait.textContent = `✓ ${appli.nom}`;
        faitsDuJour.append(fait);
      });
      faitsDuJour.hidden = false;
      return;
    }
    carte.classList.remove("fini");
    faitsDuJour.hidden = true;
    bouton.hidden = false;
    const appli = reste[0];
    $("jour-icone").innerHTML = icone(appli.cle);
    $("jour-nom").textContent = appli.nom;
    $("jour-sous").textContent = sousTitre(appli, jauges[appli.cle] || null, nCours);
    if (appli.cle === "cours") {
      bouton.textContent = "Ouvrir mes cours";
      bouton.href = "#cours";
      bouton.onclick = null;
    } else {
      bouton.textContent = "Commencer";
      bouton.href = adresseAppli(appli, donnees.billet || "");
      bouton.onclick = event => ouvrirAppli(event, bouton, appli, code, donnees.billet || "");
    }
    if (reste[1]) {
      const nom = document.createElement("b");
      nom.textContent = reste[1].nom;
      ensuite.append("Ensuite : ", nom);
    } else if (faites.length > 1) {
      // Correctif (Codex, point 10) : au petit téléphone, deux noms cochés ne
      // tiennent pas à côté d'« Aujourd'hui » — le compte, la feuille de style
      // choisit (moins de 360 px).
      const noms = document.createElement("span");
      noms.className = "noms";
      noms.textContent = faites.map(fait => `✓ ${fait.nom}`).join("  ");
      const compte = document.createElement("span");
      compte.className = "compte";
      compte.textContent = `✓ ${faites.length} étapes faites`;
      ensuite.append(noms, compte);
    } else if (faites.length) ensuite.textContent = `✓ ${faites[0].nom}`;
    const avecChemin = liste.length >= 2;
    chemin.hidden = !avecChemin;
    if (avecChemin) poserChemin(chemin, liste, estFaite, appli);
    if (avecChemin) carte.classList.add("avec-chemin"); else carte.classList.remove("avec-chemin");
  }

  // ------------------------------------------------------- la séance en direct
  //
  // Tant que l'élève est sur son espace, la page demande de temps en temps au
  // serveur si le professeur mène une séance avec sa classe (api/direct.php,
  // le code dans le corps). Si oui, la tuile « Séance en direct » apparaît
  // au-dessus des activités ; sinon elle n'existe pas. Trois règles :
  //  - c'est une lecture, sans rien à l'écran quand elle échoue : un serveur
  //    muet ne doit ni afficher d'erreur ni empêcher d'ouvrir une activité ;
  //  - onglet caché, on ne demande rien ;
  //  - le rythme est dit par le serveur (quelques secondes), borné ici.
  let directCode = "";
  let directMinuteur = 0;
  // Lot 8 : chaque surveillance a son numéro — une lecture partie avant un
  // redémarrage ne relance pas une seconde boucle.
  let directTour = 0;
  // Lot 8 : la dernière lecture de api/direct.php (tuiles du haut), pour les
  // reposer quand la grille est redessinée et les garder dans la copie.
  let hautCourant = null;

  function arreterDirect() {
    directCode = "";
    directTour += 1;
    hautCourant = null;
    window.clearTimeout(directMinuteur);
    $("direct-lien").hidden = true;
    poserTuileEvaluation(null);
  }

  // Lot E4 (16/10/2026, choix de Gwenaël) : tant que l'évaluation de Défi
  // tables est ouverte et que l'élève ne l'a pas finie (ni été arrêté par sa
  // fenêtre), la tuile « Évaluation de tables » apparaît AU-DESSUS des
  // activités, à la place de la séance en direct, et mène droit à Défi
  // tables (la carte « Je commence » y est en tête). Sans Défi tables ouvert
  // à la classe, pas de tuile. Rien d'autre ne vient du serveur que l'état ;
  // le texte est écrit ici, par textContent.
  let appliEvaluation = null;   // l'entrée « defi-tables » de la liste du serveur
  function poserTuileEvaluation(etat) {
    const ouverte = Boolean(appliEvaluation && etat && etat.etat === "ouverte" && !etat.fini && !etat.close);
    $("evaluation-lien").hidden = !ouverte;
    if (ouverte) $("evaluation-lien-texte").textContent = etat.commence ? "Continuer l’évaluation." : "Commencer l’évaluation.";
  }

  // Lot 8 : ce que la copie garde de l'évaluation (quatre mots, rien d'autre).
  function resumeEvaluation(etat) {
    if (!etat || typeof etat !== "object") return null;
    return {etat: etat.etat === "ouverte" ? "ouverte" : "", fini: Boolean(etat.fini), close: Boolean(etat.close), commence: Boolean(etat.commence)};
  }

  async function demanderDirect(code) {
    let attente = 6000;
    try {
      const reponse = await fetch("api/direct.php", {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=UTF-8"},
        body: JSON.stringify({code}),
        cache: "no-store"
      });
      const donnees = await reponse.json().catch(() => null);
      // Entre-temps, l'élève s'est peut-être déconnecté : on ne touche à rien.
      if (directCode !== code) return 0;
      if (reponse.ok && donnees && donnees.ok) {
        $("direct-lien").hidden = !donnees.direct;
        poserTuileEvaluation(donnees.evaluation);
        hautCourant = {direct: Boolean(donnees.direct), evaluation: resumeEvaluation(donnees.evaluation)};
        noterHaut(code, hautCourant);
        const propose = Number(donnees.rythme);
        if (propose >= 2000 && propose <= 60000) attente = propose;
      } else if (reponse.status === 404) {
        // Correctif S3 (Codex, nº 4) : le serveur dit que ce code n'existe
        // plus (supprimé par le professeur) — tout part tout de suite, copie
        // comprise, comme avec « Se déconnecter ». Une panne (503…) ne fait
        // rien oublier.
        if (lireCode() === code) revenirAuCode();
        return 0;
      }
    } catch (_) {
      attente = 15000;
    }
    return attente;
  }

  // Rend la promesse de la PREMIÈRE lecture (lot 8 : la première entrée
  // l'attend, avec les jauges, pour tout dessiner d'un coup). Pour le même
  // élève (onglet qui redevient visible), les tuiles restent où elles sont
  // pendant la nouvelle lecture.
  function surveillerDirect(code) {
    if (directCode !== code) arreterDirect();
    window.clearTimeout(directMinuteur);
    directCode = code;
    const moi = ++directTour;
    const tour = async () => {
      if (directCode !== code || moi !== directTour) return;
      if (document.visibilityState === "hidden" || gardeVisible) return;
      const attente = await demanderDirect(code);
      if (directCode !== code || moi !== directTour || !attente) return;
      directMinuteur = window.setTimeout(tour, attente);
    };
    return tour();
  }

  document.addEventListener("visibilitychange", () => {
    // L'onglet revient au premier plan après une longue absence : la question
    // d'abord, rien d'autre.
    if (document.visibilityState === "visible" && verifierGarde()) { window.clearTimeout(directMinuteur); return; }
    if (document.visibilityState === "visible" && directCode) surveillerDirect(directCode);
    else window.clearTimeout(directMinuteur);
    // Correctif S3 (Codex, nº 3) : la page laissée ouverte (veille, autre
    // onglet) depuis la veille se redessine pour le nouveau jour.
    if (document.visibilityState === "visible") revoirSiNouveauJour();
  });

  // Lot S3 : ce que la lecture des jauges a rangé sous CLE_ESPACE, vérifié
  // (la copie de l'onglet peut être ancienne ou abîmée) : des dates et des
  // clés d'applis, rien d'autre. null : rien de lu. Correctif S3 (Codex,
  // nº 5) : de vraies dates, et seulement les applis que la page connaît ;
  // nº 2 : le jour de la lecture est gardé (« aujourdhui », vide s'il n'est
  // pas une vraie date).
  function espaceLu(jauges) {
    const brut = jauges && typeof jauges === "object" ? jauges[CLE_ESPACE] : null;
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return null;
    return {
      aujourdhui: jourValide(brut.aujourdhui) ? brut.aujourdhui : "",
      jours: Array.isArray(brut.jours) ? brut.jours.filter(jourValide) : [],
      travail: brut.travail === true,
      // Lot B1 : les applis faites AUJOURD'HUI (leur jour vert), lues le jour même.
      faits: Array.isArray(brut.faits) && jourValide(brut.aujourdhui) && brut.aujourdhui === jourDeLAppareil()
        ? brut.faits.filter(c => typeof c === "string" && Object.prototype.hasOwnProperty.call(JAUGES, c)) : [],
      ouvertes: Array.isArray(brut.ouvertes)
        ? brut.ouvertes.filter(c => typeof c === "string" && Object.prototype.hasOwnProperty.call(JAUGES, c)) : []
    };
  }

  // Correctif S3 (Codex, nº 2) : les gains sont ceux de la semaine de la
  // LECTURE. Lus une autre semaine (une copie de dimanche relue lundi, une
  // copie sans date), ils ne se montrent plus, même hors ligne : le lundi,
  // les tuiles repartent à neuf dès le premier dessin. Une jauge qui n'était
  // qu'un gain disparaît avec lui (la tuile ne remonte pas pour rien).
  function sansGainsPerimes(jauges, espace) {
    if (!jauges || typeof jauges !== "object") return {};
    const aujourdhui = jourDeLAppareil();
    const lu = espace ? espace.aujourdhui : "";
    if (lu && lu <= aujourdhui && lundiDeJour(lu) === lundiDeJour(aujourdhui)) return jauges;
    const propres = {};
    Object.keys(jauges).forEach(cle => {
      const jauge = jauges[cle];
      if (!jauge || typeof jauge !== "object" || Array.isArray(jauge) || !("gain" in jauge)) { propres[cle] = jauge; return; }
      const reste = Object.assign({}, jauge);
      delete reste.gain;
      if (Object.keys(reste).length) propres[cle] = reste;
    });
    return propres;
  }

  const JOURS_LETTRES = [["L", "lundi"], ["M", "mardi"], ["M", "mercredi"], ["J", "jeudi"], ["V", "vendredi"], ["S", "samedi"], ["D", "dimanche"]];

  // « Ma semaine » : sept cases du lundi au dimanche de la semaine EN COURS
  // (la date de l'appareil au moment du dessin : une copie de la veille se
  // redessine juste), ✓ les jours de travail, toutes applis ensemble. Rien
  // tant que l'élève n'a jamais travaillé. Tout est construit par
  // createElement et textContent.
  function poserSemaine(espace) {
    const carte = $("semaine");
    const cases = $("semaine-jours");
    cases.textContent = "";
    $("semaine-compte").textContent = "";
    if (!espace || !espace.travail) { carte.hidden = true; return; }
    const aujourdhui = jourDeLAppareil();
    const lundi = lundiDeJour(aujourdhui);
    let compte = 0;
    JOURS_LETTRES.forEach(([lettre, nom], i) => {
      const jour = jourDecale(lundi, i);
      const fait = jour <= aujourdhui && espace.jours.includes(jour);
      if (fait) compte += 1;
      const li = document.createElement("li");
      li.className = [fait ? "fait" : "", jour === aujourdhui ? "aujourdhui" : "", jour > aujourdhui ? "avenir" : ""].filter(Boolean).join(" ");
      const haut = document.createElement("span");
      haut.className = "lettre";
      haut.setAttribute("aria-hidden", "true");
      haut.textContent = lettre;
      const boite = document.createElement("span");
      boite.className = "case-jour";
      if (fait) {
        const coche = elementSvg("svg", {viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false"});
        coche.append(elementSvg("path", {d: "M5 12.5l4.5 4.5L19 7.5", fill: "none", stroke: "#fff", "stroke-width": "3.2",
          "stroke-linecap": "round", "stroke-linejoin": "round"}));
        boite.append(coche);
      }
      li.setAttribute("aria-label", `${nom}${jour === aujourdhui ? " (aujourd’hui)" : ""} : ${fait ? "travaillé" : jour > aujourdhui ? "à venir" : "pas de travail"}`);
      li.append(haut, boite);
      cases.append(li);
    });
    if (compte) {
      const nombre = document.createElement("strong");
      nombre.textContent = `${compte} jour${compte > 1 ? "s" : ""}`;
      $("semaine-compte").append(nombre, " cette semaine");
    }
    carte.hidden = false;
  }

  // Correctif S3 (Codex, nº 1 et 3) : le code de l'élève dont l'écran montre
  // l'espace (vide : l'écran du code), et le jour de l'appareil à ce dessin.
  let codeAffiche = "";
  let jourAffiche = "";

  // Le jour a changé depuis le dernier dessin (page restée ouverte la nuit,
  // retour du lundi) : on rouvre l'espace comme au retour dans l'onglet — la
  // copie redessinée tout de suite pour le nouveau jour (semaine, gains),
  // puis la réponse du serveur, d'un coup.
  function revoirSiNouveauJour() {
    if (!codeAffiche || $("ecran-espace").hidden || lireCode() !== codeAffiche) return;
    if (jourDeLAppareil() === jourAffiche) return;
    ouvrir(codeAffiche, true);
  }

  // Lot 8 : dessinée d'un coup, jauges comprises. Appelée avec la copie de
  // l'onglet (au retour), puis avec la réponse du serveur : quand rien n'a
  // changé, la seconde redessine la même chose — rien ne bouge à l'écran.
  // La surveillance de la séance en direct n'est lancée qu'une fois.
  function afficherEspace(donnees, code, jauges, haut) {
    const dejaSuivi = directCode === code;
    // Correctif S3 (Codex, nº 1 et 3) : à qui est l'écran, et pour quel jour.
    codeAffiche = code;
    jourAffiche = jourDeLAppareil();
    $("titre").textContent = donnees.prenom ? `Bonjour ${donnees.prenom}` : "Mon espace";
    $("classe").textContent = donnees.classe || "";
    $("classe").hidden = !donnees.classe;
    $("entete-droite").hidden = false;

    // Lot S3 : « Ma semaine » et les applis déjà ouvertes, lues avec les
    // jauges (rien quand elles ne sont pas encore là).
    const espace = espaceLu(jauges);
    const ouvertes = espace ? espace.ouvertes : [];
    poserSemaine(espace);
    jauges = sansGainsPerimes(jauges, espace);

    const liste = $("applis");
    liste.textContent = "";
    const disponibles = (donnees.applis || []).filter(a => a.disponible && a.url);
    const cours = coursLus(donnees.cours);
    coursOuverts = cours;
    const nCours = cours ? cours.length : 0;
    const visibles = disponibles.filter(a => a.cle !== "cours" || nCours);
    // L'ordre : Mes cours, puis les activités de la classe, puis SPLAT! (porte
    // longue) — fixe, quoi que disent les jauges.
    const rang = a => (a.cle === "cours" ? 0 : a.cle === "splat" ? 2 : 1);
    const portes = visibles.map((a, i) => [a, i]).sort((x, y) => rang(x[0]) - rang(y[0]) || x[1] - y[1]).map(x => x[0]);
    // Un nombre impair de portes courtes : la dernière devient longue.
    const courtes = portes.filter(a => !PORTES_LONGUES.includes(a.cle));
    portes.forEach(appli => {
      const li = porteDe(appli, (jauges || {})[appli.cle] || null, donnees, code, nCours);
      if (courtes.length % 2 && appli === courtes[courtes.length - 1]) li.classList.add("long");
      liste.append(li);
    });
    // Grand écran : les portes toutes égales, une rangée jusqu'à cinq, trois
    // colonnes pour six (deux rangées pleines), quatre au-delà.
    const n = liste.children.length;
    liste.style.setProperty("--portes", String(n <= 5 ? Math.max(n, 1) : n === 6 ? 3 : 4));
    liste.dataset.portes = String(n);
    appliEvaluation = disponibles.find(appli => appli.cle === "defi-tables") || null;
    const tuileEvaluation = $("evaluation-lien");
    if (!dejaSuivi) tuileEvaluation.hidden = true;
    tuileEvaluation.href = appliEvaluation ? adresseAppli(appliEvaluation, donnees.billet || "") : "#";
    tuileEvaluation.onclick = appliEvaluation
      ? event => ouvrirAppli(event, tuileEvaluation, appliEvaluation, code, donnees.billet || "")
      : event => event.preventDefault();
    poserJour(visibles, jauges || {}, espace, donnees, code, nCours);
    if (!liste.children.length) {
      const li = document.createElement("li");
      li.className = "aide";
      li.textContent = "Aucune activité n’est proposée à ta classe pour l’instant.";
      liste.appendChild(li);
    }

    // Les jauges sont posées AVANT que la grille se montre (lot 8) : un seul
    // dessin, à sa place définitive. Celles qui manquent (serveur muet,
    // moteur absent) ne manquent qu'à leur tuile.

    $("ecran-code").hidden = true;
    $("ecran-espace").hidden = false;
    document.body.classList.remove("sur-code");

    if (!dejaSuivi) surveillerDirect(code);
    // Les tuiles du haut : la dernière lecture de api/direct.php si elle est
    // déjà là, sinon celles de la copie (la lecture qui suit les corrige).
    const enHaut = hautCourant || haut;
    if (enHaut) {
      $("direct-lien").hidden = !enHaut.direct;
      poserTuileEvaluation(enHaut.evaluation || null);
    }
    // L'appli Cours : l'écran que demande l'adresse (#cours=… au retour
    // d'une fiche).
    suivreAdresse();
  }

  // ------------------------------------------- l'appli Cours (lot « cours-appli », 08/11/2026)
  //
  // api/eleve.php rend `cours` : les chapitres que le professeur a ouverts à
  // la classe, dans l'ordre de la progression, avec leurs fiches ouvertes et
  // les adresses toutes faites (lib/cours.php). Depuis le lot
  // « cours-ouvertures » (10/11/2026), le serveur note le JOUR où l'élève
  // touche une fiche (noterOuverture) — rien d'autre, et rien dans le
  // téléphone.
  // L'écran suit l'adresse : #cours (la liste), #cours=3e-PYT (un chapitre) ;
  // le bouton « ◀ Mes cours » d'une fiche ramène à #cours=<son chapitre>.
  // Ce qui vient du serveur (ou de la copie de l'onglet) est relu ici : une
  // adresse qui n'est pas une fiche du dossier cours/ de mathsgo.re est
  // écartée, et tout s'écrit en textContent.
  const MOTIF_CHAPITRE = /^[0-9]e-[A-Z]{2,8}$/;
  const ADRESSE_COURS = /^https:\/\/mathsgo\.re\/cours\/[0-9]e\/[0-9]e-[A-Z]{2,8}-(?:[0-9]{2}|brevet|imprimable)\.html#ch=[0-9]e-[A-Z]{2,8}$/;
  let coursOuverts = null;   // null : la classe n'a pas l'appli Cours

  // Lot « cours-appli-2 » (13/11/2026, choix de Gwenaël) : les domaines du
  // catalogue du site (outils/index.html : mêmes couleurs), sous leurs noms
  // courts. `texte` : la couleur du nom écrit, assez foncée pour se lire
  // (l'orange du catalogue est trop clair en petit : celui des textes orange
  // de cette page). Le serveur ne donne que la clé (lib/cours.php).
  const DOMAINES_COURS = {
    nombres: {nom: "Nombres et calculs", couleur: "#0b67b2", texte: "#0b67b2"},
    algebre: {nom: "Algèbre", couleur: "#7b42b4", texte: "#7b42b4"},
    proportionnalite: {nom: "Proportionnalité et fonctions", couleur: "#d86b16", texte: "#a15c11"},
    geometrie: {nom: "Espace et géométrie", couleur: "#087f78", texte: "#087f78"},
    donnees: {nom: "Données et probabilités", couleur: "#be3e68", texte: "#be3e68"},
    informatique: {nom: "Pensée informatique", couleur: "#4f5fb3", texte: "#4f5fb3"}
  };
  // L'ordre des niveaux sous lesquels la liste se range (« 4e » puis « 3e »).
  const ORDRE_NIVEAUX = ["CM2", "6e", "5e", "4e", "3e", "2de"];
  function chapitresParNiveau(chapitres) {
    const niveaux = [];
    chapitres.forEach(c => { if (!niveaux.includes(c.niveau)) niveaux.push(c.niveau); });
    const rang = n => (ORDRE_NIVEAUX.includes(n) ? ORDRE_NIVEAUX.indexOf(n) : ORDRE_NIVEAUX.length);
    // Tri stable : un niveau inconnu garde sa place d'arrivée, après les connus.
    return niveaux.map((n, i) => [n, i]).sort((a, b) => rang(a[0]) - rang(b[0]) || a[1] - b[1])
      .map(([n]) => ({niveau: n, chapitres: chapitres.filter(c => c.niveau === n)}));
  }


  function texteDe(valeur) {
    return typeof valeur === "string" ? valeur : "";
  }
  function adresseCours(valeur) {
    return typeof valeur === "string" && ADRESSE_COURS.test(valeur) ? valeur : null;
  }
  function coursLus(brut) {
    if (!Array.isArray(brut)) return null;
    return brut.filter(c => c && typeof c === "object" && typeof c.id === "string" && MOTIF_CHAPITRE.test(c.id))
      .map(c => ({
        id: c.id, niveau: texteDe(c.niveau), chapitre: texteDe(c.chapitre), titre: texteDe(c.titre),
        // Lot « cours-appli-2 » : une clé connue de la page, sinon rien.
        domaine: Object.prototype.hasOwnProperty.call(DOMAINES_COURS, c.domaine) ? c.domaine : "",
        fiches: (Array.isArray(c.fiches) ? c.fiches : [])
          .filter(f => f && typeof f === "object" && adresseCours(f.url))
          .map(f => ({n: Number.isInteger(f.n) && f.n > 0 ? f.n : 0, h1: texteDe(f.h1), type: texteDe(f.type), url: f.url})),
        brevet: adresseCours(c.brevet),
        imprimable: adresseCours(c.imprimable)
      }))
      .filter(c => c.fiches.length || c.brevet);
  }

  // « LE TRIANGLE RECTANGLE », au-dessus d'un titre de chapitre. Pas d'étiquette
  // « 3e / 4e » (choix de Gwenaël, 09/11/2026 : l'élève est dans SON chapitre).
  function surTitre(chapitre) {
    const sur = document.createElement("small");
    sur.className = "cours-sur";
    sur.textContent = chapitre.chapitre;
    return sur;
  }
  // En 4e, pas de brevet : la page des sujets s'appelle « Exercices type » (09/11/2026).
  function nomBrevet(chapitre) {
    return chapitre.niveau === "4e" ? "Exercices type" : "Entraînement brevet";
  }
  function lienAutre(href, titre, precision) {
    const lien = document.createElement("a");
    lien.className = "som-autre";
    lien.href = href;
    const petit = document.createElement("small");
    petit.textContent = precision;
    lien.append(titre, petit);
    return lien;
  }

  // Lot « cours-ouvertures » (10/11/2026, décidé par Gwenaël) : toucher une
  // fiche (ou l'Entraînement brevet) dans « Mes cours » note le JOUR de cette
  // ouverture pour le professeur — « ouverte le … », ni nombre de fois, ni
  // durée. La page part tout de suite vers la fiche : l'envoi est un
  // sendBeacon (il survit au départ de la page), sinon un fetch « keepalive »,
  // et personne n'attend sa réponse — un échec ne retient jamais l'élève. On
  // n'envoie que le chemin de la fiche : le serveur la retrouve parmi celles
  // que CET élève voit, et prend son propre jour. La version imprimable n'est
  // pas une fiche : rien n'est noté.
  function noterOuverture(url) {
    if (gardeVisible || absenceTropLongue()) return;
    const code = lireCode();
    if (!code || code !== codeAffiche) return;
    let page = "";
    try { page = new URL(url).pathname; } catch (_) { return; }
    const corps = JSON.stringify({code, page});
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("api/cours.php", corps)) return;
    } catch (_) {}
    try {
      fetch("api/cours.php", {method: "POST", headers: {"Content-Type": "text/plain;charset=UTF-8"},
        body: corps, keepalive: true, cache: "no-store"}).catch(() => {});
    } catch (_) {}
  }
  // Le clic ordinaire, le clic du milieu (nouvel onglet) et la touche
  // Entrée (un clic pour le navigateur) ; pas le clic droit.
  function suivreOuverture(lien) {
    lien.addEventListener("click", () => noterOuverture(lien.href));
    lien.addEventListener("auxclick", event => { if (event.button === 1) noterOuverture(lien.href); });
    return lien;
  }

  // La liste des chapitres (#cours) : le retour mène à Mon espace.
  // Lot « cours-appli-2 » : une classe qui a des chapitres de plusieurs
  // niveaux voit sa liste rangée sous « 4e » puis « 3e » (une classe à un
  // seul niveau n'a pas de titre) ; chaque chapitre : le domaine écrit en
  // petit, le nom court du chapitre en gros, le nombre de fiches dessous.
  function dessinerListeCours() {
    $("cours-retour").href = "#";
    $("cours-retour").setAttribute("aria-label", "Mon espace");
    const corps = $("cours-corps");
    corps.textContent = "";
    const groupes = chapitresParNiveau(coursOuverts);
    groupes.forEach(groupe => {
      if (groupes.length > 1) {
        const titre = document.createElement("h2");
        titre.className = "cours-niveau";
        titre.textContent = groupe.niveau;
        corps.append(titre);
      }
      const liste = document.createElement("ul");
      groupe.chapitres.forEach(chapitre => {
        const li = document.createElement("li");
        const lien = document.createElement("a");
        lien.className = "appli cours-chap";
        lien.href = `#cours=${chapitre.id}`;
        lien.innerHTML = `<div class="texte"><small class="cours-domaine"></small><strong></strong><span></span></div>${FLECHE}`;
        const domaine = DOMAINES_COURS[chapitre.domaine];
        if (domaine) {
          lien.style.setProperty("--domaine", domaine.couleur);
          lien.style.setProperty("--domaine-texte", domaine.texte);
          lien.querySelector(".cours-domaine").textContent = domaine.nom;
        }
        lien.querySelector("strong").textContent = chapitre.chapitre || chapitre.titre;
        const n = chapitre.fiches.length;
        lien.querySelector(".texte span").textContent =
          [n ? `${n} fiche${n > 1 ? "s" : ""}` : "", chapitre.brevet ? nomBrevet(chapitre) : ""].filter(Boolean).join(" · ");
        li.append(lien);
        liste.append(li);
      });
      corps.append(liste);
    });
  }

  // Le sommaire d'un chapitre (#cours=3e-PYT) : le retour mène à la liste.
  // Les numéros sont ceux du chapitre, même si le professeur a fermé une
  // fiche : « ouvrez la fiche 4 » veut dire la même chose pour toute la classe.
  function dessinerChapitre(chapitre) {
    $("cours-retour").href = "#cours";
    $("cours-retour").setAttribute("aria-label", "Mes cours");
    const corps = $("cours-corps");
    corps.textContent = "";
    const titre = document.createElement("h2");
    titre.className = "cours-titre";
    titre.textContent = chapitre.titre;
    const liste = document.createElement("div");
    liste.className = "som-liste";
    chapitre.fiches.forEach(fiche => {
      const lien = document.createElement("a");
      lien.className = "som-carte";
      lien.href = fiche.url;
      lien.innerHTML = `<span class="n"></span><span class="t"><b></b><small></small></span>${FLECHE}`;
      lien.querySelector(".n").textContent = fiche.n ? String(fiche.n) : "•";
      lien.querySelector("b").textContent = fiche.h1;
      const petit = lien.querySelector("small");
      if (fiche.type) petit.append(fiche.type);
      liste.append(suivreOuverture(lien));
    });
    corps.append(surTitre(chapitre), titre, liste);
    if (chapitre.brevet) corps.append(suivreOuverture(chapitre.niveau === "4e"
      ? lienAutre(chapitre.brevet, "🎯 Exercices type", "De vrais problèmes, corrigés pas à pas.")
      : lienAutre(chapitre.brevet, "🎯 Entraînement brevet", "De vrais sujets du brevet, corrigés pas à pas.")));
    if (chapitre.imprimable) corps.append(lienAutre(chapitre.imprimable, "🖨 Tout le chapitre à imprimer", "Toutes les fiches, avec les exemples rédigés et les réponses."));
  }

  // L'écran que demande l'adresse : Mon espace, la liste ou un chapitre. Un
  // chapitre qui n'est plus ouvert (le professeur l'a fermé) : la liste.
  function suivreAdresse() {
    if (!codeAffiche) return;
    const adresse = window.location.hash;
    const demande = /^#cours(?:=([0-9]e-[A-Z]{2,8}))?$/.exec(adresse);
    const montrer = Boolean(demande) && Boolean(coursOuverts && coursOuverts.length);
    $("ecran-espace").hidden = montrer;
    $("ecran-cours").hidden = !montrer;
    if (!montrer) { $("cours-corps").textContent = ""; return; }
    const chapitre = demande[1] ? coursOuverts.find(c => c.id === demande[1]) : null;
    if (chapitre) dessinerChapitre(chapitre); else dessinerListeCours();
  }
  window.addEventListener("hashchange", () => {
    suivreAdresse();
    window.scrollTo(0, 0);
  });

  // Lot 8 : à la première entrée (code tapé), la grille attend ses jauges
  // au plus ce temps ; au-delà, elle se montre sans elles et se redessine
  // d'un coup quand elles arrivent. L'élève peut toujours ouvrir son
  // activité, même quand une jauge échoue.
  const ATTENTE_JAUGES = 1000;
  // Une seule ouverture compte : la dernière (deux « Entrer » de suite).
  let ouverture = 0;

  function attendre(ms) {
    return new Promise(resolve => window.setTimeout(() => resolve(null), ms));
  }

  async function ouvrir(code, silencieux) {
    // Une réouverture (retour dans l'onglet, précédent, fin de la question)
    // ne demande rien au serveur si l'absence a duré : la question d'abord.
    if (silencieux && verifierGarde()) return;
    const moi = ++ouverture;
    afficherErreur("");
    // Lot 8 : au retour dans l'onglet, la dernière copie de l'espace est
    // dessinée tout de suite ; la réponse du serveur la remplace ensuite.
    let copie = silencieux ? lireCopie(code) : null;
    // Une copie illisible (ancien format, trafiquée) ne bloque rien : elle est
    // oubliée, et la page attend le serveur comme s'il n'y en avait pas.
    if (copie) {
      try { afficherEspace(copie, code, copie.jauges, copie.haut); }
      catch (_) { copie = null; oublierCopie(); }
    }
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
      if (moi !== ouverture) return;
      if (!reponse.ok || !donnees || !donnees.ok) {
        // Seul un 404 prouve que le code ne vaut plus rien. Un serveur en
        // panne ou trop sollicité ne doit pas faire oublier un bon code.
        if (reponse.status === 404) ecrireCode("");
        // Le code ne vaut plus rien (supprimé par le professeur) : retour à
        // l'écran du code, vide, comme avant le lot 8 — l'espace dessiné
        // depuis la copie part avec le ménage.
        if (silencieux && reponse.status === 404) { revenirAuCode(); return; }
        // Le serveur ne répond pas, mais l'espace est déjà là (la copie) :
        // il reste, les tuiles s'ouvrent quand même.
        if (copie) return;
        document.documentElement.classList.remove("retour");
        if (silencieux) { $("code").value = code; dessinerCases(); }
        afficherErreur(reponse.status === 404
          ? "Ce code n’existe pas. Vérifie-le, ou demande à ton professeur."
          : (donnees && donnees.erreur) || "Le serveur ne répond pas. Réessaie dans un instant.");
        return;
      }
      ecrireCode(code);
      // Le code vient d'être tapé (ou l'élève vient de répondre « C'est
      // moi ») : l'activité part de maintenant. Une réouverture silencieuse
      // garde l'instant de l'onglet.
      if (!silencieux) noterGeste(Date.now());
      const lecture = lireJauges(donnees, code).catch(() => ({}));
      // Première entrée : les tuiles du haut (séance en direct, évaluation)
      // sont lues en même temps, pour arriver dans le même dessin.
      const pret = copie ? lecture
        : Promise.all([lecture, surveillerDirect(code)]).then(([lues]) => lues);
      const jauges = copie ? await lecture : await Promise.race([pret, attendre(ATTENTE_JAUGES)]);
      if (moi !== ouverture || lireCode() !== code) return;
      afficherEspace(donnees, code, jauges || {});
      if (jauges) { garderCopie(code, donnees, jauges); return; }
      const tardives = await lecture;
      if (moi !== ouverture || lireCode() !== code) return;
      afficherEspace(donnees, code, tardives);
      garderCopie(code, donnees, tardives);
    } catch (_) {
      if (moi !== ouverture || copie) return;
      document.documentElement.classList.remove("retour");
      if (silencieux) { $("code").value = code; dessinerCases(); }
      afficherErreur("Pas de connexion. Réessaie dans un instant.");
    }
  }

  // La saisie elle-même (lettres, ⌫, collage, flèches, curseur de l'iPhone)
  // est tenue par le module : voir code-en-cases.js.

  $("form-code").addEventListener("submit", event => {
    event.preventDefault();
    const code = nettoyer($("code").value);
    if (code.length !== 6) { afficherErreur("Le code compte exactement 6 caractères."); return; }
    ouvrir(code, false);
  });

  // Le retour à l'écran du code. Le code est oublié, et RIEN du précédent
  // élève ne reste dans la page : ni son prénom, ni sa classe, ni ses
  // activités. Une seule fonction, appelée par deux chemins (le bouton, et le
  // retour d'un cache ci-dessous) : deux ménages écrits séparément, c'est un
  // jour où l'un des deux oublie une ligne.
  //
  // Correctif S3 (Codex, nº 1) : « garderCode » — le même ménage SANS toucher
  // au code de l'onglet, pour un écran restauré qui n'est pas celui de
  // l'élève dont l'onglet garde le code (son code, à lui, doit rester).
  function revenirAuCode(garderCode) {
    // Lot 8 : la copie montre « Se déconnecter » avant la réponse du serveur.
    // Une ouverture encore en route ne compte plus : elle remettrait le code.
    ouverture += 1;
    if (garderCode !== true) ecrireCode("");
    codeAffiche = "";
    jourAffiche = "";
    arreterDirect();
    document.documentElement.classList.remove("retour");
    $("code").value = "";
    $("titre").textContent = "Mon espace";
    $("classe").textContent = "";
    $("classe").hidden = true;
    $("entete-droite").hidden = true;
    $("applis").textContent = "";
    // Correctif S3 (Codex, nº 1) : la tuile de l'évaluation ne garde pas le
    // code du précédent élève dans son clic.
    $("evaluation-lien").href = "#";
    $("evaluation-lien").onclick = event => event.preventDefault();
    appliEvaluation = null;
    // Lot S3 : la semaine du précédent élève part aussi.
    poserSemaine(null);
    // L'appli Cours : son écran part aussi (sa tuile est partie avec la liste).
    $("cours-corps").textContent = "";
    $("ecran-cours").hidden = true;
    afficherErreur("");
    $("ecran-espace").hidden = true;
    $("ecran-code").hidden = false;
    document.body.classList.add("sur-code");
    dessinerCases();
  }

  // « Se déconnecter » (lot 7 : le même mot que dans l'appli, un seul geste à
  // apprendre).
  //
  // 08/11/2026 (défaut confirmé par une relecture indépendante) : vider CETTE
  // page ne suffit pas. Les applis gardent le code dans la mémoire de l'onglet
  // côté mathsgo.re, que cette page ne peut pas toucher : après « Se
  // déconnecter », un Retour rouvrait l'appli au nom de l'élève précédent, et
  // l'élève suivant — même après avoir tapé SON code — pouvait travailler dans
  // le parcours de l'autre. Le ménage d'ici reste fait tout de suite (rien du
  // précédent élève à l'écran, même si le site ne répond pas), puis l'onglet
  // passe par l'accueil du site (?sortie=1), qui vide sa mémoire et revient
  // aussitôt sur l'écran du code (?oublier=1) — voir assets/js/eleve-retour-espace.js.
  // replace : ni l'espace refermé ni le passage par le site ne restent dans
  // l'historique.
  function seDeconnecter() {
    if (gardeVisible) cacherGarde();
    revenirAuCode();
    $("code").focus();
    try { window.location.replace(SORTIE_PAR_LE_SITE); } catch (_) {}
  }
  $("changer").addEventListener("click", seDeconnecter);

  // Le bouton « précédent » après une déconnexion (08/09/2026). Chrome garde
  // une page entière dans un cache arrière/avant et la RESSORT telle quelle,
  // sans réexécuter le script — y compris quand la réponse dit « no-store »,
  // tant qu'aucun cookie n'entre en jeu, et l'espace n'en pose aucun. L'écran
  // du précédent élève, prénom et activités compris, pouvait donc revenir sans
  // qu'un code ait été retapé. « persisted » ne vaut vrai QUE dans ce cas ; le
  // sessionStorage, lui, dit la vérité de l'onglet, et « Se déconnecter » l'a
  // vidé. Pas de code : on refait le ménage.
  //
  // Correctif S3 (Codex, nº 1 et 3) : un code ne suffit pas, il faut que ce
  // soit CELUI de l'écran restauré. Un autre élève : l'écran de l'ancien
  // part (données, liens, surveillance) sans effacer le code du nouveau, et
  // l'espace du nouveau s'ouvre. Le même élève : l'espace se rouvre comme au
  // retour dans l'onglet (la copie tout de suite, puis le serveur) — la page
  // restaurée peut dater d'hier, ou d'avant sa dernière séance.
  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    const memorise = nettoyer(lireCode());
    if (memorise.length !== 6) { revenirAuCode(); return; }
    if (!codeAffiche) return;
    if (memorise !== codeAffiche) {
      revenirAuCode(true);
      // L'écran du code ne clignote pas pendant que l'espace du nouvel élève
      // s'ouvre (comme à l'arrivée d'un onglet qui garde un code).
      document.documentElement.classList.add("retour");
    }
    // ouvrir() pose la question au lieu de rouvrir si l'absence a duré.
    ouvrir(memorise, true);
  });

  dessinerCases();
  const revenuDUneAppli = retourDepuisAppli();
  if (oublierSiDemande()) {
    document.documentElement.classList.remove("retour");
    $("code").focus();
  } else {
    const memorise = nettoyer(lireCode());
    if (memorise.length === 6) {
      if (revenuDUneAppli) noterGeste(Date.now());
      // Absence trop longue : la question, et rien d'autre — ni la copie de
      // l'espace, ni un appel au serveur — tant que le code n'est pas retapé.
      ouvrir(memorise, true);
    } else document.documentElement.classList.remove("retour");
  }
})();
</script>
</body>
</html>
