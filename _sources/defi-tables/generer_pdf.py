"""Régénère le PDF publié de la fiche « Mes tables de multiplication ».

C'est le script que lance la publication du site (.github/workflows/publier.yml).
Depuis le lot 5 de l'audit (01/10/2026), la fiche est dessinée entièrement par
`generer_fiche_tables.py` (textes, cartes « 3 × 7 » de 0 à 10, logo) : ce
fichier ne fait que l'appeler, sans le DOCX (python-docx n'est pas installé sur
la machine de publication).

Usage : python3 _sources/defi-tables/generer_pdf.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from generer_fiche_tables import OUTPUT_PDF, build_pdf  # noqa: E402


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT_PDF)
