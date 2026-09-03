<?php
// Limitation du nombre de requêtes, par code élève ou par adresse IP.
//
// Trois règles, apprises par l'audit du 30/08/2026 :
//  - la table « compteurs » ne contient jamais une adresse IP ni un code en
//    clair : la clé est un HMAC avec un secret du serveur ;
//  - l'incrément tient en une seule instruction SQL (UPSERT) : deux requêtes
//    simultanées ne peuvent plus ni franchir le contrôle ensemble, ni entrer
//    en collision sur un INSERT ;
//  - chaque ligne porte l'instant où sa fenêtre se ferme, et les lignes
//    fermées sont effacées à chaque appel : la table ne grossit pas sans fin
//    et une adresse IP n'y survit pas plus longtemps que sa fenêtre.
//
// Et une quatrième, apprise par l'audit du 01/09/2026 (lot 5) : un collège
// entier sort par UNE adresse IP. Par adresse, on ne compte que les échecs,
// et l'on ne coupe pas net à la première classe maladroite : au-delà de 60
// échecs, chaque requête de l'adresse est RALENTIE (1,5 s) mais répond encore
// juste ; le refus (429) n'arrive qu'à 600 échecs par cinq minutes — une
// attaque, pas trente élèves qui se trompent deux fois en début d'heure.

declare(strict_types=1);

// Échecs par adresse (codes ou billets inconnus), par fenêtre de 5 minutes.
const FENETRE_ECHECS_ADRESSE = 300;
// Au-delà : chaque requête de l'adresse attend RALENTISSEMENT_ADRESSE_US.
const ECHECS_ADRESSE_RALENTIE = 60;
// Au-delà : 429 jusqu'à la fin de la fenêtre. Le seuil coupe net pour ne pas
// laisser des processus PHP dormir sans fin sur un hébergement mutualisé.
const ECHECS_ADRESSE_BLOQUEE = 600;
const RALENTISSEMENT_ADRESSE_US = 1500000;

// Connexion prof : seuls les ÉCHECS comptent, par adresse et par identifiant,
// sur dix minutes. Treize professeurs d'un même collège qui se connectent le
// même quart d'heure ne sont pas une attaque ; douze mauvais mots de passe sur
// un même compte, si.
const FENETRE_ECHECS_CONNEXION = 600;
const ECHECS_CONNEXION_PAR_ADRESSE = 60;
const ECHECS_CONNEXION_PAR_IDENTIFIANT = 12;

// Secret servant à hacher les clés. « secret » dans config.php si présent,
// sinon le jeton d'installation, qui y est déjà : rien à ajouter chez OVH.
function secret_compteurs(): string
{
    $c = config();
    $secret = (string)($c['secret'] ?? '');
    if ($secret === '') $secret = (string)($c['jeton_installation'] ?? '');
    return $secret;
}

function cle_compteur(string $cle, int $secondes): string
{
    return 'l:' . substr(hash_hmac('sha256', $cle, secret_compteurs()), 0, 40) . ':' . $secondes;
}

// Instant (epoch) où la fenêtre courante se ferme.
function fin_de_fenetre(int $secondes): int
{
    return (intdiv(time(), $secondes) + 1) * $secondes;
}

function purger_compteurs(PDO $pdo): void
{
    $pdo->prepare('DELETE FROM compteurs WHERE fenetre < ?')->execute([time()]);
}

// Refus 429. L'en-tête Retry-After dit dans combien de secondes la fenêtre
// se rouvre : l'appli peut le lire (cors() l'expose) et attendre juste ce
// qu'il faut au lieu de réessayer à l'aveugle.
function refuser_trop_de_demandes(int $secondes): never
{
    erreur("Trop de demandes, réessaie dans un instant.", 429,
        ['Retry-After' => (string)max(1, fin_de_fenetre($secondes) - time())]);
}

