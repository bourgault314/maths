# Les histoires de SPLAT! — livret 1 (sources)

Vingt problèmes rédigés, en cinq fiches **H1 à H5** (4 problèmes par page), plus une couverture,
une page 2 (l'exemple résolu pas à pas) et un dos (« Le défi ! », deux problèmes avant / après).
8 pages A4, à plier en A3. Trois corrigés : inconnue « ? » et inconnue en lettre (𝑥 ; au Système,
la lettre de chaque quantité, 𝑡, 𝑏…), avec le schéma ; et **en équations**, sans schéma (08/10/2026) :
① je choisis l'inconnue, ② j'écris l'équation, ③ je résous, puis « Je réponds » et « Je vérifie ».

**Sur le site** : `outils/livrets_splat.html`, la 7ᵉ entrée (en essai derrière la clé `?essai=1` le
15/10/2026, ouverte à tous le 17/10/2026). Le script trouve le dépôt deux dossiers plus haut ; les PDF
vont dans `outils/` par `../publier.py` (variable `HISTOIRES_SORTIE` pour le dossier du rendu).

## Le principe

Chaque problème **cache une carte de l'outil** `outils/splat.html` : `graines.py` donne l'adresse
et la graine qui tirent exactement les nombres de l'énoncé (`render.py` le revérifie à chaque
rendu, contre les contrôles de `problemes.py`). Les corrigés sont **dessinés par l'outil** sur la
carte cachée ; l'habillage (`habit.js`, données dans `habillage.py`) se pose dans la page de
l'outil au rendu, sans la modifier :

- les noms de l'histoire à la place des couleurs (« garçons », « tee-shirt ») ;
- ses phrases à la place de « la tache … cache donc … jetons » (« Les garçons ont donc marqué 21 buts ») ;
- « Je retourne : … » écrit avec les mots de l'histoire ;
- la phrase de « Je réponds » ; une seule teinte pour les barres (le vert du livret).

Le rendu **s'arrête** s'il manque une phrase, ou s'il reste dans un dessin « tache », « jeton »,
« plateau », « TOTAL » ou un nom de couleur.

| Fiche | Dessin de l'outil | Habillage particulier |
|---|---|---|
| H1 Le tout et ses parties | le schéma du corrigé du monde 2 (`drawSixCorrectionSchema`), réduit à la taille des autres | les paquets de l'énoncé (62 € et 45 €) dans deux cases, au lieu d'une case « 107 » |
| H2 à H4 | la correction imprimée de l'Enquête (`drawEnqueteCorrectionImprimee`) | noms, phrases, « Je retourne » ; 4.2 : « on cherche le tout » (voir plus bas) |
| H5 Deux situations à comparer | la correction du Système (`drawSysCorrectionImprimee`, plan `_sys.plan`) | « Les deux achats » dans l'ordre de l'énoncé (5.1, 5.3, 5.4) ; l'initiale dans chaque case et une légende (« T : un tour de manège ») ; le système écrit en mots (« 2 enfants + 3 adultes = 36 ») ou en lettres |
| page 2 | le pas à pas de la projection (`enqueteG3Etapes`, `enqueteG3Dessiner`), habillé | la carte de la couverture garde SES couleurs : c'est la carte que l'histoire cache |
| dos | pas de carte : les briques de l'outil (`drawBarModelPartsInGroup`, `enqueteTitreEtape`, `drawEnqueteCalculs`) | `DEFI_SCHEMAS` dans `render.py` |

