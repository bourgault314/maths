const MODULE_DNB_18 = {
  "id": "dnb_18",
  "num": 18,
  "title": "Somme des angles d'un triangle",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "import_dnb_zip",
  "has_svg": true,
  "questions": [
    {
      "n": 1,
      "statement": "Quelle est la somme des mesures des angles d'un triangle ?",
      "answer": "[\"180\"]",
      "options": {
        "angle_sum_kind": "sum_course"
      },
      "footer": "$$[[int]]°$$"
    },
    {
      "n": 2,
      "statement": "Dans un triangle, deux angles mesurent $$${a}°$$ et $$${b}°$$. Combien mesure le troisième ?",
      "answer": "[\"180-a-b\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(40,80)\nb=RD(40,80)",
        "angle_sum_kind": "general"
      },
      "footer": "$$[[formula]]°$$"
    },
    {
      "n": 3,
      "statement": "Dans un triangle, deux angles mesurent $$${a}°$$ et $$${b}°$$. Calcule la mesure du troisième angle.",
      "answer": "[\"180-a-b\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(20,60)\nb=RD(30,70)",
        "angle_sum_kind": "general"
      },
      "footer": "$$[[formula]]°$$"
    },
    {
      "n": 4,
      "statement": "Un triangle rectangle a un angle droit. Un autre angle mesure $$${a}°$$. Combien mesure le troisième ?",
      "answer": "[\"90-a\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(20,70)",
        "angle_sum_kind": "right"
      },
      "footer": "$$[[formula]]°$$"
    },
    {
      "n": 5,
      "statement": "Un triangle isocèle a son angle principal (au sommet) qui mesure $$${a}°$$. Combien mesure chacun des deux angles égaux à la base ?",
      "answer": "[\"(180-a)/2\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(10,80)*2",
        "angle_sum_kind": "isosceles_vertex"
      },
      "footer": "$$[[formula]]°$$"
    },
    {
      "n": 6,
      "statement": "Un triangle isocèle a ses deux angles à la base qui mesurent chacun $$${a}°$$. Combien mesure l'angle au sommet ?",
      "answer": "[\"180-2*a\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(40,80)",
        "angle_sum_kind": "isosceles_base"
      },
      "footer": "$$[[formula]]°$$"
    },
    {
      "n": 7,
      "statement": "Combien mesure chaque angle d'un triangle équilatéral ?",
      "answer": "[\"60\"]",
      "options": {
        "angle_sum_kind": "equilateral"
      },
      "footer": "$$[[int]]°$$"
    },
    {
      "n": 8,
      "statement": "Ces trois angles peuvent-ils être ceux d'un même triangle : $$${a}°$$, $$${b}°$$ et $$${c}°$$ ?&&Oui&&Non&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(40,80)\nb=RD(40,80)\nc=180-a-b",
        "shuffle_answers": true,
        "angle_sum_kind": "validity_three"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 9,
      "statement": "Lis les deux angles donnés et calcule la mesure de l'angle $$\\widehat{C}$$ (en rouge).",
      "answer": "[\"c\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(50,70)\nb=RD(50,70)\nc=180-a-b",
        "angle_sum_kind": "figure"
      },
      "footer": "$$\\widehat{C}=[[formula]]°$$"
    },
    {
      "n": 10,
      "statement": "Un élève affirme qu'un triangle a deux angles mesurant $$${a}°$$ et $$${b}°$$. A-t-il raison ?&&Non, c'est impossible&&Oui, c'est possible&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(100,140)\nm=RD(5,30)\nb=180-a+m+10",
        "shuffle_answers": true,
        "angle_sum_kind": "invalid_two"
      },
      "footer": "[[formula_qcm1]]"
    }
  ]
};
