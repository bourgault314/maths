# Charte et contrôle visuel

Ce document est le point de départ de la future identité graphique maths&go.
Il ne constitue pas encore la charte définitive.

## Identité

- nom écrit `maths&go` ;
- logo officiel recadré, décliné sur fond blanc et transparent ;
- clic sur le logo : retour à l'index adapté au contexte ;
- bleu profond, turquoise et orange comme couleurs principales ;
- interfaces claires, compactes et sans texte technique inutile ;
- titres courts et vocabulaire scolaire français.

## Conventions mathématiques déjà connues

- fractions empilées avec barre horizontale et lecture en français si nécessaire ;
- unité et tout explicitement repérés ;
- Splat conforme à sa forme d'origine et total placé dans son cadre ;
- schémas en barres aux parties jointives et proportionnelles quand le sens le demande ;
- côtés égaux codés par des traits cohérents ;
- angles droits codés par un carré ;
- angles nommés avec un chapeau ;
- segments et demi-droites dessinés conformément à leur nature, sans point décoratif ;
- ordre des lettres fourni par l'utilisateur toujours respecté ;
- jetons relatifs rouges/verts, bord noir, texte noir `+1` ou `−1` ;
- variable `x` arrondie et manuscrite, mais non enfantine ; le modèle canonique est
  le SVG `roundedXGlyph()` de `outils/tuiles_algebriques/generateur_tuiles.html` :
  deux courbes horizontales qui se rejoignent au centre. Ne jamais le remplacer
  par la lettre typographique `X`, ni par deux diagonales croisées ;
- unités présentes dans les résultats finaux.

## Modes d'affichage à prévoir

- téléphone portrait ;
- tablette ;
- ordinateur ;
- projection en classe ;
- plein écran ;
- impression A4 et A5 ;
- noir et blanc ou contour seul lorsque le composant le permet.

Sur téléphone, le plein écran n’est pas proposé pour les outils pédagogiques :
il est réservé à l’ordinateur et à la projection.

## Règle de sobriété des outils et des énoncés

Les outils et les énoncés imprimables restent centrés sur l’activité mathématique :

- pas de petit bouton ou lien de retour vers le site dans l’outil ou l’énoncé ;
- pas d’adresse web affichée sur l’énoncé imprimable ;
- pas de marquage parasite ou d’ancien habillage résiduel ;
- menus et boutons modernisés dans le langage visuel maths&go, sans modifier le
  contenu mathématique validé.

Cette règle s’applique à chaque ancienne page reprise, notamment aux deux outils
de Pythagore.

Pour les activités interactives, une étape qui change de texte ne doit pas
déplacer le plateau ou le schéma principal. Les consignes disposent d’une zone
réservée ; une sélection effectuée par l’élève est désélectionnée après l’action
et aucun emplacement suivant n’est choisi automatiquement.

Sur téléphone, on conserve seulement les commandes nécessaires à l’action en
cours. Le puzzle ou le schéma occupe la place principale ; les réglages
secondaires restent accessibles sur ordinateur.

## Références visuelles

Chaque composant validé doit fournir :

- au moins un exemple simple ;
- un exemple avec valeurs longues ou cas limite ;
- une capture téléphone ;
- une capture ordinateur ou projection ;
- une capture ou un PDF d'impression si le mode existe ;
- une description textuelle accessible ;
- la liste des détails pédagogiques à ne pas altérer.

Les captures validées deviennent les références de comparaison, appelées
`golden snapshots` dans les tests.

## Contrôle visuel automatisé

La future chaîne de vérification devra contrôler :

1. absence de débordement horizontal ;
2. texte et réponses non rognés ;
3. zones tactiles d'au moins 44 × 44 px ;
4. contraste lisible ;
5. stabilité avant et après affichage de la correction ;
6. cohérence des traits, symboles et couleurs ;
7. absence de page blanche supplémentaire à l'impression ;
8. comparaison des captures avec les références validées.

## Tailles de contrôle initiales

- téléphone étroit : 360 × 800 ;
- téléphone courant : 390 × 844 ;
- tablette : 768 × 1024 ;
- ordinateur : 1440 × 900 ;
- impression : A4 et A5, portrait et paysage selon le gabarit.

## Processus de validation

```text
draft → contrôle automatique → review enseignant → validated
```

Une retouche purement graphique augmente la version du rendu si nécessaire,
mais ne change pas l'identité pédagogique de la question. Une modification du
sens, de la correction ou des paramètres autorisés augmente la version du
gabarit pédagogique.
