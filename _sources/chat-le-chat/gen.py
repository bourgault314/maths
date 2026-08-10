#!/usr/bin/env python3
"""Génère le HTML imprimable « Chat, c'est toi le chat ! »."""
import base64
import json
import re
from pathlib import Path

from game import ROWS, COLS, check, grid_of, placement_of, solve

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

# Exemple autonome de la page d'explication. Il reste volontairement distinct
# des 20 séries du livret : il ne doit jamais être exporté dans series20.json.
GUIDED_CARDS = {
    1: {"left": "P"},
    2: {"front": "P", "left": "P", "right": "X", "back": "X"},
    3: {"front": "P"},
    4: {"right": "P", "back": "P"},
}
GUIDED_WRONG = [[4, 1, 0], [3, 0, 2]]
GUIDED_CORRECT = [[4, 1, 0], [3, 2, 0]]

favicon = FAVICON_FILE.read_text(encoding="utf-8")
M_BADGE = '<svg class="mbadge" viewBox="0 0 100 100">' + re.search(r"<rect.*</g>", favicon, re.S).group(0) + "</svg>"
M_FAV = favicon.replace('<svg ', '<svg class="mmark" ', 1)
FOOTER = f'<footer><span class="fline">{M_FAV} Chat, c\'est toi le chat&nbsp;! · mathsgo.re</span></footer>'

# ---------------------------------------------------------------- chat SVG (style A)
def cat_svg(size=100, crossed=False, number=None):
    x = ""
    if crossed:
        x = f'''<line x1="8" y1="16" x2="92" y2="104" stroke="{RED}" stroke-width="10" stroke-linecap="round"/>
                <line x1="92" y1="16" x2="8" y2="104" stroke="{RED}" stroke-width="10" stroke-linecap="round"/>'''
    badge = ""
    if number is not None:
        badge = f'''<g class="player-badge" aria-label="carte {number}">
          <circle cx="50" cy="73" r="13" fill="{NAVY}" stroke="white" stroke-width="3"/>
          <text x="50" y="79" text-anchor="middle" fill="white" font-family="Segoe UI,Arial,sans-serif"
                font-size="18" font-weight="800">{number}</text>
        </g>'''
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
  {badge}
  {x}
</svg>'''

# ---------------------------------------------------------------- carte de jeu
def card_html(label, cons, player_number, cat_px=95, extra_class=""):
    def slot(name, content):
        return f'<div class="slot {name}">{content}</div>'
    # Le numéro appartient uniquement au chat encadré. Tous les chats qui
    # décrivent les voisins restent volontairement anonymes.
    cells = [slot("center you", cat_svg(cat_px, number=player_number))]
    for d in ("front", "left", "right", "back"):
        if d in cons:
            pos = {"front": "top", "back": "bottom", "left": "left", "right": "right"}[d]
            cells.append(slot(pos, cat_svg(cat_px, crossed=(cons[d] == "X"))))
    brand = "" if extra_class else f'<div class="cardnum">{M_BADGE}{label}</div><div class="cardurl">mathsgo.re</div>'
    brand = brand or f'<div class="cardnum">{label}</div>'
    return (f'<div class="card {extra_class}" data-card-number="{player_number}">'
            f'{brand}{"".join(cells)}</div>')

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
    cards = "".join(
        card_html(f"Série {num}", s["cards"][p], player_number=int(p))
        for p in ("1", "2", "3", "4")
    )
    return f'''<section class="page">
  <div class="pagehead" style="border-color:{lcolor}"><h2>Série {num}</h2>
    <span class="lvlbadge" style="background:{lcolor}">Niveau {lvl} · {lname}</span></div>
  <div class="lvldesc">{ldesc} · {"Un seul placement correct." if s["n_sols"] == 1 else str(s["n_sols"]) + " placements corrects (voir solutions)."}</div>
  <div class="cardgrid">{cards}</div>
  <div class="cutnote">✂ Découper les 4 cartes le long des traits. Une carte par joueur.</div>
