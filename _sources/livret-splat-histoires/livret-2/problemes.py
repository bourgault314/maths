# -*- coding: utf-8 -*-
"""Les histoires de SPLAT! — livret 2 (niveau 2, H6 à H10) : les problèmes et leur carte SPLAT! cachée.
Écrit le 15/10/2026 d'après le § 7 de la progression. Chaque problème : texte, question, type
(classification SPLAT!), carte cachée, réponse, et un contrôle (toutes les relations recalculées).
Les graines (adresse de l'outil + graine) se cherchent après la relecture de Gwenaël."""

def P(code, texte, question, typ, carte, reponse, vals, controles, grandeur):
    for c in controles:
        assert eval(c, {}, vals), (code, c, vals)
    return dict(code=code, texte=texte, question=question, type=typ, carte=carte, reponse=reponse, vals=vals, grandeur=grandeur)

EXEMPLE = P("Ex",
  "Lila, Noa et Tom ont ramassé 64 coquillages à eux trois. Lila en a 7 de plus que Noa, et 4 de plus que Tom.",
  "Combien de coquillages chacun a-t-il ramassés ?",
  "Je complète : les deux indices parlent de la plus grande, deux « de plus » (type 7)",
  "TOTAL 64 · A = B + 7 · A = C + 4", "Lila : 25 · Noa : 18 · Tom : 21",
  dict(l=25, n=18, t=21), ["l+n+t==64", "l==n+7", "l==t+4"], "nombre")

