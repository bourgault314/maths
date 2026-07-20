# Pilotage d'Automatismes maths&go V2

**Document opérationnel de référence — 20 juillet 2026.**

Ce document fixe le cadre du chantier. Une instruction explicite plus récente
de Gwenaël peut le modifier ; la décision doit alors être consignée dans
`decisions.md` et ce document doit être mis à jour dans la même pull request.

## Mission

Construire un générateur d'automatismes indépendant pour maths&go. L'ancienne
banque sert uniquement à dresser l'inventaire des notions à couvrir. Les
énoncés, algorithmes, paramètres, valeurs et distracteurs de V2 sont écrits à
neuf.

La couverture se mesure en notions du programme traitées, pas en parité avec
les anciennes questions.

## Périmètre immédiat : le DNB

Tant que dure la phase en cours, V2 se construit **exclusivement pour le DNB**
(décision D-013 du 19 juillet 2026).

La **liste officielle des attendus du DNB** est la source de couverture : c'est
elle qui dit ce qui doit exister, dans quel ordre, et à quel moment la phase
est terminée. Elle est versionnée dans
[`carte-dnb-2026-mathsgo.md`](carte-dnb-2026-mathsgo.md) : 37 cibles officielles
distinctes, 38 cibles normalisées pour la fabrication et 88 micro-notions
ordonnées.

L'ancienne banque, elle, devient une **archive consultable**. Elle s'ouvre
notion par notion, au moment où l'on traite cette notion, pour une seule
raison : retrouver ce que Gwenaël y a lui-même apporté — questions
retravaillées, aides, choix de progression, ordre des étapes. Elle ne fournit
toujours ni énoncé, ni paramètre, ni distracteur, ni visuel, ni code.

**Rien d'ancien n'entre automatiquement dans V2**, pas même une contribution de
Gwenaël retrouvée dans l'archive. Il faut, dans cet ordre : une provenance
identifiée, puis sa validation explicite. Retrouver quelque chose n'est pas
décider de le reprendre : c'est seulement le poser sur la table.

## Responsabilités

- **Gwenaël** est l'auteur et le validateur pédagogique. Aucun contenu réel ne
  devient `valide` sans son accord explicite.
- **Le chef de projet technique** choisit l'architecture, l'ordre des travaux,
  les tests et les tâches de programmation, puis les explique simplement.
- **Codex ou Claude Code** exécute une tâche délimitée sur une branche dédiée.
  Un seul agent modifie une branche à la fois.

## Éléments acquis

À réutiliser lorsqu'ils répondent au besoin de la notion :

- les objets indépendants de `packages/objets/src/` ;
- les 187 automatismes officiels en données ;
- le générateur pseudo-aléatoire seedé ;
- le principe de contrats, gabarits et registre après audit de chaque contrat ;
- le principe d'identifiants stables, avec de nouveaux identifiants maths&go ;
- la doctrine de provenance.

Les visuels, les aides, le diaporama et l'interface mobile de la bêta sont des
créations de Gwenaël. Leur propriété est acquise, mais leur présence et leur
design dans V2 seront décidés au besoin. L'interface, les couleurs et
l'organisation de la bêta ne sont pas reconduites automatiquement.

Les fondations techniques existantes sont des candidates, pas des contraintes.
Le chef de projet peut les conserver, les corriger ou les remplacer selon la
solution la plus robuste pour maths&go. Aucune compatibilité technique avec
DocTools n'est recherchée.

## Nommage indépendant

V2 ne reprend ni les identifiants `dnb_*`, ni l'arborescence, ni le découpage
des 43 modules historiques. Les dossiers et identifiants sont créés depuis les
domaines de maths&go, les notions du programme officiel et le besoin
pédagogique validé. Une même notion mathématique peut naturellement conduire à
des calculs semblables ; ce fait ne justifie jamais la reprise d'une
organisation, d'une formulation ou d'un jeu de paramètres historique.

Les noms anciens peuvent subsister dans `auto/`, dans les inventaires et dans
les audits afin de décrire la dette existante. Ils ne deviennent jamais des
noms de source ou des identifiants V2. Le sigle officiel « DNB » peut rester
utilisé pour désigner l'examen ou un parcours destiné au brevet.

## Cycle obligatoire d'une notion

1. Lire les automatismes officiels concernés.
2. Consulter l'ancienne banque uniquement pour inventorier les notions et les
   familles de situations.
3. Préparer une fiche pédagogique : savoir-faire, prérequis, limites, familles
   de valeurs, erreurs d'élèves, forme de réponse, aides et visuels nécessaires.
