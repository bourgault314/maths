<?php
// Ce que le serveur accepte d'enregistrer dans une progression.
//
// Le serveur ne comprend pas le SENS d'une progression — la fusion et
// l'affichage vivent dans l'appli, seule source de vérité. Mais il ne doit pas
// pour autant garder n'importe quoi : un client bricolé pourrait glisser un
// prénom, un texte libre, ou n'importe quelle donnée dans « tables.prenom » ou
// à n'importe quelle profondeur, et le serveur le conserverait en dehors de
// tout ce qui a été déclaré. Règle générique, appliquée à toute profondeur :
//  - une clé n'est gardée que si elle est connue de l'appli (lib/applis.php),
//    ou si elle a la forme d'une clé de table (« 7 ») ou de calcul (« 3-7 ») ;
//  - une valeur n'est gardée que si c'est un entier borné, un booléen, null,
//    une date « AAAA-MM-JJ », ou un mot d'une liste fermée ;
//  - toute autre chaîne est retirée : AUCUN texte libre ne peut être enregistré,
//    prénom compris ;
//  - les listes ne contiennent que des scalaires ; profondeur et nombre de
//    clés bornés.
// Les clés inconnues sont retirées, pas rejetées : un client ancien ne doit pas
// casser. Garde-fou contre la divergence (l'appli ajoute un champ, le serveur
// le jette en silence) : tests/parcours-reference.json, généré par l'appli, doit
// ressortir identique — voir tests/lancer.php.

declare(strict_types=1);

const PROGRESSION_PROFONDEUR_MAX = 6;
const PROGRESSION_CLES_MAX = 2000;
const PROGRESSION_LISTE_MAX = 100;
const PROGRESSION_ENTIER_MAX = 1000000;

function regles_progression(string $appli): array
{
    $definition = CATALOGUE_APPLIS[$appli] ?? [];
    return [
        'cles' => array_fill_keys($definition['cles'] ?? [], true),
        'mots' => array_fill_keys($definition['mots'] ?? [], true),
        'motifs' => $definition['motifs'] ?? [],
    ];
}

// Une VRAIE date « AAAA-MM-JJ ».
//
// Lot 11 (05/09/2026, A-annexe 8) : la règle disait « une date », le contrôle
// ne regardait que la FORME — « 9999-99-99 » et « 0000-00-00 » entraient et
// étaient rangés tels quels. Aucun danger (des chiffres et des tirets, jamais
// du texte libre), mais une promesse plus large que ce qu'elle tenait ; et
// l'appli, elle, compare ces dates entre elles. checkdate() vérifie le mois,
// le jour et les années bissextiles.
function date_reelle(string $valeur): bool
{
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $valeur, $m) !== 1) return false;
    return checkdate((int)$m[2], (int)$m[3], (int)$m[1]);
}

function cle_progression_acceptee(string $cle, array $regles): bool
{
    if (isset($regles['cles'][$cle])) return true;
    foreach ($regles['motifs'] as $motif) {
        if (preg_match($motif, $cle) === 1) return true;
    }
    return false;
}

// Renvoie la valeur nettoyée, ou null avec $garder = false si elle doit sauter.
// Les données arrivent décodées SANS le mode associatif (json_decode(…, false)) :
// un objet JSON est un stdClass, une liste JSON est un array — ainsi « {} »
// reste « {} » et « [] » reste « [] », et l'appli relit exactement ce qu'elle a
// envoyé.
function valeur_progression_acceptee(mixed $valeur, array $regles, int $profondeur, int &$compte, bool &$garder): mixed
{
    $garder = true;
    if ($valeur === null || is_bool($valeur)) return $valeur;
    if (is_int($valeur)) {
        if (abs($valeur) > PROGRESSION_ENTIER_MAX) { $garder = false; return null; }
        return $valeur;
    }
    if (is_float($valeur)) {
        // Les JSON de l'appli n'ont que des entiers ; un flottant entier est toléré.
        if (floor($valeur) !== $valeur || abs($valeur) > PROGRESSION_ENTIER_MAX) { $garder = false; return null; }
        return (int)$valeur;
    }
    if (is_string($valeur)) {
        if (date_reelle($valeur)) return $valeur;
        if (isset($regles['mots'][$valeur])) return $valeur;
        $garder = false;
        return null;
    }
    if (is_array($valeur)) {
        if ($profondeur >= PROGRESSION_PROFONDEUR_MAX) { $garder = false; return null; }
        $liste = [];
        foreach (array_slice($valeur, 0, PROGRESSION_LISTE_MAX) as $element) {
            if (is_array($element) || is_object($element)) continue;
            $ok = true;
            $propre = valeur_progression_acceptee($element, $regles, $profondeur + 1, $compte, $ok);
            if ($ok) $liste[] = $propre;
        }
        return $liste;
    }
    if (is_object($valeur)) {
        if ($profondeur >= PROGRESSION_PROFONDEUR_MAX) { $garder = false; return null; }
        $objet = new stdClass();
        foreach (get_object_vars($valeur) as $cle => $element) {
            $cle = (string)$cle;
            if (!cle_progression_acceptee($cle, $regles)) continue;
            if (++$compte > PROGRESSION_CLES_MAX) break;
            $ok = true;
            $propre = valeur_progression_acceptee($element, $regles, $profondeur + 1, $compte, $ok);
            if ($ok) $objet->{$cle} = $propre;
        }
        return $objet;
    }
    $garder = false;
    return null;
}

// La progression telle que le serveur accepte de l'enregistrer.
function filtrer_progression(string $appli, object $donnees): stdClass
{
    $regles = regles_progression($appli);
    $compte = 0;
    $garder = true;
    $propre = valeur_progression_acceptee($donnees, $regles, 0, $compte, $garder);
    return $propre instanceof stdClass ? $propre : new stdClass();
}
