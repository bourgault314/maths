# État de la migration

Mis à jour au **lot 0** (18 juillet 2026).

## Où en est-on, en une phrase

Le socle est construit et vérifié ; **aucune catégorie n'est encore
migrée** ; l'application actuelle tourne inchangée.

## L'application actuelle

`/auto/` n'a **pas été modifié** par le lot 0 et continue de servir en classe.
Rien n'en sera retiré avant que le neuf soit construit, testé, validé et
activé — dans cet ordre.

Ce qui reste à remplacer y est chiffré : 43 modules, 478 énoncés, 279
occurrences de `formula_code` dans 32 fichiers, et un interpréteur de
mini-langage dans `auto/scripts/02-question-engine.js`.

## La banque V2

| Module | Ancien | Notions | État | Branché au moteur |
| --- | --- | --- | --- | --- |
| `criteres-divisibilite` | `dnb_08` | 6 | `a-valider` | **non** — voir ci-dessous |
| `fixture-technique` | — | 2 | `brouillon` (définitif) | oui |

**Zéro notion validée.** C'est normal et voulu : seul Gwenaël pose `valide`.

### Pourquoi `criteres-divisibilite` n'est pas branché

Son générateur (PR 144) produit lui-même la question-instance complète,
traçabilité comprise. Le registre du lot 0 attend au contraire que le
générateur renvoie `{ enonce, reponse, … }` et estampille lui-même la
traçabilité — pour qu'un générateur ne puisse pas déclarer une version ou une
graine qui n'ont pas servi.

Les deux conventions ne peuvent pas coexister. Le choix est posé en
[decisions.md](decisions.md), **D-07**, avec une recommandation. Il n'a pas
été tranché unilatéralement parce qu'il touche du code déjà fusionné.

Tant qu'il n'est pas tranché, le banc d'essai tourne sur des fixtures. Une
fois tranché, l'adaptation est un petit travail de plomberie : aucun contenu
pédagogique n'est concerné.

## Ordre de migration prévu

Après le pilote (`dnb_08`), cinq tranches verticales de référence, choisies
pour éprouver l'architecture sur des matières différentes :

| Ordre | Ancien module | Ce que la tranche éprouve |
| --- | --- | --- |
| 2 | `dnb_02b` | multiplier/diviser par 10, 100, 1000 — décimaux |
| 3 | `dnb_38` | nombres relatifs |
| 4 | `dnb_13` | équations — algèbre |
| 5 | `dnb_22` | aires — unités et figures |
| 6 | `dnb_14` | abscisse — objet visuel et gabarits virtuels |

> **Désaccord consigné, non tranché.** Le cahier des charges place les
> **fractions** en dernier (positions 39-43). C'est à rediscuter : c'est le
> plus gros chantier pédagogique de Gwenaël *et* son matériel le plus solide.
> Le passer tôt éprouverait le contrat pendant qu'il peut encore changer ;
> le garder pour la fin, c'est découvrir ses contraintes quand tout est figé.
> **Décision de Gwenaël.**

## Correspondance avec les anciens modules

Elle est portée par le champ `legacyIds` de chaque module V2, et non par un
tableau séparé qui se désynchroniserait. Les **codes de série** et les
**identifiants publics** des 43 modules sont conservés : ils circulent dans
les codes partagés et dans le menu.

Les tables de correspondance déjà établies sont dans
[`docs/reference-matrice-automatismes/`](../reference-matrice-automatismes/) —
elles restent **à faire valider** par Gwenaël, car ce sont des classements
pédagogiques.

## Ce qui reste à construire

Le lot 0 a livré le socle. Restent :

- les générateurs, catégorie par catégorie ;
- les modèles d'erreurs et les aides, validés ;
- le rendu commun (le lot 0 n'a posé que le catalogue d'objets) ;
- l'interface V2 et ses quatre modes ;
- le raccord entre les 187 automatismes en données et le catalogue de
  programme (voir [programme-et-profils.md](programme-et-profils.md)) ;
- la couverture du programme et les profils DNB des sessions intermédiaires ;
- les vérifications téléphone ;
- la bascule finale et le retrait du moteur hérité.

## La règle de bascule

```
construire → tester → faire valider → activer → retirer l'ancien
```

Une catégorie n'est basculée qu'après validation. L'ancien moteur n'est retiré
qu'à la toute fin, quand plus rien n'en dépend.
