# Le questionnaire d'une séance en direct — format du fichier

Lot 2 de la séance en direct (15/10/2026). Un **questionnaire** est un fichier
JSON que le professeur garde chez lui et ouvre dans l'écran du tableau
(`suivi.mathsgo.re/prof/direct.php`). Il ne va **jamais** sur le serveur.

C'est le **contrat** commun : Défi tables (lot 3) puis Automatismes
fabriqueront des questionnaires de cette forme. Le seul code qui les lit est
`_serveur/public/prof/questionnaire.js` ; ses tests :
`tests/suivi-questionnaire.test.mjs`. Exemple complet :
`_serveur/questionnaires/exemple-questionnaire.json`.

## La forme

```json
{
  "format": "mathsgo-questionnaire",
  "version": 1,
  "titre": "Fractions — rituel du jeudi",
  "chrono": 30,
  "questions": [
    {
      "id": "fractions-01",
      "enonce": "Combien vaut $\\frac{3}{4}+\\frac{1}{8}$ ?",
      "choix": ["$\\frac{4}{12}$", "$\\frac{7}{8}$", "$\\frac{4}{8}$", "$1$"],
      "bonne": "B"
    },
    {
      "enonce": "Quelle est l’aire de ce rectangle ?",
      "image": "data:image/svg+xml;base64,PHN2Zy…",
      "choix": ["11 cm²", "22 cm²", "24 cm²", "24 cm"],
      "bonne": "C",
      "chrono": 45
    },
    {
      "enonce": "Quelle figure a exactement deux axes de symétrie ?",
      "choix": [{"image": "data:image/svg+xml;base64,…"}, {"image": "…", "texte": "carré"}, {"image": "…"}, {"image": "…"}],
      "bonne": "A",
      "chrono": null
    }
  ]
}
```

| Clé | Où | Obligatoire | Ce que c'est |
|---|---|---|---|
| `format` | haut | oui | toujours `"mathsgo-questionnaire"` |
| `version` | haut | oui | `1` |
| `titre` | haut | non | 120 caractères au plus ; il s'affiche en haut du tableau et entre dans le nom du fichier de résultats |
| `chrono` | haut | non | secondes (5 à 600) pour **toutes** les questions ; absent = pas de chrono |
| `questions` | haut | oui | de 1 à 80 questions (le plafond d'une séance) |
| `enonce` | question | oui, sauf s'il y a une `image` | texte et formules, 2 000 caractères au plus |
| `image` | question | non | une figure, écrite DANS le fichier (voir plus bas) |
| `choix` | question | oui | de 2 à 6 réponses, A à F, dans l'ordre ; chacune est un texte, ou `{"texte": …, "image": …}` (au moins l'un des deux) |
| `bonne` | question | non | la lettre de la bonne réponse ; absente = sondage, rien ne passe au vert |
| `chrono` | question | non | remplace le chrono du haut pour cette question ; `null` = pas de chrono ici |
| `id` | question | non | identifiant stable (lettres, chiffres, `.` `_` `:` `-`, 80 au plus, jamais deux fois le même) — pour Automatismes |
| `type` | question | non | `"choix"` (seul type pour l'instant ; le lot 3 ajoutera les réponses tapées) |

Une clé inconnue est ignorée : un fichier fait pour une version plus récente
garde ce qu'il peut, et le dit s'il ne peut pas.

## Les formules

Entre deux `$`, en LaTeX (dessinées par KaTeX, toujours en grand) :
`$\frac{3}{4}$`, `$10^{-3}$`, `$\sqrt{2}$`, `$3\times4$`, `$12\div3$`,
`$x\leqslant5$`, `$2{,}5$` (virgule décimale sans espace).

**Attention, dans le fichier JSON chaque `\` s'écrit `\\`** : `"$\\frac{3}{4}$"`.
Un `$` ordinaire s'écrit `\\$`. Les caractères comme ², ×, ÷, −, ’ peuvent
s'écrire directement, hors des `$`.

La page vérifie chaque formule à l'ouverture et nomme celle qui ne se dessine
pas (« Question 3, réponse B : formule illisible »).

## Les images

Une image est écrite dans le fichier, sous forme d'adresse `data:` :
`data:image/svg+xml;base64,…` (de préférence : nette à toutes les tailles,
légère), ou `data:image/png;base64,…`, `jpeg`, `gif`, `webp`. Jamais une adresse
`http…` ni un nom de fichier : le questionnaire tient en un seul fichier, et la
page ne va rien chercher ailleurs. 5 Mo au plus par image, 20 Mo pour le fichier.

- **Énoncé** : la figure se place à gauche des réponses, à sa taille naturelle
  (dessiner au moins 400 px de large).
- **Réponses** : chaque figure remplit sa carte, la lettre au-dessus.

Fabriquer une figure SVG et l'écrire dans le fichier (Python) :

```python
import base64
svg = '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="240" viewBox="0 0 420 240">…</svg>'
adresse = "data:image/svg+xml;base64," + base64.b64encode(svg.encode("utf-8")).decode("ascii")
```

## Vérifier un questionnaire

- `node -e 'const Q=require("./_serveur/public/prof/questionnaire.js"); console.log(Q.lire(require("fs").readFileSync("mon-questionnaire.json","utf8")))'`
  dit `ok: true`, ou la liste des erreurs, question par question.
- Dans l'écran du tableau, **sans ouvrir de séance** : « Aperçu (avec les
  réponses) » montre toutes les questions telles qu'elles seront projetées, la
  bonne réponse en vert. (L'aperçu est refusé pendant une séance : l'écran est
  peut-être projeté.)

## Ce qui part au serveur, et quand

Rien du fichier, sauf, question par question : le nombre de réponses et la
durée du chrono (au lancement), puis la lettre de la bonne réponse (au moment
de « Dévoiler », jamais avant). Le fichier de résultats de fin de séance est le
même qu'au lot 1 ; son nom porte le titre du questionnaire.

## Pour Claude, quand Gwenaël demande « fais-moi un questionnaire »

Un fichier `.json` de cette forme, un nom parlant
(`questionnaire-<classe>-<sujet>.json`), déposé dans
`C:\Users\gwena\Claude cowork\questionnaires\`. Avant de le livrer : le lire
avec `questionnaire.js` (`ok: true`), puis le passer dans la vraie page et
regarder chaque question projetée (1366 × 768). Règles de ses documents :
aucun nombre à sous-entendu sur une question mise en avant, « chiffre des
unités » (jamais « dernier chiffre »), apostrophes typographiques.
