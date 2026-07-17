const MODULE_DNB_19 = {
  "id": "dnb_19",
  "num": 19,
  "title": "Conversions d'unités",
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
      "statement": "",
      "answer": "[\"n/100\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(1,9)*100+RD(0,9)*10"
      },
      "footer": "$$${n}\\,\\text{cm}=[[formula]]\\,\\text{m}$$"
    },
    {
      "n": 2,
      "statement": "",
      "answer": "[\"n*1000+d*100\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(1,9)\nd=RD(1,9)"
      },
      "footer": "$$${n},${d}\\,\\text{km}=[[formula]]\\,\\text{m}$$"
    },
    {
      "n": 3,
      "statement": "",
      "answer": "[\"n\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(2,9)\nc=n*10000"
      },
      "footer": "$$${c}\\,\\text{cm}^2=[[formula]]\\,\\text{m}^2$$"
    },
    {
      "n": 4,
      "statement": "",
      "answer": "[\"n*10000\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(2,9)"
      },
      "footer": "$$${n}\\,\\text{m}^2=[[formula]]\\,\\text{cm}^2$$"
    },
    {
      "n": 5,
      "statement": "Sachant que $$1\\,\\text{dm}^3=1\\,\\text{L}$$, convertis en litres :",
      "answer": "[\"n\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(2,9)\nc=n*1000"
      },
      "footer": "$$${c}\\,\\text{cm}^3=[[formula]]\\,\\text{L}$$"
    },
    {
      "n": 6,
      "statement": "",
      "answer": "[\"n*1000+d*100\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(1,9)\nd=RD(1,9)"
      },
      "footer": "$$${n},${d}\\,\\text{kg}=[[formula]]\\,\\text{g}$$"
    },
    {
      "n": 7,
      "statement": "",
      "answer": "[\"n/100\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(1,9)*100+RD(1,9)*10"
      },
      "footer": "$$${n}\\,\\text{cL}=[[formula]]\\,\\text{L}$$"
    },
    {
      "n": 8,
      "statement": "",
      "answer": "[\"h*3600+m*60\"]",
      "options": {
        "formula_code": "setNB(1)\nh=RD(1,5)\nm=RD(1,9)*5"
      },
      "footer": "$$${h}\\,\\text{h}\\,${m}\\,\\text{min}=[[formula]]\\,\\text{s}$$"
    },
    {
      "n": 9,
      "statement": "",
      "answer": "[\"1000\",\"n\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(2,9)"
      },
      "footer": "$$1\\,\\text{m}^3=[[formula]]\\,\\text{L}$$\n\n$$${n}\\,\\text{dm}^3=[[formula]]\\,\\text{L}$$"
    },
    {
      "n": 10,
      "statement": "",
      "answer": "[\"n*100000\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(1,5)"
      },
      "footer": "$$${n}\\,\\text{km}=[[formula]]\\,\\text{cm}$$"
    }
  ]
};
