"""Génère la fiche A4 vide « Mon parcours des tables » (2 pages) et le QR partagé.

Sorties :
  - outils/calcul_mental/fiche_parcours_tables.pdf   (fiche vide à photocopier :
    page 1 = parcours par table, page 2 = carré de Pythagore 2→9, 5 boîtes par calcul)
  - assets/img/qr-defi-tables-parcours.svg           (QR utilisé aussi par la
    fiche imprimée depuis l'appli, qui reproduit la même mise en page en HTML)

La fiche reprend la charte de la fiche de révision (titre bleu, cartes claires,
QR code à droite, logo en haut à gauche, signature « mathsgo.re · CC BY-NC-SA
4.0 » centrée en pied). Les règles écrites en bas de page sont celles du moteur
`defi_tables_mon_parcours.js` : si un seuil change là-bas, il doit changer ici.
La mise en page est la même que la fiche imprimée depuis l'appli
(`defi_tables.html`, section `.fiche`) : les deux disent la même chose.

Lot 3 de Défi tables v2 (08/09/2026) : mélange obligatoire dès 2 tables
(20 questions en 1 min 30), escalier de cinq marches (★ … ♛ Légende des
tables), rang qui ne redescend jamais. Lot 4b (10/09/2026) : cinq activités
dans J'apprends — « perles » (le rekenrek) en tête, et le bâton s'appelle la
bande. Lot mémoire (12/09/2026) : cinq boîtes par calcul au lieu de trois
cases — un calcul monte quand on le réussit le jour où il revient (le
lendemain, puis 3, 7, 14 jours après), su dès la boîte 4, une erreur = une
boîte de moins.

Usage : python3 _sources/defi-tables/generer_fiche_parcours.py
"""

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

TITLE_LINE_1 = "MON PARCOURS"
TITLE_LINE_2 = "DES TABLES"
SUBTITLE = "Feuille à colorier à la main. Dans l’application, elle se remplit toute seule."
APP_URL = "https://mathsgo.re/outils/calcul_mental/defi_tables.html#parcours"
FOOTER_TEXT = "mathsgo.re  ·  CC BY-NC-SA 4.0"
TABLES = range(2, 11)
APPRENDS = ["perles", "bande", "à trous", "ordre", "désordre"]
ENTRAINE = ["produits", "trous", "les deux"]
# Les cinq marches de l'escalier : la durée de chacune, et la couronne pour la
# dernière (DejaVu n'a pas l'emoji 👑 : ♛ la remplace sur le papier).
MARCHES = ["★  2 min", "★★  1 min 45", "★★★  1 min 30", "★★★★  1 min 15", "♛  1 min"]
RULES = [
    "J’apprends : un rond par activité terminée. On découvre la table, il n’y a rien à réussir.",
    "Je m’entraîne : 10 questions sans chronomètre, 1 erreur au maximum. Trois entraînements différents.",
    "Acquise ✓ : 20 questions (produits et nombres manquants) en 1 min 30, 2 erreurs au maximum.",
    "Mon mélange : même règle, sur mes tables acquises — à réussir avant de valider une nouvelle table.",
    "Mon rang : Bronze dès ma première table, puis Argent, Or, Platine, Diamant, Légende. On ne redescend jamais.",
]

# Page 2 : « Mes calculs » — carré de Pythagore 2→9, sens confondus (moitié miroir grisée).
CALC_TITLE = "MES CALCULS"
CALC_SUBTITLE = "Cinq boîtes par calcul : une bonne réponse le jour où le calcul revient le fait monter d’une boîte,"
CALC_SUBTITLE_2 = "une erreur le fait redescendre. À partir de la boîte 4, le calcul est su."
BOITES = 5
FACTS = [(a, b) for a in range(2, 10) for b in range(a, 10)]
CALC_RULES = [
    "7 × 8 = 8 × 7 : c’est le même calcul à mémoriser, il n’occupe qu’une case du tableau. C’est pourquoi une moitié est grisée.",
    "Un calcul monte quand on le réussit le jour où il revient : le lendemain, puis 3 jours, 7 jours et 14 jours après —",
    "pas trois fois dans la même minute. Une erreur le fait redescendre d’une boîte, sans limite, et il revient tout de suite.",
    "Les tables de 1 et de 10 n’y sont pas : elles se retrouvent sans les apprendre par cœur.",
    "La grille se remplit dans les entraînements, les validations et les révisions — jamais dans J’apprends.",
]

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PDF = ROOT / "outils" / "calcul_mental" / "fiche_parcours_tables.pdf"
OUTPUT_QR = ROOT / "assets" / "img" / "qr-defi-tables-parcours.svg"
LOGO = ROOT / "assets" / "img" / "mathsgo-logo-print.png"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

