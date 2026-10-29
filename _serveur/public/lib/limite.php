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
//
// Une cinquième, apprise par l'audit du 05/09/2026 (constat 3, lot serveur B) :
// la même leçon vaut pour le compte du PROFESSEUR. Le seuil par identifiant
// répondait 429 même au bon mot de passe : n'importe qui, de n'importe où,
// fermait le compte de Gwenaël pour dix minutes en tapant treize bêtises sur
// son identifiant — le mot de passe n'a même pas besoin d'être approché. Ce
// seuil RALENTIT maintenant (1,5 s) au lieu de refuser. Le seuil par ADRESSE,
// lui, garde son refus net : c'est lui qui borne la dépense (une adresse qui
// dépasse 60 échecs est refusée SANS dormir).

declare(strict_types=1);

// Échecs par adresse (codes ou billets inconnus) : la fenêtre dure 5 minutes
// à partir du premier échec compté pour cette adresse.
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
// Au-delà du seuil PAR IDENTIFIANT, chaque tentative sur ce compte attend
// RALENTISSEMENT_CONNEXION_US — elle n'est pas refusée. Voir freiner_identifiant().
const RALENTISSEMENT_CONNEXION_US = 1500000;

// Secret servant à hacher les clés.
//
// Lot 11 (05/09/2026) : ce secret ne doit PAS être le mot de passe
// d'installation lui-même. Les deux vivent dans le même fichier, mais ils ne
// servent pas à la même chose — l'un ouvre verifier.php et secours.php, l'autre
// ne fait que brouiller des adresses IP dans une table. Employer la même valeur
// pour deux usages, c'est offrir à qui aurait l'un des deux le moyen de
// travailler sur l'autre (recalculer les clés de la table « compteurs » pour
// savoir si telle adresse est passée, par exemple).
//
// Deux cas :
//  - « secret » est renseigné dans config.php : il sert tel quel, et c'est le
//    réglage recommandé (verifier.php le dit) ;
//  - il manque : on ne prend plus le jeton d'installation brut, mais une valeur
//    DÉRIVÉE de lui par HMAC avec une étiquette d'usage. Personne n'a rien à
//    changer chez OVH, et le secret des compteurs n'est plus le mot de passe
//    d'installation — le connaître ne donne pas l'autre, et l'inverse non plus
//    (on ne remonte pas un HMAC).
function secret_compteurs(): string
{
    $c = config();
    $secret = (string)($c['secret'] ?? '');
    if ($secret !== '') return $secret;
    return hash_hmac('sha256', 'compteurs-de-limitation', (string)($c['jeton_installation'] ?? ''));
}

// Vrai si config.php porte un secret à lui : ce que verifier.php affiche.
function secret_compteurs_dedie(): bool
{
    return (string)(config()['secret'] ?? '') !== '';
}

function cle_compteur(string $cle, int $secondes): string
{
    return 'l:' . substr(hash_hmac('sha256', $cle, secret_compteurs()), 0, 40) . ':' . $secondes;
}

// La fenêtre est ouverte par la PREMIÈRE tentative comptée, et court $secondes
// à partir d'elle. Elle n'est plus alignée sur l'horloge.
//
// Pourquoi ce changement (07/09/2026) — l'ancien calcul,
// « (intdiv(time(), $secondes) + 1) * $secondes », découpait le temps en
// tranches communes à tout le monde, et remettait le compteur à 1 au passage
// de chaque tranche. Ces frontières se calculent de l'extérieur : elles ne
// dépendent d'aucun secret. Il suffisait de coller sa rafale à l'une d'elles
// pour en obtenir DEUX — douze essais juste avant, douze juste après, en une
// seconde, sans un seul refus. Le débit réel de tous ces freins valait le
// double de ce qu'ils annonçaient. Mesuré, puis vérifié corrigé, par les deux
// tests « lot limiteur » de tests/lancer.php.
//
// Effet de bord voulu : le compte d'un professeur bloqué se rouvre au plus
// tard dix minutes après sa PREMIÈRE erreur, et non « à la prochaine
// frontière » — ce qui pouvait être dans une seconde comme dans dix minutes.

// Fin (epoch) de la fenêtre ouverte pour cette clé, 0 si aucune n'est ouverte.
function fin_de_fenetre_de(string $cle, int $secondes, ?int $maintenant = null): int
{
    $maintenant = $maintenant ?? time();
    $requete = bd()->prepare('SELECT fenetre FROM compteurs WHERE cle = ? AND fenetre > ?');
    $requete->execute([cle_compteur($cle, $secondes), $maintenant]);
    $fin = $requete->fetchColumn();
    $requete->closeCursor();
    return $fin === false ? 0 : (int)$fin;
}

function purger_compteurs(PDO $pdo, int $maintenant): void
{
    $pdo->prepare('DELETE FROM compteurs WHERE fenetre < ?')->execute([$maintenant]);
}

