// dnb_28 — Probabilités, équiprobabilité (liste officielle OGD1 : « attribuer
// des probabilités dans des cas simples »). Les questions sont fabriquées par
// dnb_28/generate.js et dessinées par dnb_28/render.js ; ce fichier ne garde
// que la liste des types. Refonte du 08/10/2026 : chaque type est tiré au
// hasard (les types 4, 6, 7 et 8 étaient figés) ; type 11 créé (QCM du sac à
// 3 couleurs, Métropole–La Réunion 2026).
const MODULE_DNB_28 = {
  "id": "dnb_28",
  "num": 28,
  "title": "Probabilités — équiprobabilité",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "moteur_mathsgo_probabilites_v2",
  "has_svg": true,
  "keypad": {"context": []},
  "questions": [
    {"n": 1, "title": "Urne, sac ou boîte : calculer une probabilité", "statement": "", "answer": "[\"f\",\"T\"]", "footer": "", "options": {"probability_kind": "urne", "template_version": 2}},
    {"n": 2, "title": "Dé : calculer une probabilité", "statement": "", "answer": "[\"f\",\"T\"]", "footer": "", "options": {"probability_kind": "de", "template_version": 2}},
    {"n": 3, "title": "Roue dessinée", "statement": "", "answer": "[\"f\",\"T\"]", "footer": "", "options": {"probability_kind": "roue", "template_version": 2}},
    {"n": 4, "title": "QCM : lancer d’un dé", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"probability_kind": "de-qcm", "template_version": 2}},
    {"n": 5, "title": "Cartes numérotées : multiples", "statement": "", "answer": "[\"f\",\"T\"]", "footer": "", "options": {"probability_kind": "cartes", "template_version": 2}},
    {"n": 6, "title": "QCM : une lettre d’un mot", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"probability_kind": "mot-qcm", "template_version": 2}},
    {"n": 7, "title": "Une pièce et un dé", "statement": "", "answer": "[\"f\",\"T\"]", "footer": "", "options": {"probability_kind": "piece-de", "template_version": 2}},
    {"n": 8, "title": "Impossible ou certain", "statement": "", "answer": "[\"value\"]", "footer": "", "options": {"probability_kind": "impossible-certain", "template_version": 2}},
    {"n": 9, "title": "Tableau d’effectifs", "statement": "", "answer": "[\"f\",\"T\"]", "footer": "", "options": {"probability_kind": "club", "template_version": 2}},
    {"n": 10, "title": "Événement contraire", "statement": "", "answer": "[\"f\",\"T\"]", "footer": "", "options": {"probability_kind": "contraire", "template_version": 2}},
    {"n": 11, "title": "QCM : sac à 3 couleurs", "statement": "", "answer": "[\"correctIndex\"]", "footer": "", "options": {"probability_kind": "sac-qcm", "template_version": 2}}
  ]
};
