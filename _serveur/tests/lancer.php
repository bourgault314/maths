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
    foreach (['billets', 'partages', 'sessions_prof', 'compteurs', 'progressions', 'eleves', 'classes', 'profs'] as $table) {
        bd_test()->exec("DROP TABLE IF EXISTS $table");
    }
    echo "Base de test : " . $bdTest['dsn'] . "\n";
}

file_put_contents($travail . '/config.php', "<?php return " . var_export([
    'bd' => $bdTest,
    'origines' => ['https://mathsgo.re', 'https://suivi.mathsgo.re'],
    'jeton_installation' => 'JETON-DE-TEST',
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
    curl_close($ch);
    $brutEntetes = substr((string)$reponse, 0, $tailleEntetes);
    $corpsReponse = substr((string)$reponse, $tailleEntetes);
    return [
        'code' => (int)$code,
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
    vrai(str_contains($r['texte'], '12 caractères'), "la longueur minimale devrait être rappelée");
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
$parcours = ['version' => 1, 'tables' => ['7' => ['acquise' => '2026-08-29']]];

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
    $gros = ['version' => 1, 'bloc' => str_repeat('x', 45000)];
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
    egal(1, count($r['json']['applis']), 'nombre d\'applis');
    egal('defi-tables', $r['json']['applis'][0]['cle']);
    egal(true, $r['json']['applis'][0]['disponible']);
    vrai(str_contains($r['json']['applis'][0]['url'], 'defi_tables.html'), "l'appli doit pointer vers mathsgo.re");
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
    appel('/api/parcours.php', ['code' => $code, 'parcours' => ['version' => 1], 'base_revision' => 0]);
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

    // La fenêtre du limiteur est ALIGNÉE SUR L'HORLOGE (lib/limite.php,
    // fin_de_fenetre) : elle se referme toutes les cinq minutes, à heure fixe.
    // Sur une machine lente — Windows, où le serveur intégré ne traite qu'une
    // requête à la fois parce que PHP_CLI_SERVER_WORKERS n'y fait rien —, les
    // trois cent trente requêtes de ce test peuvent enjamber ce changement de
    // fenêtre : le compteur du serveur repart de zéro au milieu, et le test
    // annonçait un échec là où le limiteur avait parfaitement fonctionné.
    // C'est l'instabilité relevée le 05/09 (verte sur la CI Linux, rouge une
    // fois sur deux sous Windows). On surveille donc la fenêtre nous aussi, et
    // on recommence à compter quand elle tourne — ce que fait le serveur.
    $fenetre = fn(): int => intdiv(time(), 300);
    vider_compteurs();
    $courante = $fenetre();
    $freine = false;
    $avant = 0;
    for ($i = 0; $i < 800; $i++) {
        if ($fenetre() !== $courante) { $courante = $fenetre(); $avant = 0; }
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
    // Une tolérance d'un cran : la fenêtre peut tourner entre notre lecture de
    // l'horloge et celle du serveur. Ce que le test prouve reste entier — le
    // frein arrive à trois cents, pas à trente ni à trois mille.
    vrai($avant >= 299 && $avant <= 301,
        "trois cents lectures passent avant le frein (l'appli envoie après chaque réponse) — obtenu $avant");
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
    // Même calcul de fenêtre que lib/limite.php. Si elle se ferme dans moins
    // de cinq secondes, on attend la suivante : sinon le test et le serveur
    // pourraient ne pas parler de la même fenêtre.
    $fin = (intdiv(time(), $secondes) + 1) * $secondes;
    if ($fin - time() < 5) {
        sleep($fin - time() + 1);
        $fin = (intdiv(time(), $secondes) + 1) * $secondes;
    }
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
    vider_compteurs();
    $duree = chronometre(fn() => identite($codesS1[0]), $r);
    egal(200, $r['code'], 'contrôle : après remise à zéro, le bon code passe');
    vrai($duree < 1.0, sprintf('sans attendre (%.2f s)', $duree));
});

verifier("parcours.php : même ralentissement sur les codes inventés, et le 404 reste un 404", function () use (&$codesS1) {
    vider_compteurs();
    semer_echecs_adresse(60);
    $duree = chronometre(fn() => lire(code_inconnu(0)), $r);
    egal(404, $r['code'], 'le 61e échec');
    vrai($duree < 1.0, sprintf('sans attendre (%.2f s)', $duree));
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
    $duree = chronometre(fn() => identite($codesS1[0]), $r);
    egal(429, $r['code'], "au-delà de 600, même un bon code est refusé : c'est une attaque, pas une classe");
    vrai($duree < 1.0, sprintf("et le refus n'attend pas : pas de processus qui dort (%.2f s)", $duree));
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

verifier("connexion prof : douze mauvais mots de passe sur un compte, puis 429 même avec le bon ; un autre identifiant passe encore", function () {
    vider_compteurs();
    $statuts = [];
    for ($i = 0; $i < 13; $i++) $statuts[] = connexion('gwenael', "mauvais-$i")['code'];
    egal(array_fill(0, 12, 401), array_slice($statuts, 0, 12), 'douze refus ordinaires');
    egal(429, $statuts[12], 'le treizième est freiné');
    $r = connexion('gwenael', 'motdepasse-de-test-2026');
    egal(429, $r['code'], 'le bon mot de passe ne passe plus pendant la fenêtre');
    vrai(ctype_digit((string)entete($r, 'Retry-After')), 'avec Retry-After');
    egal(401, connexion('personne', 'motdepasse-de-test-2026')['code'], "un autre identifiant depuis la même adresse : refus ordinaire, pas 429 (compteur par identifiant)");
    vider_compteurs();
    egal(200, connexion('gwenael', 'motdepasse-de-test-2026')['code'], 'contrôle : après remise à zéro, la connexion passe');
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
    $mesure = function (string $identifiant): float {
        $debut = hrtime(true);
        for ($i = 0; $i < 3; $i++) appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => $identifiant, 'motdepasse' => 'mauvais-mot-de-passe']);
        return (hrtime(true) - $debut) / 3e6;
    };
    $inconnu = $mesure('personne-de-ce-nom');
    $connu = $mesure('gwenael');
    echo sprintf("       (connexion refusée : identifiant inconnu %.0f ms, identifiant existant %.0f ms)\n", $inconnu, $connu);
    vrai($inconnu > $connu / 3 && $inconnu < $connu * 3, "les deux refus doivent prendre un temps du même ordre");
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
    $r = ecrire($codesA2[0]['code'], ['version' => 1, 'epoque' => 0, 'tables' => ['2' => ['acquise' => '2026-09-01']]], 0);
    egal(200, $r['code'], 'première écriture');
    egal(1, $r['json']['revision'], 'révision 1');
    $r = lire($codesA2[0]['code']);
    egal(1, $r['json']['revision'], 'relue');
    egal('2026-09-01', $r['json']['parcours']['tables']['2']['acquise']);
});

verifier("écrire avec la bonne révision passe, avec une révision périmée répond 409 et l’état actuel", function () use (&$codesA2) {
    $code = $codesA2[0]['code'];
    $r = ecrire($code, ['version' => 1, 'tables' => ['2' => ['acquise' => '2026-09-01'], '5' => ['acquise' => '2026-09-02']]], 1);
    egal(200, $r['code']);
    egal(2, $r['json']['revision']);
    // Un autre appareil, parti de la révision 1, envoie sa copie.
    $r = ecrire($code, ['version' => 1, 'tables' => ['2' => ['acquise' => '2026-09-01'], '7' => ['acquise' => '2026-09-03']]], 1);
    egal(409, $r['code'], 'conflit');
    egal(true, $r['json']['conflit']);
    egal(2, $r['json']['revision'], 'la révision en base');
    egal('2026-09-02', $r['json']['parcours']['tables']['5']['acquise'], "l'état actuel, pour fusionner");
    $r = lire($code);
    vrai(!isset($r['json']['parcours']['tables']['7']), "rien n'a été écrasé");
    // Il fusionne et renvoie avec la bonne révision.
    $r = ecrire($code, ['version' => 1, 'tables' => ['2' => ['acquise' => '2026-09-01'], '5' => ['acquise' => '2026-09-02'], '7' => ['acquise' => '2026-09-03']]], 2);
    egal(200, $r['code']);
    egal(3, $r['json']['revision']);
});

// Lot S2 : base_revision est devenue obligatoire (l'appli du lot A2 l'envoie
// toujours). Un client qui ne dit pas ce qu'il a lu n'écrit pas.
verifier("sans base_revision, l’écriture est refusée (400) et rien ne bouge", function () use (&$codesA2) {
    $r = ecrire($codesA2[0]['code'], ['version' => 1, 'tables' => ['2' => ['acquise' => '2026-09-01']]]);
    egal(400, $r['code']);
    vrai(str_contains((string)$r['json']['erreur'], 'Révision'), "le message dit ce qui manque");
    egal(3, lire($codesA2[0]['code'])['json']['revision'], 'la révision n’a pas bougé');
    egal(400, ecrire($codesA2[0]['code'], ['version' => 1], -3)['code'], 'une révision négative est refusée');
    egal(400, ecrire_brut($codesA2[0]['code'], '{"version":1}', null)['code'], 'même en JSON brut');
    $r = appel('/api/parcours.php', '{"code":' . json_encode($codesA2[0]['code']) . ',"base_revision":"3","parcours":{"version":1}}');
    egal(400, $r['code'], 'une révision en texte est refusée');
    $r = ecrire($codesA2[0]['code'], ['version' => 1, 'tables' => ['2' => ['acquise' => '2026-09-01']]], 3);
    egal(200, $r['code'], 'avec la bonne révision, ça passe');
    egal(4, $r['json']['revision']);
});

verifier("vingt premières créations simultanées : une seule passe, les autres reçoivent 409, aucune 500", function () use (&$codesA2) {
    vider_compteurs();
    $statuts = appels_paralleles('/api/parcours.php', ['code' => $codesA2[1]['code'], 'base_revision' => 0,
        'parcours' => ['version' => 1, 'tables' => ['3' => ['acquise' => '2026-09-01']]]], 20);
    $comptes = array_count_values($statuts);
    egal(1, $comptes[200] ?? 0, 'une seule création');
    egal(19, $comptes[409] ?? 0, 'les autres en conflit (statuts : ' . json_encode($comptes) . ')');
    egal(0, $comptes[500] ?? 0, 'aucune erreur serveur');
    egal(1, lire($codesA2[1]['code'])['json']['revision'], 'révision 1, pas 20');
});

verifier("le serveur ne garde ni prénom, ni texte libre, ni clé inconnue, à aucune profondeur", function () use (&$codesA2) {
    $code = $codesA2[2]['code'];
    $r = ecrire_brut($code, '{"version":1,"prenom":"Léa Dupont","commentaire":"n\'importe quoi","tables":{"7":{"prenom":"Alice","acquise":"2026-09-01","commentaire":"x","apprends":{"construct":2,"information":"médicale"}},"11":{"acquise":"2026-09-01"}},"expert":{"niveau":2,"dernier":"' . str_repeat('x', 300) . '"},"calculs":{"3-7":{"cases":2,"vu":"' . str_repeat('y', 300) . '","gagne":"2026-09-01"}},"melange":{"tables":[2,"abc",5],"aJour":true}}', 0);
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
    ecrire_brut($code, '{"version":1,"calculs":{},"melange":{"tables":[]}}', 1);
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
    $r = ecrire($code, ['version' => 1, 'tables' => ['4' => ['acquise' => '2026-09-04']]], 5);
    egal(409, $r['code'], 'une appli qui annonce la révision 5 alors que le serveur n’a rien');
    egal(true, $r['json']['conflit']);
    egal(0, $r['json']['revision'], 'l’état renvoyé est la révision 0');
    egal(null, $r['json']['parcours'], 'et un parcours vide : l’appli fusionne avec rien et repart de 0');
    $r = lire($code);
    egal(false, $r['json']['existe'], 'aucune ligne créée');
    egal(0, $r['json']['revision']);
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM progressions WHERE eleve_id = ' . (int)$codesL6[0]['id'])->fetchColumn(), 'en base non plus');
    $r = ecrire($code, ['version' => 1, 'tables' => ['4' => ['acquise' => '2026-09-04']]], 0);
    egal(200, $r['code'], 'avec la révision 0, la création passe');
    egal(1, $r['json']['revision']);
    $r = ecrire($code, ['version' => 1, 'tables' => ['4' => ['acquise' => '2026-09-04'], '6' => ['acquise' => '2026-09-04']]], 1);
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
    ecrire($eleve['code'], ['version' => 1, 'tables' => ['2' => ['acquise' => '2026-09-04']]], 0);
    ecrire($eleve['code'], ['version' => 1, 'tables' => ['2' => ['acquise' => '2026-09-04'], '3' => ['acquise' => '2026-09-04']]], 1);
    $revisions = [];
    $statuts = [];
    for ($tour = 0; $tour < 10; $tour++) {
        // L'appli lit la révision, puis écrit ; le professeur clique au même instant.
        $base = (int)lire($eleve['code'])['json']['revision'];
        $reponses = appels_paralleles_mixtes([
            ['chemin' => '/api/prof.php', 'jeton' => $jetonS1, 'corps' => ['action' => 'eleves.restaurer', 'eleve_id' => $eleve['id'], 'appli' => 'defi-tables']],
            ['chemin' => '/api/parcours.php', 'corps' => ['code' => $eleve['code'], 'base_revision' => $base,
                'parcours' => ['version' => 1, 'tables' => ['2' => ['acquise' => '2026-09-04'], (string)(4 + $tour % 6) => ['acquise' => '2026-09-04']]]]],
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
        'écriture 409' => ecrire($codesL6[0]['code'], ['version' => 1], 1),
        'identité 200' => identite($codesL6[0]['code']),
        'code inconnu 404' => identite(code_inconnu(0)),
        'tableau prof 200' => appel('/api/prof.php', ['action' => 'tableau', 'classe_id' => $codesL6[0]['classe']], ['jeton' => $jetonS1]),
        'prof sans jeton 401' => appel('/api/prof.php', ['action' => 'moi']),
        'GET refusé 405' => appel('/api/parcours.php', null),
    ] as $quoi => $r) {
        egal('no-store', entete($r, 'Cache-Control'), "$quoi : Cache-Control no-store");
    }
});

verifier("l’espace élève ne parle plus de « Ce n’est pas moi », même dans ses commentaires", function () {
    $r = page('/');
    egal(200, $r['code']);
    vrai(!str_contains($r['texte'], 'pas moi'), 'aucun « pas moi » dans le HTML envoyé à l’élève');
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
    egal([], migrer_schema($vieux), 'relancer ne fait plus rien');
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

verifier("l'espace élève et Ma classe envoient une politique de contenu à nonce, posé sur leur script", function () {
    foreach (['/' => 1, '/prof/' => 1] as $chemin => $scriptsEnLigne) {
        $r = page($chemin);
        egal(200, $r['code'], "$chemin");
        $csp = entete($r, 'Content-Security-Policy');
        vrai($csp !== null, "$chemin : Content-Security-Policy présente");
        vrai((bool)preg_match("/script-src 'self' 'nonce-([A-Za-z0-9+\/=]+)'/", $csp, $m), "$chemin : script-src 'self' + nonce ($csp)");
        $nonce = $m[1];
        vrai(!str_contains($csp, 'mathsgo.re'), "$chemin : plus aucun domaine extérieur dans la politique de contenu");
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
    // Un temps de refus comparable : le hachage est calculé avant de regarder « actif ».
    $debut = hrtime(true); connexion('claire', 'mdp-collegue-definitif-2026'); $tDesactive = (hrtime(true) - $debut) / 1e6;
    $debut = hrtime(true); connexion('gwenael', 'un-mauvais-mot-de-passe'); $tMauvais = (hrtime(true) - $debut) / 1e6;
    vrai(abs($tDesactive - $tMauvais) < max(60, 0.5 * max($tDesactive, $tMauvais)), sprintf('temps de refus comparables (%.0f ms contre %.0f ms)', $tDesactive, $tMauvais));
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
    egal(200, ecrire($e1[0]['code'], ['version' => 1, 'tables' => ['2' => ['acquise' => '2026-09-01']]], 0)['code'], 'une progression');
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
    egal(200, ecrire($elevesBillets[0]['code'], ['version' => 1, 'tables' => ['3' => ['acquise' => '2026-09-01']]], 0)['code'], 'Sam a une progression');
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
    $r = appel('/api/parcours.php', ['billet' => $billet, 'appli' => 'defi-tables', 'parcours' => ['version' => 1, 'tables' => ['9' => ['acquise' => '2026-09-02']]], 'base_revision' => 1]);
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

verifier("l'année scolaire suit le calendrier réunionnais : pivot au 1er août", function () {
    // Rentrée le 18 août 2026, fin des cours le 3 juillet 2027 : tout ce qui
    // se crée à partir du 1er août appartient à l'année qui commence.
    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], htmlspecialchars("Suppression de fin d'année", ENT_QUOTES)),
        'verifier.php montre la ligne de fin d’année');
    egal('2026-2027', annee_scolaire('2026-08-01'), '1er août 2026');
    egal('2026-2027', annee_scolaire('2026-08-18T06:00:00Z'), 'rentrée du 18 août 2026');
    egal('2026-2027', annee_scolaire('2027-07-03'), 'dernier jour de cours');
    egal('2025-2026', annee_scolaire('2026-07-31'), '31 juillet 2026 : encore l’année d’avant');
    egal('2027-2028', annee_scolaire('2027-08-01'), 'le pivot suivant');
    egal('2027-08-01', purge_de_l_annee('2026-2027'), 'la suppression tombe avant la rentrée de mi-août');
    egal('2027-07-01', fin_des_cours_de_l_annee('2026-2027'), 'le préavis commence le 1er juillet');
});

verifier("préparation : une classe de fin d'année, trois élèves, deux progressions, un partage", function () use (&$jetonS1, &$jetonClaire, &$claireId, &$classeFin, &$elevesFin) {
    vider_compteurs();
    $classeFin = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-fin-annee'], ['jeton' => $jetonS1])['json']['id'];
    $elevesFin = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $classeFin, 'nombre' => 3], ['jeton' => $jetonS1])['json']['eleves'];
    egal(3, count($elevesFin), 'trois élèves');
    foreach ([0, 1] as $i) {
        egal(200, appel('/api/prof.php', ['action' => 'eleves.nommer', 'eleve_id' => $elevesFin[$i]['id'], 'prenom' => 'Enfant' . $i, 'initiale' => 'Z'], ['jeton' => $jetonS1])['code']);
        egal(200, ecrire($elevesFin[$i]['code'], ['version' => 1, 'tables' => ['4' => ['acquise' => '2026-09-01']]], 0)['code'], 'progression écrite');
    }
    egal(200, appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $classeFin, 'prof_id' => $claireId, 'droit' => 'lecture'], ['jeton' => $jetonS1])['code'], 'partagée à Claire');
    // Un billet vivant, pour vérifier qu'il part avec le reste.
    vrai(is_string(appel('/api/eleve.php', ['code' => $elevesFin[0]['code'], 'billet' => true])['json']['billet'] ?? null), 'un billet est émis');

    // Une classe de l'année en cours n'est jamais échue.
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    egal([], $r['json']['supprimees_maintenant'], 'rien n’est supprimé automatiquement dans l’année en cours');
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

verifier("le 1er août, l'année écoulée part toute seule — mais jamais une classe encore utilisée", function () use (&$jetonS1) {
    $vieille = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-an-dernier'], ['jeton' => $jetonS1])['json']['id'];
    $eleves = appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $vieille, 'nombre' => 2], ['jeton' => $jetonS1])['json']['eleves'];
    egal(200, ecrire($eleves[0]['code'], ['version' => 1, 'tables' => ['5' => ['acquise' => '2026-09-01']]], 0)['code'], 'une progression');

    // On la fait dater d'une année scolaire passée, mais avec une activité
    // d'aujourd'hui : le garde-fou des 21 jours doit la retenir.
    $anPasse = (string)(((int)substr(annee_scolaire(gmdate('Y-m-d')), 0, 4)) - 1) . '-09-15T08:00:00Z';
    bd_test()->exec("UPDATE classes SET cree_le = '" . $anPasse . "' WHERE id = " . (int)$vieille);
    bd_test()->exec("UPDATE progressions SET maj_le = '" . gmdate('Y-m-d') . "' WHERE eleve_id = " . (int)$eleves[0]['id']);
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    egal([], $r['json']['supprimees_maintenant'], 'une classe encore utilisée n’est pas effacée par surprise');
    egal(2, (int)bd_test()->query('SELECT COUNT(*) FROM eleves WHERE classe_id = ' . (int)$vieille)->fetchColumn(), 'ses élèves sont là');

    // Même classe, plus d'activité depuis deux mois : elle part, entièrement.
    $vieuxJour = gmdate('Y-m-d', time() - 60 * 86400);
    bd_test()->exec("UPDATE progressions SET maj_le = '" . $vieuxJour . "' WHERE eleve_id = " . (int)$eleves[0]['id']);
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    egal(['test-an-dernier'], $r['json']['supprimees_maintenant'], 'supprimée toute seule, et la page le dit');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$vieille)->fetchColumn(), 'il ne reste aucune ligne de la classe');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM eleves WHERE classe_id = ' . (int)$vieille)->fetchColumn(), 'plus un élève');
    egal(404, identite($eleves[1]['code'])['code'], 'le code d’un élève supprimé ne rend plus rien');
});

