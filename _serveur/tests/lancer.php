<?php
// Tests de bout en bout du serveur de suivi.
// Lance un vrai serveur PHP sur une copie du dossier public/, avec une base
// SQLite jetable, et interroge l'API comme le fera l'appli.
//
// Usage : php tests/lancer.php

declare(strict_types=1);

$racine = dirname(__DIR__);
$travail = sys_get_temp_dir() . '/suivi-test-' . bin2hex(random_bytes(4));
$base = $travail . '/test.sqlite';

mkdir($travail, 0700, true);

// Lot 11 (05/09/2026) — trouvaille de Claude Code. La copie se faisait par
// exec('cp -r …') : sous Windows, « cp » n'existe ni dans cmd ni dans
// PowerShell (seulement dans git-bash), la copie ne se faisait PAS, et la
// batterie annonçait 135 échecs sur 143 — un faux désastre qui a coûté une
// soirée. Même chose pour le ménage de fin (« rm -rf »). Tout se fait
// maintenant en PHP pur : mêmes gestes sur les trois systèmes.
function copier_dossier(string $source, string $destination): void
{
    if (!is_dir($destination)) mkdir($destination, 0700, true);
    $entrees = new DirectoryIterator($source);
    foreach ($entrees as $entree) {
        if ($entree->isDot()) continue;
        $de = $entree->getPathname();
        $vers = $destination . DIRECTORY_SEPARATOR . $entree->getFilename();
        if ($entree->isDir()) copier_dossier($de, $vers);
        else copy($de, $vers);
    }
}

function effacer_dossier(string $chemin): void
{
    if (!is_dir($chemin)) { @unlink($chemin); return; }
    foreach (scandir($chemin) ?: [] as $nom) {
        if ($nom === '.' || $nom === '..') continue;
        $sous = $chemin . DIRECTORY_SEPARATOR . $nom;
        if (is_dir($sous) && !is_link($sous)) effacer_dossier($sous);
        else @unlink($sous);
    }
    @rmdir($chemin);
}

copier_dossier($racine . '/public', $travail);

// Par défaut, SQLite jetable. Pour rejouer les mêmes tests sur MySQL/MariaDB
// (la production est sur MySQL, et le limiteur y emploie une instruction
// différente) : SUIVI_TEST_DSN='mysql:host=127.0.0.1;port=3306;dbname=suivi_test'
// SUIVI_TEST_UTILISATEUR=… SUIVI_TEST_MOTDEPASSE=… php tests/lancer.php
// La base indiquée est VIDÉE au démarrage.
$bdTest = ['dsn' => 'sqlite:' . $base];
if (getenv('SUIVI_TEST_DSN')) {
    $bdTest = [
        'dsn' => getenv('SUIVI_TEST_DSN'),
        'utilisateur' => getenv('SUIVI_TEST_UTILISATEUR') ?: null,
        'motdepasse' => getenv('SUIVI_TEST_MOTDEPASSE') ?: null,
    ];
}
function bd_test(): PDO
{
    global $bdTest;
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO($bdTest['dsn'], $bdTest['utilisateur'] ?? null, $bdTest['motdepasse'] ?? null,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    }
    return $pdo;
}
if (getenv('SUIVI_TEST_DSN')) {
    foreach (['cours_ouvertures', 'modeles_evaluation', 'directs_reponses', 'directs_questions', 'directs', 'records', 'journal', 'versions', 'billets', 'partages', 'sessions_prof', 'compteurs', 'progressions', 'eleves', 'classes', 'profs'] as $table) {
        bd_test()->exec("DROP TABLE IF EXISTS $table");
    }
    echo "Base de test : " . $bdTest['dsn'] . "\n";
}

file_put_contents($travail . '/config.php', "<?php return " . var_export([
    'bd' => $bdTest,
    'origines' => ['https://mathsgo.re', 'https://suivi.mathsgo.re'],
    'jeton_installation' => 'JETON-DE-TEST',
    // Les records repartent à zéro à RECORDS_DEPUIS (lib/records.php) : les
    // tests prennent une date passée, pour que leurs courses comptent quel
    // que soit le jour où ils tournent.
    'records_depuis' => '2026-01-01T00:00:00.000000Z',
], true) . ";\n");

$port = 8000 + random_int(0, 900);
// Plusieurs processus pour que les requêtes simultanées le soient vraiment
// (le serveur intégré n'en traite qu'une à la fois sinon) ; sans effet sur Windows.
$ouvriers = PHP_OS_FAMILY === 'Windows' ? '' : 'PHP_CLI_SERVER_WORKERS=8 ';
$serveur = proc_open(
    sprintf('%sphp -S 127.0.0.1:%d -t %s', $ouvriers, $port, escapeshellarg($travail)),
    [1 => ['file', PHP_OS_FAMILY === 'Windows' ? 'NUL' : '/dev/null', 'w'], 2 => ['file', $travail . '/serveur.log', 'w']],
    $tuyaux
);
// Arrêter le serveur de test, sur les trois systèmes.
//
// Lot 11 — deuxième trouvaille de Claude Code : sous Windows, la batterie
// PENDAIT à la fin. proc_open() y passe par un cmd.exe intermédiaire, donc
// proc_get_status() rend le PID de CE cmd.exe et non celui du « php -S » ;
// « kill » n'existe pas, et proc_close() attendait indéfiniment un serveur qui
// ne s'arrêtait jamais. proc_terminate() sur le processus, puis taskkill /T
// (l'arbre complet) sous Windows, règlent les deux.
function arreter_serveur($serveur): void
{
    if (!is_resource($serveur)) return;
    $etat = proc_get_status($serveur);
    if (!empty($etat['running'])) {
        if (PHP_OS_FAMILY === 'Windows') {
            @exec('taskkill /F /T /PID ' . (int)$etat['pid'] . ' 2>NUL');
        }
        @proc_terminate($serveur, 9);
        // Laisser au système le temps de le rendre : proc_close() n'attend
        // alors plus rien.
        for ($i = 0; $i < 40; $i++) {
            $etat = proc_get_status($serveur);
            if (empty($etat['running'])) break;
            usleep(50000);
        }
    }
    @proc_close($serveur);
}

register_shutdown_function(function () use ($serveur, $travail) {
    arreter_serveur($serveur);
    // En cas d'échec, le journal du serveur de test est gardé : c'est lui qui
    // dit pourquoi une requête a répondu 500.
    global $echecs;
    if (!empty($echecs)) {
        $journal = sys_get_temp_dir() . '/suivi-test-serveur.log';
        @copy($travail . '/serveur.log', $journal);
        echo "Journal du serveur de test : $journal\n";
    }
    effacer_dossier($travail);
});

$url = "http://127.0.0.1:$port";
for ($i = 0; $i < 60; $i++) {
    $fp = @fsockopen('127.0.0.1', $port, $e, $s, 0.2);
    if ($fp) { fclose($fp); break; }
    usleep(150000);
}

// ---------------------------------------------------------------- utilitaires

$reussis = 0;
$echecs = [];

function verifier(string $titre, callable $test): void
{
    global $reussis, $echecs;
    try {
        $test();
        $reussis++;
        echo "  ok   $titre\n";
    } catch (Throwable $e) {
        $echecs[] = "$titre : " . $e->getMessage();
        echo "  ÉCHEC $titre — " . $e->getMessage() . "\n";
    }
}

function egal(mixed $attendu, mixed $obtenu, string $quoi = ''): void
{
    if ($attendu !== $obtenu) {
        throw new RuntimeException(trim("$quoi attendu " . json_encode($attendu) . ", obtenu " . json_encode($obtenu)));
    }
}

function vrai(bool $condition, string $quoi): void
{
    if (!$condition) throw new RuntimeException($quoi);
}

function appel(string $chemin, array|string|null $corps = null, array $options = []): array
{
    global $url;
    $ch = curl_init($url . $chemin);
    $entetes = ['Content-Type: application/json'];
    if (isset($options['origine'])) $entetes[] = 'Origin: ' . $options['origine'];
    if (isset($options['jeton'])) $entetes[] = 'Authorization: Bearer ' . $options['jeton'];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => $entetes,
        CURLOPT_TIMEOUT => 10,
    ]);
    if ($corps !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($corps) ? $corps : json_encode($corps));
    }
    if (isset($options['methode'])) curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $options['methode']);
    $reponse = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $tailleEntetes = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $erreurCurl = curl_error($ch);
    curl_close($ch);
    $brutEntetes = substr((string)$reponse, 0, $tailleEntetes);
    $corpsReponse = substr((string)$reponse, $tailleEntetes);
    return [
        'code' => (int)$code,
        'erreur_curl' => $erreurCurl,
        'entetes' => $brutEntetes,
        'texte' => $corpsReponse,
        'json' => json_decode($corpsReponse, true),
    ];
}

function formulaire(string $chemin, array $champs): array
{
    global $url;
    $ch = curl_init($url . $chemin);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($champs),
        CURLOPT_TIMEOUT => 10,
    ]);
    $texte = (string)curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'texte' => $texte];
}

// Lecture d'une progression et identité d'un élève : comme l'appli, en POST
// avec le code dans le corps. Le serveur ne connaît plus de lecture par
// l'adresse : une adresse s'inscrit dans les journaux de l'hébergeur.
function lire(string $code, ?string $appli = null, array $options = []): array
{
    $corps = ['code' => $code, 'lire' => true];
    if ($appli !== null) $corps['appli'] = $appli;
    return appel('/api/parcours.php', $corps, $options);
}

function identite(string $code): array
{
    return appel('/api/eleve.php', ['code' => $code]);
}

// Remise à zéro des compteurs de limitation, directement dans la base de test,
// pour que les tests de seuils ne se gênent pas entre eux.
function vider_compteurs(): void
{
    bd_test()->exec('DELETE FROM compteurs');
}

function compteurs(): array
{
    return bd_test()->query('SELECT cle, fenetre, nombre FROM compteurs')->fetchAll(PDO::FETCH_ASSOC);
}

// Plusieurs appels lancés EN MÊME TEMPS (curl_multi) : renvoie les codes HTTP.
function appels_paralleles(string $chemin, array $corps, int $nombre): array
{
    global $url;
    $multi = curl_multi_init();
    $canaux = [];
    for ($i = 0; $i < $nombre; $i++) {
        $ch = curl_init($url . $chemin);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($corps),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 20,
        ]);
        curl_multi_add_handle($multi, $ch);
        $canaux[] = $ch;
    }
    do {
        $etat = curl_multi_exec($multi, $actifs);
        if ($actifs) curl_multi_select($multi, 1.0);
    } while ($actifs && $etat === CURLM_OK);
    $codes = [];
    foreach ($canaux as $ch) {
        $codes[] = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_multi_remove_handle($multi, $ch);
        curl_close($ch);
    }
    curl_multi_close($multi);
    return $codes;
}

// Plusieurs formulaires (POST x-www-form-urlencoded) lancés EN MÊME TEMPS :
// rend les corps HTML des réponses (relecture Codex R2).
function formulaires_paralleles(string $chemin, array $champs, int $nombre): array
{
    global $url;
    $multi = curl_multi_init();
    $canaux = [];
    for ($i = 0; $i < $nombre; $i++) {
        $ch = curl_init($url . $chemin);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($champs + ['essai' => $i]),
            CURLOPT_TIMEOUT => 20,
        ]);
        curl_multi_add_handle($multi, $ch);
        $canaux[] = $ch;
    }
    do {
        $etat = curl_multi_exec($multi, $actifs);
        if ($actifs) curl_multi_select($multi, 1.0);
    } while ($actifs && $etat === CURLM_OK);
    $textes = [];
    foreach ($canaux as $ch) {
        $textes[] = (string)curl_multi_getcontent($ch);
        curl_multi_remove_handle($multi, $ch);
        curl_close($ch);
    }
    curl_multi_close($multi);
    return $textes;
}

echo "Serveur de suivi — tests de bout en bout\n\n";

// ------------------------------------------------------------------ diagnostic

verifier("verifier.php ne dit rien sans le mot de passe d'installation", function () {
    $r = appel('/verifier.php');
    egal(200, $r['code'], 'code HTTP');
    vrai(str_contains($r['texte'], 'Mot de passe d\'installation'), "la page devrait demander le mot de passe");
    vrai(!str_contains($r['texte'], PHP_VERSION), "la version de PHP ne doit pas sortir");
    vrai(!str_contains($r['texte'], 'compte'), "rien sur les comptes ne doit sortir");
    vrai(!str_contains($r['texte'], 'installer.php'), "l'état de l'installation ne doit pas sortir");
    $r = formulaire('/verifier.php', ['jeton' => 'faux']);
    vrai(str_contains($r['texte'], 'incorrect'), "un mauvais mot de passe doit être refusé");
    vrai(!str_contains($r['texte'], PHP_VERSION), "et ne rien montrer non plus");
});

verifier("verifier.php signale l'installation manquante (avec le mot de passe)", function () {
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    egal(200, $r['code'], 'code HTTP');
    vrai(str_contains($r['texte'], 'reste quelque chose'), "la page devrait signaler un problème");
    vrai(str_contains($r['texte'], 'installer.php'), "elle devrait renvoyer vers installer.php");
});

// ----------------------------------------------------------------- installation

verifier("installer.php refuse un mauvais mot de passe d'installation", function () {
    $r = formulaire('/installer.php', ['jeton' => 'faux', 'identifiant' => 'gwenael', 'motdepasse' => 'motdepasselong']);
    vrai(str_contains($r['texte'], 'incorrect'), "le refus devrait être annoncé");
});

verifier("installer.php refuse un mot de passe trop court", function () {
    $r = formulaire('/installer.php', ['jeton' => 'JETON-DE-TEST', 'identifiant' => 'gwenael', 'motdepasse' => 'court']);
    vrai(str_contains($r['texte'], '12 à 72 caractères'), "la longueur attendue devrait être rappelée");
});

verifier("installer.php crée le compte prof", function () {
    $r = formulaire('/installer.php', ['jeton' => 'JETON-DE-TEST', 'identifiant' => 'gwenael', 'motdepasse' => 'motdepasse-de-test-2026']);
    vrai(str_contains($r['texte'], 'Compte créé'), "le compte aurait dû être créé");
});

verifier("installer.php ne crée pas un deuxième compte", function () {
    $r = formulaire('/installer.php', ['jeton' => 'JETON-DE-TEST', 'identifiant' => 'intrus', 'motdepasse' => 'motdepasse-intrus-2026']);
    vrai(str_contains($r['texte'], 'déjà installé'), "l'installateur devrait se verrouiller");
});

// -------------------------------------------------------------------- connexion

$jeton = null;

verifier("connexion refusée avec un mauvais mot de passe", function () {
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'gwenael', 'motdepasse' => 'raté']);
    egal(401, $r['code'], 'code HTTP');
    egal(false, $r['json']['ok']);
});

verifier("connexion refusée avec un identifiant inconnu", function () {
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'personne', 'motdepasse' => 'motdepasse-de-test-2026']);
    egal(401, $r['code'], 'code HTTP');
});

verifier("connexion réussie", function () use (&$jeton) {
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'gwenael', 'motdepasse' => 'motdepasse-de-test-2026']);
    egal(200, $r['code'], 'code HTTP');
    vrai(!empty($r['json']['jeton']), "un jeton devrait être renvoyé");
    $jeton = $r['json']['jeton'];
});

verifier("action prof refusée sans jeton", function () {
    $r = appel('/api/prof.php', ['action' => 'classes.liste']);
    egal(401, $r['code'], 'code HTTP');
});

verifier("action prof refusée avec un faux jeton", function () {
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => str_repeat('a', 64)]);
    egal(401, $r['code'], 'code HTTP');
});

// Chez OVH (Apache en CGI/FastCGI), l'en-tête Authorization n'arrive pas
// jusqu'à PHP : la page prof envoie donc aussi le jeton dans le corps. Sans
// cette voie de secours, toute action répond « session expirée » et l'écran
// de connexion se rouvre en silence.
verifier("le jeton est accepté dans le corps, sans en-tête Authorization", function () use (&$jeton) {
    $r = appel('/api/prof.php', ['action' => 'moi', 'jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    egal('gwenael', $r['json']['identifiant']);
    egal(true, $r['json']['admin'], 'le compte doit être administrateur');
});

verifier("un faux jeton dans le corps reste refusé", function () {
    $r = appel('/api/prof.php', ['action' => 'moi', 'jeton' => str_repeat('a', 64)]);
    egal(401, $r['code'], 'code HTTP');
});

// ---------------------------------------------------------------------- classes

$classeId = null;
$codes = [];

verifier("création d'une classe", function () use (&$classeId, &$jeton) {
    $r = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => '405', 'applis' => ['defi-tables']], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    vrai(!empty($r['json']['id']), "un identifiant de classe devrait revenir");
    $classeId = $r['json']['id'];
});

verifier("la classe apparaît dans la liste", function () use (&$jeton) {
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton]);
    egal(1, count($r['json']['classes']), 'nombre de classes');
    egal('405', $r['json']['classes'][0]['libelle']);
    egal(0, (int)$r['json']['classes'][0]['eleves'], 'effectif');
});

verifier("génération de 12 codes élèves tous différents et lisibles", function () use (&$classeId, &$codes, &$jeton) {
    $r = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classeId, 'nombre' => 12], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    $codes = $r['json']['eleves'];
    egal(12, count($codes), 'nombre de codes');
    $liste = array_column($codes, 'code');
    egal(12, count(array_unique($liste)), 'codes distincts');
    foreach ($liste as $code) {
        egal(6, strlen($code), "longueur du code $code");
        vrai(preg_match('/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/', $code) === 1, "le code $code contient un caractère ambigu");
    }
});

verifier("refus de générer un lot déraisonnable", function () use (&$classeId, &$jeton) {
    $r = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classeId, 'nombre' => 5000], ['jeton' => $jeton]);
    egal(400, $r['code'], 'code HTTP');
});

verifier("saisie du prénom et de l'initiale", function () use (&$codes, &$jeton) {
    $r = appel('/api/prof.php', [
        'action' => 'eleves.nommer', 'eleve_id' => $codes[0]['id'],
        'prenom' => "  Léa  ", 'initiale' => 'b',
    ], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
});

// ---------------------------------------------------------------- côté élève

// Le paquet tel que l'appli l'envoie : sans prénom (il reste sur l'appareil),
// et le serveur le retirerait de toute façon (voir plus bas, lot A2).
// Lot S1 « les journaux » (07/11/2026) : Défi tables (version 4), SPLAT! et
// Coffres magiques (version 2) refusent l'écriture d'une page plus ancienne
// (lib/applis.php « version_min »). Les progressions de ces tests portent
// donc la version du moteur d'aujourd'hui. Lot « le jour vert » (11/11/2026) :
// Défi tables en version 5 (le travail hors séance), Coffres en version 4
// (les clés du jour au journal).
const VERSION_TABLES = 5;
const VERSION_COFFRES = 4;
$parcours = ['version' => VERSION_TABLES, 'tables' => ['7' => ['acquise' => '2026-08-29']]];

verifier("code inconnu refusé", function () {
    $r = lire('ZZZZZZ');
    egal(404, $r['code'], 'code HTTP');
});

verifier("code mal formé refusé", function () {
    foreach (['', 'ABC', 'ABCDEFG', 'AAAA0A', '<script>'] as $mauvais) {
        $r = lire($mauvais);
        egal(400, $r['code'], "code HTTP pour « $mauvais »");
    }
});

verifier("tentative d'injection SQL sans effet", function () use (&$jeton) {
    $r = lire("' OR '1'='1");
    egal(400, $r['code'], 'code HTTP');
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton]);
    egal(200, $r['code'], "la base doit être intacte");
});

verifier("élève sans progression enregistrée", function () use (&$codes) {
    $r = lire($codes[0]['code']);
    egal(200, $r['code'], 'code HTTP');
    egal(false, $r['json']['existe']);
    egal(null, $r['json']['parcours']);
});

verifier("enregistrement puis relecture de la progression", function () use (&$codes, $parcours) {
    $r = appel('/api/parcours.php', ['code' => $codes[0]['code'], 'parcours' => $parcours, 'base_revision' => 0]);
    egal(200, $r['code'], 'code HTTP');
    vrai(!empty($r['json']['maj_le']), "une date de mise à jour devrait revenir");

    $r = lire($codes[0]['code']);
    egal(true, $r['json']['existe']);
    egal($parcours, $r['json']['parcours'], 'progression relue');
});

verifier("la progression se retrouve avec le code minuscule ou espacé", function () use (&$codes, $parcours) {
    $r = lire(' ' . strtolower($codes[0]['code']) . ' ');
    egal(200, $r['code'], 'code HTTP');
    egal($parcours, $r['json']['parcours']);
});

verifier("un élève n'écrit que sur son propre code", function () use (&$codes) {
    $r = lire($codes[1]['code']);
    egal(false, $r['json']['existe'], "le voisin ne doit rien avoir");
});

verifier("progression trop volumineuse refusée", function () use (&$codes) {
    $gros = ['version' => VERSION_TABLES, 'bloc' => str_repeat('x', 45000)];
    $r = appel('/api/parcours.php', ['code' => $codes[1]['code'], 'parcours' => $gros, 'base_revision' => 0]);
    vrai(in_array($r['code'], [413], true), "attendu 413, obtenu " . $r['code']);
    $r = lire($codes[1]['code']);
    egal(false, $r['json']['existe'], "rien ne doit avoir été enregistré");
});

verifier("progression absente ou illisible refusée", function () use (&$codes) {
    $r = appel('/api/parcours.php', ['code' => $codes[1]['code'], 'base_revision' => 0]);
    egal(400, $r['code'], 'code HTTP');
    $r = appel('/api/parcours.php', 'ceci-n-est-pas-du-json');
    egal(400, $r['code'], 'code HTTP');
});

verifier("application inconnue refusée", function () use (&$codes) {
    $r = lire($codes[0]['code'], 'nimporte');
    egal(400, $r['code'], 'code HTTP');
});

verifier("les applis sont bien séparées", function () use (&$codes, $parcours) {
    $r = lire($codes[0]['code'], 'automatismes');
    egal(false, $r['json']['existe'], "Automatismes ne doit pas voir Défi tables");
    appel('/api/parcours.php', ['code' => $codes[0]['code'], 'appli' => 'automatismes', 'parcours' => ['a' => 1], 'base_revision' => 0]);
    $r = lire($codes[0]['code']);
    egal($parcours, $r['json']['parcours'], "Défi tables ne doit pas avoir bougé");
});

// ------------------------------------------------------------- page d'accueil élève

verifier("la page élève reconnaît le code et donne les applis de la classe", function () use (&$codes) {
    $r = identite($codes[0]['code']);
    egal(200, $r['code'], 'code HTTP');
    egal('Léa', $r['json']['prenom']);
    egal('405', $r['json']['classe']);
    egal('defi-tables', $r['json']['applis'][0]['cle'], 'la classe a Défi tables, en premier');
    egal(true, $r['json']['applis'][0]['disponible']);
    vrai(str_contains($r['json']['applis'][0]['url'], 'defi_tables.html'), "l'appli doit pointer vers mathsgo.re");
    // Lot « retours de classe » (06/10/2026, décision de Gwenaël) : plus
    // d'annonces « Bientôt ». Jusqu'ici, les activités pas encore ouvertes
    // suivaient pour toute classe ; une appli n'apparaît plus que lorsqu'elle
    // existe.
    egal(['defi-tables'], array_column($r['json']['applis'], 'cle'), 'seulement Défi tables : aucune annonce');
});

// Le filtre « disponible » de applis_de_classe() : une activité ouverte n'est
// donnée qu'aux classes qui l'ont, et une activité PAS ouverte n'est donnée à
// personne, même à une classe qui l'a dans sa liste (« automatismes » est
// proposable à une classe, mais pas encore ouvert).
verifier("une activité n'est donnée que si elle est ouverte ET dans la liste de la classe", function () {
    require_once __DIR__ . '/../public/lib/applis.php';
    egal([], applis_de_classe('automatismes'), 'automatismes n’est pas encore ouverte : rien à montrer');
    egal(['defi-tables'], array_column(applis_de_classe('automatismes,defi-tables'), 'cle'), 'seule l’appli ouverte de la liste');
    egal([], applis_de_classe(''), 'une classe sans appli : rien, pas même des annonces');
    foreach (applis_de_classe('defi-tables') as $appli) {
        egal(true, $appli['disponible']);
        vrai(is_string($appli['url']) && $appli['url'] !== '', $appli['cle'] . ' a une adresse');
    }
});

// ------------------------------------------------------------------------
// Lot « cohérence des sorties » (08/09/2026). L'espace élève existe pour que
// les élèves n'aillent pas sur mathsgo.re. Le pied de la page les y renvoyait
// depuis la première version, vers une page de confidentialité écrite pour un
// visiteur du site, qui les déposait ensuite sur l'accueil du site. Tout ce
// qui les concerne est maintenant dit dans une page à eux, sans sortie.

verifier("le pied de l'espace élève ne renvoie plus sur le site", function () {
    $r = page('/');
    egal(200, $r['code'], 'code HTTP');
    vrai((bool)preg_match('#<footer class="pied">(.*?)</footer>#s', $r['texte'], $m), 'la page doit avoir un pied');
    preg_match_all('/href="([^"]+)"/', $m[1], $liens);
    egal(['infos.php'], $liens[1], 'un seul lien dans le pied, et il reste dans l’espace');
    // 08/11/2026 : une seule adresse du site permise, celle de passage de
    // « Se déconnecter » (départ invisible, pas un lien), écrite une seule fois.
    egal(1, substr_count($r['texte'], 'https://mathsgo.re'),
        'une seule adresse du site dans la page de l’espace élève');
    egal(1, substr_count($r['texte'], 'https://mathsgo.re/?sortie=1'),
        'et c’est l’adresse de passage de « Se déconnecter »');
});

verifier("la page Infos répond, sans une seule porte de sortie", function () {
    $r = page('/infos.php');
    egal(200, $r['code'], 'code HTTP');
    egal('no-store', entete($r, 'Cache-Control'), 'Cache-Control');
    egal('nosniff', entete($r, 'X-Content-Type-Options'), 'nosniff');
    egal('DENY', entete($r, 'X-Frame-Options'), 'X-Frame-Options');
    egal('max-age=31536000', entete($r, 'Strict-Transport-Security'), 'HSTS');
    vrai(str_contains($r['texte'], '← Retour à mon espace'), 'le bouton de retour');
    vrai(str_contains($r['texte'], 'OVH SAS'), 'l’hébergeur de CE sous-domaine, pas celui du site');

    // Aucun lien vers un autre domaine : les adresses du site sont écrites en
    // texte. « mailto: » est la seule exception, et elle ne fait sortir
    // personne — elle ouvre la messagerie de l’appareil par-dessus la page.
    preg_match_all('/href="([^"]+)"/', $r['texte'], $liens);
    foreach ($liens[1] as $lien) {
        vrai(!preg_match('#^https?://#', $lien), "la page Infos ne doit pas sortir : $lien");
    }
    vrai(in_array('./', $liens[1], true), 'le retour à l’espace');

    // Le mot « compte » est le cœur du problème : la page du site dit
    // « maths&go ne crée pas de compte élève » à un enfant qui se croit
    // connecté à un compte. Ici on dit « espace », et « compte » n’apparaît
    // que dans la phrase qui explique que ce n’en est pas un.
    $corps = substr($r['texte'], (int)strpos($r['texte'], '<body>'));
    egal(1, preg_match_all('/\bcomptes?\b/u', $corps), 'le mot « compte » n’apparaît qu’une fois');
    vrai(str_contains($corps, 'Ce n’est pas un compte'), 'et c’est pour dire que ce n’en est pas un');
});

verifier("le manifeste connaît la page Infos", function () {
    $manifeste = (string)file_get_contents(__DIR__ . '/../public/VERSION');
    vrai((bool)preg_match('/^[0-9a-f]{64}  infos\.php$/m', $manifeste),
        'infos.php doit figurer au manifeste : sans lui, verifier.php ne dirait pas si la page déposée est la bonne');
    // 28 depuis la page Infos ; 29 depuis la copie du moteur SPLAT! (lot
    // splat-suivi-3) ; 31 depuis les records (api/records.php, lib/records.php) ;
    // 35 depuis la séance en direct (07/10/2026) : direct.php, prof/direct.php,
    // api/direct.php, lib/direct.php ; 58 depuis le questionnaire au tableau
    // (lot 2, 15/10/2026) : prof/questionnaire.js et KaTeX (vendor/katex-0.16.9,
    // devenu vendor/katex-0.16.47 au lot katex-a-jour, puis vendor/katex-0.18.2
    // au lot 7 du serveur pro (31/10/2026) ; toujours le même nombre de fichiers :
    // le script, la feuille et ses 20 polices).
    // 60 depuis les évaluations en classe (lot E1, 15/10/2026) : lib/evaluation.php
    // et la copie du noyau de Défi tables, prof/defi_tables_core.js.
    // 61 depuis Coffres magiques sur le suivi (21/10/2026) : la copie du moteur
    // de parcours, prof/coffres-parcours.js. 62 depuis Anzan (lot « Qui voit
    // quoi », lot 4a, 23/10/2026) : prof/flash_anzan_parcours.js.
    // 63 depuis la charte commune (serveur pro, lot 5a, 25/10/2026) : suivi.css.
    // 65 depuis Défi calcul (lot 2b, 31/10/2026) : ses deux moteurs,
    // prof/defi_calcul_core.js et prof/defi_calcul_mon_parcours.js.
    // 67 depuis l'appli Cours (lot « cours-appli », 08/11/2026) : lib/cours.php
    // et le catalogue du livret, lib/cours.json.
    // 68 depuis les ouvertures des fiches (lot « cours-ouvertures »,
    // 10/11/2026) : api/cours.php.
    // 69 depuis le code en six cases (lot « code en cases », 11/2026) :
    // code-en-cases.js, copie du module commun du site.
    // 71 depuis Mon espace redessiné (lot B1, 21/11/2026) : les deux fichiers de
    // Nunito, polices/nunito-latin-wght-normal.woff2 et polices/nunito-latin-ext-wght-normal.woff2.
    // 75 depuis l'icône de l'écran d'accueil (lot E « Arriver », 21/11/2026) :
    // app.webmanifest, icone-192.png, icone-512.png, icone-masquable-512.png.
    vrai((bool)preg_match('/^fichiers 75$/m', $manifeste),
        "le serveur compte 75 fichiers depuis l'icône de l'écran d'accueil (lot E)");
    foreach (['app.webmanifest', 'icone-192.png', 'icone-512.png', 'icone-masquable-512.png',
              'polices/nunito-latin-wght-normal.woff2', 'polices/nunito-latin-ext-wght-normal.woff2',
              'suivi.css', 'direct.php', 'prof/direct.php', 'api/direct.php', 'lib/direct.php', 'prof/questionnaire.js',
              'lib/evaluation.php', 'prof/defi_tables_core.js', 'prof/coffres-parcours.js', 'prof/flash_anzan_parcours.js',
              'prof/defi_calcul_core.js', 'prof/defi_calcul_mon_parcours.js', 'lib/cours.php', 'lib/cours.json', 'api/cours.php',
              'vendor/katex-0.18.2/katex.min.js', 'vendor/katex-0.18.2/katex.min.css',
              'vendor/katex-0.18.2/fonts/KaTeX_Main-Regular.woff2'] as $fichier) {
        vrai((bool)preg_match('/^[0-9a-f]{64}  ' . preg_quote($fichier, '/') . '$/m', $manifeste),
            "$fichier doit figurer au manifeste");
    }
});

verifier("la page élève refuse un code inconnu ou mal formé", function () {
    egal(404, identite('ZZZZZZ')['code'], 'code HTTP');
    egal(400, identite('AB')['code'], 'code HTTP');
    egal(400, identite("' OR 1=1")['code'], 'code HTTP');
});

// ------------------------------- le code ne doit plus voyager dans l'adresse
//
// Une adresse est écrite en clair dans les journaux d'accès de l'hébergeur.
// L'appli demande donc lecture et identité en POST, code dans le corps, et le
// serveur ne connaît plus d'autre chemin : GET est refusé (voir plus bas).

verifier("la progression se relit en POST, code dans le corps", function () use (&$codes, $parcours) {
    $r = appel('/api/parcours.php', ['code' => $codes[0]['code'], 'appli' => 'defi-tables', 'lire' => true]);
    egal(200, $r['code'], 'code HTTP');
    egal(true, $r['json']['existe'], 'la progression doit être trouvée');
    egal($parcours, $r['json']['parcours'], 'progression relue');
});

verifier("la relecture en POST ne détruit pas la progression enregistrée", function () use (&$codes, $parcours) {
    appel('/api/parcours.php', ['code' => $codes[0]['code'], 'appli' => 'defi-tables', 'lire' => true]);
    $r = lire($codes[0]['code']);
    egal($parcours, $r['json']['parcours'], 'la progression doit être intacte après une lecture');
});

verifier("un POST sans progression et sans « lire » reste une erreur", function () use (&$codes) {
    $r = appel('/api/parcours.php', ['code' => $codes[0]['code']]);
    egal(400, $r['code'], 'code HTTP');
});

verifier("l'identité de l'élève se lit en POST, code dans le corps", function () use (&$codes) {
    $r = appel('/api/eleve.php', ['code' => $codes[0]['code']]);
    egal(200, $r['code'], 'code HTTP');
    egal('Léa', $r['json']['prenom']);
    egal('405', $r['json']['classe']);
});

verifier("l'identité en POST refuse un code inconnu ou mal formé", function () {
    egal(404, appel('/api/eleve.php', ['code' => 'ZZZZZZ'])['code'], 'code HTTP');
    egal(400, appel('/api/eleve.php', ['code' => 'AB'])['code'], 'code HTTP');
});

verifier("la page d'entrée n'envoie pas le code en GET si le JavaScript ne part pas", function () {
    global $url;
    $html = (string)file_get_contents($url . '/');
    vrai((bool)preg_match('/<form[^>]*id="form-code"[^>]*method="post"/i', $html)
        || (bool)preg_match('/<form[^>]*method="post"[^>]*id="form-code"/i', $html),
        "le formulaire d'entrée doit être en method=\"post\" : en repli sans JavaScript, "
        . "un envoi en GET écrirait le code de l'élève dans la barre d'adresse");
});

verifier("la page élève ne donne aucun code en retour", function () use (&$codes) {
    $r = identite($codes[0]['code']);
    vrai(!str_contains($r['texte'], $codes[1]['code']), "aucun code d'un autre élève ne doit sortir");
    vrai(!array_key_exists('code', $r['json']), "le code ne doit pas être renvoyé");
});

// -------------------------------------------------------------------------- CORS

verifier("origine autorisée acceptée", function () use (&$codes) {
    $r = lire($codes[0]['code'], null, ['origine' => 'https://mathsgo.re']);
    vrai(stripos($r['entetes'], 'Access-Control-Allow-Origin: https://mathsgo.re') !== false,
        "l'en-tête CORS devrait autoriser mathsgo.re");
});

verifier("origine inconnue non autorisée", function () use (&$codes) {
    $r = lire($codes[0]['code'], null, ['origine' => 'https://site-pirate.example']);
    vrai(stripos($r['entetes'], 'Access-Control-Allow-Origin') === false,
        "aucune autorisation CORS ne doit être donnée à un site inconnu");
});

verifier("requête préparatoire OPTIONS acceptée", function () {
    $r = appel('/api/parcours.php', null, ['methode' => 'OPTIONS', 'origine' => 'https://mathsgo.re']);
    egal(204, $r['code'], 'code HTTP');
});

// ------------------------------------------------------------------ tableau prof

verifier("le tableau de la classe montre la progression", function () use (&$classeId, &$codes, &$jeton, $parcours) {
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeId], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    egal(12, count($r['json']['eleves']), 'nombre d\'élèves');
    $lea = null;
    foreach ($r['json']['eleves'] as $e) if ($e['prenom'] === 'Léa') $lea = $e;
    vrai($lea !== null, "Léa devrait être dans le tableau");
    egal('B', $lea['initiale'], 'initiale mise en majuscule');
    egal($parcours, $lea['parcours'], 'progression visible par le prof');
    vrai($lea['maj_le'] !== null, "la date de dernière activité devrait être là");
    egal('Léa', $r['json']['eleves'][0]['prenom'], "les élèves nommés passent devant");
});

verifier("le tableau est refusé sans jeton", function () use (&$classeId) {
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeId]);
    egal(401, $r['code'], 'code HTTP');
});

// --------------------------------------------------------- code perdu, effacement

verifier("régénérer un code invalide l'ancien et garde la progression", function () use (&$codes, &$jeton, $parcours) {
    $ancien = $codes[0]['code'];
    $r = appel('/api/prof.php', ['action' => 'eleves.regenerer', 'eleve_id' => $codes[0]['id']], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    $nouveau = $r['json']['code'];
    vrai($nouveau !== $ancien, "le code devrait avoir changé");

    egal(404, lire($ancien)['code'], "l'ancien code ne doit plus marcher");
    $r = lire($nouveau);
    egal($parcours, $r['json']['parcours'], "la progression suit le nouveau code");
    $codes[0]['code'] = $nouveau;
});

verifier("supprimer un élève efface aussi sa progression", function () use (&$codes, &$jeton) {
    $code = $codes[11]['code'];
    appel('/api/parcours.php', ['code' => $code, 'parcours' => ['version' => VERSION_TABLES], 'base_revision' => 0]);
    $r = appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $codes[11]['id']], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    egal(404, lire($code)['code'], "le code ne doit plus exister");
});

verifier("supprimer une classe efface ses élèves", function () use (&$classeId, &$codes, &$jeton) {
    $code = $codes[1]['code'];
    $r = appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classeId], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    egal(404, lire($code)['code'], "les codes de la classe doivent disparaître");
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton]);
    egal(0, count($r['json']['classes']), 'plus aucune classe');
});

// ------------------------------------------- cloisonnement entre professeurs
// Règle : une classe appartient à un prof. Un collègue ne la voit que si elle
// lui a été partagée, et le partage en lecture n'ouvre aucune écriture.

$jetonClaire = null;
$classeDeGwenael = null;
$eleveDeGwenael = null;
$classeDeClaire = null;

verifier("le compte administrateur crée un deuxième professeur : mot de passe temporaire tiré par le serveur, à changer d'abord", function () use (&$jeton, &$jetonClaire) {
    // Lot S2b : l'administrateur ne choisit plus le mot de passe du collègue.
    $r = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'claire',
        'motdepasse' => 'ceci-est-ignore-par-le-serveur'], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    $temporaire = $r['json']['motdepasse'] ?? '';
    vrai((bool)preg_match('/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/', $temporaire), "un temporaire lisible est renvoyé ($temporaire)");
    egal(401, appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'claire',
        'motdepasse' => 'ceci-est-ignore-par-le-serveur'])['code'], 'le mot de passe envoyé par l’administrateur ne vaut rien');
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'claire', 'motdepasse' => $temporaire]);
    egal(200, $r['code'], 'la nouvelle prof se connecte avec le temporaire');
    egal(true, $r['json']['mdp_temporaire'], 'et doit le changer');
    $jetonClaire = $r['json']['jeton'];
    egal(403, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire])['code'], 'rien d’autre avant');
    egal(200, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $temporaire,
        'nouveau' => 'mdp-collegue-2026-secret'], ['jeton' => $jetonClaire])['code'], 'elle choisit le sien');
    egal(401, appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'claire', 'motdepasse' => $temporaire])['code'], 'le temporaire est mort');
    egal(200, appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'claire',
        'motdepasse' => 'mdp-collegue-2026-secret'])['code'], 'le sien passe');
});

verifier("le premier compte est administrateur, pas le second", function () use (&$jeton, &$jetonClaire) {
    egal(true, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jeton])['json']['admin']);
    egal(false, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire])['json']['admin']);
});

verifier("l'annuaire des professeurs distingue possédé et partagé", function () use (&$jeton) {
    $profs = appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jeton])['json']['profs'];
    $claire = null;
    foreach ($profs as $prof) if ($prof['identifiant'] === 'claire') $claire = $prof;
    vrai($claire !== null, "Claire devrait être dans la liste");
    egal(0, $claire['classes'], "elle ne possède aucune classe");
    egal(0, $claire['partagees'], "et rien ne lui est encore partagé");
});

verifier("un professeur ordinaire ne peut pas créer de compte", function () use (&$jetonClaire) {
    $r = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'intrus',
        'motdepasse' => 'motdepasse-intrus-2026'], ['jeton' => $jetonClaire]);
    egal(403, $r['code'], 'code HTTP');
    egal(403, appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonClaire])['code'], 'code HTTP');
});

verifier("un identifiant déjà pris est refusé", function () use (&$jeton) {
    $r = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'claire',
        'motdepasse' => 'un-autre-mot-de-passe'], ['jeton' => $jeton]);
    egal(400, $r['code'], 'code HTTP');
});

verifier("un identifiant vide ou trop long est refusé", function () use (&$jeton) {
    egal(400, appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => '  '], ['jeton' => $jeton])['code'], 'vide');
    egal(400, appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => str_repeat('x', 41)], ['jeton' => $jeton])['code'], 'trop long');
});

verifier("chacun ne voit que ses propres classes", function () use (&$jeton, &$jetonClaire, &$classeDeGwenael, &$classeDeClaire, &$eleveDeGwenael) {
    $classeDeGwenael = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => '405'],
        ['jeton' => $jeton])['json']['id'];
    $eleveDeGwenael = appel('/api/prof.php', ['action' => 'eleves.ajouter',
        'classe_id' => $classeDeGwenael, 'nombre' => 2], ['jeton' => $jeton])['json']['eleves'][0];
    $classeDeClaire = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => '6e2'],
        ['jeton' => $jetonClaire])['json']['id'];

    $siennes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire])['json']['classes'];
    egal(1, count($siennes), 'Claire ne doit voir que sa classe');
    egal('6e2', $siennes[0]['libelle']);
    egal('proprietaire', $siennes[0]['droit']);

    $mes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton])['json']['classes'];
    egal(1, count($mes), 'Gwenaël ne doit voir que la sienne');
    egal('405', $mes[0]['libelle']);
});

verifier("lire la classe d'un autre est impossible", function () use (&$jetonClaire, &$classeDeGwenael) {
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeDeGwenael], ['jeton' => $jetonClaire]);
    egal(404, $r['code'], 'code HTTP');
    vrai(!str_contains($r['texte'], '405'), "le nom de la classe ne doit pas fuiter");
});

verifier("modifier ou supprimer la classe d'un autre est impossible", function () use (&$jetonClaire, &$classeDeGwenael) {
    egal(404, appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classeDeGwenael,
        'libelle' => 'volée'], ['jeton' => $jetonClaire])['code'], 'code HTTP');
    egal(404, appel('/api/prof.php', ['action' => 'classes.supprimer',
        'classe_id' => $classeDeGwenael], ['jeton' => $jetonClaire])['code'], 'code HTTP');
    egal(404, appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classeDeGwenael,
        'nombre' => 1], ['jeton' => $jetonClaire])['code'], 'code HTTP');
});

verifier("agir sur l'élève d'un autre est impossible", function () use (&$jetonClaire, &$eleveDeGwenael) {
    $id = $eleveDeGwenael['id'];
    egal(404, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $id,
        'prenom' => 'Pirate'], ['jeton' => $jetonClaire])['code'], 'nommer');
    egal(404, appel('/api/prof.php', ['action' => 'eleves.regenerer',
        'eleve_id' => $id], ['jeton' => $jetonClaire])['code'], 'régénérer');
    egal(404, appel('/api/prof.php', ['action' => 'eleves.supprimer',
        'eleve_id' => $id], ['jeton' => $jetonClaire])['code'], 'supprimer');
});

verifier("le code de l'élève d'un autre n'a pas changé", function () use (&$jeton, &$eleveDeGwenael, &$classeDeGwenael) {
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeDeGwenael], ['jeton' => $jeton]);
    $codes = array_column($r['json']['eleves'], 'code');
    vrai(in_array($eleveDeGwenael['code'], $codes, true), "le code d'origine devrait toujours être là");
    egal(2, count($r['json']['eleves']), "aucun élève ne doit avoir été ajouté ni supprimé");
});

verifier("partage en lecture : la classe devient visible", function () use (&$jeton, &$jetonClaire, &$classeDeGwenael) {
    $claire = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.annuaire'], ['jeton' => $jeton])['json']['profs'] as $p) {
        if ($p['identifiant'] === 'claire') $claire = $p['id'];
    }
    vrai($claire !== null, "l'annuaire devrait contenir Claire");
    $r = appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classeDeGwenael,
        'prof_id' => $claire, 'droit' => 'lecture'], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');

    $classes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire])['json']['classes'];
    egal(2, count($classes), 'Claire doit maintenant voir deux classes');
    $partagee = null;
    foreach ($classes as $c) if ($c['libelle'] === '405') $partagee = $c;
    vrai($partagee !== null, "la classe partagée devrait apparaître");
    egal('lecture', $partagee['droit']);
    egal('gwenael', $partagee['proprietaire']);

    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeDeGwenael], ['jeton' => $jetonClaire]);
    egal(200, $r['code'], 'le tableau devrait être lisible');
    egal('lecture', $r['json']['classe']['droit']);
});

verifier("partage en lecture : le tableau ne donne aucun code élève", function () use (&$jeton, &$jetonClaire, &$classeDeGwenael, &$eleveDeGwenael) {
    // Un code ouvre l'appli comme l'élève et permet d'écrire sa progression :
    // le collègue en lecture seule ne doit pas pouvoir le récupérer.
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeDeGwenael], ['jeton' => $jetonClaire]);
    vrai(count($r['json']['eleves']) >= 1, 'au moins un élève');
    foreach ($r['json']['eleves'] as $e) egal(null, $e['code'], 'code masqué');
    vrai(!str_contains($r['texte'], $eleveDeGwenael['code']), "le code ne doit apparaître nulle part dans la réponse");
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeDeGwenael], ['jeton' => $jeton]);
    $codes = array_column($r['json']['eleves'], 'code', 'id');
    egal($eleveDeGwenael['code'], $codes[$eleveDeGwenael['id']] ?? null, 'le propriétaire, lui, voit le code');
});

verifier("partage en lecture : aucune écriture possible", function () use (&$jetonClaire, &$classeDeGwenael, &$eleveDeGwenael) {
    egal(403, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleveDeGwenael['id'],
        'prenom' => 'Pirate'], ['jeton' => $jetonClaire])['code'], 'nommer');
    egal(403, appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classeDeGwenael,
        'nombre' => 1], ['jeton' => $jetonClaire])['code'], 'ajouter des élèves');
    egal(403, appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classeDeGwenael,
        'libelle' => 'renommée'], ['jeton' => $jetonClaire])['code'], 'renommer');
    egal(403, appel('/api/prof.php', ['action' => 'classes.supprimer',
        'classe_id' => $classeDeGwenael], ['jeton' => $jetonClaire])['code'], 'supprimer la classe');
});

verifier("partage en écriture : saisie autorisée, suppression de la classe refusée", function () use (&$jeton, &$jetonClaire, &$classeDeGwenael, &$eleveDeGwenael) {
    $claire = appel('/api/prof.php', ['action' => 'partages.liste',
        'classe_id' => $classeDeGwenael], ['jeton' => $jeton])['json']['partages'][0];
    egal('claire', $claire['identifiant']);
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classeDeGwenael,
        'prof_id' => $claire['prof_id'], 'droit' => 'ecriture'], ['jeton' => $jeton]);

    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeDeGwenael], ['jeton' => $jetonClaire]);
    $codes = array_column($r['json']['eleves'], 'code', 'id');
    egal($eleveDeGwenael['code'], $codes[$eleveDeGwenael['id']] ?? null, "en écriture, les codes sont donnés (le collègue peut les régénérer)");
    egal(200, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleveDeGwenael['id'],
        'prenom' => 'Noé', 'initiale' => 'k'], ['jeton' => $jetonClaire])['code'], 'nommer');
    egal(200, appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classeDeGwenael,
        'nombre' => 1], ['jeton' => $jetonClaire])['code'], 'ajouter un élève');
    egal(403, appel('/api/prof.php', ['action' => 'classes.supprimer',
        'classe_id' => $classeDeGwenael], ['jeton' => $jetonClaire])['code'], 'supprimer la classe');
});

verifier("un collègue partagé ne peut pas re-partager la classe", function () use (&$jetonClaire, &$classeDeGwenael) {
    $r = appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classeDeGwenael,
        'prof_id' => 1, 'droit' => 'ecriture'], ['jeton' => $jetonClaire]);
    egal(403, $r['code'], 'code HTTP');
    egal(403, appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $classeDeGwenael,
        'prof_id' => 1], ['jeton' => $jetonClaire])['code'], 'retrait du partage');
});

verifier("un droit inventé est refusé", function () use (&$jeton, &$jetonClaire, &$classeDeGwenael) {
    $claire = appel('/api/prof.php', ['action' => 'partages.liste',
        'classe_id' => $classeDeGwenael], ['jeton' => $jeton])['json']['partages'][0];
    egal(400, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classeDeGwenael,
        'prof_id' => $claire['prof_id'], 'droit' => 'administrateur'], ['jeton' => $jeton])['code'], 'code HTTP');
});

verifier("retrait du partage : la classe redevient invisible", function () use (&$jeton, &$jetonClaire, &$classeDeGwenael, &$eleveDeGwenael) {
    $claire = appel('/api/prof.php', ['action' => 'partages.liste',
        'classe_id' => $classeDeGwenael], ['jeton' => $jeton])['json']['partages'][0];
    egal(200, appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $classeDeGwenael,
        'prof_id' => $claire['prof_id']], ['jeton' => $jeton])['code'], 'code HTTP');

    $classes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire])['json']['classes'];
    egal(1, count($classes), 'Claire ne doit plus voir que sa classe');
    egal(404, appel('/api/prof.php', ['action' => 'tableau',
        'classe_id' => $classeDeGwenael], ['jeton' => $jetonClaire])['code'], 'tableau');
    egal(404, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleveDeGwenael['id'],
        'prenom' => 'Pirate'], ['jeton' => $jetonClaire])['code'], 'nommer');
});

verifier("le prénom saisi pendant le partage est resté", function () use (&$jeton, &$classeDeGwenael) {
    $eleves = appel('/api/prof.php', ['action' => 'tableau',
        'classe_id' => $classeDeGwenael], ['jeton' => $jeton])['json']['eleves'];
    egal('Noé', $eleves[0]['prenom']);
    egal('K', $eleves[0]['initiale']);
    egal(3, count($eleves), "l'élève ajouté par Claire doit être là");
});

// ------------------------------------------------------- mise à niveau de la base

verifier("migrer.php refuse un mauvais mot de passe", function () {
    $r = formulaire('/migrer.php', ['jeton' => 'mauvais']);
    vrai(str_contains($r['texte'], 'incorrect'), "la page devrait refuser");
});

verifier("migrer.php ne change rien sur une base déjà à jour", function () use (&$jeton) {
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'rien à changer'), "la base est déjà à jour");
    egal(200, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton])['code'],
        "le serveur doit continuer à répondre");
});

verifier("une base de l'ancienne version est reprise sans perdre de données", function () use ($travail) {
    require_once dirname(__DIR__) . '/public/lib/bd.php';
    $ancienne = $travail . '/ancienne.sqlite';
    $vieux = new PDO('sqlite:' . $ancienne, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    // Le schéma tel qu'il était avant le cloisonnement : ni prof_id, ni admin, ni partages.
    $vieux->exec('CREATE TABLE classes (id INTEGER PRIMARY KEY AUTOINCREMENT, libelle TEXT NOT NULL,
                  applis TEXT NOT NULL DEFAULT \'defi-tables\', cree_le TEXT NOT NULL)');
    $vieux->exec('CREATE TABLE profs (id INTEGER PRIMARY KEY AUTOINCREMENT, identifiant TEXT NOT NULL,
                  mdp_hash TEXT NOT NULL, cree_le TEXT NOT NULL)');
    $vieux->exec("INSERT INTO profs (identifiant, mdp_hash, cree_le) VALUES ('gwenael', 'x', '2026-08-29T10:00:00Z')");
    $vieux->exec("INSERT INTO classes (libelle, applis, cree_le) VALUES ('405', 'defi-tables', '2026-08-29T10:00:00Z')");

    $faits = migrer_schema($vieux);
    vrai(count($faits) >= 3, "la migration devrait annoncer ce qu'elle a fait");
    egal(true, colonne_existe($vieux, 'classes', 'prof_id'), 'colonne prof_id');
    egal(true, colonne_existe($vieux, 'profs', 'admin'), 'colonne admin');
    egal(0, (int)$vieux->query('SELECT COUNT(*) FROM partages')->fetchColumn(), 'table partages créée et vide');
    egal(1, (int)$vieux->query('SELECT prof_id FROM classes WHERE libelle = \'405\'')->fetchColumn(),
        'la classe existante doit revenir au premier prof');
    egal(1, (int)$vieux->query('SELECT admin FROM profs WHERE identifiant = \'gwenael\'')->fetchColumn(),
        'le premier prof doit devenir administrateur');
    egal('405', (string)$vieux->query('SELECT libelle FROM classes')->fetchColumn(), 'la classe est intacte');

    egal([], migrer_schema($vieux), "relancer la migration ne doit plus rien faire");
});

// ------------------------------------------------------------------- déconnexion

verifier("déconnexion : le jeton ne marche plus", function () use (&$jeton) {
    egal(200, appel('/api/prof.php', ['action' => 'deconnexion'], ['jeton' => $jeton])['code'], 'code HTTP');
    egal(401, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton])['code'], 'code HTTP');
});

// ------------------------------------------------------------ limitation de débit

verifier("un déluge de requêtes sur un code est freiné", function () use (&$jeton) {
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'gwenael', 'motdepasse' => 'motdepasse-de-test-2026']);
    $j = $r['json']['jeton'];
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-debit'], ['jeton' => $j])['json']['id'];
    $code = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $j])['json']['eleves'][0]['code'];

    // Ce test surveillait autrefois l'horloge en même temps que le serveur, et
    // remettait son propre compte à zéro quand la fenêtre tournait : le
    // limiteur était alors aligné sur l'horloge, et les trois cent trente
    // requêtes de ce test pouvaient enjamber une frontière commune (instabilité
    // relevée le 05/09, verte sur la CI Linux, rouge une fois sur deux sous
    // Windows). Depuis le lot limiteur (07/09/2026), la fenêtre est ouverte par
    // la première requête comptée : il n'y a plus de frontière à enjamber, et
    // cette surveillance a été retirée — elle décrivait un limiteur qui
    // n'existe plus.
    vider_compteurs();
    $freine = false;
    $avant = 0;
    for ($i = 0; $i < 800; $i++) {
        $r = lire($code);
        $statut = $r['code'];
        if ($statut === 429) {
            $freine = true;
            vrai(ctype_digit((string)entete($r, 'Retry-After')), 'le 429 porte Retry-After');
            break;
        }
        if ($statut === 200) $avant++;
    }
    vrai($freine, "le serveur aurait dû répondre 429 après trois cents requêtes");
    // Le compte est exact depuis que la fenêtre ne tourne plus sous nos pieds :
    // le frein arrive à trois cents, pile.
    egal(300, $avant,
        "trois cents lectures passent avant le frein (l'appli envoie après chaque réponse)");
    vider_compteurs();
});

// ------------------------------------------ audit du 30/08/2026 — lot S1
//
// Ces tests EXÉCUTENT les correctifs de l'audit : plus de code ni de jeton
// dans une adresse, limiteur atomique et purgé, échecs comptés par adresse,
// pages techniques muettes, messages identiques pour le cloisonnement.

const ALPHABET_TEST = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function code_inconnu(int $i): string
{
    // Forme valide, préfixe ZZZZ : la chance qu'un vrai code de test commence
    // ainsi est d'une sur un million.
    return 'ZZZZ' . ALPHABET_TEST[$i % 32] . ALPHABET_TEST[intdiv($i, 32) % 32];
}

// Le secret que le serveur emploie pour brouiller les clés des compteurs.
//
// Lot 11 (05/09/2026) : ce n'est plus le mot de passe d'installation lui-même,
// mais une valeur DÉRIVÉE de lui par HMAC avec une étiquette d'usage (voir
// secret_compteurs() dans lib/limite.php). Le test refait le même calcul —
// changer l'un sans l'autre rend rouges tous les tests de limitation, ce qui
// est exactement ce qu'on veut d'un garde-fou.
const SECRET_COMPTEURS_TEST_ETIQUETTE = 'compteurs-de-limitation';

function secret_compteurs_test(): string
{
    return hash_hmac('sha256', SECRET_COMPTEURS_TEST_ETIQUETTE, 'JETON-DE-TEST');
}

function cle_compteur_test(string $cle, int $secondes): string
{
    // Même calcul que lib/limite.php, avec le secret de la config de test.
    return 'l:' . substr(hash_hmac('sha256', $cle, secret_compteurs_test()), 0, 40) . ':' . $secondes;
}

// Écrit directement un compteur dans la base de test, comme si « nombre »
// échecs avaient déjà été comptés dans la fenêtre courante. Six cents vrais
// échecs ralentis prendraient un quart d'heure ; ici, une ligne.
function semer_compteur(string $cle, int $secondes, int $nombre): void
{
    // Même calcul de fenêtre que lib/limite.php : elle part de maintenant et
    // court $secondes. Ce code attendait autrefois quand la fenêtre allait se
    // fermer dans moins de cinq secondes, parce qu'elle était alignée sur
    // l'horloge et que le test et le serveur pouvaient alors ne pas parler de
    // la même. Depuis que la fenêtre est ouverte par la première tentative
    // (lot limiteur, 07/09/2026), il n'y a plus de frontière commune à rater :
    // l'attente a été retirée.
    $fin = time() + $secondes;
    bd_test()->prepare('DELETE FROM compteurs WHERE cle = ?')->execute([cle_compteur_test($cle, $secondes)]);
    bd_test()->prepare('INSERT INTO compteurs (cle, fenetre, nombre) VALUES (?, ?, ?)')
        ->execute([cle_compteur_test($cle, $secondes), $fin, $nombre]);
}

function semer_echecs_adresse(int $nombre): void
{
    semer_compteur('echec-ip:127.0.0.1', 300, $nombre);
}

// Durée d'un appel, en secondes.
function chronometre(callable $appel, &$resultat): float
{
    $debut = hrtime(true);
    $resultat = $appel();
    return (hrtime(true) - $debut) / 1e9;
}

// Ce qui ne doit PAS attendre : le plus court de trois essais
// ------------------------------------------------------------
// Une borne BASSE (« au moins 1,4 s ») ne craint rien d'une machine partagée :
// le ralentissement est un usleep(), et le bruit ne fait qu'allonger. Une
// borne HAUTE (« moins d'une seconde ») craint tout : le 11/10/2026, sur la
// PR 967, le 61e échec de parcours.php — qui n'est pas ralenti — a mis 1,07 s
// sur le serveur de GitHub, sans qu'une ligne du serveur ait changé.
//
// Pour une borne haute, on rejoue donc l'essai trois fois, en remettant l'état
// à l'identique avant chacun ($preparer), et on garde le PLUS COURT. Une
// requête ralentie dort 1,5 s à chaque essai : les trois dépassent le seuil,
// le test rougit à coup sûr. Une requête qui ne l'est pas passe dès qu'un
// seul des trois tombe sur une machine tranquille. $resultats reçoit les
// trois réponses : chacune doit être vérifiée, pas seulement la dernière.
function plus_court_de_trois(callable $preparer, callable $appel, &$resultats): float
{
    $resultats = [];
    $plus_court = INF;
    for ($i = 0; $i < 3; $i++) {
        $preparer();
        $plus_court = min($plus_court, chronometre($appel, $r));
        $resultats[] = $r;
    }
    return $plus_court;
}

// Mesurer un temps de réponse sur une machine partagée, en millisecondes
// ----------------------------------------------------------------------
// Le serveur de GitHub est une machine partagée : elle s'interrompt sans
// prévenir. Une mesure isolée peut y être trois fois trop longue sans qu'une
// seule ligne de code ait changé — c'est ce qui rendait rouges, au hasard, les
// deux tests de temps de ce fichier : dix-neuf fois en cinq jours pour celui
// du compte désactivé, sur des pull requests qui ne touchaient pas au serveur.
//
// Deux précautions, toujours les mêmes, et une seule façon de mesurer dans
// tout le fichier (introduite au lot serveur B, point B8) :
//   - un essai d'ÉCHAUFFEMENT, jeté : le premier appel paie l'ouverture de la
//     connexion et le réveil de la base ;
//   - la MÉDIANE de cinq mesures, jamais la moyenne : une interruption devient
//     une valeur extrême, et la médiane l'ignore.
function mediane_ms(callable $appel, int $mesures = 5): float
{
    $appel(); // échauffement : jeté
    $temps = [];
    for ($i = 0; $i < $mesures; $i++) {
        $debut = hrtime(true);
        $appel();
        $temps[] = (hrtime(true) - $debut) / 1e6;
    }
    sort($temps);
    return $temps[intdiv(count($temps), 2)];
}

// Les mesures de temps ne tournent que sur demande : SUIVI_TESTS_TEMPS=1, posé
// par le rendez-vous hebdomadaire et par les lancements à la main
// (.github/workflows/verifications.yml), jamais sur une pull request.
//
// Ce qu'elles gardent — l'impossibilité de deviner au chronomètre quels
// comptes existent — n'est PAS laissé sans surveillance entre deux dimanches :
// il est vérifié à chaque pull request, sans chronomètre, en lisant le code
// lui-même (tests/suivi-temps-constant.test.mjs, qui tourne dans « node --test »
// et n'est jamais sauté). Une mesure constate un symptôme ; la lecture du code
// établit la cause — et c'est la cause qui protège.
function mesures_de_temps_demandees(): bool
{
    return getenv('SUIVI_TESTS_TEMPS') === '1';
}

$jetonS1 = null;
$codesS1 = [];

verifier("préparation : une classe et quatre élèves pour les tests de seuils", function () use (&$jetonS1, &$codesS1) {
    vider_compteurs();
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'gwenael', 'motdepasse' => 'motdepasse-de-test-2026']);
    egal(200, $r['code'], 'connexion');
    $jetonS1 = $r['json']['jeton'];
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-seuils'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 4], ['jeton' => $jetonS1])['json']['eleves'];
    foreach ($eleves as $e) $codesS1[] = $e['code'];
    egal(4, count($codesS1), 'quatre codes');
});

// Lot « petits correctifs de sécurité » (11/11/2026), constat F08 de l'audit
// GPT du 09/11 : rendre l'expiration d'une session prof inopérante
// (lib/auth.php, prof_de_session) ne faisait rougir AUCUN test de
// comportement — seulement le manifeste VERSION, qui rougit pour tout
// fichier changé. Ce test-ci le voit. Sabotage : « if (false && $session[…] ».
verifier("F08 — une session prof périmée est refusée ET effacée ; une session en cours passe", function () {
    vider_compteurs();
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'gwenael', 'motdepasse' => 'motdepasse-de-test-2026']);
    egal(200, $r['code'], 'connexion');
    $jeton = (string)$r['json']['jeton'];
    $empreinte = hash('sha256', $jeton);
    egal(200, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton])['code'], 'session en cours : acceptée');
    // Une seconde de trop : l'échéance est dépassée.
    bd_test()->prepare('UPDATE sessions_prof SET expire_le = ? WHERE jeton_hash = ?')
        ->execute([gmdate('Y-m-d\\TH:i:s\\Z', time() - 1), $empreinte]);
    egal(401, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton])['code'], 'session périmée : refusée');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM sessions_prof WHERE jeton_hash = ' . bd_test()->quote($empreinte))->fetchColumn(),
        'et effacée de la base au passage');
    egal(401, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton])['code'], 'elle ne revient pas');
    // Le témoin : une échéance dans une minute passe encore.
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'gwenael', 'motdepasse' => 'motdepasse-de-test-2026']);
    $jeton = (string)$r['json']['jeton'];
    bd_test()->prepare('UPDATE sessions_prof SET expire_le = ? WHERE jeton_hash = ?')
        ->execute([gmdate('Y-m-d\\TH:i:s\\Z', time() + 60), hash('sha256', $jeton)]);
    egal(200, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton])['code'], 'une minute avant l’échéance : acceptée');
    appel('/api/prof.php', ['action' => 'deconnexion'], ['jeton' => $jeton]);
});

verifier("GET est refusé sur les deux API élève (405), même avec un bon code", function () use (&$codesS1) {
    egal(405, appel('/api/parcours.php?code=' . $codesS1[0])['code'], 'parcours.php en GET');
    egal(405, appel('/api/parcours.php?code=' . $codesS1[0] . '&appli=defi-tables')['code'], 'avec appli');
    egal(405, appel('/api/eleve.php?code=' . $codesS1[0])['code'], 'eleve.php en GET');
    egal(405, appel('/api/parcours.php?code=ZZZZZZ')['code'], 'code inconnu en GET : 405 aussi, pas 404');
    $r = appel('/api/parcours.php?code=' . $codesS1[0], ['lire' => true]);
    egal(400, $r['code'], "un code dans l'adresse d'un POST est ignoré : il manque alors dans le corps");
});

verifier("le jeton prof n'est plus accepté dans l'adresse", function () use (&$jetonS1) {
    egal(401, appel('/api/prof.php?jeton=' . $jetonS1, ['action' => 'moi'])['code'], 'jeton dans ?jeton=');
    egal(200, appel('/api/prof.php', ['action' => 'moi', 'jeton' => $jetonS1])['code'], 'contrôle : le même jeton dans le corps passe');
});

verifier("70 appels VALIDES depuis une même adresse passent tous (une classe entière derrière une IP)", function () use (&$codesS1) {
    vider_compteurs();
    $ok = 0;
    for ($i = 0; $i < 70; $i++) {
        if (identite($codesS1[$i % 4])['code'] === 200) $ok++;
    }
    egal(70, $ok, 'identités');
    $ok = 0;
    for ($i = 0; $i < 70; $i++) {
        if (lire($codesS1[$i % 4])['code'] === 200) $ok++;
    }
    egal(70, $ok, 'lectures');
    egal(0, count(array_filter(compteurs(), fn($l) => str_starts_with($l['cle'], cle_compteur_test('echec-ip:127.0.0.1', 300)))),
        "aucun échec ne doit avoir été compté");
});

// Lot 5 (03/09/2026). Avant : au 61e échec, l'adresse entière était refusée
// (429), bons codes compris, « sinon le 200 trahirait les bons codes ». Un
// collège sort par une seule adresse : trente élèves qui se trompent deux
// fois en début d'heure fermaient la porte à tout le monde pour cinq minutes.
// Maintenant : au-delà de 60 échecs, chaque requête de l'adresse est RALENTIE
// (1,5 s) et répond juste — 200 pour un bon code, 404 sinon. Le
// ralentissement ferme l'énumération à lui seul (2 400 essais à l'heure sur
// un milliard de codes) ; il n'y a plus besoin de cacher les 200. Le 429 ne
// tombe qu'à 600 échecs : une attaque, pas une classe maladroite.
verifier("soixante et un codes inventés passent en 404 sans attendre ; ensuite l'adresse est ralentie mais répond juste (eleve.php)", function () use (&$codesS1) {
    vider_compteurs();
    $statuts = [];
    for ($i = 0; $i < 61; $i++) $statuts[] = identite(code_inconnu($i))['code'];
    egal(61, count(array_filter($statuts, fn($s) => $s === 404)), '404 pour les 61 : aucun 429');
    // Le 61e n'attend pas encore (60 échecs comptés avant lui) : on le rejoue
    // pour le chronométrer, il devient le 62e échec.
    $duree = chronometre(fn() => identite(code_inconnu(61)), $r);
    egal(404, $r['code'], 'le 62e essai est encore un 404');
    vrai($duree >= 1.4, sprintf('mais lui attend 1,5 s (%.2f s)', $duree));
    $duree = chronometre(fn() => identite($codesS1[0]), $r);
    egal(200, $r['code'], "un bon code depuis cette adresse passe : plus de porte fermée pour la classe");
    vrai($duree >= 1.4, sprintf('ralenti de 1,5 s, lui aussi (%.2f s)', $duree));
    $duree = chronometre(fn() => lire($codesS1[0]), $r);
    egal(200, $r['code'], "la même règle vaut pour parcours.php : quota partagé");
    vrai($duree >= 1.4, sprintf('et le même ralentissement (%.2f s)', $duree));
    $duree = plus_court_de_trois(fn() => vider_compteurs(), fn() => identite($codesS1[0]), $rs);
    egal([200, 200, 200], array_column($rs, 'code'), 'contrôle : après remise à zéro, le bon code passe');
    vrai($duree < 1.0, sprintf('sans attendre (%.2f s, le plus court de trois essais)', $duree));
});

verifier("parcours.php : même ralentissement sur les codes inventés, et le 404 reste un 404", function () use (&$codesS1) {
    // Soixante échecs semés avant chaque essai : chacun est le 61e.
    $duree = plus_court_de_trois(function () { vider_compteurs(); semer_echecs_adresse(60); },
        fn() => lire(code_inconnu(0)), $rs);
    egal([404, 404, 404], array_column($rs, 'code'), 'le 61e échec');
    vrai($duree < 1.0, sprintf('sans attendre (%.2f s, le plus court de trois essais)', $duree));
    $duree = chronometre(fn() => lire(code_inconnu(1)), $r);
    egal(404, $r['code'], 'le 62e : toujours 404, pas 429');
    vrai($duree >= 1.4, sprintf('mais ralenti (%.2f s)', $duree));
    vider_compteurs();
});

verifier("six cents échecs : l'adresse est refusée (429) avec Retry-After, exposé au navigateur", function () use (&$codesS1) {
    vider_compteurs();
    semer_echecs_adresse(600);
    $r = appel('/api/eleve.php', ['code' => code_inconnu(0)], ['origine' => 'https://mathsgo.re']);
    egal(429, $r['code'], 'le 601e échec est refusé');
    $attente = entete($r, 'Retry-After');
    vrai($attente !== null && ctype_digit($attente) && (int)$attente >= 1 && (int)$attente <= 300,
        "Retry-After doit donner les secondes jusqu'à la fin de la fenêtre (obtenu " . json_encode($attente) . ")");
    egal('Retry-After', entete($r, 'Access-Control-Expose-Headers'), "sans cet en-tête, un script de mathsgo.re ne verrait jamais Retry-After");
    egal('https://mathsgo.re', entete($r, 'Access-Control-Allow-Origin'), 'réponse CORS ordinaire');
    // L'appel ci-dessus a compté le 601e échec : chaque essai repart de là.
    $duree = plus_court_de_trois(function () { vider_compteurs(); semer_echecs_adresse(601); },
        fn() => identite($codesS1[0]), $rs);
    egal([429, 429, 429], array_column($rs, 'code'), "au-delà de 600, même un bon code est refusé : c'est une attaque, pas une classe");
    vrai($duree < 1.0, sprintf("et le refus n'attend pas : pas de processus qui dort (%.2f s, le plus court de trois essais)", $duree));
    egal(429, lire($codesS1[0])['code'], 'parcours.php aussi');
    vider_compteurs();
    egal(200, identite($codesS1[0])['code'], 'contrôle : après remise à zéro, le bon code passe');
});

verifier("connexion prof : treize réussites de suite passent toutes (seuls les échecs comptent)", function () {
    vider_compteurs();
    $statuts = [];
    for ($i = 0; $i < 13; $i++) $statuts[] = connexion('gwenael', 'motdepasse-de-test-2026')['code'];
    egal(array_fill(0, 13, 200), $statuts, 'treize professeurs du même collège dans le quart d\'heure');
    egal(0, count(array_filter(compteurs(), fn($l) => str_starts_with($l['cle'], 'l:'))), "et aucun compteur n'a bougé");
});

// Lot serveur B (06/09/2026) — constat 3 de l'audit du 05/09.
//
// Ce test disait l'inverse jusqu'ici : « douze mauvais mots de passe sur un
// compte, puis 429 même avec le bon ». C'était le comportement du code, et
// c'était un défaut, pas une protection : n'importe qui, de n'importe où,
// fermait le compte de Gwenaël pour dix minutes en tapant treize bêtises sur
// son identifiant — sans rien connaître de son mot de passe. Le seuil censé
// protéger le compte était devenu l'outil le plus simple pour l'éteindre.
//
// Le seuil par identifiant RALENTIT maintenant (1,5 s) au lieu de refuser. À
// ce rythme, une devinette en ligne contre un mot de passe de douze caractères
// au minimum n'aboutit pas ; le professeur, lui, entre.
verifier("connexion prof : treize mauvais mots de passe sur un compte ralentissent, mais le bon passe encore", function () {
    vider_compteurs();
    $statuts = [];
    for ($i = 0; $i < 13; $i++) $statuts[] = connexion('gwenael', "mauvais-$i")['code'];
    egal(array_fill(0, 13, 401), $statuts, 'treize refus ordinaires, aucun 429');
    // Le bon mot de passe passe — et il a été RALENTI : c'est là qu'on le voit.
    $debut = hrtime(true);
    $r = connexion('gwenael', 'motdepasse-de-test-2026');
    $duree = (hrtime(true) - $debut) / 1e9;
    egal(200, $r['code'], 'le bon mot de passe passe malgré les treize échecs');
    vrai($duree >= 1.4, sprintf('et il a été ralenti (%.2f s, au moins 1,4 attendu)', $duree));
    // Le même compte visé depuis TROIS adresses : aucune n'atteint son propre
    // seuil (60 échecs), mais le compteur de l'identifiant, lui, les additionne.
    // C'est le cas qui fermait le compte sans qu'on puisse rien y faire.
    vider_compteurs();
    semer_compteur('connexion-id:gwenael', 600, 13);
    $debut = hrtime(true);
    egal(200, connexion('gwenael', 'motdepasse-de-test-2026')['code'],
        'treize échecs venus de trois adresses ne ferment pas le compte');
    vrai((hrtime(true) - $debut) / 1e9 >= 1.4, 'ils le ralentissent seulement');
    // Un autre identifiant depuis la même adresse n'est pas concerné.
    $duree = plus_court_de_trois(function () { vider_compteurs(); semer_compteur('connexion-id:gwenael', 600, 13); },
        fn() => connexion('personne', 'motdepasse-de-test-2026'), $rs);
    egal([401, 401, 401], array_column($rs, 'code'), 'un autre identifiant : refus ordinaire');
    vrai($duree < 1.4, sprintf("et sans ralentissement : le compteur est bien par identifiant (%.2f s, le plus court de trois essais)", $duree));
    vider_compteurs();
});

verifier("connexion prof : soixante échecs depuis une adresse, puis 429 pour tout identifiant", function () {
    vider_compteurs();
    semer_compteur('connexion-echec:127.0.0.1', 600, 60);
    $r = connexion('personne', 'x');
    egal(429, $r['code'], 'le 61e échec de l\'adresse est refusé');
    vrai(ctype_digit((string)entete($r, 'Retry-After')), 'avec Retry-After');
    egal(429, connexion('gwenael', 'motdepasse-de-test-2026')['code'], 'même le bon compte, depuis cette adresse');
    vider_compteurs();
});

verifier("un code mal formé ne compte pas comme un échec d'énumération", function () use (&$codesS1) {
    vider_compteurs();
    for ($i = 0; $i < 70; $i++) egal(400, identite('AB')['code'], 'mal formé');
    egal(200, identite($codesS1[0])['code'], 'un bon code passe toujours');
});

verifier("vingt requêtes simultanées sur une clé neuve : aucune 500, compteur exact", function () use (&$codesS1) {
    vider_compteurs();
    $statuts = appels_paralleles('/api/parcours.php', ['code' => $codesS1[1], 'lire' => true], 20);
    egal([], array_values(array_filter($statuts, fn($s) => $s !== 200)), 'tous en 200');
    $nombre = null;
    foreach (compteurs() as $l) if ($l['cle'] === cle_compteur_test('code:' . $codesS1[1], 300)) $nombre = (int)$l['nombre'];
    egal(20, $nombre, 'le compteur du code doit valoir exactement 20');
});

verifier("les compteurs périmés sont purgés, et aucun ne contient une adresse ou un code en clair", function () use (&$codesS1) {
    vider_compteurs();
    bd_test()->exec("INSERT INTO compteurs (cle, fenetre, nombre) VALUES ('l:perime:300', 1, 5)");
    egal(200, identite($codesS1[2])['code'], 'un appel ordinaire');
    $lignes = compteurs();
    vrai(!in_array('l:perime:300', array_column($lignes, 'cle'), true), "la ligne périmée doit avoir disparu");
    vrai(count($lignes) >= 1, "le compteur de cet appel doit exister");
    foreach ($lignes as $l) {
        vrai((bool)preg_match('/^l:[0-9a-f]{40}:\d+$/', $l['cle']), "clé hachée attendue, obtenu " . $l['cle']);
        vrai(!str_contains($l['cle'], '127.0.0.1') && !str_contains($l['cle'], $codesS1[2]), "ni adresse ni code en clair");
        vrai((int)$l['fenetre'] > time(), "la fenêtre doit se fermer dans le futur");
    }
});

verifier("régénérer ou supprimer un élève efface ses compteurs", function () use (&$jetonS1, &$codesS1) {
    vider_compteurs();
    identite($codesS1[3]);
    lire($codesS1[3]);
    egal(2, count(compteurs()), 'deux compteurs pour ce code');
    $eleves = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => 0], ['jeton' => $jetonS1]);
    // On retrouve l'élève par son code via la liste des classes.
    $classes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes'];
    $id = null;
    foreach ($classes as $c) {
        $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $c['id']], ['jeton' => $jetonS1]);
        foreach ($t['json']['eleves'] ?? [] as $e) if ($e['code'] === $codesS1[3]) $id = $e['id'];
    }
    vrai($id !== null, "l'élève doit être retrouvé");
    egal(200, appel('/api/prof.php', ['action' => 'eleves.regenerer', 'eleve_id' => $id], ['jeton' => $jetonS1])['code'], 'régénération');
    egal(0, count(compteurs()), "plus aucun compteur de l'ancien code");
});

verifier("le hachage de remplacement de la connexion est un vrai bcrypt au coût des comptes", function () {
    require_once dirname(__DIR__) . '/public/lib/auth.php';
    $info = password_get_info(HASH_DE_REMPLACEMENT);
    egal('bcrypt', $info['algoName'], 'algorithme');
    egal(COUT_BCRYPT, $info['options']['cost'], 'coût');
    egal(60, strlen(HASH_DE_REMPLACEMENT), 'longueur');
    vrai(!password_verify('', HASH_DE_REMPLACEMENT) && !password_verify('motdepasse-de-test-2026', HASH_DE_REMPLACEMENT),
        "aucun mot de passe ne doit lui correspondre");
    vider_compteurs();
    // Lot serveur B (B8) — ce test rougissait par intermittence sur le runner
    // de GitHub : 747 ms contre 148 ms le 05/09, sans qu'aucune ligne de code
    // ait changé. Une machine partagée s'interrompt, et une moyenne de trois
    // mesures suffit à ce qu'une seule interruption emporte le verdict.
    //
    // Deux corrections, l'une et l'autre nécessaires :
    //  - MÉDIANE de cinq mesures, pas moyenne : une interruption devient une
    //    valeur extrême, et la médiane l'ignore ;
    //  - seuil RELATIF et à SENS UNIQUE. Ce qu'on protège, c'est le secret de
    //    « ce compte existe » : le refus d'un identifiant inconnu ne doit pas
    //    être plus rapide, sinon on le devine au chronomètre. Qu'il soit plus
    //    LENT n'apprend rien à personne — et c'est exactement ce que le bruit
    //    d'un runner fabrique. Borner les deux côtés revenait à demander à une
    //    machine partagée d'être régulière : elle ne l'est pas.
    // Depuis le tri des jobs (07/09/2026), la mesure elle-même ne tourne qu'au
    // rendez-vous hebdomadaire : ce qui précède — un vrai bcrypt, au coût des
    // comptes, qu'aucun mot de passe ne satisfait — est vérifié à chaque fois,
    // et c'est lui qui fait le temps constant.
    if (!mesures_de_temps_demandees()) {
        echo "       (mesure de temps non jouée ici : SUIVI_TESTS_TEMPS=1 la demande)\n";
        vider_compteurs();
        return;
    }
    $refus = fn(string $identifiant): callable => fn() => appel('/api/prof.php',
        ['action' => 'connexion', 'identifiant' => $identifiant, 'motdepasse' => 'mauvais-mot-de-passe']);
    $inconnu = mediane_ms($refus('personne-de-ce-nom'));
    $connu = mediane_ms($refus('gwenael'));
    echo sprintf("       (connexion refusée, médiane de 5 : identifiant inconnu %.0f ms, identifiant existant %.0f ms)\n", $inconnu, $connu);
    vrai($inconnu >= $connu / 2,
        sprintf("le refus d'un identifiant inconnu (%.0f ms) ne doit pas être plus de deux fois plus rapide "
            . "que celui d'un mauvais mot de passe (%.0f ms) : la différence dirait quels comptes existent", $inconnu, $connu));
    vider_compteurs();
});

verifier("un professeur connecté ne distingue pas « inexistant » de « chez un collègue »", function () use (&$jetonClaire, &$eleveDeGwenael, &$classeDeGwenael) {
    $a = appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleveDeGwenael, 'prenom' => 'X'], ['jeton' => $jetonClaire]);
    $b = appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => 999999, 'prenom' => 'X'], ['jeton' => $jetonClaire]);
    egal(404, $a['code'], "l'élève d'un collègue");
    egal($a['code'], $b['code'], 'même code HTTP');
    egal($a['json'], $b['json'], 'même réponse');
    $a = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeDeGwenael], ['jeton' => $jetonClaire]);
    $b = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => 999999], ['jeton' => $jetonClaire]);
    egal($a['json'], $b['json'], 'même réponse pour une classe');
});

verifier("verifier.php, une fois installé, joue le limiteur sur la vraie base", function () {
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    $page = html_entity_decode($r['texte'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    vrai(str_contains($page, "Limiteur d'essais"), "la ligne du limiteur doit être là");
    vrai((bool)preg_match('/oui">✓<\/span>\s*Limiteur/u', $page), "et elle doit être verte");
    vrai(str_contains($page, 'purgés à chaque appel'), "avec son détail");
    vrai(!str_contains($page, 'PDOException') && !str_contains($page, 'SQLSTATE'), "aucun message technique");
    // Lot 5 : l'adresse que le serveur croit être celle du visiteur, pour voir
    // une fois pour toutes si l'hébergeur transmet la vraie.
    vrai((bool)preg_match('/oui">✓<\/span>\s*Adresse vue par le serveur.*?127\.0\.0\.1/su', $page), "la ligne « Adresse vue par le serveur » doit montrer 127.0.0.1");
});

verifier("aucune erreur PHP n'est affichée : un corps de requête absurde répond en JSON propre", function () {
    $r = appel('/api/parcours.php', '{"code": {"a": [1,2]}, "parcours": "x"}');
    egal(400, $r['code'], 'code HTTP');
    vrai(is_array($r['json']) && $r['json']['ok'] === false, 'réponse JSON');
    vrai(!str_contains($r['texte'], 'Warning') && !str_contains($r['texte'], 'Fatal'), 'aucun avertissement PHP dans la réponse');
});

// ------------------------------------------- audit du 30/08/2026 — lot A2
//
// Révisions et conflits (409), version précédente restaurable, contenu accepté
// (aucun texte libre à aucune profondeur), parcours de référence de l'appli.

function ecrire(string $code, array $parcours, ?int $base = null, ?string $appli = null): array
{
    $corps = ['code' => $code, 'parcours' => $parcours];
    if ($base !== null) $corps['base_revision'] = $base;
    if ($appli !== null) $corps['appli'] = $appli;
    return appel('/api/parcours.php', $corps);
}

function ecrire_brut(string $code, string $parcoursJson, ?int $base = null): array
{
    $corps = '{"code":' . json_encode($code) . ($base !== null ? ',"base_revision":' . $base : '') . ',"parcours":' . $parcoursJson . '}';
    return appel('/api/parcours.php', $corps);
}

$codesA2 = [];
verifier("préparation : une classe et trois élèves pour les révisions", function () use (&$jetonS1, &$codesA2) {
    vider_compteurs();
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-revisions'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 3], ['jeton' => $jetonS1])['json']['eleves'];
    foreach ($eleves as $e) $codesA2[] = ['id' => $e['id'], 'code' => $e['code'], 'classe' => $classe];
    egal(3, count($codesA2));
});

verifier("la lecture renvoie la révision : 0 sans progression, 1 après la première écriture", function () use (&$codesA2) {
    $r = lire($codesA2[0]['code']);
    egal(false, $r['json']['existe']);
    egal(0, $r['json']['revision'], 'sans progression');
    $r = ecrire($codesA2[0]['code'], ['version' => VERSION_TABLES, 'epoque' => 0, 'tables' => ['2' => ['acquise' => '2026-09-01']]], 0);
    egal(200, $r['code'], 'première écriture');
    egal(1, $r['json']['revision'], 'révision 1');
    $r = lire($codesA2[0]['code']);
    egal(1, $r['json']['revision'], 'relue');
    egal('2026-09-01', $r['json']['parcours']['tables']['2']['acquise']);
});

verifier("écrire avec la bonne révision passe, avec une révision périmée répond 409 et l’état actuel", function () use (&$codesA2) {
    $code = $codesA2[0]['code'];
    $r = ecrire($code, ['version' => VERSION_TABLES, 'tables' => ['2' => ['acquise' => '2026-09-01'], '5' => ['acquise' => '2026-09-02']]], 1);
    egal(200, $r['code']);
    egal(2, $r['json']['revision']);
    // Un autre appareil, parti de la révision 1, envoie sa copie.
    $r = ecrire($code, ['version' => VERSION_TABLES, 'tables' => ['2' => ['acquise' => '2026-09-01'], '7' => ['acquise' => '2026-09-03']]], 1);
    egal(409, $r['code'], 'conflit');
    egal(true, $r['json']['conflit']);
    egal(2, $r['json']['revision'], 'la révision en base');
    egal('2026-09-02', $r['json']['parcours']['tables']['5']['acquise'], "l'état actuel, pour fusionner");
    $r = lire($code);
    vrai(!isset($r['json']['parcours']['tables']['7']), "rien n'a été écrasé");
    // Il fusionne et renvoie avec la bonne révision.
    $r = ecrire($code, ['version' => VERSION_TABLES, 'tables' => ['2' => ['acquise' => '2026-09-01'], '5' => ['acquise' => '2026-09-02'], '7' => ['acquise' => '2026-09-03']]], 2);
    egal(200, $r['code']);
    egal(3, $r['json']['revision']);
});

// Lot S2 : base_revision est devenue obligatoire (l'appli du lot A2 l'envoie
// toujours). Un client qui ne dit pas ce qu'il a lu n'écrit pas.
verifier("sans base_revision, l’écriture est refusée (400) et rien ne bouge", function () use (&$codesA2) {
    $r = ecrire($codesA2[0]['code'], ['version' => VERSION_TABLES, 'tables' => ['2' => ['acquise' => '2026-09-01']]]);
    egal(400, $r['code']);
    vrai(str_contains((string)$r['json']['erreur'], 'Révision'), "le message dit ce qui manque");
    egal(3, lire($codesA2[0]['code'])['json']['revision'], 'la révision n’a pas bougé');
    egal(400, ecrire($codesA2[0]['code'], ['version' => VERSION_TABLES], -3)['code'], 'une révision négative est refusée');
    egal(400, ecrire_brut($codesA2[0]['code'], '{"version":5}', null)['code'], 'même en JSON brut');
    $r = appel('/api/parcours.php', '{"code":' . json_encode($codesA2[0]['code']) . ',"base_revision":"3","parcours":{"version":5}}');
    egal(400, $r['code'], 'une révision en texte est refusée');
    $r = ecrire($codesA2[0]['code'], ['version' => VERSION_TABLES, 'tables' => ['2' => ['acquise' => '2026-09-01']]], 3);
    egal(200, $r['code'], 'avec la bonne révision, ça passe');
    egal(4, $r['json']['revision']);
});

verifier("vingt premières créations simultanées : une seule passe, les autres reçoivent 409, aucune 500", function () use (&$codesA2) {
    vider_compteurs();
    $statuts = appels_paralleles('/api/parcours.php', ['code' => $codesA2[1]['code'], 'base_revision' => 0,
        'parcours' => ['version' => VERSION_TABLES, 'tables' => ['3' => ['acquise' => '2026-09-01']]]], 20);
    $comptes = array_count_values($statuts);
    egal(1, $comptes[200] ?? 0, 'une seule création');
    egal(19, $comptes[409] ?? 0, 'les autres en conflit (statuts : ' . json_encode($comptes) . ')');
    egal(0, $comptes[500] ?? 0, 'aucune erreur serveur');
    egal(1, lire($codesA2[1]['code'])['json']['revision'], 'révision 1, pas 20');
});

verifier("le serveur ne garde ni prénom, ni texte libre, ni clé inconnue, à aucune profondeur", function () use (&$codesA2) {
    $code = $codesA2[2]['code'];
    $r = ecrire_brut($code, '{"version":5,"prenom":"Léa Dupont","commentaire":"n\'importe quoi","tables":{"7":{"prenom":"Alice","acquise":"2026-09-01","commentaire":"x","apprends":{"construct":2,"information":"médicale"}},"11":{"acquise":"2026-09-01"}},"expert":{"niveau":2,"dernier":"' . str_repeat('x', 300) . '"},"calculs":{"3-7":{"cases":2,"vu":"' . str_repeat('y', 300) . '","gagne":"2026-09-01"}},"melange":{"tables":[2,"abc",5],"aJour":true}}', 0);
    egal(200, $r['code']);
    $lu = lire($code)['json']['parcours'];
    egal(['version', 'tables', 'expert', 'calculs', 'melange'], array_keys($lu), 'clés de premier niveau');
    vrai(!isset($lu['tables']['7']['prenom']) && !isset($lu['tables']['7']['commentaire']), 'rien de libre dans une table');
    vrai(!isset($lu['tables']['7']['apprends']['information']), 'ni plus profond');
    vrai(!isset($lu['tables']['11']), "une clé de table hors 2–10 n'est pas gardée");
    egal(['niveau' => 2], $lu['expert'], "un texte à la place d'une date saute");
    egal(['cases' => 2, 'gagne' => '2026-09-01'], $lu['calculs']['3-7']);
    egal([2, 5], $lu['melange']['tables'], "une liste ne garde que ses nombres");
    $texte = lire($code)['texte'];
    vrai(!str_contains($texte, 'Dupont') && !str_contains($texte, 'médicale') && !str_contains($texte, 'xxxx'), 'aucun texte libre ne ressort');
    // Un objet vide reste un objet vide : l'appli relit ce qu'elle a envoyé.
    ecrire_brut($code, '{"version":5,"calculs":{},"melange":{"tables":[]}}', 1);
    vrai(str_contains(lire($code)['texte'], '"calculs":{}'), '{} reste {}');
    vrai(str_contains(lire($code)['texte'], '"tables":[]'), '[] reste []');
});

verifier("le parcours de référence généré par l’appli ressort identique du filtre du serveur", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    require_once dirname(__DIR__) . '/public/lib/progression.php';
    $chemin = __DIR__ . '/parcours-reference.json';
    vrai(is_file($chemin), "tests/parcours-reference.json manque : node scripts/generer-parcours-reference.mjs");
    $reference = json_decode((string)file_get_contents($chemin), false);
    vrai(is_object($reference), 'référence lisible');
    // Le prénom reste sur l'appareil : le paquet l'envoie vide, le serveur le retire.
    unset($reference->prenom);
    $attendu = json_encode($reference, JSON_UNESCAPED_UNICODE);
    $obtenu = json_encode(filtrer_progression('defi-tables', json_decode((string)file_get_contents($chemin), false)), JSON_UNESCAPED_UNICODE);
    egal($attendu, $obtenu, "le filtre du serveur jette un champ que l'appli produit : compléter 'cles'/'mots' dans lib/applis.php");
    vrai(strlen($attendu) > 3000, 'la référence est bien un parcours complet');
    egal('{}', json_encode(filtrer_progression('automatismes', $reference)), "une appli sans schéma déclaré n'enregistre rien");
});

verifier("restaurer la version précédente depuis Ma classe", function () use (&$jetonS1, &$jetonClaire, &$codesA2) {
    $eleve = $codesA2[0];
    $classe = $eleve['classe'];
    $lu = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe], ['jeton' => $jetonS1])['json']['eleves'];
    $ligne = null;
    foreach ($lu as $l) if ($l['id'] === $eleve['id']) $ligne = $l;
    egal(true, $ligne['restaurable'], "après plusieurs écritures, une version précédente existe");
    $avant = lire($eleve['code'])['json'];
    $r = appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $eleve['id']], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'restauration');
    egal($avant['revision'] + 1, $r['json']['revision'], 'la révision monte : l’appli fusionnera');
    $apres = lire($eleve['code'])['json'];
    egal('2026-09-03', $apres['parcours']['tables']['7']['acquise'] ?? null, 'la version précédente (celle avec la table de 7) est revenue');
    // Refaire l'inverse est possible : la version actuelle est devenue la précédente.
    $r = appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $eleve['id']], ['jeton' => $jetonS1]);
    egal(200, $r['code']);
    vrai(!isset(lire($eleve['code'])['json']['parcours']['tables']['7']), 'retour à la version d’avant');
    // Un élève sans version précédente : refus propre.
    $r = appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $codesA2[1]['id']], ['jeton' => $jetonS1]);
    egal(409, $r['code'], 'rien à restaurer');
    // Un collègue sans partage : introuvable ; en lecture seule : refusé.
    egal(404, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $eleve['id']], ['jeton' => $jetonClaire])['code'], 'collègue sans partage');
    $claire = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.annuaire'], ['jeton' => $jetonS1])['json']['profs'] as $p) if ($p['identifiant'] === 'claire') $claire = $p['id'];
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classe, 'prof_id' => $claire, 'droit' => 'lecture'], ['jeton' => $jetonS1]);
    egal(403, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $eleve['id']], ['jeton' => $jetonClaire])['code'], 'partage en lecture');
});

// ------------------------------------------- audit du 02/09/2026 — lot 6
//
// Restauration sous verrou (B-F06, C-7), première écriture qui exige
// base_revision 0 (B-F10), Cache-Control: no-store sur l'API (S9).

// Plusieurs requêtes DIFFÉRENTES lancées en même temps (chemin, corps, jeton) :
// renvoie pour chacune ['code' => …, 'json' => …], dans l'ordre donné.
function appels_paralleles_mixtes(array $requetes): array
{
    global $url;
    $multi = curl_multi_init();
    $canaux = [];
    foreach ($requetes as $requete) {
        $entetes = ['Content-Type: application/json'];
        if (isset($requete['jeton'])) $entetes[] = 'Authorization: Bearer ' . $requete['jeton'];
        $ch = curl_init($url . $requete['chemin']);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($requete['corps']),
            CURLOPT_HTTPHEADER => $entetes,
            CURLOPT_TIMEOUT => 20,
        ]);
        curl_multi_add_handle($multi, $ch);
        $canaux[] = $ch;
    }
    do {
        $etat = curl_multi_exec($multi, $actifs);
        if ($actifs) curl_multi_select($multi, 1.0);
    } while ($actifs && $etat === CURLM_OK);
    $reponses = [];
    foreach ($canaux as $ch) {
        $texte = (string)curl_multi_getcontent($ch);
        $reponses[] = ['code' => (int)curl_getinfo($ch, CURLINFO_HTTP_CODE), 'json' => json_decode($texte, true)];
        curl_multi_remove_handle($multi, $ch);
        curl_close($ch);
    }
    curl_multi_close($multi);
    return $reponses;
}

// Une requête lancée SANS attendre sa réponse : on garde la main pendant
// qu'elle est en vol (pour la faire attendre derrière un verrou tenu par le
// test), puis on la termine avec terminer_appel_en_vol().
function lancer_appel_en_vol(string $chemin, array $corps, ?string $jeton = null): array
{
    global $url;
    $entetes = ['Content-Type: application/json'];
    if ($jeton !== null) $entetes[] = 'Authorization: Bearer ' . $jeton;
    $multi = curl_multi_init();
    $ch = curl_init($url . $chemin);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($corps),
        CURLOPT_HTTPHEADER => $entetes,
        CURLOPT_TIMEOUT => 20,
    ]);
    curl_multi_add_handle($multi, $ch);
    curl_multi_exec($multi, $actifs);
    return ['multi' => $multi, 'canal' => $ch];
}

// Fait avancer l'appel en vol pendant $millisecondes ; vrai s'il a répondu.
function avancer_appel_en_vol(array $vol, int $millisecondes): bool
{
    $fin = microtime(true) + $millisecondes / 1000;
    do {
        curl_multi_exec($vol['multi'], $actifs);
        if (!$actifs) return true;
        curl_multi_select($vol['multi'], 0.05);
    } while (microtime(true) < $fin);
    return false;
}

function terminer_appel_en_vol(array $vol): array
{
    do {
        $etat = curl_multi_exec($vol['multi'], $actifs);
        if ($actifs) curl_multi_select($vol['multi'], 1.0);
    } while ($actifs && $etat === CURLM_OK);
    $texte = (string)curl_multi_getcontent($vol['canal']);
    $reponse = ['code' => (int)curl_getinfo($vol['canal'], CURLINFO_HTTP_CODE), 'json' => json_decode($texte, true)];
    curl_multi_remove_handle($vol['multi'], $vol['canal']);
    curl_close($vol['canal']);
    curl_multi_close($vol['multi']);
    return $reponse;
}

function pilote_test(): string
{
    return bd_test()->getAttribute(PDO::ATTR_DRIVER_NAME);
}

$codesL6 = [];
verifier("préparation : une classe et deux élèves pour le lot 6", function () use (&$jetonS1, &$codesL6) {
    vider_compteurs();
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-lot6'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    foreach ($eleves as $e) $codesL6[] = ['id' => $e['id'], 'code' => $e['code'], 'classe' => $classe];
    egal(2, count($codesL6));
});

verifier("première écriture : une révision autre que 0 est un conflit (409, état vide), rien n’est créé", function () use (&$codesL6) {
    $code = $codesL6[0]['code'];
    $r = ecrire($code, ['version' => VERSION_TABLES, 'tables' => ['4' => ['acquise' => '2026-09-04']]], 5);
    egal(409, $r['code'], 'une appli qui annonce la révision 5 alors que le serveur n’a rien');
    egal(true, $r['json']['conflit']);
    egal(0, $r['json']['revision'], 'l’état renvoyé est la révision 0');
    egal(null, $r['json']['parcours'], 'et un parcours vide : l’appli fusionne avec rien et repart de 0');
    $r = lire($code);
    egal(false, $r['json']['existe'], 'aucune ligne créée');
    egal(0, $r['json']['revision']);
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM progressions WHERE eleve_id = ' . (int)$codesL6[0]['id'])->fetchColumn(), 'en base non plus');
    $r = ecrire($code, ['version' => VERSION_TABLES, 'tables' => ['4' => ['acquise' => '2026-09-04']]], 0);
    egal(200, $r['code'], 'avec la révision 0, la création passe');
    egal(1, $r['json']['revision']);
    $r = ecrire($code, ['version' => VERSION_TABLES, 'tables' => ['4' => ['acquise' => '2026-09-04'], '6' => ['acquise' => '2026-09-04']]], 1);
    egal(2, $r['json']['revision'], 'puis la mise à jour normale');
});

verifier("la restauration attend le verrou de la ligne et repart de la révision qu’elle trouve, jamais d’une révision périmée", function () use (&$jetonS1, &$codesL6) {
    // L'élève est en révision 2 : donnees = {4, 6}, version précédente = {4}.
    $eleve = $codesL6[0];
    $bd = bd_test();
    $mysql = pilote_test() === 'mysql';
    $id = (int)$bd->query('SELECT id FROM progressions WHERE eleve_id = ' . (int)$eleve['id'])->fetchColumn();
    vrai($id > 0, 'la progression existe');

    // Le test tient LA ligne verrouillée, comme l'appli de l'élève au milieu
    // d'une écriture, et lance la restauration pendant ce temps.
    if ($mysql) {
        $bd->beginTransaction();
        $bd->query('SELECT id FROM progressions WHERE id = ' . $id . ' FOR UPDATE')->fetchAll();
    } else {
        $bd->exec('BEGIN IMMEDIATE');
    }
    $vol = lancer_appel_en_vol('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $eleve['id'], 'appli' => 'defi-tables'], $jetonS1);
    $repondu = avancer_appel_en_vol($vol, 700);
    // Pendant que la restauration attend, l'élève finit son écriture : révision 3.
    $bd->prepare('UPDATE progressions SET donnees_avant = donnees, donnees = ?, revision = 3, maj_le = ? WHERE id = ? AND revision = 2')
        ->execute(['{"version":1,"tables":{"4":{"acquise":"2026-09-04"},"6":{"acquise":"2026-09-04"},"8":{"acquise":"2026-09-04"}}}', '2026-09-04', $id]);
    $bd->exec('COMMIT');
    $r = terminer_appel_en_vol($vol);
    vrai(!$repondu, 'la restauration n’a pas répondu tant que la ligne était verrouillée');
    egal(200, $r['code'], 'la restauration passe une fois le verrou rendu (aucun 500, même sur SQLite : C-7)');
    egal(4, $r['json']['revision'], 'elle a relu la ligne APRÈS le verrou : révision 3 → 4, pas 2 → 3');
    // Ce qu'elle a restauré, c'est la version précédente de la révision 3
    // (= {4, 6}), pas celle qu'elle aurait lue avant le verrou (= {4}).
    egal([4, 6], array_map('intval', array_keys($r['json']['parcours']['tables'])), 'la version précédente au moment de l’écriture');
    $lu = lire($eleve['code'])['json'];
    egal(4, $lu['revision'], 'en base aussi');
    egal([4, 6], array_map('intval', array_keys($lu['parcours']['tables'])));
    $ligne = $bd->query('SELECT donnees_avant FROM progressions WHERE id = ' . $id)->fetch(PDO::FETCH_ASSOC);
    vrai(str_contains((string)$ligne['donnees_avant'], '"8"'), 'l’écriture de l’élève (avec la table de 8) est devenue la version précédente : rien n’est perdu');
});

verifier("dix restaurations et dix écritures de l’élève en même temps : aucune révision attribuée deux fois, aucun 500", function () use (&$jetonS1, &$codesL6) {
    vider_compteurs();
    $eleve = $codesL6[1];
    ecrire($eleve['code'], ['version' => VERSION_TABLES, 'tables' => ['2' => ['acquise' => '2026-09-04']]], 0);
    ecrire($eleve['code'], ['version' => VERSION_TABLES, 'tables' => ['2' => ['acquise' => '2026-09-04'], '3' => ['acquise' => '2026-09-04']]], 1);
    $revisions = [];
    $statuts = [];
    for ($tour = 0; $tour < 10; $tour++) {
        // L'appli lit la révision, puis écrit ; le professeur clique au même instant.
        $base = (int)lire($eleve['code'])['json']['revision'];
        $reponses = appels_paralleles_mixtes([
            ['chemin' => '/api/prof.php', 'jeton' => $jetonS1, 'corps' => ['action' => 'eleves.restaurer', 'eleve_id' => $eleve['id'], 'appli' => 'defi-tables']],
            ['chemin' => '/api/parcours.php', 'corps' => ['code' => $eleve['code'], 'base_revision' => $base,
                'parcours' => ['version' => VERSION_TABLES, 'tables' => ['2' => ['acquise' => '2026-09-04'], (string)(4 + $tour % 6) => ['acquise' => '2026-09-04']]]]],
        ]);
        foreach ($reponses as $r) {
            $statuts[] = $r['code'];
            if ($r['code'] === 200) $revisions[] = (int)$r['json']['revision'];
        }
    }
    $comptes = array_count_values($statuts);
    egal(0, $comptes[500] ?? 0, 'aucune erreur serveur (statuts : ' . json_encode($comptes) . ')');
    vrai(($comptes[200] ?? 0) >= 10, 'au moins les dix restaurations ont abouti (statuts : ' . json_encode($comptes) . ')');
    egal(count($revisions), count(array_unique($revisions)), 'révisions renvoyées par les 200 toutes différentes : ' . json_encode($revisions));
    egal(max($revisions), (int)lire($eleve['code'])['json']['revision'], 'la dernière révision attribuée est celle en base');
});

verifier("aucune réponse de l’API ne peut rester dans un cache : Cache-Control no-store, réussie ou non", function () use (&$codesL6, &$jetonS1) {
    vider_compteurs();
    foreach ([
        'lecture 200' => lire($codesL6[0]['code']),
        'écriture 409' => ecrire($codesL6[0]['code'], ['version' => VERSION_TABLES], 1),
        'identité 200' => identite($codesL6[0]['code']),
        'code inconnu 404' => identite(code_inconnu(0)),
        'tableau prof 200' => appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $codesL6[0]['classe']], ['jeton' => $jetonS1]),
        'prof sans jeton 401' => appel('/api/prof.php', ['action' => 'moi']),
        'GET refusé 405' => appel('/api/parcours.php', null),
    ] as $quoi => $r) {
        egal('no-store', entete($r, 'Cache-Control'), "$quoi : Cache-Control no-store");
    }
});

verifier("l’espace élève ne parle plus de « Ce n’est pas moi », même dans ses commentaires — sauf dans la question « C’est toujours toi ? »", function () {
    $r = page('/');
    egal(200, $r['code']);
    // Lot « code en cases » (11/2026) : la question des applis arrive sur Mon
    // espace avec ses mots (« Non, ce n’est pas moi »), dans sa carte #garde.
    // Partout ailleurs, le geste de sortie s’appelle « Se déconnecter ».
    // Lot « toujours toi » (11/11/2026) : « Non » est sous le cadre du code,
    // hors du formulaire, toujours dans la carte.
    $sansQuestion = preg_replace('~<div id="garde" class="garde".*?id="garde-non"[^>]*>[^<]*</button>\s*</div>\s*</div>~s', '', $r['texte']);
    vrai($sansQuestion !== $r['texte'], 'la carte de la question est bien là');
    vrai(substr_count($r['texte'], 'pas moi') === 1, 'un seul « pas moi » : le bouton « Non » de la question');
    vrai(!str_contains($sansQuestion, 'pas moi'), 'aucun « pas moi » ailleurs dans le HTML envoyé à l’élève');
    vrai(str_contains($r['texte'], 'Se déconnecter'), 'le mot est « Se déconnecter »');
});

verifier("la mise à niveau ajoute révision, version précédente et les colonnes réservées au lot S2", function () use ($travail) {
    require_once dirname(__DIR__) . '/public/lib/bd.php';
    $ancienne = $travail . '/ancienne-a2.sqlite';
    $vieux = new PDO('sqlite:' . $ancienne, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    // Une base d'après le cloisonnement mais d'avant le lot A2.
    $vieux->exec('CREATE TABLE progressions (id INTEGER PRIMARY KEY AUTOINCREMENT, eleve_id INTEGER NOT NULL, appli TEXT NOT NULL, donnees TEXT NOT NULL, maj_le TEXT NOT NULL)');
    $vieux->exec('CREATE TABLE profs (id INTEGER PRIMARY KEY AUTOINCREMENT, identifiant TEXT NOT NULL, mdp_hash TEXT NOT NULL, admin INTEGER NOT NULL DEFAULT 0, cree_le TEXT NOT NULL)');
    $vieux->exec("INSERT INTO progressions (eleve_id, appli, donnees, maj_le) VALUES (1, 'defi-tables', '{\"version\":1}', '2026-08-30')");
    $faits = migrer_schema($vieux);
    vrai(count($faits) >= 4, 'la migration annonce les colonnes ajoutées');
    foreach ([['progressions', 'revision'], ['progressions', 'donnees_avant'], ['profs', 'actif'], ['profs', 'mdp_temporaire']] as [$table, $colonne]) {
        egal(true, colonne_existe($vieux, $table, $colonne), "$table.$colonne");
    }
    egal(0, (int)$vieux->query('SELECT revision FROM progressions')->fetchColumn(), 'les lignes existantes partent en révision 0');
    egal('{"version":1}', (string)$vieux->query('SELECT donnees FROM progressions')->fetchColumn(), 'sans toucher aux données');
    // Lot serveur A : les deux tables neuves arrivent par la même mise à
    // niveau, et elles sont ANNONCÉES (la page de migration doit montrer ce
    // qu'elle a fait, sinon on ne sait pas si elle a servi).
    egal(true, table_existe($vieux, 'versions'), 'la table versions');
    egal(true, table_existe($vieux, 'journal'), 'la table journal');
    $dits = implode(' | ', $faits);
    vrai(str_contains($dits, 'versions') && str_contains($dits, 'journal'),
        'la mise à niveau annonce les deux tables neuves : ' . $dits);
    // Rejouable deux fois de suite sans erreur ET sans rien redire.
    egal([], migrer_schema($vieux), 'relancer ne fait plus rien');
    egal([], migrer_schema($vieux), 'une troisième fois non plus');
    egal('{"version":1}', (string)$vieux->query('SELECT donnees FROM progressions')->fetchColumn(),
        'et les données n’ont toujours pas bougé');
});

// ------------------------------------------- audit du 30/08/2026 — lot S2
//
// Comptes professeurs (changer, réinitialiser, désactiver), en-têtes de
// sécurité et politique de contenu à nonce, moteur de Défi tables servi d'ici.

function entete(array $reponse, string $nom): ?string
{
    if (preg_match('/^' . preg_quote($nom, '/') . ':\s*(.*?)\r?$/mi', $reponse['entetes'], $m)) return trim($m[1]);
    return null;
}

function page(string $chemin): array
{
    return appel($chemin, null);
}

function connexion(string $identifiant, string $motdepasse): array
{
    return appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => $identifiant, 'motdepasse' => $motdepasse]);
}

verifier("les en-têtes de sécurité sortent sur chaque réponse de l'API, réussie ou non", function () use (&$codesA2) {
    vider_compteurs();
    foreach ([
        'lecture 200' => lire($codesA2[0]['code']),
        'GET refusé 405' => appel('/api/parcours.php', null),
        'prof sans jeton 401' => appel('/api/prof.php', ['action' => 'moi']),
        'code inconnu 404' => identite(code_inconnu(0)),
    ] as $quoi => $r) {
        egal('nosniff', entete($r, 'X-Content-Type-Options'), "$quoi : nosniff");
        egal('strict-origin-when-cross-origin', entete($r, 'Referrer-Policy'), "$quoi : Referrer-Policy");
        egal('DENY', entete($r, 'X-Frame-Options'), "$quoi : X-Frame-Options");
        egal('max-age=31536000', entete($r, 'Strict-Transport-Security'), "$quoi : HSTS");
        vrai(substr_count($r['entetes'], 'X-Frame-Options') === 1, "$quoi : un seul X-Frame-Options, pas deux");
    }
});

verifier("l'espace élève, la page Infos et Ma classe envoient une politique de contenu à nonce, posé sur leur script", function () {
    // Serveur pro, lot 8 (31/10/2026) : l'espace élève a un second script en
    // ligne, tout en haut de <head> (« avant-tout » : l'élève qui revient ne
    // voit plus passer l'écran du code). Il porte le même nonce.
    // Lot « cours-appli » (08/11/2026) : Ma classe a un second bloc, de
    // DONNÉES (le catalogue du livret, <script type="application/json">), qui
    // porte le même nonce.
    foreach (['/' => 2, '/prof/' => 2, '/infos.php' => 0] as $chemin => $scriptsEnLigne) {
        $r = page($chemin);
        egal(200, $r['code'], "$chemin");
        $csp = entete($r, 'Content-Security-Policy');
        vrai($csp !== null, "$chemin : Content-Security-Policy présente");
        vrai((bool)preg_match("/script-src 'self' 'nonce-([A-Za-z0-9+\/=]+)'/", $csp, $m), "$chemin : script-src 'self' + nonce ($csp)");
        $nonce = $m[1];
        // Serveur pro, lot 5f : « Ma classe » montre l'écran Mon parcours
        // d'un élève (mathsgo.re) dans un cadre — frame-src, et rien d'autre ;
        // aucune autre page ne montre de cadre (default-src 'self').
        $cadres = $chemin === '/prof/' ? "; frame-src https://mathsgo.re" : '';
        egal($cadres, (string)strstr($csp, '; frame-src'), "$chemin : frame-src en dernier, mathsgo.re pour Ma classe seule");
        vrai(!str_contains(str_replace($cadres, '', $csp), 'mathsgo.re'), "$chemin : plus aucun domaine extérieur dans la politique de contenu (hors le cadre du parcours)");
        vrai(str_contains($csp, "img-src 'self' data:"), "$chemin : les images ne viennent plus que d'ici (lot 7)");
        egal('no-store', entete($r, 'Cache-Control'), "$chemin : Cache-Control no-store");
        vrai(str_contains($csp, "connect-src 'self'") && str_contains($csp, "frame-ancestors 'none'") && str_contains($csp, "object-src 'none'"), "$chemin : connect-src, frame-ancestors, object-src");
        preg_match_all('/<script(?![^>]*\bsrc=)[^>]*>/', $r['texte'], $balises);
        egal($scriptsEnLigne, count($balises[0]), "$chemin : scripts en ligne");
        foreach ($balises[0] as $balise) {
            vrai(str_contains($balise, 'nonce="' . $nonce . '"'), "$chemin : $balise porte le nonce de l'en-tête");
        }
        vrai(!preg_match('/\son[a-z]+="/i', $r['texte']), "$chemin : aucun attribut on…=");
        egal('DENY', entete($r, 'X-Frame-Options'), "$chemin : X-Frame-Options");
        egal('max-age=31536000', entete($r, 'Strict-Transport-Security'), "$chemin : HSTS");
        // Deux requêtes, deux nonces : un nonce deviné ne sert pas deux fois.
        $csp2 = entete(page($chemin), 'Content-Security-Policy');
        vrai($csp2 !== $csp, "$chemin : le nonce change à chaque requête");
    }
});

// Lot 7 (03/09/2026) — le logo et les icônes sont servis d'ici, octet pour
// octet ceux du dépôt : mathsgo.re n'apprend plus l'adresse IP et l'horaire de
// chaque ouverture de l'espace des professeurs.
verifier("le logo et les icônes sont servis d'ici, identiques à ceux du dépôt", function () use ($racine) {
    $depot = dirname($racine);
    $attendus = [
        'mathsgo-logo.png' => '/assets/img/mathsgo-logo-390.png',
        'mathsgo-logo-print.png' => '/assets/img/mathsgo-logo-print.png',
        'apple-touch-icon.png' => '/assets/img/apple-touch-icon.png',
        'favicon.svg' => '/favicon.svg',
        'favicon.ico' => '/favicon.ico',
    ];
    foreach ($attendus as $servi => $source) {
        $r = page('/' . $servi);
        egal(200, $r['code'], "/$servi servi");
        vrai(strlen($r['texte']) > 0, "/$servi n'est pas vide");
        if (is_file($depot . $source)) {
            egal(md5_file($depot . $source), md5($r['texte']),
                "/$servi est octet pour octet $source (sinon : cp $depot$source _serveur/public/$servi)");
        }
    }
    foreach (['/' => 'espace élève', '/prof/' => 'Ma classe'] as $chemin => $quoi) {
        $texte = page($chemin)['texte'];
        vrai(!str_contains($texte, 'https://mathsgo.re/assets/img/'), "$quoi : plus d'image de mathsgo.re");
        vrai(!str_contains($texte, 'https://mathsgo.re/favicon'), "$quoi : plus de favicon de mathsgo.re");
    }
});

// Lot E « Arriver » (21/11/2026) — l'icône de l'écran d'accueil : le manifeste
// et ses trois images sont servis d'ici, et Mon espace (seulement) les annonce.
verifier("arriver-E — le manifeste de l'icône et ses images sont servis ; Mon espace l'annonce, Ma classe non", function () {
    $m = page('/app.webmanifest');
    egal(200, $m['code'], '/app.webmanifest servi');
    $json = json_decode($m['texte'], true);
    vrai(is_array($json), 'le manifeste est du JSON');
    egal('maths&go', $json['short_name'] ?? null, 'nom court');
    egal('browser', $json['display'] ?? null, 'ouvert dans le navigateur');
    foreach ($json['icons'] ?? [] as $icone) {
        $r = page('/' . $icone['src']);
        egal(200, $r['code'], "/{$icone['src']} servi");
        egal("\x89PNG", substr($r['texte'], 0, 4), "/{$icone['src']} est un PNG");
    }
    egal(3, count($json['icons'] ?? []), 'trois images');
    $eleve = page('/')['texte'];
    vrai(str_contains($eleve, '<link rel="manifest" href="app.webmanifest">'), 'Mon espace annonce le manifeste');
    vrai(str_contains($eleve, '<meta name="apple-mobile-web-app-title" content="maths&amp;go">'), "le nom sous l'icône de l'iPhone");
    vrai(!str_contains(page('/prof/')['texte'], 'rel="manifest"'), "Ma classe n'a pas de manifeste");
});

verifier("Ma classe charge le moteur de Défi tables d'ici, identique à celui du dépôt, avec une version qui suit son contenu", function () use ($racine) {
    $r = page('/prof/');
    vrai(!preg_match('/<script[^>]*src="https?:/', $r['texte']), "plus aucun script chargé depuis un autre domaine");
    vrai((bool)preg_match('/<script src="defi_tables_mon_parcours\.js\?v=([0-9a-f]{10})"><\/script>/', $r['texte'], $m), 'le moteur est relatif, avec une version');
    $moteur = page('/prof/defi_tables_mon_parcours.js');
    egal(200, $moteur['code'], 'le moteur est servi');
    vrai(str_contains($moteur['texte'], 'MATHSGO_DEFI_TABLES_MON_PARCOURS'), "c'est bien le moteur");
    egal(substr(md5($moteur['texte']), 0, 10), $m[1], 'la version dans l’adresse est l’empreinte du fichier servi');
    $original = dirname($racine) . '/outils/calcul_mental/defi_tables_mon_parcours.js';
    if (is_file($original)) {
        egal(md5_file($original), md5($moteur['texte']), 'octet pour octet le fichier de l’appli (sinon : cp outils/calcul_mental/defi_tables_mon_parcours.js _serveur/public/prof/)');
    }
    vrai(str_contains($r['texte'], 'indicateur pédagogique, pas une preuve'), 'la ligne sous le tableau est là');
    // Lot E1 (15/10/2026) : le NOYAU aussi, pour refaire le tirage d'une évaluation.
    vrai((bool)preg_match('/<script src="defi_tables_core\.js\?v=([0-9a-f]{10})"><\/script>/', $r['texte'], $c), 'le noyau est relatif, avec une version');
    $noyau = page('/prof/defi_tables_core.js');
    egal(200, $noyau['code'], 'le noyau est servi');
    vrai(str_contains($noyau['texte'], 'genererEvaluationDeClasse'), "c'est bien le noyau, avec le générateur d'évaluation");
    egal(substr(md5($noyau['texte']), 0, 10), $c[1], 'la version du noyau est l’empreinte du fichier servi');
    $originalNoyau = dirname($racine) . '/outils/calcul_mental/defi_tables_core.js';
    if (is_file($originalNoyau)) {
        egal(md5_file($originalNoyau), md5($noyau['texte']), 'octet pour octet le noyau de l’appli (sinon : cp outils/calcul_mental/defi_tables_core.js _serveur/public/prof/)');
    }
});

verifier("verifier.php contrôle le moteur local et compte les comptes désactivés", function () {
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'Moteur de Défi tables servi localement'), 'la ligne existe');
    vrai(str_contains($r['texte'], 'en place ('), 'et elle est verte');
    vrai(str_contains($r['texte'], '0 désactivé(s)'), 'les comptes désactivés sont comptés');
});

// ---------------------------------------------------------- changer son mot de passe

$jetonClaire2 = null;

verifier("changer son mot de passe : l'ancien doit être le bon, le nouveau long et différent", function () use (&$jetonClaire) {
    vider_compteurs();
    $mauvais = appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'pas-le-bon-du-tout', 'nouveau' => 'un-nouveau-mot-de-passe-2026'], ['jeton' => $jetonClaire]);
    egal(400, $mauvais['code'], 'ancien incorrect');
    vrai(str_contains($mauvais['json']['erreur'], 'ancien'), 'le message le dit');
    egal(400, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'mdp-collegue-2026-secret', 'nouveau' => 'court'], ['jeton' => $jetonClaire])['code'], 'trop court');
    egal(400, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'mdp-collegue-2026-secret', 'nouveau' => 'mdp-collegue-2026-secret'], ['jeton' => $jetonClaire])['code'], 'identique à l’ancien');
    egal(200, connexion('claire', 'mdp-collegue-2026-secret')['code'], 'rien n’a changé : l’ancien mot de passe marche encore');
});

verifier("les règles du mot de passe : la longueur, pas la composition ; ni chiffres seuls, ni l'identifiant dedans", function () use (&$jetonClaire) {
    $essai = fn(string $nouveau) => appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'mdp-collegue-2026-secret', 'nouveau' => $nouveau], ['jeton' => $jetonClaire]);
    $r = $essai('199012251980');
    egal(400, $r['code'], 'douze chiffres (une date) : refusé');
    vrai(str_contains($r['json']['erreur'], 'chiffres'), 'le message le dit');
    $r = $essai('Claire-au-college-2026');
    egal(400, $r['code'], 'contient l’identifiant (même en majuscule) : refusé');
    vrai(str_contains($r['json']['erreur'], 'identifiant'), 'le message le dit');
    egal(400, $essai('onze-lettre')['code'], 'onze caractères : refusé');
    // Rien d'autre n'est imposé : une phrase en minuscules avec des espaces passe.
    egal(200, $essai('les tables de sept en chantant')['code'], 'une phrase longue en minuscules passe');
    egal(200, connexion('claire', 'les tables de sept en chantant')['code'], 'et ouvre une session');
    // Retour au mot de passe des tests suivants.
    egal(200, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'les tables de sept en chantant', 'nouveau' => 'mdp-collegue-2026-secret'], ['jeton' => $jetonClaire])['code'], 'retour');
    // installer.php applique les mêmes règles au premier compte.
    require_once dirname(__DIR__) . '/public/lib/auth.php';
    vrai(motdepasse_refuse('123456789012', 'gwenael') !== null, 'chiffres seuls (installateur)');
    vrai(motdepasse_refuse('gwenael-est-la-2026', 'gwenael') !== null, 'identifiant dedans (installateur)');
    egal(null, motdepasse_refuse('douze lettres', 'gwenael'), 'douze caractères simples : accepté');
    egal(null, motdepasse_refuse('ab-est-dedans-mais-court', 'ab'), 'un identifiant de deux lettres ne compte pas');
});

verifier("changer son mot de passe ferme les AUTRES sessions, garde celle-ci, et l'ancien mot de passe ne marche plus", function () use (&$jetonClaire, &$jetonClaire2) {
    vider_compteurs();
    $jetonClaire2 = connexion('claire', 'mdp-collegue-2026-secret')['json']['jeton'];
    egal(200, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire2])['code'], 'deuxième appareil connecté');
    $r = appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'mdp-collegue-2026-secret', 'nouveau' => 'nouveau-mdp-collegue-2026'], ['jeton' => $jetonClaire]);
    egal(200, $r['code'], 'changement');
    egal(401, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire2])['code'], 'l’autre appareil est déconnecté');
    egal(200, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire])['code'], 'celui qui a changé reste connecté');
    egal(401, connexion('claire', 'mdp-collegue-2026-secret')['code'], 'l’ancien mot de passe est refusé');
    $r = connexion('claire', 'nouveau-mdp-collegue-2026');
    egal(200, $r['code'], 'le nouveau passe');
    egal(false, $r['json']['mdp_temporaire'], 'et il n’est pas temporaire');
    // Le hachage en base est un bcrypt au coût des comptes, pas un mot de passe en clair.
    $hash = bd_test()->query("SELECT mdp_hash FROM profs WHERE identifiant = 'claire'")->fetchColumn();
    vrai(str_starts_with((string)$hash, '$2y$10$'), 'bcrypt coût 10 en base');
});

verifier("douze essais d'ancien mot de passe par compte, puis 429 : une session volée ne devine pas l'ancien", function () use (&$jetonClaire) {
    vider_compteurs();
    $statuts = [];
    for ($i = 0; $i < 13; $i++) {
        $r = appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => "essai-$i", 'nouveau' => 'un-nouveau-mot-de-passe-2026'], ['jeton' => $jetonClaire]);
        $statuts[] = $r['code'];
    }
    egal(12, count(array_keys($statuts, 400, true)), 'douze refus ordinaires');
    egal(429, $statuts[12], 'le treizième est freiné');
    $attente = entete($r, 'Retry-After');
    vrai($attente !== null && ctype_digit($attente) && (int)$attente <= 600, 'le 429 porte Retry-After, en secondes (obtenu ' . json_encode($attente) . ')');
    vider_compteurs();
    egal(200, connexion('claire', 'nouveau-mdp-collegue-2026')['code'], 'le mot de passe n’a pas bougé');
});

// --------------------------------------------- réinitialisation par l'administrateur

$claireId = null;
$temporaire = null;

verifier("réinitialiser : administrateur seulement, jamais sur soi-même, compte existant", function () use (&$jetonS1, &$jetonClaire, &$claireId) {
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $p) {
        if ($p['identifiant'] === 'claire') $claireId = $p['id'];
        if ($p['identifiant'] === 'gwenael') $moi = $p['id'];
    }
    vrai($claireId !== null, 'Claire est dans la liste');
    egal(403, appel('/api/prof.php', ['action' => 'profs.reinitialiser', 'prof_id' => $moi], ['jeton' => $jetonClaire])['code'], 'Claire n’est pas administratrice');
    egal(400, appel('/api/prof.php', ['action' => 'profs.reinitialiser', 'prof_id' => $moi], ['jeton' => $jetonS1])['code'], 'pas sur son propre compte');
    egal(404, appel('/api/prof.php', ['action' => 'profs.reinitialiser', 'prof_id' => 999999], ['jeton' => $jetonS1])['code'], 'compte inconnu');
    egal(200, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire])['code'], 'rien n’a été fait : Claire est toujours connectée');
});

verifier("réinitialiser donne un mot de passe temporaire lisible, ferme ses sessions, et la liste le dit", function () use (&$jetonS1, &$jetonClaire, &$claireId, &$temporaire) {
    $r = appel('/api/prof.php', ['action' => 'profs.reinitialiser', 'prof_id' => $claireId], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'réinitialisation');
    $temporaire = $r['json']['motdepasse'] ?? '';
    vrai((bool)preg_match('/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/', $temporaire), "trois groupes de quatre ($temporaire)");
    vrai(!preg_match('/[lo01i]/', $temporaire), 'sans l, o, i, 0, 1 (confondus à l’oral)');
    egal(401, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire])['code'], 'sa session est fermée');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM sessions_prof WHERE prof_id = $claireId")->fetchColumn(), 'toutes ses sessions sont supprimées');
    $claire = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $p) if ($p['id'] === $claireId) $claire = $p;
    egal(true, $claire['mdp_temporaire'], 'la liste montre « mot de passe temporaire »');
    egal(true, $claire['actif'], 'le compte reste actif');
    $hash = bd_test()->query("SELECT mdp_hash FROM profs WHERE identifiant = 'claire'")->fetchColumn();
    vrai(!str_contains((string)$hash, $temporaire), 'le temporaire n’est pas en clair en base');
});

verifier("avec un mot de passe temporaire : connexion possible, mais rien d'autre que le changer", function () use (&$jetonClaire, &$temporaire, &$classeDeClaire) {
    vider_compteurs();
    egal(401, connexion('claire', 'nouveau-mdp-collegue-2026')['code'], 'l’ancien mot de passe ne marche plus');
    $r = connexion('claire', $temporaire);
    egal(200, $r['code'], 'le temporaire ouvre une session');
    egal(true, $r['json']['mdp_temporaire'], 'et la réponse dit qu’il est temporaire');
    $jetonClaire = $r['json']['jeton'];
    egal(true, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire])['json']['mdp_temporaire'], '« moi » le dit aussi');
    $refus = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire]);
    egal(403, $refus['code'], 'ses classes ne sont pas accessibles');
    vrai(str_contains($refus['json']['erreur'], 'mot de passe'), 'le message dit pourquoi');
    egal(403, appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeDeClaire], ['jeton' => $jetonClaire])['code'], 'ni le tableau');
    egal(403, appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'x'], ['jeton' => $jetonClaire])['code'], 'ni créer');
    // Le changement passe, et lève la contrainte.
    egal(200, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $temporaire, 'nouveau' => 'mdp-collegue-definitif-2026'], ['jeton' => $jetonClaire])['code'], 'changement');
    egal(false, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire])['json']['mdp_temporaire'], 'plus temporaire');
    egal(200, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire])['code'], 'ses classes reviennent');
    egal(401, connexion('claire', $temporaire)['code'], 'le temporaire ne marche plus');
    egal(200, connexion('claire', 'mdp-collegue-definitif-2026')['code'], 'le définitif oui');
});

// ------------------------------------------------------------- désactiver un compte

verifier("désactiver : administrateur seulement, jamais soi-même", function () use (&$jetonS1, &$jetonClaire, &$claireId) {
    $moi = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $p) if ($p['identifiant'] === 'gwenael') $moi = $p['id'];
    egal(403, appel('/api/prof.php', ['action' => 'profs.desactiver', 'prof_id' => $moi], ['jeton' => $jetonClaire])['code'], 'Claire ne peut pas');
    egal(400, appel('/api/prof.php', ['action' => 'profs.desactiver', 'prof_id' => $moi], ['jeton' => $jetonS1])['code'], 'pas soi-même : l’administrateur unique resterait dehors');
    egal(404, appel('/api/prof.php', ['action' => 'profs.desactiver', 'prof_id' => 999999], ['jeton' => $jetonS1])['code'], 'compte inconnu');
});

verifier("désactiver ferme ses sessions et refuse la connexion avec le MÊME message qu'un mauvais mot de passe", function () use (&$jetonS1, &$jetonClaire, &$claireId, &$classeDeClaire) {
    vider_compteurs();
    $classesAvant = (int)bd_test()->query('SELECT COUNT(*) FROM classes')->fetchColumn();
    $mienneAvant = count(appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes']);
    egal(200, appel('/api/prof.php', ['action' => 'profs.desactiver', 'prof_id' => $claireId], ['jeton' => $jetonS1])['code'], 'désactivation');
    egal(401, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire])['code'], 'sa session est fermée');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM sessions_prof WHERE prof_id = $claireId")->fetchColumn(), 'et supprimée de la base, pas seulement refusée');
    $refusDesactive = connexion('claire', 'mdp-collegue-definitif-2026');
    $refusMauvais = connexion('claire', 'un-mauvais-mot-de-passe');
    $refusInconnu = connexion('personne', 'un-mauvais-mot-de-passe');
    egal(401, $refusDesactive['code'], 'connexion refusée');
    egal($refusMauvais['json'], $refusDesactive['json'], 'réponse identique à un mauvais mot de passe');
    egal($refusInconnu['json'], $refusDesactive['json'], 'et à un identifiant inconnu');
    // Ses classes restent en base, invisibles pour les autres : rien ne change pour eux.
    egal($classesAvant, (int)bd_test()->query('SELECT COUNT(*) FROM classes')->fetchColumn(), 'aucune classe supprimée');
    egal($mienneAvant, count(appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes']), 'Gwenaël ne voit pas plus de classes qu’avant');
    egal(404, appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classeDeClaire], ['jeton' => $jetonS1])['code'], 'la classe de Claire lui reste introuvable');
    // La liste le dit, l'annuaire de partage ne la propose plus, et partager avec elle est refusé.
    $claire = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $p) if ($p['id'] === $claireId) $claire = $p;
    egal(false, $claire['actif'], 'la liste montre « désactivé »');
    $annuaire = array_column(appel('/api/prof.php', ['action' => 'profs.annuaire'], ['jeton' => $jetonS1])['json']['profs'], 'id');
    vrai(!in_array($claireId, $annuaire, true), 'absente de l’annuaire');
    $mienne = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes'][0]['id'];
    egal(404, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $mienne, 'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jetonS1])['code'], 'on ne partage pas avec un compte désactivé');
    // Un temps de refus comparable : le hachage est calculé avant de regarder
    // « actif » (lib/auth.php). Que le code le fasse bien dans cet ordre est
    // vérifié à chaque pull request, sans chronomètre, par
    // tests/suivi-temps-constant.test.mjs. Ici, on MESURE — et une mesure ne
    // vaut que sur une machine tranquille : voir mediane_ms() plus haut.
    if (mesures_de_temps_demandees()) {
        vider_compteurs();
        $tDesactive = mediane_ms(fn() => connexion('claire', 'mdp-collegue-definitif-2026'));
        $tMauvais = mediane_ms(fn() => connexion('gwenael', 'un-mauvais-mot-de-passe'));
        echo sprintf("       (refus, médiane de 5 : compte désactivé %.0f ms, mauvais mot de passe %.0f ms)\n", $tDesactive, $tMauvais);
        // Seuil à SENS UNIQUE. Ce qu'on protège, c'est le secret de « ce compte
        // existe encore » : le refus d'un compte DÉSACTIVÉ ne doit pas être plus
        // RAPIDE, sinon on le devine au chronomètre. Qu'il soit plus LENT
        // n'apprend rien à personne — et c'est justement ce que le bruit d'une
        // machine partagée fabrique. L'ancien seuil bornait les deux côtés : il
        // demandait à un serveur partagé d'être régulier, et il rougissait au
        // hasard (221 ms contre 67, puis 58 contre 169, puis vert sans qu'une
        // ligne ait changé).
        vrai($tDesactive >= $tMauvais / 2,
            sprintf("le refus d'un compte désactivé (%.0f ms) ne doit pas être plus de deux fois plus "
                . "rapide que celui d'un mauvais mot de passe (%.0f ms) : la différence dirait qu'il existe",
                $tDesactive, $tMauvais));
        vider_compteurs();
    }
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], '1 désactivé(s)'), 'verifier.php compte le compte désactivé');
});

verifier("réactiver : la connexion et ses classes reviennent, ses partages aussi", function () use (&$jetonS1, &$jetonClaire, &$claireId, &$classeDeClaire) {
    vider_compteurs();
    egal(401, appel('/api/prof.php', ['action' => 'profs.reactiver', 'prof_id' => $claireId], ['jeton' => str_repeat('a', 64)])['code'], 'sans session : refusé');
    egal(200, appel('/api/prof.php', ['action' => 'profs.reactiver', 'prof_id' => $claireId], ['jeton' => $jetonS1])['code'], 'réactivation');
    $r = connexion('claire', 'mdp-collegue-definitif-2026');
    egal(200, $r['code'], 'elle se reconnecte avec son mot de passe');
    $jetonClaire = $r['json']['jeton'];
    $siennes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire])['json']['classes'];
    vrai(in_array($classeDeClaire, array_column($siennes, 'id'), true), 'sa classe est toujours là');
    vrai(count(array_filter($siennes, fn($c) => $c['droit'] !== 'proprietaire')) >= 1, 'et la classe partagée en lecture (lot A2) aussi');
    $annuaire = array_column(appel('/api/prof.php', ['action' => 'profs.annuaire'], ['jeton' => $jetonS1])['json']['profs'], 'id');
    vrai(in_array($claireId, $annuaire, true), 'de retour dans l’annuaire');
});

// ============================================== lot limiteur (07/09/2026)
//
// La fenêtre du limiteur est désormais ouverte par la PREMIÈRE tentative
// comptée. Elle l'était par l'horloge — « (intdiv(time(), $secondes) + 1) *
// $secondes » —, ce qui découpait le temps en tranches communes à tout le monde
// et remettait le compteur à 1 au passage de chacune.
//
// Ces frontières se calculent de l'extérieur : elles ne dépendent d'aucun
// secret. Il suffisait d'y coller sa rafale pour en obtenir deux — douze essais
// juste avant, douze juste après, en une seconde, sans un seul refus. Le débit
// réel de tous ces freins valait le double de ce qu'ils annonçaient.
//
// C'est aussi ce qui rendait rouges, au hasard, « soixante et un codes
// inventés », « douze essais d'ancien mot de passe » et « lot 11 —
// verifier.php » : leurs tentatives enjambaient une frontière, et le compte du
// serveur repartait au milieu.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) revenir à « CASE WHEN fenetre = excluded.fenetre » dans compter()
//     -> « la rafale ne passe pas deux fois », par le compteur semé
//  b) recalculer Retry-After depuis l'horloge plutôt que depuis la ligne
//     -> « le Retry-After dit le temps qui reste sur SA fenêtre »
//  c) ne corriger qu'un seul des deux chemins SQL (SQLite ou MySQL)
//     -> les mêmes tests, mais sur le moteur laissé en arrière SEULEMENT

verifier("lot limiteur — la fenêtre part de la première tentative, pas de l'horloge", function () {
    vider_compteurs();
    // Une connexion ratée sur un identifiant qui n'existe pas : elle compte,
    // et ouvre la fenêtre de « connexion-id: ».
    $identifiant = 'personne-du-lot-limiteur';
    $avant = time();
    egal(401, connexion($identifiant, 'un-mauvais-mot-de-passe')['code'], 'la tentative est refusée');
    $apres = time();

    $requete = bd_test()->prepare('SELECT fenetre, nombre FROM compteurs WHERE cle = ?');
    $requete->execute([cle_compteur_test('connexion-id:' . $identifiant, 600)]);
    $ligne = $requete->fetch();
    $requete->closeCursor();   // sans quoi SQLite garde un verrou de lecture
    vrai($ligne !== false, 'la tentative a ouvert une fenêtre');
    egal(1, (int)$ligne['nombre'], 'et elle compte pour une');

    $fin = (int)$ligne['fenetre'];
    vrai($fin >= $avant + 600 && $fin <= $apres + 600,
        sprintf('la fenêtre se ferme 600 s après la PREMIÈRE tentative (fin %d, attendue entre %d et %d)',
            $fin, $avant + 600, $apres + 600));
    // Et la preuve que l'horloge n'y est plus pour rien : une fin alignée
    // serait un multiple exact de la durée. Celle-ci n'en est un que si la
    // tentative est tombée pile sur une seconde ronde — une sur six cents, et
    // le test le dit alors au lieu de rougir.
    if ($avant % 600 !== 0 && $apres % 600 !== 0) {
        vrai($fin % 600 !== 0,
            "la fin de fenêtre ne doit plus être un multiple de la durée : ce serait l'ancien "
            . "alignement sur l'horloge (fin $fin)");
    } else {
        echo "       (tentative tombée sur une seconde ronde : l'alignement n'est pas distinguable cette fois)\n";
    }
    vider_compteurs();
});

verifier("lot limiteur — la rafale à cheval sur une frontière d'horloge ne passe pas deux fois", function () use (&$jetonClaire, &$claireId) {
    vider_compteurs();
    // Vingt-quatre essais d'ancien mot de passe d'affilée, sur un seuil de
    // douze par dix minutes. Douze passent, douze sont refusés — quelle que
    // soit l'heure qu'il est. Du temps de l'alignement, une rafale calée sur
    // une frontière en faisait passer vingt-quatre.
    $passes = 0;
    $refuses = 0;
    for ($i = 0; $i < 24; $i++) {
        $r = appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => "rafale-$i",
            'nouveau' => 'un-nouveau-mot-de-passe-2026'], ['jeton' => $jetonClaire]);
        $r['code'] === 429 ? $refuses++ : $passes++;
    }
    egal(12, $passes, 'douze essais passent : le seuil annoncé, pas le double');
    egal(12, $refuses, 'les douze suivants sont refusés, frontière d’horloge ou pas');

    // Ce qui précède ne distingue les deux limiteurs que si une frontière tombe
    // pendant la rafale — une fois sur trois cents. Voici la même chose, à coup
    // sûr : un compteur PLEIN dont la fenêtre ne tombe pas sur un multiple de
    // dix minutes. L'ancien code comparait la fenêtre de la ligne à celle de
    // l'horloge ; les trouvant différentes, il remettait le compte à 1 et
    // laissait passer. Le nouveau regarde si elle est encore ouverte.
    vider_compteurs();
    semer_compteur('motdepasse:' . $claireId, 600, 12);
    $requete = bd_test()->prepare('SELECT fenetre FROM compteurs WHERE cle = ?');
    $requete->execute([cle_compteur_test('motdepasse:' . $claireId, 600)]);
    $fin = (int)$requete->fetchColumn();
    $requete->closeCursor();   // sans quoi l'écriture du serveur attendrait ce curseur
    if ($fin % 600 === 0) {          // une seconde sur six cents : on décale
        sleep(1);
        semer_compteur('motdepasse:' . $claireId, 600, 12);
    }
    $r = appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'peu-importe',
        'nouveau' => 'un-nouveau-mot-de-passe-2026'], ['jeton' => $jetonClaire]);
    egal(429, $r['code'],
        'un compteur plein refuse, même si sa fenêtre ne tombe pas sur un multiple de dix minutes');
    vider_compteurs();
});

verifier("lot limiteur — le Retry-After dit le temps qui reste sur SA fenêtre", function () use (&$jetonClaire, &$claireId) {
    vider_compteurs();
    // Une fenêtre pleine qui vient de s'ouvrir : il doit rester près de dix
    // minutes. L'ancien Retry-After lisait l'horloge et pouvait annoncer une
    // seconde là où il en restait six cents — ou l'inverse.
    semer_compteur('motdepasse:' . $claireId, 600, 12);
    $requete = bd_test()->prepare('SELECT fenetre FROM compteurs WHERE cle = ?');
    $requete->execute([cle_compteur_test('motdepasse:' . $claireId, 600)]);
    $fin = (int)$requete->fetchColumn();
    $requete->closeCursor();   // idem : le serveur va écrire, il lui faut le verrou

    $r = appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'peu-importe',
        'nouveau' => 'un-nouveau-mot-de-passe-2026'], ['jeton' => $jetonClaire]);
    egal(429, $r['code'], 'refusé');
    $attente = entete($r, 'Retry-After');
    vrai($attente !== null && ctype_digit((string)$attente), "le 429 porte un Retry-After en secondes (obtenu " . json_encode($attente) . ')');
    $reste = $fin - time();
    vrai(abs((int)$attente - $reste) <= 2,
        sprintf('Retry-After (%s s) doit dire le temps qui reste sur la fenêtre de la ligne (%d s)', $attente, $reste));
    vrai((int)$attente > 500,
        sprintf('une fenêtre qui vient de s’ouvrir laisse près de dix minutes, pas %s s : '
            . "c'est l'horloge qui serait lue, pas la ligne", $attente));
    vider_compteurs();
});

verifier("un compte désactivé pendant qu'une session est ouverte est refusé au premier appel suivant", function () use (&$jetonS1, &$jetonClaire, &$claireId) {
    // Deuxième ceinture : même si une session survivait à la désactivation
    // (elle ne le fait pas), prof_courant() la refuse.
    bd_test()->exec("UPDATE profs SET actif = 0 WHERE id = $claireId");
    egal(401, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire])['code'], 'session refusée');
    bd_test()->exec("UPDATE profs SET actif = 1 WHERE id = $claireId");
    $jetonClaire = connexion('claire', 'mdp-collegue-definitif-2026')['json']['jeton'];
    egal(200, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonClaire])['code'], 'reconnectée');
});

// ------------------------------------------------------------- supprimer un compte

verifier("supprimer un compte : administrateur seulement, jamais soi-même ; sans classes, tout part proprement", function () use (&$jetonS1, &$jetonClaire) {
    vider_compteurs();
    $cree = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'essai'], ['jeton' => $jetonS1])['json'];
    $essaiId = (int)$cree['id'];
    $sessionEssai = connexion('essai', $cree['motdepasse'])['json']['jeton'];
    $moi = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $p) if ($p['identifiant'] === 'gwenael') $moi = $p['id'];
    egal(403, appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => $essaiId], ['jeton' => $jetonClaire])['code'], 'Claire ne peut pas');
    egal(400, appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => $moi], ['jeton' => $jetonS1])['code'], 'pas soi-même');
    egal(404, appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => 999999], ['jeton' => $jetonS1])['code'], 'compte inconnu');
    $r = appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => $essaiId], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'suppression');
    egal(0, $r['json']['classes'], 'aucune classe emportée');
    egal(401, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $sessionEssai])['code'], 'sa session est morte');
    egal(401, connexion('essai', $cree['motdepasse'])['code'], 'il ne se connecte plus');
    $reste = array_column(appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'], 'identifiant');
    vrai(!in_array('essai', $reste, true), 'disparu de la liste');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM sessions_prof WHERE prof_id = $essaiId")->fetchColumn(), 'plus de session en base');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM profs WHERE identifiant = 'essai'")->fetchColumn(), 'plus de compte en base');
    // L'identifiant redevient libre.
    egal(200, appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'essai'], ['jeton' => $jetonS1])['code'], 'recréable');
});

verifier("supprimer un compte qui possède des classes exige un oui explicite, puis emporte tout, sans orphelin", function () use (&$jetonS1, &$jetonClaire) {
    vider_compteurs();
    // Un professeur avec deux classes, quatre élèves, une progression, un partage reçu et un partage donné.
    $r = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'partant'], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'création du partant (' . $r['texte'] . ')');
    $cree = $r['json'];
    $partantId = (int)$cree['id'];
    $jp = connexion('partant', $cree['motdepasse'])['json']['jeton'];
    appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $cree['motdepasse'], 'nouveau' => 'le-mdp-du-collegue-qui-sen-va'], ['jeton' => $jp]);
    $c1 = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'P1'], ['jeton' => $jp])['json']['id'];
    $c2 = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'P2'], ['jeton' => $jp])['json']['id'];
    $e1 = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $c1, 'nombre' => 3], ['jeton' => $jp])['json']['eleves'];
    appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $c2, 'nombre' => 1], ['jeton' => $jp]);
    egal(200, ecrire($e1[0]['code'], ['version' => VERSION_TABLES, 'tables' => ['2' => ['acquise' => '2026-09-01']]], 0)['code'], 'une progression');
    $claireId = null; $moi = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $p) {
        if ($p['identifiant'] === 'claire') $claireId = $p['id'];
        if ($p['identifiant'] === 'gwenael') $moi = $p['id'];
    }
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $c1, 'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jp]);
    $mienne = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes'][0]['id'];
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $mienne, 'prof_id' => $partantId, 'droit' => 'lecture'], ['jeton' => $jetonS1]);
    $liste = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $p) if ($p['id'] === $partantId) $liste = $p;
    egal(2, $liste['classes'], 'la liste compte ses classes');
    egal(4, $liste['eleves'], 'et ses élèves');
    egal(1, $liste['partagees'], 'et ce qu’il a reçu');

    $r = appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => $partantId], ['jeton' => $jetonS1]);
    egal(409, $r['code'], 'sans oui explicite : refusé');
    vrai(str_contains($r['json']['erreur'], '2 classe') && str_contains($r['json']['erreur'], '4 élève'), 'le refus dit ce qui partirait');
    egal(200, lire($e1[0]['code'])['code'], 'rien n’a bougé');

    // F06 (lot « petits correctifs de sécurité », 11/11/2026) : un billet de
    // fiche pris par le partant sur la classe qu'on lui partage tombe avec son
    // compte.
    $eleveMien = (int)bd_test()->query("SELECT id FROM eleves WHERE classe_id = $mienne ORDER BY id LIMIT 1")->fetchColumn();
    vrai($eleveMien > 0, 'un élève dans la classe partagée au partant');
    $billetPartant = (string)(appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $eleveMien], ['jeton' => $jp])['json']['billet'] ?? '');
    vrai($billetPartant !== '', 'le partant a pris un billet de fiche');

    $avantEleves = (int)bd_test()->query('SELECT COUNT(*) FROM eleves')->fetchColumn();
    $r = appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => $partantId, 'avec_classes' => true], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'avec le oui : supprimé');
    egal(['classes' => 2, 'eleves' => 4], ['classes' => $r['json']['classes'], 'eleves' => $r['json']['eleves']], 'la réponse dit ce qui est parti');
    // Le compteur du code est purgé avec lui — regardé AVANT la lecture qui suit
    // (elle en recréerait un : le limiteur compte avant de savoir si le code existe).
    $compteur = bd_test()->prepare('SELECT COUNT(*) FROM compteurs WHERE cle = ?');
    $compteur->execute([cle_compteur_test('code:' . $e1[0]['code'], 300)]);
    $restants = (int)$compteur->fetchColumn();
    $compteur->closeCursor(); // sinon le processus de test garde un verrou SQLite et le serveur bloque
    egal(0, $restants, 'le compteur du code supprimé est purgé');
    egal(404, lire($e1[0]['code'])['code'], 'ses codes ne marchent plus');
    egal($avantEleves - 4, (int)bd_test()->query('SELECT COUNT(*) FROM eleves')->fetchColumn(), 'quatre élèves de moins, pas un de plus');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM classes WHERE id IN ($c1, $c2)")->fetchColumn(), 'ses classes sont parties');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM eleves WHERE classe_id IN ($c1, $c2)")->fetchColumn(), 'aucun élève orphelin');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM progressions WHERE eleve_id NOT IN (SELECT id FROM eleves)')->fetchColumn(), 'aucune progression orpheline');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM partages WHERE prof_id = $partantId OR classe_id IN ($c1, $c2)")->fetchColumn(), 'aucun partage orphelin, reçu ou donné');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM sessions_prof WHERE prof_id = $partantId")->fetchColumn(), 'aucune session');
    egal(401, connexion('partant', 'le-mdp-du-collegue-qui-sen-va')['code'], 'il ne se connecte plus');
    egal(404, echanger($billetPartant)['code'], 'son billet de fiche déjà pris ne sert plus (F06)');
    // Les autres n'ont rien perdu : la classe de Gwenaël est là, celle partagée à Claire par le partant a disparu de sa liste sans erreur.
    egal(200, appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $mienne], ['jeton' => $jetonS1])['code'], 'la classe de Gwenaël est intacte');
    $deClaire = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire]);
    egal(200, $deClaire['code'], 'Claire liste ses classes sans erreur');
    vrai(!in_array($c1, array_column($deClaire['json']['classes'], 'id'), true), 'la classe partagée par le partant ne s’y trouve plus');
});

// ------------------------------------------- lot 3 (03/09/2026) — billets d'entrée
//
// Le code ne voyage plus dans une adresse : l'espace élève et « Ma classe »
// demandent un BILLET (32 caractères, deux minutes, usage unique), l'appli
// l'échange contre le code (ou contre la fiche, sans le code). lib/billets.php.

function echanger(string $billet, array $enPlus = []): array
{
    return appel('/api/eleve.php', ['billet' => $billet] + $enPlus);
}

function billets_en_base(): int
{
    return (int)bd_test()->query('SELECT COUNT(*) FROM billets')->fetchColumn();
}

$classeBillets = null;
$elevesBillets = [];

verifier("préparation : une classe, deux élèves nommés, Claire en lecture", function () use (&$jetonS1, &$jetonClaire, &$claireId, &$classeBillets, &$elevesBillets) {
    vider_compteurs();
    $classeBillets = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-billets'], ['jeton' => $jetonS1])['json']['id'];
    $elevesBillets = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classeBillets, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    egal(2, count($elevesBillets), 'deux élèves');
    egal(200, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $elevesBillets[0]['id'], 'prenom' => 'Sam', 'initiale' => 'B'], ['jeton' => $jetonS1])['code'], 'Sam nommé');
    egal(200, ecrire($elevesBillets[0]['code'], ['version' => VERSION_TABLES, 'tables' => ['3' => ['acquise' => '2026-09-01']]], 0)['code'], 'Sam a une progression');
    egal(200, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classeBillets, 'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jetonS1])['code'], 'partagée à Claire en lecture');
});

verifier("l'identité par le code ne donne un billet que si on le demande", function () use (&$elevesBillets) {
    $sans = appel('/api/eleve.php', ['code' => $elevesBillets[0]['code']]);
    egal(200, $sans['code'], 'code HTTP');
    vrai(!array_key_exists('billet', $sans['json']), 'sans « billet: true », pas de billet');
    $avec = appel('/api/eleve.php', ['code' => $elevesBillets[0]['code'], 'billet' => true]);
    egal(200, $avec['code'], 'code HTTP');
    egal('Sam', $avec['json']['prenom'], 'l’identité est toujours là');
    vrai(is_array($avec['json']['applis']), 'et les applis');
    vrai((bool)preg_match('/^[0-9a-f]{32}$/', (string)($avec['json']['billet'] ?? '')), 'un billet de 32 caractères hexadécimaux');
    // Seule l'empreinte est en base, avec une échéance à deux minutes.
    $ligne = bd_test()->query('SELECT hash, type, expire_le FROM billets ORDER BY expire_le DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
    egal(hash('sha256', $avec['json']['billet']), $ligne['hash'], 'le billet en clair n’est pas en base, seulement son empreinte');
    egal('entree', $ligne['type']);
    vrai(abs(((int)$ligne['expire_le']) - (time() + 120)) <= 5, 'valable deux minutes');
});

verifier("un billet d'entrée s'échange contre le code, une seule fois", function () use (&$elevesBillets) {
    $billet = appel('/api/eleve.php', ['code' => $elevesBillets[0]['code'], 'billet' => true])['json']['billet'];
    $r = echanger($billet);
    egal(200, $r['code'], 'premier échange');
    egal('entree', $r['json']['type']);
    egal($elevesBillets[0]['code'], $r['json']['code'], 'le code revient');
    egal('Sam', $r['json']['prenom']);
    egal('test-billets', $r['json']['classe']);
    $encore = echanger($billet);
    egal(404, $encore['code'], 'le même billet, une seconde fois : refusé');
    vrai(str_contains((string)$encore['json']['erreur'], 'expiré'), 'avec le mot que l’appli affiche');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM billets WHERE hash = ' . bd_test()->quote(hash('sha256', $billet)))->fetchColumn(), 'et il n’est plus en base');
});

verifier("un billet inconnu ou mal formé est refusé, et compte comme un échec de l'adresse", function () {
    vider_compteurs();
    egal(404, echanger(bin2hex(random_bytes(16)))['code'], 'inconnu');
    egal(400, echanger('pas-un-billet')['code'], 'mal formé');
    egal(400, echanger('')['code'], 'vide');
    egal(400, appel('/api/eleve.php', ['billet' => 12345])['code'], 'pas une chaîne');
    $compteur = bd_test()->prepare('SELECT nombre FROM compteurs WHERE cle = ?');
    $compteur->execute([cle_compteur_test('echec-ip:127.0.0.1', 300)]);
    $nombre = $compteur->fetchColumn();
    $compteur->closeCursor();
    egal(1, (int)$nombre, 'l’inconnu compte pour un échec de l’adresse, comme un code inventé');
});

verifier("un billet périmé est refusé et purgé", function () use (&$elevesBillets) {
    $billet = appel('/api/eleve.php', ['code' => $elevesBillets[0]['code'], 'billet' => true])['json']['billet'];
    bd_test()->exec('UPDATE billets SET expire_le = ' . (time() - 1) . ' WHERE hash = ' . bd_test()->quote(hash('sha256', $billet)));
    egal(404, echanger($billet)['code'], 'périmé : refusé');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM billets WHERE hash = ' . bd_test()->quote(hash('sha256', $billet)))->fetchColumn(), 'la purge l’a emporté');
});

verifier("cinq échanges simultanés du même billet : un seul passe", function () use (&$elevesBillets) {
    $billet = appel('/api/eleve.php', ['code' => $elevesBillets[0]['code'], 'billet' => true])['json']['billet'];
    $codes = appels_paralleles('/api/eleve.php', ['billet' => $billet], 5);
    sort($codes);
    egal([200, 404, 404, 404, 404], $codes, 'un 200, quatre 404, aucune erreur');
});

verifier("« Voir sa fiche » : un billet de fiche rend la progression et le prénom, jamais le code", function () use (&$jetonS1, &$elevesBillets) {
    $r = appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $elevesBillets[0]['id']], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'le propriétaire obtient un billet');
    $billet = (string)$r['json']['billet'];
    vrai((bool)preg_match('/^[0-9a-f]{32}$/', $billet), 'de la même forme');
    $fiche = echanger($billet, ['appli' => 'defi-tables']);
    egal(200, $fiche['code'], 'échange');
    egal('fiche', $fiche['json']['type']);
    egal('Sam', $fiche['json']['prenom']);
    egal('test-billets', $fiche['json']['classe']);
    egal(true, $fiche['json']['existe']);
    egal('2026-09-01', $fiche['json']['parcours']['tables']['3']['acquise'], 'la progression est là');
    vrai(!array_key_exists('code', $fiche['json']), 'et le code n’y est PAS');
    egal(404, echanger($billet)['code'], 'un billet de fiche aussi est à usage unique');

    $vide = appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $elevesBillets[1]['id']], ['jeton' => $jetonS1])['json']['billet'];
    $fiche = echanger($vide);
    egal(200, $fiche['code']);
    egal(false, $fiche['json']['existe'], 'un élève sans progression : existe = false');
    egal(null, $fiche['json']['parcours']);
    egal('', $fiche['json']['prenom'], 'sans prénom, rien d’inventé');

    $inconnue = appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $elevesBillets[1]['id']], ['jeton' => $jetonS1])['json']['billet'];
    egal(400, echanger($inconnue, ['appli' => 'inconnue'])['code'], 'une appli inconnue est refusée');
    egal(200, echanger($inconnue)['code'], 'sans consommer le billet');
});

verifier("un billet de fiche ne permet pas d'écrire", function () use (&$jetonS1, &$elevesBillets) {
    $billet = appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $elevesBillets[0]['id']], ['jeton' => $jetonS1])['json']['billet'];
    // parcours.php ne connaît que le code : un billet n'y ouvre rien.
    $r = appel('/api/parcours.php', ['billet' => $billet, 'appli' => 'defi-tables', 'parcours' => ['version' => VERSION_TABLES, 'tables' => ['9' => ['acquise' => '2026-09-02']]], 'base_revision' => 1]);
    egal(400, $r['code'], 'refusé avant même de regarder le billet');
    $r = appel('/api/parcours.php', ['billet' => $billet, 'appli' => 'defi-tables', 'lire' => true]);
    egal(400, $r['code'], 'ni lire');
    // Le billet n'a pas été consommé par ces refus : il s'échange encore, et
    // ne rend toujours pas le code.
    $fiche = echanger($billet);
    egal(200, $fiche['code']);
    vrai(!array_key_exists('code', $fiche['json']), 'pas de code');
    $relu = lire($elevesBillets[0]['code']);
    egal('2026-09-01', $relu['json']['parcours']['tables']['3']['acquise'], 'la progression de Sam est intacte');
    vrai(!isset($relu['json']['parcours']['tables']['9']), 'rien d’écrit');
});

verifier("la fiche suit le cloisonnement : Claire (lecture) l'obtient, un collègue sans partage non", function () use (&$jetonS1, &$jetonClaire, &$claireId, &$classeBillets, &$elevesBillets) {
    $r = appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $elevesBillets[0]['id']], ['jeton' => $jetonClaire]);
    egal(200, $r['code'], 'la classe lui est partagée en lecture : la fiche, oui');
    $fiche = echanger($r['json']['billet']);
    egal('Sam', $fiche['json']['prenom']);
    vrai(!array_key_exists('code', $fiche['json']), 'sans le code : elle ne l’a pas dans le tableau non plus');
    egal(403, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $elevesBillets[0]['id'], 'prenom' => 'X'], ['jeton' => $jetonClaire])['code'], 'et toujours pas le droit d’écrire');

    egal(200, appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $classeBillets, 'prof_id' => $claireId], ['jeton' => $jetonS1])['code'], 'partage retiré');
    egal(404, appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $elevesBillets[0]['id']], ['jeton' => $jetonClaire])['code'], 'sans partage : introuvable, comme le reste');
    egal(404, appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => 999999], ['jeton' => $jetonS1])['code'], 'élève inexistant');
    egal(401, appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $elevesBillets[0]['id']])['code'], 'sans session');
});

// Lot « petits correctifs de sécurité » (11/11/2026), constat F06 de l'audit
// GPT du 09/11 : un billet de fiche pris par un collègue en lecture ouvrait
// encore la fiche, une fois, après le retrait du partage (deux minutes au
// plus). Sabotage : retirer l'appel d'oublier_billets_de_fiche_de_la_classe
// dans « partages.supprimer », ou celui d'oublier_billets_de_fiche_des_partages_du_prof
// dans « profs.desactiver ».
verifier("F06 — retirer un partage, ou désactiver le collègue, annule ses billets de fiche déjà pris ; les billets d'entrée des élèves restent", function () use (&$jetonS1, &$jetonClaire, &$claireId, &$classeBillets, &$elevesBillets) {
    vider_compteurs();
    $eleve = (int)$elevesBillets[0]['id'];
    $partager = fn() => egal(200, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classeBillets,
        'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jetonS1])['code'], 'classe partagée à Claire en lecture');
    $fiche = fn(string $jeton) => (string)appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $eleve], ['jeton' => $jeton])['json']['billet'];

    // Le retrait du partage.
    $partager();
    $billetClaire = $fiche($jetonClaire);
    $billetProprietaire = $fiche($jetonS1);
    $entree = (string)appel('/api/eleve.php', ['code' => $elevesBillets[0]['code'], 'billet' => true])['json']['billet'];
    egal(200, appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $classeBillets, 'prof_id' => $claireId], ['jeton' => $jetonS1])['code'], 'partage retiré');
    egal(404, echanger($billetClaire)['code'], 'le billet de fiche déjà pris par Claire ne sert plus');
    egal(404, echanger($billetProprietaire)['code'], 'celui du propriétaire non plus (le billet ne dit pas qui l’a pris : il reclique)');
    egal(200, echanger($entree)['code'], 'le billet d’entrée de l’élève, lui, n’est pas touché');
    egal(200, echanger($fiche($jetonS1))['code'], 'et le propriétaire en reprend un sans peine');

    // Retirer un partage qui n'existe pas ne touche à rien.
    $billetProprietaire = $fiche($jetonS1);
    egal(200, appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $classeBillets, 'prof_id' => 999999], ['jeton' => $jetonS1])['code'], 'aucun partage à ce nom');
    egal(200, echanger($billetProprietaire)['code'], 'rien n’a été retiré : le billet du propriétaire sert');

    // La désactivation du compte du collègue : ses billets sur une classe
    // qu'on lui partage, ET sur ses propres classes (relecture Codex, D2).
    $partager();
    $billetClaire = $fiche($jetonClaire);
    $saClasse = (int)appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'F06-D2'], ['jeton' => $jetonClaire])['json']['id'];
    $sonEleve = (int)appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $saClasse, 'nombre' => 1], ['jeton' => $jetonClaire])['json']['eleves'][0]['id'];
    $billetSaClasse = (string)appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $sonEleve], ['jeton' => $jetonClaire])['json']['billet'];
    egal(200, appel('/api/prof.php', ['action' => 'profs.desactiver', 'prof_id' => $claireId], ['jeton' => $jetonS1])['code'], 'Claire désactivée');
    egal(404, echanger($billetClaire)['code'], 'son billet de fiche (classe partagée) tombe avec ses sessions');
    egal(404, echanger($billetSaClasse)['code'], 'celui pris sur SA propre classe aussi (D2)');
    egal(200, appel('/api/prof.php', ['action' => 'profs.reactiver', 'prof_id' => $claireId], ['jeton' => $jetonS1])['code'], 'Claire réactivée');
    $r = connexion('claire', 'mdp-collegue-definitif-2026');
    egal(200, $r['code'], 'elle se reconnecte');
    $jetonClaire = $r['json']['jeton'];
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $saClasse], ['jeton' => $jetonClaire])['code'], 'sa classe d’essai retirée');
    egal(200, appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $classeBillets, 'prof_id' => $claireId], ['jeton' => $jetonS1])['code'], 'on remet la classe comme avant');
});

// Relecture Codex du 11/11/2026, D3 : « Voir sa fiche » contrôle le droit,
// PUIS range le billet. Un retrait de partage glissé entre les deux laissait
// un billet neuf derrière la purge. Le test rejoue la course : il tient la
// base (comme une écriture en cours), retire le partage et purge DANS cette
// transaction ; la demande de fiche du collègue lit encore l'ancien état (le
// partage), puis attend pour écrire son billet. Une fois la transaction
// validée, le billet est rangé APRÈS la purge : seul le second contrôle
// (fiche_encore_permise) peut l'arrêter. Sabotage : retirer ce second
// contrôle dans « eleves.fiche » (api/prof.php). La course n'est jouée que sur
// SQLite (le verrou de toute la base s'y pose simplement) ; la fonction est
// vérifiée sur les deux bases.
verifier("F06 (D3) — un billet de fiche émis pendant le retrait du partage est retiré aussitôt : 404, aucun billet en base", function () use (&$jetonS1, &$jetonClaire, &$claireId, &$classeBillets, &$elevesBillets) {
    vider_compteurs();
    $eleve = (int)$elevesBillets[0]['id'];
    egal(200, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classeBillets,
        'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jetonS1])['code'], 'classe partagée à Claire');
    vrai(fiche_encore_permise(bd_test(), $claireId, $eleve), 'partagée : permis');
    $gwenaelId = (int)bd_test()->query("SELECT id FROM profs WHERE identifiant = 'gwenael'")->fetchColumn();
    vrai(fiche_encore_permise(bd_test(), $gwenaelId, $eleve), 'sa classe : permis');
    vrai(!fiche_encore_permise(bd_test(), $claireId, 999999), 'élève inconnu : non');
    $fichesEnBase = fn() => (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE type = 'fiche' AND eleve_id = $eleve")->fetchColumn();

    if (pilote_test() !== 'mysql') {
        bd_test()->exec("DELETE FROM billets WHERE type = 'fiche'");
        $bd = bd_test();
        $bd->exec('BEGIN IMMEDIATE');
        $vol = lancer_appel_en_vol('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $eleve], $jetonClaire);
        $repondu = avancer_appel_en_vol($vol, 700);
        // Le retrait, comme « partages.supprimer » : le partage, puis la purge.
        $bd->prepare('DELETE FROM partages WHERE classe_id = ? AND prof_id = ?')->execute([$classeBillets, $claireId]);
        oublier_billets_de_fiche_de_la_classe($bd, $classeBillets);
        $bd->exec('COMMIT');
        $r = terminer_appel_en_vol($vol);
        vrai(!$repondu, 'la demande de fiche attendait pour ranger son billet');
        egal(404, $r['code'], 'le billet rangé après la purge est retiré : « Introuvable. »');
        egal(0, $fichesEnBase(), 'aucun billet de fiche ne reste en base');
    } else {
        egal(200, appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $classeBillets, 'prof_id' => $claireId], ['jeton' => $jetonS1])['code'], 'partage retiré');
    }
    vrai(!fiche_encore_permise(bd_test(), $claireId, $eleve), 'partage retiré : non');
    egal(404, appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $eleve], ['jeton' => $jetonClaire])['code'], 'et la demande suivante est refusée d’emblée');
    // Un compte désactivé n'est plus permis, même sur sa propre classe.
    bd_test()->exec("UPDATE profs SET actif = 0 WHERE id = $gwenaelId");
    $desactive = fiche_encore_permise(bd_test(), $gwenaelId, $eleve);
    bd_test()->exec("UPDATE profs SET actif = 1 WHERE id = $gwenaelId");
    vrai(!$desactive, 'compte désactivé : non');
});

verifier("un nouveau code, ou la suppression de l'élève, emporte ses billets", function () use (&$jetonS1, &$elevesBillets) {
    $ancien = $elevesBillets[1]['code'];
    $billet = appel('/api/eleve.php', ['code' => $ancien, 'billet' => true])['json']['billet'];
    $nouveau = appel('/api/prof.php', ['action' => 'eleves.regenerer', 'eleve_id' => $elevesBillets[1]['id']], ['jeton' => $jetonS1])['json']['code'];
    vrai($nouveau !== $ancien, 'nouveau code');
    egal(404, echanger($billet)['code'], 'le billet émis sous l’ancien code ne rend pas le nouveau');

    $billet = appel('/api/eleve.php', ['code' => $nouveau, 'billet' => true])['json']['billet'];
    $fiche = appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $elevesBillets[1]['id']], ['jeton' => $jetonS1])['json']['billet'];
    egal(200, appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $elevesBillets[1]['id']], ['jeton' => $jetonS1])['code'], 'supprimé');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM billets WHERE eleve_id = ' . (int)$elevesBillets[1]['id'])->fetchColumn(), 'plus aucun billet à son nom');
    egal(404, echanger($billet)['code']);
    egal(404, echanger($fiche)['code']);
});

verifier("les billets périmés sont purgés à chaque appel, comme les compteurs", function () use (&$elevesBillets) {
    bd_test()->exec('DELETE FROM billets');
    for ($i = 0; $i < 3; $i++) appel('/api/eleve.php', ['code' => $elevesBillets[0]['code'], 'billet' => true]);
    egal(3, billets_en_base(), 'trois billets vivants');
    bd_test()->exec('UPDATE billets SET expire_le = ' . (time() - 1));
    appel('/api/eleve.php', ['code' => $elevesBillets[0]['code'], 'billet' => true]);
    egal(1, billets_en_base(), 'un appel plus tard, seul le billet neuf reste');
});

verifier("verifier.php compte la table des billets", function () {
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'toutes présentes'), 'toutes les tables présentes, billets comprise');
    bd_test()->exec('DROP TABLE billets');
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'manquantes : billets'), 'sans la table, verifier.php la nomme');
    // migrer.php la recrée : c'est l'étape 1 de la mise en ligne du lot 3.
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'billets'), 'migrer.php annonce la table créée');
    egal(0, billets_en_base(), 'table recréée, vide');
});

// --------------------------- lot 12 (05/09/2026) — fin d'année, manifeste, secours
//
// Trois choses se testent ici :
//  - l'année scolaire réunionnaise et la suppression de fin d'année (il ne
//    reste RIEN d'une classe passée) ;
//  - le manifeste VERSION que verifier.php recompte en ligne ;
//  - les deux pages qu'on dépose puis qu'on retire (secours, sauvegarde).
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) faire commencer l'année scolaire au 1er septembre (pivot 8 → 9)
//  b) enlever le garde-fou des 21 jours sans activité
//  c) oublier une table dans supprimer_classe (progressions, billets, partages…)
//  d) retirer secours.php de la liste des fichiers à supprimer
//  e) ne plus comparer les empreintes du manifeste

$classeFin = null;
$elevesFin = [];

// Les fonctions de fin d'année sont jouées ICI, dans le processus de test, pas
// seulement à travers l'API : c'est la seule façon d'éprouver le pivot du
// calendrier sans attendre le mois d'août.
require_once dirname(__DIR__) . '/public/lib/archives.php';
// Lot serveur A : jour_local(), premier_jour_garde(), journaliser(),
// purger_journal() et les instantanés sont joués ici aussi, dans le processus
// de test — c'est la seule façon d'éprouver un fuseau ou une purge sans
// attendre neuf jours.
require_once dirname(__DIR__) . '/public/lib/versions.php';
require_once dirname(__DIR__) . '/public/lib/journal.php';

verifier("l'année scolaire suit le calendrier réunionnais : pivot au 1er JUILLET", function () {
    // Rentrée le 18 août 2026, fin des cours le 3 juillet 2027. Le pivot est
    // passé du 1er août au 1er JUILLET le 06/09/2026 (constat 2 de l'audit) :
    // une classe préparée pendant les vacances appartient à l'année qui vient,
    // pas à celle qui s'achève — sinon elle naît « échue » et disparaît à la
    // rentrée.
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], htmlspecialchars("Suppression de fin d'année", ENT_QUOTES)),
        'verifier.php montre la ligne de fin d’année');
    egal('2026-2027', annee_scolaire('2026-07-01'), '1er juillet 2026 : l’année qui vient');
    egal('2026-2027', annee_scolaire('2026-07-25'), 'la classe préparée le 25 juillet (le cas de l’audit)');
    egal('2026-2027', annee_scolaire('2026-08-18T06:00:00Z'), 'rentrée du 18 août 2026');
    egal('2026-2027', annee_scolaire('2027-06-30'), 'dernier jour de l’année scolaire');
    egal('2025-2026', annee_scolaire('2026-06-30'), '30 juin 2026 : encore l’année d’avant');
    egal('2027-2028', annee_scolaire('2027-07-01'), 'le pivot suivant');
    egal('2027-08-01', purge_de_l_annee('2026-2027'), 'la suppression tombe avant la rentrée de mi-août');
    egal('2027-06-01', fin_des_cours_de_l_annee('2026-2027'), 'le préavis commence le 1er juin');
});

// Vieillir une classe ET ses élèves : depuis le 06/09/2026, créer un élève
// compte comme de l'activité (constat 2). Une classe « de l'an dernier » dont
// les élèves ont été créés ce matin n'est donc PAS inactive — et c'est voulu.
function vieillir_classe(int $classeId, string $instant): void
{
    bd_test()->exec("UPDATE classes SET cree_le = '" . $instant . "' WHERE id = " . $classeId);
    bd_test()->exec("UPDATE eleves SET cree_le = '" . $instant . "' WHERE classe_id = " . $classeId);
}

function an_passe(): string
{
    return (string)(((int)substr(annee_scolaire(gmdate('Y-m-d')), 0, 4)) - 1) . '-09-15T08:00:00Z';
}

verifier("préparation : une classe de fin d'année, trois élèves, deux progressions, un partage", function () use (&$jetonS1, &$jetonClaire, &$claireId, &$classeFin, &$elevesFin) {
    vider_compteurs();
    $classeFin = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-fin-annee'], ['jeton' => $jetonS1])['json']['id'];
    $elevesFin = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classeFin, 'nombre' => 3], ['jeton' => $jetonS1])['json']['eleves'];
    egal(3, count($elevesFin), 'trois élèves');
    foreach ([0, 1] as $i) {
        egal(200, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $elevesFin[$i]['id'], 'prenom' => 'Enfant' . $i, 'initiale' => 'Z'], ['jeton' => $jetonS1])['code']);
        egal(200, ecrire($elevesFin[$i]['code'], ['version' => VERSION_TABLES, 'tables' => ['4' => ['acquise' => '2026-09-01']]], 0)['code'], 'progression écrite');
    }
    egal(200, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classeFin, 'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jetonS1])['code'], 'partagée à Claire');
    // Un billet vivant, pour vérifier qu'il part avec le reste.
    vrai(is_string(appel('/api/eleve.php', ['code' => $elevesFin[0]['code'], 'billet' => true])['json']['billet'] ?? null), 'un billet est émis');

    // Une classe de l'année en cours n'est jamais échue.
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    egal([], $r['json']['echues'], 'aucune classe échue dans l’année en cours');
    vrai(!array_key_exists('supprimees_maintenant', $r['json']),
        'ouvrir la liste ne supprime plus rien : la clé « supprimees_maintenant » a disparu');
    egal(annee_scolaire(gmdate('Y-m-d')), $r['json']['annee_courante'], 'l’année scolaire annoncée');
    vrai(array_key_exists('preavis_fin_annee', $r['json']), 'le préavis est annoncé à la page');
    egal(purge_de_l_annee(annee_scolaire(gmdate('Y-m-d'))), $r['json']['purge_le'], 'et la date de suppression');
});

verifier("supprimer une classe n'en laisse RIEN : ni élève, ni code, ni progression, ni billet, ni partage", function () use (&$jetonS1, &$classeFin, &$elevesFin) {
    $codes = array_map(fn($e) => (string)$e['code'], $elevesFin);
    $ids = implode(',', array_map('intval', array_column($elevesFin, 'id')));
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classeFin], ['jeton' => $jetonS1])['code'], 'supprimée');

    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$classeFin)->fetchColumn(), 'plus de classe');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM eleves WHERE classe_id = ' . (int)$classeFin)->fetchColumn(), 'plus un seul élève');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM progressions WHERE eleve_id IN ($ids)")->fetchColumn(), 'plus une seule progression');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE eleve_id IN ($ids)")->fetchColumn(), 'plus un seul billet');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM partages WHERE classe_id = ' . (int)$classeFin)->fetchColumn(), 'plus de partage');
    foreach ($codes as $code) {
        egal(404, identite($code)['code'], "le code $code ne rend plus rien");
    }
    // Et la classe a disparu de la liste : aucune ligne de bilan ne survit.
    foreach (appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes'] as $c) {
        vrai((int)$c['id'] !== (int)$classeFin, 'la classe supprimée ne figure plus nulle part');
    }
});

verifier("ouvrir « Ma classe » ne supprime plus rien : les classes échues sont PROPOSÉES", function () use (&$jetonS1) {
    $vieille = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-an-dernier'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $vieille, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    egal(200, ecrire($eleves[0]['code'], ['version' => VERSION_TABLES, 'tables' => ['5' => ['acquise' => '2026-09-01']]], 0)['code'], 'une progression');

    // Année scolaire passée, mais une activité d'aujourd'hui : le garde-fou
    // des 21 jours la retient, elle n'est même pas proposée.
    vieillir_classe((int)$vieille, an_passe());
    bd_test()->exec("UPDATE progressions SET maj_le = '" . gmdate('Y-m-d') . "' WHERE eleve_id = " . (int)$eleves[0]['id']);
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    egal([], $r['json']['echues'], 'une classe encore utilisée n’est pas proposée à la suppression');
    egal(2, (int)bd_test()->query('SELECT COUNT(*) FROM eleves WHERE classe_id = ' . (int)$vieille)->fetchColumn(), 'ses élèves sont là');

    // Même classe, plus d'activité depuis deux mois : elle est PROPOSÉE, et
    // rien n'a été supprimé — c'est tout le changement du 06/09/2026.
    $vieuxJour = gmdate('Y-m-d', time() - 60 * 86400);
    bd_test()->exec("UPDATE progressions SET maj_le = '" . $vieuxJour . "' WHERE eleve_id = " . (int)$eleves[0]['id']);
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    egal(1, count($r['json']['echues']), 'une classe proposée');
    egal('test-an-dernier', $r['json']['echues'][0]['libelle'], 'nommée');
    egal(2, $r['json']['echues'][0]['eleves'], 'avec le nombre d’élèves qu’elle contient');
    vrai(array_key_exists('annee', $r['json']['echues'][0]) && array_key_exists('derniere_activite', $r['json']['echues'][0]),
        'et son année et sa dernière activité, pour que le bandeau puisse le dire');
    egal(2, (int)bd_test()->query('SELECT COUNT(*) FROM eleves WHERE classe_id = ' . (int)$vieille)->fetchColumn(),
        'RIEN n’a été supprimé en ouvrant la liste');

    // Le professeur dit oui : là, et seulement là, tout part.
    $r = appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => [$vieille]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'suppression demandée par le professeur');
    egal(['test-an-dernier'], $r['json']['supprimees'], 'la page reçoit le nom de ce qui est parti');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$vieille)->fetchColumn(), 'il ne reste aucune ligne de la classe');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM eleves WHERE classe_id = ' . (int)$vieille)->fetchColumn(), 'plus un élève');
    egal(404, identite($eleves[1]['code'])['code'], 'le code d’un élève supprimé ne rend plus rien');
});

verifier("« supprimer les classes échues » refuse une classe qui ne l'est pas, même envoyée à la main", function () use (&$jetonS1) {
    $enCours = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-cette-annee'], ['jeton' => $jetonS1])['json']['id'];
    $r = appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => [$enCours]], ['jeton' => $jetonS1]);
    egal(409, $r['code'], 'une classe de l’année en cours n’est jamais supprimée par ce chemin');
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$enCours)->fetchColumn(), 'elle est intacte');
    egal(400, appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => []], ['jeton' => $jetonS1])['code'], 'liste vide');
    egal(400, appel('/api/prof.php', ['action' => 'classes.supprimer_echues'], ['jeton' => $jetonS1])['code'], 'aucune liste');

    // Tout ou rien : une bonne et une mauvaise dans le même envoi, rien ne part.
    $vieille = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-tout-ou-rien'], ['jeton' => $jetonS1])['json']['id'];
    vieillir_classe((int)$vieille, an_passe());
    $r = appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => [$vieille, $enCours]], ['jeton' => $jetonS1]);
    egal(409, $r['code'], 'un identifiant qui ne convient pas arrête tout');
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$vieille)->fetchColumn(), 'même la classe échue est restée');
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => [$vieille]], ['jeton' => $jetonS1])['code'], 'seule, elle part');
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $enCours], ['jeton' => $jetonS1])['code'], 'ménage du test');
});

verifier("la classe d'un collègue n'est ni proposée ni supprimable par quelqu'un d'autre", function () use (&$jetonS1, &$jetonClaire) {
    $sienne = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'classe-de-claire'], ['jeton' => $jetonClaire])['json']['id'];
    vieillir_classe((int)$sienne, an_passe());
    // Gwenaël ouvre SA liste : la classe de Claire n'y est pas, et rien ne bouge.
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    foreach ($r['json']['echues'] as $classe) {
        vrai((int)$classe['id'] !== (int)$sienne, 'la classe de Claire n’est pas proposée à Gwenaël');
    }
    egal(404, appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => [$sienne]], ['jeton' => $jetonS1])['code'],
        'et il ne peut pas la supprimer : elle lui est introuvable');
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$sienne)->fetchColumn(), 'la classe de Claire est intacte');
    // Claire ouvre la sienne : elle lui est proposée, et elle décide.
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire]);
    egal(1, count($r['json']['echues']), 'chacun sa fin d’année');
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => [$sienne]], ['jeton' => $jetonClaire])['code']);
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$sienne)->fetchColumn());
});

// --------------------------------------------- constat 2 de l'audit du 05/09
//
// Le cas qui a coûté une classe entière en essai : préparée le 25 juillet,
// vingt-cinq prénoms saisis le 20 août, effacée sans un mot le 5 septembre à
// la première ouverture de « Ma classe ». Deux corrections l'empêchent
// désormais (pivot au 1er juillet, création d'élève = activité) ; le témoin
// prouve que la vraie fin d'année, elle, marche toujours.
verifier("constat 2 — la classe préparée en juillet survit à la rentrée (cas A et cas B)", function () use (&$jetonS1) {
    $an = (int)gmdate('Y');
    // Cas A : créée le 25 juillet de cette année civile, élèves nommés en août.
    $casA = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'cas-A-juillet'], ['jeton' => $jetonS1])['json']['id'];
    appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $casA, 'nombre' => 3], ['jeton' => $jetonS1]);
    bd_test()->exec("UPDATE classes SET cree_le = '$an-07-25T08:00:00Z' WHERE id = " . (int)$casA);
    bd_test()->exec("UPDATE eleves SET cree_le = '$an-08-20T08:00:00Z' WHERE classe_id = " . (int)$casA);
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    foreach ($r['json']['echues'] as $classe) {
        vrai((int)$classe['id'] !== (int)$casA, 'la classe du 25 juillet n’est pas « de l’année passée »');
    }
    egal(3, (int)bd_test()->query('SELECT COUNT(*) FROM eleves WHERE classe_id = ' . (int)$casA)->fetchColumn(), 'ses trois élèves sont là');

    // Cas B : classe de juillet, aucun enregistrement depuis 22 jours — mais
    // ses élèves ont été créés il y a peu : ce n'est pas une classe morte.
    $casB = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'cas-B-juillet'], ['jeton' => $jetonS1])['json']['id'];
    $elevesB = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $casB, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    ecrire($elevesB[0]['code'], ['version' => VERSION_TABLES], 0);
    bd_test()->exec("UPDATE classes SET cree_le = '$an-07-10T08:00:00Z' WHERE id = " . (int)$casB);
    bd_test()->exec("UPDATE progressions SET maj_le = '" . gmdate('Y-m-d', time() - 22 * 86400) . "' WHERE eleve_id = " . (int)$elevesB[0]['id']);
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    foreach ($r['json']['echues'] as $classe) {
        vrai((int)$classe['id'] !== (int)$casB, 'la classe de juillet sans envoi depuis 22 jours reste');
    }

    // Témoin : une VRAIE classe de l'an dernier, sans rien depuis, est bien
    // proposée. Sans lui, on pourrait « corriger » en n'effaçant plus jamais.
    $temoin = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'temoin-an-dernier'], ['jeton' => $jetonS1])['json']['id'];
    appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $temoin, 'nombre' => 1], ['jeton' => $jetonS1]);
    vieillir_classe((int)$temoin, ($an - 1) . '-05-15T08:00:00Z');
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    $proposees = array_column($r['json']['echues'], 'id');
    vrai(in_array((int)$temoin, $proposees, true), 'la classe de mai de l’an dernier est bien proposée');

    foreach ([$casA, $casB] as $id) {
        appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    }
    appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => [$temoin]], ['jeton' => $jetonS1]);
});

verifier("constat 2 — CRÉER des élèves compte comme activité, pas seulement leurs enregistrements", function () use (&$jetonS1) {
    // La deuxième moitié du constat, indépendante du pivot. Une classe d'une
    // année scolaire PASSÉE, donc échue — mais dont le professeur vient de
    // créer les élèves. Avant, seul progressions.maj_le comptait : préparer
    // une classe entière et saisir vingt-cinq prénoms n'était pas « de
    // l'activité », et trois semaines plus tard tout partait.
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'constat2-eleves-neufs'], ['jeton' => $jetonS1])['json']['id'];
    appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 25], ['jeton' => $jetonS1]);
    // La classe date de l'an dernier ; les élèves, d'il y a cinq jours.
    bd_test()->exec("UPDATE classes SET cree_le = '" . an_passe() . "' WHERE id = " . (int)$classe);
    bd_test()->exec("UPDATE eleves SET cree_le = '" . gmdate('Y-m-d\TH:i:s\Z', time() - 5 * 86400) . "' WHERE classe_id = " . (int)$classe);
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    vrai(!in_array((int)$classe, array_column($r['json']['echues'], 'id'), true),
        'vingt-cinq élèves créés il y a cinq jours : ce n’est pas une classe morte');

    // Les mêmes élèves créés il y a trente jours, et toujours aucun
    // enregistrement : cette fois, elle est bien proposée.
    bd_test()->exec("UPDATE eleves SET cree_le = '" . gmdate('Y-m-d\TH:i:s\Z', time() - 30 * 86400) . "' WHERE classe_id = " . (int)$classe);
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    vrai(in_array((int)$classe, array_column($r['json']['echues'], 'id'), true),
        'trente jours sans rien : elle est proposée');
    appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => [$classe]], ['jeton' => $jetonS1]);
});

verifier("menage.php ne s'ouvre pas dans un navigateur, et fait le ménage en ligne de commande", function () use (&$jetonS1, &$travail) {
    egal(404, appel('/menage.php')['code'], 'refusé par HTTP');
    $vieille = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-menage'], ['jeton' => $jetonS1])['json']['id'];
    appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $vieille, 'nombre' => 2], ['jeton' => $jetonS1]);
    vieillir_classe((int)$vieille, an_passe());
    $sortie = shell_exec('php ' . escapeshellarg($travail . '/menage.php') . ' 2>&1');
    vrai(str_contains((string)$sortie, 'test-menage'), "le ménage devrait nommer la classe supprimée — sortie : " . trim((string)$sortie));
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$vieille)->fetchColumn(), 'la classe est partie');
    // Depuis le 06/09/2026, c'est LUI qui supprime tout seul — et il le dit.
    vrai(str_contains((string)$sortie, 'journal'), "le ménage devrait rendre compte du journal — sortie : " . trim((string)$sortie));
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'classes.menage' AND cible_id = " . (int)$vieille)->fetchColumn(),
        'une ligne de journal au nom du ménage automatique');
    egal(0, (int)bd_test()->query("SELECT prof_id FROM journal WHERE action = 'classes.menage' AND cible_id = " . (int)$vieille)->fetchColumn(),
        'prof_id = 0 : personne ne l’a demandé');
});

verifier("le manifeste VERSION : verifier.php compare chaque fichier, et nomme celui qui diffère", function () use (&$travail) {
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'tous identiques au dépôt'), "les fichiers déposés devraient être conformes");

    // Un fichier modifié après le dépôt (ou oublié pendant) : il se nomme.
    $cible = $travail . '/api/eleve.php';
    $original = (string)file_get_contents($cible);
    file_put_contents($cible, $original . "\n// modification après dépôt\n");
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'différent(s) du dépôt') && str_contains($r['texte'], 'api/eleve.php'),
        'le fichier modifié devrait être nommé');
    file_put_contents($cible, $original);

    // Le même fichier transporté en mode texte (CRLF) : le diagnostic change.
    file_put_contents($cible, str_replace("\n", "\r\n", $original));
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'mode texte'), 'des fins de ligne changées devraient être reconnues comme telles');
    file_put_contents($cible, $original);

    // Un fichier oublié pendant le dépôt.
    rename($cible, $cible . '.range');
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'absent(s)') && str_contains($r['texte'], 'api/eleve.php'), 'un fichier manquant devrait être nommé');
    rename($cible . '.range', $cible);

    // Lot serveur B (I-05) — le manifeste TRONQUÉ. Sans le nombre annoncé en
    // en-tête, ce cas-là passait tout vert : les lignes disparues n'étaient
    // simplement plus comparées, et rien ne disait qu'on ne vérifiait plus
    // rien. C'est le pire des deux mondes — un contrôle qui se tait.
    $version = $travail . '/VERSION';
    $manifesteEntier = (string)file_get_contents($version);
    $lignes = explode("\n", rtrim($manifesteEntier, "\n"));
    array_pop($lignes);
    file_put_contents($version, implode("\n", $lignes) . "\n");
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'Manifeste tronqué'), 'un manifeste amputé de sa dernière ligne doit se voir');
    vrai((bool)preg_match('/non">✗<\/span>\s*Fichiers du serveur/u',
        html_entity_decode($r['texte'], ENT_QUOTES | ENT_HTML5, 'UTF-8')), 'et la ligne doit être rouge');
    file_put_contents($version, $manifesteEntier);

    // Lot serveur B (I-05) — dans l'autre sens : un .php posé ici que le
    // manifeste ne décrit pas. Un fichier d'un lot précédent devenu inutile,
    // une copie de travail : du code que le serveur exécuterait si on le lui
    // demandait, et que rien ne nommait jusqu'ici.
    $intrus = $travail . '/api/ancienne-version.php';
    file_put_contents($intrus, "<?php // reste d'un ancien lot\n");
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'inattendu') && str_contains($r['texte'], 'api/ancienne-version.php'),
        'un .php absent du manifeste doit être nommé');
    unlink($intrus);

    // Les six qui n'ont JAMAIS à figurer au manifeste ne sont pas des intrus :
    // config.php et config.exemple.php sont là pour de bonnes raisons, et les
    // quatre pages d'opération ont déjà leur propre ligne (« Fichiers
    // d'installation supprimés »). Elles sont toutes les six présentes dans
    // cette copie de test : si l'une d'elles était comptée, la ligne serait
    // rouge en permanence et ne voudrait plus rien dire.
    foreach (['config.php', 'config.exemple.php', 'installer.php', 'migrer.php',
              'secours.php', 'sauvegarde.php'] as $tolere) {
        vrai(is_file($travail . '/' . $tolere), "$tolere est bien présent dans la copie de test");
    }
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(!str_contains($r['texte'], 'inattendu'), 'aucune des six n’est comptée comme un intrus');
    // Un « config.php.bak », lui, n'est pas du .php : ce n'est pas cette ligne
    // qui le retient, c'est le <FilesMatch "^config"> du .htaccess (lot B, B7),
    // éprouvé par tests/suivi-htaccess.test.mjs.

    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'tous identiques au dépôt'), 'tout est remis en place');
    vrai(!str_contains($r['texte'], 'inattendu'), 'et plus aucun intrus');
});

verifier("verifier.php exige que secours.php et sauvegarde.php ne restent pas en ligne", function () use (&$travail) {
    foreach (['secours.php', 'sauvegarde.php'] as $fichier) {
        vrai(is_file($travail . '/' . $fichier), "$fichier est bien livré (mais pas déposé en temps normal)");
    }
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'secours.php') && str_contains($r['texte'], 'sauvegarde.php'),
        'tant qu’ils sont là, la page les nomme');
    // Le manifeste ne les décrit pas : ils ne doivent pas être en ligne.
    $manifeste = (string)file_get_contents($travail . '/VERSION');
    foreach (['secours.php', 'sauvegarde.php', 'installer.php', 'migrer.php', 'config.php'] as $fichier) {
        vrai(!str_contains($manifeste, '  ' . $fichier), "$fichier ne doit pas figurer au manifeste");
    }
    vrai(str_contains($manifeste, '  menage.php'), 'menage.php, lui, se dépose');
});

verifier("secours.php remet un mot de passe administrateur, et rien qu'avec le mot de passe d'installation", function () use (&$jetonS1) {
    $r = formulaire('/secours.php', ['jeton' => 'faux']);
    vrai(str_contains($r['texte'], 'incorrect'), 'un mauvais mot de passe d’installation est refusé');
    vrai(!str_contains($r['texte'], 'gwenael'), 'et aucun identifiant ne sort');

    $r = formulaire('/secours.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'gwenael'), 'avec le bon, la liste des comptes s’affiche');
    $profId = (int)bd_test()->query("SELECT id FROM profs WHERE identifiant = 'gwenael'")->fetchColumn();

    // Trop court : refusé, et le mot de passe actuel n'a pas bougé.
    $r = formulaire('/secours.php', ['jeton' => 'JETON-DE-TEST', 'prof_id' => $profId, 'nouveau' => 'court', 'repete' => 'court']);
    vrai(str_contains($r['texte'], '12 à 72 caractères'), 'les règles du mot de passe s’appliquent');
    // Deux saisies différentes : refusé aussi.
    $r = formulaire('/secours.php', ['jeton' => 'JETON-DE-TEST', 'prof_id' => $profId, 'nouveau' => 'phrase-de-secours-2026', 'repete' => 'autre-chose-encore']);
    vrai(str_contains($r['texte'], 'pas les mêmes'), 'les deux saisies doivent coïncider');
    egal(200, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonS1])['code'], 'la session en cours vit encore');

    $r = formulaire('/secours.php', ['jeton' => 'JETON-DE-TEST', 'prof_id' => $profId, 'nouveau' => 'phrase-de-secours-2026', 'repete' => 'phrase-de-secours-2026']);
    vrai(str_contains($r['texte'], 'SUPPRIME MAINTENANT'), 'la page rappelle de retirer le fichier');
    egal(401, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonS1])['code'], 'toutes ses sessions sont fermées');
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'gwenael', 'motdepasse' => 'phrase-de-secours-2026']);
    egal(200, $r['code'], 'le nouveau mot de passe ouvre le compte');
    vrai($r['json']['mdp_temporaire'] === false, 'et il n’est pas temporaire : rien à rechanger');
    $jetonS1 = $r['json']['jeton'];
    egal(true, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $jetonS1])['json']['admin'], 'toujours administrateur');
});

verifier("sauvegarde.php rend un fichier chiffré qui se déchiffre par openssl et contient toute la base", function () use (&$jetonS1) {
    $r = formulaire('/sauvegarde.php', ['jeton' => 'faux']);
    vrai(str_contains($r['texte'], 'incorrect'), 'un mauvais mot de passe d’installation est refusé');
    vrai(!str_contains($r['texte'], 'ligne(s)'), 'et rien de la base ne sort');

    $r = formulaire('/sauvegarde.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'ligne(s)'), 'avec le bon, la page compte les lignes de chaque table');

    if (!function_exists('openssl_encrypt')) {
        throw new RuntimeException("cette version de PHP n'a pas openssl : le test ne peut pas conclure");
    }
    $phrase = 'phrase-de-sauvegarde-2026';
    $r = formulaire('/sauvegarde.php', ['jeton' => 'JETON-DE-TEST', 'etape' => 'telecharger',
        'phrase' => $phrase, 'repete' => $phrase]);
    $brut = $r['texte'];
    egal('Salted__', substr($brut, 0, 8), 'le format d’openssl');
    vrai(!str_contains($brut, 'INSERT INTO'), 'rien ne sort en clair');

    $sel = substr($brut, 8, 8);
    $matiere = hash_pbkdf2('sha256', $phrase, $sel, 200000, 48, true);
    $clair = openssl_decrypt(substr($brut, 16), 'aes-256-cbc', substr($matiere, 0, 32), OPENSSL_RAW_DATA, substr($matiere, 32, 16));
    vrai(is_string($clair) && $clair !== '', 'le fichier se déchiffre avec la phrase');
    vrai(str_contains($clair, 'maths&go'), 'c’est bien une sauvegarde du suivi');
    foreach (['profs', 'classes', 'eleves', 'progressions', 'partages'] as $table) {
        vrai(str_contains($clair, "INSERT INTO `$table`") || (int)bd_test()->query("SELECT COUNT(*) FROM `$table`")->fetchColumn() === 0,
            "la table $table devrait être dans la sauvegarde");
    }
    // Trouvé le 05/09/2026 en faisant vraiment la restauration : oublier ces
    // trois tables rendait une base restaurée INUTILISABLE — la première
    // connexion d'un professeur répondait 500. Leur structure part donc dans
    // la sauvegarde, leur contenu non (jetons de courte durée).
    foreach (['sessions_prof', 'compteurs', 'billets', 'directs', 'directs_questions', 'directs_reponses'] as $table) {
        vrai(str_contains($clair, "CREATE TABLE `$table`") || str_contains($clair, "EXISTS $table ("),
            "la structure de $table doit être dans la sauvegarde : sans elle, le serveur restauré répond 500");
        vrai(!str_contains($clair, "INSERT INTO `$table`"), "mais pas son contenu : $table ne tient que des jetons périmés");
    }

    // Une autre phrase ne rend rien.
    $matiere = hash_pbkdf2('sha256', 'pas-la-bonne-phrase', $sel, 200000, 48, true);
    $rate = openssl_decrypt(substr($brut, 16), 'aes-256-cbc', substr($matiere, 0, 32), OPENSSL_RAW_DATA, substr($matiere, 32, 16));
    vrai($rate === false || !str_contains((string)$rate, 'maths&go'), 'sans la bonne phrase, le fichier reste illisible');

    // Une phrase trop courte est refusée : c'est elle qui protège tout.
    $r = formulaire('/sauvegarde.php', ['jeton' => 'JETON-DE-TEST', 'etape' => 'telecharger', 'phrase' => 'court', 'repete' => 'court']);
    vrai(str_contains($r['texte'], '12 caractères'), 'une phrase trop courte est refusée');
});

// ============================================================ LOT 11 (05/09/2026)
//
// Hygiène du serveur : la matrice droits x actions écrite et testée case par
// case, les quotas, le secret des compteurs, le frein de verifier.php, le bloc
// IPv6 /64, le prénom nettoyé, les vraies dates, les entrées à type inattendu.

// La matrice, telle qu'elle est écrite dans api/prof.php. Chaque case a son
// test ci-dessous : c'est la promesse du lot, et un droit déplacé par
// inadvertance rend un test rouge.
const MATRICE_ATTENDUE = [
    'tableau' => 'lecture',
    'partages.liste' => 'lecture',
    'eleves.fiche' => 'lecture',
    'eleves.ajouter' => 'ecriture',
    'eleves.nommer' => 'ecriture',
    'eleves.regenerer' => 'ecriture',
    'eleves.restaurer' => 'ecriture',
    'classes.modifier' => 'proprietaire',
    'classes.supprimer' => 'proprietaire',
    'classes.supprimer_echues' => 'proprietaire',
    'eleves.supprimer' => 'proprietaire',
    // Lot « Qui voit quoi » (22/10/2026) : ouvrir quelque chose en plus à un
    // élève — décider ce qu'il voit, comme ⚙ Réglages pour la classe :
    // propriétaire (Q2, décision de Gwenaël).
    'eleves.acces' => 'proprietaire',
    // Lot « après l'audit GPT » (D4, 14/10/2026) : retirer un temps des records.
    'records.retirer' => 'proprietaire',
    'partages.ajouter' => 'proprietaire',
    'partages.supprimer' => 'proprietaire',
    // Séance en direct (07/10/2026). L'ORDRE compte : la matrice les joue à la
    // suite — ouvrir, poser une question, dévoiler, désigner, prendre le
    // fichier, terminer —, chacune a donc ce qu'il lui faut pour répondre 200.
    'direct.etat' => 'ecriture',
    'direct.ouvrir' => 'ecriture',
    'direct.question' => 'ecriture',
    'direct.devoiler' => 'ecriture',
    'direct.bonne' => 'ecriture',
    'direct.fichier' => 'ecriture',
    'direct.terminer' => 'ecriture',
    // Lot E1 « les évaluations en classe » (15/10/2026). Même ordre que les
    // gestes : ouvrir (avec un modèle à soi), lire, fermer, prendre le
    // fichier, terminer. Les modèles n'ont pas de classe : hors matrice.
    'evaluation.ouvrir' => 'ecriture',
    'evaluation.etat' => 'ecriture',
    // Lot E2 : « Faire repasser » un élève — joué tant que l'évaluation est
    // ouverte (avant « fermer »), sur l'élève de la classe (rien à effacer :
    // le droit seul est éprouvé, le serveur répond 200 avec efface: false).
    'evaluation.repasser' => 'ecriture',
    'evaluation.fermer' => 'ecriture',
    'evaluation.fichier' => 'ecriture',
    'evaluation.terminer' => 'ecriture',
];

// Lot 5e (25/10/2026) : la séance en direct réservée à l'administrateur. À
// passer à false le jour où Gwenaël la rouvre (lib/direct.php).
const DIRECT_RESERVE_ATTENDUE = true;

// Les actions qui EFFACENT ne sont pas jouées dans les boucles de la matrice :
// elles sont éprouvées à part, pour de bon.
const ACTIONS_QUI_EFFACENT = ['classes.supprimer', 'eleves.supprimer', 'classes.supprimer_echues'];

$lot11 = ['classe' => null, 'eleve' => null, 'jetonProprio' => null, 'jetonPartage' => null, 'profPartage' => null];

verifier("lot 11 — mise en place : une classe à moi, partagée à un collègue neuf", function () use (&$lot11) {
    vider_compteurs();
    // Le mot de passe de « gwenael » a changé en cours de route : le test de
    // secours.php (lot 12) lui en a donné un nouveau. On accepte les deux, pour
    // que ce bloc reste valable quel que soit l'ordre des tests plus haut.
    $lot11['jetonProprio'] = null;
    foreach (['phrase-de-secours-2026', 'motdepasse-de-test-2026'] as $essai) {
        $r = connexion('gwenael', $essai);
        if (($r['json']['jeton'] ?? null) !== null) { $lot11['jetonProprio'] = $r['json']['jeton']; break; }
    }
    vrai(is_string($lot11['jetonProprio']), 'la session du propriétaire est ouverte');

    // Un collègue tout neuf : les comptes des tests précédents ont été
    // désactivés, réinitialisés et supprimés dans tous les sens. Celui-ci
    // n'appartient qu'au lot 11.
    $cree = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'lot11-collegue'],
        ['jeton' => $lot11['jetonProprio']])['json'];
    $lot11['profPartage'] = (int)$cree['id'];
    $jetonNeuf = connexion('lot11-collegue', $cree['motdepasse'])['json']['jeton'];
    egal(200, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $cree['motdepasse'],
        'nouveau' => 'une phrase pour le collegue 2026'], ['jeton' => $jetonNeuf])['code'], 'il choisit son mot de passe');
    $lot11['jetonPartage'] = $jetonNeuf;

    $lot11['classe'] = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot11'],
        ['jeton' => $lot11['jetonProprio']])['json']['id'];
    vrai(is_int($lot11['classe']), 'la classe du lot 11 est créée');
    $lot11['eleve'] = appel('/api/prof.php', ['action' => 'eleves.ajouter',
        'classe_id' => $lot11['classe'], 'nombre' => 2], ['jeton' => $lot11['jetonProprio']])['json']['eleves'][0];

    // Une progression avec une version précédente, pour que « Version
    // précédente » ait un sens dans la matrice.
    ecrire($lot11['eleve']['code'], ['version' => VERSION_TABLES], 0);
    ecrire($lot11['eleve']['code'], ['version' => VERSION_TABLES, 'expert' => 1], 1);
});

// Une action de la matrice, jouée avec un corps valide. On ne regarde que le
// code HTTP : 200 (autorisé), 403 (droit insuffisant), 404 (classe hors de
// portée — on ne révèle pas l'existence des classes des collègues).
function jouer_action_lot11(string $action, array $lot11, string $jeton): int
{
    $corps = ['action' => $action];
    switch ($action) {
        case 'tableau':
        case 'partages.liste':
        case 'classes.supprimer':
        case 'direct.etat':
        case 'direct.ouvrir':
        case 'direct.devoiler':
        case 'direct.bonne':
        case 'direct.fichier':
        case 'direct.terminer':
            $corps['classe_id'] = $lot11['classe'];
            break;
        case 'direct.question':
            $corps['classe_id'] = $lot11['classe'];
            $corps['type'] = 'choix';
            break;
        case 'evaluation.etat':
        case 'evaluation.fermer':
        case 'evaluation.fichier':
        case 'evaluation.terminer':
            $corps['classe_id'] = $lot11['classe'];
            break;
        case 'evaluation.repasser':
            $corps['classe_id'] = $lot11['classe'];
            $corps['eleve_id'] = $lot11['eleve']['id'];
            break;
        case 'evaluation.ouvrir':
            // Avec un modèle du professeur qui joue : chacun ouvre avec les siens.
            $modele = appel('/api/prof.php', ['action' => 'evaluation.enregistrer_modele', 'id' => null, 'nom' => 'lot 11',
                'reglage' => ['tables' => [7], 'types' => ['direct'], 'n' => 10, 'chrono' => 'sans', 'tirage' => 'memes']], ['jeton' => $jeton])['json']['id'] ?? 0;
            $corps['classe_id'] = $lot11['classe'];
            $corps['modele_id'] = $modele;
            $corps['duree'] = 1800;
            break;
        case 'classes.modifier':
            $corps['classe_id'] = $lot11['classe'];
            $corps['libelle'] = 'lot11';
            break;
        case 'eleves.ajouter':
            $corps['classe_id'] = $lot11['classe'];
            $corps['nombre'] = 1;
            break;
        case 'partages.ajouter':
            $corps['classe_id'] = $lot11['classe'];
            $corps['prof_id'] = $lot11['profPartage'];
            $corps['droit'] = 'ecriture';
            break;
        case 'partages.supprimer':
            $corps['classe_id'] = $lot11['classe'];
            $corps['prof_id'] = 0; // personne : la vérification du droit passe avant
            break;
        case 'eleves.fiche':
        case 'eleves.regenerer':
        case 'eleves.supprimer':
        case 'records.retirer': // l'élève du lot n'a pas de temps : rien n'est effacé, le droit seul est éprouvé
            $corps['eleve_id'] = $lot11['eleve']['id'];
            break;
        case 'eleves.nommer':
            $corps['eleve_id'] = $lot11['eleve']['id'];
            $corps['prenom'] = 'Léa';
            $corps['initiale'] = 'B';
            break;
        case 'eleves.restaurer':
            $corps['eleve_id'] = $lot11['eleve']['id'];
            $corps['appli'] = 'defi-tables';
            break;
        case 'eleves.acces': // rien en plus : la colonne reste vide, le droit seul est éprouvé
            $corps['eleve_id'] = $lot11['eleve']['id'];
            $corps['avant'] = new stdClass();
            $corps['ajouts'] = new stdClass();
            break;
    }
    return appel('/api/prof.php', $corps, ['jeton' => $jeton])['code'];
}

verifier("lot 11 — matrice : en LECTURE seule, seules les trois actions de lecture passent", function () use (&$lot11) {
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $lot11['classe'],
        'prof_id' => $lot11['profPartage'], 'droit' => 'lecture'], ['jeton' => $lot11['jetonProprio']]);
    foreach (MATRICE_ATTENDUE as $action => $droit) {
        if (in_array($action, ACTIONS_QUI_EFFACENT, true)) continue; // joués à part : ils effacent
        $obtenu = jouer_action_lot11($action, $lot11, $lot11['jetonPartage']);
        if ($droit === 'lecture') egal(200, $obtenu, "en lecture, « $action » doit passer");
        else egal(403, $obtenu, "en lecture, « $action » doit être refusé");
    }
});

verifier("lot 11 — matrice : en ÉCRITURE, on prépare et on dépanne, on n'efface pas", function () use (&$lot11) {
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $lot11['classe'],
        'prof_id' => $lot11['profPartage'], 'droit' => 'ecriture'], ['jeton' => $lot11['jetonProprio']]);
    foreach (MATRICE_ATTENDUE as $action => $droit) {
        if (in_array($action, ACTIONS_QUI_EFFACENT, true)) continue;
        $obtenu = jouer_action_lot11($action, $lot11, $lot11['jetonPartage']);
        if ($droit === 'proprietaire') egal(403, $obtenu, "en écriture, « $action » doit rester au propriétaire");
        // Lot 5e : la séance en direct est réservée à l'administrateur tant
        // que DIRECT_RESERVE_A_L_ADMINISTRATEUR le dit — le collègue en
        // écriture est refusé, les évaluations lui restent ouvertes.
        elseif (str_starts_with($action, 'direct.') && DIRECT_RESERVE_ATTENDUE) egal(403, $obtenu, "en écriture, « $action » est réservé à l’administrateur");
        else egal(200, $obtenu, "en écriture, « $action » doit passer");
    }
    // Les deux qui effacent, joués pour de bon : refusés, et rien n'a bougé.
    egal(403, jouer_action_lot11('eleves.supprimer', $lot11, $lot11['jetonPartage']), 'supprimer un élève');
    egal(403, jouer_action_lot11('classes.supprimer', $lot11, $lot11['jetonPartage']), 'supprimer la classe');
    $tableau = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $lot11['classe']],
        ['jeton' => $lot11['jetonProprio']])['json'];
    vrai(count($tableau['eleves']) >= 2, 'les élèves sont toujours là');
});

verifier("lot 11 — matrice : le PROPRIÉTAIRE peut tout, y compris ce qui efface", function () use (&$lot11) {
    foreach (MATRICE_ATTENDUE as $action => $droit) {
        if (in_array($action, ACTIONS_QUI_EFFACENT, true)) continue;
        egal(200, jouer_action_lot11($action, $lot11, $lot11['jetonProprio']), "le propriétaire fait « $action »");
    }
    egal(200, jouer_action_lot11('eleves.supprimer', $lot11, $lot11['jetonProprio']), 'supprimer un élève');
});

verifier("matrice — « supprimer les classes échues » est réservé au propriétaire", function () use (&$lot11) {
    // Le collègue en écriture voit la classe, mais il n'efface pas : c'est la
    // même règle que « Supprimer la classe ». Ici la classe n'est pas échue —
    // le contrôle du droit passe AVANT celui du calendrier, et c'est bien lui
    // qu'on éprouve (403, pas 409).
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $lot11['classe'],
        'prof_id' => $lot11['profPartage'], 'droit' => 'ecriture'], ['jeton' => $lot11['jetonProprio']]);
    egal(403, appel('/api/prof.php', ['action' => 'classes.supprimer_echues', 'classes' => [$lot11['classe']]],
        ['jeton' => $lot11['jetonPartage']])['code'], 'en écriture, la suppression de fin d’année est refusée');
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$lot11['classe'])->fetchColumn(),
        'la classe est intacte');
});

verifier("lot 11 — matrice : une action de classe inconnue est refusée, pas devinée", function () use (&$lot11) {
    egal(400, appel('/api/prof.php', ['action' => 'classes.exporter', 'classe_id' => $lot11['classe']],
        ['jeton' => $lot11['jetonProprio']])['code'], 'action inventée');
    egal(400, appel('/api/prof.php', ['action' => 'eleves.tout_effacer', 'eleve_id' => $lot11['eleve']['id']],
        ['jeton' => $lot11['jetonProprio']])['code'], 'action inventée sur un élève');
});

verifier("lot 11 — matrice : les actions de comptes restent à l'administrateur", function () use (&$lot11) {
    foreach (['profs.liste', 'profs.ajouter', 'profs.supprimer', 'profs.reinitialiser',
              'profs.desactiver', 'profs.reactiver'] as $action) {
        $r = appel('/api/prof.php', ['action' => $action, 'prof_id' => 1, 'identifiant' => 'intrus',
            'motdepasse' => 'motdepasse-intrus-2026'], ['jeton' => $lot11['jetonPartage']]);
        egal(403, $r['code'], "« $action » doit être refusé à un professeur ordinaire");
    }
});

verifier("lot 11 — quota : une classe s'arrête à deux cents élèves, et le refus ne crée rien", function () use (&$lot11) {
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot11-quota'],
        ['jeton' => $lot11['jetonProprio']])['json']['id'];
    for ($i = 0; $i < 3; $i++) {
        egal(200, appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe,
            'nombre' => 60], ['jeton' => $lot11['jetonProprio']])['code'], "lot de 60 n°" . ($i + 1));
    }
    // 180 élèves. Vingt de plus : d'accord. Vingt et un : non.
    $r = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 21],
        ['jeton' => $lot11['jetonProprio']]);
    egal(409, $r['code'], '181 + 20 dépasse le plafond');
    $combien = fn() => count(appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe],
        ['jeton' => $lot11['jetonProprio']])['json']['eleves']);
    egal(180, $combien(), 'le refus n’a créé aucun élève');
    egal(200, appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 20],
        ['jeton' => $lot11['jetonProprio']])['code'], 'les vingt derniers passent');
    egal(200, $combien(), 'la classe est pleine, exactement');
    egal(409, appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1],
        ['jeton' => $lot11['jetonProprio']])['code'], 'un de plus est refusé');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $lot11['jetonProprio']]);
});

verifier("lot 11 — le lot d'élèves est tout ou rien : deux demandes simultanées ne franchissent pas le plafond", function () use (&$lot11) {
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot11-course'],
        ['jeton' => $lot11['jetonProprio']])['json']['id'];
    for ($i = 0; $i < 3; $i++) {
        appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 60],
            ['jeton' => $lot11['jetonProprio']]);
    }
    // 180 élèves, plafond 200. Chacune des deux demandes tient toute seule
    // (180 + 20 = 200), les deux ensemble non (220). Sans le compte DANS la
    // transaction, les deux liraient 180 et passeraient.
    $codes = appels_paralleles('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe,
        'nombre' => 20, 'jeton' => $lot11['jetonProprio']], 2);
    sort($codes);
    egal([200, 409], $codes, 'une passe, l’autre est refusée');
    $eleves = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe],
        ['jeton' => $lot11['jetonProprio']])['json']['eleves'];
    egal(200, count($eleves), 'exactement deux cents élèves, jamais deux cent vingt');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $lot11['jetonProprio']]);
});

verifier("lot 11 — quota : un professeur s'arrête à quarante classes", function () use (&$lot11) {
    $jeton = $lot11['jetonProprio'];
    $possedees = 0;
    foreach (appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton])['json']['classes'] as $c) {
        if ($c['droit'] === 'proprietaire') $possedees++;
    }
    $creees = [];
    while ($possedees + count($creees) < 40) {
        $r = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'q' . count($creees)], ['jeton' => $jeton]);
        egal(200, $r['code'], 'sous le plafond, on crée');
        $creees[] = (int)$r['json']['id'];
    }
    egal(409, appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'la-41e'], ['jeton' => $jeton])['code'],
        'la quarante et unième est refusée');
    foreach ($creees as $id) {
        appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jeton]);
    }
    egal(200, appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'apres-menage'], ['jeton' => $jeton])['code'],
        'de la place libérée, on recrée');
});

verifier("lot 11 — le secret des compteurs n'est PAS le mot de passe d'installation", function () {
    vider_compteurs();
    // Un échec de connexion sur un identifiant connu de nous seuls : le
    // compteur « connexion-id:<identifiant> » doit exister sous une clé hachée.
    $identifiant = 'temoin-secret-' . bin2hex(random_bytes(3));
    connexion($identifiant, 'mauvais-mot-de-passe-2026');
    $cleClaire = 'connexion-id:' . $identifiant;
    $secondes = 600;
    $avecJetonBrut = 'l:' . substr(hash_hmac('sha256', $cleClaire, 'JETON-DE-TEST'), 0, 40) . ':' . $secondes;
    $avecSecretDerive = cle_compteur_test($cleClaire, $secondes);
    $cles = array_column(bd_test()->query('SELECT cle FROM compteurs')->fetchAll(), 'cle');
    vrai(!in_array($avecJetonBrut, $cles, true),
        'la clé ne doit plus être calculée avec le mot de passe d’installation lui-même');
    vrai(in_array($avecSecretDerive, $cles, true),
        'elle doit l’être avec le secret dérivé (HMAC + étiquette d’usage)');
    // Et aucune clé ne contient l'identifiant en clair.
    foreach ($cles as $cle) {
        vrai(!str_contains($cle, $identifiant), 'aucun identifiant en clair dans la table des compteurs');
    }
    vider_compteurs();
});

verifier("lot 11 — verifier.php : dix mauvais mots de passe, puis la porte se ferme", function () {
    // Douze jusqu'au 29/10/2026 ; dix depuis le frein PARTAGÉ du lot
    // « correctifs de l'audit Codex » (ECHECS_JETON_INSTALLATION, lib/limite.php).
    vider_compteurs();
    for ($i = 0; $i < 10; $i++) {
        $r = formulaire('/verifier.php', ['jeton' => 'faux-' . $i]);
        vrai(str_contains($r['texte'], 'incorrect'), "essai " . ($i + 1) . " : refus ordinaire");
    }
    $r = formulaire('/verifier.php', ['jeton' => 'faux-encore']);
    // La page échappe les apostrophes (htmlspecialchars) : on cherche un
    // morceau de phrase qui n'en contient pas.
    vrai(str_contains($r['texte'], 'essais depuis cette adresse'),
        'le onzième essai est freiné — ' . substr(strip_tags($r['texte']), 0, 200));
    // Le BON mot de passe ne passe plus non plus pendant la fenêtre : sinon le
    // frein se contournerait en glissant un bon essai entre deux mauvais.
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(!str_contains($r['texte'], 'Tout est en ordre') && !str_contains($r['texte'], 'reste quelque chose'),
        'la page ne montre rien pendant la fenêtre de frein');
    vider_compteurs();
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'Tout est en ordre') || str_contains($r['texte'], 'reste quelque chose'),
        'après remise à zéro, le bon mot de passe ouvre la page');
});

verifier("lot 11 — verifier.php : seuls les échecs comptent, vingt vérifications de suite passent", function () {
    vider_compteurs();
    for ($i = 0; $i < 20; $i++) {
        $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
        vrai(str_contains($r['texte'], 'Tout est en ordre') || str_contains($r['texte'], 'reste quelque chose'),
            "vérification n°" . ($i + 1) . " : la page s'ouvre encore");
    }
    vider_compteurs();
});

verifier("lot 11 — en IPv6, c'est le bloc /64 qui compte, pas l'adresse", function () use ($racine) {
    require_once $racine . '/public/lib/limite.php';
    $avant = $_SERVER['REMOTE_ADDR'] ?? null;
    $essais = [
        // Deux adresses du MÊME abonné : un seul et même compteur.
        '2001:db8:1234:5678:1:2:3:4' => '2001:db8:1234:5678::/64',
        '2001:db8:1234:5678:aaaa:bbbb:cccc:dddd' => '2001:db8:1234:5678::/64',
        // Un autre bloc : un autre compteur.
        '2001:db8:1234:9999::1' => '2001:db8:1234:9999::/64',
        // IPv4 : inchangée, c'est déjà une adresse d'abonné.
        '203.0.113.4' => '203.0.113.4',
        // IPv4 écrite à la mode IPv6 : c'est une IPv4, on ne regroupe pas.
        '::ffff:203.0.113.4' => '::ffff:203.0.113.4',
    ];
    foreach ($essais as $adresse => $attendu) {
        $_SERVER['REMOTE_ADDR'] = $adresse;
        egal($attendu, adresse_limitee(), "$adresse");
    }
    if ($avant === null) unset($_SERVER['REMOTE_ADDR']); else $_SERVER['REMOTE_ADDR'] = $avant;
});

verifier("lot 11 — un prénom ne peut pas porter de HTML ni de caractère invisible", function () use (&$lot11) {
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $lot11['classe'],
        'nombre' => 1], ['jeton' => $lot11['jetonProprio']])['json']['eleves'][0];
    appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleve['id'],
        'prenom' => "<img src=x onerror=alert(1)>Lé\u{200B}a", 'initiale' => '<b>'], ['jeton' => $lot11['jetonProprio']]);
    $tableau = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $lot11['classe']],
        ['jeton' => $lot11['jetonProprio']])['json']['eleves'];
    $prenom = null;
    foreach ($tableau as $ligne) {
        if ((int)$ligne['id'] === (int)$eleve['id']) $prenom = (string)$ligne['prenom'];
    }
    vrai($prenom !== null, 'l’élève est dans le tableau');
    vrai(!str_contains($prenom, '<') && !str_contains($prenom, '>'), "aucun « < » ni « > » : obtenu " . json_encode($prenom));
    vrai(!str_contains($prenom, "\u{200B}"), 'aucun caractère invisible');
    vrai(str_contains($prenom, 'Léa'), "le vrai prénom est gardé : obtenu " . json_encode($prenom));
    appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $eleve['id']], ['jeton' => $lot11['jetonProprio']]);
});

verifier("lot 11 — une date impossible n'est plus enregistrée comme une date", function () use (&$lot11) {
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $lot11['classe'],
        'nombre' => 1], ['jeton' => $lot11['jetonProprio']])['json']['eleves'][0];
    $code = $eleve['code'];
    ecrire($code, ['version' => VERSION_TABLES, 'epoque' => '9999-99-99', 'dernier' => '2026-02-29'], 0);
    $lu = (array)lire($code)['json']['parcours'];
    vrai(!array_key_exists('epoque', $lu), '« 9999-99-99 » n’est pas une date : elle est retirée');
    vrai(!array_key_exists('dernier', $lu), '« 2026-02-29 » n’existe pas (2026 n’est pas bissextile) : retirée');
    ecrire($code, ['version' => VERSION_TABLES, 'epoque' => '2024-02-29'], 1);
    $lu = (array)lire($code)['json']['parcours'];
    egal('2024-02-29', $lu['epoque'] ?? null, 'le 29 février d’une année bissextile, lui, est gardé');
    appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $eleve['id']], ['jeton' => $lot11['jetonProprio']]);
});

verifier("lot 11 — la page élève ne publie plus le mode d'emploi du filtre", function () use (&$lot11) {
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $lot11['classe'],
        'nombre' => 1], ['jeton' => $lot11['jetonProprio']])['json']['eleves'][0];
    $r = identite($eleve['code']);
    egal(200, $r['code'], 'la page élève répond');
    $appli = $r['json']['applis'][0];
    foreach (['cles', 'mots', 'motifs'] as $champ) {
        vrai(!array_key_exists($champ, (array)$appli), "« $champ » n’a rien à faire dans la réponse");
    }
    foreach (['cle', 'nom', 'description', 'url', 'ancre', 'disponible'] as $champ) {
        vrai(array_key_exists($champ, (array)$appli), "« $champ » sert à l’affichage : il doit rester");
    }
    vrai(!str_contains($r['texte'], 'desordre'), 'aucun mot de la liste fermée dans la réponse');
    appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $eleve['id']], ['jeton' => $lot11['jetonProprio']]);
});

verifier("lot 11 — PHP n'annonce plus sa version dans les en-têtes", function () use (&$lot11) {
    foreach ([['/api/prof.php', ['action' => 'moi', 'jeton' => $lot11['jetonProprio']]],
              ['/api/eleve.php', ['code' => 'ZZZZZZ']]] as [$chemin, $corps]) {
        $r = appel($chemin, $corps);
        egal(null, entete($r, 'X-Powered-By'), "X-Powered-By ne doit plus sortir de $chemin");
    }
    $r = appel('/verifier.php', null);
    vrai(!str_contains(strtolower($r['entetes']), 'x-powered-by'), 'ni de la page de vérification');
});

verifier("lot 11 — une entrée de type inattendu ne salit plus le journal du serveur", function () use (&$lot11, $travail) {
    // Un client bricolé envoie un tableau là où le serveur attend un texte.
    // La réponse était déjà correcte ; c'est le JOURNAL qu'on vérifie ici :
    // « Array to string conversion » y noyait les vraies pannes.
    $avant = is_file($travail . '/serveur.log') ? (int)filesize($travail . '/serveur.log') : 0;
    appel('/api/prof.php', ['action' => 'classes.liste', 'jeton' => ['un', 'tableau']]);
    appel('/api/parcours.php', ['code' => 'ZZZZZZ', 'appli' => ['un', 'tableau'], 'lire' => true]);
    appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $lot11['classe'],
        'appli' => ['un', 'tableau'], 'jeton' => $lot11['jetonProprio']]);
    appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $lot11['eleve']['id'],
        'appli' => ['un', 'tableau'], 'jeton' => $lot11['jetonProprio']]);
    usleep(200000);
    $journal = is_file($travail . '/serveur.log') ? (string)file_get_contents($travail . '/serveur.log') : '';
    $nouveau = substr($journal, $avant);
    vrai(!str_contains($nouveau, 'Array to string conversion'),
        "le journal ne doit plus porter « Array to string conversion » : " . substr($nouveau, 0, 300));
});

// ================================================ LOT SERVEUR A (06/09/2026)
//
// Trois chantiers :
//  - l'historique : une version par JOUR, sept jours, heure de La Réunion ;
//  - le journal des actions du professeur, douze mois, sans rien de personnel ;
//  - la sauvegarde prise dans un instantané, et « nouveau code » en une
//    transaction.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) retirer la purge de enregistrer_version() → « neuf journées, sept gardées »
//  b) écrire la version du jour AVANT l'écriture au lieu d'APRÈS → « fin de journée »
//  c) écraser la ligne du jour pendant une restauration → « la journée reste »
//  d) remettre supprimer_classes_echues() dans classes.liste → « ouvrir ne supprime plus rien »
//  e) ne compter que progressions.maj_le comme activité → « cas A »
//  f) remettre le pivot au 1er août → « pivot au 1er JUILLET »
//  g) retirer une ligne journaliser() → le test de l'action correspondante
//  h) ranger le prénom ou le code dans le journal → « le journal ne dit RIEN de personnel »
//  i) sortir les trois écritures de « nouveau code » de la transaction → « ancien code intact »
//  j) sortir les SELECT de sauvegarde.php de l'instantané → « comptes et INSERT d'accord »

// L'époque d'un JSON de progression, et le même JSON sans elle : deux
// utilitaires du lot serveur B, employés dès la section du lot A.
function epoque_json(string $json): int
{
    $objet = json_decode($json, true);
    return is_array($objet) && isset($objet['epoque']) && is_int($objet['epoque']) ? $objet['epoque'] : 0;
}

function sans_epoque(string $json): array
{
    $objet = json_decode($json, true);
    if (!is_array($objet)) return [];
    unset($objet['epoque']);
    return $objet;
}

$serveurA = ['classe' => null, 'eleve' => null, 'jeton' => null];

verifier("lot A — mise en place : une classe, un élève, une progression", function () use (&$jetonS1, &$serveurA) {
    vider_compteurs();
    $serveurA['jeton'] = $jetonS1;
    $serveurA['classe'] = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot-A'],
        ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $serveurA['classe'],
        'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'];
    $serveurA['eleve'] = $eleves[0];
    egal(200, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $serveurA['eleve']['id'],
        'prenom' => 'Léa', 'initiale' => 'B'], ['jeton' => $jetonS1])['code'], 'un prénom connu, pour le test du journal');
    vrai(is_int($serveurA['classe']), 'la classe du lot A est créée');
});

verifier("lot A — le jour est celui de LA RÉUNION : 23 h 30 et 00 h 30 ne tombent pas le même jour", function () {
    // La Réunion est à UTC+4 toute l'année (pas d'heure d'été). Un élève qui
    // travaille le 8 septembre à 23 h 30 (19 h 30 UTC) doit voir « lundi 8 »,
    // pas « mardi 9 » : c'est le seul endroit du serveur qui quitte le temps
    // universel, et c'est pour cette raison-là.
    egal('2026-09-08', jour_local(strtotime('2026-09-08T19:30:00Z')), '23 h 30 à Saint-Denis');
    egal('2026-09-09', jour_local(strtotime('2026-09-08T20:30:00Z')), '00 h 30 le lendemain');
    egal('2026-09-08', jour_local(strtotime('2026-09-07T20:30:00Z')), 'et minuit et demi du 8');
    // La purge garde SEPT journées, aujourd'hui compris.
    egal('2026-09-02', premier_jour_garde('2026-09-08'), 'le plus ancien jour gardé');
});

verifier("lot A — trois enregistrements le même jour ne font qu'UNE ligne, égale au dernier état", function () use (&$serveurA) {
    $code = $serveurA['eleve']['code'];
    $id = (int)$serveurA['eleve']['id'];
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'calculs' => ['3-4' => ['cases' => 1]]], 0)['code'], '1er envoi');
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'calculs' => ['3-4' => ['cases' => 1], '5-6' => ['cases' => 1]]], 1)['code'], '2e');
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'calculs' => ['3-4' => ['cases' => 1], '5-6' => ['cases' => 1], '7-8' => ['cases' => 1]]], 2)['code'], '3e');

    $lignes = bd_test()->query("SELECT jour, revision, calculs, donnees FROM versions WHERE eleve_id = $id AND appli = 'defi-tables'")->fetchAll(PDO::FETCH_ASSOC);
    egal(1, count($lignes), 'une seule ligne pour la journée');
    egal(jour_local(), (string)$lignes[0]['jour'], 'la journée d’aujourd’hui, heure Réunion');
    egal(3, (int)$lignes[0]['revision'], 'elle porte la révision du dernier enregistrement');
    egal(3, (int)$lignes[0]['calculs'], 'et le nombre de calculs comptés par le serveur');
    vrai(str_contains((string)$lignes[0]['donnees'], '7-8'),
        'elle contient l’état APRÈS le dernier envoi : c’est « la fin de la journée »');
});

verifier("lot A — neuf journées enregistrées, SEPT gardées : les deux plus vieilles partent", function () use (&$serveurA) {
    $id = (int)$serveurA['eleve']['id'];
    // Neuf journées : les huit d'avant sont semées directement (on ne peut pas
    // attendre neuf jours), la neuvième est un vrai enregistrement d'aujourd'hui.
    bd_test()->exec("DELETE FROM versions WHERE eleve_id = $id");
    $aujourdhui = jour_local();
    for ($recul = 8; $recul >= 1; $recul--) {
        $jour = gmdate('Y-m-d', strtotime($aujourdhui . ' 12:00:00 UTC') - $recul * 86400);
        $requete = bd_test()->prepare('INSERT INTO versions (eleve_id, appli, jour, revision, calculs, donnees, maj_le) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $requete->execute([$id, 'defi-tables', $jour, 0, $recul, '{"version":1}', $jour . 'T12:00:00Z']);
    }
    egal(8, (int)bd_test()->query("SELECT COUNT(*) FROM versions WHERE eleve_id = $id")->fetchColumn(), 'huit journées semées');

    $r = lire($serveurA['eleve']['code']);
    egal(200, ecrire($serveurA['eleve']['code'], ['version' => VERSION_TABLES, 'calculs' => ['2-2' => ['cases' => 1]]], (int)$r['json']['revision'])['code'],
        'un enregistrement d’aujourd’hui');

    $jours = bd_test()->query("SELECT jour FROM versions WHERE eleve_id = $id ORDER BY jour")->fetchAll(PDO::FETCH_COLUMN);
    egal(7, count($jours), 'sept journées gardées, pas neuf');
    egal(premier_jour_garde($aujourdhui), (string)$jours[0], 'la plus ancienne est celle d’il y a six jours');
    egal($aujourdhui, (string)$jours[6], 'la plus récente est aujourd’hui');
});

verifier("lot A — « Revenir à… » : le tableau reçoit les journées et leur nombre de calculs, jamais les données", function () use (&$serveurA) {
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $serveurA['classe']], ['jeton' => $serveurA['jeton']]);
    egal(200, $r['code'], 'tableau');
    $ligne = null;
    foreach ($r['json']['eleves'] as $eleve) {
        if ((int)$eleve['id'] === (int)$serveurA['eleve']['id']) $ligne = $eleve;
    }
    vrai($ligne !== null, 'l’élève est dans le tableau');
    vrai(is_array($ligne['journees']), 'la liste des journées est là');
    // Six journées proposées sur sept : celle d'aujourd'hui EST l'état actuel.
    egal(6, count($ligne['journees']), 'la journée qui porte la révision du moment n’est pas proposée');
    foreach ($ligne['journees'] as $journee) {
        vrai(array_key_exists('jour', $journee) && array_key_exists('calculs', $journee), 'jour et nombre de calculs');
        vrai(!array_key_exists('donnees', $journee) && !array_key_exists('parcours', $journee),
            'JAMAIS les données : sept progressions par élève, ce sont des mégaoctets à chaque ouverture');
    }
});

verifier("lot A — revenir à la fin d'une journée précise, et pouvoir revenir en arrière", function () use (&$serveurA) {
    $id = (int)$serveurA['eleve']['id'];
    $code = $serveurA['eleve']['code'];
    // Une journée J-2 reconnaissable, écrite à la main dans l'historique.
    $jourCible = gmdate('Y-m-d', strtotime(jour_local() . ' 12:00:00 UTC') - 2 * 86400);
    bd_test()->prepare('UPDATE versions SET donnees = ?, calculs = ? WHERE eleve_id = ? AND jour = ?')
        ->execute(['{"version":1,"expert":42}', 1, $id, $jourCible]);

    $avant = bd_test()->query("SELECT donnees, revision FROM progressions WHERE eleve_id = $id")->fetch(PDO::FETCH_ASSOC);
    $r = appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id,
        'appli' => 'defi-tables', 'jour' => $jourCible], ['jeton' => $serveurA['jeton']]);
    egal(200, $r['code'], 'restauration d’une journée');

    $apres = bd_test()->query("SELECT donnees, donnees_avant, revision FROM progressions WHERE eleve_id = $id")->fetch(PDO::FETCH_ASSOC);
    vrai(str_contains((string)$apres['donnees'], '42'), 'la progression est celle de la journée demandée');
    egal((int)$avant['revision'] + 1, (int)$apres['revision'], 'la révision monte d’un cran');
    egal((string)$avant['donnees'], (string)$apres['donnees_avant'], 'l’état d’avant devient la version précédente : on peut annuler');

    // AUCUNE ligne de l'historique n'est touchée par une restauration.
    // Celle du jour demandé, sinon on ne pourrait pas y revenir une seconde
    // fois ; et celle d'AUJOURD'HUI, qui garde l'état d'avant la restauration
    // — c'est le seul moyen de revenir sur une restauration malheureuse une
    // fois que l'élève a réenregistré (donnees_avant, elle, aura été remplacée).
    $ligne = bd_test()->query("SELECT donnees FROM versions WHERE eleve_id = $id AND jour = '$jourCible'")->fetch(PDO::FETCH_ASSOC);
    vrai(str_contains((string)$ligne['donnees'], '42'), 'la journée restaurée reste dans l’historique');
    $duJour = bd_test()->query("SELECT donnees FROM versions WHERE eleve_id = $id AND jour = '" . jour_local() . "'")->fetch(PDO::FETCH_ASSOC);
    vrai($duJour !== false, 'la journée d’aujourd’hui est bien là');
    egal((string)$avant['donnees'], (string)$duJour['donnees'],
        'la version du jour garde l’état d’AVANT la restauration : restaurer n’écrase pas l’historique');

    // Annuler la restauration : « avant le dernier enregistrement ».
    egal(200, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id, 'appli' => 'defi-tables'],
        ['jeton' => $serveurA['jeton']])['code'], 'retour en arrière');
    $final = bd_test()->query("SELECT donnees FROM progressions WHERE eleve_id = $id")->fetch(PDO::FETCH_ASSOC);
    // « À l'époque près » depuis le lot serveur B : chaque restauration repose
    // une époque plus haute, sans quoi l'appareil de l'élève rendrait l'état
    // qu'on vient d'écarter (voir la section B0 plus bas). Le CONTENU, lui,
    // doit être exactement celui d'avant.
    egal(sans_epoque((string)$avant['donnees']), sans_epoque((string)$final['donnees']),
        'on est revenu exactement où on était, à l’époque près');
    vrai(epoque_json((string)$final['donnees']) > epoque_json((string)$avant['donnees']),
        'et l’époque a monté : l’appareil de l’élève adoptera cet état');
    // L'élève, lui, retrouvera tout ça par la révision.
    vrai(is_array(lire($code)['json'] ?? null), 'l’élève relit sa progression');
});

verifier("lot A — une journée qui n'existe pas : 404, et rien n'a changé", function () use (&$serveurA) {
    $id = (int)$serveurA['eleve']['id'];
    $avant = (string)bd_test()->query("SELECT donnees FROM progressions WHERE eleve_id = $id")->fetchColumn();
    $r = appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id,
        'appli' => 'defi-tables', 'jour' => '2020-01-01'], ['jeton' => $serveurA['jeton']]);
    egal(404, $r['code'], 'une journée hors historique');
    egal(400, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id,
        'appli' => 'defi-tables', 'jour' => '9999-99-99'], ['jeton' => $serveurA['jeton']])['code'], 'une fausse date');
    egal(400, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id,
        'appli' => 'defi-tables', 'jour' => ['un', 'tableau']], ['jeton' => $serveurA['jeton']])['code'], 'un type inattendu');
    egal($avant, (string)bd_test()->query("SELECT donnees FROM progressions WHERE eleve_id = $id")->fetchColumn(), 'rien n’a bougé');
});

verifier("lot A — supprimer l'élève, puis la classe, emporte l'historique", function () use (&$jetonS1) {
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot-A-suppression'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    foreach ($eleves as $eleve) {
        egal(200, ecrire($eleve['code'], ['version' => VERSION_TABLES, 'calculs' => ['2-3' => ['cases' => 1]]], 0)['code'], 'une progression');
    }
    $un = (int)$eleves[0]['id'];
    $deux = (int)$eleves[1]['id'];
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM versions WHERE eleve_id = $un")->fetchColumn(), 'une version pour le premier');

    egal(200, appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $un], ['jeton' => $jetonS1])['code'], 'élève supprimé');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM versions WHERE eleve_id = $un")->fetchColumn(), 'son historique est parti avec lui');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM versions WHERE eleve_id = $deux")->fetchColumn(), 'celui de l’autre est intact');

    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1])['code'], 'classe supprimée');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM versions WHERE eleve_id = $deux")->fetchColumn(), 'plus une seule version');
});

// ------------------------------------------------------------------ journal

verifier("lot A — le journal écrit UNE ligne par action du professeur", function () use (&$jetonS1, &$jetonClaire, &$claireId) {
    bd_test()->exec('DELETE FROM journal');
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot-A-journal'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'];
    $eleveId = (int)$eleves[0]['id'];
    appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleveId, 'prenom' => 'Léa', 'initiale' => 'B'], ['jeton' => $jetonS1]);
    ecrire($eleves[0]['code'], ['version' => VERSION_TABLES], 0);
    ecrire($eleves[0]['code'], ['version' => VERSION_TABLES, 'expert' => 1], 1);
    appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $eleveId], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'eleves.regenerer', 'eleve_id' => $eleveId], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleveId, 'avant' => new stdClass(), 'ajouts' => ['coffres' => new stdClass()]], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe, 'libelle' => 'lot-A-journal-2'], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classe, 'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $classe, 'prof_id' => $claireId], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $eleveId], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);

    $comptes = [];
    foreach (bd_test()->query("SELECT action, COUNT(*) AS n FROM journal WHERE resultat = 'ok' GROUP BY action")->fetchAll(PDO::FETCH_ASSOC) as $ligne) {
        $comptes[(string)$ligne['action']] = (int)$ligne['n'];
    }
    foreach (['classes.creer', 'eleves.ajouter', 'eleves.nommer', 'eleves.restaurer', 'eleves.regenerer', 'eleves.acces',
              'classes.modifier', 'partages.ajouter', 'partages.supprimer', 'eleves.supprimer', 'classes.supprimer'] as $action) {
        egal(1, $comptes[$action] ?? 0, "« $action » doit écrire exactement une ligne");
    }
    // L'élève qui enregistre, lui, n'écrit RIEN au journal : ce n'est pas un
    // registre de ce que font les enfants.
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE cible_type = 'eleve' AND action = 'connexion'")->fetchColumn(),
        'aucune ligne pour les envois de l’élève');
});

verifier("lot A — un refus de droit laisse une ligne « refus »", function () use (&$jetonS1, &$jetonClaire, &$claireId) {
    bd_test()->exec('DELETE FROM journal');
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot-A-refus'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'];
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classe, 'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jetonS1]);
    // Claire, en LECTURE, essaie d'écrire : c'est exactement ce qu'un registre
    // doit pouvoir montrer.
    egal(403, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleves[0]['id'],
        'prenom' => 'Intrus', 'initiale' => 'X'], ['jeton' => $jetonClaire])['code'], 'refusé');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'eleves.nommer' AND resultat = 'refus'")->fetchColumn(),
        'une ligne « refus » au nom de Claire');
    egal($claireId, (int)bd_test()->query("SELECT prof_id FROM journal WHERE resultat = 'refus' ORDER BY id DESC LIMIT 1")->fetchColumn(),
        'et c’est bien son compte');
    // Une action d'administration refusée aussi : Claire n'est pas
    // administratrice, elle ne réinitialise le mot de passe de personne.
    egal(403, appel('/api/prof.php', ['action' => 'profs.reinitialiser', 'prof_id' => 1], ['jeton' => $jetonClaire])['code'], 'refusé');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'profs.reinitialiser' AND resultat = 'refus'")->fetchColumn(),
        'une action réservée à l’administrateur, refusée et notée');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);
});

verifier("lot A — le journal ne dit RIEN de personnel : ni prénom, ni code, ni adresse", function () use (&$jetonS1) {
    bd_test()->exec('DELETE FROM journal');
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot-A-prive'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'];
    $code = (string)$eleves[0]['code'];
    appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleves[0]['id'], 'prenom' => 'Léa', 'initiale' => 'B'], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'eleves.regenerer', 'eleve_id' => $eleves[0]['id']], ['jeton' => $jetonS1]);

    $tout = '';
    foreach (bd_test()->query('SELECT * FROM journal')->fetchAll(PDO::FETCH_ASSOC) as $ligne) {
        foreach ($ligne as $valeur) $tout .= '|' . (string)$valeur;
    }
    vrai($tout !== '', 'le journal n’est pas vide (sinon ce test ne prouve rien)');
    vrai(!str_contains($tout, 'Léa'), "aucun prénom dans le journal : " . substr($tout, 0, 200));
    vrai(!str_contains($tout, $code), "aucun code élève dans le journal");
    vrai(!str_contains($tout, 'lot-A-prive'), "aucun nom de classe dans le journal");
    vrai(!str_contains($tout, 'gwenael'), "aucun identifiant de professeur : le journal ne range que son numéro");
    vrai(!str_contains($tout, '127.0.0.1'), "aucune adresse IP");
    // Et les colonnes sont bien celles annoncées, ni plus ni moins.
    $colonnes = array_keys(bd_test()->query('SELECT * FROM journal LIMIT 1')->fetch(PDO::FETCH_ASSOC));
    sort($colonnes);
    egal(['action', 'cible_id', 'cible_type', 'id', 'prof_id', 'quand', 'resultat'], $colonnes, 'les colonnes du journal');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);
});

verifier("lot A — une action inventée n'entre pas dans le journal, et une connexion réussie y entre", function () use (&$jetonS1) {
    bd_test()->exec('DELETE FROM journal');
    journaliser(bd_test(), 1, 'action.inventee', 'classe', 1);
    journaliser(bd_test(), 1, 'classes.creer', 'cible-inventee', 1);
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM journal')->fetchColumn(),
        'la liste fermée tient : rien d’autre ne peut entrer');
    $r = connexion('gwenael', 'phrase-de-secours-2026');
    vrai(is_string($r['json']['jeton'] ?? null), 'connexion réussie');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'connexion'")->fetchColumn(), 'une ligne');
    egal(200, appel('/api/prof.php', ['action' => 'deconnexion'], ['jeton' => $r['json']['jeton']])['code'], 'déconnexion');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'deconnexion'")->fetchColumn(), 'et une pour la sortie');
    // Un échec de connexion, lui, n'écrit rien : pas de compte fiable à nommer.
    appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'gwenael', 'motdepasse' => 'raté']);
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'connexion'")->fetchColumn(), 'toujours une seule');
    vider_compteurs();
});

verifier("lot A — verifier.php montre le journal, mais seulement avec le mot de passe", function () use (&$jetonS1) {
    bd_test()->exec("INSERT INTO journal (quand, prof_id, action, cible_type, cible_id, resultat) VALUES ('" . maintenant() . "', 1, 'connexion', 'session', 0, 'ok')");
    $r = appel('/verifier.php');
    vrai(!str_contains($r['texte'], 'Dernières actions'), 'sans le mot de passe, aucun journal');
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'Dernières actions'), 'avec le mot de passe, le journal s’affiche');
    vrai(str_contains($r['texte'], htmlspecialchars("Historique et journal", ENT_QUOTES)), 'et la ligne de diagnostic');
    vrai(str_contains($r['texte'], 'journée(s) gardée(s)'), 'qui compte les journées gardées');
    // Le ménage efface au-delà de douze mois.
    bd_test()->exec("INSERT INTO journal (quand, prof_id, action, cible_type, cible_id, resultat) VALUES ('2020-01-01T00:00:00Z', 1, 'connexion', 'session', 0, 'ok')");
    egal(1, purger_journal(bd_test()), 'une ligne de 2020 est effacée');
});

// ------------------------------------------------ instantané et transaction

verifier("lot A — la sauvegarde est prise dans un instantané : comptes et INSERT d'accord", function () {
    $r = formulaire('/sauvegarde.php', ['jeton' => 'JETON-DE-TEST', 'etape' => 'telecharger',
        'phrase' => 'phrase-de-sauvegarde-2026', 'repete' => 'phrase-de-sauvegarde-2026']);
    $brut = $r['texte'];
    $sel = substr($brut, 8, 8);
    $matiere = hash_pbkdf2('sha256', 'phrase-de-sauvegarde-2026', $sel, 200000, 48, true);
    $clair = (string)openssl_decrypt(substr($brut, 16), 'aes-256-cbc', substr($matiere, 0, 32), OPENSSL_RAW_DATA, substr($matiere, 32, 16));
    vrai(str_contains($clair, 'maths&go'), 'le fichier se déchiffre');
    // Les nouvelles tables y sont.
    foreach (['versions', 'journal'] as $table) {
        vrai(str_contains($clair, "EXISTS $table (") || str_contains($clair, "CREATE TABLE `$table`"),
            "la structure de $table doit être dans la sauvegarde");
    }
    // L'en-tête annonce N lignes par table ; le corps en contient exactement N.
    // Hors instantané, les comptes étaient pris AVANT les SELECT : un envoi
    // d'élève pendant l'export les mettait en désaccord.
    foreach (['profs', 'classes', 'eleves', 'progressions', 'partages', 'versions', 'journal'] as $table) {
        vrai(preg_match('/^-- ' . $table . ' : (\d+) ligne\(s\)$/m', $clair, $m) === 1, "l’en-tête compte $table");
        egal((int)$m[1], substr_count($clair, "INSERT INTO `$table` ("), "$table : autant d’INSERT que d’annoncé");
    }
});

verifier("lot A — l'instantané ne voit pas une écriture faite après son ouverture (MySQL)", function () {
    if (pilote_test() !== 'mysql') {
        // SQLite garde une transaction de lecture cohérente elle aussi, mais
        // une écriture concurrente y est REFUSÉE (« database is locked ») au
        // lieu d'être invisible : on ne peut pas le montrer de la même façon.
        // On éprouve alors ce qui est éprouvable : l'instantané s'ouvre, se
        // ferme, et ne laisse pas la connexion en transaction.
        $pdo = bd_test();
        instantane_ouvrir($pdo);
        $pdo->query('SELECT COUNT(*) FROM classes')->fetchColumn();
        instantane_fermer($pdo);
        $pdo->exec('CREATE TABLE IF NOT EXISTS essai_instantane (id INTEGER)');
        $pdo->exec('DROP TABLE essai_instantane');
        return;
    }
    $lecteur = new PDO($GLOBALS['bdTest']['dsn'], $GLOBALS['bdTest']['utilisateur'] ?? null,
        $GLOBALS['bdTest']['motdepasse'] ?? null,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    instantane_ouvrir($lecteur);
    $avant = (int)$lecteur->query('SELECT COUNT(*) FROM classes')->fetchColumn();
    bd_test()->exec("INSERT INTO classes (prof_id, libelle, applis, cree_le) VALUES (1, 'instantane', 'defi-tables', '" . maintenant() . "')");
    $pendant = (int)$lecteur->query('SELECT COUNT(*) FROM classes')->fetchColumn();
    instantane_fermer($lecteur);
    egal($avant, $pendant, 'la classe créée après l’ouverture de l’instantané n’y apparaît pas');
    $apres = (int)bd_test()->query('SELECT COUNT(*) FROM classes')->fetchColumn();
    egal($avant + 1, $apres, 'elle existe pourtant bien');
    bd_test()->exec("DELETE FROM classes WHERE libelle = 'instantane'");
});

verifier("lot A — « nouveau code » est une seule transaction : une panne laisse l'ancien code intact", function () use (&$jetonS1) {
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot-A-transaction'], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $ancien = (string)$eleve['code'];

    // Panne injectée pour de bon : la table des billets disparaît. La troisième
    // écriture de « nouveau code » échoue ; sans transaction, le code aurait
    // déjà changé — et un billet émis sous l'ancien serait resté valable.
    bd_test()->exec('DROP TABLE billets');
    $r = appel('/api/prof.php', ['action' => 'eleves.regenerer', 'eleve_id' => $eleve['id']], ['jeton' => $jetonS1]);
    egal(500, $r['code'], 'la panne remonte proprement');
    egal($ancien, (string)bd_test()->query('SELECT code FROM eleves WHERE id = ' . (int)$eleve['id'])->fetchColumn(),
        'l’ancien code est intact : rien n’a été à moitié fait');

    installer_tables(bd_test());
    $r = appel('/api/prof.php', ['action' => 'eleves.regenerer', 'eleve_id' => $eleve['id']], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'la table revenue, le nouveau code passe');
    vrai((string)$r['json']['code'] !== $ancien, 'et c’est un code neuf');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);
});

// ============================================================ LOT SERVEUR B (06/09/2026)
//
// Hygiène du serveur, et un défaut trouvé en production le jour même : la
// restauration ne gagnait pas contre l'appareil de l'élève.
//
// Sabotages attendus (chacun rend au moins un test rouge) :
//  a) retirer l'incrément d'époque de version_avec_epoque_relevee()
//  b) remettre le 429 sur le seuil par identifiant (api/prof.php)
//  c) remettre adresse_appelante() dans secours.php ou sauvegarde.php
//  d) retirer la borne des 72 octets de motdepasse_refuse()
//  e) enlever header_remove('X-Powered-By') de menage.php
//  f) remettre <Files "config.php"> à la place de <FilesMatch "^config">
//  g) retirer le nombre annoncé de l'en-tête du manifeste, ou sa comparaison
//     dans verifier.php
//
// (b), (f) et (g) ont leur test plus haut : ils vivent avec le code qu'ils
// gardent — B1 dans la section des limiteurs, le manifeste dans celle du lot 12.

verifier("lot B — une restauration repose une époque plus haute que les DEUX états en présence", function () use (&$jetonS1) {
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot-B-epoque'], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $id = (int)$eleve['id'];
    $code = (string)$eleve['code'];

    // L'élève enregistre deux fois : la deuxième écriture pousse la première
    // dans donnees_avant. Les deux portent une époque de 5 — c'est le cas de
    // Gwenaël : rien n'a été remis à zéro, l'élève a simplement joué.
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'epoque' => 5, 'expert' => 1], 0)['code'], 'premier enregistrement');
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'epoque' => 5, 'expert' => 2], 1)['code'], 'deuxième enregistrement');

    // Le professeur restaure « avant le dernier enregistrement ».
    egal(200, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id, 'appli' => 'defi-tables'],
        ['jeton' => $jetonS1])['code'], 'restauration');
    $apres = (string)bd_test()->query("SELECT donnees FROM progressions WHERE eleve_id = $id")->fetchColumn();
    egal(1, sans_epoque($apres)['expert'] ?? null, 'c’est bien l’état d’avant qui est revenu');
    egal(6, epoque_json($apres),
        'et son époque dépasse les deux états (5 et 5) : sans cela, l’appareil de l’élève rendrait l’état écarté');

    // Deuxième restauration (celle qui annule la première) : l'époque monte
    // encore. Basculer d'une version à l'autre reste donc décisif à chaque
    // fois — c'est ce que Gwenaël a essayé, et qui convergeait vers « tout ».
    egal(200, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id, 'appli' => 'defi-tables'],
        ['jeton' => $jetonS1])['code'], 'on annule la restauration');
    $encore = (string)bd_test()->query("SELECT donnees FROM progressions WHERE eleve_id = $id")->fetchColumn();
    egal(2, sans_epoque($encore)['expert'] ?? null, 'l’état de départ est revenu');
    egal(7, epoque_json($encore), 'et l’époque a encore monté');

    // Restaurer une JOURNÉE fait pareil, et la ligne d'historique, elle, garde
    // son époque d'origine (sans importance : c'est au moment de restaurer
    // qu'on en repose une plus haute).
    $jour = jour_local();
    bd_test()->prepare('UPDATE versions SET donnees = ? WHERE eleve_id = ? AND jour = ?')
        ->execute(['{"version":1,"epoque":2,"expert":9}', $id, $jour]);
    egal(200, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id,
        'appli' => 'defi-tables', 'jour' => $jour], ['jeton' => $jetonS1])['code'], 'restauration d’une journée');
    $parJour = (string)bd_test()->query("SELECT donnees FROM progressions WHERE eleve_id = $id")->fetchColumn();
    egal(9, sans_epoque($parJour)['expert'] ?? null, 'la journée est revenue');
    egal(8, epoque_json($parJour), 'avec une époque plus haute que l’état courant (7), pas celle de la ligne (2)');
    egal(2, epoque_json((string)bd_test()->query("SELECT donnees FROM versions WHERE eleve_id = $id AND jour = '$jour'")->fetchColumn()),
        'la ligne d’historique, elle, n’a pas bougé');

    // Rien d'autre n'entre par cette porte : la version restaurée repasse par
    // le filtre de lib/progression.php, comme n'importe quelle écriture.
    bd_test()->prepare('UPDATE versions SET donnees = ? WHERE eleve_id = ? AND jour = ?')
        ->execute(['{"version":1,"epoque":1,"prenom":"Léa","expert":3}', $id, $jour]);
    egal(200, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id,
        'appli' => 'defi-tables', 'jour' => $jour], ['jeton' => $jetonS1])['code'], 'restauration');
    $filtre = (string)bd_test()->query("SELECT donnees FROM progressions WHERE eleve_id = $id")->fetchColumn();
    vrai(!str_contains($filtre, 'Léa'), 'aucun texte libre ne peut entrer par la restauration');

    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);
});

// Lot « petits correctifs de sécurité » (11/11/2026), constat F03 de l'audit
// GPT du 09/11 : quelqu'un qui connaît le code envoyait « epoque: 1000000 » ;
// la restauration du professeur relevait à 1 000 001, le filtre retirait la
// valeur hors bornes, et la mauvaise copie gagnait toutes les fusions. Passé
// 100, une écriture d'élève ne monte plus l'époque que d'un cran ; la
// restauration gagne donc toujours. Sabotages : retirer l'un des deux appels
// d'epoque_bornee dans api/parcours.php, ou le min() de
// version_avec_epoque_relevee.
require_once dirname(__DIR__) . '/public/lib/progression.php';

verifier("F03 — passé 100, une écriture d'élève ne fait monter l'époque que d'un cran, la valeur maximale comprise ; la restauration du professeur gagne toujours", function () use (&$jetonS1) {
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'F03-epoque'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    $id = (int)$eleves[0]['id'];
    $code = (string)$eleves[0]['code'];
    $donnees = fn() => (string)bd_test()->query("SELECT donnees FROM progressions WHERE eleve_id = $id AND appli = 'defi-tables'")->fetchColumn();
    $tables = fn(string $json) => array_map('strval', array_keys(json_decode($json, true)['tables'] ?? []));
    $neuf = ['2' => ['acquise' => '2026-11-02'], '3' => ['acquise' => '2026-11-03'], '9' => ['acquise' => '2026-11-09']];

    // Léa travaille (trois tables suffisent ici). Une époque ordinaire, même
    // au-dessus de « 0 + 1 », passe telle quelle : sous 100, rien ne change.
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'epoque' => 3, 'tables' => $neuf], 0)['code'], 'Léa enregistre');
    egal(3, epoque_json($donnees()), 'une époque ordinaire passe telle quelle');

    // Tom, qui a photographié la bandelette, écrase avec l'époque maximale.
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'epoque' => PROGRESSION_ENTIER_MAX, 'tables' => new stdClass()], 1)['code'],
        'l’écriture est acceptée (un code permet d’écrire : limite assumée du modèle)');
    $abime = $donnees();
    egal(100, epoque_json($abime), 'mais l’époque s’arrête à 100, pas à 1 000 000');
    egal([], $tables($abime), 'le reste de l’envoi est rangé tel quel');
    egal(100, epoque_json((string)bd_test()->query("SELECT donnees FROM versions WHERE eleve_id = $id AND appli = 'defi-tables' ORDER BY jour DESC LIMIT 1")->fetchColumn()),
        'la version du jour garde la même époque bornée');

    // Le professeur restaure : l'époque passe au-dessus de l'état abîmé, et
    // l'appareil de Léa, qui a pris la copie abîmée (100), l'adoptera.
    egal(200, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id, 'appli' => 'defi-tables'],
        ['jeton' => $jetonS1])['code'], 'restauration');
    $restaure = $donnees();
    egal(101, epoque_json($restaure), 'la version restaurée porte une époque (101) plus haute que la copie abîmée (100)');
    egal(['2', '3', '9'], $tables($restaure), 'les tables de Léa sont revenues');

    // Tom recommence : passé 100, chaque écriture ne gagne qu'un cran, et une
    // nouvelle restauration repasse devant.
    $base = (int)lire($code)['json']['revision'];
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'epoque' => 999999, 'tables' => new stdClass()], $base)['code'], 'Tom réécrit');
    egal(102, epoque_json($donnees()), '101 → 102');
    egal(200, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id, 'appli' => 'defi-tables'],
        ['jeton' => $jetonS1])['code'], 'nouvelle restauration');
    egal(103, epoque_json($donnees()), 'elle gagne encore');

    // Une époque égale ou plus basse n'est pas touchée (l'appli a fusionné).
    $base = (int)lire($code)['json']['revision'];
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'epoque' => 103, 'tables' => $neuf], $base)['code'], 'écriture ordinaire');
    egal(103, epoque_json($donnees()), 'même époque : gardée');
    // Un saut de plusieurs crans au-dessus de 100 : ramené à « + 1 », il
    // gagne pareil contre l'état du serveur.
    $base = (int)lire($code)['json']['revision'];
    egal(200, ecrire($code, ['version' => VERSION_TABLES, 'epoque' => 107, 'tables' => $neuf], $base)['code'], 'saut de quatre');
    egal(104, epoque_json($donnees()), '103 → 104 : toujours au-dessus de l’état du serveur');

    // Première écriture d'un élève neuf, directement au maximum : 100.
    egal(200, ecrire((string)$eleves[1]['code'], ['version' => VERSION_TABLES, 'epoque' => PROGRESSION_ENTIER_MAX, 'tables' => $neuf], 0)['code'], 'premier envoi');
    $autre = (int)$eleves[1]['id'];
    egal(100, epoque_json((string)bd_test()->query("SELECT donnees FROM progressions WHERE eleve_id = $autre")->fetchColumn()), 'le serveur n’avait rien : au plus 100');

    // Un état d'AVANT ce lot déjà au maximum (posé à la main) : la
    // restauration garde une époque, au plafond, au lieu de la perdre.
    bd_test()->prepare("UPDATE progressions SET donnees = ?, donnees_avant = ? WHERE eleve_id = ? AND appli = 'defi-tables'")
        ->execute(['{"version":4,"epoque":' . PROGRESSION_ENTIER_MAX . ',"tables":{}}', '{"version":4,"epoque":3,"tables":{"7":{"acquise":"2026-11-07"}}}', $id]);
    egal(200, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $id, 'appli' => 'defi-tables'],
        ['jeton' => $jetonS1])['code'], 'restauration depuis un état au plafond');
    egal(PROGRESSION_ENTIER_MAX, epoque_json($donnees()), 'l’époque reste au plafond : elle n’est plus retirée par le filtre');

    // Les deux fonctions, seules.
    $json = '{"version":4,"epoque":500,"tables":{"7":{"acquise":"2026-11-07"}},"calculs":{}}';
    egal('{"version":4,"epoque":201,"tables":{"7":{"acquise":"2026-11-07"}},"calculs":{}}', epoque_bornee($json, 200),
        'seule l’époque change, l’ordre des clés et « {} » sont gardés');
    egal($json, epoque_bornee($json, 499), '500 = 499 + 1 : rien à changer');
    egal($json, epoque_bornee($json, 800), 'plus bas que l’état courant : rien à changer');
    egal('{"epoque":100}', epoque_bornee('{"epoque":5000}', 0), 'depuis rien : 100 au plus');
    egal('{"epoque":42}', epoque_bornee('{"epoque":42}', 0), 'sous 100 : telle quelle');
    egal('{"version":4}', epoque_bornee('{"version":4}', 5), 'sans époque : rien à changer');
    egal(PROGRESSION_ENTIER_MAX, epoque_json(version_avec_epoque_relevee('defi-tables', '{"version":4,"epoque":2}', '{"epoque":' . PROGRESSION_ENTIER_MAX . '}')),
        'la restauration ne dépasse jamais le plafond');

    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);
});

verifier("lot B — les freins de secours.php et sauvegarde.php comptent le bloc /64", function () {
    // M-02 : en IPv6 un abonné reçoit un /64 entier et en change à volonté.
    // Compter l'adresse exacte, c'est offrir dix essais neufs à chaque requête.
    // Le serveur de test répond toujours depuis 127.0.0.1 : ce qui se vérifie
    // ici, c'est que les deux pages emploient bien la CLÉ du bloc — et
    // adresse_limitee() a son propre test plus haut (lot 11).
    // Depuis le lot « correctifs de l'audit Codex » (29/10/2026), les deux
    // pages passent par le frein PARTAGÉ de lib/limite.php, dont la clé est
    // le bloc : « jeton-installation: » . adresse_limitee().
    $limite = (string)file_get_contents(dirname(__DIR__) . '/public/lib/limite.php');
    vrai(str_contains($limite, "return 'jeton-installation:' . adresse_limitee();"), 'la clé partagée compte le bloc');
    vrai(!str_contains($limite, "'jeton-installation:' . adresse_appelante("), 'et pas l’adresse exacte');
    foreach (['secours.php', 'sauvegarde.php'] as $fichier) {
        $source = (string)file_get_contents(dirname(__DIR__) . '/public/' . $fichier);
        vrai(str_contains($source, "verdict_jeton_installation((string)(\$_POST['jeton'] ?? ''))"),
            "$fichier doit passer par le frein partagé");
        vrai(!str_contains($source, "compter('") , "$fichier n’a plus de compteur à lui");
    }
    // Et pour de vrai : deux adresses du même /64 tombent sur la même clé de
    // compteur, deux /64 différents sur deux clés.
    $avant = $_SERVER['REMOTE_ADDR'] ?? null;
    $cle = function (string $adresse): string {
        $_SERVER['REMOTE_ADDR'] = $adresse;
        return cle_compteur_test('jeton-installation:' . adresse_limitee(), 600);
    };
    $a = $cle('2001:db8:1234:5678::1');
    $b = $cle('2001:db8:1234:5678:ffff::9');
    $c = $cle('2001:db8:1234:9999::1');
    if ($avant === null) unset($_SERVER['REMOTE_ADDR']); else $_SERVER['REMOTE_ADDR'] = $avant;
    egal($a, $b, 'deux adresses du même /64 partagent le compteur');
    vrai($a !== $c, 'deux /64 différents ne le partagent pas');
});

verifier("lot B — un mot de passe de plus de 72 octets est refusé (bcrypt n’en lit pas plus)", function () use (&$jetonS1) {
    // bcrypt ne lit que 72 octets et jette le reste sans rien dire : deux
    // phrases identiques sur 72 octets ouvrent le même compte. Compté en
    // OCTETS, pas en caractères — « é » en vaut deux.
    $r = appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'phrase-de-secours-2026',
        'nouveau' => str_repeat('a', 73)], ['jeton' => $jetonS1]);
    egal(400, $r['code'], '73 octets : refusé');
    vrai(str_contains((string)($r['json']['erreur'] ?? ''), '12 à 72 caractères'), 'et la règle est dite en français');
    // 36 caractères accentués = 72 octets : accepté. 37 = 74 octets : refusé.
    egal(72, strlen(str_repeat('é', 36)), 'témoin : 36 « é » font 72 octets');
    $r = appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'phrase-de-secours-2026',
        'nouveau' => str_repeat('é', 37)], ['jeton' => $jetonS1]);
    egal(400, $r['code'], '37 lettres accentuées font 74 octets : refusé, alors qu’un maxlength les aurait laissées passer');
    $nouveau = str_repeat('é', 36);
    egal(200, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => 'phrase-de-secours-2026',
        'nouveau' => $nouveau], ['jeton' => $jetonS1])['code'], '72 octets tout juste : accepté');
    egal(200, connexion('gwenael', $nouveau)['code'], 'et il ouvre le compte');
    // On remet le mot de passe attendu par la suite de la batterie.
    egal(200, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $nouveau,
        'nouveau' => 'phrase-de-secours-2026'], ['jeton' => $jetonS1])['code'], 'remise en état');
    vider_compteurs();
});

verifier("lot B — menage.php refuse par HTTP SANS annoncer la version de PHP", function () {
    // M-04 : c'était la seule réponse du serveur qui portait encore
    // « X-Powered-By ». En production, le .htaccess la refuse avant même
    // d'appeler PHP ; ici (serveur intégré, pas de .htaccess), c'est le
    // header_remove() du fichier qui est éprouvé — les deux verrous existent.
    $r = appel('/menage.php');
    egal(404, $r['code'], 'refusé par HTTP');
    vrai(entete($r, 'X-Powered-By') === null, 'et sans annoncer la version de PHP');
    egal('', trim((string)$r['texte']), 'ni rien d’autre');
});

// ---------------------------------------------- lot « splat-suivi-3 » (07/10/2026)
//
// Le serveur apprend SPLAT! : la clé « splat » (à la place de
// « splat-equations », qui n'avait jamais servi), une liste fermée de
// parcours — celle de la carte des mondes, recopiée dans le moteur
// assets/js/splat-parcours.js —, et la copie du moteur dans prof/. Rien ne
// change chez l'élève ni chez le professeur tant qu'aucune classe n'a
// « splat » dans sa liste.

verifier("splat-suivi-3 — le parcours de référence de SPLAT! ressort identique du filtre du serveur", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    require_once dirname(__DIR__) . '/public/lib/progression.php';
    $chemin = __DIR__ . '/parcours-reference-splat.json';
    vrai(is_file($chemin), "tests/parcours-reference-splat.json manque : node scripts/generer-parcours-reference-splat.mjs");
    $texte = (string)file_get_contents($chemin);
    $attendu = json_encode(json_decode($texte, false), JSON_UNESCAPED_UNICODE);
    $obtenu = json_encode(filtrer_progression('splat', json_decode($texte, false)), JSON_UNESCAPED_UNICODE);
    egal($attendu, $obtenu, "le filtre du serveur jette un champ que le moteur SPLAT! produit : compléter 'cles'/'motifs' de « splat » dans lib/applis.php");
    egal(54, count(get_object_vars(json_decode($texte, false)->etapes)), 'les 54 parcours de la carte (40 étapes, l’échauffement É1-É3 compris ; 14 Bonus)');
    vrai(strlen($attendu) > 3000, 'la référence est bien un parcours complet');
    egal(54, compter_elements_declares('splat', $attendu), '« Revenir à… » compte les étapes');
});

verifier("splat-suivi-3 — un texte, une clé étrangère ou un parcours inconnu sont retirés", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    require_once dirname(__DIR__) . '/public/lib/progression.php';
    $propre = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-splat.json'), false);
    $attendu = json_encode($propre, JSON_UNESCAPED_UNICODE);
    $sale = json_decode($attendu, false);
    $sale->prenom = 'Léa';
    $sale->etapes->m1e1->sig = 'm1e1-ABCD';
    $sale->etapes->m1e1->res = ['ok', 'ko', 'orange'];
    $sale->etapes->m1e1->enCours = (object)['sig' => 'x', 'idx' => 2, 'res' => ['ok']];
    $sale->etapes->m1e2->date = 'mardi';
    $sale->etapes->m9e9 = (object)['fait' => true, 'etoiles' => 4, 'cartes' => 4, 'vues' => 0, 'essais' => 1, 'date' => '2026-10-01'];
    $sale->etapes->perso42 = (object)['fait' => true];
    // Échauffement du monde 6 (lot 2 « suivi », 14/10/2026) : ech1-ech3 passent
    // (ils sont dans la référence), une clé voisine inventée saute.
    foreach (['ech9', 'ech0', 'ech', 'ech1d', 'm4ech1'] as $faux) {
        $sale->etapes->$faux = (object)['fait' => true, 'etoiles' => 12, 'cartes' => 12, 'vues' => 0, 'essais' => 1, 'date' => '2026-10-15'];
    }
    $obtenu = filtrer_progression('splat', $sale);
    foreach (['ech9', 'ech0', 'ech', 'ech1d', 'm4ech1'] as $faux) {
        vrai(!isset($obtenu->etapes->$faux), "« $faux » n’est pas une étape de la carte : il saute");
    }
    vrai(isset($obtenu->etapes->ech1, $obtenu->etapes->ech2, $obtenu->etapes->ech3), 'les trois étapes d’échauffement passent');
    vrai(!isset($obtenu->prenom), 'le prénom reste sur l’appareil');
    vrai(!isset($obtenu->etapes->m1e1->sig) && !isset($obtenu->etapes->m1e1->res) && !isset($obtenu->etapes->m1e1->enCours),
        'ni la signature, ni les résultats carte par carte, ni la reprise en cours');
    vrai(!isset($obtenu->etapes->m1e2->date), 'un texte à la place d’une date saute');
    vrai(!isset($obtenu->etapes->m9e9) && !isset($obtenu->etapes->perso42), 'un parcours hors de la carte saute');
    unset($propre->etapes->m1e2->date);
    egal(json_encode($propre, JSON_UNESCAPED_UNICODE), json_encode($obtenu, JSON_UNESCAPED_UNICODE),
        'tout le reste ressort intact');
    $texte = json_encode($obtenu, JSON_UNESCAPED_UNICODE);
    vrai(!str_contains($texte, 'Léa') && !str_contains($texte, 'ABCD') && !str_contains($texte, 'mardi'), 'aucun texte libre ne ressort');
    // Le filtre est propre à chaque appli : un parcours SPLAT! envoyé sous
    // « defi-tables » ne laisse passer aucune étape.
    // (Lot S1 « les journaux » : « jours », « journal » et « etapes » — une
    // colonne du journal de Défi tables — sont des clés des deux applis ;
    // aucune étape de SPLAT! ni aucune colonne de son journal ne passe.)
    $croise = filtrer_progression('defi-tables', $propre);
    egal([], array_keys(get_object_vars($croise->etapes ?? new stdClass())), 'les étapes de SPLAT! ne sont pas des clés de Défi tables');
    egal([], array_values(array_diff(array_keys(get_object_vars($croise)), ['version', 'epoque', 'jours', 'journal', 'etapes'])), 'rien d’autre de SPLAT! ne passe');
    egal([], array_keys(get_object_vars($croise->journal ?? new stdClass())), 'ni les colonnes de son journal');
});

$classeSplat = null;
verifier("splat-suivi-3 — SPLAT! s'enregistre et se relit par l'API élève, à côté de Défi tables", function () use (&$jetonS1, &$classeSplat) {
    vider_compteurs();
    $r = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-splat', 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'classe créée avec SPLAT!');
    $classe = $r['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    $classeSplat = ['id' => $classe, 'eleves' => $eleves];
    $code = $eleves[0]['code'];
    $reference = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-splat.json'), true);
    egal(false, lire($code, 'splat')['json']['existe'], 'rien avant le premier envoi');
    $w = ecrire($code, $reference, 0, 'splat');
    egal(200, $w['code'], 'premier envoi accepté (révision 0)');
    egal(1, $w['json']['revision']);
    $r = lire($code, 'splat');
    egal(true, $r['json']['existe']);
    egal($reference, $r['json']['parcours'], 'relu exactement tel que le moteur l’a envoyé');
    egal(false, lire($code)['json']['existe'], 'Défi tables du même élève n’a pas bougé');
    $ligne = bd_test()->prepare("SELECT calculs FROM versions WHERE eleve_id = ? AND appli = 'splat'");
    $ligne->execute([(int)$eleves[0]['id']]);
    egal(54, (int)$ligne->fetchColumn(), 'la version du jour est comptée en étapes (les 54 parcours de la référence)');
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe, 'appli' => 'splat'], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'le tableau de la classe se demande pour SPLAT!');
    $lu = null;
    foreach ($r['json']['eleves'] as $e) if ((int)$e['id'] === (int)$eleves[0]['id']) $lu = $e;
    vrai($lu !== null && is_array($lu['parcours'] ?? null) && isset($lu['parcours']['etapes']['enq14']),
        'le tableau rend le parcours SPLAT! de l’élève');
});

verifier("splat-suivi-3 — rien ne change tant qu'aucune classe n'a « splat » dans sa liste", function () use (&$jetonS1, &$classeSplat) {
    require_once __DIR__ . '/../public/lib/applis.php';
    egal(['defi-tables'], array_column(applis_de_classe('defi-tables'), 'cle'), 'une classe de Défi tables ne reçoit pas SPLAT!');
    egal(['defi-tables', 'splat'], array_column(applis_de_classe('defi-tables,splat'), 'cle'), 'une classe qui l’a le reçoit, dans son ordre');
    egal([], applis_de_classe('splat-equations'), 'l’ancienne clé n’existe plus');
    vider_compteurs();
    // Une classe créée comme aujourd'hui (sans liste) : Défi tables seul.
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-sans-splat'], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    egal(['defi-tables'], array_column(identite($eleve['code'])['json']['applis'], 'cle'), 'l’espace de l’élève ne montre que Défi tables');
    // La classe qui a SPLAT! : la tuile reçoit le nom, l'adresse de la carte, rien d'autre.
    $applis = identite($classeSplat['eleves'][0]['code'])['json']['applis'];
    egal(['defi-tables', 'splat'], array_column($applis, 'cle'));
    egal(['cle' => 'splat', 'nom' => 'SPLAT!', 'description' => 'Six mondes de taches et de jetons, étape par étape.',
        'url' => 'https://mathsgo.re/outils/splat_univers.html', 'ancre' => null, 'disponible' => true], $applis[1],
        'pas de « cles » ni de « motifs » : le mode d’emploi du filtre ne sort pas');
});

verifier("splat-suivi-3 — classes.modifier accepte SPLAT! et range la liste dans l'ordre du catalogue", function () use (&$jetonS1, &$classeSplat) {
    vider_compteurs();
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classeSplat['id'], 'applis' => ['splat', 'defi-tables', 'splat-equations']], ['jeton' => $jetonS1]);
    egal(200, $r['code']);
    $classes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes'];
    $trouvee = null;
    foreach ($classes as $c) if ((int)$c['id'] === (int)$classeSplat['id']) $trouvee = $c;
    egal(['defi-tables', 'splat'], $trouvee['applis'], 'l’ancienne clé est ignorée, l’ordre est celui du catalogue');
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classeSplat['id'], 'applis' => ['defi-tables']], ['jeton' => $jetonS1]);
    egal(['defi-tables'], array_column(identite($classeSplat['eleves'][0]['code'])['json']['applis'], 'cle'),
        'décochée : la tuile disparaît de l’espace élève');
    egal(true, lire($classeSplat['eleves'][0]['code'], 'splat')['json']['existe'], 'et son parcours reste en base');
});

verifier("splat-suivi-3 — l'espace élève charge le moteur SPLAT! d'ici, identique à celui du dépôt", function () use ($racine) {
    $r = page('/');
    vrai((bool)preg_match('#"prof/splat-parcours\.js\?v=([0-9a-f]{10})"#', $r['texte'], $m), 'le moteur est relatif, avec une version');
    vrai((bool)preg_match('#"prof/defi_tables_mon_parcours\.js\?v=[0-9a-f]{10}"#', $r['texte']), 'celui de Défi tables aussi, toujours');
    $moteur = page('/prof/splat-parcours.js');
    egal(200, $moteur['code'], 'le moteur est servi');
    vrai(str_contains($moteur['texte'], 'MathsGoSplatParcours'), "c'est bien le moteur de SPLAT!");
    egal(substr(md5($moteur['texte']), 0, 10), $m[1], 'la version dans l’adresse est l’empreinte du fichier servi');
    $original = dirname($racine) . '/assets/js/splat-parcours.js';
    if (is_file($original)) {
        egal(md5_file($original), md5($moteur['texte']), 'octet pour octet le moteur du site (sinon : cp assets/js/splat-parcours.js _serveur/public/prof/)');
    }
});

verifier("splat-suivi-3 — verifier.php contrôle le moteur SPLAT!", function () {
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#class="etat oui">✓</span>\s*Moteur SPLAT! servi localement\s*<div class="detail">en place \(#u', $r['texte']),
        'la ligne existe, et elle est verte');
});

verifier("splat-suivi-4 — « Ma classe » charge le moteur SPLAT! d'ici, à la demande, à l'empreinte du fichier servi", function () {
    $r = page('/prof/');
    egal(200, $r['code'], 'la page « Ma classe » répond');
    vrai((bool)preg_match('#const MOTEUR_SPLAT = "splat-parcours\.js\?v=([0-9a-f]{10})";#', $r['texte'], $m),
        'l’adresse du moteur, relative (même origine : la politique de contenu l’autorise), avec une version');
    vrai(!str_contains($r['texte'], '<script src="splat-parcours.js'), 'pas chargé d’office : seulement à l’ouverture de l’onglet SPLAT!');
    $moteur = page('/prof/splat-parcours.js');
    egal(substr(md5($moteur['texte']), 0, 10), $m[1], 'la version dans l’adresse est l’empreinte du fichier servi');
    // Lot « Ma classe : réglages » (17/10/2026) : les activités, le partage, le
    // nom et la suppression sont dans la vue « Réglages », cachée tant
    // qu'aucune classe n'est ouverte, avec son onglet.
    vrai(str_contains($r['texte'], '<div class="reglages" id="vue-reglages" hidden>'), 'la vue « Réglages » : cachée tant qu’aucune classe n’est ouverte');
    // (Depuis le lot « Ma classe : élèves », l'onglet porte aussi son nom et sa bulle.)
    vrai((bool)preg_match('#id="onglet-reglages" aria-pressed="false"[^>]* hidden>#', $r['texte']), 'son onglet aussi');
    $vue = substr($r['texte'], strpos($r['texte'], 'id="vue-reglages"'));
    $vue = substr($vue, 0, strpos($vue, "<!-- Ce qui sort de l'imprimante"));
    // Serveur pro, lot 5b : plus de carte « Activités » — chaque appli se
    // règle dans son onglet (« Régler … », la fenêtre #regler).
    foreach (['bloc-partage', 'form-nom-classe', 'supprimer-classe'] as $id) {
        vrai(str_contains($vue, 'id="' . $id . '"'), "« $id » est dans la vue Réglages");
    }
    vrai(!str_contains($r['texte'], 'id="bloc-activites"'), 'plus de carte « Activités » dans Réglages (lot 5b)');
    vrai(str_contains($r['texte'], '<dialog id="regler" class="fenetre regler" aria-labelledby="regler-titre">'), 'la fenêtre « Régler … » (lot 5b)');
});

verifier("ma-classe-eleves — « Ma classe » : les codes et les boutons des élèves sont dans la vue Élèves, cachée, et nulle part ailleurs", function () {
    $r = page('/prof/');
    egal(200, $r['code'], 'la page « Ma classe » répond');
    // Lot « Ma classe : élèves » (18/10/2026) : la vue Élèves et son onglet,
    // cachés tant qu'aucune classe n'est ouverte ; les tableaux des applis
    // n'ont plus de colonne « Code » ; « Nouvelle classe » est une carte.
    vrai(str_contains($r['texte'], '<div id="vue-eleves" hidden>'), 'la vue « Élèves » : cachée tant qu’aucune classe n’est ouverte');
    vrai(str_contains($r['texte'], 'id="onglet-eleves" aria-pressed="false"'), 'son onglet existe');
    vrai((bool)preg_match('#id="onglet-eleves"[^>]* hidden>#', $r['texte']), 'son onglet aussi est caché');
    $vue = substr($r['texte'], strpos($r['texte'], 'id="vue-eleves"'));
    $vue = substr($vue, 0, strpos($vue, 'id="vue-reglages"'));
    foreach (['ajouter', 'coller-prenoms', 'imprimer-bandelettes', 'imprimer-recap', 'message-classe', 'tableau-eleves'] as $id) {
        vrai(str_contains($vue, 'id="' . $id . '"'), "« $id » est dans la vue Élèves");
    }
    $appli = substr($r['texte'], strpos($r['texte'], 'id="vue-appli"'));
    $appli = substr($appli, 0, strpos($appli, '<!-- /vue-appli -->'));
    vrai(!str_contains($appli, '<th>Code</th>'), 'plus de colonne « Code » dans les tableaux des applis');
    vrai(!str_contains($appli, 'id="imprimer-bandelettes"'), 'plus de bouton d’élève dans la vue de l’activité');
    vrai(!str_contains($r['texte'], 'id="form-classe"'), '« Nouvelle classe » n’est plus un formulaire toujours affiché');
});

verifier("ma-classe-reglages — renommer la classe : seul le nom change, nettoyé comme à la création", function () use (&$jetonS1) {
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'reglages-avant', 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1])['json']['id'];
    egal(200, appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id,
        'reglages' => ['splat' => ['mondes' => [1, 2]], 'defi-tables' => ['records' => false]]], ['jeton' => $jetonS1])['code'], 'des réglages posés');
    $avant = classe_en_base($id);
    // Ce que la page envoie : le nom seul.
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'libelle' => "  4e\u{0007}  B\u{200B} bis  "], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'renommée');
    $apres = classe_en_base($id);
    egal('4e B bis', $apres['libelle'], 'espaces resserrés, caractères de commande et invisibles retirés');
    egal($avant['applis'], $apres['applis'], 'les activités ne bougent pas');
    egal($avant['reglages'], $apres['reglages'], 'les réglages (mondes, records) ne bougent pas');
    $tableau = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'defi-tables'], ['jeton' => $jetonS1]);
    egal('4e B bis', $tableau['json']['classe']['libelle'], 'le tableau rend le nouveau nom');
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'libelle' => str_repeat('x', 60)], ['jeton' => $jetonS1]);
    egal(40, mb_strlen(classe_en_base($id)['libelle']), '40 caractères au plus');
    $vide = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'libelle' => "  \u{200B} "], ['jeton' => $jetonS1]);
    egal(400, $vide['code'], 'un nom vide est refusé');
    egal(str_repeat('x', 40), classe_en_base($id)['libelle'], 'et rien n’est écrit');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
});

// ------------------------------------------- lot « splat-suivi-5 » (08/10/2026)
//
// Les mondes de SPLAT! ouverts, classe par classe : classes.reglages (JSON,
// vide par défaut), {"splat": {"mondes": [1, 2]}} = les mondes OUVERTS ; tous
// ouverts = rien d'écrit. Écrits par classes.modifier (propriétaire, lecture
// STRICTE), rendus à « Ma classe » (classes.liste, tableau) et à l'élève
// (api/eleve.php, par son code et à l'échange du billet).

$classe5 = null;

// Lecture directe de la ligne d'une classe. Le curseur est FERMÉ aussitôt : un
// curseur SQLite resté ouvert dans ce processus garde un verrou sur la base, et
// le serveur de test, bloqué à sa prochaine écriture, ne répond plus.
function classe_en_base(int $id): array
{
    $ligne = bd_test()->prepare('SELECT libelle, applis, reglages FROM classes WHERE id = ?');
    $ligne->execute([$id]);
    $classe = $ligne->fetch();
    $ligne->closeCursor();
    return $classe;
}

verifier("splat-suivi-5 — par défaut, une classe a tous ses mondes ouverts : rien n'est écrit, « {} » partout", function () use (&$jetonS1, &$classe5) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-mondes', 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    $classe5 = ['id' => $id, 'eleves' => $eleves];
    egal(null, classe_en_base($id)['reglages'], 'la colonne reste vide');
    $liste = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    $trouvee = null;
    foreach ($liste['json']['classes'] as $c) if ((int)$c['id'] === $id) $trouvee = $c;
    egal([], $trouvee['reglages'], 'classes.liste : aucun réglage');
    vrai(str_contains($liste['texte'], '"reglages":{}'), 'un objet JSON « {} », pas une liste « [] »');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'splat'], ['jeton' => $jetonS1]);
    egal([], $t['json']['classe']['reglages'], 'tableau : aucun réglage');
    $e = identite($eleves[0]['code']);
    egal(200, $e['code']);
    vrai(str_contains($e['texte'], '"reglages":{}'), 'l’élève reçoit « {} » : tous les mondes ouverts');
});

verifier("splat-suivi-5 — classes.modifier range les mondes ouverts, triés, sans doublon ; tous cochés = rien d'écrit", function () use (&$jetonS1, &$classe5) {
    vider_compteurs();
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'reglages' => ['splat' => ['mondes' => [2, 1, 2]]]], ['jeton' => $jetonS1]);
    egal(200, $r['code']);
    egal(['splat' => ['mondes' => [1, 2]]], $r['json']['reglages'], 'la réponse rend la nouvelle valeur');
    $classe = classe_en_base($classe5['id']);
    egal('{"splat":{"mondes":[1,2]}}', $classe['reglages'], 'en base : la liste propre');
    egal('test-mondes', $classe['libelle'], 'le nom ne bouge pas');
    egal('defi-tables,splat', $classe['applis'], 'les activités ne bougent pas');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe5['id'], 'appli' => 'splat'], ['jeton' => $jetonS1]);
    egal(['splat' => ['mondes' => [1, 2]]], $t['json']['classe']['reglages'], 'tableau');
    // Tout recocher : on revient à « rien d'écrit ».
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'reglages' => ['splat' => ['mondes' => [1, 2, 3, 4, 5, 6]]]], ['jeton' => $jetonS1]);
    egal(200, $r['code']);
    vrai(str_contains($r['texte'], '"reglages":{}'), 'réponse « {} »');
    egal(null, classe_en_base($classe5['id'])['reglages'], 'en base : NULL, comme une classe où personne n’a rien choisi');
    // Renommer sans « reglages » ne touche pas aux mondes.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'reglages' => ['splat' => ['mondes' => [1, 2]]]], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'libelle' => 'test-mondes-2'], ['jeton' => $jetonS1]);
    $classe = classe_en_base($classe5['id']);
    egal('test-mondes-2', $classe['libelle']);
    egal('{"splat":{"mondes":[1,2]}}', $classe['reglages'], 'renommer garde les mondes');
});

verifier("splat-suivi-5 — une valeur fausse est refusée avec un message, et rien n'est écrit", function () use (&$jetonS1, &$classe5) {
    vider_compteurs();
    $avant = classe_en_base($classe5['id'])['reglages'];
    foreach ([
        [[], 'Une classe garde au moins un monde ouvert.', 'aucun monde'],
        [[7], 'Monde inconnu.', 'un monde qui n’existe pas'],
        [[0, 1], 'Monde inconnu.', 'le monde 0'],
        [['1'], 'Monde inconnu.', 'un texte'],
        [[1.5], 'Monde inconnu.', 'un nombre à virgule'],
        [[true], 'Monde inconnu.', 'un booléen'],
        ['1,2', 'Liste de mondes illisible.', 'une chaîne'],
        [['a' => 1], 'Liste de mondes illisible.', 'un objet'],
    ] as [$mondes, $message, $quoi]) {
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'reglages' => ['splat' => ['mondes' => $mondes]]], ['jeton' => $jetonS1]);
        egal(400, $r['code'], "$quoi : refusé");
        egal($message, $r['json']['erreur'] ?? null, "$quoi : le message");
    }
    foreach ([
        [['defi-tables' => ['mondes' => [1]]], 'Réglage inconnu.', 'une activité sans réglage'],
        [['soley' => ['mondes' => [1]]], 'Réglage inconnu.', 'une activité fermée'],
        [['inconnue' => ['mondes' => [1]]], 'Réglage inconnu.', 'une activité inconnue'],
        [['splat' => ['tables' => [1]]], 'Réglage inconnu.', 'un réglage non déclaré'],
        [['splat' => 'mondes'], 'Réglage inconnu.', 'un réglage illisible'],
        ['tout', 'Réglages illisibles.', 'une chaîne'],
        [[1, 2], 'Réglages illisibles.', 'une liste'],
    ] as [$reglages, $message, $quoi]) {
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'reglages' => $reglages], ['jeton' => $jetonS1]);
        egal(400, $r['code'], "$quoi : refusé");
        egal($message, $r['json']['erreur'] ?? null, "$quoi : le message");
    }
    egal($avant, classe_en_base($classe5['id'])['reglages'], 'la classe n’a pas bougé');
});

verifier("splat-suivi-5 — seul le propriétaire choisit les mondes ; un collègue les voit", function () use (&$jetonS1, &$classe5) {
    vider_compteurs();
    $tmp = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'collegue-mondes'], ['jeton' => $jetonS1])['json']['motdepasse'];
    $jc = connexion('collegue-mondes', $tmp)['json']['jeton'];
    appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $tmp, 'nouveau' => 'mondes-collegue-2026'], ['jeton' => $jc]);
    $idc = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $pr) {
        if ($pr['identifiant'] === 'collegue-mondes') $idc = $pr['id'];
    }
    foreach (['lecture', 'ecriture'] as $droit) {
        appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $classe5['id'], 'prof_id' => $idc], ['jeton' => $jetonS1]);
        egal(200, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classe5['id'], 'prof_id' => $idc, 'droit' => $droit], ['jeton' => $jetonS1])['code'], "partage en $droit");
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'reglages' => ['splat' => ['mondes' => [1]]]], ['jeton' => $jc]);
        egal(403, $r['code'], "un collègue en $droit ne choisit pas les mondes");
        $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe5['id'], 'appli' => 'splat'], ['jeton' => $jc]);
        egal(['splat' => ['mondes' => [1, 2]]], $t['json']['classe']['reglages'], "un collègue en $droit voit les mondes ouverts (pastilles grises)");
    }
    egal('{"splat":{"mondes":[1,2]}}', classe_en_base($classe5['id'])['reglages'], 'rien n’a bougé');
});

verifier("splat-suivi-5 — l'élève reçoit les mondes ouverts par son code et à l'échange du billet, tant que SPLAT! est dans sa liste", function () use (&$jetonS1, &$classe5) {
    vider_compteurs();
    $code = $classe5['eleves'][0]['code'];
    $e = identite($code);
    egal(['splat' => ['mondes' => [1, 2]]], $e['json']['reglages'], 'par le code (espace élève, et chaque page qui relit l’identité)');
    $billet = appel('/api/eleve.php', ['code' => $code, 'billet' => true])['json']['billet'];
    $r = echanger($billet, ['appli' => 'splat']);
    egal(200, $r['code']);
    egal('entree', $r['json']['type']);
    egal(['splat' => ['mondes' => [1, 2]]], $r['json']['reglages'], 'à l’échange du billet (la carte des mondes)');
    // SPLAT! décoché : l'élève ne reçoit plus rien de SPLAT! ; recoché : ses mondes reviennent.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'applis' => ['defi-tables']], ['jeton' => $jetonS1]);
    vrai(str_contains(identite($code)['texte'], '"reglages":{}'), 'SPLAT! décoché : rien de SPLAT! pour l’élève');
    egal('{"splat":{"mondes":[1,2]}}', classe_en_base($classe5['id'])['reglages'],
        'mais le choix reste gardé');
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1]);
    egal(['splat' => ['mondes' => [1, 2]]], identite($code)['json']['reglages'], 'SPLAT! recoché : les mêmes mondes');
});

verifier("splat-suivi-5 — en base, une valeur abîmée se lit « tous ouverts » ou ce qui reste lisible, jamais une panne", function () use (&$jetonS1, &$classe5) {
    vider_compteurs();
    $code = $classe5['eleves'][0]['code'];
    $maj = bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?');
    // (une écriture ne laisse pas de curseur ouvert : pas de verrou qui traîne)
    foreach ([
        ['pas du json', '{}'], ['[1,2]', '{}'], ['{"splat":{"mondes":"1"}}', '{}'], ['{"splat":{"mondes":[]}}', '{}'],
        ['{"splat":{"mondes":[1,2,3,4,5,6]}}', '{}'], ['{"inconnue":{"mondes":[1]}}', '{}'],
        ['{"splat":{"mondes":[9,"2",2,1,1]}}', '{"splat":{"mondes":[1,2]}}'],
    ] as [$brut, $attendu]) {
        $maj->execute([$brut, $classe5['id']]);
        $r = identite($code);
        egal(200, $r['code'], "« $brut » : l’élève entre");
        vrai(str_contains($r['texte'], '"reglages":' . $attendu), "« $brut » → $attendu");
        egal(200, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['code'], "« $brut » : Ma classe s’ouvre");
    }
    $maj->execute(['{"splat":{"mondes":[1,2]}}', $classe5['id']]);
});

verifier("splat-suivi-5 — avant migrer.php (colonne absente) : tout se lit « tous ouverts », seul le choix des mondes demande la mise à niveau", function () use (&$jetonS1, &$classe5) {
    vider_compteurs();
    // La base d'avant migrer.php : la colonne retirée le temps de l'essai (SQLite
    // comme MySQL savent le faire), remise par migrer_schema() dans le finally.
    bd_test()->exec('ALTER TABLE classes DROP COLUMN reglages');
    try {
        egal(false, colonne_existe(bd_test(), 'classes', 'reglages'), 'la colonne est retirée pour l’essai');
        $code = $classe5['eleves'][0]['code'];
        $e = identite($code);
        egal(200, $e['code'], 'l’élève entre');
        vrai(str_contains($e['texte'], '"reglages":{}'), 'et tous ses mondes sont ouverts');
        $billet = appel('/api/eleve.php', ['code' => $code, 'billet' => true])['json']['billet'];
        egal(200, echanger($billet, ['appli' => 'splat'])['code'], 'le billet s’échange');
        $l = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
        egal(200, $l['code'], 'Ma classe s’ouvre');
        egal(200, appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe5['id'], 'appli' => 'splat'], ['jeton' => $jetonS1])['code']);
        egal(200, appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'libelle' => 'test-mondes-3'], ['jeton' => $jetonS1])['code'],
            'renommer marche encore');
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'reglages' => ['splat' => ['mondes' => [1]]]], ['jeton' => $jetonS1]);
        egal(503, $r['code'], 'choisir les mondes : mise à niveau à faire');
        vrai(str_contains($r['json']['erreur'] ?? '', 'migrer.php'), 'le message dit quoi faire : ' . ($r['json']['erreur'] ?? ''));
        $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
        vrai((bool)preg_match('#class="etat non">✗</span>\s*Mondes ouverts par classe\s*<div class="detail">manque la colonne « classes\.reglages » — ouvre migrer\.php#u', $v['texte']),
            'verifier.php le dit, en rouge');
    } finally {
        $faits = migrer_schema(bd_test());
    }
    vrai(in_array('Colonne « réglages » ajoutée aux classes (les mondes de SPLAT! ouverts à chaque classe).', $faits, true),
        'migrer.php ajoute la colonne et le dit : ' . implode(' | ', $faits));
    egal([], migrer_schema(bd_test()), 'relancer ne fait plus rien');
    egal(true, colonne_existe(bd_test(), 'classes', 'reglages'));
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe5['id'], 'reglages' => ['splat' => ['mondes' => [1, 2]]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'après la mise à niveau, le choix des mondes marche');
    $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#class="etat oui">✓</span>\s*Mondes ouverts par classe\s*<div class="detail">en place \(\d+ classe\(s\) avec un réglage — mondes de SPLAT!, niveaux ou opérations de Coffres\)#u', $v['texte']),
        'verifier.php : la ligne est verte');
});

verifier("splat-suivi-5 — le nombre de mondes déclaré au catalogue est celui de la carte du moteur", function () use ($racine) {
    require_once __DIR__ . '/../public/lib/applis.php';
    $moteur = (string)file_get_contents($racine . '/public/prof/splat-parcours.js');
    vrai((bool)preg_match('#const MONDES = Object\.freeze\(\[(.*?)\]\);#s', $moteur, $m), 'la liste des mondes du moteur');
    egal(preg_match_all('#Object\.freeze\(\[(\d), "#', $m[1]), CATALOGUE_APPLIS['splat']['reglages']['mondes'],
        'lib/applis.php déclare autant de mondes que la carte');
});

// -------------------------------- lot « Coffres magiques sur le suivi » (21/10/2026)
//
// Le serveur apprend Coffres magiques (solo) : la clé « coffres », juste après
// Défi tables au catalogue, ses clés déclarées (trésors et parfaits par
// niveau, clés / aides / solutions / erreurs par opération, le jour du dernier
// trésor, la partie en cours), la copie du moteur dans prof/, et deux réglages
// de classe — les niveaux et les opérations accessibles — rangés dans la même
// colonne classes.reglages que les mondes de SPLAT!. Rien ne change chez
// l'élève ni chez le professeur tant qu'aucune classe n'a « coffres » dans sa
// liste.

verifier("coffres-suivi — le parcours de référence de Coffres ressort identique du filtre du serveur", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    require_once dirname(__DIR__) . '/public/lib/progression.php';
    $chemin = __DIR__ . '/parcours-reference-coffres.json';
    vrai(is_file($chemin), "tests/parcours-reference-coffres.json manque : node scripts/generer-parcours-reference-coffres.mjs");
    $texte = (string)file_get_contents($chemin);
    $attendu = json_encode(json_decode($texte, false), JSON_UNESCAPED_UNICODE);
    $obtenu = json_encode(filtrer_progression('coffres', json_decode($texte, false)), JSON_UNESCAPED_UNICODE);
    egal($attendu, $obtenu, "le filtre du serveur jette un champ que le moteur Coffres produit : compléter 'cles'/'motifs' de « coffres » dans lib/applis.php");
    $reference = json_decode($texte, false);
    egal(3, count(get_object_vars($reference->niveaux)), 'les trois niveaux commencés');
    egal(4, count(get_object_vars($reference->operations)), 'les quatre opérations');
    egal(6, $reference->partie->cles, 'une partie en cours à 6 clés');
    egal(3, compter_elements_declares('coffres', $attendu), '« Revenir à… » compte les niveaux commencés');
});

verifier("coffres-suivi — un texte, une clé étrangère, un niveau hors 1-3 ou un plateau sont retirés", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    require_once dirname(__DIR__) . '/public/lib/progression.php';
    $propre = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-coffres.json'), false);
    $attendu = json_encode($propre, JSON_UNESCAPED_UNICODE);
    $sale = json_decode($attendu, false);
    $sale->prenom = 'Léa';
    $sale->niveaux->{'4'} = (object)['tresors' => 9, 'parfaits' => 9];
    $sale->niveaux->{'0'} = (object)['tresors' => 9, 'parfaits' => 9];
    $sale->niveaux->{'1'}->note = 'super';
    $sale->operations->puissance = (object)['cles' => 3];
    $sale->operations->sum->calculs = ['3+2', '5+4'];
    $sale->partie->plateau = [5, 12, 7, 11, 13, 12, 13, 12, 13, 13, 8, 8, 13, 11, 11, 11];
    $sale->partie->cible = 77;
    $sale->partie->jour = 'mardi';
    $sale->dernier = '2026-13-45';
    $obtenu = filtrer_progression('coffres', $sale);
    vrai(!isset($obtenu->prenom), 'le prénom reste sur l’appareil');
    vrai(!isset($obtenu->niveaux->{'4'}) && !isset($obtenu->niveaux->{'0'}), 'un niveau hors 1-3 saute');
    vrai(!isset($obtenu->niveaux->{'1'}->note), 'un texte dans un niveau saute');
    vrai(!isset($obtenu->operations->puissance), 'une opération inconnue saute');
    vrai(!isset($obtenu->operations->sum->calculs), 'les calculs de l’élève ne sont jamais gardés');
    vrai(!isset($obtenu->partie->plateau) && !isset($obtenu->partie->cible), 'ni le plateau ni la cible : la partie reprend sur un plateau neuf');
    vrai(!isset($obtenu->partie->jour), 'un texte à la place d’une date saute');
    vrai(!isset($obtenu->dernier), 'une fausse date saute');
    unset($propre->partie->jour, $propre->dernier);
    egal(json_encode($propre, JSON_UNESCAPED_UNICODE), json_encode($obtenu, JSON_UNESCAPED_UNICODE), 'tout le reste ressort intact');
    $texte = json_encode($obtenu, JSON_UNESCAPED_UNICODE);
    vrai(!str_contains($texte, 'Léa') && !str_contains($texte, 'super') && !str_contains($texte, '3+2') && !str_contains($texte, 'mardi'), 'aucun texte libre ne ressort');
    // Le filtre est propre à chaque appli : un parcours Coffres envoyé sous
    // « splat » ne laisse passer ni niveau ni opération.
    // (Lot S1 « les journaux » : « jours », « journal » et « depuis » sont des
    // clés des deux applis — leurs colonnes non.)
    $croise = filtrer_progression('splat', $propre);
    vrai(!isset($croise->niveaux) && !isset($croise->operations) && !isset($croise->partie), 'les compteurs de Coffres ne sont pas des clés de SPLAT!');
    egal([], array_values(array_diff(array_keys(get_object_vars($croise)), ['version', 'epoque', 'jours', 'journal', 'depuis'])), 'rien d’autre de Coffres ne passe');
    egal([], array_keys(get_object_vars($croise->journal ?? new stdClass())), 'ni les colonnes de son journal');
});

$classeCoffres = null;
verifier("coffres-suivi — Coffres s'enregistre et se relit par l'API élève, à côté de Défi tables et de SPLAT!", function () use (&$jetonS1, &$classeCoffres) {
    vider_compteurs();
    $r = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-coffres', 'applis' => ['splat', 'coffres', 'defi-tables']], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'classe créée avec Coffres');
    $classe = $r['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    $classeCoffres = ['id' => $classe, 'eleves' => $eleves];
    $code = $eleves[0]['code'];
    $reference = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-coffres.json'), true);
    egal(false, lire($code, 'coffres')['json']['existe'], 'rien avant le premier envoi');
    $w = ecrire($code, $reference, 0, 'coffres');
    egal(200, $w['code'], 'premier envoi accepté (révision 0)');
    egal(1, $w['json']['revision']);
    $r = lire($code, 'coffres');
    egal(true, $r['json']['existe']);
    egal($reference, $r['json']['parcours'], 'relu exactement tel que le moteur l’a envoyé');
    egal(false, lire($code)['json']['existe'], 'Défi tables du même élève n’a pas bougé');
    egal(false, lire($code, 'splat')['json']['existe'], 'SPLAT! non plus');
    $ligne = bd_test()->prepare("SELECT calculs FROM versions WHERE eleve_id = ? AND appli = 'coffres'");
    $ligne->execute([(int)$eleves[0]['id']]);
    $compte = (int)$ligne->fetchColumn();
    // Le curseur se referme tout de suite : ouvert, il garde un verrou de
    // lecture SQLite, et le prochain appel qui écrit (le limiteur de
    // eleve.php) attendrait jusqu'au délai de curl.
    $ligne->closeCursor();
    egal(3, $compte, 'la version du jour est comptée en niveaux commencés');
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe, 'appli' => 'coffres'], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'le tableau de la classe se demande pour Coffres');
    $lu = null;
    foreach ($r['json']['eleves'] as $e) if ((int)$e['id'] === (int)$eleves[0]['id']) $lu = $e;
    vrai($lu !== null && is_array($lu['parcours'] ?? null) && ($lu['parcours']['partie']['cles'] ?? 0) === 6,
        'le tableau rend le parcours Coffres de l’élève, partie en cours comprise');
    // L'ordre de la liste de la classe est celui du catalogue : Coffres juste après Défi tables.
    $classes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes'];
    $trouvee = null;
    foreach ($classes as $c) if ((int)$c['id'] === (int)$classe) $trouvee = $c;
    egal(['defi-tables', 'coffres', 'splat'], $trouvee['applis'], 'Coffres entre Défi tables et SPLAT!, quel que soit l’ordre envoyé');
    $e = identite($code);
    egal(200, $e['code'], 'l’identité par le code : ' . $e['texte'] . ' ' . $e['erreur_curl']);
    $applis = $e['json']['applis'] ?? [];
    egal(['defi-tables', 'coffres', 'splat'], array_column($applis, 'cle'), 'l’espace élève reçoit les trois tuiles dans cet ordre');
    egal(['cle' => 'coffres', 'nom' => 'Coffres magiques', 'description' => 'Trouve les deux nombres qui ouvrent le coffre.',
        'url' => 'https://mathsgo.re/outils/calcul_mental/coffres_magiques_solo.html', 'ancre' => null, 'disponible' => true], $applis[1],
        'la tuile : le nom, la phrase convenue, l’adresse de l’appli solo ; pas de « cles » ni de « motifs »');
});

verifier("coffres-suivi — rien ne change tant qu'aucune classe n'a « coffres » dans sa liste ; décoché, le parcours reste", function () use (&$jetonS1, &$classeCoffres) {
    require_once __DIR__ . '/../public/lib/applis.php';
    egal(['defi-tables'], array_column(applis_de_classe('defi-tables'), 'cle'), 'une classe de Défi tables ne reçoit pas Coffres');
    egal(['defi-tables', 'coffres'], array_column(applis_de_classe('defi-tables,coffres'), 'cle'), 'une classe qui l’a le reçoit');
    vider_compteurs();
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-sans-coffres'], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    egal(['defi-tables'], array_column(identite($eleve['code'])['json']['applis'], 'cle'), 'l’espace de l’élève ne montre que Défi tables');
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classeCoffres['id'], 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1]);
    egal(['defi-tables', 'splat'], array_column(identite($classeCoffres['eleves'][0]['code'])['json']['applis'], 'cle'),
        'décochée : la tuile disparaît de l’espace élève');
    egal(true, lire($classeCoffres['eleves'][0]['code'], 'coffres')['json']['existe'], 'et son parcours reste en base');
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classeCoffres['id'], 'applis' => ['defi-tables', 'coffres', 'splat']], ['jeton' => $jetonS1]);
    egal(['defi-tables', 'coffres', 'splat'], array_column(identite($classeCoffres['eleves'][0]['code'])['json']['applis'], 'cle'), 'recochée : elle revient');
});

verifier("coffres-suivi — réglages : par défaut tout est ouvert, rien n'est écrit ; classes.modifier range niveaux et opérations, triés, sans doublon", function () use (&$jetonS1, &$classeCoffres) {
    vider_compteurs();
    $id = $classeCoffres['id'];
    $code = $classeCoffres['eleves'][0]['code'];
    egal(null, classe_en_base($id)['reglages'], 'la colonne reste vide');
    vrai(str_contains(identite($code)['texte'], '"reglages":{}'), 'l’élève reçoit « {} » : tous les niveaux, toutes les opérations');
    // Deux niveaux, deux opérations (la maquette 03a).
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['coffres' => ['niveaux' => [2, 1, 2], 'operations' => [3, 1]]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'accepté');
    egal(['coffres' => ['niveaux' => [1, 2], 'operations' => [1, 3]]], $r['json']['reglages'], 'la réponse rend la nouvelle valeur');
    egal('{"coffres":{"niveaux":[1,2],"operations":[1,3]}}', classe_en_base($id)['reglages'], 'en base : les listes propres');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'coffres'], ['jeton' => $jetonS1]);
    egal(['coffres' => ['niveaux' => [1, 2], 'operations' => [1, 3]]], $t['json']['classe']['reglages'], 'tableau');
    egal(['coffres' => ['niveaux' => [1, 2], 'operations' => [1, 3]]], identite($code)['json']['reglages'], 'l’élève les reçoit par son code');
    // Un seul des deux réglages envoyé : l'autre ne bouge pas.
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['coffres' => ['niveaux' => [2]]]], ['jeton' => $jetonS1]);
    egal(['coffres' => ['niveaux' => [2], 'operations' => [1, 3]]], $r['json']['reglages'], 'les opérations restent');
    // Tout coché = rien d'écrit, réglage par réglage.
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['coffres' => ['niveaux' => [1, 2, 3]]]], ['jeton' => $jetonS1]);
    egal(['coffres' => ['operations' => [1, 3]]], $r['json']['reglages'], 'tous les niveaux cochés : le réglage des niveaux disparaît');
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['coffres' => ['operations' => [4, 3, 2, 1]]]], ['jeton' => $jetonS1]);
    vrai(str_contains($r['texte'], '"reglages":{}'), 'tout ouvert : « {} »');
    egal(null, classe_en_base($id)['reglages'], 'en base : NULL, comme une classe où personne n’a rien choisi');
    // Les mondes de SPLAT! et les réglages de Coffres vivent côte à côte dans la même colonne.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['splat' => ['mondes' => [1, 2]]]], ['jeton' => $jetonS1]);
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['coffres' => ['niveaux' => [2], 'operations' => [1]]]], ['jeton' => $jetonS1]);
    egal(['splat' => ['mondes' => [1, 2]], 'coffres' => ['niveaux' => [2], 'operations' => [1]]], $r['json']['reglages'], 'côte à côte');
    // Renommer sans « reglages » ne touche à rien.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'libelle' => 'test-coffres-2'], ['jeton' => $jetonS1]);
    egal('{"splat":{"mondes":[1,2]},"coffres":{"niveaux":[2],"operations":[1]}}', classe_en_base($id)['reglages'], 'renommer garde tout');
});

verifier("coffres-suivi — réglages : une valeur fausse est refusée avec un message, et rien n'est écrit", function () use (&$jetonS1, &$classeCoffres) {
    $id = $classeCoffres['id'];
    $avant = classe_en_base($id)['reglages'];
    foreach ([
        [['niveaux' => []], 'Une classe garde au moins un niveau ouvert.', 'aucun niveau'],
        [['operations' => []], "Une classe garde au moins une opération ouverte.", 'aucune opération'],
        [['niveaux' => [0]], 'Niveau inconnu.', 'niveau 0'],
        [['niveaux' => [4]], 'Niveau inconnu.', 'niveau 4'],
        [['niveaux' => ['1']], 'Niveau inconnu.', 'un niveau en texte'],
        [['operations' => [5]], 'Opération inconnue.', 'opération 5'],
        [['operations' => [1.5]], 'Opération inconnue.', 'une opération à virgule'],
        [['niveaux' => '1,2'], 'Liste de niveaux illisible.', 'une chaîne'],
        [['operations' => ['a' => 1]], "Liste d'opérations illisible.", 'un objet'],
        [['cadeau' => true], 'Réglage inconnu.', 'un réglage que Coffres ne déclare pas'],
        [['mondes' => [1]], 'Réglage inconnu.', 'les mondes ne sont pas à Coffres'],
    ] as [$reglage, $message, $quoi]) {
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['coffres' => $reglage]], ['jeton' => $jetonS1]);
        egal(400, $r['code'], "$quoi : refusé");
        egal($message, $r['json']['erreur'] ?? null, "$quoi : le message");
    }
    egal($avant, classe_en_base($id)['reglages'], 'la classe n’a pas bougé');
    // En base, une valeur abîmée se lit « tout ouvert » ou ce qui reste lisible.
    $maj = bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?');
    foreach ([
        ['{"coffres":{"niveaux":"1"}}', '{}'], ['{"coffres":{"niveaux":[1,2,3],"operations":[1,2,3,4]}}', '{}'],
        ['{"coffres":{"niveaux":[9,"2",2,1,1],"operations":[0,4]}}', '{"coffres":{"niveaux":[1,2],"operations":[4]}}'],
    ] as [$brut, $attendu]) {
        $maj->execute([$brut, $id]);
        $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'coffres'], ['jeton' => $jetonS1]);
        vrai(str_contains($r['texte'], '"reglages":' . $attendu), "« $brut » → $attendu");
    }
    $maj->execute([$avant, $id]);
});

verifier("coffres-suivi — seul le propriétaire règle niveaux et opérations ; un collègue les voit ; l'élève les reçoit par son code et à l'échange du billet", function () use (&$jetonS1, &$classeCoffres) {
    vider_compteurs();
    $id = $classeCoffres['id'];
    $code = $classeCoffres['eleves'][0]['code'];
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['coffres' => ['niveaux' => [2], 'operations' => [1]]]], ['jeton' => $jetonS1]);
    $tmp = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'collegue-coffres'], ['jeton' => $jetonS1])['json']['motdepasse'];
    $jc = connexion('collegue-coffres', $tmp)['json']['jeton'];
    appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $tmp, 'nouveau' => 'coffres-collegue-2026'], ['jeton' => $jc]);
    $idc = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.annuaire'], ['jeton' => $jetonS1])['json']['profs'] as $pr) {
        if ($pr['identifiant'] === 'collegue-coffres') $idc = $pr['id'];
    }
    foreach (['lecture', 'ecriture'] as $droit) {
        appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $id, 'prof_id' => $idc, 'droit' => $droit], ['jeton' => $jetonS1]);
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['coffres' => ['niveaux' => [1]]]], ['jeton' => $jc]);
        egal(403, $r['code'], "un collègue en $droit ne règle pas Coffres");
        $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'coffres'], ['jeton' => $jc]);
        egal(['splat' => ['mondes' => [1, 2]], 'coffres' => ['niveaux' => [2], 'operations' => [1]]], $t['json']['classe']['reglages'], "un collègue en $droit voit les réglages");
        appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $id, 'prof_id' => $idc], ['jeton' => $jetonS1]);
    }
    $e = identite($code);
    // Lot « Qui voit quoi » (22/10/2026) : l'élève reçoit ses réglages dans
    // l'ordre du CATALOGUE (acces_de_l_eleve), plus dans l'ordre où le
    // professeur a cliqué — Coffres avant SPLAT!.
    egal(['coffres' => ['niveaux' => [2], 'operations' => [1]], 'splat' => ['mondes' => [1, 2]]], $e['json']['reglages'], 'par le code (l’espace élève, et l’appli qui relit l’identité)');
    $billet = appel('/api/eleve.php', ['code' => $code, 'billet' => true])['json']['billet'];
    $r = echanger($billet, ['appli' => 'coffres']);
    egal(200, $r['code'], 'l’échange du billet avec appli « coffres »');
    egal('entree', $r['json']['type']);
    egal(['coffres' => ['niveaux' => [2], 'operations' => [1]], 'splat' => ['mondes' => [1, 2]]], $r['json']['reglages'], 'à l’échange du billet (l’appli)');
    // Coffres décoché : l'élève ne reçoit plus rien de Coffres ; recoché : ses réglages reviennent.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1]);
    egal(['splat' => ['mondes' => [1, 2]]], identite($code)['json']['reglages'], 'Coffres décoché : rien de Coffres pour l’élève');
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'applis' => ['defi-tables', 'coffres', 'splat']], ['jeton' => $jetonS1]);
    egal(['coffres' => ['niveaux' => [2], 'operations' => [1]], 'splat' => ['mondes' => [1, 2]]], identite($code)['json']['reglages'], 'recoché : les mêmes réglages');
});

verifier("coffres-suivi — l'espace élève et « Ma classe » chargent le moteur Coffres d'ici, identique à celui du dépôt ; verifier.php le contrôle", function () use ($racine) {
    $r = page('/');
    vrai((bool)preg_match('#"prof/coffres-parcours\.js\?v=([0-9a-f]{10})"#', $r['texte'], $m), 'l’espace élève : le moteur est relatif, avec une version');
    vrai(str_contains($r['texte'], '"coffres":'), 'ICONES et JAUGES connaissent « coffres »');
    $moteur = page('/prof/coffres-parcours.js');
    egal(200, $moteur['code'], 'le moteur est servi');
    vrai(str_contains($moteur['texte'], 'MathsGoCoffresParcours'), "c'est bien le moteur de Coffres");
    egal(substr(md5($moteur['texte']), 0, 10), $m[1], 'la version dans l’adresse est l’empreinte du fichier servi');
    $original = dirname($racine) . '/assets/js/coffres-parcours.js';
    if (is_file($original)) {
        egal(md5_file($original), md5($moteur['texte']), 'octet pour octet le moteur du site (sinon : cp assets/js/coffres-parcours.js _serveur/public/prof/)');
    }
    $p = page('/prof/');
    vrai((bool)preg_match('#const MOTEUR_COFFRES = "coffres-parcours\.js\?v=([0-9a-f]{10})";#', $p['texte'], $mp), '« Ma classe » : l’adresse du moteur, relative, avec une version');
    egal($m[1], $mp[1], 'la même empreinte des deux côtés');
    vrai(!str_contains($p['texte'], '<script src="coffres-parcours.js'), 'pas chargé d’office : seulement à l’ouverture de l’onglet Coffres magiques');
    vrai(str_contains($p['texte'], '<button type="button" data-appli="coffres" aria-pressed="false">Coffres magiques</button>'), 'l’onglet Coffres magiques, entre Défi tables et SPLAT!');
    // Serveur pro, lot 5b : ses niveaux et opérations se règlent dans son onglet (« Régler Coffres magiques »).
    vrai(!str_contains($p['texte'], 'id="coffres-reglages"'), 'plus de cases de Coffres dans Réglages (lot 5b)');
    $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#class="etat oui">✓</span>\s*Moteur Coffres magiques servi localement\s*<div class="detail">en place \(#u', $v['texte']),
        'verifier.php : la ligne existe, et elle est verte');
});

verifier("coffres-suivi — le catalogue déclare exactement ce que le moteur exporte (clés, motif des niveaux, nombre de niveaux et d'opérations)", function () use ($racine) {
    require_once __DIR__ . '/../public/lib/applis.php';
    $moteur = (string)file_get_contents($racine . '/public/prof/coffres-parcours.js');
    vrai((bool)preg_match('#const CLES_SERVEUR = Object\.freeze\(\[(.*?)\]\);#s', $moteur, $m), 'CLES_SERVEUR du moteur');
    preg_match_all('#"([a-z]+)"#', $m[1], $cles);
    egal($cles[1], CATALOGUE_APPLIS['coffres']['cles'], 'les clés déclarées sont celles du moteur, dans l’ordre');
    vrai((bool)preg_match('#const MOTIF_NIVEAUX_PHP = "([^"]+)";#', $moteur, $mm), 'MOTIF_NIVEAUX_PHP du moteur');
    egal([$mm[1]], CATALOGUE_APPLIS['coffres']['motifs'], 'le motif des niveaux est celui du moteur');
    vrai((bool)preg_match('#const NOMBRE_NIVEAUX = (\d);#', $moteur, $mn) && (int)$mn[1] === CATALOGUE_APPLIS['coffres']['reglages']['niveaux'], 'autant de niveaux que le moteur');
    vrai((bool)preg_match('#const NOMBRE_OPERATIONS = (\d);#', $moteur, $mo) && (int)$mo[1] === CATALOGUE_APPLIS['coffres']['reglages']['operations'], 'autant d’opérations que le moteur');
    egal([], CATALOGUE_APPLIS['coffres']['mots'], 'aucun mot : le parcours n’a que des nombres, des booléens et des dates');
    egal(['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat', 'cours', 'soley'], array_keys(CATALOGUE_APPLIS), 'Coffres juste après Défi tables, puis Anzan (lot 4a, 23/10/2026), puis Cours (lot « cours-appli », 08/11/2026) : l’ordre des tuiles');
});

// ------------------------------------------------ lot « Qui voit quoi » (22/10/2026)
//
// Ce qu'un élève voit = ce que voit sa classe + ce qu'on lui a donné EN PLUS
// (décision de Gwenaël : on ajoute seulement, on ne retire jamais). Rangé dans
// eleves.ajouts (JSON, vide pour tout le monde au départ) :
// {"coffres": {}} = Coffres entière en plus, {"splat": {"mondes": [3]}} = le
// monde 3 en plus. Écrit par eleves.acces (propriétaire, lecture STRICTE,
// remplace la colonne entière), rendu au professeur (tableau : « ajouts » le
// rangé, « acces » le calculé) et à l'élève (api/eleve.php) sous les noms qui
// existent déjà, « applis » et « reglages » : l'espace élève, SPLAT!, Défi
// tables et Coffres n'ont rien à changer. Une seule règle, lib/applis.php,
// acces_de_l_eleve() — testée ici sur le tableau de la conception.

$qvq = null;

// Lecture directe de la colonne d'un élève (curseur fermé aussitôt : un
// curseur SQLite ouvert garde un verrou, et le serveur de test ne répond plus).
function ajouts_en_base(int $eleveId): ?string
{
    $ligne = bd_test()->prepare('SELECT ajouts FROM eleves WHERE id = ?');
    $ligne->execute([$eleveId]);
    $valeur = $ligne->fetchColumn();
    $ligne->closeCursor();
    return $valeur === false ? null : $valeur;
}

// Lot 3c : eleves.acces exige « avant », l'état rangé tel que la page le
// connaît. Ici, sauf quand le test en donne un autre, c'est ce que la colonne
// contient, lu comme le serveur le lit (ajouts_lus) et écrit comme il le rend
// à la page (ajouts_json) — exactement ce que la page renverrait.
function donner(int $eleveId, mixed $ajouts, string $jeton, mixed $avant = 'colonne'): array
{
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    if ($avant === 'colonne') $avant = ajouts_json(ajouts_lus(ajouts_en_base($eleveId)));
    return appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleveId, 'avant' => $avant, 'ajouts' => $ajouts], ['jeton' => $jeton]);
}

verifier("qui-voit-quoi — la règle « classe + ajouts » : les cinq lignes de la conception, et les cas tordus", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    // La classe 405 : Défi tables + SPLAT! mondes 1 et 2.
    $classe = ['applis' => 'defi-tables,splat', 'reglages' => '{"splat":{"mondes":[1,2]}}'];
    $regle = fn(?string $ajouts) => acces_de_l_eleve($classe, $ajouts);
    egal(['applis' => ['defi-tables', 'splat'], 'reglages' => ['splat' => ['mondes' => [1, 2]]]], $regle(null), 'NULL : la classe telle quelle');
    egal(['applis' => ['defi-tables', 'coffres', 'splat'], 'reglages' => ['splat' => ['mondes' => [1, 2]]]], $regle('{"coffres":{}}'),
        'Coffres entière en plus, dans l’ordre du catalogue ; ses niveaux et opérations : tous (rien d’écrit)');
    egal(['applis' => ['defi-tables', 'splat'], 'reglages' => ['splat' => ['mondes' => [1, 2, 3]]]], $regle('{"splat":{"mondes":[3]}}'), 'le monde 3 en plus');
    egal(['applis' => ['defi-tables', 'splat'], 'reglages' => []], $regle('{"splat":{"mondes":[3,4,5,6]}}'), 'les quatre autres en plus : tout ouvert, rien d’écrit');
    egal(['applis' => ['defi-tables', 'coffres', 'splat'], 'reglages' => ['coffres' => ['niveaux' => [2]], 'splat' => ['mondes' => [1, 2]]]],
        $regle('{"coffres":{"niveaux":[2]}}'), 'le niveau 2 de Coffres seul : ses opérations, que l’ajout ne nomme pas, restent toutes ouvertes');
    // SPLAT! « entière » (« {} ») à un élève dont la classe n'a que les mondes 1 et 2 : tout ouvert.
    egal(['applis' => ['defi-tables', 'splat'], 'reglages' => []], $regle('{"splat":{}}'), '« {} » ouvre tout, même quand la classe a déjà l’appli avec des mondes fermés');
    // Un ajout déjà donné par la classe ne change rien (D4 : il reste rangé, il ne se voit pas).
    egal(['splat' => ['mondes' => [1, 2]]], $regle('{"splat":{"mondes":[1,2]}}')['reglages'], 'les mondes 1 et 2 « en plus » : rien de plus');
    // Les réglages booléens suivent la classe.
    $avecRecords = ['applis' => 'defi-tables', 'reglages' => '{"defi-tables":{"records":false}}'];
    egal(['applis' => ['defi-tables'], 'reglages' => ['defi-tables' => ['records' => false]]], acces_de_l_eleve($avecRecords, '{"defi-tables":{"records":true}}'),
        '« records » n’est pas un réglage d’élève : la classe décide');
    // Une classe qui a tout ouvert : un ajout de monde n'écrit rien.
    egal([], acces_de_l_eleve(['applis' => 'splat'], '{"splat":{"mondes":[3]}}')['reglages'], 'tous ouverts + un monde = tous ouverts');
    // Une classe sans SPLAT! : « {} » l'ouvre entière, une liste ouvre ces mondes-là.
    egal([], acces_de_l_eleve(['applis' => 'defi-tables'], '{"splat":{}}')['reglages'], 'SPLAT! entière à un élève d’une classe sans SPLAT!');
    egal(['splat' => ['mondes' => [3]]], acces_de_l_eleve(['applis' => 'defi-tables'], '{"splat":{"mondes":[3]}}')['reglages'], 'le monde 3 seul (le stockage le permet, D3)');
    // Lecture indulgente de la colonne : ce qui est faux est ignoré, jamais
    // transformé en « tout ».
    foreach ([
        ['pas du json', []], ['[1,2]', []], ['{"inconnue":{}}', []], ['{"soley":{}}', []], ['{"automatismes":{}}', []],
        ['{"splat":{"mondes":[9]}}', []], ['{"splat":{"mondes":[]}}', []], ['{"splat":{"mondes":"3"}}', []], ['{"splat":[3]}', []],
        ['{"splat":{"tables":[1]}}', []], ['{"defi-tables":{"records":false}}', []],
        ['{"splat":[]}', ['splat' => []]], ['{"splat":{}}', ['splat' => []]],
        ['{"splat":{"mondes":[9,"2",3,3,"x",0]}}', ['splat' => ['mondes' => [3]]]],
        ['{"splat":{"mondes":[6,5,4,3,2,1]}}', ['splat' => ['mondes' => [1, 2, 3, 4, 5, 6]]]],
        ['{"coffres":{"niveaux":[9]}}', []],
        // Relecture Codex (22/10/2026) : un réglage NOMMÉ mais illisible fait
        // ignorer l'ajout entier — sinon « operations » disparaissait et la
        // règle l'ouvrait en entier (une restriction abîmée devenait « tout »).
        ['{"coffres":{"niveaux":[2],"operations":[9]}}', []],
        ['{"coffres":{"niveaux":[2],"operations":"1"}}', []],
        ['{"coffres":{"niveaux":[2],"operations":[]}}', []],
        ['{"coffres":{"niveaux":[2],"operations":[1]}}', ['coffres' => ['niveaux' => [2], 'operations' => [1]]]],
    ] as [$brut, $attendu]) {
        egal($attendu, ajouts_lus($brut), "« $brut »");
    }
    // Et ce que ces valeurs OUVRENT, à un élève d'une classe sans Coffres : rien
    // de plus que ce qui se lit — jamais toutes les opérations.
    $sansCoffres = ['applis' => 'defi-tables'];
    foreach (['{"coffres":{"niveaux":[2],"operations":[9]}}', '{"coffres":{"niveaux":[2],"operations":"1"}}', '{"coffres":{"niveaux":[2],"operations":[]}}'] as $brut) {
        egal(['applis' => ['defi-tables'], 'reglages' => []], acces_de_l_eleve($sansCoffres, $brut), "« $brut » n’ouvre pas Coffres");
    }
    egal(['applis' => ['defi-tables', 'coffres'], 'reglages' => ['coffres' => ['niveaux' => [2], 'operations' => [1]]]],
        acces_de_l_eleve($sansCoffres, '{"coffres":{"niveaux":[2],"operations":[1]}}'), 'lisible : exactement ce qui est écrit');
    egal('{"coffres":{},"splat":{"mondes":[3]}}', json_encode(ajouts_json(['coffres' => [], 'splat' => ['mondes' => [3]]])), 'en JSON, une appli entière s’écrit « {} », jamais « [] »');
    egal('{}', json_encode(ajouts_json([])), 'rien en plus : « {} »');
    egal(null, ajouts_pour_la_base([]), 'rien en plus : NULL en base');
});

verifier("qui-voit-quoi — par défaut rien en plus : le tableau rend « ajouts » vide et « acces » = la classe, l'élève reçoit ce qu'il recevait", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'qvq-405', 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1])['json']['id'];
    egal(200, appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['splat' => ['mondes' => [1, 2]]]], ['jeton' => $jetonS1])['code'], 'mondes 1 et 2 pour la classe');
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 3], ['jeton' => $jetonS1])['json']['eleves'];
    appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleves[0]['id'], 'prenom' => 'Léa', 'initiale' => 'B'], ['jeton' => $jetonS1]);
    $qvq = ['id' => $id, 'lea' => $eleves[0], 'lucas' => $eleves[1], 'temoin' => $eleves[2]];
    foreach ($eleves as $e) egal(null, ajouts_en_base((int)$e['id']), 'la colonne est vide');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'splat'], ['jeton' => $jetonS1]);
    egal(200, $t['code']);
    egal(3, count($t['json']['eleves']));
    foreach ($t['json']['eleves'] as $ligne) {
        egal([], $ligne['ajouts'], 'tableau : aucun ajout');
        // (Correctif B3 : avec ses portes de la liste du jour.)
        egal(['applis' => ['defi-tables', 'splat'], 'reglages' => ['splat' => ['mondes' => [1, 2]]], 'portes' => ['defi-tables', 'splat']], $ligne['acces'], 'tableau : il voit ce que voit sa classe');
    }
    vrai(substr_count($t['texte'], '"ajouts":{}') === 3, 'un objet JSON « {} » par élève, pas une liste « [] »');
    $e = identite($qvq['lea']['code']);
    egal(200, $e['code']);
    egal(['defi-tables', 'splat'], array_column($e['json']['applis'], 'cle'), 'par le code : les applis de la classe');
    egal(['cle' => 'splat', 'nom' => 'SPLAT!', 'description' => 'Six mondes de taches et de jetons, étape par étape.',
        'url' => 'https://mathsgo.re/outils/splat_univers.html', 'ancre' => null, 'disponible' => true], $e['json']['applis'][1], 'la même forme qu’avant : la page n’a rien à changer');
    egal(['splat' => ['mondes' => [1, 2]]], $e['json']['reglages'], 'et les mondes de la classe');
    vrai(!str_contains($e['texte'], 'ajouts'), 'l’élève ne reçoit pas le mot « ajouts » : il reçoit ce qu’il voit, sans savoir d’où ça vient');
});

verifier("qui-voit-quoi — eleves.acces range les ajouts, répond le rangé et le calculé, et l'élève voit la différence par son code et par le billet", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $lea = (int)$qvq['lea']['id'];
    $r = donner($lea, ['coffres' => new stdClass(), 'splat' => ['mondes' => [3, 3, 2]]], $jetonS1);
    egal(200, $r['code'], $r['texte']);
    egal(['coffres' => [], 'splat' => ['mondes' => [2, 3]]], $r['json']['ajouts'], 'le rangé : trié, sans doublon');
    vrai(str_contains($r['texte'], '"ajouts":{"coffres":{},"splat":{"mondes":[2,3]}}'), 'Coffres entière s’écrit « {} »');
    egal(['applis' => ['defi-tables', 'coffres', 'splat'], 'reglages' => ['splat' => ['mondes' => [1, 2, 3]]], 'portes' => ['defi-tables', 'coffres', 'splat']], $r['json']['acces'], 'le calculé : classe + ajouts');
    vrai(!str_contains($r['texte'], $qvq['lea']['code']), 'jamais le code');
    egal('{"coffres":{},"splat":{"mondes":[2,3]}}', ajouts_en_base($lea), 'en base');
    egal(null, ajouts_en_base((int)$qvq['lucas']['id']), 'Lucas n’a rien');
    // L'élève, par son code : Coffres apparaît, le monde 3 s'ouvre.
    $e = identite($qvq['lea']['code']);
    egal(['defi-tables', 'coffres', 'splat'], array_column($e['json']['applis'], 'cle'), 'Léa voit Coffres, dans l’ordre du catalogue');
    egal('Coffres magiques', $e['json']['applis'][1]['nom']);
    egal(['splat' => ['mondes' => [1, 2, 3]]], $e['json']['reglages'], 'et son monde 3');
    // Par le billet (la carte des mondes relit l'identité à l'échange).
    $billet = appel('/api/eleve.php', ['code' => $qvq['lea']['code'], 'billet' => true])['json']['billet'];
    $b = echanger($billet, ['appli' => 'splat']);
    egal(200, $b['code']);
    egal(['splat' => ['mondes' => [1, 2, 3]]], $b['json']['reglages'], 'à l’échange du billet aussi');
    // Lucas, lui, ne voit rien de plus.
    $l = identite($qvq['lucas']['code']);
    egal(['defi-tables', 'splat'], array_column($l['json']['applis'], 'cle'));
    egal(['splat' => ['mondes' => [1, 2]]], $l['json']['reglages']);
    // Le tableau montre les deux.
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $qvq['id'], 'appli' => 'splat'], ['jeton' => $jetonS1]);
    $parId = [];
    foreach ($t['json']['eleves'] as $ligne) $parId[(int)$ligne['id']] = $ligne;
    egal(['coffres' => [], 'splat' => ['mondes' => [2, 3]]], $parId[$lea]['ajouts']);
    egal(['applis' => ['defi-tables', 'coffres', 'splat'], 'reglages' => ['splat' => ['mondes' => [1, 2, 3]]], 'portes' => ['defi-tables', 'coffres', 'splat']], $parId[$lea]['acces']);
    egal([], $parId[(int)$qvq['lucas']['id']]['ajouts']);
    // L'onglet Coffres de la classe s'ouvre, même si la classe n'a pas Coffres : Léa y est.
    $tc = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $qvq['id'], 'appli' => 'coffres'], ['jeton' => $jetonS1]);
    egal(200, $tc['code'], 'le tableau Coffres d’une classe sans Coffres');
    egal(3, count($tc['json']['eleves']), 'la classe entière y est listée');
    // Tout envoyer remplace tout : « {} » efface, et l'élève revient à sa classe.
    $r = donner($lea, new stdClass(), $jetonS1);
    egal(200, $r['code']);
    vrai(str_contains($r['texte'], '"ajouts":{}'), 'réponse « {} »');
    egal(null, ajouts_en_base($lea), 'en base : NULL, comme un élève à qui on n’a jamais rien donné');
    egal(['defi-tables', 'splat'], array_column(identite($qvq['lea']['code'])['json']['applis'], 'cle'), 'Léa revoit sa classe, rien de plus');
    // SPLAT! entière (« {} ») à Léa, dont la classe n'a que les mondes 1 et 2 : tout ouvert.
    $r = donner($lea, ['splat' => new stdClass()], $jetonS1);
    egal(200, $r['code']);
    egal([], $r['json']['acces']['reglages'], 'SPLAT! entière : plus aucun monde fermé pour elle');
    vrai(str_contains(identite($qvq['lea']['code'])['texte'], '"reglages":{}'), 'par le code : « {} », tout ouvert');
    // Un envoi partiel remplace aussi : on ne fusionne pas.
    donner($lea, ['coffres' => new stdClass()], $jetonS1);
    donner($lea, ['splat' => ['mondes' => [3]]], $jetonS1);
    egal('{"splat":{"mondes":[3]}}', ajouts_en_base($lea), 'le second envoi a remplacé le premier (la fenêtre envoie tout son état)');
});

verifier("qui-voit-quoi — une valeur fausse est refusée avec un message, et rien n'est écrit", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $lea = (int)$qvq['lea']['id'];
    $avant = ajouts_en_base($lea);
    foreach ([
        ['tout', 'Ajouts illisibles.', 'une chaîne'],
        [[1, 2], 'Ajouts illisibles.', 'une liste'],
        [null, 'Ajouts illisibles.', 'rien'],
        [['inconnue' => new stdClass()], 'Application inconnue.', 'une appli inconnue'],
        [['soley' => new stdClass()], 'Application inconnue.', 'une appli fermée'],
        [['automatismes' => new stdClass()], 'Application inconnue.', 'une appli annoncée mais fermée'],
        [['splat' => 'mondes'], 'Ajout illisible.', 'un ajout illisible'],
        [['splat' => [3]], 'Ajout illisible.', 'une liste à la place de l’objet'],
        [['splat' => ['tables' => [1]]], 'Réglage inconnu.', 'un réglage non déclaré'],
        [['defi-tables' => ['records' => false]], 'Réglage inconnu.', 'un réglage booléen : ça ne se donne pas par élève'],
        [['splat' => ['mondes' => []]], "Une liste vide n'ajoute rien : retire plutôt l'activité.", 'aucun monde'],
        [['splat' => ['mondes' => [7]]], 'Monde inconnu.', 'un monde qui n’existe pas'],
        [['splat' => ['mondes' => [0, 1]]], 'Monde inconnu.', 'le monde 0'],
        [['splat' => ['mondes' => ['1']]], 'Monde inconnu.', 'un texte'],
        [['splat' => ['mondes' => [1.5]]], 'Monde inconnu.', 'un nombre à virgule'],
        [['splat' => ['mondes' => '1,2']], 'Liste de mondes illisible.', 'une chaîne'],
        [['splat' => ['mondes' => ['a' => 1]]], 'Liste de mondes illisible.', 'un objet'],
        [['coffres' => ['niveaux' => [4]]], 'Niveau inconnu.', 'un niveau de Coffres qui n’existe pas'],
        [['coffres' => ['operations' => [5]]], 'Opération inconnue.', 'une opération de Coffres qui n’existe pas'],
        [['coffres' => new stdClass(), 'splat' => ['mondes' => [9]]], 'Monde inconnu.', 'un bon et un mauvais : tout est refusé'],
    ] as [$ajouts, $message, $quoi]) {
        $r = donner($lea, $ajouts, $jetonS1);
        egal(400, $r['code'], "$quoi : refusé");
        egal($message, $r['json']['erreur'] ?? null, "$quoi : le message");
    }
    egal($avant, ajouts_en_base($lea), 'la colonne n’a pas bougé');
    // Un élève qui n'existe pas : introuvable, comme partout.
    egal(404, donner(999999, new stdClass(), $jetonS1)['code']);
});

// Lot 3c (relecture Codex du 22/10 au soir) : la page envoie « avant », l'état
// rangé tel qu'elle le connaît ; le serveur n'écrit que si la colonne le
// contient encore. Un onglet en retard (ou une réponse perdue en route) ne
// peut plus rouvrir un monde retiré ailleurs : il reçoit 409 et l'état vrai.
verifier("qui-voit-quoi 3c — « avant » égal : écrit ; égal dans un autre ordre : écrit ; différent : 409 avec l'état actuel, rien d'écrit ; absent ou illisible : 400", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $lea = (int)$qvq['lea']['id'];
    $lucas = (int)$qvq['lucas']['id'];
    egal('{"splat":{"mondes":[3]}}', ajouts_en_base($lea), 'point de départ : Léa a le monde 3');
    // Égal : on ouvre le 4.
    $r = donner($lea, ['splat' => ['mondes' => [3, 4]]], $jetonS1, ['splat' => ['mondes' => [3]]]);
    egal(200, $r['code'], $r['texte']);
    egal('{"splat":{"mondes":[3,4]}}', ajouts_en_base($lea), 'écrit');
    // Égal mais écrit autrement : numéros dans le désordre, applis et réglages dans un autre ordre.
    $r = donner($lea, ['coffres' => ['niveaux' => [2], 'operations' => [1]], 'splat' => ['mondes' => [3, 4]]], $jetonS1, ['splat' => ['mondes' => [4, 3]]]);
    egal(200, $r['code'], 'numéros dans le désordre : c’est le même état');
    $r = donner($lea, ['coffres' => ['niveaux' => [2], 'operations' => [1]], 'splat' => ['mondes' => [4]]], $jetonS1,
        ['splat' => ['mondes' => [3, 4]], 'coffres' => ['operations' => [1], 'niveaux' => [2]]]);
    egal(200, $r['code'], 'applis et réglages dans un autre ordre : c’est le même état');
    egal('{"coffres":{"niveaux":[2],"operations":[1]},"splat":{"mondes":[4]}}', ajouts_en_base($lea));
    // Différent : 409, l'état actuel dans la réponse, la colonne intacte, pas de ligne au journal.
    bd_test()->exec('DELETE FROM journal');
    $r = donner($lea, ['splat' => ['mondes' => [4, 5]]], $jetonS1, ['splat' => ['mondes' => [4]]]);
    egal(409, $r['code'], 'un « avant » qui oublie Coffres : refusé');
    egal(false, $r['json']['ok']);
    egal("Ce que voit Léa a changé ailleurs : la fenêtre est à jour, refais ton clic.", $r['json']['erreur'] ?? null, 'le message, avec le prénom');
    egal(['coffres' => ['niveaux' => [2], 'operations' => [1]], 'splat' => ['mondes' => [4]]], $r['json']['ajouts'], 'l’état rangé part avec le refus');
    egal(['applis' => ['defi-tables', 'coffres', 'splat'], 'reglages' => ['coffres' => ['niveaux' => [2], 'operations' => [1]], 'splat' => ['mondes' => [1, 2, 4]]],
        'portes' => ['defi-tables', 'coffres', 'splat']], $r['json']['acces'], 'et le calculé');
    vrai(!str_contains($r['texte'], $qvq['lea']['code']), 'jamais le code');
    egal('{"coffres":{"niveaux":[2],"operations":[1]},"splat":{"mondes":[4]}}', ajouts_en_base($lea), 'rien n’est écrit');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'eleves.acces'")->fetchColumn(), 'un 409 n’écrit pas au journal : rien n’a été fait');
    // Le scénario de Codex, à plat : départ [3, 4] ; l'onglet A retire le 4 ;
    // l'onglet B, en retard, croit encore à [3, 4] et ajoute le 5.
    donner($lucas, ['splat' => ['mondes' => [3, 4]]], $jetonS1, new stdClass());
    $a = donner($lucas, ['splat' => ['mondes' => [3]]], $jetonS1, ['splat' => ['mondes' => [3, 4]]]);
    egal(200, $a['code'], 'A retire le 4');
    $b = donner($lucas, ['splat' => ['mondes' => [3, 4, 5]]], $jetonS1, ['splat' => ['mondes' => [3, 4]]]);
    egal(409, $b['code'], 'B, en retard, est refusé');
    egal("Ce que voit cet élève a changé ailleurs : la fenêtre est à jour, refais ton clic.", $b['json']['erreur'], 'sans prénom : « cet élève »');
    egal(['splat' => ['mondes' => [3]]], $b['json']['ajouts'], 'B reçoit l’état vrai : le 4 est bien fermé');
    egal('{"splat":{"mondes":[3]}}', ajouts_en_base($lucas), 'le 4 reste fermé');
    // B refait son clic d'après ce qu'il vient de recevoir : ça passe.
    $b = donner($lucas, ['splat' => ['mondes' => [3, 5]]], $jetonS1, ['splat' => ['mondes' => [3]]]);
    egal(200, $b['code']);
    egal('{"splat":{"mondes":[3,5]}}', ajouts_en_base($lucas));
    // Une colonne vide se dit « {} » ; une colonne abîmée se lit comme le
    // tableau la rend (rien), donc « {} » passe aussi.
    egal(200, donner((int)$qvq['temoin']['id'], ['coffres' => new stdClass()], $jetonS1, new stdClass())['code'], 'colonne vide, avant « {} »');
    egal(409, donner((int)$qvq['temoin']['id'], new stdClass(), $jetonS1, new stdClass())['code'], 'colonne pleine, avant « {} » : refusé');
    bd_test()->prepare('UPDATE eleves SET ajouts = ? WHERE id = ?')->execute(['{"coffres":{"niveaux":[2],"operations":[9]}}', (int)$qvq['temoin']['id']]);
    egal(200, donner((int)$qvq['temoin']['id'], new stdClass(), $jetonS1, new stdClass())['code'], 'colonne abîmée (se lit « rien ») : « {} » est bien l’état connu');
    egal(null, ajouts_en_base((int)$qvq['temoin']['id']), 'et le retrait passe : NULL');
    // Absent ou illisible : 400, et rien n'est écrit — la page et le serveur
    // se déposent ensemble, une vieille page ne peut pas écrire à l'aveugle.
    $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $lea, 'ajouts' => new stdClass()], ['jeton' => $jetonS1]);
    egal(400, $r['code'], 'sans « avant »');
    egal("Il manque l'état d'avant : recharge la page et refais ton clic.", $r['json']['erreur'] ?? null);
    foreach ([
        ['x', 'une chaîne'], [[1, 2], 'une liste'], [null, 'null'], [['splat' => ['mondes' => []]], 'une liste vide'],
        [['inconnue' => new stdClass()], 'une appli inconnue'], [['splat' => ['mondes' => [9]]], 'un monde qui n’existe pas'],
    ] as [$avant, $quoi]) {
        $r = donner($lea, new stdClass(), $jetonS1, $avant);
        egal(400, $r['code'], "« avant » illisible ($quoi) : refusé");
        egal("État d'avant illisible : recharge la page et refais ton clic.", $r['json']['erreur'] ?? null, "« avant » illisible ($quoi) : le message");
    }
    egal('{"coffres":{"niveaux":[2],"operations":[1]},"splat":{"mondes":[4]}}', ajouts_en_base($lea), 'Léa : rien n’a bougé');
    // Remise en état pour la suite (le test du collègue part de « monde 3 »).
    egal(200, donner($lea, ['splat' => ['mondes' => [3]]], $jetonS1)['code']);
    egal(200, donner($lucas, new stdClass(), $jetonS1)['code']);
    egal('{"splat":{"mondes":[3]}}', ajouts_en_base($lea));
});

verifier("qui-voit-quoi 3c — deux demandes au même instant avec le même « avant » : une seule passe, l'autre reçoit 409 (rejoué cinq fois)", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $lucas = (int)$qvq['lucas']['id'];
    for ($tour = 1; $tour <= 5; $tour++) {
        egal(200, donner($lucas, ['splat' => ['mondes' => [3]]], $jetonS1)['code'], "tour $tour : départ [3]");
        $reponses = appels_paralleles_mixtes([
            ['chemin' => '/api/prof.php', 'jeton' => $jetonS1, 'corps' => ['action' => 'eleves.acces', 'eleve_id' => $lucas,
                'avant' => ['splat' => ['mondes' => [3]]], 'ajouts' => ['splat' => ['mondes' => [3, 4]]]]],
            ['chemin' => '/api/prof.php', 'jeton' => $jetonS1, 'corps' => ['action' => 'eleves.acces', 'eleve_id' => $lucas,
                'avant' => ['splat' => ['mondes' => [3]]], 'ajouts' => ['splat' => ['mondes' => [3, 5]]]]],
        ]);
        $codes = array_map(fn($r) => $r['code'], $reponses);
        sort($codes);
        egal([200, 409], $codes, "tour $tour : une seule passe (codes : " . json_encode($codes) . ')');
        $gagnant = $reponses[0]['code'] === 200 ? $reponses[0] : $reponses[1];
        $perdant = $reponses[0]['code'] === 200 ? $reponses[1] : $reponses[0];
        egal(json_encode($gagnant['json']['ajouts']), ajouts_en_base($lucas), "tour $tour : la base est ce que la gagnante a écrit");
        egal($gagnant['json']['ajouts'], $perdant['json']['ajouts'], "tour $tour : la perdante reçoit ce que la gagnante a écrit");
    }
    egal(200, donner($lucas, new stdClass(), $jetonS1)['code'], 'Lucas remis à rien');
});

verifier("qui-voit-quoi — le propriétaire seul donne ; un collègue voit « ajouts » et « acces », ne les change pas (refus journalisé)", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $tmp = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'collegue-qvq'], ['jeton' => $jetonS1])['json']['motdepasse'];
    $jc = connexion('collegue-qvq', $tmp)['json']['jeton'];
    appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $tmp, 'nouveau' => 'qvq-collegue-2026'], ['jeton' => $jc]);
    $idc = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $pr) {
        if ($pr['identifiant'] === 'collegue-qvq') $idc = $pr['id'];
    }
    $lea = (int)$qvq['lea']['id'];
    egal('{"splat":{"mondes":[3]}}', ajouts_en_base($lea), 'point de départ');
    // Sans partage : la classe n'existe pas pour lui.
    egal(404, donner($lea, new stdClass(), $jc)['code'], 'sans partage : introuvable');
    bd_test()->exec('DELETE FROM journal');
    foreach (['lecture', 'ecriture'] as $droit) {
        appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $qvq['id'], 'prof_id' => $idc], ['jeton' => $jetonS1]);
        egal(200, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $qvq['id'], 'prof_id' => $idc, 'droit' => $droit], ['jeton' => $jetonS1])['code'], "partage en $droit");
        $r = donner($lea, new stdClass(), $jc);
        egal(403, $r['code'], "un collègue en $droit ne donne rien à un élève");
        egal("Cette classe ne t'appartient pas : seul son propriétaire peut faire cela.", $r['json']['erreur'] ?? null, 'le même message que les autres actions du propriétaire');
        $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $qvq['id'], 'appli' => 'splat'], ['jeton' => $jc]);
        egal(200, $t['code']);
        $ligneLea = null;
        foreach ($t['json']['eleves'] as $ligne) if ((int)$ligne['id'] === $lea) $ligneLea = $ligne;
        egal(['splat' => ['mondes' => [3]]], $ligneLea['ajouts'], "un collègue en $droit voit la colonne « En plus »");
        egal(['splat' => ['mondes' => [1, 2, 3]]], $ligneLea['acces']['reglages'], "et les mondes de Léa");
        if ($droit === 'lecture') egal(null, $ligneLea['code'], 'en lecture, toujours pas de code');
    }
    egal(2, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'eleves.acces' AND resultat = 'refus'")->fetchColumn(), 'deux refus au journal');
    egal('{"splat":{"mondes":[3]}}', ajouts_en_base($lea), 'rien n’a bougé');
    appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $qvq['id'], 'prof_id' => $idc], ['jeton' => $jetonS1]);
    // Le journal : une ligne « eleves.acces » sur l'élève (son numéro), et
    // RIEN de ce qui a été donné — ni « coffres », ni un monde.
    bd_test()->exec('DELETE FROM journal');
    donner($lea, ['coffres' => new stdClass(), 'splat' => ['mondes' => [3]]], $jetonS1);
    $lignes = bd_test()->query("SELECT * FROM journal WHERE action = 'eleves.acces'")->fetchAll(PDO::FETCH_ASSOC);
    egal(1, count($lignes), 'une ligne');
    egal(['eleve', $lea, 'ok'], [$lignes[0]['cible_type'], (int)$lignes[0]['cible_id'], $lignes[0]['resultat']]);
    vrai(!str_contains(implode('|', $lignes[0]), 'coffres') && !str_contains(implode('|', $lignes[0]), 'splat'), 'ce qui a été donné est dans la ligne de l’élève, pas dans le journal');
});

verifier("qui-voit-quoi — D4 : un ajout rattrapé par la classe reste rangé ; si la classe referme, l'élève garde ; une appli décochée reste à qui l'a en plus", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $lea = (int)$qvq['lea']['id'];
    egal('{"coffres":{},"splat":{"mondes":[3]}}', ajouts_en_base($lea), 'point de départ : Coffres et le monde 3 en plus');
    // La classe ouvre le monde 3 à tout le monde : Léa voit la même chose, son ajout reste.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $qvq['id'], 'reglages' => ['splat' => ['mondes' => [1, 2, 3]]]], ['jeton' => $jetonS1]);
    egal(['splat' => ['mondes' => [1, 2, 3]]], identite($qvq['lea']['code'])['json']['reglages'], 'Léa : 1, 2, 3');
    egal(['splat' => ['mondes' => [1, 2, 3]]], identite($qvq['lucas']['code'])['json']['reglages'], 'Lucas aussi');
    egal('{"coffres":{},"splat":{"mondes":[3]}}', ajouts_en_base($lea), 'l’ajout est gardé (invisible tant que la classe l’a)');
    // La classe referme le monde 3 : Lucas le perd, Léa le garde.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $qvq['id'], 'reglages' => ['splat' => ['mondes' => [1, 2]]]], ['jeton' => $jetonS1]);
    egal(['splat' => ['mondes' => [1, 2, 3]]], identite($qvq['lea']['code'])['json']['reglages'], 'Léa garde son monde 3');
    egal(['splat' => ['mondes' => [1, 2]]], identite($qvq['lucas']['code'])['json']['reglages'], 'Lucas : 1 et 2');
    // La classe décoche SPLAT! : Lucas ne le voit plus ; Léa le garde, avec
    // son seul monde 3 (ce que son ajout nomme) — le stockage le permet (D3).
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $qvq['id'], 'applis' => ['defi-tables']], ['jeton' => $jetonS1]);
    $l = identite($qvq['lucas']['code'])['json'];
    egal(['defi-tables'], array_column($l['applis'], 'cle'), 'Lucas : Défi tables seul');
    vrai(!isset($l['reglages']['splat']), 'et plus rien de SPLAT!');
    $e = identite($qvq['lea']['code'])['json'];
    egal(['defi-tables', 'coffres', 'splat'], array_column($e['applis'], 'cle'), 'Léa : Coffres et SPLAT! par ses ajouts');
    egal(['splat' => ['mondes' => [3]]], $e['reglages'], 'SPLAT! : le monde 3 seul, ce que son ajout nomme');
    // La classe ouvre Coffres à tous, niveaux 1 et 2 : Léa l'a entière par son ajout.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $qvq['id'], 'applis' => ['defi-tables', 'coffres', 'splat'],
        'reglages' => ['coffres' => ['niveaux' => [1, 2]]]], ['jeton' => $jetonS1]);
    egal(['coffres' => ['niveaux' => [1, 2]], 'splat' => ['mondes' => [1, 2]]], identite($qvq['lucas']['code'])['json']['reglages'], 'Lucas : niveaux 1 et 2');
    egal(['splat' => ['mondes' => [1, 2, 3]]], identite($qvq['lea']['code'])['json']['reglages'], 'Léa : Coffres entière (rien d’écrit), et son monde 3');
    // Remise en état pour la suite.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $qvq['id'], 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1]);
});

// Serveur pro, lot 5b, correctif (relecture Codex du 30/10/2026, point 1) :
// classes.modifier reçoit « avant » comme eleves.acces — la liste des applis
// et les réglages de l'appli réglée, tels que la page les croit rangés — et
// n'écrit que si la ligne les contient encore ; sinon 409 avec l'état actuel.
function classe_qvq(array $qvq, string $jeton): array
{
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $qvq['id'], 'appli' => 'splat'], ['jeton' => $jeton]);
    return $t['json']['classe'];
}

function modifier_classe(int $classeId, array $changement, string $jeton, mixed $avant = 'rien'): array
{
    $corps = ['action' => 'classes.modifier', 'classe_id' => $classeId] + $changement;
    if ($avant !== 'rien') $corps['avant'] = $avant;
    return appel('/api/prof.php', $corps, ['jeton' => $jeton]);
}

verifier("serveur-pro 5b, correctif — classes.modifier avec « avant » : égal (même dans un autre ordre) → écrit ; différent → 409 avec l'état actuel, rien d'écrit ; illisible → 400 ; absent → comme avant", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $id = (int)$qvq['id'];
    egal('defi-tables,splat', classe_en_base($id)['applis'], 'point de départ : Défi tables et SPLAT!');
    egal('{"splat":{"mondes":[1,2]},"coffres":{"niveaux":[1,2]}}', classe_en_base($id)['reglages'], 'les mondes 1 et 2, et les niveaux gardés de Coffres');
    // « avant » égal : la liste des applis, dans un autre ordre ; les réglages de SPLAT! dans le désordre.
    $r = modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2, 4]]]], $jetonS1, ['applis' => ['splat', 'defi-tables'], 'reglages' => ['splat' => ['mondes' => [2, 1]]]]);
    egal(200, $r['code'], 'égal : écrit — ' . $r['texte']);
    egal('{"splat":{"mondes":[1,2,4]},"coffres":{"niveaux":[1,2]}}', classe_en_base($id)['reglages'], 'le monde 4 ouvert, les niveaux de Coffres gardés');
    // « avant » de la seule liste des applis, ou des seuls réglages : chacun suffit.
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat', 'flash-anzan']], $jetonS1, ['applis' => ['defi-tables', 'splat']])['code'], 'la liste seule');
    egal('defi-tables,flash-anzan,splat', classe_en_base($id)['applis']);
    egal(200, modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2, 4, 5]]]], $jetonS1, ['reglages' => ['splat' => ['mondes' => [1, 2, 4]]]])['code'], 'les réglages seuls');
    // « {} » pour une appli sans réglage (Anzan), ou dont tout est ouvert : c'est bien « tout ouvert ».
    egal(200, modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2, 4, 5]]]], $jetonS1, ['reglages' => ['flash-anzan' => new stdClass(), 'defi-tables' => new stdClass()]])['code'], '« {} » : Anzan sans réglage, Défi tables tout ouvert');
    // Les réglages d'une AUTRE appli ont changé : pas un conflit pour celle qu'on règle.
    egal(200, modifier_classe($id, ['reglages' => ['coffres' => ['niveaux' => [1]]]], $jetonS1)['code'], 'Coffres change (sans « avant », comme une vieille page)');
    egal(200, modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2, 5]]]], $jetonS1, ['applis' => ['defi-tables', 'flash-anzan', 'splat'], 'reglages' => ['splat' => ['mondes' => [1, 2, 4, 5]]]])['code'], 'SPLAT! réglé avec son « avant » à lui : écrit');
    egal('{"splat":{"mondes":[1,2,5]},"coffres":{"niveaux":[1]}}', classe_en_base($id)['reglages']);
    // Différent : 409, l'état actuel dans la réponse, rien d'écrit, pas de ligne au journal.
    bd_test()->exec('DELETE FROM journal');
    $r = modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2, 4, 5]]]], $jetonS1, ['reglages' => ['splat' => ['mondes' => [1, 2, 4]]]]);
    egal(409, $r['code'], 'un « avant » qui croit encore au monde 4 : refusé');
    egal(false, $r['json']['ok']);
    egal("La qvq-405 a été changée ailleurs : la fenêtre montre l'état actuel, refais ton réglage.", $r['json']['erreur'] ?? null, 'le message, avec le nom de la classe');
    egal(['defi-tables', 'flash-anzan', 'splat'], $r['json']['applis'], 'l’état actuel part avec le refus : les applis');
    egal(['splat' => ['mondes' => [1, 2, 5]], 'coffres' => ['niveaux' => [1]]], $r['json']['reglages'], 'et les réglages');
    egal('{"splat":{"mondes":[1,2,5]},"coffres":{"niveaux":[1]}}', classe_en_base($id)['reglages'], 'rien n’est écrit');
    $r = modifier_classe($id, ['applis' => ['defi-tables', 'splat', 'coffres']], $jetonS1, ['applis' => ['defi-tables', 'splat']]);
    egal(409, $r['code'], 'une liste d’applis qui a oublié Anzan : refusé (il serait retiré)');
    egal('defi-tables,flash-anzan,splat', classe_en_base($id)['applis'], 'Anzan reste');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'classes.modifier'")->fetchColumn(), 'un 409 n’écrit pas au journal');
    // Le scénario de Codex, à plat : l'onglet B ferme le monde 5 ; l'onglet A,
    // resté sur [1, 2, 5], ouvre le 4 → refusé ; A refait d'après l'état reçu.
    egal(200, modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2]]]], $jetonS1, ['reglages' => ['splat' => ['mondes' => [1, 2, 5]]]])['code'], 'B ferme le 5');
    $a = modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2, 4, 5]]]], $jetonS1, ['reglages' => ['splat' => ['mondes' => [1, 2, 5]]]]);
    egal(409, $a['code'], 'A, en retard, est refusé : le 5 n’est pas rouvert');
    egal(['splat' => ['mondes' => [1, 2]], 'coffres' => ['niveaux' => [1]]], $a['json']['reglages'], 'A reçoit l’état vrai');
    $a = modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2, 4]]]], $jetonS1, ['reglages' => ['splat' => ['mondes' => [1, 2]]]]);
    egal(200, $a['code'], 'A refait son geste sur l’état reçu : le 4 seul s’ouvre');
    egal('{"splat":{"mondes":[1,2,4]},"coffres":{"niveaux":[1]}}', classe_en_base($id)['reglages']);
    // Illisible : 400, rien d'écrit.
    foreach ([
        ['x', 'une chaîne'], [[1, 2], 'une liste'], [['tables' => []], 'une clé inconnue'], [['applis' => 'splat'], 'applis en chaîne'],
        [['applis' => [1]], 'applis avec un nombre'], [['reglages' => [['mondes' => [1]]]], 'reglages en liste'], [['reglages' => ['inconnue' => new stdClass()]], 'une appli inconnue'],
        [['reglages' => ['splat' => ['mondes' => [9]]]], 'un monde qui n’existe pas'], [['reglages' => ['splat' => 'mondes']], 'un réglage illisible'],
    ] as [$avant, $quoi]) {
        $r = modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1]]]], $jetonS1, $avant);
        egal(400, $r['code'], "« avant » illisible ($quoi) : refusé");
        egal("État d'avant illisible : recharge la page et refais ton réglage.", $r['json']['erreur'] ?? null, "« avant » illisible ($quoi) : le message");
    }
    egal('{"splat":{"mondes":[1,2,4]},"coffres":{"niveaux":[1]}}', classe_en_base($id)['reglages'], 'rien n’a bougé');
    // Une appli inconnue dans la liste de la page (un vieux nom) ne fait pas un conflit.
    egal(200, modifier_classe($id, ['libelle' => 'qvq-405'], $jetonS1, ['applis' => ['defi-tables', 'flash-anzan', 'splat', 'vieille-appli']])['code']);
    // Un collègue : refusé par le droit, « avant » ou pas (le test du propriétaire seul le vérifie déjà sans « avant »).
    // Remise en état pour la suite.
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat'], 'reglages' => ['splat' => ['mondes' => [1, 2]], 'coffres' => ['niveaux' => [1, 2]]]], $jetonS1)['code']);
    egal('defi-tables,splat', classe_en_base($id)['applis']);
    egal('{"splat":{"mondes":[1,2]},"coffres":{"niveaux":[1,2]}}', classe_en_base($id)['reglages']);
});

verifier("serveur-pro 5b, correctif — deux classes.modifier au même instant avec le même « avant » : une seule passe, l'autre reçoit 409 (rejoué cinq fois)", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $id = (int)$qvq['id'];
    for ($tour = 1; $tour <= 5; $tour++) {
        egal(200, modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2]]]], $jetonS1)['code'], "tour $tour : départ [1, 2]");
        $reponses = appels_paralleles_mixtes([
            ['chemin' => '/api/prof.php', 'jeton' => $jetonS1, 'corps' => ['action' => 'classes.modifier', 'classe_id' => $id,
                'avant' => ['reglages' => ['splat' => ['mondes' => [1, 2]]]], 'reglages' => ['splat' => ['mondes' => [1, 2, 3]]]]],
            ['chemin' => '/api/prof.php', 'jeton' => $jetonS1, 'corps' => ['action' => 'classes.modifier', 'classe_id' => $id,
                'avant' => ['reglages' => ['splat' => ['mondes' => [1, 2]]]], 'reglages' => ['splat' => ['mondes' => [1, 2, 4]]]]],
        ]);
        $codes = array_map(fn($r) => $r['code'], $reponses);
        sort($codes);
        egal([200, 409], $codes, "tour $tour : une seule passe (codes : " . json_encode($codes) . ')');
        $gagnant = $reponses[0]['code'] === 200 ? $reponses[0] : $reponses[1];
        $perdant = $reponses[0]['code'] === 200 ? $reponses[1] : $reponses[0];
        egal($gagnant['json']['reglages']['splat'], $perdant['json']['reglages']['splat'], "tour $tour : la perdante reçoit ce que la gagnante a écrit");
        egal(json_encode($gagnant['json']['reglages']['splat']), json_encode(json_decode(classe_en_base($id)['reglages'], true)['splat']), "tour $tour : la base est ce que la gagnante a écrit");
    }
    egal(200, modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2]]]], $jetonS1)['code'], 'remis à [1, 2]');
});

verifier("qui-voit-quoi — parcours.php ne refuse rien (Q1 = non, comme les mondes de SPLAT!) : ouvrir guide, ça ne verrouille pas", function () use (&$qvq) {
    vider_compteurs();
    // Lucas n'a pas Coffres ; son appli peut quand même enregistrer (un lien
    // d'entrée fabriqué à la main) : le professeur le verrait dans son
    // Parcours, rien de plus. Décision de Gwenaël du 22/10/2026.
    $r = ecrire($qvq['lucas']['code'], ['version' => VERSION_COFFRES, 'epoque' => 0, 'niveaux' => ['1' => ['tresors' => 1, 'parfaits' => 0]]], 0, 'coffres');
    egal(200, $r['code'], 'enregistré, sans refus : ' . $r['texte']);
    egal(200, lire($qvq['lucas']['code'], 'coffres')['code']);
});

verifier("qui-voit-quoi — en base, une valeur abîmée se lit « rien en plus » ou ce qui reste lisible, jamais une panne", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $lea = (int)$qvq['lea']['id'];
    $maj = bd_test()->prepare('UPDATE eleves SET ajouts = ? WHERE id = ?');
    foreach ([
        ['pas du json', ['defi-tables', 'splat'], '{"splat":{"mondes":[1,2]}}'],
        ['[1,2]', ['defi-tables', 'splat'], '{"splat":{"mondes":[1,2]}}'],
        ['{"inconnue":{}}', ['defi-tables', 'splat'], '{"splat":{"mondes":[1,2]}}'],
        ['{"splat":{"mondes":[9]}}', ['defi-tables', 'splat'], '{"splat":{"mondes":[1,2]}}'],
        ['{"splat":{"mondes":[9,"2",3,3]}}', ['defi-tables', 'splat'], '{"splat":{"mondes":[1,2,3]}}'],
        ['{"coffres":[]}', ['defi-tables', 'coffres', 'splat'], '{"splat":{"mondes":[1,2]}}'],
        ['{"coffres":{"niveaux":[2],"operations":[9]}}', ['defi-tables', 'splat'], '{"splat":{"mondes":[1,2]}}'],
        ['', ['defi-tables', 'splat'], '{"splat":{"mondes":[1,2]}}'],
    ] as [$brut, $applis, $reglages]) {
        $maj->execute([$brut, $lea]);
        $r = identite($qvq['lea']['code']);
        egal(200, $r['code'], "« $brut » : l’élève entre");
        egal($applis, array_column($r['json']['applis'], 'cle'), "« $brut » : ses applis");
        vrai(str_contains($r['texte'], '"reglages":' . $reglages), "« $brut » → $reglages");
        $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $qvq['id'], 'appli' => 'splat'], ['jeton' => $jetonS1]);
        egal(200, $t['code'], "« $brut » : Ma classe s’ouvre");
    }
    $maj->execute(['{"coffres":{},"splat":{"mondes":[3]}}', $lea]);
});

verifier("qui-voit-quoi — avant migrer.php (colonne absente) : tout se lit « rien en plus », seul « Ce que voit… » demande la mise à niveau", function () use (&$jetonS1, &$qvq) {
    vider_compteurs();
    $lea = (int)$qvq['lea']['id'];
    // La base d'avant migrer.php : la colonne retirée le temps de l'essai
    // (SQLite comme MySQL savent le faire), remise par migrer_schema() dans le
    // finally. Léa perd ses ajouts avec la colonne : c'est l'état d'un serveur
    // qui n'a jamais eu le lot.
    bd_test()->exec('ALTER TABLE eleves DROP COLUMN ajouts');
    try {
        egal(false, colonne_existe(bd_test(), 'eleves', 'ajouts'), 'la colonne est retirée pour l’essai');
        $e = identite($qvq['lea']['code']);
        egal(200, $e['code'], 'l’élève entre');
        egal(['defi-tables', 'splat'], array_column($e['json']['applis'], 'cle'), 'et voit sa classe');
        vrai(str_contains($e['texte'], '"reglages":{"splat":{"mondes":[1,2]}}'), 'avec ses mondes');
        $billet = appel('/api/eleve.php', ['code' => $qvq['lea']['code'], 'billet' => true])['json']['billet'];
        egal(200, echanger($billet, ['appli' => 'splat'])['code'], 'le billet s’échange');
        egal(200, appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['code'], 'Ma classe s’ouvre');
        $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $qvq['id'], 'appli' => 'splat'], ['jeton' => $jetonS1]);
        egal(200, $t['code'], 'le tableau aussi');
        egal([], $t['json']['eleves'][0]['ajouts'], 'rien en plus pour personne');
        egal(['defi-tables', 'splat'], $t['json']['eleves'][0]['acces']['applis']);
        egal(200, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $lea, 'prenom' => 'Léa', 'initiale' => 'B'], ['jeton' => $jetonS1])['code'], 'nommer marche encore');
        $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $lea, 'avant' => new stdClass(), 'ajouts' => ['coffres' => new stdClass()]], ['jeton' => $jetonS1]);
        egal(503, $r['code'], 'donner quelque chose : mise à niveau à faire');
        vrai(str_contains($r['json']['erreur'] ?? '', 'migrer.php'), 'le message dit quoi faire : ' . ($r['json']['erreur'] ?? ''));
        $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
        vrai((bool)preg_match('#class="etat non">✗</span>\s*Ajouts par élève\s*<div class="detail">manque la colonne « eleves\.ajouts » — ouvre migrer\.php#u', $v['texte']),
            'verifier.php le dit, en rouge');
    } finally {
        $faits = migrer_schema(bd_test());
    }
    vrai(in_array("Colonne « ajouts » ajoutée aux élèves (ce qu'un professeur ouvre à un élève en plus de sa classe).", $faits, true),
        'migrer.php ajoute la colonne et le dit : ' . implode(' | ', $faits));
    egal([], migrer_schema(bd_test()), 'relancer ne fait plus rien');
    egal(true, colonne_existe(bd_test(), 'eleves', 'ajouts'));
    $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#class="etat oui">✓</span>\s*Ajouts par élève\s*<div class="detail">en place \(aucun élève n’a quelque chose en plus de sa classe\)#u', $v['texte']),
        'verifier.php : la ligne est verte, et compte zéro');
    $r = donner($lea, ['coffres' => new stdClass()], $jetonS1);
    egal(200, $r['code'], 'après la mise à niveau, donner marche');
    $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#Ajouts par élève\s*<div class="detail">en place \(1 élève\(s\) avec quelque chose en plus de sa classe\)#u', $v['texte']),
        'verifier.php compte Léa');
});

// ------------------------------------------------- 🏆 Les records (lot du 09/10/2026)
//
// Le défi d'après la couronne (lib/records.php, api/records.php) : une
// Légende court les 25 questions, son meilleur temps entre dans la ligue de
// son professeur. Ce que ces tests prouvent : seule une Légende est
// acceptée ; 25 sur 25 et un temps humain, sinon refus net ; le meilleur
// temps seul est gardé, celui de la semaine à part ; le nom affiché (prénom,
// initiale pour les homonymes, Mystère, jamais la classe) ; les ex æquo ; le
// cloisonnement par professeur ; la case par classe ; ce qui part avec
// l'élève ; la fiche et le tableau du professeur ; la mise à niveau.

$recClasse = null;
$recEleves = [];
$recJetonClaire = null;
$recCodeClaire = null;

// Une progression Défi tables qui porte la couronne : c'est la SEULE clé que
// le serveur lit pour dire « Légende » (lib/records.php, est_legende).
function progression_legende(bool $couronne): array
{
    return ['version' => VERSION_TABLES, 'epoque' => 0, 'tables' => [], 'expert' => ['etoiles' => $couronne ? 5 : 4, 'dernier' => '2026-10-09', 'couronne' => $couronne ? '2026-10-09' : null], 'calculs' => []];
}

function records_api(string $code, array $corps): array
{
    return appel('/api/records.php', ['code' => $code] + $corps);
}

// Lot « correctifs de l'audit Codex » (29/10/2026) : une course part avec
// son TICKET de départ. Le ticket est demandé comme l'appli le fait
// (« depart »), puis son départ est VIEILLI dans la base de test d'autant
// que la course a duré (plus cinq secondes de marge) — sans quoi il faudrait
// attendre pour de vrai. Un ticket se lit dans « billets » (type « course »,
// empreinte SHA-256), et son départ = expire_le - 8 jours.
function ticket_de_course(string $code, int $reculSecondes = 0): string
{
    $r = records_api($code, ['depart' => true]);
    if ($r['code'] !== 200 || !is_string($r['json']['course'] ?? null)) {
        throw new RuntimeException('pas de ticket de course : HTTP ' . $r['code'] . ' ' . $r['texte']);
    }
    $ticket = $r['json']['course'];
    if ($reculSecondes > 0) vieillir_ticket($ticket, $reculSecondes);
    return $ticket;
}

function vieillir_ticket(string $ticket, int $reculSecondes): void
{
    bd_test()->prepare('UPDATE billets SET expire_le = expire_le - ? WHERE hash = ?')
        ->execute([$reculSecondes, hash('sha256', $ticket)]);
}

function courir(string $code, int $dixiemes, array $enPlus = []): array
{
    $ticket = ticket_de_course($code, intdiv($dixiemes, 10) + 5);
    return records_api($code, ['temps' => $dixiemes, 'justes' => 25, 'course' => $ticket] + $enPlus);
}

verifier("records — préparation : une classe de quatre élèves, deux Légendes, une classe d'un collègue", function () use (&$jetonS1, &$recClasse, &$recEleves, &$recJetonClaire, &$recCodeClaire) {
    vider_compteurs();
    $recClasse = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => '306', 'applis' => ['defi-tables']], ['jeton' => $jetonS1])['json']['id'];
    $recEleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $recClasse, 'nombre' => 4], ['jeton' => $jetonS1])['json']['eleves'];
    foreach ([['Toti', 'R'], ['Léa', 'B'], ['Léa', 'M'], ['', '']] as $i => [$prenom, $initiale]) {
        appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $recEleves[$i]['id'], 'prenom' => $prenom, 'initiale' => $initiale], ['jeton' => $jetonS1]);
    }
    // Toti, Léa B. et l'élève sans prénom sont Légendes ; Léa M. a quatre étoiles.
    foreach ([0 => true, 1 => true, 2 => false, 3 => true] as $i => $couronne) {
        $r = appel('/api/parcours.php', ['code' => $recEleves[$i]['code'], 'appli' => 'defi-tables', 'parcours' => progression_legende($couronne), 'base_revision' => 0]);
        egal(200, $r['code'], "progression de l'élève $i");
    }
    // Un collègue tout neuf, avec sa propre classe et un élève Légende.
    $temporaire = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'collegue-records'], ['jeton' => $jetonS1])['json']['motdepasse'] ?? '';
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'collegue-records', 'motdepasse' => $temporaire]);
    egal(200, $r['code'], 'le collègue se connecte');
    $recJetonClaire = $r['json']['jeton'];
    egal(200, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $temporaire, 'nouveau' => 'phrase-du-voisin-2026'], ['jeton' => $recJetonClaire])['code'], 'il choisit son mot de passe');
    $classeClaire = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'CM2', 'applis' => ['defi-tables']], ['jeton' => $recJetonClaire])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classeClaire, 'nombre' => 1], ['jeton' => $recJetonClaire])['json']['eleves'][0];
    appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $eleve['id'], 'prenom' => 'Jade', 'initiale' => ''], ['jeton' => $recJetonClaire]);
    appel('/api/parcours.php', ['code' => $eleve['code'], 'appli' => 'defi-tables', 'parcours' => progression_legende(true), 'base_revision' => 0]);
    $recCodeClaire = $eleve['code'];
});

verifier("records — la table existe sur une base neuve, et migrer.php la crée (et le dit) sur une base d'avant", function () {
    require_once __DIR__ . '/../public/lib/records.php';
    egal(true, table_existe(bd_test(), 'records'), 'installer.php a créé la table');
    bd_test()->exec('DROP TABLE records');
    $faits = migrer_schema(bd_test());
    vrai(in_array('Table « records » créée (les meilleurs temps des Légendes des tables).', $faits, true), 'migrer.php la crée et le dit : ' . implode(' | ', $faits));
    egal([], migrer_schema(bd_test()), 'relancer ne fait plus rien');
    $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#class="etat oui">✓</span>\s*Les records \(Défi tables\)\s*<div class="detail">en place \(aucun temps enregistré pour le moment\)#u', $v['texte']), 'verifier.php : la ligne est verte, aucun temps');
});

verifier("records — pas de code, mauvais code, pas Légende : rien n'entre", function () use (&$recEleves) {
    vider_compteurs();
    egal(405, appel('/api/records.php', null, ['methode' => 'GET'])['code'], 'GET refusé');
    egal(400, records_api('AB', ['lire' => true])['code'], 'code mal formé');
    egal(404, records_api('ZZZZZZ', ['lire' => true])['code'], 'code inconnu');
    // Léa M. (quatre étoiles) : elle lit la ligue (vide), mais sa course est refusée.
    $r = records_api($recEleves[2]['code'], ['lire' => true]);
    egal(200, $r['code']);
    egal(false, $r['json']['legende'], 'pas Légende');
    egal(null, $r['json']['record']['meilleur'], 'aucun record');
    egal([], $r['json']['toujours'], 'ligue vide');
    $r = courir($recEleves[2]['code'], 498);
    egal(409, $r['code'], 'pas encore Légende : 409, l’appli réessaiera');
    egal(false, $r['json']['legende']);
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM records')->fetchColumn(), 'rien n’est écrit');
    // Lot « correctifs de l'audit Codex » : le ticket n'est PAS consommé par
    // le 409 — l'appli renverra la même course, avec le même ticket.
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE type = 'course' AND eleve_id = " . (int)$recEleves[2]['id'])->fetchColumn(), 'le ticket attend encore');
});

verifier("records — une course refusée pour de bon : pas 25 sur 25, trop rapide, trop longue, illisible", function () use (&$recEleves) {
    vider_compteurs();
    $toti = $recEleves[0]['code'];
    foreach ([
        [['temps' => 498, 'justes' => 24], 'Le temps ne compte pas : il faut tout juste.', 'une erreur'],
        [['temps' => 498, 'justes' => 26], 'Le temps ne compte pas : il faut tout juste.', 'plus de 25'],
        [['temps' => 149, 'justes' => 25], 'Le temps ne compte pas.', 'sous le seuil de 15 s (robot)'],
        [['temps' => 100, 'justes' => 25], 'Le temps ne compte pas.', '10 s : accepté jusqu’au 11/11, refusé depuis (audit GPT F04)'],
        [['temps' => 36001, 'justes' => 25], 'Le temps ne compte pas.', 'plus d’une heure'],
        [['temps' => '498', 'justes' => 25], 'Temps illisible.', 'un texte'],
        [['temps' => 49.8, 'justes' => 25], 'Temps illisible.', 'un nombre à virgule'],
        [['temps' => 498], 'Temps illisible.', 'sans « justes »'],
        [['nom' => 'oui'], 'Choix illisible.', 'un nom qui n’est pas un booléen'],
        [['autre' => 1], 'Demande illisible.', 'rien de connu'],
    ] as [$corps, $message, $quoi]) {
        $r = records_api($toti, $corps);
        egal(400, $r['code'], "$quoi : refusé");
        egal($message, $r['json']['erreur'] ?? null, "$quoi : le message");
    }
    egal(150, SEUIL_COURSE_DIXIEMES, 'le seuil : 15 secondes (10 s le 09/10/2026 ; remonté le 11/11/2026, audit GPT F04)');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM records')->fetchColumn(), 'rien n’est écrit');
});

verifier("records — la première course d'une Légende : nouveau record, temps de la semaine, 1er, affiché « Mystère » tant que rien n'est choisi", function () use (&$recEleves) {
    vider_compteurs();
    $toti = $recEleves[0]['code'];
    $r = courir($toti, 498);
    egal(200, $r['code'], 'code HTTP');
    egal(true, $r['json']['nouveau'], 'nouveau record');
    egal(null, $r['json']['avant'], 'aucun temps avant');
    egal(498, $r['json']['record']['meilleur']);
    egal(498, $r['json']['record']['semaine']);
    egal(lundi_courant(), $r['json']['record']['lundi'], 'le lundi de la semaine en cours');
    egal(null, $r['json']['record']['nom'], 'aucun choix de nom');
    egal(1, $r['json']['rangSemaine']);
    egal(1, $r['json']['rangToujours']);
    egal([['rang' => 1, 'nom' => 'Mystère', 'temps' => 498, 'moi' => true]], $r['json']['toujours'], 'affiché Mystère : rien n’est révélé sans son choix');
    egal($r['json']['toujours'], $r['json']['semaine'], 'les deux tableaux');
    $ligne = bd_test()->query('SELECT * FROM records')->fetch();
    egal('498', (string)$ligne['meilleur']);
    vrai((bool)preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/', (string)$ligne['meilleur_le']), 'l’instant du record est gardé, à la microseconde (ex æquo)');
    egal(null, $ligne['nom']);
});

verifier("records — le choix du nom : prénom ou Mystère, changeable ; les homonymes prennent l'initiale ; jamais la classe ; sans prénom, « Élève »", function () use (&$recEleves) {
    vider_compteurs();
    $toti = $recEleves[0]['code'];
    $r = records_api($toti, ['nom' => true]);
    egal(200, $r['code']);
    egal(true, $r['json']['record']['nom']);
    egal('Toti', $r['json']['toujours'][0]['nom'], 'le prénom, sans initiale (pas d’homonyme), sans classe');
    // Les deux Léa : Léa B. (Légende) court ; Léa M. n'est pas Légende, donc
    // pas d'homonyme dans la ligue → « Léa » seule.
    courir($recEleves[1]['code'], 520);
    records_api($recEleves[1]['code'], ['nom' => true]);
    $r = records_api($toti, ['lire' => true]);
    egal(['Toti', 'Léa'], array_column($r['json']['toujours'], 'nom'), 'Léa seule : l’autre Léa n’est pas dans la ligue');
    // Léa M. devient Légende et court : deux Léa affichées → « Léa B. » et « Léa M. ».
    appel('/api/parcours.php', ['code' => $recEleves[2]['code'], 'appli' => 'defi-tables', 'parcours' => progression_legende(true), 'base_revision' => 1]);
    courir($recEleves[2]['code'], 613);
    records_api($recEleves[2]['code'], ['nom' => true]);
    $r = records_api($toti, ['lire' => true]);
    egal(['Toti', 'Léa B.', 'Léa M.'], array_column($r['json']['toujours'], 'nom'), 'les homonymes prennent l’initiale');
    // L'élève sans prénom : « Élève ».
    courir($recEleves[3]['code'], 700);
    records_api($recEleves[3]['code'], ['nom' => true]);
    $r = records_api($toti, ['lire' => true]);
    egal('Élève', $r['json']['toujours'][3]['nom']);
    // Mystère, à volonté.
    $r = records_api($recEleves[1]['code'], ['nom' => false]);
    egal(false, $r['json']['record']['nom']);
    egal(['Toti', 'Mystère', 'Léa', 'Élève'], array_column($r['json']['toujours'], 'nom'), 'Léa M. redevient « Léa » : plus d’homonyme affiché');
    egal(true, $r['json']['toujours'][1]['moi'], 'sa ligne reste la sienne');
    vrai(!str_contains(json_encode($r['json'], JSON_UNESCAPED_UNICODE), '306'), 'la classe n’apparaît nulle part');
    vrai(!str_contains($r['texte'], $toti), 'aucun code dans la réponse');
});

verifier("records — seul le MEILLEUR temps est gardé ; le temps de la semaine vit à part ; les ex æquo : le premier arrivé devant", function () use (&$recEleves) {
    vider_compteurs();
    $toti = $recEleves[0]['code'];
    $r = courir($toti, 531);
    egal(false, $r['json']['nouveau'], 'moins bien : pas un record');
    egal(498, $r['json']['avant']);
    egal(498, $r['json']['record']['meilleur'], 'le record reste');
    $r = courir($toti, 450);
    egal(true, $r['json']['nouveau'], 'mieux : record battu');
    egal(498, $r['json']['avant'], 'l’ancien, pour « (avant : 49,8 s) »');
    egal(450, $r['json']['record']['meilleur']);
    egal(450, $r['json']['record']['semaine']);
    // La semaine passée : le temps de la semaine ne compte plus, le record reste.
    bd_test()->prepare('UPDATE records SET semaine = 300, semaine_lundi = ? WHERE eleve_id = ?')->execute(['2026-09-28', $recEleves[0]['id']]);
    $r = records_api($toti, ['lire' => true]);
    egal(null, $r['json']['record']['semaine'], 'pas de temps cette semaine');
    egal(null, $r['json']['rangSemaine'], 'donc pas de rang de la semaine');
    egal(1, $r['json']['rangToujours'], 'mais toujours premier de tous les temps');
    vrai(!in_array(300, array_column($r['json']['semaine'], 'temps'), true), 'l’ancien temps de semaine n’est pas dans le tableau');
    // Une course cette semaine : le temps de la semaine est remplacé, même moins bon que l'ancien.
    $r = courir($toti, 560);
    egal(560, $r['json']['record']['semaine'], 'la nouvelle semaine repart de cette course');
    egal(450, $r['json']['record']['meilleur'], 'le record ne bouge pas');
    // Ex æquo : Léa B. (Mystère) fait 450 après Toti → Toti devant.
    courir($recEleves[1]['code'], 450);
    $r = records_api($toti, ['lire' => true]);
    egal(['Toti', 'Mystère'], array_slice(array_column($r['json']['toujours'], 'nom'), 0, 2), 'le premier arrivé devant');
    egal([1, 2], array_slice(array_column($r['json']['toujours'], 'rang'), 0, 2));
});

verifier("records — cloisonnement : un élève ne voit que la ligue de SON professeur ; records.ligue rend celle du professeur connecté ; un collègue en lecture ne voit rien de plus", function () use (&$recEleves, &$jetonS1, &$recJetonClaire, &$recCodeClaire, &$recClasse) {
    vider_compteurs();
    courir($recCodeClaire, 386);
    records_api($recCodeClaire, ['nom' => true]);
    $r = records_api($recCodeClaire, ['lire' => true]);
    egal(['Jade'], array_column($r['json']['toujours'], 'nom'), 'Jade ne voit que la ligue de son professeur');
    $r = records_api($recEleves[0]['code'], ['lire' => true]);
    vrai(!in_array('Jade', array_column($r['json']['toujours'], 'nom'), true), 'Toti ne voit pas Jade');
    $r = appel('/api/prof.php', ['action' => 'records.ligue'], ['jeton' => $jetonS1]);
    egal(200, $r['code']);
    vrai(!in_array('Jade', array_column($r['json']['toujours'], 'nom'), true), 'la ligue de gwenael : sans Jade');
    vrai(in_array('Toti', array_column($r['json']['toujours'], 'nom'), true), 'avec Toti');
    vrai(!isset($r['json']['record']) && !array_key_exists('rangToujours', $r['json']) || $r['json']['rangToujours'] === null, 'pas de « moi » pour le professeur');
    $r = appel('/api/prof.php', ['action' => 'records.ligue'], ['jeton' => $recJetonClaire]);
    egal(['Jade'], array_column($r['json']['toujours'], 'nom'), 'la ligue du collègue : Jade seule');
    // La 306 partagée au collègue en lecture : sa ligue ne change pas.
    $claireId = (int)bd_test()->query("SELECT id FROM profs WHERE identifiant = 'collegue-records'")->fetchColumn();
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $recClasse, 'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jetonS1]);
    $r = appel('/api/prof.php', ['action' => 'records.ligue'], ['jeton' => $recJetonClaire]);
    egal(['Jade'], array_column($r['json']['toujours'], 'nom'), 'une classe partagée n’entre pas dans la ligue du collègue');
    egal(401, appel('/api/prof.php', ['action' => 'records.ligue'])['code'], 'sans jeton : rien');
});

verifier("records — le tableau du professeur porte le record de chaque Légende ; la fiche aussi", function () use (&$recEleves, &$jetonS1, &$recClasse) {
    vider_compteurs();
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $recClasse, 'appli' => 'defi-tables'], ['jeton' => $jetonS1]);
    $parId = [];
    foreach ($t['json']['eleves'] as $e) $parId[(int)$e['id']] = $e;
    egal(450, $parId[$recEleves[0]['id']]['record']['meilleur'], 'Toti');
    egal(true, $parId[$recEleves[0]['id']]['record']['nom']);
    egal(450, $parId[$recEleves[1]['id']]['record']['meilleur'], 'Léa B.');
    egal(false, $parId[$recEleves[1]['id']]['record']['nom'], 'son choix Mystère, pour que le professeur sache');
    $billet = appel('/api/prof.php', ['action' => 'eleves.fiche', 'eleve_id' => $recEleves[0]['id']], ['jeton' => $jetonS1])['json']['billet'];
    $f = appel('/api/eleve.php', ['billet' => $billet, 'appli' => 'defi-tables']);
    egal('fiche', $f['json']['type']);
    egal(450, $f['json']['record']['meilleur'], 'la fiche porte le record');
    vrai(!str_contains($f['texte'], $recEleves[0]['code']), 'et jamais le code');
});

verifier("records — la case par classe : fermés, l'élève le sait, sa course est refusée, la classe sort de la ligue ; rouverts, tout revient", function () use (&$recEleves, &$jetonS1, &$recClasse) {
    vider_compteurs();
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $recClasse, 'reglages' => ['defi-tables' => ['records' => false]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'fermer');
    egal(['defi-tables' => ['records' => false]], $r['json']['reglages']);
    egal('{"defi-tables":{"records":false}}', classe_en_base($recClasse)['reglages'], 'en base : seul « false » s’écrit');
    $e = identite($recEleves[0]['code']);
    egal(['defi-tables' => ['records' => false]], $e['json']['reglages'], 'l’élève le reçoit avec son identité');
    $r = records_api($recEleves[0]['code'], ['lire' => true]);
    egal(false, $r['json']['ouvert'], 'lire : fermés');
    vrai(!isset($r['json']['toujours']), 'et rien de la ligue');
    egal(403, records_api($recEleves[0]['code'], ['depart' => true])['code'], 'pas de ticket de course non plus');
    $r = records_api($recEleves[0]['code'], ['temps' => 400, 'justes' => 25]);
    egal(403, $r['code'], 'une course : refusée');
    egal(403, records_api($recEleves[0]['code'], ['nom' => false])['code'], 'le nom aussi');
    $r = appel('/api/prof.php', ['action' => 'records.ligue'], ['jeton' => $jetonS1]);
    egal([], $r['json']['toujours'], 'la classe est sortie de la ligue du professeur');
    foreach ([
        [['defi-tables' => ['records' => 'non']], 'Réglage illisible.'],
        [['defi-tables' => ['records' => 0]], 'Réglage illisible.'],
        [['defi-tables' => ['mondes' => [1]]], 'Réglage inconnu.'],
    ] as [$reglages, $message]) {
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $recClasse, 'reglages' => $reglages], ['jeton' => $jetonS1]);
        egal(400, $r['code']);
        egal($message, $r['json']['erreur'] ?? null);
    }
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $recClasse, 'reglages' => ['defi-tables' => ['records' => true]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'rouvrir');
    egal(null, classe_en_base($recClasse)['reglages'], 'le défaut : rien d’écrit');
    $r = records_api($recEleves[0]['code'], ['lire' => true]);
    egal(true, $r['json']['ouvert']);
    egal(450, $r['json']['record']['meilleur'], 'rien n’a été effacé');
});

verifier("records — repartent à zéro avec le nouveau tirage (09/10/2026) : un temps d'avant ne compte plus, rien n'est effacé, la course suivante le remplace", function () use (&$recEleves, &$jetonS1, &$recClasse) {
    vider_compteurs();
    // Toti a couru avant le changement de tirage : son 30,0 s date d'avant records_depuis.
    $toti = $recEleves[0];
    bd_test()->prepare('UPDATE records SET meilleur = 300, meilleur_le = ?, semaine = 300, semaine_lundi = ? WHERE eleve_id = ?')
        ->execute(['2025-12-31T23:59:59.999999Z', lundi_courant(), $toti['id']]);
    $r = records_api($toti['code'], ['lire' => true]);
    egal(null, $r['json']['record']['meilleur'], 'plus de record pour lui');
    egal(null, $r['json']['record']['semaine'], 'ni de temps de la semaine');
    egal(true, $r['json']['record']['nom'], 'son choix de nom reste');
    vrai(!in_array('Toti', array_column($r['json']['toujours'], 'nom'), true), 'il sort de « De tous les temps »');
    vrai(!in_array('Toti', array_column($r['json']['semaine'], 'nom'), true), 'et de « Cette semaine »');
    egal(null, $r['json']['rangToujours']);
    egal(null, $r['json']['rangSemaine']);
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $recClasse, 'appli' => 'defi-tables'], ['jeton' => $jetonS1]);
    $vu = false;
    foreach ($t['json']['eleves'] as $e) {
        if ((int)$e['id'] !== (int)$toti['id']) continue;
        $vu = true;
        egal(null, $e['record']['meilleur'], 'le tableau du professeur non plus');
    }
    vrai($vu, 'Toti est dans le tableau du professeur');
    $l = appel('/api/prof.php', ['action' => 'records.ligue'], ['jeton' => $jetonS1]);
    vrai(!in_array('Toti', array_column($l['json']['toujours'], 'nom'), true), 'ni dans la ligue projetée');
    egal('300', (string)bd_test()->query('SELECT meilleur FROM records WHERE eleve_id = ' . (int)$toti['id'])->fetchColumn(), 'rien n’est effacé en base');
    // Sa course suivante, même moins bonne que l'ancien temps, devient son record.
    $r = courir($toti['code'], 700);
    egal(200, $r['code']);
    egal(true, $r['json']['nouveau'], 'un nouveau record');
    egal(null, $r['json']['avant'], 'sans « avant » : l’ancien temps ne compte plus');
    egal(700, $r['json']['record']['meilleur']);
    egal(700, $r['json']['record']['semaine']);
    vrai(in_array('Toti', array_column($r['json']['toujours'], 'nom'), true), 'il revient dans la ligue');
    $r = courir($toti['code'], 650);
    egal(700, $r['json']['avant'], 'ensuite, tout redevient normal');
    egal(650, $r['json']['record']['meilleur']);
    // La date du changement, écrite comme meilleur_le (à la microseconde) :
    // le 10/10/2026 à 20 h à La Réunion, juste après la mise en ligne du
    // nouveau tirage (fusion à 19 h 23). Correction du 11/10 : c'était le
    // 10/10 à 0 h, et les courses du samedi faites avec l'ancien tirage
    // comptaient encore.
    vrai((bool)preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/', RECORDS_DEPUIS), 'RECORDS_DEPUIS : écrit comme meilleur_le, à la microseconde');
    egal('2026-10-10T16:00:00.000000Z', RECORDS_DEPUIS, 'le 10/10/2026 à 20 h, heure de La Réunion');
    egal('10/10/2026 20:00', instant_local_lisible(RECORDS_DEPUIS), 'lu à La Réunion');
    vrai(strcmp('2026-10-10T15:23:00.000000Z', RECORDS_DEPUIS) < 0, 'une course de samedi 19 h 23 (ancien tirage) ne compte plus');
});

verifier("records — verifier.php compte à part les temps de la saison et les anciens, gardés sans compter (11/10/2026)", function () use (&$recEleves) {
    vider_compteurs();
    $toti = $recEleves[0];
    $avant = bd_test()->query('SELECT meilleur, meilleur_le FROM records WHERE eleve_id = ' . (int)$toti['id'])->fetch();
    // Le serveur de test part du 01/01/2026 (config.php des tests) : on
    // compte ici à la main, comme verifier.php doit le faire.
    $compter = fn(): array => [
        'saison' => (int)bd_test()->query("SELECT COUNT(*) FROM records WHERE meilleur IS NOT NULL AND meilleur_le >= '2026-01-01T00:00:00.000000Z'")->fetchColumn(),
        'anciens' => (int)bd_test()->query("SELECT COUNT(*) FROM records WHERE meilleur IS NOT NULL AND meilleur_le < '2026-01-01T00:00:00.000000Z'")->fetchColumn(),
    ];
    $temps = $compter();
    vrai($temps['saison'] >= 2, 'au moins deux Légendes ont couru cette saison');
    egal(0, $temps['anciens'], 'aucun ancien temps pour commencer');
    $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#class="etat oui">✓</span>\s*Les records \(Défi tables\)\s*<div class="detail">en place — depuis le 01/01/2026 04:00 \(heure de La Réunion\) : ' . $temps['saison'] . ' Légende\(s\) avec un temps</div>#u', $v['texte']),
        'verifier.php : la date de départ et le nombre de temps de la saison, sans ligne d’anciens temps');
    // Toti redevient un ancien temps : la ligne le compte à part.
    bd_test()->prepare('UPDATE records SET meilleur_le = ? WHERE eleve_id = ?')->execute(['2025-12-31T23:59:59.999999Z', $toti['id']]);
    $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#Les records \(Défi tables\)\s*<div class="detail">en place — depuis le 01/01/2026 04:00 \(heure de La Réunion\) : ' . ($temps['saison'] - 1) . ' Légende\(s\) avec un temps ; 1 temps plus ancien\(s\), gardé\(s\) en base, ne compte\(nt\) plus</div>#u', $v['texte']),
        'verifier.php : l’ancien temps est compté à part');
    egal(['saison' => $temps['saison'] - 1, 'anciens' => 1], $compter());
    bd_test()->prepare('UPDATE records SET meilleur_le = ? WHERE eleve_id = ?')->execute([$avant['meilleur_le'], $toti['id']]);
});

// Lot « après l'audit GPT » (14/10/2026) : D4 « Retirer ce temps », D8 le
// jour de la course.

verifier("records — D4 : « Retirer ce temps » — le propriétaire efface le record et la semaine, le nom reste, la ligne reste, la ligue du professeur porte l'élève derrière chaque nom ; journalisé", function () use (&$recEleves, &$jetonS1, &$recClasse) {
    vider_compteurs();
    $toti = $recEleves[0];
    $lea = $recEleves[1];
    // La ligue du professeur : chaque ligne dit QUI (id, prénom saisi, classe),
    // même derrière « Mystère » — jamais dans la ligue que lit l'appli élève.
    $r = appel('/api/prof.php', ['action' => 'records.ligue'], ['jeton' => $jetonS1]);
    $lignes = array_column($r['json']['toujours'], null, 'nom');
    egal(['id' => (int)$toti['id'], 'prenom' => 'Toti', 'classe' => '306'], $lignes['Toti']['eleve'], 'Toti : son élève');
    egal(['id' => (int)$lea['id'], 'prenom' => 'Léa', 'classe' => '306'], $lignes['Mystère']['eleve'], 'Mystère : le professeur sait qui');
    $e = records_api($toti['code'], ['lire' => true]);
    foreach ($e['json']['toujours'] as $ligne) vrai(!array_key_exists('eleve', $ligne), 'l’appli élève ne reçoit aucun identifiant');
    vrai(!str_contains($e['texte'], '"prenom"'), 'ni prénom saisi');
    // Le retrait : Toti a un record (650 depuis le test de la saison) et un
    // temps de la semaine, nom = prénom.
    egal(650, $e['json']['record']['meilleur']);
    egal(650, $e['json']['record']['semaine']);
    $avant = (int)bd_test()->query('SELECT COUNT(*) FROM records')->fetchColumn();
    $r = appel('/api/prof.php', ['action' => 'records.retirer', 'eleve_id' => $toti['id']], ['jeton' => $jetonS1]);
    egal(200, $r['code']);
    egal(true, $r['json']['retire']);
    vrai(!in_array('Toti', array_column($r['json']['toujours'], 'nom'), true), 'la ligue rendue ne l’a plus');
    egal($avant, (int)bd_test()->query('SELECT COUNT(*) FROM records')->fetchColumn(), 'la ligne reste');
    $ligne = bd_test()->query('SELECT meilleur, meilleur_le, semaine, semaine_lundi, nom FROM records WHERE eleve_id = ' . (int)$toti['id'])->fetch(PDO::FETCH_ASSOC);
    egal(['meilleur' => null, 'meilleur_le' => null, 'semaine' => null, 'semaine_lundi' => null, 'nom' => 1], $ligne, 'temps effacés, le choix du nom reste');
    $e = records_api($toti['code'], ['lire' => true]);
    egal(null, $e['json']['record']['meilleur'], 'l’élève n’a plus de record');
    egal(true, $e['json']['record']['nom'], 'mais garde son choix');
    egal(null, $e['json']['rangToujours']);
    // Sa prochaine course compte comme une première.
    $r = courir($toti['code'], 601);
    egal(true, $r['json']['nouveau']);
    egal(null, $r['json']['avant']);
    egal(601, $r['json']['record']['meilleur']);
    // Rien à retirer (retiré une seconde fois, avant sa nouvelle course, ci-dessus) : 200, retire = false.
    bd_test()->prepare('UPDATE records SET meilleur = NULL, meilleur_le = NULL, semaine = NULL, semaine_lundi = NULL WHERE eleve_id = ?')->execute([(int)$toti['id']]);
    $r = appel('/api/prof.php', ['action' => 'records.retirer', 'eleve_id' => $toti['id']], ['jeton' => $jetonS1]);
    egal(200, $r['code']);
    egal(false, $r['json']['retire'], 'plus rien à retirer : pas une erreur');
    // Journal : chaque demande du propriétaire = une ligne.
    egal(2, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'records.retirer' AND resultat = 'ok' AND cible_id = " . (int)$toti['id'])->fetchColumn(), 'journalisé');
    // Toti rejoue (601) pour les tests suivants.
    courir($toti['code'], 601);
});

verifier("records — D4 : un collègue (classe partagée en lecture) est refusé et journalisé ; l'élève d'un autre professeur est introuvable ; sans jeton, rien", function () use (&$recEleves, &$jetonS1, &$recJetonClaire, &$recCodeClaire) {
    vider_compteurs();
    // La 306 est partagée au collègue en lecture (test du cloisonnement).
    $r = appel('/api/prof.php', ['action' => 'records.retirer', 'eleve_id' => $recEleves[1]['id']], ['jeton' => $recJetonClaire]);
    egal(403, $r['code'], 'le collègue : refusé');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'records.retirer' AND resultat = 'refus'")->fetchColumn(), 'le refus est au journal');
    $ligne = bd_test()->query('SELECT meilleur FROM records WHERE eleve_id = ' . (int)$recEleves[1]['id'])->fetch(PDO::FETCH_ASSOC);
    egal(450, (int)$ligne['meilleur'], 'rien n’a bougé');
    // Jade, l'élève du collègue : pour gwenael, elle n'existe pas.
    $jade = (int)bd_test()->query("SELECT id FROM eleves WHERE code = '$recCodeClaire'")->fetchColumn();
    egal(404, appel('/api/prof.php', ['action' => 'records.retirer', 'eleve_id' => $jade], ['jeton' => $jetonS1])['code'], 'introuvable, comme partout');
    egal(386, (int)bd_test()->query("SELECT meilleur FROM records WHERE eleve_id = $jade")->fetchColumn(), 'son temps est intact');
    egal(404, appel('/api/prof.php', ['action' => 'records.retirer', 'eleve_id' => 999999], ['jeton' => $jetonS1])['code'], 'un élève qui n’existe pas : le même message');
    egal(401, appel('/api/prof.php', ['action' => 'records.retirer', 'eleve_id' => $recEleves[1]['id']])['code'], 'sans jeton');
});

verifier("records — D8 : le jour de la course — plausible, il classe la course dans SA semaine ; sinon le jour de réception ; une course d'une semaine passée ne touche pas à la semaine en cours", function () use (&$recEleves) {
    vider_compteurs();
    require_once __DIR__ . '/../public/lib/records.php';
    // jour_de_course : format strict, date réelle, pas dans le futur, 7 jours au plus.
    $auj = '2026-10-14';
    egal('2026-10-14', jour_de_course('2026-10-14', $auj));
    egal('2026-10-11', jour_de_course('2026-10-11', $auj), 'dimanche dernier');
    egal('2026-10-07', jour_de_course('2026-10-07', $auj), 'il y a 7 jours : encore accepté');
    egal($auj, jour_de_course('2026-10-06', $auj), '8 jours : trop vieux');
    egal($auj, jour_de_course('2026-10-15', $auj), 'demain : dans le futur');
    egal($auj, jour_de_course('2026-02-30', $auj), 'une date qui n’existe pas');
    egal($auj, jour_de_course('14/10/2026', $auj), 'pas le bon format');
    egal($auj, jour_de_course("2026-10-14\n", $auj), 'rien d’autre que le jour');
    egal($auj, jour_de_course(20261014, $auj), 'pas une chaîne');
    egal($auj, jour_de_course(null, $auj), 'absent : aujourd’hui');
    egal($auj, jour_de_course(['2026-10-14'], $auj), 'une liste');
    // lundi_de : la semaine d'un jour.
    egal('2026-10-05', lundi_de('2026-10-11'), 'le dimanche 11 est dans la semaine du lundi 5');
    egal('2026-10-12', lundi_de('2026-10-14'));
    // En vrai, par l'API : Léa B. (élève 1) a 450 de record ; cette semaine, rien ou 450.
    $lea = $recEleves[1]['code'];
    $pdo = bd_test();
    $id = (int)$recEleves[1]['id'];
    $lundi = lundi_courant();
    $dimanche = (new DateTimeImmutable($lundi, new DateTimeZone(FUSEAU)))->modify('-1 day')->format('Y-m-d');
    $lundiPasse = lundi_de($dimanche);
    // Un temps de la semaine en cours, posé exprès.
    $pdo->prepare('UPDATE records SET semaine = 470, semaine_lundi = ? WHERE eleve_id = ?')->execute([$lundi, $id]);
    // Une course du dimanche soir (semaine passée), envoyée aujourd'hui : elle
    // ne touche pas à la semaine en cours (470 reste) ; 440 < 450, c'est quand
    // même le record de tous les temps, daté du dimanche.
    $r = courir($lea, 440, ['jour' => $dimanche]);
    egal(200, $r['code']);
    egal(true, $r['json']['nouveau'], 'meilleur que 450 : le record, quel que soit le jour');
    egal(440, $r['json']['record']['meilleur']);
    egal($dimanche, $r['json']['record']['meilleurLe'], 'daté du jour de la course');
    egal(470, $r['json']['record']['semaine'], 'la semaine en cours n’a pas bougé');
    $ligne = $pdo->query("SELECT semaine, semaine_lundi, meilleur_le FROM records WHERE eleve_id = $id")->fetch(PDO::FETCH_ASSOC);
    egal(470, (int)$ligne['semaine']);
    egal($lundi, $ligne['semaine_lundi'], 'la semaine gardée reste celle en cours');
    egal($dimanche, substr((string)$ligne['meilleur_le'], 0, 10));
    // Une course de la semaine passée, moins bonne : rien ne bouge nulle part.
    $r = courir($lea, 480, ['jour' => $dimanche]);
    egal(false, $r['json']['nouveau']);
    egal(470, $r['json']['record']['semaine']);
    // Un jour impossible : la course est d'aujourd'hui (semaine en cours : 460 < 470 la remplace).
    $r = courir($lea, 460, ['jour' => '2030-01-01']);
    egal(460, $r['json']['record']['semaine'], 'jour dans le futur : jour de réception, donc cette semaine');
    egal($lundi, $r['json']['record']['lundi']);
    // Sans jour : comme avant.
    $r = courir($lea, 455);
    egal(455, $r['json']['record']['semaine']);
    // Une ligne de la semaine PASSÉE en base (élève qui n'a pas joué cette
    // semaine), et une course de cette semaine : la nouvelle semaine s'ouvre.
    $pdo->prepare('UPDATE records SET semaine = 300, semaine_lundi = ? WHERE eleve_id = ?')->execute([$lundiPasse, $id]);
    $r = courir($lea, 500, ['jour' => jour_local()]);
    egal(500, $r['json']['record']['semaine'], 'la semaine repart de cette course');
    egal($lundi, $r['json']['record']['lundi']);
    // Et une course de la semaine passée sur une ligne de la semaine passée : le min.
    $pdo->prepare('UPDATE records SET semaine = 300, semaine_lundi = ? WHERE eleve_id = ?')->execute([$lundiPasse, $id]);
    courir($lea, 290, ['jour' => $dimanche]);
    $ligne = $pdo->query("SELECT semaine, semaine_lundi FROM records WHERE eleve_id = $id")->fetch(PDO::FETCH_ASSOC);
    egal([290, $lundiPasse], [(int)$ligne['semaine'], $ligne['semaine_lundi']], 'même semaine passée : le meilleur des deux');
    // Remise en ordre pour les tests suivants : le record de Léa B. à 450, pas de temps de semaine.
    $pdo->prepare('UPDATE records SET meilleur = 450, semaine = NULL, semaine_lundi = NULL WHERE eleve_id = ?')->execute([$id]);
});

verifier("records — le record part avec l'élève supprimé, et avec la classe supprimée", function () use (&$recEleves, &$jetonS1, &$recJetonClaire, &$recCodeClaire) {
    vider_compteurs();
    $avant = (int)bd_test()->query('SELECT COUNT(*) FROM records')->fetchColumn();
    egal(200, appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $recEleves[3]['id']], ['jeton' => $jetonS1])['code']);
    egal($avant - 1, (int)bd_test()->query('SELECT COUNT(*) FROM records')->fetchColumn(), 'une ligne de moins');
    $classeClaire = (int)bd_test()->query("SELECT classe_id FROM eleves WHERE code = '$recCodeClaire'")->fetchColumn();
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classeClaire], ['jeton' => $recJetonClaire])['code']);
    egal($avant - 2, (int)bd_test()->query('SELECT COUNT(*) FROM records')->fetchColumn(), 'Jade est partie avec sa classe');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM records r LEFT JOIN eleves e ON e.id = r.eleve_id WHERE e.id IS NULL')->fetchColumn(), 'aucune ligne orpheline');
});

verifier("records — les bornes du serveur sont celles du moteur (SEUILS.course)", function () use ($racine) {
    $moteur = (string)file_get_contents($racine . '/public/prof/defi_tables_mon_parcours.js');
    vrai((bool)preg_match('/course: Object\.freeze\(\{total: (\d+), erreursMax: (\d+), dixiemesMin: (\d+), dixiemesMax: (\d+)\}\)/', $moteur, $m), 'SEUILS.course dans le moteur');
    egal((int)$m[1], COURSE_TOTAL, 'total');
    egal(0, (int)$m[2], '25 sur 25 : aucune erreur (décision du 09/10/2026)');
    egal((int)$m[3], SEUIL_COURSE_DIXIEMES, 'seuil');
    egal((int)$m[4], COURSE_MAX_DIXIEMES, 'plafond');
});

// ================================================= SÉANCE EN DIRECT (07/10/2026)
//
// Lot 1 « question éclair » — lib/direct.php, api/direct.php, direct.* dans
// api/prof.php. Ce que ce bloc tient :
//  - l'élève ne reçoit ni la répartition ni la bonne réponse ; le tableau ne
//    reçoit la répartition qu'après « Dévoiler », et jamais un nom ;
//  - une réponse n'entre que si la question est ouverte, et sa forme est
//    vérifiée par son type ; changer d'avis remplace, sans doublon ;
//  - une classe ne voit pas la séance d'une autre ;
//  - RIEN ne reste : « Terminer », l'échéance (une heure et demie après le
//    dernier geste du professeur), la classe ou l'élève supprimés ;
//  - interroger ne compte rien (aucune écriture par passage).
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) retirer « AND d.etat = 'question' » de repondre_au_direct()
//  b) envoyer « repartition » pendant la question (etat_du_direct_pour_le_tableau)
//  c) ajouter « bonne » à etat_du_direct_pour_l_eleve()
//  d) oublier oublier_direct_de_la_classe() dans supprimer_classe()
//  e) retirer purger_directs() de api/direct.php
//  f) compter chaque interrogation (limiter() avant le test « reponse »)
//  g) accepter n'importe quelle lettre dans reponse_direct()

$direct = ['jeton' => null, 'classe' => null, 'eleves' => [], 'autreClasse' => null, 'autreEleve' => null];

function direct_prof(string $action, array $direct, array $corps = []): array
{
    return appel('/api/prof.php', ['action' => $action, 'classe_id' => $direct['classe']] + $corps,
        ['jeton' => $direct['jeton']]);
}

function direct_eleve(string $code, array $corps = []): array
{
    return appel('/api/direct.php', ['code' => $code] + $corps);
}

// « directs_reponses » compte les réponses aux QUESTIONS (numéro 1 et plus).
// Depuis le lot 2, la même table porte aussi, au numéro 0, la présence de
// chaque élève qui a rejoint : presences_en_base() la compte, et
// lignes_directs() compte TOUT — c'est lui qui dit « il ne reste rien ».
function directs_en_base(): array
{
    $combien = [];
    foreach (['directs', 'directs_questions', 'directs_reponses'] as $table) {
        $filtre = $table === 'directs_reponses' ? ' WHERE numero >= 1' : '';
        $combien[$table] = (int)bd_test()->query("SELECT COUNT(*) FROM $table$filtre")->fetchColumn();
    }
    return $combien;
}

function presences_en_base(): int
{
    return (int)bd_test()->query('SELECT COUNT(*) FROM directs_reponses WHERE numero = 0')->fetchColumn();
}

function lignes_directs(): int
{
    $total = 0;
    foreach (['directs', 'directs_questions', 'directs_reponses'] as $table) {
        $total += (int)bd_test()->query("SELECT COUNT(*) FROM $table")->fetchColumn();
    }
    return $total;
}

verifier("direct — mise en place : une classe de cinq élèves nommés, et une autre classe", function () use (&$direct) {
    vider_compteurs();
    foreach (['phrase-de-secours-2026', 'motdepasse-de-test-2026'] as $essai) {
        $r = connexion('gwenael', $essai);
        if (($r['json']['jeton'] ?? null) !== null) { $direct['jeton'] = $r['json']['jeton']; break; }
    }
    vrai(is_string($direct['jeton']), 'la session du professeur est ouverte');
    $direct['classe'] = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'direct-405'], ['jeton' => $direct['jeton']])['json']['id'];
    $direct['eleves'] = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $direct['classe'], 'nombre' => 5], ['jeton' => $direct['jeton']])['json']['eleves'];
    egal(5, count($direct['eleves']), 'cinq élèves');
    foreach (['Léa', 'Noah', 'Inès', 'Tom', 'Zoé'] as $i => $prenom) {
        appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $direct['eleves'][$i]['id'], 'prenom' => $prenom, 'initiale' => 'D'], ['jeton' => $direct['jeton']]);
    }
    $direct['autreClasse'] = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'direct-306'], ['jeton' => $direct['jeton']])['json']['id'];
    $direct['autreEleve'] = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $direct['autreClasse'], 'nombre' => 1], ['jeton' => $direct['jeton']])['json']['eleves'][0];
    bd_test()->exec('DELETE FROM directs_reponses');
    bd_test()->exec('DELETE FROM directs_questions');
    bd_test()->exec('DELETE FROM directs');
});

verifier("direct — sans séance : l'élève l'apprend, en POST seulement, et un code inconnu est un échec", function () use (&$direct) {
    $r = direct_eleve($direct['eleves'][0]['code']);
    egal(200, $r['code']);
    vrai(array_key_exists('direct', $r['json']) && $r['json']['direct'] === null, 'aucune séance');
    egal(6000, $r['json']['rythme'], 'sans séance, la page espace ses questions');
    egal('no-store', entete($r, 'Cache-Control'), 'jamais en cache');
    egal(405, appel('/api/direct.php', null)['code'], 'GET refusé');
    egal(405, appel('/api/direct.php?code=' . $direct['eleves'][0]['code'], null)['code'], 'le code dans l’adresse ne vaut rien');
    egal(400, direct_eleve('!!')['code'], 'code mal formé');
    vider_compteurs();
    egal(404, direct_eleve(code_inconnu(7))['code'], 'code inconnu');
    egal(1, count(compteurs()), 'et l’échec est compté pour l’adresse');
    vider_compteurs();
    $r = direct_prof('direct.etat', $direct);
    egal(200, $r['code']);
    vrai($r['json']['direct'] === null, 'le tableau aussi : aucune séance');
    egal('direct-405', $r['json']['classe']['libelle'], 'il sait le nom de la classe');
    egal(409, direct_prof('direct.question', $direct, ['type' => 'choix'])['code'], 'pas de question sans séance');
    egal(409, direct_prof('direct.fichier', $direct)['code'], 'pas de fichier sans séance');
});

verifier("direct — ouvrir : une séance par classe, même à dix en même temps", function () use (&$direct) {
    $codes = appels_paralleles('/api/prof.php', ['action' => 'direct.ouvrir', 'classe_id' => $direct['classe'], 'jeton' => $direct['jeton']], 10);
    egal([200], array_values(array_unique($codes)), 'dix ouvertures simultanées, toutes servies');
    egal(1, directs_en_base()['directs'], 'une seule séance en base');
    $r = direct_prof('direct.ouvrir', $direct);
    egal('attente', $r['json']['direct']['etat']);
    egal(0, $r['json']['direct']['numero']);
    egal(5, $r['json']['direct']['inscrits'], 'cinq élèves attendus');
    egal(1, directs_en_base()['directs'], 'rouvrir ne crée rien');
    $etat = direct_eleve($direct['eleves'][0]['code'])['json'];
    egal('attente', $etat['direct']['etat'], 'l’élève voit la séance, en attente');
    egal(2500, $etat['rythme'], 'et interroge plus souvent');
    vrai($etat['direct']['type'] === null && $etat['direct']['reponse'] === null, 'sans question, rien à répondre');
    $r = direct_eleve($direct['eleves'][0]['code'], ['numero' => 1, 'reponse' => 'A']);
    egal(false, $r['json']['enregistree'], 'répondre avant la question n’écrit rien');
    egal(0, directs_en_base()['directs_reponses']);
    vrai(direct_eleve($direct['autreEleve']['code'])['json']['direct'] === null, 'l’élève d’une autre classe ne voit pas cette séance');
});

verifier("direct — question : le réglage est une liste fermée, l'élève ne reçoit ni répartition ni bonne réponse", function () use (&$direct) {
    egal(400, direct_prof('direct.question', $direct, ['type' => 'texte'])['code'], 'type inconnu');
    egal(400, direct_prof('direct.question', $direct, ['type' => 'choix', 'reglage' => ['choix' => 7]])['code'], 'sept réponses : refusé');
    egal(400, direct_prof('direct.question', $direct, ['type' => 'choix', 'reglage' => ['choix' => '4']])['code'], 'un texte à la place d’un nombre : refusé');
    egal(0, directs_en_base()['directs_questions'], 'rien n’a été posé');
    $r = direct_prof('direct.question', $direct, ['type' => 'choix', 'reglage' => ['choix' => 4, 'enonce' => '<b>2+2</b>']]);
    egal(200, $r['code']);
    egal('question', $r['json']['direct']['etat']);
    egal(1, $r['json']['direct']['numero']);
    egal('{"choix":4}', (string)bd_test()->query('SELECT reglage FROM directs_questions')->fetchColumn(), 'le réglage rangé ne garde que ce que le type connaît : aucun énoncé');
    $etat = direct_eleve($direct['eleves'][0]['code'])['json']['direct'];
    egal('question', $etat['etat']);
    egal('choix', $etat['type']);
    egal(['choix' => 4], $etat['reglage']);
    foreach (['bonne', 'repartition', 'repondu', 'inscrits'] as $cle) {
        vrai(!array_key_exists($cle, $etat), "l'élève ne reçoit pas « $cle »");
    }
});

verifier("direct — réponses : forme vérifiée, changer d'avis remplace, pas de doublon à vingt en même temps", function () use (&$direct) {
    $e = $direct['eleves'];
    foreach ([0 => 'A', 1 => 'B', 2 => 'b', 3 => 'C'] as $i => $lettre) {
        $r = direct_eleve($e[$i]['code'], ['numero' => 1, 'reponse' => $lettre]);
        egal(200, $r['code']);
        egal(true, $r['json']['enregistree'], "réponse $lettre rangée");
        egal(strtoupper($lettre), $r['json']['direct']['reponse'], 'et rendue à l’élève');
    }
    foreach (['E', 'AB', '', '<b>', 'Z'] as $mauvaise) {
        egal(400, direct_eleve($e[4]['code'], ['numero' => 1, 'reponse' => $mauvaise])['code'], "« $mauvaise » n'est pas une réponse");
    }
    egal(400, direct_eleve($e[4]['code'], ['numero' => 1, 'reponse' => ['A']])['code'], 'un tableau non plus');
    egal(4, directs_en_base()['directs_reponses'], 'quatre réponses, pas une de plus');
    // Un numéro qui n'est pas celui de la question en cours : rien d'écrit.
    egal(false, direct_eleve($e[4]['code'], ['numero' => 2, 'reponse' => 'A'])['json']['enregistree'], 'question n° 2 : elle n’existe pas');
    // L'élève d'une autre classe ne peut pas répondre à cette séance.
    $r = direct_eleve($direct['autreEleve']['code'], ['numero' => 1, 'reponse' => 'A']);
    vrai($r['json']['direct'] === null, 'autre classe : aucune séance, donc aucune réponse');
    egal(4, directs_en_base()['directs_reponses']);
    // Changer d'avis.
    egal('D', direct_eleve($e[0]['code'], ['numero' => 1, 'reponse' => 'D'])['json']['direct']['reponse'], 'A devient D');
    egal(4, directs_en_base()['directs_reponses'], 'remplacée, pas ajoutée');
    // Vingt fois la même réponse au même instant (double clic, réseau qui rejoue).
    $codes = appels_paralleles('/api/direct.php', ['code' => $e[0]['code'], 'numero' => 1, 'reponse' => 'A'], 20);
    vrai(!in_array(500, $codes, true), 'aucune erreur serveur : ' . json_encode(array_count_values($codes)));
    egal(4, directs_en_base()['directs_reponses'], 'toujours une ligne par élève');
    egal('A', direct_eleve($e[0]['code'])['json']['direct']['reponse']);
});

verifier("direct — pendant la question, le tableau ne reçoit qu'un compteur", function () use (&$direct) {
    $r = direct_prof('direct.etat', $direct);
    $etat = $r['json']['direct'];
    egal(4, $etat['repondu'], 'quatre ont répondu');
    egal(5, $etat['inscrits'], 'sur cinq');
    vrai($etat['repartition'] === null, 'la répartition n’est même pas envoyée');
    vrai($etat['bonne'] === null, 'ni la bonne réponse');
    egal(1500, $r['json']['rythme']);
    egal(409, direct_prof('direct.bonne', $direct, ['bonne' => 'B'])['code'], 'on ne désigne pas la bonne réponse avant de dévoiler');
});

verifier("direct — dévoiler : la répartition, sans aucun nom ; plus aucune réponse n'entre", function () use (&$direct) {
    $r = direct_prof('direct.devoiler', $direct);
    egal(200, $r['code']);
    egal('devoile', $r['json']['direct']['etat']);
    egal(['A' => 1, 'B' => 2, 'C' => 1], $r['json']['direct']['repartition'], 'la répartition');
    foreach (['Léa', 'Noah', 'Inès', $direct['eleves'][0]['code'], 'prenom', 'eleve_id'] as $interdit) {
        vrai(!str_contains($r['texte'], $interdit), "le tableau ne reçoit pas « $interdit »");
    }
    egal(200, direct_prof('direct.devoiler', $direct)['code'], 'dévoiler deux fois ne casse rien');
    $tardive = direct_eleve($direct['eleves'][4]['code'], ['numero' => 1, 'reponse' => 'A']);
    egal(false, $tardive['json']['enregistree'], 'une réponse arrivée après n’est pas rangée');
    egal('devoile', $tardive['json']['direct']['etat'], 'et l’élève apprend que c’est dévoilé');
    egal(false, direct_eleve($direct['eleves'][0]['code'], ['numero' => 1, 'reponse' => 'C'])['json']['enregistree'], 'on ne change plus d’avis');
    egal(4, directs_en_base()['directs_reponses']);
    egal('A', direct_eleve($direct['eleves'][0]['code'])['json']['direct']['reponse'], 'sa réponse est restée');
    // La deuxième ceinture, éprouvée sans passer par l'API : une réponse partie
    // à l'instant où le professeur dévoile a déjà franchi le contrôle de
    // api/direct.php. C'est l'INSTRUCTION SQL elle-même qui doit la refuser.
    $seance = (int)bd_test()->query('SELECT id FROM directs WHERE classe_id = ' . (int)$direct['classe'])->fetchColumn();
    repondre_au_direct(bd_test(), $seance, 1, (int)$direct['eleves'][4]['id'], 'A');
    repondre_au_direct(bd_test(), $seance, 1, (int)$direct['eleves'][0]['id'], 'C');
    egal(4, directs_en_base()['directs_reponses'], 'l’écriture elle-même refuse une question dévoilée');
    egal('A', (string)bd_test()->query('SELECT reponse FROM directs_reponses WHERE numero = 1 AND eleve_id = ' . (int)$direct['eleves'][0]['id'])->fetchColumn(),
        'et ne remplace rien');
    vrai(!str_contains(direct_eleve($direct['eleves'][0]['code'])['texte'], 'repartition'), 'l’élève ne reçoit toujours pas la répartition');
});

verifier("direct — la bonne réponse : désignée, changée, retirée ; jamais envoyée à l'élève", function () use (&$direct) {
    egal(400, direct_prof('direct.bonne', $direct, ['bonne' => 'Z'])['code'], 'Z n’existe pas');
    egal('B', direct_prof('direct.bonne', $direct, ['bonne' => 'B'])['json']['direct']['bonne']);
    vrai(!str_contains(direct_eleve($direct['eleves'][0]['code'])['texte'], 'bonne'), 'l’élève ne la reçoit pas');
    vrai(direct_prof('direct.bonne', $direct, ['bonne' => null])['json']['direct']['bonne'] === null, 'retirée');
    egal('B', direct_prof('direct.bonne', $direct, ['bonne' => 'b'])['json']['direct']['bonne'], 'remise');
});

verifier("direct — le fichier : questions et réponses élève par élève, pour le professeur seulement, journalisé", function () use (&$direct) {
    // Une deuxième question, à deux réponses, que personne ne corrige.
    egal(2, direct_prof('direct.question', $direct, ['type' => 'choix', 'reglage' => ['choix' => 2]])['json']['direct']['numero']);
    egal(400, direct_eleve($direct['eleves'][1]['code'], ['numero' => 2, 'reponse' => 'C'])['code'], 'C n’existe plus : deux réponses seulement');
    egal(true, direct_eleve($direct['eleves'][1]['code'], ['numero' => 2, 'reponse' => 'B'])['json']['enregistree']);
    egal(false, direct_eleve($direct['eleves'][2]['code'], ['numero' => 1, 'reponse' => 'A'])['json']['enregistree'], 'la question 1 est passée');
    $r = direct_prof('direct.fichier', $direct);
    egal(200, $r['code']);
    egal([['numero' => 1, 'type' => 'choix', 'reglage' => ['choix' => 4], 'bonne' => 'B'],
          ['numero' => 2, 'type' => 'choix', 'reglage' => ['choix' => 2], 'bonne' => null]], $r['json']['questions']);
    $parPrenom = [];
    foreach ($r['json']['eleves'] as $eleve) $parPrenom[$eleve['prenom']] = $eleve['reponses'];
    egal(['1' => 'A'], $parPrenom['Léa']);
    egal(['1' => 'B', '2' => 'B'], $parPrenom['Noah']);
    egal([], $parPrenom['Zoé'], 'Zoé n’a répondu à rien : elle figure quand même');
    egal(['Inès', 'Léa', 'Noah', 'Tom', 'Zoé'], array_column($r['json']['eleves'], 'prenom'), 'dans l’ordre du tableau de classe');
    vrai(!str_contains($r['texte'], $direct['eleves'][0]['code']), 'aucun code élève dans le fichier');
    egal(1, preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$r['json']['jour']), 'le jour, pour le nom du fichier');
    $ligne = bd_test()->query("SELECT action, cible_type, cible_id, resultat FROM journal WHERE action = 'direct.fichier' ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    egal(['action' => 'direct.fichier', 'cible_type' => 'classe', 'cible_id' => $direct['classe'], 'resultat' => 'ok'],
        ['action' => $ligne['action'], 'cible_type' => $ligne['cible_type'], 'cible_id' => (int)$ligne['cible_id'], 'resultat' => $ligne['resultat']],
        'prendre le fichier laisse une ligne au journal');
});

verifier("direct — interroger ne compte rien ; seules les réponses sont comptées, et freinées", function () use (&$direct) {
    vider_compteurs();
    for ($i = 0; $i < 40; $i++) direct_eleve($direct['eleves'][3]['code']);
    for ($i = 0; $i < 10; $i++) direct_prof('direct.etat', $direct);
    egal(0, count(compteurs()), 'cinquante interrogations, aucun compteur écrit');
    egal(200, direct_eleve($direct['eleves'][3]['code'], ['numero' => 2, 'reponse' => 'A'])['code']);
    egal(1, count(compteurs()), 'une réponse : un compteur');
    semer_compteur('direct:' . $direct['eleves'][3]['code'], 300, 120);
    $r = direct_eleve($direct['eleves'][3]['code'], ['numero' => 2, 'reponse' => 'B']);
    egal(429, $r['code'], 'la 121e réponse en cinq minutes est refusée');
    vrai(entete($r, 'Retry-After') !== null, 'avec le délai');
    egal(200, direct_eleve($direct['eleves'][3]['code'])['code'], 'mais il voit toujours la séance');
    egal('A', direct_eleve($direct['eleves'][3]['code'])['json']['direct']['reponse']);
    vider_compteurs();
});

verifier("direct — la veille : le TABLEAU repousse la fin de vingt minutes, pas les élèves ; le plafond de questions tient", function () use (&$direct) {
    // 17/10/2026 (« c'est généralement un prof qui oublie ») : la séance vit
    // tant que le tableau appelle — son interrogation et ses gestes —, vingt
    // minutes au plus sans lui (VEILLE_DIRECT), trois heures au plus en tout
    // (PLAFOND_DIRECT). Remplace « une heure et demie après le dernier geste ».
    $classeId = (int)$direct['classe'];
    $lireFin = fn() => (int)bd_test()->query('SELECT expire_le FROM directs WHERE classe_id = ' . $classeId)->fetchColumn();
    $poserFin = fn(int $fin) => bd_test()->exec('UPDATE directs SET expire_le = ' . $fin . ' WHERE classe_id = ' . $classeId);
    $poserFin(time() + 100);
    direct_eleve($direct['eleves'][0]['code']);
    vrai($lireFin() <= time() + 100, 'l’interrogation d’un élève ne prolonge rien');
    direct_prof('direct.etat', $direct);
    vrai($lireFin() >= time() + 1190 && $lireFin() <= time() + 1201, 'l’interrogation du tableau repousse la fin de vingt minutes');
    // Pas une écriture à chaque interrogation : moins de trente secondes à gagner, rien ne s'écrit.
    $poserFin(time() + 1180);
    $avant = $lireFin();
    direct_prof('direct.etat', $direct);
    egal($avant, $lireFin(), 'à moins de trente secondes près, le tableau n’écrit rien');
    $poserFin(time() + 100);
    direct_prof('direct.devoiler', $direct);
    vrai($lireFin() >= time() + 1190, 'un geste aussi repousse la fin');
    // Le plafond : trois heures après l'ouverture, quoi que fasse le tableau.
    $ouvert = (int)bd_test()->query('SELECT ouvert_le FROM directs WHERE classe_id = ' . $classeId)->fetchColumn();
    bd_test()->exec('UPDATE directs SET ouvert_le = ' . (time() - 10800 + 60) . ' WHERE classe_id = ' . $classeId);
    $poserFin(time() + 10);
    direct_prof('direct.etat', $direct);
    vrai($lireFin() <= time() + 61, 'le tableau ne repousse jamais au-delà de trois heures après l’ouverture');
    direct_prof('direct.bonne', $direct, ['bonne' => 'A']);
    vrai($lireFin() <= time() + 61, 'un geste non plus');
    bd_test()->exec('UPDATE directs SET ouvert_le = ' . $ouvert . ' WHERE classe_id = ' . $classeId);
    direct_prof('direct.etat', $direct);
    $numero = (int)bd_test()->query('SELECT numero FROM directs WHERE classe_id = ' . $classeId)->fetchColumn();
    bd_test()->exec('UPDATE directs SET numero = 80 WHERE classe_id = ' . $classeId);
    egal(409, direct_prof('direct.question', $direct, ['type' => 'choix'])['code'], 'quatre-vingts questions : la suivante est refusée');
    bd_test()->exec('UPDATE directs SET numero = ' . $numero . ' WHERE classe_id = ' . $classeId);
});

verifier("direct — la veille ne touche jamais une évaluation, et ne réveille pas une séance périmée", function () use (&$direct) {
    $classeId = (int)$direct['classe'];
    // Une ligne d'évaluation : l'interrogation du tableau ne la voit pas, ne la prolonge pas.
    $ligne = bd_test()->query('SELECT mode, expire_le FROM directs WHERE classe_id = ' . $classeId)->fetch();
    bd_test()->exec("UPDATE directs SET mode = 'evaluation', expire_le = " . (time() + 50) . ' WHERE classe_id = ' . $classeId);
    $r = direct_prof('direct.etat', $direct);
    vrai($r['json']['direct'] === null, 'pour le tableau, une évaluation n’est pas une séance');
    vrai((int)bd_test()->query('SELECT expire_le FROM directs WHERE classe_id = ' . $classeId)->fetchColumn() <= time() + 50, 'et sa fin ne bouge pas');
    bd_test()->exec("UPDATE directs SET mode = 'eclair', expire_le = " . (int)$ligne['expire_le'] . ' WHERE classe_id = ' . $classeId);
    egal('eclair', (string)$ligne['mode'], 'c’était bien une séance éclair');
});

verifier("direct — la pastille : « Mes classes » et la classe disent qu'une séance est ouverte, le mode seulement, jamais en lecture seule", function () use (&$direct) {
    $jeton = $direct['jeton'];
    $modeDans = function (array $liste, int $id) {
        foreach ($liste as $classe) if ((int)$classe['id'] === $id) return array_key_exists('direct', $classe) ? $classe['direct'] : 'absent';
        return 'classe absente';
    };
    $liste = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton])['json']['classes'];
    egal('eclair', $modeDans($liste, (int)$direct['classe']), 'la classe en séance porte « eclair »');
    egal(null, $modeDans($liste, (int)$direct['autreClasse']), 'l’autre classe, rien');
    $tableau = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $direct['classe'], 'appli' => 'defi-tables'], ['jeton' => $jeton])['json'];
    egal('eclair', $tableau['classe']['direct'] ?? 'absent', 'le tableau de la classe le dit aussi (« Reprendre »)');
    foreach ($liste as $classe) {
        foreach (array_keys($classe) as $cle) {
            vrai(in_array($cle, ['id', 'libelle', 'applis', 'reglages', 'cree_le', 'annee', 'eleves', 'droit', 'proprietaire', 'direct'], true), "rien d’autre ne sort dans la liste ($cle)");
        }
    }
    // Un collègue : en lecture seule, rien ; en écriture, la pastille.
    vider_compteurs();
    $nouveau = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'collegue-veille'], ['jeton' => $jeton])['json'];
    vrai(isset($nouveau['id'], $nouveau['motdepasse']), 'le collègue est créé');
    $jetonCollegue = connexion('collegue-veille', $nouveau['motdepasse'])['json']['jeton'];
    egal(200, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $nouveau['motdepasse'], 'nouveau' => 'pastille-ou-pas-de-pastille'], ['jeton' => $jetonCollegue])['code'],
        'il remplace son mot de passe temporaire');
    $jetonCollegue = connexion('collegue-veille', 'pastille-ou-pas-de-pastille')['json']['jeton'];
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $direct['classe'], 'prof_id' => $nouveau['id'], 'droit' => 'lecture'], ['jeton' => $jeton]);
    $liste = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonCollegue])['json']['classes'];
    egal(null, $modeDans($liste, (int)$direct['classe']), 'en lecture seule : pas de pastille');
    $tableau = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $direct['classe'], 'appli' => 'defi-tables'], ['jeton' => $jetonCollegue])['json'];
    vrai(array_key_exists('direct', $tableau['classe']) && $tableau['classe']['direct'] === null, 'ni dans la classe');
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $direct['classe'], 'prof_id' => $nouveau['id'], 'droit' => 'ecriture'], ['jeton' => $jeton]);
    $liste = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonCollegue])['json']['classes'];
    // Lot 5e : tant que la séance en direct est réservée à l'administrateur,
    // le collègue en écriture ne voit pas la pastille d'une question éclair
    // (« Reprendre » le mènerait à un refus). Le jour où elle rouvre : la pastille.
    egal(DIRECT_RESERVE_ATTENDUE ? null : 'eclair', $modeDans($liste, (int)$direct['classe']), 'en écriture : la pastille seulement s’il peut la reprendre');
    $tableau = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $direct['classe'], 'appli' => 'defi-tables'], ['jeton' => $jetonCollegue])['json'];
    egal(DIRECT_RESERVE_ATTENDUE ? null : 'eclair', array_key_exists('direct', $tableau['classe']) ? $tableau['classe']['direct'] : 'absent', 'ni « Reprendre » dans la classe');
    appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => $nouveau['id']], ['jeton' => $jeton]);
    vider_compteurs();
});

verifier("direct — terminer efface tout, tout de suite", function () use (&$direct) {
    vrai(directs_en_base()['directs_reponses'] > 0 && directs_en_base()['directs_questions'] === 2, 'il y avait de quoi effacer');
    egal(200, direct_prof('direct.terminer', $direct)['code']);
    egal(['directs' => 0, 'directs_questions' => 0, 'directs_reponses' => 0], directs_en_base(), 'les trois tables sont vides');
    egal(0, lignes_directs(), 'pas même la présence des élèves');
    vrai(direct_eleve($direct['eleves'][0]['code'])['json']['direct'] === null, 'l’élève : plus de séance');
    vrai(direct_prof('direct.etat', $direct)['json']['direct'] === null, 'le tableau : plus de séance');
    egal(200, direct_prof('direct.terminer', $direct)['code'], 'terminer deux fois n’est pas une erreur');
    egal(409, direct_prof('direct.fichier', $direct)['code'], 'après, il n’y a plus de fichier');
    $r = direct_eleve($direct['eleves'][0]['code'], ['numero' => 1, 'reponse' => 'A']);
    vrai($r['code'] === 200 && $r['json']['direct'] === null, 'répondre à une séance terminée : « plus de séance », pas une panne');
});

verifier("direct — le rang : le téléphone dit le numéro du tableau (« Question 1 / 8 »), un nombre et rien d'autre", function () use (&$direct) {
    // 17/10/2026 : une question éclair puis un questionnaire, et le téléphone
    // disait « Question 2 » quand le tableau disait « Question 1 / 8 ».
    egal(200, direct_prof('direct.ouvrir', $direct)['code']);
    egal(200, direct_prof('direct.question', $direct, ['type' => 'choix'])['code'], 'une question éclair');
    $etat = direct_eleve($direct['eleves'][0]['code'])['json']['direct'];
    egal(1, $etat['numero']);
    egal(['choix' => 4], $etat['reglage'], 'sans rang : le téléphone affiche le numéro de la séance');
    direct_prof('direct.devoiler', $direct);
    foreach ([0, 81, '1', 1.5, true, -3, [1]] as $mauvais) {
        egal(400, direct_prof('direct.question', $direct, ['type' => 'choix', 'reglage' => ['choix' => 4, 'rang' => $mauvais]])['code'],
            'rang ' . json_encode($mauvais) . ' refusé');
    }
    $r = direct_prof('direct.question', $direct, ['type' => 'choix', 'reglage' => ['choix' => 3, 'rang' => 1]]);
    egal(200, $r['code']);
    egal(2, $r['json']['direct']['numero'], 'pour le serveur, c’est la question 2 de la séance');
    $etat = direct_eleve($direct['eleves'][0]['code'])['json']['direct'];
    egal(['choix' => 3, 'rang' => 1], $etat['reglage'], 'le téléphone reçoit le rang du tableau : « Question 1 »');
    egal(200, direct_prof('direct.terminer', $direct)['code']);
    egal(0, lignes_directs(), 'rien ne reste');
});

verifier("direct — une séance oubliée disparaît toute seule, au premier passage de n'importe qui", function () use (&$direct) {
    direct_prof('direct.ouvrir', $direct);
    direct_prof('direct.question', $direct, ['type' => 'choix']);
    direct_eleve($direct['eleves'][0]['code'], ['numero' => 1, 'reponse' => 'A']);
    egal(['directs' => 1, 'directs_questions' => 1, 'directs_reponses' => 1], directs_en_base());
    bd_test()->exec('UPDATE directs SET expire_le = ' . (time() - 1));
    // Un élève d'une AUTRE classe passe : c'est lui qui déclenche la purge.
    vrai(direct_eleve($direct['autreEleve']['code'])['json']['direct'] === null, 'lui n’a pas de séance');
    egal(['directs' => 0, 'directs_questions' => 0, 'directs_reponses' => 0], directs_en_base(), 'tout est parti');
    egal(0, lignes_directs(), 'présences comprises');
    // Et l'ouverture de « Mes classes » purge aussi.
    direct_prof('direct.ouvrir', $direct);
    bd_test()->exec('UPDATE directs SET expire_le = ' . (time() - 1));
    $liste = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $direct['jeton']])['json']['classes'];
    egal(0, directs_en_base()['directs'], '« Mes classes » emporte une séance périmée');
    foreach ($liste as $classe) egal(null, $classe['direct'], 'et aucune carte ne porte de pastille');
    // Une séance périmée pas encore purgée n'empêche pas d'en ouvrir une neuve.
    direct_prof('direct.ouvrir', $direct);
    bd_test()->exec('UPDATE directs SET expire_le = ' . (time() - 1));
    $r = direct_prof('direct.ouvrir', $direct);
    egal(200, $r['code']);
    egal(0, $r['json']['direct']['numero'], 'une séance neuve, pas l’ancienne');
    egal(1, directs_en_base()['directs']);
    direct_prof('direct.terminer', $direct);
});

verifier("direct — l'élève supprimé emporte ses réponses, la classe supprimée emporte sa séance", function () use (&$direct) {
    direct_prof('direct.ouvrir', $direct);
    direct_prof('direct.question', $direct, ['type' => 'choix']);
    direct_eleve($direct['eleves'][0]['code'], ['numero' => 1, 'reponse' => 'A']);
    direct_eleve($direct['eleves'][1]['code'], ['numero' => 1, 'reponse' => 'B']);
    egal(200, appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $direct['eleves'][0]['id']], ['jeton' => $direct['jeton']])['code']);
    egal(1, directs_en_base()['directs_reponses'], 'ses réponses sont parties avec lui');
    egal(1, presences_en_base(), 'et sa présence aussi');
    egal(4, direct_prof('direct.etat', $direct)['json']['direct']['inscrits'], 'et la classe compte un élève de moins');
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $direct['classe']], ['jeton' => $direct['jeton']])['code']);
    egal(['directs' => 0, 'directs_questions' => 0, 'directs_reponses' => 0], directs_en_base(), 'il ne reste rien de la séance');
    egal(0, lignes_directs(), 'rien, présences comprises');
});

verifier("direct — les deux pages : servies, sous la politique de contenu, jamais en cache", function () {
    foreach (['/direct.php' => 'api/direct.php', '/prof/direct.php' => '../api/prof.php'] as $chemin => $api) {
        $r = page($chemin);
        egal(200, $r['code'], $chemin);
        vrai(str_contains($r['texte'], 'Séance en direct'), "$chemin : la page");
        vrai(str_contains($r['texte'], $api), "$chemin interroge $api");
        egal(1, preg_match("/script-src 'self' 'nonce-([^']+)'/", (string)entete($r, 'Content-Security-Policy'), $m), "$chemin : politique de contenu");
        vrai(str_contains($r['texte'], 'nonce="' . htmlspecialchars($m[1], ENT_QUOTES) . '"'), "$chemin : le script porte le nonce");
        egal('no-store', entete($r, 'Cache-Control'), "$chemin : pas de cache");
        egal('DENY', entete($r, 'X-Frame-Options'), "$chemin : pas dans un cadre");
    }
    vrai(str_contains(page('/')['texte'], 'id="direct-lien"'), 'l’espace élève porte la tuile « Séance en direct »');
    vrai(str_contains(page('/prof/')['texte'], 'id="seance-direct"'), '« Ma classe » porte le bouton');
});

verifier("direct — verifier.php et migrer.php connaissent les trois tables", function () {
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'toutes présentes'), 'toutes les tables présentes');
    foreach (['directs_reponses', 'directs_questions', 'directs'] as $table) bd_test()->exec("DROP TABLE $table");
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'manquantes : directs, directs_questions, directs_reponses'), 'sans elles, verifier.php les nomme');
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'directs'), 'migrer.php annonce les tables créées');
    egal(['directs' => 0, 'directs_questions' => 0, 'directs_reponses' => 0], directs_en_base(), 'recréées, vides');
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(!str_contains($r['texte'], 'Tables « directs »'), 'un second passage n’annonce plus rien');
});

// ============================================ SÉANCE EN DIRECT, LOT 2 (15/10/2026)
//
// Lot 2 « questionnaire au tableau ». Le questionnaire lui-même (fichier JSON
// chez le professeur) n'arrive JAMAIS au serveur : ce bloc tient ce que le
// serveur a gagné pour lui.
//  - la PRÉSENCE : un élève qui rejoint est noté une fois (numéro 0), le
//    tableau compte « répondu / connectés », l'élève n'en reçoit rien ;
//  - le CHRONO : une durée prise dans une liste fermée, une fin posée et tenue
//    par le serveur — après elle, aucune réponse n'entre, même sans « Dévoiler » ;
//  - la BONNE RÉPONSE n'arrive qu'avec « Dévoiler », jamais avant, et un second
//    « Dévoiler » ne défait pas une correction du professeur ;
//  - verifier.php dit ce qui reste en base, et rougit sur une ligne orpheline.
//
// Sabotages attendus (chacun rend un test rouge) :
//  h) retirer « && !chrono_ecoule_direct(...) » de api/direct.php
//  i) ne plus filtrer « numero >= 1 » dans contenu_du_direct()
//  j) envoyer « connectes » à l'élève (etat_du_direct_pour_l_eleve)
//  k) ranger la bonne réponse même quand « Dévoiler » n'a rien dévoilé
//  l) envoyer le réglage complet (durée et fin) à l'élève
//  m) retirer la ligne « Séances en direct » de verifier.php

$direct2 = ['jeton' => null, 'classe' => null, 'eleves' => [], 'autreEleve' => null];

verifier("direct, lot 2 — mise en place : une classe neuve de cinq élèves", function () use (&$direct, &$direct2) {
    $direct2['jeton'] = $direct['jeton'];
    $direct2['classe'] = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'direct2-405'], ['jeton' => $direct2['jeton']])['json']['id'];
    $direct2['eleves'] = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $direct2['classe'], 'nombre' => 5], ['jeton' => $direct2['jeton']])['json']['eleves'];
    egal(5, count($direct2['eleves']), 'cinq élèves');
    $direct2['autreEleve'] = $direct['autreEleve'];
    egal(0, lignes_directs(), 'aucune séance en cours');
});

verifier("direct, lot 2 — présence : chaque élève qui rejoint est compté une fois, sans écrire à chaque passage", function () use (&$direct2) {
    $r = direct_prof('direct.ouvrir', $direct2);
    egal(0, $r['json']['direct']['connectes'], 'personne n’a encore rejoint');
    egal(5, $r['json']['direct']['inscrits']);
    direct_eleve($direct2['eleves'][0]['code']);
    direct_eleve($direct2['eleves'][1]['code']);
    for ($i = 0; $i < 20; $i++) direct_eleve($direct2['eleves'][0]['code']);
    egal(2, presences_en_base(), 'deux élèves, deux lignes — pas une par passage');
    egal(2, direct_prof('direct.etat', $direct2)['json']['direct']['connectes'], 'le tableau compte deux présents');
    direct_eleve($direct2['autreEleve']['code']);
    egal(2, presences_en_base(), 'l’élève d’une autre classe ne compte pas');
    $etat = direct_eleve($direct2['eleves'][0]['code'])['json']['direct'];
    foreach (['connectes', 'inscrits', 'repondu', 'reste', 'duree'] as $cle) {
        vrai(!array_key_exists($cle, $etat), "l'élève ne reçoit pas « $cle »");
    }
    // Un élève qui répond du premier coup est compté aussi.
    direct_prof('direct.question', $direct2, ['type' => 'choix']);
    direct_eleve($direct2['eleves'][2]['code'], ['numero' => 1, 'reponse' => 'A']);
    egal(3, presences_en_base());
    $e = direct_prof('direct.etat', $direct2)['json']['direct'];
    egal(1, $e['repondu']);
    egal(3, $e['connectes'], '1 / 3 au tableau');
    vrai($e['duree'] === null && $e['reste'] === null, 'sans chrono : ni durée ni reste');
    $f = direct_prof('direct.fichier', $direct2)['json'];
    foreach ($f['eleves'] as $eleve) {
        vrai(!array_key_exists('0', (array)$eleve['reponses']), 'la présence n’entre pas dans le fichier');
    }
    egal(5, count($f['eleves']), 'les cinq élèves y sont, présents ou non');
});

verifier("direct, lot 2 — le chrono : une durée prise dans une liste fermée, une fin tenue par le serveur", function () use (&$direct2) {
    direct_prof('direct.devoiler', $direct2);
    foreach ([4, 601, '30', 30.5, true, -10] as $mauvaise) {
        egal(400, direct_prof('direct.question', $direct2, ['type' => 'choix', 'reglage' => ['choix' => 4, 'duree' => $mauvaise]])['code'],
            'durée ' . json_encode($mauvaise) . ' refusée');
    }
    $r = direct_prof('direct.question', $direct2, ['type' => 'choix', 'reglage' => ['choix' => 4, 'duree' => 30, 'fin' => 1]]);
    egal(200, $r['code']);
    egal(2, $r['json']['direct']['numero']);
    egal(30, $r['json']['direct']['duree']);
    $reste = $r['json']['direct']['reste'];
    vrai(is_int($reste) && $reste >= 29 && $reste <= 30, 'le chrono part : ' . json_encode($reste));
    $seance = (int)bd_test()->query('SELECT id FROM directs WHERE classe_id = ' . (int)$direct2['classe'])->fetchColumn();
    $lireReglage = fn() => json_decode((string)bd_test()->query("SELECT reglage FROM directs_questions WHERE direct_id = $seance AND numero = 2")->fetchColumn(), true);
    $reglage = $lireReglage();
    egal(['choix', 'duree', 'fin'], array_keys($reglage), 'le serveur range la fin lui-même');
    vrai(abs($reglage['fin'] - (time() + 30)) <= 2, 'une fin envoyée par la page ne compte pas : la sienne, dans 30 s');
    $etat = direct_eleve($direct2['eleves'][0]['code'])['json']['direct'];
    egal(['choix' => 4], $etat['reglage'], "l'élève ne reçoit que ses boutons : ni durée ni fin");
    egal(true, direct_eleve($direct2['eleves'][0]['code'], ['numero' => 2, 'reponse' => 'B'])['json']['enregistree'], 'pendant le chrono : rangée');
    // Le chrono s'écoule (on recule la fin dans la base).
    $reglage['fin'] = time() - 1;
    bd_test()->prepare("UPDATE directs_questions SET reglage = ? WHERE direct_id = $seance AND numero = 2")->execute([json_encode($reglage)]);
    $tardive = direct_eleve($direct2['eleves'][1]['code'], ['numero' => 2, 'reponse' => 'C']);
    egal(false, $tardive['json']['enregistree'], 'après la fin : refusée, même sans « Dévoiler »');
    egal('devoile', $tardive['json']['direct']['etat'], "pour l'élève, la question est close");
    egal(false, direct_eleve($direct2['eleves'][0]['code'], ['numero' => 2, 'reponse' => 'D'])['json']['enregistree'], 'on ne change plus d’avis');
    egal('B', direct_eleve($direct2['eleves'][0]['code'])['json']['direct']['reponse'], 'sa réponse d’avant est restée');
    $e = direct_prof('direct.etat', $direct2)['json']['direct'];
    egal('question', $e['etat'], 'le tableau, lui, dévoile tout seul quand il voit zéro');
    egal(0, $e['reste']);
    egal(1, $e['repondu']);
    vrai($e['repartition'] === null, 'toujours pas de répartition avant « Dévoiler »');
});

verifier("direct, lot 2 — dévoiler avec la bonne réponse : en un seul geste, jamais avant, sans défaire une correction", function () use (&$direct2) {
    $seance = (int)bd_test()->query('SELECT id FROM directs WHERE classe_id = ' . (int)$direct2['classe'])->fetchColumn();
    $bonneEnBase = fn() => bd_test()->query("SELECT bonne FROM directs_questions WHERE direct_id = $seance AND numero = 2")->fetchColumn();
    vrai($bonneEnBase() === null, 'question ouverte : le serveur ne connaît pas la bonne réponse');
    egal(400, direct_prof('direct.devoiler', $direct2, ['bonne' => 'Z'])['code'], 'Z n’existe pas');
    egal(400, direct_prof('direct.devoiler', $direct2, ['bonne' => ['B']])['code'], 'un tableau non plus');
    egal('question', direct_prof('direct.etat', $direct2)['json']['direct']['etat'], 'refusé : rien n’est dévoilé');
    vrai($bonneEnBase() === null, 'ni rangé');
    $r = direct_prof('direct.devoiler', $direct2, ['bonne' => 'b']);
    egal(200, $r['code']);
    egal('devoile', $r['json']['direct']['etat']);
    egal('B', $r['json']['direct']['bonne'], 'dévoilée avec sa bonne réponse');
    egal(['B' => 1], $r['json']['direct']['repartition']);
    // Le professeur corrige en cliquant une barre ; un second « Dévoiler » ne défait rien.
    direct_prof('direct.bonne', $direct2, ['bonne' => 'C']);
    egal('C', direct_prof('direct.devoiler', $direct2, ['bonne' => 'B'])['json']['direct']['bonne'], 'la correction tient');
    vrai(!str_contains(direct_eleve($direct2['eleves'][0]['code'])['texte'], 'bonne'), 'l’élève ne la reçoit toujours pas');
    $f = direct_prof('direct.fichier', $direct2)['json'];
    egal('C', $f['questions'][1]['bonne'], 'le fichier porte la bonne réponse');
    // Sans question en cours, une bonne réponse n'a pas de sens.
    direct_prof('direct.terminer', $direct2);
    direct_prof('direct.ouvrir', $direct2);
    egal(409, direct_prof('direct.devoiler', $direct2, ['bonne' => 'A'])['code'], 'pas de question : refusé');
    egal(200, direct_prof('direct.devoiler', $direct2)['code'], 'dévoiler sans question ni bonne réponse ne casse rien');
    egal('attente', direct_prof('direct.etat', $direct2)['json']['direct']['etat']);
});

verifier("direct, lot 2 — verifier.php dit ce qui reste en base, et rougit sur une réponse sans séance", function () use (&$direct2) {
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'Séances en direct'), 'la ligne existe');
    vrai(str_contains($r['texte'], '1 en cours'), 'une séance ouverte : il la compte');
    direct_prof('direct.terminer', $direct2);
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'aucune en cours, 0 réponse en base'), 'après « Terminer » : rien');
    bd_test()->exec("INSERT INTO directs_reponses (direct_id, numero, eleve_id, reponse) VALUES (999999, 1, 1, 'A')");
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'restent sans leur séance'), 'une ligne orpheline est signalée');
    bd_test()->exec('DELETE FROM directs_reponses WHERE direct_id = 999999');
    egal(0, lignes_directs());
});

// ===================================== LES ÉVALUATIONS EN CLASSE, LOT E1 (15/10/2026)
//
// lib/evaluation.php, la branche « evaluation » de api/direct.php, les
// actions evaluation.* de api/prof.php. Ce que ce bloc tient :
//  - les MODÈLES : un réglage de liste fermée, à soi (un collègue ne voit ni
//    ne touche les miens), un quota, un nom propre ;
//  - OUVRIR : une évaluation par classe, pas pendant une question éclair (et
//    pas de question éclair pendant une évaluation), la graine tirée par le
//    serveur, la fin posée par lui, dix ouvertures = une séance ;
//  - l'ÉLÈVE : rien avant « Je commence » ; une graine, une fois ; une
//    réponse par numéro, la suivante seulement, la première arrivée reste ;
//    la forme vérifiée ; rien après sa fenêtre, après la fermeture, après la
//    fin ; il ne reçoit jamais un compteur ni la copie d'un autre ;
//  - MA CLASSE : des compteurs sans nom ; le fichier (graines, réponses,
//    débuts) au droit écriture, journalisé ; le serveur ne corrige jamais ;
//  - RIEN NE RESTE : « Terminer », la purge vingt heures après la fermeture,
//    la classe ou l'élève supprimés, le compte supprimé (ses modèles).
//
// Sabotages attendus (chacun rend un test rouge) :
//  n) ne plus tirer la graine de l'élève au serveur (commencer_evaluation qui
//     prend $corps['graine'])
//  o) retirer « count($deja) + 1 !== $numero » de repondre_evaluation()
//  p) DO NOTHING → DO UPDATE SET reponse = excluded.reponse (la dernière gagne)
//  q) retirer fenetre_evaluation_close() de api/direct.php
//  r) envoyer « commences » à l'élève (etat_evaluation_pour_l_eleve)
//  s) direct.ouvrir sans la garde « evaluation_de_la_classe »
//  t) retirer oublier_modeles_du_prof() de supprimer_prof()
//  u) expire_le = fin (plus de garde de vingt heures)

require_once dirname(__DIR__) . '/public/lib/evaluation.php';

$ev = ['jeton' => null, 'classe' => null, 'eleves' => [], 'autreEleve' => null, 'modele' => null, 'collegue' => null, 'jetonCollegue' => null];
const REGLAGE_EV = ['tables' => [2, 3, 4, 5, 6, 7, 8, 9], 'types' => ['direct', 'missing', 'division'], 'n' => 20,
    'chrono' => 'question', 'secondes' => 8, 'tirage' => 'memes', 'exclus' => ['2-1', '2-10'], 'imposes' => ['7-8', '6-9']];

function ev_prof(string $action, array $ev, array $corps = [], ?string $jeton = null): array
{
    return appel('/api/prof.php', ['action' => $action, 'classe_id' => $ev['classe']] + $corps, ['jeton' => $jeton ?? $ev['jeton']]);
}

function ev_eleve(string $code, array $corps = []): array
{
    return appel('/api/direct.php', ['code' => $code] + $corps);
}

function ev_en_base(): array
{
    $id = bd_test()->query("SELECT id FROM directs WHERE mode = 'evaluation'")->fetchColumn();
    if ($id === false) return ['seances' => 0, 'presences' => 0, 'reponses' => 0];
    return [
        'seances' => 1,
        'presences' => (int)bd_test()->query("SELECT COUNT(*) FROM directs_reponses WHERE direct_id = $id AND numero = 0")->fetchColumn(),
        'reponses' => (int)bd_test()->query("SELECT COUNT(*) FROM directs_reponses WHERE direct_id = $id AND numero >= 1")->fetchColumn(),
    ];
}

function ev_reglage_en_base(array $ev): array
{
    $json = bd_test()->query('SELECT reglage FROM directs WHERE classe_id = ' . (int)$ev['classe'])->fetchColumn();
    return is_string($json) ? (json_decode($json, true) ?? []) : [];
}

verifier("évaluations — mise en place : une classe de six élèves nommés, un collègue en écriture, les tables vides", function () use (&$direct, &$ev) {
    vider_compteurs();
    $ev['jeton'] = $direct['jeton'];
    $ev['classe'] = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'eval-405'], ['jeton' => $ev['jeton']])['json']['id'];
    $ev['eleves'] = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $ev['classe'], 'nombre' => 6], ['jeton' => $ev['jeton']])['json']['eleves'];
    egal(6, count($ev['eleves']), 'six élèves');
    foreach (['Léa', 'Noah', 'Inès', 'Tom', 'Zoé', 'Sami'] as $i => $prenom) {
        appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $ev['eleves'][$i]['id'], 'prenom' => $prenom, 'initiale' => 'E'], ['jeton' => $ev['jeton']]);
    }
    $ev['autreEleve'] = $direct['autreEleve'];
    $cree = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'eval-collegue'], ['jeton' => $ev['jeton']])['json'];
    $ev['collegue'] = (int)$cree['id'];
    $jetonNeuf = connexion('eval-collegue', $cree['motdepasse'])['json']['jeton'];
    appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $cree['motdepasse'], 'nouveau' => 'une phrase pour le collegue 2026'], ['jeton' => $jetonNeuf]);
    $ev['jetonCollegue'] = $jetonNeuf;
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $ev['classe'], 'prof_id' => $ev['collegue'], 'droit' => 'ecriture'], ['jeton' => $ev['jeton']]);
    bd_test()->exec('DELETE FROM directs_reponses');
    bd_test()->exec('DELETE FROM directs_questions');
    bd_test()->exec('DELETE FROM directs');
    bd_test()->exec('DELETE FROM modeles_evaluation');
    egal(0, lignes_directs());
});

verifier("évaluations — les modèles : liste fermée, à soi, nom propre, quota", function () use (&$ev) {
    egal([], ev_prof('evaluation.modeles', $ev)['json']['modeles'], 'aucun modèle au départ');
    foreach ([
        [REGLAGE_EV, '', 'sans nom'],
        [['n' => '20'] + REGLAGE_EV, 'x', 'un texte à la place du nombre'],
        [['n' => 4] + REGLAGE_EV, 'x', 'quatre questions'],
        [['n' => 51] + REGLAGE_EV, 'x', 'cinquante et une questions'],
        [['tables' => []] + REGLAGE_EV, 'x', 'sans table'],
        [['tables' => [11]] + REGLAGE_EV, 'x', 'table de 11'],
        [['types' => ['texte']] + REGLAGE_EV, 'x', 'type inconnu'],
        [['chrono' => 'minute'] + REGLAGE_EV, 'x', 'chrono inconnu'],
        [['secondes' => 2] + REGLAGE_EV, 'x', 'deux secondes par question'],
        [['chrono' => 'global', 'secondes' => 10] + REGLAGE_EV, 'x', 'dix secondes en tout'],
        [['exclus' => ['7×8']] + REGLAGE_EV, 'x', 'un calcul mal écrit'],
        [['imposes' => ['1-1']] + REGLAGE_EV, 'x', 'un calcul hors des tables'],
        [['imposes' => ['7-8', '2-1']] + REGLAGE_EV, 'x', 'exclu et imposé'],
        [['n' => 5, 'imposes' => ['7-8', '6-9', '3-3', '4-4', '5-5', '2-2']] + REGLAGE_EV, 'x', 'plus d’imposés que de questions'],
        ['pas un tableau', 'x', 'pas un réglage'],
    ] as [$reglage, $nom, $quoi]) {
        egal(400, ev_prof('evaluation.enregistrer_modele', $ev, ['id' => null, 'nom' => $nom, 'reglage' => $reglage])['code'], "refusé : $quoi");
    }
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM modeles_evaluation')->fetchColumn(), 'rien n’est rangé');
    $r = ev_prof('evaluation.enregistrer_modele', $ev, ['id' => null, 'nom' => "  Tables\u{200B} 2 à 9  —  rapide \x07", 'reglage' => ['tirage' => 'n’importe', 'exclus' => ['1-2', '2-1']] + REGLAGE_EV]);
    egal(200, $r['code'], json_encode($r['json']));
    $ev['modele'] = (int)$r['json']['id'];
    egal(1, count($r['json']['modeles']));
    egal('Tables 2 à 9 — rapide', $r['json']['modeles'][0]['nom'], 'le nom est nettoyé (espaces, caractères invisibles)');
    egal(['tables' => [2, 3, 4, 5, 6, 7, 8, 9], 'types' => ['direct', 'missing', 'division'], 'n' => 20, 'chrono' => 'question', 'secondes' => 8,
          'tirage' => 'memes', 'exclus' => ['1-2'], 'imposes' => ['7-8', '6-9']], $r['json']['modeles'][0]['reglage'],
        'le réglage rangé est remis au propre : tirage par défaut, exclus sans doublon');
    $json = (string)bd_test()->query('SELECT reglage FROM modeles_evaluation')->fetchColumn();
    vrai(!str_contains($json, 'n’importe') && strlen($json) < 600, 'en base : le réglage propre, et court');
    // Modifier le sien ; pas celui d'un autre.
    $r = ev_prof('evaluation.enregistrer_modele', $ev, ['id' => $ev['modele'], 'nom' => str_repeat('a', 50), 'reglage' => ['chrono' => 'sans'] + REGLAGE_EV]);
    egal(200, $r['code']);
    egal(str_repeat('a', 40), $r['json']['modeles'][0]['nom'], 'quarante caractères au plus');
    egal('sans', $r['json']['modeles'][0]['reglage']['chrono']);
    vrai($r['json']['modeles'][0]['reglage']['secondes'] === null, 'sans chrono : pas de secondes');
    egal([], ev_prof('evaluation.modeles', $ev, [], $ev['jetonCollegue'])['json']['modeles'], 'le collègue ne voit pas mes modèles');
    egal(404, ev_prof('evaluation.enregistrer_modele', $ev, ['id' => $ev['modele'], 'nom' => 'volé', 'reglage' => REGLAGE_EV], $ev['jetonCollegue'])['code'], 'ni ne les modifie');
    egal(404, ev_prof('evaluation.supprimer_modele', $ev, ['id' => $ev['modele']], $ev['jetonCollegue'])['code'], 'ni ne les supprime');
    egal(404, ev_prof('evaluation.enregistrer_modele', $ev, ['id' => 999999, 'nom' => 'x', 'reglage' => REGLAGE_EV])['code'], 'un id inconnu');
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM modeles_evaluation')->fetchColumn());
    // Le quota.
    for ($i = 0; $i < 29; $i++) {
        bd_test()->prepare('INSERT INTO modeles_evaluation (prof_id, nom, reglage, cree_le, modifie_le) VALUES (?, ?, ?, ?, ?)')
            ->execute([(int)bd_test()->query("SELECT id FROM profs WHERE identifiant = 'gwenael'")->fetchColumn(), "quota $i", '{}', time(), time()]);
    }
    egal(409, ev_prof('evaluation.enregistrer_modele', $ev, ['id' => null, 'nom' => 'le 31e', 'reglage' => REGLAGE_EV])['code'], 'trente modèles : le suivant est refusé');
    bd_test()->exec("DELETE FROM modeles_evaluation WHERE nom LIKE 'quota %'");
    // Remis au propre pour la suite.
    egal(200, ev_prof('evaluation.enregistrer_modele', $ev, ['id' => $ev['modele'], 'nom' => 'Tables 2 à 9 — rapide', 'reglage' => REGLAGE_EV])['code']);
});

verifier("évaluations — ouvrir : un modèle à soi, une durée de la liste, la graine et la fin posées par le serveur, une séance par classe", function () use (&$ev) {
    egal(404, ev_prof('evaluation.ouvrir', $ev, ['modele_id' => 999999, 'duree' => 3600])['code'], 'modèle inconnu');
    egal(404, ev_prof('evaluation.ouvrir', $ev, ['modele_id' => $ev['modele'], 'duree' => 3600], $ev['jetonCollegue'])['code'], 'le modèle d’un autre : inconnu pour lui');
    egal(400, ev_prof('evaluation.ouvrir', $ev, ['modele_id' => $ev['modele'], 'duree' => 999])['code'], 'durée hors liste');
    egal(0, ev_en_base()['seances'], 'rien n’est ouvert');
    // Pas pendant une question éclair.
    ev_prof('direct.ouvrir', $ev);
    egal(409, ev_prof('evaluation.ouvrir', $ev, ['modele_id' => $ev['modele'], 'duree' => 3600])['code'], 'une question éclair occupe la classe');
    ev_prof('direct.terminer', $ev);
    vrai(ev_prof('evaluation.etat', $ev)['json']['evaluation'] === null, 'avant : aucune évaluation');
    $avant = time();
    $codes = appels_paralleles('/api/prof.php', ['action' => 'evaluation.ouvrir', 'classe_id' => $ev['classe'], 'modele_id' => $ev['modele'], 'duree' => 3600, 'jeton' => $ev['jeton']], 10);
    egal([200], array_values(array_unique($codes)), 'dix ouvertures simultanées, toutes servies');
    egal(1, ev_en_base()['seances'], 'une seule séance en base');
    $r = ev_prof('evaluation.ouvrir', $ev, ['modele_id' => $ev['modele'], 'duree' => 1800]);
    $e = $r['json']['evaluation'];
    egal('ouverte', $e['etat']);
    egal('Tables 2 à 9 — rapide', $e['nom']);
    egal(6, $e['inscrits']);
    egal(0, $e['commences']);
    egal(0, $e['finis']);
    vrai($e['fin'] - $e['ouvert_le'] === 3600, 'rouvrir ne change pas la durée : toujours 1 h, celle de la première ouverture');
    vrai(abs($e['fin'] - ($avant + 3600)) <= 3, 'la fin est posée par le serveur');
    egal($e['fin'] + 72000, $e['expire_le'], 'les réponses attendent le fichier vingt heures après la fin');
    egal(['tables', 'types', 'n', 'chrono', 'secondes', 'tirage', 'exclus', 'imposes'], array_keys($e['modele']), 'le modèle figé, sans la graine');
    $base = ev_reglage_en_base($ev);
    vrai(is_int($base['graine']) && $base['graine'] >= 0, 'la graine de l’évaluation est en base');
    egal(20, (int)bd_test()->query('SELECT numero FROM directs WHERE classe_id = ' . (int)$ev['classe'])->fetchColumn(), 'numero = le nombre de questions');
    egal('evaluation', (string)bd_test()->query('SELECT mode FROM directs WHERE classe_id = ' . (int)$ev['classe'])->fetchColumn());
    $ligne = bd_test()->query("SELECT action, cible_id FROM journal WHERE action = 'evaluation.ouvrir' ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    egal(['evaluation.ouvrir', $ev['classe']], [$ligne['action'], (int)$ligne['cible_id']], 'une ligne au journal');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'evaluation.ouvrir' AND cible_id = " . (int)$ev['classe'])->fetchColumn(), 'une seule, pas une par clic');
    // La course, rejouée : seule la demande qui a ÉCRIT la séance journalise
    // (sur les machines de la CI, deux demandes voyaient « rien » avant que la
    // première n'ait écrit — trouvé sur la PR #996).
    for ($tour = 1; $tour <= 3; $tour++) {
        ev_prof('evaluation.terminer', $ev);
        appels_paralleles('/api/prof.php', ['action' => 'evaluation.ouvrir', 'classe_id' => $ev['classe'], 'modele_id' => $ev['modele'], 'duree' => 3600, 'jeton' => $ev['jeton']], 10);
        egal(1, ev_en_base()['seances'], "tour $tour : une séance");
        egal(1 + $tour, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'evaluation.ouvrir' AND cible_id = " . (int)$ev['classe'])->fetchColumn(), "tour $tour : une ligne de journal de plus, pas dix");
    }
    $r = ev_prof('evaluation.ouvrir', $ev, ['modele_id' => $ev['modele'], 'duree' => 1800]);
    $e = $r['json']['evaluation'];
    // Pendant : pas de question éclair, et le tableau ne voit pas de séance.
    egal(409, ev_prof('direct.ouvrir', $ev)['code'], 'pas de question éclair pendant une évaluation');
    vrai(ev_prof('direct.etat', $ev)['json']['direct'] === null, 'pour le tableau, aucune séance');
    egal(409, ev_prof('direct.question', $ev, ['type' => 'choix'])['code']);
    egal(200, ev_prof('direct.terminer', $ev)['code'], 'direct.terminer ne casse rien…');
    egal(1, ev_en_base()['seances'], '… et n’emporte pas l’évaluation');
    // Le collègue en écriture la voit ; en lecture, non.
    egal('ouverte', ev_prof('evaluation.etat', $ev, [], $ev['jetonCollegue'])['json']['evaluation']['etat'], 'le collègue en écriture voit l’évaluation');
});

verifier("évaluations — l'élève avant « Je commence » : l'état et le modèle, pas de graine, pas de compteur ; une autre classe ne voit rien", function () use (&$ev) {
    $r = ev_eleve($ev['eleves'][0]['code']);
    egal(200, $r['code']);
    vrai($r['json']['direct'] === null, 'pour la page de la question éclair : aucune séance');
    $e = $r['json']['evaluation'];
    egal('ouverte', $e['etat']);
    egal(false, $e['commence']);
    vrai($e['graines'] === null && $e['suivant'] === null && $e['ecoule'] === null, 'rien avant « Je commence »');
    egal(false, $e['fini']);
    egal(20, $e['modele']['n']);
    egal(['7-8', '6-9'], $e['modele']['imposes'], 'le modèle complet : l’appli en a besoin pour tirer');
    foreach (['commences', 'finis', 'inscrits', 'graine', 'eleves', 'fin', 'expire_le'] as $cle) {
        vrai(!array_key_exists($cle, $e), "l'élève ne reçoit pas « $cle »");
    }
    egal(6000, $r['json']['rythme'], 'le rythme lent : l’appli n’a rien à suivre en boucle');
    egal(0, ev_en_base()['presences'], 'interroger n’écrit pas de présence');
    vrai(ev_eleve($ev['autreEleve']['code'])['json']['evaluation'] === null, 'l’élève d’une autre classe : aucune évaluation');
    egal(409, ev_eleve($ev['eleves'][0]['code'], ['numero' => 1, 'reponse' => '5', 'dixiemes' => 10])['code'], 'répondre sans avoir commencé');
    egal(409, ev_eleve($ev['eleves'][0]['code'], ['finir' => true])['code'], 'finir sans avoir commencé');
});

verifier("évaluations — « Je commence » : la graine tirée par le serveur, une fois, même à vingt en même temps", function () use (&$ev) {
    $code = $ev['eleves'][0]['code'];
    $r = ev_eleve($code, ['commencer' => true, 'graine' => 42]);
    egal(200, $r['code']);
    $e = $r['json']['evaluation'];
    egal(true, $e['commence']);
    vrai(is_int($e['graines']['seance']) && is_int($e['graines']['eleve']), 'deux graines');
    egal(ev_reglage_en_base($ev)['graine'], $e['graines']['seance'], 'celle de l’évaluation');
    vrai($e['graines']['eleve'] !== 42, 'la graine envoyée par la page ne compte pas');
    egal(1, $e['suivant']);
    egal([], (array)$e['reponses']);
    vrai(is_int($e['ecoule']) && $e['ecoule'] <= 2, 'le temps écoulé part de zéro');
    $deux = ev_eleve($code, ['commencer' => true])['json']['evaluation'];
    egal($e['graines'], $deux['graines'], 'un second « Je commence » : la même graine');
    egal(1, ev_en_base()['presences'], 'une seule ligne de présence');
    $codes = appels_paralleles('/api/direct.php', ['code' => $ev['eleves'][1]['code'], 'commencer' => true], 20);
    vrai(!in_array(500, $codes, true), 'vingt « Je commence » au même instant : aucune panne');
    egal(2, ev_en_base()['presences'], 'et une seule ligne pour lui aussi');
    $graines = [];
    for ($i = 0; $i < 20; $i++) $graines[] = ev_eleve($ev['eleves'][1]['code'])['json']['evaluation']['graines']['eleve'];
    egal(1, count(array_unique($graines)), 'toujours la même');
    vrai($graines[0] !== $e['graines']['eleve'], 'deux élèves, deux graines');
    egal(['graine', 'debut', 'fini'], array_keys(lire_presence_evaluation((string)bd_test()->query('SELECT reponse FROM directs_reponses WHERE numero = 0 AND eleve_id = ' . (int)$ev['eleves'][0]['id'])->fetchColumn())), 'la présence : graine, début, fini');
    $etat = ev_prof('evaluation.etat', $ev)['json']['evaluation'];
    egal(2, $etat['commences']);
    egal(0, $etat['finis']);
});

verifier("évaluations — répondre : la suivante seulement, une seule fois, la première arrivée reste, la forme vérifiée", function () use (&$ev) {
    $code = $ev['eleves'][0]['code'];
    foreach (['a', '-5', '1234', '5.5', ' 5 6', ['5']] as $mauvaise) {
        egal(400, ev_eleve($code, ['numero' => 1, 'reponse' => $mauvaise, 'dixiemes' => 10])['code'], 'refusée : ' . json_encode($mauvaise));
    }
    egal(0, ev_en_base()['reponses']);
    egal(false, ev_eleve($code, ['numero' => 2, 'reponse' => '5', 'dixiemes' => 10])['json']['enregistree'], 'la question 2 avant la 1 : rien');
    egal(false, ev_eleve($code, ['numero' => 0, 'reponse' => '5', 'dixiemes' => 10])['json']['enregistree'], 'le numéro 0 est la présence, pas une question');
    egal(false, ev_eleve($code, ['numero' => 21, 'reponse' => '5', 'dixiemes' => 10])['json']['enregistree'], 'au-delà de n');
    $r = ev_eleve($code, ['numero' => 1, 'reponse' => '56', 'dixiemes' => 43]);
    egal(200, $r['code']);
    egal(true, $r['json']['enregistree']);
    egal(2, $r['json']['evaluation']['suivant']);
    egal(['1' => '56|43'], (array)$r['json']['evaluation']['reponses'], 'sa réponse, telle que rangée');
    egal('56|43', (string)bd_test()->query('SELECT reponse FROM directs_reponses WHERE numero = 1 AND eleve_id = ' . (int)$ev['eleves'][0]['id'])->fetchColumn());
    egal(false, ev_eleve($code, ['numero' => 1, 'reponse' => '57', 'dixiemes' => 50])['json']['enregistree'], 'une seconde réponse à la même question : refusée');
    egal('56|43', (string)bd_test()->query('SELECT reponse FROM directs_reponses WHERE numero = 1 AND eleve_id = ' . (int)$ev['eleves'][0]['id'])->fetchColumn(), 'et la première reste');
    // Vide = pas de réponse ; dixièmes bornés.
    $r = ev_eleve($code, ['numero' => 2, 'reponse' => '', 'dixiemes' => 9999999]);
    egal(true, $r['json']['enregistree']);
    egal('|999999', (string)bd_test()->query('SELECT reponse FROM directs_reponses WHERE numero = 2 AND eleve_id = ' . (int)$ev['eleves'][0]['id'])->fetchColumn(), 'sans réponse : valeur vide, dixièmes bornés');
    ev_eleve($code, ['numero' => 3, 'reponse' => '7', 'dixiemes' => -5]);
    egal('7|0', (string)bd_test()->query('SELECT reponse FROM directs_reponses WHERE numero = 3 AND eleve_id = ' . (int)$ev['eleves'][0]['id'])->fetchColumn(), 'des dixièmes négatifs valent zéro');
    // Vingt fois la même question au même instant (double clic, réseau qui rejoue).
    $codes = appels_paralleles('/api/direct.php', ['code' => $code, 'numero' => 4, 'reponse' => '8', 'dixiemes' => 12], 20);
    vrai(!in_array(500, $codes, true), 'aucune erreur serveur : ' . json_encode(array_count_values($codes)));
    egal(4, ev_en_base()['reponses'], 'une ligne par numéro');
    // L'élève d'une autre classe, ou un collègue de classe : rien.
    vrai(ev_eleve($ev['autreEleve']['code'], ['numero' => 1, 'reponse' => '5', 'dixiemes' => 1])['json']['evaluation'] === null, 'une autre classe : aucune évaluation, donc aucune réponse');
    // Le limiteur : 120 gestes par code et par cinq minutes.
    vider_compteurs();
    semer_compteur('direct:' . $code, 300, 120);
    $r = ev_eleve($code, ['numero' => 5, 'reponse' => '5', 'dixiemes' => 10]);
    egal(429, $r['code'], 'le 121e geste en cinq minutes est refusé');
    egal(200, ev_eleve($code)['code'], 'mais il voit toujours l’évaluation');
    vider_compteurs();
});

verifier("évaluations — la fenêtre de l'élève est tenue par le serveur ; vingt réponses, et c'est fini", function () use (&$ev) {
    $code = $ev['eleves'][0]['code'];
    $eleveId = (int)$ev['eleves'][0]['id'];
    $seance = (int)bd_test()->query("SELECT id FROM directs WHERE mode = 'evaluation'")->fetchColumn();
    // 20 questions × 8 s + 10 s de marge = 170 s : on recule son début de 171 s.
    $presence = (string)bd_test()->query("SELECT reponse FROM directs_reponses WHERE direct_id = $seance AND numero = 0 AND eleve_id = $eleveId")->fetchColumn();
    [$graine, $debut] = explode('|', $presence);
    bd_test()->prepare("UPDATE directs_reponses SET reponse = ? WHERE direct_id = $seance AND numero = 0 AND eleve_id = $eleveId")->execute([$graine . '|' . ($debut - 171)]);
    $r = ev_eleve($code, ['numero' => 5, 'reponse' => '5', 'dixiemes' => 10]);
    egal(false, $r['json']['enregistree'], 'après sa fenêtre : refusée');
    egal(true, $r['json']['evaluation']['close'], 'et l’élève apprend que c’est terminé pour lui');
    egal(4, ev_en_base()['reponses']);
    bd_test()->prepare("UPDATE directs_reponses SET reponse = ? WHERE direct_id = $seance AND numero = 0 AND eleve_id = $eleveId")->execute([$graine . '|' . ($debut - 100)]);
    egal(true, ev_eleve($code, ['numero' => 5, 'reponse' => '5', 'dixiemes' => 10])['json']['enregistree'], 'dans la fenêtre : rangée');
    for ($numero = 6; $numero <= 20; $numero++) {
        egal(true, ev_eleve($code, ['numero' => $numero, 'reponse' => (string)$numero, 'dixiemes' => 20])['json']['enregistree'], "réponse $numero");
    }
    $e = ev_eleve($code)['json']['evaluation'];
    egal(true, $e['fini'], 'vingt réponses : fini tout seul');
    egal(false, $e['close']);
    egal(20, $e['suivant']);
    egal(20, count((array)$e['reponses']), 'il relit ses vingt réponses (pour recalculer son score après un rechargement)');
    vrai(str_ends_with((string)bd_test()->query("SELECT reponse FROM directs_reponses WHERE direct_id = $seance AND numero = 0 AND eleve_id = $eleveId")->fetchColumn(), '|1'), 'le drapeau « fini » sur sa présence');
    egal(false, ev_eleve($code, ['numero' => 21, 'reponse' => '1', 'dixiemes' => 1])['json']['enregistree'], 'rien après la fin');
    // Le second élève finit à la main, à mi-parcours.
    $code2 = $ev['eleves'][1]['code'];
    ev_eleve($code2, ['numero' => 1, 'reponse' => '9', 'dixiemes' => 30]);
    egal(true, ev_eleve($code2, ['finir' => true])['json']['evaluation']['fini']);
    egal(false, ev_eleve($code2, ['numero' => 2, 'reponse' => '9', 'dixiemes' => 30])['json']['enregistree'], 'fini : plus rien n’entre');
    $etat = ev_prof('evaluation.etat', $ev)['json']['evaluation'];
    egal(2, $etat['commences']);
    egal(2, $etat['finis']);
    // Lot E2 : la liste « qui a commencé, qui a fini », par élève — les
    // prénoms vont au professeur en écriture (comme le fichier) ; jamais un
    // code, une graine, une réponse.
    egal(6, count($etat['eleves']), 'les six élèves de la classe');
    egal(['Inès', 'Léa', 'Noah', 'Sami', 'Tom', 'Zoé'], array_column($etat['eleves'], 'prenom'), 'dans l’ordre du tableau de classe');
    $parPrenom = [];
    foreach ($etat['eleves'] as $eleve) $parPrenom[$eleve['prenom']] = $eleve;
    egal(['id' => (int)$ev['eleves'][0]['id'], 'prenom' => 'Léa', 'initiale' => 'E', 'etat' => 'fini', 'question' => 20], $parPrenom['Léa'], 'Léa a fini');
    egal('fini', $parPrenom['Noah']['etat'], 'Noah a fini à la main');
    egal(['etat' => 'rien', 'question' => null], ['etat' => $parPrenom['Inès']['etat'], 'question' => $parPrenom['Inès']['question']], 'Inès n’a pas commencé');
    foreach ([$code, $code2, 'graine', '56|43', 'reponses'] as $interdit) {
        vrai(!str_contains(json_encode($etat), $interdit), "Ma classe ne reçoit pas « $interdit » en boucle");
    }
});

verifier("évaluations — « Faire repasser » (lot E2) : le passage effacé, un nouveau tirage, pour l'écriture, tant que c'est ouvert, journalisé sur l'élève", function () use (&$ev) {
    $code2 = $ev['eleves'][1]['code'];
    $noah = (int)$ev['eleves'][1]['id'];
    $avant = ev_eleve($code2)['json']['evaluation'];
    egal(true, $avant['fini']);
    $graineAvant = $avant['graines']['eleve'];
    $revisionAvant = (int)ev_prof('evaluation.etat', $ev)['json']['evaluation']['revision'];
    // Les refus : un élève inconnu, l'élève d'une autre classe, la lecture seule.
    egal(404, ev_prof('evaluation.repasser', $ev, ['eleve_id' => 999999])['code'], 'élève inconnu');
    egal(404, ev_prof('evaluation.repasser', $ev, ['eleve_id' => (int)$ev['autreEleve']['id']])['code'], 'l’élève d’une autre classe : inconnu ici');
    egal(404, ev_prof('evaluation.repasser', $ev, ['eleve_id' => 'noah'])['code'], 'un identifiant qui n’est pas un nombre : inconnu');
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $ev['classe'], 'prof_id' => $ev['collegue'], 'droit' => 'lecture'], ['jeton' => $ev['jeton']]);
    egal(403, ev_prof('evaluation.repasser', $ev, ['eleve_id' => $noah], $ev['jetonCollegue'])['code'], 'en lecture seule : non');
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $ev['classe'], 'prof_id' => $ev['collegue'], 'droit' => 'ecriture'], ['jeton' => $ev['jeton']]);
    egal(2, ev_en_base()['presences'], 'rien n’a bougé');
    egal(21, ev_en_base()['reponses']);
    // Le collègue en écriture fait repasser Noah.
    $r = ev_prof('evaluation.repasser', $ev, ['eleve_id' => $noah], $ev['jetonCollegue']);
    egal(200, $r['code'], json_encode($r['json']));
    egal(true, $r['json']['efface']);
    egal(1, ev_en_base()['presences'], 'sa présence est partie');
    egal(20, ev_en_base()['reponses'], 'sa réponse aussi ; celles de Léa restent');
    egal(1, $r['json']['evaluation']['commences']);
    egal(1, $r['json']['evaluation']['finis']);
    $parPrenom = [];
    foreach ($r['json']['evaluation']['eleves'] as $eleve) $parPrenom[$eleve['prenom']] = $eleve;
    egal('rien', $parPrenom['Noah']['etat'], 'pour Ma classe, Noah n’a pas commencé');
    egal($revisionAvant + 1, (int)$r['json']['evaluation']['revision'], 'la révision monte : l’appli de Noah saura que son état a changé');
    $e = ev_eleve($code2)['json']['evaluation'];
    egal(false, $e['commence'], 'pour l’appli de Noah : il n’a pas commencé');
    vrai($e['graines'] === null && $e['suivant'] === null, 'plus de graine, plus de suivant');
    egal(false, $e['fini']);
    $ligne = bd_test()->query("SELECT action, cible_type, cible_id, prof_id FROM journal WHERE action = 'evaluation.repasser' ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    egal(['evaluation.repasser', 'eleve', $noah, $ev['collegue']], [$ligne['action'], $ligne['cible_type'], (int)$ligne['cible_id'], (int)$ligne['prof_id']], 'journalisé sur l’élève, par le collègue');
    vrai(!str_contains(json_encode($ligne), 'Noah'), 'sans prénom');
    // Repasser un élève qui n'a pas commencé : rien à effacer, pas une erreur, pas de journal.
    $r = ev_prof('evaluation.repasser', $ev, ['eleve_id' => $noah]);
    egal(200, $r['code']);
    egal(false, $r['json']['efface']);
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'evaluation.repasser' AND resultat = 'ok'")->fetchColumn(), 'une seule ligne de journal (la ligne « refus » de la lecture seule est à part)');
    // Noah recommence : une AUTRE graine (un nouveau tirage), et il peut répondre.
    $deux = ev_eleve($code2, ['commencer' => true])['json']['evaluation'];
    egal(true, $deux['commence']);
    vrai($deux['graines']['eleve'] !== $graineAvant, 'une nouvelle graine : pas la copie du premier passage');
    egal($avant['graines']['seance'], $deux['graines']['seance'], 'la graine de l’évaluation, elle, ne change pas');
    egal(1, $deux['suivant']);
    egal(true, ev_eleve($code2, ['numero' => 1, 'reponse' => '9', 'dixiemes' => 30])['json']['enregistree'], 'il répond de nouveau à la question 1');
    egal(true, ev_eleve($code2, ['finir' => true])['json']['evaluation']['fini']);
    egal(['seances' => 1, 'presences' => 2, 'reponses' => 21], ev_en_base(), 'le fichier ne gardera que ce dernier passage');
});

verifier("évaluations — le fichier : graines, débuts et réponses élève par élève, pour l'écriture seulement, journalisé ; le serveur ne corrige rien", function () use (&$ev) {
    $r = ev_prof('evaluation.fichier', $ev);
    egal(200, $r['code']);
    $f = $r['json'];
    egal('ouverte', $f['etat'], 'avant la fermeture aussi (pour la répartition en direct, un jour)');
    egal(ev_reglage_en_base($ev)['graine'], $f['graine'], 'la graine de l’évaluation');
    egal(20, $f['modele']['n']);
    egal(6, count($f['eleves']), 'les six élèves, présents ou non');
    $parPrenom = [];
    foreach ($f['eleves'] as $eleve) $parPrenom[$eleve['prenom']] = $eleve;
    vrai(is_int($parPrenom['Léa']['graine']) && is_int($parPrenom['Léa']['debut']), 'Léa : sa graine et son début');
    egal(true, $parPrenom['Léa']['fini']);
    egal(20, count((array)$parPrenom['Léa']['reponses']));
    egal('56|43', ((array)$parPrenom['Léa']['reponses'])['1']);
    vrai($parPrenom['Inès']['graine'] === null && $parPrenom['Inès']['debut'] === null, 'Inès n’a pas commencé : pas de graine');
    egal([], (array)$parPrenom['Inès']['reponses']);
    egal(['Inès', 'Léa', 'Noah', 'Sami', 'Tom', 'Zoé'], array_column($f['eleves'], 'prenom'), 'dans l’ordre du tableau de classe');
    foreach ([$ev['eleves'][0]['code'], 'note', 'score', 'bonne', 'answer', 'prompt'] as $interdit) {
        vrai(!str_contains($r['texte'], $interdit), "le fichier ne porte pas « $interdit » : ni code, ni note, ni correction");
    }
    egal(1, preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$f['jour']), 'le jour, pour le nom du fichier');
    $ligne = bd_test()->query("SELECT action, cible_id FROM journal WHERE action = 'evaluation.fichier' ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    egal(['evaluation.fichier', $ev['classe']], [$ligne['action'], (int)$ligne['cible_id']], 'prendre le fichier laisse une ligne au journal');
    egal(200, ev_prof('evaluation.fichier', $ev, [], $ev['jetonCollegue'])['code'], 'le collègue en écriture le reçoit aussi');
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $ev['classe'], 'prof_id' => $ev['collegue'], 'droit' => 'lecture'], ['jeton' => $ev['jeton']]);
    egal(403, ev_prof('evaluation.fichier', $ev, [], $ev['jetonCollegue'])['code'], 'en lecture seule : non');
    egal(403, ev_prof('evaluation.etat', $ev, [], $ev['jetonCollegue'])['code'], 'ni l’état');
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $ev['classe'], 'prof_id' => $ev['collegue'], 'droit' => 'ecriture'], ['jeton' => $ev['jeton']]);
});

verifier("évaluations — fermer : plus rien n'entre, personne ne commence, les réponses attendent le fichier vingt heures", function () use (&$ev) {
    $r = ev_prof('evaluation.fermer', $ev);
    egal(200, $r['code']);
    $e = $r['json']['evaluation'];
    egal('fermee', $e['etat']);
    vrai($e['fin'] <= time(), 'la fin est maintenant');
    egal($e['fin'] + 72000, $e['expire_le'], 'vingt heures de garde');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'evaluation.fermer' AND cible_id = " . (int)$ev['classe'])->fetchColumn());
    egal(200, ev_prof('evaluation.fermer', $ev)['code'], 'fermer deux fois ne casse rien');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'evaluation.fermer' AND cible_id = " . (int)$ev['classe'])->fetchColumn(), 'et ne journalise qu’une fois');
    egal(409, ev_eleve($ev['eleves'][2]['code'], ['commencer' => true])['code'], 'fermée : on ne commence plus');
    egal(409, ev_prof('evaluation.repasser', $ev, ['eleve_id' => (int)$ev['eleves'][1]['id']])['code'], 'fermée : on ne fait plus repasser (lot E2)');
    egal(2, ev_en_base()['presences'], 'et rien n’a été effacé');
    $code3 = $ev['eleves'][2]['code'];
    egal('fermee', ev_eleve($code3)['json']['evaluation']['etat'], 'l’élève voit « fermée »');
    egal(false, ev_eleve($ev['eleves'][1]['code'], ['numero' => 2, 'reponse' => '1', 'dixiemes' => 1])['json']['enregistree'], 'plus aucune réponse');
    egal(2, ev_en_base()['presences']);
    egal(21, ev_en_base()['reponses'], 'les réponses sont toujours là, pour le fichier');
    egal(200, ev_prof('evaluation.fichier', $ev)['code'], 'le fichier se prend après la fermeture');
    egal('fermee', ev_prof('evaluation.fichier', $ev)['json']['etat']);
    $r = ev_prof('evaluation.ouvrir', $ev, ['modele_id' => $ev['modele'], 'duree' => 3600]);
    egal(200, $r['code']);
    egal('fermee', $r['json']['evaluation']['etat'], 'rouvrir pendant la garde rend la même séance, fermée — pas une neuve');
    egal(1, ev_en_base()['seances']);
    egal(409, ev_prof('direct.ouvrir', $ev)['code'], 'pas de question éclair non plus tant qu’elle n’est pas terminée');
});

verifier("évaluations — la fermeture automatique à l'échéance, et la purge vingt heures après", function () use (&$ev) {
    ev_prof('evaluation.terminer', $ev);
    ev_prof('evaluation.ouvrir', $ev, ['modele_id' => $ev['modele'], 'duree' => 1800]);
    $code = $ev['eleves'][3]['code'];
    ev_eleve($code, ['commencer' => true]);
    egal(true, ev_eleve($code, ['numero' => 1, 'reponse' => '4', 'dixiemes' => 10])['json']['enregistree']);
    // L'échéance passe (on recule la fin dans le réglage de la séance).
    $reglage = ev_reglage_en_base($ev);
    $reglage['fin'] = time() - 1;
    bd_test()->prepare('UPDATE directs SET reglage = ? WHERE classe_id = ?')->execute([json_encode($reglage), (int)$ev['classe']]);
    egal('fermee', ev_prof('evaluation.etat', $ev)['json']['evaluation']['etat'], 'fermée toute seule, sans geste du professeur');
    egal(false, ev_eleve($code, ['numero' => 2, 'reponse' => '4', 'dixiemes' => 10])['json']['enregistree'], 'une réponse arrivée après ne prolonge rien');
    egal('fermee', ev_eleve($code)['json']['evaluation']['etat']);
    egal(409, ev_eleve($ev['eleves'][4]['code'], ['commencer' => true])['code']);
    egal(1, ev_en_base()['reponses'], 'la réponse d’avant est gardée');
    // Vingt heures plus tard : la purge de la séance en direct emporte tout,
    // au premier passage de n'importe qui.
    bd_test()->exec('UPDATE directs SET expire_le = ' . (time() - 1) . ' WHERE classe_id = ' . (int)$ev['classe']);
    vrai(ev_eleve($ev['autreEleve']['code'])['json']['evaluation'] === null, 'un élève d’une autre classe passe');
    egal(['seances' => 0, 'presences' => 0, 'reponses' => 0], ev_en_base(), 'tout est parti');
    egal(0, lignes_directs());
    vrai(ev_prof('evaluation.etat', $ev)['json']['evaluation'] === null, 'pour Ma classe : plus rien');
    egal(409, ev_prof('evaluation.fichier', $ev)['code'], 'plus de fichier');
});

verifier("évaluations — terminer efface tout ; l'élève, la classe ou le compte supprimés emportent ce qui est à eux", function () use (&$ev) {
    ev_prof('evaluation.ouvrir', $ev, ['modele_id' => $ev['modele'], 'duree' => 3600]);
    ev_eleve($ev['eleves'][0]['code'], ['commencer' => true]);
    ev_eleve($ev['eleves'][0]['code'], ['numero' => 1, 'reponse' => '4', 'dixiemes' => 10]);
    ev_eleve($ev['eleves'][1]['code'], ['commencer' => true]);
    egal(['seances' => 1, 'presences' => 2, 'reponses' => 1], ev_en_base());
    $journalAvant = (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'evaluation.terminer' AND cible_id = " . (int)$ev['classe'])->fetchColumn();
    egal(200, ev_prof('evaluation.terminer', $ev)['code']);
    egal(['seances' => 0, 'presences' => 0, 'reponses' => 0], ev_en_base(), 'les trois tables sont vides');
    egal(0, lignes_directs());
    egal(200, ev_prof('evaluation.terminer', $ev)['code'], 'terminer deux fois n’est pas une erreur');
    egal($journalAvant + 1, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'evaluation.terminer' AND cible_id = " . (int)$ev['classe'])->fetchColumn(), 'journalisé une fois');
    vrai(ev_eleve($ev['eleves'][0]['code'])['json']['evaluation'] === null, 'l’élève : plus d’évaluation');
    // L'élève supprimé.
    ev_prof('evaluation.ouvrir', $ev, ['modele_id' => $ev['modele'], 'duree' => 3600]);
    ev_eleve($ev['eleves'][5]['code'], ['commencer' => true]);
    ev_eleve($ev['eleves'][5]['code'], ['numero' => 1, 'reponse' => '4', 'dixiemes' => 10]);
    ev_eleve($ev['eleves'][4]['code'], ['commencer' => true]);
    egal(200, appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $ev['eleves'][5]['id']], ['jeton' => $ev['jeton']])['code']);
    egal(['seances' => 1, 'presences' => 1, 'reponses' => 0], ev_en_base(), 'sa présence et ses réponses sont parties avec lui');
    egal(5, ev_prof('evaluation.etat', $ev)['json']['evaluation']['inscrits']);
    // La classe supprimée.
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $ev['classe']], ['jeton' => $ev['jeton']])['code']);
    egal(['seances' => 0, 'presences' => 0, 'reponses' => 0], ev_en_base(), 'il ne reste rien de l’évaluation');
    egal(0, lignes_directs());
    // Le compte supprimé emporte ses modèles (le collègue en fait un, puis part).
    egal(200, appel('/api/prof.php', ['action' => 'evaluation.enregistrer_modele', 'id' => null, 'nom' => 'du collègue', 'reglage' => REGLAGE_EV], ['jeton' => $ev['jetonCollegue']])['code']);
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM modeles_evaluation WHERE prof_id = ' . (int)$ev['collegue'])->fetchColumn());
    egal(200, appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => $ev['collegue']], ['jeton' => $ev['jeton']])['code']);
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM modeles_evaluation WHERE prof_id = ' . (int)$ev['collegue'])->fetchColumn(), 'ses modèles sont partis avec lui');
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM modeles_evaluation')->fetchColumn(), 'les miens restent');
});

verifier("évaluations — sauvegarde, verifier.php, migrer.php : les modèles sauvegardés, les réponses jamais, la table et la colonne connues", function () use (&$ev) {
    // La sauvegarde : les modèles (des réglages du professeur) y sont ; les
    // directs restent en structure seule.
    $phrase = 'phrase-de-sauvegarde-2026';
    $r = formulaire('/sauvegarde.php', ['jeton' => 'JETON-DE-TEST', 'etape' => 'telecharger', 'phrase' => $phrase, 'repete' => $phrase]);
    egal(200, $r['code']);
    $brut = $r['texte'];
    $sel = substr($brut, 8, 8);
    $matiere = hash_pbkdf2('sha256', $phrase, $sel, 200000, 48, true);
    $clair = (string)openssl_decrypt(substr($brut, 16), 'aes-256-cbc', substr($matiere, 0, 32), OPENSSL_RAW_DATA, substr($matiere, 32, 16));
    vrai(str_contains($clair, 'maths&go'), 'le fichier se déchiffre');
    vrai(str_contains($clair, 'INSERT INTO `modeles_evaluation`'), 'les modèles sont dans la sauvegarde');
    vrai(!str_contains($clair, 'INSERT INTO `directs`'), 'les séances, non');
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'Évaluations (Défi tables)'), 'la ligne existe');
    vrai(str_contains($r['texte'], 'aucune en cours, 0 réponse en base, 1 modèle'), 'rien en cours, un modèle');
    bd_test()->exec('DROP TABLE modeles_evaluation');
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'manquantes : modeles_evaluation'), 'sans la table, verifier.php la nomme');
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'modeles_evaluation'), 'migrer.php annonce la table créée');
    egal(true, table_existe(bd_test(), 'modeles_evaluation'));
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(!str_contains($r['texte'], 'modeles_evaluation'), 'un second passage n’annonce plus rien');
    vrai(colonne_existe(bd_test(), 'directs', 'reglage'), 'la colonne « reglage » des séances est là');
});

verifier("évaluations — Ma classe porte la carte, ses deux boîtes, et charge le noyau ; aucun innerHTML", function () {
    $r = page('/prof/');
    foreach (['id="bloc-evaluations"', 'id="eval-modele"', 'id="eval-ouvrir"', 'id="nouveau-modele"', 'evaluation.fichier', 'genererEvaluationDeClasse', 'corrigerEvaluationDeClasse'] as $attendu) {
        vrai(str_contains($r['texte'], $attendu), "Ma classe contient $attendu");
    }
    // Le script de la carte (de son titre à celui des records) ne pose rien
    // par innerHTML : tout ce qui vient du serveur passe par textContent.
    $debut = strpos($r['texte'], 'Les évaluations (lot E1');
    $fin = strpos($r['texte'], 'Les records (lot du 09/10/2026)');
    vrai($debut !== false && $fin !== false && $fin > $debut, 'le script de la carte est là');
    vrai(!str_contains(substr($r['texte'], $debut, $fin - $debut), 'innerHTML'), 'rien n’est écrit par innerHTML dans la carte');
});

// -------------------------------- lot « Qui voit quoi », lot 4a : Anzan (23/10/2026)
//
// Le serveur apprend Anzan : la clé « flash-anzan », juste après Coffres au
// catalogue, ses clés déclarées (les réglages de l'élève par mode, les séances
// — des listes de douze scalaires sous un numéro), ses mots (les modes, les
// opérations, le son), la copie du moteur dans prof/, et aucun réglage de
// classe. Rien ne change chez l'élève ni chez le professeur tant qu'aucune
// classe ni aucun élève (eleves.acces) n'a « flash-anzan ».

verifier("anzan-suivi — le parcours de référence d'Anzan ressort identique du filtre du serveur", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    require_once dirname(__DIR__) . '/public/lib/progression.php';
    $chemin = __DIR__ . '/parcours-reference-anzan.json';
    vrai(is_file($chemin), "tests/parcours-reference-anzan.json manque : node scripts/generer-parcours-reference-anzan.mjs");
    $texte = (string)file_get_contents($chemin);
    $attendu = json_encode(json_decode($texte, false), JSON_UNESCAPED_UNICODE);
    $obtenu = json_encode(filtrer_progression('flash-anzan', json_decode($texte, false)), JSON_UNESCAPED_UNICODE);
    egal($attendu, $obtenu, "le filtre du serveur jette un champ que le moteur Anzan produit : compléter 'cles'/'mots'/'motifs' de « flash-anzan » dans lib/applis.php");
    $reference = json_decode($texte, false);
    egal(17, count(get_object_vars($reference->seances)), 'dix-sept séances (dix d’entraînement libre, cinq aux étapes du Flash, deux à celles de la Colonne : barème révisé du 22/11/2026)');
    egal('colonne', $reference->reglages->mode, 'le mode choisi');
    egal(12, count($reference->seances->{'7'}), 'une séance = douze scalaires (les deux derniers : son identifiant et son ordre)');
    vrai($reference->seances->{'7'}[8] < $reference->seances->{'7'}[7], 'la séance 7 est arrêtée : moins de calculs faits (7) que prévus (10)');
    egal(17, compter_elements_declares('flash-anzan', $attendu), '« Revenir à… » compte les séances');
    vrai(strlen($attendu) < 2400, 'dix-sept séances pèsent moins de 2,4 ko : 500 tiennent sous la borne de 40 ko');
    // Les mots des séances de grade passent le filtre ; le champ « temps »
    // porte le numéro de l'ÉTAPE (101 … en Flash, 201 … en Colonne).
    egal('grade', $reference->seances->{'11'}[1], 'un passage');
    egal(101, $reference->seances->{'11'}[6], 'le passage porte le numéro de son étape (101 : la 1re du 20e kyu)');
    egal('entrainement', $reference->seances->{'13'}[1], 'un entraînement à une étape');
    egal(5, $reference->seances->{'13'}[7], 'un entraînement fait 5 calculs');
    egal(3, $reference->etapeFlash, 'la plus haute étape réussie en Flash (la 3e)');
    $filtre = filtrer_progression('flash-anzan', json_decode($texte, false));
    egal('grade', $filtre->seances->{'11'}[1], 'le serveur garde le mot « grade »');
    egal('entrainement', $filtre->seances->{'13'}[1], 'le serveur garde le mot « entrainement »');
    egal(3, $filtre->etapeFlash, 'le serveur garde « etapeFlash »');
    egal(201, $reference->seances->{'16'}[6], 'un passage en Colonne porte le numéro de son étape (201 : la 1re du 10e kyu)');
    egal(1, $reference->etapeColonne, 'la plus haute étape réussie en Colonne (la 1re)');
    egal(1, $filtre->etapeColonne, 'le serveur garde « etapeColonne »');
    // Une progression de l'ancienne grille (clés « gradeReussi » et
    // « gradeColonne », numéros de grade 1 … 53) passe sans erreur : les
    // deux clés sont retirées, les séances restent des listes de scalaires —
    // c'est le moteur qui les ignore à la lecture.
    $ancienne = json_decode('{"version":1,"epoque":0,"reglages":{},"gradeReussi":12,"gradeColonne":5,"seances":{"1":["2026-11-08","grade","plus",1,1,3,1,10,10,9,4242,1]}}', false);
    $gardee = filtrer_progression('flash-anzan', $ancienne);
    vrai(!isset($gardee->gradeReussi) && !isset($gardee->gradeColonne), 'les clés de l’ancienne grille ne sont plus gardées');
    egal(1, count(get_object_vars($gardee->seances)), 'la vieille séance reste lisible par le filtre (le moteur l’ignore)');
});

verifier("anzan-suivi — un texte, une clé étrangère, un numéro de séance hors motif, une liste de listes sont retirés", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    require_once dirname(__DIR__) . '/public/lib/progression.php';
    $propre = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-anzan.json'), false);
    $attendu = json_encode($propre, JSON_UNESCAPED_UNICODE);
    $sale = json_decode($attendu, false);
    $sale->prenom = 'Rania';
    $sale->reglages->flash->note = 'super';
    $sale->reglages->flash->son = 'trompette';
    $sale->seances->{'0'} = ['2026-10-22', 'flash', 'plus', 2, 3, 10, 8, 10, 10, 10, 4242, 1];
    $sale->seances->{'12345'} = ['2026-10-22', 'flash', 'plus', 2, 3, 10, 8, 10, 10, 10, 4242, 1];
    $sale->seances->{'abc'} = ['2026-10-22', 'flash', 'plus', 2, 3, 10, 8, 10, 10, 10, 4242, 1];
    $sale->seances->{'11'} = ['2026-10-22', 'flash', 'plus', 2, 3, 10, 8, 10, 10, 10, 4242, 11, 'mardi', [1, 2], 'Rania'];
    $sale->calculs = ['347+28', '512-99'];
    $sale->reponses = [375, 413];
    $obtenu = filtrer_progression('flash-anzan', $sale);
    vrai(!isset($obtenu->prenom), 'le prénom reste sur l’appareil');
    vrai(!isset($obtenu->reglages->flash->note), 'un texte dans les réglages saute');
    vrai(!isset($obtenu->reglages->flash->son), 'un son hors de la liste saute');
    vrai(!isset($obtenu->seances->{'0'}) && !isset($obtenu->seances->{'12345'}) && !isset($obtenu->seances->{'abc'}), 'un numéro hors motif saute');
    egal(['2026-10-22', 'flash', 'plus', 2, 3, 10, 8, 10, 10, 10, 4242, 11], $obtenu->seances->{'11'}, 'dans une séance, un texte libre et une liste imbriquée sont retirés ; le moteur, lui, ne garde que les douze premiers champs');
    vrai(!isset($obtenu->reponses), 'les réponses de l’élève ne sont jamais gardées');
    vrai(isset($obtenu->calculs) && $obtenu->calculs === [], 'la clé « calculs » existe (le nombre de calculs d’un réglage) mais aucun texte n’y entre');
    $texte = json_encode($obtenu, JSON_UNESCAPED_UNICODE);
    vrai(!str_contains($texte, 'Rania') && !str_contains($texte, 'super') && !str_contains($texte, '347') && !str_contains($texte, 'mardi'), 'aucun texte libre ne ressort');
    // Le filtre est propre à chaque appli : un parcours Anzan envoyé sous
    // « coffres » ne laisse passer ni séance ni mode.
    $sousCoffres = json_encode(filtrer_progression('coffres', $propre));
    vrai(!str_contains($sousCoffres, 'seances') && !str_contains($sousCoffres, 'flash'), 'les séances d’Anzan ne sont pas des clés de Coffres');
});

$classeAnzan = null;
verifier("anzan-suivi — Anzan s'enregistre et se relit par l'API élève, à sa place du catalogue, et se donne à un seul élève", function () use (&$jetonS1, &$classeAnzan) {
    vider_compteurs();
    // Une classe qui a Anzan en entier (un professeur peut l'ouvrir à toute une classe).
    $r = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-anzan', 'applis' => ['splat', 'flash-anzan', 'defi-tables', 'coffres']], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'classe créée avec Anzan');
    $classe = $r['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    $classeAnzan = ['id' => $classe, 'eleves' => $eleves];
    $code = $eleves[0]['code'];
    $reference = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-anzan.json'), true);
    egal(false, lire($code, 'flash-anzan')['json']['existe'], 'rien avant le premier envoi');
    $w = ecrire($code, $reference, 0, 'flash-anzan');
    egal(200, $w['code'], 'premier envoi accepté (révision 0) : ' . $w['texte']);
    egal(1, $w['json']['revision']);
    $r = lire($code, 'flash-anzan');
    egal(true, $r['json']['existe']);
    egal($reference, $r['json']['parcours'], 'relu exactement tel que le moteur l’a envoyé');
    egal(false, lire($code, 'coffres')['json']['existe'], 'Coffres du même élève n’a pas bougé');
    $ligne = bd_test()->prepare("SELECT calculs FROM versions WHERE eleve_id = ? AND appli = 'flash-anzan'");
    $ligne->execute([(int)$eleves[0]['id']]);
    $compte = (int)$ligne->fetchColumn();
    $ligne->closeCursor();
    egal(17, $compte, 'la version du jour est comptée en séances');
    $r = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe, 'appli' => 'flash-anzan'], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'le tableau de la classe se demande pour Anzan');
    $lu = null;
    foreach ($r['json']['eleves'] as $e) if ((int)$e['id'] === (int)$eleves[0]['id']) $lu = $e;
    vrai($lu !== null && is_array($lu['parcours'] ?? null) && count($lu['parcours']['seances'] ?? []) === 17,
        'le tableau rend le parcours Anzan de l’élève, ses séances comprises');
    // L'ordre de la liste de la classe est celui du catalogue : Anzan juste après Coffres.
    $classes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes'];
    $trouvee = null;
    foreach ($classes as $c) if ((int)$c['id'] === (int)$classe) $trouvee = $c;
    egal(['defi-tables', 'coffres', 'flash-anzan', 'splat'], $trouvee['applis'], 'Anzan entre Coffres et SPLAT!, quel que soit l’ordre envoyé');
    $e = identite($code);
    egal(200, $e['code'], 'l’identité par le code : ' . $e['texte'] . ' ' . $e['erreur_curl']);
    $applis = $e['json']['applis'] ?? [];
    egal(['defi-tables', 'coffres', 'flash-anzan', 'splat'], array_column($applis, 'cle'), 'l’espace élève reçoit les quatre tuiles dans cet ordre');
    egal(['cle' => 'flash-anzan', 'nom' => 'Anzan', 'description' => 'Le calcul mental du soroban, en Flash ou en Colonne.',
        'url' => 'https://mathsgo.re/outils/calcul_mental/flash_anzan.html', 'ancre' => null, 'disponible' => true], $applis[2],
        'la tuile : le nom « Anzan » (choix du 22/10), la phrase convenue, l’adresse ; pas de « cles » ni de « motifs »');
    vrai(!str_contains($e['texte'], 'flash-anzan":{'), 'aucun réglage de classe pour Anzan : rien dans « reglages »');
    // Décochée pour la classe : la tuile disparaît, le parcours reste.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe, 'applis' => ['defi-tables', 'coffres', 'splat']], ['jeton' => $jetonS1]);
    egal(['defi-tables', 'coffres', 'splat'], array_column(identite($code)['json']['applis'], 'cle'), 'décochée : la tuile disparaît de l’espace élève');
    egal(true, lire($code, 'flash-anzan')['json']['existe'], 'et son parcours reste en base');
    // Donnée à un seul élève (« Ce que voit Rania », lot 2) : lui seul la voit.
    $r = donner((int)$eleves[0]['id'], ['flash-anzan' => new stdClass()], $jetonS1);
    egal(200, $r['code'], 'eleves.acces accepte « flash-anzan » : ' . $r['texte']);
    egal(['flash-anzan' => []], $r['json']['ajouts'], 'le rangé');
    egal(['applis' => ['defi-tables', 'coffres', 'flash-anzan', 'splat'], 'reglages' => [], 'portes' => ['defi-tables', 'coffres', 'flash-anzan', 'splat']], $r['json']['acces'], 'le calculé : la classe + Anzan');
    egal(['defi-tables', 'coffres', 'flash-anzan', 'splat'], array_column(identite($code)['json']['applis'], 'cle'), 'Rania voit Anzan, à sa place du catalogue');
    egal(['defi-tables', 'coffres', 'splat'], array_column(identite($eleves[1]['code'])['json']['applis'], 'cle'), 'sa camarade ne voit rien de plus');
    // Un réglage « liste » pour Anzan n'existe pas : refusé.
    $r = donner((int)$eleves[0]['id'], ['flash-anzan' => ['mondes' => [1]]], $jetonS1);
    egal(400, $r['code'], 'Anzan n’a pas de réglage à donner par morceaux');
    vrai(str_contains($r['texte'], 'Réglage inconnu.'), $r['texte']);
    // L'onglet Anzan de la classe s'ouvre, même si la classe n'a plus Anzan : Rania y est.
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe, 'appli' => 'flash-anzan'], ['jeton' => $jetonS1]);
    egal(200, $t['code'], 'le tableau Anzan d’une classe sans Anzan');
    egal(2, count($t['json']['eleves']), 'la classe entière y est listée');
});

verifier("anzan-suivi — le billet d'entrée s'échange pour « flash-anzan », et le moteur est servi d'ici", function () use (&$classeAnzan) {
    $code = $classeAnzan['eleves'][0]['code'];
    $billet = appel('/api/eleve.php', ['code' => $code, 'billet' => true])['json']['billet'];
    $b = echanger($billet, ['appli' => 'flash-anzan']);
    egal(200, $b['code'], 'l’échange : ' . $b['texte']);
    egal('entree', $b['json']['type']);
    egal($code, $b['json']['code'], 'le code revient à l’appli, dans le corps');
    $r = page('/prof/flash_anzan_parcours.js');
    egal(200, $r['code'], 'prof/flash_anzan_parcours.js est servi');
    vrai(str_contains($r['texte'], 'MathsGoFlashAnzanParcours'), 'et c’est bien le moteur');
    $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#class="etat oui">✓</span>\s*Moteur Anzan servi localement#u', $v['texte']), 'verifier.php a sa ligne « Moteur Anzan servi localement », verte');
});

// -------------------------------- lot « Qui voit quoi », lot 4b : Anzan dans « Ma classe » (24/10/2026)
//
// La page prof seule change : l'onglet Anzan, sa case dans ⚙ Réglages, la
// fenêtre « Le parcours de… », et le moteur chargé d'ici à la première
// ouverture de l'onglet, avec la version de son contenu dans l'adresse. Le
// serveur accepte déjà « flash-anzan » (lot 4a) : rien n'y change.

verifier("anzan-suivi — « Ma classe » charge le moteur Anzan d'ici, versionné par son contenu, seulement à l'ouverture de l'onglet ; l'onglet, la fenêtre", function () use ($racine) {
    $moteur = page('/prof/flash_anzan_parcours.js');
    egal(200, $moteur['code'], 'le moteur est servi');
    $p = page('/prof/');
    egal(200, $p['code']);
    vrai((bool)preg_match('#const MOTEUR_ANZAN = "flash_anzan_parcours\.js\?v=([0-9a-f]{10})";#', $p['texte'], $m), '« Ma classe » : l’adresse du moteur, relative, avec une version');
    egal(substr(md5($moteur['texte']), 0, 10), $m[1], 'la version dans l’adresse est l’empreinte du fichier servi');
    vrai(!str_contains($p['texte'], '<script src="flash_anzan_parcours.js'), 'pas chargé d’office : seulement à l’ouverture de l’onglet Anzan');
    vrai(str_contains($p['texte'], '<button type="button" data-appli="flash-anzan" aria-pressed="false">Anzan</button>'), 'l’onglet Anzan');
    // Serveur pro, lot 5b : plus de case dans ⚙ Réglages ni de ligne « En plus pour » — « Régler Anzan » dans son onglet.
    vrai(!str_contains($p['texte'], 'data-appli="flash-anzan">') && !str_contains($p['texte'], 'id="en-plus-flash-anzan"'), 'plus de case ni de « En plus pour » (lot 5b)');
    // Serveur pro, lot 5c : les séances d'Anzan vivent dans la fenêtre de l'élève (la même pour les quatre applis).
    vrai(str_contains($p['texte'], '<dialog id="fenetre-eleve" class="fenetre fenetre-eleve"'), 'la fenêtre de l’élève');
    vrai(str_contains($p['texte'], '<div id="fe-anzan" hidden>'), 'avec la place des séances d’Anzan');
    // Le script de l'onglet (de son titre à la feuille imprimée) ne pose rien par innerHTML.
    $debut = strpos($p['texte'], "l'onglet Anzan\n");
    $fin = strpos($p['texte'], 'feuille imprimée', (int)$debut);
    vrai($debut !== false && $fin !== false && $fin > $debut, 'le script de l’onglet est là');
    vrai(!str_contains(substr($p['texte'], $debut, $fin - $debut), 'innerHTML'), 'rien n’est écrit par innerHTML dans l’onglet Anzan');
});

// -------------------------------- Défi calcul, lot 2b : le serveur apprend « defi-calcul » (31/10/2026)
//
// Le serveur apprend Défi calcul : la clé « defi-calcul », entre Anzan et
// Automatismes au catalogue (son rang de toujours), son adresse, ses clés
// (version 2 du lot 3 : les boîtes par compétence, les causes d'erreur par
// numéro, le plan de la séance, les dates), ses motifs (les 74 codes de
// module, les numéros de cause), aucun mot, son compteur (les séances), les
// copies de ses deux moteurs dans prof/, et aucun réglage de classe. Rien ne
// change chez l'élève ni chez le professeur tant qu'aucune classe ni aucun
// élève n'a « defi-calcul ».

verifier("defi-calcul — le parcours de référence ressort identique du filtre du serveur", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    require_once dirname(__DIR__) . '/public/lib/progression.php';
    $chemin = __DIR__ . '/parcours-reference-defi-calcul.json';
    vrai(is_file($chemin), "tests/parcours-reference-defi-calcul.json manque : node scripts/generer-parcours-reference-defi-calcul.mjs --ecrire");
    $texte = (string)file_get_contents($chemin);
    $reference = json_decode($texte, false);
    vrai(is_object($reference), 'référence lisible');
    // Le prénom reste sur l'appareil : le paquet l'envoie vide, le serveur le retire.
    unset($reference->prenom);
    $attendu = json_encode($reference, JSON_UNESCAPED_UNICODE);
    $obtenu = json_encode(filtrer_progression('defi-calcul', json_decode($texte, false)), JSON_UNESCAPED_UNICODE);
    egal($attendu, $obtenu, "le filtre du serveur jette un champ que le moteur Défi calcul produit : compléter 'cles'/'motifs' de « defi-calcul » dans lib/applis.php");
    $reference = json_decode($texte, false);
    egal(11, $reference->version, 'version 11 (lot C2 « doubles et moitiés » : M1 6 niveaux, D8 5 ; 10 au lot F4 « personne ne reste bloqué » : `ar` et `paliers` ; 9 au lot 6 « programmes 2 » : une case de plus pour F6 et F9 ; 8 au lot 4 « les ceintures » : `ceintures` ; 7 au lot 1 « la séance » : `l` et le plan à 11 nombres ; 6 au correctif du lot S1 : le numéro des séances ; 5 au lot G1 « journal + accueil » : le journal, les deux dates ; 4 au lot F1, 3 au lot « couverture »)');
    egal(74, count(get_object_vars($reference->modules)), 'les 74 modules de la carte');
    egal(5, count($reference->modules->A2->x), 'x par niveau (les échecs de suite, 0 à 3) — A2 a 5 niveaux depuis le lot « couverture »');
    vrai(max($reference->modules->A2->x) <= 3, 'x borné à 3 par le moteur (la mise de côté, lot 3b)');
    vrai(isset($reference->modules->A5->c->{'1'}), 'les causes par numéro');
    vrai(!isset($reference->test), '« test » a disparu (lot 3)');
    egal(11, count($reference->seance->p), 'le plan de la séance : onze nombres (lot 1 « la séance » ; sept au lot F1, cinq avant)');
    // Lot G1 : six listes d'entiers alignées sur les 60 séances (-1 : pas connu), et deux dates par compétence.
    foreach (['calculs', 'justes', 'nouveautes', 'prouvees', 'rouges', 'minutes', 'numero'] as $champ) egal(60, count($reference->journal->{$champ}), "journal : $champ");
    egal(999998, max($reference->journal->numero), 'le numéro d’une séance (correctif S1) : près de 999 999, gardé par le filtre');
    egal(-1, $reference->journal->calculs[0], 'une séance d’avant le journal : -1, gardé par le filtre');
    egal(5, count($reference->modules->A2->d), 'd : une date par compétence');
    egal(6, count($reference->seance->j), 'j : ce que la séance ouverte a fait (six nombres depuis le correctif G1 : les nouveautés en 6e)');
    egal(99, $reference->seance->j[5], 'j : les nouveautés réussies, gardées par le filtre');
    egal(60, compter_elements_declares('defi-calcul', $attendu), '« Revenir à… » compte les séances (60 gardées)');
    vrai(strlen($attendu) < 40000, 'la référence tient sous la borne de 40 ko');
    // Le pire cas (toutes les compétences entrées, 12 causes) : 1 795 clés, 28 853 octets depuis le correctif du lot G1 (28 851 au lot G1, 1 639 et 21 107 avant).
    vrai(strlen($attendu) > 15000, 'la référence est bien un parcours complet');
});

verifier("defi-calcul — un texte, un prénom, un code de module inconnu, une cause hors motif, une liste de listes sont retirés", function () {
    require_once dirname(__DIR__) . '/public/lib/applis.php';
    require_once dirname(__DIR__) . '/public/lib/progression.php';
    $propre = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-defi-calcul.json'), false);
    $sale = json_decode(json_encode($propre), false);
    $sale->prenom = 'Léa';
    $sale->modules->A2->note = 'nulle';
    $sale->modules->A2->vu = 'hier';
    $sale->modules->ZZ9 = $propre->modules->A2;
    $sale->modules->{'A2-3'} = $propre->modules->A2;
    $sale->modules->A2->c->{'abc'} = 3;
    $sale->modules->A2->c->{'123'} = 3;
    $sale->modules->A2->b = [5, [1, 2], 'cinq', 5];
    $sale->calculs = ['37+?=100', '63-9'];
    $sale->reponses = [73, 54];
    $sale->seance->commentaire = 'trop dur';
    $obtenu = filtrer_progression('defi-calcul', $sale);
    vrai(!isset($obtenu->prenom), 'le prénom reste sur l’appareil');
    vrai(!isset($obtenu->modules->A2->note), 'un texte dans un module saute');
    vrai(!isset($obtenu->modules->A2->vu), '« hier » n’est pas une date : retiré (le moteur remet null)');
    vrai(!isset($obtenu->modules->ZZ9) && !isset($obtenu->modules->{'A2-3'}), 'un code hors de la carte saute');
    vrai(!isset($obtenu->modules->A2->c->{'abc'}) && !isset($obtenu->modules->A2->c->{'123'}), 'une cause hors motif (deux chiffres au plus) saute');
    egal([5, 5], $obtenu->modules->A2->b, 'dans une liste, une liste imbriquée et un texte sont retirés ; le moteur, lui, remet la liste à la longueur du module');
    // Lot G1 : « calculs » est désormais une clé déclarée (une liste du journal,
    // des NOMBRES de calculs) — la clé passe, mais aucun texte ne passe dans
    // une liste : il ne reste rien du calcul posé.
    egal([], $obtenu->calculs ?? [], 'aucun calcul posé n’est gardé (les textes d’une liste sont retirés)');
    vrai(!isset($obtenu->reponses), 'aucune réponse d’élève n’est gardée');
    vrai(!isset($obtenu->seance->commentaire), 'pas de texte dans la séance');
    $texte = json_encode($obtenu, JSON_UNESCAPED_UNICODE);
    vrai(!str_contains($texte, 'Léa') && !str_contains($texte, 'nulle') && !str_contains($texte, '37+') && !str_contains($texte, 'trop dur'), 'aucun texte libre ne ressort');
    // Le filtre est propre à chaque appli : un parcours Défi calcul envoyé sous « coffres » ne laisse passer aucun module.
    $sousCoffres = json_encode(filtrer_progression('coffres', $propre));
    vrai(!str_contains($sousCoffres, 'modules') && !str_contains($sousCoffres, '"A2"'), 'les modules de Défi calcul ne sont pas des clés de Coffres');
    // Et l'inverse : la référence de Défi tables sous « defi-calcul » ne garde pas les tables.
    $tables = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference.json'), false);
    $sousCalcul = json_encode(filtrer_progression('defi-calcul', $tables));
    vrai(!str_contains($sousCalcul, 'tables') && !str_contains($sousCalcul, 'apprends'), 'les tables ne sont pas des clés de Défi calcul');
});

$classeCalcul = null;
verifier("defi-calcul — s'enregistre et se relit par l'API élève, à sa place du catalogue, dans le tableau du professeur, et se donne à un seul élève", function () use (&$jetonS1, &$classeCalcul) {
    vider_compteurs();
    $r = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-calcul', 'applis' => ['splat', 'defi-calcul', 'defi-tables']], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'classe créée avec Défi calcul');
    $classe = $r['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    $classeCalcul = ['id' => $classe, 'eleves' => $eleves];
    $code = $eleves[0]['code'];
    $reference = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-defi-calcul.json'), true);
    egal(false, lire($code, 'defi-calcul')['json']['existe'], 'rien avant le premier envoi');
    $w = ecrire($code, $reference, 0, 'defi-calcul');
    egal(200, $w['code'], 'premier envoi accepté (révision 0) : ' . $w['texte']);
    egal(1, $w['json']['revision']);
    $r = lire($code, 'defi-calcul');
    egal(true, $r['json']['existe']);
    $attendu = $reference;
    unset($attendu['prenom']);
    egal($attendu, $r['json']['parcours'], 'relu exactement tel que le moteur l’a envoyé, prénom retiré');
    egal(false, lire($code, 'defi-tables')['json']['existe'], 'Défi tables du même élève n’a pas bougé');
    $ligne = bd_test()->prepare("SELECT calculs FROM versions WHERE eleve_id = ? AND appli = 'defi-calcul'");
    $ligne->execute([(int)$eleves[0]['id']]);
    $compte = (int)$ligne->fetchColumn();
    $ligne->closeCursor();
    egal(60, $compte, 'la version du jour est comptée en séances');
    // Un deuxième envoi avec la révision lue : accepté ; sans : refusé (409) avec l'état.
    $w2 = ecrire($code, $reference, 1, 'defi-calcul');
    egal(200, $w2['code'], 'deuxième envoi avec la bonne révision');
    $w3 = ecrire($code, $reference, 1, 'defi-calcul');
    egal(409, $w3['code'], 'écrire par-dessus un état qu’on n’a pas vu : refusé');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe, 'appli' => 'defi-calcul'], ['jeton' => $jetonS1]);
    egal(200, $t['code'], 'le tableau de la classe se demande pour Défi calcul');
    $lu = null;
    foreach ($t['json']['eleves'] as $e) if ((int)$e['id'] === (int)$eleves[0]['id']) $lu = $e;
    vrai($lu !== null && is_array($lu['parcours'] ?? null) && count($lu['parcours']['modules'] ?? []) === 74, 'le tableau rend le parcours Défi calcul de l’élève, ses modules compris');
    vrai(!isset($lu['parcours']['prenom']), 'et sans prénom');
    $classes = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1])['json']['classes'];
    $trouvee = null;
    foreach ($classes as $c) if ((int)$c['id'] === (int)$classe) $trouvee = $c;
    egal(['defi-tables', 'defi-calcul', 'splat'], $trouvee['applis'], 'Défi calcul entre Défi tables et SPLAT!, quel que soit l’ordre envoyé');
    $e = identite($code);
    egal(200, $e['code'], 'l’identité par le code : ' . $e['texte']);
    $applis = $e['json']['applis'] ?? [];
    egal(['defi-tables', 'defi-calcul', 'splat'], array_column($applis, 'cle'), 'l’espace élève reçoit les trois tuiles dans cet ordre');
    egal(['cle' => 'defi-calcul', 'nom' => 'Défi calcul', 'description' => 'Tout le calcul mental du collège.',
        'url' => 'https://mathsgo.re/outils/calcul_mental/defi_calcul_modules.html', 'ancre' => null, 'disponible' => true], $applis[1],
        'la tuile : le nom, la phrase, l’adresse de l’appli ; pas de « cles » ni de « motifs »');
    vrai(!str_contains($e['texte'], 'defi-calcul":{'), 'aucun réglage de classe pour Défi calcul : rien dans « reglages »');
    // Décochée pour la classe : la tuile disparaît, le parcours reste.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $classe, 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1]);
    egal(['defi-tables', 'splat'], array_column(identite($code)['json']['applis'], 'cle'), 'décochée : la tuile disparaît de l’espace élève');
    egal(true, lire($code, 'defi-calcul')['json']['existe'], 'et son parcours reste en base');
    // Donnée à un seul élève : lui seul la voit.
    $r = donner((int)$eleves[0]['id'], ['defi-calcul' => new stdClass()], $jetonS1);
    egal(200, $r['code'], 'eleves.acces accepte « defi-calcul » : ' . $r['texte']);
    egal(['defi-tables', 'defi-calcul', 'splat'], array_column(identite($code)['json']['applis'], 'cle'), 'l’élève voit Défi calcul, à sa place du catalogue');
    egal(['defi-tables', 'splat'], array_column(identite($eleves[1]['code'])['json']['applis'], 'cle'), 'sa camarade ne voit rien de plus');
    $r = donner((int)$eleves[0]['id'], ['defi-calcul' => ['modules' => ['A2']]], $jetonS1);
    egal(400, $r['code'], 'Défi calcul n’a pas de réglage à donner par morceaux');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe, 'appli' => 'defi-calcul'], ['jeton' => $jetonS1]);
    egal(200, $t['code'], 'le tableau Défi calcul d’une classe sans Défi calcul');
    egal(2, count($t['json']['eleves']), 'la classe entière y est listée');
});

verifier("defi-calcul — le billet d'entrée s'échange pour « defi-calcul », les deux moteurs sont servis d'ici, « Ma classe » et Mon espace les chargent versionnés", function () use (&$classeCalcul, $racine) {
    $code = $classeCalcul['eleves'][0]['code'];
    $billet = appel('/api/eleve.php', ['code' => $code, 'billet' => true])['json']['billet'];
    $b = echanger($billet, ['appli' => 'defi-calcul']);
    egal(200, $b['code'], 'l’échange : ' . $b['texte']);
    egal('entree', $b['json']['type']);
    egal($code, $b['json']['code'], 'le code revient à l’appli, dans le corps');
    $core = page('/prof/defi_calcul_core.js');
    egal(200, $core['code'], 'prof/defi_calcul_core.js est servi');
    vrai(str_contains($core['texte'], 'MATHSGO_DEFI_CALCUL_CORE'), 'et c’est bien le noyau');
    $moteur = page('/prof/defi_calcul_mon_parcours.js');
    egal(200, $moteur['code'], 'prof/defi_calcul_mon_parcours.js est servi');
    vrai(str_contains($moteur['texte'], 'MATHSGO_DEFI_CALCUL_MON_PARCOURS') && str_contains($moteur['texte'], 'resumeProf'), 'et c’est bien le moteur, avec resumeProf');
    egal((string)file_get_contents($racine . '/../outils/calcul_mental/defi_calcul_core.js'), $core['texte'], 'le noyau servi est la copie exacte de celui de l’appli');
    egal((string)file_get_contents($racine . '/../outils/calcul_mental/defi_calcul_mon_parcours.js'), $moteur['texte'], 'le moteur servi est la copie exacte de celui de l’appli');
    $v = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai((bool)preg_match('#class="etat oui">✓</span>\s*Moteurs Défi calcul servis localement#u', $v['texte']), 'verifier.php a sa ligne « Moteurs Défi calcul servis localement », verte');
    $p = page('/prof/');
    egal(200, $p['code']);
    vrai((bool)preg_match('#const MOTEUR_CALCUL_CORE = "defi_calcul_core\.js\?v=([0-9a-f]{10})";#', $p['texte'], $m1), '« Ma classe » : l’adresse du noyau, relative, avec une version');
    egal(substr(md5($core['texte']), 0, 10), $m1[1], 'la version du noyau est l’empreinte du fichier servi');
    vrai((bool)preg_match('#const MOTEUR_CALCUL = "defi_calcul_mon_parcours\.js\?v=([0-9a-f]{10})";#', $p['texte'], $m2), 'l’adresse du moteur, avec une version');
    egal(substr(md5($moteur['texte']), 0, 10), $m2[1], 'la version du moteur est l’empreinte du fichier servi');
    vrai(!str_contains($p['texte'], '<script src="defi_calcul'), 'pas chargés d’office : seulement à l’ouverture de l’onglet Défi calcul');
    vrai(str_contains($p['texte'], '<button type="button" data-appli="defi-calcul" aria-pressed="false">Défi calcul</button>'), 'l’onglet Défi calcul');
    vrai(str_contains($p['texte'], '<tr id="entete-defi-calcul" hidden>'), 'son en-tête de tableau');
    vrai(str_contains($p['texte'], 'id="dc-reprendre"') && str_contains($p['texte'], 'id="fiche-defi-calcul"') && str_contains($p['texte'], 'id="grille-defi-calcul"'), 'la carte « À reprendre en classe » et les deux feuilles');
    $debut = strpos($p['texte'], "l'onglet Défi calcul\n");
    $fin = strpos($p['texte'], 'feuille imprimée', (int)$debut);
    vrai($debut !== false && $fin !== false && $fin > $debut, 'le script de l’onglet est là');
    vrai(!str_contains(substr($p['texte'], $debut, $fin - $debut), 'innerHTML'), 'rien n’est écrit par innerHTML dans l’onglet Défi calcul');
    $espace = page('/');
    egal(200, $espace['code']);
    vrai((bool)preg_match('#avant: \{url: "prof/defi_calcul_core\.js\?v=([0-9a-f]{10})"#', $espace['texte'], $m3) && $m3[1] === $m1[1], 'Mon espace charge le noyau d’ici, à la même version');
    vrai((bool)preg_match('#url: "prof/defi_calcul_mon_parcours\.js\?v=([0-9a-f]{10})"#', $espace['texte'], $m4) && $m4[1] === $m2[1], 'et le moteur, à la même version');
});

// -------------------------------- serveur pro, lot 5e : la séance en direct pour l'administrateur seul (25/10/2026)
//
// Décision de Gwenaël : la séance en direct est réservée à son compte
// (l'administrateur) tant que lib/direct.php le dit ; les évaluations restent
// ouvertes à tous. Le serveur refuse lui-même (prof/direct.php s'ouvre par son
// adresse) : chaque action direct.*, pour un collègue, sur une classe
// partagée en écriture comme sur la sienne, comme sur une classe qui
// n'existe pas — le même refus, sans rien apprendre d'aucune classe.
//
// Rougit si l'on :
//  a) retire garder_direct_reserve() de l'aiguillage ;
//  b) n'y garde qu'une partie des actions direct.* ;
//  c) laisse la pastille « ● En direct » (classes.liste, tableau) au collègue ;
//  d) fait passer evaluation.* par la garde ;
//  e) oublie « direct » dans la réponse de « moi ».

$l5e = ['admin' => null, 'collegue' => null, 'jetonCollegue' => null, 'partagee' => null, 'sienne' => null];

verifier("lot 5e — mise en place : un collègue, une classe de Gwenaël partagée en écriture, une classe à lui", function () use (&$l5e) {
    vider_compteurs();
    foreach (['phrase-de-secours-2026', 'motdepasse-de-test-2026'] as $essai) {
        $r = connexion('gwenael', $essai);
        if (($r['json']['jeton'] ?? null) !== null) { $l5e['admin'] = $r['json']['jeton']; break; }
    }
    vrai(is_string($l5e['admin']), 'la session de l’administrateur est ouverte');
    $cree = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'lot5e-collegue'], ['jeton' => $l5e['admin']])['json'];
    $l5e['collegue'] = (int)$cree['id'];
    $temporaire = connexion('lot5e-collegue', $cree['motdepasse'])['json']['jeton'];
    egal(200, appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $cree['motdepasse'],
        'nouveau' => 'une phrase pour le lot 5e 2026'], ['jeton' => $temporaire])['code'], 'il choisit son mot de passe');
    $l5e['jetonCollegue'] = connexion('lot5e-collegue', 'une phrase pour le lot 5e 2026')['json']['jeton'];
    $l5e['partagee'] = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot5e-5B'], ['jeton' => $l5e['admin']])['json']['id'];
    appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $l5e['partagee'], 'nombre' => 2], ['jeton' => $l5e['admin']]);
    egal(200, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $l5e['partagee'],
        'prof_id' => $l5e['collegue'], 'droit' => 'ecriture'], ['jeton' => $l5e['admin']])['code'], 'partagée « modifiable »');
    $l5e['sienne'] = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'lot5e-4C'], ['jeton' => $l5e['jetonCollegue']])['json']['id'];
    appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $l5e['sienne'], 'nombre' => 1], ['jeton' => $l5e['jetonCollegue']]);
    vrai(is_int($l5e['partagee']) && is_int($l5e['sienne']), 'les deux classes sont créées');
});

verifier("lot 5e — « moi » dit à la page si ce compte peut mener une séance en direct", function () use (&$l5e) {
    egal(true, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $l5e['admin']])['json']['direct'] ?? 'absent', 'l’administrateur : oui');
    egal(false, appel('/api/prof.php', ['action' => 'moi'], ['jeton' => $l5e['jetonCollegue']])['json']['direct'] ?? 'absent', 'le collègue : non');
});

verifier("lot 5e — le serveur refuse chaque action direct.* au collègue, sur la classe partagée, la sienne, et une classe qui n'existe pas", function () use (&$l5e) {
    $actions = ['direct.etat', 'direct.ouvrir', 'direct.question', 'direct.devoiler', 'direct.bonne', 'direct.fichier', 'direct.terminer'];
    $avantJournal = (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE resultat = 'refus' AND cible_type = 'compte' AND prof_id = " . (int)$l5e['collegue'])->fetchColumn();
    foreach ([['partagée', $l5e['partagee']], ['la sienne', $l5e['sienne']], ['inexistante', 987654]] as [$quelle, $classeId]) {
        foreach ($actions as $action) {
            $r = appel('/api/prof.php', ['action' => $action, 'classe_id' => $classeId, 'type' => 'choix'], ['jeton' => $l5e['jetonCollegue']]);
            egal(403, $r['code'], "« $action » sur la classe $quelle : refusé");
            egal('direct_reserve', $r['json']['raison'] ?? null, "« $action » ($quelle) : la raison, pour que le tableau la dise");
            egal("La séance en direct n’est pas encore ouverte aux collègues.", $r['json']['erreur'] ?? null, "« $action » ($quelle) : la phrase");
        }
    }
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM directs WHERE classe_id IN (' . (int)$l5e['partagee'] . ', ' . (int)$l5e['sienne'] . ')')->fetchColumn(),
        'aucune séance ouverte');
    // Journalisé comme les refus d'administration : les gestes (ouvrir,
    // fichier, terminer) ; l'interrogation en boucle (direct.etat), jamais.
    $apres = (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE resultat = 'refus' AND cible_type = 'compte' AND prof_id = " . (int)$l5e['collegue'])->fetchColumn();
    egal(9, $apres - $avantJournal, 'trois gestes journalisés × trois classes');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'direct.etat'")->fetchColumn(), 'direct.etat n’écrit rien au journal');
});

verifier("lot 5e — l'administrateur mène sa séance ; le collègue en écriture ne voit pas la pastille « ● En direct »", function () use (&$l5e) {
    $modeDans = function (array $liste, int $id) {
        foreach ($liste as $classe) if ((int)$classe['id'] === $id) return array_key_exists('direct', $classe) ? $classe['direct'] : 'absent';
        return 'classe absente';
    };
    egal(200, appel('/api/prof.php', ['action' => 'direct.ouvrir', 'classe_id' => $l5e['partagee']], ['jeton' => $l5e['admin']])['code'], 'l’administrateur ouvre');
    egal(200, appel('/api/prof.php', ['action' => 'direct.question', 'classe_id' => $l5e['partagee'], 'type' => 'choix'], ['jeton' => $l5e['admin']])['code'], 'il pose une question');
    egal(200, appel('/api/prof.php', ['action' => 'direct.etat', 'classe_id' => $l5e['partagee']], ['jeton' => $l5e['admin']])['code'], 'le tableau interroge');
    egal('eclair', $modeDans(appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $l5e['admin']])['json']['classes'], (int)$l5e['partagee']), 'lui voit « ● En direct »');
    egal(null, $modeDans(appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $l5e['jetonCollegue']])['json']['classes'], (int)$l5e['partagee']), 'le collègue, non (menu « 405 ▾ »)');
    $tableau = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $l5e['partagee'], 'appli' => 'defi-tables'], ['jeton' => $l5e['jetonCollegue']])['json'];
    vrai(array_key_exists('direct', $tableau['classe']) && $tableau['classe']['direct'] === null, 'ni « Reprendre » dans la classe');
    egal(403, appel('/api/prof.php', ['action' => 'direct.terminer', 'classe_id' => $l5e['partagee']], ['jeton' => $l5e['jetonCollegue']])['code'], 'il ne peut pas la terminer');
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM directs WHERE classe_id = ' . (int)$l5e['partagee'])->fetchColumn(), 'la séance de Gwenaël est intacte');
    egal(200, appel('/api/prof.php', ['action' => 'direct.terminer', 'classe_id' => $l5e['partagee']], ['jeton' => $l5e['admin']])['code'], 'l’administrateur la termine');
});

verifier("lot 5e — les évaluations restent ouvertes au collègue, sur la classe partagée comme sur la sienne, et leur pastille se voit", function () use (&$l5e) {
    $modele = appel('/api/prof.php', ['action' => 'evaluation.enregistrer_modele', 'id' => null, 'nom' => 'lot 5e',
        'reglage' => ['tables' => [7], 'types' => ['direct'], 'n' => 10, 'chrono' => 'sans', 'tirage' => 'memes']], ['jeton' => $l5e['jetonCollegue']]);
    egal(200, $modele['code'], 'il enregistre un modèle');
    // Une séance de Gwenaël en cours sur la classe partagée : l'évaluation
    // attend, et on ne demande pas au collègue de terminer ce qu'il ne peut pas.
    egal(200, appel('/api/prof.php', ['action' => 'direct.ouvrir', 'classe_id' => $l5e['partagee']], ['jeton' => $l5e['admin']])['code']);
    $r = appel('/api/prof.php', ['action' => 'evaluation.ouvrir', 'classe_id' => $l5e['partagee'], 'modele_id' => $modele['json']['id'], 'duree' => 1800],
        ['jeton' => $l5e['jetonCollegue']]);
    egal(409, $r['code'], 'pas d’évaluation pendant la séance de Gwenaël');
    egal("Une séance en direct est en cours pour cette classe : l'évaluation pourra s'ouvrir quand elle sera terminée.", $r['json']['erreur'] ?? null,
        'la phrase ne lui demande pas de la terminer');
    egal(200, appel('/api/prof.php', ['action' => 'direct.terminer', 'classe_id' => $l5e['partagee']], ['jeton' => $l5e['admin']])['code']);
    foreach ([['partagée', $l5e['partagee']], ['la sienne', $l5e['sienne']]] as [$quelle, $classeId]) {
        $corps = ['classe_id' => $classeId];
        egal(200, appel('/api/prof.php', ['action' => 'evaluation.ouvrir', 'modele_id' => $modele['json']['id'], 'duree' => 1800] + $corps,
            ['jeton' => $l5e['jetonCollegue']])['code'], "il ouvre une évaluation ($quelle)");
        $liste = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $l5e['jetonCollegue']])['json']['classes'];
        $mode = 'classe absente';
        foreach ($liste as $classe) if ((int)$classe['id'] === $classeId) $mode = $classe['direct'] ?? null;
        egal('evaluation', $mode, "la pastille « 📝 Évaluation » ($quelle)");
        egal(200, appel('/api/prof.php', ['action' => 'evaluation.etat'] + $corps, ['jeton' => $l5e['jetonCollegue']])['code'], "il la suit ($quelle)");
        egal(200, appel('/api/prof.php', ['action' => 'evaluation.fermer'] + $corps, ['jeton' => $l5e['jetonCollegue']])['code'], "il la ferme ($quelle)");
        egal(200, appel('/api/prof.php', ['action' => 'evaluation.fichier'] + $corps, ['jeton' => $l5e['jetonCollegue']])['code'], "il prend le fichier ($quelle)");
        egal(200, appel('/api/prof.php', ['action' => 'evaluation.terminer'] + $corps, ['jeton' => $l5e['jetonCollegue']])['code'], "il la termine ($quelle)");
    }
});

verifier("lot 5e — les pages : « Séance en direct » suit « moi », le tableau dit la phrase", function () {
    $prof = page('/prof/');
    vrai(str_contains($prof['texte'], 'directPermis = donnees.direct === true;'), 'Ma classe lit « direct » dans « moi »');
    vrai(str_contains($prof['texte'], '$("seance-direct").hidden = !ecriture || !directPermis;'), 'et cache le bouton');
    $tableau = page('/prof/direct.php');
    vrai(str_contains($tableau['texte'], 'erreur.raison === "direct_reserve"'), 'le tableau reconnaît le refus');
    vrai(str_contains($tableau['texte'], 'scene.append(titre("Séance en direct"), ligne("sous", reserve));'), 'et le dit dans la page');
});

verifier("lot 5e — rangement : le collègue et ses classes partent", function () use (&$l5e) {
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $l5e['partagee']], ['jeton' => $l5e['admin']])['code']);
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $l5e['sienne']], ['jeton' => $l5e['jetonCollegue']])['code']);
    egal(200, appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => $l5e['collegue']], ['jeton' => $l5e['admin']])['code']);
    vider_compteurs();
});

// ------------------------------------------- correctifs de l'audit Codex (29/10/2026)
//
// Les quatre défauts de l'audit du 22/10/2026 (dossier audit-serveur-octobre,
// AUDIT-CODEX-serveur-2026-10-22.md), chacun avec le test qui ROUGISSAIT sur
// le main 7470a59 :
//  1. migrer.php (et installer.php) sans frein, et un frein par page ;
//  2. un record fabriqué en une requête ;
//  3. supprimer un compte laissait les records de ses élèves ;
//  4. l'historique de plus de sept jours restait lisible et restaurable.

verifier("audit Codex 1 — le mot de passe d'installation a UN frein, partagé : dix échecs sur migrer.php ferment aussi secours.php et sauvegarde.php", function () use (&$travail) {
    vider_compteurs();
    // Preuve de Codex rejouée : 100 essais sur migrer.php répondaient 100
    // fois « incorrect ». Dix échecs maintenant, puis « Trop d'essais ».
    for ($i = 0; $i < 10; $i++) {
        $r = formulaire('/migrer.php', ['jeton' => 'MAUVAIS-' . $i]);
        egal(200, $r['code']);
        vrai(str_contains($r['texte'], 'incorrect'), "migrer.php, essai " . ($i + 1) . " : refus ordinaire");
    }
    $r = formulaire('/migrer.php', ['jeton' => 'MAUVAIS-10']);
    vrai(str_contains($r['texte'], 'essais depuis cette adresse'), 'migrer.php : le onzième essai est freiné');
    vrai(!str_contains($r['texte'], 'incorrect'), 'et le mot de passe n’est même plus comparé');
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'essais depuis cette adresse'), 'le BON mot de passe ne passe plus pendant la fenêtre');
    vrai(!str_contains($r['texte'], 'rien à changer') && !str_contains($r['texte'], "C'est fait"), 'et rien n’est migré');
    // Le compteur est unique : une seule ligne dans « compteurs », à la clé partagée.
    // Dix échecs, puis deux essais refusés sans comparaison — qui restent
    // comptés (relecture Codex R2 : l'essai est réservé avant d'être comparé).
    egal(12, (int)bd_test()->query('SELECT COALESCE(MAX(nombre), 0) FROM compteurs')->fetchColumn(), 'dix échecs et deux refus comptés sur une seule clé');
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM compteurs')->fetchColumn(), 'une seule ligne de compteur');
    // Le MÊME compteur ferme les autres pages du même secret : secours,
    // sauvegarde, verifier — et installer.php (déjà installé ici : sa page
    // se verrouille avant le mot de passe, on le vérifie à part plus bas).
    foreach (['secours.php', 'sauvegarde.php', 'verifier.php'] as $page) {
        copy(dirname(__DIR__) . '/public/' . $page, $travail . '/' . $page);
        $r = formulaire('/' . $page, ['jeton' => 'JETON-DE-TEST']);
        vrai(str_contains($r['texte'], 'essais depuis cette adresse'), "$page est fermée par les échecs de migrer.php");
    }
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM compteurs')->fetchColumn(), 'toujours une seule ligne de compteur');
    // Dans l'autre sens : cinq échecs sur secours.php et cinq sur sauvegarde.php, et migrer.php est fermée.
    vider_compteurs();
    for ($i = 0; $i < 5; $i++) formulaire('/secours.php', ['jeton' => 'faux-' . $i]);
    for ($i = 0; $i < 5; $i++) formulaire('/sauvegarde.php', ['jeton' => 'faux-' . $i]);
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'essais depuis cette adresse'), 'cinq et cinq font dix : migrer.php est fermée');
    // Les RÉUSSITES ne comptent pas : vingt migrations de suite avec le bon
    // mot de passe (le jour d'un dépôt) ne ferment rien.
    vider_compteurs();
    for ($i = 0; $i < 20; $i++) {
        $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
        vrai(str_contains($r['texte'], 'rien à changer') || str_contains($r['texte'], "C'est fait") || str_contains($r['texte'], 'C&#039;est fait'), "migration n°" . ($i + 1) . " : passe");
    }
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM compteurs')->fetchColumn(), 'aucun compteur pour des réussites');
    // installer.php : même frein, même clé. La page de test est déjà
    // installée (elle se verrouille avant le mot de passe) : on vérifie que
    // son code passe par le même contrôle, et le comportement réel plus bas
    // sur une base neuve.
    $installer = (string)file_get_contents(dirname(__DIR__) . '/public/installer.php');
    vrai(str_contains($installer, "verdict_jeton_installation((string)(\$_POST['jeton'] ?? ''))"), 'installer.php passe par le frein partagé');
    $migrer = (string)file_get_contents(dirname(__DIR__) . '/public/migrer.php');
    vrai(str_contains($migrer, "verdict_jeton_installation((string)(\$_POST['jeton'] ?? ''))"), 'migrer.php aussi');
    vrai(!str_contains($migrer, 'hash_equals('), 'migrer.php ne compare plus lui-même');
    foreach (['secours.php', 'sauvegarde.php', 'verifier.php'] as $page) @unlink($travail . '/' . $page);
    vider_compteurs();
});

verifier("audit Codex 1 — installer.php sur une base neuve : dix mauvais mots de passe, puis freiné, et le compte n'est pas créé", function () use (&$travail) {
    // Une seconde copie du serveur sur une base SQLite vide, le temps du test :
    // c'est la seule façon de voir installer.php AVANT le premier compte.
    $neuf = $travail . '-neuf';
    copier_dossier(dirname(__DIR__) . '/public', $neuf);
    $base = $neuf . '/neuf.sqlite';
    file_put_contents($neuf . '/config.php', "<?php return " . var_export([
        'bd' => ['dsn' => 'sqlite:' . $base],
        'origines' => ['https://mathsgo.re'],
        'jeton_installation' => 'JETON-NEUF',
    ], true) . ";\n");
    $port = 9000 + random_int(0, 900);
    $serveur = proc_open(sprintf('php -S 127.0.0.1:%d -t %s', $port, escapeshellarg($neuf)),
        [1 => ['file', PHP_OS_FAMILY === 'Windows' ? 'NUL' : '/dev/null', 'w'], 2 => ['file', $neuf . '/serveur.log', 'w']], $tuyaux);
    for ($i = 0; $i < 60; $i++) {
        $fp = @fsockopen('127.0.0.1', $port, $e, $s, 0.2);
        if ($fp) { fclose($fp); break; }
        usleep(150000);
    }
    try {
        $poster = function (array $champs) use ($port): string {
            $ch = curl_init("http://127.0.0.1:$port/installer.php");
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($champs), CURLOPT_TIMEOUT => 10]);
            $texte = (string)curl_exec($ch);
            curl_close($ch);
            return $texte;
        };
        for ($i = 0; $i < 10; $i++) {
            vrai(str_contains($poster(['jeton' => 'faux-' . $i, 'identifiant' => 'pirate', 'motdepasse' => 'motdepasse-pirate-2026']), 'incorrect'), "installer.php, essai " . ($i + 1) . " : refus ordinaire");
        }
        $texte = $poster(['jeton' => 'JETON-NEUF', 'identifiant' => 'pirate', 'motdepasse' => 'motdepasse-pirate-2026']);
        vrai(str_contains($texte, 'essais depuis cette adresse'), 'le onzième essai est freiné, même avec le bon mot de passe');
        $neuve = new PDO('sqlite:' . $base);
        egal(0, (int)$neuve->query('SELECT COUNT(*) FROM profs')->fetchColumn(), 'aucun compte créé');
        $neuve->exec('DELETE FROM compteurs');
        vrai(str_contains($poster(['jeton' => 'JETON-NEUF', 'identifiant' => 'gwenael', 'motdepasse' => 'motdepasse-de-test-2026']), 'Compte créé'), 'fenêtre rouverte : le bon mot de passe installe');
        $neuve = null;
    } finally {
        arreter_serveur($serveur);
        effacer_dossier($neuf);
    }
});

verifier("audit Codex 2 — un record ne se fabrique plus en une requête : il faut un ticket de départ, et un temps au moins égal à ce que le serveur a mesuré", function () use (&$jetonS1) {
    vider_compteurs();
    // Un pirate avec son code : il écrit la couronne dans sa progression
    // (choix assumé), puis annonce 25 justes en 16 secondes (10 s dans la preuve de
    // Codex, « record_etape_2_sans_course » ; sous le plancher de 15 s depuis
    // le 11/11, elles seraient refusées avant même le ticket).
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => '3A', 'applis' => ['defi-tables']], ['jeton' => $jetonS1])['json']['id'];
    $pirate = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $code = $pirate['code'];
    $couronne = ['version' => VERSION_TABLES, 'expert' => ['etoiles' => 5, 'dernier' => '2026-10-22', 'couronne' => '2026-10-22']];
    egal(200, appel('/api/parcours.php', ['code' => $code, 'appli' => 'defi-tables', 'base_revision' => 0, 'parcours' => $couronne])['code'], 'la couronne forgée entre (assumé)');
    egal(true, records_api($code, ['lire' => true])['json']['legende'], 'il est Légende aux yeux du serveur (assumé)');
    // Sans ticket : refusé.
    $r = records_api($code, ['temps' => 160, 'justes' => 25]);
    egal(400, $r['code'], 'sans ticket : refusé net');
    egal("Le temps ne compte pas : la course n'a pas de ticket de départ.", $r['json']['erreur'] ?? null);
    foreach (['', 'pas-un-ticket', str_repeat('0', 32), 42, null, ['a']] as $faux) {
        egal(400, records_api($code, ['temps' => 160, 'justes' => 25, 'course' => $faux])['code'], 'ticket illisible ou inconnu : ' . json_encode($faux));
    }
    egal(null, bd_test()->query("SELECT meilleur FROM records WHERE eleve_id = " . (int)$pirate['id'])->fetchColumn() ?: null, 'rien n’est écrit');
    // Avec un ticket tout frais : 16 s annoncées, 0 s écoulée → refusé, et le ticket est brûlé.
    $ticket = ticket_de_course($code);
    $r = records_api($code, ['temps' => 160, 'justes' => 25, 'course' => $ticket]);
    egal(400, $r['code'], '16 s annoncées une seconde après le départ : refusé');
    egal('Le temps ne compte pas.', $r['json']['erreur'] ?? null);
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE type = 'course' AND eleve_id = " . (int)$pirate['id'])->fetchColumn(), 'le ticket menteur est brûlé');
    egal(400, records_api($code, ['temps' => 160, 'justes' => 25, 'course' => $ticket])['code'], 'et ne sert plus');
    // Le ticket d'un AUTRE élève ne vaut rien.
    $autre = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $ticketAutre = ticket_de_course($autre['code'], 60);
    $r = records_api($code, ['temps' => 160, 'justes' => 25, 'course' => $ticketAutre]);
    egal(400, $r['code'], 'le ticket d’un autre élève : refusé');
    egal("Le temps ne compte pas : la course n'a pas de ticket de départ.", $r['json']['erreur'] ?? null, 'refusé dès la lecture, pas seulement à la consommation');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE type = 'course' AND eleve_id = " . (int)$autre['id'])->fetchColumn(), 'et il reste à son propriétaire');
    // Un billet d'ENTRÉE n'est pas un ticket de course, et un ticket de course
    // n'entre pas par api/eleve.php.
    $billetEntree = appel('/api/eleve.php', ['code' => $code, 'billet' => true])['json']['billet'] ?? null;
    vrai(is_string($billetEntree), 'un billet d’entrée pour le test');
    egal(400, records_api($code, ['temps' => 160, 'justes' => 25, 'course' => $billetEntree])['code'], 'un billet d’entrée ne date aucune course');
    $ticketEleve = ticket_de_course($code);
    egal(404, appel('/api/eleve.php', ['billet' => $ticketEleve])['code'], 'un ticket de course n’ouvre pas la porte d’entrée');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE hash = '" . hash('sha256', $ticketEleve) . "'")->fetchColumn(), 'et il n’a pas été consommé par cet essai');
    // La vraie course : le départ est vieilli dans la base du temps qu'elle
    // aurait duré. 49 s mesurées → 51,0 s annoncées passent (490 + 20
    // dixièmes) ; 55,0 s non.
    // La scène de l'audit GPT du 09/11 (F04, preuves\05-record-local.py) : un
    // ticket pris, dix VRAIES secondes d'attente, puis « 25 justes en 10 s »
    // sans avoir joué. Acceptée jusqu'au 11/11 ; refusée depuis par le
    // plancher de 15 s (0,6 s par calcul), même avec un ticket honnête.
    $ticketGpt = ticket_de_course($code);
    vieillir_ticket($ticketGpt, 11);
    $r = records_api($code, ['temps' => 100, 'justes' => 25, 'course' => $ticketGpt]);
    egal(400, $r['code'], '25 justes en 10 s, ticket de dix secondes : refusé (plancher)');
    egal('Le temps ne compte pas.', $r['json']['erreur'] ?? null);
    egal(null, bd_test()->query("SELECT meilleur FROM records WHERE eleve_id = " . (int)$pirate['id'])->fetchColumn() ?: null, 'aucun record écrit');
    // Lot « toujours toi » (11/11/2026) : le serveur compte en SECONDES
    // ENTIÈRES (time()). Chaque seconde d'horloge franchie entre la prise du
    // ticket et l'envoi s'ajoute au temps mesuré : avec 51,1 s annoncées, une
    // seule suffisait à faire passer la course (vu sur la CI « serveur
    // (MySQL) », plus lente, à la fusion de #1166). Le ticket est donc pris
    // JUSTE AVANT, et 55,0 s laissent quatre secondes de jeu. La limite au
    // dixième près (51,0 oui, 51,1 non) est tenue par le test suivant
    // (temps_plausible_depuis, horloge fixée) ; le serveur ne change pas.
    $ticketRefuse = ticket_de_course($code, 49);
    $r = records_api($code, ['temps' => 550, 'justes' => 25, 'course' => $ticketRefuse]);
    egal(400, $r['code'], '55,0 s annoncées pour 49 s mesurées : au-delà de la marge de 2 s, refusé');
    egal('Le temps ne compte pas.', $r['json']['erreur'] ?? null);
    $ticketEleve = ticket_de_course($code, 49);
    $r = records_api($code, ['temps' => 510, 'justes' => 25, 'course' => $ticketEleve]);
    egal(200, $r['code'], '51,0 s pour 49 s mesurées : dans la marge, accepté');
    egal(true, $r['json']['nouveau'], 'premier record');
    egal(510, (int)bd_test()->query("SELECT meilleur FROM records WHERE eleve_id = " . (int)$pirate['id'])->fetchColumn());
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE hash = '" . hash('sha256', $ticketEleve) . "'")->fetchColumn(), 'le ticket est consommé par la course');
    egal(400, records_api($code, ['temps' => 510, 'justes' => 25, 'course' => $ticketEleve])['code'], 'rejouer la même course avec le même ticket : refusé');
    // Une course finie hors ligne, envoyée bien plus tard : le serveur a
    // mesuré plus que le temps annoncé, elle passe (D8, le jour en plus).
    $tard = ticket_de_course($code, 3 * 86400);
    egal(200, records_api($code, ['temps' => 480, 'justes' => 25, 'course' => $tard, 'jour' => gmdate('Y-m-d', time() - 3 * 86400)])['code'], 'envoyée trois jours après : acceptée');
    // Un ticket de plus de huit jours est périmé.
    $perime = ticket_de_course($code, 8 * 86400 + 60);
    egal(400, records_api($code, ['temps' => 480, 'justes' => 25, 'course' => $perime])['code'], 'ticket périmé : refusé');
    // Au plus quatre tickets par élève : un robot qui en demande cent n'en laisse que quatre.
    for ($i = 0; $i < 6; $i++) ticket_de_course($code);
    egal(4, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE type = 'course' AND eleve_id = " . (int)$pirate['id'])->fetchColumn(), 'quatre tickets au plus par élève');
    // Les tickets partent avec l'élève.
    egal(200, appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $pirate['id']], ['jeton' => $jetonS1])['code']);
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE eleve_id = " . (int)$pirate['id'])->fetchColumn(), 'ses tickets aussi');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("audit Codex 2 — la marge : temps_plausible_depuis, seule", function () {
    require_once __DIR__ . '/../public/lib/records.php';
    // 49 s mesurées : jusqu'à 51,0 s annoncées (490 + 20 dixièmes), pas plus.
    egal(true, temps_plausible_depuis(1000, 510, 1049));
    egal(false, temps_plausible_depuis(1000, 511, 1049));
    egal(true, temps_plausible_depuis(1000, 100, 1008), '10 s annoncées, 8 s mesurées : la marge');
    egal(false, temps_plausible_depuis(1000, 100, 1007), '10 s annoncées, 7 s mesurées : non');
    egal(true, temps_plausible_depuis(1000, 100, 1000 + 3 * 86400), 'envoyée trois jours après : le serveur a mesuré plus, ça passe');
    egal(20, MARGE_COURSE_DIXIEMES, 'deux secondes : une de rondeur, une de réseau');
});

verifier("audit Codex 3 — supprimer un compte avec ses classes emporte les records de ses élèves ; migrer.php et menage.php purgent les orphelins d'avant", function () use (&$jetonS1, &$travail) {
    vider_compteurs();
    // Preuve de Codex rejouée (« suppression_prof_record_orphelin ») : un
    // professeur, une classe, un élève Légende avec un record, puis
    // profs.supprimer avec avec_classes → le record restait.
    $r = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'partant-codex'], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'création du collègue (' . $r['texte'] . ')');
    $collegue = $r['json'];
    $jetonPartant = connexion('partant-codex', $collegue['motdepasse'])['json']['jeton'];
    appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $collegue['motdepasse'], 'nouveau' => 'le-mdp-du-collegue-codex-2026'], ['jeton' => $jetonPartant]);
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => '5B', 'applis' => ['defi-tables']], ['jeton' => $jetonPartant])['json']['id'];
    vrai(is_int($classe), 'le collègue a sa classe');
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonPartant])['json']['eleves'][0];
    $couronne = ['version' => VERSION_TABLES, 'expert' => ['etoiles' => 5, 'dernier' => '2026-10-22', 'couronne' => '2026-10-22']];
    egal(200, appel('/api/parcours.php', ['code' => $eleve['code'], 'appli' => 'defi-tables', 'base_revision' => 0, 'parcours' => $couronne])['code']);
    // Le record est planté directement (comme la preuve de Codex le fabriquait) :
    // ce test ne dépend ainsi que de la suppression, pas du ticket de course.
    bd_test()->prepare('INSERT INTO records (eleve_id, meilleur, meilleur_le, semaine, semaine_lundi, nom, maj_le) VALUES (?, ?, ?, ?, ?, NULL, ?)')
        ->execute([(int)$eleve['id'], 500, '2026-10-22T10:00:00.000000Z', 500, '2026-10-19', '2026-10-22T10:00:00Z']);
    egal([[ (int)$eleve['id'], 500 ]], array_map(fn($l) => [(int)$l[0], (int)$l[1]], bd_test()->query("SELECT eleve_id, meilleur FROM records WHERE eleve_id = " . (int)$eleve['id'])->fetchAll(PDO::FETCH_NUM)), 'avant : le record est là');
    $r = appel('/api/prof.php', ['action' => 'profs.supprimer', 'prof_id' => $collegue['id'], 'avec_classes' => true], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'le compte est supprimé avec ses classes');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM eleves WHERE id = " . (int)$eleve['id'])->fetchColumn(), 'l’élève est parti');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM records WHERE eleve_id = " . (int)$eleve['id'])->fetchColumn(), 'SON RECORD AUSSI (défaut 4 de Codex)');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE eleve_id = " . (int)$eleve['id'])->fetchColumn(), 'et ses tickets');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM versions WHERE eleve_id = " . (int)$eleve['id'])->fetchColumn(), 'et son historique');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM records r LEFT JOIN eleves e ON e.id = r.eleve_id WHERE e.id IS NULL')->fetchColumn(), 'aucune ligne orpheline');
    // UN SEUL chemin : supprimer_prof passe par le corps de supprimer_classe.
    $auth = (string)file_get_contents(dirname(__DIR__) . '/public/lib/auth.php');
    vrai(str_contains($auth, 'effacer_classe_dans_la_transaction($pdo, (int)$classe[\'id\']);'), 'supprimer_prof appelle le chemin unique');
    vrai(!str_contains($auth, "DELETE FROM eleves WHERE classe_id"), 'et n’efface plus les élèves lui-même');
    vrai(!str_contains($auth, "DELETE FROM progressions"), 'ni les progressions');
    // Le passé : un record orphelin planté à la main (comme ceux que
    // l'ancienne suppression laissait) part avec migrer.php, et menage.php
    // repasse derrière.
    bd_test()->prepare('INSERT INTO records (eleve_id, meilleur, meilleur_le, semaine, semaine_lundi, nom, maj_le) VALUES (?, ?, ?, ?, ?, NULL, ?)')
        ->execute([987654, 500, '2026-10-22T10:00:00.000000Z', 500, '2026-10-19', '2026-10-22T10:00:00Z']);
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM records WHERE eleve_id = 987654')->fetchColumn(), 'l’orphelin est planté');
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], '1 record(s) sans élève effacé(s)'), 'migrer.php le dit — ' . substr(strip_tags($r['texte']), 0, 300));
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM records WHERE eleve_id = 987654')->fetchColumn(), 'et l’a effacé');
    bd_test()->prepare('INSERT INTO records (eleve_id, meilleur, meilleur_le, semaine, semaine_lundi, nom, maj_le) VALUES (?, ?, ?, ?, ?, NULL, ?)')
        ->execute([987655, 500, '2026-10-22T10:00:00.000000Z', 500, '2026-10-19', '2026-10-22T10:00:00Z']);
    $sortie = (string)shell_exec('php ' . escapeshellarg($travail . '/menage.php') . ' 2>&1');
    vrai(str_contains($sortie, '1 record(s) sans élève effacé(s)'), 'menage.php le dit — ' . $sortie);
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM records WHERE eleve_id = 987655')->fetchColumn(), 'et l’a effacé');
    vider_compteurs();
});

verifier("audit Codex 4 — l'historique de plus de sept jours est purgé pour tous (à chaque écriture et par menage.php), et ni listé ni restaurable entre deux purges", function () use (&$jetonS1, &$travail) {
    vider_compteurs();
    // Preuve de Codex rejouée (« historique_ancien_conserve ») : un élève
    // écrit, cesse d'écrire ; sa version est vieillie au 2026-09-01 ; un
    // AUTRE élève écrit, menage.php tourne → la vieille version restait, et
    // eleves.restaurer la rendait.
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => '4C', 'applis' => ['defi-tables']], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    [$dormeur, $actif] = $eleves;
    $progression = ['version' => VERSION_TABLES, 'expert' => ['etoiles' => 1, 'dernier' => null, 'couronne' => null]];
    egal(200, appel('/api/parcours.php', ['code' => $dormeur['code'], 'appli' => 'defi-tables', 'base_revision' => 0, 'parcours' => $progression])['code']);
    $vieux = '2026-09-01';
    // revision 0 : la ligne ne porte pas la révision du moment, sinon le
    // tableau l'écarterait comme « courante » et ce test ne verrait rien.
    bd_test()->prepare('UPDATE versions SET jour = ?, revision = 0 WHERE eleve_id = ?')->execute([$vieux, (int)$dormeur['id']]);
    // Entre deux purges, la vieille ligne n'est ni listée ni restaurable.
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM versions WHERE eleve_id = " . (int)$dormeur['id'])->fetchColumn(), 'la vieille version est en base (fixture)');
    $tableau = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $classe, 'appli' => 'defi-tables'], ['jeton' => $jetonS1]);
    egal(200, $tableau['code']);
    $journees = null;
    foreach ($tableau['json']['eleves'] ?? [] as $ligne) if ((int)$ligne['id'] === (int)$dormeur['id']) $journees = $ligne['journees'] ?? null;
    vrai(is_array($journees), 'le dormeur est dans le tableau, avec sa liste de journées');
    egal([], $journees, 'le menu « Revenir à… » ne propose pas un jour de plus de sept jours');
    $r = appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $dormeur['id'], 'appli' => 'defi-tables', 'jour' => $vieux], ['jeton' => $jetonS1]);
    egal(404, $r['code'], 'restaurer un jour de plus de sept jours : « plus dans l’historique », même si la ligne traîne encore');
    // Un AUTRE élève écrit : la purge est globale, la vieille ligne du dormeur part.
    egal(200, appel('/api/parcours.php', ['code' => $actif['code'], 'appli' => 'defi-tables', 'base_revision' => 0, 'parcours' => $progression])['code']);
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM versions WHERE eleve_id = " . (int)$dormeur['id'])->fetchColumn(), 'l’écriture d’un autre élève a purgé la version de plus de sept jours du dormeur');
    egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM versions WHERE eleve_id = " . (int)$actif['id'])->fetchColumn(), 'la version du jour de l’actif, elle, est là');
    // Exactement sept jours : J-6 reste, J-7 part.
    $j6 = gmdate('Y-m-d', strtotime(jour_local() . ' 12:00:00 UTC') - 6 * 86400);
    $j7 = gmdate('Y-m-d', strtotime(jour_local() . ' 12:00:00 UTC') - 7 * 86400);
    bd_test()->prepare('INSERT INTO versions (eleve_id, appli, jour, revision, calculs, donnees, maj_le) VALUES (?, ?, ?, 1, 0, ?, ?)')
        ->execute([(int)$dormeur['id'], 'defi-tables', $j6, '{"version":3}', '2026-10-22T10:00:00Z']);
    bd_test()->prepare('INSERT INTO versions (eleve_id, appli, jour, revision, calculs, donnees, maj_le) VALUES (?, ?, ?, 1, 0, ?, ?)')
        ->execute([(int)$dormeur['id'], 'defi-tables', $j7, '{"version":3}', '2026-10-22T10:00:00Z']);
    // menage.php purge aussi, et le dit.
    $sortie = (string)shell_exec('php ' . escapeshellarg($travail . '/menage.php') . ' 2>&1');
    vrai(str_contains($sortie, 'historique : 1 version(s) de plus de sept jours effacée(s)'), 'menage.php purge et le dit — ' . $sortie);
    egal([$j6], array_map(fn($l) => (string)$l[0], bd_test()->query("SELECT jour FROM versions WHERE eleve_id = " . (int)$dormeur['id'])->fetchAll(PDO::FETCH_NUM)), 'J-6 reste, J-7 est parti');
    egal(200, appel('/api/prof.php', ['action' => 'eleves.restaurer', 'eleve_id' => $dormeur['id'], 'appli' => 'defi-tables', 'jour' => $j6], ['jeton' => $jetonS1])['code'], 'J-6 se restaure encore');
    // L'index par jour existe (SQLite : par le schéma ; MySQL : par migrer.php).
    if (bd_test()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') {
        vrai(count(bd_test()->query("SHOW INDEX FROM versions WHERE Key_name = 'versions_jour'")->fetchAll()) >= 1, 'l’index versions_jour est là (MySQL)');
    } else {
        egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = 'versions_jour'")->fetchColumn(), 'l’index versions_jour est là (SQLite)');
    }
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("audit Codex 4 — migrer.php ajoute l'index versions_jour à une base MySQL d'avant (sur SQLite, il est dans le schéma)", function () use (&$travail) {
    // Une base SQLite d'avant le lot, sans l'index : migrer_schema ne le
    // crée que par installer_tables (IF NOT EXISTS) — on vérifie qu'il arrive.
    $vieux = new PDO('sqlite::memory:');
    $vieux->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    require_once dirname(__DIR__) . '/public/lib/bd.php';
    installer_tables($vieux);
    $vieux->exec('DROP INDEX versions_jour');
    egal(0, (int)$vieux->query("SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = 'versions_jour'")->fetchColumn());
    migrer_schema($vieux);
    egal(1, (int)$vieux->query("SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = 'versions_jour'")->fetchColumn(), 'revenu');
    $bd = (string)file_get_contents(dirname(__DIR__) . '/public/lib/bd.php');
    vrai(str_contains($bd, "KEY versions_jour (jour)"), 'MySQL : dans le CREATE TABLE');
    vrai(str_contains($bd, "ALTER TABLE versions ADD INDEX versions_jour (jour)"), 'MySQL : et par migrer.php sur une base d’avant');
});

// ------------------------- relecture Codex du 29/10/2026 (R1 à R5), correctif unique

verifier("relecture Codex R2 — douze essais lancés ENSEMBLE au neuvième échec : un seul est comparé, les autres sont refusés sans comparaison", function () use (&$travail) {
    vider_compteurs();
    for ($i = 0; $i < 9; $i++) formulaire('/migrer.php', ['jeton' => 'faux-' . $i]);
    $textes = formulaires_paralleles('/migrer.php', ['jeton' => 'faux-ensemble'], 12);
    $incorrects = count(array_filter($textes, fn(string $t): bool => str_contains($t, 'incorrect')));
    $freines = count(array_filter($textes, fn(string $t): bool => str_contains($t, 'essais depuis cette adresse')));
    // Au plus UN essai comparé (le dixième) ; sur MySQL, compter() relit le
    // compteur après l'UPSERT et peut voir un voisin déjà passé : il refuse
    // alors aussi le dixième — plus sévère, jamais plus large.
    vrai($incorrects <= 1, 'au plus un essai comparé — ' . $incorrects . ' « incorrect » sur 12');
    vrai($freines >= 11 && $incorrects + $freines === 12, 'les autres refusés sans comparaison');
    egal(21, (int)bd_test()->query('SELECT COALESCE(MAX(nombre), 0) FROM compteurs')->fetchColumn(), 'les douze réservations sont comptées');
    // Un essai juste rend sa réservation : cinq échecs, un bon mot de passe → le compteur reste à cinq.
    vider_compteurs();
    for ($i = 0; $i < 5; $i++) formulaire('/migrer.php', ['jeton' => 'faux-' . $i]);
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'rien à changer') || str_contains($r['texte'], 'C&#039;est fait'), 'le bon mot de passe passe');
    egal(5, (int)bd_test()->query('SELECT COALESCE(MAX(nombre), 0) FROM compteurs')->fetchColumn(), 'la réussite a rendu son essai');
    vider_compteurs();
});

verifier("relecture Codex R1 — base injoignable : verifier.php s'ouvre encore, mais freine sur un fichier à côté de config.php (dix échecs, puis refus)", function () use (&$travail) {
    $panne = $travail . '-panne';
    copier_dossier(dirname(__DIR__) . '/public', $panne);
    file_put_contents($panne . '/config.php', "<?php return " . var_export([
        'bd' => ['dsn' => 'sqlite:' . $panne . '/dossier-absent/base.sqlite'],
        'origines' => ['https://mathsgo.re'],
        'jeton_installation' => 'JETON-PANNE',
    ], true) . ";\n");
    $port = 9000 + random_int(0, 900);
    $serveur = proc_open(sprintf('php -S 127.0.0.1:%d -t %s', $port, escapeshellarg($panne)),
        [1 => ['file', PHP_OS_FAMILY === 'Windows' ? 'NUL' : '/dev/null', 'w'], 2 => ['file', $panne . '/serveur.log', 'w']], $tuyaux);
    for ($i = 0; $i < 60; $i++) {
        $fp = @fsockopen('127.0.0.1', $port, $e, $s, 0.2);
        if ($fp) { fclose($fp); break; }
        usleep(150000);
    }
    try {
        $poster = function (string $page, array $champs) use ($port): string {
            $ch = curl_init("http://127.0.0.1:$port/$page");
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($champs), CURLOPT_TIMEOUT => 10]);
            $texte = (string)curl_exec($ch);
            curl_close($ch);
            return $texte;
        };
        for ($i = 0; $i < 10; $i++) {
            vrai(str_contains($poster('verifier.php', ['jeton' => 'faux-' . $i]), 'incorrect'), "base en panne, essai " . ($i + 1) . " : refus ordinaire");
        }
        vrai(is_file($panne . '/config-frein.json'), 'le compteur de repli existe, à côté de config.php');
        $texte = $poster('verifier.php', ['jeton' => 'JETON-PANNE']);
        vrai(str_contains($texte, 'essais depuis cette adresse'), 'le onzième essai est freiné, même avec le bon mot de passe');
        vrai(!str_contains($texte, 'PHP fonctionne'), 'et le diagnostic ne sort pas');
        // migrer.php, secours.php et sauvegarde.php ouvrent la base AVANT de
        // regarder le mot de passe : base en panne, elles répondent « La base
        // n'a pas répondu » sans rien comparer — pas d'oracle là non plus.
        copy(dirname(__DIR__) . '/public/secours.php', $panne . '/secours.php');
        foreach (['migrer.php', 'secours.php'] as $page) {
            $texte = $poster($page, ['jeton' => 'JETON-PANNE']);
            vrai(!str_contains($texte, 'incorrect') && !str_contains($texte, 'rien à changer') && !str_contains($texte, 'remplac'), "$page ne compare rien base en panne");
        }
        // Fenêtre rouverte (fichier vidé) : le bon mot de passe ouvre le diagnostic, base en panne ou pas.
        unlink($panne . '/config-frein.json');
        $texte = $poster('verifier.php', ['jeton' => 'JETON-PANNE']);
        vrai(str_contains($texte, 'PHP fonctionne'), 'le diagnostic s’ouvre avec le bon mot de passe');
        vrai(str_contains($texte, 'base de donn'), 'et dit que la base ne répond pas');
        vrai(!is_file($panne . '/config-frein.json') || !str_contains((string)file_get_contents($panne . '/config-frein.json'), '"nombre":1'), 'une réussite ne compte pas');
    } finally {
        arreter_serveur($serveur);
        effacer_dossier($panne);
    }
});

verifier("relecture Codex R3 — une écriture qui échoue rend le ticket : la course se renvoie avec le même ticket quand la base revient", function () use (&$jetonS1) {
    vider_compteurs();
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => '3R', 'applis' => ['defi-tables']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $couronne = ['version' => VERSION_TABLES, 'expert' => ['etoiles' => 5, 'dernier' => '2026-10-22', 'couronne' => '2026-10-22']];
    egal(200, appel('/api/parcours.php', ['code' => $eleve['code'], 'appli' => 'defi-tables', 'base_revision' => 0, 'parcours' => $couronne])['code']);
    $ticket = ticket_de_course($eleve['code'], 60);
    // Une panne d'écriture de fixture : l'insertion du record est interdite.
    //  - SQLite : un déclencheur qui refuse l'INSERT ;
    //  - MySQL : pas de déclencheur (interdit sans SUPER quand le journal
    //    binaire est actif — c'est le cas en CI, trouvé le 30/10/2026) ; une
    //    colonne NOT NULL sans valeur par défaut, que l'INSERT du record ne
    //    renseigne pas : refusé en mode strict (le mode par défaut de MySQL 8).
    $mysql = bd_test()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    bd_test()->exec($mysql
        ? 'ALTER TABLE records ADD COLUMN panne_de_test INTEGER NOT NULL'
        : "CREATE TRIGGER panne_records BEFORE INSERT ON records BEGIN SELECT RAISE(ABORT, 'panne de test'); END");
    try {
        $r = records_api($eleve['code'], ['temps' => 500, 'justes' => 25, 'course' => $ticket]);
        egal(500, $r['code'], 'la base refuse d’écrire : 500');
        egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE hash = '" . hash('sha256', $ticket) . "'")->fetchColumn(), 'le ticket est TOUJOURS là (consommé dans la transaction annulée)');
    } finally {
        bd_test()->exec($mysql ? 'ALTER TABLE records DROP COLUMN panne_de_test' : 'DROP TRIGGER panne_records');
    }
    $r = records_api($eleve['code'], ['temps' => 500, 'justes' => 25, 'course' => $ticket]);
    egal(200, $r['code'], 'la base revenue : la même course, le même ticket, acceptée');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE hash = '" . hash('sha256', $ticket) . "'")->fetchColumn(), 'et le ticket est consommé cette fois');
    egal(400, records_api($eleve['code'], ['temps' => 500, 'justes' => 25, 'course' => $ticket])['code'], 'rejouer : refusé');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("relecture Codex R4 — six départs dans la même seconde : le ticket qui vient d'être rendu n'est jamais celui qu'on efface", function () use (&$jetonS1) {
    vider_compteurs();
    $classe = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => '3T', 'applis' => ['defi-tables']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classe, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    for ($tour = 0; $tour < 3; $tour++) {
        $dernier = '';
        for ($i = 0; $i < 6; $i++) $dernier = ticket_de_course($eleve['code']);
        egal(1, (int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE hash = '" . hash('sha256', $dernier) . "'")->fetchColumn(), "tour $tour : le dernier ticket rendu existe encore");
        vrai((int)bd_test()->query("SELECT COUNT(*) FROM billets WHERE type = 'course' AND eleve_id = " . (int)$eleve['id'])->fetchColumn() <= 4, "tour $tour : quatre au plus");
    }
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classe], ['jeton' => $jetonS1]);
    vider_compteurs();
});

// ------------------------------------------- Défi calcul, lot 1 « la séance » (12/11/2026)
//
// Deux réglages de classe d'un nouveau genre, des CHOIX fermés (déclarés
// ['choix' => [...]], le premier est le défaut) : « minutes » (10 ou 15) et
// « palier » (4 = tout, 1, 2, 3). Le défaut = rien d'écrit ; tout le reste
// refusé. L'élève les reçoit par son code et par le billet. Puis, pour
// quelques élèves, un autre choix que la classe (eleves.reglages, colonne
// eleves.reglages_eleve) : le choix de l'élève l'emporte. « nouveautes »
// (lot F1) n'existe plus : relu dans une vieille ligne, il est ignoré.

verifier("defi-calcul lot 1 — minutes et palier : le défaut ne s'écrit pas, 15 minutes et le palier 2 sont rangés, l'élève les reçoit par son code et par le billet", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'L1', 'applis' => ['defi-calcul']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    egal(null, classe_en_base($id)['reglages'], 'une classe neuve : rien d’écrit');
    vrai(str_contains(identite($eleve['code'])['texte'], '"reglages":{}'), 'l’élève reçoit « {} » : 10 minutes, tout');
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['defi-calcul' => ['minutes' => 15, 'palier' => 2]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'accepté');
    egal(['defi-calcul' => ['minutes' => 15, 'palier' => 2]], $r['json']['reglages'], 'la réponse rend les nouvelles valeurs');
    egal('{"defi-calcul":{"minutes":15,"palier":2}}', classe_en_base($id)['reglages'], 'en base');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'defi-calcul'], ['jeton' => $jetonS1]);
    egal(['defi-calcul' => ['minutes' => 15, 'palier' => 2]], $t['json']['classe']['reglages'], 'tableau');
    egal(['defi-calcul' => ['minutes' => 15, 'palier' => 2]], identite($eleve['code'])['json']['reglages'], 'l’élève, par son code');
    $billet = appel('/api/eleve.php', ['code' => $eleve['code'], 'billet' => true])['json']['billet'];
    egal(['defi-calcul' => ['minutes' => 15, 'palier' => 2]], echanger($billet, ['appli' => 'defi-calcul'])['json']['reglages'], 'l’élève, par le billet');
    // Avec « avant » : en retard → 409 ; juste → écrit. Le défaut revient à « {} ».
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'avant' => ['reglages' => ['defi-calcul' => ['minutes' => 15]]],
        'reglages' => ['defi-calcul' => ['minutes' => 10, 'palier' => 4]]], ['jeton' => $jetonS1]);
    egal(409, $r['code'], 'un « avant » en retard : refusé, rien d’écrit');
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'avant' => ['reglages' => ['defi-calcul' => ['minutes' => 15, 'palier' => 2]]],
        'reglages' => ['defi-calcul' => ['minutes' => 10, 'palier' => 4]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'un « avant » juste : écrit');
    vrai(str_contains($r['texte'], '"reglages":{}'), 'revenu au défaut : « {} »');
    egal(null, classe_en_base($id)['reglages'], 'en base : NULL');
    // Une vieille ligne du lot F1 (« nouveautes ») : ignorée, l'élève ne la reçoit pas.
    bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?')->execute(['{"defi-calcul":{"nouveautes":3,"minutes":15}}', $id]);
    egal(['defi-calcul' => ['minutes' => 15]], identite($eleve['code'])['json']['reglages'], '« nouveautes » ignoré');
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['defi-calcul' => ['nouveautes' => 2]]], ['jeton' => $jetonS1]);
    egal(400, $r['code'], '« nouveautes » ne s’écrit plus');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("defi-calcul lot 1 — minutes et palier : une valeur fausse est refusée, en base une valeur abîmée vaut le défaut", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'L1b', 'applis' => ['defi-calcul']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['defi-calcul' => ['minutes' => 15]]], ['jeton' => $jetonS1]);
    foreach ([
        [['minutes' => 12], 'Valeur hors des choix.', '12 minutes'],
        [['minutes' => 0], 'Valeur hors des choix.', '0'],
        [['minutes' => '15'], 'Valeur hors des choix.', '« 15 » en texte'],
        [['minutes' => 15.5], 'Valeur hors des choix.', '15,5'],
        [['minutes' => true], 'Valeur hors des choix.', 'vrai'],
        [['minutes' => [15]], 'Valeur hors des choix.', 'une liste'],
        [['minutes' => null], 'Valeur hors des choix.', 'null'],
        [['palier' => 0], 'Valeur hors des choix.', 'palier 0'],
        [['palier' => 5], 'Valeur hors des choix.', 'palier 5'],
        [['records' => false], 'Réglage inconnu.', 'les records sont à Défi tables'],
        [['mondes' => [1]], 'Réglage inconnu.', 'les mondes sont à SPLAT!'],
    ] as [$reglage, $message, $quoi]) {
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['defi-calcul' => $reglage]], ['jeton' => $jetonS1]);
        egal(400, $r['code'], "$quoi : refusé");
        egal($message, $r['json']['erreur'] ?? null, "$quoi : le message");
    }
    egal('{"defi-calcul":{"minutes":15}}', classe_en_base($id)['reglages'], 'la classe n’a pas bougé');
    $maj = bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?');
    foreach ([['{"defi-calcul":{"minutes":12}}', '{}'], ['{"defi-calcul":{"minutes":"15"}}', '{}'], ['{"defi-calcul":{"minutes":10}}', '{}'],
              ['{"defi-calcul":{"palier":4}}', '{}'], ['{"defi-calcul":{"palier":9}}', '{}'],
              ['{"defi-calcul":{"palier":3,"intrus":7}}', '{"defi-calcul":{"palier":3}}'], ['{"defi-calcul":[3]}', '{}']] as [$brut, $attendu]) {
        $maj->execute([$brut, $id]);
        vrai(str_contains(identite($eleve['code'])['texte'], '"reglages":' . $attendu), "« $brut » → $attendu");
    }
    // Un ajout « en plus » ne porte pas de réglage choix : c'est eleves.reglages.
    $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleve['id'], 'avant' => new stdClass(),
        'ajouts' => ['defi-calcul' => ['minutes' => 15]]], ['jeton' => $jetonS1]);
    egal(400, $r['code'], 'un choix ne se donne pas « en plus »');
    egal(['minutes' => ['choix' => [10, 15]], 'palier' => ['choix' => [4, 1, 2, 3]]], CATALOGUE_APPLIS['defi-calcul']['reglages'], 'le catalogue');
    egal([], listes_declarees('defi-calcul'), 'aucune liste par élève');
    egal(['minutes' => [10, 15], 'palier' => [4, 1, 2, 3]], choix_declares('defi-calcul'), 'deux choix');
    egal(true, est_reglage_choix(['choix' => [10, 15]]));
    foreach ([['choix' => [10]], ['choix' => [10, 10]], ['choix' => ['10', 15]], ['choix' => [10, 15], 'x' => 1], [10, 15], true, ['de' => 1, 'a' => 3]] as $faux) {
        egal(false, est_reglage_choix($faux), json_encode($faux));
    }
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("defi-calcul lot 1 — autrement pour quelques élèves (eleves.reglages) : rangé à part, l'élève l'emporte sur la classe, « avant » protège, propriétaire seulement", function () use (&$jetonS1, &$jetonClaire) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'L1c', 'applis' => ['defi-calcul']], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    [$rania, $lucas] = $eleves;
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['defi-calcul' => ['palier' => 2]]], ['jeton' => $jetonS1]);
    $r = appel('/api/prof.php', ['action' => 'eleves.reglages', 'eleve_id' => $rania['id'], 'avant' => new stdClass(),
        'reglages' => ['defi-calcul' => ['minutes' => 15, 'palier' => 4]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'accepté : ' . $r['texte']);
    egal(['defi-calcul' => ['minutes' => 15, 'palier' => 4]], $r['json']['reglages'], 'le rangé');
    egal(['defi-calcul' => ['palier' => 4, 'minutes' => 15]], $r['json']['acces']['reglages'], 'le calculé : l’élève l’emporte, même avec le défaut');
    $ligne = bd_test()->prepare('SELECT ajouts, reglages_eleve FROM eleves WHERE id = ?');
    $ligne->execute([$rania['id']]);
    $enBase = $ligne->fetch();
    $ligne->closeCursor();
    egal(null, $enBase['ajouts'], 'rien dans les ajouts (un ajout ouvrirait l’appli)');
    egal('{"defi-calcul":{"minutes":15,"palier":4}}', $enBase['reglages_eleve'], 'dans sa colonne');
    $i = identite($rania['code']);
    egal(['defi-calcul' => ['palier' => 4, 'minutes' => 15]], $i['json']['reglages'] ?? null, 'Rania, par son code : ' . $i['texte']);
    $billet = appel('/api/eleve.php', ['code' => $rania['code'], 'billet' => true])['json']['billet'];
    egal(['defi-calcul' => ['palier' => 4, 'minutes' => 15]], echanger($billet, ['appli' => 'defi-calcul'])['json']['reglages'], 'Rania, par le billet');
    egal(['defi-calcul' => ['palier' => 2]], identite($lucas['code'])['json']['reglages'], 'Lucas suit la classe');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'defi-calcul'], ['jeton' => $jetonS1]);
    $parId = array_column($t['json']['eleves'], null, 'id');
    egal(['defi-calcul' => ['minutes' => 15, 'palier' => 4]], $parId[$rania['id']]['reglages'], 'tableau : le rangé de Rania');
    egal([], $parId[$lucas['id']]['reglages'], 'tableau : rien pour Lucas');
    // « avant » en retard : 409 avec l'état actuel ; rien d'écrit.
    $r = appel('/api/prof.php', ['action' => 'eleves.reglages', 'eleve_id' => $rania['id'], 'avant' => new stdClass(),
        'reglages' => ['defi-calcul' => ['minutes' => 10]]], ['jeton' => $jetonS1]);
    egal(409, $r['code'], 'avant en retard');
    egal(['defi-calcul' => ['minutes' => 15, 'palier' => 4]], $r['json']['reglages'], '409 : l’état actuel');
    // Lecture stricte.
    foreach ([[['defi-calcul' => ['minutes' => 12]], 'Valeur hors des choix.'], [['defi-calcul' => ['nouveautes' => 2]], 'Réglage inconnu.'],
              [['splat' => ['mondes' => [1]]], 'Réglage inconnu.'], [['defi-calcul' => ['palier' => '2']], 'Valeur hors des choix.'], [[3], 'Réglages de l’élève illisibles.']] as [$reglages, $message]) {
        $r = appel('/api/prof.php', ['action' => 'eleves.reglages', 'eleve_id' => $rania['id'], 'avant' => ['defi-calcul' => ['minutes' => 15, 'palier' => 4]], 'reglages' => $reglages], ['jeton' => $jetonS1]);
        egal(400, $r['code'], json_encode($reglages) . ' : refusé');
        egal(str_replace('’', "'", $message), str_replace('’', "'", $r['json']['erreur'] ?? ''), json_encode($reglages) . ' : le message');
    }
    $r = appel('/api/prof.php', ['action' => 'eleves.reglages', 'eleve_id' => $rania['id'], 'reglages' => new stdClass()], ['jeton' => $jetonS1]);
    egal(400, $r['code'], 'sans « avant » : refusé');
    // Un autre professeur (même en écriture partagée) ne règle pas les élèves de la classe.
    $r = appel('/api/prof.php', ['action' => 'eleves.reglages', 'eleve_id' => $rania['id'], 'avant' => ['defi-calcul' => ['minutes' => 15, 'palier' => 4]],
        'reglages' => new stdClass()], ['jeton' => $jetonClaire]);
    vrai(in_array($r['code'], [403, 404], true), 'un collègue : refusé (' . $r['code'] . ')');
    // « {} » : Rania suit de nouveau la classe ; la colonne redevient NULL.
    $r = appel('/api/prof.php', ['action' => 'eleves.reglages', 'eleve_id' => $rania['id'], 'avant' => ['defi-calcul' => ['minutes' => 15, 'palier' => 4]],
        'reglages' => new stdClass()], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'remis à la classe');
    $ligne->execute([$rania['id']]);
    egal(null, $ligne->fetch()['reglages_eleve'], 'NULL en base');
    $ligne->closeCursor();
    egal(['defi-calcul' => ['palier' => 2]], identite($rania['code'])['json']['reglages'], 'Rania suit la classe');
    // La règle, seule : la classe n'a pas Défi calcul → le réglage de l'élève ne lui donne pas l'appli.
    egal(['applis' => [], 'reglages' => []], acces_de_l_eleve(['applis' => '', 'reglages' => null], null, '{"defi-calcul":{"minutes":15}}'), 'un réglage n’ouvre rien');
    egal(['defi-calcul' => ['minutes' => 15]], reglages_eleve_lus('{"defi-calcul":{"minutes":15,"palier":7,"x":1},"splat":{"mondes":[1]}}'), 'lecture : le valide seulement');
    egal(['palier' => 1], acces_de_l_eleve(['applis' => 'defi-calcul', 'reglages' => '{"defi-calcul":{"palier":3}}'], null, '{"defi-calcul":{"palier":1}}')['reglages']['defi-calcul'], 'élève 1 > classe 3');
    egal(true, in_array('eleves.reglages', ACTIONS_JOURNAL, true), 'au journal');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

// Lot G1 « journal + accueil » (07/11/2026) : la version minimale passe à 5 —
// une page de version 4 (d'avant le journal) est refusée comme une page de
// version 3 l'était au lot F1.
verifier("defi-calcul F1 et G1 — une page d'avant G1 (version 4, 3…) ne réécrit pas la progression : 400, rien d'écrit ; la lecture et les autres applis ne changent pas", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'F1c', 'applis' => ['defi-calcul', 'defi-tables']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $code = $eleve['code'];
    $reference = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-defi-calcul.json'), true);
    // Puis le correctif du lot S1 « les journaux » : 6 (le numéro de chaque
    // séance du journal) ; une page de version 5 est refusée à son tour.
    // Puis le lot 1 « la séance » : 7 (`l` et le plan à 11 nombres).
    // Puis le lot 4 « les ceintures » : 8 (`ceintures`).
    // Puis le lot 6 « programmes 2 » : 9 (une case de plus pour F6 et F9).
    // Puis le lot F4 « personne ne reste bloqué » : 10 (`ar` et `paliers`).
    // Puis le lot C2 « doubles et moitiés » : 11 (M1 et D8, une case par
    // niveau neuf, chacune à sa place).
    egal(11, $reference['version'], 'le parcours de référence est en version 11');
    egal(11, CATALOGUE_APPLIS['defi-calcul']['version_min']);
    foreach ([[10, 'version 10'], [9, 'version 9'], [8, 'version 8'], [7, 'version 7'], [6, 'version 6'], [5, 'version 5'], [4, 'version 4'], [3, 'version 3'], [0, 'version 0'], ['11', '« 11 » en texte'], [null, 'sans version']] as [$version, $quoi]) {
        $ancien = $reference;
        if ($version === null) unset($ancien['version']); else $ancien['version'] = $version;
        $w = ecrire($code, $ancien, 0, 'defi-calcul');
        egal(400, $w['code'], "$quoi : refusé");
        egal('Page ancienne : recharge la page.', $w['json']['erreur'] ?? null, "$quoi : le message");
        egal(false, lire($code, 'defi-calcul')['json']['existe'], "$quoi : rien d'écrit");
    }
    $w = ecrire($code, $reference, 0, 'defi-calcul');
    egal(200, $w['code'], 'version 11 : accepté');
    $ancien = $reference;
    $ancien['version'] = 10;
    $w = ecrire($code, $ancien, 1, 'defi-calcul');
    egal(400, $w['code'], 'par-dessus une version 11 : refusé, même avec la bonne révision');
    $w = ecrire($code, $ancien, 0, 'defi-calcul');
    egal(400, $w['code'], 'avec une révision fausse : refusé aussi (pas de 409 qui ferait fusionner la vieille page)');
    $r = lire($code, 'defi-calcul');
    egal(1, $r['json']['revision'], 'toujours la révision 1');
    egal(11, $r['json']['parcours']['version'], 'la version 11 est restée');
    // Lot 4 : les ceintures reviennent telles quelles (des dates et des null, à leur place).
    egal($reference['ceintures'], $r['json']['parcours']['ceintures'], 'les ceintures sont gardées telles quelles');
    // Lot F4 : les tests de palier (des dates et des null) et `ar` (des entiers) aussi ; l'échéance
    // d'un niveau pas appris « à voir en classe » (une date) reste à sa place.
    egal($reference['paliers'], $r['json']['parcours']['paliers'], 'les tests de palier sont gardés tels quels');
    $dernierCode = array_key_last($reference['modules']);
    egal($reference['modules'][$dernierCode]['ar'], $r['json']['parcours']['modules'][$dernierCode]['ar'], '`ar` gardé tel quel');
    egal($reference['modules'][$dernierCode]['e'], $r['json']['parcours']['modules'][$dernierCode]['e'], "l'échéance d'un niveau pas appris gardée à sa place");
    // Lot G1 : le journal (sept listes d'entiers depuis le correctif S1, -1 compris) et les deux dates
    // des compétences (des dates et des null) reviennent tels quels.
    egal($reference['journal'], $r['json']['parcours']['journal'], 'le journal est gardé tel quel');
    egal($reference['modules']['A5']['d'], $r['json']['parcours']['modules']['A5']['d'], 'les dates des compétences aussi');
    egal($reference['seance']['j'], $r['json']['parcours']['seance']['j'], 'et ce que la séance ouverte a fait');
    // Les applis sans version minimale : rien ne change pour elles (Défi
    // tables, SPLAT! et Coffres en ont une depuis le lot S1 « les journaux » :
    // voir le test du lot S1 plus bas).
    foreach (CATALOGUE_APPLIS as $cle => $fiche) {
        if (!in_array($cle, ['defi-calcul', 'defi-tables', 'splat', 'coffres'], true)) vrai(!array_key_exists('version_min', $fiche), "$cle : pas de version minimale");
    }
    $w = ecrire($code, ['version' => 1, 'seances' => new stdClass()], 0, 'flash-anzan');
    egal(200, $w['code'], 'Anzan en version 1 : accepté comme avant');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

// Correctif du lot F4 (21/11/2026, relecture de Codex, point 7) : `paliers`
// n'accepte que des dates ou null, `ar` que des entiers de 0 à 29 ; une valeur
// hors format est REMPLACÉE (null, ou 0) à sa place, jamais retirée — rien ne
// glisse d'une case. La version est un entier de 1 à 999 : au-delà, refus.
verifier("defi-calcul correctif F4 — `paliers` et `ar` : une valeur hors format remplacée à sa place, rien ne glisse ; une version au-delà de 999 refusée", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'F4c', 'applis' => ['defi-calcul']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $code = $eleve['code'];
    $reference = json_decode((string)file_get_contents(__DIR__ . '/parcours-reference-defi-calcul.json'), true);
    $abime = $reference;
    $abime['paliers'] = [7, '2026-11-20', 'texte', '2026-11-22'];
    // A1 et A10 : trois niveaux chacun.
    $abime['modules']['A1']['ar'] = ['2026-11-20', 4, -1];
    $abime['modules']['A10']['ar'] = [30, 2.5, 5];
    $w = ecrire($code, $abime, 0, 'defi-calcul');
    egal(200, $w['code'], 'accepté (les valeurs hors format sont remplacées)');
    $r = lire($code, 'defi-calcul')['json']['parcours'];
    egal([null, '2026-11-20', null, '2026-11-22'], $r['paliers'], '`paliers` : un entier et un texte deviennent null, les dates restent à leur place');
    egal([0, 4, 0], $r['modules']['A1']['ar'], '`ar` : une date et -1 deviennent 0, à leur place');
    egal([0, 0, 5], $r['modules']['A10']['ar'], '`ar` : 30 et 2,5 deviennent 0, le 5 reste à sa place');
    foreach ([[1000, 'version 1000'], [1500, 'version 1500']] as [$version, $quoi]) {
        $trop = $reference;
        $trop['version'] = $version;
        $w = ecrire($code, $trop, 1, 'defi-calcul');
        egal(400, $w['code'], "$quoi : refusé");
        egal(1, lire($code, 'defi-calcul')['json']['revision'], "$quoi : rien d'écrit");
    }
    egal(999, CATALOGUE_APPLIS['defi-calcul']['version_max'] ?? null, 'la borne est déclarée');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

// Lot S1 « les journaux » (07/11/2026, chantier « Suivre ses élèves ») :
// Défi tables (version 4), SPLAT! et Coffres magiques (version 2) tiennent un
// journal. Une page d'avant (Défi tables 3, SPLAT! 1, Coffres 1) l'effacerait
// en renvoyant la progression : son envoi est refusé (400), rien n'est écrit,
// même par-dessus une progression déjà là et avec la bonne révision. Le
// journal (des -1 compris) revient tel quel ; la lecture ne change pas.
verifier("lot S1 — Défi tables, SPLAT! et Coffres : une page d'avant le journal ne réécrit rien (400) ; le journal revient tel quel", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'S1j', 'applis' => ['defi-tables', 'splat', 'coffres']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $code = $eleve['code'];
    $cas = [
        // Lot « le jour vert » : Défi tables en version 5, Coffres en version 4.
        'defi-tables' => ['fichier' => 'parcours-reference.json', 'min' => 5, 'avant' => [4, 3, 2, 1]],
        'splat' => ['fichier' => 'parcours-reference-splat.json', 'min' => 2, 'avant' => [1, 0]],
        // Coffres : version 3 depuis le lot « coffres-chemin-gloubi » (gloubi et cran) — une page de version 2 est refusée aussi.
        'coffres' => ['fichier' => 'parcours-reference-coffres.json', 'min' => 4, 'avant' => [3, 2, 1, 0]],
    ];
    foreach ($cas as $appli => $c) {
        $reference = json_decode((string)file_get_contents(__DIR__ . '/' . $c['fichier']), true);
        egal($c['min'], $reference['version'], "$appli : le parcours de référence est en version {$c['min']}");
        egal($c['min'], CATALOGUE_APPLIS[$appli]['version_min'], "$appli : version_min");
        vrai(isset($reference['journal']), "$appli : la référence porte un journal");
        foreach (array_merge($c['avant'], ['texte', null]) as $version) {
            $ancien = $reference;
            if ($version === null) unset($ancien['version']);
            elseif ($version === 'texte') $ancien['version'] = (string)$c['min'];
            else $ancien['version'] = $version;
            unset($ancien['journal']);
            $w = ecrire($code, $ancien, 0, $appli);
            egal(400, $w['code'], "$appli, version " . var_export($version, true) . ' : refusé');
            egal('Page ancienne : recharge la page.', $w['json']['erreur'] ?? null, "$appli : le message");
            egal(false, lire($code, $appli)['json']['existe'], "$appli : rien d'écrit");
        }
        $w = ecrire($code, $reference, 0, $appli);
        egal(200, $w['code'], "$appli, version {$c['min']} : accepté");
        $ancien = $reference;
        $ancien['version'] = $c['avant'][0];
        unset($ancien['journal']);
        egal(400, ecrire($code, $ancien, 1, $appli)['code'], "$appli : par-dessus, avec la bonne révision : refusé");
        $r = lire($code, $appli);
        egal(1, $r['json']['revision'], "$appli : toujours la révision 1");
        egal($reference['journal'], $r['json']['parcours']['journal'] ?? null, "$appli : le journal revient tel quel, -1 compris");
        vrai(in_array(-1, array_merge(...array_values($reference['journal'])), true), "$appli : la référence a bien un « pas connu » (-1)");
    }
    // Défi tables ne garde pas de temps passé (décision du 07/11/2026).
    vrai(!array_key_exists('minutes', lire($code, 'defi-tables')['json']['parcours']['journal']), 'Défi tables : pas de minutes au journal');
    // Correctif S1 (relecture de Codex) : le numéro de chaque séance revient tel quel.
    vrai(count(array_filter(lire($code, 'defi-tables')['json']['parcours']['journal']['numero'], fn($n) => $n >= 10000)) > 0, 'Défi tables : les numéros des séances sont gardés');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

// ------------------------------------------------ l'appli Cours (lot « cours-appli », 08/11/2026)
//
// Gwenaël : « AUCUNE donnée élève enregistrée » ; le professeur choisit les
// chapitres et les fiches, « nouveau programme » masqué par défaut ; rien
// d'ouvert au départ. Le catalogue est celui du dépôt (lib/cours.json,
// fabriqué par le moteur du livret) ; le test des fiches du nouveau programme
// pose un catalogue d'essai le temps du test.

verifier("cours-appli — rien d'ouvert au départ ; un chapitre ouvert : ses fiches, leurs adresses (#ch=), le brevet, l'imprimable ; une fiche fermée s'en va, l'imprimable aussi, les numéros restent", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'C1', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $r = identite($eleve['code']);
    egal([], $r['json']['cours'] ?? null, 'au départ : la clé « cours », vide — pas de tuile');
    egal(null, classe_en_base($id)['reglages'], 'rien d’écrit en base');
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-PYT']]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'un chapitre ouvert');
    egal('{"cours":{"chapitres":["3e-PYT"]}}', classe_en_base($id)['reglages'], 'en base');
    $cours = identite($eleve['code'])['json']['cours'];
    egal(1, count($cours), 'un chapitre');
    egal('3e-PYT', $cours[0]['id'], 'le chapitre');
    // Lot « cours-appli-2 » (13/11/2026) : la clé du domaine, pour la bande de couleur de « Mes cours ».
    egal('geometrie', $cours[0]['domaine'] ?? 'absent', 'le domaine du chapitre (une clé, jamais un nom ni une couleur)');
    egal(['nombres', 'algebre', 'proportionnalite', 'geometrie', null], [cours_domaine('3e-ARI'), cours_domaine('4e-EQU'), cours_domaine('3e-FON'), cours_domaine('4e-INE'), cours_domaine('3e-SEC')],
        'les domaines : « Préparer la seconde » n’en a pas');
    // Depuis le lot « livret-telephone » (09/11/2026), 3e-PYT a sept fiches : « Choisir le bon outil » (3e-THA-04) est la 7e.
    // Depuis « cours-lot1-b26 » (13/11/2026), huit : « Le triangle rectangle et son cercle » (3e-PYT-04, pour la seconde)
    // est la 8e ; en 3e, le nouveau programme s'ouvre avec le chapitre comme le reste (catalogue : « nouveau » faux).
    egal([1, 2, 3, 4, 5, 6, 7, 8], array_column($cours[0]['fiches'], 'n'), 'huit fiches, numérotées');
    egal('https://mathsgo.re/cours/4e/4e-TRI-03.html#ch=3e-PYT', $cours[0]['fiches'][2]['url'], 'une fiche de 4e, avec le chapitre d’où l’on vient');
    egal('https://mathsgo.re/cours/3e/3e-PYT-brevet.html#ch=3e-PYT', $cours[0]['brevet'], 'le brevet');
    egal('https://mathsgo.re/cours/3e/3e-PYT-imprimable.html#ch=3e-PYT', $cours[0]['imprimable'], 'l’imprimable : toutes les fiches sont ouvertes');
    foreach ($cours[0]['fiches'] as $fiche) {
        egal(['n', 'h1', 'type', 'url'], array_keys($fiche), 'une fiche : rien d’autre que ce que la page affiche (plus de niveaux depuis le 09/11/2026)');
    }
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-PYT'], 'sans' => ['3e-PYT-02', '3e-PYT-brevet']]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'une fiche et le brevet fermés');
    $cours = identite($eleve['code'])['json']['cours'];
    egal([1, 2, 3, 5, 6, 7, 8], array_column($cours[0]['fiches'], 'n'), 'la fiche 4 s’en va, les numéros restent');
    egal(null, $cours[0]['brevet'], 'plus de brevet');
    egal(null, $cours[0]['imprimable'], 'plus d’imprimable : il contiendrait la fiche fermée');
    // Le même chapitre en 4e : la fiche commune fermée l'est aussi (un seul identifiant).
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-PYT', '4e-TRI'], 'sans' => ['4e-TRI-03']]]], ['jeton' => $jetonS1]);
    $cours = identite($eleve['code'])['json']['cours'];
    egal(['4e-TRI', '3e-PYT'], array_column($cours, 'id'), 'deux chapitres, dans l’ordre du livret (la progression)');
    egal([[1, 2, 4, 5], [1, 2, 4, 5, 6, 7, 8]], [array_column($cours[0]['fiches'], 'n'), array_column($cours[1]['fiches'], 'n')], 'la fiche commune fermée dans les deux');
    // Tous les chapitres fermés : la clé reste, vide ; l'appli retirée : plus de clé.
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => [], 'sans' => []]]], ['jeton' => $jetonS1]);
    vrai(str_contains($r['texte'], '"reglages":{}'), 'tout fermé : « {} »');
    egal(null, classe_en_base($id)['reglages'], 'en base : NULL');
    egal([], identite($eleve['code'])['json']['cours'], 'tout fermé : vide');
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'applis' => ['defi-tables']], ['jeton' => $jetonS1]);
    vrai(!array_key_exists('cours', identite($eleve['code'])['json']), 'sans l’appli Cours : pas de clé « cours »');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

// Lot « cours-lot1-b26 » (13/11/2026) : en 3e, le nouveau programme est montré « tout pareil » cette année (décision
// de Gwenaël du 12/11) — « Préparer la seconde » s'ouvre avec ses fiches, sans les cocher une par une ; et une fiche du
// programme 2020 dont le statut CITE le nouveau programme (« retiré du nouveau programme… », 3e-ANG-07) n'en est pas une.
verifier("cours-appli — en 3e, « Préparer la seconde » et les fiches « pour la seconde » s'ouvrent avec leur chapitre ; 3e-ANG-07 (programme 2020) aussi", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'C1', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-ANG', '3e-SEC']]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'deux chapitres ouverts');
    $cours = identite($eleve['code'])['json']['cours'];
    egal(['3e-ANG', '3e-SEC'], array_column($cours, 'id'), 'les deux chapitres, dans l’ordre du livret');
    egal(8, count($cours[0]['fiches']), 'Angles : toutes ses fiches, la 7e (triangles semblables) comprise');
    vrai(in_array('https://mathsgo.re/cours/3e/3e-ANG-07.html#ch=3e-ANG', array_column($cours[0]['fiches'], 'url'), true), '3e-ANG-07 ouverte');
    // (lot « cours-lot2 », 13/11/2026 : une sixième fiche, « Deux groupes réunis », pourcentages ;
    // lot « cours-lot3 », 13/11/2026 : trois de plus, les inégalités, les inéquations et la fonction carré ;
    // lot « cours-lot5 », 14/11/2026 : une dixième, « Les formules des puissances »)
    egal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], array_column($cours[1]['fiches'], 'n'), 'Préparer la seconde : ses dix fiches');
    egal('https://mathsgo.re/cours/3e/3e-SEC-imprimable.html#ch=3e-SEC', $cours[1]['imprimable'], 'et sa version imprimable');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("cours-appli — lecture stricte du réglage (chapitre ou fiche inconnus, liste illisible : 400, rien d'écrit) ; « avant » en retard : 409 ; en base, un identifiant disparu du livret est oublié", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'C2', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['4e-TRI']]]], ['jeton' => $jetonS1]);
    foreach ([
        [['chapitres' => ['9e-XYZ']], 'Chapitre inconnu.'],
        [['chapitres' => ['4e-TRI-01']], 'Chapitre inconnu.'],
        [['sans' => ['4e-TRI']], 'Fiche inconnue.'],
        [['sans' => ['<script>']], 'Fiche inconnue.'],
        [['avec' => [3]], 'Fiche inconnue.'],
        [['chapitres' => '4e-TRI'], 'Liste de cours illisible.'],
        [['chapitres' => ['a' => '4e-TRI']], 'Liste de cours illisible.'],
        [['niveau' => '4e'], 'Réglage inconnu.'],
    ] as [$reglage, $message]) {
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => $reglage]], ['jeton' => $jetonS1]);
        egal(400, $r['code'], json_encode($reglage) . ' : refusé');
        egal($message, $r['json']['erreur'] ?? null, json_encode($reglage) . ' : le message');
    }
    egal('{"cours":{"chapitres":["4e-TRI"]}}', classe_en_base($id)['reglages'], 'rien d’écrit');
    // Doublons et désordre : rangés dans l'ordre du livret.
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-PYT', '4e-TRI', '3e-PYT'], 'sans' => ['4e-TRI-05', '4e-TRI-01', '4e-TRI-05']]]], ['jeton' => $jetonS1]);
    egal(['cours' => ['chapitres' => ['4e-TRI', '3e-PYT'], 'sans' => ['4e-TRI-01', '4e-TRI-05']]], $r['json']['reglages'], 'rangés, sans doublon');
    // « avant » en retard (un autre onglet a changé la classe) : 409, rien d'écrit.
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'avant' => ['reglages' => ['cours' => ['chapitres' => ['4e-TRI']]]],
        'reglages' => ['cours' => ['chapitres' => []]]], ['jeton' => $jetonS1]);
    egal(409, $r['code'], '« avant » en retard : refusé');
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'avant' => ['reglages' => ['cours' => ['chapitres' => ['4e-TRI', '3e-PYT'], 'sans' => ['4e-TRI-01', '4e-TRI-05']]]],
        'reglages' => ['cours' => ['chapitres' => ['3e-PYT'], 'sans' => []]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], '« avant » juste : écrit');
    // En base, une fiche ou un chapitre que le livret n'a plus : oublié à la lecture.
    bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?')->execute(['{"cours":{"chapitres":["3e-PYT","5e-ZZZ"],"sans":["3e-PYT-99",4,"4e-TRI-01"],"avec":"x"}}', $id]);
    $cours = identite($eleve['code'])['json']['cours'];
    egal(['3e-PYT'], array_column($cours, 'id'), 'le chapitre disparu est oublié');
    egal([2, 3, 4, 5, 6, 7, 8], array_column($cours[0]['fiches'], 'n'), 'la fiche fermée reste fermée, le reste est oublié');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("cours-appli — les fiches du nouveau programme sont masquées par défaut et s'ouvrent une par une ; une entrée abîmée du catalogue (adresse hors cours/) n'atteint jamais l'élève", function () use (&$jetonS1, $travail) {
    vider_compteurs();
    $fichier = $travail . '/lib/cours.json';
    $vrai = file_get_contents($fichier);
    $essai = ['chapitres' => [[
        'id' => '3e-ESS', 'niveau' => '3e', 'chapitre' => 'Essai', 'titre' => 'Un chapitre d’essai',
        'fiches' => [
            ['id' => '3e-ESS-01', 'n' => 1, 'ids' => '3e-ESS-01', 'h1' => 'Je sais A', 'niveaux' => ['3e'], 'type' => 'méthode', 'nouveau' => false, 'page' => '/cours/3e/3e-ESS-01.html'],
            ['id' => '3e-ESS-02', 'n' => 2, 'ids' => '3e-ESS-02', 'h1' => 'Je sais B', 'niveaux' => ['3e'], 'type' => 'savoir', 'nouveau' => true, 'page' => '/cours/3e/3e-ESS-02.html'],
            ['id' => '3e-ESS-03', 'n' => 3, 'ids' => '3e-ESS-03', 'h1' => 'Piège', 'niveaux' => ['3e'], 'type' => '', 'nouveau' => false, 'page' => 'https://ailleurs.example/x.html'],
            ['id' => '3e-ESS-04', 'n' => 4, 'ids' => '3e-ESS-04', 'h1' => 'Piège 2', 'niveaux' => ['3e'], 'type' => '', 'nouveau' => false, 'page' => '/cours/3e/../../index.html'],
        ],
        'brevet' => null, 'imprimable' => '/cours/3e/3e-ESS-imprimable.html',
    ]]];
    file_put_contents($fichier, json_encode($essai, JSON_UNESCAPED_UNICODE));
    try {
        $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'C3', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
        $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
        appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-ESS']]]], ['jeton' => $jetonS1]);
        $cours = identite($eleve['code'])['json']['cours'];
        egal([1], array_column($cours[0]['fiches'], 'n'), 'le nouveau programme masqué ; les deux pièges écartés');
        egal(null, $cours[0]['imprimable'], 'l’imprimable contiendrait la fiche masquée : pas donné');
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['avec' => ['3e-ESS-02']]]], ['jeton' => $jetonS1]);
        egal(200, $r['code'], 'la fiche du nouveau programme ouverte');
        $cours = identite($eleve['code'])['json']['cours'];
        egal([1, 2], array_column($cours[0]['fiches'], 'n'), 'elle apparaît');
        egal('https://mathsgo.re/cours/3e/3e-ESS-imprimable.html#ch=3e-ESS', $cours[0]['imprimable'], 'tout est ouvert : l’imprimable revient');
        $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['sans' => ['3e-ESS-03']]]], ['jeton' => $jetonS1]);
        egal(400, $r['code'], 'une fiche écartée du catalogue n’existe pas non plus pour le réglage');
        // La page Ma classe porte le catalogue en DONNÉES, échappé.
        $page = page('/prof/')['texte'];
        vrai((bool)preg_match('/<script type="application\/json" id="cours-catalogue" nonce="[^"]+">/', $page), 'Ma classe : le catalogue, avec le nonce de la page');
        vrai(!str_contains($page, 'ailleurs.example') && !str_contains($page, '..\/..'), 'Ma classe : les pièges n’y sont pas');
        appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    } finally {
        file_put_contents($fichier, $vrai);
    }
    vider_compteurs();
});

verifier("cours-appli — rien n'est enregistré pour l'élève : api/parcours.php ne connaît pas « cours » ; « Cours » entier à un élève (sans chapitre) refusé ; le tableau de l'onglet Cours n'a aucune progression", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'C4', 'applis' => ['defi-tables']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    $w = ecrire($eleve['code'], ['version' => 1], 0, 'cours');
    egal(400, $w['code'], 'écrire une progression « cours » : refusé');
    egal(400, lire($eleve['code'], 'cours')['code'], 'la lire : refusé');
    $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleve['id'], 'avant' => new stdClass(), 'ajouts' => ['cours' => new stdClass()]], ['jeton' => $jetonS1]);
    egal(400, $r['code'], 'Cours entier à un élève, sans chapitre : refusé');
    egal("Pour un élève, on ouvre des chapitres : coche au moins un chapitre.", $r['json']['erreur'] ?? null, 'le message (lot « cours-appli-3 »)');
    // Rangé quand même en base (une vieille page, un script) : ignoré à la lecture.
    bd_test()->prepare('UPDATE eleves SET ajouts = ? WHERE id = ?')->execute(['{"cours":{}}', $eleve['id']]);
    vrai(!array_key_exists('cours', identite($eleve['code'])['json']), 'un ajout « cours » en base ne donne rien');
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'applis' => ['defi-tables', 'cours']], ['jeton' => $jetonS1]);
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'cours'], ['jeton' => $jetonS1]);
    egal(200, $t['code'], 'le tableau de l’onglet Cours');
    egal([null], array_column($t['json']['eleves'], 'parcours'), 'aucune progression');
    $n = bd_test()->query("SELECT COUNT(*) FROM progressions WHERE appli = 'cours'")->fetchColumn();
    egal(0, (int)$n, 'aucune ligne « cours » en base');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

// ------------------------------------------ des chapitres en plus pour quelques élèves (lot « cours-appli-3 », 14/11/2026)
//
// Gwenaël (question à choix du 14/11) : « En plus pour quelques élèves »,
// comme SPLAT! et Coffres — un chapitre, ou tout un niveau, en plus de ce
// qu'a la classe ; on ajoute, on ne retire jamais rien ; les fiches fermées
// et les fiches du nouveau programme ouvertes de la classe valent aussi pour
// ces chapitres.

function chapitres_vus(string $code): array
{
    return array_column(identite($code)['json']['cours'] ?? [], 'id');
}

verifier("cours-appli-3 — un élève avec un ajout voit ses chapitres EN PLUS de ceux de la classe ; un autre non ; un ajout ne retire rien ; les fiches fermées de la classe valent aussi pour lui", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'P1', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    [$a, $b] = $eleves;
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-PYT'], 'sans' => ['4e-PUI-02']]]], ['jeton' => $jetonS1]);
    $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $a['id'], 'avant' => new stdClass(), 'ajouts' => ['cours' => ['chapitres' => ['3e-THA', '4e-PUI', '3e-THA']]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'des chapitres en plus : ' . $r['texte']);
    egal(['cours' => ['chapitres' => ['4e-PUI', '3e-THA']]], $r['json']['ajouts'], 'rangés dans l’ordre du livret, sans doublon');
    egal(['4e-PUI', '3e-PYT', '3e-THA'], $r['json']['acces']['reglages']['cours']['chapitres'], 'ce qu’il voit : la classe + les siens');
    egal(['4e-PUI', '3e-PYT', '3e-THA'], chapitres_vus($a['code']), 'l’élève avec un ajout voit ses chapitres');
    egal(['3e-PYT'], chapitres_vus($b['code']), 'l’autre : ceux de la classe seulement');
    // La fiche fermée à la classe (4e-PUI-02) l'est aussi dans son chapitre en plus.
    $pui = array_values(array_filter(identite($a['code'])['json']['cours'], fn ($c) => $c['id'] === '4e-PUI'))[0];
    vrai(!in_array('https://mathsgo.re/cours/4e/4e-PUI-02.html#ch=4e-PUI', array_column($pui['fiches'], 'url'), true), 'la fiche fermée à la classe reste fermée');
    vrai(in_array('https://mathsgo.re/cours/4e/4e-PUI-01.html#ch=4e-PUI', array_column($pui['fiches'], 'url'), true), 'les autres sont là');
    egal(null, $pui['imprimable'], 'pas d’imprimable : toutes les fiches ne sont pas ouvertes');
    // Un ajout ne retire rien : la classe ouvre un chapitre de plus, l'élève l'a aussi.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-PYT', '3e-RAC']]]], ['jeton' => $jetonS1]);
    egal(['4e-PUI', '3e-PYT', '3e-RAC', '3e-THA'], chapitres_vus($a['code']), 'la classe + les siens, toujours');
    // La classe referme tout : il garde les siens (D4), l'autre n'a plus rien.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => []]]], ['jeton' => $jetonS1]);
    egal(['4e-PUI', '3e-THA'], chapitres_vus($a['code']), 'ses chapitres en plus restent');
    egal([], chapitres_vus($b['code']), 'l’autre : rien');
    // La classe sans l'appli Cours : seuls ceux qui l'ont en plus la voient ; les fiches fermées de la classe valent toujours.
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'applis' => ['defi-tables'], 'reglages' => ['cours' => ['chapitres' => ['3e-PYT'], 'sans' => ['3e-THA-03']]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'la classe sans Cours, ses réglages gardés : ' . $r['texte']);
    $classeSans = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'cours'], ['jeton' => $jetonS1]);
    egal(['defi-tables'], $classeSans['json']['classe']['applis'], 'la classe n’a plus Cours');
    egal(['4e-PUI', '3e-THA'], chapitres_vus($a['code']), 'lui : ses chapitres (pas ceux de la classe, qui n’a plus l’appli)');
    $tha = array_values(array_filter(identite($a['code'])['json']['cours'], fn ($c) => $c['id'] === '3e-THA'))[0];
    vrai(!in_array('https://mathsgo.re/cours/3e/3e-THA-03.html#ch=3e-THA', array_column($tha['fiches'], 'url'), true), 'la fiche fermée à la classe le reste');
    vrai(in_array('https://mathsgo.re/cours/3e/3e-THA-04.html#ch=3e-THA', array_column($tha['fiches'], 'url'), true), 'les autres sont là');
    vrai(!array_key_exists('cours', identite($b['code'])['json']), 'l’autre : pas de « Mes cours »');
    $parId = array_column($classeSans['json']['eleves'], null, 'id');
    egal(['defi-tables', 'cours'], $parId[$a['id']]['acces']['applis'], 'le tableau dit ce qu’il voit : la classe + Cours en plus');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("cours-appli-3 — lecture stricte d'un ajout « cours » (des chapitres connus, au moins un, rien d'autre) ; « avant » périmé : 409, rien d'écrit ; en base, un ajout abîmé n'ouvre jamais rien", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'P2', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    foreach ([
        [['chapitres' => []], "Une liste vide n'ajoute rien : retire plutôt l'activité.", 'une liste vide'],
        [['chapitres' => ['9e-XYZ']], 'Chapitre inconnu.', 'un chapitre inconnu'],
        [['chapitres' => ['3e-PYT-02']], 'Chapitre inconnu.', 'une fiche à la place d’un chapitre'],
        [['chapitres' => '3e-PYT'], 'Liste de cours illisible.', 'pas une liste'],
        [['chapitres' => [3]], 'Chapitre inconnu.', 'un nombre'],
        [['chapitres' => ['3e-PYT'], 'sans' => []], 'Pour un élève, on ouvre des chapitres : coche au moins un chapitre.', 'les fiches suivent la classe'],
        [['avec' => ['4e-PUI-03']], 'Pour un élève, on ouvre des chapitres : coche au moins un chapitre.', 'une fiche du nouveau programme : pas pour un élève'],
        [['mondes' => [1]], 'Pour un élève, on ouvre des chapitres : coche au moins un chapitre.', 'un réglage d’une autre appli'],
    ] as [$ajout, $message, $quoi]) {
        $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleve['id'], 'avant' => new stdClass(), 'ajouts' => ['cours' => $ajout]], ['jeton' => $jetonS1]);
        egal(400, $r['code'], "$quoi : refusé");
        egal($message, $r['json']['erreur'] ?? null, "$quoi : le message");
    }
    egal(null, bd_test()->query('SELECT ajouts FROM eleves WHERE id = ' . (int)$eleve['id'])->fetchColumn(), 'rien d’écrit');
    // « avant » périmé : un autre onglet a écrit entre-temps.
    $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleve['id'], 'avant' => new stdClass(), 'ajouts' => ['cours' => ['chapitres' => ['3e-PYT']]]], ['jeton' => $jetonS1]);
    egal(200, $r['code']);
    $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleve['id'], 'avant' => new stdClass(), 'ajouts' => ['cours' => ['chapitres' => ['3e-THA']]]], ['jeton' => $jetonS1]);
    egal(409, $r['code'], 'la fenêtre refuse une écriture périmée');
    egal(['cours' => ['chapitres' => ['3e-PYT']]], $r['json']['ajouts'], 'l’état actuel part avec le refus');
    egal('{"cours":{"chapitres":["3e-PYT"]}}', bd_test()->query('SELECT ajouts FROM eleves WHERE id = ' . (int)$eleve['id'])->fetchColumn(), 'rien n’est écrasé');
    // « avant » dans l'autre ordre : la même chose (forme canonique).
    $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleve['id'], 'avant' => ['cours' => ['chapitres' => ['3e-PYT']]], 'ajouts' => ['cours' => ['chapitres' => ['3e-THA', '3e-PYT']]]], ['jeton' => $jetonS1]);
    egal(200, $r['code']);
    $r = appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleve['id'], 'avant' => ['cours' => ['chapitres' => ['3e-THA', '3e-PYT']]], 'ajouts' => new stdClass()], ['jeton' => $jetonS1]);
    egal(200, $r['code'], '« avant » rangé autrement : accepté');
    egal(null, bd_test()->query('SELECT ajouts FROM eleves WHERE id = ' . (int)$eleve['id'])->fetchColumn(), 'retiré : la colonne revient à rien');
    // En base, abîmé (une vieille page, un script) : jamais « tout ouvert ».
    foreach (['{"cours":{}}', '{"cours":{"chapitres":[]}}', '{"cours":{"chapitres":"3e-PYT"}}', '{"cours":{"chapitres":["9e-XYZ"]}}', '{"cours":[]}',
        // Correctif après la relecture Codex (point 1) : une forme fausse autour d'un vrai chapitre n'ouvre RIEN.
        '{"cours":{"chapitres":{"inattendu":"3e-PYT"}}}', '{"cours":{"chapitres":["3e-PYT",null,5,{}]}}',
        '{"cours":{"chapitres":["3e-PYT"],"sans":["3e-PYT-02"]}}', '{"cours":{"chapitres":["3e-PYT","3e pyt"]}}', '{"cours":{"chapitres":[["3e-PYT"]]}}'] as $abime) {
        bd_test()->prepare('UPDATE eleves SET ajouts = ? WHERE id = ?')->execute([$abime, $eleve['id']]);
        egal([], chapitres_vus($eleve['code']), "$abime : rien de plus");
    }
    // Un chapitre bien formé mais retiré du livret est seulement oublié : il n'emporte pas les autres.
    bd_test()->prepare('UPDATE eleves SET ajouts = ? WHERE id = ?')->execute(['{"cours":{"chapitres":["3e-PYT","9e-XYZ"]}}', $eleve['id']]);
    egal(['3e-PYT'], chapitres_vus($eleve['code']), 'un chapitre retiré du livret est oublié, les autres restent');
    // Un collègue en écriture ne règle pas les accès (propriétaire seulement) : déjà gardé par les tests de « Qui voit quoi ».
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("cours-appli-3, correctif Codex 2 — la classe sans Cours : ses fiches fermées et ouvertes se règlent seules (sans « applis » ni « chapitres ») et valent pour les élèves qui ont des chapitres en plus", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'P4', 'applis' => ['defi-tables']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $eleve['id'], 'avant' => new stdClass(), 'ajouts' => ['cours' => ['chapitres' => ['4e-PUI']]]], ['jeton' => $jetonS1]);
    $fiches = fn () => array_map(fn ($f) => $f['url'], identite($eleve['code'])['json']['cours'][0]['fiches']);
    $url = fn ($id) => 'https://mathsgo.re/cours/4e/' . $id . '.html#ch=4e-PUI';
    vrai(in_array($url('4e-PUI-02'), $fiches(), true), 'au départ : 4e-PUI-02 ouverte');
    vrai(!in_array($url('4e-PUI-03'), $fiches(), true), 'au départ : 4e-PUI-03 (nouveau programme) fermée');
    $r = appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'avant' => ['applis' => ['defi-tables'], 'reglages' => ['cours' => new stdClass()]],
        'reglages' => ['cours' => ['sans' => ['4e-PUI-02'], 'avec' => ['4e-PUI-03']]]], ['jeton' => $jetonS1]);
    egal(200, $r['code'], 'les fiches seules, la classe sans Cours : ' . $r['texte']);
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'cours'], ['jeton' => $jetonS1]);
    egal(['defi-tables'], $t['json']['classe']['applis'], 'la classe reste sans Cours');
    egal(['cours' => ['sans' => ['4e-PUI-02'], 'avec' => ['4e-PUI-03']]], $t['json']['classe']['reglages'], 'aucun chapitre pour la classe');
    vrai(!in_array($url('4e-PUI-02'), $fiches(), true), 'la fiche fermée l’est pour l’élève en plus');
    vrai(in_array($url('4e-PUI-03'), $fiches(), true), 'la fiche du nouveau programme est ouverte pour lui');
    egal(200, ouvrir_fiche($eleve['code'], '/cours/4e/4e-PUI-03.html')['code'], 'et son ouverture se note');
    egal(400, ouvrir_fiche($eleve['code'], '/cours/4e/4e-PUI-02.html')['code'], 'pas celle de la fiche fermée');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("cours-appli-3 — api/cours.php note l'ouverture d'une fiche ouverte EN PLUS ; refuse une fiche que l'élève n'a pas (un autre élève, une fiche fermée à la classe, un chapitre en plus d'un autre) ; un élève ne peut pas s'ouvrir un cours", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'P3', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    [$a, $b] = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-PYT'], 'sans' => ['4e-PUI-02']]]], ['jeton' => $jetonS1]);
    appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $a['id'], 'avant' => new stdClass(), 'ajouts' => ['cours' => ['chapitres' => ['4e-PUI']]]], ['jeton' => $jetonS1]);
    egal(200, ouvrir_fiche($a['code'], '/cours/4e/4e-PUI-01.html')['code'], 'sa fiche en plus : notée');
    egal([['eleve_id' => $a['id'], 'fiche' => '4e-PUI-01', 'jour' => jour_reunion()]], ouvertures_en_base($a['id']));
    egal(400, ouvrir_fiche($b['code'], '/cours/4e/4e-PUI-01.html')['code'], 'l’autre élève n’a pas ce chapitre : refusé');
    egal(400, ouvrir_fiche($a['code'], '/cours/4e/4e-PUI-02.html')['code'], 'fermée à la classe : refusée aussi en plus');
    egal([], ouvertures_en_base($b['id']), 'rien pour l’autre');
    // L'élève ne peut rien s'ouvrir lui-même : aucune API élève n'écrit les ajouts.
    $r = appel('/api/eleve.php', ['code' => $b['code'], 'ajouts' => ['cours' => ['chapitres' => ['4e-PUI']]]]);
    vrai(in_array($r['code'], [200, 400], true), 'api/eleve.php ignore ou refuse');
    egal(null, bd_test()->query('SELECT ajouts FROM eleves WHERE id = ' . (int)$b['id'])->fetchColumn(), 'rien d’écrit pour lui');
    egal(401, appel('/api/prof.php', ['action' => 'eleves.acces', 'eleve_id' => $b['id'], 'avant' => new stdClass(), 'ajouts' => ['cours' => ['chapitres' => ['4e-PUI']]]])['code'], 'sans session prof : refusé');
    egal(400, ouvrir_fiche($b['code'], '/cours/4e/4e-PUI-01.html')['code'], 'toujours refusé');
    // Le tableau de l'onglet Cours : son jour d'ouverture, et ce qu'il voit.
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'cours'], ['jeton' => $jetonS1]);
    $parId = array_column($t['json']['eleves'], null, 'id');
    egal(['4e-PUI-01' => jour_reunion()], $parId[$a['id']]['ouvertes']);
    egal(['4e-PUI', '3e-PYT'], $parId[$a['id']]['acces']['reglages']['cours']['chapitres']);
    egal(['3e-PYT'], $parId[$b['id']]['acces']['reglages']['cours']['chapitres']);
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

// ------------------------------------------ les ouvertures de fiches (lot « cours-ouvertures », 10/11/2026)
//
// Gwenaël : pour chaque élève et chaque fiche, « ouverte le … » (le jour de la
// dernière ouverture) ou rien — ni nombre de fois, ni durée, jamais « lue » ;
// rien pour un visiteur sans code. L'espace élève envoie {code, page} à
// api/cours.php quand l'élève touche une fiche de « Mes cours ».

function ouvrir_fiche(string $code, mixed $page): array
{
    return appel('/api/cours.php', ['code' => $code, 'page' => $page]);
}
function ouvertures_en_base(?int $eleveId = null): array
{
    $sql = 'SELECT eleve_id, fiche, jour FROM cours_ouvertures' . ($eleveId === null ? '' : ' WHERE eleve_id = ' . $eleveId) . ' ORDER BY eleve_id, fiche';
    return bd_test()->query($sql)->fetchAll();
}
function jour_reunion(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Indian/Reunion')))->format('Y-m-d');
}

verifier("cours-ouvertures — toucher une fiche note le jour du serveur (La Réunion), le remplace à l'ouverture suivante, une ligne par élève et par fiche ; l'Entraînement brevet compte ; l'onglet Cours le rend au professeur, et rien d'autre", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'O1', 'applis' => ['defi-tables', 'cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-PYT']]]], ['jeton' => $jetonS1]);
    $code = $eleves[0]['code'];
    $r = ouvrir_fiche($code, '/cours/4e/4e-TRI-03.html');
    egal(200, $r['code'], 'une fiche du chapitre ouvert (commune avec la 4e) : ' . $r['texte']);
    egal(['ok' => true], $r['json'], 'la réponse ne dit rien de plus');
    $jour = jour_reunion();
    egal([['eleve_id' => $eleves[0]['id'], 'fiche' => '4e-TRI-03', 'jour' => $jour]], ouvertures_en_base($eleves[0]['id']), 'le jour de La Réunion, l’identifiant de la fiche');
    // Une ouverture plus ancienne : remplacée, pas ajoutée.
    bd_test()->prepare('UPDATE cours_ouvertures SET jour = ? WHERE eleve_id = ?')->execute(['2026-10-01', $eleves[0]['id']]);
    egal(200, ouvrir_fiche($code, '/cours/4e/4e-TRI-03.html')['code'], 'la même fiche, rouverte');
    egal(200, ouvrir_fiche($code, '/cours/4e/4e-TRI-03.html')['code'], 'et encore');
    egal([['eleve_id' => $eleves[0]['id'], 'fiche' => '4e-TRI-03', 'jour' => $jour]], ouvertures_en_base($eleves[0]['id']), 'une seule ligne, le jour remplacé, pas de compte');
    egal(200, ouvrir_fiche($code, '/cours/3e/3e-PYT-brevet.html')['code'], 'l’Entraînement brevet');
    // La table ne garde QUE l'élève, la fiche et le jour.
    $colonnes = array_keys(bd_test()->query('SELECT * FROM cours_ouvertures LIMIT 1')->fetch());
    egal(['eleve_id', 'fiche', 'jour'], $colonnes, 'ni heure, ni nombre, ni durée');
    // L'onglet Cours de Ma classe : le jour par fiche, pour chaque élève.
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'cours'], ['jeton' => $jetonS1]);
    egal(200, $t['code'], 'le tableau de l’onglet Cours');
    $parId = array_column($t['json']['eleves'], null, 'id');
    egal(['3e-PYT-brevet' => $jour, '4e-TRI-03' => $jour], $parId[$eleves[0]['id']]['ouvertes'], 'ses deux fiches, et leur jour');
    vrai(str_contains($t['texte'], '"ouvertes":{}'), 'l’autre élève : un objet vide, pas une liste');
    // Les autres onglets n'en savent rien.
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'defi-tables'], ['jeton' => $jetonS1]);
    vrai(!str_contains($t['texte'], '"ouvertes"'), 'Défi tables : pas de jours d’ouverture');
    // Ce que voit l'élève de lui-même n'a pas changé : api/eleve.php ne rend aucun jour.
    vrai(!str_contains(identite($code)['texte'], $jour), 'l’espace élève ne montre aucun jour');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("cours-ouvertures — rien n'est noté pour une fiche que l'élève ne voit pas (fermée, chapitre fermé, imprimable, adresse complète ou bricolée), ni sans le Cours, ni sans code, ni par GET", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'O2', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['3e-PYT'], 'sans' => ['3e-PYT-02', '3e-PYT-brevet']]]], ['jeton' => $jetonS1]);
    $avant = count(ouvertures_en_base());
    foreach ([
        '/cours/3e/3e-PYT-02.html' => 'une fiche fermée par le professeur',
        '/cours/3e/3e-PYT-brevet.html' => 'le brevet fermé',
        '/cours/3e/3e-THA-01.html' => 'une fiche d’un chapitre fermé',
        '/cours/3e/3e-PYT-imprimable.html' => 'la version imprimable (pas une fiche)',
        'https://mathsgo.re/cours/4e/4e-TRI-01.html' => 'l’adresse complète',
        '/cours/4e/4e-TRI-01.html#ch=3e-PYT' => 'avec l’ancre',
        '/cours/4e/../4e/4e-TRI-01.html' => 'un chemin bricolé',
        '/cours/4e/4e-TRI-99.html' => 'une fiche qui n’existe pas',
        '' => 'vide',
    ] as $page => $quoi) {
        $r = ouvrir_fiche($eleve['code'], $page);
        egal(400, $r['code'], "$quoi : refusé");
    }
    egal(400, ouvrir_fiche($eleve['code'], ['/cours/4e/4e-TRI-01.html'])['code'], 'une liste : refusé');
    egal(400, ouvrir_fiche($eleve['code'], str_repeat('a', 200))['code'], 'trop long : refusé');
    egal(400, appel('/api/cours.php', ['code' => $eleve['code']])['code'], 'sans page : refusé');
    egal(400, ouvrir_fiche('AB', '/cours/4e/4e-TRI-01.html')['code'], 'code mal formé');
    egal(404, ouvrir_fiche(code_inconnu(7), '/cours/4e/4e-TRI-01.html')['code'], 'code inconnu');
    egal(405, appel('/api/cours.php', null)['code'], 'GET : refusé');
    egal($avant, count(ouvertures_en_base()), 'rien d’écrit');
    // La classe sans le Cours : 403, rien d'écrit.
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'applis' => ['defi-tables']], ['jeton' => $jetonS1]);
    egal(403, ouvrir_fiche($eleve['code'], '/cours/4e/4e-TRI-01.html')['code'], 'sans l’appli Cours : refusé');
    egal($avant, count(ouvertures_en_base()), 'toujours rien');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("cours-ouvertures — les jours partent avec l'élève et avec la classe ; sans la table (avant migrer.php), rien ne tombe en panne et migrer.php la crée", function () use (&$jetonS1, $travail) {
    // verifier.php a été retiré de la copie par un test plus haut (audit
    // Codex 1) : on le remet le temps de ce test.
    copy(dirname(__DIR__) . '/public/verifier.php', $travail . '/verifier.php');
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'O3', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['4e-TRI']]]], ['jeton' => $jetonS1]);
    foreach ($eleves as $e) egal(200, ouvrir_fiche($e['code'], '/cours/4e/4e-TRI-01.html')['code']);
    egal(200, appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $eleves[0]['id']], ['jeton' => $jetonS1])['code']);
    egal([], ouvertures_en_base($eleves[0]['id']), 'l’élève supprimé : ses jours partent');
    egal(1, count(ouvertures_en_base($eleves[1]['id'])), 'l’autre garde les siens');
    egal(200, appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1])['code']);
    egal([], ouvertures_en_base($eleves[1]['id']), 'la classe supprimée : plus rien');
    // Avant migrer.php : la table n'existe pas.
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'O4', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['4e-TRI']]]], ['jeton' => $jetonS1]);
    bd_test()->exec('DROP TABLE cours_ouvertures');
    $r = ouvrir_fiche($eleve['code'], '/cours/4e/4e-TRI-01.html');
    egal(503, $r['code'], 'sans la table : 503');
    vrai(str_contains($r['json']['erreur'] ?? '', 'migrer.php'), 'le message dit quoi faire');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'cours'], ['jeton' => $jetonS1]);
    egal(200, $t['code'], 'l’onglet Cours s’ouvre quand même');
    vrai(str_contains($t['texte'], '"ouvertes":{}'), 'sans aucun jour');
    egal(200, appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $eleve['id']], ['jeton' => $jetonS1])['code'], 'supprimer un élève marche sans la table');
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'manque la table « cours_ouvertures »'), 'verifier.php la réclame');
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'Table « cours_ouvertures » créée'), 'migrer.php annonce la table créée');
    $r = formulaire('/migrer.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(!str_contains($r['texte'], 'cours_ouvertures'), 'un second passage n’annonce plus rien');
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'Ouvertures des fiches (Mes cours)') && str_contains($r['texte'], 'en place'), 'verifier.php : la ligne est verte');
    // La clé unique est bien là (une seconde ouverture remplace).
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    egal(200, ouvrir_fiche($eleve['code'], '/cours/4e/4e-TRI-01.html')['code']);
    egal(200, ouvrir_fiche($eleve['code'], '/cours/4e/4e-TRI-01.html')['code']);
    egal(1, count(ouvertures_en_base($eleve['id'])), 'une ligne après migrer.php aussi');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    @unlink($travail . '/verifier.php');
    vider_compteurs();
});

verifier("cours-ouvertures — l'espace élève note l'ouverture (fiches et brevet, sendBeacon) ; Ma classe montre « Ouverte le » ; la page Infos le dit ; le survol des cartes seulement à la souris", function () {
    $eleve = page('/')['texte'];
    vrai(str_contains($eleve, 'function noterOuverture(url)') && str_contains($eleve, 'navigator.sendBeacon("api/cours.php"'), 'l’espace élève envoie l’ouverture');
    vrai(substr_count($eleve, 'suivreOuverture(') >= 3, 'les fiches et le brevet sont suivis');
    $lignes = explode("\n", $eleve);
    foreach ($lignes as $i => $ligne) {
        if (!str_contains($ligne, ':hover')) continue;
        vrai(str_contains($ligne, '@media (hover: hover)') || str_contains($lignes[$i - 1] ?? '', '@media (hover: hover)'),
            'un survol hors @media (hover: hover) : ' . trim($ligne));
    }
    vrai(substr_count($eleve, '@media (hover: hover)') >= 3, 'les survols sont sous @media (hover: hover)');
    $prof = page('/prof/')['texte'];
    // Lot « cours-appli-2 » (13/11/2026) : l'onglet Cours devient un résumé ; la phrase dit ce qui est gardé.
    vrai(str_contains($prof, 'Pour chaque élève et chaque fiche, seul le dernier jour où la fiche a été ouverte depuis « Mes cours » est gardé. Ouvrir une fiche n’est pas la lire.'), 'Ma classe dit ce qui est gardé');
    vrai(str_contains($prof, 'const coin = el("th", "", "Ouverte le");'), 'la grille « Ouverte le » reste, à déplier');
    vrai(!str_contains($prof, 'on ne sait pas qui a ouvert quoi'), 'l’ancienne phrase est partie');
    vrai(!preg_match('/\blue\b/u', substr($prof, strpos($prof, 'function tableauOuvertures'), 2500)), 'jamais « lue »');
    $infos = page('/infos.php')['texte'];
    vrai(str_contains($infos, 'Dans « Mes cours », seulement le jour où tu as ouvert chaque fiche pour la dernière fois'), 'Infos : la phrase pour l’élève');
    vrai(str_contains($infos, 'Pour les cours, seul le jour de la dernière ouverture de chaque fiche est conservé'), 'Infos : la phrase pour les familles');
});

// Correctif « cours-ouvertures » après la relecture Codex du 11/11/2026.

verifier("cours-ouvertures, correctif Codex 1 — une page mal formée n'écrit RIEN, même avec des codes inventés tous différents ; un code inconnu compte toujours un échec pour l'adresse ; la limite par code ne vise que les vrais codes", function () use (&$jetonS1) {
    vider_compteurs();
    for ($i = 0; $i < 40; $i++) {
        $corps = match ($i % 3) {
            0 => ['code' => code_inconnu(500 + $i)],
            1 => ['code' => code_inconnu(500 + $i), 'page' => ['/cours/4e/4e-TRI-01.html']],
            default => ['code' => code_inconnu(500 + $i), 'page' => str_repeat('x', 300)],
        };
        egal(400, appel('/api/cours.php', $corps)['code'], "demande $i : refusée");
    }
    egal([], compteurs(), 'quarante codes inventés, pages mal formées : aucun compteur écrit');
    // Un code inconnu avec une page bien formée : un échec pour l'adresse,
    // et aucun compteur à son nom.
    egal(404, ouvrir_fiche(code_inconnu(900), '/cours/4e/4e-TRI-01.html')['code']);
    $lignes = compteurs();
    egal(1, count($lignes), 'une seule ligne : l’échec de l’adresse');
    egal(cle_compteur_test('echec-ip:127.0.0.1', 300), $lignes[0]['cle'], 'c’est bien l’échec de l’adresse');
    // Un vrai code : sa limite est comptée.
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'O5', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleve = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'][0];
    appel('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'reglages' => ['cours' => ['chapitres' => ['4e-TRI']]]], ['jeton' => $jetonS1]);
    vider_compteurs();
    egal(200, ouvrir_fiche($eleve['code'], '/cours/4e/4e-TRI-01.html')['code']);
    egal([cle_compteur_test('cours:' . $eleve['code'], 300)], array_column(compteurs(), 'cle'), 'la limite du vrai code');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("cours-ouvertures, correctif Codex 2 — l'écriture reprend l'élève sous verrou et n'écrit rien s'il a disparu ; les suppressions effacent les ouvertures APRÈS l'élève", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'O6', 'applis' => ['cours']], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    // L'entrelacement de Codex, rejoué à la main : la demande a lu l'élève,
    // le professeur le supprime, puis la demande écrit.
    egal(200, appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $eleves[0]['id']], ['jeton' => $jetonS1])['code']);
    vrai(noter_ouverture_cours(bd_test(), (int)$eleves[0]['id'], '4e-TRI-01', '2026-11-11') === false, 'élève disparu : rien d’écrit');
    egal([], ouvertures_en_base((int)$eleves[0]['id']), 'aucune ligne recréée');
    vrai(noter_ouverture_cours(bd_test(), (int)$eleves[1]['id'], '4e-TRI-01', '2026-11-11') === true, 'élève présent : écrit');
    egal(1, count(ouvertures_en_base((int)$eleves[1]['id'])));
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    egal([], ouvertures_en_base((int)$eleves[1]['id']), 'la classe supprimée emporte la ligne');
    // L'ordre qui ferme la course, des deux côtés.
    $prof = file_get_contents(dirname(__DIR__) . '/public/api/prof.php');
    $bloc = substr($prof, strpos($prof, "case 'eleves.supprimer':"), 2500);
    vrai(strpos($bloc, "DELETE FROM eleves WHERE id = ?") < strpos($bloc, 'oublier_cours_de_l_eleve('), 'eleves.supprimer : l’élève d’abord, ses ouvertures ensuite');
    $archives = file_get_contents(dirname(__DIR__) . '/public/lib/archives.php');
    $bloc = substr($archives, strpos($archives, 'function effacer_classe_dans_la_transaction'), 3000);
    vrai(strpos($bloc, "DELETE FROM eleves WHERE classe_id = ?") < strpos($bloc, 'oublier_cours_de_l_eleve('), 'la classe : les élèves d’abord, leurs ouvertures ensuite');
    $cours = file_get_contents(dirname(__DIR__) . '/public/lib/cours.php');
    $bloc = substr($cours, strpos($cours, 'function noter_ouverture_cours'), 1200);
    vrai(str_contains($bloc, 'transaction_ouvrir($pdo)') && str_contains($bloc, "SELECT id FROM eleves WHERE id = ?' . pour_mise_a_jour(\$pdo)"), 'l’élève est repris sous verrou dans la transaction');
    vider_compteurs();
});

// Lot B2 « Ta liste dans Ma classe » (21/11/2026) : la liste du jour de Mon
// espace, rangée dans classes.reglages sous « jour ». Écrite par
// classes.modifier (propriétaire), lue strictement à l'écriture, avec
// indulgence à la lecture ; jamais effacée par les réglages d'une appli ;
// taillée quand une porte se ferme ; rendue à l'élève avec ses données.
$classeB2 = null;
// Correctif (relecture Codex, point 12) : « jour » part toujours avec
// « avant.jour » — la liste rangée telle que la page la connaît.
// Lot B3 : la liste se lit avec ce que quelques élèves ont en plus (leurs
// colonnes ajouts, comme ajouts_de_la_classe).
function ajouts_classe_en_base(int $classeId): array
{
    $lecture = bd_test()->prepare('SELECT ajouts FROM eleves WHERE classe_id = ?');
    $lecture->execute([$classeId]);
    $colonnes = $lecture->fetchAll(PDO::FETCH_COLUMN);
    $lecture->closeCursor();
    return $colonnes;
}
function jour_vu(int $id): array
{
    return jour_de_classe(classe_en_base($id), ajouts_classe_en_base($id));
}
// Comme la carte du lot B3 : « avant » dit aussi les portes qu'elle propose
// (sans elles, le serveur reconnaît une page d'avant le lot — correctif B3,
// point 3 de Codex).
function ecrire_jour(int $id, array $changement, string $jeton): array
{
    return modifier_classe($id, $changement, $jeton, ['jour' => jour_vu($id), 'portes' => portes_de_classe(classe_en_base($id), ajouts_classe_en_base($id))]);
}
function jour_en_base(int $id): ?array
{
    $brut = classe_en_base($id)['reglages'];
    if ($brut === null) return null;
    $json = json_decode($brut, true);
    return array_key_exists('jour', $json) ? $json['jour'] : null;
}

verifier("ma-liste-B2 — jour_recu refuse chaque mauvaise forme (400, message court, rien d'écrit) ; jour_lu est indulgent", function () use (&$jetonS1, &$classeB2) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'B2-405', 'applis' => ['defi-tables', 'splat', 'cours', 'coffres']], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 1], ['jeton' => $jetonS1])['json']['eleves'];
    $classeB2 = ['id' => (int)$id, 'code' => $eleves[0]['code']];
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'defi-tables'], ['jeton' => $jetonS1]);
    egal([], $t['json']['classe']['jour'], 'au départ : automatique (liste vide)');
    egal(null, classe_en_base($id)['reglages'], 'rien d’écrit');
    foreach ([
        ['x', "Liste du jour illisible.", 'une chaîne'],
        [['a' => 'splat'], "Liste du jour illisible.", 'un objet'],
        [[1], "Liste du jour illisible.", 'un nombre'],
        [[['splat']], "Liste du jour illisible.", 'une liste dans la liste'],
        [['defi-tables', 'splat', 'coffres', 'cours'], "Trois étapes au plus.", 'quatre étapes'],
        [['inconnue'], "Activité pas ouverte à la classe.", 'une clé inconnue'],
        [['soley'], "Activité pas ouverte à la classe.", 'une appli fermée au catalogue'],
        [['automatismes'], "Activité pas ouverte à la classe.", 'une appli pas encore ouverte'],
        [['flash-anzan'], "Activité pas ouverte à la classe.", 'une appli que la classe n’a pas'],
        [['splat', 'splat'], "Activité en double.", 'un doublon'],
        [['cours', 'splat'], "Mes cours se met en dernier.", 'Mes cours d’abord'],
        [['defi-tables', 'cours', 'splat'], "Mes cours se met en dernier.", 'Mes cours au milieu'],
    ] as [$jour, $message, $quoi]) {
        $r = ecrire_jour($id, ['jour' => $jour], $jetonS1);
        egal(400, $r['code'], "$quoi : refusé");
        egal($message, $r['json']['erreur'] ?? null, "$quoi : le message");
    }
    egal(null, classe_en_base($id)['reglages'], 'rien n’a été écrit');
    // Les bonnes formes.
    $r = ecrire_jour($id, ['jour' => ['defi-tables', 'splat']], $jetonS1);
    egal(200, $r['code'], 'liste de deux — ' . $r['texte']);
    egal(['defi-tables', 'splat'], $r['json']['jour'], 'la réponse porte la liste');
    egal('{"jour":["defi-tables","splat"]}', classe_en_base($id)['reglages'], 'rangée sous « jour »');
    // Lot B3 : Mes cours n'est une porte que si un chapitre est ouvert (à la
    // classe, ou à un élève en plus) — sans chapitre, aucun élève ne la voit.
    $r = ecrire_jour($id, ['jour' => ['defi-tables', 'splat', 'cours']], $jetonS1);
    egal([400, "Activité pas ouverte à la classe."], [$r['code'], $r['json']['erreur'] ?? null], 'Mes cours sans aucun chapitre ouvert : refusée');
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => ['4e-TRI']]]], $jetonS1)['code'], 'un chapitre ouvert à la classe');
    egal(200, ecrire_jour($id, ['jour' => ['defi-tables', 'splat', 'cours']], $jetonS1)['code'], 'liste de trois, Mes cours au bout');
    $t = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'defi-tables'], ['jeton' => $jetonS1]);
    egal(['defi-tables', 'splat', 'cours'], $t['json']['classe']['jour'], 'tableau rend la liste');
    egal(200, ecrire_jour($id, ['jour' => ['cours']], $jetonS1)['code'], 'Mes cours seule');
    egal(200, ecrire_jour($id, ['jour' => []], $jetonS1)['code'], 'liste vide = automatique');
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => []]]], $jetonS1)['code'], 'le chapitre refermé');
    egal(null, classe_en_base($id)['reglages'], 'automatique : rien d’écrit');
    // jour_lu : indulgent, jamais dans le sens d'ajouter.
    $classe = ['defi-tables', 'splat', 'cours'];
    egal([], jour_lu(null, $classe));
    egal([], jour_lu('pas du json', $classe));
    egal([], jour_lu('{"jour":"splat"}', $classe));
    egal([], jour_lu('{"jour":{"a":"splat"}}', $classe));
    egal(['defi-tables', 'splat'], jour_lu('{"jour":["defi-tables",3,"inconnue","soley","splat","splat"]}', $classe), 'le faux est sauté');
    egal(['splat'], jour_lu('{"jour":["coffres","splat"]}', $classe), 'une porte fermée à la classe sort');
    egal(['defi-tables', 'splat'], jour_lu('{"jour":["cours","defi-tables","splat"]}', $classe), 'Mes cours ailleurs qu’au bout : sautée');
    egal(['defi-tables', 'splat', 'cours'], jour_lu('{"jour":["defi-tables","splat","cours","coffres"]}', $classe + [3 => 'coffres']), 'trois au plus');
    egal([], reglages_lus('{"jour":["defi-tables"]}'), 'reglages_lus ne la prend pas pour une appli');
});

verifier("ma-liste-B2 — régler une appli GARDE la liste (le piège de reglages_recus) ; « avant » périmé → 409 avec la liste vraie", function () use (&$jetonS1, &$classeB2) {
    vider_compteurs();
    $id = $classeB2['id'];
    egal(200, modifier_classe($id, ['jour' => ['defi-tables', 'splat']], $jetonS1, ['jour' => []])['code'], 'la liste, avec son « avant »');
    // Régler les mondes de SPLAT! (comme la fenêtre « Régler SPLAT! ») : la liste reste.
    $r = modifier_classe($id, ['applis' => ['defi-tables', 'splat', 'cours', 'coffres'], 'reglages' => ['splat' => ['mondes' => [1, 2]]]], $jetonS1,
        ['applis' => ['defi-tables', 'splat', 'cours', 'coffres'], 'reglages' => ['splat' => new stdClass()]]);
    egal(200, $r['code'], 'les mondes réglés — ' . $r['texte']);
    egal('{"jour":["defi-tables","splat"],"splat":{"mondes":[1,2]}}', classe_en_base($id)['reglages'], 'la liste est toujours là, à côté des mondes');
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => ['4e-TRI']]]], $jetonS1)['code'], 'les cours réglés');
    egal(['defi-tables', 'splat'], jour_en_base($id), 'la liste est toujours là');
    egal(200, modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2, 3, 4, 5, 6]]]], $jetonS1)['code'], 'tous les mondes rouverts');
    egal('{"jour":["defi-tables","splat"],"cours":{"chapitres":["4e-TRI"]}}', classe_en_base($id)['reglages'], 'et toujours là');
    // Renommer : la liste ne bouge pas.
    egal(200, modifier_classe($id, ['libelle' => 'B2-405'], $jetonS1)['code']);
    egal(['defi-tables', 'splat'], jour_en_base($id));
    // Les réglages d'une appli changés en gardant la liste : la liste dans
    // « avant » n'est pas un conflit tant qu'elle est vraie.
    egal(200, modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1]]]], $jetonS1, ['jour' => ['defi-tables', 'splat'], 'reglages' => ['splat' => new stdClass()]])['code']);
    // « avant » périmé : un autre onglet a changé la liste.
    bd_test()->exec('DELETE FROM journal');
    $r = modifier_classe($id, ['jour' => ['splat', 'cours']], $jetonS1, ['jour' => ['defi-tables']]);
    egal(409, $r['code'], 'un « avant » qui ne dit pas la liste rangée : refusé');
    egal(['defi-tables', 'splat'], $r['json']['jour'], 'la liste vraie part avec le refus');
    egal(['defi-tables', 'splat'], jour_en_base($id), 'rien d’écrit');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'classes.modifier'")->fetchColumn(), 'pas de journal');
    // L'ordre compte : ce n'est pas la même liste.
    egal(409, modifier_classe($id, ['jour' => ['cours']], $jetonS1, ['jour' => ['splat', 'defi-tables']])['code'], 'dans l’autre ordre : ce n’est pas la même liste');
    // Un « avant » de liste illisible : 400.
    foreach ([['jour' => 'splat'], ['jour' => [1]], ['jour' => ['a' => 'b']], ['jour' => ['a', 'b', 'c', 'd']]] as $avant) {
        egal(400, modifier_classe($id, ['jour' => []], $jetonS1, $avant)['code'], '« avant » illisible : ' . json_encode($avant));
    }
    egal(200, modifier_classe($id, ['jour' => ['splat', 'cours']], $jetonS1, ['jour' => ['defi-tables', 'splat']])['code'], 'avec le bon « avant » : écrit');
    egal(['splat', 'cours'], jour_en_base($id));
});

verifier("ma-liste-B2 — fermer une porte à la classe la TAILLE dans la même écriture ; une liste et des applis dans le même appel", function () use (&$jetonS1, &$classeB2) {
    vider_compteurs();
    $id = $classeB2['id'];
    egal(200, ecrire_jour($id, ['jour' => ['defi-tables', 'splat', 'cours']], $jetonS1)['code']);
    $avantMondes = json_decode(classe_en_base($id)['reglages'], true)['splat'];
    // « Régler SPLAT! » décoche la classe : SPLAT! sort de la liste, les mondes restent rangés.
    $r = modifier_classe($id, ['applis' => ['defi-tables', 'cours', 'coffres']], $jetonS1, ['applis' => ['defi-tables', 'splat', 'cours', 'coffres']]);
    egal(200, $r['code'], 'SPLAT! retiré — ' . $r['texte']);
    egal(['defi-tables', 'cours'], $r['json']['jour'], 'la réponse dit la liste taillée');
    egal(['defi-tables', 'cours'], jour_en_base($id), 'taillée en base, dans la même écriture');
    egal($avantMondes, json_decode(classe_en_base($id)['reglages'], true)['splat'], 'décocher garde les réglages de l’appli (la recocher les retrouve)');
    // Recocher ne la remet pas dans la liste (elle en est sortie pour de bon).
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat', 'cours', 'coffres']], $jetonS1)['code']);
    egal(['defi-tables', 'cours'], jour_en_base($id));
    // Toutes les portes de la liste fermées : automatique, la clé disparaît.
    egal(200, ecrire_jour($id, ['jour' => ['coffres']], $jetonS1)['code']);
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat', 'cours']], $jetonS1)['code']);
    egal(null, jour_en_base($id), 'la liste vide n’est pas écrite');
    // La lecture filtre aussi (une ligne écrite à la main, un vieux format).
    bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?')->execute(['{"jour":["coffres","splat"]}', $id]);
    egal(['splat'], appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'splat'], ['jeton' => $jetonS1])['json']['classe']['jour'], 'Coffres pas ouvert à la classe : lu sans');
    // La liste ET les applis dans le même appel : vérifiée contre les applis écrites.
    egal(400, ecrire_jour($id, ['applis' => ['defi-tables'], 'jour' => ['splat']], $jetonS1)['code'], 'SPLAT! retiré dans le même appel : la liste est refusée');
    $r = ecrire_jour($id, ['applis' => ['defi-tables', 'coffres'], 'jour' => ['coffres']], $jetonS1);
    egal(200, $r['code'], 'Coffres ouvert dans le même appel : la liste tient');
    egal(['coffres'], jour_en_base($id));
    egal('defi-tables,coffres', classe_en_base($id)['applis']);
    // Ce qui n'est pas envoyé est relu sous le verrou : enregistrer la liste
    // seule ne remet ni un nom ni des applis d'avant.
    egal(200, ecrire_jour($id, ['jour' => ['defi-tables']], $jetonS1)['code']);
    egal(['B2-405', 'defi-tables,coffres'], [classe_en_base($id)['libelle'], classe_en_base($id)['applis']], 'nom et applis tels quels');
    // Remise en état.
    egal(200, ecrire_jour($id, ['applis' => ['defi-tables', 'splat', 'cours', 'coffres'], 'jour' => ['defi-tables', 'splat']], $jetonS1)['code']);
    egal(['defi-tables', 'splat'], jour_en_base($id));
});

verifier("ma-liste-B2 — un collègue (voir seulement, voir et modifier) ne peut rien écrire ; il voit la liste", function () use (&$jetonS1, &$classeB2) {
    vider_compteurs();
    $id = $classeB2['id'];
    $tmp = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'collegue-b2'], ['jeton' => $jetonS1])['json']['motdepasse'];
    $jc = connexion('collegue-b2', $tmp)['json']['jeton'];
    appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => $tmp, 'nouveau' => 'liste-du-jour-2026'], ['jeton' => $jc]);
    $idc = null;
    foreach (appel('/api/prof.php', ['action' => 'profs.liste'], ['jeton' => $jetonS1])['json']['profs'] as $pr) {
        if ($pr['identifiant'] === 'collegue-b2') $idc = $pr['id'];
    }
    $avant = classe_en_base($id)['reglages'];
    foreach (['lecture', 'ecriture'] as $droit) {
        appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $id, 'prof_id' => $idc], ['jeton' => $jetonS1]);
        egal(200, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $id, 'prof_id' => $idc, 'droit' => $droit], ['jeton' => $jetonS1])['code'], "partage en $droit");
        egal(403, modifier_classe($id, ['jour' => ['splat']], $jc)['code'], "un collègue en $droit ne change pas la liste");
        egal(403, modifier_classe($id, ['jour' => []], $jc, ['jour' => ['defi-tables', 'splat']])['code'], "ni avec « avant »");
        egal(403, modifier_classe($id, ['jour' => ['@aucun']], $jc, ['jour' => ['defi-tables', 'splat']])['code'], "ni « Aucun » (lot B3)");
        $vu = appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'defi-tables'], ['jeton' => $jc]);
        egal(200, $vu['code'], "un collègue en $droit ouvre le tableau — " . $vu['texte']);
        egal(['defi-tables', 'splat'], $vu['json']['classe']['jour'] ?? null, "un collègue en $droit voit la liste");
    }
    egal($avant, classe_en_base($id)['reglages'], 'rien n’a bougé');
    appel('/api/prof.php', ['action' => 'partages.supprimer', 'classe_id' => $id, 'prof_id' => $idc], ['jeton' => $jetonS1]);
});

verifier("ma-liste-B2 — l'élève reçoit « jour » par son code (vide quand c'est automatique) ; pas au billet d'entrée", function () use (&$jetonS1, &$classeB2) {
    vider_compteurs();
    $id = $classeB2['id'];
    $e = identite($classeB2['code']);
    egal(200, $e['code']);
    egal(['defi-tables', 'splat'], $e['json']['jour'], 'par le code');
    egal(200, ecrire_jour($id, ['jour' => []], $jetonS1)['code']);
    egal([], identite($classeB2['code'])['json']['jour'], 'automatique : une liste vide');
    // Lot B3 : Mes cours demande un chapitre ouvert (la ligne écrite à la main
    // plus haut avait emporté ceux de la classe).
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => ['4e-TRI']]]], $jetonS1)['code']);
    egal(200, ecrire_jour($id, ['jour' => ['splat', 'cours']], $jetonS1)['code']);
    egal(['splat', 'cours'], identite($classeB2['code'])['json']['jour']);
    // Une porte fermée à la classe n'arrive pas chez l'élève, même rangée à la main.
    bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?')->execute(['{"jour":["flash-anzan","splat"]}', $id]);
    egal(['splat'], identite($classeB2['code'])['json']['jour'], 'Anzan n’est pas à la classe : il n’arrive pas');
    $billet = appel('/api/eleve.php', ['code' => $classeB2['code'], 'billet' => true])['json']['billet'];
    $r = echanger($billet);
    egal(200, $r['code']);
    vrai(!array_key_exists('jour', $r['json']), 'le billet d’entrée (les applis) ne la porte pas : seule Mon espace s’en sert');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("ma-liste-B2, correctif Codex — « avant.jour » exigé ; « {} » et {\"0\": …} ne sont pas des listes ; une porte fermée ailleurs → 409 ; une ligne incohérente ne fait pas revenir une étape ; un champ null n'est pas envoyé", function () use (&$jetonS1) {
    vider_compteurs();
    $id = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'B2-codex', 'applis' => ['defi-tables', 'splat', 'coffres', 'cours']], ['jeton' => $jetonS1])['json']['id'];
    // Point 12 : sans « avant.jour », refusé.
    egal(400, modifier_classe($id, ['jour' => ['splat']], $jetonS1)['code'], 'sans « avant »');
    egal(400, modifier_classe($id, ['jour' => ['splat']], $jetonS1, ['applis' => ['defi-tables', 'splat', 'coffres', 'cours']])['code'], '« avant » sans la liste');
    egal(null, jour_en_base($id), 'rien d’écrit');
    // Point 4 : le corps JSON réel — un objet vide, un objet à clés numériques.
    $brut = fn(string $jour, string $avant) => appel('/api/prof.php',
        '{"action":"classes.modifier","jeton":"' . $jetonS1 . '","classe_id":' . (int)$id . ',"jour":' . $jour . ',"avant":{"jour":' . $avant . '}}', ['jeton' => $jetonS1]);
    egal(200, ecrire_jour($id, ['jour' => ['splat']], $jetonS1)['code'], 'une liste pour commencer');
    foreach (['{}', '{"0":"splat"}', '{"0":"defi-tables","1":"splat"}'] as $objet) {
        $r = $brut($objet, '["splat"]');
        egal(400, $r['code'], "« jour » = $objet : refusé");
        egal("Liste du jour illisible.", $r['json']['erreur'] ?? null, "« jour » = $objet : le message");
    }
    foreach (['{}', '{"0":"splat"}'] as $objet) {
        egal(400, $brut('[]', $objet)['code'], "« avant.jour » = $objet : refusé");
    }
    egal(['splat'], jour_en_base($id), 'la liste n’a pas été effacée');
    egal(200, $brut('[]', '["splat"]')['code'], 'une vraie liste vide, avec le bon « avant » : automatique');
    egal(null, jour_en_base($id));
    // Point 1 : l'onglet A prépare SPLAT!, l'onglet B ferme SPLAT!, A enregistre.
    $avantA = ['applis' => ['defi-tables', 'coffres', 'splat', 'cours'], 'jour' => []];
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'coffres', 'cours']], $jetonS1, ['applis' => ['defi-tables', 'coffres', 'splat', 'cours']])['code'], 'B ferme SPLAT!');
    $r = modifier_classe($id, ['jour' => ['splat', 'cours']], $jetonS1, $avantA);
    egal(409, $r['code'], 'A, en retard : 409 (pas un 400 qui se répète)');
    egal(['defi-tables', 'coffres', 'cours'], $r['json']['applis'], 'A reçoit les portes vraies');
    egal([], $r['json']['jour']);
    // Le même geste sur un état à jour : une vraie demande invalide, 400.
    $r = modifier_classe($id, ['jour' => ['splat']], $jetonS1, ['applis' => ['defi-tables', 'coffres', 'cours'], 'jour' => []]);
    egal([400, "Activité pas ouverte à la classe."], [$r['code'], $r['json']['erreur'] ?? null], 'état à jour, porte fermée : 400');
    // Point 2 : une ligne incohérente (restaurée) — SPLAT! rangé dans la liste mais fermé.
    bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?')->execute(['{"jour":["splat","coffres"]}', $id]);
    egal(['coffres'], jour_vu($id), 'la classe voit Coffres seul');
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'coffres', 'splat', 'cours']], $jetonS1)['code'], 'SPLAT! rouvert, sans liste');
    egal(['coffres'], jour_en_base($id), 'SPLAT! ne revient pas dans la liste, et la ligne est nettoyée');
    // Point 3 : un champ null n'est pas envoyé ; ce qui n'est pas envoyé n'est pas renormalisé.
    egal(200, modifier_classe($id, ['libelle' => null, 'applis' => null, 'reglages' => ['splat' => ['mondes' => [1, 2]]]], $jetonS1)['code']);
    egal(['B2-codex', 'defi-tables,coffres,splat,cours'], [classe_en_base($id)['libelle'], classe_en_base($id)['applis']], 'nom et applis tels quels');
    bd_test()->prepare('UPDATE classes SET applis = ? WHERE id = ?')->execute(['defi-tables,vieille-appli', $id]);
    egal(200, ecrire_jour($id, ['jour' => ['defi-tables']], $jetonS1)['code'], 'la liste seule');
    egal('defi-tables,vieille-appli', classe_en_base($id)['applis'], 'une liste d’applis qu’on ne change pas n’est pas réécrite');
    egal(['defi-tables'], jour_en_base($id));
    egal(['defi-tables'], json_decode(classe_en_base($id)['reglages'], true)['jour']);
    egal(['mondes' => [1, 2]], json_decode(classe_en_base($id)['reglages'], true)['splat'] ?? null, 'les mondes réglés plus haut sont restés');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
});

// Lot B3 « Aujourd'hui : Aucun, et les portes de quelques élèves » (21/11/2026) :
//  - « Aucun » : ["@aucun"], une clé réservée qui n'est pas une appli ; seule,
//    acceptée ; mêlée, 400 ; jamais taillée ; rendue telle quelle à l'élève ;
//  - les portes possibles = celles de la classe + celles que des élèves ont en
//    plus (Mes cours : un chapitre à la classe ou à un élève) ; l'élève ne
//    reçoit que SES portes ; une clé reste tant qu'un élève l'a ;
//  - pas de réécriture croisée : eleves.acces ne réécrit jamais la classe.
$b3 = null;
function tableau_b3(int $id, string $jeton): array
{
    return appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $id, 'appli' => 'defi-tables'], ['jeton' => $jeton])['json'];
}

verifier("aujourdhui-B3 — « Aucun » : [\"@aucun\"] seule est acceptée, mêlée → 400 ; rendue au tableau et à l'élève ; jamais taillée ; « @ » n'ouvre aucune appli", function () use (&$jetonS1, &$b3) {
    vider_compteurs();
    // La clé réservée ne peut pas être une appli, aujourd'hui ni demain.
    egal('@aucun', JOUR_AUCUN);
    foreach (array_keys(CATALOGUE_APPLIS) as $cle) vrai(!str_starts_with((string)$cle, '@'), "aucune clé du catalogue ne commence par « @ » ($cle)");
    vrai(!appli_connue(JOUR_AUCUN) && !appli_ouverte(JOUR_AUCUN), '« @aucun » n’est pas une appli');
    $id = (int)appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'B3-groupe', 'applis' => ['defi-tables', 'splat']], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => 4], ['jeton' => $jetonS1])['json']['eleves'];
    $b3 = ['id' => $id, 'eleves' => $eleves];
    // Mêlée à autre chose, ou une autre clé en « @ » : 400, rien d'écrit.
    foreach ([
        [['@aucun', 'splat'], "« Aucun » ne se mêle pas à une liste."],
        [['splat', '@aucun'], "« Aucun » ne se mêle pas à une liste."],
        [['@aucun', '@aucun'], "« Aucun » ne se mêle pas à une liste."],
        [['@autre'], "Activité pas ouverte à la classe."],
        [['@espace'], "Activité pas ouverte à la classe."],
        [['@AUCUN'], "Activité pas ouverte à la classe."],
        [[' @aucun'], "Activité pas ouverte à la classe."],
    ] as [$jour, $message]) {
        $r = ecrire_jour($id, ['jour' => $jour], $jetonS1);
        egal([400, $message], [$r['code'], $r['json']['erreur'] ?? null], json_encode($jour, JSON_UNESCAPED_UNICODE));
    }
    egal(null, classe_en_base($id)['reglages'], 'rien d’écrit');
    egal(400, modifier_classe($id, ['jour' => ['@aucun']], $jetonS1)['code'], 'sans « avant.jour » : refusé, comme toute liste');
    // La clé réservée n'ouvre rien : ni appli de classe, ni appli en plus.
    // Correctif (Codex, point 12) : refusée, pas filtrée en silence.
    egal(400, modifier_classe($id, ['applis' => ['@aucun', 'defi-tables', 'splat']], $jetonS1)['code']);
    egal('defi-tables,splat', classe_en_base($id)['applis'], 'pas une appli de classe');
    $r = donner((int)$eleves[0]['id'], ['@aucun' => new stdClass()], $jetonS1);
    egal([400, "Application inconnue."], [$r['code'], $r['json']['erreur'] ?? null], 'pas une appli qu’on donne à un élève');
    egal(400, lire($eleves[0]['code'], '@aucun')['code'], 'pas une appli dont on lit ou écrit la progression');
    // Seule : acceptée, rangée telle quelle.
    $r = ecrire_jour($id, ['jour' => ['@aucun']], $jetonS1);
    egal(200, $r['code'], '« Aucun » — ' . $r['texte']);
    egal(['@aucun'], $r['json']['jour'], 'la réponse la porte');
    egal('{"jour":["@aucun"]}', classe_en_base($id)['reglages'], 'rangée sous « jour », la même forme qu’une liste');
    egal(['@aucun'], tableau_b3($id, $jetonS1)['classe']['jour'], 'tableau la rend');
    $e = identite($eleves[0]['code']);
    egal(['@aucun'], $e['json']['jour'], 'l’élève la reçoit telle quelle');
    egal(['defi-tables', 'splat'], array_column($e['json']['applis'], 'cle'), 'ses portes ne changent pas : « Aucun » n’ouvre et ne ferme rien');
    // « avant » : il faut dire ["@aucun"] pour en sortir.
    $r = modifier_classe($id, ['jour' => ['splat']], $jetonS1, ['jour' => []]);
    egal(409, $r['code'], 'une page qui croit « automatique » : refusée');
    egal(['@aucun'], $r['json']['jour'], 'l’état vrai part avec le refus');
    // Jamais taillée : fermer une porte, régler une appli, renommer.
    egal(200, modifier_classe($id, ['applis' => ['defi-tables']], $jetonS1)['code'], 'SPLAT! fermé à la classe');
    egal(['@aucun'], jour_en_base($id), '« Aucun » n’est pas taillé');
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat'], 'reglages' => ['splat' => ['mondes' => [1, 2]]]], $jetonS1)['code']);
    egal('{"jour":["@aucun"],"splat":{"mondes":[1,2]}}', classe_en_base($id)['reglages'], 'régler une appli la garde');
    egal(200, modifier_classe($id, ['libelle' => 'B3-groupe'], $jetonS1)['code']);
    egal(['@aucun'], jour_en_base($id), 'renommer la garde');
    // Lecture indulgente : exactement ["@aucun"], sinon ce n'est pas « Aucun ».
    egal(['@aucun'], jour_lu('{"jour":["@aucun"]}', []), 'même sans aucune porte');
    egal(['splat'], jour_lu('{"jour":["@aucun","splat"]}', ['splat']), 'mêlée (écrite à la main) : la clé réservée est sautée');
    egal([], jour_lu('{"jour":["@aucun","@aucun"]}', ['splat']));
    egal([], jour_lu('{"jour":"@aucun"}', ['splat']));
    egal(['@aucun'], jour_taille(['@aucun'], []), 'jamais taillée');
    egal([], portes_perimees(['@aucun'], ['portes' => ['@aucun', 'splat']], ['splat']), '« Aucun » n’est jamais une porte périmée');
    // Retour à l'automatique, puis à une liste.
    egal(200, modifier_classe($id, ['jour' => []], $jetonS1, ['jour' => ['@aucun'], 'portes' => ['defi-tables', 'splat']])['code'], 'avec le bon « avant » : automatique');
    egal(200, modifier_classe($id, ['reglages' => ['splat' => ['mondes' => [1, 2, 3, 4, 5, 6]]]], $jetonS1)['code']);
    egal(null, classe_en_base($id)['reglages'], 'plus rien d’écrit');
});

verifier("aujourdhui-B3 — les portes de quelques élèves : acceptées dans la liste, rendues à chaque élève réduites à SES portes ; il n'apprend rien des autres", function () use (&$jetonS1, &$b3) {
    vider_compteurs();
    $id = $b3['id'];
    [$e1, $e2, $e3, $e4] = $b3['eleves'];
    // Personne ne l'a : refusé, comme au B2.
    foreach ([['flash-anzan'], ['defi-tables', 'cours']] as $jour) {
        $r = ecrire_jour($id, ['jour' => $jour], $jetonS1);
        egal([400, "Activité pas ouverte à la classe."], [$r['code'], $r['json']['erreur'] ?? null], 'personne ne l’a : ' . json_encode($jour));
    }
    // Le groupe mixte : Anzan pour un élève, des chapitres élève par élève,
    // aucun chapitre pour la classe (elle n'a même pas l'appli Cours).
    egal(200, donner((int)$e1['id'], ['flash-anzan' => new stdClass()], $jetonS1)['code']);
    egal(200, donner((int)$e2['id'], ['cours' => ['chapitres' => ['4e-TRI', '4e-FRA']]], $jetonS1)['code']);
    egal(200, donner((int)$e3['id'], ['cours' => ['chapitres' => ['3e-PYT']]], $jetonS1)['code']);
    egal(['defi-tables', 'flash-anzan', 'splat', 'cours'], portes_de_classe(classe_en_base($id), ajouts_classe_en_base($id)), 'les portes possibles, dans l’ordre du catalogue');
    $r = ecrire_jour($id, ['jour' => ['flash-anzan', 'defi-tables', 'cours']], $jetonS1);
    egal(200, $r['code'], 'la liste avec deux portes de quelques élèves — ' . $r['texte']);
    egal(['flash-anzan', 'defi-tables', 'cours'], $r['json']['jour']);
    egal(['flash-anzan', 'defi-tables', 'cours'], jour_en_base($id));
    egal(['flash-anzan', 'defi-tables', 'cours'], tableau_b3($id, $jetonS1)['classe']['jour'], 'le professeur voit la liste entière');
    // Chaque élève : ses portes seulement.
    $i1 = identite($e1['code']); $i2 = identite($e2['code']); $i4 = identite($e4['code']);
    egal(['flash-anzan', 'defi-tables'], $i1['json']['jour'], 'Anzan en plus, pas de chapitre : elle saute Mes cours');
    egal(['defi-tables', 'cours'], $i2['json']['jour'], 'des chapitres, pas d’Anzan : il saute Anzan');
    egal(['defi-tables'], $i4['json']['jour'], 'rien en plus : la seule étape de la classe');
    vrai(!str_contains($i4['texte'], 'flash-anzan') && !str_contains($i4['texte'], 'Anzan'), 'l’élève sans Anzan n’apprend pas que d’autres l’ont');
    vrai(!str_contains($i4['texte'], '"cours"') && !str_contains($i2['texte'], 'flash-anzan'), 'ni que d’autres ont des chapitres');
    // Une liste faite seulement de portes de quelques élèves : les autres ont
    // une liste vide, donc le mode automatique.
    egal(200, ecrire_jour($id, ['jour' => ['flash-anzan', 'cours']], $jetonS1)['code']);
    egal(['flash-anzan'], identite($e1['code'])['json']['jour']);
    egal(['cours'], identite($e3['code'])['json']['jour']);
    egal([], identite($e4['code'])['json']['jour'], 'aucune de ces étapes : liste vide, le mode automatique');
    // La classe a l'appli Cours SANS chapitre : ce n'est pas une porte pour
    // l'élève qui n'a pas de chapitre à lui (il ne verrait rien).
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat', 'cours']], $jetonS1)['code']);
    vrai(in_array('cours', array_column(identite($e4['code'])['json']['applis'], 'cle'), true), 'l’appli Cours est dans ses applis…');
    egal([], identite($e4['code'])['json']['jour'], '… mais sans chapitre, pas dans sa liste');
    egal(['cours'], identite($e3['code'])['json']['jour']);
    // Un chapitre ouvert à la classe : Mes cours devient la porte de tous.
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => ['4e-REL']]]], $jetonS1)['code']);
    egal(['cours'], identite($e4['code'])['json']['jour']);
    // « Aucun » passe par-dessus les portes de chacun.
    egal(200, ecrire_jour($id, ['jour' => ['@aucun']], $jetonS1)['code']);
    foreach ([$e1, $e2, $e4] as $e) egal(['@aucun'], identite($e['code'])['json']['jour'], '« Aucun » pour toute la classe');
    // Les règles, sans passer par l'API.
    egal(['defi-tables', 'cours'], portes_de_l_eleve(['applis' => ['defi-tables', 'cours'], 'reglages' => ['cours' => ['chapitres' => ['4e-TRI']]]]));
    egal(['defi-tables'], portes_de_l_eleve(['applis' => ['defi-tables', 'cours'], 'reglages' => ['cours' => ['sans' => ['x']]]]), 'Cours sans chapitre : pas une porte');
    egal(['flash-anzan', 'cours'], portes_des_ajouts(['{"flash-anzan":{}}', null, '', 'abîmé', '{"cours":{"chapitres":["4e-TRI"]}}', '{"soley":{}}', '{"cours":{"chapitres":[]}}', '{"cours":{}}'], ['applis' => 'defi-tables']),
        'une appli fermée, un ajout abîmé, des chapitres vides ne font pas une porte');
    egal(['defi-tables', 'splat'], portes_du_jour(['splat', ' defi-tables', 'cours', 'soley', 'inconnue'], [], []), 'ordre du catalogue ; Cours sans chapitre, appli fermée ou inconnue : non');
    egal(['defi-tables', 'cours'], portes_du_jour(['defi-tables', 'cours'], ['cours' => ['chapitres' => ['4e-TRI']]], []));
    egal(['defi-tables', 'coffres', 'cours'], portes_du_jour(['defi-tables'], [], ['cours', 'coffres', 'soley']), 'les portes en plus s’ajoutent (jamais une appli fermée)');
    // Remise en état pour la suite.
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat'], 'reglages' => ['cours' => ['chapitres' => []]]], $jetonS1)['code']);
    egal(200, ecrire_jour($id, ['jour' => []], $jetonS1)['code']);
    egal(null, classe_en_base($id)['reglages']);
});

verifier("aujourdhui-B3 — classes.modifier taille la liste : une clé reste tant qu'un élève l'a en plus ; le dernier chapitre fermé sort Mes cours", function () use (&$jetonS1, &$b3) {
    vider_compteurs();
    $id = $b3['id'];
    [$e1, $e2, $e3, $e4] = $b3['eleves'];
    // Anzan à la classe ET en plus à un élève ; la classe le referme : il reste.
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat', 'flash-anzan']], $jetonS1)['code']);
    egal(200, ecrire_jour($id, ['jour' => ['flash-anzan', 'splat']], $jetonS1)['code']);
    $r = modifier_classe($id, ['applis' => ['defi-tables', 'splat']], $jetonS1, ['applis' => ['defi-tables', 'splat', 'flash-anzan']]);
    egal(200, $r['code'], 'Anzan fermé à la classe — ' . $r['texte']);
    egal(['flash-anzan', 'splat'], $r['json']['jour'], 'un élève l’a encore en plus : l’étape reste');
    egal(['flash-anzan', 'splat'], jour_en_base($id));
    egal(['splat'], identite($e4['code'])['json']['jour'], 'les autres la sautent');
    // SPLAT! fermé à la classe, personne ne l'a en plus : taillé, dans la même écriture.
    $r = modifier_classe($id, ['applis' => ['defi-tables']], $jetonS1);
    egal(['flash-anzan'], $r['json']['jour'], 'SPLAT! sort, Anzan reste');
    egal(['flash-anzan'], jour_en_base($id));
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat', 'cours']], $jetonS1)['code']);
    // Mes cours : un chapitre à la classe, des chapitres à deux élèves.
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => ['4e-REL']]]], $jetonS1)['code']);
    egal(200, ecrire_jour($id, ['jour' => ['defi-tables', 'cours']], $jetonS1)['code']);
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => []]]], $jetonS1)['code'], 'le dernier chapitre de la classe fermé');
    egal(['defi-tables', 'cours'], jour_en_base($id), 'deux élèves ont encore des chapitres : Mes cours reste');
    // Plus aucun élève n'a de chapitre, la classe en rouvre un puis le referme : cette fois elle sort.
    egal(200, donner((int)$e2['id'], new stdClass(), $jetonS1)['code']);
    egal(200, donner((int)$e3['id'], new stdClass(), $jetonS1)['code']);
    egal(['defi-tables', 'cours'], jour_en_base($id), 'eleves.acces ne réécrit pas la classe');
    egal(['defi-tables'], jour_vu($id), 'mais plus personne n’a de chapitre : l’étape a disparu à la lecture');
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => ['4e-REL']]]], $jetonS1)['code'], 'un chapitre rouvert à la classe');
    egal(['defi-tables'], jour_en_base($id), 'une écriture de la classe a rangé la liste telle qu’elle se voyait : Mes cours ne revient pas (correctif B2, point 2)');
    egal(200, ecrire_jour($id, ['jour' => ['defi-tables', 'cours']], $jetonS1)['code']);
    $r = modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => []]]], $jetonS1);
    egal(200, $r['code']);
    egal(['defi-tables'], $r['json']['jour'], 'le dernier chapitre fermé, aucun élève n’en a : Mes cours sort dans la même écriture');
    egal(['defi-tables'], jour_en_base($id));
    // La liste ET les applis dans le même appel : une porte d'élève tient.
    $r = ecrire_jour($id, ['applis' => ['defi-tables'], 'jour' => ['flash-anzan', 'defi-tables']], $jetonS1);
    egal(200, $r['code'], 'Anzan (un élève) et Défi tables (la classe), les applis changées dans le même appel — ' . $r['texte']);
    egal(400, ecrire_jour($id, ['applis' => ['defi-tables'], 'jour' => ['splat']], $jetonS1)['code'], 'SPLAT! fermé dans le même appel, personne ne l’a : refusé');
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat']], $jetonS1)['code']);
});

verifier("aujourdhui-B3 — pas de réécriture croisée : eleves.acces ne touche pas la classe ; l'étape disparaît à la lecture et revient avec la porte ; une page en retard → 409 avec les portes vraies", function () use (&$jetonS1, &$b3) {
    vider_compteurs();
    $id = $b3['id'];
    [$e1, $e2, $e3, $e4] = $b3['eleves'];
    egal(200, ecrire_jour($id, ['jour' => ['flash-anzan', 'defi-tables']], $jetonS1)['code']);
    $colonne = classe_en_base($id)['reglages'];
    // Anzan retiré au dernier élève qui l'avait.
    egal(200, donner((int)$e1['id'], new stdClass(), $jetonS1)['code']);
    egal($colonne, classe_en_base($id)['reglages'], 'la ligne de la classe n’a pas été réécrite');
    egal(['defi-tables'], tableau_b3($id, $jetonS1)['classe']['jour'], 'le professeur ne voit plus l’étape');
    egal(['defi-tables'], identite($e1['code'])['json']['jour'], 'l’élève non plus');
    // Redonné, à un AUTRE élève : l'étape revient, à sa place.
    egal(200, donner((int)$e2['id'], ['flash-anzan' => new stdClass()], $jetonS1)['code']);
    egal(['flash-anzan', 'defi-tables'], tableau_b3($id, $jetonS1)['classe']['jour'], 'la porte redonnée : l’étape revient');
    egal(['flash-anzan', 'defi-tables'], identite($e2['code'])['json']['jour']);
    egal(['defi-tables'], identite($e1['code'])['json']['jour'], 'pas pour celle qui ne l’a plus');
    egal($colonne, classe_en_base($id)['reglages'], 'toujours pas réécrite');
    // L'onglet A a préparé une liste avec Anzan ; ailleurs, Anzan est retiré
    // au dernier élève ; A enregistre : 409 avec l'état vrai, pas un 400 qui se répète.
    $portesA = ['defi-tables', 'flash-anzan', 'splat'];
    egal(200, donner((int)$e2['id'], new stdClass(), $jetonS1)['code']);
    bd_test()->exec('DELETE FROM journal');
    $r = modifier_classe($id, ['jour' => ['flash-anzan', 'splat']], $jetonS1, ['jour' => ['defi-tables'], 'applis' => ['defi-tables', 'splat'], 'portes' => $portesA]);
    egal(409, $r['code'], 'A, en retard sur les portes : 409 — ' . $r['texte']);
    egal(['defi-tables', 'splat'], $r['json']['portes'] ?? null, 'les portes vraies partent avec le refus');
    egal(['defi-tables'], $r['json']['jour'], 'et la liste vraie');
    vrai(!str_contains($r['texte'], 'eleve') && !str_contains($r['texte'], 'prenom'), 'aucun élève nommé dans le refus');
    egal($colonne, classe_en_base($id)['reglages'], 'rien d’écrit');
    egal(0, (int)bd_test()->query("SELECT COUNT(*) FROM journal WHERE action = 'classes.modifier'")->fetchColumn(), 'pas de journal');
    // Le même geste sur un état à jour (la carte ne proposait pas Anzan) : une vraie demande invalide.
    $r = modifier_classe($id, ['jour' => ['flash-anzan', 'splat']], $jetonS1, ['jour' => ['defi-tables'], 'portes' => ['defi-tables', 'splat']]);
    egal([400, "Activité pas ouverte à la classe."], [$r['code'], $r['json']['erreur'] ?? null], 'portes à jour : 400');
    egal(400, modifier_classe($id, ['jour' => ['flash-anzan']], $jetonS1, ['jour' => ['defi-tables']])['code'], 'sans « avant.portes » (une page d’avant ce lot) : 400');
    // Une porte périmée qui n'est PAS dans la liste envoyée ne gêne pas.
    $r = modifier_classe($id, ['jour' => ['splat']], $jetonS1, ['jour' => ['defi-tables'], 'portes' => $portesA]);
    egal(200, $r['code'], 'Anzan périmé mais pas demandé : écrit — ' . $r['texte']);
    egal(['splat'], jour_en_base($id), 'et l’écriture a rangé la liste : Anzan, que plus personne n’a, n’y est plus');
    egal(200, donner((int)$e1['id'], ['flash-anzan' => new stdClass()], $jetonS1)['code']);
    egal(['splat'], jour_vu($id), 'redonné après une écriture de la classe : l’étape ne revient pas');
    // « avant.portes » illisible : 400.
    foreach (['splat', ['a' => 'splat'], [1], [['splat']], array_fill(0, 40, 'splat')] as $portes) {
        egal(400, modifier_classe($id, ['jour' => []], $jetonS1, ['jour' => ['splat'], 'portes' => $portes])['code'], '« avant.portes » illisible : ' . substr(json_encode($portes), 0, 40));
    }
    // Le vrai corps JSON : « {} » et {"0": …} ne sont pas des listes (comme « avant.jour », correctif B2, point 4).
    foreach (['{}', '{"0":"splat"}'] as $objet) {
        $r = appel('/api/prof.php', '{"action":"classes.modifier","jeton":"' . $jetonS1 . '","classe_id":' . (int)$id . ',"jour":[],"avant":{"jour":["splat"],"portes":' . $objet . '}}', ['jeton' => $jetonS1]);
        egal(400, $r['code'], "« avant.portes » = $objet : refusé");
    }
    egal(['splat'], jour_en_base($id));
    egal([], portes_perimees(['flash-anzan'], null, []), 'sans « avant » : rien de périmé');
    egal([], portes_perimees(['flash-anzan'], ['jour' => []], []), 'sans « avant.portes » : rien de périmé');
    egal(['flash-anzan'], portes_perimees(['flash-anzan', 'splat'], ['portes' => ['flash-anzan', 'splat']], ['splat']));
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

verifier("aujourdhui-B3 — les ajouts des élèves se lisent sous le verrou de la classe, sans verrouiller les élèves ; l'élève passe par jour_de_l_eleve", function () {
    $prof = file_get_contents(dirname(__DIR__) . '/public/api/prof.php');
    $modifier = substr($prof, strpos($prof, "case 'classes.modifier':"), strpos($prof, "case 'classes.supprimer':") - strpos($prof, "case 'classes.modifier':"));
    // Correctif (Codex, point 15) : chaque repère doit être TROUVÉ avant d'être
    // comparé — false < 12 est vrai en PHP.
    $reperes = [
        'la sonde de la colonne, hors transaction' => strpos($modifier, "\n            ajouts_disponibles(\$pdo);"),
        'la transaction' => strpos($modifier, 'transaction_ouvrir($pdo);'),
        'le verrou de la classe' => strpos($modifier, "'SELECT * FROM classes WHERE id = ?' . pour_mise_a_jour(\$pdo)"),
        'la lecture des ajouts' => strpos($modifier, '$ajoutsEleves = ajouts_de_la_classe($pdo, $classeId);'),
        '« avant »' => strpos($modifier, 'meme_etat_de_classe($avant, $ligne, $ajoutsEleves)'),
    ];
    foreach ($reperes as $quoi => $position) vrai($position !== false, "trouvé : $quoi");
    $positions = array_values($reperes);
    egal($positions, array_values(array_unique($positions)), 'des repères distincts');
    $triees = $positions; sort($triees);
    egal($positions, $triees, 'dans cet ordre : ' . implode(', puis ', array_keys($reperes)));
    $applis = file_get_contents(dirname(__DIR__) . '/public/lib/applis.php');
    $debut = strpos($applis, 'function ajouts_de_la_classe(');
    vrai($debut !== false, 'ajouts_de_la_classe existe');
    $fonction = substr($applis, $debut, strpos($applis, "\n}\n", $debut) - $debut);
    vrai(str_contains($fonction, "'SELECT ajouts FROM eleves WHERE classe_id = ? AND ajouts IS NOT NULL'"), 'une lecture simple');
    vrai(!str_contains($fonction, 'pour_mise_a_jour') && !str_contains($fonction, 'FOR UPDATE'), 'sans verrou sur les lignes des élèves : pas de second verrou, pas d’interblocage');
    $acces = substr($prof, strpos($prof, "case 'eleves.acces':"), strpos($prof, "case 'eleves.reglages':") - strpos($prof, "case 'eleves.acces':"));
    vrai(!str_contains($acces, 'UPDATE classes') && !str_contains($acces, 'FROM classes'), 'eleves.acces ne lit ni n’écrit la ligne de la classe sous son verrou');
    $apresEcriture = strpos($acces, 'portes_de_la_classe_pour_reponse');
    vrai($apresEcriture !== false && $apresEcriture > strpos($acces, 'transaction_valider($pdo);'), 'les portes de la classe : relues APRÈS l’écriture de l’élève, hors de sa transaction');
    $eleve = file_get_contents(dirname(__DIR__) . '/public/api/eleve.php');
    vrai(str_contains($eleve, "\$reponse['jour'] = jour_de_l_eleve(\$eleve, \$acces);"), 'la liste de l’élève : réduite à ses portes');
    vrai(!str_contains($eleve, 'jour_de_classe') && !str_contains($eleve, 'ajouts_de_la_classe'), 'la page de l’élève ne lit jamais les ajouts des autres');
});

// Correctif B3 après la relecture Codex (22/11/2026) : un test par défaut.
$b3c = null;
function b3c_classe(string $libelle, array $applis, int $nombre, string $jeton): array
{
    $id = (int)appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => $libelle, 'applis' => $applis], ['jeton' => $jeton])['json']['id'];
    $eleves = $nombre ? appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $id, 'nombre' => $nombre], ['jeton' => $jeton])['json']['eleves'] : [];
    return ['id' => $id, 'eleves' => $eleves];
}

verifier("aujourdhui-B3, correctif (Codex 15) — deux connexions : une écriture de la classe qui attendait son verrou voit l'Anzan donné pendant l'attente", function () use (&$jetonS1) {
    vider_compteurs();
    $c = b3c_classe('B3c-verrou', ['defi-tables', 'splat'], 2, $jetonS1);
    $id = $c['id'];
    $noa = (int)$c['eleves'][0]['id'];
    $bd = bd_test();
    // Une autre écriture de la classe tient son verrou (un autre onglet qui
    // enregistre) ; pendant ce temps, le professeur enregistre une liste avec
    // Anzan, que Noa reçoit à cet instant — validé AVANT que le verrou soit rendu.
    if (pilote_test() === 'mysql') {
        $bd->beginTransaction();
        $bd->query('SELECT id FROM classes WHERE id = ' . $id . ' FOR UPDATE')->fetchAll();
    } else {
        $bd->exec('BEGIN IMMEDIATE');
    }
    $vol = lancer_appel_en_vol('/api/prof.php', ['action' => 'classes.modifier', 'classe_id' => $id, 'jour' => ['flash-anzan', 'defi-tables'],
        'avant' => ['jour' => [], 'applis' => ['defi-tables', 'splat'], 'portes' => ['defi-tables', 'flash-anzan', 'splat']]], $jetonS1);
    $repondu = avancer_appel_en_vol($vol, 700);
    $bd->prepare('UPDATE eleves SET ajouts = ? WHERE id = ?')->execute(['{"flash-anzan":{}}', $noa]);
    if (pilote_test() === 'mysql') $bd->commit(); else $bd->exec('COMMIT');
    $r = terminer_appel_en_vol($vol);
    vrai(!$repondu, 'l’écriture attendait le verrou de la classe');
    egal(200, $r['code'], 'les ajouts sont lus APRÈS le verrou : Anzan est une porte — ' . json_encode($r['json']));
    egal(['flash-anzan', 'defi-tables'], jour_vu($id));
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
});

verifier("aujourdhui-B3, correctif (Codex 2) — pendant le dépôt FTP, un api/*.php encore en B2 appelle les fonctions de la liste avec un argument de moins : elles répondent, à la règle du B2", function () {
    $ligne = ['applis' => 'defi-tables,splat', 'reglages' => '{"jour":["flash-anzan","splat"]}'];
    egal(['splat'], jour_de_classe($ligne), 'jour_de_classe($classe) : les applis de la classe seulement, comme au B2');
    egal(['flash-anzan', 'splat'], jour_de_classe($ligne, ['{"flash-anzan":{}}']), 'avec les ajouts : l’étape d’un élève reste');
    vrai(meme_etat_de_classe(['jour' => ['splat']], $ligne), 'meme_etat_de_classe($avant, $ligne) : comme au B2');
    vrai(!meme_etat_de_classe(['jour' => ['splat']], $ligne, ['{"flash-anzan":{}}']), 'avec les ajouts : la liste vue compte l’étape d’un élève');
    foreach (['jour_de_classe' => 1, 'meme_etat_de_classe' => 2] as $nom => $obligatoires) {
        egal($obligatoires, (new ReflectionFunction($nom))->getNumberOfRequiredParameters(), "$nom : l’ancien appel reste permis");
    }
    // Le code du lot, lui, passe TOUJOURS les ajouts : sans eux, les étapes de quelques élèves sortiraient en silence.
    foreach (['api/prof.php', 'api/eleve.php', 'api/cours.php', 'api/parcours.php', 'index.php', 'prof/index.php'] as $fichier) {
        $source = (string)@file_get_contents(dirname(__DIR__) . '/public/' . $fichier);
        preg_match_all('/\b(jour_de_classe|meme_etat_de_classe)\(([^;]*?)\)[;\s,]/', $source, $appels, PREG_SET_ORDER);
        foreach ($appels as [, $nom, $arguments]) {
            $voulus = $nom === 'jour_de_classe' ? 2 : 3;
            egal($voulus, count(explode(',', $arguments)), "$fichier : $nom($arguments) passe les ajouts");
        }
    }
});

verifier("aujourdhui-B3, correctif (Codex 3) — une page d'avant le lot ne remplace ni « Aucun » ni une étape de quelques élèves ; ses listes ordinaires passent", function () use (&$jetonS1, &$b3c) {
    vider_compteurs();
    $b3c = b3c_classe('B3c-groupe', ['defi-tables', 'splat'], 4, $jetonS1);
    $id = $b3c['id'];
    [$e1] = $b3c['eleves'];
    egal(200, ecrire_jour($id, ['jour' => ['@aucun']], $jetonS1)['code']);
    // L'ancienne carte : « avant » sans « portes », la liste vide qu'elle croit voir.
    $r = modifier_classe($id, ['jour' => []], $jetonS1, ['jour' => ['@aucun'], 'applis' => ['defi-tables', 'splat']]);
    egal([400, "Cette page date d'avant une mise à jour de Ma classe : recharge-la, puis refais ton choix."], [$r['code'], $r['json']['erreur'] ?? null], 'sur « Aucun »');
    egal(['@aucun'], jour_en_base($id), 'rien d’écrit');
    $r = modifier_classe($id, ['jour' => ['splat']], $jetonS1, ['jour' => ['@aucun']]);
    egal(400, $r['code'], 'ni une autre liste par-dessus « Aucun »');
    // Une étape que seul un élève a.
    egal(200, donner((int)$e1['id'], ['flash-anzan' => new stdClass()], $jetonS1)['code']);
    egal(200, ecrire_jour($id, ['jour' => ['flash-anzan', 'defi-tables']], $jetonS1)['code']);
    $r = modifier_classe($id, ['jour' => ['defi-tables']], $jetonS1, ['jour' => ['flash-anzan', 'defi-tables']]);
    egal(400, $r['code'], 'une étape de quelques élèves : la page d’avant ne la voyait pas');
    egal(['flash-anzan', 'defi-tables'], jour_en_base($id));
    // Une liste ordinaire : la page du B2 enregistre comme avant.
    egal(200, ecrire_jour($id, ['jour' => ['defi-tables']], $jetonS1)['code']);
    $r = modifier_classe($id, ['jour' => ['splat', 'defi-tables']], $jetonS1, ['jour' => ['defi-tables'], 'applis' => ['defi-tables', 'splat']]);
    egal(200, $r['code'], 'une liste de la classe, par une page du B2 — ' . $r['texte']);
    egal(['splat', 'defi-tables'], jour_en_base($id));
    // Les autres réglages d'une page du B2 (renommer, les applis) ne touchent pas à « Aucun ».
    egal(200, ecrire_jour($id, ['jour' => ['@aucun']], $jetonS1)['code']);
    egal(200, modifier_classe($id, ['libelle' => 'B3c-groupe'], $jetonS1, ['applis' => ['defi-tables', 'splat']])['code']);
    egal(['@aucun'], jour_en_base($id));
    egal(200, ecrire_jour($id, ['jour' => []], $jetonS1)['code']);
    egal(200, donner((int)$e1['id'], new stdClass(), $jetonS1)['code']);
});

verifier("aujourdhui-B3, correctif (Codex 4) — Mes cours n'est une porte que si un chapitre est vraiment affichable, pour la classe comme pour un élève, avant et après l'écriture", function () use (&$jetonS1, &$b3c) {
    vider_compteurs();
    $id = $b3c['id'];
    [$e1, $e2] = $b3c['eleves'];
    $fermees = [];
    foreach (cours_catalogue() as $c) {
        if ($c['id'] !== '4e-REL') continue;
        foreach ($c['fiches'] as $f) $fermees[] = $f['id'];
        $fermees[] = $c['brevet']['id'];
    }
    vrai(count($fermees) > 2, 'les fiches du chapitre');
    // Le chapitre 4e-REL en plus pour un élève ; toutes ses fiches et son brevet fermés à la classe.
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => [], 'sans' => $fermees]]], $jetonS1)['code']);
    egal(200, donner((int)$e1['id'], ['cours' => ['chapitres' => ['4e-REL']]], $jetonS1)['code']);
    egal([], cours_de_l_eleve(acces_de_l_eleve(classe_en_base($id), ajouts_en_base((int)$e1['id']))['reglages']['cours'] ?? []), 'l’élève ne voit aucun chapitre');
    $t = tableau_b3($id, $jetonS1);
    egal(['defi-tables', 'splat'], $t['classe']['portes'], 'tableau : Mes cours n’est pas une porte');
    $ligne = array_values(array_filter($t['eleves'], fn($e) => (int)$e['id'] === (int)$e1['id']))[0];
    egal(['defi-tables', 'splat'], $ligne['acces']['portes'], 'ni pour cet élève');
    vrai(in_array('cours', $ligne['acces']['applis'], true), 'même si l’appli Cours est dans ses applis');
    $r = ecrire_jour($id, ['jour' => ['defi-tables', 'cours']], $jetonS1);
    egal([400, "Activité pas ouverte à la classe."], [$r['code'], $r['json']['erreur'] ?? null], 'une liste avec Mes cours : refusée');
    // Une fiche rouverte DANS LE MÊME APPEL que la liste : Mes cours devient une porte après l'écriture.
    $r = modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => [], 'sans' => array_slice($fermees, 1)]], 'jour' => ['defi-tables', 'cours']], $jetonS1,
        ['jour' => jour_vu($id), 'portes' => ['defi-tables', 'splat']]);
    egal(200, $r['code'], 'la fiche rouverte et la liste ensemble — ' . $r['texte']);
    egal(['defi-tables', 'splat', 'cours'], $r['json']['portes'] ?? null, 'la réponse dit les portes d’après');
    egal(['defi-tables', 'splat'], $r['json']['portes_classe'] ?? null, 'et celles de la classe seule');
    egal(['defi-tables', 'cours'], identite($e1['code'])['json']['jour'], 'l’élève a Mes cours');
    egal(['defi-tables'], identite($e2['code'])['json']['jour'], 'pas l’autre');
    // Et dans l'autre sens : la dernière fiche refermée avec la liste, dans le même appel → taillée.
    $r = modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => [], 'sans' => $fermees]]], $jetonS1);
    egal(['defi-tables'], $r['json']['jour'], 'plus rien d’affichable : Mes cours sort dans la même écriture');
    // Les règles, sans l'API.
    vrai(!cours_affichable(['chapitres' => ['4e-REL'], 'sans' => $fermees]), 'chapitre ouvert, tout fermé : pas affichable');
    vrai(cours_affichable(['chapitres' => ['4e-REL'], 'sans' => array_slice($fermees, 1)]), 'une fiche ouverte : affichable');
    vrai(!cours_affichable(['sans' => []]), 'sans chapitre : non');
    egal(['defi-tables'], portes_de_l_eleve(['applis' => ['defi-tables', 'cours'], 'reglages' => ['cours' => ['chapitres' => ['4e-REL'], 'sans' => $fermees]]]));
    egal([], portes_des_ajouts(['{"cours":{"chapitres":["4e-REL"]}}'], ['applis' => 'defi-tables', 'reglages' => json_encode(['cours' => ['sans' => $fermees]])]), 'les fiches fermées de la classe valent pour les chapitres d’un élève');
    egal(['cours'], portes_des_ajouts(['{"cours":{"chapitres":["4e-REL"]}}'], ['applis' => 'defi-tables']));
    egal(200, modifier_classe($id, ['reglages' => ['cours' => ['chapitres' => [], 'sans' => []]]], $jetonS1)['code']);
    egal(200, donner((int)$e1['id'], new stdClass(), $jetonS1)['code']);
});

verifier("aujourdhui-B3, correctif (Codex 8) — une liste abîmée : la liste de l'élève est toujours une partie de celle du professeur, dans le même ordre ; une quatrième étape ne remonte pas", function () use (&$jetonS1, &$b3c) {
    vider_compteurs();
    $id = $b3c['id'];
    [$e1, $e2] = $b3c['eleves'];
    egal(200, donner((int)$e1['id'], ['flash-anzan' => new stdClass()], $jetonS1)['code']);
    // L'autre élève a un chapitre : Mes cours est SA porte (le cas relevé par Codex).
    egal(200, donner((int)$e2['id'], ['cours' => ['chapitres' => ['4e-REL']]], $jetonS1)['code']);
    $ecrire = bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?');
    foreach ([
        // [la ligne restaurée, ce que voit la classe, Noa (Anzan), un élève sans Anzan mais avec Mes cours]
        // Mes cours avant une autre étape : hors de la liste pour TOUS — avant, l'élève sans Anzan recevait [cours].
        ['{"jour":["cours","flash-anzan"]}', ['flash-anzan'], ['flash-anzan'], []],
        ['{"jour":["flash-anzan","cours"]}', ['flash-anzan', 'cours'], ['flash-anzan'], ['cours']],
        ['{"jour":["splat","coffres","defi-tables","flash-anzan"]}', ['splat', 'defi-tables'], ['splat', 'defi-tables'], ['splat', 'defi-tables']],
        ['{"jour":["flash-anzan","flash-anzan","soley","splat","defi-tables","coffres"]}', ['flash-anzan', 'splat', 'defi-tables'], ['flash-anzan', 'splat', 'defi-tables'], ['splat', 'defi-tables']],
    ] as [$brut, $classe, $noa, $autre]) {
        $ecrire->execute([$brut, $id]);
        egal($classe, tableau_b3($id, $jetonS1)['classe']['jour'], "$brut : le professeur");
        egal($noa, identite($e1['code'])['json']['jour'], "$brut : Noa");
        egal($autre, identite($e2['code'])['json']['jour'], "$brut : un élève sans Anzan");
    }
    egal(['cours'], jour_canonique('{"jour":["cours"]}'), 'Mes cours seule reste');
    egal(['defi-tables', 'splat', 'coffres'], jour_canonique('{"jour":["defi-tables","splat","coffres","cours"]}'), 'les trois premières ; Mes cours en quatrième ne compte pas');
    egal(['flash-anzan'], jour_canonique('{"jour":["cours","flash-anzan"]}'), 'Mes cours ailleurs qu’au bout : retirée avant toute réduction');
    $ecrire->execute([null, $id]);
    egal(200, donner((int)$e1['id'], new stdClass(), $jetonS1)['code']);
    egal(200, donner((int)$e2['id'], new stdClass(), $jetonS1)['code']);
});

verifier("aujourdhui-B3, correctif (Codex 9) — les données rangées : un objet n'est pas une liste ; la prochaine écriture de la classe nettoie un « jour » de forme fausse", function () use (&$jetonS1, &$b3c) {
    vider_compteurs();
    $id = $b3c['id'];
    [$e1] = $b3c['eleves'];
    $ecrire = bd_test()->prepare('UPDATE classes SET reglages = ? WHERE id = ?');
    foreach (['{"jour":{"0":"@aucun"}}', '{"jour":{"0":"splat"}}', '{"jour":null}', '{"jour":"@aucun"}', '{"jour":{}}'] as $brut) {
        egal([], jour_lu($brut, ['splat']), "$brut : pas une liste");
        $ecrire->execute([$brut, $id]);
        egal([], tableau_b3($id, $jetonS1)['classe']['jour'], "$brut : automatique, pas « Aucun »");
        egal([], identite($e1['code'])['json']['jour'], "$brut : l’élève aussi");
        egal(200, modifier_classe($id, ['libelle' => 'B3c-groupe'], $jetonS1)['code'], "$brut : une écriture de la classe");
        egal(null, classe_en_base($id)['reglages'], "$brut : nettoyé, même si la liste effective est vide");
    }
    $ecrire->execute(['{"jour":{"0":"@aucun"},"splat":{"mondes":[1,2]}}', $id]);
    egal(200, modifier_classe($id, ['libelle' => 'B3c-groupe'], $jetonS1)['code']);
    egal('{"splat":{"mondes":[1,2]}}', classe_en_base($id)['reglages'], 'les réglages des applis restent');
    // Les ajouts : une liste à la place d'une liste, jamais un objet.
    egal([], ajouts_lus('{"cours":{"chapitres":{"0":"4e-REL"}}}'), 'des chapitres en objet : abîmé');
    egal([], ajouts_lus('{"splat":{"mondes":{"0":3}}}'), 'des mondes en objet : abîmé');
    egal(['cours' => ['chapitres' => ['4e-REL']]], ajouts_lus('{"cours":{"chapitres":["4e-REL"]}}'));
    egal(['flash-anzan' => []], ajouts_lus('{"flash-anzan":[]}'), '« [] » vaut « {} » (lot Qui voit quoi, gardé) : l’élève a l’appli, la porte compte');
    egal([], ajouts_lus('{"flash-anzan":["x"]}'));
    egal([], portes_des_ajouts(['{"cours":{"chapitres":{"0":"4e-REL"}}}'], ['applis' => 'defi-tables']), 'un objet de chapitres ne fait pas Mes cours');
    $ecrire->execute([null, $id]);
});

verifier("aujourdhui-B3, correctif (Codex 12) — la clé réservée n'est pas une activité : refusée à la création et à la modification, sans toucher aux applis", function () use (&$jetonS1) {
    vider_compteurs();
    $c = b3c_classe('B3c-splat', ['splat'], 0, $jetonS1);
    $id = $c['id'];
    egal('splat', classe_en_base($id)['applis']);
    foreach ([['@aucun'], ['@aucun', 'splat'], '@aucun', ['@x']] as $applis) {
        $r = modifier_classe($id, ['applis' => $applis], $jetonS1);
        egal([400, "« Aucun » n'est pas une activité : choisis les activités de la classe."], [$r['code'], $r['json']['erreur'] ?? null], json_encode($applis));
        egal('splat', classe_en_base($id)['applis'], 'SPLAT! reste, Défi tables n’arrive pas');
    }
    $r = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'B3c-x', 'applis' => ['@aucun']], ['jeton' => $jetonS1]);
    egal(400, $r['code'], 'à la création non plus');
    egal(200, modifier_classe($id, ['applis' => ['splat', 'inconnue']], $jetonS1)['code'], 'une clé inconnue : filtrée comme avant');
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
});

verifier("aujourdhui-B3, correctif (suggestion 16) — un appel qui rouvre Anzan à la classe ET le choisit passe, même si l'ajout que la carte avait vu a disparu", function () use (&$jetonS1, &$b3c) {
    vider_compteurs();
    $id = $b3c['id'];
    [$e1] = $b3c['eleves'];
    $r = modifier_classe($id, ['applis' => ['defi-tables', 'splat', 'flash-anzan'], 'jour' => ['flash-anzan', 'defi-tables']], $jetonS1,
        ['jour' => jour_vu($id), 'applis' => ['defi-tables', 'splat'], 'portes' => ['defi-tables', 'flash-anzan', 'splat']]);
    egal(200, $r['code'], 'Anzan ouvert explicitement et choisi : écrit — ' . $r['texte']);
    egal(['flash-anzan', 'defi-tables'], jour_en_base($id));
    egal('defi-tables,flash-anzan,splat', classe_en_base($id)['applis']);
    // Sans la rouvrir : 409, comme avant.
    egal(200, modifier_classe($id, ['applis' => ['defi-tables', 'splat']], $jetonS1)['code']);
    egal(['defi-tables'], jour_en_base($id), 'Anzan fermé, personne ne l’a : taillé');
    $r = modifier_classe($id, ['jour' => ['flash-anzan']], $jetonS1, ['jour' => ['defi-tables'], 'portes' => ['defi-tables', 'flash-anzan', 'splat']]);
    egal(409, $r['code'], 'choisi sans être rouvert : la carte était en retard');
});

verifier("aujourdhui-B3, correctif (Codex 1, 6, 7, 11) — les portes partent avec chaque réponse : tableau (classe et élèves, un seul instantané), classes.modifier (200 et 409), eleves.acces (200 et 409)", function () use (&$jetonS1, &$b3c) {
    vider_compteurs();
    $id = $b3c['id'];
    [$e1, $e2] = $b3c['eleves'];
    $t = tableau_b3($id, $jetonS1);
    egal(['defi-tables', 'splat'], $t['classe']['portes']);
    egal(['defi-tables', 'splat'], $t['classe']['portes_classe']);
    foreach ($t['eleves'] as $e) egal(['defi-tables', 'splat'], $e['acces']['portes'], 'chaque élève');
    // eleves.acces : les portes de SA classe après l'écriture.
    $r = donner((int)$e1['id'], ['flash-anzan' => new stdClass()], $jetonS1);
    egal(['classe_id' => $id, 'portes' => ['defi-tables', 'flash-anzan', 'splat'], 'portes_classe' => ['defi-tables', 'splat']], $r['json']['classe_portes'] ?? null, 'eleves.acces (200)');
    egal(['defi-tables', 'flash-anzan', 'splat'], $r['json']['acces']['portes']);
    $r = donner((int)$e1['id'], new stdClass(), $jetonS1, new stdClass());
    egal(409, $r['code'], 'un « avant » en retard');
    egal(['defi-tables', 'flash-anzan', 'splat'], $r['json']['classe_portes']['portes'] ?? null, 'eleves.acces (409)');
    // classes.modifier : 200 et 409.
    $r = ecrire_jour($id, ['jour' => ['flash-anzan', 'defi-tables']], $jetonS1);
    egal([['defi-tables', 'flash-anzan', 'splat'], ['defi-tables', 'splat']], [$r['json']['portes'] ?? null, $r['json']['portes_classe'] ?? null], 'classes.modifier (200)');
    $r = modifier_classe($id, ['jour' => []], $jetonS1, ['jour' => ['splat']]);
    egal(409, $r['code']);
    egal([['defi-tables', 'flash-anzan', 'splat'], ['defi-tables', 'splat']], [$r['json']['portes'] ?? null, $r['json']['portes_classe'] ?? null], 'classes.modifier (409)');
    vrai(!str_contains(json_encode($r['json']), 'prenom'), 'aucun élève nommé');
    // Le tableau lit la classe et ses élèves dans UN instantané, sans verrou.
    $prof = file_get_contents(dirname(__DIR__) . '/public/api/prof.php');
    $tableau = substr($prof, strpos($prof, "case 'tableau':"), 6000);
    $reperes = [
        'l’instantané' => strpos($tableau, 'instantane_ouvrir($pdo);'),
        'la ligne de la classe' => strpos($tableau, "\$pdo->prepare('SELECT * FROM classes WHERE id = ?');"),
        'les élèves' => strpos($tableau, 'FROM eleves e'),
        'la fin de l’instantané' => strpos($tableau, 'instantane_fermer($pdo);'),
        'la classe relue sert la réponse' => strpos($tableau, "\$classe = ['droit' => \$classe['droit']] + \$ligneClasse;"),
    ];
    foreach ($reperes as $quoi => $position) vrai($position !== false, "trouvé : $quoi");
    $positions = array_values($reperes); $triees = $positions; sort($triees);
    egal($positions, $triees, 'dans cet ordre');
    vrai(!str_contains(substr($tableau, $reperes['l’instantané'], $reperes['la fin de l’instantané'] - $reperes['l’instantané']), 'FOR UPDATE'), 'sans verrou');
    egal(200, ecrire_jour($id, ['jour' => []], $jetonS1)['code']);
    egal(200, donner((int)$e1['id'], new stdClass(), $jetonS1)['code']);
    appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $id], ['jeton' => $jetonS1]);
    vider_compteurs();
});

// ---------------------------------------------------------------------- résultat

echo "\n";
if ($echecs === []) {
    echo "$reussis tests, 0 échec.\n";
    exit(0);
}
echo count($echecs) . " ÉCHEC(S) sur " . ($reussis + count($echecs)) . " tests :\n";
foreach ($echecs as $e) echo "  - $e\n";
exit(1);
