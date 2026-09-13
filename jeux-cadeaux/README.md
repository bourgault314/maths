# Jeux courts

Entrée publique : **Jeux & recherches → Jeux courts → le jeu choisi**.
Adresse : `/outils/?domain=jeux-recherches&notion=jeux-courts`. Le catalogue montre directement les cinq cartes, avec une illustration en bandeau et la description dessous, et ouvre le jeu dans son panneau central, sans changer de page. Les quatre premières illustrations proviennent de `art.js` ; les Carrés gloutons conservent leur illustration existante.

Chaque jeu possède aussi un lien direct (`luciole.html`, `dodo.html`, `galets.html`, `tempo.html`) avec le même en-tête, fil d’Ariane et pied de page. L’ancien lien `/jeux-cadeaux/` rejoint le catalogue en mode libre. Le mode cadeau conserve son entrée dédiée.

Les Carrés gloutons restent à leur adresse `/outils/club_maths/carres_gloutons.html` et dans **Jeux de stratégie**. Depuis **Jeux courts**, le même jeu s’ouvre dans le catalogue grâce à `?integre=1`. Son match aller-retour et ses règles restent identiques.

## Jeux

| Jeu | Partie | Niveaux |
| --- | --- | --- |
| La Luciole | Un seul chemin, qui s’allonge d’une lumière à chaque réussite ; la première erreur termine la partie ; pas de plafond de durée | Départ à 2, 3 ou 4 lumières, éclairage plus ou moins lent |
| Tec-tec bondissant | Parcours fixe de 2 min 30 ; une seule vie ; toute défaite repart du début | Un seul parcours pour tout le monde |
| La pile de galets | Deux à cinq galets imposés à placer et retourner ; anticipation du poids, contrepoids et ponts ; aucun vent ni temps limite | Douze défis accessibles, répartis en quatre étapes |
| Tempo volcan | Suite sans fin de signaux, trois vies ; le mot écrit finit par contredire le dessin, puis la consigne s'inverse | Un seul jeu : la fenêtre passe de 1,45 s à 0,58 s |
| Les Carrés gloutons | Deux manches de neuf carrés contre Gloubi | Jeu existant, sans choix de niveau |

Le Tec-tec utilise le parcours de l’essai V2 approuvé : petits et grands sauts,
rebonds sur maintien, escaliers, trous, plafonds, variations de vitesse et deux
passages en vol. Le moteur et le parcours sont conservés octet pour octet ; la
publication ajoute le raccord au site et les arbres demandés. La difficulté ne
repose plus sur le calcul de largeur de l’ancien Dodo.

Les illustrations sont des SVG originaux dans `art.js`. Les jeux ne chargent aucune dépendance externe.
La Luciole a une note par case (gamme pentatonique, `AudioContext` créé au premier départ) et un bouton pour couper le son ; le réglage tient dans `sessionStorage`.
Son plateau prend toute la place disponible : le catalogue lui transmet la hauteur de la fenêtre du site par `postMessage` (`mathsgo-short-game:fenetre`), reçue dans la variable CSS `--hauteur-site`.
Dans Tempo, le dessin et la couleur disent la même chose ; le mot écrit, lui, est l'intrus à ignorer, et un bandeau au-dessus du plateau rappelle la consigne en cours. La touche Espace ne doit pas déclencher deux actions, et une touche maintenue ne compte qu'un seul coup.
La préférence de mouvement réduit supprime les effets décoratifs, sans supprimer les déplacements nécessaires aux jeux.

Ce sont des pauses ludiques, sans classement, compte, publicité ni promesse de transfert cognitif ou scolaire.
La pile de galets propose douze défis sans temps limite : après une chute, on peut reprendre le défi. La Luciole n’a pas de plafond : elle s’arrête à la première erreur ou quand le temps d’un chemin s’écoule (2,5 s par lumière, 8 s au minimum). Le Tec-tec affiche la progression jusqu’au bout des 150 secondes, Tempo le temps écoulé jusqu’à la troisième erreur : lire les règles, mettre en pause ou quitter la fenêtre ne fait pas avancer le chrono. Les Carrés gloutons ne sont pas chronométrés.

## Mode cadeau, prêt pour un raccordement ultérieur

