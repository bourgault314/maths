# État du chantier Automatismes V2

**Dernière mise à jour : 22 août 2026.**

## Restauration complète des interactions du menu de référence

- D-072 rétablit les commandes globales « Tous » et « Aucun », ainsi que
  « Tout sélectionner dans ce domaine » dans chaque domaine non vide.
- La commande de domaine possède les trois états du menu de référence : case
  vide, petit moins pour une sélection partielle et coche lorsque tout le
  domaine est sélectionné. Une sélection partielle est complétée au clic ; un
  domaine complet est entièrement désélectionné au clic suivant.
- Les couleurs stables du menu publié sont reprises par domaine : turquoise
  pour Nombres et calculs, orange pour Espace et géométrie, bleu pour Données,
  statistiques et probabilités, violet pour Pensée informatique.
- La barre « Lancer la série » n'existe plus dans la page tant qu'aucun
  automatisme visible n'est sélectionné. Elle apparaît dès la première vraie
  sélection ; le simple dépliage d'un domaine ne suffit pas.
- « Tous » ajoute les automatismes visibles du niveau courant ; « Aucun »
  efface toute la sélection, y compris une notion momentanément masquée par un
  changement de filtre. Les domaines vides ne présentent aucune commande
  impossible.
- Cette restauration ne modifie aucun générateur, seed, classement, contenu
  pédagogique ni module, notamment GE-03 et GE-04. `app.js` et `menu.css`
  reçoivent uniquement la révision de façade `51` ; le graphe reste en `v49`.
- La recette complète passe **1 729 tests sur 1 729** dans **245 suites** ; les
  garde-fous V2 suivent toujours 151 fichiers et 77 fichiers de production.

## Dernières finitions du menu Cycle 4 – DNB

- D-071 retire le doublon visuel « Gérer mes cookies » : le lien intégré au
  pied du menu reste l'unique accès visible et ouvre toujours le gestionnaire
  de consentement commun.
- Les quatre réglages reviennent à deux colonnes égales, comme dans le Studio :
  « Niveau » s'aligne avec « Mode » et « Aide » avec « Nombre de questions ».
- Le remerciement affiche désormais seulement « Claire ». Aucun automatisme,
  générateur, seed, classement ni contenu de GE-03 ou GE-04 n'est modifié.
- `app.js` et `menu.css` reçoivent la révision de façade `50` tandis que le
  graphe de modules reste identique en `v49`.
- La recette complète passe **1 726 tests sur 1 726** dans **245 suites** ; les
  garde-fous V2 suivent 151 fichiers et 77 fichiers de production déclarés.

## Menu Cycle 4 – DNB publié le 22 août

- D-070 maintient la calculatrice barrée pour `5e`, `4e`, `3e` et `DNB` :
  toutes les séries sont sans calculatrice et le résumé l'écrit quel que soit
  le filtre.
- D-069 place « Remerciements » et « Gérer mes cookies » au bas du menu, sans
  titre « Crédits » ni mention de DocTools. Le texte remercie Claire pour son
  regard pédagogique, ses relectures et ses idées.
- D-068 reprend les quatre regroupements exacts du Studio, y compris les
  domaines encore vides, ainsi que les quatre familles d'icônes journalières
  déterministes.
- Le filtre de programme propose `5e`, `4e`, `3e` et `DNB`. Les huit modules
  publiés appartiennent actuellement aux quatre listes ; chaque futur module
  devra continuer de déclarer explicitement ses classes.
- Les réglages sont « Mode » avec « S'entraîner / Au tableau », 5, 10, 15 ou
  20 questions, puis « Avec aide / Sans aide ». Sans aide retire le cours et
  laisse le bouton Aide de la séance visible, grisé et inactif.
- La publication issue de la PR #479 a été contrôlée sur le site : les huit
  modules sont présents, GE-03 et GE-04 restent séparés, le placement de GE-04
  est modifiable avant validation et le gestionnaire de cookies s'ouvre.

## GE-03 et GE-04 publiés pour essai le 22 août

- D-066 maintient deux modules visibles distincts : GE-03 « Lire les
  coordonnées d'un point » et GE-04 « Placer un point dans un repère ». Ils
  mutualisent un cours en trois pages, les aides, les diagnostics E1 à E6 et
  le nouvel objet V2 `repere-cartesien.js`.
