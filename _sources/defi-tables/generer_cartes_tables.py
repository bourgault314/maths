"""Génère les cartes recto verso des tables de multiplication.

Pour chaque table de 2 à 10 : un PDF de deux pages A4 —
    page 1 (recto) = 12 cartes : les 11 calculs « 0 × 7 » … « 10 × 7 » et une
                     carte-titre « table de 7 » ;
    page 2 (verso) = les réponses, disposées EN MIROIR (colonnes inversées) pour
                     qu'une impression recto verso « retourner sur le bord long »
                     mette chaque réponse au dos de son calcul.
Un onzième PDF, cartes_tables.pdf, réunit les neuf tables (18 pages, même
ordre recto/verso) : c'est celui du catalogue, pour imprimer tout un jeu.

Décision du 11/09/2026 (formation neurosciences) : des cartes à retourner, une
table à la fois, pour la réactivation active à la maison ou en classe. Le sens
d'écriture — 3 × 7, le multiplicateur d'abord — se lit « 3 fois 7 », trois
paquets de 7 : c'est ce que montrent la bande et les perles de l'application, et
c'est ce que dit l'écran « La table de N » (décision du 14/09/2026). Il tient
dans la seule fonction libelle() ci-dessous.

Version 2 (18/10/2026, idée d'un ami de Gwenaël : une couleur par table pour
trier le paquet quand on imprime toutes les tables) :
  - chaque table a sa couleur, prise dans les bandes de fractions de maths&go :
    le cadre du recto, et le dos teinté de cette couleur (un seul PDF pour la
    couleur et le noir et blanc) ;
  - recto épuré : le calcul seul dans son cadre ; le petit « table de 7 » passe
    en bas du DOS (idée de Gwenaël), pour trier aussi en noir et blanc sans
    distraire la question ;
  - dos teinté, plus foncé que le recto comme sur un jeu de cartes : on voit
    d'un coup d'œil de quel côté est la carte ; les cartes teintées restent
    séparées par du blanc (cadres en retrait du trait de coupe), ce qui
    absorbe aussi un décalage recto/verso de l'imprimante ;
  - cartes bord à bord, traits de coupe droits : ciseaux, rogneuse, massicot ;
  - carte-titre : « table de » en petit, le numéro seul en très grand ;
  - retirés : « Verso : les réponses… » et « 11 cartes à retourner » ; la
    consigne d'impression reste sur le recto (on la lit à l'écran, avant
    d'imprimer), avec le papier épais : sur du 80 g, la réponse se voit par
    transparence.

Version 2 bis (21/10/2026, Gwenaël) : au dos, le résultat seul en grand, plus
« 3 × 7 = » au-dessus. Avec « table de 7 » en bas, le dos devient une question
(21 → 3 × 7) : la carte se joue dans les deux sens.

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
CONSIGNE_RECTO = "Imprime en recto verso sur papier épais (160 g ou plus), bord long, puis découpe sur les traits."
TITRE_VERSO = "Défi tables"
SOUS_TITRE_VERSO = "mathsgo.re"
# Le calcul tel qu'il est écrit sur le recto : le multiplicateur d'abord
# (3 × 7), comme la bande et l'écran « La table de N » de l'application.
def libelle(table: int, k: int) -> str:
    return f"{k} × {table}"

# La couleur de chaque table : (foncée, teinte du dos). La foncée est la bordure des
# bandes de fractions (outils/fractions/bandes_fractions.html) — la table de 2
# a la couleur des demis, la table de 3 celle des tiers… Les bandes n'ont ni
# septièmes ni neuvièmes : 7 = la sarcelle de Défi tables, 9 = l'ardoise.
# La teinte (la même famille, plus claire) colore le dos : on voit tout de
# suite de quel côté est la carte (blanc = le calcul, teinté = la réponse), et
# de quelle table elle est. Le texte reste à l'encre foncée sur la teinte, qui
# devient un gris clair à la photocopie.
COULEURS = {
    2: ("#A16207", "#FDE68A"),
    3: ("#7C3AED", "#DDD6FE"),
    4: ("#3F6212", "#D9F99D"),
    5: ("#075985", "#BAE6FD"),
    6: ("#9A3412", "#FED7AA"),
    7: ("#087A71", "#A7F0E2"),
    8: ("#BE185D", "#FBCFE8"),
    9: ("#475569", "#E2E8F0"),
    10: ("#B91C1C", "#FECACA"),
}

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "outils" / "calcul_mental"
LOGO = ROOT / "assets" / "img" / "mathsgo-logo-print.png"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

INK = HexColor("#143451")
MUTED = HexColor("#506B7D")
COUPE = HexColor("#9DB4C4")

COLONNES, LIGNES = 3, 4
MARGE = 12 * mm
PIED = 10 * mm         # place réservée en bas : consigne, logo, signature
WIDTH, HEIGHT = A4
# Cartes bord à bord : un seul trait entre deux cartes, une seule coupe.
CARTE_L = (WIDTH - 2 * MARGE) / COLONNES
CARTE_H = (HEIGHT - 2 * MARGE - PIED) / LIGNES
RETRAIT = 2.6 * mm     # le cadre coloré est en retrait du trait de coupe
CAP = 0.729            # hauteur des chiffres DejaVu en em, pour centrer en hauteur


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Cartes", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("Cartes-Bold", FONT_BOLD))


def case(col: int, row: int) -> tuple[float, float]:
    """Coin bas-gauche de la carte (col, row), row 0 en haut."""
    x = MARGE + col * CARTE_L
    y = HEIGHT - MARGE - (row + 1) * CARTE_H
    return x, y


def texte_centre(pdf: canvas.Canvas, font: str, taille: float, cx: float, cy: float, texte: str) -> None:
    """Texte centré en largeur ET en hauteur sur (cx, cy)."""
    pdf.setFont(font, taille)
    pdf.drawCentredString(cx, cy - CAP * taille / 2, texte)


def cadre(pdf: canvas.Canvas, x: float, y: float, table: int, fond: bool = False) -> None:
    fonce, clair = COULEURS[table]
    pdf.setStrokeColor(HexColor(fonce))
    pdf.setLineWidth(2.2)
    if fond:
        pdf.setFillColor(HexColor(clair))
    pdf.roundRect(x + RETRAIT, y + RETRAIT, CARTE_L - 2 * RETRAIT, CARTE_H - 2 * RETRAIT,
                  3.5 * mm, stroke=1, fill=1 if fond else 0)


def traits_de_coupe(pdf: canvas.Canvas) -> None:
    """Recto seulement : au verso, un décalage d'impression doublerait les traits."""
    pdf.setStrokeColor(COUPE)
    pdf.setLineWidth(0.5)
    haut, bas = HEIGHT - MARGE, HEIGHT - MARGE - LIGNES * CARTE_H
    for c in range(COLONNES + 1):
        pdf.line(MARGE + c * CARTE_L, bas, MARGE + c * CARTE_L, haut)
    for r in range(LIGNES + 1):
        pdf.line(MARGE, haut - r * CARTE_H, MARGE + COLONNES * CARTE_L, haut - r * CARTE_H)


