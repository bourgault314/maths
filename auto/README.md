# Automatismes maths&go — application 1.15

Outil d’automatismes de mathématiques pour le cycle 4 et le DNB, prévu pour
la vidéoprojection, le téléphone et le partage d’une série reproductible.

## Utiliser l’outil

Le fichier prêt à l’emploi est
`automatismes-mathsgo-v1.15.html` à la racine du paquet de livraison ; sa copie
de construction se trouve dans `dist/`. Il est autonome : les styles, scripts,
données, visuels et le générateur de QR code sont intégrés au fichier.

- **Interactif** : saisie intégrée, clavier mathématique, QCM, validation,
  correction et score. Dix séries sont préparées à partir de la même seed.
- **Diaporama** : navigation question/correction, progression et plein écran.
- **Avec aide** : schémas, manipulations et micro-cours pour les 40 modules.
- **Sans aide** : les données et figures indispensables restent visibles, mais
  les aides et formules de cours sont masquées.
- **Partager** : ouvre une fenêtre dédiée qui produit un lien, un code `MG1-…`
  et un QR code. L’ouverture du lien lance directement la série enregistrée.

Le menu principal présente les quatre choix utiles — niveau, aide, mode et
nombre de questions. Le numéro de tirage est géré automatiquement et ne vient
plus encombrer l’interface. **Ouvrir une série** permet de coller un lien ou
un code MG1. Après le premier automatisme sélectionné, une barre résume les
réglages et garde les actions **Partager** et **Lancer** accessibles pendant le
défilement. Sur un petit téléphone, cette barre reste masquée tant qu’aucun
automatisme n’est choisi.

Dans chacune des quatre grandes rubriques, les automatismes sont maintenant
réunis sous des repères pédagogiques non cliquables issus du catalogue
maths&go : fractions et nombres rationnels, puissances, calcul littéral,
repérage, statistiques, proportionnalité, etc. Il n’existe donc aucun niveau de
menu supplémentaire : les cases restent directement accessibles. Le classement
ne modifie ni les identifiants des modules ni les codes de séries partagées.

## Trigonométrie

La banque est divisée en deux modules complémentaires :

- **Sans calculatrice** : 12 familles pédagogiques consolidées sur le
  vocabulaire, les rapports exacts, les formules utiles, les distracteurs, les
  triangles semblables et le choix entre trigonométrie, Pythagore, réciproque,
  deux méthodes possibles ou aucune méthode. Les sous-variantes restent tirées
  à l’intérieur de chaque famille.
- **Avec calculatrice** : 12 familles couvrant les six configurations de
  recherche d’une longueur, les trois fonctions inverses, le calcul d’un
  rapport et deux applications à une aire ou un périmètre.

Le tirage entrelace les axes pédagogiques afin qu’une série courte ne contienne
pas plusieurs exercices presque identiques. Les triangles utilisent quatre
jeux de lettres, huit orientations et cinq proportions de base, soit quarante
combinaisons graphiques. Pour les exercices numériques, la forme suit l’angle
ou les longueurs affichés. Les distracteurs représentent des erreurs réalistes :
rapport inversé, mauvaise fonction, mauvaise paire de côtés ou méthode appliquée
sans les conditions nécessaires.

Le partage contient uniquement la version du générateur, le niveau, le nombre
de questions, les modules, la seed et les modes choisis. Il ne contient ni
identité ni réponse d’élève. Le QR code est calculé localement, sans service
tiers. La mesure d’audience héritée de la page publique reçoit toujours l’URL
canonique sans le fragment de partage.

Le cœur pédagogique fonctionne hors connexion. La balise de mesure d’audience
déjà présente peut tenter une requête externe lorsqu’une connexion existe ;
elle n’est jamais nécessaire aux exercices, au partage ou au QR code.

## Reproductibilité

Une même définition du générateur `1.12.0` produit les mêmes dix séries, dans le
même ordre, y compris si l’ordre de sélection des modules diffère. La seed est
gérée et conservée automatiquement dans la définition partagée, sans apparaître
dans l’interface.

