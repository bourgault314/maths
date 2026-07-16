# Conventions visuelles mathématiques — espace Axelle

_Mise à jour : 16 juillet 2026._

Ce fichier conserve les choix appliqués dans l’espace Axelle, notamment dans `axelle/assets/content.js` et dans les fichiers `suite-*-v3`. Il sert de point de comparaison avec la future bibliothèque graphique commune issue du découpage d’Automatismes.

## Principe général

Les objets mathématiques ne doivent pas être redessinés librement dans chaque page. Les tracés locaux d’Axelle sont provisoires : ils doivent être croisés avec les composants canoniques d’Automatismes, puis remplacés par des imports lorsque la bibliothèque commune sera stabilisée.

## Barres et grilles

Ordre de tracé obligatoire :

1. dessiner tous les aplats de couleur, sans bordure ;
2. dessiner une seule fois le contour extérieur ;
3. dessiner chaque séparation intérieure une seule fois.

Cette règle évite les bordures doublées, épaissies ou partiellement recouvertes.

## Fractions

- L’unité complète est indiquée par une véritable accolade au-dessus de toute la barre.
- Le texte `une unité` est centré au-dessus de l’accolade.
- La fraction est composée verticalement : numérateur centré, trait horizontal, dénominateur centré.
- Le nom français est placé à côté de la fraction.
- Codes propres au parcours d’Axelle :
  - demi : jaune ;
  - tiers : violet ;
  - quarts : vert.
- Toutes les parts sélectionnées ont exactement la même couleur ; les autres restent blanches.

Fonctions locales actuelles : `memoTopBrace`, `memoFractionLabel` et `fractionMemo`.

## Multiplication et groupes égaux

Le nombre 12 est représenté deux fois :

- rectangle (4 × 3) : trois rangées de quatre ;
- le même rectangle tourné, (3 × 4) : quatre rangées de trois.

Conventions :

- un rectangle contenant le total 12 est placé au-dessus de chaque représentation ;
- les dimensions 4 et 3 sont codées sur les longueurs ;
- les légendes `3 groupes de 4` et `4 groupes de 3` sont placées sous les rectangles ;
- les deux écritures `3 × 4 = 12` et `4 × 3 = 12` restent visibles ;
- les fonds sont dessinés avant la grille, puis le contour et les séparations sont tracés une seule fois.

## Migration future

Quand les composants d’Automatismes seront extraits et stabilisés :

1. comparer les tracés canoniques avec les fonctions locales d’Axelle ;
2. conserver une seule implémentation par objet mathématique ;
3. faire importer ces composants par Axelle ;
4. supprimer les fonctions locales devenues des doublons ;
5. vérifier les rendus sur téléphone portrait et ordinateur avant publication.

## Retour d’expérience — J2 du 16 juillet 2026

Ce retour d’expérience fait partie des règles du projet. Il ne doit pas être supprimé lorsque le J2 sera remplacé : les mêmes erreurs pourraient se reproduire dans un autre parcours destiné à un enfant.

### 1. Le cours était trop long pour une future CM1

**Erreur rencontrée :** les mémos contenaient plusieurs phrases explicatives alors que le dessin pouvait porter l’essentiel du sens.

**Règle :** une carte de cours pour enfant transmet une seule idée. Le dessin donne l’information principale ; le texte se limite à un titre explicite et à une ou deux phrases courtes.

### 2. La fraction n’était pas assez explicite

**Erreur rencontrée :** les mots `numérateur` et `dénominateur` étaient expliqués dans un paragraphe, sans flèches. L’aide de la première question était seulement une phrase.

**Règle :** montrer une fraction verticale et relier par des flèches :

- le numérateur au nombre de parts coloriées ;
- le dénominateur au nombre total de parts égales.

Une aide visuelle ne doit pas être remplacée par une phrase lorsque le schéma permet de comprendre immédiatement.

#### Sens obligatoire des flèches

Une flèche explicative part toujours du mot ou de la légende et sa pointe vise exactement l’objet expliqué. Pour une fraction placée à gauche des légendes :

- la flèche `numérateur` va de la légende vers le nombre du haut ;
- la flèche `dénominateur` va de la légende vers le nombre du bas ;
- la pointe est dessinée du côté du nombre, jamais du côté du texte.

Avant publication, suivre visuellement chaque flèche dans le sens de la lecture : « le mot désigne quoi ? ». L’extrémité pointue doit donner la réponse.

### 3. Le cours sur les angles décrivait une propriété secondaire

**Erreur rencontrée :** le titre insistait sur le fait que tourner un angle ne change pas son nom, sans donner directement le vrai repère de cours.

**Règle :** écrire le nom à côté de chaque dessin et afficher les repères utiles : aigu inférieur à 90°, droit égal à 90°, obtus entre 90° et 180°, plat égal à 180°.

### 4. Les codages des triangles étaient mal placés

**Erreur rencontrée :** certains traits d’égalité n’étaient pas centrés sur les segments et le codage de l’angle droit n’était pas assez nettement rattaché au bon sommet.

**Règle :**

- le carré d’angle droit touche exactement les deux côtés issus du sommet concerné ;
- un trait d’égalité coupe le segment et est centré sur lui ;
- sous chaque figure, écrire séparément `1 angle droit`, `2 côtés égaux` ou `3 côtés égaux`.

