# Audit idée par idée — où atterrit chacune des 33 idées (14/08/2026)

Compagnon du DIAGNOSTIC-REFONTE-NIVEAUX.md. Pour chaque idée de la bibliothèque
(1-20 au dépôt, 21-33 encore dans le carnet — dette de sync), sa destination.
Correction au passage : la règle d'or « fruit hors du chemin gagnant » est
l'idée 11 (le diagnostic disait « 43 » par erreur, corrigé).

Cinq destinations :
- **REFONTE** = principes transverses appliqués aux niveaux existants + nouveaux
- **INTERCALÉ** = le nouveau monde entre lagon et forêt (partage joué à fond)
- **MOTEUR** = petite retouche moteur/UI, indépendante des niveaux
- **PLUS TARD** = chantier déjà identifié (carnet péi, aide graduée, habiller)
- **FAIT / CLASSÉ** = déjà en place, ou écarté par décision de Gwenael

## Le cœur de la refonte (les niveaux changent)

**1. Surplus systématique** → REFONTE. Devient le principe P1 : la boîte exacte
n'est légitime que sur les niveaux-découverte. Chaque niveau d'entraînement
retouché reçoit 1-3 pièces en trop (orientations et valeurs à choisir).

**18. Le piège mathématique dans la boîte** → REFONTE. Le complément de l'idée 1 :
le surplus n'est pas que spatial, on fournit un ÷3 quand il faut des demis.
À doser : 1 piège numérique par niveau au plus, jamais sur les découvertes.

