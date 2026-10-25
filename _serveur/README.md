# `_serveur/` — serveur de suivi des élèves (maths&go)

Petit serveur PHP + MySQL qui garde la progression des élèves, pour que
Gwenaël puisse voir qui a travaillé. Hébergé chez OVH sur
`suivi.mathsgo.re`. Le site `mathsgo.re` (GitHub Pages) ne dépend pas de
lui : si ce serveur tombe, les applis fonctionnent comme avant.

## Pourquoi le dossier commence par un tiret bas

`.github/workflows/publier.yml` copie tout le dépôt vers GitHub Pages
**sauf** les noms commençant par `.` ou `_`. Sans ce tiret bas, le code
PHP serait téléchargeable en clair sur `mathsgo.re/serveur/…`, et les
pages HTML d'ici feraient échouer `npm run verifier` (le contrôle des
icônes balaie tous les `.html` du disque hors dossiers en `_`).

**Ne jamais renommer ce dossier en `serveur/`.**

## Ce que le serveur sait, et ce qu'il ne sait pas

Il range un texte JSON par (élève, appli) **sans le comprendre**. Toute
la logique de « Mon parcours » reste dans
`outils/calcul_mental/defi_tables_mon_parcours.js`, testée par
`node --test`. C'est ce qui permet :

- de réutiliser ce serveur tel quel pour Automatismes (colonne `appli`) ;
- de faire la **fusion** « on garde le plus avancé des deux » côté appli,
  là où le format est connu et testé ;
- de calculer le résumé du tableau de classe dans le navigateur du prof,
  en réutilisant le même fichier JS — une seule source de vérité.

## Données stockées

`classes` (propriétaire, libellé, applis proposées) · `eleves` (code de
6 caractères, prénom, initiale) · `progressions` (JSON, date) · `profs` (identifiant, mot de passe
haché, administrateur, compte actif, mot de passe temporaire) · `partages`
(classe, professeur, droit) · `sessions_prof` · `compteurs` (limitation de
débit) · `billets` (liens d'entrée à usage unique) · `directs`,
`directs_questions`, `directs_reponses` (séance en direct : **temporaires**,
vidées quand le professeur termine la séance et au plus tard une heure et
demie après son dernier geste — voir « La séance en direct ») ·
`modeles_evaluation` (les modèles d'évaluation des tables de chaque professeur :
des réglages, aucune donnée d'élève — voir « Les évaluations en classe »).

**Combien de temps ?** Les prénoms, les codes et les progressions d'une année
scolaire sont **supprimés au plus tard le 1er août** qui suit — après la fin des
cours (début juillet à La Réunion) et avant la rentrée suivante (mi-août). Il
n'en reste rien : pas de ligne de bilan, pas même le nom de la classe. Ce qui
rend cette suppression sereine, c'est la sauvegarde mensuelle chiffrée. Voir
[EXPLOITATION.md](EXPLOITATION.md).

Pas de nom de famille, pas de date de naissance, pas d'adresse mail
d'élève, pas de mot de passe d'élève.

## Arborescence

```
_serveur/
  public/            ← contenu à déposer dans le dossier « suivi » chez OVH
    index.php          page d'accueil des élèves : un code, les applis de sa classe
    prof/index.php     page « Ma classe » : classes, codes, tableau, impression, Mon compte
    prof/defi_tables_mon_parcours.js  COPIE du moteur de l'appli (voir « Le moteur »)
    prof/splat-parcours.js  COPIE du moteur de SPLAT! (voir « Le moteur »)
    api/parcours.php   API élève : lire/écrire la progression par code
    api/eleve.php      API élève : prénom, classe et applis à partir du code
    api/prof.php       API prof : connexion, classes, élèves, tableau, séance en direct
    direct.php         séance en direct, écran de l'élève
    prof/direct.php    séance en direct, écran du tableau (à projeter)
    prof/questionnaire.js  lecteur du questionnaire JSON du professeur (lot 2) — LE CONTRAT
    vendor/katex-0.16.47/  COPIE de assets/vendor/katex-0.16.47 (formules du tableau)
    api/direct.php     API élève de la séance en direct : l'état, et sa réponse ;
                       et de l'évaluation en classe (clé « evaluation »)
    lib/direct.php     séance en direct : types de réponse, purge, lectures, gestes
    lib/evaluation.php les évaluations en classe : modèles, ouverture, présences,
                       réponses, fenêtre, fermeture (lot E1, 15/10/2026)
    prof/defi_tables_core.js  COPIE du noyau de Défi tables : Ma classe refait le
                       tirage d'une évaluation et la corrige dans le navigateur
    lib/               bd, réponses/CORS, en-têtes de sécurité, codes, limitation,
                       sessions, catalogue d'applis, filtre des progressions
    lib/archives.php   fin d'année : année scolaire, suppression d'une classe
    config.exemple.php à recopier en config.php sur le serveur (JAMAIS commité)
    installer.php      création des tables + premier compte, à SUPPRIMER après
    migrer.php         mise à niveau d'une base déjà installée, à SUPPRIMER après
    secours.php        mot de passe administrateur perdu, à SUPPRIMER après
    sauvegarde.php     export chiffré de la base, à SUPPRIMER après
    menage.php         suppression de fin d'année, EN LIGNE DE COMMANDE seulement
    verifier.php       page de diagnostic en français
    VERSION            empreintes des fichiers déposés (généré)
    .htaccess
  sql/schema-mysql.sql (généré)
  outils/generer-sql.php
  outils/generer-version.php   fabrique public/VERSION
  outils/dechiffrer.php        repli pour relire une sauvegarde chiffrée
  tests/lancer.php
  EXPLOITATION.md    conservation, sauvegarde, restauration, secours, 2FA
```

**Les quatre fichiers qu'on dépose puis qu'on retire** — `installer.php`,
`migrer.php`, `secours.php`, `sauvegarde.php` — ne sont jamais en ligne en
temps normal : chacun ouvre, à qui connaît le `jeton_installation`, quelque
chose qu'on ne laisse pas ouvert (les tables, un mot de passe administrateur,
toute la base). `verifier.php` devient rouge tant que l'un d'eux traîne, et
`VERSION` ne les décrit pas.

## Les deux pages

- `https://suivi.mathsgo.re/` — page des élèves. Un champ de six caractères, puis
  la liste des applis proposées à sa classe. Chaque appli ouvre l'appli unique de
  mathsgo.re en lui passant un **billet d'entrée** (lot 3, 03/09/2026 :
  `…/defi_tables.html#b=<32 caractères>&ouvrir=parcours`), jamais le code —
  une adresse entre dans l'historique du navigateur. Le billet est délivré par
  `api/eleve.php` (`{code, billet: true}`), vaut deux minutes et ne sert
  qu'une fois ; l'appli l'échange contre le code (`{billet}`) et nettoie
  l'adresse (`lib/billets.php`, table `billets`). Aucune copie d'appli n'est
  faite ici. C'est bien cette adresse complète qu'il faut essayer quand on
  vérifie le suivi — une forme abrégée a longtemps caché que l'appli ne savait
  pas lire la vraie. « Voir sa fiche » dans Ma classe passe par un billet de
  lecture (`eleves.fiche`, `#b=…&vue=fiche`) qui ne rend jamais le code.
