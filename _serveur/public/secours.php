<?php
// Secours — À DÉPOSER SEULEMENT LE JOUR OÙ TU ES BLOQUÉ, PUIS À SUPPRIMER.
//
// Le compte administrateur est unique : personne ne peut lui redonner un mot
// de passe depuis l'application (« on ne se réinitialise pas soi-même », et
// c'est la bonne règle). Jusqu'au lot 12, la seule issue était d'aller
// modifier la base à la main chez OVH.
//
// Cette page fait la même chose, proprement : elle demande le mot de passe
// d'installation (jeton_installation de config.php, que seul quelqu'un ayant
// l'accès FTP peut lire), puis remet un mot de passe à un compte
// administrateur, le réactive s'il était désactivé et ferme toutes ses
// sessions. La clé de secours, c'est donc l'accès FTP — pas un papier de plus
// à perdre.
//
// verifier.php devient ROUGE tant que ce fichier reste en ligne.
// Mode d'emploi complet : _serveur/EXPLOITATION.md.

declare(strict_types=1);

require __DIR__ . '/lib/bd.php';
require __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/entetes.php';

header('Content-Type: text/html; charset=utf-8');
entetes_page();
header('X-Robots-Tag: noindex, nofollow');

$message = '';
$termine = false;
$autorise = false;
$comptes = [];

function comptes_administrateurs(PDO $pdo): array
{
    $lignes = $pdo->query('SELECT id, identifiant, actif, admin FROM profs ORDER BY admin DESC, id')->fetchAll();
    $comptes = [];
    foreach ($lignes as $ligne) {
        $comptes[] = [
            'id' => (int)$ligne['id'],
            'identifiant' => (string)$ligne['identifiant'],
            'actif' => (int)$ligne['actif'] === 1,
            'admin' => (int)$ligne['admin'] === 1,
        ];
    }
    return $comptes;
}

try {
    $pdo = bd();
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        // Même sur une page déposée cinq minutes, on ne laisse pas essayer le
        // mot de passe d'installation en boucle. On compte soi-même plutôt que
        // d'appeler limiter() : celui-ci répondrait en JSON, ce qui n'a pas de
        // sens sur une page qui s'affiche.
        $essais = compter('secours:' . adresse_appelante(), 600);
        $attendu = (string)(config()['jeton_installation'] ?? '');
        if ($essais > 10) {
            $message = "Trop d'essais depuis cette adresse : attends dix minutes.";
        } elseif ($attendu === '' || $attendu === 'à-remplacer') {
            $message = "Renseigne d'abord « jeton_installation » dans config.php.";
        } elseif (!hash_equals($attendu, (string)($_POST['jeton'] ?? ''))) {
            $message = "Mot de passe d'installation incorrect.";
        } else {
            $autorise = true;
            $comptes = comptes_administrateurs($pdo);
            $profId = (int)($_POST['prof_id'] ?? 0);
            $nouveau = (string)($_POST['nouveau'] ?? '');
            $repete = (string)($_POST['repete'] ?? '');
            if ($profId > 0) {
                $cible = null;
                foreach ($comptes as $compte) if ($compte['id'] === $profId) $cible = $compte;
                if ($cible === null) {
                    $message = "Ce compte n'existe pas.";
                } elseif ($nouveau !== $repete) {
                    $message = "Les deux mots de passe saisis ne sont pas les mêmes.";
                } elseif (($reproche = motdepasse_refuse($nouveau, $cible['identifiant'])) !== null) {
                    $message = $reproche;
                } else {
                    // Le compte redevient utilisable tout de suite : pas de mot
                    // de passe temporaire à rechanger (tu es déjà au clavier),
                    // administrateur, actif, et toutes ses sessions fermées —
                    // celle qui traînait sur un poste de la salle des profs
                    // comprise.
                    $pdo->prepare('UPDATE profs SET mdp_hash = ?, actif = 1, admin = 1, mdp_temporaire = 0 WHERE id = ?')
                        ->execute([hacher_motdepasse($nouveau), $profId]);
                    fermer_sessions_du_prof($pdo, $profId);
                    $termine = true;
                    $message = "Le mot de passe du compte « {$cible['identifiant']} » est remplacé. "
                        . "Il est administrateur, actif, et ses anciennes sessions sont fermées.";
                }
            }
        }
    }
} catch (Throwable $e) {
    error_log('secours: ' . $e->getMessage());
    $message = "La base n'a pas répondu. Vérifie config.php.";
    $autorise = false;
    $termine = false;
}
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Secours — serveur de suivi maths&go</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; background: #f5f7fa; color: #1c2b3a; }
  main { max-width: 34rem; margin: 3rem auto; background: #fff; padding: 1.5rem; border-radius: 12px;
         box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  h1 { font-size: 1.3rem; margin-top: 0; }
  p.intro { color: #4a5b6e; }
  label { display: block; margin: 1rem 0 .3rem; font-weight: 600; }
  input, select { width: 100%; box-sizing: border-box; padding: .7rem; font-size: 1rem;
          border: 1px solid #b9c6d4; border-radius: 8px; }
  button { margin-top: 1.4rem; min-height: 44px; padding: 0 1.2rem; font-size: 1rem; font-weight: 600;
           color: #fff; background: #1d6fb8; border: 0; border-radius: 8px; cursor: pointer; }
  .message { margin-top: 1rem; padding: .8rem 1rem; border-radius: 8px; background: #fdf3d8; }
  .fini { background: #e2f4e4; }
  .apres { margin-top: 1.2rem; padding: .8rem 1rem; border-radius: 8px; background: #fdecec;
           font-weight: 600; color: #b42318; }
</style>
</head>
<body>
<main>
  <h1>Reprendre la main sur le compte administrateur</h1>
  <p class="intro">Cette page remet un mot de passe à un compte du suivi, le rend
  administrateur et actif, et ferme toutes ses sessions. Elle ne touche ni aux
  classes, ni aux élèves, ni aux progressions.</p>
  <?php if ($message !== ''): ?>
    <p class="message <?= $termine ? 'fini' : '' ?>"><?= htmlspecialchars($message, ENT_QUOTES) ?></p>
  <?php endif; ?>
  <?php if ($termine): ?>
    <p class="apres">SUPPRIME MAINTENANT le fichier secours.php du serveur, puis connecte-toi sur /prof/.</p>
  <?php else: ?>
  <form method="post" autocomplete="off">
    <label for="jeton">Mot de passe d'installation (celui de config.php)</label>
    <input id="jeton" name="jeton" type="password" required <?= $autorise ? '' : 'autofocus' ?>>
    <?php if ($autorise && $comptes !== []): ?>
      <label for="prof_id">Compte à débloquer</label>
      <select id="prof_id" name="prof_id" required>
        <?php foreach ($comptes as $compte): ?>
          <option value="<?= $compte['id'] ?>"><?= htmlspecialchars($compte['identifiant'], ENT_QUOTES) ?><?=
            $compte['admin'] ? ' (administrateur)' : '' ?><?= $compte['actif'] ? '' : ' — désactivé' ?></option>
        <?php endforeach; ?>
      </select>
      <label for="nouveau">Nouveau mot de passe (12 caractères au moins)</label>
      <input id="nouveau" name="nouveau" type="password" required autofocus>
      <label for="repete">Le même, pour être sûr</label>
      <input id="repete" name="repete" type="password" required>
      <button type="submit">Remettre ce mot de passe</button>
    <?php else: ?>
      <button type="submit">Continuer</button>
    <?php endif; ?>
  </form>
  <?php endif; ?>
</main>
</body>
</html>