INK = HexColor("#143451")
BLUE = HexColor("#0B57B7")
TEAL = HexColor("#087F75")
MUTED = HexColor("#506B7D")
LINE = HexColor("#CFE2ED")
CARD = HexColor("#F8FCFF")
PALE_TEAL = HexColor("#E7F7F4")
GOLD = HexColor("#B7791F")
WHITE = HexColor("#FFFFFF")


def qr_drawing(size: float) -> Drawing:
    widget = QrCodeWidget(APP_URL, barLevel="M")
    x1, y1, x2, y2 = widget.getBounds()
    drawing = Drawing(size, size, transform=[size / (x2 - x1), 0, 0, size / (y2 - y1), 0, 0])
    drawing.add(widget)
    return drawing


def write_qr_svg() -> None:
    OUTPUT_QR.parent.mkdir(parents=True, exist_ok=True)
    renderSVG.drawToFile(qr_drawing(120), str(OUTPUT_QR))


def circle_row(pdf: canvas.Canvas, x: float, y: float, count: int, step: float, radius: float) -> None:
    pdf.setStrokeColor(HexColor("#7EA1B8"))
    pdf.setLineWidth(1.1)
    for index in range(count):
        pdf.circle(x + index * step, y, radius, stroke=1, fill=0)


def rounded_box(pdf: canvas.Canvas, x: float, y: float, w: float, h: float, fill, stroke, radius=3 * mm, width=1.0) -> None:
    pdf.setFillColor(fill)
    pdf.setStrokeColor(stroke)
    pdf.setLineWidth(width)
    pdf.roundRect(x, y, w, h, radius, stroke=1, fill=1)


