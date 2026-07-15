const RAW_NUMBER_MODULES = [
  {
    "id": "dnb_01",
    "num": 1,
    "title": "Ecriture décimale des fractions simples",
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
  },
  {
    "id": "dnb_02",
    "num": 2,
    "title": "Comparer et calculer avec des décimaux",
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
        "statement": "Dire quel est le plus grand nombre parmi les trois nombres suivants :\n\n<div style=\"text-align:center\">$$${a}$$  ;  $$${b}$$  ;  $$${c}$$</div>",
        "answer": "[\"mx\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(10,99)/10\nb=RD(10,99)/10\nc=RD(10,99)/10\nmab=a>b?a:b\nmx=mab>c?mab:c"
        },
        "footer": "[[formula]]"
      },
      {
        "n": 2,
        "statement": "Dire quel est le plus grand nombre parmi les trois nombres suivants :\n\n<div style=\"text-align:center\">$$${a}$$  ;  $$${b}$$  ;  $$${c}$$</div>",
        "answer": "[\"mx\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(-99,-10)/10\nb=RD(-99,-10)/10\nc=RD(-99,-10)/10\nmab=a>b?a:b\nmx=mab>c?mab:c"
        },
        "footer": "$$[[formula]]$$"
      },
      {
        "n": 3,
        "statement": "Range ces trois nombres dans l'ordre croissant :\n\n<div style=\"text-align:center\">$$${a}$$  ;  $$${b}$$  ;  $$${c}$$</div>",
        "answer": "[\"mn\",\"md\",\"mx\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(100,999)/100\nb=RD(100,999)/100\nc=RD(100,999)/100\nmab=a>b?a:b\nmx=mab>c?mab:c\nnab=a<b?a:b\nmn=nab<c?nab:c\nmd=a+b+c-mn-mx"
        },
        "footer": "$$[[formula]]<[[formula]]<[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "Encadre ce nombre entre deux entiers consécutifs :",
        "answer": "[\"e\",\"e+1\"]",
        "options": {
          "formula_code": "setNB(1)\ne=RD(1,9)\nf=RD(1,99)/100\na=e+f"
        },
        "footer": "$$[[formula]]<${a}<[[formula]]$$"
      },
      {
        "n": 5,
        "statement": "Encadre ce nombre négatif entre deux entiers consécutifs :",
        "answer": "[\"0-e-1\",\"0-e\"]",
        "options": {
          "formula_code": "setNB(1)\ne=RD(1,9)\nf=RD(1,99)/100\na=e+f"
        },
        "footer": "$$[[formula]]<-${a}<[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Calculer :",
        "answer": "[\"a+b\"]",
        "options": {
          "formula_code": "setNB(1)\nd1=RD(1,9)/10\nd2=1-d1\na=RD(10,99)+d1\nb=RD(10,99)+d2"
        },
        "footer": "$$${a}+${b}=[[formula]]$$"
      },
      {
        "n": 7,
        "statement": "Calculer :",
        "answer": "[\"c\"]",
        "options": {
          "formula_code": "setNB(1)\nb=RD(1,99)/10\nc=RD(10,99)/10\na=b+c"
        },
        "footer": "$$${a}-${b}=[[formula]]$$"
      },
      {
        "n": 8,
        "statement": "Calculer :",
        "answer": "[\"a+b\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(1,99)/10\nb=RD(-99,-1)/10"
        },
        "footer": "$$${a}+(${b})=[[formula]]$$"
      },
      {
        "n": 9,
        "statement": "Calculer :",
        "answer": "[\"a*b\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(11,99,[20,30,40,50,60,70,80,90])/10\nb=RD(2,9)"
        },
        "footer": "$$${a}\\times${b}=[[formula]]$$"
      },
      {
        "n": 10,
        "statement": "Calculer :",
        "answer": "[\"a/b\"]",
        "options": {
          "formula_code": "setNB(1)\nb=RD(2,9)\nc=RD(2,9)/10\na=CUT(b*c,4)"
        },
        "footer": "$$${a}\\div${b}=[[formula]]$$"
      }
    ]
  },
  {
    "id": "dnb_03",
    "num": 3,
    "title": "Fractions - Simplifier, comparer, calculer",
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
          "formula_code": "setNB(1)\nidx=RD(5)\np=[1,2,3,3,4,5][idx]\nq=[2,3,4,5,5,6][idx]\nk=RD(2,6)\nnum=k*p\nden=k*q"
        },
        "footer": "$$\\dfrac{${num}}{${den}}=\\dfrac{[[formula]]}{[[formula]]}$$"
      },
      {
        "n": 2,
        "statement": "Simplifie cette fraction (donne la forme irréductible) :",
        "answer": "[\"p\",\"q\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(5)\np=[2,3,4,5,5,7][idx]\nq=[5,7,9,8,9,10][idx]\nk=RD(2,5)\nnum=k*p\nden=k*q"
        },
        "footer": "$$\\dfrac{${num}}{${den}}=\\dfrac{[[formula]]}{[[formula]]}$$"
      },
      {
        "n": 3,
        "statement": "Compare ces deux fractions de même dénominateur. Laquelle est la plus grande ?&&$$\\dfrac{${a}}{${d}}$$&&$$\\dfrac{${b}}{${d}}$$&&Elles sont égales&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(3,12)\na=RD(5,11)\nb=RD(1,4)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 4,
        "statement": "Compare ces deux fractions de même numérateur. Laquelle est la plus grande ?&&$$\\dfrac{${n}}{${a}}$$&&$$\\dfrac{${n}}{${b}}$$&&Elles sont égales&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(2,9)\na=RD(2,5)\nb=RD(7,12)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 5,
        "statement": "Calcule cette somme :",
        "answer": "[\"a+b\",\"d\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(4,12)\na=RD(1,7)\nb=RD(1,7)"
        },
        "footer": "$$\\dfrac{${a}}{${d}}+\\dfrac{${b}}{${d}}=[[formula_frac]]$$"
      },
      {
        "n": 6,
        "statement": "Calcule cette différence :",
        "answer": "[\"a-b\",\"d\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(4,12)\nb=RD(1,5)\na=RD(6,11)"
        },
        "footer": "$$\\dfrac{${a}}{${d}}-\\dfrac{${b}}{${d}}=[[formula_frac]]$$"
      },
      {
        "n": 7,
        "statement": "Réduis au même dénominateur, puis calcule :",
        "answer": "[\"a*k+b\",\"d\"]",
        "options": {
          "formula_code": "setNB(1)\nd1=RD(3,5)\nk=RD(2,4)\nd=d1*k\na=RD(1,d1-1)\nb=RD(1,d-1)"
        },
        "footer": "$$\\dfrac{${a}}{${d1}}+\\dfrac{${b}}{${d}}=[[formula_frac]]$$"
      },
      {
        "n": 8,
        "statement": "Calcule ce produit :",
        "answer": "[\"a*c\",\"b*d\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(1,5)\nb=RD(2,7)\nc=RD(1,5)\nd=RD(2,7)"
        },
        "footer": "$$\\dfrac{${a}}{${b}}\\times\\dfrac{${c}}{${d}}=[[formula_frac]]$$"
      },
      {
        "n": 9,
        "statement": "Calcule la fraction de la quantité (le résultat est un nombre entier) :",
        "answer": "[\"p*n/q\"]",
        "options": {
          "formula_code": "setNB(1)\np=RD(2,5)\nq=RD(2,5,[p])\nm=RD(2,9)\nn=q*m"
        },
        "footer": "$$\\dfrac{${p}}{${q}}\\text{ du nombre }${n}=[[formula]]$$"
      },
      {
        "n": 10,
        "statement": "Calcule (le résultat est un nombre entier) :",
        "answer": "[\"n/q\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(3)\nq=[2,3,4,5][idx]\nmot=[\"la moitié\",\"le tiers\",\"le quart\",\"le cinquième\"][idx]\nm=RD(2,9)\nn=q*m"
        },
        "footer": "$$\\text{${mot}}\\text{ de }${n}=[[formula]]$$"
      }
    ]
  },
  {
    "id": "dnb_04",
    "num": 4,
    "title": "Fraction d'un nombre et pourcentages repères",
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
        "statement": "Calcule (le résultat est un nombre entier) :",
        "answer": "[\"n/q\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(3)\nq=[2,3,4,5][idx]\nmot=[\"la moitié\",\"le tiers\",\"le quart\",\"le cinquième\"][idx]\nm=RD(2,9)\nn=q*m"
        },
        "footer": "$$\\text{${mot}}\\text{ de }${n}=[[formula]]$$"
      },
      {
        "n": 2,
        "statement": "Calcule (le résultat est un nombre entier) :",
        "answer": "[\"p*n/q\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(2)\np=[2,3,2][idx]\nq=[3,4,5][idx]\nmot=[\"les deux tiers\",\"les trois quarts\",\"les deux cinquièmes\"][idx]\nm=RD(2,9)\nn=q*m"
        },
        "footer": "$$\\text{${mot}}\\text{ de }${n}=[[formula]]$$"
      },
      {
        "n": 3,
        "statement": "Calcule (le résultat est un nombre entier) :",
        "answer": "[\"p*n/q\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(3)\np=[1,3,5,1][idx]\nq=[6,5,6,8][idx]\nmot=[\"le sixième\",\"les trois cinquièmes\",\"les cinq sixièmes\",\"le huitième\"][idx]\nm=RD(2,8)\nn=q*m"
        },
        "footer": "$$\\text{${mot}}\\text{ de }${n}=[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "Calcule :",
        "answer": "[\"c\"]",
        "options": {
          "formula_code": "setNB(1)\nc=RD(10,200)"
        },
        "footer": "$$100\\%\\text{ de }${c}=[[formula]]$$"
      },
      {
        "n": 5,
        "statement": "Calcule :",
        "answer": "[\"c/2\"]",
        "options": {
          "formula_code": "setNB(1)\nc=RD(5,100)*2"
        },
        "footer": "$$50\\%\\text{ de }${c}=[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Calcule :",
        "answer": "[\"c/4\"]",
        "options": {
          "formula_code": "setNB(1)\nc=RD(3,50)*4"
        },
        "footer": "$$25\\%\\text{ de }${c}=[[formula]]$$"
      },
      {
        "n": 7,
        "statement": "Calcule :",
        "answer": "[\"c/10\"]",
        "options": {
          "formula_code": "setNB(1)\nc=RD(2,40)*10"
        },
        "footer": "$$10\\%\\text{ de }${c}=[[formula]]$$"
      },
      {
        "n": 8,
        "statement": "Calcule :",
        "answer": "[\"c/100\"]",
        "options": {
          "formula_code": "setNB(1)\nc=RD(2,40)*100"
        },
        "footer": "$$1\\%\\text{ de }${c}=[[formula]]$$"
      },
      {
        "n": 9,
        "statement": "Calcule ce pourcentage :",
        "answer": "[\"a*c/100\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(4)\na=[100,50,25,10,1][idx]\nmul=[1,2,4,10,100][idx]\nc=RD(2,30)*mul"
        },
        "footer": "$$${a}\\%\\text{ de }${c}=[[formula]]$$"
      },
      {
        "n": 10,
        "statement": "<div style=\"text-align:justify\">Dans un collège de $$${c}$$ élèves, $$${a}\\%$$ sont externes. Combien d'élèves sont externes ?</div>",
        "answer": "[\"a*c/100\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(3)\na=[50,25,10,1][idx]\nmul=[2,4,10,100][idx]\nc=RD(2,12)*mul"
        },
        "footer": "$$[[formula]]\\text{ élèves}$$"
      }
    ]
  },
  {
    "id": "dnb_05",
    "num": 5,
    "title": "Un même nombre sous de multiples formes",
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
        "answer": "[\"e*10+f\",\"10\"]",
        "options": {
          "formula_code": "setNB(1)\ne=RD(1,9)\nf=RD(1,9)\ndec=e+f/10"
        },
        "footer": "$$${dec}=[[formula_frac]]$$"
      },
      {
        "n": 2,
        "statement": "Écris ce nombre décimal sous la forme d'une fraction irréductible :",
        "answer": "[\"p\",\"q\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(4)\np=[6,3,5,7,9][idx]\nq=[5,2,4,5,5][idx]\ndec=CUT(p/q,4)"
        },
        "footer": "$$${dec}=\\dfrac{[[formula]]}{[[formula]]}$$"
      },
      {
        "n": 3,
        "statement": "Écris ce nombre décimal sous la forme d'un pourcentage :",
        "answer": "[\"c\"]",
        "options": {
          "formula_code": "setNB(1)\nc=RD(105,295)\ndec=c/100"
        },
        "footer": "$$${dec}=[[formula]]\\%$$"
      },
      {
        "n": 4,
        "statement": "Écris ce pourcentage sous la forme d'un nombre décimal :",
        "answer": "[\"p/100\"]",
        "options": {
          "formula_code": "setNB(1)\np=RD(5,250)"
        },
        "footer": "$$${p}\\%=[[formula]]$$"
      },
      {
        "n": 5,
        "statement": "Écris cette fraction sous la forme d'un nombre décimal :",
        "answer": "[\"a/b\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(4)\na=[3,7,9,1,3][idx]\nb=[4,5,5,2,2][idx]"
        },
        "footer": "$$\\dfrac{${a}}{${b}}=[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Écris cette fraction sous la forme d'un pourcentage :",
        "answer": "[\"a*100/b\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(4)\na=[3,1,2,4,7][idx]\nb=[4,2,5,5,10][idx]"
        },
        "footer": "$$\\dfrac{${a}}{${b}}=[[formula]]\\%$$"
      },
      {
        "n": 7,
        "statement": "Écris ce pourcentage sous la forme d'une fraction de dénominateur 100 :",
        "answer": "[\"p\",\"100\"]",
        "options": {
          "formula_code": "setNB(1)\np=RD(5,95)"
        },
        "footer": "$$${p}\\%=[[formula_frac]]$$"
      },
      {
        "n": 8,
        "statement": "Complète pour obtenir une fraction de dénominateur 100 :",
        "answer": "[\"a*100/b\",\"100\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(4)\na=[3,1,2,4,7][idx]\nb=[5,4,5,25,20][idx]"
        },
        "footer": "$$\\dfrac{${a}}{${b}}=[[formula_frac]]$$"
      },
      {
        "n": 9,
        "statement": "Écris cette fraction décimale sous sa forme irréductible :",
        "answer": "[\"p\",\"q\"]",
        "options": {
          "formula_code": "setNB(1)\nidx=RD(4)\np=[6,3,12,25,15][idx]\nq=[5,2,5,4,2][idx]\nk=[2,5,5,5,10][idx]\nnum=p*k\nden=q*k"
        },
        "footer": "$$\\dfrac{${num}}{${den}}=\\dfrac{[[formula]]}{[[formula]]}$$"
      },
      {
        "n": 10,
        "statement": "Parmi ces écritures, lesquelles sont égales à $$${dec}$$ ?&&$$\\dfrac{${e*10+f}}{10}$$&&$$${e*10+f}\\%$$&&$$${dec*100}\\%$$&&$$\\dfrac{${dec*100}}{100}$$&&",
        "answer": "[\"1\",\"3\",\"4\"]",
        "options": {
          "formula_code": "setNB(1)\ne=RD(1,8)\nf=RD(1,9)\ndec=e+f/10"
        },
        "footer": "[[formula_qcm]]"
      }
    ]
  },
  {
    "id": "dnb_06",
    "num": 6,
    "title": "Notation scientifique",
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
        "statement": "Écris ce grand nombre en notation scientifique :",
        "answer": "[\"m\",\"3\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1000,9999)\nm=n/1000"
        },
        "footer": "$$${n}=[[formula]]\\times10^{[[formula]]}$$"
      },
      {
        "n": 2,
        "statement": "Écris ce grand nombre en notation scientifique :",
        "answer": "[\"m\",\"4\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(100,999)\nn=d*100\nm=n/10000"
        },
        "footer": "$$${n}=[[formula]]\\times10^{[[formula]]}$$"
      },
      {
        "n": 3,
        "statement": "Écris ce petit nombre en notation scientifique :",
        "answer": "[\"m\",\"0-3\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(100,999)\nn=CUT(d/100000,8)\nm=d/100"
        },
        "footer": "$$${n}=[[formula]]\\times10^{[[formula]]}$$"
      },
      {
        "n": 4,
        "statement": "Écris ce petit nombre en notation scientifique :",
        "answer": "[\"m\",\"0-2\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(11,99)\nn=CUT(d/1000,8)\nm=d/10"
        },
        "footer": "$$${n}=[[formula]]\\times10^{[[formula]]}$$"
      },
      {
        "n": 5,
        "statement": "Écris ce nombre en notation scientifique :",
        "answer": "[\"m\",\"5\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(1000,9999)\nn=d*100\nm=n/100000"
        },
        "footer": "$$${n}=[[formula]]\\times10^{[[formula]]}$$"
      },
      {
        "n": 6,
        "statement": "Écris ce petit nombre en notation scientifique :",
        "answer": "[\"m\",\"0-4\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(100,999)\nn=CUT(d/1000000,8)\nm=d/100"
        },
        "footer": "$$${n}=[[formula]]\\times10^{[[formula]]}$$"
      },
      {
        "n": 7,
        "statement": "Écris ce nombre en notation scientifique :",
        "answer": "[\"m\",\"6\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(11,99)\nn=d*100000\nm=d/10"
        },
        "footer": "$$${n}=[[formula]]\\times10^{[[formula]]}$$"
      },
      {
        "n": 8,
        "statement": "Cette notation scientifique correspond à quel nombre décimal ?",
        "answer": "[\"n\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(11,99)\nm=d/10\ne=RD(2,4)\nn=m*pow(10,e)"
        },
        "footer": "$$${m}\\times10^{${e}}=[[formula]]$$"
      },
      {
        "n": 9,
        "statement": "Quelle est l'écriture scientifique de $$${n}$$ ?&&$$${m}\\times10^{3}$$&&$$${md}\\times10^{2}$$&&$$${m}\\times10^{4}$$&&$$${mu}\\times10^{3}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(100,999)\nm=d/100\nn=d*10\nmd=m*10\nmu=CUT(m/10,8)"
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 10,
        "statement": "Le nombre $$${m}\\times10^{${e}}$$ est-il écrit en notation scientifique ?&&Oui, c'est une écriture scientifique correcte&&Non, car la partie décimale doit être comprise entre 1 et 10&&Non, car l'exposant doit être positif&&",
        "answer": "[\"2\"]",
        "options": {
          "formula_code": "setNB(1)\nd=RD(105,995)\nm=d/10\ne=RD(2,5)"
        },
        "footer": "[[formula_qcm1]]"
      }
    ]
  },
  {
    "id": "dnb_07",
    "num": 7,
    "title": "Carrés des entiers de 1 à 12",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "source_dynamique_07",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Donne le carré de ce nombre :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"150\" viewBox=\"0 0 180 150\" style=\"display:block;max-width:180px;margin:10px auto\">\n<rect x=\"55\" y=\"18\" width=\"90\" height=\"90\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M55 96h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"100\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ?</text>\n<text x=\"100\" y=\"137\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n<text x=\"34\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n</svg>",
        "answer": "[\"n*n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,12)"
        },
        "footer": "$$${n}^2=[[formula]]$$"
      },
      {
        "n": 2,
        "statement": "Donne le carré de ce nombre :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"150\" viewBox=\"0 0 180 150\" style=\"display:block;max-width:180px;margin:10px auto\">\n<rect x=\"55\" y=\"18\" width=\"90\" height=\"90\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M55 96h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"100\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ?</text>\n<text x=\"100\" y=\"137\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n<text x=\"34\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n</svg>",
        "answer": "[\"n*n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,12)"
        },
        "footer": "$$${n}^2=[[formula]]$$"
      },
      {
        "n": 3,
        "statement": "Quel est le nombre entier positif dont le carré est égal à ce résultat ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"150\" viewBox=\"0 0 180 150\" style=\"display:block;max-width:180px;margin:10px auto\">\n<rect x=\"55\" y=\"18\" width=\"90\" height=\"90\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M55 96h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"100\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ${c}</text>\n<text x=\"100\" y=\"137\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">?</text>\n</svg>",
        "answer": "[\"n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,12)\nc=n*n"
        },
        "footer": "$$[[formula]]^2=${c}$$"
      },
      {
        "n": 4,
        "statement": "Quel est le nombre entier positif dont le carré est égal à ce résultat ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"150\" viewBox=\"0 0 180 150\" style=\"display:block;max-width:180px;margin:10px auto\">\n<rect x=\"55\" y=\"18\" width=\"90\" height=\"90\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M55 96h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"100\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ${c}</text>\n<text x=\"100\" y=\"137\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">?</text>\n</svg>",
        "answer": "[\"n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,12)\nc=n*n"
        },
        "footer": "$$[[formula]]^2=${c}$$"
      },
      {
        "n": 5,
        "statement": "Complète l'égalité :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"150\" viewBox=\"0 0 180 150\" style=\"display:block;max-width:180px;margin:10px auto\">\n<rect x=\"55\" y=\"18\" width=\"90\" height=\"90\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M55 96h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"100\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ${c}</text>\n<text x=\"100\" y=\"137\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">?</text>\n<text x=\"34\" y=\"69\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">?</text>\n</svg>",
        "answer": "[\"n\",\"n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,12)\nc=n*n"
        },
        "footer": "$$${c}=[[formula]]\\times[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Quel est le carré de $$${n}$$ ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"150\" viewBox=\"0 0 180 150\" style=\"display:block;max-width:180px;margin:10px auto\">\n<rect x=\"55\" y=\"18\" width=\"90\" height=\"90\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M55 96h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"100\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ?</text>\n<text x=\"100\" y=\"137\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n<text x=\"34\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n</svg>&&$$${n*n}$$&&$$${2*n}$$&&$$${n*n+n}$$&&$$${n*n-1}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(3,12)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 7,
        "statement": "Parmi ces nombres, lesquels sont des carrés parfaits ?&&$$${a}$$&&$$${b}$$&&$$${cc}$$&&$$${e}$$&&",
        "answer": "[\"1\",\"3\"]",
        "options": {
          "formula_code": "setNB(1)\np=RD(3,9)\nq=RD(4,11,[p])\na=p*p\ncc=q*q\nb=p*p+RD(1,5)\ne=q*q-RD(1,5)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm]]"
      },
      {
        "n": 8,
        "statement": "Quel encadrement de $$${n}^2$$ est correct ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"150\" viewBox=\"0 0 180 150\" style=\"display:block;max-width:180px;margin:10px auto\">\n<rect x=\"55\" y=\"18\" width=\"90\" height=\"90\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M55 96h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"100\" y=\"69\" font-family=\"sans-serif\" font-size=\"19\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ${n}²</text>\n<text x=\"100\" y=\"137\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n<text x=\"34\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n</svg>&&$$${low}\\leq ${n}^2<${high}$$&&$$${nlow}\\leq ${n}^2<${nhigh}$$&&$$${low2}\\leq ${n}^2<${low}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(5,12)\nc=n*n\nlow=floor(c/10)*10\nhigh=low+10\nlow2=low-10\nnlow=floor(n/10)*10\nnhigh=nlow+10",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 9,
        "statement": "Calcule :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"290\" height=\"145\" viewBox=\"0 0 290 145\" style=\"display:block;max-width:290px;margin:10px auto\">\n<rect x=\"35\" y=\"18\" width=\"80\" height=\"80\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M35 86h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"75\" y=\"64\" font-family=\"sans-serif\" font-size=\"18\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ${n}²</text>\n<text x=\"75\" y=\"126\" font-family=\"sans-serif\" font-size=\"19\" text-anchor=\"middle\">${n}</text>\n<text x=\"20\" y=\"64\" font-family=\"sans-serif\" font-size=\"19\" text-anchor=\"middle\">${n}</text>\n<g display=\"${dispTerm}\"><text x=\"180\" y=\"66\" font-family=\"sans-serif\" font-size=\"25\" font-weight=\"600\" text-anchor=\"middle\">${op}${k}</text></g>\n<g display=\"${dispSecond}\">\n<text x=\"145\" y=\"66\" font-family=\"sans-serif\" font-size=\"25\" text-anchor=\"middle\">+</text>\n<rect x=\"175\" y=\"18\" width=\"80\" height=\"80\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M175 86h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"215\" y=\"64\" font-family=\"sans-serif\" font-size=\"18\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ${n}²</text>\n<text x=\"215\" y=\"126\" font-family=\"sans-serif\" font-size=\"19\" text-anchor=\"middle\">${n}</text>\n</g>\n</svg>",
        "answer": "[\"r\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(2,12)\nmode=RD(0,2)\nkmax=(n*n-1<9)?n*n-1:9\nk=RD(1,kmax)\nr=(mode===0)?n*n+k:(mode===1)?n*n-k:2*n*n\nexpr=(mode===0)?\"{n}^2+{k}\":(mode===1)?\"{n}^2-{k}\":\"2\\\\times {n}^2\"\nop=(mode===0)?\"+\":\"−\"\ndispTerm=(mode===2)?\"none\":\"inline\"\ndispSecond=(mode===2)?\"inline\":\"none\""
        },
        "footer": "$$${expr}=[[formula]]$$"
      },
      {
        "n": 10,
        "statement": "Combien vaut $$${n}^2$$ ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"150\" viewBox=\"0 0 180 150\" style=\"display:block;max-width:180px;margin:10px auto\">\n<rect x=\"55\" y=\"18\" width=\"90\" height=\"90\" rx=\"2\" fill=\"#eef6fb\" stroke=\"#315b72\" stroke-width=\"2\"/>\n<path d=\"M55 96h12v12\" fill=\"none\" stroke=\"#315b72\" stroke-width=\"1.5\"/>\n<text x=\"100\" y=\"69\" font-family=\"sans-serif\" font-size=\"19\" font-weight=\"600\" text-anchor=\"middle\" fill=\"#17384d\">A = ${n}²</text>\n<text x=\"100\" y=\"137\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n<text x=\"34\" y=\"69\" font-family=\"sans-serif\" font-size=\"20\" text-anchor=\"middle\">${n}</text>\n</svg>&&$$${n*n}$$&&$$${n*n+10}$$&&$$${n*n-10}$$&&$$${2*n}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(5,12)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      }
    ]
  },
  {
    "id": "dnb_08",
    "num": 8,
    "title": "Critères de divisibilité par 2, 3, 5, 9",
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
        "statement": "$$${2*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
        },
        "footer": "[[formula_qcm]]"
      },
      {
        "n": 2,
        "statement": "$$${3*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
        "answer": "[\"2\"]",
        "options": {
          "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
        },
        "footer": "[[formula_qcm]]"
      },
      {
        "n": 3,
        "statement": "$$${5*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
        "answer": "[\"3\"]",
        "options": {
          "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
        },
        "footer": "[[formula_qcm]]"
      },
      {
        "n": 4,
        "statement": "$$${9*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
        "answer": "[\"2\",\"4\"]",
        "options": {
          "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
        },
        "footer": "[[formula_qcm]]"
      },
      {
        "n": 5,
        "statement": "$$${10*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
        "answer": "[\"1\",\"3\"]",
        "options": {
          "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
        },
        "footer": "[[formula_qcm]]"
      },
      {
        "n": 6,
        "statement": "$$${6*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
        "answer": "[\"1\",\"2\"]",
        "options": {
          "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
        },
        "footer": "[[formula_qcm]]"
      },
      {
        "n": 7,
        "statement": "Le nombre $$${15*P}$$ est divisible par :&&par 3&&par 5&&par 9&&par 2&&",
        "answer": "[\"1\",\"2\"]",
        "options": {
          "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
        },
        "footer": "[[formula_qcm]]"
      },
      {
        "n": 8,
        "statement": "Parmi ces nombres, lesquels sont divisibles par 5 ?&&$$${a}$$&&$$${b}$$&&$$${cc}$$&&$$${e}$$&&",
        "answer": "[\"1\",\"3\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(10,99)*5\nb=RD(10,99)*10+RD(1,4)\ncc=RD(10,99)*5\ne=RD(10,99)*10+RD(6,9)"
        },
        "footer": "[[formula_qcm]]"
      },
      {
        "n": 9,
        "statement": "Pour savoir si $$${9*P}$$ est divisible par 9, on calcule la somme de ses chiffres. Cette somme est-elle divisible par 9 ?&&Oui, donc le nombre est divisible par 9&&Non, donc le nombre n'est pas divisible par 9&&On ne peut pas savoir avec ce critère&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 10,
        "statement": "<div style=\"text-align:justify\">On a $$${3*P}$$ bonbons. Peut-on les répartir équitablement (sans reste) dans 3 sachets ?</div>&&Oui&&Non&&Seulement si on en retire un&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
        },
        "footer": "[[formula_qcm1]]"
      }
    ]
  },
  {
    "id": "dnb_09",
    "num": 9,
    "title": "Double, triple, moitié, prédécesseur, successeur, carré",
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
          "formula_code": "setNB(1)\nn=RD(2,25)*2"
        },
        "footer": "<ul style=\"text-align:left\"><li>Double : [[formula]]</li><li>Triple : [[formula]]</li><li>Moitié : [[formula]]</li><li>Prédécesseur : [[formula]]</li><li>Successeur : [[formula]]</li><li>Carré : [[formula]]</li></ul>"
      },
      {
        "n": 2,
        "statement": "Calcule le double de ce nombre :",
        "answer": "[\"2*n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(5,50)"
        },
        "footer": "$$\\text{double de }${n}=[[formula]]$$"
      },
      {
        "n": 3,
        "statement": "Calcule le triple de ce nombre :",
        "answer": "[\"3*n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(5,40)"
        },
        "footer": "$$\\text{triple de }${n}=[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "Calcule la moitié de ce nombre :",
        "answer": "[\"n/2\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(5,50)*2"
        },
        "footer": "$$\\text{moitié de }${n}=[[formula]]$$"
      },
      {
        "n": 5,
        "statement": "Donne le prédécesseur de ce nombre :",
        "answer": "[\"n-1\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(10,100)"
        },
        "footer": "$$\\text{prédécesseur de }${n}=[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Donne le successeur de ce nombre :",
        "answer": "[\"n+1\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(10,100)"
        },
        "footer": "$$\\text{successeur de }${n}=[[formula]]$$"
      },
      {
        "n": 7,
        "statement": "Calcule le carré de ce nombre :",
        "answer": "[\"n*n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(2,12)"
        },
        "footer": "$$\\text{carré de }${n}=[[formula]]$$"
      },
      {
        "n": 8,
        "statement": "Quelle expression représente le double du nombre $$n$$ ?&&$$2n$$&&$$n+2$$&&$$n^2$$&&$$\\dfrac{n}{2}$$&&",
        "answer": "[\"1\"]",
        "options": null,
        "footer": "[[qcm1]]"
      },
      {
        "n": 9,
        "statement": "Le double d'un nombre vaut $$${c}$$. Quel est ce nombre ?",
        "answer": "[\"c/2\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(5,50)\nc=2*n"
        },
        "footer": "[[formula]]"
      },
      {
        "n": 10,
        "statement": "<div style=\"text-align:justify\">Marie a $$${n}$$ billes. Paul en a le triple. Combien de billes Paul a-t-il ?</div>",
        "answer": "[\"3*n\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(4,30)"
        },
        "footer": "$$[[formula]]\\text{ billes}$$"
      }
    ]
  },
  {
    "id": "dnb_10",
    "num": 10,
    "title": "Simplifier des expressions littérales",
    "level_tags": [
      "4e",
      "3e",
      "DNB"
    ],
    "source": "moteur_mathsgo_reduction_v2",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Réduis l’expression :",
        "answer": "[]",
        "options": {
          "reduction_kind": "one_no_cancel"
        },
        "footer": ""
      },
      {
        "n": 2,
        "statement": "Réduis l’expression :",
        "answer": "[]",
        "options": {
          "reduction_kind": "one_cancel"
        },
        "footer": ""
      },
      {
        "n": 3,
        "statement": "Réduis l’expression :",
        "answer": "[]",
        "options": {
          "reduction_kind": "multi_no_cancel"
        },
        "footer": ""
      },
      {
        "n": 4,
        "statement": "Réduis l’expression :",
        "answer": "[]",
        "options": {
          "reduction_kind": "multi_cancel"
        },
        "footer": ""
      },
      {
        "n": 5,
        "statement": "Écris l’expression réduite représentée par ces tuiles :",
        "answer": "[]",
        "options": {
          "reduction_kind": "read_tiles"
        },
        "footer": ""
      }
    ]
  },
  {
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
      }
    ]
  },
  {
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
  },
  {
    "id": "dnb_13",
    "num": 13,
    "title": "Résoudre des équations ax=c, x+b=c, ax+b=c",
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
        "statement": "Résous cette équation :",
        "answer": "[\"x0\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,9)\nx0=RD(2,9)\nc=a*x0"
        },
        "footer": "$$\\begin{aligned}\n${a}x &= ${c} \\\\\nx &= [[formula]]\n\\end{aligned}$$"
      },
      {
        "n": 2,
        "statement": "Résous cette équation :",
        "answer": "[\"x0\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,9)\nx0=RD(-9,-2)\nc=a*x0"
        },
        "footer": "$$\\begin{aligned}\n${a}x &= ${c} \\\\\nx &= [[formula]]\n\\end{aligned}$$"
      },
      {
        "n": 3,
        "statement": "Résous cette équation :",
        "answer": "[\"x0\"]",
        "options": {
          "formula_code": "setNB(1)\nb=RD(2,9)\nx0=RD(2,15)\nc=x0+b"
        },
        "footer": "$$\\begin{aligned}\nx+${b} &= ${c} \\\\\nx &= [[formula]]\n\\end{aligned}$$"
      },
      {
        "n": 4,
        "statement": "Résous cette équation :",
        "answer": "[\"x0\"]",
        "options": {
          "formula_code": "setNB(1)\nb=RD(-9,-2)\nx0=RD(-5,9,[0])\nc=x0+b\nsb=\"({b})\""
        },
        "footer": "$$\\begin{aligned}\nx+${sb} &= ${c} \\\\\nx &= [[formula]]\n\\end{aligned}$$"
      },
      {
        "n": 5,
        "statement": "Résous cette équation :",
        "answer": "[\"x0\"]",
        "options": {
          "formula_code": "setNB(1)\nb=RD(2,9)\nx0=RD(-5,9,[0])\nc=x0-b"
        },
        "footer": "$$\\begin{aligned}\nx-${b} &= ${c} \\\\\nx &= [[formula]]\n\\end{aligned}$$"
      },
      {
        "n": 6,
        "statement": "Résous cette équation :",
        "answer": "[\"x0\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,6)\nb=RD(2,9)\nx0=RD(2,9)\nc=a*x0+b"
        },
        "footer": "$$\\begin{aligned}\n${a}x+${b} &= ${c} \\\\\nx &= [[formula]]\n\\end{aligned}$$"
      },
      {
        "n": 7,
        "statement": "Résous cette équation :",
        "answer": "[\"x0\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,6)\nb=RD(-9,-2)\nx0=RD(2,9)\nc=a*x0+b\nsb=\"({b})\""
        },
        "footer": "$$\\begin{aligned}\n${a}x+${sb} &= ${c} \\\\\nx &= [[formula]]\n\\end{aligned}$$"
      },
      {
        "n": 8,
        "statement": "Quelle est la solution de l'équation $$${a}x=${c}$$ ?&&$$x=${x0}$$&&$$x=${cma}$$&&$$x=${cpa}$$&&$$x=${aoc}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,6)\nx0=RD(3,9)\nc=a*x0\ncma=c-a\ncpa=c+a\naoc=CUT(a/c,4)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 9,
        "statement": "Pour résoudre $$${a}x+${b}=${c}$$, par quelle opération doit-on commencer ?&&Soustraire $$${b}$$ aux deux membres&&Diviser par $$${a}$$ les deux membres&&Ajouter $$${b}$$ aux deux membres&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,6)\nb=RD(2,9)\nx0=RD(2,9)\nc=a*x0+b",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 10,
        "statement": "<div style=\"text-align:justify\">Un taxi facture $$${b}$$ € de prise en charge, puis $$${a}$$ € par kilomètre. La course a coûté $$${c}$$ €. Combien de kilomètres ont été parcourus ?</div>",
        "answer": "[\"x0\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,4)\nb=RD(3,8)\nx0=RD(3,12)\nc=a*x0+b"
        },
        "footer": "$$[[formula]]\\text{ km}$$"
      }
    ]
  },
  {
    "id": "dnb_14",
    "num": 14,
    "title": "Lecture sur une droite graduée",
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
        "statement": "Lis l'abscisse du point A :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"292\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">0</text>\n<text x=\"350\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">1</text>\n<circle cx=\"${cx}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">A</text>\n</svg>",
        "answer": "[\"val\"]",
        "options": {
          "formula_code": "setNB(1)\ni=RD(0,9,[4,5])\nval=i-4\ncx=60+i*58"
        },
        "footer": "$$x_A=[[formula]]$$"
      },
      {
        "n": 2,
        "statement": "Lis l'abscisse du point A :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"350\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">0</text>\n<text x=\"408\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">1</text>\n<circle cx=\"${cx}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">A</text>\n</svg>",
        "answer": "[\"val\"]",
        "options": {
          "formula_code": "setNB(1)\ni=RD(0,9,[5,6])\nval=i-5\ncx=60+i*58"
        },
        "footer": "$$x_A=[[formula]]$$"
      },
      {
        "n": 3,
        "statement": "Lis l'abscisse du point A :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"234\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">-1</text>\n<text x=\"292\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">0</text>\n<circle cx=\"${cx}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">A</text>\n</svg>",
        "answer": "[\"val\"]",
        "options": {
          "formula_code": "setNB(1)\ni=RD(0,9,[3,4])\nval=i-4\ncx=60+i*58"
        },
        "footer": "$$x_A=[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "Lis l'abscisse du point A :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"60\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">-5</text>\n<text x=\"350\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">0</text>\n<circle cx=\"${cx}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">A</text>\n</svg>",
        "answer": "[\"val\"]",
        "options": {
          "formula_code": "setNB(1)\ni=RD(0,9,[5])\nval=i-5\ncx=60+i*58"
        },
        "footer": "$$x_A=[[formula]]$$"
      },
      {
        "n": 5,
        "statement": "Lis l'abscisse du point A :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"292\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">0</text>\n<text x=\"408\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">1</text>\n<circle cx=\"${cx}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">A</text>\n</svg>",
        "answer": "[\"val\"]",
        "options": {
          "formula_code": "setNB(1)\ni=RD(0,9,[4,6])\nval=CUT((i-4)*0.5,1)\ncx=60+i*58"
        },
        "footer": "$$x_A=[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Lis l'abscisse du point A :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"118\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">-1</text>\n<text x=\"350\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">0</text>\n<circle cx=\"${cx}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">A</text>\n</svg>",
        "answer": "[\"val\"]",
        "options": {
          "formula_code": "setNB(1)\ni=RD(0,9,[5])\nval=CUT((i-5)*0.25,2)\ncx=60+i*58"
        },
        "footer": "$$x_A=[[formula]]$$"
      },
      {
        "n": 7,
        "statement": "Lis l'abscisse du point A :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"60\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">-10</text>\n<text x=\"350\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">0</text>\n<circle cx=\"${cx}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">A</text>\n</svg>",
        "answer": "[\"val\"]",
        "options": {
          "formula_code": "setNB(1)\ni=RD(0,9,[5])\nval=(i-5)*2\ncx=60+i*58"
        },
        "footer": "$$x_A=[[formula]]$$"
      },
      {
        "n": 8,
        "statement": "Lis les abscisses des points A et B :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"292\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">0</text>\n<text x=\"350\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">1</text>\n<circle cx=\"${cxA}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cxA}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">A</text>\n<circle cx=\"${cxB}\" cy=\"60\" r=\"6\" fill=\"#2471a3\"/>\n<text x=\"${cxB}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#2471a3\">B</text>\n</svg>",
        "answer": "[\"va\",\"vb\"]",
        "options": {
          "formula_code": "setNB(1)\nia=RD(0,3)\nib=RD(5,9)\nva=ia-4\nvb=ib-4\ncxA=60+ia*58\ncxB=60+ib*58"
        },
        "footer": "$$x_A=[[formula]] \\qquad x_B=[[formula]]$$"
      },
      {
        "n": 9,
        "statement": "Lis l'abscisse du point A :\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"234\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">-2</text>\n<text x=\"292\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">-1</text>\n<circle cx=\"${cx}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">A</text>\n</svg>",
        "answer": "[\"val\"]",
        "options": {
          "formula_code": "setNB(1)\ni=RD(0,4,[3,4])\nval=i-5\ncx=60+i*58"
        },
        "footer": "$$x_A=[[formula]]$$"
      },
      {
        "n": 10,
        "statement": "Quelle est l'abscisse du point C ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"680\" height=\"auto\" viewBox=\"0 0 680 120\" style=\"max-width:500px\">\n<line x1=\"40\" y1=\"60\" x2=\"640\" y2=\"60\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<polygon points=\"640,60 630,55 630,65\" fill=\"#222\"/>\n<line x1=\"60\" y1=\"52\" x2=\"60\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"118\" y1=\"52\" x2=\"118\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"176\" y1=\"52\" x2=\"176\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"234\" y1=\"52\" x2=\"234\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"292\" y1=\"52\" x2=\"292\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"350\" y1=\"52\" x2=\"350\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"408\" y1=\"52\" x2=\"408\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"466\" y1=\"52\" x2=\"466\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"524\" y1=\"52\" x2=\"524\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"582\" y1=\"52\" x2=\"582\" y2=\"68\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<text x=\"350\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">0</text>\n<text x=\"408\" y=\"92\" font-family=\"sans-serif\" font-size=\"22\" text-anchor=\"middle\">1</text>\n<circle cx=\"${cx}\" cy=\"60\" r=\"6\" fill=\"#c0392b\"/>\n<text x=\"${cx}\" y=\"36\" font-family=\"serif\" font-style=\"italic\" font-size=\"24\" text-anchor=\"middle\" fill=\"#c0392b\">C</text>\n</svg>&&$$${val}$$&&$$${opp}$$&&$$${d3}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\ni=RD(0,4)\nval=i-5\ncx=60+i*58\nopp=5-i\nd3=i-6",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      }
    ]
  }
];
