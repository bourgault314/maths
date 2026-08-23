#!/usr/bin/env python3
"""Complète la signature des PDF imprimables maths&go avec la licence.

Les documents publiés portent déjà, en pied de page, la mention « mathsgo.re ».
Ce script la remplace par « mathsgo.re · CC BY-NC-SA 4.0 », au même endroit, dans
la même police et la même couleur, pour que la feuille photocopiée porte
elle-même ses conditions de réutilisation.

Principes de sûreté :

- on ne touche QUE la mention détectée en pied de page : à moins de 40 pt du bas
  ET seule sur sa page. Les cartes à découper de « Chat, c'est toi le chat ! »,
  qui portent l'adresse sur chaque carte, sont donc laissées intactes ;
- l'ancienne adresse est réellement supprimée du flux de la page, pas seulement
  recouverte ; la suppression est bornée à la boîte du texte + 1 pt, et les images
  et traits (logo, liseré orange, contenu de la fiche) sont explicitement préservés ;
- la taille et la couleur sont reprises du texte d'origine ; si la ligne plus
  longue ne tenait pas dans la largeur libre, la taille est réduite jusqu'à 5 pt ;
- le script est idempotent : un PDF déjà complété n'est pas retouché
  (« mathsgo.re · CC BY-NC-SA » est reconnu et ignoré).

Usage :
    python3 scripts/ajouter-licence-pdf.py --verifier      # liste, ne modifie rien
    python3 scripts/ajouter-licence-pdf.py                 # applique
    python3 scripts/ajouter-licence-pdf.py chemin/un.pdf   # un seul fichier
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pymupdf

RACINE = Path(__file__).resolve().parents[1]
ADRESSE = "mathsgo.re"
LICENCE = "CC BY-NC-SA 4.0"
NOUVELLE = f"{ADRESSE} · {LICENCE}"
SEPARATEUR = " · "
HAUTEUR_PIED = 40.0     # au-delà, la mention n'est pas un pied de page
TAILLE_MINI = 5.0
POLICE_NORMALE = "helv"   # Helvetica : métriques proches des sources LaTeX
POLICE_GRASSE = "hebo"    # la signature d'origine est en gras dans la plupart
                          # des documents : on garde la même graisse
MARGE_BORD = 6.0        # on ne s'approche pas plus du bord de la feuille


def spans_adresse(page: pymupdf.Page):
    """Renvoie les spans de pied de page contenant exactement « mathsgo.re »."""
    trouves = []
    for bloc in page.get_text("dict")["blocks"]:
        for ligne in bloc.get("lines", []):
            # La signature peut être découpée en plusieurs spans : LaTeX écrit un
            # span par mot, donc « mathsgo.re » et « CC BY-NC-SA 4.0 » sont séparés.
            # C'est la LIGNE entière qui dit si la licence est déjà là ; se fier au
            # seul span doublerait la mention sur un PDF recompilé depuis les sources.
            if LICENCE in "".join(s["text"] for s in ligne.get("spans", [])):
                continue
            for span in ligne.get("spans", []):
                texte = span["text"].strip()
                if ADRESSE not in texte:
                    continue
                x0, y0, x1, y1 = span["bbox"]
                if page.rect.height - y1 > HAUTEUR_PIED:
                    continue                  # mention ailleurs : on n'y touche pas
                trouves.append(span)
    # Un pied de page est unique sur sa page. Plusieurs mentions = ce sont des
    # cartes à découper (« Chat, c'est toi le chat ! ») : on n'y touche pas.
    return trouves if len(trouves) == 1 else []


def police(span) -> str:
    """Reprend la graisse du texte d'origine (bit 4 des flags = gras)."""
    gras = bool(int(span.get("flags", 0)) & 16) or "bold" in str(span.get("font", "")).lower()
    return POLICE_GRASSE if gras else POLICE_NORMALE


def couleur(span) -> tuple[float, float, float]:
    v = int(span.get("color", 0))
    return ((v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255)


def completer_page(page: pymupdf.Page) -> int:
    faits = 0
    redactions = []
    for span in spans_adresse(page):
        x0, y0, x1, y1 = span["bbox"]
        taille = float(span["size"])
        centre = (x0 + x1) / 2
        base = span["origin"][1]

        fonte = police(span)
        largeur_libre = min(centre, page.rect.width - centre) * 2 - 2 * MARGE_BORD
        while taille > TAILLE_MINI and pymupdf.get_text_length(NOUVELLE, fonte, taille) > largeur_libre:
            taille -= 0.25
        largeur = pymupdf.get_text_length(NOUVELLE, fonte, taille)

        # On SUPPRIME réellement l'ancienne adresse du flux de la page (un simple
        # rectangle blanc la cacherait à l'œil mais la laisserait copiable, et le
        # script ne serait plus idempotent). Les images et les traits de la fiche
        # sont explicitement préservés : seule la zone de texte est effacée.
        page.add_redact_annot(pymupdf.Rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1))
        redactions.append((centre, base, taille, fonte, couleur(span)))
        faits += 1

    if redactions:
        page.apply_redactions(
            images=pymupdf.PDF_REDACT_IMAGE_NONE,
            graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
            text=pymupdf.PDF_REDACT_TEXT_REMOVE,
        )
        for centre, base, taille, fonte, coul in redactions:
            largeur = pymupdf.get_text_length(NOUVELLE, fonte, taille)
            page.insert_text(
                (centre - largeur / 2, base),
                NOUVELLE,
                fontname=fonte,
                fontsize=taille,
                color=coul,
            )
    return faits


def traiter(chemin: Path, appliquer: bool) -> tuple[int, int]:
    doc = pymupdf.open(chemin)
    total = 0
    pages = 0
    for page in doc:
        n = len(spans_adresse(page))
        if n:
            pages += 1
            total += completer_page(page) if appliquer else n
    if appliquer and total:
        # PyMuPDF refuse d'écrire par-dessus le fichier ouvert : on passe par un
        # temporaire, puis on remplace, pour ne jamais laisser un PDF à moitié écrit.
        temporaire = chemin.with_suffix(chemin.suffix + ".tmp")
        doc.save(temporaire, garbage=3, deflate=True)
        doc.close()
        temporaire.replace(chemin)
        return total, pages
    doc.close()
    return total, pages


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("fichiers", nargs="*", type=Path)
    parser.add_argument("--verifier", action="store_true",
                        help="liste ce qui serait modifié sans rien écrire")
    args = parser.parse_args()

    cibles = args.fichiers or sorted(
        p for p in RACINE.rglob("*.pdf") if ".git" not in p.parts
    )

    total_mentions = 0
    total_fichiers = 0
    for chemin in cibles:
        mentions, pages = traiter(chemin, appliquer=not args.verifier)
        if mentions:
            total_fichiers += 1
            total_mentions += mentions
            verbe = "à compléter" if args.verifier else "complété"
            try:
                nom = chemin.relative_to(RACINE)
            except ValueError:      # fichier passé en argument, hors du dépôt
                nom = chemin
            print(f"{verbe} : {nom} ({mentions} mention(s), {pages} page(s))")

    print(f"\n{total_fichiers} fichier(s), {total_mentions} mention(s).")
    if args.verifier and total_mentions == 0:
        print("Rien à faire : toutes les signatures portent déjà la licence.")


if __name__ == "__main__":
    sys.exit(main())
