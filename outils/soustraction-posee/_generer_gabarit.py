from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
LOGO = ROOT / "assets/img/logos/mathsgo/logo-print.png"
INTEGER_OUTPUT = HERE / "gabarit-soustraction-entiere.pdf"
DECIMAL_OUTPUT = HERE / "gabarit-soustraction-decimale.pdf"

PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)
NAVY = HexColor("#063F86")
INK = HexColor("#10294A")
MUTED = HexColor("#637287")
LINE = HexColor("#B8C8D8")
BLUE = HexColor("#0B67B2")
BLUE_SOFT = HexColor("#F3F9FE")
TEAL = HexColor("#08AAA5")
TEAL_SOFT = HexColor("#F0FAF8")
ORANGE = HexColor("#F58220")
ORANGE_SOFT = HexColor("#FFF8F1")
VIOLET = HexColor("#7B42B4")
VIOLET_SOFT = HexColor("#FAF6FE")
WHITE = HexColor("#FFFFFF")

INTEGER_ONLY_MARKERS = ["cM", "dM", "uM", "cm", "dm", "um", "c", "d", "u"]
DECIMAL_INTEGER_MARKERS = ["dM", "uM", "cm", "dm", "um", "c", "d", "u"]
DECIMAL_MARKERS = ["d", "c", "m", "dm", "cm", "mi"]


def register_fonts():
    fonts = {
        "GoSans": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "GoSans-Bold": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "GoSerif-Bold": "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    }
    for name, path in fonts.items():
        if name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(name, path))


def text(c, value, x, y, size=9, color=INK, font="GoSans", align="left"):
    c.setFillColor(color)
    c.setFont(font, size)
    if align == "center":
        c.drawCentredString(x, y, value)
    elif align == "right":
        c.drawRightString(x, y, value)
    else:
        c.drawString(x, y, value)


def panel(c, x, y, w, h, fill=WHITE, stroke=LINE, radius=10, line=0.8):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(line)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def role_box(c, x, y, w, h, role, color, soft):
    panel(c, x, y, w, h, fill=soft, stroke=color, radius=6, line=1.35)
    text(c, role, x + w / 2, y + h + 5, 6.8, MUTED, "GoSans-Bold", "center")


def title_line(c):
    y = PAGE_HEIGHT - 46
    title = "Soustraction posée de"
    text(c, title, 28, y, 20.5, NAVY, "GoSerif-Bold")
    title_width = pdfmetrics.stringWidth(title, "GoSerif-Bold", 20.5)
    first_x = 28 + title_width + 12
    box_width = 138
    box_y = y - 10
    role_box(c, first_x, box_y, box_width, 34, "premier terme", BLUE, BLUE_SOFT)
    and_x = first_x + box_width + 13
    text(c, "et", and_x, y, 15, NAVY, "GoSerif-Bold")
    role_box(c, and_x + 27, box_y, box_width, 34, "second terme", TEAL, TEAL_SOFT)


def footer(c):
    c.drawImage(str(LOGO), 28, 10, width=92, height=42, preserveAspectRatio=True, mask="auto")
    text(c, "mathsgo.re · CC BY-NC-SA 4.0", PAGE_WIDTH / 2, 20, 7.2, MUTED, "GoSans-Bold", "center")
    text(c, "Imprimer à 100 % · Gabarit plastifiable", PAGE_WIDTH - 28, 20, 6.8, MUTED, "GoSans", "right")


def rounded_cell(c, x, y, w, h, fill, stroke):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.95)
    c.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 4.5, fill=1, stroke=1)


def row_label(c, label, y, color):
    c.setFillColor(color)
    c.roundRect(43, y + 27, 7, 22, 3.5, fill=1, stroke=0)
    text(c, label, 58, y + 33, 7.3, color, "GoSans-Bold")


