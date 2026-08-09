#!/usr/bin/env python3
"""Génère le HTML imprimable « Chat, c'est toi le chat ! »."""
import base64
import json
import re
from pathlib import Path

from game import ROWS, COLS, grid_of, solve

HERE = Path(__file__).resolve().parent
SITE_ROOT = HERE.parents[1]
OUT_DIR = HERE / "out"
SERIES_FILE = HERE / "series20.json"
LOGO_FILE = SITE_ROOT / "assets" / "img" / "mathsgo-logo-780.png"
FAVICON_FILE = SITE_ROOT / "favicon.svg"

LOGO = base64.b64encode(LOGO_FILE.read_bytes()).decode()

NAVY, TEAL, ORANGE, RED, CREAM = "#1f3a68", "#2aa79b", "#f28c28", "#d1495b", "#faf6ee"

LEVELS = {
    1: ("Découverte", TEAL, "Beaucoup d'indices positifs : on apprend à lire sa carte et à se placer."),
    2: ("Cartes complètes", NAVY, "Chaque carte montre les 4 places voisines : devant, derrière, à gauche, à droite."),
    3: ("Cartes partielles", ORANGE, "Chaque carte ne dit pas tout : il faut échanger pour se placer."),
    4: ("Expertes", RED, "Très peu d'indices et un seul placement possible : il faut croiser les informations du groupe."),
}

favicon = FAVICON_FILE.read_text(encoding="utf-8")
M_BADGE = '<svg class="mbadge" viewBox="0 0 100 100">' + re.search(r"<rect.*</g>", favicon, re.S).group(0) + "</svg>"
M_FAV = favicon.replace('<svg ', '<svg class="mmark" ', 1)
FOOTER = f'<footer><span class="fline">{M_FAV} Chat, c\'est toi le chat&nbsp;! · mathsgo.re</span></footer>'

# ---------------------------------------------------------------- chat SVG (style A)
def cat_svg(size=100, crossed=False):
    x = ""
    if crossed:
        x = f'''<line x1="8" y1="16" x2="92" y2="104" stroke="{RED}" stroke-width="10" stroke-linecap="round"/>
                <line x1="92" y1="16" x2="8" y2="104" stroke="{RED}" stroke-width="10" stroke-linecap="round"/>'''
    return f'''<svg width="{size}" height="{size*1.12}" viewBox="0 0 100 112">
  <path d="M78 88 C 96 82, 98 60, 88 52 C 84 66, 78 70, 74 74 Z" fill="#e0813f"/>
  <ellipse cx="50" cy="72" rx="30" ry="34" fill="#f09a52"/>
  <path d="M28 78 q 22 -10 44 0 l -2 8 q -20 -9 -40 0 Z" fill="#d9743a" opacity=".85"/>
  <path d="M26 62 q 24 -10 48 0 l -2 8 q -22 -9 -44 0 Z" fill="#d9743a" opacity=".85"/>
  <ellipse cx="34" cy="102" rx="9" ry="7" fill="#f09a52"/>
  <ellipse cx="66" cy="102" rx="9" ry="7" fill="#f09a52"/>
  <circle cx="50" cy="30" r="22" fill="#f09a52"/>
  <path d="M31 18 L 27 2 L 43 9 Z" fill="#f09a52"/>
  <path d="M69 18 L 73 2 L 57 9 Z" fill="#f09a52"/>
  <path d="M33 15 L 31 6 L 40 10 Z" fill="#e8b28d"/>
  <path d="M67 15 L 69 6 L 60 10 Z" fill="#e8b28d"/>
  <path d="M42 14 q 8 -6 16 0" stroke="#d9743a" stroke-width="3" fill="none" stroke-linecap="round"/>
  {x}
</svg>'''

# ---------------------------------------------------------------- carte de jeu
def card_html(num, cons, cat_px=95, extra_class=""):
    def slot(name, content):
        return f'<div class="slot {name}">{content}</div>'
    cells = [slot("center you", cat_svg(cat_px))]
    for d in ("front", "left", "right", "back"):
        if d in cons:
            pos = {"front": "top", "back": "bottom", "left": "left", "right": "right"}[d]
            cells.append(slot(pos, cat_svg(cat_px, crossed=(cons[d] == "X"))))
    brand = "" if extra_class else f'<div class="cardnum">{M_BADGE}{num}</div><div class="cardurl">mathsgo.re</div>'
    brand = brand or f'<div class="cardnum">{num}</div>'
    return f'<div class="card {extra_class}">{brand}{"".join(cells)}</div>'

