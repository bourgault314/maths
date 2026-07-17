const MODULE_DNB_35 = {
  "id": "dnb_35",
  "num": 35,
  "title": "Augmentation et diminution en pourcentage",
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
      "statement": "Un article coûte $$${prix}\\text{ €}$$. Son prix augmente de $$${p}\\%$$.<br>Quel est son nouveau prix ?",
      "answer": "[\"nouveau\"]",
      "options": {
        "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]\nprix=RD(2,30)*20\nnouveau=prix*(100+p)/100",
        "evolution_kind": "increase_total"
      },
      "footer": "$$[[formula]]\\text{ €}$$"
    },
    {
      "n": 2,
      "statement": "Un vélo coûte $$${prix}\\text{ €}$$. Pendant les soldes, son prix diminue de $$${p}\\%$$.<br>Quel est son nouveau prix ?",
      "answer": "[\"nouveau\"]",
      "options": {
        "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]\nprix=RD(2,30)*20\nnouveau=prix*(100-p)/100",
        "evolution_kind": "decrease_total"
      },
      "footer": "$$[[formula]]\\text{ €}$$"
    },
    {
      "n": 3,
      "statement": "Dans une ville, il y avait $$${n}$$ habitants. La population augmente de $$${p}\\%$$.<br>Combien y a-t-il d’habitants après cette augmentation ?",
      "answer": "[\"nouveau\"]",
      "options": {
        "formula_code": "setNB(1)\np=[5,10,20,25,50][RD(4)]\nn=RD(10,80)*20\nnouveau=n*(100+p)/100",
        "evolution_kind": "increase_total"
      },
      "footer": "$$[[formula]]\\text{ habitants}$$"
    },
    {
      "n": 4,
      "statement": "Un collège compte $$${n}$$ élèves. L’année suivante, l’effectif diminue de $$${p}\\%$$.<br>Quel est le nouvel effectif ?",
      "answer": "[\"nouveau\"]",
      "options": {
        "formula_code": "setNB(1)\np=[5,10,20,25,50][RD(4)]\nn=RD(10,80)*20\nnouveau=n*(100-p)/100",
        "evolution_kind": "decrease_total"
      },
      "footer": "$$[[formula]]\\text{ élèves}$$"
    },
    {
      "n": 5,
      "statement": "Augmenter une quantité de $$${p}\\%$$ revient à la multiplier par quel coefficient ?",
      "answer": "[\"1+p/100\"]",
      "options": {
        "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]",
        "evolution_kind": "increase_coefficient"
      },
      "footer": "$$[[formula]]$$"
    },
    {
      "n": 6,
      "statement": "Diminuer une quantité de $$${p}\\%$$ revient à la multiplier par quel coefficient ?",
      "answer": "[\"1-p/100\"]",
      "options": {
        "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]",
        "evolution_kind": "decrease_coefficient"
      },
      "footer": "$$[[formula]]$$"
    },
    {
      "n": 7,
      "statement": "Un prix de $$${prix}\\text{ €}$$ subit une hausse de $$${p}\\%$$.<br>Quelle expression permet de calculer le nouveau prix ?&&$$${prix}\\times ${coef}$$&&$$${prix}+${p}$$&&$$${prix}\\times ${p}$$&&$$${prix}\\div ${coef}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\np=[10,20,25,50][RD(3)]\nprix=RD(2,20,[5])*20\ncoef=1+p/100",
        "shuffle_answers": true,
        "evolution_kind": "increase_qcm"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 8,
      "statement": "Un prix de $$${prix}\\text{ €}$$ subit une remise de $$${p}\\%$$.<br>Quelle expression permet de calculer le nouveau prix ?&&$$${prix}\\times ${coef}$$&&$$${prix}-${p}$$&&$$${prix}\\times ${p}$$&&$$${prix}\\div ${coef}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\np=[10,20,25,50][RD(3)]\nprix=RD(2,20,[5])*20\ncoef=1-p/100",
        "shuffle_answers": true,
        "evolution_kind": "decrease_qcm"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 9,
      "statement": "Un magasin applique une remise de $$${p}\\%$$ sur tous les articles.<div class=\"legacy-statement-table-wrap legacy-table-dnb_35-9-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_35-9\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">ancien prix</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${prix}\\text{ €}$$</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">remise</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p}\\%$$</td></tr></table></div>Calcule le prix après remise.",
      "answer": "[\"nouveau\"]",
      "options": {
        "formula_code": "setNB(1)\np=[10,20,25,50][RD(3)]\nprix=RD(3,30)*20\nnouveau=prix*(100-p)/100",
        "evolution_kind": "decrease_total"
      },
      "footer": "$$[[formula]]\\text{ €}$$"
    },
    {
      "n": 10,
      "statement": "Une quantité vaut d’abord $$${qte}$$. Elle augmente de $$${p}\\%$$.<br>De combien cette quantité a-t-elle augmenté ?",
      "answer": "[\"hausse\"]",
      "options": {
        "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]\nqte=RD(2,30)*20\nhausse=qte*p/100",
        "evolution_kind": "increase_amount"
      },
      "footer": "$$[[formula]]$$"
    }
  ]
};
