#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fabrique assets/fonts/SplatLettres-Italic.woff2 et SplatLettres-BoldItalic.woff2 : les lettres
de l'inconnue de SPLAT! (𝑥, 𝑎, 𝑏…), dessinées comme dans un manuel de mathématiques.

Pourquoi (26/09/2026) : l'outil écrit l'inconnue avec les « lettres mathématiques » d'Unicode
(𝑥 = U+1D465). Aucune police du site ne les contenait : chaque appareil allait les chercher
dans une police de secours, différente d'un ordinateur à l'autre. Sur la machine qui fabrique
les PDF, c'était FreeSerif (le x rond des livrets de l'Enquête, que Gwenaël préfère) ; sur
d'autres, une lettre droite. Cette police règle la question une fois pour toutes : même
lettre ronde sur tous les écrans et dans tous les PDF.

Source : KaTeX_Math-Italic (assets/vendor/katex-0.18.2/fonts/), SIL Open Font License 1.1.
Depuis le 27/09/2026, aussi KaTeX_Math-BoldItalic → SplatLettres-BoldItalic : le même dessin
rond, en gras, pour les écritures grasses (ÉquaSplat : « la lettre fait vraiment petit à côté
des chiffres », Gwenaël). Les pages déclarent le fin jusqu'à la graisse 599, le gras au-delà.
On garde seulement les 52 lettres latines, et on les range aux places des lettres
mathématiques italiques d'Unicode (A-Z → U+1D434…U+1D44D, a-z → U+1D44E…U+1D467, et
h → U+210E, la place réservée de ℎ). La police est renommée « SplatLettres » : la licence
interdit de garder le nom réservé « KaTeX_Math » pour une version modifiée.
La page la déclare avec unicode-range : elle ne sert QUE pour ces lettres, tout le reste du
texte garde sa police.

    pip install fonttools brotli
    python3 _sources/polices/splat-lettres/fabrique.py
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset

RACINE = Path(__file__).resolve().parents[3]
NOM = "SplatLettres"
DESSINS = [
    # (source KaTeX, fichier produit, style, date de la version)
    ("KaTeX_Math-Italic.woff2", "SplatLettres-Italic.woff2", "Italic", "26/09/2026"),
    ("KaTeX_Math-BoldItalic.woff2", "SplatLettres-BoldItalic.woff2", "BoldItalic", "27/09/2026"),
]

from fontTools.ttLib.tables._c_m_a_p import cmap_format_12

def fabrique(source_nom, sortie_nom, style, date):
    source = RACINE / "assets/vendor/katex-0.18.2/fonts" / source_nom
    sortie = RACINE / "assets/fonts" / sortie_nom
    f = TTFont(str(source), recalcTimestamp=False)   # même fichier à chaque fabrication
    cmap = f.getBestCmap()
    nouvelle = {}
    for i in range(26):
        maj, minu = chr(65 + i), chr(97 + i)
        nouvelle[0x1D434 + i] = cmap[ord(maj)]
        nouvelle[0x210E if minu == "h" else 0x1D44E + i] = cmap[ord(minu)]
    for table in f["cmap"].tables:
        if table.isUnicode():
            table.cmap = dict(nouvelle) if table.format == 12 else {}
    # un sous-tableau format 12 (au-delà de U+FFFF) est nécessaire pour U+1D4xx
    if not any(t.format == 12 for t in f["cmap"].tables):
        t = cmap_format_12(12); t.platformID, t.platEncID, t.language = 3, 10, 0
        t.cmap = dict(nouvelle); f["cmap"].tables.append(t)
        t2 = cmap_format_12(12); t2.platformID, t2.platEncID, t2.language = 0, 4, 0
        t2.cmap = dict(nouvelle); f["cmap"].tables.append(t2)
    for t in f["cmap"].tables:
        if t.format != 12: t.cmap = {}

    opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = []; opts.name_IDs = ["*"]
    opts.notdef_outline = True
    s = subset.Subsetter(opts); s.populate(unicodes=list(nouvelle)); s.subset(f)

    lisible = {"Italic": "Italic", "BoldItalic": "Bold Italic"}[style]
    jour = "-".join(reversed(date.split("/")))
    name = f["name"]
    for rec in list(name.names):
        if rec.nameID in (1, 3, 4, 6, 16):
            rec.string = {1: NOM, 3: f"{NOM}-{style};{jour}", 4: f"{NOM} {lisible}",
                          6: f"{NOM}-{style}", 16: NOM}[rec.nameID]
    for rec in name.names:
        if rec.nameID == 5: rec.string = f"Version 1.0 ({date}) — d'après {source_nom[:-6]} (KaTeX 0.16.9)"
    f.flavor = "woff2"
    sortie.parent.mkdir(parents=True, exist_ok=True)
    f.save(str(sortie))
    print(sortie, sortie.stat().st_size, "octets,", len(nouvelle), "lettres")

for d in DESSINS:
    fabrique(*d)
