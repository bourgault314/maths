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

const MAX_ELEVES_PAR_LOT = 60;
const APPLIS_PROPOSABLES = ['defi-tables', 'automatismes'];
const DROITS_PARTAGE = ['lecture', 'ecriture'];

cors();

function texte(mixed $valeur, int $max): string
{
    $texte = is_string($valeur) ? $valeur : '';
    $texte = preg_replace('/\s+/u', ' ', $texte) ?? '';
    return mb_substr(trim($texte), 0, $max);
}

// Le compte connecté : identifiant et droit d'administration.
function prof_courant(PDO $pdo, int $profId): array
{
    $requete = $pdo->prepare('SELECT id, identifiant, admin FROM profs WHERE id = ?');
    $requete->execute([$profId]);
    $prof = $requete->fetch();
    if ($prof === false) erreur("Session expirée, reconnecte-toi.", 401);
    return ['id' => (int)$prof['id'], 'identifiant' => (string)$prof['identifiant'], 'admin' => (int)$prof['admin'] === 1];
}

function exiger_admin(array $prof): void
{
    if (!$prof['admin']) erreur("Seul le compte administrateur peut gérer les professeurs.", 403);
}

// Renvoie la classe si ce professeur y a droit, et refuse sinon.
// $besoin vaut 'lecture', 'ecriture' ou 'proprietaire'.
// Une classe à laquelle il n'a aucun droit est déclarée introuvable : on ne
// révèle pas l'existence des classes des collègues.
function acces_classe(PDO $pdo, int $profId, mixed $classeIdBrut, string $besoin): array
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
        erreur("Cette classe ne t'appartient pas.", 403);
    }
    if ($besoin === 'ecriture' && $classe['droit'] === 'lecture') {
        erreur("Cette classe t'est partagée en lecture seule.", 403);
    }
    return $classe;
}

