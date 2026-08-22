# GE-03 / GE-04 — Repérage dans le plan

Statut de la fiche : **publié pour essai, statut pédagogique `construit`, nouvelle revue responsive en cours**
Périmètre : Automatismes DNB V2, pas 1 très majoritaire, pas 0,5 occasionnel et pas 0,25 rare.

Références officielles relues : la
[liste indicative des automatismes du DNB 2026](https://eduscol.education.gouv.fr/sites/default/files/document/liste-indicative-dautomatismes-pour-le-dnbpdf-116340.pdf)
nomme la lecture des coordonnées et le placement d'un point ; la
[page Éduscol des épreuves du DNB](https://eduscol.education.gouv.fr/5607/les-epreuves-du-dnb)
cadre les sujets zéro et les attendus de l'épreuve. La lecture d'une abscisse
ou d'une ordonnée isolée est donc traitée ici comme consolidation explicite du
vocabulaire, et non comme une troisième compétence officielle concurrente.

## 1. Décision de découpage

GE-03 et GE-04 restent deux modules visibles distincts :

- `lire-coordonnees-point` pour GE-03 ;
- `placer-point-repere` pour GE-04.

Cette séparation suit la taxonomie et évite qu'une série de placement soit
diluée par des questions de lecture. Les deux modules partagent cependant :

- l'objet V2 `repere-cartesien.js` ;
- la première page de cours et les conventions visuelles ;
- les aides visuelles ;
- les diagnostics E1 à E6 ;
- les conventions de correction et d'accessibilité.

## 2. Ajustements apportés au cahier des charges

### 2.1 Sens spatial avant le slogan

Le cours ne dit pas seulement « horizontal puis vertical ». Il distingue :

- l'abscisse est la position sur l'axe horizontal ; depuis le point, son
  guide vers cet axe est vertical ;
- l'ordonnée est la position sur l'axe vertical ; depuis le point, son
  guide vers cet axe est horizontal.

Pour placer, le chemin est bien : origine, déplacement horizontal jusqu'à
l'abscisse, puis déplacement vertical jusqu'à l'ordonnée.

### 2.2 Variété contrôlée

Les bornes asymétriques sont prises dans une petite banque validée. L'origine
reste visible et les unités sont carrées. Le hasard choisit à l'intérieur du
plan, mais ne décide ni des quotas de familles ni de la couverture des quatre
quadrants et des axes.

### 2.3 QCM strictement diagnostique

Un QCM n'est construit que lorsque les quatre propositions suivantes sont
distinctes : réponse correcte, inversion, signe de l'abscisse, signe de
l'ordonnée. Les coordonnées sont alors non nulles et leurs valeurs absolues
sont différentes.

### 2.4 Placement tactile

Toute la zone du repère est interactive. Le clic ou le toucher est aimanté à
l'intersection graduée la plus proche. Une sélection reste provisoire jusqu'à
validation et peut être déplacée au pointeur ou avec les flèches du clavier.

## 3. Périmètre mathématique du pilote

- repère orthogonal avec unités carrées à l'écran ;
- pas de 1 très majoritaire ;
- pas 0,5 occasionnel et pas 0,25 réservé à une série de 20 ;
- coordonnées entières ou décimales finies exactes ;
- quatre quadrants ;
- coordonnées positives, négatives et nulles ;
- points sur chaque axe ;
- origine rare ;
- aucune alternance mécanique entre pas entier et pas décimal.

Sur 20 questions, les deux modules utilisent exactement 15 repères au pas 1,
4 au pas 0,5 et 1 au pas 0,25. Les séries de 5, 10 et 15 contiennent
respectivement 1, 2 et 3 repères au pas 0,5, sans pas 0,25. Toute question à
pas décimal impose au moins une coordonnée non entière : l'échelle plus fine
n'est jamais décorative. Les étiquettes sont allégées pour que les petites
graduations restent lisibles.

La lecture d'une abscisse seule et d'une ordonnée seule reste minoritaire :
elle consolide le vocabulaire, tandis que le cœur officiel est la lecture du
couple et le placement du point.

## 4. Familles GE-03

| Famille interne | Tâche | Réponse | Rôle |
|---|---|---|---|
| `lire-coordonnees` | lire le couple d'un point | deux champs exacts | cœur de la série |
| `lire-abscisse` | lire l'abscisse seule | nombre signé exact | vocabulaire et axe des abscisses |
| `lire-ordonnee` | lire l'ordonnée seule | nombre signé exact | vocabulaire et axe des ordonnées |
| `diagnostic-coordonnees` | choisir le bon couple | QCM à distracteurs construits | diagnostic ciblé |
| `identifier-point` | retrouver un point parmi plusieurs | clic sur le point | pont vers GE-04 |

Pour 20 questions, le plan est exactement `10 / 3 / 3 / 2 / 2`. Les plans
5, 10 et 15 conservent la domination de la lecture complète et introduisent
progressivement les deux variantes interactives.

## 5. Famille GE-04

Toutes les questions ont la famille `placer-point`. L'élève place un unique
point donné par son nom et ses coordonnées. Il n'y a ni QCM ni sous-format
artificiel.

## 6. Contraintes de série

Sur 20 questions de chaque module :

- chaque quadrant apparaît ;
- un point au moins est sur l'axe des abscisses ;
- un point au moins est sur l'axe des ordonnées ;
- les signes positifs et négatifs sont répétés ;
- les lettres sont variées et `O` n'est jamais un nom de point ;
- les questions visuellement identiques sont interdites ;
- l'origine apparaît rarement, selon une décision seedée et bornée.

Les repères à plusieurs points imposent des coordonnées distinctes et une
distance suffisante pour conserver des cibles et des étiquettes séparées.

## 7. Deux cours cohérents — trois écrans chacun

Les deux cours partagent les couleurs stables — orange pour l'abscisse,
turquoise pour l'ordonnée — et une première page où « axe des abscisses » et
« axe des ordonnées » sont écrits directement sur le dessin avec un repère
visuel. Ils ne mélangent plus les deux gestes.

Cours GE-03 :

1. **Les axes du repère** : axes nommés directement, origine `O` et valeur
   possible d'une graduation.
2. **Lire le point A** : démonstration cliquable en trois temps, abscisse
   `−3`, ordonnée `2`, puis écriture colorée `A(−3 ; 2)`.
3. **Lire sur les axes** : `C(3 ; 0)` et `D(0 ; −2)`, avec la coordonnée nulle
   explicitement reliée à l'axe qui porte le point.

Cours GE-04 :

1. **Les axes du repère** : même vocabulaire et mêmes couleurs.
2. **Placer le point B** : démonstration cliquable depuis `O`, déplacement
   horizontal jusqu'à 2, puis vertical jusqu'à `−1` et point final.
3. **Placer sur les axes** : les deux cas `C(3 ; 0)` et `D(0 ; −2)` sont
   construits séparément.

## 8. Aides

Les aides avancent désormais un indice à la fois. Chaque bouton change à la
fois le texte et le dessin ; un repère coloré marque l'axe rejoint, y compris
quand un déplacement ou une projection a une longueur nulle. Elles restent
sans valeur révélée au premier niveau :

- lecture complète : chercher d'abord la position sur l'axe horizontal,
  puis celle sur l'axe vertical ;
- abscisse : guide vertical discret vers l'axe horizontal ;
- ordonnée : guide horizontal discret vers l'axe vertical ;
- point sur un axe : questionner la coordonnée qui vaut zéro sans l'annoncer
  dans le premier message ;
- placement : montrer uniquement le premier déplacement horizontal, puis le
  déplacement vertical et enfin l'intersection, sans poser le point à la
  place de l'élève.

## 9. Diagnostics communs

| Code | Mécanisme reconnu |
|---|---|
| E1 | abscisse et ordonnée inversées |
| E2 | signe de l'abscisse perdu |
| E3 | signe de l'ordonnée perdu |
| E4 | zéro d'un point situé sur un axe mal compris |
| E5 | décalage d'une graduation |
| E6 | autre erreur |

Un diagnostic spécifique n'est affiché que si le mécanisme est non ambigu.
La correction GE-04 superpose le point choisi et le point attendu, avec deux
marqueurs, deux couleurs et des libellés textuels : la couleur n'est jamais le
seul canal.

## 10. Contrats et accessibilité

- bloc JSON pur `repere-cartesien`, désormais doté d'un pas explicite parmi
  `1`, `0,5` et `0,25` ;
- nouveau type de réponse `deux-entiers-relatifs` pour conserver deux champs
  et l'ordre du couple dans la trace ;
- nouveau type `deux-nombres-decimaux` pour tracer séparément deux écritures
  et leurs deux valeurs rationnelles exactes ;
- déterminisme strict du seed ;
- description accessible du repère sans révéler une réponse cachée ;
- points cliquables nommés pour l'identification ;
- surface de placement focusable, flèches clavier et instruction associée ;
- cibles d'action d'au moins 44 px ;
- même SVG en entraînement, au tableau, dans le cours et dans le Studio ;
- sur téléphone, un bouton flottant « ↓ Répondre » apparaît uniquement si la
  zone de saisie est réellement sous le bord visible et y fait défiler la
  question.

## 11. Recette réalisée

- tests unitaires de l'objet et du contrat ;
- tests des deux générateurs et de leurs corrections ;
- audit d'au moins 1 000 seeds par module ;
- vérification des quotas, quadrants, axes, zéros, signes, doublons et
  cohérence réponse/affichage ;
- scénarios de diagnostics E1 à E6 ;
- captures `320 × 568`, téléphone courant, tablette, ordinateur et TNI ;
- captures de question, aide, erreur/correction, cours et placement ;
- analyse visuelle puis nouvelle passe après chaque correction.

Résultats du lot local du 22 août 2026 :

- **1 000 seeds de 20 questions par module**, soit 40 000 profils contrôlés ;
- 254 origines en GE-03 et 286 en GE-04 : l'origine reste rare et seedée ;
- 2 370 points sur l'axe des abscisses et 2 376 sur l'axe des ordonnées en
  GE-03 ; exactement 2 000 sur chacun des deux axes en GE-04 ;
- **100 seeds instanciés par module**, soit 4 000 questions dont le dessin,
  la réponse attendue et la correction ont été recoupés ;
- **1 744 tests sur 1 744**, répartis en 245 suites, et tous les validateurs
  du dépôt réussis ;
- contrôle structurel des cinq fenêtres `320 × 568`, `390 × 844`,
  `768 × 1024`, `1 366 × 768` et `1 920 × 1 080` : unités carrées, zone
  utile, deux SVG responsives, cibles de 44 px, aimantation et clavier ;
- deux planches vectorielles, soit dix états graphiques représentatifs,
  rendues en PNG et relues deux fois. Cette revue a conduit à déplacer `O`
  au-dessus de l'axe pour l'écarter de `−1` sur 320 px et à agrandir la
  cellule maximale pour la projection.

La recette Chromium `tests/automatismes-v2-reperage-regression.cjs` prévoit
36 captures réelles sur les cinq fenêtres, avec contrôles de débordement,
cibles, panneaux et erreurs de console. Le runtime de construction possède
Playwright mais pas son exécutable Chromium ; cette passe reste donc à rejouer
sur la version publiée pour essai. Les planches inspectées sont issues
directement de l'objet de production, mais ne remplacent pas ce dernier
contrôle du lecteur complet.
