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
  "keypad": {
    "context": [
      ","
    ]
  },
  "questions": [
    {
      "n": 1,
      "statement": "Parmi ces nombres, lequel est le plus ${askWord}&nbsp;?&&${o1}&&${o2}&&${o3}&&${o4}&&",
      "answer": "[\"ok\"]",
      "options": {
        "decimal_kind": "compare-positive-qcm",
        "decimal_block": "compare-order"
      },
      "footer": ""
    },
    {
      "n": 3,
      "statement": "Range ces trois nombres dans l’ordre croissant.",
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
      "n": 7,
      "statement": "Calcule&nbsp;:",
      "answer": "[\"result\"]",
      "options": {
        "decimal_kind": "subtract",
        "decimal_block": "additive"
      },
      "footer": "$$${a} − ${b} = [[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Complète&nbsp;:",
      "answer": "[\"missing\"]",
      "options": {
        "decimal_kind": "missing-complement",
        "decimal_block": "additive"
      },
      "footer": "$$${a} + [[formula]] = ${target}$$"
    },
    {
      "n": 9,
      "statement": "Calcule&nbsp;:",
      "answer": "[\"result\"]",
      "options": {
        "decimal_kind": "multiply-direct",
        "decimal_block": "multiplicative"
      },
      "footer": "$$${a} \\times ${factor} = [[formula]]$$"
    },
    {
      "n": 10,
      "statement": "Calcule&nbsp;:",
      "answer": "[\"share\"]",
      "options": {
        "decimal_kind": "divide-direct",
        "decimal_block": "multiplicative"
      },
      "footer": "$$${total} \\div ${divisor} = [[formula]]$$"
    },
    {
      "n": 11,
      "statement": "${prompt}",
      "answer": "[\"share\"]",
      "options": {
        "decimal_kind": "division-context",
        "decimal_block": "multiplicative"
      },
      "footer": "$$[[formula]]\\text{ ${unit}}$$"
    },
    {
      "n": 13,
      "statement": "Calcule&nbsp;:",
      "answer": "[\"result\"]",
      "options": {
        "decimal_kind": "multiply-tables",
        "decimal_block": "multiplicative"
      },
      "footer": "$$${left} \\times ${right} = [[formula]]$$"
    },
    {
      "n": 14,
      "statement": "${prompt}&&${o1}&&${o2}&&${o3}&&${o4}&&",
      "answer": "[\"ok\"]",
      "options": {
        "decimal_kind": "multiply-qcm",
        "decimal_block": "multiplicative"
      },
      "footer": ""
    },
    {
      "n": 15,
      "statement": "Calcule&nbsp;:",
      "answer": "[\"sum\"]",
      "options": {
        "decimal_kind": "add-decimals",
        "decimal_block": "additive"
      },
      "footer": "$$${a} + ${b} = [[formula]]$$"
    },
    {
      "n": 16,
      "statement": "${prompt}",
      "answer": "[\"result\"]",
      "options": {
        "decimal_kind": "subtract-context",
        "decimal_block": "additive"
      },
      "footer": "$$[[formula]]\\text{ ${unit}}$$"
    },
    {
      "n": 17,
      "statement": "Calcule&nbsp;:",
      "answer": "[\"result\"]",
      "options": {
        "decimal_kind": "divide-integer",
        "decimal_block": "multiplicative"
      },
      "footer": "$$${dividend} \\div ${divisor} = [[formula]]$$"
    },
    {
      "n": 18,
      "statement": "Calcule&nbsp;: $$A = ${expression}$$",
      "answer": "[\"result\"]",
      "options": {
        "decimal_kind": "priorities",
        "decimal_block": "additive"
      },
      "footer": "$$A = [[formula]]$$"
    }
  ]
};
