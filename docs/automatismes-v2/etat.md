# État du chantier Automatismes V2

**Dernière mise à jour : 11 août 2026.**

## Clôture de NC-02 du 11 août

- Le lot part de `15c260f`, état de `main` après la publication du monde
  Tunnels de Solèy, et reste isolé sur la branche
  `agent/nc02-finitions-cloture`.
- D-045 fixe le rendu HTML mathématique commun : une seule typographie pour
  les calculs et un composant testé pour aligner les signes des égalités
  successives. Aucun SVG ne compose localement une puissance.
- Les libellés F2 et F4 sont resserrés, et les corrections F1, F2, F3 et F5
  réemploient le carré quadrillé de sens lorsque la base vaut au moins 2.
- Le moule commun affiche « Fais défiler ↓ » uniquement au sommet d'un
  panneau qui déborde réellement. La réponse rappelée doit être verte si elle
  est juste, rouge si elle est fournie et fausse, neutre et vide si elle est
  omise.
- Dans « S'entraîner », une réponse entièrement omise compte faux et
  ouvre la correction ; une saisie partielle ou invalide reste réparable.
  « Au tableau » reste inchangé. La trace courante passe en version 3 avec le
  statut `fournie` ou `omise`, tout en conservant la lecture des versions 1 et
  2.
- Le graphe public est invalidé d'un seul tenant en `v25`. `npm run verifier`
  réussit **1 397 tests sur 1 397** ainsi que tous les validateurs de
  publication. La recette Chromium couvre `320 × 568`, `390 × 844`,
  `1 280 × 720`, `1 920 × 1 080` et le reflow `640 × 360` : les signes
  `=` ont un écart horizontal mesuré de `0 px`, la police calculée est commune,
  le repère de défilement suit exactement le débordement et disparaît après
  défilement. Le diff sous `/auto/` reste vide et Gwenaël a explicitement
  autorisé la publication.

## Clôture de NC-01 du 11 août

- Le lot part de `1aa6c15`, état de `main` après la publication du jeu de
  fractions Solèy, et reste isolé sur la branche
  `agent/nc01-finitions-cloture`.
- La première page du cours regroupe désormais chacun des deux schémas de
  partage avec son égalité et sa conclusion, dans des sous-cartes titrées
  « Cas divisible par 3 » et « Cas non divisible par 3 ».
- La troisième page ne montre plus la borne technique des nombres générés. Les
  multiples de 3 et de 9 restent séparés, utilisent des listes ouvertes et le
  rappel des multiples de 9 va jusqu'à 90.
- La correction de la sélection de diviseurs affiche une ligne autonome pour
  chacun des cinq critères. Le générateur correspondant passe en version 3.
- La sous-forme F6 de retrait minimal conserve exactement sa tâche et sa
  distribution seedée. Seule sa formulation précise qu'aucun objet ne doit
  rester une fois la répartition effectuée ; son générateur passe en version 5.
- L'aide pas à pas, les cinq familles, leurs quotas, les distracteurs et le
  reste du lecteur ne changent pas. Le graphe public est invalidé ensemble en
  `v24` et `/auto/` demeure hors du lot.
- `npm run verifier` réussit **1 374 tests sur 1 374**, ainsi que les
  validateurs du catalogue, du référencement, des routes, de la provenance et
  d'Automatismes V2.

## Nomenclature stable et traces autonomes du 9 août

- Le lot candidat est préparé sur la branche
  `agent/v2-nomenclature-stable`, au-dessus de `3f0564e`, état vérifié de
  `main`. Il n'est ni publié ni fusionné à ce stade et ne modifie aucun contenu
  pédagogique.
- Le manifeste `taxonomie-competences.json` fixe 7 domaines disciplinaires,
  88 micro-notions descriptives, leurs cibles DNB, leur ordre de fabrication
  séparé et leurs statuts. Les codes `NC`, `AL`, `PF`, `GM`, `GE`, `DS` et `PI`
  restent des repères humains ; ils ne sont plus des identifiants primaires de
  données.
- L'ancien domaine composite `PG` est séparé en `PF` et `GM`. Les 24 codes
  `PG-01` à `PG-24` restent des alias historiques. Les volumes utilisent
  désormais `GM-13`, `GM-14` et `GM-15` comme codes de pilotage.
