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
  cadre blanc, aux places des boutons de la séance ; il n'y a pas de logo (plus
  de pied depuis le 24/10/2026, voir « Pas de pied de page dans les applis ») ;
- le titre « Soroban / Flash Anzan » est centré dans le cadre ; quand le plein
  écran est caché (téléphone), une place vide de 44 px à droite équilibre la
  flèche ;
- `tests/flash-anzan.test.mjs` garde ces trois points. Étendre cette
  disposition aux autres applis est une idée de Gwenaël, pas une décision.
- Depuis le 30/10/2026 (planches validées, maquette « élève connecté » en
  bleu), ces boutons et le titre vivent dans un BANDEAU turquoise pâle
  (`#dff4f2`) en haut du cadre blanc : « Soroban / Flash Anzan » et les onglets
  Flash / Colonne en intercalaires (trait orange `#f58220` sous l'actif, le
  seul orange de la page) sur les réglages, « Calcul 1 / 5 » en séance. Les
  ronds sont à la même place sur tous les écrans (même rangée, mêmes marges).
  Les boutons restent bleus. Défi tables recevra le même bandeau dans un lot à
  part.
- Avec un code (l'élève venu de Mon espace, lot « Qui voit quoi », lot 4a,
  23/10/2026), le modèle commun ci-dessous s'applique : le bloc « Suivi par ton
  professeur » AU-DESSUS du cadre, la flèche du cadre mène à Mon espace (pas de
  « ← Mon espace » en texte, pour ne pas doubler), la pastille « ● prénom » à
  la place du plein écran pendant la séance, le pied « Mon espace ». Sans
  code, rien ne change.

### Mention « Sans cookie ni traceur » : navigation oui, applis non

Décision de Gwenaël du 23/10/2026 : « tant que je suis dans ce qui ressemble à
l'accueil, on laisse ; dès que je rentre dans une appli, on enlève ».

- Seules chargent `assets/js/mention-confidentialite.js` : l'accueil, le
  catalogue (`outils/index.html`), `outils/toutes-les-ressources.html`, les
  trois pages légales, les pages d'entrée encore servies (Addition, Soustraction,
  Multiplication et Division posées, Chat, c'est toi le chat !, et la page des
  fiches du Moulin de Pythagore, remise le 24/10 — les 17 anciens
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
  ce script et n'écrit pas « Sans cookie ni traceur ».
- `tests/mention-confidentialite.test.mjs` tient la liste exacte des pages
  autorisées et rougit si une appli affiche la mention.

### Pas de pied de page dans les applis

Décision de Gwenaël du 24/10/2026 (« Oui, tout enlever ») : les applis, les
jeux et les fiches à jouer n'ont plus de pied de page du tout, ni pour le
visiteur ni pour l'élève connecté par code.

- « Me contacter · Mentions légales · Confidentialité · Licence » restent sur
  l'accueil, le catalogue, `outils/toutes-les-ressources.html`, les pages
  légales et les pages d'entrée (les pages de navigation). L'élève trouve
  « Infos et confidentialité » sur sa page Mon espace (`suivi.mathsgo.re`).
- La carte des mondes et la page des livrets SPLAT!, très visitées, gardent
  pour le visiteur leur pied entier : crédits et « mathsgo.re · CC BY-NC-SA 4.0
  — libre d'être imprimé, partagé et adapté ». Solèy garde sa ligne de crédits
  et son bouton « D'où vient Solèy ? », sans les liens du site. L'élève à code
  n'a rien en bas, crédits compris.
- Les fiches du Moulin de Pythagore (`moulin_pythagore_fiches.html`) sont une
  page du site (une liste de PDF), pas une appli : elles gardent leur pied.
- Flash Anzan : rien du tout, pas même le logo.
- Une nouvelle appli n'a pas de `<footer class="site-footer">`. Ne pas confondre
  avec la signature imprimée des fiches (« mathsgo.re · CC BY-NC-SA 4.0 »), qui
  reste : c'est la règle des documents.
- Pages hors catalogue (espace d'Axelle, Jacquie, baguette, 405, studio,
  fichiers de travail) : leur petite phrase en bas n'est pas le pied du site,
  on n'y touche pas.
- `tests/pieds-applis.test.mjs` tient la liste des pages et rougit si un pied
  revient.

## Applis suivies — modèle commun

