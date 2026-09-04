#!/usr/bin/env python3
"""Uniformise la signature visuelle des PDF imprimables maths&go.

Le logo de référence est exclusivement assets/img/mathsgo-logo.png. Le script
utilise sa copie d'impression redimensionnée, mathsgo-logo-print.png, afin de ne
pas alourdir chaque page du PDF ; le dessin et les couleurs sont identiques. Les modes
prévus correspondent aux trois familles de documents actuellement publiées :

- pied-complet : aucune identité fiable, nouveau logo et adresse en pied ;
- adresse-liseré : le bon logo est déjà dans l'en-tête, seule l'adresse change ;
- partage : masque l'ancien logo à baseline sans effacer la consigne centrale.

Le traitement est volontairement idempotent : un PDF peut être retraité sans
empiler les logos ni les adresses.
"""

from __future__ import annotations

import argparse
import io
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, DecodedStreamObject, NameObject
from reportlab.lib.colors import Color, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


BRAND_NAVY = Color(11 / 255, 53 / 255, 112 / 255)
BRAND_ORANGE = Color(1, 133 / 255, 0)
LOGO_WIDTH = 69.45  # 2,45 cm, comme dans les sources LaTeX communes.
LOGO_X = 10.0
LOGO_Y = 8.5
ADDRESS_Y = 9.5
OBSOLETE_ADDRESS = b"aca.re/maths/mathsgo"


def draw_logo(overlay: canvas.Canvas, logo: Path) -> None:
    image = ImageReader(str(logo))
    pixel_width, pixel_height = image.getSize()
    height = LOGO_WIDTH * pixel_height / pixel_width
    overlay.drawImage(
        image,
        LOGO_X,
        LOGO_Y,
        width=LOGO_WIDTH,
        height=height,
        preserveAspectRatio=True,
        mask="auto",
    )


def draw_address(overlay: canvas.Canvas, page_width: float, y: float = ADDRESS_Y) -> None:
    overlay.setFillColor(BRAND_NAVY)
    overlay.setFont("Helvetica-Bold", 7)
    overlay.drawCentredString(page_width / 2, y, "mathsgo.re")


def draw_template_label(
    overlay: canvas.Canvas, page_width: float, y: float = ADDRESS_Y
) -> None:
    overlay.setFillColor(BRAND_NAVY)
    overlay.setFont("Helvetica", 6.8)
    overlay.drawRightString(page_width - 15.6, y, "Gabarit plastifiable")


def make_overlay(
    width: float,
    height: float,
    logo: Path,
    mode: str,
    mark_as_template: bool,
) -> bytes:
    buffer = io.BytesIO()
    overlay = canvas.Canvas(buffer, pagesize=(width, height))

    if mode == "pied-complet":
        overlay.setFillColor(white)
        overlay.rect(0, 0, width, 44, stroke=0, fill=1)
        draw_logo(overlay, logo)
        draw_address(overlay, width)

    elif mode == "adresse-liseré":
        left = width / 2 - 55
        overlay.setFillColor(white)
        overlay.rect(left, 4, 110, 12, stroke=0, fill=1)
        overlay.setStrokeColor(BRAND_ORANGE)
        overlay.setLineWidth(0.8)
        overlay.line(left, 14, left + 110, 14)
        draw_address(overlay, width, y=5.5)

    elif mode == "partage":
        overlay.setFillColor(white)
        overlay.rect(0, 0, 190, 45, stroke=0, fill=1)
        draw_logo(overlay, logo)
        draw_address(overlay, width)

    else:  # garde-fou pour un éventuel appel direct hors argparse
        raise ValueError(f"Mode inconnu : {mode}")

    if mark_as_template:
        draw_template_label(overlay, width)

    overlay.save()
    return buffer.getvalue()


def remove_obsolete_address(page: object) -> None:
    """Retire réellement l'ancienne adresse du flux texte, pas seulement à l'écran."""

    contents = page.get_contents()
    if contents is None:
        return
    data = contents.get_data()
    if OBSOLETE_ADDRESS not in data:
        return
    cleaned = DecodedStreamObject()
    cleaned.set_data(data.replace(OBSOLETE_ADDRESS, b""))
    page[NameObject("/Contents")] = cleaned


def remove_xobjects(page: object, reader: PdfReader) -> None:
    """Supprime l'appel au formulaire contenant l'ancien logo complet."""

    contents = page.get_contents()
    if contents is None:
        return
    stream = ContentStream(contents, reader)
    stream.operations = [
        (operands, operator)
        for operands, operator in stream.operations
        if operator != b"Do"
    ]
    page[NameObject("/Contents")] = stream


def uniformize(
    source: Path,
    destination: Path,
    logo: Path,
    mode: str,
    mark_as_template: bool,
) -> None:
    # La lecture en mémoire autorise source == destination sans corrompre le PDF.
    reader = PdfReader(io.BytesIO(source.read_bytes()))
    writer = PdfWriter()

    for page in reader.pages:
        if mode == "partage":
            remove_xobjects(page, reader)
        remove_obsolete_address(page)
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        overlay_bytes = make_overlay(width, height, logo, mode, mark_as_template)
        page.merge_page(PdfReader(io.BytesIO(overlay_bytes)).pages[0])
        writer.add_page(page)

    destination.parent.mkdir(parents=True, exist_ok=True)
    output = io.BytesIO()
    writer.write(output)
    destination.write_bytes(output.getvalue())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument(
        "--logo",
        type=Path,
        default=Path(__file__).resolve().parents[1]
        / "assets/img/mathsgo-logo-print.png",
    )
    parser.add_argument(
        "--mode",
        required=True,
        choices=("pied-complet", "adresse-liseré", "partage"),
    )
    parser.add_argument(
        "--gabarit-plastifiable",
        action="store_true",
        help="Ajoute la mention Gabarit plastifiable en bas à droite.",
    )
    args = parser.parse_args()
    uniformize(
        args.source,
        args.destination,
        args.logo,
        args.mode,
        args.gabarit_plastifiable,
    )


if __name__ == "__main__":
    main()
