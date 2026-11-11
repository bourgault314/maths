<?php
// API prof : connexion, comptes, classes, partages, codes élèves, tableau.
// Tout passe par POST + un jeton de session obtenu par « connexion ».
//
// Cloisonnement : une classe appartient à un professeur (classes.prof_id).
// Un collègue n'y accède que si le propriétaire la lui a partagée
// (table partages, droit « lecture » ou « ecriture »). Aucune action ne fait
// confiance au classe_id reçu : l'accès est vérifié à chaque fois, et pour les
// actions sur un élève c'est la classe de l'élève qui décide.

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/billets.php';
require_once __DIR__ . '/../lib/archives.php';
require_once __DIR__ . '/../lib/versions.php';
require_once __DIR__ . '/../lib/journal.php';
require_once __DIR__ . '/../lib/applis.php';
require_once __DIR__ . '/../lib/records.php';
require_once __DIR__ . '/../lib/direct.php';
require_once __DIR__ . '/../lib/evaluation.php';

const MAX_ELEVES_PAR_LOT = 60;
// L'ordre de cette liste est celui des activités dans la liste d'une classe
// (array_intersect le garde) : celui du catalogue, lib/applis.php. Une appli
// absente d'ici est retirée EN SILENCE de la liste d'une classe à sa création
// ou à sa modification (vérifié au banc, 21/10/2026) : toute appli ouverte au
// catalogue doit y être.
// « cours » (lot « cours-appli », 08/11/2026) : l'appli Cours se propose à
// une classe comme les autres ; elle n'a pas de progression (le tableau de
// son onglet n'a que les prénoms) et ne se donne pas par élève.
const APPLIS_PROPOSABLES = ['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat', 'cours'];
const DROITS_PARTAGE = ['lecture', 'ecriture'];

// ------------------------------------------------------------------- quotas
//
// Lot 11 (05/09/2026). Rien n'a jamais débordé, mais rien ne l'empêchait non
// plus : une session volée, ou simplement un clic resté enfoncé, pouvait créer
// des classes et des élèves jusqu'à remplir les 250 Mo de l'hébergement — et
// une base pleine, c'est le suivi de TOUTE la classe qui s'arrête. Les deux
// bornes sont très au-dessus d'un usage réel (un professeur de collège a
// quatre à six classes de trente) : elles n'arrêtent que ce qui n'est pas un
// usage.
const MAX_CLASSES_PAR_PROF = 40;
const MAX_ELEVES_PAR_CLASSE = 200;

// ------------------------------------------------------- droits × actions
//
// Lot 11 (05/09/2026) : QUI a le droit de faire QUOI, écrit à un seul endroit.
//
// Avant, le droit exigé était choisi action par action, au fil du code — et
// deux actions s'étaient glissées dans « écriture » sans que personne l'ait
// décidé : supprimer un élève (avec sa progression, définitivement) et
// renommer la classe. Le README, lui, promettait à un collègue en écriture
// « ajouter des élèves, saisir les prénoms et donner un nouveau code », rien de
// plus. Décision de Gwenaël (05/09) : le code s'aligne sur la promesse, plus
// « Version précédente » (dépanner un élève sans le déranger) ; supprimer un
// élève et renommer la classe redeviennent réservés au PROPRIÉTAIRE.
//
// Cette table est la seule source : chaque case a son test (tests/lancer.php).
// Une action de classe absente d'ici est refusée, pas devinée.
const DROIT_PAR_ACTION = [
    // Lecture : voir, sans jamais rien changer ni recevoir un code.
    'tableau' => 'lecture',
    'partages.liste' => 'lecture',
    'eleves.fiche' => 'lecture',
    // Écriture : préparer la classe et dépanner un élève.
    'eleves.ajouter' => 'ecriture',
    'eleves.nommer' => 'ecriture',
    'eleves.regenerer' => 'ecriture',
    'eleves.restaurer' => 'ecriture',
    // Propriétaire : ce qui efface, et ce qui change la classe elle-même.
    'classes.modifier' => 'proprietaire',
    'classes.supprimer' => 'proprietaire',
    // Lot serveur A (06/09/2026) : la suppression des classes de l'année
    // écoulée, demandée par le professeur depuis le bandeau de « Ma classe ».
    // Elle efface : propriétaire, comme « Supprimer la classe ».
    'classes.supprimer_echues' => 'proprietaire',
    'eleves.supprimer' => 'proprietaire',
    // Lot « Qui voit quoi » (22/10/2026, décision de Gwenaël) : ouvrir à UN
    // élève une appli ou des mondes en plus de sa classe. C'est décider ce
    // que voit un élève, comme ⚙ Réglages décide pour la classe : le
    // propriétaire seulement. Un collègue en écriture voit la colonne
    // « En plus » (tableau), sans pouvoir la changer.
    'eleves.acces' => 'proprietaire',
    // Lot « après l'audit GPT » (D4, 14/10/2026) : effacer le temps d'une
    // Légende dans les records — ça efface : propriétaire.
    'records.retirer' => 'proprietaire',
    'partages.ajouter' => 'proprietaire',
    'partages.supprimer' => 'proprietaire',
    // Séance en direct (07/10/2026). Mener une séance, c'est faire répondre
    // les élèves et recevoir leurs réponses avec leurs prénoms : écriture. Un
    // collègue en lecture seule ne voit ni la séance ni son fichier.
    'direct.etat' => 'ecriture',
    'direct.ouvrir' => 'ecriture',
    'direct.question' => 'ecriture',
    'direct.devoiler' => 'ecriture',
    'direct.bonne' => 'ecriture',
    'direct.fichier' => 'ecriture',
    'direct.terminer' => 'ecriture',
    // Lot E1 « les évaluations en classe » (15/10/2026) : mêmes droits que la
    // question éclair — propriétaire et collègues en écriture ouvrent, ferment
    // et reçoivent le fichier (des prénoms à côté de réponses). Les MODÈLES,
    // eux, n'ont pas de classe : ils appartiennent au compte (evaluation.modeles,
    // evaluation.enregistrer_modele, evaluation.supprimer_modele).
    'evaluation.etat' => 'ecriture',
    'evaluation.ouvrir' => 'ecriture',
    'evaluation.fermer' => 'ecriture',
    'evaluation.fichier' => 'ecriture',
    'evaluation.terminer' => 'ecriture',
    // Lot E2 (15/10/2026) : « Faire repasser » un élève de l'évaluation
    // ouverte — ça efface SON passage, pour qu'il recommence : écriture,
    // comme le reste de l'évaluation (c'est un dépannage en classe, pas une
    // suppression de données de la classe).
    'evaluation.repasser' => 'ecriture',
];

// Les actions réservées au compte administrateur (gestion des comptes prof).
// Elles ne portent sur aucune classe : elles ne passent pas par la table
// ci-dessus, mais elles sont listées ici pour que « qui peut quoi » tienne en
// un seul endroit lisible.
const ACTIONS_ADMIN = [
    'profs.liste', 'profs.ajouter', 'profs.supprimer',
    'profs.reinitialiser', 'profs.desactiver', 'profs.reactiver',
];

// Le droit qu'exige une action portant sur une classe.
function droit_requis(string $action): string
{
    $droit = DROIT_PAR_ACTION[$action] ?? null;
    if ($droit === null) erreur("Action inconnue.", 400);
    return $droit;
}

cors();

// Le texte que le serveur accepte de ranger : espaces compactés, longueur
// bornée, et — lot 11 — plus aucun caractère de commande ni caractère de mise
// en forme invisible (U+200B…U+200F, U+2060…, marques de sens d'écriture).
// Ils ne servent à rien dans un nom de classe et se cachent dans une liste
// collée depuis un tableur ou une page web.
function texte(mixed $valeur, int $max): string
{
    $texte = is_string($valeur) ? $valeur : '';
    // Caractères de commande (C0 et C1) et caractères invisibles de mise en
    // forme : retirés, pas remplacés par un espace.
    $texte = preg_replace('/[\x{0000}-\x{0008}\x{000B}\x{000C}\x{000E}-\x{001F}\x{007F}-\x{009F}\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{FEFF}]/u', '', $texte) ?? '';
    $texte = preg_replace('/\s+/u', ' ', $texte) ?? '';
    return mb_substr(trim($texte), 0, $max);
}

// Un PRÉNOM d'élève. En plus du nettoyage ci-dessus : ni « < » ni « > ».
//
// Lot 11 (05/09/2026), défense en profondeur. Il n'y a pas de faille
// aujourd'hui — la page prof n'écrit jamais un prénom par innerHTML, et sa
// politique de contenu à nonce neutraliserait un gestionnaire d'évènement en
// ligne. Mais l'audit du 01/09 a montré qu'on peut ENREGISTRER
// « <img src=x onerror=…> » comme prénom : la sûreté ne tient alors qu'à la
// discipline de tous les affichages futurs. Un prénom n'a aucune raison de
// porter du HTML : on le refuse à l'entrée, une fois pour toutes.
function texte_prenom(mixed $valeur, int $max): string
{
    return texte(str_replace(['<', '>'], '', is_string($valeur) ? $valeur : ''), $max);
}

// Le nom d'une appli reçu du client. Lot 11 (A-annexe 9) : un client qui envoie
// un tableau au lieu d'un texte obtenait la bonne réponse (400) mais laissait
// « PHP Warning: Array to string conversion » dans le journal du serveur — du
// bruit qui masque les vraies pannes.
function appli_recue(mixed $valeur): string
{
    return is_string($valeur) ? $valeur : 'defi-tables';
}

// Le compte connecté : identifiant, droit d'administration, mot de passe
// temporaire. Un compte désactivé entre-temps est traité comme une session
// expirée (ses sessions sont fermées à la désactivation ; ceci est la
// deuxième ceinture).
function prof_courant(PDO $pdo, int $profId): array
{
    $requete = $pdo->prepare('SELECT id, identifiant, admin, actif, mdp_temporaire FROM profs WHERE id = ?');
    $requete->execute([$profId]);
    $prof = $requete->fetch();
    if ($prof === false || (int)$prof['actif'] !== 1) erreur("Session expirée, reconnecte-toi.", 401);
    return [
        'id' => (int)$prof['id'],
        'identifiant' => (string)$prof['identifiant'],
        'admin' => (int)$prof['admin'] === 1,
        'mdp_temporaire' => (int)$prof['mdp_temporaire'] === 1,
    ];
}

