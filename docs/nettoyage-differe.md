# Nettoyage différé — à traiter lors de la migration

**Créé le 17 juillet 2026** (phase 0). Ce document liste ce qui est volontairement
**laissé en l'état** pour ne pas casser d'adresse publique, et qui sera corrigé
proprement au moment où chaque famille d'outils migrera vers la nouvelle
architecture (avec redirection ou mise à jour du catalogue à ce moment-là).

## Pourquoi ne pas nettoyer tout de suite

Renommer ou déplacer un fichier change son adresse publique. Les adresses
listées dans `inventaire-urls-publiques.md` sont sous contrat de
non-régression : on ne les touche qu'au moment d'une migration organisée,
jamais « au passage ».

## 1. Noms de fichiers avec espaces (4)

Fonctionnels mais fragiles (les espaces deviennent `%20` dans les adresses) :

- `outils/bouliers/rekenrek/cache cache.html` — **attention** : ce n'est PAS un
  doublon de `cache-cache.html` (contenus différents, vérifié octet par octet).
  Deux outils distincts aux noms trop proches ; prévoir des noms clairement
  différenciés à la migration.
- `outils/bouliers/rekenrek/cache cache barre.html`
- `outils/bouliers/rekenrek/presque double.html` — idem : distinct de
  `presque_doubles.html` (vérifié).
- `outils/plateaux_manipulation/prisme345_h6_patron (1).html` — nom hérité d'un
  téléchargement ; référencé par le catalogue, donc le renommage devra mettre à
  jour le catalogue en même temps.

## 2. Variantes à trancher (décisions pédagogiques)

- **Rekenrek « somme » / « différence »** : `rekenrek_sheet_generator_somme.html`
  et `rekenrek_sheet_generator_2_difference.html` sont strictement identiques.
  Décision du propriétaire (17/07/2026) : créer réellement la variante
  « différence » plus tard.
- **Abaque de Gerbert multiplication V1 / V2 / V3** : trois versions au
  catalogue. À terme, choisir la version de référence et archiver les autres.
- **Nombres relatifs somme/différence B / BClaire / C / D** : quatre variantes
  d'une même page (plus la version principale). La famille « nombres relatifs »
  étant la première tranche verticale prévue, ces variantes seront analysées et
  consolidées à ce moment-là.

## 3. Conventions de nommage cibles (pour la nouvelle architecture)

À appliquer aux nouveaux fichiers dès maintenant, et aux anciens lors de leur
migration :

- minuscules uniquement, sans espaces ni accents ; mots séparés par `_` ou `-`
  (choisir une seule convention et s'y tenir) ;
- pas de suffixes de version dans les noms (`V2`, `B`, `final`, `(1)`) : les
  versions vivent dans Git, pas dans les noms de fichiers ;
- pas de noms de personnes dans les fichiers publics (les variantes
  personnalisées type `BClaire` relèvent d'un paramétrage, pas d'une copie).

## 4. Constat rassurant

Vérification du 17/07/2026 : sur 153 pages HTML, seules 2 ne sont référencées
nulle part (`auto/dev/visual-library.html`, outil de développement, et
`fichiers-travailles/patterns/FICHE-ENSEIGNANT-20-RITUELS.html`, document de
travail). Tout le reste est correctement relié au sitemap, au catalogue ou à
d'autres pages. Le dépôt ne contient pas de masse de fichiers morts : le
désordre est essentiellement une question de noms et de variantes, pas de
contenu abandonné.
