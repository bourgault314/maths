const MODULE_DNB_25 = {
  "id": "dnb_25",
  "num": 25,
  "title": "Théorème de Thalès : triangles emboîtés",
  "level_tags": [
    "3e",
    "DNB"
  ],
  "source": "import_dnb_zip",
  "has_svg": true,
  "questions": [
    {
      "n": 1,
      "statement": "Sur la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)$$ est parallèle à $$(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>Peut-on utiliser le théorème de Thalès ?&&Oui&&Non, car il manque un angle droit&&Non, car les triangles ne sont pas emboîtés&&Non, car les droites ne sont pas parallèles&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 2,
      "statement": "Dans la configuration suivante, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE) // (BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>Quelle égalité de rapports est correcte ?&&$$\\dfrac{AD}{AB}=\\dfrac{AE}{AC}=\\dfrac{DE}{BC}$$&&$$\\dfrac{AD}{DB}=\\dfrac{AE}{EC}=\\dfrac{DE}{BC}$$&&$$\\dfrac{AB}{AD}=\\dfrac{AE}{EC}=\\dfrac{BC}{DE}$$&&$$\\dfrac{AD}{AC}=\\dfrac{AE}{AB}=\\dfrac{DE}{BC}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 3,
      "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>On donne $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$ et $$AC=${AC}\\text{ cm}$$. Calcule $$AE$$.",
      "answer": "[\"AE\"]",
      "options": {
        "formula_code": "d=RD(2,7)\nk=RD(2,4)\nc=RD(3,9)\nAD=d\nAB=d*k\nAE=c\nAC=c*k"
      },
      "footer": "$$AE=[[formula]]\\text{ cm}$$"
    },
    {
      "n": 4,
      "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>On donne $$AD=${AD}\\text{ cm}$$, $$AE=${AE}\\text{ cm}$$ et $$AC=${AC}\\text{ cm}$$. Calcule $$AB$$.",
      "answer": "[\"AB\"]",
      "options": {
        "formula_code": "d=RD(2,7)\nk=RD(2,4)\ne=RD(2,8)\nAD=d\nAB=d*k\nAE=e\nAC=e*k"
      },
      "footer": "$$AB=[[formula]]\\text{ cm}$$"
    },
    {
      "n": 5,
      "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>On donne $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$ et $$BC=${BC}\\text{ cm}$$. Calcule $$DE$$.",
      "answer": "[\"DE\"]",
      "options": {
        "formula_code": "d=RD(2,7)\nk=RD(2,4)\ne=RD(3,9)\nAD=d\nAB=d*k\nDE=e\nBC=e*k"
      },
      "footer": "$$DE=[[formula]]\\text{ cm}$$"
    },
    {
      "n": 6,
      "statement": "On sait que $$D$$ est sur $$[AB]$$ et $$E$$ est sur $$[AC]$$. On mesure : $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$, $$AE=${AE}\\text{ cm}$$ et $$AC=${AC}\\text{ cm}$$.<br>Les rapports $$\\dfrac{AD}{AB}$$ et $$\\dfrac{AE}{AC}$$ sont-ils égaux ?&&Oui, donc on peut conclure que $$(DE)//(BC)$$&&Non, donc  $$(DE)$$ et $$(BC)$$ ne sont pas parallèles&&Oui, car les deux petits segments sont égaux&&Non, donc  $$(DE)$$ et $$(BC)$$ sont parallèles&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "d=RD(2,7)\nk=RD(2,4)\nc=RD(3,8)\nAD=d\nAB=d*k\nAC=c*k\nAE=c+1",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 7,
      "statement": "Sur cette figure, $$D$$ est sur $$[AB]$$ et $$E$$ est sur $$[AC]$$, mais les droites $$(DE)$$ et $$(BC)$$ ne sont pas parallèles.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#fff8e8\" stroke=\"#b36b00\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"195\" y2=\"108\" stroke=\"#b36b00\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"195\" y=\"108\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>Peut-on appliquer directement le théorème de Thalès ?&&Oui, car il y a deux triangles&&Non, car il manque la condition de parallélisme&&Oui, car les points sont alignés&&Non, car il faudrait un angle droit&&",
      "answer": "[\"2\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 8,
      "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$. On cherche $$x=AE$$.<br>On connaît $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$ et $$AC=${AC}\\text{ cm}$$.<br>Quelle égalité permet de calculer $$x$$ ?&&$$\\dfrac{AD}{AB}=\\dfrac{x}{AC}$$&&$$\\dfrac{AB}{AD}=\\dfrac{x}{AC}$$&&$$\\dfrac{AD}{AC}=\\dfrac{x}{AB}$$&&$$AD+AB=x+AC$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "d=RD(2,7)\nk=RD(2,4)\nc=RD(3,9)\nAD=d\nAB=d*k\nAC=c*k",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 9,
      "statement": "Dans une configuration de Thalès, $$D$$ appartient au segment $$[AB]$$. Après un calcul, on obtient $$AD=${x}\\text{ cm}$$ alors que $$AB=${AB}\\text{ cm}$$. Que faut-il penser de ce résultat ?&&Le résultat est cohérent&&Le résultat est impossible : si $$D$$ est sur $$[AB]$$, alors $$AD$$ ne peut pas être plus grand que $$AB$$&&Le résultat prouve que le triangle est rectangle&&Le résultat est toujours acceptable avec Thalès&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "AB=RD(6,14)\nx=AB+RD(1,6)",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 10,
      "statement": "Dans la figure, $$D$$ est sur $$[AB]$$, $$E$$ est sur $$[AC]$$ et $$(DE)//(BC)$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 190\"><polygon points=\"70,35 45,160 280,160\" fill=\"#eef8ff\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><line x1=\"59\" y1=\"94\" x2=\"170\" y2=\"94\" stroke=\"#1f5f8b\" stroke-width=\"2\"/><text x=\"62\" y=\"28\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">A</text><text x=\"27\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">B</text><text x=\"286\" y=\"176\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">C</text><text x=\"42\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">D</text><text x=\"175\" y=\"96\" font-family=\"serif\" font-style=\"italic\" font-size=\"17\">E</text></svg></div><br>On donne $$AD=${AD}\\text{ cm}$$, $$AB=${AB}\\text{ cm}$$ et $$DE=${DE}\\text{ cm}$$. Calcule $$BC$$.",
      "answer": "[\"BC\"]",
      "options": {
        "formula_code": "d=RD(2,7)\nk=RD(2,4)\ne=RD(3,9)\nAD=d\nAB=d*k\nDE=e\nBC=e*k"
      },
      "footer": "$$BC=[[formula]]\\text{ cm}$$"
    }
  ]
};
