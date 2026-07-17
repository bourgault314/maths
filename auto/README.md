# Automatismes maths&go — bêta V1.20

Cette application est la version de développement d'Automatismes cycle 4 et
DNB. Elle est publiée avec ses fichiers découpés à l'adresse :

`https://bourgault314.github.io/mathsgo-automatismes-beta/auto/`

La version stable utilisée sur le site reste `https://mathsgo.re/auto/`. La
page `https://mathsgo.re/outils/automatismes/` est une page de présentation de
l'application et du livret A5, pas un deuxième exerciseur.

## État de référence

- paquet : `1.32.0-beta.0` ;
- banque : V1.20 ;
- 43 modules ;
- 476 gabarits ;
- 27 composants visuels ;
- 43 modules classés pédagogiquement sur 43 ;
- 3 formats fonctionnels supplémentaires pour `dnb_14`, sans modifier ses 18
  gabarits historiques dans la banque figée ;
- 1 format fonctionnel tactile supplémentaire pour `dnb_18`, sans modifier ses
  10 gabarits historiques dans la banque figée ;
- partage reproductible par seed, lien, code MG1 et QR code.

Le fichier autonome historique `automatismes_mathsgo.html` n'est plus une
source du site courant. Il ne doit pas être recréé ni republié à côté de
`/auto/`.

## Utiliser l'outil

- **Interactif** : saisie, clavier mathématique, QCM, validation, correction et
  score.
- **Diaporama** : navigation question/correction, progression et plein écran.
- **Avec aide** : affiche les représentations et micro-cours associés à la
  tâche.
- **Sans aide** : masque les étayages facultatifs, jamais les données
  indispensables ; le cours général reste accessible.
- **Partager** : produit localement une définition reproductible et un QR code,
  sans identité ni réponse d'élève.

## Organisation actuelle

| Chemin | Rôle |
|---|---|
| `index.html` | interface de préparation et lancement |
| `scripts/00-module-manifest.js` | catalogue léger et chargement des modules |
| `scripts/modules/` | banque historique, un fichier par module |
| `scripts/shared/pedagogy/` | tâches, réponses, figures, aides et génération attendue |
| `scripts/shared/visuals/` | composants réutilisables et paramétriques |
| `scripts/01-modules.js` | assemblage de la banque chargée |
| `scripts/02-question-engine.js` | instanciation et rendus encore communs |
| `scripts/03-slideshow.js` | diaporama, cours, interaction et correction |
| `scripts/04-app.js` | sélection, tirage et orchestration |
| `scripts/core/` | contrats de séries, identifiants et partage |
| `dev/visual-library.html` | catalogue pédagogique et visuel non référencé |

Les 43 banques sont isolées, mais le découpage fonctionnel n'est pas terminé.
La génération, les fréquences, certains rendus et certaines corrections
restent encore couplés aux moteurs communs.

`dnb_02b` isole sa génération, sa sélection équilibrée et son rendu dans trois
extensions fonctionnelles. Ses séries alternent calcul direct, QCM, question
inverse, contexte et analyse d’erreur sans imposer cette répartition aux autres
catégories.

## Ajouter ou modifier un automatisme

1. récupérer le dernier `main` distant ;
2. vérifier qu'aucune autre branche ne touche le même module ;
3. modifier le fichier du module pour un changement pédagogique local ;
4. augmenter `options.template_version` si le sens, les paramètres ou la règle
   de correction changent ;
5. conserver l'identifiant, le numéro `n` et le code MG1 ;
6. lancer `npm test` avant et après le lot ;
7. publier un seul objectif cohérent par PR.

Une extraction pure ne modifie pas l'empreinte de la banque V1.20. Une retouche
visuelle ne remplace jamais une source plus riche par un dessin générique.

## Documents canoniques

- [`../docs/PROTOCOLE-AUTOMATISMES-MATHSGO.md`](../docs/PROTOCOLE-AUTOMATISMES-MATHSGO.md) :
  méthode permanente, pédagogie, aides, téléphone et vérification visuelle ;
- [`../docs/ARCHITECTURE-CANONIQUE.md`](../docs/ARCHITECTURE-CANONIQUE.md) :
  rôles de la production, de la bêta et du Studio ;
- [`../docs/PLAN-DECOUPAGE.md`](../docs/PLAN-DECOUPAGE.md) : ordre technique ;
- [`../docs/CONTRAT-MODULE.md`](../docs/CONTRAT-MODULE.md) : invariants d'un
  module ;
- [`../docs/CONTRAT-MANIPULATION.md`](../docs/CONTRAT-MANIPULATION.md) : état,
  gestes, validation et correction des outils manipulables ;
- [`../docs/BIBLIOTHEQUE-VISUELLE.md`](../docs/BIBLIOTHEQUE-VISUELLE.md) :
  contrat des composants ;
- [`../docs/AUDIT-VISUELS-RESTANTS.md`](../docs/AUDIT-VISUELS-RESTANTS.md) :
  dette visuelle, anomalies et ordre de migration ;
- [`../docs/SOURCES-DE-VERITE.md`](../docs/SOURCES-DE-VERITE.md) : références
  existantes à comparer avant toute extraction.

## Vérification

Avec Node.js 18 ou plus récent :

```bash
npm test
```

La validation contrôle la banque, les identifiants, les gabarits, le registre
MG1, les composants et les contrats pédagogiques et manipulables.
