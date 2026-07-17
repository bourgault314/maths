const MODULE_DNB_08 = {
  "id": "dnb_08",
  "num": 8,
  "title": "Critères de divisibilité par 2, 3, 5, 9",
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
      "statement": "$$${2*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
      },
      "footer": "[[formula_qcm]]"
    },
    {
      "n": 2,
      "statement": "$$${3*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
      },
      "footer": "[[formula_qcm]]"
    },
    {
      "n": 3,
      "statement": "$$${5*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
      "answer": "[\"3\"]",
      "options": {
        "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
      },
      "footer": "[[formula_qcm]]"
    },
    {
      "n": 4,
      "statement": "$$${9*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
      "answer": "[\"2\",\"4\"]",
      "options": {
        "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
      },
      "footer": "[[formula_qcm]]"
    },
    {
      "n": 5,
      "statement": "$$${10*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
      "answer": "[\"1\",\"3\"]",
      "options": {
        "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
      },
      "footer": "[[formula_qcm]]"
    },
    {
      "n": 6,
      "statement": "$$${6*P}$$ est divisible par :&&par 2&&par 3&&par 5&&par 9&&",
      "answer": "[\"1\",\"2\"]",
      "options": {
        "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
      },
      "footer": "[[formula_qcm]]"
    },
    {
      "n": 7,
      "statement": "Le nombre $$${15*P}$$ est divisible par :&&par 3&&par 5&&par 9&&par 2&&",
      "answer": "[\"1\",\"2\"]",
      "options": {
        "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
      },
      "footer": "[[formula_qcm]]"
    },
    {
      "n": 8,
      "statement": "Parmi ces nombres, lesquels sont divisibles par 5 ?&&$$${a}$$&&$$${b}$$&&$$${cc}$$&&$$${e}$$&&",
      "answer": "[\"1\",\"3\"]",
      "options": {
        "formula_code": "setNB(1)\nka=RD(10,99)\nkc=RD(10,99,[ka])\na=ka*5\nb=RD(10,99)*10+RD(1,4)\ncc=kc*5\ne=RD(10,99)*10+RD(6,9)"
      },
      "footer": "[[formula_qcm]]"
    },
    {
      "n": 9,
      "statement": "Pour savoir si $$${9*P}$$ est divisible par 9, on calcule la somme de ses chiffres. Cette somme est-elle divisible par 9 ?&&Oui, donc le nombre est divisible par 9&&Non, donc le nombre n'est pas divisible par 9&&On ne peut pas savoir avec ce critère&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 10,
      "statement": "<div style=\"text-align:justify\">On a $$${3*P}$$ bonbons. Peut-on les répartir équitablement (sans reste) dans 3 sachets ?</div>&&Oui&&Non&&Seulement si on en retire un&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nP=[101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257][RD(29)]"
      },
      "footer": "[[formula_qcm1]]"
    }
  ]
};
