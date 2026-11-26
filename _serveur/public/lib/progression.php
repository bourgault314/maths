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

require_once __DIR__ . '/applis.php';

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
        'listes' => $definition['listes'] ?? [],
    ];
}

// Correctif K1 de Défi calcul (26/11/2026, relecture de Codex) : la forme
// PAR EMPLACEMENT, pour une appli qui la déclare (lib/applis.php,
// « emplacements »). Le filtre générique, plus bas, juge une clé par son nom
// seul, à toute profondeur, et un entier par une borne commune : tout champ
// connu passait n'importe où, avec n'importe quelle valeur jusqu'à un
// million. Ici, chaque valeur est jugée À SA PLACE (le chemin de ses clés,
// « seance.i », « modules.*.c.* ») :
//  - une clé sans emplacement déclaré est retirée ;
//  - une valeur seule hors de sa forme est retirée (le moteur reprend son
//    défaut) ; null reste null à la place d'une date ;
//  - dans une liste, une valeur hors de sa forme est REMPLACÉE à sa place
//    (valeur_de_liste), jamais retirée ; une liste « places » a des bornes
//    place par place, et se coupe à leur nombre (ou, en « cycle », au
//    dernier groupe complet).
// Renvoie la valeur nettoyée, ou null avec $garder = false si elle saute.
function valeur_a_sa_place(mixed $valeur, array $emplacements, array $motifs, string $chemin, bool &$garder): mixed
{
    $garder = true;
    $forme = $emplacements[$chemin] ?? null;
    $sorte = is_array($forme) ? ($forme[0] ?? '') : '';
    if ($sorte === 'objet' || $sorte === 'motif') {
        if (!is_object($valeur)) { $garder = false; return null; }
        $motif = $sorte === 'motif' ? ($motifs[(int)($forme[1] ?? -1)] ?? null) : null;
        $objet = new stdClass();
        foreach (get_object_vars($valeur) as $cle => $element) {
            $cle = (string)$cle;
            if ($sorte === 'motif') {
                if (!is_string($motif) || preg_match($motif, $cle) !== 1) continue;
                $suite = $chemin . '.*';
            } else {
                $suite = $chemin === '' ? $cle : $chemin . '.' . $cle;
            }
            if (!isset($emplacements[$suite])) continue;
            $ok = true;
            $propre = valeur_a_sa_place($element, $emplacements, $motifs, $suite, $ok);
            if ($ok) $objet->{$cle} = $propre;
        }
        return $objet;
    }
    if ($sorte === 'liste') {
        if (!is_array($valeur)) { $garder = false; return null; }
        $une = is_array($forme[1] ?? null) ? $forme[1] : [];
        return array_map(fn($v) => valeur_de_liste($v, $une), array_slice($valeur, 0, PROGRESSION_LISTE_MAX));
    }
    if ($sorte === 'places') {
        $places = is_array($forme[1] ?? null) ? $forme[1] : [];
        $nombre = count($places);
        if (!is_array($valeur) || $nombre === 0) { $garder = false; return null; }
        if (($forme[2] ?? '') === 'cycle') {
            $liste = array_slice($valeur, 0, PROGRESSION_LISTE_MAX);
            $liste = array_slice($liste, 0, intdiv(count($liste), $nombre) * $nombre);
        } else {
            $liste = array_slice($valeur, 0, $nombre);
        }
        $propre = [];
        foreach ($liste as $rang => $v) {
            $bornes = $places[$rang % $nombre];
            $propre[] = valeur_de_liste($v, ['entier', $bornes[0], $bornes[1]]);
        }
        return $propre;
    }
    if ($sorte === 'date') {
        if ($valeur === null) return null;
        if (is_string($valeur) && date_reelle($valeur)) return $valeur;
        $garder = false;
        return null;
    }
    if ($sorte === 'entier') {
        if (is_float($valeur) && floor($valeur) === $valeur) $valeur = (int)$valeur;
        if (is_int($valeur) && $valeur >= (int)($forme[1] ?? 0) && $valeur <= (int)($forme[2] ?? PROGRESSION_ENTIER_MAX)) return $valeur;
        $garder = false;
        return null;
    }
    $garder = false;
    return null;
}