Le mode cadeau concerne les quatre jeux ci-dessous. L’ajout des Carrés gloutons au catalogue ne les raccorde pas au compteur de parties.

- `/jeux-cadeaux/?mode=cadeau&parties=1&ticket=identifiant-du-coffre`
- `/jeux-cadeaux/?mode=cadeau&parties=2&jeu=luciole&ticket=autre-coffre`
- `retour=/chemin-du-parcours/` : bouton de retour, uniquement vers une adresse du même site.
- `jeu=luciole|dodo|galets|tempo` : ouverture directe des règles du jeu.

Chaque clic sur **Commencer** consomme une partie, y compris en cas de défaite, abandon ou rechargement.
Lire les règles ne consomme rien. Après la dernière partie, le bouton de rejeu disparaît.
Un identifiant `ticket` différent doit être fourni par le parcours pour chaque nouvelle ouverture de coffre.
Sans identifiant, le quota appartient au ticket « session » de l’onglet.

Le compteur est conservé dans `sessionStorage`. Si le stockage est indisponible, il fonctionne seulement tant que la page reste ouverte.
Ce cadre est une limite de séance, pas un contrôle d’accès : la banque est publique et un nouvel onglet peut rejouer librement.
Aucun parcours existant et aucun coffre n’est modifié dans ce lot. Il n’y a pas de retour automatique.

## Architecture et vérifications

- `core.js` : quatre moteurs indépendants du DOM, hasard reproductible, calcul d’équilibre (`balance`, `stable`, `stackStep`, `tier`) et compteur cadeau. Le tirage des chemins écarte trois cases régulièrement alignées, les reprises à moins de quatre pas et les cases sur-utilisées, pour que deux chemins de même longueur demandent le même effort.
- `app.js` : affichage, commandes, horloge unique, pause, navigation et résultats.
- `runner-view.js` : décor et rendu SVG du dodo, mis à jour sans reconstruire la scène à chaque image.
- `tests/dodo-course.test.mjs` : 180 courses de trois minutes jouées par les commandes normales, accélération, obstacles, collisions, hauteur variable et physique indépendante de la fréquence d’affichage.
- `assets/js/short-games-view.js` : intégration partagée dans le catalogue et les liens directs ; messages de hauteur et de retour limités au document de jeu du même site.
- `assets/js/carres-gloutons-embed.js` et `assets/css/carres-gloutons-embed.css` : cadre des Carrés gloutons activé uniquement dans le catalogue, avec ajustement de hauteur et retour à Jeux courts.
- `embedded.css` : habillage dans le catalogue ; difficulté avant Commencer, sans menu intermédiaire. Le retrait du cadre de jeu arrête toute la partie.
- `tests/jeux-cadeaux.test.mjs` : tests de vrais parcours gagnants et perdants, collisions, équilibre global, montée en difficulté et joueurs simulés des galets, doubles touches, déterminisme et quota.
- `tests/jeux-cadeaux-dom.cjs` : scénarios d’interface avec DOM simulé (`jsdom@26.1.0` en dépendance de développement facultative ; aucune dépendance pour le site).
- `tests/jeux-cadeaux-apercu.html` : banc d’essai visuel aux tailles téléphone, tablette, ordinateur et paysage. Cette page technique n’est pas indexée.

Commandes depuis la racine :
```sh
node --test tests/jeux-cadeaux.test.mjs
npm run verifier
```

Avant la mise en ligne : exécuter les contrôles sur une copie complète, puis envoyer un seul lot cohérent à la PR.
Après déploiement : ouvrir la banque et son entrée de catalogue, jouer une partie de chaque jeu, vérifier l’absence de débordement et les commandes au clavier.
Les essais à taille réduite dans Chrome ne remplacent pas un essai sur un véritable iPhone ou iPad.

## Archive — ancien Dodo, remplacé par le Tec-tec

Le moteur `Runner` et ses tests restent disponibles pour historique ; les liens publics ne l’utilisent plus. L’audit du 13/09 a établi que les plafonds de largeur de `widthFor()` rouvrent la fenêtre d’appui avec la vitesse. Les affirmations initiales de difficulté toujours croissante étaient donc erronées. Ce moteur n’est pas le parcours du Tec-tec.

