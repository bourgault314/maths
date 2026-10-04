# Livret « SPLAT! classique » (monde 2, 8 pages, à plier)

Le monde 2 de l'univers SPLAT! réuni en un seul livret : couverture, les 3 fiches
dans l'ordre de la progression (fiches 7, 8 et 9 — la numérotation continue celle du
monde 1), et une 4e de couverture. Même fabrication que les livrets Petit SPLAT! du
monde 1 (`_sources/livret-petit-splat/`) : **2 feuilles A3 recto-verso**, pliées et
agrafées au milieu → 8 pages A4.

Il en existe **deux**, mêmes trois étapes, deux calibres de cartes :

| Livret | Fiches | PDF produits |
|---|---|---|
| `normal` — Monde 2 | 7 (12 cartes de Claire), 8 et 9 (deux séries de 6 cartes à paquets chacune) | `outils/livret_splat_classique.pdf` · `…_a_plier.pdf`, et en lettre `…_lettre.pdf` · `…_lettre_a_plier.pdf` |
| `defi` — Le défi | 7, 8, 9 — 12 cartes à paquets chacune, **totaux 50 à 100, 2 à 6 taches** | `outils/livret_splat_classique_defi.pdf` · `…_defi_a_plier.pdf`, et en lettre `…_defi_lettre.pdf` · `…_defi_lettre_a_plier.pdf` |
| + leurs 4 livrets de correction chacun (lots K2 et D) | les mêmes | `…_correction_equation.pdf`, `…_equation_lettre`, `…_schema`, `…_schema_lettre` (et chacun son `…_a_plier.pdf`) |

## Relecture du monde 2 (26/09/2026)

- **Deux livrets de l'élève par niveau** : avec « ? » (le fichier d'avant) et **en lettre**
  (`…_lettre.pdf`). Mêmes cartes, mêmes QR ; en lettre, chaque carte a sa lettre (celle de son
  corrigé en lettre). Sur la page des livrets, deux boutons « Avec ? » / « Avec une lettre »,
  chacun avec ses deux corrigés.
- **La lettre ronde** : les lettres de l'inconnue (𝑥, 𝑎…) sont dessinées par **SplatLettres**
  (`assets/fonts/`, fabriquée par `_sources/polices/splat-lettres/fabrique.py`), déclarée dans
  `commun.css` et dans l'outil — la même lettre ronde que les livrets de l'Enquête, partout.
- **La case réponse** de chaque carte commence par l'inconnue : « ? = …… » ou « 𝑡 = …… » (avant :
  la petite tache).
- **L'exemple de la couverture** est dessiné comme une carte des fiches (TOTAL à droite, case
  réponse remplie), avec dessous le schéma en barres « ou » l'équation — les deux corrections
  courtes 6/page de l'outil. Au livret Monde 2, une carte à **deux taches** (graine 746 :
  6 + 10 = 16, 38 − 16 = 22, 22 ÷ 2 = 11), pour une résolution complète.
- **Fiches 8 et 9 en quatre marches de 6 cartes** (voir « Les graines »).
- **Check-list du monde 1** : plus de logo sur les pages-fiches du livret à plier (retirés au
  rendu, le QR passe tout à droite du bandeau ; le PDF page par page garde l'IREMI, voir
  « Conventions ») ; au dos, crédit à gauche, IREMI + maths&go + Unité apprenante à
  droite ; tache de « Pour se souvenir » à 52 px ; « TOTAL » au-dessus du 37 ; « Nom, prénom » et
  « Classe » en haut de leur case ; « La suite du voyage » : Enquête (monde 3) puis Système
  (monde 4). **Pas de numéro de page** (retiré aussi au monde 1 : doublon du numéro de fiche).

## Corrigés plus gros (27/09/2026)

