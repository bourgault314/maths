# Lot 2 — moule de l’application Automatismes

21 octobre 2026. Branche `automatismes-moule`, PR vers `main`, sans fusion.

## Provenance et périmètre

- Base : `main`, commit `f7474921151cf717ca05d363e87c291a5ecfa509`.
- Source importée : branche `archive/automatismes-sites-2026-10-20`, commit
  `8feecca64107ee9cdbd3dc5cb9963db38e25bfc0`, archive `Sauvegarde_complete.zip`.
  La copie de sauvegarde fournie précédemment a servi à extraire les fichiers.
- Référence d’interface : ZIP `lot1-references-pour-codex.zip`, contrat daté du 21 octobre,
  maquette et planches a à j. Le prompt du lot 2 précise les éléments provisoires.
- Seuls `/automatismes/`, les tests `automatismes-*` et leurs pièces de contrôle sont ajoutés.
  `/auto/`, `packages/`, catalogue public, sitemap et serveur restent inchangés.
- La page et les correspondances portent `noindex, nofollow`. Aucun lien public n’est ajouté.

## Livraison

84 familles, 435 formes, 153 liens vers les correspondances officielles.
Les familles EG17, DP05 et NC30 sont conservées mais cachées (`valide: false`).

| Domaine                     | Familles conservées |
| --------------------------- | ------------------: |
| Nombres et calculs          |                  34 |
| Proportionnalité, fonctions |                  11 |
| Espace et géométrie         |                  27 |
| Données et probabilités     |                   8 |
| Pensée informatique         |                   4 |

Les huit catégories historiques restent dans `sousDomaine`. GM01, GM03 et GM04 rejoignent
Nombres et calculs, GM02 Espace et géométrie et PF08 Proportionnalité, fonctions.
Le filtre peut afficher moins de familles : il ne propose que leurs formes éligibles.

- `catalogue/` : cartes individuelles, catalogue assemblé, 435 alias documentés et script d’assemblage.
- `generateurs/`, `core.js`, `math-format.js`, `math-layout.js`, `fonts/` : import mis en forme.
- `moteur.js` : interface aux générateurs par famille, lettre et graine.
- `app.js`, `vues.js`, `champs.js`, `seances.js` : interface, saisies et composition des séries.
- `cours/` : les 16 dessins d’exemple hérités. `aides/README.md` prépare les futurs cahiers.
- `suivi.js` : événements locaux et étoiles, sans adaptateur serveur.

L’adresse canonique est `?notion=NC27&forme=a&graine=123`.
Les anciens indices numériques restent lisibles. Chaque entrée d’alias conserve l’ancien identifiant,
le nouveau, la lettre, le rang du générateur et l’ancien paramètre d’adresse.

## Fonctionnement

La séance du jour comporte huit questions du filtre choisi. Les formes les moins vues sont privilégiées,
sans répétition avant épuisement des formes de la famille. Une notion ouvre une série ciblée de cinq
questions ; mélanger un domaine en produit huit. Le professeur choisit de une à quarante questions.
Une série partagée conserve les notions, le niveau, le nombre et la graine, sans dépendre de l’historique
local du destinataire.

Le Brevet conserve neuf questions, vingt minutes, trois questions de nombres, deux de calcul littéral,
une de géométrie, une de grandeurs, une de proportionnalité/fonctions et une de données/algorithmique.
Aucune aide ni correction pendant la série ; navigation par points et correction à la fin.

Le dessin d’aide reste sous la question. « Une étape » ajoute le texte du second indice.
Ouvrir l’aide replie le clavier ; toucher le champ le rouvre. La préférence « Garder l’aide affichée »
s’applique dès la question suivante. Le cours reste volontaire et utilise un autre exemple.
Passer affiche la correction et compte une réponse non réussie. Après une erreur, la correction est
immédiatement accessible. Consulter une aide après une réponse terminée ne requalifie pas cette réponse.

La projection propose recherche chronométrée, pause par espace, flèches, points, enchaînement,
délai entre questions, correction après chaque question ou à la fin. Elle n’émet aucun essai d’élève.

## Écarts et limites explicites

1. **Contenu gelé.** Les dessins d’aide et de correction ne sont pas remplacés par les dessins des cahiers.
   La correction présente le texte `solution` puis le premier dessin, encore non complété.
   Les couleurs et les textes internes des SVG hérités restent ceux de l’archive ; leur révision relève
   des cahiers. La nouvelle interface utilise exclusivement la palette du site.
2. **Exception de vocabulaire demandée.** « Dernier chiffre » devient « chiffre des unités ».
   Les 87 000 sorties sont comparées à l’archive avec cette seule normalisation textuelle et l’ajout
   du type par défaut des champs. Aucun énoncé, calcul, aide ou cours n’est autrement réécrit.