// Pour toute action sur un élève : on remonte à sa classe et on vérifie là.
function eleve_modifiable(PDO $pdo, int $profId, mixed $eleveIdBrut): array
{
    $eleveId = (int)$eleveIdBrut;
    $requete = $pdo->prepare('SELECT id, classe_id, code FROM eleves WHERE id = ?');
    $requete->execute([$eleveId]);
    $eleve = $requete->fetch();
    // Même message qu'une classe interdite : un professeur connecté ne doit
    // pas pouvoir distinguer « n'existe pas » de « appartient à un collègue ».
    if ($eleve === false) erreur("Introuvable.", 404);
    acces_classe($pdo, $profId, (int)$eleve['classe_id'], 'ecriture');
    return $eleve;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        erreur("Méthode non autorisée.", 405);
    }
    $corps = corps_json(20000);
    $action = (string)($corps['action'] ?? '');
    $pdo = bd();

    if ($action === 'connexion') {
        limiter('connexion:' . adresse_appelante(), 12, 600);
        $session = ouvrir_session($pdo, (string)($corps['identifiant'] ?? ''), (string)($corps['motdepasse'] ?? ''));
        if ($session === null) {
            erreur("Identifiant ou mot de passe incorrect.", 401);
        }
        repondre(['ok' => true] + $session);
    }

    $jeton = jeton_recu($corps);
    $profId = prof_de_session($pdo, $jeton);
    if ($profId === null) {
        erreur("Session expirée, reconnecte-toi.", 401);
    }
    $prof = prof_courant($pdo, $profId);

    switch ($action) {
        case 'deconnexion':
            fermer_session($pdo, $jeton);
            repondre(['ok' => true]);

        case 'moi':
            repondre(['ok' => true, 'identifiant' => $prof['identifiant'], 'admin' => $prof['admin']]);

        // ------------------------------------------------------------ comptes profs

        case 'profs.annuaire':
            // Sert à choisir un collègue dans la liste « Partager cette classe ».
            $requete = $pdo->prepare('SELECT id, identifiant FROM profs WHERE id <> ? ORDER BY identifiant');
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
                'SELECT p.id, p.identifiant, p.admin, p.cree_le,
                        (SELECT COUNT(*) FROM classes c WHERE c.prof_id = p.id) AS classes,
                        (SELECT COUNT(*) FROM partages g WHERE g.prof_id = p.id) AS partagees
                 FROM profs p ORDER BY p.identifiant'
            )->fetchAll();
            $profs = [];
            foreach ($lignes as $ligne) {
                $profs[] = [
                    'id' => (int)$ligne['id'],
                    'identifiant' => (string)$ligne['identifiant'],
                    'admin' => (int)$ligne['admin'] === 1,
                    'classes' => (int)$ligne['classes'],
                    'partagees' => (int)$ligne['partagees'],
                    'cree_le' => $ligne['cree_le'],
                ];
            }
            repondre(['ok' => true, 'profs' => $profs]);

        case 'profs.ajouter':
            exiger_admin($prof);
            try {
                $nouveau = creer_prof(
                    $pdo,
                    (string)($corps['identifiant'] ?? ''),
                    (string)($corps['motdepasse'] ?? ''),
                    false
                );
            } catch (InvalidArgumentException $e) {
                erreur($e->getMessage(), 400);
            }
            repondre(['ok' => true, 'id' => $nouveau]);

        // ------------------------------------------------------------------ classes

        case 'classes.liste':
            $requete = $pdo->prepare(
                'SELECT c.id, c.libelle, c.applis, c.cree_le, c.prof_id,
                        (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = c.id) AS eleves,
                        (SELECT p.identifiant FROM profs p WHERE p.id = c.prof_id) AS proprietaire,
                        (SELECT g.droit FROM partages g WHERE g.classe_id = c.id AND g.prof_id = ?) AS partage
                 FROM classes c
                 WHERE c.prof_id = ?
                    OR c.id IN (SELECT g2.classe_id FROM partages g2 WHERE g2.prof_id = ?)
                 ORDER BY c.libelle'
            );
            $requete->execute([$profId, $profId, $profId]);
            $classes = [];
            foreach ($requete->fetchAll() as $ligne) {
                $mien = (int)$ligne['prof_id'] === $profId;
                $classes[] = [
                    'id' => (int)$ligne['id'],
                    'libelle' => $ligne['libelle'],
                    'applis' => explode(',', (string)$ligne['applis']),
                    'cree_le' => $ligne['cree_le'],
                    'eleves' => (int)$ligne['eleves'],
                    'droit' => $mien ? 'proprietaire' : (in_array($ligne['partage'], DROITS_PARTAGE, true) ? $ligne['partage'] : 'lecture'),
                    'proprietaire' => $mien ? null : (string)$ligne['proprietaire'],
                ];
            }
            repondre(['ok' => true, 'classes' => $classes]);

        case 'classes.creer':
            $libelle = texte($corps['libelle'] ?? '', 40);
            if ($libelle === '') erreur("Donne un nom à la classe.", 400);
            $applis = array_values(array_intersect(APPLIS_PROPOSABLES, (array)($corps['applis'] ?? ['defi-tables'])));
            if ($applis === []) $applis = ['defi-tables'];
            $pdo->prepare('INSERT INTO classes (prof_id, libelle, applis, cree_le) VALUES (?, ?, ?, ?)')
                ->execute([$profId, $libelle, implode(',', $applis), maintenant()]);
            repondre(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);

        case 'classes.modifier':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, 'ecriture');
            $libelle = texte($corps['libelle'] ?? $classe['libelle'], 40);
            if ($libelle === '') erreur("Donne un nom à la classe.", 400);
            $applis = array_values(array_intersect(APPLIS_PROPOSABLES, (array)($corps['applis'] ?? explode(',', $classe['applis']))));
            if ($applis === []) $applis = ['defi-tables'];
            $pdo->prepare('UPDATE classes SET libelle = ?, applis = ? WHERE id = ?')
                ->execute([$libelle, implode(',', $applis), (int)$classe['id']]);
            repondre(['ok' => true]);

        case 'classes.supprimer':
            // Supprimer une classe efface des progressions : réservé au propriétaire.
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, 'proprietaire');
            // Tout ou rien : une panne au milieu ne laisse ni élève sans classe
            // ni progression orpheline.
            $pdo->beginTransaction();
            try {
                $requete = $pdo->prepare('SELECT id, code FROM eleves WHERE classe_id = ?');
                $requete->execute([(int)$classe['id']]);
                foreach ($requete->fetchAll() as $eleve) {
                    $pdo->prepare('DELETE FROM progressions WHERE eleve_id = ?')->execute([(int)$eleve['id']]);
                    oublier_compteurs_du_code($pdo, (string)$eleve['code']);
                }
                $pdo->prepare('DELETE FROM eleves WHERE classe_id = ?')->execute([(int)$classe['id']]);
                $pdo->prepare('DELETE FROM partages WHERE classe_id = ?')->execute([(int)$classe['id']]);
                $pdo->prepare('DELETE FROM classes WHERE id = ?')->execute([(int)$classe['id']]);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            repondre(['ok' => true]);

        // ----------------------------------------------------------------- partages

        case 'partages.liste':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, 'lecture');
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
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, 'proprietaire');
            $autreId = (int)($corps['prof_id'] ?? 0);
            if ($autreId === $profId) erreur("Cette classe est déjà la tienne.", 400);
            $requete = $pdo->prepare('SELECT id FROM profs WHERE id = ?');
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
            repondre(['ok' => true]);

        case 'partages.supprimer':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, 'proprietaire');
            $pdo->prepare('DELETE FROM partages WHERE classe_id = ? AND prof_id = ?')
                ->execute([(int)$classe['id'], (int)($corps['prof_id'] ?? 0)]);
            repondre(['ok' => true]);

        // ------------------------------------------------------------------- élèves

        case 'eleves.ajouter':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, 'ecriture');
            $nombre = (int)($corps['nombre'] ?? 1);
            if ($nombre < 1 || $nombre > MAX_ELEVES_PAR_LOT) {
                erreur("Nombre d'élèves à créer entre 1 et " . MAX_ELEVES_PAR_LOT . ".", 400);
            }
            $crees = [];
            for ($i = 0; $i < $nombre; $i++) {
                $code = code_libre($pdo);
                $pdo->prepare('INSERT INTO eleves (classe_id, code, prenom, initiale, cree_le) VALUES (?, ?, ?, ?, ?)')
                    ->execute([(int)$classe['id'], $code, '', '', maintenant()]);
                $crees[] = ['id' => (int)$pdo->lastInsertId(), 'code' => $code];
            }
            repondre(['ok' => true, 'eleves' => $crees]);

        case 'eleves.nommer':
            $eleve = eleve_modifiable($pdo, $profId, $corps['eleve_id'] ?? 0);
            $pdo->prepare('UPDATE eleves SET prenom = ?, initiale = ? WHERE id = ?')->execute([
                texte($corps['prenom'] ?? '', 40),
                mb_strtoupper(mb_substr(texte($corps['initiale'] ?? '', 4), 0, 1)),
                (int)$eleve['id'],
            ]);
            repondre(['ok' => true]);

        case 'eleves.regenerer':
            $eleve = eleve_modifiable($pdo, $profId, $corps['eleve_id'] ?? 0);
            $code = code_libre($pdo);
            $pdo->prepare('UPDATE eleves SET code = ? WHERE id = ?')->execute([$code, (int)$eleve['id']]);
            oublier_compteurs_du_code($pdo, (string)$eleve['code']);
            repondre(['ok' => true, 'code' => $code]);

        case 'eleves.restaurer':
            // Revenir à la version précédente d'une progression : couvre
            // l'écrasement par quelqu'un qui connaissait le code, et le petit
            // frère qui a cliqué « Recommencer à zéro ». Une seule version en
            // arrière ; la révision monte, l'appli de l'élève fusionnera.
            $eleve = eleve_modifiable($pdo, $profId, $corps['eleve_id'] ?? 0);
            $appli = (string)($corps['appli'] ?? 'defi-tables');
            if (!in_array($appli, APPLIS_PROPOSABLES, true)) erreur("Application inconnue.", 400);
            $pdo->beginTransaction();
            try {
                $requete = $pdo->prepare('SELECT id, donnees, donnees_avant, revision FROM progressions WHERE eleve_id = ? AND appli = ?');
                $requete->execute([(int)$eleve['id'], $appli]);
                $ligne = $requete->fetch();
                if ($ligne === false || $ligne['donnees_avant'] === null) {
                    $pdo->rollBack();
                    erreur("Aucune version précédente à restaurer.", 409);
                }
                $pdo->prepare('UPDATE progressions SET donnees = ?, donnees_avant = ?, revision = ?, maj_le = ? WHERE id = ?')
                    ->execute([$ligne['donnees_avant'], $ligne['donnees'], (int)$ligne['revision'] + 1, aujourdhui(), (int)$ligne['id']]);
                $pdo->commit();
            } catch (Throwable $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                throw $e;
            }
            repondre(['ok' => true, 'parcours' => json_decode($ligne['donnees_avant'], false), 'revision' => (int)$ligne['revision'] + 1]);

        case 'eleves.supprimer':
            $eleve = eleve_modifiable($pdo, $profId, $corps['eleve_id'] ?? 0);
            $pdo->beginTransaction();
            try {
                $pdo->prepare('DELETE FROM progressions WHERE eleve_id = ?')->execute([(int)$eleve['id']]);
                $pdo->prepare('DELETE FROM eleves WHERE id = ?')->execute([(int)$eleve['id']]);
                oublier_compteurs_du_code($pdo, (string)$eleve['code']);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            repondre(['ok' => true]);

        // ------------------------------------------------------------------ tableau

        case 'tableau':
            $classe = acces_classe($pdo, $profId, $corps['classe_id'] ?? 0, 'lecture');
            $appli = (string)($corps['appli'] ?? 'defi-tables');
            if (!in_array($appli, APPLIS_PROPOSABLES, true)) erreur("Application inconnue.", 400);
            $requete = $pdo->prepare(
                'SELECT e.id, e.code, e.prenom, e.initiale, p.donnees, p.maj_le,
                        (p.donnees_avant IS NOT NULL) AS restaurable
                 FROM eleves e
                 LEFT JOIN progressions p ON p.eleve_id = e.id AND p.appli = ?
                 WHERE e.classe_id = ?
                 ORDER BY e.prenom = \'\', e.prenom, e.code'
            );
            $requete->execute([$appli, (int)$classe['id']]);
            // Un code ouvre l'appli comme l'élève et permet de modifier sa
            // progression : un collègue en lecture seule ne le reçoit pas.
            $avecCodes = $classe['droit'] !== 'lecture';
            $lignes = [];
            foreach ($requete->fetchAll() as $ligne) {
                $lignes[] = [
                    'id' => (int)$ligne['id'],
                    'code' => $avecCodes ? $ligne['code'] : null,
                    'prenom' => $ligne['prenom'],
                    'initiale' => $ligne['initiale'],
                    'parcours' => $ligne['donnees'] === null ? null : json_decode($ligne['donnees'], false),
                    'maj_le' => $ligne['maj_le'],
                    // Une version précédente existe : « Restaurer » a un sens.
                    'restaurable' => (int)$ligne['restaurable'] === 1,
                ];
            }
            repondre([
                'ok' => true,
                'classe' => [
                    'id' => (int)$classe['id'],
                    'libelle' => $classe['libelle'],
                    'applis' => explode(',', (string)$classe['applis']),
                    'droit' => $classe['droit'],
                ],
                'eleves' => $lignes,
            ]);

        default:
            erreur("Action inconnue.", 400);
    }
} catch (Throwable $e) {
    error_log('prof: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