function exiger_admin(array $prof): void
{
    if (!$prof['admin']) erreur("Seul le compte administrateur peut gérer les professeurs.", 403);
}

// Lot 11 : la deuxième moitié de la matrice. Toute action de la liste
// ACTIONS_ADMIN passe par ici AVANT d'entrer dans son cas — un « exiger_admin »
// oublié dans un cas ne peut plus ouvrir une porte, et le test qui parcourt la
// liste le prouve action par action.
function garder_actions_admin(PDO $pdo, array $prof, string $action): void
{
    if (!in_array($action, ACTIONS_ADMIN, true)) return;
    if (!$prof['admin']) {
        journaliser($pdo, $prof['id'], $action, 'compte', 0, 'refus');
    }
    exiger_admin($prof);
}

// Serveur pro, lot 5e (25/10/2026, décision de Gwenaël) : la séance en direct
// est réservée au compte administrateur tant que lib/direct.php le dit
// (DIRECT_RESERVE_A_L_ADMINISTRATEUR). C'est ICI que ça se décide, pas dans la
// page : prof/direct.php s'ouvre par son adresse, et un appel peut se faire à
// la main. Toutes les actions direct.* passent par ici AVANT leur cas, avant
// même de lire la classe — un collègue n'apprend rien sur aucune classe. Le
// droit sur la classe (DROIT_PAR_ACTION, écriture) s'ajoute ensuite, sans
// changement. Les évaluations (evaluation.*) ne sont pas concernées.
// « raison » laisse le tableau dire la phrase au lieu de repartir sans un mot.
const MESSAGE_DIRECT_RESERVE = "La séance en direct n’est pas encore ouverte aux collègues.";
function garder_direct_reserve(PDO $pdo, array $prof, string $action): void
{
    if (!str_starts_with($action, 'direct.')) return;
    if (direct_ouvert_au_compte($prof['admin'])) return;
    // Journalisé comme garder_actions_admin (direct.etat, l'interrogation en
    // boucle, n'est jamais journalisée : lib/journal.php l'ignore).
    journaliser($pdo, $prof['id'], $action, 'compte', 0, 'refus');
    repondre(['ok' => false, 'erreur' => MESSAGE_DIRECT_RESERVE, 'raison' => 'direct_reserve'], 403);
}

// Le mode de la séance ouverte d'une classe, tel que CE compte doit le voir :
// une question éclair qu'il ne peut pas mener ne s'affiche pas (« ● En
// direct », « Reprendre » le mèneraient à un refus) ; une évaluation, si.
function mode_direct_visible(?string $mode, array $prof): ?string
{
    if ($mode === 'eclair' && !direct_ouvert_au_compte($prof['admin'])) return null;
    return $mode;
}

// Un autre compte que le sien, pour les actions d'administration : on ne se
// réinitialise pas, on ne se désactive pas soi-même (l'administrateur unique
// se retrouverait dehors, sans personne pour le faire rentrer).
function autre_prof(PDO $pdo, array $prof, mixed $profIdBrut): array
{
    $autreId = (int)$profIdBrut;
    if ($autreId === $prof['id']) erreur("Pas sur ton propre compte : passe par « Mon compte ».", 400);
    $requete = $pdo->prepare('SELECT id, identifiant, actif FROM profs WHERE id = ?');
    $requete->execute([$autreId]);
    $autre = $requete->fetch();
    if ($autre === false) erreur("Professeur introuvable.", 404);
    return ['id' => (int)$autre['id'], 'identifiant' => (string)$autre['identifiant'], 'actif' => (int)$autre['actif'] === 1];
}

// Renvoie la classe si ce professeur y a droit, et refuse sinon.
// $besoin vaut 'lecture', 'ecriture' ou 'proprietaire'.
// Une classe à laquelle il n'a aucun droit est déclarée introuvable : on ne
// révèle pas l'existence des classes des collègues.
//
// $action, depuis le lot serveur A : le nom de l'action, pour que le REFUS
// s'inscrive au journal (lib/journal.php). C'est le seul endroit où l'on
// verrait un collègue en lecture seule essayer d'écrire — et c'est justement
// ce qu'un registre doit pouvoir montrer. Le « introuvable » (404), lui, n'est
// pas journalisé : il ne dit rien, par construction.
function acces_classe(PDO $pdo, int $profId, mixed $classeIdBrut, string $besoin, ?string $action = null): array
{
    $classeId = (int)$classeIdBrut;
    $requete = $pdo->prepare('SELECT * FROM classes WHERE id = ?');
    $requete->execute([$classeId]);
    $classe = $requete->fetch();
    if ($classe === false) erreur("Introuvable.", 404);

    if ((int)$classe['prof_id'] === $profId) {
        $classe['droit'] = 'proprietaire';
    } else {
        $requete = $pdo->prepare('SELECT droit FROM partages WHERE classe_id = ? AND prof_id = ?');
        $requete->execute([$classeId, $profId]);
        $droit = $requete->fetchColumn();
        if ($droit === false) erreur("Introuvable.", 404);
        $classe['droit'] = in_array($droit, DROITS_PARTAGE, true) ? $droit : 'lecture';
    }

    if ($besoin === 'proprietaire' && $classe['droit'] !== 'proprietaire') {
        if ($action !== null) journaliser($pdo, $profId, $action, 'classe', $classeId, 'refus');
        erreur("Cette classe ne t'appartient pas : seul son propriétaire peut faire cela.", 403);
    }
    if ($besoin === 'ecriture' && $classe['droit'] === 'lecture') {
        if ($action !== null) journaliser($pdo, $profId, $action, 'classe', $classeId, 'refus');
        erreur("Cette classe t'est partagée en lecture seule.", 403);
    }
    return $classe;
}

// Pour toute action sur un élève : on remonte à SA classe et on vérifie là, avec
// le droit que la matrice exige pour cette action — jamais le classe_id envoyé
// par le navigateur. La classe vérifiée est rendue sous « classe » (lot « Qui
// voit quoi » : eleves.acces calcule « classe + ajouts » sans relire la base).
function eleve_pour_action(PDO $pdo, int $profId, mixed $eleveIdBrut, string $action): array
{
    $eleveId = (int)$eleveIdBrut;
    $requete = $pdo->prepare('SELECT id, classe_id, code FROM eleves WHERE id = ?');
    $requete->execute([$eleveId]);
    $eleve = $requete->fetch();
    // Même message qu'une classe interdite : un professeur connecté ne doit
    // pas pouvoir distinguer « n'existe pas » de « appartient à un collègue ».
    if ($eleve === false) erreur("Introuvable.", 404);
    $eleve['classe'] = acces_classe($pdo, $profId, (int)$eleve['classe_id'], droit_requis($action), $action);
    return $eleve;
}

