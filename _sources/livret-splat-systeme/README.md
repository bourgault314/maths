# Livrets du Système — « SPLAT! Système » et « SPLAT! Système · cycle 4 » (monde 4), format « tablette »

Le monde 4 de l'univers SPLAT! en deux livrets de 12 pages (lot M4-4, 04/10/2026, décisions de
Gwenaël sur planches) : **un livret pour tous**, quatre fiches (25 à 28), une idée par fiche — refait
au lot M4-6 (14/10/2026) d'après la conception des deux livrets du monde 4 ; puis **le livret
cycle 4** (25d à 28d, refait au lot M4-7, ex-« deuxième tour » : ses fichiers gardent le nom
`tour2`) — le Bonus du monde 4 sur la carte des mondes, comme au monde 3. Les fiches 29 à 34
restent libres ; SPLAT! Équations garde 35.

## Le format « tablette »

**Toutes les pages sont des A4 en largeur** — couverture, pages 2-3 et dos compris —, comme les
fiches 2 par page de l'outil. Le livret à plier : **3 feuilles A3 en hauteur**, imprimées recto verso
avec **retournement sur le bord court**, pliées en deux **à l'horizontale**, emboîtées et agrafées sur
le pli : on tourne les pages vers le haut.

| Page | Contenu |
|---|---|
| 1 | Couverture : « Comment ça marche ? » (la carte de l'exemple), nom, classe, sommaire des 4 fiches |
| 2 | **Un exemple résolu — « Le système pas à pas »** : la carte et toute sa correction en barres (les blocs de l'outil) |
| 3 | **« À toi ! » — « La même sorte de carte »** : le même schéma, vide (pointillés), à compléter ; rempli dans les corrigés |
| 4-5, 6-7, 8-9, 10-11 | **Les quatre fiches** : une fiche = 4 cartes sur la double page (2 cartes par page, l'impression 2 par page de l'outil) |
| 12 | Le dos : « Encore des cartes ! » (trois séries), « La suite du voyage », **« Le défi ! »** (deux cartes plus dures, corrigées au dos des corrigés, avec le QR « D'autres défis en ligne » : séries 13 et 14), crédits et logos |

Imposition (haut, bas) de chaque face, de la feuille du dehors à celle du milieu :
`(12, 1) (2, 11) (10, 3) (4, 9) (8, 5) (6, 7)`. Vérifiée par une simulation du pliage et pixel par
pixel contre le PDF page par page (notice du lot M4-4).

## Les PDF produits

| Livret | Fiches | PDF |
|---|---|---|
| `systeme` — **SPLAT! Système** | 25 Je retire · 26 Je remplace · 27 J'additionne · 28 À toi de choisir | `outils/livret_splat_systeme.pdf` · `…_a_plier.pdf` |
| `tour2` — **SPLAT! Système · cycle 4** | 25d Je recopie, puis je retire · 26d Deux fois ou trois fois ? · 27d Deux gestes à la suite · 28d À toi de choisir | `outils/livret_splat_systeme_tour2.pdf` · `…_a_plier.pdf` |
| + deux corrigés chacun (pour tous) | les mêmes cartes | **avec les taches** : `…_correction.pdf` · `…_correction_a_plier.pdf` ; **en lettres** : `…_correction_lettre.pdf` · `…_correction_lettre_a_plier.pdf` |
| + le livret 2 seulement, un 3e (lot M4-8) | les mêmes cartes | **en équations** : `…_tour2_correction_equations.pdf` · `…_tour2_correction_equations_a_plier.pdf` |

Le PDF **page par page** (12 pages A4 en largeur, ordre de lecture) porte le logo de l'IREMI seul
dans le bandeau de chaque fiche (un collègue qui imprime une seule fiche n'a pas le dos) ; le livret
**à plier** n'a aucun logo sur ses fiches. Couverture et pages 2-3 : aucun logo. Au dos : IREMI +
maths&go, puis l'Unité apprenante Michel Debré.

## Les fiches : réglages et graines triées (lots M4-4 et M4-6)

`S25` … `S28D` (dans `render.py`) sont **aussi** les adresses de la carte des mondes (`SYS_FICHES`,
`SYS_TOUR2`) et de la page courte des QR ; `tests/livret-splat-systeme.test.mjs` et
`tests/splat-systeme-carte-mondes.test.mjs` les comparent. Les graines sont triées pour que chaque
carte ait son type, dans l'ordre de la fiche (`TYPES`, vérifié au rendu : `render.py` s'arrête si
une graine a bougé) :

| Fiche | Types (classification du monde 4, `sysTypeCarte`) |
|---|---|
| 25 Je retire | 1b une tache de plus · 1a partie connue · 1c je partage · 2a le petit plateau tient deux fois |
| 26 Je remplace (`sens=INDICE`) | 1d trois couleurs · 1e l'escalier · 1d · 2d le double dépasse |
| 27 J'additionne (`forme=MIX`) | 3a miroir 1-2 · 3b trois paires · 3a miroir 2-3 · 3a+ miroir 1-3 |
| 28 À toi de choisir | 1c · 3a+ (même premier plateau 1 + 3) · 2d · 3a (même premier plateau 2 + 3) : deux cartes qui se ressemblent par page, pas le même geste (`JUMELLES`, vérifié au rendu) |
| 25d Je recopie, puis je retire (`fois=2`) | 3c·2 ×4 ; le plateau à recopier à droite sur les cartes 2 et 4 (`A_DROITE`, vérifié au rendu), avec 2 taches de la 1re couleur sur la carte 4 |
| 26d Deux fois ou trois fois ? (`fois=MIX`) | 3c·3 · 3c·2 · 3c·3 · 3c·2 ; le plateau à recopier à droite sur les cartes 2 et 4 |
| 27d Deux gestes à la suite | 4e·1c je retire · 4e·3a j'additionne · 4e·3c·2 je recopie (corrigé à 89 %, la seule carte réduite permise : `REDUITE_PERMISE`) · 4e·2d le double dépasse |
| 28d À toi de choisir (`ordre=MELANGE`) | 1d avec un jeton visible (`JETONS`) · 3b · 3c·3 · 4e·3a, plateaux mélangés |

**Le livret 2 (cycle 4, lot M4-7)** : totaux 50 à 100 (tous les totaux de 30 à 100, valeurs ≥ 5) ;
sous chaque carte des fiches et du défi, **« Le système »** — une ligne par plateau, l'une sous
l'autre, avec l'accolade, où l'élève écrit l'équation de chaque plateau (`systeme=1` dans
l'impression 2 par page de l'outil, `drawSysLigneSysteme`) ; page 2, la même ligne remplie sur la
carte de l'exemple (« N + 3 × B = 58 ») ; page 3, à remplir (remplie dans les corrigés), et le
schéma à remplir n'écrit pas le système à côté des barres.

**« Trois paires » (3b, lot M4-4b, 04/10/2026)** : l'élève ne voit que les trois paires, chacune
avec son total — le plateau « TOTAL ? » (les trois couleurs, sans total) n'est plus dessiné, ni sur
l'énoncé, ni sur l'énoncé dévoilé des corrigés, ni à l'écran (« c'est à l'élève de trouver le
total », sinon on donne la clé). Il reste dans les données de la carte : le corrigé garde toutes ses
étapes (« J'additionne : je range en 2 grands plateaux », « Je partage »…). Dans le désordre (28d),
c'est l'ordre des trois paires montrées qui est mélangé.

Partout : totaux tous différents dans une fiche (ceux des petits plateaux compris), deux cartes jamais de la même paire de couleurs,
plus petite valeur ≥ 3, aucune carte en double sur les deux livrets, les exemples et les défis
(`controle_global`). Les cartes rendues sont dans `cartes.json`.

**Ne jamais changer une graine sans refaire les PDF, la carte des mondes et la page courte.**

## Les corrigés

- **Avec les taches** : le nom de la couleur dans chaque tache ; **en lettres** : l'initiale
  (`unknown=letter`, comme l'appli : N, B, O, R, Ve, Vi), au centre de la case teintée — plus de
  bande de couleur en haut des cases depuis le lot M4-7 (14/10/2026, choix de Gwenaël).
- **Deux gestes à la suite** (lot M4-7) : chaque plateau dessiné une fois — « Le grand plateau »,
  puis « Les deux petits plateaux » (avant : « Les trois plateaux », qui redessinait les petits :
  le corrigé 2 par page était toujours réduit).
- Le livret 2 : les corrigés **en lettres d'abord** sur la page des livrets.
- **Le système écrit** à côté des barres de « Les deux plateaux », chacun dans sa langue :
  « 3 noires + 4 rouges = 53 » / « 3 × N + 4 × R = 53 » (jamais « 3N ») — seulement s'il y a la
  place, et alors tout le système, en un seul corps. C'est l'outil qui l'écrit (`sysSystemeEcrit`,
  `drawSysSystemeEcrit` dans `outils/splat.html`), donc pareil en projection.
- **En équations** (livret 2 seulement, lot M4-8, 14/10/2026, idée de Gwenaël) : les équations
  seules, étape par étape, sans les barres ni le dessin de la carte, « vers la seconde » : les
  systèmes avec leur accolade ; « Je recopie 2 fois le plateau 58 » écrit 2 × (N + 3 × B) = 2 × 58,
  puis le nouveau système ; « Je retrouve le plateau 46 dedans » écrit (2 × N + B) + 5 × B = 116,
  puis 46 + 5 × B = 116 ; « J'additionne » écrit la somme des équations, puis la range
  (5 × (Ve + O) = 160). C'est l'outil qui les écrit (`corrige=equations`, `sysEquationsMorceaux`,
  `drawSysCorrectionEquations`), à partir du plan : rien n'est recalculé, et chaque réécriture est
  vérifiée comme une égalité de polynômes (test `splat-systeme-m4-8-corrige-equations`). Une
  colonne, corps 50 au plus, les deux cartes d'une page au même corps ; aucune carte réduite.
  La page 2 montre l'exemple en équations ; la réponse encadrée reste en mots (« noire = 16 »).
- Les cartes sont vérifiées identiques entre l'élève et les corrigés (`render.py` s'arrête sinon).

## Les QR codes passent par une page courte

`https://mathsgo.re/splat/systeme/livret/?f=25` … `?f=28` et `?f=25d` … `?f=28d` ouvrent la série en
ligne de la fiche (les mêmes cartes ; l'étoile `sys25`… ou la tache dorée `sys25d`…) ; `?s=7` …
`?s=14` ouvrent une série du dos (sans graine, `&cards=4&unknown=question&eleve=1` — huit cartes jusqu'au 08/10/2026). Les séries 1 à 6
des livrets du 25/09 (jamais distribués) restent servies. Le QR est imprimé **une fois par fiche**, en
haut de sa première page.

| Série | Livret | Réglages |
|---|---|---|
| 7 Je retire | 1 | comme la fiche 25 : partie connue, une tache de plus, je partage, le petit tient deux fois |
| 8 Je remplace, j'additionne | 1 | comme les fiches 26 et 27 : trois couleurs, l'escalier, le double dépasse, miroirs, trois paires |
| 9 Tout mélangé | 1 | tous les gestes du livret 1 |
| 13 Le défi (QR du dos) | 1 | je recopie un plateau, 2 ou 3 fois (`geste=RECOPIE&fois=MIX`) |
| 10 Je recopie | 2 | comme les fiches 25d et 26d (2 ou 3 fois), totaux 50 à 100 |
| 11 Deux gestes à la suite | 2 | comme la fiche 27d |
| 12 Le grand défi | 2 | tous les gestes des deux livrets, des jetons, le désordre |
| 14 Le défi (QR du dos) | 2 | je recopie 4 fois ; deux gestes, le double dépasse — en désordre (les deux cartes du défi en sont une graine) |

## Régénérer

```bash
cd _sources/livret-splat-systeme
python3 render.py                 # les deux livrets, l'élève et les corrigés (3 pour le livret 2)
python3 render.py systeme         # un seul livret (systeme | tour2)
python3 render.py --eleve         # seulement l'élève
python3 render.py --correction    # seulement les corrigés
python3 render.py --qr            # en refabriquant d'abord les QR codes
python3 render.py --vignettes     # les vignettes de la page des livrets (page 1 à 120 dpi)
python3 render.py --page3-suite   # (non retenu) l'exemple résolu sur les pages 2 et 3, sans « À toi ! »
```

Dépendances : `playwright` **1.56.0** (+ chromium), `pikepdf`, `qrcode[pil]` ; `qpdf` et `pdftoppm`
s'ils sont présents. Le rendu utilise le **vrai Chromium** (`channel="chromium"`), jamais le
« headless shell ». **Ne pas régénérer ces PDF sur un poste Windows** (Segoe UI au lieu de DejaVu Sans
dans les fiches). Sous Linux aussi, vérifier d'abord que `fc-match system-ui` répond **DejaVu Sans** :
une machine où une autre police (Inter…) passe devant change toutes les largeurs de texte des fiches
(lot M4-6 : un `fonts.conf` qui écarte cette police, passé par `FONTCONFIG_FILE`, rend les PDF de
main au pixel près).

## Conventions

- Signature `mathsgo.re/splat · CC BY-NC-SA 4.0` au pied de chaque page.
- Lisible en **noir et blanc** : le cannelle ne sert qu'aux fonds, tout texte coloré est brun foncé
  (`#7c2d12`) ; le nom de la couleur est écrit sur chaque tache (l'outil). **Sur le papier** (lot du
  08/10/2026, version « C ») : liseré noir pur `#000000` épais (22 % du corps), mot 15 % plus gros
  mais jamais plus large que sa tache (`NOM_PAPIER` dans `outils/splat.html`), sur les taches des
  cartes comme dans les cases des barres ; l'écran ne change pas. Pages 2-3 : la petite carte
  s'élargit d'au plus `ELARGIR_CARTE` mm dans le blanc laissé par le dessin de droite (deuxième
  tour : 76 → 110 mm ; livret de base : le dessin prend toute la largeur, rien ne bouge).
- Crédits (au dos) : le jeu SPLAT! de Steve Wyborney ; le livret et l'outil SPLAT! Système de
  maths&go, avec l'IREMI de La Réunion (plus de ligne de crédit pour la progression, 07/10/2026).
  Les fiches, réglages, graines, livrets et PDF du Système sont le travail de
  Gwenaël Bourgault.
