# État du chantier Automatismes V2

**Dernière mise à jour : 18 juillet 2026.**

## Point de départ vérifié

- Dépôt : `bourgault314/maths`.
- Branche de référence : `main`.
- Commit vérifié : `187579c007ade8dc3210cd42b2b1f88e56f12ea8`.
- PR #151 fusionnée : le contenu prématuré issu de la PR #144 a été retiré.
- PR #150 fermée sans fusion : son socle surdimensionné ne doit pas être repris.
- PR #145 ouverte : ne pas la fusionner telle quelle, car elle vise aussi des
  fichiers retirés par la PR #151. Son idée de garde-fou de provenance reste à
  réétudier.

## État fonctionnel

- La bêta continue de fonctionner séparément et est gelée hors correction
  critique.
- Aucun contenu pédagogique V2 n'est actuellement autorisé.
- Les contrats génériques, le PRNG seedé, le registre, les 187 automatismes et
  les objets visuels indépendants constituent la fondation à auditer et à
  réutiliser.
- `packages/moteur-exercices/src/generateurs/fractions.js` est un cartouche
  technique hérité de listes V1. Il est interdit de l'utiliser comme exemple
  pédagogique ou comme première notion V2.

## Dernier chantier terminé

La mémoire durable a été installée et les principales contradictions
documentaires ont été levées. Aucun code du moteur, aucune question et aucune
interface n'ont été créés pendant ce chantier.

## Prochaine étape

Auditer le socle technique minimal réellement nécessaire : contrat de question,
gabarit, registre et PRNG. À l'issue de cet audit, décider pour chaque fichier :
conserver, corriger ou retirer. Ne choisir la première notion qu'après cette
décision.

## Règle de mise à jour

À chaque fin de tâche, remplacer le chantier actif et la prochaine étape par
l'état réel. Ne jamais conserver ici une action déjà terminée comme si elle
était encore à faire.
