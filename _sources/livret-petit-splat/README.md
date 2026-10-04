# Livrets « Petit SPLAT! » (8 pages, à plier)

Le monde 1 de l'univers SPLAT! réuni en un seul livret : couverture, les 6 fiches
dans l'ordre de la progression, et une 4e de couverture. Les collègues l'impriment
sur **2 feuilles A3 recto-verso**, pliées et agrafées au milieu → 8 pages A4.

Il en existe **trois**, même progression, trois tranches de nombres :

| Niveau | Cartes | PDF produits |
|---|---|---|
| `normal` — Monde 1 | jusqu'à 20 jetons | `outils/livret_petit_splat.pdf` · `…_a_plier.pdf` |
| `avance` — Avancé  | **21 à 50** jetons | `outils/livret_petit_splat_avance.pdf` · `…_avance_a_plier.pdf` |
| `expert` — Expert  | **51 à 100** jetons | `outils/livret_petit_splat_expert.pdf` · `…_expert_a_plier.pdf` |

Les trois gardent `parcours=m1eN` : valider une fiche plus dure gagne l'étoile du
monde 1 (décision du 17/09/2026 — « s'ils valident un truc plus dur, c'est mieux »).

Pour chaque niveau, deux PDF :

- `…​.pdf` — 8 pages A4 dans l'ordre de lecture
  (pour lire à l'écran, ou pour le mode « Cahier/Livret » d'un photocopieur) ;
- `…_a_plier.pdf` — 4 pages A3 paysage **déjà imposées**
  (8|1 · 2|7 · 6|3 · 4|5) : impression recto-verso, retournement sur le bord court,
  on plie, on agrafe.

## Les livrets « Je fais le schéma en barres » (26/09/2026)

Trois livrets de plus, mêmes tranches de nombres, **nouvelles séries** : l'élève fait
lui-même le schéma en barres, puis écrit « ? = … » (idée de Gwenaël ; décisions par questions
à choix, sur planches). « Je fais » et pas « je dessine » : dans les autres livrets, l'élève
dessinait des jetons.

| Niveau | Cartes | PDF produits (et leurs corrigés `…_correction…`) |
|---|---|---|
| `dessin` — Monde 1 | jusqu'à **30** jetons, au plus 12 posés (28/09/2026) | `outils/livret_petit_splat_dessin.pdf` · `…_a_plier.pdf` |
| `dessin_avance` — Avancé | **21 à 50** jetons | `outils/livret_petit_splat_dessin_avance.pdf` · `…_a_plier.pdf` |
| `dessin_expert` — Expert | **51 à 100** jetons | `outils/livret_petit_splat_dessin_expert.pdf` · `…_a_plier.pdf` |

- Les 6 fiches (`FICHES_DESSIN`) : **9 cartes** (`grid=3x3`) « complète le schéma », schéma
  **non imprimé** (`diagram=draw` : la consigne dit alors « dessine le schéma en barres,
  puis… »), la bande sous le schéma (`espace=1`) et « ? = …… » sous chaque carte à faire
  (`reponse=1`). En 9 cases avec « Schéma à tracer », le dessin est resserré (125 px) et toute
  la place gagnée va à la zone vide où l'élève fait son schéma ; un schéma imprimé (exemple,
  schéma donné, corrigé) garde sa taille habituelle. Essayé et écarté : 8 cartes (trop
  larges, pas plus haut) et 12 (moins de place pour écrire).
