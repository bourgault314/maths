#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère les livrets « Petit SPLAT! » (8 pages) à partir du site lui-même.

    python3 render.py                 (les trois livrets, et leurs trois livrets de correction)
    python3 render.py avance          (un seul, et sa correction)
    python3 render.py --qr expert     (en refabriquant d'abord ses QR codes)
    python3 render.py --correction    (seulement les livrets corrigés)
    python3 render.py --eleve         (seulement les livrets de l'élève)

Produit, à la racine du dépôt :
    outils/livret_petit_splat.pdf             8 pages A4, ordre de lecture   (Monde 1, jusqu'à 20)
    outils/livret_petit_splat_a_plier.pdf     4 pages A3 paysage, imposées
    outils/livret_petit_splat_avance.pdf      idem, niveau Avancé (21 à 50)
    outils/livret_petit_splat_avance_a_plier.pdf
    outils/livret_petit_splat_expert.pdf      idem, niveau Expert (51 à 100)
    outils/livret_petit_splat_expert_a_plier.pdf
et, pour chacun, son livret corrigé (lot K1, 20/09/2026 ; « pour tous » depuis le 23/09/2026) :
    outils/livret_petit_splat_correction.pdf            8 pages A4, ordre de lecture
    outils/livret_petit_splat_correction_a_plier.pdf    4 pages A3 paysage, imposées
    (idem …_avance_correction… et …_expert_correction…)

Les 6 fiches ne sont PAS redessinées ici : elles sont rendues par l'outil du site
(outils/splat_tache_barre.html, mode support=print) avec des graines fixes. Le QR
code est injecté dans le bandeau de consigne juste avant l'impression ; les logos de
l'outil sont retirés et le numéro de page est posé au même moment (lot 3 de la relecture du
monde 1, 26/09/2026 — voir JS_SANS_LOGO et JS_NUMERO). Couverture
et dos sont les deux HTML de ce dossier ; pour les niveaux Avancé et Expert, leurs
textes variables et l'exemple de couverture sont injectés au rendu (voir NIVEAUX).

LIVRET DE CORRECTION (lot K1, 20/09/2026) — le même livret, mêmes 8 pages, même
pliage, mêmes cartes : l'outil est appelé avec correction=1&rv=0 (il rend l'énoncé
PUIS sa correction), on remet sur la page de correction le cadre de consigne de
l'énoncé (les cartes tombent exactement à la même place que sur la fiche de l'élève),
on retire l'énoncé, et la boîte du QR dit « Je rejoue ces cartes en ligne ». La
couverture reçoit un bandeau rouge sombre « Correction » et « Livret corrigé » à la place
de Prénom / Classe ; le dos ne change pas. Le corrigé peut être donné aux élèves (Claire,
23/09/2026, comme les livrets de l'Enquête) : il ne dit « professeur » nulle part.

CHOIX DES GRAINES (17/09/2026) — ne pas en changer sans refaire le tri.
Les graines de Monde 1 sont celles de la progression de Claire. Celles des niveaux
Avancé et Expert ont été retenues automatiquement parmi des dizaines de milliers de
tirages, en gardant seulement les fiches qui respectent TOUTES ces règles :
  · aucune carte sous le plancher du niveau (21 pour Avancé, 51 pour Expert) —
    chaque livret ouvre une tranche neuve, on ne refait jamais le niveau d'en dessous ;
  · sur une carte « dessine », entre 1 et 15 jetons à dessiner (jamais 0, jamais 20) ;
  · au plus 2 cartes sans aucun jeton visible ;
  · pas deux cartes identiques (même total, mêmes visibles, même nombre de taches) ;
  · au plus une carte où chaque tache ne cache qu'un seul jeton ;
  · sur les fiches 5 et 6, au moins 4 tailles de groupes différentes (de 2 à 6 taches).

Dépendances : playwright (chromium), pikepdf, qrcode[pil]. qpdf si disponible.
"""
import asyncio, http.server, socketserver, threading, functools, os, sys, json
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent                      # racine du dépôt
BASE_WEB = "/_sources/livret-petit-splat"
PORT = 8123
SITE = "https://mathsgo.re"

# Fiches 4 et 5 (plusieurs taches) : l'option « Espace sous le schéma » de l'outil (espace=1).
# Relecture du monde 1, lot 4 (26/09/2026). Ses mots : « surtout pas imposer l'accolade…
# j'ai juste besoin d'un peu d'espace en dessous ». Une bande vide de 7,5 mm sous chaque
# schéma, pour écrire un calcul intermédiaire ; le dessin est refait par la table de dessin
# de l'outil sur toute la largeur de la case, taches et jetons à leur taille imprimée. Les
# cartes (les nombres) restent celles des graines : le tirage ne change pas. Même option sur
# le livret corrigé : les cartes restent à la même place que sur la fiche de l'élève.

# Les 6 étapes du monde 1, telles que définies dans outils/splat_univers.html (MONDES[0]).
# splats / exercise ne changent jamais d'un niveau à l'autre : c'est la MÊME progression,
# seule la cible (et donc la graine) change.
FICHES = [
    dict(n=1, t="Complète le schéma",  splats="1",   ex="find_hidden"),
    dict(n=2, t="Dessine les jetons",  splats="1",   ex="construct"),
    dict(n=3, t="Mélange !",           splats="1",   ex="mix"),
    dict(n=4, t="Deux taches",         splats="2",   ex="find_hidden", espace=True),
    dict(n=5, t="Plein de taches !",   splats="mix", ex="find_hidden", espace=True),
    dict(n=6, t="Dessine en expert",   splats="mix", ex="construct"),
]

# LIVRETS « JE FAIS LE SCHÉMA EN BARRES » (26/09/2026, idée de Gwenaël, décisions par
# questions à choix). Trois livrets de plus pour le monde 1 (jusqu'à 20, 50 et 100 jetons), de
# nouvelles séries où l'élève fait lui-même le schéma en barres, puis écrit « ? = … » :
# « Schéma à tracer » (diagram=draw) et la bande sous le schéma (espace=1) sur les 6 fiches,
# toutes « complète le schéma » (une carte « dessine les jetons » n'aurait plus rien à montrer
# sans son schéma). 9 cartes par fiche (grid=3x3), le dessin RESSERRÉ : toute la place gagnée
# va à la zone vide où l'élève fait son schéma (presque deux fois la hauteur des 12 cartes) ;
# un schéma imprimé (exemple, schéma donné, corrigé) garde sa taille habituelle. Choix de
# Gwenaël sur planches, 26/09/2026 (8 cartes : trop larges ; 12 : trop peu de place).
# Sous chaque carte à faire, « ? = …… » est imprimé (reponse=1).
# L'ordre (« contraste tôt ») : une tache ; deux taches, dont 3 cartes sur 9 SANS jetons posés
# (n × ? = total à côté de a + n × ? = total, sur la même page : « quand rien n'est dessiné,
# c'est qu'il n'y en a pas ») ; de 2 à 4 taches, 3 sans jetons ; puis trois fiches de mélange
# avec 2 cartes sur 9 sans jetons, la première de 2 à 4 taches (splats=mix4), les deux
# dernières de 2 à 6. Aucune phrase en plus dans les consignes : la règle du livret est écrite
# une fois, sur la couverture (COUV_DESSIN).
# 26/09/2026 au soir (Gwenaël : 4 sur 9, « c'est un petit peu trop ») : 3 cartes sur 9 sans jetons
# aux fiches 2 et 3 — à la fiche 2, l'exemple et un des deux schémas donnés en font partie —, et de
# nouvelles graines pour ces deux fiches, dans les 3 niveaux (mêmes règles de tri).
# Fiches 1 et 2 : un guidage qui s'efface (idée de Gwenaël) — la 1re carte est un EXEMPLE
# résolu (exemple=1 : schéma avec « ? » dans les cases et « ? = 7 »), les 2 suivantes ont leur
# schéma DONNÉ, l'élève trouve seulement « ? = … » (donne=2), puis 6 cartes à faire en entier.
# À la fiche 2, l'exemple est une carte SANS jeton posé (la nouveauté), et des deux schémas
# donnés, l'un a des jetons, l'autre pas (graines choisies pour cela).
# parcours : chaque fiche valide l'étoile de l'étape du monde 1 qui lui ressemble le plus.
_F = dict(ex="find_hidden", espace=True, dessin=True, grid="3x3")
FICHES_DESSIN = [
    dict(n=1, t="Une tache",         splats="1",    **_F, guide=True, parcours="m1e1"),
    dict(n=2, t="Deux taches",       splats="2",    **_F, sansjetons=3, guide=True, parcours="m1e4"),
    dict(n=3, t="De 2 à 4 taches",   splats="mix4", **_F, sansjetons=3, parcours="m1e5"),
    dict(n=4, t="Mélange !",         splats="mix4", **_F, sansjetons=2, parcours="m1e5"),
    dict(n=5, t="Encore du mélange", splats="mix",  **_F, sansjetons=2, parcours="m1e5"),
    dict(n=6, t="Le grand mélange",  splats="mix",  **_F, sansjetons=2, parcours="m1e5"),
]

# La couverture : « Comment ça marche ? » montre ce que l'élève fait sous chaque carte (idée de
# Gwenaël, 26/09/2026). « Je fais le schéma en barres » et pas « je dessine » : dans les autres
# livrets, l'élève dessinait des JETONS (fiches « Dessine les jetons »).
REGLE_DESSIN = ("✏️ Tu n'as <b>aucun jeton à dessiner</b>. Quand aucun jeton n'est posé autour "
                "des taches, ils sont tous cachés dessous.")
COUV_DESSIN = dict(
    intro="Sous chaque carte, <b>fais le schéma en barres</b>, puis écris ta réponse&nbsp;: <b>?&nbsp;=&nbsp;…</b>",
    titres=["Avec des jetons posés", "Sans jeton posé"],
    regle=REGLE_DESSIN)

def fiches_de(niv):
    return niv.get("fiches", FICHES)

def reglages(f):
    """Les réglages de la fiche qui changent les cartes ou leur dessin, communs à la fiche
    imprimée et à son QR (sauf diagram=draw, qui ne concerne que le papier)."""
    return ((f"&grid={f['grid']}" if f.get("grid") else "")
            + ("&espace=1" if f.get("espace") else "")
            + (f"&jetons={f['jetons']}" if f.get("jetons") else "")
            + (f"&sansjetons={f['sansjetons']}" if f.get("sansjetons") else ""))

def niveau_url(target, splats, exercise="mix"):
    return f"{SITE}/splat/petit/?support=eleve&problem=classic&target={target}&splats={splats}&exercise={exercise}"

NIVEAUX = {
    # --------------------------------------------------------------- Monde 1
    "normal": dict(
        target=20,
        sortie="livret_petit_splat",
        qr="qr",
        graines={1:"441132", 2:"929356", 3:"302672", 4:"514457", 5:"727304", 6:"514457"},
        sur=None, accroche=None, exemple=None,      # couverture d'origine, on n'y touche pas
        dos=[("Facile", "Une seule tache, comme les fiches 1 à 3.",   niveau_url(20, "1"),   "niveau-facile.png"),
             ("Normal", "De 2 à 6 taches, comme les fiches 4 à 6.",   niveau_url(20, "mix"), "niveau-normal.png"),
             ("Avancé", "De 2 à 6 taches, jusqu'à 50 jetons.",        niveau_url(50, "mix"), "niveau-avance.png"),
             ("Expert", "De 2 à 6 taches, jusqu'à 100 jetons&nbsp;!", niveau_url(100,"mix"), "niveau-expert.png")],
    ),
    # --------------------------------------------------------------- 21 à 50
    "avance": dict(
        target=50,
        sortie="livret_petit_splat_avance",
        qr="qr/avance",
        graines={1:"510115", 2:"715819", 3:"716087", 4:"109324", 5:"868655", 6:"849499"},
        sur="Mon livret · Monde 1 · Avancé",
        accroche="Le tout, les parties…<br>et jusqu'à 50 jetons&nbsp;!",
        # lot K1-bis (20/09/2026) : 40 = 20 + 2 x 10 — on compte les jetons cachés
        # (10 par tache au lieu de 15), et c'est le plus gros total possible dans la
        # tranche en gardant les jetons cachés séparés.
        exemple=dict(splats="2", vis=(20, 20), hp=(10, 10), total=40),
        dos=[("Une tache",        "Une seule tache, jusqu'à 50 jetons — comme les fiches 1 à 3.", niveau_url(50, "1"),   "niveau-1.png"),
             ("Plein de taches",  "De 2 à 6 taches, jusqu'à 50 jetons — comme les fiches 4 à 6.", niveau_url(50, "mix"), "niveau-2.png"),
             ("Expert · 1 tache", "Une seule tache, jusqu'à 100 jetons.",                         niveau_url(100,"1"),   "niveau-3.png"),
             ("Expert · 2 à 6 taches", "De 2 à 6 taches, jusqu'à 100 jetons&nbsp;!",                   niveau_url(100,"mix"), "niveau-4.png")],
    ),
    # -------------------------------------------------------------- 51 à 100
    "expert": dict(
        target=100,
        sortie="livret_petit_splat_expert",
        qr="qr/expert",
        graines={1:"892863", 2:"662792", 3:"520986", 4:"948274", 5:"830408", 6:"354581"},
        sur="Mon livret · Monde 1 · Expert",
        accroche="Le tout, les parties…<br>et jusqu'à 100 jetons&nbsp;!",
        # lot K1-bis (20/09/2026) : 60 = 20 + 4 x 10 — on compte les jetons cachés (10 par
        # tache au lieu de 34). Il faut 4 taches pour rester au-dessus de 51 avec 10 cachés :
        # les cases du schéma tombent alors à 48 px et la mini-tache (36 px avec sa marge)
        # n'a plus de place à gauche du nombre — voir la règle des 4 cases dans JS_COUV.
        exemple=dict(splats="4", vis=(20, 20), hp=(10, 10), total=60),
        dos=[("Une tache",         "Une seule tache, jusqu'à 100 jetons — comme les fiches 1 à 3.", niveau_url(100,"1"),   "niveau-1.png"),
             ("Plein de taches",   "De 2 à 6 taches, jusqu'à 100 jetons — comme les fiches 4 à 6.", niveau_url(100,"mix"), "niveau-2.png"),
             ("Réviser · 1 tache", "Une seule tache, jusqu'à 50 jetons.",                           niveau_url(50, "1"),   "niveau-3.png"),
             ("Réviser · 2 à 6 taches", "De 2 à 6 taches, jusqu'à 50 jetons.",                           niveau_url(50, "mix"), "niveau-4.png")],
    ),
}

# Les trois livrets « je dessine le schéma » : mêmes niveaux, mêmes dos (les QR « Encore des
# cartes » et « La suite du voyage » ne changent pas), nouvelles séries. Les graines ont été
# choisies le 26/09/2026 parmi des milliers de tirages (voir CHOIX DES GRAINES plus haut),
# avec, en plus : la fiche 1 a des jetons posés sur les 9 cartes (sa 1re, l'exemple : au moins
# 2 posés et 3 cachés) ; les fiches 2 et 3 ont exactement 3 cartes sans jetons (à la fiche 2 :
# l'exemple en est une, et des deux schémas donnés, l'un a des jetons, l'autre pas ; les 3
# cartes guidées cachent au moins 2 jetons par tache), les fiches 4 à 6 exactement 2 ; les
# fiches 3 et 4 ont des
# cartes à 2, 3 et 4 taches ; les fiches 5 et 6 au moins 4 nombres de taches différents ;
# aucun 69 (total, jetons posés ou cachés) ; plancher 4 pour le livret de base.
_DESSIN = dict(fiches=FICHES_DESSIN)
NIVEAUX["dessin"] = dict(NIVEAUX["normal"], **_DESSIN,
    sortie="livret_petit_splat_dessin", qr="qr/dessin",
    graines={1:"21310007", 2:"22310199", 3:"23310011", 4:"24310055", 5:"25310063", 6:"26310088"},
    sur="Mon livret · Monde 1<br>Je fais le schéma en barres",
    dessin=dict(COUV_DESSIN, profils=[dict(splats="1", vis=[9, 12], hp=[6, 9], tot=[15, 20]), dict(splats="3", vis=0, hp=[5, 5], tot=[15, 15])]),
    dos=[("Facile", "Une seule tache, jusqu'à 20 jetons.",   niveau_url(20, "1"),   "niveau-facile.png"),
         ("Normal", "De 2 à 6 taches, jusqu'à 20 jetons.",   niveau_url(20, "mix"), "niveau-normal.png"),
         ("Avancé", "De 2 à 6 taches, jusqu'à 50 jetons.",   niveau_url(50, "mix"), "niveau-avance.png"),
         ("Expert", "De 2 à 6 taches, jusqu'à 100 jetons&nbsp;!", niveau_url(100,"mix"), "niveau-expert.png")],
    accroche="Le tout, les parties…<br>et jusqu'à 20 jetons&nbsp;!")
NIVEAUX["dessin_avance"] = dict(NIVEAUX["avance"], **_DESSIN,
    sortie="livret_petit_splat_dessin_avance", qr="qr/dessin-avance",
    graines={1:"21420011", 2:"22421099", 3:"23420234", 4:"24420016", 5:"25420031", 6:"26420001"},
    sur="Mon livret · Monde 1 · Avancé<br>Je fais le schéma en barres",
    dessin=dict(COUV_DESSIN, profils=[dict(splats="2", vis=[15, 20], hp=[8, 12], tot=[36, 44]), dict(splats="3", vis=0, hp=[12, 14], tot=[36, 42])]),
    dos=[("Une tache",        "Une seule tache, jusqu'à 50 jetons.",   niveau_url(50, "1"),   "niveau-1.png"),
         ("Plein de taches",  "De 2 à 6 taches, jusqu'à 50 jetons.",   niveau_url(50, "mix"), "niveau-2.png"),
         ("Expert · 1 tache", "Une seule tache, jusqu'à 100 jetons.",  niveau_url(100,"1"),   "niveau-3.png"),
         ("Expert · 2 à 6 taches", "De 2 à 6 taches, jusqu'à 100 jetons&nbsp;!", niveau_url(100,"mix"), "niveau-4.png")],)
NIVEAUX["dessin_expert"] = dict(NIVEAUX["expert"], **_DESSIN,
    sortie="livret_petit_splat_dessin_expert", qr="qr/dessin-expert",
    graines={1:"21531069", 2:"22533940", 3:"23530352", 4:"24531050", 5:"25530062", 6:"26530194"},
    sur="Mon livret · Monde 1 · Expert<br>Je fais le schéma en barres",
    dessin=dict(COUV_DESSIN, profils=[dict(splats="2", vis=[12, 20], hp=[20, 30], tot=[55, 80]), dict(splats="4", vis=0, hp=[15, 20], tot=[60, 80])]),
    dos=[("Une tache",         "Une seule tache, jusqu'à 100 jetons.",  niveau_url(100,"1"),   "niveau-1.png"),
         ("Plein de taches",   "De 2 à 6 taches, jusqu'à 100 jetons.",  niveau_url(100,"mix"), "niveau-2.png"),
         ("Réviser · 1 tache", "Une seule tache, jusqu'à 50 jetons.",   niveau_url(50, "1"),   "niveau-3.png"),
         ("Réviser · 2 à 6 taches", "De 2 à 6 taches, jusqu'à 50 jetons.", niveau_url(50, "mix"), "niveau-4.png")],)

def lien_jeu(niv, f):
    """Le QR d'une fiche ouvre EXACTEMENT les mêmes 12 cartes en ligne.
    parcours=m1eN est gardé pour les trois livrets : valider une fiche plus dure
    gagne l'étoile du monde 1 (décision du 17/09/2026)."""
    n = niv["graines"][f["n"]]
    # Fiches 4 et 5 : espace=1, l'élève retrouve à l'écran le dessin de sa feuille (lot 4,
    # 26/09/2026, « même image par le QR ») ; les nombres, eux, sont ceux de la graine.
    return (f"{SITE}/splat/petit/?support=eleve&problem=classic&target={niv['target']}"
            f"&splats={f['splats']}&exercise={f['ex']}&seed={n}"
            + reglages(f)
            + f"&parcours={f.get('parcours', 'm1e' + str(f['n']))}")

LIEN_UNIVERS = f"{SITE}/outils/splat_univers.html"

CSS_QR = """
.activity-instruction{display:flex !important;align-items:center;gap:5mm}
.qr-livret{margin-left:auto;display:flex;align-items:center;gap:3mm;flex:0 0 auto}
.qr-livret img{width:20mm;height:20mm;display:block}
.qr-livret .lib{text-align:right;font-size:11.5px;font-weight:900;color:#0f172a;line-height:1.25;white-space:nowrap}
.qr-livret .lib em{display:block;font-style:normal;font-weight:400;font-size:10.5px;color:#475569;margin-top:0.6mm}
"""

# Ce que dit la boîte du QR. Sur le livret corrigé, la phrase de l'élève n'a pas de
# sens : même boîte, même QR, même place, autre texte (option B, décision du 20/09/2026).
# 23/09/2026 : le corrigé est « pour tous » (il peut être donné aux élèves) — la boîte
# dit « Je rejoue / ces cartes / en ligne », comme les livrets de l'Enquête, et plus
# « (le QR de l'élève) ». Trois lignes courtes : la boîte reste moins large que celle de
# l'élève, la consigne passe à la ligne aux mêmes endroits.
QR_ELEVE = "J'ai terminé<br>ma fiche,<em>je rejoue en ligne</em>"
QR_PROF = "Je rejoue<br>ces cartes<em>en ligne</em>"

# Sur le livret corrigé, la boîte garde EXACTEMENT la largeur de celle de l'élève
# (23/09/2026) : son texte « Je rejoue / ces cartes / en ligne » est plus étroit, et une
# boîte plus étroite faisait passer la consigne (monde 1, fiches 4 à 6) ou le titre du
# bandeau (monde 2) à la ligne ailleurs que sur la fiche de l'élève. JS_QR pose donc
# d'abord le texte de l'élève (le gabarit), mesure sa largeur, puis écrit le texte du
# corrigé avec cette largeur minimale (aligné à droite, contre le QR, comme l'élève).
JS_QR = """([qr, lib, gabarit]) => {
  const ins=document.querySelector('.activity-instruction');
  if(!ins) return 'pas de bandeau de consigne';
  const txt=document.createElement('div'); txt.className='txt';
  while(ins.firstChild) txt.appendChild(ins.firstChild);
  ins.appendChild(txt);
  const box=document.createElement('div'); box.className='qr-livret';
  box.innerHTML='<div class="lib">'+(gabarit||lib)+'</div><img src="'+qr+'" alt="">';
  ins.appendChild(box);
  if(gabarit){
    const l=box.querySelector('.lib');
    const w=l.getBoundingClientRect().width;
    if(!(w>0)) return 'largeur du texte de l\\'élève introuvable';
    l.innerHTML=lib; l.style.minWidth=w+'px';
  }
  return 'ok';
}"""

# ---------------------------------------------------------------------------
# LIVRET DE CORRECTION. Avec correction=1&rv=0, l'outil rend deux pages par fiche :
# l'énoncé, puis sa correction (mêmes cartes, schémas remplis ; la tache reste noire,
# comme dans la correction que l'outil imprime — décision du 20/09/2026). La page de
# correction de l'outil n'a PAS de cadre de consigne : ses cartes démarreraient 29,5 mm
# plus haut et seraient 7 mm plus grandes. On y remet donc le cadre de l'énoncé (même
# hauteur, puisque la boîte du QR garde sa taille) : chaque carte tombe exactement à la
# même place que sur la fiche de l'élève. Puis on retire l'énoncé.
JS_CORRIGE = """() => {
  const pages = [...document.querySelectorAll('.page')];
  if (pages.length !== 2) return pages.length + ' page(s), attendu : énoncé puis correction';
  const [enonce, corr] = pages;
  const st = corr.querySelector('.activity-subtitle');
  if (!st || !/Correction$/.test(st.textContent)) return 'la seconde page n\\'est pas la correction';
  const ins = enonce.querySelector('.activity-instruction');
  const grille = corr.querySelector('.grid');
  if (!ins || !grille) return 'cadre de consigne ou grille introuvable';
  grille.before(ins);
  enonce.remove();
  return 'ok';
}"""

# La couverture du livret corrigé : un bandeau « Correction » en haut, et « Livret
# corrigé » à la place de la ligne Prénom / Classe (décision du 20/09/2026, rouge sombre ;
# textes « pour tous » du 23/09/2026 — plus de « professeur »).
# Le bandeau fait 14 mm : les 4 premiers ne s'impriment pas sur la plupart
# des imprimantes, le texte est donc centré sur les 10 mm qui s'impriment. En noir et
# blanc, le rouge devient gris foncé et le texte blanc reste lisible.
PROF = dict(bandeau="Correction", ligne="Livret corrigé")
CSS_PROF = """
.bandeau-prof{flex:0 0 14mm;box-sizing:border-box;padding-top:4mm;display:flex;align-items:center;justify-content:center;
  background:#b91c1c;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:3px}
.ident .champ.prof{flex:1;padding:3.5mm 4mm;text-align:center}
.ident .champ.prof span{font-size:17px;color:#063b7a}
"""

# ---------------------------------------------------------------------------
# L'exemple expliqué de la couverture est DESSINÉ PAR L'OUTIL LUI-MÊME : on tire
# des cartes jusqu'à en trouver une au profil demandé, puis on récupère son SVG
# (getSplatSvg avec les jetons cachés). L'exemple d'un livret ressemble donc
# exactement aux cartes de ses fiches — plusieurs taches comprises.
# Le pied des 6 fiches est écrit par l'outil ("mathsgo.re/splat/petit"), qui est la
# bonne adresse pour une fiche imprimée depuis le générateur — mais pas pour un livret :
# /splat/petit ouvre le générateur, alors que /splat ouvre la collection SPLAT du
# catalogue, où se trouvent les livrets, l'univers et tous les autres Splat. On repointe
# donc le pied des 8 pages du livret vers /splat (décision du 18/09/2026).
PIED_LIVRET = "mathsgo.re/splat · CC BY-NC-SA 4.0"
PIED_CORRECTION = PIED_LIVRET + " · correction"

JS_PIED = """(texte) => {
  const f = document.querySelector('.activity-footer');
  if (!f) return 'pas de pied de page';
  f.innerText = texte;
  return 'ok';
}"""

# ---------------------------------------------------------------------------
# RELECTURE DU MONDE 1, LOT 3 (26/09/2026) — décisions de Gwenaël, par questions à choix.
# 1. Plus AUCUN logo sur les pages-fiches du livret (ni IREMI ni maths&go) : on retire le
#    bloc .activity-logos AU RENDU, jamais dans l'outil (une fiche imprimée depuis le
#    générateur garde ses deux logos). Le QR reste où il était, dans le cadre de consigne
#    (réponse A) : 20 mm, et les cartes ne bougent pas d'un millimètre — le bandeau garde
#    ses 16 mm, seul son côté droit se vide.
# 2. Les pages 2 à 7 portent leur numéro : « page N », en gras noir, au coin EXTÉRIEUR du
#    bas (à droite sur les pages impaires, à gauche sur les paires), sur la ligne du pied
#    (réponse D3). Le mot « page » évite la confusion avec « Fiche N-1 » écrit dans le
#    bandeau. C'est le numéro de la page DANS LE LIVRET : l'imposition A3 (8|1 · 2|7 · 6|3 ·
#    4|5) pose chaque page A4 telle quelle, le numéro suit donc sa page, et le coin
#    extérieur de chaque demi-feuille est bien celui du livret plié. Ni la couverture ni le
#    dos ne sont numérotés. Le bas de l'encre tombe à 3,6 mm du bord du papier, comme le pied
#    (3,8 mm) : pas plus bas, beaucoup d'imprimantes n'impriment rien dans les 4 derniers mm.
JS_SANS_LOGO = """() => {
  const l = document.querySelectorAll('.activity-logos');
  if (l.length !== 1) return l.length + ' bloc(s) de logos, attendu : 1';
  l[0].remove();
  return 'ok';
}"""

CSS_NUMERO = """
.num-page{position:absolute;bottom:-4.6mm;font-size:12.5px;font-weight:900;color:#0f172a;line-height:1;white-space:nowrap}
.num-page.impaire{right:1mm}
.num-page.paire{left:1mm}
"""

JS_NUMERO = """(n) => {
  const i = document.querySelectorAll('.page-inner');
  if (i.length !== 1) return i.length + ' page(s), attendu : 1';
  const d = document.createElement('div');
  d.className = 'num-page ' + (n % 2 ? 'impaire' : 'paire');
  d.textContent = 'page ' + n;
  i[0].appendChild(d);
  return 'ok';
}"""

JS_EXEMPLE = """([target, splatMode, visMin, visMax, hpMin, hpMax, totMin]) => {
  for (let essai = 0; essai < 8000; essai++) {
    currentRand = mulberry32(hashSeed('exemple-' + target + '-' + essai));
    const c = createItem('find_hidden', target, splatMode);
    if (c.visible < visMin || c.visible > visMax) continue;
    if (c.hiddenPerSplat < hpMin || c.hiddenPerSplat > hpMax) continue;
    if (c.total < totMin) continue;
    return {svg: getSplatSvg(c, true, false, true), total: c.total,
            visible: c.visible, n: c.numSplats, hp: c.hiddenPerSplat};
  }
  return null;
}"""

# La règle des livrets « je dessine le schéma », sur la couverture, sous l'exemple : un
# trait pointillé, puis le texte en bleu foncé (lisible en noir et blanc).
CSS_REGLE = """
.expl .regle{margin:5mm 0 0;padding-top:3.5mm;border-top:1.4px dashed #94a3b8;font-size:13.5px;line-height:1.4;color:#1e3a5f}
.expl .regle b{font-weight:700}
"""

# COUVERTURE DES LIVRETS « JE FAIS LE SCHÉMA EN BARRES » (26/09/2026, idée de Gwenaël) :
# « Comment ça marche ? » montre ce que l'élève fait sous chaque carte — il fait le schéma et
# écrit sa réponse « ? = … ». Deux exemples côte à côte, dessinés par l'outil lui-même :
# une carte avec jetons (plus petite : les élèves la connaissent), et une carte SANS jeton
# posé (« tu n'as aucun jeton à dessiner »). Puis la règle du livret.
JS_DEUX_EXEMPLES = """([target, profils]) => profils.map((p, k) => {
  for (let essai = 0; essai < 20000; essai++) {
    currentRand = mulberry32(hashSeed('exemple-dessin-' + k + '-' + target + '-' + essai));
    const c = createItem('find_hidden', target, p.splats);
    if (p.vis === 0) { c.total -= c.visible; c.visible = 0; c.dots = { arr: [], r: c.dots ? c.dots.r : 8 }; }
    else if (c.visible < p.vis[0] || c.visible > p.vis[1]) continue;
    if (c.hiddenPerSplat < p.hp[0] || c.hiddenPerSplat > p.hp[1]) continue;
    if (c.total < p.tot[0] || c.total > p.tot[1]) continue;
    if ([c.total, c.visible, c.hiddenPerSplat].includes(69)) continue;
    /* sur la couverture, le cadre du total est plus gros que sur une fiche : aucun jeton
       dans le coin haut-droit, sinon il touche le cadre */
    if ((c.dots && c.dots.arr || []).some(q => q.x > 190 && q.y < 85)) continue;
    return {svg: getSplatSvg(c, true, false, false), total: c.total, visible: c.visible,
            n: c.numSplats, hp: c.hiddenPerSplat};
  }
  return null;
})"""

CSS_DEUX_EXEMPLES = """
.expl .intro.dessin{margin:3mm 0 3.5mm}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.duo .ex .t{font-size:13px;font-weight:700;color:#334155;margin-bottom:1.8mm}
.duo .rang{display:flex;align-items:center;gap:2.5mm}
.duo .cp{position:relative;flex:0 0 40mm;border:1.4px solid #0f172a;border-radius:4px;padding:1.4mm;background:#fff}
.duo .cp .tot{position:absolute;top:1.6mm;right:1.6mm;border:1.5px solid #0f172a;border-radius:3px;padding:0.2mm 1.6mm;font-size:15px;font-weight:700;background:#fff}
.duo .cp svg{width:100%;height:auto;display:block}
.duo .fl{font-size:15px;color:#c2410c}
.duo .sp{flex:1;min-width:0}
.duo .sp .h{border:1.4px solid #0f172a;height:10mm;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700}
.duo .sp .b{display:flex}
.duo .sp .b div{border:1.4px solid #0f172a;border-top:none;height:10mm;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;min-width:0}
.duo .sp .b div + div{border-left:none}
.duo .sp .b .v{color:#2563eb}
.duo .sp .b .c{background:#e2e8f0;color:#111827}
.duo .sp .rep{margin-top:3mm;text-align:left;font-size:18px;font-weight:700;color:#0f172a}
.duo .sp .rep span{border-bottom:1.4px dashed #64748b;padding:0 2mm}
"""

JS_COUV_DESSIN = """(d) => {
  const expl = document.querySelector('.expl');
  if (!expl) return 'pas de bloc « Comment ça marche ? »';
  const ex = (e, titre) => {
    const flexV = Math.max(e.visible, e.total * 0.05, 1), flexH = Math.max(e.hp, e.total * 0.05, 1);
    let bas = e.visible > 0 ? '<div class="v" style="flex:' + flexV + '">' + e.visible + '</div>' : '';
    for (let i = 0; i < e.n; i++) bas += '<div class="c" style="flex:' + flexH + '">?</div>';
    return '<div class="ex"><div class="t">' + titre + '</div><div class="rang">' +
      '<div class="cp"><span class="tot">' + e.total + '</span>' + e.svg + '</div><div class="fl">➜</div>' +
      '<div class="sp"><div class="h">' + e.total + '</div><div class="b">' + bas + '</div>' +
      '<div class="rep"><span>?&nbsp;=&nbsp;' + e.hp + '</span></div></div></div></div>';
  };
  expl.innerHTML = '<span class="chip">Comment ça marche&nbsp;?</span>' +
    '<div class="intro dessin">' + d.intro + '</div>' +
    '<div class="duo">' + ex(d.ex[0], d.titres[0]) + ex(d.ex[1], d.titres[1]) + '</div>' +
    '<p class="regle">' + d.regle + '</p>';
  return 'ok';
}"""

JS_COUV = """(d) => {
  const set = (sel, html) => { const e = document.querySelector(sel); if (e) e.innerHTML = html; };
  if (d.prof) {
    const id = document.querySelector('.ident');
    if (!id) return 'pas de ligne Prénom / Classe';
    document.body.insertAdjacentHTML('afterbegin', '<div class="bandeau-prof">' + d.prof.bandeau + '</div>');
    id.innerHTML = '<div class="champ prof"><span>' + d.prof.ligne + '</span></div>';
  }
  if (d.sur) set('.tete .sur', d.sur);
  /* « Dans ce livret » : les titres des fiches du livret (livrets « je dessine le schéma »),
     chacun à côté de son numéro (la liste est rangée en deux colonnes : 1 4 / 2 5 / 3 6). */
  if (d.som) {
    const lis = document.querySelectorAll('.som li');
    if (lis.length !== d.som.length) return 'sommaire : ' + lis.length + ' lignes';
    lis.forEach(li => {
      const n = parseInt(li.querySelector('b').textContent, 10);
      const badge = li.querySelector('.badge');
      li.innerHTML = ''; li.appendChild(badge);
      li.insertAdjacentHTML('beforeend', d.som[n - 1]);
    });
  }
  if (d.accroche) set('.tete .accroche', d.accroche);
  if (!d.ex) return 'ok';
  const e = d.ex;
  const mot = e.n > 1 ? ('les ' + e.n + ' taches en cachent une partie')
                      : ('la tache en cache une partie');
  set('.expl .intro',
      'Au total, il y a ' + e.total + ' jetons&nbsp;: ' + mot + '.' +
      '<span>Ici les taches sont transparentes&nbsp;: on voit les jetons cachés. ' +
      (e.n > 1 ? 'Chaque tache en cache le <b>même nombre</b>. ' : '') +
      'Le schéma en barres représente la situation.</span>');
  set('.carte .tot', e.total);
  const carte = document.querySelector('.carte');
  const vieux = carte.querySelector('svg'); if (vieux) vieux.remove();
  carte.insertAdjacentHTML('beforeend', e.svg);
  // les jetons cachés sont serrés sous la tache : on les affine pour qu'ils
  // restent comptables sur la couverture (les positions, elles, ne bougent pas).
  carte.querySelectorAll('circle').forEach(c => {
      c.setAttribute('r', (parseFloat(c.getAttribute('r')) * 0.68).toFixed(2));
      c.setAttribute('stroke-width', '0.8');
  });
  carte.querySelectorAll('.splat-path').forEach(p => {
      p.setAttribute('fill', '#111827'); p.setAttribute('opacity', '0.16');
      p.setAttribute('stroke', '#334155'); p.setAttribute('stroke-width', '1.6');
      p.setAttribute('stroke-opacity', '2.6');
      p.removeAttribute('filter');
  });
  set('.sch .barre-h', e.total);
  const flexV = Math.max(e.visible, e.total * 0.05, 1);
  const flexH = Math.max(e.hp, e.total * 0.05, 1);
  const mini = '<svg class="mini" viewBox="40 10 220 180" aria-hidden="true"><path d="M130,50 Q170,20 200,60 Q230,80 210,130 Q180,170 130,160 Q80,150 70,100 Q80,40 130,50 Z" fill="#111827"/></svg>';
  let bas = '<div class="vis" style="flex:' + flexV + '">' + e.visible + '</div>';
  /* la mini-tache va dans CHAQUE case cachée : une case = une tache */
  for (let i = 0; i < e.n; i++)
      bas += '<div class="cac" style="flex:' + flexH + '">' + mini + e.hp + '</div>';
  set('.sch .barre-b', bas);
  /* La mini-tache reste TOUJOURS dans le coin haut-gauche, et le nombre reste centré.
     Les cases du schéma sont proportionnelles aux quantités : avec 10 jetons cachés au
     lieu de 34, ou avec quatre cases, elles rétrécissent et la tache de 8 x 5,4 mm vient
     buter sur le nombre. On la réduit alors — petite dans le coin, exactement comme dans
     le jeu de l'élève (.eleve-case .miniTache de outils/splat_tache_barre.html). La place
     est MESURÉE sur la page, pas supposée : une case large (Monde 1, et toute couverture
     future) garde la tache telle quelle. Lot K1-bis, 20/09/2026. */
  document.querySelectorAll('.sch .barre-b .cac').forEach(c => {
    const m = c.querySelector('.mini'); if (!m) return;
    const r = c.getBoundingClientRect(), st = getComputedStyle(c);
    const mesure = document.createElement('span');
    mesure.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:' + st.font;
    mesure.textContent = (c.textContent || '').trim();
    document.body.appendChild(mesure);
    const nombre = r.left + (r.width - mesure.getBoundingClientRect().width) / 2;
    mesure.remove();
    if (m.getBoundingClientRect().right > nombre - 4) {
      m.style.left = '1.1mm'; m.style.top = '0.9mm';
      m.style.width = '4.4mm'; m.style.height = '3mm';
    }
  });
  set('.sch .pieds',
      '<span class="a" style="flex:' + flexV + '">les jetons <b>visibles</b></span>' +
      '<span class="b" style="flex:' + (flexH * e.n) + '">les jetons <b>cachés</b>' +
      (e.n > 1 ? ' (' + e.n + ' fois ' + e.hp + ')' : '') + '</span>');
  return 'ok';
}"""

JS_DOS = """(d) => {
  const box = document.querySelector('.niveaux');
  if (!box) return 'pas de bloc niveaux';
  box.innerHTML = d.niveaux.map(n =>
     '<div class="niv"><img src="' + n[2] + '" alt=""><span class="n">' + n[0] +
     '</span><span class="d">' + n[1] + '</span></div>').join('');
  const u = document.querySelector('.suite img');
  if (u) u.setAttribute('src', d.univers);
  return 'ok';
}"""

def fabrique_qr(niv):
    """(Re)fabrique les QR codes du niveau. À relancer si une graine change."""
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
    dossier = ICI / niv["qr"]
    dossier.mkdir(parents=True, exist_ok=True)
    def ecrire(url, nom):
        q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
        q.add_data(url); q.make(fit=True)
        q.make_image(fill_color="black", back_color="white").save(dossier / nom)
    for f in fiches_de(niv):
        ecrire(lien_jeu(niv, f), f"fiche{f['n']}.png")
    ecrire(LIEN_UNIVERS, "univers.png")
    for _, _, url, nom in niv["dos"]:
        ecrire(url, nom)

def serveur():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(RACINE))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