- Appuyer déclenche immédiatement le saut (Espace, flèche haut, souris, bouton tactile ou paysage). Relâcher tôt donne un petit saut ; maintenir donne un grand saut. Un minimum de 65 ms d’impulsion rend les taps très courts utilisables. Un nouvel appui dans les 90 ms avant l’atterrissage peut préparer le saut suivant ; aucun rebond automatique sur maintien.
- Les obstacles arrivent dans l’ordre d’apprentissage (`runnerSteps` dans `core.js`) : caillou dès 0 s, tronc à 12 s, rocher à 26 s, double tronc à 42 s, branche à 58 s, passage à 76 s. Chacun est annoncé une seule fois par une phrase affichée 2,6 s dans le paysage. Pendant les douze premières secondes, le caillou est seul en piste : un appui bref suffit. Les groupes restent espacés pour laisser retomber le dodo ; le hasard évite deux groupes identiques consécutifs et ne crée aucun obstacle à l’intérieur de l’écran.
- L’ancien moteur visait une fenêtre de 440 à 115 ms, mais ses plafonds de largeur inversaient cette progression ; il est conservé uniquement comme archive.
- Quatre paysages de La Réunion se succèdent à 30, 60 et 90 s, en fondu d’une seconde : la forêt de tamarins des Hauts (troncs tordus, fougères arborescentes, brume), les remparts d’un cirque (murailles de basalte, cascade), la Plaine des Sables au pied du volcan (sol rouge, cône, fumerolles) puis le littoral (lagon, barrière de corail, filaos, vacoas). Les obstacles prennent l’allure du lieu : bloc de basalte, tronc de tamarin ou bois flotté, coulée refroidie au volcan, branche de tamarin, de bois mort ou de filao. Un paille-en-queue traverse le ciel de temps en temps. Chaque paysage est posé une fois dans le SVG (`runner-view.js`) en trois plans de parallaxe (×0,12, ×0,32, ×1) ; les motifs se rebouclent sur eux-mêmes (même hauteur en 0 et en 600, aucun objet à cheval sur le bord) et les zones passées sont retirées de l’affichage. Avec la préférence de mouvement réduit : coupure nette au lieu du fondu, pas d’oiseau ni de parallaxe. Le dodo a **deux vies** : la première touche coûte un cœur et le rend invincible 0,9 s (il clignote), la seconde arrête la course ; un obstacle touché ne compte pas comme franchi. Le nom de la zone et le record tiennent dans la ligne d’état ; il n’y a plus de ligne de consigne ni de barre Cap/Record. Temps actif, distance indicative et obstacles franchis s’affichent à la fin. Rejouer relance directement ; les règles restent disponibles à la première ouverture du jeu.
- Record de temps unique dans `localStorage` (`mathsgo:dodo:v4`), sans niveau, sans compte ni envoi au serveur. Repli en mémoire si le stockage est refusé. Les quotas cadeau restent inchangés : un clic sur Rejouer consomme la prochaine partie si elle est disponible.
- Une interruption d’image de plus de 250 ms, une perte de visibilité ou de focus met le dodo en pause. Le geste est relâché, et la reprise redonne le focus au saut. Les animations de décor et des pattes sont supprimées avec la préférence de mouvement réduit.

Les trois courbes sont un calibrage de jeu, pas une mesure validée auprès d’élèves : elles se règlent en trois nombres dans la constante `RUNNER`. Les simulations vérifient la possibilité des parcours et l’échec des appuis permanents/répétitifs ; elles ne remplacent pas les retours de joueurs réels.

## Archive — ancien moteur des galets (remplacé le 13 septembre 2026)

