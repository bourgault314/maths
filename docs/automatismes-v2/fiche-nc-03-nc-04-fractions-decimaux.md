# Fiche NC-03 / NC-04 — Fractions simples et décimaux

> **Candidat intégré, révisions D-049 du 13 août, D-055 du 15 août, puis D-056, D-058 et D-059 du 16 août 2026.** Cette fiche décrit le module révisé,
> et non plus le pilote du 8 août. Les questions ont été recomposées ; le cours,
> « Me guider » et les corrections utilisent maintenant les briques communes
> comparées dans le Labo. L'intégration et la recette conjointe D-049/D-055
> sont achevées ; D-056 unifie ensuite la charte des rangs, les échanges, la
> conversion dans les deux sens et le tableau masquable. D-058 réordonne le
> cours autour de la progression matériel — grande égalité — tableau, complète
> le troisième échange et allège sa dernière page, toujours sans modifier les
> générateurs. D-059 sépare enfin la décomposition par rang de l'échange vers
> un rang commun et présente le matériel et le tableau comme deux méthodes
> alternatives. Elle fixe aussi la bibliothèque de trois outils et leur usage
> sélectif. Sa recette automatisée et sa revue visuelle sont achevées.
> Le statut reste `construit` en attente des
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

La lecture de la barre de fraction comme division exacte n'est ni introduite
ni exercée dans ce cours : les élèves construisent ici le lien par les repères,
les fractions décimales, la valeur de position et les unités complètes. Cette
lecture quotient relève d'un enseignement ultérieur explicite, pas d'une note
finale ajoutée à ce module.

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

Le cours suit une progression concret — imagé — abstrait. Les trois premières
pages construisent le sens à partir du matériel avant de formaliser les
écritures. Dans les pages 4 et 5, le matériel et le tableau sont explicitement
deux voies alternatives, et non deux étapes successives :

Le vocabulaire du cours distingue trois outils réutilisables : les **bandes de
fractions alignées sur une demi-droite ou un rail**, les **plaques colorées de
numération** et le **tableau de numération**. Les pages 1 et 2 montrent les
trois afin de les installer ; les pages 4 et 5 retiennent les plaques et le
tableau pour les conversions par rang.

1. **Un demi : plusieurs écritures** : deux pièces `1/2` reforment l'unité.
   Dans un rectangle-unité sans deuxième rail, cinq dixièmes en remplissent
   exactement la moitié. La grande chaîne `0,5 = 5/10 = 1/2` est placée
   immédiatement sous le matériel ; le tableau vient seulement ensuite.
2. **Un quart et trois quarts** : quatre pièces `1/4` reforment l'unité et
   les mêmes 25 centièmes sont réorganisés en l'une des quatre zones égales du
   carré. Trois zones de 25 cases donnent ensuite `75/100 = 3/4`. Les grandes
   chaînes `0,25 = 25/100 = 1/4` et `0,75 = 75/100 = 3/4` suivent directement
   leurs dessins.
3. **Nommer les rangs décimaux** : le matériel conserve la même unité pendant
   trois échanges explicites à empreinte identique : une unité rouge vaut dix
   dixièmes verts, un dixième vert vaut dix centièmes jaunes et une unité rouge
   vaut cent centièmes jaunes. Les repères `1/10 = 0,1`,
   `1/100 = 0,01` et `1/1000 = 0,001` sont installés avant toute procédure de
   conversion ; le tableau vient après eux et le millième n'emploie aucun
   matériel miniaturisé.
4. **Lire une fraction décimale** : « Méthode 1 · Avec les plaques de
   couleurs » fait
   passer la même quantité de centièmes tous jaunes aux rangs usuels rouge,
   vert et jaune, sans changement d'empreinte ; la grande décomposition relie
   ensuite
   `147/100 = 100/100 + 40/100 + 7/100 = 1 + 4/10 + 7/100 = 1,47` ; les
   légendes sous les pièces montrent `100/100 = 1`, `40/100 = 4/10` et
   `7/100`. « Méthode 2 · Avec le tableau de numération » offre une autre voie de lecture,
   sans flèche depuis le matériel. Les notations
   `7/100 = 0,07` et `7/1000 = 0,007` distinguent explicitement centièmes et
   millièmes ; `725/1000 = 0,725` passe uniquement par le tableau.
5. **Écrire un décimal sous forme de fraction** : « Méthode 1 · Avec les
   plaques de couleurs » représente d'abord `3,54` par trois unités rouges,
   cinq dixièmes verts et quatre centièmes jaunes. Cet état initial est nommé
   seulement par `3`, `5/10` et `4/100` ; les égalités avec `300/100` et `50/100`
   apparaissent après l'échange des mêmes empreintes en centièmes. La chaîne
   alignée conduit à
   `3,54 = 3 + 5/10 + 4/100 = 300/100 + 50/100 + 4/100 = 354/100`.
   « Méthode 2 · Avec le tableau de numération » permet séparément de lire `3,54` comme
   « 354 centièmes », sans flèche entre les méthodes. Les encadrés
   propres aux champs de réponse et la recette du « dernier rang » disparaissent
   du cours ; l'acceptation des fractions équivalentes reste un contrat du
   moteur de réponse.
