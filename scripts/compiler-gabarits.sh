#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/tmp/gabarits-build"
mkdir -p "$OUT"

build() {
  local source="$1"
  local destination="$2"
  latexmk -cd -pdf -interaction=nonstopmode -halt-on-error \
    -output-directory="$OUT" "$ROOT/outils/$source"
  cp "$OUT/${source%.tex}.pdf" "$ROOT/outils/$destination"
}

build _gabarits_enquetes_additive.tex gabarits_enquetes_additive.pdf
build _gabarits_enquetes_multiplicative.tex gabarits_enquetes_multiplicative.pdf
build _gabarits_pourcentages.tex gabarits_pourcentages.pdf
build _multiples_et_fractions_d_une_quantite.tex multiples_et_fractions_d_une_quantite.pdf
build _gabarit_pourcentages_double_ligne_graduee.tex gabarit_pourcentages_double_ligne_graduee.pdf
build _gabarits_proportionnalite_tableaux.tex gabarits_proportionnalite_tableaux.pdf
build _gabarit_proportionnalite_double_ligne_graduee.tex gabarit_proportionnalite_double_ligne_graduee.pdf
build _gabarit_proportionnalite_tableau_sans_coefficient.tex gabarit_proportionnalite_tableau_sans_coefficient.pdf
build _fiche_reciproque_thales.tex fiche_reciproque_thales.pdf
build _pythabarre_recto_verso.tex pythabarre_recto_verso.pdf

python3 "$ROOT/scripts/ajouter-adresse-mathsgo-pdf.py" \
  "$ROOT/outils/_source_gabarits_partage_equitable.pdf" \
  "$ROOT/outils/gabarits_partage_equitable_2_3_4_5.pdf" \
  --x 135 --y 18
