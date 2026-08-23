# GE-03 / GE-04 — Repérage dans le plan

Statut : **construit, repris pédagogiquement et graphiquement**
Périmètre : Automatismes DNB V2, modules `lire-coordonnees-point` (GE-03)
et `placer-point-repere` (GE-04).

La
[liste indicative des automatismes du DNB 2026](https://eduscol.education.gouv.fr/sites/default/files/document/liste-indicative-dautomatismes-pour-le-dnbpdf-116340.pdf)
nomme la lecture des coordonnées et le placement d'un point. La lecture d'une
abscisse ou d'une ordonnée isolée reste ici une consolidation explicite du
vocabulaire, et non une compétence officielle concurrente.

## 1. Découpage et invariants

GE-03 et GE-04 restent deux modules visibles distincts. Ils partagent :

- l'objet V2 `packages/objets/src/repere-cartesien.js` ;
- les couleurs et les conventions du lecteur ;
- les diagnostics E1 à E6 ;
- les coordonnées rationnelles exactes ;
- le même SVG en entraînement, au tableau, dans le cours et dans le Studio ;
- les interactions tactiles et clavier de GE-04.

La génération conserve les quatre quadrants, les deux axes, les coordonnées
nulles, une origine rare, les pas `1`, `0,5` et `0,25`, ainsi que l'obligation
d'utiliser réellement une coordonnée non entière lorsque le pas est décimal.

## 2. Architecture commune : paquets pondérés déterministes

GE-03 et GE-04 utilisent `definirPaquetPondere` et
`tirerProfilsPonderes`. Chaque dimension pédagogique possède un paquet de
référence de 20 jetons. Pour une allocation de moins de 20 questions, le
moteur mélange le paquet à partir du seed, puis tire sans remise le nombre de
profils demandé.

Conséquences :

- le même seed et la même allocation donnent strictement le même tirage ;
- il n'existe plus quatre plans indépendants pour 5, 10, 15 et 20 questions ;
- une petite série n'est pas le préfixe d'un plan de 20 ;
- un profil rare peut être tiré dès une série d'une question ;
- les valeurs ci-dessous sont des **poids de référence**, pas des quotas
  rigides pour chaque petite longueur ;
- une allocation de 20 parcourt tout le paquet et retrouve donc exactement les
  poids de référence.

### Pas

| Profil | Poids de référence | Catégorie |
|---|---:|---|
| pas `1` | 15 | principale |
| pas `0,5` | 4 | secondaire |
| pas `0,25` | 1 | rare |

Le pas `0,25` n'est donc pas réservé à une série de 20.

### Familles GE-03

| Famille interne | Tâche | Réponse | Poids de référence |
|---|---|---|---:|
| `lire-coordonnees` | lire les coordonnées d'un point | deux champs exacts | 10 |
| `lire-abscisse` | lire l'abscisse d'un point | rationnel exact | 3 |
| `lire-ordonnee` | lire l'ordonnée d'un point | rationnel exact | 3 |
| `diagnostic-coordonnees` | choisir le bon couple | QCM construit | 2 |
| `identifier-point` | identifier un point par ses coordonnées | clic sur le point | 2 |

GE-04 conserve une seule famille : `placer-point`.

Les deux familles de lecture isolée possèdent une dimension de présentation
indépendante : formulation en français (poids `14`) ou notation
`x_M = …` / `y_M = …` (poids `6`). Ce paquet ne crée pas une nouvelle
compétence et n'est pas lié à une longueur de série ; la variante symbolique
peut donc apparaître dans une petite allocation.

### Zones

| Zone | GE-03 | GE-04 |
|---|---:|---:|
| quadrant I | 3 | 4 |
| quadrant II | 4 | 4 |
| quadrant III | 4 | 4 |
| quadrant IV | 4 | 3 |
| axe des abscisses | 2 | 2 |
| axe des ordonnées | 2 | 2 |
| profil rare | 1 | 1 |

Le profil rare est résolu de façon seedée : il peut produire l'origine quand
la décision rare de la série l'autorise, sinon un profil compatible d'axe
(GE-03) ou de quadrant IV (GE-04). Les familles, pas et zones sont tirés
séparément puis appariés selon leurs contraintes de compatibilité.

## 3. Modèles spatiaux enseignés

La lecture et le placement ne sont pas confondus.

Pour lire :

- l'abscisse se lit sur l'axe horizontal en projetant le point
  **verticalement** ;
- l'ordonnée se lit sur l'axe vertical en projetant le point
  **horizontalement**.

Pour placer :

1. partir de l'origine `O` ;
2. se déplacer horizontalement jusqu'à l'abscisse ;
3. se déplacer verticalement jusqu'à l'ordonnée ;
4. placer le point à l'intersection.

## 4. QCM diagnostique

Les quatre mécanismes restent exactement :

1. réponse correcte `(x ; y)` ;
2. inversion `(y ; x)` ;
3. erreur de signe sur l'abscisse `(-x ; y)` ;
4. erreur de signe sur l'ordonnée `(x ; -y)`.

Un QCM n'est accepté que si les quatre couples sont distincts **et si chacun
reste dans les bornes du repère affiché**. Un distracteur ne peut donc être
écarté uniquement parce qu'une de ses coordonnées est graphiquement
impossible. L'ordre des quatre cartes reste déterministe et seedé.

La convention commune du lecteur est conservée : la bonne carte devient verte
et porte le signe `✓`, positionné absolument sans modifier sa hauteur. En cas
d'omission, la bonne carte est montrée en vert et le message précise désormais
« Pas de réponse. La réponse attendue est indiquée en vert. » pour rendre les
deux informations cohérentes.

## 5. Cours

Les deux cours comptent trois pages.

### Page 1 commune — vocabulaire du repère

Elle présente uniquement :

- axe des abscisses ;
- axe des ordonnées ;
- origine `O` ;
- graduations.

Elle ne décrit ni les pas internes du générateur ni leur pondération. L'axe des
abscisses entier est orange ; l'axe des ordonnées entier est turquoise. Les
traits, graduations, flèches et légendes consomment les mêmes couleurs de la
charte. Les anciennes petites flèches diagonales ajoutées aux axes ont été
supprimées.

Le numéro de page est une pastille textuelle rectangulaire « Page N », tandis
que les étapes internes du modelage utilisent des boutons à numéro circulaire :
les deux niveaux de navigation ne peuvent plus être confondus.

Cette page de vocabulaire est la seule à colorer les deux axes en entier. Les
autres pages gardent un repère neutre et colorent seulement la projection ou
le déplacement travaillé.

### GE-03

1. vocabulaire du repère ;
2. **Lire les coordonnées du point A**, en trois étapes cliquables : lire
   l'abscisse, lire l'ordonnée, écrire les coordonnées ;
3. **Lire les coordonnées d'un point sur un axe**, avec les cas
   `C(3 ; 0)` et `D(0 ; −2)`.

La règle « 1re coordonnée : abscisse ; 2e coordonnée : ordonnée » n'apparaît
qu'à l'étape d'écriture.

### GE-04

1. vocabulaire du repère ;
2. **Placer le point B**, en quatre étapes cliquables : origine, déplacement
   horizontal, déplacement vertical, point final ;
3. placer un point sur un axe quand une coordonnée est nulle.

## 6. Aides interactives

Les trois éléments numérotés du haut sont désormais un indicateur de
progression, pas une navigation permettant de sauter directement à la réponse.
Le gros second numéro, « Précédent » et « Indice suivant » ont été supprimés.
Une étape avance seulement après l'action attendue dans le repère. Le texte,
le dessin, la projection ou le déplacement changent alors ensemble.

### Lecture complète et QCM — trois étapes

1. **Lire l'abscisse** : l'élève clique l'axe des abscisses ; la projection
   verticale orange apparaît et marque la graduation à lire ;
2. **Lire l'ordonnée** : l'élève clique l'axe des ordonnées ; la projection
   horizontale turquoise apparaît ;
3. **Écrire les coordonnées** : l'aide rappelle
   `A(abscisse ; ordonnée)` et l'élève revient saisir lui-même les valeurs.

Un mauvais axe reçoit un retour contextualisé. L'aide ne colore pas tout le
repère, n'écrit pas les valeurs lues et ne montre jamais le couple correct.

« Comprendre le zéro » n'est plus une étape générique. Si le point est sur un
axe, le texte demande ce que l'on lit à l'origine sans annoncer immédiatement
la valeur. L'origine fait poser la même question sur les deux projections.

### Coordonnée isolée

L'aide tient en deux étapes symétriques : cliquer l'axe demandé, puis lire la
graduation atteinte par la projection. L'abscisse utilise une projection
verticale ; l'ordonnée une projection horizontale.

### Identification et placement

Identifier un point utilise trois actions : cliquer la graduation de
l'abscisse, cliquer celle de l'ordonnée, puis cliquer le point à
l'intersection.

L'aide GE-04 condense le modèle spatial en trois actions sans le changer :

1. cliquer la graduation de l'abscisse ;
2. cliquer la graduation de l'ordonnée ;
3. placer soi-même le point à l'intersection des deux guides.

Un clic sur le mauvais axe ou une mauvaise graduation reçoit un retour ciblé.
Le point final n'est jamais placé automatiquement. Les cas `x = 0`, `y = 0`
et `(0 ; 0)` expliquent le déplacement nul sans produire d'animation vide.

### Échelle

La valeur d'une petite graduation n'est plus écrite dans l'énoncé. Pour un pas
décimal, l'aide progresse ainsi : comparer deux valeurs chiffrées, compter les
intervalles, puis seulement au dernier niveau donner explicitement le pas.

## 7. Couleurs, rendu et accessibilité

Les rôles communs sont :

- abscisse / axe des abscisses / projection verticale : orange de charte
  `#f58220` ;
- ordonnée / axe des ordonnées / projection horizontale : turquoise de charte
  `#08b9b2`.

Le texte, les encadrés, le SVG, les flèches et les projections utilisent ces
valeurs uniques. Le repère d'une question ordinaire reste neutre. Hors page de
vocabulaire, une aide colore prioritairement la projection, le déplacement ou
la graduation active, pas les deux axes entiers. Les mots, formes de guides,
directions, lettres et libellés accompagnent toujours la couleur.

Le marqueur d'un point est une petite croix diagonale, plus légère que dans la
première version. Dans la correction GE-04, « ton point » ajoute un cercle
pointillé tandis que le point attendu conserve la croix seule : les deux rôles
restent distinguables sans dépendre uniquement du rouge et du vert.

Les étiquettes de points peuvent utiliser les marges du tracé, mais leur boîte
reste entièrement dans le `viewBox`. Les valeurs `xMin`, `xMax`, `yMin`,
`yMax` et les quatre coins restent donc possibles sans lettre coupée.

Le placement conserve :

- une surface entière aimantée aux graduations ;
- des cibles tactiles d'au moins 44 px ;
- la modification du point avant validation ;
- les quatre flèches du clavier ;
- une description accessible qui ne révèle pas la réponse.

Après un clic ordinaire, le lecteur affiche seulement « Point placé — tu peux
le déplacer avant de valider. » : les coordonnées de l'emplacement provisoire
ne sont plus données. Le halo de focus reste disponible au clavier via
`:focus-visible`, sans cadre bleu persistant après une interaction tactile ou
souris. Les aides interactives sont elles aussi utilisables au clavier avec
les flèches et Entrée.

Les quatre réponses du QCM forment toujours une grille `2 × 2`, du téléphone
au TNI, avec largeurs et hauteurs homogènes. Les couples sont centrés et ne
passent pas sous le `✓` commun. Le sélecteur spécifique du module conserve
cette disposition face à la règle générique des grilles de choix.

## 8. Diagnostics

| Code | Mécanisme reconnu |
|---|---|
| E1 | abscisse et ordonnée inversées |
| E2 | signe de l'abscisse perdu |
| E3 | signe de l'ordonnée perdu |
| E4 | coordonnée nulle d'un point sur un axe mal comprise |
| E5 | décalage d'une graduation |
| E6 | autre erreur |

Un diagnostic spécifique n'est affiché que si le mécanisme est non ambigu.
La correction GE-04 distingue le point choisi et le point attendu par couleur,
forme et libellé textuel.

## 9. Audit statistique reproductible

Commande :

```bash
node tests/automatismes-v2-reperage-statistiques.mjs --graines=10000
```

L'audit du 23 août 2026 couvre 10 000 graines pour chacune des longueurs
`1`, `2`, `5`, `10`, `15` et `20`, puis 3 000 séries multi-notions de cinq
questions.

### Séries de 20 — 200 000 questions par module

| Contrôle | GE-03 | GE-04 |
|---|---:|---:|
| pas 1 | 75 % | 75 % |
| pas 0,5 | 20 % | 20 % |
| pas 0,25 | 5 % | 5 % |
| quadrant I | 15 % | 20 % |
| quadrant II | 20 % | 20 % |
| quadrant III | 20 % | 20 % |
| quadrant IV | 20 % | 18,745 % |
| axe des abscisses hors origine | 11,903 % | 10 % |
| axe des ordonnées hors origine | 11,868 % | 10 % |
| `x = 0` origine comprise | 13,097 % | 11,255 % |
| `y = 0` origine comprise | 13,132 % | 11,255 % |
| origine | 1,228 % | 1,255 % |

Familles GE-03 observées : `lire-coordonnees` 50 %, `lire-abscisse` 15 %,
`lire-ordonnee` 15 %, QCM 10 % et identification 10 %. GE-04 reste à 100 %
dans `placer-point`.

Parmi les 60 000 questions d'abscisse ou d'ordonnée isolée, la formulation en
français représente 69,995 % et la notation `x_M/y_M` 30,005 %, conformément
aux poids `14 / 6` sans position fixe.

### Profils rares dans les petites séries

Pourcentage de séries contenant au moins une occurrence :

| Allocation | pas 0,25 GE-03 | pas 0,25 GE-04 | origine GE-03 | origine GE-04 | QCM GE-03 | identification GE-03 |
|---:|---:|---:|---:|---:|---:|---:|
| 1 question | 4,89 % | 5,09 % | 0,84 % | 1,00 % | 9,97 % | 9,91 % |
| 5 questions | 24,51 % | 24,93 % | 6,26 % | 6,31 % | 45,63 % | 44,97 % |

Ces mesures confirment qu'un profil rare est réellement accessible dans une
petite série ; elles ne constituent pas une nouvelle promesse de quota par
longueur.

Dans les séries GE-03 d'une question, 2 944 tirages concernaient une
coordonnée isolée ; 31,42 % employaient déjà la notation symbolique. Cette
variante n'est donc pas réservée aux longues séries.

### Série multi-notions courte

Sur 3 000 séries de cinq questions réparties entre NC-01, GE-03 et GE-04 :

| Contrôle | GE-03 | GE-04 |
|---|---:|---:|
| pas 1 / 0,5 / 0,25 | 74,390 / 20,274 / 5,336 % | 74,609 / 20,474 / 4,918 % |
| quadrants I / II / III / IV | 15,295 / 19,480 / 21,404 / 20,730 % | 19,872 / 20,895 / 19,450 / 19,109 % |
| `x = 0` / `y = 0` / origine | 11,982 / 12,220 / 1,111 % | 10,277 / 11,361 / 0,963 % |

Familles GE-03 : lecture complète 50,268 %, abscisse 14,184 %, ordonnée
15,493 %, QCM 9,899 %, identification 10,157 %. Tous les profils rares ont été
observés dans cette allocation multi-notions. Parmi les 1 496 coordonnées
isolées, la notation `x_M/y_M` apparaît dans 31,952 % des cas.

## 10. Tests et recette visuelle

Les non-régressions couvrent :

- déterminisme, paquets pondérés et absence de préfixe d'un plan de 20 ;
- trois pas et coordonnée décimale réellement utilisée ;
- quatre quadrants, deux axes, origine et quatre bords/coins ;
- quatre distracteurs exacts, distincts et visibles ;
- aides interactives en 2 ou 3 étapes, sans double navigation ;
- mauvais axe, mauvaise graduation, bonne projection et intersection finale ;
- variantes `x_M` et `y_M`, avec un vrai caractère mathématique italique ;
- absence des coordonnées du point provisoire et maintien du clavier ;
- série courte ciblée et série courte multi-notions ;
- rationnels exacts, diagnostics, tactile et clavier ;
- QCM `2 × 2` à toutes les largeurs et `✓` sans déformation.

`tests/automatismes-v2-reperage-regression.cjs` décrit la recette réelle pour
`320 × 568`, `390 × 844`, `768 × 1024`, `1 366 × 768` et `1 920 × 1 080`.
Elle parcourt les familles GE-03, `x_M`, `y_M`, les cas nuls et décimaux, les
trois étapes d'aide et un mauvais axe, le QCM et sa correction. Pour GE-04,
elle capture le mauvais axe, la mauvaise graduation, les deux guides,
l'intersection fausse puis correcte, les cas standards, négatifs, décimaux,
extrêmes, les corrections juste et fausse et le mode Au tableau. Elle vérifie
aussi les débordements, la grille QCM, les cibles de 44 px, le focus et les
lettres.

Deux planches produites directement par l'objet de production sont générées
par `tests/automatismes-v2-reperage-planches.mjs` et relues en PNG. Elles
couvrent les axes colorés de la seule page de vocabulaire, les projections sur
repère neutre, les quatre temps du modelage de placement, les pas décimaux, les
coordonnées nulles et les huit positions de bord.

La vérification complète passe **1 759 tests sur 1 759** dans **251 suites**.
Le graphe V2 est invalidé atomiquement en `v54` et la façade `app.js` reçoit la
révision `57`.
