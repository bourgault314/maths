"""Génère le PDF publié à partir de la maquette validée.

Les textes amenés à évoluer sont regroupés au début du fichier. La maquette
source reste hors du site public dans ce même dossier ``_sources``.
"""

from io import BytesIO
from pathlib import Path

import fitz
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, NumberObject
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


TITLE_LINE_1 = "MES TABLES"
TITLE_LINE_2 = "DE MULTIPLICATION"
GUIDE_TITLE = "POUR COMMENCER SUR L’APPLICATION"
GUIDE_TEXT = "Suis le parcours : J’apprends  →  Je m’entraîne  →  Je deviens expert."
APP_URL = "https://mathsgo.re/outils/calcul_mental/defi_tables.html"
SITE_URL = "https://mathsgo.re"
FOOTER_TEXT = "mathsgo.re  ·  CC BY-NC-SA 4.0"

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).with_name("fiche_tables_multiplication_modele.pdf")
OUTPUT = ROOT / "outils" / "calcul_mental" / "fiche_tables_multiplication.pdf"

FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
NAVY = "#143756"
TEAL = "#087E78"
BOX_FILL = "#E6F5F3"
BOX_BORDER = "#A9E4DC"


def make_overlay(width: float, height: float) -> PdfReader:
    pdfmetrics.registerFont(TTFont("SheetSans", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("SheetSans-Bold", FONT_BOLD))

    stream = BytesIO()
    page = canvas.Canvas(stream, pagesize=(width, height))

    # Le titre est entièrement recomposé pour qu'aucune lettre ne soit rognée.
    page.setFillColorRGB(1, 1, 1)
    page.rect(120, 752, 365, 68, fill=1, stroke=0)
    page.setFillColor(NAVY)
    page.setFont("SheetSans-Bold", 20.2)
    page.drawString(126.0, 797.0, TITLE_LINE_1)
    page.setFont("SheetSans-Bold", 15.5)
    page.drawString(126.0, 775.0, TITLE_LINE_2)

    page.setFillColor(BOX_FILL)
    page.setStrokeColor(BOX_BORDER)
    page.setLineWidth(1.0)
    page.roundRect(26.5, 702.5, 452.5, 48.0, 7.5, fill=1, stroke=1)
    page.setFillColor(TEAL)
    page.setFont("SheetSans-Bold", 9.6)
    page.drawString(37.0, 735.2, GUIDE_TITLE)
    page.setFillColor(NAVY)
    page.setFont("SheetSans", 9.3)
    page.drawString(37.0, 715.8, GUIDE_TEXT)

    page.setFillColor("#526C80")
    page.setFont("SheetSans", 7.2)
    page.drawCentredString(width / 2, 9.2, FOOTER_TEXT)
    page.save()
    stream.seek(0)
    return PdfReader(stream)


def build_pdf() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    source_document = fitz.open(SOURCE)
    source_page = source_document[0]
    source_page.add_redact_annot(fitz.Rect(120, 22, 485, 90), fill=(1, 1, 1))
    source_page.add_redact_annot(fitz.Rect(26, 91, 480, 140), fill=(1, 1, 1))
    source_page.apply_redactions(
        images=fitz.PDF_REDACT_IMAGE_NONE,
        graphics=fitz.PDF_REDACT_LINE_ART_NONE,
        text=fitz.PDF_REDACT_TEXT_REMOVE,
    )
    source_bytes = source_document.tobytes(garbage=4, deflate=True)
    source_document.close()

    reader = PdfReader(BytesIO(source_bytes))
    published_page = reader.pages[0]
    width = float(published_page.mediabox.width)
    height = float(published_page.mediabox.height)
    published_page.merge_page(make_overlay(width, height).pages[0])

    writer = PdfWriter()
    writer.add_page(published_page)
    writer.add_metadata(
        {
            "/Title": "Mes tables de multiplication",
            "/Subject": "Fiche de révision des tables de multiplication",
            "/Keywords": "tables, multiplication, calcul mental",
            "/Author": "Gwenaël Bourgault",
        }
    )
    no_border = ArrayObject([NumberObject(0), NumberObject(0), NumberObject(0)])
    writer.add_uri(0, APP_URL, (487, 730, 571, 819), border=no_border)
    writer.add_uri(0, SITE_URL, (255, 5, 340, 19), border=no_border)
    with OUTPUT.open("wb") as handle:
        writer.write(handle)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
