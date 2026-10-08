// dnb_26 — Cosinus d’un angle aigu, sans calculatrice (liste officielle EG12).
// Les questions sont fabriquées par dnb_26/generate.js et dessinées par
// dnb_26/render.js ; ce fichier ne garde que la liste des types.
// Refonte du 08/10/2026 : cosinus seul (brevet 2026 : jamais sinus ni tangente
// comme bonne réponse), angle nommé par trois lettres, angle droit sur n'importe
// quel sommet. Numéros retirés : 1 (condition, fondu dans le 11), 4 (doublon
// du 3), 7 (fourre-tout), 8 (triangles semblables), 10 (réciproque de
// Pythagore, dans dnb_24), 12 (aire à la tangente, avec calculatrice).
// Numéros créés : 13 (écrire le cosinus), 14 (écrire le calcul d'une longueur,
// figures reprises de dnb_26b), 15 (valeur du cosinus en QCM).
const MODULE_DNB_26 = {
  "id": "dnb_26",
  "num": 26,
  "title": "Trigonométrie sans calculatrice",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "refonte_2026_10_dnb26",
  "has_svg": true,
  "keypad": {"context": ["×", "÷", "cos"]},
  "questions": [
    {"n": 2, "title": "Nommer l’hypoténuse ou le côté adjacent", "statement": "", "answer": "[\"side\"]", "footer": "", "options": {"trig_kind": "name-side", "template_version": 4}},
    {"n": 13, "title": "Écrire le cosinus avec les noms des côtés", "statement": "", "answer": "[\"top\",\"bottom\"]", "footer": "", "options": {"trig_kind": "write-cosine", "template_version": 4}},
    {"n": 3, "title": "QCM : choisir le rapport du cosinus", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"trig_kind": "choose-ratio", "template_version": 4}},
    {"n": 5, "title": "Valeur exacte du cosinus", "statement": "", "answer": "[\"fraction\"]", "footer": "", "options": {"trig_kind": "cosine-value", "template_version": 4}},
    {"n": 15, "title": "QCM : valeur exacte du cosinus", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"trig_kind": "cosine-value-choice", "template_version": 4}},
    {"n": 14, "title": "Écrire le calcul d’une longueur", "statement": "", "answer": "[\"calcul\"]", "footer": "", "options": {"trig_kind": "length-calculation", "template_version": 4}},
    {"n": 6, "title": "QCM : choisir le calcul d’une longueur", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"trig_kind": "length-calculation-choice", "template_version": 4}},
    {"n": 9, "title": "QCM : cosinus, Pythagore ou aucun", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"trig_kind": "choose-tool", "template_version": 4}},
    {"n": 11, "title": "QCM : regard critique", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"trig_kind": "critical", "template_version": 4}}
  ]
};
