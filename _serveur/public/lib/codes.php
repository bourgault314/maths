<?php
// Codes élèves : 6 caractères en majuscules, sans O, 0, I ni 1 (les seuls
// qu'on lit de travers en capitales). Le L est dans l'alphabet : en
// majuscule il ne ressemble à rien d'autre. 32 caractères, 2^30 codes.

declare(strict_types=1);

const ALPHABET_CODE = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const LONGUEUR_CODE = 6;

function code_valide(string $code): bool
{
    if (strlen($code) !== LONGUEUR_CODE) return false;
    for ($i = 0; $i < LONGUEUR_CODE; $i++) {
        if (strpos(ALPHABET_CODE, $code[$i]) === false) return false;
    }
    return true;
}

function normaliser_code(string $brut): string
{
    // L'alphabet exclut O, 0, I et 1 : ils ne peuvent pas apparaître dans un
    // vrai code. On se contente donc de nettoyer la frappe (espaces, tirets).
    $code = strtoupper($brut);
    $code = preg_replace('/[^A-Z0-9]/', '', $code) ?? '';
    return $code;
}

function tirer_code(): string
{
    $code = '';
    $max = strlen(ALPHABET_CODE) - 1;
    for ($i = 0; $i < LONGUEUR_CODE; $i++) {
        $code .= ALPHABET_CODE[random_int(0, $max)];
    }
    return $code;
}

function code_libre(PDO $pdo): string
{
    for ($essai = 0; $essai < 40; $essai++) {
        $code = tirer_code();
        $requete = $pdo->prepare('SELECT 1 FROM eleves WHERE code = ?');
        $requete->execute([$code]);
        if ($requete->fetchColumn() === false) return $code;
    }
    throw new RuntimeException("Impossible de tirer un code libre.");
}
