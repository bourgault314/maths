# @mathsgo/automatismes

Les contenus pédagogiques validés d’Automatismes maths&go V2.

Chaque notion est écrite à neuf à partir de sa fiche validée. Le paquet ne
contient ni interface, ni accès au navigateur, ni hasard non seedé. Il expose
des gabarits en données pures et des générateurs enregistrables dans
`@mathsgo/moteur-exercices`.

`src/identifiants.js` est la source de vérité du code pour les domaines,
modules et micro-notions déjà construits. Les identifiants descriptifs sont
émis dans les questions et les traces ; `NC-xx`, `GM-xx` et les anciens
`PG-xx` restent uniquement des repères humains ou historiques.

## Contenu actuel

| Module | Rôle |
|---|---|
| `nombres-et-calculs/criteres-divisibilite/selection-diviseurs` | Première famille de `criteres-divisibilite` (alias `NC-01`) : sélectionner tous les diviseurs proposés parmi 2, 3, 5, 9 et 10. |
| `nombres-et-calculs/fractions-simples-decimaux/fraction-vers-decimal` | Micro-notion `fraction-vers-decimal` (alias `NC-03`) : passer d'une fraction simple ou décimale à son écriture décimale exacte. |
| `nombres-et-calculs/fractions-simples-decimaux/decimal-vers-fraction` | Micro-notion `decimal-vers-fraction` (alias `NC-04`) : compléter une fraction à dénominateur fixé ou saisir une fraction équivalente. |
| `nombres-et-calculs/fractions-simples-decimaux/serie` | Recette commune intercalée, équilibrée et seedée de la catégorie visible. |
| `nombres-et-calculs/ecritures-multiples-nombre/questions` | NC-05 : relier pourcentage, décimal et fractions repères sans refaire isolément NC-03/NC-04. |
| `nombres-et-calculs/ecritures-multiples-nombre/serie` | Recette seedée en six familles, avec valeurs distinctes et sélection multiple réservée aux séries de 20. |
| `registre` | Registre du moteur contenant les seuls générateurs pédagogiques construits et testés. |

Le lecteur interactif et le mode projection ne font pas partie de ce paquet.
