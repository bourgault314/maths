"""Génère la fiche A4 « Mes tables de multiplication » (PDF publié) et sa source DOCX.

Sorties :
  - outils/calcul_mental/fiche_tables_multiplication.pdf   (le PDF publié, dessiné ici)
  - _sources/defi-tables/fiche_tables_multiplication.docx  (la même fiche, à ouvrir
    et modifier dans Word ou LibreOffice)

Lot 5 de l'audit (01/10/2026) :
  - les tables s'écrivent « 3 × 7 = 21 » (multiplicateur × table), de 0 à 10,
    comme les cartes et l'écran « Lire la table » de l'appli ;
  - un seul logo, en haut à droite (fiche à en-tête), le QR à gauche, comme la
    fiche « Mon parcours des tables » ;
  - en-têtes de cartes assez foncés pour le noir et blanc ;
  - le PDF est dessiné directement (reportlab) : il n'y a plus de PDF modèle
    recouvert d'un calque (fiche_tables_multiplication_modele.pdf est retiré ;
    generer_pdf.py, que lance la publication du site, appelle build_pdf d'ici).

Les textes qui seront le plus souvent adaptés sont regroupés juste en dessous.

Usage : python3 _sources/defi-tables/generer_fiche_tables.py
"""

from io import BytesIO
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# ------------------------------------------------------------------ les textes
TITLE_LINE_1 = "MES TABLES"
TITLE_LINE_2 = "DE MULTIPLICATION"
GUIDE_TITLE = "POUR COMMENCER SUR L’APPLICATION"
GUIDE_TEXT = "Chaque jour, fais Ma séance du jour : quelques minutes suffisent."
GUIDE_TEXT_2 = "Quand toutes les cases de ta table sont pleines, passe le test."
QR_LABEL = "DÉFI TABLES"
APP_URL = "https://mathsgo.re/outils/calcul_mental/defi_tables.html"
SITE_URL = "https://mathsgo.re"
FOOTER_TEXT = "mathsgo.re  ·  CC BY-NC-SA 4.0"
TABLES = range(2, 11)
# Le sens retenu partout dans Défi tables : « multiplicateur × table »
# (« 3 × 7 » dans la table de 7), de 0 à 10 — comme les cartes et « Lire la table ».
MULTIPLIERS = range(0, 11)

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PDF = ROOT / "outils" / "calcul_mental" / "fiche_tables_multiplication.pdf"
OUTPUT_DOCX = ROOT / "_sources" / "defi-tables" / "fiche_tables_multiplication.docx"
LOGO = ROOT / "assets" / "img" / "mathsgo-logo-print.png"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Couleurs : les trois en-têtes de colonne restent distincts en couleur et
# assez foncés pour porter du blanc et sortir en gris franc en noir et blanc
# (l'orange d'avant, #E66D0A, sortait gris clair). Tout texte est foncé.
INK = "143451"
TEAL = "087F75"
BLUE = "0B57B7"
ORANGE = "A84B05"
MUTED = "3F5A6C"
LINE = "CFE2ED"
PALE_TEAL = "E7F7F4"
TEAL_LINE = "A9E4DC"
WHITE = "FFFFFF"
TINTS = {TEAL: "E8F6F3", BLUE: "EEF5FB", ORANGE: "FDF0E6"}
ACCENTS = [TEAL, BLUE, ORANGE]


def libelle(table: int, k: int) -> str:
    """« 3 × 7 » : le multiplicateur d'abord, la table ensuite."""
    return f"{k} × {table}"


def qr_drawing(size: float) -> Drawing:
    widget = QrCodeWidget(APP_URL, barLevel="M")
    x1, y1, x2, y2 = widget.getBounds()
    drawing = Drawing(size, size, transform=[size / (x2 - x1), 0, 0, size / (y2 - y1), 0, 0])
    drawing.add(widget)
    return drawing


def hexa(code: str) -> HexColor:
    return HexColor("#" + code)


