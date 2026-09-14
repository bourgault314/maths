"""Génère les cartes recto verso des tables de multiplication (lot R5, 13/09/2026).

Pour chaque table de 2 à 10 : un PDF de deux pages A4 —
    page 1 (recto) = 12 cartes : les 11 calculs « 0 × 7 » … « 10 × 7 » et une
                     carte-titre « Table de 7 » ;
    page 2 (verso) = les réponses, disposées EN MIROIR (colonnes inversées) pour
                     qu'une impression recto verso « retourner sur le bord long »
                     mette chaque réponse au dos de son calcul.
Un onzième PDF, cartes_tables.pdf, réunit les neuf tables (18 pages, même
ordre recto/verso) : c'est celui du catalogue, pour imprimer tout un jeu.

Décision du 11/09/2026 (formation neurosciences) : des cartes à retourner, une
table à la fois, pour la réactivation active à la maison ou en classe. Le sens
d'écriture — 3 × 7, le multiplicateur d'abord — se lit « 3 fois 7 », trois
paquets de 7 : c'est ce que montrent la bande et les perles de l'application, et
c'est ce que dit maintenant l'écran « La table de N » (décision du 14/09/2026).
Il tient dans la seule fonction libelle() ci-dessous.

Règles du site : logo maths&go en bas à gauche (une seule fois par document,
page 1 : ces feuilles n'ont pas d'en-tête), signature « mathsgo.re · CC BY-NC-SA
4.0 » centrée en pied de chaque page, police DejaVu (chemin Linux du dépôt : le
PDF commité est le livrable, cette source est la trace modifiable).

    python3 _sources/defi-tables/generer_cartes_tables.py
"""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

TABLES = range(2, 11)
MULTIPLIERS = range(0, 11)
FOOTER_TEXT = "mathsgo.re  ·  CC BY-NC-SA 4.0"
CONSIGNE_RECTO = "Imprime en recto verso (retourner sur le bord long), puis découpe sur les pointillés."
CONSIGNE_VERSO = "Verso : les réponses, au dos de chaque calcul."
TITRE_VERSO = "Défi tables"
SOUS_TITRE_VERSO = "mathsgo.re"
# Le calcul tel qu'il est écrit sur le recto : le multiplicateur d'abord
# (3 × 7), comme la bande et l'écran « La table de N » de l'application.
def libelle(table: int, k: int) -> str:
    return f"{k} × {table}"

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "outils" / "calcul_mental"
LOGO = ROOT / "assets" / "img" / "mathsgo-logo-print.png"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

INK = HexColor("#143451")
BLUE = HexColor("#0B57B7")
TEAL = HexColor("#087F75")
MUTED = HexColor("#506B7D")
LINE = HexColor("#9DB4C4")
CARD = HexColor("#FFFFFF")
CARD_VERSO = HexColor("#E7F7F4")
CARD_TITRE = HexColor("#EEF5FB")

COLONNES, LIGNES = 3, 4
MARGE = 12 * mm
ECART = 5 * mm
PIED = 9 * mm          # place réservée en bas : logo + signature
WIDTH, HEIGHT = A4
CARTE_L = (WIDTH - 2 * MARGE - (COLONNES - 1) * ECART) / COLONNES
CARTE_H = (HEIGHT - 2 * MARGE - PIED - (LIGNES - 1) * ECART) / LIGNES


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Cartes", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("Cartes-Bold", FONT_BOLD))


def case(col: int, row: int) -> tuple[float, float]:
    """Coin bas-gauche de la carte (col, row), row 0 en haut."""
    x = MARGE + col * (CARTE_L + ECART)
    y = HEIGHT - MARGE - (row + 1) * CARTE_H - row * ECART
    return x, y


def cadre(pdf: canvas.Canvas, x: float, y: float, fill) -> None:
    pdf.setFillColor(fill)
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.7)
    pdf.setDash(3, 3)
    pdf.roundRect(x, y, CARTE_L, CARTE_H, 4 * mm, stroke=1, fill=1)
    pdf.setDash()


def carte_calcul(pdf: canvas.Canvas, col: int, row: int, table: int, k: int) -> None:
    x, y = case(col, row)
    cadre(pdf, x, y, CARD)
    pdf.setFillColor(INK)
    pdf.setFont("Cartes-Bold", 30)
    pdf.drawCentredString(x + CARTE_L / 2, y + CARTE_H / 2 - 10, libelle(table, k))
    pdf.setFillColor(MUTED)
    pdf.setFont("Cartes", 8)
    pdf.drawCentredString(x + CARTE_L / 2, y + 4 * mm, f"table de {table}")


