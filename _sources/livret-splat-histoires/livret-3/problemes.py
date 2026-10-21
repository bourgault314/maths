# -*- coding: utf-8 -*-
"""Les histoires de SPLAT! — livret 3 (niveau 3, H11 à H15) : les problèmes et leur carte SPLAT! cachée.
Écrit le 15/10/2026 d'après le § 7 de la progression, livret de 12 pages (choix de Gwenaël du 15/10 :
H14 et H15 à 2 problèmes par page, un exemple résolu avant chaque dessin nouveau). Chaque problème :
texte, question, type (classification SPLAT!), carte cachée, réponse, et un contrôle (toutes les
relations recalculées)."""

def P(code, texte, question, typ, carte, reponse, vals, controles, grandeur):
    for c in controles:
        assert eval(c, {}, vals), (code, c, vals)
    return dict(code=code, texte=texte, question=question, type=typ, carte=carte, reponse=reponse, vals=vals, grandeur=grandeur)

# Les trois exemples résolus (pages 2, 5 et 9) : un avant chaque dessin nouveau
EXEMPLES = {
 "ExB": P("ExB",
   "Léa et Tom ont autant de cartes à collectionner. Léa a 3 paquets identiques et 4 cartes. Tom a 1 paquet pareil et 20 cartes.",
   "Combien y a-t-il de cartes dans un paquet ?",
   "La balance : des inconnues des deux côtés, un nombre de chaque côté (monde 5, fiche 37)",
   "3 x + 4 = x + 20", "Un paquet contient 8 cartes",
   dict(x=8), ["3*x+4==x+20"], "nombre"),
 "ExU": P("ExU",
   "Malik, Lou et Kim ont collé 55 autocollants dans leurs albums. Malik en a collé 2 fois plus que Lou, et 3 fois plus que Kim.",
   "Combien d’autocollants chacun a-t-il collés ?",
   "Les petites parts (2, 3) : deux rapports vers le plus grand (type 13)",
   "TOTAL 55 · C = 2 × A · C = 3 × B", "Malik : 30 · Lou : 15 · Kim : 10",
   dict(a=30, l=15, k=10), ["a+l+k==55", "a==2*l", "a==3*k"], "nombre"),
 "ExG": P("ExG",
   "À la librairie, Ali paie 52 € pour 1 BD, 1 roman et 2 dictionnaires. Zoé paie 46 € pour 1 BD et 3 romans. Max paie 22 € pour 1 BD et 1 roman.",
   "Combien coûte chaque livre ?",
   "Deux gestes à la suite (4e·1c) : je retire dans les deux petits achats, puis je remplace dans le grand",
   "Plateaux : A + B + 2 C = 52 · A + 3 B = 46 · A + B = 22", "BD : 10 € · roman : 12 € · dictionnaire : 15 €",
   dict(b=10, r=12, d=15), ["b+r+2*d==52", "b+3*r==46", "b+r==22"], "prix"),
}