Toute appli branchée sur le serveur de suivi (Défi tables, SPLAT!, Défi calcul,
puis les suivantes) suit ce modèle quand l'élève est connecté par son code.
Défi tables est la référence.

- En-tête commun (variante A, planches du 31/10/2026 ; remplace la barre fine
  au-dessus du cadre du 14/10/2026) : PLUS DE BARRE AU-DESSUS DU CADRE. Sur
  l'ACCUEIL de l'appli, dans le cadre blanc, en haut : la flèche ronde à gauche
  (vers Mon espace), le titre centré (petit sur-titre + grand titre : « Calcul
  mental / Défi tables », « Soroban / Flash Anzan »), le plein écran rond à
  droite (pas au téléphone). Sous le titre, UNE petite ligne centrée :
  « ● Suivi · Rania · 405 · Se déconnecter » — puce verte #147447, prénom en
  gras couleur encre #143451, le reste gris #506b7d, « Se déconnecter »
  souligné (zone de toucher de 44 px), .86rem (.8rem au téléphone), sans fond.
  Le haut du cadre (titre et ligne) reste BLANC, avec un trait fin gris
  #e3ebf0 sous la ligne de suivi, jusqu'aux bords du cadre (planche 16 du
  31/10/2026, « tout blanc » : le bleu très pâle de la planche 5 est
  abandonné) — le bandeau d'Anzan aussi.
  Le mot « Suivi » reste (l'élève sait que son travail remonte au
  professeur) ; les états reprennent les textes du moteur, « Suivi par ton
  professeur » raccourci en « Suivi » : orange (#8a4c0a, puce #d9822b) quand
  rien n'est encore parti, gris sans puce (#3d4a5a) quand le code ne vaut plus
  rien ; un billet refusé dit « … · Mon espace ». La ligne ordinaire ne se
  coupe qu'aux « · » (prénom et classe insécables) ; les états longs passent à
  la ligne, « · Se déconnecter » toujours entier. C'est le MÊME élément `#suivi-repere` (son « Se déconnecter », la
  garde « C'est toujours toi ? ») qu'on déplace et qu'on restyle — jamais une
  copie. Les mêmes règles et valeurs dans toutes les applis (gardé par
  `tests/en-tete-commun.test.mjs`). Dans l'appli, ailleurs que sur l'accueil,
  la règle est la même partout : LE TITRE DE L'ÉCRAN D'ABORD, LA LIGNE DESSOUS
  (31/10/2026, planches 11 et 12, pour téléphone ET ordinateur — un seul
  modèle). Défi tables et Défi calcul rangent la barre (la ligne, et le plein
  écran à droite sur ordinateur) juste sous la barre « ← titre » de l'écran
  (Mon parcours, Les records, la table qu'on lit, la fiche, Comment ça
  marche ?) ou sous le fil de la séance, qui est alors le titre de l'écran de
  jeu : les étapes ①②③④ et le nom de l'activité, CENTRÉS (`placerEnTete`,
  liste `TETES_ECRAN`, `body.ligne-sous-titre`). LA FLÈCHE EST TOUJOURS EN
  HAUT À GAUCHE, sur la ligne du titre : pendant la séance, « ← Ma table »
  (« ← Accueil » dans Défi calcul) monte sur la ligne des étapes (ronde au
  téléphone), comme « ← Mon parcours ⋯ ». Sans titre (une série ou un
  résultat hors séance, « Tu as choisi »), la ligne reste en haut du cadre.
  Le trait fin gris passe sous la ligne. Anzan met la ligne sous le
  titre de Mon historique ; le retour
  au niveau parent reste un bouton en haut à gauche du CADRE BLANC (« ← Niveaux »
  dans Coffres magiques). Pas de logo en haut. La vue du professeur dans Défi
  tables (« Ma classe : le parcours de Léa », lecture seule) garde sa barre
  fine au-dessus du cadre.
- Écrans de jeu où la place manque (la séance d'Anzan, les étapes de SPLAT!, le
  mémo et le jeu de Coffres magiques) : la pastille « ● prénom » (avec le plein
  écran) suffit. On ne déplace pas une mise en page de jeu pour y loger la
  ligne ; « Se déconnecter » reste à une flèche, sur l'accueil de l'appli.
