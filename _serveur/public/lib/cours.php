<?php
// L'appli « Cours » de l'espace élève (lot « cours-appli », 08/11/2026,
// chantier « Livret de cours » de Gwenaël).
//
// Ce que Gwenaël a demandé : une tuile « Mes cours » → la liste des
// chapitres → le sommaire d'un chapitre (les « Je sais… ») → la fiche ; et
// dans « Ma classe », choisir quels cours ses élèves voient, par niveau, par
// chapitre, par fiche. AUCUNE donnée d'élève n'est enregistrée : ni ce qu'il
// ouvre, ni ses réponses aux questions éclair. Le serveur ne garde que le
// RÉGLAGE DE LA CLASSE, dans classes.reglages :
//
//     {"cours": {"chapitres": ["3e-PYT"], "sans": ["4e-TRI-05"], "avec": ["3e-PYT-04"]}}
//
//  - chapitres : les chapitres ouverts (rien d'ouvert au départ : le
//    professeur ouvre un chapitre quand il le commence) ;
//  - sans      : dans un chapitre ouvert, les fiches qu'il a fermées (et
//    l'Entraînement brevet, qui a son identifiant) ;
//  - avec      : les fiches du NOUVEAU PROGRAMME qu'il a ouvertes — elles
//    sont fermées par défaut, même dans un chapitre ouvert.
// Une fiche commune à deux chapitres (4e-TRI-03 sert en 4e et en 3e) a un
// seul identifiant : la fermer la ferme dans les deux.
//
// Le catalogue (lib/cours.json) est FABRIQUÉ par le moteur du livret
// (« python build.py site <dépôt> », dossier Livret de cours\_moteur de
// Gwenaël), en même temps que les pages du dossier cours/ de mathsgo.re : ne
// pas le modifier à la main. Les fiches vivent sur mathsgo.re (publiées à la
// fusion, sans FTP), dans un dossier qu'aucune page ne cite (ni catalogue du
// site, ni plan du site, « noindex ») ; elles ne savent rien de l'élève.
// « Et un pirate ? » : un élève qui tape lui-même l'adresse d'une fiche que
// son professeur a fermée peut la lire — accepté par Gwenaël le 08/11/2026
// (un cours sous licence libre, aucune donnée d'élève derrière). Ce qui est
// gardé ici : on ne range que des identifiants qui existent au catalogue, et
// les adresses données à l'élève sont fabriquées ici, jamais reçues.

declare(strict_types=1);

const COURS_SITE = 'https://mathsgo.re';
const COURS_MOTIF_CHAPITRE = '/^[0-9]e-[A-Z]{2,8}$/';
const COURS_MOTIF_FICHE = '/^[0-9]e-[A-Z]{2,8}-(?:[0-9]{2}|brevet)$/';
const COURS_MOTIF_PAGE = '#^/cours/[0-9]e/[0-9]e-[A-Z]{2,8}-(?:[0-9]{2}|brevet|imprimable)\.html$#';

// Le catalogue, relu et vérifié une fois par appel : ce qui n'a pas la bonne
// forme est écarté (une page mal nommée n'atteint jamais un élève).
function cours_catalogue(): array
{
    static $catalogue = null;
    if ($catalogue !== null) return $catalogue;
    $catalogue = [];
    $brut = is_file(__DIR__ . '/cours.json') ? file_get_contents(__DIR__ . '/cours.json') : false;
    $json = $brut === false ? null : json_decode($brut, true);
    if (!is_array($json) || !is_array($json['chapitres'] ?? null)) return $catalogue;
    $vus = [];
    foreach ($json['chapitres'] as $c) {
        if (!is_array($c) || !is_string($c['id'] ?? null) || preg_match(COURS_MOTIF_CHAPITRE, $c['id']) !== 1) continue;
        if (isset($vus[$c['id']]) || !is_array($c['fiches'] ?? null)) continue;
        $vus[$c['id']] = true;
        $fiches = [];
        foreach ($c['fiches'] as $f) {
            if (!is_array($f) || !is_string($f['id'] ?? null) || preg_match(COURS_MOTIF_FICHE, $f['id']) !== 1) continue;
            if (!is_string($f['page'] ?? null) || preg_match(COURS_MOTIF_PAGE, $f['page']) !== 1) continue;
            $fiches[] = [
                'id' => $f['id'],
                'n' => is_int($f['n'] ?? null) ? $f['n'] : count($fiches) + 1,
                'ids' => is_string($f['ids'] ?? null) ? $f['ids'] : $f['id'],
                'h1' => is_string($f['h1'] ?? null) ? $f['h1'] : '',
                'niveaux' => array_values(array_filter((array)($f['niveaux'] ?? []), fn ($n) => is_string($n) && preg_match('/^[0-9]e$/', $n) === 1)),
                'type' => is_string($f['type'] ?? null) ? $f['type'] : '',
                'nouveau' => ($f['nouveau'] ?? false) === true,
                'page' => $f['page'],
            ];
        }
        $brevet = null;
        if (is_array($c['brevet'] ?? null) && is_string($c['brevet']['id'] ?? null) && preg_match(COURS_MOTIF_FICHE, $c['brevet']['id']) === 1
            && is_string($c['brevet']['page'] ?? null) && preg_match(COURS_MOTIF_PAGE, $c['brevet']['page']) === 1) {
            $brevet = ['id' => $c['brevet']['id'], 'page' => $c['brevet']['page']];
        }
        $imprimable = is_string($c['imprimable'] ?? null) && preg_match(COURS_MOTIF_PAGE, $c['imprimable']) === 1 ? $c['imprimable'] : null;
        $catalogue[] = [
            'id' => $c['id'],
            'niveau' => is_string($c['niveau'] ?? null) ? $c['niveau'] : '',
            'chapitre' => is_string($c['chapitre'] ?? null) ? $c['chapitre'] : '',
            'titre' => is_string($c['titre'] ?? null) ? $c['titre'] : '',
            'fiches' => $fiches,
            'brevet' => $brevet,
            'imprimable' => $imprimable,
        ];
    }
    return $catalogue;
}

