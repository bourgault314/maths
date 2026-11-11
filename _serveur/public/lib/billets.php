<?php
// Billets d'entrée : le code de l'élève ne voyage plus dans une adresse.
//
// Lot 3 (03/09/2026, constat C-1 de l'audit) : le lien « Défi tables » de
// l'espace élève portait le code (#code=XXXXXX). Une adresse s'inscrit dans
// l'historique du navigateur — sur un poste partagé, trente codes finissaient
// dans l'historique de Chrome, et l'historique ne s'efface pas à distance.
//
// Désormais le lien porte un BILLET : 32 caractères tirés au hasard, délivrés
// par le serveur, valables deux minutes, à usage unique. L'appli l'échange
// contre le code (api/eleve.php {billet}), range le code dans son onglet comme
// avant, et nettoie l'adresse. L'historique ne garde qu'un billet mort.
//
// Deux sortes : « entree » (l'espace élève → l'appli, rend le code) et
// « fiche » (« Voir sa fiche » dans Ma classe → la fiche en lecture seule, ne
// rend JAMAIS le code : un billet de fiche ne permet pas d'écrire).
//
// La table ne garde que l'EMPREINTE du billet (SHA-256) : une copie de la base
// ne contient aucun billet utilisable. Les billets périmés sont effacés à
// chaque appel, comme les compteurs.

declare(strict_types=1);

const DUREE_BILLET = 120; // secondes
// Lot « correctifs de l'audit Codex » (29/10/2026, défaut 1 du 22/10) : le
// TICKET DE COURSE des records (api/records.php). Même table, même forme
// (une empreinte, un élève, une échéance), mais un autre usage : il ne fait
// entrer personne — il DATE le départ d'une course. Son échéance est longue
// (huit jours : une course finie hors ligne peut attendre son envoi, comme
// le jour de course de D8), et c'est d'elle que le serveur déduit l'instant
// du départ (expire_le - DUREE_TICKET_COURSE). Au plus TICKETS_COURSE_PAR_ELEVE
// par élève : une course en attente garde le sien, un robot ne remplit pas
// la table.
const DUREE_TICKET_COURSE = 8 * 86400;
const TICKETS_COURSE_PAR_ELEVE = 4;
const TYPES_BILLET = ['entree', 'fiche', 'course'];
// Les billets qu'api/eleve.php échange : jamais un ticket de course (il ne
// prouve rien sur l'identité, et il se consomme ailleurs).
const TYPES_BILLET_ENTREE = ['entree', 'fiche'];

function billet_valide(string $billet): bool
{
    return (bool)preg_match('/^[0-9a-f]{32}$/', $billet);
}

function empreinte_billet(string $billet): string
{
    return hash('sha256', $billet);
}

function purger_billets(PDO $pdo): void
{
    $pdo->prepare('DELETE FROM billets WHERE expire_le < ?')->execute([time()]);
}

// Tire un billet pour cet élève et le range (haché). Renvoie le billet en
// clair : il part une seule fois, dans la réponse à qui a montré le code (ou
// une session prof), puis dans une adresse qui ne vaut plus rien deux minutes
// plus tard.
function emettre_billet(PDO $pdo, int $eleveId, string $type): string
{
    if (!in_array($type, TYPES_BILLET, true)) {
        throw new InvalidArgumentException("Type de billet inconnu.");
    }
    purger_billets($pdo);
    $billet = bin2hex(random_bytes(16));
    $duree = $type === 'course' ? DUREE_TICKET_COURSE : DUREE_BILLET;
    $pdo->prepare('INSERT INTO billets (hash, eleve_id, type, expire_le) VALUES (?, ?, ?, ?)')
        ->execute([empreinte_billet($billet), $eleveId, $type, time() + $duree]);
    if ($type === 'course') borner_tickets_de_course($pdo, $eleveId, empreinte_billet($billet));
    return $billet;
}