- Sans code, rien ne change (en-tête, fil d'Ariane du site). Seul l'habillage
  propre à une appli vaut pour tous (« Anzan adouci » du 31/10/2026 : bandeau
  blanc à trait fin gris, cases blanches à bordure fine, choix en bleu).
- Pas de pied (24/10/2026) : ni « logo + Mon espace », ni crédits, ni liens du
  site. Le retour vers Mon espace est la flèche du haut ; l'information sur la
  confidentialité est sur la page Mon espace. (Avant le 24/10 : le petit logo et
  « Mon espace » en bas.)
- L'ÉLÈVE CONNECTÉ NE RETOMBE JAMAIS SUR LE SITE (règle de Gwenaël du
  08/11/2026, après qu'une maman a dit que sa fille « sortait du suivi ») :
  quand il revient, c'est sur son menu à lui, Mon espace. Dans une appli
  suivie, ses jeux et ses films, aucun lien visible ne mène au site (logo,
  « ← Calcul mental », catalogue, licence, pied) ; la flèche, « Se
  déconnecter », « Non, ce n'est pas moi », un billet expiré ou un serveur
  muet mènent tous à Mon espace. Les pages de navigation du site (celles
  qui chargent `mention-confidentialite.js`) ET les carrefours (page des
  livrets SPLAT!, boîte à jeux courts) chargent
  `assets/js/eleve-retour-espace.js`, premier script du `<head>`, sans
  `defer` : un onglet qui garde le code d'un élève repart vers Mon espace sans
  montrer la page (un Retour de trop, un détour). Jamais dans une appli
  suivie ni dans une page qu'elle ouvre pour l'élève (les films), ni dans
  les pages courtes des QR des livrets (`splat/*/livret/`), qui envoient
  sur un jeu et n'ont aucun lien vers le site.
- « Se déconnecter » de Mon espace passe par `https://mathsgo.re/?sortie=1`,
  qui vide l'onglet côté site (tout le sessionStorage de mathsgo.re ; le
  localStorage, où les parcours sont rangés sous une empreinte, n'est pas
  touché) puis revient sur Mon espace avec `?oublier=1` — deux `replace`,
  aucune entrée en trop dans l'historique. Sans ce passage, le code des
  applis survivait et un Retour rouvrait l'appli au nom de l'élève
  précédent (poste partagé). Toute nouvelle façon de se déconnecter vide
  les DEUX domaines. Une appli suivie ressortie du cache arrière/avant sous
  un code se recharge avant tout autre traitement (SPLAT!, Défi tables,
  Défi calcul : un écouteur « pageshow » posé avant tous les autres).
  Gardé par `tests/eleve-retour-espace.test.mjs`. Une nouvelle appli suivie
  se vérifie élève connecté, au téléphone et à l'ordinateur, liens cachés
  compris.
- Ce que le site ne peut pas régler : le code vit dans la mémoire de
  l'ONGLET. Un onglet vierge (favori, historique, icône sur l'écran du
  téléphone) n'en a pas : l'appli s'ouvre en visiteur, les familles
  repartent toujours de suivi.mathsgo.re. Mais un onglet ouvert par un lien
  depuis l'onglet de l'élève peut en recevoir une copie, et fermer un
  onglet ne déconnecte pas les autres.
- Mémoire de l'appli (monde ouvert, table choisie…) : celle de l'élève, pas
  celle de l'appareil (clé portant l'empreinte du code, jamais le code en
  clair) ; si l'élève ferme tout, il retrouve tout fermé.
- Tuile dans Mon espace : rien tant qu'aucune réussite, puis une jauge et
  « N … sur M », comptés sur ce que la classe a d'ouvert.
- Réglage par classe (serveur pro, lot 5b, 30/10/2026) : dans Ma classe, EN
  HAUT DE L'ONGLET DE L'APPLI. Une ligne dit qui la voit (« ● Ouvert à toute
  la 405 · mondes 1, 2, 5 · en plus pour 1 élève », ou « ● Ouvert à quelques
  élèves · Rania ») et « Régler … » (propriétaire seulement ; un collègue lit
  la ligne) ouvre une fenêtre : la case « Ouvert à toute la classe », les
  réglages de l'appli pour la classe (déclarés dans `LISTES_PAR_ELEVE` de la
  page et dans `lib/applis.php`), puis ce qui est fermé à la classe, à ouvrir
  EN PLUS à quelques élèves (on ne retire jamais rien à un élève). Rien ne
  part avant « Enregistrer ». Tout ouvert par défaut. Plus de carte
  « Activités » dans ⚙ Réglages, plus de « Ce que voit… » dans Élèves.
  Toute écriture d'accès part avec « avant », l'état que la page croit rangé
  (`eleves.acces` : les ajouts de l'élève ; `classes.modifier` : la liste
  des applis et les réglages de l'appli réglée, correctif du 30/10/2026) :
  si un autre onglet a écrit entre-temps, le serveur refuse (409) avec l'état
  actuel au lieu d'écraser, et la page se remet dessus. La relecture qui suit
  un enregistrement est bornée comme l'écriture (15 s) ; sans relecture, la
  fenêtre se libère et dit que la vérification n'a pas pu se faire.
- Dans Ma classe, l'onglet d'une appli montre sa progression, sans aucun code
  d'élève : les codes ne s'écrivent que dans l'onglet « Élèves » (et sur les
  papiers imprimés), pour qu'une page projetée ne les montre jamais à la
  classe (lot « Ma classe : élèves », 18/10/2026 ; gardé par
  `tests/suivi-ma-classe-eleves.test.mjs`).
