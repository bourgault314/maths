# Module Attention : sources

Les sources modifiables de la page `cps/module-attention.html`. On y trouve deux
séances de 55 min, chacune avec son diaporama, sa fiche à coller et sa feuille de
route, ainsi que le diaporama en ligne (`cps/module-attention-diaporama.html`).

## Ce qu'il y a ici

| Fichier | Rôle |
|---|---|
| `chars.py`, `scenes.py`, `car.py`, `objects2.py`, `extras.py` | Les dessins (SVG → PNG avec `rsvg-convert`) : personnages, scènes, planches d'objets, schémas, étoile rouge |
| `icons2.js` | Les petites icônes rondes (react-icons → PNG) |
| `common.js`, `s1.js`, `s2.js` | Les diaporamas (pptxgenjs) |
| `docs/build_docs.py` | Les fiches à coller et les feuilles de route (HTML → PDF avec Playwright) |
| `web/viewer_template.html` | Le modèle du diaporama en ligne |
| `web/vignettes.py` | Les aperçus de la page et la carte du catalogue |
| `img/` | Les images produites, et la vidéo du pensoscope (à nous) |

## Les deux versions

- **Version de l'animateur** (`node s1.js`) : les vidéos du gorille et du salon sont
  intégrées au fichier, ce qui permet de les lancer sans Internet. Ces vidéos ne
  sont pas les nôtres (D. Simons, 2010 ; chaîne « Cerveau, mode d'emploi »). Elles
  ne sont **pas** dans le dépôt, pas plus que les images de couverture tirées de
  ces vidéos (`cover_gorille.png`, `cover_salon.png`).
- **Version du site** (`SITE=1 node s1.js`, écrit dans `site/`) : à la place de ces
  vidéos, un lecteur sur lequel on clique ouvre la vidéo sur YouTube. Le pied de page
  porte « mathsgo.re · CC BY-NC-SA 4.0 ». Le script écrit aussi un `.json` (vidéos
  et notes de chaque diapo) qu'utilise le diaporama en ligne.

Pour les PDF : `SITE=1 python3 docs/build_docs.py` ajoute la signature mathsgo
(favicon + « mathsgo.re · CC BY-NC-SA 4.0 »). Variable `FAVICON` si le favicon du
site n'est pas à `../../favicon.svg`.

## Refaire le diaporama en ligne

1. `SITE=1 node s1.js && SITE=1 node s2.js`
2. Convertir chaque `.pptx` de `site/` en PDF (LibreOffice), puis en images
   (`pdftoppm -r 120`), redimensionnées en 1600 × 900, au format WebP →
   `cps/assets/module-attention/diapos/s1/01.webp`, etc.
3. Injecter les `.json` dans `web/viewer_template.html` à la place de `/*DATA*/null`
   → `cps/module-attention-diaporama.html`.
4. `python3 web/vignettes.py <dossier des assets>/` pour les aperçus.

Le thème des diaporamas (couleurs) est appliqué par `apply_theme.js`, le script du
skill pptx. On l'indique avec la variable `APPLY_THEME` ; sans lui, le fichier
reste valable, mais avec la palette Office par défaut.

La vidéo du pensoscope (`img/pensoscope.mp4`, 30 s : un point fait le tour d'un
cercle) a été fabriquée image par image (PIL), puis assemblée avec ffmpeg.

## Sources pédagogiques

Programme ADOLE / ATOLE (J.-P. Lachaux, CRNL/Inserm), S. Dehaene (les piliers
de l'apprentissage), D. Simons (*The Monkey Business Illusion*, 2010), routines
de type SLANT (D. Lemov). Toutes les images ont été dessinées pour ce module.
