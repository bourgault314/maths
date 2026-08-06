# État du chantier Automatismes V2

**Dernière mise à jour : 6 août 2026.**

## Point de reprise vérifié du 6 août

- Le dépôt de référence reste `bourgault314/maths`; `main` a été vérifié au
  commit `d18a8c5cc4c6d10f90cea690d5a334dbecc472fe`.
- Le menu apprécié par Gwenaël n'a jamais disparu : sa version publique est
  dans `auto/` et sa filiation dans `studio/automatismes/`.
- La candidate NC-01 complète avait été conservée dans un dépôt Git séparé de
  ChatGPT Sites. Elle est rapatriée sur la branche
  `agent/automatismes-v2-menu-nc01`, issue du `main` courant.
- `/auto/` et la V1 publique restent inchangés.

### Candidate NC-01 actuelle

- Les cinq familles actives F1, F2, F3, F5 et F6, le planificateur de séries
  5/10/15/20, le cours en trois pages, les aides, les corrections et les deux contextes sont
  **construits** et testés.
- F4 est retirée de toutes les séries actives sans renuméroter les identifiants
  stables. Le cas « Aucun » reste naturel et n'est pas forcé dans chaque série.
- `NC-01` est désormais `valide` : Gwenaël a validé le dernier moule et autorisé
  explicitement sa publication sur la route pilote non liée.
- Le lanceur reprend la coque visuelle de `/auto/`, avec seulement
  `S'entraîner / Au tableau`, le nombre de questions et NC-01.
- La calculatrice barrée historique est restaurée dans la barre de lancement :
  V2 étant exclusivement DNB, elle reste visible dans les deux contextes et
  porte le libellé accessible « Épreuve DNB sans calculatrice ».
- Les six domaines V2 sont enregistrés dans la structure du menu ; seuls les
  domaines non vides sont rendus. Au départ, seul « Nombres et calculs » est
  visible avec son icône originale.
- Les solides et volumes présents dans le registre technique restent exclus du
  menu par liste blanche ; ils ne peuvent pas apparaître accidentellement.
- L'écran « Prêt à t'entraîner ? » ne répète plus les règles : il conserve la
  notion, le nombre de questions, « Voir le cours » et « Commencer ».
- Le cours accessible avant la série utilise le même panneau stable que pendant
  la série. L'aide F2 ne fait plus défiler l'écran et regroupe ses vérifications
  dans deux étapes autonomes.
- Le pavé maths&go est masqué sur un ordinateur muni d'une souris et d'un
  clavier, mais reste visible sur téléphone, tablette, appareil hybride et TNI.
- Le bilan propose « Nouvelle série », « Refaire la même série » et « Choisir
  une autre série ».
- F3 présente quatre nombres au lieu de six pour limiter le nombre de sommes à
  effectuer dans une seule question ; « Aucun » reste un cas naturel.
- Le cours relie désormais chaque schéma de partage à son égalité et à sa
  conclusion. Les chiffres observés sont encadrés dans le cours et centrés dans
  la correction.
- Le pavé tactile est placé dans un bandeau stable sous la carte ; il ne peut
  plus augmenter sa hauteur. Les consignes Oui/Non redondantes sont supprimées,
  tandis que la validation séparée est conservée.
- La sous-forme F6 « groupes possibles » est supprimée. F6 alterne uniquement
  entre une réponse Oui/Non et la recherche du retrait minimal.
- Le cours, l'aide et la correction utilisent une coque commune avec contenu
  défilable et commandes toujours accessibles. Le pavé contextuel intègre
  « Valider » et prépare les futurs profils avec virgule ou signe moins sans les
  afficher dans NC-01.

### Vérifications de cette reprise

- `npm run verifier` : **1 056 tests sur 1 056 réussis** ;
- garde-fous V2 : 98 fichiers surveillés, 49 fichiers de production avec
  provenance déclarée ;
- contrôles réels à 320 × 568, 390 × 844 et 1 280 × 720 ;
- aucun débordement horizontal ;
- commandes du menu d'au moins 44 px ;
- liaison vérifiée jusqu'à une vraie question NC-01 en entraînement et au
  tableau.
- inventaire technique de `auto/`, `studio/automatismes/` et des fondations V2
  consigné dans `inventaire-auto-studio.md` ; il distingue les briques déjà
  reprises, les candidates à adapter et le moteur historique à laisser isolé.
- tests ciblés NC-01 et lecteur : **91 sur 91 réussis** ; construction du site
  d'essai et contrôle réel du cours et de l'aide sur ordinateur réussis.

### Publication autorisée

La PR #278 porte exactement la dernière candidate contrôlée par Gwenaël. Sa
fusion et la publication de la route non liée `/automatismes-v2/` sont
explicitement autorisées. `/auto/` reste intact et doit être contrôlé après le
déploiement. La route pilote demeure hors navigation et hors sitemap, avec
`noindex,nofollow` ; elle n'est donc pas privée pour autant.

## Référence vérifiée

- Dépôt : `bourgault314/maths`.
- Branche de référence : `main`.
- Commit de référence vérifié sur GitHub :
  `52b6ba34cdfdd62ad77da4b2c66702beecc05525`.
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
- Le lecteur neuf expose en interactif et en diaporama `NC-01/F2`, `GE-12/F1`,
  `PG-22`, `PG-23` et `PG-24`.
- La carte du DNB est établie : **37 cibles officielles distinctes**,
  **38 cibles normalisées** et **88 micro-notions**.
- Une séance n'active toujours qu'une seule notion. Les cinq notions déjà
  construites restent séparées dans le registre des générateurs.
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
- `PG-22`, `PG-23` et `PG-24` restent trois séances distinctes pour le cube et
  le pavé, le prisme droit et le cylindre ;
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

## Prochaine étape du lot courant

Après la vérification de la route publiée, aucun contenu de `NC-02` ne doit être
programmé avant sa fiche pédagogique. Cette fiche partira de la cible unique
« carrés des entiers de 1 à 12 » et distinguera les familles directe et inverse
sans créer deux micro-notions.

La carte de couverture conserve 88 micro-notions internes, mais elles ne
deviennent pas 88 questionnaires visibles. Les catégories du menu pourront
regrouper plusieurs micro-notions : `NC-03` et `NC-04`, par exemple, formeront
une même catégorie visible « Fractions simples et décimaux » tout en gardant
deux générateurs et deux suivis internes.

## Règle de mise à jour

À chaque fin de tâche, remplacer le chantier actif et la prochaine étape par
l'état réel. Ne jamais conserver ici une action déjà terminée comme si elle
était encore à faire.
