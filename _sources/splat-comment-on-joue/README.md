# « Comment on joue ? » — la vidéo et le diaporama de SPLAT! à télécharger

La carte « Comment on joue ? » de la page Splat du catalogue (section « Pour la classe »,
11/10/2026) propose trois façons de présenter le jeu à la classe :

| Variante | Fichier publié | Fabriqué par |
|---|---|---|
| Voir le film en ligne | `outils/splat_intro.html` (le film animé, en ligne depuis la PR #961) | — |
| Télécharger la vidéo (MP4) | `outils/splat_comment_on_joue.mp4` | `render_video.py` |
| Télécharger le diaporama (PDF) | `outils/splat_comment_on_joue_diaporama.pdf` | `render_diaporama.py` |

et la miniature de la carte, `assets/img/thumbnails/splat/comment-on-joue.png` / `.webp`, par `miniature.py`.

```
pip install --break-system-packages playwright==1.56.0 pypdf
python3 render_diaporama.py
python3 render_video.py      # ffmpeg dans le PATH
python3 miniature.py         # après les deux autres
```

## La vidéo

Calculée image par image à partir du film du site (`FILMS.intro.render(t)`), pas filmée à l'écran :
1920 × 1080, 30 images/s, H.264, sans son, environ 1,4 Mo. Aux trois questions, le film en ligne
s'arrête et attend ; la vidéo garde la question affichée **3 secondes** (choix de Gwenaël, 11/10/2026),
le prof met pause s'il veut laisser chercher plus longtemps. Le lien « ↺ Revoir le film » de l'écran
de fin est masqué (il ne mène nulle part dans une vidéo). **Si le film change, relancer `render_video.py`.**

## Le diaporama

`diaporama.html` est le diaporama d'introduction tel qu'il était en ligne du 26/08 au 10/10/2026
(`outils/splat_intro.html` juste avant la PR #961), gardé tel quel. Le PDF : 10 pages 4:3, ouverture en
plein écran et fondu entre les pages (comme le PDF donné à Claire le 27/08/2026). Seules différences
avec l'écran : la diapo « SPLAT ! » donne deux pages (le mot, puis la tache tombée), le bouton « Je joue ▶ »
mène à l'univers SPLAT! en ligne, et chaque page porte en pied la ligne de crédit de la page, complétée.

**Images de Steve Wyborney** : les diapos 2 à 8 reprennent des images de ses diaporamas. Elles ne sont
pas sous la licence du site, et le pied de chaque page le dit (décision de Gwenaël, 11/10/2026).

Police fixée à **Inter** (rendu dans le conteneur Linux), la plus proche de Segoe UI que montrait l'écran ;
DejaVu Sans, celle des livrets, est trop large pour les bulles (« vois-/tu ? » se coupait).
