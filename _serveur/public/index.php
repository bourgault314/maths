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
  .cases { position: relative; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;
           max-width: 372px; margin: 0 auto; }
  .case { height: 62px; display: grid; place-items: center; background: #fff;
          border: 2px solid var(--line); border-radius: 12px;
          font-size: 1.75rem; font-weight: 800; line-height: 1; color: var(--blue-dark); }
  .case.pleine { border-color: #b8c7da; background: #f5f8fc; }
  .cases.actif .case.active { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(11,103,178,.22); }
  .cases.actif .case.active:empty::after { content: ""; width: 2px; height: 28px; background: var(--blue);
                                            animation: clignote 1s steps(1) infinite; }
  @keyframes clignote { 50% { opacity: 0; } }
  .cases input[type=text] { position: absolute; inset: 0; width: 100%; height: 100%; min-height: 0;
                            padding: 0; border: 0; opacity: 0; font-size: 16px; letter-spacing: 0;
                            color: transparent; caret-color: transparent; }
  @media (max-width: 360px) {
    .cases { gap: 5px; }
    .case { height: 56px; font-size: 1.45rem; }
  }
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
  /* La jauge d'une activite COMMENCEE : une barre, le compte, le rang. Les
     memes mots et le meme badge que sur l'accueil de l'activite
     (outils/calcul_mental/defi_tables.html) : l'eleve doit retrouver son
     chiffre a l'identique d'un ecran a l'autre, sinon il croit avoir perdu
     quelque chose. Une activite sans table acquise n'a pas de jauge du tout
     (jamais ouverte, ou jouee sans encore reussir une table) : une barre vide
     n'apprend rien et ressemble a un reproche. */
  /* La jauge occupe toute la largeur de la tuile, sous la ligne du nom : la
     barre est lisible, et « 4 tables acquises sur 9 » tient a cote du rang
     meme sur un telephone. Seule une tuile qui PORTE une jauge passe en
     plusieurs lignes ; les autres gardent leur mise en page d'avant. */
  .appli.a-jauge { flex-wrap: wrap; }
  /* Lot S3 : à l'ordinateur, deux tuiles d'une même rangée ont la même
     hauteur ; le contenu de la plus courte reste en haut au lieu de
     s'étaler (la ligne « Niveau 1 : 1 trésor » de Coffres tombait en bas). */
  .appli.a-jauge { align-content: flex-start; }
  .appli.a-jauge .jauge { flex: 0 0 100%; }
  /* Sans base zero, le texte garde sa largeur de contenu et c'est LUI qui
     passe a la ligne : le dessin se retrouvait seul sur la premiere. */
  .appli.a-jauge .texte { flex: 1 1 0; }
  .jauge { margin-top: 8px; }
  .jauge-barre { height: 7px; border-radius: 999px; background: #e6ecf3; overflow: hidden; }
  .jauge-barre i { display: block; height: 100%; border-radius: 999px;
                   background: linear-gradient(90deg, #08aaa5, #0b67b2); }
  .jauge-ligne { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
  .appli .jauge-ligne .compte { color: var(--ink); font-size: var(--texte-secondaire); font-weight: 800; }
  .appli .jauge-note { display: block; margin-top: 4px; color: #a15c11;
                       font-size: var(--texte-secondaire); font-weight: 700; }
  /* Le badge de rang, repris tel quel de l'accueil de Defi tables : un point de
     metal et le nom (une couronne pour la Legende). */
  .rang { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px 3px 6px;
          border-radius: 999px; font-size: .74rem; font-weight: 950; border: 1px solid transparent;
          white-space: nowrap; }
  .rang:empty { display: none; }
  .rang i { width: 12px; height: 12px; border-radius: 50%; display: inline-block;
            box-shadow: inset 0 -2px 0 rgba(0, 0, 0, .18), inset 0 1px 0 rgba(255, 255, 255, .7); }
  .appli .rang.bronze { background: #f7e9dc; color: #7a4416; border-color: #e6c9ad; }
  .rang.bronze i { background: linear-gradient(135deg, #e0a06a, #b8722f); }
  .appli .rang.argent { background: #eef1f4; color: #465563; border-color: #d3dbe3; }
  .rang.argent i { background: linear-gradient(135deg, #e6ebf0, #98a5b3); }
  .appli .rang.or { background: #fff4cc; color: #7a5a00; border-color: #f0dc8c; }
  .rang.or i { background: linear-gradient(135deg, #ffe17a, #d9a300); }
  .appli .rang.platine { background: #e8f4f8; color: #2c5d70; border-color: #bfdde8; }
  .rang.platine i { background: linear-gradient(135deg, #e6f6fa, #7db7c9); }
  .appli .rang.diamant { background: #e9f0ff; color: #2a4c93; border-color: #c2d3f7; }
  .rang.diamant i { background: linear-gradient(135deg, #b9d3ff, #4f7fd6); border-radius: 3px;
                    transform: rotate(45deg) scale(.85); }
  .appli .rang.legende { background: linear-gradient(135deg, #fff1c2, #ffe08a); color: #6b4a00;
                         border-color: #e6c25a; }
  /* Lot « fignolage du 22/10 » (planche 3, choix de Gwenaël) : dès la 1re
     étoile, le badge n'est plus un métal mais les étoiles gagnées (★ à ★★★★),
     dans l'or de la Légende ; à la couronne, le badge Légende d'avant. */
  .appli .rang.etoiles { background: linear-gradient(135deg, #fff1c2, #ffe08a); color: #6b4a00;
                         border-color: #e6c25a; padding: 3px 9px; letter-spacing: .06em; }
  /* « Aujourd'hui » (même lot) : la prochaine chose à faire dans Défi tables,
     lue dans la séance du jour par le moteur. Orange du site, une seule
     ligne au téléphone ; en vert quand la séance du jour est faite. */
  .appli .jauge-aujourdhui { display: inline-block; max-width: 100%; margin-top: 9px; padding: 4px 11px;
                             border: 1px solid #f5c48a; border-radius: 999px; background: #fff4e6;
                             color: #a15c11; font-size: .8rem; font-weight: 800; line-height: 1.35; }
  .appli .jauge-aujourdhui.faite { border-color: #b8dfc8; background: #e5f7eb; color: #147447; }
  .appli .jauge.seule { margin-top: 2px; }
  .appli .jauge.seule .jauge-aujourdhui { margin-top: 0; }
  /* SPLAT! (lot « splat-suivi-3 », 07/10/2026, choix B de Gwenaël) : une
     pastille par monde dans la couleur du monde sur la carte — vide, à moitié
     (en cours), pleine (fini) —, le compte des étapes réussies dessous, et les
     Bonus à part, dans une pastille dorée. */
  .mondes { display: flex; flex-wrap: wrap; gap: 8px; }
  .monde-p { display: block; flex: 0 0 auto; overflow: visible; }
  .appli .jauge-ligne .bonus { padding: 2px 9px; border-radius: 999px; border: 1px solid #f0dc8c;
                               background: #fff4cc; color: #7a5a00; font-size: .78rem; font-weight: 800;
                               white-space: nowrap; }
  /* Coffres magiques (lot « Coffres magiques sur le suivi », 21/10/2026,
     planche validée par Gwenaël) : ni barre ni pastilles — une ligne par
     niveau commencé (« Niveau 1 : 5 trésors »), et au bout de la ligne du
     niveau où l'élève s'est arrêté, la partie en cours dans la pastille
     dorée (« 🔑 6 / 10 »). Le minimum, rien d'autre. */
  .appli .jauge.niveaux { margin-top: 2px; }
  .appli .jauge.niveaux .jauge-ligne { margin-top: 4px; min-height: 24px; }
  /* La séance en direct (07/10/2026) : une tuile de plus, AU-DESSUS des
     activités, qui n'existe que pendant que le professeur mène une séance
     avec la classe. Même dessin qu'une activité, liseré orange. */
  .appli.direct-lien { height: auto; margin-top: 18px; border-left-color: var(--orange); }
  .appli.direct-lien + ul { margin-top: 12px; }
  /* Lot E4 (16/10/2026, choix de Gwenaël) : l'évaluation de Défi tables
     s'annonce à la même place et du même dessin que la séance en direct — une
     tuile au-dessus des activités (une seule séance par classe : jamais les
     deux). Elle remplace la pastille « 📝 Évaluation ouverte » du lot E2,
     qui faisait doublon. */
  li.aide { margin-top: 20px; }
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
  /* Lot S3 : sous la tuile, en vert, ce que l'élève a GAGNÉ cette semaine
     (une table passée, un monde fini, un grade, des compétences), et
     seulement quand il y en a. Les mots sont ceux de « À féliciter » de la
     page du professeur. */
  .appli .jauge-gain { display: block; margin-top: 8px; color: #147447;
                       font-size: var(--texte-secondaire); font-weight: 800; line-height: 1.35; }
  /* Lot S3 : une tuile épurée — la phrase sous le nom de l'appli ne reste que
     tant que l'élève ne l'a jamais ouverte. */
  .appli .texte span[hidden] { display: none; }
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
  #cours-corps ul { grid-template-columns: 1fr; margin-top: 0; }
  #cours-corps .appli { height: auto; }
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
        <div class="cases" id="cases">
          <input id="code" name="code" type="text" inputmode="latin" maxlength="6"
                 spellcheck="false" autocapitalize="characters" autocorrect="off" required>
          <span class="case" aria-hidden="true"></span><span class="case" aria-hidden="true"></span><span class="case" aria-hidden="true"></span><span class="case" aria-hidden="true"></span><span class="case" aria-hidden="true"></span><span class="case" aria-hidden="true"></span>
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
    <p class="sous-titre">Choisis une activité. Ton travail est enregistré tout seul.</p>
    <a class="appli direct-lien" id="direct-lien" href="direct.php" hidden>
      <svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false"><rect width="46" height="46" rx="12" fill="#fdf0e3"/><rect x="9" y="11" width="28" height="19" rx="3" fill="#fff" stroke="#063f86" stroke-width="2.4"/><path d="M19 36h8M23 30v6" stroke="#063f86" stroke-width="2.4" stroke-linecap="round"/><g fill="#f58220"><rect x="14" y="21" width="4" height="5" rx="1"/><rect x="21" y="16" width="4" height="10" rx="1"/><rect x="28" y="19" width="4" height="7" rx="1"/></g></svg>
      <div class="texte"><strong>Séance en direct</strong><span>Ton professeur a lancé une séance : rejoins la classe.</span></div>
      <svg class="fleche" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>
    <a class="appli direct-lien" id="evaluation-lien" href="#" hidden>
      <svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false"><rect width="46" height="46" rx="12" fill="#fdf0e3"/><rect x="11" y="8" width="21" height="29" rx="3" fill="#fff" stroke="#063f86" stroke-width="2.4"/><path d="M16 16h11M16 22h11M16 28h6" stroke="#063f86" stroke-width="2.2" stroke-linecap="round"/><path d="M27.5 35.5l1.2-5.2 9.4-9.4 4 4-9.4 9.4z" fill="#f58220" stroke="#9a4b00" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <div class="texte"><strong>Évaluation de tables</strong><span id="evaluation-lien-texte">Commencer l’évaluation.</span></div>
      <svg class="fleche" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>
    <!-- Lot S3 : « Ma semaine ». Les cases et le compte sont écrits par la
         page (poserSemaine), d'après les moteurs des applis : rien du
         serveur n'y entre en HTML. -->
    <section class="semaine" id="semaine" aria-labelledby="semaine-titre" hidden>
      <h2 id="semaine-titre">Ma semaine</h2>
      <div class="semaine-ligne">
        <ol class="semaine-jours" id="semaine-jours"></ol>
        <p class="semaine-compte" id="semaine-compte"></p>
      </div>
    </section>
    <ul id="applis"></ul>
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
    if (!code) oublierCopie();
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
      haut: hautCourant || (ancienne ? ancienne.haut : null)
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
  // Les six cases dessinées recopient la vraie case de saisie. La case
  // suivante à remplir est entourée de bleu ; quand les six sont pleines,
  // aucune ne l'est (le geste suivant, c'est « Entrer »).
  function dessinerCases() {
    const valeur = nettoyer($("code").value);
    $("cases").querySelectorAll(".case").forEach((carre, i) => {
      carre.textContent = valeur[i] || "";
      carre.classList.toggle("pleine", i < valeur.length);
      carre.classList.toggle("active", i === valeur.length);
    });
  }
  // Toujours au bout : la case de saisie est invisible, un doigt posé sur la
  // 1re case y mettrait le curseur au début et la lettre suivante entrerait
  // au milieu du code.
  function curseurAuBout() {
    const champ = $("code");
    const fin = champ.value.length;
    try { champ.setSelectionRange(fin, fin); } catch (_) {}
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
    if (lien.dataset.enCours) return;
    lien.dataset.enCours = "1";
    const billet = await billetFrais(code);
    // Correctif S3 (Codex, nº 4) : le serveur ne connaît plus ce code — on
    // ne part pas avec l'ancien billet, on fait le ménage.
    if (billet === null) {
      delete lien.dataset.enCours;
      if (lireCode() === code) revenirAuCode();
      return;
    }
    window.location.assign(adresseAppli(appli, billet || billetEntree));
    window.setTimeout(() => { delete lien.dataset.enCours; }, 2000);
  }

  // Un billet neuf au moment du clic : celui reçu à l'entrée peut avoir
  // expiré si l'élève a pris son temps. Si le serveur ne répond pas, on part
  // avec le billet de l'entrée — il vaut peut-être encore. null : le serveur
  // dit que ce code n'existe plus (404) — seul cas où l'on ne part pas.
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
        return {
          lignes: resume.lignes.map(ligne => ({
            texte: `Niveau ${ligne.niveau} : ` + (ligne.tresors
              ? `${ligne.tresors} trésor${ligne.tresors > 1 ? "s" : ""}` : "pas encore de trésor"),
            bonus: ligne.cles !== null ? `\u{1F511} ${ligne.cles} / ${ligne.total}` : ""
          }))
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
        return {lignes: [{texte: resume.texte, bonus: ""}]};
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
      lecteur: (P, brut) => {
        const CORE = window.MATHSGO_DEFI_CALCUL_CORE;
        if (!CORE) return null;
        const resume = P.resumeProf(brut, CORE.carte());
        if (!resume.sues) return null;
        return {
          fait: resume.sues, total: resume.total,
          compte: `${resume.sues} compétence${resume.sues > 1 ? "s" : ""} sue${resume.sues > 1 ? "s" : ""} sur ${resume.total}`,
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
    return {faite: false, texte: `\u{1F514} Aujourd’hui\u00a0: ${mots[0]}${ensuite ? `, puis ${ensuite}` : ""}`};
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

  // Le badge du rang : le même dessin que sur l'accueil de l'activité (un point
  // de métal et le nom ; la couronne pour la Légende). Une seule différence,
  // voulue (choix de Gwenaël, 31/10/2026, planche 5 du lot 6) : sur la tuile,
  // la Légende s'écrit « 👑 Légende » — le nom entier ne tenait pas à côté de
  // « 9 tables passées sur 9 » et prenait une ligne à lui seul. Le lecteur
  // d'écran entend toujours le nom entier (aria-label).
  function badgeRang(rang) {
    const badge = document.createElement("span");
    if (!rang || !rang.niveau) return badge;
    badge.className = `rang ${rang.cle}`;
    if (rang.cle !== "legende" && rang.cle !== "etoiles") {
      const point = document.createElement("i");
      point.setAttribute("aria-hidden", "true");
      badge.append(point);
    }
    badge.append(document.createTextNode(rang.cle === "legende" ? "\u{1F451} Légende" : rang.nom));
    badge.setAttribute("aria-label", `Mon rang : ${rang.lu || rang.nom}`);
    return badge;
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

  // La pastille « Aujourd'hui » de Défi tables (lot « fignolage du 22/10 »),
  // orange, ou verte quand la séance du jour est faite.
  function pastilleAujourdhui(aujourdhui) {
    const pastille = document.createElement("span");
    pastille.className = aujourdhui.faite ? "jauge-aujourdhui faite" : "jauge-aujourdhui";
    pastille.textContent = aujourdhui.texte;
    return pastille;
  }

  // Lot S3 : le gain de la semaine, en vert, au bas de la jauge.
  function poserGain(bloc, jauge) {
    if (!jauge.gain || typeof jauge.gain !== "string") return;
    const gain = document.createElement("span");
    gain.className = "jauge-gain";
    gain.textContent = jauge.gain;
    bloc.append(gain);
  }

  // La jauge posée dans la tuile. Tout est construit par createElement et
  // textContent : rien du serveur ne devient du HTML.
  function poserJauge(tuile, jauge) {
    const bloc = document.createElement("div");
    bloc.className = "jauge";
    // Défi tables sans table passée (lot « fignolage du 22/10 ») : la
    // pastille « Aujourd'hui » seule — ni barre, ni compte, ni rang.
    if (jauge.aujourdhui && !jauge.compte) {
      bloc.className = "jauge seule";
      bloc.append(pastilleAujourdhui(jauge.aujourdhui));
      poserGain(bloc, jauge);
      tuile.classList.add("a-jauge");
      tuile.append(bloc);
      return;
    }
    // Coffres magiques : des lignes de texte, une par niveau commencé, et la
    // partie en cours au bout de la sienne — ni barre, ni rang, ni note.
    if (jauge.lignes) {
      bloc.className = "jauge niveaux";
      jauge.lignes.forEach(ligneNiveau => {
        const ligne = document.createElement("div");
        ligne.className = "jauge-ligne";
        const compte = document.createElement("span");
        compte.className = "compte";
        compte.textContent = ligneNiveau.texte;
        ligne.append(compte);
        if (ligneNiveau.bonus) {
          const bonus = document.createElement("span");
          bonus.className = "bonus";
          bonus.textContent = ligneNiveau.bonus;
          ligne.append(bonus);
        }
        bloc.append(ligne);
      });
      poserGain(bloc, jauge);
      tuile.classList.add("a-jauge");
      tuile.append(bloc);
      return;
    }
    // Lot S3 : un gain sans jauge (cas limite : une table passée cette
    // semaine dont la jauge n'a pas pu être lue) — le gain seul.
    if (!jauge.compte) {
      if (!jauge.gain) return;
      bloc.className = "jauge seule";
      poserGain(bloc, jauge);
      tuile.classList.add("a-jauge");
      tuile.append(bloc);
      return;
    }
    if (jauge.mondes) {
      const mondes = document.createElement("div");
      mondes.className = "mondes";
      mondes.setAttribute("role", "img");
      mondes.setAttribute("aria-label", jauge.mondes
        .map(monde => `Monde ${monde.numero} : ${ETATS_MONDE[monde.etat] || ETATS_MONDE.vide}`).join(", "));
      jauge.mondes.forEach(monde => mondes.append(pastilleMonde(monde)));
      bloc.append(mondes);
    } else {
      const barre = document.createElement("div");
      barre.className = "jauge-barre";
      const remplie = document.createElement("i");
      const part = jauge.total > 0 ? Math.max(0, Math.min(1, jauge.fait / jauge.total)) : 0;
      remplie.style.width = `${Math.round(part * 100)}%`;
      barre.append(remplie);
      bloc.append(barre);
    }
    const ligne = document.createElement("div");
    ligne.className = "jauge-ligne";
    const compte = document.createElement("span");
    compte.className = "compte";
    compte.textContent = jauge.compte;
    ligne.append(compte);
    if (jauge.rang) ligne.append(badgeRang(jauge.rang));
    if (jauge.bonus) {
      const bonus = document.createElement("span");
      bonus.className = "bonus";
      bonus.textContent = jauge.bonus;
      ligne.append(bonus);
    }
    bloc.append(ligne);
    if (jauge.note) {
      const note = document.createElement("span");
      note.className = "jauge-note";
      note.textContent = jauge.note;
      bloc.append(note);
    }
    if (jauge.aujourdhui) bloc.append(pastilleAujourdhui(jauge.aujourdhui));
    poserGain(bloc, jauge);
    tuile.classList.add("a-jauge");
    tuile.append(bloc);
  }

  // Les activités commencées passent en tête : c'est là que l'élève retourne.
  // L'ordre des autres ne bouge pas.
  function remonter(li) {
    const liste = $("applis");
    // Lot « cours-appli » : « Mes cours » reste la première tuile.
    const tete = liste.firstChild && liste.firstChild.classList && liste.firstChild.classList.contains("cours-li")
      ? liste.firstChild.nextSibling : liste.firstChild;
    if (tete && tete !== li) liste.insertBefore(li, tete);
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
    const espace = {aujourdhui, jours: [], travail: false, ouvertes: aLire.filter((cle, i) => Boolean(parcours[i]))};
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

  // Les jauges posées sur les tuiles (dans l'ordre des activités `cles`).
  function poserLesJauges(jauges, cles) {
    const aLire = cles.filter(cle => Object.prototype.hasOwnProperty.call(jauges, cle) && jauges[cle]);
    // À l'envers : la première activité commencée finit bien la première.
    for (let i = aLire.length - 1; i >= 0; i -= 1) {
      const jauge = jauges[aLire[i]];
      const tuile = $("applis").querySelector(`.appli[data-cle="${CSS.escape(aLire[i])}"]`);
      if (!tuile || tuile.querySelector(".jauge")) continue;
      poserJauge(tuile, jauge);
      // La pastille « Aujourd'hui » seule (aucune table passée) ne fait pas
      // remonter la tuile : l'ordre des tuiles ne change pas avec ce lot.
      if (!jauge.aujourdhui || jauge.compte) remonter(tuile.closest("li"));
    }
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
      if (document.visibilityState === "hidden") return;
      const attente = await demanderDirect(code);
      if (directCode !== code || moi !== directTour || !attente) return;
      directMinuteur = window.setTimeout(tour, attente);
    };
    return tour();
  }

  document.addEventListener("visibilitychange", () => {
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
    // Seules les applis ouvertes (le serveur n'envoie plus que celles-là ; un
    // serveur d'avant le lot « retours de classe » enverrait encore les
    // annonces : elles sont simplement ignorées).
    const disponibles = (donnees.applis || []).filter(a => a.disponible && a.url);

    disponibles.forEach(appli => {
      // L'appli Cours a sa tuile à elle, en tête (poserTuileCours).
      if (appli.cle === "cours") return;
      const li = document.createElement("li");
      const lien = document.createElement("a");
      lien.className = "appli";
      // La clé sert à retrouver la tuile pour y poser sa jauge (voir
      // poserLesJauges). Elle vient du catalogue du serveur, pas de l'élève.
      lien.dataset.cle = appli.cle;
      // Le billet de l'entrée sert de secours (clic du milieu, « ouvrir dans un
      // nouvel onglet ») ; un clic ordinaire en demande un frais.
      lien.href = adresseAppli(appli, donnees.billet || "");
      lien.addEventListener("click", event => ouvrirAppli(event, lien, appli, code, donnees.billet || ""));
      lien.innerHTML = `${icone(appli.cle)}<div class="texte"><strong></strong><span></span></div>${FLECHE}`;
      lien.querySelector("strong").textContent = appli.nom;
      lien.querySelector("span").textContent = appli.description;
      // Lot S3 : la tuile épurée — la phrase n'est plus utile à l'élève qui
      // a déjà ouvert l'appli (le serveur a son parcours).
      lien.querySelector("span").hidden = ouvertes.includes(appli.cle);
      li.appendChild(lien);
      liste.appendChild(li);
    });

    // Lot E4 : la tuile de l'évaluation mène à Défi tables, comme sa tuile —
    // même adresse, même billet. Cachée jusqu'à la première lecture.
    appliEvaluation = disponibles.find(appli => appli.cle === "defi-tables") || null;
    const tuileEvaluation = $("evaluation-lien");
    if (!dejaSuivi) tuileEvaluation.hidden = true;
    tuileEvaluation.href = appliEvaluation ? adresseAppli(appliEvaluation, donnees.billet || "") : "#";
    tuileEvaluation.onclick = appliEvaluation
      ? event => ouvrirAppli(event, tuileEvaluation, appliEvaluation, code, donnees.billet || "")
      : event => event.preventDefault();

    // L'appli Cours : sa tuile en tête de la liste.
    poserTuileCours(coursLus(donnees.cours));
    if (!liste.children.length) {
      const li = document.createElement("li");
      li.className = "aide";
      li.textContent = "Aucune activité n’est proposée à ta classe pour l’instant.";
      liste.appendChild(li);
    }

    // Les jauges sont posées AVANT que la grille se montre (lot 8) : un seul
    // dessin, à sa place définitive. Celles qui manquent (serveur muet,
    // moteur absent) ne manquent qu'à leur tuile.
    poserLesJauges(jauges || {}, disponibles.map(appli => appli.cle));

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
        fiches: (Array.isArray(c.fiches) ? c.fiches : [])
          .filter(f => f && typeof f === "object" && adresseCours(f.url))
          .map(f => ({n: Number.isInteger(f.n) && f.n > 0 ? f.n : 0, h1: texteDe(f.h1), type: texteDe(f.type), url: f.url})),
        brevet: adresseCours(c.brevet),
        imprimable: adresseCours(c.imprimable)
      }))
      .filter(c => c.fiches.length || c.brevet);
  }

  // La tuile : « Mes cours », la PREMIÈRE de la liste des activités, et
  // dessous le nombre de chapitres ouverts (choix de Gwenaël du 08/11/2026).
  // Aucun chapitre ouvert : pas de tuile. Une activité commencée remonte en
  // tête, mais sous « Mes cours » (remonter).
  function poserTuileCours(cours) {
    coursOuverts = cours;
    const liste = $("applis");
    const ancienne = liste.querySelector("li.cours-li");
    if (ancienne) ancienne.remove();
    const n = cours ? cours.length : 0;
    if (!n) return;
    const li = document.createElement("li");
    li.className = "cours-li";
    li.innerHTML = `<a class="appli cours-tuile" id="cours-lien" href="#cours">${icone("cours")}<div class="texte"><strong>Mes cours</strong><span></span></div>${FLECHE}</a>`;
    li.querySelector(".texte span").textContent = n > 1 ? `${n} chapitres` : "1 chapitre";
    liste.prepend(li);
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
  function dessinerListeCours() {
    $("cours-retour").href = "#";
    $("cours-retour").setAttribute("aria-label", "Mon espace");
    const corps = $("cours-corps");
    corps.textContent = "";
    const liste = document.createElement("ul");
    coursOuverts.forEach(chapitre => {
      const li = document.createElement("li");
      const lien = document.createElement("a");
      lien.className = "appli";
      lien.href = `#cours=${chapitre.id}`;
      lien.innerHTML = `<div class="texte"><strong></strong><span></span></div>${FLECHE}`;
      const texte = lien.querySelector(".texte");
      texte.prepend(surTitre(chapitre));
      lien.querySelector("strong").textContent = chapitre.titre;
      const n = chapitre.fiches.length;
      lien.querySelector(".texte span").textContent =
        [n ? `${n} fiche${n > 1 ? "s" : ""}` : "", chapitre.brevet ? nomBrevet(chapitre) : ""].filter(Boolean).join(" · ");
      li.append(lien);
      liste.append(li);
    });
    corps.append(liste);
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

  $("code").addEventListener("input", event => {
    event.target.value = nettoyer(event.target.value);
    curseurAuBout();
    dessinerCases();
  });
  $("code").addEventListener("focus", () => {
    $("cases").classList.add("actif");
    dessinerCases();
    curseurAuBout();
    // iOS place le curseur APRÈS l'événement « focus » : on repasse derrière.
    setTimeout(curseurAuBout, 0);
  });
  $("code").addEventListener("blur", () => $("cases").classList.remove("actif"));
  $("code").addEventListener("click", curseurAuBout);
  // Les flèches et « début » déplaceraient le curseur dans un code qu'on ne
  // voit pas : on les neutralise, le code se tape et s'efface depuis le bout.
  $("code").addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      curseurAuBout();
    }
  });
  // L'iPhone déplace aussi le curseur sans clic ni touche : appui long (la
  // loupe), barre d'espace glissée, double-tap qui sélectionne tout le code.
  // Le navigateur ne le dit que par « selectionchange » : on le ramène au bout,
  // sinon la lettre suivante entrerait au début ou remplacerait le code.
  document.addEventListener("selectionchange", () => {
    const champ = $("code");
    if (document.activeElement === champ && champ.selectionStart !== champ.value.length) curseurAuBout();
  });

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
  $("changer").addEventListener("click", () => {
    revenirAuCode();
    $("code").focus();
    try { window.location.replace(SORTIE_PAR_LE_SITE); } catch (_) {}
  });

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
    ouvrir(memorise, true);
  });

  dessinerCases();
  if (oublierSiDemande()) {
    document.documentElement.classList.remove("retour");
    $("code").focus();
  } else {
    const memorise = nettoyer(lireCode());
    if (memorise.length === 6) ouvrir(memorise, true);
    else document.documentElement.classList.remove("retour");
  }
})();
</script>
</body>
</html>
