<?php
// « 🏆 Les records » de Défi tables (lot du 09/10/2026, idée d'un élève).
//
// Le défi d'après la couronne : une Légende des tables court les 25 questions
// de la couronne avec un chrono qui monte, et son MEILLEUR temps entre dans
// une ligue — celle de son professeur, toutes ses classes ensemble. Deux
// tableaux : « Cette semaine » (remis à zéro le lundi à 0 h, heure de La
// Réunion) et « De tous les temps ». Une ligne par élève : son meilleur temps.
//
// Ce que le serveur garde (table records, lib/bd.php) : quatre nombres, deux
// instants, un choix — rien d'autre. Pas d'historique des courses.
//
// Ce que le serveur juge (le reste de l'appli lui fait confiance, ici non) :
//  - seule une LÉGENDE court : la progression Défi tables de l'élève porte
//    « expert.couronne » (c'est l'appli qui l'écrit, le serveur la relit) ;
//  - le temps est un entier de dixièmes, entre SEUIL_COURSE_DIXIEMES (10 s :
//    en dessous ce n'est pas un élève, l'appli n'a aucun plancher) et
//    COURSE_MAX_DIXIEMES (une heure) ; l'appli n'envoie que des courses à
//    25 sur 25 — elle le dit (« justes »), et le serveur le vérifie ;
//  - la classe de l'élève a les records ouverts (classes.reglages,
//    « defi-tables.records », ouvert par défaut).
//
// Ce que les élèves voient (et le professeur, à l'identique, pour projeter) :
// le top 10 de chaque tableau, un NOM AFFICHÉ (le prénom saisi par le
// professeur, ou « Mystère » — jamais la classe, décision du 09/10) et un
// temps. Jamais un code, jamais un identifiant. Cloisonnement : un élève ne
// voit que la ligue de SON professeur (le propriétaire de sa classe) ; les
// classes partagées à un collègue n'entrent pas dans la ligue du collègue.

declare(strict_types=1);

require_once __DIR__ . '/bd.php';
require_once __DIR__ . '/applis.php';

// Les mêmes bornes que le moteur (defi_tables_mon_parcours.js, SEUILS.course) :
// un test du dépôt les compare.
const COURSE_TOTAL = 25;
const SEUIL_COURSE_DIXIEMES = 100;
const COURSE_MAX_DIXIEMES = 36000;
const RECORDS_TOP = 10;

// Lot « correctifs de l'audit Codex » (29/10/2026, défaut 1 du 22/10) : le
// serveur CHRONOMÈTRE la course. Au départ, l'appli demande un ticket
// (api/records.php, « depart ») ; le serveur le date. À l'arrivée, le temps
// annoncé ne peut pas être plus court que ce que le serveur a vu passer
// entre le ticket et l'envoi, à MARGE_COURSE_DIXIEMES près (le départ est
// daté à la seconde, et le chrono de l'appli part à la première question,
// après le ticket et le décompte 3-2-1 : pour une vraie course, le serveur
// a TOUJOURS mesuré plus que l'appli). Un temps envoyé sans ticket, avec un
// ticket inconnu, d'un autre élève, périmé ou déjà servi est refusé (400).
// Ce que ça ferme : « 25 justes en 10 s » en une requête (reproduit par
// Codex). Ce que ça ne ferme pas, et qu'on assume (décision du 14/10, « on
// accepte et le professeur retire ») : un client bricolé qui prend un ticket,
// attend dix secondes et envoie dix secondes — le serveur ne vérifie pas les
// 25 réponses. La couronne reste lue dans la progression (choix assumé).
const MARGE_COURSE_DIXIEMES = 20;

// Vrai si le temps annoncé tient dans ce que le serveur a mesuré depuis le
// départ ($depart, epoch en secondes) — à part, pour être testé seul.
function temps_plausible_depuis(int $depart, int $dixiemes, ?int $maintenant = null): bool
{
    $ecoule = (($maintenant ?? time()) - $depart) * 10;
    return $dixiemes <= $ecoule + MARGE_COURSE_DIXIEMES;
}