verifier("une classe d'un collègue n'est jamais supprimée par la fin d'année de quelqu'un d'autre", function () use (&$jetonS1, &$jetonClaire) {
    // Claire crée une classe, on la fait dater de l'an dernier et inactive.
    $sienne = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'classe-de-claire'], ['jeton' => $jetonClaire])['json']['id'];
    $anPasse = (string)(((int)substr(annee_scolaire(gmdate('Y-m-d')), 0, 4)) - 1) . '-09-15T08:00:00Z';
    bd_test()->exec("UPDATE classes SET cree_le = '" . $anPasse . "' WHERE id = " . (int)$sienne);
    // Gwenaël ouvre SA liste : la classe de Claire ne bouge pas.
    appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonS1]);
    egal(1, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$sienne)->fetchColumn(), 'la classe de Claire est intacte');
    // Claire ouvre la sienne : elle part, chez elle.
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jetonClaire]);
    egal(['classe-de-claire'], $r['json']['supprimees_maintenant'], 'chacun sa fin d’année');
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$sienne)->fetchColumn());
});

verifier("menage.php ne s'ouvre pas dans un navigateur, et fait le ménage en ligne de commande", function () use (&$jetonS1, &$travail) {
    egal(404, appel('/menage.php')['code'], 'refusé par HTTP');
    $vieille = appel('/api/prof.php', ['action' => 'classes.creer', 'libelle' => 'test-menage'], ['jeton' => $jetonS1])['json']['id'];
    appel('/api/prof.php', ['action' => 'eleves.ajouter', 'classe_id' => $vieille, 'nombre' => 2], ['jeton' => $jetonS1]);
    $anPasse = (string)(((int)substr(annee_scolaire(gmdate('Y-m-d')), 0, 4)) - 1) . '-09-15T08:00:00Z';
    bd_test()->exec("UPDATE classes SET cree_le = '" . $anPasse . "' WHERE id = " . (int)$vieille);
    $sortie = shell_exec('php ' . escapeshellarg($travail . '/menage.php') . ' 2>&1');
    vrai(str_contains((string)$sortie, 'test-menage'), "le ménage devrait nommer la classe supprimée — sortie : " . trim((string)$sortie));
    egal(0, (int)bd_test()->query('SELECT COUNT(*) FROM classes WHERE id = ' . (int)$vieille)->fetchColumn(), 'la classe est partie');
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

    $r = formulaire('/verifier.php', ['jeton' => 'JETON-DE-TEST']);
    vrai(str_contains($r['texte'], 'tous identiques au dépôt'), 'tout est remis en place');
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
    vrai(str_contains($r['texte'], '12 caractères'), 'les règles du mot de passe s’appliquent');
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
    foreach (['sessions_prof', 'compteurs', 'billets'] as $table) {
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
    'eleves.supprimer' => 'proprietaire',
    'partages.ajouter' => 'proprietaire',
    'partages.supprimer' => 'proprietaire',
];

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
    ecrire($lot11['eleve']['code'], ['version' => 1], 0);
    ecrire($lot11['eleve']['code'], ['version' => 1, 'expert' => 1], 1);
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
            $corps['classe_id'] = $lot11['classe'];
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
    }
    return appel('/api/prof.php', $corps, ['jeton' => $jeton])['code'];
}