// Correctif F4 de Défi calcul (21/11/2026, relecture de Codex) : une liste
// dont l'appli déclare la forme (lib/applis.php, « listes ») garde sa
// longueur — chaque valeur hors format est REMPLACÉE à sa place (null pour
// une date, le minimum pour un entier), jamais retirée : retirée, les
// suivantes glissaient d'une case. Formes : ['date'] (une vraie date ou
// null) ; ['entier', min, max].
function valeur_de_liste(mixed $valeur, array $forme): mixed
{
    if (($forme[0] ?? '') === 'date') {
        return is_string($valeur) && date_reelle($valeur) ? $valeur : null;
    }
    if (($forme[0] ?? '') === 'entier') {
        $min = (int)($forme[1] ?? 0);
        $max = (int)($forme[2] ?? PROGRESSION_ENTIER_MAX);
        if (is_float($valeur) && floor($valeur) === $valeur) $valeur = (int)$valeur;
        return is_int($valeur) && $valeur >= $min && $valeur <= $max ? $valeur : $min;
    }
    return null;
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
            if (isset($regles['listes'][$cle]) && is_array($element)) {
                $forme = $regles['listes'][$cle];
                $objet->{$cle} = array_map(fn($v) => valeur_de_liste($v, $forme), array_slice($element, 0, PROGRESSION_LISTE_MAX));
                continue;
            }
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
    $propre = $propre instanceof stdClass ? $propre : new stdClass();
    // Puis, pour une appli qui la déclare, la forme par emplacement.
    $emplacements = CATALOGUE_APPLIS[$appli]['emplacements'] ?? null;
    if (is_array($emplacements)) {
        $aSaPlace = valeur_a_sa_place($propre, $emplacements, $regles['motifs'], '', $garder);
        $propre = $aSaPlace instanceof stdClass ? $aSaPlace : new stdClass();
    }
    return $propre;
}

// ------------------------------------------------- l'époque d'une progression
//
// Lot serveur B (06/09/2026) — défaut TROUVÉ EN PRODUCTION par Gwenaël, sur la
// classe « test », le jour même de la mise en ligne de la PR A.
//
// Ce qu'il a vu : Léa valide la table 1 ; le professeur restaure « avant le
// dernier enregistrement » (zéro table) ; Léa valide la table 2 ; le tableau
// affiche DEUX tables. En basculant plusieurs fois d'une version à l'autre,
// tout converge vers « deux tables » : la restauration est défaite à chaque
// fois. Autrement dit, le bouton du professeur ne servait à rien dès que
// l'appareil de l'élève était encore ouvert — et c'est précisément le cas où
// l'on s'en sert (un intrus vient de jouer sur la tablette du CDI).
//
// Pourquoi. La fusion vit dans l'appli (defi_tables_mon_parcours.js,
// « fusionner »), et elle est faite pour ne RIEN perdre : à époque égale, elle
// prend le maximum de chaque compteur et garde toute table acquise. Elle ne
// donne raison à un état EN BLOC que si son « epoque » est plus haute — c'est
// ce qui fait marcher la remise à zéro de l'élève, seule à l'incrémenter
// jusqu'ici. Une restauration, elle, reposait l'ancien JSON tel quel, époque
// comprise : pour l'appareil, ce n'était pas « reviens en arrière », c'était
// « voici un autre état de la même génération », et il additionnait.
//
// Le correctif tient côté SERVEUR, le moteur ne change pas : une version
// restaurée repart avec une époque strictement supérieure aux deux états en
// présence. Tout appareil qui porte une époque plus basse l'adopte en bloc à
// sa prochaine synchronisation. Le prénom, lui, reste celui de l'appareil
// devant l'élève : « fusionner » le préserve même quand une époque gagne.
function epoque_de(string $donneesJson): int
{
    $objet = json_decode($donneesJson, false);
    if (!is_object($objet)) return 0;
    $epoque = $objet->epoque ?? 0;
    if (is_float($epoque) && floor($epoque) === $epoque) $epoque = (int)$epoque;
    return is_int($epoque) && $epoque >= 0 ? $epoque : 0;
}

