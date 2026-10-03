"""Génère la fiche A4 vide « Mon parcours des tables » (2 pages) et le QR partagé.

Sorties :
  - outils/calcul_mental/fiche_parcours_tables.pdf   (fiche vide à photocopier :
    page 1 = une rangée de dix cases par table, page 2 = carré de Pythagore
    2→9, 5 boîtes par calcul)
  - assets/img/qr-defi-tables-parcours.svg           (QR utilisé aussi par la
    fiche de l'appli, qui reproduit la même mise en page en HTML)

Lot 2b de « Ma séance du jour » (03/10/2026) : la fiche montre ce que montre
Mon parcours dans l'appli — pour chaque table, la rangée de ses dix résultats
(× 1 à × 10). Une case entourée : réussi une fois ; une case coloriée : prêt.
Les ronds de J'apprends et de Je m'entraîne ont quitté l'appli au lot 2a.
QR à gauche, un seul logo (en haut à droite), la signature « mathsgo.re ·
CC BY-NC-SA 4.0 » seule en pied. Tout texte est foncé : la feuille se lit
imprimée en noir et blanc.

Les règles écrites en bas de page sont celles du moteur
`defi_tables_mon_parcours.js` : si un seuil change là-bas, il change ici.

Usage : python3 _sources/defi-tables/generer_fiche_parcours.py
"""

import os
from pathlib import Path

from reportlab.graphics import renderPDF, renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# ------------------------------------------------------------------ les textes
TITLE_LINE_1 = "MON PARCOURS"
TITLE_LINE_2 = "DES TABLES"
SUBTITLE = "Dans l’application, cette fiche se remplit toute seule. Ici, à la main."
QR_LABEL = "Ouvrir l’appli"
APP_URL = "https://mathsgo.re/outils/calcul_mental/defi_tables.html#parcours"
FOOTER_TEXT = "mathsgo.re  ·  CC BY-NC-SA 4.0"
TABLES = range(2, 11)
LEGENDE = ["j’entoure : réussi une fois", "je colorie : prêt"]
ACQUISE_TEXTE = "acquise le"
MELANGE_TITRE = "Mon mélange : mes tables acquises"
MELANGE_TEXTE = "Dès 2 tables acquises : 20 questions en 1 min 30, à refaire après chaque nouvelle table."
EXPERT_TITRE = "Je deviens expert : toutes les tables, de plus en plus vite"
EXPERT_TEXTE = "Mes 9 tables acquises : 25 questions avec des divisions, 2 erreurs au plus."
# Les cinq marches de l'escalier : la durée de chacune, et la couronne pour la
# dernière (DejaVu n'a pas l'emoji 👑 : ♛ la remplace sur le papier).
MARCHES = ["★  2 min", "★★  1 min 45", "★★★  1 min 30", "★★★★  1 min 15", "♛  1 min"]
REGLES_TITRE = "Les règles"
# Chaque règle : le début en gras, puis la suite.
RULES = [
    ("Ma rangée", " : une case entourée, réussi une fois ; une case coloriée, prêt. Toutes coloriées : je peux valider."),
    ("Acquise ✓", " : 20 questions (résultats et nombres manquants) en 1 min 30, 2 erreurs au plus."),
    ("Mon mélange", " : à réussir avant de valider une nouvelle table."),
    ("Mon rang", " : Bronze, Argent, Or, Platine, Diamant, Légende. On ne redescend jamais."),
]

# Page 2 : « Mes calculs » — carré de Pythagore 2→9, sens confondus (moitié miroir grisée).
CALC_TITLE = "MES CALCULS"
CALC_SUBTITLE = "Chaque calcul a 5 boîtes. Réussi le jour où il revient, il monte d’une boîte ;"
CALC_SUBTITLE_2 = "raté, il descend et revient demain. À partir de la boîte 4, il est su."
CALC_NOTE = "7 × 8 et 8 × 7 sont le même calcul : une seule case. La moitié grisée est son miroir."
BOITES = 5
CALC_REGLES_TITRE = "Comment lire la grille"
CALC_RULES = [
    ("Un calcul revient", " le lendemain, puis 3 jours, 7 jours et 14 jours après. Le refaire le même jour ne le fait pas monter."),
    ("Mes calculs du jour", " : les calculs qui reviennent aujourd’hui, 10 à la fois, sans chrono."),
    ("Les tables de 1 et de 10", " n’y sont pas : elles se retrouvent sans les apprendre par cœur."),
    ("La grille se remplit", " dans les entraînements, les validations et Mes calculs du jour — jamais dans J’apprends."),
]

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PDF = ROOT / "outils" / "calcul_mental" / "fiche_parcours_tables.pdf"
OUTPUT_QR = ROOT / "assets" / "img" / "qr-defi-tables-parcours.svg"
LOGO = ROOT / "assets" / "img" / "mathsgo-logo-print.png"


