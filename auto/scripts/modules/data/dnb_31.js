const MODULE_DNB_31 = {
  "id": "dnb_31",
  "num": 31,
  "title": "Médiane et étendue",
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
      "statement": "Détermine la médiane de la série suivante :<div class=\"median-list\"><span class=\"median-value\">$$${c}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${a}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${b}$$</span></div>",
      "answer": "[\"b\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(2,8)\nb=a+RD(1,5)\nc=b+RD(1,5)"
      },
      "footer": "$$\\text{médiane}=[[formula]]$$"
    },
    {
      "n": 2,
      "statement": "Détermine la médiane de la série suivante :<div class=\"median-list\"><span class=\"median-value\">$$${e}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${a}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${d}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${b}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${c}$$</span></div>",
      "answer": "[\"c\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(1,6)\nb=a+RD(1,3)\nc=b+RD(1,3)\nd=c+RD(1,3)\ne=d+RD(1,3)"
      },
      "footer": "$$\\text{médiane}=[[formula]]$$"
    },
    {
      "n": 3,
      "statement": "Détermine la médiane de la série suivante :<div class=\"median-list\"><span class=\"median-value\">$$${d}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${a}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${c}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${b}$$</span></div>",
      "answer": "[\"m\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(1,8)\nb=a+RD(1,4)\nc=b+RD(1,4)\nd=c+RD(1,4)\nm=(b+c)/2"
      },
      "footer": "$$\\text{médiane}=[[formula]]$$"
    },
    {
      "n": 4,
      "statement": "La série suivante est déjà rangée dans l’ordre croissant :<div class=\"median-list\"><span class=\"median-value\">$$${a}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${b}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${c}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${d}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${e}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${f}$$</span></div>Détermine sa médiane.",
      "answer": "[\"m\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(1,4)\nb=a+RD(1,3)\nc=b+RD(1,3)\nd=c+RD(1,3)\ne=d+RD(1,3)\nf=e+RD(1,3)\nm=(c+d)/2"
      },
      "footer": "$$\\text{médiane}=[[formula]]$$"
    },
    {
      "n": 5,
      "statement": "Pour déterminer la médiane d’une série, quelle méthode est correcte ?&&Ranger les valeurs dans l’ordre croissant puis chercher la valeur centrale.&&Additionner toutes les valeurs puis diviser par leur nombre.&&Prendre la valeur qui apparaît le plus souvent.&&Prendre la plus grande valeur de la série.&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 6,
      "statement": "Voici les températures relevées pendant une semaine :<br><div class=\"median-table-wrap\"><table class=\"median-table\"><tr><td>jour</td><td>lun.</td><td>mar.</td><td>mer.</td><td>jeu.</td><td>ven.</td><td>sam.</td><td>dim.</td></tr><tr><td>température</td><td>$$${v4}$$</td><td>$$${v1}$$</td><td>$$${v7}$$</td><td>$$${v3}$$</td><td>$$${v5}$$</td><td>$$${v2}$$</td><td>$$${v6}$$</td></tr></table></div><br>Détermine la température médiane.",
      "answer": "[\"v4\"]",
      "options": {
        "formula_code": "setNB(1)\nv1=RD(18,22)\nv2=v1+RD(1,2)\nv3=v2+RD(1,2)\nv4=v3+RD(1,2)\nv5=v4+RD(1,2)\nv6=v5+RD(1,2)\nv7=v6+RD(1,2)"
      },
      "footer": "$$\\text{médiane}=[[formula]]\\,°\\text{C}$$"
    },
    {
      "n": 7,
      "statement": "Voici les notes obtenues par un petit groupe d’élèves :<br><div class=\"median-table-wrap\"><table class=\"median-table\"><tr><td>élève</td><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td></tr><tr><td>note</td><td>$$${b}$$</td><td>$$${e}$$</td><td>$$${a}$$</td><td>$$${d}$$</td><td>$$${c}$$</td></tr></table></div><br>Détermine la note médiane.",
      "answer": "[\"c\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(4,8)\nb=a+RD(1,3)\nc=b+RD(1,3)\nd=c+RD(1,3)\ne=d+RD(1,3)"
      },
      "footer": "$$\\text{médiane}=[[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Un élève affirme : « La médiane de la série $$${a} ; ${b} ; ${c} ; ${d} ; ${e}$$ est forcément $$${c}$$ car cette valeur est au milieu de l’écriture. »<br>Cette affirmation est-elle correcte ?&&Oui, car $$${c}$$ est écrit au milieu.&&Non, il faut d’abord ranger les valeurs dans l’ordre croissant.&&Oui, car il y a cinq valeurs.&&Non, la médiane est toujours la moyenne des valeurs.&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(2,5)\nb=a+RD(1,3)\nc=b+RD(4,6)\nd=b+RD(1,2)\ne=d+RD(1,2)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 9,
      "statement": "Détermine la médiane de la série suivante, qui contient des valeurs répétées :<div class=\"median-list\"><span class=\"median-value\">$$${a}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${m}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${b}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${m}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${c}$$</span></div>",
      "answer": "[\"m\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(1,5)\nm=a+RD(1,4)\nb=a\nc=m+RD(1,4)"
      },
      "footer": "$$\\text{médiane}=[[formula]]$$"
    },
    {
      "n": 10,
      "statement": "La série suivante est déjà rangée dans l’ordre croissant :<div class=\"median-list\"><span class=\"median-value\">$$${a}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${b}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${c}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${d}$$</span></div>Quelle est sa médiane ?",
      "answer": "[\"m\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(1,6)\nb=a+RD(1,4)\nc=b+RD(1,4)\nd=c+RD(1,4)\nm=(b+c)/2"
      },
      "footer": "$$\\text{médiane}=[[formula]]$$"
    },
    {
      "n": 11,
      "statement": "Calcule l’étendue de la série suivante :<div class=\"median-list\"><span class=\"median-value\">$$${e}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${b}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${a}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${f}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${c}$$</span><span class=\"median-separator\">;</span><span class=\"median-value\">$$${d}$$</span></div>",
      "answer": "[\"etendue\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(1,6)\nb=a+RD(1,4)\nc=b+RD(1,4)\nd=c+RD(1,4)\ne=d+RD(1,4)\nf=e+RD(1,4)\netendue=f-a"
      },
      "footer": "$$\\text{étendue}=[[formula]]$$"
    },
    {
      "n": 12,
      "statement": "Voici cinq distances relevées :<div class=\"median-table-wrap\"><table class=\"median-table\"><tr><td>mesure</td><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td></tr><tr><td>distance (m)</td><td>$$${c}$$</td><td>$$${a}$$</td><td>$$${e}$$</td><td>$$${b}$$</td><td>$$${d}$$</td></tr></table></div>Calcule l’étendue de ces distances.",
      "answer": "[\"etendue\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(5,10)\nb=a+RD(1,3)\nc=b+RD(1,3)\nd=c+RD(1,3)\ne=d+RD(1,3)\netendue=e-a"
      },
      "footer": "$$\\text{étendue}=[[formula]]\\,\\text{m}$$"
    }
  ]
};
