# Livrets de l'Enquête — monde 3 de l'univers SPLAT!, six livrets de 8 pages, à plier

La progression en **six livrets** (lot 2, 30/09/2026 — décidée avec Gwenaël le 30/09,
`splat-relecture\monde-3-progression-six-livrets.md`) : trois livrets de base, pour tous, dans
l'ordre, puis trois livrets « Deuxième tour », plus durs, qui allument les **mêmes étoiles**.
Même fabrication que les livrets des mondes 1 et 2 : **2 feuilles A3 recto-verso**, pliées et
agrafées au milieu → 8 pages A4.

| Livret (`render.py`) | Fiches | Page 2 (exemple résolu) |
|---|---|---|
| `additif` — partie 1, *SPLAT! Enquête* | 10 De plus que · 11 De moins que · 12 Plus ou moins · 13 Trois taches, une référence · 14 Le défi : une référence, jetons visibles | deux taches, « de plus » (graine 32) |
| `multiplicatif` — partie 2, *Grande enquête* | 15 Fois plus · 16 Fois moins · 17 Fois plus ou fois moins : le double, la moitié · 18 Trois taches : deux rapports, puis un écart et un rapport · 19 Le défi : toutes opérations, jetons visibles | deux taches, « 3 fois plus » (graine 83) |
| `rebondit` — partie 3, *L'enquête rebondit* | 20 Des taches répétées · 21 Répétées, fois plus ou moins · 22 Sans total · 23 Sans total, à retourner · 24 Le défi qui rebondit | taches répétées (graine 82) |
| `additif_tour2` — partie 1, deuxième tour | 10d Trois taches en chaîne · 11d Je complète · 12d Référence, chaîne ou je complète ? · 13d Tout dans le désordre · 14d Le grand défi additif | chaîne, deux « de plus » (graine 4642) |
| `multiplicatif_tour2` — partie 2, deuxième tour | 15d Chaîne, deux rapports · 16d Chaîne, un écart et un rapport · 17d Je complète, avec un rapport · 18d Indices composés · 19d Le grand défi | chaîne, « de plus » puis « 3 fois plus » (graine 128029) |
| `rebondit_tour2` — partie 3, deuxième tour | 20d Deux taches réunies · 21d Répétées à trois couleurs · 22d Les indices en symboles · 23d Très grands nombres · 24d Unité commune : les petites parts | deux taches réunies (graine 43) |

Chaque livret : `outils/livret_splat_enquete_<nom>.pdf` (8 pages A4, ordre de lecture) et
`…_a_plier.pdf` (4 pages A3 paysage **déjà imposées** 8|1 · 2|7 · 6|3 · 4|5 : recto-verso,
retournement sur le **bord court**), et ses deux corrigés `…_correction` (inconnue « ? ») et
`…_correction_lettre` (inconnue en lettre), chacun avec son « à plier » — 36 PDF.
Les livrets « Le défi » d'avant (totaux de 50 à 100) ont disparu au lot 2.

## Les 8 pages

1. **Couverture** — sans logo ; sur-titre « Mon livret · Monde 3 · Partie N » (« Monde 3 · Partie N ·
   Deuxième tour »), « Comment ça marche ? » avec la carte de l'exemple, « Nom, prénom » + Classe,
   le sommaire des cinq fiches (badges 10 … 24, 10d … 24d).
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
   dans le bandeau, sans logo. Les fiches 13, 18, 22, 11d, 17d et 18d portent le **schéma vide
   sous la carte 1** (`modele=1`, lot 1) : ce sont celles qui apportent un nouveau dessin.
   Depuis le 01/10/2026, le plateau des énoncés fait **22 mm** (comme la correction) pour laisser
   plus de place pour écrire ; la carte d'exemple seule (couverture, page 2, dos) garde ses 28 mm
   (`plateauEntier`).
4. **Dos** — « Encore des cartes ! » (trois séries infinies, quatre au Deuxième tour 2 avec les
   indices composés ; huit cartes à chaque ouverture), « La suite du voyage », « Pour se souvenir »
   (au Deuxième tour 3 : **l'unité commune résolue**, « les petites parts », pas à pas comme en
   projection — je coupe en petites parts, le schéma regroupé, je partage, les taches —, les QR un peu plus petits),
   les crédits avec, seuls logos du livret, IREMI + maths&go et l'Unité apprenante Michel Debré.

## Les graines : triées, une fiche = une étape = une étoile

