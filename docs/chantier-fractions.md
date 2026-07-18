# Chantier fractions — document de travail

Première catégorie reconstruite pour le générateur V2. Ce document est le relevé de
l'existant et la liste des notions à trancher avec Gwenaël. Il sera coché au fur et à mesure.

Modules concernés : `dnb_01`, `dnb_03`, `dnb_03b`, `dnb_04`, `dnb_05`.

---

## 1. À savoir avant de toucher au code

**Deux modules ont leur fichier de questions mort.** Le moteur les remplace au chargement :

- `dnb_01` — `04-app.js:319` substitue `MODULE01_TEMPLATES` (`02-question-engine.js:528-549`,
  20 questions) à la liste du fichier. Les 16 questions de `modules/numbers/dnb_01.js` et ses
  2 `formula_code` ne s'exécutent jamais.
- `dnb_03` — `makeFractionOpsInstance` (`02-question-engine.js:704`) n'appelle jamais `runCode`.
  Les 7 `formula_code` du fichier sont morts ; les valeurs viennent de listes codées dans le
  moteur (`:709-779`), et les énoncés d'un dictionnaire `prompts` (`:3470-3479`).

**Conséquence : reconstruire à partir des fichiers de modules serait reconstruire ce que
personne ne voit.** La source réelle est le moteur.

Deux scories relevées au passage :

- le classement pédagogique de `dnb_01` (`shared/pedagogy/numbers/dnb_01.js:39-43`) mappe des
  types sur les questions 1 à 16, alors qu'il y en a 20, réparties autrement. Ce mapping est faux.
- les palettes par dénominateur divergent entre `fraction-operations.js:14` et
  `fraction-wall.js:3-5`. À unifier.

## 2. Un vrai doublon