- Les 8 micro-notions déjà construites utilisent leurs identifiants canoniques
  dans le code et les questions. Le module des carrés devient
  `carres-entiers-0-a-12` ; l'ancien slug `carres-entiers-1-a-12` reste accepté
  dans les URL et configurations. Le module fractions garde une entrée visible
  et deux micro-notions : `fraction-vers-decimal` et
  `decimal-vers-fraction`.
- La trace `mathsgo.trace-reponse/2` recopie le référentiel, le domaine, le
  module, la micro-notion, la famille, les cibles, les compléments et les
  versions du gabarit, du générateur et de l'aléatoire. Elle reste donc
  interprétable pour un futur regroupement même sans conserver la question
  complète. La version 1 reste lisible sans réécriture destructive.
- L'identité de l'élève, la classe, la tentative, le serveur, le transport et
  le format concret d'export restent volontairement hors de ce lot : ils
  appartiendront à une future enveloppe de collecte, avant toute récolte réelle.
- Le graphe public est invalidé d'un seul tenant en `v23`. `/auto/` reste hors
  du lot ; son arbre Git de référence demeure
  `6a72d5c5ed4dd47b2e52c3109913c93bd276eb49`.
- `npm run verifier` réussit **1 276 tests sur 1 276**, ainsi que les
  validateurs du catalogue, du référencement, des routes publiques, de la
  provenance et d'Automatismes V2.
- La prochaine compétence pédagogique reste `ecritures-multiples-nombre`,
  alias humain `NC-05`, pour la cible `DNB26-06`. Elle ne commence qu'après la
  validation de ce lot de nomenclature.

## Finitions NC-01 du 9 août

- Le lot est livré au-dessus de `c5592c5`, état de `main` après la PR #291.
  Il conserve les contenus, les aides et les corrections déjà validés pour les
  autres notions.
- Les trois pages du cours `NC-01` restent distinctes. Elles explicitent
  désormais les formulations « divise », « est divisible par » et « est un
  multiple de », le lien entre les critères par 2, 5 et 10, puis les repères
  séparés des multiples de 3 et de 9 utiles lorsque la somme des chiffres ne
  dépasse pas 36.
- Les exemples `43` et `49` montrent concrètement qu'une terminaison par 3 ou
  par 9 ne suffit pas. Le cours rappelle aussi que tout multiple de 9 est un
  multiple de 3, sans ajouter de page ni modifier l'aide pas à pas.
- Dans `NC-01/F3`, une grille qui comporte une mauvaise réponse peut recevoir,
  de manière seedée et occasionnelle, un seul piège de terminaison. Sa valeur,
  sa longueur et sa position varient ; les autres mauvaises réponses de la
  grille ne répètent pas ce même motif.
- Les parts turquoise des schémas de partage remplissent maintenant toute leur
  case, y compris sur téléphone, au zoom et lorsque le texte agrandit la ligne.
  Les boutons de réponse donnent un retour bleu dès l'appui, puis conservent la
  sélection réelle au relâchement avec les mêmes attributs ARIA et le même
  comportement au clavier.
- Le graphe de cache public passe d'un seul tenant en `v22`. Le dépôt complet
  réussit **1 261 tests sur 1 261**, ainsi que les validateurs du catalogue, du
  sitemap, des routes et d'Automatismes V2.
- La publication a été explicitement autorisée par Gwenaël. `/auto/` reste hors
  du lot ; son arbre Git de référence demeure
  `6a72d5c5ed4dd47b2e52c3109913c93bd276eb49`.

## Pilote public NC-03 / NC-04 du 8 août

- Gwenaël autorise la publication afin que Claire puisse également essayer le
  module. La route `/automatismes-v2/` reste publique mais non référencée,
  absente du sitemap et marquée `noindex,nofollow`.
- Le lot est intégré au-dessus de `cff0ff2`, état de `main` après la PR #283 :
  les finitions de `NC-01` et `NC-02` sont conservées.
- Une seule entrée « Fractions simples et décimaux » couvre les deux sens ;
  chaque question conserve `fraction-vers-decimal` ou
  `decimal-vers-fraction` dans son classement et sa trace, avec `NC-03` et
  `NC-04` comme alias humains.
- Une série de 20 équilibre `10 / 10`, utilise vingt valeurs rationnelles
  distinctes, une double droite et deux QCM par sens, un millième et une
  fraction libre. Deux séries partagent nettement moins de valeurs que dans le
  premier candidat.
