<?php
// L'appli « Cours » de l'espace élève (lot « cours-appli », 08/11/2026,
// chantier « Livret de cours » de Gwenaël).
//
// Ce que Gwenaël a demandé : une tuile « Mes cours » → la liste des
// chapitres → le sommaire d'un chapitre (les « Je sais… ») → la fiche ; et
// dans « Ma classe », choisir quels cours ses élèves voient, par niveau, par
// chapitre, par fiche. Le serveur garde le RÉGLAGE DE LA CLASSE, dans
// classes.reglages :
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
// Lot « cours-appli-3 » (14/11/2026, choix de Gwenaël) : des chapitres EN
// PLUS pour quelques élèves, rangés dans eleves.ajouts
// ({"cours": {"chapitres": ["4e-PUI"]}}, lib/applis.php). Ce que voit un
// élève = les chapitres de sa classe + les siens ; les fiches fermées
// (« sans ») et les fiches du nouveau programme ouvertes (« avec ») de la
// classe valent aussi pour ses chapitres en plus. On n'enlève rien à un
// élève : on ajoute. La règle est calculée à un seul endroit
// (acces_de_l_eleve) ; ici, rien ne change : cours_ouverts_a_l_eleve() reçoit
// le réglage déjà calculé pour CET élève.
//
// Lot « cours-ouvertures » (10/11/2026, décidé par Gwenaël) : pour chaque
// élève et chaque fiche, le JOUR de la dernière ouverture, et rien d'autre —
// ni le nombre de fois, ni la durée, ni l'heure, et jamais « lue » (ouvrir
// n'est pas lire). Table « cours_ouvertures » : une ligne par élève et par
// fiche (l'Entraînement brevet compte comme une fiche), le jour remplacé à
// chaque ouverture. L'ouverture est notée par l'espace élève, au moment où
// l'élève touche la fiche dans « Mes cours » (api/cours.php) : les pages des
// fiches, sur mathsgo.re, ne savent toujours rien de l'élève, et un visiteur
// sans code ne laisse rien. Ce qui ne passe pas par « Mes cours » (adresse
// tapée, marque-page, lien d'une fiche à l'autre) n'est pas noté. Effacée
// avec l'élève et avec la classe (fin d'année comprise), comme le reste.
// Ses réponses aux questions éclair ne sont toujours pas enregistrées.
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
// les adresses données à l'élève sont fabriquées ici, jamais reçues. Une
// ouverture n'est notée que pour une fiche que CET élève voit (retrouvée par
// son adresse dans ce que le serveur lui donne) ; le jour est celui du
// serveur, jamais celui de l'appareil.

declare(strict_types=1);

const COURS_SITE = 'https://mathsgo.re';
const COURS_MOTIF_CHAPITRE = '/^[0-9]e-[A-Z]{2,8}$/';
const COURS_MOTIF_FICHE = '/^[0-9]e-[A-Z]{2,8}-(?:[0-9]{2}|brevet)$/';
const COURS_MOTIF_PAGE = '#^/cours/[0-9]e/[0-9]e-[A-Z]{2,8}-(?:[0-9]{2}|brevet|imprimable)\.html$#';

// Lot « cours-appli-2 » (13/11/2026, choix de Gwenaël : « Mes cours », version 1
// des planches) : le DOMAINE de chaque chapitre, pour la bande de couleur et le
// petit nom écrit au-dessus du chapitre dans « Mes cours ». Les domaines sont
// ceux du catalogue du site (outils/index.html, mêmes couleurs), sous leurs
// noms courts (choix du 13/11) ; la couleur et le nom vivent dans l'espace
// élève (index.php, DOMAINES_COURS), ici seulement la clé. Rangé par le code
// du chapitre (« 3e-PYT » → « PYT ») : le même chapitre est dans le même
// domaine en 4e et en 3e. Un code absent (« Préparer la seconde », un
// chapitre nouveau) : pas de domaine, la tuile garde sa bande d'avant.
// Les codes des lots à venir (carte 4e-3e) sont déjà rangés ; Grandeurs (GRA,
// lot 7) attend son nom : à décider avec Gwenaël quand le chapitre existera.
const COURS_DOMAINES = [
    'CAL' => 'nombres', 'REL' => 'nombres', 'RAC' => 'nombres', 'FRA' => 'nombres', 'ARI' => 'nombres', 'PUI' => 'nombres',
    'LIT' => 'algebre', 'EQU' => 'algebre',
    'PCT' => 'proportionnalite', 'FON' => 'proportionnalite', 'PRP' => 'proportionnalite',
    'INE' => 'geometrie', 'TRI' => 'geometrie', 'PYT' => 'geometrie', 'THA' => 'geometrie', 'COS' => 'geometrie',
    'TRG' => 'geometrie', 'ANG' => 'geometrie', 'REP' => 'geometrie', 'GEO' => 'geometrie', 'TRS' => 'geometrie',
    'TRA' => 'geometrie', 'ESP' => 'geometrie',
    'STA' => 'donnees', 'PRO' => 'donnees',
    'ALG' => 'informatique',
];