// Ne garde que les TICKETS_COURSE_PAR_ELEVE tickets de course les plus
// récents de l'élève (les plus anciens partent). Deux requêtes plutôt qu'une
// sous-requête à LIMIT : MySQL n'accepte pas « IN (SELECT … LIMIT) ».
// $garde (relecture Codex du 29/10/2026, R4) : le ticket qui vient d'être
// émis n'entre pas dans le tri — plusieurs départs dans la même seconde ont
// la même échéance, et le tri départageait par l'empreinte, au hasard : le
// serveur pouvait rendre un ticket qu'il venait d'effacer.
function borner_tickets_de_course(PDO $pdo, int $eleveId, string $garde): void
{
    $requete = $pdo->prepare("SELECT hash FROM billets WHERE eleve_id = ? AND type = 'course' AND hash <> ? ORDER BY expire_le DESC, hash");
    $requete->execute([$eleveId, $garde]);
    $hashes = array_map(fn(array $ligne): string => (string)$ligne['hash'], $requete->fetchAll());
    $requete->closeCursor();
    $enTrop = array_slice($hashes, TICKETS_COURSE_PAR_ELEVE - 1);
    foreach ($enTrop as $hash) {
        $pdo->prepare('DELETE FROM billets WHERE hash = ?')->execute([$hash]);
    }
}

// Le ticket de course d'un élève, LU sans le consommer (le départ en epoch),
// ou null s'il n'existe pas, n'est pas à lui, ou est périmé. Sert à juger
// la course AVANT de consommer (un « pas encore Légende », 409, garde le
// ticket pour l'envoi suivant).
function lire_ticket_de_course(PDO $pdo, int $eleveId, string $ticket): ?array
{
    if (!billet_valide($ticket)) return null;
    $requete = $pdo->prepare("SELECT expire_le FROM billets WHERE hash = ? AND eleve_id = ? AND type = 'course'");
    $requete->execute([empreinte_billet($ticket), $eleveId]);
    $ligne = $requete->fetch();
    $requete->closeCursor();
    if ($ligne === false || (int)$ligne['expire_le'] < time()) return null;
    return ['depart' => (int)$ligne['expire_le'] - DUREE_TICKET_COURSE];
}

// Consomme le ticket de course : vrai si c'est CET appel qui l'a effacé
// (deux envois de la même course en même temps : un seul passe).
function consommer_ticket_de_course(PDO $pdo, int $eleveId, string $ticket): bool
{
    if (!billet_valide($ticket)) return false;
    $suppression = $pdo->prepare("DELETE FROM billets WHERE hash = ? AND eleve_id = ? AND type = 'course'");
    $suppression->execute([empreinte_billet($ticket), $eleveId]);
    return $suppression->rowCount() === 1;
}

// Échange un billet : renvoie ['eleve_id', 'type'] et l'EFFACE, ou null s'il
// est inconnu, périmé ou déjà utilisé. L'usage unique tient à la suppression :
// deux échanges simultanés du même billet lisent la même ligne, mais un seul
// DELETE la trouve encore (rowCount = 1) ; l'autre repart avec null.
function echanger_billet(PDO $pdo, string $billet): ?array
{
    if (!billet_valide($billet)) return null;
    purger_billets($pdo);
    $hash = empreinte_billet($billet);
    $requete = $pdo->prepare('SELECT eleve_id, type, expire_le FROM billets WHERE hash = ?');
    $requete->execute([$hash]);
    $ligne = $requete->fetch();
    $requete->closeCursor();
    if ($ligne === false) return null;
    // Un ticket de course n'est pas un billet d'entrée : il n'ouvre rien
    // ici, et il n'est pas consommé (sa course le fera).
    if (!in_array((string)$ligne['type'], TYPES_BILLET_ENTREE, true)) return null;
    $suppression = $pdo->prepare('DELETE FROM billets WHERE hash = ?');
    $suppression->execute([$hash]);
    if ($suppression->rowCount() !== 1) return null;
    if ((int)$ligne['expire_le'] < time()) return null;
    return ['eleve_id' => (int)$ligne['eleve_id'], 'type' => (string)$ligne['type']];
}

