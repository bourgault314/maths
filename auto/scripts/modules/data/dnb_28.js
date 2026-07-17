const MODULE_DNB_28 = {
  "id": "dnb_28",
  "num": 28,
  "title": "Probabilités — équiprobabilité",
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
      "statement": "Une urne contient des boules indiscernables au toucher :<div class=\"legacy-statement-table-wrap legacy-table-dnb_28-1-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_28-1\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">couleur</td><td style=\"border:1px solid #555;padding:8px 18px\">rouge</td><td style=\"border:1px solid #555;padding:8px 18px\">bleue</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">nombre</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${r}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${b}$$</td></tr></table></div>On tire une boule au hasard. Quelle est la probabilité de tirer une boule rouge ?",
      "answer": "[\"r/g\",\"n/g\"]",
      "options": {
        "formula_code": "setNB(1)\nr=RD(1,8)\nb=RD(1,8)\nn=r+b\ng=GCD(r,n)"
      },
      "footer": "$$P(\\text{rouge})=[[formula_frac]]$$"
    },
    {
      "n": 2,
      "statement": "On lance un dé équilibré à 6 faces numérotées de 1 à 6.<br>Quelle est la probabilité d’obtenir un nombre inférieur ou égal à $$${k}$$ ?",
      "answer": "[\"k/g\",\"6/g\"]",
      "options": {
        "formula_code": "setNB(1)\nk=RD(1,5)\ng=GCD(k,6)"
      },
      "footer": "$$P=[[formula_frac]]$$"
    },
    {
      "n": 3,
      "statement": "Une roue est partagée en secteurs de même taille.<div class=\"legacy-statement-table-wrap legacy-table-dnb_28-3-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_28-3\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">couleur</td><td style=\"border:1px solid #555;padding:8px 18px\">rouge</td><td style=\"border:1px solid #555;padding:8px 18px\">bleu</td><td style=\"border:1px solid #555;padding:8px 18px\">vert</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">nombre de secteurs</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${r}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${bl}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${v}$$</td></tr></table></div>Quelle est la probabilité que la roue s’arrête sur la couleur ${couleur} ?",
      "answer": "[\"fav/g\",\"total/g\"]",
      "options": {
        "formula_code": "setNB(1)\nr=RD(1,4)\nbl=RD(1,4)\nv=RD(1,4)\nchoix=RD(0,2)\ncouleur=[\"rouge\",\"bleu\",\"vert\"][choix]\nfav=choix==0?r:(choix==1?bl:v)\ntotal=r+bl+v\ng=GCD(fav,total)"
      },
      "footer": "$$P=[[formula_frac]]$$"
    },
    {
      "n": 4,
      "statement": "On lance un dé équilibré à 6 faces. Quelle est la probabilité d’obtenir un nombre pair ?&&$$\\dfrac{1}{2}$$&&$$\\dfrac{1}{3}$$&&$$\\dfrac{2}{3}$$&&$$\\dfrac{5}{6}$$&&",
      "answer": "[\"1\",\"4\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm]]"
    },
    {
      "n": 5,
      "statement": "On choisit au hasard une carte parmi des cartes numérotées de $$1$$ à $$${n}$$.<br>Quelle est la probabilité d’obtenir un multiple de $$3$$ ?",
      "answer": "[\"fav/g\",\"n/g\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(6,12)\nfav=floor(n/3)\ng=GCD(fav,n)"
      },
      "footer": "$$P=[[formula_frac]]$$"
    },
    {
      "n": 6,
      "statement": "On choisit au hasard une lettre du mot :<br><div style=\"text-align:center;font-size:24px;font-weight:bold;letter-spacing:6px\">MATHS</div><br>Chaque lettre a la même probabilité d’être choisie. Quelle est la probabilité de choisir une consonne ?&&$$\\dfrac{4}{5}$$&&$$\\dfrac{2}{5}$$&&$$\\dfrac{1}{5}$$&&$$\\dfrac{5}{3}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 7,
      "statement": "On lance une pièce équilibrée et un dé équilibré à 6 faces.<br>On considère tous les résultats possibles équiprobables.<br>Quelle est la probabilité d’obtenir « pile » et un nombre pair ?",
      "answer": "[\"1\",\"4\"]",
      "options": null,
      "footer": "$$P=[[frac-simp]]$$"
    },
    {
      "n": 8,
      "statement": "Une urne contient uniquement des boules rouges et des boules bleues.<br>On tire une boule au hasard. Quelle est la probabilité de tirer une boule verte ?&&$$0$$&&$$1$$&&$$\\dfrac{1}{2}$$&&On ne peut pas savoir.&&",
      "answer": "[\"1\"]",
      "options": {
        "shuffle_answers": true
      },
      "footer": "[[qcm1]]"
    },
    {
      "n": 9,
      "statement": "Dans une classe, on choisit un élève au hasard. Les effectifs sont donnés dans le tableau :<div class=\"legacy-statement-table-wrap legacy-table-dnb_28-9-wrap\"><table class=\"legacy-statement-table legacy-table-dnb_28-9\" style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">niveau</td><td style=\"border:1px solid #555;padding:8px 18px\">6e</td><td style=\"border:1px solid #555;padding:8px 18px\">5e</td><td style=\"border:1px solid #555;padding:8px 18px\">4e</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${a}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${b}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${c}$$</td></tr></table></div>Quelle est la probabilité de choisir un élève de 5e ?",
      "answer": "[\"b/g\",\"total/g\"]",
      "options": {
        "formula_code": "setNB(1)\na=RD(8,15)\nb=RD(8,15)\nc=RD(8,15)\ntotal=a+b+c\ng=GCD(b,total)"
      },
      "footer": "$$P(\\text{5e})=[[formula_frac]]$$"
    },
    {
      "n": 10,
      "statement": "Un sac contient $$${r}$$ jetons rouges, $$${b}$$ jetons bleus et $$${v}$$ jetons verts.<br>On tire un jeton au hasard. Quelle est la probabilité de ne pas tirer un jeton bleu ?",
      "answer": "[\"fav/g\",\"total/g\"]",
      "options": {
        "formula_code": "setNB(1)\nr=RD(1,6)\nb=RD(1,6)\nv=RD(1,6)\ntotal=r+b+v\nfav=r+v\ng=GCD(fav,total)"
      },
      "footer": "$$P(\\text{pas bleu})=[[formula_frac]]$$"
    }
  ]
};
