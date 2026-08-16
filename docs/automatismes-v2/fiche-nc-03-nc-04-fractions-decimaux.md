# Fiche NC-03 / NC-04 — Fractions simples et décimaux

> **Candidat intégré, révisions D-049 du 13 août, D-055 du 15 août et D-056 du 16 août 2026.** Cette fiche décrit le module révisé,
> et non plus le pilote du 8 août. Les questions ont été recomposées ; le cours,
> « Me guider » et les corrections utilisent maintenant les briques communes
> comparées dans le Labo. L'intégration et la recette conjointe D-049/D-055
> sont achevées ; D-056 unifie ensuite la charte des rangs, les échanges, la
> conversion dans les deux sens et le tableau masquable, sans modifier les
> générateurs. Le statut reste `construit` en attente des
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
   Dans un rectangle-unité sans deuxième rail, cinq dixièmes en remplissent
   exactement la moitié. Le tableau de numération installe ensuite la chaîne
   `0,5 = 5/10 = 1/2`.
2. **Un quart et trois quarts** : quatre pièces `1/4` reforment l'unité et
   les mêmes 25 centièmes sont réorganisés en l'une des quatre zones égales du
   carré. Trois zones de 25 cases donnent ensuite
   `75/100 = 3/4` et `75/100 = 0,75`.
3. **Nommer les rangs décimaux** : le matériel conserve la même unité pendant
   deux échanges explicites : une unité rouge vaut dix dixièmes verts, puis
   un dixième vert vaut dix centièmes jaunes. Les repères `1/10 = 0,1`,
   `1/100 = 0,01` et `1/1000 = 0,001` sont installés avant toute procédure de
   conversion ; le millième utilise uniquement le tableau.
4. **Lire une fraction décimale** : la même quantité passe de centièmes tous
   jaunes aux rangs usuels rouge, vert et jaune, sans changement d'empreinte ;
   le tableau et la décomposition relient ensuite
   `147/100 = 100/100 + 40/100 + 7/100 = 1 + 4/10 + 7/100 = 1,47` ; les
   légendes sous les pièces montrent `100/100 = 1`, `40/100 = 4/10` et
   `7/100`. Le cas `7/100 = 0,07` rend les zéros de position explicites et
   `725/1000 = 0,725` passe uniquement par le tableau.
5. **Écrire un décimal sous forme de fraction** : le matériel représente
   `3,54` par trois unités rouges, cinq dixièmes verts et quatre centièmes
   jaunes, puis convertit les mêmes empreintes en centièmes. Le tableau et la
   chaîne alignée conduisent à
   `3,54 = 3 + 5/10 + 4/100 = 300/100 + 50/100 + 4/100 = 354/100`.
   La page distingue le dénominateur imprimé de la réponse libre ; toute
   fraction équivalente reste acceptée.
6. **Former les unités et reconnaître les entiers** : les représentations
   complètes de `7/2 = 3,5` et `6/4 = 1,5` montrent les pièces initiales, les
   unités formées et, pour `6/4`, la fusion des deux quarts restants en un
   demi. Les repères `3/2`, `4/2` et `5/2` sont rappelés par des égalités sans
   second rail. Cinq bandes marquées `1` atteignent 5 et installent ensuite
   `5/1 = 5` puis `n/1 = n`. La page ordonne enfin les stratégies et réserve
   sa dernière note au sens quotient de `a/b` pour `b ≠ 0`.

Dans les bandes sur rail et les correspondances de ce cours, les fractions
étagées passent par la primitive canonique de `expressions.js`. Ces deux objets
ne recomposent plus localement numérateur, barre et dénominateur ; le rail
mesure aussi la même écriture avant de centrer ses équations. Les pièces de
dénominateur 1 portent simplement le nombre `1`. Sur les rails, les guides
pointillés marquent l'origine et l'arrivée, la graduation finale reste un trait
et la flèche commence après celle-ci, sans point rond concurrent.