def carte_reponse(pdf: canvas.Canvas, col: int, row: int, table: int, k: int) -> None:
    x, y = case(col, row)
    cadre(pdf, x, y, CARD_VERSO)
    pdf.setFillColor(MUTED)
    pdf.setFont("Cartes", 13)
    pdf.drawCentredString(x + CARTE_L / 2, y + CARTE_H / 2 + 9 * mm, f"{libelle(table, k)} =")
    pdf.setFillColor(TEAL)
    pdf.setFont("Cartes-Bold", 38)
    pdf.drawCentredString(x + CARTE_L / 2, y + CARTE_H / 2 - 7 * mm, str(table * k))


def carte_titre(pdf: canvas.Canvas, col: int, row: int, table: int) -> None:
    x, y = case(col, row)
    cadre(pdf, x, y, CARD_TITRE)
    pdf.setFillColor(BLUE)
    pdf.setFont("Cartes-Bold", 22)
    pdf.drawCentredString(x + CARTE_L / 2, y + CARTE_H / 2 + 2 * mm, "Table")
    pdf.setFont("Cartes-Bold", 34)
    pdf.drawCentredString(x + CARTE_L / 2, y + CARTE_H / 2 - 12 * mm, f"de {table}")
    pdf.setFillColor(MUTED)
    pdf.setFont("Cartes", 8)
    pdf.drawCentredString(x + CARTE_L / 2, y + 4 * mm, "11 cartes à retourner")


def carte_titre_verso(pdf: canvas.Canvas, col: int, row: int) -> None:
    x, y = case(col, row)
    cadre(pdf, x, y, CARD_TITRE)
    pdf.setFillColor(BLUE)
    pdf.setFont("Cartes-Bold", 20)
    pdf.drawCentredString(x + CARTE_L / 2, y + CARTE_H / 2 + 1 * mm, TITRE_VERSO)
    pdf.setFillColor(MUTED)
    pdf.setFont("Cartes", 11)
    pdf.drawCentredString(x + CARTE_L / 2, y + CARTE_H / 2 - 6 * mm, SOUS_TITRE_VERSO)


def pied(pdf: canvas.Canvas, consigne: str, logo: bool) -> None:
    pdf.setFillColor(MUTED)
    pdf.setFont("Cartes", 7.2)
    pdf.drawCentredString(WIDTH / 2, MARGE - 4 * mm, FOOTER_TEXT)
    pdf.setFont("Cartes", 8)
    pdf.drawCentredString(WIDTH / 2, MARGE + 1.5 * mm, consigne)
    if logo and LOGO.exists():
        pdf.drawImage(str(LOGO), MARGE, MARGE - 5 * mm, width=15 * mm, height=7 * mm,
                      preserveAspectRatio=True, anchor="sw", mask="auto")


def page_recto(pdf: canvas.Canvas, table: int, logo: bool) -> None:
    for index, k in enumerate(MULTIPLIERS):
        col, row = index % COLONNES, index // COLONNES
        carte_calcul(pdf, col, row, table, k)
    carte_titre(pdf, 2, 3, table)
    pied(pdf, CONSIGNE_RECTO, logo)
    pdf.showPage()


def page_verso(pdf: canvas.Canvas, table: int) -> None:
    # Miroir horizontal : la carte de la colonne c se retrouve en colonne 2 - c.
    for index, k in enumerate(MULTIPLIERS):
        col, row = index % COLONNES, index // COLONNES
        carte_reponse(pdf, COLONNES - 1 - col, row, table, k)
    carte_titre_verso(pdf, COLONNES - 1 - 2, 3)
    pied(pdf, CONSIGNE_VERSO, False)
    pdf.showPage()


def metadata(pdf: canvas.Canvas, titre: str) -> None:
    pdf.setTitle(titre)
    pdf.setSubject("Cartes recto verso à découper — Défi tables")
    pdf.setAuthor("Gwenaël Bourgault")
    pdf.setKeywords("tables, multiplication, cartes, calcul mental")


def build_table(table: int) -> Path:
    chemin = OUT_DIR / f"cartes_table_{table}.pdf"
    pdf = canvas.Canvas(str(chemin), pagesize=A4)
    metadata(pdf, f"Cartes de la table de {table}")
    page_recto(pdf, table, logo=True)
    page_verso(pdf, table)
    pdf.save()
    return chemin


def build_all() -> Path:
    chemin = OUT_DIR / "cartes_tables.pdf"
    pdf = canvas.Canvas(str(chemin), pagesize=A4)
    metadata(pdf, "Cartes des tables de multiplication, de 2 à 10")
    for index, table in enumerate(TABLES):
        page_recto(pdf, table, logo=index == 0)
        page_verso(pdf, table)
    pdf.save()
    return chemin


def main() -> None:
    register_fonts()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for table in TABLES:
        print(f"OK : {build_table(table).relative_to(ROOT)} (2 pages)")
    print(f"OK : {build_all().relative_to(ROOT)} ({2 * len(TABLES)} pages)")


if __name__ == "__main__":
    main()
