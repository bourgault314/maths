#!/usr/bin/env python3
"""Rend les trois PDF avec Chromium et refuse un moteur d'impression différent."""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


HERE = Path(__file__).resolve().parent
SITE_ROOT = HERE.parents[1]
OUT_DIR = HERE / "out"


def chromium_path() -> Path:
    candidates: list[Path] = []
    if os.environ.get("CHROME_BIN"):
        candidates.append(Path(os.environ["CHROME_BIN"]))
    for name in ("chromium", "chromium-browser", "google-chrome", "google-chrome-stable"):
        executable = shutil.which(name)
        if executable:
            candidates.append(Path(executable))
    candidates.extend(sorted(
        (Path.home() / ".cache" / "ms-playwright").glob("chromium-*/chrome-linux*/chrome"),
        reverse=True,
    ))
    for candidate in candidates:
        if candidate.is_file() and os.access(candidate, os.X_OK):
            return candidate
    raise SystemExit(
        "Chromium est requis pour conserver la mise en page du livret. "
        "Definir CHROME_BIN ou installer Chromium."
    )


def render(chromium: Path, html_name: str, pdf_name: str) -> Path:
    source = OUT_DIR / html_name
    target = OUT_DIR / pdf_name
    with tempfile.TemporaryDirectory(prefix="chat-pdf-chromium-") as profile:
        subprocess.run([
            str(chromium),
            "--headless",
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            f"--user-data-dir={profile}",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            f"--print-to-pdf={target}",
            source.as_uri(),
        ], check=True)
    return target


def validate_pdf(path: Path, expected_pages: int) -> None:
    pdfinfo = shutil.which("pdfinfo")
    if not pdfinfo:
        raise SystemExit("pdfinfo est requis pour valider le moteur et le nombre de pages.")
    info = subprocess.run(
        [pdfinfo, str(path)], check=True, capture_output=True, text=True
    ).stdout
    producer = re.search(r"^Producer:\s*(.+)$", info, re.MULTILINE)
    pages = re.search(r"^Pages:\s*(\d+)$", info, re.MULTILINE)
    if not producer or "Skia/PDF" not in producer.group(1):
        raise SystemExit(f"{path.name}: moteur inattendu ({producer.group(1) if producer else 'inconnu'}).")
    if not pages or int(pages.group(1)) != expected_pages:
        raise SystemExit(f"{path.name}: {pages.group(1) if pages else '?'} pages au lieu de {expected_pages}.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--publish",
        action="store_true",
        help="Copie les PDF valides vers outils/ apres le rendu Chromium.",
    )
    args = parser.parse_args()

    subprocess.run([sys.executable, str(HERE / "gen.py")], check=True)
    chromium = chromium_path()
    guide = render(chromium, "guide.html", "guide.pdf")
    large_cards = render(chromium, "cartes-grand-format.html", "cartes-grand-format.pdf")
    compact = render(chromium, "cartes-compactes.html", "cartes-compactes.pdf")
    validate_pdf(guide, 4)
    validate_pdf(large_cards, 20)
    validate_pdf(compact, 10)

    if args.publish:
        shutil.copy2(guide, SITE_ROOT / "outils" / "chat-cest-toi-le-chat-guide.pdf")
        shutil.copy2(large_cards, SITE_ROOT / "outils" / "chat-cest-toi-le-chat.pdf")
        shutil.copy2(compact, SITE_ROOT / "outils" / "chat-cest-toi-le-chat-cartes-compactes.pdf")

    print(
        "PDF Chromium valides: "
        f"{guide} (4 pages), {large_cards} (20 pages), {compact} (10 pages)"
    )


if __name__ == "__main__":
    main()