- Le repère est maintenant un objet officiel du Studio et de la fondation :
  pas entier, unités carrées, bornes asymétriques contrôlées, origine visible,
  placement d'étiquettes, guides de lecture, chemin de placement et rôles de
  correction. Aucun code d'un ancien module n'est importé.
- GE-03 emploie exactement les quotas `10 / 3 / 3 / 2 / 2` sur 20 questions
  pour lecture complète, abscisse, ordonnée, QCM diagnostique et
  identification. GE-04 reste composé uniquement de placements aimantés,
  modifiables avant validation et accessibles avec les quatre flèches.
- L'audit de 1 000 seeds par module contrôle 40 000 profils. Les quatre
  quadrants et les deux axes sont garantis dans chaque série de 20 ; l'origine
  apparaît 254 fois en GE-03 et 286 fois en GE-04. Cent seeds instanciés par
  module recoupent 4 000 questions avec leur affichage et leur correction.
- La revue vectorielle mobile et ordinateur a trouvé puis fait corriger deux
  défauts : proximité de `O` et `−1` à 320 px, et taille trop retenue au TNI.
  Le contrôle structurel couvre cinq fenêtres de `320 × 568` à
  `1 920 × 1 080`, les cibles de 44 px, les panneaux, l'aimantation et le
  clavier.
- La vérification complète passe **1 709 tests sur 1 709** dans **242 suites** ;
  les garde-fous V2 suivent 148 fichiers et 77 fichiers de production déclarés.
  Le cache est invalidé atomiquement en `v46`.
- Gwenaël valide les planches, demande que les flèches positives remplacent le
  dernier trait de graduation puis autorise la publication pour essai. Les
  nombres terminaux restent affichés. Cette mise en ligne ne change pas le
  statut pédagogique `construit` ; la recette de 36 captures réelles sur cinq
  fenêtres reste disponible pour la revue du lecteur déployé.

## Module « Droite graduée » construit le 21 août

- D-065 fixe le classement : `GE-01` et `GE-02` restent dans
  `espace-et-geometrie` et formeront un seul module visible « Droite
  graduée ». Le module est désormais construit dans le lecteur V2.
- Le premier lot local, sur `agent/ge-droite-graduee-studio`, fait passer
  l'objet commun en version 2. Une nouvelle échelle régulière est définie par
  une première valeur, un pas et un nombre d'intervalles ; elle ne peut donc
  pas terminer par un intervalle plus court. La géométrie calculée est exposée
  pour que le futur placement interactif utilise exactement la même source.
- Les nombres du SVG emploient la typographie mathématique commune avec des
  chiffres alignés et tabulaires. Les titres et noms de lignes gardent la
  typographie de texte.
- La planche du Labo et les séries couvrent les pas `0,1`, `0,25`, `0,5`, `1`, `10` et `50`,
  une origine à gauche, centrée, décentrée, non écrite ou hors champ, des
  valeurs toutes négatives, deux références non nulles et une droite muette
  destinée au placement.
- GE-01 et GE-02 possèdent leurs générateurs seedés, leurs quotas aux jalons
  5/10/15/20, un pavé décimal signé, un placement aimanté au clic ou au
  clavier, un cours en cinq pages, une aide en trois étapes et une correction
  qui superpose le point choisi et le point attendu.
- Les erreurs typiques donnent des retours ciblés : signe oublié, graduation
  voisine, écart total confondu avec le pas, traits comptés à la place des
  intervalles et pas supposé égal à 1.
- La vérification complète du dépôt passe **1 664 tests sur 1 664** dans
  **234 suites**. Le statut reste `construit` jusqu'à la validation visuelle
  de Gwenaël dans le lecteur.

## Fractions canoniques dans la synthèse du cours du 21 août

- D-063 corrige uniquement les deux rails de synthèse de la page 6 de
  NC-03 / NC-04. Les demis et les quarts y reprennent le format mobile
  standard de largeur source `340`, déjà employé dans les exemples détaillés,
  « Me guider » et les corrections. Les fractions restent rendues par la
  primitive canonique commune ; aucun générateur, profil de révélation,
  repère, résultat ou ordre seedé n'est modifié.
