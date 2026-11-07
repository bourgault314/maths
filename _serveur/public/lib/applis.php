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
        // Lot « Les records » (09/10/2026) : ce qu'un professeur règle pour
        // SA classe — « records » (booléen) : les Légendes des tables de la
        // classe voient le concours de temps et y apparaissent. Par défaut
        // oui : rien n'est écrit ; seul « false » est rangé
        // ({"defi-tables": {"records": false}}). Voir reglages_recus().
        'reglages' => ['records' => true],
    ],
    // Coffres magiques, version SOLO (lot « Coffres magiques sur le suivi »,
    // 21/10/2026, pour un professeur des écoles qui la teste avec ses élèves ;
    // le duo reste hors du suivi). Juste après Défi tables : c'est l'ordre des
    // tuiles chez l'élève. Une ligne par élève, écrite par le moteur
    // assets/js/coffres-parcours.js (copie dans prof/) — rien que des nombres,
    // des booléens et des dates :
    //   { version, epoque,
    //     niveaux: { "1": {tresors, parfaits}, "2", "3" }   — par niveau, les
    //              trésors ouverts et, parmi eux, les PARFAITS (sans erreur ni
    //              solution montrée) ; le motif /^[1-3]$/ accepte ces clés ;
    //     operations: { sum | difference | product | quotient :
    //              {cles, aides, solutions, erreurs} }       — par opération, les
    //              CLÉS gagnées, les aides ouvertes, les solutions montrées,
    //              les erreurs (jamais les calculs) ;
    //     dernier: le jour du dernier trésor ;
    //     partie:  la partie en cours — niveau, ops (numéros 1 à 4), serie (les
    //              dix opérations), familles (dix booléens), cles (0 à 10),
    //              parfait, jour — pour reprendre à 6 clés sur 10 sur
    //              n'importe quel appareil. }
    // Un test compare ces listes à CLES_SERVEUR et MOTIF_NIVEAUX_PHP du moteur.
    'coffres' => [
        'nom' => 'Coffres magiques',
        'description' => 'Trouve les deux nombres qui ouvrent le coffre.',
        'url' => 'https://mathsgo.re/outils/calcul_mental/coffres_magiques_solo.html',
        'ancre' => null,
        'disponible' => true,
        'cles' => ['version', 'epoque', 'niveaux', 'tresors', 'parfaits', 'operations',
            'sum', 'difference', 'product', 'quotient', 'cles', 'aides', 'solutions', 'erreurs',
            'dernier', 'partie', 'niveau', 'ops', 'serie', 'familles', 'parfait', 'jour'],
        'mots' => [],
        'motifs' => ['/^[1-3]$/'],
        // « Revenir à… » nomme une version par ce compte : les niveaux
        // commencés (le serveur ne sait compter que des entrées).
        'compteur' => 'niveaux',
        // Ce qu'un professeur règle pour SA classe (⚙ Réglages) : les niveaux
        // accessibles (1 à 3) et les opérations accessibles (1 à 4, dans
        // l'ordre addition, soustraction, multiplication, division). Comme les
        // mondes de SPLAT! : la liste des numéros OUVERTS ; tout ouvert = rien
        // d'écrit ({"coffres": {"niveaux": [1, 2], "operations": [1, 3]}}).
        'reglages' => ['niveaux' => 3, 'operations' => 4],
    ],
    // Anzan (lot « Qui voit quoi », lot 4a, 23/10/2026 — l'appli de Flash
    // Anzan / Colonne du soroban, faite pour une élève et donnée élève par
    // élève depuis « Ce que voit… » : fermée par défaut pour toute classe, un
    // professeur peut aussi l'ouvrir à une classe entière). Après Coffres :
    // les applis de calcul mental ensemble, dans l'ordre du catalogue du site.
    // Une ligne par élève, écrite par le moteur
    // outils/calcul_mental/flash_anzan_parcours.js (copie dans prof/) — rien
    // que des nombres, des dates et des mots d'une liste fermée :
    //   { version, epoque,
    //     reglages: { mode, flash: {operations, chiffresMin, chiffresMax,
    //                nombres, temps, calculs, son}, colonne: {…, limite, calculs} }
    //                — les derniers réglages de l'élève, qui le suivent d'un
    //                appareil à l'autre ;
    //     seances:  { "1": [jour, mode, operations, chiffresMin, chiffresMax,
    //                nombres, temps, calculs prévus, calculs faits, score], … }
    //                — une séance = une LISTE de dix scalaires (une seule clé
    //                comptée par séance) ; le motif accepte ses numéros ; une
    //                séance arrêtée en route a moins de calculs faits que
    //                prévus. Les 500 dernières sont gardées par le moteur. }
    // Rien d'autre n'arrive : ni heure, ni calculs posés, ni réponses. Un test
    // compare ces listes à CLES_SERVEUR, MOTS_SERVEUR et MOTIF_SEANCES_PHP du
    // moteur ; tests/parcours-reference-anzan.json ressort identique du filtre.
    'flash-anzan' => [
        'nom' => 'Anzan',
        'description' => 'Le calcul mental du soroban, en Flash ou en Colonne.',
        'url' => 'https://mathsgo.re/outils/calcul_mental/flash_anzan.html',
        'ancre' => null,
        'disponible' => true,
        'cles' => ['version', 'epoque', 'reglages', 'rang', 'mode', 'flash', 'colonne',
            'operations', 'chiffresMin', 'chiffresMax', 'nombres', 'temps', 'limite', 'calculs', 'son', 'seances', 'gradeReussi', 'gradeColonne'],
        // « grade » et « entrainement » : les séances des grades (lot
        // « grades », 07/11/2026) ; « gradeReussi » : le plus haut grade réussi.
        'mots' => ['flash', 'colonne', 'plus', 'plusmoins', 'aucun', 'bip', 'grade', 'entrainement'],
        'motifs' => ['/^[1-9]\d{0,3}$/'],
        // « Revenir à… » nomme une version par ce compte : les séances
        // (le serveur ne sait compter que des entrées).
        'compteur' => 'seances',
        // Pas de réglage de classe : ouvert ou non, c'est tout (décision du
        // 22/10/2026 : pas de réglage personnalisé par élève dans une appli).
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
    // Défi calcul (lot 2b, 31/10/2026) : le serveur apprend l'appli. Une ligne
    // par élève, version 2 (lot 3) :
    //   { version, epoque, prenom, modules: { A2: { vu, ok, b, e, a, f, x, t,
    //     c: { "2": 1 } } }, seance: { jour, etape, n, p }, seances, jours }
    // — des entiers (boîtes, compteurs, le plan de la séance), des dates et
    // des listes de dates, null. Les clés de « modules » sont les 74 codes de
    // la carte v2 (defi_calcul_mon_parcours.js, NIVEAUX ; un test les compare),
    // les clés de « c » les numéros de cause (1 à 12). Aucun mot : le format n'a
    // pas de texte. Le prénom part vide et le serveur le retire. Aucun calcul
    // en clair, aucune réponse : l'exemple d'une erreur se regénère depuis la
    // fiche du module. Les bornes de chaque champ (x de 0 à 3, b de 0 à 7
    // depuis le lot F1 — 5 avant…) sont celles du moteur, qui renormalise
    // tout ce qu'il relit. Le plan de la séance « p » a 7 nombres depuis le
    // lot F1 (5 avant) : rien à déclarer, c'est une liste d'entiers.
    // Pire cas (74 modules, toutes les compétences entrées, 12 causes) :
    // 1 639 clés, 21 107 octets avant le lot G1 ; 1 795 clés, 28 853 octets
    // depuis (les deux dates de chaque compétence, le journal des 60
    // séances, `j` à six nombres) — bornes du serveur : 2 000 / 40 000.
    // Garde-fou : tests/parcours-reference-defi-calcul.json, généré par
    // scripts/generer-parcours-reference-defi-calcul.mjs --ecrire.
    'defi-calcul' => [
        'nom' => 'Défi calcul',
        'description' => 'Tout le calcul mental du collège.',
        'url' => 'https://mathsgo.re/outils/calcul_mental/defi_calcul_modules.html',
        'ancre' => null,
        'disponible' => true,
        // Lot G1 « journal + accueil » (07/11/2026) : `d` et `s` (les deux
        // dates d'une compétence, des listes de dates ou null), `j` (ce que
        // la séance ouverte a fait, une liste d'entiers) et `journal` (six
        // listes d'entiers alignées sur `seances`, -1 = pas connu).
        'cles' => ['version', 'epoque', 'prenom', 'modules', 'vu', 'ok', 'b', 'e', 'a', 'f', 'x', 't', 'd', 's', 'c',
            'seance', 'jour', 'etape', 'n', 'p', 'j', 'seances', 'journal', 'calculs', 'justes', 'nouveautes', 'prouvees',
            'rouges', 'minutes', 'jours'],
        'mots' => [],
        'motifs' => ['/^(?:A1|A10|A11|A2|A3|A4|A5|A6|A7|A8|A9|M4|M1|M2|M3|M5|M6|M13|M7|M8|M9|M10|M11|M12|C1|C3|C4|D1|D2|D3|D4|D5|D6|D7|D8|D9|F2|F1|F3|F4|F5|F6|F8|F9|F11|D10|D11|D12|D13|D14|D15|F7|F10|F12|F13|P1|P2|P3|P4|R1|R2|R3|R4|R5|R6|X1|X2|X3|X4|X5|X6|X7|C2|C5)$/', '/^\d{1,2}$/'],
        // « Revenir à… » nomme une version par ce compte : les séances finies
        // (une liste de dates, 60 au plus).
        'compteur' => 'seances',
        // Lot F1 « rythme » (07/11/2026, décision de Gwenaël) : ce qu'un
        // professeur règle pour SA classe — « nouveautes », le nombre de
        // choses nouvelles par séance, UN NOMBRE de 1 à 3 (déclaré
        // ['de' => 1, 'a' => 3] : le premier est le défaut). 1 = rien d'écrit ;
        // sinon {"defi-calcul": {"nouveautes": 2}}. Voir reglages_recus().
        // Pas par élève (lot F2, plus tard) : un nombre ne se donne pas
        // « en plus » comme un monde ; listes_declarees() ne le voit pas.
        'reglages' => ['nouveautes' => ['de' => 1, 'a' => 3]],
        // Lot F1 « rythme » (07/11/2026, relecture de Codex) : la version la
        // plus basse qu'on accepte À L'ÉCRITURE (api/parcours.php). Une page
        // d'avant F1 (version 3), restée ouverte dans un onglet, lirait une
        // boîte 6 ou 7 comme « pas entrée » et tronquerait le plan de la
        // séance : son envoi est refusé (400), elle garde son travail dans
        // l'appareil, et la page rechargée le renverra, fusionné. La lecture
        // n'est pas touchée. SI UN JOUR ON REVIENT EN ARRIÈRE sur le moteur de
        // Défi calcul, il faut aussi revenir en arrière ici.
        // Lot G1 « journal + accueil » (07/11/2026) : 5. Une page de version 4
        // ne connaît ni le journal ni les dates des compétences : relue puis
        // renvoyée, sa progression les effacerait.
        'version_min' => 5,
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
    // Échauffement du monde 6 (14/10/2026) : ech1, ech2, ech3, avant m4e1.
    'splat' => [
        'nom' => 'SPLAT!',
        'description' => 'Six mondes de taches et de jetons, étape par étape.',
        'url' => 'https://mathsgo.re/outils/splat_univers.html',
        'ancre' => null,
        'disponible' => true,
        'cles' => ['version', 'epoque', 'etapes', 'fait', 'etoiles', 'cartes', 'vues', 'essais', 'date', 'idx'],
        'mots' => [],
        'motifs' => ['/^(?:m1e1|m1e2|m1e3|m1e4|m1e5|m1e6|m2e1|m2e4|m2e5|enq10|enq11|enq12|enq13|enq14|enq15|enq16|enq17|enq18|enq19|enq20|enq21|enq22|enq23|enq24|sys25|sys26|sys27|sys28|m3e1|m3e2|m3e4|ech1|ech2|ech3|m4e1|m4e2|m4e3|m4e4|m4e5|m4e6|enq11d|enq12d|enq13d|enq16d|enq17d|enq18d|enq20d|enq22d|enq19d|enq24d|sys25d|sys26d|sys27d|sys28d)$/'],
        // « Revenir à… » nomme une version par ce compte : les étapes
        // commencées, Bonus compris (lib/versions.php).
        'compteur' => 'etapes',
        // Lot « splat-suivi-5 » (08/10/2026) : ce qu'un professeur peut régler
        // pour SA classe — les mondes ouverts (1 à 6, ceux de la carte des
        // mondes ; un test compare ce nombre à la carte du moteur). Par défaut,
        // tous : rien n'est écrit. Voir reglages_recus() plus bas.
        'reglages' => ['mondes' => 6],
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

// ------------------------------------------------------- réglages d'une classe
//
// Lot « splat-suivi-5 » (08/10/2026, demande de Gwenaël : « à certaines
// classes, je veux ouvrir que les deux premiers mondes et après ouvrir le
// reste »). Une classe peut porter, par activité, ce que le catalogue déclare
// dans « reglages » — aujourd'hui une seule chose : les mondes de SPLAT!
// ouverts à la classe. Rangé dans classes.reglages (JSON) :
//
//     {"splat": {"mondes": [1, 2]}}
//
// La liste est celle des mondes OUVERTS. Tous ouverts = rien d'écrit : c'est
// l'état de toutes les classes tant que leur professeur ne choisit rien. Le
// serveur ne garde que des entiers de 1 à N, triés, sans doublon, au moins un.
//
// Un monde fermé l'est pour l'élève qui passe par son espace (la carte et les
// outils lisent la liste sous son code). Sur mathsgo.re sans code, tout reste
// ouvert : ça guide la classe, ça ne verrouille rien.

// La colonne classes.reglages existe-t-elle ? Elle arrive par migrer.php. Tant
// qu'elle manque, tout se lit « tous les mondes ouverts » et seul le choix des
// mondes répond « mise à niveau à faire » : rien d'autre ne tombe en panne si
// la migration est oubliée. Une requête par appel de page, gardée ensuite.
function reglages_disponibles(PDO $pdo): bool
{
    static $vu = [];
    $cle = spl_object_id($pdo);
    if (!array_key_exists($cle, $vu)) $vu[$cle] = colonne_existe($pdo, 'classes', 'reglages');
    return $vu[$cle];
}

// Les mots des messages, réglage par réglage : un réglage déclaré par un
// ENTIER est une liste de numéros ouverts (1 à N) — les mondes de SPLAT!,
// puis, depuis le lot « Coffres magiques sur le suivi » (21/10/2026), les
// niveaux et les opérations de Coffres magiques.
const LIBELLES_LISTES = [
    'mondes' => ['illisible' => "Liste de mondes illisible.", 'inconnu' => "Monde inconnu.",
        'dernier' => "Une classe garde au moins un monde ouvert."],
    'niveaux' => ['illisible' => "Liste de niveaux illisible.", 'inconnu' => "Niveau inconnu.",
        'dernier' => "Une classe garde au moins un niveau ouvert."],
    'operations' => ['illisible' => "Liste d'opérations illisible.", 'inconnu' => "Opération inconnue.",
        'dernier' => "Une classe garde au moins une opération ouverte."],
];

function libelle_liste(string $nom, string $cas): string
{
    return LIBELLES_LISTES[$nom][$cas] ?? LIBELLES_LISTES['mondes'][$cas];
}

// Une liste de numéros ouverts, propre : null quand ils le sont TOUS (rien à
// garder). Lecture indulgente (ce qui sort de la base) : un élément faux est
// ignoré.
function liste_lue(mixed $liste, int $nombre): ?array
{
    if (!is_array($liste)) return null;
    $numeros = [];
    foreach ($liste as $numero) {
        if (is_int($numero) && $numero >= 1 && $numero <= $nombre) $numeros[$numero] = $numero;
    }
    if ($numeros === [] || count($numeros) === $nombre) return null;
    ksort($numeros);
    return array_values($numeros);
}

// L'ancien nom, gardé : les mondes de SPLAT! sont une liste comme les autres.
function mondes_lus(mixed $liste, int $nombre): ?array
{
    return liste_lue($liste, $nombre);
}

// Les réglages d'une classe tels qu'on les relit de la base : seulement ce que
// le catalogue déclare, et — si on la donne — seulement pour les activités de
// la liste de la classe (l'élève ne reçoit rien d'une activité qu'il n'a pas).
function reglages_lus(?string $json, ?array $applis = null): array
{
    if ($json === null || $json === '') return [];
    $brut = json_decode($json, true);
    if (!is_array($brut)) return [];
    $sortie = [];
    foreach ($brut as $cle => $reglageBrut) {
        if (!is_string($cle) || !appli_connue($cle) || !is_array($reglageBrut)) continue;
        $declares = CATALOGUE_APPLIS[$cle]['reglages'] ?? [];
        if ($declares === []) continue;
        if ($applis !== null && !in_array($cle, $applis, true)) continue;
        $reglage = [];
        foreach ($declares as $nom => $defaut) {
            // Une liste de numéros ouverts (les mondes de SPLAT!, les niveaux
            // et les opérations de Coffres magiques) : rien quand tout l'est.
            if (is_int($defaut)) {
                $liste = liste_lue($reglageBrut[$nom] ?? null, $defaut);
                if ($liste !== null) $reglage[$nom] = $liste;
            }
            // Un réglage booléen (lot « Les records ») : seul « false » est
            // gardé, « true » est le défaut et ne s'écrit pas.
            if ($defaut === true && ($reglageBrut[$nom] ?? null) === false) $reglage[$nom] = false;
            // Un nombre (lot F1, les nouveautés de Défi calcul) : un entier
            // dans ses bornes, autre que le défaut ; sinon, le défaut (rien).
            if (est_reglage_nombre($defaut)) {
                $valeur = $reglageBrut[$nom] ?? null;
                if (is_int($valeur) && $valeur > $defaut['de'] && $valeur <= $defaut['a']) $reglage[$nom] = $valeur;
            }
        }
        if ($reglage !== []) $sortie[$cle] = $reglage;
    }
    return $sortie;
}

// Un réglage « nombre » (lot F1) est déclaré ['de' => min, 'a' => max] : deux
// entiers, min ≥ 1, min < max. Le défaut est le plus petit, qui ne s'écrit pas.
function est_reglage_nombre(mixed $declare): bool
{
    return is_array($declare) && array_keys($declare) === ['de', 'a']
        && is_int($declare['de']) && is_int($declare['a']) && $declare['de'] >= 1 && $declare['de'] < $declare['a'];
}

// Ce qu'on renvoie en JSON : toujours un objet (« {} » et non « [] » quand rien
// n'est réglé), pour que la page lise reglages.splat sans se poser de question.
function reglages_json(array $reglages): array|object
{
    return $reglages === [] ? new stdClass() : $reglages;
}

// Les réglages d'une classe par sa ligne de la base (SELECT * : la colonne peut
// manquer tant que migrer.php n'a pas été ouvert).
function reglages_de_classe(array $classe, bool $pourEleve = false): array
{
    $applis = $pourEleve ? explode(',', (string)($classe['applis'] ?? '')) : null;
    return reglages_lus(isset($classe['reglages']) ? (string)$classe['reglages'] : null, $applis);
}

// Ce que le professeur envoie (classes.modifier) : lecture STRICTE. Rien n'est
// deviné ni arrangé en silence — une valeur fausse est refusée avec un message.
// Rend la nouvelle valeur complète de la colonne : les réglages actuels, dans
// lesquels on remplace ceux des activités reçues.
function reglages_recus(mixed $recus, array $actuels): array
{
    if (!is_array($recus) || ($recus !== [] && array_is_list($recus))) {
        throw new InvalidArgumentException("Réglages illisibles.");
    }
    $sortie = $actuels;
    foreach ($recus as $cle => $reglage) {
        $declares = is_string($cle) && appli_connue($cle) ? (CATALOGUE_APPLIS[$cle]['reglages'] ?? []) : [];
        if ($declares === [] || !is_array($reglage) || ($reglage !== [] && array_is_list($reglage))) {
            throw new InvalidArgumentException("Réglage inconnu.");
        }
        foreach (array_keys($reglage) as $nom) {
            if (!array_key_exists($nom, $declares)) throw new InvalidArgumentException("Réglage inconnu.");
        }
        $nouveau = $sortie[$cle] ?? [];
        foreach ($declares as $nom => $defaut) {
            if (!array_key_exists($nom, $reglage)) continue;
            // Une liste de numéros ouverts (mondes, niveaux, opérations) : des
            // entiers de 1 à N, au moins un ; tous = le défaut, rien d'écrit.
            if (is_int($defaut)) {
                $nombre = $defaut;
                $liste = $reglage[$nom];
                if (!is_array($liste) || !array_is_list($liste)) throw new InvalidArgumentException(libelle_liste($nom, 'illisible'));
                $numeros = [];
                foreach ($liste as $numero) {
                    if (!is_int($numero) || $numero < 1 || $numero > $nombre) {
                        throw new InvalidArgumentException(libelle_liste($nom, 'inconnu'));
                    }
                    $numeros[$numero] = $numero;
                }
                if ($numeros === []) throw new InvalidArgumentException(libelle_liste($nom, 'dernier'));
                ksort($numeros);
                if (count($numeros) === $nombre) unset($nouveau[$nom]);
                else $nouveau[$nom] = array_values($numeros);
                continue;
            }
            // Un nombre (lot F1, « nouveautes » de Défi calcul) : un entier
            // dans ses bornes, rien d'autre (ni « 2 » en texte, ni 2.0) ; le
            // plus petit = le défaut, donc rien d'écrit.
            if (est_reglage_nombre($defaut)) {
                $valeur = $reglage[$nom];
                if (!is_int($valeur) || $valeur < $defaut['de'] || $valeur > $defaut['a']) {
                    throw new InvalidArgumentException("Nombre hors des choix.");
                }
                if ($valeur === $defaut['de']) unset($nouveau[$nom]);
                else $nouveau[$nom] = $valeur;
                continue;
            }
            // Les réglages booléens (« records » de Défi tables) : vrai ou
            // faux, rien d'autre ; vrai = le défaut, donc rien d'écrit.
            if ($defaut !== true) continue;
            if (!is_bool($reglage[$nom])) throw new InvalidArgumentException("Réglage illisible.");
            if ($reglage[$nom]) unset($nouveau[$nom]);
            else $nouveau[$nom] = false;
        }
        if ($nouveau === []) unset($sortie[$cle]);
        else $sortie[$cle] = $nouveau;
    }
    return $sortie;
}

// ------------------------------------------- « avant » d'une classe (lot 5b, correctif)
//
// Relecture Codex du 30/10/2026, point 1 : classes.modifier reçoit, comme
// eleves.acces, l'état que la page croit rangé — {applis: [...]} (la liste
// des applis de la classe) et/ou {reglages: {<cle>: {...}}} (les réglages
// de l'appli que la fenêtre règle, tels que tableau les a rendus : « {} »
// quand tout est ouvert). Lecture STRICTE : une forme fausse est refusée
// (400), rien n'est deviné. Rend la forme CANONIQUE, prête à comparer :
// applis dans l'ordre du catalogue (les inconnues ignorées — un vieux nom
// resté dans une ligne ne fait pas un conflit), réglages comme reglages_recus
// les range (listes triées, « tous » = rien, « true » = rien).
function avant_de_classe_recu(mixed $recu): array
{
    if (!is_array($recu) || ($recu !== [] && array_is_list($recu))) {
        throw new InvalidArgumentException("État d'avant illisible.");
    }
    foreach (array_keys($recu) as $cle) {
        if (!in_array($cle, ['applis', 'reglages'], true)) throw new InvalidArgumentException("État d'avant illisible.");
    }
    $sortie = [];
    if (array_key_exists('applis', $recu)) {
        if (!is_array($recu['applis']) || !array_is_list($recu['applis'])) throw new InvalidArgumentException("État d'avant illisible.");
        foreach ($recu['applis'] as $cle) {
            if (!is_string($cle)) throw new InvalidArgumentException("État d'avant illisible.");
        }
        $sortie['applis'] = applis_canoniques($recu['applis']);
    }
    if (array_key_exists('reglages', $recu)) {
        // Les clés d'appli reçues, même celles dont le réglage canonique est
        // vide (« {} » = tout ouvert) : c'est pour ELLES qu'on compare.
        $brut = $recu['reglages'];
        if (!is_array($brut) || ($brut !== [] && array_is_list($brut))) throw new InvalidArgumentException("État d'avant illisible.");
        $sortie['reglages'] = [];
        foreach ($brut as $cle => $reglage) {
            if (!is_string($cle) || !appli_connue($cle)) throw new InvalidArgumentException("État d'avant illisible.");
            if (!is_array($reglage) || ($reglage !== [] && array_is_list($reglage))) throw new InvalidArgumentException("État d'avant illisible.");
            // « {} » : tout ouvert — aussi pour une appli sans réglage (Anzan).
            $canon = $reglage === [] ? [] : reglages_recus([$cle => $reglage], []);
            $sortie['reglages'][$cle] = reglage_canonique($canon[$cle] ?? []);
        }
    }
    return $sortie;
}

// La liste des applis d'une classe, dans l'ordre du catalogue, sans
// doublon ni inconnue — la même forme pour la page et pour la base.
function applis_canoniques(array $liste): array
{
    $sortie = [];
    foreach (array_keys(CATALOGUE_APPLIS) as $cle) {
        if (in_array($cle, $liste, true)) $sortie[] = $cle;
    }
    return $sortie;
}

function reglage_canonique(array $reglage): array
{
    ksort($reglage);
    return $reglage;
}

// La page croit-elle encore ce que la ligne contient ? Comparé sous le
// verrou de la ligne (classes.modifier), seulement sur ce que « avant »
// nomme : la liste des applis si elle est donnée, et, appli par appli, les
// réglages donnés — ceux des autres applis ne comptent pas.
function meme_etat_de_classe(array $avant, array $ligne): bool
{
    if (array_key_exists('applis', $avant)) {
        if ($avant['applis'] !== applis_canoniques(explode(',', (string)($ligne['applis'] ?? '')))) return false;
    }
    if (array_key_exists('reglages', $avant)) {
        $actuels = reglages_de_classe($ligne);
        foreach ($avant['reglages'] as $cle => $reglage) {
            if ($reglage !== reglage_canonique($actuels[$cle] ?? [])) return false;
        }
    }
    return true;
}

// ---------------------------------------------------- ce qu'un élève a EN PLUS
//
// Lot « Qui voit quoi » (22/10/2026, demande de Gwenaël : « ouvrir Anzan à
// une élève, un monde de SPLAT! en plus à quelques-uns »). La règle, décidée
// par lui : ce qu'un élève voit = ce que voit sa classe + ce qu'on lui a donné
// EN PLUS. On n'enlève jamais à un élève ce que sa classe a ; pour un élève on
// ne peut qu'ajouter. Rangé dans eleves.ajouts (JSON, vide pour tout le
// monde au départ) :
//
//     {"coffres": {}}                        Coffres magiques entière, en plus
//     {"splat": {"mondes": [3]}}             le monde 3 de SPLAT! en plus
//     {"coffres": {}, "splat": {"mondes": [3, 4]}}
//
// Une clé = une appli ouverte du catalogue ; « {} » = l'appli entière ; une
// liste (mondes, niveaux, opérations) = ces numéros EN PLUS de ceux de la
// classe — seuls les réglages « liste de numéros » déclarés par l'appli sont
// acceptés, jamais un réglage booléen (les records de Défi tables suivent la
// classe). Un ajout reste rangé même quand la classe finit par avoir la même
// chose (D4) : tant que la classe l'a, il ne se voit pas ; si elle le referme
// un jour, l'élève le garde.
//
// Le serveur CALCULE « classe + ajouts » (acces_de_l_eleve) et le rend à
// l'élève sous les noms qui existent déjà, « applis » et « reglages » : l'espace
// élève, SPLAT!, Défi tables et Coffres n'ont rien à changer, ils reçoivent la
// liste et les mondes de l'élève sans savoir d'où ça vient. Une seule règle,
// ici, testée une fois.

// La colonne eleves.ajouts existe-t-elle ? Elle arrive par migrer.php. Tant
// qu'elle manque, tout se lit « rien en plus » et seule l'action du professeur
// (eleves.acces) répond « mise à niveau à faire » — comme les mondes en 10/2026.
function ajouts_disponibles(PDO $pdo): bool
{
    static $vu = [];
    $cle = spl_object_id($pdo);
    if (!array_key_exists($cle, $vu)) $vu[$cle] = colonne_existe($pdo, 'eleves', 'ajouts');
    return $vu[$cle];
}

// Les réglages « liste de numéros » qu'une appli déclare (ce qui peut se
// donner par élève) : ['mondes' => 6] pour SPLAT!, rien pour Défi tables.
function listes_declarees(string $cle): array
{
    $listes = [];
    foreach (CATALOGUE_APPLIS[$cle]['reglages'] ?? [] as $nom => $defaut) {
        if (is_int($defaut)) $listes[$nom] = $defaut;
    }
    return $listes;
}

// Les applis que le catalogue ouvre vraiment (« disponible » et une adresse) :
// les seules qui puissent être données à une classe ou à un élève.
function appli_ouverte(string $cle): bool
{
    return appli_connue($cle) && (CATALOGUE_APPLIS[$cle]['disponible'] ?? false) && (bool)CATALOGUE_APPLIS[$cle]['url'];
}

// Ce qui sort de la base : lecture INDULGENTE, mais jamais dans le sens de
// l'ouverture. Une appli inconnue ou fermée, un réglage non déclaré sont
// ignorés ; un réglage déclaré qui est PRÉSENT mais illisible (pas une liste,
// liste vide, numéros hors bornes) fait ignorer l'ajout de cette appli EN
// ENTIER — relu par Codex le 22/10/2026 : avant, « {"coffres":{"niveaux":[2],
// "operations":[9]}} » perdait les opérations, que la règle prenait ensuite
// pour « non nommées », donc toutes ouvertes ; une restriction abîmée devenait
// « tout ouvert ». Un réglage absent, lui, reste « non nommé » (T3). Rend
// [cle => []] pour une appli entière, [cle => [nom => [numéros]]] sinon.
function ajouts_lus(?string $json): array
{
    if ($json === null || $json === '') return [];
    $brut = json_decode($json, true);
    if (!is_array($brut)) return [];
    $sortie = [];
    foreach ($brut as $cle => $ajoutBrut) {
        if (!is_string($cle) || !appli_ouverte($cle) || !is_array($ajoutBrut)) continue;
        if ($ajoutBrut === []) { $sortie[$cle] = []; continue; }
        if (array_is_list($ajoutBrut)) continue;
        $ajout = [];
        foreach (listes_declarees($cle) as $nom => $nombre) {
            if (!array_key_exists($nom, $ajoutBrut)) continue;
            $numeros = [];
            foreach (is_array($ajoutBrut[$nom]) ? $ajoutBrut[$nom] : [] as $numero) {
                if (is_int($numero) && $numero >= 1 && $numero <= $nombre) $numeros[$numero] = $numero;
            }
            // Nommé mais illisible : tout l'ajout de cette appli est ignoré.
            if ($numeros === []) continue 2;
            ksort($numeros);
            $ajout[$nom] = array_values($numeros);
        }
        if ($ajout !== []) $sortie[$cle] = $ajout;
    }
    return $sortie;
}

// Ce que le professeur envoie (eleves.acces) : lecture STRICTE, et la valeur
// reçue REMPLACE la colonne entière (la fenêtre « Ce que voit Léa » envoie tout
// son état à chaque clic, comme ⚙ Réglages envoie la liste des mondes) — à
// condition que « avant », lu de la même façon, soit encore ce que la colonne
// contient (memes_ajouts, lot 3c). Rien n'est deviné ni arrangé en silence :
// une valeur fausse est refusée avec un message.
function ajouts_recus(mixed $recus): array
{
    if (!is_array($recus) || ($recus !== [] && array_is_list($recus))) {
        throw new InvalidArgumentException("Ajouts illisibles.");
    }
    $sortie = [];
    foreach ($recus as $cle => $ajout) {
        if (!is_string($cle) || !appli_ouverte($cle)) throw new InvalidArgumentException("Application inconnue.");
        if (!is_array($ajout) || ($ajout !== [] && array_is_list($ajout))) throw new InvalidArgumentException("Ajout illisible.");
        $declares = listes_declarees($cle);
        foreach (array_keys($ajout) as $nom) {
            if (!array_key_exists($nom, $declares)) throw new InvalidArgumentException("Réglage inconnu.");
        }
        // « {} » = l'appli entière. Une liste est rangée telle quelle (triée,
        // sans doublon), même complète : « tous les niveaux » n'est pas
        // « Coffres entière » — les opérations, elles, suivent la classe.
        $nouveau = [];
        foreach ($declares as $nom => $nombre) {
            if (!array_key_exists($nom, $ajout)) continue;
            $liste = $ajout[$nom];
            if (!is_array($liste) || !array_is_list($liste)) throw new InvalidArgumentException(libelle_liste($nom, 'illisible'));
            $numeros = [];
            foreach ($liste as $numero) {
                if (!is_int($numero) || $numero < 1 || $numero > $nombre) {
                    throw new InvalidArgumentException(libelle_liste($nom, 'inconnu'));
                }
                $numeros[$numero] = $numero;
            }
            if ($numeros === []) throw new InvalidArgumentException("Une liste vide n'ajoute rien : retire plutôt l'activité.");
            ksort($numeros);
            $nouveau[$nom] = array_values($numeros);
        }
        $sortie[$cle] = $nouveau;
    }
    return $sortie;
}

// Deux ajouts disent-ils la même chose ? Lot 3c (relecture Codex du 22/10/2026)
// : la page envoie avec chaque clic l'état qu'elle croit rangé (« avant »), et
// le serveur n'écrit que si c'est encore celui de la colonne — sinon un onglet
// en retard rouvrait un monde retiré ailleurs. La comparaison se fait sur la
// forme CANONIQUE : les deux côtés sortent de ajouts_lus() / ajouts_recus()
// (numéros triés, sans doublon, listes vides et applis fermées déjà écartées),
// il ne reste qu'à ranger les clés — l'ordre des applis et des réglages est
// indifférent, « {"splat":{},"coffres":{}} » vaut « {"coffres":{},"splat":{}} ».
function memes_ajouts(array $a, array $b): bool
{
    return ajouts_canoniques($a) === ajouts_canoniques($b);
}

function ajouts_canoniques(array $ajouts): array
{
    ksort($ajouts);
    foreach ($ajouts as &$ajout) ksort($ajout);
    unset($ajout);
    return $ajouts;
}

// Les ajouts en JSON : toujours un objet (« {} » pour « rien », et « {} » pour
// une appli entière — jamais « [] », que la page lirait comme une liste).
function ajouts_json(array $ajouts): object
{
    $objet = new stdClass();
    foreach ($ajouts as $cle => $ajout) {
        $objet->$cle = $ajout === [] ? new stdClass() : $ajout;
    }
    return $objet;
}

// Ce qui s'écrit dans la colonne : NULL quand il n'y a rien en plus.
function ajouts_pour_la_base(array $ajouts): ?string
{
    return $ajouts === [] ? null : json_encode(ajouts_json($ajouts), JSON_UNESCAPED_UNICODE);
}

// LA règle « classe + ajouts », à un seul endroit. Reçoit la ligne de la
// classe (applis, reglages — la colonne peut manquer) et la colonne ajouts de
// l'élève (peut manquer aussi : null). Rend ['applis' => [...clés, dans
// l'ordre du catalogue], 'reglages' => [...]] :
//
//  1. applis = les applis ouvertes de la classe ∪ les clés des ajouts ;
//  2. pour chaque appli du résultat et chaque réglage « liste » qu'elle
//     déclare, ouverts pour l'élève = ouverts par la classe ∪ la liste de
//     l'ajout, où « ouverts par la classe » = sa liste (ou tous si rien n'est
//     écrit) si la classe a l'appli, aucun sinon. Un ajout « {} » (l'appli
//     entière) ouvre tout ; une appli qui ne vient que d'un ajout ouvre tout
//     ce que l'ajout ne nomme pas (un ajout n'a jamais rien fermé).
//     « Tous » = rien d'écrit dans reglages, la convention d'aujourd'hui.
//  3. Les réglages booléens (records) et les nombres (les nouveautés de
//     Défi calcul, lot F1) suivent la classe telle quelle.
function acces_de_l_eleve(array $classe, ?string $ajoutsJson): array
{
    $clesClasse = array_column(applis_de_classe((string)($classe['applis'] ?? '')), 'cle');
    $reglagesClasse = reglages_de_classe($classe, true);
    $ajouts = ajouts_lus($ajoutsJson);
    $applis = [];
    $reglages = [];
    foreach (array_keys(CATALOGUE_APPLIS) as $cle) {
        $parClasse = in_array($cle, $clesClasse, true);
        $parAjout = array_key_exists($cle, $ajouts);
        if (!$parClasse && !$parAjout) continue;
        $applis[] = $cle;
        $reglage = [];
        foreach (listes_declarees($cle) as $nom => $nombre) {
            // null = tous ; une liste = ceux-là seulement.
            $ouverts = $parClasse ? ($reglagesClasse[$cle][$nom] ?? null) : [];
            if ($parAjout) {
                $ajout = $ajouts[$cle];
                if ($ajout === []) $ouverts = null;
                elseif (!array_key_exists($nom, $ajout)) $ouverts = $parClasse ? $ouverts : null;
                elseif ($ouverts !== null) $ouverts = liste_lue(array_merge($ouverts, $ajout[$nom]), $nombre);
            }
            if ($ouverts !== null && $ouverts !== []) $reglage[$nom] = $ouverts;
        }
        foreach ($reglagesClasse[$cle] ?? [] as $nom => $valeur) {
            if (is_bool($valeur) || is_int($valeur)) $reglage[$nom] = $valeur;
        }
        if ($reglage !== []) $reglages[$cle] = $reglage;
    }
    return ['applis' => $applis, 'reglages' => $reglages];
}

// Ce que le professeur reçoit pour chaque élève (tableau, eleves.acces) : les
// clés et les réglages calculés — ni code ni donnée d'élève.
function acces_json(array $acces): array
{
    return ['applis' => $acces['applis'], 'reglages' => reglages_json($acces['reglages'])];
}
