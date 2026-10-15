#!/usr/bin/env python3
"""Les histoires de SPLAT! — met sur le site les PDF d'un livret que render.py vient de rendre.

    python3 publier.py N DOSSIER_DES_PDF RACINE_DU_DEPOT

N = 1, 2 ou 3 ; DOSSIER_DES_PDF = le HISTOIRES_SORTIE du rendu (les 8 PDF
Les-histoires-de-SPLAT-livret-N*.pdf). Copie ces 8 PDF dans outils/ sous leur nom du site
(livret_splat_histoires_N*.pdf) et refait la miniature de la couverture
(assets/img/thumbnails/splat/livret-splat-histoires-N.png et .webp : la page 1 à 120 dpi,
993 × 1404, comme les autres livrets). Après une nouvelle couverture : bumper le ?v= de la
miniature dans outils/livrets_splat.html.
Dépendances : pdftoppm (poppler), Pillow.
"""
import os
import shutil
import subprocess
import sys
import tempfile

# suffixe du fichier rendu  →  suffixe du fichier publié
NOMS = {
    "": "",
    "-a-plier": "_a_plier",
    "-corrige": "_correction",
    "-corrige-a-plier": "_correction_a_plier",
    "-corrige-lettre": "_correction_lettre",
    "-corrige-lettre-a-plier": "_correction_lettre_a_plier",
    "-corrige-equations": "_correction_equations",
    "-corrige-equations-a-plier": "_correction_equations_a_plier",
}


def publier(n, sortie, racine):
    from PIL import Image
    for rendu, publie in NOMS.items():
        source = os.path.join(sortie, f"Les-histoires-de-SPLAT-livret-{n}{rendu}.pdf")
        if not os.path.isfile(source):
            sys.exit(f"manque {source}")
        cible = os.path.join(racine, "outils", f"livret_splat_histoires_{n}{publie}.pdf")
        shutil.copyfile(source, cible)
        print("  ", os.path.relpath(cible, racine))
    couverture = os.path.join(sortie, f"Les-histoires-de-SPLAT-livret-{n}.pdf")
    base = os.path.join(racine, "assets", "img", "thumbnails", "splat", f"livret-splat-histoires-{n}")
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["pdftoppm", "-r", "120", "-f", "1", "-l", "1", "-png", "-singlefile",
                        couverture, os.path.join(d, "p1")], check=True)
        im = Image.open(os.path.join(d, "p1.png")).convert("RGB")
    if im.size != (993, 1404):
        im = im.resize((993, 1404), Image.LANCZOS)
    im.save(base + ".png", optimize=True)
    im.save(base + ".webp", quality=82, method=6)
    if os.path.getsize(base + ".webp") >= os.path.getsize(base + ".png"):
        sys.exit("la miniature webp doit être plus légère que la png")
    print("  ", os.path.relpath(base + ".png", racine), "et .webp")


if __name__ == "__main__":
    if len(sys.argv) != 4 or sys.argv[1] not in ("1", "2", "3"):
        sys.exit(__doc__)
    publier(sys.argv[1], sys.argv[2], sys.argv[3])
