const MODULE_DNB_04 = {
  "id": "dnb_04",
  "num": 4,
  "title": "Fractions d’une quantité et pourcentages repères",
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
      "statement": "Calcule :",
      "answer": "[\"n/q\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(3)\nq=[2,3,4,5][idx]\nmot=[\"la moitié\",\"le tiers\",\"le quart\",\"le cinquième\"][idx]\nm=RD(2,9)\nn=q*m",
        "fraction_percent_category": "fraction"
      },
      "footer": "$$\\text{${mot}}\\text{ de }${n}=[[formula]]$$"
    },
    {
      "n": 2,
      "statement": "Calcule :",
      "answer": "[\"p*n/q\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(2)\np=[2,3,2][idx]\nq=[3,4,5][idx]\nmot=[\"les deux tiers\",\"les trois quarts\",\"les deux cinquièmes\"][idx]\nm=RD(2,9)\nn=q*m",
        "fraction_percent_category": "fraction"
      },
      "footer": "$$\\text{${mot}}\\text{ de }${n}=[[formula]]$$"
    },
    {
      "n": 3,
      "statement": "Calcule :",
      "answer": "[\"p*n/q\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(3)\np=[1,3,5,1][idx]\nq=[6,5,6,8][idx]\nmot=[\"le sixième\",\"les trois cinquièmes\",\"les cinq sixièmes\",\"le huitième\"][idx]\nm=RD(2,8)\nn=q*m",
        "fraction_percent_category": "fraction"
      },
      "footer": "$$\\text{${mot}}\\text{ de }${n}=[[formula]]$$"
    },
    {
      "n": 4,
      "statement": "Calcule :",
      "answer": "[\"c\"]",
      "options": {
        "formula_code": "setNB(1)\nc=RD(10,200)",
        "fraction_percent_category": "percent",
        "percent_value": 100
      },
      "footer": "$$100\\%\\text{ de }${c}=[[formula]]$$"
    },
    {
      "n": 5,
      "statement": "Calcule :",
      "answer": "[\"c/2\"]",
      "options": {
        "formula_code": "setNB(1)\nc=RD(5,100)*2",
        "fraction_percent_category": "percent",
        "percent_value": 50
      },
      "footer": "$$50\\%\\text{ de }${c}=[[formula]]$$"
    },
    {
      "n": 6,
      "statement": "Calcule :",
      "answer": "[\"c/4\"]",
      "options": {
        "formula_code": "setNB(1)\nc=RD(3,50)*4",
        "fraction_percent_category": "percent",
        "percent_value": 25
      },
      "footer": "$$25\\%\\text{ de }${c}=[[formula]]$$"
    },
    {
      "n": 11,
      "statement": "Calcule :",
      "answer": "[\"c/5\"]",
      "options": {
        "formula_code": "setNB(1)\nc=RD(2,50)*5",
        "fraction_percent_category": "percent",
        "percent_value": 20
      },
      "footer": "$$20\\%\\text{ de }${c}=[[formula]]$$"
    },
    {
      "n": 7,
      "statement": "Calcule :",
      "answer": "[\"c/10\"]",
      "options": {
        "formula_code": "setNB(1)\nc=RD(2,40)*10",
        "fraction_percent_category": "percent",
        "percent_value": 10
      },
      "footer": "$$10\\%\\text{ de }${c}=[[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Calcule :",
      "answer": "[\"c/100\"]",
      "options": {
        "formula_code": "setNB(1)\nc=RD(2,40)*100",
        "fraction_percent_category": "percent",
        "percent_value": 1
      },
      "footer": "$$1\\%\\text{ de }${c}=[[formula]]$$"
    },
    {
      "n": 9,
      "statement": "Calcule ce pourcentage :",
      "answer": "[\"a*c/100\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(5)\na=[100,50,25,20,10,1][idx]\nmul=[1,2,4,5,10,100][idx]\nc=RD(2,30)*mul",
        "fraction_percent_category": "percent",
        "percent_dynamic": true
      },
      "footer": "$$${a}\\%\\text{ de }${c}=[[formula]]$$"
    },
    {
      "n": 10,
      "statement": "<div style=\"text-align:justify\">Dans un collège de $$${c}$$ élèves, $$${a}\\%$$ sont externes. Combien d'élèves sont externes ?</div>",
      "answer": "[\"a*c/100\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(5)\na=[100,50,25,20,10,1][idx]\nmul=[1,2,4,5,10,100][idx]\nc=RD(2,12)*mul\ncontextIndex=RD(4)",
        "fraction_percent_category": "percent",
        "percent_dynamic": true,
        "percent_contextual": true
      },
      "footer": "$$[[formula]]\\text{ élèves}$$"
    }
  ]
};
