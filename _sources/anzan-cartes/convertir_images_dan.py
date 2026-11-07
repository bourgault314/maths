# Les images des cartes dan d’Anzan (lot « anzan-dan », 07/11/2026).
#
# Même méthode que convertir_images.py (les kyu).
# Entrée : les 20 PNG d'origine faits par GPT (1024 × 1536, dossier « Diplômes Dan »,
# gardé hors ligne) — trop lourds pour le dépôt (2 à 3 Mo chacun), ils n'y sont pas.
# Sortie : outils/calcul_mental/anzan-cartes/danNN-nom.webp (640 × 984, q74)
# et danNN-nom-vignette.webp (160 × 246, q78).
#
# Le timbre doré des dan est plus haut que celui des kyu : 914 × 1432 px
# (x 55-968, y 55-1486, à 1 px près sur les 20 images) contre 916 × 1313.
# Il est presque centré dans les PNG (55 px de crème en haut, 48-49 en bas).
# Chaque image est recadrée sur le timbre avec la même marge tout autour,
# comme les kyu : x 32-991, y 33-1508, soit 960 × 1476 (23 px à gauche et
# à droite, 22 en haut et en bas), exactement 640 × 984 réduit aux deux
# tiers et 160 × 246 au sixième. Les cartes dan gardent donc LEUR rapport
# (640 × 984) : elles ne sont jamais déformées pour entrer dans 640 × 904.
#
# Les fonds n'ont pas tous le même crème — de (253, 251, 247) à
# (254, 253, 252) : chaque image reçoit un gain par canal qui amène sa
# marge (x 4-16, y 600-900, hors du timbre) au crème des kyu : (254, 253, 249).
#
# Qualité : q74 pour la carte (et non q80 comme les kyu) — les images dan sont
# plus hautes et plus chargées : en q80 elles pesaient 75 à 146 ko (119 en
# moyenne) contre 65 à 114 (96) pour les kyu ; en q74, 58 à 122 ko (97 en
# moyenne), sans différence visible même agrandies deux fois. Vignettes : q78.
#
# Le script s'arrête si une image n'a pas la bonne taille ou si son timbre
# n'est pas à sa place (contrôle à 3 px près).
#
#   python3 convertir_images_dan.py "<dossier des PNG>" outils/calcul_mental/anzan-cartes
import sys, os
import numpy as np
from PIL import Image

CARTES = [(1, "kuma", "1er Dan - Kuma v2"), (2, "taka", "2e Dan - Taka v2"), (3, "kamaitachi", "3e Dan - Kamaitachi v2"),
          (4, "namazu", "4e Dan - Namazu"), (5, "shachihoko", "5e Dan - Shachihoko"), (6, "shishi", "6e Dan - Shishi v2"),
          (7, "okami", "7e Dan - Okami"), (8, "raiju", "8e Dan - Raiju v2"), (9, "ryume", "9e Dan - Ryume v2"),
          (10, "hakutaku", "10e Dan - Hakutaku v2"), (11, "genbu", "11e Dan - Genbu v2"), (12, "byakko", "12e Dan - Byakko v2"),
          (13, "suzaku", "13e Dan - Suzaku v2"), (14, "seiryu", "14e Dan - Seiryu v2"), (15, "kyubi", "15e Dan - Kyubi"),
          (16, "kujaku", "16e Dan - Kujaku"), (17, "takarabune", "17e Dan - Takarabune v2"), (18, "fujisan", "18e Dan - Fujisan"),
          (19, "hakuryu", "19e Dan - Hakuryu"), (20, "oryu", "20e Dan - Oryu")]
FOND = np.array([254, 253, 249], float)
TIMBRE = (55, 55, 968, 1486)        # x0, y0, x1, y1 (inclus)
DECOUPE = (32, 33, 992, 1509)       # boîte PIL : 960 × 1476
CARTE, VIGNETTE = (640, 984), (160, 246)


def timbre(a, fond):
    """Bord extérieur du timbre : lignes et colonnes où plus de 20 pixels s'écartent du fond."""
    m = np.abs(a - fond).sum(2) > 60
    cols, rows = np.where(m.sum(0) > 20)[0], np.where(m.sum(1) > 20)[0]
    return cols[0], rows[0], cols[-1], rows[-1]


def main(source, sortie, dossier_vignettes=None):
    dossier_vignettes = dossier_vignettes or sortie
    os.makedirs(sortie, exist_ok=True)
    os.makedirs(dossier_vignettes, exist_ok=True)
    for dan, nom, fichier in CARTES:
        a = np.asarray(Image.open(os.path.join(source, fichier + ".png")).convert("RGB")).astype(float)
        assert a.shape[:2] == (1536, 1024), fichier
        fond = a[600:900, 4:16].reshape(-1, 3).mean(0)
        t = timbre(a, fond)
        assert all(abs(u - v) <= 3 for u, v in zip(t, TIMBRE)), (fichier, t)
        gain = FOND / fond
        im = Image.fromarray(np.clip(a * gain, 0, 255).round().astype(np.uint8))
        im = im.crop(DECOUPE)
        im.resize(CARTE, Image.LANCZOS).save(os.path.join(sortie, f"dan{dan:02d}-{nom}.webp"), quality=74, method=6)
        im.resize(VIGNETTE, Image.LANCZOS).save(os.path.join(dossier_vignettes, f"dan{dan:02d}-{nom}-vignette.webp"), quality=78, method=6)
        print(f"{dan:2d}e dan {nom:11s} timbre x {t[0]}-{t[2]} y {t[1]}-{t[3]}  fond {fond.round(1)}  gain {gain.round(4)}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
