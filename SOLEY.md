# SOLEY.md — Bible du projet Solèy

> Jeu de fractions à rayons de soleil, thème Réunion, pour maths&go (mathsgo.re).
> Ce fichier est la mémoire du projet : toute session (Claude Code, Cowork, autre)
> doit le lire AVANT de toucher au code, et le mettre à jour APRÈS chaque évolution validée.

## 1. Règle d'or

**La source de vérité est ce dépôt.** La version en ligne = ce qui est sur `main`.
Plus jamais de fichier qui circule par chat/GPT/mail : toute modification passe par le dépôt,
sinon les versions divergent (c'est déjà arrivé une fois).

Règles maths&go qui s'appliquent (voir AGENTS.md) : ne jamais publier sans accord explicite
de Gwenael ; lire le dépôt et l'historique récent avant de modifier ; ne modifier que le
nécessaire ; tester mobile ET ordinateur ; compte rendu : problème → cause → solution →
fichiers modifiés → tests → reste à vérifier.

## 2. Le jeu en bref

- Un ou plusieurs soleils émettent des rayons (valeur 1, 2, ou une fraction : 1/2, 1/3…).
- Pièces posables : Miroir (déviation), Prisme ÷2 / ÷3 (partage égal), Lentille + (addition
  de deux rayons), Loupe ×2 / ×3 (multiplication).
- Cases créoles (cibles) : exigent une fraction EXACTE, un seul rayon par case.
- Épaisseur du rayon proportionnelle à sa valeur ; couleur selon le dénominateur réduit
  (demis orangés, tiers bleus, quarts roses, sixièmes verts, huitièmes lilas, neuvièmes cyan, douzièmes pervenche).
- Le rayon reste continu à travers les pièces (même épaisseur/couleur, virages courbes).
- Obstacles : roches (bloquent), passes étroites `≤ f` (ne laissent passer que les rayons
  assez fins — comparaison visuelle), pièces scellées (pré-posées, indéplaçables, rivets dorés).
- Fruits péi (letchis, mangues, ananas) à ramasser en les traversant. Décoratifs pour l'instant.
- Un rayon peut se perdre (pas d'obligation de tout utiliser), sauf niveaux « rien ne se perd ».
- Victoire : cinématique (rayon qui avance segment par segment, confettis, « Lévé ! »).
- Aide à deux étages : bouton Indice → panneau « Coup de pouce » avec la scène en rayons
  (prisme qui sépare réellement en 2/3 branches, lentille qui cumule, référence « rayon entier = 1 »)
  + le calcul typographié en fractions empilées (avec mise au même dénominateur).
- Sauvegarde locale par clé stable `monde:nom-du-niveau` (survit aux ajouts de niveaux).
  Repli silencieux en mémoire si localStorage indisponible.
- Plein écran : bouton ⛶ (API fullscreen quand dispo ; sinon mode focus + astuce
  « Ajouter à l'écran d'accueil » sur iOS). Installable (manifest inline + icônes data-URI).
- Paysage : plateau pleine hauteur à gauche, barre/consigne/outils dans colonne droite.

## 3. Les mondes (état à la v6.1 côté Claude — vérifier ce qui est déployé)

| Monde | Palier | Contenu | Niveaux |
|---|---|---|---|
| Le lagon | 6e | découverte, partage égal | 8 |
| La forêt | 5e | additions (lentille), équiv., 1/8, 1/12 | 10 (dont « Le prisme scellé ») |
| Le volcan | 4e | loupes ×, fractions > 1, 1/9 | 7 |
| Les pitons | 5e-4e | équivalences, comparaisons (passes) | 7 |
| Les soleils | 4e | soleils multiples / fractionnaires / valeur 2 | 8 |
| Le marché | 5e-3e | 0,5 ; 25 % ; 100 % (écritures) | 6 |
| Les tunnels | 6e-4e | labyrinthes denses (41-64 % de roches), esprit de l'original | 7 (dont « La galerie scellée ») |
| Mafate | Expert | tout combiné, 2 soleils, grands plateaux | 7 (dont « Les verrous du cirque ») |

Total : 60 niveaux, chacun avec une solution de référence `sol` vérifiée automatiquement.

## 4. Format d'un niveau (données)

```js
{ w:'foret',                 // id du monde
  name:"Trois quarts",       // clé de sauvegarde (NE PAS renommer sans migration)
  sub:"…",                   // consigne SANS donner la solution (question, pas recette)
  hint:"…",                  // texte du Coup de pouce (facultatif)
  cols:9, rows:7,
  suns:[{x,y,dir,val:[n,d]?}],        // dir: 0=haut 1=droite 2=bas 3=gauche ; val par défaut [1,1]
  targets:[{x,y,need:[n,d],disp:"0,75"?}], // disp = écriture affichée (décimal, %, 2/4…)
  rocks:[[x,y],…], fruits:[[x,y],…],
  gates:[{x,y,max:[n,d]}]?,           // passes étroites
  fixed:[[def,x,y],…]?,               // pièces scellées
  tools:[b(in,out), s2(in,o1,o2), s3(in,o1,o2,o3), mg(in1,in2,out), x2(in,out), x3(in,out)],
  sol:[[toolIndex,x,y],…] }           // solution de référence — OBLIGATOIRE
```
Calculs du Coup de pouce : table `CALC` par nom de niveau, lignes du type
`"1/2 + 1/4 = 2/4 + 1/4 = 3/4"` (rendues en scène de rayons + fractions empilées).

## 5. Qualité : la procédure de test est OBLIGATOIRE avant tout push

API de test exposée : `window.SOLEY = {openLevel, simulate, state, LV, solve(i)}`.
Batterie (script Playwright Python, à conserver dans `tests/`) :
1. Cohérence des données de chaque niveau (bornes, chevauchements, outils valides).
2. `solve(i)` gagne pour TOUS les niveaux (solutions de référence).
3. Tous les fruits sont ramassables par la solution de référence.
4. Test négatif : une passe bloque un rayon trop épais.
5. Écrans réellement masqués (`getComputedStyle(#play).display === 'none'` sur l'accueil —
   attention au piège de spécificité #id vs .classe, déjà corrigé une fois).
6. Paysage : zéro défilement de page, clic précis (letterbox pris en compte).
7. Zéro erreur JavaScript.

## 6. Historique des décisions (ne pas re-débattre sans raison)

- Nom « Solèy » validé. Pièce « Lentille + » validée (PAS « Recolleur »).
- Textes des niveaux = questions, jamais la solution ; l'équation vit dans le Coup de pouce.
- Un seul rayon par case (la lentille sert à additionner, pas la case).
- Couleur par dénominateur RÉDUIT (3/6 s'affiche orange comme 1/2 : c'est voulu, ça montre l'égalité).
- Pas de panneau solaire sur les maisons (jugé moche) ; maisons créoles à lambrequins.
- Fruits = vraiment péi et reconnaissables.
- Inspiration : Refraction (Center for Game Science, UW, 2010). Mécaniques et pédagogie
  librement reprises (non protégées) ; nom, graphismes, code, niveaux = originaux.
  Original rejouable : flashmuseum.net/game/refraction-5nm (émulation, parfois capricieuse)
  ou app de bureau Flashpoint Archive ; vidéos walkthrough sur YouTube pour captures.

## 7. Chantier en cours : passage au « vrai jeu »

Découpage proposé (statique, sans build, compatible GitHub Pages) :
```
soley/
  index.html      (coquille + écrans)
  css/soley.css
  js/engine.js    (fractions, simulation, victoire)
  js/levels.js    (MONDES, NIVEAUX, CALC — données pures)
  js/render.js    (SVG : plateau, pièces, fruits, scènes du Coup de pouce)
  js/ui.js        (écrans, toolbox, plein écran, sauvegarde)
  assets/         (icônes, sons à venir)
tests/soley/      (scripts Playwright + ce fichier de procédure)
```
Étape 1 du découpage : à comportement STRICTEMENT identique (les tests le prouvent).

## 8. Feuille de route (idées validées ou proposées, à prioriser avec Gwenael)

- [ ] Écran de démarrage / splash (image d'accueil du jeu).
- [ ] Revoir l'entrée en matière : aides/tutoriel d'abord, puis jouer — on guide peut-être
      trop pendant les niveaux (idée Gwenael à creuser).
- [ ] Musique et sons (discrets, désactivables — WebAudio ou petits fichiers).
- [ ] Fruits péi = monnaie : débloquer des niveaux bonus / défis (comme les pièces de l'original).
- [ ] Animaux péi à sauver dans les cases (paille-en-queue, tortue, tangue…) — flavor de l'original.
- [ ] Succès / badges. Étoiles de maîtrise (réussir avec un minimum de pièces).
- [ ] Amélioration continue des niveaux et de la difficulté (retours élèves).
- [ ] Éditeur de niveaux pour le professeur.
- [ ] Fiche pédagogique par monde (dossier concours).
- [ ] S'inspirer de l'original par captures d'écran (Gwenael capture → Claude lit les images).

## 9. Journal

- 2026-08-11 : sessions Cowork — v1 (12 niveaux) → v6.1 (60 niveaux, 8 mondes, passes,
  soleils multiples, tunnels, pièces scellées, Coup de pouce, plein écran, PWA).
  Mise en ligne initiale via ChatGPT (+ retouches graphiques/mobile côté GPT — à inventorier).
- 2026-08-13 : état des lieux (session Code). Le jeu vit dans `outils/club_maths/soley.html`
  (https://mathsgo.re/outils/club_maths/soley.html) ; en ligne = main à l'octet près.
  Mise en ligne en 6 PR (#337→#343 du 11/08) : 51 puis 60 niveaux ; les 60 `sol` intacts,
  aucun niveau retiré ni renommé ; 2 consignes reformulées (« Premier rayon », « Zigzag
  dans les roches »). Écarts avec ce fichier : « Le prisme scellé » vit dans Les tunnels
  (forêt = 9 niveaux, tunnels = 8, le tableau §3 dit 10/7) ; pas de manifest PWA inline
  (méta iOS seulement) ; plein écran sans « mode focus » (aide honnête par navigateur,
  bouton masqué quand inutile) ; cinématique de victoire réécrite en propagation
  topologique (chaque tronçon attend ses parents) ; logo dédié mathsgo-logo-soley.png ;
  un test node tests/soley-public.test.mjs (11 tests) était déjà en place. Batterie §5
  créée dans tests/soley/ (Playwright Python) et exécutée sur la version déployée ET la
  copie locale : TOUT VERT (T1→T7 + sauvegarde). Découpage §7 : plan proposé, en attente
  de validation.
- (à compléter à chaque session)
