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
exec(sprintf('cp -r %s/. %s/', escapeshellarg($racine . '/public'), escapeshellarg($travail)));

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
    foreach (['partages', 'sessions_prof', 'compteurs', 'progressions', 'eleves', 'classes', 'profs'] as $table) {
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
    [1 => ['file', '/dev/null', 'w'], 2 => ['file', $travail . '/serveur.log', 'w']],
    $tuyaux
);
register_shutdown_function(function () use ($serveur, $travail) {
    if (is_resource($serveur)) {
        $etat = proc_get_status($serveur);
        if ($etat['running']) exec('kill -9 ' . $etat['pid'] . ' 2>/dev/null');
        proc_close($serveur);
    }
    // En cas d'échec, le journal du serveur de test est gardé : c'est lui qui
    // dit pourquoi une requête a répondu 500.
    global $echecs;
    if (!empty($echecs)) {
        $journal = sys_get_temp_dir() . '/suivi-test-serveur.log';
        @copy($travail . '/serveur.log', $journal);
        echo "Journal du serveur de test : $journal\n";
    }
    exec('rm -rf ' . escapeshellarg($travail));
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

    vider_compteurs();
    $freine = false;
    $avant = 0;
    for ($i = 0; $i < 330; $i++) {
        $statut = lire($code)['code'];
        if ($statut === 429) { $freine = true; break; }
        if ($statut === 200) $avant++;
    }
    vrai($freine, "le serveur aurait dû répondre 429 après trois cents requêtes");
    egal(300, $avant, "trois cents lectures passent avant le frein (l'appli envoie après chaque réponse)");
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

function cle_compteur_test(string $cle, int $secondes): string
{
    // Même calcul que lib/limite.php, avec le secret de la config de test.
    return 'l:' . substr(hash_hmac('sha256', $cle, 'JETON-DE-TEST'), 0, 40) . ':' . $secondes;
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

verifier("soixante codes inventés passent en 404, le suivant est freiné (eleve.php)", function () use (&$codesS1) {
    vider_compteurs();
    $statuts = [];
    for ($i = 0; $i < 61; $i++) $statuts[] = identite(code_inconnu($i))['code'];
    egal(60, count(array_filter($statuts, fn($s) => $s === 404)), '404 pour les 60 premiers');
    egal(429, $statuts[60], 'le 61e');
    egal(429, identite($codesS1[0])['code'], "tant que la fenêtre dure, même un bon code est freiné depuis cette adresse (sinon le 200 trahirait les bons codes)");
    egal(429, lire($codesS1[0])['code'], "la même limite vaut pour parcours.php : quota partagé");
    vider_compteurs();
    egal(200, identite($codesS1[0])['code'], 'contrôle : après remise à zéro, le bon code passe');
});

verifier("parcours.php : même frein sur les codes inventés", function () use (&$codesS1) {
    vider_compteurs();
    $statuts = [];
    for ($i = 0; $i < 61; $i++) $statuts[] = lire(code_inconnu($i))['code'];
    egal(60, count(array_filter($statuts, fn($s) => $s === 404)), '404 pour les 60 premiers');
    egal(429, $statuts[60], 'le 61e');
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
        vrai(!str_contains($csp, 'mathsgo.re\'') && !str_contains(explode('img-src', $csp)[0], 'mathsgo.re'), "$chemin : aucun script d'un autre domaine autorisé");
        vrai(str_contains($csp, "img-src 'self' https://mathsgo.re data:"), "$chemin : le logo et les icônes de mathsgo.re restent permis");
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
        $statuts[] = appel('/api/prof.php', ['action' => 'profs.motdepasse', 'ancien' => "essai-$i", 'nouveau' => 'un-nouveau-mot-de-passe-2026'], ['jeton' => $jetonClaire])['code'];
    }
    egal(12, count(array_keys($statuts, 400, true)), 'douze refus ordinaires');
    egal(429, $statuts[12], 'le treizième est freiné');
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

// ---------------------------------------------------------------------- résultat

echo "\n";
if ($echecs === []) {
    echo "$reussis tests, 0 échec.\n";
    exit(0);
}
echo count($echecs) . " ÉCHEC(S) sur " . ($reussis + count($echecs)) . " tests :\n";
foreach ($echecs as $e) echo "  - $e\n";
exit(1);
