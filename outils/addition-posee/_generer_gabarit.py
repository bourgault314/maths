from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
LOGO = ROOT / "assets/img/logos/mathsgo/logo-print.png"
OUTPUT = HERE / "gabarit-addition-posee.pdf"

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

INTEGER_MARKERS = ["dM", "uM", "cm", "dm", "um", "c", "d", "u"]
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


def build():
    register_fonts()
    c = canvas.Canvas(str(OUTPUT), pagesize=landscape(A4))
    c.setTitle("Gabarit d’addition posée")
    c.setAuthor("Gwenaël Bourgault - maths&go")
    c.setSubject("Gabarit A4 paysage à imprimer et plastifier")

    text(c, "Addition posée", 28, PAGE_HEIGHT - 43, 20.5, NAVY, "GoSerif-Bold")
    badge_w = 148
    badge_x = PAGE_WIDTH - 28 - badge_w
    panel(c, badge_x, PAGE_HEIGHT - 55, badge_w, 27, fill=TEAL_SOFT, stroke=TEAL_SOFT, radius=8)
    text(c, "ENTIERS OU DÉCIMAUX", badge_x + badge_w / 2, PAGE_HEIGHT - 46, 7.8, TEAL, "GoSans-Bold", "center")

    panel(c, 28, 65, PAGE_WIDTH - 56, 456, fill=WHITE, stroke=HexColor("#D2DFEB"), radius=12)

    grid_left = 154
    grid_right = PAGE_WIDTH - 46
    grid_width = grid_right - grid_left
    comma_width = 22
    digit_width = (grid_width - comma_width) / (len(INTEGER_MARKERS) + len(DECIMAL_MARKERS))
    segments = []
    cursor = grid_left
    for marker in INTEGER_MARKERS:
        segments.append(("digit", cursor, digit_width, marker))
        cursor += digit_width
    segments.append(("comma", cursor, comma_width, ","))
    cursor += comma_width
    for marker in DECIMAL_MARKERS:
        segments.append(("digit", cursor, digit_width, marker))
        cursor += digit_width

    marker_y = 481
    carry_y, carry_h = 397, 58
    first_y, term_h = 296, 82
    second_y = 198
    sum_y, sum_h = 91, 82

    row_label(c, "retenues", carry_y, VIOLET)
    row_label(c, "premier terme", first_y, BLUE)
    row_label(c, "second terme", second_y, TEAL)
    row_label(c, "somme", sum_y, ORANGE)
    text(c, "+", grid_left - 19, second_y + 27, 22, NAVY, "GoSans-Bold", "center")

    for kind, x, width, marker in segments:
        if kind == "comma":
            c.saveState()
            c.setFillColor(HexColor("#F4F6F8"))
            c.setStrokeColor(HexColor("#AEBAC7"))
            c.setLineWidth(0.8)
            c.setDash(2, 2)
            c.roundRect(x + 2, sum_y + 1.5, width - 4, carry_y + carry_h - sum_y - 3, 4, fill=1, stroke=1)
            c.restoreState()
            text(c, "virgule", x + width / 2, marker_y, 5.8, MUTED, "GoSans-Bold", "center")
            for baseline in (first_y + 18, second_y + 18, sum_y + 18):
                text(c, ",", x + width / 2, baseline, 22, NAVY, "GoSans-Bold", "center")
            continue

        text(c, marker, x + width / 2, marker_y, 6.6, MUTED, "GoSans-Bold", "center")
        rounded_cell(c, x, carry_y, width, carry_h, VIOLET_SOFT, HexColor("#CBB5E1"))
        rounded_cell(c, x, first_y, width, term_h, BLUE_SOFT, HexColor("#99C7EB"))
        rounded_cell(c, x, second_y, width, term_h, TEAL_SOFT, HexColor("#91D5CF"))
        rounded_cell(c, x, sum_y, width, sum_h, ORANGE_SOFT, HexColor("#F4B47D"))

    c.setStrokeColor(NAVY)
    c.setLineWidth(2.7)
    c.line(grid_left, sum_y + sum_h + 10, grid_right, sum_y + sum_h + 10)

    text(c, "u : unités", 43, 80, 6.5, MUTED, "GoSans")
    text(c, "La colonne grisée accueille la virgule si elle est nécessaire.", grid_right, 80, 6.5, MUTED, "GoSans", "right")
    footer(c)
    c.showPage()
    c.save()
    return OUTPUT


if __name__ == "__main__":
    print(build())