// Lot « le tirage des questions » (09/10/2026, décision de Gwenaël) : les
// séries de la course ont changé (25 calculs tous différents, ×1 et ×10 une
// fois chacun au plus) — un peu plus dures, plus égales d'une course à
// l'autre. Les records REPARTENT À ZÉRO, sans rien effacer : un temps fait
// avant RECORDS_DEPUIS ne compte plus, ni dans la ligue ni comme record de
// l'élève, et sa course suivante le remplace, quelle qu'elle soit. Même
// écriture que meilleur_le (instant_precis) : les deux se comparent comme
// des chaînes. config.php peut la remplacer (« records_depuis ») — seuls les
// tests s'en servent, le serveur garde la constante.
//
// Correction du 11/10/2026 (lot « records-depart ») : la date était le
// 10/10 à 0 h, mais le nouveau tirage n'est arrivé en ligne que le 10/10 au
// soir (fusion à 19 h 23, puis quelques minutes de publication du site). Les
// courses du samedi entre 0 h et 19 h 23, courues avec l'ANCIEN tirage,
// comptaient donc encore. Le départ est maintenant le 10/10 à 20 h (heure de
// La Réunion), juste après la mise en ligne. Comme avant, rien n'est effacé.
const RECORDS_DEPUIS = '2026-10-10T16:00:00.000000Z'; // le 10/10/2026 à 20 h, heure de La Réunion

function records_depuis(): string
{
    $valeur = config()['records_depuis'] ?? null;
    return is_string($valeur) ? $valeur : RECORDS_DEPUIS;
}

// Les temps gardés en base, comptés : ceux de la saison en cours (faits
// depuis records_depuis()) et les plus anciens, qui ne comptent plus mais ne
// sont pas effacés. Pour verifier.php : sans ce partage, la ligne « Les
// records » comptait les anciens temps avec les nouveaux, et on pouvait
// croire que la remise à zéro n'avait pas marché.
function compter_temps_par_saison(PDO $pdo): array
{
    $requete = $pdo->prepare('SELECT
        SUM(CASE WHEN meilleur_le >= ? THEN 1 ELSE 0 END) AS saison,
        SUM(CASE WHEN meilleur_le >= ? THEN 0 ELSE 1 END) AS anciens
        FROM records WHERE meilleur IS NOT NULL');
    $depuis = records_depuis();
    $requete->execute([$depuis, $depuis]);
    $ligne = $requete->fetch();
    $requete->closeCursor();
    return ['saison' => (int)($ligne['saison'] ?? 0), 'anciens' => (int)($ligne['anciens'] ?? 0)];
}

// Un temps de la saison en cours : fait depuis records_depuis().
function temps_de_la_saison(?array $ligne): bool
{
    return $ligne !== null && $ligne['meilleur'] !== null && strcmp((string)$ligne['meilleur_le'], records_depuis()) >= 0;
}

// L'instant d'un record, à la microseconde : deux records à la même seconde
// (deux élèves en salle informatique) doivent encore se départager — le
// premier arrivé devant. C'est le seul usage de cet instant.
function instant_precis(): string
{
    $maintenant = microtime(true);
    return gmdate('Y-m-d\TH:i:s', (int)floor($maintenant)) . sprintf('.%06d', (int)round(($maintenant - floor($maintenant)) * 1000000) % 1000000) . 'Z';
}

// Le jour d'une course (lot « après l'audit GPT », D8, 14/10/2026) : l'appli
// l'envoie avec le temps, pour qu'une course faite hors ligne (le dimanche
// soir, envoyée le lundi) entre dans SA semaine. C'est une donnée venue du
// téléphone : le serveur ne garde qu'un jour écrit « AAAA-MM-JJ », qui
// existe, pas dans le futur, et d'au plus COURSE_JOURS_MAX jours en arrière
// — sinon, le jour de réception, comme avant. Il ne sert qu'à classer la
// course dans sa semaine (et à dater le record) : il ne fait entrer aucun
// temps ailleurs, et n'efface rien.
const COURSE_JOURS_MAX = 7;

function jour_de_course(mixed $brut, ?string $aujourdhui = null): string
{
    $aujourdhui = $aujourdhui ?? jour_local();
    if (!is_string($brut) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $brut) !== 1) return $aujourdhui;
    $fuseau = new DateTimeZone(FUSEAU);
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $brut, $fuseau);
    if ($date === false || $date->format('Y-m-d') !== $brut) return $aujourdhui;
    $limite = DateTimeImmutable::createFromFormat('!Y-m-d', $aujourdhui, $fuseau);
    if ($limite === false) return $aujourdhui;
    if ($date > $limite) return $aujourdhui;
    if ($date < $limite->modify('-' . COURSE_JOURS_MAX . ' days')) return $aujourdhui;
    return $brut;
}