- Le cours comporte six pages. Les aides et corrections partagent la double
  droite, la grille de 100, le tableau de numération et les groupements en
  unités complètes. Chaque demi ou quart conserve la même taille, y compris
  dans le reste après les unités entières.
- Le cache du graphe public passe d'un seul tenant en `v21`. Les contrôles
  spécifiques du pilote couvrent aussi les fractions équivalentes, le clavier,
  les deux contextes et la diversité seedée.
- Le dépôt complet réussit **1 234 tests sur 1 234**, ainsi que tous les
  validateurs de publication.
- Le module reste `construit` pendant les essais de Gwenaël et Claire. Leurs
  retours peuvent encore conduire à des corrections avant son passage à
  `valide`.
- `/auto/` reste hors du lot ; son arbre Git de référence demeure
  `6942c4733b5cffad03c396a03f8c550e7367351f`.

## Point de reprise vérifié du 8 août

- La PR #282 est fusionnée dans `main` au commit `c55a2b2`. Elle constitue la
  base publique vérifiée de `NC-01`, `NC-02` et de la sélection multiple sur
  la route pilote `/automatismes-v2/`, avec le graphe de cache `v19` et
  toujours `noindex,nofollow`.
- `/auto/` reste indépendant. Son arbre Git de référence avant le lot de
  finition est `6942c4733b5cffad03c396a03f8c550e7367351f`.
- D-040 consigne les finitions acceptées : seule une notion choisie est
  surlignée dans le menu ; dans l'égalité inverse, le contour orange entoure
  la base saisie et laisse le véritable exposant à l'extérieur ; les couleurs
  du bouton orange et du score atteignent le contraste AA.
- `NC-01/F5` réserve désormais « trouve le plus petit » au critère par 3. La
  forme à réponse unique reste disponible pour 9 et 10, notamment pour la
  réponse exacte `0` avec le critère par 10.
- `NC-02/F1` ne propose plus aucun encadrement distracteur qui contient le
  résultat, même sur une borne. `NC-02/F4` alterne exactement les formulations
  validées « nombres carrés » et « carrés parfaits ».
- Le lecteur public accepte durablement de 1 à 20 questions. Une URL hors
  borne revient à 10 questions sans faire échouer le démarrage ; les contrats
  et générateurs génériques internes conservent leur plage 1 à 100.
- Le graphe de cache passe d'un seul tenant en `v20`, y compris les arêtes du
  registre vers le moteur de génération et du moteur vers `question-v2`. Une
  seule instance versionnée du contrat de question est ainsi chargée.
- Le dépôt complet réussit **1 159 tests sur 1 159** avec les validateurs du
  catalogue, du sitemap, des routes publiques et d'Automatismes V2.
- `NC-02` est `valide` et disponible avec `NC-01` dans les deux contextes du
  lecteur. La distribution seedée des séries et la phrase « compris entre 0
  et 12 » restent inchangées.

### Livraison NC-02

- Les six familles sont : calcul direct, recherche inverse, sens de la
  notation, reconnaissance de carrés, carré quadrillé et calcul court. Les
  quotas d'une série de 20 sont respectivement `8 / 5 / 1 / 2 / 2 / 2` : le
  rappel direct et inverse demeure donc le cœur de la séance.
- Le cours comporte cinq pages : donner du sens avec le carré, connaître les
  treize faits de 0 à 12, reconstruire 11 et 12 par des bandes `10 + 1` et
  `10 + 2`, passer du sens direct au sens inverse, puis rédiger le calcul du
  carré avant une addition ou une soustraction courte.
- Le même panneau « Me guider » fournit des étapes ordonnées ; chaque
  correction explicite la lecture, le produit, le calcul et la conclusion sans
  transformer l'aide en révélation de la réponse.
- Les puissances sont des données structurées rendues par le composant commun
  avec un véritable élément HTML `<sup>`. Le carré quadrillé est un objet SVG
  partagé, stable et accessible ; il ne fabrique pas 144 éléments pour
  représenter `12 × 12`.
- La forme `49 = □ × □` utilise deux champs indépendants et obligatoires, avec
  sélection explicite du champ actif au clavier, à la souris ou au toucher.
