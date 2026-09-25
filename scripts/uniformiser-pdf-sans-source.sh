#!/usr/bin/env bash
set -euo pipefail

# À lancer lorsqu'un PDF d'origine sans source LaTeX vient d'être remplacé.
# Le traitement se fait en place : il ne doit pas être ajouté au compilateur
# courant, afin de ne pas empiler inutilement plusieurs surimpressions PDF.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for pdf in \
  detective_des_grandeurs_additive__1.pdf \
  detective_des_grandeurs_additive__2.pdf \
  detective_des_grandeurs_multiplicative__1.pdf \
  fractions_multiples_problemes.pdf \
  pourcentages_recherche.pdf
do
  python3 "$ROOT/scripts/uniformiser-signature-pdf.py" \
    "$ROOT/outils/$pdf" "$ROOT/outils/$pdf" --mode pied-complet
done

python3 "$ROOT/scripts/uniformiser-signature-pdf.py" \
  "$ROOT/outils/fractions/gabarits_fractions.pdf" \
  "$ROOT/outils/fractions/gabarits_fractions.pdf" \
  --mode pied-complet \
  --gabarit-plastifiable

for pdf in \
  nombres_relatifs/nombres_relatifs_couleur_mathsgo.pdf \
  nombres_relatifs/nombres_relatifs_gris_blanc.pdf \
  nombres_relatifs/nombres_relatifs_vert_rouge_contour_noir.pdf \
  nombres_relatifs/nombres_relatifs_vert_rouge_ecriture_blanche.pdf \
  tuiles_algebriques/livret_litteral_blanc_gris.pdf \
  tuiles_algebriques/livret_litteral_bleu_jaune.pdf \
  tuiles_algebriques/livret_litteral_mathigon.pdf \
  tuiles_algebriques/livret_litteral_vert_rouge.pdf
do
  python3 "$ROOT/scripts/uniformiser-signature-pdf.py" \
    "$ROOT/outils/$pdf" "$ROOT/outils/$pdf" --mode adresse-liseré
done
