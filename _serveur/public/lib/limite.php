<?php
// Limitation du nombre de requêtes, par code élève ou par adresse IP.

declare(strict_types=1);

function limiter(string $cle, int $maximum, int $secondes): void
{
    $pdo = bd();
    $fenetre = intdiv(time(), $secondes);
    $cle = substr($cle, 0, 70) . ':' . $secondes;

    $requete = $pdo->prepare('SELECT fenetre, nombre FROM compteurs WHERE cle = ?');
    $requete->execute([$cle]);
    $ligne = $requete->fetch();

    if ($ligne === false) {
        $pdo->prepare('INSERT INTO compteurs (cle, fenetre, nombre) VALUES (?, ?, 1)')
            ->execute([$cle, $fenetre]);
        return;
    }
    if ((int)$ligne['fenetre'] !== $fenetre) {
        $pdo->prepare('UPDATE compteurs SET fenetre = ?, nombre = 1 WHERE cle = ?')
            ->execute([$fenetre, $cle]);
        return;
    }
    if ((int)$ligne['nombre'] >= $maximum) {
        erreur("Trop de demandes, réessaie dans un instant.", 429);
    }
    $pdo->prepare('UPDATE compteurs SET nombre = nombre + 1 WHERE cle = ?')->execute([$cle]);
}

function adresse_appelante(): string
{
    return (string)($_SERVER['REMOTE_ADDR'] ?? 'inconnue');
}
