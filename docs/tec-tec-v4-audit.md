# Tec-tec V4 — audit et décisions de conception

25 octobre 2026. Périmètre : rendre les contacts fiables, organiser
l’apprentissage et conserver un défi intéressant dans un univers réunionnais.
Cette note distingue les principes documentés par d’autres créateurs de nos
choix pour le Tec-tec. Elle ne constitue pas une validation finale de publication.

## Diagnostic de départ

Les élèves signalent des chutes alors que l’oiseau semble atteindre le coin
d’une plateforme. Le moteur précédent ne traitait pas le sol et les plateformes
de la même façon : le sol dépendait du centre de l’oiseau, tandis que les
plateformes utilisaient sa largeur. La résolution d’un atterrissage et la
vérification d’une collision latérale pouvaient également se contredire.
Corriger ces contacts précède tout durcissement du parcours : une erreur doit
être compréhensible et reproductible.

Le parcours disposait déjà de nombreux motifs : petits et grands sauts,
escaliers, rebonds, plafonds, plateformes fragiles et vols. Il manquait surtout
une progression lisible. Un saut contraint arrivait après 1,15 seconde ; des
motifs de niveau 3 apparaissaient vers 13 secondes, et le niveau 4 dès 30
secondes. Repartir systématiquement du début amplifiait cette difficulté.

## Ce que montrent les références

- **Celeste, Maddy Thorson.** Un bref délai après le bord, la mémorisation d’un
  appui avant l’atterrissage et de petites corrections de coins élargissent les
  possibilités en faveur du joueur. Une commande indulgente peut accompagner
  un jeu exigeant. Nous retenons des tolérances bornées, sans supprimer les
  véritables collisions. [Celeste & Forgiveness](https://www.mattmakesgames.com/articles/celeste_and_forgiveness/index.html).
- **N et N++, Metanet.** Détecter un chevauchement et décider de sa résolution
  sont deux problèmes distincts. Les auteurs organisent aussi les niveaux
  autour de gestes d’abord isolés, puis combinés, en alternant intensité et
  respiration. Ils réévaluent la difficulté après modification et évitent les
  sauts aveugles. [Collisions](https://www.metanetsoftware.com/2016/n-tutorial-a-collision-detection-and-response)
  et [conception des niveaux](https://blog.playstation.com/archive/2014/12/04/ins-outs-ups-downs-lefts-rights-designing-n-levels).
- **Geometry Dash, RobTop.** La présentation officielle distingue le défi de
  l’entraînement et associe une commande simple à plusieurs formes de
  déplacement. Nous retenons la possibilité d’apprendre un passage séparément
  de l’objectif de réussir tout le parcours. [Présentation officielle](https://apps.apple.com/fr/app/geometry-dash/id625334537).
- **Rayman Jungle / Fiesta Run, Chris McEntee.** Le concepteur décrit la revue
  régulière des niveaux et, pour Fiesta Run, des objectifs d’accessibilité et
  de progression plus lisible. Cela appuie notre choix de rendre chaque étape
  identifiable. [Retour du concepteur](https://chrismcentee.com/portfolio-items/game-level-designer-rayman-jungle-run/).

## Choix V4

| Besoin | Décision |
| --- | --- |
| Contacts justes | Harmoniser l’appui au sol et sur les plateformes ; distinguer un atterrissage depuis le dessus d’un véritable choc latéral. |
| Apprendre les commandes | Commencer par des sauts isolés, puis introduire saut court, maintien et relâchement avant leurs combinaisons. |
| Variété | Réorganiser les situations existantes ; ajouter seulement des formes simples utiles à l’apprentissage, plutôt qu’accumuler les mécanismes. |
| Difficulté | Monter progressivement entre les quatre paysages, avec des respirations et une finale qui combine des gestes connus. |
| Découverte | Ralentir la simulation à 80 % et proposer des points de reprise placés sur des portions sûres. |
| Défi | Conserver le parcours de 150 secondes à vitesse normale, à réussir sans point de reprise. |

Les records des deux modes sont séparés. Les clés portent la version **V4** :
un record ancien reste conservé dans le stockage, mais n’est pas comparé à un
résultat obtenu sur un parcours différent. Les reprises restent une aide
d’apprentissage ; elles ne doivent jamais réapparaître devant un obstacle
immédiat ni donner un résultat ambigu avec celui du Défi.

L’identité locale guide le dessin : forêt des Hauts, remparts, Plaine des
Sables et littoral doivent rester distincts. Les surfaces jouables et les
dangers doivent se lire devant le décor. Aucun élément graphique, sonore,
texte de jeu ou plan de niveau tiers n’est repris pour cette évolution.

## Validation et limites

Les contrôles portent sur les contacts de bord, les collisions réelles, les
reprises, les commandes, la pause et le déterminisme. Un replay gagnant vérifie
qu’un passage est franchissable ; il ne prouve ni son plaisir, ni son
accessibilité humaine. Les résultats chiffrés appartiennent au compte rendu
final, après intégration. Une simulation DOM n’est pas un contrôle visuel, et
aucun essai sur appareil physique n’est revendiqué ici. Des retours d’élèves
restent nécessaires pour ajuster le rythme après les corrections.

Enfin, l’[INPI](https://www.inpi.fr/ressources/propriete-intellectuelle/droit-dauteur)
distingue les idées de leur expression concrète, notamment les logiciels,
images et sons. Les références servent à comprendre des principes, pas à
reproduire une œuvre. L’originalité des éléments réalisés et la traçabilité
du travail doivent être conservées ; cet audit n’est pas une validation
juridique de l’ensemble du jeu.