**11. Règle d'or : le fruit hors du chemin gagnant** → REFONTE. Principe P2.
Chaque niveau d'entraînement retouché : gagner reste simple, AU MOINS un fruit
exige un plan différent. Nouveau contrôle de batterie : « le niveau est gagnable
sans ramasser tous les fruits » (l'inverse d'aujourd'hui, où 135/135 sont gratuits).

**32. La difficulté vit dans la couche ☀☀/☀☀☀** → REFONTE. Principe P3. C'est la
précision de Gwenael sur 3:5 : le niveau du milieu de monde se gagnait facilement,
c'est TOUT RAMASSER qui flambait. Avec 11 + 1, la couche ☀☀/☀☀☀ a enfin une prise.

**29. Chaque fraction composée a son intro simple, par conception** → REFONTE.
Principe de rythme (P4) : même en plein monde dur, une notion nouvelle arrive
par un niveau doux. On le fait déjà avec les découvertes du lagon — à généraliser
à TOUTES les arrivées de notion (1/6, 1/8, 1/12…).

**4. Varier la direction des soleils** → REFONTE, retouche facile. Nos soleils
tirent presque tous vers la droite ; on varie dès le lagon (lecture spatiale).

**10. Densité de roches tôt, en doux** → REFONTE. Les couloirs arrivent dès le
monde 1 chez eux, sans labyrinthe. Retouche des niveaux 1-2 du lagon possible.

**19. Grammaire des roches** (couloirs sculptés / tour de plateau forcé /
collectible sur la branche coûteuse) → REFONTE. C'est la boîte à outils du
concepteur de niveaux — à graver comme « répertoire spatial » dans la spec.

**31. Le titre-forme** (la solution dessine un E) → REFONTE, sel de conception :
quelques titres-indices ou titres-formes par monde (on a déjà « Quarts en croix »).

## Le monde intercalé (partage joué à fond, avant la somme)

**12. Collectibles à valeur** (letchi ½, goyavier ⅓…) → INTERCALÉ. LA mécanique
neuve du monde : la collection devient un exercice de fabrication de fractions.
Parfaitement dans le thème « partage » ; s'introduit par une découverte douce.

**21. La part perdue devient le trésor** → INTERCALÉ. Le surplus du ÷3 (quand la
cible ne veut que 2 tiers) route vers le fruit : rien ne se perd. Niveau type.

**22. Deux routes vers 1/6** (1/2÷3 vs 1/3÷2) → INTERCALÉ, fin de monde. La
double architecture + les deux écritures côte à côte : le sommet du partage
composé, juste avant d'ouvrir la forêt.

**24. La croisée des rayons** → INTERCALÉ. Gratuit dans notre moteur (un seul
rayon par case, mais les croisements passent) ; niveau type « La croisée ».

**25. Tour de plateau + coupe tardive** → INTERCALÉ ou défi de fin de monde.
Long, spectaculaire, planification pure — notion constante.

**30. Le grand gaspillage assumé** (« le grand tri ») → INTERCALÉ. On jette la
moitié du soleil d'entrée : viser les bonnes fractions, pas tout utiliser.
Anti-réflexe « pose tout » — n'a de sens QUE si le surplus (idée 1) existe.

**33. Chambre close et cadre-éteignoir** → INTERCALÉ (les plus durs) et défis.
Obstacles en cadre : routage intérieur, les sorties perdues meurent proprement.

**3. Une histoire dès l'écran 1** → INTERCALÉ pour son texte d'entrée (chaque
monde gagne une phrase de but narratif), version complète au chantier carnet.
Le décor du monde intercalé = l'occasion de régler la remarque « pas de maisons
dans un lagon » (bord de mer ? à décider avec le thème).

## Retouches d'autres mondes existants

**23. L'affectation des sources comme puzzle** → monde des soleils (il existe
déjà) : ses niveaux se retouchent avec ce principe (quel soleil sert quelle
maison — c'est LE puzzle, pas un détail).

**26. Sources en bord de cadre et fractionnaires** → monde des soleils, pareil.

**27. Le rayon sacrifié** → défis. La collecte n'exige que la traversée au
moment de la victoire — le rayon peut mourir juste après. Piège psychologique
du chemin « sans avenir ». Notre moteur a la même règle : exploitable tel quel.

## Moteur / UI (indépendant des niveaux)

**7. Étincelle d'impact** → MOTEUR. On voit OÙ le rayon bute. Petit ajout de
render.js, utile partout dès que les niveaux font chercher.

**16. La loupe d'inspection** → MOTEUR. Toucher un rayon → sa fraction en grand.
Répond AUSSI à la question ouverte des fractions à ~6 px sur les maisons
(l'inspection remplace l'agrandissement permanent). Priorité haute.

**6. Règles illustrées** (la vignette de l'objet dans la bulle) → MOTEUR/cours,
à intégrer aux prochains textes de découverte et au cours de la lentille.

**8. Le facultatif annoncé comme tel** → quasi FAIT (« les fruits péi sont des
bonus facultatifs », niveau 2 du lagon) ; à reformuler quand les fruits
deviendront exigeants (idée 11) : « facultatif mais malin ».

**5 + 20. Boîte à outils lisible** (grille, familles par couleur de flèche) →
MOTEUR, chantier Habiller. Les flèches retouchées du 14/08 ont déjà payé une
partie ; le code couleur par famille reste à juger.

## Plus tard (chantiers déjà identifiés)

**9. Le carnet montre ce qui manque** → carnet péi (chantier 3), déjà gravé
comme moteur du rejeu (pages vides + « se trouve au niveau X »).

**28. L'aide qui relance** → aide graduée (lot 2), déjà gravée comme étalon :
un bon Coup de pouce fait dire « j'ai trouvé », pas « j'ai appliqué ».

## Fait / classé

**13, 15, 17** : validations de nos choix (épaisseur+couleur, besoins empilés
sur les cibles) — rien à faire. **14** : rayons nets — FAIT (session 6, miroirs
45°). **2** : tutoriel à flèches — ÉCARTÉ par décision de Gwenael (guidage
dégressif, pas de flèches au lot 1) ; à rouvrir seulement si la classe le réclame.

## Bilan comptable

9 idées structurent la REFONTE des niveaux existants · 8 fondent le MONDE
INTERCALÉ · 3 retouchent des mondes existants ciblés · 5 sont du MOTEUR/UI ·
2 sont déjà routées vers des chantiers à venir · 6 sont faites ou classées.
Aucune idée orpheline : les 33 ont une destination.

## Prochain livrable

La spec du monde intercalé : thème et décor, liste des niveaux (découverte des
collectibles à valeur → entraînements → « le grand tri » → « deux routes vers
1/6 »), boîtes avec surplus, place des fruits, plans gagnants et plans complets.
Puis le plan de retouche du lagon (fruits déplacés, surplus ajouté, directions
variées) avec sa migration de batterie.