// « 3e-PYT » → « geometrie » ; null si le chapitre n'a pas de domaine.
function cours_domaine(string $chapitre): ?string
{
    $code = substr($chapitre, 3);
    return COURS_DOMAINES[$code] ?? null;
}

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
// Lot « cours-ouvertures » : la règle « qui voit quoi » vit dans
// cours_ouverts_a_l_eleve(), qui garde aussi l'identifiant et la page de
// chaque fiche ; cours_de_l_eleve() n'en donne que ce que la page affiche, et
// cours_page_vers_fiche() s'en sert pour reconnaître une fiche ouverte.
function cours_ouverts_a_l_eleve(array $reglage): array
{
    $chapitres = array_flip(cours_liste_lue('chapitres', $reglage['chapitres'] ?? null) ?? []);
    $sans = array_flip(cours_liste_lue('fiches', $reglage['sans'] ?? null) ?? []);
    $avec = array_flip(cours_liste_lue('fiches', $reglage['avec'] ?? null) ?? []);
    $sortie = [];
    foreach (cours_catalogue() as $c) {
        if (!isset($chapitres[$c['id']])) continue;
        $fiches = [];
        foreach ($c['fiches'] as $f) {
            $ouverte = $f['nouveau'] ? isset($avec[$f['id']]) : !isset($sans[$f['id']]);
            if ($ouverte) $fiches[] = $f;
        }
        $brevet = $c['brevet'] !== null && !isset($sans[$c['brevet']['id']]) ? $c['brevet'] : null;
        if ($fiches === [] && $brevet === null) continue;
        $sortie[] = ['chapitre' => $c, 'fiches' => $fiches, 'brevet' => $brevet,
            'imprimable' => $c['imprimable'] !== null && count($fiches) === count($c['fiches']) ? $c['imprimable'] : null];
    }
    return $sortie;
}

function cours_de_l_eleve(array $reglage): array
{
    $sortie = [];
    foreach (cours_ouverts_a_l_eleve($reglage) as $o) {
        $c = $o['chapitre'];
        $ancre = '#ch=' . $c['id'];
        // Pas de « niveaux » pour l'élève : l'espace élève ne les affiche plus (09/11/2026).
        $fiches = array_map(fn ($f) => ['n' => $f['n'], 'h1' => $f['h1'], 'type' => $f['type'],
            'url' => COURS_SITE . $f['page'] . $ancre], $o['fiches']);
        $sortie[] = [
            'id' => $c['id'],
            'niveau' => $c['niveau'],
            'chapitre' => $c['chapitre'],
            'titre' => $c['titre'],
            // Lot « cours-appli-2 » : la clé du domaine (ou null), jamais un nom ni une couleur.
            'domaine' => cours_domaine($c['id']),
            'fiches' => $fiches,
            'brevet' => $o['brevet'] !== null ? COURS_SITE . $o['brevet']['page'] . $ancre : null,
            'imprimable' => $o['imprimable'] !== null ? COURS_SITE . $o['imprimable'] . $ancre : null,
        ];
    }
    return $sortie;
}

// Lot « cours-ouvertures » : l'identifiant de la fiche (ou de
// l'Entraînement brevet) dont la page est $page — « /cours/3e/3e-PYT-02.html »,
// sans domaine ni ancre — parmi celles que CET élève voit ; null sinon (fiche
// fermée, page inconnue, version imprimable : elle n'est pas une fiche).
function cours_page_vers_fiche(array $reglage, string $page): ?string
{
    if (preg_match(COURS_MOTIF_PAGE, $page) !== 1) return null;
    foreach (cours_ouverts_a_l_eleve($reglage) as $o) {
        foreach ($o['fiches'] as $f) {
            if ($f['page'] === $page) return $f['id'];
        }
        if ($o['brevet'] !== null && $o['brevet']['page'] === $page) return $o['brevet']['id'];
    }
    return null;
}

// ------------------------------------------- les ouvertures (lot « cours-ouvertures »)

// La table n'existe qu'après migrer.php : avant, rien n'est noté, rien n'est
// lu, et rien ne tombe en panne.
function cours_ouvertures_disponibles(PDO $pdo): bool
{
    static $vu = [];
    $cle = spl_object_id($pdo);
    if (!array_key_exists($cle, $vu)) $vu[$cle] = table_existe($pdo, 'cours_ouvertures');
    return $vu[$cle];
}

