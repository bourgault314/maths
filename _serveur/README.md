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
`config.php`, **puis supprimer le fichier**. La page ajoute la colonne
propriétaire, la colonne administrateur et la table `partages`, attribue les
classes sans propriétaire au premier compte et le passe administrateur. Elle ne
touche ni aux élèves, ni aux codes, ni aux progressions, et peut être relancée
sans risque.

## Points d'entrée

| Méthode | URL | Effet |
|---|---|---|
| GET | `/api/parcours.php?code=XXXXXX&appli=defi-tables` | lit la progression |
| POST | `/api/parcours.php` `{code, appli, parcours}` | l'enregistre |
| POST | `/api/prof.php` `{action, …}` | `connexion`, `deconnexion`, `moi`, `profs.annuaire`, `profs.liste/ajouter` (administrateur), `classes.liste/creer/modifier/supprimer`, `partages.liste/ajouter/supprimer`, `eleves.ajouter/nommer/regenerer/supprimer`, `tableau` |

## Sécurité

- Toutes les requêtes SQL sont préparées (aucune concaténation).
- Mot de passe prof haché (`password_hash`), jeton de session stocké haché,
  expiration 12 h, comparaison à temps constant à la connexion.
- CORS limité à `https://mathsgo.re` et `https://suivi.mathsgo.re`.
- Progression plafonnée à 40 ko ; 120 requêtes / 5 min par code ;
  12 tentatives de connexion / 10 min par adresse IP.
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
**59 tests, 0 échec au 30/08/2026**, exécutés dans l'environnement de
développement de Claude. PHP n'étant pas installé sur le poste de Gwenaël,
ces tests ne peuvent pas être rejoués depuis Claude Code.

Après toute modification du schéma : `php outils/generer-sql.php`
(et `--verifier` pour contrôler que le `.sql` est à jour).

## Ce qui n'est pas ici

Le fichier `config.php` (identifiants de la base) vit uniquement sur
l'hébergement OVH. Il ne doit jamais entrer dans le dépôt.
