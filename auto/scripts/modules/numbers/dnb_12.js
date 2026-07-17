const MODULE_DNB_12 = {
    "id": "dnb_12",
    "num": 12,
    "title": "Développer et factoriser une expression simple",
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
        "statement": "Développe cette expression :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nr1=\"{k}x+{p}\"\nr2=\"{p}+{k}x\""
        },
        "footer": "$$${k}(x+${a})=[[formula]]$$"
      },
      {
        "n": 2,
        "statement": "Développe cette expression :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nr1=\"{k}x-{p}\"\nr2=\"-{p}+{k}x\""
        },
        "footer": "$$${k}(x-${a})=[[formula]]$$"
      },
      {
        "n": 3,
        "statement": "Développe cette expression :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nr1=\"{p}+{k}x\"\nr2=\"{k}x+{p}\""
        },
        "footer": "$$${k}(${a}+x)=[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "Développe cette expression :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,5)\nb=RD(2,5)\na=RD(2,8)\nkb=k*b\nka=k*a\nr1=\"{kb}x+{ka}\"\nr2=\"{ka}+{kb}x\""
        },
        "footer": "$$${k}(${b}x+${a})=[[formula]]$$"
      },
      {
        "n": 5,
        "statement": "Quel est le développement de $$${k}(x+${a})$$ ?&&$$${k}x+${p}$$&&$$${k}x+${a}$$&&$$x+${p}$$&&$$${kpa}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nkpa=k+a",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 6,
        "statement": "Factorise cette expression (facteur commun) :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\nb=RD(2,5)\nc=RD(2,5,[b])\nkb=k*b\nkc=k*c\nr1=\"{k}({b}x+{c})\"\nr2=\"{k}({c}+{b}x)\""
        },
        "footer": "$$${kb}x+${kc}=[[formula]]$$"
      },
      {
        "n": 7,
        "statement": "Factorise cette expression (attention au terme constant) :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,8)\nb=RD(2,6)\nkb=k*b\nr1=\"{k}({b}x+1)\"\nr2=\"{k}(1+{b}x)\""
        },
        "footer": "$$${kb}x+${k}=[[formula]]$$"
      },
      {
        "n": 8,
        "statement": "Factorise par $$x$$ :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,9)\nr1=\"x(x+{a})\"\nr2=\"x({a}+x)\""
        },
        "footer": "$$x^2+${a}x=[[formula]]$$"
      },
      {
        "n": 9,
        "statement": "Quelle est la factorisation de $$${kb}x+${kc}$$ ?&&$$${k}(${b}x+${c})$$&&$$${k}(${b}x+${kc})$$&&$$${b}(${k}x+${c})$$&&$$${k}x(${b}+${c})$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,4)\noff=RD(1,3)\nb=k+off\nc=RD(2,6)\nkb=k*b\nkc=k*c",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 10,
        "statement": "<div style=\"text-align:justify\">Un rectangle a pour largeur $$${k}$$ et pour longueur $$x+${a}$$. Exprime son aire développée.</div>",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nr1=\"{k}x+{p}\"\nr2=\"{p}+{k}x\""
        },
        "footer": "$$\\mathcal{A}=[[formula]]$$"
      }
    ]
  };
