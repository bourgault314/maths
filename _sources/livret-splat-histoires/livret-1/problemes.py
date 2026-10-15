# -*- coding: utf-8 -*-
"""SPLAT! « le monde réel » — livret 1 (panorama) : les problèmes et leur carte SPLAT! cachée.
Chaque problème : texte, question, type (classification SPLAT!), carte cachée, réponse, et un
contrôle (toutes les relations de l'énoncé recalculées)."""

def P(code, texte, question, typ, carte, reponse, vals, controles):
    for c in controles:
        assert eval(c, {}, vals), (code, c, vals)
    return dict(code=code, texte=texte, question=question, type=typ, carte=carte, reponse=reponse, vals=vals)

EXEMPLE = P("Ex",
  "Le club d’échecs du collège compte 26 élèves. Il y a 8 garçons de plus que de filles.",
  "Combien y a-t-il de filles ? de garçons ?",
  "Monde 3 · écart « de plus », deux quantités",
  "TOTAL 26 · la tache A cache 8 jetons de plus que la tache B",
  "9 filles et 17 garçons",
  dict(f=9, g=17), ["f+g==26", "g==f+8"])

FICHES = [
 ("1", "Le tout et ses parties", "Mondes 1 et 2 · Petit SPLAT! et SPLAT! Classique", [
  P("1.1", "Pour la sortie, le professeur doit réunir 57 autorisations signées. Il en a déjà 49.",
    "Combien d’autorisations manque-t-il ?",
    "Une partie cachée", "TOTAL 57 · 49 jetons visibles · 1 tache", "Il manque 8 autorisations",
    dict(a=8), ["49+a==57"]),
  P("1.2", "La classe veut réunir 150 € pour son voyage. La vente de gâteaux a rapporté 62 €, la tombola 45 €.",
    "Combien d’euros manque-t-il ?",
    "Des paquets de jetons, une partie cachée", "TOTAL 150 · paquets de 62 et de 45 · 1 tache", "Il manque 43 €",
    dict(m=43), ["62+45+m==150"]),
  P("1.3", "Pour l’anniversaire de Léna, sa mère a payé 31 € : deux pizzas au même prix et une bouteille de jus à 3 €.",
    "Combien coûte une pizza ?",
    "Deux taches qui cachent le même nombre", "TOTAL 31 · 3 jetons visibles · 2 taches noires", "Une pizza coûte 14 €",
    dict(p=14), ["2*p+3==31"]),
  P("1.4", "Le tournoi de ping-pong dure 77 minutes : 5 minutes d’échauffement, puis 6 matchs de la même durée.",
    "Combien de temps dure un match ?",
    "Plein de taches (la même, plusieurs fois)", "TOTAL 77 · 5 jetons visibles · 6 taches noires", "12 minutes par match",
    dict(b=12), ["6*b+5==77"]),
 ]),
 ("2", "De plus, de moins", "Monde 3 · SPLAT! Enquête, partie 1", [
  P("2.1", "Samedi, les deux équipes de handball du collège ont marqué 47 buts à elles deux. Les filles ont marqué 5 buts de plus que les garçons.",
    "Combien de buts pour chaque équipe ?",
    "Écart « de plus », deux quantités", "TOTAL 47 · A = B + 5", "Garçons : 21 buts · filles : 26 buts",
    dict(g=21, f=26), ["g+f==47", "f==g+5"]),
  P("2.2", "Léo fait ses devoirs pendant 44 minutes : des maths et du français. Le français lui prend 18 minutes de moins que les maths.",
    "Combien de temps passe-t-il sur chaque matière ?",
    "Écart « de moins » (à retourner)", "TOTAL 44 · A = B − 18", "Français : 13 min · maths : 31 min",
    dict(t=13, p=31), ["t+p==44", "t==p-18"]),
  P("2.3", "Le potager du collège a une aire de 120 m², en trois parcelles. La parcelle de tomates a 12 m² de plus que celle de salades, la parcelle de fraises 9 m² de plus que celle de salades.",
    "Quelle est l’aire de chaque parcelle ?",
    "Trois quantités, une référence, deux écarts", "TOTAL 120 · B = A + 12 · C = A + 9", "Salades : 33 m² · tomates : 45 m² · fraises : 42 m²",
    dict(a=33, b=45, c=42), ["a+b+c==120", "b==a+12", "c==a+9"]),
  P("2.4", "Une baguette de 80 cm est sciée en trois morceaux. Le 1er morceau mesure 7 cm de moins que le 2e. Le 3e mesure 6 cm de plus que le 2e.",
    "Combien mesure chaque morceau ?",
    "Trois quantités, la référence au milieu (« de moins » puis « de plus »)", "TOTAL 80 · A = B − 7 · C = B + 6", "1er : 20 cm · 2e : 27 cm · 3e : 33 cm",
    dict(a=20, b=27, c=33), ["a+b+c==80", "a==b-7", "c==b+6"]),
 ]),
 ("3", "Fois plus, fois moins", "Monde 3 · SPLAT! Enquête, partie 2", [
  P("3.1", "Un ruban de 48 cm est coupé en deux morceaux. Le grand morceau est 3 fois plus long que le petit.",
    "Combien mesure chaque morceau ?",
    "Rapport « fois plus », deux quantités", "TOTAL 48 · A = 3 × B", "Petit : 12 cm · grand : 36 cm",
    dict(bd=12, m=36), ["bd+m==48", "m==3*bd"]),
  P("3.2", "Pour aller au collège, Jade marche puis prend le bus. Son trajet dure 45 minutes en tout. La marche dure 4 fois moins longtemps que le bus.",
    "Combien de temps dure la marche ? le bus ?",
    "Rapport « fois moins » (à retourner)", "TOTAL 45 · A = B ÷ 4", "Marche : 9 min · bus : 36 min",
    dict(ma=9, bus=36), ["ma+bus==45", "ma*4==bus"]),
  P("3.3", "Noé remplit un pichet de 120 cL : du sirop, 2 fois plus de jus d’ananas que de sirop, et 3 fois plus de jus d’orange que de sirop.",
    "Quelle quantité de chaque boisson met-il ?",
    "Trois quantités, une référence, deux rapports", "TOTAL 120 · B = 2 × A · C = 3 × A", "Sirop : 20 cL · ananas : 40 cL · orange : 60 cL",
    dict(s=20, an=40, o=60), ["s+an+o==120", "an==2*s", "o==3*s"]),
  P("3.4", "Le club de judo a gagné 38 médailles : 2 fois plus de bronze que d’or, et 6 médailles d’argent de plus que d’or.",
    "Combien de médailles de chaque sorte ?",
    "Une référence, un rapport et un écart", "TOTAL 38 · B = 2 × A · C = A + 6", "Or : 8 · bronze : 16 · argent : 14",
    dict(o=8, b=16, a=14), ["o+b+a==38", "b==2*o", "a==o+6"]),
 ]),
 ("4", "Plusieurs fois la même chose, puis sans le total", "Monde 3 · SPLAT! Enquête, partie 3", [
  P("4.1", "Au cinéma, la famille Técher paie 46 € pour 2 places adultes et 3 places enfants. Une place adulte coûte 3 € de plus qu’une place enfant.",
    "Quel est le prix d’une place enfant ? d’une place adulte ?",
    "Taches répétées, « de plus »", "TOTAL 46 · 2 taches A, 3 taches B · une A = une B + 3", "Enfant : 8 € · adulte : 11 €",
    dict(e=8, a=11), ["2*a+3*e==46", "a==e+3"]),
  P("4.2", "Dans le coffre, il y a 2 grands sacs de riz et 3 petits. Ils pèsent 35 kg en tout. Un grand sac pèse 2 fois plus qu’un petit.",
    "Combien pèse un petit sac ? un grand sac ?",
    "Taches répétées, « fois plus »", "TOTAL 35 · 2 taches A, 3 taches B · une A = 2 × une B", "Petit sac : 5 kg · grand sac : 10 kg",
    dict(p=5, g=10), ["2*g+3*p==35", "g==2*p"]),
  P("4.3", "Le père de Yanis a 3 fois l’âge de Yanis. Il a aussi 26 ans de plus que lui.",
    "Quel âge a Yanis ? Quel âge a son père ?",
    "Sans total : un rapport et un écart", "PAS DE TOTAL · A = 3 × B · A = B + 26", "Yanis : 13 ans · son père : 39 ans",
    dict(y=13, p=39), ["p==3*y", "p==y+26"]),
  P("4.4", "Un chiot pèse 4 fois moins que sa mère. Il pèse aussi 15 kg de moins qu’elle.",
    "Combien pèse le chiot ? Combien pèse sa mère ?",
    "Sans total, à retourner (« fois moins », « de moins »)", "PAS DE TOTAL · A = B ÷ 4 · A = B − 15", "Chiot : 5 kg · mère : 20 kg",
    dict(c=5, m=20), ["c*4==m", "c==m-15"]),
 ]),
 ("5", "Deux achats à comparer", "Monde 4 · SPLAT! Système", [
  P("5.1", "À la fête foraine, 3 tours de manège coûtent 12 €. 3 tours de manège et 2 barbes à papa coûtent 18 €.",
    "Combien coûte un tour de manège ? une barbe à papa ?",
    "Je retire · une partie connue (1a)", "Plateau 1 : 3 A = 12 · plateau 2 : 3 A + 2 B = 18", "Tour de manège : 4 € · barbe à papa : 3 €",
    dict(t=4, b=3), ["3*t==12", "3*t+2*b==18"]),
  P("5.2", "À la buvette du stade, Karim paie 17 € pour 2 sandwichs et 3 jus. Élodie paie 11 € pour 2 sandwichs et 1 jus.",
    "Combien coûte un jus ? un sandwich ?",
    "Je retire, je partage (1c)", "Plateau 1 : 2 A + 3 B = 17 · plateau 2 : 2 A + 1 B = 11", "Jus : 3 € · sandwich : 4 €",
    dict(s=4, j=3), ["2*s+3*j==17", "2*s+j==11"]),
  P("5.3", "À la papeterie, 1 stylo et 1 cahier coûtent 8 €. 2 stylos et 3 cahiers coûtent 21 €.",
    "Combien coûte un cahier ? un stylo ?",
    "Je double (2a)", "Plateau 1 : A + B = 8 · plateau 2 : 2 A + 3 B = 21", "Cahier : 5 € · stylo : 3 €",
    dict(s=3, c=5), ["s+c==8", "2*s+3*c==21"]),
  P("5.4", "À la piscine, 2 adultes et 3 enfants paient 34 €. 3 adultes et 2 enfants paient 36 €.",
    "Quel est le prix d’une entrée enfant ? d’une entrée adulte ?",
    "J’additionne · en miroir (3a)", "Plateau 1 : 2 A + 3 B = 34 · plateau 2 : 3 A + 2 B = 36", "Enfant : 6 € · adulte : 8 €",
    dict(a=8, e=6), ["2*a+3*e==34", "3*a+2*e==36"]),
 ]),
]

