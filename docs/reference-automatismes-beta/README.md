# Référence — inventaire de la bêta Automatismes

Dossier de référence pour la future migration du moteur Automatismes derrière
le nouveau menu (`studio/automatismes/`). Il décrit ce que l'application
actuellement utilisée par les élèves sait produire, question par question.

## Provenance

- Inventaire produit par GPT le 18 juillet 2026, transmis par Gwenaël.
- Application inventoriée : dépôt `bourgault314/mathsgo-automatismes-beta`,
  commit `242c81f636e3b443af028b1fef7cd68fb9db1356` (17 juillet 2026).
- Cette bêta vit dans son propre dépôt et tourne toute seule jusqu'à son
  remplacement par la version reconstruite ici. On ne la modifie pas depuis
  ce dépôt.

## Contenu

| Fichier | Rôle |
|---|---|
| `inventaire-automatismes-beta.md` | Diagnostic lisible : cartographie des 43 modules, chaîne de génération, ordre de travail recommandé. |
| `inventaire-automatismes-beta.json` | Inventaire machine question par question : énoncé (aperçu + empreinte SHA-256), réponse, options, aléatoire, politique visuelle, aide, moteur réellement utilisé. |
| `prompt-claude-stabilisation.md` | Consignes d'étape rédigées par GPT (stabilisation du contrat de module). Conservé comme contexte. |

## Chiffres vérifiés (recomptés depuis le JSON le 18 juillet 2026)

- 43 modules ;
- 478 gabarits présents dans les banques ;
- 17 gabarits virtuels créés à l'exécution par les sélecteurs
  (`dnb_14` : 3, `dnb_15` : 3, `dnb_17` : 10, `dnb_18` : 1) ;
- 495 définitions exécutables au total.

## Usage prévu : contrat de parité

Au moment de migrer un module, cet inventaire sert d'oracle : la version
reconstruite doit savoir produire les mêmes énoncés (empreintes), les mêmes
réponses et les mêmes options que la bêta. Points de vigilance relevés par
l'inventaire :

- les 17 gabarits virtuels n'existent dans aucune banque : une migration qui
  ne lit que les banques en perdrait 17 types de questions ;
- 98 `formula_code` sont encore stockés mais court-circuités par un
  générateur spécialisé : ne pas les exécuter par erreur, ne pas les
  supprimer sans preuve de parité ;
- les options de QCM ont `errorCode: null` dans le contrat persistant, alors
  que certains générateurs savent produire des distracteurs diagnostiques ;
- 184 questions déclarent un visuel sans identifiant de composant
  réutilisable : c'est la mesure du travail d'extraction restant.

## Limite de validité

L'inventaire photographie la bêta au commit ci-dessus. Si la bêta évolue,
vérifier son commit de tête avant de s'en servir comme oracle, et régénérer
ou corriger l'inventaire en cas d'écart.