def draw_sheet(pdf: canvas.Canvas) -> None:
    width, height = A4
    margin = 14 * mm
    top = height - margin

    # En-tête : logo, titre, QR
    logo_w = 34 * mm
    pdf.drawImage(str(LOGO), margin, top - 16 * mm, width=logo_w, height=logo_w * 195 / 420, mask="auto")
    pdf.setFillColor(BLUE)
    pdf.setFont("SheetSans-Bold", 22)
    pdf.drawCentredString(width / 2, top - 8 * mm, TITLE_LINE_1)
    pdf.drawCentredString(width / 2, top - 16.5 * mm, TITLE_LINE_2)
    qr_size = 24 * mm
    renderPDF.draw(qr_drawing(qr_size), pdf, width - margin - qr_size, top - qr_size)
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 6.5)
    pdf.drawCentredString(width - margin - qr_size / 2, top - qr_size - 3 * mm, "Ouvrir Mon parcours")

    # Ligne prénom / classe / date
    y = top - 30 * mm
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 11)
    pdf.drawString(margin, y, "Prénom :")
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.9)
    pdf.line(margin + 20 * mm, y - 1.2 * mm, margin + 82 * mm, y - 1.2 * mm)
    pdf.drawString(margin + 90 * mm, y, "Classe :")
    pdf.line(margin + 108 * mm, y - 1.2 * mm, margin + 132 * mm, y - 1.2 * mm)
    pdf.drawString(margin + 140 * mm, y, "Date :")
    pdf.line(margin + 154 * mm, y - 1.2 * mm, width - margin, y - 1.2 * mm)
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 9)
    pdf.drawString(margin, y - 6.5 * mm, SUBTITLE)

    # Tableau des tables : 5 ronds J'apprends, 3 ronds Je m'entraîne, la case
    # Acquise — neuf colonnes après le nom de la table, au pas de 12,5 mm.
    table_top = y - 12 * mm
    row_h = 15.6 * mm
    col_table = margin
    col_apprends = margin + 40 * mm
    col_entraine = margin + 106 * mm
    col_acquise = margin + 150 * mm
    inner_w = width - 2 * margin
    step_apprends = 12.5 * mm
    step_entraine = 12.5 * mm
    radius = 4 * mm

    # En-têtes de colonnes
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans-Bold", 8)
    pdf.drawCentredString(col_apprends + 2 * step_apprends, table_top + 1.5 * mm, "J’APPRENDS")
    pdf.drawCentredString(col_entraine + step_entraine, table_top + 1.5 * mm, "JE M’ENTRAÎNE")
    pdf.drawCentredString(col_acquise + 8 * mm, table_top + 1.5 * mm, "ACQUISE")
    pdf.setFont("SheetSans", 6.3)
    for index, label in enumerate(APPRENDS):
        pdf.drawCentredString(col_apprends + index * step_apprends, table_top - 1.6 * mm, label)
    for index, label in enumerate(ENTRAINE):
        pdf.drawCentredString(col_entraine + index * step_entraine, table_top - 1.6 * mm, label)

    y = table_top - 4 * mm
    for table in TABLES:
        y -= row_h
        rounded_box(pdf, margin, y, inner_w, row_h - 2 * mm, CARD, LINE)
        cy = y + (row_h - 2 * mm) / 2
        pdf.setFillColor(INK)
        pdf.setFont("SheetSans-Bold", 12.5)
        pdf.drawString(col_table + 4 * mm, cy - 1.6 * mm, f"Table de {table}")
        circle_row(pdf, col_apprends, cy, len(APPRENDS), step_apprends, radius)
        circle_row(pdf, col_entraine, cy, len(ENTRAINE), step_entraine, radius)
        # case Acquise
        box = 8.4 * mm
        pdf.setStrokeColor(HexColor("#7EA1B8"))
        pdf.setLineWidth(1.1)
        pdf.setFillColor(WHITE)
        pdf.roundRect(col_acquise + 8 * mm - box / 2, cy - box / 2, box, box, 2 * mm, stroke=1, fill=1)
        pdf.setFillColor(HexColor("#C9D6DF"))
        pdf.setFont("SheetSans-Bold", 11)
        pdf.drawCentredString(col_acquise + 8 * mm, cy - 1.9 * mm, "✓")

    # Mon mélange + Je deviens expert (mêmes textes que la fiche de l'appli)
    y -= 5 * mm
    block_h = 17 * mm
    y -= block_h
    rounded_box(pdf, margin, y, inner_w, block_h, PALE_TEAL, HexColor("#A9E4DC"))
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 11)
    pdf.drawString(margin + 4 * mm, y + block_h - 5.5 * mm, "Mon mélange : mes tables acquises")
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8)
    pdf.drawString(margin + 4 * mm, y + 3.5 * mm,
                   "Dès 2 tables acquises, à réussir avant de valider une nouvelle table (20 questions en 1 min 30). À refaire à chaque table.")
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 7.5)
    pdf.drawString(margin + 96 * mm, y + block_h - 5.5 * mm, "dates :")
    pdf.setStrokeColor(HexColor("#7EA1B8"))
    pdf.setLineWidth(0.8)
    for index in range(4):
        x0 = margin + 109 * mm + index * 18 * mm
        pdf.line(x0, y + block_h - 6.5 * mm, x0 + 15 * mm, y + block_h - 6.5 * mm)

    # L'escalier : le titre, la phrase, puis les cinq marches sur leur ligne,
    # réparties sur la largeur, à cocher au fur et à mesure.
    expert_h = 22 * mm
    y -= 3 * mm + expert_h
    rounded_box(pdf, margin, y, inner_w, expert_h, HexColor("#FFF8E1"), HexColor("#E7C86A"))
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 11)
    pdf.drawString(margin + 4 * mm, y + expert_h - 5.5 * mm, "Je deviens expert : toutes les tables, de plus en plus vite")
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8)
    pdf.drawString(margin + 4 * mm, y + expert_h - 10 * mm,
                   "Quand mes 9 tables sont acquises et le mélange réussi : 25 questions avec des divisions, 2 erreurs au maximum.")
    pdf.setFont("SheetSans-Bold", 9)
    pdf.setFillColor(GOLD)
    pas = (inner_w - 8 * mm) / len(MARCHES)
    for index, marche in enumerate(MARCHES):
        pdf.drawCentredString(margin + 4 * mm + pas * (index + 0.5), y + 3.8 * mm, marche)
    pdf.setFont("SheetSans", 6.5)
    pdf.setFillColor(MUTED)
    pdf.drawCentredString(margin + 4 * mm + pas * 4.5, y + 1.2 * mm, "Légende des tables")

    # Règles
    y -= 10 * mm
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 9)
    pdf.drawString(margin, y, "Les règles")
    y -= 5 * mm
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8.3)
    for line in RULES:
        pdf.drawString(margin, y, line)
        y -= 5 * mm

    # Pied de page
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8)
    pdf.drawCentredString(width / 2, 9 * mm, FOOTER_TEXT)


