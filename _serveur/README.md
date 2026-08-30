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
6 caractères, prénom, initiale) · `progressions` (JSON, date) · `profs`
(identifiant, mot de passe haché, administrateur) · `partages` (classe,
professeur, droit) · `sessions_prof` · `compteurs` (limitation de débit).

Pas de nom de famille, pas de date de naissance, pas d'adresse mail
d'élève, pas de mot de passe d'élève.

## Arborescence

```
_serveur/
  public/            ← contenu à déposer dans le dossier « suivi » chez OVH
    index.php          page d'accueil des élèves : un code, les applis de sa classe
    prof/index.php     page « Ma classe » : classes, codes, tableau, impression
    api/parcours.php   API élève : lire/écrire la progression par code
    api/eleve.php      API élève : prénom, classe et applis à partir du code
    api/prof.php       API prof : connexion, classes, élèves, tableau
    lib/               bd, réponses/CORS, codes, limitation, sessions, catalogue d'applis
    config.exemple.php à recopier en config.php sur le serveur (JAMAIS commité)
    installer.php      création des tables + premier compte, à SUPPRIMER après
    migrer.php         mise à niveau d'une base déjà installée, à SUPPRIMER après
    verifier.php       page de diagnostic en français
    .htaccess
  sql/schema-mysql.sql (généré)
  outils/generer-sql.php
  tests/lancer.php
```

## Les deux pages

- `https://suivi.mathsgo.re/` — page des élèves. Un champ de six caractères, puis
  la liste des applis proposées à sa classe. Chaque appli ouvre l'appli unique de
  mathsgo.re en lui passant le code, suivi de l'écran à ouvrir quand l'appli en
  déclare un (`…/defi_tables.html#code=XXXXXX&ouvrir=parcours`) : aucune copie
  d'appli n'est faite ici. C'est bien cette adresse complète qu'il faut essayer
  quand on vérifie le suivi — la forme abrégée `#code=XXXXXX` a longtemps caché
  que l'appli ne savait pas lire la vraie.
- `https://suivi.mathsgo.re/prof/` — page « Ma classe », protégée par mot de passe :
  créer une classe, générer N codes, saisir prénom + initiale, voir le tableau
  (tables acquises, mélange, Expert, dernière activité), trier, régénérer un code,
  supprimer, imprimer la liste code ↔ élève.

Le résumé de progression du tableau est calculé **dans le navigateur** en chargeant
`defi_tables_mon_parcours.js` depuis mathsgo.re : le serveur n'ouvre jamais les
paquets qu'il range, et il n'existe qu'une seule définition du parcours.

### Chacun ses classes

Une classe appartient au professeur qui l'a créée (`classes.prof_id`). Personne
d'autre ne la voit — une classe hors de portée est déclarée « introuvable »,
son nom même ne sort pas du serveur.

Le propriétaire peut la **partager** avec un collègue (table `partages`) :

- **lecture** — il voit le tableau et les codes, il ne change rien ;
- **écriture** — il peut en plus ajouter des élèves, saisir les prénoms et
  donner un nouveau code.

Supprimer une classe reste réservé au propriétaire. Pour les actions sur un
élève, c'est la classe **de l'élève** qui décide, jamais le `classe_id` envoyé
par le navigateur.

Le premier compte créé par `installer.php` est **administrateur** : lui seul
voit l'écran « Professeurs » et peut ouvrir un compte à un collègue. Un nouveau
compte ne voit rien tant qu'aucune classe ne lui a été partagée.

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
| POST | `/api/prof.php` `{action, …}` | `connexion`, `deconnexion`, `moi`, `profs.annuaire`, `profs.liste/ajouter` (administrateur), `classes.liste/creer/modifier/supprimer`, `partages.liste/ajouter/supprimer`, `eleves.ajouter/nommer/regenerer/restaurer/supprimer`, `tableau` |

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
  hachées avec un secret : `secret` de `config.php`, sinon
  `jeton_installation`), l'incrément tient en une instruction (UPSERT), et
  les fenêtres fermées sont effacées à chaque appel : aucune adresse n'y
  survit plus de cinq minutes.
- `verifier.php` ne montre rien sans le `jeton_installation` ; aucune page
  n'affiche d'erreur PHP (`display_errors` forcé à 0 dans `lib/bd.php`).
- Le refus de connexion prend le même temps qu'un identifiant existe ou non
  (hachage de remplacement bcrypt réel, coût 10, comme les comptes).
- `installer.php` exige un jeton présent dans `config.php` et se
  verrouille dès qu'un compte prof existe.
- Aucun message d'erreur technique n'est renvoyé au navigateur.

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

**93 tests, 0 échec au 30/08/2026**, rejoués sur SQLite **et** sur MariaDB
(le limiteur emploie une instruction différente sur chaque moteur) :

```
SUIVI_TEST_DSN='mysql:host=127.0.0.1;port=3306;dbname=suivi_test;charset=utf8mb4' \
SUIVI_TEST_UTILISATEUR=… SUIVI_TEST_MOTDEPASSE=… php tests/lancer.php
```

(la base indiquée est vidée au démarrage). Il faut PHP sur le poste pour les
rejouer ; sinon ils restent exécutés côté Claude.

Après toute modification du schéma : `php outils/generer-sql.php`
(et `--verifier` pour contrôler que le `.sql` est à jour).

## Ce qui n'est pas ici

Le fichier `config.php` (identifiants de la base) vit uniquement sur
l'hébergement OVH. Il ne doit jamais entrer dans le dépôt.
