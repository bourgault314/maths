(function initDefiTablesMonParcours(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_TABLES_MON_PARCOURS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // Moteur de « Mon parcours » (logique pure, sans DOM) pour Défi tables.
  // Règles décidées le 29/08/2026 :
  //  - par table (2 à 10) : J'apprends (4 activités, 5 depuis le lot 4b), Je m'entraîne (3 entraînements
  //    différents), Acquise (validation 20 questions, 1 min 30, 2 erreurs max) ;
  //  - Mélange des tables acquises (dès 2 tables) : un ✓ « à jour » qui repasse
  //    « à refaire » à chaque nouvelle table acquise.
  // Lot 3 de Défi tables v2 « les règles » (décisions des 7 et 8/09/2026) :
  //  - le mélange est OBLIGATOIRE : dès 2 tables acquises, tant qu'il n'est
  //    pas réussi, « Je valide » des autres tables est verrouillé ; J'apprends
  //    et Je m'entraîne restent libres. Même format que la validation d'une
  //    table (20 questions = 14 produits + 6 trous, 1 min 30, 2 erreurs max),
  //    sur les tables acquises seulement, sans division — y compris le dernier,
  //    avec les 9 tables. Chaque nouvelle table le remet « à faire » ;
  //  - les étoiles n'arrivent qu'à la fin : 9 tables acquises ET dernier
  //    mélange réussi ouvrent l'escalier — 25 questions, produits + trous +
  //    divisions dès la première étoile, toutes les tables, 2 erreurs max, seule
  //    la durée change : ★ 2 min · ★★ 1 min 45 · ★★★ 1 min 30 · ★★★★ 1 min 15 ·
  //    👑 1 min (Légende des tables). Marche par marche : seule l'étoile
  //    SUIVANTE compte (lot « après l'audit GPT », D5, 14/10/2026) — sauf la
  //    couronne, que la Légende rejoue. L'ancien Expert « ouvert dès le
  //    début » et son raccourci « ★ valide les 9 tables » n'existent plus ;
  //  - un RANG, qui ne redescend jamais : Bronze (1 table acquise) · Argent (3)
  //    · Or (6) · Platine (9 tables + dernier mélange) · Diamant (★★★★) ·
  //    Légende des tables (👑) ;
  //  - les JOURS travaillés (un jour compte dès qu'une série de la grille est
  //    jouée) : « N jours cette semaine », jamais de série à ne pas casser ;
  //  - le JOUR est le jour LOCAL de l'appareil (jourLocal), plus le jour UTC :
  //    à la Réunion, le jour UTC basculait à 4 h du matin ;
  //  - les parcours d'avant sont migrés une seule fois (version 2) : les tables
  //    acquises restent acquises, l'ancienne ★★★ (divisions en 2 min) devient
  //    la nouvelle ★, les anciennes ★ et ★★ ne valent rien, le mélange est remis
  //    « à faire ».
  // Lot 4b « les perles comptent » (10/09/2026) :
  //  - J'apprends a CINQ activités : « je pousse les perles » (le rekenrek du
  //    lot 4a) en première position, puis la bande (ex-bâton), la bande à
  //    trous, l'ordre, le désordre. Les activités sont rangées PAR NOM, jamais
  //    par rang : un parcours d'avant garde ses cases telles quelles, et la
  //    perle qui lui manque vaut simplement 0 — rien ne glisse d'un cran ;
  //  - l'étape conseillée d'une table (le rond bleu) : J'apprends tant que les
  //    cinq activités ne sont pas toutes terminées ET qu'aucun entraînement
  //    n'est réussi ; dès que l'un des deux est vrai, Je m'entraîne. « Finir un
  //    J'apprends ne veut pas dire qu'il connaît » ;
  //  - l'avis « le parcours a changé » du lot 3 est retiré : il n'y avait pas
  //    d'élèves avant le 8/09, il n'a servi à personne. La migration des
  //    données (★★★ → ★, mélange remis à faire) reste.
  // Lot 4 « Mes calculs » (29/08/2026, idée de Claire) :
  //  - grille des 36 faits 2×2 à 9×9, sens confondus (7×8 et 8×7 = un seul fait) ;
  //  - 3 cases par fait : +1 par bonne réponse, −1 par erreur ou question passée,
  //    su à 3 ; états : jamais vu / à travailler (0 après erreur) / en cours / su ;
  //  - la grille appartient au parcours : alimentée par Je m'entraîne, les
  //    validations, les mélanges, Expert et les révisions — jamais par
  //    J'apprends, Réglages ou l'évaluation CM1 ;
  //  - révision personnalisée : 10 questions sans chrono, priorité aux faits à
  //    0 case ratés récemment, puis 1, puis 2, puis les jamais vus des tables
  //    acquises, puis l'entretien, puis les jamais vus restants.
  // Lot MÉMOIRE « Mes calculs du jour » (décisions des 11 et 12/09/2026, après
  // la formation neurosciences de Gwenaël) : les trois cases deviennent CINQ
  // BOÎTES, et chaque calcul porte le jour où il REVIENT.
  //  - boîte 1 = à revoir (rouge), 2 et 3 = en route (bleu), 4 et 5 = su (vert)
  //    — les trois couleurs et les trois mots ne changent pas ;
  //  - un calcul monte d'une boîte quand il est DÛ (son jour de retour est
  //    arrivé) et réussi du premier coup, dans n'importe quelle série du
  //    parcours (entraînements, validations, mélanges, étoiles, révision) ;
  //    pas dû, une bonne réponse ne change rien. Cette règle remplace « au plus
  //    une case par jour » : « un calcul monte quand tu le réussis le jour où
  //    il revient » ;
  //  - à la montée, le calcul revient après 0 · 1 · 3 · 7 · 14 jours selon sa
  //    nouvelle boîte ; la boîte 5 est renouvelée à chaque réussite : c'est
  //    l'entretien de toute l'année, un calcul su ne disparaît plus jamais ;
  //  - une erreur = une boîte de moins (jamais de retour direct en boîte 1) et
  //    le calcul est dû aujourd'hui ; pas de regain le jour d'une erreur ;
  //    seule la première réponse d'une série compte ; au plus UNE descente
  //    par jour pour un même calcul (22/10/2026), comme pour la montée ;
  //  - la révision = LES CALCULS DUS AUJOURD'HUI, pris dans toutes les boîtes
  //    à tour de rôle (les plus en retard d'abord dans chaque boîte) pour que
  //    chaque série mêle du dur et du facile — verts compris, 10 à la fois ;
  //    rien de dû = « Encore 10 calculs » si l'élève veut s'entraîner (les
  //    prochains à revenir), et rien ne monte : pas de triche ;
  //  - migration des grilles d'avant (version 2) : cases 0/1/2/3 → boîtes
  //    1/2/3/4 (rien de vert ne redevient bleu), échéance recalculée depuis la
  //    dernière date connue du calcul — dû aujourd'hui si elle manque.

  // Lot « Ma séance du jour » (lot 1, 02/10/2026 — conception de Gwenaël) :
  //  - la RANGÉE d'une table : dix cases, les résultats (3, 6, 9… 30). Les
  //    huit calculs de la grille suivent leurs boîtes (vide · entourée = boîte
  //    2 · pleine = boîte 3 ou plus) ; les deux bouts (× 1 et × 10) ne sont ni
  //    dans les boîtes ni dans la grille des 36 : ils se remplissent à la
  //    première réussite (« bouts », par table). La table de 10 n'a que des
  //    bouts. « Prête » = les dix cases pleines ;
  //  - l'ÉCHELLE À DÉCALAGE : huit marches par table (perles, je construis la
  //    bande, bande à trous, dans l'ordre, dans le désordre, nombres
  //    manquants, résultats et nombres manquants, je valide ma table). Une
  //    séance propose trois marches qui se suivent, à partir du « départ » de
  //    la table (« seance.depart », 1 à 6). Séance finie : le départ avance
  //    d'une marche, de deux si les marches du jour sont toutes sans faute.
  //    Une marche ratée (plus de 3 erreurs sur 10) : la marche d'en dessous,
  //    puis la marche ratée refaite, puis la suite ; ratée une seconde fois,
  //    la séance s'arrête et le départ redescend un cran sous la marche ratée ;
  //  - la marche 8 ne devient la validation que si la table est prête — ou
  //    par le RACCOURCI : 10 sur 10 à « Dans le désordre » ET 10 sur 10 à
  //    « Nombres manquants » (« sansFaute », par table) ; sinon un
  //    entraînement la remplace. Tant que le mélange est dû, pas de validation ;
  //  - une séance = Mes calculs du jour (10 au plus) s'il y en a, le mélange
  //    s'il est dû, puis les marches de la table ; « seances » garde le jour
  //    de chaque séance finie (« Cette semaine ●○○○ »).
  // Rien de tout cela ne change la version du parcours : des clés en plus,
  // et une clé absente vaut son départ (rien, 1, 0).

  // Lot M1 de l'optimisation (03/10/2026 — décisions de Gwenaël après avoir
  // joué en élève) :
  //  - la SÉANCE EN COURS entre dans le parcours (« enCours », à la racine),
  //    donc sur le serveur : une séance coupée se reprend LE JOUR MÊME, sur
  //    n'importe quel appareil, les étapes faites restent faites. À minuit
  //    elle est oubliée (le départ ne bouge pas, « Cette semaine » ne la
  //    compte pas). Le serveur ne garde ni texte ni liste d'objets : elle est
  //    rangée en nombres (voir coderSeance) ;
  //  - validation réussie : la séance est FINIE (la fête, puis le bilan). Le
  //    mélange dû ouvre la séance suivante, après Mes calculs du jour, et ce
  //    jour-là la table ne donne que deux marches (quatre étapes au plus au
  //    départ). Le verrou du mélange ne change pas ;
  //  - le raccourci : 9 sur 10 ou mieux (une erreur au plus) à « Dans le
  //    désordre » ET à « Nombres manquants » — la clé reste « sansFaute » ;
  //  - « Cette semaine » : cinq points ; les durées annoncées sont celles
  //    mesurées (4 étapes, environ 5 min).
  // Toujours pas de changement de version : une clé de plus, absente = rien.

  // Lot M2 de l'optimisation (03/10/2026 au soir — décision de Gwenaël :
  // « une séance a toujours 4 étapes ») :
  //  - quatre marches quand rien n'est dû (le premier jour : perles, bande,
  //    bande à trous, dans l'ordre) ; trois avec Mes calculs du jour OU le
  //    mélange ; deux avec les deux. Au sommet, la fenêtre s'arrête à la
  //    marche 8 au lieu de raccourcir (départ 6 : 5-6-7-8) ;
  //  - une marche ratée : cinq étapes au plus (la marche refaite prend la
  //    place de la dernière marche du jour) ;
  //  - la validation du raccourci, quand elle peut s'ajouter en 5e étape, est
  //    annoncée par la carte (programmeDeSeance : « raccourciEnFin ») ;
  //  - une table ratée au premier écran : moins de 10 sur 20, la séance
  //    repart des perles ; sinon des entraînements (comme avant).
  // Rien n'est enregistré de plus : pas de changement de version.

  // Lot « divisions » (04/10/2026 — décisions de Gwenaël) : les divisions
  // entrent dans la séance d'une table, à la place d'une partie des nombres
  // manquants (même question, autre écriture : 56 ÷ 7 = ?, c'est 7 × ? = 56) :
  //  - marche 6 « Nombres manquants et divisions » : 5 + 5 ; marche 7
  //    « Résultats, nombres manquants et divisions » : 6 + 2 + 2 ;
  //  - validation, mélange et « Comme la validation » : 14 résultats,
  //    3 nombres manquants, 3 divisions (au lieu de 14 + 6) ;
  //  - hors d'Expert, une seule forme de division, dans les deux sens
  //    (56 ÷ 7 = ? et 56 ÷ 8 = ?) — annulé le 09/10 par le lot « trois
  //    divisions » : les trois écritures partout ;
  //  - Mes calculs du jour : nombres manquants et divisions dès que la table
  //    a réussi la marche 6 ou est acquise ; une question sur deux reste un
  //    résultat ;
  //  - une division compte pour son calcul (56 ÷ 7 = case 7 × 8) : rien ne
  //    change dans ce qui est enregistré, ni les clés, ni la version.

  // Lot « un seul système, les boîtes » (05/10/2026 — décisions de Gwenaël) :
  //  - UN seul système de mémoire, les boîtes. Mes calculs du jour est la
  //    PORTE de la journée : une fois par jour, en premier, tant qu'il n'est
  //    pas joué rien d'autre ne s'ouvre. Dix calculs chronométrés (6 secondes
  //    par calcul, 30 secondes au moins) : les calculs dus d'abord, puis des
  //    calculs des tables passées vus depuis le plus longtemps ; jamais deux
  //    fois le même. Il ne se rate pas : le temps écoulé, les calculs pas
  //    faits restent dus, et tout s'ouvre. « calculsDuJour » garde le jour où
  //    il a été joué ;
  //  - les séances suivantes du même jour commencent par les calculs dus qui
  //    restent (dix au plus, sans complément, sans porte), puis trois marches ;
  //    plus rien de dû : quatre marches ;
  //  - Mes calculs du jour ne prend que les calculs des tables PASSÉES (avant
  //    aujourd'hui) : ceux de la table en cours restent aux marches ;
  //  - le mélange n'est plus obligatoire : plus de verrou, plus de « à
  //    refaire », il n'est plus dans la séance et n'ouvre plus l'escalier.
  //    « Mon mélange » reste, libre (20 questions, 1 min 30, dès 2 tables) ;
  //    ses réponses comptent dans les boîtes ;
  //  - le test d'une table s'appelle « Je passe le test », la table est
  //    « passée » (la clé enregistrée reste « acquise ») ; « Je deviens
  //    expert » s'ouvre dès 9 tables passées, Platine = 9 tables passées.
  // Pas de changement de version : une clé de plus (« calculsDuJour »), et
  // « melange.score » (le dernier score du mélange libre) ; absentes = rien.

  // Lot « retours de classe » (06/10/2026 — décisions de Gwenaël après les
  // premiers jours en classe et une simulation de 1 000 élèves) :
  //  - le test d'une table ne vient plus que JUSTE APRÈS 9 sur 10 à la
  //    marche 7 (« Résultats, nombres manquants et divisions »), dans la même
  //    séance, et c'est tout (règle simplifiée le 07/10). Avant, 9 sur 10 aux
  //    marches 5 et 6, ou la rangée pleine, ouvraient le test tout de suite :
  //    la marche 7 sautait presque toujours. Environ une séance de plus par
  //    table ; rien de nouveau n'est enregistré (« prete » ne sert plus), une
  //    séance déjà commencée garde le test qu'elle avait promis ;
  //  - Mes calculs du jour sans aucune réponse avant la fin du temps se note
  //    « pas réussi » (le bilan écrit « temps écoulé », pas « 0 sur 1 »).
  // Pas de changement de version.

  // Lot « trois divisions » (09/10/2026 — décision de Gwenaël, qui annule
  // « une seule forme » du lot « divisions ») : une division s'écrit de
  // trois façons PARTOUT — 56 ÷ 7 = ?, ? ÷ 7 = 8 et 56 ÷ ? = 8 —, dans les
  // entraînements, le test, Mon mélange (le moteur de questions s'en charge)
  // et Mes calculs du jour (planRevision : les trois écritures à tour de
  // rôle). Les dosages ne changent pas. Une division compte toujours pour
  // son calcul, quelle que soit son écriture : rien de nouveau n'est
  // enregistré, pas de changement de version.

  // Lot « 🏆 Les records » (09/10/2026 — idée d'un élève, décisions de
  // Gwenaël) : le défi d'APRÈS la couronne. Une Légende des tables (couronne
  // gagnée) court les 25 questions de la couronne avec un chrono qui MONTE ;
  // le temps ne compte que si les 25 réponses sont justes (règle du 09/10,
  // plus sévère que les 2 erreurs de l'escalier) et s'il n'est pas impossible
  // (SEUILS.course.dixiemesMin : l'appli n'a aucun plancher, un robot fait
  // les 25 questions en 0,06 s — seul l'humain en a un). Le classement vit
  // sur le serveur de suivi (une ligue par professeur, « Cette semaine » et
  // « De tous les temps ») : RIEN n'entre dans le parcours — ni temps, ni
  // choix du nom. Le moteur ne fait ici que : dire ce qu'est une course
  // (configCourse, classerSerie → « course »), juger un temps
  // (courseCompte), l'écrire (formatTemps), et mettre la course à la place
  // de l'étoile dans la séance d'une Légende quand la page le demande
  // (etapeDeSeance, option « records »). La course de la couronne elle-même
  // (25 sur 25 en 1 minute) donne le premier record : c'est la page qui
  // envoie son temps. Et la couronne elle-même passe à 25 sur 25
  // (erreursMaxCouronne) : la dernière marche se gagne sans faute, l'écran
  // de lancement le dit. Pas de changement de version.

  // Version du parcours enregistré. 1 = jusqu'au lot 2 de Défi tables v2 ;
  // 2 = lot 3 (mélange obligatoire, escalier des étoiles, rang, jours) ;
  // 3 = lot mémoire (cinq boîtes et une échéance par calcul). Un parcours
  // d'une version plus basse est migré par normaliserParcours — donc à la
  // lecture de la case, à la fusion, à la sauvegarde — et jamais deux fois.
  // Le lot 4b n'a pas changé de version : il ajoute une activité (une clé de
  // plus dans « apprends »), et une clé absente vaut 0 — c'est déjà la règle.
  const VERSION = 3;
  const CLE_STOCKAGE = "mathsgo-defi-tables-parcours";
  const TABLES = Object.freeze(Array.from({length: 9}, (_, index) => index + 2));
  const ORDRE_CONSEIL = Object.freeze([2, 10, 5, 3, 4, 6, 7, 8, 9]);
  // Les activités de J'apprends, dans l'ordre où elles se proposent : les
  // perles (le rekenrek) d'abord, la bande ensuite. Ce sont des CLÉS, pas des
  // rangs : chaque case du parcours est rangée sous son nom.
  const ACTIVITES_APPRENDS = Object.freeze(["beads", "construct", "gaps", "ordered", "random"]);
  const ENTRAINEMENTS = Object.freeze(["desordre", "trous", "mixte"]);
  const PRENOM_MAX = 20;

  // Suivi de classe (lot C) : le code que le professeur remet sur papier.
  // Alphabet sans O, 0, I ni 1 — les seuls qu'on lit de travers en
  // majuscules (le L y est : même alphabet que le serveur, _serveur/public/lib/codes.php).
  const CLE_CODE = "mathsgo-suivi-code";
  const ALPHABET_CODE = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const LONGUEUR_CODE = 6;

  const SEUILS = Object.freeze({
    entrainement: Object.freeze({total: 10, erreursMax: 1}),
    // « boiteMin » (19/09/2026, décision de Gwenaël) : la validation n'est
    // CONSEILLÉE que quand les 8 calculs de la table sont en boîte 3 ou plus
    // — deux rendez-vous réussis, donc au plus tôt le lendemain des
    // entraînements. Un conseil, jamais un verrou : « Je valide » reste libre.
    // Lot « test : une erreur au plus » (21/10/2026, décision de Gwenaël) :
    // le test d'une table et « Comme le test » passent de 2 erreurs à UNE
    // (19 sur 20) — « une erreur, c'est une faute de frappe ; deux, l'élève
    // ne connaît pas son résultat ». Mon mélange et les étoiles gardent 2.
    validation: Object.freeze({total: 20, dureeMax: 90, erreursMax: 1, boiteMin: 3}),
    // Le mélange a le format du test d'une table : 20 questions en 1 min 30,
    // 2 erreurs max — dès 2 tables passées. Libre depuis le lot « un seul
    // système » : il ne verrouille rien.
    // « trophees » : les coupes de Mon mélange — réussi avec au moins 3,
    // puis 6 tables (les seuils des rangs Argent et Or). Lot « Mon mélange aux
    // paliers » (09/10/2026, décision de Gwenaël) : il n'y en a plus que DEUX.
    // La 3e (les 9 tables, 20 questions en 1 min 30, soit 4,5 s par question)
    // était plus dure que la première étoile (25 questions en 2 min, 4,8 s) :
    // le chemin monte maintenant sans à-coup — le test d'une table, la coupe
    // des 3, la coupe des 6, puis l'escalier des étoiles. Mon mélange des 9
    // tables reste libre, sans coupe.
    melange: Object.freeze({total: 20, dureeMax: 90, erreursMax: 2, tablesMin: 2, trophees: Object.freeze([3, 6])}),
    // L'escalier des étoiles : 25 questions, toutes les tables, produits +
    // trous + divisions, 2 erreurs max ; une durée par marche, en secondes.
    // « erreursMaxCouronne » (09/10/2026, décision de Gwenaël, lot « Les
    // records ») : la dernière marche — la couronne, 1 minute — exige 25 sur
    // 25, comme la course des records qu'elle ouvre. Les quatre étoiles
    // gardent leurs 2 erreurs. Rien de rétroactif : une couronne gagnée
    // avant reste gagnée.
    etoile: Object.freeze({total: 25, erreursMax: 2, erreursMaxCouronne: 0, durees: Object.freeze([120, 105, 90, 75, 60])}),
    // Les records (09/10/2026) : les 25 questions de la couronne, chrono qui
    // monte, 25 sur 25 obligatoire (« erreursMax » 0, décision de Gwenaël),
    // temps en dixièmes de seconde ; « dixiemesMin » : en dessous de 10 s
    // (0,4 s par question), ce n'est pas un élève — le temps ne compte pas,
    // ici et sur le serveur (lib/records.php, même valeur) ; « dixiemesMax » :
    // une heure, au-delà c'est un onglet oublié.
    course: Object.freeze({total: 25, erreursMax: 0, dixiemesMin: 100, dixiemesMax: 36000}),
    // La révision : 10 calculs à la fois ; cinq boîtes par calcul, et le
    // nombre de jours avant qu'un calcul revienne, par boîte (boîte 1 : le
    // jour même). « aRevoirMin » : dès 2 calculs rouges, une table acquise
    // porte le repère « à revoir ».
    // Lot « un seul système » : Mes calculs du jour est chronométré —
    // « secondesParCalcul » par calcul, « dureeMin » au moins ;
    // « passeesSeulement » : il ne prend que les calculs des tables passées.
    revision: Object.freeze({total: 10, boites: 5, delais: Object.freeze([0, 1, 3, 7, 14]), aRevoirMin: 2, secondesParCalcul: 6, dureeMin: 30, passeesSeulement: true}),
    // Les jours travaillés gardés dans le parcours (dates, sans heure).
    jours: Object.freeze({garder: 14}),
    // Ma séance du jour : trois marches par séance, un départ entre 1 et 6
    // (la séance 6-7-8 est la dernière), +2 quand tout est sans faute ;
    // « raté » = plus de 3 erreurs sur 10 (moins de 7 sur 10) ; l'objectif de
    // la semaine (5 jours, pas une limite) ; les séances gardées.
    // Lot M1 : « plafond » — quatre étapes au plus à l'ouverture (Mes calculs
    // du jour + le mélange dus : deux marches au lieu de trois, jamais moins
    // que « marchesMin ») ; « raccourciErreursMax » — une erreur au plus aux
    // deux entraînements du raccourci ; « erreursGardees » — les calculs
    // ratés que la séance en cours retient (pour « À retenir pour demain »).
    // Lot M2 : « marches » passe à 4 (toujours quatre étapes : quatre marches
    // quand rien n'est dû) ; « etapesMax » — cinq étapes au plus après une
    // marche ratée. « departMax » reste 6 : un parcours enregistré au départ 6
    // ne doit pas retomber à 1 (entier() rend la valeur par défaut hors bornes).
    seance: Object.freeze({marches: 4, marchesMin: 2, plafond: 4, etapesMax: 5, departMax: 6, sansFaute: 2, raccourciErreursMax: 1, erreursRate: 0.3, objectifSemaine: 5, garder: 60, erreursGardees: 60}),
    // Lot M2 : une table ratée au premier écran (« Tu connais déjà des
    // tables ? ») — moins de « sous » bonnes réponses sur 20 : la séance
    // repart de la marche « departBas » (les perles) ; sinon des
    // entraînements (MARCHE_APRES_DECOUVERTE).
    decouverte: Object.freeze({sous: 10, departBas: 1}),
    // La page du professeur (lot 2b) : à partir de 8 séances sur une table
    // qui n'est toujours pas acquise, la ligne le signale (l'élève moyen en
    // met 4 ou 5, l'élève en difficulté 7 à 9 : simulation du lot 1) ; et à
    // partir de 7 jours sans rien faire.
    prof: Object.freeze({seancesLongues: 8, absenceJours: 7})
  });
  const ETOILES_MAX = SEUILS.etoile.durees.length;

  // Les rangs, dans l'ordre : l'indice est le niveau (0 = pas encore de rang).
  const RANGS = Object.freeze([
    Object.freeze({niveau: 0, cle: "", nom: ""}),
    Object.freeze({niveau: 1, cle: "bronze", nom: "Bronze"}),
    Object.freeze({niveau: 2, cle: "argent", nom: "Argent"}),
    Object.freeze({niveau: 3, cle: "or", nom: "Or"}),
    Object.freeze({niveau: 4, cle: "platine", nom: "Platine"}),
    Object.freeze({niveau: 5, cle: "diamant", nom: "Diamant"}),
    Object.freeze({niveau: 6, cle: "legende", nom: "Légende des tables"})
  ]);
  const SEUILS_RANG = Object.freeze({argent: 3, or: 6});

  // Les 36 faits de la grille « Mes calculs » : 2×2 à 9×9, sens confondus.
  const FAIT_MIN = 2;
  const FAIT_MAX = 9;
  const FAITS = Object.freeze((() => {
    const cles = [];
    for (let premier = FAIT_MIN; premier <= FAIT_MAX; premier += 1) {
      for (let second = premier; second <= FAIT_MAX; second += 1) cles.push(`${premier}-${second}`);
    }
    return cles;
  })());
  const FORMES_TROU = Object.freeze(["right", "left", "reverse-right", "reverse-left"]);
  const FORMES_DIVISION = Object.freeze(["division-quotient", "division-dividend", "division-divisor"]);

  // Lot « divisions » (04/10/2026) : « trous » = 5 nombres manquants et
  // 5 divisions ; « mixte » = 6 résultats, 2 nombres manquants, 2 divisions
  // (le dosage est dans le moteur de questions, TRAIN_MIXES). Les clés ne
  // changent pas : rien à transformer dans les parcours enregistrés.
  const CONFIG_ENTRAINEMENTS = Object.freeze({
    desordre: Object.freeze({questionTypes: Object.freeze(["direct"])}),
    trous: Object.freeze({questionTypes: Object.freeze(["missing", "division"])}),
    mixte: Object.freeze({questionTypes: Object.freeze(["direct", "missing", "division"])})
  });

  const LIBELLES_ENTRAINEMENTS = Object.freeze({
    desordre: "produits dans le désordre",
    trous: "nombres manquants et divisions",
    mixte: "produits, nombres manquants et divisions"
  });

  const LIBELLES_APPRENDS = Object.freeze({
    beads: "je pousse les perles",
    construct: "je construis la bande",
    gaps: "je complète une bande à trous",
    ordered: "je réponds dans l’ordre",
    random: "je réponds dans le désordre"
  });

  // La même chose à l'impératif, pour « Table de 3 : pousse les perles ».
  const CONSIGNES_APPRENDS = Object.freeze({
    beads: "pousse les perles",
    construct: "construis la bande",
    gaps: "complète une bande à trous",
    ordered: "réponds dans l’ordre",
    random: "réponds dans le désordre"
  });

  function cloner(valeur) {
    return JSON.parse(JSON.stringify(valeur));
  }

  // Les clés du compteur « fois » : les cinq activités de J'apprends et les
  // trois entraînements (noms distincts, un seul objet plat par table).
  const CLES_FOIS = Object.freeze([...ACTIVITES_APPRENDS, ...ENTRAINEMENTS]);
  // Les deux entraînements du raccourci vers la validation (la validation
  // pose 14 calculs directs et 6 nombres manquants : il faut les deux formes).
  // « sansFaute » est le nom de la clé enregistrée depuis le lot 1 ; depuis le
  // lot M1 elle veut dire « 9 sur 10 ou mieux » (le nom reste : un parcours
  // déjà enregistré garde ce qu'il a gagné).
  const CLES_SANS_FAUTE = Object.freeze(["desordre", "trous"]);
  // Lot « retours de classe » (06/10/2026) : le raccourci se termine par la
  // marche 7 (« Résultats, nombres manquants et divisions ») à 9 sur 10.
  const CLE_RACCOURCI_FIN = "mixte";

  function foisVides() {
    return Object.fromEntries(CLES_FOIS.map(cle => [cle, 0]));
  }

  function tableVide() {
    return {
      apprends: Object.fromEntries(ACTIVITES_APPRENDS.map(activite => [activite, 0])),
      entraine: {desordre: 0, trous: 0, mixte: 0, dernier: null},
      // Lot « dosage + validation » (19/09/2026) : combien de fois chaque
      // activité et chaque entraînement ont été FAITS jusqu'au bout (réussi
      // ou non). Un état 0/1/2 dit « fait ? » et cette question a une fin ;
      // un nombre dit « combien de fois ? » et n'en a pas — c'est lui que
      // l'accueil montre, pour qu'un élève ne lise jamais « terminé » et
      // refasse le rekenrek autant qu'il veut. Une clé absente vaut 0.
      fois: foisVides(),
      // Ma séance du jour (lot 1) : les bouts de la rangée déjà réussis
      // (× 1 et × 10 ; pour la table de 10, de × 1 à × 10), le départ de la
      // prochaine séance sur l'échelle et le nombre de séances qui l'ont
      // déplacé (« n » : à la fusion, le plus récent gagne), et les deux
      // entraînements déjà réussis sans faute (le raccourci vers la validation).
      // « dernier » (lot 2) : le jour de la dernière séance jouée sur cette
      // table — c'est elle que l'accueil rouvre le lendemain.
      bouts: [],
      seance: {depart: 1, n: 0, dernier: null},
      sansFaute: {desordre: 0, trous: 0},
      acquise: null
    };
  }

  function creerParcours() {
    const tables = {};
    TABLES.forEach(table => { tables[table] = tableVide(); });
    return {
      version: VERSION,
      // L'époque monte d'un cran à chaque « Recommencer à zéro » : à la fusion,
      // l'époque la plus haute gagne entièrement, sinon l'ancien parcours d'un
      // autre appareil ressusciterait ce que l'élève vient d'effacer.
      epoque: 0,
      prenom: "",
      tables,
      // Mon mélange (libre) : « dernier », le jour où il a été joué pour la
      // dernière fois, et « score », ses bonnes réponses sur 20 ce jour-là.
      // « aJour » et « aRefaireAvec » datent du mélange obligatoire : plus rien
      // ne les lit, ils restent pour les appareils restés sur l'appli d'avant.
      // « reussi » : le plus grand nombre de tables avec lequel il a été
      // réussi (18 sur 20 ou mieux) — un trophée, jamais une obligation.
      melange: {tables: [], aJour: false, aRefaireAvec: null, dernier: null, score: null, reussi: null},
      // etoiles : 0 à 5 (5 = 👑) ; couronne : le jour de la Légende.
      expert: {etoiles: 0, dernier: null, couronne: null},
      // Le meilleur rang atteint (0 à 6) : il ne redescend jamais.
      rang: 0,
      // Les jours travaillés (jour local, « AAAA-MM-JJ »), les 14 derniers.
      jours: [],
      // Le jour de chaque séance finie (un jour peut y être plusieurs fois).
      seances: [],
      // La séance commencée et pas finie (lot M1), rangée en nombres ; null :
      // aucune. Elle ne vaut que pour son jour (voir seanceEnCours).
      enCours: null,
      // Les calculs ratés AUJOURD'HUI dans les séances (lot « retouches après
      // Mon parcours »), rangés en nombres comme ceux de la séance en cours
      // (407 pour 4 × 7) ; null : aucun. Ils ne valent que pour leur jour.
      retenir: null,
      // Le jour où Mes calculs du jour a été joué pour la dernière fois (la
      // porte de la journée) ; null : jamais.
      calculsDuJour: null,
      calculs: {}
    };
  }

  // Plafond du compteur « fois » (un élève qui refait une activité mille fois
  // ne casse rien ; au-delà, le nombre ne monte plus).
  const FOIS_MAX = 9999;

  function entier(valeur, minimum, maximum, defaut = 0) {
    const nombre = Number(valeur);
    if (!Number.isInteger(nombre) || nombre < minimum || nombre > maximum) return defaut;
    return nombre;
  }

  // Une date est un jour, « AAAA-MM-JJ », rien d'autre : un JSON forgé ne peut
  // pas y glisser un texte qui serait réaffiché dans la fiche.
  function dateOuNull(valeur) {
    return typeof valeur === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valeur) ? valeur : null;
  }

  // LE jour du parcours : le jour local de l'appareil, « AAAA-MM-JJ ».
  // Jusqu'au lot 2, c'était le jour UTC (toISOString) : à la Réunion (UTC+4),
  // une journée basculait à 4 h du matin, et « reviens demain » voulait dire
  // « après 4 h ». Le jour local est celui que l'élève lit sur sa montre ; c'est
  // aussi celui que le serveur de suivi et la page du professeur affichent
  // (minuit, heure de la Réunion). Une seule définition, ici, pour la grille
  // (une case par jour), les jours travaillés, les dates d'acquisition.
  function jourLocal(instant = new Date()) {
    const d = instant instanceof Date && !Number.isNaN(instant.getTime()) ? instant : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    return (Array.isArray(liste) ? liste : []).map(dateOuNull).filter(Boolean).sort().slice(-SEUILS.seance.garder);
  }

  // Les multiplicateurs HORS GRILLE d'une table : × 1 et × 10 ; pour la table
  // de 10, tous (aucun de ses calculs n'est dans la grille des 36).
  function multiplicateursBouts(table) {
    return Number(table) === 10 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [1, 10];
  }

  function normaliserBouts(table, liste) {
    const permis = multiplicateursBouts(table);
    const lus = new Set((Array.isArray(liste) ? liste : []).map(Number));
    return permis.filter(multiplicateur => lus.has(multiplicateur));
  }

  // « AAAA-MM-JJ » + n jours, en jours locaux (midi, pour ignorer les
  // changements d'heure).
  function ajouterJours(jour, nombre) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    d.setDate(d.getDate() + nombre);
    return jourLocal(d);
  }

  // Le nombre de jours entre deux jours « AAAA-MM-JJ » (second − premier).
  function ecartJours(premier, second) {
    const a = new Date(`${premier}T12:00:00`);
    const b = new Date(`${second}T12:00:00`);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.round((b - a) / 86400000);
  }

  // Le jour où un calcul revient quand il vient d'entrer dans une boîte.
  function echeanceDeBoite(boite, jour) {
    const rang = entier(boite, 1, SEUILS.revision.boites, 1);
    return ajouterJours(jour, SEUILS.revision.delais[rang - 1]);
  }

  // Le miroir « cases » (0 à 3) d'une boîte (1 à 5), gardé dans chaque calcul
  // POUR LES APPAREILS RESTÉS SUR L'APPLI D'AVANT : un onglet ouvert depuis
  // vendredi lit encore « cases » — sans ce miroir il verrait 36 calculs à
  // zéro, jouerait, et renverrait cette grille vide au serveur, où la fusion
  // (le jour le plus récent gagne) l'emporterait sur la vraie. Avec lui, il
  // lit la bonne couleur ; ce qu'il renvoie est migré comme un parcours de
  // version 2 (boîte 5 → 4 au pire). À retirer quand plus aucun appareil ne
  // parle la version 2.
  function casesDeBoite(boite) {
    return Math.min(boite - 1, 3);
  }

  function normaliserParcours(brut) {
    const parcours = creerParcours();
    if (!brut || typeof brut !== "object") return parcours;
    // Un parcours sans version, ou de version 1, vient d'avant le lot 3 : ce
    // qu'il porte est lu à l'ancienne, puis migré une seule fois (plus bas).
    const versionLue = entier(brut.version, 1, 1000, 1);
    const ancienne = versionLue < 2;
    parcours.epoque = entier(brut.epoque, 0, 1000000);
    parcours.prenom = nettoyerPrenom(brut.prenom);
    TABLES.forEach(table => {
      const source = brut.tables && brut.tables[table];
      if (!source || typeof source !== "object") return;
      const cible = parcours.tables[table];
      ACTIVITES_APPRENDS.forEach(activite => {
        cible.apprends[activite] = entier(source.apprends && source.apprends[activite], 0, 2);
      });
      ENTRAINEMENTS.forEach(entrainement => {
        cible.entraine[entrainement] = entier(source.entraine && source.entraine[entrainement], 0, 2);
      });
      const dernier = source.entraine && source.entraine.dernier;
      if (dernier && typeof dernier === "object") {
        cible.entraine.dernier = {
          entrainement: ENTRAINEMENTS.includes(dernier.entrainement) ? dernier.entrainement : "desordre",
          score: entier(dernier.score, 0, 20),
          total: entier(dernier.total, 1, 20, 10)
        };
      }
      CLES_FOIS.forEach(cle => {
        // Au-delà du plafond, on garde le plafond (pas zéro : un compteur ne
        // se perd pas parce qu'il est grand).
        cible.fois[cle] = Math.min(FOIS_MAX, entier(source.fois && source.fois[cle], 0, Number.MAX_SAFE_INTEGER));
      });
      cible.bouts = normaliserBouts(table, source.bouts);
      if (source.seance && typeof source.seance === "object") {
        cible.seance.depart = entier(source.seance.depart, 1, SEUILS.seance.departMax, 1);
        cible.seance.n = entier(source.seance.n, 0, FOIS_MAX);
        cible.seance.dernier = dateOuNull(source.seance.dernier);
      }
      CLES_SANS_FAUTE.forEach(cle => {
        cible.sansFaute[cle] = entier(source.sansFaute && source.sansFaute[cle], 0, 1);
      });
      cible.acquise = dateOuNull(source.acquise);
    });
    if (brut.melange && typeof brut.melange === "object") {
      parcours.melange.aJour = Boolean(brut.melange.aJour);
      parcours.melange.aRefaireAvec = entier(brut.melange.aRefaireAvec, 2, 10, null);
      parcours.melange.dernier = dateOuNull(brut.melange.dernier);
      parcours.melange.score = brut.melange.score === null || brut.melange.score === undefined ? null : entier(brut.melange.score, 0, SEUILS.melange.total, null);
      parcours.melange.reussi = brut.melange.reussi === null || brut.melange.reussi === undefined ? null : entier(brut.melange.reussi, SEUILS.melange.tablesMin, TABLES.length, null);
    }
    if (brut.expert && typeof brut.expert === "object") {
      parcours.expert.dernier = dateOuNull(brut.expert.dernier);
      if (ancienne) {
        // L'ancien escalier (★ produits / ★★ + trous / ★★★ + divisions, 2 min) :
        // seule ★★★ contenait déjà les divisions en 2 min — elle devient la
        // nouvelle ★. Champion (★★★) n'existe plus : rien à garder.
        parcours.expert.etoiles = entier(brut.expert.niveau, 0, 3) === 3 ? 1 : 0;
      } else {
        parcours.expert.etoiles = entier(brut.expert.etoiles, 0, ETOILES_MAX);
        parcours.expert.couronne = dateOuNull(brut.expert.couronne);
      }
    }
    if (!ancienne) {
      parcours.rang = entier(brut.rang, 0, RANGS.length - 1);
      parcours.jours = normaliserJours(brut.jours);
    }
    parcours.seances = normaliserSeances(brut.seances);
    parcours.enCours = normaliserEnCours(brut.enCours);
    parcours.retenir = normaliserRetenir(brut.retenir);
    parcours.calculsDuJour = dateOuNull(brut.calculsDuJour);
    if (brut.calculs && typeof brut.calculs === "object") {
      FAITS.forEach(cle => {
        const source = brut.calculs[cle];
        if (!source || typeof source !== "object") return;
        const vu = dateOuNull(source.vu);
        if (!vu) return;
        const erreur = dateOuNull(source.erreur);
        const gagne = dateOuNull(source.gagne);
        // La boîte (lot mémoire). Un parcours de version 2 — ou renvoyé par un
        // appareil resté sur l'appli d'avant — n'a que « cases » (0 à 3) :
        // cases 0/1/2/3 → boîtes 1/2/3/4, rien de vert ne redevient bleu.
        let boite = entier(source.boite, 1, SEUILS.revision.boites, 0);
        if (!boite) boite = entier(source.cases, 0, 3) + 1;
        // Le jour du retour. S'il manque (migration, ou champ jeté par un
        // vieil appareil), il est recalculé depuis la dernière date connue du
        // calcul : un rouge est dû tout de suite, les autres reviennent
        // « délai de leur boîte » après leur dernier gain (ou leur dernier
        // passage) — souvent déjà passé, donc dus aujourd'hui.
        const echeance = dateOuNull(source.echeance)
          || (boite === 1 ? vu : echeanceDeBoite(boite, gagne || vu));
        parcours.calculs[cle] = {boite, cases: casesDeBoite(boite), vu, erreur, gagne, echeance};
      });
    }
    parcours.melange.tables = tablesAcquises(parcours);
    if (parcours.melange.tables.length < SEUILS.melange.tablesMin) {
      parcours.melange.aJour = false;
      parcours.melange.aRefaireAvec = null;
    }
    if (ancienne) migrerVersion2(parcours);
    // Le rang ne redescend jamais : le meilleur du rang enregistré et de celui
    // que l'état donne — un parcours d'avant reçoit ainsi son rang.
    parcours.rang = Math.max(parcours.rang, rangDeLEtat(parcours));
    return parcours;
  }

  // La migration vers les règles du lot 3 (version 2), appliquée UNE fois, au
  // moment où un parcours d'avant est lu. Les tables acquises restent acquises
  // et la grille ne bouge pas ; l'ancien mélange (25 produits en 2 min) ne vaut
  // pas le nouveau : il est remis « à faire » pour qui a au moins 2 tables ; les
  // étoiles ont été converties plus haut (★★★ → ★). Un appareil resté sur
  // l'ancienne appli renvoie un parcours de version 1 : il repasse ici, et la
  // fusion (maximum de chaque compteur) fait que rien de ce qui a été gagné
  // sous les nouvelles règles ne se perd. (L'avis « le parcours a changé »
  // qui accompagnait cette migration a été retiré au lot 4b.)
  function migrerVersion2(parcours) {
    parcours.version = VERSION;
    parcours.expert.couronne = null;
    parcours.rang = 0;
    parcours.jours = [];
    if (parcours.melange.tables.length >= SEUILS.melange.tablesMin) {
      parcours.melange.aJour = false;
      parcours.melange.aRefaireAvec = null;
    }
  }

  // Le rang que l'état du parcours donne, sans mémoire : le rang enregistré
  // est le maximum de tous ceux-là au fil du temps.
  function rangDeLEtat(parcours) {
    const acquises = tablesAcquises(parcours).length;
    const etoiles = parcours.expert.etoiles;
    if (etoiles >= ETOILES_MAX) return 6;
    if (etoiles >= ETOILES_MAX - 1) return 5;
    if (acquises === TABLES.length) return 4;
    if (acquises >= SEUILS_RANG.or) return 3;
    if (acquises >= SEUILS_RANG.argent) return 2;
    if (acquises >= 1) return 1;
    return 0;
  }

  function rang(niveau) {
    return RANGS[entier(niveau, 0, RANGS.length - 1)];
  }

  // L'escalier des étoiles s'ouvre dès que les 9 tables sont passées.
  function escalierOuvert(parcours) {
    return toutesAcquises(parcours);
  }

  // Note un jour travaillé (au plus SEUILS.jours.garder jours gardés).
  function noterJour(parcours, date) {
    const jour = dateOuNull(date);
    if (!jour || parcours.jours.includes(jour)) return;
    parcours.jours = normaliserJours([...parcours.jours, jour]);
  }

  // Le lundi de la semaine d'un jour « AAAA-MM-JJ » (semaine du lundi au dimanche).
  function lundiDe(jour) {
    const d = new Date(`${jour}T12:00:00`);
    if (Number.isNaN(d.getTime())) return jour;
    const recul = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - recul);
    return jourLocal(d);
  }

  // « N jours cette semaine » : les jours travaillés depuis le lundi, aujourd'hui
  // compris ; « dus » : les calculs du jour ; « demain » : ce qui attendra
  // demain si rien d'autre n'est joué (les dus d'aujourd'hui restés dus, plus
  // ceux qui reviennent demain). Rien de punitif, jamais de série à ne pas casser.
  function bilanJours(parcours, aujourdhui = jourLocal()) {
    const lundi = lundiDe(aujourdhui);
    const semaine = parcours.jours.filter(jour => jour >= lundi && jour <= aujourdhui).length;
    const agenda = agendaCalculs(parcours, aujourdhui);
    return {semaine, dus: agenda.dus, demain: agenda.demain, aujourdhui: parcours.jours.includes(aujourdhui)};
  }

  function nettoyerPrenom(valeur) {
    if (typeof valeur !== "string") return "";
    return valeur.replace(/\s+/g, " ").trim().slice(0, PRENOM_MAX);
  }

  function definirPrenom(parcours, prenom) {
    const copie = cloner(parcours);
    copie.prenom = nettoyerPrenom(prenom);
    return copie;
  }

  function remettreAZero(parcours) {
    const neuf = creerParcours();
    neuf.prenom = parcours && typeof parcours.prenom === "string" ? nettoyerPrenom(parcours.prenom) : "";
    neuf.epoque = entier(parcours && parcours.epoque, 0, 1000000) + 1;
    return neuf;
  }

  function tablesAcquises(parcours) {
    return TABLES.filter(table => Boolean(parcours.tables[table] && parcours.tables[table].acquise));
  }

  function toutesAcquises(parcours) {
    return tablesAcquises(parcours).length === TABLES.length;
  }

  function memesTables(premieres, secondes) {
    if (premieres.length !== secondes.length) return false;
    const tri = liste => [...liste].map(Number).sort((a, b) => a - b);
    const a = tri(premieres);
    const b = tri(secondes);
    return a.every((valeur, index) => valeur === b[index]);
  }

  function tableDuParcours(config) {
    if (!config || !Array.isArray(config.tables) || config.tables.length !== 1) return null;
    const table = Number(config.tables[0]);
    return TABLES.includes(table) ? table : null;
  }

  function entrainementDeConfig(config) {
    const types = [...new Set(config.questionTypes || [])].sort().join("+");
    if (types === "direct") return "desordre";
    if (types === "division+missing") return "trous";
    if (types === "direct+division+missing") return "mixte";
    return null;
  }

  // Dit ce qu'une série représente pour le parcours (ou null si elle ne compte pas).
  function classerSerie(parcours, config) {
    if (!config || !config.mode) return null;
    const table = tableDuParcours(config);
    if (config.mode === "learn") {
      if (table === null || !ACTIVITES_APPRENDS.includes(config.learnActivity)) return null;
      return {type: "apprends", table, activite: config.learnActivity};
    }
    if (config.mode === "train") {
      const entrainement = entrainementDeConfig(config);
      if (table === null || !entrainement || Number(config.total) !== SEUILS.entrainement.total) return null;
      return {type: "entraine", table, entrainement};
    }
    if (config.mode === "validation") {
      const duree = Number(config.duration);
      if (Number(config.total) !== SEUILS.validation.total || !duree) return null;
      // Le mélange a le format du test, sur EXACTEMENT les tables passées (au
      // moins 2), en 1 min 30 — un mélange choisi à la main, ou joué en 2 ou
      // 3 minutes, n'est pas « Mon mélange ».
      const tables = (config.tables || []).map(Number);
      if (tables.length > 1) {
        const acquises = tablesAcquises(parcours);
        if (acquises.length >= SEUILS.melange.tablesMin && memesTables(tables, acquises) && duree <= SEUILS.melange.dureeMax) {
          return {type: "melange", tables: acquises};
        }
        return null;
      }
      if (table === null) return null;
      return duree <= SEUILS.validation.dureeMax
        ? {type: "validation", table}
        : {type: "preparation", table, duree};
    }
    if (config.mode === "test" && config.course === "records") {
      // La course des records (lot « Les records ») : les 25 questions de la
      // couronne, toutes les tables, sans limite de temps. Seule une Légende
      // (couronne gagnée) court ; pour un autre, la série ne compte pas.
      if (Number(config.total) !== SEUILS.course.total || entier(config.testLevel, 1, 3, 1) !== 3) return null;
      if (!memesTables((config.tables || []).map(Number), TABLES) || !parcours.expert.couronne) return null;
      return {type: "course"};
    }
    if (config.mode === "test") {
      // Une marche de l'escalier : 25 questions, produits + trous + divisions
      // (niveau 3), les tables 2 à 10, et une des cinq durées. L'escalier doit
      // être ouvert : sinon la série ne compte pas.
      const duree = Number(config.duration);
      const etoile = SEUILS.etoile.durees.indexOf(duree) + 1;
      if (Number(config.total) !== SEUILS.etoile.total || !etoile || entier(config.testLevel, 1, 3, 1) !== 3) return null;
      if (!memesTables((config.tables || []).map(Number), TABLES) || !escalierOuvert(parcours)) return null;
      // D5 (décision de Gwenaël, 14/10/2026) : pas de saut d'étoiles — seule
      // la marche suivante compte ; une autre ne compte pas (pas même en
      // rejouant une marche gagnée), sauf la couronne rejouée par la Légende.
      const suivante = parcours.expert.etoiles + 1;
      const couronneRejouee = etoile === ETOILES_MAX && Boolean(parcours.expert.couronne);
      if (etoile !== suivante && !couronneRejouee) return null;
      return {type: "etoile", etoile};
    }
    return null;
  }

  function demarrerSerie(parcours, config) {
    const classement = classerSerie(parcours, config);
    if (!classement || classement.type !== "apprends") return parcours;
    const copie = cloner(parcours);
    const ligne = copie.tables[classement.table];
    if (ligne.apprends[classement.activite] === 0) ligne.apprends[classement.activite] = 1;
    return copie;
  }

  // Une table de plus est passée. La neuvième ouvre l'escalier des étoiles.
  function acquerir(copie, table, date, evenements) {
    const ligne = copie.tables[table];
    if (ligne.acquise) return false;
    ligne.acquise = date;
    copie.melange.tables = tablesAcquises(copie);
    if (toutesAcquises(copie)) evenements.push({type: "toutes-acquises"});
    return true;
  }

  // Le rang a-t-il monté ? Alors un événement le dit (écran de rang).
  function relancerRang(copie, evenements) {
    const nouveau = rangDeLEtat(copie);
    if (nouveau <= copie.rang) return;
    copie.rang = nouveau;
    evenements.push({type: "rang", rang: nouveau, nom: RANGS[nouveau].nom, cle: RANGS[nouveau].cle});
  }

  // Le premier calcul raté deux fois dans une série (« 7-8 »), ou null.
  // « rates » : la clé de chaque question pas réussie (fausse, passée, ou
  // pas atteinte avant la fin du temps), dans l'ordre de la série. Sans liste
  // (un appel d'avant ce lot), rien n'est raté deux fois : l'ancienne règle.
  function calculRateDeuxFois(rates) {
    if (!Array.isArray(rates)) return null;
    const vus = new Set();
    for (const cle of rates.slice(0, 100)) {
      const texte = String(cle);
      if (!/^(10|[1-9])-(10|[1-9])$/.test(texte)) continue;
      if (vus.has(texte)) return texte;
      vus.add(texte);
    }
    return null;
  }

  // Applique une série TERMINÉE au parcours. resultat = {correct, total, date,
  // rates} — « rates » seulement pour le test et « comme le test ».
  function appliquerSerie(parcours, config, resultat) {
    const evenements = [];
    const classement = classerSerie(parcours, config);
    if (!classement) return {parcours, evenements, classement: null};
    const copie = cloner(parcours);
    const date = dateOuNull(resultat && resultat.date) || jourLocal();
    const correct = entier(resultat && resultat.correct, 0, 100);
    const total = entier(resultat && resultat.total, 1, 100, 1);
    const erreurs = total - correct;

    if (classement.type === "apprends") {
      const ligne = copie.tables[classement.table];
      ligne.apprends[classement.activite] = 2;
      ligne.fois[classement.activite] = Math.min(FOIS_MAX, ligne.fois[classement.activite] + 1);
      const termines = ACTIVITES_APPRENDS.filter(activite => ligne.apprends[activite] === 2).length;
      evenements.push({type: "apprends", table: classement.table, activite: classement.activite, termines, fois: ligne.fois[classement.activite]});
    } else if (classement.type === "entraine") {
      const ligne = copie.tables[classement.table];
      const reussi = erreurs <= SEUILS.entrainement.erreursMax;
      const dejaReussi = ligne.entraine[classement.entrainement] === 2;
      if (reussi) ligne.entraine[classement.entrainement] = 2;
      else if (ligne.entraine[classement.entrainement] === 0) ligne.entraine[classement.entrainement] = 1;
      ligne.entraine.dernier = {entrainement: classement.entrainement, score: correct, total};
      // Un entraînement terminé compte, réussi ou non : c'est le nombre de
      // fois où l'élève s'est entraîné, pas le nombre de réussites (les
      // ronds disent déjà « réussi »).
      ligne.fois[classement.entrainement] = Math.min(FOIS_MAX, ligne.fois[classement.entrainement] + 1);
      // 9 sur 10 ou mieux (10 sur 10 jusqu'au lot M1) : retenu pour le
      // raccourci vers la validation.
      if (erreurs <= SEUILS.seance.raccourciErreursMax && CLES_SANS_FAUTE.includes(classement.entrainement)) ligne.sansFaute[classement.entrainement] = 1;
      const reussites = ENTRAINEMENTS.filter(entrainement => ligne.entraine[entrainement] === 2).length;
      evenements.push({
        type: "entraine",
        table: classement.table,
        entrainement: classement.entrainement,
        reussi,
        nouveau: reussi && !dejaReussi,
        score: correct,
        total,
        reussites,
        pret: reussites === ENTRAINEMENTS.length,
        fois: ligne.fois[classement.entrainement],
        // Les trois réussis ET les 8 calculs en boîte 3 : « tu peux valider » ;
        // sinon l'écran de résultat annonce le rendez-vous (validationTable).
        validation: validationTable(copie, classement.table, date)
      });
    } else if (classement.type === "validation") {
      // Lot « test : pas deux fois le même calcul » (16/10/2026, décision de
      // Gwenaël) : 2 erreurs au plus, et jamais les deux sur le même calcul —
      // au test, chaque calcul sort deux fois ; les rater toutes les deux,
      // c'est ne pas le savoir. Lot « test : une erreur au plus » (21/10) :
      // SEUILS.validation.erreursMax vaut 1, la règle du même calcul ne peut
      // plus faire rater à elle seule (deux ratés, c'est déjà trop) ; elle
      // reste, inoffensive, si le seuil remontait un jour.
      const deuxFois = calculRateDeuxFois(resultat && resultat.rates);
      const reussi = erreurs <= SEUILS.validation.erreursMax && !deuxFois;
      const dejaAcquise = Boolean(copie.tables[classement.table].acquise);
      // Plus aucun verrou (lot « un seul système ») : le test réussi, la
      // table est passée. Une table déjà passée se rejoue librement.
      const evenement = {type: "validation", table: classement.table, reussi, score: correct, total, dejaAcquise, nouvelle: false};
      if (deuxFois) evenement.rateDeuxFois = deuxFois;
      evenements.push(evenement);
      if (reussi) evenement.nouvelle = acquerir(copie, classement.table, date, evenements);
    } else if (classement.type === "preparation") {
      // « Comme le test » (2 ou 3 minutes) : la même règle que le test.
      const deuxFois = calculRateDeuxFois(resultat && resultat.rates);
      const reussi = erreurs <= SEUILS.validation.erreursMax && !deuxFois;
      const evenement = {type: "preparation", table: classement.table, reussi, score: correct, total, duree: classement.duree};
      if (deuxFois) evenement.rateDeuxFois = deuxFois;
      evenements.push(evenement);
    } else if (classement.type === "melange") {
      // Mon mélange, libre : il ne ferme ni n'ouvre rien. Le parcours garde
      // le jour et le score du dernier joué.
      const reussi = erreurs <= SEUILS.melange.erreursMax;
      copie.melange.dernier = date;
      copie.melange.score = Math.min(correct, SEUILS.melange.total);
      copie.melange.aRefaireAvec = null;
      // « trophee » : la plus grande coupe gagnée par ce mélange (3 ou 6),
      // ou null ; « coupes » (lot « Mon mélange aux paliers ») : toutes celles
      // qu'il fait gagner — 6 tables sans la coupe des 3 : un seul mélange
      // réussi gagne les deux (décision de Gwenaël, 09/10).
      const avant = tropheesMelange(copie).filter(item => item.gagne).map(item => item.tables);
      if (reussi) {
        copie.melange.aJour = true;
        copie.melange.reussi = Math.max(copie.melange.reussi || 0, classement.tables.length);
      }
      const coupes = tropheesMelange(copie).filter(item => item.gagne && !avant.includes(item.tables)).map(item => item.tables);
      const trophee = coupes.length ? coupes[coupes.length - 1] : null;
      evenements.push({type: "melange", reussi, score: correct, total, tables: classement.tables, trophee, coupes});
    } else if (classement.type === "etoile") {
      const reussi = erreurs <= erreursMaxEtoile(classement.etoile);
      const avant = copie.expert.etoiles;
      const evenement = {type: "etoile", etoile: classement.etoile, reussi, score: correct, total, etoilesAvant: avant, nouveau: false, couronne: false};
      evenements.push(evenement);
      if (reussi) {
        copie.expert.dernier = date;
        // La marche suivante gagnée (classerSerie n'en laisse pas passer
        // d'autre, D5) ; la couronne rejouée ne retire rien.
        if (classement.etoile > avant) {
          copie.expert.etoiles = classement.etoile;
          evenement.nouveau = true;
        }
        if (copie.expert.etoiles === ETOILES_MAX && !copie.expert.couronne) {
          copie.expert.couronne = date;
          evenement.couronne = true;
        }
      }
    } else if (classement.type === "course") {
      // La course des records ne change RIEN au parcours (le classement vit
      // sur le serveur) : l'événement dit seulement si les 25 sont justes.
      // Le temps, c'est la page qui l'a ; courseCompte() le juge.
      evenements.push({type: "course", reussi: erreurs <= SEUILS.course.erreursMax, score: correct, total});
    }
    relancerRang(copie, evenements);
    return {parcours: copie, evenements, classement};
  }

  /* ---------- Les records (lot du 09/10/2026) ---------- */

  // La course : les 25 questions de la couronne, sans limite de temps. La
  // page marque la configuration (« course ») : le noyau n'en sait rien, et
  // c'est la page qui remet « duration » à null après normalisation.
  function configCourse() {
    return {mode: "test", tables: [...TABLES], testLevel: 3, total: SEUILS.course.total, duration: null, course: "records"};
  }

  // Une Légende des tables peut courir : la couronne est gagnée. (Que les
  // records soient ouverts à sa classe, et qu'elle soit suivie par un code,
  // c'est la page qui le sait.)
  function recordsPossibles(parcours) {
    return Boolean(parcours && parcours.expert && parcours.expert.couronne);
  }

  // Un temps de course compte-t-il ? 25 sur 25, et un temps humain.
  // Rend {compte, raison} ; raison : null, « erreurs », « rapide », « long ».
  function courseCompte(correct, total, dixiemes) {
    const justes = entier(correct, 0, 100);
    const nombre = entier(total, 1, 100, SEUILS.course.total);
    const temps = entier(dixiemes, 0, Number.MAX_SAFE_INTEGER, 0);
    if (nombre !== SEUILS.course.total || nombre - justes > SEUILS.course.erreursMax) return {compte: false, raison: "erreurs"};
    if (temps < SEUILS.course.dixiemesMin) return {compte: false, raison: "rapide"};
    if (temps > SEUILS.course.dixiemesMax) return {compte: false, raison: "long"};
    return {compte: true, raison: null};
  }

  // « 49,8 s », « 1 min 01,3 s » (décision de Gwenaël, 09/10/2026) : les
  // dixièmes toujours, la minute écrite quand il y en a.
  function formatTemps(dixiemes) {
    const temps = entier(dixiemes, 0, Number.MAX_SAFE_INTEGER, 0);
    const minutes = Math.floor(temps / 600);
    const reste = temps - minutes * 600;
    const secondes = `${Math.floor(reste / 10)},${reste % 10}\u00a0s`;
    if (!minutes) return secondes;
    return `${minutes}\u00a0min\u00a0${reste < 100 ? "0" : ""}${secondes}`;
  }

  // « 1er », « 2e », « 14e ».
  function libelleRang(rang) {
    const nombre = entier(rang, 1, 100000, 0);
    if (!nombre) return "";
    return nombre === 1 ? "1er" : `${nombre}e`;
  }

  // Configurations prêtes à donner à l'appli (à normaliser par le moteur de questions).
  function configApprends(table, activite) {
    return {mode: "learn", tables: [table], learnActivity: activite};
  }

  function configEntraine(table, entrainement) {
    return {mode: "train", tables: [table], total: SEUILS.entrainement.total, questionTypes: [...CONFIG_ENTRAINEMENTS[entrainement].questionTypes]};
  }

  function configValidation(table, duree = SEUILS.validation.dureeMax) {
    return {mode: "validation", tables: [table], total: SEUILS.validation.total, duration: duree};
  }

  // Le mélange de mes tables passées : le format du test, sur toutes les
  // tables passées (au moins 2) — jusqu'aux 9.
  function configMelange(parcours) {
    const acquises = tablesAcquises(parcours);
    if (acquises.length < SEUILS.melange.tablesMin) return null;
    return {mode: "validation", tables: acquises, total: SEUILS.melange.total, duration: SEUILS.melange.dureeMax};
  }

  // Les coupes de Mon mélange : « gagne » — il a été réussi avec au moins
  // ce nombre de tables ; « aGagner » — pas encore gagnée, et l'élève a assez
  // de tables passées pour la tenter maintenant. (Lot « Mon mélange aux
  // paliers » : deux coupes, 3 et 6 tables — voir SEUILS.melange. La « coupe
  // des 9 », et coupeDesNeuf qui la lisait, n'existent plus.)
  function tropheesMelange(parcours) {
    const passees = tablesAcquises(parcours).length;
    const reussi = parcours.melange.reussi || 0;
    return SEUILS.melange.trophees.map(tables => ({tables, gagne: reussi >= tables, aGagner: reussi < tables && passees >= tables}));
  }

  // Lot « Mon mélange aux paliers » (09/10/2026, décisions de Gwenaël) : ses
  // élèves passaient les tables une à une par « Je passe le test » sans
  // jamais faire Mon mélange. Dès 3 tables passées (puis 6), tant que la
  // coupe n'est pas gagnée, Mon mélange — ses N tables passées, 1 min 30 —
  // passe AVANT : 2e étape de chaque séance (après Mes calculs du jour), et
  // avant chaque test d'une nouvelle table lancé par le bouton. Raté, la
  // suite vient quand même : aucun verrou ; il revient à la séance suivante
  // et au test suivant, jusqu'à la coupe. Pas à 9 tables : là, c'est
  // l'escalier des étoiles.
  function melangeAuPalier(parcours) {
    if (toutesAcquises(parcours)) return false;
    return tropheesMelange(parcours).some(trophee => trophee.aGagner);
  }

  // Le test d'une table pas encore passée, lancé hors de la séance : Mon
  // mélange vient-il d'abord ? (La page l'enchaîne : Mes calculs du jour s'il
  // n'est pas fait, Mon mélange, puis le test.)
  function melangeAvantLeTest(parcours, config) {
    const classement = classerSerie(parcours, config);
    if (!classement || classement.type !== "validation") return false;
    if (parcours.tables[classement.table].acquise) return false;
    return melangeAuPalier(parcours);
  }

  // Les erreurs permises sur une marche : 2, sauf la couronne (aucune).
  function erreursMaxEtoile(etoile) {
    return entier(etoile, 1, ETOILES_MAX, 1) === ETOILES_MAX ? SEUILS.etoile.erreursMaxCouronne : SEUILS.etoile.erreursMax;
  }

  // Une marche de l'escalier (1 à 5) : tout, de plus en plus vite.
  function configEtoile(etoile) {
    const marche = entier(etoile, 1, ETOILES_MAX, 1);
    return {mode: "test", tables: [...TABLES], testLevel: 3, total: SEUILS.etoile.total, duration: SEUILS.etoile.durees[marche - 1]};
  }

  function dureeEtoile(etoile) {
    return SEUILS.etoile.durees[entier(etoile, 1, ETOILES_MAX, 1) - 1];
  }

  /* ---------- Mes calculs (grille des 36 faits) ---------- */

  function dateDuJour(valeur) {
    return dateOuNull(valeur) || jourLocal();
  }

  function melanger(valeurs, random = Math.random) {
    const copie = valeurs.slice();
    for (let index = copie.length - 1; index > 0; index -= 1) {
      const echange = Math.floor(random() * (index + 1));
      [copie[index], copie[echange]] = [copie[echange], copie[index]];
    }
    return copie;
  }

  // Normalise une clé de fait (« 7-8 », « 8-7 »…) vers « min-max », ou null si
  // le calcul est hors grille (facteur 0, 1 ou 10).
  function cleFait(valeur) {
    const partie = String(valeur ?? "").split("-").map(Number);
    if (partie.length !== 2 || partie.some(nombre => !Number.isInteger(nombre))) return null;
    const premier = Math.min(partie[0], partie[1]);
    const second = Math.max(partie[0], partie[1]);
    if (premier < FAIT_MIN || second > FAIT_MAX) return null;
    return `${premier}-${second}`;
  }

  function facteursFait(cle) {
    const [premier, second] = cle.split("-").map(Number);
    return [premier, second];
  }

  function libelleFait(cle) {
    const [premier, second] = facteursFait(cle);
    return `${premier} × ${second}`;
  }

  function faitsDeLaTable(table) {
    return FAITS.filter(cle => facteursFait(cle).includes(Number(table)));
  }

  // Les trois couleurs ne bougent pas avec les cinq boîtes : rouge « à revoir »
  // = boîte 1, bleu « en route » = boîtes 2 et 3, vert « su » = boîtes 4 et 5.
  const BOITE_SU = 4;

  function etatFait(fait) {
    if (!fait) return "jamais-vu";
    if (fait.boite >= BOITE_SU) return "su";
    if (fait.boite <= 1) return "a-travailler";
    return "en-cours";
  }

  // Un calcul est dû quand son jour de retour est arrivé (ou passé) — sauf
  // s'il a été raté ce jour-là : il est déjà revenu une fois en fin de série
  // (règle du 09/09), il ne peut plus monter aujourd'hui (pas de regain le
  // jour d'une erreur), le reproposer ne servirait qu'à tourner en rond.
  // Il sera dû demain.
  function faitDu(fait, aujourdhui = jourLocal()) {
    return Boolean(fait) && (!fait.echeance || fait.echeance <= aujourdhui) && fait.erreur !== aujourdhui;
  }

  // La grille Mes calculs appartient à Mon parcours : elle se remplit dans les
  // séries du parcours (Je m'entraîne, validations, mélanges, Expert) et dans
  // les révisions — jamais pendant J'apprends (on y construit la table de
  // proche en proche, on ne répond pas de mémoire), et jamais dans Réglages ni
  // l'évaluation CM1, qui restent complètement à part du parcours.
  function serieAlimenteGrille(config) {
    if (!config || !config.mode) return false;
    return ["train", "validation", "test", "revision"].includes(config.mode);
  }

  // Applique UNE réponse à la grille. reponse = {correcte, date}.
  // Lot mémoire : un calcul monte d'une boîte quand il est DÛ et réussi ; pas
  // dû, une bonne réponse ne change rien (savoir, c'est retrouver le calcul le
  // jour où il revient, pas le répéter dans l'heure). Une erreur = une boîte de
  // moins, et le calcul revient aujourd'hui ; ce jour-là, pas de regain sur ce
  // calcul : le raté « revient dans un nouveau défi » (Claire), un autre jour.
  // Une erreur compte toujours (une réussite juste après la correction prouve
  // peu, une erreur prouve beaucoup), mais la boîte ne descend qu'UNE fois par
  // jour pour un même calcul (22/10/2026) — comme elle ne monte qu'une fois.
  function appliquerReponse(parcours, cleBrute, reponse = {}) {
    const cle = cleFait(cleBrute);
    if (!cle) {
      // Hors grille : un bout de rangée (× 1, × 10, la table de 10). Il se
      // remplit à la première réussite et ne se vide plus ; rien d'autre ne
      // bouge (ni boîte, ni jour travaillé).
      const bouts = reponse.correcte ? boutsDuCalcul(cleBrute).filter(([table, multiplicateur]) => !parcours.tables[table].bouts.includes(multiplicateur)) : [];
      if (!bouts.length) return {parcours, fait: null, bouts: []};
      const copie = cloner(parcours);
      bouts.forEach(([table, multiplicateur]) => {
        copie.tables[table].bouts = normaliserBouts(table, [...copie.tables[table].bouts, multiplicateur]);
      });
      return {parcours: copie, fait: null, bouts};
    }
    const copie = cloner(parcours);
    const date = dateDuJour(reponse.date);
    // Un jour compte dès qu'une série de la grille est jouée (Je m'entraîne,
    // validations, mélanges, étoiles, révisions) — jamais J'apprends.
    noterJour(copie, date);
    const avant = copie.calculs[cle] || null;
    // Un calcul jamais vu part de la boîte 1, dû : sa première réponse compte.
    const du = !avant || faitDu(avant, date);
    const fait = {
      boite: avant ? avant.boite : 1,
      cases: 0,
      vu: date,
      erreur: avant ? avant.erreur : null,
      gagne: avant ? avant.gagne : null,
      echeance: avant ? avant.echeance : date
    };
    let monte = false;
    let descend = false;
    if (reponse.correcte) {
      if (du && fait.erreur !== date) {
        if (fait.boite < SEUILS.revision.boites) {
          fait.boite += 1;
          monte = true;
        }
        // Boîte 5 : la réussite renouvelle l'échéance — l'entretien.
        fait.gagne = date;
        fait.echeance = echeanceDeBoite(fait.boite, date);
      }
    } else {
      // Lot « une descente par jour » (décision de Gwenaël du 22/10/2026) :
      // au plus une boîte de moins par jour pour un même calcul — le
      // symétrique de la montée (une boîte par jour au plus). Déjà raté ce
      // jour : l'erreur reste notée, le calcul reste dû demain, la boîte ne
      // bouge plus. Avant : chaque erreur descendait, sans limite par jour.
      if (fait.erreur !== date) {
        descend = fait.boite > 1;
        fait.boite = Math.max(1, fait.boite - 1);
      }
      fait.erreur = date;
      fait.echeance = date;
    }
    fait.cases = casesDeBoite(fait.boite);
    copie.calculs[cle] = fait;
    return {parcours: copie, fait: {cle, boite: fait.boite, etat: etatFait(fait), du, monte, descend, echeance: fait.echeance}};
  }

  // Les bouts qu'un calcul hors grille remplit : [table, multiplicateur].
  // « 3-10 » est le × 10 de la table de 3 ET le × 3 de la table de 10.
  function boutsDuCalcul(cleBrute) {
    const partie = String(cleBrute ?? "").split("-").map(Number);
    if (partie.length !== 2 || partie.some(nombre => !Number.isInteger(nombre))) return [];
    const [premier, second] = partie;
    const paires = premier === second ? [[premier, second]] : [[premier, second], [second, premier]];
    return paires.filter(([table, multiplicateur]) => TABLES.includes(table) && multiplicateursBouts(table).includes(multiplicateur));
  }

  // Le résumé de la grille : par couleur, par boîte, et le nombre de calculs
  // dus aujourd'hui.
  function resumeCalculs(parcours, aujourdhui = jourLocal()) {
    const resume = {sus: 0, enCours: 0, aTravailler: 0, jamaisVus: 0, dus: 0, total: FAITS.length, boites: new Array(SEUILS.revision.boites).fill(0)};
    FAITS.forEach(cle => {
      const fait = parcours.calculs[cle];
      const etat = etatFait(fait);
      if (etat === "su") resume.sus += 1;
      else if (etat === "en-cours") resume.enCours += 1;
      else if (etat === "a-travailler") resume.aTravailler += 1;
      else resume.jamaisVus += 1;
      if (fait) {
        resume.boites[fait.boite - 1] += 1;
        if (faitDu(fait, aujourdhui)) resume.dus += 1;
      }
    });
    return resume;
  }

  // La grille 8×8 prête à afficher : lignes 2 à 9, colonnes 2 à 9. La moitié
  // haute (ligne ≤ colonne) est active, l'autre est le miroir grisé du même fait.
  function grilleCalculs(parcours, aujourdhui = jourLocal()) {
    const facteurs = Array.from({length: FAIT_MAX - FAIT_MIN + 1}, (_, index) => index + FAIT_MIN);
    const lignes = facteurs.map(ligne => ({
      ligne,
      cellules: facteurs.map(colonne => {
        const cle = cleFait(`${ligne}-${colonne}`);
        const fait = parcours.calculs[cle] || null;
        return {
          ligne,
          colonne,
          cle,
          active: ligne <= colonne,
          boite: fait ? fait.boite : 0,
          etat: etatFait(fait),
          du: faitDu(fait, aujourdhui),
          echeance: fait ? fait.echeance : null,
          vu: fait ? fait.vu : null,
          erreur: fait ? fait.erreur : null
        };
      })
    }));
    return {lignes, resume: resumeCalculs(parcours, aujourdhui)};
  }

  // Les calculs d'une boîte (1 à 5), dans l'ordre de la grille.
  function calculsDeLaBoite(parcours, boite) {
    const rang = entier(boite, 1, SEUILS.revision.boites, 0);
    return FAITS.filter(cle => parcours.calculs[cle] && parcours.calculs[cle].boite === rang);
  }

  function trierParEcheance(entrees) {
    return entrees.slice().sort((premier, second) =>
      String(premier[1].echeance || "").localeCompare(String(second[1].echeance || ""))
      || String(premier[1].vu || "").localeCompare(String(second[1].vu || "")));
  }

  // Les calculs dus aujourd'hui, dans l'ordre de la révision : les boîtes à
  // TOUR DE RÔLE (un rouge, un boîte 2, un boîte 3, un boîte 4, un boîte 5, un
  // rouge…), les plus en retard d'abord dans chaque boîte. Décision de Gwenaël
  // (12/09) : avec « les rouges d'abord », un élève revenu après une semaine
  // ouvrait sur dix calculs durs d'affilée ; à tour de rôle, chaque série de
  // 10 mêle du dur et du facile, et tout est couvert à la fin — bleus et verts
  // compris, c'est l'entretien. Jamais un calcul jamais rencontré.
  function calculsDus(parcours, {aujourdhui = jourLocal(), table = null} = {}) {
    const dansLaTable = cle => table === null || facteursFait(cle).includes(Number(table));
    const dus = Object.entries(parcours.calculs).filter(([cle, fait]) => dansLaTable(cle) && faitDu(fait, aujourdhui));
    return tourDeRole(dus.map(([cle, fait]) => [cle, fait]));
  }

  // Entrelace des entrées [cle, fait] boîte par boîte, chaque boîte triée par
  // échéance (le plus en retard, ou le plus proche, d'abord).
  function tourDeRole(entrees) {
    const files = Array.from({length: SEUILS.revision.boites}, (_, index) =>
      trierParEcheance(entrees.filter(([, fait]) => fait.boite === index + 1)).map(([cle]) => cle));
    const ordre = [];
    while (files.some(file => file.length)) {
      files.forEach(file => { if (file.length) ordre.push(file.shift()); });
    }
    return ordre;
  }

  // « Encore 10 calculs » quand plus rien n'est dû : les calculs connus qui
  // reviennent le plus tôt, boîtes à tour de rôle — pour s'entraîner. Rien ne
  // monte (rien n'est dû), une erreur descend : la même règle que partout.
  function calculsAVenir(parcours, {aujourdhui = jourLocal(), table = null} = {}) {
    const dansLaTable = cle => table === null || facteursFait(cle).includes(Number(table));
    const aVenir = Object.entries(parcours.calculs).filter(([cle, fait]) => dansLaTable(cle) && !faitDu(fait, aujourdhui));
    return tourDeRole(aVenir);
  }

  // ---------------------------------- Mes calculs du jour (lot « un seul système »)
  //
  // Un calcul « des tables passées » : l'une de ses deux tables est passée —
  // AVANT ce jour-là. Une table passée aujourd'hui n'entre dans Mes calculs
  // du jour que demain : sinon la porte, ouverte ce matin, se refermerait en
  // pleine journée au moment où l'élève réussit son test.
  function calculDesTablesPassees(parcours, cle, jour = jourLocal()) {
    return facteursFait(cle).some(table => {
      const ligne = parcours.tables[table];
      return Boolean(ligne && ligne.acquise && ligne.acquise < jour);
    });
  }

  // Ce que Mes calculs du jour peut prendre parmi les calculs dus : ceux des
  // tables passées. Les calculs de la table en cours restent à ses marches
  // (ils montent là, dans les entraînements et au test).
  function prisParMesCalculs(parcours, cle, jour) {
    return !SEUILS.revision.passeesSeulement || calculDesTablesPassees(parcours, cle, jour);
  }

  // Un nombre stable pour un calcul et un jour : à échéance égale, il mêle
  // les tables (sinon : 2 × 2, 2 × 3, 2 × 4… d'affilée) sans rien tirer au
  // hasard — la série annoncée par l'accueil est celle qui sera jouée.
  function grainDuJour(cle, jour) {
    let grain = 7;
    for (const caractere of `${cle}|${jour}`) grain = (grain * 31 + caractere.charCodeAt(0)) % 9973;
    return grain;
  }

  // Les calculs dus que Mes calculs du jour prendra, dans l'ordre : les boîtes
  // à tour de rôle, les plus en retard d'abord dans chaque boîte.
  function dusDuJour(parcours, aujourdhui = jourLocal()) {
    const dus = Object.entries(parcours.calculs)
      .filter(([cle, fait]) => faitDu(fait, aujourdhui) && prisParMesCalculs(parcours, cle, aujourdhui));
    const files = Array.from({length: SEUILS.revision.boites}, (_, index) => dus
      .filter(([, fait]) => fait.boite === index + 1)
      .sort((premier, second) => String(premier[1].echeance || "").localeCompare(String(second[1].echeance || ""))
        || grainDuJour(premier[0], aujourdhui) - grainDuJour(second[0], aujourdhui))
      .map(([cle]) => cle));
    const ordre = [];
    while (files.some(file => file.length)) {
      files.forEach(file => { if (file.length) ordre.push(file.shift()); });
    }
    return ordre;
  }

  // La série de Mes calculs du jour : dix calculs au plus, jamais deux fois
  // le même.
  //  - la première de la journée (la porte) : les calculs dus, puis, s'il en
  //    manque, des calculs des tables passées vus depuis le plus longtemps
  //    (« complement ») — vus AVANT aujourd'hui seulement, pas ratés
  //    aujourd'hui, et pas attendus demain (ceux-là seront posés demain,
  //    le jour où ils peuvent monter) ; moins de dix s'il n'y en a pas assez ;
  //  - une fois jouée (calculsDuJour = aujourd'hui) : les calculs dus qui
  //    restent, sans complément.
  // « restants » : les calculs dus que cette série ne prend pas (au-delà de dix).
  function serieDuJour(parcours, {aujourdhui = jourLocal()} = {}) {
    const total = SEUILS.revision.total;
    const tousDus = dusDuJour(parcours, aujourdhui);
    const dus = tousDus.slice(0, total);
    const faite = parcours.calculsDuJour === aujourdhui;
    const serie = {cles: dus, dus: dus.length, complement: 0, restants: tousDus.length - dus.length, faite};
    if (faite || dus.length >= total) return serie;
    const pris = new Set(tousDus);
    const demain = ajouterJours(aujourdhui, 1);
    const reserve = Object.entries(parcours.calculs)
      .filter(([cle, fait]) => !pris.has(cle) && fait.vu < aujourdhui && fait.erreur !== aujourdhui && !faitDu(fait, demain) && calculDesTablesPassees(parcours, cle, aujourdhui))
      .sort((premier, second) => String(premier[1].vu).localeCompare(String(second[1].vu))
        || grainDuJour(premier[0], aujourdhui) - grainDuJour(second[0], aujourdhui))
      .slice(0, total - dus.length)
      .map(([cle]) => cle);
    serie.cles = dus.concat(reserve);
    serie.complement = reserve.length;
    return serie;
  }

  // La porte : Mes calculs du jour n'a pas encore été joué aujourd'hui et il
  // y a de quoi le jouer. Tant qu'elle est fermée, l'accueil n'ouvre rien
  // d'autre. Le premier jour (aucun calcul vu avant aujourd'hui), rien n'est
  // fermé.
  function mesCalculsAFaire(parcours, aujourdhui = jourLocal()) {
    return parcours.calculsDuJour !== aujourdhui && serieDuJour(parcours, {aujourdhui}).cles.length > 0;
  }

  // Le temps de Mes calculs du jour, en secondes, pour une série de N calculs.
  function dureeMesCalculs(nombre) {
    return Math.max(SEUILS.revision.dureeMin, entier(nombre, 0, 100) * SEUILS.revision.secondesParCalcul);
  }

  // Les calculs en retard : dus AVANT aujourd'hui et pas encore refaits —
  // parmi ceux que Mes calculs du jour prend. C'est le compteur de la page
  // du professeur — rien d'autre n'y est ajouté.
  function calculsEnRetard(parcours, aujourdhui = jourLocal()) {
    return Object.entries(parcours.calculs)
      .filter(([cle, fait]) => fait.echeance && fait.echeance < aujourdhui && prisParMesCalculs(parcours, cle, aujourdhui))
      .map(([cle]) => cle);
  }

  // L'agenda de la grille : combien de calculs sont dus aujourd'hui, combien
  // attendront demain si rien d'autre n'est joué, et le prochain jour où
  // quelque chose revient (avec son nombre) — pour « Reviens demain : N
  // calculs t'attendront ».
  // Lot « un seul système » : seuls comptent les calculs que Mes calculs du
  // jour prend ce jour-là (ceux des tables passées avant ce jour).
  function agendaCalculs(parcours, aujourdhui = jourLocal()) {
    const faits = Object.entries(parcours.calculs);
    const demainJour = ajouterJours(aujourdhui, 1);
    const dusLe = jour => faits.filter(([cle, fait]) => faitDu(fait, jour) && prisParMesCalculs(parcours, cle, jour)).length;
    const dus = dusLe(aujourdhui);
    const demain = dusLe(demainJour);
    // Le prochain jour (après aujourd'hui) où un calcul revient, et tout ce qui
    // sera dû ce jour-là — les dus d'aujourd'hui restés dus compris.
    let prochain = null;
    if (demain) prochain = {jour: demainJour, dans: 1, calculs: demain};
    else {
      const jours = [...new Set(faits.map(([, fait]) => fait.echeance).filter(jour => jour && jour > aujourdhui))].sort();
      const jour = jours.find(candidat => dusLe(candidat) > 0);
      if (jour) prochain = {jour, dans: ecartJours(aujourdhui, jour), calculs: dusLe(jour)};
    }
    return {dus, demain, prochain};
  }

  function trierParErreurRecente(entrees) {
    return entrees.slice().sort((premier, second) => String(second[1].erreur || "").localeCompare(String(premier[1].erreur || "")));
  }

  function calculsATravailler(parcours, table = null) {
    const dansLaTable = cle => table === null || facteursFait(cle).includes(Number(table));
    const entrees = Object.entries(parcours.calculs)
      .filter(([cle, fait]) => dansLaTable(cle) && etatFait(fait) === "a-travailler");
    return trierParErreurRecente(entrees).map(([cle]) => cle);
  }

  // Tables acquises dont au moins 2 calculs sont « à travailler » : le ✓ reste,
  // la carte gagne un repère « à revoir ».
  function tablesARevoir(parcours) {
    return tablesAcquises(parcours).filter(table => calculsATravailler(parcours, table).length >= SEUILS.revision.aRevoirMin);
  }

  // Le plan de révision (lot mémoire) : LES CALCULS DUS AUJOURD'HUI, dans
  // l'ordre de calculsDus — rouges d'abord, puis par ancienneté d'échéance,
  // verts compris — et RIEN d'autre, 10 à la fois ; s'il en reste, la série
  // suivante prend les suivants. La révision ne propose JAMAIS un calcul
  // jamais vu (décision de Gwenaël, spécification du 29/08/2026 rappelée le
  // 08/09) : elle répare et entretient ce que la grille connaît, et la grille
  // se remplit dans les entraînements, les validations, les mélanges et les
  // étoiles. Rien de dû (ou grille vide) = aucune question.
  // « libre » (Encore 10 calculs) : plus rien n'est dû, on prend les prochains
  // à revenir. L'ordre de passage est mélangé dans les deux cas.
  // Lot « un seul système » : sans table, c'est la série de Mes calculs du
  // jour (serieDuJour : les dus, puis le complément la première fois).
  function planRevision(parcours, {table = null, random = Math.random, aujourdhui = jourLocal(), libre = false} = {}) {
    const source = libre ? calculsAVenir(parcours, {aujourdhui, table})
      : table === null ? serieDuJour(parcours, {aujourdhui}).cles
      : calculsDus(parcours, {aujourdhui, table});
    const selection = melanger(source.slice(0, SEUILS.revision.total), random);
    // La forme suit ce que l'élève a déjà rencontré (décision de Gwenaël,
    // 12/09) : produit toujours ; trou ET division (lot « divisions »,
    // 04/10/2026) si l'une des deux tables du calcul a passé l'entraînement
    // « nombres manquants et divisions » ou est acquise (la validation en
    // contient) ; division seule dès la première étoile. Les formes permises
    // alternent d'une question à l'autre.
    // Lot « trois divisions » (09/10/2026) : les divisions de la série
    // prennent les trois écritures à tour de rôle (56 ÷ 7 = ?, ? ÷ 7 = 8,
    // 56 ÷ ? = 8), dans un ordre tiré à la première division — deux
    // divisions dans la série, deux écritures différentes. Rien n'est tiré
    // de plus dans une série sans division.
    let ecritures = null;
    let rangDivision = 0;
    return selection.map((cle, index) => {
      let [premier, second] = melanger(facteursFait(cle), random);
      const permises = formesPermises(parcours, cle);
      // Lot « divisions » : une question sur deux reste un résultat ; l'autre
      // alterne nombre manquant et division (le sens, 56 ÷ 7 ou 56 ÷ 8, selon
      // l'ordre tiré des facteurs) — la part des questions « à l'envers » ne
      // change pas.
      const tour = permises.includes("missing") && permises.includes("division") ? ["direct", "missing", "direct", "division"] : permises;
      const categorie = tour[index % tour.length];
      let type = "direct";
      if (categorie === "division") {
        if (!ecritures) ecritures = melanger(FORMES_DIVISION, random);
        type = ecritures[rangDivision++ % ecritures.length];
      } else if (categorie !== "direct") {
        type = FORMES_TROU[Math.floor(random() * FORMES_TROU.length)];
      }
      // Un nombre manquant se pose comme dans les entraînements de la table
      // que l'élève connaît : c'est ELLE qui est écrite, et l'autre nombre
      // qui manque (« 2 × ? = 16 », jamais « 16 = 8 × ? » pour qui n'a que
      // la table de 2). Les deux tables connues, ou aucune : comme tiré.
      if (categorie === "missing" && premier !== second) {
        const connues = [premier, second].filter(facteur => tableConnue(parcours, facteur));
        if (connues.length === 1) {
          const ecrit = connues[0];
          const cherche = ecrit === premier ? second : premier;
          [premier, second] = type === "right" || type === "reverse-right" ? [ecrit, cherche] : [cherche, ecrit];
        }
      }
      return {cle, type, first: premier, second};
    });
  }

  // Une table que l'élève connaît ou travaille : passée, ou commencée.
  function tableConnue(parcours, table) {
    const ligne = parcours.tables[table];
    return Boolean(ligne) && (Boolean(ligne.acquise) || tableCommencee(ligne));
  }

  // Les formes qu'un calcul peut prendre en révision : « direct » toujours ;
  // « missing » ET « division » si une de ses tables a réussi l'entraînement
  // « trous » (nombres manquants et divisions, lot « divisions ») ou est
  // acquise (la validation en contient) ; « division » aussi dès une étoile.
  function formesPermises(parcours, cle) {
    const formes = ["direct"];
    const trous = facteursFait(cle).some(table => {
      const ligne = parcours.tables[table];
      return Boolean(ligne) && (ligne.entraine.trous === 2 || Boolean(ligne.acquise));
    });
    if (trous) formes.push("missing", "division");
    else if (parcours.expert.etoiles >= 1) formes.push("division");
    return formes;
  }

  function configRevision(table = null) {
    return {mode: "revision", table: TABLES.includes(Number(table)) ? Number(table) : null};
  }

  // Le point sur la validation d'une table (lot « dosage + validation »,
  // 19/09/2026) : ses 8 calculs (pour la table de 7 : 2-7, 3-7, 4-7, 5-7,
  // 6-7, 7-7, 7-8, 7-9 — ni ×0, ni ×1, ni ×10, clé « min-max ») et où ils
  // en sont. « prets » : en boîte 3 ou plus. Les autres : jamais rencontrés
  // (« inconnus »), dus aujourd'hui (« dus »), ou attendus plus tard
  // (« prochain » = le premier jour où l'un d'eux revient, et dans combien
  // de jours). C'est ce que l'accueil lit pour dire « tes 8 calculs ont
  // rendez-vous demain ».
  function validationTable(parcours, table, aujourdhui = jourLocal()) {
    const faits = faitsDeLaTable(table);
    let prets = 0, inconnus = 0, dus = 0;
    const aVenir = [];
    faits.forEach(cle => {
      const fait = parcours.calculs[cle];
      if (!fait) { inconnus += 1; return; }
      if (fait.boite >= SEUILS.validation.boiteMin) { prets += 1; return; }
      if (faitDu(fait, aujourdhui)) { dus += 1; return; }
      // Pas dû aujourd'hui : soit son jour de retour est à venir, soit il a
      // été raté aujourd'hui (il revient demain).
      aVenir.push(fait.echeance && fait.echeance > aujourdhui ? fait.echeance : ajouterJours(aujourdhui, 1));
    });
    aVenir.sort();
    const prochain = aVenir.length ? {jour: aVenir[0], dans: ecartJours(aujourdhui, aVenir[0])} : null;
    return {total: faits.length, prets, inconnus, dus, aVenir: aVenir.length, prochain, prete: prets === faits.length};
  }

  // L'étape conseillée d'une table — le rond bleu de l'accueil. Règle de
  // Gwenaël (10/09/2026) : J'apprends tant que les cinq activités ne sont pas
  // TOUTES terminées ET qu'aucun entraînement n'est réussi ; dès que l'un des
  // deux est vrai, Je m'entraîne ; les trois entraînements réussis, la
  // validation. « Finir un J'apprends ne veut pas dire qu'il connaît » — et
  // celui qui réussit un entraînement de lui-même n'a plus à découvrir la
  // table. Jusqu'au lot 4a, J'apprends n'était conseillé qu'à une table jamais
  // touchée : la première activité commencée envoyait déjà s'entraîner.
  // Depuis le 19/09/2026 : les trois entraînements réussis ne suffisent plus,
  // il faut AUSSI les 8 calculs de la table en boîte 3 (validationTable) —
  // sinon le rond reste sur Je m'entraîne et l'accueil explique le
  // rendez-vous. Sans grille (ancien appel avec la ligne seule), la règle
  // d'avant s'applique.
  function conseilTable(ligne, validation = null) {
    if (ligne.acquise) return "valide";
    const reussites = ENTRAINEMENTS.filter(entrainement => ligne.entraine[entrainement] === 2).length;
    if (reussites === ENTRAINEMENTS.length && (!validation || validation.prete)) return "valide";
    const toutesTerminees = ACTIVITES_APPRENDS.every(activite => ligne.apprends[activite] === 2);
    return !toutesTerminees && !reussites ? "apprends" : "entraine";
  }

  function etapeTable(parcours, table, aujourdhui = jourLocal()) {
    const ligne = parcours.tables[table];
    if (ligne.acquise) return null;
    const conseil = conseilTable(ligne, validationTable(parcours, table, aujourdhui));
    if (conseil === "valide") {
      return {type: "validation", table, libelle: `Table de ${table} : passe le test (20 questions en 1 min 30)`, config: configValidation(table)};
    }
    if (conseil === "apprends") {
      // La première activité qui n'est pas terminée, dans l'ordre : les perles d'abord.
      const activite = ACTIVITES_APPRENDS.find(candidat => ligne.apprends[candidat] !== 2);
      return {type: "apprends", table, activite, libelle: `Table de ${table} : ${CONSIGNES_APPRENDS[activite]}`, config: configApprends(table, activite)};
    }
    // Les trois déjà réussis (on attend la boîte 3) : celui refait le moins
    // souvent, le premier en cas d'égalité.
    const entrainement = ENTRAINEMENTS.find(candidat => ligne.entraine[candidat] !== 2)
      || ENTRAINEMENTS.reduce((moins, candidat) => (ligne.fois[candidat] < ligne.fois[moins] ? candidat : moins), ENTRAINEMENTS[0]);
    return {
      type: "entraine",
      table,
      entrainement,
      libelle: `Table de ${table} : entraînement « ${LIBELLES_ENTRAINEMENTS[entrainement]} »`,
      config: configEntraine(table, entrainement)
    };
  }

  function prochaineEtape(parcours, aujourdhui = jourLocal()) {
    // Mes calculs du jour passe devant tout : la porte de la journée, puis,
    // une fois jouée, les calculs dus qui restent.
    const dus = serieDuJour(parcours, {aujourdhui}).cles.length;
    if (dus) {
      return {
        type: "revision",
        dus,
        libelle: `Mes calculs du jour : ${dus} calcul${dus > 1 ? "s" : ""}`,
        config: configRevision()
      };
    }
    for (const table of ORDRE_CONSEIL) {
      const etape = etapeTable(parcours, table, aujourdhui);
      if (etape) return etape;
    }
    if (parcours.expert.etoiles < ETOILES_MAX) {
      const etoile = parcours.expert.etoiles + 1;
      return {type: "etoile", etoile, libelle: `Tenter ${symboleEtoile(etoile)} : toutes les tables en ${libelleDuree(dureeEtoile(etoile))}`, config: configEtoile(etoile)};
    }
    // Légende des tables — mais les étoiles valident par échantillon
    // (25 questions) : le parcours ne dit « fini » que quand chacun des 36
    // calculs de la grille est vert — c'est elle, la preuve complète. Rien
    // n'est dû aujourd'hui (sinon on ne serait pas ici) : les calculs pas
    // encore verts reviendront d'eux-mêmes dans « Mes calculs du jour » ;
    // ceux qui n'ont jamais été rencontrés le seront en rejouant une marche.
    const resume = resumeCalculs(parcours, aujourdhui);
    const aReprendre = resume.aTravailler + resume.enCours;
    if (aReprendre) {
      return {
        type: "legende",
        libelle: `Légende des tables ! Il reste ${aReprendre} calcul${aReprendre > 1 ? "s" : ""} à faire monter jusqu’au vert : ils reviendront dans Mes calculs du jour`,
        config: null
      };
    }
    if (resume.jamaisVus) {
      return {
        type: "legende",
        libelle: `Légende des tables ! Il reste ${resume.jamaisVus} calcul${resume.jamaisVus > 1 ? "s" : ""} que tu n’as jamais rencontré${resume.jamaisVus > 1 ? "s" : ""} : rejoue une marche de l’escalier`,
        config: configEtoile(ETOILES_MAX)
      };
    }
    return {type: "legende", libelle: "Légende des tables, et les 36 calculs sont verts : tout est là !", config: null};
  }

  // « ★ », « ★★★★ », « 👑 » : le symbole d'une marche de l'escalier.
  function symboleEtoile(etoile) {
    const marche = entier(etoile, 1, ETOILES_MAX, 1);
    return marche === ETOILES_MAX ? "👑" : "★".repeat(marche);
  }

  function libelleDuree(secondes) {
    if (secondes % 60 === 0) return `${secondes / 60} min`;
    return `${Math.floor(secondes / 60)} min ${String(secondes % 60).padStart(2, "0")}`;
  }

  // Résumé prêt à afficher (sans DOM) : symboles par ligne.
  function etatAffichage(parcours, aujourdhui = jourLocal()) {
    const acquises = tablesAcquises(parcours);
    const aRevoir = tablesARevoir(parcours);
    const lignes = TABLES.map(table => {
      const ligne = parcours.tables[table];
      const validation = validationTable(parcours, table, aujourdhui);
      return {
        table,
        apprends: ACTIVITES_APPRENDS.map(activite => ({activite, etat: ligne.apprends[activite], fois: ligne.fois[activite], libelle: LIBELLES_APPRENDS[activite]})),
        entraine: ENTRAINEMENTS.map(entrainement => ({entrainement, etat: ligne.entraine[entrainement], fois: ligne.fois[entrainement], libelle: LIBELLES_ENTRAINEMENTS[entrainement]})),
        dernierEntrainement: ligne.entraine.dernier,
        acquise: ligne.acquise,
        aRevoir: aRevoir.includes(table),
        // Le point sur ses 8 calculs (prets, dus, prochain retour).
        validation,
        // L'étape conseillée de la table : « apprends », « entraine », « valide ».
        conseil: conseilTable(ligne, validation)
      };
    });
    // Mon mélange, libre : proposé dès 2 tables passées ; le jour et le
    // score du dernier joué.
    const visible = acquises.length >= SEUILS.melange.tablesMin;
    const melange = {visible, tables: acquises, dernier: visible ? parcours.melange.dernier : null, score: visible ? parcours.melange.score : null,
      reussi: visible ? parcours.melange.reussi : null, trophees: tropheesMelange(parcours)};
    const ouvert = escalierOuvert(parcours);
    const etoiles = parcours.expert.etoiles;
    const marches = SEUILS.etoile.durees.map((duree, index) => ({
      etoile: index + 1,
      symbole: symboleEtoile(index + 1),
      duree,
      libelleDuree: libelleDuree(duree),
      gagnee: index + 1 <= etoiles,
      suivante: ouvert && index + 1 === etoiles + 1,
      config: configEtoile(index + 1)
    }));
    return {
      prenom: parcours.prenom,
      lignes,
      acquises,
      melange,
      // Mes calculs du jour : la porte est-elle fermée, et la série du moment.
      porte: mesCalculsAFaire(parcours, aujourdhui),
      serieDuJour: serieDuJour(parcours, {aujourdhui}),
      // « niveau » reste le nombre d'étoiles, pour la page du professeur.
      expert: {niveau: etoiles, etoiles: marches.map(marche => marche.gagnee), ouvert, marches, suivante: ouvert && etoiles < ETOILES_MAX ? marches[etoiles] : null, couronne: parcours.expert.couronne},
      rang: rang(parcours.rang),
      jours: bilanJours(parcours, aujourdhui),
      calculs: resumeCalculs(parcours, aujourdhui),
      // L'agenda des calculs : dus aujourd'hui, demain, et le prochain retour.
      agenda: agendaCalculs(parcours, aujourdhui),
      prochaine: prochaineEtape(parcours, aujourdhui),
      // La table de la séance (lot 2) : celle de la dernière séance, sinon
      // la première de l'ordre conseillé non acquise ; null : les 9 le sont.
      tableSeance: tableDeSeance(parcours)
    };
  }

  // ------------------------------------------------------ Ma séance du jour
  //
  // Lot 1 (02/10/2026). Tout est ici, sans DOM : la rangée d'une table, la
  // composition d'une séance, ce qu'une étape finie change à la suite. La page
  // ne fait qu'enchaîner des séries qui existent déjà et montrer ce que ces
  // fonctions rendent ; la simulation et les tests lisent le même code.

  // Les huit marches de l'échelle d'une table.
  const MARCHES = Object.freeze([
    Object.freeze({marche: 1, type: "apprends", cle: "beads", nom: "Les perles"}),
    Object.freeze({marche: 2, type: "apprends", cle: "construct", nom: "Je construis la bande"}),
    Object.freeze({marche: 3, type: "apprends", cle: "gaps", nom: "La bande à trous"}),
    Object.freeze({marche: 4, type: "apprends", cle: "ordered", nom: "Dans l’ordre"}),
    Object.freeze({marche: 5, type: "entraine", cle: "desordre", nom: "Dans le désordre"}),
    Object.freeze({marche: 6, type: "entraine", cle: "trous", nom: "Nombres manquants et divisions"}),
    Object.freeze({marche: 7, type: "entraine", cle: "mixte", nom: "Résultats, nombres manquants et divisions"}),
    Object.freeze({marche: 8, type: "validation", cle: null, nom: "Je passe le test"})
  ]);
  const MARCHE_VALIDATION = MARCHES.length;
  // Une table déjà passée, choisie exprès, se retravaille par ses trois
  // entraînements, à partir de « Dans le désordre ». (Jusqu'au lot « Mon
  // mélange sur l'accueil et l'expert », « Dans le désordre » prenait aussi la
  // place du test pas encore ouvert : c'est maintenant la marche 7, refaite —
  // voir etapeDeSeance.)
  const MARCHE_TABLE_PASSEE = 5;
  // Ce que dure une étape, en minutes (pour « environ 5 min »). Lot M1 : les
  // durées du lot 1 annonçaient le double du temps réel (compté question par
  // question le 03/10 : 2 min 45 à 5 min 10 pour quatre étapes, selon
  // l'élève). Révision 1, perles 2, chaque marche 1, un chrono 2, une étoile 3.
  const MINUTES_ETAPE = Object.freeze({revision: 1, melange: 2, etoile: 3, validation: 2, beads: 2, construct: 1, gaps: 1, ordered: 1, desordre: 1, trous: 1, mixte: 1});

  function marche(numero) {
    return MARCHES[entier(numero, 1, MARCHES.length, 1) - 1];
  }

  // La rangée d'une table : dix cases, les résultats de × 1 à × 10. Les huit
  // calculs de la grille suivent leur boîte ; les bouts sont pleins dès leur
  // première réussite. Trois états, une couleur.
  function rangeeTable(parcours, table) {
    const ligne = parcours.tables[table];
    const cases = Array.from({length: 10}, (_, index) => {
      const multiplicateur = index + 1;
      const cle = cleFait(`${table}-${multiplicateur}`);
      let etat = "vide";
      if (cle) {
        const fait = parcours.calculs[cle];
        if (fait && fait.boite >= SEUILS.validation.boiteMin) etat = "pleine";
        else if (fait && fait.boite === SEUILS.validation.boiteMin - 1) etat = "entouree";
      } else if (ligne.bouts.includes(multiplicateur)) etat = "pleine";
      return {multiplicateur, produit: table * multiplicateur, etat, bout: !cle};
    });
    const pleines = cases.filter(item => item.etat === "pleine").length;
    return {table, cases, pleines, total: cases.length, prete: pleines === cases.length};
  }

  // Les deux premiers entraînements du test : 9 sur 10 ou mieux à « Dans le
  // désordre » ET à « Nombres manquants et divisions », gagnés une fois et
  // gardés (« sansFaute »).
  function raccourciValidation(parcours, table) {
    const ligne = parcours.tables[table];
    return CLES_SANS_FAUTE.every(cle => ligne.sansFaute[cle] === 1);
  }

  // Lot « retours de classe » (06/10/2026, décisions de Gwenaël, après
  // simulation) : le test ne vient plus que JUSTE APRÈS 9 sur 10 à
  // « Résultats, nombres manquants et divisions » (la marche 7, celle qui
  // ressemble le plus au test), dans la même séance — et c'est tout (règle
  // simplifiée le 07/10 : ni les deux autres entraînements, ni la rangée
  // pleine n'entrent plus en compte ; pour arriver à la marche 7, l'élève a
  // déjà réussi les marches 5 et 6). Avant, 9 sur 10 aux marches 5 et 6, ou
  // la rangée pleine, ouvraient le test tout de suite : 9 tests sur 10
  // étaient proposés sans que la marche 7 ait jamais été faite.
  // Rien n'est enregistré de plus : la séance lit la marche 7 réussie dans
  // ses étapes faites.
  const MARCHE_RACCOURCI_FIN = 7;

  // 9 sur 10 ou mieux (une erreur au plus).
  function marcheSeptReussie(juste, total) {
    return total - juste <= SEUILS.seance.raccourciErreursMax;
  }

  // La marche 7 a-t-elle déjà été jouée dans CETTE séance ? Alors la marche 8
  // qui reste n'est plus le test annoncé : c'est la marche 7, refaite.
  function septJoueeDansLaSeance(seance) {
    return Boolean(seance) && (seance.faites || []).some(passee => passee.type === "entraine"
      && passee.marche === MARCHE_RACCOURCI_FIN);
  }

  // La marche 7 a-t-elle été réussie à 9 sur 10 dans CETTE séance ?
  function septReussieDansLaSeance(seance) {
    return Boolean(seance) && (seance.faites || []).some(passee => passee.type === "entraine"
      && passee.marche === MARCHE_RACCOURCI_FIN && !passee.rate && marcheSeptReussie(passee.juste, passee.total));
  }

  // L'étape qui vient d'être jouée ouvre-t-elle le test ?
  function raccourciDeLEtape(etape, juste, total) {
    return etape.type === "entraine" && etape.cle === CLE_RACCOURCI_FIN
      && marcheSeptReussie(juste, total);
  }

  // La séance peut-elle proposer « Je passe le test » ? Pas sur une table
  // passée, et seulement si la marche 7 a été réussie à 9 sur 10 dans la
  // séance (lue dans ses étapes faites).
  function validationDeSeance(parcours, table, seance = null) {
    const ligne = parcours.tables[table];
    if (!ligne || ligne.acquise) return false;
    return septReussieDansLaSeance(seance);
  }

  // La table de la séance quand l'élève n'en a pas choisi dans l'onglet :
  // celle de sa dernière séance, si elle n'est pas acquise (lot 2, décision
  // de Gwenaël du 03/10 : l'élève qui a choisi la 7 la retrouve le
  // lendemain, sur tous ses appareils) ; sinon la première de l'ordre
  // conseillé qui n'est pas acquise (aucune quand les 9 le sont).
  function tableDeSeance(parcours) {
    let recente = null;
    ORDRE_CONSEIL.forEach(candidate => {
      const ligne = parcours.tables[candidate];
      if (ligne.acquise || !ligne.seance.dernier) return;
      if (recente === null || ligne.seance.dernier > parcours.tables[recente].seance.dernier) recente = candidate;
    });
    if (recente !== null) return recente;
    const table = ORDRE_CONSEIL.find(candidate => !parcours.tables[candidate].acquise);
    return table === undefined ? null : table;
  }

  function bornerDepart(depart) {
    return Math.max(1, Math.min(SEUILS.seance.departMax, depart));
  }

  // Ouvre une séance : la file de ses étapes. Mes calculs du jour s'il y en a
  // (la porte de la journée, ou les calculs dus qui restent : une série, 10
  // au plus), puis les marches de la table à partir de son départ — quatre
  // étapes en tout (trois marches après Mes calculs du jour, quatre sinon).
  // Une table déjà passée (choisie exprès) se retravaille par ses trois
  // entraînements, sans rien déplacer.
  // Lot M1 : la séance du jour déjà commencée est REPRISE là où elle en est
  // (ses étapes faites, sa file).
  function ouvrirSeance(parcours, {table = null, aujourdhui = jourLocal()} = {}) {
    const reprise = seanceEnCours(parcours, {table, aujourdhui});
    if (reprise) return reprise;
    const file = [];
    if (serieDuJour(parcours, {aujourdhui}).cles.length) file.push({type: "revision"});
    const choisie = TABLES.includes(Number(table)) ? Number(table) : tableDeSeance(parcours);
    let depart = null;
    let echelle = false;
    // Les 9 tables passées et aucune choisie (lot 2) : après Mes calculs du
    // jour, la marche suivante de l'escalier des étoiles. Lot « Mon mélange
    // aux paliers » (09/10/2026, décision de Gwenaël) : plus de Mon mélange
    // des 9 tables avant l'étoile (lot « Mon mélange sur l'accueil et
    // l'expert ») — il était plus dur que la première étoile.
    if (choisie === null && toutesAcquises(parcours)) {
      file.push({type: "etoile"});
    }
    if (choisie !== null) {
      // Lot « Mon mélange aux paliers » : 3 (puis 6) tables passées et la
      // coupe pas encore gagnée — Mon mélange en 2e étape. Le plafond garde
      // la séance à quatre étapes : deux marches ce jour-là (décision de
      // Gwenaël, 09/10).
      if (melangeAuPalier(parcours)) file.push({type: "melange"});
      const ligne = parcours.tables[choisie];
      echelle = !ligne.acquise;
      depart = echelle ? bornerDepart(ligne.seance.depart) : MARCHE_TABLE_PASSEE;
      const derniere = echelle ? MARCHE_VALIDATION : MARCHE_VALIDATION - 1;
      const marches = Math.min(SEUILS.seance.marches, Math.max(SEUILS.seance.marchesMin, SEUILS.seance.plafond - file.length));
      // Lot M2 : au sommet, la fenêtre s'arrête à la marche 8 au lieu de
      // raccourcir (départ 6, rien de dû : 5-6-7-8, pas 6-7-8 seul). Le départ
      // enregistré ne bouge pas. Une table acquise garde ses trois entraînements.
      const premiere = echelle ? Math.max(1, Math.min(depart, derniere - marches + 1)) : depart;
      for (let numero = premiere; numero < premiere + marches && numero <= derniere; numero += 1) {
        file.push({type: "marche", marche: numero, table: choisie});
      }
    }
    return {jour: aujourdhui, table: choisie, depart, echelle, file, faites: [], rate: null, sansFaute: true, remplacee: false, reparee: false, finie: false, avance: 0,
      // Lot « retours de classe » : « prete » ne sert plus (le test se gagne
      // à la marche 7 de la séance) ; le champ reste dans le format de la
      // séance en cours.
      prete: false,
      // Le nombre de séances déjà finies ce jour-là : c'est lui qui dit, à la
      // reprise et à la fusion, si CETTE séance est encore la séance en cours.
      rang: seancesDuJour(parcours, aujourdhui), erreurs: []};
  }

  // ------------------------------------------------ la séance en cours (lot M1)
  //
  // Une séance coupée (onglet fermé, « Arrêter la séance », changement
  // d'appareil) est gardée DANS LE PARCOURS, donc envoyée au serveur. Le
  // serveur n'accepte que des entiers, des booléens, des dates et des listes
  // de nombres (lib/progression.php : aucun texte, aucune liste d'objets) :
  // la séance est donc rangée en nombres.
  //  - « file » : un code par étape à venir — 100 Mes calculs du jour, 200 le
  //    mélange (aux paliers, lot du 09/10/2026), 300 l'étoile, et pour une marche son numéro (1 à 8), + 10
  //    pour la marche d'en dessous après un raté, + 20 pour la marche ratée
  //    refaite, + 30 pour la validation du raccourci ;
  //  - « faites » : quatre nombres par étape faite — son code (100, 200,
  //    300 + le numéro de l'étoile, ou la marche jouée), les réponses justes,
  //    le total, l'issue (1 = ratée ; + 2 = réussie, + 4 = pas réussie, pour
  //    une validation, un mélange, une étoile) ;
  //  - « erreurs » : les calculs ratés de la séance, 407 pour 4 × 7.
  // Elle ne vaut que si son jour est aujourd'hui, si aucune séance n'a été
  // finie depuis qu'elle a été ouverte (« rang » = le nombre de séances finies
  // ce jour-là à son ouverture), et si sa table n'a pas été acquise entre-temps.
  const CODE_REVISION = 100;
  const CODE_MELANGE = 200;
  const CODE_ETOILE = 300;
  const DRAPEAUX_FILE = Object.freeze({remplacement: 10, reprise: 20, raccourci: 30});
  const ISSUE = Object.freeze({rate: 1, reussi: 2, pasReussi: 4});
  const EN_COURS_FILE_MAX = 12;
  const EN_COURS_FAITES_MAX = 16;

  function seancesDuJour(parcours, jour) {
    return parcours.seances.filter(candidate => candidate === jour).length;
  }

  function coderPrevue(prevue) {
    if (prevue.type === "revision") return CODE_REVISION;
    if (prevue.type === "melange") return CODE_MELANGE;
    if (prevue.type === "etoile") return CODE_ETOILE;
    const drapeau = Object.keys(DRAPEAUX_FILE).find(cle => prevue[cle]);
    return prevue.marche + (drapeau ? DRAPEAUX_FILE[drapeau] : 0);
  }

  function decoderPrevue(code, table) {
    if (code === CODE_REVISION) return {type: "revision"};
    if (code === CODE_MELANGE) return {type: "melange"};
    if (code === CODE_ETOILE) return {type: "etoile"};
    const prevue = {type: "marche", marche: code % 10, table};
    const drapeau = Object.keys(DRAPEAUX_FILE).find(cle => DRAPEAUX_FILE[cle] === code - (code % 10));
    if (drapeau) prevue[drapeau] = true;
    return prevue;
  }

  function codePrevueValide(code, table) {
    if (code === CODE_REVISION || code === CODE_MELANGE || code === CODE_ETOILE) return true;
    if (!Number.isInteger(code) || table === null) return false;
    const numero = code % 10;
    return numero >= 1 && numero <= MARCHE_VALIDATION && [0, ...Object.values(DRAPEAUX_FILE)].includes(code - numero);
  }

  function codeFaiteValide(code, table) {
    if (code === CODE_REVISION || code === CODE_MELANGE) return true;
    if (Number.isInteger(code) && code > CODE_ETOILE && code <= CODE_ETOILE + ETOILES_MAX) return true;
    return Number.isInteger(code) && table !== null && code >= 1 && code <= MARCHE_VALIDATION;
  }

  function coderErreur(paire) {
    const premier = Array.isArray(paire) ? Number(paire[0]) : NaN;
    const second = Array.isArray(paire) ? Number(paire[1]) : NaN;
    if (!Number.isInteger(premier) || !Number.isInteger(second) || premier < 0 || premier > 10 || second < 0 || second > 10) return null;
    return premier * 100 + second;
  }

  function normaliserErreursCodees(liste) {
    const codes = [];
    (Array.isArray(liste) ? liste : []).forEach(valeur => {
      const code = Number(valeur);
      if (Number.isInteger(code) && code >= 0 && code <= 1010 && code % 100 <= 10 && !codes.includes(code)) codes.push(code);
    });
    return codes.slice(0, SEUILS.seance.erreursGardees);
  }

  // ------------------------------------- « À retenir », la liste du jour
  //
  // Lot « retouches après Mon parcours » (04/10/2026, décision de Gwenaël) :
  // « À retenir pour la prochaine séance » montre partout la même liste — TOUS
  // les calculs ratés dans la journée, quelle que soit la séance : au bilan de
  // chaque séance et sur l'accueil, une fois la séance du jour faite. Elle
  // grandit au fil des séances et repart à zéro le lendemain. Elle est gardée
  // dans le parcours (« retenir »), donc sur le serveur : elle suit l'élève
  // d'un appareil à l'autre. Les × 1 et × 10 y sont, comme au bilan (le
  // tableau Mes calculs, lui, ne les connaît pas) ; les erreurs de J'apprends
  // n'y sont PAS : seulement les calculs répondus de mémoire (voir noterEtape).
  // Lot « un seul système » : c'est un AFFICHAGE, rien de plus — il n'y a pas
  // de « je rejoue mes erreurs de la veille » à part, les boîtes s'en chargent.
  // Chaque calcul une fois : 4 × 7 et 7 × 4 sont le même calcul (le premier
  // raté garde son sens).
  function normaliserRetenir(brut) {
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return null;
    const jour = dateOuNull(brut.jour);
    if (!jour) return null;
    const vus = new Set();
    const erreurs = normaliserErreursCodees(brut.erreurs).filter(code => {
      const calcul = memeCalcul(code);
      if (vus.has(calcul)) return false;
      vus.add(calcul);
      return true;
    });
    return erreurs.length ? {jour, erreurs} : null;
  }

  // 407 et 704 : le même calcul.
  function memeCalcul(code) {
    const premier = Math.floor(code / 100);
    const second = code % 100;
    return Math.min(premier, second) * 100 + Math.max(premier, second);
  }

  // Ajoute des ratés (des paires [4, 7]) à la liste du jour ; un autre jour,
  // la liste repart de zéro.
  function ajouterARetenir(retenir, jour, paires) {
    const codes = (Array.isArray(paires) ? paires : []).map(coderErreur).filter(code => code !== null);
    const avant = retenir && retenir.jour === jour ? retenir.erreurs : [];
    return normaliserRetenir({jour, erreurs: [...avant, ...codes]});
  }

  // Lot E2 « les évaluations en classe » (15/10/2026, décision de Gwenaël) :
  // les calculs ratés à l'évaluation vont aussi dans « À retenir », comme
  // ceux d'une séance — l'évaluation agit sur le parcours comme Mon mélange.
  // Une copie du parcours, la liste du jour complétée ; rien d'autre ne bouge.
  function retenirErreurs(parcours, paires, date) {
    const jour = dateOuNull(date) || jourLocal();
    const copie = cloner(parcours);
    copie.retenir = ajouterARetenir(copie.retenir, jour, paires);
    return copie;
  }

  // La liste du jour, en paires [4, 7] — vide un autre jour.
  function aRetenir(parcours, aujourdhui = jourLocal()) {
    const retenir = parcours && parcours.retenir;
    if (!retenir || retenir.jour !== aujourdhui) return [];
    return retenir.erreurs.map(code => [Math.floor(code / 100), code % 100]);
  }

  // La séance rangée en nombres, ou null (rien, ou un JSON qui ne tient pas
  // debout : mieux vaut rouvrir une séance neuve que reprendre n'importe quoi).
  function normaliserEnCours(brut) {
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return null;
    const jour = dateOuNull(brut.jour);
    if (!jour) return null;
    const table = brut.table === null || brut.table === undefined ? null : entier(brut.table, 2, 10, 0);
    if (table === 0) return null;
    const file = (Array.isArray(brut.file) ? brut.file : []).map(Number);
    if (file.length > EN_COURS_FILE_MAX || !file.every(code => codePrevueValide(code, table))) return null;
    const faites = (Array.isArray(brut.faites) ? brut.faites : []).map(Number);
    if (!faites.length || faites.length % 4 || faites.length > 4 * EN_COURS_FAITES_MAX) return null;
    for (let index = 0; index < faites.length; index += 4) {
      const [code, juste, total, issue] = faites.slice(index, index + 4);
      if (!codeFaiteValide(code, table)) return null;
      if (!Number.isInteger(juste) || !Number.isInteger(total) || total < 1 || total > 100 || juste < 0 || juste > 100) return null;
      if (![0, 1, 2, 4, 5].includes(issue)) return null;
    }
    return {
      jour,
      table,
      depart: table === null ? null : entier(brut.depart, 1, MARCHE_VALIDATION, 1),
      echelle: table !== null && Boolean(brut.echelle),
      rang: entier(brut.rang, 0, FOIS_MAX),
      file,
      faites,
      erreurs: normaliserErreursCodees(brut.erreurs),
      rate: brut.rate === null || brut.rate === undefined ? null : entier(brut.rate, 1, MARCHE_VALIDATION, null),
      sansFaute: Boolean(brut.sansFaute),
      remplacee: Boolean(brut.remplacee),
      reparee: Boolean(brut.reparee),
      prete: Boolean(brut.prete)
    };
  }

  function coderSeance(seance) {
    return normaliserEnCours({
      jour: seance.jour,
      table: seance.table,
      depart: seance.depart,
      echelle: seance.echelle,
      rang: seance.rang,
      file: seance.file.map(coderPrevue),
      faites: seance.faites.flatMap(faite => [
        faite.type === "revision" ? CODE_REVISION : faite.type === "melange" ? CODE_MELANGE : faite.type === "etoile" || faite.type === "course" ? CODE_ETOILE + faite.etoile : faite.marche,
        faite.juste,
        faite.total,
        (faite.rate ? ISSUE.rate : 0) + (faite.reussi === true ? ISSUE.reussi : faite.reussi === false ? ISSUE.pasReussi : 0)
      ]),
      erreurs: (seance.erreurs || []).map(coderErreur).filter(code => code !== null),
      rate: seance.rate,
      sansFaute: seance.sansFaute,
      remplacee: seance.remplacee,
      reparee: seance.reparee,
      prete: seance.prete
    });
  }

  function decoderFaite(code, juste, total, issue) {
    const rate = Boolean(issue & ISSUE.rate);
    const reussi = issue & ISSUE.reussi ? true : issue & ISSUE.pasReussi ? false : null;
    if (code === CODE_REVISION) return {type: "revision", nom: "Mes calculs du jour", marche: null, etoile: null, juste, total, rate, reussi};
    if (code === CODE_MELANGE) return {type: "melange", nom: "Mon mélange", marche: null, etoile: null, juste, total, rate, reussi};
    if (code > CODE_ETOILE) return {type: "etoile", nom: `Tente ${symboleEtoile(code - CODE_ETOILE)}`, marche: null, etoile: code - CODE_ETOILE, juste, total, rate, reussi};
    const definition = marche(code);
    return {type: definition.type, nom: definition.nom, marche: code, etoile: null, juste, total, rate, reussi};
  }

  function decoderSeance(code) {
    const faites = [];
    for (let index = 0; index < code.faites.length; index += 4) faites.push(decoderFaite(...code.faites.slice(index, index + 4)));
    return {
      jour: code.jour, table: code.table, depart: code.depart, echelle: code.echelle,
      file: code.file.map(prevue => decoderPrevue(prevue, code.table)),
      faites, rate: code.rate, sansFaute: code.sansFaute, remplacee: code.remplacee, reparee: code.reparee,
      finie: false, avance: 0, prete: code.prete, rang: code.rang,
      erreurs: code.erreurs.map(erreur => [Math.floor(erreur / 100), erreur % 100])
    };
  }

  // La séance en cours est-elle encore celle du parcours ? (Sans regarder le
  // jour : c'est ce que la fusion vérifie aussi.)
  function enCoursTient(parcours, code) {
    if (!code) return false;
    if (seancesDuJour(parcours, code.jour) !== code.rang) return false;
    return !(code.echelle && parcours.tables[code.table].acquise);
  }

  // La séance du jour à reprendre, telle qu'ouvrirSeance l'aurait laissée —
  // ou null : rien en cours, séance d'un autre jour (oubliée), d'une autre
  // table que celle demandée, déjà finie ailleurs, ou plus rien à y jouer.
  function seanceEnCours(parcours, {table = null, aujourdhui = jourLocal()} = {}) {
    const code = parcours.enCours;
    if (!code || code.jour !== aujourdhui || !enCoursTient(parcours, code)) return null;
    if (TABLES.includes(Number(table)) && Number(table) !== code.table) return null;
    const seance = decoderSeance(code);
    return etapeDeSeance(parcours, seance, aujourdhui) ? seance : null;
  }

  // L'étape à jouer maintenant, prête à lancer : son nom, sa série, sa durée.
  // C'est ICI que la marche 8 se décide — le test si la marche 7 vient d'être
  // réussie dans la séance (lot « retours de classe »), sinon la marche 7
  // refaite à sa place — et qu'une
  // étape devenue sans objet s'efface (plus rien de dû).
  // « options.records » (lot « Les records ») : la page dit si les records
  // sont ouverts à cet élève — false, ou {meilleur: dixièmes ou null}. Alors
  // l'étape « étoile » d'une Légende devient la course (« Ma première
  // course », puis « Je bats mon record »). Sans l'option, rien ne change :
  // la couronne se rejoue, comme avant.
  function etapeDeSeance(parcours, seance, aujourdhui = jourLocal(), options = {}) {
    const records = options && options.records && recordsPossibles(parcours) ? options.records : null;
    for (const prevue of seance.file) {
      if (prevue.type === "revision") {
        const serie = serieDuJour(parcours, {aujourdhui});
        const calculs = serie.cles.length;
        if (!calculs) continue;
        return {type: "revision", nom: "Mes calculs du jour", calculs, duree: dureeMesCalculs(calculs), porte: !serie.faite, config: configRevision(), minutes: MINUTES_ETAPE.revision, prevue};
      }
      // Mon mélange aux paliers (lot du 09/10/2026) : l'étape d'une séance
      // sur une table, tant qu'une coupe est à gagner — gagnée ailleurs
      // entre-temps, elle s'efface. Plus jamais à 9 tables : celle de l'élève
      // aux 9 tables d'avant ce lot s'efface d'une séance reprise.
      if (prevue.type === "melange") {
        if (!melangeAuPalier(parcours)) continue;
        const config = configMelange(parcours);
        return {type: "melange", nom: "Mon mélange", detail: `mes ${config.tables.length}\u00a0tables · ${libelleDuree(SEUILS.melange.dureeMax).replace(/ /g, "\u00a0")}`,
          config, minutes: MINUTES_ETAPE.melange, prevue};
      }
      if (prevue.type === "etoile") {
        // Pas avant les 9 tables passées ; la couronne gagnée, c'est elle
        // qui se rejoue (l'entretien).
        if (!escalierOuvert(parcours)) continue;
        if (records) {
          // La Légende court (lot « Les records ») : l'étape garde le code
          // de la couronne dans la séance enregistrée (coderSeance) — une
          // séance relue après rechargement la nomme « Tente 👑 » dans le
          // bilan, c'est le seul écart, accepté.
          const premiere = records.meilleur === null || records.meilleur === undefined;
          return {type: "course", etoile: ETOILES_MAX, nom: premiere ? "Ma première course" : "Je bats mon record",
            detail: `${SEUILS.course.total}\u00a0questions`, config: configCourse(), minutes: MINUTES_ETAPE.etoile, prevue};
        }
        const etoile = Math.min(ETOILES_MAX, parcours.expert.etoiles + 1);
        return {type: "etoile", etoile, nom: `Tente ${symboleEtoile(etoile)}`, detail: libelleDuree(dureeEtoile(etoile)), config: configEtoile(etoile), minutes: MINUTES_ETAPE.etoile, prevue};
      }
      const table = prevue.table;
      let numero = prevue.marche;
      let condition = false;
      if (numero === MARCHE_VALIDATION) {
        // Un test déjà promis par la marche 7 (« raccourci ») reste promis.
        if (!parcours.tables[table].acquise && (prevue.raccourci || validationDeSeance(parcours, table, seance))) {
          return {type: "validation", marche: numero, table, nom: marche(numero).nom, config: configValidation(table), minutes: MINUTES_ETAPE.validation, prevue};
        }
        // Pas ouvert (la marche 7 a eu 7 ou 8 sur 10) : la marche 7 REFAITE
        // à la place (lot « Mon mélange sur l'accueil et l'expert », 07/10/2026,
        // décision de Gwenaël — avant, « Dans le désordre »). Il n'y a qu'une
        // marche 8 par séance : une seule reprise. 9 sur 10 cette fois, et le
        // test vient juste après (noterEtape), en 5e étape au plus. Rien
        // à la place si la table vient d'être passée (test libre de l'accueil).
        if (parcours.tables[table].acquise) continue;
        numero = MARCHE_RACCOURCI_FIN;
        condition = true;
      }
      const definition = marche(numero);
      return {
        type: definition.type,
        marche: numero,
        table,
        cle: definition.cle,
        nom: definition.nom,
        // « Je passe le test · si j'ai 9 sur 10 juste avant » : la
        // marche 8 prévue, jouée en marche 7 refaite quand la marche 7 n'a pas
        // ouvert le test.
        aLaPlaceDeLaValidation: condition,
        config: definition.type === "apprends" ? configApprends(table, definition.cle) : configEntraine(table, definition.cle),
        minutes: MINUTES_ETAPE[definition.cle],
        prevue
      };
    }
    return null;
  }

  // Le programme d'une séance, pour l'annoncer : ses étapes telles qu'elles
  // se présentent maintenant (la marche 8 dite « si j'ai 9 sur 10 aux
  // entraînements » quand elle n'est pas encore sûre), et la durée.
  function programmeDeSeance(parcours, seance, aujourdhui = jourLocal(), options = {}) {
    const etapes = [];
    let reste = {...seance, file: seance.file.slice()};
    for (let garde = 0; garde < 12; garde += 1) {
      const etape = etapeDeSeance(parcours, reste, aujourdhui, options);
      if (!etape) break;
      // Une validation qui dépend d'une étape encore à jouer (la marche 7)
      // est annoncée « si j'ai 9 sur 10 juste avant » (la marche 7). La
      // marche 7 déjà jouée sans 9 sur 10 (séance reprise), la marche 8 se
      // jouera en marche 7 refaite : c'est elle qu'on annonce, et le test
      // devient la 5e étape possible (raccourciEnFin).
      const prevueValidation = etape.prevue.type === "marche" && etape.prevue.marche === MARCHE_VALIDATION;
      etapes.push(prevueValidation && etape.type !== "validation" && !septJoueeDansLaSeance(seance)
        ? {...etape, nom: marche(MARCHE_VALIDATION).nom, conditionnelle: true}
        : etape);
      reste = {...reste, file: reste.file.slice(reste.file.indexOf(etape.prevue) + 1)};
    }
    // Le test annoncé « si j'ai 9 sur 10 juste avant » dure le temps d'un
    // test, pas celui de la marche 7 refaite qu'il remplace.
    const minutes = etapes.reduce((somme, etape) => somme + (etape.conditionnelle ? MINUTES_ETAPE.validation : etape.minutes), 0);
    const enFin = raccourciEnFin(parcours, seance, etapes);
    // Lot « après l'audit GPT » (D13, 14/10/2026) : le test annoncé en 4e
    // étape « si j'ai 9 sur 10 juste avant » ; 8 sur 10 à la marche 7, elle
    // est refaite À SA PLACE et, à 9 sur 10, le test suit en 5e étape — la
    // carte disait « 4 étapes » et en jouait 5. Elle dit « 4 ou 5 », sans
    // deuxième ligne de test (il est déjà dans la liste).
    const repriseEnFin = repriseAvantLeTest(seance, etapes);
    return {etapes, minutes, raccourciEnFin: enFin || repriseEnFin, testDejaAnnonce: repriseEnFin,
      minutesMax: minutes + (enFin ? MINUTES_ETAPE.validation : repriseEnFin ? MINUTES_ETAPE[CLE_RACCOURCI_FIN] : 0)};
  }

  // D13 : la marche 7 refaite peut-elle se glisser avant le test annoncé
  // (une 5e étape) ? Seulement si le test est la dernière étape annoncée,
  // encore conditionnel, et qu'il reste une place sous les cinq étapes.
  function repriseAvantLeTest(seance, etapes) {
    if (!seance.echelle || !etapes.length || seance.table === null) return false;
    if (seance.faites.length + etapes.length >= SEUILS.seance.etapesMax) return false;
    const derniere = etapes[etapes.length - 1];
    return Boolean(derniere.conditionnelle);
  }

  // Lot M2 : la validation du raccourci peut-elle s'ajouter EN PLUS des
  // étapes annoncées (une 5e étape) ? Lot « retours de classe » (06/10/2026) :
  // le test vient TOUJOURS juste après la marche 7, donc seulement quand la
  // DERNIÈRE étape du programme est « Résultats, nombres manquants et
  // divisions » ; pas de test déjà prévu ni annoncé ; validation possible
  // (table pas encore passée). La carte dit alors « 4 ou 5 étapes ». Lot
  // « Mon mélange sur l'accueil et l'expert » : la marche 7 refaite (à la
  // place de la marche 8) compte aussi.
  function raccourciEnFin(parcours, seance, etapes) {
    if (!seance.echelle || !etapes.length || seance.table === null) return false;
    if (seance.faites.length + etapes.length >= SEUILS.seance.etapesMax) return false;
    const ligne = parcours.tables[seance.table];
    if (!ligne || ligne.acquise) return false;
    if (seance.faites.some(passee => passee.type === "validation")) return false;
    if (etapes.some(etape => etape.type === "validation" || etape.conditionnelle)) return false;
    const derniere = etapes[etapes.length - 1];
    return derniere.type === "entraine" && derniere.cle === CLE_RACCOURCI_FIN;
  }

  // Une marche est-elle ratée ? Plus de 3 erreurs sur 10 (moins de 7 sur 10) ;
  // sur les 11 cases d'une bande, 4 erreurs ; sur les 8 trous, 3.
  function marcheRatee(juste, total) {
    return total > 0 && (total - juste) > total * SEUILS.seance.erreursRate;
  }

  // Note une étape FINIE (la série a déjà été appliquée au parcours par
  // appliquerSerie / appliquerReponse) et rend la séance et le parcours à
  // jour. resultat = {juste, total, reussi} — « reussi » pour une validation
  // ou un mélange.
  //  - marche ratée : la marche d'en dessous, la marche ratée refaite, puis la
  //    suite prévue (une seule fois par séance) ; le départ de la table
  //    redescend TOUT DE SUITE un cran sous la marche ratée, et ne remonte que
  //    si la reprise est réussie et la séance finie ;
  //  - les deux « 10 sur 10 » du raccourci réunis : la suite devient la
  //    validation ;
  //  - test réussi : la séance est finie ; raté : retour à la marche 7 ;
  //  - plus d'étape : la séance est finie — le départ avance (d'une marche,
  //    de deux si tout était sans faute) et le jour est compté.
  function noterEtape(parcours, seance, etape, resultat = {}, aujourdhui = jourLocal()) {
    const copie = cloner(parcours);
    const suite = cloner(seance);
    const juste = entier(resultat.juste, 0, 100);
    const total = entier(resultat.total, 1, 100, 1);
    const position = seance.file.indexOf(etape.prevue);
    suite.file = suite.file.slice(position < 0 ? 1 : position + 1);
    const faite = {type: etape.type, nom: etape.nom, marche: etape.marche || null, etoile: etape.etoile || null, juste, total, rate: false, reussi: null};
    // Les calculs ratés de l'étape (resultat.erreurs : des paires [4, 7]),
    // gardés une fois chacun pour « À retenir pour demain ».
    // Lot « retouches après Mon parcours » (décision de Gwenaël) : seulement
    // les calculs répondus de mémoire — à partir de « Dans le désordre », les
    // mêmes qui entrent dans les boîtes. Une erreur de J'apprends (perles,
    // bande, bande à trous, dans l'ordre) n'est pas un calcul oublié.
    const ratesDeMemoire = etape.type === "apprends" || !Array.isArray(resultat.erreurs) ? [] : resultat.erreurs;
    const dejaRates = new Set((suite.erreurs || []).map(coderErreur));
    suite.erreurs = (suite.erreurs || []).slice();
    ratesDeMemoire.forEach(paire => {
      const code = coderErreur(paire);
      if (code === null || dejaRates.has(code) || suite.erreurs.length >= SEUILS.seance.erreursGardees) return;
      dejaRates.add(code);
      suite.erreurs.push([Number(paire[0]), Number(paire[1])]);
    });
    // … et dans la liste du jour (« À retenir »), qui, elle, survit à la séance.
    copie.retenir = ajouterARetenir(copie.retenir, dateOuNull(suite.jour) || jourLocal(), ratesDeMemoire);
    const table = suite.table;
    const ligne = table === null ? null : copie.tables[table];
    if (ligne && suite.echelle) ligne.seance.dernier = dateOuNull(suite.jour) || jourLocal();
    const descendre = (numero, reprendre = true) => {
      // Un raté réparé ne compte plus : c'est le nouveau raté qui dit où repartir.
      suite.rate = suite.rate === null || suite.reparee ? numero : Math.min(suite.rate, numero);
      suite.sansFaute = false;
      // Le premier raté d'une séance (décision de Gwenaël, 02/10 au soir) : la
      // marche d'en dessous, puis la marche ratée REFAITE, puis la suite prévue
      // — la séance ne s'arrête pas sur un échec. Un deuxième raté (la marche
      // d'en dessous, la reprise, ou plus loin) : la séance s'arrête là.
      const reste = suite.file.filter(prevue => prevue.type === "marche");
      suite.file = suite.remplacee || numero <= 1 ? []
        : [{type: "marche", marche: numero - 1, table, remplacement: true},
          ...(reprendre ? [{type: "marche", marche: numero, table, reprise: true}, ...reste] : [])];
      // Lot M2 (décision de Gwenaël) : cinq étapes au plus — la marche refaite
      // prend la place de la dernière marche du jour ; ratée à la 4e étape, il
      // ne reste que la marche d'en dessous (la marche ratée est pour demain :
      // le départ redescend, voir plus bas).
      const place = SEUILS.seance.etapesMax - (suite.faites.length + 1);
      if (suite.file.length > place) suite.file = suite.file.slice(0, Math.max(0, place));
      suite.remplacee = true;
      suite.reparee = false;
      if (suite.echelle) {
        ligne.seance.depart = bornerDepart(suite.rate - 1);
        ligne.seance.n = Math.min(FOIS_MAX, ligne.seance.n + 1);
      }
    };
    if (etape.type === "apprends" || etape.type === "entraine") {
      faite.rate = marcheRatee(juste, total);
      if (juste < total) suite.sansFaute = false;
      if (faite.rate) descendre(etape.marche);
      // La marche ratée, refaite et réussie : le raté est réparé.
      else if (etape.prevue.reprise) suite.reparee = true;
      // Lot « retours de classe » (06/10/2026, décision de Gwenaël) : le
      // test ne vient qu'après 9 sur 10 à la marche 7 (« Résultats, nombres
      // manquants et divisions ») — la marche 7 ne se saute plus. La séance
      // s'en souvient (ses étapes faites) : la marche 8 qui suit devient le test.
      const raccourci = !faite.rate && suite.echelle && raccourciDeLEtape(etape, juste, total);
      // Cinq étapes au plus : complété à la 5e étape (après un raté), il
      // attend le lendemain (départ 6 : la marche 7 revient, puis le test).
      const pasDePlace = suite.faites.length + 2 > SEUILS.seance.etapesMax;
      // Lot M2 : la marche 8 déjà prévue (séance 5-6-7-8) devient elle-même la
      // validation une fois le raccourci gagné — la séance garde ses 4 étapes.
      if (raccourci && !pasDePlace && !suite.file.some(prevue => prevue.marche === MARCHE_VALIDATION) && !suite.faites.some(passee => passee.type === "validation")
        && !copie.tables[table].acquise) {
        // Le test tout de suite après la marche 7, à la place de la suite.
        suite.file = [{type: "marche", marche: MARCHE_VALIDATION, table, raccourci: true}];
      }
    } else if (etape.type === "validation") {
      faite.reussi = Boolean(resultat.reussi);
      // Réussie : la table est passée, la fête termine la séance.
      if (faite.reussi) suite.file = [];
      // Une validation ratée ne se retente pas dans la séance : la marche 7, puis fin.
      else { faite.rate = true; descendre(MARCHE_VALIDATION, false); }
    } else if (etape.type === "melange" || etape.type === "etoile" || etape.type === "course") {
      // La course des records (lot « Les records ») se note comme l'étoile
      // qu'elle remplace : réussie = 25 sur 25 (le temps, lui, va au serveur).
      faite.reussi = Boolean(resultat.reussi);
    } else if (etape.type === "revision") {
      // Mes calculs du jour est joué : la porte de la journée est ouverte,
      // quel que soit le score, même si le temps a manqué.
      copie.calculsDuJour = dateOuNull(suite.jour) || jourLocal();
      // Lot « retours de classe » (06/10/2026) : le temps écoulé avant la
      // première réponse se note « pas réussi » (le bilan écrit « temps
      // écoulé », pas « 0 sur 1 ») — rien n'est compté faux pour autant.
      if (resultat.rien === true) faite.reussi = false;
    }
    suite.faites.push(faite);
    if (!etapeDeSeance(copie, suite, aujourdhui)) {
      suite.file = [];
      suite.finie = true;
      // Sans raté — ou avec un raté réparé dans la séance — le départ avance.
      if (suite.echelle && !ligne.acquise && (suite.rate === null || suite.reparee)) {
        const avant = suite.depart;
        // Le raccourci gagné mène droit à la séance 6-7-8.
        ligne.seance.depart = raccourciValidation(copie, table)
          ? SEUILS.seance.departMax
          : bornerDepart(suite.depart + (suite.sansFaute ? SEUILS.seance.sansFaute : 1));
        ligne.seance.n = Math.min(FOIS_MAX, ligne.seance.n + 1);
        suite.avance = ligne.seance.depart - avant;
      }
      copie.seances = normaliserSeances([...copie.seances, suite.jour]);
    }
    // La séance en cours suit dans le parcours ; finie, elle n'y est plus.
    copie.enCours = suite.finie ? null : coderSeance(suite);
    return {parcours: copie, seance: suite, faite};
  }

  // Une table ratée sur le premier écran (« Tu connais déjà des tables ? ») :
  // l'élève la connaît en partie — sa séance commence aux entraînements
  // (« Dans le désordre »), pas aux perles. Lot M2 (décision de Gwenaël) :
  // moins de 10 bonnes réponses sur 20, elle repart des perles — la descente
  // d'un cran par séance mettait quatre jours à y arriver.
  const MARCHE_APRES_DECOUVERTE = 5;
  function departApresDecouverte(juste) {
    // Sans score (null, absent) : la marche 5, comme avant.
    const score = juste === null || juste === undefined || juste === "" ? NaN : Number(juste);
    return Number.isFinite(score) && score < SEUILS.decouverte.sous ? SEUILS.decouverte.departBas : MARCHE_APRES_DECOUVERTE;
  }
  function commencerApresDecouverte(parcours, table, {juste = null, depart = departApresDecouverte(juste), aujourdhui = jourLocal()} = {}) {
    const copie = cloner(parcours);
    const ligne = copie.tables[table];
    if (!ligne || ligne.acquise) return parcours;
    ligne.seance.depart = bornerDepart(depart);
    ligne.seance.n = Math.min(FOIS_MAX, ligne.seance.n + 1);
    ligne.seance.dernier = aujourdhui;
    return copie;
  }

  // Les jours avec une séance finie depuis lundi (« semaine », que lit la page
  // du professeur), l'objectif (5, pas une limite), le nombre de séances
  // d'aujourd'hui — et (lot « retouches après Mon parcours ») « fois », le
  // nombre de séances finies depuis lundi : l'accueil de l'élève écrit
  // « 3 fois cette semaine », sans objectif (« on n'impose rien »).
  function bilanSeances(parcours, aujourdhui = jourLocal()) {
    const lundi = lundiDe(aujourdhui);
    const cetteSemaine = parcours.seances.filter(jour => jour >= lundi && jour <= aujourdhui);
    return {
      semaine: new Set(cetteSemaine).size,
      fois: cetteSemaine.length,
      objectif: SEUILS.seance.objectifSemaine,
      aujourdhui: seancesDuJour(parcours, aujourdhui)
    };
  }

  // Ce que la page du professeur écrit sur la ligne d'un élève (lot 2b,
  // 03/10/2026). Tout est lu dans le parcours tel qu'il est : aucun compteur
  // de plus n'est enregistré.
  //  - « enCours » : une ligne courte, pas les dix cases (illisibles sur 28
  //    lignes et à l'impression) — « table de 5 · 6 sur 10 », « tables 5 et
  //    7 » quand deux tables sont commencées, « ★★ ».
  //    Une table est « commencée » quand l'élève y a fait une séance ou une
  //    activité : sa rangée ne suffit pas à le dire (3 × 2 et 3 × 5 y sont
  //    pleins dès que les tables de 2 et de 5 sont acquises).
  //  - « ordre » : la clé du tri de la colonne (rien, puis les tables dans
  //    l'ordre conseillé et par cases pleines, les étoiles).
  //  - « seances » : les jours de la semaine avec une séance finie.
  //  - « longue » : le nombre de séances sur la table en cours, quand il
  //    atteint le seuil ; null sinon.
  function tableCommencee(ligne) {
    if (!ligne || ligne.acquise) return false;
    return Boolean(ligne.seance.dernier) || ligne.seance.n > 0 || CLES_FOIS.some(cle => ligne.fois[cle] > 0);
  }

  function resumeProf(parcours, aujourdhui = jourLocal()) {
    const seances = bilanSeances(parcours, aujourdhui).semaine;
    const acquises = tablesAcquises(parcours);
    const rien = {type: "rien", tables: [], pleines: 0, total: 10, texte: "—", ordre: 0};
    if (estVide(parcours) && !TABLES.some(table => tableCommencee(parcours.tables[table]))) return {enCours: rien, seances, longue: null};
    let enCours;
    if (acquises.length === TABLES.length) {
      const etoiles = parcours.expert.etoiles;
      const texte = parcours.expert.couronne ? "👑" : (etoiles ? "★".repeat(etoiles) : "les 9 tables");
      enCours = {type: "expert", tables: [], pleines: 0, total: 10, texte, ordre: 3000 + etoiles + (parcours.expert.couronne ? 1 : 0)};
    } else {
      const table = tableDeSeance(parcours);
      const commencees = TABLES.filter(candidate => tableCommencee(parcours.tables[candidate]));
      const rang = ORDRE_CONSEIL.indexOf(table) + 1;
      if (commencees.length >= 2) {
        const liste = commencees.length === 2
          ? commencees.join(" et ")
          : `${commencees.slice(0, -1).join(", ")} et ${commencees[commencees.length - 1]}`;
        enCours = {type: "tables", tables: commencees, pleines: 0, total: 10, texte: `tables ${liste}`, ordre: rang * 100 + 50};
      } else {
        const rangee = rangeeTable(parcours, table);
        enCours = {type: "table", tables: [table], pleines: rangee.pleines, total: rangee.total,
                   texte: `table de ${table} · ${rangee.pleines} sur ${rangee.total}`, ordre: rang * 100 + rangee.pleines};
      }
    }
    let longue = null;
    if (enCours.type === "table" || enCours.type === "tables") {
      const n = parcours.tables[tableDeSeance(parcours)].seance.n;
      if (n >= SEUILS.prof.seancesLongues) longue = {table: tableDeSeance(parcours), seances: n};
    }
    return {enCours, seances, longue};
  }

  // ---------------------------------------------------- le rangement par code
  //
  // Un rangement PAR CODE sur l'appareil (lot A1, 30/08/2026) : la case
  // « sans code » garde la clé historique, chaque code élève a la sienne.
  // Changer de code, c'est changer de case avant d'afficher quoi que ce soit —
  // Bob qui arrive sur la tablette d'Alice ne voit ni n'écrase rien d'elle, et
  // rien de lui ne part sous son code. Aucun verrou, aucune course contre le
  // réseau : les cases sont séparées par construction.
  //
  // Depuis le lot 8 (03/09/2026), la clé d'une case ne porte plus le code en
  // clair mais une EMPREINTE du code : n'importe quel script chargé par une
  // page du site peut lire le stockage durable de mathsgo.re (les scripts
  // tiers du lot 10, par exemple), et une tablette de CDI y gardait la liste
  // des codes de tous les élèves passés dessus. L'empreinte est un SHA-256
  // répété (ITERATIONS_EMPREINTE fois) de « sel:code », tronqué à 16
  // caractères hexadécimaux ; le sel est tiré au hasard une fois par appareil
  // et rangé à côté des cases. Lire les clés ne donne donc plus les codes :
  // les retrouver demanderait d'essayer le milliard de codes possibles, sel
  // compris, un milliard de fois dix mille SHA-256 par appareil. Le SHA-256
  // est écrit ici, en JavaScript pur, plutôt qu'emprunté à crypto.subtle : le
  // rangement doit rester SYNCHRONE (la case est chargée avant le premier
  // affichage, sans attendre une promesse), et une même clé doit sortir sur
  // tous les navigateurs, y compris là où crypto.subtle manque (page ouverte
  // en http sur un réseau local). Les tests comparent cette implémentation à
  // celle de Node.
  //
  // Sous un code, la case ne contient plus de prénom : celui que le professeur
  // a saisi arrive du serveur et ne vit que le temps de l'onglet, avec le code
  // (voir chargerIdentiteOnglet). La case « sans code » garde le sien — c'est
  // l'appareil d'une famille, pas celui d'une classe.
  const CLE_SEL = "mathsgo-defi-tables-sel";
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

  function charger(stockage, code) {
    try {
      const brut = stockage && stockage.getItem(cleStockage(code, stockage));
      if (!brut) return creerParcours();
      return sansPrenomSousCode(normaliserParcours(JSON.parse(brut)), code);
    } catch (_) {
      return creerParcours();
    }
  }

  function sauver(stockage, parcours, code) {
    try {
      if (!stockage) return false;
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
  const CLE_SYNC = "mathsgo-defi-tables-sync";

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
    // Lot « Les records » : deux cases de plus, seulement quand elles
    // servent (une case sans records garde sa forme d'avant).
    //  - « course » : un temps de course (25 sur 25) que le serveur n'a pas
    //    encore accepté — serveur muet, ou couronne pas encore enregistrée
    //    là-bas. Il part au prochain envoi ; deux courses en attente, on
    //    garde la meilleure.
    //  - « record » : ce que le serveur a dit en dernier du record de CET
    //    élève (meilleur temps, celui de la semaine et son lundi, le choix du
    //    nom), pour que l'accueil l'écrive même quand le serveur ne répond
    //    pas. Jamais un classement : il vient du serveur à chaque fois.
    const course = normaliserCourseEnAttente(lu.course);
    if (course) sync.course = course;
    const record = normaliserRecordConnu(lu.record);
    if (record) sync.record = record;
    return sync;
  }

  function normaliserCourseEnAttente(brut) {
    if (!brut || typeof brut !== "object") return null;
    const temps = entier(brut.temps, SEUILS.course.dixiemesMin, SEUILS.course.dixiemesMax, 0);
    if (!temps) return null;
    return {temps, jour: dateOuNull(brut.jour)};
  }

  function normaliserRecordConnu(brut) {
    if (!brut || typeof brut !== "object") return null;
    const meilleur = entier(brut.meilleur, 1, SEUILS.course.dixiemesMax, null);
    const semaine = entier(brut.semaine, 1, SEUILS.course.dixiemesMax, null);
    return {
      meilleur,
      meilleurLe: meilleur === null ? null : dateOuNull(brut.meilleurLe),
      semaine,
      lundi: semaine === null ? null : dateOuNull(brut.lundi),
      // true : prénom ; false : Mystère ; null : pas encore choisi.
      nom: brut.nom === true ? true : brut.nom === false ? false : null
    };
  }

  // La meilleure des deux courses en attente (la plus courte).
  function garderMeilleureCourse(actuelle, nouvelle) {
    const a = normaliserCourseEnAttente(actuelle);
    const b = normaliserCourseEnAttente(nouvelle);
    if (!a) return b;
    if (!b) return a;
    return b.temps < a.temps ? b : a;
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
      // La file des réponses à rejouer (plus bas) n'appartient pas à l'état
      // que la page tient en mémoire : chaque onglet réécrit son « sync » à
      // tout moment, et ne doit pas effacer les réponses qu'un autre onglet
      // du même code vient d'y ajouter. On garde donc celle qui est rangée.
      delete propre.reponses;
      const cle = cleSync(code, stockage);
      const rangee = lireReponsesBrutes(stockage, cle);
      if (rangee) propre.reponses = rangee;
      stockage.setItem(cle, JSON.stringify(propre));
      return true;
    } catch (_) {
      return false;
    }
  }

  // ------------------------------------------- les réponses à rejouer
  //
  // Lot « fusion jours différents », correctif du 23/10/2026 au soir (après
  // la relecture de Codex de la PR #1046). Sous un code, l'appareil note
  // chaque réponse de la grille (Mes calculs) que le serveur n'a pas encore
  // confirmée : [numéro, calcul, jour, juste (1) ou faux (0)]. Quand l'état du
  // serveur arrive (409, lecture à l'ouverture), la page ne fusionne plus deux
  // ÉTATS de calcul pour ces calculs-là : elle REJOUE ces réponses, avec
  // appliquerReponse, sur l'état du serveur (voir rebaser). Une case (une boîte
  // et trois dates) ne dit pas d'où elle vient ; une réponse, si.
  //  - « sure » : la file est complète — vrai dès que le serveur a confirmé un
  //    envoi (200) ou qu'une lecture a montré qu'il savait tout ce que sait
  //    l'appareil. Tant qu'elle ne l'est pas (appareil d'avant ce lot, file
  //    débordée), la page garde la fusion des états, comme avant.
  //  - « dernier » : le numéro de la dernière réponse notée. Un envoi retient
  //    le numéro qu'il couvre ; son 200 retire les réponses jusqu'à ce numéro.
  //  - « epoque » : la remise à zéro à laquelle appartiennent ces réponses.
  //  - « perduJusqua » : dernier numéro perdu ; seul un accusé qui le couvre
  //    peut rendre sûre une file débordée. Un vieux 200 ne suffit pas.
  // Rien de cette file ne part au serveur : elle reste sur l'appareil, à côté
  // de la case, et disparaît avec elle (purge des 90 jours).
  const REPONSES_MAX = 500;

  function reponsesNeutres() {
    return {sure: false, dernier: 0, liste: [], epoque: 0, perduJusqua: 0};
  }

  function normaliserReponses(brut) {
    const file = reponsesNeutres();
    if (!brut || typeof brut !== "object") return file;
    file.sure = Boolean(brut.sure);
    file.dernier = entier(brut.dernier, 0, Number.MAX_SAFE_INTEGER);
    file.epoque = entier(brut.epoque, 0, 1000000);
    file.perduJusqua = entier(brut.perduJusqua, 0, file.dernier);
    let precedent = 0;
    (Array.isArray(brut.liste) ? brut.liste : []).forEach(entree => {
      if (!Array.isArray(entree)) return;
      const numero = entier(entree[0], 1, Number.MAX_SAFE_INTEGER, 0);
      const cle = cleFait(entree[1]);
      const jour = dateOuNull(entree[2]);
      if (!numero || numero <= precedent || numero > file.dernier || !cle || !jour) return;
      precedent = numero;
      file.liste.push([numero, cle, jour, entree[3] ? 1 : 0]);
    });
    // Une file trop longue n'est plus sûre (on a dû en perdre le début).
    if (file.liste.length > REPONSES_MAX) {
      file.perduJusqua = Math.max(file.perduJusqua, file.liste[file.liste.length - REPONSES_MAX - 1][0]);
      file.liste = file.liste.slice(-REPONSES_MAX);
    }
    if (file.perduJusqua) file.sure = false;
    return file;
  }

  function lireReponsesBrutes(stockage, cle) {
    try {
      const brut = stockage && stockage.getItem(cle);
      const lu = brut ? JSON.parse(brut) : null;
      return lu && typeof lu === "object" && lu.reponses && typeof lu.reponses === "object" ? lu.reponses : null;
    } catch (_) {
      return null;
    }
  }

  function chargerReponses(stockage, code) {
    try {
      const file = normaliserReponses(lireReponsesBrutes(stockage, cleSync(code, stockage)));
      const epoque = normaliserParcours(charger(stockage, code)).epoque;
      // Une case remise à zéro ne récupère jamais les réponses de sa vie
      // précédente, même si la page s'est fermée avant de ranger sa file.
      if (file.epoque < epoque) {
        file.epoque = epoque;
        file.liste = [];
        file.sure = false;
        file.perduJusqua = file.dernier;
      }
      return file;
    } catch (_) {
      return reponsesNeutres();
    }
  }

  // Réécrit la file seule, sans toucher au reste de l'état rangé.
  function ecrireReponses(stockage, code, file) {
    try {
      if (!stockage) return false;
      const cle = cleSync(code, stockage);
      const brut = stockage.getItem(cle);
      let lu = null;
      try { lu = brut ? JSON.parse(brut) : null; } catch (_) { lu = null; }
      const etat = Object.assign(syncNeutre(), lu && typeof lu === "object" ? lu : {});
      etat.reponses = normaliserReponses(file);
      stockage.setItem(cle, JSON.stringify(etat));
      return true;
    } catch (_) {
      return false;
    }
  }

  // Une réponse de la grille vient d'être appliquée sous ce code : on la note.
  // Hors grille (× 1, × 10) : rien — la fusion des bouts suffit.
  function noterReponse(stockage, code, cleBrute, {correcte = false, date = null, epoque = null} = {}) {
    const cle = cleFait(cleBrute);
    const jour = dateOuNull(date);
    if (!codeValide(normaliserCode(code || "")) || !cle || !jour) return chargerReponses(stockage, code);
    const file = chargerReponses(stockage, code);
    const vie = epoque === null ? file.epoque : entier(epoque, 0, 1000000);
    // Un onglet antérieur au reset ne peut pas réintroduire son ancienne
    // réponse dans la file du parcours neuf partagé par les autres onglets.
    if (vie < file.epoque) return file;
    if (vie > file.epoque) {
      file.epoque = vie;
      file.liste = [];
      file.sure = false;
      file.perduJusqua = file.dernier;
    }
    file.dernier += 1;
    file.liste.push([file.dernier, cle, jour, correcte ? 1 : 0]);
    ecrireReponses(stockage, code, file);
    return chargerReponses(stockage, code);
  }

  // Le serveur a ce que couvrait l'envoi (ou la lecture) : les réponses
  // jusqu'au numéro « jusqua » sortent de la file. Elle devient sûre seulement
  // si l'accusé appartient à la même époque et couvre aussi les réponses perdues.
  function reponsesParties(stockage, code, jusqua, epoque = null) {
    const file = chargerReponses(stockage, code);
    if (epoque !== null && epoque !== file.epoque) return file;
    const limite = entier(jusqua, 0, Number.MAX_SAFE_INTEGER);
    file.liste = file.liste.filter(entree => entree[0] > limite);
    // Un vieux 200 ne répare pas une perte postérieure à son paquet.
    // Seul un paquet qui couvre aussi cette perte rétablit la confiance.
    if (limite >= file.perduJusqua) file.perduJusqua = 0;
    file.sure = file.perduJusqua === 0;
    ecrireReponses(stockage, code, file);
    return chargerReponses(stockage, code);
  }

  // « Recommencer à zéro » : les réponses d'avant ne se rejouent plus jamais.
  function oublierReponses(stockage, code, epoque = null) {
    const file = chargerReponses(stockage, code);
    if (epoque !== null) {
      if (epoque < file.epoque) return file;
      if (epoque > file.epoque) {
        file.epoque = epoque;
        file.sure = false;
        file.perduJusqua = file.dernier;
      }
    }
    file.liste = [];
    ecrireReponses(stockage, code, file);
    return chargerReponses(stockage, code);
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

  // Ce qu'un appareil « d'avant » peut encore contenir, et ce qu'on en fait :
  //  - avant le lot A1 : le code actif ET le parcours dans le stockage durable,
  //    sous une seule case → le parcours va dans la case du code, le code est
  //    oublié (l'identité ne vit plus que le temps d'un onglet) ;
  //  - du lot A1 au lot 5 : une case par code, le code EN CLAIR dans la clé,
  //    prénom compris → la case passe sous l'empreinte du code, sans prénom ;
  //    si la case à empreinte existe déjà, les deux fusionnent (rien ne se
  //    perd) ; l'état de synchronisation suit, daté d'aujourd'hui s'il ne
  //    l'était pas, pour que la purge de fin d'année sache compter.
  // Sans code rangé, la case unique devient la case « sans code » : rien à faire.
  function migrerStockage(stockage, maintenant = Date.now()) {
    let fait = false;
    try {
      if (!stockage) return false;
      const enClair = (prefixe, cle) => {
        if (!cle.startsWith(prefixe + ":")) return null;
        const code = cle.slice(prefixe.length + 1);
        return code.length === LONGUEUR_CODE && codeValide(code) && normaliserCode(code) === code ? code : null;
      };
      // 1. Les cases au code en clair (lots A1 à 5) passent sous l'empreinte.
      const cles = clesDuStockage(stockage);
      cles.forEach(cle => {
        const code = enClair(CLE_STOCKAGE, cle);
        if (!code) return;
        fait = true;
        let parcours = null;
        try { parcours = normaliserParcours(JSON.parse(stockage.getItem(cle))); } catch (_) {}
        stockage.removeItem(cle);
        if (!parcours) return;
        const existante = stockage.getItem(cleStockage(code, stockage));
        sauver(stockage, existante ? fusionner(charger(stockage, code), parcours) : parcours, code);
        // Une case sans état d'envoi (appli d'avant le lot A2) : on la date,
        // sinon la purge ne saurait jamais quand elle a servi.
        if (!stockage.getItem(cleSync(code, stockage)) && !stockage.getItem(CLE_SYNC + ":" + code)) {
          sauverSync(stockage, code, {maj: entier(maintenant, 0, Number.MAX_SAFE_INTEGER)});
        }
      });
      cles.forEach(cle => {
        const code = enClair(CLE_SYNC, cle);
        if (!code) return;
        fait = true;
        const ancienSync = lireSyncBrut(stockage, cle);
        stockage.removeItem(cle);
        const nouveau = stockage.getItem(cleSync(code, stockage)) ? chargerSync(stockage, code) : null;
        const fusion = nouveau
          ? {revision: Math.max(nouveau.revision, ancienSync.revision), dirty: nouveau.dirty || ancienSync.dirty,
            detache: nouveau.detache && ancienSync.detache, maj: Math.max(nouveau.maj, ancienSync.maj)}
          : ancienSync;
        if (!fusion.maj) fusion.maj = entier(maintenant, 0, Number.MAX_SAFE_INTEGER);
        sauverSync(stockage, code, fusion);
      });
      // 2. Le code durable d'avant le lot A1 : son parcours va dans la case du
      //    code (si elle n'existe pas déjà, sous l'empreinte ou en clair), et
      //    le code est oublié.
      const ancien = stockage.getItem(CLE_CODE);
      if (ancien) {
        stockage.removeItem(CLE_CODE);
        const code = normaliserCode(ancien);
        if (codeValide(code)) {
          fait = true;
          const brut = stockage.getItem(CLE_STOCKAGE);
          const dejaLa = stockage.getItem(cleStockage(code, stockage)) || stockage.getItem(CLE_STOCKAGE + ":" + code);
          if (brut && !dejaLa) {
            let parcours = null;
            try { parcours = normaliserParcours(JSON.parse(brut)); } catch (_) {}
            if (parcours) {
              sauver(stockage, parcours, code);
              stockage.removeItem(CLE_STOCKAGE);
              if (!stockage.getItem(cleSync(code, stockage))) {
                sauverSync(stockage, code, {maj: entier(maintenant, 0, Number.MAX_SAFE_INTEGER)});
              }
            }
          }
        }
      }
    } catch (_) {}
    return fait;
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

  // ------------------------------------------------------------------ la fusion

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

  function meilleurEntrainement(premier, second) {
    if (!premier) return second || null;
    if (!second) return premier;
    const note = dernier => (dernier.total ? dernier.score / dernier.total : 0);
    return note(second) > note(premier) ? second : premier;
  }

  // « On garde le plus avancé des deux, jamais d'écrasement. »
  //
  // Rien ne se perd : chaque compteur prend son maximum, chaque acquisition
  // gardée à sa PREMIÈRE date, chaque case de la grille son état le plus
  // récent (et, le même jour, l'erreur l'emporte : voir la boucle FAITS). Les
  // deux parcours sont interchangeables, sauf pour le prénom : celui du premier
  // gagne s'il est renseigné (c'est l'appareil devant l'élève qui a raison).
  function fusionner(premier, second) {
    const a = normaliserParcours(premier);
    const b = normaliserParcours(second);

    // Une remise à zéro a eu lieu d'un côté (époque plus haute) : elle gagne
    // entièrement. Sans cela, le maximum de chaque compteur ferait revenir
    // tout ce que l'élève vient d'effacer, dès qu'un autre appareil se
    // synchronise. Le prénom, lui, reste celui de l'appareil devant l'élève.
    if (a.epoque !== b.epoque) {
      const gagnant = cloner(a.epoque > b.epoque ? a : b);
      gagnant.prenom = a.prenom || b.prenom;
      return normaliserParcours(gagnant);
    }

    const fusion = creerParcours();
    fusion.epoque = a.epoque;
    fusion.prenom = a.prenom || b.prenom;

    TABLES.forEach(table => {
      const ligneA = a.tables[table];
      const ligneB = b.tables[table];
      const cible = fusion.tables[table];
      ACTIVITES_APPRENDS.forEach(activite => {
        cible.apprends[activite] = Math.max(ligneA.apprends[activite], ligneB.apprends[activite]);
      });
      ENTRAINEMENTS.forEach(entrainement => {
        cible.entraine[entrainement] = Math.max(ligneA.entraine[entrainement], ligneB.entraine[entrainement]);
      });
      cible.entraine.dernier = meilleurEntrainement(ligneA.entraine.dernier, ligneB.entraine.dernier);
      // Le compteur « fois » prend le plus grand des deux : deux appareils
      // portent le même parcours, pas deux moitiés à additionner.
      CLES_FOIS.forEach(cle => {
        cible.fois[cle] = Math.max(ligneA.fois[cle], ligneB.fois[cle]);
      });
      // Ma séance du jour : un bout réussi d'un côté l'est (union) ; le départ
      // de l'échelle peut redescendre, donc c'est le plus RÉCENT qui gagne —
      // celui qui a vu le plus de séances (à égalité, le plus avancé) ; un
      // « sans faute » gagné le reste.
      cible.bouts = normaliserBouts(table, [...ligneA.bouts, ...ligneB.bouts]);
      const recente = ligneA.seance.n !== ligneB.seance.n
        ? (ligneA.seance.n > ligneB.seance.n ? ligneA : ligneB)
        : (ligneA.seance.depart >= ligneB.seance.depart ? ligneA : ligneB);
      const derniers = [ligneA.seance.dernier, ligneB.seance.dernier].filter(Boolean).sort();
      cible.seance = {depart: recente.seance.depart, n: recente.seance.n, dernier: derniers.length ? derniers[derniers.length - 1] : null};
      CLES_SANS_FAUTE.forEach(cle => {
        cible.sansFaute[cle] = Math.max(ligneA.sansFaute[cle], ligneB.sansFaute[cle]);
      });
      // Une table acquise le reste, à la date de la première validation.
      cible.acquise = dateLaPlusAncienne(ligneA.acquise, ligneB.acquise);
    });

    // Mon mélange (libre) : le dernier joué — le jour le plus récent et son
    // score ; le même jour, le meilleur des deux scores. « aJour » ne sert
    // plus qu'aux appareils restés sur l'appli d'avant : gagné d'un côté, il
    // le reste.
    fusion.melange.tables = tablesAcquises(fusion);
    fusion.melange.dernier = dateLaPlusRecente(a.melange.dernier, b.melange.dernier);
    const scores = [a.melange, b.melange].filter(melange => melange.dernier === fusion.melange.dernier && melange.score !== null).map(melange => melange.score);
    fusion.melange.score = fusion.melange.dernier && scores.length ? Math.max(...scores) : null;
    fusion.melange.reussi = Math.max(a.melange.reussi || 0, b.melange.reussi || 0) || null;
    fusion.melange.aJour = a.melange.aJour || b.melange.aJour;
    fusion.melange.aRefaireAvec = null;
    // Mes calculs du jour : joué d'un côté aujourd'hui, il l'est (le jour le
    // plus récent).
    fusion.calculsDuJour = dateLaPlusRecente(a.calculsDuJour, b.calculsDuJour);

    // Les étoiles prennent le meilleur des deux, la couronne sa première date ;
    // le rang ne redescend jamais ; les jours travaillés se réunissent.
    fusion.expert.etoiles = Math.max(a.expert.etoiles, b.expert.etoiles);
    fusion.expert.dernier = dateLaPlusRecente(a.expert.dernier, b.expert.dernier);
    fusion.expert.couronne = dateLaPlusAncienne(a.expert.couronne, b.expert.couronne);
    fusion.rang = Math.max(a.rang, b.rang);
    fusion.jours = normaliserJours([...a.jours, ...b.jours]);
    // Les séances : par jour, le plus grand des deux comptes (deux appareils
    // portent le même parcours, pas deux moitiés à additionner).
    const compter = liste => liste.reduce((compte, jour) => compte.set(jour, (compte.get(jour) || 0) + 1), new Map());
    const seancesA = compter(a.seances);
    const seancesB = compter(b.seances);
    fusion.seances = normaliserSeances([...new Set([...seancesA.keys(), ...seancesB.keys()])]
      .flatMap(jour => new Array(Math.max(seancesA.get(jour) || 0, seancesB.get(jour) || 0)).fill(jour)));

    FAITS.forEach(cle => {
      const faitA = a.calculs[cle];
      const faitB = b.calculs[cle];
      if (!faitA && !faitB) return;
      if (!faitA || !faitB) {
        fusion.calculs[cle] = cloner(faitA || faitB);
        return;
      }
      // Par calcul, le jour le plus récent gagne en bloc : une erreur faite
      // aujourd'hui ne doit pas être effacée par l'état d'hier à trois cases.
      // Exact sur un seul appareil (l'état d'aujourd'hui descend de celui
      // d'hier), et la même boîte quel que soit l'ordre des fusions. Faux
      // seulement quand le côté le plus récent est une COPIE ANCIENNE qui a
      // joué depuis (un appareil resté hors ligne, ou une page ouverte depuis
      // longtemps) : ses réponses sont alors comptées sur une boîte périmée.
      // Ce cas-là ne se règle pas ici — une case ne dit pas d'où elle vient —
      // mais dans la page, qui REJOUE ses réponses sur l'état du serveur (voir
      // rebaser, correctif du 23/10/2026 ; la règle « par dates » de la PR
      // #1046, essayée ici, cassait d'autres cas : relecture de Codex).
      if (faitA.vu !== faitB.vu) {
        fusion.calculs[cle] = cloner(faitA.vu > faitB.vu ? faitA : faitB);
        return;
      }
      // Même jour (lot « fusion du même jour », 22/10/2026). Le jour d'une
      // erreur, aucun gain n'est possible sur ce calcul (appliquerReponse :
      // pas de regain le jour d'une erreur) : une erreur datée de ce jour est
      // donc forcément POSTÉRIEURE à tout gain du même jour. D'où :
      //  1. un seul côté porte une erreur de ce jour → il gagne : son erreur,
      //     son échéance (aujourd'hui), son gain, et sa boîte — mais JAMAIS
      //     plus d'une boîte sous l'autre côté (une erreur = une boîte de
      //     moins, pas plus). Sur un seul appareil (sauverCase, le cas de tous
      //     les jours), ce côté descend de l'autre : exact. Sans ce plancher,
      //     un appareil resté longtemps hors ligne (boîte 2 d'il y a un mois,
      //     erreur → 1) écrasait la boîte 5 de l'appareil du jour (correctif
      //     du 23/10/2026, trouvé par Codex) ;
      //  2. les deux côtés portent une erreur de ce jour → la boîte la plus
      //     haute et son échéance : au plus une descente par jour, donc chaque
      //     côté vaut « sa boîte du matin − 1 », et le côté le plus haut est
      //     celui qui avait le parcours le plus à jour ;
      //  3. aucune erreur de ce jour → la boîte la plus haute et l'échéance
      //     qui va avec (à boîte égale, la plus proche — le calcul revient
      //     plutôt trop tôt que trop tard).
      // Avant le 22/10/2026, « la plus haute » dans tous les cas : sous un
      // code, la case de l'appareil (réussite du matin) effaçait l'erreur de
      // l'après-midi à chaque sauvegarde, et le tableau restait bleu. LIMITES
      // de la fusion des états, acceptées (relecture Codex du 23/10/2026) :
      // gain sur un appareil et erreur sur l'autre, le même jour → une boîte
      // au-dessus de la vérité si l'erreur est venue avant le gain — possible
      // avec deux pages ouvertes et connectées, pas seulement hors ligne ; une
      // copie restée sur une boîte PLUS HAUTE, sans erreur ce jour → la fusion
      // la croit. Sous un code, la page évite ces cas pour les calculs qu'elle
      // a joués : elle rejoue ses réponses sur l'état du serveur (rebaser).
      const erreurA = faitA.erreur === faitA.vu;
      const erreurB = faitB.erreur === faitB.vu;
      if (erreurA !== erreurB) {
        const rate = erreurA ? faitA : faitB;
        const autre = erreurA ? faitB : faitA;
        const boiteRatee = Math.max(rate.boite, autre.boite - 1);
        fusion.calculs[cle] = {...cloner(rate), boite: boiteRatee, cases: casesDeBoite(boiteRatee)};
        return;
      }
      const boite = Math.max(faitA.boite, faitB.boite);
      const echeance = faitA.boite !== faitB.boite
        ? (faitA.boite === boite ? faitA : faitB).echeance
        : dateLaPlusAncienne(faitA.echeance, faitB.echeance);
      fusion.calculs[cle] = {
        boite,
        cases: casesDeBoite(boite),
        vu: faitA.vu,
        // Erreur et gain les plus récents : la fusion ne rouvre jamais le droit
        // de monter le jour d'une erreur.
        erreur: dateLaPlusRecente(faitA.erreur, faitB.erreur),
        gagne: dateLaPlusRecente(faitA.gagne, faitB.gagne),
        echeance
      };
    });

    // La séance en cours (lot M1) : la plus RÉCENTE des deux gagne — le jour
    // le plus récent, puis celle ouverte après le plus de séances finies, puis
    // celle qui a le plus d'étapes faites. Et elle ne survit que si elle tient
    // encore dans le parcours fusionné : une séance finie sur l'autre appareil
    // (son jour compte une séance de plus) ne ressuscite pas ici.
    const enCours = [a.enCours, b.enCours].filter(Boolean).sort((premiere, seconde) =>
      (premiere.jour < seconde.jour ? 1 : premiere.jour > seconde.jour ? -1 : 0)
      || seconde.rang - premiere.rang
      || seconde.faites.length - premiere.faites.length)[0] || null;
    fusion.enCours = enCoursTient(fusion, enCours) ? cloner(enCours) : null;

    // « À retenir » : le jour le plus récent ; le même jour, les deux listes
    // réunies (une séance sur chaque appareil).
    const listes = [a.retenir, b.retenir].filter(Boolean).sort((premiere, seconde) => (premiere.jour < seconde.jour ? 1 : premiere.jour > seconde.jour ? -1 : 0));
    fusion.retenir = listes.length
      ? normaliserRetenir({jour: listes[0].jour, erreurs: listes.filter(liste => liste.jour === listes[0].jour).flatMap(liste => liste.erreurs)})
      : null;

    return normaliserParcours(fusion);
  }

  // Retrouver le serveur (correctif du lot « fusion jours différents »,
  // 23/10/2026). « local » : ce que l'appareil sait ; « distant » : l'état du
  // serveur ; « reponses » : la file sûre des réponses que le serveur n'a pas
  // encore (chargerReponses). Tout se fusionne comme avant (fusionner), SAUF
  // les calculs que ces réponses touchent : pour eux, on part de l'état du
  // serveur et on rejoue les réponses, dans l'ordre, avec appliquerReponse —
  // exactement comme si l'élève avait répondu sur l'appareil à jour. La copie
  // restée un mois hors ligne en boîte 2 qui rate 2 × 8 donne donc 4 sur la
  // boîte 5 du serveur, sa bonne réponse 5, et la vieille copie en 5 qui rate
  // sur un serveur descendu en 2 donne 1.
  // Rejeu seulement si TOUTES les réponses de ce calcul viennent APRÈS le
  // dernier jour vu au serveur. Sinon, on ne sait pas lesquelles il contient
  // déjà, ni l'ordre des réponses concurrentes : fusionner garde exactement
  // le comportement de main pour ce calcul. Ne jamais supprimer une réponse
  // ancienne puis rejouer la suite : on perdrait un gain (réserve A, 24/10).
  // Le même jour est ambigu aussi : aucun accusé de réception ne se déduit
  // d'une date. La page garde le résultat du rejeu en mémoire ET dans la case.
  // Une remise à zéro d'un côté (époques différentes) : fusionner décide seul.
  function rebaser(local, distant, reponses) {
    const fusion = fusionner(local, distant);
    const serveur = normaliserParcours(distant);
    if (normaliserParcours(local).epoque !== serveur.epoque) return fusion;
    const liste = Array.isArray(reponses) ? reponses : [];
    if (!liste.length) return fusion;
    let rejoue = serveur;
    const touches = new Set();
    const ambigus = new Set();
    const derniers = new Map();
    liste.forEach(entree => {
      const cle = cleFait(entree && entree[1]);
      const jour = dateOuNull(entree && entree[2]);
      if (!cle || !jour) return;
      const connu = serveur.calculs[cle];
      if ((connu && connu.vu && jour <= connu.vu) || (derniers.has(cle) && jour < derniers.get(cle))) ambigus.add(cle);
      derniers.set(cle, jour);
    });
    liste.forEach(entree => {
      const cle = cleFait(entree && entree[1]);
      const jour = dateOuNull(entree && entree[2]);
      if (!cle || !jour || ambigus.has(cle)) return;
      touches.add(cle);
      rejoue = appliquerReponse(rejoue, cle, {correcte: Boolean(entree[3]), date: jour}).parcours;
    });
    const resultat = cloner(fusion);
    touches.forEach(cle => {
      if (rejoue.calculs[cle]) resultat.calculs[cle] = cloner(rejoue.calculs[cle]);
    });
    return normaliserParcours(resultat);
  }

  // ------------------------------------------------------- la vue d'une classe

  // Les calculs qui coincent chez le plus d'élèves de la classe, pour savoir
  // quoi réviser au tableau lundi matin. N'utilise que ce qui est déjà stocké.
  function fragilesDeLaClasse(parcoursDesEleves, {max = 5} = {}) {
    const compte = new Map();
    (Array.isArray(parcoursDesEleves) ? parcoursDesEleves : []).forEach(brut => {
      if (!brut) return;
      const parcours = normaliserParcours(brut);
      calculsATravailler(parcours).forEach(cle => {
        compte.set(cle, (compte.get(cle) || 0) + 1);
      });
    });
    return [...compte.entries()]
      .map(([cle, eleves]) => ({cle, libelle: libelleFait(cle), eleves}))
      .sort((premier, second) => second.eleves - premier.eleves || premier.cle.localeCompare(second.cle))
      .slice(0, Math.max(0, max));
  }

  function estVide(parcours) {
    return !parcours.prenom && !parcours.expert.etoiles && !Object.keys(parcours.calculs).length && TABLES.every(table => {
      const ligne = parcours.tables[table];
      return !ligne.acquise
        && ACTIVITES_APPRENDS.every(activite => ligne.apprends[activite] === 0)
        && ENTRAINEMENTS.every(entrainement => ligne.entraine[entrainement] === 0)
        && !ligne.bouts.length;
    });
  }

  return Object.freeze({
    VERSION,
    CLE_STOCKAGE,
    TABLES,
    ORDRE_CONSEIL,
    ACTIVITES_APPRENDS,
    ENTRAINEMENTS,
    SEUILS,
    ETOILES_MAX,
    RANGS,
    LIBELLES_ENTRAINEMENTS,
    LIBELLES_APPRENDS,
    CONSIGNES_APPRENDS,
    PRENOM_MAX,
    creerParcours,
    normaliserParcours,
    nettoyerPrenom,
    definirPrenom,
    remettreAZero,
    tablesAcquises,
    toutesAcquises,
    classerSerie,
    demarrerSerie,
    appliquerSerie,
    calculRateDeuxFois,
    configApprends,
    configEntraine,
    configValidation,
    configMelange,
    tropheesMelange,
    melangeAuPalier,
    melangeAvantLeTest,
    configEtoile,
    dureeEtoile,
    erreursMaxEtoile,
    configCourse,
    recordsPossibles,
    courseCompte,
    formatTemps,
    libelleRang,
    garderMeilleureCourse,
    normaliserRecordConnu,
    symboleEtoile,
    libelleDuree,
    escalierOuvert,
    rang,
    rangDeLEtat,
    jourLocal,
    lundiDe,
    ajouterJours,
    ecartJours,
    bilanJours,
    FAITS,
    cleFait,
    facteursFait,
    libelleFait,
    faitsDeLaTable,
    validationTable,
    CLES_FOIS,
    FOIS_MAX,
    etatFait,
    faitDu,
    echeanceDeBoite,
    serieAlimenteGrille,
    appliquerReponse,
    resumeCalculs,
    grilleCalculs,
    calculsDeLaBoite,
    calculsDus,
    calculsAVenir,
    calculsEnRetard,
    calculDesTablesPassees,
    prisParMesCalculs,
    dusDuJour,
    serieDuJour,
    mesCalculsAFaire,
    dureeMesCalculs,
    formesPermises,
    agendaCalculs,
    calculsATravailler,
    tablesARevoir,
    planRevision,
    configRevision,
    conseilTable,
    prochaineEtape,
    etapeTable,
    etatAffichage,
    MARCHES,
    CLES_SANS_FAUTE,
    multiplicateursBouts,
    rangeeTable,
    raccourciValidation,
    validationDeSeance,
    tableDeSeance,
    ouvrirSeance,
    seanceEnCours,
    etapeDeSeance,
    programmeDeSeance,
    marcheRatee,
    noterEtape,
    aRetenir,
    retenirErreurs,
    bilanSeances,
    resumeProf,
    commencerApresDecouverte,
    departApresDecouverte,
    MARCHE_APRES_DECOUVERTE,
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
    effacer,
    migrerStockage,
    purger,
    clesRevelentUnCode,
    CLE_SYNC,
    cleSync,
    chargerSync,
    sauverSync,
    effacerSync,
    REPONSES_MAX,
    normaliserReponses,
    chargerReponses,
    noterReponse,
    reponsesParties,
    oublierReponses,
    estVide,
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
    fusionner,
    rebaser,
    fragilesDeLaClasse
  });
});