- F1 contient désormais trois formes de saisie, un QCM direct et un
  encadrement rare entre multiples de 10. F4 alterne « nombres carrés » et
  « carrés parfaits » avec des distracteurs diagnostiques. Les deux F5 d'une
  série de 20 utilisent des côtés différents.
- Le carré commun affiche seulement un nombre sur chacun des deux côtés. Son
  total central tient sur deux lignes, sur fond léger, avec une marge interne
  testée ; les mots « rangées », « colonnes » et « carreaux » restent dans le
  texte explicatif.
- Le fait 0 au carré appartient au cours, aux rappels et à la reconnaissance,
  mais aucun carré quadrillé `0 × 0` n'est dessiné. La famille visuelle F5
  conserve les côtés de 2 à 12.
- Le pavé, ses douze touches, le dock et leurs dimensions restent communs et
  inchangés. Seules les questions numériques NC-02 peuvent compacter leurs
  marges, leurs espacements et leur dessin sur une petite hauteur ; NC-01 et
  les autres notions ne reçoivent aucune exception.
- Le graphe de cache du lot est livré d'un seul tenant en `v17` afin qu'aucun
  navigateur ne mélange l'ancien lecteur et les nouveaux modules.
- La recette reproductible ouvre directement la série déterministe de
  20 questions avec la graine `apercu-nc02-complet` sur la route publique du
  lecteur.

### Vérifications de la livraison NC-02

- La version livrée réussit `npm run verifier` avec **1 134 tests sur 1 134**,
  après les changements pédagogiques, graphiques, responsive et de cache de
  la décision D-038.
- Les contrats, les six générateurs seedés, leurs quotas, le lecteur, le rendu
  des exposants, l'objet carré et le graphe de cache sont couverts par les
  tests automatisés.
- La série déterministe de 20 questions a été jouée intégralement dans un vrai
  navigateur sur chacun des trois formats `320 × 568`, `390 × 844` et
  `1 280 × 720` : ouverture de l'aide, saisie ou choix, validation, correction
  et passage à la suite. La recette totalise 255 états géométriques mesurés et
  78 captures, sans débordement, chevauchement ni cible inférieure à 44 px.
- L'inventaire visuel contient les cinq pages du cours, les vingt questions,
  une aide et une correction par famille, les deux champs F2 et les deux sens
  F5. Le cas maximal `144 carreaux` conserve une marge nette dans le SVG ; les
  cinq pages tiennent sans défilement sur l'écran d'ordinateur contrôlé.
- Les contrôles responsive antérieurs restent couverts par les garde-fous
  téléphone `320 × 568` et `390 × 844`, ordinateur `1 280 × 720`, TNI
  `1 920 × 1 080` et zoom équivalent à 200 %. La nouvelle revue ajoute le
  contrôle explicite des marges à l'intérieur du SVG.
- La saisie tactile des deux champs a été exécutée au pavé, le carré quadrillé
  utilise bien des côtés de 2 à 12, la question inverse sur l'aire demande
  explicitement le côté et la correction au tableau montre
  successivement l'écriture au carré, le produit de deux facteurs égaux et le
  résultat. Les contenus plus hauts défilent dans la zone centrale sans
  déplacer le dock.
- L'accord pédagogique, la recette finale et la demande de publication sont
  acquis. Les contrôles de cache et de provenance passent avec le lot complet.
- Aucun chemin sous `/auto/` n'appartient au lot ; son arbre Git de
  référence reste `6942c4733b5cffad03c396a03f8c550e7367351f`.

### Livraison de la sélection multiple

- Le contrat de séance conserve `selection` comme liste et exige désormais
  que le nombre total de questions permette de représenter chaque notion. Le
  menu désactive les longueurs trop courtes au lieu de supprimer une case
  cochée.
- Pour `N` notions et `Q` questions, le lecteur attribue `⌊Q / N⌋` questions
  à chacune, puis répartit le reste de manière seedée. L'écart maximal reste
  d'une question et aucune notion n'est absente.
- Les sous-séries sont consommées dans leur ordre pédagogique propre, puis
  intercalées de façon déterministe sans deux notions identiques voisines. Les
  séances historiques à une seule notion conservent exactement leur graine et
  leur génération.
- Le résumé, l'écran prêt, la liste des cours et le bilan affichent toute la
  sélection. Pendant le parcours, le rendu, l'aide, la correction, le cours et
  les capacités d'interaction suivent toujours la notion de la question
  courante.
