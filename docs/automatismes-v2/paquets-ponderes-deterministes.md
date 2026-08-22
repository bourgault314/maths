# Paquets pondérés déterministes — contrat des séries V2

Ce document est le contrat technique commun de sélection des questions dans
**Automatismes DNB V2**. Il s'applique à tous les modules visibles et à tout
nouveau module. Il ne concerne pas l'outil archivé `/auto/`.

## Décision

Chaque module déclare un ou plusieurs **paquets de référence de 20 jetons**.
Un profil de paquet possède un identifiant canonique, un quota entier positif
et une catégorie pédagogique : `principale`, `secondaire` ou `rare`.

Le moteur développe les quotas en vingt jetons, les mélange avec une graine
dérivée de la graine de séance et tire sans remise. Une allocation de 1, 2, 5,
10 ou 15 questions est donc un échantillon du paquet entier, et non le préfixe
d'un plan propre à cette longueur. À 20 questions, chaque quota est respecté
exactement.

Cette solution est retenue de préférence à des tirages de Bernoulli
indépendants : elle conserve l'incertitude utile dans les petites allocations,
mais supprime la dérive des quotas sur un cycle complet.

## Les deux répartitions

### Entre modules sélectionnés

`automatismes-v2/src/serie-multinotions.js` applique les règles suivantes :

- les identifiants de modules sont canonisés avant tout tirage ; leur ordre
  dans le menu ou dans un tableau n'influence pas le résultat ;
- si `Q ≥ N`, chacun des `N` modules reçoit `⌊Q / N⌋` questions ; le reliquat
  est attribué dans un ordre seedé, donc l'écart maximal vaut 1 ;
- si `Q < N`, `Q` modules distincts sont tirés sans remise ; sur beaucoup de
  graines, chaque module possède la même fréquence de sélection ;
- les sous-séries sont enfin intercalées dans un ordre seedé afin de ne pas
  former de blocs par module ;
- une notion sélectionnée seule conserve la graine publique de la séance.

### Dans un module

Le module déclare sa distribution et appelle le moteur commun. Le tirage se
fait sans remise dans le paquet mélangé. Chaque profil déclaré a donc une
probabilité non nulle d'apparaître dès une seule question, proportionnelle à
son quota, sans être garanti dans une petite série donnée.

Exemple GE-03 :

| Famille | Catégorie | Quota sur 20 |
|---|---:|---:|
| Lire les deux coordonnées | principale | 10 |
| Lire l'abscisse | secondaire | 3 |
| Lire l'ordonnée | secondaire | 3 |
| QCM diagnostique | rare | 2 |
| Identifier un point | rare | 2 |

Les vingt jetons sont toujours présents avant le mélange. Une allocation de
deux questions peut donc contenir n'importe laquelle de ces familles, tandis
que la lecture complète reste majoritaire sur un grand corpus de graines.

## API commune

Le moteur est dans
`packages/moteur-exercices/src/paquets-ponderes.js`.

| Fonction | Usage |
|---|---|
| `definirPaquetPondere` | Valide un paquet, ses identifiants, ses catégories et un total exact de 20. |
| `tirerProfilsPonderes` | Mélange les vingt jetons avec la graine et tire sans remise. |
| `tirerDimensionsPonderees` | Tire plusieurs dimensions avec des sous-graines nommées indépendantes. |
| `apparierProfilsCompatibles` | Réassocie deux dimensions en conservant leurs quotas malgré de vraies incompatibilités. |
| `apparierProfilsSansDoublon` | Préserve deux quotas tout en interdisant les couples visibles répétés. |
| `ordonnerEnLimitantRepetitions` | Réordonne sans changer les profils pour éviter des répétitions consécutives évitables. |

Déclaration minimale :

```js
export const PAQUET_FAMILLES_EXEMPLE = definirPaquetPondere({
  id: "exemple-familles",
  profils: [
    { id: "coeur", quota: 12, categorie: "principale" },
    { id: "variante", quota: 6, categorie: "secondaire" },
    { id: "cas-rare", quota: 2, categorie: "rare" },
  ],
});

const familles = tirerProfilsPonderes({
  paquet: PAQUET_FAMILLES_EXEMPLE,
  graine: `exemple-familles:${graine}`,
  nombreElements: nombreQuestions,
});
```