4. Obtenir la validation pédagogique de Gwenaël.
5. Construire les objets manquants, le générateur seedé et les tests.
6. Présenter des exemples, l'aide, la correction et les cas limites.
7. Obtenir la validation finale avant publication.

Une seule notion est active à la fois. Aucun répertoire de contenu réel n'est
préparé en masse.

## Deux statuts indépendants

### Avancement

- `a_faire` : non commencé ou fiche en préparation ;
- `construit` : réalisé et testé, mais pas encore validé pédagogiquement ;
- `valide` : validé explicitement par Gwenaël.

### Provenance

- `original_mathsgo` ;
- `reconstruit` ;
- `herite_doctools` ;
- `a_auditer`.

L'avancement ne prouve pas la provenance, et la provenance ne vaut pas
validation pédagogique.

## Niveaux et paliers

Le parcours DNB actuel ne possède ni niveaux ni paliers. Les micro-notions
servent à organiser la fabrication et le suivi, pas à classer les élèves. La
variété vient des familles de questions, des valeurs, des erreurs travaillées
et de l'état de l'aide. D'éventuels niveaux appartiendront à une phase ultérieure
sur le programme complet du collège et demanderont une nouvelle décision.

## Forme de réponse

Par défaut, c'est toujours l'élève qui saisit sa réponse. La première exception
validée concerne le choix de diviseurs proposés au clic dans `NC-01/F2`. Les
autres formes prévues par la fiche `NC-01` n'entrent dans les contrats qu'au
moment de fabriquer leur famille. Aucun contrat générique de manipulation n'est
construit par anticipation.

## Contraintes techniques

- JavaScript moderne, sans dépendance externe ni compilation ;
- logique testable avec `node --test` sans navigateur ;
- génération déterministe et partageable par graine ;
- exactitude mathématique et cas limites testés ;
- absence de `formula_code`, `eval` et `Math.random()` dans V2 ;
- téléphone d'abord, vérification à 375 px ;
- cibles tactiles d'au moins 44 px.

## Périmètre technique de V2 : les dossiers surveillés

À ne pas confondre avec le périmètre immédiat (le DNB, plus haut) : celui-ci dit
*ce que* l'on construit, celui-là dit *où* le code a le droit de vivre.

Ces contraintes ne valent que si l'on sait où elles s'appliquent. La liste
suivante est la définition technique de V2, et elle est vérifiée à chaque
`npm run verifier` par `scripts/validate-automatismes-v2.mjs` :

- `automatismes-v2` — lecteur commun neuf, interactif et diaporama ;
- `packages/contrats/src` — contrats de question et de gabarit ;
- `packages/moteur-exercices/src` — générateur pseudo-aléatoire seedé et
  registre de générateurs ;
- `packages/automatismes/src` — futurs paquets de notions ; le dossier n'existe
  pas encore, il est déclaré d'avance pour naître déjà surveillé ;
- `packages/objets/src` — les objets visuels que les questions dessinent ;
- `packages/charte/src` — couleurs, typographie, espacements.

Y sont refusés : les identifiants historiques `dnb_*`, le mini-langage de calcul
d'origine, `Math.random()`, `eval`, `new Function`, et toute importation qui
remonte vers `auto/` ou `studio/`. Les dépendances sont à sens unique :
l'application et le studio consomment la fondation, la fondation ne les appelle
jamais.

Chaque fichier de production de ces six dossiers déclare également son statut
et sa source dans `PROVENANCE_FONDATION_V2`. Le validateur compare le registre
au disque dans les deux sens : un nouveau fichier oublié et une déclaration
pointant vers un fichier supprimé font tous deux échouer la CI. Cette exigence
rend la provenance explicite ; elle ne remplace ni l'audit du contenu ni la
validation pédagogique. Un fichier déclaré `herite_doctools` doit en plus
décrire concrètement ce qui doit être remplacé.

Restent hors périmètre `auto/`, `studio/`, `outils/` et `scripts/` : ils font
tourner ou documentent l'existant, et tombent avec lui.

Une seule dispense, nominative : `packages/objets/src/provenance.js` et son test
peuvent citer les identifiants historiques et le mini-langage d'origine, puisque
leur métier est de nommer la dette à remplacer. Toutes les autres règles
s'appliquent à eux comme aux autres.

## Mémoire et reprise du chantier

La mémoire d'une conversation n'est jamais la référence. À chaque reprise :

1. lire `AGENTS.md` ;
2. lire le présent document ;
3. lire `etat.md` et vérifier que son commit de référence correspond à GitHub ;
4. lire les dernières décisions ;
5. annoncer la prochaine action avant de modifier le dépôt ;
6. mettre à jour `etat.md` avant de terminer une étape ou une pull request.
