<?php
// API élève : « à qui appartient ce code, et quelles applis lui sont proposées ? »
// Sert à la page d'accueil des élèves, et — depuis le lot 3 — à l'appli qui
// arrive avec un billet.
//
// Deux entrées, toujours en POST, jamais dans l'adresse :
//  - {code}            → prénom, classe, applis ; avec {code, billet: true},
//                        un billet d'entrée à usage unique en plus (lib/billets.php)
//  - {billet}          → l'échange : un billet d'entrée rend {code, prenom,
//                        classe} ; un billet de fiche rend la progression en
//                        lecture seule, sans le code. Le billet est consommé.

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require __DIR__ . '/../lib/applis.php';
require_once __DIR__ . '/../lib/billets.php';

cors();

function identite_eleve(PDO $pdo, int $eleveId): array|false
{
    $requete = $pdo->prepare(
        'SELECT e.id, e.code, e.prenom, c.libelle, c.applis
         FROM eleves e JOIN classes c ON c.id = e.classe_id
         WHERE e.id = ?'
    );
    $requete->execute([$eleveId]);
    $eleve = $requete->fetch();
    $requete->closeCursor();
    return $eleve;
}

try {
    // Le code n'arrive QUE dans le corps d'un POST : une adresse s'inscrit en
    // clair dans les journaux de l'hébergeur, un corps non.
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        erreur("Méthode non autorisée.", 405);
    }
    $corps = corps_json(4000);

    // Par adresse, on ne compte que les ÉCHECS : un collège entier sort par
    // une seule adresse IP, et trente élèves qui entrent en même temps ne
    // doivent pas être pris pour une attaque. Un curieux qui essaie des codes
    // (ou des billets) en série, lui, produit un échec par essai.
    $adresse = adresse_appelante();
    limiter_deja_atteint('echec-ip:' . $adresse, 60, 300);

    // ------------------------------------------------------- échange d'un billet

    if (array_key_exists('billet', $corps) && !is_bool($corps['billet'])) {
        $billet = is_string($corps['billet']) ? strtolower(trim($corps['billet'])) : '';
        if (!billet_valide($billet)) {
            erreur("Billet invalide.", 400);
        }
        // L'appli visée (pour un billet de fiche) est vérifiée AVANT
        // l'échange : une demande mal formée ne consomme pas le billet.
        $appli = is_string($corps['appli'] ?? null) ? $corps['appli'] : 'defi-tables';
        if (!appli_connue($appli)) {
            erreur("Application inconnue.", 400);
        }
        $pdo = bd();
        $echange = echanger_billet($pdo, $billet);
        $eleve = $echange === null ? false : identite_eleve($pdo, $echange['eleve_id']);
        if ($eleve === false) {
            // Inconnu, périmé, déjà utilisé, ou élève supprimé : même réponse.
            limiter('echec-ip:' . $adresse, 60, 300);
            erreur("Ce lien a expiré.", 404);
        }

        if ($echange['type'] === 'fiche') {
            // La fiche : la progression telle que le serveur la garde, et rien
            // qui permette d'écrire. Le code ne sort pas d'ici.
            $requete = $pdo->prepare('SELECT donnees, maj_le, revision FROM progressions WHERE eleve_id = ? AND appli = ?');
            $requete->execute([(int)$eleve['id'], $appli]);
            $ligne = $requete->fetch();
            $requete->closeCursor();
            repondre([
                'ok' => true,
                'type' => 'fiche',
                'prenom' => $eleve['prenom'],
                'classe' => $eleve['libelle'],
                'existe' => $ligne !== false,
                // Décodé en objets, comme parcours.php : « {} » reste « {} ».
                'parcours' => $ligne === false ? null : json_decode($ligne['donnees'], false),
                'maj_le' => $ligne === false ? null : $ligne['maj_le'],
                'revision' => $ligne === false ? 0 : (int)$ligne['revision'],
            ]);
        }

        repondre([
            'ok' => true,
            'type' => 'entree',
            'code' => $eleve['code'],
            'prenom' => $eleve['prenom'],
            'classe' => $eleve['libelle'],
        ]);
    }

    // ------------------------------------------------------------- par le code

    $code = normaliser_code(is_string($corps['code'] ?? null) ? $corps['code'] : '');
    if (!code_valide($code)) {
        erreur("Code élève invalide.", 400);
    }
    limiter('eleve:' . $code, 60, 300);

    $pdo = bd();
    $requete = $pdo->prepare(
        'SELECT e.id, e.prenom, c.libelle, c.applis
         FROM eleves e JOIN classes c ON c.id = e.classe_id
         WHERE e.code = ?'
    );
    $requete->execute([$code]);
    $eleve = $requete->fetch();
    $requete->closeCursor();
    if ($eleve === false) {
        limiter('echec-ip:' . $adresse, 60, 300);
        erreur("Code inconnu.", 404);
    }

    $reponse = [
        'ok' => true,
        'prenom' => $eleve['prenom'],
        'classe' => $eleve['libelle'],
        'applis' => applis_de_classe($eleve['applis']),
    ];
    // Le billet n'est tiré que si on le demande : l'appli relit l'identité à
    // chaque ouverture sans en avoir besoin, et un billet que personne
    // n'attend est une clé de plus qui traîne, même deux minutes.
    if (($corps['billet'] ?? false) === true) {
        $reponse['billet'] = emettre_billet($pdo, (int)$eleve['id'], 'entree');
    }
    repondre($reponse);
} catch (Throwable $e) {
    error_log('eleve: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
