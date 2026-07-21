# Automatismes maths&go

Cette application est la version publique des Automatismes cycle 4 et DNB :

`https://mathsgo.re/auto/`

La page `https://mathsgo.re/outils/automatismes/` présente l'application et
le livret A5 ; elle n'héberge pas un second exerciseur.

## Organisation

| Chemin | Rôle |
|---|---|
| `index.html` | interface de préparation et lancement |
| `scripts/00-module-manifest.js` | catalogue et chargement des modules |
| `scripts/modules/` | banques d'automatismes isolées par module |
| `scripts/shared/pedagogy/` | tâches, réponses, figures et aides |
| `scripts/shared/visuals/` | composants visuels réutilisables |
| `scripts/02-question-engine.js` | instanciation et rendu des questions |
| `scripts/03-slideshow.js` | diaporama, cours, interaction et correction |
| `scripts/04-app.js` | sélection, tirage et orchestration |
| `scripts/core/` | contrats de séries, identifiants et partage |

Les corrections de la version publique sont désormais préparées directement
dans ce dépôt, sur une branche courte issue de `main`, puis vérifiées avant
publication. Le dépôt bêta reste un historique et un espace d’observation ; il
n’est plus une étape obligatoire ni une source de fichiers à recopier.