// Refus 429. L'en-tête Retry-After dit dans combien de secondes la fenêtre
// se rouvre : l'appli peut le lire (cors() l'expose) et attendre juste ce
// qu'il faut au lieu de réessayer à l'aveugle. Il se lit sur la LIGNE du
// compteur : depuis que la fenêtre part de la première tentative, elle ne se
// déduit plus de l'horloge.
function refuser_trop_de_demandes(string $cle, int $secondes): never
{
    $maintenant = time();
    $fin = fin_de_fenetre_de($cle, $secondes, $maintenant);
    erreur("Trop de demandes, réessaie dans un instant.", 429,
        ['Retry-After' => (string)max(1, $fin - $maintenant)]);
}

// Compte cet appel et rend le total de la fenêtre courante.
//
// Une ligne dont la fin est encore dans le futur est incrémentée ; une ligne
// expirée est remplacée par un compte de 1 et une fenêtre neuve. Les deux
// moteurs disent la même chose, et l'instant courant leur est passé plutôt que
// relu : deux appels à time() encadrant une seconde ne donneraient pas le même
// verdict aux deux endroits.
function compter(string $cle, int $secondes): int
{
    $pdo = bd();
    $maintenant = time();
    $fin = $maintenant + $secondes;
    $cle = cle_compteur($cle, $secondes);
    purger_compteurs($pdo, $maintenant);

    if (pilote($pdo) === 'mysql') {
        // L'ordre des deux affectations compte : « nombre » lit encore
        // l'ancienne fenêtre, puis « fenetre » est remplacée.
        $pdo->prepare(
            'INSERT INTO compteurs (cle, fenetre, nombre) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE nombre = IF(fenetre > ?, nombre + 1, 1),
                                     fenetre = IF(fenetre > ?, fenetre, ?)'
        )->execute([$cle, $fin, $maintenant, $maintenant, $fin]);
    } else {
        $pdo->prepare(
            'INSERT INTO compteurs (cle, fenetre, nombre) VALUES (?, ?, 1)
             ON CONFLICT(cle) DO UPDATE SET
               nombre  = CASE WHEN fenetre > ? THEN nombre + 1 ELSE 1 END,
               fenetre = CASE WHEN fenetre > ? THEN fenetre ELSE ? END'
        )->execute([$cle, $fin, $maintenant, $maintenant, $fin]);
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
        refuser_trop_de_demandes($cle, $secondes);
    }
}

// Total de la fenêtre courante, sans compter cet appel (0 si rien n'est compté).
function compte_courant(string $cle, int $secondes): int
{
    $requete = bd()->prepare('SELECT nombre FROM compteurs WHERE cle = ? AND fenetre > ?');
    $requete->execute([cle_compteur($cle, $secondes), time()]);
    $nombre = $requete->fetchColumn();
    $requete->closeCursor();
    return $nombre === false ? 0 : (int)$nombre;
}

// Refuse (429) si la fenêtre est déjà dépassée, sans compter cet appel.
// Sert à couper court AVANT de toucher à quoi que ce soit d'autre.
function limiter_deja_atteint(string $cle, int $maximum, int $secondes): void
{
    if (compte_courant($cle, $secondes) > $maximum) {
        refuser_trop_de_demandes($cle, $secondes);
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
        refuser_trop_de_demandes('echec-ip:' . $adresse, FENETRE_ECHECS_ADRESSE);
    }
    if ($echecs > ECHECS_ADRESSE_RALENTIE) {
        usleep(RALENTISSEMENT_ADRESSE_US);
    }
}

// Connexion d'un professeur : le compte visé a déjà trop d'échecs récents.
//
// Constat 3 de l'audit du 05/09/2026, reproduit : treize mauvais mots de passe
// sur « gwenael », depuis n'importe quelle machine, et le vrai mot de passe
// répondait 429 pendant dix minutes. Le seuil censé protéger le compte servait
// à le fermer, pour le prix de treize requêtes.
//
// On ralentit donc au lieu de refuser : 1,5 s par tentative, le bon mot de
// passe passe. À 1,5 s l'essai, une devinette en ligne contre un mot de passe
// de douze caractères au minimum n'aboutit pas — et le professeur, lui, entre.
//
// Ce que cela coûte au serveur est borné par l'autre seuil : une adresse qui
// dépasse 60 échecs par dix minutes est refusée d'emblée, sans dormir. Une
// adresse ne peut donc pas faire dormir plus d'une minute et demie de processus
// PHP pendant les dix minutes qui suivent son premier échec.
function freiner_identifiant(string $identifiant): void
{
    if (compte_courant('connexion-id:' . $identifiant, FENETRE_ECHECS_CONNEXION) > ECHECS_CONNEXION_PAR_IDENTIFIANT) {
        usleep(RALENTISSEMENT_CONNEXION_US);
    }
}

// Un code ou un billet inconnu : un échec de plus pour l'adresse. Le 601e
// échec de la fenêtre répond déjà 429.
function compter_echec_adresse(string $adresse): void
{
    limiter('echec-ip:' . $adresse, ECHECS_ADRESSE_BLOQUEE, FENETRE_ECHECS_ADRESSE);
}

