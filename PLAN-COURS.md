# PLAN-COURS.md — Les cours manquants des mondes 4 à 9

*Écrit le 19/08/2026 (session Cowork), mesures refaites sur main `49c7b939`.
Statut : l'inventaire est MESURÉ ; la liste des cours à créer est PROPOSÉE, à
valider cours par cours (porteur, métier, contenu) avant toute construction.
C'est le premier chantier de la feuille de route post-audit.*

## 1. Le constat mesuré (19/08)

La règle du §6 — **« une notion s'enseigne UNE fois, avant qu'on s'en serve »**
— est tenue jusqu'à la forêt, puis plus du tout :

- les **14 cours** existants vivent tous dans les mondes 1 à 4 (lagon, canne,
  pitons, forêt) ; **volcan, soleils, marché, tunnels et Mafate : ZÉRO cours** ;
- **24 niveaux** portent une CALC d'addition ; **3 cours** seulement enseignent
  l'addition (`somme` 1/3 + 1/3, `denominateur` 1/2 + 1/4, `moities`
  1/2 + 1/2 à la cueillette) ;
- **10 niveaux** utilisent la loupe × ; elle n'est JAMAIS enseignée ;
- le marché repose sur les écritures décimales et les % — CALC seulement,
  aucun cours.

## 2. La doctrine qui cadre (décisions de Gwenael, gravées)

- 18/08 (§6.13-6.14) : **on ne force pas les additions, elles apparaissent
  naturellement — on les NOMME quand elles arrivent.** Une découverte force par
  sa cible ; un puzzle peut forcer APRÈS l'apprentissage ; jamais avant.
- 17/08 : **un cours ne montre que ce que SON niveau affiche.**
- 15/08 : scènes à deux lignes au plus (sauf opt-in `unite:true`).
- Les quatre métiers existent déjà : `dec` (enseigne + jalonne), `cours`
  (enseigne après victoire), `intro` (explique avant de jouer), `coursFruits`
  (célèbre la cueillette). **Aucun moteur à écrire** : ce chantier n'ajoute que
  des champs et des entrées COURS — zéro niveau touché.

## 3. Les cours proposés (à valider un par un)

| # | Cours | Porteur proposé | Métier | Contenu (esquisse) |
|---|---|---|---|---|
| 1 | `loupe` | « La loupe » (volcan 1er) | `cours` | la loupe × multiplie le rayon : 1/3 × 2 = 2/3 — le niveau vient de le faire vivre |
| 2 | `depasse-un` | « Un et demi » (soleils) | `cours` | 1 + 1/2 = 3/2 : une somme peut dépasser l'entier — scène somme avec `unite:true` (existe déjà) |
| 3 | `conversion` | « Cinq sixièmes » (forêt) | `cours` | 1/2 + 1/3 = 3/6 + 2/6 = 5/6 : mettre au même dénominateur quand AUCUN ne divise l'autre (le pas au-delà de `denominateur`) |
| 4 | `decimales` | « Écritures décimales » (marché 1er) | `cours` | 1/2 = 0,5 : la MÊME part, une autre écriture (prolonge le cours `ecritures` des pitons) |
| 5 | (à nommer) | « L'addition du marché » (marché) | `cours` | 1/3 × 2 = 2/3 puis 2/3 + 1/3 = 3/3 = 1 : le niveau force VRAIMENT ce geste depuis le lot vérité — il mérite d'être nommé |

Candidats NON retenus d'office (à discuter seulement si Gwenael y tient) :
les pourcentages (le cours `decimales` peut les dire en une ligne ou pas du
tout), « Les soleils jumeaux », les scellées et les tunnels (mécaniques de
plateau : une bande de fractions ne sait pas les dessiner — même verdict que
l'audit d'organisation, lot E).

## 4. Points de conception à trancher avec Gwenael

1. Le cours de la loupe : `cours` (après victoire) ou `intro` (avant de jouer,
   comme la porte) ? Avis Claude : `cours` — le niveau est simple et SE suffit,
   la porte avait besoin d'être expliquée AVANT parce qu'elle refuse sans dire
   pourquoi.
2. « Cinq sixièmes » est aussi un niveau immesurable au solveur (voir
   PLAN-FRUITS §2) : lui donner son cours d'abord, l'assainir au chantier
   fruits ensuite — les deux chantiers ne se marchent pas dessus (l'un ajoute
   un champ, l'autre retouche le plateau) mais l'ORDRE des PR doit le dire.
3. Le nom du cours n°5 (addition du marché) et son titre d'affichage.

## 5. Preuves attendues du lot (quand il se construira)

Zéro niveau modifié (vérificateur : les 73 blocs intacts hors champs `cours:`
ajoutés) ; les tests permanents des cours étendus (listes coursIds/titres, test
CI « les cours en bandes démontrent ce qu'ils affirment » pour toute scène à
parts) ; batteries complètes ; captures des 5 panneaux pour validation de
Gwenael AVANT la session Code.
