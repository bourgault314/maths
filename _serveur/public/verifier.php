<?php
// Page de diagnostic : dit en français ce qui marche et ce qui ne marche pas.
//
// Elle ne montre rien sans le mot de passe d'installation (jeton_installation
// de config.php) : version de PHP, nombre de comptes ou état de la base sont
// des renseignements utiles à un attaquant, pas au public. Seule exception :
// tant que config.php n'existe pas, elle le dit — il n'y a rien d'autre à
// protéger à ce stade.

declare(strict_types=1);

require_once __DIR__ . '/lib/entetes.php';

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
// Pas de script dans cette page : le nonce renvoyé ne sert pas.
entetes_page();

$configOk = is_file(__DIR__ . '/config.php');
$autorise = false;
$message = '';
$lignes = [];

function verif(array &$lignes, string $titre, callable $test): void
{
    try {
        $lignes[] = ['ok' => true, 'titre' => $titre, 'detail' => (string)$test()];
    } catch (Throwable $e) {
        // Les exceptions techniques (PDO…) peuvent citer l'hôte ou l'utilisateur
        // de la base : on ne relaie que les messages écrits par nous.
        $detail = ($e instanceof RuntimeException && !($e instanceof PDOException))
            ? $e->getMessage() : "échec (détail dans le journal d'erreurs du serveur).";
        error_log('verifier: ' . $e->getMessage());
        $lignes[] = ['ok' => false, 'titre' => $titre, 'detail' => $detail];
    }
}

if (!$configOk) {
    $lignes[] = ['ok' => false, 'titre' => "Le fichier config.php est en place",
        'detail' => "Fichier config.php absent : recopie config.exemple.php."];
} else {
    require __DIR__ . '/lib/bd.php';
    require __DIR__ . '/lib/reponse.php';
    require __DIR__ . '/lib/limite.php';
    require __DIR__ . '/lib/archives.php';
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        try {
            $attendu = (string)(config()['jeton_installation'] ?? '');
            if ($attendu === '' || $attendu === 'à-remplacer') {
                $message = "Renseigne d'abord « jeton_installation » dans config.php.";
            } elseif (!hash_equals($attendu, (string)($_POST['jeton'] ?? ''))) {
                $message = "Mot de passe d'installation incorrect.";
            } else {
                $autorise = true;
            }
        } catch (Throwable $e) {
            error_log('verifier: ' . $e->getMessage());
            $message = "Le fichier config.php ne se lit pas : vérifie sa syntaxe.";
        }
    }
}

