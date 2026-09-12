# Banque de jeux-cadeaux

Cette banque est destinée à la rubrique publique « Jeux ». Pendant les essais,
elle reste isolée sur sa branche de travail.

## Accès

- `/jeux-cadeaux/` : atelier libre de test.
- `/jeux-cadeaux/?mode=cadeau&parties=1` : coffre donnant une partie.
- `/jeux-cadeaux/?mode=cadeau&parties=2&jeu=luciole` : deux parties du jeu imposé.
- `retour=/chemin/` : retour automatique après la dernière partie.

Jeux disponibles : `luciole`, `dodo`, `galets`, `tempo`.

Le mode cadeau masque le rejeu après la dernière partie. Si `retour` est fourni,
la page revient automatiquement au parcours après quatre secondes.
