# Fiche NC-03 / NC-04 — Fractions simples et décimaux

> **Candidat intégré, révisions D-049 du 13 août et D-054 du 15 août 2026.** Cette fiche décrit le module révisé,
> et non plus le pilote du 8 août. Les questions ont été recomposées ; le cours,
> « Me guider » et les corrections utilisent maintenant les briques communes
> comparées dans le Labo. L'intégration est achevée et le cours D-054 a passé
> sa recette dédiée ; l'interaction complète D-049 attend encore sa recette
> finale. Le statut reste `construit` en attente des
> retours de Gwenaël et de Claire. Gwenaël a autorisé le 13 août sa publication
> de test, sans référencement ni passage à `valide`.

## 1. Identité et statut

- **Module visible canonique** : `fractions-simples-decimaux` — « Fractions
  simples et décimaux ».
- **Micro-notions canoniques** : `fraction-vers-decimal` et
  `decimal-vers-fraction`.
- **Alias humains de pilotage** : `NC-03` et `NC-04` respectivement ; les
  traces antérieures qui emploient ces codes restent lisibles.
- **Domaine canonique** : `nombres-et-calculs`.
- **Cible** : `DNB26-01`, référence machine `dnb-2026-01`, « Fraction simple
  vers décimal et retour ».
- **Statut** : `construit`. Le module conserve une seule entrée visible et
  distingue les deux sens dans le classement, les traces et le bilan.
- **Provenance** : conception et arbitrages pédagogiques de Gwenaël, retours
  de Claire, corpus officiel et international audité ; code, valeurs,
  distracteurs et représentations écrits à neuf pour maths&go.

## 2. Savoir-faire visé

Reconnaître qu'une fraction et une écriture à virgule peuvent désigner
exactement le même nombre, puis passer de l'une à l'autre mentalement. Le
travail est réversible, porte aussi sur les fractions supérieures à 1 et ne
réduit pas l'apprentissage à la récitation de quelques couples.

La barre de fraction est nommée comme le signe d'une division exacte. La
division posée n'est cependant ni la méthode première ni une technique
exercée dans cette tranche : les élèves construisent d'abord le lien par les
repères, les fractions décimales, la valeur de position et les unités
complètes.

## 3. Prérequis, inclusions et limites

Le module suppose la lecture d'un nombre décimal positif, le rôle du
numérateur et du dénominateur et la numération de position.

Sont inclus :

- les dénominateurs `1`, `2`, `4`, `10`, `100` et, à faible dose, `1 000` ;
- les demis de `1/2` à `7/2` et les quarts de `1/4` à `8/4`, y compris les
  écritures réductibles et les résultats entiers ;
- les dixièmes de `1/10` à `49/10`, les centièmes de `1/100` à `250/100` et
  les millièmes de `1/1000` à `999/1000`, hors multiples de 10 ;
- le cas `/1`, de `2/1` à `12/1`, côté NC-03 ;
- les nombres inférieurs, égaux ou supérieurs à 1, les entiers cachés et les
  zéros de position ;
- le point ou la virgule, le zéro initial facultatif et les zéros finaux dans
  une réponse décimale ;
- toute fraction équivalente, réduite ou non, dans une production libre.

Les repères officiels `1/2`, `1/4`, `3/4`, `3/2`, `4/2`, `5/2`, `1/10`,
`1/100`, `1/1000`, `100/100` et `7/1` sont tous présents dans les banques et
favorisés sans être rejoués à une place fixe. Une série de 20 en contient au
moins deux, choisis et placés par la graine. Le cours les rend tous visibles et
les relie à des procédures qui s'étendent à `n/2` et `n/4`.

Sont exclus de cette tranche : nombres négatifs, tiers, cinquièmes, huitièmes,
fractions non décimales générales, pourcentages, simplification comme objectif,
calcul avec des fractions et division posée comme exercice. `1/1`, trop
trivial, n'est pas généré. Les cinquièmes pourront former un pont ultérieur
avec NC-05 ; les huitièmes ne sont pas ajoutés à ce module.

## 4. Erreurs d'élèves à travailler

Les QCM ont quatre choix : une réponse juste et trois distracteurs construits
à partir de mécanismes plausibles. Un diagnostic n'est affiché que si la
réponse sélectionnée correspond à un mécanisme identifié ; les saisies libres
conservent les diagnostics sobres du lecteur.