// Compte cet appel et rend le total de la fenêtre courante.
function compter(string $cle, int $secondes): int
{
    $pdo = bd();
    $fin = fin_de_fenetre($secondes);
    $cle = cle_compteur($cle, $secondes);
    purger_compteurs($pdo);

    if (pilote($pdo) === 'mysql') {
        // L'ordre des deux affectations compte : « nombre » lit encore
        // l'ancienne fenêtre, puis « fenetre » est remplacée.
        $pdo->prepare(
            'INSERT INTO compteurs (cle, fenetre, nombre) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE nombre = IF(fenetre = ?, nombre + 1, 1), fenetre = ?'
        )->execute([$cle, $fin, $fin, $fin]);
    } else {
        $pdo->prepare(
            'INSERT INTO compteurs (cle, fenetre, nombre) VALUES (?, ?, 1)
             ON CONFLICT(cle) DO UPDATE SET
               nombre = CASE WHEN fenetre = excluded.fenetre THEN nombre + 1 ELSE 1 END,
               fenetre = excluded.fenetre'
        )->execute([$cle, $fin]);
    }

    $requete = $pdo->prepare('SELECT nombre FROM compteurs WHERE cle = ?');
    $requete->execute([$cle]);
    $nombre = (int)$requete->fetchColumn();
    $requete->closeCursor();
    return $nombre;
}

// Compte cet appel, et refuse (429) si la fenêtre est dépassée.
function limiter(string $cle, int $maximum, int $secondes): void
{
    if (compter($cle, $secondes) > $maximum) {
        refuser_trop_de_demandes($secondes);
    }
}

// Total de la fenêtre courante, sans compter cet appel (0 si rien n'est compté).
function compte_courant(string $cle, int $secondes): int
{
    $requete = bd()->prepare('SELECT nombre FROM compteurs WHERE cle = ? AND fenetre = ?');
    $requete->execute([cle_compteur($cle, $secondes), fin_de_fenetre($secondes)]);
    $nombre = $requete->fetchColumn();
    $requete->closeCursor();
    return $nombre === false ? 0 : (int)$nombre;
}

// Refuse (429) si la fenêtre est déjà dépassée, sans compter cet appel.
// Sert à couper court AVANT de toucher à quoi que ce soit d'autre.
function limiter_deja_atteint(string $cle, int $maximum, int $secondes): void
{
    if (compte_courant($cle, $secondes) > $maximum) {
        refuser_trop_de_demandes($secondes);
    }
}

// ------------------------------------------------------------ par adresse IP
//
// Appelé en tête de chaque requête élève, avant de regarder le code ou le
// billet. Les échecs déjà comptés pour l'adresse décident :
//  - au-delà de ECHECS_ADRESSE_BLOQUEE : 429 tout de suite, sans attendre
//    (des processus PHP qui dorment coûtent cher sur un hébergement partagé) ;
//  - au-delà de ECHECS_ADRESSE_RALENTIE : la requête attend 1,5 s, puis
//    répond comme d'habitude — 200 pour un bon code, 404 sinon.
// Le ralentissement suffit à fermer l'énumération : à 1,5 s par essai, une
// adresse teste au mieux 2 400 codes à l'heure sur un milliard possibles. On
// n'a plus besoin de refuser les bons codes pour cacher leur 200, et une
// classe qui se trompe n'empêche plus le reste du collège d'entrer.
function freiner_adresse(string $adresse): void
{
    $echecs = compte_courant('echec-ip:' . $adresse, FENETRE_ECHECS_ADRESSE);
    if ($echecs > ECHECS_ADRESSE_BLOQUEE) {
        refuser_trop_de_demandes(FENETRE_ECHECS_ADRESSE);
    }
    if ($echecs > ECHECS_ADRESSE_RALENTIE) {
        usleep(RALENTISSEMENT_ADRESSE_US);
    }
}

// Un code ou un billet inconnu : un échec de plus pour l'adresse. Le 601e
// échec de la fenêtre répond déjà 429.
function compter_echec_adresse(string $adresse): void
{
    limiter('echec-ip:' . $adresse, ECHECS_ADRESSE_BLOQUEE, FENETRE_ECHECS_ADRESSE);
}

// Efface les compteurs liés à un code (élève supprimé, code régénéré).
function oublier_compteurs_du_code(PDO $pdo, string $code): void
{
    foreach ([['eleve:' . $code, 300], ['code:' . $code, 300]] as [$cle, $secondes]) {
        $pdo->prepare('DELETE FROM compteurs WHERE cle = ?')->execute([cle_compteur($cle, $secondes)]);
    }
}

function adresse_appelante(): string
{
    return (string)($_SERVER['REMOTE_ADDR'] ?? 'inconnue');
}
