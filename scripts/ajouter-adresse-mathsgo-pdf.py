#!/usr/bin/env python3
"""Ajoute l'adresse mathsgo.re au pied de chaque page d'un PDF existant."""

from __future__ import annotations

import argparse
import io
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import Color
from reportlab.pdfgen import canvas


BRAND_NAVY = Color(11 / 255, 53 / 255, 112 / 255)


def add_address(source: Path, destination: Path, x: float, y: float) -> None:
    reader = PdfReader(str(source))
    writer = PdfWriter()

    for page in reader.pages:
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        buffer = io.BytesIO()
        overlay = canvas.Canvas(buffer, pagesize=(width, height))
        overlay.setFillColor(BRAND_NAVY)
        overlay.setFont("Helvetica-Bold", 7)
        overlay.drawString(x, y, "mathsgo.re")
        overlay.save()
        buffer.seek(0)
        page.merge_page(PdfReader(buffer).pages[0])
        writer.add_page(page)

    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as output:
        writer.write(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--x", type=float, default=140.0)
    parser.add_argument("--y", type=float, default=18.0)
    args = parser.parse_args()
    add_address(args.source, args.destination, args.x, args.y)


if __name__ == "__main__":
    main()
