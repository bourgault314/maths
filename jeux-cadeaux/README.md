# Jeux courts

Entrée publique : **Jeux & recherches → Jeux courts → le jeu choisi**.
Adresse : `/outils/?domain=jeux-recherches&notion=jeux-courts`. Le catalogue montre directement les cinq cartes, avec une illustration en bandeau et la description dessous, et ouvre le jeu dans son panneau central, sans changer de page. Les quatre premières illustrations proviennent de `art.js` ; les Carrés gloutons conservent leur illustration existante.

Chaque jeu possède aussi un lien direct (`luciole.html`, `dodo.html`, `galets.html`, `tempo.html`) avec le même en-tête, fil d’Ariane et pied de page. L’ancien lien `/jeux-cadeaux/` rejoint le catalogue en mode libre. Le mode cadeau conserve son entrée dédiée.

Les Carrés gloutons restent à leur adresse `/outils/club_maths/carres_gloutons.html` et dans **Jeux de stratégie**. Depuis **Jeux courts**, le même jeu s’ouvre dans le catalogue grâce à `?integre=1`. Son match aller-retour et ses règles restent identiques.

## Jeux

| Jeu | Partie | Niveaux |
| --- | --- | --- |
| La Luciole | Un seul chemin, qui s’allonge d’une lumière à chaque réussite ; la première erreur termine la partie ; pas de plafond de durée | Départ à 2, 3 ou 4 lumières, éclairage plus ou moins lent |
| Dodo bondissant | Course sans fin, une collision termine la partie ; cap expert 1 min 30, légendaire 2 min | Vitesse de départ et record distincts : Tranquille, Défi, Expert |
| La pile de galets | Sept galets ; fin si la pile tombe ou après 60 s | Largeur des galets et vitesse du déplacement |
| Tempo volcan | Douze signaux : huit actions et quatre arrêts ; 45 s maximum | Temps pour répondre : 1,6 / 1,15 / 0,85 s |
| Les Carrés gloutons | Deux manches de neuf carrés contre Gloubi | Jeu existant, sans choix de niveau |

Les illustrations sont des SVG originaux dans `art.js`. Les jeux ne chargent aucune dépendance externe.
La Luciole a une note par case (gamme pentatonique, `AudioContext` créé au premier départ) et un bouton pour couper le son ; le réglage tient dans `sessionStorage`.
Son plateau prend toute la place disponible : le catalogue lui transmet la hauteur de la fenêtre du site par `postMessage` (`mathsgo-short-game:fenetre`), reçue dans la variable CSS `--hauteur-site`.
Les couleurs de Tempo sont doublées par des mots et des symboles. La touche Espace ne doit pas déclencher deux actions.
La préférence de mouvement réduit supprime les effets décoratifs, sans supprimer les déplacements nécessaires aux jeux.

Ce sont des pauses ludiques, sans classement, compte, publicité ni promesse de transfert cognitif ou scolaire.
Pour les galets et Tempo, les durées annoncées sont des plafonds de jeu actif ; lire les règles et mettre en pause ne consomme pas ce temps. La Luciole n’a pas de plafond : elle s’arrête à la première erreur ou quand le temps d’un chemin s’écoule (2,5 s par lumière, 8 s au minimum). Le dodo affiche le temps écoulé sans limite : lire les règles, mettre en pause ou quitter la fenêtre ne fait pas avancer le chrono. Les Carrés gloutons ne sont pas chronométrés.

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

- `core.js` : quatre moteurs indépendants du DOM, hasard reproductible, calcul d’équilibre et compteur cadeau. Le tirage des chemins écarte trois cases régulièrement alignées, les reprises à moins de quatre pas et les cases sur-utilisées, pour que deux chemins de même longueur demandent le même effort.
- `app.js` : affichage, commandes, horloge unique, pause, navigation et résultats.
- `runner-view.js` : décor et rendu SVG du dodo, mis à jour sans reconstruire la scène à chaque image.
- `tests/dodo-course.test.mjs` : 180 courses de trois minutes jouées par les commandes normales, accélération, obstacles, collisions, hauteur variable et physique indépendante de la fréquence d’affichage.
- `assets/js/short-games-view.js` : intégration partagée dans le catalogue et les liens directs ; messages de hauteur et de retour limités au document de jeu du même site.
- `assets/js/carres-gloutons-embed.js` et `assets/css/carres-gloutons-embed.css` : cadre des Carrés gloutons activé uniquement dans le catalogue, avec ajustement de hauteur et retour à Jeux courts.
- `embedded.css` : habillage dans le catalogue ; difficulté avant Commencer, sans menu intermédiaire. Le retrait du cadre de jeu arrête toute la partie.
- `tests/jeux-cadeaux.test.mjs` : tests de vrais parcours gagnants et perdants, collisions, équilibre global, doubles touches, déterminisme et quota.
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

## Dodo — course sans fin (12 septembre 2026)

- Appuyer déclenche immédiatement le saut (Espace, flèche haut, souris, bouton tactile ou paysage). Relâcher tôt donne un petit saut ; maintenir donne un grand saut. Un minimum de 65 ms d’impulsion rend les taps très courts utilisables. Un nouvel appui dans les 90 ms avant l’atterrissage peut préparer le saut suivant ; aucun rebond automatique sur maintien.
- Troncs et rochers dès le début ; doubles troncs après 12 s, branches après 25 s, petit tronc sous une branche après 40 s. Les groupes restent espacés pour laisser retomber le dodo. Le hasard évite deux groupes identiques consécutifs et ne crée aucun obstacle à l’intérieur de l’écran.
- La vitesse augmente jusqu’à 90 s, puis plus doucement jusqu’à 180 s, où elle se stabilise. Les obstacles continuent indéfiniment, y compris après deux minutes. La fenêtre d’anticipation est identique à toutes les tailles d’écran.
- Décor qui évolue à 30, 60 et 90 s ; caps à 30, 60, 90 et 120 s. Une collision termine la course ; temps actif, distance indicative et obstacles franchis s’affichent. Rejouer relance directement ; les règles restent disponibles à la première ouverture du jeu.
- Record de temps par niveau dans `localStorage` (`mathsgo:dodo:v3:…`), sans compte ni envoi au serveur. Repli en mémoire si le stockage est refusé. Les quotas cadeau restent inchangés : un clic sur Rejouer consomme la prochaine partie si elle est disponible.
- Une interruption d’image de plus de 250 ms, une perte de visibilité ou de focus met le dodo en pause. Le geste est relâché, et la reprise redonne le focus au saut. Les animations de décor et des pattes sont supprimées avec la préférence de mouvement réduit.

L’objectif « expert à 1 min 30 » est un calibrage de jeu, pas une mesure validée auprès d’élèves. Les simulations vérifient la possibilité des parcours et l’échec des appuis permanents/répétitifs ; elles ne remplacent pas les retours de joueurs réels.
