"""Génère la fiche A4 vierge « Mon parcours des tables » (une page), sa vignette et le QR partagé.

Sorties :
  - outils/calcul_mental/fiche_parcours_tables.pdf   (fiche vierge à photocopier, lien de la
    page du professeur)
  - assets/img/thumbnails/calcul-mental/fiche-parcours-tables.png et .webp (vignette du
    catalogue : la page 1 à 120 dpi, 993 × 1404, la .webp plus légère)
  - assets/img/qr-defi-tables-parcours.svg           (le QR « Ouvrir l'appli », imprimé
    aussi sur la fiche de l'appli)

Lot « Mon parcours » (04/10/2026, décision 15 de Gwenaël) : la fiche vierge redevient
IDENTIQUE à la fiche de l'appli (« Voir ma fiche », fiche d'un élève depuis « Ma classe ») —
une page : la carte de ma table (vide), le tableau des 36 calculs (vide), sa légende, le
mélange, Je deviens expert, « résultats, nombres manquants et divisions ». Pour
qu'elle le reste, on ne la redessine plus ici : on IMPRIME la fiche de l'appli elle-même,
ouverte en mode vierge (outils/calcul_mental/defi_tables.html?vierge), avec Chromium. Toute
retouche de la fiche se fait donc dans defi_tables.html ; on relance ce script ensuite.

Logo en haut à droite, QR à gauche, « mathsgo.re · CC BY-NC-SA 4.0 » seul en pied (c'est
la fiche de l'appli). Lisible imprimée en noir et blanc.

Il faut : Python 3, reportlab (le QR), Pillow (la vignette) et Playwright avec son Chromium
complet (pas le « headless shell », qui espace le texte d'environ 5 %) :
    python -m pip install reportlab pillow playwright
    python -m playwright install chromium

Usage : python3 _sources/defi-tables/generer_fiche_parcours.py
"""

import asyncio
import shutil
import subprocess
import tempfile
from pathlib import Path

from reportlab.graphics import renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing

APP_URL = "https://mathsgo.re/outils/calcul_mental/defi_tables.html#parcours"

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / "outils" / "calcul_mental" / "defi_tables.html"
OUTPUT_PDF = ROOT / "outils" / "calcul_mental" / "fiche_parcours_tables.pdf"
OUTPUT_QR = ROOT / "assets" / "img" / "qr-defi-tables-parcours.svg"
VIGNETTE = ROOT / "assets" / "img" / "thumbnails" / "calcul-mental" / "fiche-parcours-tables.png"


def qr_drawing(size: float) -> Drawing:
    widget = QrCodeWidget(APP_URL, barLevel="M")
    x1, y1, x2, y2 = widget.getBounds()
    drawing = Drawing(size, size, transform=[size / (x2 - x1), 0, 0, size / (y2 - y1), 0, 0])
    drawing.add(widget)
    return drawing


def write_qr_svg() -> None:
    OUTPUT_QR.parent.mkdir(parents=True, exist_ok=True)
    renderSVG.drawToFile(qr_drawing(120), str(OUTPUT_QR))


async def imprimer_fiche_vierge() -> None:
    """La fiche de l'appli, en mode vierge, imprimée en A4 (marges et taille : le @page de la page)."""
    from playwright.async_api import async_playwright
    async with async_playwright() as pw:
        navigateur = await pw.chromium.launch(channel="chromium")
        page = await navigateur.new_page(viewport={"width": 1366, "height": 900})
        erreurs = []
        page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
        await page.goto(PAGE.as_uri() + "?vierge")
        await page.wait_for_function("document.body.classList.contains('mode-fiche') && !document.getElementById('fiche-matable').hidden")
        await page.evaluate("document.fonts.ready")
        OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
        await page.pdf(path=str(OUTPUT_PDF), format="A4", print_background=True, prefer_css_page_size=True)
        await navigateur.close()
    if erreurs:
        raise SystemExit("Erreur JavaScript dans la page : " + " | ".join(erreurs))


def nombre_de_pages() -> int:
    texte = OUTPUT_PDF.read_bytes().decode("latin1")
    import re
    return max(int(n) for n in re.findall(r"/Count (\d+)", texte))


def write_vignette() -> None:
    """Page 1 à 120 dpi (993 × 1404), en PNG et en WebP plus légère. PyMuPDF s'il est là, sinon pdftoppm."""
    from PIL import Image
    VIGNETTE.parent.mkdir(parents=True, exist_ok=True)
    try:
        import fitz  # PyMuPDF
        with fitz.open(OUTPUT_PDF) as document:
            document[0].get_pixmap(dpi=120).save(str(VIGNETTE))
    except ImportError:
        if not shutil.which("pdftoppm"):
            raise SystemExit("Il faut PyMuPDF (pip install pymupdf) ou pdftoppm (poppler) pour la vignette.")
        with tempfile.TemporaryDirectory() as dossier:
            base = Path(dossier) / "page"
            subprocess.run(["pdftoppm", "-r", "120", "-png", "-f", "1", "-l", "1", "-singlefile", str(OUTPUT_PDF), str(base)], check=True)
            shutil.copyfile(str(base) + ".png", VIGNETTE)
    image = Image.open(VIGNETTE).convert("RGB")
    # Chromium arrondit la page A4 au pixel près (594,96 pt de large au lieu de 595,28) :
    # à 120 dpi, un pixel de moins. On ramène la vignette au format du catalogue.
    if image.size != (993, 1404):
        if abs(image.size[0] - 993) > 3 or abs(image.size[1] - 1404) > 3:
            raise SystemExit(f"vignette : {image.size} au lieu de 993 × 1404")
        image = image.resize((993, 1404), Image.LANCZOS)
    image.save(VIGNETTE, "PNG", optimize=True)
    image.save(VIGNETTE.with_suffix(".webp"), "WEBP", quality=82, method=6)


def main() -> None:
    write_qr_svg()
    asyncio.run(imprimer_fiche_vierge())
    pages = nombre_de_pages()
    if pages != 1:
        raise SystemExit(f"{OUTPUT_PDF.name} : {pages} pages au lieu d'une — la fiche de l'appli ne tient plus sur une page.")
    write_vignette()
    print(f"OK : {OUTPUT_PDF.relative_to(ROOT)} (1 page), {VIGNETTE.relative_to(ROOT)} (+ .webp) et {OUTPUT_QR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
