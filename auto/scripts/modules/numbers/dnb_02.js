const MODULE_DNB_02 = {
  "id": "dnb_02",
  "num": 2,
  "title": "Comparer et calculer avec des nombres décimaux",
  "level_tags": [
    "5e",
    "4e",
    "3e",
    "DNB"
  ],
  "source": "source_dynamique_dnb02",
  "has_svg": false,
  "questions": [
    {
      "n": 1,
      "statement": "Parmi ces nombres, lequel est le plus grand ?&&$$${mx}$$&&$$${d1}$$&&$$${d2}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "decimal_kind": "compare-positive-qcm",
        "decimal_block": "compare-order",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 3,
      "statement": "Range ces trois nombres dans l'ordre croissant.",
      "answer": "[\"mn\",\"md\",\"mx\"]",
      "options": {
        "decimal_kind": "order-cards",
        "decimal_block": "compare-order"
      },
      "footer": ""
    },
    {
      "n": 4,
      "statement": "Encadre ce nombre entre deux entiers consécutifs.",
      "answer": "[\"low\",\"high\"]",
      "options": {
        "decimal_kind": "frame-positive",
        "decimal_block": "frame"
      },
      "footer": ""
    },
    {
      "n": 6,
      "statement": "Calcule :",
      "answer": "[\"sum\"]",
      "options": {
        "decimal_kind": "add-to-one",
        "decimal_block": "additive"
      },
      "footer": "$$${a} + ${b} = [[formula]]$$"
    },
    {
      "n": 7,
      "statement": "Calcule :",
      "answer": "[\"result\"]",
      "options": {
        "decimal_kind": "subtract",
        "decimal_block": "additive"
      },
      "footer": "$$${a} - ${b} = [[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Complète pour obtenir une unité entière :",
      "answer": "[\"missing\"]",
      "options": {
        "decimal_kind": "missing-complement",
        "decimal_block": "additive"
      },
      "footer": "$$${a} + [[formula]] = 1$$"
    },
    {
      "n": 9,
      "statement": "Calcule :",
      "answer": "[\"result\"]",
      "options": {
        "decimal_kind": "multiply-direct",
        "decimal_block": "multiplicative"
      },
      "footer": "$$${a} \\times ${factor} = [[formula]]$$"
    },
    {
      "n": 10,
      "statement": "Calcule :",
      "answer": "[\"share\"]",
      "options": {
        "decimal_kind": "divide-direct",
        "decimal_block": "multiplicative"
      },
      "footer": "$$${total} \\div ${divisor} = [[formula]]$$"
    },
    {
      "n": 11,
      "statement": "On répartit $$${total}\\text{ L}$$ également dans $$${divisor}$$ bouteilles. Quelle quantité contient chaque bouteille ?",
      "answer": "[\"share\"]",
      "options": {
        "decimal_kind": "division-context",
        "decimal_block": "multiplicative"
      },
      "footer": "$$[[formula]]\\text{ L}$$"
    },
    {
      "n": 12,
      "statement": "Place les deux produits dans les bonnes cases pour décomposer le calcul.",
      "answer": "[\"firstProduct\",\"secondProduct\"]",
      "options": {
        "decimal_kind": "distributivity-reasoning",
        "decimal_block": "multiplicative"
      },
      "footer": ""
    }
  ]
};