Le tirage repose sur des paquets persistants. Tant que les gabarits d’un module
ne sont pas épuisés, ils ne se répètent pas. Avec plusieurs modules, les quotas
diffèrent au maximum d’une question et les modules sont entrelacés lorsque
c’est possible. Les familles pédagogiques particulières — multiplication et
division de fractions, fraction/quantité/pourcentage, droite graduée — ont des
règles de couverture explicites.

## Données et futur recueil de réponses

Chaque question générée porte un `questionInstanceId`, un `seriesId`, un
`templateId`, une version de gabarit, des paramètres structurés et une réponse
canonique. La validation interactive produit un résultat structuré commun.

Un `AttemptRecorder` est inclus, mais il est **désactivé par défaut**. Aucune
tentative n’est conservée, placée dans le stockage du navigateur ou envoyée sur
le réseau. Le contrat préparé contient notamment le résultat, la réponse
normalisée, le temps actif plafonné et les aides ouvertes. Voir
`docs/CONTRATS-DONNEES-V1.12.md` avant toute intégration serveur.

## Organisation du code

| Chemin | Rôle |
|---|---|
| `index.html` | Interface de sélection et de partage |
| `styles/setup.css` | Styles de l’interface de sélection |
| `scripts/data/` | Banque de modules par grand domaine |
| `scripts/01-modules.js` | Assemblage et configuration des modules |
| `scripts/02-question-engine.js` | Génération, calculs, réponses et visuels |
| `scripts/core/01-series-contracts.js` | Versions, identifiants et code MG1 |
| `scripts/03-slideshow.js` | Diaporama, cours, interaction et tentatives |
| `scripts/04-app.js` | Tirage équilibré et lancement |
| `scripts/core/02-share-ui.js` | Lien, code, QR et ouverture directe |
| `scripts/vendor/` | Dépendance QR embarquée et documentée |
| `tools/build.mjs` | Construction du HTML autonome |
| `tests/` | Non-régression, tirage, contrats et partage |
| `RAPPORT-AUDIT-V1.12.md` | Résultats et limites de la révision |

## Construire et tester

Node.js 18 ou plus récent est nécessaire.

```bash
npm install
npm run build
npx playwright install chromium
npm test
```

Un Chromium déjà installé peut être indiqué avec :

```bash
MATHSGO_CHROMIUM=/chemin/vers/chromium npm test
```

Le fichier autonome est recréé dans `dist/` à chaque construction.

## Ajouter un automatisme

Ajouter le module dans le fichier de son domaine (`01-numbers.js`,
`02-geometry.js`, `03-data.js` ou `04-algorithm.js`) : son domaine est alors
attribué automatiquement, sans dépendre de son numéro. Les balises `level_tags`
indiquent les filtres 5e, 4e, 3e et, le cas échéant, DNB. Ajouter aussi son
identifiant stable dans `scripts/core/01-series-contracts.js` afin qu’il puisse
être enregistré dans un code MG1. Chaque entrée possède un code numérique
permanent : attribuer au nouveau module un code encore inutilisé, sans modifier
ni réutiliser ceux qui existent déjà. Pour une disponibilité partielle en 5e,
compléter `LEVEL_5E_QUESTIONS` dans le moteur.

Le numéro `n` d’un modèle de question doit lui aussi rester stable. Si son sens
pédagogique ou sa règle de correction change, augmenter
`options.template_version` ; une retouche purement visuelle n’impose pas ce
changement.

## Mise en ligne sans serveur applicatif

Le gros fichier HTML autonome peut être publié tel quel : sa taille n’est pas
un problème fonctionnel et aucune ressource du projet n’a besoin d’être placée
à côté. Pour `https://mathsgo.re/auto/`, il suffit de renommer
`automatismes-mathsgo-v1.15.html` en `index.html` dans le dossier `auto/`.

Le fichier source `index.html`, lui, n’est pas autonome : il doit rester avec
les dossiers `assets/`, `scripts/` et `styles/`.
