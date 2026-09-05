<?php
// Fabrique _serveur/public/VERSION : la liste des fichiers du serveur avec
// leur empreinte SHA-256. C'est ce fichier que verifier.php relit en ligne
// pour dire, en une phrase, si ce qui tourne chez OVH est bien ce qui est dans
// le dépôt — ou quel fichier a été oublié pendant le dépôt par FTP.
//
//   php _serveur/outils/generer-version.php [nom-du-lot]
//   php _serveur/outils/generer-version.php --verifier   (ne récrit rien)
//
// Un test du dépôt (tests/suivi-version-manifeste.test.mjs) refait le même
// calcul à chaque passage de la CI : le manifeste ne peut pas se démoder en
// silence.

declare(strict_types=1);

const RACINE_PUBLIC = __DIR__ . '/../public';

// Ce qui ne figure JAMAIS au manifeste :
//  - config.php : n'existe que chez OVH, jamais dans le dépôt ;
//  - config.exemple.php : un modèle, refusé par .htaccess, pas toujours déposé ;
//  - installer.php, migrer.php, secours.php, sauvegarde.php : ils ne doivent
//    PAS être en ligne — verifier.php a une ligne rien que pour ça ;
//  - VERSION : il ne peut pas contenir sa propre empreinte.
const HORS_MANIFESTE = [
    'config.php', 'config.exemple.php',
    'installer.php', 'migrer.php', 'secours.php', 'sauvegarde.php',
    'VERSION',
];

function fichiers_du_serveur(): array
{
    $racine = realpath(RACINE_PUBLIC);
    $chemins = [];
    $iterateur = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($racine, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($iterateur as $fichier) {
        if (!$fichier->isFile()) continue;
        $relatif = str_replace('\\', '/', substr($fichier->getPathname(), strlen($racine) + 1));
        if (in_array($relatif, HORS_MANIFESTE, true)) continue;
        $chemins[] = $relatif;
    }
    sort($chemins, SORT_STRING);
    return $chemins;
}

// Les lignes « empreinte  chemin », dans l'ordre des chemins.
function lignes_du_manifeste(): array
{
    $lignes = [];
    foreach (fichiers_du_serveur() as $relatif) {
        $lignes[] = hash_file('sha256', RACINE_PUBLIC . '/' . $relatif) . '  ' . $relatif;
    }
    return $lignes;
}

// L'empreinte du manifeste lui-même : c'est ELLE qui identifie une version.
// (Le numéro du commit ne peut pas y figurer : le fichier fait partie du
// commit, il changerait le numéro qu'il annonce. Cette empreinte-là se
// compare dans les deux sens — dépôt et serveur en ligne.)
function empreinte_du_manifeste(array $lignes): string
{
    return hash('sha256', implode("\n", $lignes) . "\n");
}

function texte_du_manifeste(string $lot, string $jour): string
{
    $lignes = lignes_du_manifeste();
    $entete = [
        "# Manifeste du serveur de suivi maths&go — produit par outils/generer-version.php.",
        "# Ne pas modifier à la main : un test du dépôt refait ce calcul à chaque passage.",
        "# verifier.php relit ce fichier en ligne et compare chaque empreinte.",
        "lot $lot",
        "genere_le $jour",
        "fichiers " . count($lignes),
        "manifeste " . empreinte_du_manifeste($lignes),
        "",
    ];
    return implode("\n", $entete) . implode("\n", $lignes) . "\n";
}

$verifier = in_array('--verifier', $argv, true);
$lot = 'inconnu';
$jour = gmdate('Y-m-d');
$existant = @file_get_contents(RACINE_PUBLIC . '/VERSION');
if (is_string($existant)) {
    if (preg_match('/^lot (.+)$/m', $existant, $m)) $lot = trim($m[1]);
    if (preg_match('/^genere_le (.+)$/m', $existant, $m)) $jour = trim($m[1]);
}
foreach (array_slice($argv, 1) as $argument) {
    if ($argument !== '--verifier') { $lot = $argument; $jour = gmdate('Y-m-d'); }
}

$attendu = texte_du_manifeste($lot, $jour);

if ($verifier) {
    if ($existant === $attendu) {
        echo "VERSION est à jour (" . count(lignes_du_manifeste()) . " fichiers).\n";
        exit(0);
    }
    fwrite(STDERR, "VERSION n'est plus à jour : relance « php _serveur/outils/generer-version.php <nom-du-lot> ».\n");
    exit(1);
}

file_put_contents(RACINE_PUBLIC . '/VERSION', $attendu);
echo "VERSION écrit : " . count(lignes_du_manifeste()) . " fichiers, lot « $lot ».\n";
echo "Empreinte du manifeste : " . empreinte_du_manifeste(lignes_du_manifeste()) . "\n";
