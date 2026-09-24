# Livrets « SPLAT! Équations » (monde 5) — 8 pages chacun, à plier

Les trois fiches du monde 5 de l'univers SPLAT! — **35 Premières équations**, **36 Des paquets
de jetons**, **37 Des taches des deux côtés** — en deux livrets aux **mêmes 36 cartes** (lot Q3,
24/09/2026). Même fabrication que les livrets des mondes 1 à 4 : **2 feuilles A3 recto-verso**,
pliées et agrafées au milieu → 8 pages A4.

| Livret | Les cartes | L'élève… | PDF produits |
|---|---|---|---|
| `schema` | plateaux l'un sur l'autre (vue Schéma de l'outil), plateau à gauche de la case | dessine le **schéma en barres** à droite | `outils/livret_splat_equations_schema.pdf` · `…_a_plier.pdf` |
| `equation` | plateaux côte à côte (vue Équation), plateau à 80 % de la case | écrit l'**équation** dessous | `outils/livret_splat_equations_equation.pdf` · `…_a_plier.pdf` |

Deux formats pour chacun :

- `….pdf` — 8 pages A4 dans l'ordre de lecture (pour l'écran, ou le mode « Livret » d'un photocopieur) ;
- `…_a_plier.pdf` — 4 pages A3 paysage **déjà imposées** (8|1 · 2|7 · 6|3 · 4|5) :
  impression recto-verso, retournement sur le **bord court**, on plie, on agrafe.

Décisions de Gwenaël (23 et 24/09/2026) : deux livrets aux mêmes cartes ; 6 cartes par page ;
plateaux imprimés gardés à leur taille (80 % en équation, 100 % en schéma — comparés à 70 et 60 %
sur planches) ; inconnue en **lettre** seulement ; la phrase « Même quantité… » sur chaque carte ;
au dos, trois séries de six équations au hasard. Le mot « tableau » n'est pas employé : « schéma
en barres » partout (demande de Claire). Les corrigés viendront au lot Q4, « Le défi » au lot Q5.

## Les 8 pages

1. **Couverture** — bandeau teal (le monde 5 de la carte des mondes, comme le bandeau imprimé
   des fiches), « Mon livret · Monde 5 · Le schéma en barres » (ou « · L'équation »), la tache
   marquée d'une lettre, « Comment ça marche ? » (l'exemple, voir plus bas), « Nom, prénom » +
   Classe, le sommaire des trois fiches.
2. et 3. **Fiche 35**, puis « Fiche 35 bis » — 6 cartes par page, telles que l'outil les imprime.
4. et 5. **Fiche 36** et 36 bis. 6. et 7. **Fiche 37** et 37 bis.
8. **Dos** — « Encore des cartes ! » (trois QR), « La suite du voyage » (le monde 6, SPLAT!
   relatifs), « Pour se souvenir », « Mes fiches » (une étoile à colorier par fiche), crédits.

Dans le bandeau des fiches, le nom de l'outil est écrit sur **deux étages**, « Splat! » puis
« Équations » en plus petit (décision du 24/09/2026) : sur une seule ligne, une fois la boîte du QR
posée, il ne laissait que 3 cm au titre de la fiche, et « Des taches des deux côtés » ne tenait pas
sur deux lignes.

« Pour se souvenir » (dos, décision du 24/09/2026) dit une règle **juste et générale** : la même
opération des deux côtés (ajouter, enlever ou partager) garde la même quantité ; le but est de
garder une seule tache d'un côté. Le livret schéma parle des **plateaux** (« en haut et en bas »)
et ses icônes sont des schémas en barres, la part enlevée hachurée — pas de flèche ; le livret
équation montre les flèches de l'outil, du haut vers le bas. La lettre (𝑥, 𝑛…) est partout le
caractère arrondi de l'appli (police FreeSerif, voir `commun.css`).

## Fichiers

- `couverture.html`, `dos.html` — les deux pages dessinées ici. Les textes propres à chaque
  livret (sur-titre, accroche, consignes, rappel du dos) sont écrits par `render.py` (`VUES`) ;
  les textes qui parlent de l'exemple sont **écrits à partir de la carte rendue**
  (`textes_exemple`) : ils ne peuvent pas mentir sur ses nombres.
- `commun.css` — la charte (Poppins, teal `#08aaa5` pour les fonds, teal foncé `#115e59` pour
  tout texte coloré : lisible en noir et blanc).
- `qr/` — les QR codes en PNG noir et blanc : `fiche35…37.png`, `serie-1…3.png`, `univers.png`.
- `cartes.json` — les 36 cartes et l'exemple, tels que `render.py` vient de les rendre (relu par
  `tests/livret-splat-equations.test.mjs`).
- `render.py` — régénère les PDF. Tous les réglages sont en tête de fichier.

