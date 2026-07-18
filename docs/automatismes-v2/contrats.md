# Les contrats V2

Un « contrat » est un format de données **plus un validateur**. Le validateur
n'est pas un luxe : c'est lui qui transforme une erreur silencieuse en message
lisible, au moment où l'erreur est commise et non trois écrans plus loin.

Tous les validateurs suivent la même forme :

```js
const controle = validerX(valeur);
// → { valide: true, erreurs: [] }
// → { valide: false, erreurs: ["champ : ce qui ne va pas"] }
```

Ils ne lèvent pas et ne modifient rien : ils renvoient **la liste complète**
des problèmes, pour qu'on puisse tout corriger d'un coup.

## Vue d'ensemble

| Contrat | Fichier | Ce qu'il décrit |
| --- | --- | --- |
| `mathsgo.programme/1` | `contrats/src/programme.js` | Une ligne officielle du BO et les règles de datation |
| `mathsgo.module-questions/1` | `contrats/src/module-questions.js` | Un module, ses notions atomiques, ses gabarits |
| `mathsgo.question-instance/2` | `contrats/src/question-instance-2.js` | Une question figée, prête à afficher |
| `mathsgo.reponse/1` | `contrats/src/reponse.js` | Lecture et acceptation d'une réponse d'élève |
| `mathsgo.visuel/1` | `contrats/src/visuel.js` | La référence à un objet visuel |
| `mathsgo.aide/1` | `contrats/src/aide.js` | Une aide et sa place dans le cheminement |
| `mathsgo.serie-definition/2` | `contrats/src/serie.js` | Ce que l'utilisateur a demandé |
| `mathsgo.serie-instance/2` | `contrats/src/serie.js` | Ce que le moteur en a tiré |
| `mathsgo.tentative/1` | `contrats/src/serie.js` | Une réponse d'élève à une question |
| `mathsgo.generateur/1` | `contrats/src/generateur.js` | La carte d'identité d'un générateur |

Les contrats de la V1 (`question.js`, `gabarit.js`) restent **intacts** : ils
servent encore l'application actuelle.

## Ce que chaque contrat garantit vraiment

### Programme — le calendrier vit ici, et nulle part ailleurs

`programmeEnVigueur(niveau, année)` et `estActif(référence, année)` sont les
deux seules fonctions qui connaissent les dates. Voir
[programme-et-profils.md](programme-et-profils.md).

### Question-instance/2 — une donnée, jamais un dessin

Une question contient des **blocs** : `texte`, `latex`, ou `objet`. Un bloc
`objet` **nomme** un objet officiel et lui passe des paramètres sémantiques.
Il ne contient jamais de SVG.

La réponse est **typée** et porte une valeur canonique exacte, séparée de son
écriture. Les modèles d'erreurs sont validés : aucun ne peut être égal à la
bonne réponse, ni faire doublon avec un autre.

### Réponse — trois garanties

1. **Rien n'est exécuté.** Grammaire fermée, tout caractère inconnu est refusé.
2. **Rien n'est approximé.** Comparaisons par produit en croix sur des entiers.
3. **L'écriture française est légitime.** Virgule décimale, espaces de milliers
   (y compris insécables), signe moins typographique : ce sont des façons
   correctes d'écrire, pas des fautes à corriger en douce.

Ce qu'on accepte est **déclaré**, jamais implicite :

| Politique | Effet |
| --- | --- |
| `exacte` | La forme compte : `3/6` est refusé si on attend `1/2` |
| `valeur-egale` | `3/6`, `1/2` et `0,5` se valent |
| `fraction-equivalente` | Les fractions égales passent, un décimal non |
| `arrondi` | Approximation acceptée, à la précision **déclarée** |

Un diagnostic ambigu — deux modèles d'erreurs donnant la même valeur — est
signalé comme incertain. On ne tranche jamais au hasard.

### Visuel — la règle qui protège la pédagogie

Un visuel de rôle `donnee` porte une information **indispensable** à l'énoncé.
Le contrat refuse donc qu'il soit facultatif, et refuse qu'il soit rangé dans
une aide : cacher une donnée derrière un bouton « aide » changerait la
question posée.

Aucune couleur ne peut entrer dans un visuel — même enfouie au fond d'un
paramètre. La couleur est une décision de charte, nommée par un **rôle**.

### Aide — un cheminement, pas un texte de secours

Six genres, dans l'ordre : `reperage`, `rappel`, `representation`,
`propriete`, `amorce`, `erreur`. Le validateur refuse une suite qui remonte
(une amorce avant un repérage) et refuse deux fois le même genre.

Les aides de genre `erreur` sortent du cheminement : elles répondent à ce que
l'élève vient d'écrire, et doivent **nommer le modèle d'erreur** qui les
déclenche. Sans ce lien, une aide d'erreur serait un commentaire flottant.

### Série — séparer la demande du résultat

C'est la distinction qui rend le partage sans serveur possible :

- la **définition** est petite et voyage dans le code ;
- l'**instance** est volumineuse et se reconstruit à partir de la définition.

L'instance porte les versions du moteur (`aleatoire`, `selection`, `banque`)
et une **empreinte de reproductibilité**. Sans les versions, « même code, même
série » serait un vœu et non une garantie.

### Tentative — un contrat, pas un stockage

Le contrat existe pour que rien ne se fige mal plus tard, mais **le cœur ne
conserve rien** : ni `localStorage`, ni serveur. La date est facultative et
fournie de l'extérieur — le moteur n'a pas le droit de lire l'horloge.

### Générateur — ce qui peut exécuter doit être déclaré

Un générateur déclare son nom, sa version, et sait :

1. refuser des paramètres qu'il ne peut pas honorer — **avant** tout tirage ;
2. produire une question ;
3. vérifier ses propres **invariants**, à chaque tirage.

Les invariants sont l'endroit où l'on écrit ce qu'une question de cette
famille doit toujours vérifier. Sans eux, un générateur finit par produire des
questions absurdes que personne ne voit avant la classe.

Quand un tirage échoue, la boucle de rejet est **bornée**, puis un **repli
déterministe** prend le relais ; à défaut, l'échec est clair et nommé. Une
boucle sans borne figerait le téléphone d'un élève, en silence.