FICHES = [
 ("11", "La balance", "Monde 5 · SPLAT! Équations (fiche 37)", [
  P("11.1", "Sur la balance de la classe, 5 cubes en bois identiques sont en équilibre avec 3 de ces cubes et une masse de 50 g.",
    "Combien pèse un cube ?",
    "La balance : des inconnues des deux côtés, un nombre d’un seul côté",
    "5 x = 3 x + 50", "Un cube pèse 25 g",
    dict(x=25), ["5*x==3*x+50"], "masse"),
  P("11.2", "Au club de théâtre, l’inscription coûte 20 €, puis 3 € par séance. Au club de danse, l’inscription coûte 8 €, puis 5 € par séance.",
    "Pour combien de séances les deux clubs coûtent-ils le même prix ? Quel est ce prix ?",
    "Deux tarifs : des inconnues et un nombre des deux côtés",
    "20 + 3 x = 8 + 5 x", "6 séances, 38 €",
    dict(x=6), ["20+3*x==8+5*x"], "prix"),
  P("11.3", "Les tirelires de Lou et de Sam contiennent la même somme. Celle de Lou : 4 billets identiques et 7 € en pièces. Celle de Sam : 2 billets de la même valeur et 27 € en pièces.",
    "Quelle est la valeur d’un billet ?",
    "Deux tirelires : des inconnues et un nombre des deux côtés",
    "4 x + 7 = 2 x + 27", "Un billet vaut 10 €",
    dict(x=10), ["4*x+7==2*x+27"], "prix"),
  P("11.4", "Les trains miniatures de Malo et de Jade ont la même longueur. Malo : une locomotive de 12 cm et 5 wagons identiques. Jade : une locomotive de 16 cm, un wagon à charbon de 14 cm et 3 wagons du même modèle que ceux de Malo.",
    "Quelle est la longueur d’un wagon de Malo ?",
    "Le mélange : deux nombres d’un côté, les nombres dits avant les inconnues",
    "12 + 5 x = 16 + 14 + 3 x", "Un wagon de Malo mesure 9 cm",
    dict(x=9), ["12+5*x==16+14+3*x"], "longueur"),
 ]),
 ("12", "Les rapports, niveau 3", "Monde 3 · SPLAT! Enquête, les rapports", [
  P("12.1", "Le gâteau de Mamie se fait en 72 minutes : la pâte, la cuisson, le repos. Préparer la pâte prend 3 fois moins de temps que la cuisson, et 2 fois moins que le repos.",
    "Combien de temps dure chaque étape ?",
    "Une référence (la plus petite), deux rapports « fois moins » (type 8, « ÷ et ÷ »)",
    "TOTAL 72 · A = B ÷ 3 · A = C ÷ 2", "Pâte : 12 min · cuisson : 36 min · repos : 24 min",
    dict(p=12, c=36, r=24), ["p+c+r==72", "p*3==c", "p*2==r"], "durée"),
  P("12.2", "Pour le pique-nique, le sac de Tom, le sac de Lisa et la glacière pèsent 27 kg en tout. Le sac de Tom pèse 2 fois plus que celui de Lisa, et 3 fois moins que la glacière.",
    "Combien pèse chacun ?",
    "En chaîne, « fois plus » puis « fois moins » : celui du milieu est dit deux fois (type 9, « × puis ÷ »)",
    "TOTAL 27 · B = 2 × A · B = C ÷ 3", "Lisa : 3 kg · Tom : 6 kg · glacière : 18 kg",
    dict(l=3, t=6, g=18), ["l+t+g==27", "t==2*l", "t*3==g"], "masse"),
  P("12.3", "Une boîte contient 49 crayons : des rouges, des bleus et des noirs. Il y a 3 fois moins de rouges que de bleus, et 4 rouges de moins que de noirs.",
    "Combien y a-t-il de crayons de chaque couleur ?",
    "Une référence (la plus petite), un rapport et un écart, tous deux à retourner (type 10, « ÷ et − »)",
    "TOTAL 49 · A = B ÷ 3 · A = C − 4", "Rouges : 9 · bleus : 27 · noirs : 13",
    dict(r=9, b=27, n=13), ["r+b+n==49", "r*3==b", "r==n-4"], "nombre"),
  P("12.4", "Pour décorer la salle, Mia a trois rubans : 45 m en tout. Le ruban doré est 3 fois plus long que le ruban argenté. Le ruban rouge mesure 4 m de moins que le doré.",
    "Combien mesure chaque ruban ?",
    "Je complète avec un rapport : les deux indices parlent du plus grand (type 12)",
    "TOTAL 45 · C = 3 × A · B = C − 4", "Argenté : 7 m · doré : 21 m · rouge : 17 m",
    dict(a=7, d=21, r=17), ["a+d+r==45", "d==3*a", "r==d-4"], "longueur"),
 ]),
 ("13", "Les petites parts et le désordre", "Monde 3 · SPLAT! Enquête, 2e tour", [
  # (17/10/2026, choix de Gwenaël) un « fois plus » et un « fois moins » : le mélange de l'ancien 13.2, gardé ici
  P("13.1", "Trois bouteilles contiennent 110 cL en tout. La grande contient 2 fois plus que la moyenne. La petite contient 3 fois moins que la grande.",
    "Combien contient chaque bouteille ?",
    "Les petites parts (2, 3) : un « fois plus » et un « fois moins » vers la plus grande (type 13)",
    "TOTAL 110 · C = 2 × A · B = C ÷ 3", "Petite : 20 cL · moyenne : 30 cL · grande : 60 cL",
    dict(g=60, m=30, p=20), ["g+m+p==110", "g==2*m", "p*3==g"], "contenance"),
  # (17/10/2026, choix de Gwenaël après l'audit) « on cherche le tout » : le temps de Léa est l'inconnue ; la
  # natation est donnée, le vélo par un « fois plus », la course par un « fois plus » à retourner ; pas de carte
  P("13.2", "Au triathlon de l’école, la natation de Léa a duré 9 minutes. Son parcours à vélo a duré 4 fois plus longtemps que sa natation, et 2 fois plus longtemps que sa course à pied.",
    "Combien de temps Léa a-t-elle mis en tout ?",
    "On cherche le tout : en chaîne, « fois plus » puis « fois plus » à retourner",
    "Aucune carte SPLAT! · on cherche le total : B = 4 × A · B = 2 × C", "Léa a mis 63 min en tout",
    dict(n=9, v=36, c=18, t=63), ["n==9", "v==4*n", "v==2*c", "t==n+v+c"], "durée"),
  P("13.3", "Au marché, trois paniers de fruits pèsent 35 kg. Le panier de mangues pèse 5 kg de moins que celui d’ananas. Le panier de litchis pèse 3 kg de moins que celui de mangues.",
    "Combien pèse chaque panier ?",
    "En chaîne, « de moins » puis « de moins », les indices dans le désordre (type 20 sur un type 6)",
    "TOTAL 35 · B = C − 5 · A = B − 3 (dit dans le désordre)", "Litchis : 8 kg · mangues : 11 kg · ananas : 16 kg",
    dict(l=8, m=11, a=16), ["l+m+a==35", "m==a-5", "l==m-3"], "masse"),
  P("13.4", "Trois tuyaux d’arrosage mesurent 54 m en tout. Le tuyau du jardin est 3 fois plus long que celui du garage. Le tuyau de la cour est 2 fois moins long que celui du garage.",
    "Combien mesure chaque tuyau ?",
    "En chaîne, « fois moins » puis « fois plus », les indices dans le désordre (type 20 sur un type 9)",
    "TOTAL 54 · C = 3 × B · A = B ÷ 2 (dit dans le désordre)", "Cour : 6 m · garage : 12 m · jardin : 36 m",
    dict(c=6, g=12, j=36), ["c+g+j==54", "j==3*g", "c*2==g"], "longueur"),
 ]),
 ("14", "Je recopie", "Monde 4 · SPLAT! Système, 2e livret", [
  # (21/10/2026, lot B, décision de Gwenaël) 14.1 et 14.2 se corrigent en RECOPIE, comme le titre de la fiche (avant :
  # « je remplace » et « j’additionne ») ; « une part de gâteau » (un gâteau entier ne coûte pas 7 €)
  P("14.1", "Au salon de thé, Inès paie 19 € pour 1 part de gâteau et 2 jus de fruits. Mehdi paie 32 € pour 2 parts de gâteau et 3 jus de fruits.",
    "Combien coûte une part de gâteau ? un jus de fruits ?",
    "Je recopie 2 fois (3c) : l’achat de 19 € recopié 2 fois contient l’achat de 32 €",
    "Plateau 1 : A + 2 B = 19 · plateau 2 : 2 A + 3 B = 32 (le plan « je recopie » de l’outil)", "Part de gâteau : 7 € · jus : 6 €",
    dict(g=7, j=6), ["g+2*j==19", "2*g+3*j==32"], "prix"),
  P("14.2", "Au magasin, 1 sac de patates douces et 3 sacs de riz pèsent 35 kg. 3 sacs de patates douces et 1 sac de riz pèsent 25 kg. Tous les sacs d’une même sorte ont la même masse.",
    "Combien pèse un sac de chaque sorte ?",
    "Je recopie 3 fois (3c) : la pesée de 35 kg recopiée 3 fois contient la pesée de 25 kg",
    "Plateau 1 : A + 3 B = 35 · plateau 2 : 3 A + B = 25 (le plan « je recopie » de l’outil)", "Patates douces : 5 kg · riz : 10 kg",
    dict(p=5, r=10), ["p+3*r==35", "3*p+r==25"], "masse"),
  P("14.3", "Sur le mur, des cadres sont accrochés côte à côte, sans espace. Tous les grands ont la même largeur, tous les petits aussi. 1 grand et 4 petits occupent 46 cm ; 2 grands et 1 petit, 43 cm.",
    "Quelle est la largeur d’un grand cadre ? d’un petit cadre ?",
    "Je recopie 2 fois (3c) : le premier achat recopié contient le second",
    "Plateau 1 : A + 4 B = 46 · plateau 2 : 2 A + B = 43", "Grand cadre : 18 cm · petit cadre : 7 cm",
    dict(g=18, p=7), ["g+4*p==46", "2*g+p==43"], "longueur"),
  P("14.4", "Un dessin animé a des épisodes de deux durées : des longs et des courts. 1 épisode long et 3 courts durent 49 minutes ; 3 longs et 2 courts, 84 minutes.",
    "Combien de temps dure un épisode long ? un épisode court ?",
    "Je recopie 3 fois (3c)",
    "Plateau 1 : A + 3 B = 49 · plateau 2 : 3 A + 2 B = 84", "Long : 22 min · court : 9 min",
    dict(l=22, c=9), ["l+3*c==49", "3*l+2*c==84"], "durée"),
 ]),
 ("15", "Deux gestes à la suite", "Monde 4 · SPLAT! Système, 2e livret", [
  P("15.1", "Au marché aux fleurs, Nour paie 33 € pour 2 bouquets de roses, 1 plante verte et 1 orchidée. Lina paie 31 € pour 2 bouquets de roses et 3 plantes vertes. Hugo paie 21 € pour 2 bouquets de roses et 1 plante verte.",
    "Combien coûte chaque article ?",
    "Deux gestes à la suite (4e·1c) : je retire dans les petits achats, puis je remplace dans le grand",
    "Plateaux : 2 A + B + C = 33 · 2 A + 3 B = 31 · 2 A + B = 21", "Roses : 8 € · plante : 5 € · orchidée : 12 €",
    dict(r=8, p=5, o=12), ["2*r+p+o==33", "2*r+3*p==31", "2*r+p==21"], "prix"),
  P("15.2", "Au magasin de jardinage, 1 sac de terreau, 1 sac de sable et 2 sacs de gravier pèsent 65 kg. 1 sac de terreau et 2 sacs de sable pèsent 60 kg. 2 sacs de terreau et 1 sac de sable pèsent 45 kg. Tous les sacs d’une même sorte ont la même masse.",
    "Combien pèse un sac de chaque sorte ?",
    "Deux gestes à la suite (4e·3a) : j’additionne les petits achats, puis je remplace dans le grand",
    "Plateaux : A + B + 2 C = 65 · A + 2 B = 60 · 2 A + B = 45", "Terreau : 10 kg · sable : 25 kg · gravier : 15 kg",
    dict(t=10, s=25, g=15), ["t+s+2*g==65", "t+2*s==60", "2*t+s==45"], "masse"),
  P("15.3", "Au centre de loisirs, chaque activité dure toujours le même temps. 1 atelier, 1 jeu et 2 contes durent 53 minutes. 1 atelier et 3 jeux durent 41 minutes. 2 ateliers et 1 jeu durent 47 minutes.",
    "Combien de temps dure chaque activité ?",
    "Deux gestes à la suite (4e·3c) : je recopie un petit achat, puis je remplace dans le grand",
    "Plateaux : A + B + 2 C = 53 · A + 3 B = 41 · 2 A + B = 47", "Atelier : 20 min · jeu : 7 min · conte : 13 min",
    dict(a=20, j=7, h=13), ["a+j+2*h==53", "a+3*j==41", "2*a+j==47"], "durée"),
  P("15.4", "Au cinéma, Inès paie 12 € pour un pop-corn et un soda. Lucas paie 24 € pour un billet, un pop-corn, un soda et des lunettes 3D à 2 €. Tom paie 17 € pour un billet et un pop-corn.",
    "Combien coûtent un billet, un pop-corn et un soda ?",
    "Le mélange (comme la fiche 28d) : trois articles (1d), un prix connu, les achats dans le désordre",
    "Plateaux : A + B + C + 2 = 24 · A + B = 17 · B + C = 12 (dits dans le désordre)", "Billet : 10 € · pop-corn : 7 € · soda : 5 €",
    dict(bi=10, po=7, so=5), ["bi+po+so+2==24", "bi+po==17", "po+so==12"], "prix"),
 ]),
]