Le paquet exporté doit aussi être déclaré dans `paquetsSelection` de la notion
dans `automatismes-v2/src/registre-lecteur.js`. Le registre refuse désormais
une notion sans fabrique de série, sans capacité de 20 questions ou sans paquet
validé. Cette validation rend le contrat obligatoire pour les futurs modules.

## Dimensions secondaires

Famille, difficulté, signe, présence de zéro, pas, quadrant, forme de réponse
ou cas particulier sont des dimensions distinctes lorsqu'elles représentent
des choix pédagogiques indépendants. Chacune reçoit :

1. son paquet nommé ;
2. sa sous-graine nommée ;
3. son tirage sans remise.

Elles ne doivent pas partager le même index d'une table conçue à la main : ce
serait recréer une corrélation artificielle, par exemple « profil rare =
difficulté forte ». Un appariement n'est permis que pour une incompatibilité
mathématique réelle. Il doit conserver les quotas des deux dimensions.

## Diversité et absence de doublons

Les contraintes de diversité s'appliquent **après** le tirage : elles peuvent
réordonner ou apparier les jetons, jamais modifier leur nombre.

- une clé visible explicite protège les couples qui ne doivent pas se répéter ;
- une contrainte d'ordre limite les longues répétitions d'une même famille ;
- les paramètres numériques sont tirés avec une sous-graine séparée ;
- une contrainte doit échouer clairement si les quotas la rendent impossible,
  plutôt que supprimer silencieusement un profil rare.

Il n'est pas nécessaire d'interdire deux questions proches lorsqu'elles
travaillent utilement la compétence. « Pas de doublon » désigne une question
visible identique, pas toute répétition pédagogique.

## Limites à connaître

- Une famille rare n'est pas garantie dans chaque petite allocation. Elle est
  **observable** sur un corpus de graines et sa fréquence tend vers son quota.
- Un paquet de 20 fixe une distribution marginale, pas toutes les
  combinaisons possibles entre dimensions. Les tests doivent donc aussi
  chercher les corrélations involontaires.
- La catégorie est descriptive ; seul le quota détermine la fréquence. Créer
  plusieurs profils quasi identiques augmente leur poids réel.
- Le tirage ouvre un nouveau cycle au-delà de 20, mais le lecteur public V2
  borne chaque module à 20 questions.
- Modifier un identifiant, un quota, une règle d'appariement ou la version du
  moteur change légitimement les séries seedées. Une telle modification exige
  une version de cache, des fixtures et un audit renouvelés.

## Audits obligatoires

Pour chaque module et pour le planificateur multinotions :

- longueurs internes `1, 2, 5, 10, 15, 20` ;
- sélections de `1, 2, 3, 5, 10` modules et totaux `5, 10, 15, 20` ;
- identité stricte de deux résultats issus de la même configuration et graine ;
- invariance à l'ordre de déclaration des profils et des modules ;
- milliers de graines pour l'équité, les poids et les profils rares ;
- quotas exacts à 20 ;
- absence de `Math.random()` et de hasard non seedé ;
- aucune question impossible, incohérente ou visiblement dupliquée ;
- suite complète `npm run verifier` verte.

Les tests statistiques doivent employer des bornes explicites et assez larges
pour ne pas devenir aléatoirement instables : le corpus de graines est lui-même
fixe et le résultat attendu est déterministe.

## Modules migrés avec ce contrat

Le moteur est employé par NC-01, NC-02, NC-03, NC-04, NC-05, la droite graduée
GE-01/GE-02, GE-03, GE-04, les solides usuels GE-12 et les volumes GM-13,
GM-14 et GM-15. Le chemin historique combiné NC-03/NC-04 reste accepté pour
les anciennes URL et utilise les mêmes paquets. GE-03 et GE-04 demeurent deux
automatismes distincts.