- L'ordre (« contraste tôt ») : 1 une tache · 2 deux taches, **3 cartes sur 9 sans jetons
  posés** (`sansjetons=3` : n × ? = total à côté de a + n × ? = total ; 4 jusqu'au 26/09 au
  soir, « c'est un petit peu trop ») · 3 de 2 à 4 taches (`splats=mix4`), 3 sans jetons · 4 mélange de 2 à 4 taches, 2 sans jetons · 5 et 6 mélange
  de 2 à 6 taches, 2 sans jetons (`sansjetons=2`). Aucune phrase en plus dans les consignes.
- Fiches 1 et 2 : **un guidage qui s'efface** (`exemple=1&donne=2`, papier seulement) — la
  1re carte est un exemple résolu (étiquette « Exemple »), les 2 suivantes ont leur schéma
  imprimé et l'élève trouve « ? = … », puis 6 cartes à faire en entier. À la fiche 2,
  l'exemple est une carte sans jeton posé, et des deux schémas donnés, l'un a des jetons,
  l'autre pas.
- Corrigé : le schéma avec un « ? » dans chaque case de tache (le nombre cherché), et « ? = 6 »
  écrit dessous, à gauche. « ? » et pas « tache = 6 » : c'est l'inconnue des mondes suivants.
- Avec « Schéma à tracer », les pointillés sous le dessin sont plus foncés (`schema-a-faire`).
- `sansjetons=N` choisit ses N cartes par un hasard À PART (graine + « |sansjetons ») : les
  cartes tirées sont les mêmes qu'avec les jetons. Depuis le 26/09 au soir, il a aussi sa liste
  dans le panneau, « Sans jetons » (0 à 6, ou « toutes »), à côté de « Jetons autour »
  (`jetons=0`), qui vaut aussi en Petit Splat classique : décochée — ou « toutes » dans la
  liste —, aucune carte « complète le schéma » n'a de jetons (une fiche entière sans jetons).
  `reponse=1` a sa case, « Ligne ? = … », visible avec « Schéma à tracer ». `exemple=N` et
  `donne=N` restent des réglages d'adresse, pour le papier.
- « ? = …… » à compléter : 19 px (15 avant), tenu par le bas ; sur une carte au schéma donné
  (9 cases), il descend en bas de la case, au même niveau que sur les cartes à faire (choix C
  de Gwenaël, 26/09 au soir).
- Couverture : « Je fais le schéma en barres » en 2e ligne du haut ; « Comment ça marche ? »
  remplacé par deux petits exemples dessinés par l'outil, avec et sans jetons posés, chacun
  avec son schéma (« ? » dans les cases) et « ? = … » à gauche (`COUV_DESSIN`,
  `JS_DEUX_EXEMPLES`), puis la règle « Tu n'as aucun jeton à dessiner… » ; « Dans ce livret »
  donne les titres de ces fiches (`som`, injecté).
  Le dos garde les mêmes QR ; ses descriptions ne renvoient plus aux numéros de fiches.
- QR : `qr/dessin/`, `qr/dessin-avance/`, `qr/dessin-expert/`. Chaque fiche valide l'étoile
  de l'étape du monde 1 qui lui ressemble le plus (m1e1, m1e4, puis m1e5).
- Graines (26/09/2026) : règles du tri du 17/09 des livrets d'origine (plancher du niveau, pas
  deux cartes identiques, au plus une carte à 1 jeton par tache), plus : jetons posés sur les 9 cartes de la
  fiche 1 (l'exemple : au moins 2 posés et 3 cachés) ; exactement 3 cartes sans jetons aux
  fiches 2 et 3, exactement 2 aux fiches 4 à 6 ; les 3 cartes guidées cachent au moins 2
  jetons par tache ; 2, 3 et 4 taches aux fiches 3 et 4 ; au moins 4 nombres de taches aux
  fiches 5 et 6 ; aucun 69 ; plancher 4 jetons au niveau Monde 1.
- **Nouveau tri (28/09/2026)** : à l'impression, Gwenaël a trouvé des cartes en double (8 et
  4 taches aux fiches 4 et 5) et des divisions répétées (4 ÷ 2 six fois dans le livret Monde 1) :
  le tri du 26/09 regardait chaque fiche seule. Ses règles, sur le **livret entier** : aucune
  carte identique ; une même division (jetons cachés ÷ taches) **au plus 2 fois**, jamais deux
  fois sur la même fiche. Jusqu'à 20, c'est intenable (9 divisions à deux taches, et la fiche 2
  les prend toutes) : son idée, le livret Monde 1 monte **jusqu'à 30 jetons, au plus 12 jetons
  posés** par carte. L'outil lit `target=30` depuis l'adresse (option cachée du menu, rien de
  neuf dans le panneau) ; les exemples de couverture restent tirés comme à 20
  (`dessin.target`). Graines changées : les 6 du Monde 1, les fiches 2, 3, 4 et 6 de l'Avancé,
  4 et 5 de l'Expert. Le tri a rejoué environ 400 000 séries dans Chromium ; la preuve se
  rejoue avec `python3 tri_graines_dessin.py` (chaque fiche, puis le livret : « ok » ou la
  règle cassée).
- Couverture (26/09/2026 au soir) : les deux exemples « Avec des jetons posés » / « Sans jeton
  posé » chacun dans son cadre, puis « ATTENTION ! » (dans un cadre noir, pas de crayon) « Dans ce
  livret, tu ne dessines jamais de jetons. Quand aucun jeton n'est posé autour des taches, ils sont
  tous cachés dessous. »
