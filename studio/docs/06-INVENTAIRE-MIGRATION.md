# Inventaire et migration

Ce document suit ce qui peut alimenter le moteur sans imposer une migration
immédiate.

## Automatismes

### Éléments déjà solides

- application découpée dans `/auto` ;
- 40 modules enregistrés avec identifiants permanents ;
- données réparties par grands domaines ;
- génération reproductible par seed ;
- contrat de séries partageables ;
- `questionInstanceId`, `seriesId`, `templateId` et versions de gabarits ;
- `AttemptRecorder` préparé mais désactivé ;
- modes diaporama et interactif séparés dans le code.

### Éléments encore trop couplés

- moteur de questions volumineux ;
- dessins SVG et règles de génération parfois dans le même fichier ;
- contenus hérités encore marqués `legacy-adapted` ;
- certaines familles pédagogiques non finalisées ;
- styles spécifiques au diaporama mêlés aux contenus.

### Décision

Ne pas extraire l'ensemble maintenant. Choisir plus tard un module finalisé,
construire un adaptateur et vérifier l'équivalence avant de poursuivre.

## Ressources candidates pour les pilotes

| Source actuelle | Futur composant | État initial |
|---|---|---|
| parcours d'Axelle | groupes de billes | brouillon à consolider |
| mur de fractions | bandes/murs de fractions | riche, contrat à définir |
| Splat | Splat et total | moteur existant à inventorier |
| problèmes en barres | schéma partie-tout | moteur existant à inventorier |
| outils d'angles | angles et codages | conventions à centraliser |
| tuiles algébriques | tuiles `x²`, `x`, unité | plusieurs modes graphiques |
| nombres relatifs | jetons signés | conventions déjà précises |

### Module prioritaire : nombres relatifs dans Automatismes

Le premier branchement prévu dans le moteur est constitué de deux modules
réutilisables :

- `dnb_38` — addition de nombres relatifs avec jetons manipulables ;
- `dnb_39` — soustraction de nombres relatifs avec paires nulles et zone à
  retirer.

Ils sont classés `5e`, `4e` et `3e`, mais pas `DNB` : l'intégration dans
Automatismes sert à la consolidation du cycle 4 et à la réutilisation dans les
activités, pas à présenter ces notions comme des automatismes spécifiques du
DNB. Ils doivent conserver les modes Avec aide / Sans aide, Diaporama et
Interactif, ainsi que le cours associé.

## Nettoyage du 15 juillet 2026

- `/auto` reste la version découpée et canonique des automatismes ;
- l'ancienne page autonome
  `/outils/automatismes/automatismes_mathsgo.html` est supprimée ; son historique
  reste récupérable dans Git ;
- la page `/outils/automatismes/` est conservée : elle présente l'outil et le
  livret A5, ce n'est pas un doublon ;
- les PDF existants sont conservés : ils représentent des variantes publiées ;
- la copie locale du logo dans `/outils/angles` est supprimée ; les outils
  utilisent désormais le logo central `/assets/img/mathsgo-logo.png` ;
- aucun fichier versionné n'est supprimé sans vérification de ses liens.

## Règle de migration

Pour chaque élément :

1. identifier la source et les usages actuels ;
2. documenter les conventions pédagogiques ;
3. définir les paramètres ;
4. créer les exemples de référence ;
5. extraire sans modifier le rendu ;
6. brancher l'ancien outil sur le nouveau composant ;
7. comparer et tester ;
8. déclarer le composant validé ;
9. seulement ensuite, retirer l'ancienne implémentation.
