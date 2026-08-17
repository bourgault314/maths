#!/usr/bin/env python3
"""Fabrique les versions recto-verso sans modifier les PDF recto d'origine.

Les versos sont construits depuis les rectangles réellement présents dans les
PDF Chromium. Leur position est réfléchie horizontalement, comme le fait une
impression duplex « bord long » en portrait ou « bord court » en paysage.
"""

from __future__ import annotations

import argparse
import io
import tempfile
from dataclasses import dataclass
from pathlib import Path

import pdfplumber
from PIL import Image
from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


HERE = Path(__file__).resolve().parent
SITE_ROOT = HERE.parents[1]
OUT_DIR = HERE / "out"
LOGO_PATH = SITE_ROOT / "assets" / "img" / "mathsgo-logo.png"
FONT_PATH = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

TITLE = "Chat, c’est toi le chat !"
FONT_NAME = "ChatBackDejaVuBold"
NAVY = HexColor("#1F3A68")
POINTS_PER_MM = 72 / 25.4


@dataclass(frozen=True)
class Layout:
    name: str
    expected_cards: int
    min_width: float
    max_width: float
    min_height: float
    max_height: float
    title_size: float
    logo_width_mm: float
    gap_mm: float
    duplex_instruction: str


LARGE = Layout(
    name="grand format",
    expected_cards=4,
    min_width=240,
    max_width=270,
    min_height=285,
    max_height=315,
    title_size=14,
    logo_width_mm=40,
    gap_mm=6,
    duplex_instruction="retourner sur le bord long",
)

COMPACT = Layout(
    name="format compact",
    expected_cards=8,
    min_width=185,
    max_width=205,
    min_height=260,
    max_height=285,
    title_size=10.5,
    logo_width_mm=30,
    gap_mm=5,
    duplex_instruction="retourner sur le bord court",
)


def _register_font() -> None:
    if FONT_NAME not in pdfmetrics.getRegisteredFontNames():
        if not FONT_PATH.is_file():
            raise SystemExit(f"Police requise introuvable : {FONT_PATH}")
        pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))


def _cropped_logo() -> tuple[ImageReader, float]:
    """Retourne le véritable M, isolé du logo horizontal, et son ratio."""
    with Image.open(LOGO_PATH) as source:
        rgba = source.convert("RGBA")
        # Le premier composant alpha du logo est l'emblème M ; le second est
        # le mot-symbole. Ces limites sont validées sur l'asset officiel.
        emblem = rgba.crop((40, 40, 656, 582))
        payload = io.BytesIO()
        emblem.save(payload, format="PNG", optimize=True)
    payload.seek(0)
    return ImageReader(payload), emblem.width / emblem.height


def _extract_card_boxes(page: pdfplumber.page.Page, layout: Layout) -> list[dict]:
    boxes = [
        rect
        for rect in page.rects
        if layout.min_width <= rect["width"] <= layout.max_width
        and layout.min_height <= rect["height"] <= layout.max_height
    ]
    boxes.sort(key=lambda rect: (rect["top"], rect["x0"]))
    if len(boxes) != layout.expected_cards:
        raise ValueError(
            f"{layout.name}, page {page.page_number} : {len(boxes)} cartes détectées "
            f"au lieu de {layout.expected_cards}."
        )
    return boxes


def _draw_back_page(
    pdf: canvas.Canvas,
    page_width: float,
    page_height: float,
    front_boxes: list[dict],
    layout: Layout,
    logo: ImageReader,
    logo_ratio: float,
) -> None:
    pdf.setPageSize((page_width, page_height))
    pdf.setFillColor(NAVY)
    pdf.setFont(FONT_NAME, layout.title_size)

    logo_width = layout.logo_width_mm * POINTS_PER_MM
    logo_height = logo_width / logo_ratio
    text_block_height = layout.title_size * 1.2
    gap = layout.gap_mm * POINTS_PER_MM
    group_height = text_block_height + gap + logo_height

    for front in front_boxes:
        # Une feuille retournée selon le réglage indiqué réfléchit les colonnes
        # autour de l'axe vertical. Cela corrige aussi l'asymétrie de 1,2 mm du
        # PDF compact existant, sans valeur magique liée au CSS.
        card_left = page_width - front["x1"]
        card_width = front["x1"] - front["x0"]
        card_height = front["bottom"] - front["top"]
        card_center_x = card_left + card_width / 2
        group_top = front["top"] + (card_height - group_height) / 2

        text_width = pdfmetrics.stringWidth(TITLE, FONT_NAME, layout.title_size)
        text_x = card_center_x - text_width / 2
        text_baseline = page_height - group_top - layout.title_size
        pdf.drawString(text_x, text_baseline, TITLE)

        logo_top = group_top + text_block_height + gap
        logo_x = card_center_x - logo_width / 2
        logo_y = page_height - logo_top - logo_height
        pdf.drawImage(
            logo,
            logo_x,
            logo_y,
            width=logo_width,
            height=logo_height,
            preserveAspectRatio=True,
            mask="auto",
        )

    pdf.showPage()


def _same_box(first: object, second: object, tolerance: float = 0.01) -> bool:
    first_values = [float(value) for value in first]
    second_values = [float(value) for value in second]
    return all(abs(a - b) <= tolerance for a, b in zip(first_values, second_values))


