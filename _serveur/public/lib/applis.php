<?php
// Catalogue des applis proposables aux classes.
// Une seule copie de chaque appli : on ouvre celle de mathsgo.re en lui
// passant un billet d'entrée dans l'adresse (#b=…, lib/billets.php) — jamais
// le code lui-même, qui entrerait dans l'historique du navigateur.

declare(strict_types=1);

require_once __DIR__ . '/cours.php';

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
            'calculs', 'boite', 'cases', 'vu', 'erreur', 'gagne', 'echeance',
            'journal', 'etapes', 'justes', 'test', 'numero',
            'horsSeance', 'fait'],
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
        // Lot S1 « les journaux » (07/11/2026, chantier « Suivre ses
        // élèves ») : le journal des séances — `journal`, six listes
        // d'entiers alignées sur `seances` (`table`, `etapes`, `calculs`,
        // `justes`, `test`, et `numero`, le numéro de la séance qui la fait
        // reconnaître d'un appareil à l'autre ; -1 = pas connu ; pas de temps
        // passé, décision de Gwenaël du 07/11/2026). Version 4 du
        // moteur : la version la plus basse qu'on accepte À L'ÉCRITURE
        // (api/parcours.php), comme pour Défi calcul. Une page de version 3
        // restée ouverte ne connaît pas le journal : relue puis renvoyée, sa
        // progression l'effacerait. Son envoi est refusé (400), elle garde son
        // travail dans l'appareil, et la page rechargée le renverra, fusionné.
        // La lecture n'est pas touchée. SI UN JOUR ON REVIENT EN ARRIÈRE sur le
        // moteur, il faut aussi revenir en arrière ici. Le pire cas (toutes
        // les tables, les 36 calculs, 60 séances au journal plein, une séance
        // en cours pleine) : sous 2 000 clés et 40 000 octets
        // (tests/suivi-journaux-s1.test.mjs).
        // Lot « le jour vert » (11/11/2026, chantier « Suivre ses élèves ») :
        // le travail fait depuis l'accueil, sans séance — `horsSeance`, trois
        // listes alignées : `jours` (des dates), `table` (0 à 10) et `fait`
        // (des drapeaux, 1 à 63 : Mes calculs du jour, entraînement, test
        // réussi, test pas encore, Mon mélange, J'apprends) ; les 60 plus récentes. Ni
        // heure, ni temps passé, ni calcul. Version 5 du moteur : une page de
        // version 4 l'effacerait en renvoyant la progression, son envoi est
        // refusé (400) ; la page rechargée renvoie tout, fusionné.
        'version_min' => 5,
    ],
    // Coffres magiques, version SOLO (lot « Coffres magiques sur le suivi »,
    // 21/10/2026, pour un professeur des écoles qui la teste avec ses élèves ;
    // le duo reste hors du suivi). Juste après Défi tables : c'est l'ordre des
    // tuiles chez l'élève. Une ligne par élève, écrite par le moteur
    // assets/js/coffres-parcours.js (copie dans prof/) — rien que des nombres,
    // des booléens et des dates :
    //   { version, epoque,
    //     niveaux: { "1": {tresors, parfaits, gloubi, cran}, "2", "3" } — par
    //              niveau, les trésors ouverts et, parmi eux, les PARFAITS (sans
    //              erreur ni solution montrée) ; le motif /^[1-3]$/ accepte ces
    //              clés ; lot « le chemin des coffres et le cadeau Gloubi »
    //              (09/11/2026) : après le coffre d'or (3 trésors), les matchs
    //              contre Gloubi JOUÉS (1 à 3) et le Gloubi du suivant (cran 1
    //              à 4) ;
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
            'dernier', 'partie', 'niveau', 'ops', 'serie', 'familles', 'parfait', 'jour', 'jours', 'journal', 'depuis',
            'gloubi', 'cran'],
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
        // Lot S1 « les journaux » (07/11/2026) : le journal des jours joués —
        // `jours` (les 60 derniers, des dates), `journal` (quatre listes
        // d'entiers alignées : `tresors`, `parfaits`, `aides`, `solutions` ;
        // -1 = pas connu) et `depuis` (le premier jour du journal). Version 2
        // du moteur, et la même garde que Défi calcul et Défi tables : une
        // page de version 1 effacerait le journal en renvoyant la progression,
        // son envoi est refusé (400). SI UN JOUR ON REVIENT EN ARRIÈRE sur le
        // moteur, il faut aussi revenir en arrière ici.
        // Version 3 (lot « coffres-chemin-gloubi », 11/11/2026) : `gloubi` et
        // `cran` ; une page de version 2 les effacerait en renvoyant le
        // parcours (elle rendrait des matchs déjà joués) : refusée.
        // Version 4 (lot « le jour vert », 11/11/2026) : une cinquième liste
        // au journal, `cles` (les clés gagnées ce jour-là, la clé est déjà
        // déclarée) ; une page de version 3 l'effacerait : refusée.
        'version_min' => 4,
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
            'operations', 'chiffresMin', 'chiffresMax', 'nombres', 'temps', 'limite', 'calculs', 'son', 'seances', 'etapeFlash', 'etapeColonne'],
        // « grade » et « entrainement » : les séances des grades. Barème
        // révisé (22/11/2026) : « etapeFlash » et « etapeColonne » gardent le
        // rang de la plus haute étape réussie (1 … 65, 1 … 26 — les bornes
        // sont celles du moteur, NB_ETAPES_FLASH et NB_ETAPES_COLONNE ; le
        // serveur borne tout entier à 1 000 000). « gradeReussi » et
        // « gradeColonne » de l'ancienne grille ne sont plus acceptés : une
        // clé inconnue est retirée, jamais rejetée (lib/progression.php).
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
        // Lot 4 « les ceintures » (14/11/2026) : `ceintures` (quatre dates ou
        // null, une par palier : les ceintures gagnées).
        // Lot F4 « personne ne reste bloqué » (18/11/2026) : `ar` (un
        // J'apprends arrêté, une liste d'entiers : 3 × les arrêts + la
        // reprise) et `paliers` (quatre dates ou null : les tests de palier
        // joués). L'échéance `e` d'une compétence pas entrée peut porter le
        // jour où un niveau « à voir en classe » revient (une date, ou null).
        // Lot 1 « la séance » (12/11/2026) : `l` (le « lent » d'une
        // compétence, une liste de 0 et de 1) ; le plan `p` passe à 11 nombres
        // (rien à déclarer : une liste d'entiers).
        // Lot K1 « la carte chez l'élève » (25/11/2026), version 12 : par
        // étoile, `r` (les « Je tente » ratés), `q` (le jour du dernier),
        // `pe` (combien de fois perdue), `g` (son compteur, qui départage
        // deux appareils) ; `ok`, `f`, `t` et `l` ont disparu. La séance :
        // `i` (son identité) et `g` (son compteur). Le journal : `seuls`,
        // `seulsJustes`, `tests`, `testsRates`. `quarts` (le remplissage
        // des ceintures à ne pas faire reculer).
        // Correctif K1 (26/11/2026, relecture de Codex) : `prenom` n'est plus
        // une clé — c'est le prénom d'un visiteur SANS code, qui reste sur
        // son appareil ; la page ne l'envoie pas, et une date glissée là
        // (« 2026-11-26 » passait pour une valeur permise) n'est plus gardée.
        // `parts` : ce que chaque onglet a fait dans la séance ouverte (onze
        // nombres par onglet : sa source, puis ses dix comptes).
        // Lot K1b (26/11/2026), version 13 : aucune clé de plus — les listes
        // par étoile de six modules s'allongent, `ceintures`, `paliers` et
        // `quarts` ont six places (une liste ne compte pas dans les clés : le
        // pire cas reste à 1 954 clés ; 35 972 octets, 670 de plus).
        'cles' => ['version', 'epoque', 'modules', 'vu', 'b', 'e', 'a', 'x', 'r', 'q', 'pe', 'd', 's', 'ar', 'g', 'c',
            'seance', 'jour', 'etape', 'n', 'i', 'p', 'j', 'parts', 'seances', 'journal', 'calculs', 'justes', 'nouveautes', 'prouvees',
            'rouges', 'minutes', 'numero', 'seuls', 'seulsJustes', 'tests', 'testsRates', 'jours', 'ceintures', 'paliers', 'quarts'],
        'mots' => [],
        'motifs' => ['/^(?:A1|A10|A11|A2|A3|A4|A5|A6|A7|A8|A9|M4|M1|M2|M3|M5|M6|M13|M7|M8|M9|M10|M11|M12|C1|C3|C4|D1|D2|D3|D4|D5|D6|D7|D8|D9|F2|F1|F3|F4|F5|F6|F8|F9|F11|D10|D11|D12|D13|D14|D15|F7|F10|F12|F13|P1|P2|P3|P4|R1|R2|R3|R4|R5|R6|X1|X2|X3|X4|X5|X6|X7|C2|C5)$/', '/^\d{1,2}$/'],
        // « Revenir à… » nomme une version par ce compte : les séances finies
        // (une liste de dates, 60 au plus).
        'compteur' => 'seances',
        // Lot 1 « la séance » (12/11/2026, décisions de « fonctionnement 3 ») :
        // ce qu'un professeur règle pour SA classe, puis, s'il veut, pour un
        // élève — « minutes », la durée d'une séance (10 ou 15), et
        // « palier », jusqu'où va l'appli (1 les bases, 2 CM1, 3 CM2, 4 vers
        // la 6e : tout). Deux CHOIX fermés (déclarés ['choix' => [...]] : le
        // premier est le défaut, qui ne s'écrit pas) : {"defi-calcul":
        // {"minutes": 15, "palier": 2}}. Voir reglages_recus() et, pour un
        // élève, reglages_eleve_recus(). « nouveautes » (lot F1) n'existe
        // plus : relu dans une vieille ligne, il est ignoré, et disparaît au
        // prochain enregistrement de la classe.
        // Lot K1b « les bases en trois classes » (26/11/2026) : l'appli a SIX
        // étages (1 le CP, 2 le CE1, 3 le CE2, 4 le CM1, 5 le CM2, 6 vers la
        // 6e : tout). Le réglage change de NOM avec la numérotation —
        // « etage » — pour qu'un numéro rangé avant le lot ne soit jamais lu
        // dans la nouvelle : {"defi-calcul": {"minutes": 15, "etage": 2}}.
        // L'ancien « palier » (1 les bases, 2 CM1, 3 CM2), resté dans une
        // ligne de classe ou d'élève, se relit encore, dans SA numérotation
        // (« reglages_anciens » : 1 → 3, 2 → 4, 3 → 5 — un 2 d'avant veut
        // dire CM1 et le dit encore) ; il disparaît au prochain
        // enregistrement de la classe ou de l'élève. Envoyé par une page du
        // professeur restée ouverte, il est refusé (« Réglage inconnu. ») :
        // elle se recharge. Voir reglages_anciens_repris().
        // Correctif K1b (relecture de Codex du 26/11) : « rendu » — ce qu'une
        // page d'AVANT le lot (version 12), encore ouverte, doit recevoir en
        // plus pour garder le plafond du professeur : l'ancien « palier »,
        // dans SA numérotation, à côté d'« etage ». Elle ne connaît pas
        // « etage » et retombait sur « tout ». Par étage : 4 (CM1) → 2, 5
        // (CM2) → 3, 6 (tout, quand il est écrit pour un élève) → 4 ; les
        // étages 1 à 3 (CP, CE1, CE2), qu'elle ne sait pas distinguer → 1
        // (les bases : son plafond le plus bas). Voir
        // reglages_pour_les_pages_d_avant().
        'reglages' => ['minutes' => ['choix' => [10, 15]], 'etage' => ['choix' => [6, 1, 2, 3, 4, 5]]],
        'reglages_anciens' => ['palier' => ['vers' => 'etage', 'valeurs' => [1 => 3, 2 => 4, 3 => 5, 4 => 6],
            'rendu' => [1 => 1, 2 => 1, 3 => 1, 4 => 2, 5 => 3, 6 => 4]]],
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
        // Correctif du lot S1 « les journaux » (07/11/2026, relecture de
        // Codex) : 6. Chaque séance du journal a son numéro (`numero`) ; une
        // page de version 5 ne le connaît pas et l'effacerait.
        // Lot 1 « la séance » (12/11/2026) : 7. Une page de version 6 ne
        // connaît ni `l` ni le plan à 11 nombres : elle les effacerait.
        // Lot 4 « les ceintures » (14/11/2026) : 8. Une page de version 7 ne
        // connaît pas `ceintures` (les ceintures gagnées) : elle l'effacerait.
        // Lot 6 « programmes 2 » (19/11/2026) : 9. F6 et F9 ont un niveau de
        // plus, posé à sa place : une page de version 8 lirait leurs listes
        // avec les anciens numéros (et couperait la dernière case).
        // Lot F4 « personne ne reste bloqué » (18/11/2026, recalé le 20/11) :
        // 10. Une page de version 9 ne connaît ni `ar` (où reprend un
        // J'apprends arrêté) ni `paliers` (les tests de palier joués) : elle
        // les effacerait.
        // Lot C2 « doubles et moitiés » (21/11/2026) : 11. M1 a 6 niveaux et
        // D8 5 (les moitiés à part, chacune à sa place) : une page de version
        // 10 lirait leurs listes avec les anciens numéros (et couperait les
        // dernières cases).
        // Lot K1 « la carte chez l'élève » (25/11/2026) : 12. Le format change
        // en entier (des étoiles, leur compteur, plus de `ok`, `f`, `t`, `l`,
        // un plan de séance à 5 nombres) : une page de version 11 ne saurait
        // ni le lire ni l'écrire.
        // Lot K1b « les bases en trois classes » (26/11/2026) : 13. Six
        // étages, neuf étoiles de plus (A10, A11, A2, A3, A5 et M1 ont des
        // niveaux de plus, à la fin) : une page de version 12 couperait les
        // dernières cases de leurs listes et lirait `ceintures`, `paliers` et
        // `quarts` avec les anciens numéros d'étage. (Le moteur de la version
        // 13 relit une ligne de version 12 sans rien perdre : aucune remise à
        // zéro.)
        'version_min' => 13,
        // Lot K1 (relecture de Codex du 22/11, B1) : la LECTURE aussi est
        // protégée. Une page dit sa version en lisant (« version » dans le
        // corps) ; le serveur ne lui sert pas une progression d'une version
        // plus haute, qu'elle ne saurait pas lire — elle en fabriquait une
        // autre en la relisant, puis la renvoyait. Une page qui ne dit rien
        // (toutes celles d'avant ce lot, déjà distribuées) vaut au plus
        // cette version-ci. Voir api/parcours.php.
        'version_sans_declaration' => 11,
        // Correctif F4 (21/11/2026, relecture de Codex, point 7) : la version
        // la plus haute acceptée (le moteur relit la même borne) — au-delà,
        // l'écriture est refusée (400). Avant, 1500 entrait, et le moteur la
        // relisait comme une version ANCIENNE (F6 et F9 décalés, le plan de
        // la séance refermé).
        'version_max' => 999,
        // Et la forme des listes, valeur par valeur. Une valeur hors format est
        // REMPLACÉE à sa place (null pour une date, le minimum pour un
        // entier), jamais retirée : retirée, les suivantes glissaient d'une
        // case (une boîte au mauvais niveau, une date au mauvais palier).
        // Voir lib/progression.php, valeur_de_liste().
        // Lot K1 (relecture de Codex du 22/11, G5) : TOUTES les listes où la
        // place compte sont déclarées — par étoile (une case par niveau), le
        // plan de la séance et ce qu'elle a fait, les dates par étage, les
        // séances et leur journal (alignés : une date refusée devient null,
        // et le moteur écarte la séance AVEC sa ligne de journal). Les
        // bornes sont celles du moteur, qui renormalise tout ce qu'il relit.
        'listes' => [
            'b' => ['entier', 0, 7], 'a' => ['entier', 0, 1], 'x' => ['entier', 0, 3], 'r' => ['entier', 0, 2],
            'pe' => ['entier', 0, 3], 'ar' => ['entier', 0, 29], 'g' => ['entier', 0, 9999],
            'e' => ['date'], 'q' => ['date'], 'd' => ['date'], 's' => ['date'],
            'p' => ['entier', 0, 99], 'j' => ['entier', 0, 5400], 'parts' => ['entier', 0, 9999],
            'ceintures' => ['date'], 'paliers' => ['date'], 'quarts' => ['entier', 0, 3],
            'seances' => ['date'], 'jours' => ['date'],
            'calculs' => ['entier', -1, 999], 'justes' => ['entier', -1, 999], 'nouveautes' => ['entier', -1, 99],
            'prouvees' => ['entier', -1, 999], 'rouges' => ['entier', -1, 999], 'minutes' => ['entier', -1, 90],
            'numero' => ['entier', -1, 999999], 'seuls' => ['entier', -1, 999], 'seulsJustes' => ['entier', -1, 999],
            'tests' => ['entier', -1, 999], 'testsRates' => ['entier', -1, 999],
        ],
        // Correctif K1 (26/11/2026, relecture de Codex) : la forme PAR
        // EMPLACEMENT. Les règles ci-dessus vont par NOM de clé, à toute
        // profondeur : `i` valait 10 000, un plan commençait par 5, un
        // booléen entrait dans `jours`, une cause comptait −3, et une liste
        // `b` posée sous `seance` passait. Ici, chaque champ est déclaré là
        // où le moteur l'écrit, avec SES bornes ; tout ce qui n'est pas à sa
        // place est retiré (voir lib/progression.php, valeur_a_sa_place) :
        //   ['objet']            ses clés sont celles déclarées dessous ;
        //   ['motif', n]         ses clés suivent le motif n° n de « motifs »
        //                        (0 : un code de module, 1 : un numéro de
        //                        cause), et se déclarent « .* » ;
        //   ['liste', forme]     chaque valeur, à sa place (remplacée, jamais
        //                        retirée) ;
        //   ['places', bornes]   une liste où chaque place a ses bornes,
        //                        coupée à leur nombre ; avec 'cycle', elles
        //                        se répètent (`parts` : onze nombres par onglet) ;
        //   ['entier', min, max], ['date']   une valeur seule (hors bornes :
        //                        retirée, le moteur reprend son défaut).
        // Les bornes sont celles du moteur (defi_calcul_mon_parcours.js) ; le
        // garde-fou est le même : la référence doit ressortir identique.
        'emplacements' => [
            '' => ['objet'],
            'version' => ['entier', 1, 999],
            'epoque' => ['entier', 0, 1000000],
            'modules' => ['motif', 0],
            'modules.*' => ['objet'],
            'modules.*.vu' => ['date'],
            'modules.*.b' => ['liste', ['entier', 0, 7]], 'modules.*.a' => ['liste', ['entier', 0, 1]],
            'modules.*.x' => ['liste', ['entier', 0, 3]], 'modules.*.r' => ['liste', ['entier', 0, 2]],
            'modules.*.pe' => ['liste', ['entier', 0, 3]], 'modules.*.ar' => ['liste', ['entier', 0, 29]],
            'modules.*.g' => ['liste', ['entier', 0, 9999]],
            'modules.*.e' => ['liste', ['date']], 'modules.*.q' => ['liste', ['date']],
            'modules.*.d' => ['liste', ['date']], 'modules.*.s' => ['liste', ['date']],
            'modules.*.c' => ['motif', 1],
            'modules.*.c.*' => ['entier', 1, 9999],
            'seance' => ['objet'],
            'seance.jour' => ['date'],
            'seance.etape' => ['entier', 0, 99],
            'seance.n' => ['entier', 0, 9999],
            'seance.i' => ['entier', 0, 9999],
            'seance.g' => ['entier', 0, 9999],
            // Le plan : ouverte (0 ou 1), les minutes (15 au plus), le paquet
            // obligé (0 ou 1), ce qu'il en reste (10 au plus), les étapes
            // commencées (99 au plus).
            'seance.p' => ['places', [[0, 1], [0, 15], [0, 1], [0, 10], [0, 99]]],
            // Ce que la séance a fait : dix comptes, 999 au plus — sauf les
            // secondes (5 400) et les étoiles gagnées par J'apprends (99).
            'seance.j' => ['places', [[0, 999], [0, 999], [0, 999], [0, 999], [0, 5400], [0, 99], [0, 999], [0, 999], [0, 999], [0, 999]]],
            // La même chose par onglet : sa source (9 999 au plus), puis ses
            // dix comptes ; un groupe incomplet en bout de liste est coupé.
            'seance.parts' => ['places', [[0, 9999], [0, 999], [0, 999], [0, 999], [0, 999], [0, 5400], [0, 99], [0, 999], [0, 999], [0, 999], [0, 999]], 'cycle'],
            'seances' => ['liste', ['date']],
            'journal' => ['objet'],
            'journal.calculs' => ['liste', ['entier', -1, 999]], 'journal.justes' => ['liste', ['entier', -1, 999]],
            'journal.nouveautes' => ['liste', ['entier', -1, 99]], 'journal.prouvees' => ['liste', ['entier', -1, 999]],
            'journal.rouges' => ['liste', ['entier', -1, 999]], 'journal.minutes' => ['liste', ['entier', -1, 90]],
            'journal.numero' => ['liste', ['entier', -1, 999999]], 'journal.seuls' => ['liste', ['entier', -1, 999]],
            'journal.seulsJustes' => ['liste', ['entier', -1, 999]], 'journal.tests' => ['liste', ['entier', -1, 999]],
            'journal.testsRates' => ['liste', ['entier', -1, 999]],
            'jours' => ['liste', ['date']],
            'ceintures' => ['liste', ['date']], 'paliers' => ['liste', ['date']],
            'quarts' => ['liste', ['entier', 0, 3]],
        ],
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
        'cles' => ['version', 'epoque', 'etapes', 'fait', 'etoiles', 'cartes', 'vues', 'essais', 'date', 'idx',
            'jours', 'journal', 'series', 'reussies', 'depuis'],
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
        // Lot S1 « les journaux » (07/11/2026) : le journal des jours joués —
        // `jours` (les 60 derniers, des dates), `journal` (trois listes
        // d'entiers alignées : `series`, `reussies`, `vues` ; -1 = pas connu)
        // et `depuis` (le premier jour du journal). Version 2 du moteur, et la
        // même garde que Défi calcul et Défi tables : une page de version 1
        // effacerait le journal en renvoyant la progression, son envoi est
        // refusé (400). SI UN JOUR ON REVIENT EN ARRIÈRE sur le moteur, il
        // faut aussi revenir en arrière ici.
        'version_min' => 2,
    ],
    // L'appli « Cours » (lot « cours-appli », 08/11/2026, lib/cours.php) :
    // le livret de cours de Gwenaël, une fiche par savoir-faire. Pas de
    // progression (api/parcours.php ne la connaît pas), pas de jauge ; depuis
    // le lot « cours-appli-3 » (14/11/2026), des CHAPITRES en plus pour
    // quelques élèves (eleves.ajouts : {"cours": {"chapitres": [...]}}, voir
    // ajouts_lus et acces_de_l_eleve) ; depuis le lot « cours-ouvertures »
    // (10/11/2026), seulement le jour de la dernière ouverture de chaque
    // fiche, dans sa propre table (lib/cours.php, api/cours.php). Ce
    // qui se règle pour la classe : les chapitres ouverts, les fiches
    // fermées, les fiches du nouveau programme ouvertes — des identifiants
    // du catalogue (« cours »). Au départ, RIEN n'est ouvert (choix de
    // Gwenaël du 08/11/2026) : la tuile dit « 0 chapitre » tant qu'il n'a rien
    // coché. L'espace élève la montre à part, en haut (pas une activité).
    'cours' => [
        'nom' => 'Mes cours',
        'description' => '',
        'url' => 'https://mathsgo.re/cours/',
        'ancre' => null,
        'disponible' => true,
        'cles' => [],
        'mots' => [],
        'motifs' => [],
        'compteur' => null,
        'reglages' => ['chapitres' => 'cours', 'sans' => 'cours', 'avec' => 'cours'],
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

// Lot K1b de Défi calcul (26/11/2026) : un réglage qui a changé de NOM parce
// que ses valeurs ont changé de sens. Le catalogue le déclare
// (« reglages_anciens » : l'ancien nom, le nouveau, et la valeur d'aujourd'hui
// de chaque ancienne valeur). Une ligne de la base qui porte encore l'ancien
// nom se relit sous le nouveau, avec la valeur traduite ; l'ancien nom n'est
// jamais réécrit, ni rendu au professeur (à l'élève : voir
// reglages_pour_les_pages_d_avant). Quand le nouveau nom est déjà là, il fait foi
// (l'ancien est un reste) ; une ancienne valeur qui n'est pas dans la table
// ne donne rien (le défaut). Ne sert qu'à la LECTURE de ce qui est rangé : ce
// qu'une page envoie se lit strictement (reglages_recus, reglages_eleve_recus),
// et l'ancien nom y est un réglage inconnu.
// Correctif K1b (relecture de Codex du 26/11) : une ancienne valeur écrite
// « 2.0 » dans le texte de la base vaut 2. PHP la décode en nombre à virgule,
// le navigateur (JSON.parse) en entier : le moteur et l'onglet y lisaient le
// CM1 quand le serveur ne lisait rien. Une seule règle pour les trois
// lecteurs — un nombre ENTIER, quelle que soit son écriture ; « 2.5 », un
// texte, une liste ne donnent toujours rien.
function reglages_anciens_repris(string $cle, array $brut): array
{
    foreach (CATALOGUE_APPLIS[$cle]['reglages_anciens'] ?? [] as $ancien => $regle) {
        if (!array_key_exists($ancien, $brut)) continue;
        $valeur = $brut[$ancien];
        unset($brut[$ancien]);
        if (array_key_exists($regle['vers'], $brut)) continue;
        if (is_float($valeur) && is_finite($valeur) && floor($valeur) === $valeur && abs($valeur) < 1000) $valeur = (int)$valeur;
        if (is_int($valeur) && array_key_exists($valeur, $regle['valeurs'])) $brut[$regle['vers']] = $regle['valeurs'][$valeur];
    }
    return $brut;
}

// Correctif K1b (relecture de Codex du 26/11) : ce que reçoit L'ÉLÈVE (par son
// code ou son billet, api/eleve.php) porte, à côté d'un réglage qui a changé
// de nom, l'ANCIEN nom dans l'ancienne numérotation (« rendu » dans
// « reglages_anciens »). Une page d'avant le lot restée ouverte ne connaît
// que lui : sans cela elle ignorait « etage » et ouvrait tout, par-dessus le
// plafond du professeur. La page d'aujourd'hui lit le nouveau nom, qui fait
// foi quand les deux sont là. Rien n'est écrit en base, rien ne part vers la
// page du professeur ; quand le réglage est au défaut (rien d'écrit), rien
// n'est ajouté — l'ancien défaut était « tout », lui aussi.
function reglages_pour_les_pages_d_avant(array $reglages): array
{
    foreach ($reglages as $cle => $reglage) {
        if (!is_array($reglage)) continue;
        foreach (CATALOGUE_APPLIS[$cle]['reglages_anciens'] ?? [] as $ancien => $regle) {
            $valeur = $reglage[$regle['vers']] ?? null;
            if (is_int($valeur) && isset($regle['rendu'][$valeur])) $reglages[$cle][$ancien] = $regle['rendu'][$valeur];
        }
    }
    return $reglages;
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
        $reglageBrut = reglages_anciens_repris($cle, $reglageBrut);
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
            // Un nombre (lot F1) : un entier dans ses bornes, autre que le
            // défaut ; sinon, le défaut (rien).
            if (est_reglage_nombre($defaut)) {
                $valeur = $reglageBrut[$nom] ?? null;
                if (is_int($valeur) && $valeur > $defaut['de'] && $valeur <= $defaut['a']) $reglage[$nom] = $valeur;
            }
            // Un choix fermé (lot 1 « la séance ») : une des valeurs déclarées,
            // autre que le défaut (la première) ; sinon, le défaut (rien).
            if (est_reglage_choix($defaut)) {
                $valeur = $reglageBrut[$nom] ?? null;
                if (is_int($valeur) && $valeur !== $defaut['choix'][0] && in_array($valeur, $defaut['choix'], true)) $reglage[$nom] = $valeur;
            }
            // Une liste d'identifiants du livret (l'appli Cours, lib/cours.php) :
            // ceux qui existent encore au catalogue ; rien quand la liste est vide.
            if ($defaut === 'cours') {
                $liste = cours_liste_lue($nom === 'chapitres' ? 'chapitres' : 'fiches', $reglageBrut[$nom] ?? null);
                if ($liste !== null) $reglage[$nom] = $liste;
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

// Un réglage « choix » (lot 1 « la séance ») est déclaré ['choix' => [...]] :
// deux entiers au moins, tous différents ; le premier est le défaut, qui ne
// s'écrit pas. Il peut aussi se donner à un élève (reglages_eleve_recus).
function est_reglage_choix(mixed $declare): bool
{
    if (!is_array($declare) || array_keys($declare) !== ['choix']) return false;
    $choix = $declare['choix'];
    if (!is_array($choix) || !array_is_list($choix) || count($choix) < 2) return false;
    foreach ($choix as $valeur) if (!is_int($valeur)) return false;
    return count(array_unique($choix)) === count($choix);
}

// Les réglages « choix » d'une appli : ['minutes' => [10, 15], …].
function choix_declares(string $cle): array
{
    $sortie = [];
    foreach (CATALOGUE_APPLIS[$cle]['reglages'] ?? [] as $nom => $defaut) {
        if (est_reglage_choix($defaut)) $sortie[$nom] = $defaut['choix'];
    }
    return $sortie;
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
            // Un choix fermé (lot 1 « la séance ») : une des valeurs déclarées,
            // rien d'autre (ni « 15 » en texte, ni 12) ; le défaut = rien d'écrit.
            if (est_reglage_choix($defaut)) {
                $valeur = $reglage[$nom];
                if (!is_int($valeur) || !in_array($valeur, $defaut['choix'], true)) {
                    throw new InvalidArgumentException("Valeur hors des choix.");
                }
                if ($valeur === $defaut['choix'][0]) unset($nouveau[$nom]);
                else $nouveau[$nom] = $valeur;
                continue;
            }
            // Une liste d'identifiants du livret (l'appli Cours) : chacun connu
            // du catalogue, rangés dans son ordre ; vide = rien d'écrit.
            if ($defaut === 'cours') {
                $liste = cours_liste_recue($nom === 'chapitres' ? 'chapitres' : 'fiches', $reglage[$nom]);
                if ($liste === []) unset($nouveau[$nom]);
                else $nouveau[$nom] = $liste;
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
        if (!in_array($cle, ['applis', 'reglages', 'jour', 'portes'], true)) throw new InvalidArgumentException("État d'avant illisible.");
    }
    $sortie = [];
    // Lot B3 : les portes que la carte « Aujourd'hui » proposait (celles de la
    // classe et celles de quelques élèves), pour reconnaître une page en
    // retard — une liste de clés, sans ordre ; voir portes_perimees().
    if (array_key_exists('portes', $recu)) {
        if (!is_array($recu['portes']) || !array_is_list($recu['portes']) || count($recu['portes']) > count(CATALOGUE_APPLIS)) {
            throw new InvalidArgumentException("État d'avant illisible.");
        }
        foreach ($recu['portes'] as $cle) {
            if (!is_string($cle)) throw new InvalidArgumentException("État d'avant illisible.");
        }
        $sortie['portes'] = array_values(array_unique($recu['portes']));
    }
    // Lot B2 « Ta liste dans Ma classe » : la liste du jour telle que la page
    // l'a reçue de « tableau » (jour_lu) — une liste de clés, comparée telle
    // quelle (l'ordre compte : c'est un ordre).
    if (array_key_exists('jour', $recu)) {
        if (!is_array($recu['jour']) || !array_is_list($recu['jour']) || count($recu['jour']) > JOUR_MAX) {
            throw new InvalidArgumentException("État d'avant illisible.");
        }
        foreach ($recu['jour'] as $cle) {
            if (!is_string($cle)) throw new InvalidArgumentException("État d'avant illisible.");
        }
        $sortie['jour'] = $recu['jour'];
    }
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
// réglages donnés — ceux des autres applis ne comptent pas. $ajouts : les
// colonnes eleves.ajouts des élèves de la classe (ajouts_de_la_classe, lot
// B3) — la liste du jour se compare telle que la classe la voit. null : la
// règle du B2 (correctif B3, point 2 de Codex : pendant le dépôt FTP, un
// api/prof.php encore en B2 appelle cette fonction avec deux arguments — il
// doit marcher, pas répondre 500).
function meme_etat_de_classe(array $avant, array $ligne, ?array $ajouts = null): bool
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
    if (array_key_exists('jour', $avant)) {
        if ($avant['jour'] !== jour_de_classe($ligne, $ajouts)) return false;
    }
    return true;
}

// ------------------------------------------- la liste du jour (lot B2, 21/11/2026)
//
// Choix de Gwenaël (planches B2, questions à choix du 21/11) : dans « Ma
// classe › Réglages », il choisit par classe ce que le grand bouton de Mon
// espace propose aujourd'hui — « D'abord / Puis / Puis », une à trois portes
// ouvertes à la classe, Mes cours toujours en dernier. Rien n'est verrouillé :
// la liste dit seulement quel bouton s'affiche en haut de l'espace de l'élève.
// Sans liste, le mode automatique du lot B1.
//
// Rangé dans classes.reglages, à côté des réglages des applis, sous la clé
// « jour » (ce n'est pas une appli : reglages_lus la saute) — aucune
// migration :
//
//     {"jour": ["defi-tables", "splat", "cours"], "splat": {"mondes": [1, 2]}}
//
// Liste vide = automatique : rien d'écrit.
//
// PIÈGE (gardé par un test) : reglages_lus ne rend que les réglages des applis,
// et reglages_recus repart de là. Toute réécriture de la colonne (régler les
// mondes de SPLAT!…) doit donc REMETTRE la liste — classes.modifier le fait
// sous le verrou, depuis la ligne relue (reglages_pour_la_base).
//
// Lot B3 « Aujourd'hui : Aucun, et les portes de quelques élèves » (21/11/2026,
// décisions de Gwenaël après son groupe mixte 4e/3e, où chaque élève a SES
// chapitres) :
//
//  1. « Aucun » — pas de bloc « Aujourd'hui » pour la classe. Rangé comme une
//     liste d'une seule clé RÉSERVÉE : {"jour": ["@aucun"]}. La liste garde
//     ainsi partout la même forme (trois chaînes au plus) : « avant », le 409,
//     tableau, la réponse à l'élève, la copie de l'onglet. « @aucun » n'est pas
//     une appli et ne peut pas le devenir (un test : aucune clé du catalogue ne
//     commence par « @ ») ; seule, elle est acceptée ; mêlée à autre chose, 400.
//
//  2. Les PORTES POSSIBLES d'une classe = celles de la classe, plus celles
//     qu'au moins un de ses élèves a en plus (eleves.ajouts). Mes cours est une
//     porte quand un chapitre est ouvert à la classe, ou à un élève en plus
//     (portes_du_jour). L'élève, lui, ne reçoit que SES portes
//     (jour_de_l_eleve) : il saute les autres étapes, sans apprendre ce que
//     les autres ont ; s'il ne lui en reste aucune, sa liste est vide et il a
//     le mode automatique.
//
//  3. PAS DE RÉÉCRITURE CROISÉE (voulu) : quand eleves.acces retire une porte
//     au dernier élève qui l'avait, la ligne de la classe n'est pas réécrite —
//     pas de second verrou, pas d'interblocage. L'étape disparaît à la LECTURE
//     (plus personne ne l'a) et revient si la porte est redonnée à un élève…
//     tant que la classe n'a pas été réécrite entre-temps : toute écriture de
//     classes.modifier range la liste telle qu'elle se voit à ce moment-là
//     (correctif B2, point 2).

const JOUR_MAX = 3;
const JOUR_AUCUN = '@aucun';

function jour_sans_bloc(array $jour): bool
{
    return $jour === [JOUR_AUCUN];
}

// Correctif B3 (relecture Codex, point 4) : « Mes cours » n'est une porte que
// si au moins un chapitre est VRAIMENT affichable — ouvert, avec une fiche
// ou son Entraînement brevet ouverts (cours_ouverts_a_l_eleve, la règle même
// de ce que l'élève voit). Avant, un chapitre ouvert dont toutes les fiches
// étaient fermées comptait : la liste proposait Mes cours, l'élève n'y
// trouvait rien et sautait l'étape. $reglage : un réglage « cours »
// ({chapitres, sans, avec}).
function cours_affichable(array $reglage): bool
{
    return ($reglage['chapitres'] ?? []) !== [] && cours_ouverts_a_l_eleve($reglage) !== [];
}

// Les portes possibles d'une classe pour la liste du jour, dans l'ordre du
// catalogue. $applis : les clés des applis de la classe ; $reglages : ses
// réglages (reglages_lus) ; $enPlus : les clés que des élèves ont en plus
// (portes_des_ajouts).
function portes_du_jour(array $applis, array $reglages, array $enPlus): array
{
    $applis = array_map('trim', $applis);
    $portes = [];
    foreach (array_keys(CATALOGUE_APPLIS) as $cle) {
        if (!appli_ouverte($cle)) continue;
        $parClasse = in_array($cle, $applis, true) && ($cle !== 'cours' || cours_affichable($reglages['cours'] ?? []));
        if ($parClasse || in_array($cle, $enPlus, true)) $portes[] = $cle;
    }
    return $portes;
}

// Les portes d'une classe par sa ligne (SELECT * : la colonne peut manquer).
// $ajouts : les colonnes eleves.ajouts de ses élèves (ajouts_de_la_classe) ;
// [] = les portes de la classe seule, sans celles de quelques élèves.
function portes_de_classe(array $classe, array $ajouts): array
{
    return portes_du_jour(explode(',', (string)($classe['applis'] ?? '')), reglages_de_classe($classe),
        portes_des_ajouts($ajouts, $classe));
}

// Les clés que les élèves d'une classe ont EN PLUS, à partir de leurs colonnes
// eleves.ajouts (lues par ajouts_lus : une appli fermée, un ajout abîmé ne
// comptent pas). Un ajout « cours » ne compte que si l'un de ses chapitres est
// affichable avec les fiches fermées et ouvertes de la CLASSE ($classe : sa
// ligne, ou la ligne qu'elle aura après l'écriture), comme pour l'élève
// (cours_de_classe_et_ajout).
function portes_des_ajouts(array $colonnes, array $classe): array
{
    $coursClasse = reglages_de_classe($classe)['cours'] ?? [];
    $cles = [];
    foreach ($colonnes as $json) {
        if ($json === null || $json === '') continue;
        foreach (ajouts_lus((string)$json) as $cle => $ajout) {
            if ($cle === 'cours' && !cours_affichable(['chapitres' => $ajout['chapitres'] ?? []]
                + array_intersect_key($coursClasse, ['sans' => true, 'avec' => true]))) continue;
            $cles[$cle] = true;
        }
    }
    return array_keys($cles);
}

// Lues en base : les colonnes eleves.ajouts des élèves de la classe. Une
// lecture simple, SANS verrou sur les lignes des élèves : dans classes.modifier
// elle se fait sous le verrou de la classe, et eleves.acces ne verrouille que
// l'élève — aucun ordre de verrous à tenir. Sur MySQL, c'est la première
// lecture cohérente de la transaction (ajouts_disponibles est demandé AVANT
// la transaction) : l'instantané part d'après le verrou.
function ajouts_de_la_classe(PDO $pdo, int $classeId): array
{
    if (!ajouts_disponibles($pdo)) return [];
    $requete = $pdo->prepare('SELECT ajouts FROM eleves WHERE classe_id = ? AND ajouts IS NOT NULL');
    $requete->execute([$classeId]);
    $colonnes = $requete->fetchAll(PDO::FETCH_COLUMN);
    $requete->closeCursor();
    return $colonnes;
}

// Les portes d'UN élève, à partir de ce qu'il voit (acces_de_l_eleve) : ses
// applis ; Mes cours seulement s'il a un chapitre affichable.
function portes_de_l_eleve(array $acces): array
{
    return array_values(array_filter($acces['applis'] ?? [],
        fn($cle) => $cle !== 'cours' || cours_affichable($acces['reglages']['cours'] ?? [])));
}

// Correctif B3 (Codex, points 1, 4 et 6) : ce que la carte « Aujourd'hui » du
// professeur reçoit, calculé ICI (la page ne recopie pas la règle) : les
// portes possibles (« portes » : la classe et quelques élèves) et celles de
// la classe seule (« portes_classe » : sans compte, et le mode automatique).
function portes_pour_la_page(array $classe, array $ajouts): array
{
    return ['portes' => portes_de_classe($classe, $ajouts), 'portes_classe' => portes_de_classe($classe, [])];
}

// La même chose relue en base dans UN instantané (la ligne de la classe et
// les ajouts de ses élèves, qui ont coexisté) : pour eleves.acces, APRÈS son
// écriture — une lecture, sans verrou, hors de la transaction de l'élève (pas
// de réécriture croisée, pas de second verrou). null : classe disparue.
function portes_pour_la_page_en_base(PDO $pdo, int $classeId): ?array
{
    instantane_ouvrir($pdo);
    try {
        $requete = $pdo->prepare('SELECT * FROM classes WHERE id = ?');
        $requete->execute([$classeId]);
        $ligne = $requete->fetch();
        $requete->closeCursor();
        $portes = $ligne === false ? null : portes_pour_la_page($ligne, ajouts_de_la_classe($pdo, $classeId));
    } finally {
        instantane_fermer($pdo);
    }
    return $portes;
}

// La valeur rangée sous « jour », TELLE QUELLE : le JSON est lu en gardant ses
// objets comme objets (correctif B3, Codex point 9 — json_decode(…, true)
// faisait de {"0": "@aucun"} une liste, qui éteignait le bloc). null : pas de
// clé « jour » (ou une colonne illisible).
function jour_json(?string $json): mixed
{
    if ($json === null || $json === '') return null;
    $brut = json_decode($json, false);
    return $brut instanceof stdClass && property_exists($brut, 'jour') ? $brut->jour : null;
}

// La liste CANONIQUE d'une classe (correctif B3, Codex point 8) : la même pour
// tous ceux qui la lisent, AVANT toute réduction aux portes — des clés
// d'applis ouvertes au catalogue, sans doublon, les trois premières, Mes cours
// seulement en dernier. Chacun (la classe, chaque élève) n'en garde ensuite
// que ses portes, dans le même ordre : la liste d'un élève est toujours une
// partie de celle que voit le professeur, et une quatrième étape ne remonte
// jamais. « Aucun » (exactement ["@aucun"]) passe tel quel.
function jour_canonique(?string $json): array
{
    $jour = jour_json($json);
    if (!is_array($jour)) return [];   // un objet JSON n'est pas une liste
    if (jour_sans_bloc($jour)) return [JOUR_AUCUN];
    $liste = [];
    foreach ($jour as $cle) {
        if (count($liste) >= JOUR_MAX) break;
        if (!is_string($cle) || !appli_ouverte($cle) || in_array($cle, $liste, true)) continue;
        $liste[] = $cle;
    }
    $place = array_search('cours', $liste, true);
    if ($place !== false && $place !== count($liste) - 1) {
        unset($liste[$place]);
        $liste = array_values($liste);
    }
    return $liste;
}

// Lecture INDULGENTE (ce qui sort de la base) : la liste canonique, réduite
// aux portes données, dans son ordre. Une porte que plus personne n'a sort de
// la liste ici. « Aucun » passe tel quel.
function jour_lu(?string $json, array $portes): array
{
    $liste = jour_canonique($json);
    if (jour_sans_bloc($liste)) return $liste;
    $portes = array_map('trim', $portes);
    return array_values(array_filter($liste, fn($cle) => in_array($cle, $portes, true)));
}

// La liste du jour d'une classe par sa ligne de la base (SELECT * : la colonne
// peut manquer tant que migrer.php n'a pas été ouvert). $ajouts : les colonnes
// eleves.ajouts de ses élèves (ajouts_de_la_classe) — les étapes que seuls
// quelques élèves ont restent. null : la règle du B2 (les applis de la classe
// seulement) — pour un api/*.php encore en B2 pendant le dépôt FTP (correctif
// B3, Codex point 2) ; tout le code du lot passe ses ajouts (un test le garde).
function jour_de_classe(array $classe, ?array $ajouts = null): array
{
    $json = isset($classe['reglages']) ? (string)$classe['reglages'] : null;
    if ($ajouts === null) return jour_lu($json, explode(',', (string)($classe['applis'] ?? '')));
    return jour_lu($json, portes_de_classe($classe, $ajouts));
}

// Ce que reçoit UN élève : la liste canonique de sa classe réduite à SES
// portes ($acces : acces_de_l_eleve). Il n'apprend rien des portes des autres :
// une étape qu'il n'a pas n'est pas dans sa réponse. « Aucun » passe tel quel.
function jour_de_l_eleve(array $classe, array $acces): array
{
    return jour_lu(isset($classe['reglages']) ? (string)$classe['reglages'] : null, portes_de_l_eleve($acces));
}

// Correctif B3 (Codex, point 3) : une page professeur d'AVANT ce lot (pas de
// « avant.portes ») ne sait montrer ni « Aucun » ni une étape que seuls
// quelques élèves ont : elle les retire de son brouillon sans le dire, et
// enregistrer remplacerait la liste par ce qu'elle a cru voir. Vrai quand la
// liste que la classe voit ($vue) est de celles-là : le serveur demande alors
// de recharger la page. Les listes ordinaires (des portes de la classe)
// restent permises à une page du B2.
function jour_hors_d_une_page_b2(array $vue, array $portesClasse): bool
{
    return jour_sans_bloc($vue) || array_diff($vue, $portesClasse) !== [];
}

// Ce que le professeur envoie (classes.modifier) : lecture STRICTE, rien n'est
// arrangé en silence. $portes : les portes possibles de la classe APRÈS
// l'écriture ; null = la forme seulement (avant le verrou : les portes se
// vérifient sous le verrou, après « avant »). « Aucun » : ["@aucun"], seule.
function jour_recu(mixed $recu, ?array $portes): array
{
    if (!is_array($recu) || !array_is_list($recu)) throw new InvalidArgumentException("Liste du jour illisible.");
    if (count($recu) > JOUR_MAX) throw new InvalidArgumentException("Trois étapes au plus.");
    if (jour_sans_bloc($recu)) return [JOUR_AUCUN];
    $portes = $portes === null ? null : array_map('trim', $portes);
    $liste = [];
    foreach ($recu as $cle) {
        if (!is_string($cle)) throw new InvalidArgumentException("Liste du jour illisible.");
        if ($cle === JOUR_AUCUN) throw new InvalidArgumentException("« Aucun » ne se mêle pas à une liste.");
        if (!appli_ouverte($cle) || ($portes !== null && !in_array($cle, $portes, true))) throw new InvalidArgumentException("Activité pas ouverte à la classe.");
        if (in_array($cle, $liste, true)) throw new InvalidArgumentException("Activité en double.");
        $liste[] = $cle;
    }
    $place = array_search('cours', $liste, true);
    if ($place !== false && $place !== count($liste) - 1) throw new InvalidArgumentException("Mes cours se met en dernier.");
    return $liste;
}

// Une liste réduite aux portes qui restent (classes.modifier, quand une porte
// ferme) ; « Aucun » n'est jamais taillé.
function jour_taille(array $jour, array $portes): array
{
    if (jour_sans_bloc($jour)) return $jour;
    return array_values(array_filter($jour, fn($cle) => in_array($cle, $portes, true)));
}

// La page était-elle en retard sur les portes ? Les étapes de la liste reçue
// que la carte croyait possibles (« avant.portes ») et qui ne le sont plus
// sous le verrou ($portes) : une porte retirée ailleurs au dernier élève qui
// l'avait, le dernier chapitre fermé… Non vide = 409 avec l'état vrai, au lieu
// d'un 400 qui se répéterait (comme le point 1 du correctif B2 pour les applis
// de la classe). Sans « avant.portes » (une page d'avant ce lot), rien n'est
// périmé. Correctif B3 (suggestion 16 de Codex) : $apres, les portes APRÈS
// l'écriture — une étape qui le redevient (le même appel rouvre l'appli à la
// classe et la choisit) n'est pas périmée : la demande est valable.
function portes_perimees(array $jour, ?array $avant, array $portes, array $apres = []): array
{
    if ($avant === null || !array_key_exists('portes', $avant) || jour_sans_bloc($jour)) return [];
    return array_values(array_diff(array_intersect(array_filter($jour, 'is_string'), $avant['portes']), $portes, $apres));
}

// La liste telle qu'elle est RANGÉE (sans rien filtrer) : sert seulement à
// savoir si la colonne doit être réécrite pour dire la liste effective.
// Correctif B3 (Codex, point 9) : rendue TELLE QUELLE, objet ou valeur fausse
// compris — une clé « jour » de forme invalide ({"0": …}, null, un texte) ne
// vaut jamais une liste, et la prochaine écriture de la classe la nettoie,
// même quand sa valeur effective est vide. [] : pas de clé « jour ».
function jour_brut(?string $json): mixed
{
    if ($json === null || $json === '') return [];
    $brut = json_decode($json, false);
    return $brut instanceof stdClass && property_exists($brut, 'jour') ? $brut->jour : [];
}

// La valeur de la colonne : les réglages des applis, et la liste du jour
// devant (rien quand les deux sont vides).
function reglages_pour_la_base(array $reglages, array $jour): ?string
{
    $tout = ($jour === [] ? [] : ['jour' => array_values($jour)]) + $reglages;
    return $tout === [] ? null : json_encode($tout, JSON_UNESCAPED_UNICODE);
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
//     {"cours": {"chapitres": ["4e-PUI", "3e-PYT"]}}   des chapitres du livret
//                                                     (lot « cours-appli-3 »)
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
//
// Correctif B3 (relecture Codex, point 9) : le JSON est lu en gardant ses
// objets comme objets. Une liste de numéros ou de chapitres doit être une
// vraie LISTE JSON ; un objet à clés numériques ({"0": "4e-REL"}) à sa place
// est abîmé et fait ignorer l'ajout (avant, il ouvrait le chapitre — et Mes
// cours). Ce que ajouts_pour_la_base écrit n'a jamais cette forme. Gardé du lot
// « Qui voit quoi » (testé) : « [] » vaut « {} », l'appli entière — json_encode
// d'un tableau vide l'écrit ainsi ; l'élève la voit, et la porte se compte de
// la même façon.
function ajouts_lus(?string $json): array
{
    if ($json === null || $json === '') return [];
    $brut = json_decode($json, false);
    if (!$brut instanceof stdClass) return [];
    $sortie = [];
    foreach (get_object_vars($brut) as $cle => $ajoutObjet) {
        if (!is_string($cle) || !appli_ouverte($cle) || !($ajoutObjet instanceof stdClass || $ajoutObjet === [])) continue;
        // Ses champs : une liste JSON reste un tableau PHP, un objet reste un objet.
        $ajoutBrut = $ajoutObjet === [] ? [] : get_object_vars($ajoutObjet);
        // L'appli Cours (lot « cours-appli-3 ») : seulement {"chapitres": [...]}
        // — jamais « {} » (l'appli entière, sans chapitre, n'ouvrirait rien de
        // lisible). Correctif après la relecture Codex (point 1) : la FORME est
        // lue strictement — une seule clé « chapitres », une vraie liste, rien
        // que des textes de la forme d'un chapitre (« 3e-PYT ») ; sinon l'ajout
        // est ignoré EN ENTIER (avant, {"chapitres": {"x": "3e-PYT"}} ou
        // ["3e-PYT", null] ouvraient le chapitre). Un chapitre bien formé qui
        // n'est plus au livret (retiré un jour) est seulement oublié : il ne
        // doit pas emporter les autres chapitres de l'élève. Plus rien de
        // connu : rien.
        if ($cle === 'cours') {
            $chapitres = cours_ajout_lu($ajoutBrut);
            if ($chapitres !== null) $sortie[$cle] = ['chapitres' => $chapitres];
            continue;
        }
        if ($ajoutBrut === []) { $sortie[$cle] = []; continue; }
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

// L'ajout « cours » d'un élève tel qu'il sort de la base : la liste des
// chapitres connus, ou null s'il est abîmé (forme fausse) ou vide.
function cours_ajout_lu(mixed $ajout): ?array
{
    if (!is_array($ajout) || array_keys($ajout) !== ['chapitres']) return null;
    $liste = $ajout['chapitres'];
    if (!is_array($liste) || $liste === [] || !array_is_list($liste)) return null;
    foreach ($liste as $id) {
        if (!is_string($id) || preg_match(COURS_MOTIF_CHAPITRE, $id) !== 1) return null;
    }
    return cours_liste_lue('chapitres', $liste);
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
        // L'appli Cours (lot « cours-appli-3 ») : des chapitres du livret,
        // au moins un, rien d'autre — ni « {} », ni une fiche, ni « sans » /
        // « avec » (les fiches suivent le réglage de la classe).
        if ($cle === 'cours') {
            if (array_keys($ajout) !== ['chapitres']) {
                throw new InvalidArgumentException("Pour un élève, on ouvre des chapitres : coche au moins un chapitre.");
            }
            $chapitres = cours_liste_recue('chapitres', $ajout['chapitres']);
            if ($chapitres === []) throw new InvalidArgumentException("Une liste vide n'ajoute rien : retire plutôt l'activité.");
            $sortie[$cle] = ['chapitres' => $chapitres];
            continue;
        }
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
//  3. Les réglages booléens (records) et les nombres suivent la classe
//     telle quelle.
//  4. Lot 1 « la séance » (12/11/2026) : les réglages « choix » (minutes et
//     palier de Défi calcul) suivent la classe, SAUF ceux que le professeur
//     a donnés à CET élève ($reglagesEleveJson, la colonne
//     eleves.reglages_eleve) : le choix de l'élève l'emporte, même s'il est
//     le défaut (il est alors écrit, pour l'emporter sur la classe).
function acces_de_l_eleve(array $classe, ?string $ajoutsJson, ?string $reglagesEleveJson = null): array
{
    $propres = reglages_eleve_lus($reglagesEleveJson);
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
        if ($cle === 'cours') $reglage += cours_de_classe_et_ajout($classe, $parClasse, $ajouts['cours'] ?? null);
        foreach ($propres[$cle] ?? [] as $nom => $valeur) $reglage[$nom] = $valeur;
        if ($reglage !== []) $reglages[$cle] = $reglage;
    }
    return ['applis' => $applis, 'reglages' => $reglages];
}

// L'appli Cours (lot « cours-appli-3 », 14/11/2026, choix de Gwenaël : « En
// plus pour quelques élèves », comme SPLAT! et Coffres). Rend le réglage
// « cours » de l'élève : chapitres = ceux de la classe (si elle a l'appli)
// ∪ ceux de son ajout, dans l'ordre du livret ; « sans » et « avec » = ceux
// de la CLASSE, qui valent aussi pour les chapitres ouverts en plus (une
// fiche fermée à la classe l'est pour tous ; une fiche du nouveau programme
// ne s'ouvre qu'en la cochant pour la classe — décision du chef, réversible :
// un ajout n'ouvre que des chapitres). Quand la classe n'a pas l'appli (ses
// élèves « en plus » seulement), ses chapitres ne comptent pas, mais ses
// fiches fermées et ouvertes, gardées dans classes.reglages, si.
function cours_de_classe_et_ajout(array $classe, bool $parClasse, ?array $ajout): array
{
    $brut = reglages_de_classe($classe)['cours'] ?? [];
    $chapitres = array_merge($parClasse ? ($brut['chapitres'] ?? []) : [], $ajout['chapitres'] ?? []);
    $sortie = [];
    $liste = cours_liste_lue('chapitres', $chapitres);
    if ($liste !== null) $sortie['chapitres'] = $liste;
    foreach (['sans', 'avec'] as $nom) {
        if (isset($brut[$nom])) $sortie[$nom] = $brut[$nom];
    }
    return $sortie;
}

// Ce que le professeur reçoit pour chaque élève (tableau, eleves.acces) : les
// clés et les réglages calculés — ni code ni donnée d'élève.
// Correctif B3 (relecture Codex, point 4) : et ses portes pour la liste du
// jour (portes_de_l_eleve) — la carte « Aujourd'hui » compte avec elles, sans
// recopier en JavaScript la règle de Mes cours (un chapitre affichable).
function acces_json(array $acces): array
{
    return ['applis' => $acces['applis'], 'reglages' => reglages_json($acces['reglages']), 'portes' => portes_de_l_eleve($acces)];
}

// ------------------------------------------- réglages d'un élève (lot 1 « la séance »)
//
// Lot 1 « la séance » (12/11/2026, planche 7 validée par Gwenaël) : pour
// quelques élèves, une autre durée de séance ou un autre palier que ceux de
// la classe (« Autrement pour quelques élèves »). Rangés à part, dans
// eleves.reglages_eleve — PAS dans eleves.ajouts : un ajout ouvre l'appli à
// l'élève, un réglage ne fait que la régler. {"defi-calcul": {"minutes": 15,
// "etage": 1}} : seulement des réglages « choix » déclarés, avec une de
// leurs valeurs. Écrit seulement par le propriétaire de la classe
// (eleves.reglages), avec le même « avant » (409) que eleves.acces.

// La colonne eleves.reglages_eleve existe-t-elle ? Elle arrive par
// migrer.php ; tant qu'elle manque, aucun élève n'a de réglage à lui.
function reglages_eleve_disponibles(PDO $pdo): bool
{
    static $vu = [];
    $cle = spl_object_id($pdo);
    if (!array_key_exists($cle, $vu)) $vu[$cle] = colonne_existe($pdo, 'eleves', 'reglages_eleve');
    return $vu[$cle];
}

// La colonne lue (jamais d'erreur) : ce qui est déclaré et valide, le reste
// ignoré ; rangé appli par appli dans l'ordre du catalogue, réglage par
// réglage dans l'ordre de la déclaration.
function reglages_eleve_lus(?string $json): array
{
    if ($json === null || $json === '') return [];
    $brut = json_decode($json, true);
    if (!is_array($brut)) return [];
    $sortie = [];
    foreach (array_keys(CATALOGUE_APPLIS) as $cle) {
        if (!isset($brut[$cle]) || !is_array($brut[$cle])) continue;
        // (Lot K1b : l'ancien « palier » de Défi calcul, relu sous « etage ».)
        $brut[$cle] = reglages_anciens_repris($cle, $brut[$cle]);
        $reglage = [];
        foreach (choix_declares($cle) as $nom => $choix) {
            $valeur = $brut[$cle][$nom] ?? null;
            if (is_int($valeur) && in_array($valeur, $choix, true)) $reglage[$nom] = $valeur;
        }
        if ($reglage !== []) $sortie[$cle] = $reglage;
    }
    return $sortie;
}

// Ce que le professeur envoie (eleves.reglages, et son « avant ») : lecture
// STRICTE — une appli sans réglage « choix », un nom inconnu, une valeur hors
// des choix sont refusés avec un message. « {} » : plus rien pour cet élève.
// Rend la forme canonique (celle de reglages_eleve_lus).
function reglages_eleve_recus(mixed $recus): array
{
    if (!is_array($recus) || ($recus !== [] && array_is_list($recus))) {
        throw new InvalidArgumentException("Réglages de l'élève illisibles.");
    }
    foreach ($recus as $cle => $reglage) {
        $choix = is_string($cle) && appli_connue($cle) ? choix_declares($cle) : [];
        if ($choix === [] || !is_array($reglage) || ($reglage !== [] && array_is_list($reglage))) {
            throw new InvalidArgumentException("Réglage inconnu.");
        }
        foreach ($reglage as $nom => $valeur) {
            if (!is_string($nom) || !array_key_exists($nom, $choix)) throw new InvalidArgumentException("Réglage inconnu.");
            if (!is_int($valeur) || !in_array($valeur, $choix[$nom], true)) throw new InvalidArgumentException("Valeur hors des choix.");
        }
    }
    return reglages_eleve_lus(json_encode($recus));
}

// Pour la base : null quand il n'y a rien (la colonne reste vide).
function reglages_eleve_pour_la_base(array $reglages): ?string
{
    return $reglages === [] ? null : json_encode($reglages, JSON_UNESCAPED_UNICODE);
}

function reglages_eleve_json(array $reglages): array|object
{
    return $reglages === [] ? new stdClass() : $reglages;
}
