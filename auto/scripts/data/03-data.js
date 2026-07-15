const RAW_DATA_MODULES = [
  {
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
        "statement": "Une urne contient des boules indiscernables au toucher :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">couleur</td><td style=\"border:1px solid #555;padding:8px 18px\">rouge</td><td style=\"border:1px solid #555;padding:8px 18px\">bleue</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">nombre</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${r}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${b}$$</td></tr></table><br>On tire une boule au hasard. Quelle est la probabilité de tirer une boule rouge ?",
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
        "statement": "Une roue est partagée en secteurs de même taille.\n\n<table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">couleur</td><td style=\"border:1px solid #555;padding:8px 18px\">rouge</td><td style=\"border:1px solid #555;padding:8px 18px\">bleu</td><td style=\"border:1px solid #555;padding:8px 18px\">vert</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">nombre de secteurs</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${r}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${bl}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${v}$$</td></tr></table><br>Quelle est la probabilité que la roue s’arrête sur la couleur ${couleur} ?",
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
        "statement": "Dans une classe, on choisit un élève au hasard. Les effectifs sont donnés dans le tableau :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">niveau</td><td style=\"border:1px solid #555;padding:8px 18px\">6e</td><td style=\"border:1px solid #555;padding:8px 18px\">5e</td><td style=\"border:1px solid #555;padding:8px 18px\">4e</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${a}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${b}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${c}$$</td></tr></table><br>Quelle est la probabilité de choisir un élève de 5e ?",
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
  },
  {
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
        "statement": "Dans une classe, on a relevé l’activité pratiquée par les élèves :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">activité</td><td style=\"border:1px solid #555;padding:8px 18px\">sport</td><td style=\"border:1px solid #555;padding:8px 18px\">musique</td><td style=\"border:1px solid #555;padding:8px 18px\">dessin</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${sport}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${musique}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${dessin}$$</td></tr></table><br>Quelle est la fréquence des élèves qui pratiquent le sport ?",
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
        "statement": "Dans une urne, on compte les boules suivantes :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">couleur</td><td style=\"border:1px solid #555;padding:8px 18px\">rouge</td><td style=\"border:1px solid #555;padding:8px 18px\">bleue</td><td style=\"border:1px solid #555;padding:8px 18px\">verte</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${r}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${b}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${v}$$</td></tr></table><br>Quelle est la fréquence des boules ${couleur}s ?",
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
  },
  {
    "id": "dnb_30",
    "num": 30,
    "title": "Moyennes",
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
        "statement": "On considère les trois valeurs : $$${a}$$, $$${b}$$ et $$${c}$$.<br>Exprime leur moyenne sous forme de fraction.",
        "answer": "[\"s/g\",\"3/g\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,18)\nb=RD(2,18)\nc=RD(2,18)\ns=a+b+c\ng=GCD(s,3)"
        },
        "footer": "$$\\text{moyenne}=[[formula_frac]]$$"
      },
      {
        "n": 2,
        "statement": "Calcule la moyenne des quatre valeurs suivantes :<br><div style=\"text-align:center;font-size:22px\">$$${a} \\quad ; \\quad ${b} \\quad ; \\quad ${c} \\quad ; \\quad ${d}$$</div>",
        "answer": "[\"m\"]",
        "options": {
          "formula_code": "setNB(1)\nm=RD(6,18)\nd1=RD(1,4)\nd2=RD(1,4)\na=m-d1\nb=m+d1\nc=m-d2\nd=m+d2"
        },
        "footer": "$$\\text{moyenne}=[[formula]]$$"
      },
      {
        "n": 3,
        "statement": "Voici les notes obtenues à une évaluation :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">note</td><td style=\"border:1px solid #555;padding:8px 18px\">8</td><td style=\"border:1px solid #555;padding:8px 18px\">12</td><td style=\"border:1px solid #555;padding:8px 18px\">16</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e3}$$</td></tr></table><br>Calcule la moyenne des notes. Arrondis au dixième si nécessaire.",
        "answer": "[\"CUT((8*e1+12*e2+16*e3)/(e1+e2+e3),1)\"]",
        "options": {
          "formula_code": "setNB(1)\ne1=RD(2,8)\ne2=RD(2,8)\ne3=RD(2,8)"
        },
        "footer": "$$\\text{moyenne}=[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "Quelle formule permet de calculer la moyenne d’une série de valeurs ?&&$$\\text{moyenne}=\\dfrac{\\text{somme des valeurs}}{\\text{nombre de valeurs}}$$&&$$\\text{moyenne}=\\dfrac{\\text{nombre de valeurs}}{\\text{somme des valeurs}}$$&&$$\\text{moyenne}=\\text{plus grande valeur}-\\text{plus petite valeur}$$&&$$\\text{moyenne}=\\text{somme des valeurs}+\\text{nombre de valeurs}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 5,
        "statement": "La moyenne des quatre nombres $$${a}$$, $$${b}$$, $$${c}$$ et $$x$$ est $$${m}$$.<br>Calcule la valeur de $$x$$.",
        "answer": "[\"x\"]",
        "options": {
          "formula_code": "setNB(1)\nm=RD(8,18)\nd1=RD(1,4)\nd2=RD(1,4)\na=m+d1\nb=m-d1\nc=m+d2\nx=m-d2"
        },
        "footer": "$$x=[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Une série de $$${n}$$ valeurs a pour somme $$${s}$$.<br>Exprime sa moyenne.",
        "answer": "[\"m\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(3,9)\nm=RD(4,20)\ns=n*m"
        },
        "footer": "$$\\text{moyenne}=[[formula]]$$"
      },
      {
        "n": 7,
        "statement": "La moyenne de $$${n}$$ valeurs est $$${m}$$.<br>Quelle est la somme de ces $$${n}$$ valeurs ?",
        "answer": "[\"n*m\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(3,10)\nm=RD(5,18)"
        },
        "footer": "$$\\text{somme}=[[formula]]$$"
      },
      {
        "n": 8,
        "statement": "Toutes les valeurs d’une série sont comprises entre $$${mini}$$ et $$${maxi}$$.<br>La moyenne de cette série peut-elle être égale à $$${val}$$ ?&&Oui&&Non&&On ne peut pas savoir&&",
        "answer": "[\"2\"]",
        "options": {
          "formula_code": "setNB(1)\nmini=RD(2,8)\nmaxi=mini+RD(4,8)\nval=maxi+RD(1,4)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 9,
        "statement": "On a demandé à des familles le nombre d’enfants qu’elles ont. Les résultats sont donnés dans le tableau :\n\n<table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">nombre d’enfants</td><td style=\"border:1px solid #555;padding:8px 18px\">0</td><td style=\"border:1px solid #555;padding:8px 18px\">1</td><td style=\"border:1px solid #555;padding:8px 18px\">2</td><td style=\"border:1px solid #555;padding:8px 18px\">3</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e0}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e3}$$</td></tr></table><br>Calcule le nombre moyen d’enfants par famille. Donne une valeur approchée à 0,01 près par défaut ou par excès.",
        "answer": "[\"r1;r2\"]",
        "options": {
          "formula_code": "setNB(1)\ne0=RD(1,8)\ne1=RD(1,8)\ne2=RD(1,8)\ne3=RD(1,8)\nr=(e1+2*e2+3*e3)/(e0+e1+e2+e3)\nr1=floor(r*100)/100\nr2=ceil(r*100)/100"
        },
        "footer": "$$\\text{moyenne}=[[formula]]$$"
      },
      {
        "n": 10,
        "statement": "Deux longueurs mesurent $$${x}\\text{ cm}$$ et $$${y}\\text{ cm}$$.<br>Calcule leur moyenne. Arrondis au centième si nécessaire.",
        "answer": "[\"CUT((x+y)/2,2)\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(20,80)\nb=RD(20,80)\nx=a/10\ny=b/10"
        },
        "footer": "$$\\text{moyenne}=[[formula]]\\text{ cm}$$"
      }
    ]
  },
  {
    "id": "dnb_31",
    "num": 31,
    "title": "Médiane d’une petite série",
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
        "statement": "Détermine la médiane de la série suivante :<br><div style=\"text-align:center;font-size:22px\">$$${c} \\quad ; \\quad ${a} \\quad ; \\quad ${b}$$</div>",
        "answer": "[\"b\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,8)\nb=a+RD(1,5)\nc=b+RD(1,5)"
        },
        "footer": "$$\\text{médiane}=[[formula]]$$"
      },
      {
        "n": 2,
        "statement": "Détermine la médiane de la série suivante :<br><div style=\"text-align:center;font-size:22px\">$$${e} \\quad ; \\quad ${a} \\quad ; \\quad ${d} \\quad ; \\quad ${b} \\quad ; \\quad ${c}$$</div>",
        "answer": "[\"c\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(1,6)\nb=a+RD(1,3)\nc=b+RD(1,3)\nd=c+RD(1,3)\ne=d+RD(1,3)"
        },
        "footer": "$$\\text{médiane}=[[formula]]$$"
      },
      {
        "n": 3,
        "statement": "Détermine la médiane de la série suivante :<br><div style=\"text-align:center;font-size:22px\">$$${d} \\quad ; \\quad ${a} \\quad ; \\quad ${c} \\quad ; \\quad ${b}$$</div>",
        "answer": "[\"m\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(1,8)\nb=a+RD(1,4)\nc=b+RD(1,4)\nd=c+RD(1,4)\nm=(b+c)/2"
        },
        "footer": "$$\\text{médiane}=[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "La série suivante est déjà rangée dans l’ordre croissant :<br><div style=\"text-align:center;font-size:22px\">$$${a} \\quad ; \\quad ${b} \\quad ; \\quad ${c} \\quad ; \\quad ${d} \\quad ; \\quad ${e} \\quad ; \\quad ${f}$$</div><br>Détermine sa médiane.",
        "answer": "[\"m\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(1,4)\nb=a+RD(1,3)\nc=b+RD(1,3)\nd=c+RD(1,3)\ne=d+RD(1,3)\nf=e+RD(1,3)\nm=(c+d)/2"
        },
        "footer": "$$\\text{médiane}=[[formula]]$$"
      },
      {
        "n": 5,
        "statement": "Pour déterminer la médiane d’une série, quelle méthode est correcte ?&&Ranger les valeurs dans l’ordre croissant puis chercher la valeur centrale.&&Additionner toutes les valeurs puis diviser par leur nombre.&&Prendre la valeur qui apparaît le plus souvent.&&Prendre la plus grande valeur de la série.&&",
        "answer": "[\"1\"]",
        "options": {
          "shuffle_answers": true
        },
        "footer": "[[qcm1]]"
      },
      {
        "n": 6,
        "statement": "Voici les températures relevées pendant une semaine :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 14px\">jour</td><td style=\"border:1px solid #555;padding:8px 14px\">lun.</td><td style=\"border:1px solid #555;padding:8px 14px\">mar.</td><td style=\"border:1px solid #555;padding:8px 14px\">mer.</td><td style=\"border:1px solid #555;padding:8px 14px\">jeu.</td><td style=\"border:1px solid #555;padding:8px 14px\">ven.</td><td style=\"border:1px solid #555;padding:8px 14px\">sam.</td><td style=\"border:1px solid #555;padding:8px 14px\">dim.</td></tr><tr><td style=\"border:1px solid #555;padding:8px 14px\">température</td><td style=\"border:1px solid #555;padding:8px 14px\">$$${v4}$$</td><td style=\"border:1px solid #555;padding:8px 14px\">$$${v1}$$</td><td style=\"border:1px solid #555;padding:8px 14px\">$$${v7}$$</td><td style=\"border:1px solid #555;padding:8px 14px\">$$${v3}$$</td><td style=\"border:1px solid #555;padding:8px 14px\">$$${v5}$$</td><td style=\"border:1px solid #555;padding:8px 14px\">$$${v2}$$</td><td style=\"border:1px solid #555;padding:8px 14px\">$$${v6}$$</td></tr></table><br>Détermine la température médiane.",
        "answer": "[\"v4\"]",
        "options": {
          "formula_code": "setNB(1)\nv1=RD(18,22)\nv2=v1+RD(1,2)\nv3=v2+RD(1,2)\nv4=v3+RD(1,2)\nv5=v4+RD(1,2)\nv6=v5+RD(1,2)\nv7=v6+RD(1,2)"
        },
        "footer": "$$\\text{médiane}=[[formula]]\\,°\\text{C}$$"
      },
      {
        "n": 7,
        "statement": "Voici les notes obtenues par un petit groupe d’élèves :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">élève</td><td style=\"border:1px solid #555;padding:8px 18px\">A</td><td style=\"border:1px solid #555;padding:8px 18px\">B</td><td style=\"border:1px solid #555;padding:8px 18px\">C</td><td style=\"border:1px solid #555;padding:8px 18px\">D</td><td style=\"border:1px solid #555;padding:8px 18px\">E</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">note</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${b}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${e}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${a}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${d}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${c}$$</td></tr></table><br>Détermine la note médiane.",
        "answer": "[\"c\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(4,8)\nb=a+RD(1,3)\nc=b+RD(1,3)\nd=c+RD(1,3)\ne=d+RD(1,3)"
        },
        "footer": "$$\\text{médiane}=[[formula]]$$"
      },
      {
        "n": 8,
        "statement": "Un élève affirme : « La médiane de la série $$${a} ; ${b} ; ${c} ; ${d} ; ${e}$$ est forcément $$${c}$$ car cette valeur est au milieu de l’écriture. »<br>Cette affirmation est-elle correcte ?&&Oui, car $$${c}$$ est écrit au milieu.&&Non, il faut d’abord ranger les valeurs dans l’ordre croissant.&&Oui, car il y a cinq valeurs.&&Non, la médiane est toujours la moyenne des valeurs.&&",
        "answer": "[\"2\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(2,5)\nb=a+RD(1,3)\nc=b+RD(4,6)\nd=b+RD(1,2)\ne=d+RD(1,2)",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 9,
        "statement": "Détermine la médiane de la série suivante, qui contient des valeurs répétées :<br><div style=\"text-align:center;font-size:22px\">$$${a} \\quad ; \\quad ${m} \\quad ; \\quad ${b} \\quad ; \\quad ${m} \\quad ; \\quad ${c}$$</div>",
        "answer": "[\"m\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(1,5)\nm=a+RD(1,4)\nb=a\nc=m+RD(1,4)"
        },
        "footer": "$$\\text{médiane}=[[formula]]$$"
      },
      {
        "n": 10,
        "statement": "La série suivante est déjà rangée dans l’ordre croissant :<br><div style=\"text-align:center;font-size:22px\">$$${a} \\quad ; \\quad ${b} \\quad ; \\quad ${c} \\quad ; \\quad ${d}$$</div><br>Quelle est sa médiane ?",
        "answer": "[\"m\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(1,6)\nb=a+RD(1,4)\nc=b+RD(1,4)\nd=c+RD(1,4)\nm=(b+c)/2"
        },
        "footer": "$$\\text{médiane}=[[formula]]$$"
      }
    ]
  },
  {
    "id": "dnb_32",
    "num": 32,
    "title": "Tableaux diagrammes graphiques",
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
        "statement": "Le tableau donne le nombre de livres empruntés au CDI pendant une semaine :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">jour</td><td style=\"border:1px solid #555;padding:8px 18px\">lundi</td><td style=\"border:1px solid #555;padding:8px 18px\">mardi</td><td style=\"border:1px solid #555;padding:8px 18px\">mercredi</td><td style=\"border:1px solid #555;padding:8px 18px\">jeudi</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">livres</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${a}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${b}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${c}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${d}$$</td></tr></table><br>Combien de livres ont été empruntés au total ?",
        "answer": "[\"a+b+c+d\"]",
        "options": {
          "formula_code": "setNB(1)\na=RD(8,20)\nb=RD(8,20)\nc=RD(8,20)\nd=RD(8,20)"
        },
        "footer": "$$[[formula]]$$"
      },
      {
        "n": 2,
        "statement": "Le tableau indique le moyen de transport utilisé par des élèves :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">transport</td><td style=\"border:1px solid #555;padding:8px 18px\">bus</td><td style=\"border:1px solid #555;padding:8px 18px\">vélo</td><td style=\"border:1px solid #555;padding:8px 18px\">marche</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">effectif</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${bus}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${velo}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${marche}$$</td></tr></table><br>Quel moyen de transport est le plus utilisé ?&&le bus&&le vélo&&la marche&&",
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
        "statement": "Le tableau donne les résultats d’une enquête sur les sports pratiqués :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 16px\"></td><td style=\"border:1px solid #555;padding:8px 16px\">football</td><td style=\"border:1px solid #555;padding:8px 16px\">basket</td><td style=\"border:1px solid #555;padding:8px 16px\">natation</td></tr><tr><td style=\"border:1px solid #555;padding:8px 16px\">filles</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${f1}$$</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${f2}$$</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${f3}$$</td></tr><tr><td style=\"border:1px solid #555;padding:8px 16px\">garçons</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${g1}$$</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${g2}$$</td><td style=\"border:1px solid #555;padding:8px 16px\">$$${g3}$$</td></tr></table><br>Combien d’élèves pratiquent le basket ?",
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
        "statement": "Dans ce pictogramme, chaque symbole représente $$5$$ élèves.<br><table style=\"border-collapse:collapse;margin:auto;text-align:left;font-size:20px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">anglais</td><td style=\"border:1px solid #555;padding:8px 18px\">★ ★ ★ ★</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">espagnol</td><td style=\"border:1px solid #555;padding:8px 18px\">★ ★ ★</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">portugais</td><td style=\"border:1px solid #555;padding:8px 18px\">★ ★</td></tr></table><br>Combien d’élèves ont choisi l’espagnol ?",
        "answer": "[\"15\"]",
        "options": null,
        "footer": "$$[[int]]$$"
      },
      {
        "n": 10,
        "statement": "Le tableau donne les ventes d’un magasin sur trois jours :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">jour</td><td style=\"border:1px solid #555;padding:8px 18px\">vendredi</td><td style=\"border:1px solid #555;padding:8px 18px\">samedi</td><td style=\"border:1px solid #555;padding:8px 18px\">dimanche</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">ventes</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${v}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${s}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${d}$$</td></tr></table><br>Combien de ventes de plus ont été réalisées samedi par rapport à vendredi ?",
        "answer": "[\"s-v\"]",
        "options": {
          "formula_code": "setNB(1)\nv=RD(20,60)\ns=v+RD(5,25)\nd=RD(20,60)"
        },
        "footer": "$$[[formula]]$$"
      }
    ]
  },
  {
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
        "statement": "Le tableau suivant donne deux grandeurs :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">grandeur A</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${x1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${x2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${x3}$$</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">grandeur B</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y3}$$</td></tr></table><br>Cette situation est-elle une situation de proportionnalité ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nx1=RD(1,4)\nx2=x1+RD(1,4)\nx3=x2+RD(1,4)\nk=RD(2,6)\ny1=k*x1\ny2=k*x2\ny3=k*x3",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 2,
        "statement": "Le tableau suivant donne deux grandeurs :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">grandeur A</td><td style=\"border:1px solid #555;padding:8px 18px\">1</td><td style=\"border:1px solid #555;padding:8px 18px\">2</td><td style=\"border:1px solid #555;padding:8px 18px\">3</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">grandeur B</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${y3}$$</td></tr></table><br>Cette situation est-elle une situation de proportionnalité ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
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
        "statement": "Pour chaque valeur de $$x$$, on calcule $$y=${k}\\times x$$.<br>La grandeur $$y$$ est-elle proportionnelle à la grandeur $$x$$ ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
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
        "statement": "Dans un magasin, le prix payé dépend de la masse achetée :<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">masse en kg</td><td style=\"border:1px solid #555;padding:8px 18px\">2</td><td style=\"border:1px solid #555;padding:8px 18px\">4</td><td style=\"border:1px solid #555;padding:8px 18px\">7</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">prix en €</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p2}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p4}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p7}$$</td></tr></table><br>Le prix est-il proportionnel à la masse ?&&Oui&&Non&&Cela dépend&&Parfois, mais pas tout le temps&&",
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
  },
  {
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
        "statement": "Dans un magasin, le prix est proportionnel à la masse achetée.<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">masse</td><td style=\"border:1px solid #555;padding:8px 18px\">$$3\\text{ kg}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$5\\text{ kg}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$8\\text{ kg}$$</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">prix</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p3}\\text{ €}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p5}\\text{ €}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">?</td></tr></table><br>Calcule le prix de $$8\\text{ kg}$$.",
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
        "statement": "Le tableau est un tableau de proportionnalité.<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">nombre d’objets</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${q1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${q2}$$</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">prix en €</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p1}$$</td><td style=\"border:1px solid #555;padding:8px 18px\">?</td></tr></table><br>Complète le tableau.",
        "answer": "[\"p2\"]",
        "options": {
          "formula_code": "setNB(1)\nu=RD(2,8)\nq1=RD(2,5)\nm=RD(2,4)\nq2=q1*m\np1=q1*u\np2=q2*u"
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
          "formula_code": "setNB(1)\nu=RD(2,9)\nq1=RD(2,5)\nq2=RD(2,5)\nq3=q1+q2\np1=q1*u\np2=q2*u\np3=p1+p2"
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
      }
    ]
  },
  {
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
          "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]\nprix=RD(2,30)*20\nnouveau=prix*(100+p)/100"
        },
        "footer": "$$[[formula]]\\text{ €}$$"
      },
      {
        "n": 2,
        "statement": "Un vélo coûte $$${prix}\\text{ €}$$. Pendant les soldes, son prix diminue de $$${p}\\%$$.<br>Quel est son nouveau prix ?",
        "answer": "[\"nouveau\"]",
        "options": {
          "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]\nprix=RD(2,30)*20\nnouveau=prix*(100-p)/100"
        },
        "footer": "$$[[formula]]\\text{ €}$$"
      },
      {
        "n": 3,
        "statement": "Dans une ville, il y avait $$${n}$$ habitants. La population augmente de $$${p}\\%$$.<br>Combien y a-t-il d’habitants après cette augmentation ?",
        "answer": "[\"nouveau\"]",
        "options": {
          "formula_code": "setNB(1)\np=[5,10,20,25,50][RD(4)]\nn=RD(10,80)*20\nnouveau=n*(100+p)/100"
        },
        "footer": "$$[[formula]]$$"
      },
      {
        "n": 4,
        "statement": "Un collège compte $$${n}$$ élèves. L’année suivante, l’effectif diminue de $$${p}\\%$$.<br>Quel est le nouvel effectif ?",
        "answer": "[\"nouveau\"]",
        "options": {
          "formula_code": "setNB(1)\np=[5,10,20,25,50][RD(4)]\nn=RD(10,80)*20\nnouveau=n*(100-p)/100"
        },
        "footer": "$$[[formula]]$$"
      },
      {
        "n": 5,
        "statement": "Augmenter une quantité de $$${p}\\%$$ revient à la multiplier par quel coefficient ?",
        "answer": "[\"1+p/100\"]",
        "options": {
          "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]"
        },
        "footer": "$$[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Diminuer une quantité de $$${p}\\%$$ revient à la multiplier par quel coefficient ?",
        "answer": "[\"1-p/100\"]",
        "options": {
          "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]"
        },
        "footer": "$$[[formula]]$$"
      },
      {
        "n": 7,
        "statement": "Un prix de $$${prix}\\text{ €}$$ subit une hausse de $$${p}\\%$$.<br>Quelle expression permet de calculer le nouveau prix ?&&$$${prix}\\times ${coef}$$&&$$${prix}+${p}$$&&$$${prix}\\times ${p}$$&&$$${prix}\\div ${coef}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\np=[10,20,25,50][RD(3)]\nprix=RD(4,20)*10\ncoef=1+p/100",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 8,
        "statement": "Un prix de $$${prix}\\text{ €}$$ subit une remise de $$${p}\\%$$.<br>Quelle expression permet de calculer le nouveau prix ?&&$$${prix}\\times ${coef}$$&&$$${prix}-${p}$$&&$$${prix}\\times ${p}$$&&$$${prix}\\div ${coef}$$&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\np=[10,20,25,50][RD(3)]\nprix=RD(4,20)*10\ncoef=1-p/100",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      },
      {
        "n": 9,
        "statement": "Un magasin applique une remise de $$${p}\\%$$ sur tous les articles.<br><table style=\"border-collapse:collapse;margin:auto;text-align:center;font-size:18px\"><tr><td style=\"border:1px solid #555;padding:8px 18px\">ancien prix</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${prix}\\text{ €}$$</td></tr><tr><td style=\"border:1px solid #555;padding:8px 18px\">remise</td><td style=\"border:1px solid #555;padding:8px 18px\">$$${p}\\%$$</td></tr></table><br>Calcule le prix après remise.",
        "answer": "[\"nouveau\"]",
        "options": {
          "formula_code": "setNB(1)\np=[10,20,25,50][RD(3)]\nprix=RD(3,30)*20\nnouveau=prix*(100-p)/100"
        },
        "footer": "$$[[formula]]\\text{ €}$$"
      },
      {
        "n": 10,
        "statement": "Une quantité vaut d’abord $$${qte}$$. Elle augmente de $$${p}\\%$$.<br>De combien cette quantité a-t-elle augmenté ?",
        "answer": "[\"hausse\"]",
        "options": {
          "formula_code": "setNB(1)\np=[5,10,15,20,25,50][RD(5)]\nqte=RD(2,30)*20\nhausse=qte*p/100"
        },
        "footer": "$$[[formula]]$$"
      }
    ]
  },
  {
    "id": "dnb_36",
    "num": 36,
    "title": "Lire un graphique de dépendance",
    "level_tags": [
      "3e",
      "DNB"
    ],
    "source": "import_dnb_zip",
    "has_svg": true,
    "questions": [
      {
        "n": 1,
        "statement": "Le graphique donne la distance parcourue en fonction du temps.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"180\"/><line x1=\"60\" y1=\"150\" x2=\"340\" y2=\"150\"/><line x1=\"60\" y1=\"120\" x2=\"340\" y2=\"120\"/><line x1=\"60\" y1=\"90\" x2=\"340\" y2=\"90\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"180\"/><line x1=\"130\" y1=\"60\" x2=\"130\" y2=\"180\"/><line x1=\"200\" y1=\"60\" x2=\"200\" y2=\"180\"/><line x1=\"270\" y1=\"60\" x2=\"270\" y2=\"180\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"180\"/></g><line x1=\"60\" y1=\"180\" x2=\"350\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"180\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,180 340,175 340,185\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"325\" y=\"215\" font-family=\"sans-serif\" font-size=\"13\">temps (h)</text><text x=\"18\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">distance (km)</text><text x=\"55\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"130\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"200\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"270\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><text x=\"340\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">4</text><text x=\"50\" y=\"184\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"50\" y=\"154\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"50\" y=\"124\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">40</text><text x=\"50\" y=\"94\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">60</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">80</text><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"${y4}\" stroke=\"#2471a3\" stroke-width=\"2.5\"/></svg></div>Quelle distance a été parcourue au bout de $$${t}\\text{ h}$$ ?",
        "answer": "[\"d\"]",
        "options": {
          "formula_code": "setNB(1)\nv=20\nt=RD(1,4)\nd=v*t\ny4=180-80*1.5"
        },
        "footer": "$$[[formula]]\\text{ km}$$"
      },
      {
        "n": 2,
        "statement": "Le graphique donne le prix en fonction de la masse achetée.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"185\" x2=\"340\" y2=\"185\"/><line x1=\"60\" y1=\"160\" x2=\"340\" y2=\"160\"/><line x1=\"60\" y1=\"135\" x2=\"340\" y2=\"135\"/><line x1=\"60\" y1=\"110\" x2=\"340\" y2=\"110\"/><line x1=\"60\" y1=\"85\" x2=\"340\" y2=\"85\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"185\"/><line x1=\"116\" y1=\"60\" x2=\"116\" y2=\"185\"/><line x1=\"172\" y1=\"60\" x2=\"172\" y2=\"185\"/><line x1=\"228\" y1=\"60\" x2=\"228\" y2=\"185\"/><line x1=\"284\" y1=\"60\" x2=\"284\" y2=\"185\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"185\"/></g><line x1=\"60\" y1=\"185\" x2=\"350\" y2=\"185\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"185\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,185 340,180 340,190\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"310\" y=\"220\" font-family=\"sans-serif\" font-size=\"13\">masse (kg)</text><text x=\"25\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">prix (€)</text><text x=\"55\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"116\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"172\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"228\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><text x=\"284\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">4</text><text x=\"340\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">5</text><text x=\"50\" y=\"189\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"50\" y=\"164\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">5</text><text x=\"50\" y=\"139\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"50\" y=\"114\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><text x=\"50\" y=\"89\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">25</text><line x1=\"60\" y1=\"185\" x2=\"340\" y2=\"60\" stroke=\"#2e7d32\" stroke-width=\"2.5\"/></svg></div>Pour quelle masse le prix est-il égal à $$${prix}\\text{ €}$$ ?",
        "answer": "[\"kg\"]",
        "options": {
          "formula_code": "setNB(1)\nkg=RD(1,5)\nprix=5*kg"
        },
        "footer": "$$[[formula]]\\text{ kg}$$"
      },
      {
        "n": 3,
        "statement": "Le graphique donne la quantité d’eau restante dans une citerne en fonction du temps.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"180\"/><line x1=\"60\" y1=\"150\" x2=\"340\" y2=\"150\"/><line x1=\"60\" y1=\"120\" x2=\"340\" y2=\"120\"/><line x1=\"60\" y1=\"90\" x2=\"340\" y2=\"90\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"180\"/><line x1=\"130\" y1=\"60\" x2=\"130\" y2=\"180\"/><line x1=\"200\" y1=\"60\" x2=\"200\" y2=\"180\"/><line x1=\"270\" y1=\"60\" x2=\"270\" y2=\"180\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"180\"/></g><line x1=\"60\" y1=\"180\" x2=\"350\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"180\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,180 340,175 340,185\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"325\" y=\"215\" font-family=\"sans-serif\" font-size=\"13\">temps (min)</text><text x=\"18\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">eau (L)</text><text x=\"55\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"130\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"200\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"270\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><text x=\"340\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">4</text><text x=\"50\" y=\"184\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"50\" y=\"154\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"50\" y=\"124\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">40</text><text x=\"50\" y=\"94\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">60</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">80</text><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"180\" stroke=\"#2471a3\" stroke-width=\"2.5\"/></svg></div>Quelle quantité d’eau reste-t-il au bout de $$${t}\\text{ min}$$ ?",
        "answer": "[\"reste\"]",
        "options": {
          "formula_code": "setNB(1)\nt=RD(1,4)\nreste=80-20*t"
        },
        "footer": "$$[[formula]]\\text{ L}$$"
      },
      {
        "n": 4,
        "statement": "Le graphique donne la température relevée au cours d’une matinée.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"180\"/><line x1=\"60\" y1=\"150\" x2=\"340\" y2=\"150\"/><line x1=\"60\" y1=\"120\" x2=\"340\" y2=\"120\"/><line x1=\"60\" y1=\"90\" x2=\"340\" y2=\"90\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"180\"/><line x1=\"130\" y1=\"60\" x2=\"130\" y2=\"180\"/><line x1=\"200\" y1=\"60\" x2=\"200\" y2=\"180\"/><line x1=\"270\" y1=\"60\" x2=\"270\" y2=\"180\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"180\"/></g><line x1=\"60\" y1=\"180\" x2=\"350\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"180\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,180 340,175 340,185\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"340\" y=\"215\" font-family=\"sans-serif\" font-size=\"13\">heure</text><text x=\"18\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">temp. (°C)</text><text x=\"60\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">8 h</text><text x=\"130\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">9 h</text><text x=\"200\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">10 h</text><text x=\"270\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">11 h</text><text x=\"340\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">12 h</text><text x=\"50\" y=\"184\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"50\" y=\"154\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><text x=\"50\" y=\"124\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"50\" y=\"94\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">25</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">30</text><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"60\" stroke=\"#c0392b\" stroke-width=\"2.5\"/></svg></div>À quelle heure la température est-elle égale à $$${temp}\\,°\\text{C}$$ ?",
        "answer": "[\"heure\"]",
        "options": {
          "formula_code": "setNB(1)\nrang=RD(1,4)\ntemp=10+5*rang\nheure=8+rang"
        },
        "footer": "$$[[formula]]\\text{ h}$$"
      },
      {
        "n": 5,
        "statement": "Le graphique représente une grandeur $$y$$ en fonction d’une grandeur $$x$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"185\" x2=\"340\" y2=\"185\"/><line x1=\"60\" y1=\"160\" x2=\"340\" y2=\"160\"/><line x1=\"60\" y1=\"135\" x2=\"340\" y2=\"135\"/><line x1=\"60\" y1=\"110\" x2=\"340\" y2=\"110\"/><line x1=\"60\" y1=\"85\" x2=\"340\" y2=\"85\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"185\"/><line x1=\"130\" y1=\"60\" x2=\"130\" y2=\"185\"/><line x1=\"200\" y1=\"60\" x2=\"200\" y2=\"185\"/><line x1=\"270\" y1=\"60\" x2=\"270\" y2=\"185\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"185\"/></g><line x1=\"60\" y1=\"185\" x2=\"350\" y2=\"185\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"185\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,185 340,180 340,190\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"345\" y=\"215\" font-family=\"sans-serif\" font-size=\"13\">x</text><text x=\"35\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">y</text><text x=\"55\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"130\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"200\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"270\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><text x=\"340\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">4</text><text x=\"50\" y=\"189\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"50\" y=\"164\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">5</text><text x=\"50\" y=\"139\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"50\" y=\"114\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><text x=\"50\" y=\"89\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">25</text><line x1=\"60\" y1=\"160\" x2=\"340\" y2=\"60\" stroke=\"#8b1f5f\" stroke-width=\"2.5\"/></svg></div>Quelle est la valeur de $$y$$ lorsque $$x=${x}$$ ?",
        "answer": "[\"y\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(1,4)\ny=5*x+5"
        },
        "footer": "$$y=[[formula]]$$"
      },
      {
        "n": 6,
        "statement": "Le graphique représente une grandeur $$y$$ en fonction d’une grandeur $$x$$.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"185\" x2=\"340\" y2=\"185\"/><line x1=\"60\" y1=\"160\" x2=\"340\" y2=\"160\"/><line x1=\"60\" y1=\"135\" x2=\"340\" y2=\"135\"/><line x1=\"60\" y1=\"110\" x2=\"340\" y2=\"110\"/><line x1=\"60\" y1=\"85\" x2=\"340\" y2=\"85\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"185\"/><line x1=\"130\" y1=\"60\" x2=\"130\" y2=\"185\"/><line x1=\"200\" y1=\"60\" x2=\"200\" y2=\"185\"/><line x1=\"270\" y1=\"60\" x2=\"270\" y2=\"185\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"185\"/></g><line x1=\"60\" y1=\"185\" x2=\"350\" y2=\"185\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"185\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,185 340,180 340,190\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"345\" y=\"215\" font-family=\"sans-serif\" font-size=\"13\">x</text><text x=\"35\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">y</text><text x=\"55\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"130\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"200\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"270\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><text x=\"340\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">4</text><text x=\"50\" y=\"189\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"50\" y=\"164\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">5</text><text x=\"50\" y=\"139\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"50\" y=\"114\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><text x=\"50\" y=\"89\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">25</text><line x1=\"60\" y1=\"160\" x2=\"340\" y2=\"60\" stroke=\"#2e7d32\" stroke-width=\"2.5\"/></svg></div>Quelle est la valeur de $$x$$ lorsque $$y=${y}$$ ?",
        "answer": "[\"x\"]",
        "options": {
          "formula_code": "setNB(1)\nx=RD(1,4)\ny=5*x+5"
        },
        "footer": "$$x=[[formula]]$$"
      },
      {
        "n": 7,
        "statement": "Le graphique donne le prix total en fonction du nombre de billets achetés.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"185\" x2=\"340\" y2=\"185\"/><line x1=\"60\" y1=\"160\" x2=\"340\" y2=\"160\"/><line x1=\"60\" y1=\"135\" x2=\"340\" y2=\"135\"/><line x1=\"60\" y1=\"110\" x2=\"340\" y2=\"110\"/><line x1=\"60\" y1=\"85\" x2=\"340\" y2=\"85\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"185\"/><line x1=\"116\" y1=\"60\" x2=\"116\" y2=\"185\"/><line x1=\"172\" y1=\"60\" x2=\"172\" y2=\"185\"/><line x1=\"228\" y1=\"60\" x2=\"228\" y2=\"185\"/><line x1=\"284\" y1=\"60\" x2=\"284\" y2=\"185\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"185\"/></g><line x1=\"60\" y1=\"185\" x2=\"350\" y2=\"185\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"185\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,185 340,180 340,190\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"310\" y=\"220\" font-family=\"sans-serif\" font-size=\"13\">nombre de billets</text><text x=\"25\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">prix (€)</text><text x=\"55\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"116\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"172\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"228\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><text x=\"284\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">4</text><text x=\"340\" y=\"202\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">5</text><text x=\"50\" y=\"189\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"50\" y=\"164\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">5</text><text x=\"50\" y=\"139\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"50\" y=\"114\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><text x=\"50\" y=\"89\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">25</text><circle cx=\"116\" cy=\"160\" r=\"3.5\" fill=\"#2471a3\"/><circle cx=\"172\" cy=\"135\" r=\"3.5\" fill=\"#2471a3\"/><circle cx=\"228\" cy=\"110\" r=\"3.5\" fill=\"#2471a3\"/><circle cx=\"284\" cy=\"85\" r=\"3.5\" fill=\"#2471a3\"/><circle cx=\"340\" cy=\"60\" r=\"3.5\" fill=\"#2471a3\"/></svg></div>Combien coûtent $$${n}$$ billets ?",
        "answer": "[\"prix\"]",
        "options": {
          "formula_code": "setNB(1)\nn=RD(1,5)\nprix=5*n"
        },
        "footer": "$$[[formula]]\\text{ €}$$"
      },
      {
        "n": 8,
        "statement": "Le graphique donne la distance restante avant l’arrivée en fonction du temps.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"180\"/><line x1=\"60\" y1=\"150\" x2=\"340\" y2=\"150\"/><line x1=\"60\" y1=\"120\" x2=\"340\" y2=\"120\"/><line x1=\"60\" y1=\"90\" x2=\"340\" y2=\"90\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"180\"/><line x1=\"130\" y1=\"60\" x2=\"130\" y2=\"180\"/><line x1=\"200\" y1=\"60\" x2=\"200\" y2=\"180\"/><line x1=\"270\" y1=\"60\" x2=\"270\" y2=\"180\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"180\"/></g><line x1=\"60\" y1=\"180\" x2=\"350\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"180\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,180 340,175 340,185\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"325\" y=\"215\" font-family=\"sans-serif\" font-size=\"13\">temps (h)</text><text x=\"18\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">distance (km)</text><text x=\"55\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"130\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"200\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"270\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><text x=\"340\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">4</text><text x=\"50\" y=\"184\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"50\" y=\"154\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"50\" y=\"124\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">40</text><text x=\"50\" y=\"94\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">60</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">80</text><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"180\" stroke=\"#8b1f5f\" stroke-width=\"2.5\"/></svg></div>Au bout de combien d’heures reste-t-il $$${dist}\\text{ km}$$ à parcourir ?",
        "answer": "[\"t\"]",
        "options": {
          "formula_code": "setNB(1)\nt=RD(1,4)\ndist=80-20*t"
        },
        "footer": "$$[[formula]]\\text{ h}$$"
      },
      {
        "n": 9,
        "statement": "Le graphique donne la hauteur d’une plante en fonction du nombre de semaines.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"180\"/><line x1=\"60\" y1=\"150\" x2=\"340\" y2=\"150\"/><line x1=\"60\" y1=\"120\" x2=\"340\" y2=\"120\"/><line x1=\"60\" y1=\"90\" x2=\"340\" y2=\"90\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"180\"/><line x1=\"130\" y1=\"60\" x2=\"130\" y2=\"180\"/><line x1=\"200\" y1=\"60\" x2=\"200\" y2=\"180\"/><line x1=\"270\" y1=\"60\" x2=\"270\" y2=\"180\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"180\"/></g><line x1=\"60\" y1=\"180\" x2=\"350\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"180\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,180 340,175 340,185\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"320\" y=\"215\" font-family=\"sans-serif\" font-size=\"13\">semaines</text><text x=\"14\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">hauteur (cm)</text><text x=\"55\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"130\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"200\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"270\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><text x=\"340\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">4</text><text x=\"50\" y=\"184\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"50\" y=\"154\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">5</text><text x=\"50\" y=\"124\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">10</text><text x=\"50\" y=\"94\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">15</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><line x1=\"60\" y1=\"150\" x2=\"340\" y2=\"30\" stroke=\"#2e7d32\" stroke-width=\"2.5\"/></svg></div>Au bout de combien de semaines la plante atteint-elle $$${haut}\\text{ cm}$$ ?",
        "answer": "[\"sem\"]",
        "options": {
          "formula_code": "setNB(1)\nsem=RD(1,4)\nhaut=5+5*sem"
        },
        "footer": "$$[[formula]]$$"
      },
      {
        "n": 10,
        "statement": "Le graphique donne le volume d’eau dans un récipient en fonction du temps.<br><div style=\"text-align:center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"380\" height=\"auto\" viewBox=\"0 0 380 250\" style=\"max-width:380px\"><g stroke=\"#e5e5e5\" stroke-width=\"1\"><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"180\"/><line x1=\"60\" y1=\"150\" x2=\"340\" y2=\"150\"/><line x1=\"60\" y1=\"120\" x2=\"340\" y2=\"120\"/><line x1=\"60\" y1=\"90\" x2=\"340\" y2=\"90\"/><line x1=\"60\" y1=\"60\" x2=\"340\" y2=\"60\"/><line x1=\"60\" y1=\"60\" x2=\"60\" y2=\"180\"/><line x1=\"130\" y1=\"60\" x2=\"130\" y2=\"180\"/><line x1=\"200\" y1=\"60\" x2=\"200\" y2=\"180\"/><line x1=\"270\" y1=\"60\" x2=\"270\" y2=\"180\"/><line x1=\"340\" y1=\"60\" x2=\"340\" y2=\"180\"/></g><line x1=\"60\" y1=\"180\" x2=\"350\" y2=\"180\" stroke=\"#222\" stroke-width=\"1.5\"/><line x1=\"60\" y1=\"180\" x2=\"60\" y2=\"45\" stroke=\"#222\" stroke-width=\"1.5\"/><polygon points=\"350,180 340,175 340,185\" fill=\"#222\"/><polygon points=\"60,45 55,55 65,55\" fill=\"#222\"/><text x=\"300\" y=\"215\" font-family=\"sans-serif\" font-size=\"13\">temps (min)</text><text x=\"18\" y=\"48\" font-family=\"sans-serif\" font-size=\"13\">volume (L)</text><text x=\"55\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"130\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">1</text><text x=\"200\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">2</text><text x=\"270\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">3</text><text x=\"340\" y=\"198\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\">4</text><text x=\"50\" y=\"184\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">0</text><text x=\"50\" y=\"154\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">20</text><text x=\"50\" y=\"124\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">40</text><text x=\"50\" y=\"94\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">60</text><text x=\"50\" y=\"64\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\">80</text><line x1=\"60\" y1=\"180\" x2=\"340\" y2=\"60\" stroke=\"#2471a3\" stroke-width=\"2.5\"/></svg></div>Que signifie le point de la courbe d’abscisse $$${t}$$ ?&&Au bout de $$${t}$$ min, il y a $$${vol}$$ L d’eau.&&Au bout de $$${vol}$$ min, il y a $$${t}$$ L d’eau.&&Il y a $$${t}$$ L d’eau au départ.&&Le récipient perd $$${vol}$$ L par minute.&&",
        "answer": "[\"1\"]",
        "options": {
          "formula_code": "setNB(1)\nt=RD(1,4)\nvol=20*t",
          "shuffle_answers": true
        },
        "footer": "[[formula_qcm1]]"
      }
    ]
  }
];
