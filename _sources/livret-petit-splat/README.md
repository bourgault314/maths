# Livret « Petit SPLAT! » (8 pages, à plier)

Le monde 1 de l'univers SPLAT! réuni en un seul livret : couverture, les 6 fiches
dans l'ordre de la progression, et une 4e de couverture. Les collègues l'impriment
sur **2 feuilles A3 recto-verso**, pliées et agrafées au milieu → 8 pages A4.

Deux PDF publics sont produits :

- `outils/livret_petit_splat.pdf` — 8 pages A4 dans l'ordre de lecture
  (pour lire à l'écran, ou pour le mode « Cahier/Livret » d'un photocopieur) ;
- `outils/livret_petit_splat_a3.pdf` — 4 pages A3 paysage **déjà imposées**
  (8|1 · 2|7 · 6|3 · 4|5) : impression recto-verso, retournement sur le bord court,
  on plie, on agrafe.

## Fichiers

- `couverture.html` — page 1 : bandeau à coulure, le splat étoilé de l'univers,
  l'exemple expliqué (19 jetons, schéma en barres complété, légende du diaporama :
  *en tout / visibles / cachés*), Prénom + Classe et le sommaire des six fiches.
  Pas de QR ici : ils sont sur les fiches et au dos.
- `dos.html` — page 8 : « Encore des cartes ! » en quatre niveaux (Facile = 1 tache,
  Normal = 2 à 6 taches, Avancé jusqu'à 50, Expert jusqu'à 100), « La suite du voyage »
  vers l'univers, rappel de vocabulaire, grille « Mes fiches », crédits et licence.
- `commun.css` — la charte des deux pages (Poppins, bandeau orange du site).
- `qr/` — les 11 QR codes (6 fiches + univers + 4 niveaux), en PNG noir et blanc.
  Les réglages des niveaux sont dans `NIVEAUX`, au début de `render.py`.
- `render.py` — régénère les deux PDF.

Les fiches elles-mêmes ne sont **pas** redessinées ici : `render.py` les demande à
l'outil du site (`outils/splat_tache_barre.html`, `support=print`) avec les graines
exactes du monde 1, et injecte le QR code dans le bandeau de consigne juste avant
l'impression. Le livret suit donc automatiquement toute évolution de l'outil.

## Régénérer

```bash
cd _sources/livret-petit-splat
python3 render.py          # les deux PDF dans outils/
python3 render.py --qr     # en refabriquant d'abord les QR codes
```

Dépendances : `playwright` (+ chromium), `pikepdf`, `qrcode[pil]`. `qpdf`, s'il est
présent, divise le poids des PDF par deux.

**Si une graine du monde 1 change** dans `outils/splat_univers.html` (tableau
`MONDES[0].etapes`), reporter la nouvelle graine dans la liste `FICHES` de
`render.py`, puis relancer avec `--qr` : les QR pointent vers le jeu de l'élève
avec les mêmes cartes que la fiche imprimée (`parcours=m1eN`, l'étoile du parcours
est donc bien attribuée).

## Conventions

- Logos IREM + maths&go dans le bandeau des pages 1 et 8 ; rien dans le pied,
  hormis la signature `mathsgo.re/splat/petit · CC BY-NC-SA 4.0` (les 6 fiches
  portent déjà cette signature, produite par l'outil lui-même).
- Tout reste lisible imprimé en **noir et blanc** : aucun texte en couleur claire,
  aucune page en aplat teinté.
- Vocabulaire : « jetons » (jamais « billes », réservées au monde 4).
