# SPEC — L'ordre des notions (suites de l'audit d'organisation)

Brouillon à valider **point par point**. Tout ce qui est chiffré ici est **relevé sur
`origin/main` à `09c1233`** ou mesuré au solveur-étalon, jamais estimé. Rien n'est
codé avant ton accord.

Cette spec ne couvre que ce que tu as tranché le 16/08. Les questions encore
ouvertes sont rassemblées au §6 et **ne bloquent aucun lot**.

---

## 0. Ce que les suites de l'audit font, en une phrase

Le jeu enseigne le partage au lagon, le fait chercher à la canne, puis le
**réenseigne** à la forêt — pendant que l'équivalence, elle, est exigée à la forêt et
montrée seulement quatorze niveaux plus loin. On remet chaque notion à l'endroit où
elle sert : **une notion s'enseigne une fois, avant qu'on s'en serve.**

---

## 1. Tes décisions du 16/08

| # | décision | statut |
|---|---|---|
| D1 | « Les sixièmes » (4ᵉ niveau de la forêt) est **retiré** | validé |
| D2 | « Les huitièmes » est **gardé** tel quel | validé |
| D3 | Un point de cours **« recouper »** ferme le lagon, en **bandes seules, sans rayons** | validé |
| D4 | Les **pitons passent avant la forêt** (monde 3) | validé (à confirmer — voir §6.0) |
| D5 | Le **champ mixte** se fait, mais **après** les autres lots | validé |
| D6 | Le nom **« Cilaos »** est écarté : collision avec la pièce « Lentille + » | validé |
| D7 | **L'usine sucrière** et **le cyclone** entrent en réserve d'idées | validé |
| D8 | Les **fruits varient à l'intérieur d'un monde** — fini un fruit unique par monde ; chouchou, papaye, banane, combava, vanille rejoignent letchi, mangue, ananas et goyavier | validé |
| D9 | Les noms qui parlent encore de **roches** sont renommés | validé |
| D10 | L'**usine sucrière** sera le monde nourri par **les niveaux que les élèves proposeront** avec l'atelier | validé |

---

## 2. LOT A — Le partage s'enseigne une fois, au lagon

**L'idée du lot, en une phrase :** le lagon dit la règle générale une bonne fois, et
la forêt cesse de refaire ce que deux mondes ont déjà fait.

### 2.1 Le nouveau niveau-découverte, 11ᵉ et dernier du lagon

- **Nom proposé** : « La moitié du quart ». Il fait suite à « La moitié de la moitié »
  (1/4) et « Le tiers de la moitié » (1/6) — même façon de nommer, même geste.
  *Variante si tu préfères : « Couper, et recouper ».*
- **Ce qu'il demande** : une case à **1/8**, et dans la boîte **des ÷2 seulement**.
  Un huitième ne s'obtient par aucune coupe unique : il faut enchaîner trois fois.
- **Contrôle de la règle** (SOLEY.md §5, point 16) : boîte privée de ses ÷2 →
  **aucune victoire**. Et profondeur minimale ≥ 3 coupes, prouvée au solveur.
- **Méthode de construction** : aucune solution dessinée d'abord. Le champ est taillé,
  le solveur trouve `sol`. Comme les quatre autres découvertes du lagon, ce niveau
  **n'a pas de fruit** et pas de `solMin` : une découverte se gagne, elle ne se
  mérite pas.

**CONSTRUIT ET MESURÉ le 16/08** (harnais sur le vrai moteur, `espaceEclaire`) :

| | valeur |
|---|--:|
| grille | 9 × 6, 9 roches (16,7 %) |
| soleil | (0,3) vers l'est |
| cases | 1/4 · 1/8 · 1/8 |
| boîte | 3 prismes ÷2 + 1 miroir |
| **R** | **75** |
| profondeur | 3 (trois coupes enchaînées, forcées) |
| E · G · λ | 887 · 10 · 4,3 |

Situé exactement où il faut : les quatre découvertes existantes mesurent 5, 5, 19 et
51 — la dernière du lagon est la plus exigeante des cinq, sans cesser d'être facile.
La demi-part non servie se perd en chemin, comme dans « La part perdue » : c'est le
tableau du cours, cascade et restes compris.

**Une redite à surveiller** : « Les huitièmes » (forêt) sert lui aussi des huitièmes.
La différence est nette — celui du lagon **enseigne** la chaîne (R = 75, 3 cases,
boîte exacte), celui de la forêt fait **trier quatre parts dans un labyrinthe**
(R = 542, profondeur 5, 3 fruits). Si sa consigne « Combien de coupes faut-il ? »
te paraît devenue une question déjà répondue, on la retouchera dans son propre lot.

