# -*- coding: utf-8 -*-
"""Les histoires de SPLAT!, livret 1 — l'habillage de chaque carte cachée : ce qui remplace,
dans les dessins de l'outil, les couleurs des taches (les noms du problème), les phrases
« La tache … cache donc … jetons » (les phrases du problème) et la phrase de « Je réponds ».

Clés des noms : la VALEUR cachée (elle est unique dans chaque carte, vérifié au rendu).
  noms      {valeur: nom}         le nom écrit dans les barres (Enquête : à gauche de la barre)
  articles  {nom: "le pantalon"}  le nom avec son article (titres « je remplace … », « Je retourne »)
  phrases   {nom: "… {d} …"}      Enquête : la ligne de calcul qui dit ce que vaut une quantité
  retourne  "Je retourne : …"     Enquête : l'indice « de moins » / « fois moins » remis à l'endroit
  remplacer [(avant, après)]      mots de l'outil à remplacer dans le dessin (titres)
  reponse   "… {nom} …"           la phrase de « Je réponds » ({nom} : sa valeur, en gras)
  verifs    ["… ✓"]               Classique et Système : « Je vérifie »
  paquets   [62, 45]              Classique : les paquets de jetons visibles, dans l'ordre de l'énoncé
  lettres   {nom: "𝑡"}            Système : la lettre de chaque quantité (corrigé en lettre)
  titres    {titre de l'outil: titre du livret}   Système
"""

