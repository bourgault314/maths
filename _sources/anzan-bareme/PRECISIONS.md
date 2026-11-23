# Barème révisé d'Anzan — précisions du lot 1

Le barème (`Anzan-bareme-revise.md`, 22/11/2026) laisse quelques points ouverts.
Voici comment le moteur (`outils/calcul_mental/flash_anzan_core.js`) les tranche,
après la relecture du tirage par Codex le 22/11/2026. Les codes sont ceux du
moteur : F23 est l'étape ajoutée pour la double retenue au 10e kyu, les codes
du Flash sont donc décalés d'un rang, à partir de là, par rapport au barème écrit.

- **Sous-totaux (toute la Colonne).** Le boulier n'est jamais vide en cours de
  calcul : chaque sous-total vaut au moins 1, le résultat aussi.
- **C06.** Deux groupes qui ne se recouvrent pas : 5 calculs avec une seule
  retenue avec complément à 5 et aucun emprunt de cette sorte — les additions
  seules en font partie (1 + 7 + 6) ; 5 autres avec un emprunt avec complément
  à 5 et aucune retenue de cette sorte.
- **C12.** Le geste annoncé (passage à la centaine, double retenue, retenue en
  cascade) est celui d'un seul nombre, le 2e ou le 3e ; l'autre entre sans
  aucune retenue.
- **C13, C15, C16.** L'emprunt en cascade (116 − 18 : la dizaine vide fait
  prendre sur la centaine) a son étape, C18. Avant elle, aucune étape n'en pose :
  les 4 emprunts « sur la centaine » de C13 sont directs (64 + 52 − 38), et le
  tirage libre de C15 et C16 écarte les calculs qui en contiennent.
- **C18.** Ses 3 calculs « sans cascade » sont ceux de C17 (une ou deux
  retenues, ou un ou deux emprunts), une addition ou une soustraction à chances
  égales.
- **C25, C26.** Les colonnes à 4 nombres enlevés sont tirées comme les autres
  profils : des nombres au hasard, gardés si aucun sous-total ne tombe sous 1.
  Aucun nombre n'est retouché, et une colonne mixte a toujours ses 4 nombres
  enlevés (du 3e au 9e).
- **Deux calculs « pareils ».** Un passage ne pose jamais deux fois le même
  calcul, dans le même ordre. 2 + 5 et 5 + 2 peuvent se suivre : sur le boulier,
  ce ne sont pas les mêmes gestes.
- **Le même résultat (23/11/2026).** Un passage n'a jamais assez de calculs au
  même résultat pour réussir en répondant toujours pareil : 6 au plus au Flash,
  7 en Colonne (3 et 4 sur les 5 calculs d'un entraînement). La règle ne joue
  vraiment qu'à F02 : 14 de ses 23 calculs possibles valent 9, et « 9 » dix
  fois suffisait dans un passage sur trois. Le 9 y reste le résultat le plus
  fréquent ; rien d'autre ne change.
- **Un nombre ajouté puis retranché (23/11/2026, choix de Gwenaël).** Avec des
  nombres d'un chiffre, un nombre n'est jamais ajouté et retranché dans le même
  calcul : en Colonne tout est écrit d'un coup, et « 9 + 8 + 7 − 9 − 8 + 4 − 1 »
  se lisait « 7 + 4 − 1 » (68 % des calculs de C08 et C09, 41 % de C03 et C07).
  Dès deux chiffres, le hasard n'en donne presque plus (0 à 4 %) : rien n'y est
  imposé.
- **Un Flash interrompu (23/11/2026).** Quand l'onglet est caché pendant un
  Flash, le calcul est remplacé au retour par un autre calcul du même profil,
  jamais par un calcul du passage ; aux deux étapes « les dix », il change de
  place avec un calcul pas encore montré. (Avant, c'était un tirage libre, qui
  pouvait sortir de ce que l'étape promet.)
- **À regarder à l'essai avec un élève** (rien n'est changé) : la marche
  F40 → F41 au 2e dan, de 3 à 4 nombres de 3 chiffres dans les mêmes
  4 secondes ; et la marche du 15e au 14e kyu (de 7 à 10 nombres, de 2 à 4
  retenues possibles à 4 ou 5 imposées). Y glisser une étape demande une
  conversion des rangs enregistrés (voir AGENTS.md).
