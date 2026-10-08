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
        // Lot « dosage + validation » (19/09/2026) : « fois », par table, le
        // nombre de fois où chaque activité de J'apprends et chaque
        // entraînement ont été faits (ses sous-clés sont les noms déjà
        // déclarés : beads … random, desordre, trous, mixte).
        // Lot « Ma séance du jour » (lot 1, 02/10/2026) : par table, « bouts »
        // (les multiplicateurs hors grille déjà réussis : une liste d'entiers),
        // « seance » (« depart », la marche où commence la prochaine séance, et
        // « n », le nombre de séances qui l'ont déplacée) et « sansFaute » (ses
        // sous-clés « desordre » et « trous » sont déjà déclarées) ; au niveau
        // du parcours, « seances » (une liste de dates : le jour de chaque
        // séance finie).
        // Lot M1 de l'optimisation (03/10/2026) : au niveau du parcours,
        // « enCours », la séance du jour commencée et pas finie, pour qu'elle
        // se reprenne sur un autre appareil. Rien que des nombres, des
        // booléens et une date : « jour », « table », « echelle », « file » et
        // « faites » (des listes d'entiers : un code par étape), « erreurs »
        // (les calculs ratés, 407 pour 4 × 7), « rate », « remplacee »,
        // « reparee », « prete » ; « depart », « rang » et « sansFaute » sont
        // déjà déclarées.
        // Lot « retouches après Mon parcours » (04/10/2026) : au niveau du
        // parcours, « retenir », la liste « À retenir » du jour (les calculs
        // ratés de mémoire dans les séances d'aujourd'hui) — « jour » et
        // « erreurs » (407 pour 4 × 7) sont déjà déclarées.
        // Lot « un seul système, les boîtes » (05/10/2026) : au niveau du
        // parcours, « calculsDuJour » (le jour où Mes calculs du jour a été
        // joué : une date) ; dans « melange », « reussi » (le nombre de tables
        // du plus grand mélange réussi : un entier) — « score » et « dernier »
        // sont déjà déclarées.
        'cles' => ['version', 'epoque', 'tables', 'apprends', 'beads', 'construct', 'gaps', 'ordered', 'random',
            'entraine', 'desordre', 'trous', 'mixte', 'dernier', 'entrainement', 'score', 'total', 'fois',
            'bouts', 'seance', 'depart', 'n', 'sansFaute', 'seances',
            'enCours', 'jour', 'table', 'echelle', 'file', 'faites', 'erreurs', 'rate', 'remplacee', 'reparee', 'prete',
            'retenir', 'calculsDuJour', 'reussi',
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
    // Les entrées qui suivent, SPLAT! excepté, ne sont PAS ouvertes : l'appli
    // ne sait pas encore parler au serveur (« disponible » à false, « url » à
    // null). Depuis le lot « retours de classe » (06/10/2026), elles ne
    // s'affichent plus du tout dans l'espace élève (plus de pastille « Bientôt »).
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
    // L'univers SPLAT! (lot « splat-suivi-3 », 07/10/2026), à la place de
    // « splat-equations », qui n'avait jamais servi : l'élève arrive sur la
    // carte des mondes, qui ouvre les trois outils. Une ligne par élève :
    // { version, epoque, etapes: { <parcours>: { fait, etoiles, cartes, vues,
    // essais, date, idx } } } — rien que des nombres, des booléens et des
    // dates. Les parcours acceptés sont la liste fermée de la carte
    // (assets/js/splat-etapes.js, recopiée dans assets/js/splat-parcours.js) :
    // le motif est celui que rend motifPhp() du moteur, un test le compare.
    // Tant qu'aucune classe n'a « splat » dans sa liste, personne ne le voit.
    'splat' => [
        'nom' => 'SPLAT!',
        'description' => 'Six mondes de taches et de jetons, étape par étape.',
        'url' => 'https://mathsgo.re/outils/splat_univers.html',
        'ancre' => null,
        'disponible' => true,
        'cles' => ['version', 'epoque', 'etapes', 'fait', 'etoiles', 'cartes', 'vues', 'essais', 'date', 'idx'],
        'mots' => [],
        'motifs' => ['/^(?:m1e1|m1e2|m1e3|m1e4|m1e5|m1e6|m2e1|m2e4|m2e5|enq10|enq11|enq12|enq13|enq14|enq15|enq16|enq17|enq18|enq19|enq20|enq21|enq22|enq23|enq24|sys25|sys26|sys27|sys28|m3e1|m3e2|m3e4|m4e1|m4e2|m4e3|m4e4|m4e5|m4e6|enq11d|enq12d|enq13d|enq16d|enq17d|enq18d|enq20d|enq22d|enq19d|enq24d|sys25d|sys26d|sys27d|sys28d)$/'],
        // « Revenir à… » nomme une version par ce compte : les étapes
        // commencées, Bonus compris (lib/versions.php).
        'compteur' => 'etapes',
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

// Les activités de la classe — celles que l'élève peut vraiment ouvrir, dans
// l'ordre choisi par son professeur. Rien d'autre.
//
// Lot « retours de classe » (06/10/2026, décision de Gwenaël) : plus
// d'annonces « Bientôt ». Jusqu'ici, les activités que le catalogue annonce
// sans les avoir ouvertes suivaient, pour tout le monde ; elles restent au
// catalogue (prêtes pour le jour où elles s'ouvrent), mais un élève ne voit
// une appli que lorsqu'elle existe. Une activité pas encore ouverte, même
// inscrite dans la liste d'une classe, n'est pas montrée.
function applis_de_classe(string $liste): array
{
    $sortie = [];
    $vues = [];
    foreach (explode(',', $liste) as $cle) {
        $cle = trim($cle);
        if (!appli_connue($cle) || isset($vues[$cle])) continue;
        $vues[$cle] = true;
        if (!(CATALOGUE_APPLIS[$cle]['disponible'] ?? false) || !CATALOGUE_APPLIS[$cle]['url']) continue;
        $sortie[] = appli_affichable($cle);
    }
    return $sortie;
}