# ------------------------------------------------------------------ le PDF
def build_pdf() -> None:
    pdfmetrics.registerFont(TTFont("SheetSans", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("SheetSans-Bold", FONT_BOLD))
    width, height = A4
    margin = 10 * mm
    top = height - 10 * mm
    inner_w = width - 2 * margin

    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT_PDF), pagesize=A4)
    pdf.setTitle("Mes tables de multiplication")
    pdf.setSubject("Fiche de révision des tables de multiplication")
    pdf.setKeywords("tables, multiplication, calcul mental")
    pdf.setAuthor("Gwenaël Bourgault")

    # En-tête : QR à gauche, titre au centre, logo à droite (un seul logo).
    qr_size = 21 * mm
    qr_x = margin - 1 * mm
    renderPDF.draw(qr_drawing(qr_size), pdf, qr_x, top - qr_size + 1 * mm)
    pdf.setFillColor(hexa(INK))
    pdf.setFont("SheetSans-Bold", 7.5)
    pdf.drawCentredString(qr_x + qr_size / 2, top - qr_size - 1.6 * mm, QR_LABEL)
    pdf.linkURL(APP_URL, (qr_x, top - qr_size - 3 * mm, qr_x + qr_size, top + 1 * mm), relative=0, thickness=0)
    pdf.setFillColor(hexa(INK))
    pdf.setFont("SheetSans-Bold", 21)
    pdf.drawCentredString(width / 2, top - 9 * mm, TITLE_LINE_1)
    pdf.setFont("SheetSans-Bold", 15.5)
    pdf.drawCentredString(width / 2, top - 16.5 * mm, TITLE_LINE_2)
    logo_w = 34 * mm
    pdf.drawImage(str(LOGO), width - margin - logo_w, top - 17.5 * mm, width=logo_w,
                  height=logo_w * 195 / 420, mask="auto")

    # L'encadré « Pour commencer sur l'application »
    guide_h = 16 * mm
    guide_y = top - 26 * mm - guide_h
    pdf.setFillColor(hexa(PALE_TEAL))
    pdf.setStrokeColor(hexa(TEAL_LINE))
    pdf.setLineWidth(1)
    pdf.roundRect(margin, guide_y, inner_w, guide_h, 3 * mm, stroke=1, fill=1)
    pdf.setFillColor(hexa(TEAL))
    pdf.setFont("SheetSans-Bold", 9.6)
    pdf.drawString(margin + 4 * mm, guide_y + guide_h - 5.2 * mm, GUIDE_TITLE)
    pdf.setFillColor(hexa(INK))
    pdf.setFont("SheetSans", 9.3)
    pdf.drawString(margin + 4 * mm, guide_y + guide_h - 10 * mm, GUIDE_TEXT)
    pdf.drawString(margin + 4 * mm, guide_y + guide_h - 14.2 * mm, GUIDE_TEXT_2)

    # Les neuf cartes, 3 × 3. Chaque ligne est alignée sur le signe « = » :
    # « 10 × 7 » se termine au même endroit que « 0 × 7 ».
    gap = 4 * mm
    card_w = (inner_w - 2 * gap) / 3
    head_h = 9 * mm
    cards_top = guide_y - 4 * mm
    # Les cartes descendent jusqu'à 13 mm du bas, au-dessus de la signature.
    card_h = (cards_top - 13 * mm - 2 * gap) / 3
    line_h = (card_h - head_h - 1.5 * mm) / len(MULTIPLIERS)
    for index, table in enumerate(TABLES):
        row, col = divmod(index, 3)
        accent = ACCENTS[col]
        x = margin + col * (card_w + gap)
        y = cards_top - row * (card_h + gap) - card_h
        # le cadre blanc
        pdf.setFillColor(hexa(WHITE))
        pdf.setStrokeColor(hexa(LINE))
        pdf.setLineWidth(0.9)
        pdf.roundRect(x, y, card_w, card_h, 2.6 * mm, stroke=1, fill=1)
        # l'en-tête coloré (coins du haut arrondis seulement)
        pdf.setFillColor(hexa(accent))
        path = pdf.beginPath()
        r = 2.6 * mm
        hy = y + card_h - head_h
        path.moveTo(x, hy)
        path.lineTo(x, y + card_h - r)
        path.arcTo(x, y + card_h - 2 * r, x + 2 * r, y + card_h, 180, -90)
        path.lineTo(x + card_w - r, y + card_h)
        path.arcTo(x + card_w - 2 * r, y + card_h - 2 * r, x + card_w, y + card_h, 90, -90)
        path.lineTo(x + card_w, hy)
        path.close()
        pdf.drawPath(path, stroke=0, fill=1)
        pdf.setFillColor(hexa(WHITE))
        pdf.setFont("SheetSans-Bold", 12.5)
        pdf.drawCentredString(x + card_w / 2, hy + 2.7 * mm, f"TABLE DE {table}")
        # les onze lignes, une sur deux teintée
        egal = x + card_w / 2 + 1.5 * mm
        for rang, k in enumerate(MULTIPLIERS):
            ly = hy - (rang + 1) * line_h
            if rang % 2:
                pdf.setFillColor(hexa(TINTS[accent]))
                pdf.rect(x + 1.2 * mm, ly, card_w - 2.4 * mm, line_h, stroke=0, fill=1)
            pdf.setFillColor(hexa(INK))
            pdf.setFont("SheetSans", 11.5)
            base = ly + line_h / 2 - 1.45 * mm
            pdf.drawRightString(egal - 3.2 * mm, base, libelle(table, k))
            pdf.drawCentredString(egal, base, "=")
            pdf.drawString(egal + 3.2 * mm, base, str(table * k))

    # Pied : la signature seule (le logo est en haut).
    pdf.setFillColor(hexa(MUTED))
    pdf.setFont("SheetSans", 7.7)
    pdf.drawCentredString(width / 2, 7 * mm, FOOTER_TEXT)
    pied_w = pdfmetrics.stringWidth(FOOTER_TEXT, "SheetSans", 7.7)
    pdf.linkURL(SITE_URL, (width / 2 - pied_w / 2, 5.5 * mm, width / 2 + pied_w / 2, 10 * mm), relative=0, thickness=0)
    pdf.showPage()
    pdf.save()