### 2.2 Le point de cours `recouper` — bandes seules

Le moteur de cours dessine aujourd'hui deux registres : une cascade de rayons en
haut, un mur de bandes en dessous. **Le mur est déjà générique** (il empile la liste
de bandes qu'on lui donne) ; la cascade, elle, ne gère que **un ou deux étages** —
elle ne saurait pas montrer trois coupes. Ton bilan se fait donc **avec le mur seul**,
sans rayons : c'est à la fois la version la moins chère et la plus juste (le rayon
sert à jouer, la bande sert à comprendre).

Déroulé proposé, à valider mot pour mot :

| étape | texte | écriture |
|---|---|---|
| 1 | « Tu as coupé, puis recoupé : la moitié de la moitié, c'est le quart. » | `1/2 ÷ 2 = 1/4` |
| 2 | « Recoupe encore chaque quart en 2 : voilà les huitièmes. » | `1/4 ÷ 2 = 1/8` |
| 3 | « À chaque coupe, le nombre du bas est multiplié. » | `2 × 2 × 2 = 8` |
| 4 | « Coupe en trois, puis encore en trois : les neuvièmes. Coupe un quart en trois : les douzièmes. » | `1/3 ÷ 3 = 1/9` · `1/4 ÷ 3 = 1/12` |

**Phrase-carte** : « Recouper une part multiplie le dénominateur. » — `1/4 ÷ 2 = 1/8`

**Le point qui me gêne, et que je te signale plutôt que de le cacher.** L'étape 3 dit
que le dénominateur se multiplie. Un élève attentif en déduit que `2 × 3` et `3 × 2`
donnent le même six — or c'est exactement ce que « Les deux chemins du sixième »
(canne, niveau 18) lui demande de trouver. Trois lectures possibles :

1. **On garde l'étape 3.** La difficulté réelle de ce niveau est géométrique, pas
   conceptuelle : R = 18 263, deux prismes à router dans une boîte serrée. Savoir que
   les deux ordres existent ne dit pas comment les faire tenir. *(Ma recommandation.)*
2. **On coupe l'étape 3** et le bilan se contente de montrer les bandes.
3. **On garde l'étape 3 et on déplace « Les deux chemins du sixième »** après le lagon
   augmenté — mais ça change sa clé de sauvegarde.

### 2.3 Le retrait de « Les sixièmes »

- Sa ligne `CALC` (`1/3 ÷ 2 = 1/6`) part avec lui.
- La forêt passe de **9 à 8** niveaux ; son seuil d'ouverture calculé passe de **6 à 5**.
- Le lagon passe de **10 à 11** ; son seuil reste **7** (⌈5×11/8⌉ = 7, inchangé).
- **Le total reste à 70** : aucun compteur public à régénérer, ni le catalogue, ni
  l'annuaire, ni la vignette. (Leçon du lot canne, SOLEY.md §5 point 12 — vérifiée
  ici : la chaîne « 70 niveaux » apparaît dans `catalogue-refonte-data.js`,
  `soley.html` et `outils/toutes-les-ressources.html`, et ne bouge pas.)

### 2.4 Preuves exigées du lot A

`node --test` complet · les validateurs CI · Playwright `test_soley.py` ·
`tests/soley/verifier-lot-recouper.mjs` (neuf, propre au lot : il prouve que les
69 autres niveaux sont intacts à l'octet, que `CALC` et `COURS` ne bougent qu'aux
deux entrées attendues, et que le seuil de chaque monde est celui annoncé) ·
`notion-forcee.mjs lagon s2` sur le nouveau niveau · captures ≈ 390 px du niveau et
du cours, sur téléphone en portrait.

---

## 3. LOT B — Les pitons avant la forêt

**L'idée du lot, en une phrase :** on apprend qu'une même part s'écrit de plusieurs
façons **avant** d'avoir à s'en servir pour additionner, pas quatorze niveaux après.

### 3.1 Le fait mesuré qui rend le lot possible

Cinq des sept niveaux des pitons **n'ont aucun besoin de la lentille** — vérifié dans
`levels.js`, boîte par boîte :

