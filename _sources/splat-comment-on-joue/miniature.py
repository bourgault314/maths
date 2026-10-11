#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Miniature du catalogue pour la carte « Comment on joue ? » de la page Splat (11/10/2026) :
à gauche la première page du diaporama, à droite une image du film avec un bouton ▶.

    python3 miniature.py      (après render_diaporama.py et render_video.py)

Produit assets/img/thumbnails/splat/comment-on-joue.png et .webp (720 × 320, comme les autres cartes).
Prérequis : pdftoppm (poppler), ffmpeg, Pillow.
"""
import pathlib
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFilter

ICI = pathlib.Path(__file__).resolve().parent
RACINE = ICI.parent.parent
PDF = RACINE / "outils" / "splat_comment_on_joue_diaporama.pdf"
MP4 = RACINE / "outils" / "splat_comment_on_joue.mp4"
SORTIE = RACINE / "assets" / "img" / "thumbnails" / "splat" / "comment-on-joue"
W, H, FOND = 720, 320, (248, 250, 252)   # même fond que la miniature des livrets
INSTANT_FILM = "36"                      # « 11 visibles. Et sous la tache ? » : tache, total et schéma


def carte(image, largeur, rayon=10):
    """Redimensionne, arrondit les coins et ajoute un fin contour."""
    h = round(image.height * largeur / image.width)
    image = image.convert("RGB").resize((largeur, h), Image.LANCZOS)
    masque = Image.new("L", image.size, 0)
    ImageDraw.Draw(masque).rounded_rectangle((0, 0, largeur - 1, h - 1), rayon, fill=255)
    ImageDraw.Draw(image).rounded_rectangle((0, 0, largeur - 1, h - 1), rayon, outline=(203, 213, 225), width=2)
    return image, masque


def poser(fond, image, masque, x, y, angle=0):
    """Pose une carte avec une ombre douce, éventuellement inclinée."""
    rgba = image.convert("RGBA"); rgba.putalpha(masque)
    if angle:
        rgba = rgba.rotate(angle, resample=Image.BICUBIC, expand=True)
    ombre = Image.new("RGBA", (rgba.width + 40, rgba.height + 40), (0, 0, 0, 0))
    ombre.paste((15, 23, 42, 60), (20, 26), rgba.split()[3])
    ombre = ombre.filter(ImageFilter.GaussianBlur(9))
    fond.alpha_composite(ombre, (x - 20, y - 20))
    fond.alpha_composite(rgba, (x, y))
    return rgba.size


def main():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        subprocess.run(["pdftoppm", "-f", "1", "-l", "1", "-r", "60", "-png", str(PDF), str(tmp / "diapo")], check=True)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", INSTANT_FILM, "-i", str(MP4),
                        "-frames:v", "1", str(tmp / "film.png")], check=True)
        diapo = Image.open(next(tmp.glob("diapo*.png")))
        film = Image.open(tmp / "film.png")

    fond = Image.new("RGBA", (W, H), FOND + (255,))
    d_img, d_masque = carte(diapo, 250)
    poser(fond, d_img, d_masque, 46, 54, angle=4)
    f_img, f_masque = carte(film, 400, rayon=12)
    fx, fy = 270, (H - f_img.height) // 2 + 6
    poser(fond, f_img, f_masque, fx, fy)

    # le bouton ▶ du film, dans le coin vide en haut à gauche de l'image (dessiné 4 fois plus grand puis réduit : bords nets)
    k, r = 4, 24
    bouton = Image.new("RGBA", (2 * r * k, 2 * r * k), (0, 0, 0, 0))
    dessin = ImageDraw.Draw(bouton)
    dessin.ellipse((0, 0, 2 * r * k - 1, 2 * r * k - 1), fill=(37, 99, 235, 240))
    c, s = r * k, 10 * k
    # triangle centré sur son centre de gravité (comme le grand ▶ du film, PR #962)
    dessin.polygon([(c - s * .583, c - s), (c - s * .583, c + s), (c + s * 1.167, c)], fill=(255, 255, 255, 255))
    bouton = bouton.resize((2 * r, 2 * r), Image.LANCZOS)
    fond.alpha_composite(bouton, (fx + 18, fy + 16))

    rgb = fond.convert("RGB")
    rgb.save(SORTIE.with_suffix(".png"), optimize=True)
    rgb.save(SORTIE.with_suffix(".webp"), quality=82, method=6)
    for ext in (".png", ".webp"):
        print(SORTIE.with_suffix(ext).relative_to(RACINE), SORTIE.with_suffix(ext).stat().st_size // 1024, "Ko")


if __name__ == "__main__":
    main()