- La pile **penche** du côté de son centre de masse et **tremble** quand la chute approche. Un **fil à plomb** descend du centre de masse jusqu’au socle : vert au milieu de la zone d’appui, orange sur ses bords. Poser le galet suivant du côté opposé rattrape la pile.
- Règle de chute inchangée (`balance`, ex-`stable`) : à chaque contact, le centre de masse de tout ce qui est au-dessus doit rester dans la zone de recouvrement. Le compte rendu dit où ça casse ; à la chute, les galets roulent et le fil à plomb rouge clignote une demi-seconde à l’endroit fautif, puis l’écran de fin explique (« basculé au 9e galet, posé trop à droite »).
- Montée en difficulté (`stackStep`) : galets 1 à 4 larges et lents ; 5 à 7 plus étroits et plus rapides ; 8 à 10 le vent dévie le galet pendant sa chute ; 11 à 13 galets irréguliers (l’appui n’est pas au milieu du dessin, l’ombre montre l’appui) ; 14 à 16 le socle rétrécit et la marée monte (le socle attend si la pile ne tiendrait plus dessus) ; 17 et plus tout ensemble, de plus en plus vite. Une consigne d’une phrase annonce chaque nouveauté. Le choix de niveau n’est pas proposé pour ce jeu.
- Paliers affichés : 3 premier caillou · 5 petite pile · 7 pile du sentier · 10 pile du volcan · 13 pile du Piton · 16 pile de légende · 20 personne n’a jamais vu ça. Le meilleur score de la séance est gardé dans `sessionStorage` (`mathsgo:jeux-cadeaux:galets:record`), sans cookie.
- Mesuré sur le moteur avec des joueurs simulés (retard de réaction de ± 50 à ± 140 ms) : parties de 20 à 27 s, hauteur moyenne de 8 à 13 galets, moins de 15 % de parties à 16 galets ou plus même pour un très bon joueur, jamais plus de 25. `tests/jeux-cadeaux.test.mjs` rejoue cette mesure. Ce sont des simulations, pas des observations d’élèves.
- Affichage : la scène garde le repère 600 × 330 du moteur, le cadre SVG s’étend pour remplir l’aire de jeu (le décor déborde), la caméra descend quand la pile monte et la zone d’appui est rappelée au bord bas quand le socle sort du cadre. Les formes des galets (`ShortGameArt.pebble`) sont reproductibles à partir de la graine de la partie. La préférence de mouvement réduit supprime le tremblement, pas l’inclinaison ni le fil à plomb.


## La pile de galets — Au fil de l’eau (13 septembre 2026)

La version essayée et approuvée par Gwenaël remplace l’ancien jeu d’adresse. Le lien `galets.html` et le catalogue utilisent `galets-riviere/index.html`, avec le bandeau du site conservé. Les anciens liens intégrés et les liens de coffre sont redirigés ; un défi commencé compte comme une partie du coffre et conserve le compteur commun en session.

Les six fichiers de la rivière sont du HTML, CSS et des modules JavaScript natifs, sans compilation ni dépendance externe. `engine.mjs` et `levels.mjs` portent les règles, `game.mjs` le dessin et les commandes, `site.mjs` l’adaptation au catalogue. La silhouette réelle détermine la collision et la masse ; seuls les appuis horizontaux sont stables. La chute est une animation explicative. Le décor évoque une rivière réunionnaise. Le jeu conserve les douze défis ouverts, le bouton d’indice et le son facultatif de l’essai.

La progression utilise `mathsgo:galets:essai-riviere:v1` dans le stockage local, afin de conserver aussi les essais faits sur cette origine. L’ancien record de hauteur n’est ni supprimé ni converti en défis réussis.

Vérification : 31 tests du moteur, 990 variantes de solutions, tests des liens, du quota des coffres et de la hauteur du cadre. Les contrôles DOM de navigation couvrent 320, 390, 680, 681, 1024 et 1440 px. `tests/galets-riviere-dom.cjs` rejoue les douze défis et les commandes avec jsdom 26.1.0 et @napi-rs/canvas 1.0.9, dépendances de test uniquement. Ces contrôles ne mesurent pas la mise en page CSS dans Safari.

L’état antérieur est conservé dans l’historique Git, avant la PR de remplacement (base : `a7e2b38dc6ebc3d6d5d1b00dea0823685835ebeb`). Revenir sur le commit de cette PR restaure les anciens branchements sans toucher aux autres jeux. Les fonctions `Stack` historiques restent dans le moteur commun afin de ne pas élargir le remplacement aux autres jeux ; elles ne servent plus aux liens publics des galets.

## Tec-tec — publication de l’essai approuvé

Le lot 2 des paysages était déjà fusionné dans la PR 746. Les quatre fonds du
Tec-tec en dérivent ; les Hauts ont des tamarins noueux et des fanjans, le littoral
des banians à racines aériennes, des filaos et des vacoas. Les arbres sont du SVG
original intégré dans `tec-tec/landscapes.js`, généré hors ligne par
`scripts/tec-tec-vegetation.cjs`. Aucun arbre ne modifie une collision.

