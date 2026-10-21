# -*- coding: utf-8 -*-
"""Les histoires de SPLAT!, livret 3 — l'habillage de chaque carte cachée (mêmes clés que les
livrets 1 et 2, voir ../livret-1/habillage.py et ../livret-2/habillage.py) : les noms
du problème à la place des couleurs, ses phrases à la place de « La tache … cache donc … jetons »,
la phrase de « Je réponds ».
Clés nouvelles du livret 3 :
  ordre     [noms]        les petites parts (H13) : l'ordre de l'énoncé pour le corrigé en équations
                          (𝑥 y est UNE PETITE PART, chaque quantité k × 𝑥)
La balance (famille B, dessinée par l'outil des Équations) :
  rangs     [haut, bas]   le nom de chaque barre, à gauche du premier schéma
  depart    titre         le titre du premier schéma
  objet     [un, des]     ce que cache une case (« J'enlève 3 cubes de chaque côté ») ; absent :
                          « J'enlève 3 × ? de chaque côté » (11.2 : ? est un nombre de séances)
  unite     mot           l'unité des nombres (« J'enlève 8 € de chaque côté »)
  equation  [lignes]      ② l'équation, dans l'ordre de l'énoncé ; ③ « Je résous » est écrit par
                          render.py (balance_resous), sur les mêmes étapes que les schémas
  apres     [lignes]      ce qu'on calcule après 𝑥 (11.2 : le prix)
« On cherche le tout » (13.2, 17/10/2026) :
  tout      {…}           pas de carte : le modèle du corrigé (../tout.js) et le corrigé en équations
                          (equation, x) — voir ../livret-1/habillage.py
"""