# Le dos : « un mélange des trois livrets » (un total ou un rapport, et un don qui égalise)
DEFI = [
  P("D5", "Deux bidons contiennent 64 L d’eau à eux deux. On verse 7 L du bidon rouge dans le bidon bleu : les deux bidons contiennent alors autant d’eau.",
    "Combien de litres contenait chaque bidon au début ?",
    "Un total (livret 1, H2) et un don qui égalise (livret 1, le dos)",
    "Aucune carte SPLAT! · schéma en barres : après, 64 ÷ 2 ; avant, ± 7", "Rouge : 39 L · bleu : 25 L",
    dict(r=39, b=25), ["r+b==64", "r-7==b+7"], "contenance"),
  P("D6", "Lina a 3 fois plus d’argent que Sami. Elle donne 12 € à Sami : ils ont alors la même somme.",
    "Combien chacun avait-il au début ?",
    "Un rapport sans total (livret 1, H4) et un don qui égalise",
    "Aucune carte SPLAT! · schéma en barres : 3 parts et 1 part ; l’écart, 2 parts = 12 + 12", "Sami : 12 € · Lina : 36 €",
    dict(s=12, l=36), ["l==3*s", "l-12==s+12"], "prix"),
]

TOUS = [p for f in FICHES for p in f[3]] + DEFI

