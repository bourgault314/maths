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

`classes` (libellé, applis proposées) · `eleves` (code de 6 caractères,
prénom, initiale) · `progressions` (JSON, date) · `profs` (identifiant,
mot de passe haché) · `sessions_prof` · `compteurs` (limitation de débit).

Pas de nom de famille, pas de date de naissance, pas d'adresse mail
d'élève, pas de mot de passe d'élève.

## Arborescence

```
_serveur/
  public/            ← contenu à déposer dans le dossier « suivi » chez OVH
    api/parcours.php   API élève : lire/écrire par code
    api/prof.php       API prof : connexion, classes, codes, tableau
    lib/               bd, réponses/CORS, codes, limitation, sessions
    config.exemple.php à recopier en config.php sur le serveur (JAMAIS commité)
    installer.php      création des tables + premier compte, à SUPPRIMER après
    verifier.php       page de diagnostic en français
    .htaccess
  sql/schema-mysql.sql (généré)
  outils/generer-sql.php
  tests/lancer.php
```

## Points d'entrée

| Méthode | URL | Effet |
|---|---|---|
| GET | `/api/parcours.php?code=XXXXXX&appli=defi-tables` | lit la progression |
| POST | `/api/parcours.php` `{code, appli, parcours}` | l'enregistre |
| POST | `/api/prof.php` `{action, …}` | `connexion`, `deconnexion`, `moi`, `classes.liste/creer/modifier/supprimer`, `eleves.ajouter/nommer/regenerer/supprimer`, `tableau` |

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
classes, codes, lecture/écriture, cloisonnement entre élèves et entre
applis, CORS, injection SQL, taille maximale, régénération de code,
suppressions, limitation de débit. **36 tests, 0 échec au 29/08/2026.**

Après toute modification du schéma : `php outils/generer-sql.php`
(et `--verifier` pour contrôler que le `.sql` est à jour).

## Ce qui n'est pas ici

Le fichier `config.php` (identifiants de la base) vit uniquement sur
l'hébergement OVH. Il ne doit jamais entrer dans le dépôt.
