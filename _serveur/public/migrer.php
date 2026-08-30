<?php
// Mise à niveau de la base, à utiliser UNE SEULE FOIS puis à supprimer.
//
// Ajoute ce qui manque pour que chaque classe ait un propriétaire et puisse
// être partagée. Ne touche jamais aux élèves, aux codes ni aux progressions.
// On peut la relancer sans risque : elle ne refait pas ce qui est déjà fait.

declare(strict_types=1);

require __DIR__ . '/lib/bd.php';

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');

$message = '';
$faits = [];
$termine = false;

try {
    $pdo = bd();
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        $attendu = (string)(config()['jeton_installation'] ?? '');
        if ($attendu === '' || $attendu === 'à-remplacer') {
            $message = "Renseigne d'abord « jeton_installation » dans config.php.";
        } elseif (!hash_equals($attendu, (string)($_POST['jeton'] ?? ''))) {
            $message = "Mot de passe d'installation incorrect.";
        } else {
            $faits = migrer_schema($pdo);
            $termine = true;
            $message = $faits === []
                ? "Il n'y avait rien à changer : la base était déjà à jour."
                : "C'est fait.";
        }
    }
} catch (Throwable $e) {
    error_log('migrer: ' . $e->getMessage());
    $message = "La base n'a pas répondu. Vérifie config.php.";
    $termine = false;
}
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Mise à jour du suivi maths&go</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; background: #f5f7fa; color: #1c2b3a; }
  main { max-width: 34rem; margin: 3rem auto; background: #fff; padding: 1.5rem; border-radius: 12px;
         box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  h1 { font-size: 1.3rem; margin-top: 0; }
  p.intro { color: #4a5b6e; }
  label { display: block; margin: 1rem 0 .3rem; font-weight: 600; }
  input { width: 100%; box-sizing: border-box; padding: .7rem; font-size: 1rem;
          border: 1px solid #b9c6d4; border-radius: 8px; }
  button { margin-top: 1.4rem; min-height: 44px; padding: 0 1.2rem; font-size: 1rem; font-weight: 600;
           color: #fff; background: #1d6fb8; border: 0; border-radius: 8px; cursor: pointer; }
  .message { margin-top: 1rem; padding: .8rem 1rem; border-radius: 8px; background: #fdf3d8; }
  .fini { background: #e2f4e4; }
  ul { margin: .6rem 0 0; padding-left: 1.2rem; }
  .apres { margin-top: 1.2rem; padding: .8rem 1rem; border-radius: 8px; background: #fdecec;
           font-weight: 600; color: #b42318; }
</style>
</head>
<body>
<main>
  <h1>Mise à jour du serveur de suivi</h1>
  <p class="intro">Cette page ajoute à la base ce qu'il faut pour que chaque classe
  appartienne à un professeur et puisse être partagée. Les élèves, les codes et
  les progressions ne sont pas touchés.</p>
  <?php if ($message !== ''): ?>
    <p class="message <?= $termine ? 'fini' : '' ?>"><?= htmlspecialchars($message, ENT_QUOTES) ?></p>
    <?php if ($faits !== []): ?>
      <ul>
        <?php foreach ($faits as $fait): ?>
          <li><?= htmlspecialchars($fait, ENT_QUOTES) ?></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  <?php endif; ?>
  <?php if ($termine): ?>
    <p class="apres">SUPPRIME MAINTENANT le fichier migrer.php du serveur, puis va sur /prof/.</p>
  <?php else: ?>
  <form method="post">
    <label for="jeton">Mot de passe d'installation (celui de config.php)</label>
    <input id="jeton" name="jeton" type="password" autocomplete="off" required>
    <button type="submit">Mettre la base à jour</button>
  </form>
  <?php endif; ?>
</main>
</body>
</html>
