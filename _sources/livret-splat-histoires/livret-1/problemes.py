# -*- coding: utf-8 -*-
"""SPLAT! « le monde réel » — livret 1 (panorama) : les problèmes et leur carte SPLAT! cachée.
Chaque problème : texte, question, type (classification SPLAT!), carte cachée, réponse, et un
contrôle (toutes les relations de l'énoncé recalculées)."""

def P(code, texte, question, typ, carte, reponse, vals, controles, grandeur):
    for c in controles:
        assert eval(c, {}, vals), (code, c, vals)
    return dict(code=code, texte=texte, question=question, type=typ, carte=carte, reponse=reponse, vals=vals, grandeur=grandeur)

EXEMPLE = P("Ex",
  "Le club d’échecs du collège compte 26 élèves. Il y a 8 garçons de plus que de filles.",
  "Combien y a-t-il de filles ? de garçons ?",
  "Monde 3 · écart « de plus », deux quantités",
  "TOTAL 26 · la tache A cache 8 jetons de plus que la tache B",
  "9 filles et 17 garçons",
  dict(f=9, g=17), ["f+g==26", "g==f+8"], "nombre")

FICHES = [
 ("1", "Le tout et ses parties", "Mondes 1 et 2 · Petit SPLAT! et SPLAT! Classique", [
  P("1.1", "Pour la sortie, le professeur doit réunir 57 autorisations signées. Il en a déjà 49.",
    "Combien d’autorisations manque-t-il ?",
    "Une partie cachée", "TOTAL 57 · 49 jetons visibles · 1 tache", "Il manque 8 autorisations",
    dict(a=8), ["49+a==57"], "nombre"),
  P("1.2", "La classe veut réunir 150 € pour son voyage. La vente de gâteaux a rapporté 62 €, la tombola 45 €.",
    "Combien d’euros manque-t-il ?",
    "Des paquets de jetons, une partie cachée", "TOTAL 150 · paquets de 62 et de 45 · 1 tache", "Il manque 43 €",
    dict(m=43), ["62+45+m==150"], "prix"),
  P("1.3", "Pour l’anniversaire de Léna, sa mère a payé 31 € : deux pizzas au même prix et une bouteille de jus à 3 €.",
    "Combien coûte une pizza ?",
    "Deux taches qui cachent le même nombre", "TOTAL 31 · 3 jetons visibles · 2 taches noires", "Une pizza coûte 14 €",
    dict(p=14), ["2*p+3==31"], "prix"),
  # (21/10/2026, lot B) futsal plutôt que ping-pong : un match de ping-pong ne se joue pas au temps
  P("1.4", "Le tournoi de futsal dure 77 minutes : 5 minutes d’échauffement, puis 6 matchs de la même durée.",
    "Combien de temps dure un match ?",
    "Plein de taches (la même, plusieurs fois)", "TOTAL 77 · 5 jetons visibles · 6 taches noires", "12 minutes par match",
    dict(b=12), ["6*b+5==77"], "durée"),
 ]),
 ("2", "De plus, de moins", "Monde 3 · SPLAT! Enquête, partie 1", [
  P("2.1", "Samedi, les deux équipes de handball du collège ont marqué 47 buts à elles deux. Les filles ont marqué 5 buts de plus que les garçons.",
    "Combien de buts pour chaque équipe ?",
    "Écart « de plus », deux quantités", "TOTAL 47 · A = B + 5", "Garçons : 21 buts · filles : 26 buts",
    dict(g=21, f=26), ["g+f==47", "f==g+5"], "nombre"),
  P("2.2", "Léo fait ses devoirs pendant 44 minutes : des maths et du français. Le français lui prend 18 minutes de moins que les maths.",
    "Combien de temps passe-t-il sur chaque matière ?",
    "Écart « de moins » (à retourner)", "TOTAL 44 · A = B − 18", "Français : 13 min · maths : 31 min",
    dict(t=13, p=31), ["t+p==44", "t==p-18"], "durée"),
  P("2.3", "Le potager du collège a une aire de 120 m², en trois parcelles. La parcelle de tomates a 12 m² de plus que celle de salades, la parcelle de fraises 9 m² de plus que celle de salades.",
    "Quelle est l’aire de chaque parcelle ?",
    "Trois quantités, une référence, deux écarts", "TOTAL 120 · B = A + 12 · C = A + 9", "Salades : 33 m² · tomates : 45 m² · fraises : 42 m²",
    dict(a=33, b=45, c=42), ["a+b+c==120", "b==a+12", "c==a+9"], "aire"),
  P("2.4", "Une baguette de bois de 80 cm est sciée en trois morceaux. Le 1er morceau mesure 7 cm de moins que le 2e. Le 3e mesure 6 cm de plus que le 2e.",
    "Combien mesure chaque morceau ?",
    "Trois quantités, la référence au milieu (« de moins » puis « de plus »)", "TOTAL 80 · A = B − 7 · C = B + 6", "1er : 20 cm · 2e : 27 cm · 3e : 33 cm",
    dict(a=20, b=27, c=33), ["a+b+c==80", "a==b-7", "c==b+6"], "longueur"),
 ]),
 ("3", "Fois plus, fois moins", "Monde 3 · SPLAT! Enquête, partie 2", [
  P("3.1", "Un ruban de 48 cm est coupé en deux morceaux. Le grand morceau est 3 fois plus long que le petit.",
    "Combien mesure chaque morceau ?",
    "Rapport « fois plus », deux quantités", "TOTAL 48 · A = 3 × B", "Petit : 12 cm · grand : 36 cm",
    dict(bd=12, m=36), ["bd+m==48", "m==3*bd"], "longueur"),
  P("3.2", "Pour aller au collège, Jade marche puis prend le bus. Son trajet dure 45 minutes en tout. La marche dure 4 fois moins longtemps que le bus.",
    "Combien de temps dure la marche ? le bus ?",
    "Rapport « fois moins » (à retourner)", "TOTAL 45 · A = B ÷ 4", "Marche : 9 min · bus : 36 min",
    dict(ma=9, bus=36), ["ma+bus==45", "ma*4==bus"], "durée"),
  P("3.3", "Noé remplit un pichet de 120 cL : du sirop, 2 fois plus de jus d’ananas que de sirop, et 3 fois plus de jus d’orange que de sirop.",
    "Quelle quantité de chaque boisson met-il ?",
    "Trois quantités, une référence, deux rapports", "TOTAL 120 · B = 2 × A · C = 3 × A", "Sirop : 20 cL · ananas : 40 cL · orange : 60 cL",
    dict(s=20, an=40, o=60), ["s+an+o==120", "an==2*s", "o==3*s"], "contenance"),
  P("3.4", "Le club de judo a gagné 38 médailles : 2 fois plus de bronze que d’or, et 6 médailles d’argent de plus que d’or.",
    "Combien de médailles de chaque sorte ?",
    "Une référence, un rapport et un écart", "TOTAL 38 · B = 2 × A · C = A + 6", "Or : 8 · bronze : 16 · argent : 14",
    dict(o=8, b=16, a=14), ["o+b+a==38", "b==2*o", "a==o+6"], "nombre"),
 ]),
 ("4", "Plusieurs fois la même chose, puis sans le total", "Monde 3 · SPLAT! Enquête, partie 3", [
  P("4.1", "Au cinéma, la famille Técher paie 46 € pour 2 places adultes et 3 places enfants. Une place adulte coûte 3 € de plus qu’une place enfant.",
    "Quel est le prix d’une place enfant ? d’une place adulte ?",
    "Taches répétées, « de plus »", "TOTAL 46 · 2 taches A, 3 taches B · une A = une B + 3", "Enfant : 8 € · adulte : 11 €",
    dict(e=8, a=11), ["2*a+3*e==46", "a==e+3"], "prix"),
  # (17/10/2026, choix de Gwenaël après l'audit) « on cherche le tout » : le total est l'inconnue, les
  # parties sont données par un nombre et un indice ; pas de carte SPLAT! (le total y est toujours donné)
  P("4.2", "Dans le coffre, il y a 2 grands sacs de riz et 3 petits. Un petit sac pèse 5 kg. Un grand sac pèse 2 fois plus qu’un petit.",
    "Combien pèsent tous les sacs ensemble ?",
    "On cherche le tout : des quantités répétées, « fois plus »", "Aucune carte SPLAT! · on cherche le total : 2 grands + 3 petits, un grand = 2 × un petit", "Les sacs pèsent 35 kg en tout",
    dict(p=5, g=10, t=35), ["p==5", "g==2*p", "t==2*g+3*p"], "masse"),
  P("4.3", "Le père de Yanis a 3 fois l’âge de Yanis. Il a aussi 26 ans de plus que lui.",
    "Quel âge a Yanis ? Quel âge a son père ?",
    "Sans total : un rapport et un écart", "PAS DE TOTAL · A = 3 × B · A = B + 26", "Yanis : 13 ans · son père : 39 ans",
    dict(y=13, p=39), ["p==3*y", "p==y+26"], "âge"),
  P("4.4", "Un chiot pèse 4 fois moins que sa mère. Il pèse aussi 15 kg de moins qu’elle.",
    "Combien pèse le chiot ? Combien pèse sa mère ?",
    "Sans total, à retourner (« fois moins », « de moins »)", "PAS DE TOTAL · A = B ÷ 4 · A = B − 15", "Chiot : 5 kg · mère : 20 kg",
    dict(c=5, m=20), ["c*4==m", "c==m-15"], "masse"),
 ]),
 ("5", "Deux situations à comparer", "Monde 4 · SPLAT! Système", [
  P("5.1", "À la fête foraine, 3 tours de manège coûtent 12 €. 3 tours de manège et 2 barbes à papa coûtent 18 €.",
    "Combien coûte un tour de manège ? une barbe à papa ?",
    "Je retire · une partie connue (1a)", "Plateau 1 : 3 A = 12 · plateau 2 : 3 A + 2 B = 18", "Tour de manège : 4 € · barbe à papa : 3 €",
    dict(t=4, b=3), ["3*t==12", "3*t+2*b==18"], "prix"),
  # 5.2 en masses, 5.3 en longueurs (17/10/2026, choix de Gwenaël : H5 n'avait que des prix) — mêmes nombres, mêmes cartes
  # (21/10/2026, lot B) les sacs d’une même sorte ont la même masse : dit dans l’énoncé
  P("5.2", "2 sacs de croquettes et 3 sacs de graines pèsent 17 kg ; 2 sacs de croquettes et 1 sac de graines, 11 kg. Tous les sacs d’une même sorte ont la même masse.",
    "Combien pèse un sac de graines ? un sac de croquettes ?",
    "Je retire, je partage (1c)", "Plateau 1 : 2 A + 3 B = 17 · plateau 2 : 2 A + 1 B = 11", "Graines : 3 kg · croquettes : 4 kg",
    dict(c=4, g=3), ["2*c+3*g==17", "2*c+g==11"], "masse"),
  P("5.3", "Zoé fait une frise avec des bandes de papier collées bout à bout. 1 bande rouge et 1 bande bleue font 8 cm. 2 rouges et 3 bleues font 21 cm. Toutes les bandes d’une couleur ont la même longueur.",
    "Combien mesure une bande bleue ? une bande rouge ?",
    "Je double (2a)", "Plateau 1 : A + B = 8 · plateau 2 : 2 A + 3 B = 21", "Bleue : 5 cm · rouge : 3 cm",
    dict(r=3, b=5), ["r+b==8", "2*r+3*b==21"], "longueur"),
  P("5.4", "À la piscine, 2 adultes et 3 enfants paient 34 €. 3 adultes et 2 enfants paient 36 €.",
    "Quel est le prix d’une entrée enfant ? d’une entrée adulte ?",
    "J’additionne · en miroir (3a)", "Plateau 1 : 2 A + 3 B = 34 · plateau 2 : 3 A + 2 B = 36", "Enfant : 6 € · adulte : 8 €",
    dict(a=8, e=6), ["2*a+3*e==34", "3*a+2*e==36"], "prix"),
 ]),
]