def _validate_duplex(path: Path, layout: Layout, expected_front_pages: int) -> float:
    reader = PdfReader(path)
    expected_pages = expected_front_pages * 2
    if len(reader.pages) != expected_pages:
        raise ValueError(f"{path.name} : {len(reader.pages)} pages au lieu de {expected_pages}.")

    for pair_index in range(expected_front_pages):
        front = reader.pages[pair_index * 2]
        back = reader.pages[pair_index * 2 + 1]
        if not _same_box(front.mediabox, back.mediabox):
            raise ValueError(f"{path.name}, paire {pair_index + 1} : MediaBox différentes.")
        if not _same_box(front.cropbox, back.cropbox):
            raise ValueError(f"{path.name}, paire {pair_index + 1} : CropBox différentes.")

    max_error = 0.0
    with pdfplumber.open(path) as pdf:
        for pair_index in range(expected_front_pages):
            front_page = pdf.pages[pair_index * 2]
            back_page = pdf.pages[pair_index * 2 + 1]
            front_boxes = _extract_card_boxes(front_page, layout)
            back_images = sorted(back_page.images, key=lambda image: (image["top"], image["x0"]))
            if len(back_images) != layout.expected_cards:
                raise ValueError(
                    f"{path.name}, verso {pair_index + 1} : {len(back_images)} M détectés "
                    f"au lieu de {layout.expected_cards}."
                )
            extracted = back_page.extract_text() or ""
            if extracted.count(TITLE) != layout.expected_cards:
                raise ValueError(
                    f"{path.name}, verso {pair_index + 1} : le titre n'apparaît pas "
                    f"{layout.expected_cards} fois."
                )

            expected_centers = sorted(
                (
                    front_page.width - (box["x0"] + box["x1"]) / 2,
                    box["top"] + (box["bottom"] - box["top"]) / 2,
                )
                for box in front_boxes
            )
            image_centers = sorted(
                ((image["x0"] + image["x1"]) / 2, (image["top"] + image["bottom"]) / 2)
                for image in back_images
            )
            # Le M est volontairement sous le titre : son centre vertical ne
            # coïncide pas avec celui de la carte. L'alignement duplex se mesure
            # sur l'axe horizontal, celui que le retournement réfléchit.
            for expected, actual in zip(expected_centers, image_centers):
                max_error = max(max_error, abs(expected[0] - actual[0]))

    max_error_mm = max_error / POINTS_PER_MM
    if max_error_mm > 0.5:
        raise ValueError(
            f"{path.name} : erreur d'alignement maximale {max_error_mm:.3f} mm (> 0,5 mm)."
        )
    return max_error_mm


def build_duplex_pdf(front_path: Path, output_path: Path, layout: Layout) -> float:
    if not front_path.is_file():
        raise SystemExit(f"PDF recto introuvable : {front_path}")

    _register_font()
    logo, logo_ratio = _cropped_logo()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with pdfplumber.open(front_path) as front_pdf:
        detected = [_extract_card_boxes(page, layout) for page in front_pdf.pages]
        page_sizes = [(page.width, page.height) for page in front_pdf.pages]

    with tempfile.TemporaryDirectory(prefix="chat-duplex-") as temporary:
        back_path = Path(temporary) / "versos.pdf"
        back_canvas = canvas.Canvas(str(back_path), pagesize=page_sizes[0], pageCompression=1)
        back_canvas.setTitle(f"{TITLE} — Versos {layout.name}")
        back_canvas.setSubject(
            f"Versos à imprimer à taille réelle ; {layout.duplex_instruction}."
        )
        for (page_width, page_height), boxes in zip(page_sizes, detected):
            _draw_back_page(
                back_canvas,
                page_width,
                page_height,
                boxes,
                layout,
                logo,
                logo_ratio,
            )
        back_canvas.save()

        front_reader = PdfReader(front_path)
        back_reader = PdfReader(back_path)
        writer = PdfWriter()
        for front_page, back_page in zip(front_reader.pages, back_reader.pages):
            back_page.mediabox = front_page.mediabox
            back_page.cropbox = front_page.cropbox
            writer.add_page(front_page)
            writer.add_page(back_page)
        writer.add_metadata({
            "/Title": f"{TITLE} — Cartes {layout.name} recto-verso",
            "/Subject": (
                "Cartes à imprimer à taille réelle (100 %), "
                f"{layout.duplex_instruction}."
            ),
            "/Author": "maths&go",
        })
        with tempfile.NamedTemporaryFile(
            mode="wb",
            prefix=f".{output_path.stem}-",
            suffix=".pdf",
            dir=output_path.parent,
            delete=False,
        ) as stream:
            writer.write(stream)
            temporary_output = Path(stream.name)
        temporary_output.replace(output_path)

    return _validate_duplex(output_path, layout, len(page_sizes))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--large-front",
        type=Path,
        default=OUT_DIR / "cartes-grand-format.pdf",
    )
    parser.add_argument(
        "--compact-front",
        type=Path,
        default=OUT_DIR / "cartes-compactes.pdf",
    )
    parser.add_argument(
        "--large-output",
        type=Path,
        default=OUT_DIR / "cartes-grand-format-recto-verso.pdf",
    )
    parser.add_argument(
        "--compact-output",
        type=Path,
        default=OUT_DIR / "cartes-compactes-recto-verso.pdf",
    )
    args = parser.parse_args()

    large_error = build_duplex_pdf(args.large_front, args.large_output, LARGE)
    compact_error = build_duplex_pdf(args.compact_front, args.compact_output, COMPACT)
    print(
        "PDF recto-verso valides : "
        f"{args.large_output} (alignement {large_error:.3f} mm), "
        f"{args.compact_output} (alignement {compact_error:.3f} mm)."
    )


if __name__ == "__main__":
    main()