- Un test d'intégration interdit désormais au cours de redemander la variante
  `mobile-compact` et vérifie que les appels d'aide conservent leur largeur
  standard. La vérification complète passe **1 647 tests sur 1 647** dans
  **232 suites**. Le graphe de cache est invalidé atomiquement en `v40`.

## Publication d'essai de NC-05 du 21 août

- NC-05 « Un nombre, plusieurs écritures » est intégré au lecteur public avec
  six familles reliant pourcentage, décimal, fractions repères et écritures
  supérieures à l'unité. Il ne répète pas les conversions isolées de NC-03 /
  NC-04.
- Les séries de 5, 10, 15 ou 20 sont seedées, sans valeur rationnelle répétée.
  Dès 10 questions, elles couvrent `100 %` et une valeur supérieure à 1. La
  sélection multiple est réservée à l'unique second item de reconnaissance
  d'une série de 20.
- Le cours compte six pages. L'aide reste progressive et ne dévoile pas la
  réponse ; la correction reprend la valeur exacte et son ordre de grandeur.
- Gwenaël autorise la publication en production afin de tester le module en
  ligne. Ce déploiement ne vaut pas validation pédagogique : NC-05 reste au
  statut `construit`. La recette complète passe **1 657 tests sur 1 657** dans
  **233 suites**. Le graphe de cache public est invalidé atomiquement en `v41`.

## Sélection explicite du lanceur du 17 août

- D-062 réserve l'état vide au menu ouvert sans paramètre : aucun automatisme
  n'est coché, le compteur affiche `0 / 3`, le résumé invite à choisir et le
  lancement reste désactivé.
- Le cœur du lecteur continue d'exiger au moins une notion. Un lien direct
  `?notion=...` conserve sa sélection et son accès à l'écran prêt ; un retour
  au menu garde cette notion cochée.
- Les tests du lanceur couvrent l'arrivée vide, le premier choix, la sélection
  multiple et le lien direct. Le graphe de cache passe atomiquement en `v39`.

## Repères symétriques du cours et cartouche de projection du 16 août

- D-061 conserve les six pages et les trois outils de NC-03 / NC-04. Le cours
  nomme des bandes représentant un demi ou un quart ; le rail de la page 1
  écrit `1/2 = 0,5`, puis celui de la page 2 rend visibles
  `1/4 = 0,25`, `2/4 = 1/2 = 0,5` et `3/4 = 0,75`.
- La page 3 formule ses trois échanges avec un signe égal et centre les cartes
  isolées lors d'un retour à la ligne. Le texte des centièmes emploie désormais
  le moutarde accessible de la charte, tandis que les plaques restent jaunes.
- La page 6 conserve les explications détaillées de `7/2` et `6/4`. Dans le
  cours seulement, leurs rails montrent les repères décimaux intermédiaires en
  gardant la cible finale à `?`. Ces exemples détaillés conservent la largeur
  source standard `340` sur téléphone. Une synthèse visuelle par bandes
  présente de façon symétrique les repères successifs des demis et des quarts,
  dont `3/4 = 0,75` ; ses deux rails utilisent la variante téléphone
  `mobile-compact` de largeur source `260`. Les aides d'exercice gardent leurs
  profils anti-fuite.
- Le cartouche orange commun ne porte plus d'ombre en mode « Au tableau » : le
  décalage visible sous son contour disparaît, sans changer son rendu en
  entraînement. Aucun générateur, quota, ordre seedé ni résultat attendu n'est
  modifié.
- La recette automatisée complète est verte : **1 586 tests sur 1 586** dans
  **232 suites** ; le graphe de cache passe atomiquement en `v38`. La revue
  locale aux cinq fenêtres n'a pas pu être rejouée faute de runtime Chromium.
  Elle doit être réalisée sur l'URL publique, avec un contrôle explicite du
  cours, des aides masquées et du cartouche en projection. Gwenaël demande la
  publication afin d'y mener cette dernière revue. Le module reste `construit`.

## Variété des séries et outils adaptés de NC-03 / NC-04 du 16 août