// Le jour de la dernière ouverture remplace le précédent : une ligne par
// élève et par fiche, jamais plus.
//
// Correctif après la relecture Codex du 11/11/2026 (défaut 2) : l'élève lu
// par api/cours.php pouvait être supprimé (seul, ou avec sa classe) entre
// cette lecture et l'écriture, qui recréait alors une ligne pour un élève
// qui n'existe plus. L'écriture se fait donc dans une transaction qui
// reprend l'élève sous verrou (SELECT … FOR UPDATE sur MySQL, BEGIN
// IMMEDIATE sur SQLite) et n'écrit rien s'il n'est plus là. De l'autre côté,
// les suppressions effacent cours_ouvertures APRÈS la ligne de l'élève
// (api/prof.php, lib/archives.php) : si l'ouverture passe la première, la
// suppression attend sa fin puis emporte la ligne ; sinon l'ouverture
// attend, ne trouve plus l'élève et n'écrit rien. Rend vrai si la ligne est
// écrite.
function noter_ouverture_cours(PDO $pdo, int $eleveId, string $fiche, string $jour): bool
{
    return avec_reprise($pdo, function () use ($pdo, $eleveId, $fiche, $jour): bool {
        transaction_ouvrir($pdo);
        try {
            $requete = $pdo->prepare('SELECT id FROM eleves WHERE id = ?' . pour_mise_a_jour($pdo));
            $requete->execute([$eleveId]);
            $existe = $requete->fetchColumn() !== false;
            $requete->closeCursor();
            if ($existe) ecrire_ouverture_cours($pdo, $eleveId, $fiche, $jour);
            transaction_valider($pdo);
            return $existe;
        } catch (Throwable $e) {
            transaction_annuler($pdo);
            throw $e;
        }
    });
}

function ecrire_ouverture_cours(PDO $pdo, int $eleveId, string $fiche, string $jour): void
{
    if (pilote($pdo) === 'mysql') {
        $sql = 'INSERT INTO cours_ouvertures (eleve_id, fiche, jour) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE jour = ?';
    } else {
        $sql = 'INSERT INTO cours_ouvertures (eleve_id, fiche, jour) VALUES (?, ?, ?)
                ON CONFLICT(eleve_id, fiche) DO UPDATE SET jour = ?';
    }
    // Le jour est passé une seconde fois pour le remplacement (même raison
    // que lib/direct.php : ni « VALUES() » ni « excluded » sur les deux moteurs).
    $pdo->prepare($sql)->execute([$eleveId, $fiche, $jour, $jour]);
}

// Pour l'onglet Cours de « Ma classe » : [eleve_id => [fiche => jour]].
function ouvertures_cours_des_eleves(PDO $pdo, array $eleveIds): array
{
    $ids = array_values(array_unique(array_map('intval', $eleveIds)));
    if ($ids === [] || !cours_ouvertures_disponibles($pdo)) return [];
    $connues = array_flip(cours_identifiants('fiches'));
    $sortie = [];
    foreach (array_chunk($ids, 500) as $paquet) {
        $marques = implode(',', array_fill(0, count($paquet), '?'));
        $requete = $pdo->prepare("SELECT eleve_id, fiche, jour FROM cours_ouvertures WHERE eleve_id IN ($marques)");
        $requete->execute($paquet);
        foreach ($requete->fetchAll() as $ligne) {
            // Une fiche retirée du livret, ou un jour mal formé : oublié.
            if (!isset($connues[$ligne['fiche']]) || preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$ligne['jour']) !== 1) continue;
            $sortie[(int)$ligne['eleve_id']][$ligne['fiche']] = $ligne['jour'];
        }
        $requete->closeCursor();
    }
    return $sortie;
}

// Appelée APRÈS la suppression de la ligne de l'élève (voir
// noter_ouverture_cours : c'est l'ordre qui ferme la course).
function oublier_cours_de_l_eleve(PDO $pdo, int $eleveId): void
{
    if (!cours_ouvertures_disponibles($pdo)) return;
    $pdo->prepare('DELETE FROM cours_ouvertures WHERE eleve_id = ?')->execute([$eleveId]);
}

// Les lignes dont l'élève n'existe plus (menage.php, par principe : plus
// rien ne devrait en laisser). Rend le nombre effacé.
function purger_cours_orphelins(PDO $pdo): int
{
    if (!table_existe($pdo, 'cours_ouvertures')) return 0;
    $requete = $pdo->prepare('DELETE FROM cours_ouvertures WHERE eleve_id NOT IN (SELECT id FROM eleves)');
    $requete->execute();
    return $requete->rowCount();
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
