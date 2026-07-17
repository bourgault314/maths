const MODULE_DNB_17 = {
  "id": "dnb_17",
  "num": 17,
  "title": "Angles : reconnaître, nommer et mesurer",
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
      "statement": "Quelle est la nature de cet angle ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 260\" style=\"max-width:340px\">\n<line x1=\"120\" y1=\"200\" x2=\"260\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"120\" y1=\"200\" x2=\"${ex}\" y2=\"${ey}\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<path d=\"M 155,200 A 35,35 0 0 0 ${ax},${ay}\" fill=\"none\" stroke=\"#c0392b\" stroke-width=\"2\"/>\n<circle cx=\"120\" cy=\"200\" r=\"3\" fill=\"#222\"/>\n<text x=\"105\" y=\"218\" font-family=\"serif\" font-style=\"italic\" font-size=\"18\">O</text>\n</svg>&&Un angle aigu&&Un angle obtus&&Un angle droit&&Un angle plat&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nang=RD(20,80)\nrad=ang*pi/180\nex=floor(120+140*cos(rad)+0.5)\ney=floor(200-140*sin(rad)+0.5)\nax=floor(120+35*cos(rad)+0.5)\nay=floor(200-35*sin(rad)+0.5)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 2,
      "statement": "Quelle est la nature de cet angle ?\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 260\" style=\"max-width:340px\">\n<line x1=\"120\" y1=\"200\" x2=\"260\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"120\" y1=\"200\" x2=\"${ex}\" y2=\"${ey}\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<path d=\"M 155,200 A 35,35 0 0 0 ${ax},${ay}\" fill=\"none\" stroke=\"#c0392b\" stroke-width=\"2\"/>\n<circle cx=\"120\" cy=\"200\" r=\"3\" fill=\"#222\"/>\n<text x=\"105\" y=\"218\" font-family=\"serif\" font-style=\"italic\" font-size=\"18\">O</text>\n</svg>&&Un angle obtus&&Un angle aigu&&Un angle droit&&Un angle nul&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nang=RD(100,160)\nrad=ang*pi/180\nex=floor(120+140*cos(rad)+0.5)\ney=floor(200-140*sin(rad)+0.5)\nax=floor(120+35*cos(rad)+0.5)\nay=floor(200-35*sin(rad)+0.5)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 3,
      "statement": "Combien mesure un angle droit ?",
      "answer": "[\"90\"]",
      "options": null,
      "footer": "$$[[int]]°$$"
    },
    {
      "n": 4,
      "statement": "Combien mesure un angle plat ?",
      "answer": "[\"180\"]",
      "options": null,
      "footer": "$$[[int]]°$$"
    },
    {
      "n": 5,
      "statement": "Les angles 1 et 2 (formés par deux droites sécantes) sont…\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 260\" style=\"max-width:340px\">\n<line x1=\"278.8\" y1=\"79.3\" x2=\"61.2\" y2=\"180.7\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"129.0\" y1=\"17.2\" x2=\"211.0\" y2=\"242.8\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<circle cx=\"170\" cy=\"130\" r=\"3\" fill=\"#222\"/>\n<text x=\"174\" y=\"48\" font-family=\"sans-serif\" font-size=\"18\" fill=\"#c0392b\">1</text>\n<text x=\"151\" y=\"212\" font-family=\"sans-serif\" font-size=\"18\" fill=\"#2471a3\">2</text>\n</svg>&&opposés par le sommet&&adjacents&&complémentaires&&supplémentaires&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 6,
      "statement": "Les angles 1 et 2 ont le même sommet et un côté commun. Ils sont…\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 260\" style=\"max-width:340px\">\n<line x1=\"120\" y1=\"200\" x2=\"260.0\" y2=\"200.0\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"120\" y1=\"200\" x2=\"200.3\" y2=\"85.3\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<line x1=\"120\" y1=\"200\" x2=\"72.1\" y2=\"68.4\" stroke=\"#222\" stroke-width=\"1.5\"/>\n<circle cx=\"120\" cy=\"200\" r=\"3\" fill=\"#222\"/>\n<text x=\"191\" y=\"164\" font-family=\"sans-serif\" font-size=\"16\" fill=\"#c0392b\">1</text>\n<text x=\"131\" y=\"121\" font-family=\"sans-serif\" font-size=\"16\" fill=\"#2471a3\">2</text>\n</svg>&&adjacents&&opposés par le sommet&&alternes-internes&&complémentaires&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 7,
      "statement": "Deux angles dont supplémentaires. Si l'un mesure $$${a}°$$, combien mesure l'autre ?",
      "answer": "[\"180-a\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(30,150)"
      },
      "footer": "$$[[formula]]°$$"
    },
    {
      "n": 8,
      "statement": "Deux angles sont complémentaires. Si l'un mesure $$${a}°$$, combien mesure l'autre ?",
      "answer": "[\"90-a\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(10,80)"
      },
      "footer": "$$[[formula]]°$$"
    },
    {
      "n": 9,
      "statement": "Un angle qui mesure $$${a}°$$ est…&&un angle aigu&&un angle obtus&&un angle droit&&un angle plat&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(10,85)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 10,
      "statement": "Les angles $$\\widehat{AOB}$$ et $$\\widehat{BOC}$$ sont adjacents et forment un angle plat. Si $$\\widehat{AOB}=${a}°$$, combien mesure $$\\widehat{BOC}$$ ?",
      "answer": "[\"180-a\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(30,150)"
      },
      "footer": "$$\\widehat{BOC}=[[formula]]°$$"
    }
  ]
};