# ------------------------------------------------------------------ le DOCX
# python-docx n'est importé que pour le DOCX : la publication du site
# (.github/workflows/publier.yml, par generer_pdf.py) ne refait que le PDF et
# n'installe que reportlab.
try:
    from docx import Document
    from docx.enum.section import WD_SECTION
    from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_ROW_HEIGHT_RULE, WD_TABLE_ALIGNMENT
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt, RGBColor
except ImportError:  # pragma: no cover - seulement sur la machine de publication
    Document = None

def set_run_font(run, size, color=INK, bold=False, name="Arial"):
    run.font.name = name
    r_pr = run._element.get_or_add_rPr()
    r_pr.rFonts.set(qn("w:ascii"), name)
    r_pr.rFonts.set(qn("w:hAnsi"), name)
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    run.bold = bold


def set_cell_margins(cell, top=0, start=0, bottom=0, end=0):
    tc_pr = cell._tc.get_or_add_tcPr()
    margins = tc_pr.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        tc_pr.append(margins)
    for edge, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = margins.find(qn(f"w:{edge}"))
        if node is None:
            node = OxmlElement(f"w:{edge}")
            margins.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_fill(cell, color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shading = tc_pr.find(qn("w:shd"))
    if shading is None:
        shading = OxmlElement("w:shd")
        tc_pr.append(shading)
    shading.set(qn("w:fill"), color)


def set_cell_borders(cell, *, top=None, start=None, bottom=None, end=None, size=10):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.find(qn("w:tcBorders"))
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge, color in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        border = borders.find(qn(f"w:{edge}"))
        if border is None:
            border = OxmlElement(f"w:{edge}")
            borders.append(border)
        border.set(qn("w:val"), "nil" if color is None else "single")
        if color is not None:
            border.set(qn("w:sz"), str(size))
            border.set(qn("w:space"), "0")
            border.set(qn("w:color"), color)


def set_table_geometry(table, widths_dxa, indent=0):
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_pr = table._tbl.tblPr
    for tag, attrs in (("w:tblW", {"w:w": str(sum(widths_dxa)), "w:type": "dxa"}),
                       ("w:tblInd", {"w:w": str(indent), "w:type": "dxa"}),
                       ("w:tblLayout", {"w:type": "fixed"})):
        node = tbl_pr.find(qn(tag))
        if node is None:
            node = OxmlElement(tag)
            tbl_pr.append(node)
        for key, value in attrs.items():
            node.set(qn(key), value)
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for value in widths_dxa:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(value))
        grid.append(col)
    for row in table.rows:
        row._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
        for cell, value in zip(row.cells, widths_dxa):
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(value))
            tc_w.set(qn("w:type"), "dxa")


