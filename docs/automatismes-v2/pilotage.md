# Pilotage d'Automatismes maths&go V2

**Document opérationnel de référence — mis à jour le 9 août 2026.**

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
elle qui dit ce qui doit exister et à quel moment la phase est terminée. Elle ne
fixe aucun ordre de fabrication. L'ordre de travail est une décision maths&go,
séparée des identifiants et versionnée dans
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

L'inventaire technique durable de l'ancien travail est tenu dans
[`inventaire-auto-studio.md`](inventaire-auto-studio.md). Avant d'ouvrir la
fabrication d'une notion, le chef de projet vérifie d'abord les fondations V2,
puis les composants techniques correspondants de cet inventaire. Cette étape
évite de refaire un objet acquis sans transformer l'archive en source de
questions.

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

Les identifiants canoniques V2 sont des noms descriptifs français stables, par
exemple `criteres-divisibilite`, `carres-entiers-0-a-12` ou
`fractions-simples-decimaux`. Les codes courts `NC-01`, `AL-04`, `PF-02`,
`GM-13`, `GE-12`, `DS-05` et `PI-01` sont des alias humains de pilotage. Ils ne
servent ni d'identifiant primaire dans les données, ni d'ordre de menu, ni de
preuve de correspondance avec une cible officielle.

La source de données canonique de cette taxonomie est
`docs/automatismes-v2/taxonomie-competences.json`. Les fiches en expliquent les
choix pédagogiques ; elles ne maintiennent pas une seconde table concurrente.

Les sept domaines disciplinaires V2 sont : nombres et calculs ; calcul littéral
et algèbre ; proportionnalité et fonctions ; grandeurs et mesures ; espace et
géométrie ; données, statistiques et probabilités ; pensée informatique. Les
jeux, recherches et explorations constituent une modalité pédagogique, pas un
domaine de classement des résultats. Les codes de pilotage sont désormais
`PF-01` à `PF-09` et `GM-01` à `GM-15`. Les anciens `PG-01` à `PG-24` restent
lisibles comme alias historiques selon la correspondance du manifeste.

## Cycle obligatoire d'un module visible

1. Lire les automatismes officiels concernés et leurs correspondances dans la
   carte, sans déduire un ordre de travail de leur position dans la liste.
2. Consulter l'ancienne banque uniquement pour inventorier les notions et les
   familles de situations.
3. Préparer une fiche pédagogique : savoir-faire, prérequis, limites, familles
   de valeurs, erreurs d'élèves, forme de réponse, aides et visuels nécessaires.
4. Obtenir la validation pédagogique de Gwenaël.
5. Construire les objets manquants, le générateur seedé et les tests.
6. Présenter des exemples, l'aide, la correction et les cas limites.
7. Obtenir la validation finale avant publication.

Un seul module visible est actif à la fois pendant sa fabrication et sa
validation. Ce module peut réunir plusieurs micro-notions proches, comme les
deux sens de « Fractions simples et décimaux ». Une séance publique peut ensuite
cibler un module validé ou en mélanger plusieurs conformément à D-039. Aucun
répertoire de contenu réel n'est préparé en masse.

## Modèle pédagogique commun

Chaque notion part du gabarit
[`gabarit-fiche-pedagogique.md`](gabarit-fiche-pedagogique.md). La progression
commune est :

1. **Je montre** — le cours explicite la méthode, une idée à la fois ;
2. **Nous faisons** — l'élève réalise les étapes avec un guidage visible ;
3. **Tu fais accompagné** — « Me guider » reste accessible sans conclure à sa
   place ;
4. **Tu fais seul** — l'étayage s'efface, sans changer artificiellement de
   difficulté ;
5. **Correction immédiate et explicite**, puis réactivation ultérieure.

Le cours, « Me guider » et la correction ont trois fonctions distinctes. Une
manipulation n'est ajoutée que si le geste rend un objet, une relation ou une
procédure mathématique réellement perceptible. Un clic décoratif ou une
manipulation qui mime la tâche sans aider à raisonner est écarté.

Cette trame est réutilisable, pas mécanique : chaque fiche explique ce que
signifient concrètement ses cinq temps pour la notion concernée et peut justifier
qu'un temps soit très court ou qu'aucune manipulation séparée ne soit utile.

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

## Classes, niveaux et paliers

Le parcours ne possède ni niveau de difficulté ni palier. Les micro-notions
décrivent des compétences atomiques et organisent le suivi, pas un classement
des élèves. Le module visible reste l'unité de chantier et de sélection dans
le menu. La variété vient des familles de questions, des valeurs, des erreurs
travaillées et de l'état de l'aide.

D-068 ajoute en revanche un **filtre de classe** `5e / 4e / 3e / DNB`. Ce
filtre indique si la série entière d'un module est adaptée au programme choisi ;
il ne change ni la difficulté d'une question ni la taxonomie. Chaque nouvelle
entrée du menu doit déclarer explicitement ses classes visibles. Un module qui
ne possède qu'un sous-ensemble compatible avec une classe reste masqué jusqu'à
la construction d'une recette de série réellement adaptée à cette classe.
Les huit modules publiés au 22 août 2026 sont tous compatibles avec les quatre
filtres au regard du programme officiel : l'égalité actuelle des listes est
donc attendue et ne neutralise pas le contrat de filtrage des futurs modules.

## Forme de réponse

Par défaut, c'est toujours l'élève qui saisit sa réponse. La première exception
validée concerne le choix de diviseurs proposés au clic dans `NC-01/F2`. Les
autres formes prévues par la fiche `NC-01` n'entrent dans les contrats qu'au
moment de fabriquer leur famille. Aucun contrat générique de manipulation n'est
construit par anticipation.

La capacité d'un champ ne se déduit jamais du seul ensemble des réponses
justes. Elle doit aussi permettre de fournir et de conserver les erreurs
d'élèves que la fiche prétend diagnostiquer. Une valeur fausse mais
syntaxiquement valide est validée, tracée et comptée fausse ; elle ne doit pas
être tronquée ou refusée silencieusement par le pavé.

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
3. lire `taxonomie-competences.json` et la fiche du module concerné ;
4. lire `etat.md` et vérifier que son commit de référence correspond à GitHub ;
5. lire les dernières décisions ;
6. lire l'inventaire `auto` / `studio` ;
7. annoncer la prochaine action avant de modifier le dépôt ;
8. mettre à jour `etat.md` avant de terminer une étape ou une pull request.