- **Équation** : la plus grande taille qui tient dans la case (160 à 170 au lieu de 100), l'équation
  entière centrée (flèches comprises) ; le dessin descend jusqu'en bas de la case
  (`SIX_CORRECTION_ALLONGE`, 130).
- **Schéma** : chiffres de 92 (au lieu de 80), cases de 95, et plus d'espace **entre** les schémas
  (66 au lieu de 40). Avec 5 ou 6 petites cases, le 1er schéma se resserre et les chiffres peuvent
  redescendre à 86 ou 80, pour que les calculs restent gros.
- Sur la couverture, le schéma de l'exemple a 27,5 mm de haut au plus (au lieu de 24) : il garde sa
  taille d'avant.

## Couverture retouchée (28/09/2026)

- **L'exemple a des taches noires**, comme sur les fiches : la carte est rendue par l'outil en mode
  « énoncé », et seule la case réponse (« ? = 11 ») vient de la correction. Avant : taches
  transparentes avec le paquet caché écrit dedans ; l'élève voyait la réponse avant de la chercher.
  La phrase « Ici, les taches sont transparentes… » est retirée du texte.
- **« Nom, prénom » en haut de sa case** : le style injecté aux deux niveaux (`CSS_DEFI`, qui sert aussi
  au livret normal) remettait 3,5 mm en haut de la case ; il passe à 2,2 mm, comme Petit SPLAT!, même
  hauteur de case.

