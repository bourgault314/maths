<?php
// Configuration du serveur de suivi — À RECOPIER SOUS LE NOM config.php
//
// Ce fichier reste UNIQUEMENT sur l'hébergement OVH.
// Il n'est jamais publié sur GitHub et ne doit jamais être envoyé par message.

return [
    'bd' => [
        // Les trois premières valeurs sont affichées par OVH quand tu crées la base.
        'hote' => 'mathsgoXXXX.mysql.db',
        'base' => 'mathsgoXXXX',
        'utilisateur' => 'mathsgoXXXX',
        // Le mot de passe que TU as choisi en créant la base.
        'motdepasse' => 'à-remplacer',
    ],

    // Les sites autorisés à parler au serveur. Ne rien ajouter d'autre.
    'origines' => [
        'https://mathsgo.re',
        'https://suivi.mathsgo.re',
    ],

    // Mot de passe à usage unique de la page d'installation.
    // Invente n'importe quelle suite de caractères, elle ne sert qu'une fois.
    'jeton_installation' => 'à-remplacer',
];