// La restauration écrit dans la même ligne que l'appli de l'élève, avec le
// même verrou qu'elle (lib/bd.php, lot 6) : la ligne est verrouillée le temps
// de lire la version précédente et de l'écrire, et l'UPDATE ne passe que si
// la révision lue est encore celle en base. Avant, un SELECT sans verrou puis
// un UPDATE sans condition pouvaient attribuer deux fois le même numéro de
// révision quand l'élève enregistrait au même instant : l'une des deux
// écritures — le plus souvent la restauration — disparaissait sans un mot.
// Renvoie ['rien' => true] s'il n'y a rien à restaurer, ['inconnu' => true] si
// le jour demandé n'existe pas (ou plus) dans l'historique, ['conflit' => true]
// si la ligne a bougé sous le verrou (ne devrait pas arriver : garde-fou),
// sinon ['donnees' => …, 'revision' => …].
//
// $jour, depuis le lot serveur A : « AAAA-MM-JJ » pour revenir à la fin d'une
// journée gardée (table versions, sept jours) ; null pour l'ancien
// comportement, « avant le dernier enregistrement » (progressions.donnees_avant).
//
// La ligne de la table versions n'est PAS touchée par une restauration : sinon
// on ne pourrait plus revenir une seconde fois au même jour. Ce qui est
// remplacé, c'est donnees_avant — la restauration elle-même s'annule donc d'un
// clic, comme avant. Les lignes gardent aussi leur époque d'origine : sans
// importance, puisque c'est au moment de restaurer qu'on en repose une plus
// haute (lot serveur B).
//
// Lot serveur B (06/09/2026) : ce qui est écrit n'est pas la version telle
// quelle, mais la version AVEC UNE ÉPOQUE PLUS HAUTE que l'état courant. Sans
// cela, l'appareil de l'élève — qui porte encore l'état abîmé — refusait en
// bloc la restauration à sa synchronisation suivante et rendait les dégâts :
// à époque égale, la fusion du moteur additionne au lieu de trancher. Défaut
// vu en production le jour de la mise en ligne de la PR A. Voir
// lib/progression.php, version_avec_epoque_relevee().
function restaurer_progression(PDO $pdo, int $eleveId, string $appli, ?string $jour = null): array
{
    return avec_reprise($pdo, function () use ($pdo, $eleveId, $appli, $jour): array {
        transaction_ouvrir($pdo);
        $requete = $pdo->prepare('SELECT id, donnees, donnees_avant, revision FROM progressions WHERE eleve_id = ? AND appli = ?' . pour_mise_a_jour($pdo));
        $requete->execute([$eleveId, $appli]);
        $ligne = $requete->fetch();
        $requete->closeCursor();
        if ($ligne === false) {
            transaction_annuler($pdo);
            return ['rien' => true];
        }
        if ($jour === null) {
            $vers = $ligne['donnees_avant'];
            if ($vers === null) {
                transaction_annuler($pdo);
                return ['rien' => true];
            }
        } else {
            $vers = version_du_jour($pdo, $eleveId, $appli, $jour);
            if ($vers === null) {
                transaction_annuler($pdo);
                return ['inconnu' => true];
            }
        }
        // L'époque est relevée ICI, sous le verrou : l'état courant qu'elle
        // doit dépasser est celui qu'on vient de lire, pas celui d'avant
        // l'attente.
        $vers = version_avec_epoque_relevee($appli, $vers, (string)$ligne['donnees']);
        $revision = (int)$ligne['revision'];
        $requete = $pdo->prepare('UPDATE progressions SET donnees = ?, donnees_avant = ?, revision = ?, maj_le = ? WHERE id = ? AND revision = ?');
        $requete->execute([$vers, $ligne['donnees'], $revision + 1, aujourdhui(), (int)$ligne['id'], $revision]);
        if ($requete->rowCount() !== 1) {
            transaction_annuler($pdo);
            return ['conflit' => true];
        }
        transaction_valider($pdo);
        return ['donnees' => $vers, 'revision' => $revision + 1];
    });
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        erreur("Méthode non autorisée.", 405);
    }
    $corps = corps_json(20000);
    $action = (string)($corps['action'] ?? '');
    $pdo = bd();

    if ($action === 'connexion') {
        // Seuls les ÉCHECS comptent (lot 5) : un collège entier se connecte
        // derrière une seule adresse, et treize réussites dans le quart
        // d'heure n'ont rien d'une attaque. Deux compteurs, tous deux regardés
        // AVANT le hachage pour qu'un refus ne coûte rien — mais ils ne font
        // PAS la même chose depuis le lot serveur B (constat 3 du 05/09/2026) :
        //
        //  - l'ADRESSE (60 échecs / 10 min) refuse net. C'est le seuil qui
        //    borne la dépense du serveur, et il vise une machine, pas une
        //    personne ;
        //  - l'IDENTIFIANT (12 / 10 min) ne refuse plus rien : il RALENTIT de
        //    1,5 s. Il refusait, et treize mauvais mots de passe tapés par
        //    n'importe qui, depuis n'importe où, fermaient le compte visé
        //    pendant dix minutes — au bon mot de passe compris. Un seuil qui
        //    protège un compte ne doit pas être l'outil qui le ferme.
        $identifiant = (string)($corps['identifiant'] ?? '');
        $adresse = adresse_limitee();
        $cleAdresse = 'connexion-echec:' . $adresse;
        $identifiantCompte = mb_strtolower(trim($identifiant));
        $cleIdentifiant = 'connexion-id:' . $identifiantCompte;
        limiter_deja_atteint($cleAdresse, ECHECS_CONNEXION_PAR_ADRESSE, FENETRE_ECHECS_CONNEXION);
        freiner_identifiant($identifiantCompte);
        $session = ouvrir_session($pdo, $identifiant, (string)($corps['motdepasse'] ?? ''));
        if ($session === null) {
            // Les deux compteurs avancent ; seul celui de l'adresse refuse.
            $parAdresse = compter($cleAdresse, FENETRE_ECHECS_CONNEXION);
            compter($cleIdentifiant, FENETRE_ECHECS_CONNEXION);
            if ($parAdresse > ECHECS_CONNEXION_PAR_ADRESSE) {
                refuser_trop_de_demandes($cleAdresse, FENETRE_ECHECS_CONNEXION);
            }
            erreur("Identifiant ou mot de passe incorrect.", 401);
        }
        // Journal (lot serveur A) : les connexions RÉUSSIES seulement. Les
        // échecs n'ont pas de compte fiable à nommer — c'est le limiteur qui
        // s'en occupe, et une table pleine d'identifiants essayés serait à son
        // tour un renseignement à protéger.
        journaliser($pdo, (int)prof_de_session($pdo, (string)$session['jeton']), 'connexion', 'session', 0);
        repondre(['ok' => true] + $session);
    }

    $jeton = jeton_recu($corps);
    $profId = prof_de_session($pdo, $jeton);
    if ($profId === null) {
        erreur("Session expirée, reconnecte-toi.", 401);
    }
    $prof = prof_courant($pdo, $profId);

    // Avec un mot de passe temporaire (donné par l'administrateur), on ne fait
    // rien d'autre que le changer : la page le demande, et le serveur le tient.
    if ($prof['mdp_temporaire'] && !in_array($action, ['moi', 'deconnexion', 'profs.motdepasse'], true)) {
        erreur("Choisis d'abord un nouveau mot de passe.", 403);
    }

    // La matrice, appliquée avant tout le reste : les actions de comptes au
    // compte administrateur, les actions de classe au droit que la table exige
    // (droit_requis(), appelé dans chaque cas au moment où la classe est lue).
    garder_actions_admin($pdo, $prof, $action);
    garder_direct_reserve($pdo, $prof, $action);

    switch ($action) {
        case 'deconnexion':
            journaliser($pdo, $profId, 'deconnexion', 'session', 0);
            fermer_session($pdo, $jeton);
            repondre(['ok' => true]);

        case 'moi':
            repondre(['ok' => true, 'identifiant' => $prof['identifiant'], 'admin' => $prof['admin'],
                'mdp_temporaire' => $prof['mdp_temporaire'],
                // Lot 5e : la page cache « Séance en direct » quand c'est faux.
                'direct' => direct_ouvert_au_compte($prof['admin'])]);

        // ------------------------------------------------------------ comptes profs

        case 'profs.motdepasse':
            // Douze essais par compte et par dix minutes : une session volée ne
            // sert pas à deviner l'ancien mot de passe.
            limiter('motdepasse:' . $profId, 12, 600);
            try {
                changer_motdepasse($pdo, $profId, $jeton, (string)($corps['ancien'] ?? ''), (string)($corps['nouveau'] ?? ''));
            } catch (InvalidArgumentException $e) {
                erreur($e->getMessage(), 400);
            }
            journaliser($pdo, $profId, 'motdepasse', 'compte', $profId);
            repondre(['ok' => true]);

        case 'profs.reinitialiser':
            exiger_admin($prof);
            $autre = autre_prof($pdo, $prof, $corps['prof_id'] ?? 0);
            $temporaire = reinitialiser_motdepasse($pdo, $autre['id']);
            journaliser($pdo, $profId, 'profs.reinitialiser', 'compte', $autre['id']);
            // Le mot de passe temporaire part une fois, dans cette réponse, à
            // l'administrateur qui le transmet de vive voix. Il n'est stocké
            // que haché.
            repondre(['ok' => true, 'motdepasse' => $temporaire]);

        case 'profs.desactiver':
            exiger_admin($prof);
            $autre = autre_prof($pdo, $prof, $corps['prof_id'] ?? 0);
            // Ses classes, ses élèves et leurs progressions restent en base :
            // désactiver n'est pas supprimer. Ses sessions sont fermées, et la
            // connexion lui répondra exactement comme à un mauvais mot de passe.
            $pdo->prepare('UPDATE profs SET actif = 0 WHERE id = ?')->execute([$autre['id']]);
            fermer_sessions_du_prof($pdo, $autre['id']);
            journaliser($pdo, $profId, 'profs.desactiver', 'compte', $autre['id']);
            repondre(['ok' => true]);

        case 'profs.reactiver':
            exiger_admin($prof);
            $autre = autre_prof($pdo, $prof, $corps['prof_id'] ?? 0);
            $pdo->prepare('UPDATE profs SET actif = 1 WHERE id = ?')->execute([$autre['id']]);
            journaliser($pdo, $profId, 'profs.reactiver', 'compte', $autre['id']);
            repondre(['ok' => true]);

        case 'profs.annuaire':
            // Sert à choisir un collègue dans la liste « Partager cette classe ».
            // Un compte désactivé n'y figure pas : on ne partage pas avec lui.
            $requete = $pdo->prepare('SELECT id, identifiant FROM profs WHERE id <> ? AND actif = 1 ORDER BY identifiant');
            $requete->execute([$profId]);
            $annuaire = [];
            foreach ($requete->fetchAll() as $ligne) {
                $annuaire[] = ['id' => (int)$ligne['id'], 'identifiant' => (string)$ligne['identifiant']];
            }
            repondre(['ok' => true, 'profs' => $annuaire]);

        case 'profs.liste':
            exiger_admin($prof);
            // Deux compteurs distincts : ce qu'un professeur possède, et ce qui
            // lui est prêté. Un seul chiffre laisserait croire qu'un collègue à
            // qui on vient de partager une classe n'a rien reçu.
            $lignes = $pdo->query(
                'SELECT p.id, p.identifiant, p.admin, p.actif, p.mdp_temporaire, p.cree_le,
                        (SELECT COUNT(*) FROM classes c WHERE c.prof_id = p.id) AS classes,
                        (SELECT COUNT(*) FROM eleves e WHERE e.classe_id IN (SELECT c2.id FROM classes c2 WHERE c2.prof_id = p.id)) AS eleves,
                        (SELECT COUNT(*) FROM partages g WHERE g.prof_id = p.id) AS partagees
                 FROM profs p ORDER BY p.identifiant'
            )->fetchAll();
            $profs = [];
            foreach ($lignes as $ligne) {
                $profs[] = [
                    'id' => (int)$ligne['id'],
                    'identifiant' => (string)$ligne['identifiant'],
                    'admin' => (int)$ligne['admin'] === 1,
                    'actif' => (int)$ligne['actif'] === 1,
                    'mdp_temporaire' => (int)$ligne['mdp_temporaire'] === 1,
                    'classes' => (int)$ligne['classes'],
                    'eleves' => (int)$ligne['eleves'],
                    'partagees' => (int)$ligne['partagees'],
                    'cree_le' => $ligne['cree_le'],
                ];
            }
            repondre(['ok' => true, 'profs' => $profs]);

        case 'profs.ajouter':
            exiger_admin($prof);
            // L'administrateur ne choisit pas le mot de passe du collègue : le
            // serveur en tire un temporaire, rendu ici une seule fois, que le
            // collègue remplacera à sa première connexion.
            try {
                $nouveau = creer_prof_temporaire($pdo, (string)($corps['identifiant'] ?? ''));
            } catch (InvalidArgumentException $e) {
                erreur($e->getMessage(), 400);
            }
            journaliser($pdo, $profId, 'profs.ajouter', 'compte', (int)($nouveau['id'] ?? 0));
            repondre(['ok' => true] + $nouveau);

        case 'profs.supprimer':
            exiger_admin($prof);
            $autre = autre_prof($pdo, $prof, $corps['prof_id'] ?? 0);
            $possessions = possessions_du_prof($pdo, $autre['id']);
            // Un compte qui possède des classes n'est supprimé qu'avec un
            // « oui » explicite pour elles : tout part, classes, codes,
            // progressions. La page le demande en montrant les nombres.
            if ($possessions['classes'] > 0 && empty($corps['avec_classes'])) {
                erreur("Ce compte possède {$possessions['classes']} classe(s) et {$possessions['eleves']} élève(s) : confirme leur suppression.", 409);
            }
            supprimer_prof($pdo, $autre['id']);
            journaliser($pdo, $profId, 'profs.supprimer', 'compte', $autre['id']);
            repondre(['ok' => true] + $possessions);

        // ------------------------------------------------------------------ classes

        case 'classes.liste':
            // Fin d'année. JUSQU'AU 06/09/2026, cette ligne SUPPRIMAIT : ouvrir
            // « Ma classe » après le 1er août effaçait, sans un mot et sans
            // retour possible, les classes de l'année écoulée. L'audit a montré
            // qu'une classe préparée en juillet y passait aussi (constat 2).
            //
            // Désormais, ouvrir la liste ne supprime RIEN. Les classes échues
            // sont renvoyées telles quelles ; la page les montre dans un
            // bandeau et le professeur décide (« classes.supprimer_echues »).
            // La suppression automatique reste, mais chez menage.php seul — la
            // tâche planifiée d'OVH, qui tient la promesse du 1er août.
            $echues = classes_a_proposer($pdo, $profId);
            // Une séance en direct oubliée ouverte ne survit pas à l'ouverture
            // de « Mes classes » (lib/direct.php : vingt minutes sans écran du
            // tableau). Sans objet tant que migrer.php n'a pas créé la table.
            $avecDirects = table_existe($pdo, 'directs');
            if ($avecDirects) purger_directs($pdo);
            $requete = $pdo->prepare(
                // c.* plutôt que la liste des colonnes : « reglages » n'existe
                // qu'après migrer.php (lot « splat-suivi-5 ») — avant, la classe
                // se lit « tous les mondes ouverts » au lieu de tomber en panne.
                'SELECT c.*,
                        (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = c.id) AS eleves,
                        (SELECT p.identifiant FROM profs p WHERE p.id = c.prof_id) AS proprietaire,
                        (SELECT g.droit FROM partages g WHERE g.classe_id = c.id AND g.prof_id = ?) AS partage
                 FROM classes c
                 WHERE c.prof_id = ?
                    OR c.id IN (SELECT g2.classe_id FROM partages g2 WHERE g2.prof_id = ?)
                 ORDER BY c.libelle'
            );
            $requete->execute([$profId, $profId, $profId]);
            $lignesClasses = $requete->fetchAll();
            // 17/10/2026 : la séance restée ouverte se voit sur la carte de sa
            // classe (« ● En direct », « 📝 Évaluation »). Le MODE seulement,
            // et pas pour un collègue en lecture seule : il ne peut pas la mener.
            $modesDirects = $avecDirects ? modes_des_directs_ouverts($pdo, array_column($lignesClasses, 'id')) : [];
            $classes = [];
            foreach ($lignesClasses as $ligne) {
                $mien = (int)$ligne['prof_id'] === $profId;
                $droit = $mien ? 'proprietaire' : (in_array($ligne['partage'], DROITS_PARTAGE, true) ? $ligne['partage'] : 'lecture');
                $classes[] = [
                    'id' => (int)$ligne['id'],
                    'libelle' => $ligne['libelle'],
                    'applis' => explode(',', (string)$ligne['applis']),
                    'reglages' => reglages_json(reglages_de_classe($ligne)),
                    'cree_le' => $ligne['cree_le'],
                    'annee' => annee_scolaire((string)$ligne['cree_le']),
                    'eleves' => (int)$ligne['eleves'],
                    'droit' => $droit,
                    'proprietaire' => $mien ? null : (string)$ligne['proprietaire'],
                    'direct' => $droit === 'lecture' ? null : mode_direct_visible($modesDirects[(int)$ligne['id']] ?? null, $prof),
                ];
            }
            repondre([
                'ok' => true,
                'classes' => $classes,
                // Ce que la page annonce au professeur : les classes de l'année
                // écoulée qui ne servent plus (il décide), et l'année scolaire
                // en cours avec son préavis (« ces classes seront supprimées à
                // partir du 1er août »).
                'echues' => $echues,
                'annee_courante' => annee_scolaire_courante(),
                'preavis_fin_annee' => preavis_de_fin_d_annee(),
                'purge_le' => purge_de_l_annee(annee_scolaire_courante()),
            ]);

        case 'classes.creer':
            $libelle = texte($corps['libelle'] ?? '', 40);
            if ($libelle === '') erreur("Donne un nom à la classe.", 400);
            $compte = $pdo->prepare('SELECT COUNT(*) FROM classes WHERE prof_id = ?');
            $compte->execute([$profId]);
            $possedees = (int)$compte->fetchColumn();
            if ($possedees >= MAX_CLASSES_PAR_PROF) {
                erreur("Tu as déjà " . MAX_CLASSES_PAR_PROF . " classes : supprime celles dont tu n'as plus besoin.", 409);
            }
            $applis = array_values(array_intersect(APPLIS_PROPOSABLES, (array)($corps['applis'] ?? ['defi-tables'])));
            if ($applis === []) $applis = ['defi-tables'];
            $pdo->prepare('INSERT INTO classes (prof_id, libelle, applis, cree_le) VALUES (?, ?, ?, ?)')
                ->execute([$profId, $libelle, implode(',', $applis), maintenant()]);
            $classeCreee = (int)$pdo->lastInsertId();
            journaliser($pdo, $profId, 'classes.creer', 'classe', $classeCreee);
            repondre(['ok' => true, 'id' => $classeCreee]);

        case 'classes.modifier':
            // Renommer la classe ou changer ses applis : c'est la classe
            // elle-même qu'on change, et elle porte le nom sous lequel son
            // propriétaire la reconnaît. Réservé au propriétaire (lot 11).
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $libelle = texte($corps['libelle'] ?? $classe['libelle'], 40);
            if ($libelle === '') erreur("Donne un nom à la classe.", 400);
            $applis = array_values(array_intersect(APPLIS_PROPOSABLES, (array)($corps['applis'] ?? explode(',', $classe['applis']))));
            if ($applis === []) $applis = ['defi-tables'];
            // Lot « splat-suivi-5 » : les réglages de la classe (aujourd'hui les
            // mondes de SPLAT! ouverts), seulement s'ils sont envoyés. Lus
            // STRICTEMENT (lib/applis.php) : une valeur fausse est refusée, rien
            // n'est arrangé en silence. Ceux des autres activités restent tels
            // quels, et décocher une activité garde ses réglages (la recocher
            // les retrouve).
            $reglages = null;   // ce qui est reçu, vérifié ; fondu sous le verrou
            if (array_key_exists('reglages', $corps)) {
                if (!reglages_disponibles($pdo)) {
                    erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
                }
                try {
                    reglages_recus($corps['reglages'], reglages_de_classe($classe));
                } catch (InvalidArgumentException $e) {
                    erreur($e->getMessage(), 400);
                }
                $reglages = $corps['reglages'];
            }
            // Serveur pro, lot 5b, correctif (relecture Codex du 30/10/2026,
            // point 1) : la page envoie aussi « avant » — la liste des applis
            // et les réglages de l'appli réglée, tels qu'elle les croit rangés
            // ({applis: [...], reglages: {<cle>: {...}}}, l'une ou l'autre
            // clé, ou les deux). Deux onglets « Régler SPLAT! » : l'un fermait
            // le monde 5, l'autre, resté sur sa liste du matin, ouvrait le 4 —
            // et renvoyait [1, 2, 4, 5] : le 5 rouvert sans que personne l'ait
            // voulu. Même chose pour les applis (la liste complète d'un onglet
            // en retard retirait l'Anzan ajouté ailleurs). Désormais, comme
            // eleves.acces : la ligne de la classe est verrouillée, « avant »
            // est comparé à ce qu'elle contient (forme canonique), et si c'est
            // différent, 409 avec l'état actuel — rien d'écrit. « avant »
            // absent : comme avant (une vieille page, un script).
            $avant = null;
            if (array_key_exists('avant', $corps)) {
                try {
                    $avant = avant_de_classe_recu($corps['avant']);
                } catch (InvalidArgumentException $e) {
                    erreur("État d'avant illisible : recharge la page et refais ton réglage.", 400);
                }
            }
            $classeId = (int)$classe['id'];
            $resultat = avec_reprise($pdo, function () use ($pdo, $classeId, $libelle, $applis, $reglages, $avant): array {
                transaction_ouvrir($pdo);
                $requete = $pdo->prepare('SELECT * FROM classes WHERE id = ?' . pour_mise_a_jour($pdo));
                $requete->execute([$classeId]);
                $ligne = $requete->fetch();
                $requete->closeCursor();
                if ($ligne === false) {
                    transaction_annuler($pdo);
                    return ['disparue' => true];
                }
                if ($avant !== null && !meme_etat_de_classe($avant, $ligne)) {
                    transaction_annuler($pdo);
                    return ['conflit' => true, 'ligne' => $ligne];
                }
                // Les réglages reçus remplacent ceux de l'appli DANS la valeur
                // relue sous le verrou (pas dans celle lue avant lui).
                $nouveaux = $reglages === null ? null : reglages_recus($reglages, reglages_de_classe($ligne));
                if ($nouveaux === null) {
                    $pdo->prepare('UPDATE classes SET libelle = ?, applis = ? WHERE id = ?')
                        ->execute([$libelle, implode(',', $applis), $classeId]);
                } else {
                    $pdo->prepare('UPDATE classes SET libelle = ?, applis = ?, reglages = ? WHERE id = ?')
                        ->execute([$libelle, implode(',', $applis),
                            $nouveaux === [] ? null : json_encode($nouveaux, JSON_UNESCAPED_UNICODE), $classeId]);
                }
                transaction_valider($pdo);
                return ['ecrit' => true, 'reglages' => $nouveaux];
            });
            if (isset($resultat['disparue'])) erreur("Introuvable.", 404);
            if (isset($resultat['conflit'])) {
                // Rien n'est écrit. L'état actuel part avec le refus : la
                // fenêtre se remet dessus. Pas de ligne au journal (rien n'a
                // été fait, et ce n'est pas un refus de droit).
                repondre([
                    'ok' => false,
                    'erreur' => "La {$resultat['ligne']['libelle']} a été changée ailleurs : la fenêtre montre l'état actuel, refais ton réglage.",
                    'applis' => explode(',', (string)$resultat['ligne']['applis']),
                    'reglages' => reglages_json(reglages_de_classe($resultat['ligne'])),
                ], 409);
            }
            journaliser($pdo, $profId, 'classes.modifier', 'classe', $classeId);
            repondre(['ok' => true] + ($resultat['reglages'] === null ? [] : ['reglages' => reglages_json($resultat['reglages'])]));

        case 'classes.supprimer':
            // Supprimer une classe efface des progressions : réservé au
            // propriétaire. C'est aussi ce que fait la fin d'année, par le même
            // chemin (lib/archives.php) : un seul code qui efface ces tables.
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            supprimer_classe($pdo, (int)$classe['id']);
            journaliser($pdo, $profId, 'classes.supprimer', 'classe', (int)$classe['id']);
            repondre(['ok' => true]);

        case 'classes.supprimer_echues':
            // Le professeur a lu le bandeau et dit oui. On ne fait PAS confiance
            // à la liste reçue : chaque identifiant repasse par le contrôle de
            // propriété (acces_classe) PUIS par le calendrier (échue ET sans
            // activité depuis trois semaines). Une classe de l'année en cours
            // envoyée à la main ne sera jamais supprimée par ce chemin.
            //
            // Tout ou rien : si UN identifiant ne convient pas, rien n'est
            // effacé et la page recharge sa liste. Effacer « celles qui
            // passent » laisserait le professeur devant un bandeau à moitié
            // vrai, sans savoir ce qui est parti.
            $demandees = $corps['classes'] ?? null;
            if (!is_array($demandees) || $demandees === []) {
                erreur("Aucune classe à supprimer.", 400);
            }
            if (count($demandees) > MAX_CLASSES_PAR_PROF) {
                erreur("Trop de classes à la fois.", 400);
            }
            $aSupprimer = [];
            foreach ($demandees as $classeBrute) {
                $classe = acces_classe($pdo, $profId, $classeBrute, droit_requis($action), $action);
                if (!classe_echue_et_mure($pdo, $profId, (int)$classe['id'])) {
                    erreur("Cette liste n'est plus à jour : recharge « Mes classes » avant de supprimer.", 409);
                }
                $aSupprimer[(int)$classe['id']] = (string)$classe['libelle'];
            }
            $noms = [];
            foreach ($aSupprimer as $classeId => $libelle) {
                supprimer_classe($pdo, $classeId);
                journaliser($pdo, $profId, 'classes.supprimer_echues', 'classe', $classeId);
                $noms[] = $libelle;
            }
            repondre(['ok' => true, 'supprimees' => $noms]);

        // ----------------------------------------------------------------- partages

        case 'partages.liste':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $requete = $pdo->prepare(
                'SELECT g.prof_id, g.droit, p.identifiant
                 FROM partages g JOIN profs p ON p.id = g.prof_id
                 WHERE g.classe_id = ? ORDER BY p.identifiant'
            );
            $requete->execute([(int)$classe['id']]);
            $partages = [];
            foreach ($requete->fetchAll() as $ligne) {
                $partages[] = [
                    'prof_id' => (int)$ligne['prof_id'],
                    'identifiant' => (string)$ligne['identifiant'],
                    'droit' => in_array($ligne['droit'], DROITS_PARTAGE, true) ? $ligne['droit'] : 'lecture',
                ];
            }
            repondre(['ok' => true, 'partages' => $partages, 'droit' => $classe['droit']]);

        case 'partages.ajouter':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $autreId = (int)($corps['prof_id'] ?? 0);
            if ($autreId === $profId) erreur("Cette classe est déjà la tienne.", 400);
            $requete = $pdo->prepare('SELECT id FROM profs WHERE id = ? AND actif = 1');
            $requete->execute([$autreId]);
            if ($requete->fetchColumn() === false) erreur("Professeur introuvable.", 404);
            $droit = (string)($corps['droit'] ?? 'lecture');
            if (!in_array($droit, DROITS_PARTAGE, true)) erreur("Droit inconnu.", 400);

            $requete = $pdo->prepare('SELECT id FROM partages WHERE classe_id = ? AND prof_id = ?');
            $requete->execute([(int)$classe['id'], $autreId]);
            $existant = $requete->fetchColumn();
            if ($existant === false) {
                $pdo->prepare('INSERT INTO partages (classe_id, prof_id, droit, cree_le) VALUES (?, ?, ?, ?)')
                    ->execute([(int)$classe['id'], $autreId, $droit, maintenant()]);
            } else {
                $pdo->prepare('UPDATE partages SET droit = ? WHERE id = ?')->execute([$droit, (int)$existant]);
            }
            journaliser($pdo, $profId, 'partages.ajouter', 'partage', $autreId);
            repondre(['ok' => true]);

        case 'partages.supprimer':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $pdo->prepare('DELETE FROM partages WHERE classe_id = ? AND prof_id = ?')
                ->execute([(int)$classe['id'], (int)($corps['prof_id'] ?? 0)]);
            journaliser($pdo, $profId, 'partages.supprimer', 'partage', (int)($corps['prof_id'] ?? 0));
            repondre(['ok' => true]);

        // ------------------------------------------------------------------- élèves

        case 'eleves.ajouter':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $nombre = (int)($corps['nombre'] ?? 1);
            if ($nombre < 1 || $nombre > MAX_ELEVES_PAR_LOT) {
                erreur("Nombre d'élèves à créer entre 1 et " . MAX_ELEVES_PAR_LOT . ".", 400);
            }
            // Tout ou rien (lot 11), et le compte des élèves DANS la même
            // transaction que les créations.
            //
            // Deux choses se jouent ici. (1) Un lot de 28 codes interrompu au
            // 17e laissait la feuille imprimée et la classe en désaccord, sans
            // que rien ne le dise. (2) Compter AVANT d'ouvrir la transaction
            // laissait deux demandes simultanées lire le même total et passer
            // toutes les deux : le quota se franchissait sans que personne ne
            // triche. La ligne de la classe est donc verrouillée d'abord, puis
            // le compte est une lecture verrouillée (donc à jour, y compris sur
            // MySQL où une lecture ordinaire voit l'instantané du début de
            // transaction) — les deux demandes s'attendent, la seconde voit le
            // total réel et se fait refuser.
            $crees = avec_reprise($pdo, function () use ($pdo, $classe, $nombre): array {
                transaction_ouvrir($pdo);
                try {
                    $verrou = $pdo->prepare('SELECT id FROM classes WHERE id = ?' . pour_mise_a_jour($pdo));
                    $verrou->execute([(int)$classe['id']]);
                    $verrou->closeCursor();
                    $compte = $pdo->prepare('SELECT COUNT(*) FROM eleves WHERE classe_id = ?' . pour_mise_a_jour($pdo));
                    $compte->execute([(int)$classe['id']]);
                    $deja = (int)$compte->fetchColumn();
                    $compte->closeCursor();
                    if ($deja + $nombre > MAX_ELEVES_PAR_CLASSE) {
                        transaction_annuler($pdo);
                        erreur("Une classe ne peut pas dépasser " . MAX_ELEVES_PAR_CLASSE . " élèves (elle en a déjà $deja).", 409);
                    }
                    $faits = [];
                    for ($i = 0; $i < $nombre; $i++) {
                        $code = code_libre($pdo);
                        $pdo->prepare('INSERT INTO eleves (classe_id, code, prenom, initiale, cree_le) VALUES (?, ?, ?, ?, ?)')
                            ->execute([(int)$classe['id'], $code, '', '', maintenant()]);
                        $faits[] = ['id' => (int)$pdo->lastInsertId(), 'code' => $code];
                    }
                    transaction_valider($pdo);
                    return $faits;
                } catch (Throwable $e) {
                    transaction_annuler($pdo);
                    throw $e;
                }
            });
            journaliser($pdo, $profId, 'eleves.ajouter', 'classe', (int)$classe['id']);
            repondre(['ok' => true, 'eleves' => $crees]);

        case 'eleves.nommer':
            $eleve = eleve_pour_action($pdo, $profId, $corps['eleve_id'] ?? 0, $action);
            $pdo->prepare('UPDATE eleves SET prenom = ?, initiale = ? WHERE id = ?')->execute([
                texte_prenom($corps['prenom'] ?? '', 40),
                mb_strtoupper(mb_substr(texte_prenom($corps['initiale'] ?? '', 4), 0, 1)),
                (int)$eleve['id'],
            ]);
            journaliser($pdo, $profId, 'eleves.nommer', 'eleve', (int)$eleve['id']);
            repondre(['ok' => true]);

        case 'eleves.regenerer':
            // Donner un nouveau code, c'est TROIS écritures : le code lui-même,
            // les compteurs de l'ancien code, et les billets d'entrée émis sous
            // l'ancien (un billet vivant rendrait le nouveau code : régénérer,
            // c'est révoquer). Elles se faisaient l'une après l'autre : une
            // panne au milieu laissait un code neuf ET un billet valable sur
            // l'ancien. Depuis le lot serveur A, les trois tiennent dans UNE
            // transaction (constat M-01 de la confrontation des audits) :
            // l'élève garde son ancien code, ou reçoit le nouveau, jamais un
            // état intermédiaire.
            $eleve = eleve_pour_action($pdo, $profId, $corps['eleve_id'] ?? 0, $action);
            $code = avec_reprise($pdo, function () use ($pdo, $eleve, $profId): string {
                transaction_ouvrir($pdo);
                try {
                    $code = code_libre($pdo);
                    $pdo->prepare('UPDATE eleves SET code = ? WHERE id = ?')->execute([$code, (int)$eleve['id']]);
                    oublier_compteurs_du_code($pdo, (string)$eleve['code']);
                    oublier_billets_de_l_eleve($pdo, (int)$eleve['id']);
                    transaction_valider($pdo);
                    return $code;
                } catch (Throwable $e) {
                    transaction_annuler($pdo);
                    throw $e;
                }
            });
            journaliser($pdo, $profId, 'eleves.regenerer', 'eleve', (int)$eleve['id']);
            repondre(['ok' => true, 'code' => $code]);

        case 'eleves.fiche':
            // « Voir sa fiche » : un billet de LECTURE, à usage unique, valable
            // deux minutes, que la page glisse dans l'adresse de l'appli à la
            // place du code (lot 3, constat C-1 : le code entrait dans
            // l'historique du navigateur du professeur). La classe en lecture
            // suffit : un collègue à qui la classe est partagée voit la fiche
            // sans jamais recevoir le code.
            $eleve = eleve_pour_action($pdo, $profId, $corps['eleve_id'] ?? 0, $action);
            repondre(['ok' => true, 'billet' => emettre_billet($pdo, (int)$eleve['id'], 'fiche')]);

        case 'eleves.restaurer':
            // « Revenir à… » : couvre l'écrasement par quelqu'un qui
            // connaissait le code, et le petit frère qui a cliqué
            // « Recommencer à zéro ». Deux façons de revenir :
            //  - sans « jour » : la version d'avant le tout dernier
            //    enregistrement (progressions.donnees_avant), comme avant ;
            //  - avec « jour » : la fin de cette journée-là, prise dans les
            //    sept jours gardés (lot serveur A). C'est ce qu'il faut quand
            //    l'écrasement date d'hier et que le dernier enregistrement est
            //    celui de l'intrus.
            // La révision monte dans les deux cas, l'appli de l'élève fusionnera.
            $eleve = eleve_pour_action($pdo, $profId, $corps['eleve_id'] ?? 0, $action);
            $appli = appli_recue($corps['appli'] ?? null);
            if (!in_array($appli, APPLIS_PROPOSABLES, true)) erreur("Application inconnue.", 400);
            $jour = null;
            if (isset($corps['jour']) && $corps['jour'] !== null && $corps['jour'] !== '') {
                $jour = is_string($corps['jour']) ? $corps['jour'] : '';
                if (!date_reelle($jour)) erreur("Jour à restaurer invalide.", 400);
            }
            $resultat = restaurer_progression($pdo, (int)$eleve['id'], $appli, $jour);
            if (isset($resultat['inconnu'])) {
                journaliser($pdo, $profId, 'eleves.restaurer', 'eleve', (int)$eleve['id'], 'erreur');
                erreur("Cette journée n'est plus dans l'historique : recharge la classe.", 404);
            }
            if (isset($resultat['rien'])) erreur("Aucune version précédente à restaurer.", 409);
            if (isset($resultat['conflit'])) erreur("La progression a changé pendant la restauration : regarde le tableau, puis réessaie.", 409);
            journaliser($pdo, $profId, 'eleves.restaurer', 'eleve', (int)$eleve['id']);
            repondre(['ok' => true, 'parcours' => json_decode($resultat['donnees'], false), 'revision' => $resultat['revision']]);

        case 'eleves.supprimer':
            // Supprimer un élève efface sa progression pour de bon : depuis le
            // lot 11, c'est au propriétaire de la classe, comme la supprimer.
            $eleve = eleve_pour_action($pdo, $profId, $corps['eleve_id'] ?? 0, $action);
            $pdo->beginTransaction();
            try {
                $pdo->prepare('DELETE FROM progressions WHERE eleve_id = ?')->execute([(int)$eleve['id']]);
                // Son historique des sept jours part avec lui (lot serveur A),
                // et son record (lot « Les records »).
                oublier_versions_de_l_eleve($pdo, (int)$eleve['id']);
                oublier_record_de_l_eleve($pdo, (int)$eleve['id']);
                $pdo->prepare('DELETE FROM eleves WHERE id = ?')->execute([(int)$eleve['id']]);
                // Et le jour d'ouverture de ses fiches de « Mes cours » (lot
                // « cours-ouvertures ») — APRÈS l'élève : une ouverture en
                // cours d'écriture ne peut plus en recréer une (lib/cours.php).
                oublier_cours_de_l_eleve($pdo, (int)$eleve['id']);
                oublier_compteurs_du_code($pdo, (string)$eleve['code']);
                oublier_billets_de_l_eleve($pdo, (int)$eleve['id']);
                // Ses réponses à la séance en direct du moment, s'il y en a une.
                oublier_reponses_direct_de_l_eleve($pdo, (int)$eleve['id']);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            journaliser($pdo, $profId, 'eleves.supprimer', 'eleve', (int)$eleve['id']);
            repondre(['ok' => true]);

        case 'eleves.acces':
            // Lot « Qui voit quoi » (22/10/2026) : « Ce que voit Léa… » —
            // {eleve_id, ajouts} remplace la colonne eleves.ajouts ENTIÈRE (la
            // fenêtre envoie tout son état à chaque clic). L'élève est remonté
            // à SA classe (eleve_pour_action) : propriétaire seulement, pour
            // ses élèves seulement ; la classe envoyée par le navigateur ne
            // compte pas. Lu STRICTEMENT (lib/applis.php, ajouts_recus) : une
            // appli fermée, un réglage non déclaré, un numéro hors bornes sont
            // refusés avec un message, rien n'est arrangé en silence. Répond
            // le rangé (« ajouts ») et le calculé (« acces » : ce que voit
            // l'élève, classe + ajouts) — jamais son code.
            //
            // Lot 3c (relecture Codex du 22/10 au soir) : la page envoie aussi
            // « avant », l'état rangé tel qu'elle le connaît. Deux onglets sur
            // le même élève, ou une réponse perdue en route, lui faisaient
            // envoyer un état complet PÉRIMÉ — et le serveur, qui remplace
            // tout, rouvrait un monde retiré ailleurs. Désormais la colonne
            // n'est remplacée que si elle contient encore « avant » (comparés
            // sous forme canonique, memes_ajouts) ; sinon 409 avec l'état
            // actuel, que la page reporte : la fenêtre se remet d'elle-même à
            // jour, et le clic est à refaire. « avant » absent ou illisible :
            // 400 — la page et le serveur se déposent ensemble. Comparaison et
            // écriture sous le verrou de la ligne de l'élève (pour_mise_a_jour,
            // comme eleves.ajouter) : deux demandes simultanées avec le même
            // « avant » ne passent pas toutes les deux.
            $eleve = eleve_pour_action($pdo, $profId, $corps['eleve_id'] ?? 0, $action);
            if (!ajouts_disponibles($pdo)) {
                erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
            }
            if (!array_key_exists('avant', $corps)) {
                erreur("Il manque l'état d'avant : recharge la page et refais ton clic.", 400);
            }
            try {
                $avant = ajouts_recus($corps['avant']);
            } catch (InvalidArgumentException $e) {
                erreur("État d'avant illisible : recharge la page et refais ton clic.", 400);
            }
            try {
                $ajouts = ajouts_recus($corps['ajouts'] ?? null);
            } catch (InvalidArgumentException $e) {
                erreur($e->getMessage(), 400);
            }
            $eleveId = (int)$eleve['id'];
            $resultat = avec_reprise($pdo, function () use ($pdo, $eleveId, $avant, $ajouts): array {
                transaction_ouvrir($pdo);
                $requete = $pdo->prepare('SELECT ajouts, prenom FROM eleves WHERE id = ?' . pour_mise_a_jour($pdo));
                $requete->execute([$eleveId]);
                $ligne = $requete->fetch();
                $requete->closeCursor();
                if ($ligne === false) {
                    transaction_annuler($pdo);
                    return ['disparu' => true];
                }
                $enBase = $ligne['ajouts'] === null ? null : (string)$ligne['ajouts'];
                if (!memes_ajouts(ajouts_lus($enBase), $avant)) {
                    transaction_annuler($pdo);
                    return ['conflit' => true, 'en_base' => $enBase, 'prenom' => (string)($ligne['prenom'] ?? '')];
                }
                $pdo->prepare('UPDATE eleves SET ajouts = ? WHERE id = ?')
                    ->execute([ajouts_pour_la_base($ajouts), $eleveId]);
                transaction_valider($pdo);
                return ['ecrit' => true];
            });
            if (isset($resultat['disparu'])) erreur("Introuvable.", 404);
            if (isset($resultat['conflit'])) {
                // Rien n'est écrit. L'état actuel part avec le refus, pour que
                // la fenêtre se redessine juste — rien que le propriétaire ne
                // voie déjà dans son tableau (ni code, ni donnée d'élève). Pas
                // de ligne au journal : rien n'a été fait, et ce n'est pas un
                // refus de droit.
                $qui = $resultat['prenom'] !== '' ? $resultat['prenom'] : 'cet élève';
                repondre([
                    'ok' => false,
                    'erreur' => "Ce que voit $qui a changé ailleurs : la fenêtre est à jour, refais ton clic.",
                    'ajouts' => ajouts_json(ajouts_lus($resultat['en_base'])),
                    'acces' => acces_json(acces_de_l_eleve($eleve['classe'], $resultat['en_base'])),
                ], 409);
            }
            journaliser($pdo, $profId, 'eleves.acces', 'eleve', $eleveId);
            repondre([
                'ok' => true,
                'ajouts' => ajouts_json($ajouts),
                'acces' => acces_json(acces_de_l_eleve($eleve['classe'], ajouts_pour_la_base($ajouts))),
            ]);

        // ------------------------------------------------------------------ tableau

        case 'tableau':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $appli = appli_recue($corps['appli'] ?? null);
            if (!in_array($appli, APPLIS_PROPOSABLES, true)) erreur("Application inconnue.", 400);
            // Lot « Qui voit quoi » : la colonne eleves.ajouts n'existe
            // qu'après migrer.php ; avant, on ne la demande pas et chaque
            // élève se lit « rien en plus ».
            $avecAjouts = ajouts_disponibles($pdo);
            $requete = $pdo->prepare(
                'SELECT e.id, e.code, e.prenom, e.initiale, p.donnees, p.maj_le, p.revision,
                        (p.donnees_avant IS NOT NULL) AS restaurable' . ($avecAjouts ? ', e.ajouts' : '') . '
                 FROM eleves e
                 LEFT JOIN progressions p ON p.eleve_id = e.id AND p.appli = ?
                 WHERE e.classe_id = ?
                 ORDER BY e.prenom = \'\', e.prenom, e.code'
            );
            $requete->execute([$appli, (int)$classe['id']]);
            // Un code ouvre l'appli comme l'élève et permet de modifier sa
            // progression : un collègue en lecture seule ne le reçoit pas.
            $avecCodes = $classe['droit'] !== 'lecture';
            $brutes = $requete->fetchAll();
            // Les journées gardées, pour le menu « Revenir à… » : le JOUR et le
            // NOMBRE de calculs, jamais les données (sept progressions par
            // élève, trente élèves, c'est plusieurs mégaoctets à chaque
            // ouverture de la classe).
            $revisions = [];
            foreach ($brutes as $ligne) {
                if ($ligne['revision'] !== null) $revisions[(int)$ligne['id']] = (int)$ligne['revision'];
            }
            $versionsParEleve = versions_des_eleves($pdo, array_column($brutes, 'id'), $appli, $revisions);
            // Lot « Les records » : le record de chaque Légende (Défi tables
            // seulement), pour la ligne du tableau — meilleur temps, temps de
            // la semaine, choix du nom. Rien tant que la table n'existe pas.
            $recordsParEleve = [];
            if ($appli === 'defi-tables' && records_disponibles($pdo) && $brutes !== []) {
                $marques = implode(',', array_fill(0, count($brutes), '?'));
                $lecture = $pdo->prepare("SELECT * FROM records WHERE eleve_id IN ($marques)");
                $lecture->execute(array_map('intval', array_column($brutes, 'id')));
                $lundi = lundi_courant();
                foreach ($lecture->fetchAll() as $record) $recordsParEleve[(int)$record['eleve_id']] = record_affichable($record, $lundi);
                $lecture->closeCursor();
            }
            // Lot « cours-ouvertures » (10/11/2026) : dans l'onglet Cours, le
            // jour de la dernière ouverture de chaque fiche, par élève — et
            // rien d'autre (ni nombre de fois, ni durée). Rien avant migrer.php.
            $ouverturesCours = $appli === 'cours' ? ouvertures_cours_des_eleves($pdo, array_column($brutes, 'id')) : [];
            $lignes = [];
            foreach ($brutes as $ligne) {
                $journees = [];
                foreach ($versionsParEleve[(int)$ligne['id']] ?? [] as $version) {
                    // La version qui porte la révision du moment EST l'état
                    // actuel : y « revenir » ne ferait rien.
                    if ($version['courante']) continue;
                    $journees[] = ['jour' => $version['jour'], 'calculs' => $version['calculs']];
                }
                $lignes[] = [
                    'id' => (int)$ligne['id'],
                    'code' => $avecCodes ? $ligne['code'] : null,
                    'prenom' => $ligne['prenom'],
                    'initiale' => $ligne['initiale'],
                    'parcours' => $ligne['donnees'] === null ? null : json_decode($ligne['donnees'], false),
                    'maj_le' => $ligne['maj_le'],
                    // Une version précédente existe : « Revenir à… » a un sens.
                    'restaurable' => (int)$ligne['restaurable'] === 1,
                    'journees' => $journees,
                    'record' => $recordsParEleve[(int)$ligne['id']] ?? null,
                    // Lot « Qui voit quoi » (22/10/2026) : ce qu'on lui a
                    // donné en plus (le rangé, nettoyé) et ce qu'il voit (le
                    // calculé : classe + ajouts), pour tous les droits — ce
                    // n'est ni un code ni une donnée d'élève. La colonne
                    // « En plus » et l'onglet SPLAT! (mondes par élève) s'en
                    // servent (lot 3).
                    'ajouts' => ajouts_json(ajouts_lus($avecAjouts ? $ligne['ajouts'] : null)),
                    'acces' => acces_json(acces_de_l_eleve($classe, $avecAjouts ? $ligne['ajouts'] : null)),
                ];
                if ($appli === 'cours') {
                    $ouvertes = $ouverturesCours[(int)$ligne['id']] ?? [];
                    $lignes[count($lignes) - 1]['ouvertes'] = $ouvertes === [] ? new stdClass() : $ouvertes;
                }
            }
            repondre([
                'ok' => true,
                'classe' => [
                    'id' => (int)$classe['id'],
                    'libelle' => $classe['libelle'],
                    'applis' => explode(',', (string)$classe['applis']),
                    'reglages' => reglages_json(reglages_de_classe($classe)),
                    'droit' => $classe['droit'],
                    // 17/10/2026 : « ● Reprendre la séance en direct » quand
                    // une séance de la classe est restée ouverte.
                    'direct' => $avecCodes && table_existe($pdo, 'directs')
                        ? mode_direct_visible(modes_des_directs_ouverts($pdo, [(int)$classe['id']])[(int)$classe['id']] ?? null, $prof) : null,
                ],
                'eleves' => $lignes,
            ]);

        // ------------------------------------------------------------------ records

        case 'records.ligue':
            // Lot « Les records » (09/10/2026) : la ligue du professeur
            // connecté — ses propres classes, les mêmes deux tableaux que
            // voient ses élèves (noms affichés et temps, rien d'autre), pour
            // la carte de « Ma classe » et le plein écran au tableau. Elle ne
            // porte sur aucune classe en particulier : pas de classe_id, pas
            // de partage — un collègue en lecture ne voit que sa propre ligue.
            if (!records_disponibles($pdo)) {
                erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
            }
            repondre(['ok' => true] + ligue($pdo, $profId, null, true));

        case 'records.retirer':
            // Lot « après l'audit GPT » (D4, 14/10/2026, décision de Gwenaël) :
            // « Retirer ce temps », depuis une ligne des records de Ma classe.
            // L'élève est remonté à SA classe (eleve_pour_action) : le
            // propriétaire seulement, pour ses élèves seulement — un collègue
            // ou un élève d'une autre classe reçoit « Introuvable » ou le refus,
            // journalisé comme les autres. Le choix du nom reste.
            if (!records_disponibles($pdo)) {
                erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
            }
            $eleve = eleve_pour_action($pdo, $profId, $corps['eleve_id'] ?? 0, $action);
            $retire = retirer_temps($pdo, (int)$eleve['id']);
            journaliser($pdo, $profId, 'records.retirer', 'eleve', (int)$eleve['id']);
            repondre(['ok' => true, 'retire' => $retire] + ligue($pdo, $profId, null, true));
        // ---------------------------------------------------------- séance en direct
        //
        // Lot 1 « question éclair » (07/10/2026) — lib/direct.php. Le tableau
        // interroge « direct.etat » toutes les secondes et demie : c'est la
        // seule action de ce fichier appelée en boucle, elle ne journalise
        // rien. Depuis la veille du 17/10/2026, elle dit « le tableau est
        // là » : elle repousse la fin de vingt minutes (une écriture toutes
        // les trente secondes au plus, garder_direct_en_vie). Les gestes
        // (ouvrir, poser une question, dévoiler, désigner la bonne réponse)
        // aussi. Les interrogations des élèves, jamais.

        case 'direct.etat':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            purger_directs($pdo);
            // Lot E1 : une évaluation ouverte n'est pas une séance pour le tableau.
            $direct = direct_eclair_de_la_classe($pdo, (int)$classe['id']);
            if ($direct !== null) garder_direct_en_vie($pdo, $direct);
            repondre([
                'ok' => true,
                'classe' => ['id' => (int)$classe['id'], 'libelle' => $classe['libelle']],
                'direct' => $direct === null ? null : etat_du_direct_pour_le_tableau($pdo, $direct),
                'rythme' => RYTHME_DIRECT_TABLEAU,
            ]);

        case 'direct.ouvrir':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            // Lot E1 : une seule séance par classe — pas de question éclair
            // pendant une évaluation (ni après, tant qu'elle n'est pas terminée).
            if (evaluation_de_la_classe($pdo, (int)$classe['id']) !== null) {
                erreur("Une évaluation est ouverte pour cette classe : ferme-la et termine-la d'abord, dans « Ma classe ».", 409);
            }
            $dejaOuverte = direct_de_la_classe($pdo, (int)$classe['id']) !== null;
            $direct = ouvrir_direct($pdo, (int)$classe['id'], $profId);
            if (!$dejaOuverte) journaliser($pdo, $profId, 'direct.ouvrir', 'classe', (int)$classe['id']);
            repondre([
                'ok' => true,
                'classe' => ['id' => (int)$classe['id'], 'libelle' => $classe['libelle']],
                'direct' => etat_du_direct_pour_le_tableau($pdo, $direct),
                'rythme' => RYTHME_DIRECT_TABLEAU,
            ]);

        case 'direct.question':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $direct = direct_eclair_de_la_classe($pdo, (int)$classe['id']);
            if ($direct === null) erreur("La séance est terminée : ouvre-la de nouveau.", 409);
            $type = is_string($corps['type'] ?? null) ? $corps['type'] : 'choix';
            if (!in_array($type, TYPES_DIRECT, true)) erreur("Type de question inconnu.", 400);
            $reglage = reglage_direct($type, $corps['reglage'] ?? null);
            if ($reglage === null) erreur("Réglage de la question invalide.", 400);
            if (!poser_question_direct($pdo, $direct, $type, $reglage)) {
                erreur("Cette séance a atteint " . MAX_QUESTIONS_DIRECT . " questions : termine-la et ouvres-en une autre.", 409);
            }
            repondre(['ok' => true,
                'direct' => etat_du_direct_pour_le_tableau($pdo, direct_de_la_classe($pdo, (int)$classe['id']) ?? $direct)]);

        case 'direct.devoiler':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $direct = direct_eclair_de_la_classe($pdo, (int)$classe['id']);
            if ($direct === null) erreur("La séance est terminée : ouvre-la de nouveau.", 409);
            // Lot 2 : la bonne réponse d'un questionnaire arrive AVEC le geste
            // qui dévoile, vérifiée par le type de la question — jamais avant.
            $bonne = null;
            if (($corps['bonne'] ?? null) !== null) {
                $question = question_du_direct($pdo, $direct);
                if ($question === null) erreur("Aucune question en cours.", 409);
                $bonne = reponse_direct($question['type'], $question['reglage'], $corps['bonne']);
                if ($bonne === null) erreur("Cette réponse n'existe pas pour cette question.", 400);
            }
            // Déjà dévoilée (double clic, deuxième onglet, fin du chrono et
            // dernier élève au même instant) : même réponse, rien ne change.
            devoiler_direct($pdo, $direct, $bonne);
            repondre(['ok' => true,
                'direct' => etat_du_direct_pour_le_tableau($pdo, direct_de_la_classe($pdo, (int)$classe['id']) ?? $direct)]);

        case 'direct.bonne':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $direct = direct_eclair_de_la_classe($pdo, (int)$classe['id']);
            if ($direct === null) erreur("La séance est terminée : ouvre-la de nouveau.", 409);
            $question = question_du_direct($pdo, $direct);
            if ($question === null || $direct['etat'] !== 'devoile') {
                erreur("Dévoile d'abord les réponses.", 409);
            }
            $bonne = null;
            if (($corps['bonne'] ?? null) !== null) {
                $bonne = reponse_direct($question['type'], $question['reglage'], $corps['bonne']);
                if ($bonne === null) erreur("Cette réponse n'existe pas pour cette question.", 400);
            }
            designer_bonne_reponse_direct($pdo, $direct, $bonne);
            repondre(['ok' => true,
                'direct' => etat_du_direct_pour_le_tableau($pdo, direct_de_la_classe($pdo, (int)$classe['id']) ?? $direct)]);

        case 'direct.fichier':
            // Les réponses élève par élève : c'est avec elles que la page du
            // professeur fabrique le fichier, dans son navigateur. Le serveur
            // n'en garde aucune copie ; l'action est journalisée.
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $direct = direct_eclair_de_la_classe($pdo, (int)$classe['id']);
            if ($direct === null) erreur("La séance est terminée : il n'y a plus rien à télécharger.", 409);
            journaliser($pdo, $profId, 'direct.fichier', 'classe', (int)$classe['id']);
            repondre(['ok' => true,
                'classe' => ['id' => (int)$classe['id'], 'libelle' => $classe['libelle']],
                'jour' => jour_local()] + contenu_du_direct($pdo, $direct));

        case 'direct.terminer':
            // Tout est effacé, tout de suite : la séance, ses questions, ses
            // réponses. Terminer une séance déjà terminée n'est pas une erreur.
            // Lot E1 : une évaluation ne se termine pas d'ici (evaluation.terminer).
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $existait = direct_eclair_de_la_classe($pdo, (int)$classe['id']) !== null;
            if (!$existait) repondre(['ok' => true]);
            avec_reprise($pdo, function () use ($pdo, $classe): void {
                transaction_ouvrir($pdo);
                try {
                    oublier_direct_de_la_classe($pdo, (int)$classe['id']);
                    transaction_valider($pdo);
                } catch (Throwable $e) {
                    transaction_annuler($pdo);
                    throw $e;
                }
            });
            if ($existait) journaliser($pdo, $profId, 'direct.terminer', 'classe', (int)$classe['id']);
            repondre(['ok' => true]);

        // ---------------------------------------------------------- évaluations en classe
        //
        // Lot E1 (15/10/2026) — lib/evaluation.php. Les modèles appartiennent
        // au compte ; l'évaluation ouverte est une séance de la classe (mêmes
        // droits que la question éclair). « evaluation.etat » est interrogée
        // en boucle par Ma classe : elle ne journalise rien.

        case 'evaluation.modeles':
            if (!table_existe($pdo, 'modeles_evaluation')) {
                erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
            }
            repondre(['ok' => true, 'modeles' => modeles_du_prof($pdo, $profId)]);

        case 'evaluation.enregistrer_modele':
            if (!table_existe($pdo, 'modeles_evaluation')) {
                erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
            }
            $reglage = reglage_evaluation($corps['reglage'] ?? null);
            if ($reglage === null) erreur("Réglage du modèle invalide.", 400);
            $nom = nom_modele_evaluation($corps['nom'] ?? '');
            if ($nom === '') erreur("Donne un nom au modèle.", 400);
            $id = ($corps['id'] ?? null) === null ? null : (is_int($corps['id']) ? $corps['id'] : 0);
            if ($id === 0) erreur("Modèle inconnu.", 404);
            $enregistre = enregistrer_modele_evaluation($pdo, $profId, $id, $nom, $reglage);
            if ($enregistre === null) {
                if ($id !== null) erreur("Modèle inconnu.", 404);
                erreur("Tu as déjà " . MAX_MODELES_PAR_PROF . " modèles : supprimes-en un.", 409);
            }
            repondre(['ok' => true, 'id' => $enregistre, 'modeles' => modeles_du_prof($pdo, $profId)]);

        case 'evaluation.supprimer_modele':
            if (!table_existe($pdo, 'modeles_evaluation')) {
                erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
            }
            $id = is_int($corps['id'] ?? null) ? $corps['id'] : 0;
            if (!supprimer_modele_evaluation($pdo, $profId, $id)) erreur("Modèle inconnu.", 404);
            repondre(['ok' => true, 'modeles' => modeles_du_prof($pdo, $profId)]);

        case 'evaluation.etat':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            purger_directs($pdo);
            $evaluation = evaluation_de_la_classe($pdo, (int)$classe['id']);
            repondre([
                'ok' => true,
                'classe' => ['id' => (int)$classe['id'], 'libelle' => $classe['libelle']],
                'evaluation' => $evaluation === null ? null : etat_evaluation_pour_la_classe($pdo, $evaluation),
                // Une question éclair en cours, pour que la carte le dise.
                'eclair' => direct_eclair_de_la_classe($pdo, (int)$classe['id']) !== null,
                'rythme' => RYTHME_EVALUATION_CLASSE,
            ]);

        case 'evaluation.ouvrir':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            if (!table_existe($pdo, 'modeles_evaluation') || !colonne_existe($pdo, 'directs', 'reglage')) {
                erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
            }
            // Le modèle est celui du professeur CONNECTÉ (un collègue ouvre
            // avec les siens), relu et revérifié : un modèle rangé avant un
            // changement de règles ne passe pas.
            $modele = modele_du_prof($pdo, $profId, is_int($corps['modele_id'] ?? null) ? $corps['modele_id'] : 0);
            if ($modele === null) erreur("Modèle inconnu.", 404);
            $modele['reglage'] = reglage_evaluation($modele['reglage']);
            if ($modele['reglage'] === null) erreur("Ce modèle n'est plus valable : ouvre-le et enregistre-le de nouveau.", 409);
            $duree = is_int($corps['duree'] ?? null) ? $corps['duree'] : 3600;
            if (!in_array($duree, DUREES_OUVERTURE_EVALUATION, true)) erreur("Durée d'ouverture inconnue.", 400);
            $evaluation = ouvrir_evaluation($pdo, (int)$classe['id'], $profId, $modele, $duree);
            if ($evaluation === 'eclair') {
                // Lot 5e : un collègue ne peut pas la terminer, on ne le lui demande pas.
                erreur(direct_ouvert_au_compte($prof['admin'])
                    ? "Une question éclair est en cours pour cette classe : termine la séance en direct d'abord."
                    : "Une séance en direct est en cours pour cette classe : l'évaluation pourra s'ouvrir quand elle sera terminée.", 409);
            }
            // Une ligne au journal pour l'appel qui a ÉCRIT la séance, et lui seul.
            if ($evaluation['creee']) journaliser($pdo, $profId, 'evaluation.ouvrir', 'classe', (int)$classe['id']);
            repondre([
                'ok' => true,
                'classe' => ['id' => (int)$classe['id'], 'libelle' => $classe['libelle']],
                'evaluation' => etat_evaluation_pour_la_classe($pdo, $evaluation),
                'eclair' => false,
                'rythme' => RYTHME_EVALUATION_CLASSE,
            ]);

        case 'evaluation.fermer':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $evaluation = evaluation_de_la_classe($pdo, (int)$classe['id']);
            if ($evaluation === null) erreur("Il n'y a pas d'évaluation ouverte pour cette classe.", 409);
            $etaitOuverte = !evaluation_fermee($evaluation);
            fermer_evaluation($pdo, $evaluation);
            if ($etaitOuverte) journaliser($pdo, $profId, 'evaluation.fermer', 'classe', (int)$classe['id']);
            $evaluation = evaluation_de_la_classe($pdo, (int)$classe['id']) ?? $evaluation;
            repondre(['ok' => true, 'evaluation' => etat_evaluation_pour_la_classe($pdo, $evaluation), 'eclair' => false,
                'rythme' => RYTHME_EVALUATION_CLASSE]);

        case 'evaluation.fichier':
            // Les graines et les réponses élève par élève : c'est avec elles
            // que Ma classe corrige et fabrique le fichier, dans le navigateur
            // du professeur. Le serveur n'en garde aucune copie ; journalisé.
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $evaluation = evaluation_de_la_classe($pdo, (int)$classe['id']);
            if ($evaluation === null) erreur("Il n'y a plus d'évaluation pour cette classe : rien à télécharger.", 409);
            journaliser($pdo, $profId, 'evaluation.fichier', 'classe', (int)$classe['id']);
            repondre(['ok' => true,
                'classe' => ['id' => (int)$classe['id'], 'libelle' => $classe['libelle']],
                'jour' => jour_local(),
                'etat' => evaluation_fermee($evaluation) ? 'fermee' : 'ouverte'] + contenu_evaluation($pdo, $evaluation));

        case 'evaluation.repasser':
            // Lot E2 : l'élève repart de zéro (présence, réponses, « fini »
            // effacés ; nouvelle graine à son prochain « Je commence »).
            // Seulement un élève de CETTE classe, seulement tant que
            // l'évaluation est ouverte ; journalisé sur l'élève, sans prénom.
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $evaluation = evaluation_de_la_classe($pdo, (int)$classe['id']);
            if ($evaluation === null) erreur("Il n'y a pas d'évaluation ouverte pour cette classe.", 409);
            if (evaluation_fermee($evaluation)) erreur("L'évaluation est fermée : on ne fait plus repasser personne.", 409);
            $eleveId = eleve_de_la_classe($pdo, (int)$classe['id'], is_int($corps['eleve_id'] ?? null) ? $corps['eleve_id'] : 0);
            if ($eleveId === null) erreur("Élève inconnu.", 404);
            $efface = faire_repasser_evaluation($pdo, $evaluation, $eleveId);
            if ($efface) journaliser($pdo, $profId, 'evaluation.repasser', 'eleve', $eleveId);
            $evaluation = evaluation_de_la_classe($pdo, (int)$classe['id']) ?? $evaluation;
            repondre(['ok' => true, 'efface' => $efface, 'evaluation' => etat_evaluation_pour_la_classe($pdo, $evaluation), 'eclair' => false,
                'rythme' => RYTHME_EVALUATION_CLASSE]);

        case 'evaluation.terminer':
            // Tout est effacé, tout de suite : la séance, les présences, les
            // réponses. Terminer deux fois n'est pas une erreur.
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, droit_requis($action), $action);
            $evaluation = evaluation_de_la_classe($pdo, (int)$classe['id']);
            if ($evaluation !== null) {
                avec_reprise($pdo, function () use ($pdo, $evaluation): void {
                    transaction_ouvrir($pdo);
                    try {
                        effacer_direct($pdo, (int)$evaluation['id']);
                        transaction_valider($pdo);
                    } catch (Throwable $e) {
                        transaction_annuler($pdo);
                        throw $e;
                    }
                });
                journaliser($pdo, $profId, 'evaluation.terminer', 'classe', (int)$classe['id']);
            }
            repondre(['ok' => true]);

        default:
            erreur("Action inconnue.", 400);
    }
} catch (Throwable $e) {
    error_log('prof: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