## Les fiches : celles de la carte des mondes, et celles du jeu en ligne

Rien n'est tiré ici : `EQ5_S1` … `EQ5_DEUX_COTES` sont **exactement** les réglages et les graines
de `outils/splat_univers.html` (lot Q2) — fiche 35 : graines 355, 814, 19 mises bout à bout
(paramètre `suite`), fiche 36 : graine 89, fiche 37 : graine 25, 12 cartes chacune. Les fiches sont
imprimées par l'outil (`outils/splat_equations.html`, 6/page, énoncé seul) à la même adresse que
les liens « Fiche » de la carte des mondes.

À chaque rendu, `render.py` s'arrête si :

- une fiche n'a pas 12 cartes sur 2 pages de 6 ;
- ses cartes ne sont pas **exactement** celles de la série « Le jeu de l'élève » de la carte des
  mondes (relue dans `splat_univers.html`, décodée, comparée carte par carte avec la conversion
  de l'outil `carteDuJeuEquaSplat`) ;
- les deux livrets n'ont pas les mêmes cartes ;
- l'exemple de couverture est une des 36 cartes ;
- la couverture ou le dos déborde de la page.

`tests/livret-splat-equations.test.mjs` épingle `render.py`, la page courte des QR et la carte des
mondes les uns sur les autres : **si une graine change**, la reporter ici et dans
`splat/equations/livret/index.html`, puis relancer `python3 render.py`.

## Les QR codes passent par une page courte

- `https://mathsgo.re/splat/equations/livret/?f=35` (36, 37) ouvre **exactement** le lien « Le jeu
  de l'élève » de la carte des mondes : ÉquaSplat, `parcours=m3e1` (`m3e2`, `m3e4`), la série
  écrite en entier dans l'adresse (plus de 2 000 caractères : un QR direct ne se lirait plus à
  17 mm). Mêmes équations que la fiche, même étoile, même reprise.
- `?s=1`, `?s=2`, `?s=3` : les séries du dos. La page envoie vers l'outil avec les réglages d'une
  fiche **sans graine** et `jouer=1` : l'outil tire **six** équations et les ouvre aussitôt dans le
  jeu de l'élève d'ÉquaSplat (la barre « Équation 1 / 6 », les pastilles), **sans parcours** —
  aucune étoile, rien d'enregistré ; un nouveau scan donne six nouvelles équations.

| Série | Réglages |
|---|---|
| 1 Un par un | les trois formes de la fiche 35, 2 + 2 + 2 (`suite`) |
| 2 Des paquets | les réglages de la fiche 36 |
| 3 Des deux côtés | les réglages de la fiche 37 |

- `?f=35d` à `?f=37d` sont réservés au livret « Le défi » (lot Q5).

## L'exemple de la couverture

Une carte à paquets, taches d'un seul côté, qui n'est dans **aucune fiche** : graine 79,
**3𝑛 + 12 = 27** — trois taches et deux paquets (7 et 5) d'un côté, deux paquets (10 et 17) de
l'autre, 𝑛 = 5 : les trois gestes de la fiche 36 (regrouper, enlever, partager) sur une carte.
Aucun nombre à sous-entendu, pas de paquet « 1 », une solution qui n'est ni 1 ni 2.

Deux fenêtres, **toutes deux dessinées par l'outil** :

1. « La carte » : les plateaux de la fiche (la vue du livret), les taches **transparentes** —
   c'est le dernier état de la résolution pas à pas de l'outil (« je vérifie »), sans texte ;
2. « Le schéma en barres » ou « L'équation » : la correction imprimée du mode « Équation » de
   l'outil, dont `render.py` ne garde que les trois schémas en barres (livret schéma) ou
   l'équation fléchée (livret équation).

La lettre de l'exemple est un caractère mathématique (𝑛) : `render.py` nomme sa police (FreeSerif,
`CSS_X`), comme les corrigés en lettre de l'Enquête (`apt install fonts-freefont-ttf`).

## Régénérer

```bash
cd _sources/livret-splat-equations
python3 render.py            # les DEUX livrets
python3 render.py schema     # un seul (schema | equation)
python3 render.py --qr       # en refabriquant d'abord les QR codes
```

Dépendances : `pip install playwright pikepdf "qrcode[pil]"`. Le **vrai Chromium**
(`channel="chromium"`), pas le « headless shell », qui espace les lettres d'environ 5 %. `qpdf`
s'il est installé (les PDF pèsent deux fois moins). Puis refaire les miniatures de la page des
livrets (page 1 à 120 dpi → 993 × 1404, en PNG et en WebP plus légère) :
`assets/img/thumbnails/splat/livret-splat-equations-schema.png/.webp` et `…-equation.png/.webp`.

*mathsgo.re · CC BY-NC-SA 4.0 — d'après la progression « SPLAT! cycle 3 » de Claire.*
