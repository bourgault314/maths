<?php
// Catalogue des applis proposables aux classes.
// Une seule copie de chaque appli : on ouvre celle de mathsgo.re en lui
// passant un billet d'entrée dans l'adresse (#b=…, lib/billets.php) — jamais
// le code lui-même, qui entrerait dans l'historique du navigateur.

declare(strict_types=1);

const CATALOGUE_APPLIS = [
    'defi-tables' => [
        'nom' => 'Défi tables',
        'description' => 'Apprendre et valider ses tables de multiplication.',
        'url' => 'https://mathsgo.re/outils/calcul_mental/defi_tables.html',
        'ancre' => 'parcours',
        'disponible' => true,
        // Ce que le serveur accepte d'enregistrer (lib/progression.php) : les
        // clés connues de defi_tables_mon_parcours.js, à toute profondeur, les
        // mots d'une liste fermée, et les clés de table « 7 » et de calcul
        // « 3-7 ». Tout le reste — un prénom, un texte — est retiré. Si l'appli
        // gagne un champ, il faut l'ajouter ici : tests/parcours-reference.json
        // (généré par l'appli) casse un test tant que ce n'est pas fait.
        'cles' => ['version', 'epoque', 'tables', 'apprends', 'construct', 'gaps', 'ordered', 'random',
            'entraine', 'desordre', 'trous', 'mixte', 'dernier', 'entrainement', 'score', 'total',
            'acquise', 'melange', 'aJour', 'aRefaireAvec', 'expert', 'niveau', 'champion',
            'calculs', 'cases', 'vu', 'erreur', 'gagne'],
        'mots' => ['desordre', 'trous', 'mixte'],
        'motifs' => ['/^(?:[2-9]|10)$/', '/^\d{1,2}-\d{1,2}$/'],
    ],
    'automatismes' => [
        'nom' => 'Automatismes',
        'description' => 'Entraînement aux automatismes du collège.',
        'url' => null,
        'ancre' => null,
        'disponible' => false,
        // Pas encore d'appli : rien n'est accepté. À déclarer avec l'appli.
        'cles' => [],
        'mots' => [],
        'motifs' => [],
    ],
];

function appli_connue(string $cle): bool
{
    return array_key_exists($cle, CATALOGUE_APPLIS);
}

// Ce que la page élève affiche, et RIEN d'autre.
//
// Lot 11 (05/09/2026, A-annexe 5) : jusqu'ici, la réponse de api/eleve.php
// recopiait l'entrée entière du catalogue — donc « cles », « mots » et
// « motifs », c'est-à-dire la description exacte de ce que le filtre du serveur
// accepte d'enregistrer. Le filtre tient (l'audit l'a éprouvé), mais publier
// son mode d'emploi à qui a un code d'élève n'apporte rien à personne : la page
// n'utilise que le nom, la description, l'adresse, l'ancre et « disponible ».
const CHAMPS_AFFICHES_APPLI = ['nom', 'description', 'url', 'ancre', 'disponible'];

function applis_de_classe(string $liste): array
{
    $sortie = [];
    foreach (explode(',', $liste) as $cle) {
        $cle = trim($cle);
        if (!appli_connue($cle)) continue;
        $appli = ['cle' => $cle];
        foreach (CHAMPS_AFFICHES_APPLI as $champ) {
            $appli[$champ] = CATALOGUE_APPLIS[$cle][$champ] ?? null;
        }
        $sortie[] = $appli;
    }
    return $sortie;
}
