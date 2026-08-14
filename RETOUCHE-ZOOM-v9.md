# RETOUCHE-ZOOM-v9.md — La cascade verticale : le mur est un zoom sur les rayons

> Idée de Gwenael (14/08, après la fusion de la v8 / PR #358), conception validée en
> session Cowork. Amende UNIQUEMENT l'orientation de la zone rayons et la phrase-pont ;
> tout le reste de la v8 (deux registres, synchronisation étape par étape, mur collé,
> textes, prédire, carte) est conservé.

## L'idée

En v8, la cascade est horizontale (soleil à gauche) : la largeur des rayons vit sur
l'axe vertical, la longueur des bandes sur l'axe horizontal — les deux registres se
regardent mais leurs axes se croisent. En v9, la cascade devient VERTICALE :

- soleil en haut, au centre ; le rayon entier DESCEND ;
- prisme(s) ÷n : les branches descendent côte à côte, vraies épaisseurs, vraies
  couleurs, étiquettes étagées ;
- les rayons terminaux arrivent JUSTE AU-DESSUS du mur de bandes, chacun aligné
  sur SA case de la dernière rangée (les quatre 1/4 au-dessus des quatre cases
  roses ; en C1 les deux demis au-dessus des deux cases orangées, etc.).

La largeur des rayons et la longueur des cases sont alors sur le MÊME axe
horizontal : le mur se lit comme un ZOOM sur les rayons — chaque case est la part
de lumière qu'elle reçoit, agrandie. La division d'épaisseur (le jeu) et la
division de longueur (l'école) deviennent le même geste, vu deux fois.

## Détails d'exécution

1. Pivoter la cascade : soleil en haut-centre, flux vertical descendant, prismes
   aux étages ; répartir les branches terminales pour qu'elles tombent chacune
   au-dessus du centre de sa case du mur.
2. Option à juger sur capture : de fins traits pointillés « de zoom » reliant les
   bords de chaque rayon terminal aux bords de sa case (l'agrandissement se voit).
   Si c'est surchargé, les abandonner — l'alignement seul peut suffire.
3. Nouvelle phrase-pont (remplace « rayon plus FIN / morceau plus COURT ») :
   « Le mur, c'est un zoom sur tes rayons : chaque part de lumière devient un
   morceau de la bande. »
4. Synchronisation v8 conservée telle quelle : étape du texte = étape de la
   cascade = étage du mur. Jamais de rayon entier seul à l'écran.
5. Tests : comptage des rayons terminaux conservé (C3 : quatre) + un contrôle
   d'alignement (le centre de chaque rayon terminal tombe dans l'intervalle
   horizontal de sa case).
6. Cahier : consigner la v9 dans l'addendum de la spec + SOLEY.md journal. Si la
   décision « défis sans aucune aide, jamais bloquants » (fermeture définitive du
   14/08) n'est pas encore gravée au cahier, l'embarquer dans la même PR.
7. Circuit habituel : PR sans fusion, captures des trois cours, validation Cowork,
   Merge de Gwenael, batterie sur la production.
