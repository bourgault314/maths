<?php
// API prof : connexion, classes, codes élèves, tableau de la classe.
// Tout passe par POST + un jeton de session obtenu par « connexion ».

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require __DIR__ . '/../lib/auth.php';

const MAX_ELEVES_PAR_LOT = 60;
const APPLIS_PROPOSABLES = ['defi-tables', 'automatismes'];

cors();

function texte(mixed $valeur, int $max): string
{
    $texte = is_string($valeur) ? $valeur : '';
    $texte = preg_replace('/\s+/u', ' ', $texte) ?? '';
    return mb_substr(trim($texte), 0, $max);
}

function classe_du_prof(PDO $pdo, mixed $id): array
{
    $requete = $pdo->prepare('SELECT * FROM classes WHERE id = ?');
    $requete->execute([(int)$id]);
    $classe = $requete->fetch();
    if ($classe === false) erreur("Classe introuvable.", 404);
    return $classe;
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

    switch ($action) {
        case 'deconnexion':
            fermer_session($pdo, $jeton);
            repondre(['ok' => true]);

        case 'moi':
            $requete = $pdo->prepare('SELECT identifiant FROM profs WHERE id = ?');
            $requete->execute([$profId]);
            repondre(['ok' => true, 'identifiant' => (string)$requete->fetchColumn()]);

        case 'classes.liste':
            $classes = $pdo->query(
                'SELECT c.id, c.libelle, c.applis, c.cree_le,
                        (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = c.id) AS eleves
                 FROM classes c ORDER BY c.libelle'
            )->fetchAll();
            repondre(['ok' => true, 'classes' => $classes]);

        case 'classes.creer':
            $libelle = texte($corps['libelle'] ?? '', 40);
            if ($libelle === '') erreur("Donne un nom à la classe.", 400);
            $applis = array_values(array_intersect(APPLIS_PROPOSABLES, (array)($corps['applis'] ?? ['defi-tables'])));
            if ($applis === []) $applis = ['defi-tables'];
            $pdo->prepare('INSERT INTO classes (libelle, applis, cree_le) VALUES (?, ?, ?)')
                ->execute([$libelle, implode(',', $applis), maintenant()]);
            repondre(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);

        case 'classes.modifier':
            $classe = classe_du_prof($pdo, $corps['classe_id'] ?? 0);
            $libelle = texte($corps['libelle'] ?? $classe['libelle'], 40);
            if ($libelle === '') erreur("Donne un nom à la classe.", 400);
            $applis = array_values(array_intersect(APPLIS_PROPOSABLES, (array)($corps['applis'] ?? explode(',', $classe['applis']))));
            if ($applis === []) $applis = ['defi-tables'];
            $pdo->prepare('UPDATE classes SET libelle = ?, applis = ? WHERE id = ?')
                ->execute([$libelle, implode(',', $applis), (int)$classe['id']]);
            repondre(['ok' => true]);

        case 'classes.supprimer':
            $classe = classe_du_prof($pdo, $corps['classe_id'] ?? 0);
            $requete = $pdo->prepare('SELECT id FROM eleves WHERE classe_id = ?');
            $requete->execute([(int)$classe['id']]);
            foreach ($requete->fetchAll() as $eleve) {
                $pdo->prepare('DELETE FROM progressions WHERE eleve_id = ?')->execute([(int)$eleve['id']]);
            }
            $pdo->prepare('DELETE FROM eleves WHERE classe_id = ?')->execute([(int)$classe['id']]);
            $pdo->prepare('DELETE FROM classes WHERE id = ?')->execute([(int)$classe['id']]);
            repondre(['ok' => true]);

        case 'eleves.ajouter':
            $classe = classe_du_prof($pdo, $corps['classe_id'] ?? 0);
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
            $requete = $pdo->prepare('SELECT id FROM eleves WHERE id = ?');
            $requete->execute([(int)($corps['eleve_id'] ?? 0)]);
            if ($requete->fetchColumn() === false) erreur("Élève introuvable.", 404);
            $pdo->prepare('UPDATE eleves SET prenom = ?, initiale = ? WHERE id = ?')->execute([
                texte($corps['prenom'] ?? '', 40),
                mb_strtoupper(mb_substr(texte($corps['initiale'] ?? '', 4), 0, 1)),
                (int)$corps['eleve_id'],
            ]);
            repondre(['ok' => true]);

        case 'eleves.regenerer':
            $requete = $pdo->prepare('SELECT id FROM eleves WHERE id = ?');
            $requete->execute([(int)($corps['eleve_id'] ?? 0)]);
            if ($requete->fetchColumn() === false) erreur("Élève introuvable.", 404);
            $code = code_libre($pdo);
            $pdo->prepare('UPDATE eleves SET code = ? WHERE id = ?')->execute([$code, (int)$corps['eleve_id']]);
            repondre(['ok' => true, 'code' => $code]);

        case 'eleves.supprimer':
            $id = (int)($corps['eleve_id'] ?? 0);
            $requete = $pdo->prepare('SELECT id FROM eleves WHERE id = ?');
            $requete->execute([$id]);
            if ($requete->fetchColumn() === false) erreur("Élève introuvable.", 404);
            $pdo->prepare('DELETE FROM progressions WHERE eleve_id = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM eleves WHERE id = ?')->execute([$id]);
            repondre(['ok' => true]);

        case 'tableau':
            $classe = classe_du_prof($pdo, $corps['classe_id'] ?? 0);
            $appli = (string)($corps['appli'] ?? 'defi-tables');
            if (!in_array($appli, APPLIS_PROPOSABLES, true)) erreur("Application inconnue.", 400);
            $requete = $pdo->prepare(
                'SELECT e.id, e.code, e.prenom, e.initiale, p.donnees, p.maj_le
                 FROM eleves e
                 LEFT JOIN progressions p ON p.eleve_id = e.id AND p.appli = ?
                 WHERE e.classe_id = ?
                 ORDER BY e.prenom = \'\', e.prenom, e.code'
            );
            $requete->execute([$appli, (int)$classe['id']]);
            $lignes = [];
            foreach ($requete->fetchAll() as $ligne) {
                $lignes[] = [
                    'id' => (int)$ligne['id'],
                    'code' => $ligne['code'],
                    'prenom' => $ligne['prenom'],
                    'initiale' => $ligne['initiale'],
                    'parcours' => $ligne['donnees'] === null ? null : json_decode($ligne['donnees'], true),
                    'maj_le' => $ligne['maj_le'],
                ];
            }
            repondre([
                'ok' => true,
                'classe' => ['id' => (int)$classe['id'], 'libelle' => $classe['libelle'], 'applis' => explode(',', $classe['applis'])],
                'eleves' => $lignes,
            ]);

        default:
            erreur("Action inconnue.", 400);
    }
} catch (Throwable $e) {
    error_log('prof: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
