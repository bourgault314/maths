# Catalogue du lot 2

Les 84 cartes reprennent le catalogue de l'archive `8feecca6`. Les énoncés,
paramètres, aides, cours, corrections et sources restent ceux de cette archive.
La seule correction de vocabulaire demandée dans ce lot est « chiffre des unités ».

## Lecture par l'interface

- `nom` est le titre ; `titre` et `categorie` restent disponibles pour la compatibilité.
- `domaine` vaut `nombres-calculs`, `proportionnalite-fonctions`, `espace-geometrie`,
  `donnees-probabilites` ou `pensee-informatique`.
- `sousDomaine` reprend l'une des huit catégories de l'archive.
- `niveaux` est une liste de classes, de l'introduction à la 3e. Elle est dérivée
  des niveaux effectivement utilisés par les générateurs ; le texte de départ
  demeure dans `niveauxDescription` et `niveauDescription`.
- `formes[].id` est la lettre ; `identifiant` contient l'identifiant complet.
  `indiceGenerateur` reste interne au moteur et ne doit pas figurer dans les liens.
- `formes[].brevet` reprend le filtre du générateur. `brevet.present` résume la
  famille ; `brevet.questions` conserve les correspondances recensées.
- `valide: false` masque EG17, DP05 et NC30, sans supprimer leurs formes.
  `true` pour les autres signifie « visible dans le moule du lot 2 », et ne vaut
  pas validation pédagogique des cahiers à venir.
- `reponseType` désigne la réponse principale. `champs` décrit tous les composants
  d'une réponse à plusieurs cases. GM04-b, EG03-c, EG16-d et EG16-f mélangent des
  nombres et des sélecteurs : cette structure existante est conservée.

Les types de tâche sont une indexation du geste actuel ; ils ne rétablissent pas
les manipulations ou les tâches de contrôle absentes de l'archive.

## Alias

`alias-gpt.json` contient exactement 435 entrées, une par forme de l'ancien
catalogue. Sa clé est l'ancien identifiant du catalogue. La valeur précise :

- `id` : le nouvel identifiant complet ; `famille` et `forme` : ses deux parties ;
- `indiceGenerateur` et `ancienParametre` : l'ancien rang numérique de l'URL ;
- `identifiantsAnciens` : l'identifiant du catalogue, celui du générateur, et
  l'ancienne notation par rang `NC27-V1`, sans doublons.

Exemples : `NC27-V1` mène à `NC27-a`, `PF04-A` à `PF04-a` ; `NC08-a` reste
`NC08-a`. Pour une famille connue, l'ancien `forme=0` mène à `forme=a`.

## Provenance et limites

Les 153 références de questions proviennent de
`audits/audit_couverture_reelle.json` dans la sauvegarde archivée. Le document
`LECTURE-rapports-C1-Codex.md` du ZIP du lot 1 fournit les correspondances des
codes de grille `dnb_*`. Ces codes concernent la famille et peuvent renvoyer à
un savoir-faire partiel ; ils ne prétendent pas prouver une équivalence de type.
Les types V1 précis ne sont pas reconstruits : le champ `v1` reste vide en
attendant les cahiers. Les sources officielles ne sont pas réauditées dans ce lot.

## Assemblage

Après modification d'une carte :

```sh
node automatismes/catalogue/assembler.mjs
```

Les identifiants de forme sont stables : ne pas réattribuer les lettres en
réordonnant les cartes ou les formes.