H = {
 # ---------------------------------------------------------------- les exemples (pages 2, 5, 9)
 "ExB": dict(famille="B", inconnue="le nombre de cartes d’un paquet", noms={8: "paquet"},
   rangs=["Léa", "Tom"], depart="Les deux côtés : Léa et Tom", objet=["paquet", "paquets"], unite="cartes",
   equation=["3 × 𝑥 + 4 = 𝑥 + 20"],
   reponse="Un paquet contient {paquet} cartes.", verifs=["3 × 8 + 4 = 28 et 8 + 20 = 28 ✓"]),
 "ExU": dict(inconnue="une petite part", ordre=["Malik", "Lou", "Kim"], noms={30: "Malik", 15: "Lou", 10: "Kim"},
   articles={"Malik": "Malik", "Lou": "Lou", "Kim": "Kim"},
   phrases={"Malik": "Malik en a donc collé {d}", "Lou": "Lou en a donc collé {d}", "Kim": "Kim en a donc collé {d}"},
   reponse="Malik a collé {Malik} autocollants, Lou {Lou} et Kim {Kim}."),
 "ExG": dict(noms={10: "BD", 12: "roman", 15: "dictionnaire"}, lettres={"BD": "B", "roman": "R", "dictionnaire": "D"},
   pluriels={"BD": "BD", "roman": "romans", "dictionnaire": "dictionnaires"},
   legende={"BD": "une BD", "roman": "un roman", "dictionnaire": "un dictionnaire"},
   titres={"Le grand plateau": "Le grand achat", "Les deux petits plateaux": "Les deux petits achats",
           "Je remplace le petit plateau par son total": "Je remplace le petit achat par son prix",
           "Je remplace dans le plateau 52": "Je remplace dans l’achat de 52 €"},
   reponse="Une BD coûte {BD} €, un roman {roman} €, un dictionnaire {dictionnaire} €."),
 # ---------------------------------------------------------------- fiche H11 : la balance
 "11.1": dict(famille="B", inconnue="la masse d’un cube, en g", noms={25: "cube"},
   rangs=["1er côté", "2e côté"], depart="Les deux côtés de la balance", objet=["cube", "cubes"], unite="g",
   equation=["5 × 𝑥 = 3 × 𝑥 + 50"],
   reponse="Un cube pèse {cube} g.", verifs=["5 × 25 = 125 et 3 × 25 + 50 = 125 ✓"]),
 "11.2": dict(famille="B", inconnue="le nombre de séances", noms={6: "séances", 38: "prix"},
   rangs=["Théâtre", "Danse"], depart="Les deux clubs, pour le même nombre de séances", objet=None, unite="€",
   equation=["20 + 3 × 𝑥 = 8 + 5 × 𝑥"], apres=["Le prix : 20 + 3 × 6 = 38"],
   reponse="Les deux clubs coûtent le même prix pour {séances} séances : {prix} €.", verifs=["20 + 3 × 6 = 38 et 8 + 5 × 6 = 38 ✓"]),
 "11.3": dict(famille="B", inconnue="la valeur d’un billet, en €", noms={10: "billet"},
   rangs=["Lou", "Sam"], depart="Les deux tirelires", objet=["billet", "billets"], unite="€",
   equation=["4 × 𝑥 + 7 = 2 × 𝑥 + 27"],
   reponse="Un billet vaut {billet} €.", verifs=["4 × 10 + 7 = 47 et 2 × 10 + 27 = 47 ✓"]),
 "11.4": dict(famille="B", inconnue="la longueur d’un wagon de Malo, en cm", noms={9: "wagon"},   # « de Malo » : lot B (21/10/2026)
   rangs=["Malo", "Jade"], depart="Les deux trains", objet=["wagon", "wagons"], unite="cm",
   equation=["12 + 5 × 𝑥 = 16 + 14 + 3 × 𝑥"],
   reponse="Un wagon de Malo mesure {wagon} cm.", verifs=["12 + 5 × 9 = 57 et 16 + 14 + 3 × 9 = 57 ✓"]),
 # ---------------------------------------------------------------- fiche H12 : les rapports, niveau 3
 "12.1": dict(inconnue="la durée de la pâte, en min", noms={12: "pâte", 36: "cuisson", 24: "repos"},
   articles={"pâte": "la pâte", "cuisson": "la cuisson", "repos": "le repos"},
   phrases={"pâte": "La pâte prend donc {d} min", "cuisson": "La cuisson dure donc {d} min", "repos": "Le repos dure donc {d} min"},
   retourne="Je retourne : la cuisson dure 3 fois plus longtemps que la pâte, et le repos 2 fois plus.",
   reponse="La pâte prend {pâte} min, la cuisson {cuisson} min, le repos {repos} min."),
 "12.2": dict(inconnue="la masse du sac de Lisa, en kg", noms={3: "Lisa", 6: "Tom", 18: "glacière"},
   articles={"Lisa": "le sac de Lisa", "Tom": "le sac de Tom", "glacière": "la glacière"},
   phrases={"Lisa": "Le sac de Lisa pèse donc {d} kg", "Tom": "Le sac de Tom pèse donc {d} kg", "glacière": "La glacière pèse donc {d} kg"},
   retourne="Je retourne : la glacière pèse 3 fois plus que le sac de Tom.",
   reponse="Le sac de Lisa pèse {Lisa} kg, celui de Tom {Tom} kg, la glacière {glacière} kg."),
 "12.3": dict(inconnue="le nombre de crayons rouges", noms={9: "rouges", 27: "bleus", 13: "noirs"},
   articles={"rouges": "les rouges", "bleus": "les bleus", "noirs": "les noirs"},
   phrases={"rouges": "Il y a donc {d} crayons rouges", "bleus": "Il y a donc {d} crayons bleus", "noirs": "Il y a donc {d} crayons noirs"},
   retourne="Je retourne : il y a 3 fois plus de bleus que de rouges, et 4 noirs de plus que de rouges.",
   reponse="Il y a {rouges} crayons rouges, {bleus} bleus et {noirs} noirs."),
 "12.4": dict(inconnue="la longueur du ruban argenté, en m", noms={7: "argenté", 21: "doré", 17: "rouge"},
   articles={"argenté": "le ruban argenté", "doré": "le ruban doré", "rouge": "le ruban rouge"},
   phrases={"argenté": "Le ruban argenté mesure donc {d} m", "doré": "Le ruban doré mesure donc {d} m", "rouge": "Le ruban rouge mesure donc {d} m"},
   retourne="Je retourne : le ruban doré mesure 4 m de plus que le rouge.",
   reponse="Le ruban argenté mesure {argenté} m, le doré {doré} m, le rouge {rouge} m."),
 # ---------------------------------------------------------------- fiche H13 : les petites parts et le désordre
 # 13.1 (17/10/2026) : « la petite contient 3 fois moins que la grande » (le mélange de l'ancien 13.2), d'où « Je retourne »
 "13.1": dict(inconnue="une petite part, en cL", ordre=["grande", "moyenne", "petite"], noms={20: "petite", 30: "moyenne", 60: "grande"},
   articles={"petite": "la petite", "moyenne": "la moyenne", "grande": "la grande"},
   phrases={"petite": "La petite contient donc {d} cL", "moyenne": "La moyenne contient donc {d} cL", "grande": "La grande contient donc {d} cL"},
   retourne="Je retourne : la grande contient 3 fois plus que la petite.",
   reponse="La petite bouteille contient {petite} cL, la moyenne {moyenne} cL, la grande {grande} cL."),
 # 13.2 « on cherche le tout » (17/10/2026) : pas de carte, le corrigé est dessiné sur ce modèle (../tout.js) ;
 # la course (18 min) vaut 2 natations : toutes les barres s'écrivent en natations
 "13.2": dict(noms={63: "tout"}, reponse="Léa a mis {tout} min en tout.",
   verifs=["vélo = 4 × natation : 36 = 4 × 9 ✓", "vélo = 2 × course : 36 = 2 × 18 ✓"],
   tout=dict(titre1="Schéma de comparaison — je pars de la natation",
     rows=[dict(label="natation", cells=[dict(v=9)]), dict(label="course", cells=[dict(v=9)] * 2),
           dict(label="vélo", cells=[dict(v=9)] * 4, sous=[dict(de=0, a=1, label="course"), dict(de=2, a=3, label="course")])],
     ligne=[dict(label="natation", cells=[dict(v=9)]), dict(label="course", cells=[dict(v=9)] * 2), dict(label="vélo", cells=[dict(v=9)] * 4)],
     calculs=["Le vélo dure 4 × 9 = 36 min", "La course dure 36 ÷ 2 = 18 min", "? = 9 + 18 + 36 = 63"],
     equation=[["Je choisis l’inconnue", ["𝑥 : le temps de Léa en tout, en min"]],
               ["J’écris l’équation", ["𝑥 = 9 + (4 × 9) ÷ 2 + 4 × 9"]],
               ["Je résous", ["𝑥 = 9 + 36 ÷ 2 + 36", "𝑥 = 9 + 18 + 36 = 63"]]], x=63)),
 "13.3": dict(inconnue="la masse du panier de litchis, en kg", noms={8: "litchis", 11: "mangues", 16: "ananas"},
   articles={"litchis": "le panier de litchis", "mangues": "le panier de mangues", "ananas": "le panier d’ananas"},
   phrases={"litchis": "Le panier de litchis pèse donc {d} kg", "mangues": "Le panier de mangues pèse donc {d} kg", "ananas": "Le panier d’ananas pèse donc {d} kg"},
   retourne="Je retourne : le panier d’ananas pèse 5 kg de plus que celui de mangues, et celui de mangues 3 kg de plus que celui de litchis.",
   reponse="Le panier de litchis pèse {litchis} kg, celui de mangues {mangues} kg, celui d’ananas {ananas} kg."),
 "13.4": dict(inconnue="la longueur du tuyau de la cour, en m", noms={6: "cour", 12: "garage", 36: "jardin"},
   articles={"cour": "le tuyau de la cour", "garage": "le tuyau du garage", "jardin": "le tuyau du jardin"},
   phrases={"cour": "Le tuyau de la cour mesure donc {d} m", "garage": "Le tuyau du garage mesure donc {d} m", "jardin": "Le tuyau du jardin mesure donc {d} m"},
   retourne="Je retourne : le tuyau du garage est 2 fois plus long que celui de la cour.",
   reponse="Le tuyau de la cour mesure {cour} m, celui du garage {garage} m, celui du jardin {jardin} m."),
 # ---------------------------------------------------------------- fiche H14 : je recopie
 # 14.1 et 14.2 en « je recopie » (lot B, 21/10/2026) : les titres du plan RECOPIE de l'outil, comme 14.3 et 14.4
 "14.1": dict(noms={7: "part de gâteau", 6: "jus"}, lettres={"part de gâteau": "G", "jus": "J"}, pluriels={"part de gâteau": "parts de gâteau", "jus": "jus"},
   legende={"part de gâteau": "une part de gâteau", "jus": "un jus de fruits"},
   titres={"Les deux plateaux": "Les deux achats", "Je recopie 2 fois le plateau 19": "Je recopie 2 fois l’achat de 19 €",
           "Je retrouve le plateau 32 dedans": "Je retrouve l’achat de 32 € dedans"},
   reponse="Une part de gâteau coûte {part de gâteau} €, un jus de fruits {jus} €."),
 "14.2": dict(noms={5: "sac de patates", 10: "sac de riz"}, lettres={"sac de patates": "P", "sac de riz": "R"},
   pluriels={"sac de patates": "sacs de patates", "sac de riz": "sacs de riz"},
   legende={"sac de patates": "un sac de patates douces", "sac de riz": "un sac de riz"},
   legendeLettre={"sac de patates": "masse d’un sac de patates douces, en kg", "sac de riz": "masse d’un sac de riz, en kg"},
   titres={"Les deux plateaux": "Les deux pesées", "Je recopie 3 fois le plateau 35": "Je recopie 3 fois la pesée de 35 kg",
           "Je retrouve le plateau 25 dedans": "Je retrouve la pesée de 25 kg dedans"},
   reponse="Un sac de patates douces pèse {sac de patates} kg, un sac de riz {sac de riz} kg."),
 "14.3": dict(noms={18: "grand", 7: "petit"}, lettres={"grand": "G", "petit": "P"}, pluriels={"grand": "grands", "petit": "petits"},
   legende={"grand": "un grand cadre", "petit": "un petit cadre"},
   legendeLettre={"grand": "largeur d’un grand cadre, en cm", "petit": "largeur d’un petit cadre, en cm"},
   titres={"Les deux plateaux": "Les deux mesures", "Je recopie 2 fois le plateau 46": "Je recopie 2 fois la mesure de 46 cm",
           "Je retrouve le plateau 43 dedans": "Je retrouve la mesure de 43 cm dedans"},
   reponse="Un grand cadre mesure {grand} cm de large, un petit cadre {petit} cm."),
 "14.4": dict(noms={22: "long", 9: "court"}, lettres={"long": "L", "court": "C"}, pluriels={"long": "longs", "court": "courts"},
   legende={"long": "un épisode long", "court": "un épisode court"},
   legendeLettre={"long": "durée d’un épisode long, en min", "court": "durée d’un épisode court, en min"},
   titres={"Les deux plateaux": "Les deux durées", "Je recopie 3 fois le plateau 49": "Je recopie 3 fois la durée de 49 min",
           "Je retrouve le plateau 84 dedans": "Je retrouve la durée de 84 min dedans"},
   reponse="Un épisode long dure {long} min, un épisode court {court} min."),
 # ---------------------------------------------------------------- fiche H15 : deux gestes à la suite
 "15.1": dict(noms={8: "roses", 5: "plante verte", 12: "orchidée"}, lettres={"roses": "R", "plante verte": "P", "orchidée": "O"},
   pluriels={"roses": "roses", "plante verte": "plantes vertes", "orchidée": "orchidées"},
   legende={"roses": "un bouquet de roses", "plante verte": "une plante verte", "orchidée": "une orchidée"},
   titres={"Le grand plateau": "Le grand achat", "Les deux petits plateaux": "Les deux petits achats",
           "Je remplace le petit plateau par son total": "Je remplace le petit achat par son prix",
           "Je remplace dans le plateau 33": "Je remplace dans l’achat de 33 €"},
   reponse="Un bouquet de roses coûte {roses} €, une plante verte {plante verte} €, une orchidée {orchidée} €."),
 "15.2": dict(noms={10: "sac de terreau", 25: "sac de sable", 15: "sac de gravier"}, lettres={"sac de terreau": "T", "sac de sable": "S", "sac de gravier": "G"},
   pluriels={"sac de terreau": "sacs de terreau", "sac de sable": "sacs de sable", "sac de gravier": "sacs de gravier"},
   legende={"sac de terreau": "un sac de terreau", "sac de sable": "un sac de sable", "sac de gravier": "un sac de gravier"},
   legendeLettre={"sac de terreau": "masse d’un sac de terreau, en kg", "sac de sable": "masse d’un sac de sable, en kg", "sac de gravier": "masse d’un sac de gravier, en kg"},
   titres={"Le grand plateau": "La grande pesée", "Les deux petits plateaux": "Les deux petites pesées",
           "Je retrouve 1 paire dans le plateau": "Je retrouve 1 paire dans la pesée de 60 kg",
           "Je remplace dans le plateau 65": "Je remplace dans la pesée de 65 kg"},
   reponse="Un sac de terreau pèse {sac de terreau} kg, un sac de sable {sac de sable} kg, un sac de gravier {sac de gravier} kg."),
 "15.3": dict(noms={20: "atelier", 7: "jeu", 13: "conte"}, lettres={"atelier": "A", "jeu": "J", "conte": "C"},
   pluriels={"atelier": "ateliers", "jeu": "jeux", "conte": "contes"},
   legende={"atelier": "un atelier", "jeu": "un jeu", "conte": "un conte"},
   legendeLettre={"atelier": "durée d’un atelier, en min", "jeu": "durée d’un jeu, en min", "conte": "durée d’un conte, en min"},
   titres={"Le grand plateau": "Le grand programme", "Les deux petits plateaux": "Les deux petits programmes",
           "Je recopie 2 fois le plateau 41": "Je recopie 2 fois le programme de 41 min",
           "Je retrouve le plateau 47 dedans": "Je retrouve le programme de 47 min dedans",
           "Je remplace dans le plateau 53": "Je remplace dans le programme de 53 min"},
   reponse="Un atelier dure {atelier} min, un jeu {jeu} min, un conte {conte} min."),
 "15.4": dict(noms={10: "billet", 7: "pop-corn", 5: "soda"}, lettres={"billet": "B", "pop-corn": "P", "soda": "S"},
   pluriels={"billet": "billets", "pop-corn": "pop-corn", "soda": "sodas"},
   legende={"billet": "un billet", "pop-corn": "un pop-corn", "soda": "un soda"},
   titres={"Les trois plateaux": "Les trois achats", "Je remplace un petit plateau par son total": "Je remplace un petit achat par son prix",
           "Je remplace l’autre petit plateau par son total": "Je remplace l’autre petit achat par son prix"},
   remplacer=[],
   reponse="Un billet coûte {billet} €, un pop-corn {pop-corn} €, un soda {soda} €."),
}