3. **Parcours provisoire.** Pas de boîtes ni de programmation professeur dans ce lot. La troisième étoile
   peut être confirmée par une série ciblée ou une séance du jour un autre jour, conformément au prompt
   simplifié du lot 2. Le parcours complet du §5.1 viendra plus tard.
   Une série qualifiante comporte au moins cinq questions, au moins 80 % de réussites sans aide,
   et au moins `min(5, nombre de formes éligibles)` formes différentes.
4. **Réponses composites héritées.** GM04-b, EG03-c, EG16-d et EG16-f mélangent nombres et sélecteurs.
   La carte indique une réponse principale `nombre` et détaille les types de chaque champ, sans changer
   ces questions. Les futurs cahiers pourront décider d’un autre découpage.
5. **QCM historiques à plus de quatre choix.** EG19-a conserve six choix et EG21-b cinq.
   Tous les distracteurs sont préservés ; l’interface les affiche par pages de quatre choix au maximum,
   avec « Autres choix ». Cette adaptation concerne aussi la projection.
6. **Cartes de contenu.** Les types V1 précis non fournis restent vides. `valide: true` signifie ici
   « visible dans le moule », pas validation pédagogique nouvelle par Gwenaël.
7. **Mise en forme.** Prettier, largeur 100, appliqué au code et aux JSON. Les JS/HTML/CSS ne dépassent
   pas 160 caractères par ligne ; aucune fonction d’`app.js` ne dépasse 80 lignes. Certaines longues
   chaînes JSON pédagogiques restent indivisibles. Les SVG d’exemple et les polices sont des assets
   hérités, conservés sans réécriture.
8. **Pages longues.** Les listes de notions, réglages professeur et bilans longs défilent dans le cadre.
   Les commandes professeur restent visibles. Les états de question contrôlés tiennent dans leur zone
   intérieure sur ordinateur ; les grands contenus hérités restent défilables lorsqu’ils l’exigent.
9. **Chargement statique.** Aucun appel à un service externe ni à une API de suivi. Le navigateur charge
   seulement les fichiers du site, dont les deux JSON statiques du catalogue.

## Vérifications

```sh
node --test --test-reporter=tap
```

Dans l’environnement de contrôle, Chromium est indiqué avec `AUTOMATISMES_NAVIGATEUR`.
Sans cette variable, Playwright utilise son navigateur habituel. Aucun paquet n’est ajouté aux
dépendances du site. Si Playwright est absent en CI, les trois contrôles navigateur sont explicitement
signalés comme sautés ; les contrôles Node restent exécutables sans installation.

Résultat local final : **43 tests réussis, aucun échec, aucun test sauté**.
L’espace de travail contient le lot 2 et les fichiers de référence nécessaires, pas la totalité du dépôt :
ce résultat décrit les tests du lot 2. Les contrôles existants du dépôt relèvent de la CI de la PR.

- 87 000 générations : 200 graines × 435 formes ; réponse canonique acceptée, déterminisme,
  empreintes comparées à l’archive, fractions, expressions et ensembles contrôlés.
- 200 compositions Brevet : répartition exacte, sans QCM, sans famille cachée.
- Identités, niveaux, domaines, assemblage des 84 cartes et 435 alias.
- Analyse statique : aucun évaluateur dynamique ni constructeur de fonction dans l’application.
- Audit littéral des aides : 21 750 tirages, liste héritée figée et publiée ci-dessous.
- Palette et 17 couples de contraste des textes de la nouvelle interface : rapport au moins 4,5.
  Ce contrôle ne prétend pas certifier tous les textes internes des dessins hérités.
- Saisie de la charge HTML dans les champs nombre, fraction, expression, ensemble/texte et composite :
  aucun élément image injecté ni gestionnaire exécuté. Le QCM ne propose aucun champ de texte libre.
- Parcours : réponse juste puis cours, maintien des étoiles sans aide, préférence à la question suivante,
  partage, enchaînement du minuteur, pause, fin automatique du Brevet.
- **54 captures**, 18 états × trois tailles : 390 × 844, 1366 × 768 et 1280 × 720.
  Cadre extérieur et contenu intérieur contrôlés ; commandes accessibles et aide au-dessus du clavier.
  Les captures ont été relues visuellement, puis corrigées et reprises après les défauts constatés.

Pièces : captures et mesures rangées hors dépôt (automatismes-refonte\codex\RAPPORTS\captures-lot2\),
[empreintes de l’archive](../../../tests/fixtures/automatismes/empreintes-archive.json),
[audit détaillé des aides](../../../tests/fixtures/automatismes/aides-a-revoir.json).

Les tests numériques ne prouvent pas la qualité pédagogique de chaque tirage. Aucun téléphone,
aucune tablette et aucun TNI physique n’a été utilisé : seuls les navigateurs aux tailles indiquées
ont été contrôlés. Gwenaël doit vérifier le toucher, la lisibilité à distance et le plein écran sur ses appareils.