`dnb_01` (fraction ↔ décimal) et `dnb_05` (écritures équivalentes d'un nombre) traitent la même
compétence. Les questions 1, 2, 5 et 9 de `dnb_05` refont le travail de `dnb_01`.

**Décision à prendre par Gwenaël :** fusionner les deux, ou séparer nettement les rôles
(par exemple `dnb_01` = conversions, `dnb_05` = reconnaître qu'un même nombre a plusieurs
écritures, y compris le pourcentage).

## 3. Ce qui est déjà de Gwenaël — à conserver

**Les distracteurs de `dnb_01`** (`02-question-engine.js:577-613`) sont une construction
pédagogique, pas un tirage. Dans l'ordre proposé :

1. lire les deux nombres à la suite — 3/4 devient « 3,4 » ;
2. diviser le dénominateur par 10 ; 3. le numérateur par 100 ; …
7. pour une fraction supérieure à 1, ne garder que la partie décimale ;
8. inverser numérateur et dénominateur.

Avec un garde-fou explicite : **aucune mauvaise réponse ne peut être une autre écriture du bon
nombre** (fonction `equivalent()`, `:594`). C'est à garder tel quel.

**Les visuels** (`auto/scripts/shared/visuals/arithmetic/`) : `fraction-decimal-grid` (9
préréglages), `fraction-operations` (10), `fraction-percent-bar` (7), `fraction-wall` (6).
Tous de Gwenaël. Le mur de fractions descend directement de son `outils/fractions/mur_fractions.html`.

**Les contextes des pourcentages** (`02-question-engine.js:1941-1947`) : collège, bibliothèque,
club sportif, verger, collection.

## 4. Son vocabulaire, relevé dans ses outils

À employer dans les énoncés neufs :

- les noms **en lettres** : « un demi », « le tiers », « les trois quarts » — ses outils offrent
  le choix « en lettres / en chiffres » ;
- **« le tout »** et **« la part »** plutôt que numérateur et dénominateur dans les énoncés ;
- **« fraction d'une fraction »** pour le produit — jamais « produit de fractions » ;
- le lexique de la manipulation : séparer, couper, fusionner, retourner ;
- des énoncés **à la première personne** et contextualisés : « J'avais 12 bonbons. J'en ai mangé
  le quart. Combien m'en reste-t-il ? »

## 5. Ce que ses outils couvrent et que l'application ignore

Relevé dans `outils/fractions_multiples_exerciseur.html`. Ces notions existent déjà en matériel,
elles n'ont simplement jamais été portées dans Automatismes :

- **trouver le tout** connaissant une part (« 1/4 = 15, le tout = ? ») — pilier de son exerciseur ;
- **trouver la fraction** connaissant la part et le tout ;
- les **multiples** : double, triple, quadruple, quintuple, décuple ;
- **reste, augmentation, diminution** fractionnaires.

## 6. Ce qui manque partout

Aucune trace ni dans l'application ni dans les outils :

- placer une fraction sur une **demi-droite graduée** ;
- **encadrer** une fraction entre deux entiers ;
- **comparer à 1 et à 1/2** comme repères ;
- **comparer deux fractions quelconques** — l'application ne traite que même dénominateur et
  même numérateur ;
- **additionner avec des dénominateurs non multiples** (vrai PPCM) — `add_multiple_den` impose
  que l'un soit multiple de l'autre.

## 7. Les notions atomiques — liste à trancher

Proposition, à réordonner par Gwenaël. « ✓ » = déjà traité par l'application.

**Palier 1 — Sens**
1. Lire une fraction sur un partage · 2. Écrire une fraction à partir d'un partage ·
3. Nommer une fraction en lettres · 4. Reconnaître que les parts doivent être égales ·
5. La fraction-unité `1/n` · 6. Compter les fractions-unités ✓

**Palier 2 — Repérage et ordre**
7. Comparer à 1 · 8. Encadrer entre deux entiers · 9. Placer sur une demi-droite graduée ·
10. Comparer, même dénominateur ✓ · 11. Comparer, même numérateur ✓ · 12. Comparer à 1/2

**Palier 3 — Équivalence**
13. Reconnaître deux fractions équivalentes ✓ · 14. Produire une fraction équivalente ·
15. Simplifier par un facteur visible ✓ · 16. Rendre irréductible ✓ · 17. Mettre sur 100 ✓

**Palier 4 — Écritures d'un même nombre**
18. Fraction décimale → décimal ✓ · 19. Décimal → fraction décimale ✓ ·
20. Décimal → fraction irréductible ✓ · 21. Fraction quelconque → décimal ✓ ·
22. Fraction ↔ pourcentage ✓ · 23. Décimal ↔ pourcentage ✓ ·
24. Reconnaître toutes les écritures d'un même nombre ✓

**Palier 5 — La fraction comme opérateur**
25. Fraction unitaire d'une quantité ✓ · 26. Fraction composée d'une quantité ✓ ·
27. Pourcentages repères ✓ · 28. Pourcentage repère en contexte ✓ ·
29. Trouver le tout · 30. Trouver la fraction · 31. Reste, augmentation, diminution

**Palier 6 — Addition et soustraction**
32. Même dénominateur ✓ · 33. Soustraire, même dénominateur ✓ ·
34. Un dénominateur multiple de l'autre ✓ · 35. Dénominateurs quelconques ·
36. Un entier plus une fraction

**Palier 7 — Multiplication et division**
37. Multiplier par un entier · 38. Fraction d'une fraction ✓ · 39. Multiplier deux fractions ✓ ·
40. Simplifier avant de multiplier ✓ · 41. L'inverse d'une fraction · 42. Diviser par une
fraction ✓ · 43. Diviser entier et fraction ✓

**Palier 8 — Consolidation**
44. Enchaîner plusieurs opérations · 45. Priorités opératoires · 46. Fractions négatives ·
47. Problèmes à étapes

## 8. Ce qu'il reste à obtenir de Gwenaël

Rien ne peut être écrit avant ces trois réponses. Elles ne se déduisent d'aucun code.

1. **L'ordre** dans lequel il enseigne ces notions, et lesquelles il garde.
2. **La représentation** de chacune : bandes, disques, mur, droite graduée, grille d'aire.
3. **Les erreurs d'élèves** qu'il observe réellement — la matière des distracteurs.

Et une décision : que faire du doublon `dnb_01` / `dnb_05` (§2).