| Code | Mécanisme témoin |
|---|---|
| E1 | Lire la barre comme une virgule : `3/2 → 3,2`. |
| E2 | Ne convertir qu'une part ou oublier les unités complètes : `3/2 → 0,5`. |
| E3 | Déplacer le dernier chiffre d'un rang : `21/10 → 0,21`. |
| E4 | Oublier un zéro de position : `7/100 → 0,7`. |
| E5 | Recopier tous les chiffres du décimal comme numérateur malgré un dénominateur imposé : `0,75 = □/4`, réponse `75`. |
| E6 | Inverser numérateur et dénominateur dans une fraction libre : `1,5 → 2/3`. |
| E8 | Traiter `/1` comme un chiffre décimal : `7/1 → 7,1`. |

Une écriture équivalente correcte, un point décimal ou des zéros finaux ne
déclenchent jamais un diagnostic. Une fraction n'est exigée irréductible que
si une autre compétence et une autre consigne le demandent explicitement.

## 5. Formes de questions

Toutes les questions sont soit abstraites à saisie directe, soit des QCM
diagnostiques. Aucune double droite, grille, bande ni table de numération
n'apparaît dans l'énoncé : les représentations sont réservées au cours, à
« Me guider » et à la correction.

### NC-03 — fraction vers décimal

- **Consigne de production** : « Écris cette fraction en écriture décimale. »
- **Consigne QCM** : « Quelle est l'écriture décimale de cette fraction ? »
- **Réponse directe** : nombre décimal positif comparé comme rationnel exact.
- **Familles** : `/1`, demis, quarts, dixièmes, centièmes et millièmes.

### NC-04 — décimal vers fraction à dénominateur imposé

- **Consigne de production** : « Complète l'égalité. »
- **Consigne QCM** : « Quelle fraction correspond à ce nombre ? »
- **Réponse directe** : numérateur entier ; le dénominateur reste imprimé et
  non modifiable.
- **Familles** : demis, quarts, dixièmes, centièmes et millièmes.

### NC-04 — fraction libre

- **Consigne** : « Écris ce nombre sous forme de fraction. Toutes les
  fractions égales sont acceptées. »
- **Réponse** : deux champs entiers comparés par produit en croix ; un
  dénominateur nul est interdit.
- **Cibles** : une catégorie demis/quarts et une catégorie dixièmes/centièmes.
  Lorsqu'il n'y a qu'une production libre, sa catégorie varie avec la graine.
- **Présentation** : toujours une saisie directe, jamais un QCM.

## 6. Composition des séries

Les deux sens sont équilibrés à `50 / 50` pour une longueur paire. Pour une
longueur impaire, le bonus est attribué par la graine et l'écart reste d'une
question. L'ordre n'enchaîne jamais trois questions du même sens.

| Longueur | NC-03 / NC-04 | QCM | Fractions libres | Millièmes | Couverture structurante |
|---:|---:|---:|---:|---:|---|
| 5 | `3 / 2` ou `2 / 3` | 1 | 1 | 0 | demis, quarts et dixièmes dans les deux sens réunis ; une fraction propre et une impropre |
| 10 | `5 / 5` | 2 | 1 | 0 | ajout des centièmes dans chaque sens ; propre et impropre par sens ; au moins un entier caché dans la série |
| 15 | `8 / 7` ou `7 / 8` | 3 | 2 | 1 | ajout de `/1` côté NC-03 ; une libre demis/quarts et une libre décimale |
| 20 | `10 / 10` | 4 | 2 | 1 | couverture complète ; entier caché côté NC-04 et cas `/1` côté NC-03 |

Le millième apparaît donc dès 15 questions, dans l'un ou l'autre sens selon la
graine. Sa banque contient des numérateurs à un, deux et trois chiffres afin de
travailler aussi des écritures comme `725/1000 = 0,725` ; elle exclut les
multiples de 10 qui dupliqueraient un centième.

Dans chaque série, les valeurs rationnelles sont toutes distinctes. Les QCM
représentent exactement `20 %` des questions aux quatre jalons et sont répartis
au plus équitablement entre NC-03 et NC-04. Les fractions libres remplacent
une répétition de famille : elles n'effacent donc pas la couverture de base.