- D-060 étend la banque continue des quarts de `1/4` à `12/4` dans les
  questions non libres des deux sens, en saisie directe comme en QCM. Seul
  `11/4` rejoint en plus la banque libre familière ; aucune question extérieure
  à ce domaine n'est modifiée.
- Une série de 5 contient une question de chacune des familles `/2`, `/4`,
  `/10` et `/100`, ainsi qu'une production libre. Leur ordre reste entièrement
  déterminé par la graine : aucune question « facile » n'est forcée en tête et
  une fraction libre n'y est ni imposée ni interdite.
- L'ordre déterministe évite deux QCM consécutifs, deux productions libres
  consécutives, trois questions du même sens consécutives et trois
  dénominateurs identiques consécutifs. Les quotas et questions des autres
  domaines restent inchangés.
- `1/4`, `3/4`, `0,25` et `0,75` sont expliqués d'abord par les bandes sur
  rail, puis par les plaques colorées réorganisées, jamais par le tableau.
  `2/4` reste sur le rail avec fusion en `1/2`. Les familles `/10` et `/100`
  conservent les méthodes alternatives plaques et tableau ; `/1000` emploie
  le tableau seul ; les demis et quarts impropres emploient le rail.
- Le rail des quarts accepte `9/4` à `12/4` et atteint 3 unités. Dans l'aide du
  sens inverse au-delà de huit quarts, l'élève peut avancer d'une unité, soit
  quatre quarts, sans révélation du numérateur attendu.
- Les égalités de correction des entiers cachés ne répètent plus la fraction
  ni l'entier. La recette automatisée complète passe **1 579 tests sur
  1 579**, répartis en **232 suites**. L'audit de **40 000 séries**, soit
  **500 000 questions**, ne relève aucune violation des quotas, de l'unicité
  rationnelle ou des quatre contraintes de voisinage. Le Labo passe
  **165 tests sur 165** et le graphe de cache est invalidé atomiquement en
  `v37`. Gwenaël autorise la publication de test ; la revue visuelle aux cinq
  fenêtres doit être rejouée sur l'URL publique. Le module reste `construit`.

## Deux méthodes alternatives pour les conversions NC-03 / NC-04 du 16 août

- D-059 corrige la mise en récit de la conversion sans modifier les
  générateurs, les questions, les familles, les quotas ni les réponses
  attendues. Le module reste `construit`.
- L'état initial du matériel montre seulement les rangs naturels du nombre :
  pour `2,27`, `2`, `2/10` et `7/100`. Les égalités
  `2 = 200/100` et `2/10 = 20/100` n'apparaissent qu'après l'échange de la
  même quantité en centièmes.
- Les pages 4 et 5, « Me guider » et la correction des conversions en `/10`
  et `/100` proposent deux voies parallèles :
  « Méthode 1 · Avec les plaques de couleurs »
  et « Méthode 2 · Avec le tableau de numération ». Aucune flèche ne transforme une méthode
  en l'autre ; une flèche interne au matériel peut en revanche montrer
  l'échange entre ses deux états.
- Les conversions en `/1000` restent traitées par le tableau seul. Le cours,
  l'aide et la correction réemploient toujours les mêmes objets partagés et
  leurs profils de révélation.
- Le cours nomme trois outils : bandes de fractions sur demi-droite ou rail,
  plaques colorées de numération et tableau de numération. Les pages 1 et 2
  rendent les trois visibles ; les pages 4 et 5 utilisent les plaques et le
  tableau. Dans un exercice ou une correction, le lecteur choisit le visuel le
  plus pertinent au lieu de tous les cumuler ; le tableau reste transversal.
  Pour `2/4 = 0,5`, les bandes sur rail sont préférées à la grille de 100.
- La recette D-059 est verte : **1 562 tests** passent. La revue couvre
  **116 captures** sur cinq fenêtres, de `320 × 568` à `1 920 × 1 080`, sans
  erreur navigateur, débordement local ou global, texte coupé ni élément hors
  panneau. Elle contrôle les trois outils, `2/4`, `2,27`, les masques dans les
  deux sens et le tableau seul pour `/1000`.
