# Livrets de l'Enquête — monde 3 de l'univers SPLAT!, cinq livrets de 8 pages, à plier

La progression **v3, en cinq livrets** (lot « fabrication des cinq livrets », 03/10/2026 — décidée
avec Gwenaël, `splat-relecture\monde-3-progression-six-livrets.md`, section du 03/10 au soir) :
trois livrets de base, pour tous, dans l'ordre, puis deux livrets « Deuxième tour », plus durs :
le **Bonus** de la carte des mondes (depuis le 04/10/2026, des taches dorées à part). Même fabrication que les livrets des mondes 1 et 2 :
**2 feuilles A3 recto-verso**, pliées et agrafées au milieu → 8 pages A4.

| Livret (`render.py`) | Fiches | Page 2 (exemple résolu) |
|---|---|---|
| `additif` — partie 1, *SPLAT! Enquête* | 10 De plus que · 11 De moins que · 12 Trois taches, une référence · 13 Trois taches en chaîne · 14 Référence ou chaîne ? | deux taches, « de plus » (graine 32) |
| `multiplicatif` — partie 2, *Grande enquête* | 15 Fois plus · 16 Fois moins · 17 Une référence, deux rapports · 18 Chaîne, deux rapports · 19 Une référence, un écart et un rapport | deux taches, « 3 fois plus » (graine 83) |
| `rebondit` — partie 3, *L'enquête rebondit* | 20 Des taches répétées · 21 Répétées, fois plus ou moins · 22 Sans total · 23 Sans total, à retourner · 24 Le défi qui rebondit | taches répétées (graine 82) |
| `tour2_dessins` — deuxième tour 1, *Les trois dessins* | 11d Je complète · 12d Référence, chaîne ou je complète ? · 13d Tout dans le désordre · 16d Chaîne, un écart et un rapport · 17d Je complète, avec un rapport | je complète, deux « de plus » (graine 20) |
| `tour2_systeme` — deuxième tour 2, *Vers le Système* | 18d Indices composés · 20d Deux taches réunies · 22d Les indices en symboles · 19d Le grand défi · 24d Unité commune : les petites parts | indice composé, « 3 de plus que le double » (graine 14) |

Chaque livret : `outils/livret_splat_enquete_<nom>.pdf` (8 pages A4, ordre de lecture) et
`…_a_plier.pdf` (4 pages A3 paysage **déjà imposées** 8|1 · 2|7 · 6|3 · 4|5 : recto-verso,
retournement sur le **bord court**), et ses deux corrigés `…_correction` (inconnue « ? ») et
`…_correction_lettre` (inconnue en lettre), chacun avec son « à plier » — 30 PDF.
Les livrets « Le défi » ont disparu au lot 2 (30/09), les trois anciens « Deuxième tour »
(`additif_tour2`, `multiplicatif_tour2`, `rebondit_tour2`) le 03/10 ; les fiches 10d, 14d, 15d,
21d et 23d n'existent plus.

## Les 8 pages

1. **Couverture** — sans logo ; sur-titre « Mon livret · Monde 3 · Partie N » (« Monde 3 · Deuxième
   tour · N »), « Comment ça marche ? » avec la carte de l'exemple, « Nom, prénom » + Classe,
   le sommaire des cinq fiches (badges 10 … 24, 11d … 24d).
2. **Un exemple résolu — « L'enquête pas à pas »** : le dessin de la première fiche du livret, sur
   une carte qui n'est dans aucun livret. Les **schémas successifs du pas à pas de la projection**
   (lot G3 ; lot « pages 2 », 30/09/2026) : ① Je fais le schéma de la situation · ② Schéma
   regroupé, puis un dessin par opération — Je range · Je regroupe · Je retire (26 − 8 → 18) ·
   Je partage (18 ÷ 2 ; 28 en 4 × 7) — et les barres avec les nombres (« Je trouve la verte », ou
   « Je trouve les autres taches » en un seul dessin) ; enfin, en texte, « Je réponds » (la
   phrase de réponse, encadrée sur fond blanc) puis « Je vérifie » — côte à côte en une colonne,
   l'un sous l'autre en deux colonnes, sans rien prendre aux schémas (03/10/2026) —, et « À toi ! ». Jusqu'à cinq dessins (parties 1 et 2) : une colonne ;
   au-delà : **deux colonnes lues de haut en bas**, un filet entre les deux. La case retirée est
   hachurée **comme en projection**, seulement moins estompée (teintes fixes, sans transparence), pour
   rester lisible en noir et blanc ; la case **ajoutée** (« Je complète ») est blanche, en
   **pointillés**, le nombre seul dedans (01/10/2026), pour ne plus la confondre avec la retirée.
   Les étapes sont numérotées dans une **pastille blanche bordée** (comme les ① ② des corrigés) :
   la tache numérotée reste réservée aux fiches (01/10/2026).