## 7. Cours explicite en six pages

Le cours suit une progression concret — imagé — abstrait sans présenter des
recettes concurrentes :

1. **Un demi : plusieurs écritures** : deux pièces `1/2` reforment l'unité.
   Dans la correspondance suivante, cinq pièces `1/10` et une pièce `1/2`
   partent de la même origine et atteignent le même repère, d'où
   `1/2 = 5/10 = 0,5`.
2. **Un quart et trois quarts** : quatre pièces `1/4` reforment l'unité et
   `0,25` est à mi-chemin entre `0` et `0,5`. Les mêmes 25 centièmes sont
   réorganisés en l'une des quatre zones égales du carré, puis trois zones de
   25 cases donnent `3/4 = 75/100 = 0,75`.
3. **Lire une fraction décimale** : les anciennes pages sur les rangs et la
   conversion directe sont réunies autour d'une seule quantité. Le matériel,
   le tableau et la décomposition relient
   `147/100 = 100/100 + 40/100 + 7/100 = 1 + 4/10 + 7/100 = 1,47` ; les
   repères `1/10`, `1/100` et `1/1000` sont rappelés. `725/1000 = 0,725`
   passe uniquement par le tableau, sans matériel miniaturisé.
4. **Du décimal à la fraction** : le dernier rang écrit donne une fraction
   décimale possible. La page distingue ensuite les deux formes réellement
   demandées : si le dénominateur est imprimé, l'élève le conserve et compte
   les parts correspondantes, par exemple `0,75 = ?/4 = 3/4` sur le rail ; si
   les deux cases sont libres, `1,47 = 147/100` convient et toute fraction
   équivalente est acceptée. Ainsi `75/100` et `3/4` sont toutes deux justes
   en réponse libre.
5. **Dépasser l'unité** : `7/2 = 3,5` après formation de trois unités et
   conservation d'un demi ; `6/4 = 1,5` après formation d'une unité puis
   remplacement des deux quarts restants par une demi-bande de même longueur.
6. **Reconnaître un entier et choisir une stratégie** : cinq bandes `1/1`
   alignées sur le rail installent `5/1 = 5` et la règle `n/1 = n`. Les
   entiers cachés `4/4` et `100/100` précèdent un rail commun pour `3/2`,
   `4/2` et `5/2`. La page ordonne enfin les stratégies — repère, tableau de
   numération, groupement — puis nomme, en toute dernière étape, `a/b` comme
   quotient exact de `a ÷ b` pour `b ≠ 0`.

## 8. « Me guider » : un atelier progressif unique sans révélation

La question reste visible et la saisie déjà commencée est conservée. Une seule
entrée « Me guider » ouvre l'atelier adapté à la famille ; l'élève n'a pas à
choisir entre trois onglets ou trois méthodes concurrentes. Selon la famille,
le même atelier enchaîne les fonctions pédagogiques suivantes :

1. **Un indice** : rappel verbal ou stratégique, sans calcul de la réponse.
2. **Voir** : représentation de la quantité ou du rang pertinent.
3. **Construire** : action guidée pour poser des pièces, former des unités ou
   choisir le dernier rang.

Ces trois intitulés décrivent le modèle pédagogique, pas des libellés, des
écrans ni des commandes visibles. L'interface ouvre directement l'atelier
unique adapté ; le lecteur ne mémorise aucun niveau. L'élève avance du verbal
vers la représentation puis l'action au fil de ses gestes. À chaque étape, le
dernier terme reste `?` avant validation, y compris dans les libellés
accessibles, textes alternatifs, attributs ARIA et bornes des contrôles.

L'affectation des représentations est la suivante :

| Famille | Voir / construire |
|---|---|
| Demis et quarts jusqu'à 1 | bandes historiques posées une à une sur le rail ; la cible reste `?` |
| Demis et quarts au-delà de 1 | pièces puis groupes puis unités complètes, avec une transformation visuelle à chaque étape ; si le reste vaut `2/4`, les deux quarts se fusionnent enfin en `1/2` |
| Dixièmes et centièmes | matériel de numération rouge/vert/jaune puis tableau de numération |
| Millièmes | tableau de numération seulement ; aucun matériel miniaturisé illisible |
| Dénominateur 1 | tuiles d'unités non numérotées à compter |
| Fraction libre | dernier rang du seul décimal, puis fraction décimale `?/10` ou `?/100` ; aucun dénominateur canonique caché n'est utilisé |