// L'instant d'un record couru un autre jour que celui de la réception : le
// jour de la course, à l'heure de réception — il se compare aux autres
// records (ordre des ex æquo, saison) et se lit (meilleurLe) comme les
// autres. Le jour de réception : l'instant précis, comme avant.
function instant_de_course(string $jour, ?string $aujourdhui = null): string
{
    $instant = instant_precis();
    return $jour === ($aujourdhui ?? jour_local()) ? $instant : $jour . substr($instant, 10);
}

// La table n'existe qu'après migrer.php (ou installer.php sur une base neuve).
function records_disponibles(PDO $pdo): bool
{
    static $vu = [];
    $cle = spl_object_id($pdo);
    if (!array_key_exists($cle, $vu)) $vu[$cle] = table_existe($pdo, 'records');
    return $vu[$cle];
}

// Le lundi (jour de La Réunion) de la semaine d'un jour « AAAA-MM-JJ ».
function lundi_de(string $jour): string
{
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $jour, new DateTimeZone(FUSEAU));
    if ($date === false) $date = new DateTimeImmutable('today', new DateTimeZone(FUSEAU));
    $recul = ((int)$date->format('N')) - 1;
    return $date->modify("-$recul days")->format('Y-m-d');
}

function lundi_courant(): string
{
    return lundi_de(jour_local());
}

// Les records sont-ils ouverts à cette classe ? (Ligne SELECT * de classes.)
function records_ouverts_a_la_classe(array $classe): bool
{
    $reglages = reglages_de_classe($classe);
    return ($reglages['defi-tables']['records'] ?? true) !== false;
}

// L'élève, sa classe (entière : libellé, réglages) et le professeur
// propriétaire — ou null s'il n'existe pas.
function eleve_et_classe(PDO $pdo, int $eleveId): ?array
{
    $requete = $pdo->prepare('SELECT * FROM eleves WHERE id = ?');
    $requete->execute([$eleveId]);
    $eleve = $requete->fetch();
    $requete->closeCursor();
    if ($eleve === false) return null;
    $requete = $pdo->prepare('SELECT * FROM classes WHERE id = ?');
    $requete->execute([(int)$eleve['classe_id']]);
    $classe = $requete->fetch();
    $requete->closeCursor();
    if ($classe === false) return null;
    return ['eleve' => $eleve, 'classe' => $classe, 'prof_id' => (int)$classe['prof_id']];
}

// Une Légende des tables : la couronne est dans sa progression Défi tables.
// Le serveur ne lit QUE cette clé, déclarée au catalogue (« expert »,
// « couronne ») ; il ne comprend rien d'autre de la progression.
function est_legende(PDO $pdo, int $eleveId): bool
{
    $requete = $pdo->prepare("SELECT donnees FROM progressions WHERE eleve_id = ? AND appli = 'defi-tables'");
    $requete->execute([$eleveId]);
    $donnees = $requete->fetchColumn();
    $requete->closeCursor();
    if (!is_string($donnees)) return false;
    $objet = json_decode($donnees, false);
    if (!is_object($objet) || !isset($objet->expert) || !is_object($objet->expert)) return false;
    $couronne = $objet->expert->couronne ?? null;
    return is_string($couronne) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $couronne) === 1;
}

// La ligne records d'un élève, lue : null si rien n'a jamais été enregistré.
function record_de(PDO $pdo, int $eleveId): ?array
{
    $requete = $pdo->prepare('SELECT * FROM records WHERE eleve_id = ?');
    $requete->execute([$eleveId]);
    $ligne = $requete->fetch();
    $requete->closeCursor();
    return $ligne === false ? null : $ligne;
}

// Le record d'un élève tel que l'appli et la page prof le lisent : le temps
// de la semaine n'est rendu que s'il est de la semaine EN COURS ; un temps
// d'avant records_depuis() n'est pas rendu du tout (ni l'un ni l'autre).
function record_affichable(?array $ligne, ?string $lundi = null): array
{
    $lundi = $lundi ?? lundi_courant();
    $saison = temps_de_la_saison($ligne);
    $meilleur = $saison ? (int)$ligne['meilleur'] : null;
    $semaine = !$saison || $ligne['semaine'] === null || (string)$ligne['semaine_lundi'] !== $lundi ? null : (int)$ligne['semaine'];
    return [
        'meilleur' => $meilleur,
        // Le jour du record, pas l'instant : l'instant ne sert qu'au tri.
        'meilleurLe' => $meilleur === null ? null : substr((string)$ligne['meilleur_le'], 0, 10),
        'semaine' => $semaine,
        'lundi' => $semaine === null ? null : $lundi,
        'nom' => $ligne === null || $ligne['nom'] === null ? null : ((int)$ligne['nom'] === 1),
    ];
}

