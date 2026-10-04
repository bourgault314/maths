# Livrets du Système — « SPLAT! Système » et son « Deuxième tour » (monde 4), format « tablette »

Le monde 4 de l'univers SPLAT! en deux livrets de 12 pages (lot M4-4, 04/10/2026, décisions de
Gwenaël sur planches) : **un livret pour tous**, quatre fiches (25 à 28), une idée par fiche ; puis
**le deuxième tour**, plus dur (25d à 28d) — le Bonus du monde 4 sur la carte des mondes, comme au
monde 3. Les fiches 29 à 34 restent libres ; SPLAT! Équations garde 35.

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
| 12 | Le dos : « Encore des cartes ! » (trois séries), « La suite du voyage », **« Le défi ! »** (deux cartes plus dures, corrigées au dos des corrigés), crédits et logos |

Imposition (haut, bas) de chaque face, de la feuille du dehors à celle du milieu :
`(12, 1) (2, 11) (10, 3) (4, 9) (8, 5) (6, 7)`. Vérifiée par une simulation du pliage et pixel par
pixel contre le PDF page par page (notice du lot M4-4).

## Les PDF produits

| Livret | Fiches | PDF |
|---|---|---|
| `systeme` — **SPLAT! Système** | 25 Je retire · 26 Trois couleurs · 27 Je double · 28 J'additionne | `outils/livret_splat_systeme.pdf` · `…_a_plier.pdf` |
| `tour2` — **SPLAT! Système, deuxième tour** | 25d L'escalier · 26d Je triple · 27d Avec des jetons visibles · 28d Dans le désordre | `outils/livret_splat_systeme_tour2.pdf` · `…_a_plier.pdf` |
| + deux corrigés chacun (pour tous) | les mêmes cartes | **avec les taches** : `…_correction.pdf` · `…_correction_a_plier.pdf` ; **en lettres** : `…_correction_lettre.pdf` · `…_correction_lettre_a_plier.pdf` |

Le PDF **page par page** (12 pages A4 en largeur, ordre de lecture) porte le logo de l'IREMI seul
dans le bandeau de chaque fiche (un collègue qui imprime une seule fiche n'a pas le dos) ; le livret
**à plier** n'a aucun logo sur ses fiches. Couverture et pages 2-3 : aucun logo. Au dos : IREMI +
maths&go, puis l'Unité apprenante Michel Debré.

## Les fiches : réglages et graines triées (lot M4-4)

`S25` … `S28D` (dans `render.py`) sont **aussi** les adresses de la carte des mondes (`SYS_FICHES`,
`SYS_TOUR2`) et de la page courte des QR ; `tests/livret-splat-systeme.test.mjs` et
`tests/splat-systeme-carte-mondes.test.mjs` les comparent. Les graines sont triées pour que chaque
carte ait son type, dans l'ordre de la fiche (`TYPES`, vérifié au rendu : `render.py` s'arrête si
une graine a bougé) :

| Fiche | Types (classification du monde 4) |
|---|---|
| 25 Je retire | 1a partie connue · 1b une tache de plus · 1c je partage · 1c |
| 26 Trois couleurs | 1d ×4 |
| 27 Je double (`sens=MIX`, réglage ajouté au lot) | 2a ×3 · 2d le petit recopié dépasse |
| 28 J'additionne | 3a en miroir ×3 · 3b trois paires |
| 25d L'escalier | 1e ×4 |
| 26d Je triple | 2b ×4 |
| 27d Avec des jetons visibles | 1a · 1d · 2a · 3a, avec des jetons |
| 28d Dans le désordre | 1b · 1d · 2a · 3b, plateaux mélangés |

Partout : totaux tous différents dans une fiche, deux cartes jamais de la même paire de couleurs,
plus petite valeur ≥ 3, aucune carte en double sur les deux livrets, les exemples et les défis
(`controle_global`). Les cartes rendues sont dans `cartes.json`.

**Ne jamais changer une graine sans refaire les PDF, la carte des mondes et la page courte.**

## Les corrigés

- **Avec les taches** : le nom de la couleur dans chaque tache ; **en lettres** : l'initiale
  (`unknown=letter`, comme l'appli : N, B, O, R, Ve, Vi).
- **Le système écrit** à côté des barres de « Les deux plateaux », chacun dans sa langue :
  « 3 noires + 4 rouges = 53 » / « 3 × N + 4 × R = 53 » (jamais « 3N ») — seulement s'il y a la
  place, et alors tout le système, en un seul corps. C'est l'outil qui l'écrit (`sysSystemeEcrit`,
  `drawSysSystemeEcrit` dans `outils/splat.html`), donc pareil en projection.
- Les cartes sont vérifiées identiques entre l'élève et les deux corrigés (`render.py` s'arrête sinon).

## Les QR codes passent par une page courte

`https://mathsgo.re/splat/systeme/livret/?f=25` … `?f=28` et `?f=25d` … `?f=28d` ouvrent la série en
ligne de la fiche (les mêmes cartes ; l'étoile `sys25`… ou la tache dorée `sys25d`…) ; `?s=7` …
`?s=12` ouvrent une série du dos (sans graine, `&cards=8&unknown=question&eleve=1`). Les séries 1 à 6
des livrets du 25/09 (jamais distribués) restent servies. Le QR est imprimé **une fois par fiche**, en
haut de sa première page.

| Série | Livret | Réglages |
|---|---|---|
| 7 Je retire | 1 | partie connue, une tache de plus, trois couleurs |
| 8 Je double, j'additionne | 1 | doubler (les deux sens), miroir, trois paires |
| 9 Tout mélangé | 1 | les six gestes |
| 10 L'escalier | 2 | l'escalier |
| 11 Je triple | 2 | doubler, 3 fois |
| 12 Le grand défi | 2 | tous les gestes, escalier compris, des jetons, le désordre |

## Régénérer

```bash
cd _sources/livret-splat-systeme
python3 render.py                 # les deux livrets, l'élève et les deux corrigés
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
dans les fiches).

## Conventions

- Signature `mathsgo.re/splat · CC BY-NC-SA 4.0` au pied de chaque page.
- Lisible en **noir et blanc** : le cannelle ne sert qu'aux fonds, tout texte coloré est brun foncé
  (`#7c2d12`) ; le nom de la couleur est écrit sur chaque tache (l'outil).
- Crédits (au dos) : le jeu SPLAT! de Steve Wyborney ; le livret et l'outil SPLAT! Système de
  maths&go, avec l'IREMI de La Réunion ; merci à Claire pour la progression « SPLAT! cycle 3 », ses
  idées et sa relecture. Les fiches, réglages, graines, livrets et PDF du Système sont le travail de
  Gwenaël Bourgault.
