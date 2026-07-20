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
      "statement": "Calcule le volume de ce cube.",
      "answer": "[\"c^3\"]",
      "options": {
        "formula_code": "c=RD(2,9)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 2,
      "statement": "Calcule le volume de ce pavé droit.",
      "answer": "[\"L*l*h\"]",
      "options": {
        "formula_code": "L=RD(5,14)\nl=RD(2,8)\nh=RD(2,7)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 3,
      "statement": "Calcule le volume de ce prisme droit à base triangulaire.",
      "answer": "[\"b*ht*p/2\"]",
      "options": {
        "formula_code": "b=RD(2,7)*2\nht=RD(2,8)\np=RD(4,12)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 4,
      "statement": "Calcule le volume de ce cylindre. On prendra $$\\pi\\approx 3,14$$.",
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
      "statement": "Calcule le volume de ce prisme droit.",
      "answer": "[\"a*h\"]",
      "options": {
        "formula_code": "a=RD(15,90)\nh=RD(2,12)\n"
      },
      "footer": "Volume = [[formula]] cm³"
    },
    {
      "n": 9,
      "statement": "Calcule le volume de ce cylindre. On prendra $$\\pi\\approx 3,14$$.",
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
