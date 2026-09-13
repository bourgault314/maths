# Jeux courts

Entrée publique : **Jeux & recherches → Jeux courts → le jeu choisi**.
Adresse : `/outils/?domain=jeux-recherches&notion=jeux-courts`. Le catalogue montre directement les cinq cartes, avec une illustration en bandeau et la description dessous, et ouvre le jeu dans son panneau central, sans changer de page. Les quatre premières illustrations proviennent de `art.js` ; les Carrés gloutons conservent leur illustration existante.

Chaque jeu possède aussi un lien direct (`luciole.html`, `dodo.html`, `galets.html`, `tempo.html`) avec le même en-tête, fil d’Ariane et pied de page. L’ancien lien `/jeux-cadeaux/` rejoint le catalogue en mode libre. Le mode cadeau conserve son entrée dédiée.

Les Carrés gloutons restent à leur adresse `/outils/club_maths/carres_gloutons.html` et dans **Jeux de stratégie**. Depuis **Jeux courts**, le même jeu s’ouvre dans le catalogue grâce à `?integre=1`. Son match aller-retour et ses règles restent identiques.

## Jeux

| Jeu | Partie | Niveaux |
| --- | --- | --- |
| La Luciole | Un seul chemin, qui s’allonge d’une lumière à chaque réussite ; la première erreur termine la partie ; pas de plafond de durée | Départ à 2, 3 ou 4 lumières, éclairage plus ou moins lent |
| Dodo bondissant | Course sans fin, deux vies ; elle s’arrête à la deuxième touche | Aucun : un seul jeu pour tout le monde |
| La pile de galets | Sans fin : on empile jusqu’à la chute, le score est la hauteur ; 20 à 30 s en pratique, garde-fou invisible à 90 s | Un seul jeu pour tous : la montée en difficulté est dans la partie (voir ci-dessous) |
| Tempo volcan | Suite sans fin de signaux, trois vies ; le mot écrit finit par contredire le dessin, puis la consigne s'inverse | Un seul jeu : la fenêtre passe de 1,45 s à 0,58 s |
| Les Carrés gloutons | Deux manches de neuf carrés contre Gloubi | Jeu existant, sans choix de niveau |

La course du dodo n’a pas de réglage de difficulté : elle monte toute seule.
La vitesse, l’écart entre deux obstacles et la fenêtre d’appui visée sont trois
courbes du temps de course (constantes `RUNNER` dans `core.js`), et la largeur de
chaque obstacle est calculée à partir de la fenêtre visée. C’est ce calcul qui
empêche le jeu de devenir plus facile quand il accélère : à vitesse constante et
largeur fixe, un obstacle rapide passe sous le dodo plus vite, donc plus
facilement. Les obstacles arrivent dans l’ordre d’apprentissage (caillou, tronc,
rocher, double tronc, branche, passage) et chacun est annoncé une seule fois par
une phrase affichée dans le paysage.

Les illustrations sont des SVG originaux dans `art.js`. Les jeux ne chargent aucune dépendance externe.
La Luciole a une note par case (gamme pentatonique, `AudioContext` créé au premier départ) et un bouton pour couper le son ; le réglage tient dans `sessionStorage`.
Son plateau prend toute la place disponible : le catalogue lui transmet la hauteur de la fenêtre du site par `postMessage` (`mathsgo-short-game:fenetre`), reçue dans la variable CSS `--hauteur-site`.
Dans Tempo, le dessin et la couleur disent la même chose ; le mot écrit, lui, est l'intrus à ignorer, et un bandeau au-dessus du plateau rappelle la consigne en cours. La touche Espace ne doit pas déclencher deux actions, et une touche maintenue ne compte qu'un seul coup.
La préférence de mouvement réduit supprime les effets décoratifs, sans supprimer les déplacements nécessaires aux jeux.

Ce sont des pauses ludiques, sans classement, compte, publicité ni promesse de transfert cognitif ou scolaire.
La pile de galets s’arrête à la chute (un garde-fou invisible de 90 s de jeu actif termine une partie laissée en plan). La Luciole n’a pas de plafond : elle s’arrête à la première erreur ou quand le temps d’un chemin s’écoule (2,5 s par lumière, 8 s au minimum). Le dodo et Tempo affichent le temps écoulé sans limite — le dodo jusqu’à la deuxième touche, Tempo jusqu’à la troisième erreur : lire les règles, mettre en pause ou quitter la fenêtre ne fait pas avancer le chrono. Les Carrés gloutons ne sont pas chronométrés.

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

## Dodo — course sans fin (13 septembre 2026)

