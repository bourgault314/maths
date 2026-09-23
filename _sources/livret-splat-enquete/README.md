# Livrets de l'Enquête — « SPLAT! Enquête » (monde 3) et « SPLAT! Grande enquête » (monde 4), 8 pages chacun, à plier

L'Enquête de l'univers SPLAT! en deux livrets, un par monde depuis le lot E5 (23/09/2026 :
dix étoiles dans un seul monde, c'était trop) : les dix fiches de la progression, cinq
par livret, avec une couverture, un exemple résolu pas à pas et une 4e de couverture.
Même fabrication que les livrets des mondes 1 et 2 (`_sources/livret-petit-splat/`,
`_sources/livret-splat-classique/`) : **2 feuilles A3 recto-verso**, pliées et agrafées
au milieu → 8 pages A4.

| Livret | Fiches | PDF produits |
|---|---|---|
| `additif` — monde 3, SPLAT! Enquête | 10 De plus que · 11 De moins que · 12 Plus ou moins · 13 Trois taches en chaîne · 14 Le défi additif | `outils/livret_splat_enquete_additif.pdf` · `…_a_plier.pdf` |
| `multiplicatif` — monde 4, SPLAT! Grande enquête | 15 Fois plus · 16 Fois moins · 17 Les quatre opérations · 18 Trois taches, 4 opérations · 19 Le grand défi | `outils/livret_splat_enquete_multiplicatif.pdf` · `…_a_plier.pdf` |
| + leurs 2 livrets de correction chacun | les mêmes | `…_correction.pdf` (inconnue « ? »), `…_correction_lettre.pdf` (inconnue en lettre), et chacun son `…_a_plier.pdf` |

Deux formats pour chacun :

- `….pdf` — 8 pages A4 dans l'ordre de lecture (pour l'écran, ou le mode « Livret » d'un photocopieur) ;
- `…_a_plier.pdf` — 4 pages A3 paysage **déjà imposées** (8|1 · 2|7 · 6|3 · 4|5) :
  impression recto-verso, retournement sur le **bord court**, on plie, on agrafe.

## Les 8 pages

1. **Couverture** — bandeau framboise (le même pour les mondes 3 et 4 : c'est la même enquête),
   « Mon livret · Monde 3 » + « SPLAT! Enquête » ou « Mon livret · Monde 4 » + « SPLAT! Grande enquête »,
   « Comment ça marche ? » : la carte de
   l'exemple, son **schéma vide** (« Pour commencer ») et la consigne des fiches
   (« dessine le schéma en barres… comme l'exemple de la page 2 »), « Nom, prénom » +
   Classe, le sommaire des cinq fiches.
2. **Un exemple résolu — « L'enquête pas à pas »** : la même carte, puis les **cinq
   étapes du bouton « Voir le schéma »** de l'outil (schéma vide, rempli, regroupé,
   ordonné, résolution), chacune avec sa légende, la vérification finale et la consigne
   « À toi ! ». En page 2, elle est en face de la fiche 10 quand le livret est ouvert.
3. à 7. **Les cinq fiches**, 4 cartes par page, telles que l'outil les imprime.
8. **Dos** — « Encore des cartes ! » (trois séries infinies, huit cartes à chaque
   ouverture), « La suite du voyage » (monde 3 → le monde 4, SPLAT! Grande enquête ; monde 4 → le monde 5,
   SPLAT! Équations), « Pour se souvenir », « Mes fiches », crédits.

Décisions de Gwenaël (22/09/2026) : l'exemple en page 2 ; huit cartes par série du dos ;
les textes de la couverture, des légendes et du dos tels qu'ils sont.

Retouches du 23/09/2026 : sur la couverture, le **schéma vide** remplace le schéma rempli
(seul, il n'était qu'une étape sur cinq sortie de son contexte : toute la résolution est en
page 2) ; la consigne des fiches est sur la couverture **et** en page 2 ; les noms et les
« ? » des deux taches du dessin sont centrés sur leur tache (mesuré, voir le commentaire
de `couverture.html`) ; la page 2 remonte sa conclusion sous la dernière étape. Au dos,
« Pour se souvenir » : le mini-schéma est un vrai schéma en barres (chaque « ? » a exactement
la largeur de la case de la tache de référence, les cases d'une barre se touchent — `JS_DOS`
le mesure et refuse de rendre sinon), les noms des deux taches sont centrés dedans, et la
case du total est dessinée comme sur les cartes (« TOTAL » au-dessus du nombre, les mesures de
l'énoncé imprimé de `outils/splat.html`).

## Fichiers

- `couverture.html`, `exemple.html`, `dos.html` — les trois pages dessinées ici. Les
  images de la carte et des schémas ne sont que des emplacements : `render.py` les
  redemande à l'outil à chaque rendu, et **écrit les textes qui parlent de l'exemple à
  partir de la carte rendue** (`textes_exemple`) — ils ne peuvent pas mentir sur ses nombres.
- `commun.css` — la charte (Poppins, framboise `#be185d`, le même dégradé que le bandeau
  imprimé des fiches `.print-page-header--enquete`).
- `qr/` — les QR codes en PNG noir et blanc : `fiche10…19.png`, `serie-1…6.png`, `univers.png`.
- `render.py` — régénère les PDF. Tous les réglages sont en tête de fichier.

Les fiches elles-mêmes ne sont **pas** redessinées ici : `render.py` les demande à l'outil
du site (`outils/splat.html`, 4 par page) avec les graines de la carte des mondes, et
ajoute le QR dans le bandeau juste avant l'impression. Les livrets suivent donc toute
évolution de l'outil.

## Les graines : celles de la carte des mondes

Rien n'est trié ici : `F10` … `F19` sont **exactement** les réglages et les graines de
`ENQ_FICHES` (`outils/splat_univers.html`, lot E0) — 339, 1071, 918, 290, 950, 1372,
1343, 405, 1313, 537. Une fiche = une étape = une étoile. Les fiches 11 (« De moins que »)
et 16 (« Fois moins ») portent la consigne en gras « Reformule l'indice avant de dessiner
ton schéma. » (`note=`).

`tests/livret-splat-enquete.test.mjs` épingle `render.py` sur la carte des mondes et sur la
page courte des QR : **si une graine change**, la reporter ici et dans
`splat/enquete/livret/index.html`, puis relancer `python3 render.py --qr`.

## Les QR codes passent par une page courte

`https://mathsgo.re/splat/enquete/livret/?f=12` ouvre la série en ligne de la fiche 12 —
**exactement** le lien « Je joue » de la carte des mondes (mêmes cartes, `parcours=enq12`,
donc la même étoile et la même empreinte de reprise). `?s=1` … `?s=6` ouvre une série du
dos : les réglages des fiches **sans graine**, huit cartes nouvelles à chaque fois, en mode
élève sans étape (rien n'est enregistré). Le QR ne porte que ces quelques caractères : il se
lit encore photocopié, et une série peut être retouchée sans réimprimer un livret.

| Série | Livret | Réglages |
|---|---|---|
| 1 Deux taches | 1 | 2 taches, de plus ou de moins, totaux 10 à 30 |
| 2 Trois taches | 1 | 3 taches en chaîne, de plus ou de moins, totaux 20 à 60 |
| 3 Le défi additif | 1 | 3 taches, structure au hasard, 1 à 3 jetons visibles |
| 4 Fois plus, fois moins | 2 | 2 taches, fois plus ou fois moins, totaux 10 à 40 |
| 5 Les quatre opérations | 2 | 2 taches, les quatre opérations, totaux 15 à 50 |
| 6 Le grand défi | 2 | 3 taches, structure au hasard, jetons visibles, les quatre opérations |

## L'exemple (couverture et page 2)

Une carte à **trois taches en chaîne** qui n'est **dans aucun livret**, dessinée par l'outil,
la tache noire en référence :

- livret 1 (graine 4642) : la bleue a 4 jetons de plus que la noire, l'orange 3 de plus que la
  bleue — 5, 9, 12, total 26. Regroupé : ? ? 4 ? 7 ; ordonné : ? ? ? 4 7 ;
- livret 2 (graine 128029, lot E5) : la bleue a 2 jetons de plus que la noire, l'orange 3 fois
  plus que la bleue — 5, 7, 21, total 33. Regroupé : ? ? 2 ? ? ? 6 ; ordonné : ? ? ? ? ? 2 6.
  (La graine 2340 du lot E4 — 7, 9, 18, total 34 — était la carte 4 de la fiche 18 aux couleurs
  près : écartée. `render.py` s'arrête sur un tel exemple et écrit ses cartes dans `cartes.json`,
  que le test relit.)

**Pourquoi trois taches** (remarque de Claire, 23/09/2026) : avec deux taches, le schéma
regroupé et le schéma ordonné sont forcément identiques — les « ? » sont déjà d'un côté et le
nombre de l'autre —, et l'étape 4 n'apprenait rien. Au livret 2, la chaîne **commence par
« de plus »** : avec « fois plus » d'abord, le seul nombre resterait au bout de la barre et
l'étape 4 redeviendrait identique ; `textes_exemple` refuse les deux cas. La légende de
l'étape 4 est celle de Claire : « Je range les « ? » d'un côté et les nombres connus de
l'autre ».

Les premiers exemples (deux taches, graines 116 et 402) sont abandonnés. **Attention** : le premier
choix du livret 2 (graine 83 : 3 fois plus, 5 et 15, total 20) était **mot pour mot la
carte 3 de la fiche 15**. La comparaison de `render.py` tenait compte de l'ordre des taches
et l'avait laissé passer ; elle compare maintenant le total et les valeurs triées, et
refuse de rendre un livret dont l'exemple serait une de ses cartes.

Les cinq schémas de la page 2 sont ceux de l'outil (`drawRelationSituationSchema`,
`drawRelationGroupedSchema`, `drawRelationOrderedSchema`) au profil d'impression de la
correction (`getRelationCorrectionPrintProfile`) : **aucun dessin n'est inventé ici**. Seul
le bouton « Résoudre » du schéma ordonné (il ouvre ÉquaBarre à l'écran) est retiré.

## Les livrets corrigés (pour tous)

Depuis le 23/09/2026, le corrigé peut aussi être donné aux élèves : il ne dit plus
« professeur » nulle part (un test le vérifie page par page).


Mêmes 8 pages, même pliage, **mêmes cartes à la même place** (vérifié carte par carte au
rendu : `render.py` s'arrête si une carte diffère entre l'élève, la correction et la lettre).

- **Les fiches** : la correction imprimée de l'outil (`print=correction`), 4 par page — le
  cadre « Tache de référence » ou « Reformulation », le schéma rempli, le schéma regroupé,
  la résolution. En lettre, les mêmes graines avec `unknown=letter` (l'équation du schéma
  regroupé réapparaît, décision du lot E1).
- **Le 𝑥 arrondi** (en lettre) : l'outil écrit l'inconnue avec le caractère mathématique
  « 𝑥 », que la police des cartes n'a pas. Sur un PC Windows, c'est Cambria Math qui le
  dessine — le 𝑥 arrondi de l'appli ; sur la machine de rendu, c'était un x droit. `render.py`
  nomme donc la police de ce seul caractère (`CSS_X` : FreeSerif, agrandi de 20 % pour avoir
  la hauteur des autres lettres) et s'arrête si elle manque (`apt install fonts-freefont-ttf`).
- **La couverture** : celle de l'élève, avec un bandeau rouge sombre « Correction » et
  « Livret corrigé — inconnue « ? » » (ou « en lettre ») à la place de « Nom, prénom / Classe ».
- **La boîte du QR** : même QR que l'élève, « Je rejoue ces cartes en ligne ».
- **Le pied** des fiches finit par « · correction » ; l'exemple et le dos ne changent pas.

## Régénérer

```bash
cd _sources/livret-splat-enquete
python3 render.py                 # les DEUX livrets, élève et corrections
python3 render.py additif         # un seul livret (additif | multiplicatif), et ses corrections
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

- Logos IREMI + maths&go dans le bandeau de chaque page, **un seul logo maths&go par page** ;
  rien dans le pied, hormis la signature `mathsgo.re/splat · CC BY-NC-SA 4.0` (gris moyen
  `#64748b`, 10 px). Crédit de la progression de Claire une seule fois, au dos.
- Tout reste lisible imprimé en **noir et blanc** : le framboise ne sert qu'aux fonds, tout
  texte coloré est foncé (`#831843`), le nom de la couleur est écrit sur chaque tache, le
  QR est dans une boîte blanche.
- Un titre de fiche trop long pour une ligne se coupe **après le tiret** (« Fiche 13 — » /
  « Trois taches en chaîne »), jamais au milieu du titre (`JS_TITRE`) ; sur une correction,
  la première ligne devient « Fiche 13 — Correction ». L'adresse de la fiche ne change pas.
- Vocabulaire : « jeton », « paquet de jetons » (un jeton avec un nombre), « tache »,
  « tache de référence », « indice », « ? », « schéma en barres » — jamais d'autre nom pour
  la représentation, jamais de nom de forme pour un jeton.
- L'imposition A3 passe par **pikepdf** et `add_overlay` (avec pypdf, les dégradés ne suivent pas).