// ------------------------------------------- le mot de passe d'installation
//
// Lot « correctifs de l'audit Codex » (29/10/2026, défaut 3 du 22/10) : CINQ
// pages vérifient le même secret — installer.php, migrer.php, verifier.php,
// secours.php, sauvegarde.php — et chacune avait son propre frein, ou pas de
// frein du tout (migrer.php, installer.php). Un même secret avec des freins
// séparés, c'est autant d'essais que de pages ; sans frein, c'est à la vitesse
// du réseau (reproduit : 100 essais sur migrer.php en deux secondes).
//
// Un SEUL compteur, partagé par les cinq pages, par bloc d'adresse
// (adresse_limitee()), sur dix minutes. Seuls les ÉCHECS comptent : le jour
// d'un dépôt, on ouvre migrer.php, verifier.php et sauvegarde.php à la suite
// avec le bon mot de passe, et aucune porte ne doit se fermer pour ça. Au
// dixième échec, les cinq pages répondent « Trop d'essais » jusqu'à la fin
// de la fenêtre, sans même comparer le mot de passe.
const ECHECS_JETON_INSTALLATION = 10;
const FENETRE_JETON_INSTALLATION = 600;

function cle_jeton_installation(): string
{
    return 'jeton-installation:' . adresse_limitee();
}

// Vrai si cette adresse a déjà épuisé ses essais.
function jeton_installation_bloque(): bool
{
    return compte_courant(cle_jeton_installation(), FENETRE_JETON_INSTALLATION) >= ECHECS_JETON_INSTALLATION;
}

// Un essai manqué de plus pour cette adresse (quelle que soit la page).
function compter_echec_jeton_installation(): int
{
    return compter(cle_jeton_installation(), FENETRE_JETON_INSTALLATION);
}

// Dans combien de minutes la fenêtre se rouvre (au moins 1).
function attente_jeton_installation(): int
{
    $fin = fin_de_fenetre_de(cle_jeton_installation(), FENETRE_JETON_INSTALLATION);
    return max(1, (int)ceil(max(0, $fin - time()) / 60));
}

// LE contrôle, le même pour les cinq pages. Rend un mot :
//  - 'ok'        : le mot de passe est le bon ;
//  - 'trop'      : l'adresse a épuisé ses essais, rien n'a été comparé ;
//  - 'absent'    : config.php n'a pas encore de mot de passe d'installation ;
//  - 'incorrect' : mauvais mot de passe, et l'échec est compté.
// La table « compteurs » doit exister : installer.php crée les tables avant
// d'appeler ce contrôle ; verifier.php, qui doit s'ouvrir même base en panne,
// garde son propre garde-fou autour.
function verdict_jeton_installation(string $saisi): string
{
    if (jeton_installation_bloque()) return 'trop';
    $attendu = (string)(config()['jeton_installation'] ?? '');
    if ($attendu === '' || $attendu === 'à-remplacer') return 'absent';
    if (!hash_equals($attendu, $saisi)) {
        compter_echec_jeton_installation();
        return 'incorrect';
    }
    return 'ok';
}

// La phrase que la page affiche pour chaque verdict (sauf 'ok').
function message_jeton_installation(string $verdict): string
{
    return match ($verdict) {
        'trop' => "Trop d'essais depuis cette adresse : attends " . attente_jeton_installation() . " minute(s).",
        'absent' => "Renseigne d'abord « jeton_installation » dans config.php.",
        default => "Mot de passe d'installation incorrect.",
    };
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

// L'adresse telle qu'elle COMPTE dans le limiteur.
//
// Lot 11 (05/09/2026) : en IPv4, une adresse est une adresse. En IPv6, non —
// le moindre abonné reçoit un bloc entier (/64, soit 18 milliards de milliards
// d'adresses) et en change à volonté. Compter l'adresse complète, c'est offrir
// à qui essaie des codes autant de compteurs neufs qu'il en veut : les 600
// échecs qui ferment la porte ne se déclencheraient jamais.
//
// On compte donc le BLOC /64, c'est-à-dire les 64 premiers bits : le préfixe
// que l'abonné ne choisit pas. C'est la granularité retenue partout ailleurs
// pour la limitation en IPv6, et elle ne regroupe pas deux abonnés différents.
//
// Le résultat n'est jamais rangé tel quel : il passe par le HMAC de
// cle_compteur(), comme le reste (aucune adresse en clair dans la base).
function adresse_limitee(): string
{
    $adresse = adresse_appelante();
    $binaire = @inet_pton($adresse);
    if ($binaire === false || strlen($binaire) !== 16) {
        return $adresse; // IPv4, ou quelque chose qui n'est pas une adresse.
    }
    // IPv4 déguisée en IPv6 (::ffff:203.0.113.4) : c'est une vraie IPv4, on la
    // compte entière, sinon tout l'espace ::ffff:0:0/64 serait un seul compteur.
    if (str_starts_with($binaire, "\0\0\0\0\0\0\0\0\0\0\xff\xff")) {
        return $adresse;
    }
    return inet_ntop(substr($binaire, 0, 8) . str_repeat("\0", 8)) . '/64';
}
