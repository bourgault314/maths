# PLAN-FRUITS.md — Les fruits qui se méritent (chantier difficulté)

*Écrit le 19/08/2026 (session Cowork), pour graver au dépôt la grande mesure du
17/08 et le plan qui en découle. Statut : mesures = faites ; décisions de
Gwenael = validées (17/08) ; plan monde par monde = PROPOSÉ, à valider. Ce
chantier passe EN DERNIER, après le lot cours et le monde quantité.*

## 1. Le principe (idée 32 de la bibliothèque, validé depuis la refonte)

Gagner reste accessible partout ; c'est TOUT RAMASSER qui doit faire chercher.
La difficulté vit dans la couche optionnelle ☀☀/☀☀☀, jamais dans un verrou.
Un fruit « cadeau » est un fruit que la victoire ordinaire ramasse sans le
vouloir — la couche optionnelle tourne alors à vide.

## 2. La grande mesure (17/08, solveur à budget 1,6 M d'essais)

Mesuré sur l'état d'alors (71 niveaux, 142 fruits) : **29 niveaux à fruits
cadeaux, 70 fruits offerts sur 142 — la moitié.** Par monde :

| Monde | Cadeaux | Note |
|---|---|---|
| tunnels | 8/8 (25 fruits) | G = 1 partout : des couloirs — la difficulté est dans la couche OBLIGATOIRE, l'inverse de l'idée 32 |
| pitons | 6/7 | **RÉGLÉ depuis** par le lot pitons-1 (#417) : fruits 🅗🅔🅕 + solMin |
| volcan | 4/7 | |
| soleils | 4/8 | |
| mafate | 4/7 | |
| marché | 2/6 | les deux premiers, voulus faciles |
| forêt | 1/8 | |

Lagon et canne avaient déjà été traités (refonte, lots sixième et vérité).

**Quatre niveaux immesurables** au budget de 1,6 M — leur difficulté réelle est
inconnue, à assainir dans ce chantier : « Cinq sixièmes », « Les douzièmes »,
« Le sommet » (aucune victoire trouvée par le solveur), « Deux soleils sur les
îlets » (R = 26 111 mais aucune victoire tout-ramassé trouvée). Leurs `sol` de
référence gagnent et ramassent tout — ils sont jouables — mais un niveau que le
solveur ne résout pas est peut-être trop dur, ou son plateau est mal taillé.

**État au 19/08** (main `49c7b939`, re-mesuré) : 73 niveaux, 145 fruits,
67 niveaux à fruits dont **19 avec `solMin` et 48 sans**. La règle : tout
niveau retouché par ce chantier repart avec sa `solMin` (le garde-fou compte).

## 3. Le menu des difficultés (8 formes, à VARIER — jamais deux fois de suite la même)

Décision de Gwenael (17/08) : des difficultés « variées et originales, pas
toujours les mêmes ». Le menu, nourri des 33 idées de la bibliothèque :

- 🅐 **La bifurcation** — le fruit exige un AUTRE plan que la victoire (idée 11,
  la règle d'or de l'original).
- 🅑 **Le fruit à valeur** — ramassé seulement par un rayon de la bonne fraction
  (idée 12 ; signature de la canne — extension aux autres mondes À VALIDER).
- 🅒 **La part perdue devient le trésor** — router le surplus du partage vers le
  fruit (idée 21).
- 🅓 **L'ordre des coupes** — même nombre de pièces, seul l'ordre (ou l'endroit)
  de la coupe attrape le fruit (idée 25 ; « La crête des passes » le fait déjà).
- 🅔 **Le rayon sacrifié** — le fruit se cueille par un rayon qui meurt ensuite
  (idée 27).
- 🅕 **La branche coûteuse** — le fruit au bout d'un détour à 2-3 miroirs de
  plus, en surplus dans la boîte.
- 🅖 **La galerie latérale** — creuser une poche hors du couloir obligé ; LA
  forme des tunnels, où replacer les fruits ne suffit pas (les couloirs n'ont
  qu'un chemin).
- 🅗 **Derrière la passe ou la porte** — le fruit gardé par une passe étroite ou
  une porte orientée (idée 33). La passe étroite et la porte orientée sont des
  mécaniques PROPRES à Solèy, pas des idées de l'original : aucune des 33 ne les
  porte (le renvoi « idée 26 » de la v1 visait les sources en bord de cadre —
  corrigé le 19/08 après relecture de AUDIT-33-IDEES.md).

## 4. Les décisions de Gwenael qui cadrent le chantier (17/08, validées)

- des fruits qui se méritent AUSSI dans les niveaux école ;
- rajouter des niveaux À L'INTÉRIEUR des mondes si besoin ;
- au moins un ou deux niveaux difficiles par monde ;
- MAIS garder des niveaux faciles et des fruits faciles (des respirations) ;
- il reprendra les photos de l'original et enverra de nouvelles difficultés à
  intégrer — la bibliothèque reste ouverte (paquets suivants).

Règles héritées des lots précédents, à respecter : un niveau se compare à ses
VOISINS DE JEU, pas à ses cousins de catégorie (#395) ; un fruit facile gardé
sur chaque niveau retouché (lot pitons-1) ; jamais de peau et de pédagogie dans
la même PR ; clés de sauvegarde intouchables.

## 5. Le plan (PROPOSÉ) : ~20 retouches, 3 PR, monde par monde

1. **PR tunnels + forêt** — les galeries latérales (🅖) des 8 tunnels qui n'ont
   que des couloirs, + le fruit de la forêt ; assainir « Cinq sixièmes » et
   « Les douzièmes » au passage (mêmes mondes).
2. **PR volcan + soleils** — 🅐🅒🅔 dosés, 1-2 niveaux durs neufs si un monde
   manque de sommet ; assainir « Le sommet ».
3. **PR marché + Mafate** — 🅓🅗 dosés ; « Deux soleils sur les îlets » remesure
   sa cueillette ; les deux premiers du marché RESTENT faciles (voulu).

Chaque retouche est mesurée au solveur (R, Rtout, Gtout > 0 — un fruit
impossible n'est pas un fruit mérité) et repart avec `sol` + `solMin` + son
entrée au vérificateur du lot.

## 6. Questions ouvertes (à trancher avant de construire)

1. Les fruits à valeur (🅑) sortent-ils de la canne ? (C'était sa signature.)
2. La règle des pièces en trop : **40 niveaux sur 73** ont plus de pièces en
   boîte que leur `sol` n'en pose (37 si l'on retire les 3 niveaux à pièces
   `fixed`) ; **5** le disent — « Deux tiers », « Le champ de fougères », « Le
   grand labyrinthe », « Le labyrinthe des remparts », « Les verrous du cirque ».
   *(Le « 36 » de la v1 n'était reproductible à aucune date : 41 au 17/08 avec la
   même définition. Recalé sur la mesure du 19/08 — un compteur REJOINT la vérité,
   il ne s'incrémente pas, règle du §6 de SOLEY.md.)*
   Avis Claude : UNE phrase au niveau 1 (« il peut rester des pièces ») et on ne
   le redit plus jamais. À trancher une fois pour toutes.
