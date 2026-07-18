# Plan d'extraction des visuels — la carte des 27 composants

**Créé le 18 juillet 2026.** Règle posée par Gwenaël, gravée ici :

> Les visuels codés DANS Automatismes (`auto/scripts/shared/visuals/`)
> sont souvent ratés (générés par GPT). **Les bonnes versions vivent
> dans les gros HTML du site** (`outils/`). L'extraction se fait donc
> depuis les outils du site ; Automatismes fournit la *liste des
> besoins* (27 types de visuels, 186 exemples préréglés, formats de
> données des questions) — pas la référence visuelle.

La bibliothèque interne `auto/dev/visual-library.html` (reliée depuis
l'Atelier) montre les 27 composants avec leurs exemples : c'est
l'inventaire vivant. Statuts : ✅ extrait dans `packages/objets` ·
🔜 à extraire · ⏸ à discuter avec Gwenaël.

## La carte : composant d'Automatismes → référence du site

| Visuel d'Automatismes (besoin) | Exemples | Référence à extraire (la bonne version) | Statut |
|---|---:|---|---|
| `numbers.relative-tokens` — jetons relatifs (**raté dans auto**) | 3 | `outils/nombres_relatifs/` plateaux (drag, paires nulles, badge 0) | ✅ jetons v1 + manipulation atelier |
| `arithmetic.relation-bar` — barres de relation | 14 | `outils/equabarre.html`, `outils/problemes_barres.html` | ✅ barres v2 + équation→barres |
| `algebra.inquiry-bar` — barres d'enquête | 15 | idem barres + `outils/splat_tache_barre.html` | ✅ couvert par barres v2 |
| `geometry.pythagoras-bar` — PythaBarre | 6 | `outils/pythabarre.html` (aires, rôles fixes vert/bleu/orange) | ✅ rôles couverts par barres v2 ; déroulé 6 étapes 🔜 |
| `algebra.equation-splat` — Splat d'équation | 2 | `outils/splat.html`, `outils/equasplat.html` (+ Splat animé d'`axelle/` à retrouver) | ✅ tache v1 + moteur equasplat-logique + objet deux plateaux + Atelier ÉquaSplat (juillet 2026, import Splat Équations intégré) |
| `numbers.number-line` — droite graduée | 9 | gabarits LaTeX `outils/_gabarit_*_double_ligne_graduee.tex` + PDF pourcentages/proportionnalité | 🔜 priorité (double ligne graduée) |
| `arithmetic.fraction-percent-bar` — barre de pourcentage | 7 | gabarits pourcentages (PDF + tex) + `outils/pourcentages_exerciceur.html` | 🔜 priorité |
| `measures.conversion-table` — tableau de conversion | 5 | `outils/conversions/` (glisse-unité, tableaux, curseur) | 🔜 (« widget » demandé explicitement) |
| `algebra.algebra-tiles` — tuiles algébriques | 7 | `outils/tuiles_algebriques/` (expressions, équations — « elles devront bouger ») | 🔜 |
| `algebra.area-model` — modèle d'aire | 7 | `outils/tuiles_algebriques/` + générateur d'exercices | 🔜 |
| `algebra.relation-tiles` — tuiles de relation | 7 | à comparer avec tuiles du site | ⏸ |
| `arithmetic.fraction-wall` — mur de fractions | 6 | `outils/fractions/mur_fractions.html` | 🔜 |
| `arithmetic.fraction-decimal-grid` — grille fraction/décimal | 9 | `outils/fractions/` (bandes, disques) | 🔜 |
| `arithmetic.fraction-operations` — opérations de fractions | 10 | `outils/fractions/fractions_produit_manipulation.html` | 🔜 |
| `arithmetic.equal-sharing-board` — partage équitable | 4 | gabarits partage équitable (PDF) + `outils/plateaux_manipulation/pgcd_sachets.html` | ⏸ |
| `numbers.glisse-nombre` — glisse-nombre | 5 | `outils/plateaux_manipulation/glisse_entiers_flex.html`, `glisse_nombres_decimaux.html` | 🔜 |
| `numbers.place-value-table` — tableau de numération | (bibliothèque) | `outils/plateaux_manipulation/numeration_decimale.html` + fabrication matériel | 🔜 |
| `numbers.order-cards` — cartes à ordonner | 1 | à discuter (site ?) | ⏸ |
| `numbers.square-area` — carrés et aires | 5 | à discuter | ⏸ |
| `geometry.pythagoras-mill` — moulin de Pythagore | 4 | `outils/plateaux_manipulation/moulin_pythagore.html` (+ `studio/components/pythagore/visuals.js`) | 🔜 |
| `geometry.pythagoras-reasoning` / `-builder` | 15 | `outils/pythabarre.html` (déroulé) | ⏸ |
| `geometry.triangle-angle-sum` — somme des angles | 6 | `outils/angles/anglebarre.html` | 🔜 |
| `geometry.thales-configuration` — configuration de Thalès | 5 | fiches Thalès (PDF/tex) | ⏸ |
| `geometry.coordinate-plane` / `data.cartesian-graph` — repères | 14 | à discuter (pas d'outil site dédié repéré) | ⏸ |
| `geometry.angle-vocabulary` — vocabulaire des angles | 13 | `outils/angles/` (gabarits, bandes magnétiques) | ⏸ |
| `geometry.solid` — solides | 7 | `outils/plateaux_manipulation/cubes_construction.html` (3D) | ⏸ |

## Objets « anti-erreurs GPT » demandés par Gwenaël (19/07)

Douleurs récurrentes avec les IA généralistes, à régler une fois pour
toutes par des objets à lois mathématiques :

| Douleur | Objet à créer | Statut |
|---|---|---|
| Triangles aux angles faux | **objet triangle** (loi des sinus/cosinus, angles testés au millième) | ✅ v1 (19/07) |
| Flèches des tableaux de proportionnalité toujours droites | objet **flèche courbe ×k** (l'arc « rond », jamais droit) | 🔜 |
| Pas d'outil pour tracer les quadrilatères et figures usuelles | objet **quadrilatères / figures** | ✅ v1 (noyau géométrique + figures usuelles + Atelier Géométrie, juillet 2026) |
| Arcs d'angles dessinés du mauvais côté | **secteur angulaire calculé** (atan2 + point intérieur, testé sous 360 rotations) ; arc du triangle v1 corrigé | ✅ v1 |
| Figures planes : lot 1 complet | **primitives** (point-croix, segment, droite, demi-droite, angle rentrant/orienté/secteur), **cercle enrichi** (corde, arc, tangente, secteur, demi-cercle), **triangle V2** (tous constructeurs, hauteurs/médianes/médiatrices/bissectrices, centres G-H-O-I, cercles inscrit/circonscrit), régions/apothème/triangulation, tests aléatoires seedés | ✅ v1 (juillet 2026) |
| Positionnement anarchique des noms dans les tableaux | objet **tableau** (placement réglé une fois) | 🔜 |
| Fractions jamais bien écrites | objet **écriture fractionnaire** (empilement et barre corrects) | 🔜 |

## Méthode d'extraction (validée par l'expérience barres v1→v2)

1. Lire la version du SITE (le gros HTML) — code + rendu réel au navigateur ;
2. Extraire verbatim les algorithmes et conventions (couleurs, traits, timings) ;
3. Reconstruire en objet paramétrable (taille réglable partout) dans `packages/objets`, avec tests ;
4. Montrer dans l'Atelier, à côté de l'original ;
5. Gwenaël corrige puis valide — seul un objet validé entre au registre.

Les données d'Automatismes (186 exemples préréglés, 285 types de
questions, contrats de manipulation) servent ensuite à brancher chaque
objet sur la génération de questions — sans réutiliser les dessins
ratés.