D-056 ajoute une seule charte sémantique pour les rangs dans tous ces objets :
unités rouges, dixièmes verts, centièmes jaunes et millièmes violets, avec des
teintes de texte plus sombres sur fond clair. Une écriture décimale n'est jamais
colorée d'un bloc : `nombreDecimalAvecRangs` attribue son rôle à chaque chiffre,
la virgule restant neutre. Ainsi, dans `1,47`, `1` porte le rôle des unités,
`4` celui des dixièmes et `7` celui des centièmes, dans le cours comme dans la
question, son rappel, l'aide et la correction.

Le tableau est lui aussi un SVG unique. Il place une grande virgule sur la
frontière unités–dixièmes, peut conserver explicitement un rang final et sait
masquer ses chiffres. Dans ce profil masqué, ni les chiffres, ni l'écriture, ni
le numérateur attendu ne restent dans le texte alternatif ou les attributs du
SVG. Les échanges `1 unité = 10 dixièmes` et
`1 dixième = 10 centièmes` gardent exactement la même empreinte de part et
d'autre. La conversion paramétrique réemploie ensuite ces empreintes, aux
dixièmes ou aux centièmes, dans les deux sens.

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
| Dixièmes et centièmes | conversion commune en deux états — rangs usuels puis regroupement dans le rang final, ou l'inverse — puis tableau commun |
| Millièmes | tableau de numération seulement ; aucun matériel miniaturisé illisible |
| Dénominateur 1 | tuiles d'unités non numérotées à compter |
| Fraction libre | dernier rang du seul décimal, puis fraction décimale `?/10` ou `?/100` ; `0,5`, `0,25` et `0,75` utilisent les correspondances dédiées, les autres valeurs la conversion par rang ; aucun dénominateur canonique caché n'est utilisé |

Les profils `aide-nc03` et `aide-nc04` sont distincts du profil `solution` et
compatibles avec un seul sens chacun. Le premier masque l'écriture décimale à
trouver ; le second masque le numérateur cible. Le masquage vaut dans le dessin,
les légendes, le texte alternatif et les attributs de données. La correction
des conversions `/10` et `/100` reprend ce composant avec le profil `solution`.
Pour les autres familles, elle choisit dans les mêmes primitives la preuve la
plus pertinente. Les millièmes ne passent jamais par cette conversion
matérielle : `/1000` reste exclusivement traité par le tableau.

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
représentation mathématique pertinente : grille de 100 pour les demis/quarts
jusqu'à 1, bandes et unités au-delà de 1, conversion par rang puis tableau pour
`/10` et `/100`, tableau seul pour `/1000`, et tuiles pour `/1`. Le cours,
l'aide et la correction puisent dans les mêmes primitives canoniques ; chacun
choisit la représentation pertinente au contexte, et le profil `solution`
n'autorise la révélation que dans le cours et la correction.

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

La recette de D-047 — **1 458 tests**, **270 états** et **439 captures** — et
celle de D-054 — **1 516 tests**, **24 états de page** et **72 captures** —
restent les témoins historiques des organisations remplacées. La recette
conjointe D-049/D-055 est verte : **1 519 tests**, puis **220 états navigateur**
sur `320 × 568`, `390 × 844`, reflow `640 × 360`, `1 280 × 720` et TNI
`1 920 × 1 080`. Elle comprend 60 états de cours, 120 états d'aide couvrant
les 12 profils au départ et après leur dernier geste, et 35 états de réponse
(omission, erreur, correction, QCM et fraction partielle). Aucun débordement,
aucune erreur JavaScript ni aucune fuite de réponse n'est relevé. Une revue
visuelle dédiée ajoute 112 captures des six pages ; l'écart maximal mesuré
entre une barre de fraction et le signe `=` ou `+` voisin est de **0,72 px**.

Le candidat reste `construit`. Sa publication de test autorisée le 13 août ne
l'expose ni dans le menu public ni dans le sitemap ; le passage à `valide`
attend toujours les retours de Gwenaël et de Claire.
