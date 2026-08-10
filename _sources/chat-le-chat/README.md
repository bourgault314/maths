# Chat, c'est toi le chat !

Jeu de positionnement dans l'espace pour GS-CP, adaptable en MS avec
accompagnement, d'après une situation de *Un rallye mathématique à l'école
maternelle ? Oui, c'est possible !* (Fabien Emprin et Fabienne
Emprin-Charotte, CRDP Champagne-Ardenne). Version modernisée pour maths&go :
20 séries en 4 niveaux.

## Fichiers

- `game.py` — modèle du jeu, solveur et transcription des cartes disponibles ;
- `gen_series.py` — fabrique les 20 séries et écrit `series20.json` ;
- `series20.json` — données publiables et provenance éditoriale de chaque série ;
- `gen.py` — génère `out/livret.html` (règle, exemple guidé, cartes et solutions) ;
- `verify.py` — vérifie les données, les niveaux et le HTML généré ;
- `projection_cases.json` — exemple guidé et 12 défis inédits à projeter ;
- `gen_projection.py` — valide ces défis et génère la page projetable autonome ;
- `out/livret.pdf` — livret final de 24 pages (non versionné ici ; la copie
  publique est `../../outils/chat-cest-toi-le-chat.pdf`).

La page projetable publique est
`../../outils/chat-cest-toi-le-chat-projection.html`. Toute la classe peut
chercher depuis sa place, puis vérifier les cartes à voix haute lors de la mise
en commun. Reproduire le placement au sol avec quatre enfants reste une variante
possible, mais n'est pas nécessaire pour utiliser la projection.

Les notes de provenance restent dans `series20.json` pour permettre les futures
modifications, mais elles ne sont pas imprimées sur les pages de solutions.

## Provenance des séries

Les anciennes séries 1, 7, 6, 3, 10, 4, 5, 2, 8 et 9 du jeu papier sont
respectivement devenues les séries 2, 3, 5, 6, 8, 9, 10, 11, 12 et 16 du
livret. Les anciennes séries 4 et 5 ont pu être recoupées avec les cartes
diffusées par le CRDP. Les anciennes séries 1, 2, 6, 7, 8, 9 et 10 ont été
transcrites depuis les photos de l'exemplaire conservé par l'autrice du site ;
leur origine éditoriale exacte n'est pas établie. Les cartes de l'ancienne
série 3 n'ayant pas été retrouvées, la série 6 est la seule reconstruction,
réalisée à partir de la grille solution conservée.

Les séries 1, 4, 7, 13, 14, 15, 17, 18, 19 et 20 sont de nouvelles séries
maths&go. Le générateur et le vérificateur contrôlent notamment le nombre de
placements, les doublons par symétrie et le caractère indispensable des quatre
cartes dans les nouvelles séries des niveaux 3 et 4. Dans les nouvelles séries
expertes, chaque indice est également indispensable.

Références documentaires : [notice HAL](https://hal.science/hal-02969454v1),
[activité archivée du CRDP](https://web.archive.org/web/20160318140806/http://www.cndp.fr/crdp-reims/index.php?id=842)
et [cartes 4.x/5.x archivées](https://web.archive.org/web/20160319211902id_/http://www.cndp.fr/crdp-reims/fileadmin/documents/complements_en_ligne/rallyes_maths/exercice_supp_chat_c_est_toi_le_chat.pdf).

## Régénérer

Les scripts résolvent tous leurs chemins depuis leur propre emplacement. Ils
peuvent donc être lancés depuis n'importe quel répertoire :

```sh
python3 /chemin/vers/le-depot/_sources/chat-le-chat/gen_series.py
python3 /chemin/vers/le-depot/_sources/chat-le-chat/gen.py
python3 /chemin/vers/le-depot/_sources/chat-le-chat/verify.py
python3 /chemin/vers/le-depot/_sources/chat-le-chat/gen_projection.py
python3 /chemin/vers/le-depot/_sources/chat-le-chat/gen_projection.py --check
```

Le vérificateur du livret doit afficher `0 erreur(s)` et le contrôle de la page
projetable doit confirmer 12 défis inédits, 6 vrais et 6 faux.

Pour produire le PDF avec Chrome ou Chromium :

```sh
src=/chemin/vers/le-depot/_sources/chat-le-chat
chromium --headless --no-sandbox --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$src/out/livret.pdf" \
  "file://$src/out/livret.html"
```

Selon l'installation, la commande du navigateur peut s'appeler
`chromium-browser`, `google-chrome` ou `google-chrome-stable`. Après contrôle du
PDF, mettre à jour la copie publique :

```sh
cp "$src/out/livret.pdf" /chemin/vers/le-depot/outils/chat-cest-toi-le-chat.pdf
```

Le générateur attend le logo `assets/img/mathsgo-logo-780.png` et le fichier
`favicon.svg` à la racine du dépôt. Il n'utilise aucun autre fichier image.
