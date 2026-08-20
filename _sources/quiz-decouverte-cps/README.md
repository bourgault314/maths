# Source de la fiche réponse — Quiz découverte CPS (4e Dopamine)

`fiche-reponse.html` est le fichier source qui génère `cps/quiz-decouverte-fiche.pdf`.

## Modifier la fiche
Éditer directement le HTML (tout est dedans : styles, textes, logo cerveau en base64).
Chaque question est un bloc `<div class="q">…</div>` clairement commenté par son numéro.

## Régénérer le PDF
Deux façons :
- **À la main** : ouvrir `fiche-reponse.html` dans Chrome → Imprimer → Destination PDF,
  format A4, marges « Aucune », cocher « Graphiques d'arrière-plan ».
- **En ligne de commande** (ce qui a été utilisé) :
  ```
  chromium --headless --no-sandbox --no-pdf-header-footer \
    --print-to-pdf=quiz-decouverte-fiche.pdf fiche-reponse.html
  ```

## Contrainte à respecter
La fiche doit tenir sur UNE page A4. Après toute modification, vérifier que le PDF
fait bien 1 page (les cartes se répartissent seules grâce au flex, mais un ajout de
question ou d'option peut faire déborder — réduire alors les paddings de `.opt`).