L'usage de l'aide reste tracé au bilan. Le lecteur constitue l'unique source
du pas-à-pas et des corrections ; les générateurs ne portent plus de blocs
textuels concurrents, seulement les diagnostics propres aux distracteurs QCM.

## 9. Correction et réponses équivalentes

Le panneau de correction révèle la solution complète seulement après validation
et ouverture volontaire de « Voir l'explication », ou en mode « Au tableau ».
Une saisie omise reste sur la question avec le libellé « Pas de réponse » :
elle ne déplie pas automatiquement la correction, mais la solution correcte
est affichée séparément en vert. Pour un QCM omis, la proposition correcte est
verte directement dans la liste. La correction détaillée reprend ensuite la
représentation mathématique pertinente :
grille de 100 pour les demis/quarts jusqu'à 1, bandes et unités au-delà de 1,
tableau pour les fractions décimales et tuiles pour `/1`.

Pour une fraction libre, elle repart du dernier rang écrit et porte le titre
« Une réponse possible ». Par exemple, elle peut montrer
`0,25 = 25/100 = 1/4`, en précisant que `25/100`, `1/4` et toute fraction
équivalente sont justes. La forme familière réduite n'est affichée que comme
équivalence éventuelle, jamais comme obligation implicite.

## 10. Présentation dans les deux contextes

En entraînement, le pavé interne affiche chiffres et virgule pour un décimal,
chiffres seuls pour une fraction. Le clavier physique accepte aussi le point ;
`Tab` change de champ dans la fraction libre. La saisie est figée après
validation, le pavé disparaît et la barre propose « Voir l'explication » puis
« Question suivante » ou « Voir le bilan ». Dans un QCM, la bonne proposition
est alors verte ; une proposition fausse sélectionnée reste rouge. Pour une
saisie fournie et fausse, la réponse attendue n'apparaît que dans la correction.
Pour une omission, elle est au contraire donnée immédiatement en vert, à côté
du retour « Pas de réponse », sans ouvrir l'explication.

Au tableau, la question et les données sont identiques, mais aucune saisie,
trace ni score n'est créé. Les commandes communes révèlent la réponse, la
correction et le cours. Téléphone, ordinateur et TNI conservent l'en-tête, la
zone centrale défilable, les panneaux et le dock communs.

## 11. Validation

Les contrats, normalisations rationnelles, produits en croix, diagnostics,
générateurs, quotas, déterminisme, valeurs distinctes, menu unique, six pages
de cours, atelier d'aide unique, absence de fuite de réponse et deux contextes
doivent être couverts par des tests automatisés dédiés. La recette vérifie en
plus les réponses justes, fausses, omises et partielles : une omission ne doit
ouvrir aucun panneau, sa solution verte doit être visible, le pavé doit
disparaître et les deux actions de suite doivent rester disponibles.

La recette de D-047 — **1 458 tests**, **270 états** et **439 captures** sur
cinq fenêtres — constitue le point de comparaison antérieur. La recette
dédiée au cours D-054 est verte : **1 516 tests**, **24 états de page** et
**72 captures** à `320 × 568`, `390 × 844`, `1 280 × 720` et
`1 920 × 1 080`, sans erreur ni débordement réel ; l'écart maximal mesuré
entre les barres de fraction et les signes `=` ou `+` est de **1,47 px**.
La révision d'interaction D-049 invalide néanmoins les anciens totaux comme
preuve du module entier : avant une nouvelle publication, la campagne doit être
rejoués à `320 × 568`, `390 × 844`, reflow `640 × 360`, `1 280 × 720` et TNI
`1 920 × 1 080`, avec contrôle visible et accessible des masques, du retour
« Pas de réponse », de l'atelier unique et des actions après validation.

Le candidat reste `construit`. Sa publication de test autorisée le 13 août ne
l'expose ni dans le menu public ni dans le sitemap ; D-049 et la révision du
cours fixée par D-054 doivent toutes deux rester couvertes avant toute nouvelle
livraison.