async def pages(niv, tmp, correction=False):
    from playwright.async_api import async_playwright
    base = f"http://127.0.0.1:{PORT}"
    qrweb = f"{BASE_WEB}/{niv['qr']}"
    async with async_playwright() as p:
        # Le vrai Chromium (channel="chromium") et non le « headless shell » : celui-ci
        # espace les lettres d'environ 5 % (vu le 19/09/2026 sur les couvertures), le
        # navigateur complet rend le texte comme Chrome sur un poste de travail.
        nav = await p.chromium.launch(channel="chromium")

        exemple = None
        if niv["exemple"]:
            e = niv["exemple"]
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(f"{base}/outils/splat_tache_barre.html?support=print", wait_until="networkidle")
            await pg.wait_for_timeout(800)
            exemple = await pg.evaluate(JS_EXEMPLE, [niv["target"], e["splats"],
                                                     e["vis"][0], e["vis"][1],
                                                     e["hp"][0], e["hp"][1], e["total"]])
            await pg.close()
            if not exemple:
                raise SystemExit("aucune carte d'exemple ne correspond au profil demandé")
            print(f"   exemple de couverture : {exemple['total']} = {exemple['visible']}"
                  f" + {exemple['n']} x {exemple['hp']}")

        deux = None
        if niv.get("dessin"):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(f"{base}/outils/splat_tache_barre.html?support=print", wait_until="networkidle")
            await pg.wait_for_timeout(800)
            deux = await pg.evaluate(JS_DEUX_EXEMPLES, [niv["target"], niv["dessin"]["profils"]])
            await pg.close()
            if not deux or None in deux:
                raise SystemExit("exemples de couverture introuvables")
            for e in deux:
                print(f"   exemple : {e['total']} = {e['visible']} + {e['n']} x {e['hp']}")

        async def pdf(url, sortie, injecter=None, couv=None, dos=None, numero=None):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(url, wait_until="networkidle")
            await pg.wait_for_timeout(1200)
            if injecter:
                if correction:
                    r = await pg.evaluate(JS_CORRIGE)
                    if r != "ok":
                        raise SystemExit(f"page de correction de {url} : {r}")
                await pg.add_style_tag(content=CSS_QR)
                r = await pg.evaluate(JS_QR, [injecter, QR_PROF, QR_ELEVE] if correction else [injecter, QR_ELEVE, None])
                if r != "ok":
                    raise SystemExit(f"injection du QR impossible sur {url} : {r}")
                r = await pg.evaluate(JS_PIED, PIED_CORRECTION if correction else PIED_LIVRET)
                if r != "ok":
                    raise SystemExit(f"pied de page : {r}")
                r = await pg.evaluate(JS_SANS_LOGO)
                if r != "ok":
                    raise SystemExit(f"logos de {url} : {r}")
                if numero:
                    await pg.add_style_tag(content=CSS_NUMERO)
                    r = await pg.evaluate(JS_NUMERO, numero)
                    if r != "ok":
                        raise SystemExit(f"numéro de page : {r}")
                await pg.wait_for_timeout(400)
            if couv is not None:
                if couv.get("prof"):
                    await pg.add_style_tag(content=CSS_PROF)
                r = await pg.evaluate(JS_COUV, couv)
                if r != "ok":
                    raise SystemExit(f"couverture : {r}")
                if niv.get("dessin"):
                    await pg.add_style_tag(content=CSS_REGLE + CSS_DEUX_EXEMPLES)
                    r = await pg.evaluate(JS_COUV_DESSIN, dict(niv["dessin"], ex=deux))
                    if r != "ok":
                        raise SystemExit(f"couverture « je fais le schéma » : {r}")
                await pg.wait_for_timeout(400)
            if dos is not None:
                r = await pg.evaluate(JS_DOS, dos)
                if r != "ok":
                    raise SystemExit(f"dos : {r}")
                await pg.wait_for_timeout(400)
            await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        couv = dict(sur=niv["sur"], accroche=niv["accroche"], ex=None if niv.get("dessin") else exemple,
                    prof=PROF if correction else None,
                    som=[f["t"].replace(" !", "&nbsp;!") for f in niv["fiches"]] if "fiches" in niv else None)
        await pdf(f"{base}{BASE_WEB}/couverture.html", tmp / "p1.pdf", couv=couv)
        for f in fiches_de(niv):
            url = (f"{base}/outils/splat_tache_barre.html?support=print&problem=classic"
                   f"&target={niv['target']}&splats={f['splats']}&exercise={f['ex']}"
                   f"&seed={niv['graines'][f['n']]}"
                   + reglages(f)
                   # le papier seulement : schéma à faire, « ? = …… » sous chaque carte, et
                   # aux fiches 1 et 2 le guidage (1 exemple résolu, 2 schémas donnés)
                   + ("&diagram=draw&reponse=1" if f.get("dessin") else "")
                   + ("&exemple=1&donne=2" if f.get("guide") else "")
                   # qr=0 : l'outil pose désormais son propre QR sur chaque fiche classique
                   # (26/09/2026) ; le livret garde le sien (JS_QR), un seul QR par page.
                   + "&qr=0"
                   + "&title=" + quote(f"Fiche {f['n']} — {f['t']}")
                   + ("&correction=1&rv=0" if correction else ""))
            # la fiche N est la page N+1 du livret (la couverture est la page 1)
            await pdf(url, tmp / f"p{f['n']+1}.pdf", injecter=f"{qrweb}/fiche{f['n']}.png",
                      numero=f['n'] + 1)
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/{img}"] for nom, desc, _, img in niv["dos"]],
                   univers=f"{qrweb}/univers.png")
        await pdf(f"{base}{BASE_WEB}/dos.html", tmp / "p8.pdf", dos=dos)
        await nav.close()