| niveau | boîte | lentille ? |
|---|---|---|
| C'est pareil ! | `s2` | non |
| Trois écritures | `s2 s2` | non |
| Quel rayon passe ? | `s3 b s2` | non |
| Égal ou pas ? | `s3 s2 b b s2` | non |
| Le col des comparaisons | `s2 s2 b b b` | non |
| **La passe étroite** | `s2 b b mg` | **oui** |
| **Le tamis** | `s2 s2 b b b b mg` | **oui** |

### 3.2 Le déplacement

- **Le monde `pitons` passe de la position 5 à la position 3**, devant la forêt.
  Palier annoncé : **6ᵉ-5ᵉ** au lieu de 5ᵉ-4ᵉ. Aucune clé de sauvegarde ne bouge :
  la clé est `monde:nom`, et ni l'un ni l'autre ne change.
- **« La passe étroite » et « Le tamis » rejoignent la forêt.** Ce sont des passes
  *plus* de l'addition : à leur place dans le monde de l'addition, et la forêt
  récupère les deux niveaux que le lot A lui retire. **Deux clés de sauvegarde
  changent** (`pitons:…` → `foret:…`) : ces deux niveaux seront à refaire.
- Ordre final des neuf mondes : `lagon · canne · pitons · foret · volcan · soleils ·
  marche · tunnels · mafate`. Trois de ces mondes sont des champs, pas des écoles —
  la canne, les tunnels et Mafate : la chaîne d'ouverture reste valide sans une ligne
  de code (`portesDeMonde` regarde le monde précédent, et la dernière école avant lui
  quand le précédent est un champ).
- **Comptes** : pitons 7 → 5 (seuil 5 → 4) ; forêt 8 → 10 (seuil 5 → 7). Total 70.

**Un verrou nouveau, mesuré.** Aujourd'hui la forêt s'ouvre par la canne *ou* par le
lagon. Après le déplacement, elle s'ouvrira par **les pitons seuls** : ce monde
devient obligatoire. Vérifié avant de te le proposer — le plus dur des cinq niveaux
qui y restent est « Égal ou pas ? » à **R = 689**, très en dessous du plafond de
2 383 essais qui fonde la décision « personne n'est bloqué » (SOLEY.md §6). Les
pitons sont une école courte et bon marché : le verrou tient la règle.

### 3.3 Le point de cours `equivalence`, aux pitons

« C'est pareil ! » devient un **niveau-découverte** (`dec:'equivalence'`). C'est déjà
ce qu'il fait — deux cases qui veulent la même part, l'une affichée `2/4`, l'autre
`1/2` — mais il ne l'enseigne nulle part.

| étape | texte | écriture |
|---|---|---|
| 1 | « Ces deux cases veulent la même part : regarde l'épaisseur des rayons. » | |
| 2 | « Une moitié, c'est deux quarts : la même part, écrite autrement. » | `1/2 = 2/4` |
| 3 | « Le dessus et le dessous ont été multipliés par 2 tous les deux. » | `1/2 = 2/4 = 3/6` |

**Phrase-carte** : « La même part peut s'écrire de plusieurs façons. » — `1/2 = 2/4`

**Nuance à assumer** : la règle « un niveau qui enseigne force sa notion » se contrôle
en retirant une **pièce**. L'équivalence n'en a pas. Ici, ce qui force, c'est la
structure : la case affiche `2/4` et n'accepte que 1/2 — on ne peut pas la servir sans
faire le rapprochement. Le contrôle par pièce ne s'applique pas ; je l'écrirai tel
quel dans le vérificateur du lot plutôt que de faire semblant.

**Effet de bord bienvenu** : le cours `denominateur` de la forêt fait aujourd'hui
passer l'équivalence en contrebande, dans une seule ligne (« Mais le demi, c'est deux
quarts »). Une fois `equivalence` enseigné au monde 3, cette ligne devient un rappel
au lieu d'être une notion neuve glissée au milieu d'une addition.

### 3.4 Preuves exigées du lot B

Les batteries complètes · un `verifier-lot-pitons.mjs` qui prouve que **aucun bloc de
niveau ne change d'un octet** (seuls l'ordre de `WORLDS`, deux champs `w` et un champ
`dec` bougent) · un contrôle Playwright de la **chaîne d'ouverture** dans le nouvel
ordre · captures de la carte des mondes.

---

## 4. La suite, dans l'ordre

