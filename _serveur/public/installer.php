<?php
// Page d'installation, à utiliser UNE SEULE FOIS puis à supprimer.
// Crée les tables et le premier compte prof.

declare(strict_types=1);

require __DIR__ . '/lib/bd.php';
require __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/entetes.php';

header('Content-Type: text/html; charset=utf-8');
entetes_page();

$message = '';
$termine = false;

try {
    $pdo = bd();
    installer_tables($pdo);
    $dejaInstalle = (int)$pdo->query('SELECT COUNT(*) FROM profs')->fetchColumn() > 0;

    if ($dejaInstalle) {
        $termine = true;
        $message = "Le serveur est déjà installé. Tu peux supprimer ce fichier installer.php.";
    } elseif (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        $attendu = (string)(config()['jeton_installation'] ?? '');
        if ($attendu === '' || $attendu === 'à-remplacer') {
            $message = "Renseigne d'abord « jeton_installation » dans config.php.";
        } elseif (!hash_equals($attendu, (string)($_POST['jeton'] ?? ''))) {
            $message = "Mot de passe d'installation incorrect.";
        } else {
            try {
                // Le tout premier compte est administrateur : lui seul pourra en créer d'autres.
                creer_prof($pdo, (string)($_POST['identifiant'] ?? ''), (string)($_POST['motdepasse'] ?? ''), true);
                $termine = true;
                $message = "Compte créé. SUPPRIME MAINTENANT le fichier installer.php, puis va sur /prof/.";
            } catch (InvalidArgumentException $e) {
                $message = $e->getMessage();
            }
        }
    }
} catch (Throwable $e) {
    $message = "Erreur : " . $e->getMessage();
}
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Installation du suivi maths&go</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; background: #f5f7fa; color: #1c2b3a; }
  main { max-width: 34rem; margin: 3rem auto; background: #fff; padding: 1.5rem; border-radius: 12px;
         box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  h1 { font-size: 1.3rem; margin-top: 0; }
  label { display: block; margin: 1rem 0 .3rem; font-weight: 600; }
  input { width: 100%; box-sizing: border-box; padding: .7rem; font-size: 1rem;
          border: 1px solid #b9c6d4; border-radius: 8px; }
  button { margin-top: 1.4rem; min-height: 44px; padding: 0 1.2rem; font-size: 1rem; font-weight: 600;
           color: #fff; background: #1d6fb8; border: 0; border-radius: 8px; cursor: pointer; }
  .message { margin-top: 1rem; padding: .8rem 1rem; border-radius: 8px; background: #fdf3d8; }
  .fini { background: #e2f4e4; }
</style>
</head>
<body>
<main>
  <h1>Installation du serveur de suivi</h1>
  <?php if ($message !== ''): ?>
    <p class="message <?= $termine ? 'fini' : '' ?>"><?= htmlspecialchars($message, ENT_QUOTES) ?></p>
  <?php endif; ?>
  <?php if (!$termine): ?>
  <form method="post">
    <label for="jeton">Mot de passe d'installation (celui de config.php)</label>
    <input id="jeton" name="jeton" type="password" autocomplete="off" required>
    <label for="identifiant">Ton identifiant de prof</label>
    <input id="identifiant" name="identifiant" type="text" autocomplete="username" required>
    <label for="motdepasse">Ton mot de passe (12 caractères minimum)</label>
    <input id="motdepasse" name="motdepasse" type="password" autocomplete="new-password" minlength="12" required>
    <button type="submit">Créer mon compte</button>
  </form>
  <?php endif; ?>
</main>
</body>
</html>
