# Batterie de tests Solèy (SOLEY.md §5)

Cette batterie est OBLIGATOIRE avant tout push touchant `outils/club_maths/soley.html`.
Elle pilote un vrai navigateur (Chromium via Playwright) et s'appuie sur l'API de test
exposée par le jeu : `window.SOLEY = {openLevel, simulate, state, LV, solve(i)}`.

## Lancer

```bash
# 1. Une seule fois : installer Playwright
pip install playwright
python -m playwright install chromium

# 2. Tester la version déployée (mathsgo.re)
python tests/soley/test_soley.py

# 3. Tester la copie locale AVANT un push (serveur intégré, chemins /assets/ résolus)
python tests/soley/test_soley.py --root .
```

Code retour 0 = tout est vert. `--headed` ouvre le navigateur pour observer.

## Ce que la batterie vérifie (numérotation de SOLEY.md §5)

| # | Contrôle | Méthode |
|---|---|---|
| T1 | Cohérence des données de chaque niveau : bornes, chevauchements (soleils, cases, roches, fruits, passes, pièces scellées), outils valides, `sol` posable (outils existants, cases libres, pas de doublon), clés de sauvegarde uniques | lecture de `SOLEY.LV` dans la page |
| T2 | `solve(i)` gagne pour TOUS les niveaux | `SOLEY.solve(i).win` sur les 60 niveaux |
| T3 | Tous les fruits sont ramassés par la solution de référence | `simulate().fruits` après chaque `solve` |
| T4 | Test négatif : une passe étroite bloque un rayon trop épais (contournement du niveau « Les demi-tunnels » perdant, rayon 1/1 tronqué une demi-case avant la passe) + contrôle positif (les 1/2 traversent) | montage manuel de `state.placed` |
| T5 | Écrans réellement masqués : `getComputedStyle` sur `#home`, `#lvscreen`, `#play` au chargement puis en naviguant AU CLIC (piège de spécificité #id vs .classe) | clics réels sur `.wrow` et `.lvcard` |
| T6 | Paysage (viewport 844×390) : zéro défilement de page, plateau à gauche de la colonne, clic précis sur une case avec letterbox pris en compte (même règle de correspondance que `boardClick`), victoire de bout en bout (cinématique puis fenêtre de fin), sauvegarde locale écrite | clics réels + `mouse.click` aux coordonnées calculées |
| T7 | Zéro erreur JavaScript (exceptions non rattrapées ET `console.error`) sur l'ensemble des passes | écouteurs `pageerror` / `console` |
| T8 | Progression verrouillée (chantier 1) : seuils ⌈5/8⌉ exacts par monde (lagon à 9 niveaux → forêt à 6), accueil neuf tout fermé sauf le lagon, clic sur monde fermé sans effet + condition lisible (seuil + découvertes), déblocage après 6 réussites semées dont les 3 découvertes, étoiles sur les cartes, mode classe `?classe` (tout ouvert + badge), zéro défilement horizontal téléphone | API SOLEY + `localStorage` semé avant chargement + clics réels |
| T9 | Chantier « Comprendre » (lot 1) : « Les quatre quarts » gagne par sa `sol` (1/4 exact dans chaque maison), le point de cours s'affiche après la victoire d'une découverte (pas d'un niveau ordinaire), panneau C3 avec QUATRE rayons terminaux + carte de savoir, prédire à révélation (réponse absente avant le toucher), « Revoir » rejoue, « J'ai compris ! » mène à la fenêtre de victoire, pas de réaffichage au rejeu + « Revoir le cours » sur la carte, condition « dont ses 3 découvertes », mode classe cours compris, vieille sauvegarde sans champ `cours` chargée telle quelle, stabilité 320 px et 402 px (cours + chaînes CALC corrigées R1) | victoires réelles via `solve`, clics réels, `SOLEY.montrerCours` |

La preuve structurelle du lot 1 (les 60 niveaux historiques intacts à l'octet, hors
champs autorisés par SPEC-COMPRENDRE-LOT1.md §8) se rejoue avec :
`node tests/soley/verifier-lot1-comprendre.mjs` (référence git figée, comme
`verifier-decoupage.mjs`).

## Mesurer la difficulté (lot du 15/08, SOLEY.md §5 point 13)

Deux familles à ne pas confondre :

```bash
# MESURER — force brute sur l'espace éclairé, rejoue simulate() du vrai moteur.
# Graines fixes : les chiffres du RAPPORT-ESSAI-NIVEAUX-DURS.md se rejouent.
node tests/soley/solveur-etalon.mjs --monde canne --sans-libre

# PROUVER — le lot ne touche que ce qu'il annonce (appariement par monde:nom).
node tests/soley/verifier-lot-niveaux-durs.mjs
```

`atelier-niveaux.mjs` (carte ASCII + plans trouvés), `carte-fruits.mjs` (où poser un
fruit pour qu'il se mérite) et `tailleur-champs.mjs` (recuit local) servent à
CONCEVOIR, pas à contrôler. `semeur-champs.mjs` est gardé comme preuve d'échec :
c'est lui qui a établi qu'au-delà d'environ 40 % d'obstacles le champ interdit au
lieu d'orienter.

## Détails qui comptent

- Le choix de cookies « refusé » est posé dans `localStorage` AVANT le chargement :
  aucune bannière n'intercepte les clics, aucune mesure d'audience n'est déclenchée.
- La passe paysage utilise un contexte NEUF (sauvegarde vierge) : le test « Bonus
  sauvegarde » prouve que la victoire écrit bien la clé stable `monde:nom`.
- `solve(i)` déclenche la cinématique ; la batterie purge les minuteries en rouvrant
  un niveau (`openLevel`) après la série.
- Si le jeu évolue (nouvelle pièce, nouveau champ de niveau), compléter T1
  (types d'outils, champs) et relancer la batterie AVANT le push.
