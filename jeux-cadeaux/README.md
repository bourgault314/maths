# Jeux courts

Entrée publique : **Jeux & recherches → Jeux courts → le jeu choisi**.
Adresse : `/outils/?domain=jeux-recherches&notion=jeux-courts`. Le catalogue montre directement les cinq cartes, avec une illustration en bandeau et la description dessous, et ouvre le jeu dans son panneau central, sans changer de page. Les quatre premières illustrations proviennent de `art.js` ; les Carrés gloutons conservent leur illustration existante.

Chaque jeu possède aussi un lien direct (`luciole.html`, `dodo.html`, `galets.html`, `tempo.html`) avec le même en-tête, fil d’Ariane et pied de page. L’ancien lien `/jeux-cadeaux/` rejoint le catalogue en mode libre. Le mode cadeau conserve son entrée dédiée.

Les Carrés gloutons restent à leur adresse `/outils/club_maths/carres_gloutons.html` et dans **Jeux de stratégie**. Depuis **Jeux courts**, le même jeu s’ouvre dans le catalogue grâce à `?integre=1`. Son match aller-retour et ses règles restent identiques.

## Jeux

| Jeu | Partie | Niveaux |
| --- | --- | --- |
| La Luciole | Trois chemins de longueur croissante ; une erreur passe au suivant ; 75 s maximum | 2–4, 3–5 ou 4–6 cases, éclairage plus ou moins lent |
| Dodo bondissant | Huit troncs, trois vies ; environ 20–30 s | Vitesse des obstacles |
| La pile de galets | Sept galets ; fin si la pile tombe ou après 60 s | Largeur des galets et vitesse du déplacement |
| Tempo volcan | Douze signaux : huit actions et quatre arrêts ; 45 s maximum | Temps pour répondre : 1,6 / 1,15 / 0,85 s |
| Les Carrés gloutons | Deux manches de neuf carrés contre Gloubi | Jeu existant, sans choix de niveau |

Les illustrations sont des SVG originaux dans `art.js`. Les jeux ne chargent aucune dépendance externe.
Les couleurs de Tempo sont doublées par des mots et des symboles. La touche Espace ne doit pas déclencher deux actions.
La préférence de mouvement réduit supprime les effets décoratifs, sans supprimer les déplacements nécessaires aux jeux.

Ce sont des pauses ludiques, sans classement, compte, publicité ni promesse de transfert cognitif ou scolaire.
Pour les quatre jeux chronométrés, les durées sont des plafonds de jeu actif ; lire les règles et mettre en pause ne consomme pas ce temps. Les Carrés gloutons ne sont pas chronométrés.

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

- `core.js` : quatre moteurs indépendants du DOM, hasard reproductible, calcul d’équilibre et compteur cadeau.
- `app.js` : affichage, commandes, horloge unique, pause, navigation et résultats.
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