- Les URL historiques avec un seul paramètre `notion` restent valides. Une URL
  mélangée répète ce paramètre. La forme canonique emploie par exemple
  `?notion=criteres-divisibilite&notion=carres-entiers-0-a-12` ; l'ancien slug
  `carres-entiers-1-a-12` reste accepté.
- Les recettes canoniques de NC-02 à 5, 10, 15 et 20 questions restent
  inchangées. Des préfixes de 1 à 20 questions permettent seulement de
  produire ses quotas intermédiaires dans une séance mélangée.
- Le graphe de cache est livré d'un seul tenant en `v18`. Aucun chemin sous
  `/auto/` n'est modifié.

## Invariant permanent d'homogénéité

L'homogénéité n'est pas une consigne ponctuelle de `NC-02` : elle s'applique à
toutes les notions suivantes. Elles conservent la même coque, le même ordre
question → réponse → validation, les mêmes panneaux de cours, d'aide et de
correction, les mêmes emplacements de commandes et les mêmes comportements
après validation. Un objet mathématique ou visuel commun est réemployé dans
tous les contextes au lieu d'être redessiné localement.

Cette invariance couvre aussi les usages : données et réponses identiques dans
« S'entraîner » et « Au tableau », cibles d'au moins 44 px, clavier physique,
souris et toucher, zone centrale défilable sans déplacement du dock, aucune
barre horizontale sur téléphone et lisibilité à distance sur TNI. Toute future
fiche et toute recette doivent la vérifier sans qu'elle ait à être redemandée.

La décision D-038 ne crée aucune variante du clavier commun. Sur une petite
hauteur, la compaction autorisée est bornée à la carte d'une question numérique
NC-02. Elle ne change ni le nombre ou la taille des touches, ni le dock, ni
l'en-tête, ni le comportement de NC-01.

## Référence vérifiée

- Dépôt : `bourgault314/maths`.
- Branche de référence : `main`.
- Commit de référence vérifié sur GitHub :
  `3f0564e`.
- La PR #282 est fusionnée : elle corrige le cadre d'aide de NC-01 et publie
  le graphe `v19`, base exacte du lot de finition D-040.
- La PR #281 est fusionnée : elle publie la sélection multiple avec le graphe
  `v18` sur la base de `NC-01` et `NC-02`.
- La PR #280 est fusionnée : elle publie `NC-02` avec le graphe `v17`, à côté
  de `NC-01`, et constitue la base de la sélection multiple `v18`.
- La PR #279 est fusionnée : elle fixe le moule public `v15` et la finition de
  `NC-01` dont est partie la livraison `NC-02`.
- La PR #170 est fusionnée : la carte DNB, la fiche validée de `NC-01`, les
  storyboards et les décisions D-014 à D-019 sont la mémoire officielle du
  chantier.
- La PR #162 est fusionnée. Elle constitue le socle technique actuel :
  contrats génériques, PRNG seedé, registre, objets indépendants, charte et
  garde-fous du périmètre V2.
- Le lot de la PR #162 réussit **705 tests sur 705** et `npm run verifier`.
- La PR #176 est fusionnée : les contrats minimaux de question V2, de séance
  et de trace nécessaires à `NC-01/F2` sont dans `main`.
- La PR #186 est fusionnée : le gabarit et le générateur seedé de `NC-01/F2`
  sont dans `main`. Le lot complet réussit **827 tests sur 827**.
- La PR #156 sur les puissances simples reste un brouillon séparé. Elle n'est
  pas le chantier actif et ne doit pas être fusionnée telle quelle. Les
  micro-notions du DNB qui mobilisent des puissances restent bien dans la carte
  et seront traitées à leur rang.
- La PR #145 est fermée sans fusion. Son principe de déclaration systématique
  de la provenance est repris proprement par la PR #202 sur le socle actuel,
  sans ses générateurs et contrats supprimés.
- Les PR #240, #241 et #242 sont fusionnées : les solides usuels, les trois
  familles de volumes, leurs ressources et leurs versions de cache sont dans
  `main`.
- Au démarrage du lot P0, `main` réussit **942 tests sur 942** et
  `npm run verifier`.

## État fonctionnel

- La bêta continue de fonctionner séparément et reste gelée hors correction
  critique.