Les deux gardent `parcours=m2eN` : valider une fiche plus dure gagne l'étoile du monde 2
(même décision qu'au monde 1 le 17/09/2026).

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
  hasard), « La suite du voyage » vers l'univers (mondes 3 à 5), « Pour se souvenir »
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
- fiche 8 = étape « Avec des paquets de jetons », fiche 9 = « Le défi ». Depuis le 26/09/2026,
  deux séries de 6 cartes chacune, une par page (constantes M2E4A/B et M2E5A/B de la carte des
  mondes, enchaînées par `suite`) : fiche 8 = une tache et des paquets (graine 347, les 6
  premières cartes d'avant), puis seulement des taches (graine 260, on divise) ; fiche 9 = des
  taches et un paquet (graine 1673), puis des taches et deux paquets (graine 5974).
  (Historique : ces deux étapes étaient passées de 10 à **12 cartes** le 19/09/2026 (les 10
  premières cartes n'ont pas changé, deux se sont ajoutées à la fin) pour remplir les
  deux pages de chaque fiche (6 + 6) au lieu de laisser deux cases vides.)

`tests/livret-splat-classique.test.mjs` épingle les constantes de `render.py` et les
cibles de la page courte des QR sur celles de la carte des mondes : **si une graine
change** dans `splat_univers.html`, le test le dit ; reporter la graine ici et dans
`splat/classique/livret/index.html`, puis relancer `python3 render.py --qr`.

## Le livret « Le défi » (lot D, 21/09/2026)

Le même monde, des cartes plus dures. Réglages décidés par Gwenaël le 20/09 :

- **totaux de 50 à 100** ;
- **2 ou 3 paquets visibles** : il faut ADDITIONNER avant de soustraire ;
- **valeurs de paquets non rondes** (17, 23, 31 — jamais 10, 20, 30) ;
- **quotient final non évident** (`6x = 78 → 13`) ;
- **2 à 6 taches** (le mode paquets le permet déjà : rien à coder dans le moteur) ;
- **paquets numérotés seulement** — les jetons comptés un par un restent l'entrée du monde,
  à la fiche 7 du livret normal.

Les trois fiches, et leur QR (`?f=7d`, `8d`, `9d` sur la page courte) :

| Fiche | Titre | Taches | Étape |
|---|---|---|---|
| 7 | Des paquets, et plusieurs taches | 2, puis 3, puis 4 | `m2e1` |
| 8 | Encore plus de taches | 4, puis 5, puis 6 | `m2e4` |
| 9 | Le grand défi | de 2 à 6, mélangées | `m2e5` |

### Pourquoi TROIS séries de 4 cartes par fiche

Comme la fiche 7 du livret normal, chaque fiche dure met **trois séries de 4 cartes** bout à
bout (paramètre `suite`). Ce n'est pas un choix esthétique : **mesuré le 21/09/2026 sur
300 000 tirages par réglage, une carte sur sept seulement** respecte toutes les règles
ci-dessus à la fois (le générateur tire le quotient au hasard, puis découpe le reste en
paquets au hasard : un « paquet » de 1 jeton ou un quotient de 2 sortent souvent). Douze
cartes d'affilée, c'est une graine sur plusieurs millions — hors d'atteinte. À quatre cartes,
c'est une graine sur quelques centaines à quelques milliers : le tri tourne en trois minutes,
et l'on choisit en prime le nombre de taches de chaque série.

### Le choix des graines du livret « Le défi »

Retenues automatiquement, en ne gardant que les séries dont **les quatre cartes** passent :

1. `4 ≤ ? ≤ 15` et `?` non multiple de 5 — le quotient ne se devine pas, et la correction
   reste lisible ;
2. chaque paquet entre **6 et 49**, **aucun multiple de 10** — un paquet de 1 n'est pas un
   paquet, 20 ou 30 se soustrait de tête ;
3. somme des paquets ≥ 20 — l'addition vaut la peine d'être posée.

Puis, à qualité égale, les séries qui varient le plus (totaux étalés, `?` variés, des cartes
à 2 ET à 3 paquets, aucun paquet à un seul chiffre quand c'est possible), et l'assemblage des
trois fiches est choisi pour que **les 36 cartes soient 36 équations différentes** — vérifié
par un test qui les relit dans le PDF de correction publié, pas dans le code.

**Ne pas changer une graine sans refaire le tri.** Le script de tri n'est pas dans le dépôt :
il lance l'outil dans un chromium sans affichage et rejoue `genNumberedEquationPreset` avec
des centaines de milliers de graines (il commence par vérifier qu'il reproduit exactement ce
que donne `generate()`).

### Sa couverture et son dos

- La couverture dit `Mon livret · Monde 2 · Le défi`, et son exemple montre **les trois
  gestes** : `17 + 18 = 35`, `77 − 35 = 42`, `42 ÷ 3 = 14` (graine 168, une carte qui n'est
  pas dans le livret). Les textes qui parlent de l'exemple (`texte_exemple`) sont **écrits à
  partir de la carte rendue** : ils ne peuvent pas se décaler si la graine change.
  `CSS_DEFI` resserre la mise en page de cette seule couverture — l'équation de trois lignes
  fait 13 mm de plus que celle du livret normal, et le pied sortait de la feuille.
  **Attention** : dans le mode paquets, la tache transparente **écrit** le nombre caché (un
  jeton numéroté) ; il n'y a rien à compter. La leçon du lot K1-bis (« choisir une valeur
  cachée petite ») ne vaut qu'au monde 1, où les jetons cachés sont dessinés un par un.
- Le dos ne porte que **deux** séries, et leurs QR passent de 21 à **32 mm** (`CSS_DOS_DEFI`).
  À quatre par rangée, l'adresse de 173 caractères tombait à 0,37 mm par module — court pour
  un téléphone, pire photocopié ; à deux, on est à 0,56 mm. Les deux séries sont le même jeu
  que le livret (2 à 6 taches, paquets numérotés) et ne diffèrent que par la tranche de
  totaux : 50 à 100, ou 20 à 100 (les deux livrets réunis).

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
professeur projette. L'inconnue y est le « ? » de l'outil élève (cycle 3) ; les livrets de
correction existent aussi « avec la lettre » (voir plus bas), le livret de l'élève non.

## Les livrets corrigés (lot K2, 20/09/2026)

Quatre livrets corrigés : { **équation**, **schéma** } × { **« ? »**, **lettre** }
(le « ? » pour le cycle 3, la lettre pour le cycle 4). Chacun a **les mêmes 8 pages, le même
pliage et les mêmes cartes à la même place** que le livret de l'élève (0 nombre déplacé
de plus de 0,1 pt sur les fiches) ; ce n'est pas un recto-verso élève/correction.

- **Les fiches** : c'est l'outil qui les imprime, avec ses deux « corrections courtes »
  6/page (`print=correction-equation` ou `print=correction-schema`, les mêmes que dans
  le menu Impression de la vue prof) : même bandeau (« Fiche N — … — Correction »), même
  cadre de consigne, même plateau (tache transparente, comme la correction de l'outil).
  Sous le plateau : **l'équation** résolue et ses flèches (− v, ÷ n), dessinée comme la
  correction imprimée du mode B, fiche 7 comprise ; ou **les schémas en barres** de
  l'outil jusqu'à la tache seule (« ? » sous sa valeur), compacts à gauche, avec les
  calculs à droite, en face du schéma qui sert au calcul.
- **En lettre** : les mêmes graines avec `unknown=letter` (les nombres ne bougent pas) ;
  chaque carte de la fiche 8 ou 9 a sa lettre, tirée par l'outil avec la carte. Les cartes
  à jetons de la fiche 7 (mode A) n'en ont pas dans l'outil : `JS_LETTRES` leur en donne
  une, dans l'ordre de `variableChars` (x, a, b, c, m, n, t…), **sans rien tirer**.
- **La boîte du QR** : même boîte, même QR, même place, « Je rejoue / ces cartes / en
  ligne » (`QR_PROF`, comme les livrets corrigés Petit SPLAT! et ceux de l'Enquête).
- **La couverture** : celle de l'élève, avec le bandeau rouge sombre « Correction » (14 mm,
  `CSS_PROF`) et, à la place de « Nom, prénom / Classe », une seule ligne « Livret
  corrigé — par l'équation (ou le schéma en barres) · inconnue … » qui dit de quel livret
  il s'agit. Le sommaire et le pied
  restent exactement à leur place.
- **Le pied** des fiches finit par « · correction » ; **le dos** ne change pas.

**Pour tous (23/09/2026).** Le corrigé peut être donné aux élèves (Claire, comme les
livrets de l'Enquête) : il ne dit plus « professeur » nulle part.

## Régénérer

```bash
cd _sources/livret-splat-classique
python3 render.py                 # les DEUX livrets, élève et correction
python3 render.py defi            # un seul niveau (normal | defi), et ses corrections
python3 render.py --eleve         # seulement les livrets de l'élève
python3 render.py --correction    # seulement les livrets de correction
python3 render.py --qr defi       # en refabriquant d'abord ses QR codes
```

Dépendances : `playwright` (+ chromium), `pikepdf`, `qrcode[pil]`. `qpdf`, s'il est
présent, divise le poids des PDF par deux. Les fiches sont imprimées avec les marges de
l'outil (`@page` 8 mm, `prefer_css_page_size`), la couverture et le dos sans marge.

## Conventions

- Logos : IREMI + maths&go une seule fois, au dos, à côté du crédit ; aucun sur la couverture
  ni sur les fiches du livret à plier. **PDF page par page (04/10/2026)** : chaque page-fiche du `….pdf` garde le logo de **l'IREMI seul** (`JS_IREMI_SEUL`), à droite de la boîte du QR, qui se pousse à gauche (un titre trop long se coupe après le tiret, `JS_TITRE`) — un collègue qui imprime une seule fiche n'a pas le dos ; maths&go est déjà au pied (`mathsgo.re/splat`). Le livret à plier (`…_a_plier.pdf`) ne change pas : aucun logo sur ses fiches. Chaque fiche est donc rendue deux fois, mêmes graines ; seul le bandeau diffère.
- Le pied : rien, hormis la
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
