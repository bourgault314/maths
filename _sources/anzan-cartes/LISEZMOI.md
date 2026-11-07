# Les cartes des grades d'Anzan

Une carte par grade : les 20 kyu (du 20e au 1er, lot « anzan-cartes ») et les 20 dan (du 1er au 20e, timbre doré, lot « anzan-dan »), tous deux du 07/11/2026. Recto : une créature ou un lieu japonais ; dos : la créature et l'élément japonais visible, un message, un vrai proverbe japonais (jamais deux fois le même sur les 40).

- `textes-dos-cartes-kyu.md` : la source des textes du dos.
- `generer_textes.py` : écrit les 20 lignes `carte({...})` du bloc `CARTES_KYU` de `outils/calcul_mental/flash_anzan_core.js`.
- `convertir_images.py` : fabrique les 40 webp de `outils/calcul_mental/anzan-cartes/` (carte 640 × 904 et vignette 160 × 226) à partir des 20 PNG d'origine, fonds ramenés au même crème.

- `convertir_images_dan.py` : la même chose pour les 20 dan (carte 640 × 984 et vignette 160 × 246 : leur timbre est plus haut, elles ne sont jamais déformées). Les textes des dan sont écrits directement dans le bloc `CARTES_DAN` du même fichier.

Les PNG d'origine (1024 × 1536, 2 à 3 Mo chacun) ne sont pas dans le dépôt : ils sont gardés hors ligne (dossiers « Diplômes Kyu » et « Diplômes Dan »).

Images et textes : ceux de maths&go, sous la licence du site (CC BY-NC-SA 4.0).

