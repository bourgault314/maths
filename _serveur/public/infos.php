<?php
// Page d'information de l'espace élève : confidentialité, mentions légales,
// licence, contact — écrite POUR UN ÉLÈVE, et sans une seule porte de sortie.
//
// Pourquoi elle existe (08/09/2026). L'espace élève renvoyait vers
// mathsgo.re/confidentialite.html, une page écrite pour un visiteur du site :
// elle parle de cookies, de mesure d'audience et de tous les jeux, elle dit
// « maths&go ne crée pas de compte élève » à un enfant qui, lui, a
// l'impression d'être connecté quelque part, et son bouton « Retour à
// l'accueil » le déposait sur l'accueil du site. Un élève entré par son code
// ne doit jamais quitter son espace : tout ce qui le concerne est donc redit
// ici, dans ses mots, avec un seul bouton — retour chez lui.
//
// Les faits (ce qui est enregistré, où, pour combien de temps) sont ceux du
// paragraphe « Le suivi de classe, sur code » de confidentialite.html : cette
// page-ci ne dit rien de plus, ni rien d'autre. Si l'un des deux textes
// change, l'autre doit suivre.
//
// Aucun lien ne sort d'ici : les adresses du site (confidentialité complète,
// licence) sont écrites en TEXTE. Un test le vérifie.
require_once __DIR__ . '/lib/entetes.php';
header('Content-Type: text/html; charset=utf-8');
// Mêmes en-têtes que la page d'accueil : politique de contenu, no-store.
// Cette page n'a aucun script — le nonce n'a rien à porter, la politique est
// envoyée quand même.
entetes_page();
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Ce que l’espace élèves de maths&go enregistre, et qui peut le voir.">
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<title>Ton espace, en clair | maths&amp;go</title>
<style>
  :root {
    --blue: #063f86; --blue-dark: #052f67; --teal: #08aaa5;
    --ink: #10294a; --muted: #5c6c82; --paper: #fff; --line: #d9e2ec; --page: #f6f8fb;
    --brand-gradient: linear-gradient(90deg, #08aaa5 0%, #0b67b2 44%, #f58220 72%, #f9bf3b 100%);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; flex-direction: column;
    background: var(--page); color: var(--ink);
    font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .barre { height: 5px; background: var(--brand-gradient); }
  header { padding: 12px 16px; background: var(--paper); border-bottom: 1px solid var(--line);
           display: flex; align-items: center; gap: 10px; }
  header img { display: block; height: 34px; width: auto; }
  main { flex: 1; width: 100%; max-width: 780px; margin: 0 auto; padding: 22px 16px 34px; }
  h1 { margin: 0 0 6px; font-family: Georgia, "Times New Roman", serif;
       font-size: clamp(1.5rem, 5vw, 2rem); line-height: 1.15; color: var(--blue-dark); }
  .sous-titre { margin: 0 0 22px; color: var(--muted); }
  h2 { margin: 0 0 8px; font-size: 1.06rem; color: var(--blue-dark); }
  .carte { background: var(--paper); border: 1px solid var(--line); border-radius: 14px;
           padding: 16px 18px; margin-bottom: 12px; box-shadow: 0 10px 26px rgba(22,47,82,.07); }
  .carte p { margin: 0; }
  .carte p + p { margin-top: 8px; }
  /* Le bloc des parents s'adresse à quelqu'un d'autre : il se repère d'un coup
     d'œil, et c'est le seul qui se lit au vouvoiement. */
  .parents { border-left: 5px solid var(--teal); background: #f4fbfb; }
  .parents h2 { color: #06716e; }
  /* Les trois blocs administratifs : plus discrets, parce qu'un élève n'a pas
     besoin de les lire pour comprendre son espace. Ils doivent être là, pas
     au premier plan. */
  .administratif { color: var(--muted); font-size: .92rem; }
  .administratif h2 { font-size: .98rem; color: var(--muted); }
  .administratif p + p { margin-top: 4px; }
  /* Une cible tapable au doigt (44 px de haut) même dans le petit texte. */
  .administratif a { display: inline-block; padding: 11px 2px; color: var(--blue); font-weight: 700; }
  /* Le seul geste de la page. En bas, large, et il ramène chez soi. */
  .retour { display: block; width: fit-content; max-width: 100%; margin: 24px auto 0;
            min-height: 48px; padding: 13px 22px; font-size: 1rem; font-weight: 700;
            color: #fff; background: var(--blue); border-radius: 10px; text-decoration: none; }
  .retour:hover { background: var(--blue-dark); }
</style>
</head>
<body>
<div class="barre"></div>
<header>
  <img src="mathsgo-logo.png" alt="maths&go">
</header>

<main>
  <h1>Ton espace, en clair</h1>
  <p class="sous-titre">Ce qui est enregistré quand tu travailles ici, et qui peut le voir.</p>

  <section class="carte">
    <h2>Ton code, ton espace</h2>
    <p>Ton professeur t’a donné un code de 6 caractères. Ce code ouvre ton espace : il te montre les activités de ta classe et il envoie ta progression à ton professeur. Ce n’est pas un compte : il n’y a pas d’identifiant, pas de mot de passe, pas d’adresse mail.</p>
    <p>Quand tu fermes l’onglet ou que tu cliques sur « Se déconnecter », l’espace se referme. Si tu es sur un ordinateur ou une tablette que d’autres utilisent, clique sur « Se déconnecter » quand tu as fini.</p>
  </section>

  <section class="carte">
    <h2>Ce qui est enregistré</h2>
    <p>Ton prénom et l’initiale de ton nom (écrits par ton professeur), ta classe, ta progression dans chaque activité, et le jour de ta dernière activité. Rien d’autre : pas ton nom de famille, pas d’adresse.</p>
    <p>Pendant une évaluation ou une séance en direct, tes réponses et l’heure où tu commences sont gardées le temps que ton professeur les récupère, puis effacées au plus tard le lendemain.</p>
    <p>Tout est effacé à la fin de l’année scolaire. Tu peux aussi demander à ton professeur de l’effacer avant.</p>
  </section>

  <section class="carte">
    <h2>Qui peut le voir</h2>
    <p>Ton professeur. Et toute personne qui connaît ton code : c’est pour ça que tes parents peuvent regarder avec toi, et c’est pour ça que ton code ne se prête pas. Si tu penses que quelqu’un l’a, dis-le à ton professeur : il t’en donnera un nouveau, et l’ancien ne marchera plus.</p>
  </section>

  <section class="carte">
    <h2>Pas de cookie, pas de traceur</h2>
    <p>Cet espace ne pose aucun cookie et ne mesure rien. Ton code reste dans la mémoire de l’onglet, jamais dans l’adresse de la page.</p>
  </section>

  <section class="carte">
    <h2>Où c’est rangé</h2>
    <p>Sur un serveur hébergé par OVH, en France. Ce suivi est mis en place par ton professeur dans le cadre du collège.</p>
  </section>

  <section class="carte parents">
    <h2>Pour les parents</h2>
    <p>Vous pouvez consulter la progression de votre enfant avec son code. Pour la faire corriger ou effacer, ou pour toute question, adressez-vous à son professeur de mathématiques, qui est votre interlocuteur pour ce suivi.</p>
    <p>Le texte complet de la politique de confidentialité de maths&amp;go est à l’adresse mathsgo.re/confidentialite.html</p>
  </section>

  <section class="carte administratif">
    <h2>Mentions légales</h2>
    <p>Éditeur et directeur de la publication : Gwenaël Bourgault, à titre non professionnel.</p>
    <!-- Le seul lien cliquable de la page en dehors du bouton de retour, et il
         ne fait sortir personne : « mailto: » ouvre l'application de messagerie
         de l'appareil, la page de l'espace reste ouverte derrière. L'objet est
         pré-rempli pour que Gwenaël voie d'où vient le message. -->
    <p>Contact : <a href="mailto:gwenael@mathsgo.re?subject=Espace%20%C3%A9l%C3%A8ves%20maths%26go">gwenael@mathsgo.re</a></p>
    <p>Hébergeur de cet espace : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.</p>
  </section>

  <section class="carte administratif">
    <h2>Licence</h2>
    <p>Les contenus de maths&amp;go sont publiés sous licence CC BY-NC-SA 4.0 (mathsgo.re/licence.html).</p>
  </section>

  <section class="carte administratif">
    <h2>Contact</h2>
    <p>Une question sur ton espace ? Demande à ton professeur.</p>
  </section>

  <a class="retour" href="./">← Retour à mon espace</a>
</main>
</body>
</html>
