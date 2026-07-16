# Sources des gabarits imprimables

Les fichiers commençant par `_` sont les sources modifiables. Les PDF sans `_`
sont les versions publiques liées depuis le catalogue maths&go.

Pour tout recompiler depuis la racine du dépôt :

```bash
bash scripts/compiler-gabarits.sh
```

Le logo commun est `assets/img/mathsgo-logo.png` et l’adresse imprimée est
`mathsgo.re`. Aucun fichier ne dépend d’un chemin local `/mnt/data`.

Le gabarit de partage équitable n’a été fourni qu’en PDF. Sa version reçue est
conservée dans `_source_gabarits_partage_equitable.pdf`; le script ajoute la
signature web au PDF public sans toucher au contenu pédagogique.
