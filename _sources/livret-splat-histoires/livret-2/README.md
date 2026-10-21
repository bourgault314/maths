# Les histoires de SPLAT! — livret 2 (sources)

Vingt problèmes rédigés (niveau 2), en cinq fiches **H6 à H10** (4 problèmes par page), plus une
couverture, une page 2 (un exemple résolu « je complète » : les coquillages de Lila, Noa et Tom) et
un dos (« Le défi ! », deux problèmes avant / après : on cherche le changement ; deux changements
liés). 8 pages A4, à plier en A3. Trois corrigés, comme le livret 1 : « ? », lettre, équations.

**Même fabrication que le livret 1** (`../livret-1/README.md` explique tout : la carte cachée
de chaque problème, l'habillage posé dans la page de l'outil au rendu, les contrôles, le `fonts.conf`).
Ce qui est propre au livret 2 (15/10/2026) :

- **H9, problèmes 1 et 2** (« des paquets », fiche 36 du monde 5) : la carte cachée est une carte du
  **monde 2** (3 ou 5 taches, deux paquets de jetons) ; le corrigé en schéma est celui du monde 2 avec
  les deux paquets de l'énoncé dans deux cases ; le corrigé en équations écrit l'équation **dans
  l'ordre de l'énoncé, puis regroupée** (`habillage.py`, clé `equation`).
- **Je complète** (6.1, 6.4, l'exemple) et **« de moins que le triple »** (8.2) : dans le corrigé en
  équations, une barre complétée s'écrit `k × 𝑥 − ajout` ; « Je résous » commence par
  « 3 × 𝑥 − 30 = 150 », « 3 × 𝑥 = 150 + 30 = 180 », puis reprend les calculs de l'outil (`corrige.js`).
  Sous le schéma regroupé, « une Lila » (une part qui vaut Lila) devient « Lila » (`habit.js`).
- **Une quantité déjà connue** (8.4, un jeton visible) : « 2 × 𝑥 + 2 + 4 = 20 », puis
  « 2 × 𝑥 + 2 = 20 − 4 = 16 » ; la ligne de l'outil « 20 − 4 = 16 jetons sous les taches » est
  habillée (`remplacer`).
- **Système à trois inconnues** (10.2, 10.3, 10.4) : la légende des lettres sur deux lignes ;
  `legendeLettre` pour les mesures et les pesées (« 𝑟 : la longueur du bâton rouge, en cm ») ; le
  corrigé en équations resserre ses lignes (`pas` 1,12 au lieu de 1,3) ; les titres de l'outil
  (« Je remplace un petit plateau par son total ») sont habillés (`titres`).
- **10.1** : l'énoncé donne le petit achat d'abord → `INVERSER` (comme 5.1 du livret 1). 10.3 (l'escalier)
  est écrit dans l'ordre de l'outil, le grand achat d'abord.
- **10.3** (sept étapes dans un quart de page) écrivait ses petits calculs à 4,2 pt : depuis le 17/10/2026,
  `PLANCHER` les remonte à 4,5 pt au moins (plus aucune exception). **9.3** : `SERRE` (son énoncé a pris une
  ligne, « tous de même durée »).
- **8.4** (lot B, 21/10/2026) : « 20 kg de fournitures » ; **D4** (le dos) : « Je vérifie » vérifie aussi le double
  (« 18 = 2 × 9 ») ; page 2 : « Je vérifie » vérifie aussi les deux écarts (`VERIFS_EXEMPLE`).
- **6.2** (17/10/2026) : « on cherche le tout » — pas de carte, corrigé dessiné sur un modèle (`habillage.py`,
  clé `tout` ; voir `../livret-1/README.md`).
- `cherche_graines.py` : la recherche des graines (le générateur rejoué dans Chromium, 20 000 graines
  par lot) ; `essai.py` : un corrigé seul, pour voir les erreurs d'habillage avant le rendu complet.

## Régénérer

```bash
MATHS_RACINE=/chemin/du/clone/maths HISTOIRES_SORTIE=/chemin/des/pdf python3 render.py
```

Sous Linux, Playwright 1.56.0 et le vrai Chromium, `fonts.conf` avec DejaVu Sans (voir le livret 1).
Le rendu s'arrête si une carte n'a plus les nombres de son énoncé, s'il reste un mot de l'outil,
si une page déborde, si une écriture passe sous 4,5 pt, si une police inattendue entre
dans un PDF, ou si une ligne du corrigé en équations est fausse (111 lignes vérifiées le 15/10/2026, 109 le 17/10/2026).
