# SPEC-MONDE-QUANTITE.md — Le pique-nique de Grand'Anse (v0.2, esquisse)

*Écrit le 19/08/2026 (session Cowork). Regrave et complète l'esquisse du 17/08
(livrée hors dépôt). Statut : la NOTION et le THÈME sont décidés par Gwenael ;
la position et les cours sont proposés-argumentés ; les niveaux sont une
ESQUISSE à mesurer au solveur avant toute construction. Rien ici n'est du code.*

## 1. La notion : la fraction d'une quantité

« Les 2/3 de 6 ». Le plus gros trou de notions du jeu — centrale en 6e-5e,
absente des 73 niveaux. **Le moteur sait déjà la faire, vérifié dans le vrai
moteur le 16/08 :** un soleil `val:[6,1]` + prisme ÷3 + loupe ×2 fabriquent
les 2/3 de 6 (R = 35, prof 4). Zéro pièce neuve à coder.

Le geste enseigné : **diviser par le nombre du bas, multiplier par le nombre du
haut** — 2/3 de 6, c'est 6 ÷ 3 = 2, puis 2 × 2 = 4. C'est aussi ce qui donne
enfin un SENS pédagogique à la loupe × (multiplier une quantité), au-delà de
son rôle mécanique du volcan.

## 2. Le thème (DÉCIDÉ par Gwenael, 17/08)

**Le pique-nique créole à Grand'Anse.** Il faut allumer le feu sous la marmite ;
le soleil est caché par les cocotiers (obstacles = cocotiers) ; le fruit du
monde = le coco. Les cibles affichent des QUANTITÉS entières (la marmite veut
4) et le soleil apporte une quantité (val:[12,1]…) — le rayon se lit en
quantité, plus seulement en fraction.

Écarté (16/08) : « Cilaos, pays des lentilles » (collision avec la pièce
Lentille +). En réserve pour d'autres mondes : l'usine de Bois-Rouge (pressenti
pour le monde des élèves), le cyclone.

## 3. La position : 7e monde (PROPOSÉ)

Entre **soleils** et **marché** : la loupe × (volcan) et les soleils à valeur
(monde 6) deviennent des prérequis naturels, et le marché (décimales, %,
remises) devient l'aboutissement — on ne peut pas parler de « 25 % de remise »
avant de savoir prendre une part d'une quantité. Coût : le marché se
reverrouille pour un élève en cours (même mécanique qu'à l'insertion de la
canne — assumé alors, à réassumer ici).

## 4. Les cours (PROPOSÉS)

- `dec:'quantite'` sur le niveau-découverte : « La moitié de 6 » — la bande de
  quantité se partage, chaque part vaut 6 ÷ 2 = 3. Scène à concevoir (une bande
  de 6 unités qu'on coupe — les scènes murs/parts savent presque le faire).
- `cours:'complement'` plus loin dans le monde : le complément à 1 — si j'ai
  pris les 5/6, il RESTE 1/6 (notion du §7 de SPEC-ORDRE-DES-NOTIONS, zéro
  code moteur).
- Règle du 17/08 respectée : chaque cours ne montre QUE ce que son niveau
  affiche.

## 5. L'arc des niveaux (ESQUISSE, ~8-10 niveaux, tout à mesurer au solveur)

1. **Découverte** : la moitié d'une quantité (soleil 6, marmite 3, boîte ÷2
   seule) — `dec:'quantite'`.
2. La fraction unitaire : 1/3 de 6 (le ÷ choisit le bas).
3. **Le geste complet** : 2/3 de 6 = (6 ÷ 3) × 2 — ÷3 puis ×2 (la mesure du
   16/08 : R = 35, prof 4 — à durcir en taillant le champ).
4. Entraînement à pièges : le MAUVAIS diviseur en boîte (÷2 quand il faut ÷3).
5. Deux marmites, deux parts différentes de la MÊME quantité (3/4 et 1/4 de 8 —
   et le complément se voit).
6. `cours:'complement'` porté ici : ce qui reste quand la part est prise.
7. Coco à valeur sur une quantité intermédiaire (ramassé par le rayon qui vaut
   4, pas par un autre) — la signature 🅑 au service de la notion.
8. **Le joyau** : les 5/6 de 12 = (1/2 + 1/3) de 12 = 6 + 4 = 10 — la lentille
   recolle des QUANTITÉS. L'addition revue sur un autre terrain, en fermeture.

Chaque niveau construit au solveur (jamais de solution dessinée d'abord),
fruits selon le menu du PLAN-FRUITS, `sol` + `solMin` dès la naissance,
des respirations gardées.

## 6. Les coûts, listés d'avance (leçons des lots passés)

- compteurs publics : 73 → ~81-83 niveaux, « neuf mondes » → « dix mondes »
  (vignette, méta, catalogue, annuaire — `npm run seo:generer`) ;
- `FRW` : coco (fruit neuf à dessiner — lot de peau, jamais mélangé) ;
- seuils recalculés, chemin de l'école re-testé (les portes de monde) ;
- clés de sauvegarde : monde ADDITIF, aucune clé existante ne change ;
- décor cocotiers (`obstacleSVG`) = lot de peau séparé.

## 7. Exclusions (décidées 17/08)

- **÷5 et les dixièmes** : c'est le trou du MARCHÉ (il parle de 0,5 sans savoir
  le construire), retouche à part, PAS dans ce monde.
- Les fractions de temps (kabar) : hors moteur, écarté.