- Dans Ma classe, chaque appli a TOUJOURS son onglet (lot 5b) : son nom quand
  la classe l'a ; le nombre d'élèves en pastille quand quelques élèves
  seulement l'ont (« Anzan 1 ») ; grisé quand personne ne l'a, avec dedans la
  carte « … est fermé à la 306 » (« Choisir quelques élèves », « Ouvrir à
  toute la 306 »). Le menu « Défi tables ▾ » du téléphone recopie nom,
  pastille et gris. Dans l'onglet d'une appli que la classe n'a pas, seuls
  les élèves qui la voient (ou qui y ont déjà du travail) sont listés, sans
  carte de classe. Une nouvelle appli suivie : une entrée dans `APPLIS`, son
  onglet, et ses listes dans `LISTES_PAR_ELEVE` si elle se règle (gardé par
  `tests/suivi-serveur-pro-qui-voit-quoi.test.mjs`).
- Le moteur d'une appli suivie est COPIÉ octet pour octet dans
  `_serveur/public/prof/` (gardé par `tests/suivi-moteur-copie.test.mjs`) et
  c'est lui seul qui lit un parcours (`resumeProf`, `resumeTuile`) : la page
  prof et la tuile ne touchent jamais aux données. Défi calcul (lot 2b,
  31/10/2026) en a DEUX : `defi_calcul_core.js` (la carte, les noms, les
  erreurs connues) puis `defi_calcul_mon_parcours.js` ; le noyau se charge
  d'abord (`avant` dans `JAUGES` de l'espace élève, `chargerMoteurCalcul` de
  la page prof). Aucun calcul d'élève n'est enregistré : l'exemple d'une
  erreur est regénéré depuis la fiche du module (`exempleErreur`).
- Le cadre de l'appli tient entier dans l'écran avec le bloc de suivi, sur
  téléphone comme sur ordinateur.
- Sans code, rien ne change : en-tête et fil d'Ariane du site (et pas de pied,
  comme pour toutes les applis).

## L'appli Cours : le livret de cours (depuis le 08/11/2026)

