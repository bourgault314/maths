# Inventaire des URL publiques — maths&go

**Date de référence : 17 juillet 2026** — état correspondant au tag Git `etat-initial-2026-07-17`.

## À quoi sert ce document

Ce fichier est le **contrat de non-régression** du chantier de modernisation :
tant que la migration n'est pas terminée, chaque URL listée ici doit continuer
à fonctionner à l'identique. Toute suppression ou déplacement d'une de ces
adresses doit être une décision explicite (avec redirection si nécessaire),
jamais un effet de bord.

## Méthode

- Les URL de la section 1 proviennent du `sitemap.xml` (139 entrées). Chacune a
  été vérifiée : elle correspond à un fichier réellement présent dans le dépôt
  (après correction de la route `outils/fractions/`, seule entrée invalide).
- La section 2 liste les ressources déclarées dans le catalogue
  (`assets/js/catalogue-refonte-data.js`) mais absentes du sitemap : versions
  masquées, en révision ou variantes de travail. Elles sont accessibles
  publiquement si l'on connaît l'adresse, mais non référencées.

## 1. URL du sitemap (139)

- https://mathsgo.re/
- https://mathsgo.re/auto/
- https://mathsgo.re/confidentialite.html
- https://mathsgo.re/mentions-legales.html
- https://mathsgo.re/outils/
- https://mathsgo.re/outils/angles/
- https://mathsgo.re/outils/automatismes/
- https://mathsgo.re/outils/bouliers/
- https://mathsgo.re/outils/calcul_litteral/
- https://mathsgo.re/outils/club_maths/
- https://mathsgo.re/outils/conversions/
- https://mathsgo.re/outils/engrenages/
- https://mathsgo.re/outils/fabrication_materiel/
- https://mathsgo.re/outils/fractions/index_fractions.html
- https://mathsgo.re/outils/labo-des-regularites.html
- https://mathsgo.re/outils/nombres_relatifs/
- https://mathsgo.re/outils/plateaux_manipulation/
- https://mathsgo.re/outils/splat/
- https://mathsgo.re/outils/tuiles_algebriques/
- https://mathsgo.re/outils/angles/anglebarre.html
- https://mathsgo.re/outils/angles/bandes_magnetiques.html
- https://mathsgo.re/outils/angles/gabarits_angles_generateur.html
- https://mathsgo.re/outils/angles/gabarits_angles.html
- https://mathsgo.re/outils/angles/generateur-rapporteurs-calque.html
- https://mathsgo.re/outils/angles/fiche_angles_triangles.pdf
- https://mathsgo.re/outils/automatismes/CM_Livret_A5.html
- https://mathsgo.re/outils/bouliers/abaque_de_gerbert/abaque_gerbert_addition.html
- https://mathsgo.re/outils/bouliers/abaque_de_gerbert/abaque_gerbert_soustraction.html
- https://mathsgo.re/outils/bouliers/abaque_de_gerbert/abaque_gerbert.html
- https://mathsgo.re/outils/bouliers/boulier_montessori/boulier-cycle3-petit-additions-soustractions.html
- https://mathsgo.re/outils/bouliers/boulier_montessori/boulier-cycle3-petit-placer-nombres.html
- https://mathsgo.re/outils/bouliers/boulier_montessori/boulier-cycle3-petit.html
- https://mathsgo.re/outils/bouliers/boulier_montessori/transition_rekenrek-montessori.html
- https://mathsgo.re/outils/bouliers/rekenrek/ajouter9_ajouter8.html
- https://mathsgo.re/outils/bouliers/rekenrek/cache-cache.html
- https://mathsgo.re/outils/bouliers/rekenrek/cache%20cache.html
- https://mathsgo.re/outils/bouliers/rekenrek/cache%20cache%20barre.html
- https://mathsgo.re/outils/bouliers/rekenrek/comparateur.html
- https://mathsgo.re/outils/bouliers/rekenrek/double_niv1.html
- https://mathsgo.re/outils/bouliers/rekenrek/double_niv2.html
- https://mathsgo.re/outils/bouliers/rekenrek/enlever9_enlever8.html
- https://mathsgo.re/outils/bouliers/rekenrek/force_5_soustraction.html
- https://mathsgo.re/outils/bouliers/rekenrek/force_5.html
- https://mathsgo.re/outils/bouliers/rekenrek/generateur_rekenrek_cartes.html
- https://mathsgo.re/outils/bouliers/rekenrek/grignoteur.html
- https://mathsgo.re/outils/bouliers/rekenrek/jeu_des_doubles.html
- https://mathsgo.re/outils/bouliers/rekenrek/lecture_0_100_generateur.html
- https://mathsgo.re/outils/bouliers/rekenrek/lecture_0_100_generateur2.html
- https://mathsgo.re/outils/bouliers/rekenrek/lecture_de_nombres.html
- https://mathsgo.re/outils/bouliers/rekenrek/pont_dizaine.html
- https://mathsgo.re/outils/bouliers/rekenrek/pousser_des_nombres.html
- https://mathsgo.re/outils/bouliers/rekenrek/presque_doubles.html
- https://mathsgo.re/outils/bouliers/rekenrek/presque%20double.html
- https://mathsgo.re/outils/bouliers/rekenrek/rekenrek_FD.html
- https://mathsgo.re/outils/bouliers/rekenrek/rekenrek.html
- https://mathsgo.re/outils/bouliers/rekenrek/suivant_precedent.html
- https://mathsgo.re/outils/bouliers/rekenrek/tables_generateur.html
- https://mathsgo.re/outils/bouliers/rekenrek/tables.html
- https://mathsgo.re/outils/bouliers/rekenrek/voisins_generateur_compact.html
- https://mathsgo.re/outils/bouliers/soroban/soroban-placement-nombres.html
- https://mathsgo.re/outils/bouliers/soroban/soroban.html
- https://mathsgo.re/outils/club_maths/jeu_de_nim.html
- https://mathsgo.re/outils/club_maths/jeu_du_chaos.html
- https://mathsgo.re/outils/club_maths/tables_modulaires.html
- https://mathsgo.re/outils/club_maths/yavalath.html
- https://mathsgo.re/outils/conversions/conversions_exerciseur.html
- https://mathsgo.re/outils/conversions/conversions_materiel_virtuel.html
- https://mathsgo.re/outils/conversions/conversions_materiel.html
- https://mathsgo.re/outils/conversions/conversions_unites_aires.html
- https://mathsgo.re/outils/conversions/conversions_unites_volumes.html
- https://mathsgo.re/outils/detective_des_grandeurs_additive__1.pdf
- https://mathsgo.re/outils/detective_des_grandeurs_additive__2.pdf
- https://mathsgo.re/outils/detective_des_grandeurs_multiplicative__1.pdf
- https://mathsgo.re/outils/engrenages/engrenages_exerciseur.html
- https://mathsgo.re/outils/engrenages/engrenages_plateau.html
- https://mathsgo.re/outils/equabarre.html
- https://mathsgo.re/outils/equasplat.html
- https://mathsgo.re/outils/fabrication_materiel/cartes_premiers_1_100.html
- https://mathsgo.re/outils/fabrication_materiel/grille_de_nombres.html
- https://mathsgo.re/outils/fabrication_materiel/numeration_decimale_maker.html
- https://mathsgo.re/outils/fractions_multiples_exerciseur.html
- https://mathsgo.re/outils/fractions_multiples_problemes.pdf
- https://mathsgo.re/outils/fractions/bandes_fractions.html
- https://mathsgo.re/outils/fractions/disque_maker.html
- https://mathsgo.re/outils/fractions/disques_fractions.html
- https://mathsgo.re/outils/fractions/fractions_produit_manipulation.html
- https://mathsgo.re/outils/fractions/gabarits_fractions.pdf
- https://mathsgo.re/outils/fractions/mur_fractions.html
- https://mathsgo.re/outils/gabarit_pourcentages_double_ligne_graduee.pdf
- https://mathsgo.re/outils/gabarit_proportionnalite_double_ligne_graduee.pdf
- https://mathsgo.re/outils/gabarit_proportionnalite_tableau_sans_coefficient.pdf
- https://mathsgo.re/outils/gabarits_proportionnalite_tableaux.pdf
- https://mathsgo.re/outils/fiche_reciproque_thales.pdf
- https://mathsgo.re/outils/fiche_thales_criteres_a_verifier.pdf
- https://mathsgo.re/outils/fiche_thales_direct_a_verifier.pdf
- https://mathsgo.re/outils/gabarits_enquetes_additive.pdf
- https://mathsgo.re/outils/gabarits_enquetes_multiplicative.pdf
- https://mathsgo.re/outils/gabarits_partage_equitable_2_3_4_5.pdf
- https://mathsgo.re/outils/gabarits_pourcentages.pdf
- https://mathsgo.re/outils/multiples_et_fractions_d_une_quantite.pdf
- https://mathsgo.re/outils/nombres_relatifs/nombres_relatifs_couleur_mathsgo.pdf
- https://mathsgo.re/outils/nombres_relatifs/nombres_relatifs_gris_blanc.pdf
- https://mathsgo.re/outils/nombres_relatifs/nombres_relatifs_somme_difference.html
- https://mathsgo.re/outils/nombres_relatifs/nombres_relatifs_vert_rouge_contour_noir.pdf
- https://mathsgo.re/outils/nombres_relatifs/nombres_relatifs_vert_rouge_ecriture_blanche.pdf
- https://mathsgo.re/outils/plateaux_manipulation/aire_perimetre_plateau.html
- https://mathsgo.re/outils/plateaux_manipulation/cubes_construction.html
- https://mathsgo.re/outils/plateaux_manipulation/feuille_coupee_puissance.html
- https://mathsgo.re/outils/plateaux_manipulation/glisse_entiers_flex.html
- https://mathsgo.re/outils/plateaux_manipulation/glisse_nombres_decimaux.html
- https://mathsgo.re/outils/plateaux_manipulation/le_grand_pari.html
- https://mathsgo.re/outils/plateaux_manipulation/maitre_du_temps.html
- https://mathsgo.re/outils/plateaux_manipulation/moulin_pythagore.html
- https://mathsgo.re/outils/plateaux_manipulation/moyennes.html
- https://mathsgo.re/outils/plateaux_manipulation/mur_diviseurs_pgcd.html
- https://mathsgo.re/outils/plateaux_manipulation/mur_diviseurs.html
- https://mathsgo.re/outils/plateaux_manipulation/numeration_decimale.html
- https://mathsgo.re/outils/plateaux_manipulation/pgcd_sachets.html
- https://mathsgo.re/outils/plateaux_manipulation/puzzle_brousseau.html
- https://mathsgo.re/outils/plateaux_manipulation/ratio.html
- https://mathsgo.re/outils/plateaux_manipulation/stats_city.html
- https://mathsgo.re/outils/pourcentages_exerciceur.html
- https://mathsgo.re/outils/pourcentages_recherche.pdf
- https://mathsgo.re/outils/problemes_barres.html
- https://mathsgo.re/outils/pythabarre.html
- https://mathsgo.re/outils/pythabarre_recto_verso.pdf
- https://mathsgo.re/outils/gabarit_reciproque_pythagore.pdf
- https://mathsgo.re/outils/splat_equations.html
- https://mathsgo.re/outils/splat_tache_barre.html
- https://mathsgo.re/outils/splat.html
- https://mathsgo.re/outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html
- https://mathsgo.re/outils/tuiles_algebriques/generateur_tuiles.html
- https://mathsgo.re/outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf
- https://mathsgo.re/outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf
- https://mathsgo.re/outils/tuiles_algebriques/livret_litteral_mathigon.pdf
- https://mathsgo.re/outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf
- https://mathsgo.re/outils/tuiles_algebriques/tuiles_algebriques_mode_equation.html
- https://mathsgo.re/outils/tuiles_algebriques/tuiles_algebriques.html
- https://mathsgo.re/cps/bilan-s1.html

