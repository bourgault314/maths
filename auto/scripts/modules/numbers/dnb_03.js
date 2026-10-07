const MODULE_DNB_03 = {
  "id": "dnb_03",
  "num": 3,
  "title": "Fractions : simplifier, comparer, additionner",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "import_dnb_zip",
  "has_svg": false,
  "keypad": {
    "context": []
  },
  "questions": [
    {
      "n": 1,
      "statement": "Écris cette fraction sous forme irréductible.",
      "answer": "[\"p\",\"q\"]",
      "options": {
        "fraction_ops_kind": "simplify_simple"
      }
    },
    {
      "n": 2,
      "statement": "Écris cette fraction sous forme irréductible (grand diviseur commun).",
      "answer": "[\"p\",\"q\"]",
      "options": {
        "fraction_ops_kind": "simplify_harder"
      }
    },
    {
      "n": 3,
      "statement": "Quelle est la plus grande de ces fractions ? (même dénominateur ou même numérateur)",
      "answer": "[\"1\"]",
      "options": {
        "fraction_ops_kind": "compare_same"
      }
    },
    {
      "n": 4,
      "statement": "Quelle est la plus grande de ces fractions ? (dénominateurs différents)",
      "answer": "[\"1\"]",
      "options": {
        "fraction_ops_kind": "compare_common_den"
      }
    },
    {
      "n": 5,
      "statement": "Calcule cette somme (même dénominateur).",
      "answer": "[\"p\",\"q\"]",
      "options": {
        "fraction_ops_kind": "add_same_den"
      }
    },
    {
      "n": 6,
      "statement": "Calcule cette différence (même dénominateur).",
      "answer": "[\"p\",\"q\"]",
      "options": {
        "fraction_ops_kind": "subtract_same_den"
      }
    },
    {
      "n": 7,
      "statement": "Réduis au même dénominateur, puis calcule.",
      "answer": "[\"p\",\"q\"]",
      "options": {
        "fraction_ops_kind": "add_multiple_den"
      }
    },
    {
      "n": 8,
      "statement": "Calcule et donne le résultat sous forme de fraction irréductible (dénominateurs 3 et 4, 4 et 5…).",
      "answer": "[\"p\",\"q\"]",
      "options": {
        "fraction_ops_kind": "add_coprime_irreducible"
      }
    },
    {
      "n": 9,
      "statement": "Calcule et donne le résultat sous forme de fraction irréductible (dénominateurs 4 et 6, 6 et 8…).",
      "answer": "[\"p\",\"q\"]",
      "options": {
        "fraction_ops_kind": "add_lcm_irreducible"
      }
    },
    {
      "n": 10,
      "statement": "Le nombre 1/3 + 1/4 est égal à : (QCM)",
      "answer": "[\"1\"]",
      "options": {
        "fraction_ops_kind": "sum_qcm"
      }
    },
    {
      "n": 11,
      "statement": "Quel rangement est dans l’ordre croissant ? (décimaux et fractions)",
      "answer": "[\"1\"]",
      "options": {
        "fraction_ops_kind": "order_numbers"
      }
    }
  ]
};