- Le graphe public déjà exposé en `v35` est invalidé atomiquement en `v36` afin
  que cette nouvelle organisation soit chargée sans ancien cache.

## Révision pédagogique finale de NC-03 / NC-04 du 16 août

- D-058 complète D-056 sans changer les générateurs, les familles, les quotas
  ni les réponses attendues. Le cours conserve six pages et suit désormais le
  même ordre dans chaque exemple : matériel, grande égalité mathématique, puis
  tableau de numération comme vérification. Le module reste `construit`.
- La page 1 place `0,5 = 5/10 = 1/2` immédiatement sous les cinq dixièmes ;
  les deux grandes égalités de la page 2 suivent de même leurs réorganisations
  en quarts. Les phrases qui répétaient ce que le tableau montrait sont retirées.
- La page 3 montre trois échanges à empreinte identique :
  `1 unité = 10 dixièmes`, `1 dixième = 10 centièmes` et
  `1 unité = 100 centièmes`. Les repères écrits précèdent le tableau.
- Les pages 4 et 5 sont les deux sens d'un même mouvement : matériel dans le
  rang final vers rangs usuels pour `147/100 = 1,47`, puis rangs usuels vers
  centièmes pour `3,54 = 354/100`. Leur égalité vient avant le tableau. La page
  4 distingue explicitement `7/100 = 0,07` et `7/1000 = 0,007` ; la page 5 ne
  contient plus de consignes propres aux champs de réponse.
- La charte expose une teinte pédagogique canonique par rang pour les
  écritures mathématiques du cours, sans confondre cette teinte avec celle des
  verdicts d'interface. Le tableau adapte la taille de « Centièmes » et
  « Millièmes » à la largeur de ses colonnes au lieu de couper les en-têtes.
- La page 6 restaure les bandes sur rail au format standard de largeur source
  `340` sur téléphone. Sa liste « Choisir un outil » et sa note finale sur la
  division sont supprimées ; les constructions validées de `7/2`, `6/4`, des
  repères de demis et du dénominateur 1 sont conservées.
- Les recettes antérieures restent des témoins historiques. La recette D-058
  est verte : **1 555 tests** passent. Les six pages ont été contrôlées dans
  **30 états** sur cinq fenêtres, de `320 × 568` au TNI `1 920 × 1 080`, avec
  **90 captures** haut–milieu–bas : aucun débordement de document, panneau,
  figure ou fraction et aucune erreur JavaScript. Les contrôles ciblés des
  aides confirment le masque, la virgule et les en-têtes mobiles. Le graphe
  public passe atomiquement de `v34` à `v35`.

## Unification des rangs de NC-03 / NC-04 du 16 août

- D-056 constitue la fondation visuelle reprise par D-058, sans modifier les
  générateurs, les familles, les quotas ni les réponses attendues. Le module
  reste `construit`.
- La charte porte désormais l'unique palette sémantique des rangs : unités
  rouges, dixièmes verts, centièmes jaunes et millièmes violets, avec des
  variantes de texte contrastées. `nombreDecimalAvecRangs` colore chaque
  chiffre selon sa position et laisse la virgule neutre ; ce même rendu est
  employé dans le cours, les questions, leurs rappels, l'aide et la correction.
- Le tableau unités–dixièmes–centièmes–millièmes n'existe plus en deux
  implémentations HTML et SVG. Le SVG commun place sa virgule à la frontière
  unités–dixièmes, conserve au besoin le rang final et masque réellement ses
  chiffres, y compris dans son texte accessible et ses attributs de données.
- Les échanges `1 unité = 10 dixièmes` et
  `1 dixième = 10 centièmes` conservent une empreinte strictement identique de
  part et d'autre. D-058 leur ajoute `1 unité = 100 centièmes`. Une conversion
  paramétrique réemploie les mêmes groupes aux dixièmes ou aux centièmes, dans
  les deux sens, avec les états « par rang » et « tout dans le rang final ».
- Les pages 1 et 2 gardent les correspondances concrètes
  `0,5 = 5/10 = 1/2`, `0,25 = 25/100 = 1/4` et
  `0,75 = 75/100 = 3/4`. La page 3 utilise les deux échanges exacts. La page 4
  transforme `147/100` en `1,47` ; la page 5 transforme `3,54` en `354/100`.
  D-058 place leurs égalités avant le tableau et allège la page 6 comme décrit
  en tête de document.
