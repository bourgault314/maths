# Livret « SPLAT! Relatifs — Échauffement » (monde 6) — 8 pages, à plier

« Jetons » et plus « billes » partout où l'élève lit (23/10/2026, choix de Gwenaël) : les « billes »
1 et −1 sont des **jetons 1 et −1** (verts et rouges), sur la carte, dans le livret et dans ÉquaSplat.

Trois fiches **avant la fiche 38**, pour les élèves pas encore à l'aise avec les nombres négatifs
(décisions de Gwenaël du 14/10/2026). Elles sont dans le monde 6 et dans ses étoiles (« ⭐ 0 / 9 »
sur la carte des mondes, « sur 40 » sur la tuile du suivi) ; elles portent un **code**, pas un
numéro : la 38 reste la 38.

| Fiche | Titre | Ce qu'on y fait | Étoile |
|---|---|---|---|
| É1 | Des jetons verts et rouges | 𝑥 + b = c avec des jetons 1 et −1 : une couleur par plateau, puis un vert et un rouge qui s'annulent | `ech1` |
| É2 | Je partage les jetons | a × 𝑥 = c, puis a × 𝑥 + b = c, avec des jetons 1 et −1 : je regroupe, puis je partage | `ech2` |
| É3 | Un jeton, un nombre | les mêmes formes avec **un** jeton numéroté par plateau : le pont vers la fiche 38 | `ech3` |

Deux plateaux, comme tout le monde 6. **Aucune tache « opposé »** (la grande tache de la couverture
porte « 𝑥 »). Une seule solution nulle par fiche.

PDF produits (à la racine du dépôt) :

- `outils/livret_splat_relatifs_echauffement.pdf` · `…_a_plier.pdf`
- `outils/livret_splat_relatifs_echauffement_correction.pdf` · `…_correction_a_plier.pdf`

## Repris de `_sources/livret-splat-relatifs/`

Mêmes gabarits (`commun.css`, `couverture.html`, `dos.html`) et même machinerie (`render.py` : les
pages-fiches imprimées par l'outil, le QR dans le bandeau, aucun logo sur les fiches, le pied
`mathsgo.re/splat · CC BY-NC-SA 4.0`, l'imposition A3). Ce qui change :

- **Couverture** : « Mon livret · Monde 6 · Échauffement », la tache « 𝑥 » entourée de billes 1 / −1,
  « Comment ça marche ? » dit avec les billes (« trois billes vertes », pas « un jeton 1, un jeton 1
  et un jeton 1 »), et les deux nouveautés : les billes 1 et −1 qui s'annulent, puis le jeton qui
  porte son nombre. Le sommaire avec les codes É1 · É2 · É3.
- **Dos** : trois QR de séries (`?s=e1`, `e2`, `e3`), « La suite du voyage » vers la **fiche 38**
  et le livret 1, « Pour se souvenir » sans la ligne « opposé » (remplacée par les billes 1 / −1) et
  avec « Toutes les taches cachent le même nombre » (« sans mot » retiré : il n'y a pas de tache
  opposée ici — choix de Gwenaël du 14/10).
- **Corrigé** : la correction courte « l'équation » de l'outil, comme les autres livrets du monde 6
  (on regroupe, puis la même opération des deux côtés).

## Les cartes : celles de la carte des mondes, et celles du jeu en ligne

Rien n'est tiré ici : `FICHES` reprend **exactement** les réglages et les graines de
`outils/splat_univers.html` (`ECH_R`, `ECH_F1` … `ECH_F3`) — la liste annotée validée par Gwenaël,
une graine par carte, les 12 cartes d'une fiche enchaînées par `suite` (lot 1 de l'échauffement).
Avec des billes (« Jetons max » = 1), `xMax=6` laisse la solution dépasser ±1.

À chaque rendu, `render.py` s'arrête si une fiche n'a pas 12 cartes sur 2 pages de 6, si ses cartes
ne sont pas celles de la série « Le jeu de l'élève » de la carte des mondes, si le livret et son
corrigé diffèrent, si l'exemple de couverture est une carte du monde 6, s'il y a un 69 ou un 88, ou
si une page déborde.

`tests/splat-relatifs-echauffement.test.mjs` épingle `render.py`, la carte des mondes, la page courte
et `cartes.json` les uns sur les autres : **si une graine change**, la reporter dans la carte des
mondes (et sa série « j »), dans `splat/relatifs/livret/index.html`, puis relancer `python3 render.py`.

## L'exemple de couverture

**𝑥 + 1 + 1 + 1 = −1 − 1 − 1**, 𝑥 = −6 : trois billes vertes contre trois rouges (« ça ne s'enlève
pas »), une solution négative qui n'est dans aucune fiche (graine 2, `unites=1`, `xMax=9`). La graine
9 prévue d'abord donnait la carte 8 de la fiche É1 retournée : remplacée (choix de Gwenaël du 14/10).

## Les QR codes passent par la page courte du monde 6

- `https://mathsgo.re/splat/relatifs/livret/?f=E1` (E2, E3 ; « e1 » et « É1 » aussi) ouvre
  **exactement** le lien « Le jeu de l'élève » de la carte des mondes : ÉquaSplat, `parcours=ech1`,
  la même étoile.
- `?s=e1` … `?s=e3` : six équations tirées au hasard aux réglages d'une fiche, jouées aussitôt dans
  ÉquaSplat (`jouer=1`), sans étoile.

## Régénérer

```bash
cd _sources/livret-splat-relatifs-echauffement
python3 render.py            # le livret et son corrigé
python3 render.py --qr       # en refabriquant d'abord les QR codes
```

Dépendances : `pip install playwright pikepdf "qrcode[pil]"`, le **vrai Chromium**
(`channel="chromium"`, jamais le headless shell), FreeSerif pour la lettre, DejaVu Sans (rendu
Linux, la police de tous les livrets SPLAT!), `qpdf` s'il est installé. Puis refaire la miniature de
la page des livrets (page 1 à 120 dpi → 993 × 1404, PNG et WebP plus légère) :
`assets/img/thumbnails/splat/livret-splat-relatifs-echauffement.png/.webp`.

*mathsgo.re · CC BY-NC-SA 4.0*
