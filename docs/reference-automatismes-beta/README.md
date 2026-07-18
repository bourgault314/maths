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

## Usage prévu : inventaire de couverture uniquement

Au moment de reconstruire une notion, cet inventaire permet de vérifier qu'une
famille de situations n'a pas été oubliée. Il ne sert jamais d'oracle pour les
énoncés, les réponses, les options, les paramètres ou les algorithmes. La V2
doit être écrite indépendamment et sa couverture se mesure par les notions du
programme. Points de vigilance historiques relevés par l'inventaire :

- les 17 gabarits virtuels n'existent dans aucune banque : ils signalent des
  familles de situations à examiner, pas des questions à reproduire ;
- 98 `formula_code` sont encore stockés mais court-circuités par un
  générateur spécialisé : ils documentent la dette de la bêta et ne doivent
  jamais entrer dans V2 ;
- les options de QCM ont `errorCode: null` dans le contrat persistant : cette
  information peut orienter l'étude des erreurs d'élèves, sans autoriser la
  reprise des distracteurs ;
- 184 questions déclarent un visuel sans identifiant de composant
  réutilisable : c'est la mesure du travail d'extraction restant.

## Limite de validité

L'inventaire photographie la bêta au commit ci-dessus. Si la bêta évolue,
vérifier son commit de tête avant de l'utiliser pour mesurer la couverture, et
régénérer ou corriger l'inventaire en cas d'écart.
