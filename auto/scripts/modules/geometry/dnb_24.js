const MODULE_DNB_24 = {
  "id": "dnb_24",
  "num": 24,
  "title": "Théorème de Pythagore : égalité et situations",
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
      "statement": "Le triangle représenté permet-il d'appliquer directement le théorème de Pythagore ?<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"auto\" viewBox=\"0 0 260 170\"><polygon points=\"60,125 60,45 205,125\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><polyline points=\"60,105 80,105 80,125\" fill=\"none\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"46\" y=\"138\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"45\" y=\"42\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"212\" y=\"138\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text></svg></div>&&Oui, car un angle droit est indiqué&&Non, car aucune longueur n'est donnée&&Non, car le triangle n'est pas rectangle&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 2,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"auto\" viewBox=\"0 0 260 170\"><polygon points=\"55,130 110,40 210,115\" fill=\"#fff8e8\" stroke=\"#b36b00\" stroke-width=\"2\"/><text x=\"40\" y=\"145\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"104\" y=\"34\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"218\" y=\"122\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text></svg></div>Sur cette figure, peut-on appliquer directement le théorème de Pythagore ?&&Oui, toujours dans n'importe quel triangle&&Non, il faut savoir que le triangle est rectangle&&Oui, si le triangle semble presque rectangle&&",
      "answer": "[\"2\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 3,
      "statement": "Le triangle $$ABC$$ est rectangle en $$B$$. Quelle égalité de Pythagore est correcte ?&&$$AB^2=AC^2+BC^2$$&&$$AC^2=AB^2+BC^2$$&&$$BC^2=AB^2+AC^2$$&&",
      "answer": "[\"2\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 4,
      "statement": "Le triangle $$RST$$ est rectangle en $$T$$. Quelle est l'hypoténuse ?&&Le côté $$[RS]$$&&Le côté $$[RT]$$&&Le côté $$[ST]$$&&On ne peut pas savoir&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 5,
      "statement": "Dans un triangle rectangle, les côtés de l'angle droit mesurent ${a} cm et ${b} cm. On appelle $$h$$ l'hypoténuse. Calcule $$h^2$$.",
      "answer": "[\"a*a+b*b\"]",
      "options": {
        "formula_code": "a=RD(3,12)\nb=RD(4,15)"
      },
      "footer": "$$h^2=[[formula]]$$"
    },
    {
      "n": 6,
      "statement": "Dans un triangle rectangle, les deux côtés de l'angle droit mesurent ${a} cm et ${b} cm. Calcule la longueur de l'hypoténuse.",
      "answer": "[\"c\"]",
      "options": {
        "formula_code": "k=RD(0,4)\na=[3,5,6,8,7][k]\nb=[4,12,8,15,24][k]\nc=[5,13,10,17,25][k]"
      },
      "footer": "$$[[formula]]\\text{ cm}$$"
    },
    {
      "n": 7,
      "statement": "Dans un triangle rectangle, l'hypoténuse mesure ${c} cm et un côté de l'angle droit mesure ${a} cm. Calcule la longueur de l'autre côté de l'angle droit.",
      "answer": "[\"b\"]",
      "options": {
        "formula_code": "k=RD(0,4)\na=[3,5,6,8,7][k]\nb=[4,12,8,15,24][k]\nc=[5,13,10,17,25][k]"
      },
      "footer": "$$[[formula]]\\text{ cm}$$"
    },
    {
      "n": 8,
      "statement": "Un triangle a pour côtés ${a} cm, ${b} cm et ${c} cm. On vérifie que $$${c}^2=${a}^2+${b}^2$$. Quelle conclusion est correcte ?&&Le triangle est rectangle&&Le triangle est équilatéral&&Le triangle n'existe pas&&On ne peut rien conclure&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "k=RD(0,4)\na=[3,5,6,8,7][k]\nb=[4,12,8,15,24][k]\nc=[5,13,10,17,25][k]",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 9,
      "statement": "Un triangle a pour côtés ${a} cm, ${b} cm et ${c} cm. On calcule : $$${a}^2+${b}^2=${s}$$ et $$${c}^2=${t}$$. Peut-on conclure qu'il est rectangle ?&&Oui, car les trois longueurs sont connues&&Non, car l'égalité de Pythagore n'est pas vérifiée&&Oui, car le plus grand côté est ${c} cm&&Non, car on ne peut jamais utiliser la réciproque&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "a=RD(3,8)\nb=RD(4,10)\nc=a+b-1\ns=a*a+b*b\nt=c*c",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 10,
      "statement": "Dans un triangle rectangle, on dit que l'hypoténuse mesure ${h} cm et qu'un autre côté mesure ${c} cm. Que faut-il penser de ces données ?&&C'est impossible : l'hypoténuse doit être le plus grand côté&&C'est toujours possible&&Il suffit d'additionner les deux longueurs&&Le théorème de Pythagore ne concerne pas les longueurs&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "h=RD(4,9)\nc=h+RD(1,4)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    }
  ]
};
