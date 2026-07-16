# Sources et signature des PDF imprimables

Ce document est l'inventaire technique des 28 PDF publics de maths&go.

## Référence graphique

- Logo maître : `assets/img/mathsgo-logo.png`
- Copie optimisée pour les surimpressions PDF :
  `assets/img/mathsgo-logo-print.png`
- Adresse imprimée : `mathsgo.re`
- Gabarit sans en-tête : logo en bas à gauche et adresse centrée en pied.
- Fiche avec en-tête : logo en haut à droite et adresse seule en pied.
- Anciennes variantes avec la baseline « Manipuler • Comprendre • Progresser » :
  interdites dans les PDF publics.

## PDF possédant une source LaTeX

Ces 13 documents sont entièrement modifiables et recompilables :

| PDF public | Source |
|---|---|
| `angles/fiche_angles_triangles.pdf` | `angles/_fiche_angles_triangles.tex` |
| `fiche_reciproque_thales.pdf` | `_fiche_reciproque_thales.tex` |
| `fiche_thales_criteres_a_verifier.pdf` | `_fiche_thales_criteres_a_verifier.tex` |
| `fiche_thales_direct_a_verifier.pdf` | `_fiche_thales_direct_a_verifier.tex` |
| `gabarit_pourcentages_double_ligne_graduee.pdf` | `_gabarit_pourcentages_double_ligne_graduee.tex` |
| `gabarit_proportionnalite_double_ligne_graduee.pdf` | `_gabarit_proportionnalite_double_ligne_graduee.tex` |
| `gabarit_proportionnalite_tableau_sans_coefficient.pdf` | `_gabarit_proportionnalite_tableau_sans_coefficient.tex` |
| `gabarits_enquetes_additive.pdf` | `_gabarits_enquetes_additive.tex` |
| `gabarits_enquetes_multiplicative.pdf` | `_gabarits_enquetes_multiplicative.tex` |
| `gabarits_pourcentages.pdf` | `_gabarits_pourcentages.tex` |
| `gabarits_proportionnalite_tableaux.pdf` | `_gabarits_proportionnalite_tableaux.tex` |
| `multiples_et_fractions_d_une_quantite.pdf` | `_multiples_et_fractions_d_une_quantite.tex` |
| `pythabarre_recto_verso.pdf` | `_pythabarre_recto_verso.tex` |

Pour les recompiler, depuis la racine du dépôt :

```bash
bash scripts/compiler-gabarits.sh
```

Cette commande régénère également `gabarits_partage_equitable_2_3_4_5.pdf`.
Ce document n'a pas de source éditable : son PDF d'origine est conservé dans
`_source_gabarits_partage_equitable.pdf`, puis la signature publique est créée
par `scripts/uniformiser-signature-pdf.py`.

## PDF sans source exacte

Les 14 documents suivants ne possèdent pas de code permettant de modifier leur
contenu pédagogique :

- les trois `detective_des_grandeurs_*.pdf` ;
- `fractions/gabarits_fractions.pdf` ;
- `fractions_multiples_problemes.pdf` ;
- les quatre PDF de `nombres_relatifs/` ;
- `pourcentages_recherche.pdf` ;
- les quatre `tuiles_algebriques/livret_litteral_*.pdf`.

Leur signature peut néanmoins être remise à jour après import d'un nouveau PDF :

```bash
bash scripts/uniformiser-pdf-sans-source.sh
```

Ce traitement se fait en place. Il doit être lancé sur un PDF d'origine nouvellement
importé, et non à chaque compilation générale.

## Classement public

Les 28 PDF sont tous déclarés dans `assets/js/catalogue-refonte-data.js` et dans
`sitemap.xml`. Leur classement visible se fait par domaine et notion dans le
catalogue ; leur chemin physique historique n'a pas été déplacé afin de préserver
les liens publics existants.
