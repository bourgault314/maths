const MODULE_DNB_01 = {
  "id": "dnb_01",
  "num": 1,
  "title": "Écriture décimale des fractions simples",
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
      "answer": "[\"0,5\"]",
      "options": null,
      "footer": "$$\\dfrac{1}{2}=[[dec]]$$"
    },
    {
      "n": 2,
      "statement": "",
      "answer": "[\"0,25\"]",
      "options": null,
      "footer": "$$\\dfrac{1}{4}=[[dec]]$$"
    },
    {
      "n": 3,
      "statement": "",
      "answer": "[\"0,75\"]",
      "options": null,
      "footer": "$$\\dfrac{3}{4}=[[dec]]$$"
    },
    {
      "n": 4,
      "statement": "",
      "answer": "[\"1,5\"]",
      "options": null,
      "footer": "$$\\dfrac{3}{2}=[[dec]]$$"
    },
    {
      "n": 5,
      "statement": "",
      "answer": "[\"2\"]",
      "options": null,
      "footer": "$$\\dfrac{4}{2}=[[dec]]$$"
    },
    {
      "n": 6,
      "statement": "",
      "answer": "[\"2,5\"]",
      "options": null,
      "footer": "$$\\dfrac{5}{2}=[[dec]]$$"
    },
    {
      "n": 7,
      "statement": "",
      "answer": "[\"0,1\"]",
      "options": null,
      "footer": "$$\\dfrac{1}{10}=[[dec]]$$"
    },
    {
      "n": 8,
      "statement": "Donne l'écriture décimale :",
      "answer": "[\"d\"]",
      "options": {
        "formula_code": "setNB(3)\nnum=RD(2,100)\nden=(RD(1)===0)?1:num\nd=num/den\ntex=\"\\dfrac{{num}}{{den}}\""
      },
      "footer": "$$${tex}=[[formula]]$$"
    },
    {
      "n": 9,
      "statement": "Donne la fraction irréductible correspondante :",
      "answer": "[\"1\",\"2\"]",
      "options": null,
      "footer": "$$0,5=[[frac-simp]]$$"
    },
    {
      "n": 10,
      "statement": "Donne la fraction irréductible correspondante :",
      "answer": "[\"1\",\"4\"]",
      "options": null,
      "footer": "$$0,25=[[frac-simp]]$$"
    },
    {
      "n": 11,
      "statement": "Donne la fraction irréductible correspondante :",
      "answer": "[\"3\",\"4\"]",
      "options": null,
      "footer": "$$0,75=[[frac-simp]]$$"
    },
    {
      "n": 12,
      "statement": "Donne la fraction irréductible correspondante :",
      "answer": "[\"3\",\"2\"]",
      "options": null,
      "footer": "$$1,5=[[frac-simp]]$$"
    },
    {
      "n": 13,
      "statement": "Donne la fraction irréductible correspondante :",
      "answer": "[\"5\",\"2\"]",
      "options": null,
      "footer": "$$2,5=[[frac-simp]]$$"
    },
    {
      "n": 14,
      "statement": "Donne la fraction irréductible correspondante :",
      "answer": "[\"1\",\"10\"]",
      "options": null,
      "footer": "$$0,1=[[frac-simp]]$$"
    },
    {
      "n": 15,
      "statement": "Donne la fraction irréductible correspondante :",
      "answer": "[\"1\",\"100\"]",
      "options": null,
      "footer": "$$0,01=[[frac-simp]]$$"
    },
    {
      "n": 16,
      "statement": "Donne l'écriture décimale :",
      "answer": "[\"d\"]",
      "options": {
        "formula_code": "setNB(3)\nnum=RD(2,100)\nden=(RD(1)===0)?1:num\nd=num/den\ntex=\"\\dfrac{{num}}{{den}}\""
      },
      "footer": "$$${tex}=[[formula]]$$"
    }
  ]
};
