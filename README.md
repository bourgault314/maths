# Site de maths (collège)

Ce dépôt héberge un site statique pour les élèves (GitHub Pages).

## Structure
```
assets/           # styles, images
outils/           # outils interactifs
  glisse-nombre.html
  boulier/        # place tes outils Soroban / etc.
  convertisseur/  # futur outil
6e/               # page + docs
5e/
4e/
3e/
clubmat/
docs/             # docs généraux (si besoin)
index.html        # accueil
404.html          # page d'erreur
```

## Publier avec GitHub Pages
- Settings → Pages → Source: "Deploy from a branch", Branch: `main` (root).  
- Ton site sera disponible à `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.

## Ajouter un PDF
- Dépose le fichier dans `6e/docs/` (par ex.).  
- Ajoute un lien dans `6e/index.html` si tu veux le référencer.
