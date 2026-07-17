const MODULE_DNB_34 = {
  "id": "dnb_34",
  "num": 34,
  "title": "Résoudre un problème de proportionnalité",
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
      "statement": "Dans une papeterie, $$${q1}$$ cahiers coûtent $$${p1}\\text{ €}$$.<br>Combien coûtent $$${q2}$$ cahiers ?",
      "answer": "[\"p2\"]",
      "options": {
        "formula_code": "setNB(1)\nu=RD(2,6)\nq1=RD(2,5)\nm=RD(2,4)\nq2=q1*m\np1=q1*u\np2=q2*u"
      },
      "footer": "$$[[formula]]\\text{ €}$$"
    },
    {
      "n": 2,
      "statement": "Dans un magasin, le prix est proportionnel à la masse achetée.<br><div class=\"proportion-table-wrap\"><table class=\"proportion-table\"><tr><td>masse</td><td>$$3\\text{ kg}$$</td><td>$$5\\text{ kg}$$</td><td>$$8\\text{ kg}$$</td></tr><tr><td>prix</td><td>$$${p3}\\text{ €}$$</td><td>$$${p5}\\text{ €}$$</td><td>?</td></tr></table></div><br>Calcule le prix de $$8\\text{ kg}$$.",
      "answer": "[\"p8\"]",
      "options": {
        "formula_code": "setNB(1)\nu=RD(2,7)\np3=3*u\np5=5*u\np8=p3+p5"
      },
      "footer": "$$[[formula]]\\text{ €}$$"
    },
    {
      "n": 3,
      "statement": "Un lot de $$${n}$$ billets de cinéma coûte $$${p}\\text{ €}$$.<br>Quel est le prix d’un seul billet ?",
      "answer": "[\"u\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(3,8)\nu=RD(4,12)\np=n*u"
      },
      "footer": "$$[[formula]]\\text{ €}$$"
    },
    {
      "n": 4,
      "statement": "Chez un primeur, $$${q1}\\text{ kg}$$ de pommes coûtent $$${p1}\\text{ €}$$.<br>Combien coûtent $$${q2}\\text{ kg}$$ de pommes ?",
      "answer": "[\"p2\"]",
      "options": {
        "formula_code": "setNB(1)\nu=RD(2,5)\nq1=RD(5,9)\nq2=RD(2,4)\np1=q1*u\np2=q2*u"
      },
      "footer": "$$[[formula]]\\text{ €}$$"
    },
    {
      "n": 5,
      "statement": "Le tableau est un tableau de proportionnalité.<br><div class=\"proportion-table-wrap\"><table class=\"proportion-table\"><tr><td>nombre d’objets</td><td>$$${q1}$$</td><td>$$${q2Cell}$$</td></tr><tr><td>prix en €</td><td>$$${p1}$$</td><td>$$${p2Cell}$$</td></tr></table></div><br>Complète le tableau.",
      "answer": "[\"target\"]",
      "options": {
        "formula_code": "setNB(1)\nu=RD(2,8)\nq1=RD(2,5)\nm=RD(2,4)\nq2=q1*m\np1=q1*u\np2=q2*u\nunknownTop=RD(1)\nq2Cell=unknownTop?\"?\":q2\np2Cell=unknownTop?p2:\"?\"\ntarget=unknownTop?q2:p2"
      },
      "footer": "$$[[formula]]$$"
    },
    {
      "n": 6,
      "statement": "Sur une carte, $$${c}\\text{ cm}$$ représentent $$${d}\\text{ km}$$ dans la réalité.<br>Combien de kilomètres représente $$1\\text{ cm}$$ sur cette carte ?",
      "answer": "[\"u\"]",
      "options": {
        "formula_code": "setNB(1)\nc=RD(2,6)\nu=RD(2,9)\nd=c*u"
      },
      "footer": "$$[[formula]]\\text{ km}$$"
    },
    {
      "n": 7,
      "statement": "Une voiture consomme $$${c}\\text{ L}$$ de carburant pour parcourir $$100\\text{ km}$$.<br>Combien de litres consomme-t-elle pour parcourir $$${d}\\text{ km}$$ ?",
      "answer": "[\"r\"]",
      "options": {
        "formula_code": "setNB(1)\nc=RD(4,9)\nm=RD(2,6)\nd=100*m\nr=c*m"
      },
      "footer": "$$[[formula]]\\text{ L}$$"
    },
    {
      "n": 8,
      "statement": "Pour une recette, il faut $$${q4}\\text{ g}$$ de sucre pour $$4$$ personnes.<br>Quelle quantité de sucre faut-il pour $$${n}$$ personnes ?",
      "answer": "[\"qn\"]",
      "options": {
        "formula_code": "setNB(1)\nu=RD(40,120)\nq4=4*u\nn=RD(2,10,[4])\nqn=n*u"
      },
      "footer": "$$[[formula]]\\text{ g}$$"
    },
    {
      "n": 9,
      "statement": "Dans une situation de proportionnalité, $$${q1}$$ articles coûtent $$${p1}\\text{ €}$$ et $$${q2}$$ articles coûtent $$${p2}\\text{ €}$$.<br>Combien coûtent $$${q3}$$ articles ?",
      "answer": "[\"p3\"]",
      "options": {
        "formula_code": "setNB(1)\nu=RD(2,9)\nq1=RD(2,5)\nq2=RD(2,5,[q1])\nq3=q1+q2\np1=q1*u\np2=q2*u\np3=p1+p2"
      },
      "footer": "$$[[formula]]\\text{ €}$$"
    },
    {
      "n": 10,
      "statement": "On sait que $$${q1}$$ bouteilles coûtent $$${p1}\\text{ €}$$. On veut calculer le prix de $$${q2}$$ bouteilles.<br>Quelle procédure est adaptée ?&&Multiplier le prix de $$${q1}$$ bouteilles par $$${m}$$.&&Ajouter $$${m}$$ au prix de $$${q1}$$ bouteilles.&&Diviser le prix de $$${q1}$$ bouteilles par $$${m}$$.&&Multiplier le prix de $$${q1}$$ bouteilles par $$${q2}$$.&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nu=RD(2,6)\nq1=RD(2,5)\nm=RD(2,4)\nq2=q1*m\np1=q1*u",
        "shuffle_answers": true
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 11,
      "statement": "Ce tableau est un tableau de proportionnalité. Calcule le nombre manquant.<div class=\"proportion-table-wrap proportion-bare-table-wrap\"><table class=\"proportion-table proportion-bare-table\"><tr><td>$$${x1}$$</td><td>$$${x2Cell}$$</td></tr><tr><td>$$${y1}$$</td><td>$$${y2Cell}$$</td></tr></table></div>",
      "answer": "[\"target\"]",
      "options": {
        "formula_code": "setNB(1)\nx1=RD(2,6)\nm=RD(2,4)\nk=RD(2,8)\nx2=x1*m\ny1=x1*k\ny2=x2*k\nunknownTop=RD(1)\nx2Cell=unknownTop?\"?\":x2\ny2Cell=unknownTop?y2:\"?\"\ntarget=unknownTop?x2:y2"
      },
      "footer": "$$[[formula]]$$"
    }
  ]
};