FICHES = [
 ("6", "Qui sert de référence ?", "Monde 3 · SPLAT! Enquête, les trois dessins", [
  P("6.1", "Pour la kermesse, une guirlande de 90 m est coupée en trois morceaux. Le 1er morceau mesure 12 m de moins que le 3e. Le 2e mesure 6 m de moins que le 3e.",
    "Combien mesure chaque morceau ?",
    "Une référence, deux écarts « de moins » : la référence est la plus grande (type 5, « − et − »)",
    "TOTAL 90 · A = C − 12 · B = C − 6", "1er : 24 m · 2e : 30 m · 3e : 36 m",
    dict(a=24, b=30, c=36), ["a+b+c==90", "a==c-12", "b==c-6"], "longueur"),
  # (17/10/2026, choix de Gwenaël après l'audit) « on cherche le tout » : le total est l'inconnue, les parties
  # données par un nombre et deux indices en chaîne ; pas de carte SPLAT! (le total y est toujours donné)
  P("6.2", "Le spectacle de fin d’année a trois parties. La danse dure 15 minutes. Le théâtre dure 9 minutes de plus que la danse, et la chorale 12 minutes de plus que le théâtre.",
    "Combien de temps dure le spectacle ?",
    "On cherche le tout : en chaîne, « de plus » puis « de plus »",
    "Aucune carte SPLAT! · on cherche le total : B = A + 9 · C = B + 12", "Le spectacle dure 75 min",
    dict(a=15, b=24, c=36, t=75), ["a==15", "b==a+9", "c==b+12", "t==a+b+c"], "durée"),
  P("6.3", "Au tournoi de basket, trois équipes ont marqué 94 points en tout. Les Lions ont marqué 13 points de plus que les Tigres, et 8 points de moins que les Requins.",
    "Combien de points chaque équipe a-t-elle marqués ?",
    "En chaîne, « de plus » puis « de moins » : celle du milieu est dite deux fois (type 6)",
    "TOTAL 94 · B = A + 13 · B = C − 8", "Tigres : 20 points · Lions : 33 · Requins : 41",
    dict(a=20, b=33, c=41), ["a+b+c==94", "b==a+13", "b==c-8"], "nombre"),
  P("6.4", "Sami, Lou et Nour ont 150 cL d’eau à eux trois dans leurs gourdes. La gourde de Sami contient 18 cL de plus que celle de Lou. Celle de Nour contient 12 cL de moins que celle de Sami.",
    "Combien contient chaque gourde ?",
    "Je complète : les deux indices parlent de la plus grande, un « de plus » et un « de moins » (type 7)",
    "TOTAL 150 · A = B + 18 · C = A − 12", "Lou : 42 cL · Nour : 48 cL · Sami : 60 cL",
    dict(s=60, l=42, n=48), ["s+l+n==150", "s==l+18", "n==s-12"], "contenance"),
 ]),
 ("7", "Les rapports, en mots et en chaîne", "Monde 3 · SPLAT! Enquête, les rapports", [
  P("7.1", "Maëlle et son grand frère Tiago ont 36 ans à eux deux. L’âge de Maëlle est la moitié de celui de Tiago.",
    "Quel âge a Maëlle ? Et Tiago ?",
    "Un rapport dit avec un mot : « la moitié » (type 14, à retourner)",
    "TOTAL 36 · A = B ÷ 2", "Maëlle : 12 ans · Tiago : 24 ans",
    dict(m=12, t=24), ["m+t==36", "m*2==t"], "âge"),
  P("7.2", "Trois colis pèsent 40 kg en tout. Le colis bleu pèse 3 fois plus que le petit colis. Le petit colis pèse 4 fois moins que le colis rouge.",
    "Combien pèse chaque colis ?",
    "Une référence (la plus petite), deux rapports : « fois plus » et « fois moins » (type 8, « × et ÷ »)",
    "TOTAL 40 · B = 3 × A · A = C ÷ 4", "Petit : 5 kg · bleu : 15 kg · rouge : 20 kg",
    dict(p=5, b=15, r=20), ["p+b+r==40", "b==3*p", "p*4==r"], "masse"),
  P("7.3", "Trois fils de laine mesurent 63 cm mis bout à bout. Le fil bleu est 2 fois plus long que le fil blanc. Le fil rouge est 3 fois plus long que le fil bleu.",
    "Combien mesure chaque fil ?",
    "En chaîne, deux rapports : « fois plus » puis « fois plus » (type 9)",
    "TOTAL 63 · B = 2 × A · C = 3 × B", "Blanc : 7 cm · bleu : 14 cm · rouge : 42 cm",
    dict(bl=7, b=14, r=42), ["bl+b+r==63", "b==2*bl", "r==3*b"], "longueur"),
  P("7.4", "Un documentaire de 65 minutes a trois parties : la mer, la forêt, le volcan. La forêt dure 7 minutes de plus que la mer. Le volcan dure 2 fois plus longtemps que la forêt.",
    "Combien de temps dure chaque partie ?",
    "En chaîne, un écart puis un rapport (type 11)",
    "TOTAL 65 · B = A + 7 · C = 2 × B", "Mer : 11 min · forêt : 18 min · volcan : 36 min",
    dict(m=11, f=18, v=36), ["m+f+v==65", "f==m+7", "v==2*f"], "durée"),
 ]),
 ("8", "Les indices qui se cachent", "Monde 3 · SPLAT! Enquête, deuxième tour", [
  P("8.1", "Le club de lecture compte 35 membres, des enfants et des adultes. Il y a 5 enfants de plus que le double du nombre d’adultes.",
    "Combien y a-t-il d’adultes ? d’enfants ?",
    "Indice composé : « de plus que le double » (type 15)",
    "TOTAL 35 · B = 2 × A + 5", "10 adultes et 25 enfants",
    dict(a=10, e=25), ["a+e==35", "e==2*a+5"], "nombre"),
  P("8.2", "Le terrain derrière la maison de Nour a une aire de 92 m² : une pelouse et une terrasse. L’aire de la pelouse fait 4 m² de moins que le triple de celle de la terrasse.",
    "Quelle est l’aire de la terrasse ? de la pelouse ?",
    "Indice composé : « de moins que le triple » (type 15)",
    "TOTAL 92 · B = 3 × A − 4", "Terrasse : 24 m² · pelouse : 68 m²",
    dict(t=24, p=68), ["t+p==92", "p==3*t-4"], "aire"),
  P("8.3", "Trois bidons contiennent 72 L d’eau en tout. Le bidon vert contient 6 L de plus que le bidon jaune. Le bidon noir contient autant que les deux autres réunis.",
    "Combien de litres contient chaque bidon ?",
    "Deux quantités réunies, avec un écart entre les deux (type 16)",
    "TOTAL 72 · B = A + 6 · C = A + B", "Jaune : 15 L · vert : 21 L · noir : 36 L",
    dict(j=15, v=21, n=36), ["j+v+n==72", "v==j+6", "n==j+v"], "contenance"),
  # (21/10/2026, lot B) les 20 kg sont ceux des fournitures (pas de l’emballage)
  P("8.4", "Le colis pour l’école contient 20 kg de fournitures : 4 kg de livres, des cahiers et des jeux. Les cahiers pèsent 2 kg de plus que les jeux.",
    "Combien pèsent les jeux ? les cahiers ?",
    "Une quantité déjà connue (les jetons visibles) et un écart (type 17)",
    "TOTAL 20 · 4 jetons visibles · B = A + 2", "Jeux : 7 kg · cahiers : 9 kg",
    dict(j=7, c=9), ["4+j+c==20", "c==j+2"], "masse"),
 ]),
 ("9", "Des paquets", "Monde 5 · SPLAT! Équations (fiche 36), puis l’Enquête retournée", [
  P("9.1", "Lundi, Elias achète 2 cahiers et une colle. Mardi, il achète 1 cahier et un stylo. La colle coûte 3 €, le stylo 2 €, et les cahiers sont tous au même prix. En tout, il a dépensé 23 €.",
    "Combien coûte un cahier ?",
    "Monde 5, fiche 36 : des paquets à regrouper (3 taches en deux groupes, deux paquets de jetons)",
    "2 c + 3 + c + 2 = 23", "Un cahier coûte 6 €",
    dict(c=6), ["2*c+3+c+2==23"], "prix"),
  P("9.2", "Une frise de 86 cm est faite de 5 dessins, tous de la même largeur, et de deux étiquettes, collés sans espace : 3 dessins, une étiquette de 4 cm, 2 dessins, une étiquette de 2 cm.",
    "Quelle est la largeur d’un dessin ?",
    "Monde 5, fiche 36 : des paquets à regrouper (5 taches en deux groupes, deux paquets de jetons)",
    "3 d + 4 + 2 d + 2 = 86", "Un dessin mesure 16 cm de large",
    dict(d=16), ["3*d+4+2*d+2==86"], "longueur"),
  P("9.3", "Une séance d’entraînement dure 44 minutes : 3 exercices longs, tous de même durée, et 2 exercices courts, tous de même durée. Un exercice court dure 3 minutes de moins qu’un exercice long.",
    "Combien de temps dure un exercice court ? un exercice long ?",
    "Taches répétées, écart « de moins » (type 18, à retourner)",
    "TOTAL 44 · 3 taches A, 2 taches B · une B = une A − 3", "Long : 10 min · court : 7 min",
    dict(l=10, c=7), ["3*l+2*c==44", "c==l-3"], "durée"),
  P("9.4", "Rayan rapporte 3 petites bouteilles et 2 grandes bouteilles d’eau : 350 cL en tout. Une petite bouteille contient 2 fois moins qu’une grande.",
    "Combien contient une petite bouteille ? une grande ?",
    "Taches répétées, rapport « fois moins » (type 18, à retourner)",
    "TOTAL 350 · 3 taches A, 2 taches B · une A = une B ÷ 2", "Petite : 50 cL · grande : 100 cL",
    dict(p=50, g=100), ["3*p+2*g==350", "p*2==g"], "contenance"),
 ]),
 ("10", "Plusieurs situations à comparer", "Monde 4 · SPLAT! Système", [
  P("10.1", "Au snack de la plage, Sarah paie 24 € pour 2 menus et 2 glaces. Kenzo paie 27 € pour 2 menus et 3 glaces.",
    "Combien coûte une glace ? un menu ?",
    "Un article de plus (1b) : je retire, je partage",
    "Plateau 1 : 2 A + 2 B = 24 · plateau 2 : 2 A + 3 B = 27", "Glace : 3 € · menu : 9 €",
    dict(m=9, g=3), ["2*m+2*g==24", "2*m+3*g==27"], "prix"),
  P("10.2", "Trois bâtons mis bout à bout mesurent 54 cm. Le rouge et le bleu mesurent 33 cm bout à bout ; le bleu et le vert, 36 cm.",
    "Combien mesure chaque bâton ?",
    "Trois articles (1d) : je retire deux fois",
    "Plateaux : A + B + C = 54 · A + B = 33 · B + C = 36", "Rouge : 18 cm · bleu : 15 cm · vert : 21 cm",
    dict(r=18, b=15, v=21), ["r+b+v==54", "r+b==33", "b+v==36"], "longueur"),
  P("10.3", "Au bowling, Nour paie 25 € pour 2 parties, 1 location de chaussures et 2 boissons. Tom paie 17 € pour 2 parties et 1 location de chaussures. Lila paie 14 € pour 2 parties.",
    "Combien coûte une partie ? la location ? une boisson ?",
    "L’escalier (1e) : je retire, je retire, je partage",
    "Plateaux : 2 A = 14 · 2 A + B = 17 · 2 A + B + 2 C = 25", "Partie : 7 € · location : 3 € · boisson : 4 €",
    dict(p=7, l=3, b=4), ["2*p==14", "2*p+l==17", "2*p+l+2*b==25"], "prix"),
  P("10.4", "Lou pèse ses trois chats deux par deux. Mimi et Tigrou pèsent 9 kg ensemble ; Tigrou et Félix, 11 kg ; Mimi et Félix, 10 kg.",
    "Combien pèse chaque chat ?",
    "Trois paires (3b) : j’additionne tout, je partage, je retire",
    "Plateaux : A + B = 9 · B + C = 11 · A + C = 10 (le total des trois n’est pas donné)", "Mimi : 4 kg · Tigrou : 5 kg · Félix : 6 kg",
    dict(m=4, t=5, f=6), ["m+t==9", "t+f==11", "m+f==10"], "masse"),
 ]),
]

