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
en barres » partout (demande de Claire). Les corrigés sont venus au lot Q4, « Le défi » au lot Q5
(voir la fin de ce fichier).

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

Correctif du 24/09/2026 (relevé par Code sur la PR #828) : les petits dessins du dos écrivent la
**lettre de l'exemple** (𝑛, pas 𝑥 : « comme l'exemple de la couverture ») — `render.py` s'arrête si
l'exemple change sans eux ; l'équation du dos est en Times italique comme la correction de l'outil ;
le moins est le tiret « – » de Poppins (son vrai « − » est plus court qu'un tiret et se lit « - »).

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

*mathsgo.re · CC BY-NC-SA 4.0*

## Le livret « Le défi » (lot Q5, 25/09/2026)

`python3 render.py defi` → `outils/livret_splat_equations_equation_defi.pdf` (+ `_a_plier`) et son
corrigé par l'équation `…_equation_defi_correction.pdf` (+ `_a_plier`). **Famille équation
seulement** (plateaux côte à côte à 80 %, l'élève écrit l'équation), la lettre seulement.

Les mêmes fiches 35, 36, 37, des cartes plus dures : **paquets numérotés partout, 2 ou 3 par
côté, totaux de 50 à 100**. Fiche 35 « De deux à quatre taches » (un seul côté), 36 « Jusqu'à six
taches » (un seul côté, 4 à 6), 37 « Le grand défi : des deux côtés ». Liste annotée des 36
équations validée par Gwenaël le 25/09 (`LISTE-annotee-Q5-36-equations-defi.md`, hors dépôt).

### Le choix des graines

L'outil des Équations n'a qu'un **maximum** de taches, et une carte sur 10 à 15 seulement passe les
règles du défi. Chaque fiche est donc bâtie en **trois séries de 4 cartes enchaînées par
`suite`** (comme le défi du monde 2), tirées parmi plus de 300 millions de séries (l'outil rejoué
dans Chromium : `genEquationStep` + `assignPositionsEquation`, la suite de hasard de `generate()`),
en ne gardant que celles dont les quatre cartes passent :

1. solution de 6 à 30, jamais un multiple de 5 (le partage ne se devine pas) ;
2. paquets de 5 à 79, jamais un nombre rond, jamais deux paquets égaux du même côté ;
3. au moins 20 dans les paquets du côté des taches (fiches 35-36) : l'addition vaut la peine ;
4. des deux côtés (fiche 37) : au moins deux taches à partager une fois les plus petites retirées ;
5. aucun nombre à sous-entendu, ni sur la carte ni dans les calculs ;
6. par série : 4 lettres et 4 solutions différentes, des cartes à 2 et à 3 paquets, la tache
   tantôt à gauche, tantôt à droite ; par fiche : 12 équations différentes, chaque lettre au plus
   deux fois, jamais deux fois de suite, la première carte commence par la lettre ; 36 équations
   différentes, aucune des fiches de base.

**Ne pas changer une graine sans refaire le tri**, la page courte et les PDF.

### Les QR, l'étoile, la reprise

- Fiche : `splat/equations/livret/?f=35d` (36d, 37d) → ÉquaSplat sur les 12 équations exactes de
  la fiche, **sous la même étoile** que la fiche de base (`m3e1`, `m3e2`, `m3e4`). Ces séries ne
  sont pas sur la carte des mondes : elles ont été fabriquées par l'outil (`carteDuJeuEquaSplat`,
  `encodeEquabarPayload`) et `render.py` vérifie à chaque rendu que les fiches imprimées sont
  exactement celles de la page courte (`series_du_defi`).
- ÉquaSplat garde une **empreinte** de la série en cours (`eleveSignatureSerie`) : la fiche 35
  et la fiche 35 du défi ne se mélangent pas à la reprise. Une série commencée avant ce lot
  repart à l'équation 1 (l'étoile déjà gagnée reste).
- Dos : **deux** QR de 32 mm (`?s=d1`, `?s=d2`) — six équations au hasard aux réglages du défi,
  d'un seul côté, puis des deux côtés, sans étoile.

### Couverture et dos

`Mon livret · Monde 5 · Le défi`, « Des paquets, des taches… et des totaux jusqu'à 100 ! ».
L'exemple (choisi sur planche, « B ») : **4𝑎 + 38 = 86**, 𝑎 = 12 (graine 250, `EXEMPLE_DEFI`) —
aucune carte des deux groupes de livrets (`cles_connues()`). Les petits dessins de « Pour se
souvenir » sont ceux du livret équation, écrits avec les nombres de cet exemple
(`dessins=(4, 38, 86, 12)`, `render.py` s'arrête s'ils ne correspondent plus).

`cartes.json` porte les deux groupes : les 36 cartes de base (`fiches`, `exemple`) et celles du
défi (`defi`). Un rendu d'un seul groupe garde l'autre tel quel.

## Relecture du monde 5 (27/09/2026)

Décisions de Gwenaël (questions à choix) et ce qui a changé :

