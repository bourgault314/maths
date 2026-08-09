# Règles de travail du dépôt maths&go

Le dépôt GitHub est la source de vérité. Avant toute tâche concernant
Automatismes V2, lire dans cet ordre :

1. `docs/automatismes-v2/pilotage.md` ;
2. `docs/automatismes-v2/taxonomie-competences.json` ;
3. `docs/automatismes-v2/etat.md` ;
4. `docs/automatismes-v2/decisions.md` ;
5. `docs/automatismes-v2/gabarit-fiche-pedagogique.md` ;
6. `docs/automatismes-v2/inventaire-auto-studio.md` ;
7. la fiche du module concerné, lorsqu'elle existe.

## Règles générales

- Préserver les modifications existantes et travailler sur une branche courte.
- Annoncer l'objectif et le périmètre avant toute modification.
- Une seule tâche V2 est active à la fois ; ne pas ouvrir plusieurs chantiers
  indépendants en parallèle. Pour le contenu pédagogique, l'unité de chantier
  est le module visible. Il peut réunir plusieurs micro-notions proches
  lorsqu'elles forment une seule entrée cohérente pour l'élève.
- Ne jamais fusionner une pull request sans validation explicite de Gwenaël.
- JavaScript moderne, sans dépendance externe ni compilation.
- Toute logique testable doit fonctionner avec `node --test`, sans navigateur.
- Vérifier les cas limites mathématiques et le déterminisme des générations.

## Automatismes V2

- **Périmètre immédiat : exclusivement le DNB.** La liste officielle des
  attendus de l'épreuve dit ce qui doit être couvert et quand cette première
  phase est complète. Elle ne fixe pas l'ordre de fabrication, qui relève de la
  carte de pilotage maths&go (D-013, D-014 et D-043).
- L'ancienne banque et la bêta sont des inventaires de notions, jamais des
  sources d'énoncés, de paramètres, de valeurs, de distracteurs ou de code.
- L'ancienne banque s'ouvre en **archive**, notion par notion et seulement au
  moment de traiter cette notion, pour y retrouver les apports de Gwenaël.
- Aucun élément ancien n'entre dans V2 sans provenance identifiée et validation
  explicite de Gwenaël — y compris un élément qu'il a écrit lui-même.
- Les noms `dnb_*`, l'arborescence des 43 modules et leurs identifiants restent
  historiques. V2 utilise des noms français issus du programme et de la
  taxonomie maths&go, sans correspondance un-à-un avec l'ancienne banque.
- Les identifiants canoniques V2 sont descriptifs et stables. Les codes courts
  `NC`, `AL`, `PF`, `GM`, `GE`, `DS` et `PI` sont seulement des alias humains de
  pilotage ; ni un ordre, ni un code DNB n'est déduit de leur numéro.
- La bêta est gelée, sauf correction critique distincte du chantier V2.
- Aucun contenu pédagogique réel n'est programmé avant validation de sa fiche
  par Gwenaël.
- Travailler module visible par module visible, puis micro-notion par
  micro-notion à l'intérieur du module lorsque son découpage l'exige.
- Réutiliser les fondations indépendantes validées ; ne pas refaire les objets
  visuels acquis sans raison établie.
- Ne pas reconduire automatiquement l'interface, les couleurs ou l'organisation
  de la bêta.
- Ne pas introduire GeoGebra sans demande explicite.
- Les états d'avancement sont `a_faire`, `construit` et `valide`.
- Un contenu non `valide` ne doit jamais être exposé aux élèves.