DEFI = [
  P("D3", "Lundi matin, la cuve d’eau de pluie contient 38 L. Dans la journée, Hugo en puise une partie pour arroser. Le soir, l’orage apporte 25 L. Mardi matin, la cuve contient 47 L.",
    "Combien de litres Hugo a-t-il puisés ?",
    "Avant / après : on cherche le changement (deux changements, un seul inconnu)",
    "Aucune carte SPLAT! · schéma en barres : 38 − ? + 25 = 47", "Hugo a puisé 16 L",
    dict(d=16), ["38-d+25==47"], "contenance"),
  P("D4", "Lina avait 36 €. Au marché, elle dépense une partie de cet argent. Puis sa grand-mère lui donne le double de ce qu’elle a dépensé. Maintenant, Lina a 45 €.",
    "Combien Lina a-t-elle dépensé ? Combien sa grand-mère lui a-t-elle donné ?",
    "Deux changements qui se suivent, liés : le second est le double du premier",
    "Aucune carte SPLAT! · schéma en barres : 36 − ? + 2 × ? = 45", "Dépensé : 9 € · reçu : 18 €",
    dict(d=9), ["36-d+2*d==45"], "prix"),
]

if __name__ == "__main__":
    import re, collections
    tous = [p for f in FICHES for p in f[3]] + DEFI
    print("fiches:", len(FICHES), "problèmes:", sum(len(f[3]) for f in FICHES), "+ défis", len(DEFI))
    # nombres à sous-entendu (liste de l'outil + 51 du livret 1), totaux différents dans une fiche
    nums = set(int(n) for p in tous for n in re.findall(r"\d+", p["texte"] + p["reponse"]))
    assert not nums & {69, 88, 420, 666, 1488, 51}, nums
    for f in FICHES:
        tot = [re.search(r"\d+", p["texte"]).group() for p in f[3]]
        assert len(set(tot)) == len(tot), (f[0], tot)
        g = set(p["grandeur"] for p in f[3]); assert len(g) >= 3, (f[0], g)
    c = collections.Counter(p["grandeur"] for p in tous)
    print("grandeurs :", dict(c), "· prix :", c["prix"], "/", len(tous))
    assert c["prix"] * 3 <= len(tous)
    for k in ("longueur", "masse", "durée", "contenance"): assert c[k] >= 1, k
    print("OK")
