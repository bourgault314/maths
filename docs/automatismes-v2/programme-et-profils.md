# Programme, niveaux et profils DNB

## Le problème

Un automatisme n'est pas vrai « en soi ». Il est vrai **pour un niveau, dans
un programme, à partir d'une année**. Un élève de 3e ne relève pas du même
texte officiel en 2027 et en 2029, et une session du DNB interroge un état du
programme figé à sa date.

Si chaque question portait sa propre logique de dates, il faudrait toutes les
rouvrir à chaque rentrée.

## La règle

Une notion déclare une **référence** :

```js
{ programme: "cycle4-2026", niveau: "4e", statut: "automatise", identifiant: "4-12" }
```

Elle ne dit jamais « à partir de 2027 ». C'est le catalogue — et lui seul —
qui répond à la question « est-ce actif cette année ? ».

```js
programmeEnVigueur("3e", "2027-2028")   // → cycle4-2020 (transition)
programmeEnVigueur("3e", "2028-2029")   // → cycle4-2026
estActif({ programme: "cycle4-2026", niveau: "3e" }, "2027-2028")  // → false
```

## Le calendrier officiel

Fixé par les deux arrêtés, et vérifié ligne à ligne contre les annexes
(voir [`docs/reference-matrice-automatismes/`](../reference-matrice-automatismes/)) :

| Niveau | Nouveau programme applicable à partir de |
| --- | --- |
| CM1 | 2025-2026 |
| 6e | 2025-2026 |
| CM2 | 2026-2027 |
| 5e | 2026-2027 |
| 4e | 2027-2028 |
| 3e | 2028-2029 |

Tant que le nouveau texte n'est pas entré en vigueur pour un niveau, ce niveau
relève encore du programme de 2020. C'est pourquoi `cycle4-2020` figure dans
le catalogue avec une date de **sortie** par niveau, et non une date d'entrée.

**Conséquence pratique.** Pendant la transition, des notions retirées du
nouveau programme (rotations, homothéties, triangles semblables, cas
d'égalité…) restent nécessaires pour les niveaux qui n'ont pas basculé. On ne
peut donc pas les supprimer de la banque avant 2028.

## Enseigné ≠ automatisé

Le BO distingue les deux, et le contrat aussi :

- `statut: "enseigne"` — la notion est au programme du niveau ;
- `statut: "automatise"` — elle doit devenir **automatique**.

L'exemple qui fixe les idées : **Pythagore est enseigné en 4e, mais n'est
automatisme qu'en 3e**. Une série d'automatismes de 4e ne doit donc pas en
proposer.

Au niveau d'une notion, ces deux informations sont portées par les booléens
`enseigne` et `automatise`, et par la liste `automatismesBO`. Une notion
déclarée automatisable **doit** citer un identifiant du BO, ou déclarer
explicitement `horsAutomatismeBO: true` — sans quoi le contrat la refuse. Il
n'est pas possible de prétendre au statut d'automatisme sans dire lequel.

## Les profils DNB

Une session du DNB est décrite par un profil :

```js
"dnb-2029": {
  session: 2029,
  anneeScolaire: "2028-2029",
  programmes: ["cycle4-2026"],
}
```

Deux profils sont déclarés aujourd'hui (`dnb-2027`, `dnb-2029`), aux deux
bornes de la transition. Les sessions intermédiaires seront ajoutées quand
elles seront utiles — ajouter un profil ne coûte rien, en inventer un dont on
n'a pas besoin fait croire à une couverture qui n'existe pas.

Le profil DNB voyage dans le code de série : deux séries de 3e relevant de
programmes différents ne peuvent pas partager le même code.

## Les 187 automatismes officiels

Ils sont déjà en données dans
[`packages/objets/src/programme-automatismes.js`](../../packages/objets/src/programme-automatismes.js),
**généré** depuis la matrice vérifiée. Ne pas l'éditer à la main : modifier la
matrice puis regénérer.

> **À faire au lot suivant.** Ce fichier et le catalogue de programme du lot 0
> ne sont pas encore reliés : les automatismes portent une année d'application
> sous forme de texte (« Depuis 2026-2027 »), le catalogue raisonne sur des
> identifiants de programme. Les faire se rejoindre est un petit chantier
> mécanique, mais qui mérite d'être fait consciemment — il touche la source de
> vérité du programme.
