# Bibliothèque des logos publics

Ce dossier est l’emplacement canonique des logos utilisés par maths&go.

La centralisation est volontairement **rétrocompatible** : les fichiers historiques
restent à leur emplacement d’origine afin que les pages, PDF, favoris et liens déjà
diffusés continuent de fonctionner. Les nouveaux développements doivent utiliser les
chemins canoniques ci-dessous.

## Chemins canoniques

| Famille | Usage | Chemin canonique | Chemin historique conservé |
|---|---|---|---|
| maths&go | logo principal transparent | `/assets/img/logos/mathsgo/logo.png` | `/assets/img/mathsgo-logo.png` |
| maths&go | logo 780 px | `/assets/img/logos/mathsgo/logo-780.png` | `/assets/img/mathsgo-logo-780.png` |
| maths&go | logo 390 px | `/assets/img/logos/mathsgo/logo-390.png` | `/assets/img/mathsgo-logo-390.png` |
| maths&go | impression | `/assets/img/logos/mathsgo/logo-print.png` | `/assets/img/mathsgo-logo-print.png` |
| maths&go | variante Soley | `/assets/img/logos/mathsgo/logo-soley.png` | `/assets/img/mathsgo-logo-soley.png` |
| maths&go | variante sur fond blanc | `/assets/img/logos/mathsgo/logo-fond-blanc.png` | `/auto/assets/logo-mathsgo.png` |
| maths&go | petit M à billes | `/assets/img/logos/mathsgo/m-billes.png` | — |
| maths&go | pictogramme M vectoriel | `/assets/img/logos/mathsgo/m.svg` | `/favicon.svg` |
| maths&go | pictogramme M 192 px | `/assets/img/logos/mathsgo/m-192.png` | `/assets/img/favicon-192.png` |
| maths&go | pictogramme M 180 px | `/assets/img/logos/mathsgo/m-180.png` | `/assets/img/apple-touch-icon.png` et `/apple-touch-icon.png` |
| maths&go | pictogramme M 32 px | `/assets/img/logos/mathsgo/m-32.png` | `/assets/img/favicon-32.png` |
| CPS | cœur, dialogue et loupe | `/assets/img/logos/cps/logo.svg` | `/assets/img/icons/cps.svg` |
| Dopamine | cerveau coloré | `/assets/img/logos/dopamine/cerveau.png` | `/assets/img/logos/cerveau-dopamine.png` |
| Dopamine | cerveau et molécule | `/assets/img/logos/dopamine/logo.jpg` | `/assets/img/logos/logo-dopamine.jpg` |

Les copies canoniques et historiques d’un même fichier réutilisent exactement le
même contenu binaire dans le dépôt.

## Règles d’utilisation

1. Ne jamais supprimer un chemin historique : il sert d’alias de compatibilité.
2. Pour une nouvelle page, référencer le chemin canonique.
3. Ne pas créer de nouvelle copie en `data:` ou en base64 dans une page HTML.
4. Pour les PDF publics, utiliser le logo maths&go actuel sans l’ancienne baseline
   « Manipuler • Comprendre • Progresser ».
5. Les images `partage-mathsgo.png` et `partage-catalogue.png` sont des cartes
   de partage social, pas des logos ; elles restent dans `/assets/img/`.
6. Le logo du collège Paul-Hermann et les documents propres à l’établissement
   restent dans les sources privées et ne doivent pas entrer dans ce dépôt public.

## Migration progressive

Certaines pages historiques contiennent encore un logo intégré directement dans
leur HTML, notamment dans l’espace CPS et dans des gabarits d’impression. Elles ne
sont pas modifiées par ce premier lot afin de ne pas changer leur fonctionnement
hors connexion ou leur rendu. Leur remplacement fera l’objet de lots séparés,
après vérification visuelle et fonctionnelle.
