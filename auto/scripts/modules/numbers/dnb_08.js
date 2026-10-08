// dnb_08 — refonte d'octobre 2026 : les anciens gabarits 1 à 10 sont retirés
// (1 à 7 jamais tirés ; 8, 9 et 10 avaient toujours la même réponse).
// Les types 11 à 22 (un profil chacun) étaient fabriqués à la volée ; ils sont
// maintenant déclarés ici. Les types 23 à 29 sont nouveaux (formes du brevet).
// Les énoncés sont fabriqués par dnb_08/generate.js ; ce fichier liste les types.
const MODULE_DNB_08 = {
  "id": "dnb_08",
  "num": 8,
  "title": "Critères de divisibilité par 2, 3, 5, 9 et 10",
  "level_tags": [
    "4e",
    "3e",
    "DNB"
  ],
  "source": "refonte_2026_10_dnb08",
  "has_svg": false,
  "keypad": {
    "context": []
  },
  "questions": [
    {
      "n": 11,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités pair, somme hors de la table de 3)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "even-none",
        "template_version": 3
      }
    },
    {
      "n": 12,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités pair, somme dans la table de 3, pas de 9)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "even-three",
        "template_version": 3
      }
    },
    {
      "n": 13,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités pair, somme dans la table de 9)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "even-nine",
        "template_version": 3
      }
    },
    {
      "n": 14,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités 5, somme hors de la table de 3)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "five-none",
        "template_version": 3
      }
    },
    {
      "n": 15,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités 5, somme dans la table de 3, pas de 9)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "five-three",
        "template_version": 3
      }
    },
    {
      "n": 16,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités 5, somme dans la table de 9)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "five-nine",
        "template_version": 3
      }
    },
    {
      "n": 17,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités 0, somme hors de la table de 3)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "zero-none",
        "template_version": 3
      }
    },
    {
      "n": 18,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités 0, somme dans la table de 3, pas de 9)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "zero-three",
        "template_version": 3
      }
    },
    {
      "n": 19,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités 0, somme dans la table de 9)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "zero-nine",
        "template_version": 3
      }
    },
    {
      "n": 20,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités impair (pas 5), somme hors de la table de 3)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "odd-none",
        "template_version": 3
      }
    },
    {
      "n": 21,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités impair (pas 5), somme dans la table de 3, pas de 9)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "odd-three",
        "template_version": 3
      }
    },
    {
      "n": 22,
      "title": "Par quels nombres N est-il divisible ? (chiffre des unités impair (pas 5), somme dans la table de 9)",
      "statement": "",
      "answer": "[\"correctIndexes\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-divisors",
        "divisibility_profile": "odd-nine",
        "template_version": 3
      }
    },
    {
      "n": 23,
      "title": "Coche tous les nombres divisibles par 3, 9, 2, 5 ou 10",
      "statement": "",
      "answer": "[\"generated\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "select-numbers",
        "template_version": 1
      }
    },
    {
      "n": 24,
      "title": "Partage sans reste : oui ou non ?",
      "statement": "",
      "answer": "[\"generated\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "sharing",
        "template_version": 1
      }
    },
    {
      "n": 25,
      "title": "Donne un diviseur de N autre que 1 et N (DNB 2026 Amérique du Nord)",
      "statement": "",
      "answer": "[\"generated\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "give-divisor",
        "template_version": 1
      }
    },
    {
      "n": 26,
      "title": "Donne un nombre à 4 ou 5 chiffres divisible par 3 ou 9 de chiffre des unités imposé, ou divisible par deux nombres (sujet de référence 2027)",
      "statement": "",
      "answer": "[\"generated\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "build-number",
        "template_version": 1
      }
    },
    {
      "n": 27,
      "title": "Divisibilité par 3 ou 9 de N et P (DNB 2026 Asie)",
      "statement": "",
      "answer": "[\"generated\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "two-numbers",
        "template_version": 1
      }
    },
    {
      "n": 28,
      "title": "Chiffre manquant pour être divisible par 3 ou 9 (ou par deux nombres)",
      "statement": "",
      "answer": "[\"generated\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "missing-digit",
        "template_version": 1
      }
    },
    {
      "n": 29,
      "title": "Coche les nombres de la liste qui divisent N (DNB 2026 Métropole, série professionnelle)",
      "statement": "",
      "answer": "[\"generated\"]",
      "footer": "",
      "options": {
        "divisibility_kind": "list-divisors",
        "template_version": 1
      }
    }
  ]
};
