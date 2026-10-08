// dnb_31 — Médiane et étendue (liste officielle OGD4 : « déterminer une
// médiane pour une série comportant un petit nombre de valeurs » ; étendue :
// attendu de 3e). Les questions sont fabriquées par dnb_31/generate.js, tirées
// par dnb_31/selection.js et dessinées par dnb_31/render.js ; ce fichier ne
// garde que la liste des types. Refonte du 08/10/2026 : la médiane n'est plus
// jamais à une place fixe dans l'écriture ; séries de 5 à 11 valeurs comme au
// brevet 2026, relatifs (type 13), décimaux déjà rangés (type 4), diagramme en
// barres (type 14). Types 1, 5, 7, 9, 10 et 12 retirés (fondus dans 2, 8, 6 et 11).
const MODULE_DNB_31 = {
  "id": "dnb_31",
  "num": 31,
  "title": "Médiane et étendue",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "moteur_mathsgo_mediane_v2",
  "has_svg": true,
  "keypad": {"context": [",", "−"]},
  "questions": [
    {"n": 2, "title": "Série non rangée (5, 7 ou 9 valeurs)", "statement": "", "answer": "[\"m\"]", "footer": "", "options": {"median_kind": "serie", "template_version": 2}},
    {"n": 3, "title": "Nombre pair de valeurs", "statement": "", "answer": "[\"m\"]", "footer": "", "options": {"median_kind": "paire", "template_version": 2}},
    {"n": 4, "title": "Série déjà rangée (décimaux)", "statement": "", "answer": "[\"m\"]", "footer": "", "options": {"median_kind": "rangee", "template_version": 2}},
    {"n": 6, "title": "Données dans un tableau", "statement": "", "answer": "[\"m\"]", "footer": "", "options": {"median_kind": "tableau", "template_version": 2}},
    {"n": 8, "title": "QCM : la médiane d’une série", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"median_kind": "qcm", "template_version": 2}},
    {"n": 11, "title": "Étendue", "statement": "", "answer": "[\"m\"]", "footer": "", "options": {"median_kind": "etendue", "template_version": 2}},
    {"n": 13, "title": "Nombres relatifs (températures)", "statement": "", "answer": "[\"m\"]", "footer": "", "options": {"median_kind": "relatifs", "template_version": 2}},
    {"n": 14, "title": "Diagramme en barres ou tableau d’effectifs", "statement": "", "answer": "[\"m\"]", "footer": "", "options": {"median_kind": "effectifs", "template_version": 2}}
  ]
};
