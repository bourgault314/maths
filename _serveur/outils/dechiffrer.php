<?php
// Déchiffre une sauvegarde produite par _serveur/public/sauvegarde.php.
//
//   php _serveur/outils/dechiffrer.php suivi-2026-09-05.sql.enc [sortie.sql]
//
// C'est un REPLI. Le fichier est au format d'openssl, la façon normale de le
// lire est la ligne de commande, qui marchera encore dans dix ans sans ce
// dépôt :
//
//   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -md sha256 \
//     -in suivi-2026-09-05.sql.enc -out suivi-2026-09-05.sql
//
// (openssl.exe est fourni avec Git pour Windows :
//  C:\Program Files\Git\usr\bin\openssl.exe)

declare(strict_types=1);

const ITERATIONS_PBKDF2 = 200000;

$entree = $argv[1] ?? '';
if ($entree === '' || !is_file($entree)) {
    fwrite(STDERR, "Usage : php dechiffrer.php <fichier.sql.enc> [sortie.sql]\n");
    exit(1);
}
$sortie = $argv[2] ?? preg_replace('/\.enc$/', '', $entree) . '';
if ($sortie === $entree) $sortie = $entree . '.sql';

$brut = (string)file_get_contents($entree);
if (substr($brut, 0, 8) !== 'Salted__') {
    fwrite(STDERR, "Ce fichier n'est pas une sauvegarde chiffrée (marque « Salted__ » absente).\n");
    exit(1);
}

fwrite(STDOUT, "Phrase de chiffrement : ");
$phrase = trim((string)fgets(STDIN));

$sel = substr($brut, 8, 8);
$matiere = hash_pbkdf2('sha256', $phrase, $sel, ITERATIONS_PBKDF2, 48, true);
$clair = openssl_decrypt(substr($brut, 16), 'aes-256-cbc', substr($matiere, 0, 32),
    OPENSSL_RAW_DATA, substr($matiere, 32, 16));

if ($clair === false || !str_contains(substr($clair, 0, 200), 'maths&go')) {
    fwrite(STDERR, "Déchiffrement impossible : la phrase n'est pas la bonne, ou le fichier est abîmé.\n");
    exit(1);
}

file_put_contents($sortie, $clair);
$lignes = substr_count($clair, "\n");
fwrite(STDOUT, "Écrit dans $sortie (" . number_format((float)strlen($clair), 0, ',', ' ') . " octets, $lignes lignes).\n");
foreach (explode("\n", $clair) as $ligne) {
    if (str_starts_with($ligne, '--')) fwrite(STDOUT, "  $ligne\n"); else break;
}