6. **Former les unités et reconnaître les entiers** : les représentations
   complètes de `7/2 = 3,5` et `6/4 = 1,5` montrent les pièces initiales, les
   unités formées et, pour `6/4`, la fusion des deux quarts restants en un
   demi. Les repères `3/2`, `4/2` et `5/2` sont rappelés par des égalités sans
   second rail. Cinq bandes marquées `1` atteignent 5 et installent ensuite
   `5/1 = 5` puis `n/1 = n`. Sur téléphone, ces rails réemploient le format
   standard de largeur source `340`, sans variante compacte. La liste
   « Choisir un outil » et la note finale sur la division sont supprimées :
   elles répétaient le cours et mélangeaient des cas qui se recouvrent.

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

D-058 ajoute à chaque rang une `textePedagogique`, teinte canonique destinée
aux écritures mathématiques du cours. Elle reste lisible sur le papier clair
tout en conservant sans ambiguïté la famille de couleur du matériel. La teinte
générale contrastée demeure celle des verdicts et composants d'interface ; un
rang ne doit jamais emprunter la couleur d'un autre. Le tableau commun adapte
en outre la taille de ses en-têtes à la largeur de colonne afin que « Centièmes »
et « Millièmes » restent entiers sur téléphone.

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
| Dixièmes et centièmes | deux voies alternatives : conversion matérielle commune en deux états, ou tableau commun |
| Millièmes | tableau de numération seulement ; aucun matériel miniaturisé illisible |
| Dénominateur 1 | tuiles d'unités non numérotées à compter |
| Fraction libre | dernier rang du seul décimal, puis fraction décimale `?/10` ou `?/100` ; `0,5`, `0,25` et `0,75` utilisent les correspondances dédiées, les autres valeurs la conversion par rang ; aucun dénominateur canonique caché n'est utilisé |

Cette table est une règle de sélection, pas une consigne d'empilement. Dans un
exercice, une aide ou une correction, le lecteur retient le visuel le plus
pertinent ; le tableau demeure l'outil transversal disponible pour lire les
rangs. En particulier, une équivalence telle que `2/4 = 0,5` se construit avec
les bandes alignées sur le rail plutôt qu'avec une grille de 100.

Les profils `aide-nc03` et `aide-nc04` sont distincts du profil `solution` et
compatibles avec un seul sens chacun. Le premier masque l'écriture décimale à
trouver ; le second masque le numérateur cible. Le masquage vaut dans le dessin,
les légendes, le texte alternatif et les attributs de données. Pour les
dixièmes et les centièmes, la conversion matérielle et le tableau sont
présentés comme « Méthode 1 · Avec les plaques de couleurs » et
« Méthode 2 · Avec le tableau de numération », deux voies alternatives sans flèche entre
elles. La correction des conversions `/10` et `/100` reprend les mêmes objets
avec le profil `solution` et les mêmes intitulés.
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
quand l'organisation en centièmes porte le sens, bandes sur rail pour une
équivalence comme `2/4 = 0,5` et pour les fractions au-delà de 1, deux méthodes
alternatives — plaques de numération ou tableau — pour `/10` et `/100`, tableau
seul pour `/1000`, et tuiles pour `/1`. Le cours,
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

La recette de D-047 — **1 458 tests**, **270 états** et **439 captures** —,
celle de D-054 — **1 516 tests**, **24 états de page** et **72 captures** — et
la campagne conjointe D-049/D-055 — **1 519 tests**, **220 états navigateur**
et 112 captures dédiées du cours — restent des témoins historiques des
organisations remplacées. D-058 est validée par **1 555 tests**. Sa revue du
cours couvre **30 états** et **90 captures** sur `320 × 568`, `390 × 844`,
reflow `640 × 360`, `1 280 × 720` et TNI `1 920 × 1 080`. Elle ne relève
aucun débordement du document, du panneau, des figures ou des fractions, ni
aucune erreur JavaScript. Les contrôles ciblés des aides `/10`, `/100` et
`/1000` confirment les couleurs, la virgule, les masques et les en-têtes
mobiles ; les tests d'application couvrent aussi les deux sens, les fractions
libres, les omissions, les erreurs et les QCM.

D-059 est validée par **1 562 tests** et **116 captures** sur `320 × 568`,
`390 × 844`, `640 × 360`, `1 280 × 720` et `1 920 × 1 080`. La revue ne
relève aucune erreur navigateur, aucun débordement de document, panneau ou
conteneur local, aucun texte coupé et aucun élément hors panneau. Elle vérifie
les trois outils des pages 1 et 2, les méthodes séparées des pages 4 et 5,
`2/4 = 1/2 = 0,5` sur rail, l'état naturel puis converti de `2,27`, les masques
NC-03/NC-04 et l'usage exclusif du tableau pour `/1000`.

Le candidat reste `construit`. Sa publication de test autorisée le 13 août ne
l'expose ni dans le menu public ni dans le sitemap ; le passage à `valide`
attend toujours les retours de Gwenaël et de Claire.
