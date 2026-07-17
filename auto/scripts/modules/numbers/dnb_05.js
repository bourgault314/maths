const MODULE_DNB_05 = {
  "id": "dnb_05",
  "num": 5,
  "title": "Un même nombre sous plusieurs formes",
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
      "statement": "Écris ce nombre décimal sous la forme d'une fraction de dénominateur 10 :",
      "answer": "[\"num\",\"10\"]",
      "options": {
        "formula_code": "setNB(1)\nwhole=RD(0,2)\ntenths=RD(1,9)\nnum=whole*10+tenths\ndec=CUT(num/10,2)",
        "multiple_forms_kind": "decimal_to_tenths"
      },
      "footer": "$$${dec}=[[formula_frac]]$$"
    },
    {
      "n": 2,
      "statement": "Écris ce nombre décimal sous la forme d'une fraction irréductible :",
      "answer": "[\"p\",\"den\"]",
      "options": {
        "formula_code": "setNB(1)\nvalues=[20,25,30,37,40,43,50,60,70,75,80,90,125,150,175]\nc=values[RD(values.length-1)]\ng=GCD(c,100)\np=c/g\nden=100/g\ndec=CUT(c/100,2)",
        "multiple_forms_kind": "decimal_to_irreducible"
      },
      "footer": "$$${dec}=\\dfrac{[[formula]]}{[[formula]]}$$"
    },
    {
      "n": 3,
      "statement": "Écris ce nombre décimal sous la forme d'un pourcentage :",
      "answer": "[\"c\"]",
      "options": {
        "formula_code": "setNB(1)\nvalues=[5,10,20,25,37,40,50,65,75,80,95,105,120,125,150,175,195]\nc=values[RD(values.length-1)]\ndec=CUT(c/100,2)",
        "multiple_forms_kind": "decimal_to_percent"
      },
      "footer": "$$${dec}=[[formula]]\\%$$"
    },
    {
      "n": 4,
      "statement": "Écris ce pourcentage sous la forme d'un nombre décimal :",
      "answer": "[\"p/100\"]",
      "options": {
        "formula_code": "setNB(1)\nvalues=[5,10,20,25,37,40,50,65,75,80,95,105,120,125,150,175,195]\np=values[RD(values.length-1)]",
        "multiple_forms_kind": "percent_to_decimal"
      },
      "footer": "$$${p}\\%=[[formula]]$$"
    },
    {
      "n": 5,
      "statement": "Écris cette fraction sous la forme d'un nombre décimal :",
      "answer": "[\"a/b\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(7)\na=[1,3,2,4,7,3,5,9][idx]\nb=[2,4,5,5,5,2,4,5][idx]",
        "multiple_forms_kind": "fraction_to_decimal"
      },
      "footer": "$$\\dfrac{${a}}{${b}}=[[formula]]$$"
    },
    {
      "n": 6,
      "statement": "Écris cette fraction sous la forme d'un pourcentage :",
      "answer": "[\"a*100/b\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(7)\na=[1,3,2,4,7,5,3,7][idx]\nb=[2,4,5,5,10,4,2,5][idx]",
        "multiple_forms_kind": "fraction_to_percent"
      },
      "footer": "$$\\dfrac{${a}}{${b}}=[[formula]]\\%$$"
    },
    {
      "n": 7,
      "statement": "Écris ce pourcentage sous la forme d'une fraction de dénominateur 100 :",
      "answer": "[\"p\",\"100\"]",
      "options": {
        "formula_code": "setNB(1)\nvalues=[5,10,20,25,37,40,50,65,75,80,95,105,120,125,150,175,195]\np=values[RD(values.length-1)]",
        "multiple_forms_kind": "percent_to_fraction100"
      },
      "footer": "$$${p}\\%=[[formula_frac]]$$"
    },
    {
      "n": 8,
      "statement": "Complète pour obtenir une fraction de dénominateur 100 :",
      "answer": "[\"a*100/b\",\"100\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(9)\na=[1,3,2,7,5,7,3,5,7,9][idx]\nb=[2,4,5,10,4,5,2,10,10,10][idx]",
        "multiple_forms_kind": "equivalent_to100"
      },
      "footer": "$$\\dfrac{${a}}{${b}}=[[formula_frac]]$$"
    },
    {
      "n": 9,
      "statement": "Écris cette fraction décimale sous sa forme irréductible :",
      "answer": "[\"p\",\"den\"]",
      "options": {
        "formula_code": "setNB(1)\nnums=[2,3,4,5,6,7,8,9,12,15,20,25,30,40,50,60,75,80,90,125,150,175]\ndens=[10,10,10,10,10,10,10,10,10,10,100,100,100,100,100,100,100,100,100,100,100,100]\nidx=RD(nums.length-1)\nnum=nums[idx]\nbaseDen=dens[idx]\ng=GCD(num,baseDen)\np=num/g\nden=baseDen/g",
        "multiple_forms_kind": "simplify_decimal_fraction"
      },
      "footer": "$$\\dfrac{${num}}{${baseDen}}=\\dfrac{[[formula]]}{[[formula]]}$$"
    },
    {
      "n": 10,
      "statement": "Parmi ces écritures, lesquelles sont égales à $$${dec}$$ ?&&$$\\dfrac{${num}}{10}$$&&$$${num}\\%$$&&$$${num*10}\\%$$&&$$\\dfrac{${num*10}}{100}$$&&",
      "answer": "[\"1\",\"3\",\"4\"]",
      "options": {
        "formula_code": "setNB(1)\nwhole=RD(0,1)\ntenths=RD(1,9)\nnum=whole*10+tenths\ndec=CUT(num/10,2)",
        "shuffle_answers": true,
        "multiple_forms_kind": "synthesis_line"
      },
      "footer": "[[formula_qcm]]"
    }
  ]
};