- `https://suivi.mathsgo.re/prof/` — page « Ma classe », protégée par mot de passe :
  créer une classe, générer N codes, saisir prénom + initiale, voir le tableau
  (tables acquises, mélange, Expert, dernière activité), trier, régénérer un code,
  supprimer, imprimer la liste code ↔ élève.
  Depuis le lot « splat-suivi-4 » (08/10/2026), une classe peut avoir plusieurs
  activités : le bloc **« Activités »** (propriétaire seulement) coche celles
  que les élèves trouvent dans leur espace (`classes.modifier` ; décocher
  retire la tuile et n'efface aucune progression). Sous le nom de la classe,
  une rangée d'onglets **« Défi tables | SPLAT! »** (toujours là depuis le lot
  « Ma classe : réglages », même avec une seule activité ; retenue le temps de
  l'onglet du navigateur) ; chaque activité a son tableau (un appel `tableau`
  par activité). Depuis le lot « Ma classe : réglages » (17/10/2026), ce qui
  règle la classe est dans l'onglet **« ⚙ Réglages »**, au bout de la rangée,
  propriétaire seulement : Activités (chaque appli et ses réglages dessous —
  les records sous Défi tables, les mondes sous SPLAT!), Partager cette classe,
  Nom de la classe (`classes.modifier` avec le seul `libelle`) et Supprimer la
  classe. Depuis le lot « Ma classe : élèves » (18/10/2026), les prénoms, les
  codes et les papiers sont dans l'onglet **« Élèves »**, avant « Réglages »
  (propriétaire et collègues en écriture ; un collègue « voir seulement » n'a
  ni l'onglet ni les codes) : les boutons Ajouter, Coller, Bandelettes et
  Feuille, puis la liste dans l'ordre et avec les numéros de la feuille
  prénom ↔ code, où se saisit le prénom ; le « ⋯ » de chaque élève : Imprimer
  sa bandelette (elle seule, avec son numéro), Nouveau code, Supprimer
  (propriétaire). Depuis le lot « Ma classe : tri et bandelette »
  (21/10/2026), la bandelette est d'une seule pièce (numéro, prénom, adresse,
  code, consigne — plus de souche à détacher) et le tri « Prénom » des
  tableaux suit l'ordre de la feuille. Les tableaux des applis n'ont plus aucun code et le prénom y
  est du texte ; leur « ⋯ » ne garde que « Revenir à… ». Une classe s'ouvre
  sur son tableau, jamais sur Élèves, sauf une classe vide ; « + Nouvelle
  classe » est une carte au bout de Mes classes. L'onglet SPLAT! : six pastilles de monde,
  étapes réussies (✨ pour les Bonus, à part), dernière activité, un
  « Détail » qui déplie les étapes monde par monde (réussie, réussie avec des
  réponses vues, en cours), et sa carte « Notre classe, ensemble ».
  Depuis le lot « splat-suivi-5 » (08/10/2026), sous SPLAT!, le propriétaire
  choisit les **mondes ouverts à la classe** (un bouton par monde ; tous par
  défaut). Rangés dans `classes.reglages` (JSON, `{"splat":{"mondes":[1,2]}}` =
  les mondes OUVERTS ; rien d'écrit quand ils le sont tous), écrits par
  `classes.modifier` (lecture stricte, `lib/applis.php`), rendus à « Ma classe »
  (`classes.liste`, `tableau`) et à l'élève (`api/eleve.php`, par son code et à
  l'échange du billet). Un monde fermé reste sur la carte de l'élève, grisé
  avec un cadenas ; les comptes de la tuile et de « Ma classe » ne portent que
  sur les mondes ouverts. Ça guide la classe, ça ne verrouille rien : sans code
  (mathsgo.re, QR des livrets), tout reste ouvert. La colonne arrive par
  `migrer.php` ; tant qu'elle manque, tout se lit « tous ouverts » et seul le
  choix des mondes répond « mise à niveau » (ligne « Mondes ouverts par
  classe » de `verifier.php`).
  Depuis le lot « Qui voit quoi » (22/10/2026), le propriétaire peut ouvrir à
  **un seul élève** une activité ou des mondes en plus de sa classe (« Ce que
  voit Léa… », lot 3 de la page) : ce qu'un élève voit = ce que voit sa classe
  **+** ce qu'on lui a donné, on n'enlève jamais ce que la classe a. Rangé dans
  `eleves.ajouts` (JSON : `{"coffres":{}}` = Coffres entière en plus,
  `{"splat":{"mondes":[3]}}` = le monde 3 en plus ; un ajout reste rangé même
  quand la classe finit par avoir la même chose), écrit par `eleves.acces`
  `{eleve_id, ajouts}` (propriétaire, lecture stricte, remplace la colonne
  entière, journalisé), rendu au professeur par `tableau` (par élève :
  `ajouts`, le rangé, et `acces`, le calculé `{applis, reglages}`, pour tous
  les droits) et à l'élève par `api/eleve.php` sous les noms qui existent
  déjà, `applis` et `reglages` — l'espace élève et les applis n'ont rien à
  changer. Une seule règle, `acces_de_l_eleve()` dans `lib/applis.php` ;
  `api/parcours.php` n'en sait rien (ouvrir guide, ça ne verrouille pas). La
  colonne arrive par `migrer.php` ; avant, tout se lit « rien en plus ».

### La séance en direct (lot 1 « question éclair », 07/10/2026)

Le professeur ouvre une séance pour **une** classe depuis « Ma classe » (bouton
« Séance en direct » → `prof/direct.php`, la page à projeter). Il pose sa
question à l'oral ou au tableau ; les élèves, entrés dans leur espace avec leur
code, voient apparaître la tuile « Séance en direct » et répondent A, B, C… sur
`direct.php`. Au tableau : pendant la question, **un compteur** (« 24 / 27 ont
répondu ») ; après « Dévoiler », **des barres, sans aucun nom**. Le professeur
peut cliquer sur une barre pour désigner la bonne réponse. À la fin,
« Terminer la séance » propose de télécharger le fichier (une ligne par élève,
une colonne par question, CSV lisible par Excel) — fabriqué dans son
navigateur — puis efface tout.

**Pour l'administrateur seul, pour l'instant** (lot 5e, 25/10/2026, décision
de Gwenaël). Tant que `DIRECT_RESERVE_A_L_ADMINISTRATEUR` vaut `true`
(`lib/direct.php`), `api/prof.php` refuse toute action `direct.*` à un autre
compte (403, « La séance en direct n’est pas encore ouverte aux collègues. »,
refus journalisé), avant même de lire la classe ; « Ma classe » cache le
bouton et la pastille « ● En direct ». Les **évaluations** restent ouvertes à
tous. Pour rouvrir la séance aux collègues : `false` à cette constante (et à
`DIRECT_RESERVE_ATTENDUE` dans `tests/lancer.php`), rien d'autre.

**Ce que le serveur garde, et combien de temps.** Trois tables temporaires :
la séance, ses questions (un type et un réglage pris dans une liste fermée —
jamais d'énoncé), et une réponse courte par élève et par question, dont la
forme est vérifiée par son type. Tout part à « Terminer », et de toute façon
**vingt minutes après que l'écran du tableau a cessé d'appeler le serveur**
(`VEILLE_DIRECT` : tableau quitté, onglet fermé, ordinateur en veille ; un
onglet caché continue d'appeler une fois par minute), et au plus tard **trois
heures après l'ouverture** (`PLAFOND_DIRECT`). Les élèves ne prolongent rien :
la purge est jouée par chaque interrogation d'un élève, par chaque appel du
tableau, par l'ouverture de « Mes classes » et par `menage.php`. Ces tables
n'entrent dans la sauvegarde qu'**en structure**. Supprimer la classe, le
compte ou l'élève emporte la séance et les réponses.

**Qui reçoit quoi.** L'élève : l'état de la séance, le type de question, sa
propre réponse — jamais la répartition ni la bonne réponse. Le tableau : un
compteur, puis la répartition — jamais un nom. Le fichier (prénoms + réponses) :
le professeur qui a la classe **en écriture**, et l'action est journalisée. Un
collègue en lecture seule ne voit ni le bouton ni la séance.

**Le rythme.** Les deux pages interrogent le serveur en boucle (2,5 s pour un
élève, 1,5 s pour le tableau ; 6 s pour l'espace élève qui guette l'ouverture
d'une séance). Ces durées sont **dites par le serveur** dans chaque réponse
(`rythme`, constantes `RYTHME_DIRECT_*` de `lib/direct.php`) : elles se règlent
sans redéposer les pages. Une interrogation ne fait que lire — aucun compteur
n'est écrit ; seules les réponses passent par le limiteur (120 par code et par
cinq minutes).

**Pour faire évoluer** (c'est écrit pour ça) :

- un nouveau **type de réponse** (un entier pour les tables, une fraction en
  deux cases, vrai/faux) = une entrée dans `TYPES_DIRECT` avec ses deux
  contrôles (`reglage_direct()`, `reponse_direct()`), et son dessin dans la
  table `RENDUS` des deux pages. Ni le schéma ni l'API ne changent : `reponse`
  est déjà un texte court, `reglage` un petit JSON ;
- un nouveau **mode de séance** (évaluation où chacun avance à son rythme, QCM
  préparé à l'avance) = une valeur de plus dans `MODES_DIRECT` ; la colonne
  `directs.mode` existe déjà.

### Le questionnaire au tableau (lot 2, 15/10/2026)

Le professeur prépare un **questionnaire** : un fichier JSON chez lui (format
décrit dans `_serveur/QUESTIONNAIRE.md`, exemple dans
`_serveur/questionnaires/exemple-questionnaire.json`). Il l'ouvre dans l'écran du
tableau (bouton ou glisser-déposer), le vérifie avec « Aperçu » quand aucune
séance n'est ouverte, puis le projette question par question : un clic affiche
l'énoncé (formules KaTeX, figure éventuelle) ET ouvre les réponses ; au
dévoilement, chaque carte-réponse se remplit de sa barre et la bonne passe au
vert toute seule. L'élève n'a que ses boutons A-F.

**Le questionnaire ne va jamais au serveur.** Pour chaque question, le tableau
envoie ce qu'une question éclair envoie déjà (type, nombre de réponses) et,
s'il y en a un, la durée du **chrono** ; la **bonne réponse** n'arrive qu'avec
« Dévoiler » (`direct.devoiler` accepte `bonne`), jamais avant. Le lien
« numéro du serveur → question du fichier » vit dans l'onglet
(sessionStorage), avec le texte du fichier : une page rechargée reprend où
elle en était.

**Le chrono est tenu par le serveur.** `reglage.duree` (5 à 600 s) ; le serveur
pose lui-même `reglage.fin` quand il pose la question, refuse toute réponse
après, et la montre close à l'élève (« Regarde le tableau »). Le tableau
affiche l'anneau et dévoile à zéro.

**La présence.** La première fois qu'un élève interroge une séance ouverte, une
ligne le note dans `directs_reponses` au **numéro 0** (une écriture par élève et
par séance, jamais une par passage). Le tableau compte « répondu / connectés »
et peut dévoiler tout seul quand tous les connectés ont répondu (case au
tableau, gardée dans le navigateur du professeur). Le numéro 0 n'entre ni dans
le fichier de fin ni dans les comptes de réponses.

**Ce qui se branchera dessus** : Défi tables (lot 3) et Automatismes produiront
des questionnaires de la même forme (identifiant stable, type de réponse, bonne
réponse, réglage) ; `prof/questionnaire.js` est le seul endroit qui les lit.

### Les évaluations en classe (lot E1, 15/10/2026)

Une évaluation des tables, **en classe seulement**, faite par chaque élève dans
Défi tables, à son rythme, **une seule fois**. Le professeur prépare des
**modèles** dans « Ma classe » (carte « 📝 Évaluations » : tables, types de
question — produit, nombre manquant, division —, nombre de questions, chrono
par question / en tout / sans, calculs exclus ou imposés, tirage), attachés à
son compte (`modeles_evaluation`, 30 au plus, sauvegardés). Il en **ouvre** un
pour une classe pour 30 min, 1 h ou 2 h ; à l'échéance elle se ferme toute
seule (les réponses ne prolongent rien), ou il la **ferme** avant.

**La plomberie est celle de la séance en direct** : une évaluation ouverte est
une ligne de `directs` au mode `evaluation` (donc une seule séance par classe :
pas de question éclair pendant une évaluation, ni l'inverse), son réglage figé
dans `directs.reglage` (le modèle, le nom, la **graine de l'évaluation**, la
durée, la fin) ; la présence d'un élève au numéro 0 de `directs_reponses`
(« graine|début|fini »), ses réponses une ligne par question (« 56|43 » : la
valeur tapée, vide pour « pas de réponse », et les dixièmes de seconde).

**Le serveur ne connaît ni les questions ni la correction.** Il tire les
graines (une par évaluation, une par élève à « Je commence », jamais reçues
d'une page), l'appli tire la série avec `genererEvaluationDeClasse` du noyau de
Défi tables, et « Ma classe » refait exactement le même tirage avec
`prof/defi_tables_core.js` (copie octet pour octet, vérifiée par un test) pour
corriger **dans le navigateur du professeur**. Aucune note n'entre jamais en
base. Le fichier (CSV : note sur 20 au demi-point, score, temps total, heure de
début, détail des ratés) est fabriqué dans la page, le serveur n'en garde rien.

**Ce que le serveur tient** : une graine par élève, une fois ; une réponse par
numéro, la suivante seulement, la première arrivée reste (clé unique) ; la
forme (type `entier`, trois chiffres) ; la **fenêtre** de l'élève (début +
N × temps par question, ou + temps global, + 10 s) ; plus rien après la
fermeture ni après « fini » (vingt réponses, ou « J'ai fini ») ; 120 gestes
par code et par cinq minutes. Après la fermeture, les réponses attendent le
fichier **vingt heures** (`expire_le` = fin + 20 h), puis la purge de la séance
en direct les emporte ; « Terminer » efface tout de suite. L'élève supprimé,
la classe supprimée, le compte supprimé (ses modèles) emportent ce qui est à
eux.

**Qui.** Propriétaire et collègues en **écriture** ouvrent, ferment, reçoivent
le fichier (des prénoms à côté de réponses) ; chacun ouvre avec **ses**
modèles. L'élève ne reçoit jamais un compteur ni la copie d'un autre ; « Ma
classe » reçoit en boucle (`evaluation.etat`, toutes les 3 s) les compteurs et
— lot E2 — la liste des élèves avec où en est chacun (pas commencé, question
n, fini, arrêté), sans code, graine ni réponse ; après la fermeture, la
**répartition** à 20 / 16–19,5 / 10–15,5 / moins de 10, projetable (« Plein
écran », sans prénom).

**Faire repasser** (lot E2, 15/10/2026). Un élève bloqué — un camarade a passé
l'évaluation avec son code, « J'ai fini » cliqué trop tôt — repart de zéro :
`evaluation.repasser {eleve_id}` (écriture, évaluation ouverte seulement,
élève de la classe seulement) efface sa présence, ses réponses et son drapeau
« fini », monte la révision de la séance, et journalise sur l'élève. À son
prochain « Je commence », le serveur lui tire une autre graine : un nouveau
tirage, pas la copie de celui que le camarade a vu.

### Le moteur

Le résumé de progression du tableau est calculé **dans le navigateur** avec
`defi_tables_mon_parcours.js` : le serveur n'ouvre jamais les paquets qu'il
range, et il n'existe qu'une seule définition du parcours.

Depuis le lot S2 (30/08/2026), la page ne charge plus ce fichier depuis
mathsgo.re : sa politique de contenu n'accepte aucun script d'un autre domaine
(un script venu d'ailleurs s'exécuterait avec les droits de la session du
professeur). Une **copie octet pour octet** vit dans
`_serveur/public/prof/defi_tables_mon_parcours.js`, servie par
suivi.mathsgo.re. La source reste l'appli ; le test
`tests/suivi-moteur-copie.test.mjs` du dépôt échoue dès que les deux fichiers
diffèrent. **Règle : tout lot qui touche
`outils/calcul_mental/defi_tables_mon_parcours.js` recopie le fichier dans
`_serveur/public/prof/` (`cp outils/calcul_mental/defi_tables_mon_parcours.js
_serveur/public/prof/`) et le met dans son dossier à déposer par FTP.** Pas de
`?v=` à penser pour cette copie : la page calcule la version dans l'adresse à
partir de l'empreinte du fichier, un nouveau dépôt n'est jamais masqué par le
cache.

Même règle, depuis le lot « splat-suivi-3 » (07/10/2026), pour le moteur de
SPLAT! : `_serveur/public/prof/splat-parcours.js` est la copie octet pour octet
de `assets/js/splat-parcours.js` (même test). La tuile SPLAT! de l'espace élève
le charge pour dessiner les mondes ; « Ma classe » le charge à la première
ouverture de l'onglet SPLAT! d'une classe (lot « splat-suivi-4 »). **Tout lot qui touche `assets/js/splat-parcours.js` recopie le fichier
(`cp assets/js/splat-parcours.js _serveur/public/prof/`) et le met dans son
dossier à déposer.** Le moteur porte la carte des mondes réduite (numéro et
monde de chaque étape, sans les titres) : retoucher un titre dans
`assets/js/splat-etapes.js` ne demande aucun dépôt ici.

### Chacun ses classes

Une classe appartient au professeur qui l'a créée (`classes.prof_id`). Personne
d'autre ne la voit — une classe hors de portée est déclarée « introuvable »,
son nom même ne sort pas du serveur.

Le propriétaire peut la **partager** avec un collègue (table `partages`) :

- **lecture** — il voit le tableau et les progressions, **sans les codes**
  (`api/prof.php` répond `'code' => null`) et sans rien pouvoir changer. Un code
  ouvre l'appli comme l'élève et permet d'écrire à sa place : le prêter, ce
  serait déjà de l'écriture ;
- **écriture** — il voit les codes, et il peut ajouter des élèves, saisir les
  prénoms, donner un nouveau code et restaurer la version précédente d'une
  progression (dépanner un élève sans déranger le propriétaire).

**Réservé au propriétaire :** supprimer la classe, supprimer un élève, renommer
la classe (ou changer ses applis), et partager ou retirer un partage. Tout ce
qui efface pour de bon, et tout ce qui change la classe elle-même.

Cette répartition est écrite **à un seul endroit**, la table `DROIT_PAR_ACTION`
en tête de `api/prof.php` (lot 11, 05/09/2026) ; les actions de comptes
(`profs.*`) sont dans `ACTIONS_ADMIN` juste en dessous. Chaque case a son test
dans `tests/lancer.php` (« lot 11 — matrice … ») : déplacer un droit sans le
vouloir rend un test rouge. Une action de classe qui ne figure pas dans la
table est refusée (400), jamais devinée.

Pour les actions sur un élève, c'est la classe **de l'élève** qui décide, jamais
le `classe_id` envoyé par le navigateur.

**Quotas** (lot 11) : 40 classes par professeur, 200 élèves par classe, 60
élèves par lot de création. Très au-dessus d'un usage réel — ils n'arrêtent
qu'un emballement (session volée, clic resté enfoncé) qui remplirait les 250 Mo
de l'hébergement. Le compte des élèves est fait **dans la même transaction** que
les créations : deux demandes simultanées ne franchissent pas le plafond, et un
lot interrompu ne crée aucun élève.

Le premier compte créé par `installer.php` est **administrateur** : lui seul
voit l'écran « Professeurs » et peut ouvrir un compte à un collègue. Un nouveau
compte ne voit rien tant qu'aucune classe ne lui a été partagée.

### Les comptes (lot S2)

- **Ajouter un professeur** (administrateur) : seulement un identifiant. Le
  serveur tire un mot de passe temporaire lisible à l'oral (`xxxx-xxxx-xxxx`,
  sans l, o, i, 0, 1), l'affiche **une seule fois** et pose `mdp_temporaire = 1`.
  À sa première connexion, le collègue ne peut rien faire d'autre que choisir
  son mot de passe : la page l'impose, et l'API refuse (403) toute autre action.
  L'administrateur ne connaît donc jamais le vrai mot de passe de personne.
- **Mon compte** : chaque professeur change son mot de passe (ancien + nouveau,
  différent de l'ancien). Les **autres** sessions du compte sont fermées, celle
  qui fait le changement reste ouverte.
- **Règles du mot de passe** (`motdepasse_refuse()` dans `lib/auth.php`, mêmes
  règles pour l'installateur) : **12 à 72 caractères**, et c'est tout —
  pas de majuscule ni de symbole imposés (recommandation ANSSI / NIST : la
  longueur protège plus que la composition, et le ralentissement des essais
  rend la devinette en ligne impossible). Le maximum n'est pas un choix de
  confort : **bcrypt ne lit que les 72 premiers octets** et jette le reste sans
  rien dire, si bien que deux phrases identiques sur 72 octets ouvriraient le
  même compte (lot serveur B, M-03). La longueur est comptée en **octets**, pas
  en caractères — un « é » en vaut deux, un émoji quatre —, côté serveur comme
  dans les deux formulaires de la page prof : un `maxlength` compte des
  caractères, il ne suffit pas. Deux refus de bon sens en plus : rien que des
  chiffres (date, téléphone), et l'identifiant dedans.
- **Nouveau mot de passe** (administrateur, sur un autre compte) : même
  mécanique que la création — temporaire affiché une fois, sessions du compte
  fermées, changement imposé à la connexion suivante.
- **Désactiver / Réactiver** (administrateur, sur un autre compte) : un compte
  désactivé ne se connecte plus, avec **le même refus** qu'un mauvais mot de
  passe (rien ne dit de dehors qu'il existe) ; ses sessions sont fermées ; ses
  classes, ses élèves et leurs progressions restent en base ; il sort de
  l'annuaire de partage. Réactiver rend tout.
- **Supprimer** (administrateur, sur un autre compte) : le compte, ses sessions
  et les partages qu'il a reçus disparaissent. S'il **possède des classes**, le
  serveur refuse (409) sans `avec_classes: true` ; la page demande alors une
  confirmation qui dit le nombre de classes et d'élèves, et tout part avec
  (classes, codes, progressions, partages, compteurs), en une transaction. Pour
  garder ses classes, désactiver suffit.
- On ne se réinitialise, ne se désactive ni ne se supprime soi-même :
  l'administrateur unique se retrouverait dehors sans personne pour le faire
  rentrer.

### Mettre à niveau une base déjà installée

Déposer `migrer.php` à côté de `index.php`, ouvrir
`https://suivi.mathsgo.re/migrer.php`, donner le `jeton_installation` de
`config.php`, **puis supprimer le fichier**. La page ajoute ce qui manque :
colonne propriétaire, colonne administrateur et table `partages` (30/08),
révision et version précédente des progressions, colonnes `actif` et
`mdp_temporaire` des comptes (lot A2). Elle ne touche ni aux élèves, ni aux
codes, ni aux progressions, et peut être relancée sans risque.

## Points d'entrée

| Méthode | URL | Effet |
|---|---|---|
| POST | `/api/parcours.php` `{code, appli, lire: true}` | lit la progression, avec sa `revision` |
| POST | `/api/parcours.php` `{code, appli, parcours, base_revision}` | l'enregistre si `base_revision` est la révision en base ; sinon **409** avec l'état actuel, que l'appli fusionne avant de renvoyer. Le serveur ne garde que ce que `lib/applis.php` déclare (`lib/progression.php`) : jamais un prénom ni un texte libre. La version précédente est conservée (`donnees_avant`), et l'état de fin de journée est rangé dans `versions` (une ligne par jour, sept jours) |
| POST | `/api/eleve.php` `{code}` | prénom, classe, `applis` et `reglages` de l'élève — sa classe plus ce qu'on lui a ouvert en plus (page d'accueil) |
| POST | `/api/direct.php` `{code}` | la séance en direct de la classe de l'élève, ou `direct: null` ; avec `{code, numero, reponse}`, range sa réponse tant que la question est ouverte (`enregistree: true/false`) |
| POST | `/api/direct.php` `{code}` (évaluation en classe) | si une évaluation est ouverte pour sa classe, `direct: null` et `evaluation: {etat, nom, modele, commence, fini, close, suivant, graines, reponses, ecoule}` ; `{code, commencer: true}` tire sa graine et pose son début (une fois) ; `{code, numero, reponse, dixiemes}` range sa réponse à la question suivante (`enregistree`) ; `{code, finir: true}` |
| POST | `/api/prof.php` `{action: "evaluation.…"}` | `evaluation.modeles`, `evaluation.enregistrer_modele` `{id, nom, reglage}`, `evaluation.supprimer_modele` `{id}` (les modèles du compte) ; avec `classe_id`, au droit **écriture** : `evaluation.ouvrir` `{modele_id, duree}`, `evaluation.etat` (en boucle), `evaluation.fermer`, `evaluation.fichier` (graines, débuts et réponses élève par élève), `evaluation.repasser` `{eleve_id}` (lot E2 : efface le passage d'un élève de l'évaluation ouverte, nouveau tirage à son prochain « Je commence » ; journalisé sur l'élève), `evaluation.terminer` (efface tout) |
| POST | `/api/prof.php` `{action: "direct.…", classe_id}` | `direct.etat` (interrogé en boucle par le tableau), `direct.ouvrir`, `direct.question` `{type, reglage}`, `direct.devoiler`, `direct.bonne` `{bonne}`, `direct.fichier` (questions + réponses élève par élève), `direct.terminer` (efface tout) — toutes au droit **écriture** |
| POST | `/api/prof.php` `{action, …}` | `connexion` (répond aussi `mdp_temporaire`), `deconnexion`, `moi`, `profs.motdepasse` `{ancien, nouveau}`, `profs.annuaire`, `profs.liste/ajouter/reinitialiser/desactiver/reactiver/supprimer` (administrateur ; `ajouter` et `reinitialiser` renvoient le temporaire ; `supprimer` veut `avec_classes: true` si le compte possède des classes), `classes.liste/creer/modifier/supprimer/supprimer_echues`, `partages.liste/ajouter/supprimer`, `eleves.ajouter/nommer/regenerer/restaurer/supprimer/acces` (`restaurer` accepte `jour: "AAAA-MM-JJ"` pour revenir à la fin d'une journée gardée ; `acces` `{eleve_id, ajouts}` remplace ce que l'élève a en plus de sa classe, propriétaire seulement, et répond `{ajouts, acces}`), `tableau` (par élève : progression, journées gardées, record, `ajouts` et `acces`) |

`classes.liste` **ne supprime rien** (changé le 06/09/2026 : ouvrir « Ma
classe » effaçait les classes de l'année écoulée, sans un mot et sans retour).
Elle rend, en plus des classes, `echues` — celles de l'année écoulée qui n'ont
rien enregistré depuis trois semaines —, `annee_courante`, `preavis_fin_annee`
et `purge_le`. Le professeur les supprime lui-même par
`classes.supprimer_echues` `{classes: [id, …]}`, qui revérifie chaque
identifiant côté serveur (propriétaire, année écoulée, trois semaines sans
activité) et supprime tout ou rien. La suppression AUTOMATIQUE, elle, reste
chez `menage.php` seul, la **tâche planifiée OVH en place depuis le
06/09/2026** (2 août et 2 septembre à 3 h 08) : c'est elle qui tient la
promesse du 1er août, même si personne n'ouvre Ma classe de tout l'été. À
l'ouverture de « Ma classe », le professeur est **interrogé**, jamais surpris. `classes.supprimer`, `classes.supprimer_echues` et le ménage
passent par **la même fonction** (`lib/archives.php`, `supprimer_classe()`) :
deux codes qui effacent les mêmes tables, ce serait deux occasions d'en oublier
une.

L'année scolaire pivote au **1er juillet** (et non au 1er août) : une classe
préparée pendant les vacances appartient à l'année qui vient. L'activité d'une
classe, c'est le plus récent des trois : dernier enregistrement d'un élève,
dernière création d'élève, création de la classe.

## Sécurité

- Toutes les requêtes SQL sont préparées (aucune concaténation).
- Mot de passe prof haché (`password_hash`), jeton de session stocké haché,
  comparaison à temps constant à la connexion. **La session vit 4 h côté
  serveur** (`DUREE_SESSION_HEURES`, lot 7 : une demi-journée de collège, pas
  une journée entière), et la page « Ma classe » se déconnecte d'elle-même
  après **30 minutes sans un geste**. Depuis le lot serveur B, l'instant du
  dernier geste est rangé dans le `sessionStorage` de l'onglet
  (`mathsgo-suivi-prof-dernier-geste`) : le verrou **survit au rechargement**
  — avant, un F5 le remettait à zéro et rendait « Mes classes » à qui trouvait
  l'onglet, pendant les quatre heures de la session.
- CORS limité à `https://mathsgo.re` et `https://suivi.mathsgo.re`.
- **Le code élève et le jeton prof ne voyagent jamais dans une adresse** :
  les API élève n'acceptent que POST (405 sinon), le jeton passe par
  l'en-tête `Authorization` ou le corps. Une adresse s'inscrit en clair dans
  les journaux de l'hébergeur, un corps non.
- Progression plafonnée à 40 ko ; 300 requêtes / 5 min par code. Par adresse
  IP, seuls les **échecs** (codes inconnus) sont comptés — 60 / 5 min — pour
  qu'un collège entier derrière une seule adresse ne soit jamais freiné, et
  qu'une énumération de codes le soit dès le 61ᵉ essai (y compris sur les bons
  codes, sinon la réponse trahirait lesquels existent).
- **Connexion du professeur, deux seuils qui ne font pas la même chose**
  (`lib/limite.php`, lot serveur B) : **60 échecs par adresse pendant les
  10 min qui suivent le premier** refusent net (429) — c'est ce seuil qui borne
  la dépense du serveur, et il vise une machine ; **12 échecs par identifiant
  pendant les 10 min qui suivent le premier** ne refusent rien, ils
  **ralentissent** chaque tentative de 1,5 s et laissent passer le bon mot de
  passe. Ils refusaient jusqu'au 06/09/2026, et treize mauvais mots
  de passe tapés par n'importe qui, depuis n'importe où, fermaient le compte
  visé pendant dix minutes — au bon mot de passe compris (constat 3 de l'audit
  du 05/09). Un seuil qui protège un compte ne doit pas être l'outil le plus
  simple pour l'éteindre. À 1,5 s l'essai, une devinette en ligne contre douze
  caractères au minimum n'aboutit pas ; et le coût reste borné, puisqu'une
  adresse qui dépasse ses 60 échecs est refusée **sans dormir**.
- La table `compteurs` ne contient ni adresse IP ni code en clair (clés
  hachées avec un secret), l'incrément tient en une instruction (UPSERT), et
  les fenêtres fermées sont effacées à chaque appel : aucune adresse n'y
  survit plus de cinq minutes. **Une fenêtre est ouverte par la première
  tentative comptée** et court à partir d'elle (lot limiteur, 07/09/2026).
  Elle était auparavant alignée sur l'horloge — des tranches communes à tout le
  monde, qui remettaient le compteur à zéro à heure fixe. Comme ces frontières
  se calculent de l'extérieur, il suffisait d'y coller sa rafale pour en
  obtenir deux : douze essais juste avant, douze juste après, sans un seul
  refus. Chaque frein laissait passer le double de ce qu'il annonçait. **Ce secret n'est pas le mot de passe
  d'installation** (lot 11) : c'est `secret` de `config.php` s'il est
  renseigné — le mieux —, sinon une valeur **dérivée** de `jeton_installation`
  par HMAC avec une étiquette d'usage. Connaître l'un ne donne pas l'autre.
  `verifier.php` dit lequel des deux cas s'applique.
- **En IPv6, le compteur par adresse regroupe le bloc `/64`** (lot 11) : un
  abonné reçoit le bloc entier et en change à volonté ; compter l'adresse
  exacte revenait à offrir un compteur neuf à chaque essai.
- `verifier.php` ne montre rien sans le `jeton_installation`, et **douze
  mauvais essais par adresse** ferment la porte pour les dix minutes qui
  suivent le premier (lot 11) — seuls les échecs comptent, vérifier vingt fois de suite
  avec le bon mot de passe ne gêne personne. Aucune page n'affiche d'erreur PHP
  (`display_errors` forcé à 0 dans `lib/bd.php`).
- **PHP n'annonce plus sa version, sur AUCUNE réponse** :
  `header_remove('X-Powered-By')` dans `lib/entetes.php` (lot 11) **et dans
  `menage.php`** (lot serveur B, M-04), qui répond 404 avant tout `require` et
  était donc la dernière réponse à annoncer « PHP/8.2.31 ». `expose_php = Off`
  n'était pas une option ici : ce réglage est de niveau système, un `.user.ini`
  déposé dans le dossier ne le change pas.
- **Ce qui ne doit pas sortir par HTTP est refusé par le `.htaccess`** :
  `<FilesMatch "^config">` (lot serveur B, constat 6 — l'ancien
  `<Files "config.php">` ne couvrait que ce nom exact et laissait sortir un
  `config.php.bak`, un `config.old` ou un `config.php.txt`, avec le mot de
  passe MySQL dedans) ; `<Files "menage.php">` (Apache répond 403 sans même
  appeler PHP ; la tâche planifiée passe par la ligne de commande, elle n'est
  pas gênée) ; `VERSION`, un éventuel `.user.ini`, et tout `.md`, `.sql`,
  `.log` ou `.exemple.php`.
- **Les freins de `secours.php` et `sauvegarde.php` comptent le bloc `/64`**
  (lot serveur B, M-02) comme le reste du limiteur depuis le lot 11 : compter
  l'adresse IPv6 exacte revenait à offrir dix essais neufs à chaque requête.
- **Rien de ce que le client envoie n'est pris pour argent comptant** (lot 11) :
  `appli` et `jeton` sont vérifiés `is_string` (un tableau donnait la bonne
  réponse mais salissait le journal du serveur) ; un prénom est débarrassé des
  caractères de commande, des caractères invisibles et de `<` `>` **à
  l'entrée**, en plus de l'encodage à l'affichage ; une « date » de progression
  doit être une vraie date (`checkdate`), plus seulement dix chiffres bien
  placés ; la réponse de `api/eleve.php` ne publie plus la description du filtre
  de progression (`cles`, `mots`, `motifs`), seulement ce que la page affiche.
- Le refus de connexion prend le même temps qu'un identifiant existe ou non
  (hachage de remplacement bcrypt réel, coût 10, comme les comptes).
- `installer.php` exige un jeton présent dans `config.php` et se
  verrouille dès qu'un compte prof existe. Depuis le lot 11, il ne recopie plus
  le message brut d'une exception dans la page (une erreur PDO cite l'hôte, la
  base et l'utilisateur) : le détail va au journal de l'hébergement.
- **Quotas** (lot 11) : 40 classes par professeur, 200 élèves par classe. Le
  compte est fait dans la même transaction que les créations — deux demandes
  simultanées ne franchissent pas le plafond, et un lot de codes interrompu ne
  crée aucun élève.
- **Qui a le droit de faire quoi est écrit à un seul endroit** (lot 11) :
  `DROIT_PAR_ACTION` et `ACTIONS_ADMIN` en tête de `api/prof.php`, avec un test
  par case. Voir « Chacun ses classes » plus haut.
- Aucun message d'erreur technique n'est renvoyé au navigateur.
- **En-têtes de sécurité** (`lib/entetes.php`, envoyés par PHP sur chaque
  réponse, pages et API — le `.htaccess` pose les mêmes sur le moteur JS **et
  sur lui seul** : chez OVH, une directive `Header` posée sur tout le dossier
  s'ajoute à ceux de PHP au lieu de les remplacer, constaté le 30/08) :
  `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  `Strict-Transport-Security: max-age=31536000`. Les pages HTML ajoutent une
  **Content-Security-Policy avec un nonce par requête** : `default-src 'self';
  script-src 'self' 'nonce-…'; style-src 'self' 'unsafe-inline'; img-src 'self'
  https://mathsgo.re data:; connect-src 'self'; font-src 'self'; object-src
  'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`. Chaque
  `<script>` en ligne porte le nonce ; aucun attribut `on…=` ; aucun script
  d'un autre domaine. Un contenu injecté dans la page ne s'exécute pas.
- `base_revision` est **obligatoire** à l'écriture (400 sans elle) : un client
  qui ne dit pas ce qu'il a lu n'écrase rien. La première écriture exige la
  révision 0 (lot 6) : annoncer une révision que le serveur n'a pas est un
  409 avec l'état vide, jamais une création.
- La restauration d'une version précédente (« Ma classe ») verrouille la ligne
  comme l'écriture de l'élève et n'écrit que si la révision lue est encore
  celle en base (lot 6) : un clic du professeur pendant que l'élève enregistre
  ne réutilise jamais un numéro de révision, rien ne se perd en silence.
- **Historique** (lot serveur A) : le serveur garde **une version par jour,
  sept jours**, à l'heure de La Réunion — la ligne d'un jour est l'état à la
  FIN de ce jour-là —, **plus** la version d'avant le dernier enregistrement
  (`progressions.donnees_avant`), la seule utile dans l'heure qui suit un
  accident. « Revenir à… », dans Ma classe, propose les deux.
- **Une restauration gagne contre l'appareil de l'élève** (lot serveur B, défaut
  vu en production le 06/09/2026) : la version restaurée est réécrite avec une
  `epoque` strictement supérieure aux deux états en présence
  (`version_avec_epoque_relevee()`, `lib/progression.php`). La fusion du moteur
  ne donne raison à un état en bloc que si son époque est plus haute ; à époque
  égale elle ADDITIONNE, si bien qu'un appareil resté ouvert sur l'état abîmé
  rendait les dégâts à la synchronisation suivante et défaisait la restauration.
  Le moteur, lui, n'a pas changé — et le prénom reste celui de l'appareil.
- **Journal des actions du professeur** (lot serveur A) : une ligne par action
  (connexion, déconnexion, changement de mot de passe, classes, élèves,
  partages, comptes, refus de droit), gardée **douze mois** et purgée par
  `menage.php`. Aucun prénom, aucun code, aucune adresse, aucun texte libre :
  un numéro de professeur, un mot d'une liste fermée, une cible, un résultat.
  Il se lit dans `verifier.php`, après le mot de passe d'installation — c'est
  un registre, pas un outil pour surveiller un collègue depuis Ma classe.
- Changer son mot de passe : 12 essais d'ancien mot de passe par compte et par
  10 min (une session volée ne devine pas l'ancien).
- **Ce qui est en ligne est ce qui a été testé** (lot 12) : chaque lot dépose un
  fichier `VERSION` (empreintes SHA-256 de tous les fichiers du serveur), que
  `verifier.php` recalcule sur place. Un fichier oublié pendant le dépôt, ou
  transporté en mode texte, se nomme tout seul. Depuis le lot serveur B (I-05),
  deux contrôles de plus : l'en-tête du manifeste annonce **combien** de lignes
  il doit contenir, et `verifier.php` le compare — un manifeste **tronqué**
  laissait la page toute verte, puisque les fichiers qu'il ne nommait plus
  n'étaient simplement plus comparés ; et tout `.php` **présent sur le serveur
  et absent du manifeste** est nommé (« fichier inattendu »), à l'exception des
  six qui n'y figurent jamais — `config.php`, `config.exemple.php` et les
  quatre pages d'opération, qui ont déjà leur propre ligne.
- **Sauvegarde chiffrée** (`sauvegarde.php`, déposé le temps de l'opération) :
  AES-256-CBC au format d'openssl, clé dérivée par PBKDF2-SHA256 (200 000
  tours) d'une phrase que le serveur ne connaît pas. Une restauration a été
  faite pour de vrai le 05/09/2026 — compte rendu dans `EXPLOITATION.md`.

## Tests

```
php tests/lancer.php
```

Lance un vrai serveur PHP sur une copie de `public/` avec une base SQLite
jetable et interroge l'API comme le fera l'appli : installation, connexion,
classes, codes, lecture/écriture, cloisonnement entre élèves, entre applis
et **entre professeurs** (classe d'un collègue invisible, partage en lecture
qui n'ouvre aucune écriture, partage en écriture qui n'autorise pas la
suppression de la classe, retrait du partage, création de compte réservée à
l'administrateur), reprise d'une base de l'ancienne version, CORS, injection
SQL, taille maximale, régénération de code, suppressions, limitation de débit,
et l'API de la page d'accueil élève.
Depuis l'audit du 30/08/2026 : GET refusé, jeton refusé dans l'adresse,
70 appels valides d'une même adresse, énumération freinée au 61ᵉ code inconnu,
20 requêtes simultanées sans erreur et compteur exact, purge des compteurs et
clés hachées, temps de refus de connexion, messages identiques pour un élève
inexistant ou d'un collègue, `verifier.php` muet sans mot de passe.

Lot A2 : révisions et 409, vingt créations simultanées (une seule passe),
contenu filtré à toute profondeur, parcours de référence de l'appli
(`tests/parcours-reference.json`, régénéré par `node scripts/generer-parcours-reference.mjs`
à la racine du dépôt), restauration de la version précédente, mise à niveau.

Lot S2 : en-têtes de sécurité sur chaque réponse (réussie ou non, un seul
exemplaire), politique de contenu à nonce posé sur chaque script (nonce
différent à chaque requête), moteur servi localement et identique à celui de
l'appli, version dans l'adresse = empreinte du fichier, `base_revision`
obligatoire, changement de mot de passe (ancien vérifié, longueur, autres
sessions fermées, celle-ci gardée, 13ᵉ essai freiné, bcrypt coût 10 en base),
réinitialisation (format du temporaire, sessions fermées, rien d'autre que le
changer, liste qui le dit), désactivation (même réponse qu'un mauvais mot de
passe, temps de refus comparable, classes conservées et invisibles, hors
annuaire, partage refusé, session refusée même si elle survivait),
réactivation, `verifier.php`. Lot S2b : création d'un compte sans mot de passe
(temporaire tiré, changement imposé, celui envoyé par l'administrateur ne vaut
rien), règles du mot de passe (chiffres seuls, identifiant dedans, phrase longue
acceptée, installateur), suppression d'un compte (droits, jamais soi, sans
classes ; avec classes : 409 sans le oui explicite, puis aucun orphelin —
élèves, progressions, partages reçus et donnés, sessions, compteurs — et les
autres n'ont rien perdu). Lot 3 (03/09/2026) : billets d'entrée — émis sur
demande seulement, empreinte en base, deux minutes, usage unique (cinq échanges
simultanés → un seul passe), périmé ou inconnu → 404 et échec compté pour
l'adresse, billet de fiche sans le code et refusé par `parcours.php`, fiche
accessible en lecture partagée, révoqués par un nouveau code ou la suppression,
purge à chaque appel, `verifier.php` et `migrer.php` connaissent la table.
Lot 6 (04/09/2026) : première écriture avec une révision autre que 0 → 409
et rien de créé ; restauration lancée pendant que le test tient la ligne
verrouillée (elle attend, puis repart de la révision qu'elle trouve) ; dix
restaurations et dix écritures simultanées sans révision attribuée deux fois
ni 500 (sur MySQL, l'ancien code en attribuait cinq en double) ;
`Cache-Control: no-store` sur sept réponses de l'API ; l'espace élève sans
« Ce n'est pas moi ».

Lot 12 (05/09/2026) : l'année scolaire réunionnaise (le pivot était alors au
1er août ; il est passé au 1er juillet avec le lot serveur A) ; la
suppression d'une classe qui n'en laisse RIEN (élèves, codes, progressions,
billets, compteurs, partages ; les codes ne rendent plus rien) ; la suppression
automatique du 1er août, son garde-fou des 21 jours sans activité, et le fait
qu'elle ne touche jamais aux classes d'un collègue ; `menage.php` refusé par
HTTP et effectif en ligne de commande ; le manifeste `VERSION` (fichier modifié, absent, ou transféré en
mode texte : chaque cas nommé) ; `secours.php` (mot de passe d'installation
exigé, règles du mot de passe, sessions fermées, compte rendu utilisable) ;
`sauvegarde.php` (fichier au format openssl, déchiffré et vérifié table par
table, illisible sans la phrase, structure des trois tables de jetons
présente — sans elle une base restaurée répondait 500).

Lot serveur A (06/09/2026) : l'historique des sept journées (trois
enregistrements le même jour = une ligne, neuf journées simulées = sept
gardées, la frontière de jour à l'heure de La Réunion), « Revenir à… » et la
restauration d'une journée, le journal des actions (une ligne par action, les
refus, rien de personnel dedans), la sauvegarde en instantané, « nouveau code »
en une transaction, la fin d'année sans suppression muette.

Lot serveur B (06/09/2026) : la restauration qui repose une époque plus haute
(et son témoin côté moteur, `tests/suivi-lot-serveur-b.test.mjs` : à époque
égale la fusion additionne — c'est bien le serveur qu'il fallait corriger) ;
treize mauvais mots de passe qui ralentissent au lieu de fermer le compte ; le
verrou d'inactivité qui survit au F5 ; le manifeste tronqué et le fichier
inattendu ; les freins en `/64` ; 73 octets refusés et 72 acceptés (36 lettres
accentuées) ; `menage.php` sans `X-Powered-By` ; le `.htaccess` et les actions
GitHub épinglées par SHA.

Séance en direct (07/10/2026) : une séance par classe même à dix ouvertures
simultanées ; l'élève ne reçoit ni répartition ni bonne réponse ; le tableau ne
reçoit qu'un compteur avant « Dévoiler », et jamais un nom ; forme des
réponses, changement d'avis sans doublon (vingt envois simultanés), réponse
refusée après « Dévoiler » — par l'API **et** par l'instruction SQL elle-même ;
cloisonnement entre classes ; fichier de fin de séance et sa ligne de journal ;
aucune écriture par interrogation, 121ᵉ réponse freinée ; « Terminer »,
l'échéance et les suppressions qui ne laissent rien ; les deux pages sous la
politique de contenu ; `verifier.php` et `migrer.php` ; et les sept actions
`direct.*` dans la matrice des droits.

**208 tests, 0 échec au 07/10/2026**, rejoués sur SQLite **et** sur MariaDB 10.11
(188 au 07/09/2026, alors rejoués sur MySQL 8)
(le limiteur emploie une instruction différente sur chaque moteur) :

```
SUIVI_TEST_DSN='mysql:host=127.0.0.1;port=3306;dbname=suivi_test;charset=utf8mb4' \
SUIVI_TEST_UTILISATEUR=… SUIVI_TEST_MOTDEPASSE=… php tests/lancer.php
```

(la base indiquée est vidée au démarrage). Il faut PHP sur le poste pour les
rejouer ; sinon ils restent exécutés côté Claude.

Après toute modification du schéma : `php outils/generer-sql.php`
(et `--verifier` pour contrôler que le `.sql` est à jour).
Après toute modification de `public/` : `php outils/generer-version.php <lot>`
(le test `tests/suivi-version-manifeste.test.mjs` du dépôt le vérifie).

## Ce qui n'est pas ici

Le fichier `config.php` (identifiants de la base) vit uniquement sur
l'hébergement OVH. Il ne doit jamais entrer dans le dépôt.
