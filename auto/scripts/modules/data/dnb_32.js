const MODULE_DNB_32 = {
  "id": "dnb_32",
  "num": 32,
  "title": "Lire des tableaux, diagrammes et graphiques",
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
      "statement": "Le tableau donne le nombre de livres empruntés au CDI pendant une semaine :<div class=\"legacy-statement-table-wrap legacy-table-dnb_32-1-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_32-1\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">jour</td><td style=\"border:1px solid #555;padding:8px 18px\">lundi</td><td style=\"border:1px solid #555;padding:8px 18px\">mardi</td><td style=\"border:1px solid #555;padding:8px 18px\">mercredi</td><td style=\"border:1px solid #555;padding:8px 18px\">jeudi</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">livres</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${a}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${b}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${c}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${d}$$</td></tr></table></div>Combien de livres ont été empruntés au total ?",
      "answer": "[\"a+b+c+d\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(8,20)\nb=RD(8,20)\nc=RD(8,20)\nd=RD(8,20)"
      },
      "footer": "$$[[formula]]$$"
    },
    {
      "n": 2,
      "statement": "Le tableau indique le moyen de transport utilisé par des élèves :<div class=\"legacy-statement-table-wrap legacy-table-dnb_32-2-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_32-2\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">transport</td><td style=\"border:1px solid #555;padding:8px 18px\">bus</td><td style=\"border:1px solid #555;padding:8px 18px\">vélo</td><td style=\"border:1px solid #555;padding:8px 18px\">marche</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${bus}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${velo}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${marche}$$</td></tr></table></div>Quel moyen de transport est le plus utilisé ?&&le bus&&le vélo&&la marche&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nvelo=RD(5,12)\nmarche=RD(5,12)\nbus=velo+marche+RD(1,4)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 3,
      "statement": "Le diagramme en bâtons indique le nombre d’élèves inscrits à différents ateliers.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"360\" height=\"auto\" viewBox=\"0 0 360 230\" style=\"max-width:360px\"><line x1=\"50\" y1=\"180\" x2=\"330\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"50\" y1=\"40\" x2=\"50\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"45\" y1=\"180\" x2=\"330\" y2=\"180\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"45\" y1=\"140\" x2=\"330\" y2=\"140\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"45\" y1=\"100\" x2=\"330\" y2=\"100\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"45\" y1=\"60\" x2=\"330\" y2=\"60\" stroke=\"#ccc\" stroke-width=\"1\"/><text x=\"40\" y=\"184\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"40\" y=\"144\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">5</text><text x=\"40\" y=\"104\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"40\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><polygon points=\"80,180 80,${y1} 120,${y1} 120,180\" fill=\"#dceeff\" stroke=\"#2471a3\" stroke-width=\"2\"/><polygon points=\"160,180 160,${y2} 200,${y2} 200,180\" fill=\"#e8f6e8\" stroke=\"#2e7d32\" stroke-width=\"2\"/><polygon points=\"240,180 240,${y3} 280,${y3} 280,180\" fill=\"#fff1d6\" stroke=\"#b36b00\" stroke-width=\"2\"/><text x=\"100\" y=\"202\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">sport</text><text x=\"180\" y=\"202\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">théâtre</text><text x=\"260\" y=\"202\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">musique</text></svg></div>Combien d’élèves sont inscrits à l’atelier théâtre ?",
      "answer": "[\"theatre\"]",
      "options": {
        "formula_code": "setNB(1)\nsport=RD(1,3)*5\ntheatre=RD(1,3)*5\nmusique=RD(1,3)*5\ny1=180-sport*8\ny2=180-theatre*8\ny3=180-musique*8"
      },
      "footer": "$$[[formula]]$$"
    },
    {
      "n": 4,
      "statement": "Le graphique indique la température relevée à midi pendant cinq jours.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><line x1=\"50\" y1=\"200\" x2=\"340\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"50\" y1=\"50\" x2=\"50\" y2=\"200\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"45\" y1=\"175\" x2=\"340\" y2=\"175\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"45\" y1=\"150\" x2=\"340\" y2=\"150\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"45\" y1=\"125\" x2=\"340\" y2=\"125\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"45\" y1=\"100\" x2=\"340\" y2=\"100\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"45\" y1=\"75\" x2=\"340\" y2=\"75\" stroke=\"#ccc\" stroke-width=\"1\"/><text x=\"40\" y=\"179\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"40\" y=\"154\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><text x=\"40\" y=\"129\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"40\" y=\"104\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">25</text><line x1=\"80\" y1=\"${y1}\" x2=\"135\" y2=\"${y2}\" stroke=\"#c0392b\" stroke-width=\"2\"/><line x1=\"135\" y1=\"${y2}\" x2=\"190\" y2=\"${y3}\" stroke=\"#c0392b\" stroke-width=\"2\"/><line x1=\"190\" y1=\"${y3}\" x2=\"245\" y2=\"${y4}\" stroke=\"#c0392b\" stroke-width=\"2\"/><line x1=\"245\" y1=\"${y4}\" x2=\"300\" y2=\"${y5}\" stroke=\"#c0392b\" stroke-width=\"2\"/><circle cx=\"80\" cy=\"${y1}\" r=\"4\" fill=\"#c0392b\"/><circle cx=\"135\" cy=\"${y2}\" r=\"4\" fill=\"#c0392b\"/><circle cx=\"190\" cy=\"${y3}\" r=\"4\" fill=\"#c0392b\"/><circle cx=\"245\" cy=\"${y4}\" r=\"4\" fill=\"#c0392b\"/><circle cx=\"300\" cy=\"${y5}\" r=\"4\" fill=\"#c0392b\"/><text x=\"80\" y=\"220\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">lun.</text><text x=\"135\" y=\"220\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">mar.</text><text x=\"190\" y=\"220\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">mer.</text><text x=\"245\" y=\"220\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">jeu.</text><text x=\"300\" y=\"220\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">ven.</text></svg></div>De combien de degrés la température a-t-elle augmenté entre lundi et vendredi ?",
      "answer": "[\"t5-t1\"]",
      "options": {
        "formula_code": "setNB(1)\nt1=RD(2,3)*5\nt2=t1+RD(0,1)*5\nt3=t2+RD(0,1)*5\nt4=t3+RD(0,1)*5\nt5=t4+RD(1,2)*5\ny1=225-t1*5\ny2=225-t2*5\ny3=225-t3*5\ny4=225-t4*5\ny5=225-t5*5"
      },
      "footer": "$$[[formula]]\\,°\\text{C}$$"
    },
    {
      "n": 5,
      "statement": "Le diagramme circulaire représente les résultats d’un vote. Les quatre secteurs ont la même taille.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"auto\" viewBox=\"0 0 260 220\" style=\"max-width:260px\"><circle cx=\"130\" cy=\"105\" r=\"70\" fill=\"#fff\" stroke=\"#222\" stroke-width=\"2\"/><line x1=\"130\" y1=\"35\" x2=\"130\" y2=\"175\" stroke=\"#222\" stroke-width=\"2\"/><line x1=\"60\" y1=\"105\" x2=\"200\" y2=\"105\" stroke=\"#222\" stroke-width=\"2\"/><text x=\"95\" y=\"80\" font-family=\"sans-serif\" font-size=\"16\" text-anchor=\"middle\">A</text><text x=\"165\" y=\"80\" font-family=\"sans-serif\" font-size=\"16\" text-anchor=\"middle\">B</text><text x=\"95\" y=\"135\" font-family=\"sans-serif\" font-size=\"16\" text-anchor=\"middle\">A</text><text x=\"165\" y=\"135\" font-family=\"sans-serif\" font-size=\"16\" text-anchor=\"middle\">C</text></svg></div>Quelle part du vote correspond à la réponse A ?&&$$\\dfrac{1}{2}$$&&$$\\dfrac{1}{4}$$&&$$\\dfrac{3}{4}$$&&$$\\dfrac{2}{3}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 6,
      "statement": "Le tableau donne les résultats d’une enquête sur les sports pratiqués :<div class=\"legacy-statement-table-wrap legacy-table-dnb_32-6-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_32-6\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 16px\"></td><td style=\"border:1px solid #555;padding:8px 16px\">football</td><td style=\"border:1px solid #555;padding:8px 16px\">basket</td><td style=\"border:1px solid #555;padding:8px 16px\">natation</td></tr><tr><td style=\"border:1px solid #555;padding:8px 16px\">filles</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${f1}$$</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${f2}$$</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${f3}$$</td></tr><tr><td style=\"border:1px solid #555;padding:8px 16px\">garçons</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${g1}$$</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${g2}$$</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${g3}$$</td></tr></table></div>Combien d’élèves pratiquent le basket ?",
      "answer": "[\"f2+g2\"]",
      "options": {
        "formula_code": "setNB(1)\nf1=RD(3,12)\nf2=RD(3,12)\nf3=RD(3,12)\ng1=RD(3,12)\ng2=RD(3,12)\ng3=RD(3,12)"
      },
      "footer": "$$[[formula]]$$"
    },
    {
      "n": 7,
      "statement": "Le diagramme indique le nombre de sorties réalisées par trois clubs.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"340\" height=\"auto\" viewBox=\"0 0 340 220\" style=\"max-width:340px\"><line x1=\"50\" y1=\"170\" x2=\"310\" y2=\"170\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"50\" y1=\"40\" x2=\"50\" y2=\"170\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"45\" y1=\"130\" x2=\"310\" y2=\"130\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"45\" y1=\"90\" x2=\"310\" y2=\"90\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"45\" y1=\"50\" x2=\"310\" y2=\"50\" stroke=\"#ccc\" stroke-width=\"1\"/><text x=\"40\" y=\"174\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"40\" y=\"134\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">5</text><text x=\"40\" y=\"94\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"40\" y=\"54\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><polygon points=\"80,170 80,${yA} 120,${yA} 120,170\" fill=\"#dceeff\" stroke=\"#2471a3\" stroke-width=\"2\"/><polygon points=\"150,170 150,${yB} 190,${yB} 190,170\" fill=\"#e8f6e8\" stroke=\"#2e7d32\" stroke-width=\"2\"/><polygon points=\"220,170 220,${yC} 260,${yC} 260,170\" fill=\"#fff1d6\" stroke=\"#b36b00\" stroke-width=\"2\"/><text x=\"100\" y=\"192\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">club A</text><text x=\"170\" y=\"192\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">club B</text><text x=\"240\" y=\"192\" font-family=\"sans-serif\" font-size=\"14\" text-anchor=\"middle\">club C</text></svg></div>Quel club a réalisé le moins de sorties ?&&club A&&club B&&club C&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "setNB(1)\nb=RD(1,2)*5\na=b+5\nc=b+10\nyA=170-a*8\nyB=170-b*8\nyC=170-c*8",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 8,
      "statement": "Le graphique indique le nombre de visiteurs d’un site pendant quatre jours.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"360\" height=\"auto\" viewBox=\"0 0 240 170\" style=\"max-width:360px\"><line x1=\"30\" y1=\"140\" x2=\"220\" y2=\"140\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"30\" y1=\"20\" x2=\"30\" y2=\"140\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"30\" y1=\"100\" x2=\"220\" y2=\"100\" stroke=\"#ccc\" stroke-width=\"1\"/><line x1=\"30\" y1=\"60\" x2=\"220\" y2=\"60\" stroke=\"#ccc\" stroke-width=\"1\"/><text x=\"25\" y=\"144\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\">0</text><text x=\"25\" y=\"104\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\">50</text><text x=\"25\" y=\"64\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\">100</text><line x1=\"55\" y1=\"${y1}\" x2=\"95\" y2=\"${y2}\" stroke=\"#2471a3\" stroke-width=\"2\"/><line x1=\"95\" y1=\"${y2}\" x2=\"135\" y2=\"${y3}\" stroke=\"#2471a3\" stroke-width=\"2\"/><line x1=\"135\" y1=\"${y3}\" x2=\"175\" y2=\"${y4}\" stroke=\"#2471a3\" stroke-width=\"2\"/><circle cx=\"55\" cy=\"${y1}\" r=\"3\" fill=\"#2471a3\"/><circle cx=\"95\" cy=\"${y2}\" r=\"3\" fill=\"#2471a3\"/><circle cx=\"135\" cy=\"${y3}\" r=\"3\" fill=\"#2471a3\"/><circle cx=\"175\" cy=\"${y4}\" r=\"3\" fill=\"#2471a3\"/><text x=\"55\" y=\"156\" font-family=\"sans-serif\" font-size=\"11\" text-anchor=\"middle\">lun.</text><text x=\"95\" y=\"156\" font-family=\"sans-serif\" font-size=\"11\" text-anchor=\"middle\">mar.</text><text x=\"135\" y=\"156\" font-family=\"sans-serif\" font-size=\"11\" text-anchor=\"middle\">mer.</text><text x=\"175\" y=\"156\" font-family=\"sans-serif\" font-size=\"11\" text-anchor=\"middle\">jeu.</text></svg></div>Quel jour y a-t-il eu le plus de visiteurs ?&&lundi&&mardi&&mercredi&&jeudi&&",
      "answer": "[\"3\"]",
      "options": {
        "formula_code": "setNB(1)\nv1=RD(1,2)*25\nv2=v1+25\nv3=v2+25\nv4=v1\ny1=140-v1*0.8\ny2=140-v2*0.8\ny3=140-v3*0.8\ny4=140-v4*0.8",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 9,
      "statement": "Dans ce pictogramme, chaque symbole représente $$5$$ élèves.<div class=\"legacy-statement-table-wrap legacy-table-dnb_32-9-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_32-9\" style=\"border-collapse:collapse;margin:auto;text-align:left;font-size:20px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">anglais</td><td style=\"border:1px solid #555;padding:8px 18px\">★ ★ ★ ★</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">espagnol</td><td style=\"border:1px solid #555;padding:8px 18px\">★ ★ ★</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">portugais</td><td style=\"border:1px solid #555;padding:8px 18px\">★ ★</td></tr></table></div>Combien d’élèves ont choisi l’espagnol ?",
      "answer": "[\"15\"]",
      "options": null,
      "footer": "$$[[int]]$$"
    },
    {
      "n": 10,
      "statement": "Le tableau donne les ventes d’un magasin sur trois jours :<div class=\"legacy-statement-table-wrap legacy-table-dnb_32-10-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_32-10\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">jour</td><td style=\"border:1px solid #555;padding:8px 18px\">vendredi</td><td style=\"border:1px solid #555;padding:8px 18px\">samedi</td><td style=\"border:1px solid #555;padding:8px 18px\">dimanche</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">ventes</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${v}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${s}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${d}$$</td></tr></table></div>Combien de ventes de plus ont été réalisées samedi par rapport à vendredi ?",
      "answer": "[\"s-v\"]",
      "options": {
        "formula_code": "setNB(1)\nv=RD(20,60)\ns=v+RD(5,25)\nd=RD(20,60)"
      },
      "footer": "$$[[formula]]$$"
    }
  ]
};