- `/10` et `/100` utilisent la même conversion puis le même tableau dans le
  cours, « Me guider » et la correction. Les fractions libres `0,5`, `0,25`
  et `0,75` conservent leurs correspondances dédiées ; les autres cibles
  décimales passent par la conversion générique. `/1000` reste volontairement
  limité au tableau, sans matériel miniaturisé.
- Les profils `aide-nc03` et `aide-nc04` sont liés à leur sens et retirent la
  cible inconnue du dessin, des légendes, du texte alternatif et des attributs.
  Dans le lecteur, le profil `solution` est réservé au cours et à la correction.
- Le Labo reçoit les entrées « Échanges exacts entre rangs » et
  « Conversion par rang — mêmes empreintes » à côté du matériel, du tableau et
  des correspondances déjà comparables.

## Saisie inverse et carré quadrillé neutre de NC-02 du 16 août

- Les trois formes inverses F2 acceptent désormais une saisie jusqu'à `144`.
  Une erreur comme `80`, ou la recopie de `100`, `121` ou `144`, reste visible,
  est validée, tracée et comptée fausse au lieu d'être tronquée silencieusement.
- La même capacité vaut pour F5 lorsque le côté est à retrouver, avec le pavé
  tactile comme avec le clavier physique. Les réponses justes restent
  comprises entre `0` et `12`.
- L'aide F5 où l'aire est à trouver ne colore plus une rangée et une colonne.
  Elle montre le même quadrillage neutre que la question et la correction ; le
  texte « Repère les n rangées du carré : chacune contient n carreaux » porte
  la lecture multiplicative sans révéler le total.
- Les décompositions colorées `10 + 1` et `10 + 2` du cours pour `11²` et
  `12²` restent inchangées, car elles expliquent un autre calcul.
- F2 passe en version 3, F5 en version 2 et l'objet carré commun reste en
  version 4. Le candidat public invalide tout le graphe V2 en `v34` ; `/auto/`
  reste hors du lot.
- La validation complète réussit **1 554 tests sur 1 554**, ainsi que tous les
  validateurs de publication.

## Progression concrète de l'aide F3 de NC-02 du 15 août

- L'aide « Quelle écriture correspond à ce carré ? » suit désormais trois
  temps : observer le carré et chercher l'opération qui compte les carreaux ;
  lire la règle générale `a² = a × a` ; repérer le seul produit qui répète le
  même facteur.
- Le carré commun est placé dans la première carte numérotée, en mode
  `aire-inconnue`. Il montre les deux côtés égaux et un `?` central, sans
  rangée ou colonne colorée et sans révéler le total dans le texte alternatif.
- La première page du cours affiche explicitement `a² = a × a`, en plus de
  l'exemple complet `4² = 4 × 4 = 16` et de l'opposition avec `4 × 2`.
- Le générateur F3 passe en version 2. Le cas `1²` peut afficher un seul
  carreau dans cette aide de sens ; F5 demeure limitée aux côtés de 2 à 12.
- Cette finition rejoint le candidat `v30` avant sa première publication. La
  validation complète réussit **1 509 tests sur 1 509**, ainsi que tous les
  validateurs de publication.

## Correctif de la police mathématique sur iPhone du 15 août

- Les captures prises après la publication de `v29` ont révélé la limite du
  correctif OpenType : Georgia conserve sur Safari/iOS des chiffres anciens,
  même lorsque `lining-nums` et `lnum` sont déclarés.
- La charte 2 retire Georgia. La pile mathématique commune devient
  `'Times New Roman', Times, 'Liberation Serif', serif`, puis se propage aux
  nombres HTML et SVG par des imports explicitement versionnés.
- NC-02 utilise une graisse 700 commune pour la question, les QCM, les champs,
  les rappels, les réponses correctes et le total du carré quadrillé. Les
  anciennes demandes en 800 sur les choix, les cases et le total central sont
  supprimées.