// Enregistre une course : le temps devient le record s'il est meilleur, et
// le temps de la semaine s'il est meilleur ou si la semaine a changé. Rend
// ['nouveau' => bool, 'avant' => dixièmes ou null, 'record' => …].
// Tout ou rien, sous le verrou de la ligne (deux onglets, deux fins de
// course à la même seconde : la seconde relit ce que la première a écrit).
// $jour (D8) : le jour de la course, déjà passé par jour_de_course() — la
// course entre dans la semaine de CE jour. Une course d'une semaine passée
// ne touche pas au temps de la semaine en cours ; une course d'une semaine
// plus récente que celle gardée ouvre la nouvelle semaine, comme avant.
// $consommer (relecture Codex du 29/10/2026, R3) : ce qui consomme le ticket
// de course, joué DANS la transaction, après le verrou de la ligne — rend
// faux si le ticket a déjà servi (deux envois ensemble : un seul entre). Un
// échec de l'écriture annule aussi la consommation : la course se renvoie
// avec le même ticket quand la base revient. Rend ['ticket' => false] si le
// ticket n'a pas pu être consommé.
function enregistrer_course(PDO $pdo, int $eleveId, int $dixiemes, ?string $jour = null, ?callable $consommer = null): array
{
    return avec_reprise($pdo, function () use ($pdo, $eleveId, $dixiemes, $jour, $consommer): array {
        $aujourdhui = jour_local();
        $jour = $jour ?? $aujourdhui;
        $lundiCourant = lundi_de($aujourdhui);
        $lundi = lundi_de($jour);
        $instant = instant_de_course($jour, $aujourdhui);
        transaction_ouvrir($pdo);
        try {
            $requete = $pdo->prepare('SELECT * FROM records WHERE eleve_id = ?' . pour_mise_a_jour($pdo));
            $requete->execute([$eleveId]);
            $ligne = $requete->fetch();
            $requete->closeCursor();
            if ($consommer !== null && !$consommer()) {
                transaction_annuler($pdo);
                return ['ticket' => false];
            }
            if ($ligne === false) {
                $pdo->prepare('INSERT INTO records (eleve_id, meilleur, meilleur_le, semaine, semaine_lundi, nom, maj_le) VALUES (?, ?, ?, ?, ?, NULL, ?)')
                    ->execute([$eleveId, $dixiemes, $instant, $dixiemes, $lundi, maintenant()]);
                transaction_valider($pdo);
                return ['nouveau' => true, 'avant' => null, 'record' => record_affichable(record_de($pdo, $eleveId), $lundiCourant)];
            }
            // Un temps d'avant records_depuis() ne compte plus : cette course
            // le remplace, comme une première course.
            $saison = temps_de_la_saison($ligne);
            $avant = $saison ? (int)$ligne['meilleur'] : null;
            $nouveau = $avant === null || $dixiemes < $avant;
            $meilleur = $nouveau ? $dixiemes : $avant;
            $meilleurLe = $nouveau ? $instant : $ligne['meilleur_le'];
            $lundiGarde = $saison && $ligne['semaine'] !== null ? (string)$ligne['semaine_lundi'] : '';
            if ($lundiGarde !== '' && strcmp($lundi, $lundiGarde) < 0) {
                // Une course d'une semaine déjà passée : la semaine gardée reste.
                $semaine = (int)$ligne['semaine'];
                $semaineLundi = $lundiGarde;
            } else {
                $semaineAvant = $lundiGarde === $lundi ? (int)$ligne['semaine'] : null;
                $semaine = $semaineAvant === null || $dixiemes < $semaineAvant ? $dixiemes : $semaineAvant;
                $semaineLundi = $lundi;
            }
            $pdo->prepare('UPDATE records SET meilleur = ?, meilleur_le = ?, semaine = ?, semaine_lundi = ?, maj_le = ? WHERE eleve_id = ?')
                ->execute([$meilleur, $meilleurLe, $semaine, $semaineLundi, maintenant(), $eleveId]);
            transaction_valider($pdo);
            return ['nouveau' => $nouveau, 'avant' => $avant, 'record' => record_affichable(record_de($pdo, $eleveId), $lundiCourant)];
        } catch (Throwable $e) {
            transaction_annuler($pdo);
            throw $e;
        }
    });
}