verifier("lot 11 — matrice : en LECTURE seule, seules les trois actions de lecture passent", function () use (&$lot11) {
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $lot11['classe'],
        'prof_id' => $lot11['profPartage'], 'droit' => 'lecture'], ['jeton' => $lot11['jetonProprio']]);
    foreach (MATRICE_ATTENDUE as $action => $droit) {
        if ($action === 'classes.supprimer' || $action === 'eleves.supprimer') continue; // joués à part : ils effacent
        $obtenu = jouer_action_lot11($action, $lot11, $lot11['jetonPartage']);
        if ($droit === 'lecture') egal(200, $obtenu, "en lecture, « $action » doit passer");
        else egal(403, $obtenu, "en lecture, « $action » doit être refusé");
    }
});

verifier("lot 11 — matrice : en ÉCRITURE, on prépare et on dépanne, on n'efface pas", function () use (&$lot11) {
    appel('/api/prof.php', ['action' => 'partages.ajouter', 'classe_id' => $lot11['classe'],
        'prof_id' => $lot11['profPartage'], 'droit' => 'ecriture'], ['jeton' => $lot11['jetonProprio']]);
    foreach (MATRICE_ATTENDUE as $action => $droit) {
        if ($action === 'classes.supprimer' || $action === 'eleves.supprimer') continue;
        $obtenu = jouer_action_lot11($action, $lot11, $lot11['jetonPartage']);
        if ($droit === 'proprietaire') egal(403, $obtenu, "en écriture, « $action » doit rester au propriétaire");
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
        if ($action === 'classes.supprimer' || $action === 'eleves.supprimer') continue;
        egal(200, jouer_action_lot11($action, $lot11, $lot11['jetonProprio']), "le propriétaire fait « $action »");
    }
    egal(200, jouer_action_lot11('eleves.supprimer', $lot11, $lot11['jetonProprio']), 'supprimer un élève');
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

verifier("lot 11 — verifier.php : douze mauvais mots de passe, puis la porte se ferme", function () {
    vider_compteurs();
    for ($i = 0; $i < 12; $i++) {
        $r = formulaire('/verifier.php', ['jeton' => 'faux-' . $i]);
        vrai(str_contains($r['texte'], 'incorrect'), "essai " . ($i + 1) . " : refus ordinaire");
    }
    $r = formulaire('/verifier.php', ['jeton' => 'faux-encore']);
    // La page échappe les apostrophes (htmlspecialchars) : on cherche un
    // morceau de phrase qui n'en contient pas.
    vrai(str_contains($r['texte'], 'essais depuis cette adresse'),
        'le treizième essai est freiné — ' . substr(strip_tags($r['texte']), 0, 200));
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
    ecrire($code, ['version' => 1, 'epoque' => '9999-99-99', 'dernier' => '2026-02-29'], 0);
    $lu = (array)lire($code)['json']['parcours'];
    vrai(!array_key_exists('epoque', $lu), '« 9999-99-99 » n’est pas une date : elle est retirée');
    vrai(!array_key_exists('dernier', $lu), '« 2026-02-29 » n’existe pas (2026 n’est pas bissextile) : retirée');
    ecrire($code, ['version' => 1, 'epoque' => '2024-02-29'], 1);
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

// ---------------------------------------------------------------------- résultat

echo "\n";
if ($echecs === []) {
    echo "$reussis tests, 0 échec.\n";
    exit(0);
}
echo count($echecs) . " ÉCHEC(S) sur " . ($reussis + count($echecs)) . " tests :\n";
foreach ($echecs as $e) echo "  - $e\n";
exit(1);