# ---------------------------------------------------------------- mini-grille solution
def sol_grid(grid, cell=31, series=None):
    rows = []
    for r in range(ROWS):
        tds = []
        for c in range(COLS):
            v = grid[r][c]
            tds.append(f'<div class="hoop" style="width:{cell}px;height:{cell}px">{v if v else ""}</div>')
        rows.append(f'<div class="hooprow">{"".join(tds)}</div>')
    encoded = "/".join("".join(str(value) for value in row) for row in grid)
    series_attr = f' data-series="{series}"' if series is not None else ""
    return f'<div class="solgrid" data-grid="{encoded}"{series_attr}>{"".join(rows)}</div>'

# ---------------------------------------------------------------- pages
def serie_page(s):
    num, lvl = s["num"], s["level"]
    lname, lcolor, ldesc = LEVELS[lvl]
    cards = "".join(card_html(f"{num}.{p}", s["cards"][p]) for p in ("1", "2", "3", "4"))
    return f'''<section class="page">
  <div class="pagehead" style="border-color:{lcolor}"><h2>Série {num}</h2>
    <span class="lvlbadge" style="background:{lcolor}">Niveau {lvl} · {lname}</span></div>
  <div class="lvldesc">{ldesc} · {"Un seul placement correct." if s["n_sols"] == 1 else str(s["n_sols"]) + " placements corrects (voir solutions)."}</div>
  <div class="cardgrid">{cards}</div>
  <div class="cutnote">✂ Découper les 4 cartes le long des traits. Une carte par enfant.</div>
</section>'''

def rule_page():
    hoops = ""
    cats_at = {(0, 0), (0, 1), (1, 1), (1, 2)}
    for r in range(2):
        for c in range(3):
            cat = f'<div class="dcat">{cat_svg(34)}</div>' if (r, c) in cats_at else ""
            hoops += f'<div class="dhoop" style="left:{30+c*74}px;top:{40+r*74}px">{cat}</div>'
    diagram = f'''<div class="diagram">
      <div class="arrow">DEVANT ⟶ tout le monde regarde par ici</div>
      <div class="dzone">{hoops}</div></div>'''
    ex_card = card_html("EX", {"front": "P", "right": "X"}, cat_px=52, extra_class="excard")
    niveaux = "".join(
        f'<li><b style="color:{c}">Niveau {l} · {n}</b> - {d}</li>'
        for l, (n, c, d) in LEVELS.items())
    return f'''<section class="page">
  <div class="titleband">
    <img class="logo" src="data:image/png;base64,{LOGO}">
    <h1>Chat, c'est toi le chat&nbsp;!</h1>
    <p class="subtitle">Un jeu de positionnement dans l'espace et de communication · GS-CP, adaptable en MS avec accompagnement
    <br>d'après une situation de « Un rallye mathématique à l'école maternelle&nbsp;? Oui, c'est possible&nbsp;! »
    (Fabien&nbsp;Emprin et Fabienne&nbsp;Emprin-Charotte, CRDP Champagne-Ardenne)</p>
  </div>
  <div class="rulecols">
    <div>
      <h3>Matériel</h3>
      <p>6 zones circulaires - cerceaux ou cercles tracés au sol - en deux lignes de trois · une série de 4 cartes · 4 joueurs · un adulte (ou un meneur) pour valider.</p>
      <h3>Mise en place</h3>
      {diagram}
      <p class="small">Marquer le « devant » (un plot, le tableau…). Tous les enfants
      restent tournés dans ce sens pendant toute la partie.</p>
      <h3>20 séries, 4 niveaux</h3>
      <ul class="lvllist">{niveaux}</ul>
    </div>
    <div>
      <h3>Lire sa carte</h3>
      <div class="excard-row">{ex_card}
        <ul class="legend">
          <li><span class="chip" style="border:3px solid {TEAL}"></span> le chat encadré, c'est <b>toi</b></li>
          <li>🐱 un chat = <b>quelqu'un</b> est à cette place</li>
          <li><span style="color:{RED};font-weight:800">✕</span> un chat barré = <b>personne</b> juste à côté dans cette direction (cercle vide, ou pas de cercle)</li>
          <li>rien de dessiné = on ne sait pas</li>
          <li>le haut de la carte = <b>devant</b></li>
        </ul></div>
      <h3>Déroulement</h3>
      <p>Chaque enfant reçoit une carte de la même série. <b>Règle d'or : on ne montre
      jamais sa carte aux autres</b> - on la garde pour soi et on parle.
      En échangeant (« j'ai quelqu'un devant moi », « personne à ma droite »…),
      les 4 enfants cherchent un placement qui rende les quatre cartes vraies -
      une seule solution suffit. Deux zones resteront vides.</p>
      <h3>Validation</h3>
      <p>Quand le groupe pense avoir réussi, chacun lit sa carte à voix haute :
      le groupe gagne si les quatre cartes sont vraies. Une série peut avoir
      plusieurs placements corrects - ils sont tous dans les pages solutions.</p>
      <h3>Variantes</h3>
      <p class="small">Se placer sans parler · dessiner d'abord la solution sur papier ·
      chronométrer · faire créer de nouvelles cartes par les élèves.</p>
    </div>
  </div>
  {FOOTER}
</section>'''

