# État du chantier Automatismes V2

**Dernière mise à jour : 19 juillet 2026.**

## Point de départ vérifié

- Dépôt : `bourgault314/maths`.
- Branche de référence : `main`.
- Commit de départ vérifié : `1bf3b3831979a995f02201b1d3a3800863aed60c`.
- PR #151 fusionnée : le contenu prématuré issu de la PR #144 a été retiré.
- PR #150 fermée sans fusion : son socle surdimensionné ne doit pas être repris.
- PR #154 fusionnée : l'audit du socle minimal et les décisions D-011 et D-012
  sont devenus la référence.
- PR #155 fusionnée : le socle est désormais nettoyé, renforcé et protégé par
  des garde-fous automatiques.
- PR #145 ouverte : ne pas la fusionner telle quelle, car elle vise aussi des
  fichiers retirés par la PR #151. Son idée de garde-fou de provenance reste à
  réétudier.

## État fonctionnel

- La bêta continue de fonctionner séparément et est gelée hors correction
  critique.
- Aucun contenu pédagogique V2 n'est actuellement construit ou publié. La
  première fiche peut être préparée au statut `a_faire`, puis doit être validée
  par Gwenaël avant toute programmation.
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

## Chantier actif

La première fiche brouillon est **Nombres et calculs → Puissances → Puissances
simples (4e)**. Elle cible l'automatisme officiel `4-13` et est séparée des
carrés parfaits, des puissances de dix et des règles de calcul de 3e.

Le fichier est `notions/nombres-et-calculs/puissances-simples-4e.md`. Il ne
contient aucun code de question et attend la validation de Gwenaël.

## Prochaine étape

Lire et valider ou corriger cette fiche avec Gwenaël. Après validation
seulement, construire le générateur de cette unique micro-notion, ses tests,
ses aides et son aperçu mobile.

## Règle de mise à jour

À chaque fin de tâche, remplacer le chantier actif et la prochaine étape par
l'état réel. Ne jamais conserver ici une action déjà terminée comme si elle
était encore à faire.