def police(*candidates: str) -> str:
    """La première police présente : DejaVu sous Linux, sinon Windows ou macOS."""
    for chemin in candidates:
        if os.path.exists(chemin):
            return chemin
    raise SystemExit("Aucune police trouvée parmi : " + ", ".join(candidates))


FONT_REGULAR = police("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                      r"C:\Windows\Fonts\DejaVuSans.ttf", r"C:\Windows\Fonts\arial.ttf",
                      "/Library/Fonts/Arial.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf")
FONT_BOLD = police("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                   r"C:\Windows\Fonts\DejaVuSans-Bold.ttf", r"C:\Windows\Fonts\arialbd.ttf",
                   "/Library/Fonts/Arial Bold.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf")

# Couleurs : tout texte est foncé (lisible en noir et blanc) ; les aplats
# restent pâles, jamais de texte clair sur un aplat de la même teinte.
INK = HexColor("#143451")
BLUE = HexColor("#0B57B7")
MUTED = HexColor("#3F5A6C")
LINE = HexColor("#CFE2ED")
TRAIT = HexColor("#7EA1B8")
TEAL = HexColor("#087F75")
CARD = HexColor("#F8FCFF")
PALE_TEAL = HexColor("#E7F7F4")
TEAL_LINE = HexColor("#A9E4DC")
PALE_GOLD = HexColor("#FFF8E1")
GOLD_LINE = HexColor("#E7C86A")
GOLD_DARK = HexColor("#7A4E00")
MIROIR = HexColor("#E6EAF0")
WHITE = HexColor("#FFFFFF")

MARGIN = 14 * mm


def qr_drawing(size: float) -> Drawing:
    widget = QrCodeWidget(APP_URL, barLevel="M")
    x1, y1, x2, y2 = widget.getBounds()
    drawing = Drawing(size, size, transform=[size / (x2 - x1), 0, 0, size / (y2 - y1), 0, 0])
    drawing.add(widget)
    return drawing


def write_qr_svg() -> None:
    OUTPUT_QR.parent.mkdir(parents=True, exist_ok=True)
    renderSVG.drawToFile(qr_drawing(120), str(OUTPUT_QR))


def rounded_box(pdf, x, y, w, h, fill, stroke, radius=3 * mm, width=1.0) -> None:
    pdf.setFillColor(fill)
    pdf.setStrokeColor(stroke)
    pdf.setLineWidth(width)
    pdf.roundRect(x, y, w, h, radius, stroke=1, fill=1)


def regle(pdf, x, y, gras, suite, taille=8.6) -> None:
    """Une ligne de règle : le début en gras, la suite en normal."""
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", taille)
    pdf.drawString(x, y, gras)
    decalage = pdfmetrics.stringWidth(gras, "SheetSans-Bold", taille)
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", taille)
    pdf.drawString(x + decalage, y, suite)


def footer(pdf) -> None:
    width, _ = A4
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8)
    pdf.drawCentredString(width / 2, 9 * mm, FOOTER_TEXT)


