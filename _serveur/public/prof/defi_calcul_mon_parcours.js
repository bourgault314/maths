// Défi calcul — la progression de l'élève (version 13, lot K1b « les bases en
// trois classes », 26/11/2026 : six étages ; version 12 au lot K1 « la carte
// chez l'élève », 25/11/2026 ; le format d'avant datait du lot 2a, 05/10/2026).
//
// Ce fichier ne connaît AUCUN texte ni aucun générateur : seulement les
// codes des modules et leur nombre de niveaux ; la carte (les étages, les
// lignes, les liens « d'abord », l'ordre) lui est donnée par
// defi_calcul_core.js. Il tient le format enregistré, les ÉTOILES (une par
// compétence : un niveau d'un module) et leurs boîtes, la carte de l'élève,
// « Je tente », J'apprends, Mes calculs du jour, les ceintures, la séance,
// la fusion entre deux appareils et le rangement par code sur l'appareil.
//
// Les règles sont celles de « la carte et les clés » (conception du
// 21/11/2026, § 11 et § 12) :
//  - un ÉTAGE par palier, une ceinture par étage ; dans un étage, des
//    lignes, et dans une ligne des étoiles dans l'ordre. L'élève choisit sa
//    ligne ; l'étoile suivante d'une ligne s'ouvre quand celle d'avant a été
//    gagnée ;
//  - une étoile se GAGNE par « Je tente » (6 calculs, 5 justes) ou par
//    J'apprends (le finir la donne), au choix de l'élève ; elle entre alors
//    au début des boîtes et revient le lendemain, puis à 3, 7, 14, 30 et 60
//    jours ;
//  - elle ne BOUGE que dans Mes calculs du jour : juste, elle monte d'une
//    boîte ; les deux calculs faux, elle est PERDUE et se regagne. Nulle
//    part ailleurs une erreur ne compte ;
//  - toutes les étoiles d'un étage : la ceinture, et l'étage suivant. Rien
//    de ce qui est ouvert ne se referme, une ceinture gagnée ne se reprend
//    jamais ;
//  - plus rien n'est imposé après Mes calculs du jour : « Continuer »
//    propose, l'élève choisit.
//
// Copié de defi_tables_mon_parcours.js puis adapté, jamais partagé : Défi
// tables reste intact. Le rangement par code (empreinte SHA-256 salée, purge
// des 90 jours, état de synchronisation) est repris à l'identique, sous les
// clés « mathsgo-defi-calcul-… ».
//
// Tout ce qui est enregistré tient dans des clés courtes : le serveur compte
// les clés à toute profondeur (2 000 au plus) et borne la progression à
// 40 000 octets. Les listes ne comptent pas comme des clés. Aucun prénom sous
// un code, aucun texte libre, aucun calcul en clair.
(function initDefiCalculMonParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_CALCUL_MON_PARCOURS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // Version 3 (lot « couverture », 06/11/2026) : A2 gagne un niveau (A2-5),
  // A8 et F5 perdent leur niveau 3, réuni au niveau 2 (reprise des boîtes
  // dans normaliserParcours) ; A9 et M9 (pas construits) passent à 2 niveaux.
  // Version 4 (lot F1 « rythme », 07/11/2026) : les boîtes 6 et 7, le plan de
  // séance à 7 nombres. Rien à reprendre d'une version 3 (une boîte 6 n'y
  // existe pas, un plan à 5 nombres se relit 0, 0). Le numéro sert au
  // SERVEUR : il refuse l'écriture d'une page de version 3 (catalogue,
  // « version_min ») — une page d'avant F1 lirait une boîte 6 ou 7 comme
  // « pas entrée » et tronquerait le plan (relecture de Codex, 07/11/2026).
  // Version 5 (lot G1 « journal + accueil », 07/11/2026) : le journal des
  // séances (`journal`, six listes d'entiers alignées sur `seances`), ce que
  // la séance ouverte a déjà fait (`seance.j`), et deux dates par compétence
  // (`d` entrée, `s` devenue sue). Une progression de version 4 se relit sans
  // rien perdre : ses séances déjà finies ont un journal « inconnu » (-1),
  // ses compétences n'ont pas de date (null). Le serveur refuse l'écriture
  // d'une page de version 4 (« version_min » 5) : elle ne connaît pas ces
  // champs et les effacerait.
  // Version 6 (correctif du lot S1 « les journaux », relecture de Codex,
  // 07/11/2026) : chaque séance du journal a son numéro (`journal.numero`) ;
  // la fusion réunit les séances par leur numéro. Une entrée de version 5
  // reçoit le sien en se relisant ; le serveur refuse l'écriture d'une page
  // de version 5 (« version_min » 6), qui effacerait les numéros.
  // Version 7 (lot 1 « la séance », 12/11/2026) : la séance au temps (10 ou
  // 15 minutes, plus de « nouveautés par séance »), le 2e calcul après un
  // faux dans Mes calculs du jour, le « lent » deux fois de suite (`l`), le
  // test à 3 calculs par marche. Le plan de séance passe à 11 nombres. Une
  // progression de version 6 se relit : ses boîtes ne bougent pas, `l` vaut
  // 0, et une séance ouverte en version 6 continue avec 10 minutes (son plan
  // à 7 nombres se relit, ses nombres 4 à 6 remis à zéro : leur sens a
  // changé). Le serveur refuse l'écriture d'une page de version 6
  // (« version_min » 7) : elle effacerait `l` et tronquerait le plan.
  // Version 8 (lot 4 « les ceintures », 14/11/2026, choix de Gwenaël) : les
  // ceintures gagnées (`ceintures`, quatre dates ou null : jaune, orange,
  // verte, bleue — une par palier). Une ceinture gagnée ne se reprend
  // jamais. Une progression de version 7 se relit sans rien perdre (aucune
  // ceinture) ; la première étape qui finit la redonne si le palier est
  // déjà tout solide. Le serveur refuse l'écriture d'une page de version 7
  // (« version_min » 8) : elle ne connaît pas `ceintures` et l'effacerait.
  // Version 9 (lot 6 « programmes 2 », 19/11/2026, choix de Gwenaël) :
  // deux niveaux neufs, posés à leur place dans leur module — F9-1
  // (« Dénominateurs multiples : dans l'unité », CE2) et F6-2 (« Fractions
  // égales : jusqu'à 20 », CM1). Les anciens F9-1, F9-2 deviennent F9-2,
  // F9-3 ; les anciens F6-2, F6-3 deviennent F6-3, F6-4. Une progression
  // de version 8 se relit : dans les lignes de F6 et F9, chaque liste
  // reçoit une case vide à la place du niveau neuf (rien n'est perdu, rien
  // n'est gagné sans avoir été joué), et le module n'est plus coché « su »
  // (comme A2 au lot « couverture ») ; les rangs du plan de la séance
  // ouverte sont recalculés (les compétences après F6 ont glissé). Le
  // serveur refuse l'écriture d'une page de version 8 (« version_min » 9) :
  // elle lirait les lignes de F6 et F9 avec les anciens numéros.
  // Version 10 (lot F4 « personne ne reste bloqué », 18/11/2026, recalé le
  // 20/11 après le lot 6 « programmes 2 » ; choix de Gwenaël après l'audit
  // des six profils) : J'apprends ne se rate plus — il
  // s'arrête sur « On continue demain » et garde, pour une compétence pas
  // encore entrée, où l'élève en est et combien de fois il s'est arrêté
  // (`ar` : 3 × les arrêts + la reprise, 1 au dessin, 2 sans aide) ; au 3e
  // arrêt, l'échéance `e` de cette compétence (null jusque-là) dit le jour
  // où ce niveau « à voir en classe » revient ; le test de palier joué
  // (`paliers`, quatre dates ou null). (« r » a existé avant le lot 3, avec
  // un autre sens : il n'est pas repris.) Une progression de version 9 (ou
  // plus ancienne, reprise d'abord comme ci-dessus) se relit sans rien perdre
  // (rien d'arrêté, aucun test de palier joué). Le serveur refuse l'écriture
  // d'une page de version 9 (« version_min » 10) : elle effacerait `ar` et
  // `paliers`.
  // Version 11 (lot C2 « doubles et moitiés », 21/11/2026, choix de Gwenaël
  // après l'audit de cohérence) : doubles et moitiés en deux niveaux. M1 passe
  // de 3 à 6 niveaux (doubles jusqu'à 40, moitiés jusqu'à 40, doubles en
  // découpant, moitiés en découpant, doubles des nombres usuels, moitiés des
  // nombres usuels), D8 de 3 à 5 (moitié des impairs, doubles et moitiés
  // des dixièmes, doubles et moitiés des centièmes). Chaque ancien niveau
  // devient celui des doubles (sa leçon était sur le double : M1-1 → M1-1,
  // M1-2 → M1-5, M1-3 → M1-3 ; D8-2 → D8-2, D8-3 → D8-4) ; les niveaux des
  // moitiés sont neufs. Une progression de version 10 se relit comme au lot
  // 6 « programmes 2 » : dans les lignes de M1 et D8, chaque liste reçoit une
  // case vide à la place de chaque niveau neuf (rien n'est perdu, rien n'est
  // gagné sans avoir été joué), le module n'est plus coché « su », et les
  // rangs du plan de la séance ouverte sont recalculés. Le serveur refuse
  // l'écriture d'une page de version 10 (« version_min » 11) : elle lirait
  // les lignes de M1 et D8 avec les anciens numéros.
  // Version 12 (lot K1 « la carte chez l'élève », 25/11/2026, choix de
  // Gwenaël des 21, 22 et 25/11 : « la carte et les étoiles » remplace le
  // couloir automatique). Le format change en entier, et c'est la dernière
  // fois avant l'ouverture : AUCUN élève n'a encore joué, une progression
  // d'avant (versions 2 à 11) REPART DE ZÉRO au lieu d'être reprise (seule
  // son époque est gardée, pour qu'une restauration du professeur gagne
  // toujours en bloc) ; tout le code de reprise des anciennes versions a
  // disparu. Par étoile (un niveau d'un module), la ligne d'un module garde :
  //   b   sa boîte (0 : l'étoile n'est pas tenue ; 1 à 7 : gagnée) ;
  //   e   son échéance (gagnée : le jour où elle revient ; pas gagnée et
  //       « à voir en classe » après 3 J'apprends arrêtés : le jour où elle
  //       se rejoue ; sinon null) ;
  //   a   1 quand sa leçon est faite ou qu'elle est déjà revenue une fois
  //       (0 : gagnée sans leçon et jamais revenue — son premier retour
  //       montre un exemple résolu, lot C3) ;
  //   x   au retour : 2, le 2e calcul attend (le premier était faux : il
  //       sera reposé même si la page a été fermée entre les deux, G2) ;
  //       1, un retour raté qui n'a pas fait partir l'étoile (ne sert que
  //       si SEUILS.retour.ratesDeSuite vaut 2) ;
  //   r   les « Je tente » ratés sur cette étoile (2 : « Je tente » fermé
  //       pour de bon, jusqu'à ce qu'elle soit gagnée) ;
  //   q   le jour du dernier « Je tente » raté (fermé jusqu'au lendemain) ;
  //   pe  combien de fois elle a été perdue (3 : « à voir en classe ») ;
  //   d   le jour où elle a été gagnée pour la première fois, `s` celui où
  //       elle est devenue solide (boîte 4), posés une fois ;
  //   ar  un J'apprends arrêté (3 × les arrêts + la reprise, lot F4) ;
  //   g   son COMPTEUR : il monte d'un cran à chaque fois que l'étoile
  //       change. La fusion de deux appareils se décide ÉTOILE PAR ÉTOILE,
  //       sur ce compteur (le plus avancé des deux côtés), jamais sur la
  //       somme d'un module ni sur une date (relecture de Codex du 22/11,
  //       B2).
  // Ont disparu : `ok` (le module « su »), `f`, `t`, `l` (les séries jouées,
  // « entraînée avec l'aide », le « lent » : le rouge d'abord et le
  // réentraînement imposé n'existent plus). La séance : `i`, son identité
  // (tirée à l'ouverture, elle devient le numéro de sa ligne au journal :
  // deux séances différentes restent deux, G3) ; `g`, son compteur ; un plan
  // `p` de 5 nombres (plus aucun rang de compétence dedans : rien ne peut
  // désigner quelque chose de pas jouable, G6). Le journal gagne quatre
  // comptes (`seuls`, `seulsJustes`, `tests`, `testsRates`, pour la page du
  // professeur du lot K2). `paliers` : le jour où « Tente toute la
  // ceinture » a été joué, par étage. `quarts` : le remplissage de la
  // ceinture de chaque étage qu'un changement de carte ne doit pas faire
  // reculer (G9). Le serveur refuse l'écriture d'une page de version 11
  // (« version_min » 12), et ne sert plus une progression à une page qui ne
  // saurait pas la lire (B1).
  // Correctif du lot K1 (26/11/2026, relecture de Codex ; la version 12
  // n'était pas encore en ligne, elle ne change pas de numéro) :
  //  - `seance.parts` : ce que la séance ouverte a fait, PAR ONGLET (onze
  //    nombres par onglet : sa source, puis ses dix comptes) ; `seance.j` en
  //    est la somme. Deux appareils réunissent ainsi leur temps sans le
  //    compter deux fois ;
  //  - `q`, pour une étoile TENUE dont le 2e calcul attend : le jour où le
  //    premier calcul a été posé (la page le retrouve et en pose un autre) ;
  //  - une séance du journal se reconnaît à son jour et à son IDENTITÉ (les
  //    quatre derniers chiffres de `numero`), plus à son numéro entier : la
  //    même séance close à deux rangs différents n'en fait qu'une ;
  //  - une boîte abîmée n'est pas une étoile perdue, une version illisible
  //    n'est pas une remise à zéro, un jour d'entrée sans étoile jamais tenue
  //    est écarté ;
  //  - le prénom (un visiteur sans code) ne part plus du tout au serveur, qui
  //    ne connaît plus cette clé.
  // Version 13 (lot K1b « les bases en trois classes », 26/11/2026, choix de
  // Gwenaël des 22 et 26/11) : SIX étages au lieu de quatre — les bases
  // (44 étoiles) sont coupées en CP (14), CE1 (20) et CE2 (19) ; les étages
  // 2, 3, 4 (CM1, CM2, vers la 6e) deviennent les étages 4, 5, 6. Neuf
  // niveaux sont coupés par classe : la moitié du bas garde son identifiant,
  // la moitié du haut prend un numéro neuf À LA FIN de son module (A10-4,
  // A10-5, A11-4, A2-6, A3-5, A5-5, M1-7, M1-8, M1-9) — aucun rang ne bouge
  // dans les listes enregistrées, elles s'allongent seulement. `ceintures`,
  // `paliers` et `quarts` ont six places.
  // C'est la première version qui REPREND de vraies données : une
  // progression de version 12 se relit SANS RIEN PERDRE (reprendreVersion12) :
  //  - chaque étoile reste à sa place, telle quelle ;
  //  - une étoile d'un niveau coupé GAGNÉE UN JOUR (tenue, ou perdue depuis)
  //    vaut pour ses deux moitiés : la moitié du haut reçoit sa boîte, ses
  //    dates, ses compteurs (un 2e calcul qui attendait reste sur la moitié
  //    du bas : celle du haut revient avec un premier calcul) ;
  //  - ce qui n'a jamais été gagné — un « Je tente » raté, un J'apprends en
  //    cours, « à voir en classe » — reste sur la moitié du bas ;
  //  - la ceinture jaune d'avant donne les ceintures blanche-jaune, jaune et
  //    jaune-orange, le même jour ; sans elle, celles des trois étages dont
  //    toutes les étoiles sont tenues, dans l'ordre, datées du jour où leur
  //    dernière étoile a été gagnée (la table des trois étages au moment de
  //    la coupe est gardée ici : COUPE_K1B) ;
  //  - un test de ceinture joué sur les bases vaut pour les trois étages ;
  //  - la ceinture qui se remplit ne recule pas (G9) : celle que l'élève
  //    remplit maintenant (le premier des trois étages pas encore gagné)
  //    garde, dans `quarts`, le remplissage qu'il voyait sur la ceinture des
  //    bases ;
  //  - la séance, le journal, les jours ne changent pas.
  // Correctif K1b (relecture de Codex du 26/11, bloquant) — le COMPTEUR d'une
  // moitié du haut a deux étages. Reporté de l'étoile d'avant par la reprise,
  // il reste de 0 à 4 999 (COMPTEUR_HERITE_MAX) : c'est le compteur de la
  // version 12, il départage deux copies de version 12 comme leur fusion
  // l'aurait fait. Au premier geste fait EN VERSION 13 sur cette moitié du
  // haut (un retour, un « Je tente », un J'apprends, un test de ceinture), il
  // repart au-dessus de 5 000 (COMPTEUR_JOUE) et compte les gestes de la
  // version 13 : 5 001, 5 002… La fusion, qui garde le compteur le plus haut,
  // n'a pas changé d'une ligne — mais ce qui est JOUÉ sur une moitié du haut
  // passe ainsi toujours devant ce qui n'est que REPORTÉ d'avant. Avant ce
  // correctif, un appareil resté hors ligne en version 12 qui avait perdu
  // l'étoile d'avant (compteur 4) effaçait, en arrivant, le retour réussi
  // depuis en version 13 sur la moitié du haut (compteur 2 + 1) : les deux
  // compteurs n'avaient pas la même origine. (Pas d'ordre par les dates : la
  // version 12 ne garde pas le jour où une étoile a été perdue.) La moitié du
  // bas et les autres étoiles gardent leur compteur d'un seul tenant : pour
  // elles, c'est la même étoile qu'avant.
  // Les versions 2 à 11 repartent toujours de zéro (aucun élève n'avait
  // joué). Le serveur refuse l'écriture d'une page de version 12
  // (« version_min » 13). Le réglage du professeur « jusqu'où va l'appli »
  // change de nom avec la numérotation : `etage` (1 à 6) ; l'ancien, `palier`
  // (1 à 4), se relit toujours dans SA numérotation (voir etageRegle).
  // Version 14 (lot P1 « tout ouvert, et une semaine après un « Je tente »
  // réussi », 27/11/2026 ; décisions de Gwenaël : `carte-et-cles\P1\
  // defi-calcul-parcours-DECISIONS-26-11.md`, § 9 et 10) :
  //  - TOUT EST OUVERT dès le premier jour (jusqu'au réglage « jusqu'où va
  //    l'appli ») ; dans un étage, l'ordre d'une ligne reste (l'étoile
  //    suivante s'ouvre quand celle d'avant a été gagnée, les liens
  //    « d'abord » aussi). Chaque ceinture se gagne À PART (toutes les
  //    étoiles de son étage), dans n'importe quel ordre ;
  //  - « Continuer » part du CP pour tous et monte ; après un « Je tente »
  //    raté, il descend tout seul (l'étoile plus facile de la famille). Pas
  //    de classe de l'élève dans les données (le réglage du professeur
  //    « D'où part « Continuer » » : lot K2) ;
  //  - UNE SEULE RÈGLE NEUVE POUR LES RETOURS (Gwenaël, 27/11, 10 h 29) : une
  //    étoile gagnée DU PREMIER COUP à « Je tente » (jamais ratée à « Je
  //    tente », jamais perdue, aucune leçon commencée dessus) entre en
  //    boîte 4 (`SEUILS.revision.duPremierCoup`) : elle revient pour la
  //    première fois au bout de 7 jours, puis à 14, 30 et 60 jours. Toute
  //    autre étoile gagnée entre en boîte 2 : le lendemain, puis 3, 7, 14,
  //    30, 60 jours, comme en version 13. Tous les calculs reviennent pour
  //    eux-mêmes ; pas de « fin » d'une étoile ;
  //  - un retour raté = « la règle B » : l'étoile reste, descend d'une boîte
  //    et revient le lendemain ; ratée encore, elle part ;
  //  - la SORTE du calcul raté à un retour (1 à 60 ; 0 : aucune — c'est la
  //    page qui numérote les sortes d'un niveau), rangée dans `x` (× 4 :
  //    `x` va de 0 à 243, aucune clé de plus). Le 2e calcul d'un retour est
  //    de la même sorte, et le retour suivant de l'étoile commence par elle ;
  //    elle s'efface quand l'étoile monte ;
  //  - « Tente toute la ceinture » a disparu (`paliers` reste dans le format,
  //    relu et fusionné, mais plus rien ne s'en sert) ; la vitesse ne refuse
  //    plus une étoile à « Je tente » ; le premier retour d'une étoile ne
  //    montre plus d'exemple.
  // Une progression de version 13 se relit SANS RIEN PERDRE et sans rien
  // transformer : ses étoiles gardent leur boîte et leur échéance, aucune
  // sorte ; une version 12 passe d'abord par reprendreVersion12. Le serveur
  // refuse l'écriture d'une page de version 13 (« version_min » 14) : elle
  // couperait `x` à 3 (elle effacerait la sorte, et un 4 deviendrait 3 : un
  // retour raté et un 2e calcul qui n'existent pas).
  // Version 15 (lot « la 6e complète », 27/11/2026, choix de Gwenaël du
  // 26/11) : l'étage de 6e a 22 étoiles. Deux lignes s'allongent ou
  // arrivent, aucune clé neuve : « Entier × fraction » (F11) gagne un niveau
  // au bout (F11-3, « Une fraction d'un nombre ») et « Où va la virgule ? »
  // est un module neuf (D16, un niveau) ; les modules réservés D10, D11,
  // D12, D14, F10, P1 et P2 étaient déjà dans le format (leurs lignes ne
  // changent pas de taille). Une progression de version 14 se relit SANS
  // RIEN PERDRE : la ligne de F11 reçoit une case vide au bout, D16 n'y est
  // pas (vide). Le serveur refuse l'écriture d'une page de version 14
  // (« version_min » 15) : elle couperait la ligne de F11 à deux cases et
  // jetterait D16 (une étoile gagnée sur un autre appareil partirait).
  const VERSION = 15;
  // Les versions d'avant qui se relisent (les autres repartent de zéro) : la
  // 12 est reprise (reprendreVersion12), la 13 et la 14 se relisent telles
  // quelles.
  const VERSION_REPRISE = 12;
  const VERSION_13 = 13;
  const VERSION_14 = 14;
  const CLE_STOCKAGE = "mathsgo-defi-calcul-parcours";
  const PRENOM_MAX = 20;
  // Le code de suivi et l'identité vivent dans l'ONGLET, sous les mêmes clés
  // que Défi tables : c'est le même élève, entré par le même espace.
  const CLE_CODE = "mathsgo-suivi-code";
  const ALPHABET_CODE = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const LONGUEUR_CODE = 6;

  // Les 74 codes et leur nombre de niveaux, dans l'ordre de la carte (les
  // 45 modules construits ou à construire, puis les 29 réservés). Un test
  // compare cette table aux fiches de defi_calcul_core.js. Carte v3 (lot
  // « couverture ») : A2 5, A8 2, A9 2, M9 2, F5 2. Lot 6 « programmes 2 »
  // (version 9) : F6 4, F9 3. Lot C2 (version 11) : M1 6, D8 5. Lot K1b
  // (version 13) : A10 5, A11 4, A2 6, A3 5, A5 5, M1 9.
  const NIVEAUX = Object.freeze({
    A1: 3, A10: 5, A11: 4, A2: 6, A3: 5, A4: 4, A5: 5, A6: 4, A7: 3, A8: 2, A9: 2,
    M4: 2, M1: 9, M2: 2, M3: 3, M5: 1, M6: 2, M13: 3, M7: 3, M8: 3, M9: 2, M10: 3, M11: 2, M12: 3,
    C1: 3, C3: 3, C4: 2,
    D1: 3, D2: 4, D3: 3, D4: 3, D5: 2, D6: 3, D7: 3, D8: 5, D9: 2,
    F2: 2, F1: 3, F3: 3, F4: 2, F5: 2, F6: 4, F8: 3, F9: 3, F11: 3,
    D10: 3, D11: 3, D12: 2, D13: 3, D14: 3, D15: 3, F7: 3, F10: 3, F12: 2, F13: 3,
    P1: 3, P2: 3, P3: 4, P4: 3, R1: 2, R2: 3, R3: 3, R4: 3, R5: 4, R6: 2,
    X1: 3, X2: 3, X3: 2, X4: 3, X5: 4, X6: 3, X7: 3, C2: 4, C5: 3,
    // Lot « la 6e complète » (version 15) : un module neuf, à la fin.
    D16: 1
  });
  const CODES = Object.freeze(Object.keys(NIVEAUX));

  // Lot K1b : la coupe des bases, telle qu'elle était le jour où la version
  // 12 est devenue la version 13 (elle ne sert qu'à relire une version 12 :
  // elle ne suit PAS la carte si celle-ci change plus tard).
  //  - `niveaux` : combien de niveaux avaient, en version 12, les six
  //    modules qui en ont gagné ;
  //  - `moities` : pour chacun, [le rang de la moitié du bas, le rang de la
  //    moitié du haut] (de 0) de chaque niveau coupé ;
  //  - `etages` : les étoiles du CP, du CE1 et du CE2 (les 44 étoiles de
  //    l'étage du bas d'avant, et les 9 moitiés du haut).
  const gelerListes = objet => Object.freeze(Object.fromEntries(Object.entries(objet).map(([cle, liste]) => [cle, Object.freeze(liste.map(x => (Array.isArray(x) ? Object.freeze(x) : x)))])));
  const COUPE_K1B = Object.freeze({
    niveaux: Object.freeze({A10: 3, A11: 3, A2: 5, A3: 4, A5: 4, M1: 6}),
    moities: gelerListes({A10: [[0, 3], [1, 4]], A11: [[1, 3]], A2: [[0, 5]], A3: [[0, 4]], A5: [[0, 4]], M1: [[0, 6], [1, 7], [3, 8]]}),
    etages: Object.freeze([
      Object.freeze(["A1-1", "A1-2", "A1-3", "A10-1", "A10-2", "A4-1", "A4-2", "A5-1", "A2-1", "A11-2", "A3-1", "M1-1", "M1-2", "M1-4"]),
      Object.freeze(["A10-4", "A10-5", "A4-3", "A11-1", "A11-4", "A7-1", "A2-6", "A3-5", "A2-2", "A2-3", "A3-2", "A5-5", "A6-1", "M1-3", "M1-9",
        "M4-1", "M4-2", "M8-1", "F8-1", "F8-2"]),
      Object.freeze(["A10-3", "A11-3", "A7-2", "A8-1", "A5-2", "A6-2", "A5-3", "M1-7", "M1-8", "M1-5", "M1-6", "M2-1", "M3-1", "M5-1", "M6-1", "M6-2",
        "M8-2", "F6-1", "F9-1"])
    ])
  });

  // Correctif K1b : les deux étages du compteur `g` d'une moitié du haut
  // (voir en tête, « Correctif K1b »). `HAUTES` : par module, les rangs (de
  // 0) des neuf moitiés du haut.
  const COMPTEUR_HERITE_MAX = 4999;
  const COMPTEUR_JOUE = 5000;
  const HAUTES = Object.freeze(Object.fromEntries(Object.entries(COUPE_K1B.moities).map(([id, paires]) => [id, Object.freeze(paires.map(([, haut]) => haut))])));
  const moitieDuHaut = (id, index) => Object.prototype.hasOwnProperty.call(HAUTES, id) && HAUTES[id].includes(index);

  // Le rang d'une compétence : sa place dans la liste de toutes les
  // compétences (227 depuis la version 13), module après module. Plus rien
  // d'enregistré ne s'en sert depuis la version 12 (le plan de la séance ne
  // désigne plus aucune compétence) ; il reste un nom court et stable.
  const RANGS = (() => {
    const debut = {};
    let rang = 0;
    CODES.forEach(id => { debut[id] = rang; rang += NIVEAUX[id]; });
    return Object.freeze({debut: Object.freeze(debut), total: rang});
  })();

  function rangDe(id, niveau) {
    return RANGS.debut[id] + niveau - 1;
  }

  function competenceDeRang(rang) {
    const id = CODES.find(code => rang >= RANGS.debut[code] && rang < RANGS.debut[code] + NIVEAUX[code]);
    return id ? {module: id, niveau: rang - RANGS.debut[id] + 1} : null;
  }

  const SEUILS = Object.freeze({
    // Un entraînement à longueur adaptée (scénario du 30/10, couches du
    // 31/10) : l'outil à manipuler d'abord (les perles, le glisse-nombres),
    // 2 justes ; puis l'image (la droite, le tableau), 2 justes ; puis rien.
    // Lot F4 (18/11/2026, choix de Gwenaël) : réussi à 5 justes sur les 6
    // derniers calculs sans aide. Une erreur seule, une fois sans aide : le
    // dessin revient pour UN calcul (juste, on repart sans aide, la fenêtre
    // est gardée) ; deux erreurs de suite : l'outil, comme avant.
    entraine: Object.freeze({avecOutil: 2, sansOutil: 5, fenetre: 6, erreurs: 2, maximum: 25}),
    // Lot F4 : J'apprends ne se rate plus. Il s'arrête sur « On continue
    // demain » dès que la séance a passé son temps (les minutes prévues et la
    // minute de tolérance) s'il a déjà fait 4 calculs, et au plus tard au
    // bout de 25 calculs ; il garde où l'élève en est (au dessin, ou sans
    // aide) et reprend là le lendemain, sans « On te montre ». Au 3e arrêt
    // sur la même étoile, elle est « à voir en classe » (signalée au
    // professeur) et attend 7 jours : l'élève passe à la suite.
    apprends: Object.freeze({maximum: 25, avantArret: 4, arrets: 3, joursDeCote: 7}),
    // « Je m'entraîne encore » (sur une étoile gagnée, sans effet sur les
    // boîtes) : commence au dessin, fini à 3 justes de suite sans aide, 20
    // calculs au plus. (Le nom `rattrapage` date du « rouge d'abord ».)
    rattrapage: Object.freeze({sansOutil: 3, maximum: 20}),
    // Les boîtes : délais de retour 1, 1, 3, 7, 14, 30, 60 jours. Une étoile
    // gagnée (par « Je tente » ou par J'apprends) entre AU DÉBUT des boîtes,
    // en boîte 2, et revient le lendemain (choix de Gwenaël du 21/11,
    // 20 h 53) ; placée par « Tente toute la ceinture », en boîte 4 ; elle
    // est solide en boîte 4 (une information pour le professeur seulement).
    // (Lot P1 : « Tente toute la ceinture » n'existe plus ; la boîte d'entrée
    // est la 2 ; `duPremierCoup` : la boîte d'entrée d'une étoile gagnée
    // du premier coup à « Je tente » — la 4, son premier retour au bout de
    // 7 jours ; choix de Gwenaël du 27/11.)
    revision: Object.freeze({boites: 7, delais: Object.freeze([1, 1, 3, 7, 14, 30, 60]), entree: 2, duPremierCoup: 4, su: 4}),
    // Lot P1 : `sortes` : le plus grand numéro de sorte gardé pour un retour
    // raté.
    sortes: 60,
    // Lot P1 — « Continuer » DESCEND TOUT SEUL : quand l'étoile qu'il allait
    // proposer a déjà un « Je tente » raté, il propose d'abord l'étoile
    // « plus facile » (etoilePlusFacile), tant qu'il y en a une ; sinon
    // l'étoile elle-même (J'apprends, ou « Je tente » le lendemain).
    // Quand rien de plus facile n'existe dans la famille de l'étoile ratée,
    // il ne descend dans l'étage d'en dessous que si l'élève y tient moins
    // d'une étoile sur `partDessous` (2 : moins de la moitié) — sinon il est
    // prêt pour la leçon de l'étoile ratée, et c'est elle qu'il propose.
    // Il y descend aussi quand la leçon de l'étoile s'est déjà arrêtée
    // `arrets` fois (« On continue demain » deux fois : l'élève n'est pas
    // prêt), avant de la reprendre.
    continuer: Object.freeze({descend: true, partDessous: 2, arrets: 2}),
    // « Je tente » (choix de Gwenaël des 21, 22 et 25/11) : 6 calculs, 5
    // justes, l'étoile est gagnée ; arrêt au 2e faux. Raté : fermé sur cette
    // étoile jusqu'au lendemain ; raté deux fois sur la même étoile : elle ne
    // propose plus que « J'apprends », jusqu'à ce qu'elle soit gagnée. Pour
    // un niveau « par cœur », juste mais lent deux fois de suite compte faux.
    // Lot P1 : la vitesse ne refuse plus une étoile (six réponses justes à
    // plus de 5 s rataient le test, alors que l'écran dit « 5 justes ») ;
    // `lentMs` ne sert plus qu'à compter les réponses lentes (`lents`).
    tente: Object.freeze({calculs: 6, justes: 5, fauxPermis: 1, essais: 2, lentMs: 5000}),
    // Un retour dans Mes calculs du jour : un calcul ; faux, un 2e ; le 2e
    // juste, c'était un accident (rien ne bouge, elle revient demain). Les
    // deux faux : le retour est raté, et L'ÉTOILE PART TOUT DE SUITE (choix
    // de Gwenaël du 25/11, 17 h 10 : « il ne la connaît pas, il la
    // retravaille » — sa règle du 21/11, qui remplace son choix de 16 h le
    // même jour, « elle revient demain, puis elle part »). Elle sort des
    // boîtes, se regagne par « Je tente » (le jour même s'il veut) ou par
    // J'apprends, et rentre alors au début des boîtes. `ratesDeSuite` :
    // combien de retours ratés de suite font partir l'étoile — 1 ; à 2, on
    // retrouve la règle de 16 h (au premier, elle descend d'une boîte et
    // revient le lendemain), le moteur sait faire les deux. Perdue 3 fois :
    // « à voir en classe ».
    // Lot P1 (choix de Gwenaël du 26/11, 22 h 34) : `ratesDeSuite` vaut 2 —
    // « la règle B ». Au premier retour raté, l'étoile reste, descend d'une
    // boîte, revient le lendemain ; ratée encore, elle part.
    retour: Object.freeze({ratesDeSuite: 2, perdues: 3}),
    // Mes calculs du jour : ce qui est dû, un calcul par étoile, par PAQUETS
    // de 10, les plus anciennes d'abord (choix de Gwenaël du 21/11, 21 h 10).
    // Le premier paquet est le seul passage obligé ; « Continuer » propose
    // le paquet suivant dès qu'une étoile a 3 jours de retard. Pour un
    // niveau « par cœur », un calcul juste au-delà de 5 s ne fait pas
    // monter (et ne fait jamais perdre l'étoile).
    jour: Object.freeze({paquet: 10, retard: 3, lentMs: 5000}),
    // « Tente toute la ceinture » : 12 calculs (le dernier niveau de chaque
    // module dans l'étage, les derniers de l'ordre de la carte). Un faux
    // permis : tout l'étage est gagné ; sinon les modules dont le calcul est
    // juste gardent leurs étoiles de l'étage. Ces étoiles reviennent
    // étalées : 8 par jour au plus, à partir du 7e jour.
    // La séance au temps : 10 minutes, ou 15 au choix du professeur. Une
    // étape de la carte ne commence que si le temps actif plus sa durée
    // habituelle tient dans les minutes prévues, plus une minute ; la
    // première est toujours permise. Durées (en secondes) : « Je tente » 1
    // minute, J'apprends 4 (simulateur du lot K0).
    // `paliers` : jusqu'où va l'appli (lot K1b : 1 le CP, 2 le CE1, 3 le CE2,
    // 4 le CM1, 5 le CM2, 6 vers la 6e : tout), réglé par le professeur ;
    // au-delà, rien ne se montre.
    seance: Object.freeze({garder: 60, etapes: 99, minutes: Object.freeze([10, 15]), defaut: 10, tolerance: 60,
      durees: Object.freeze({tente: 60, apprends: 240, encore: 150}), paliers: 6}),
    // Les étoiles gagnées dans une séance, au journal : un compte.
    nouveautes: Object.freeze({maximum: 99}),
    // Le journal d'une séance (lot G1) : des comptes bornés, la durée en
    // minutes de temps actif (90 au plus). La séance ouverte compte ses
    // secondes (90 minutes au plus).
    // `tempsSeul` (correctif K1) : une séance laissée ouverte où rien n'a été
    // fini (ni étape, ni calcul du jour) compte quand même pour son jour à
    // partir d'une minute de travail.
    journal: Object.freeze({compte: 999, minutes: 90, secondes: 5400, tempsSeul: 60}),
    jours: Object.freeze({garder: 14}),
    compteur: 9999,
    causes: 12,
    // Les ceintures : une par étage, dans l'ordre. Celle de l'étage en cours
    // se remplit de sa couleur quart par quart (choix de Gwenaël du 22/11) ;
    // `barrettes` : ce que lit encore la page du professeur (3 au plus).
    // (Lot K1b : six étages, six ceintures à gagner.)
    ceintures: Object.freeze({nombre: 6, quarts: 4, barrettes: 3})
  });

  // Le plan de la séance en cours, `seance.p` : cinq nombres. Plus aucun
  // rang de compétence dedans (relecture de Codex du 22/11, G6) : ce que la
  // séance propose se recalcule à chaque fois sur l'état des étoiles.
  //   [0] 1 si la séance est ouverte (commencée, pas finie) ;
  //   [1] les minutes prévues, 10 ou 15 (le réglage à l'ouverture) ;
  //   [2] 1 si le paquet en cours est le passage OBLIGÉ (le premier paquet
  //       de Mes calculs du jour, avant la carte) ;
  //   [3] les étoiles qui restent à demander dans le paquet en cours (10 au
  //       plus ; 0 : pas de paquet en cours) ;
  //   [4] les étapes de la carte commencées dans cette séance (« Je
  //       tente », J'apprends, « Tente toute la ceinture ») : tant qu'il
  //       vaut 0, la prochaine est toujours permise.
  const PLAN = Object.freeze({ouverte: 0, minutes: 1, obligatoire: 2, paquet: 3, commences: 4});
  // Lot F4 : où reprend un J'apprends arrêté (`ar`).
  const REPRISE = Object.freeze({montre: 0, dessin: 1, seul: 2});
  const PLAN_MAX = Object.freeze([1, SEUILS.seance.minutes[SEUILS.seance.minutes.length - 1], 1, SEUILS.jour.paquet, 99]);
  // L'identité d'une séance, tirée à son ouverture (1 à 9 999) ; 0 : aucune.
  const IDENTITE_MAX = 9999;

  // Le journal des séances (lot G1 « journal + accueil », 07/11/2026). Pour
  // chaque séance FINIE, rangée comme `seances` (la même place dans chaque
  // liste) : les calculs du jour faits, combien étaient justes, les étoiles
  // gagnées par J'apprends (`nouveautes`), les étoiles gagnées par « Je
  // tente » ou « Tente toute la ceinture » (`prouvees`), les étoiles perdues
  // au retour (`rouges`), la durée en minutes de temps actif, le numéro de
  // la séance ; et, depuis la version 12 (pour la page du professeur du lot
  // K2) : les calculs faits SANS AIDE dans J'apprends et combien étaient
  // justes (`seuls`, `seulsJustes`), les premiers retours d'étoiles placées
  // par « Tente toute la ceinture » et combien ont été ratés (`tests`,
  // `testsRates` ; version 14 : les premiers retours à 7 jours des étoiles
  // gagnées du premier coup à « Je tente »). Rien que des entiers : ni heure, ni calcul, ni réponse.
  // -1 : pas connu (une valeur abîmée).
  // Le NUMÉRO d'une séance : son rang dans sa journée × 10 000 + son
  // IDENTITÉ (1 à 9 999, tirée à l'ouverture de la séance, version 12 —
  // relecture de Codex du 22/11, G3 : avant, une empreinte de ses nombres,
  // et deux séances aux mêmes nombres faites chacune sur son appareil n'en
  // faisaient qu'une). Deux copies d'une même séance ont la même identité,
  // d'un appareil à l'autre : elles se dédoublonnent ; deux séances
  // différentes en ont deux (sauf une fois sur 10 000). Le rang range la
  // journée dans l'ordre où l'élève l'a jouée ; ce n'est ni une heure ni une
  // durée. -1 : une séance sans numéro — son entrée ne dit rien, elle est
  // « blanche ». Une entrée connue sans numéro (abîmée) en reçoit un par sa
  // place dans la journée et l'empreinte de ses nombres : le même sur
  // chaque appareil, rien de tiré au hasard.
  const NUMERO_RANG = 10000;
  const NUMERO_RANGS = 99;
  const NUMERO_MAX = NUMERO_RANGS * NUMERO_RANG + NUMERO_RANG - 1;
  const JOURNAL = Object.freeze(["calculs", "justes", "nouveautes", "prouvees", "rouges", "minutes", "numero",
    "seuls", "seulsJustes", "tests", "testsRates"]);
  const JOURNAL_MAX = Object.freeze([SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.nouveautes.maximum,
    SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.journal.minutes, NUMERO_MAX,
    SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.journal.compte]);
  // Ce que la séance OUVERTE a déjà fait, `seance.j` : dix nombres, versés
  // au journal quand elle finit.
  //   [0] calculs du jour faits, [1] justes, [2] étoiles gagnées par « Je
  //   tente » ou par un test de ceinture, [3] étoiles perdues, [4] secondes
  //   de temps actif, [5] étoiles gagnées par J'apprends, [6] calculs sans
  //   aide dans J'apprends, [7] justes parmi eux, [8] premiers retours
  //   d'étoiles placées par un test de ceinture, [9] ratés parmi eux.
  const EN_COURS = Object.freeze({calculs: 0, justes: 1, prouvees: 2, rouges: 3, secondes: 4, nouveautes: 5,
    seuls: 6, seulsJustes: 7, tests: 8, testsRates: 9});
  const EN_COURS_MAX = Object.freeze([SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.journal.compte,
    SEUILS.journal.compte, SEUILS.journal.secondes, SEUILS.nouveautes.maximum,
    SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.journal.compte, SEUILS.journal.compte]);

  // Correctif K1 (relecture de Codex du 26/11) : ce que la séance ouverte a
  // fait est gardé PAR ONGLET, `seance.parts` — une liste à plat, onze
  // nombres par onglet qui y a travaillé : sa SOURCE (un nombre de 1 à
  // 9 999 tiré par l'onglet, gardé dans l'onglet seulement ; 0 : pas connue),
  // puis ses dix comptes (l'ordre de `seance.j`). `seance.j` en est la somme,
  // recalculée à chaque relecture. La fusion de deux appareils réunit les
  // parts : pour une même source, le plus grand de chaque compte (un onglet
  // ne fait que monter les siens) ; d'une source à l'autre, la somme. Le
  // temps commun n'est donc compté qu'une fois, et ce que chaque appareil a
  // ajouté de son côté est gardé (avant : la séance d'un seul des deux, en
  // bloc). Huit onglets au plus ; au-delà, on ajoute à la dernière part.
  const SOURCE_MAX = 9999;
  const PARTS_MAX = 8;
  const PART = 1 + EN_COURS_MAX.length;

  // Les parts lues : [{source, valeurs}], une par source (la même source
  // deux fois : le plus grand de chaque compte), sans part vide, triées par
  // source, huit au plus (les plus petites sources : le même choix sur
  // chaque appareil).
  function lireParts(brut) {
    const liste = Array.isArray(brut) ? brut : [];
    const parSource = new Map();
    for (let debut = 0; debut + PART <= liste.length; debut += PART) {
      const source = entier(liste[debut], 0, SOURCE_MAX, -1);
      if (source < 0) continue;
      const valeurs = EN_COURS_MAX.map((maximum, index) => entier(liste[debut + 1 + index], 0, maximum));
      if (!valeurs.some(Boolean)) continue;
      const avant = parSource.get(source);
      parSource.set(source, avant ? avant.map((valeur, index) => Math.max(valeur, valeurs[index])) : valeurs);
    }
    return [...parSource.keys()].sort((x, y) => x - y).slice(0, PARTS_MAX).map(source => ({source, valeurs: parSource.get(source)}));
  }

  // Les parts posées dans la séance, et leur somme dans `j` (jamais plus de
  // justes que de calculs, ni de ratés que de retours).
  function poserParts(seance, groupes) {
    const ranges = groupes.slice().sort((x, y) => x.source - y.source);
    seance.parts = [].concat(...ranges.map(groupe => [groupe.source, ...groupe.valeurs]));
    const j = EN_COURS_MAX.map((maximum, index) => Math.min(maximum, ranges.reduce((somme, groupe) => somme + groupe.valeurs[index], 0)));
    if (j[EN_COURS.justes] > j[EN_COURS.calculs]) j[EN_COURS.justes] = j[EN_COURS.calculs];
    if (j[EN_COURS.seulsJustes] > j[EN_COURS.seuls]) j[EN_COURS.seulsJustes] = j[EN_COURS.seuls];
    if (j[EN_COURS.testsRates] > j[EN_COURS.tests]) j[EN_COURS.testsRates] = j[EN_COURS.tests];
    seance.j = j;
  }

  // Les parts de deux copies, réunies (voir ci-dessus).
  function reunirParts(premieres, secondes) {
    return lireParts([].concat(...[...premieres, ...secondes].map(groupe => [groupe.source, ...groupe.valeurs])));
  }

  // Les minutes d'une séance : 10 ou 15 (un vrai nombre, pas « 15 » en
  // texte) ; tout le reste vaut 10.
  function minutesDeSeance(valeur) {
    return Number.isInteger(valeur) && SEUILS.seance.minutes.includes(valeur) ? valeur : SEUILS.seance.defaut;
  }

  // Jusqu'à quel étage va l'appli : 1 à 6 ; tout le reste vaut 6 (tout).
  function palierDeSeance(valeur) {
    return Number.isInteger(valeur) && valeur >= 1 && valeur <= SEUILS.seance.paliers ? valeur : SEUILS.seance.paliers;
  }

  // Lot K1b : ce que règle le professeur, « jusqu'où va l'appli ». Le réglage
  // s'appelle `etage` (1 le CP … 6 vers la 6e : tout). L'ancien, `palier` (1
  // les bases, 2 CM1, 3 CM2, 4 tout — lot 1 « la séance »), arrive encore
  // d'un serveur ou d'un onglet d'avant le lot : il est TOUJOURS lu dans
  // l'ancienne numérotation — un 2 d'avant veut dire CM1 (l'étage 4), jamais
  // CE1. Rien d'un ancien numéro ne peut donc ouvrir moins, ni plus, que ce
  // qu'il ouvrait.
  const ETAGES_DES_PALIERS_12 = Object.freeze({1: 3, 2: 4, 3: 5, 4: 6});
  function etageRegle(lu) {
    const r = lu && typeof lu === "object" && !Array.isArray(lu) ? lu : {};
    if (Object.prototype.hasOwnProperty.call(r, "etage")) return palierDeSeance(r.etage);
    if (Number.isInteger(r.palier) && Object.prototype.hasOwnProperty.call(ETAGES_DES_PALIERS_12, r.palier)) return ETAGES_DES_PALIERS_12[r.palier];
    return SEUILS.seance.paliers;
  }

  // Les minutes prévues d'un plan (0 : un plan de version 6).
  function minutesDuPlan(plan) {
    return minutesDeSeance(plan[PLAN.minutes]);
  }

  function cloner(valeur) {
    return JSON.parse(JSON.stringify(valeur));
  }

  // Un ENTIER borné, sinon `defaut`. Le type est contrôlé AVANT toute
  // conversion (relecture de Codex du 22/11, G5) : seul un vrai nombre
  // entier passe — ni un booléen (true valait 1 : une boîte gagnée sans
  // jouer), ni un texte, ni une liste d'un seul nombre, ni un objet (sa
  // conversion pouvait lever une exception et vider tout le parcours).
  function entier(valeur, minimum, maximum, defaut = 0) {
    if (typeof valeur !== "number" || !Number.isInteger(valeur) || valeur < minimum || valeur > maximum) return defaut;
    return valeur;
  }

  // Une date est un VRAI jour, « AAAA-MM-JJ », rien d'autre : la même règle
  // que le serveur (lib/progression.php, date_reelle : checkdate, année 1 à
  // 9999). Lot G1 : la forme seule ne suffit plus — le serveur retire d'une
  // liste « 2026-02-30 » ou « 0000-01-01 », et les listes alignées (les
  // séances et leur journal, les dates des compétences) glisseraient d'un
  // rang ; ici, elles sont écartées (séances) ou valent null (compétences).
  function dateOuNull(valeur) {
    if (typeof valeur !== "string") return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur);
    if (!m) return null;
    const [annee, mois, jour] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (annee < 1 || mois < 1 || mois > 12 || jour < 1) return null;
    const bissextile = annee % 4 === 0 && (annee % 100 !== 0 || annee % 400 === 0);
    const jours = [31, bissextile ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mois - 1];
    return jour <= jours ? valeur : null;
  }

  // LE jour du parcours : le jour local de l'appareil.
  function jourLocal(instant = new Date()) {
    const d = instant instanceof Date && !Number.isNaN(instant.getTime()) ? instant : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // « AAAA-MM-JJ » + n jours, en jours locaux (midi, pour ignorer les
  // changements d'heure).
  function ajouterJours(jour, nombre) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    d.setDate(d.getDate() + nombre);
    return jourLocal(d);
  }

  function ecartJours(premier, second) {
    const a = new Date(`${premier}T12:00:00`);
    const b = new Date(`${second}T12:00:00`);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.round((b - a) / 86400000);
  }

  // Le lundi de la semaine d'un jour (semaine du lundi au dimanche).
  function lundiDe(jour) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return jourLocal(d);
  }

  // Le délai de retour d'une boîte, en jours, et le jour où une compétence
  // revient quand elle vient d'y entrer.
  function delaiDeBoite(boite) {
    return SEUILS.revision.delais[entier(boite, 1, SEUILS.revision.boites, 1) - 1];
  }

  const DELAI_MAX = Math.max(...SEUILS.revision.delais);

  function echeanceDeBoite(boite, jour) {
    return ajouterJours(jour, delaiDeBoite(boite));
  }

  // La couleur d'une boîte : gris (pas entrée), rouge (à revoir), bleu (en
  // route), vert (sue).
  function couleurDeBoite(boite) {
    if (!boite) return "gris";
    if (boite === 1) return "rouge";
    return boite >= SEUILS.revision.su ? "vert" : "bleu";
  }

  function normaliserJours(liste) {
    const jours = new Set();
    (Array.isArray(liste) ? liste : []).forEach(valeur => {
      const jour = dateOuNull(valeur);
      if (jour) jours.add(jour);
    });
    return [...jours].sort().slice(-SEUILS.jours.garder);
  }

  // Les jours des séances finies : des dates, répétées quand il y a eu
  // plusieurs séances le même jour, les plus récentes gardées.
  function normaliserSeances(liste) {
    return normaliserSeancesEtJournal(liste, null).seances;
  }

  function journalVide() {
    const journal = {};
    JOURNAL.forEach(champ => { journal[champ] = []; });
    return journal;
  }

  // Une entrée du journal, propre : onze entiers, -1 quand ce n'est pas
  // connu ; jamais plus de justes que de calculs (ni de ratés que de
  // retours) ; un numéro de rang 0 n'en est pas un.
  function entreePropre(brute) {
    const entree = JOURNAL_MAX.map((maximum, index) => entier(brute[index], -1, maximum, -1));
    const borner = (tout, partie) => {
      const [t, p] = [JOURNAL.indexOf(tout), JOURNAL.indexOf(partie)];
      if (entree[t] >= 0 && entree[p] > entree[t]) entree[p] = entree[t];
    };
    borner("calculs", "justes");
    borner("seuls", "seulsJustes");
    borner("tests", "testsRates");
    const numero = JOURNAL.indexOf("numero");
    if (entree[numero] >= 0 && entree[numero] < NUMERO_RANG) entree[numero] = -1;
    return entree;
  }

  // Les séances finies ET leur journal, rangés ensemble (lot G1) : chaque
  // date garde son entrée. Une liste du journal plus courte que les séances
  // (une progression d'avant le lot G1, ou abîmée) s'aligne sur les plus
  // récentes : les plus anciennes valent -1 (pas connu). Une date qui n'en
  // est pas part avec son entrée ; puis le tri par date (stable : deux
  // séances du même jour gardent leur ordre), le numéro des entrées connues
  // qui n'en ont pas (correctif S1), le rangement et les 60 plus récentes.
  function normaliserSeancesEtJournal(listeBrute, journalBrut) {
    const dates = Array.isArray(listeBrute) ? listeBrute : [];
    const journal = journalBrut && typeof journalBrut === "object" && !Array.isArray(journalBrut) ? journalBrut : {};
    const colonnes = JOURNAL.map(champ => {
      const liste = Array.isArray(journal[champ]) ? journal[champ] : [];
      const decalage = dates.length - liste.length;
      return index => (index - decalage >= 0 && index - decalage < liste.length ? liste[index - decalage] : -1);
    });
    const paires = [];
    dates.forEach((brute, index) => {
      const jour = dateOuNull(brute);
      if (jour) paires.push({jour, entree: entreePropre(colonnes.map(lire => lire(index)))});
    });
    const parJour = paires.map((paire, rang) => ({paire, rang}))
      .sort((x, y) => (x.paire.jour < y.paire.jour ? -1 : x.paire.jour > y.paire.jour ? 1 : x.rang - y.rang))
      .map(x => x.paire);
    return rangerSeances(numeroter(parJour));
  }

  // Le numéro de chaque séance, rangé avec elle.
  const I_NUMERO = JOURNAL.indexOf("numero");
  const numeroDe = entree => entree[I_NUMERO];
  const estBlanche = entree => entree.every((valeur, index) => index === I_NUMERO || valeur < 0) && numeroDe(entree) < 0;
  const entreeBlanche = () => JOURNAL.map(() => -1);
  const rangDuNumero = numero => (numero >= NUMERO_RANG ? Math.floor(numero / NUMERO_RANG) : 0);
  // Correctif K1 (relecture de Codex du 26/11) : une séance du journal se
  // RECONNAÎT à son identité (les quatre derniers chiffres de son numéro) et
  // à son jour ; son rang ne sert qu'à la ranger dans sa journée. Avant, la
  // même séance close au rang 2 sur un appareil et au rang 3 sur l'autre
  // restait deux séances, et ses minutes comptaient deux fois.
  const identiteDuNumero = numero => (numero >= NUMERO_RANG ? numero % NUMERO_RANG : -1);
  const cleDeSeance = paire => `${paire.jour} ${identiteDuNumero(numeroDe(paire.entree))}`;

  // Deux copies d'une même séance (le même jour, la même identité) : celle
  // qui en sait le plus (le moins de « pas connu »), puis le plus grand
  // total, puis un choix fixe sur le texte — la même dans les deux sens, et
  // quel que soit l'ordre. Le numéro n'entre pas dans le choix ; la séance
  // garde le plus petit de ses deux rangs.
  function meilleureEntree(x, y) {
    const sans = entree => entree.filter((_, index) => index !== I_NUMERO);
    const connues = entree => sans(entree).filter(v => v >= 0).length;
    const total = entree => sans(entree).reduce((somme, v) => somme + Math.max(0, v), 0);
    let choisie;
    if (connues(x) !== connues(y)) choisie = connues(x) > connues(y) ? x : y;
    else if (total(x) !== total(y)) choisie = total(x) > total(y) ? x : y;
    else choisie = JSON.stringify(sans(x)) >= JSON.stringify(sans(y)) ? x : y;
    const copie = choisie.slice();
    copie[I_NUMERO] = Math.min(numeroDe(x), numeroDe(y));
    return copie;
  }

  // L'empreinte des nombres d'une entrée (FNV-1a), de 0 à 9 999.
  function empreinteEntree(entree) {
    let h = 2166136261;
    const texte = entree.filter((_, index) => index !== I_NUMERO).join(",");
    for (let i = 0; i < texte.length; i += 1) {
      h ^= texte.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h % NUMERO_RANG;
  }

  // Des paires {jour, entree} triées par jour : une entrée connue sans
  // numéro en reçoit un (sa place dans la journée, son empreinte). Deux
  // entrées sans numéro aux mêmes nombres le même jour restent deux séances :
  // la 2e prend l'empreinte suivante.
  function numeroter(paires) {
    const places = new Map();
    const empreintes = new Map();
    return paires.map(({jour, entree}) => {
      const place = (places.get(jour) || 0) + 1;
      places.set(jour, place);
      if (numeroDe(entree) >= 0 || estBlanche(entree)) return {jour, entree};
      const copie = entree.slice();
      const empreinte = empreinteEntree(entree);
      const deja = empreintes.get(`${jour} ${empreinte}`) || 0;
      empreintes.set(`${jour} ${empreinte}`, deja + 1);
      copie[I_NUMERO] = Math.min(place, NUMERO_RANGS) * NUMERO_RANG + (empreinte + deja) % NUMERO_RANG;
      return {jour, entree: copie};
    });
  }

  // Le numéro d'une séance qui finit `jour` : le rang qui suit la journée
  // (ses séances, et les rangs déjà pris), puis son IDENTITÉ (tirée à son
  // ouverture, G3) ; sans identité (une donnée abîmée), l'empreinte de ses
  // nombres.
  function numeroNeuf(paires, jour, entree, identite = 0) {
    const duJour = paires.filter(paire => paire.jour === jour);
    const rang = Math.min(NUMERO_RANGS, 1 + Math.max(duJour.length, ...duJour.map(paire => rangDuNumero(numeroDe(paire.entree)))));
    return rang * NUMERO_RANG + (identite >= 1 && identite <= IDENTITE_MAX ? identite : empreinteEntree(entree));
  }

  // Des paires {jour, entree} : une seule par identité et par jour (la
  // meilleure), triées par jour, les blanches d'abord puis par numéro (une
  // journée dans l'ordre où elle a été jouée), les 60 plus récentes — en
  // deux formes, `seances` (les dates) et `journal`.
  function rangerSeances(paires) {
    const vues = new Map();
    const gardees = [];
    paires.forEach(paire => {
      const numero = numeroDe(paire.entree);
      if (numero < 0) {
        gardees.push(paire);
        return;
      }
      const cle = cleDeSeance(paire);
      const avant = vues.get(cle);
      if (!avant) {
        const copie = {jour: paire.jour, entree: paire.entree};
        vues.set(cle, copie);
        gardees.push(copie);
      } else avant.entree = meilleureEntree(avant.entree, paire.entree);
    });
    const triees = gardees.map((paire, rang) => ({paire, rang}))
      .sort((x, y) => (x.paire.jour < y.paire.jour ? -1 : x.paire.jour > y.paire.jour ? 1
        : numeroDe(x.paire.entree) !== numeroDe(y.paire.entree) ? numeroDe(x.paire.entree) - numeroDe(y.paire.entree) : x.rang - y.rang))
      .map(x => x.paire).slice(-SEUILS.seance.garder);
    const journal = journalVide();
    triees.forEach(({entree}) => JOURNAL.forEach((champ, index) => journal[champ].push(entree[index])));
    return {seances: triees.map(paire => paire.jour), journal};
  }

  // Les séances de deux appareils (ou plus), réunies (correctif S1). Par
  // jour : chaque séance numérotée une fois (la meilleure de ses copies) ;
  // puis, s'il le faut, des séances blanches pour que la journée compte
  // autant de séances que le plus grand des comptes — une séance sans
  // numéro d'un côté (une copie d'avant le journal) peut être une séance
  // numérotée de l'autre : on ne la double pas. Les 60 plus récentes, APRÈS
  // la réunion. Le résultat ne dépend que de ce qui est réuni : ni du sens,
  // ni de l'ordre des fusions, et une entrée connue n'est jamais effacée.
  function reunirSeances(...cotes) {
    const parJour = new Map();
    cotes.forEach(paires => {
      const comptes = new Map();
      paires.forEach(({jour, entree}) => {
        comptes.set(jour, (comptes.get(jour) || 0) + 1);
        if (!parJour.has(jour)) parJour.set(jour, {seances: 0, numeros: new Map()});
        const numero = numeroDe(entree);
        if (numero < 0) return;
        // (Par identité : la même séance close à deux rangs n'en fait qu'une.)
        const numeros = parJour.get(jour).numeros;
        const identite = identiteDuNumero(numero);
        numeros.set(identite, numeros.has(identite) ? meilleureEntree(numeros.get(identite), entree) : entree.slice());
      });
      comptes.forEach((compte, jour) => {
        const j = parJour.get(jour);
        j.seances = Math.max(j.seances, compte);
      });
    });
    const paires = [];
    parJour.forEach(({seances, numeros}, jour) => {
      for (let i = numeros.size; i < seances; i += 1) paires.push({jour, entree: entreeBlanche()});
      numeros.forEach(entree => paires.push({jour, entree}));
    });
    return rangerSeances(paires);
  }

  function pairesDe(parcours) {
    return parcours.seances.map((jour, index) => ({jour, entree: JOURNAL.map(champ => parcours.journal[champ][index])}));
  }

  // La séance d'identité `identite` est-elle au journal de `jour` ?
  function seanceAuJournal(parcours, jour, identite) {
    return identite > 0 && parcours.seances.some((date, index) => date === jour && identiteDuNumero(parcours.journal.numero[index]) === identite);
  }

  function enCoursVide() {
    return EN_COURS_MAX.map(() => 0);
  }

  function nettoyerPrenom(valeur) {
    if (typeof valeur !== "string") return "";
    return valeur.replace(/\s+/g, " ").trim().slice(0, PRENOM_MAX);
  }

  // ------------------------------------------------------------------ le format

  function listeDe(nombre, valeur = 0) {
    return Array.from({length: nombre}, () => valeur);
  }

  // La ligne d'un module (version 12) : une case par étoile dans chaque
  // liste (le détail est écrit en tête de fichier, « Version 12 »), le jour
  // `vu` où le module a été joué pour la dernière fois, et les erreurs par
  // cause `c`. Une date absente vaut null, et surtout pas "" — le serveur
  // remplace à sa place toute valeur qu'il refuse (lib/applis.php,
  // « listes ») : une liste ne glisse jamais d'une case.
  function moduleVide(id, niveaux = NIVEAUX[id]) {
    const k = niveaux;
    return {vu: null, b: listeDe(k), e: listeDe(k, null), a: listeDe(k), x: listeDe(k), r: listeDe(k), q: listeDe(k, null),
      pe: listeDe(k), d: listeDe(k, null), s: listeDe(k, null), ar: listeDe(k), g: listeDe(k), c: {}};
  }

  // Lot F4 : lire et écrire `ar`. Au-delà du 9e arrêt, le compte tourne
  // (10 → 7, 11 → 8, 12 → 9) au lieu de rester à 9 : la semaine d'attente
  // revient tous les 3 arrêts (12e, 15e…), pas à chaque arrêt. Il ne dépasse
  // donc jamais 9 (`ar` : 29 au plus).
  const ARRETS_MAX = 9;
  function arretSuivant(arrets) {
    const suivant = arrets + 1;
    return suivant > ARRETS_MAX ? suivant - SEUILS.apprends.arrets : suivant;
  }
  const arretsDe = (ligne, index) => Math.floor(ligne.ar[index] / 3);
  const repriseDe = (ligne, index) => ligne.ar[index] % 3;
  function poserArret(ligne, index, arrets, reprise) {
    ligne.ar[index] = Math.min(ARRETS_MAX, Math.max(0, arrets)) * 3 + entier(reprise, 0, REPRISE.seul);
  }
  // `x` : un retour raté (1), et le 2e calcul qui attend (2) ; lot P1, au-
  // dessus (× 4) : la SORTE du calcul raté à un retour (0 : aucune, 1 à 60).
  // Rangée dans `x` plutôt que dans une liste à elle : une clé par module de
  // plus aurait mis le pire cas à 2 027 clés, au-dessus des 2 000 que le
  // serveur accepte. `x` va donc de 0 à 243.
  const X_RATE = 1;
  const X_SECOND = 2;
  const X_SORTE = 4;
  const X_MAX = X_RATE + X_SECOND + X_SORTE * SEUILS.sortes;
  function sorteDe(ligne, index) {
    return Math.floor(ligne.x[index] / X_SORTE);
  }
  function poserSorte(ligne, index, sorte) {
    ligne.x[index] = (ligne.x[index] % X_SORTE) + X_SORTE * entier(sorte, 0, SEUILS.sortes);
  }

  function planVide() {
    return PLAN_MAX.map(() => 0);
  }

  function seanceVide() {
    return {jour: null, etape: 0, n: 0, i: 0, g: 0, p: planVide(), j: enCoursVide(), parts: []};
  }

  function creerParcours() {
    return {
      version: VERSION,
      epoque: 0,
      prenom: "",
      modules: {},
      seance: seanceVide(),
      seances: [],
      journal: journalVide(),
      jours: [],
      ceintures: ceinturesVides(),
      paliers: ceinturesVides(),
      quarts: quartsVides()
    };
  }

  // Une date par étage (null : pas gagnée, pas joué).
  function ceinturesVides() {
    return Array.from({length: SEUILS.ceintures.nombre}, () => null);
  }

  // Le remplissage de la ceinture de chaque étage à ne pas faire reculer (0
  // à 3 quarts ; 0 : rien à garder).
  function quartsVides() {
    return Array.from({length: SEUILS.ceintures.nombre}, () => 0);
  }

  // Une liste d'entiers bornés, à la longueur du format : chaque valeur
  // reste à SA place (une valeur refusée vaut 0), ce qui dépasse est coupé,
  // ce qui manque vaut 0.
  function normaliserListe(brut, nombre, maximum) {
    const liste = Array.isArray(brut) ? brut : [];
    return Array.from({length: nombre}, (_, index) => entier(liste[index], 0, maximum));
  }

  function normaliserDates(brut, nombre) {
    const liste = Array.isArray(brut) ? brut : [];
    return Array.from({length: nombre}, (_, index) => dateOuNull(liste[index]));
  }

  // Le jour de retour d'une étoile « à voir en classe » n'est gardé que s'il
  // tombe au plus tard dans 7 jours (`aujourdhui` : le jour de la
  // relecture) ; plus loin (une horloge fausse, une progression trafiquée),
  // il est ramené à aujourd'hui + 7. Un jour passé reste passé.
  function retourBorne(jour, aujourdhui) {
    const date = dateOuNull(jour);
    if (!date) return null;
    const plusTard = ajouterJours(dateOuNull(aujourdhui) || jourLocal(), SEUILS.apprends.joursDeCote);
    return date > plusTard ? plusTard : date;
  }

  // `aujourdhui` : le jour de la relecture, passé par l'appelant — jamais
  // l'horloge du poste relue ici (relecture de Codex du 22/11 : deux
  // appareils qui réparaient la même copie à des dates différentes
  // fabriquaient deux échéances).
  // `niveaux` : combien de niveaux a la ligne lue (le format d'aujourd'hui ;
  // moins pour une ligne de version 12 d'un module coupé au lot K1b).
  // Correctif P1 (relecture de Codex du 27/11) : `xMax`, la plus grande
  // valeur de `x` que la version lue pouvait écrire — 3 avant la version 14
  // (une copie de version 13 abîmée à 241 était lue 0 par la page de
  // version 13 : elle l'est encore, au lieu de devenir « sorte 60, un
  // retour raté »).
  function normaliserModule(id, brut, aujourdhui = jourLocal(), niveaux = NIVEAUX[id], xMax = X_MAX) {
    const k = niveaux;
    const ligne = moduleVide(id, k);
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return ligne;
    const jour = dateOuNull(aujourdhui) || jourLocal();
    ligne.vu = dateOuNull(brut.vu);
    ligne.b = normaliserListe(brut.b, k, SEUILS.revision.boites);
    ligne.a = normaliserListe(brut.a, k, 1);
    ligne.x = normaliserListe(brut.x, k, xMax);
    ligne.r = normaliserListe(brut.r, k, SEUILS.tente.essais);
    ligne.pe = normaliserListe(brut.pe, k, SEUILS.retour.perdues);
    ligne.ar = normaliserListe(brut.ar, k, ARRETS_MAX * 3 + REPRISE.seul);
    ligne.g = normaliserListe(brut.g, k, SEUILS.compteur);
    ligne.d = normaliserDates(brut.d, k);
    ligne.s = normaliserDates(brut.s, k);
    const echeances = Array.isArray(brut.e) ? brut.e : [];
    const rates = normaliserDates(brut.q, k);
    const boites = Array.isArray(brut.b) ? brut.b : [];
    for (let i = 0; i < k; i += 1) {
      // Correctif K1 (relecture de Codex du 26/11) : une boîte ABÎMÉE (99,
      // un texte, une case qui manque) n'est pas une étoile perdue. Cette
      // copie ne sait plus rien de cette étoile : son compteur vaut 0, et à
      // la fusion toute copie valide passe devant (avant, la boîte lue 0
      // gagnait à compteur égal, et l'étoile partait).
      if (entier(boites[i], 0, SEUILS.revision.boites, -1) < 0) {
        ligne.x[i] = 0; ligne.ar[i] = 0; ligne.r[i] = 0; ligne.g[i] = 0;
      }
      if (ligne.b[i]) {
        // Gagnée : une échéance (abîmée ou absente : le jour de la
        // relecture, elle revient tout de suite) ; plus rien d'arrêté ni de
        // tenté. `q` : le jour de son premier calcul faux tant que le 2e
        // attend (pour que le 2e calcul soit un AUTRE calcul, même la page
        // rechargée entre les deux).
        // Correctif P1 (relecture de Codex du 27/11) : une échéance plus
        // d'un an après le plus long délai d'une boîte (une date abîmée, le
        // 31/12/9999) ne peut venir d'aucun geste : l'étoile revient tout de
        // suite, au lieu de ne plus jamais revenir. (Un an de marge : une
        // horloge d'appareil en avance, des tests qui jouent des mois
        // d'avance, ne la font pas revenir plus tôt.)
        ligne.e[i] = dateOuNull(echeances[i]) || jour;
        if (ligne.e[i] > ajouterJours(jour, DELAI_MAX + 365)) ligne.e[i] = jour;
        ligne.ar[i] = 0; ligne.r[i] = 0;
        ligne.q[i] = ligne.x[i] & X_SECOND ? rates[i] : null;
      } else {
        // Pas tenue : rien du retour ; l'échéance ne vaut que pour une
        // étoile « à voir en classe » (3 arrêts) ; le jour du dernier « Je
        // tente » raté ne vaut que s'il y en a eu un.
        // (Lot P1 : ni sorte ratée.)
        ligne.x[i] = 0;
        ligne.e[i] = arretsDe(ligne, i) >= SEUILS.apprends.arrets ? retourBorne(echeances[i], jour) : null;
        ligne.q[i] = ligne.r[i] ? rates[i] : null;
        // Jamais perdue et pas tenue : elle n'a jamais été gagnée (une
        // étoile ne quitte ses boîtes qu'en se perdant, et `pe` monte). Un
        // jour d'entrée resté là est incohérent (une copie abîmée) : écarté —
        // Mon espace comptait « +1 étoile cette semaine » sur une étoile
        // jamais tenue. Gagnée puis perdue, elle garde son jour d'entrée.
        if (!ligne.pe[i]) ligne.d[i] = null;
      }
      // Solide un jour : seulement une étoile déjà gagnée un jour.
      if (!ligne.d[i] && !ligne.b[i]) ligne.s[i] = null;
    }
    if (brut.c && typeof brut.c === "object" && !Array.isArray(brut.c)) {
      Object.keys(brut.c).filter(cause => /^\d{1,2}$/.test(cause)).sort((x, y) => Number(x) - Number(y))
        .slice(0, SEUILS.causes).forEach(cause => {
          const compte = entier(brut.c[cause], 1, SEUILS.compteur);
          if (compte) ligne.c[String(Number(cause))] = compte;
        });
    }
    return ligne;
  }

  function normaliserPlan(brut) {
    const liste = Array.isArray(brut) ? brut : [];
    const plan = PLAN_MAX.map((maximum, index) => entier(liste[index], 0, maximum));
    // Les minutes : 10 ou 15, sinon 0 (lu 10).
    if (!SEUILS.seance.minutes.includes(plan[PLAN.minutes])) plan[PLAN.minutes] = 0;
    // Une séance fermée n'a ni paquet ni étape.
    if (plan[PLAN.ouverte] !== 1) return planVide();
    if (!plan[PLAN.paquet]) plan[PLAN.obligatoire] = 0;
    return plan;
  }

  // La version d'une progression brute (relecture de Codex du 22/11, B1 et
  // G5) : un ENTIER de 1 à 999, un vrai nombre — sinon 0, « illisible ».
  // Une version absente, en texte ou fractionnaire (10,5) n'est JAMAIS prise
  // pour une version ancienne à reprendre.
  function versionDe(brut) {
    const version = brut && typeof brut === "object" && !Array.isArray(brut) ? brut.version : null;
    return typeof version === "number" && Number.isInteger(version) && version >= 1 && version <= 999 ? version : 0;
  }

  // Écrite par une page PLUS RÉCENTE que ce moteur : rien n'en est lu, rien
  // n'en est fusionné ni enregistré par-dessus (B1). Une version au-delà de
  // 999 (le serveur la refuse) compte comme plus récente, elle aussi.
  function tropRecente(brut) {
    const version = brut && typeof brut === "object" && !Array.isArray(brut) ? brut.version : null;
    return typeof version === "number" && Number.isInteger(version) && version > VERSION;
  }

  // Lot K1b : une progression de VERSION 12, reprise en version 13 (les
  // règles sont en haut du fichier). Rend un objet brut au format de la
  // version 13, que normaliserParcours relit ensuite comme n'importe quel
  // autre ; `brut` n'est pas modifié. Elle ne dépend que de la copie lue et
  // du jour de la relecture : deux appareils qui reprennent la même copie
  // obtiennent la même chose, et reprendre puis fusionner donne ce que donne
  // fusionner puis reprendre — sauf pour `quarts`, le remplissage gardé de
  // la ceinture en cours (G9), qui n'est qu'un souvenir de l'écran : la
  // fusion en garde le plus haut.
  const PAR_ETOILE_12 = Object.freeze(["b", "e", "a", "x", "r", "q", "pe", "d", "s", "ar", "g"]);
  function reprendreVersion12(brut, aujourdhui) {
    const modules = {};
    const source = brut.modules && typeof brut.modules === "object" && !Array.isArray(brut.modules) ? brut.modules : {};
    CODES.forEach(id => {
      if (!Object.prototype.hasOwnProperty.call(source, id)) return;
      const avant = COUPE_K1B.niveaux[id];
      if (!avant) { modules[id] = source[id]; return; }
      // La ligne relue AVEC SES NIVEAUX D'AVANT : une liste plus longue (une
      // copie trafiquée) ne devient pas les étoiles neuves.
      const ligne = normaliserModule(id, source[id], aujourdhui, avant);
      const neuve = moduleVide(id);
      neuve.vu = ligne.vu;
      neuve.c = ligne.c;
      PAR_ETOILE_12.forEach(cle => { for (let i = 0; i < avant; i += 1) neuve[cle][i] = ligne[cle][i]; });
      COUPE_K1B.moities[id].forEach(([bas, haut]) => {
        // Le compteur suit toujours (c'est lui qui départage deux appareils :
        // les deux moitiés doivent départager pareil). Jamais gagnée : rien
        // d'autre ne passe à la moitié du haut.
        // Correctif K1b : il reste dans l'étage « reporté d'avant » (4 999
        // au plus) — un geste fait en version 13 sur la moitié du haut passe
        // toujours devant (marquer).
        const herite = Math.min(COMPTEUR_HERITE_MAX, ligne.g[bas]);
        neuve.g[haut] = herite;
        if (!ligne.b[bas] && !ligne.d[bas]) return;
        PAR_ETOILE_12.forEach(cle => { neuve[cle][haut] = ligne[cle][bas]; });
        neuve.g[haut] = herite;
        // Un J'apprends ne se partage pas ; le 2e calcul qui attend reste à
        // la moitié du bas (celle du haut revient avec un premier calcul).
        neuve.ar[haut] = 0;
        neuve.x[haut] &= X_RATE;
        if (ligne.b[bas]) neuve.q[haut] = null;
      });
      modules[id] = neuve;
    });
    const quatre = SEUILS.ceintures.nombre - 2;
    const ceintures = normaliserDates(brut.ceintures, quatre);
    const tests = normaliserDates(brut.paliers, quatre);
    const quarts = normaliserListe(brut.quarts, quatre, SEUILS.ceintures.quarts - 1);
    // Les ceintures des trois étages nés des bases.
    let trois = [ceintures[0], ceintures[0], ceintures[0]];
    if (!ceintures[0]) {
      trois = [null, null, null];
      for (let etage = 0; etage < COUPE_K1B.etages.length; etage += 1) {
        const jours = COUPE_K1B.etages[etage].map(cle => {
          const [id, numero] = cle.split("-");
          const ligne = Object.prototype.hasOwnProperty.call(modules, id) ? normaliserModule(id, modules[id], aujourdhui) : null;
          return ligne && ligne.b[numero - 1] > 0 ? ligne.d[numero - 1] : null;
        });
        // (Dans l'ordre : une ceinture ne se donne pas au-dessus d'un étage
        // pas fini. Une étoile tenue sans jour d'entrée connu : pas de jour
        // pour la ceinture, la prochaine étape jouée la donnera.)
        if (jours.some(jour => !jour)) break;
        trois[etage] = jours.slice().sort().pop();
      }
    }
    // G9 — la ceinture qui se remplit ne recule pas. Ce que l'élève voyait
    // sur la ceinture des bases (ses étoiles tenues sur les 44 d'avant, ou
    // le remplissage déjà gardé s'il était plus haut) est gardé pour la
    // ceinture qu'il remplit maintenant : le premier des trois étages pas
    // encore gagné. Les deux autres partent de leur compte. (Sans cela, un
    // élève qui a gagné d'abord les tables et les fractions verrait un quart
    // devenir zéro : 12 étoiles sur 44, puis 2 sur 14.) Le compte, lui, dit
    // toujours vrai ; une ceinture ne se gagne que par ses étoiles.
    const nes = [0, 0, 0];
    const enCours = trois.findIndex(jour => !jour);
    if (enCours >= 0) {
      const hautes = new Set(Object.keys(COUPE_K1B.moities).flatMap(id => COUPE_K1B.moities[id].map(([, haut]) => `${id}-${haut + 1}`)));
      const avant = COUPE_K1B.etages.flat().filter(cle => !hautes.has(cle));
      const tenues = avant.filter(cle => {
        const [id, numero] = cle.split("-");
        const ligne = Object.prototype.hasOwnProperty.call(modules, id) ? normaliserModule(id, modules[id], aujourdhui) : null;
        return Boolean(ligne && ligne.b[numero - 1] > 0);
      }).length;
      const vu = tenues === avant.length ? 0 : Math.floor(SEUILS.ceintures.quarts * tenues / avant.length);
      nes[enCours] = Math.min(SEUILS.ceintures.quarts - 1, Math.max(quarts[0], vu));
    }
    return Object.assign({}, brut, {
      version: VERSION_13, modules,
      ceintures: [...trois, ...ceintures.slice(1)],
      paliers: [tests[0], tests[0], tests[0], ...tests.slice(1)],
      quarts: [...nes, ...quarts.slice(1)]
    });
  }

  // `aujourdhui` : le jour de la relecture (les dates de repli et les bornes
  // se calculent sur lui).
  // Une progression d'une AUTRE version que la nôtre :
  //  - de version 12 : REPRISE en version 13, sans rien perdre (lot K1b,
  //    reprendreVersion12) ;
  //  - plus ancienne (2 à 11) ou de version illisible : elle repart de zéro
  //    (aucun élève n'avait joué avant la version 12). Son époque
  //    est gardée : une version restaurée par le professeur, ou une remise à
  //    zéro, gagne toujours en bloc ; le prénom (un visiteur sans code) aussi ;
  //  - plus récente : rendue vide, elle aussi — l'appelant (charger,
  //    recevoir, sauver) ne l'utilise pas et passe en lecture seule.
  // Correctif du lot « la 6e complète » (relecture de Codex du 28/11) : les
  // étoiles qu'une page de version 14 (ou plus ancienne) ne pouvait PAS
  // jouer — les dix étoiles neuves de La 6e. Une copie ancienne qui porte
  // quelque chose à ces places (une copie abîmée ou trafiquée : aucun geste
  // n'a pu l'écrire) ne donne pas d'étoile : ces places repartent vides.
  //  - `modules` : les modules qui n'avaient aucun niveau jouable avant (leur
  //    ligne entière repart vide, niveaux réservés compris) ;
  //  - F11 : sa troisième case seulement, et les causes de « Une fraction
  //    d'un nombre » (7, 8, 9), qu'aucune page ancienne ne pouvait compter.
  const NEUVES_15 = Object.freeze({modules: Object.freeze(["D10", "D11", "D12", "D14", "F10", "P1", "P2", "D16"]), F11: 2, causesF11: Object.freeze(["7", "8", "9"])});
  // (Une progression ne porte que les modules touchés : un module absent est
  // vide.)
  function viderNeuves15(parcours) {
    NEUVES_15.modules.forEach(id => { delete parcours.modules[id]; });
    const ligne = parcours.modules.F11;
    if (!ligne) return;
    const vide = moduleVide("F11");
    Object.keys(vide).forEach(champ => { if (Array.isArray(vide[champ])) ligne[champ][NEUVES_15.F11] = vide[champ][NEUVES_15.F11]; });
    NEUVES_15.causesF11.forEach(cause => { delete ligne.c[cause]; });
  }

  function normaliserParcours(brut, {aujourdhui = jourLocal()} = {}) {
    const parcours = creerParcours();
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return parcours;
    if (tropRecente(brut)) return parcours;
    parcours.prenom = nettoyerPrenom(brut.prenom);
    // Correctif K1 (relecture de Codex du 26/11) : une version ILLISIBLE
    // (« 12 » en texte, absente) n'est pas une remise à zéro — son époque ne
    // vaut rien. Avant, cette copie vide gardait son époque, et une époque
    // plus haute effaçait en bloc le travail valide de l'autre appareil.
    if (!versionDe(brut)) return parcours;
    parcours.epoque = entier(brut.epoque, 0, 1000000);
    const jour = dateOuNull(aujourdhui) || jourLocal();
    const xMax = versionDe(brut) === VERSION || versionDe(brut) === VERSION_14 ? X_MAX : X_RATE + X_SECOND;
    const ancienne = versionDe(brut) !== VERSION;
    if (versionDe(brut) === VERSION_REPRISE) brut = reprendreVersion12(brut, jour);
    else if (versionDe(brut) !== VERSION && versionDe(brut) !== VERSION_14 && versionDe(brut) !== VERSION_13) return parcours;
    if (brut.modules && typeof brut.modules === "object" && !Array.isArray(brut.modules)) {
      CODES.forEach(id => {
        if (!Object.prototype.hasOwnProperty.call(brut.modules, id)) return;
        parcours.modules[id] = normaliserModule(id, brut.modules[id], jour, NIVEAUX[id], xMax);
      });
    }
    if (ancienne) viderNeuves15(parcours);
    const seance = brut.seance && typeof brut.seance === "object" && !Array.isArray(brut.seance) ? brut.seance : {};
    parcours.seance = {
      jour: dateOuNull(seance.jour),
      etape: entier(seance.etape, 0, SEUILS.seance.etapes),
      n: entier(seance.n, 0, SEUILS.compteur),
      i: entier(seance.i, 0, IDENTITE_MAX),
      g: entier(seance.g, 0, SEUILS.compteur),
      p: normaliserPlan(seance.p),
      j: enCoursVide(),
      parts: []
    };
    // Une séance ouverte a un jour et une identité ; sinon elle est fermée.
    if (parcours.seance.p[PLAN.ouverte] === 1 && (!parcours.seance.jour || !parcours.seance.i)) parcours.seance.p = planVide();
    const rangees = normaliserSeancesEtJournal(brut.seances, brut.journal);
    parcours.seances = rangees.seances;
    parcours.journal = rangees.journal;
    // Correctif K1 : une séance ouverte que le journal dit finie (le même
    // jour, la même identité : close sur un autre appareil) est finie.
    if (parcours.seance.p[PLAN.ouverte] === 1 && seanceAuJournal(parcours, parcours.seance.jour, parcours.seance.i)) parcours.seance.p = planVide();
    if (parcours.seance.p[PLAN.ouverte] !== 1) { parcours.seance.etape = 0; parcours.seance.i = 0; parcours.seance.g = 0; }
    // Ce que la séance ouverte a fait : rien quand elle n'est pas ouverte.
    // Ses parts font foi ; `j` seul (une copie sans parts) devient la part
    // d'une source pas connue.
    if (parcours.seance.p[PLAN.ouverte] === 1) {
      let groupes = lireParts(seance.parts);
      if (!groupes.length && Array.isArray(seance.j)) groupes = lireParts([0, ...EN_COURS_MAX.map((_, index) => seance.j[index])]);
      poserParts(parcours.seance, groupes);
    }
    parcours.jours = normaliserJours(brut.jours);
    parcours.ceintures = normaliserDates(brut.ceintures, SEUILS.ceintures.nombre);
    parcours.paliers = normaliserDates(brut.paliers, SEUILS.ceintures.nombre);
    parcours.quarts = normaliserListe(brut.quarts, SEUILS.ceintures.nombre, SEUILS.ceintures.quarts - 1);
    return parcours;
  }

  function definirPrenom(parcours, prenom) {
    const copie = normaliserParcours(parcours);
    copie.prenom = nettoyerPrenom(prenom);
    return copie;
  }

  // « Recommencer à zéro » : tout s'efface, l'époque monte — à la fusion,
  // l'époque la plus haute gagne en bloc, l'ancien travail ne revient pas.
  function remettreAZero(parcours) {
    const neuf = creerParcours();
    neuf.epoque = normaliserParcours(parcours).epoque + 1;
    return neuf;
  }

  function estVide(parcours) {
    return !parcours.prenom && !Object.keys(parcours.modules).length && !parcours.seances.length && !parcours.jours.length;
  }

  // La ligne d'un module, pour la LIRE (ligneAChanger pour l'écrire). Un
  // module jamais touché rend toujours la même ligne vide, gelée : la carte
  // la demande des centaines de fois par écran.
  const LIGNES_VIDES = new Map();
  function ligneVide(id) {
    let ligne = LIGNES_VIDES.get(id);
    if (!ligne) {
      ligne = moduleVide(id);
      Object.keys(ligne).forEach(cle => { if (ligne[cle] && typeof ligne[cle] === "object") Object.freeze(ligne[cle]); });
      Object.freeze(ligne);
      LIGNES_VIDES.set(id, ligne);
    }
    return ligne;
  }
  function ligneDe(parcours, id) {
    return parcours.modules[id] || ligneVide(id);
  }

  function noterJour(parcours, date) {
    const jour = dateOuNull(date);
    if (jour && !parcours.jours.includes(jour)) parcours.jours = normaliserJours([...parcours.jours, jour]);
  }

  // Une ligne de module posée dans la copie. Un module qui entre pour la
  // première fois prend sa place dans l'ordre des codes, comme à la
  // relecture (normaliserParcours, fusionner) : le même parcours s'écrit
  // toujours avec le même JSON (sinon la page croit avoir à renvoyer).
  function poserLigne(copie, id, ligne) {
    const nouveau = !Object.prototype.hasOwnProperty.call(copie.modules, id);
    copie.modules[id] = ligne;
    if (!nouveau) return;
    const ranges = {};
    CODES.forEach(code => { if (Object.prototype.hasOwnProperty.call(copie.modules, code)) ranges[code] = copie.modules[code]; });
    copie.modules = ranges;
  }

  // La ligne d'un module, prête à être changée dans la copie : posée, et son
  // jour `vu` mis à aujourd'hui.
  function ligneAChanger(copie, id, aujourdhui) {
    const ligne = copie.modules[id] || moduleVide(id);
    poserLigne(copie, id, ligne);
    ligne.vu = aujourdhui;
    return ligne;
  }

  // ------------------------------------------------------ la carte et les étoiles
  //
  // `carte` : ce que rend CORE.carte() — les modules (ce qui est construit,
  // le palier et le type de chaque niveau), l'ordre du parcours, une étoile
  // après l'autre (« A1-1 », « A1-2 », …), les LIGNES de chaque étage
  // ([{etage, nom, cles}]) et les liens « d'abord » ({étoile: étoile à gagner
  // avant}). L'ÉTAGE d'une étoile est le palier de son niveau. Seules les
  // étoiles des modules construits sont sur la carte.
  function normaliserCarte(carte) {
    if (Array.isArray(carte)) return {modules: carte, ordre: carte.flatMap(f => Array.from({length: f.niveaux || 0}, (_, i) => `${f.id}-${i + 1}`)), lignes: [], dabord: {}};
    if (carte && typeof carte === "object") {
      return {modules: Array.isArray(carte.modules) ? carte.modules : [], ordre: Array.isArray(carte.ordre) ? carte.ordre : [],
        lignes: Array.isArray(carte.lignes) ? carte.lignes : [], dabord: carte.dabord && typeof carte.dabord === "object" ? carte.dabord : {}};
    }
    return {modules: [], ordre: [], lignes: [], dabord: {}};
  }

  function ficheCarte(carte, id) {
    return normaliserCarte(carte).modules.find(fiche => fiche.id === id) || null;
  }

  function construits(carte) {
    return normaliserCarte(carte).modules.filter(fiche => fiche.construit && Object.prototype.hasOwnProperty.call(NIVEAUX, fiche.id));
  }

  // Le palier d'une compétence (0 : pas dans la carte) et son type.
  function palierDe(carte, id, niveau) {
    const fiche = ficheCarte(carte, id);
    return fiche && Array.isArray(fiche.paliers) ? entier(fiche.paliers[niveau - 1], 0, 9) : fiche ? entier(fiche.palier, 0, 9) : 0;
  }

  function typeDe(carte, id, niveau) {
    const fiche = ficheCarte(carte, id);
    return fiche && Array.isArray(fiche.types) && fiche.types[niveau - 1] === "F" ? "F" : "P";
  }

  // L'ordre du parcours restreint aux modules construits : [{module, niveau}].
  function parcoursConstruit(carte) {
    const {ordre} = normaliserCarte(carte);
    const ids = new Set(construits(carte).map(fiche => fiche.id));
    const liste = [];
    ordre.forEach(cle => {
      const [id, numero] = String(cle).split("-");
      const niveau = Number(numero);
      if (ids.has(id) && Number.isInteger(niveau) && niveau >= 1 && niveau <= NIVEAUX[id]) liste.push({module: id, niveau});
    });
    return liste;
  }

  // Le PLAN de la carte, calculé une fois par carte : pour chaque étoile,
  // son étage, sa ligne, l'étoile d'avant dans sa ligne, ses liens
  // « d'abord » ; les lignes de chaque étage ; les étoiles de chaque étage,
  // dans l'ordre. Une étoile que la table des lignes oublie (une carte de
  // test, un niveau ajouté sans sa ligne) reçoit une ligne à elle, au nom de
  // son module : elle reste jouable. Un lien « d'abord » qui sort de l'étage
  // ou qui remonte l'ordre de la carte est ignoré.
  const PLANS = new WeakMap();
  function planDeCarte(carte) {
    const cleCache = carte && typeof carte === "object" ? carte : null;
    if (cleCache && PLANS.has(cleCache)) return PLANS.get(cleCache);
    const c = normaliserCarte(carte);
    const etoiles = new Map();
    const ordre = [];
    parcoursConstruit(carte).forEach(({module: id, niveau}) => {
      const etage = palierDe(carte, id, niveau);
      const cle = `${id}-${niveau}`;
      if (!etage || etage > SEUILS.ceintures.nombre || etoiles.has(cle)) return;
      const etoile = {cle, module: id, niveau, index: niveau - 1, etage, rang: ordre.length, type: typeDe(carte, id, niveau),
        ligne: -1, nomLigne: "", place: 0, avant: null, dabord: []};
      etoiles.set(cle, etoile);
      ordre.push(etoile);
    });
    const lignes = [];
    const poser = (etage, nom, cles) => {
      const liste = cles.map(cle => etoiles.get(cle)).filter(e => e && e.etage === etage && e.ligne < 0).sort((x, y) => x.rang - y.rang);
      if (!liste.length) return;
      const ligne = {etage, nom: String(nom || ""), etoiles: liste};
      liste.forEach((etoile, place) => {
        etoile.ligne = lignes.length; etoile.nomLigne = ligne.nom; etoile.place = place; etoile.avant = place ? liste[place - 1].cle : null;
      });
      lignes.push(ligne);
    };
    c.lignes.forEach(l => { if (l && Array.isArray(l.cles)) poser(entier(l.etage, 0, 9), l.nom, l.cles.map(String)); });
    // Les étoiles sans ligne : une ligne par module et par étage.
    const sans = new Map();
    ordre.filter(e => e.ligne < 0).forEach(e => {
      const cle = `${e.etage} ${e.module}`;
      if (!sans.has(cle)) sans.set(cle, {etage: e.etage, nom: e.module, cles: []});
      sans.get(cle).cles.push(e.cle);
    });
    sans.forEach(l => poser(l.etage, l.nom, l.cles));
    Object.keys(c.dabord).forEach(cle => {
      const etoile = etoiles.get(cle);
      const liens = Array.isArray(c.dabord[cle]) ? c.dabord[cle] : [c.dabord[cle]];
      if (!etoile) return;
      liens.forEach(lien => {
        const avant = etoiles.get(String(lien));
        if (avant && avant.etage === etoile.etage && avant.rang < etoile.rang && avant.cle !== etoile.avant && !etoile.dabord.includes(avant.cle)) etoile.dabord.push(avant.cle);
      });
    });
    const etages = [];
    for (let n = 1; n <= SEUILS.ceintures.nombre; n += 1) {
      const liste = ordre.filter(e => e.etage === n);
      etages.push({etage: n, etoiles: liste, lignes: lignes.filter(l => l.etage === n)});
    }
    const plan = {etoiles, ordre, lignes, etages};
    if (cleCache) PLANS.set(cleCache, plan);
    return plan;
  }

  const etoilesDeLEtage = (plan, etage) => (plan.etages[etage - 1] ? plan.etages[etage - 1].etoiles : []);

  // ------------------------------------------------- l'état d'une étoile

  // Tenue : l'étoile est gagnée, elle est dans les boîtes.
  const tenue = (ligne, index) => ligne.b[index] > 0;
  // Gagnée un jour : sa date `d` ne s'efface jamais.
  const dejaGagnee = (ligne, index) => Boolean(ligne.d[index]);
  // Quelque chose a été fait sur cette étoile : elle ne se referme plus.
  const touchee = (ligne, index) => Boolean(ligne.b[index] || ligne.d[index] || ligne.ar[index] || ligne.r[index]);

  // Une étoile « à voir en classe » (3 J'apprends arrêtés) attend son jour
  // de retour : elle ne se joue pas d'ici là. `aujourdhui` : le jour de la
  // séance.
  function enAttente(ligne, index, aujourdhui) {
    return !ligne.b[index] && arretsDe(ligne, index) >= SEUILS.apprends.arrets && Boolean(ligne.e[index]) && ligne.e[index] > aujourdhui;
  }

  // « À voir en classe » (pour l'élève et pour la page du professeur) :
  //  - une étoile pas tenue dont J'apprends s'est arrêté 3 fois (lot F4), ou
  //    qui a été perdue 3 fois (l'élève qui gagne, perd et regagne en
  //    boucle) ;
  //  - une étoile tenue, perdue 3 fois, tant qu'elle n'est pas solide.
  function aVoirEnClasse(ligne, index) {
    const perdues = ligne.pe[index] >= SEUILS.retour.perdues;
    if (!ligne.b[index]) return perdues || arretsDe(ligne, index) >= SEUILS.apprends.arrets;
    return perdues && ligne.b[index] < SEUILS.revision.su;
  }

  // Une étoile est PASSÉE quand celle d'après peut s'ouvrir : elle a été
  // gagnée un jour (perdue depuis, elle ne referme rien) ; ou elle est « à
  // voir en classe » après 3 arrêts et sa première semaine d'attente est
  // finie (un 4e arrêt n'a pu arriver qu'après) — la ligne ne reste jamais
  // bloquée.
  function passee(ligne, index, aujourdhui) {
    if (dejaGagnee(ligne, index) || tenue(ligne, index)) return true;
    const arrets = arretsDe(ligne, index);
    if (arrets < SEUILS.apprends.arrets) return false;
    return arrets > SEUILS.apprends.arrets || !ligne.e[index] || ligne.e[index] <= aujourdhui;
  }

  // La PORTE d'un étage : ouverte quand toutes les étoiles de l'étage d'en
  // dessous ont été gagnées un jour — une étoile « à voir en classe » ne la
  // bloque pas (elle retient seulement la ceinture). Rien de ce qui est
  // ouvert ne se referme : une ceinture déjà gagnée, un test de ceinture déjà
  // joué ou une étoile déjà touchée dans l'étage le gardent ouvert, même si
  // une étoile d'en dessous se perd ou si une copie plus ancienne revient.
  // Lot P1 (choix de Gwenaël du 26/11 : « on ouvre tout ») : il n'y a plus de
  // porte — tout étage qui a des étoiles est ouvert dès le premier jour.
  // C'est le réglage du professeur (« jusqu'où va l'appli ») qui borne ce
  // qui se montre, et l'ordre dans une ligne qui borne ce qui se joue.
  function porteOuverte(parcours, plan, etage) {
    return etage >= 1 && etage <= SEUILS.ceintures.nombre && etoilesDeLEtage(plan, etage).length > 0;
  }

  // Lot P1 — l'ordre dans lequel « Continuer » parcourt les étages : du bas
  // vers le haut, pour tous (choix de Gwenaël du 27/11 : pas de classe de
  // l'élève ; « D'où part « Continuer » », un réglage du professeur : lot K2).
  function ordreDesEtages(reglage) {
    const haut = Math.min(SEUILS.ceintures.nombre, reglage);
    const liste = [];
    for (let etage = 1; etage <= haut; etage += 1) liste.push(etage);
    return liste;
  }


  // L'étoile qui tient celle-ci fermée (sa clé), ou null : celle d'avant
  // dans sa ligne d'abord, puis ses liens « d'abord ».
  function fermeePar(parcours, plan, etoile, aujourdhui) {
    const pasPassee = cle => {
      const autre = plan.etoiles.get(cle);
      return Boolean(autre) && !passee(ligneDe(parcours, autre.module), autre.index, aujourdhui);
    };
    if (etoile.avant && pasPassee(etoile.avant)) return etoile.avant;
    return etoile.dabord.find(pasPassee) || null;
  }

  // L'état d'une étoile, pour l'élève — TROIS dessins (choix de Gwenaël du
  // 22/11) : `fermee` (un cadenas), `aGagner` (une étoile vide), `gagnee`
  // (une étoile pleine). Le reste se dit dans le panneau de l'étoile et sert
  // à « Continuer » :
  //   visible       son étage est dans le réglage du professeur ;
  //   dabord        fermée : l'étoile à gagner d'abord (« Fermée. D'abord :
  //                 … ») ; null quand c'est la porte de l'étage qui est fermée ;
  //   aRegagner     pas tenue, mais déjà gagnée un jour (« Tu l'avais gagnée.
  //                 Regagne ton étoile. ») ;
  //   enCours       un J'apprends commencé (« On reprend là où tu en
  //                 étais. »), `reprise` : 1 au dessin, 2 sans aide ;
  //   aVoir         « à voir en classe » ; `attend` : le jour où elle se
  //                 rejoue (null : elle se joue) ;
  //   tente         "" « Je tente » permis ; "aujourdhui" : déjà tenté et
  //                 raté aujourd'hui ; "ferme" : raté deux fois, fermé pour
  //                 de bon (« Ce calcul, on l'apprend ensemble. ») ;
  //   actions       ce que le panneau propose : {tente, apprends, entraine} ;
  //   boite, solide, due (elle revient aujourd'hui), second (son 2e calcul
  //   attend), premierRetour (gagnée sans leçon, jamais revenue : son
  //   retour montre un exemple résolu) — pour une étoile gagnée.
  // `prof` (le mode professeur) : toutes les étoiles sont ouvertes.
  function etatDe(parcours, plan, etoile, aujourdhui, reglage, prof = false) {
    const ligne = ligneDe(parcours, etoile.module);
    const i = etoile.index;
    const visible = etoile.etage <= reglage;
    const base = {cle: etoile.cle, module: etoile.module, niveau: etoile.niveau, etage: etoile.etage, ligne: etoile.nomLigne, place: etoile.place,
      type: etoile.type, visible, boite: ligne.b[i], solide: ligne.b[i] >= SEUILS.revision.su, dejaGagnee: dejaGagnee(ligne, i) || tenue(ligne, i),
      aVoir: aVoirEnClasse(ligne, i), dabord: null, aRegagner: false, enCours: false, reprise: 0, attend: null, tente: "",
      due: false, second: false, premierRetour: false, actions: {tente: false, apprends: false, entraine: false}};
    if (tenue(ligne, i)) {
      // (Lot P1 : `premierRetour` reste lu par la page du professeur, mais
      // plus aucun exemple ne se montre à un premier retour.)
      return Object.assign(base, {etat: "gagnee", due: ligne.e[i] <= aujourdhui, second: Boolean(ligne.x[i] & X_SECOND),
        premierRetour: !ligne.a[i], actions: {tente: false, apprends: false, entraine: visible || prof}});
    }
    const porte = prof || (visible && porteOuverte(parcours, plan, etoile.etage));
    const bloque = prof || !porte || touchee(ligne, i) ? null : fermeePar(parcours, plan, etoile, aujourdhui);
    if (!porte || bloque) return Object.assign(base, {etat: "fermee", dabord: bloque});
    const attend = enAttente(ligne, i, aujourdhui) ? ligne.e[i] : null;
    // (Fermé « aujourd'hui » : raté CE jour-là, à l'égalité — une date d'un
    // autre jour, même à venir sur une horloge fausse, ne ferme rien.)
    const tente = ligne.r[i] >= SEUILS.tente.essais ? "ferme" : ligne.r[i] && ligne.q[i] === aujourdhui ? "aujourdhui" : "";
    return Object.assign(base, {etat: "aGagner", aRegagner: dejaGagnee(ligne, i), enCours: ligne.ar[i] > 0 && !attend, reprise: repriseDe(ligne, i),
      attend, tente, actions: {tente: !attend && !tente, apprends: !attend, entraine: false}});
  }

  function etatEtoile(parcours, carte, id, niveau, {aujourdhui = jourLocal(), palier = SEUILS.seance.paliers, prof = false} = {}) {
    const plan = planDeCarte(carte);
    const etoile = plan.etoiles.get(`${id}-${niveau}`);
    if (!etoile) return null;
    return etatDe(normaliserParcours(parcours, {aujourdhui}), plan, etoile, aujourdhui, palierDeSeance(palier), prof);
  }

  // Une étoile gagnée sans leçon (par « Je tente » ou par un test de
  // ceinture) et jamais revenue depuis : son premier retour dans Mes calculs
  // du jour montre un exemple résolu avant une écriture que la leçon montre
  // (lot C3 ; la page sait laquelle). `a` passe à 1 quand la leçon est faite
  // ou quand ce premier retour est passé.
  function premierRetourSansLecon(parcours, id, niveau) {
    if (!parcours || !parcours.modules || !Object.prototype.hasOwnProperty.call(NIVEAUX, id)) return false;
    const ligne = parcours.modules[id];
    const index = Number(niveau) - 1;
    if (!ligne || !Array.isArray(ligne.b) || !Array.isArray(ligne.a) || !(index >= 0 && index < NIVEAUX[id])) return false;
    return ligne.b[index] > 0 && !ligne.a[index];
  }

  // Les étoiles par étage (tenues, solides, total) et par couleur. (La page
  // du professeur lit `sues` : les solides, et `entrees` : les tenues.)
  function compter(parcours, carte) {
    const paliers = new Map();
    const competences = {gris: 0, rouge: 0, bleu: 0, vert: 0};
    let modulesSus = 0;
    let modules = 0;
    normaliserCarte(carte).modules.filter(fiche => Object.prototype.hasOwnProperty.call(NIVEAUX, fiche.id)).forEach(fiche => {
      const ligne = ligneDe(parcours, fiche.id);
      let dansLaCarte = false;
      let tousSolides = true;
      ligne.b.forEach((boite, index) => {
        const palier = palierDe(carte, fiche.id, index + 1);
        if (!palier) return;
        dansLaCarte = true;
        const compte = paliers.get(palier) || {palier, sues: 0, entrees: 0, total: 0};
        compte.total += 1;
        if (boite) compte.entrees += 1;
        if (boite >= SEUILS.revision.su) compte.sues += 1;
        else tousSolides = false;
        paliers.set(palier, compte);
        competences[couleurDeBoite(boite)] += 1;
      });
      if (dansLaCarte) {
        modules += 1;
        if (tousSolides) modulesSus += 1;
      }
    });
    const liste = [...paliers.values()].sort((x, y) => x.palier - y.palier);
    return {
      paliers: liste,
      sues: liste.reduce((s, p) => s + p.sues, 0),
      entrees: liste.reduce((s, p) => s + p.entrees, 0),
      total: liste.reduce((s, p) => s + p.total, 0),
      modulesSus,
      modules,
      competences
    };
  }

  // ------------------------------------------------------------ les ceintures
  //
  // Une ceinture par étage — jaune (les bases), orange (CM1), verte (CM2),
  // bleue (vers la 6e) ; tout le monde part en ceinture blanche. Lot K1
  // (choix de Gwenaël du 21/11, 20 h 53) : la ceinture d'un étage est gagnée
  // quand TOUTES ses étoiles sont tenues en même temps (plus « toutes
  // solides ») ; une étoile « à voir en classe » ne bloque pas la porte de
  // l'étage suivant, mais elle retient la ceinture. Les ceintures se gagnent
  // dans l'ordre, jamais au-delà du réglage du professeur, et une ceinture
  // gagnée ne se reprend JAMAIS.
  // La ceinture de l'étage en cours se remplit de sa couleur QUART PAR QUART
  // (choix de Gwenaël du 22/11), « 17 étoiles sur 44 » à côté. Une étoile
  // perdue fait reculer le compte, donc parfois un quart ; un CHANGEMENT DE
  // CARTE (des étoiles ajoutées à un étage), jamais (relecture de Codex du
  // 22/11, G9) : `quarts` garde, par étage, le remplissage que l'élève avait
  // avant le changement (voir garderRemplissage), et l'écran ne montre
  // jamais moins.

  // Les étoiles d'un étage : [{module, niveau, ligne}].
  function competencesDuPalier(parcours, carte, palier) {
    return etoilesDeLEtage(planDeCarte(carte), palier).map(e => ({module: e.module, niveau: e.niveau, ligne: ligneDe(parcours, e.module)}));
  }

  // Donne les ceintures que les étoiles méritent (dans l'ordre, à la suite
  // de celles déjà gagnées). Modifie `copie` ; rend les étages gagnés.
  // `aujourdhui` null (une ceinture complétée par la fusion de deux
  // appareils) : son jour est le plus récent des jours où ses étoiles ont
  // été gagnées — le même, quel que soit l'appareil qui fusionne, et quand.
  function gagnerCeintures(copie, carte, aujourdhui, palierMax = SEUILS.seance.paliers) {
    const gagnees = [];
    if (!carte) return gagnees;
    const plan = planDeCarte(carte);
    const jusqua = Math.min(SEUILS.ceintures.nombre, palierDeSeance(palierMax));
    for (let etage = 1; etage <= jusqua; etage += 1) {
      if (copie.ceintures[etage - 1]) continue;
      const liste = etoilesDeLEtage(plan, etage);
      // (Lot P1 : chaque ceinture se gagne à part — un étage pas fini ne
      // retient plus celles d'au-dessus.)
      if (!liste.length || !liste.every(e => tenue(ligneDe(copie, e.module), e.index))) continue;
      const jour = aujourdhui || liste.map(e => ligneDe(copie, e.module).d[e.index]).filter(Boolean).sort().pop();
      // (Aucun jour d'entrée connu : la prochaine étape jouée la donnera.)
      if (!jour) continue;
      copie.ceintures[etage - 1] = jour;
      gagnees.push(etage);
    }
    return gagnees;
  }

  // Les quarts remplis de la ceinture d'un étage (0 à 4) : ce que les
  // étoiles tenues donnent, jamais moins que ce qu'un changement de carte a
  // demandé de garder ; 4 seulement quand tout est tenu.
  function quartsDe(parcours, plan, etage) {
    const liste = etoilesDeLEtage(plan, etage);
    if (!liste.length) return {etoiles: 0, total: 0, quarts: 0};
    const etoiles = liste.filter(e => tenue(ligneDe(parcours, e.module), e.index)).length;
    const calcule = Math.floor(SEUILS.ceintures.quarts * etoiles / liste.length);
    const garde = etoiles === liste.length ? calcule : Math.min(SEUILS.ceintures.quarts - 1, entier(parcours.quarts[etage - 1], 0, SEUILS.ceintures.quarts - 1));
    return {etoiles, total: liste.length, quarts: Math.max(calcule, garde)};
  }

  // Un changement de carte (G9) : à appeler par la reprise d'une version
  // quand des étoiles ont été ajoutées à un étage, ou retirées. Pour chaque
  // étage, le remplissage que l'élève voyait avec `carteAvant` est gardé
  // dans `quarts` (jamais moins que ce qui y était déjà) : l'écran ne
  // recule pas. Rend une copie.
  function garderRemplissage(parcours, carteAvant, {aujourdhui = jourLocal()} = {}) {
    const copie = normaliserParcours(parcours, {aujourdhui});
    const plan = planDeCarte(carteAvant);
    for (let etage = 1; etage <= SEUILS.ceintures.nombre; etage += 1) {
      const avant = Math.min(SEUILS.ceintures.quarts - 1, quartsDe(copie, plan, etage).quarts);
      copie.quarts[etage - 1] = Math.max(copie.quarts[etage - 1], avant);
    }
    return copie;
  }

  // Où en est l'élève : la ceinture qu'il porte (0 blanche, 1 jaune…, 4
  // bleue), la prochaine (null : plus rien à gagner jusqu'au réglage du
  // professeur), et pour la prochaine : ses étoiles tenues sur combien
  // (« 17 étoiles sur 44 »), ses quarts remplis (0 à 3). `barrettes`,
  // `solides` et `unJour` : ce que lisent encore la page du professeur et
  // la tuile de Mon espace (les quarts, les étoiles tenues, les étoiles
  // gagnées un jour).
  // Lot P1 : les ceintures sont une COLLECTION. `porte` : la plus haute
  // ceinture gagnée (0 : aucune) ; `gagnees` : combien ; `prochaine` : la
  // ceinture que l'élève remplit — la première pas gagnée dans l'ordre de
  // « Continuer » (ordreDesEtages : du bas vers le haut).
  function etatCeintures(parcours, carte, palierMax = SEUILS.seance.paliers) {
    const p = normaliserParcours(parcours);
    const plan = planDeCarte(carte);
    const dates = p.ceintures.slice();
    const jusqua = palierDeSeance(palierMax);
    let porte = 0;
    dates.forEach((date, index) => { if (date && index < jusqua) porte = index + 1; });
    const gagnees = dates.filter((date, index) => date && index < jusqua).length;
    const suivante = ordreDesEtages(jusqua).find(etage => !dates[etage - 1] && etoilesDeLEtage(plan, etage).length) || 0;
    const liste = suivante ? etoilesDeLEtage(plan, suivante) : [];
    if (!liste.length) {
      return {porte, gagnees, dates, prochaine: null, etoiles: 0, quarts: 0, barrettes: 0, solides: 0, unJour: 0, total: 0,
        fini: true};
    }
    const q = quartsDe(p, plan, suivante);
    const quarts = Math.min(SEUILS.ceintures.quarts - 1, q.quarts);
    const unJour = liste.filter(e => dejaGagnee(ligneDe(p, e.module), e.index)).length;
    return {porte, gagnees, dates, prochaine: suivante, etoiles: q.etoiles, quarts, barrettes: Math.min(SEUILS.ceintures.barrettes, quarts),
      solides: q.etoiles, unJour, total: q.total, fini: false};
  }

  // (Lot P1 : « Tente toute la ceinture » a disparu — choix de Gwenaël du
  // 26/11 : « on va laisser mes élèves valider leurs 6 calculs ».)

  // ------------------------------------------------------- la carte de l'élève

  // Tout ce que la carte montre, étage par étage : la porte, la ceinture
  // (gagnée ou en train de se remplir), « Tente toute la ceinture », les
  // lignes et l'état de chaque étoile. Les étages au-delà du réglage du
  // professeur ne sont pas rendus (`prof` : le mode professeur, tout est
  // ouvert et tout est rendu).
  // Lot P1 : `courant` : l'étage où l'élève travaille (le premier, du bas,
  // qui a encore une étoile à gagner).
  function carteEleve(parcours, carte, {aujourdhui = jourLocal(), palier = SEUILS.seance.paliers, prof = false} = {}) {
    const p = normaliserParcours(parcours, {aujourdhui});
    const plan = planDeCarte(carte);
    const reglage = prof ? SEUILS.ceintures.nombre : palierDeSeance(palier);
    const etages = plan.etages.filter(e => e.etoiles.length && e.etage <= reglage).map(({etage, lignes}) => {
      const q = quartsDe(p, plan, etage);
      return {
        etage,
        ouvert: prof || porteOuverte(p, plan, etage),
        ceinture: p.ceintures[etage - 1],
        etoiles: q.etoiles, total: q.total, quarts: p.ceintures[etage - 1] ? SEUILS.ceintures.quarts : Math.min(SEUILS.ceintures.quarts - 1, q.quarts),
        lignes: lignes.map(l => ({nom: l.nom, etoiles: l.etoiles.map(e => etatDe(p, plan, e, aujourdhui, reglage, prof))}))
      };
    });
    // L'étage où l'élève travaille : dans l'ordre de « Continuer », le
    // premier qui a encore une étoile à gagner (le premier quand tout est
    // gagné).
    const ordre = ordreDesEtages(reglage).map(n => etages.find(e => e.etage === n)).filter(Boolean);
    const courant = ordre.find(e => e.etoiles < e.total) || ordre[0] || null;
    return {etages, courant: courant ? courant.etage : 0,
      etoiles: etages.reduce((s, e) => s + e.etoiles, 0), total: etages.reduce((s, e) => s + e.total, 0),
      ceintures: etages.filter(e => e.ceinture).length};
  }

  // -------------------------------------------------------- Mes calculs du jour
  //
  // Ce qui est DÛ : les étoiles tenues dont l'échéance est arrivée, dans le
  // réglage du professeur — une étoile gagnée dans un étage que le réglage
  // ne montre plus garde son étoile, mais ne revient pas tant que le réglage
  // ne remonte pas (relecture de Codex du 22/11, G8). L'ordre : l'étoile
  // dont le 2e calcul attend d'abord (G2 : il est reposé, même si la page a
  // été fermée entre les deux, même sur un autre appareil) ; puis les plus
  // anciennes (l'échéance, puis la boîte la plus basse, puis l'ordre de la
  // carte).
  function etoilesDues(parcours, plan, aujourdhui, reglage) {
    const dues = [];
    plan.ordre.forEach(etoile => {
      if (etoile.etage > reglage) return;
      const ligne = parcours.modules[etoile.module];
      if (!ligne || !tenue(ligne, etoile.index) || !ligne.e[etoile.index] || ligne.e[etoile.index] > aujourdhui) return;
      const second = Boolean(ligne.x[etoile.index] & X_SECOND);
      dues.push({etoile, echeance: ligne.e[etoile.index], boite: ligne.b[etoile.index], second, premierLe: second ? ligne.q[etoile.index] : null, sorte: sorteDe(ligne, etoile.index)});
    });
    return dues.sort((p, q) => Number(q.second) - Number(p.second) || (p.echeance < q.echeance ? -1 : p.echeance > q.echeance ? 1 : 0)
      || p.boite - q.boite || p.etoile.rang - q.etoile.rang);
  }

  // Le paquet à jouer maintenant : `maximum` étoiles dues au plus (10 par
  // défaut ; dans une séance qui a un paquet en cours, ce qu'il en reste).
  // [{module, niveau, du: true, second, premierLe, premierRetour}] —
  // `second` : c'est son 2e calcul qui est attendu (un calcul d'une autre
  // sorte que le premier ; `premierLe` : le jour où le premier a été posé,
  // pour que la page le retrouve) ; `premierRetour` : un exemple résolu
  // d'abord (lot C3).
  function tirerCalculsDuJour(parcours, carte, {aujourdhui = jourLocal(), palier = SEUILS.seance.paliers, maximum = null} = {}) {
    const p = normaliserParcours(parcours, {aujourdhui});
    const dues = etoilesDues(p, planDeCarte(carte), aujourdhui, palierDeSeance(palier));
    const enCours = seanceOuverte(p, aujourdhui) ? p.seance.p[PLAN.paquet] : 0;
    const nombre = Number.isInteger(maximum) && maximum > 0 ? maximum : enCours || SEUILS.jour.paquet;
    // Lot P1 : plus d'exemple résolu avant un premier retour (`premierRetour`
    // vaut toujours false : l'élève se souvient, il ne recopie pas) ; `sorte` :
    // la sorte du calcul à poser (celle qui a été ratée la dernière fois, ou
    // au premier calcul de ce retour ; 0 : au choix de la page).
    return dues.slice(0, nombre).map(c => ({module: c.etoile.module, niveau: c.etoile.niveau, du: true, second: c.second, premierLe: c.premierLe, premierRetour: false, sorte: c.sorte}));
  }

  // Combien d'étoiles sont dues (« Mes calculs du jour : encore 14 »), et
  // combien ont 3 jours de retard ou plus.
  function compterDues(parcours, plan, aujourdhui, reglage) {
    const dues = etoilesDues(parcours, plan, aujourdhui, reglage);
    const limite = ajouterJours(aujourdhui, -SEUILS.jour.retard);
    return {dues: dues.length, enRetard: dues.filter(c => c.echeance <= limite).length};
  }

  // ------------------------------------------------------------------ la séance

  function aujourdhuiFinie(parcours, aujourdhui) {
    return parcours.seances.includes(aujourdhui);
  }

  // Une séance est ouverte quand elle a été commencée aujourd'hui et qu'elle
  // n'est pas finie. Celle de la veille ne compte plus.
  function seanceOuverte(parcours, aujourdhui = jourLocal()) {
    return parcours.seance.jour === aujourdhui && parcours.seance.p[PLAN.ouverte] === 1;
  }

  // Le temps actif de la séance ouverte, en secondes (0 si elle ne l'est pas).
  function secondesDeSeance(parcours, aujourdhui) {
    return seanceOuverte(parcours, aujourdhui) ? parcours.seance.j[EN_COURS.secondes] : 0;
  }

  // Une séance change : son compteur monte (la fusion de deux appareils
  // garde la séance la plus avancée, voir fusionner). Il repart de 1 à
  // chaque séance ouverte.
  function marquerSeance(copie) {
    copie.seance.g = Math.min(SEUILS.compteur, copie.seance.g + 1);
  }

  // L'identité d'une séance qui s'ouvre : 1 à 9 999. `alea` (un nombre de 0
  // à 1, pour les tests et le simulateur) ; sinon le hasard du poste.
  function identiteNeuve(alea) {
    const tirage = typeof alea === "number" && alea >= 0 && alea < 1 ? alea : Math.random();
    return 1 + Math.floor(tirage * IDENTITE_MAX);
  }

  // Ouvre une séance neuve dans la copie. Le premier paquet de Mes calculs
  // du jour est le passage obligé de la PREMIÈRE séance du jour (une 2e
  // séance ne les refait pas : ce qui reste dû se joue par le bouton « Mes
  // calculs du jour : encore N »).
  function ouvrir(copie, plan, aujourdhui, minutes, reglage, alea) {
    // Une séance laissée ouverte un autre jour : elle se ferme et compte
    // pour son jour, si elle a fait quelque chose.
    // (Correctif K1 : le temps seul compte aussi, dès une minute — deux
    // minutes d'un J'apprends quitté avant la fin disparaissaient le
    // lendemain.)
    if (copie.seance.p[PLAN.ouverte] === 1 && copie.seance.jour !== aujourdhui) {
      if (seanceAFaitQuelqueChose(copie.seance)) fermer(copie, copie.seance.jour);
    }
    const p = planVide();
    p[PLAN.ouverte] = 1;
    p[PLAN.minutes] = minutesDeSeance(minutes);
    const dues = aujourdhuiFinie(copie, aujourdhui) ? 0 : compterDues(copie, plan, aujourdhui, reglage).dues;
    if (dues) { p[PLAN.obligatoire] = 1; p[PLAN.paquet] = Math.min(SEUILS.jour.paquet, dues); }
    // (Une identité déjà prise par une séance finie ce jour-là : la suivante.)
    let identite = identiteNeuve(alea);
    while (seanceAuJournal(copie, aujourdhui, identite)) identite = identite % IDENTITE_MAX + 1;
    copie.seance = {jour: aujourdhui, etape: 0, n: copie.seance.n, i: identite, g: 1, p, j: enCoursVide(), parts: []};
  }

  // Une séance ouverte qui a fait quelque chose compte pour son jour quand
  // elle est laissée là : une étape, un calcul du jour, ou au moins une
  // minute de travail (quelques secondes d'un écran ouvert puis quitté ne
  // font pas une séance au journal).
  function seanceAFaitQuelqueChose(seance) {
    return seance.etape > 0 || seance.j[EN_COURS.calculs] > 0 || seance.j[EN_COURS.secondes] >= SEUILS.journal.tempsSeul;
  }

  // « Commencer » : la séance est ouverte et rangée, pour qu'elle se
  // reprenne telle quelle le jour même, ici ou sur un autre appareil. Une
  // séance déjà ouverte aujourd'hui n'est pas touchée.
  // `minutes` et `palier` : les réglages du professeur.
  function ouvrirSeance(parcours, carte, {aujourdhui = jourLocal(), minutes = SEUILS.seance.defaut, palier = SEUILS.seance.paliers, alea = null} = {}) {
    const copie = normaliserParcours(parcours, {aujourdhui});
    if (seanceOuverte(copie, aujourdhui)) return copie;
    ouvrir(copie, planDeCarte(carte), aujourdhui, minutes, palierDeSeance(palier), alea);
    return copie;
  }

  // Ce qui reste du paquet en cours : jamais plus que ce qui est dû.
  function resteDuPaquet(parcours, plan, aujourdhui, reglage) {
    if (!seanceOuverte(parcours, aujourdhui) || !parcours.seance.p[PLAN.paquet]) return 0;
    return Math.min(parcours.seance.p[PLAN.paquet], compterDues(parcours, plan, aujourdhui, reglage).dues);
  }

  // Une étape de la carte peut-elle commencer ? La première d'une séance,
  // toujours ; ensuite, seulement si le temps actif plus sa durée habituelle
  // tient dans les minutes prévues, plus une minute (décision du lot K0 :
  // sans cela, un J'apprends lancé à la 9e minute s'arrêtait aussitôt et
  // comptait comme un arrêt). `action` : "tente", "apprends", "encore",
  // "ceinture".
  function tientDansLeTemps(parcours, action, aujourdhui) {
    if (!seanceOuverte(parcours, aujourdhui)) return true;
    const p = parcours.seance.p;
    if (!p[PLAN.commences]) return true;
    const duree = SEUILS.seance.durees[action] || SEUILS.seance.durees.tente;
    return parcours.seance.j[EN_COURS.secondes] + duree <= minutesDeSeance(p[PLAN.minutes]) * 60 + SEUILS.seance.tolerance;
  }

  // Le temps prévu est-il passé (sans la minute de tolérance) ? Passé, la
  // séance ne propose plus de paquet de Mes calculs du jour en plus (le
  // bouton « encore N » reste : c'est l'élève qui choisit).
  function tempsPasse(parcours, aujourdhui) {
    return seanceOuverte(parcours, aujourdhui) && parcours.seance.j[EN_COURS.secondes] >= minutesDeSeance(parcours.seance.p[PLAN.minutes]) * 60;
  }

  function peutCommencer(parcours, action, {aujourdhui = jourLocal()} = {}) {
    return tientDansLeTemps(normaliserParcours(parcours, {aujourdhui}), action, aujourdhui);
  }

  // « Continuer » : ce que la séance propose maintenant, recalculé à chaque
  // fois sur l'état des étoiles (jamais lu dans un plan : G6).
  //   {type: "paquet", calculs, raison}   Mes calculs du jour : "obligatoire"
  //        (le premier paquet, avant la carte), "encours" (un paquet
  //        commencé), "retard" (une étoile a 3 jours de retard : le paquet
  //        suivant passe avant une nouvelle étoile, décision du lot K0) ;
  //   {type: "etoile", module, niveau, action, raison, depart}   une étoile :
  //        "enCours" (le J'apprends commencé, `depart` : où il reprend),
  //        puis "aRegagner" (« D'abord : … »), puis "suivante" (la première
  //        étoile à gagner dans l'ordre de la carte, hors étoile « à voir en
  //        classe » qui attend). `action` : "apprends" pour un J'apprends
  //        commencé ou quand « Je tente » est fermé sur elle, sinon "tente"
  //        (le panneau de l'étoile propose toujours les deux quand ils sont
  //        permis) ;
  //   {type: "rien", toutGagne, prochainRetour}   plus rien à gagner (ou
  //        tout attend) : `prochainRetour`, dans combien de jours revient la
  //        prochaine étoile (« Tout est gagné. Tes étoiles reviennent dans 3
  //        jours. » ; null : aucune).
  // `sansPaquet` : l'étoile seulement (le but du jour, « Aujourd'hui :
  // l'étoile … »), sans regarder le temps de la séance — le but du jour ne
  // change pas parce que la séance avance.
  // Correctif K1 (relecture de Codex du 26/11) : dans une séance ouverte,
  // « Continuer » ne propose que ce qui TIENT ENCORE dans le temps — la
  // première étoile, dans l'ordre ci-dessus, dont l'action tient
  // (tientDansLeTemps). C'est la même sélection qui dit si la séance a
  // encore quelque chose à jouer (resteAFaire, `aFermer`). Avant, à 8 min
  // 20 après un « Je tente » raté, la séance restait ouverte (un « Je
  // tente » tenait encore), « Continuer » proposait le J'apprends de cette
  // étoile (4 minutes : il ne tenait plus), et la page fermait la séance
  // alors qu'une autre étoile pouvait encore se tenter. Quand il reste des
  // étoiles mais que plus rien ne tient : {type: "rien", tempsFini: true}.
  // Lot P1 : « Continuer » part du CP et monte (ordreDesEtages) ; dans un étage, ligne après
  // ligne, et dans une ligne dans l'ordre : tant qu'une ligne a une étoile à
  // jouer, « Continuer » y reste (il enchaîne les étoiles de la ligne).
  // Rendu en plus pour une étoile : `etage`, `ligne` (son nom) et
  // `resteLigne` (les étoiles encore à gagner dans cette ligne, elle
  // comprise) — « Aujourd'hui : 8 calculs du jour, puis la ligne Fractions ».
  function continuerSur(parcours, plan, aujourdhui, reglage, sansPaquet = false) {
    if (!sansPaquet) {
      const reste = resteDuPaquet(parcours, plan, aujourdhui, reglage);
      if (reste) return {type: "paquet", calculs: reste, raison: parcours.seance.p[PLAN.obligatoire] ? "obligatoire" : "encours"};
      const compte = compterDues(parcours, plan, aujourdhui, reglage);
      // Avant « Commencer » : le premier paquet de la première séance du jour.
      if (!seanceOuverte(parcours, aujourdhui) && !aujourdhuiFinie(parcours, aujourdhui) && compte.dues) return {type: "paquet", calculs: Math.min(SEUILS.jour.paquet, compte.dues), raison: "obligatoire"};
      if (compte.enRetard && !tempsPasse(parcours, aujourdhui)) return {type: "paquet", calculs: Math.min(SEUILS.jour.paquet, compte.dues), raison: "retard"};
    }
    let enCours = null;
    let aRegagner = null;
    let suivante = null;
    let aGagner = 0;
    let visibles = 0;
    let jouables = 0;
    // Un J'apprends commencé se reprend ; « Je tente » fermé sur l'étoile :
    // J'apprends ; sinon « Je tente ».
    const actionDe = etat => (etat.enCours || !etat.actions.tente ? "apprends" : "tente");
    const tient = etat => sansPaquet || tientDansLeTemps(parcours, actionDe(etat), aujourdhui);
    const restes = new Map();
    for (const etage of ordreDesEtages(reglage)) {
      for (const ligneCarte of plan.etages[etage - 1].lignes) {
        for (const etoile of ligneCarte.etoiles) {
          visibles += 1;
          const etat = etatDe(parcours, plan, etoile, aujourdhui, reglage);
          if (etat.etat !== "gagnee") { aGagner += 1; restes.set(ligneCarte, (restes.get(ligneCarte) || 0) + 1); }
          if (etat.etat !== "aGagner" || etat.attend) continue;
          jouables += 1;
          if (!tient(etat)) continue;
          etat.ligneCarte = ligneCarte;
          if (etat.enCours && !enCours) enCours = etat;
          else if (etat.aRegagner && !aRegagner) aRegagner = etat;
          else if (!suivante) suivante = etat;
        }
      }
    }
    let choisie = enCours || aRegagner || suivante;
    let raison = choisie === enCours ? "enCours" : choisie === aRegagner ? "aRegagner" : "suivante";
    // « Continuer » descend tout seul : l'étoile choisie a un « Je tente »
    // raté — d'abord l'étoile plus facile, si elle tient dans le temps (et
    // celle d'en dessous encore, si celle-là aussi a été ratée).
    // Une leçon arrêtée deux fois descend de la même façon (elle sera reprise
    // quand il n'y aura plus rien à jouer en dessous).
    const leconArretee = etat => etat === enCours && arretsDe(ligneDe(parcours, etat.module), etat.niveau - 1) >= SEUILS.continuer.arrets;
    if (SEUILS.continuer.descend && choisie && (choisie === suivante || leconArretee(choisie))) {
      for (let garde = 0; garde < SEUILS.ceintures.nombre; garde += 1) {
        const etoile = plan.etoiles.get(choisie.cle);
        if (!ligneDe(parcours, etoile.module).r[etoile.index] && !leconArretee(choisie)) break;
        // (Rien de plus facile dans sa famille — les décimaux du CM1 n'ont
        // rien en dessous : la première étoile qui se joue dans l'étage d'en
        // dessous le plus proche. Un élève très fragile redescend ainsi
        // jusqu'à ce qu'il sait faire, au lieu de buter sur une leçon.)
        const facile = etoilePlusFacile(parcours, plan, etoile, aujourdhui, reglage) || premiereEnDessous(parcours, plan, etoile, aujourdhui, reglage);
        if (!facile) break;
        const autre = plan.etoiles.get(`${facile.module}-${facile.niveau}`);
        const etat = etatDe(parcours, plan, autre, aujourdhui, reglage);
        if (!tient(etat)) break;
        etat.ligneCarte = plan.lignes[autre.ligne];
        choisie = etat;
        raison = "plusFacile";
      }
    }
    if (choisie) {
      return {type: "etoile", module: choisie.module, niveau: choisie.niveau, raison,
        action: actionDe(choisie), depart: choisie.reprise, etage: choisie.etage, ligne: choisie.ligne, resteLigne: restes.get(choisie.ligneCarte) || 1};
    }
    let prochain = null;
    plan.ordre.forEach(etoile => {
      const ligne = parcours.modules[etoile.module];
      if (etoile.etage > reglage || !ligne || !tenue(ligne, etoile.index) || !ligne.e[etoile.index]) return;
      if (!prochain || ligne.e[etoile.index] < prochain) prochain = ligne.e[etoile.index];
    });
    return {type: "rien", toutGagne: visibles > 0 && aGagner === 0, tempsFini: jouables > 0, prochainRetour: prochain ? Math.max(0, ecartJours(aujourdhui, prochain)) : null};
  }

  function continuer(parcours, carte, {aujourdhui = jourLocal(), palier = SEUILS.seance.paliers, sansPaquet = false} = {}) {
    const p = normaliserParcours(parcours, {aujourdhui});
    return continuerSur(p, planDeCarte(carte), aujourdhui, palierDeSeance(palier), sansPaquet);
  }

  // Reste-t-il quelque chose à faire dans la séance ouverte ? Du temps pour
  // la plus courte des étapes (« Je tente ») — ou la première étape de la
  // carte, toujours permise —, et de quoi le remplir : un paquet, une étoile
  // à gagner, ou un test de ceinture proposé.
  // (Correctif K1 : ce que « Continuer » propose est ce qui tient encore —
  // la même sélection, continuerSur.)
  function resteAFaire(parcours, plan, aujourdhui, reglage) {
    if (resteDuPaquet(parcours, plan, aujourdhui, reglage)) return true;
    if (continuerSur(parcours, plan, aujourdhui, reglage).type !== "rien") return true;
    if (!tientDansLeTemps(parcours, "tente", aujourdhui)) return false;
    return Boolean(compterDues(parcours, plan, aujourdhui, reglage).dues) && !tempsPasse(parcours, aujourdhui);
  }

  // Où en est la séance, pour l'accueil et la carte :
  //   ouverte, finies (les séances finies aujourd'hui), minutes, secondes ;
  //   obligatoire   les étoiles du premier paquet à jouer avant la carte
  //                 (« Avant : tes 6 calculs du jour. ») ; 0 : la carte ;
  //   paquet        ce qui reste d'un paquet commencé (obligatoire ou non) ;
  //   encore        les étoiles encore dues en plus (« Mes calculs du jour :
  //                 encore 14 ») ;
  //   continuer     ce que « Continuer » propose (voir continuer) ;
  //   but           le but du jour : l'étoile de « Continuer », sans paquet ;
  //   tempsPasse    plus assez de temps pour une étape de plus ;
  //   aFermer       une séance ouverte qui n'a plus rien à jouer (le temps
  //                 est passé pendant une étape quittée au milieu) : la page
  //                 appelle fermerSeance.
  function etatSeance(parcours, carte, {aujourdhui = jourLocal(), minutes = SEUILS.seance.defaut, palier = SEUILS.seance.paliers} = {}) {
    const p = normaliserParcours(parcours, {aujourdhui});
    const plan = planDeCarte(carte);
    const reglage = palierDeSeance(palier);
    const ouverte = seanceOuverte(p, aujourdhui);
    const compte = compterDues(p, plan, aujourdhui, reglage);
    const reste = resteDuPaquet(p, plan, aujourdhui, reglage);
    const premier = !ouverte && !aujourdhuiFinie(p, aujourdhui) ? Math.min(SEUILS.jour.paquet, compte.dues) : 0;
    const obligatoire = ouverte ? (p.seance.p[PLAN.obligatoire] ? reste : 0) : premier;
    const paquet = ouverte ? reste : premier;
    return {
      ouverte,
      finies: p.seances.filter(jour => jour === aujourdhui).length,
      minutes: ouverte ? minutesDeSeance(p.seance.p[PLAN.minutes]) : minutesDeSeance(minutes),
      secondes: secondesDeSeance(p, aujourdhui),
      etape: ouverte ? p.seance.etape : 0,
      obligatoire,
      paquet,
      encore: compte.dues - paquet,
      continuer: continuerSur(p, plan, aujourdhui, reglage, false),
      but: continuerSur(p, plan, aujourdhui, reglage, true),
      tempsPasse: ouverte && !tientDansLeTemps(p, "tente", aujourdhui),
      // Le temps prévu est passé : plus de paquet proposé en plus.
      tempsEcoule: tempsPasse(p, aujourdhui),
      aFermer: ouverte && !resteAFaire(p, plan, aujourdhui, reglage)
    };
  }

  // Une étape vient d'être jouée dans la séance : elle avance. Quand il ne
  // reste rien à faire (ou plus de temps), la séance est finie et comptée.
  // Une séance commencée hier et continuée après minuit continue : elle
  // compte pour le jour où elle finit. Sans séance ouverte, une séance
  // s'ouvre (la page appelle « Commencer » d'abord ; ceci est un filet).
  // `deCarte` : une étape de la carte (« Je tente », J'apprends, un test de
  // ceinture), qui compte pour « la première est toujours permise ».
  function avancerSeance(copie, plan, aujourdhui, reglage, deCarte) {
    if (copie.seance.p[PLAN.ouverte] !== 1) ouvrir(copie, plan, aujourdhui, SEUILS.seance.defaut, reglage, null);
    const s = copie.seance;
    s.jour = aujourdhui;
    s.etape = Math.min(SEUILS.seance.etapes, s.etape + 1);
    if (deCarte) s.p[PLAN.commences] = Math.min(PLAN_MAX[PLAN.commences], s.p[PLAN.commences] + 1);
    marquerSeance(copie);
    if (resteAFaire(copie, plan, aujourdhui, reglage)) return false;
    fermer(copie, aujourdhui);
    return true;
  }

  // La séance ouverte est finie : elle compte, et le plan se referme. Sa
  // ligne est écrite au journal, sous son identité.
  function fermer(copie, jour) {
    const fait = copie.seance.j.slice();
    const identite = copie.seance.i;
    copie.seance = {
      jour,
      etape: 0,
      n: Math.min(SEUILS.compteur, copie.seance.n + 1),
      i: 0,
      g: 0,
      p: planVide(),
      j: enCoursVide(),
      parts: []
    };
    const secondes = fait[EN_COURS.secondes];
    const entree = JOURNAL.map(() => -1);
    const poser = (champ, valeur) => { entree[JOURNAL.indexOf(champ)] = valeur; };
    poser("calculs", fait[EN_COURS.calculs]);
    poser("justes", fait[EN_COURS.justes]);
    poser("nouveautes", fait[EN_COURS.nouveautes]);
    poser("prouvees", fait[EN_COURS.prouvees]);
    poser("rouges", fait[EN_COURS.rouges]);
    poser("minutes", secondes ? Math.max(1, Math.min(SEUILS.journal.minutes, Math.round(secondes / 60))) : 0);
    poser("seuls", fait[EN_COURS.seuls]);
    poser("seulsJustes", fait[EN_COURS.seulsJustes]);
    poser("tests", fait[EN_COURS.tests]);
    poser("testsRates", fait[EN_COURS.testsRates]);
    const dejaFinies = pairesDe(copie);
    const propre = entreePropre(entree);
    propre[I_NUMERO] = numeroNeuf(dejaFinies, jour, propre, identite);
    const rangees = rangerSeances([...dejaFinies, {jour, entree: propre}]);
    copie.seances = rangees.seances;
    copie.journal = rangees.journal;
  }

  // Une séance ouverte qui n'a plus rien à jouer (`aFermer`), ou que l'élève
  // arrête lui-même (`force` : « Séance terminée » demandé par la page) : elle se
  // ferme et compte. Rien d'autre ne change.
  function fermerSeance(parcours, carte, {aujourdhui = jourLocal(), palier = SEUILS.seance.paliers, force = false} = {}) {
    const copie = normaliserParcours(parcours, {aujourdhui});
    if (!seanceOuverte(copie, aujourdhui)) return {parcours: copie, fermee: false};
    if (!force && resteAFaire(copie, planDeCarte(carte), aujourdhui, palierDeSeance(palier))) return {parcours: copie, fermee: false};
    fermer(copie, aujourdhui);
    return {parcours: copie, fermee: true};
  }

  // Le temps actif d'une étape (lot G1) : la page le mesure (les gestes de
  // l'élève, les silences comptés une minute au plus) et le donne à la fin
  // de chaque étape, AVANT d'appliquer l'étape (c'est sur lui que la séance
  // décide si elle continue). Il s'ajoute à la séance ouverte, et seulement
  // à elle.
  // `source` : l'onglet qui a mesuré ce temps (voir `seance.parts`).
  function noterTemps(parcours, secondes, {source = 0} = {}) {
    const copie = normaliserParcours(parcours);
    const ajout = entier(Math.round(Number(secondes)), 0, SEUILS.journal.secondes);
    if (copie.seance.p[PLAN.ouverte] !== 1 || !ajout) return copie;
    compterEnCours(copie, EN_COURS.secondes, ajout, source);
    marquerSeance(copie);
    return copie;
  }

  // Ajoute à ce que la séance ouverte a fait, dans la part de `source`
  // (l'onglet qui joue ; 0 : pas connue). Une 9e source ajoute à la dernière
  // part.
  function compterEnCours(parcours, index, ajout, source = 0) {
    if (parcours.seance.p[PLAN.ouverte] !== 1 || !ajout) return;
    const cle = entier(source, 0, SOURCE_MAX);
    const groupes = lireParts(parcours.seance.parts);
    let groupe = groupes.find(g => g.source === cle);
    if (!groupe && groupes.length >= PARTS_MAX) groupe = groupes[groupes.length - 1];
    if (!groupe) {
      groupe = {source: cle, valeurs: enCoursVide()};
      groupes.push(groupe);
    }
    // (Jamais plus que ce que la séance entière peut porter.)
    const place = EN_COURS_MAX[index] - (parcours.seance.j[index] - groupe.valeurs[index]);
    groupe.valeurs[index] = Math.max(groupe.valeurs[index], Math.min(place, groupe.valeurs[index] + ajout));
    poserParts(parcours.seance, groupes);
  }

  // Un paquet de Mes calculs du jour commence (le bouton « Mes calculs du
  // jour : encore N », ou le paquet que « Continuer » propose quand une
  // étoile a 3 jours de retard) : 10 étoiles dues au plus. Un paquet déjà en
  // cours n'est pas touché ; sans séance ouverte, elle s'ouvre.
  function commencerPaquet(parcours, carte, {aujourdhui = jourLocal(), palier = SEUILS.seance.paliers} = {}) {
    const copie = normaliserParcours(parcours, {aujourdhui});
    const plan = planDeCarte(carte);
    const reglage = palierDeSeance(palier);
    if (!seanceOuverte(copie, aujourdhui)) ouvrir(copie, plan, aujourdhui, minutesDeSeance(copie.seance.p[PLAN.minutes]), reglage, null);
    if (resteDuPaquet(copie, plan, aujourdhui, reglage)) return copie;
    const dues = compterDues(copie, plan, aujourdhui, reglage).dues;
    copie.seance.p[PLAN.paquet] = Math.min(SEUILS.jour.paquet, dues);
    copie.seance.p[PLAN.obligatoire] = 0;
    marquerSeance(copie);
    return copie;
  }

  // Le paquet en cours est fini (la page l'appelle quand elle n'a plus de
  // calcul à poser) : l'étape est faite. Ce qui n'a pas été joué reste dû —
  // rien ne se perd, rien n'est sanctionné. Rend `encore` : les étoiles
  // encore dues.
  function terminerCalculsDuJour(parcours, {aujourdhui = jourLocal(), carte = null, palier = SEUILS.seance.paliers} = {}) {
    const copie = normaliserParcours(parcours, {aujourdhui});
    const plan = planDeCarte(carte);
    const reglage = palierDeSeance(palier);
    const ceintures = gagnerCeintures(copie, carte, aujourdhui, reglage);
    // Sans séance ouverte, il n'y a pas d'étape à compter.
    if (copie.seance.p[PLAN.ouverte] !== 1) return {parcours: copie, finie: false, encore: compterDues(copie, plan, aujourdhui, reglage).dues, ceintures};
    copie.seance.p[PLAN.paquet] = 0;
    copie.seance.p[PLAN.obligatoire] = 0;
    const finie = avancerSeance(copie, plan, aujourdhui, reglage, false);
    return {parcours: copie, finie, encore: compterDues(copie, plan, aujourdhui, reglage).dues, ceintures};
  }

  // ---------------------------------------------------------- apprendre, s'entraîner

  // L'entraînement à longueur adaptée, calcul après calcul. `reponses` : les
  // premières réponses données, {juste, outil} où `outil` dit ce qui était
  // affiché pour ce calcul : "image" (la droite, le tableau), "manip" (les
  // perles, le glisse-nombres) ou "aucun". Options :
  //   genre             "apprends" (J'apprends en une étape, lot 2),
  //                     "entraine" (Je m'entraîne, l'écran d'un module du
  //                     professeur) ou "rattrape" (Je m'entraîne encore, une
  //                     compétence rouge) ;
  //   manip             false quand le niveau n'a pas d'outil à manipuler
  //                     (au-delà de 100 perles) : on commence à l'image ;
  //   toutesFormesVues  la page dit si toutes les écritures ont été vues.
  // Rend :
  //   outil    ce qu'il faut afficher pour le calcul SUIVANT ;
  //   reussi   Je m'entraîne : 5 justes de suite sans outil et toutes les
  //            écritures vues ; encore : 3 justes de suite sans outil ;
  //   fini     réussi, ou 25 calculs joués (encore : 20).
  // Je m'entraîne : l'outil à manipuler d'abord, 2 justes ; puis l'image,
  // 2 justes ; puis rien. Je m'entraîne encore : l'image d'abord, 2 justes,
  // puis rien. Une erreur fait revenir l'image, 2 erreurs de suite l'outil à
  // manipuler — qui laisse sa place à l'image dès un juste.
  // Lot F4 (18/11/2026, choix de Gwenaël) — J'apprends et Je m'entraîne :
  //  - réussi à 5 justes sur les 6 derniers calculs sans aide (la
  //    « fenêtre »), le dernier juste ; une erreur seule sans aide fait
  //    revenir le dessin pour UN calcul — juste, on repart sans aide et la
  //    fenêtre est gardée (ce calcul ne compte ni pour ni contre) ; deux
  //    erreurs de suite : l'outil (ou le dessin), et la fenêtre repart ;
  //  - J'apprends ne se rate plus : il s'arrête (`fini` sans `reussi`, et
  //    `arrete`) quand `tempsFini` (la page : la séance a passé son temps)
  //    et qu'il a déjà fait 4 calculs, au plus tard au bout de 25 calculs. `reprise` dit où il
  //    reprendra demain : sans aide (2) s'il y était, au dessin (1) sinon ;
  //  - `depart` : où il commence (0 normal, 1 au dessin, 2 sans aide), la
  //    reprise d'un J'apprends arrêté.
  // Je m'entraîne encore (« rattrape ») garde 3 justes de suite sans aide.
  function suivreEntrainement(reponses, {toutesFormesVues = true, genre = "entraine", manip = true, depart = 0, tempsFini = false} = {}) {
    const liste = Array.isArray(reponses) ? reponses.filter(Boolean) : [];
    const encore = genre === "rattrape";
    const apprends = genre === "apprends";
    const {avecOutil, erreurs, fenetre: tailleFenetre} = SEUILS.entraine;
    const sansOutil = encore ? SEUILS.rattrapage.sansOutil : SEUILS.entraine.sansOutil;
    const maximum = encore ? SEUILS.rattrapage.maximum : apprends ? SEUILS.apprends.maximum : SEUILS.entraine.maximum;
    const debut = encore ? 0 : entier(depart, 0, REPRISE.seul);
    let outil = encore ? "image" : debut === REPRISE.seul ? "aucun" : debut === REPRISE.dessin || !manip ? "image" : "manip";
    // L'outil à manipuler du début dure 2 justes ; celui qui revient après 2
    // erreurs, un seul.
    let manipDuDebut = outil === "manip";
    let justesAvecOutil = 0;
    let justesSansOutil = 0;
    let erreursDeSuite = 0;
    // Lot F4 : les réponses sans aide depuis le dernier retour en arrière
    // (true juste, false faux), et le dessin d'UN calcul après une erreur.
    let seuls = [];
    let rappelDessin = false;
    let seulAtteint = outil === "aucun";
    liste.forEach(reponse => {
      // Relecture 2b (11/11/2026) : l'image rendue au premier calcul d'une
      // écriture nouvelle est un rappel. Juste, il ne compte ni avec ni sans
      // outil (la suite de justes ne repart pas de zéro) ; faux, c'est une
      // erreur comme une autre.
      if (reponse.juste && reponse.rappel) return;
      if (encore) {
        // Correctif F4 (point 11) : comme avant le lot F4 — deux erreurs de
        // suite rendent l'outil à manipuler (s'il y en a un), qui laisse sa
        // place au dessin dès un juste.
        if (reponse.juste) {
          erreursDeSuite = 0;
          if (reponse.outil === "aucun") justesSansOutil += 1;
          else { justesAvecOutil += 1; justesSansOutil = 0; }
          if (outil === "manip") outil = "image";
          else if (outil === "image" && justesAvecOutil >= avecOutil) { outil = "aucun"; justesAvecOutil = 0; }
        } else {
          erreursDeSuite += 1;
          justesAvecOutil = 0;
          justesSansOutil = 0;
          outil = erreursDeSuite >= erreurs && manip ? "manip" : "image";
        }
        return;
      }
      if (reponse.juste) {
        erreursDeSuite = 0;
        if (rappelDessin) { rappelDessin = false; outil = "aucun"; return; }
        if (reponse.outil === "aucun") { seuls.push(true); seulAtteint = true; }
        else { justesAvecOutil += 1; seuls = []; }
        // Les perles du début : 2 justes, puis l'image (2 justes à elle) ;
        // celles d'après 2 erreurs : un juste, puis l'image, qui part au 2e
        // juste avec l'outil.
        if (outil === "manip" && manipDuDebut) {
          if (justesAvecOutil >= avecOutil) { outil = "image"; justesAvecOutil = 0; manipDuDebut = false; }
        } else if (outil === "manip") outil = "image";
        else if (outil === "image" && justesAvecOutil >= avecOutil) { outil = "aucun"; justesAvecOutil = 0; }
      } else {
        erreursDeSuite += 1;
        justesAvecOutil = 0;
        manipDuDebut = false;
        if (reponse.outil === "aucun") { seuls.push(false); seulAtteint = true; }
        // Une erreur seule, sans aide : le dessin pour un calcul, la fenêtre
        // est gardée. Deux de suite : on repart de l'outil (ou du dessin).
        if (erreursDeSuite === 1 && reponse.outil === "aucun") { rappelDessin = true; outil = "image"; return; }
        rappelDessin = false;
        seuls = [];
        outil = erreursDeSuite >= erreurs && manip ? "manip" : "image";
      }
    });
    // Réussi sur ce que l'élève a vraiment eu à l'écran : la dernière
    // réponse, juste et sans aide.
    const derniere = liste.filter(r => !(r.juste && r.rappel)).slice(-1)[0];
    const fenetre = seuls.slice(-tailleFenetre);
    const justesFenetre = fenetre.filter(Boolean).length;
    const reussi = encore
      ? justesSansOutil >= sansOutil
      : Boolean(derniere) && derniere.juste && derniere.outil === "aucun" && justesFenetre >= sansOutil && toutesFormesVues;
    const arrete = !reussi && (liste.length >= maximum || (apprends && tempsFini && liste.length >= SEUILS.apprends.avantArret));
    const justesDeSuite = encore ? justesSansOutil : justesFenetre;
    return {
      outil, reussi, fini: reussi || arrete, arrete,
      justes: liste.filter(r => r.juste).length, total: liste.length,
      // Correctif F4 (point 13) : `sur`, combien de calculs sans aide la
      // fenêtre compte (6 au plus) — le compteur dit « 4 justes sur 5 » des 5
      // derniers, jamais « 6 justes sur 5 ». (Je m'entraîne encore : les
      // justes de suite.)
      justesDeSuite, sur: encore ? justesSansOutil : fenetre.length, objectif: sansOutil,
      // Où reprend un J'apprends arrêté (lot F4).
      reprise: seulAtteint && (outil === "aucun" || rappelDessin) ? REPRISE.seul : REPRISE.dessin
    };
  }

  // Le verdict d'un entraînement fini : `reponses` = les premières réponses
  // {juste, outil}.
  function verdictEntrainement(reponses, options = {}) {
    const suivi = suivreEntrainement(reponses, options);
    return {justes: suivi.justes, total: suivi.total, reussi: suivi.reussi};
  }

  function ajouterCauses(ligne, causes) {
    Object.keys(causes || {}).forEach(cause => {
      if (!/^\d{1,2}$/.test(cause)) return;
      const cle = String(Number(cause));
      const ajout = entier(causes[cause], 0, SEUILS.compteur);
      if (!ajout) return;
      if (!ligne.c[cle] && Object.keys(ligne.c).length >= SEUILS.causes) return;
      ligne.c[cle] = Math.min(SEUILS.compteur, (ligne.c[cle] || 0) + ajout);
    });
  }

  // ------------------------------------------------- gagner, perdre une étoile

  // L'étoile change : son compteur monte d'un cran (c'est lui qui départage
  // deux appareils, étoile par étoile).
  // Correctif K1b : pour une MOITIÉ DU HAUT, le premier geste de la version
  // 13 fait repartir le compteur au-dessus de ce que la reprise a pu
  // reporter de la version 12 (5 001, puis 5 002…) — voir en tête. Le module
  // est demandé à chaque appel, et un module inconnu arrête tout : un geste
  // ajouté plus tard ne peut pas l'oublier sans qu'un test le dise.
  function marquer(id, ligne, index) {
    if (!Object.prototype.hasOwnProperty.call(NIVEAUX, id)) throw new TypeError("marquer : module inconnu");
    const depart = moitieDuHaut(id, index) ? Math.max(ligne.g[index], COMPTEUR_JOUE) : ligne.g[index];
    ligne.g[index] = Math.min(SEUILS.compteur, depart + 1);
  }

  // L'étoile est gagnée : elle entre dans les boîtes tout de suite (une
  // seule marque pour l'élève, choix de Gwenaël du 21/11) — en boîte 2,
  // retour le lendemain ; `duPremierCoup` (lot P1, choix de Gwenaël du
  // 27/11) : gagnée du premier coup à « Je tente », en boîte 4, premier
  // retour au bout de 7 jours. `lecon` : par J'apprends (sa leçon est faite).
  function gagner(id, ligne, index, aujourdhui, {lecon = false, duPremierCoup = false} = {}) {
    const boite = duPremierCoup ? SEUILS.revision.duPremierCoup : SEUILS.revision.entree;
    ligne.b[index] = boite;
    ligne.e[index] = echeanceDeBoite(boite, aujourdhui);
    ligne.x[index] = 0;
    ligne.ar[index] = 0;
    ligne.r[index] = 0;
    ligne.q[index] = null;
    if (!ligne.d[index]) ligne.d[index] = aujourdhui;
    if (boite >= SEUILS.revision.su && !ligne.s[index]) ligne.s[index] = aujourdhui;
    if (lecon) ligne.a[index] = 1;
    marquer(id, ligne, index);
  }

  // L'étoile est perdue : elle sort des boîtes et se regagne comme une
  // étoile à gagner (« Je tente », le jour même s'il veut, ou J'apprends ;
  // ses deux essais de « Je tente » repartent de zéro). Rien de ce qu'elle
  // avait ouvert ne se referme (`d` reste). Perdue 3 fois : « à voir en
  // classe ».
  function perdre(id, ligne, index) {
    ligne.b[index] = 0;
    ligne.e[index] = null;
    ligne.x[index] = 0;
    ligne.ar[index] = 0;
    ligne.r[index] = 0;
    ligne.q[index] = null;
    ligne.pe[index] = Math.min(SEUILS.retour.perdues, ligne.pe[index] + 1);
    marquer(id, ligne, index);
  }

  // Ce que rend une étape refusée : rien n'a changé. `refuse` dit pourquoi
  // ("inconnue" : pas sur la carte ; "fermee" ; "gagnee" ; "attend" : « à
  // voir en classe », pas encore revenue ; "tente" : « Je tente » fermé ;
  // "pasGagnee" ; "pasDue" ; "ceinture" : le test de ceinture n'est pas
  // proposé). Relecture de Codex du 22/11 (G1, G6) : à la remise d'une
  // étape, tout ce que vérifiait sa proposition est revérifié — une autre
  // copie a pu arriver entre-temps.
  const refus = (copie, raison, plus = {}) => Object.assign({parcours: copie, refuse: raison, evenements: [], finie: false, ceintures: []}, plus);

  // Une série finie, hors Mes calculs du jour. `serie` :
  //   {module, niveau, genre: "apprends" | "encore",
  //    reponses: [{juste, outil}], causes: {cause: nombre},
  //    manip, toutesFormesVues, tempsFini}
  // Avec `seance: true`, la série est une étape de la séance du jour.
  //  - apprends (J'apprends, lot F4 : on montre, puis l'élève fait, jusqu'à
  //    5 justes sur les 6 derniers sans aide) : sur une étoile À GAGNER.
  //    Réussi, l'étoile est gagnée, tout de suite, et sa leçon est faite ;
  //    arrêté (« On continue demain »), il garde où l'élève en est ; au 3e
  //    arrêt sur la même étoile, « à voir en classe » : elle attend 7 jours,
  //    l'étoile suivante de sa ligne aussi, les autres lignes restent
  //    ouvertes ;
  //  - encore (« Je m'entraîne encore ») : sur une étoile GAGNÉE, sans aucun
  //    effet sur les boîtes — s'entraîner ne fait perdre aucune étoile.
  //    (« entraine » et « rattrape », les anciens noms, sont lus « encore ».)
  // Une erreur ne fait JAMAIS rien perdre ici.
  function appliquerSerie(parcours, serie, {aujourdhui = jourLocal(), carte = null, seance = false, palier = SEUILS.seance.paliers, source = 0} = {}) {
    const copie = normaliserParcours(parcours, {aujourdhui});
    const plan = planDeCarte(carte);
    const reglage = palierDeSeance(palier);
    const id = serie && serie.module;
    const etoile = Object.prototype.hasOwnProperty.call(NIVEAUX, id) ? plan.etoiles.get(`${id}-${entier(serie.niveau, 1, NIVEAUX[id], 1)}`) : null;
    if (!etoile) return refus(copie, "inconnue", {verdict: null});
    const etat = etatDe(copie, plan, etoile, aujourdhui, reglage);
    const apprends = serie.genre === "apprends";
    if (apprends && etat.etat !== "aGagner") return refus(copie, etat.etat === "gagnee" ? "gagnee" : "fermee", {verdict: null});
    if (apprends && etat.attend) return refus(copie, "attend", {verdict: null});
    if (!apprends && etat.etat !== "gagnee") return refus(copie, "pasGagnee", {verdict: null});
    const n = etoile.niveau;
    const ligne = ligneAChanger(copie, id, aujourdhui);
    const evenements = [];
    const reponses = Array.isArray(serie.reponses) ? serie.reponses.filter(Boolean) : [];
    // Un J'apprends arrêté reprend là où il en était (le moteur le sait :
    // `ar`, jamais la page). Les règles de l'écran — le niveau a-t-il un
    // outil à manipuler (`manip`), toutes ses formes ont-elles été vues
    // (`toutesFormesVues`), le temps de la séance est-il passé
    // (`tempsFini`) — viennent de la page ; le résultat est calculé ici, une
    // fois, avec elles.
    const depart = apprends ? repriseDe(ligne, n - 1) : 0;
    const suivi = suivreEntrainement(reponses, {genre: apprends ? "apprends" : "rattrape", depart,
      manip: serie.manip !== false, toutesFormesVues: serie.toutesFormesVues !== false, tempsFini: serie.tempsFini === true});
    const verdict = {justes: suivi.justes, total: suivi.total, reussi: suivi.reussi};
    ajouterCauses(ligne, serie.causes);
    noterJour(copie, aujourdhui);
    if (apprends) {
      // Le journal : les calculs faits sans aide, et combien étaient justes
      // (le rappel au dessin d'une écriture nouvelle ne compte pas).
      const seuls = reponses.filter(r => r.outil === "aucun" && !r.rappel);
      if (seance) {
        compterEnCours(copie, EN_COURS.seuls, seuls.length, source);
        compterEnCours(copie, EN_COURS.seulsJustes, seuls.filter(r => r.juste).length, source);
      }
      if (verdict.reussi) {
        gagner(id, ligne, n - 1, aujourdhui, {lecon: true});
        evenements.push({type: "gagnee", module: id, niveau: n, par: "apprends"});
        if (seance) compterEnCours(copie, EN_COURS.nouveautes, 1, source);
      } else if (suivi.total) {
        const arrets = arretSuivant(arretsDe(ligne, n - 1));
        poserArret(ligne, n - 1, arrets, suivi.reprise);
        const deCote = arrets % SEUILS.apprends.arrets === 0;
        ligne.e[n - 1] = deCote ? ajouterJours(aujourdhui, SEUILS.apprends.joursDeCote) : arrets >= SEUILS.apprends.arrets ? ligne.e[n - 1] : null;
        marquer(id, ligne, n - 1);
        evenements.push({type: "arrete", module: id, niveau: n, reprise: suivi.reprise, arrets, aVoir: deCote, retour: deCote ? ligne.e[n - 1] : null});
      }
    }
    const ceintures = gagnerCeintures(copie, carte, aujourdhui, reglage);
    const finie = seance ? avancerSeance(copie, plan, aujourdhui, reglage, true) : false;
    return {parcours: copie, verdict, evenements, finie, ceintures};
  }

  // Correctif P1 (relecture de Codex du 27/11) : une leçon OUVERTE (« On te
  // montre » à l'écran) sur une étoile pas tenue — même quittée aussitôt,
  // sans réponse. `a` (« leçon faite ou déjà revenue ») passe à 1 : gagnée
  // ensuite à « Je tente », elle n'est plus « du premier coup » (elle
  // revient le lendemain, pas dans 7 jours). Rien d'autre ne change (ni
  // arrêt, ni compteur) ; une étoile tenue, ou déjà marquée, est rendue
  // telle quelle.
  function noterLeconCommencee(parcours, {module, niveau} = {}, {aujourdhui = jourLocal()} = {}) {
    const copie = normaliserParcours(parcours, {aujourdhui});
    if (!Object.prototype.hasOwnProperty.call(NIVEAUX, module)) return copie;
    const index = entier(niveau, 1, NIVEAUX[module], 1) - 1;
    const avant = ligneDe(copie, module);
    if (avant.b[index] || avant.a[index]) return copie;
    const ligne = ligneAChanger(copie, module, aujourdhui);
    ligne.a[index] = 1;
    return copie;
  }

  // ------------------------------------------------------------------ « Je tente »

  // « Je tente » joué. `tentative` : {module, niveau, reponses: [{juste, ms}],
  // causes}. Le compte est fait ICI, sur les réponses : 6 calculs au plus,
  // gagné à 5 justes avec un faux au plus ; pour un niveau « par cœur »
  // (type F), un calcul juste mais lent (plus de 5 s) deux fois de suite
  // compte faux. Gagnée : l'étoile entre au début des boîtes, elle revient
  // le lendemain. Ratée : « Je tente » est fermé sur cette étoile jusqu'au
  // lendemain ; ratée deux fois, pour de bon (elle ne propose plus que
  // J'apprends, jusqu'à ce qu'elle soit gagnée). Les autres étoiles ne sont
  // pas touchées.
  // Lot P1 : la vitesse ne refuse plus rien — `lents` compte seulement les
  // réponses justes mais lentes d'un niveau « par cœur » (une information).
  // Ratée : `plusFacile`, l'étoile à proposer juste en dessous (ou null).
  function appliquerTentative(parcours, tentative, {aujourdhui = jourLocal(), carte = null, seance = false, palier = SEUILS.seance.paliers, source = 0} = {}) {
    const copie = normaliserParcours(parcours, {aujourdhui});
    const plan = planDeCarte(carte);
    const reglage = palierDeSeance(palier);
    const id = tentative && tentative.module;
    const etoile = Object.prototype.hasOwnProperty.call(NIVEAUX, id) ? plan.etoiles.get(`${id}-${entier(tentative.niveau, 1, NIVEAUX[id], 1)}`) : null;
    const vide = {reussi: false, justes: 0, faux: 0, total: 0};
    if (!etoile) return refus(copie, "inconnue", vide);
    const etat = etatDe(copie, plan, etoile, aujourdhui, reglage);
    if (etat.etat !== "aGagner") return refus(copie, etat.etat === "gagnee" ? "gagnee" : "fermee", vide);
    if (etat.attend) return refus(copie, "attend", vide);
    if (!etat.actions.tente) return refus(copie, "tente", vide);
    const reponses = (Array.isArray(tentative.reponses) ? tentative.reponses.filter(Boolean) : []).slice(0, SEUILS.tente.calculs);
    if (!reponses.length) return refus(copie, "vide", vide);
    let justes = 0;
    let faux = 0;
    let lents = 0;
    reponses.forEach(reponse => {
      const juste = Boolean(reponse.juste);
      if (juste && etoile.type === "F" && Number(reponse.ms) > SEUILS.tente.lentMs) lents += 1;
      if (juste) justes += 1;
      else faux += 1;
    });
    const reussi = justes >= SEUILS.tente.justes && faux <= SEUILS.tente.fauxPermis;
    const n = etoile.niveau;
    const ligne = ligneAChanger(copie, id, aujourdhui);
    const evenements = [];
    ajouterCauses(ligne, tentative.causes);
    noterJour(copie, aujourdhui);
    if (reussi) {
      // Lot P1 — « une semaine après un « Je tente » réussi » (choix de
      // Gwenaël du 27/11) : du premier coup, c'est-à-dire jamais ratée à « Je
      // tente » (`r`), jamais perdue (`pe`), aucune leçon commencée ou
      // arrêtée dessus (`ar`) — elle revient au bout de 7 jours. Sinon, le
      // lendemain. L'appli regarde ce que l'élève a montré sur l'étoile.
      // Correctif P1 (relecture de Codex du 27/11) : une leçon OUVERTE puis
      // quittée sans réponse compte aussi (`a`, posé par
      // noterLeconCommencee) — avant, seul un arrêt avec des réponses
      // comptait.
      const duPremierCoup = !ligne.r[n - 1] && !ligne.pe[n - 1] && !ligne.ar[n - 1] && !ligne.a[n - 1];
      gagner(id, ligne, n - 1, aujourdhui, {duPremierCoup});
      evenements.push({type: "gagnee", module: id, niveau: n, par: "tente", duPremierCoup, retour: ligne.e[n - 1]});
      if (seance) compterEnCours(copie, EN_COURS.prouvees, 1, source);
    } else {
      ligne.r[n - 1] = Math.min(SEUILS.tente.essais, ligne.r[n - 1] + 1);
      ligne.q[n - 1] = aujourdhui;
      marquer(id, ligne, n - 1);
      evenements.push({type: "tenteRate", module: id, niveau: n, ferme: ligne.r[n - 1] >= SEUILS.tente.essais});
    }
    const ceintures = gagnerCeintures(copie, carte, aujourdhui, reglage);
    const finie = seance ? avancerSeance(copie, plan, aujourdhui, reglage, true) : false;
    return {parcours: copie, reussi, justes, faux, lents, total: reponses.length, evenements, finie, ceintures,
      plusFacile: reussi ? null : etoilePlusFacile(copie, plan, etoile, aujourdhui, reglage)};
  }

  // Lot P1 — « Plus facile : … » après un « Je tente » raté (pas de test de
  // positionnement : le diagnostic, c'est « Je tente »). L'étoile à jouer
  // juste en dessous : dans l'étage d'en dessous le plus proche, la ligne qui
  // tient le même module, sinon celle du même nom, sinon une ligne qui
  // partage un module avec la ligne de l'étoile ratée ; dans cette ligne, la
  // première étoile qui se joue. Rien de tel : null.
  function etoilePlusFacile(parcours, plan, etoile, aujourdhui, reglage) {
    const sienne = plan.lignes[etoile.ligne];
    const modules = new Set(sienne ? sienne.etoiles.map(e => e.module) : [etoile.module]);
    for (let etage = Math.min(etoile.etage - 1, reglage); etage >= 1; etage -= 1) {
      const note = l => (l.etoiles.some(e => e.module === etoile.module) ? 3 : l.nom === etoile.nomLigne ? 2 : l.etoiles.some(e => modules.has(e.module)) ? 1 : 0);
      const lignes = plan.etages[etage - 1].lignes.map((l, rang) => ({l, rang, note: note(l)})).filter(x => x.note).sort((x, y) => y.note - x.note || x.rang - y.rang);
      for (const {l} of lignes) {
        for (const autre of l.etoiles) {
          const etat = etatDe(parcours, plan, autre, aujourdhui, reglage);
          if (etat.etat === "aGagner" && !etat.attend) return {module: autre.module, niveau: autre.niveau, etage: autre.etage, ligne: autre.nomLigne};
        }
      }
    }
    return null;
  }

  // La première étoile qui se joue dans l'étage d'en dessous le plus proche
  // (ligne après ligne) : le repli de « Continuer » quand rien de plus facile
  // n'existe dans la famille de l'étoile ratée ET que l'élève tient moins de
  // la moitié des étoiles de l'étage juste en dessous.
  function premiereEnDessous(parcours, plan, etoile, aujourdhui, reglage) {
    const dessous = etoilesDeLEtage(plan, etoile.etage - 1);
    const tenues = dessous.filter(e => tenue(ligneDe(parcours, e.module), e.index)).length;
    const pasPret = arretsDe(ligneDe(parcours, etoile.module), etoile.index) >= SEUILS.continuer.arrets;
    if (!dessous.length || (!pasPret && tenues * SEUILS.continuer.partDessous >= dessous.length)) return null;
    for (let etage = Math.min(etoile.etage - 1, reglage); etage >= 1; etage -= 1) {
      for (const l of plan.etages[etage - 1].lignes) {
        for (const autre of l.etoiles) {
          const etat = etatDe(parcours, plan, autre, aujourdhui, reglage);
          if (etat.etat === "aGagner" && !etat.attend) return {module: autre.module, niveau: autre.niveau, etage: autre.etage, ligne: autre.nomLigne};
        }
      }
    }
    return null;
  }

  function plusFacile(parcours, carte, id, niveau, {aujourdhui = jourLocal(), palier = SEUILS.seance.paliers} = {}) {
    const plan = planDeCarte(carte);
    const etoile = plan.etoiles.get(`${id}-${niveau}`);
    return etoile ? etoilePlusFacile(normaliserParcours(parcours, {aujourdhui}), plan, etoile, aujourdhui, palierDeSeance(palier)) : null;
  }

  // -------------------------------------------------------- un retour

  // UNE réponse de Mes calculs du jour — le seul moment où une étoile peut
  // se perdre. `retour` : {module, niveau, juste, ms, cause}. L'étoile doit
  // être tenue et due.
  //  Le premier calcul :
  //  - juste : la boîte monte (7 au plus), nouvelle échéance ; pour un niveau
  //    « par cœur », juste mais lent (plus de 5 s) : elle ne monte pas et
  //    revient demain — une réponse lente ne fait jamais perdre l'étoile
  //    (décision du lot K0) ;
  //  - faux (ou « Je ne sais pas ») : RIEN ne bouge encore, un 2e calcul est
  //    attendu (`secondAVenir`). Il est noté sur l'étoile : la page fermée
  //    entre les deux, il sera reposé au retour de l'élève, ici ou sur un
  //    autre appareil, même si rien d'autre n'est dû (G2).
  //  Le 2e calcul :
  //  - juste : c'était un accident — rien ne bouge, elle revient demain ;
  //  - faux : le retour est raté, l'étoile part (voir SEUILS.retour) ; la
  //    correction se fait sur un écran, plus aucun réentraînement imposé.
  // Dans une séance ouverte, le paquet en cours avance d'une étoile quand
  // son retour est RÉGLÉ (pas après un premier calcul faux).
  // `mouvement` dit ce qui s'est passé : {module, niveau, avant, apres,
  // regle, secondAVenir, deuxieme, accident, rate, perdue, lent, monte,
  // sens, aVoir, jours}.
  function appliquerRetour(parcours, retour, {aujourdhui = jourLocal(), carte = null, source = 0} = {}) {
    const copie = normaliserParcours(parcours, {aujourdhui});
    const id = retour && retour.module;
    const evenements = [];
    if (!Object.prototype.hasOwnProperty.call(NIVEAUX, id)) return {parcours: copie, mouvement: null, evenements, refuse: "inconnue"};
    const index = entier(retour.niveau, 1, NIVEAUX[id], 1) - 1;
    const avant = ligneDe(copie, id);
    const boite = avant.b[index];
    if (!boite) return {parcours: copie, mouvement: null, evenements, refuse: "pasGagnee"};
    if (!avant.e[index] || avant.e[index] > aujourdhui) return {parcours: copie, mouvement: null, evenements, refuse: "pasDue"};
    // Correctif K1 (relecture de Codex du 26/11) : la page dit À QUEL calcul
    // l'élève répond (`deuxieme` : le premier, ou le 2e). Si l'étoile n'en
    // est pas là — un autre appareil a répondu entre-temps, et son état est
    // arrivé pendant que ce calcul était à l'écran —, la réponse est
    // périmée : rien ne change. `secondAVenir` dit alors si un 2e calcul
    // attend (la page le pose). Avant, une réponse fausse au PREMIER calcul,
    // donnée sur chaque appareil, comptait pour deux faux : l'étoile partait.
    // Correctif P1 (relecture de Codex du 27/11) : avec le 2e calcul, la
    // page dit aussi le jour où le PREMIER a été raté (`premierLe`, celui
    // qu'elle avait quand elle l'a posé). Un 2e calcul resté à l'écran
    // d'un retour déjà réglé ailleurs — et l'étoile ratée à nouveau, au
    // premier calcul du retour suivant — n'est plus pris pour le 2e calcul
    // de ce retour-là : il est périmé. Avant, un faux à ce vieux calcul
    // faisait partir l'étoile.
    const attendu = Boolean(avant.x[index] & X_SECOND);
    const autreRetour = retour.deuxieme === true && attendu && typeof retour.premierLe === "string" && retour.premierLe !== avant.q[index];
    if ((typeof retour.deuxieme === "boolean" && retour.deuxieme !== attendu) || autreRetour) {
      return {parcours: copie, evenements, refuse: "perime",
        mouvement: {module: id, niveau: index + 1, avant: boite, apres: boite, regle: false, perime: true, secondAVenir: attendu, deuxieme: attendu,
          premierLe: attendu ? avant.q[index] : null,
          accident: false, rate: false, perdue: false, lent: false, monte: false, sens: "reste", aVoir: false, jours: 0}};
    }
    const ligne = ligneAChanger(copie, id, aujourdhui);
    noterJour(copie, aujourdhui);
    const juste = retour.juste === true;
    // Le journal : un calcul du jour de plus dans la séance ouverte, juste
    // ou pas — le 2e calcul compte aussi.
    compterEnCours(copie, EN_COURS.calculs, 1, source);
    if (juste) compterEnCours(copie, EN_COURS.justes, 1, source);
    const deuxieme = Boolean(ligne.x[index] & X_SECOND);
    const type = retour.type === "F" || retour.type === "P" ? retour.type : carte ? typeDe(carte, id, index + 1) : "P";
    const mouvement = {module: id, niveau: index + 1, avant: boite, apres: boite, regle: true, secondAVenir: false, deuxieme,
      accident: false, rate: false, perdue: false, lent: false, monte: false, sens: "reste", aVoir: false, jours: 0};
    // Lot P1 : la sorte du calcul posé (numérotée par la page), gardée quand
    // il est faux — le 2e calcul sera de la même sorte, et le retour suivant
    // de l'étoile commencera par elle.
    const sorte = entier(retour.sorte, 0, SEUILS.sortes);
    if (!juste && !deuxieme) {
      // Le premier calcul est faux : le 2e est attendu, rien d'autre ne bouge.
      ligne.x[index] |= X_SECOND;
      ligne.q[index] = aujourdhui;
      if (sorte) poserSorte(ligne, index, sorte);
      marquer(id, ligne, index);
      if (retour.cause) ajouterCauses(ligne, {[retour.cause]: 1});
      Object.assign(mouvement, {regle: false, secondAVenir: true, premierLe: aujourdhui, jours: ecartJours(aujourdhui, ligne.e[index])});
      marquerSeanceOuverte(copie);
      return {parcours: copie, mouvement, evenements};
    }
    // Le retour est réglé. Lot P1 : `tests` compte les PREMIERS RETOURS À
    // 7 JOURS des étoiles gagnées du premier coup à « Je tente » (boîte 4,
    // sans leçon, jamais revenue : seul ce chemin y mène), `testsRates` ceux
    // qui sont ratés — c'est ce qui dit au professeur si la règle « une
    // semaine après » tient (à regarder dès la 2e semaine d'ouverture).
    // Même place au journal qu'avant (les premiers retours après « Tente
    // toute la ceinture », qui entraient aussi en boîte 4).
    const duTest = !ligne.a[index] && boite === SEUILS.revision.duPremierCoup;
    if (duTest) compterEnCours(copie, EN_COURS.tests, 1, source);
    ligne.x[index] &= ~X_SECOND;
    ligne.q[index] = null;
    // Correctif P1 (relecture de Codex du 27/11) : un retour RETROUVÉ — juste
    // au 2e calcul, ou juste mais lent — n'est pas raté : le raté d'avant
    // (règle B) ne compte plus, « deux fois de suite » repart de zéro. La
    // sorte ratée reste (le retour suivant commence par elle). Avant, le
    // raté d'avant restait : deux faux au retour suivant, et l'étoile
    // partait après raté, retrouvé, raté.
    if (juste && deuxieme) {
      ligne.e[index] = ajouterJours(aujourdhui, 1);
      ligne.x[index] &= ~X_RATE;
      mouvement.accident = true;
    } else if (juste) {
      const lent = type === "F" && Number(retour.ms) > SEUILS.jour.lentMs;
      if (lent) {
        ligne.e[index] = ajouterJours(aujourdhui, 1);
        ligne.x[index] &= ~X_RATE;
        mouvement.lent = true;
      } else {
        ligne.b[index] = Math.min(SEUILS.revision.boites, boite + 1);
        ligne.e[index] = echeanceDeBoite(ligne.b[index], aujourdhui);
        ligne.x[index] = 0;
        if (ligne.b[index] >= SEUILS.revision.su && !ligne.s[index]) ligne.s[index] = aujourdhui;
        mouvement.monte = true;
      }
    } else {
      // Les deux calculs faux : le retour est raté.
      if (retour.cause) ajouterCauses(ligne, {[retour.cause]: 1});
      if (duTest) compterEnCours(copie, EN_COURS.testsRates, 1, source);
      mouvement.rate = true;
      const rates = (ligne.x[index] & X_RATE) + 1;
      if (rates >= SEUILS.retour.ratesDeSuite) {
        ligne.a[index] = 1;
        perdre(id, ligne, index);
        mouvement.perdue = true;
        compterEnCours(copie, EN_COURS.rouges, 1, source);
        evenements.push({type: "perdue", module: id, niveau: index + 1, aVoir: ligne.pe[index] >= SEUILS.retour.perdues});
      } else {
        // La règle B : elle reste, descend d'une boîte, revient demain.
        ligne.b[index] = Math.max(1, boite - 1);
        ligne.e[index] = ajouterJours(aujourdhui, 1);
        const gardee = sorteDe(ligne, index);
        ligne.x[index] = X_RATE;
        poserSorte(ligne, index, sorte || gardee);
      }
    }
    // Elle est revenue une fois : plus d'exemple résolu à son retour.
    ligne.a[index] = 1;
    if (!mouvement.perdue) marquer(id, ligne, index);
    if (copie.seance.p[PLAN.ouverte] === 1 && copie.seance.p[PLAN.paquet] > 0) copie.seance.p[PLAN.paquet] -= 1;
    marquerSeanceOuverte(copie);
    const apres = ligne.b[index];
    Object.assign(mouvement, {apres, sens: apres > boite ? "monte" : apres < boite ? "descend" : "reste", aVoir: aVoirEnClasse(ligne, index),
      jours: apres && ligne.e[index] ? ecartJours(aujourdhui, ligne.e[index]) : 0, sorte: sorteDe(ligne, index)});
    return {parcours: copie, mouvement, evenements};
  }

  function marquerSeanceOuverte(copie) {
    if (copie.seance.p[PLAN.ouverte] === 1) marquerSeance(copie);
  }

  // Le 2e calcul qui attend (la page rechargée entre le faux et lui) : la
  // première étoile due dont le premier calcul était faux, {module, niveau},
  // ou null.
  function deuxiemeEnAttente(parcours, carte, {aujourdhui = jourLocal(), palier = SEUILS.seance.paliers} = {}) {
    const p = normaliserParcours(parcours, {aujourdhui});
    const premiere = etoilesDues(p, planDeCarte(carte), aujourdhui, palierDeSeance(palier)).find(c => c.second);
    return premiere ? {module: premiere.etoile.module, niveau: premiere.etoile.niveau} : null;
  }

  // La séance s'arrête sur un J'apprends en cours : un dernier calcul pris
  // dans ce que l'élève sait la clôt (arbitrage du 21/11). L'étoile tenue la
  // plus solide (la boîte la plus haute, puis l'ordre de la carte), {module,
  // niveau}, ou null ; ce calcul ne compte pas (aucun effet sur les boîtes).
  function etoileDeCloture(parcours, carte, {aujourdhui = jourLocal(), palier = SEUILS.seance.paliers} = {}) {
    const p = normaliserParcours(parcours, {aujourdhui});
    const reglage = palierDeSeance(palier);
    let choisie = null;
    planDeCarte(carte).ordre.forEach(etoile => {
      const ligne = p.modules[etoile.module];
      if (etoile.etage > reglage || !ligne || !tenue(ligne, etoile.index)) return;
      if (!choisie || ligne.b[etoile.index] > choisie.boite) choisie = {module: etoile.module, niveau: etoile.niveau, boite: ligne.b[etoile.index]};
    });
    return choisie ? {module: choisie.module, niveau: choisie.niveau} : null;
  }

  // « N fois cette semaine » : les séances finies depuis lundi.
  function bilanSeances(parcours, aujourdhui = jourLocal()) {
    const lundi = lundiDe(aujourdhui);
    return {
      semaine: parcours.seances.filter(jour => jour >= lundi && jour <= aujourdhui).length,
      aujourdhui: parcours.seances.filter(jour => jour === aujourdhui).length
    };
  }

  // Les séances finies des 4 dernières semaines, du lundi au dimanche, la
  // semaine en cours en dernier (jusqu'à aujourd'hui) — le calcul de Défi
  // tables (seancesParSemaine, lot 5g). Les 60 séances gardées peuvent ne
  // plus couvrir une vieille semaine : `seances` vaut null (« ? ») pour une
  // semaine finie avant la plus ancienne gardée, et `plus` dit « au moins »
  // (« 16+ ») pour la semaine où elle tombe.
  const SEMAINES_AFFICHEES = 4;
  function seancesParSemaine(parcours, aujourdhui = jourLocal()) {
    const liste = parcours.seances.filter(jour => jour <= aujourdhui);
    const lundi = lundiDe(aujourdhui);
    const plusAncienne = parcours.seances.length >= SEUILS.seance.garder ? parcours.seances[0] : null;
    const semaines = [];
    for (let recul = SEMAINES_AFFICHEES - 1; recul >= 0; recul -= 1) {
      const debut = ajouterJours(lundi, -7 * recul);
      const fin = recul === 0 ? aujourdhui : ajouterJours(debut, 6);
      if (plusAncienne && plusAncienne > fin) semaines.push({lundi: debut, seances: null, plus: false});
      else semaines.push({lundi: debut, seances: liste.filter(jour => jour >= debut && jour <= fin).length, plus: Boolean(plusAncienne && plusAncienne >= debut)});
    }
    return semaines;
  }

  // « 3 », « 16+ » (au moins), « ? » (plus connu).
  function texteSemaine(semaine) {
    if (!semaine || semaine.seances === null) return "?";
    return semaine.plus ? `${semaine.seances}+` : String(semaine.seances);
  }

  // Ce que l'élève pourra voir de sa semaine (lot G1, planche 1 du
  // 07/11/2026 ; l'accueil est à refaire, en discussion à part — il garde
  // « N fois cette semaine » en attendant), et ce que lira la page prof :
  //   montrer   faux tant qu'il n'y a aucune séance dans les 4 dernières
  //             semaines (une ligne de zéros ressemble à un reproche) ;
  //   jours     les 7 jours, du lundi au dimanche : fait (une séance finie),
  //             aujourdhui, apres (pas encore venu) ;
  //   soirs     les jours de cette semaine avec une séance finie ;
  //   semaines  les 4 dernières semaines (seancesParSemaine) ;
  //   sues      les compétences devenues sues depuis lundi, et toujours
  //             sues (une compétence redescendue ne compte plus) ;
  //   avancees  les compétences entrées ou devenues sues depuis lundi
  //             [{module, niveau}] — leurs modules ont « avancé ».
  // Seulement les modules de la carte (un module réservé n'a pas de palier).
  function semaineEleve(parcours, carte, aujourdhui = jourLocal()) {
    const p = normaliserParcours(parcours, {aujourdhui});
    const lundi = lundiDe(aujourdhui);
    const jours = Array.from({length: 7}, (_, i) => {
      const jour = ajouterJours(lundi, i);
      // Un jour pas encore venu n'est jamais « fait », même avec une séance
      // datée de lui (l'horloge d'un autre appareil) — correctif G1.
      // Correctif F4 (point 13, choix de Gwenaël du 18/11 : « une case
      // cochée par jour travaillé ») : coché, tout jour où l'élève a fait au
      // moins un calcul (`jours`), séance finie ou non.
      return {jour, fait: jour <= aujourdhui && (p.seances.includes(jour) || p.jours.includes(jour)), aujourdhui: jour === aujourdhui, apres: jour > aujourdhui};
    });
    const semaines = seancesParSemaine(p, aujourdhui);
    const cetteSemaine = jour => Boolean(jour) && jour >= lundi && jour <= aujourdhui;
    let sues = 0;
    const avancees = [];
    normaliserCarte(carte).modules.filter(fiche => Object.prototype.hasOwnProperty.call(NIVEAUX, fiche.id)).forEach(fiche => {
      const ligne = p.modules[fiche.id];
      if (!ligne) return;
      ligne.b.forEach((boite, index) => {
        if (!boite || !palierDe(carte, fiche.id, index + 1)) return;
        if (cetteSemaine(ligne.s[index]) && boite >= SEUILS.revision.su) sues += 1;
        if (cetteSemaine(ligne.d[index]) || cetteSemaine(ligne.s[index])) avancees.push({module: fiche.id, niveau: index + 1});
      });
    });
    return {
      montrer: semaines.some(semaine => semaine.seances) || jours.some(jour => jour.fait),
      jours,
      soirs: jours.filter(jour => jour.fait && !jour.apres).length,
      semaines,
      sues,
      avancees
    };
  }

  // ---------------------------------------------------- le rangement par code
  //
  // Repris de Défi tables à l'identique (lot A1, lot 8) : une case par code sur
  // l'appareil, la clé porte une EMPREINTE du code (SHA-256 salé, répété), jamais
  // le code ; sous un code, la case ne contient pas de prénom.
  const CLE_SEL = "mathsgo-defi-calcul-sel";
  const ITERATIONS_EMPREINTE = 10000;
  const LONGUEUR_EMPREINTE = 16;
  const memoEmpreintes = new Map();

  // SHA-256 (FIPS 180-4) sur un texte, encodé en UTF-8 ; résultat en hexadécimal.
  const SHA256_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function octetsUtf8(texte) {
    const chaine = String(texte);
    const octets = [];
    for (let i = 0; i < chaine.length; i += 1) {
      let point = chaine.charCodeAt(i);
      if (point >= 0xd800 && point <= 0xdbff && i + 1 < chaine.length) {
        const suivant = chaine.charCodeAt(i + 1);
        if (suivant >= 0xdc00 && suivant <= 0xdfff) {
          point = 0x10000 + ((point - 0xd800) << 10) + (suivant - 0xdc00);
          i += 1;
        }
      }
      if (point < 0x80) octets.push(point);
      else if (point < 0x800) octets.push(0xc0 | (point >> 6), 0x80 | (point & 63));
      else if (point < 0x10000) octets.push(0xe0 | (point >> 12), 0x80 | ((point >> 6) & 63), 0x80 | (point & 63));
      else octets.push(0xf0 | (point >> 18), 0x80 | ((point >> 12) & 63), 0x80 | ((point >> 6) & 63), 0x80 | (point & 63));
    }
    return octets;
  }

  function sha256Octets(source) {
    const octets = source.slice();
    const longueurBits = octets.length * 8;
    octets.push(0x80);
    while (octets.length % 64 !== 56) octets.push(0);
    for (let i = 7; i >= 0; i -= 1) octets.push(Math.floor(longueurBits / Math.pow(2, i * 8)) & 255);
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Array(64);
    for (let debut = 0; debut < octets.length; debut += 64) {
      for (let t = 0; t < 16; t += 1) {
        const o = debut + t * 4;
        w[t] = ((octets[o] << 24) | (octets[o + 1] << 16) | (octets[o + 2] << 8) | octets[o + 3]) >>> 0;
      }
      for (let t = 16; t < 64; t += 1) {
        const x = w[t - 15];
        const y = w[t - 2];
        const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let t = 0; t < 64; t += 1) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + SHA256_K[t] + w[t]) >>> 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    const resultat = [];
    h.forEach(mot => resultat.push((mot >>> 24) & 255, (mot >>> 16) & 255, (mot >>> 8) & 255, mot & 255));
    return resultat;
  }

  function enHex(octets) {
    return octets.map(o => o.toString(16).padStart(2, "0")).join("");
  }

  function sha256Hex(texte) {
    return enHex(sha256Octets(octetsUtf8(texte)));
  }

  // Le sel de l'appareil : 32 caractères hexadécimaux tirés au hasard la
  // première fois, puis relus. Sans stockage (ou stockage cassé), sel vide :
  // les clés restent calculables, il n'y a de toute façon rien à lire.
  function selAppareil(stockage) {
    try {
      if (!stockage) return "";
      const existant = stockage.getItem(CLE_SEL);
      if (typeof existant === "string" && /^[0-9a-f]{32}$/.test(existant)) return existant;
      const octets = new Array(16);
      let tire = false;
      try {
        const alea = typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.getRandomValues;
        if (alea) {
          const tampon = new Uint8Array(16);
          globalThis.crypto.getRandomValues(tampon);
          for (let i = 0; i < 16; i += 1) octets[i] = tampon[i];
          tire = true;
        }
      } catch (_) {}
      if (!tire) for (let i = 0; i < 16; i += 1) octets[i] = Math.floor(Math.random() * 256);
      const sel = octets.map(o => o.toString(16).padStart(2, "0")).join("");
      stockage.setItem(CLE_SEL, sel);
      return sel;
    } catch (_) {
      return "";
    }
  }

  function empreinteCode(code, sel) {
    const memo = sel + ":" + code;
    const connue = memoEmpreintes.get(memo);
    if (connue) return connue;
    let h = sha256Octets(octetsUtf8(memo));
    for (let i = 1; i < ITERATIONS_EMPREINTE; i += 1) h = sha256Octets(h);
    const empreinte = enHex(h).slice(0, LONGUEUR_EMPREINTE);
    memoEmpreintes.set(memo, empreinte);
    return empreinte;
  }

  function estEmpreinte(valeur) {
    return typeof valeur === "string" && valeur.length === LONGUEUR_EMPREINTE && /^[0-9a-f]+$/.test(valeur);
  }

  function cleStockage(code, stockage) {
    const propre = normaliserCode(code || "");
    return codeValide(propre) ? CLE_STOCKAGE + ":" + empreinteCode(propre, selAppareil(stockage)) : CLE_STOCKAGE;
  }

  // Sous un code, jamais de prénom dans la case durable.
  function sansPrenomSousCode(parcours, code) {
    return codeValide(code) ? definirPrenom(parcours, "") : parcours;
  }

  // Une copie écrite par une page plus récente (versionEnAvance) n'est pas
  // interprétée : le parcours rendu est vide, et rien ne s'écrira par-dessus
  // (sauver le refuse). Une copie d'une version d'avant la 12 repart de zéro.
  function charger(stockage, code) {
    try {
      const brut = stockage && stockage.getItem(cleStockage(code, stockage));
      if (!brut) return creerParcours();
      return sansPrenomSousCode(normaliserParcours(JSON.parse(brut)), code);
    } catch (_) {
      return creerParcours();
    }
  }

  // Correctif F4 (point 5, relecture de Codex) : la copie de l'appareil
  // a-t-elle été écrite par une page PLUS RÉCENTE que ce moteur (sa version
  // est plus haute, 1500 compris) ? Une page restée ouverte sur l'ancienne
  // version effacerait, en la réécrivant, ce qu'elle ne connaît pas (le
  // serveur la refuse déjà : « version_min ») : elle passe en lecture seule
  // (« Page ancienne : recharge la page. »). Une copie absente ou illisible
  // n'est pas « plus récente ».
  function versionEnAvance(stockage, code) {
    try {
      const brut = stockage && stockage.getItem(cleStockage(code, stockage));
      if (!brut) return false;
      return tropRecente(JSON.parse(brut));
    } catch (_) {
      return false;
    }
  }

  // Rend false sans rien écrire quand la copie de l'appareil est plus
  // récente que ce moteur (versionEnAvance).
  function sauver(stockage, parcours, code) {
    try {
      if (!stockage) return false;
      if (versionEnAvance(stockage, code)) return false;
      stockage.setItem(cleStockage(code, stockage), JSON.stringify(sansPrenomSousCode(normaliserParcours(parcours), code)));
      return true;
    } catch (_) {
      return false;
    }
  }

  function effacer(stockage, code) {
    try {
      if (stockage) stockage.removeItem(cleStockage(code, stockage));
      return true;
    } catch (_) {
      return false;
    }
  }

  // L'état de synchronisation d'une case : la dernière révision connue du
  // serveur, si du travail attend d'être envoyé (« dirty »), si le code a été
  // refusé (détaché), et quand la case a bougé pour la dernière fois. Rangé À
  // CÔTÉ de la case, pas dedans : normaliserParcours ignorerait ces champs.
  const CLE_SYNC = "mathsgo-defi-calcul-sync";

  function cleSync(code, stockage) {
    const propre = normaliserCode(code || "");
    return codeValide(propre) ? CLE_SYNC + ":" + empreinteCode(propre, selAppareil(stockage)) : CLE_SYNC;
  }

  function syncNeutre() {
    return {revision: 0, dirty: false, detache: false, maj: 0};
  }

  function normaliserSync(lu) {
    const sync = syncNeutre();
    if (!lu || typeof lu !== "object") return sync;
    sync.revision = entier(lu.revision, 0, 1000000000);
    sync.dirty = Boolean(lu.dirty);
    sync.detache = Boolean(lu.detache);
    sync.maj = entier(lu.maj, 0, Number.MAX_SAFE_INTEGER);
    return sync;
  }

  function lireSyncBrut(stockage, cle) {
    try {
      const brut = stockage && stockage.getItem(cle);
      return brut ? normaliserSync(JSON.parse(brut)) : syncNeutre();
    } catch (_) {
      return syncNeutre();
    }
  }

  function chargerSync(stockage, code) {
    try {
      return lireSyncBrut(stockage, cleSync(code, stockage));
    } catch (_) {
      return syncNeutre();
    }
  }

  function sauverSync(stockage, code, sync) {
    try {
      if (!stockage) return false;
      const propre = Object.assign(syncNeutre(), sync || {});
      stockage.setItem(cleSync(code, stockage), JSON.stringify(propre));
      return true;
    } catch (_) {
      return false;
    }
  }

  function effacerSync(stockage, code) {
    try {
      if (stockage) stockage.removeItem(cleSync(code, stockage));
      return true;
    } catch (_) {
      return false;
    }
  }

  function clesDuStockage(stockage) {
    const cles = [];
    try {
      if (!stockage || typeof stockage.length !== "number" || typeof stockage.key !== "function") return cles;
      for (let i = 0; i < stockage.length; i += 1) {
        const cle = stockage.key(i);
        if (typeof cle === "string") cles.push(cle);
      }
    } catch (_) {}
    return cles;
  }

  // La purge (lot 8) : une case à code que personne n'a ouverte depuis
  // DUREE_CONSERVATION_MS (90 jours) est retirée de l'appareil — élève parti,
  // classe de l'an dernier, tablette de CDI. Le serveur, lui, garde tout : un
  // élève qui revient retrouve sa progression par son code. La case active
  // (« garder ») n'est jamais touchée, ni la case sans code, ni une case dont
  // la date est inconnue (maj à 0). Rend le nombre de cases retirées.
  const DUREE_CONSERVATION_MS = 90 * 24 * 60 * 60 * 1000;

  function purger(stockage, {maintenant = Date.now(), garder = "", duree = DUREE_CONSERVATION_MS} = {}) {
    let retirees = 0;
    try {
      if (!stockage) return 0;
      const gardee = codeValide(garder) ? cleSync(garder, stockage) : null;
      clesDuStockage(stockage).forEach(cle => {
        if (!cle.startsWith(CLE_SYNC + ":") || cle === gardee) return;
        const empreinte = cle.slice(CLE_SYNC.length + 1);
        if (!estEmpreinte(empreinte)) return;
        const sync = lireSyncBrut(stockage, cle);
        if (!sync.maj || maintenant - sync.maj <= duree) return;
        stockage.removeItem(cle);
        stockage.removeItem(CLE_STOCKAGE + ":" + empreinte);
        retirees += 1;
      });
    } catch (_) {}
    return retirees;
  }

  // Vrai si une clé du stockage durable laisse lire un code élève : c'est ce
  // que le lot 8 interdit, et ce que les tests vérifient après une séance.
  function clesRevelentUnCode(stockage) {
    return clesDuStockage(stockage).some(cle => {
      return cle.split(":").slice(1).some(morceau => morceau.length === LONGUEUR_CODE && codeValide(morceau));
    });
  }

  // --------------------------------------------------------------- le code élève

  function normaliserCode(brut) {
    if (typeof brut !== "string") return "";
    return brut.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, LONGUEUR_CODE);
  }

  function codeValide(brut) {
    const code = normaliserCode(brut);
    if (code.length !== LONGUEUR_CODE) return false;
    return [...code].every(caractere => ALPHABET_CODE.includes(caractere));
  }

  function chargerCode(stockage) {
    try {
      const code = stockage && stockage.getItem(CLE_CODE);
      return codeValide(code) ? normaliserCode(code) : "";
    } catch (_) {
      return "";
    }
  }

  function sauverCode(stockage, brut) {
    try {
      if (!stockage || !codeValide(brut)) return false;
      stockage.setItem(CLE_CODE, normaliserCode(brut));
      return true;
    } catch (_) {
      return false;
    }
  }

  function effacerCode(stockage) {
    try {
      if (stockage) {
        stockage.removeItem(CLE_CODE);
        stockage.removeItem(CLE_IDENTITE);
        stockage.removeItem(CLE_REGLAGES);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // L'identité que le serveur a donnée pour le code (prénom saisi par le
  // professeur, classe) : rangée dans l'ONGLET, avec le code, jamais dans le
  // stockage durable (lot 8). Elle ne vaut que pour ce code : un autre code
  // dans le même onglet ne la lit pas.
  const CLE_IDENTITE = "mathsgo-suivi-identite";

  function chargerIdentiteOnglet(stockage, code) {
    try {
      const propre = normaliserCode(code || "");
      const brut = stockage && codeValide(propre) ? stockage.getItem(CLE_IDENTITE) : null;
      if (!brut) return null;
      const lu = JSON.parse(brut);
      if (!lu || typeof lu !== "object" || lu.code !== propre) return null;
      return {prenom: nettoyerPrenom(lu.prenom), classe: typeof lu.classe === "string" ? lu.classe.slice(0, 40) : ""};
    } catch (_) {
      return null;
    }
  }

  function sauverIdentiteOnglet(stockage, code, identite) {
    try {
      const propre = normaliserCode(code || "");
      if (!stockage || !codeValide(propre) || !identite || typeof identite !== "object") return false;
      stockage.setItem(CLE_IDENTITE, JSON.stringify({
        code: propre,
        prenom: nettoyerPrenom(identite.prenom),
        classe: typeof identite.classe === "string" ? identite.classe.slice(0, 40) : ""
      }));
      return true;
    } catch (_) {
      return false;
    }
  }

  // La SOURCE de cet onglet (correctif K1) : un nombre de 1 à 9 999 tiré
  // une fois, gardé dans l'onglet seulement (il survit au rechargement, pas
  // à la fermeture). Il dit seulement « ce que cet onglet a fait dans la
  // séance ouverte » (voir `seance.parts`) : ni l'élève, ni l'appareil, et
  // il disparaît du parcours quand la séance finit. Sans stockage : un
  // nombre pour la durée de la page.
  const CLE_SOURCE = "mathsgo-defi-calcul-source";

  function chargerSourceOnglet(stockage, alea = null) {
    try {
      const lue = stockage ? Number(stockage.getItem(CLE_SOURCE)) : 0;
      if (Number.isInteger(lue) && lue >= 1 && lue <= SOURCE_MAX) return lue;
    } catch (_) {}
    const tirage = typeof alea === "number" && alea >= 0 && alea < 1 ? alea : Math.random();
    const source = 1 + Math.floor(tirage * SOURCE_MAX);
    try { if (stockage) stockage.setItem(CLE_SOURCE, String(source)); } catch (_) {}
    return source;
  }

  // Les réglages de la séance (lot 1 « la séance », 12/11/2026 ; lot F1 avant
  // pour les nouveautés) : les minutes (10 ou 15) et jusqu'à quel étage va
  // l'appli (1 à 6), que le serveur rend avec l'identité (api/eleve.php,
  // « reglages » : {"defi-calcul": {"minutes": 15, "etage": 2}}, ceux de
  // la classe et ceux de l'élève déjà réunis — l'élève l'emporte ; rien =
  // 10 minutes, tout). Rangés dans l'ONGLET, liés au code, comme
  // l'identité ; sans code, ou illisibles : les défauts.
  // Lot K1b : le réglage rendu aux écrans garde son nom, `palier` (c'est le
  // numéro de l'étage, 1 à 6) ; ce qui est ENREGISTRÉ — au serveur et dans
  // l'onglet — s'appelle `etage`, et l'ancien `palier` se relit dans sa
  // numérotation d'avant (etageRegle).
  const CLE_REGLAGES = "mathsgo-defi-calcul-reglages";

  function reglagesParDefaut() {
    return {minutes: SEUILS.seance.defaut, palier: SEUILS.seance.paliers};
  }

  function reglagesDeSeance(reglages) {
    const r = reglages && typeof reglages === "object" && !Array.isArray(reglages) ? reglages["defi-calcul"] : null;
    const lu = r && typeof r === "object" && !Array.isArray(r) ? r : {};
    return {minutes: minutesDeSeance(lu.minutes), palier: etageRegle(lu)};
  }

  function chargerReglagesOnglet(stockage, code) {
    try {
      const propre = normaliserCode(code || "");
      const brut = stockage && codeValide(propre) ? stockage.getItem(CLE_REGLAGES) : null;
      if (!brut) return reglagesParDefaut();
      const lu = JSON.parse(brut);
      if (!lu || typeof lu !== "object" || lu.code !== propre) return reglagesParDefaut();
      return {minutes: minutesDeSeance(lu.minutes), palier: etageRegle(lu)};
    } catch (_) {
      return reglagesParDefaut();
    }
  }

  // `reglages` : ce que le serveur a rendu. Rien de lisible (une réponse
  // sans « reglages ») : on ne touche à rien.
  function sauverReglagesOnglet(stockage, code, reglages) {
    try {
      const propre = normaliserCode(code || "");
      if (!stockage || !codeValide(propre) || !reglages || typeof reglages !== "object" || Array.isArray(reglages)) return false;
      const lus = reglagesDeSeance(reglages);
      const defaut = reglagesParDefaut();
      if (lus.minutes === defaut.minutes && lus.palier === defaut.palier) stockage.removeItem(CLE_REGLAGES);
      else stockage.setItem(CLE_REGLAGES, JSON.stringify({code: propre, minutes: lus.minutes, etage: lus.palier}));
      return true;
    } catch (_) {
      return false;
    }
  }

  function effacerReglagesOnglet(stockage) {
    try {
      if (stockage) stockage.removeItem(CLE_REGLAGES);
      return true;
    } catch (_) {
      return false;
    }
  }

  // ------------------------------------------------------------------ la fusion
  //
  // Deux états du même élève (cet appareil et le serveur, ou deux
  // appareils). Version 12, après la relecture de Codex du 22/11 (B2) : la
  // décision se prend ÉTOILE PAR ÉTOILE, avec ce que cette étoile garde, et
  // plus jamais sur la date ou la somme des boîtes de son module.
  //  - Une étoile a un COMPTEUR `g`, qui monte à chaque fois qu'elle change.
  //    Des deux côtés, on garde EN BLOC l'état de celui dont le compteur est
  //    le plus haut (sa boîte, son échéance, son retour en cours, ses
  //    arrêts, ses « Je tente » ratés) : c'est celui qui en sait le plus sur
  //    elle. À compteur égal et états différents (chaque appareil a fait UN
  //    geste sur la même étoile sans voir l'autre), le plus prudent — la
  //    boîte la plus basse, puis un choix fixe qui ne dépend pas du sens.
  //  - Ce qui ne se défait jamais se réunit à part : gagnée un jour (`d`) et
  //    solide un jour (`s`), le jour le plus ancien ; perdue (`pe`) et
  //    « leçon faite ou déjà revenue » (`a`), le plus grand.
  // D'où les trois égalités, vérifiées par les tests sur des milliers
  // d'états : fusion(A, B) = fusion(B, A) ; fusion(A, A) = A ;
  // fusion(fusion(A, B), A) = fusion(A, B) — une vieille copie qui revient
  // ne change rien. Et un appareil qui a continué à partir d'un état garde
  // tout son travail en fusionnant avec cet état : une réponse juste n'est
  // jamais annulée par une copie plus ancienne.
  // Limite connue : quand deux appareils changent la MÊME étoile chacun de
  // son côté sans se voir, un seul des deux gestes est gardé ; de même, un
  // compte d'erreurs par cause monté des deux côtés garde le plus grand, pas
  // la somme (un compte exact demanderait de garder les écarts par appareil).

  function dateLaPlusRecente(premiere, seconde) {
    if (!premiere) return seconde || null;
    if (!seconde) return premiere;
    return premiere >= seconde ? premiere : seconde;
  }

  function dateLaPlusAncienne(premiere, seconde) {
    if (!premiere) return seconde || null;
    if (!seconde) return premiere;
    return premiere <= seconde ? premiere : seconde;
  }

  // Ce qu'une étoile garde en bloc, et l'ordre fixe entre deux blocs de
  // même compteur : la boîte la plus basse d'abord, puis le texte.
  const BLOC = Object.freeze(["b", "e", "x", "ar", "r", "q"]);
  const blocDe = (ligne, i) => BLOC.map(cle => ligne[cle][i]);
  // Jamais tenue : ni dans les boîtes, ni perdue (voir normaliserModule).
  const jamaisTenue = (ligne, i) => !ligne.b[i] && !ligne.pe[i];
  function blocGarde(a, b, i) {
    // Correctif K1 : une étoile gagnée d'un côté n'est jamais défaite par des
    // essais ratés de l'autre (des « Je tente », des arrêts de J'apprends
    // faits sans la voir gagnée) — une étoile ne quitte ses boîtes qu'en se
    // perdant. Le côté qui l'a tenue passe devant, quel que soit le compteur.
    if (jamaisTenue(a, i) !== jamaisTenue(b, i)) return jamaisTenue(a, i) ? b : a;
    if (a.g[i] !== b.g[i]) return a.g[i] > b.g[i] ? a : b;
    if (a.b[i] !== b.b[i]) return a.b[i] < b.b[i] ? a : b;
    // Correctif P1 (relecture de Codex du 27/11) : deux blocs pareils sauf la
    // sorte rangée dans `x` (une page de version 13 ne la connaît pas, ou
    // l'a perdue) : celui qui la connaît.
    const sansSorte = ligne => blocDe(ligne, i).map((valeur, rang) => BLOC[rang] === "x" ? valeur % X_SORTE : valeur);
    if (a.x[i] !== b.x[i] && JSON.stringify(sansSorte(a)) === JSON.stringify(sansSorte(b))) return a.x[i] > b.x[i] ? a : b;
    return JSON.stringify(blocDe(a, i)) <= JSON.stringify(blocDe(b, i)) ? a : b;
  }

  function fusionnerModule(id, a, b) {
    if (!a) return cloner(b);
    if (!b) return cloner(a);
    const k = NIVEAUX[id];
    const ligne = moduleVide(id);
    ligne.vu = dateLaPlusRecente(a.vu, b.vu);
    for (let i = 0; i < k; i += 1) {
      const source = blocGarde(a, b, i);
      BLOC.forEach(cle => { ligne[cle][i] = source[cle][i]; });
      ligne.g[i] = Math.max(a.g[i], b.g[i]);
      ligne.a[i] = Math.max(a.a[i], b.a[i]);
      ligne.pe[i] = Math.max(a.pe[i], b.pe[i]);
      ligne.d[i] = dateLaPlusAncienne(a.d[i], b.d[i]);
      ligne.s[i] = dateLaPlusAncienne(a.s[i], b.s[i]);
    }
    [...new Set([...Object.keys(a.c), ...Object.keys(b.c)])].sort((x, y) => Number(x) - Number(y)).slice(0, SEUILS.causes).forEach(cause => {
      ligne.c[cause] = Math.max(a.c[cause] || 0, b.c[cause] || 0);
    });
    return ligne;
  }

  // La séance gardée des deux : celle du jour le plus récent, puis
  // l'OUVERTE, puis le plus de séances finies et le compteur ; à égalité
  // complète, un choix fixe sur le texte.
  // Correctif K1 (relecture de Codex du 26/11) : une séance ouverte ne
  // disparaît plus parce que l'autre appareil a fini plus de séances. Elle
  // se referme seulement si le journal de l'autre côté dit qu'ELLE est finie
  // (seanceSaufFinie), ou si l'autre côté est déjà passé à un jour suivant —
  // elle est alors comptée au journal de son jour, comme quand l'élève
  // rouvre l'appli le lendemain (fusionner). Et deux séances OUVERTES le
  // même jour (la même, continuée sur deux appareils ; ou deux séances
  // ouvertes chacune de son côté) n'en font qu'une, où rien ne se perd —
  // leurs parts sont réunies (voir `seance.parts` : le temps commun compté
  // une fois, ce que chaque appareil a ajouté gardé), l'étape et le compteur
  // les plus hauts, le plan de la plus avancée (à compteur égal, le plus
  // grand de chaque nombre), la plus petite identité. Avant : la séance d'un
  // seul des deux, en bloc — deux séances de 120 et 180 secondes en
  // donnaient une de 120.
  function seanceGardee(a, b) {
    if (a.p[PLAN.ouverte] === 1 && b.p[PLAN.ouverte] === 1 && a.jour === b.jour) {
      const plan = a.g !== b.g ? (a.g > b.g ? a.p : b.p).slice() : a.p.map((valeur, index) => Math.max(valeur, b.p[index]));
      plan[PLAN.commences] = Math.max(a.p[PLAN.commences], b.p[PLAN.commences]);
      const seance = {jour: a.jour, etape: Math.max(a.etape, b.etape), n: Math.max(a.n, b.n), i: Math.min(a.i, b.i), g: Math.max(a.g, b.g), p: plan, j: enCoursVide(), parts: []};
      poserParts(seance, reunirParts(lireParts(a.parts), lireParts(b.parts)));
      return seance;
    }
    const rang = s => [s.jour || "", s.p[PLAN.ouverte], s.n, s.g];
    const [ra, rb] = [rang(a), rang(b)];
    for (let i = 0; i < ra.length; i += 1) if (ra[i] !== rb[i]) return ra[i] > rb[i] ? a : b;
    return JSON.stringify(a) <= JSON.stringify(b) ? a : b;
  }

  // Une séance ouverte dont le journal de l'autre côté dit qu'elle est finie
  // (le même jour, la même identité) : elle l'est. Rend la séance refermée.
  function seanceSaufFinie(parcours, finies) {
    const s = parcours.seance;
    if (s.p[PLAN.ouverte] !== 1 || !finies.has(`${s.jour} ${s.i}`)) return s;
    return {jour: s.jour, etape: 0, n: s.n, i: 0, g: 0, p: planVide(), j: enCoursVide(), parts: []};
  }

  // `aujourdhui` : le jour de la fusion (les bornes des dates se calculent
  // sur lui, d'où qu'elles viennent).
  // Une copie d'une version PLUS RÉCENTE que ce moteur n'est jamais
  // fusionnée (B1) : l'autre côté est rendu tel quel. La page ne doit pas
  // enregistrer par-dessus : voir recevoir.
  // `carte` et `palier` (correctif K1) : avec eux, une ceinture que la
  // fusion complète est donnée tout de suite (chaque appareil a gagné une
  // des deux dernières étoiles : 44 sur 44, et la ceinture manquait jusqu'au
  // geste suivant). Son jour ne dépend que des données : le plus récent des
  // jours où ses étoiles ont été gagnées.
  function fusionner(premier, second, {aujourdhui = jourLocal(), carte = null, palier = SEUILS.seance.paliers} = {}) {
    const a = normaliserParcours(premier, {aujourdhui});
    const b = normaliserParcours(second, {aujourdhui});
    if (tropRecente(second)) return a;
    if (tropRecente(premier)) return b;
    // L'époque la plus haute gagne en bloc (« Recommencer à zéro », une
    // version restaurée par le professeur).
    if (a.epoque !== b.epoque) return a.epoque > b.epoque ? a : b;
    const fusion = creerParcours();
    fusion.epoque = a.epoque;
    // Le prénom (un visiteur sans code ; il ne part jamais au serveur) :
    // celui qui existe ; deux prénoms, un choix fixe.
    fusion.prenom = !a.prenom || !b.prenom ? a.prenom || b.prenom : a.prenom <= b.prenom ? a.prenom : b.prenom;
    CODES.forEach(id => {
      if (a.modules[id] || b.modules[id]) fusion.modules[id] = fusionnerModule(id, a.modules[id], b.modules[id]);
    });
    // Les séances finies et leur journal : réunies séance par séance, par
    // leur jour et leur identité (reunirSeances) — une copie de la même
    // séance se dédoublonne, même close à deux rangs différents ; deux
    // séances différentes restent deux (G3). Le compte des séances finies
    // suit : celles d'un côté, plus celles que l'autre a finies sans lui.
    // Correctif K1 (relecture de Codex du 26/11) : « en plus » veut dire
    // GARDÉE par la réunion (dans ses 60 plus récentes) et pas connue de
    // l'autre côté. Avant, la date seule décidait à la borne : une vieille
    // copie rapportait une séance aussitôt évincée (la première de deux
    // séances du même jour), et le compte montait à chaque retour, 61 → 62
    // → 63, pour les mêmes 60 séances.
    // Une séance restée ouverte un jour que l'autre côté a dépassé : elle
    // compte pour son jour si elle a fait quelque chose (une étape, un
    // calcul du jour, du temps), exactement comme à l'ouverture d'une séance
    // le lendemain (ouvrir). `a` et `b` sont des copies : rien d'autre ne bouge.
    const clore = (x, y) => {
      if (x.seance.p[PLAN.ouverte] === 1 && y.seance.jour && x.seance.jour < y.seance.jour && seanceAFaitQuelqueChose(x.seance)) fermer(x, x.seance.jour);
    };
    clore(a, b);
    clore(b, a);
    const [pa, pb] = [pairesDe(a), pairesDe(b)];
    const rangees = reunirSeances(pa, pb);
    const gardees = new Set(pairesDe(rangees).map(cleDeSeance));
    const enPlus = (x, y) => {
      const connues = new Set(y.map(cleDeSeance));
      return x.filter(p => numeroDe(p.entree) >= 0 && gardees.has(cleDeSeance(p)) && !connues.has(cleDeSeance(p))).length;
    };
    // Une séance ouverte d'un côté et finie de l'autre est finie.
    const finies = new Set([...pa, ...pb].filter(p => numeroDe(p.entree) >= 0).map(cleDeSeance));
    fusion.seance = cloner(seanceGardee(seanceSaufFinie(a, finies), seanceSaufFinie(b, finies)));
    fusion.seance.n = Math.min(SEUILS.compteur, Math.max(a.seance.n + enPlus(pb, pa), b.seance.n + enPlus(pa, pb)));
    fusion.seances = rangees.seances;
    fusion.journal = rangees.journal;
    fusion.jours = normaliserJours([...a.jours, ...b.jours]);
    // Une ceinture gagnée d'un côté l'est des deux, un test de ceinture joué
    // d'un côté l'est des deux : le jour le plus ancien. Le remplissage à
    // garder : le plus grand.
    fusion.ceintures = ceinturesVides().map((_, index) => dateLaPlusAncienne(a.ceintures[index], b.ceintures[index]));
    fusion.paliers = ceinturesVides().map((_, index) => dateLaPlusAncienne(a.paliers[index], b.paliers[index]));
    fusion.quarts = quartsVides().map((_, index) => Math.max(a.quarts[index], b.quarts[index]));
    if (carte) gagnerCeintures(fusion, carte, null, palier);
    return normaliserParcours(fusion, {aujourdhui});
  }

  // Un parcours REÇU (lu au serveur, rendu avec un 409, relu d'une autre
  // case) : avant de l'interpréter, de le fusionner ou de l'enregistrer, sa
  // version est contrôlée (B1).
  //  - plus récente que ce moteur : rien n'est fusionné — `parcours` est le
  //    parcours local, inchangé, et `lectureSeule` vaut true : la page ne
  //    doit plus rien écrire ni envoyer (« Page ancienne : recharge la
  //    page. ») ;
  //  - sinon : la fusion. `apporte` dit si le local apporte quelque chose au
  //    reçu (sinon la page ne renvoie rien : chaque ouverture ne fait pas
  //    monter la révision pour rien).
  //    Correctif K1b (relecture de Codex du 26/11) : une progression reçue en
  //    VERSION 12 est à récrire en version 13, même quand cet appareil
  //    n'apporte aucune étoile — `apporte` vaut alors true, et la page envoie
  //    UNE fois, avec la révision qu'elle vient de lire. Avant, la
  //    comparaison se faisait après la reprise des deux côtés : rien ne
  //    partait, et la ligne du serveur pouvait rester en version 12 (qu'une
  //    page de version 12 restée ouverte relisait encore). Une fois récrite,
  //    elle est lue en version 13 : plus rien ne repart.
  // `carte`, `palier` : voir fusionner (une ceinture que la fusion complète).
  function recevoir(local, recu, {aujourdhui = jourLocal(), carte = null, palier = SEUILS.seance.paliers} = {}) {
    const ici = normaliserParcours(local, {aujourdhui});
    if (tropRecente(recu)) return {parcours: ici, lectureSeule: true, apporte: false};
    const distant = normaliserParcours(recu, {aujourdhui});
    const fusion = fusionner(ici, distant, {aujourdhui, carte, palier});
    const sansPrenom = p => JSON.stringify(Object.assign({}, p, {prenom: ""}));
    return {parcours: fusion, lectureSeule: false, apporte: versionDe(recu) === VERSION_REPRISE || versionDe(recu) === VERSION_13 || versionDe(recu) === VERSION_14 || sansPrenom(fusion) !== sansPrenom(distant)};
  }

  // ---------------------------------------------- ce que lit le professeur
  //
  // Lot 2b (31/10/2026) : la page « Ma classe » de suivi.mathsgo.re et la
  // tuile de Mon espace lisent un parcours par cette fonction, et par elle
  // seule. Elle rend ce qu'on affiche, jamais un texte : les noms viennent
  // de defi_calcul_core.js, côté page. Lot K1 : la FORME de la réponse ne
  // change pas (le nouvel affichage du professeur est le lot K2) ; ce
  // qu'elle dit suit la carte.
  //
  // L'état d'une étoile, tel que le professeur le voit :
  //   gris    pas gagnée (à gagner, ou fermée) ;
  //   route   gagnée, en route (boîtes 1 à 3) ;
  //   su      solide (boîtes 4 à 7) ;
  //   revoir  à regagner (gagnée un jour, perdue à un retour), ou gagnée
  //           avec un retour raté ;
  //   classe  « à voir en classe » : J'apprends arrêté 3 fois, ou perdue 3
  //           fois (tant qu'elle n'est pas redevenue solide).
  function etatCompetence(ligne, index) {
    if (aVoirEnClasse(ligne, index)) return "classe";
    if (!ligne.b[index]) return ligne.d[index] ? "revoir" : "gris";
    if (ligne.x[index] & X_RATE) return "revoir";
    return ligne.b[index] >= SEUILS.revision.su ? "su" : "route";
  }

  function resumeProf(brut, carte, aujourdhui = jourLocal()) {
    const parcours = normaliserParcours(brut, {aujourdhui});
    const lisible = Boolean(brut && typeof brut === "object") && !tropRecente(brut);
    const compte = compter(parcours, carte);
    // Le même compte sur les seuls modules construits : ce que l'appli
    // propose aujourd'hui (la page du professeur compte là-dessus ; la tuile
    // et l'accueil de l'élève, sur toute la carte).
    const carteOuverte = normaliserCarte(carte);
    const ouvert = compter(parcours, {modules: carteOuverte.modules.filter(fiche => fiche.construit), ordre: carteOuverte.ordre});
    const modules = [];
    const revoir = [];
    normaliserCarte(carte).modules.filter(fiche => Object.prototype.hasOwnProperty.call(NIVEAUX, fiche.id)).forEach(fiche => {
      const ligne = ligneDe(parcours, fiche.id);
      const etats = ligne.b.map((_, index) => etatCompetence(ligne, index));
      const paliers = ligne.b.map((_, index) => palierDe(carte, fiche.id, index + 1));
      modules.push({
        id: fiche.id,
        construit: Boolean(fiche.construit),
        niveaux: NIVEAUX[fiche.id],
        etats,
        paliers,
        boites: ligne.b.slice(),
        // Toutes les étoiles du module sont solides.
        su: paliers.some(Boolean) && ligne.b.every((boite, index) => !paliers[index] || boite >= SEUILS.revision.su),
        vu: ligne.vu,
        // Le jour où chaque étoile a été gagnée pour la première fois, et
        // celui où elle est devenue solide (null : pas connu).
        entrees: ligne.d.slice(),
        sues: ligne.s.slice(),
        // Lot K1 (pour la page du professeur du lot K2) : combien de fois
        // chaque étoile a été perdue.
        perdues: ligne.pe.slice()
      });
      etats.forEach((etat, index) => {
        if (etat !== "revoir" && etat !== "classe") return;
        const attend = enAttente(ligne, index, aujourdhui);
        revoir.push({
          module: fiche.id, niveau: index + 1, etat,
          deCote: attend,
          echeance: ligne.e[index],
          // À regagner ou à apprendre : l'étoile n'est pas tenue.
          apprends: !ligne.b[index],
          echecs: ligne.pe[index],
          entrainee: false,
          // Jamais gagnée — J'apprends arrêté 3 fois ; le jour où elle se
          // rejoue (null : elle se joue déjà).
          pasApprise: !ligne.b[index] && !ligne.d[index],
          retour: attend ? ligne.e[index] : null
        });
      });
    });
    // Les causes d'erreur, par module, les plus fréquentes d'abord (c est un
    // compte depuis le début : le serveur n'a pas de semaine).
    const causes = [];
    Object.keys(parcours.modules).forEach(id => {
      Object.keys(parcours.modules[id].c).forEach(cause => causes.push({module: id, cause: Number(cause), n: parcours.modules[id].c[cause]}));
    });
    causes.sort((p, q) => q.n - p.n || p.module.localeCompare(q.module) || p.cause - q.cause);
    // Les séances : cette semaine (depuis lundi), les 4 dernières semaines
    // (28 jours), et les jours de cette semaine où il y en a eu.
    const lundi = lundiDe(aujourdhui);
    const depuis = ajouterJours(aujourdhui, -27);
    const seances = parcours.seances.filter(jour => jour <= aujourdhui);
    const joursSemaine = [...new Set(seances.filter(jour => jour >= lundi))];
    const dernier = seances.length ? seances[seances.length - 1] : null;
    const vus = Object.keys(parcours.modules).map(id => parcours.modules[id].vu).filter(Boolean).sort();
    return {
      lisible,
      commence: Object.keys(parcours.modules).length > 0 || parcours.seances.length > 0,
      sues: compte.sues, entrees: compte.entrees, total: compte.total, paliers: compte.paliers,
      ouvert: {sues: ouvert.sues, entrees: ouvert.entrees, total: ouvert.total, paliers: ouvert.paliers},
      modules,
      revoir,
      aVoir: revoir.filter(c => c.etat === "classe").length,
      rouges: revoir.filter(c => c.etat === "revoir").length,
      causes,
      seances: {semaine: seances.filter(jour => jour >= lundi).length, quatreSemaines: seances.filter(jour => jour >= depuis).length,
        total: parcours.seances.length, jours: joursSemaine},
      // Les 4 dernières semaines, et le journal, une séance finie par ligne,
      // de la plus ancienne à la plus récente — null : pas connu.
      semaines: seancesParSemaine(parcours, aujourdhui),
      journal: pairesDe(parcours).map(({jour, entree}) => {
        const ligne = {jour};
        JOURNAL.forEach((champ, index) => { if (champ !== "numero") ligne[champ] = entree[index] >= 0 ? entree[index] : null; });
        return ligne;
      }),
      // La ceinture portée, les jours où chacune a été gagnée, le
      // remplissage de la suivante (tous les étages : la page du professeur
      // ne lit pas le réglage de l'élève ici).
      ceintures: (() => {
        const etat = etatCeintures(parcours, carte);
        return {porte: etat.porte, dates: etat.dates, barrettes: etat.barrettes, prochaine: etat.prochaine, solides: etat.solides, total: etat.total,
          etoiles: etat.etoiles, quarts: etat.quarts};
      })(),
      dernier: dernier && vus.length ? (dernier >= vus[vus.length - 1] ? dernier : vus[vus.length - 1]) : dernier || (vus.length ? vus[vus.length - 1] : null)
    };
  }

  // --------------------------------------- pour « Suivre ses élèves » (S2)
  //
  // Lot S1 « les journaux » (07/11/2026) : la même fonction, avec la même
  // forme de réponse, dans les cinq moteurs suivis (Défi tables, Coffres
  // magiques, Anzan, Défi calcul, SPLAT! ; la forme complète est écrite dans
  // defi_tables_mon_parcours.js, resumeSuivi). La page du professeur
  // l'appellera au lot S2 ; rien ne l'affiche encore. Des nombres, des dates
  // et des codes, jamais une phrase.
  // Défi calcul : un jour de travail = une séance finie ; une ligne par
  // séance {calculs, justes, nouveautes, prouvees, rouges} (lot « le jour
  // vert », 11/11/2026, choix de Gwenaël : la DERNIÈRE ligne d'un jour porte
  // aussi `modules`, les codes des modules où une compétence a été réussie
  // pour la première fois ou est devenue sue ce jour-là — lus dans ce que le
  // parcours garde déjà, dans l'ordre de la carte ; la page écrit leur nom)
  // — les minutes
  // gardées au journal ne sont PAS rendues (décision de Gwenaël, 07/11/2026 :
  // aider l'élève, pas le fliquer ; la page prof ne montre aucun temps) ; à
  // aider : des compétences à reprendre en classe (mises de côté, {type:
  // "a-reprendre", competences}) et des compétences rouges ({type: "rouges",
  // competences}) ; à féliciter : beaucoup de compétences devenues sues
  // cette semaine (FELICITER_COMPETENCES ou plus : {type: "competences",
  // competences}) ; lot 6-0 (18/11/2026, choix de Gwenaël avant l'essai en
  // classe, livré avec le lot F4) : une ceinture gagnée cette semaine
  // ({type: "ceinture", ceinture}, 1 jaune … 4 bleue — la date déjà gardée
  // dans `ceintures`), comme le grade d'Anzan.
  const FELICITER_COMPETENCES = 5;
  function resumeSuivi(brut, options) {
    const o = typeof options === "string" ? {aujourdhui: options} : (options || {});
    const aujourdhui = dateOuNull(o.aujourdhui) || jourLocal();
    const parcours = normaliserParcours(brut, {aujourdhui});
    const lundi = lundiDe(aujourdhui);
    const debut = ajouterJours(lundi, -21);
    const nombre = valeur => (valeur >= 0 ? valeur : null);
    const passees = pairesDe(parcours).filter(paire => paire.jour <= aujourdhui);
    // Lot « un jour de travail dès le premier geste » (choix de Gwenaël,
    // 08/11/2026, « l'élève a fait quelque chose ») : la séance ouverte (pas
    // finie) compte aussi son jour dès un calcul du jour ou une étape faite —
    // sans rien changer aux données (« seance » garde déjà son jour et ce
    // qu'elle a fait) ; sa ligne se lit comme celle d'une séance finie.
    const ouverte = parcours.seance;
    if (ouverte.jour && ouverte.jour <= aujourdhui && ouverte.p[PLAN.ouverte] === 1
      && (ouverte.etape > 0 || ouverte.j[EN_COURS.calculs] > 0)
      && !passees.some(paire => paire.jour === ouverte.jour)) {
      const entree = JOURNAL.map(() => -1);
      entree[JOURNAL.indexOf("calculs")] = ouverte.j[EN_COURS.calculs];
      entree[JOURNAL.indexOf("justes")] = ouverte.j[EN_COURS.justes];
      entree[JOURNAL.indexOf("nouveautes")] = ouverte.j[EN_COURS.nouveautes];
      entree[JOURNAL.indexOf("prouvees")] = ouverte.j[EN_COURS.prouvees];
      entree[JOURNAL.indexOf("rouges")] = ouverte.j[EN_COURS.rouges];
      passees.push({jour: ouverte.jour, entree});
      passees.sort((x, y) => (x.jour < y.jour ? -1 : x.jour > y.jour ? 1 : 0));
    }
    const jours = [];
    passees.filter(paire => paire.jour >= debut).forEach(({jour, entree}) => {
      const ligne = {};
      // (Les cinq comptes du lot S1, pas plus : la page « Suivre ses
      // élèves » lit la même forme pour les cinq applis.)
      ["calculs", "justes", "nouveautes", "prouvees", "rouges"].forEach(champ => { ligne[champ] = nombre(entree[JOURNAL.indexOf(champ)]); });
      const dernierJour = jours[jours.length - 1];
      if (dernierJour && dernierJour.jour === jour) dernierJour.lignes.push(ligne);
      else jours.push({jour, lignes: [ligne]});
    });
    jours.forEach(j => {
      const modules = Object.keys(parcours.modules).sort().filter(id => {
        if (!Object.prototype.hasOwnProperty.call(NIVEAUX, id)) return false;
        const ligne = ligneDe(parcours, id);
        return ligne.d.includes(j.jour) || ligne.s.includes(j.jour);
      });
      j.lignes[j.lignes.length - 1].modules = modules;
    });
    let classe = 0;
    let rougesVues = 0;
    let sues = 0;
    Object.keys(parcours.modules).sort().forEach(id => {
      if (!Object.prototype.hasOwnProperty.call(NIVEAUX, id)) return;
      const ligne = ligneDe(parcours, id);
      ligne.b.forEach((_, index) => {
        const etat = etatCompetence(ligne, index, aujourdhui);
        if (etat === "classe") classe += 1;
        if (etat === "revoir") rougesVues += 1;
        const sue = ligne.s[index];
        if (sue && sue >= lundi && sue <= aujourdhui) sues += 1;
      });
    });
    const aider = [];
    if (classe) aider.push({type: "a-reprendre", competences: classe});
    if (rougesVues) aider.push({type: "rouges", competences: rougesVues});
    return {
      appli: "defi-calcul",
      aujourdhui,
      debut,
      connuDepuis: parcours.seances.length >= SEUILS.seance.garder ? parcours.seances[0] : null,
      dernier: passees.length ? passees[passees.length - 1].jour : null,
      jours,
      aider,
      feliciter: parcours.ceintures
        .map((jour, index) => (jour && jour >= lundi && jour <= aujourdhui ? {type: "ceinture", ceinture: index + 1} : null))
        .filter(Boolean)
        .concat(sues >= FELICITER_COMPETENCES ? [{type: "competences", competences: sues}] : [])
    };
  }

  // Le nombre de clés à toute profondeur (ce que compte le serveur) et la
  // taille en octets du JSON enregistré.
  function mesurer(parcours) {
    let cles = 0;
    const compter = valeur => {
      if (Array.isArray(valeur)) valeur.forEach(compter);
      else if (valeur && typeof valeur === "object") Object.keys(valeur).forEach(cle => { cles += 1; compter(valeur[cle]); });
    };
    compter(parcours);
    const json = JSON.stringify(parcours);
    let octets = 0;
    for (let i = 0; i < json.length; i += 1) {
      const code = json.charCodeAt(i);
      octets += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
    }
    return {cles, octets};
  }

  return Object.freeze({
    VERSION,
    VERSION_REPRISE,
    VERSION_13,
    VERSION_14,
    COUPE_K1B,
    // Correctif K1b : les deux étages du compteur d'une moitié du haut.
    COMPTEURS_K1B: Object.freeze({heriteMax: COMPTEUR_HERITE_MAX, joue: COMPTEUR_JOUE}),
    CLE_STOCKAGE,
    NIVEAUX,
    CODES,
    SEUILS,
    PLAN,
    REPRISE,
    JOURNAL,
    creerParcours,
    normaliserParcours,
    // B1 : la version d'une progression brute, et « écrite par une page plus
    // récente que ce moteur ».
    versionDe,
    tropRecente,
    nettoyerPrenom,
    definirPrenom,
    remettreAZero,
    estVide,
    jourLocal,
    ajouterJours,
    ecartJours,
    lundiDe,
    delaiDeBoite,
    echeanceDeBoite,
    couleurDeBoite,
    rangDe,
    competenceDeRang,
    arretsDe,
    repriseDe,
    parcoursConstruit,
    palierDe,
    typeDe,
    // Lot K1 : la carte de l'élève et l'état de ses étoiles.
    carteEleve,
    etatEtoile,
    premierRetourSansLecon,
    aVoirEnClasse,
    enAttente,
    compter,
    competencesDuPalier,
    etatCeintures,
    garderRemplissage,
    // J'apprends, « Je m'entraîne encore ».
    suivreEntrainement,
    verdictEntrainement,
    appliquerSerie,
    // « Je tente », « Tente toute la ceinture ».
    appliquerTentative,
    noterLeconCommencee,
    plusFacile,
    // Lot P1 : l'ordre de « Continuer » (du bas vers le haut).
    ordreDesEtages,
    // Mes calculs du jour.
    tirerCalculsDuJour,
    appliquerRetour,
    deuxiemeEnAttente,
    commencerPaquet,
    terminerCalculsDuJour,
    // La séance.
    ouvrirSeance,
    seanceOuverte,
    etatSeance,
    continuer,
    peutCommencer,
    fermerSeance,
    etoileDeCloture,
    noterTemps,
    bilanSeances,
    seancesParSemaine,
    texteSemaine,
    semaineEleve,
    etatCompetence,
    resumeProf,
    resumeSuivi,
    mesurer,
    CLE_SEL,
    ITERATIONS_EMPREINTE,
    LONGUEUR_EMPREINTE,
    DUREE_CONSERVATION_MS,
    sha256Hex,
    selAppareil,
    empreinteCode,
    cleStockage,
    charger,
    sauver,
    versionEnAvance,
    effacer,
    purger,
    clesRevelentUnCode,
    CLE_SYNC,
    cleSync,
    chargerSync,
    sauverSync,
    effacerSync,
    CLE_CODE,
    CLE_IDENTITE,
    LONGUEUR_CODE,
    normaliserCode,
    codeValide,
    chargerCode,
    sauverCode,
    effacerCode,
    chargerIdentiteOnglet,
    sauverIdentiteOnglet,
    CLE_SOURCE,
    chargerSourceOnglet,
    CLE_REGLAGES,
    minutesDeSeance,
    palierDeSeance,
    reglagesParDefaut,
    reglagesDeSeance,
    chargerReglagesOnglet,
    sauverReglagesOnglet,
    effacerReglagesOnglet,
    fusionner,
    recevoir
  });
});
