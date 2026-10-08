// dnb_06 — Notation scientifique (liste officielle NC6 : « Passer d'une écriture
// décimale à la notation scientifique » ; sujets de référence 2027 : « Effectuer
// des calculs numériques simples impliquant des puissances »). Les questions
// sont fabriquées par dnb_06/generate.js, tirées par dnb_06/selection.js et
// dessinées par dnb_06/render.js ; ce fichier ne garde que la liste des types.
// Refonte du 08/10/2026 : énoncés neutres (plus de « grand / petit nombre »),
// exposants tirés de −7 à 9, pavé constant « , − », QCM mélangés aux pièges du
// brevet, sens inverse en un seul type par série. Types créés : 12 (contexte),
// 13 (compléter 1 200 = 1,2 × 10^…), 14 (puissance de 10, R2 2), 15 (calcul
// avec des puissances de 10, R1 2).
const MODULE_DNB_06 = {
  "id": "dnb_06",
  "num": 6,
  "title": "Notation scientifique",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "moteur_mathsgo_notation_scientifique_v2",
  "has_svg": false,
  "keypad": {"context": [",", "−"]},
  "questions": [
    {"n": 1, "title": "Grand nombre (10² ou 10³)", "statement": "", "answer": "[\"m\",\"e\"]", "footer": "", "options": {"scientific_kind": "to_scientific", "exponents": [2, 3], "template_version": 2}},
    {"n": 2, "title": "Grand nombre (10⁴ ou 10⁵)", "statement": "", "answer": "[\"m\",\"e\"]", "footer": "", "options": {"scientific_kind": "to_scientific", "exponents": [4, 5], "template_version": 2}},
    {"n": 3, "title": "Petit nombre (10⁻³)", "statement": "", "answer": "[\"m\",\"e\"]", "footer": "", "options": {"scientific_kind": "to_scientific", "exponents": [-3, -3], "template_version": 2}},
    {"n": 4, "title": "Petit nombre (10⁻¹ ou 10⁻²)", "statement": "", "answer": "[\"m\",\"e\"]", "footer": "", "options": {"scientific_kind": "to_scientific", "exponents": [-2, -1], "template_version": 2}},
    {"n": 5, "title": "Grand nombre (10⁶ ou 10⁷)", "statement": "", "answer": "[\"m\",\"e\"]", "footer": "", "options": {"scientific_kind": "to_scientific", "exponents": [6, 7], "template_version": 2}},
    {"n": 6, "title": "Petit nombre (10⁻⁴ à 10⁻⁶)", "statement": "", "answer": "[\"m\",\"e\"]", "footer": "", "options": {"scientific_kind": "to_scientific", "exponents": [-6, -4], "template_version": 2}},
    {"n": 7, "title": "Grand nombre (10⁸ ou 10⁹)", "statement": "", "answer": "[\"m\",\"e\"]", "footer": "", "options": {"scientific_kind": "to_scientific", "exponents": [8, 9], "template_version": 2}},
    {"n": 8, "title": "Écriture décimale (exposant positif)", "statement": "", "answer": "[\"n\"]", "footer": "", "options": {"scientific_kind": "from_scientific", "exponents": [2, 6], "template_version": 2}},
    {"n": 9, "title": "QCM : choisir la notation scientifique", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"scientific_kind": "choose_qcm", "template_version": 2}},
    {"n": 10, "title": "QCM : laquelle est une notation scientifique ?", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"scientific_kind": "recognize_qcm", "template_version": 2}},
    {"n": 11, "title": "Écriture décimale (exposant négatif)", "statement": "", "answer": "[\"n\"]", "footer": "", "options": {"scientific_kind": "from_scientific", "exponents": [-4, -1], "template_version": 2}},
    {"n": 12, "title": "Notation scientifique en contexte", "statement": "", "answer": "[\"m\",\"e\"]", "footer": "", "options": {"scientific_kind": "context", "template_version": 2}},
    {"n": 13, "title": "Compléter : 1 200 = 1,2 × 10^…", "statement": "", "answer": "[\"e\"]", "footer": "", "options": {"scientific_kind": "complete_power", "template_version": 2}},
    {"n": 14, "title": "Écrire sous la forme d’une puissance de 10", "statement": "", "answer": "[\"e\"]", "footer": "", "options": {"scientific_kind": "power_of_ten", "template_version": 2}},
    {"n": 15, "title": "Calcul avec des puissances de 10", "statement": "", "answer": "[\"b\"]", "footer": "", "options": {"scientific_kind": "power_calc", "template_version": 2}}
  ]
};
