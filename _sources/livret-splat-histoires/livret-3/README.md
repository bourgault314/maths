# Les histoires de SPLAT! — livret 3 (sources)

Vingt problèmes rédigés (niveau 3), en cinq fiches **H11 à H15**, trois exemples résolus et un dos
(« Le défi ! », deux problèmes qui mélangent les trois livrets). **12 pages A4**, à plier en
3 feuilles A3 (imposition 12|1 · 2|11 · 10|3 · 4|9 · 8|5 · 6|7, recto-verso bord court).
Trois corrigés, comme les livrets 1 et 2 : « ? », lettre, équations.

| Page | Contenu |
|---|---|
| 1 | couverture : l'exemple de la page 2 et sa carte (fiche 37 du monde 5, plateaux côte à côte) |
| 2 | exemple résolu : la balance (Léa, Tom et leurs paquets de cartes) |
| 3 · 4 | H11 la balance · H12 les rapports, niveau 3 |
| 5 | exemple résolu : les petites parts (le pas à pas de la projection de l'Enquête) |
| 6 | H13 les petites parts et le désordre |
| 7 · 8 | H14 je recopie (2 problèmes par page) |
| 9 | exemple résolu : deux gestes à la suite (les étapes du corrigé du Système, deux colonnes) |
| 10 · 11 | H15 deux gestes à la suite (2 problèmes par page) |
| 12 | le dos |

Décidé par Gwenaël le 15/10/2026 (questions à choix, planches) : 12 pages plutôt que 8 (à 4 par
page, les corrigés de H14-H15 tombaient entre 3,2 et 4,4 pt) ; un exemple résolu avant chaque dessin
nouveau ; H14 et H15 à 2 problèmes par page, **l'un sous l'autre** (chacun sur toute la largeur,
19 × 12 cm), le livret restant en portrait.

**Même fabrication que les livrets 1 et 2** (`../livret-1/README.md` : la carte cachée de chaque
problème, l'habillage posé dans la page de l'outil au rendu, les contrôles, le `fonts.conf`).
Ce qui est propre au livret 3 :

- **La balance (H11, famille B)** : la carte cachée est une carte de **`outils/splat_equations.html`**
  (`mode=EQSTEP&form=BOTH`, la fiche 37 du monde 5). `balance.js` y dessine les schémas en barres de
  la correction « le schéma en barres » de l'outil (`drawEquationPrintCorrectionColumn` : les deux
  côtés l'un sous l'autre, ce qu'on enlève hachuré), à la taille des corrigés de l'Enquête, avec la
  police que la page de l'outil leur donne vraiment ; `corrige.js` (`__corrigeBalance`) les pose dans la
  page de `splat.html` : un titre par étape (`habillage.py` : `depart`, `objet`, `unite`), le nom de
  chaque barre à gauche (`rangs`), le calcul à droite, puis « Je réponds » et « Je vérifie ». En
  équations : ② l'équation de l'énoncé, ③ « Je résous » sur les mêmes étapes (`balance_resous` dans
  `render.py`), chaque ligne revérifiée. 11.2 : le théâtre est à droite sur la carte (`inverser`).
- **Les petites parts (13.1)** : en équations, 𝑥 est **une petite part** (comme le corrigé
  de l'outil) ; `ordre` dans `habillage.py` ; « trois orange » (le pluriel de la couleur) devient le nom
  de l'histoire (`__plurielsHabilles`). Depuis le 17/10/2026, 13.1 a un « fois plus » et un « fois moins »
  (le mélange de l'ancien 13.2 ; nouvelle graine) et 13.2 est « on cherche le tout » (pas de carte,
  `habillage.py`, clé `tout` ; voir `../livret-1/README.md`). Écriture : l'étiquette sous une accolade
  courte, que l'outil écrit en petit (3,4 pt), et 13.3 (4,3 pt) remontent à 4,5 pt (`PLANCHER`) :
  plus aucune exception aux 4,5 pt.
- **Deux gestes à la suite (H15)** : en équations, « J'écris le système » = « Le grand achat » puis
  « Les deux petits achats », comme l'outil (`nSysteme`).
- **2 problèmes par page** (`PAR_PAGE`, `DISPOSITION_2P = "pile"`) : le corrigé en schéma essaie
  plusieurs largeurs de rangement des étapes (`LARGEURS_ESSAYEES`) et garde celle qui écrit le plus
  gros dans la carte (182 × 92 mm) ; le corrigé en équations passe sur deux colonnes (`colonnes`).
- **H14.1 et H14.2 en « je recopie »** (lot B, 21/10/2026, décision de Gwenaël : la fiche s'appelle « Je
  recopie ») : même carte, même graine ; le plan de correction est celui de l'outil pour le geste RECOPIE, sur
  la même situation (`corrige.js`, `__carteRecopie` ; `graines.py`, `RECOPIE` : le plateau recopié). 14.1 :
  l'achat de 19 € recopié 2 fois (38 €) contient l'achat de 32 € ; 14.2 : la pesée de 35 kg recopiée 3 fois
  (105 kg) contient la pesée de 25 kg. Le générateur de l'outil ne tire pas ces cartes en RECOPIE (14.1 : le
  second plateau a plus de jus que le premier ; 14.2 : le miroir 1 + 3, qu'il écarte).
- **L'ordre de l'énoncé** au Système : 15.4 `ORDRE` (les trois achats dans le désordre, dans le premier
  schéma et dans « Je vérifie ») ; 14.1 n'a plus d'`INVERSER` (l'achat recopié, 19 €, est le premier).
- **Page 5** : « Je vérifie » vérifie aussi les deux rapports (`VERIFS_EXEMPLE_U`, lot B).
- **Les exemples** : page 2 (`__corrigeBalance` en mode `exemple`), page 5 (`__exemple`, comme le
  livret 2), page 9 (`__exempleSys` : chaque étape du plan dessinée seule, `drawSysEtape`) ; les
  légendes sont dans `render.py` (`LEGENDES_B`, `LEGENDES_U`, `LEGENDES_G`).
- `cherche_graines.py` : la recherche des graines (familles C, D et B) ; `essai.py` : un corrigé seul.

## Régénérer

```bash
MATHS_RACINE=/chemin/du/clone/maths HISTOIRES_SORTIE=/chemin/des/pdf python3 render.py
```

Sous Linux, Playwright 1.56.0 et le vrai Chromium, `fonts.conf` avec DejaVu Sans (voir le livret 1).
Le rendu s'arrête si une carte n'a plus les nombres de son énoncé, s'il reste un mot de l'outil,
si une page déborde, si une écriture passe sous 4,5 pt, si une police
inattendue entre dans un PDF, ou si une ligne du corrigé en équations est fausse (150 lignes
vérifiées le 15/10/2026, sur main e3251de).
