# Livret « Calcul littéral » avec les tuiles algébriques (31 pages A4)

Source modifiable des deux PDF publics :

- `outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf` — tuiles vertes et rouges, les couleurs de l'appli des tuiles ;
- `outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf` — tuiles blanches et grises, pour la photocopie.

Les deux versions ont **le même contenu** : seule la couleur des tuiles change (`?theme=` dans l'adresse).

## Fichiers

- `livret_litteral.html` — les 31 pages, dans l'ordre, une `<section class="page">` par page.
  On modifie un énoncé directement dedans.
- `livret.css` — la mise en page commune (en-tête, sections, cartes, grilles, tuiles).
- `livret.js` — la mise en forme automatique (lire l'en-tête du fichier) :
  - `<m>3x^2 - 2x</m>` écrit les mathématiques : 𝑥 rond de SPLAT! (police SplatLettres), vrai signe −, ×, exposants ;
  - `<tl u="3.2">3*x 2*-1</tl>` dessine des tuiles (`x2`, `-x2`, `x`, `-x`, `xv` debout, `1`, `-1`, `B:4x` bande,
    `n*tuile`, `RxC*tuile`, `tuile!` barrée, `/` à la ligne) ; `u` = côté de la tuile 1 en mm, **3,2 au minimum** ;
  - l'en-tête (logo maths&go en haut à droite) et le pied « mathsgo.re · CC BY-NC-SA 4.0 » sont posés tout seuls.
- `verifier_calculs.py` — refait tous les calculs écrits dans le livret : collections de tuiles, grilles,
  exemples corrigés, grilles de multiplication, modèle d'aire, bilans. Rien à installer.
- `render.py` — vérifie les calculs, puis imprime les deux PDF avec Chromium (Playwright).

## Régénérer

```bash
python3 _sources/livret-litteral/render.py            # les deux versions
python3 _sources/livret-litteral/render.py vert-rouge # une seule
python3 _sources/livret-litteral/render.py --brouillon  # écrit le PDF même si une page déborde (pour regarder)
```

Il faut `pip install playwright` et son Chromium. Le script lance le **vrai** Chromium
(`channel="chromium"`), pas le « headless shell », qui espace le texte autrement.
Il s'arrête sans rien écrire si un calcul est faux, si une police manque (Poppins, SplatLettres)
ou si quelque chose dépasse d'une page.

## Règles de mise en page

- une seule police (Poppins) ; la lettre est le 𝑥 rond de SPLAT! ; le signe moins est le vrai « − » ;
- tuiles à coins droits ; couleurs exactes de l'appli : vert `#72c475` (bord `#2f7f35`),
  rouge `#ef3f35` (bord `#a61f18`) ; blanc `#ffffff` (bord `#222222`), gris `#dedede` (bord `#666666`) ;
- lisible imprimé en noir et blanc : aucun texte en couleur claire, le sens d'une tuile se lit aussi à son étiquette ;
- logo maths&go en haut à droite, signature centrée en pied, rien d'autre dans le pied ;
- « Exemple » partout pour les cadres d'exemple.

## Historique

Reconstruit le 6 novembre 2026 (lot 7 des Tuiles algébriques) d'après l'ancien livret, qui n'avait pas
de source : même contenu page par page, avec dix erreurs corrigées (voir la notice du lot 7). L'ancien
livret existait aussi en bleu et jaune et en couleurs Mathigon : ces deux versions ont été retirées.