- La reproduction est figée avec la graine `repro-police-132` : le QCM
  d'opérations apparaît à la question 9 et l'encadrement de `6²` à la question
  12. La recette vérifie aussi `0`, `60`, `64` et `81` sur un vrai iPhone, car
  Chromium sous Linux ne charge pas la même fonte système.
- Le graphe public est invalidé d'un seul tenant en `v30`. `/auto/` reste hors
  du lot.
- La validation complète réussit **1 508 tests sur 1 508**, ainsi que les
  validateurs du catalogue, du référencement, du sitemap, des icônes, de
  l'ancien outil, de V2 et de Pythagore.

## Finitions mobiles de NC-02 du 15 août

- Le lot est réintégré sur `24e208c`, état de `main` après les dernières
  publications Solèy, et reste isolé sur la branche
  `agent/nc02-finitions-mobiles`.
- Le repère « Fais défiler ↓ » n'enregistre plus d'état permanent après un
  premier mouvement. Il tolère un rebond tactile de huit pixels, disparaît
  pendant un vrai défilement et revient lorsque le panneau retrouve le sommet.
- Les nombres du carré quadrillé, notamment le total central `64`, utilisent
  la police mathématique commune et les variantes OpenType alignées et
  tabulaires. Le libellé verbal conserve la police de texte.
- Les mêmes variantes OpenType s'appliquent aux nombres HTML, aux champs, aux
  rappels et aux réponses correctes. Les valeurs d'un titre passent par le
  composant mathématique commun ; `0`, `60`, `64` et `81` gardent ainsi une
  géométrie cohérente sur Safari.
- Le carré quadrillé ne contient plus aucun rayon : contour, fond et cartouche
  central ont des angles droits. La rangée et la colonne colorées restent
  limitées à l'aide F5.
- Les messages, les rappels de réponse et les réponses correctes sont centrés
  dans leurs boîtes communes, horizontalement et verticalement.
- La mise en page compacte dépend de la nature numérique de la question ; la
  visibilité du pavé est gérée séparément. Après validation, le pavé disparaît
  conformément à D-049 mais les espacements de la carte restent identiques.
  L'ancrage supérieur est aussi imposé sur les tablettes tactiles larges.
- Le graphe public est invalidé d'un seul tenant en `v29`. Le diff sous
  `/auto/` reste vide et son arbre demeure
  `6a72d5c5ed4dd47b2e52c3109913c93bd276eb49`.
- Les tests ciblés couvrent le retour du repère au sommet, la séparation des
  deux classes de mise en page, la typographie HTML et SVG, les angles droits,
  le centrage commun et l'ancrage tactile. La validation complète réussit
  **1 505 tests sur 1 505**, ainsi que les validateurs du catalogue, du
  référencement, du sitemap, des icônes, de l'ancien outil, de V2 et de
  Pythagore.

## Candidat intégré NC-03 / NC-04 du 13 août

- Le lot part de `32b0664`, état de `main` publié. Gwenaël a autorisé le
  13 août sa publication de test sur la route pilote. Le module demeure
  `construit`, non référencé et hors sitemap en attente de l'arbitrage
  pédagogique final de Gwenaël et de Claire.
- Le module visible unique conserve les deux micro-notions internes à parts
  égales. Aux longueurs `5 / 10 / 15 / 20`, les séries comportent exactement
  `1 / 2 / 3 / 4` QCM diagnostiques, `1 / 1 / 2 / 2` productions de fraction
  libre et `0 / 0 / 1 / 1` millième. Les questions ne portent plus aucune
  double droite : elles sont abstraites ou en QCM, les représentations étant
  réservées au cours, à l'aide et à la correction.
- Les repères officiels ne deviennent pas une liste récitée : ils restent
  mélangés aux valeurs variées de chaque famille, mais une série de 20 en
  garantit au moins deux, choisis et placés par la graine.
- Les fractions libres commencent dès cinq questions. À partir de 15, l'une
  cible les demis/quarts et l'autre les dixièmes/centièmes. Toutes les
  fractions équivalentes, réduites ou non, restent acceptées par produit en
  croix. Le millième apparaît dès 15, peut employer trois chiffres et passe
  uniquement par le tableau de numération.
