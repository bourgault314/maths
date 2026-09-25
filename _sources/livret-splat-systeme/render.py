#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère les deux livrets du monde 4, SPLAT! Système, à partir du site lui-même :
« SPLAT! Système » (partie 1, on retire : fiches 25 à 29) et « SPLAT! Système, la suite »
(partie 2, on additionne, on double : fiches 30 à 34).

    python3 render.py                    (les deux livrets, l'élève et les deux corrigés)
    python3 render.py systeme            (un seul livret : systeme | suite)
    python3 render.py --qr               (en refabriquant d'abord les QR codes)
    python3 render.py --eleve            (seulement les livrets de l'élève)
    python3 render.py --correction       (seulement les corrigés)

Produit, à la racine du dépôt, pour chaque livret :
    outils/livret_splat_systeme.pdf                     8 pages A4, ordre de lecture
    outils/livret_splat_systeme_a_plier.pdf             2 feuilles A3 (4 pages A3), imposées
et ses deux corrigés (pour tous : on peut les donner aux élèves) :
    outils/livret_splat_systeme_correction.pdf          4 cartes par page, 8 pages (comme l'élève)
    outils/livret_splat_systeme_correction_2_par_page.pdf
                                                        2 cartes par page, calculs plus gros :
                                                        10 pages A4 PAYSAGE, une feuille recto
                                                        verso par fiche (pas de livret à plier)
    (le livret de l'élève et le corrigé 4 par page ont chacun leur …_a_plier.pdf) ; idem pour
    « suite » (livret_splat_systeme_suite…).

LES PAGES. Couverture, un exemple résolu (page 2), les cinq fiches du livret (4 cartes par page),
le dos. Une fiche = une étape de la carte des mondes = une étoile ; le QR d'une fiche ouvre sa
série en ligne par la page courte /splat/systeme/livret/?f=25 (…34).

LES FICHES ne sont PAS redessinées ici : elles sont rendues par l'outil du site
(outils/splat.html, mode D, 4 par page) avec les graines figées du lot « fiches 20-34 »
(24/09/2026, splat-systemes-fiches-25-34-adresses.md), et le QR est ajouté dans le bandeau
juste avant l'impression. L'EXEMPLE RÉSOLU non plus : la carte et ses cadres sont ceux de la
correction de l'outil (drawSysCadre, un cadre par étape, comme au clic), sur une carte qui n'est
PAS dans le livret ; les légendes ne répètent aucun nombre (les nombres sont dans les cadres
dessinés par l'outil), les textes qui en citent sont écrits À PARTIR DE LA CARTE rendue.

LES CORRIGÉS : la correction imprimée de l'outil (print=correction) — les plateaux dévoilés en
haut, puis les cadres. En 4 par page, un livret de 8 pages comme celui de l'élève ; en 2 par
page (layout=2, choix du 24/09/2026 : calculs ≈ 7 pt au lieu de ≈ 5), l'outil imprime deux
cartes côte à côte sur une page A4 PAYSAGE : chaque fiche tient sur une feuille recto verso,
et le corrigé est la suite de ces cinq feuilles (10 pages), sans couverture ni pliage — une
page paysage ne se relie pas dans un livret portrait. Les cartes sont vérifiées identiques
d'une version à l'autre.

Dépendances : playwright 1.56.0 (+ chromium), pikepdf, qrcode[pil]. qpdf si disponible.
Le rendu utilise le VRAI Chromium (channel="chromium"), jamais le « headless shell » (il
espace les lettres d'environ 5 %).
"""
import asyncio, http.server, socketserver, threading, functools, sys, json
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent                      # racine du dépôt
BASE_WEB = "/_sources/livret-splat-systeme"
PORT = 8126
SITE = "https://mathsgo.re"
COURTE = "/splat/systeme/livret/"               # la page courte des QR (?f=fiche, ?s=série)

# Les dix fiches du Système, EXACTEMENT les adresses du lot « fiches 20-34 » (24/09/2026,
# graines validées sur planches) : réglages du plan de production (§ 4) + la graine. Leurs
# cartes ne doivent jamais changer (le lot S-defi l'a prouvé carte par carte).
SYS_COMMUN = "&cards=4&unknown=question"
S25 = "mode=D&geste=EMBOITE1&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2105"
S26 = "mode=D&geste=EMBOITE1&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=9244"
S27 = "mode=D&geste=PARTIELLE&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2828"
S28 = "mode=D&geste=COEF&coefMax=3&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=1214"
S29 = "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=7984"
S30 = "mode=D&geste=TROIS&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=653"
S31 = "mode=D&geste=DOUBLE&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=175"
S32 = "mode=D&geste=MIROIR&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=609"
S33 = "mode=D&geste=MIX&gestes=DOUBLE,MIROIR&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=1287"
S34 = "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF,DOUBLE,MIROIR,TROIS&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=11674"

def fiche(n, t, q, resume):
    return dict(n=n, t=t, q=q, resume=resume, code=str(n))

FICHES_1 = [
    fiche(25, "Une partie du plateau", S25, "Un 2e plateau est dans le 1er&nbsp;: retire-le."),
    fiche(26, "Avec des jetons visibles", S26, "Le même jeu, et des jetons à retirer aussi."),
    fiche(27, "Une partie connue", S27, "L'indice ne garde qu'une couleur."),
    fiche(28, "Deux pesées", S28, "Une seule couleur change."),
    fiche(29, "Le défi des plateaux", S29, "À toi de trouver le bon geste."),
]
FICHES_2 = [
    fiche(30, "Trois paires", S30, "Pas de total&nbsp;: additionne les trois."),
    fiche(31, "Doubler, puis comparer", S31, "Double l'indice avant de comparer."),
    fiche(32, "En miroir", S32, "Additionne les deux, puis partage."),
    fiche(33, "Doubler ou miroir&nbsp;?", S33, "Deux gestes qui se ressemblent."),
    fiche(34, "Le grand défi du Système", S34, "Tout mélangé, et des jetons visibles."),
]

# Les séries infinies du dos : pas de graine, huit cartes nouvelles à chaque ouverture, en mode
# élève sans étape (rien n'est enregistré). Leurs QR passent par la page courte (?s=1…6), comme
# ceux de l'Enquête : une adresse courte, un QR aux gros modules, qui se lit photocopié. Les
# réglages sont ceux des fiches, sans graine (la page courte ajoute &cards=8&unknown=question&eleve=1).
SERIES = {
    1: "mode=D&geste=EMBOITE1&visibleMin=0&visibleMax=3&totalMin=20&totalMax=60",
    2: "mode=D&geste=MIX&gestes=PARTIELLE,COEF&coefMax=3&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    3: "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60",
    4: "mode=D&geste=TROIS&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    5: "mode=D&geste=MIX&gestes=DOUBLE,MIROIR&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    6: "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF,DOUBLE,MIROIR,TROIS&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60",
}
SERIE_CARTES = 8

# Les exemples (couverture et page 2), décidés le 24/09/2026 : une « partie connue » pour la
# partie 1, un « doubler » pour la partie 2. Mêmes réglages que la fiche du geste, une carte,
# une graine HORS des fiches, la tache noire et la tache bleue (comme les exemples de l'Enquête) :
#   partie 1 (PARTIELLE, graine 82) : 2 noires + 3 bleues = 54 ; 2 noires = 30
#     → 54 − 30 = 24, 3 bleues = 24, bleue = 8 ; 2 noires = 30, noire = 15 ;
#   partie 2 (DOUBLE, graine 321) : 2 noires + 4 bleues = 42 ; noire + bleue = 15
#     → on double : 2 noires + 2 bleues = 30 ; 42 − 30 = 12 = 2 bleues, bleue = 6 ; noire = 9.
# render.py refuse un exemple qui serait une carte des fiches 25 à 34.
EX_1 = "mode=D&geste=PARTIELLE&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&cards=1&unknown=question&seed=82"
EX_2 = "mode=D&geste=DOUBLE&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&cards=1&unknown=question&seed=321"

LIVRETS = {
    "systeme": dict(
        sortie="livret_splat_systeme",
        fiches=FICHES_1,
        exemple=dict(query=EX_1, geste="PARTIELLE"),
        couv=dict(sur="Mon livret · Monde 4 · Partie 1", titre="Système",
                  accroche="Plusieurs plateaux, un total pour chacun…<br>retire l'un de l'autre&nbsp;!"),
        dos=dict(
            series=[("Une partie du plateau", "Un plateau dans l'autre, comme les fiches&nbsp;25 et&nbsp;26.", 1),
                    ("Partie connue, deux pesées", "Comme les fiches&nbsp;27 et&nbsp;28.", 2),
                    ("Le défi des plateaux", "Les trois gestes mélangés, comme la fiche&nbsp;29.", 3)],
            suite="Continue avec la partie&nbsp;2, <b>SPLAT! Système, la suite</b>&nbsp;: on additionne, on double… avant de comparer&nbsp;!",
            # « Pour se souvenir » (dos de l'élève) : [étiquette, cases « ? », cases de « reste »]
            souvenir=dict(mini=[["plateau", 5, 0], ["indice", 2, 3]],
                          texte="Je dessine chaque plateau en barre, <b>une case par tache</b>, l'un sous l'autre, alignés à gauche. Ce qui dépasse, c'est <b>ce qui reste</b>&nbsp;: la différence des deux totaux.")),
    ),
    "suite": dict(
        sortie="livret_splat_systeme_suite",
        fiches=FICHES_2,
        exemple=dict(query=EX_2, geste="DOUBLE"),
        couv=dict(sur="Mon livret · Monde 4 · Partie 2", titre="Système, la suite",
                  accroche="On additionne, on double…<br>avant de comparer&nbsp;!"),
        dos=dict(
            series=[("Trois paires", "Pas de total, comme la fiche&nbsp;30.", 4),
                    ("Doubler ou miroir", "Comme les fiches&nbsp;31 à&nbsp;33.", 5),
                    ("Le grand défi", "Les six gestes et des jetons visibles, comme la fiche&nbsp;34.", 6)],
            suite="Va voir le monde&nbsp;5, <b>SPLAT! Équations</b>&nbsp;: des taches des deux côtés, et on écrit l'équation&nbsp;!",
            souvenir=dict(mini=[["plateau", 6, 0], ["indice ×&nbsp;2", 4, 2]],
                          texte="Parfois, il faut d'abord <b>doubler</b> l'indice, ou <b>additionner</b> les plateaux. Ensuite, je compare comme avant&nbsp;: ce qui dépasse, c'est <b>ce qui reste</b>.")),
    ),
}

def lien_fiche(n):
    return f"{SITE}{COURTE}?f={n}"

def lien_serie(s):
    return f"{SITE}{COURTE}?s={s}"

LIEN_UNIVERS = f"{SITE}/outils/splat_univers.html"

# Le QR dans le bandeau de chaque fiche, dans une boîte blanche (comme l'Enquête).
CSS_QR = """
.printArea .print-page-header{flex-basis:21mm !important}
.printArea.print-2up .print-page-header{flex-basis:21mm !important}
.printArea .print-page-title-block{flex:1 1 auto;min-width:0;align-items:center}
.printArea .print-page-subtitle{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.12}
.qr-livret{display:flex;align-items:center;gap:2.5mm;background:#fff;border-radius:2mm;padding:1mm 1.5mm 1mm 2.5mm;margin-left:auto;margin-right:2mm;flex:0 0 auto}
.qr-livret img{width:17mm;height:17mm;display:block}
.qr-livret .lib{text-align:right;font-size:11px;font-weight:900;color:#0f172a;line-height:1.2;white-space:nowrap}
.qr-livret .lib em{display:block;font-style:normal;font-weight:400;font-size:10px;color:#475569;margin-top:0.5mm}
"""
QR_ELEVE = "J'ai terminé<br>ma fiche,<em>je rejoue en ligne</em>"
QR_CORR = "Je rejoue<br>ces cartes<em>en ligne</em>"

JS_QR = """([qr, lib]) => {
  const heads = document.querySelectorAll('.printArea .print-page-header');
  if (!heads.length) return 'pas de bandeau imprimé';
  heads.forEach(h => {
    const box = document.createElement('div'); box.className = 'qr-livret';
    box.innerHTML = '<div class="lib">' + lib + '</div><img src="' + qr + '" alt="">';
    const logos = h.querySelector('.print-page-logos');
    h.insertBefore(box, logos || null);
  });
  return 'ok';
}"""

PIED_LIVRET = "mathsgo.re/splat · CC BY-NC-SA 4.0"
PIED_CORRECTION = PIED_LIVRET + " · correction"
# Un titre trop long pour une ligne se coupe APRÈS le tiret (comme l'Enquête).
JS_TITRE = """() => {
  const st = document.querySelectorAll('.printArea .print-page-subtitle');
  if (!st.length) return 'pas de titre';
  st.forEach(e => {
    const t = e.textContent, i = t.indexOf(' — ');
    e.style.whiteSpace = 'nowrap';
    const bloc = e.parentElement;
    const trop = bloc.scrollWidth > bloc.clientWidth + 1;
    e.style.whiteSpace = '';
    if (trop && i > 0) {
      const corr = t.endsWith(' — Correction') ? ' — Correction' : '';
      const tete = t.slice(0, i) + (corr || ' —');
      const suite = t.slice(i + 3, t.length - corr.length).replace(/(\\d) /g, '$1\\u00a0');
      e.textContent = ''; e.append(tete); e.appendChild(document.createElement('br')); e.append(suite);
      const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.12;
      const f0 = parseFloat(getComputedStyle(e).fontSize);
      for (let k = 1; k <= 4 && e.getBoundingClientRect().height > 2.4 * lh * (1 - 0.05 * (k - 1)); k++)
        e.style.fontSize = (f0 * (1 - 0.05 * k)) + 'px';
    }
  });
  return 'ok';
}"""

JS_PIED = """(texte) => {
  const f = document.querySelectorAll('.printArea .print-page-footer');
  if (!f.length) return 'pas de pied de page';
  f.forEach(e => { e.textContent = texte; });
  return 'ok';
}"""

# La feuille imprimée telle que l'outil la fabrique, et ses cartes : total, valeurs de chaque
# couleur, plateaux (pour vérifier que l'élève et les deux corrigés ont les mêmes cartes).
JS_FICHE = """() => {
  printSheet();
  return {cartes: cards.map(c => [c.total, JSON.stringify(c.hidden.slice().sort((a, b) => a - b)),
                                  JSON.stringify(c._sys.boards.map(b => [c._sys.colors.map(k => b.counts[k] || 0), b.total, b.visible || []]))]),
          gestes: cards.map(c => c._sys.geste),
          feuilles: document.querySelectorAll('.printArea .sheet').length, parPage: getPrintCardsPerPage()};
}"""

# ---------------------------------------------------------------------------
# LES CORRIGÉS (pour tous) : 4 par page (8 pages, comme l'élève) et 2 par page (12 pages).
CORRECTIONS = [
    dict(suffixe="_correction", layout=4, lettre=False, dit="4 cartes par page"),
    dict(suffixe="_correction_2_par_page", layout=2, lettre=False, dit="2 cartes par page, en plus gros"),
    # 25/09/2026 (demande de Gwenaël) : les mêmes corrigés « en lettres », comme l'appli les écrit
    # avec unknown=letter — l'initiale de chaque couleur (2 × N + 3 × B = 54 ; B = 24 ÷ 3 = 8) :
    # deux inconnues, donc deux lettres, pas un 𝑥. Mêmes graines, mêmes cartes (vérifié au rendu).
    dict(suffixe="_correction_lettre", layout=4, lettre=True, dit="en lettres, 4 cartes par page"),
    dict(suffixe="_correction_lettre_2_par_page", layout=2, lettre=True, dit="en lettres, 2 cartes par page"),
]
PROF = dict(bandeau="Correction", ligne="Livret corrigé")
CSS_PROF = """
.bandeau-prof{flex:0 0 14mm;box-sizing:border-box;padding-top:4mm;display:flex;align-items:center;justify-content:center;
  background:#b91c1c;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:3px}
.ident .champ.prof{flex:1;padding:1.2mm 4mm;text-align:center;line-height:1.2}
.ident .champ.prof span{font-size:17px;color:#7c2d12}
.ident .champ.prof small{font-size:12.5px;font-weight:700;color:#475569;margin-left:2.5mm}
.ident .champ.prof small::before{content:"— "}
"""

# L'exemple : la carte (ses plateaux, comme sur la fiche) et les cadres de la correction de
# l'outil, un par étape, dessinés par drawSysCadre au profil d'impression, sans numéro (le
# numéro est dans la pastille de la page). Les couleurs var(--…) de l'outil sont résolues.
JS_EXEMPLE = r"""() => {
  const NS = 'http://www.w3.org/2000/svg', card = cards[0];
  if (!card || !card._sys || !Array.isArray(card._sys.plan)) return {erreur: 'pas une carte du Système'};
  const mkEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const mkText = (x, y, t, a = {}) => { const e = mkEl('text', {x, y, ...a}); e.textContent = t; return e; };
  const mk = () => { const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 1600 2200');
    sv.setAttribute('width', '1600'); sv.setAttribute('height', '2200'); document.body.appendChild(sv); return sv; };
  const sc = mk(); renderCardIntoSvg(sc, card, 'statement');
  const fond = sc.querySelector('rect'); if (fond && fond.getAttribute('width') === '1600') fond.remove();
  const bb = sc.getBBox();
  const carte = {svg: sc.innerHTML, vb: [Math.floor(bb.x) - 16, Math.floor(bb.y) - 16, Math.ceil(bb.width) + 32, Math.ceil(bb.height) + 32].join(' ')};
  sc.remove();
  const mesures = sysCorrMesures(card);
  const ctx = {mkEl, mkText, isPrint: true, lettres: false, C: mesures.C};
  const cadres = card._sys.plan.map(e => {
    const sv = mk(); const g = mkEl('g'); sv.appendChild(g);
    const h = drawSysCadre(g, card, e, 0, mesures, ctx, 0);
    const r = {svg: sv.innerHTML, h, role: e.role, titre: e.titre}; sv.remove(); return r;
  });
  const cs = getComputedStyle(document.body);
  const inconnues = new Set();
  const resout = s => s.replace(/var\((--[\w-]+)\)/g, (m, n) => { const v = cs.getPropertyValue(n).trim(); if (!v) inconnues.add(n); return v || m; });
  carte.svg = resout(carte.svg); cadres.forEach(c => { c.svg = resout(c.svg); });
  if (inconnues.size) return {erreur: 'variables de couleur inconnues : ' + [...inconnues].join(', ')};
  const s = card._sys, mot = k => investigateColorWord(investigateColorByKey(k));
  return {carte, cadres, geste: s.geste, total: card.total, visibles: card.visible,
          couleurs: s.colors.map(k => ({k, mot: mot(k), pluriel: SYS_COULEURS_PLURIEL[k], valeur: s.values[k]})),
          plateaux: s.boards.map(b => ({counts: s.colors.map(k => b.counts[k] || 0), total: b.total})),
          cle: [card.total, JSON.stringify(card.hidden.slice().sort((a, b) => a - b)),
                JSON.stringify(s.boards.map(b => [s.colors.map(k => b.counts[k] || 0), b.total, b.visible || []]))]};
}"""

JS_COUV = """(d) => {
  const set = (sel, svg, vb) => { const e = document.querySelector(sel); if (!e) return false; e.innerHTML = svg; if (vb) e.setAttribute('viewBox', vb); return true; };
  if (!set('svg.ex-carte', d.carte, d.vbCarte)) return 'pas de place pour la carte';
  if (!set('svg.ex-vide', d.premier, d.vbPremier)) return 'pas de place pour le premier cadre';
  const txt = (sel, html) => { const e = document.querySelector(sel); if (!e) return false; e.innerHTML = html; return true; };
  if (!txt('.tete .sur', d.sur) || !txt('.tete h1 span', d.titre) || !txt('.tete .accroche', d.accroche) || !txt('.expl .intro', d.intro)) return 'textes de couverture';
  const h = document.querySelector('.tete h1 span').getBoundingClientRect(), hero = document.querySelector('.tete .hero').getBoundingClientRect();
  if (h.height > 60) return 'titre sur deux lignes : ' + d.titre;
  const mots = document.createRange(); mots.selectNodeContents(document.querySelector('.tete h1 span'));
  if (mots.getBoundingClientRect().right > hero.left - 4) return 'le titre touche le dessin : ' + d.titre;
  const li = document.querySelectorAll('.som ol li');
  if (li.length !== d.sommaire.length) return 'sommaire : ' + li.length + ' lignes';
  d.sommaire.forEach((t, i) => {
    li[i].querySelector('.badge b').textContent = t[0];
    li[i].querySelectorAll('span')[1].innerHTML = t[1] + '<em>' + t[2] + '</em>';
  });
  if (d.prof) {
    const id = document.querySelector('.ident');
    if (!id) return 'pas de ligne Nom, prénom / Classe';
    document.body.insertAdjacentHTML('afterbegin', '<div class="bandeau-prof">' + d.prof.bandeau + '</div>');
    id.innerHTML = '<div class="champ prof"><span>' + d.prof.ligne + '</span><small>' + d.prof.dit + '</small></div>';
  }
  // rien ne déborde de la page (la couverture a une hauteur fixe)
  const pied = document.querySelector('.pied').getBoundingClientRect();
  if (pied.bottom > document.body.getBoundingClientRect().bottom + 0.5) return 'la couverture déborde';
  return 'ok';
}"""

JS_PAGE_EXEMPLE = """(d) => {
  const c = document.querySelector('svg.ex-carte'); if (!c) return 'pas de place pour la carte';
  c.innerHTML = d.carte; c.setAttribute('viewBox', d.vbCarte);
  const e = document.querySelector('.enquete'); if (!e) return 'pas de bloc enquête'; e.innerHTML = d.enquete;
  const ol = document.querySelector('.etapes'); if (!ol) return 'pas de liste des étapes';
  ol.innerHTML = d.etapes.map((et, i) =>
    '<li class="et"><span class="badge"><svg viewBox="2 5 106 105" fill="#7c2d12"><use href="#tacheBadge"/></svg><b>' + (i + 1) + '</b></span>' +
    '<div class="txt"><h3>' + et.h3 + '</h3><p class="leg">' + et.leg + '</p></div>' +
    '<svg class="dessin" viewBox="40 -8 1520 ' + (et.h + 16) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + et.titre + '">' + et.svg + '</svg></li>').join('');
  const f = document.querySelector('.fin'); if (!f) return 'pas de conclusion'; f.innerHTML = d.fin;
  const pied = document.querySelector('.pied').getBoundingClientRect(), a = document.querySelector('.atoi').getBoundingClientRect();
  if (a.bottom > pied.top - 1) return 'la page 2 déborde sur le pied';
  return 'ok';
}"""

JS_DOS = """(d) => {
  const box = document.querySelector('.niveaux');
  if (!box) return 'pas de bloc niveaux';
  box.innerHTML = d.niveaux.map(n =>
     '<div class="niv"><img src="' + n[2] + '" alt=""><span class="n">' + n[0] +
     '</span><span class="d">' + n[1] + '</span></div>').join('');
  const u = document.querySelector('.suite img'); if (u) u.setAttribute('src', d.univers);
  const s = document.querySelector('.suite p.t'); if (!s) return 'pas de texte « suite »'; s.innerHTML = d.suite;
  const c = document.querySelectorAll('.prog .g .c');
  if (c.length !== d.fiches.length) return 'Mes fiches : ' + c.length + ' cases';
  d.fiches.forEach((t, i) => {
    c[i].querySelector('.badge b').textContent = t[0];
    c[i].querySelector('.ti').innerHTML = t[1];
  });
  // 25/09/2026 : l'élève a « Pour se souvenir » ; le tableau des systèmes du collège (pour les
  // profs) n'est qu'au dos des corrigés
  const lex = document.querySelector('.lex'), syst = document.querySelector('.syst');
  if (!lex || !syst) return 'pas de bloc « Pour se souvenir » ou « systèmes »';
  if (d.tableau) lex.remove();
  else {
    syst.remove();
    const m = document.querySelector('.mini-sch'), t = document.querySelector('.lex .pr');
    if (!m || !t) return 'pas de mini-schéma';
    m.innerHTML = d.mini.map(r => '<span class="r"><em>' + r[0] + '</em>' +
      '<span class="q">?</span>'.repeat(r[1]) + (r[2] ? '<span class="reste" style="width:calc(' + r[2] + ' * 6.2mm - ' + (r[2] - 1) + ' * 1.3px)">reste</span>' : '') + '</span>').join('');
    t.innerHTML = d.souvenir;
    // un vrai schéma en barres : toutes les cases « ? » de la même largeur, les barres partent du
    // même bord, les cases d'une barre se touchent, la case « reste » couvre exactement les cases
    // du plateau qui dépassent
    const rows = [...m.querySelectorAll('.r')].map(r => [...r.querySelectorAll('span')].map(e => e.getBoundingClientRect()));
    const qs = [...m.querySelectorAll('.q')].map(e => e.getBoundingClientRect());
    if (qs.some(b => Math.abs(b.width - qs[0].width) > 0.3)) return 'mini-schéma : des cases « ? » de largeurs différentes';
    if (rows.some(r => Math.abs(r[0].left - rows[0][0].left) > 0.3)) return 'mini-schéma : les barres ne partent pas du même bord';
    for (const r of rows) for (let i = 1; i < r.length; i++)
      if (Math.abs(r[i].left - (r[i - 1].right - 1.3)) > 0.3) return 'mini-schéma : des cases ne se touchent pas';
    if (Math.abs(rows[1][rows[1].length - 1].right - rows[0][rows[0].length - 1].right) > 0.4) return 'mini-schéma : « reste » ne finit pas avec le plateau';
  }
  // les lignes du tableau de CE livret en gras (fiches 25-29 ou 30-34)
  document.querySelectorAll('.syst tbody tr').forEach(tr => {
    const m = tr.children[1].textContent.match(/Système, fiches? (\\d+)(?: et (\\d+))?/);
    tr.classList.toggle('ici', !!m && d.fiches.some(f => f[0] === +m[1] || (m[2] && f[0] === +m[2])));
  });
  const pied = document.querySelector('.pied').getBoundingClientRect(), cr = document.querySelector('.credits').getBoundingClientRect();
  if (cr.bottom > pied.top + 0.5) return 'le dos déborde sur le pied';
  return 'ok';
}"""

# Les légendes de la page 2, par étape (le rôle du cadre dans le plan de l'outil) et par geste.
# Elles disent CE QU'ON FAIT, sans nombre : les nombres sont dans les cadres, dessinés par l'outil.
ETAPES = {
    "PARTIELLE": {
        "plateau": ("Je dessine le plateau", "Une barre pour le plateau entier&nbsp;: une case par tache, toutes de la même largeur, et son total."),
        "indice": ("Je place l'indice", "L'indice est un 2e plateau, fait de taches du 1er. Je le place dessous, aligné à gauche&nbsp;: ce qui dépasse, c'est <b>ce qui reste</b>."),
        "reste": ("Ce qui reste", "Il vaut la différence des deux totaux. Ce sont des taches d'une seule couleur&nbsp;: je partage."),
        "indice-seul": ("Je reviens à l'indice", "Il n'a qu'une couleur&nbsp;: je partage son total."),
        "verification": ("Je vérifie", "Je remets les nombres trouvés sur chaque plateau&nbsp;: chaque total doit tomber juste."),
    },
    "DOUBLE": {
        "plateau": ("Je dessine le plateau", "Une barre pour le plateau entier&nbsp;: une case par tache, toutes de la même largeur, et son total."),
        "double": ("Je double l'indice", "L'indice n'a qu'une tache de chaque couleur&nbsp;: deux fois l'indice, c'est deux fois son total."),
        "reste": ("Je compare au plateau", "L'indice doublé est dans le plateau&nbsp;: ce qui dépasse vaut la différence des totaux. Je partage."),
        "indice-retire": ("Je reviens à l'indice", "Je retire la tache que je connais&nbsp;: il reste l'autre."),
        "verification": ("Je vérifie", "Je remets les nombres trouvés sur chaque plateau&nbsp;: chaque total doit tomber juste."),
    },
}
MOTS = {1: "une", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six"}

def decrit(counts, couleurs):
    """« 2 taches noires et 3 taches bleues » ; « la tache noire » pour une seule tache."""
    parts = []
    for n, c in zip(counts, couleurs):
        if n == 0:
            continue
        parts.append(f"{MOTS[n]} tache {c['mot']}" if n == 1 else f"{MOTS[n]} taches {c['pluriel']}")
    return " et ".join([", ".join(parts[:-1]), parts[-1]]) if len(parts) > 1 else parts[0]

def textes_exemple(ex, geste):
    """Les textes de la couverture et de la page 2, écrits à partir de la carte rendue."""
    if ex["geste"] != geste:
        raise SystemExit(f"l'exemple devait être un geste {geste}, pas {ex['geste']}")
    if ex["visibles"] or len(ex["plateaux"]) != 2 or len(ex["couleurs"]) != 2:
        raise SystemExit("l'exemple : deux plateaux, deux couleurs, sans jeton visible")
    roles = [c["role"] for c in ex["cadres"]]
    leg = ETAPES[geste]
    if set(roles) - set(leg):
        raise SystemExit(f"l'exemple : des étapes sans légende {set(roles) - set(leg)}")
    P, I = ex["plateaux"]
    C = ex["couleurs"]
    intro = (f"Sur cette carte, deux plateaux, un total pour chacun. Le premier&nbsp;: {decrit(P['counts'], C)}, "
             f"{P['total']} jetons en tout. Le second&nbsp;: {decrit(I['counts'], C)}, {I['total']} jetons. "
             "Une couleur cache partout le même nombre de jetons."
             "\n      <span>Pour mener l'enquête, on dessine chaque plateau en <b>barre</b>&nbsp;: une case par "
             "tache, toutes de la même largeur. Puis on <b>compare</b> les barres. La page&nbsp;2 mène cette "
             "enquête pas à pas, jusqu'à la réponse.</span>")
    enquete = (f"<p><b>Le 1er plateau</b>&nbsp;: {decrit(P['counts'], C)}, TOTAL {P['total']}.</p>"
               f"<p><b>Le 2e plateau</b>&nbsp;: {decrit(I['counts'], C)}, TOTAL {I['total']}.</p>"
               "<p>Une couleur cache partout le même nombre de jetons.</p>"
               "<p class=\"but\">Mon enquête&nbsp;: trouver ce que cache chaque couleur.</p>")
    etapes = [dict(h3=leg[c["role"]][0], leg=leg[c["role"]][1], svg=c["svg"], h=c["h"], titre=c["titre"]) for c in ex["cadres"]]
    # la conclusion : les valeurs, puis la vérification des deux plateaux
    def somme(counts):
        return " + ".join(f"{n} × {c['valeur']}" if n > 1 else f"{c['valeur']}" for n, c in zip(counts, C) if n)
    for pl in (P, I):
        assert sum(n * c["valeur"] for n, c in zip(pl["counts"], C)) == pl["total"]
    fin = (" et ".join(f"la tache {c['mot']} cache <b>{c['valeur']}</b> jetons" for c in C).capitalize() +
           f". Je vérifie&nbsp;: {somme(P['counts'])} = {P['total']} et {somme(I['counts'])} = {I['total']}.")
    return dict(intro=intro, enquete=enquete, etapes=etapes, fin=fin)


def fabrique_qr():
    """(Re)fabrique tous les QR codes. À relancer si une adresse ou une série change."""
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
    dossier = ICI / "qr"
    dossier.mkdir(parents=True, exist_ok=True)
    def ecrire(url, nom):
        q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
        q.add_data(url); q.make(fit=True)
        q.make_image(fill_color="black", back_color="white").save(dossier / nom)
    for niv in LIVRETS.values():
        for f in niv["fiches"]:
            ecrire(lien_fiche(f["code"]), f"fiche{f['code']}.png")
    for s in SERIES:
        ecrire(lien_serie(s), f"serie-{s}.png")
    ecrire(LIEN_UNIVERS, "univers.png")

def serveur():
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    h = functools.partial(Silencieux, directory=str(RACINE))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

async def rendre(niv, tmp, corr=None):
    """corr : None pour le livret de l'élève, sinon un élément de CORRECTIONS."""
    from playwright.async_api import async_playwright
    base = f"http://127.0.0.1:{PORT}"
    qrweb = f"{BASE_WEB}/qr"
    cles = {}
    fichiers = []
    async with async_playwright() as p:
        nav = await p.chromium.launch(channel="chromium")

        async def page_outil(query):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(f"{base}/outils/splat.html?{query}", wait_until="networkidle")
            await pg.wait_for_timeout(800)
            return pg

        pg = await page_outil(niv["exemple"]["query"] + "&print=statement")
        ex = await pg.evaluate(JS_EXEMPLE)
        await pg.close()
        if "erreur" in ex:
            raise SystemExit(f"exemple du livret « {niv['sortie']} » : {ex['erreur']}")
        textes = textes_exemple(ex, niv["exemple"]["geste"])
        print(f"   exemple : {ex['geste']}, " + ", ".join(f"{c['mot']} {c['valeur']}" for c in ex["couleurs"]) +
              " — plateaux " + " ; ".join(str(p['total']) for p in ex["plateaux"]))

        async def pdf_html(url, sortie, js=None, donnees=None, css=()):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(url, wait_until="networkidle")
            await pg.wait_for_timeout(1200)
            for c in css:
                if c:
                    await pg.add_style_tag(content=c)
            if js:
                r = await pg.evaluate(js, donnees)
                if r != "ok":
                    raise SystemExit(f"{url} : {r}")
            await pg.wait_for_timeout(400)
            await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        async def pdf_fiche(f, sortie):
            titre = f"Fiche {f['n']} — {f['t'].replace('&nbsp;', chr(160))}"
            titre_url = titre.replace(chr(160), " ")
            layout = corr["layout"] if corr else 4
            q = f["q"] + SYS_COMMUN + f"&layout={layout}"
            if corr and corr["lettre"]:
                q = q.replace("unknown=question", "unknown=letter")
            q += f"&title={quote(titre_url)}&print={'correction' if corr else 'statement'}"
            pg = await page_outil(q)
            etat = await pg.evaluate(JS_FICHE)
            if etat["parPage"] != layout:
                raise SystemExit(f"{titre} : {etat['parPage']} cartes par page au lieu de {layout}")
            attendu = 4 // layout
            if etat["feuilles"] != attendu or len(etat["cartes"]) != 4:
                raise SystemExit(f"{titre} : {etat['feuilles']} feuilles, {len(etat['cartes'])} cartes")
            cles[titre_url] = etat["cartes"]
            await pg.add_style_tag(content=CSS_QR)
            r = await pg.evaluate(JS_QR, [f"{qrweb}/fiche{f['code']}.png", QR_CORR if corr else QR_ELEVE])
            if r != "ok":
                raise SystemExit(f"{titre}, QR : {r}")
            await pg.set_viewport_size({"width": 733, "height": 1062})
            await pg.emulate_media(media="print")
            r = await pg.evaluate(JS_TITRE)
            if r != "ok":
                raise SystemExit(f"{titre}, titre : {r}")
            r = await pg.evaluate(JS_PIED, PIED_CORRECTION if corr else PIED_LIVRET)
            if r != "ok":
                raise SystemExit(f"{titre}, pied : {r}")
            await pg.wait_for_timeout(600)
            await pg.pdf(path=str(sortie), format="A4", print_background=True, prefer_css_page_size=True)
            await pg.close()
            print(f"   {titre}")

        if corr and corr["layout"] == 2:
            for i, f in enumerate(niv["fiches"]):
                await pdf_fiche(f, tmp / f"fiche{i}.pdf")
                fichiers.append(tmp / f"fiche{i}.pdf")
            await nav.close()
            return ex["cle"], cles, fichiers

        cad = ex["cadres"]
        couv = dict(carte=ex["carte"]["svg"], vbCarte=ex["carte"]["vb"], premier=cad[0]["svg"], vbPremier=f"40 -8 1520 {cad[0]['h'] + 16}",
                    sur=niv["couv"]["sur"], titre=niv["couv"]["titre"], accroche=niv["couv"]["accroche"], intro=textes["intro"],
                    sommaire=[[f["n"], f["t"], f["resume"]] for f in niv["fiches"]],
                    prof=dict(PROF, dit=corr["dit"]) if corr else None)
        await pdf_html(f"{base}{BASE_WEB}/couverture.html", tmp / "couverture.pdf", JS_COUV, couv,
                       css=[CSS_PROF if corr else None])
        fichiers.append(tmp / "couverture.pdf")
        await pdf_html(f"{base}{BASE_WEB}/exemple.html", tmp / "exemple.pdf", JS_PAGE_EXEMPLE,
                       dict(carte=ex["carte"]["svg"], vbCarte=ex["carte"]["vb"], etapes=textes["etapes"],
                            enquete=textes["enquete"], fin=textes["fin"]))
        fichiers.append(tmp / "exemple.pdf")
        for i, f in enumerate(niv["fiches"]):
            await pdf_fiche(f, tmp / f"fiche{i}.pdf")
            fichiers.append(tmp / f"fiche{i}.pdf")
        d = niv["dos"]
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/serie-{s}.png"] for nom, desc, s in d["series"]],
                   univers=f"{qrweb}/univers.png", suite=d["suite"],
                   fiches=[[f["n"], f["t"]] for f in niv["fiches"]],
                   tableau=bool(corr), mini=d["souvenir"]["mini"], souvenir=d["souvenir"]["texte"])
        await pdf_html(f"{base}{BASE_WEB}/dos.html", tmp / "dos.pdf", JS_DOS, dos)
        fichiers.append(tmp / "dos.pdf")
        await nav.close()
    return ex["cle"], cles, fichiers

def assemble_feuilles(fichiers, sortie):
    """Le corrigé 2 par page : les pages de l'outil telles quelles (A4 paysage), à la suite."""
    import pikepdf
    doc = pikepdf.Pdf.new()
    src = []
    for f in fichiers:
        d = pikepdf.open(str(f)); src.append(d)
        doc.pages.extend(d.pages)
    for p in doc.pages:
        w, h = float(p.mediabox[2]), float(p.mediabox[3])
        if not w > h:
            raise SystemExit(f"{sortie} : une page n'est pas en paysage ({w:.0f} × {h:.0f})")
    doc.save(str(RACINE / "outils" / f"{sortie}.pdf"))
    n = len(doc.pages)
    for d in src:
        d.close()
    return n

def assemble(fichiers, sortie):
    """Assemble les 8 pages, puis impose les 2 feuilles A3 (pikepdf + add_overlay : les
    dégradés suivent, ce qu'une simple translation de contenu ne fait pas)."""
    import pikepdf
    A4W, A4H = 595.276, 841.890
    src, pages = [], []
    for f in fichiers:
        d = pikepdf.open(str(f))
        if len(d.pages) != 1:
            raise SystemExit(f"{f.name} : {len(d.pages)} pages au lieu d'une")
        src.append(d); pages.extend(d.pages)
    if len(pages) != 8:
        raise SystemExit(f"{len(pages)} pages au lieu de 8")
    livret = pikepdf.Pdf.new()
    for p in pages:
        page = livret.add_blank_page(page_size=(A4W, A4H))
        pikepdf.Page(page).add_overlay(p, pikepdf.Rectangle(0, 0, A4W, A4H))
    livret.save(str(RACINE / "outils" / f"{sortie}.pdf"))
    a3 = pikepdf.Pdf.new()
    for g, d in [(8, 1), (2, 7), (6, 3), (4, 5)]:   # imposition d'un cahier de 8 pages
        feuille = a3.add_blank_page(page_size=(2 * A4W, A4H))
        for idx, tx in ((g, 0.0), (d, A4W)):
            pikepdf.Page(feuille).add_overlay(pages[idx - 1], pikepdf.Rectangle(tx, 0, tx + A4W, A4H))
    a3.save(str(RACINE / "outils" / f"{sortie}_a_plier.pdf"))
    for s in src:
        s.close()
    return len(pages)

def compresse(chemin):
    import shutil, subprocess
    if not shutil.which("qpdf"):
        return
    tmp = chemin.with_suffix(".qpdf.pdf")
    r = subprocess.run(["qpdf", "--object-streams=generate", "--compress-streams=y",
                        "--recompress-flate", "--compression-level=9", str(chemin), str(tmp)])
    if r.returncode in (0, 3) and tmp.exists():
        tmp.replace(chemin)

CARTES_JSON = ICI / "cartes.json"

def ecrire_cartes(nom, cle_ex, reference):
    """cartes.json : pour chaque livret, l'exemple et les 20 cartes des fiches — total, valeurs
    triées, plateaux (nombre de taches de chaque couleur, total, jetons visibles)."""
    tout = json.loads(CARTES_JSON.read_text(encoding="utf-8")) if CARTES_JSON.exists() else {}
    tout[nom] = {"exemple": [cle_ex[0], json.loads(cle_ex[1]), json.loads(cle_ex[2])],
                 "fiches": {t: [[c[0], json.loads(c[1]), json.loads(c[2])] for c in v] for t, v in reference.items()}}
    j = lambda x: json.dumps(x, ensure_ascii=False, separators=(", ", ": "))
    lignes = ["{"]
    for i, (n, c) in enumerate(sorted(tout.items())):
        lignes.append(f' {j(n)}: {{"exemple": {j(c["exemple"])}, "fiches": {{')
        fs = list(c["fiches"].items())
        for k, (t, v) in enumerate(fs):
            lignes.append(f'  {j(t)}: [')
            for m, carte in enumerate(v):
                lignes.append(f'   {j(carte)}' + ("," if m < len(v) - 1 else ""))
            lignes.append("  ]" + ("," if k < len(fs) - 1 else ""))
        lignes.append(" }}" + ("," if i < len(tout) - 1 else ""))
    lignes.append("}")
    CARTES_JSON.write_text("\n".join(lignes) + "\n", encoding="utf-8")

def controle_global():
    """Sur les deux livrets : aucun exemple n'est une carte d'une fiche (mêmes plateaux, mêmes
    valeurs), et les deux exemples sont différents."""
    tout = json.loads(CARTES_JSON.read_text(encoding="utf-8"))
    cle = lambda c: json.dumps([c[0], sorted(c[1]), c[2]])
    cartes = {cle(k) for c in tout.values() for cs in c["fiches"].values() for k in cs}
    for nom, c in tout.items():
        if cle(c["exemple"]) in cartes:
            raise SystemExit(f"l'exemple du livret « {nom} » est une carte des fiches")
    exs = [cle(c["exemple"]) for c in tout.values()]
    if len(set(exs)) != len(exs):
        raise SystemExit("deux livrets ont le même exemple")

def main():
    import tempfile
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    demandes = args or list(LIVRETS)
    inconnu = [a for a in demandes if a not in LIVRETS]
    if inconnu:
        raise SystemExit(f"livret inconnu : {', '.join(inconnu)} (au choix : {', '.join(LIVRETS)})")
    if "--eleve" in sys.argv and "--correction" in sys.argv:
        raise SystemExit("--eleve et --correction s'excluent (sans option : tous)")
    versions = [None] + CORRECTIONS
    if "--eleve" in sys.argv:
        versions = [None]
    if "--correction" in sys.argv:
        versions = CORRECTIONS
    if "--qr" in sys.argv:
        fabrique_qr(); print("QR codes régénérés.")
    srv = serveur()
    try:
        for nom in demandes:
            niv = LIVRETS[nom]
            print(f"— livret « {nom} »")
            reference = None
            for corr in versions:
                sortie = niv["sortie"] + (corr["suffixe"] if corr else "")
                with tempfile.TemporaryDirectory() as d:
                    tmp = Path(d)
                    cle_ex, cles, fichiers = asyncio.run(rendre(niv, tmp, corr))
                    deux = bool(corr and corr["layout"] == 2)
                    n = assemble_feuilles(fichiers, sortie) if deux else assemble(fichiers, sortie)
                attendu = 10 if deux else 8
                if n != attendu:
                    raise SystemExit(f"{sortie} : {n} pages au lieu de {attendu}")
                vues = {t.replace(" — Correction", ""): v for t, v in cles.items()}
                if reference is None:
                    reference = vues
                elif vues != reference:
                    raise SystemExit(f"{sortie} : les cartes diffèrent du livret de l'élève")
                for s in (("",) if deux else ("", "_a_plier")):
                    compresse(RACINE / "outils" / f"{sortie}{s}.pdf")
                print(f"   Fait : outils/{sortie}.pdf ({n} pages)" + ("" if deux else f" et outils/{sortie}_a_plier.pdf"))
            if any(cle_ex == c for v in reference.values() for c in v):
                raise SystemExit(f"l'exemple du livret « {nom} » est une carte du livret")
            ecrire_cartes(nom, cle_ex, reference)
        controle_global()
    finally:
        srv.shutdown()

if __name__ == "__main__":
    main()