- Le lecteur neuf expose dans « S'entraîner » et « Au tableau » les modules
  `criteres-divisibilite`, `carres-entiers-0-a-12`,
  `fractions-simples-decimaux`, `solides-usuels`, `volume-cube-pave`,
  `volume-prisme` et `volume-cylindre`.
- La carte du DNB est établie : **37 cibles officielles distinctes**,
  **38 cibles normalisées** et **88 micro-notions**.
- Une séance peut cibler une seule notion ou mélanger un nombre quelconque de
  notions disponibles. Les sept entrées publiques restent séparées dans le
  registre ; l'entrée fractions emploie une recette commune à ses deux
  micro-notions internes.
- Le critère par 10 est un complément maths&go validé. Il reste proposé dans le
  parcours DNB, tout en étant distingué des quatre critères officiels dans les
  données.
- La fiche `NC-01`, le mini-cours, les six familles initialement étudiées, les
  aides, les corrections, les storyboards et la séparation
  séance/question/trace ont été validés par Gwenaël le 19 juillet 2026. Le 6
  août, F4 et la sous-forme F6 « groupes possibles » ont été retirées ; les cinq
  familles actives et le moule commun ont été finalisés par D-029 à D-033.
- Le parcours DNB actuel ne possède ni niveaux ni paliers.

## Documents de référence fusionnés

- `carte-dnb-2026-mathsgo.md` — liste officielle, taxonomie maths&go, matrice
  de couverture et ordre des 88 micro-notions ;
- `fiche-nc-01-criteres-divisibilite.md` — contenu pédagogique validé ;
- `contenu-nc-01-cours-et-f2.md` — mini-cours et sept spécimens de référence ;
- `storyboard-parcours-commun.md` — lancement, séance, progression et bilan ;
- `storyboard-nc-01-f2.md` — carte interactive et projection ;
- `specification-papier-seance-question-reponse.md` — responsabilités des
  données avant les contrats techniques.

Ces documents ont autorisé la fabrication de la première tranche verticale.
Leur contenu reste la référence pédagogique des lots déjà fusionnés.

## Document de référence NC-02

- `fiche-nc-02-carres-1-a-12.md` — périmètre, cinq pages de cours, six
  familles, aides, corrections, contrats visuels et recette de `NC-02`.

Cette fiche a autorisé la fabrication puis reçu les décisions pédagogiques du
7 août. La publication demandée a lieu après la vérification technique et la
recette visuelle du lecteur terminé.

## Lot technique fusionné : générateur seedé de NC-01/F2

Le deuxième sous-lot technique est construit et testé :

- le nouveau paquet `@mathsgo/automatismes` contient le gabarit et le
  générateur `selection-diviseurs`, puis l'enregistre explicitement dans le
  moteur ;
- le registre sait valider le contrat déclaré par chaque générateur : la
  version 1 reste le défaut et la version 2 est utilisée par `NC-01/F2` ;
- la génération croise équitablement quatre classes de chiffre des unités et
  trois classes de somme des chiffres, soit les douze ensembles de réponses
  mathématiquement possibles ;
- les nombres possèdent deux, trois ou quatre chiffres, avec les cas de zéro
  interne et d'unité zéro ;
- l'aide générale est identique quelle que soit la réponse ; la correction
  examine séparément 2, 5 et 10, calcule une seule fois la somme des chiffres,
  puis examine 3 et 9 avant la conclusion ;
- mille générations seedées vérifient les cinq critères, les implications
  `9 → 3` et `10 → 2 et 5`, le déterminisme et la variété ;
- Gwenaël a validé explicitement les instances produites, leurs aides et leurs
  corrections le 19 juillet 2026 ;
- les sept garde-fous du dépôt passent sur 74 fichiers et le lot complet
  réussit **827 tests sur 827**.

La PR #202 reconstruit le garde-fou de provenance sur le socle actuel. Avec le
lecteur, les 41 fichiers de production des six dossiers V2 déclarent leur
statut et leur source ; la CI refuse un fichier oublié comme une déclaration fantôme. Ce
contrôle complète les interdits techniques de la PR #162 sans modifier le
contenu pédagogique ni l'application visible.

Le clavier numérique, les fractions, le serveur, l'identité de
l'élève et le chronomètre ne sont pas construits par anticipation.

## Lot fusionné : solides usuels et volumes

La PR #240 a intégré le lot construit sur `feat/v2-solides-volumes-dnb` :

