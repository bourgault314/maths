const MODULE_DNB_12 = {
    "id": "dnb_12",
    "num": 12,
    "title": "Développer et factoriser",
    "level_tags": [
      "5e",
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
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nr1=\"{k}x+{p}\"\nr2=\"{p}+{k}x\"",
          "expand_family": "develop-direct"
        },
        "footer": "$$${k}(x+${a})=[[formula]]$$"
      },
      {
        "n": 2,
        "statement": "Développe cette expression :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nr1=\"{k}x-{p}\"\nr2=\"-{p}+{k}x\"",
          "expand_family": "develop-direct"
        },
        "footer": "$$${k}(x-${a})=[[formula]]$$"
      },
      {
        "n": 3,
        "statement": "Développe cette expression :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nr1=\"{p}+{k}x\"\nr2=\"{k}x+{p}\"",
          "expand_family": "develop-direct"
        },
        "footer": "$$${k}(${a}+x)=[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "Développe cette expression :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,5)\nb=RD(2,5)\na=RD(2,8)\nkb=k*b\nka=k*a\nr1=\"{kb}x+{ka}\"\nr2=\"{ka}+{kb}x\"",
          "expand_family": "develop-direct"
        },
        "footer": "$$${k}(${b}x+${a})=[[formula]]$$"
      },
      {
        "n": 5,
        "statement": "Quel est le développement de $$${k}(x+${a})$$ ?&&$$${k}x+${p}$$&&$$${k}x+${a}$$&&$$x+${p}$$&&$$${kpa}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nkpa=k+a",
          "shuffle_answers": true,
          "expand_family": "diagnostic"
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 6,
        "statement": "Factorise au maximum cette expression :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\nb=RD(2,5)\ndo{c=RD(2,5,[b])}while(GCD(b,c)!=1)\nkb=k*b\nkc=k*c\nr1=\"{k}({b}x+{c})\"\nr2=\"{k}({c}+{b}x)\"",
          "expand_family": "factor-direct"
        },
        "footer": "$$${kb}x+${kc}=[[formula]]$$"
      },
      {
        "n": 7,
        "statement": "Factorise cette expression (attention au terme constant) :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,8)\nb=RD(2,6)\nkb=k*b\nr1=\"{k}({b}x+1)\"\nr2=\"{k}(1+{b}x)\"",
          "expand_family": "factor-direct"
        },
        "footer": "$$${kb}x+${k}=[[formula]]$$"
      },
      {
        "n": 8,
        "statement": "Factorise par $$x$$ :",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,9)\nr1=\"x(x+{a})\"\nr2=\"x({a}+x)\"",
          "expand_family": "factor-direct"
        },
        "footer": "$$x^2+${a}x=[[formula]]$$"
      },
      {
        "n": 9,
        "statement": "Quelle est la factorisation de $$${kb}x+${kc}$$ ?&&$$${k}(${b}x+${c})$$&&$$${k}(${b}x+${kc})$$&&$$${b}(${k}x+${c})$$&&$$${k}x(${b}+${c})$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,4)\noff=RD(1,3)\nb=k+off\nc=RD(2,6)\nkb=k*b\nkc=k*c",
          "shuffle_answers": true,
          "expand_family": "diagnostic"
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 10,
        "statement": "<div style=\"text-align:justify\">Un rectangle a pour largeur $$${k}$$ et pour longueur $$x+${a}$$. Exprime son aire développée.</div>",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\nk=RD(2,6)\na=RD(2,9)\np=k*a\nr1=\"{k}x+{p}\"\nr2=\"{p}+{k}x\"",
          "expand_family": "context"
        },
        "footer": "$$\\mathcal{A}=[[formula]]$$"
      },
      {
        "n": 11,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"structure","expand_family":"structure"},
        "footer": ""
      },
      {
        "n": 12,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"true-false","expand_family":"diagnostic"},
        "footer": ""
      },
      {
        "n": 13,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"partial-products","expand_family":"manipulation"},
        "footer": ""
      },
      {
        "n": 14,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"choose-common-factor","expand_family":"diagnostic"},
        "footer": ""
      },
      {
        "n": 15,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"negative-factor","expand_family":"develop-direct"},
        "footer": ""
      },
      {
        "n": 16,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"develop-reduce","expand_family":"develop-reduce"},
        "footer": ""
      },
      {
        "n": 17,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"factor-difference","expand_family":"factor-direct"},
        "footer": ""
      },
      {
        "n": 18,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"rebuild-dimensions","expand_family":"manipulation"},
        "footer": ""
      },
      {
        "n": 19,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"double-positive","expand_family":"double-direct"},
        "footer": ""
      },
      {
        "n": 20,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"double-coefficients","expand_family":"double-direct"},
        "footer": ""
      },
      {
        "n": 21,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"double-signs","expand_family":"double-direct"},
        "footer": ""
      },
      {
        "n": 22,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"double-products","expand_family":"manipulation"},
        "footer": ""
      },
      {
        "n": 23,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"apparent-factor","expand_family":"factor-apparent"},
        "footer": ""
      },
      {
        "n": 24,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"apparent-factor-x","expand_family":"factor-apparent"},
        "footer": ""
      },
      {
        "n": 25,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"identity-recognition","expand_family":"identity"},
        "footer": ""
      },
      {
        "n": 26,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"identity-expand-square","expand_family":"identity"},
        "footer": ""
      },
      {
        "n": 27,
        "statement": "",
        "answer": "[\"answer\"]",
        "options": {"expand_kind":"identity-difference","expand_family":"identity"},
        "footer": ""
      }
    ]
  };
