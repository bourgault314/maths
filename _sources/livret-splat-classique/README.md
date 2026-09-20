# Livret « SPLAT! classique » (monde 2, 8 pages, à plier)

Le monde 2 de l'univers SPLAT! réuni en un seul livret : couverture, les 3 fiches
dans l'ordre de la progression (fiches 7, 8 et 9 — la numérotation continue celle du
monde 1), et une 4e de couverture. Même fabrication que les livrets Petit SPLAT! du
monde 1 (`_sources/livret-petit-splat/`) : **2 feuilles A3 recto-verso**, pliées et
agrafées au milieu → 8 pages A4.

| Livret | Fiches | PDF produits |
|---|---|---|
| `normal` — Monde 2 | 7 (12 cartes de Claire), 8 et 9 (12 cartes à paquets chacune) | `outils/livret_splat_classique.pdf` · `…_a_plier.pdf` |

Le lot D (niveaux Avancé / Expert du monde 2) ajoutera ses niveaux dans `NIVEAUX`,
avec ses propres graines et ses propres QR, comme pour le monde 1.

Deux PDF :

- `…​.pdf` — 8 pages A4 dans l'ordre de lecture
  (pour lire à l'écran, ou pour le mode « Cahier/Livret » d'un photocopieur) ;
- `…_a_plier.pdf` — 4 pages A3 paysage **déjà imposées** (8|1 · 2|7 · 6|3 · 4|5) :
  impression recto-verso, retournement sur le bord court, on plie, on agrafe.

## Fichiers

- `couverture.html` — page 1 : bandeau bleu du monde 2 à coulure, la tache « ? »,
  l'exemple expliqué, « Nom, prénom » + Classe et le sommaire des trois fiches.
  **L'exemple est dessiné par l'outil lui-même** (voir plus bas) ; le SVG écrit dans
  le fichier n'est qu'un aperçu, remplacé au rendu.