if ($autorise) {
    verif($lignes, "PHP fonctionne", fn() => "version " . PHP_VERSION);
    verif($lignes, "Connexion à la base de données", function () {
        try {
            $pdo = bd();
            $pdo->query('SELECT 1');
            // La version compte : le limiteur emploie une instruction propre à
            // chaque moteur (MySQL/MariaDB ou SQLite), jouée à la ligne suivante.
            $version = pilote($pdo) === 'sqlite'
                ? 'SQLite ' . (string)$pdo->query('SELECT sqlite_version()')->fetchColumn()
                : (string)$pdo->query('SELECT VERSION()')->fetchColumn();
        } catch (PDOException $e) {
            error_log('verifier: ' . $e->getMessage());
            throw new RuntimeException("la base ne répond pas : vérifie hôte, base, utilisateur et mot de passe dans config.php.");
        }
        return "réussie — " . $version;
    });
    verif($lignes, "Tables du suivi", function () {
        $pdo = bd();
        $manquantes = [];
        foreach (['classes', 'eleves', 'progressions', 'profs', 'partages', 'sessions_prof', 'compteurs', 'billets'] as $table) {
            try { $pdo->query("SELECT 1 FROM $table LIMIT 1"); }
            catch (Throwable $e) { $manquantes[] = $table; }
        }
        if ($manquantes !== []) {
            throw new RuntimeException("manquantes : " . implode(', ', $manquantes) . " — ouvre installer.php (première installation) ou migrer.php (mise à niveau).");
        }
        return "toutes présentes";
    });
    // Ce que la mise à niveau du 30/08/2026 devait ajouter. Une table présente
    // ne suffit pas : il faut aussi les colonnes, sinon l'API tombe en panne.
    verif($lignes, "Cloisonnement des classes", function () {
        $pdo = bd();
        $manquants = [];
        if (!table_existe($pdo, 'partages')) $manquants[] = "la table « partages »";
        if (!colonne_existe($pdo, 'classes', 'prof_id')) $manquants[] = "la colonne « classes.prof_id »";
        if (!colonne_existe($pdo, 'profs', 'admin')) $manquants[] = "la colonne « profs.admin »";
        if ($manquants !== []) {
            throw new RuntimeException(
                "manque " . implode(', ', $manquants) . " — relance migrer.php avec ton mot de passe d'installation.");
        }
        $administrateurs = (int)$pdo->query('SELECT COUNT(*) FROM profs WHERE admin = 1')->fetchColumn();
        if ($administrateurs === 0) {
            throw new RuntimeException("aucun compte administrateur — relance migrer.php.");
        }
        return "propriétaire, partages et administrateur en place";
    });
    // Mise à niveau du lot A2 (30/08/2026) : révision et version précédente des
    // progressions, et les colonnes réservées au lot S2.
    verif($lignes, "Synchronisation (révisions)", function () {
        $pdo = bd();
        $manquants = [];
        foreach ([['progressions', 'revision'], ['progressions', 'donnees_avant'], ['profs', 'actif'], ['profs', 'mdp_temporaire']] as [$table, $colonne]) {
            if (!colonne_existe($pdo, $table, $colonne)) $manquants[] = "$table.$colonne";
        }
        if ($manquants !== []) {
            throw new RuntimeException("manque " . implode(', ', $manquants) . " — relance migrer.php avec ton mot de passe d'installation.");
        }
        return "révision et version précédente en place";
    });
    // Le limiteur d'essais s'écrit avec une instruction propre à chaque moteur
    // (MySQL chez OVH, SQLite dans les tests) : on la joue ici, sur la vraie
    // base, pour voir qu'elle passe. Deux passages doivent compter 2.
    verif($lignes, "Limiteur d'essais", function () {
        $pdo = bd();
        $cle = 'verification:' . bin2hex(random_bytes(4));
        limiter($cle, 1000, 60);
        limiter($cle, 1000, 60);
        $requete = $pdo->prepare('SELECT nombre FROM compteurs WHERE cle = ?');
        $requete->execute([cle_compteur($cle, 60)]);
        $nombre = (int)$requete->fetchColumn();
        $pdo->prepare('DELETE FROM compteurs WHERE cle = ?')->execute([cle_compteur($cle, 60)]);
        if ($nombre !== 2) {
            throw new RuntimeException("le compteur vaut $nombre au lieu de 2 : l'instruction UPSERT ne passe pas sur cette base.");
        }
        $lignesCompteurs = (int)$pdo->query('SELECT COUNT(*) FROM compteurs')->fetchColumn();
        return "en place ($lignesCompteurs compteur(s) en cours, purgés à chaque appel)";
    });
    // Lot 5 (03/09/2026) : le limiteur compte les échecs PAR ADRESSE. Si le
    // serveur voyait l'adresse d'un équipement placé devant lui (équilibreur,
    // mandataire) au lieu de celle du visiteur, toute la planète partagerait
    // un seul compteur. La ligne montre ce que le serveur voit : à comparer
    // avec l'adresse que donne « mon ip » dans un moteur de recherche.
    verif($lignes, "Adresse vue par le serveur", function () {
        $adresse = adresse_appelante();
        $detail = $adresse;
        $privee = filter_var($adresse, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
        if ($privee) {
            $detail .= " — adresse locale ou privée : c'est celle d'un équipement devant le serveur (ou un serveur de test), pas celle du visiteur ; en production, tous les visiteurs partageraient alors le même compteur";
        } else {
            $detail .= " — doit être TON adresse (celle que donne « mon ip » dans un moteur de recherche), pas une adresse de l'hébergeur";
        }
        // Un équipement devant le serveur transmet en général l'adresse
        // d'origine dans cet en-tête ; on le montre sans s'y fier (il se forge).
        $transmise = (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
        if ($transmise !== '') {
            $detail .= " ; en-tête X-Forwarded-For reçu : " . substr($transmise, 0, 80);
        }
        return $detail;
    });
    // Lot 12 : la fin d'année. Cette ligne NE TOUCHE À RIEN — elle montre ce
    // que la suppression automatique prendra, pour qu'on le voie AVANT, jamais
    // après. Les prénoms, les codes et les progressions d'une année scolaire
    // sont supprimés au plus tard le 1er août qui suit (fiche de registre).
    verif($lignes, "Suppression de fin d'année", function () {
        $courante = annee_scolaire_courante();
        $echues = classes_echues(bd());
        if ($echues === []) {
            $quand = purge_de_l_annee($courante);
            return "rien à supprimer — année scolaire en cours : $courante ; les classes de cette année partiront le " . $quand;
        }
        $noms = [];
        $mures = 0;
        foreach ($echues as $classe) {
            $noms[] = $classe['libelle'] . ' (' . $classe['annee'] . ', dernière activité le ' . $classe['derniere_activite'] . ')';
            if ($classe['mure']) $mures++;
        }
        throw new RuntimeException(count($echues) . " classe(s) d'une année passée : " . implode(', ', array_slice($noms, 0, 6))
            . " — dont $mures sera(ont) SUPPRIMÉE(S) à la prochaine ouverture de « Ma classe ». Vérifie que c'est bien voulu avant de continuer.");
    });
    verif($lignes, "Comptes prof", function () {
        $nombre = (int)bd()->query('SELECT COUNT(*) FROM profs')->fetchColumn();
        if ($nombre === 0) throw new RuntimeException("aucun compte : ouvre installer.php.");
        $desactives = (int)bd()->query('SELECT COUNT(*) FROM profs WHERE actif = 0')->fetchColumn();
        $temporaires = (int)bd()->query('SELECT COUNT(*) FROM profs WHERE mdp_temporaire = 1')->fetchColumn();
        return "$nombre compte(s), $desactives désactivé(s), $temporaires avec un mot de passe temporaire à changer";
    });
    // Lot S2 (30/08/2026) : le moteur de Défi tables est servi d'ici, plus
    // depuis mathsgo.re — la politique de contenu de « Ma classe » n'accepte
    // plus de script d'un autre domaine. S'il manque, le tableau reste vide.
    verif($lignes, "Moteur de Défi tables servi localement", function () {
        $chemin = __DIR__ . '/prof/defi_tables_mon_parcours.js';
        if (!is_file($chemin) || filesize($chemin) === 0) {
            throw new RuntimeException("prof/defi_tables_mon_parcours.js absent : à déposer (copie de outils/calcul_mental/defi_tables_mon_parcours.js du dépôt).");
        }
        if (!str_contains((string)file_get_contents($chemin), 'MATHSGO_DEFI_TABLES_MON_PARCOURS')) {
            throw new RuntimeException("prof/defi_tables_mon_parcours.js n'est pas le moteur attendu.");
        }
        return "en place (" . number_format((float)filesize($chemin), 0, ',', ' ') . " octets, empreinte " . substr(md5_file($chemin), 0, 10) . ")";
    });
    // Lot 7 (03/09/2026) : le logo et les icônes sont servis d'ici, la
    // politique de contenu n'accepte plus d'image d'un autre domaine. S'ils
    // manquent, les deux pages s'affichent sans logo et sans favicon.
    verif($lignes, "Logo et icônes servis localement", function () {
        $manquants = [];
        $total = 0;
        foreach (['mathsgo-logo.png', 'mathsgo-logo-print.png', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png'] as $fichier) {
            $chemin = __DIR__ . '/' . $fichier;
            if (!is_file($chemin) || filesize($chemin) === 0) { $manquants[] = $fichier; continue; }
            $total += (int)filesize($chemin);
        }
        if ($manquants !== []) {
            throw new RuntimeException(implode(', ', $manquants) . " absent(s) : à déposer à la racine du suivi (copies du dépôt).");
        }
        return "5 fichiers en place (" . number_format((float)$total, 0, ',', ' ') . " octets)";
    });
    // Lot 12 (05/09/2026) — B-F09 : la publication du serveur est manuelle
    // (WinSCP), et rien ne prouvait que ce qui tourne est ce qui a été testé.
    // Chaque lot dépose un fichier VERSION : la liste des fichiers avec leur
    // empreinte SHA-256. On la refait ici, sur les fichiers réellement en
    // place. Un fichier oublié pendant le dépôt se nomme tout seul.
    verif($lignes, "Fichiers du serveur conformes au dépôt", function () {
        $manifeste = __DIR__ . '/VERSION';
        if (!is_file($manifeste)) {
            throw new RuntimeException("fichier VERSION absent : il se dépose avec le lot, à la racine du suivi.");
        }
        $texte = (string)file_get_contents($manifeste);
        preg_match('/^lot (.+)$/m', $texte, $m);
        $lot = isset($m[1]) ? trim($m[1]) : 'inconnu';
        preg_match('/^manifeste ([0-9a-f]{64})$/m', $texte, $m);
        $empreinte = $m[1] ?? '';

        $manquants = [];
        $differents = [];
        $finsDeLigne = [];
        $comptes = 0;
        foreach (explode("\n", $texte) as $ligne) {
            if (!preg_match('/^([0-9a-f]{64})  (.+)$/', $ligne, $m)) continue;
            [$tout, $attendu, $relatif] = $m;
            $comptes++;
            // Aucun chemin fantaisiste : le manifeste ne décrit que ce dossier.
            if (str_contains($relatif, '..')) { $differents[] = $relatif; continue; }
            $chemin = __DIR__ . '/' . $relatif;
            if (!is_file($chemin)) { $manquants[] = $relatif; continue; }
            $contenu = (string)file_get_contents($chemin);
            if (hash('sha256', $contenu) === $attendu) continue;
            // Un client FTP en mode « texte » remplace les fins de ligne : le
            // fichier est le bon, transporté de travers. On le dit, sinon la
            // page devient rouge partout sans expliquer pourquoi.
            if (hash('sha256', str_replace("\r\n", "\n", $contenu)) === $attendu) $finsDeLigne[] = $relatif;
            else $differents[] = $relatif;
        }
        if ($comptes === 0) {
            throw new RuntimeException("le fichier VERSION ne contient aucune empreinte : il a été abîmé pendant le transfert.");
        }
        $ennuis = [];
        if ($manquants !== []) $ennuis[] = count($manquants) . " absent(s) : " . implode(', ', array_slice($manquants, 0, 6));
        if ($differents !== []) $ennuis[] = count($differents) . " différent(s) du dépôt : " . implode(', ', array_slice($differents, 0, 6));
        if ($finsDeLigne !== []) {
            $ennuis[] = count($finsDeLigne) . " transféré(s) en mode texte (seules les fins de ligne diffèrent) : "
                . "passe ton client FTP en mode binaire et redépose — " . implode(', ', array_slice($finsDeLigne, 0, 4));
        }
        if ($ennuis !== []) {
            throw new RuntimeException(implode(' ; ', $ennuis) . " — redépose ces fichiers.");
        }
        return "$comptes fichiers, tous identiques au dépôt (lot « $lot », manifeste " . substr($empreinte, 0, 10) . ")";
    });
    // Lot 12 : la sauvegarde de la base est chiffrée avant de quitter le
    // serveur. On vérifie ici que l'hébergeur sait le faire, le jour calme,
    // et pas le jour où on en a besoin.
    verif($lignes, "Chiffrement des sauvegardes disponible", function () {
        if (!function_exists('openssl_encrypt') || !in_array('aes-256-cbc', openssl_get_cipher_methods(), true)) {
            throw new RuntimeException("l'extension openssl de PHP manque : sauvegarde.php ne pourra produire qu'un fichier EN CLAIR, à chiffrer toi-même sur ton ordinateur.");
        }
        return "oui (AES-256-CBC, format openssl)";
    });
    verif($lignes, "Fichiers d'installation supprimés", function () {
        $restants = [];
        // secours.php et sauvegarde.php sont du même genre : on les dépose le
        // temps d'une opération, jamais plus. Laissés en ligne, ils offrent à
        // qui connaît le mot de passe d'installation un nouveau mot de passe
        // administrateur, ou toute la base.
        foreach (['installer.php', 'migrer.php', 'secours.php', 'sauvegarde.php'] as $fichier) {
            if (is_file(__DIR__ . '/' . $fichier)) $restants[] = $fichier;
        }
        if ($restants !== []) {
            throw new RuntimeException(implode(' et ', $restants) . " encore là : à supprimer une fois l'opération faite.");
        }
        return "oui";
    });
}

$tout = $lignes !== [] && array_reduce($lignes, fn($acc, $l) => $acc && $l['ok'], true);
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Vérification du serveur de suivi</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; background: #f5f7fa; color: #1c2b3a; }
  main { max-width: 36rem; margin: 3rem auto; background: #fff; padding: 1.5rem; border-radius: 12px;
         box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  h1 { font-size: 1.3rem; margin-top: 0; }
  ul { list-style: none; padding: 0; }
  li { padding: .6rem 0; border-top: 1px solid #e6ecf2; }
  .etat { font-weight: 700; }
  .oui { color: #1a7f37; } .non { color: #b42318; }
  .detail { color: #5b6b7c; }
  label { display: block; margin: 1rem 0 .3rem; font-weight: 600; }
  input { width: 100%; box-sizing: border-box; padding: .7rem; font-size: 1rem;
          border: 1px solid #b9c6d4; border-radius: 8px; }
  button { margin-top: 1.4rem; min-height: 44px; padding: 0 1.2rem; font-size: 1rem; font-weight: 600;
           color: #fff; background: #1d6fb8; border: 0; border-radius: 8px; cursor: pointer; }
  .message { margin-top: 1rem; padding: .8rem 1rem; border-radius: 8px; background: #fdf3d8; }
</style>
</head>
<body>
<main>
  <?php if ($autorise || !$configOk): ?>
    <h1><?= $tout ? 'Tout est en ordre' : 'Il reste quelque chose à régler' ?></h1>
    <ul>
      <?php foreach ($lignes as $l): ?>
        <li>
          <span class="etat <?= $l['ok'] ? 'oui' : 'non' ?>"><?= $l['ok'] ? '✓' : '✗' ?></span>
          <?= htmlspecialchars($l['titre'], ENT_QUOTES) ?>
          <div class="detail"><?= htmlspecialchars($l['detail'], ENT_QUOTES) ?></div>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php else: ?>
    <h1>Vérification du serveur de suivi</h1>
    <form method="post" autocomplete="off">
      <label for="jeton">Mot de passe d'installation</label>
      <input id="jeton" name="jeton" type="password" required autofocus>
      <button type="submit">Vérifier</button>
    </form>
    <?php if ($message !== ''): ?>
      <div class="message"><?= htmlspecialchars($message, ENT_QUOTES) ?></div>
    <?php endif; ?>
  <?php endif; ?>
</main>
</body>
</html>
