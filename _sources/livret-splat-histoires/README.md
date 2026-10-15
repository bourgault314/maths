# Les histoires de SPLAT! — les sources des trois livrets

Les problèmes de SPLAT! écrits en histoires : trois livrets (parties 1 à 3, fiches H1 à H15),
chacun avec trois corrigés (schéma avec « ? », schéma avec une lettre, en équations). Sur le site :
`outils/livrets_splat.html`, la 7e entrée, sous les six mondes (`#histoires`).

**En essai depuis le 15/10/2026** : l'onglet (`#onglet-h`) et le panneau (`#histoires`) portent
`data-prepa` dans la page, donc cachés au public, avec ou sans JavaScript ; la clé `?essai=1`
(celle des mondes en préparation, `assets/js/splat-etapes.js`) les montre. Pour les ouvrir à
tous : retirer ces deux `data-prepa` (et suivre ce que dit `tests/livret-splat-histoires.test.mjs`).

| Dossier | Sur le site | Fiches | Pages |
|---|---|---|---|
| `livret-1/` | partie 1 | H1 à H5 | 8 (2 feuilles A3) |
| `livret-2/` | partie 2 | H6 à H10 | 8 (2 feuilles A3) |
| `livret-3/` | partie 3 | H11 à H15 | 12 (3 feuilles A3) |

Chaque dossier a son README (ce qui est propre au livret) ; la fabrication commune (la carte
cachée de chaque problème, l'habillage, les contrôles du rendu, `fonts.conf`) est décrite dans
`livret-1/README.md`.

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
(#991) : identiques, page à page, aux PDF relus.