- Les deux générateurs ne portent plus de textes d'aide ou de correction
  concurrents. Ils fournissent la question et, pour un QCM, les diagnostics de
  distracteurs ; le lecteur est l'unique source du pas-à-pas et de la
  correction.
- « Me guider » rassemble indice, représentation et construction dans un seul
  atelier progressif, sans trois onglets concurrents. L'élève progresse du
  verbal vers l'image puis l'action ; l'égalité finale et les alternatives
  accessibles conservent `?` jusqu'à la validation. `/1` se compte avec des
  tuiles non numérotées, les demis et quarts emploient les bandes sur rail et
  les groupements, `/10` et `/100` le matériel décimal puis le tableau,
  `/1000` le tableau seul.
- D-055 remplace l'organisation D-054 du cours tout en gardant six pages :
  construire le demi sans second rail sous les dixièmes ; construire les
  quarts par réorganisation des centièmes ; installer séparément les échanges
  unité-dixièmes-centièmes et le millième au tableau ; convertir `147/100` en
  `1,47` ; repartir du matériel de `3,6` pour obtenir `36/10` ; enfin restaurer
  sur une même page les transformations de `7/2` et `6/4`, les repères en
  demis, cinq bandes marquées `1` pour `5/1` et la stratégie finale. Cette
  photographie de D-055 est historique : D-056 remplace ensuite les objets et
  les exemples des pages 1 à 5 ; D-058 réordonne ces pages et retire de la
  page 6 la stratégie répétitive ainsi que la note quotient, comme décrit en
  tête de document.
- Une omission ne déplie plus la correction. Après une saisie omise, le
  lecteur affiche « Pas de réponse » puis la solution en vert hors du panneau ;
  après un QCM omis, la proposition correcte passe en vert. Une saisie fournie
  et fausse reste rouge et ne révèle la solution que dans l'explication ; un
  QCM faux conserve le choix erroné en rouge et montre immédiatement le bon
  choix en vert. Le pavé et le clavier sont figés après validation.
- Le Labo conserve les vues comparatives, tandis que le lecteur utilise
  désormais les composants communs `bandes-fractions-rail.js`, étendu aux
  unités, `correspondances-decimales.js`, `numeration-decimale.js`,
  `droite-graduee.js` et les schémas de `fractions.js`. Les fractions placées
  dans les bandes, les correspondances et leurs équations passent toutes par
  `rendreFractionSvg` et sa mesure canonique de `expressions.js`. Les rails
  conservent un guide à l'origine et à l'arrivée, une graduation finale sans
  point rond et une flèche décalée après cette graduation ; les pièces `/1`
  affichent simplement `1`. Le graphe public est invalidé d’un seul tenant en
  `v32`.
  Les recettes D-047 et D-054 restent des témoins historiques. La campagne
  conjointe D-049/D-055 était verte : **1 519 tests** et **220 états navigateur**
  sur cinq fenêtres, dont 60 états de cours, 120 états d'aide couvrant les
  12 profils et 35 états de réponse. Elle ne relève aucune erreur, aucun
  débordement ni aucune fuite de réponse ; la revue dédiée des six pages compte
  112 captures et mesure au plus **0,72 px** entre une barre de fraction et le
  signe mathématique voisin. Ces nombres sont historiques ; le résultat
  courant de D-058 est consigné en tête de document.

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
- À cette date, dans « S'entraîner », une réponse entièrement omise comptait
  faux et ouvrait la correction ; D-049 remplace depuis cette ouverture
  automatique par le retour décrit dans l'état courant ci-dessus. Une saisie
  partielle ou invalide reste réparable et « Au tableau » reste inchangé. La
  trace courante passe en version 3 avec le statut `fournie` ou `omise`, tout
  en conservant la lecture des versions 1 et 2.
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
  `fractions-simples-decimaux`, `ecritures-multiples-nombre`,
  `solides-usuels`, `volume-cube-pave`, `volume-prisme` et `volume-cylindre`.
- La carte du DNB est établie : **37 cibles officielles distinctes**,
  **38 cibles normalisées** et **88 micro-notions**.
- Une séance peut cibler une seule notion ou mélanger un nombre quelconque de
  notions disponibles. Les huit entrées publiques restent séparées dans le
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
