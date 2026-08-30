<?php
// Réponses JSON, CORS et lecture du corps de requête.

declare(strict_types=1);

require_once __DIR__ . '/entetes.php';

function origines_autorisees(): array
{
    $c = config();
    return $c['origines'] ?? ['https://mathsgo.re'];
}

function cors(): void
{
    entetes_securite();
    $origine = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origine !== '' && in_array($origine, origines_autorisees(), true)) {
        header('Access-Control-Allow-Origin: ' . $origine);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function repondre(array $donnees, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function erreur(string $message, int $code = 400): never
{
    repondre(['ok' => false, 'erreur' => $message], $code);
}

function corps_json(int $maxOctets): array
{
    $brut = file_get_contents('php://input');
    if ($brut === false) $brut = '';
    if (strlen($brut) > $maxOctets) {
        erreur("Envoi trop volumineux.", 413);
    }
    if ($brut === '') return [];
    $donnees = json_decode($brut, true);
    if (!is_array($donnees)) {
        erreur("Corps de requête illisible.", 400);
    }
    return $donnees;
}
