# Livrets du Système — « SPLAT! Système » et « SPLAT! Système, la suite » (monde 4), 8 pages chacun, à plier

Le monde 4 de l'univers SPLAT! en deux livrets, un par partie (décision du 24/09/2026) : les dix
fiches 25 à 34, cinq par livret, avec une couverture, un exemple résolu pas à pas et une 4e de
couverture. Même fabrication que les livrets de l'Enquête (`_sources/livret-splat-enquete/`) :
**2 feuilles A3 recto-verso**, pliées et agrafées au milieu → 8 pages A4.

| Livret | Fiches | PDF produits |
|---|---|---|
| `systeme` — partie 1, **on retire** | 25 Une partie du plateau · 26 Avec des jetons visibles · 27 Une partie connue · 28 Deux pesées · 29 Le défi des plateaux | `outils/livret_splat_systeme.pdf` · `…_a_plier.pdf` |
| `suite` — partie 2, **on additionne, on double** | 30 Trois paires · 31 Doubler, puis comparer · 32 En miroir · 33 Doubler ou miroir ? · 34 Le grand défi du Système | `outils/livret_splat_systeme_suite.pdf` · `…_a_plier.pdf` |
| + quatre corrigés chacun (pour tous) | les mêmes | inconnue « ? » : `…_correction.pdf` + `…_correction_a_plier.pdf` (4 cartes par page, livret de 8 pages), `…_correction_2_par_page.pdf` (2 cartes par page, 10 pages A4 **paysage**) ; **en lettres** : `…_correction_lettre.pdf` + `…_a_plier.pdf`, `…_correction_lettre_2_par_page.pdf` |

## Les pages

1. **Couverture** — bandeau brun cannelle (le dégradé des fiches du Système), « Mon livret · Monde 4 ·
   Partie 1 » (ou 2), deux plateaux en dessin, « Comment ça marche ? » : la carte de l'exemple, le
   premier cadre de sa correction (« Le plateau entier », pour commencer — pas la réponse), la
   consigne, « Nom, prénom » + Classe, le sommaire des cinq fiches.
2. **Un exemple résolu — « Le système pas à pas »** : la même carte, puis les **cadres de la
   correction de l'outil** (`drawSysCadre`, un cadre par étape, comme au clic), chacun avec sa légende,
   la vérification et « À toi ! ». Partie 1 : une **partie connue** (graine 82 : 2 noires + 3 bleues = 54 ;
   2 noires = 30 → bleue 8, noire 15). Partie 2 : un **doubler** (graine 321 : 2 noires + 4 bleues = 42 ;
   noire + bleue = 15 → bleue 6, noire 9). Choix du 24/09/2026.
3. à 7. **Les cinq fiches**, 4 cartes par page, telles que l'outil les imprime.
8. **Dos** — « Encore des cartes ! » (trois séries, huit cartes nouvelles à chaque ouverture), « La
   suite du voyage » (partie 1 → la partie 2 ; partie 2 → le monde 5, SPLAT! Équations), « Pour se
   souvenir » (le total du plateau, une couleur = le même nombre partout, un mini-schéma du geste du
   livret : barres alignées à gauche et « reste »), « Mes fiches », crédits. **Au dos des corrigés**, à
   la place de « Pour se souvenir » : **« Tous les systèmes du collège, et où les trouver »** (le
   tableau § 0 de la conception, pour les profs ; les lignes du livret en gras) — décision du
   25/09/2026 : « on ne peut pas mettre ça sur un livret élève, il ne va rien comprendre ».

Les légendes de la page 2 disent **ce qu'on fait** (retirer, partager, doubler, comparer), sans
nombre : les nombres sont dans les cadres, dessinés par l'outil. Les textes qui citent des nombres
(couverture, haut de la page 2, conclusion) sont écrits à partir de la carte rendue
(`textes_exemple`) et vérifiés (chaque plateau refait).

## Les fiches : les adresses figées du 24/09/2026

