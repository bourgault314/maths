# Chat, c'est toi le chat !

Jeu de positionnement dans l'espace (maternelle et +), d'après une situation du
rallye mathématique de maternelle (C. Emprin-Chartoote et F. Emprin, CRDP
Champagne-Ardenne). Version modernisée pour maths&go : 20 séries en 4 niveaux.

## Fichiers

- `game.py` — modèle du jeu, solveur et transcription des séries d'origine ;
- `gen_series.py` — fabrique les 20 séries et écrit `series20.json` ;
- `series20.json` — données publiables et provenance éditoriale de chaque série ;
- `gen.py` — génère `out/livret.html` ;
- `verify.py` — vérifie les données, les niveaux et le HTML généré ;
- `out/livret.pdf` — livret final de 23 pages (non versionné ici ; la copie
  publique est `../../outils/chat-cest-toi-le-chat.pdf`).

Les notes de provenance restent dans `series20.json` pour permettre les futures
modifications, mais elles ne sont pas imprimées sur les pages de solutions.

## Régénérer

Les scripts résolvent tous leurs chemins depuis leur propre emplacement. Ils
peuvent donc être lancés depuis n'importe quel répertoire :

```sh
python3 /chemin/vers/le-depot/_sources/chat-le-chat/gen_series.py
python3 /chemin/vers/le-depot/_sources/chat-le-chat/gen.py
python3 /chemin/vers/le-depot/_sources/chat-le-chat/verify.py
```

La dernière commande doit afficher `0 erreur(s)`.

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
