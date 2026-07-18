# La couche d'interaction — relevé et plan

Gwenaël veut toutes les interactions : on déplace, on clique, on manipule au doigt.
Si chaque notion réinvente sa façon de faire glisser une réponse, on aura quarante
comportements différents et ça cassera sur téléphone. **Cette couche se fait une fois.**

Tout ce qui suit a été relevé dans le code existant. Rien n'est à inventer : les bonnes
implémentations sont déjà là, dispersées.

---

## 1. Quatre défauts sur téléphone, à corriger

Par ordre de gravité pour un élève qui travaille sur son portable.

### Le manipulateur de fractions est masqué sur téléphone

`auto/scripts/03-slideshow.js:786` :

```css
@media (max-width: 800px) {
  .fraction-product-manipulator { display: none }
  .fraction-product-static { display: block !important }
}
```

Sur téléphone, l'élève ne voit qu'une **image fixe** : il ne peut pas manipuler la fraction
d'une fraction. C'est le contournement le plus lourd du dépôt, et il touche exactement le
public visé.

### La sélection multiple est impossible au doigt

Dans les bandes (`outils/fractions/bandes_fractions.html:2423, 2827`) et les disques
(`disques_fractions.html:1863`), sélectionner plusieurs pièces exige **Ctrl, Cmd ou Maj**.
Il n'y a pas de touche sur un téléphone. La fonction existe donc, mais elle est morte au doigt.
Même chose pour `Alt`, qui désactive l'aimantation.

Il faut un équivalent tactile : appui long, ou un mode « sélection » explicite.

### Le seuil de glissement d'ÉquaSplat est trop bas

`outils/equasplat.html:4673` mesure le seuil anti-clic **en unités SVG**, pas en pixels
d'écran : `Math.hypot(dx, dy) > 3`. Avec un `viewBox` de 1600 de large sur un écran de 390 px,
3 unités valent environ **0,7 pixel réel**. Un doigt qui tremble un peu déclenche un glissement
au lieu d'un appui.

Le bon réglage existe ailleurs dans le dépôt : **7 pixels d'écran**
(`auto/scripts/03-slideshow.js:1656`).

### Les tuiles algébriques n'ont aucun seuil

`outils/tuiles_algebriques/tuiles_algebriques.html:2459-2539` : pas de seuil du tout. Tout
appui sur une tuile démarre immédiatement un déplacement. Au doigt, les déplacements
accidentels sont garantis.

## 2. Ce qui est déjà excellent — et qui sert de modèle

**Le curseur de droite graduée** (`auto/scripts/03-slideshow.js:1740-1791`) est la meilleure
interaction du dépôt, et de loin. Elle a tout :

- capture du pointeur, seuil de 4 px, fantôme visuel pendant le glissement ;
- aimantation à chaque graduation ;
- `aria-valuetext` **en français, avec la virgule décimale** ;
- clavier complet : flèches, Début, Fin, Entrée, Espace ;
- les graduations elles-mêmes sont cliquables ;
- le focus revient sur la poignée après action ;
- un bouton pour recommencer.

**Le glisser-déposer des cartes décimales** (`:1640-1686`) a une qualité rare : le même geste
est disponible **en deux modalités** — glisser la carte, ou toucher la carte puis toucher la
case. La deuxième sauve l'élève qui n'arrive pas à glisser, et elle est gratuite au clavier.

**Les jetons relatifs** (`:1888-1926`) sont de vrais boutons : tout au clic, rien à glisser.
Consigne affichée : « Touchez un jeton pour le déplacer dans la zone résultat ». C'est ce qui
marche le mieux au doigt.

**Le noyau d'ÉquaSplat** (`packages/objets/src/plateaux-splat.js`) est déjà sorti du HTML,
avec ses tests. C'est l'architecture à généraliser : logique pure d'un côté, géométrie testée
au milieu, branchement au DOM à la fin.

## 3. Les quatorze gestes de l'application