H = {
 # ---------------------------------------------------------------- la page 2 (l'exemple)
 "Ex": dict(noms={9: "filles", 17: "garçons"}, articles={"filles": "les filles", "garçons": "les garçons"},
   phrases={"filles": "Il y a donc {d} filles", "garçons": "Il y a donc {d} garçons"},
   reponse="Il y a {filles} filles et {garçons} garçons."),
 # ---------------------------------------------------------------- fiche 1 : Classique (mode N)
 "1.1": dict(inconnue="le nombre d’autorisations qui manquent", noms={8: "manque"}, reponse="Il manque {manque} autorisations.", verifs=["49 + 8 = 57 ✓"]),
 "1.2": dict(inconnue="l’argent qui manque, en €", noms={43: "manque"}, paquets=[62, 45], reponse="Il manque {manque} €.", verifs=["62 + 45 + 43 = 150 ✓"]),
 "1.3": dict(inconnue="le prix d’une pizza, en €", noms={14: "pizza"}, reponse="Une pizza coûte {pizza} €.", verifs=["2 × 14 + 3 = 31 ✓"]),
 "1.4": dict(inconnue="la durée d’un match, en min", noms={12: "match"}, reponse="Un match dure {match} min.", visiblesAvant=True, verifs=["5 + 6 × 12 = 77 ✓"]),
 # ---------------------------------------------------------------- fiche 2 : Enquête, écarts
 "2.1": dict(inconnue="le nombre de buts des garçons", noms={21: "garçons", 26: "filles"}, articles={"garçons": "les garçons", "filles": "les filles"},
   phrases={"garçons": "Les garçons ont donc marqué {d} buts", "filles": "Les filles ont donc marqué {d} buts"},
   reponse="Les garçons ont marqué {garçons} buts, les filles {filles}."),
 "2.2": dict(inconnue="la durée du français, en min", noms={13: "français", 31: "maths"}, articles={"français": "le français", "maths": "les maths"},
   retourne="Je retourne : les maths lui prennent 18 min de plus que le français.",
   phrases={"français": "Le français lui prend donc {d} min", "maths": "Les maths lui prennent donc {d} min"},
   reponse="Le français lui prend {français} min, les maths {maths} min."),
 "2.3": dict(inconnue="l’aire de la parcelle de salades, en m²", noms={33: "salades", 45: "tomates", 42: "fraises"},
   articles={"salades": "la parcelle de salades", "tomates": "la parcelle de tomates", "fraises": "la parcelle de fraises"},
   phrases={"salades": "Les salades ont donc {d} m²", "tomates": "Les tomates ont donc {d} m²", "fraises": "Les fraises ont donc {d} m²"},
   reponse="Les salades ont {salades} m², les tomates {tomates} m², les fraises {fraises} m²."),
 "2.4": dict(inconnue="la longueur du 1er morceau, en cm", noms={20: "1er", 27: "2e", 33: "3e"},
   articles={"1er": "le 1er morceau", "2e": "le 2e morceau", "3e": "le 3e morceau"},
   retourne="Je retourne : le 2e morceau mesure 7 cm de plus que le 1er.",
   phrases={"1er": "Le 1er morceau mesure donc {d} cm", "2e": "Le 2e morceau mesure donc {d} cm", "3e": "Le 3e morceau mesure donc {d} cm"},
   reponse="Le 1er morceau mesure {1er} cm, le 2e {2e} cm, le 3e {3e} cm."),
 # ---------------------------------------------------------------- fiche 3 : Enquête, rapports
 "3.1": dict(inconnue="la longueur du petit morceau, en cm", noms={12: "petit", 36: "grand"},
   articles={"petit": "le petit morceau", "grand": "le grand morceau"},
   phrases={"petit": "Le petit morceau mesure donc {d} cm", "grand": "Le grand morceau mesure donc {d} cm"},
   reponse="Le petit morceau mesure {petit} cm, le grand {grand} cm."),
 "3.2": dict(inconnue="la durée de la marche, en min", noms={9: "marche", 36: "bus"}, articles={"marche": "la marche", "bus": "le bus"},
   retourne="Je retourne : le bus dure 4 fois plus longtemps que la marche.",
   phrases={"marche": "La marche dure donc {d} min", "bus": "Le bus dure donc {d} min"},
   reponse="La marche dure {marche} min, le bus {bus} min."),
 "3.3": dict(inconnue="la quantité de sirop, en cL", noms={20: "sirop", 40: "ananas", 60: "orange"}, articles={"sirop": "le sirop", "ananas": "le jus d’ananas", "orange": "le jus d’orange"},
   phrases={"sirop": "Noé met donc {d} cL de sirop", "ananas": "Noé met donc {d} cL de jus d’ananas", "orange": "Noé met donc {d} cL de jus d’orange"},
   reponse="Noé met {sirop} cL de sirop, {ananas} cL de jus d’ananas et {orange} cL de jus d’orange."),
 "3.4": dict(inconnue="le nombre de médailles d’or", noms={8: "or", 16: "bronze", 14: "argent"}, articles={"or": "l’or", "bronze": "le bronze", "argent": "l’argent"},
   phrases={"or": "Le club a donc gagné {d} médailles d’or", "bronze": "Le club a donc gagné {d} médailles de bronze", "argent": "Le club a donc gagné {d} médailles d’argent"},
   reponse="Le club a gagné {or} médailles d’or, {bronze} de bronze et {argent} d’argent."),
 # ---------------------------------------------------------------- fiche 4 : Enquête, répétées puis sans total
 "4.1": dict(inconnue="le prix d’une place enfant, en €", noms={8: "enfant", 11: "adulte"}, articles={"enfant": "une place enfant", "adulte": "une place adulte"},
   phrases={"enfant": "Une place enfant coûte donc {d} €", "adulte": "Une place adulte coûte donc {d} €"},
   remplacer=[("une barre par tache", "une barre par place")],
   reponse="Une place enfant coûte {enfant} €, une place adulte {adulte} €."),
 # (« petit sac » ne tenait pas sous les cinq cases du schéma regroupé : « petit », « grand »)
 "4.2": dict(inconnue="la masse d’un petit sac, en kg", noms={5: "petit", 10: "grand"}, articles={"petit": "un petit sac", "grand": "un grand sac"},
   phrases={"petit": "Un petit sac pèse donc {d} kg", "grand": "Un grand sac pèse donc {d} kg"},
   remplacer=[("une barre par tache", "une barre par sac")],
   reponse="Un petit sac pèse {petit} kg, un grand sac {grand} kg."),
 "4.3": dict(inconnue="l’âge de Yanis", noms={13: "Yanis", 39: "père"}, articles={"Yanis": "Yanis", "père": "le père"},
   phrases={"Yanis": "Yanis a donc {d} ans", "père": "Son père a donc {d} ans"},
   reponse="Yanis a {Yanis} ans, son père {père} ans."),
 "4.4": dict(inconnue="la masse du chiot, en kg", noms={5: "chiot", 20: "mère"}, articles={"chiot": "le chiot", "mère": "la mère"},
   retourne="Je retourne : la mère pèse 4 fois plus que le chiot, et 15 kg de plus.",
   phrases={"chiot": "Le chiot pèse donc {d} kg", "mère": "Sa mère pèse donc {d} kg"},
   reponse="Le chiot pèse {chiot} kg, sa mère {mère} kg."),
 # ---------------------------------------------------------------- fiche 5 : Système (mode D)
 "5.1": dict(noms={4: "tour", 3: "barbe à papa"}, lettres={"tour": "T", "barbe à papa": "B"}, pluriels={"tour": "tours", "barbe à papa": "barbes à papa"},
   legende={"tour": "un tour de manège", "barbe à papa": "une barbe à papa"},
   titres={"Les deux plateaux": "Les deux achats", "Je remplace le petit plateau par son total": "Je remplace le petit achat par son prix"},
   reponse="Un tour de manège coûte {tour} €, une barbe à papa {barbe à papa} €."),
 "5.2": dict(noms={4: "sandwich", 3: "jus"}, lettres={"sandwich": "S", "jus": "J"}, pluriels={"sandwich": "sandwichs", "jus": "jus"},
   legende={"sandwich": "un sandwich", "jus": "un jus"},
   titres={"Les deux plateaux": "Les deux achats", "Je remplace le petit plateau par son total": "Je remplace le petit achat par son prix"},
   reponse="Un sandwich coûte {sandwich} €, un jus {jus} €."),
 "5.3": dict(noms={3: "stylo", 5: "cahier"}, lettres={"stylo": "S", "cahier": "C"}, pluriels={"stylo": "stylos", "cahier": "cahiers"},
   legende={"stylo": "un stylo", "cahier": "un cahier"},
   titres={"Les deux plateaux": "Les deux achats", "Je retrouve 2 fois le petit plateau": "Je retrouve 2 fois le petit achat"},
   reponse="Un stylo coûte {stylo} €, un cahier {cahier} €."),
 "5.4": dict(noms={6: "enfant", 8: "adulte"}, lettres={"enfant": "E", "adulte": "A"}, pluriels={"enfant": "enfants", "adulte": "adultes"},
   legende={"enfant": "une entrée enfant", "adulte": "une entrée adulte"},
   titres={"Les deux plateaux": "Les deux groupes", "Je retrouve 2 paires dans le plateau": "Je retrouve 2 paires dans le groupe à 36 €"},
   reponse="Une entrée enfant coûte {enfant} €, une entrée adulte {adulte} €."),
}