3. à 7. **Les cinq fiches**, 4 cartes par page, telles que l'outil les imprime, le QR de la fiche
   dans le bandeau, sans logo. Les fiches 12, 13, 17, 18, 22, 11d, 17d et 18d portent le **schéma vide
   sous la carte 1** (`modele=1`, lot 1) : ce sont celles qui apportent un nouveau dessin.
   Depuis le 01/10/2026, le plateau des énoncés fait **22 mm** (comme la correction) pour laisser
   plus de place pour écrire ; la carte d'exemple seule (couverture, page 2, dos) garde ses 28 mm
   (`plateauEntier`).
4. **Dos** — « Encore des cartes ! » (huit cartes à chaque ouverture) : trois séries infinies et,
   aux parties 1 à 3, un 4e QR **« Je révise »**, une série du livret d'avant (partie 1 : le monde 2 ;
   partie 2 : la partie 1 ; partie 3 : la partie 2) ; quatre séries au deuxième tour, sans « Je
   révise ». Puis « La suite du voyage », et en bas (04/10/2026, décidé avec Gwenaël sur maquette puis
   sur la planche des cartes) **« Le défi ! »** : **deux cartes du MÊME livret, plus difficiles** (des
   jetons visibles, de grands nombres ; au deuxième tour 1, les indices dans le désordre), pour l'élève
   qui a fini avant les autres — dessinées par l'outil comme sur les fiches, l'énoncé et sa place pour
   écrire dans le livret de l'élève, la **correction** à la même place dans les corrigés. Elles
   remplacent les cartes de rappel du livret d'avant (03/10), qui regardaient en arrière sous « Et
   après ? ». Exceptions : la partie 3 garde « Pour ne pas oublier » — **un exemple corrigé** (une
   carte sans total, corrigée même chez l'élève) et, à côté, **la même sorte de carte** avec d'autres
   nombres (« À toi ! », demande de Gwenaël du 03/10) ; le deuxième tour 2 garde **l'unité commune
   résolue** (« les petites parts », pas à pas comme en projection). Les QR rapetissent pour leur
   laisser la place. Puis les crédits avec, seuls logos du livret, IREMI + maths&go et l'Unité
   apprenante Michel Debré (logos : rien ne change, décision du 04/10/2026).

## Les graines : triées, une fiche = une étape = une étoile

`E10` … `E24` sont **exactement** les adresses de `ENQ_FICHES` (`outils/splat_univers.html`) et
de la page courte (`ENQ`) ; `E11D` … `E24D` celles de `ENQ_TOUR2` de la page courte et de la
carte des mondes. Les graines ont été **triées** au script (hors dépôt : le moteur de l'outil
rejoué, `splat-relecture\progression-v2-outils\`) :

- chaque carte a sa **variante imposée** (dessin + sens des indices : deux « de moins », « fois
  moins / fois moins », les quatre mélanges écart/rapport…), toutes les variantes d'un dessin dans
  le livret où il est appris ;
- aucun nombre à sous-entendu (le 69 accepté dans les cartes, jamais dans un exemple) ; jamais
  deux taches égales ; écarts de 2 au moins ; plus petite tache ≥ 5 sur 10, 11, 15, 16, 22, ≥ 4
  sur 17 et 18, ≥ le sixième de la plus grande ; aucun mot réduit à son initiale dans la
  correction ;
- totaux différents dans une fiche, **aucune carte en double** sur les 100 cartes, les cartes du
  dos (« Le défi ! », l'exemple corrigé de la partie 3) et les exemples (`controle_global` le revérifie au rendu, sur `cartes.json`) ; aucune
  fiche ne reprend la carte 1 d'une autre.

Si une graine change : la reporter dans la carte des mondes ET la page courte, relancer
`python3 render.py --qr` ; les tests `livret-splat-enquete`, `splat-enquete-carte-mondes` et
`splat-enquete-correction-barres` épinglent les trois listes et les cartes.

## Les QR codes passent par une page courte

`https://mathsgo.re/splat/enquete/livret/?f=12` ouvre la série en ligne de la fiche 12 —
exactement le lien « Je joue » de la carte des mondes (mêmes cartes, `parcours=enq12`) ;
`?f=12d` ouvre la fiche 12d, avec **son parcours** (`enq12d`, sa tache dorée du Bonus) ; `?f=10d`, `14d`, `15d`,
`21d`, `23d` (retirées) mènent à la carte des mondes. `?s=N` : les séries du dos (réglages des
fiches, sans graine, mode élève sans étape) ; les séries des anciens livrets restent servies pour
un livret déjà imprimé.

| Livret | Séries du dos |
|---|---|
| partie 1 | 16 Deux taches · 17 Une référence · 35 En chaîne · 37 Je révise (le monde 2) |
| partie 2 | 19 Fois plus, fois moins · 36 Deux rapports · 20 Écart et rapport · 35 Je révise (la partie 1) |
| partie 3 | 22 Taches répétées · 23 Sans total · 24 Le défi qui rebondit · 36 Je révise (la partie 2) |
| deuxième tour 1 | 25 Quel dessin ? · 26 Dans le désordre · 28 Chaîne et rapport · 29 Je complète |
| deuxième tour 2 | 30 Indices composés · 32 Taches réunies · 33 En symboles · 34 Unité commune |

## Les exemples

Les textes de la couverture et de la page 2 sont écrits **à partir de la carte rendue** et de son
modèle de correction, les dessins viennent du pas à pas de l'outil (`enqueteG3Etapes`,
`enqueteG3Dessiner` au profil d'impression) (`textes_exemple_deux`, `textes_exemple_repet`,
`textes_exemple_complete`, `textes_exemple_compose`) : ils ne peuvent pas mentir sur ses nombres ; chaque fonction refuse une
carte qui n'a pas le dessin attendu. Les dessins sont ceux de l'outil (`drawEnqueteBarres`,
`drawEnqueteLigne`, `drawEnqueteCalculs`) au profil d'impression de la correction ; les couleurs
`var(--…)` de l'outil sont résolues (sinon une pastille orange sortait noire).

## Les livrets corrigés (pour tous)

Mêmes 8 pages, même pliage, **mêmes cartes à la même place** (`render.py` s'arrête si une carte
diffère entre l'élève, la correction et la lettre). Fiches : la correction imprimée de l'outil
(`print=correction`) ; en lettre, `unknown=letter` (initiales des couleurs dans les calculs, la
police du 𝑥 arrondi reste posée : `CSS_X`). Sous la réponse, le corrigé **vérifie les indices**
(« verte = rouge + 2 : 5 = 3 + 2 ✓ », en lettre « V = R + 2 : 5 = 3 + 2 ✓ »), comme le dernier
appui de la projection. Couverture : bandeau « Correction », « Livret corrigé »
— jamais « professeur » (le corrigé peut être donné aux élèves).

## Régénérer

```bash
cd _sources/livret-splat-enquete
python3 render.py                 # les CINQ livrets, élève et corrections
python3 render.py additif         # un seul livret, et ses corrections
python3 render.py --eleve         # seulement les livrets de l'élève
python3 render.py --correction    # seulement les livrets de correction
python3 render.py --qr            # en refabriquant d'abord les QR codes
python3 render.py --vignettes     # les vignettes de la page des livrets (page 1 à 120 dpi, PNG + WebP)
```

Dépendances : `playwright` **1.56.0** (+ chromium), `pikepdf`, `qrcode[pil]` ; `qpdf`, s'il
est présent, divise le poids des PDF par deux. Le rendu utilise le **vrai Chromium**
(`channel="chromium"`), jamais le « headless shell », qui espace les lettres d'environ 5 %.
**Les PDF du site se rendent sous Linux** (DejaVu Sans), comme tous les livrets SPLAT! : sur un
poste Windows, les fiches sortent en Segoe UI et l'écriture ne serait plus celle des autres
mondes (vérifié le 03/10/2026 : le rendu Windows de la PR #910 a été refait sous Linux). Le
script tourne aussi sous Windows (Cambria Math pour le 𝑥, pikepdf si qpdf manque), pour essayer.
Les cartes de l'outil (couverture, page 2, dos) gardent la police de l'outil (`commun.css`),
comme les fiches.

## Conventions

- **Logos** (décision du 25/09/2026, comme les livrets des mondes 1 et 2) : aucun sur la
  couverture, les fiches (`JS_SANS_LOGO` retire ceux de l'outil au rendu) ni la page 2 ; IREMI +
  maths&go une seule fois, au dos, à côté des crédits. Le pied : la signature
  `mathsgo.re/splat · CC BY-NC-SA 4.0` (gris moyen `#64748b`, 10 px). Claire est remerciée une
  seule fois, au dos.
- Tout reste lisible imprimé en **noir et blanc** : le framboise ne sert qu'aux fonds, tout
  texte coloré est foncé (`#831843`), le nom de la couleur est écrit sur chaque tache, le
  QR est dans une boîte blanche.
- Un titre de fiche trop long pour une ligne se coupe **après le tiret** (« Fiche 18 — » / la
  suite), jamais au milieu du titre (`JS_TITRE`), et rapetisse jusqu'à 80 % s'il le faut.
- Vocabulaire : « jeton », « paquet de jetons », « tache », « indice », « ? », « schéma en
  barres » — jamais d'autre nom pour la représentation, jamais de nom de forme pour un jeton.
- L'imposition A3 passe par **pikepdf** et `add_overlay` (avec pypdf, les dégradés ne suivent pas).
