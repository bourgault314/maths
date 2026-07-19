# État du chantier Automatismes V2

**Dernière mise à jour : 19 juillet 2026.**

## Référence vérifiée

- Dépôt : `bourgault314/maths`.
- Branche de référence : `main`.
- Commit de référence vérifié sur GitHub :
  `15b72f0b517814c818bb56bd5c62de29d75d286c`.
- La PR #170 est fusionnée : la carte DNB, la fiche validée de `NC-01`, les
  storyboards et les décisions D-014 à D-019 sont la mémoire officielle du
  chantier.
- La PR #162 est fusionnée. Elle constitue le socle technique actuel :
  contrats génériques, PRNG seedé, registre, objets indépendants, charte et
  garde-fous du périmètre V2.
- Le lot de la PR #162 réussit **705 tests sur 705** et `npm run verifier`.
- La PR #156 sur les puissances simples reste un brouillon séparé. Elle n'est
  pas le chantier actif et ne doit pas être fusionnée telle quelle. Les
  micro-notions du DNB qui mobilisent des puissances restent bien dans la carte
  et seront traitées à leur rang.
- La PR #145 reste ouverte mais ne doit pas être fusionnée telle quelle.

## État fonctionnel

- La bêta continue de fonctionner séparément et reste gelée hors correction
  critique.
- Aucun générateur pédagogique V2 n'est encore présent dans `main`.
- La carte du DNB est établie : **37 cibles officielles distinctes**,
  **38 cibles normalisées** et **88 micro-notions**.
- Une seule micro-notion est active : `NC-01`, critères de divisibilité par
  2, 3, 5, 9 et 10.
- Le critère par 10 est un complément maths&go validé. Il reste proposé dans le
  parcours DNB, tout en étant distingué des quatre critères officiels dans les
  données.
- La fiche `NC-01`, le mini-cours, les six familles de questions, les aides,
  les corrections, les storyboards et la séparation séance/question/trace ont
  été validés par Gwenaël le 19 juillet 2026.
- Le parcours DNB actuel ne possède ni niveaux ni paliers.

## Documents de référence fusionnés

- `carte-dnb-2026-mathsgo.md` — liste officielle, taxonomie maths&go, matrice
  de couverture et ordre des 88 micro-notions ;
- `fiche-nc-01-criteres-divisibilite.md` — contenu pédagogique validé ;
- `contenu-nc-01-cours-et-f2.md` — mini-cours et sept spécimens de référence ;
- `storyboard-parcours-commun.md` — lancement, séance, progression et bilan ;
- `storyboard-nc-01-f2.md` — carte interactive et projection ;
- `specification-papier-seance-question-reponse.md` — responsabilités des
  données avant les contrats techniques.

Ces documents autorisent la fabrication de la première tranche verticale. Ils
ne publient encore aucune question devant les élèves.

## Lot technique courant : contrats minimaux de NC-01/F2

Le premier sous-lot technique est construit et testé :

- `mathsgo.question-instance/2` ajoute uniquement les blocs texte/entier, le
  classement maths&go, la sélection multiple par ensemble exact et les deux
  outils d'aide nécessaires à `NC-01/F2` ;
- `mathsgo.seance/1` sépare la sélection et l'avancement de la séance ;
- `mathsgo.trace-reponse/1` conserve la première validation interactive sans
  identité, durée ni serveur ;
- la version 1 du contrat de question reste intacte ;
- les propriétés non prévues, les coordonnées d'écran et le code exécutable
  sont refusés ;
- les sept garde-fous du dépôt passent et le lot complet réussit
  **727 tests sur 727**.

Le clavier numérique, les fractions, le lecteur, le serveur, l'identité de
l'élève et le chronomètre ne sont pas construits par anticipation.

## Prochaine étape après fusion de ce lot

Écrire à neuf le générateur seedé de `NC-01/F2`, l'enregistrer dans le moteur
et tester ses invariants mathématiques, sa variété et son déterminisme. Le
lecteur interactif et projection viendra dans le sous-lot suivant.

## Règle de mise à jour

À chaque fin de tâche, remplacer le chantier actif et la prochaine étape par
l'état réel. Ne jamais conserver ici une action déjà terminée comme si elle
était encore à faire.
