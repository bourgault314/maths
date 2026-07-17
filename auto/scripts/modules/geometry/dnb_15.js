const MODULE_DNB_15 = {
  "id": "dnb_15",
  "num": 15,
  "title": "Lire des coordonnées dans un repère",
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
      "statement": "Lis les coordonnées du point M :\n" + coordinatePlaneSvg({"points":[{"x":"${cx}","y":"${cy}","label":"M"}]}),
      "answer": "[\"x\",\"y\"]",
      "options": {
        "formula_code": "setNB(1)\nx=RD(1,3)\ny=RD(1,3)\ncx=200+x*40\ncy=200-y*40"
      },
      "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
    },
    {
      "n": 2,
      "statement": "Lis les coordonnées du point M :\n" + coordinatePlaneSvg({"points":[{"x":"${cx}","y":"${cy}","label":"M"}]}),
      "answer": "[\"x\",\"y\"]",
      "options": {
        "formula_code": "setNB(1)\nx=RD(-3,-1)\ny=RD(1,3)\ncx=200+x*40\ncy=200-y*40"
      },
      "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
    },
    {
      "n": 3,
      "statement": "Lis les coordonnées du point M (il est sur un axe) :\n" + coordinatePlaneSvg({"points":[{"x":"${cx}","y":"${cy}","label":"M"}]}),
      "answer": "[\"x\",\"y\"]",
      "options": {
        "formula_code": "setNB(1)\nx=RD(-3,3,[0])\ny=0\ncx=200+x*40\ncy=200-y*40"
      },
      "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
    },
    {
      "n": 4,
      "statement": "Lis les coordonnées du point M :\n" + coordinatePlaneSvg({"points":[{"x":"${cx}","y":"${cy}","label":"M"}]}),
      "answer": "[\"x\",\"y\"]",
      "options": {
        "formula_code": "setNB(1)\nx=RD(-3,-1)\ny=RD(-3,-1)\ncx=200+x*40\ncy=200-y*40"
      },
      "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
    },
    {
      "n": 5,
      "statement": "Lis les coordonnées des points M et N :\n" + coordinatePlaneSvg({"points":[{"x":"${cxM}","y":"${cyM}","label":"M"},{"x":"${cxN}","y":"${cyN}","label":"N","color":"#2471a3"}]}),
      "answer": "[\"xM\",\"yM\",\"xN\",\"yN\"]",
      "options": {
        "formula_code": "setNB(1)\nxM=RD(-3,-1)\nyM=RD(1,3)\nxN=RD(1,3)\nyN=RD(-3,-1)\ncxM=200+xM*40\ncyM=200-yM*40\ncxN=200+xN*40\ncyN=200-yN*40"
      },
      "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,) \\qquad N(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
    },
    {
      "n": 6,
      "statement": "Lis les coordonnées du point M (attention aux demi-unités) :\n" + coordinatePlaneSvg({"halfSteps":true,"points":[{"x":"${cx}","y":"${cy}","label":"M"}]}),
      "answer": "[\"x\",\"y\"]",
      "options": {
        "formula_code": "setNB(2)\nix=RD(1,5)\niy=RD(1,5)\nx=CUT(ix*0.5,1)\ny=CUT(iy*0.5,1)\ncx=200+ix*20\ncy=200-iy*20"
      },
      "footer": "$$M(\\,[[formula]]\\,;\\,[[formula]]\\,)$$"
    },
    {
      "n": 7,
      "statement": "Quelle est l'abscisse du point M ?\n" + coordinatePlaneSvg({"points":[{"x":"${cx}","y":"${cy}","label":"M"}]}),
      "answer": "[\"x\"]",
      "options": {
        "formula_code": "setNB(1)\nx=RD(-3,3,[0])\ny=RD(-3,3,[0])\ncx=200+x*40\ncy=200-y*40"
      },
      "footer": "$$x_M=[[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Quelle est l'ordonnée du point M ?\n" + coordinatePlaneSvg({"points":[{"x":"${cx}","y":"${cy}","label":"M"}]}),
      "answer": "[\"y\"]",
      "options": {
        "formula_code": "setNB(1)\nx=RD(-3,3,[0])\ny=RD(-3,3,[0])\ncx=200+x*40\ncy=200-y*40"
      },
      "footer": "$$y_M=[[formula]]$$"
    },
    {
      "n": 9,
      "statement": "Quelles sont les coordonnées du point M ?\n" + coordinatePlaneSvg({"points":[{"x":"${cx}","y":"${cy}","label":"M"}]}) + "&&$$(${x}\\,;\\,${y})$$&&$$(${y}\\,;\\,${x})$$&&$$(${x}\\,;\\,${oppy})$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nx=RD(1,3)\ny=RD(-3,-1)\noppy=0-y\ncx=200+x*40\ncy=200-y*40",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    }
  ]
};
