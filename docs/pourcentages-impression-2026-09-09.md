# Pourcentages : fiche papier du 9 septembre 2026

## Décision validée

Gwenaël a validé la refonte de la fiche papier et demandé sa publication.
Le diaporama et la progression des calculs en Entiers et Décimaux restent inchangés.

| Point | Avant | Après |
|---|---|---|
| Gabarits principaux | Case Gabarits, cochée | Même option, regroupée dans « Fiche papier », cochée par défaut |
| Aides supplémentaires | Dépendaient des aides ouvertes question par question dans le diaporama | Case « Ajouter les aides de calcul », décochée par défaut, commune à toute la fiche |
| Questions ordinaires | Une seule colonne | Deux colonnes, par paires, dans l’ordre des questions |
| Gabarits très découpés | Pleine largeur | Pleine largeur conservée pour 5 %, Boss et augmentations de plus de dix cases |
| Place pour répondre | Espace surtout sans gabarits | Deux lignes espacées de 5,5 mm sous chaque question élève |
| Corrigé | Toujours ajouté | Case « Inclure le corrigé », cochée par défaut, sur des pages séparées |
| Mise en page | Grands canevas de diaporama autour des dessins | A4 portrait, marges resserrées autour des tableaux, chiffres adaptés à la demi-page, nombre de pages selon le contenu |

Une question, ses gabarits et son espace de réponse restent ensemble. Une paire
n'est pas coupée entre deux pages. Une question ordinaire seule avant un gabarit
large reste en colonne gauche pour conserver l'ordre de la série. La fiche ne
cherche pas à faire tenir toutes les questions sur une seule page.

## Règle des aides

Avec Gabarits coché, la fiche élève montre le tableau du pourcentage demandé.
« Ajouter les aides de calcul » ajoute les tableaux auxiliaires disponibles et
leur phrase explicative :

- 25 % : tableau de 50 %, « Je prends la moitié, puis encore la moitié. »
- 20 % : tableau de 10 %, « Je trouve 10 %, puis je double. »
- 5 % : tableau de 10 %, « Je trouve 10 %, puis je prends la moitié. »

En Entiers, 20 % de 80 autorise l'aide par 10 %, mais 20 % de 25 ne l'autorise pas.
Cette règle est partagée avec le diaporama et préserve le calcul mental entier.
Les gabarits élèves ne donnent jamais de valeur inconnue corrigée.

Ouvrir ou fermer une aide dans le diaporama n'affecte plus l'impression. Changer
les cases de la fiche n'affecte ni les aides du diaporama, ni la série, ni sa seed.

Si Gabarits est décoché, la fiche élève ne contient aucun schéma. Si le corrigé
est inclus, ses schémas restent présents ; les aides supplémentaires y suivent
la même case globale « Ajouter les aides de calcul ». Décocher « Inclure le
corrigé » imprime seulement les questions et leurs espaces de réponse.

Le fonctionnement de création de série est conservé : générer le diaporama crée
les questions, puis « Fiche PDF/Papier » imprime exactement cette série.

## Historique et retour arrière

- Dépôt : `bourgault314/maths`.
- Base avant ce lot : `b243520e4ef44597802fbdade64643498d201b32` (PR #702).
- Fichier : `outils/pourcentages_exerciceur.html`.
- Blob avant modification : `b035ccd8382584b6ed1dac821db1e1f1f7ece859`.
- Les décisions décimales restent dans `pourcentages-progression-decimaux-2026-09-09.md`.
  Sa description de l'ancienne impression est remplacée par la présente décision.

[Version avant la refonte papier](https://github.com/bourgault314/maths/blob/b243520e4ef44597802fbdade64643498d201b32/outils/pourcentages_exerciceur.html).

La PR dédiée est fusionnée par squash. Pour annuler tout le lot papier, créer une
nouvelle branche et appliquer `git revert <commit-de-fusion-du-lot-papier>`, puis
tester et republier par PR. Cela conserve le lot décimal précédent et les autres
travaux du dépôt. Si le fichier a évolué depuis, conserver les modifications
ultérieures en résolvant les éventuels conflits. On peut aussi reprendre seulement
les réglages ou la mise en page souhaités à partir de ce document et du diff.

## Vérifications

Commande : `node --test tests/pourcentages-exerciceur.test.mjs`.

- 19 tests ciblés réussis : calculs, catégories, niveaux, mélange des nombres,
  navigation, aides du diaporama, huit combinaisons des options papier, ordre,
  pleine largeur, espace de réponse et absence de fuite des résultats élèves.
- Empreinte des 46 800 calculs des deux modes relevée avant modification et
  conservée : `21d1fa89fc89a8b730f23297e1b017f32b02d60057bbd0df3967d252b1a4180e`.
- Les 120 000 questions du contrôle mathématique restent valides.
- Fonctions de génération, dessins du diaporama et navigation comparées : identiques.
- Trois documents rendus en PDF à partir du DOM produit par le vrai générateur
  d'impression : dix questions sans aides, les mêmes avec aides et vingt questions
  variées. Inspection des pages, présence de toutes les questions et corrections,
  marges et numérotation vérifiées. Les dix questions avec les deux gabarits larges
  prennent deux pages élèves et deux pages de corrigé ; les vingt questions avec
  aides en prennent quatre de chaque.

Le rendu PDF est effectué avec WeasyPrint, utilisé uniquement pour les tests,
sans ajout de dépendance au site. Les couleurs héritées des SVG sont résolues
pour ce moteur. Le navigateur distant de vérification ne répondait pas : le
contrôle de l'aperçu d'impression propre à Chrome/Edge reste donc une limite de
cette vérification. Le composant partagé de licence à l'impression est conservé.