def solutions_pages(series):
    pages = []
    for pair in ((1, 2), (3, 4)):
        blocks = ""
        for lvl in pair:
            lname, lcolor, _ = LEVELS[lvl]
            group = [s for s in series if s["level"] == lvl]
            items = ""
            for s in group:
                cards = {int(p): c for p, c in s["cards"].items()}
                grids = [grid_of(placement) for placement in solve(cards)]
                grids.sort(key=lambda grid: grid != s["sol"])
                count = "placement unique" if len(grids) == 1 else f"{len(grids)} placements corrects"
                span = "" if len(grids) <= 2 else (" span2" if len(grids) <= 5 else " span4")
                shown = "".join(sol_grid(grid, cell=22 if len(grids) > 1 else 28, series=s["num"]) for grid in grids)
                items += f'''<div class="solblock{span}"><h4>Série {s["num"]} <span class="nsols">{count}</span></h4>
                  <div class="gridrow">{shown}</div></div>'''
            blocks += f'''<h3 style="color:{lcolor}">Niveau {lvl} · {lname}</h3>
                <div class="solwrap">{items}</div>'''
        pages.append(f'''<section class="page">
  <div class="pagehead"><h2>Solutions (pour l'adulte)</h2></div>
  <p class="small">Le haut des grilles = « devant ». Certaines séries admettent plusieurs
  placements corrects (groupe décalé d'une colonne, échanges symétriques…) : ils sont
  tous dessinés ci-dessous. Une seule solution suffit. Dans tous les cas, on valide en
  relisant les cartes une à une : c'est gagné dès que chaque carte est vraie.</p>
  {blocks}
  {FOOTER}
</section>''')
    return pages

