<?php
// Catalogue des applis proposables aux classes.
// Une seule copie de chaque appli : on ouvre celle de mathsgo.re en lui
// passant le code de l'élève dans l'adresse (#code=…).

declare(strict_types=1);

const CATALOGUE_APPLIS = [
    'defi-tables' => [
        'nom' => 'Défi tables',
        'description' => 'Apprendre et valider ses tables de multiplication.',
        'url' => 'https://mathsgo.re/outils/calcul_mental/defi_tables.html',
        'ancre' => 'parcours',
        'disponible' => true,
    ],
    'automatismes' => [
        'nom' => 'Automatismes',
        'description' => 'Entraînement aux automatismes du collège.',
        'url' => null,
        'ancre' => null,
        'disponible' => false,
    ],
];

function appli_connue(string $cle): bool
{
    return array_key_exists($cle, CATALOGUE_APPLIS);
}

function applis_de_classe(string $liste): array
{
    $sortie = [];
    foreach (explode(',', $liste) as $cle) {
        $cle = trim($cle);
        if (!appli_connue($cle)) continue;
        $sortie[] = ['cle' => $cle] + CATALOGUE_APPLIS[$cle];
    }
    return $sortie;
}
