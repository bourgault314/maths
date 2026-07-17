const MODULE_DNB_29 = {
  "id": "dnb_29",
  "num": 29,
  "title": "Fréquences simples",
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
      "statement": "Lors d’un sondage, $$${e}$$ élèves sur $$${n}$$ répondent « oui ».<br>Quelle est la fréquence des réponses « oui » ?",
      "answer": "[\"e/g\",\"n/g\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(18,36)\ne=RD(3,n-3)\ng=GCD(e,n)"
      },
      "footer": "$$f=[[formula_frac]]$$"
    },
    {
      "n": 2,
      "statement": "Dans une classe, on a relevé l’activité pratiquée par les élèves :<div class=\"legacy-statement-table-wrap legacy-table-dnb_29-2-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_29-2\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">activité</td><td style=\"border:1px solid #555;padding:8px 18px\">sport</td><td style=\"border:1px solid #555;padding:8px 18px\">musique</td><td style=\"border:1px solid #555;padding:8px 18px\">dessin</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${sport}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${musique}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${dessin}$$</td></tr></table></div>Quelle est la fréquence des élèves qui pratiquent le sport ?",
      "answer": "[\"sport/g\",\"total/g\"]",
      "options": {
        "formula_code": "setNB(1)\nsport=RD(5,14)\nmusique=RD(4,12)\ndessin=RD(3,10)\ntotal=sport+musique+dessin\ng=GCD(sport,total)"
      },
      "footer": "$$f=[[formula_frac]]$$"
    },
    {
      "n": 3,
      "statement": "On lance un dé $$${n}$$ fois. Le nombre $$6$$ est sorti $$${e}$$ fois.<br>Exprime la fréquence d’apparition du nombre $$6$$ sous forme décimale. Arrondis au centième si nécessaire.",
      "answer": "[\"CUT(e/n,2)\"]",
      "options": {
        "formula_code": "setNB(1)\nn=[20,25,40,50][RD(3)]\ne=RD(1,n-1)"
      },
      "footer": "$$f=[[formula]]$$"
    },
    {
      "n": 4,
      "statement": "Pour calculer une fréquence, quelle formule faut-il utiliser ?&&$$\\text{fréquence}=\\dfrac{\\text{effectif de la valeur}}{\\text{effectif total}}$$&&$$\\text{fréquence}=\\dfrac{\\text{effectif total}}{\\text{effectif de la valeur}}$$&&$$\\text{fréquence}=\\text{effectif total}-\\text{effectif de la valeur}$$&&$$\\text{fréquence}=\\text{effectif de la valeur}+\\text{effectif total}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 5,
      "statement": "Dans une urne, on compte les boules suivantes :<div class=\"legacy-statement-table-wrap legacy-table-dnb_29-5-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_29-5\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">couleur</td><td style=\"border:1px solid #555;padding:8px 18px\">rouge</td><td style=\"border:1px solid #555;padding:8px 18px\">bleue</td><td style=\"border:1px solid #555;padding:8px 18px\">verte</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${r}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${b}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${v}$$</td></tr></table></div>Quelle est la fréquence des boules ${couleur}s ?",
      "answer": "[\"fav/g\",\"total/g\"]",
      "options": {
        "formula_code": "setNB(1)\nr=RD(2,9)\nb=RD(2,9)\nv=RD(2,9)\nchoix=RD(0,2)\ncouleur=[\"rouge\",\"bleue\",\"verte\"][choix]\nfav=choix==0?r:(choix==1?b:v)\ntotal=r+b+v\ng=GCD(fav,total)"
      },
      "footer": "$$f=[[formula_frac]]$$"
    },
    {
      "n": 6,
      "statement": "Dans un collège, $$${e}$$ élèves sur $$${n}$$ viennent en bus.<br>Complète la fraction donnant la fréquence des élèves qui viennent en bus.",
      "answer": "[\"e/g\",\"n/g\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(30,80)\ne=RD(5,n-5)\ng=GCD(e,n)"
      },
      "footer": "$$f=\\dfrac{[[formula]]}{[[formula]]}$$"
    },
    {
      "n": 7,
      "statement": "Dans une série de $$${n}$$ résultats, la fréquence de la valeur A est $$\\dfrac{${num}}{${den}}$$.<br>Combien de résultats correspondent à la valeur A ?",
      "answer": "[\"e\"]",
      "options": {
        "formula_code": "setNB(1)\nden=[4,5,10][RD(2)]\nnum=RD(1,den-1)\nk=RD(2,8)\nn=den*k\ne=num*k"
      },
      "footer": "$$[[formula]]$$"
    },
    {
      "n": 8,
      "statement": "Dans une classe de $$25$$ élèves, $$10$$ élèves portent des lunettes.<br>Quelle est la fréquence des élèves qui portent des lunettes ?&&$$\\dfrac{2}{5}$$&&$$\\dfrac{10}{15}$$&&$$\\dfrac{15}{25}$$&&$$\\dfrac{25}{10}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 9,
      "statement": "Dans un groupe de $$${n}$$ personnes, $$${e}$$ personnes ont choisi la réponse A.<br>Exprime la fréquence de la réponse A en pourcentage.",
      "answer": "[\"100*e/n\"]",
      "options": {
        "formula_code": "setNB(1)\nn=[20,25,50][RD(2)]\ne=RD(1,n-1)"
      },
      "footer": "$$f=[[formula]]\\%$$"
    },
    {
      "n": 10,
      "statement": "Dans une classe, il y a $$12$$ filles et $$10$$ garçons. Parmi les filles, $$8$$ portent des lunettes.<br>On étudie la classe entière. Quelle est la fréquence des filles qui portent des lunettes ?&&$$\\dfrac{8}{22}$$&&$$\\dfrac{8}{12}$$&&$$\\dfrac{12}{22}$$&&$$\\dfrac{8}{10}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    }
  ]
};