// Les identifiants connus, dans l'ordre du catalogue (l'ordre de la
// progression) : celui dans lequel on les range.
function cours_identifiants(string $nom): array
{
    $ids = [];
    foreach (cours_catalogue() as $c) {
        if ($nom === 'chapitres') { $ids[$c['id']] = true; continue; }
        foreach ($c['fiches'] as $f) $ids[$f['id']] = true;
        if ($c['brevet'] !== null) $ids[$c['brevet']['id']] = true;
    }
    return array_keys($ids);
}

// Une liste rangée : les identifiants connus, sans doublon, dans l'ordre du
// catalogue. Lecture indulgente (ce qui sort de la base) : un identifiant
// inconnu (une fiche retirée du livret) est oublié. null = liste vide.
function cours_liste_lue(string $nom, mixed $liste): ?array
{
    if (!is_array($liste)) return null;
    $voulus = array_flip(array_filter($liste, 'is_string'));
    $sortie = array_values(array_filter(cours_identifiants($nom), fn ($id) => isset($voulus[$id])));
    return $sortie === [] ? null : $sortie;
}

// Ce que le professeur envoie : lecture STRICTE (une liste de textes, chacun
// connu du catalogue), rangée comme cours_liste_lue.
function cours_liste_recue(string $nom, mixed $liste): array
{
    if (!is_array($liste) || !array_is_list($liste)) throw new InvalidArgumentException("Liste de cours illisible.");
    $connus = array_flip(cours_identifiants($nom));
    foreach ($liste as $id) {
        if (!is_string($id) || !isset($connus[$id])) {
            throw new InvalidArgumentException($nom === 'chapitres' ? "Chapitre inconnu." : "Fiche inconnue.");
        }
    }
    return cours_liste_lue($nom, $liste) ?? [];
}

// Ce que voit l'élève : les chapitres ouverts, dans l'ordre de la
// progression, avec leurs fiches ouvertes — et les adresses toutes faites
// (le chapitre d'où il vient est dans l'adresse, #ch=, pour que « ◀ Mes
// cours » l'y ramène). La version imprimable n'est donnée que si TOUTES les
// fiches du chapitre sont ouvertes : elle les contient toutes.
function cours_de_l_eleve(array $reglage): array
{
    $chapitres = array_flip(cours_liste_lue('chapitres', $reglage['chapitres'] ?? null) ?? []);
    $sans = array_flip(cours_liste_lue('fiches', $reglage['sans'] ?? null) ?? []);
    $avec = array_flip(cours_liste_lue('fiches', $reglage['avec'] ?? null) ?? []);
    $sortie = [];
    foreach (cours_catalogue() as $c) {
        if (!isset($chapitres[$c['id']])) continue;
        $ancre = '#ch=' . $c['id'];
        $fiches = [];
        foreach ($c['fiches'] as $f) {
            $ouverte = $f['nouveau'] ? isset($avec[$f['id']]) : !isset($sans[$f['id']]);
            if (!$ouverte) continue;
            // Pas de « niveaux » pour l'élève : l'espace élève ne les affiche plus (09/11/2026).
            $fiches[] = ['n' => $f['n'], 'h1' => $f['h1'], 'type' => $f['type'],
                'url' => COURS_SITE . $f['page'] . $ancre];
        }
        $brevet = $c['brevet'] !== null && !isset($sans[$c['brevet']['id']]) ? COURS_SITE . $c['brevet']['page'] . $ancre : null;
        if ($fiches === [] && $brevet === null) continue;
        $sortie[] = [
            'id' => $c['id'],
            'niveau' => $c['niveau'],
            'chapitre' => $c['chapitre'],
            'titre' => $c['titre'],
            'fiches' => $fiches,
            'brevet' => $brevet,
            'imprimable' => $c['imprimable'] !== null && count($fiches) === count($c['fiches']) ? COURS_SITE . $c['imprimable'] . $ancre : null,
        ];
    }
    return $sortie;
}

// Le catalogue pour la page « Ma classe » : tout, avec les adresses des
// fiches (« Voir ↗ » les ouvre dans un nouvel onglet).
function cours_pour_le_prof(): array
{
    return array_map(function (array $c): array {
        $c['fiches'] = array_map(fn ($f) => $f + ['url' => COURS_SITE . $f['page'] . '#ch=' . $c['id']], $c['fiches']);
        if ($c['brevet'] !== null) $c['brevet']['url'] = COURS_SITE . $c['brevet']['page'] . '#ch=' . $c['id'];
        $c['imprimable'] = $c['imprimable'] === null ? null : COURS_SITE . $c['imprimable'] . '#ch=' . $c['id'];
        return $c;
    }, cours_catalogue());
}
