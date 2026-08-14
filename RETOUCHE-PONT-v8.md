# RETOUCHE-PONT-v8.md — Le pont à deux registres (amende l'addendum v7 de SPEC-COMPRENDRE-LOT1.md)

> Décision de conception prise en session Cowork le 14/08 (Gwenael + Claude), après
> analyse du rendu réel de la PR #357. Ce document remplace, dans la spec, le
> paragraphe « Le pont entre les deux mondes » de l'addendum v7. Tout le reste de la
> passe 5 (mur de bandes, R5, textes v7, prédire, carte de savoir, mention
> Refraction) est conservé tel quel.

## Le problème constaté (objection de Gwenael, confirmée sur le rendu)

Le pont actuel COUCHE le rayon à l'emplacement de la bande : même longueur, même
position — puis le mur se découpe EN LONGUEUR. Or dans le jeu, ce n'est jamais la
longueur du rayon qui se partage : c'est son ÉPAISSEUR. Le morphing identifie donc
les deux représentations sur le MAUVAIS axe, et installe une fausse image (« couper
= raccourcir le rayon »). Par ailleurs les textes des cours parlent de rayons
(« deux rayons sont sortis du prisme ») alors que l'écran ne montre plus que des
bandes : le texte pointe vers une chose invisible.

## La solution : ne plus TRANSFORMER, mettre en CORRESPONDANCE — et tout SYNCHRONISER

Constat aggravant sur le rendu actuel (Gwenael, sur capture) : à l'instant où le
texte dit « La moitié d'un rayon, c'est un demi-rayon », l'image montre… un rayon
ENTIER, seul. La phrase parle d'une moitié, l'image n'en montre aucune — l'image ne
sert à rien. La règle qui répare tout : **à chaque instant, l'image montre ce que la
phrase dit.**

La scène de chaque cours a DEUX zones, l'une au-dessus de l'autre, qui grandissent
ENSEMBLE, étape par étape, au rythme du texte :

1. **Zone haute — le vécu (rayons, AVEC les séparateurs)** : la cascade du jeu,
   compacte, dans l'esprit des scènes du Coup de pouce : soleil → rayon entier
   épais → prisme ÷n → les branches qui en sortent, vraies épaisseurs (fwidth),
   vraies couleurs (fcol), étiquettes étagées. La cascade POUSSE d'une étape à
   chaque étape du texte — le prisme et ses branches apparaissent au moment où la
   phrase les raconte.
2. **Zone basse — la forme de l'école (bandes)** : le mur EXISTANT, inchangé
   (étages collés, pointillés, fractions étagées noires) — mais chaque étage
   apparaît EN MÊME TEMPS que l'étape de la cascade qui lui correspond.
3. **La phrase-pont**, affichée une fois entre les deux zones, dès la première
   étape (texte fixe, commun aux trois cours) :
   « Dans le jeu, ta part est un rayon plus FIN. Sur la bande, c'est un morceau
   plus COURT. Même partage, même fraction. »
   On ne cache pas la différence d'axe : on la NOMME — c'est elle qui vaccine.

Déroulé exact de C3 « Le quart » (les autres cours suivent le même patron) :

- Étape 1 — texte « La moitié d'un rayon, c'est un demi-rayon » + 1 ÷ 2 = 1/2 :
  la cascade montre le rayon 1 qui ENTRE dans un prisme ÷2 et les DEUX demi-rayons
  qui en sortent ; le mur montre la bande 1 et l'étage des demis. Plus jamais de
  rayon entier seul à l'écran : dès la première image, on voit le partage.
- Étape 2 — « La moitié d'un demi-rayon, c'est un quart de rayon » + 1/2 ÷ 2 = 1/4 :
  chaque demi-rayon entre dans son prisme, les QUATRE quarts de rayon apparaissent ;
  l'étage des quarts s'ajoute au mur.
- Étape 3 — « les quatre quarts refont le rayon entier » + la somme : rien de
  nouveau ne s'ajoute, tout est là — la phrase se VÉRIFIE en lisant le mur.

C1 (divs [2]) : une seule étape de cascade + l'étage des demis. C2 (divs [3]) :
prisme ÷3, trois branches, étage des tiers. Pour C3, le test de comptage des
QUATRE rayons terminaux (règle R2 d'origine) redevient actif.

Aucun morphing, aucun fondu : les deux zones restent visibles ensemble jusqu'au
bout — c'est la lecture croisée, phrase par phrase, qui fait le cours.

## Les deux arbitrages liés (tranchés)

- **Couleurs des bandes : celles du jeu, confirmé** (entier doré, demis orangés,
  tiers bleus, quarts roses). Dans une mise en correspondance, la couleur est le
  fil qui relie les deux zones : le rayon rose fin se retrouve dans les cases
  roses. Les deux registres restent distincts par leur MATIÈRE (rayon lumineux et
  arrondi / bande plate et cernée de noir), la couleur peut donc lier sans
  confondre. Les bandes jaune/vert de Gwenael restent la référence des gabarits
  maths&go HORS Solèy.
- **Bandes collées : confirmé** (vérifié dans le code : pas d'interstice, les
  traits sombres sont des bordures, pas des espaces). Le mur ne fonctionne que
  collé : c'est l'alignement vertical des frontières (la coupure des quarts sous
  celle des demis) qui porte les comparaisons — et bientôt les équivalences.

## Travail demandé à la session Code

1. Remplacer le bloc `cpont` (rayon couché + fondu) par la zone haute en rayons
   (réutiliser sSun/sBeam/sLbl + les épaisseurs réelles ; hauteur de scène
   ajustée) ; ajouter la phrase-pont entre les zones (style discret, une ligne,
   R5 : la fraction n'y apparaît pas, pas d'écriture à étager).
2. Ne rien changer d'autre : mur, textes v7, prédire, carte, mention Refraction.
3. Tests : réactiver le comptage des rayons terminaux de la scène C3 (quatre
   rayons 1/4 visibles) en PLUS du comptage des cases du mur ; vérifier la
   présence de la phrase-pont dans les trois cours ; batterie complète + node.
4. Consigner cette v8 dans l'addendum de la spec au dépôt + SOLEY.md journal.
5. PR mise à jour SANS fusion — captures des trois cours pour le verdict
   téléphone de Gwenael, validation Cowork avant Merge, comme d'habitude.