| lot | contenu | état |
|---|---|---|
| **A** | Le bilan « recouper » + retrait des « Sixièmes » | à construire |
| **B** | Les pitons avant la forêt + cours `equivalence` | à construire |
| **C** | **Les fruits qui se méritent** — les 11 niveaux où `Rtout ≤ R` | spec à écrire |
| **D** | Les 4 niveaux qui annoncent une notion sans l'obliger | spec à écrire |
| **E** | Les 3 cours de mécanique qui manquent vraiment | spec à écrire |
| **F** | Le champ mixte après la forêt | après A-E |
| **G** | Peau et fruits (planche de fruits, noms « roches ») | jamais mélangé aux lots pédagogiques |

**Lot C, le plan de travail est déjà là.** Onze niveaux ont un `Rtout` **strictement
inférieur** à leur `R` : y ramasser tous les fruits est plus *facile* que gagner — le
fruit est posé sur le chemin. Les quatre quarts · Les huitièmes · Trois demis · Quel
rayon passe ? · Le col des comparaisons · La passe des soleils · Le tourbillon · Les
demi-tunnels · Le grand réseau · Le labyrinthe des remparts · Les verrous du cirque.
Six autres, à fruits eux aussi, ont un `Rtout` **égal** : La loupe · C'est pareil ! ·
Un soleil qui vaut 2 · Deux tiers d'un coup · Les pourcentages · Le serpent.
**Dix-sept niveaux**, donc — un septième, « Les sixièmes », sort de la liste puisque
le lot A le retire. Ajouter un `solMin` ne suffit pas : il faut **déplacer le fruit**,
puis prouver.

**Lot E — trois cours, pas huit.** L'audit compte mal : il annonce sept mécaniques
sans cours et en liste huit. Surtout, le support d'un point de cours est **la bande de
fractions** (décision gravée) — et une bande ne sait pas dessiner une porte. Sur les
huit, **trois sont des notions de maths** qui se dessinent sur une bande : la **loupe**
(multiplier une part), la **comparaison** (les passes : plus on partage, plus les parts
sont petites — `1/4 < 1/3`), les **écritures décimales et pourcentages**. Les cinq
autres — portes orientées, fruits à valeur, soleils multiples, soleils à valeur,
pièces scellées — sont des **règles de plateau** : elles méritent un niveau doux qui
les force et une consigne claire, pas un cours.

---

## 5. Ce que la méthode impose, à chaque lot

- **Aucune solution dessinée d'abord.** On taille le champ, le solveur trouve `sol` et
  `solMin`, et on mesure `R` / `Rtout`. Un niveau qui tombe trop vite est refusé.
- **Un lot = une idée, prouvable seule.** Jamais une refonte pédagogique et un
  changement de peau dans la même PR.
- **Chaque lot apporte son propre vérificateur** ; les anciens deviennent des archives
  datées (SOLEY.md §6, décision 9).
- **Toute modification du catalogue exige la régénération des pages dérivées**
  (§5 point 12). Ici, le total reste à 70 : rien à régénérer.
- **PR sans fusion.** Audit croisé, puis ton clic.

---

## 6. Ce qui reste ouvert (ne bloque aucun lot)

**6.0 — La lecture de ta réponse.** J'ai lu « sinon *l'ordre*, je suis d'accord »
comme un feu vert sur D4 (les pitons avant la forêt). Si tu voulais dire autre chose,
dis-le : c'est la seule décision de cette spec que je n'ai pas eue par écrit.

**6.1 — Les décimaux et les pourcentages.** Le lot B fait remonter les équivalences
*entre fractions* du 35ᵉ au ~20ᵉ niveau. Les **décimaux et pourcentages**, eux, restent
au marché, monde 7. Faut-il aussi détacher « Écritures décimales » et « Les
pourcentages » (les deux plus faciles du marché, R = 10 et R = 4, aucune lentille) ?
*Attention si tu penses à déplacer le marché entier : « Le grand marché » utilise un
soleil qui vaut 2, mécanique du monde des soleils qui le précède.*

**6.2 — Les fruits qui se ressemblent.** Le letchi et le goyavier sont deux petites
boules rougeâtres : à 20 px, on ne les distingue pas. Ce qui se lit d'un coup d'œil,
c'est la **silhouette** — banane (croissant jaune), chouchou (poire verte), papaye
(ovale orange), combava (boule bosselée), vanille (gousse). Une planche te sera
soumise avant toute décision, dans le lot G.

