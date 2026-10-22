<?php
// API élève : « à qui appartient ce code, et quelles applis lui sont proposées ? »
// Sert à la page d'accueil des élèves, et — depuis le lot 3 — à l'appli qui
// arrive avec un billet.
//
// Deux entrées, toujours en POST, jamais dans l'adresse :
//  - {code}            → prénom, classe, applis et réglages de l'ÉLÈVE : ceux
//                        de sa classe (lot « splat-suivi-5 ») plus ce qu'on lui
//                        a ouvert en plus (lot « Qui voit quoi », 22/10/2026,
//                        lib/applis.php) ; avec {code, billet: true}, un billet
//                        d'entrée à usage unique en plus (lib/billets.php)
//  - {billet}          → l'échange : un billet d'entrée rend {code, prenom,
//                        classe, reglages} ; un billet de fiche rend la progression en
//                        lecture seule, sans le code. Le billet est consommé.

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require __DIR__ . '/../lib/applis.php';
require_once __DIR__ . '/../lib/billets.php';
require_once __DIR__ . '/../lib/records.php';

cors();

// Lot « splat-suivi-5 » : la colonne des réglages de la classe (les mondes de
// SPLAT! ouverts) n'existe qu'après migrer.php ; avant, on ne la demande pas,
// et tout se lit « tous les mondes ouverts ». Lot « Qui voit quoi »
// (22/10/2026) : même chose pour eleves.ajouts — avant la mise à niveau, tout
// se lit « rien en plus ».
function colonnes_reglages(PDO $pdo): string
{
    return (reglages_disponibles($pdo) ? ', c.reglages' : '') . (ajouts_disponibles($pdo) ? ', e.ajouts' : '');
}

function identite_eleve(PDO $pdo, int $eleveId): array|false
{
    $requete = $pdo->prepare(
        'SELECT e.id, e.code, e.prenom, c.libelle, c.applis' . colonnes_reglages($pdo) . '
         FROM eleves e JOIN classes c ON c.id = e.classe_id
         WHERE e.id = ?'
    );
    $requete->execute([$eleveId]);
    $eleve = $requete->fetch();
    $requete->closeCursor();
    return $eleve;
}

// Ce que CET élève voit : sa classe + ses ajouts (lib/applis.php,
// acces_de_l_eleve — la seule règle). Les applis, affichables, dans l'ordre du
// catalogue ; les réglages, « {} » quand tout est ouvert.
function acces_affichable(array $eleve): array
{
    $acces = acces_de_l_eleve($eleve, isset($eleve['ajouts']) ? (string)$eleve['ajouts'] : null);
    return [
        'applis' => array_map('appli_affichable', $acces['applis']),
        'reglages' => reglages_json($acces['reglages']),
    ];
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
    // (ou des billets) en série, lui, produit un échec par essai : au-delà de
    // 60, chaque requête de l'adresse est ralentie (elle répond encore juste),
    // au-delà de 600 elle est refusée (lib/limite.php).
    // adresse_limitee() : en IPv6, c'est le bloc /64 qui compte, pas l'adresse
    // exacte — sinon un curieux change d'adresse à chaque essai et le compteur
    // ne monte jamais (lot 11, lib/limite.php).
    $adresse = adresse_limitee();
    freiner_adresse($adresse);

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
            compter_echec_adresse($adresse);
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
                // Lot « Les records » : le record de la Légende, pour la
                // ligne d'en-tête de sa fiche (null : aucun, ou pas Défi tables).
                'record' => $appli === 'defi-tables' && records_disponibles($pdo) ? record_affichable(record_de($pdo, (int)$eleve['id'])) : null,
            ]);
        }

        repondre([
            'ok' => true,
            'type' => 'entree',
            'code' => $eleve['code'],
            'prenom' => $eleve['prenom'],
            'classe' => $eleve['libelle'],
            // Les réglages de CET élève pour ses activités (les mondes de
            // SPLAT! ouverts par sa classe, plus les siens) — « {} » quand
            // rien n'est fermé.
            'reglages' => acces_affichable($eleve)['reglages'],
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
        'SELECT e.id, e.prenom, c.libelle, c.applis' . colonnes_reglages($pdo) . '
         FROM eleves e JOIN classes c ON c.id = e.classe_id
         WHERE e.code = ?'
    );
    $requete->execute([$code]);
    $eleve = $requete->fetch();
    $requete->closeCursor();
    if ($eleve === false) {
        compter_echec_adresse($adresse);
        erreur("Code inconnu.", 404);
    }

    // Lot « Qui voit quoi » (22/10/2026) : « applis » et « reglages » sont ce
    // que voit CET élève — sa classe plus ses ajouts —, sous les mêmes noms et
    // la même forme qu'avant : la page n'a rien à savoir d'où ça vient. La
    // tuile de l'espace et la carte des mondes grisent les mondes qui ne lui
    // sont pas ouverts (lot « splat-suivi-5 »).
    $reponse = [
        'ok' => true,
        'prenom' => $eleve['prenom'],
        'classe' => $eleve['libelle'],
    ] + acces_affichable($eleve);
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