- Régénérer : `python _sources/livret-petit-splat/render.py dessin dessin_avance dessin_expert --qr`
  puis les miniatures (page 1 à 120 dpi, `assets/img/thumbnails/splat/livret-petit-splat-dessin*.png/.webp`).

## Les livrets corrigés (lot K1, 20/09/2026)

Chaque livret a son **livret corrigé** : mêmes 8 pages, même
pliage, **mêmes cartes à la même place**, mais les six pages de fiches montrent la
correction (les schémas en barres remplis ; sur les fiches « Dessine », les jetons
visibles dessinés).

| Niveau | PDF de correction |
|---|---|
| Monde 1 | `outils/livret_petit_splat_correction.pdf` · `…_correction_a_plier.pdf` |
| Avancé  | `outils/livret_petit_splat_avance_correction.pdf` · `…_avance_correction_a_plier.pdf` |
| Expert  | `outils/livret_petit_splat_expert_correction.pdf` · `…_expert_correction_a_plier.pdf` |

Comment ils sont faits (tout est dans `render.py`, aucune source n'est dupliquée) :

- **Fiches** : l'outil est appelé avec `correction=1&rv=0` ; il rend l'énoncé **puis**
  sa correction. La page de correction de l'outil n'a **pas de cadre de consigne** (ses
  cartes démarreraient 29,5 mm plus haut et seraient 7 mm plus grandes) : `JS_CORRIGE`
  y remet le cadre de l'énoncé, puis retire l'énoncé. Chaque carte tombe ainsi
  **exactement à la même place** que sur la fiche de l'élève : on corrige en posant les
  deux livrets côte à côte.
- **La boîte du QR** garde sa place, sa taille et son QR (le même que sur la fiche de
  l'élève) ; seul son texte change : « Je rejoue / ces cartes / en ligne » (`QR_PROF`,
  comme les livrets de l'Enquête) au lieu de « J'ai terminé ma fiche, je rejoue en
  ligne » (`QR_ELEVE`). La boîte reste moins large que celle de l'élève : la consigne
  passe à la ligne exactement aux mêmes endroits que sur la fiche de l'élève.
- **La tache reste noire**, comme dans la correction que l'outil imprime : la réponse
  est dans le schéma. (Dévoiler les jetons cachés a été essayé : lisible au Monde 1,
  mais sur l'Expert 40 jetons sous une tache ne se comptent plus.)
- **Le pied** des fiches : `mathsgo.re/splat · CC BY-NC-SA 4.0 · correction`.
- **La couverture** reçoit, par injection (`PROF`, `CSS_PROF`, clé `prof` de `JS_COUV`) :
  un bandeau **rouge sombre `#b91c1c`** de 14 mm en haut, « CORRECTION » en blanc,
  centré sur les 10 mm qui s'impriment (les 4 premiers sont hors de la zone imprimable
  de la plupart des imprimantes) ; et « Livret corrigé » à la place de la ligne
  Prénom / Classe. En noir et blanc, le rouge devient gris foncé et le
  texte blanc reste lisible. Le sommaire ne bouge pas d'un millimètre.
- **Le dos** est identique au dos du livret de l'élève.

**Pour tous (23/09/2026).** Le corrigé peut être donné aux élèves (Claire, comme les
livrets de l'Enquête) : il ne dit plus « professeur » nulle part — bandeau « Correction »,
ligne « Livret corrigé », boîte du QR « Je rejoue ces cartes en ligne ».

La page `outils/livrets_petit_splat.html` donne, sous les deux liens de chaque livret,
une ligne plus discrète « 🧑‍🏫 Correction (prof) » · « à plier » (sans fond, bordure en
pointillés) — le même style servira au livret du monde 2 (lot K2). Pas de carte en plus
au catalogue, pas de pastille en plus dans la vue prof de la carte des mondes (décision du
20/09/2026).

## Fichiers

- `couverture.html` — page 1 : bandeau à coulure, le splat étoilé de l'univers,
  l'exemple expliqué, Prénom + Classe et le sommaire des six fiches.
  Pas de QR ici : ils sont sur les fiches et au dos.
  Le fichier porte **le livret Monde 1** ; pour Avancé et Expert, `render.py`
  remplace au rendu le sur-titre, l'accroche et l'exemple (voir plus bas).
- `dos.html` — page 8 : « Encore des cartes ! » (4 QR), « La suite du voyage »
  vers l'univers, rappel de vocabulaire, grille « Mes fiches », crédits et licence.
  Les quatre cases sont remplies au rendu à partir de `NIVEAUX[…]["dos"]`.
- `commun.css` — la charte des deux pages (Poppins, bandeau orange du site).
- `qr/` — les QR du livret Monde 1 ; `qr/avance/` et `qr/expert/` ceux des deux
  autres (6 fiches + univers + 4 niveaux chacun), en PNG noir et blanc.
- `render.py` — régénère les PDF. Tous les réglages sont dans `NIVEAUX`, au début.

Les fiches elles-mêmes ne sont **pas** redessinées ici : `render.py` les demande à
l'outil du site (`outils/splat_tache_barre.html`, `support=print`) avec des graines
fixes, et injecte le QR code dans le bandeau de consigne juste avant l'impression.
Les livrets suivent donc automatiquement toute évolution de l'outil.

## L'exemple de couverture

Pour Avancé et Expert, l'exemple « Comment ça marche ? » n'est pas dessiné à la
main : `render.py` demande à l'outil des cartes jusqu'à en trouver une au profil
voulu (`NIVEAUX[…]["exemple"]` : nombre de taches, jetons visibles, jetons cachés
par tache, total minimum), puis récupère son SVG avec les jetons cachés
(`getSplatSvg(item, true, false, true)`), rend les taches transparentes et affine
les jetons pour qu'ils restent comptables. L'exemple ressemble donc exactement aux
cartes des fiches du livret — **plusieurs taches comprises**, ce qui est justement
ce que ces deux niveaux apportent : *chaque tache cache le même nombre*.

## Le choix des graines (28-29/09/2026)

Les graines des trois livrets (Monde 1, Avancé, Expert) ont été **retriées sur le livret
entier** fin septembre, parmi environ 640 000 tirages rejoués dans l'outil, avec les règles
fixées par Gwenaël :

1. aucune carte identique dans le livret (une carte à compléter et une carte à dessiner avec
   les mêmes nombres ne sont pas un doublon), pas de carte « à l'envers » sur une fiche ;
2. une même division (jetons cachés ÷ taches) jamais deux fois sur une fiche, au plus deux fois
   dans le livret — sauf la fiche 4 du Monde 1 : 12 cartes à deux taches pour 10 divisions
   possibles jusqu'à 20, deux répétitions sont inévitables ;
3. fiches « dessine » (2, 3, 6) : 1 ou 2 cartes **« rien à dessiner »** (tout est sous les taches) ;
4. fiches « complète » (1, 3, 4, 5) : 1 ou 2 cartes **« tout est caché »** (aucun jeton posé),
   dont une à plusieurs taches aux fiches 4 et 5 — un cas qui revient dans les mondes suivants ;
5. au plus **une réponse 1** par fiche, jamais de total 1 ; le 69 est permis ;
6. Avancé et Expert : aucune carte à 20 ou moins ; Expert : au moins 9 cartes sur 12 au-dessus de 50 ;
7. au plus **15 jetons à dessiner** sur une carte ;
8. une **seule réponse possible d'après la fiche imprimée**, lue comme un élève, et c'est celle
   du corrigé ; jetons lisibles (ni chevauchés, ni mordus par une tache ou la pastille) ;
9. (29/09) une même réponse au plus 3 fois sur une fiche, jamais sur 3 cartes de suite.

**Contrôle** : `python3 verifier_graines.py` (ou `… avance`) rejoue les 18 fiches dans
Chromium, lit chaque fiche imprimée (énoncé et corrigé) et vérifie les règles 1 à 9, la liste
des 12 cartes des étapes du monde 1 dans `outils/splat_univers.html` et les QR des fiches.
À relancer après toute évolution de l'outil : **ne pas changer une graine sans refaire le tri**.

Les livrets imprimés avant le 30/09/2026 gardent leurs cartes : leur QR contient l'ancienne
graine, et le jeu en ligne la rejoue toujours. Les anciennes graines sont notées dans `render.py`.

## Régénérer

```bash
cd _sources/livret-petit-splat
python3 render.py                 # les trois livrets ET leurs trois livrets de correction
python3 render.py avance          # un seul (et sa correction)
python3 render.py --qr expert     # en refabriquant d'abord ses QR codes
python3 render.py --correction    # seulement les livrets de correction
python3 render.py --eleve         # seulement les livrets de l'élève
```

Sans option, le livret de l'élève et son livret de correction sont refaits **ensemble** :
ils restent ainsi rendus avec les mêmes graines et la même version de l'outil.

Dépendances : `playwright` (+ chromium), `pikepdf`, `qrcode[pil]`. `qpdf`, s'il est
présent, divise le poids des PDF par deux.

**Les graines du Monde 1 sont aussi celles des étapes du monde 1** de
`outils/splat_univers.html` (tableau `MONDES[0].etapes` : adresses `j:` et `f:`, et la liste
`eqs` des 12 cartes). Si l'une change, changer l'autre, relancer `render.py --qr normal`
(les QR pointent vers le jeu de l'élève avec les mêmes cartes que la fiche imprimée), puis
`verifier_graines.py`.

## Un piège déjà payé

L'imposition A3 passe par **pikepdf** et `add_overlay`, qui place chaque page A4
comme un *Form XObject*. Avec une simple translation de contenu (`pypdf`
`merge_transformed_page`), les **dégradés ne suivent pas** : un motif PDF est ancré
au repère de la feuille, pas au contenu déplacé — la page de droite se retrouvait
peinte avec la fin du dégradé (bandeau crème au lieu d'orange). Ne pas revenir à
pypdf pour l'imposition.

## Conventions

- Logos (relecture du monde 1, lots 2 et 3, 25-26/09/2026) : IREMI + maths&go **une
  seule fois**, en bas du dos (page 8), à droite du crédit. En dessous, le pictogramme et le nom de
  l'Unité apprenante Michel Debré (`/assets/img/logos/ua-debre/icone.svg`, demandé par Claire le
  26/09/2026). Aucun logo sur la couverture,
  ni en haut du dos, ni sur les six pages-fiches : `render.py` retire au rendu le bloc
  `.activity-logos` que l'outil imprime (l'outil, lui, garde ses logos). La signature
  `mathsgo.re/splat · CC BY-NC-SA 4.0` reste au pied des 8 pages.
  **PDF page par page (04/10/2026)** : chaque page-fiche du `….pdf` garde le logo de **l'IREMI seul**, à droite du bandeau, où il était (`JS_IREMI_SEUL`) — un collègue qui imprime une seule fiche n'a pas le dos ; maths&go est déjà au pied (`mathsgo.re/splat`). Le livret à plier (`…_a_plier.pdf`) ne change pas : aucun logo sur ses fiches. Chaque fiche est donc rendue deux fois, mêmes graines ; seul le bandeau diffère.
- Numéros de pages : « page N » en gras, au coin extérieur du bas des pages 2 à 7 (à droite
  si N est impair, à gauche s'il est pair), posé par `render.py`. Ni la couverture ni le
  dos. C'est le numéro dans le livret, pas celui de la feuille A3.
  **Attention** : l'outil écrit `mathsgo.re/splat/petit` au pied des fiches — c'est la
  bonne adresse pour une fiche imprimée depuis le générateur, mais pas pour un livret,
  qui est lu par des adultes cherchant l'ensemble des ressources. `render.py` repointe
  donc le pied des six fiches vers `/splat` (la collection SPLAT du catalogue) au
  moment du rendu, comme il injecte les QR (décision du 18/09/2026).
- Fiches 4 et 5 (plusieurs taches), relecture du monde 1, lot 4 (26/09/2026) : `render.py`
  coche l'option « Espace sous le schéma » de l'outil (`espace=1`) sur l'énoncé comme sur le
  corrigé. Une bande vide de 7,5 mm sous chaque schéma, pour un calcul intermédiaire, sans
  accolade imprimée. L'outil redessine alors chaque carte sur toute la largeur de la case
  (sa « table de dessin », sans aucun tirage) : les nombres des cartes ne changent pas, les
  graines restent valables, et le jeu en ligne (QR) n'est pas touché.
- QR des fiches : depuis le 26/09/2026, l'outil pose lui-même un QR « je rejoue en ligne »
  sur chaque fiche classique qu'il imprime. `render.py` demande `qr=0` : le livret garde son
  propre QR (`JS_QR`), un seul QR par page, et les PDF ne changent pas.
- Couverture : dans les cases Prénom et Classe, le mot est en haut de la case (2,2 mm de
  marge) pour laisser la place d'écrire ; la case garde sa taille (lot 4, 26/09/2026).
- Tout reste lisible imprimé en **noir et blanc** : aucun texte en couleur claire,
  aucune page en aplat teinté.
- Vocabulaire : « jetons » (jamais « billes », réservées aux mondes 5 et 6, Équations et relatifs).