- `GE-12/F1` reconnaît cube, pavé droit, prisme droit, cylindre, pyramide et
  cône par choix unique ; la question reste fixe, l'aide et le cours permettent
  la rotation avec recalcul des arêtes cachées ;
- Les actuels `GM-13`, `GM-14` et `GM-15`, encore nommés `PG-22`, `PG-23` et
  `PG-24` lors de cette livraison historique, restent trois séances distinctes
  pour le cube et le pavé, le prisme droit et le cylindre ;
- les conversions, capacités, pyramides et cônes sont explicitement hors de ce
  noyau de calcul de volumes ;
- le cours part de 1 cm³, montre un empilement 3 × 2 × 2 puis verbalise
  l'invariant « aire de la base × hauteur » ;
- le cylindre distingue la valeur exacte en π de la valeur approchée avec
  π ≈ 3 ; « environ » est contrôlé dans consigne, réponse et correction ;
- les tests mathématiques, les tests du lecteur et les garde-fous de provenance
  passent dans `main` ;
- les PR #241 et #242 ont ensuite aligné les ressources et les versions de
  cache nécessaires à leur chargement dans le lecteur.

## Lot technique fusionné : lecteur commun de NC-01/F2

Le lecteur est construit à neuf dans `automatismes-v2`, sans reprendre
l'interface de la bêta :

- le même moteur d'état alimente l'interactif et le diaporama ;
- l'écran de départ reste générique et récapitule la sélection, le nombre de
  questions et l'état de l'aide ;
- l'interactif affiche une grille de six choix, conserve la sélection après
  validation, crée une trace conforme et calcule le score depuis les traces ;
- « Aucun » est exclusif et aucune bonne réponse n'est révélée avant
  l'ouverture volontaire de la correction ;
- l'aide fait repérer l'unité puis composer la somme des chiffres en deux
  gestes colorés et manipulables, sans effectuer le calcul ni conclure ;
- la correction distingue visuellement le chiffre des unités, les verdicts
  pour 2, 5 et 10, la somme des chiffres, les verdicts pour 3 et 9, puis la
  conclusion, tout en conservant les explications validées ;
- le diaporama ne crée ni trace ni score et possède ses commandes enseignant
  pour l'aide, la réponse, la correction et le passage à la suite ; à partir
  de 900 px, ses cinq propositions occupent une seule ligne lisible à distance ;
- en projection, la question et la barre enseignant restent fixes dans la
  hauteur de l'écran : seul le panneau latéral peut défiler ;
- à 375 px, il n'existe aucun débordement horizontal et toutes les cibles
  tactiles mesurent au moins 44 px ;
- à 1 280 px, l'aide occupe 32,9 % de la largeur et la correction 50 %, sans
  masquer le nombre ni les cinq propositions ;
- les garde-fous V2 couvrent désormais le lecteur sur 78 fichiers et le dépôt
  complet réussit **904 tests sur 904**.
- Gwenaël a validé l'affichage et demandé sa publication le 19 juillet 2026 ;
  la PR #191 livre cette première tranche verticale sur le site public.

## Point de livraison D-038

D-038 est achevée sans variante du clavier commun : treize bases, cinq pages,
aucune représentation `0 × 0`, champs à contour unique et compaction locale
des questions numériques NC-02. Les tests complets, le validateur V2, le
graphe de cache et la recette réelle à `320 × 568`, `390 × 844` et
`1 280 × 720` sont réussis.

La branche est figée, fusionnée conformément à la demande de publication puis
contrôlée après GitHub Pages. Avant le push, après le commit et après le
déploiement, l'arbre `/auto/` reste exactement
`6942c4733b5cffad03c396a03f8c550e7367351f`. Le prochain chantier pédagogique
ne commence qu'après ce contrôle public.

La carte de couverture conserve 88 micro-notions internes, mais elles ne
deviennent pas 88 questionnaires visibles. Les catégories du menu pourront
regrouper plusieurs micro-notions : `NC-03` et `NC-04`, par exemple, formeront
une même catégorie visible « Fractions simples et décimaux » tout en gardant
deux générateurs et deux suivis internes.

## Règle de mise à jour

À chaque fin de tâche, remplacer le chantier actif et la prochaine étape par
l'état réel. Ne jamais conserver ici une action déjà terminée comme si elle
était encore à faire.
