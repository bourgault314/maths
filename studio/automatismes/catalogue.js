/*
 * Catalogue du nouveau menu Automatismes (bêta interne).
 *
 * Ces données sont une copie fidèle de trois sources de l'application
 * actuelle, qui reste la référence tant que la migration n'est pas finie :
 *   - auto/scripts/00-module-manifest.js            (titres, niveaux, domaines)
 *   - auto/scripts/core/01-series-contracts.js      (codes MG1 permanents)
 *   - auto/scripts/02-question-engine.js            (groupes du menu, filtre 5e)
 * Le test studio/automatismes/mg1.test.js compare ce fichier aux sources :
 * si l'application actuelle évolue, le test échoue et signale la dérive.
 */
(() => {
  'use strict';

  const DOMAINES = Object.freeze([
    { id: 'numbers', titre: 'Nombres et calculs' },
    { id: 'geometry', titre: 'Espace et géométrie' },
    { id: 'data', titre: 'Données, statistiques et probabilités' },
    { id: 'algorithm', titre: 'Pensée informatique' }
  ]);

  const SOUS_GROUPES = Object.freeze({
    numbers: [
      { id: 'numeration', titre: 'Numération', modules: ['dnb_02', 'dnb_02b', 'dnb_14'] },
      { id: 'entiers-divisibilite', titre: 'Nombres entiers et divisibilité', modules: ['dnb_08', 'dnb_09'] },
      { id: 'fractions', titre: 'Fractions et nombres rationnels', modules: ['dnb_01', 'dnb_03', 'dnb_03b', 'dnb_04', 'dnb_05'] },
      { id: 'relatifs', titre: 'Nombres relatifs', modules: ['dnb_38', 'dnb_39'] },
      { id: 'puissances', titre: 'Puissances', modules: ['dnb_07', 'dnb_06'] },
      { id: 'algebre', titre: 'Calcul littéral et algèbre', modules: ['dnb_10', 'dnb_11', 'dnb_12', 'dnb_13'] }
    ],
    geometry: [
      { id: 'reperage', titre: 'Repérage', modules: ['dnb_15'] },
      { id: 'transformations', titre: 'Transformations', modules: ['dnb_27'] },
      { id: 'angles-triangles', titre: 'Angles et triangles', modules: ['dnb_16', 'dnb_17', 'dnb_18'] },
      { id: 'theoremes-trigonometrie', titre: 'Pythagore, Thalès et trigonométrie', modules: ['dnb_24', 'dnb_25', 'dnb_26', 'dnb_26b'] },
      { id: 'manipuler-telephone', titre: 'Manipuler sur téléphone', modules: ['dnb_24b'] },
      { id: 'mesures', titre: 'Conversions, aires et périmètres', modules: ['dnb_19', 'dnb_21', 'dnb_22'] },
      { id: 'espace', titre: 'Espace, solides et patrons', modules: ['dnb_20', 'dnb_23'] }
    ],
    data: [
      { id: 'statistiques', titre: 'Statistiques et moyennes', modules: ['dnb_32', 'dnb_29', 'dnb_30', 'dnb_31'] },
      { id: 'probabilites', titre: 'Probabilités', modules: ['dnb_28'] },
      { id: 'proportionnalite', titre: 'Proportionnalité, ratios et pourcentages', modules: ['dnb_33', 'dnb_34', 'dnb_35'] },
      { id: 'fonctions', titre: 'Fonctions', modules: ['dnb_36'] }
    ],
    algorithm: [
      { id: 'pensee-informatique', titre: 'Pensée informatique', modules: ['dnb_37'] }
    ]
  });

  // [id canonique, id historique, code MG1 permanent, titre, niveaux, domaine]
  const MODULES = Object.freeze([
    ['fractions-ecriture-decimale', 'dnb_01', 0, 'Écriture décimale des fractions simples', ['4e', '3e', 'DNB'], 'numbers'],
    ['nombres-decimaux-comparer-calculer', 'dnb_02', 1, 'Comparer et calculer avec des nombres décimaux', ['5e', '4e', '3e', 'DNB'], 'numbers'],
    ['multiplier-diviser-par-10-100-1000', 'dnb_02b', 2, 'Multiplier et diviser par 10, 100 et 1 000', ['5e', '4e', '3e', 'DNB'], 'numbers'],
    ['fractions-simplifier-comparer-additionner', 'dnb_03', 3, 'Fractions : simplifier, comparer, additionner', ['4e', '3e', 'DNB'], 'numbers'],
    ['fractions-multiplier-diviser', 'dnb_03b', 4, 'Fractions : multiplier et diviser', ['4e', '3e', 'DNB'], 'numbers'],
    ['fractions-quantite-pourcentages', 'dnb_04', 5, 'Fractions d’une quantité et pourcentages repères', ['4e', '3e', 'DNB'], 'numbers'],
    ['nombre-formes-equivalentes', 'dnb_05', 6, 'Un même nombre sous plusieurs formes', ['4e', '3e', 'DNB'], 'numbers'],
    ['notation-scientifique', 'dnb_06', 7, 'Notation scientifique', ['4e', '3e', 'DNB'], 'numbers'],
    ['carres-entiers', 'dnb_07', 8, 'Carrés des entiers de 1 à 12', ['4e', '3e', 'DNB'], 'numbers'],
    ['criteres-divisibilite', 'dnb_08', 9, 'Critères de divisibilité par 2, 3, 5, 9 et 10', ['4e', '3e', 'DNB'], 'numbers'],
    ['relations-numeriques', 'dnb_09', 10, 'Double, triple, moitié, prédécesseur, successeur et carré', ['4e', '3e', 'DNB'], 'numbers'],
    ['reduire-expression-litterale', 'dnb_10', 11, 'Simplifier des expressions littérales', ['4e', '3e', 'DNB'], 'numbers'],
    ['substitution-expression', 'dnb_11', 12, "Calculer la valeur d'une expression algébrique", ['4e', '3e', 'DNB'], 'numbers'],
    ['developper-factoriser', 'dnb_12', 13, 'Développer et factoriser une expression simple', ['4e', '3e', 'DNB'], 'numbers'],
    ['resoudre-equations', 'dnb_13', 14, 'Résoudre des équations', ['4e', '3e', 'DNB'], 'numbers'],
    ['lire-abscisse', 'dnb_14', 15, 'Lire une abscisse sur une droite graduée', ['4e', '3e', 'DNB'], 'numbers'],
    ['lire-coordonnees', 'dnb_15', 16, 'Lire des coordonnées dans un repère', ['4e', '3e', 'DNB'], 'geometry'],
    ['codage-figures', 'dnb_16', 17, "Codage d'une figure — triangles, quadrilatères, médiatrice", ['4e', '3e', 'DNB'], 'geometry'],
    ['angles-reconnaitre-nommer-mesurer', 'dnb_17', 18, 'Angles : reconnaître, nommer et mesurer', ['4e', '3e', 'DNB'], 'geometry'],
    ['somme-angles-triangle', 'dnb_18', 19, "Somme des angles d'un triangle", ['4e', '3e', 'DNB'], 'geometry'],
    ['conversions-unites', 'dnb_19', 20, "Conversions d'unités", ['4e', '3e', 'DNB'], 'geometry'],
    ['reconnaitre-solides', 'dnb_20', 21, 'Reconnaître des solides', ['4e', '3e', 'DNB'], 'geometry'],
    ['perimetres', 'dnb_21', 22, 'Périmètres de polygones et de disques', ['4e', '3e', 'DNB'], 'geometry'],
    ['aires', 'dnb_22', 23, 'Aires : rectangle, carré, triangle et disque', ['4e', '3e', 'DNB'], 'geometry'],
    ['volumes', 'dnb_23', 24, 'Volumes : cube, pavé droit, prisme et cylindre', ['4e', '3e', 'DNB'], 'geometry'],
    ['pythagore', 'dnb_24', 25, 'Théorème de Pythagore : égalité et situations', ['4e', '3e', 'DNB'], 'geometry'],
    ['thales', 'dnb_25', 26, 'Théorème de Thalès : triangles emboîtés', ['3e', 'DNB'], 'geometry'],
    ['trigonometrie-sans-calculatrice', 'dnb_26', 27, 'Trigonométrie sans calculatrice', ['3e', 'DNB'], 'geometry'],
    ['trigonometrie-avec-calculatrice', 'dnb_26b', 28, 'Trigonométrie avec calculatrice', ['3e'], 'geometry'],
    ['transformations', 'dnb_27', 29, 'Symétries axiale, centrale et translation', ['4e', '3e', 'DNB'], 'geometry'],
    ['probabilites-equiprobabilite', 'dnb_28', 30, 'Probabilités — équiprobabilité', ['4e', '3e', 'DNB'], 'data'],
    ['frequences', 'dnb_29', 31, 'Fréquences simples', ['4e', '3e', 'DNB'], 'data'],
    ['moyennes', 'dnb_30', 32, 'Moyennes', ['4e', '3e', 'DNB'], 'data'],
    ['mediane-etendue', 'dnb_31', 33, 'Médiane et étendue', ['4e', '3e', 'DNB'], 'data'],
    ['lire-tableaux-diagrammes-graphiques', 'dnb_32', 34, 'Lire des tableaux, diagrammes et graphiques', ['4e', '3e', 'DNB'], 'data'],
    ['reconnaitre-proportionnalite', 'dnb_33', 35, 'Reconnaître une situation de proportionnalité', ['4e', '3e', 'DNB'], 'data'],
    ['problemes-proportionnalite', 'dnb_34', 36, 'Résoudre un problème de proportionnalité', ['4e', '3e', 'DNB'], 'data'],
    ['evolutions-pourcentage', 'dnb_35', 37, 'Augmentation et diminution en pourcentage', ['4e', '3e', 'DNB'], 'data'],
    ['lire-graphique-dependance', 'dnb_36', 38, 'Lire un graphique de dépendance', ['4e', '3e', 'DNB'], 'data'],
    ['algorithmique-instructions', 'dnb_37', 39, 'Interpréter une suite d’instructions', ['4e', '3e', 'DNB'], 'algorithm'],
    ['relatifs-addition-entiers-jetons', 'dnb_38', 40, 'Addition de nombres entiers relatifs', ['5e', '4e', '3e', 'DNB'], 'numbers'],
    ['pythagore-tactile', 'dnb_24b', 41, 'Pythagore — manipuler sur téléphone', ['4e', '3e', 'DNB'], 'geometry', { interactifSeulement: true }],
    ['decimaux-relatifs-comparer-calculer', 'dnb_39', 42, 'Comparer et calculer avec des nombres décimaux relatifs', ['5e', '4e', '3e', 'DNB'], 'numbers']
  ].map(([id, idHistorique, code, titre, niveaux, domaine, options]) => Object.freeze({
    id, idHistorique, code, titre,
    niveaux: Object.freeze(niveaux),
    domaine,
    interactifSeulement: Boolean(options && options.interactifSeulement)
  })));

  // Modules disposant de questions adaptées à la 5e (clés de LEVEL_5E_QUESTIONS
  // dans le moteur actuel — le filtre question par question reste côté moteur).
  const MODULES_5E = Object.freeze([
    'dnb_01', 'dnb_02', 'dnb_02b', 'dnb_03', 'dnb_04', 'dnb_05', 'dnb_07', 'dnb_08',
    'dnb_09', 'dnb_10', 'dnb_11', 'dnb_12', 'dnb_13', 'dnb_14', 'dnb_15', 'dnb_16',
    'dnb_17', 'dnb_18', 'dnb_19', 'dnb_20', 'dnb_21', 'dnb_22', 'dnb_23', 'dnb_27',
    'dnb_28', 'dnb_29', 'dnb_30', 'dnb_32', 'dnb_33', 'dnb_34', 'dnb_37', 'dnb_38',
    'dnb_39'
  ]);

  globalThis.MATHSGO_CATALOGUE_AUTOMATISMES = Object.freeze({
    DOMAINES,
    SOUS_GROUPES,
    MODULES,
    MODULES_5E,
    NIVEAUX: Object.freeze(['5e', '4e', '3e', 'DNB']),
    NOMBRES_DE_QUESTIONS: Object.freeze([5, 10, 15, 20])
  });
})();
