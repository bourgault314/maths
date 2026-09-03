from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
LOGO = ROOT / "assets/img/logos/mathsgo/logo-print.png"

NAVY = HexColor("#063F86")
INK = HexColor("#10294A")
MUTED = HexColor("#637287")
LINE = HexColor("#D8E2EC")
BLUE = HexColor("#0B67B2")
BLUE_SOFT = HexColor("#EAF5FF")
TEAL = HexColor("#08AAA5")
TEAL_SOFT = HexColor("#E8F8F5")
ORANGE = HexColor("#F58220")
ORANGE_SOFT = HexColor("#FFF2E7")
VIOLET = HexColor("#7B42B4")
VIOLET_SOFT = HexColor("#F5EDFF")
WHITE = HexColor("#FFFFFF")


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


def role_box(c, x, y, w, h, role, color, soft, label_below=True):
    panel(c, x, y, w, h, fill=soft, stroke=color, radius=6, line=1.35)
    if label_below:
        text(c, role, x + w / 2, y - 13, 7.2, MUTED, "GoSans-Bold", "center")


def dotted_line(c, x1, y, x2):
    c.saveState()
    c.setStrokeColor(MUTED)
    c.setLineWidth(0.8)
    c.setDash(1, 2.3)
    c.line(x1, y, x2, y)
    c.restoreState()


def footer(c):
    c.drawImage(str(LOGO), 28, 13, width=102, height=47, preserveAspectRatio=True, mask="auto")
    text(c, "mathsgo.re · CC BY-NC-SA 4.0", A4[0] / 2, 24, 7.2, MUTED, "GoSans-Bold", "center")
    text(c, "Gabarit plastifiable · feutre effaçable", A4[0] - 28, 24, 6.8, MUTED, "GoSans", "right")


def title_line(c, decimal):
    y = A4[1] - 48
    title = "Division décimale de" if decimal else "Division euclidienne de"
    text(c, title, 28, y, 19.5, NAVY, "GoSerif-Bold")
    title_width = pdfmetrics.stringWidth(title, "GoSerif-Bold", 19.5)
    x_dividend = 28 + title_width + 12
    role_box(c, x_dividend, y - 9, 99, 34, "dividende", BLUE, BLUE_SOFT)
    text(c, "par", x_dividend + 111, y, 15, NAVY, "GoSerif-Bold")
    role_box(c, x_dividend + 146, y - 9, 76, 34, "diviseur", TEAL, TEAL_SOFT)


def anticipation(c, decimal):
    x, y, w, h = 28, 700, A4[0] - 56, 48
    panel(c, x, y, w, h, fill=ORANGE_SOFT, stroke=ORANGE_SOFT, radius=9)
    text(c, "J’ANTICIPE", x + 15, y + 18, 8.2, ORANGE, "GoSans-Bold")
    if decimal:
        text(c, "quotient à", x + 118, y + 17, 9.2)
        dotted_line(c, x + 182, y + 15, x + 211)
        text(c, "décimales", x + 217, y + 17, 9.2)
        estimate_x = x + 310
    else:
        text(c, "quotient à", x + 118, y + 17, 9.2)
        dotted_line(c, x + 182, y + 15, x + 211)
        text(c, "chiffres", x + 217, y + 17, 9.2)
        estimate_x = x + 290
    text(c, "estimation", estimate_x, y + 17, 9.2)
    dotted_line(c, estimate_x + 67, y + 15, estimate_x + 101)
    text(c, "÷", estimate_x + 111, y + 15, 12, NAVY, "GoSans-Bold", "center")
    dotted_line(c, estimate_x + 123, y + 15, estimate_x + 157)
    text(c, "≈", estimate_x + 169, y + 15, 12, NAVY, "GoSans-Bold", "center")
    dotted_line(c, estimate_x + 181, y + 15, x + w - 14)