// La version à restaurer, avec une époque qui gagne contre $courantJson.
//
// Repasse par filtrer_progression() comme n'importe quelle écriture : rien ne
// doit pouvoir entrer par cette porte-là qui ne serait pas entré par l'autre.
// Si l'appli ne déclare pas « epoque » dans son catalogue, le filtre la retire
// et la restauration se comporte comme avant — c'est voulu : l'époque est une
// notion de l'appli, pas du serveur.
//
// Lot « petits correctifs de sécurité » (11/11/2026, constat F03 de l'audit
// GPT du 09/11) : l'époque relevée ne dépasse jamais PROGRESSION_ENTIER_MAX.
// Avant, un état courant à 1 000 000 (posé par quelqu'un qui connaît le code)
// donnait 1 000 001 ; le filtre retirait cette valeur hors bornes, la version
// restaurée repartait SANS époque, et la mauvaise copie gagnait toutes les
// fusions : le bouton du professeur ne servait plus à rien. Depuis ce lot,
// une écriture d'élève ne peut plus faire monter l'époque que d'un cran
// passé 100 (epoque_bornee, api/parcours.php) : l'état courant reste loin du
// plafond, et « courant + 1 » gagne. Le plafond ne joue que pour un état d'AVANT ce lot
// déjà à 1 000 000 (aucun connu) : la version restaurée garde alors son
// époque au plafond, à égalité — la fusion additionne au lieu de trancher,
// mais rien n'est plus perdu en silence.
function version_avec_epoque_relevee(string $appli, string $versJson, string $courantJson): string
{
    $vers = json_decode($versJson, false);
    if (!is_object($vers)) return $versJson;
    $vers->epoque = min(max(epoque_de($versJson), epoque_de($courantJson)) + 1, PROGRESSION_ENTIER_MAX);
    $encode = json_encode(filtrer_progression($appli, $vers), JSON_UNESCAPED_UNICODE);
    return is_string($encode) ? $encode : $versJson;
}

// Une écriture d'ÉLÈVE ne fait monter l'époque que d'un cran au plus, passé
// 100 (lot « petits correctifs de sécurité », 11/11/2026, constat F03).
//
// L'époque ne sert qu'à départager deux copies : la plus haute gagne EN BLOC
// (« fusionner » de chaque moteur). Seul l'ORDRE compte, jamais l'écart. Or
// un client bricolé pouvait poser 1 000 000 d'un coup : le serveur gardait la
// valeur, et plus aucune restauration du professeur ne pouvait la dépasser
// (voir version_avec_epoque_relevee). Une époque reçue plus haute que
// « courante + 1 » est donc ramenée à « courante + 1 » : elle gagne toujours
// contre l'état du serveur (l'ordre est le même), mais elle ne peut plus
// monter que d'un cran par écriture.
//
// Sous EPOQUE_LIBRE_MAX (100), une époque passe telle quelle : c'est ce que
// portent les vrais appareils (quelques remises à zéro), et l'appli relit
// alors exactement ce qu'elle a envoyé. Au-delà, un cran par écriture : pour
// atteindre le plafond, il faudrait près d'un million d'écritures acceptées
// (à 300 par tranche de cinq minutes et par code, une douzaine de jours sans
// s'arrêter) — et chaque restauration repasse devant.
//
// Qui monte l'époque, côté appli ? Seule la remise à zéro (« Effacer mon
// historique »), réservée depuis le 06/11 au visiteur SANS code : elle
// n'arrive jamais au serveur. Une époque plus haute peut encore arriver en
// une fois quand le travail d'une case sans code (remise à zéro plusieurs
// fois) est rattaché à un code (« c'est toi ? ») : ramenée à « courante + 1 »,
// elle gagne pareil. Le reste du JSON n'est pas touché ; il n'est réécrit
// que si l'époque change.
const EPOQUE_LIBRE_MAX = 100;

function epoque_bornee(string $donneesJson, int $courante): string
{
    $plafond = min(max(max($courante, 0) + 1, EPOQUE_LIBRE_MAX), PROGRESSION_ENTIER_MAX);
    if (epoque_de($donneesJson) <= $plafond) return $donneesJson;
    $objet = json_decode($donneesJson, false);
    if (!is_object($objet)) return $donneesJson;
    $objet->epoque = $plafond;
    $encode = json_encode($objet, JSON_UNESCAPED_UNICODE);
    return is_string($encode) ? $encode : $donneesJson;
}

// Combien d'éléments sous la clé que l'appli DÉCLARE comme comptable
// (lib/applis.php, « compteur »). Pour Défi tables, c'est « calculs » : le
// nombre de calculs de la grille sur lesquels l'élève a travaillé — le chiffre
// que le professeur voit déjà dans la fiche.
//
// C'est tout ce que le serveur sait lire d'une progression, et c'est voulu :
// il ne juge rien, il compte des entrées pour pouvoir NOMMER une version dans
// « Revenir à… ». Une appli sans « compteur » rend 0.
function compter_elements_declares(string $appli, string $donneesJson): int
{
    $cle = CATALOGUE_APPLIS[$appli]['compteur'] ?? null;
    if (!is_string($cle) || $cle === '') return 0;
    $objet = json_decode($donneesJson, false);
    if (!is_object($objet)) return 0;
    $partie = $objet->{$cle} ?? null;
    if (is_object($partie)) return count(get_object_vars($partie));
    if (is_array($partie)) return count($partie);
    return 0;
}
