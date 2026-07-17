const MODULE_DNB_21 = {
  "id": "dnb_21",
  "num": 21,
  "title": "Périmètres de polygones et de disques",
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
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 170\"><rect x=\"55\" y=\"45\" width=\"190\" height=\"85\" fill=\"#eef6ff\" stroke=\"#1f5f99\" stroke-width=\"2\"/><text x=\"150\" y=\"150\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${L} cm</text><text x=\"32\" y=\"92\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${l} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce rectangle.</div>",
      "answer": "[\"2*(L+l)\"]",
      "options": {
        "formula_code": "L=RD(7,15)\nl=RD(3,6)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 2,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"240\" height=\"auto\" viewBox=\"0 0 240 190\"><rect x=\"60\" y=\"35\" width=\"120\" height=\"120\" fill=\"#fff3e6\" stroke=\"#b85c00\" stroke-width=\"2\"/><text x=\"120\" y=\"178\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce carré.</div>",
      "answer": "[\"4*c\"]",
      "options": {
        "formula_code": "c=RD(3,14)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 3,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 200\"><polygon points=\"65,150 235,150 145,45\" fill=\"#f0fff0\" stroke=\"#267326\" stroke-width=\"2\"/><text x=\"150\" y=\"175\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${a} cm</text><text x=\"88\" y=\"92\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${b} cm</text><text x=\"215\" y=\"92\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce triangle.</div>",
      "answer": "[\"a+b+c\"]",
      "options": {
        "formula_code": "a=RD(5,11)\nb=RD(5,9)\nc=RD(5,9)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 4,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"270\" height=\"auto\" viewBox=\"0 0 270 210\"><polygon points=\"135,30 205,80 180,160 90,160 65,80\" fill=\"#f8efff\" stroke=\"#6b2b91\" stroke-width=\"2\"/><text x=\"135\" y=\"188\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div><br><div style=\"text-align:left\">Ce pentagone est régulier : ses 5 côtés ont la même longueur. Calcule son périmètre.</div>",
      "answer": "[\"5*c\"]",
      "options": {
        "formula_code": "c=RD(3,12)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 5,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 190\"><polygon points=\"70,135 235,135 265,65 100,65\" fill=\"#fffbea\" stroke=\"#9a7b00\" stroke-width=\"2\"/><text x=\"153\" y=\"158\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${L} cm</text><text x=\"75\" y=\"95\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${l} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce parallélogramme.</div>",
      "answer": "[\"2*(L+l)\"]",
      "options": {
        "formula_code": "L=RD(7,16)\nl=RD(3,9)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 6,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"310\" height=\"auto\" viewBox=\"0 0 310 220\"><polygon points=\"60,170 230,170 230,112 150,112 150,55 60,55\" fill=\"#eef8f8\" stroke=\"#236b6b\" stroke-width=\"2\"/><text x=\"145\" y=\"198\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${W} cm</text><text x=\"32\" y=\"116\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${H} cm</text><text x=\"105\" y=\"45\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${a} cm</text><text x=\"170\" y=\"86\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${b} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce polygone.</div>",
      "answer": "[\"2*(W+H)\"]",
      "options": {
        "formula_code": "W=RD(8,16)\nH=RD(6,13)\na=RD(2,W-3)\nb=RD(2,H-3)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 7,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"auto\" viewBox=\"0 0 260 190\"><circle cx=\"130\" cy=\"90\" r=\"62\" fill=\"#eef4ff\" stroke=\"#315b9f\" stroke-width=\"2\"/><line x1=\"130\" y1=\"90\" x2=\"192\" y2=\"90\" stroke=\"#315b9f\" stroke-width=\"2\"/><text x=\"162\" y=\"82\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${r} cm</text></svg></div><div style=\"text-align:center\">Calcule le périmètre de ce disque.\nOn prendra $$\\pi\\approx 3,1$$.</div>",
      "answer": "[\"CUT(2*3,1*r,1)\"]",
      "options": {
        "formula_code": "r=RD(2,9)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 8,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"270\" height=\"auto\" viewBox=\"0 0 270 190\"><circle cx=\"135\" cy=\"90\" r=\"62\" fill=\"#fff0f0\" stroke=\"#a13030\" stroke-width=\"2\"/><line x1=\"73\" y1=\"90\" x2=\"197\" y2=\"90\" stroke=\"#a13030\" stroke-width=\"2\"/><text x=\"135\" y=\"82\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${d} cm</text></svg></div><br><div style=\"text-align:center\">Calcule le périmètre de ce disque.\nOn prendra $$\\pi\\approx 3,1$$.</div>",
      "answer": "[\"CUT(3,1*d,1)\"]",
      "options": {
        "formula_code": "d=RD(4,18)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 9,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"auto\" viewBox=\"0 0 320 210\"><polygon points=\"65,155 140,55 250,85 225,160\" fill=\"#f7f7ff\" stroke=\"#3f3f8f\" stroke-width=\"2\"/><text x=\"103\" y=\"100\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${a} cm</text><text x=\"195\" y=\"58\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${b} cm</text><text x=\"252\" y=\"126\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text><text x=\"145\" y=\"182\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${d} cm</text></svg></div><br><div style=\"text-align:left\">Calcule le périmètre de ce quadrilatère.</div>",
      "answer": "[\"a+b+c+d\"]",
      "options": {
        "formula_code": "a=RD(4,10)\nb=RD(5,12)\nc=RD(4,10)\nd=RD(5,12)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 10,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"auto\" viewBox=\"0 0 300 200\"><polygon points=\"150,28 230,72 230,148 150,192 70,148 70,72\" fill=\"#f1fff1\" stroke=\"#2b7a2b\" stroke-width=\"2\"/><text x=\"150\" y=\"22\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${c} cm</text></svg></div><br><div style=\"text-align:left\">Cet hexagone est régulier : ses 6 côtés ont la même longueur. Calcule son périmètre.</div>",
      "answer": "[\"6*c\"]",
      "options": {
        "formula_code": "c=RD(2,10)"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 11,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"270\" height=\"auto\" viewBox=\"0 0 270 190\"><circle cx=\"135\" cy=\"90\" r=\"62\" fill=\"#eef8f8\" stroke=\"#236b6b\" stroke-width=\"2\"/><line x1=\"${isRadius?135:73}\" y1=\"90\" x2=\"197\" y2=\"90\" stroke=\"#236b6b\" stroke-width=\"2\"/><circle cx=\"135\" cy=\"90\" r=\"3\" fill=\"#236b6b\"/><text x=\"${isRadius?166:135}\" y=\"82\" font-family=\"serif\" font-size=\"18\" text-anchor=\"middle\">${measure} cm</text></svg></div><div style=\"text-align:center\">Donne la valeur exacte du périmètre de ce disque.</div>",
      "answer": "[\"coefficient+'π'\"]",
      "options": {
        "formula_code": "isRadius=RD(0,1)===1\nmeasure=isRadius?RD(2,9):RD(4,18)\ncoefficient=isRadius?2*measure:measure"
      },
      "footer": "Réponse : [[formula]] cm"
    },
    {
      "n": 12,
      "statement": "<div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"270\" height=\"auto\" viewBox=\"0 0 270 170\"><circle cx=\"135\" cy=\"78\" r=\"58\" fill=\"#f7f7ff\" stroke=\"#3f3f8f\" stroke-width=\"2\"/><line x1=\"${isRadius?135:77}\" y1=\"78\" x2=\"193\" y2=\"78\" stroke=\"#3f3f8f\" stroke-width=\"2\"/><circle cx=\"135\" cy=\"78\" r=\"3\" fill=\"#3f3f8f\"/><text x=\"${isRadius?164:135}\" y=\"68\" font-family=\"serif\" font-size=\"20\" text-anchor=\"middle\">${isRadius?'r':'d'}</text></svg></div><div style=\"text-align:center\">Touche la formule qui permet de calculer le périmètre de ce disque.</div>&&$$${correctFormula}$$&&$$${wrongFormula1}$$&&$$${wrongFormula2}$$&&$$${wrongFormula3}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "isRadius=RD(0,1)===1\ncorrectFormula=isRadius?'P=2\\\\pi r':'P=\\\\pi d'\nwrongFormula1=isRadius?'P=\\\\pi r^2':'P=2\\\\pi d'\nwrongFormula2=isRadius?'P=\\\\pi r':'P=\\\\pi d^2'\nwrongFormula3=isRadius?'P=2\\\\pi r^2':'P=\\\\dfrac{\\\\pi d}{2}'",
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    }
  ]
};
