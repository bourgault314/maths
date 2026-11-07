# Les images des cartes d'Anzan (lot « anzan-cartes », 07/11/2026).
#
# Entrée : les 20 PNG d'origine (1024 × 1536, dossier « Diplômes Kyu », gardé
# hors ligne) — trop lourds pour le dépôt (2 à 3 Mo chacun), ils n'y sont pas.
# Sortie : outils/calcul_mental/anzan-cartes/kyuNN-nom.webp (640 × 904, q80)
# et kyuNN-nom-vignette.webp (160 × 226, q78).
#
# Le timbre n'est pas centré dans les PNG (61 px de crème en haut, 164 en
# bas, sur les 20 images) : chaque image est recadrée sur le timbre avec la
# même marge de 22 px tout autour (x 32-992, y 38-1394 : 960 × 1356, soit
# exactement 640 × 904 réduit aux deux tiers).
#
# Les fonds n'avaient pas tous le même crème (certains tiraient sur le jaune) :
# chaque image reçoit un gain par canal qui amène sa marge (x 4-16,
# y 600-900, hors du timbre) au fond du « 11e Kyu - Kitsune v2 » :
# (254, 253, 249).
#
#   python3 convertir_images.py "<dossier des PNG>" outils/calcul_mental/anzan-cartes
import sys, os
import numpy as np
from PIL import Image

CARTES = [(20, "kaeru", "20e Kyu - Kaeru"), (19, "usagi", "19e Kyu - Usagi"), (18, "suzume", "18e Kyu - Suzume"),
          (17, "tombo", "17e Kyu - Tombo"), (16, "kame", "16e Kyu - Kame"), (15, "akabeko", "15e Kyu - Akabeko"),
          (14, "shika", "14e Kyu - Shika"), (13, "inoshishi", "13e Kyu - Inoshishi v2"), (12, "yatagarasu", "12e Kyu - Yatagarasu"),
          (11, "kitsune", "11e Kyu - Kitsune v2"), (10, "tanuki", "10e Kyu - Tanuki v2"), (9, "maneki-neko", "9e Kyu - Maneki-neko v2"),
          (8, "koinobori", "8e Kyu - Koinobori v2"), (7, "fukuro", "7e Kyu - Fukuro v2"), (6, "tsuru", "6e Kyu - Tsuru v2"),
          (5, "ryu", "5e Kyu - Ryu v3"), (4, "ho-o", "4e Kyu - Ho-o v2"), (3, "baku", "3e Kyu - Baku v2"),
          (2, "shisa", "2e Kyu - Shisa v2"), (1, "kirin", "1er Kyu - Kirin v2")]
FOND = np.array([254, 253, 249], float)

source, sortie = sys.argv[1], sys.argv[2]
os.makedirs(sortie, exist_ok=True)
for kyu, nom, fichier in CARTES:
    a = np.asarray(Image.open(os.path.join(source, fichier + ".png")).convert("RGB")).astype(float)
    assert a.shape[:2] == (1536, 1024), fichier
    gain = FOND / a[600:900, 4:16].reshape(-1, 3).mean(0)
    im = Image.fromarray(np.clip(a * gain, 0, 255).round().astype(np.uint8))
    im = im.crop((32, 38, 992, 1394))
    base = os.path.join(sortie, f"kyu{kyu:02d}-{nom}")
    im.resize((640, 904), Image.LANCZOS).save(base + ".webp", quality=80, method=6)
    im.resize((160, 226), Image.LANCZOS).save(base + "-vignette.webp", quality=78, method=6)
    print(f"{kyu:2d}e kyu {nom:12s} gain {gain.round(3)}")
