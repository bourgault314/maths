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
        // Lot 3 de Défi tables v2 (08/09/2026) : « etoiles », « couronne »
        // (l'escalier), « rang », « jours » (une liste de dates). « niveau » et
        // « champion » restent acceptés : un appareil resté sur l'ancienne
        // appli les envoie encore, et c'est l'appli qui les migre.
        // Lot 4b (10/09/2026) : « beads », la cinquième activité de J'apprends
        // (« je pousse les perles ») ; « avis » et « avisVu » (l'avis unique de
        // migration du lot 3, retiré) ne sont plus déclarés — un vieil appareil
        // qui les envoie encore les voit simplement filtrés.
        // Lot mémoire (12/09/2026) : « boite » (1 à 5) et « echeance » (le jour
        // où le calcul revient, « AAAA-MM-JJ ») par calcul ; « cases » reste
        // accepté — l'appli l'écrit encore en miroir pour les appareils restés
        // sur l'appli d'avant, et c'est elle qui migre.
        'cles' => ['version', 'epoque', 'tables', 'apprends', 'beads', 'construct', 'gaps', 'ordered', 'random',
            'entraine', 'desordre', 'trous', 'mixte', 'dernier', 'entrainement', 'score', 'total',
            'acquise', 'melange', 'aJour', 'aRefaireAvec', 'expert', 'niveau', 'champion',
            'etoiles', 'couronne', 'rang', 'jours',
            'calculs', 'boite', 'cases', 'vu', 'erreur', 'gagne', 'echeance'],
        'mots' => ['desordre', 'trous', 'mixte'],
        'motifs' => ['/^(?:[2-9]|10)$/', '/^\d{1,2}-\d{1,2}$/'],
        // Lot serveur A (06/09/2026) : la SEULE chose que le serveur compte
        // dans une progression. Il ne la comprend toujours pas — il compte les
        // entrées d'une clé DÉCLARÉE ici, et range le nombre à côté de la
        // version du jour (lib/versions.php) pour que « Revenir à… » puisse
        // écrire « fin de journée du mardi 8 septembre — 11 calculs » sans
        // renvoyer sept progressions entières par élève. Une appli qui ne
        // déclare rien n'est pas comptée.
        'compteur' => 'calculs',
    ],
    // Les entrées qui suivent sont ANNONCÉES, pas ouvertes : l'appli ne sait pas
    // encore parler au serveur (« disponible » à false, « url » à null). Elles
    // s'affichent dans l'espace élève avec la pastille « Bientôt », sans lien.
    // L'ORDRE DE CE TABLEAU EST L'ORDRE D'AFFICHAGE (choisi par Gwenaël le
    // 07/09/2026) : tables, calcul, automatismes, Splat, Solèy.
    // Le jour où l'une d'elles s'ouvre, elle reçoit son adresse, ses clés
    // acceptées et son compteur, passe à « disponible », et c'est alors la
    // liste de la classe qui décide qui la voit.
    'defi-calcul' => [
        'nom' => 'Défi calcul',
        'description' => 'Tout le calcul mental du collège.',
        'url' => null,
        'ancre' => null,
        'disponible' => false,
        'cles' => [],
        'mots' => [],
        'motifs' => [],
        'compteur' => null,
    ],
    'automatismes' => [
        'nom' => 'Automatismes',
        'description' => "S'entraîner aux automatismes, sans calculatrice.",
        'url' => null,
        'ancre' => null,
        'disponible' => false,
        // Pas encore d'appli : rien n'est accepté. À déclarer avec l'appli.
        'cles' => [],
        'mots' => [],
        'motifs' => [],
        'compteur' => null,
    ],
    'splat-equations' => [
        'nom' => 'Splat ! Équations',
        'description' => 'Trouver le nombre caché sous la tache.',
        'url' => null,
        'ancre' => null,
        'disponible' => false,
        'cles' => [],
        'mots' => [],
        'motifs' => [],
        'compteur' => null,
    ],
    'soley' => [
        'nom' => 'Solèy',
        'description' => 'Les fractions avec des rayons de soleil.',
        'url' => null,
        'ancre' => null,
        'disponible' => false,
        'cles' => [],
        'mots' => [],
        'motifs' => [],
        'compteur' => null,
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

function appli_affichable(string $cle): array
{
    $appli = ['cle' => $cle];
    foreach (CHAMPS_AFFICHES_APPLI as $champ) {
        $appli[$champ] = CATALOGUE_APPLIS[$cle][$champ] ?? null;
    }
    return $appli;
}

// D'abord les activités de la classe — celles que l'élève peut vraiment ouvrir,
// dans l'ordre choisi par son professeur. Puis, pour TOUT LE MONDE, celles que
// le catalogue annonce sans les avoir ouvertes, dans l'ordre du catalogue.
//
// Une activité « bientôt » est une annonce, pas une attribution : elle n'a pas
// d'adresse, donc rien à ouvrir, et la liste de la classe garde entièrement la
// main sur ce qui est accessible. C'est ce qui permet à un élève de voir ce qui
// se prépare sans que le professeur ait à cocher quoi que ce soit — et le jour
// où l'activité s'ouvre, elle disparaît d'ici : elle n'apparaît plus que dans
// les classes qui l'ont dans leur liste.
function applis_de_classe(string $liste): array
{
    $sortie = [];
    $vues = [];
    foreach (explode(',', $liste) as $cle) {
        $cle = trim($cle);
        if (!appli_connue($cle) || isset($vues[$cle])) continue;
        $vues[$cle] = true;
        $sortie[] = appli_affichable($cle);
    }
    foreach (CATALOGUE_APPLIS as $cle => $appli) {
        if (isset($vues[$cle]) || ($appli['disponible'] ?? false)) continue;
        $sortie[] = appli_affichable((string)$cle);
    }
    return $sortie;
}
