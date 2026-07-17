const MODULE_DNB_06 = {
  "id": "dnb_06",
  "num": 6,
  "title": "Notation scientifique",
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
      "statement": "Écris ce grand nombre en notation scientifique :",
      "answer": "[\"m\",\"3\"]",
      "options": {
        "formula_code": "setNB(1)\nn=RD(1000,9999)\nm=n/1000",
        "scientific_kind": "to_scientific"
      },
      "footer": "$$${n}=[[dots]]\\times10^{[[dots]]}$$"
    },
    {
      "n": 2,
      "statement": "Écris ce grand nombre en notation scientifique :",
      "answer": "[\"m\",\"4\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(100,999)\nn=d*100\nm=n/10000",
        "scientific_kind": "to_scientific"
      },
      "footer": "$$${n}=[[dots]]\\times10^{[[dots]]}$$"
    },
    {
      "n": 3,
      "statement": "Écris ce petit nombre en notation scientifique :",
      "answer": "[\"m\",\"0-3\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(100,999)\nn=CUT(d/100000,8)\nm=d/100",
        "scientific_kind": "to_scientific"
      },
      "footer": "$$${n}=[[dots]]\\times10^{[[dots]]}$$"
    },
    {
      "n": 4,
      "statement": "Écris ce petit nombre en notation scientifique :",
      "answer": "[\"m\",\"0-2\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(11,99)\nn=CUT(d/1000,8)\nm=d/10",
        "scientific_kind": "to_scientific"
      },
      "footer": "$$${n}=[[dots]]\\times10^{[[dots]]}$$"
    },
    {
      "n": 5,
      "statement": "Écris ce nombre en notation scientifique :",
      "answer": "[\"m\",\"5\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(1000,9999)\nn=d*100\nm=n/100000",
        "scientific_kind": "to_scientific"
      },
      "footer": "$$${n}=[[dots]]\\times10^{[[dots]]}$$"
    },
    {
      "n": 6,
      "statement": "Écris ce petit nombre en notation scientifique :",
      "answer": "[\"m\",\"0-4\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(100,999)\nn=CUT(d/1000000,8)\nm=d/100",
        "scientific_kind": "to_scientific"
      },
      "footer": "$$${n}=[[dots]]\\times10^{[[dots]]}$$"
    },
    {
      "n": 7,
      "statement": "Écris ce nombre en notation scientifique :",
      "answer": "[\"m\",\"6\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(11,99)\nn=d*100000\nm=d/10",
        "scientific_kind": "to_scientific"
      },
      "footer": "$$${n}=[[dots]]\\times10^{[[dots]]}$$"
    },
    {
      "n": 8,
      "statement": "Cette notation scientifique correspond à quel nombre décimal ?",
      "answer": "[\"n\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(11,99)\nm=d/10\ne=RD(2,4)\nn=m*10**e",
        "scientific_kind": "from_scientific"
      },
      "footer": "$$${m}\\times10^{${e}}=[[dots]]$$"
    },
    {
      "n": 9,
      "statement": "Quelle est l'écriture scientifique de $$${n}$$ ?&&$$${m}\\times10^{3}$$&&$$${md}\\times10^{2}$$&&$$${m}\\times10^{4}$$&&$$${mu}\\times10^{3}$$&&",
      "answer": "[\"1\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(100,999)\nm=d/100\nn=d*10\nmd=m*10\nmu=CUT(m/10,8)",
        "scientific_kind": "to_scientific_qcm"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 10,
      "statement": "Le nombre $$${m}\\times10^{${e}}$$ est-il écrit en notation scientifique ?&&Oui, c'est une écriture scientifique correcte&&Non, car la partie entière n’est pas comprise entre 1 et 10&&Non, car l'exposant doit être positif&&",
      "answer": "[\"2\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(105,995)\nm=d/10\ne=RD(2,5)",
        "scientific_kind": "recognition"
      },
      "footer": "[[formula_qcm1]]"
    },
    {
      "n": 11,
      "statement": "Cette notation scientifique correspond à quel nombre décimal ?",
      "answer": "[\"n\"]",
      "options": {
        "formula_code": "setNB(1)\nd=RD(11,99)\nm=d/10\ne=0-RD(2,4)\nn=CUT(m*10**e,8)",
        "scientific_kind": "from_scientific"
      },
      "footer": "$$${m}\\times10^{${e}}=[[dots]]$$"
    }
  ]
};
