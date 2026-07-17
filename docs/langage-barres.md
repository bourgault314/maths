# Le langage visuel des barres maths&go

**Relevé le 18 juillet 2026** dans le code et à l'écran des six outils
existants : ÉquaBarre, PythaBarre, AngleBarre, Problèmes en barres (+
version M974), Petit Splat. Ces conventions sont remarquablement
cohérentes d'un outil à l'autre : c'est LE langage que l'objet
`@mathsgo/objets/barres` doit reproduire, et que tout futur rendu
(interactif, imprimé) doit respecter.

## Le tableau

- Les barres sont des **tableaux** : lignes empilées sans écart, cases
  collées bord à bord.
- Filets de **2 px**, couleur encre `#0f172a` à **36 %** d'opacité
  (`rgba(15,23,42,.36)`), **jamais doublés** : chaque case ne porte que
  son trait de droite (sauf la dernière), la ligne du haut porte ses
  quatre bords, les suivantes seulement gauche/droite/bas.
- **Aucun coin arrondi** sur les barres — contraste voulu avec le reste
  de l'interface, très arrondie (14–24 px).
- Hauteur de case ≈ 98–104 px (adaptative selon l'écran), largeur
  minimale ≈ 92 px par case dans les outils interactifs.
- Largeurs **strictement proportionnelles** aux valeurs ; dans
  PythaBarre, aux **aires** (carrés des longueurs). L'inconnue pèse sa
  valeur de solution.

## Pas d'accolades

Aucun outil n'utilise d'accolade, de crochet ni de trait de cote.
L'égalité et le rapport partie/tout se lisent par **l'alignement des
lignes** (même largeur totale) ; les valeurs vivent **dans les cases**
et dans l'historique d'équations affiché au-dessus. Exception : le
générateur de problèmes possède des accolades pour certains gabarits
d'énoncés — à traiter comme option spécifique, pas comme défaut.

## Les cases

- **Nombre** : fond blanc (dégradé quasi invisible `#fff → #f8fafc`),
  texte encre `#0f172a`.
- **Inconnue** : fond bleu pâle (`#dbeafe → #eff6ff`), lettre en
  *italique* Georgia (`𝑥`) couleur `#1d4ed8`. Options d'affichage :
  « ? » ou **tache Splat** noire (`#050505`). Jamais de pointillés dans
  ÉquaBarre ; AngleBarre marque son inconnue par hachures bleues.
- **Résultat** : vert doux (`#dcfce7 → #f0fdf4`).
- Valeur résolue / conclusion : **rouge `#dc2626`**.
- Typographie : chiffres énormes (clamp 27–42 px), **graisse 900–950**,
  interlettrage négatif, virgule décimale française, centrage parfait.

## Les états (hachures diagonales à 135°)

| État | Hachures |
|---|---|
| Sélection pour suppression | orange `#f97316` (~22 %) |
| Sélection pour regroupement | vert `#16a34a` (~16 %) |
| À calculer / à remplacer | bleu `#3b82f6` (~12 %) |
| Enlevé (« garder hachuré ») | gris encre (~26 %) + case estompée (opacité ~0.42) |

## Rôles sémantiques fixes

PythaBarre et AngleBarre colorent les cases par **rôle mathématique
constant** (commentaire du code : « les couleurs portent un sens
mathématique… ne doivent pas changer d'une question à l'autre ») :
vert = hypoténuse / angle 3, bleu = côté 1 / angle 1, orange = côté 2 /
angle 2 — les **mêmes couleurs** sur la barre, la figure (moulin,
triangle) et les termes de l'équation. Triple synchronisation.

## Interaction (pour le futur rendu manipulable)

- **Aucun glisser-déposer** dans les outils barres : tout est au
  **clic**, pensé tablette, en appariement bidirectionnel « une case
  puis une étiquette, ou l'inverse ».
- Modes d'ÉquaBarre : décomposer, regrouper, partager équitablement,
  déplacer (échange), enlever dans chaque membre.
- Feedback : flash bleu (bonne case), secousse + anneau rouge
  (mauvaise), messages d'erreur pédagogiques.
- Historique d'équations synchronisé au-dessus (étapes passées grisées,
  étape courante en encre, « = » bleu, conclusion rouge), annulation
  par instantanés, bouton « Tout dérouler ».
- Construction automatique depuis l'équation : `3x` → trois cases `x` ;
  membre gauche en bas, membre droit en haut ; solution entière > 0
  exigée par le parseur d'ÉquaBarre.

## Source de vérité

L'analyse détaillée outil par outil (valeurs exactes, numéros de
lignes) a été produite par six agents d'analyse le 18/07/2026. Ce
résumé en garde l'essentiel ; en cas de doute, le code des outils
historiques fait foi jusqu'à la validation de l'objet par Gwenaël.