Relevé complet, avec l'endroit d'où partir pour chacun.

| Le geste | D'où partir |
| --- | --- |
| Glisser un objet librement | `studio/atelier/equasplat.html:520-577` |
| Déposer dans une zone | `03-slideshow.js:1640-1686` |
| Cliquer une zone d'un dessin | `03-slideshow.js:1700-1739` |
| Faire glisser le long d'un axe | `03-slideshow.js:1740-1791` |
| Régler une fraction à deux poignées | `03-slideshow.js:1981-2016` |
| Aimanter bord à bord | `bandes_fractions.html:2976-3111` |
| Détecter une fusion au dépôt | `plateaux-splat.js:254-264` (déjà testé) |
| Sélectionner une forme non rectangulaire | `disques_fractions.html:2816-2830` |
| Faire tourner un objet | `disques_fractions.html:3184-3213` |
| Sélectionner plusieurs éléments | `bandes_fractions.html:2495-2528` — **à réinventer pour le doigt** |
| Cliquer selon un mode d'outil | `studio/atelier/equasplat.html:579-596` |
| Contraindre une position | `plateaux-splat.js:153-232` (déjà testé) |
| Neutraliser le clic fantôme | `03-slideshow.js:1664` (horodatage, 300 ms) |
| Convertir écran vers dessin | `equasplat.html:513-518` (`getScreenCTM().inverse()`) |

Deux algorithmes méritent d'être signalés, parce qu'ils règlent des problèmes réels :

- **le test de forme réelle** des disques (`disques_fractions.html:3138`) : on choisit la pièce
  réellement sous le doigt, et non sa boîte englobante. Sans lui, les zones transparentes des
  carrés se bloquent entre elles quand les pièces se touchent ;
- **le seuil d'aimantation adapté à la taille** des tuiles (`tuiles_algebriques.html:1425-1445`),
  qui corrige un bug documenté : avec un seuil fixe, on attrapait la tuile voisine au lieu de
  celle qu'on visait.

## 4. Les règles de la couche unifiée

Tirées de ce qui marche déjà. Elles s'appliqueront partout, sans exception.

- **Pointer Events uniquement.** Jamais `mouse*` et `touch*` en double — c'est la source de la
  moitié des bugs tactiles du dépôt.
- **`setPointerCapture` systématique**, dans un `try`/`catch` (vieux appareils tactiles).
- **`pointercancel` est une annulation**, pas une fin. Le patron `finish(event, cancelled)` de
  `03-slideshow.js:1660-1668` est le bon.
- **Seuil anti-clic : 7 pixels d'écran.** Jamais en unités de dessin.
- **`touch-action: none`** sur la surface, et `preventDefault()` seulement une fois le seuil
  franchi — pour laisser passer l'appui simple.
- **Protection multi-touch par `hasPointerCapture`** (`03-slideshow.js:1965`), plus propre que
  la comparaison d'identifiants.
- **Aucun geste ne dépend d'une touche du clavier.** Ni Ctrl, ni Maj, ni Alt : ils n'existent
  pas sur un téléphone.
- **Tout ce qui se glisse doit aussi pouvoir se toucher.** Le patron des cartes décimales :
  toucher l'objet, puis toucher la destination.
- **Tout ce qui se clique est atteignable au clavier** : `tabindex`, `role`, `aria-label`
  parlant en français, `Entrée` et `Espace`, et restitution du focus après re-rendu.

## 5. Ce qui reste à décider

- **La sélection multiple au doigt** : appui long, ou mode « sélection » explicite ? Le second
  est plus découvrable, le premier plus rapide. À trancher avec Gwenaël quand une notion en
  aura besoin — pas avant.
- Faut-il **réactiver le manipulateur de fractions sur téléphone** en l'adaptant, ou le
  remplacer par une interaction pensée pour le doigt ? Le masquage actuel n'est pas documenté :
  on ne sait pas s'il tenait à la place à l'écran ou à un problème tactile.