def assemble(niv, tmp):
    """Assemble les 8 pages, puis impose les 2 feuilles A3.

    IMPORTANT : on passe par pikepdf et `add_overlay`, qui place chaque page
    comme un Form XObject. Avec une simple translation de contenu (pypdf
    merge_transformed_page), les DÉGRADÉS ne suivent pas : un motif PDF est
    ancré à l'espace par défaut de la feuille, pas au contenu déplacé — la
    page de droite se retrouvait alors peinte avec la fin du dégradé (bandeau
    crème au lieu d'orange). Bug vu sur le livret A3 le 17/09/2026.
    """
    import pikepdf
    A4W, A4H = 595.276, 841.890

    src = [pikepdf.open(str(tmp / f"p{i}.pdf")) for i in range(1, 9)]
    pages = [s.pages[0] for s in src]

    livret = pikepdf.Pdf.new()
    for p in pages:
        page = livret.add_blank_page(page_size=(A4W, A4H))
        pikepdf.Page(page).add_overlay(p, pikepdf.Rectangle(0, 0, A4W, A4H))
    livret.save(str(RACINE / "outils" / f"{niv['sortie']}.pdf"))

    a3 = pikepdf.Pdf.new()
    for g, d in [(8, 1), (2, 7), (6, 3), (4, 5)]:   # imposition d'un cahier de 8 pages
        feuille = a3.add_blank_page(page_size=(2 * A4W, A4H))
        for idx, tx in ((g, 0.0), (d, A4W)):
            pikepdf.Page(feuille).add_overlay(pages[idx - 1],
                                              pikepdf.Rectangle(tx, 0, tx + A4W, A4H))
    a3.save(str(RACINE / "outils" / f"{niv['sortie']}_a_plier.pdf"))
    for s in src:
        s.close()


