# Règles de travail du dépôt maths&go

Le dépôt GitHub est la source de vérité. Avant toute tâche concernant
Automatismes V2, lire dans cet ordre :

1. `docs/automatismes-v2/pilotage.md` ;
2. `docs/automatismes-v2/taxonomie-competences.json` ;
3. `docs/automatismes-v2/etat.md` ;
4. `docs/automatismes-v2/decisions.md` ;
5. `docs/automatismes-v2/gabarit-fiche-pedagogique.md` ;
6. `docs/automatismes-v2/inventaire-auto-studio.md` ;
7. la fiche du module concerné, lorsqu'elle existe.

## Règles générales

- Préserver les modifications existantes et travailler sur une branche courte.
- Annoncer l'objectif et le périmètre avant toute modification.
- Une seule tâche V2 est active à la fois ; ne pas ouvrir plusieurs chantiers
  indépendants en parallèle. Pour le contenu pédagogique, l'unité de chantier
  est le module visible. Il peut réunir plusieurs micro-notions proches
  lorsqu'elles forment une seule entrée cohérente pour l'élève.
- Ne jamais fusionner une pull request sans validation explicite de Gwenaël.
- JavaScript moderne, sans dépendance externe ni compilation.
- Toute logique testable doit fonctionner avec `node --test`, sans navigateur.
- Les tests du serveur de suivi (« serveur (SQLite) » et « serveur (MySQL) ») ne
  tournent en CI que si la pull request touche `_serveur/`, les workflows, ou
  l'un des fichiers du dépôt que `_serveur/tests/lancer.php` compare octet pour
  octet — le moteur de Défi tables et les images servies. Ailleurs, les deux
  coches sont sautées, et la fusion reste possible. Le passage complet a lieu
  chaque dimanche à 18:00 UTC (22 h à La Réunion) et à la demande, par « Run
  workflow ». Un lot serveur se vérifie en local avec
  `SUIVI_TESTS_TEMPS=1 php _serveur/tests/lancer.php` : cette variable joue en
  plus les mesures de temps, que les pull requests ne jouent jamais.
- Vérifier les cas limites mathématiques et le déterminisme des générations.

## Navigation du site — règle commune

- Avant de modifier un menu, un niveau du catalogue ou un en-tête, lire le
  bandeau existant et ses styles dans `assets/css/catalogue-refonte.css`, ainsi
  que `renderBreadcrumb` dans `assets/js/catalogue-refonte.js`. Réutiliser ce
  fonctionnement, y compris pour les pages accessibles par un lien direct.
- À 680 px de largeur et moins : un seul retour visible, vers le parent
  immédiat dans le site. Les ancêtres sont masqués, sans seconde flèche ni
  seconde ligne. Exemple : jeu → Jeux courts → Jeux, recherches et explorations
  → Tous les domaines ; Pythagore ou Thalès → Triangles → Espace et géométrie.
- Au-dessus de 680 px : conserver le fil complet ; les liens sont côte à côte
  lorsque la largeur le permet. Le logo reste un lien vers l'accueil.
- Ne pas remplacer le retour au parent par un retour aveugle dans l'historique
  du navigateur : un lien direct doit lui aussi remonter au bon niveau.
- Après un changement de niveau, exécuter le contrôle du bandeau
  `node tests/catalogue-navigation-css-dom.cjs` (jsdom 26.1.0, comme les autres
  contrôles DOM du dépôt) et `node tests/jeux-courts-navigation-dom.cjs` pour les
  jeux. Le premier vérifie les liens visibles, les styles et les destinations
  à 320, 390, 680, 681, 1024 et 1440 px ; il ne mesure pas la mise en page.
- Compléter par un contrôle visuel téléphone/ordinateur lorsque le navigateur
  le permet ; signaler toute taille non observée, sans présenter un test DOM
  comme une vérification visuelle. Actualiser la version de la feuille commune
  dans les pages concernées pour que la correction soit chargée sans vider le cache.

## Automatismes V2

- **Périmètre immédiat : exclusivement le DNB.** La liste officielle des
  attendus de l'épreuve dit ce qui doit être couvert et quand cette première
  phase est complète. Elle ne fixe pas l'ordre de fabrication, qui relève de la
  carte de pilotage maths&go (D-013, D-014 et D-043).
- L'ancienne banque et la bêta sont des inventaires de notions, jamais des
  sources d'énoncés, de paramètres, de valeurs, de distracteurs ou de code.
- L'ancienne banque s'ouvre en **archive**, notion par notion et seulement au
  moment de traiter cette notion, pour y retrouver les apports de Gwenaël.
- Aucun élément ancien n'entre dans V2 sans provenance identifiée et validation
  explicite de Gwenaël — y compris un élément qu'il a écrit lui-même.
- Les noms `dnb_*`, l'arborescence des 43 modules et leurs identifiants restent
  historiques. V2 utilise des noms français issus du programme et de la
  taxonomie maths&go, sans correspondance un-à-un avec l'ancienne banque.
- Les identifiants canoniques V2 sont descriptifs et stables. Les codes courts
  `NC`, `AL`, `PF`, `GM`, `GE`, `DS` et `PI` sont seulement des alias humains de
  pilotage ; ni un ordre, ni un code DNB n'est déduit de leur numéro.
- La bêta est gelée, sauf correction critique distincte du chantier V2.
- Aucun contenu pédagogique réel n'est programmé avant validation de sa fiche
  par Gwenaël.
- Travailler module visible par module visible, puis micro-notion par
  micro-notion à l'intérieur du module lorsque son découpage l'exige.
- Réutiliser les fondations indépendantes validées ; ne pas refaire les objets
  visuels acquis sans raison établie.
- Tout calcul linéaire, notamment avec une puissance, passe par le rendu HTML
  commun ; les égalités successives utilisent son alignement testé et aucun
  SVG ne compose localement une puissance.
- Ne pas reconduire automatiquement l'interface, les couleurs ou l'organisation
  de la bêta.
- Ne pas introduire GeoGebra sans demande explicite.
- Les états d'avancement sont `a_faire`, `construit` et `valide`.
- Un contenu non `valide` ne doit jamais être exposé aux élèves.
