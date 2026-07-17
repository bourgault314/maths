const MODULE_DNB_23 = {
  "id": "dnb_23",
  "num": 23,
  "title": "Volumes : cube, pavé droit, prisme et cylindre",
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
      "statement": "Calcule le volume de ce cube.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"290\" height=\"auto\" viewBox=\"0 0 290 190\"><polygon points=\"85,70 170,45 230,95 145,120\" fill=\"#f5fbff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><polygon points=\"85,70 145,120 145,170 85,120\" fill=\"#dcecff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><polygon points=\"145,120 230,95 230,145 145,170\" fill=\"#eaf3ff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><line x1=\"85\" y1=\"70\" x2=\"170\" y2=\"45\" stroke=\"#1f5f99\" stroke-width=\"2\"/><line x1=\"170\" y1=\"45\" x2=\"230\" y2=\"95\" stroke=\"#1f5f99\" stroke-width=\"2\"/><text x=\"113\" y=\"151\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div>",
      "answer": "[\"c^3\"]",
      "options": {
        "formula_code": "c=RD(2,9)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 2,
      "statement": "Calcule le volume de ce pavé droit.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"330\" height=\"auto\" viewBox=\"0 0 330 200\"><polygon points=\"70,80 210,80 265,120 125,120\" fill=\"#fff7e8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"70,80 125,120 125,170 70,130\" fill=\"#ffe7c2\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"125,120 265,120 265,170 125,170\" fill=\"#ffefd8\" stroke=\"#b36b00\" stroke-width=\"2\"/><line x1=\"70\" y1=\"130\" x2=\"210\" y2=\"130\" stroke=\"#b36b00\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><line x1=\"210\" y1=\"80\" x2=\"210\" y2=\"130\" stroke=\"#b36b00\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><line x1=\"210\" y1=\"130\" x2=\"265\" y2=\"170\" stroke=\"#b36b00\" stroke-width=\"2\" stroke-dasharray=\"5,4\"/><text x=\"195\" y=\"190\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${l} cm</text><text x=\"78\" y=\"165\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${h} cm</text><text x=\"158\" y=\"72\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${L} cm</text></svg></div>",
      "answer": "[\"L*l*h\"]",
      "options": {
        "formula_code": "L=RD(5,14)\nl=RD(2,8)\nh=RD(2,7)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 3,
      "statement": "Calcule le volume de ce prisme droit à base triangulaire.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 210\"><polygon points=\"170,125 220,55 270,125\" fill=\"#f5fff5\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"80,145 130,75 220,55 170,125\" fill=\"#eef8ee\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"130,75 180,145 270,125 220,55\" fill=\"#f5fff5\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"80,145 180,145 270,125 170,125\" fill=\"#d9f5d9\" stroke=\"#246b24\" stroke-width=\"2\"/><polygon points=\"80,145 130,75 180,145\" fill=\"#eaffea\" stroke=\"#246b24\" stroke-width=\"2\"/><line x1=\"130\" y1=\"75\" x2=\"130\" y2=\"145\" stroke=\"#246b24\" stroke-width=\"1.5\" stroke-dasharray=\"4,3\"/><line x1=\"170\" y1=\"125\" x2=\"220\" y2=\"55\" stroke=\"#246b24\" stroke-width=\"2\"/><line x1=\"220\" y1=\"55\" x2=\"270\" y2=\"125\" stroke=\"#246b24\" stroke-width=\"2\"/><line x1=\"170\" y1=\"125\" x2=\"270\" y2=\"125\" stroke=\"#246b24\" stroke-width=\"2\"/></svg></div><br>La base triangulaire a pour base ${b} cm et pour hauteur ${ht} cm. La longueur du prisme est ${p} cm.",
      "answer": "[\"b*ht*p/2\"]",
      "options": {
        "formula_code": "b=RD(2,7)*2\nht=RD(2,8)\np=RD(4,12)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 4,
      "statement": "Calcule le volume de ce cylindre. On prendra $$\\pi\\approx 3,14$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"280\" height=\"auto\" viewBox=\"0 0 280 220\"><ellipse cx=\"140\" cy=\"55\" rx=\"70\" ry=\"24\" fill=\"#f7ecff\" stroke=\"#7a3aa0\" stroke-width=\"2\"/><path d=\"M 70,55 L 70,165\" stroke=\"#7a3aa0\" stroke-width=\"2\" fill=\"none\"/><path d=\"M 210,55 L 210,165\" stroke=\"#7a3aa0\" stroke-width=\"2\" fill=\"none\"/><ellipse cx=\"140\" cy=\"165\" rx=\"70\" ry=\"24\" fill=\"#ead7f7\" stroke=\"#7a3aa0\" stroke-width=\"2\"/><line x1=\"140\" y1=\"55\" x2=\"210\" y2=\"55\" stroke=\"#7a3aa0\" stroke-width=\"2\"/><text x=\"176\" y=\"47\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">r = ${r} cm</text><text x=\"232\" y=\"113\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">${h} cm</text></svg></div>",
      "answer": "[\"CUT(3.14*r*r*h,2)\"]",
      "options": {
        "formula_code": "r=RD(2,8)\nh=RD(3,12)\n"
      },
      "footer": "Volume ≈ [[formula]] cm³"
    },
    {
      "n": 5,
      "statement": "Un dé cubique a une arête de $$${a}$$ mm. Calcule son volume.",
      "answer": "[\"a^3\"]",
      "options": {
        "formula_code": "a=RD(4,12)\n"
      },
      "footer": "Volume = [[formula]] mm³"
    },
    {
      "n": 6,
      "statement": "Un aquarium a la forme d'un pavé droit. Il mesure $$${L}$$ cm de long, $$${l}$$ cm de large et $$${h}$$ cm de haut. Calcule son volume.",
      "answer": "[\"L*l*h\"]",
      "options": {
        "formula_code": "L=RD(30,80)\nl=RD(15,40)\nh=RD(20,50)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 7,
      "statement": "Un prisme droit a une base d'aire $$${a}$$ cm² et une hauteur de $$${h}$$ cm. Calcule son volume.",
      "answer": "[\"a*h\"]",
      "options": {
        "formula_code": "a=RD(12,80)\nh=RD(3,15)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 8,
      "statement": "Calcule le volume de ce prisme droit.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"360\" height=\"auto\" viewBox=\"0 0 360 230\"><polygon points=\"150,120 190,70 270,70 310,120\" fill=\"#fffaf0\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"85,145 125,95 190,70 150,120\" fill=\"#fff0d8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"125,95 205,95 270,70 190,70\" fill=\"#f8efd8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"205,95 245,145 310,120 270,70\" fill=\"#f1e2c8\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"85,145 245,145 310,120 150,120\" fill=\"#ead7b5\" stroke=\"#b36b00\" stroke-width=\"2\"/><polygon points=\"85,145 125,95 205,95 245,145\" fill=\"#f5e9d3\" stroke=\"#b36b00\" stroke-width=\"2\"/><line x1=\"245\" y1=\"165\" x2=\"310\" y2=\"140\" stroke=\"#b36b00\" stroke-width=\"2\"/></svg></div><div style=\"text-align:center;font-size:18px\">aire base = ${a} cm² &nbsp;&nbsp;&nbsp; hauteur ${h} cm</div>",
      "answer": "[\"a*h\"]",
      "options": {
        "formula_code": "a=RD(15,90)\nh=RD(2,12)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 9,
      "statement": "Calcule le volume de ce cylindre. On prendra $$\\pi\\approx 3,14$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 220\"><ellipse cx=\"145\" cy=\"55\" rx=\"80\" ry=\"25\" fill=\"#effaf5\" stroke=\"#1f7a4d\" stroke-width=\"2\"/><path d=\"M 65,55 L 65,165\" stroke=\"#1f7a4d\" stroke-width=\"2\" fill=\"none\"/><path d=\"M 225,55 L 225,165\" stroke=\"#1f7a4d\" stroke-width=\"2\" fill=\"none\"/><ellipse cx=\"145\" cy=\"165\" rx=\"80\" ry=\"25\" fill=\"#d9f5e8\" stroke=\"#1f7a4d\" stroke-width=\"2\"/><line x1=\"65\" y1=\"55\" x2=\"225\" y2=\"55\" stroke=\"#1f7a4d\" stroke-width=\"2\"/><text x=\"145\" y=\"47\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">diamètre ${d} cm</text><text x=\"248\" y=\"113\" font-family=\"serif\" font-size=\"17\" text-anchor=\"middle\">${h} cm</text></svg></div>",
      "answer": "[\"CUT(3.14*(d/2)*(d/2)*h,2)\"]",
      "options": {
        "formula_code": "d=RD(2,9)*2\nh=RD(3,12)\n"
      },
      "footer": "Volume ≈ [[formula]] cm³"
    },
    {
      "n": 10,
      "statement": "Un solide est composé de deux cubes identiques d'arête $$${a}$$ cm collés l'un contre l'autre. Calcule le volume total.",
      "answer": "[\"2*a^3\"]",
      "options": {
        "formula_code": "a=RD(2,8)\n"
      },
      "footer": "Volume total = [[formula]] cm³"
    }
  ]
};