**6.3 — Les noms qui parlent encore de roches.** « Zigzag dans les roches » (lagon,
peint en corail) et « Le champ de roches » (forêt, peinte en fougères). Les renommer
change leur clé de sauvegarde et touche cinq fichiers de test (`soley-public.test.mjs`,
`test_soley.py`, `test_atelier.py` et deux vérificateurs de lot). Aucun des deux n'a de
ligne `CALC` : le coût est plus faible qu'on ne le craignait. À trancher dans le lot G.

**6.5 — Les fruits, la règle nouvelle.** On abandonne « un fruit par monde ». Les
fruits varient à l'intérieur d'un monde, choisis pour leur **silhouette** :
letchi, goyavier, mangue, ananas — et maintenant chouchou, papaye, banane, combava,
vanille. Conséquence de code à régler dans le lot G : `FRW` associe aujourd'hui un
fruit à un monde, et le décompte de fin de niveau s'appelle « Letchis », « Mangues »…
Si les fruits varient, le fruit devient une propriété **du fruit**, pas du monde, et
le décompte doit dire autre chose — « fruits péi », ou un compte par espèce.

**6.4 — Les mondes de réserve.** L'usine sucrière de Bois-Rouge (rouleaux et
engrenages : le monde des loupes ×) et le cyclone (des cases où le vent fait tourner la
pièce posée ; obstacles = tôles envolées, branches, poteaux couchés, radiers en crue).
Le kabar reste une belle idée sans moteur : nos fractions sont des **épaisseurs de
rayon**, une fraction de temps demanderait un autre jeu.

---

## 7. « A-t-on fait toutes les notions que ce jeu peut porter ? »

Ta question du 16/08. Réponse honnête : **non, il en reste, et une au moins est
énorme.** Voici l'inventaire, classé par ce qu'il en coûterait.

### Rien à coder — le moteur sait déjà le faire

**7.1 — La fraction d'une quantité. « Les 2/3 de 6 ».** C'est le plus gros trou du
jeu. Un soleil peut déjà porter n'importe quelle valeur (`val:[6,1]`) : le prisme ÷3
en fait trois rayons de 2, la loupe ×2 en refait 4. **Vérifié le 16/08 dans le vrai
moteur** — niveau d'essai monté et mesuré : R = 35, profondeur 4, il marche
aujourd'hui, sans une ligne de code. Or « prendre les 2/3 de 6 » est une notion de
6ᵉ-5ᵉ centrale, et le jeu ne la propose **nulle part** : tous nos soleils valent 1,
sauf deux qui valent 2. Il y a un monde entier là-dedans — et c'est peut-être lui, le
champ mixte, ou l'usine sucrière.

**7.2 — La multiplication de deux fractions, en nommant ce qu'on fait déjà.**
Couper un tiers en deux, c'est prendre la moitié d'un tiers : `1/3 ÷ 2` **est**
`1/2 × 1/3`. L'élève fait ce geste depuis le lagon et le jeu ne le lui dit jamais.
Un seul point de cours, sur la bande, retourne toute la cascade du partage en
multiplication. Coût : un cours, zéro plateau.

**7.3 — Le complément à 1.** « Il manque combien pour faire un rayon entier ? » Le
jeu additionne beaucoup et ne demande jamais ce qui manque. Zéro code : des cases, une
lentille, une part à trouver.

### Une petite pièce à ajouter

**7.4 — Les dixièmes et les centièmes.** Le marché parle de 0,5 et 0,25 mais le jeu
**ne sait pas fabriquer un dixième** : il n'a que des prismes ÷2 et ÷3. Un prisme ÷5
(ou ÷10) ouvrirait 1/10 et 1/100, et avec eux le vrai lien fraction ↔ décimal, celui
qui manque au marché.

**7.5 — L'encadrement.** Les passes disent « au plus ». Une passe à **minimum**
donnerait « entre 1/4 et 1/2 » — encadrer une fraction, la ranger entre deux repères.
Un champ `min` à côté du `max` existant.

### Une vraie pièce neuve

**7.6 — La soustraction.** Aucune pièce n'enlève. Une vitre qui retient une part et
laisse passer le reste (`3/4` entre, `1/2` est retenu, `1/4` ressort) donnerait la
soustraction de fractions — la seule des quatre opérations que Solèy ne fait pas.

### Ce que le moteur ne portera pas

**7.7 — Les fractions de temps** (le kabar). Chez nous une fraction est une
**épaisseur** : elle occupe de l'espace, on la compare à l'œil. Une fraction de temps
demande un tempo, une écoute, une reproduction — un autre moteur, donc un autre outil
de maths&go, pas un monde de Solèy.