def set_row_height(row, centimetres):
    row.height = Cm(centimetres)
    row.height_rule = WD_ROW_HEIGHT_RULE.EXACTLY


def clear_paragraph(paragraph):
    for child in list(paragraph._p):
        if child.tag != qn("w:pPr"):
            paragraph._p.remove(child)
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(0)
    return paragraph


def qr_png() -> BytesIO:
    """Le même QR en image (pour le DOCX), dessiné module par module."""
    from PIL import Image
    code = QrCodeWidget(APP_URL, barLevel="M").qr
    code.make()
    n = code.getModuleCount()
    cote, bord = 12, 2
    image = Image.new("1", ((n + 2 * bord) * cote,) * 2, 1)
    for ligne in range(n):
        for colonne in range(n):
            if code.modules[ligne][colonne]:
                x, y = (colonne + bord) * cote, (ligne + bord) * cote
                image.paste(0, (x, y, x + cote, y + cote))
    sortie = BytesIO()
    image.save(sortie, format="PNG")
    sortie.seek(0)
    return sortie


# Où tombe le signe « = » dans une carte du DOCX, depuis son bord gauche : un
# peu à droite du milieu (la carte fait 5,43 cm), comme sur le PDF.
EGAL_CM = 2.95


def add_card(cell, table_number, accent):
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_margins(cell, top=45, start=55, bottom=45, end=55)
    set_cell_borders(cell)
    clear_paragraph(cell.paragraphs[0])
    card = cell.add_table(rows=len(MULTIPLIERS) + 1, cols=1)
    set_table_geometry(card, [3160])
    for index, row in enumerate(card.rows):
        set_row_height(row, 0.52 if index else 0.8)
        card_cell = row.cells[0]
        card_cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_margins(card_cell, top=0, start=40, bottom=0, end=40)
        set_cell_borders(card_cell, top=LINE if index == 0 else None, start=LINE,
                         bottom=LINE if index == len(MULTIPLIERS) else None, end=LINE, size=9)
        paragraph = clear_paragraph(card_cell.paragraphs[0])
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if index == 0:
            set_cell_fill(card_cell, accent)
            set_run_font(paragraph.add_run(f"TABLE DE {table_number}"), 12.5, WHITE, True)
        else:
            k = MULTIPLIERS[index - 1]
            set_cell_fill(card_cell, TINTS[accent] if index % 2 == 0 else WHITE)
            # Aligné sur « = », comme le PDF (lot 2b) : le calcul finit avant
            # le signe, le résultat commence après — trois taquets.
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
            taquets = paragraph.paragraph_format.tab_stops
            taquets.add_tab_stop(Cm(EGAL_CM - 0.32), WD_TAB_ALIGNMENT.RIGHT)
            taquets.add_tab_stop(Cm(EGAL_CM), WD_TAB_ALIGNMENT.CENTER)
            taquets.add_tab_stop(Cm(EGAL_CM + 0.32), WD_TAB_ALIGNMENT.LEFT)
            set_run_font(paragraph.add_run(f"\t{libelle(table_number, k)}\t=\t{table_number * k}"), 11, INK)