## 2. Ressources du catalogue hors sitemap (24)

Chemins relatifs à la racine du site :

- auto/index.html
- outils/bouliers/abaque_de_gerbert/abaque_gerbert_multiplication_V1.html
- outils/bouliers/abaque_de_gerbert/abaque_gerbert_multiplication_V2.html
- outils/bouliers/abaque_de_gerbert/abaque_gerbert_multiplication_V3.html
- outils/bouliers/rekenrek/boss_final.html
- outils/bouliers/rekenrek/cache cache barre.html
- outils/bouliers/rekenrek/cache cache.html
- outils/bouliers/rekenrek/presque double.html
- outils/bouliers/rekenrek/rekenrek_sheet_generator_2_difference.html
- outils/bouliers/rekenrek/rekenrek_sheet_generator_somme.html
- outils/box_barre_final.html
- outils/box_pasbarre_final.html
- outils/fabrication_materiel/maths_barre.html
- outils/fractions/bandes_maker_v2.html
- outils/nombres_relatifs/nombres_relatifs_somme_differenceB.html
- outils/nombres_relatifs/nombres_relatifs_somme_differenceBClaire.html
- outils/nombres_relatifs/nombres_relatifs_somme_differenceC.html
- outils/nombres_relatifs/nombres_relatifs_somme_differenceD.html
- outils/plateaux_manipulation/boite_bonbons.html
- outils/plateaux_manipulation/boite_bonbons_3d_toutes_boites.html
- outils/plateaux_manipulation/engrenages_plateau.html
- outils/plateaux_manipulation/prisme345_h6_patron (1).html
- outils/problemes_barres_M974.html
- outils/sheet_generator_schema_partie_tout.html

## Règles pendant la migration

1. Ne jamais supprimer ni renommer un fichier correspondant à une URL de la
   section 1 sans décision explicite du propriétaire.
2. Si une URL doit changer, conserver l'ancien chemin (page de redirection)
   tant que la nouvelle adresse n'est pas validée.
3. Ce document est figé à la date de référence : il décrit l'état à protéger,
   pas l'état courant. Les évolutions volontaires seront consignées ailleurs.
