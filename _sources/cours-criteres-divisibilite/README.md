# Cours « Critères de divisibilité » (1 page A4)

Fiche de cours explicite (automatismes, arithmétique) : que veut dire « divisible »,
critères pour 2, 5 et 10 (chiffre des unités), critères pour 3 et 9 (somme des chiffres).
Complément du gabarit `outils/gabarit_criteres_divisibilite.pdf`.

## Fichiers

- `cours_criteres_divisibilite.html` — la source modifiable (HTML + CSS dans un seul fichier,
  logo maths&go embarqué). Le texte se modifie directement dedans.
- `fonts/` — Poppins (licence OFL), utilisée par la fiche.
- `render.py` — régénère le PDF public `outils/cours_criteres_divisibilite.pdf`.

## Régénérer le PDF

Soit `python3 render.py` (Playwright + Chromium), soit ouvrir le HTML dans Chrome →
Imprimer → Enregistrer en PDF, format A4, marges « Aucune », « Graphiques d'arrière-plan » cochés.

## Pied de page

Même convention que les gabarits : logo maths&go en bas à gauche et signature
`mathsgo.re · CC BY-NC-SA 4.0` centrée en pied (signature unique du site, licence CC BY-NC-SA 4.0). Vocabulaire : toujours « le chiffre des unités », jamais « le dernier chiffre ».