- Le livret de cours de Gwenaël (une fiche par savoir-faire, « Je sais… »)
  est FABRIQUÉ HORS DU DÉPÔT, dans son dossier « Livret de cours\_moteur »
  (`python build.py site <dépôt>`). La commande écrit les pages du dossier
  `cours/` (une par fiche, `cours/<niveau>/<identifiant>.html`, plus
  l'Entraînement brevet et la version imprimable de chaque chapitre) et le
  catalogue du serveur `_serveur/public/lib/cours.json`. Ne pas modifier ces
  fichiers à la main : refaire la commande. Une page qui sort du livret est
  retirée du dossier par la même commande.
- Les pages ne sont PAS publiques au début (choix de Gwenaël) : aucune page
  du site ne les cite (catalogue, plan du site, annuaire, accueil), elles
  portent « noindex », le compteur de visites n'y est pas. On y arrive par
  l'espace élève de suivi.mathsgo.re (tuile « Mes cours », en haut). Un élève
  qui tape l'adresse d'une fiche fermée peut la lire : accepté (un cours sous
  licence libre, aucune donnée d'élève derrière).
- Rien n'est enregistré de ce que l'élève ouvre ou répond : ni serveur, ni
  stockage du navigateur, ni compteur. Le bouton « ◀ Mes cours » (barre
  collée en haut de chaque page) ramène au chapitre d'où l'élève vient parce
  que l'adresse le dit (`#ch=3e-PYT`), pas parce que le téléphone l'a retenu.
- Le professeur règle, classe par classe, les chapitres ouverts (rien au
  départ), les fiches fermées et les fiches du nouveau programme ouvertes
  (fermées par défaut) : `classes.reglages.cours`, des identifiants du
  catalogue seulement (`lib/cours.php`). Pas d'ajout par élève, pas de
  progression (`api/parcours.php` ne connaît pas « cours »). Dans Ma classe,
  l'onglet Cours n'a pas de tableau et n'entre ni dans La classe ni dans la
  fiche d'un élève (`sansSuivi`).
- Gardé par `tests/cours-appli.test.mjs` et les tests « cours-appli » de
  `_serveur/tests/lancer.php`. Ajouter un chapitre : le refaire avec le
  moteur, puis déposer par FTP `lib/cours.json` et `VERSION`.

## Fusion des données : modèle commun

Quand une appli suivie garde une LISTE d'événements (des séances, des parties),
ces événements arrivent de plusieurs appareils (téléphone, tablette du collège,
le serveur), parfois hors ligne, parfois d'une vieille copie. Le modèle est
celui d'Anzan (`outils/calcul_mental/flash_anzan_parcours.js`, lot 4a, quatre
relectures Codex) ; toute nouvelle appli qui garde une liste le suit.

- Chaque événement porte un **identifiant** tiré par la page au début (entier,
  au hasard, sous la borne des entiers du serveur) et un **ordre** : le plus
  grand ordre connu du parcours, plus un. L'identifiant dit « c'est le même
  événement » ; l'ordre dit « il vient après ».
- **Un seul ordre du temps** : l'ordre, puis l'identifiant (deux appareils hors
  ligne qui ont pris le même ordre). Jamais le jour (l'horloge d'un appareil
  peut mentir), jamais l'heure (on n'en garde pas), jamais le numéro.
- Les **numéros** (les clés « 1 », « 2 »… envoyées au serveur) ne sont que des
  places, refaites à chaque rangement : 1, 2, 3… dans l'ordre du temps. Les
  mêmes événements donnent toujours le même parcours, sur tous les appareils :
  rien à renvoyer quand rien n'a changé.
- **Fusion = union par identifiant** : deux vues du même événement → la plus
  avancée (le plus de travail fait, puis le meilleur score, puis le plus petit
  ordre, puis un choix fixe sur le texte : le même dans les deux sens). Jamais « une copie entière
  remplace l'autre ».
- La **borne** (les N derniers gardés) se prend APRÈS le tri dans l'ordre du
  temps ; un ordre arrivé à la borne des entiers fait d'abord resserrer les
  ordres 1, 2, 3… (sinon tout ce qui suit est jeté à l'entrée).
- Un événement en cours garde son identifiant, son ordre et son jour du début
  à la fin, même s'il sort du parcours entre deux notes (une fusion qui en
  apporte 500 pendant qu'il se joue) : il revient avec SON ordre.
- Avant de livrer, jouer soi-même : deux appareils, une vieille copie, la
  borne, une donnée abîmée, la fusion dans les deux sens, une réouverture qui
  ne doit rien renvoyer, et des identifiants qui ne montent pas dans le sens du
  temps.

## Compteur de visites (depuis le 06/11/2026)

- Chaque page HTML du plan du site (`sitemap.xml`) charge
  `assets/js/compteur.js` par une ligne posée avant `</head>`. Après
  `npm run seo:generer` qui ajoute une page, lancer
  `node scripts/injecter-compteur.mjs --apply` ; sinon
  `tests/compteur-visites.test.mjs` rougit.
- Le compteur est écrit pour le site : ne pas le remplacer par le script de
  GoatCounter. Il n'envoie que le chemin (sans « ? » ni « # »), le site
  d'origine réduit à son nom, la largeur d'écran, et le nom d'une fiche PDF
  cliquée. Jamais le titre de la page, ni rien du stockage du navigateur.
- Aucun fichier de `_serveur/` ne le charge : le suivi de classe n'est pas
  compté.
- Toute nouvelle information envoyée se dit d'abord dans `confidentialite.html`
  (section « Hébergement, contact, audience »).
- L'auteur ne compte pas ses visites : `#ne-pas-me-compter` à la fin d'une
  adresse du site, une fois par appareil (`#me-compter` pour annuler).

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
