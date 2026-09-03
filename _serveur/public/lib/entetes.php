<?php
// En-têtes de sécurité, envoyés par PHP sur chaque réponse (pages et API).
//
// Ils ne dépendent pas de .htaccess : chez un hébergeur sans mod_headers, ou
// dans les tests (serveur intégré de PHP), ils sortent quand même. Le
// .htaccess pose les mêmes sur le seul fichier que PHP ne sert pas (le moteur
// JS copié dans prof/), et sur lui seulement : chez OVH, une directive Header
// posée sur tout le dossier s'ajoutait à ceux-ci au lieu de les remplacer.

declare(strict_types=1);

// Les en-têtes communs à toute réponse.
function entetes_securite(): void
{
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    // Aucune page d'ici ne se met dans un cadre : ni le formulaire de code,
    // ni « Ma classe » (un cadre invisible est la base du détournement de clic).
    header('X-Frame-Options: DENY');
    // Le sous-domaine est en HTTPS seul depuis le début : un an de mémoire.
    header('Strict-Transport-Security: max-age=31536000');
}

// Pour une page HTML : les en-têtes communs plus la politique de contenu.
// Renvoie le nonce à poser sur chaque <script> en ligne de la page — un script
// injecté d'une manière ou d'une autre ne l'aura pas, et ne s'exécutera pas.
//
// - script-src 'self' 'nonce-…' : nos scripts, et rien d'un autre domaine —
//   c'est pour cela que le moteur de Défi tables est servi d'ici (prof/) et
//   plus depuis mathsgo.re : un script d'ailleurs s'exécuterait avec les
//   droits de la session du professeur.
// - style-src 'self' 'unsafe-inline' : les feuilles de style sont dans les
//   pages (pas de script possible par un style).
// - img-src 'self' data: : depuis le lot 7, le logo et les icônes sont copiés
//   ici (racine du suivi). Avant, mathsgo.re — et tout ce qui est devant lui —
//   apprenait l'adresse IP et l'horaire de chaque ouverture de l'espace des
//   professeurs, y compris avant la connexion.
// - connect-src 'self' : les appels d'API restent sur suivi.mathsgo.re.
// - frame-ancestors 'none' : la version moderne de X-Frame-Options: DENY.
function entetes_page(): string
{
    entetes_securite();
    $nonce = base64_encode(random_bytes(16));
    // Une page du suivi n'a rien à faire dans le cache disque du navigateur :
    // elle ne contient pas de donnée d'élève (l'API répond déjà en no-store),
    // mais sur un poste partagé la coquille revient parfois hors ligne, et
    // « pas de cache » est la règle la plus simple à tenir.
    header('Cache-Control: no-store');
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-$nonce'; "
        . "style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
        . "connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; "
        . "form-action 'self'; frame-ancestors 'none'");
    return $nonce;
}