`S25` … `S34` sont **exactement** les réglages et les graines de
`splat-systemes-fiches-25-34-adresses.md` (lot « fiches 20-34 ») : 2105, 9244, 2828, 1214, 7984,
653, 175, 609, 1287, 11674. `tests/livret-splat-systeme.test.mjs` les recopie et les compare.
Leurs cartes ne doivent jamais changer (le lot S-defi l'a prouvé carte par carte).

## Les corrigés

- **4 cartes par page** : un livret de 8 pages, comme celui de l'élève (couverture « Correction » +
  « Livret corrigé — 4 cartes par page », l'exemple, les fiches corrigées, le dos).
- **2 cartes par page** (choix du 24/09/2026 : calculs ≈ 7 pt au lieu de ≈ 5) : l'outil imprime deux
  cartes côte à côte sur une page A4 paysage. Chaque fiche tient sur **une feuille recto verso** ; le
  corrigé est la suite des cinq feuilles (10 pages), sans couverture ni pliage (une page paysage ne se
  relie pas dans un livret portrait).
- **En lettres** (25/09/2026) : les mêmes corrigés avec `unknown=letter`, comme l'appli — l'initiale de
  chaque couleur (N, B, O, R, Ve, Vi : « 2 × N + 3 × B = 54 », « B = 24 ÷ 3 = 8 »), deux inconnues donc
  deux lettres, pas un 𝑥.
- Les cartes sont vérifiées identiques entre l'élève et les quatre corrigés (`render.py` s'arrête sinon).

## Les QR codes passent par une page courte

`https://mathsgo.re/splat/systeme/livret/?f=25` … `?f=34` ouvre la série en ligne de la fiche (les mêmes
cartes, l'étoile `sys-25` … `sys-34`) ; `?s=1` … `?s=6` ouvre une série du dos (réglages des fiches,
sans graine, `&cards=8&unknown=question&eleve=1`). **Cette page est créée par le lot « six mondes »** :
si elle retient d'autres adresses, seuls les QR sont à refaire (`python3 render.py --qr`).

| Série | Livret | Réglages |
|---|---|---|
| 1 Une partie du plateau | 1 | Une partie du plateau, 0 à 3 jetons visibles |
| 2 Partie connue, deux pesées | 1 | les gestes 27 et 28 mélangés |
| 3 Le défi des plateaux | 1 | les trois gestes de la partie 1, 1 à 3 jetons visibles |
| 4 Trois paires | 2 | Trois paires |
| 5 Doubler ou miroir | 2 | les gestes 31 et 32 mélangés |
| 6 Le grand défi | 2 | les six gestes, 1 à 3 jetons visibles |

## Régénérer

```bash
cd _sources/livret-splat-systeme
python3 render.py                 # les deux livrets, l'élève et les deux corrigés
python3 render.py systeme         # un seul livret (systeme | suite)
python3 render.py --eleve         # seulement l'élève
python3 render.py --correction    # seulement les corrigés
python3 render.py --qr            # en refabriquant d'abord les QR codes
```

Dépendances : `playwright` **1.56.0** (+ chromium), `pikepdf`, `qrcode[pil]` ; `qpdf` s'il est
présent. Le rendu utilise le **vrai Chromium** (`channel="chromium"`), jamais le « headless shell ».
**Ne pas régénérer ces PDF sur un poste Windows** (Segoe UI au lieu de DejaVu Sans dans les fiches).

## Conventions

- Logos IREMI + maths&go, **un seul logo maths&go par page** ; signature `mathsgo.re/splat · CC BY-NC-SA 4.0`.
- Lisible en **noir et blanc** : le cannelle ne sert qu'aux fonds, tout texte coloré est brun foncé
  (`#7c2d12`) ; le nom de la couleur est écrit sur chaque tache (l'outil).
- Crédits : le jeu SPLAT! de Steve Wyborney et l'outil de maths&go. Les fiches, réglages, graines,
  livrets et PDF sont le travail de Gwenaël Bourgault.
