# État du chantier Automatismes V2

**Dernière mise à jour : 19 juillet 2026.**

## Référence vérifiée

- Dépôt : `bourgault314/maths`.
- Branche de référence : `main`.
- Commit de référence vérifié sur GitHub :
  `5ce53788a373c658ed110df684d1c0bed10f3c87`.
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

## Documents de référence ajoutés par le chantier courant

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

## Chantier actif : première tranche NC-01/F2

L'ordre technique est désormais :

1. versionner les contrats minimaux de question à sélection multiple, de séance
   et de trace de réponse ;
2. tester ces contrats sans navigateur ;
3. écrire à neuf le générateur seedé de `NC-01/F2` et ses tests mathématiques ;
4. construire le lecteur minimal en mode interactif et en mode projection ;
5. contrôler réellement le téléphone à 375 px, la tablette et la projection ;
6. présenter les exemples, l'aide et la correction à Gwenaël ;
7. obtenir sa validation finale avant toute exposition aux élèves.

Le premier contrat ne couvre que le besoin réel de `F2`. Le clavier numérique,
les fractions, le serveur, l'identité de l'élève et le chronomètre ne sont pas
construits par anticipation.

## Règle de mise à jour

À chaque fin de tâche, remplacer le chantier actif et la prochaine étape par
l'état réel. Ne jamais conserver ici une action déjà terminée comme si elle
était encore à faire.
