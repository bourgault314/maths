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

### Exception voulue : le haut de page de Flash Anzan

`outils/calcul_mental/flash_anzan.html` n'a pas de barre du site au-dessus du
cadre, et c'est voulu (choix de Gwenaël, 22/10/2026 : « des boutons tout seuls
là-haut, on perd de la place »). Ne pas la « corriger » vers la règle commune :

- la flèche de retour vers Calcul mental et le bouton plein écran sont DANS le
  cadre blanc, aux places des boutons de la séance ; le logo est dans le pied ;
- le titre « Soroban / Flash Anzan » est centré dans le cadre ; quand le plein
  écran est caché (téléphone), une place vide de 44 px à droite équilibre la
  flèche ;
- `tests/flash-anzan.test.mjs` garde ces trois points. Étendre cette
  disposition aux autres applis est une idée de Gwenaël, pas une décision.

### Mention « Sans cookie ni traceur » : navigation oui, applis non

Décision de Gwenaël du 23/10/2026 : « tant que je suis dans ce qui ressemble à
l'accueil, on laisse ; dès que je rentre dans une appli, on enlève ».

- Seules chargent `assets/js/mention-confidentialite.js` : l'accueil, le
  catalogue (`outils/index.html`), `outils/toutes-les-ressources.html`, les
  trois pages légales, les pages d'entrée encore servies (Addition, Soustraction,
  Multiplication et Division posées, Chat, c'est toi le chat ! — les 17 anciens
  index devenus des redirections le 23/10, PR #1047, n'ont ni pied ni mention)
  et, par exception voulue, les deux
  menus des Automatismes (`auto/index.html`, `automatismes-v2/index.html` : ils
  portaient l'ancien lien « Gérer mes cookies », la voir disparaître ferait
  croire que les cookies sont arrivés).
- Exception voulue sur l'accueil (`index.html`, décision de Gwenaël du
  04/09/2026, gardée le 23/10) : il charge le script (qui efface les anciens
  cookies de mesure) mais n'affiche que le lien « Confidentialité » de son pied
  d'une ligne, marqué `data-mathsgo-confidentialite`, sans la phrase.
- `automatismes-v2/menu.css` cache `.mg-mention-slot` : le menu écrit sa propre
  mention, la règle évite un doublon. Elle sert encore, ne pas la retirer.
- Une nouvelle appli, un nouveau jeu ou une nouvelle fiche à jouer ne charge PAS
  ce script et n'écrit pas « Sans cookie ni traceur » dans son pied ; le pied du
  site garde ses liens (dont « Confidentialité »).
- `tests/mention-confidentialite.test.mjs` tient la liste exacte des pages
  autorisées et rougit si une appli affiche la mention.

## Applis suivies — modèle commun

Toute appli branchée sur le serveur de suivi (Défi tables, SPLAT!, Défi calcul,
puis les suivantes) suit ce modèle quand l'élève est connecté par son code.
Défi tables est la référence.

- En-tête : la flèche de retour à gauche (niveau parent dans l'appli ; depuis
  l'accueil de l'appli, Mon espace), puis le bloc « Suivi par ton professeur »,
  prénom, classe, avec « Se déconnecter » dans le bloc. Pas de logo en haut ;
  pas de lien « Mon espace » en texte.
- Écrans de jeu où la place manque (les étapes de SPLAT!) : la pastille
  « ● prénom » au bout de la barre du jeu suffit. On ne déplace pas une mise en
  page de jeu pour y loger le bloc ; « Se déconnecter » reste à une flèche, sur
  l'accueil de l'appli.
- Pied : le petit logo et « Mon espace » (marqué `data-mathsgo-confidentialite`),
  rien d'autre — aucun lien vers mathsgo.re ni vers la licence, ni crédits, ni
  « Sans cookie ni traceur · Confidentialité » (l'information est sur Mon
  espace). Pendant le jeu, rien.
- Mémoire de l'appli (monde ouvert, table choisie…) : celle de l'élève, pas
  celle de l'appareil (clé portant l'empreinte du code, jamais le code en
  clair) ; si l'élève ferme tout, il retrouve tout fermé.
- Tuile dans Mon espace : rien tant qu'aucune réussite, puis une jauge et
  « N … sur M », comptés sur ce que la classe a d'ouvert.
- Réglage par classe : dans Ma classe, onglet « ⚙ Réglages », carte
  « Activités », sous la case de l'appli ; propriétaire seulement ; tout
  ouvert par défaut.
- Dans Ma classe, l'onglet d'une appli montre sa progression, sans aucun code
  d'élève : les codes ne s'écrivent que dans l'onglet « Élèves » (et sur les
  papiers imprimés), pour qu'une page projetée ne les montre jamais à la
  classe (lot « Ma classe : élèves », 18/10/2026 ; gardé par
  `tests/suivi-ma-classe-eleves.test.mjs`).
- Le cadre de l'appli tient entier dans l'écran avec le bloc de suivi, sur
  téléphone comme sur ordinateur.
- Sans code, rien ne change : en-tête, fil d'Ariane et pied du site.

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