`E10` … `E24` sont **exactement** les adresses de `ENQ_FICHES` (`outils/splat_univers.html`) et
de la page courte (`ENQ`) ; `E10D` … `E24D` celles de `ENQ_TOUR2` de la page courte. Les graines
ont été **triées** (script hors dépôt qui rejoue `genInvestigate` de l'outil) :

- la sorte de carte prévue à chaque place : « de plus / fois plus » en cartes 1-2, « de moins /
  fois moins » en 3-4 dans les fiches qui mélangent ; « le double » en carte 2, « la moitié » en
  carte 4 (17, et « le triple » / « la moitié » en 21) ; compositions fixées des fiches « au
  hasard » (19 : 8, 10, 5, 10 · 12d : 5, 6, 7, 6 · 13d et 14d : 5, 6, 7, 7 · 19d : 10, 11, 12, 9 ·
  23d : 6, 10, 11, 12 — numéros de la classification) ; 24 : deux cartes répétées puis deux sans
  total ; 24d : seulement des cartes où l'on **double** ;
- aucun nombre à sous-entendu (le 69 accepté dans les cartes, jamais dans un exemple) ; jamais
  deux taches égales ; écarts de 2 au moins ; plus petite tache ≥ 5 sur 10-12 et 15-17, ≥ 8 sur
  14d, 19d, 23d, ≥ le sixième de la plus grande ; aucun mot réduit à son initiale dans les cases
  (sauf 24d, impossible) ; correction réduite de 19 % au plus (21d, 24d : jusqu'à 24 %) depuis
  que le corrigé vérifie aussi les indices (lot « pages 2 ») ;
- totaux différents dans une fiche, couleurs variées, **aucune carte en double** sur les 30 fiches
  ni égale à un exemple (`controle_global` le revérifie au rendu, sur `cartes.json`).

Graines gardées des livrets d'avant : 172 (20), 3 (22), 9 (23). Si une graine change : la reporter
dans la carte des mondes ET la page courte, relancer `python3 render.py --qr` ; les tests
`livret-splat-enquete`, `splat-enquete-carte-mondes` et `splat-enquete-correction-barres`
épinglent les trois listes et les cartes.

## Les QR codes passent par une page courte

`https://mathsgo.re/splat/enquete/livret/?f=12` ouvre la série en ligne de la fiche 12 —
exactement le lien « Je joue » de la carte des mondes (mêmes cartes, `parcours=enq12`) ;
`?f=12d` ouvre la fiche 12d, avec **le même parcours** (la même étoile). `?s=16` … `?s=34` : les
séries du dos (réglages des fiches, sans graine, mode élève sans étape) ; `?s=1` … `?s=15`, celles
des anciens livrets, restent servies pour un livret déjà imprimé.

| Livret | Séries du dos |
|---|---|
| partie 1 | 16 Deux taches · 17 Trois taches (une référence) · 18 Jetons visibles |
| partie 2 | 19 Fois plus, fois moins · 20 Trois taches · 21 Jetons visibles |
| partie 3 | 22 Taches répétées · 23 Sans total · 24 Le défi qui rebondit |
| deuxième tour 1 | 25 Quel dessin ? · 26 Dans le désordre · 27 Le grand défi additif |
| deuxième tour 2 | 28 Chaînes · 29 Je complète · 30 Indices composés · 31 Le grand défi |
| deuxième tour 3 | 32 Taches réunies · 33 En symboles · 34 Unité commune |

## Les exemples

Les textes de la couverture et de la page 2 sont écrits **à partir de la carte rendue** et de son
modèle de correction, les dessins viennent du pas à pas de l'outil (`enqueteG3Etapes`,
`enqueteG3Dessiner` au profil d'impression) (`textes_exemple`, `textes_exemple_deux`, `textes_exemple_repet`,
`textes_exemple_reunies`) : ils ne peuvent pas mentir sur ses nombres ; chaque fonction refuse une
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
python3 render.py                 # les SIX livrets, élève et corrections
python3 render.py additif         # un seul livret, et ses corrections
python3 render.py --eleve         # seulement les livrets de l'élève
python3 render.py --correction    # seulement les livrets de correction
python3 render.py --qr            # en refabriquant d'abord les QR codes
```

Dépendances : `playwright` **1.56.0** (+ chromium), `pikepdf`, `qrcode[pil]` ; `qpdf`, s'il
est présent, divise le poids des PDF par deux. Le rendu utilise le **vrai Chromium**
(`channel="chromium"`), jamais le « headless shell », qui espace les lettres d'environ 5 %.
**Ne pas régénérer ces PDF sur un poste Windows** : les fiches y sortent en Segoe UI au lieu
de DejaVu Sans et toutes les pages changent ; ils se rendent sur la machine qui a fabriqué
tous les PDF actuels du site, puis se comparent à `main` page par page.

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