DEFI = [
  P("D1", "Ce matin, Inès avait de l’argent dans son porte-monnaie. À midi, elle a acheté un sandwich à 4 €. Le soir, sa tante lui a donné 10 €. Maintenant, elle a 21 €.",
    "Combien d’euros Inès avait-elle ce matin ?",
    "Avant / après : on cherche le début (absent de SPLAT!)", "Aucune carte SPLAT! · schéma en barres : ? − 4 + 10 = 21", "Inès avait 15 €",
    dict(d=15), ["d-4+10==21"], "prix"),
  P("D2", "Nina et Paul ont 50 billes à eux deux. Nina donne 8 billes à Paul : maintenant, ils en ont autant l’un que l’autre.",
    "Combien de billes chacun avait-il avant ?",
    "Avant / après + de plus que (le don qui égalise)", "TOTAL 50 · après le don : deux parts égales · avant : A = B + 16", "Nina : 33 billes · Paul : 17 billes",
    dict(n=33, p=17), ["n+p==50", "n-8==p+8"], "nombre"),
]

TOUS = [p for f in FICHES for p in f[3]] + DEFI

if __name__ == "__main__":
    import re, collections
    print("fiches:", len(FICHES), "problèmes:", sum(len(f[3]) for f in FICHES), "+ exemple + défis", len(DEFI))
    for f in FICHES:
        print(f[0], [p["reponse"] for p in f[3]])
    # nombres à sous-entendu (liste de l'outil, en sous-chaîne comme lui, + 51)
    nums = set(int(n) for p in TOUS + [EXEMPLE] for n in re.findall(r"\d+", p["texte"] + p["reponse"]))
    assert not [n for n in nums if any(s in str(n) for s in ("69", "88", "420", "666", "1488")) or n == 51], nums
    # (17/10/2026) les mêmes contrôles que les livrets 2 et 3
    for f in FICHES:
        tot = [t for p in f[3] for t in re.findall(r"(?:TOTAL |= )(\d+)(?= ·|$| \()", p["carte"])]
        assert len(set(tot)) == len(tot), (f[0], tot)
        g = set(p["grandeur"] for p in f[3]); assert len(g) >= 3, (f[0], g)
    c = collections.Counter(p["grandeur"] for p in TOUS)
    print("grandeurs :", dict(c), "· prix :", c["prix"], "/", len(TOUS))
    assert c["prix"] * 3 <= len(TOUS)
    for k in ("longueur", "masse", "durée", "contenance"): assert c[k] >= 1, k
    print("OK")
