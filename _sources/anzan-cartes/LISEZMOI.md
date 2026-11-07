# Les cartes des grades d'Anzan

Une carte par kyu, du 20e au 1er : une créature japonaise (recto) et son dos (la créature, un message, un proverbe). Lot « anzan-cartes » du 07/11/2026.

- `textes-dos-cartes-kyu.md` : la source des textes du dos.
- `generer_textes.py` : écrit les 20 lignes `carte({...})` du bloc `CARTES_KYU` de `outils/calcul_mental/flash_anzan_core.js`.
- `convertir_images.py` : fabrique les 40 webp de `outils/calcul_mental/anzan-cartes/` (carte 640 × 960 et vignette 160 × 240) à partir des 20 PNG d'origine, fonds ramenés au même crème.

Les PNG d'origine (1024 × 1536, 2 à 3 Mo chacun) ne sont pas dans le dépôt : ils sont gardés hors ligne (dossier « Diplômes Kyu »).

Images et textes : ceux de maths&go, sous la licence du site (CC BY-NC-SA 4.0).

Les dan n'ont pas encore leur série : un dan réussi montre une carte simple « 🥋 1er dan ».