- Appuyer déclenche immédiatement le saut (Espace, flèche haut, souris, bouton tactile ou paysage). Relâcher tôt donne un petit saut ; maintenir donne un grand saut. Un minimum de 65 ms d’impulsion rend les taps très courts utilisables. Un nouvel appui dans les 90 ms avant l’atterrissage peut préparer le saut suivant ; aucun rebond automatique sur maintien.
- Les obstacles arrivent dans l’ordre d’apprentissage (`runnerSteps` dans `core.js`) : caillou dès 0 s, tronc à 12 s, rocher à 26 s, double tronc à 42 s, branche à 58 s, passage à 76 s. Chacun est annoncé une seule fois par une phrase affichée 2,6 s dans le paysage. Pendant les douze premières secondes, le caillou est seul en piste : un appui bref suffit. Les groupes restent espacés pour laisser retomber le dodo ; le hasard évite deux groupes identiques consécutifs et ne crée aucun obstacle à l’intérieur de l’écran.
- La difficulté ne plafonne jamais. La largeur de chaque obstacle est calculée à son apparition pour que la **fenêtre d’appui** — le temps pendant lequel un appui franchit l’obstacle — vaille ce qu’on veut : 440 ms au départ, 115 ms à l’infini. Sans ce calcul, une largeur fixe rendrait le jeu plus *facile* en accélérant, l’obstacle passant sous le dodo plus vite. La vitesse (300 px/s, +0,9 par seconde) et l’écart entre obstacles (1,70 s vers 0,45 s) montent de même sans borne. La fenêtre d’anticipation est identique à toutes les tailles d’écran.
- Décor qui évolue à 30, 60 et 90 s. Le dodo a **deux vies** : la première touche coûte un cœur et le rend invincible 0,9 s (il clignote), la seconde arrête la course ; un obstacle touché ne compte pas comme franchi. Le nom de la zone et le record tiennent dans la ligne d’état ; il n’y a plus de ligne de consigne ni de barre Cap/Record. Temps actif, distance indicative et obstacles franchis s’affichent à la fin. Rejouer relance directement ; les règles restent disponibles à la première ouverture du jeu.
- Record de temps unique dans `localStorage` (`mathsgo:dodo:v4`), sans niveau, sans compte ni envoi au serveur. Repli en mémoire si le stockage est refusé. Les quotas cadeau restent inchangés : un clic sur Rejouer consomme la prochaine partie si elle est disponible.
- Une interruption d’image de plus de 250 ms, une perte de visibilité ou de focus met le dodo en pause. Le geste est relâché, et la reprise redonne le focus au saut. Les animations de décor et des pattes sont supprimées avec la préférence de mouvement réduit.

Les trois courbes sont un calibrage de jeu, pas une mesure validée auprès d’élèves : elles se règlent en trois nombres dans la constante `RUNNER`. Les simulations vérifient la possibilité des parcours et l’échec des appuis permanents/répétitifs ; elles ne remplacent pas les retours de joueurs réels.

## La pile de galets — moteur sans fin (12 septembre 2026)

- La pile **penche** du côté de son centre de masse et **tremble** quand la chute approche. Un **fil à plomb** descend du centre de masse jusqu’au socle : vert au milieu de la zone d’appui, orange sur ses bords. Poser le galet suivant du côté opposé rattrape la pile.
- Règle de chute inchangée (`balance`, ex-`stable`) : à chaque contact, le centre de masse de tout ce qui est au-dessus doit rester dans la zone de recouvrement. Le compte rendu dit où ça casse ; à la chute, les galets roulent et le fil à plomb rouge clignote une demi-seconde à l’endroit fautif, puis l’écran de fin explique (« basculé au 9e galet, posé trop à droite »).
- Montée en difficulté (`stackStep`) : galets 1 à 4 larges et lents ; 5 à 7 plus étroits et plus rapides ; 8 à 10 le vent dévie le galet pendant sa chute ; 11 à 13 galets irréguliers (l’appui n’est pas au milieu du dessin, l’ombre montre l’appui) ; 14 à 16 le socle rétrécit et la marée monte (le socle attend si la pile ne tiendrait plus dessus) ; 17 et plus tout ensemble, de plus en plus vite. Une consigne d’une phrase annonce chaque nouveauté. Le choix de niveau n’est pas proposé pour ce jeu.
- Paliers affichés : 3 premier caillou · 5 petite pile · 7 pile du sentier · 10 pile du volcan · 13 pile du Piton · 16 pile de légende · 20 personne n’a jamais vu ça. Le meilleur score de la séance est gardé dans `sessionStorage` (`mathsgo:jeux-cadeaux:galets:record`), sans cookie.
- Mesuré sur le moteur avec des joueurs simulés (retard de réaction de ± 50 à ± 140 ms) : parties de 20 à 27 s, hauteur moyenne de 8 à 13 galets, moins de 15 % de parties à 16 galets ou plus même pour un très bon joueur, jamais plus de 25. `tests/jeux-cadeaux.test.mjs` rejoue cette mesure. Ce sont des simulations, pas des observations d’élèves.
- Affichage : la scène garde le repère 600 × 330 du moteur, le cadre SVG s’étend pour remplir l’aire de jeu (le décor déborde), la caméra descend quand la pile monte et la zone d’appui est rappelée au bord bas quand le socle sort du cadre. Les formes des galets (`ShortGameArt.pebble`) sont reproductibles à partir de la graine de la partie. La préférence de mouvement réduit supprime le tremblement, pas l’inclinaison ni le fil à plomb.