def compresse(chemin):
    """qpdf, s'il est installé, divise le poids par deux (objets et flux recompressés)."""
    import shutil, subprocess
    if not shutil.which("qpdf"):
        return
    tmp = chemin.with_suffix(".qpdf.pdf")
    r = subprocess.run(["qpdf", "--object-streams=generate", "--compress-streams=y",
                        "--recompress-flate", "--compression-level=9", str(chemin), str(tmp)])
    if r.returncode in (0, 3) and tmp.exists():
        tmp.replace(chemin)


def main():
    import tempfile
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    demandes = args or list(NIVEAUX)
    inconnu = [a for a in demandes if a not in NIVEAUX]
    if inconnu:
        raise SystemExit(f"niveau inconnu : {', '.join(inconnu)} (au choix : {', '.join(NIVEAUX)})")
    # Sans option, on refait le livret de l'élève ET son livret de correction : les deux
    # restent ainsi toujours rendus avec les mêmes graines et la même version de l'outil.
    if "--eleve" in sys.argv and "--correction" in sys.argv:
        raise SystemExit("--eleve et --correction s'excluent (sans option : les deux)")
    versions = [False, True]
    if "--eleve" in sys.argv:
        versions = [False]
    if "--correction" in sys.argv:
        versions = [True]
    srv = serveur()
    try:
        for nom in demandes:
            niv = NIVEAUX[nom]
            print(f"— livret « {nom} » (cible {niv['target']})")
            if "--qr" in sys.argv:
                fabrique_qr(niv); print("   QR codes régénérés.")
            for correction in versions:
                # le livret de correction ne diffère que par son nom de sortie :
                # outils/<sortie>_correction.pdf et outils/<sortie>_correction_a_plier.pdf
                cible = dict(niv, sortie=niv["sortie"] + "_correction") if correction else niv
                with tempfile.TemporaryDirectory() as d:
                    tmp = Path(d)
                    asyncio.run(pages(niv, tmp, correction))
                    assemble(cible, tmp)
                for suffixe in ("", "_a_plier"):
                    compresse(RACINE / "outils" / f"{cible['sortie']}{suffixe}.pdf")
                print(f"   Fait : outils/{cible['sortie']}.pdf et outils/{cible['sortie']}_a_plier.pdf")
    finally:
        srv.shutdown()

if __name__ == "__main__":
    main()