if __name__ == "__main__":
    import re, collections
    print("fiches:", len(FICHES), "problèmes:", sum(len(f[3]) for f in FICHES), "+ défis", len(DEFI), "+ exemples", len(EXEMPLES))
    # nombres à sous-entendu (liste de l'outil, en sous-chaîne comme lui, + 51 du livret 1)
    nums = set(int(n) for p in TOUS + list(EXEMPLES.values()) for n in re.findall(r"\d+", p["texte"] + p["reponse"]))
    assert not [n for n in nums if any(s in str(n) for s in ("69", "88", "420", "666", "1488")) or n == 51], nums
    for f in FICHES:
        # les totaux d'une fiche tous différents (ceux de chaque achat compris)
        tot = [t for p in f[3] for t in re.findall(r"(?:TOTAL |= )(\d+)(?= ·|$| \()", p["carte"])]
        assert len(set(tot)) == len(tot), (f[0], tot)
        g = set(p["grandeur"] for p in f[3]); assert len(g) >= 3, (f[0], g)
    c = collections.Counter(p["grandeur"] for p in TOUS)
    print("grandeurs :", dict(c), "· prix :", c["prix"], "/", len(TOUS))
    assert c["prix"] * 3 <= len(TOUS)
    for k in ("longueur", "masse", "durée", "contenance"): assert c[k] >= 1, k
    # énoncés courts : le plus long, en caractères
    print("plus long énoncé :", max(len(p["texte"]) for p in TOUS), "caractères")
    print("OK")
