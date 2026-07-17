const MODULE_DNB_11 = {
  "id": "dnb_11",
  "num": 11,
  "title": "Calculer la valeur d'une expression algébrique",
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
      "statement": "<div style=\"text-align:center\">Calcule la valeur de cette<br>expression pour $$x=${v}$$ :</div>",
      "answer": "[\"a*v+b\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(2,6)\nb=RD(-9,9,[0])\nv=RD(-5,6,[0])\nsb=(b<0)?\"({b})\":\"{b}\""
      },
      "footer": "$$${a}x+${sb}=[[formula]]$$"
    },
    {
      "n": 2,
      "statement": "<div style=\"text-align:center\">Calcule la valeur de cette<br>expression pour $$x=${v}$$ :</div>",
      "answer": "[\"a*v*v+b\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(2,5)\nb=RD(1,9)\nv=RD(2,6)"
      },
      "footer": "$$${a}x^2+${b}=[[formula]]$$"
    },
    {
      "n": 3,
      "statement": "<div style=\"text-align:center\">Calcule la valeur de cette<br>expression pour $$x=${v}$$ :</div>",
      "answer": "[\"v*v+b*v+c\"]",
      "options": {
        "formula_code": "setNB(1)\nb=RD(2,5)\nc=RD(1,9)\nv=RD(2,5)"
      },
      "footer": "$$x^2+${b}x+${c}=[[formula]]$$"
    },
    {
      "n": 4,
      "statement": "<div style=\"text-align:center\">Calcule la valeur de cette<br>expression pour $$x=${v}$$ :</div>",
      "answer": "[\"a-b*v\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(10,30)\nb=RD(2,5)\nv=RD(-4,5,[0])"
      },
      "footer": "$$${a}-${b}x=[[formula]]$$"
    },
    {
      "n": 5,
      "statement": "<div style=\"text-align:center\">Calcule la valeur de cette<br>expression pour $$x=${v}$$ :</div>",
      "answer": "[\"a*v*v*v\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(2,4)\nv=RD(2,4)"
      },
      "footer": "$$${a}x^3=[[formula]]$$"
    },
    {
      "n": 6,
      "statement": "<div style=\"text-align:center\">Calcule la valeur de cette<br>expression pour<br> $$x=${vx}$$ et $$y=${vy}$$ :</div>",
      "answer": "[\"a*vx+b*vy\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(2,6)\nb=RD(2,6)\nvx=RD(2,7)\nvy=RD(2,7)"
      },
      "footer": "$$${a}x+${b}y=[[formula]]$$"
    },
    {
      "n": 7,
      "statement": "Calcule cette puissance :",
      "answer": "[\"pow(x,n)\"]",
      "options": {
        "formula_code": "setNB(1)\nidx=RD(4)\nx=[2,2,3,2,5][idx]\nn=[4,5,3,6,3][idx]"
      },
      "footer": "$$${x}^${n}=[[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Calcule la valeur de cette expression pour $$x=${v}$$ :",
      "answer": "[\"(v+a)*(v+a)\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(1,5)\nv=RD(2,6)"
      },
      "footer": "$$(x+${a})^2=[[formula]]$$"
    },
    {
      "n": 9,
      "statement": "Pour $$x=${v}$$, que vaut $$2x^2$$ ?&&$$${r1}$$&&$$${r2}$$&&$$${r3}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nv=RD(2,6)\nr1=2*v*v\nr2=(2*v)*(2*v)\nr3=2*v"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 10,
      "statement": "<div style=\"text-align:justify\">L'aire d'un carré de côté $$c$$ est donnée par $$c^2$$. Calcule l'aire d'un carré de côté $$${v}$$ cm.</div>",
      "answer": "[\"v*v\"]",
      "options": {
        "formula_code": "setNB(1)\nv=RD(3,15)"
      },
      "footer": "$$[[formula]]\\text{ cm}^2$$"
    },
    {
      "n": 11,
      "statement": "Calcule la valeur de cette expression :",
      "answer": "[]",
      "footer": "",
      "options": {
        "substitution_kind": "factorised"
      }
    }
  ]
};
