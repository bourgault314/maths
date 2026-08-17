# Chat, c'est toi le chat !

Jeu de positionnement dans l'espace de la maternelle au collège, d'après une
situation de *Un rallye mathématique à l'école
maternelle ? Oui, c'est possible !* (Fabien Emprin et Fabienne
Emprin-Charotte, CRDP Champagne-Ardenne). Version modernisée pour maths&go :
20 séries en 4 niveaux.

## Fichiers

- `game.py` — modèle du jeu, solveur et transcription des cartes disponibles ;
- `gen_series.py` — fabrique les 20 séries et écrit `series20.json` ;
- `series20.json` — données publiables et provenance éditoriale de chaque série ;
- `gen.py` — génère `out/guide.html` (règle, exemple guidé et solutions),
  `out/cartes-grand-format.html` (quatre cartes par page) et
  `out/cartes-compactes.html` (huit cartes par feuille) ;
- `build_duplex.py` — intercale les rectos Chromium avec des versos blancs
  portant le titre du jeu et l’emblème M, puis vérifie leur alignement ;
- `verify.py` — vérifie les données, les niveaux et le HTML généré ;
- `projection_cases.json` — exemple guidé et 12 défis inédits à projeter ;
- `gen_projection.py` — valide ces défis et génère la page projetable autonome ;
- `out/guide.pdf` — guide pédagogique de 4 pages (copie publique :
  `../../outils/chat-cest-toi-le-chat-guide.pdf`) ;
- `out/cartes-grand-format.pdf` — vingt feuilles A4 portrait contenant chacune
  une série de quatre grandes cartes (copie publique :
  `../../outils/chat-cest-toi-le-chat.pdf`) ;
- `out/cartes-compactes.pdf` — dix feuilles A4 paysage contenant chacune deux
  séries de quatre cartes en portrait (copie publique :
  `../../outils/chat-cest-toi-le-chat-cartes-compactes.pdf`) ;
- `out/cartes-grand-format-recto-verso.pdf` — vingt paires recto-verso A4
  portrait, à imprimer à 100 % en retournant sur le bord long (copie publique :
  `../../outils/chat-cest-toi-le-chat-recto-verso.pdf`) ;
- `out/cartes-compactes-recto-verso.pdf` — dix paires recto-verso A4 paysage,
  à imprimer à 100 % en retournant sur le bord court (copie publique :
  `../../outils/chat-cest-toi-le-chat-cartes-compactes-recto-verso.pdf`).

La page projetable publique est
`../../outils/chat-cest-toi-le-chat-projection.html`. Toute la classe cherche
depuis sa place, puis vérifie les cartes à voix haute lors de la mise en commun.

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

Pour produire et valider les PDF avec Chrome ou Chromium :

```sh
python3 /chemin/vers/le-depot/_sources/chat-le-chat/render_pdfs.py
```

Le script refuse tout moteur autre que Chromium/Skia pour les trois documents
recto : WeasyPrint ne doit pas être utilisé, car il déforme les grilles de
solutions et la couverture. `build_duplex.py` ajoute ensuite les versos aux
deux jeux de cartes sans altérer les rectos. Selon l'installation, définir
`CHROME_BIN` si Chromium n'est pas détecté automatiquement. Après contrôle
visuel, mettre à jour les cinq copies publiques avec :

```sh
python3 /chemin/vers/le-depot/_sources/chat-le-chat/render_pdfs.py --publish
```

Le générateur attend le logo `assets/img/mathsgo-logo-780.png` et le fichier
`favicon.svg` à la racine du dépôt. Le constructeur de versos isole l’emblème M
dans `assets/img/mathsgo-logo.png`.
