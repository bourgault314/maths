// dnb_15 — Lire des coordonnées dans un repère (liste officielle EG1 :
// « lire les coordonnées d'un point, placer un point de coordonnées données »).
// Les questions sont fabriquées par dnb_15/generate.js et dessinées par
// dnb_15/render.js ; ce fichier ne garde que la liste des types.
// Numéros retirés le 08/10/2026 : 2 et 4 (fondus dans le type 1, qui tire
// les quatre quadrants), 11 (placer deux points, doublon du type 10).
const MODULE_DNB_15 = {
  "id": "dnb_15",
  "num": 15,
  "title": "Lire des coordonnées dans un repère",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "import_dnb_zip",
  "has_svg": true,
  "keypad": {"context": [",", "−"]},
  "questions": [
    {"n": 1, "title": "Lire les coordonnées d’un point", "statement": "", "answer": "[\"x\",\"y\"]", "footer": "", "options": {"coordinate_kind": "read-pair", "template_version": 3}},
    {"n": 3, "title": "Lire un point situé sur un axe", "statement": "", "answer": "[\"x\",\"y\"]", "footer": "", "options": {"coordinate_kind": "axis", "template_version": 3}},
    {"n": 5, "title": "Abscisse de A, puis coordonnées de B", "statement": "", "answer": "[\"xA\",\"xB\",\"yB\"]", "footer": "", "options": {"coordinate_kind": "abscissa-pair", "template_version": 3}},
    {"n": 6, "title": "Lire un point en demi-unités", "statement": "", "answer": "[\"x\",\"y\"]", "footer": "", "options": {"coordinate_kind": "half-steps", "template_version": 3}},
    {"n": 7, "title": "Lire l’abscisse d’un point", "statement": "", "answer": "[\"x\"]", "footer": "", "options": {"coordinate_kind": "abscissa", "template_version": 3}},
    {"n": 8, "title": "Lire l’ordonnée d’un point", "statement": "", "answer": "[\"y\"]", "footer": "", "options": {"coordinate_kind": "ordinate", "template_version": 3}},
    {"n": 9, "title": "QCM : choisir les coordonnées", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"coordinate_kind": "choose-pair", "template_version": 3}},
    {"n": 10, "title": "Placer un point", "statement": "", "answer": "[\"x\",\"y\"]", "footer": "", "options": {"coordinate_kind": "place-one", "template_version": 3}},
    {"n": 12, "title": "Vrai ou faux : contrôler des coordonnées", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"coordinate_kind": "true-false", "template_version": 3}}
  ]
};