- `dos.html` — page 8 : « Encore des cartes ! » (4 QR, séries de 12 cartes tirées au
  hasard), « La suite du voyage » vers l'univers (monde 3), « Pour se souvenir »
  (total, jeton et paquet, tache et « ? », et surtout : *sous chaque carte, c'est à toi
  de dessiner le schéma en barres ou d'écrire l'équation* — sans réécrire l'équation : l'exemple,
  écrit par l'outil, est sur la couverture), grille « Mes fiches », crédits, licence.
- `commun.css` — la charte des deux pages (Poppins, bleu `#0b67b2` du monde 2 — le
  même dégradé que le bandeau imprimé des fiches depuis le lot B).
- `qr/` — les QR codes, en PNG noir et blanc : `fiche7/8/9.png`, `univers.png`,
  `serie-1..4.png`.
- `render.py` — régénère les PDF. Tous les réglages sont dans `FICHES` et `NIVEAUX`.

Les fiches elles-mêmes ne sont **pas** redessinées ici : `render.py` les demande à
l'outil du site (`outils/splat.html`, réglage « Énoncé seul, 6/page » du lot B) avec les
graines de la carte des mondes, et ajoute le QR dans le bandeau juste avant
l'impression. Les livrets suivent donc automatiquement toute évolution de l'outil
(jetons, cadres, taches qui ne se touchent plus, jetons numérotés plus gros…).

## Les graines : celles de la carte des mondes

Rien n'est trié ici : les cartes sont **exactement** celles que l'élève joue depuis
`outils/splat_univers.html` (`MONDES[1]`).

- fiche 7 = les trois activités de Claire (`M2A1`, `M2A2`, `M2A3` : graines 974, 477,
  478, 4 cartes chacune) mises bout à bout, comme la série en ligne les enchaîne avec le
  paramètre `suite` ;
- fiche 8 = étape « Avec des paquets de jetons » (graine 347), fiche 9 = « Le défi »
  (graine 18). Ces deux étapes sont passées de 10 à **12 cartes** le 19/09/2026 (les 10
  premières cartes n'ont pas changé, deux se sont ajoutées à la fin) pour remplir les
  deux pages de chaque fiche (6 + 6) au lieu de laisser deux cases vides.

`tests/livret-splat-classique.test.mjs` épingle les constantes de `render.py` et les
cibles de la page courte des QR sur celles de la carte des mondes : **si une graine
change** dans `splat_univers.html`, le test le dit ; reporter la graine ici et dans
`splat/classique/livret/index.html`, puis relancer `python3 render.py --qr`.

## Le QR de chaque fiche passe par une page courte

L'adresse complète de la fiche 7 (les trois activités mises bout à bout) dépasse 500
caractères : un tel QR ne se lit plus à 17 mm, surtout photocopié. Les trois fiches
pointent donc vers `https://mathsgo.re/splat/classique/livret/?f=7` (8, 9), une page
hors index qui renvoie vers l'adresse complète — **la même que le lien « Le jeu de
l'élève » de la carte des mondes**, donc la même étape (`parcours=m2eN`), les mêmes
cartes et la même empreinte de reprise (`enCours.sig`, lot A). Sans script, la page
liste les trois liens.

## L'exemple de couverture

Il n'est pas dessiné à la main et n'est **pas une carte du livret** : `render.py` ouvre
l'outil sur `NIVEAUX[…]["exemple"]["query"]` (mode N — paquets de jetons —, une tache,
graine fixe 5264 choisie le 19/09/2026 : total 37, paquets 10 et 6, la tache cache 21),
demande la **correction** de la carte (`renderCardIntoSvg(…, 'correction')` : la carte
avec la tache transparente, le schéma en barres et l'équation résolue avec ses flèches « − 16 »)
et la place en deux fenêtres sur la couverture : la carte à gauche, le schéma en barres et
l'équation à droite. L'exemple est donc écrit exactement comme la correction que le
professeur projette. L'inconnue y est le « ? » de l'outil élève (cycle 3) ; une version
« avec la lettre » (`unknown=letter`) pour le cycle 4 est envisagée, pas faite.

## Régénérer

```bash
cd _sources/livret-splat-classique
python3 render.py                 # le livret
python3 render.py --qr normal     # en refabriquant d'abord ses QR codes
```

Dépendances : `playwright` (+ chromium), `pikepdf`, `qrcode[pil]`. `qpdf`, s'il est
présent, divise le poids des PDF par deux. Les fiches sont imprimées avec les marges de
l'outil (`@page` 8 mm, `prefer_css_page_size`), la couverture et le dos sans marge.

## Conventions

- Logos IREMI + maths&go dans le bandeau des 8 pages ; rien dans le pied, hormis la
  signature `mathsgo.re/splat · CC BY-NC-SA 4.0` (gris moyen `#64748b`, 10 px sur la
  couverture et le dos, 7 pt sur les fiches — lisible en photocopie). L'outil écrit
  `mathsgo.re/splat/classique` au pied des fiches ; `render.py` le repointe vers
  `/splat` (la collection SPLAT du catalogue), comme le livret du monde 1.
- Tout reste lisible imprimé en **noir et blanc** : aucun texte en couleur claire,
  aucune page en aplat teinté ; le QR est dans une boîte blanche sur le bandeau.
- Le QR dans le bandeau coûte 3 mm de hauteur par rangée de cartes : 31,5 mm de blanc
  sous chaque plateau (mesuré sur le PDF) au lieu de 34,6 mm sur la fiche imprimée
  depuis la carte des mondes.
- Vocabulaire (textes de Claire, 20/09/2026) : « jetons », « paquet de jetons » (un jeton
  avec un nombre). On ne nomme PAS la forme du paquet : il est dessiné comme un rond laissé
  blanc à l'intérieur, pour que le nombre se lise — ni « disque » (il n'est pas plein), ni
  « cercle » (ce n'est pas un autre objet que le jeton), ni « rond ».
  Puis « tache », « ? », « schéma en barres » — jamais « tableau ».
- Chaque fiche tient sur deux pages : la seconde porte « Fiche N bis — … » (`JS_BIS`).
- L'imposition A3 passe par **pikepdf** et `add_overlay` (voir le README du monde 1 :
  avec pypdf, les dégradés ne suivent pas).