# ---------------------------------------------------------------- assemblage
CSS = f'''
@page {{ size: A4 portrait; margin: 0; }}
* {{ box-sizing: border-box; }}
body {{ margin:0; font-family:'Segoe UI',system-ui,sans-serif; color:{NAVY}; }}
.page {{ width:210mm; height:296mm; padding:14mm 12mm 10mm; page-break-after:always;
         position:relative; background:white; overflow:hidden; }}
footer {{ position:absolute; bottom:6mm; left:0; right:0; text-align:center;
          font-size:9px; color:#b3a998; letter-spacing:.5px; }}
.fline {{ display:inline-flex; align-items:center; gap:5px; }}
.mmark {{ width:12px; height:12px; opacity:.9; }}
h1 {{ font-size:30px; margin:6px 0 2px; }}
h2 {{ font-size:22px; margin:0; }}
h3 {{ font-size:14px; margin:12px 0 4px; color:{TEAL}; text-transform:uppercase; letter-spacing:.6px;}}
h4 {{ margin:0 0 4px; font-size:12px; }}
p {{ font-size:12.5px; line-height:1.45; margin:4px 0; }}
.small {{ font-size:10.5px; color:#6d6558; line-height:1.4; }}
.titleband {{ text-align:center; margin-bottom:4mm; }}
.logo {{ width:140px; }}
.subtitle {{ font-size:11px; color:#6d6558; }}
.rulecols {{ display:grid; grid-template-columns:1fr 1fr; gap:8mm; }}
.diagram {{ background:{CREAM}; border-radius:12px; padding:8px; }}
.arrow {{ text-align:center; font-size:10px; font-weight:700; color:{ORANGE}; margin-bottom:2px;}}
.dzone {{ position:relative; height:185px; }}
.dhoop {{ position:absolute; width:60px; height:60px; border:5px solid {TEAL};
          border-radius:50%; display:flex; align-items:center; justify-content:center; }}
.dcat {{ transform:translateY(-2px); }}
ul.lvllist {{ font-size:10.5px; line-height:1.55; padding-left:15px; margin:2px 0; }}
.excard-row {{ display:flex; gap:12px; align-items:center; }}
.card.excard {{ width:225px; height:205px; flex:none; }}
ul.legend {{ font-size:11.5px; line-height:1.7; padding-left:16px; margin:0; }}
.chip {{ display:inline-block; width:14px; height:14px; border-radius:4px; vertical-align:-2px;}}
.pagehead {{ display:flex; align-items:center; justify-content:space-between;
             border-bottom:3px solid {TEAL}; padding-bottom:5px; margin-bottom:2mm; }}
.lvlbadge {{ color:white; font-size:12px; font-weight:700; padding:4px 12px; border-radius:20px; }}
.lvldesc {{ font-size:11px; color:#6d6558; margin-bottom:5mm; }}
.cardgrid {{ display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr;
             gap:6mm; height:218mm; }}
.card {{ position:relative; border:1.5px dashed #c9c0b2; border-radius:10px; background:white; }}
.cardnum {{ position:absolute; top:5px; right:8px; font-weight:700; font-size:13px;
            color:#9a8f7d; background:{CREAM}; padding:1px 8px; border-radius:7px; }}
.slot {{ position:absolute; width:33%; height:33%; display:flex; align-items:center; justify-content:center; }}
.slot.top    {{ left:33.5%; top:1%; }}
.slot.left   {{ left:2%;    top:34%; }}
.slot.center {{ left:33.5%; top:34%; }}
.slot.right  {{ left:65%;   top:34%; }}
.slot.bottom {{ left:33.5%; top:67%; }}
.you {{ border:4px solid {TEAL}; border-radius:12px; }}
.cutnote {{ font-size:10px; color:#9a8f7d; margin-top:3mm; }}
.cardnum {{ display:flex; align-items:center; gap:5px; }}
.mbadge {{ width:13px; height:13px; border-radius:3px; }}
.cardurl {{ position:absolute; bottom:5px; left:0; right:0; text-align:center;
            font-size:8px; color:#c4bbac; letter-spacing:.8px; }}
.solwrap {{ display:grid; grid-template-columns:repeat(4,1fr); gap:3mm 3mm; grid-auto-flow:dense; }}
.solblock {{ background:{CREAM}; border-radius:10px; padding:7px 8px; }}
.nsols {{ font-weight:400; font-size:9px; color:#6d6558; }}
.gridrow {{ display:flex; flex-wrap:wrap; gap:2px 10px; align-items:flex-start; }}
.solgrid {{ flex:none; }}
.solblock.span2 {{ grid-column:span 2; }}
.solblock.span4 {{ grid-column:span 4; }}
.hooprow {{ display:flex; gap:4px; margin:2px 0; }}
.hoop {{ border:3.5px solid {TEAL}; border-radius:50%; display:flex; align-items:center;
         justify-content:center; font-weight:800; font-size:13px; color:{NAVY}; background:white;}}
'''

def main():
    series = json.loads(SERIES_FILE.read_text(encoding="utf-8"))
    pages = [rule_page()] + [serie_page(s) for s in series] + solutions_pages(series)
    html = (
        '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
        '<title>Chat, c\'est toi le chat ! - maths&amp;go</title>'
        f'<style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
    )
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUT_DIR / "livret.html"
    output.write_text(html, encoding="utf-8")
    print(f"HTML ok, {len(pages)} pages → {output}")

if __name__ == "__main__":
    main()
