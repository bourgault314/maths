# Les histoires de SPLAT! — les sources des trois livrets

Les problèmes de SPLAT! écrits en histoires : trois livrets (parties 1 à 3, fiches H1 à H15),
chacun avec trois corrigés (schéma avec « ? », schéma avec une lettre, en équations). Sur le site :
`outils/livrets_splat.html`, la 7e entrée, sous les six mondes (`#histoires`).

**Ouvertes à tous du 17 au 21/10/2026** (lot A, après l'audit). Du 15 au 17/10, elles étaient en
essai : l'onglet (`#onglet-h`) et le panneau (`#histoires`) portaient `data-prepa` dans la page, et
seule la clé `?essai=1` (celle des mondes en préparation, `assets/js/splat-etapes.js`) les montrait.
**Remises « en préparation » le 21/10/2026** (Gwenaël ne les a pas encore relues) : la carte
`#onglet-h` reste visible mais grisée, sans clic, « 🚧 en préparation » (`data-grise`,
`aria-disabled`, `tabindex="-1"`) ; le panneau `#histoires` porte `data-prepa`. La clé
`?essai=1` rouvre les deux : https://mathsgo.re/outils/livrets_splat.html?essai=1#histoires.
Les PDF restent en ligne à leur adresse. Pour les rouvrir à tous : retirer ces attributs, et
`EN_ESSAI = false` dans `tests/livret-splat-histoires.test.mjs`.

| Dossier | Sur le site | Fiches | Pages |
|---|---|---|---|
| `livret-1/` | partie 1 | H1 à H5 | 8 (2 feuilles A3) |
| `livret-2/` | partie 2 | H6 à H10 | 8 (2 feuilles A3) |
| `livret-3/` | partie 3 | H11 à H15 | 12 (3 feuilles A3) |

Chaque dossier a son README (ce qui est propre au livret) ; la fabrication commune (la carte
cachée de chaque problème, l'habillage, les contrôles du rendu, `fonts.conf`) est décrite dans
`livret-1/README.md`. `tout.js`, commun aux trois : le dessin du corrigé des problèmes « on cherche le
tout » (4.2, 6.2, 13.2 — 17/10/2026), qui n'ont pas de carte.

**Lot A (17/10/2026, après l'audit du 17/10)** : textes précisés (« même valeur », 9.2 la frise, H5 en
masses et en longueurs…), un problème « on cherche le tout » par livret, « Je vérifie » qui vérifie aussi
chaque indice, plus aucune écriture de corrigé sous 4,5 pt.

**Lot B « énoncés » (21/10/2026, après l'audit Codex du 21/10, décisions de Gwenaël)** : mises en page inchangées
(les corrigés restent à 4 problèmes par page, H14-H15 à 2) ; nombres, cartes et graines inchangés.
- énoncés retouchés, textes aussi courts : 1.4 (futsal), 5.2, 14.2 et 15.2 (« Tous les sacs d’une même sorte ont
  la même masse. »), 8.4 (20 kg de fournitures), 11.4 (« un wagon de Malo »), 12.1 (« Préparer la pâte »), 13.2
  (« Son parcours à vélo »), 14.1 (« une part de gâteau »), 15.3 (une phrase au lieu de la parenthèse) ;
- H14.1 et H14.2 corrigés en **« je recopie »** (le titre de la fiche), dans les trois corrigés (`livret-3/corrige.js`,
  `__carteRecopie` ; `livret-3/graines.py`, `RECOPIE`) ; résumé de H14 sur la couverture du livret 3 ;
- « Je vérifie » des exemples et des défis : le total ET chaque indice (pages 2 des livrets 1 et 2, page 5 du
  livret 3, défi 2 du livret 2), chaque ligne recalculée au rendu. L'Enquête et l'outil ne changent pas.

## Refaire un livret (un texte, un nombre ou une graine changés)

1. `MATHS_RACINE=<racine du dépôt> HISTOIRES_SORTIE=<dossier> python3 livret-N/render.py`
   — sous Linux, Playwright 1.56.0 et le vrai Chromium, avec le `fonts.conf` de `livret-1/README.md`.
   Le rendu s'arrête tout seul si une carte n'a plus les nombres de son énoncé, s'il reste un mot
   de l'outil dans un dessin, si une page déborde, si une police inattendue entre dans un PDF ou si
   une ligne du corrigé en équations est fausse.
2. `python3 publier.py N <dossier> <racine du dépôt>` : copie les 8 PDF dans `outils/` sous leur
   nom du site et refait la miniature de la couverture (png et webp).
3. Si la couverture a changé : bumper le `?v=` de sa miniature dans `outils/livrets_splat.html`.

| Rendu par `render.py` | Publié dans `outils/` |
|---|---|
| `Les-histoires-de-SPLAT-livret-N.pdf` · `…-a-plier.pdf` | `livret_splat_histoires_N.pdf` · `…_a_plier.pdf` |
| `…-corrige.pdf` (schéma, « ? ») | `livret_splat_histoires_N_correction.pdf` |
| `…-corrige-lettre.pdf` (schéma, 𝑥) | `livret_splat_histoires_N_correction_lettre.pdf` |
| `…-corrige-equations.pdf` | `livret_splat_histoires_N_correction_equations.pdf` |

(et chacun son `…_a_plier.pdf`). Les trois livrets ont été rendus le 15/10/2026 sur main 980fed5
(#991) : identiques, page à page, aux PDF relus. Rendus à nouveau le 17/10/2026 sur main acc576b (#1007)
pour le lot A : comparés page à page à ceux du site, seules les pages touchées ont changé.
