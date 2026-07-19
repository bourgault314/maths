# Fiche pédagogique — Puissances simples (4e)

**Statut : `a_faire` — brouillon à valider par Gwenaël.**

Cette fiche propose le premier pilote d'Automatismes V2. Elle ne crée aucun
générateur, aucune question publiée ni aucune interface : elle fixe seulement
ce qui pourra être construit après validation pédagogique.

## 1. Identité de la notion

| Champ | Décision proposée |
| --- | --- |
| Domaine maths&go | 1. Nombres et calculs |
| Nom V2 | Puissances simples |
| Niveau d'apprentissage | 5e : carrés, cubes et premières puissances |
| Niveau d'automatisation | 4e, puis entretien en 3e |
| Automatisme officiel ciblé | `4-13` : calculer des puissances simples telles que 2², 2³ ou 3³ |
| Type de réponse | Nombre entier saisi par l'élève |
| Provenance attendue | `original_mathsgo` |

Le programme de cycle 4 publié au BO du 5 mars 2026 s'applique
progressivement : en 4e à la rentrée 2027. Il distingue cet automatisme de
trois voisins qui resteront des fiches séparées : carrés parfaits (`4-11`),
puissances de dix (`4-14`) et règles de calcul sur les puissances en 3e
(`3-02` à `3-04`).

Sources :

- [BO du 5 mars 2026 — programme de mathématiques du cycle 4](https://www.education.gouv.fr/bo/2026/Hebdo10/MENE2602912A) ;
- `packages/objets/src/programme-automatismes.js`, entrée `4-13`.

## 2. Pourquoi commencer ici

Cette micro-notion est assez courte pour tester le cycle complet V2 — gabarit,
génération seedée, aide, correction, réponse saisie et tests — sans mélanger
plusieurs savoir-faire. Elle est officiellement identifiée, mathématiquement
fermée et ne demande pas de nouvel objet visuel.

Ne pas construire un visuel décoratif est ici un choix délibéré : l'aide écrit
la multiplication répétée, qui est la représentation pertinente. Les objets
visuels maths&go seront mobilisés quand ils apportent un véritable appui de
compréhension.

## 3. Savoir-faire exact

L'élève lit une écriture de la forme `aⁿ`, la traduit en produit de `n` facteurs
tous égaux à `a`, puis calcule le résultat.

Exemples de référence pour la fiche, à reformuler au moment du générateur :

- `3²` signifie `3 × 3` ;
- `2³` signifie `2 × 2 × 2` ;
- le petit nombre en haut indique le nombre de facteurs, il ne se multiplie pas
  directement par la base.

La fiche ne traite pas encore les exposants 0 ou 1, les bases négatives, les
puissances de dix, la notation scientifique, ni les règles de produits et de
quotients de puissances.

## 4. Prérequis et frontières

### Prérequis

- connaître les tables de multiplication utiles ;
- comprendre une multiplication de plusieurs facteurs ;
- savoir lire une écriture avec exposant.

### Ce qui est volontairement exclu

| Sujet | Fiche future distincte |
| --- | --- |
| Reconnaître ou restituer les carrés de 0 à 12 | Carrés parfaits |
| `10² = 100` et `10³ = 1 000` | Puissances de dix |
| Transformer un produit répété en puissance | Écriture puissance et produit répété (3e) |
| Multiplier des puissances | Règles de calcul sur les puissances (3e) |
| Racine carrée | Racines carrées |

## 5. Progression proposée

| Palier | Tirages autorisés | Intention |
| --- | --- | --- |
| Découverte | bases 2 à 5, exposant 2 | installer « au carré = deux facteurs » |
| Consolidation | bases 2 à 4, exposant 3 | installer « au cube = trois facteurs » |
| Fluence | bases 2 à 6, exposant 2 ou 3 | choisir la bonne lecture avant le calcul |

Les cas `0²`, `1²`, `1³`, les bases 10 et les résultats très grands sont exclus
de ce premier périmètre : ils ne vérifient pas bien la compréhension visée ou
relèvent d'une autre fiche. Les valeurs seront toutes calculées exactement en
entiers ; aucun arrondi ni calculatrice.

## 6. Erreurs à anticiper

| Erreur observée ou plausible | Exemple | Réponse pédagogique proposée |
| --- | --- | --- |
| Multiplier la base par l'exposant | `4³ → 12` | refaire apparaître les trois facteurs `4 × 4 × 4` |
| Additionner la base plusieurs fois | `3³ → 9` | distinguer clairement produit et somme répétée |
| Oublier un facteur | `2³ → 4` | compter les facteurs avant de calculer |
| Coller les chiffres | `4² → 42` | verbaliser « quatre au carré », puis écrire `4 × 4` |
| Confondre carré et double | `5² → 10` | montrer que l'exposant ne demande pas une multiplication par 2 |

Comme l'élève saisit sa réponse, ces erreurs ne servent pas encore de
distracteurs de QCM. Elles déterminent les formulations des aides, les cas de
test et, plus tard, les diagnostics affichés après une erreur.

## 7. Aides et correction

L'aide est progressive et ne modifie pas l'énoncé.

1. **Indice de lecture** : « L'exposant indique combien de fois le nombre est
   facteur. »
2. **Traduction** : afficher l'égalité entre la puissance et son produit répété.
3. **Calcul guidé** : découper le produit en une ou deux multiplications
   intermédiaires adaptées à la valeur tirée.

La correction reprend systématiquement la traduction puis le calcul, par
exemple sous la forme : `3³ = 3 × 3 × 3 = 9 × 3 = 27`.

## 8. Contrat technique envisagé après validation

- un gabarit V2 nommé depuis la taxonomie maths&go, jamais depuis l'ancienne
  banque ;
- une réponse `texte-exact` contenant l'entier résultat ;
- un tirage seedé des paires `(base, exposant)` par palier ;
- des tests sur toutes les paires autorisées, la justesse du produit répété, le
  déterminisme, les exclusions et les trois niveaux d'aide ;
- aucun nouveau composant graphique pour ce premier pilote.

## 9. Validation attendue de Gwenaël

À valider ou corriger avant tout code :

1. le périmètre exact des bases et exposants ;
2. les mots employés dans l'indice et la correction ;
3. l'absence volontaire de visuel pour cette micro-notion ;
4. l'ordre des trois aides.

Après validation, le statut passera à `construit` pendant la programmation,
puis à `valide` uniquement après vérification des exemples générés.
