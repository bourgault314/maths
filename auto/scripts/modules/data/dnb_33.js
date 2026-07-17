const MODULE_DNB_33 = {
  "id": "dnb_33",
  "num": 33,
  "title": "Reconnaître une situation de proportionnalité",
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
      "statement": "Le tableau suivant donne deux grandeurs :<div class=\"legacy-statement-table-wrap legacy-table-dnb_33-1-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_33-1\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">grandeur A</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${x1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${x2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${x3}$$</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">grandeur B</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y3}$$</td></tr></table></div>Cette situation est-elle une situation de proportionnalité ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nx1=RD(1,4)\nx2=x1+RD(1,4)\nx3=x2+RD(1,4)\nk=RD(2,6)\ny1=k*x1\ny2=k*x2\ny3=k*x3",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 2,
      "statement": "Le tableau suivant donne deux grandeurs :<div class=\"legacy-statement-table-wrap legacy-table-dnb_33-2-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_33-2\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">grandeur A</td><td style=\"border:1px solid #555;padding:8px 18px\">1</td><td style=\"border:1px solid #555;padding:8px 18px\">2</td><td style=\"border:1px solid #555;padding:8px 18px\">3</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">grandeur B</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y3}$$</td></tr></table></div>Cette situation est-elle une situation de proportionnalité ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "setNB(1)\nk=RD(2,6)\nc=RD(1,5)\ny1=k+c\ny2=2*k+c\ny3=3*k+c",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 3,
      "statement": "Pour une recette, il faut $$${q1}\\text{ g}$$ de farine pour $$${p1}$$ personnes et $$${q2}\\text{ g}$$ de farine pour $$${p2}$$ personnes.<br>La quantité de farine est-elle proportionnelle au nombre de personnes ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\np1=RD(2,5)\nm=RD(2,4)\np2=p1*m\nu=RD(40,90)\nq1=p1*u\nq2=p2*u",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 4,
      "statement": "Un taxi facture une prise en charge fixe de $$${f}$$ € puis $$${p}$$ € par kilomètre.<br>Le prix payé est-il proportionnel au nombre de kilomètres parcourus ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "setNB(1)\nf=RD(3,8)\np=RD(1,4)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 5,
      "statement": "Pour chaque valeur de $$x$$, on calcule $$y=${k}x$$.<br>La grandeur $$y$$ est-elle proportionnelle à la grandeur $$x$$ ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nk=RD(2,8)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 6,
      "statement": "Le graphique ci-dessous représente une relation entre deux grandeurs.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 230\" style=\"max-width:380px\"><line x1=\"60\" y1=\"180\" x2=\"350\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"180\" x2=\"60\" y2=\"25\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,180 340,175 340,185\" fill=\"#222\"/><polygon points=\"60,25 55,35 65,35\" fill=\"#222\"/><line x1=\"60\" y1=\"140\" x2=\"340\" y2=\"140\" stroke=\"#ddd\" stroke-width=\"1\"/><line x1=\"60\" y1=\"100\" x2=\"340\" y2=\"100\" stroke=\"#ddd\" stroke-width=\"1\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\" stroke=\"#ddd\" stroke-width=\"1\"/><line x1=\"130\" y1=\"180\" x2=\"130\" y2=\"35\" stroke=\"#eee\" stroke-width=\"1\"/><line x1=\"200\" y1=\"180\" x2=\"200\" y2=\"35\" stroke=\"#eee\" stroke-width=\"1\"/><line x1=\"270\" y1=\"180\" x2=\"270\" y2=\"35\" stroke=\"#eee\" stroke-width=\"1\"/><text x=\"52\" y=\"185\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"52\" y=\"144\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">5</text><text x=\"52\" y=\"104\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"52\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><text x=\"130\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"200\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"270\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"${y4}\" stroke=\"#2471a3\" stroke-width=\"2\"/><circle cx=\"${cx1}\" cy=\"${cy1}\" r=\"4\" fill=\"#c0392b\"/><circle cx=\"${cx2}\" cy=\"${cy2}\" r=\"4\" fill=\"#c0392b\"/><circle cx=\"${cx3}\" cy=\"${cy3}\" r=\"4\" fill=\"#c0392b\"/></svg></div>Ce graphique peut-il représenter une situation de proportionnalité ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nk=RD(2,5)\nx1=1\nx2=2\nx3=3\ny1=k*x1\ny2=k*x2\ny3=k*x3\ny4=180-4*k*8\ncx1=60+x1*70\ncx2=60+x2*70\ncx3=60+x3*70\ncy1=180-y1*8\ncy2=180-y2*8\ncy3=180-y3*8",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 7,
      "statement": "Le graphique ci-dessous représente une relation entre deux grandeurs.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 230\" style=\"max-width:380px\"><line x1=\"60\" y1=\"180\" x2=\"350\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"180\" x2=\"60\" y2=\"25\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,180 340,175 340,185\" fill=\"#222\"/><polygon points=\"60,25 55,35 65,35\" fill=\"#222\"/><line x1=\"60\" y1=\"140\" x2=\"340\" y2=\"140\" stroke=\"#ddd\" stroke-width=\"1\"/><line x1=\"60\" y1=\"100\" x2=\"340\" y2=\"100\" stroke=\"#ddd\" stroke-width=\"1\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\" stroke=\"#ddd\" stroke-width=\"1\"/><line x1=\"130\" y1=\"180\" x2=\"130\" y2=\"35\" stroke=\"#eee\" stroke-width=\"1\"/><line x1=\"200\" y1=\"180\" x2=\"200\" y2=\"35\" stroke=\"#eee\" stroke-width=\"1\"/><line x1=\"270\" y1=\"180\" x2=\"270\" y2=\"35\" stroke=\"#eee\" stroke-width=\"1\"/><text x=\"52\" y=\"185\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"52\" y=\"144\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">5</text><text x=\"52\" y=\"104\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"52\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><text x=\"130\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"200\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"270\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><circle cx=\"60\" cy=\"180\" r=\"3\" fill=\"#222\"/><line x1=\"60\" y1=\"${cy0}\" x2=\"340\" y2=\"${cy4}\" stroke=\"#8b1f5f\" stroke-width=\"2\"/><circle cx=\"${cx1}\" cy=\"${cy1}\" r=\"4\" fill=\"#c0392b\"/><circle cx=\"${cx2}\" cy=\"${cy2}\" r=\"4\" fill=\"#c0392b\"/><circle cx=\"${cx3}\" cy=\"${cy3}\" r=\"4\" fill=\"#c0392b\"/></svg></div>Ce graphique peut-il représenter une situation de proportionnalité ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "setNB(1)\nk=RD(2,4)\nc=RD(1,3)\nx1=1\nx2=2\nx3=3\ny1=k*x1+c\ny2=k*x2+c\ny3=k*x3+c\ny0=c\ny4=4*k+c\ncx1=60+x1*70\ncx2=60+x2*70\ncx3=60+x3*70\ncy0=180-y0*8\ncy1=180-y1*8\ncy2=180-y2*8\ncy3=180-y3*8\ncy4=180-y4*8",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 8,
      "statement": "Dans un magasin, le prix payé dépend de la masse achetée :<div class=\"legacy-statement-table-wrap legacy-table-dnb_33-8-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_33-8\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">masse en kg</td><td style=\"border:1px solid #555;padding:8px 18px\">2</td><td style=\"border:1px solid #555;padding:8px 18px\">4</td><td style=\"border:1px solid #555;padding:8px 18px\">7</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">prix en €</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p4}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p7}$$</td></tr></table></div>Le prix est-il proportionnel à la masse ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nu=RD(2,6)\np2=2*u\np4=4*u\np7=7*u",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 9,
      "statement": "La taille d’un enfant est-elle toujours proportionnelle à son âge ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"2\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 10,
      "statement": "Sur un plan à l’échelle, les longueurs dessinées et les longueurs réelles correspondantes sont-elles proportionnelles ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    }
  ]
};