// Le choix du nom : prénom (true) ou Mystère (false). Une ligne sans course
// est créée au besoin (l'élève choisit avant sa première course, puis la
// course de la couronne peut arriver après).
function choisir_nom(PDO $pdo, int $eleveId, bool $prenom): array
{
    $instant = maintenant();
    $pdo->prepare('UPDATE records SET nom = ?, maj_le = ? WHERE eleve_id = ?')->execute([$prenom ? 1 : 0, $instant, $eleveId]);
    if (record_de($pdo, $eleveId) === null) {
        try {
            $pdo->prepare('INSERT INTO records (eleve_id, meilleur, meilleur_le, semaine, semaine_lundi, nom, maj_le) VALUES (?, NULL, NULL, NULL, NULL, ?, ?)')
                ->execute([$eleveId, $prenom ? 1 : 0, $instant]);
        } catch (PDOException $e) {
            if (!doublon($e)) throw $e;
            $pdo->prepare('UPDATE records SET nom = ?, maj_le = ? WHERE eleve_id = ?')->execute([$prenom ? 1 : 0, $instant, $eleveId]);
        }
    }
    return record_affichable(record_de($pdo, $eleveId));
}

// « Retirer ce temps » (lot « après l'audit GPT », D4 — décision de Gwenaël,
// 14/10/2026) : le serveur fait confiance à l'appli pour le temps d'une
// course ; un élève qui sait forger une requête peut s'inventer un record.
// Plutôt qu'une refonte, le professeur propriétaire efface le temps depuis
// Ma classe : le record et le temps de la semaine s'en vont, le CHOIX DU NOM
// reste, et la ligne reste (sa prochaine course compte comme une première).
// Rend vrai si un temps a été effacé.
function retirer_temps(PDO $pdo, int $eleveId): bool
{
    if (!records_disponibles($pdo)) return false;
    $requete = $pdo->prepare('UPDATE records SET meilleur = NULL, meilleur_le = NULL, semaine = NULL, semaine_lundi = NULL, maj_le = ?
        WHERE eleve_id = ? AND meilleur IS NOT NULL');
    $requete->execute([maintenant(), $eleveId]);
    return $requete->rowCount() > 0;
}

function oublier_record_de_l_eleve(PDO $pdo, int $eleveId): void
{
    if (!records_disponibles($pdo)) return;
    $pdo->prepare('DELETE FROM records WHERE eleve_id = ?')->execute([$eleveId]);
}

// Le nom affiché d'une ligne : le prénom (avec l'initiale quand un autre
// prénom identique est affiché dans la ligue — « Léa B. »), ou « Mystère ».
// Jamais la classe (décision de Gwenaël, 09/10/2026) ; un élève que son
// professeur n'a pas encore nommé s'appelle « Élève ».
function noms_affiches(array $lignes): array
{
    $comptes = [];
    foreach ($lignes as $ligne) {
        if ((int)($ligne['nom'] ?? 0) !== 1) continue;
        $cle = mb_strtolower(trim((string)$ligne['prenom']));
        if ($cle === '') continue;
        $comptes[$cle] = ($comptes[$cle] ?? 0) + 1;
    }
    $noms = [];
    foreach ($lignes as $ligne) {
        $id = (int)$ligne['eleve_id'];
        if ((int)($ligne['nom'] ?? 0) !== 1) { $noms[$id] = 'Mystère'; continue; }
        $prenom = trim((string)$ligne['prenom']);
        if ($prenom === '') { $noms[$id] = 'Élève'; continue; }
        $initiale = trim((string)$ligne['initiale']);
        $homonyme = ($comptes[mb_strtolower($prenom)] ?? 0) > 1;
        $noms[$id] = $homonyme && $initiale !== '' ? "$prenom $initiale." : $prenom;
    }
    return $noms;
}

// La ligue d'un professeur : ses classes (celles qu'il possède, records
// ouverts), leurs Légendes qui ont un temps. Rend les deux tableaux (top 10
// chacun) et, si $eleveId est donné, SA place dans chacun (« moi » sur sa
// ligne, « rangSemaine » / « rangToujours », null hors classement).
// Ex æquo : le premier arrivé devant (l'instant du record) ; pour la
// semaine, le temps de la semaine n'a pas d'instant propre — à égalité, le
// record le plus ancien d'abord, puis le prénom.
// $pourProf (lot « après l'audit GPT », D4, 14/10/2026) : la ligue lue par
// le PROFESSEUR porte, sur chaque ligne, l'élève derrière le nom affiché
// (« eleve » : id, prénom saisi, classe) — pour « Retirer ce temps » et sa
// confirmation. Jamais rendu à un élève : la ligue de l'appli reste nom + temps.
function ligue(PDO $pdo, int $profId, ?int $eleveId = null, bool $pourProf = false): array
{
    $lundi = lundi_courant();
    // La colonne des réglages n'existe qu'après migrer.php (lot
    // « splat-suivi-5 ») : sans elle, toutes les classes ont les records ouverts.
    $colonneReglages = reglages_disponibles($pdo) ? ', c.reglages' : ', NULL AS reglages';
    $requete = $pdo->prepare(
        'SELECT r.eleve_id, r.meilleur, r.meilleur_le, r.semaine, r.semaine_lundi, r.nom, e.prenom, e.initiale, c.libelle' . $colonneReglages . '
         FROM records r
         JOIN eleves e ON e.id = r.eleve_id
         JOIN classes c ON c.id = e.classe_id
         WHERE c.prof_id = ? AND r.meilleur IS NOT NULL'
    );
    $requete->execute([$profId]);
    $lignes = [];
    foreach ($requete->fetchAll() as $ligne) {
        // Une classe aux records fermés n'apparaît pas (ses élèves ne les
        // voient pas non plus).
        if (!records_ouverts_a_la_classe(['reglages' => $ligne['reglages']])) continue;
        // Un temps d'avant records_depuis() non plus (les records repartent
        // à zéro avec le nouveau tirage, lot du 09/10/2026).
        if (!temps_de_la_saison($ligne)) continue;
        $lignes[] = $ligne;
    }
    $noms = noms_affiches($lignes);
    $toujours = $lignes;
    usort($toujours, fn(array $a, array $b): int => [(int)$a['meilleur'], (string)$a['meilleur_le'], $noms[(int)$a['eleve_id']]]
        <=> [(int)$b['meilleur'], (string)$b['meilleur_le'], $noms[(int)$b['eleve_id']]]);
    $semaine = array_values(array_filter($lignes, fn(array $l): bool => $l['semaine'] !== null && (string)$l['semaine_lundi'] === $lundi));
    usort($semaine, fn(array $a, array $b): int => [(int)$a['semaine'], (string)$a['meilleur_le'], $noms[(int)$a['eleve_id']]]
        <=> [(int)$b['semaine'], (string)$b['meilleur_le'], $noms[(int)$b['eleve_id']]]);
    $rendre = function (array $classees, string $champ) use ($noms, $eleveId, $pourProf): array {
        $sortie = ['lignes' => [], 'rang' => null, 'total' => count($classees)];
        foreach ($classees as $index => $ligne) {
            $id = (int)$ligne['eleve_id'];
            $moi = $eleveId !== null && $id === $eleveId;
            if ($moi) $sortie['rang'] = $index + 1;
            if ($index < RECORDS_TOP) {
                $rendu = ['rang' => $index + 1, 'nom' => $noms[$id], 'temps' => (int)$ligne[$champ], 'moi' => $moi];
                if ($pourProf) {
                    $prenom = trim((string)$ligne['prenom']);
                    $rendu['eleve'] = ['id' => $id, 'prenom' => $prenom === '' ? 'Élève' : $prenom, 'classe' => (string)$ligne['libelle']];
                }
                $sortie['lignes'][] = $rendu;
            }
        }
        return $sortie;
    };
    $tableauSemaine = $rendre($semaine, 'semaine');
    $tableauToujours = $rendre($toujours, 'meilleur');
    return [
        'lundi' => $lundi,
        'semaine' => $tableauSemaine['lignes'],
        'toujours' => $tableauToujours['lignes'],
        'rangSemaine' => $tableauSemaine['rang'],
        'rangToujours' => $tableauToujours['rang'],
        'totalSemaine' => $tableauSemaine['total'],
        'totalToujours' => $tableauToujours['total'],
    ];
}