## Et un pirate ?

1. **Il invente des réussites.** La mémoire et les événements côté navigateur sont modifiables par
   l’utilisateur. Ils ne constituent ni une note ni une preuve d’identité. Le code valide strictement les
   six champs avant journalisation, mais n’authentifie pas une réussite. L’évaluation serveur/professeur
   n’existe pas dans ce lot.
2. **Il inonde.** Le journal local est borné aux 10 000 derniers événements. Il n’existe pas encore de
   limite de débit serveur ni de réponse HTTP 429, puisqu’aucun serveur de suivi n’est appelé.
   Le futur adaptateur devra mettre ces protections en place côté serveur.
3. **Il envoie n’importe quoi.** `suivi.js` exige exactement famille, forme, graine, juste, aide et moteur.
   Il vérifie la famille, la syntaxe de la forme, l’entier de graine, les valeurs 0/1 et 0–3 et le format de version.
   Les champs supplémentaires sont rejetés. Aucune réponse brute ni texte libre n’est journalisé.
4. **Il rejoue une graine.** C’est possible et volontaire en entraînement. Le lot ne garantit aucune
   unicité de réponse à une question imposée par un professeur. Les contraintes de graine serveur et de
   séance authentifiée appartiennent au lot suivi.
5. **Il utilise le code d’un autre.** Aucun code élève, compte ou nom n’est demandé ou manipulé ici.
   La mémoire est celle du navigateur partagé ; elle ne sépare pas encore plusieurs élèves.
6. **Il cherche une faille dans la page.** Catalogue et générateurs sont statiques. Le correcteur parse
   les expressions sans exécuter de JavaScript. Les saisies passent par la propriété `value`, jamais
   par une interpolation HTML. Les messages passent par l’échappement de texte. Les liens de série sont
   construits avec `URLSearchParams`. Les tests navigateur vérifient les types de champs.
   La page cachée n’est pas secrète, et ne contient aucune donnée sensible.

L’événement émis est exactement :

```json
{ "famille": "NC27", "forme": "a", "graine": 123, "juste": 1, "aide": 0, "moteur": "0.1.0" }
```

Les dates et identifiants de séries servent uniquement aux étoiles dans une mémoire locale séparée.
Le moteur importé garde sa version ; elle accompagne chaque graine.
Le rendu de la contraction française « n’est » reste du texte droit, pas une variable mathématique.

## Formes dont le premier SVG contient littéralement une réponse

**295 formes signalées sur 435.** La recherche exigée porte sur toute la chaîne SVG : elle inclut les
coordonnées, dimensions, couleurs et attributs. Une occurrence ne prouve donc pas que la réponse soit
lisible par l’élève. Aucune de ces aides n’a été corrigée dans ce lot. Le fichier JSON détaillé donne
le nombre d’occurrences et le premier exemple. Le test protège ce constat hérité, sans présenter ces
295 formes comme conformes au critère pédagogique « la réponse n’est pas écrite ».