def carte_calcul(pdf: canvas.Canvas, col: int, row: int, table: int, k: int) -> None:
    x, y = case(col, row)
    cadre(pdf, x, y, table)
    pdf.setFillColor(INK)
    texte_centre(pdf, "Cartes-Bold", 32, x + CARTE_L / 2, y + CARTE_H / 2, libelle(table, k))


def carte_reponse(pdf: canvas.Canvas, col: int, row: int, table: int, k: int) -> None:
    x, y = case(col, row)
    cadre(pdf, x, y, table, fond=True)
    # Le résultat SEUL (21/10/2026) : sans « 3 × 7 = » au-dessus, le dos est une
    # question à son tour — « 21, table de 7 » → 3 × 7 —, la carte se joue dans
    # les deux sens. Dans une même table, chaque résultat est unique.
    pdf.setFillColor(INK)
    texte_centre(pdf, "Cartes-Bold", 48, x + CARTE_L / 2, y + CARTE_H / 2 + 2 * mm, str(table * k))
    # La table en bas du dos seulement : le recto reste la question seule, et
    # photocopié en noir et blanc on trie le paquet côté dos en lisant cette
    # ligne (« 4 × 7 » seul pourrait être rangé dans la table de 4). À l'encre
    # foncée, jamais en couleur sur la teinte de la même couleur (illisible
    # photocopié).
    pdf.setFillColor(INK)
    texte_centre(pdf, "Cartes-Bold", 9.5, x + CARTE_L / 2, y + RETRAIT + 5.5 * mm, f"table de {table}")


def carte_titre(pdf: canvas.Canvas, col: int, row: int, table: int) -> None:
    x, y = case(col, row)
    cadre(pdf, x, y, table)
    pdf.setFillColor(MUTED)
    texte_centre(pdf, "Cartes-Bold", 15, x + CARTE_L / 2, y + CARTE_H / 2 + 15 * mm, "table de")
    pdf.setFillColor(HexColor(COULEURS[table][0]))
    texte_centre(pdf, "Cartes-Bold", 66, x + CARTE_L / 2, y + CARTE_H / 2 - 5 * mm, str(table))


def carte_titre_verso(pdf: canvas.Canvas, col: int, row: int, table: int) -> None:
    x, y = case(col, row)
    cadre(pdf, x, y, table, fond=True)
    pdf.setFillColor(INK)   # encre foncée comme tous les textes des dos, jamais de couleur sur une teinte
    texte_centre(pdf, "Cartes-Bold", 20, x + CARTE_L / 2, y + CARTE_H / 2 + 3 * mm, TITRE_VERSO)
    pdf.setFillColor(MUTED)
    texte_centre(pdf, "Cartes", 11, x + CARTE_L / 2, y + CARTE_H / 2 - 5 * mm, SOUS_TITRE_VERSO)


def pied(pdf: canvas.Canvas, consigne: str | None, logo: bool) -> None:
    pdf.setFillColor(MUTED)
    pdf.setFont("Cartes", 7.2)
    pdf.drawCentredString(WIDTH / 2, MARGE - 4 * mm, FOOTER_TEXT)
    if consigne:
        pdf.setFont("Cartes", 8)
        pdf.drawCentredString(WIDTH / 2, MARGE + 2 * mm, consigne)
    if logo and LOGO.exists():
        pdf.drawImage(str(LOGO), MARGE, MARGE - 5 * mm, width=15 * mm, height=7 * mm,
                      preserveAspectRatio=True, anchor="sw", mask="auto")


def page_recto(pdf: canvas.Canvas, table: int, logo: bool) -> None:
    for index, k in enumerate(MULTIPLIERS):
        col, row = index % COLONNES, index // COLONNES
        carte_calcul(pdf, col, row, table, k)
    carte_titre(pdf, 2, 3, table)
    traits_de_coupe(pdf)
    pied(pdf, CONSIGNE_RECTO, logo)
    pdf.showPage()


def page_verso(pdf: canvas.Canvas, table: int) -> None:
    # Miroir horizontal : la carte de la colonne c se retrouve en colonne 2 - c.
    for index, k in enumerate(MULTIPLIERS):
        col, row = index % COLONNES, index // COLONNES
        carte_reponse(pdf, COLONNES - 1 - col, row, table, k)
    carte_titre_verso(pdf, COLONNES - 1 - 2, 3, table)
    pied(pdf, None, False)
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