def draw_calc_sheet(pdf: canvas.Canvas) -> None:
    width, height = A4
    margin = 14 * mm
    top = height - margin

    # Titre et consigne
    pdf.setFillColor(BLUE)
    pdf.setFont("SheetSans-Bold", 22)
    pdf.drawCentredString(width / 2, top - 8 * mm, CALC_TITLE)
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 9)
    pdf.drawCentredString(width / 2, top - 15 * mm, CALC_SUBTITLE)
    pdf.drawCentredString(width / 2, top - 19.5 * mm, CALC_SUBTITLE_2)

    # Carré de Pythagore, 2 à 9 (décidé le 30/08/2026) : la moitié haute porte
    # les cinq boîtes à cocher, la moitié miroir est grisée — 7 × 8 et 8 × 7
    # sont le même calcul, on ne le remplit qu'une fois. Même disposition que
    # l'écran « Mes calculs » de l'appli et que la fiche remplie.
    facteurs = list(range(2, 10))
    grid_top = top - 27 * mm
    entete_w = 14 * mm
    cell_w = (width - 2 * margin - entete_w) / len(facteurs)
    cell_h = 15 * mm
    box = 2.7 * mm
    ecart = 0.8 * mm

    # En-tête de colonnes
    pdf.setFont("SheetSans-Bold", 11)
    pdf.setFillColor(BLUE)
    pdf.drawCentredString(margin + entete_w / 2, grid_top + 3 * mm, "×")
    for index, colonne in enumerate(facteurs):
        cx = margin + entete_w + index * cell_w + cell_w / 2
        pdf.drawCentredString(cx, grid_top + 3 * mm, str(colonne))

    for rang, ligne in enumerate(facteurs):
        y = grid_top - (rang + 1) * cell_h
        pdf.setFont("SheetSans-Bold", 11)
        pdf.setFillColor(BLUE)
        pdf.drawCentredString(margin + entete_w / 2, y + cell_h / 2 - 1.6 * mm, str(ligne))
        for index, colonne in enumerate(facteurs):
            x = margin + entete_w + index * cell_w
            miroir = colonne < ligne
            pdf.setStrokeColor(LINE)
            pdf.setLineWidth(0.7)
            pdf.setFillColor(HexColor("#EEF1F5") if miroir else CARD)
            pdf.rect(x, y, cell_w, cell_h, stroke=1, fill=1)
            if miroir:
                continue
            cy = y + cell_h / 2
            largeur_cases = BOITES * box + (BOITES - 1) * ecart
            depart = x + (cell_w - largeur_cases) / 2
            pdf.setStrokeColor(HexColor("#7EA1B8"))
            pdf.setLineWidth(0.8)
            pdf.setFillColor(WHITE)
            for case in range(BOITES):
                bx = depart + case * (box + ecart)
                pdf.roundRect(bx, cy - box / 2, box, box, 0.7 * mm, stroke=1, fill=1)

    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8)
    pdf.drawCentredString(width / 2, grid_top - len(facteurs) * cell_h - 5 * mm,
                          "La moitié grisée est le miroir de l’autre : 7 × 8 et 8 × 7 sont le même calcul, on ne le remplit qu’une fois.")

    # Règles de lecture
    y = grid_top - len(facteurs) * cell_h - 14 * mm
    pdf.setFillColor(INK)
    pdf.setFont("SheetSans-Bold", 9)
    pdf.drawString(margin, y, "Comment lire la grille")
    y -= 5 * mm
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8.3)
    for line in CALC_RULES:
        pdf.drawString(margin, y, line)
        y -= 5 * mm

    # Pied de page
    pdf.setFillColor(MUTED)
    pdf.setFont("SheetSans", 8)
    pdf.drawCentredString(width / 2, 9 * mm, FOOTER_TEXT)


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