| Famille | Formes à revoir                                                        |
| ------- | ---------------------------------------------------------------------- |
| NC01    | NC01-a, NC01-b, NC01-c, NC01-d                                         |
| NC02    | NC02-a, NC02-c                                                         |
| NC03    | NC03-a, NC03-b, NC03-c                                                 |
| NC04    | NC04-a, NC04-b, NC04-d, NC04-e, NC04-f                                 |
| NC05    | NC05-a, NC05-c, NC05-d, NC05-e, NC05-f                                 |
| NC06    | NC06-a, NC06-b, NC06-d                                                 |
| NC07    | NC07-a, NC07-b, NC07-c, NC07-d, NC07-e                                 |
| NC08    | NC08-c, NC08-e, NC08-g                                                 |
| NC09    | NC09-a, NC09-b, NC09-c                                                 |
| NC10    | NC10-a, NC10-b, NC10-c, NC10-d, NC10-f                                 |
| NC11    | NC11-a, NC11-b, NC11-c, NC11-f                                         |
| NC12    | NC12-a, NC12-b, NC12-d, NC12-e, NC12-g                                 |
| NC13    | NC13-a, NC13-b, NC13-c, NC13-d, NC13-f                                 |
| NC14    | NC14-a, NC14-b, NC14-c, NC14-d, NC14-e, NC14-f, NC14-g                 |
| NC15    | NC15-a, NC15-b, NC15-c, NC15-d, NC15-e, NC15-f                         |
| NC16    | NC16-a, NC16-c, NC16-d, NC16-e                                         |
| NC17    | NC17-a, NC17-c                                                         |
| NC18    | NC18-b, NC18-c, NC18-d, NC18-e, NC18-f                                 |
| NC20    | NC20-c                                                                 |
| NC21    | NC21-a, NC21-b, NC21-c, NC21-e, NC21-f                                 |
| NC25    | NC25-d, NC25-e                                                         |
| NC27    | NC27-a, NC27-b, NC27-c, NC27-d, NC27-e                                 |
| NC28    | NC28-a, NC28-b, NC28-c, NC28-d                                         |
| NC29    | NC29-c, NC29-e                                                         |
| NC31    | NC31-a, NC31-b, NC31-d, NC31-e                                         |
| EG01    | EG01-b, EG01-d                                                         |
| EG02    | EG02-a, EG02-b, EG02-c, EG02-d                                         |
| EG03    | EG03-a, EG03-b, EG03-c, EG03-d                                         |
| EG04    | EG04-a                                                                 |
| EG15    | EG15-a, EG15-c, EG15-d                                                 |
| EG16    | EG16-a, EG16-b, EG16-c, EG16-d, EG16-e, EG16-f                         |
| EG17    | EG17-d                                                                 |
| EG18    | EG18-a, EG18-b, EG18-c, EG18-d, EG18-e                                 |
| EG11    | EG11-a, EG11-b, EG11-c, EG11-f                                         |
| EG13    | EG13-a, EG13-b, EG13-c                                                 |
| EG14    | EG14-a, EG14-b, EG14-c, EG14-d                                         |
| EG05    | EG05-b, EG05-e, EG05-f                                                 |
| EG06    | EG06-c, EG06-d, EG06-e, EG06-g                                         |
| EG07    | EG07-a, EG07-b, EG07-c, EG07-d                                         |
| EG10    | EG10-b, EG10-c                                                         |
| EG08    | EG08-a, EG08-b, EG08-c, EG08-d, EG08-f                                 |
| EG09    | EG09-a, EG09-b, EG09-c, EG09-d, EG09-e, EG09-f, EG09-g, EG09-h         |
| EG19    | EG19-c, EG19-d                                                         |
| EG20    | EG20-b, EG20-c                                                         |
| EG21    | EG21-a, EG21-b, EG21-c, EG21-d, EG21-e, EG21-f                         |
| EG22    | EG22-a, EG22-b, EG22-c, EG22-d, EG22-e                                 |
| EG23    | EG23-a, EG23-b, EG23-d                                                 |
| EG24    | EG24-a, EG24-b, EG24-c, EG24-d, EG24-e                                 |
| EG25    | EG25-c, EG25-d                                                         |
| EG26    | EG26-a, EG26-c, EG26-d                                                 |
| GM01    | GM01-a, GM01-b, GM01-c, GM01-d, GM01-e                                 |
| GM02    | GM02-a, GM02-b, GM02-c, GM02-d, GM02-f, GM02-g, GM02-h                 |
| GM03    | GM03-a, GM03-b, GM03-c, GM03-d, GM03-e, GM03-f, GM03-g, GM03-h         |
| GM04    | GM04-a, GM04-b, GM04-c, GM04-d, GM04-e                                 |
| DP01    | DP01-a, DP01-b, DP01-c, DP01-d                                         |
| DP02    | DP02-a, DP02-c, DP02-d, DP02-e                                         |
| DP03    | DP03-a, DP03-c                                                         |
| DP04    | DP04-a, DP04-b, DP04-c, DP04-d, DP04-e                                 |
| DP05    | DP05-a, DP05-b, DP05-c, DP05-d                                         |
| DP06    | DP06-d                                                                 |
| DP07    | DP07-a                                                                 |
| DP08    | DP08-d                                                                 |
| PI01    | PI01-a, PI01-b, PI01-d                                                 |
| PI02    | PI02-a, PI02-b, PI02-c, PI02-d, PI02-e                                 |
| PI03    | PI03-a, PI03-b, PI03-c, PI03-d, PI03-e, PI03-f, PI03-g, PI03-h, PI03-i |
| PI04    | PI04-a, PI04-b, PI04-c, PI04-d                                         |
| PF02    | PF02-a, PF02-b, PF02-c, PF02-d                                         |
| PF03    | PF03-a, PF03-b, PF03-c, PF03-d                                         |
| PF04    | PF04-a, PF04-b, PF04-d                                                 |
| PF05    | PF05-a, PF05-b, PF05-c, PF05-d                                         |
| PF06    | PF06-a, PF06-b, PF06-c                                                 |
| PF07    | PF07-a, PF07-b, PF07-d                                                 |
| PF08    | PF08-a, PF08-b, PF08-d, PF08-e, PF08-f                                 |
| PF09    | PF09-a, PF09-c, PF09-d, PF09-e, PF09-f, PF09-g                         |
| PF10    | PF10-b, PF10-c                                                         |
| PF11    | PF11-a, PF11-c, PF11-d                                                 |
