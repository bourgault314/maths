# Journal des décisions

Une décision par entrée : ce qui a été décidé, quand, et **pourquoi**. Le
« pourquoi » est le plus important : c'est lui qui permettra, plus tard, de
savoir si la décision tient encore.

Les décisions marquées **⧗ en attente** ne sont pas prises : elles attendent
Gwenaël. Elles sont écrites ici pour ne pas être oubliées, pas pour être
appliquées.

---

## D-01 — La V2 se construit à côté de `/auto/`, sans rien casser

**18/07/2026.** L'application actuelle reste en ligne et intacte pendant tout
le chantier. Ordre obligatoire : construire → tester → faire valider →
activer → retirer l'ancien.

**Pourquoi.** Gwenaël s'en sert en classe. Une bascule brutale mettrait ses
élèves devant un outil non validé, et rendrait tout retour en arrière coûteux.

---

## D-02 — Une seule couche est du code : les générateurs

**18/07/2026.** Programme, banque, gabarits et questions produites sont des
**données pures** : ni fonction, ni SVG, ni HTML, ni couleur.

**Pourquoi.** C'est ce qui permet de relire une banque sans l'exécuter, et ce
qui ferme définitivement la porte au `formula_code` hérité — un mini-langage
interprété à l'exécution, impossible à vérifier autrement qu'en le lançant.

---

## D-03 — Le calendrier n'est jamais dans une question

**18/07/2026.** Une notion déclare une **référence** (programme, niveau,
statut, identifiant officiel). C'est le catalogue de programme, et lui seul,
qui répond à « est-ce actif en 2027-2028 ? ».

**Pourquoi.** Les nouveaux programmes entrent en vigueur niveau par niveau
jusqu'en 2028. Si chaque question portait sa propre logique de dates, il
faudrait toutes les rouvrir à chaque rentrée.

---

## D-04 — La vérité mathématique n'est jamais un flottant

**18/07/2026.** Les réponses sont des valeurs canoniques exactes : entier,
décimal (mantisse + nombre de décimales), fraction normalisée. Les
comparaisons se font par produit en croix sur des entiers.

**Pourquoi.** `0,1 + 0,2` ne vaut pas `0,3` en JavaScript. Un élève ne doit
jamais être déclaré dans l'erreur à cause de cela. La lecture de `0,07`
assemble la mantisse **par le texte** pour éviter toute multiplication
flottante.

---

## D-05 — La saisie d'un élève n'est jamais exécutée

**18/07/2026.** La lecture d'une réponse passe par une grammaire fermée :
tout caractère hors de `0-9 + - / . ,` est refusé **avant** toute tentative
d'interprétation. Aucun `eval`, aucun `Function`, aucun `JSON.parse` sur du
texte libre.

**Pourquoi.** C'est la seule façon d'être sûr. Une liste noire se contourne ;
une liste blanche, non.

---

## D-06 — Le format des codes de série : MG2, distinct de MG1

**18/07/2026.** Les codes MG1 restent **gelés** avec l'application actuelle.
La V2 produit des codes `MG2-…`, qui portent les versions du moteur, le
profil de programme, ce qu'on travaille, la graine, le mode, la politique
d'aide et une somme de contrôle.

**Pourquoi.** Deux familles de codes qui se ressemblent finiraient par se
mélanger. Un code MG1 saisi dans la V2 est reconnu et expliqué (« ce code
appartient à l'application actuelle »), plutôt que refusé sans raison.

---

## D-07 ⧗ — Qui compose la question : le générateur ou le moteur ?

**Décision à prendre.** Deux conventions coexistent aujourd'hui :

- **Lot 0** — le générateur renvoie `{ enonce, reponse, aides, modelesErreurs }`
  et le **moteur** ajoute schéma, identifiant, cible et traçabilité.
- **PR 144** (`criteres-divisibilite`) — le générateur produit lui-même la
  question-instance complète, traçabilité comprise.

**Recommandation.** Garder la convention du lot 0, et adapter le générateur
de divisibilité. Raison : un générateur qui compose lui-même sa traçabilité
peut déclarer une version ou une graine qui n'ont pas servi, et la série
devient irreproductible sans que rien ne le signale. Un test du lot 0 vérifie
qu'un générateur ne peut pas falsifier ces champs — ce test n'a de sens que
si le moteur estampille.

**Conséquence si on tranche ainsi.** Un petit adaptateur à écrire sur
`divisibilite.js`. Aucun contenu pédagogique touché.

Tant que ce point n'est pas tranché, `criteres-divisibilite` **n'est pas
branché** au registre : le banc d'essai tourne sur des fixtures.

---

## D-08 ⧗ — Les codes doivent-ils être tapables au clavier ?

**Décision à prendre.** Un code MG2 pour une série d'un module fait
aujourd'hui **environ 190 caractères**. C'est confortable pour un lien ou un
QR code, mais trop long pour être recopié à la main.

**Options.**

1. **Garder l'identifiant texte des modules** (état actuel). Codes longs,
   lisibles au débogage, aucun couplage entre l'encodeur et la banque.
2. **Encoder les modules par leur `codeSerie` numérique** — le champ existe
   déjà dans le contrat, et c'est ce que faisait MG1. Codes bien plus courts,
   mais l'encodeur et le décodeur ont alors besoin de la table de
   correspondance, et un module sans code numérique devient inencodable.

**Ce qui dépend de la réponse.** Si les élèves doivent pouvoir taper un code,
il faut l'option 2. S'ils arrivent par lien ou par QR code — ce qui est le
cas d'usage annoncé — l'option 1 suffit.

---

## D-09 ⧗ — Les rôles de thème « partie » et « tout »

**Décision à prendre.** Les **noms** des rôles sémantiques sont arrêtés
(`donnee`, `inconnue`, `partie`, `tout`, `positif`, `negatif`, `selection`,
`aide`, `correction`, `erreur`, `principal`, `secondaire`). Les **teintes**
associées à `partie` et `tout` sont provisoires : elles reprennent le vert et
le bleu du langage des barres pour que le banc d'essai affiche quelque chose
de cohérent.

Ce n'est pas une convention pédagogique validée. Le thème reste marqué
`brouillon`, et un test vérifie qu'il le reste.

---

## D-10 — La fixture technique n'entre pas dans la banque publique

**18/07/2026.** Le module `fixture-technique` (code de série 999, hors de la
plage 0-42 des modules publics) sert à éprouver la chaîne complète. Il reste
en `brouillon` définitivement et n'est pas exporté dans `MODULES_V2`.

**Pourquoi.** Le lot 0 ne doit produire aucun contenu pédagogique, mais un
socle qu'on ne peut pas exercer de bout en bout n'est pas un socle vérifié.
Un test garantit que la fixture ne peut pas atteindre un élève.

---

## D-11 — Convention de nommage des générateurs : `famille/gabarit`

**18/07/2026.** Les générateurs se nomment `divisibilite/multiple-voisin`,
`fixture/somme` — minuscules, tirets, séparateur `/`.

**Pourquoi.** C'est la convention déjà employée par le premier module
reconstruit. Le contrat s'aligne sur la banque existante plutôt que d'imposer
une nouvelle orthographe qui aurait invalidé du code déjà fusionné.