- **La progression, en huit marches** — une seule nouveauté à la fois, tout mélangé à la fin ;
  dans chaque marche, la tache finit à gauche sur la moitié des cartes, à droite sur l'autre
  (« 3𝑥 = 12 et 12 = 3𝑥 : c'est le but de l'égalité ») :
  - fiche 35 : 𝑥 + 𝑏 = 𝑐 (4), 𝑎𝑥 = 𝑐 (4), 𝑎𝑥 + 𝑏 = 𝑐 (4, nouvelle graine 793 : deux cartes de
    chaque côté, plus de 𝑥 = 1) ;
  - fiche 36 : des paquets, 2 ou 3 taches (graines 304 + 4471, 3 + 3 cartes), puis 4 à 6 taches
    (3795 + 79133) — `EQ5_PAQUETS` + `EQ5_PAQUETS_SUITE` ;
  - fiche 37 : des taches des deux côtés et des jetons d'un seul côté (2117), des jetons des deux
    côtés (295), puis le grand mélange, une carte de chaque forme dans le désordre (29197,
    `form=MIX`) — `EQ5_DEUX_COTES` + `EQ5_DEUX_COTES_SUITE`.
  Les graines ont été triées dans l'outil lui-même (pas de 69 ni de 88, pas de paquet de 1 ou 2,
  pas deux cartes pareilles, jamais deux fois la même lettre de suite). Aucun élève n'avait
  commencé l'univers : les séries du jeu changent avec les fiches.
- **Un livret par famille, chacun avec son défi** : `defi_schema` rend le livret « Le défi » en
  schéma en barres (`livret_splat_equations_schema_defi*.pdf`, mêmes 36 cartes que le défi
  équation, corrigé par le schéma). Sur la page des livrets, deux boutons « Le schéma en barres » /
  « L'équation ».
- **Comme les relatifs** : pages-fiches sans logo (retirés au rendu, `JS_SANS_LOGO`), le QR tout à
  droite du bandeau ; au dos, le crédit « Livret et outils SPLAT! Équations et ÉquaSplat de
  maths&go » et le seul logo maths&go — ni IREMI, ni Unité apprenante, ni Claire (« c'est que moi
  tout seul »). L'outil n'imprime plus le logo IREMI non plus.
- **Couverture** : les taches transparentes de l'exemple plus grosses (seule la tache grossit,
  autour du jeton qu'elle cache, sans toucher sa voisine) ; l'équation dans une fenêtre de 76 mm
  (66 avant) ; au livret schéma, les trois schémas séparés (un blanc de 110 unités au lieu de 32),
  toujours à l'échelle. « Nom, prénom » et « Classe » en haut de leur case.
- **Dos, « Pour se souvenir »** : la tache plus grosse ; les petits schémas en barres tracés à
  l'échelle en SVG (`mini_sch`) — le bloc 𝑥 𝑥 𝑥 a la largeur du 15, la tache seule la largeur
  d'une tache du dessus (remarque de Gwenaël).

## La lettre ronde dans les pages-fiches (27/09/2026)

Les pages-fiches sont imprimées par l'outil lui-même (`outils/splat_equations.html`) : depuis que
l'outil déclare **SplatLettres** (la lettre ronde du site, `assets/fonts/`), les lettres des
**corrigés** (𝑥, 𝑏, 𝑚… dans les équations, les flèches et les cases des schémas) sont rondes,
comme sur la couverture et le dos — avant, ces pages prenaient la lettre de secours de la machine
de rendu (FreeSans, sans empattement). Les huit PDF corrigés ont été refaits ; les livrets de
l'élève n'ont pas bougé (leurs fiches n'ont pas de lettre). Couverture et dos gardent FreeSerif
(`CSS_X`), le même dessin rond.

## Les paquets arrivent séparés dans le jeu (28/09/2026, décision de Gwenaël)

`carteDuJeuEquaSplat` envoie chaque paquet de la carte, comme sur la fiche : « 26 + 16 = 𝑥 + 34 »,
et l'élève les regroupe dans ÉquaSplat (bouton « Regrouper », il calcule la somme). Avant, le jeu
recevait la somme (« 42 = 𝑥 + 34 ») et regrouper n'existait que sur le papier. Seuls les jetons
un par un (fiche 35, `numberMode` « unit ») arrivent en un seul nombre. Les PDF ne changent pas ;
changent les séries « j » (fiches 35 à 37 et défi), la page courte des QR et `cartes.json`.

## Couverture retouchée (28/09/2026)

- « La carte » de l'exemple a des taches **noires**, comme sur les fiches (l'état de départ de la
  résolution pas à pas). Avant : taches transparentes, agrandies, avec le nombre caché écrit dedans.
  Même décision qu'à la couverture de SPLAT! classique. La phrase « Ici, les taches sont
  transparentes… » est retirée du texte.
- Livrets « équation » (base et défi, élève et corrigé) : l'**équation** de l'exemple est écrite plus
  grosse (remarque de Gwenaël : « il y a beaucoup de place et elle est toute petite »). Seul le texte
  de l'équation grandit (×1,5 dans le dessin de l'outil, ≈ 13 → 17,5 pt imprimé) ; les accolades
  gardent leur largeur et s'étirent avec l'interligne, les « − 12 / ÷ 3 » un peu plus grands
  (×1,25) pour ne pas rapetisser quand l'ensemble est réduit à la largeur de la fenêtre ; les
  accolades de droite se collent au texte (l'outil y laisse la place d'une équation plus longue).
- Les calculs du texte « Comment ça marche ? » ne se coupent plus en fin de ligne : les espaces
  insécables ne suffisaient pas, le navigateur coupait après le tiret « – » (vu par Code sur la
  couverture « équation » : « (27 – » puis « 12 = 15) » à la ligne). Chaque calcul, parenthèses
  comprises, est dans un `<span style="white-space:nowrap">`.
