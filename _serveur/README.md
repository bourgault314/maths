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
débit) · `billets` (liens d'entrée à usage unique).

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
    api/parcours.php   API élève : lire/écrire la progression par code
    api/eleve.php      API élève : prénom, classe et applis à partir du code
    api/prof.php       API prof : connexion, classes, élèves, tableau
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
  règles pour l'installateur) : **12 caractères au moins**, et c'est tout —
  pas de majuscule ni de symbole imposés (recommandation ANSSI / NIST : la
  longueur protège plus que la composition, et le frein à 12 essais / 10 min
  rend la devinette en ligne impossible). Deux refus de bon sens : rien que des
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
| POST | `/api/parcours.php` `{code, appli, parcours, base_revision}` | l'enregistre si `base_revision` est la révision en base ; sinon **409** avec l'état actuel, que l'appli fusionne avant de renvoyer. Le serveur ne garde que ce que `lib/applis.php` déclare (`lib/progression.php`) : jamais un prénom ni un texte libre. La version précédente est conservée (`donnees_avant`) |
| POST | `/api/eleve.php` `{code}` | prénom, classe et applis de l'élève (page d'accueil) |
| POST | `/api/prof.php` `{action, …}` | `connexion` (répond aussi `mdp_temporaire`), `deconnexion`, `moi`, `profs.motdepasse` `{ancien, nouveau}`, `profs.annuaire`, `profs.liste/ajouter/reinitialiser/desactiver/reactiver/supprimer` (administrateur ; `ajouter` et `reinitialiser` renvoient le temporaire ; `supprimer` veut `avec_classes: true` si le compte possède des classes), `classes.liste/creer/modifier/supprimer`, `partages.liste/ajouter/supprimer`, `eleves.ajouter/nommer/regenerer/restaurer/supprimer`, `tableau` |

`classes.liste` supprime au passage les classes de l'année scolaire écoulée
(lot 12, seulement celles du professeur connecté) et rend, en plus des classes,
`supprimees_maintenant`, `annee_courante`, `preavis_fin_annee` et `purge_le`.
`classes.supprimer` et la fin d'année passent par **la même fonction**
(`lib/archives.php`, `supprimer_classe()`) : deux codes qui effacent les mêmes
tables, ce serait deux occasions d'en oublier une.

## Sécurité

- Toutes les requêtes SQL sont préparées (aucune concaténation).
- Mot de passe prof haché (`password_hash`), jeton de session stocké haché,
  expiration 12 h, comparaison à temps constant à la connexion.
- CORS limité à `https://mathsgo.re` et `https://suivi.mathsgo.re`.
- **Le code élève et le jeton prof ne voyagent jamais dans une adresse** :
  les API élève n'acceptent que POST (405 sinon), le jeton passe par
  l'en-tête `Authorization` ou le corps. Une adresse s'inscrit en clair dans
  les journaux de l'hébergeur, un corps non.
- Progression plafonnée à 40 ko ; 300 requêtes / 5 min par code ;
  12 tentatives de connexion / 10 min par adresse IP ; par adresse IP, seuls
  les **échecs** (codes inconnus) sont comptés — 60 / 5 min — pour qu'un
  collège entier derrière une seule adresse ne soit jamais freiné, et qu'une
  énumération de codes le soit dès le 61ᵉ essai (y compris sur les bons codes,
  sinon la réponse trahirait lesquels existent).
- La table `compteurs` ne contient ni adresse IP ni code en clair (clés
  hachées avec un secret), l'incrément tient en une instruction (UPSERT), et
  les fenêtres fermées sont effacées à chaque appel : aucune adresse n'y
  survit plus de cinq minutes. **Ce secret n'est pas le mot de passe
  d'installation** (lot 11) : c'est `secret` de `config.php` s'il est
  renseigné — le mieux —, sinon une valeur **dérivée** de `jeton_installation`
  par HMAC avec une étiquette d'usage. Connaître l'un ne donne pas l'autre.
  `verifier.php` dit lequel des deux cas s'applique.
- **En IPv6, le compteur par adresse regroupe le bloc `/64`** (lot 11) : un
  abonné reçoit le bloc entier et en change à volonté ; compter l'adresse
  exacte revenait à offrir un compteur neuf à chaque essai.
- `verifier.php` ne montre rien sans le `jeton_installation`, et **douze
  mauvais essais par adresse et par 10 min** ferment la porte pour le reste de
  la fenêtre (lot 11) — seuls les échecs comptent, vérifier vingt fois de suite
  avec le bon mot de passe ne gêne personne. Aucune page n'affiche d'erreur PHP
  (`display_errors` forcé à 0 dans `lib/bd.php`).
- **PHP n'annonce plus sa version** : `header_remove('X-Powered-By')` dans
  `lib/entetes.php` (lot 11). `expose_php = Off` n'était pas une option ici :
  ce réglage est de niveau système, un `.user.ini` déposé dans le dossier ne le
  change pas.
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
- Changer son mot de passe : 12 essais d'ancien mot de passe par compte et par
  10 min (une session volée ne devine pas l'ancien).
- **Ce qui est en ligne est ce qui a été testé** (lot 12) : chaque lot dépose un
  fichier `VERSION` (empreintes SHA-256 de tous les fichiers du serveur), que
  `verifier.php` recalcule sur place. Un fichier oublié pendant le dépôt, ou
  transporté en mode texte, se nomme tout seul.
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

Lot 12 (05/09/2026) : l'année scolaire réunionnaise (pivot au 1er août) ; la
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

**143 tests, 0 échec au 05/09/2026**, rejoués sur SQLite **et** sur MySQL 8
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
