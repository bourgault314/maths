# Provenance et indépendance de la banque maths&go

*Décision de Gwenaël Bourgault, 18 juillet 2026. Ce document fait autorité sur tout le dépôt.*

## 1. La décision

La banque **DocTools / DNB** d'Éric Hakenholz ne doit plus servir que d'**inventaire pédagogique** :
la liste des notions et des types de questions qu'un élève doit savoir traiter.

À partir de maintenant, maths&go ne conserve ni ne reproduit :

- ses **formulations** (énoncés, consignes, messages, titres de modules) ;
- ses **fichiers JSON** et banques de questions ;
- ses **`formula_code`** (le mini-langage de calcul d'origine) ;
- ses **réponses et distracteurs** ;
- ses **SVG** et morceaux de code de rendu ;
- ses **générateurs** et jeux de paramètres.

Ce qui reste parfaitement légitime : **savoir** qu'il faut un module « pourcentages d'évolution »
niveau 3e, ou « Pythagore sans calculatrice ». Une notion au programme n'appartient à personne.

## 2. Ce que l'on garde — sans discussion

Rien de ce qui suit n'est remis en cause :

- l'**inventaire des notions** et des types d'automatismes ;
- l'**architecture** actuelle, les niveaux, les filtres, les modes d'utilisation ;
- l'**interface mobile**, le diaporama, le clavier fourni, le système d'aide ;
- les **représentations pédagogiques réellement reconstruites** (schémas en barres, jetons,
  Splat, figures, solides, barres de pourcentage…) ;
- les **choix mathématiques** de Gwenaël et toutes les améliorations apportées.

## 3. Les trois statuts d'origine

Chaque module porte désormais un statut. Il est déclaré dans
[`packages/objets/src/provenance.js`](../packages/objets/src/provenance.js) et vérifié par un test.

| Statut | Ce que ça veut dire | Ce qu'on en fait |
| --- | --- | --- |
| `original_mathsgo` | Entièrement indépendant. Conçu et écrit pour maths&go, ou porté depuis les propres outils de Gwenaël (`outils/`). | Conservé tel quel. |
| `reconstruit` | Inspiré d'une notion de l'inventaire, mais **code, énoncé et visuel écrits à neuf**. | Conservé. Un contrôle d'indépendance suffit. |
| `herite_doctools` | Contient encore de la matière d'origine (formulation, paramètres, distracteurs, `formula_code`, SVG). | **À remplacer**, progressivement. |

Un quatrième statut technique existe pour l'audit en cours :

| `a_auditer` | Pas encore examiné. Ne rien conclure. | À classer dès que possible. |

## 4. La règle d'or : ne rien casser

**On ne supprime rien brutalement.** Le site et la bêta doivent continuer de fonctionner
pendant toute la migration. Un module `herite_doctools` reste en ligne et rend service aux
élèves jusqu'au jour où son remplaçant indépendant est prêt, vérifié et validé.

L'ordre est toujours : **écrire le neuf → vérifier → basculer → retirer l'ancien.**
Jamais : retirer l'ancien puis voir.

## 5. Comment on reconstruit un module

Pour faire passer un module de `herite_doctools` à `reconstruit` :

1. **Relever la notion**, pas le contenu. On note ce que l'élève doit savoir faire, le niveau,
   le type de question. C'est tout ce qu'on emporte.
2. **Écrire le générateur à neuf** : nos propres paramètres, nos propres tirages, notre PRNG
   seedé. Aucun `formula_code`, aucune table de valeurs recopiée.
3. **Écrire les énoncés à neuf**, dans les mots de Gwenaël, avec ses contextes à lui.
4. **Écrire les distracteurs à neuf**, à partir des erreurs d'élèves qu'il observe réellement
   (et non de la liste d'origine).
5. **Dessiner le visuel avec nos objets** (`packages/objets/`). Aucun SVG importé.
6. **Vérifier mathématiquement** : tests automatiques sur les cas limites, valeurs exactes.
7. **Vérifier sur téléphone** (375 px), cibles tactiles ≥ 44 px.
8. **Faire valider par Gwenaël** — règle inchangée : aucun contenu pédagogique sans son accord
   (voir [`signature-pedagogique.md`](signature-pedagogique.md)).
9. **Changer le statut** dans `provenance.js` et noter la date.

## 6. Contrôle d'indépendance d'un module déjà reconstruit

Pour les modules profondément retravaillés (solides, figures, fractions avec ses bandes,
Thalès, droites graduées…), il ne s'agit pas de tout refaire mais de **vérifier** :

- aucune chaîne de texte identique à un énoncé d'origine ;
- aucun `formula_code` résiduel ;
- aucun SVG ou chemin de tracé recopié ;
- aucune liste de paramètres ou de distracteurs reprise telle quelle ;
- les couleurs et conventions viennent de la charte maths&go.

Si les cinq points passent, le module est `reconstruit` et le sujet est clos pour lui.

## 7. Périmètre

- Le dépôt **`mathsgo-automatismes-beta`** n'est pas concerné par ce chantier : c'est un
  territoire à part, qui tournera tel quel jusqu'à son remplacement par le neuf.
- Le dossier **`outils/`** contient les outils écrits par Gwenaël : `original_mathsgo` par défaut,
  sauf preuve du contraire.
- Le dossier **`auto/`** est l'application déployée : c'est là que se concentre la dette.

## 8. Pourquoi ce travail en vaut la peine

Il ajoute de l'ouvrage. Il donne en échange une véritable banque maths&go : indépendante,
documentée, exploitable commercialement, sans dette cachée.