def draw_sheet(pdf: canvas.Canvas) -> None:
    width, height = A4
    margin = MARGIN
    top = height - margin
    inner_w = width - 2 * margin

    # En-tête : QR à gauche, titre au centre, logo à droite (un seul logo).
    qr_size = 22 * mm
    renderPDF.draw(qr_drawing(qr_size), pdf, margin - 1.5 * mm, top - qr_size + 1.5 * mm)
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 7.5)
    pdf.drawCentredString(margin - 1.5 * mm + qr_size / 2, top - qr_size - 1.5 * mm, QR_LABEL)
    pdf.setFillColor(BLUE)
    pdf.setFont("SheetSans-Bold", 22)
    pdf.drawCentredString(width / 2, top - 8 * mm, TITLE_LINE_1)
    pdf.drawCentredString(width / 2, top - 16.5 * mm, TITLE_LINE_2)
    logo_w = 34 * mm
    pdf.drawImage(str(LOGO), width - margin - logo_w, top - 17 * mm, width=logo_w,
                  height=logo_w * 195 / 420, mask="auto")

    # Prénom / classe / date
    y = top - 31 * mm
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 11)
    pdf.drawString(margin, y, "Prénom :")
    pdf.setStrokeColor(TRAIT)
    pdf.setLineWidth(0.6)
    pdf.line(margin + 20 * mm, y - 1.2 * mm, margin + 82 * mm, y - 1.2 * mm)
    pdf.drawString(margin + 90 * mm, y, "Classe :")
    pdf.line(margin + 108 * mm, y - 1.2 * mm, margin + 132 * mm, y - 1.2 * mm)
    pdf.drawString(margin + 140 * mm, y, "Date :")
    pdf.line(margin + 154 * mm, y - 1.2 * mm, width - margin, y - 1.2 * mm)
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 9)
    pdf.drawString(margin, y - 6.5 * mm, SUBTITLE)

    # La légende : deux cases modèles.
    case_w, case_h, ecart = 10.2 * mm, 7.6 * mm, 1.3 * mm
    ly = y - 15.5 * mm
    lx = margin
    for index, texte in enumerate(LEGENDE):
        pdf.setFillColor(TEAL if index else WHITE)
        pdf.setStrokeColor(TEAL)
        pdf.setLineWidth(1.0 if index else 1.6)
        pdf.roundRect(lx, ly - 1.6 * mm, 7 * mm, 5 * mm, 1.3 * mm, stroke=1, fill=1)
        pdf.setFillColor(MUTED)
        pdf.setFont("SheetSans", 8.6)
        pdf.drawString(lx + 9 * mm, ly, texte)
        lx += 9 * mm + pdfmetrics.stringWidth(texte, "SheetSans", 8.6) + 8 * mm

    # Une rangée par table : ses dix résultats (× 1 à × 10), puis « acquise le ».
    row_h = 13.4 * mm
    col_cases = margin + 33 * mm
    y = ly - 3.5 * mm
    for table in TABLES:
        y -= row_h
        box_h = row_h - 1.8 * mm
        rounded_box(pdf, margin, y, inner_w, box_h, WHITE, LINE)
        cy = y + box_h / 2
        pdf.setFillColor(INK)
        pdf.setFont("SheetSans-Bold", 12)
        pdf.drawString(margin + 3.5 * mm, cy - 1.6 * mm, f"Table de {table}")
        for index in range(10):
            x = col_cases + index * (case_w + ecart)
            rounded_box(pdf, x, cy - case_h / 2, case_w, case_h, WHITE, TRAIT, radius=1.8 * mm, width=0.9)
            pdf.setFillColor(INK)
            pdf.setFont("SheetSans-Bold", 9.5)
            pdf.drawCentredString(x + case_w / 2, cy - 1.25 * mm, str(table * (index + 1)))
        fin = col_cases + 10 * (case_w + ecart)
        pdf.setFillColor(MUTED)
        pdf.setFont("SheetSans", 7.5)
        pdf.drawString(fin + 2 * mm, cy - 1 * mm, ACQUISE_TEXTE)
        pdf.setStrokeColor(TRAIT)
        pdf.setLineWidth(0.6)
        pdf.line(fin + 16.5 * mm, cy - 1.6 * mm, margin + inner_w - 3 * mm, cy - 1.6 * mm)

    # Mon mélange
    block_h = 16 * mm
    y -= 4 * mm + block_h
    rounded_box(pdf, margin, y, inner_w, block_h, PALE_TEAL, TEAL_LINE)
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 11)
    pdf.drawString(margin + 4 * mm, y + block_h - 6 * mm, MELANGE_TITRE)
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8.6)
    pdf.drawString(margin + 4 * mm, y + 3.6 * mm, MELANGE_TEXTE)
    pdf.setFont("SheetSans", 8)
    pdf.drawString(margin + 98 * mm, y + block_h - 6 * mm, "dates :")
    pdf.setStrokeColor(TRAIT)
    pdf.setLineWidth(0.6)
    for index in range(4):
        x0 = margin + 110 * mm + index * 17.5 * mm
        pdf.line(x0, y + block_h - 6.8 * mm, x0 + 14.5 * mm, y + block_h - 6.8 * mm)

    # Les étoiles : le titre, la phrase, puis les cinq marches sur leur ligne.
    expert_h = 23 * mm
    y -= 3 * mm + expert_h
    rounded_box(pdf, margin, y, inner_w, expert_h, PALE_GOLD, GOLD_LINE)
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 11)
    pdf.drawString(margin + 4 * mm, y + expert_h - 6 * mm, EXPERT_TITRE)
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8.6)
    pdf.drawString(margin + 4 * mm, y + expert_h - 11 * mm, EXPERT_TEXTE)
    pdf.setFont("SheetSans-Bold", 9.5)
    pdf.setFillColor(GOLD_DARK)
    pas = (inner_w - 8 * mm) / len(MARCHES)
    for index, marche in enumerate(MARCHES):
        pdf.drawCentredString(margin + 4 * mm + pas * (index + 0.5), y + 4.8 * mm, marche)
    pdf.setFont("SheetSans", 7.5)
    pdf.setFillColor(MUTED)
    pdf.drawCentredString(margin + 4 * mm + pas * 4.5, y + 1.6 * mm, "Légende des tables")

    # Comment colorier
    y -= 9 * mm
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 9.5)
    pdf.drawString(margin, y, REGLES_TITRE)
    for gras, suite in RULES:
        y -= 5.2 * mm
        regle(pdf, margin, y, gras, suite)

    footer(pdf)