Les coordonnées mathématiques des segments doivent être vérifiées avant le réglage esthétique.

### 5. Des dessins essentiels devenaient minuscules sur téléphone

**Erreur rencontrée :** le disque des sixièmes et la porte utilisaient la mise en page compacte à deux colonnes ; ils devenaient trop petits pour être lus.

**Règle :** les mémos dont le schéma porte le cours utilisent la disposition pleine largeur sur téléphone (`mobileStack`). Ne jamais valider un dessin uniquement sur ordinateur.

### 6. La première version corrigée contenait encore des chevauchements

**Erreur rencontrée :** les légendes sous la fraction se superposaient et les noms des trois triangles se touchaient.

**Cause :** le code SVG avait été vérifié syntaxiquement, mais pas encore observé dans son rendu réel.

**Règle :** avant publication, prendre et examiner au minimum :

- une capture ordinateur du cours complet ;
- une capture téléphone portrait du cours complet ;
- une capture rapprochée de chaque schéma géométrique modifié ;
- une capture des états de réussite et d’erreur des activités tactiles.

### 7. Une mauvaise réponse pouvait bloquer tout le questionnaire

**Erreur rencontrée :** les QCM ordinaires affichaient la correction puis la suite, mais le disque à colorier et l’association des angles exigeaient une réponse correcte. Une erreur empêchait donc d’avancer.

**Règle commune :** une validation termine toujours la question :

1. indiquer si la réponse est correcte ou non ;
2. afficher la correction ;
3. afficher `Question suivante`.

Si une activité doit exceptionnellement imposer un nouvel essai, ce choix doit être explicite, avec un véritable bouton `Réessayer`, et non un blocage implicite.

### 8. Une action tactile n’était pas réversible

**Erreur rencontrée :** après avoir placé un nom sous un angle, il était impossible de le retirer simplement.

**Règle :** avant validation, toute manipulation doit pouvoir être annulée. Dans l’association des angles, toucher une case remplie remet son étiquette dans la réserve. L’interface doit signaler cette possibilité visuellement et dans son libellé accessible.

### 9. Le bouton suivant masquait la correction

**Erreur rencontrée pendant la correction :** une première tentative de bouton mobile collant recouvrait une partie du message d’erreur des angles.

**Règle :** aucun bouton persistant ne doit masquer l’énoncé, l’aide ou la correction. Le bouton suivant reste dans le flux de la page, en pleine largeur, avec une hauteur tactile confortable.

### 10. Publication et cache

**Erreur de procédure :** le dépôt local permettait de lire GitHub mais ne possédait pas les identifiants nécessaires au `git push`. Après publication par le connecteur GitHub, le cache public pouvait encore servir l’ancienne page pendant environ dix minutes.

**Règle :**

- relire la dernière version de `main` avant toute publication ;
- publier d’abord les ressources, puis `index.html` avec une nouvelle version de cache ;
- vérifier que les fichiers de `main` correspondent exactement à la version testée ;
- distinguer clairement « publié sur main » et « déjà propagé sur le site public ».

### 11. Test de non-régression obligatoire

Le test `tests/axelle-j2-regression.cjs` doit rester associé au parcours. Il vérifie notamment :

- les 20 questions de maths et les 18 questions de français jusqu’à l’écran final ;
- la présence du schéma dans l’aide de la première fraction ;
- le passage à la question suivante après une réponse tactile fausse ;
- le retrait d’une étiquette déjà placée ;
- les rendus ordinateur et téléphone utilisés pour l’inspection visuelle.

### 12. Une conversion n’est pas un ordre de grandeur

**Erreur rencontrée :** `1 km = 1 000 m` était affiché seul. L’égalité était exacte, mais elle ne donnait aucune image mentale de la distance à une enfant.

**Règle :** pour chaque nouvelle unité, fournir un **étalon concret** avant de demander une conversion. Exemples retenus pour Axelle :

- environ 1 m : du sol à une poignée de porte ;
- environ 1 km : un trajet de la maison à l’école.

Le repère est présenté comme une approximation, car la distance réelle dépend du lieu.

### 13. Un schéma de cours doit suffire sans paragraphe redondant

**Erreur rencontrée :** le mémo sur les angles répétait sous les dessins les informations déjà écrites à côté de chaque angle.

**Règle :** si les quatre dessins portent clairement `aigu`, `droit · 90°`, `obtus` et `plat · 180°`, ne pas recopier ces quatre informations dans un texte sous la carte. Pour l’angle plat, marquer aussi le sommet par un point ou un petit trait central.

### 14. Vérification de l’affichage ordinateur

Le cours doit être vérifié sur un écran d’ordinateur courant, y compris avec une hauteur de 768 à 900 px. Réduire raisonnablement les marges et les cartes pour que l’ensemble reste lisible et largement visible sans transformer les schémas en vignettes.

### 15. Vérifier le sommet réellement droit, pas seulement le carré

**Erreur rencontrée :** le carré orange du petit triangle était dessiné en bas à gauche, mais les deux côtés perpendiculaires du triangle se rencontraient en haut à gauche. Le codage était propre graphiquement et pourtant mathématiquement faux.

**Règle :** avant de placer le carré, repérer les deux segments perpendiculaires dans les coordonnées de la figure. Le carré doit toucher leur sommet commun. Une vérification visuelle du carré seul ne suffit pas : il faut suivre les trois côtés du triangle.