def build(decimal=False):
    register_fonts()
    output = DECIMAL_OUTPUT if decimal else INTEGER_OUTPUT
    label = "NOMBRES DÉCIMAUX" if decimal else "NOMBRES ENTIERS"
    number_kind = "décimaux" if decimal else "entiers"
    c = canvas.Canvas(str(output), pagesize=landscape(A4), pageCompression=0)
    c.setTitle(f"Gabarit de soustraction de nombres {number_kind}")
    c.setAuthor("Gwenaël Bourgault - maths&go")
    c.setSubject("Gabarit A4 paysage à imprimer et plastifier")
    c.setKeywords("mode=decimal;comma-column=yes" if decimal else "mode=integer;comma-column=no")

    title_line(c)
    badge_w = 148
    badge_x = PAGE_WIDTH - 28 - badge_w
    panel(c, badge_x, PAGE_HEIGHT - 55, badge_w, 27, fill=TEAL_SOFT, stroke=TEAL_SOFT, radius=8)
    text(c, label, badge_x + badge_w / 2, PAGE_HEIGHT - 46, 7.8, TEAL, "GoSans-Bold", "center")

    panel(c, 28, 65, PAGE_WIDTH - 56, 456, fill=WHITE, stroke=HexColor("#D2DFEB"), radius=12)

    grid_left = 154
    grid_right = PAGE_WIDTH - 46
    grid_width = grid_right - grid_left
    comma_width = 22 if decimal else 0
    integer_markers = DECIMAL_INTEGER_MARKERS if decimal else INTEGER_ONLY_MARKERS
    digit_count = len(integer_markers) + (len(DECIMAL_MARKERS) if decimal else 0)
    digit_width = (grid_width - comma_width) / digit_count
    segments = []
    cursor = grid_left
    for marker in integer_markers:
        segments.append(("digit", cursor, digit_width, marker))
        cursor += digit_width
    if decimal:
        segments.append(("comma", cursor, comma_width, ","))
        cursor += comma_width
        for marker in DECIMAL_MARKERS:
            segments.append(("digit", cursor, digit_width, marker))
            cursor += digit_width

    marker_y = 484
    exchange_y, exchange_h = 389, 70
    first_y, term_h = 292, 82
    second_y = 194
    difference_y, difference_h = 87, 82

    row_label(c, "échanges", exchange_y, VIOLET)
    row_label(c, "premier terme", first_y, BLUE)
    row_label(c, "second terme", second_y, TEAL)
    row_label(c, "différence", difference_y, ORANGE)
    text(c, "−", grid_left - 19, second_y + 27, 22, NAVY, "GoSans-Bold", "center")

    for kind, x, width, marker in segments:
        if kind == "comma":
            c.saveState()
            c.setFillColor(HexColor("#F4F6F8"))
            c.setStrokeColor(HexColor("#AEBAC7"))
            c.setLineWidth(0.8)
            c.setDash(2, 2)
            c.roundRect(
                x + 2,
                difference_y + 1.5,
                width - 4,
                exchange_y + exchange_h - difference_y - 3,
                4,
                fill=1,
                stroke=1,
            )
            c.restoreState()
            text(c, "virgule", x + width / 2, marker_y, 5.8, MUTED, "GoSans-Bold", "center")
            for baseline in (first_y + 18, second_y + 18, difference_y + 18):
                text(c, ",", x + width / 2, baseline, 22, NAVY, "GoSans-Bold", "center")
            continue

        text(c, marker, x + width / 2, marker_y, 6.6, MUTED, "GoSans-Bold", "center")
        rounded_cell(c, x, exchange_y, width, exchange_h, VIOLET_SOFT, HexColor("#CBB5E1"))
        rounded_cell(c, x, first_y, width, term_h, BLUE_SOFT, HexColor("#99C7EB"))
        rounded_cell(c, x, second_y, width, term_h, TEAL_SOFT, HexColor("#91D5CF"))
        rounded_cell(c, x, difference_y, width, difference_h, ORANGE_SOFT, HexColor("#F4B47D"))

    c.setStrokeColor(NAVY)
    c.setLineWidth(2.7)
    c.line(grid_left, difference_y + difference_h + 10, grid_right, difference_y + difference_h + 10)

    text(c, "u : unités", 43, 78, 6.5, MUTED, "GoSans")
    if decimal:
        text(c, "Les virgules s’alignent dans la colonne grisée.", grid_right, 78, 6.5, MUTED, "GoSans", "right")
    footer(c)
    c.showPage()
    c.save()
    return output


if __name__ == "__main__":
    print(build(decimal=False))
    print(build(decimal=True))
