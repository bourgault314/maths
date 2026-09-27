# Livrets « SPLAT! Relatifs » (monde 6) — 8 pages chacun, à plier

Les six fiches du monde 6 de l'univers SPLAT! en **deux livrets**, un par partie de la carte des
mondes (lot R2, 26/09/2026) :

| Livret | Fiches | PDF produits |
|---|---|---|
| `livret1` — l'inconnue d'un seul côté | 38 Les jetons rouges arrivent · 39 Des négatifs partout · 40 La tache opposée | `outils/livret_splat_relatifs_1.pdf` · `…_a_plier.pdf` |
| `livret2` — l'inconnue des deux côtés | 41 Des taches des deux côtés · 42 Une tache opposée d'un côté · 43 Le grand mélange | `outils/livret_splat_relatifs_2.pdf` · `…_a_plier.pdf` |

Et leurs corrigés, par l'équation : `…_correction.pdf` · `…_correction_a_plier.pdf`.

**La tache opposée sur le papier (lot R3, 27/09/2026, décision de Gwenaël)** : le livret 1 garde
le mot « opposé » pour la découvrir ; le livret 2 écrit la **lettre sur chaque tache** — « 𝑡 »,
« −𝑡 » — grâce au réglage d'adresse `taches=lettre` de l'outil (`lettre=True` dans `VUES`), et
son corrigé montre sous une tache « −𝑡 » la valeur de −𝑡. La nouveauté de la couverture et les
deux premiers rappels du dos du livret 2 le disent avec la même tache « −𝑥 » (`JS_LETTRE`).

Une seule famille, celle de l'équation : les plateaux côte à côte (vue Équation de l'outil,
plateau à 80 % de la case), la place dessous pour écrire. En relatifs, l'outil ne dessine pas de
schéma en barres (une barre négative ne se dessine pas). L'inconnue en lettre seulement.

## Les 8 pages

1. **Couverture** — bandeau violet (le monde 6 de la carte des mondes), « Mon livret · Monde 6 ·
   Livret 1 » (ou 2), « Comment ça marche ? » (l'exemple, voir plus bas), les deux nouveautés du
   monde (le jeton rouge, la tache « opposé »), « Nom, prénom » + Classe, le sommaire.
2. à 7. **Les trois fiches**, deux pages chacune (« Fiche N », puis « Fiche N bis »), telles que
   l'outil les imprime (6 cartes par page) ; le QR de la fiche tout à droite du bandeau, aucun
   logo, pas de numéro de page (le numéro de fiche du bandeau suffit).
8. **Dos** — « Encore des cartes ! » (trois QR), « La suite du voyage » (livret 1 → livret 2 ;
   livret 2 → la carte des mondes), « Pour se souvenir » (cinq rappels), crédits et le seul logo
   maths&go.

## Les fiches : celles de la carte des mondes, et celles du jeu en ligne

Rien n'est tiré ici : `FICHES` reprend **exactement** les réglages et les graines de
`outils/splat_univers.html` (monde 6). Chaque fiche enchaîne plusieurs séries par `suite` ;
`zero=1` (lot R1 de l'outil) tire une équation à solution nulle (fiches 39, 41, 43). À chaque
rendu, `render.py` s'arrête si une fiche n'a pas 12 cartes sur 2 pages de 6, si ses cartes ne sont
pas celles de la série « Le jeu de l'élève » de la carte des mondes, si le livret et son corrigé
diffèrent, si l'exemple de couverture est une carte du monde, ou si une page déborde.

`tests/splat-relatifs-monde6.test.mjs` épingle `render.py`, la carte des mondes, la page courte des
QR et `cartes.json` les uns sur les autres : **si une graine change**, la reporter dans la carte
des mondes (et sa série « j »), dans `splat/relatifs/livret/index.html`, puis relancer
`python3 render.py`.

## Les QR codes passent par une page courte

- `https://mathsgo.re/splat/relatifs/livret/?f=38` (… 43) ouvre **exactement** le lien « Le jeu de
  l'élève » de la carte des mondes : ÉquaSplat, `parcours=m4eN`, la même étoile.
- `?s=1` … `?s=6` : les séries du dos, six équations tirées au hasard aux réglages d'une fiche,
  jouées aussitôt dans ÉquaSplat (`jouer=1`), sans étoile. 1, 2, 3 au dos du livret 1 ; 4, 5, 6 au
  dos du livret 2.

## Les exemples de couverture

Dessinés par l'outil (la carte de la correction courte « l'équation » : les taches dévoilées dans
une fenêtre, la résolution fléchée dans l'autre), sur des cartes qui ne sont dans aucune fiche ;
le texte « Comment ça marche ? » est écrit à partir de la carte et de sa résolution
(`textes_exemple`) :

- livret 1 : **2𝑛 + 3 – 9 = –12**, 𝑛 = –3 (graine 1838) ;
- livret 2 : **–𝑏 + 6 = 2𝑏 – 9**, 𝑏 = 5 (graine 211).

## Régénérer

```bash
cd _sources/livret-splat-relatifs
python3 render.py            # les DEUX livrets et leurs corrigés
python3 render.py livret1    # un seul (livret1 | livret2)
python3 render.py --qr       # en refabriquant d'abord les QR codes
```

Dépendances : `pip install playwright pikepdf "qrcode[pil]"`, le **vrai Chromium**
(`channel="chromium"`), FreeSerif pour la lettre, `qpdf` s'il est installé. Puis refaire les
miniatures de la page des livrets (page 1 à 120 dpi → 993 × 1404, PNG et WebP plus légère) :
`assets/img/thumbnails/splat/livret-splat-relatifs-1.png/.webp` et `-2`.

*mathsgo.re · CC BY-NC-SA 4.0*