def operation_area(c):
    x, y, w, h = 28, 263, 386, 418
    panel(c, x, y, w, h, fill=WHITE, stroke=LINE, radius=11)
    text(c, "JE POSE", x + 15, y + h - 25, 8.2, BLUE, "GoSans-Bold")

    grid_left, grid_right = x + 31, x + 256
    grid_bottom, grid_top = y + 47, y + h - 72
    cell = 25
    c.setStrokeColor(HexColor("#D7E6F6"))
    c.setLineWidth(0.35)
    xx = grid_right
    while xx >= grid_left:
        c.line(xx, grid_bottom, xx, grid_top)
        xx -= cell
    yy = grid_top
    while yy >= grid_bottom:
        c.line(grid_left, yy, grid_right, yy)
        yy -= cell

    pot_x = x + 269
    pot_y = y + h - 127
    c.setStrokeColor(NAVY)
    c.setLineWidth(2.2)
    c.line(pot_x, pot_y + 46, pot_x, y + 51)
    c.line(pot_x, pot_y, x + w - 17, pot_y)

    role_box(c, x + 87, pot_y + 15, 115, 43, "dividende", BLUE, BLUE_SOFT)
    role_box(c, pot_x + 17, pot_y + 15, 82, 43, "diviseur", TEAL, TEAL_SOFT)
    role_box(c, pot_x + 17, pot_y - 68, 82, 43, "quotient", ORANGE, ORANGE_SOFT)
    role_box(c, x + 101, y + 55, 95, 43, "reste", VIOLET, VIOLET_SOFT)
    return x, y, w, h


def divisor_table(c):
    x, y, w, h = 426, 263, A4[0] - 454, 418
    panel(c, x, y, w, h, fill=WHITE, stroke=LINE, radius=11)
    text(c, "TABLE DE", x + 14, y + h - 25, 8.2, ORANGE, "GoSans-Bold")
    dotted_line(c, x + 68, y + h - 27, x + w - 13)
    top = y + h - 58
    row_h = 30.5
    for multiplier in range(11):
        row_y = top - multiplier * row_h
        if multiplier % 2 == 0:
            c.setFillColor(BLUE_SOFT if multiplier not in (0, 10) else ORANGE_SOFT)
            c.roundRect(x + 9, row_y - 20, w - 18, 25, 5, stroke=0, fill=1)
        text(c, f"× {multiplier}", x + 19, row_y - 13, 8.7, INK, "GoSans")
        text(c, "=", x + 55, row_y - 13, 8.7, MUTED, "GoSans")
        dotted_line(c, x + 69, row_y - 14, x + w - 15)


def verification(c, decimal):
    x, y, w, h = 28, 84, A4[0] - 56, 158
    panel(c, x, y, w, h, fill=BLUE_SOFT, stroke=BLUE_SOFT, radius=11)
    text(c, "JE VÉRIFIE", x + 15, y + h - 25, 8.2, BLUE, "GoSans-Bold")
    box_w, box_h = 91, 38
    positions = [x + 15, x + 134, x + 269, x + 404]
    roles = [
        ("dividende", BLUE, BLUE_SOFT),
        ("quotient", ORANGE, ORANGE_SOFT),
        ("diviseur", TEAL, TEAL_SOFT),
        ("reste", VIOLET, VIOLET_SOFT),
    ]
    formula_y = y + 62
    for px, (role, color, soft) in zip(positions, roles):
        role_box(c, px, formula_y, box_w, box_h, role, color, WHITE)
    signs = [(x + 120, "="), (x + 254, "×"), (x + 389, "+")]
    for px, sign in signs:
        text(c, sign, px, formula_y + 12, 15, NAVY, "GoSans-Bold", "center")
    note = "reste = 0 si la division est exacte" if decimal else "0 ≤ reste < diviseur"
    text(c, note, x + w - 15, y + 13, 7.2, MUTED, "GoSans-Bold", "right")


def build(decimal=False):
    register_fonts()
    name = "gabarit-division-decimale.pdf" if decimal else "gabarit-division-euclidienne.pdf"
    output = HERE / name
    c = canvas.Canvas(str(output), pagesize=A4)
    label = "décimale" if decimal else "euclidienne"
    c.setTitle(f"Gabarit de division {label}")
    c.setAuthor("Gwenaël Bourgault — maths&go")
    c.setSubject("Gabarit A4 à imprimer et plastifier")
    title_line(c, decimal)
    anticipation(c, decimal)
    operation_area(c)
    divisor_table(c)
    verification(c, decimal)
    footer(c)
    c.showPage()
    c.save()
    return output


if __name__ == "__main__":
    for result in (build(False), build(True)):
        print(result)
