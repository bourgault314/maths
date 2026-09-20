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

## Le choix des graines (17/09/2026)

Les graines du Monde 1 sont celles de la progression de Claire, reprises telles
quelles de `outils/splat_univers.html`. Celles d'Avancé et d'Expert ont été
retenues **automatiquement**, parmi des dizaines de milliers de tirages, en ne
gardant que les fiches qui respectent **toutes** ces règles :

1. aucune carte sous le plancher du niveau (**21** pour Avancé, **51** pour Expert) :
   chaque livret ouvre une tranche neuve, on ne refait jamais le niveau d'en dessous.
   Une seule exception, décidée avec Gwenaël le 17/09 : sur l'Expert, jusqu'à deux cartes
   peuvent descendre entre 21 et 50 si aucune graine ne tient le plancher plein — c'est le
   cas de la **fiche 6**, dont une carte fait 45 (les onze autres vont de 52 à 100) ;
2. sur une carte « dessine », **entre 1 et 15 jetons** à dessiner — jamais 0
   (« dessine rien » n'est pas un exercice), jamais 20 (ça décourage) ;
3. au plus **2 cartes sans aucun jeton visible** (elles font de bonnes cartes de
   division pure, mais pas une fiche entière) ;
4. **pas deux cartes identiques** (même total, mêmes visibles, même nombre de taches) ;
5. au plus **une carte** où chaque tache ne cache qu'un seul jeton ;
6. sur les fiches 5 et 6, **au moins 4 tailles de groupes différentes** (de 2 à 6 taches).

À qualité égale, on a préféré les fiches qui varient le plus (totaux étalés,
tailles de groupes variées), qui équilibrent les deux indices possibles (visibles
donnés / cachés donnés) et dont le volume de dessin reste proche de 100 jetons
pour douze cartes.

Ces règles ne sont pas décoratives : sans le plancher, une fiche « jusqu'à 50 »
sort des cartes à 4 ou 10 jetons ; sans le plafond de dessin, des cartes à 20
jetons à tracer. Le tri complet a dû passer sur 3 000 tirages par fiche pour
Avancé et 30 000 pour Expert — **ne pas changer une graine sans refaire le tri**. Le
script de tri n'est pas dans le dépôt : il lance l'outil dans un chromium sans affichage,
rejoue `createItem()` avec des dizaines de milliers de graines et garde celles qui passent.
Le refaire depuis ces règles prend une vingtaine de minutes.

## Régénérer

```bash
cd _sources/livret-petit-splat
python3 render.py                 # les trois livrets
python3 render.py avance          # un seul
python3 render.py --qr expert     # en refabriquant d'abord ses QR codes
```

Dépendances : `playwright` (+ chromium), `pikepdf`, `qrcode[pil]`. `qpdf`, s'il est
présent, divise le poids des PDF par deux.

**Si une graine du monde 1 change** dans `outils/splat_univers.html` (tableau
`MONDES[0].etapes`), reporter la nouvelle graine dans `NIVEAUX["normal"]["graines"]`,
puis relancer avec `--qr` : les QR pointent vers le jeu de l'élève avec les mêmes
cartes que la fiche imprimée.

## Un piège déjà payé

L'imposition A3 passe par **pikepdf** et `add_overlay`, qui place chaque page A4
comme un *Form XObject*. Avec une simple translation de contenu (`pypdf`
`merge_transformed_page`), les **dégradés ne suivent pas** : un motif PDF est ancré
au repère de la feuille, pas au contenu déplacé — la page de droite se retrouvait
peinte avec la fin du dégradé (bandeau crème au lieu d'orange). Ne pas revenir à
pypdf pour l'imposition.

## Conventions

- Logos IREMI + maths&go dans le bandeau des pages 1 et 8 ; rien dans le pied,
  hormis la signature `mathsgo.re/splat · CC BY-NC-SA 4.0` sur les 8 pages.
  **Attention** : l'outil écrit `mathsgo.re/splat/petit` au pied des fiches — c'est la
  bonne adresse pour une fiche imprimée depuis le générateur, mais pas pour un livret,
  qui est lu par des adultes cherchant l'ensemble des ressources. `render.py` repointe
  donc le pied des six fiches vers `/splat` (la collection SPLAT du catalogue) au
  moment du rendu, comme il injecte les QR (décision du 18/09/2026).
- Tout reste lisible imprimé en **noir et blanc** : aucun texte en couleur claire,
  aucune page en aplat teinté.
- Vocabulaire : « jetons » (jamais « billes », réservées au monde 4).