DEFI = [
  P("D1", "Ce matin, Inès avait de l’argent dans son porte-monnaie. À midi, elle a acheté un sandwich à 4 €. Le soir, sa tante lui a donné 10 €. Maintenant, elle a 21 €.",
    "Combien d’euros Inès avait-elle ce matin ?",
    "Avant / après : on cherche le début (absent de SPLAT!)", "Aucune carte SPLAT! · schéma en barres : ? − 4 + 10 = 21", "Inès avait 15 €",
    dict(d=15), ["d-4+10==21"]),
  P("D2", "Nina et Paul ont 50 billes à eux deux. Nina donne 8 billes à Paul : maintenant, ils en ont autant l’un que l’autre.",
    "Combien de billes chacun avait-il avant ?",
    "Avant / après + de plus que (le don qui égalise)", "TOTAL 50 · après le don : deux parts égales · avant : A = B + 16", "Nina : 33 billes · Paul : 17 billes",
    dict(n=33, p=17), ["n+p==50", "n-8==p+8"]),
]

if __name__ == "__main__":
    tot = sum(len(f[3]) for f in FICHES)
    print("fiches:", len(FICHES), "problèmes:", tot, "+ exemple + défi", len(DEFI))
    # aucune réponse ni donnée « à sous-entendu », pas deux fois le même total dans une fiche
    import re
    for f in FICHES:
        nums = [re.findall(r"\d+", p["texte"]) for p in f[3]]
        print(f[0], [p["reponse"] for p in f[3]])
    allnums = set(int(n) for f in FICHES for p in f[3] for n in re.findall(r"\d+", p["texte"] + p["reponse"]))
    allnums |= set(int(n) for p in DEFI + [EXEMPLE] for n in re.findall(r"\d+", p["texte"] + p["reponse"]))
    assert 69 not in allnums and 666 not in allnums and 51 not in allnums, allnums
    print(sorted(allnums))