def draw_calc_sheet(pdf: canvas.Canvas) -> None:
    width, height = A4
    margin = 10 * mm
    top = height - MARGIN

    pdf.setFillColor(BLUE)
    pdf.setFont("SheetSans-Bold", 22)
    pdf.drawCentredString(width / 2, top - 8 * mm, CALC_TITLE)
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 9.5)
    pdf.drawCentredString(width / 2, top - 15.5 * mm, CALC_SUBTITLE)
    pdf.drawCentredString(width / 2, top - 20.3 * mm, CALC_SUBTITLE_2)

    # Carré de Pythagore, 2 à 9 (décidé le 30/08/2026) : la moitié haute porte
    # les cinq boîtes, la moitié miroir est grisée — 7 × 8 et 8 × 7 sont le
    # même calcul. Même disposition que l'écran « Mes calculs » de l'appli.
    # Lot 5 : la grille prend la page (cases de 22,9 × 23 mm), boîtes de 3,6 mm.
    facteurs = list(range(2, 10))
    entete_w = 7 * mm
    cell_w = (width - 2 * margin - entete_w) / len(facteurs)
    cell_h = 23 * mm
    grid_top = top - 31 * mm
    box = 3.6 * mm
    ecart = 0.7 * mm

    pdf.setFont("SheetSans-Bold", 12)
    pdf.setFillColor(BLUE)
    pdf.drawCentredString(margin + entete_w / 2, grid_top + 2.5 * mm, "×")
    for index, colonne in enumerate(facteurs):
        cx = margin + entete_w + index * cell_w + cell_w / 2
        pdf.drawCentredString(cx, grid_top + 2.5 * mm, str(colonne))

    for rang, ligne in enumerate(facteurs):
        y = grid_top - (rang + 1) * cell_h
        pdf.setFont("SheetSans-Bold", 12)
        pdf.setFillColor(BLUE)
        pdf.drawCentredString(margin + entete_w / 2, y + cell_h / 2 - 1.8 * mm, str(ligne))
        for index, colonne in enumerate(facteurs):
            x = margin + entete_w + index * cell_w
            miroir = colonne < ligne
            pdf.setStrokeColor(LINE)
            pdf.setLineWidth(0.7)
            pdf.setFillColor(MIROIR if miroir else CARD)
            pdf.rect(x, y, cell_w, cell_h, stroke=1, fill=1)
            if miroir:
                continue
            cy = y + cell_h / 2
            largeur_cases = BOITES * box + (BOITES - 1) * ecart
            depart = x + (cell_w - largeur_cases) / 2
            pdf.setStrokeColor(TRAIT)
            pdf.setLineWidth(0.8)
            pdf.setFillColor(WHITE)
            for case in range(BOITES):
                bx = depart + case * (box + ecart)
                pdf.roundRect(bx, cy - box / 2, box, box, 0.7 * mm, stroke=1, fill=1)

    bas = grid_top - len(facteurs) * cell_h
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8.6)
    pdf.drawCentredString(width / 2, bas - 5.5 * mm, CALC_NOTE)

    y = bas - 14 * mm
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 9.5)
    pdf.drawString(MARGIN, y, CALC_REGLES_TITRE)
    for gras, suite in CALC_RULES:
        y -= 5.2 * mm
        regle(pdf, MARGIN, y, gras, suite)

    footer(pdf)


def main() -> None:
    pdfmetrics.registerFont(TTFont("SheetSans", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("SheetSans-Bold", FONT_BOLD))
    write_qr_svg()
    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT_PDF), pagesize=A4)
    pdf.setTitle("Mon parcours des tables — maths&go")
    pdf.setAuthor("Gwenaël Bourgault — mathsgo.re")
    pdf.setSubject("Fiche de suivi du parcours Défi tables (CC BY-NC-SA 4.0)")
    draw_sheet(pdf)
    pdf.showPage()
    draw_calc_sheet(pdf)
    pdf.showPage()
    pdf.save()
    print(f"OK : {OUTPUT_PDF.relative_to(ROOT)} (2 pages) et {OUTPUT_QR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
