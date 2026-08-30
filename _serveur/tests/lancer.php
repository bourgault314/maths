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
file_put_contents($travail . '/config.php', "<?php return " . var_export([
    'bd' => ['dsn' => 'sqlite:' . $base],
    'origines' => ['https://mathsgo.re', 'https://suivi.mathsgo.re'],
    'jeton_installation' => 'JETON-DE-TEST',
], true) . ";\n");

$port = 8000 + random_int(0, 900);
$serveur = proc_open(
    sprintf('php -S 127.0.0.1:%d -t %s', $port, escapeshellarg($travail)),
    [1 => ['file', '/dev/null', 'w'], 2 => ['file', $travail . '/serveur.log', 'w']],
    $tuyaux
);
register_shutdown_function(function () use ($serveur, $travail) {
    if (is_resource($serveur)) {
        $etat = proc_get_status($serveur);
        if ($etat['running']) exec('kill -9 ' . $etat['pid'] . ' 2>/dev/null');
        proc_close($serveur);
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

echo "Serveur de suivi — tests de bout en bout\n\n";

// ------------------------------------------------------------------ diagnostic

verifier("verifier.php signale l'installation manquante", function () {
    $r = appel('/verifier.php');
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

$parcours = ['version' => 1, 'prenom' => 'Léa', 'tables' => ['7' => ['acquise' => '2026-08-29']]];

verifier("code inconnu refusé", function () {
    $r = appel('/api/parcours.php?code=ZZZZZZ');
    egal(404, $r['code'], 'code HTTP');
});

verifier("code mal formé refusé", function () {
    foreach (['', 'ABC', 'ABCDEFG', 'AAAA0A', '<script>'] as $mauvais) {
        $r = appel('/api/parcours.php?code=' . urlencode($mauvais));
        egal(400, $r['code'], "code HTTP pour « $mauvais »");
    }
});

verifier("tentative d'injection SQL sans effet", function () use (&$jeton) {
    $r = appel('/api/parcours.php?code=' . urlencode("' OR '1'='1"));
    egal(400, $r['code'], 'code HTTP');
    $r = appel('/api/prof.php', ['action' => 'classes.liste'], ['jeton' => $jeton]);
    egal(200, $r['code'], "la base doit être intacte");
});

verifier("élève sans progression enregistrée", function () use (&$codes) {
    $r = appel('/api/parcours.php?code=' . $codes[0]['code']);
    egal(200, $r['code'], 'code HTTP');
    egal(false, $r['json']['existe']);
    egal(null, $r['json']['parcours']);
});

verifier("enregistrement puis relecture de la progression", function () use (&$codes, $parcours) {
    $r = appel('/api/parcours.php', ['code' => $codes[0]['code'], 'parcours' => $parcours]);
    egal(200, $r['code'], 'code HTTP');
    vrai(!empty($r['json']['maj_le']), "une date de mise à jour devrait revenir");

    $r = appel('/api/parcours.php?code=' . $codes[0]['code']);
    egal(true, $r['json']['existe']);
    egal($parcours, $r['json']['parcours'], 'progression relue');
});

verifier("la progression se retrouve avec le code minuscule ou espacé", function () use (&$codes, $parcours) {
    $r = appel('/api/parcours.php?code=' . urlencode(' ' . strtolower($codes[0]['code']) . ' '));
    egal(200, $r['code'], 'code HTTP');
    egal($parcours, $r['json']['parcours']);
});

verifier("un élève n'écrit que sur son propre code", function () use (&$codes) {
    $r = appel('/api/parcours.php?code=' . $codes[1]['code']);
    egal(false, $r['json']['existe'], "le voisin ne doit rien avoir");
});

verifier("progression trop volumineuse refusée", function () use (&$codes) {
    $gros = ['version' => 1, 'bloc' => str_repeat('x', 45000)];
    $r = appel('/api/parcours.php', ['code' => $codes[1]['code'], 'parcours' => $gros]);
    vrai(in_array($r['code'], [413], true), "attendu 413, obtenu " . $r['code']);
    $r = appel('/api/parcours.php?code=' . $codes[1]['code']);
    egal(false, $r['json']['existe'], "rien ne doit avoir été enregistré");
});

verifier("progression absente ou illisible refusée", function () use (&$codes) {
    $r = appel('/api/parcours.php', ['code' => $codes[1]['code']]);
    egal(400, $r['code'], 'code HTTP');
    $r = appel('/api/parcours.php', 'ceci-n-est-pas-du-json');
    egal(400, $r['code'], 'code HTTP');
});

verifier("application inconnue refusée", function () use (&$codes) {
    $r = appel('/api/parcours.php?code=' . $codes[0]['code'] . '&appli=nimporte');
    egal(400, $r['code'], 'code HTTP');
});

verifier("les applis sont bien séparées", function () use (&$codes, $parcours) {
    $r = appel('/api/parcours.php?code=' . $codes[0]['code'] . '&appli=automatismes');
    egal(false, $r['json']['existe'], "Automatismes ne doit pas voir Défi tables");
    appel('/api/parcours.php', ['code' => $codes[0]['code'], 'appli' => 'automatismes', 'parcours' => ['a' => 1]]);
    $r = appel('/api/parcours.php?code=' . $codes[0]['code']);
    egal($parcours, $r['json']['parcours'], "Défi tables ne doit pas avoir bougé");
});

// ------------------------------------------------------------- page d'accueil élève

verifier("la page élève reconnaît le code et donne les applis de la classe", function () use (&$codes) {
    $r = appel('/api/eleve.php?code=' . $codes[0]['code']);
    egal(200, $r['code'], 'code HTTP');
    egal('Léa', $r['json']['prenom']);
    egal('405', $r['json']['classe']);
    egal(1, count($r['json']['applis']), 'nombre d\'applis');
    egal('defi-tables', $r['json']['applis'][0]['cle']);
    egal(true, $r['json']['applis'][0]['disponible']);
    vrai(str_contains($r['json']['applis'][0]['url'], 'defi_tables.html'), "l'appli doit pointer vers mathsgo.re");
});

verifier("la page élève refuse un code inconnu ou mal formé", function () {
    egal(404, appel('/api/eleve.php?code=ZZZZZZ')['code'], 'code HTTP');
    egal(400, appel('/api/eleve.php?code=AB')['code'], 'code HTTP');
    egal(400, appel('/api/eleve.php?code=' . urlencode("' OR 1=1"))['code'], 'code HTTP');
});

verifier("la page élève ne donne aucun code en retour", function () use (&$codes) {
    $r = appel('/api/eleve.php?code=' . $codes[0]['code']);
    vrai(!str_contains($r['texte'], $codes[1]['code']), "aucun code d'un autre élève ne doit sortir");
    vrai(!array_key_exists('code', $r['json']), "le code ne doit pas être renvoyé");
});

// -------------------------------------------------------------------------- CORS

verifier("origine autorisée acceptée", function () use (&$codes) {
    $r = appel('/api/parcours.php?code=' . $codes[0]['code'], null, ['origine' => 'https://mathsgo.re']);
    vrai(stripos($r['entetes'], 'Access-Control-Allow-Origin: https://mathsgo.re') !== false,
        "l'en-tête CORS devrait autoriser mathsgo.re");
});

verifier("origine inconnue non autorisée", function () use (&$codes) {
    $r = appel('/api/parcours.php?code=' . $codes[0]['code'], null, ['origine' => 'https://site-pirate.example']);
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

    egal(404, appel('/api/parcours.php?code=' . $ancien)['code'], "l'ancien code ne doit plus marcher");
    $r = appel('/api/parcours.php?code=' . $nouveau);
    egal($parcours, $r['json']['parcours'], "la progression suit le nouveau code");
    $codes[0]['code'] = $nouveau;
});

verifier("supprimer un élève efface aussi sa progression", function () use (&$codes, &$jeton) {
    $code = $codes[11]['code'];
    appel('/api/parcours.php', ['code' => $code, 'parcours' => ['version' => 1]]);
    $r = appel('/api/prof.php', ['action' => 'eleves.supprimer', 'eleve_id' => $codes[11]['id']], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    egal(404, appel('/api/parcours.php?code=' . $code)['code'], "le code ne doit plus exister");
});

verifier("supprimer une classe efface ses élèves", function () use (&$classeId, &$codes, &$jeton) {
    $code = $codes[1]['code'];
    $r = appel('/api/prof.php', ['action' => 'classes.supprimer', 'classe_id' => $classeId], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    egal(404, appel('/api/parcours.php?code=' . $code)['code'], "les codes de la classe doivent disparaître");
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

verifier("le compte administrateur crée un deuxième professeur", function () use (&$jeton, &$jetonClaire) {
    $r = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'claire',
        'motdepasse' => 'motdepasse-de-claire-2026'], ['jeton' => $jeton]);
    egal(200, $r['code'], 'code HTTP');
    $r = appel('/api/prof.php', ['action' => 'connexion', 'identifiant' => 'claire',
        'motdepasse' => 'motdepasse-de-claire-2026']);
    egal(200, $r['code'], 'la nouvelle prof doit pouvoir se connecter');
    $jetonClaire = $r['json']['jeton'];
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

verifier("un mot de passe trop court est refusé", function () use (&$jeton) {
    $r = appel('/api/prof.php', ['action' => 'profs.ajouter', 'identifiant' => 'court',
        'motdepasse' => 'court'], ['jeton' => $jeton]);
    egal(400, $r['code'], 'code HTTP');
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

    $freine = false;
    for ($i = 0; $i < 130; $i++) {
        if (appel('/api/parcours.php?code=' . $code)['code'] === 429) { $freine = true; break; }
    }
    vrai($freine, "le serveur aurait dû répondre 429 après une centaine de requêtes");
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
