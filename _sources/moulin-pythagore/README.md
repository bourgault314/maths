# Fiches à imprimer du Moulin de Pythagore

Les onze fiches publiées dans `outils/plateaux_manipulation/fiches_moulin/`
**ne sont pas écrites à la main**. Elles sont imprimées depuis le plateau
lui-même, `outils/plateaux_manipulation/moulin_pythagore.html` : le script
ouvre la page, clique sur son bouton « Fiche » pour chaque découpage et
enregistre la fenêtre d'impression en PDF.

C'est volontaire : la fiche n'existe qu'à un seul endroit, dans le plateau.
Une consigne, un bilan ou une signature modifiés dans l'outil se retrouvent
dans les onze PDF au prochain passage du script — il n'y a pas de seconde
version à tenir à jour.

## Régénérer

```bash
npm install playwright
npx playwright install chromium
node _sources/moulin-pythagore/generer_fiches.mjs
```

Si un Chromium est déjà installé sur la machine, on évite le téléchargement :

```bash
CHROMIUM_EXECUTABLE="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  node _sources/moulin-pythagore/generer_fiches.mjs
```

## Ce qui est écrit

| Sortie | Contenu |
|---|---|
| `outils/plateaux_manipulation/fiches_moulin/moulin-pythagore-<clé>.pdf` | la fiche de 5 pages du découpage, A4 paysage, marges 7 mm |
| `assets/img/thumbnails/pythagore/moulin-fiche-<clé>.png` (+ `.webp`) | le plateau à son ouverture, recadré, 720 px de large — la carte de la page des fiches |
| `assets/img/thumbnails/pythagore/moulin-fiches-catalogue.png` (+ `.webp`) | la page 1 de la première fiche, 1404 px de large — la carte du catalogue |

La liste des découpages n'est pas recopiée dans le script : elle est lue dans
le menu déroulant du plateau. Un douzième découpage ajouté à l'outil sera donc
fabriqué tout seul — mais il faudra l'ajouter à la main dans la page
`outils/plateaux_manipulation/moulin_pythagore_fiches.html`, qui porte les
descriptions pédagogiques, et le compte de `tests/moulin-fiches.test.mjs`.

## Après une régénération

```bash
npm run verifier
```

Le test `tests/moulin-fiches.test.mjs` vérifie que les onze PDF existent, que
chaque carte de la page pointe vers un fichier réel, et que chaque miniature a
bien sa variante WebP plus légère.
