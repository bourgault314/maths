# État du chantier Automatismes V2

**Dernière mise à jour : 20 juillet 2026.**

## Référence vérifiée

- Dépôt : `bourgault314/maths`.
- Branche de référence : `main`.
- Commit de référence de la branche courante :
  `b0e42f612a1b1fd75d57020a0e3bc8d4eaf85b67`.
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
- Le lecteur neuf expose `NC-01/F2`, `GE-12/F1`, `PG-22`, `PG-23`
  et `PG-24` dans « S'entraîner » et « Au tableau », avec un moteur commun
  et le registre unique de notions.
- La carte du DNB est établie : **37 cibles officielles distinctes**,
  **38 cibles normalisées** et **88 micro-notions**.
- Une séance n'active toujours qu'une seule notion. Les cinq notions déjà
  construites restent séparées dans le registre des générateurs.
- Le critère par 10 est un complément maths&go validé. Il reste proposé dans le
  parcours DNB, tout en étant distingué des quatre critères officiels dans les
  données.
- La fiche `NC-01`, les six familles de questions, les aides, les corrections,
  les storyboards et la séparation séance/question/trace ont été validés par
  Gwenaël le 19 juillet 2026. Le mini-cours et son schéma doivent être repris
  puis validés séparément avant affichage, décision du 20 juillet 2026.
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

- le même moteur d'état alimente l'entraînement et le mode classe ;
- l'écran de départ reste générique et récapitule la sélection, le nombre de
  questions et l'état de l'aide ;
- l'entraînement affiche une grille de six choix, conserve la sélection après
  validation, crée une trace conforme et calcule le score depuis les traces ;
- « Aucun » est exclusif et aucune bonne réponse n'est révélée avant
  l'ouverture volontaire de la correction ;
- l'aide fait repérer l'unité puis composer la somme des chiffres en deux
  gestes colorés et manipulables, sans effectuer le calcul ni conclure ;
- la correction distingue visuellement le chiffre des unités, les verdicts
  pour 2, 5 et 10, la somme des chiffres, les verdicts pour 3 et 9, puis la
  conclusion, tout en conservant les explications validées ;
- le mode « Au tableau » ne crée ni trace d'élève ni score individuel. Il permet
  de saisir et vérifier une réponse collective ou de révéler directement la
  réponse, puis d'ouvrir l'aide ou la correction et de passer à la suite ;
- les anciens liens `mode=interactif`, `mode=diaporama` et `mode=projection`
  restent compatibles, mais les valeurs canoniques sont `entrainement` et
  `classe` ;
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

## Lot local non publié : « Au tableau » remplace le diaporama séparé

La branche `agent/automatismes-v2-mode-classe` applique la décision D-025 :

- les deux contextes canoniques sont `entrainement` et `classe` ;
- les anciens paramètres d'URL sont convertis sans casser les liens existants ;
- au tableau, le professeur peut sélectionner puis vérifier une réponse
  collective, ou révéler directement la réponse attendue ;
- cette vérification ne produit aucune trace d'élève et aucun score individuel ;
- les libellés visibles parlent de « S'entraîner » et « Au tableau », jamais
  d'un deuxième produit nommé « diaporama » ;
- le rythme automatique et le chronomètre restent des réglages futurs du mode
  classe ; ils ne sont pas construits dans ce lot ;
- les contrôles visuels couvrent 19 écrans à 390 × 844, 1 280 × 720 et
  1 920 × 1 080, sans débordement horizontal ni cible inférieure à 44 px ;
- `npm run verifier` réussit **944 tests sur 944**.

## Prochaine étape du lot courant

Le lot courant conserve le registre unique de D-024 et transforme les deux
contextes visibles en « S'entraîner » et « Au tableau ». Le mode classe accepte
une réponse collective sans créer de trace d'élève, ou permet de révéler la
réponse avant la correction. La branche reste destinée à une PR brouillon :
un essai réel sur téléphone est requis avant fusion. Le mini-cours définitif de
`NC-01` et son schéma restent reportés à une validation pédagogique dédiée.

## Règle de mise à jour

À chaque fin de tâche, remplacer le chantier actif et la prochaine étape par
l'état réel. Ne jamais conserver ici une action déjà terminée comme si elle
était encore à faire.