def build_docx() -> None:
    doc = Document()
    section = doc.sections[0]
    section.start_type = WD_SECTION.NEW_PAGE
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(0.8)
    section.bottom_margin = Cm(0.7)
    section.left_margin = Cm(0.92)
    section.right_margin = Cm(0.92)
    section.header_distance = Cm(0.3)
    section.footer_distance = Cm(0.32)
    normal = doc.styles["Normal"]
    normal.font.name = "Arial"
    normal.font.size = Pt(10)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(0)
    normal.paragraph_format.line_spacing = 1

    # En-tête : QR à gauche, titre, logo à droite.
    header = doc.add_table(rows=1, cols=3)
    set_table_geometry(header, [2000, 7100, 2000])
    set_row_height(header.rows[0], 2.45)
    for cell in header.rows[0].cells:
        set_cell_margins(cell)
        set_cell_borders(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    qr_cell = header.cell(0, 0)
    qr_paragraph = clear_paragraph(qr_cell.paragraphs[0])
    qr_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    qr_paragraph.add_run().add_picture(qr_png(), width=Cm(1.75))
    qr_label = qr_cell.add_paragraph()
    qr_label.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(qr_label.add_run(QR_LABEL), 7.5, INK, True)
    title = clear_paragraph(header.cell(0, 1).paragraphs[0])
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.line_spacing = 0.95
    set_run_font(title.add_run(TITLE_LINE_1 + "\n"), 19.5, INK, True)
    set_run_font(title.add_run(TITLE_LINE_2), 15.5, INK, True)
    logo = clear_paragraph(header.cell(0, 2).paragraphs[0])
    logo.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    logo.add_run().add_picture(str(LOGO), width=Cm(3.3))

    guide = doc.add_table(rows=1, cols=1)
    set_table_geometry(guide, [11100])
    set_row_height(guide.rows[0], 1.5)
    guide_cell = guide.cell(0, 0)
    guide_cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_margins(guide_cell, top=70, start=180, bottom=65, end=180)
    set_cell_fill(guide_cell, PALE_TEAL)
    set_cell_borders(guide_cell, top=TEAL_LINE, start=TEAL_LINE, bottom=TEAL_LINE, end=TEAL_LINE)
    set_run_font(clear_paragraph(guide_cell.paragraphs[0]).add_run(GUIDE_TITLE), 10, TEAL, True)
    for texte in (GUIDE_TEXT, GUIDE_TEXT_2):
        set_run_font(guide_cell.add_paragraph().add_run(texte), 9.5, INK)

    spacer = doc.add_paragraph()
    spacer.paragraph_format.line_spacing = 0.25
    set_run_font(spacer.add_run(" "), 3)

    grid = doc.add_table(rows=3, cols=3)
    set_table_geometry(grid, [3700, 3700, 3700])
    for row in grid.rows:
        set_row_height(row, 7.05)
    for index, table_number in enumerate(TABLES):
        row, col = divmod(index, 3)
        add_card(grid.cell(row, col), table_number, ACCENTS[col])

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(footer.add_run(FOOTER_TEXT), 7.7, MUTED)

    doc.core_properties.title = "Mes tables de multiplication"
    doc.core_properties.subject = "Fiche de révision des tables de multiplication"
    doc.core_properties.author = "Gwenaël Bourgault"
    doc.core_properties.keywords = "tables, multiplication, calcul mental"
    OUTPUT_DOCX.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT_DOCX)


if __name__ == "__main__":
    build_pdf()
    # Le PDF est refait à ce moment-là. Sans python-docx, on le dit clairement
    # au lieu de s'arrêter sur « 'NoneType' object is not callable ».
    if Document is None:
        raise SystemExit(f"OK : {OUTPUT_PDF.relative_to(ROOT)} est refait. Le DOCX ne l'est pas : "
                         "il manque python-docx (pip install python-docx), puis relance ce script.")
    build_docx()
    print(f"OK : {OUTPUT_PDF.relative_to(ROOT)} et {OUTPUT_DOCX.relative_to(ROOT)}")
