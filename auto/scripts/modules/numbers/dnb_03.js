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
  "questions": [
    {
      "n": 1,
      "statement": "Simplifie cette fraction (donne la forme irréductible) :",
      "answer": "[\"p\",\"q\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(5)\np=[1,2,3,3,4,5][idx]\nq=[2,3,4,5,5,6][idx]\nk=RD(2,6)\nnum=k*p\nden=k*q",
        "fraction_ops_kind": "simplify_simple"
      },
      "footer": "$$\\dfrac{${num}}{${den}}=\\dfrac{[[formula]]}{[[formula]]}$$"
    },
    {
      "n": 2,
      "statement": "Simplifie cette fraction (donne la forme irréductible) :",
      "answer": "[\"p\",\"q\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(5)\np=[2,3,4,5,5,7][idx]\nq=[5,7,9,8,9,10][idx]\nk=RD(2,5)\nnum=k*p\nden=k*q",
        "fraction_ops_kind": "simplify_harder"
      },
      "footer": "$$\\dfrac{${num}}{${den}}=\\dfrac{[[formula]]}{[[formula]]}$$"
    },
    {
      "n": 3,
      "statement": "Compare ces deux fractions de même dénominateur. Laquelle est la plus grande ?&&$$\\dfrac{${a}}{${d}}$$&&$$\\dfrac{${b}}{${d}}$$&&Elles sont égales&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(3,12)\na=RD(5,11)\nb=RD(1,4)",
        "shuffle_answers": true,
        "fraction_ops_kind": "compare_same_den"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 4,
      "statement": "Compare ces deux fractions de même numérateur. Laquelle est la plus grande ?&&$$\\dfrac{${n}}{${a}}$$&&$$\\dfrac{${n}}{${b}}$$&&Elles sont égales&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(2,9)\na=RD(2,5)\nb=RD(7,12)",
        "shuffle_answers": true,
        "fraction_ops_kind": "compare_same_num"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 5,
      "statement": "Calcule cette somme :",
      "answer": "[\"a+b\",\"d\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(4,12)\na=RD(1,7)\nb=RD(1,7)",
        "fraction_ops_kind": "add_same_den"
      },
      "footer": "$$\\dfrac{${a}}{${d}}+\\dfrac{${b}}{${d}}=[[formula_frac]]$$"
    },
    {
      "n": 6,
      "statement": "Calcule cette différence :",
      "answer": "[\"a-b\",\"d\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(4,12)\nb=RD(1,5)\na=RD(6,11)",
        "fraction_ops_kind": "subtract_same_den"
      },
      "footer": "$$\\dfrac{${a}}{${d}}-\\dfrac{${b}}{${d}}=[[formula_frac]]$$"
    },
    {
      "n": 7,
      "statement": "Réduis au même dénominateur, puis calcule :",
      "answer": "[\"a*k+b\",\"d\"]",
      "options": {
        "formula_code": "setNB(1)\nd1=RD(3,5)\nk=RD(2,4)\nd=d1*k\na=RD(1,d1-1)\nb=RD(1,d-1)",
        "fraction_ops_kind": "add_multiple_den"
      },
      "footer": "$$\\dfrac{${a}}{${d1}}+\\dfrac{${b}}{${d}}=[[formula_frac]]$$"
    }
  ]
};