Le lien historique `dodo.html`, l’identifiant de catalogue `dodo` et les liens de
coffre restent valables. Le titre et les deux miniatures montrent désormais le
Tec-tec. Le cadre conserve le bandeau, le fil d’Ariane et le pied de page communs.
`tec-tec/site.js` raccorde la hauteur au catalogue et réutilise le quota cadeau :
seul un départ consomme une partie, et un rechargement conserve la consommation.

Le record reste en pourcentage sous `mathsgo:tec-tec:essai:reunion-150-v2` ; l’ancien
record du Dodo sous `mathsgo:dodo:v4` est conservé sans conversion. Un essai dans
ChatGPT peut utiliser une autre origine : son stockage n’est pas transférable
automatiquement au site.

`tests/tec-tec-course.test.cjs` rejoue les 150 secondes par les commandes normales,
avec 122 appuis et 121 sauts au sol, et vérifie les échecs de gestes inadaptés.
`tests/tec-tec-site.test.cjs` protège les empreintes du moteur et du parcours V2,
les anciennes adresses, le quota partagé et les messages du cadre.
`tests/tec-tec-dom.cjs` vérifie les parcours gagnants clavier/pointeur, les durées
d’appui, le focus, la pause, le stockage et la fin du coffre avec jsdom 26.1.0.
Ces contrôles ne reproduisent pas un clavier physique dans l’aperçu ChatGPT et
ne valident pas le rendu CSS d’un téléphone. Le contrôle de focus de la V3 est
conservé ; aucune difficulté n’a été changée pour compenser le signalement Espace.

```sh
node --test tests/tec-tec-course.test.cjs tests/tec-tec-site.test.cjs
NODE_PATH=/chemin/vers/node_modules node tests/tec-tec-dom.cjs
NODE_PATH=/chemin/vers/node_modules node tests/jeux-cadeaux-dom.cjs
NODE_PATH=/chemin/vers/node_modules node tests/jeux-courts-navigation-dom.cjs
NODE_PATH=/chemin/vers/node_modules node tests/catalogue-navigation-css-dom.cjs
```

Retour arrière : annuler la PR de remplacement rétablit les anciens branchements
sans effacer les records ni modifier les moteurs des autres jeux.

### Tec-tec : plein écran et consignes (13 septembre 2026)

Le cadre utilise toute la largeur du panneau. Le clic sur « Ouvrir en plein écran »
agrandit le jeu et laisse le parcours en attente, sans limite de temps et sans
consommer une partie du coffre. Un second appui sur « Démarrer » lance la partie.
Le jeu conserve le grand écran entre les tentatives ; « Repartir du début » lance
alors directement le nouvel essai. Si le joueur a quitté le grand écran, le
premier appui rétablit l’affichage et attend de nouveau un appui explicite.
`tec-tec/screen.js` demande le plein écran natif ; si ce navigateur ne le propose
pas, le cadre occupe la fenêtre du site, sans déplacer/recharger le document.
Le bouton de sortie et Échap rétablissent l’affichage. Un changement de vue par
le bouton pendant la partie met celle-ci en pause. Le bouton Sauter reste sous
le paysage ; toucher le paysage fonctionne toujours.

Les consignes permanentes sous le jeu (« Ton prochain bond compte », explication
des appuis et touches) sont retirées à la demande de Gwenaël. Le bouton conserve
son indication de maintien, adaptée au vol. Les brèves indications du parcours
restent dans la version validée.

Le moteur, le parcours, le rendu et les gestionnaires souris/tactile/clavier sont
inchangés. Gwenaël confirme réussir les petits sauts à la souris et sur téléphone,
et soupçonne que sa barre Espace reste enfoncée plus longtemps. Aucun recalibrage
n’est appliqué sur cette hypothèse. Les tests de mêmes durées vérifient l’égalité
des trajectoires ; ils ne mesurent pas son clavier physique.

Les tests DOM couvrent l’attente avant le départ explicite, le refus de plein écran
natif, la sortie, la pause, le quota et le double clic pendant la transition. Le test
pur de dimensionnement couvre portrait/paysage, ordinateur et zones sûres ; les
contrôles de cadre vérifient l’origine des messages et la restauration du site.
La disposition sur un véritable iPhone reste à vérifier par un utilisateur.