</section>'''

def rule_page():
    hoops = ""
    cats_at = {(0, 0), (0, 1), (1, 1), (1, 2)}
    for r in range(2):
        for c in range(3):
            cat = f'<div class="setup-cat">{cat_svg(25)}</div>' if (r, c) in cats_at else ""
            hoops += f'<div class="setup-hoop">{cat}</div>'
    diagram = f'''<div class="setup-diagram">
      <div class="setup-front">DEVANT ↑</div>
      <div class="setup-hoops">{hoops}</div>
      <div class="setup-caption">2 lignes de 3 zones</div>
    </div>'''
    ex_card = card_html(
        "EX", {"front": "P", "right": "X"}, player_number=2,
        cat_px=39, extra_class="excard",
    )
    niveaux = "".join(
        f'''<article class="rules-level" style="--level-color:{c}">
          <div class="level-head"><span class="level-number">{l}</span><b>{n}</b></div>
          <p>{d}</p>
        </article>'''
        for l, (n, c, d) in LEVELS.items())
    return f'''<section class="page rules-page">
  <header class="rules-hero">
    <img class="rules-logo" src="data:image/png;base64,{LOGO}">
    <div class="rules-hero-copy">
      <div class="rules-kicker"><span>Jeu de positionnement et de communication</span>
        <span class="audience-pill">de la maternelle au collège</span></div>
      <h1>Chat, c'est toi le chat&nbsp;!</h1>
      <p class="rules-source">D'après une situation de « Un rallye mathématique à l'école maternelle&nbsp;? Oui, c'est possible&nbsp;! »
      · Fabien&nbsp;Emprin et Fabienne&nbsp;Emprin-Charotte, CRDP Champagne-Ardenne</p>
    </div>
  </header>

  <div class="rules-basics">
    <div class="rules-panel prep-panel">
      <h2 class="rules-section-title">Avant de jouer</h2>
      <div class="materials-line"><span>Matériel</span>
        <p>6 zones circulaires - cerceaux ou cercles tracés au sol - en deux lignes de trois · une série de 4 cartes · 4 joueurs · un adulte (ou un meneur) pour valider.</p>
      </div>
      <div class="setup-layout">
        {diagram}
        <div class="setup-copy">
          <h3>Mise en place</h3>
          <p><b>1.</b> Marquer le « devant » (un plot, le tableau…).</p>
          <p><b>2.</b> Tous les joueurs restent tournés dans ce sens pendant toute la partie.</p>
        </div>
      </div>
    </div>

    <div class="rules-panel read-panel">
      <h2 class="rules-section-title">Lire une carte</h2>
      <div class="read-layout">{ex_card}
        <ul class="rules-legend">
          <li><span class="chip" style="border:3px solid {TEAL}"></span> le chat encadré, c'est <b>toi</b> ; son numéro (1 à 4) est celui de ta carte</li>
          <li>🐱 un chat = <b>quelqu'un</b> est à cette place</li>
          <li><span style="color:{RED};font-weight:800">✕</span> un chat barré = <b>personne</b> juste à côté dans cette direction (cercle vide, ou pas de cercle)</li>
          <li>rien de dessiné = on ne sait pas</li>
          <li>le haut de la carte = <b>devant</b></li>
        </ul>
      </div>
      <p class="rules-numberkey">Dans les solutions, ce même numéro indique la place du joueur qui tient cette carte.</p>
    </div>
  </div>

  <div class="rules-play">
    <div class="rules-heading-row"><h2 class="rules-section-title">Comment jouer</h2><span>3 étapes</span></div>
    <div class="play-steps">
      <article class="play-step">
        <span class="step-number">1</span><div><h3>Distribuer</h3>
        <p>Chaque joueur reçoit une carte de la même série. <b>Règle d'or : on ne montre jamais sa carte aux autres.</b></p></div>
      </article>
      <article class="play-step">
        <span class="step-number">2</span><div><h3>Échanger et se placer</h3>
        <p>En parlant (« quelqu'un devant moi », « personne à ma droite »…), les 4 joueurs cherchent un placement qui rende les quatre cartes vraies. Deux zones restent vides.</p></div>
      </article>
      <article class="play-step">
        <span class="step-number">3</span><div><h3>Vérifier</h3>
        <p>Quand le groupe pense avoir réussi, chacun lit sa carte à voix haute. Les quatre doivent être vraies. Plusieurs placements peuvent convenir : une seule solution suffit et tous sont dans les pages solutions.</p></div>
      </article>
    </div>
  </div>

  <div class="rules-levels">
    <div class="rules-heading-row"><h2 class="rules-section-title">20 séries progressives</h2><span>4 niveaux</span></div>
    <div class="levels-grid">{niveaux}</div>
  </div>

  <aside class="rules-variants"><b>Variantes</b><span>Se placer sans parler · dessiner d'abord la solution sur papier · chronométrer · faire créer de nouvelles cartes par les élèves.</span></aside>
  {FOOTER}
</section>'''

def guided_grid(grid, state):
    hoops = []
    for row in grid:
        for player in row:
            child = cat_svg(43, number=player) if player else ""
            issue = " issue" if state == "wrong" and player == 2 else ""
            hoops.append(f'<div class="guidehoop{issue}">{child}</div>')
    return f'''<div class="guide-grid {state}" data-guide-state="{state}">
      <div class="guide-front">DEVANT ↑</div>
      <div class="guide-hoops">{"".join(hoops)}</div>
    </div>'''

def guided_page():
    wrong_placement = placement_of(GUIDED_WRONG)
    correct_placement = placement_of(GUIDED_CORRECT)
    wrong_status = {
        player: check(wrong_placement, {player: GUIDED_CARDS[player]})
        for player in GUIDED_CARDS
    }
    correct_status = {
        player: check(correct_placement, {player: GUIDED_CARDS[player]})
        for player in GUIDED_CARDS
    }
    if wrong_status != {1: True, 2: False, 3: True, 4: True}:
        raise ValueError(f"exemple guidé faux incohérent : {wrong_status}")
    if not all(correct_status.values()):
        raise ValueError(f"exemple guidé corrigé incohérent : {correct_status}")

    cards = "".join(
        card_html("Exemple", GUIDED_CARDS[player], player_number=player,
                  cat_px=58, extra_class="guidecard")
        for player in (1, 2, 3, 4)
    )
    return f'''<section class="page guided-page">
  <div class="pagehead"><h2>Exemple guidé : ce placement est-il correct&nbsp;?</h2></div>
  <p class="guide-intro">Les numéros 1 à 4 désignent les joueurs qui ont les cartes 1 à 4.
  Tous regardent vers le « devant ».</p>
  <div class="guide-layout">
    <div class="guide-cards-panel">
      <h3>Les quatre cartes</h3>
      <div class="guide-cardgrid">{cards}</div>
    </div>
    <div class="guide-steps">
      <article class="guide-step guide-wrong">
        <h3>1. On essaie ce placement</h3>
        {guided_grid(GUIDED_WRONG, "wrong")}
        <ol class="guide-checks" aria-label="Vérification du placement proposé">
          <li class="ok"><span><b>Carte 1</b> : 4 est bien à gauche de 1.</span><strong>Vraie</strong></li>
          <li class="bad"><span><b>Carte 2</b> : personne n'est devant ni à gauche de 2.</span><strong>Fausse</strong></li>
        </ol>
        <p class="guide-conclusion"><b>Dès qu'une carte est fausse, on sait que le placement est incorrect.</b></p>
      </article>
      <div class="move-note"><b>2 se déplace</b> de la zone en bas à droite vers la zone en bas au centre.</div>
      <article class="guide-step guide-correct">
        <h3>2. On corrige le placement</h3>
        {guided_grid(GUIDED_CORRECT, "correct")}
        <ol class="guide-checks guide-checks-all" aria-label="Vérification du placement corrigé">
          <li class="ok"><span><b>Carte 1</b> : 4 est à gauche de 1.</span><strong>Vraie</strong></li>
          <li class="ok"><span><b>Carte 2</b> : 1 est devant, 3 à gauche ; personne à droite ni derrière.</span><strong>Vraie</strong></li>
          <li class="ok"><span><b>Carte 3</b> : 4 est devant 3.</span><strong>Vraie</strong></li>
          <li class="ok"><span><b>Carte 4</b> : 1 est à droite et 3 derrière.</span><strong>Vraie</strong></li>
        </ol>
        <p class="guide-conclusion"><b>Les quatre cartes sont vraies : le placement est correct.</b></p>
      </article>
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
  <p class="small">Dans les grilles, les numéros 1 à 4 désignent les joueurs qui ont
  les cartes 1 à 4. Le numéro de chaque carte est écrit sur le chat encadré.
  Le haut des grilles = « devant ». Certaines séries admettent plusieurs
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
.rules-page {{ padding:10mm 11mm; }}
.rules-hero {{ min-height:37mm; display:grid; grid-template-columns:31mm 1fr; gap:5mm;
               align-items:center; padding:4mm 5mm; border:1.5px solid #cce7e3;
               border-radius:16px; background:linear-gradient(135deg,#edf9f7 0%,{CREAM} 100%);
               position:relative; overflow:hidden; }}
.rules-hero::after {{ content:""; position:absolute; width:38mm; height:38mm; right:-16mm;
                      bottom:-24mm; border:5mm solid rgba(42,167,155,.08); border-radius:50%; }}
.rules-logo {{ width:30mm; position:relative; z-index:1; }}
.rules-hero-copy {{ min-width:0; position:relative; z-index:1; }}
.rules-kicker {{ display:flex; align-items:center; justify-content:space-between; gap:3mm;
                 color:{TEAL}; font-size:12px; font-weight:800; letter-spacing:.25px; }}
.audience-pill {{ flex:none; padding:1.2mm 3mm; border-radius:20px; color:white;
                  background:{TEAL}; font-size:12px; letter-spacing:0; }}
.rules-hero h1 {{ font-size:29px; line-height:1; margin:2mm 0 1.2mm; color:{NAVY}; }}
.rules-source {{ margin:0; color:#6d6558; font-size:12px; line-height:1.3; }}
.rules-basics {{ display:grid; grid-template-columns:43fr 57fr; gap:4mm; height:89mm;
                 margin-top:4mm; }}
.rules-panel {{ min-width:0; border:1.3px solid #ded7ca; border-radius:13px; background:white;
                padding:3.5mm; box-shadow:0 2px 0 rgba(31,58,104,.04); overflow:hidden; }}
.rules-section-title {{ margin:0; color:{NAVY}; font-size:18px; line-height:1.1;
                        letter-spacing:0; text-transform:none; }}
.materials-line {{ display:grid; grid-template-columns:18mm 1fr; gap:2.5mm; align-items:start;
                   margin-top:2.5mm; padding-bottom:2.5mm; border-bottom:1px solid #e7e0d5; }}
.materials-line > span {{ border-radius:14px; padding:1.2mm 2mm; background:#e5f5f2;
                          color:#16756d; font-size:12px; font-weight:800; text-align:center; }}
.materials-line p {{ margin:0; font-size:12px; line-height:1.35; }}
.setup-layout {{ display:grid; grid-template-columns:36mm 1fr; gap:3mm; align-items:center;
                 margin-top:2.5mm; }}
.setup-diagram {{ height:46mm; border-radius:10px; background:{CREAM}; padding:2mm 1mm;
                  display:flex; flex-direction:column; justify-content:center; }}
.setup-front {{ color:{ORANGE}; font-size:12px; font-weight:900; text-align:center;
                margin-bottom:1.5mm; }}
.setup-hoops {{ display:grid; grid-template-columns:repeat(3,10.5mm); gap:1.4mm;
                justify-content:center; }}
.setup-hoop {{ width:10.5mm; height:10.5mm; border:3px solid {TEAL}; border-radius:50%;
               display:flex; align-items:center; justify-content:center; background:white; }}
.setup-cat {{ transform:translateY(-1px); }}
.setup-caption {{ color:#82786a; font-size:12px; text-align:center; margin-top:1.5mm; }}
.setup-copy h3 {{ margin:0 0 1.5mm; color:{TEAL}; font-size:14px; }}
.setup-copy p {{ margin:1.6mm 0; font-size:12px; line-height:1.3; }}
.read-layout {{ display:grid; grid-template-columns:42mm 1fr; gap:3mm; align-items:start;
                margin-top:2.5mm; }}
.rules-page .card.excard {{ width:42mm; height:46mm; min-width:42mm; }}
.rules-page .card.excard .cardnum {{ font-size:12px; }}
.rules-legend {{ font-size:12px; line-height:1.27; padding-left:4.5mm; margin:0; }}
.rules-legend li {{ margin:0 0 .9mm; }}
.chip {{ display:inline-block; width:3.5mm; height:3.5mm; border-radius:4px; vertical-align:-2px;}}
.rules-numberkey {{ margin:1.8mm 0 0; padding:1.7mm 2.5mm; border-left:4px solid {TEAL};
                    border-radius:6px; background:{CREAM}; font-size:12px; line-height:1.3; }}
.rules-play, .rules-levels {{ margin-top:4mm; }}
.rules-heading-row {{ display:flex; align-items:center; justify-content:space-between;
                      margin-bottom:2.2mm; }}
.rules-heading-row > span {{ padding:1mm 2.5mm; border-radius:14px; color:#6d6558;
                             background:{CREAM}; font-size:12px; font-weight:800; }}
.play-steps {{ display:grid; grid-template-columns:repeat(3,1fr); gap:3mm; min-height:45mm; }}
.play-step {{ display:grid; grid-template-columns:9mm 1fr; gap:2.5mm; align-items:start;
              border-radius:12px; padding:3mm; background:{CREAM}; border-top:4px solid {TEAL}; }}
.play-step:nth-child(2) {{ border-top-color:{ORANGE}; background:#fff8ed; }}
.play-step:nth-child(3) {{ border-top-color:{NAVY}; background:#f1f5fb; }}
.step-number {{ width:8mm; height:8mm; border-radius:50%; background:{TEAL}; color:white;
                display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900; }}
.play-step:nth-child(2) .step-number {{ background:{ORANGE}; }}
.play-step:nth-child(3) .step-number {{ background:{NAVY}; }}
.play-step h3 {{ margin:0 0 1.5mm; color:{NAVY}; font-size:14px; line-height:1.15;
                 letter-spacing:0; text-transform:none; }}
.play-step p {{ margin:0; font-size:12px; line-height:1.36; }}
.levels-grid {{ display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr;
                gap:2.5mm; height:47mm; }}
.rules-level {{ min-width:0; display:grid; grid-template-columns:39mm 1fr; gap:2.5mm;
                align-items:center; padding:2.2mm 3mm; border-radius:10px; background:{CREAM};
                border-left:5px solid var(--level-color); }}
.level-head {{ display:flex; align-items:center; gap:2mm; min-width:0; }}
.level-number {{ width:7mm; height:7mm; flex:none; display:flex; align-items:center;
                 justify-content:center; border-radius:50%; background:var(--level-color);
                 color:white; font-size:13px; font-weight:900; }}
.level-head b {{ color:var(--level-color); font-size:13px; line-height:1.15; }}
.rules-level p {{ margin:0; color:{NAVY}; font-size:12px; line-height:1.28; }}
.rules-variants {{ min-height:13mm; margin-top:2.5mm; display:grid; grid-template-columns:22mm 1fr;
                   gap:3mm; align-items:center; padding:2.5mm 4mm; border-radius:10px;
                   background:#f2eee7; color:#6d6558; font-size:12px; line-height:1.3; }}
.rules-variants b {{ color:{ORANGE}; font-size:13px; text-transform:uppercase; letter-spacing:.5px; }}
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
.guide-intro {{ margin:3mm 0 4mm; font-size:12px; }}
.guide-layout {{ display:grid; grid-template-columns:1fr 1fr; gap:7mm; height:212mm; }}
.guide-cards-panel, .guide-steps {{ min-width:0; }}
.guide-cards-panel > h3 {{ margin-top:0; }}
.guide-cardgrid {{ display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr;
                   gap:4mm; height:191mm; }}
.card.guidecard {{ min-width:0; min-height:0; }}
.card.guidecard .cardnum {{ font-size:10px; padding:1px 6px; }}
.guide-steps {{ display:flex; flex-direction:column; justify-content:space-between; gap:2mm; }}
.guide-step {{ border:1.5px solid #ddd4c7; border-radius:12px; background:{CREAM};
               padding:3mm 4mm; }}
.guide-step h3 {{ margin:0 0 2mm; }}
.guide-step p {{ margin:2mm 0 0; font-size:10.5px; line-height:1.35; }}
.guide-wrong {{ border-color:#e5a8b0; }}
.guide-wrong h3 {{ color:{RED}; }}
.guide-correct {{ border-color:#8bcfc7; }}
.guide-correct h3 {{ color:{TEAL}; }}
.guide-grid {{ display:flex; flex-direction:column; align-items:center; }}
.guide-front {{ color:{ORANGE}; font-size:10px; font-weight:800; margin-bottom:2px; }}
.guide-hoops {{ display:grid; grid-template-columns:repeat(3,58px); gap:6px; }}
.guidehoop {{ width:58px; height:58px; border:4px solid {TEAL}; border-radius:50%;
              display:flex; align-items:center; justify-content:center; background:white; }}
.guidehoop.issue {{ border-color:{RED}; box-shadow:0 0 0 3px rgba(209,73,91,.16); }}
.move-note {{ border-radius:8px; background:#fff2de; color:#7f541d; text-align:center;
              padding:6px 8px; font-size:10.5px; line-height:1.3; }}
.guide-checks {{ list-style:none; padding:0; margin:2.5mm 0 0; display:grid; gap:1.5mm; }}
.guide-checks li {{ display:flex; align-items:center; justify-content:space-between; gap:2mm;
                    min-height:9mm; padding:1.5mm 2mm; border-radius:7px; background:white;
                    font-size:9.6px; line-height:1.25; border-left:4px solid {TEAL}; }}
.guide-checks li.bad {{ border-left-color:{RED}; }}
.guide-checks li span {{ min-width:0; }}
.guide-checks li strong {{ flex:none; min-width:16mm; padding:1mm 1.5mm; border-radius:12px;
                           background:#e5f5f2; color:#16756d; text-align:center; font-size:9px; }}
.guide-checks li.bad strong {{ background:#fbe9ec; color:{RED}; }}
.guide-conclusion {{ padding-top:1mm; }}
'''

def main():
    series = json.loads(SERIES_FILE.read_text(encoding="utf-8"))
    pages = [rule_page(), guided_page()] + [serie_page(s) for s in series] + solutions_pages(series)
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
