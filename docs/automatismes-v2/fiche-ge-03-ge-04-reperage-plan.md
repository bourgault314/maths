# GE-03 / GE-04 — Repérage dans le plan

Statut de la fiche : **publié pour essai, statut pédagogique `construit`, revue complète dans le vrai navigateur à poursuivre**  
Périmètre : Automatismes DNB V2, pas entier uniquement.

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
- le cours en trois écrans ;
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
l'intersection entière la plus proche. Une sélection reste provisoire jusqu'à
validation et peut être déplacée au pointeur ou avec les flèches du clavier.

## 3. Périmètre mathématique du pilote

- repère orthogonal avec unités carrées à l'écran ;
- pas de 1 ;
- coordonnées entières ;
- quatre quadrants ;
- coordonnées positives, négatives et nulles ;
- points sur chaque axe ;
- origine rare ;
- aucune échelle décimale dans ce pilote.

La lecture d'une abscisse seule et d'une ordonnée seule reste minoritaire :
elle consolide le vocabulaire, tandis que le cœur officiel est la lecture du
couple et le placement du point.

## 4. Familles GE-03

| Famille interne | Tâche | Réponse | Rôle |
|---|---|---|---|
| `lire-coordonnees` | lire le couple d'un point | deux entiers relatifs | cœur de la série |
| `lire-abscisse` | lire l'abscisse seule | entier signé | vocabulaire et axe horizontal |
| `lire-ordonnee` | lire l'ordonnée seule | entier signé | vocabulaire et axe vertical |
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

## 7. Cours partagé — trois écrans

1. **Comprendre le repère** : axe des abscisses, axe des ordonnées, origine
   `O`, sens positifs et rôle des graduations.
2. **Lire un point** : `A(−3 ; 2)`, guide vers l'axe horizontal puis vers
   l'axe vertical, avec la correspondance explicite première coordonnée =
   abscisse, deuxième coordonnée = ordonnée.
3. **Placer un point** : `B(2 ; −1)`, chemin depuis `O`, puis mini-cas
   `C(3 ; 0)` et `D(0 ; −2)` pour les axes.

## 8. Aides

Les aides restent sans valeur révélée au premier niveau :

- lecture complète : chercher d'abord la position sur l'axe horizontal,
  puis celle sur l'axe vertical ;
- abscisse : guide vertical discret vers l'axe horizontal ;
- ordonnée : guide horizontal discret vers l'axe vertical ;
- point sur un axe : questionner la coordonnée qui vaut zéro sans l'annoncer
  dans le premier message ;
- placement : montrer uniquement le premier déplacement horizontal, puis
  rappeler le déplacement vertical.

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

- nouveau bloc JSON pur `repere-cartesien` ;
- nouveau type de réponse `deux-entiers-relatifs` pour conserver deux champs
  et l'ordre du couple dans la trace ;
- déterminisme strict du seed ;
- description accessible du repère sans révéler une réponse cachée ;
- points cliquables nommés pour l'identification ;
- surface de placement focusable, flèches clavier et instruction associée ;
- cibles d'action d'au moins 44 px ;
- même SVG en entraînement, au tableau, dans le cours et dans le Studio.

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
- **1 709 tests sur 1 709**, répartis en 242 suites, et tous les validateurs
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
