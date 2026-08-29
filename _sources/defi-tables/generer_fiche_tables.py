"""Génère la fiche A4 des tables et sa source DOCX modifiable.

Les textes à modifier en priorité sont regroupés juste sous les imports.
Le PDF public est ensuite produit depuis le DOCX avec render_docx.py.
"""

from pathlib import Path
import subprocess

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from reportlab.graphics import renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing


TITLE = "Mes tables de multiplication"
GUIDE_TITLE = "Pour commencer dans l’application"
GUIDE_STEPS = "J’apprends  >  choisis une table  >  dans l’ordre  >  dans le désordre"
APP_URL = "https://mathsgo.re/outils/calcul_mental/defi_tables.html"
TABLES = range(2, 11)
MULTIPLIERS = range(1, 11)

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DOCX = ROOT / "_sources" / "defi-tables" / "fiche_tables_multiplication.docx"
WORK_DIR = ROOT / "tmp" / "defi-tables-fiche"
QR_PATH = WORK_DIR / "qr-defi-tables.png"

INK = "143451"
BLUE = "0755B8"
TEAL = "087A71"
ORANGE = "E66D19"
MUTED = "506B7D"
LINE = "CFE2ED"
SOFT_BLUE = "F3F8FB"
WHITE = "FFFFFF"
CARD_WIDTHS_DXA = [3515, 3515, 3516]
CARD_TABLE_WIDTH_DXA = sum(CARD_WIDTHS_DXA)


def set_run_font(run, size, color=INK, bold=False, name="Calibri"):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    run.bold = bold


def set_repeatable_cell_margins(cell, top=90, start=110, bottom=90, end=110):
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


def set_cell_borders(cell, color=LINE, size=14):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.find(qn("w:tcBorders"))
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "start", "bottom", "end"):
        border = borders.find(qn(f"w:{edge}"))
        if border is None:
            border = OxmlElement(f"w:{edge}")
            borders.append(border)
        border.set(qn("w:val"), "single")
        border.set(qn("w:sz"), str(size))
        border.set(qn("w:space"), "4")
        border.set(qn("w:color"), color)


def set_table_geometry(table, widths_dxa):
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_pr = table._tbl.tblPr

    width = tbl_pr.find(qn("w:tblW"))
    if width is None:
        width = OxmlElement("w:tblW")
        tbl_pr.append(width)
    width.set(qn("w:w"), str(sum(widths_dxa)))
    width.set(qn("w:type"), "dxa")

    indent = tbl_pr.find(qn("w:tblInd"))
    if indent is None:
        indent = OxmlElement("w:tblInd")
        tbl_pr.append(indent)
    indent.set(qn("w:w"), "0")
    indent.set(qn("w:type"), "dxa")

    layout = tbl_pr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tbl_pr.append(layout)
    layout.set(qn("w:type"), "fixed")

    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for value in widths_dxa:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(value))
        grid.append(col)

    for row in table.rows:
        cant_split = OxmlElement("w:cantSplit")
        row._tr.get_or_add_trPr().append(cant_split)
        for cell, value in zip(row.cells, widths_dxa):
            tc_w = cell._tc.get_or_add_tcPr().find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                cell._tc.get_or_add_tcPr().append(tc_w)
            tc_w.set(qn("w:w"), str(value))
            tc_w.set(qn("w:type"), "dxa")


def add_qr(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    widget = QrCodeWidget(APP_URL)
    x0, y0, x1, y1 = widget.getBounds()
    source_width = x1 - x0
    source_height = y1 - y0
    target = 420
    drawing = Drawing(target, target, transform=[target / source_width, 0, 0, target / source_height, 0, 0])
    drawing.add(widget)
    svg_path = path.with_suffix(".svg")
    renderSVG.drawToFile(drawing, str(svg_path))
    subprocess.run(
        [
            "inkscape",
            str(svg_path),
            "--export-type=png",
            f"--export-filename={path}",
            "--export-width=420",
            "--export-height=420",
        ],
        check=True,
    )


def clear_default_paragraph(cell):
    paragraph = cell.paragraphs[0]
    paragraph.clear()
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(0)
    return paragraph


def add_table_card(cell, table_number, accent):
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_repeatable_cell_margins(cell, top=115, bottom=115)
    set_cell_fill(cell, WHITE if table_number % 2 == 0 else SOFT_BLUE)
    set_cell_borders(cell)

    heading = clear_default_paragraph(cell)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    heading.paragraph_format.space_after = Pt(4)
    run = heading.add_run(f"TABLE DE {table_number}")
    set_run_font(run, 13.5, accent, True)

    for multiplier in MULTIPLIERS:
        paragraph = cell.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.space_before = Pt(0)
        paragraph.paragraph_format.space_after = Pt(0)
        paragraph.paragraph_format.line_spacing = 1.05
        run = paragraph.add_run(f"{table_number} × {multiplier} = {table_number * multiplier}")
        set_run_font(run, 12, INK, multiplier in (1, 10))


def build_document():
    add_qr(QR_PATH)
    doc = Document()
    section = doc.sections[0]
    section.start_type = WD_SECTION.NEW_PAGE
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(1.05)
    section.bottom_margin = Cm(1.0)
    section.left_margin = Cm(1.2)
    section.right_margin = Cm(1.2)
    section.header_distance = Cm(0.5)
    section.footer_distance = Cm(0.45)

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    normal.font.size = Pt(11)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.25

    logo = doc.add_paragraph()
    logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    logo.paragraph_format.space_after = Pt(1)
    logo.add_run().add_picture(str(ROOT / "assets" / "img" / "mathsgo-logo.png"), width=Cm(3.15))

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_before = Pt(0)
    title.paragraph_format.space_after = Pt(2)
    run = title.add_run(TITLE)
    set_run_font(run, 22, INK, True)

    guide_title = doc.add_paragraph()
    guide_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    guide_title.paragraph_format.space_before = Pt(0)
    guide_title.paragraph_format.space_after = Pt(0)
    run = guide_title.add_run(GUIDE_TITLE)
    set_run_font(run, 10.5, TEAL, True)

    guide = doc.add_paragraph()
    guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    guide.paragraph_format.space_before = Pt(0)
    guide.paragraph_format.space_after = Pt(6)
    run = guide.add_run(GUIDE_STEPS)
    set_run_font(run, 10.5, MUTED, True)

    grid = doc.add_table(rows=3, cols=3)
    set_table_geometry(grid, CARD_WIDTHS_DXA)
    accents = [BLUE, TEAL, ORANGE]
    for index, table_number in enumerate(TABLES):
        row, col = divmod(index, 3)
        add_table_card(grid.cell(row, col), table_number, accents[index % len(accents)])

    qr = doc.add_paragraph()
    qr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    qr.paragraph_format.space_before = Pt(5)
    qr.paragraph_format.space_after = Pt(0)
    qr.add_run().add_picture(str(QR_PATH), width=Cm(1.35))
    text_run = qr.add_run("  Scanne pour ouvrir Défi tables sur mathsgo.re")
    set_run_font(text_run, 8.5, MUTED, True)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.paragraph_format.space_before = Pt(0)
    footer.paragraph_format.space_after = Pt(0)
    run = footer.add_run("mathsgo.re  ·  Gwenaël Bourgault")
    set_run_font(run, 8, MUTED, False)

    doc.core_properties.title = TITLE
    doc.core_properties.subject = "Fiche de révision des tables de multiplication"
    doc.core_properties.author = "Gwenaël Bourgault"
    OUTPUT_DOCX.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT_DOCX)


if __name__ == "__main__":
    build_document()
    print(OUTPUT_DOCX)