Partout, la fin d'un corrigé est « Je réponds » (la phrase encadrée) puis « Je vérifie », dessinés
par `drawEnqueteCalculs`. **« Je vérifie » vérifie le total ET chaque indice** (17/10/2026, choix de
Gwenaël après l'audit : « filles = garçons + 5 : 26 = 21 + 5 ✓ » ; sans total, les deux indices), dans
les trois corrigés — `habit.js` le demande à l'outil (`sansIndices`), qui garde, lui, « le total
seulement » (07/10). Pour que le corrigé garde l'écriture d'avant, les lignes en plus sont resserrées
(`__verifsSerrees`, écriture 42 → 36 au plus) puis reprises sur les blancs entre ①, ② et ③.
Depuis le lot B (21/10/2026), la page 2 (l'exemple) fait de même : « 9 + 17 = 26 ✓ · 17 − 9 = 8 ✓ »
(`VERIFS_EXEMPLE` dans `render.py`, la 1re ligne comparée à celle de l'outil, chaque ligne recalculée).

**« On cherche le tout »** (17/10/2026, un problème par livret : 4.2 ici, 6.2 et 13.2 dans les livrets 2
et 3) : le total est l'inconnue, les parties sont données par un nombre et des indices. Une carte SPLAT!
donne toujours son total : ces problèmes n'ont donc **pas de carte** (`graines.py`). Leur corrigé est quand
même dessiné par les fonctions de l'Enquête (`drawEnqueteBarres`, `drawEnqueteLigne`, `drawEnqueteCalculs`),
sur un modèle écrit à la main (`habillage.py`, clé `tout` ; le dessin : `../tout.js`) : le même dessin que
les voisins de la fiche, « ? » (𝑥) sur le total seulement. En équations : les blocs de `tout.equation`,
vérifiés ligne à ligne comme ceux du dos.

**Le corrigé en équations** (`window.__equation` dans `corrige.js`) se lit aussi sur la carte cachée :
- H1 : les paquets de l'énoncé et les taches (`62 + 45 + 𝑥 = 150`, `2 × 𝑥 + 3 = 31`) ;
- H2 à H4 : chaque quantité écrite avec 𝑥 d'après les barres du modèle de l'outil
  (`enqueteBarresModele` : « Les filles : 𝑥 + 5 »), puis la somme = le total ; sans total, `3 × 𝑥 = 𝑥 + 26` ;
  « Je résous » = les calculs du corrigé en lettre de l'outil ;
- H5 (revu le 15/10, choix de Gwenaël sur planche : « le mélange » ; 5.2 en masses et 5.3 en longueurs depuis
  le 17/10, mêmes cartes — la légende des lettres dit « la masse d’un sac… », `legendeLettre`, comme le livret 2) : ① la légende des lettres, puis
  les étapes du corrigé en équations de l'outil (lot M4-8, `sysEquationsMorceaux` sur le plan habillé) :
  ② le système avec l'accolade, ③ les étapes aux titres du corrigé en schéma (« Je remplace le petit
  achat par son prix », « Je retire », « Je partage ») ; puis « Je réponds » et « Je vérifie » du livret ;
- dos : écrit à la main dans `DEFI_EQUATIONS` (`render.py`).

`habillage.py` donne, pour H1 à H4, la phrase de l'inconnue (`inconnue` : « le nombre de buts des garçons »).

## Régénérer

```bash
MATHS_RACINE=/chemin/du/clone/maths HISTOIRES_SORTIE=/chemin/des/pdf python3 render.py
python3 render.py --eleve        # le livret de l'élève seulement
python3 render.py --correction   # les trois corrigés seulement
python3 render.py --planche-equation 2 5   # une planche d'essai du corrigé en équations (fiches H2, H5)
```

Sous **Linux**, avec le vrai Chromium (`channel="chromium"`, Playwright 1.56.0), comme tous les
livrets SPLAT! : l'écriture des cartes est DejaVu Sans. **Attention** : si `system-ui` tombe sur
une autre police (Inter, le 08/10/2026 : « noire », « verte » mal écrits sur les taches), le rendu
s'arrête. Remède, dans `~/.config/fontconfig/fonts.conf` :

```xml
<fontconfig>
  <alias binding="strong"><family>system-ui</family><prefer><family>DejaVu Sans</family></prefer></alias>
  <alias binding="strong"><family>sans-serif</family><prefer><family>DejaVu Sans</family></prefer></alias>
</fontconfig>
```

Dépendances : `playwright`, `pikepdf` ;
`qpdf` s'il est là. Sortie : `Les-histoires-de-SPLAT-livret-1.pdf` (page par page, logo IREMI
dans le bandeau des fiches), `…-a-plier.pdf` (4 pages A3 imposées 8|1 · 2|7 · 6|3 · 4|5,
recto-verso bord court, aucun logo sur les fiches), `…-corrige(.pdf, -a-plier.pdf)`,
`…-corrige-lettre(.pdf, -a-plier.pdf)`, `…-corrige-equations(.pdf, -a-plier.pdf)`, et `rapport-mise-en-page.json` (place pour écrire,
taille des écritures du corrigé, carte par carte).

## Contrôles faits au rendu

- chaque carte cachée a exactement les nombres de son énoncé ;
- aucun mot de l'outil ne reste dans un dessin ;
- aucun bloc ne déborde, le pied n'est pas recouvert ; un titre de fiche trop long se coupe après le tiret ;
- aucune écriture de corrigé sous 4,5 pt (les calculs font 7,6 à 9 pt, comme les corrigés de l'Enquête) ;
  pour un corrigé serré, `render.py` a deux réglages (17/10/2026) : `SERRE` (les blancs entre ①, ② et ③
  à 0) et `PLANCHER` (la plus petite écriture du dessin, remontée à 4,5 pt sur le papier) ;
- seules les polices Poppins, DejaVu Sans et SplatLettres sont dans les PDF ;
- corrigé en équations : chaque ligne écrite en nombres et en lettres (« 2 × 𝑥 = 47 − 5 = 42 ») est
  recalculée avec les valeurs de la carte (84 lignes le 08/10/2026, 92 le 17/10/2026, toutes vraies).
