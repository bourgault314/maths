# État du chantier Automatismes V2

**Dernière mise à jour : 19 juillet 2026.**

## Point de départ vérifié

- Dépôt : `bourgault314/maths`.
- Branche de référence : `main`.
- Commit de départ vérifié : `2b70f1477d6bb8bf7410d976d8c2fa157f7a1cb8`.
- PR #151 fusionnée : le contenu prématuré issu de la PR #144 a été retiré.
- PR #150 fermée sans fusion : son socle surdimensionné ne doit pas être repris.
- PR #154 fusionnée : l'audit du socle minimal et les décisions D-011 et D-012
  sont devenus la référence.
- PR #145 ouverte : ne pas la fusionner telle quelle, car elle vise aussi des
  fichiers retirés par la PR #151. Son idée de garde-fou de provenance reste à
  réétudier.

## État fonctionnel

- La bêta continue de fonctionner séparément et est gelée hors correction
  critique.
- Aucun contenu pédagogique V2 n'est actuellement autorisé.
- Les contrats génériques, le PRNG seedé et le registre ont été nettoyés et
  renforcés. Ils ne dépendent plus d'un générateur ou d'un module historique.
- Les 187 automatismes officiels et les objets visuels indépendants restent
  disponibles pour les futures fiches de notion, au besoin.

## Derniers chantiers terminés

La mémoire durable a été installée et les principales contradictions
documentaires ont été levées. Aucun code du moteur, aucune question et aucune
interface n'ont été créés pendant ce chantier.

Le socle minimal a ensuite été audité puis nettoyé :

- suppression du générateur de fractions hérité, de son export et des tests
  qui exécutaient un ancien module ;
- remplacement de tous les exemples concernés par des fixtures techniques ;
- validation des données JSON pures, des identifiants, des graines et des
  intervalles aléatoires ;
- copie profondément figée des paramètres transmis aux générateurs ;
- garde-fou exécuté par `npm run verifier` contre les noms historiques, le
  hasard non seedé et l'exécution dynamique dans le périmètre V2.

Le rapport de décision détaillé reste dans
`audit-socle-2026-07-18.md`. Le lot complet réussit **683 tests sur 683**.

## Les tests MG1 sont une passerelle, pas une cible

`studio/automatismes/` est le nouveau menu branché sur le moteur **actuel**.
Ses tests (`studio/automatismes/mg1.test.js`) exigent volontairement des codes
de série identiques à ceux de l'application d'aujourd'hui : c'est ce qui permet
d'essayer le menu avec les vraies questions sans attendre la migration.

Ils mesurent donc une compatibilité temporaire avec l'ancien moteur, jamais
l'indépendance de V2. La décision D-012 n'est pas contredite : cette passerelle
est un échafaudage déclaré, qui disparaît avec `auto/` le jour où le moteur est
migré. Aucun code ni aucun test de V2 ne doit dépendre d'eux ; lire « tous les
tests passent » comme « le socle est indépendant » serait une erreur de lecture.

## Lot technique du 19 juillet 2026 (en attente de fusion)

Chantier séparé, sans aucun contenu pédagogique : la palette de Pythagore est
passée dans `packages/charte`, la dernière dépendance `packages/objets` →
`studio/` a disparu (le composant du studio réexporte désormais la fondation),
et le garde-fou de V2 couvre les cinq dossiers du périmètre au lieu de deux.
Le garde-fou est lui-même testé, règle par règle.

## Prochaine étape

Après fusion du nettoyage technique, choisir la première catégorie depuis les
données du programme officiel et la taxonomie maths&go, puis préparer la
première fiche pédagogique de notion. Aucun générateur réel ne sera écrit avant
validation de cette fiche par Gwenaël.

## Règle de mise à jour

À chaque fin de tâche, remplacer le chantier actif et la prochaine étape par
l'état réel. Ne jamais conserver ici une action déjà terminée comme si elle
était encore à faire.
