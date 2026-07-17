const MODULE_DNB_30 = {
  "id": "dnb_30",
  "num": 30,
  "title": "Moyennes",
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
      "statement": "On considère les trois valeurs : $$${a}$$, $$${b}$$ et $$${c}$$.<br>Exprime leur moyenne sous forme de fraction.",
      "answer": "[\"s/g\",\"3/g\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(2,18)\nb=RD(2,18)\nc=RD(2,18)\ns=a+b+c\ng=GCD(s,3)"
      },
      "footer": "$$\\text{moyenne}=[[formula_frac]]$$"
    },
    {
      "n": 2,
      "statement": "Calcule la moyenne des quatre valeurs suivantes :<br><div style=\"text-align:center;font-size:22px\">$$${a} \\quad ; \\quad ${b} \\quad ; \\quad ${c} \\quad ; \\quad ${d}$$</div>",
      "answer": "[\"m\"]",
      "options": {
        "formula_code": "setNB(1)\nm=RD(6,18)\nd1=RD(1,4)\nd2=RD(1,4)\na=m-d1\nb=m+d1\nc=m-d2\nd=m+d2"
      },
      "footer": "$$\\text{moyenne}=[[formula]]$$"
    },
    {
      "n": 3,
      "statement": "Voici les notes obtenues à une évaluation :<div class=\"legacy-statement-table-wrap legacy-table-dnb_30-3-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_30-3\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">note</td><td style=\"border:1px solid #555;padding:8px 18px\">8</td><td style=\"border:1px solid #555;padding:8px 18px\">12</td><td style=\"border:1px solid #555;padding:8px 18px\">16</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e3}$$</td></tr></table></div>Calcule la moyenne des notes. Arrondis au dixième si nécessaire.",
      "answer": "[\"CUT((8*e1+12*e2+16*e3)/(e1+e2+e3),1)\"]",
      "options": {
        "formula_code": "setNB(1)\ne1=RD(2,8)\ne2=RD(2,8)\ne3=RD(2,8)"
      },
      "footer": "$$\\text{moyenne}=[[formula]]$$"
    },
    {
      "n": 4,
      "statement": "Quelle formule permet de calculer la moyenne d’une série de valeurs ?&&$$\\text{moyenne}=\\dfrac{\\text{somme des valeurs}}{\\text{nombre de valeurs}}$$&&$$\\text{moyenne}=\\dfrac{\\text{nombre de valeurs}}{\\text{somme des valeurs}}$$&&$$\\text{moyenne}=\\text{plus grande valeur}-\\text{plus petite valeur}$$&&$$\\text{moyenne}=\\text{somme des valeurs}+\\text{nombre de valeurs}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 5,
      "statement": "La moyenne des quatre nombres $$${a}$$, $$${b}$$, $$${c}$$ et $$x$$ est $$${m}$$.<br>Calcule la valeur de $$x$$.",
      "answer": "[\"x\"]",
      "options": {
        "formula_code": "setNB(1)\nm=RD(8,18)\nd1=RD(1,4)\nd2=RD(1,4)\na=m+d1\nb=m-d1\nc=m+d2\nx=m-d2"
      },
      "footer": "$$x=[[formula]]$$"
    },
    {
      "n": 6,
      "statement": "Une série de $$${n}$$ valeurs a pour somme $$${s}$$.<br>Exprime sa moyenne.",
      "answer": "[\"m\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(3,9)\nm=RD(4,20)\ns=n*m"
      },
      "footer": "$$\\text{moyenne}=[[formula]]$$"
    },
    {
      "n": 7,
      "statement": "La moyenne de $$${n}$$ valeurs est $$${m}$$.<br>Quelle est la somme de ces $$${n}$$ valeurs ?",
      "answer": "[\"n*m\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(3,10)\nm=RD(5,18)"
      },
      "footer": "$$\\text{somme}=[[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Toutes les valeurs d’une série sont comprises entre $$${mini}$$ et $$${maxi}$$.<br>La moyenne de cette série peut-elle être égale à $$${val}$$ ?&&Oui&&Non&&On ne peut pas savoir&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "setNB(1)\nmini=RD(2,8)\nmaxi=mini+RD(4,8)\nval=maxi+RD(1,4)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 9,
      "statement": "On a demandé à des familles le nombre d’enfants qu’elles ont. Les résultats sont donnés dans le tableau :<div class=\"legacy-statement-table-wrap legacy-table-dnb_30-9-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_30-9\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">nombre d’enfants</td><td style=\"border:1px solid #555;padding:8px 18px\">0</td><td style=\"border:1px solid #555;padding:8px 18px\">1</td><td style=\"border:1px solid #555;padding:8px 18px\">2</td><td style=\"border:1px solid #555;padding:8px 18px\">3</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e0}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e3}$$</td></tr></table></div>Calcule le nombre moyen d’enfants par famille. Donne une valeur approchée à 0,01 près par défaut ou par excès.",
      "answer": "[\"r1;r2\"]",
      "options": {
        "formula_code": "setNB(1)\ne0=RD(1,8)\ne1=RD(1,8)\ne2=RD(1,8)\ne3=RD(1,8)\nr=(e1+2*e2+3*e3)/(e0+e1+e2+e3)\nr1=floor(r*100)/100\nr2=ceil(r*100)/100"
      },
      "footer": "$$\\text{moyenne}=[[formula]]$$"
    },
    {
      "n": 10,
      "statement": "Deux longueurs mesurent $$${x}\\text{ cm}$$ et $$${y}\\text{ cm}$$.<br>Calcule leur moyenne. Arrondis au centième si nécessaire.",
      "answer": "[\"CUT((x+y)/2,2)\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(20,80)\nb=RD(20,80)\nx=a/10\ny=b/10"
      },
      "footer": "$$\\text{moyenne}=[[formula]]\\text{ cm}$$"
    }
  ]
};
