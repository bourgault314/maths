const MODULE_DNB_09 = {
  "id": "dnb_09",
  "num": 9,
  "title": "Double, triple, moitié, prédécesseur, successeur et carré",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "import_dnb_zip",
  "has_svg": false,
  "questions": [
    {
      "n": 1,
      "statement": "Complète les six cadres ci-dessous pour le nombre $$n=${n}$$ :",
      "answer": "[\"2*n\",\"3*n\",\"n/2\",\"n-1\",\"n+1\",\"n^2\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(2,25)*2",
        "relation_kind": "summary"
      },
      "footer": "<ul style=\"text-align:left\"><li>Double : [[formula]]</li><li>Triple : [[formula]]</li><li>Moitié : [[formula]]</li><li>Prédécesseur : [[formula]]</li><li>Successeur : [[formula]]</li><li>Carré : [[formula]]</li></ul>"
    },
    {
      "n": 2,
      "statement": "Calcule le double de ce nombre :",
      "answer": "[\"2*n\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(5,50)",
        "relation_kind": "multiple_direct",
        "factor": 2
      },
      "footer": "$$\\text{double de }${n}=[[formula]]$$"
    },
    {
      "n": 3,
      "statement": "Calcule le triple de ce nombre :",
      "answer": "[\"3*n\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(5,40)",
        "relation_kind": "multiple_direct",
        "factor": 3
      },
      "footer": "$$\\text{triple de }${n}=[[formula]]$$"
    },
    {
      "n": 4,
      "statement": "Calcule la moitié de ce nombre :",
      "answer": "[\"n/2\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(5,50)*2",
        "relation_kind": "fraction_direct",
        "divisor": 2
      },
      "footer": "$$\\text{moitié de }${n}=[[formula]]$$"
    },
    {
      "n": 5,
      "statement": "Donne le prédécesseur de ce nombre :",
      "answer": "[\"n-1\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(10,100)",
        "relation_kind": "predecessor"
      },
      "footer": "$$\\text{prédécesseur de }${n}=[[formula]]$$"
    },
    {
      "n": 6,
      "statement": "Donne le successeur de ce nombre :",
      "answer": "[\"n+1\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(10,100)",
        "relation_kind": "successor"
      },
      "footer": "$$\\text{successeur de }${n}=[[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Quelle expression correspond à la relation demandée ?",
      "answer": "[]",
      "options": {
        "relation_kind": "expression_qcm",
        "expression_target": "double"
      },
      "footer": ""
    },
    {
      "n": 9,
      "statement": "Le double d'un nombre vaut $$${c}$$. Quel est ce nombre ?",
      "answer": "[\"c/2\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(5,50)\nc=2*n",
        "relation_kind": "multiple_inverse",
        "factor": 2
      },
      "footer": "[[formula]]"
    },
    {
      "n": 10,
      "statement": "<div style=\"text-align:justify\">Marie a $$${n}$$ billes. Paul en a le triple. Combien de billes Paul a-t-il ?</div>",
      "answer": "[\"3*n\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(4,30)",
        "relation_kind": "multiple_direct",
        "factor": 3
      },
      "footer": "$$[[formula]]\\text{ billes}$$"
    },
    {
      "n": 11,
      "statement": "Calcule le quadruple de ce nombre :",
      "answer": "[\"4*n\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(5,30)",
        "relation_kind": "multiple_direct",
        "factor": 4
      },
      "footer": "$$\\text{quadruple de }${n}=[[formula]]$$"
    },
    {
      "n": 12,
      "statement": "Calcule la moitié de ce nombre impair :",
      "answer": "[\"n/2\"]",
      "options": {
        "formula_code": "setNB(1)\nn=2*RD(2,24)+1",
        "relation_kind": "fraction_direct",
        "divisor": 2
      },
      "footer": "$$\\text{moitié de }${n}=[[formula]]$$"
    },
    {
      "n": 13,
      "statement": "Calcule le quart de ce nombre :",
      "answer": "[\"n/4\"]",
      "options": {
        "formula_code": "setNB(1)\nn=4*RD(2,25)",
        "relation_kind": "fraction_direct",
        "divisor": 4
      },
      "footer": "$$\\text{quart de }${n}=[[formula]]$$"
    },
    {
      "n": 14,
      "statement": "Quelle expression correspond à la relation demandée ?",
      "answer": "[]",
      "options": {
        "relation_kind": "expression_qcm",
        "expression_target": "triple"
      },
      "footer": ""
    },
    {
      "n": 15,
      "statement": "Quelle expression correspond à la relation demandée ?",
      "answer": "[]",
      "options": {
        "relation_kind": "expression_qcm",
        "expression_target": "quadruple"
      },
      "footer": ""
    },
    {
      "n": 16,
      "statement": "Quelle expression correspond à la relation demandée ?",
      "answer": "[]",
      "options": {
        "relation_kind": "expression_qcm",
        "expression_target": "half"
      },
      "footer": ""
    },
    {
      "n": 17,
      "statement": "Quelle expression correspond à la relation demandée ?",
      "answer": "[]",
      "options": {
        "relation_kind": "expression_qcm",
        "expression_target": "quarter"
      },
      "footer": ""
    },
    {
      "n": 18,
      "statement": "Quelle expression correspond à la relation demandée ?",
      "answer": "[]",
      "options": {
        "relation_kind": "expression_qcm",
        "expression_target": "predecessor"
      },
      "footer": ""
    },
    {
      "n": 19,
      "statement": "Quelle expression correspond à la relation demandée ?",
      "answer": "[]",
      "options": {
        "relation_kind": "expression_qcm",
        "expression_target": "successor"
      },
      "footer": ""
    }
  ]
};