// Un code régénéré ou un élève supprimé emporte ses billets en cours : un
// billet d'entrée émis avant la régénération rendrait sinon le NOUVEAU code.
function oublier_billets_de_l_eleve(PDO $pdo, int $eleveId): void
{
    $pdo->prepare('DELETE FROM billets WHERE eleve_id = ?')->execute([$eleveId]);
}

// Les billets de FICHE en cours d'une classe (lot « petits correctifs de
// sécurité », 11/11/2026, constat F06 de l'audit GPT du 09/11). Un collègue
// en lecture prend un billet de fiche, le propriétaire retire le partage : le
// tableau lui est aussitôt refusé, mais le billet déjà émis ouvrait encore la
// fiche, une fois, pendant ses deux minutes. Le billet ne garde pas qui l'a
// demandé (il faudrait changer le schéma) : au retrait d'un partage, on
// efface donc TOUS les billets de fiche de la classe, ceux du propriétaire
// compris. Un professeur qui avait justement cliqué « Voir sa fiche » à ce
// moment-là n'a qu'à recliquer. Les billets d'entrée des élèves et les
// tickets de course ne sont pas touchés.
function oublier_billets_de_fiche_de_la_classe(PDO $pdo, int $classeId): void
{
    $pdo->prepare("DELETE FROM billets WHERE type = 'fiche' AND eleve_id IN (SELECT id FROM eleves WHERE classe_id = ?)")
        ->execute([$classeId]);
}

// La même chose pour toutes les classes qu'un professeur peut lire — les
// SIENNES et celles qu'il reçoit en partage : quand son compte est désactivé
// ou supprimé, ses billets de fiche en cours tombent avec ses sessions.
// (Relecture Codex du 11/11/2026, D2 : la première version oubliait ses
// propres classes — un billet pris juste avant la désactivation ouvrait
// encore la fiche.)
function oublier_billets_de_fiche_du_prof(PDO $pdo, int $profId): void
{
    $pdo->prepare("DELETE FROM billets WHERE type = 'fiche' AND eleve_id IN (SELECT e.id FROM eleves e JOIN classes c ON c.id = e.classe_id WHERE c.prof_id = ? OR c.id IN (SELECT classe_id FROM partages WHERE prof_id = ?))")
        ->execute([$profId, $profId]);
}

// Un billet de fiche tout juste émis, retiré (D3, ci-dessous).
function oublier_billet(PDO $pdo, string $billet): void
{
    $pdo->prepare('DELETE FROM billets WHERE hash = ?')->execute([empreinte_billet($billet)]);
}

// Ce professeur peut-il ENCORE lire cet élève ? Compte actif, et classe à lui
// ou partagée avec lui. Relecture Codex du 11/11/2026 (D3) : « Voir sa fiche »
// contrôle le droit, PUIS émet le billet ; un retrait de partage (ou une
// désactivation) glissé entre les deux laissait un billet neuf derrière la
// purge. api/prof.php refait donc ce contrôle APRÈS avoir rangé le billet, et
// le retire s'il n'est plus permis. Aucun ordre ne laisse passer un billet :
// s'il est rangé avant la purge, la purge l'emporte ; s'il est rangé après,
// la purge suit le retrait du droit, et ce second contrôle le voit.
function fiche_encore_permise(PDO $pdo, int $profId, int $eleveId): bool
{
    $requete = $pdo->prepare('SELECT 1 FROM eleves e JOIN classes c ON c.id = e.classe_id JOIN profs p ON p.id = ? AND p.actif = 1
        WHERE e.id = ? AND (c.prof_id = p.id OR EXISTS (SELECT 1 FROM partages s WHERE s.classe_id = c.id AND s.prof_id = p.id))');
    $requete->execute([$profId, $eleveId]);
    $permis = $requete->fetchColumn() !== false;
    $requete->closeCursor();
    return $permis;
}
