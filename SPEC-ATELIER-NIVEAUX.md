# L'atelier Solèy — spec v1.2 du concepteur de niveaux

*Rédigée le 15/08/2026, ancrée sur le dépôt à jour (main = 5ff8774, après la PR #365).
Statut : v1.2, validée par Gwenael le 15/08 (« ça me va » + décision d'accès :
URL cachée seule, voir §3). Prête pour la session Code —
`PROMPT-session-atelier.md` l'accompagne.*

*v1.2, même jour : la spec a été relue ligne à ligne contre le code réel de
`origin/main` (= `b05205ce`, un commit de documentation après `5ff8774`).
Trois erreurs de fait corrigées, et le mode d'emploi technique complété de ce
qu'il fallait vraiment savoir pour construire sans toucher au jeu. Le contenu,
les décisions et le périmètre ne changent pas — le détail est au §13.*

---

## 1. Pourquoi cet outil

Le verdict sur le monde de la canne l'a montré : concevoir un niveau qui fait
chercher, c'est un métier d'œil et de goût. Gwenael a cet œil — il joue à
l'original, il a trouvé sa propre solution sur 3:5, il sent en trente secondes
si un niveau est creux. L'atelier le met à la place du concepteur : tous les
objets du jeu dans une palette, une grille vide, et le vrai moteur pour tester
immédiatement ce qu'il vient de poser.

L'atelier sert trois usages, du plus immédiat au plus lointain :

1. **Créer des niveaux neufs** — les poser, les jouer, les exporter vers le jeu.
2. **Retoucher les niveaux existants** — charger n'importe lequel des 69 niveaux
   en ligne, le densifier, déplacer un fruit, ajouter un piège, rejouer. C'est
   l'outil rêvé du chantier refonte.
3. **Un jour, mesurer** — quand le solveur existera (essai Opus en cours), un
   niveau sorti de l'atelier pourra passer au banc de mesure. L'atelier prévoit
   la place, sans rien construire de plus au lot 1.

## 2. Principes (à graver si validés)

- **L'atelier est l'outil de Gwenael, pas des élèves.** Page cachée, sans lien
  depuis le site, hors sitemap, hors annuaire. Une version élèves serait un
  chantier à part entière (voir §11).
- **Le lot est purement additif.** Deux fichiers nouveaux
  (`outils/club_maths/soley-atelier.html` + `outils/club_maths/soley/js/atelier.js`) ;
  les quatre modules du jeu (`levels/engine/render/ui`) et `soley.html` restent
  **inchangés à l'octet** — c'est l'invariant central de la batterie du lot.
  L'atelier importe les modules existants et construit par-dessus.
- **Le vrai moteur, pas une imitation.** Le mode Jouer utilise `simulate()` et le
  rendu du jeu tels quels. Ce que l'atelier montre est exactement ce que
  l'élève verra.
- **La sauvegarde du jeu est sacrée.** L'atelier ne lit ni n'écrit jamais
  `soley-save-v5` (voir §8 — test obligatoire). Attention : cela ne s'obtient
  pas tout seul — `engine.js` lit la clé au chargement du module — et cela ne
  demande pourtant AUCUNE retouche du jeu. Le procédé exact est décrit dans
  l'annexe technique, à lire avant d'écrire la première ligne.
- **Téléphone d'abord**, comme le jeu : toucher-toucher, l'atelier doit être
  agréable sur l'appareil où Gwenael joue. La souris marche aussi.

## 3. Où ça vit

- URL : `mathsgo.re/outils/club_maths/soley-atelier.html`. `meta robots
  noindex`, absente de `sitemap.xml` (même statut que le musée
  `soley-v1.html`), absente du catalogue (donc aucune page générée à
  régénérer — la leçon de l'annuaire du lot canne ne se déclenche pas).
- **Décision d'accès (Gwenael, 15/08) : URL cachée seule, aucun lien dans le
  jeu.** À ne pas confondre avec le mode classe (`soley.html?classe`, qui
  ouvre les mondes du JEU) : l'atelier est une page à part où tout est
  disponible par nature, sans déblocage. L'activité élèves est possible dès le
  lot 1 sans rien changer : Gwenael donne l'adresse quand il propose
  « concevez votre niveau » — le niveau d'un élève n'existe que sur son
  appareil, la remise passe par le bloc exporté, et rien n'entre dans le jeu
  sans le circuit habituel (audit + batterie + Merge). Une entrée visible
  (ex. carte sous Mafate) est une décision de v2, éclairée par un essai réel
  en classe.
- La page charge `soley/css/soley.css` + les modules du jeu + `atelier.js`.
  Elle reprend la coquille de l'écran de jeu (plateau, boîte, fenêtres) et y
  ajoute l'écran Atelier.

## 4. Deux écrans, une bascule

En haut de page, deux onglets : **Atelier** (construire) et **Jouer** (tester).
La bascule est instantanée et sans perte : on pose trois roches, on essaie, on
revient, on en pose une quatrième. C'est cette boucle de dix secondes qui fait
la valeur de l'outil.

## 5. L'écran Atelier

### La grille
- Largeur × hauteur réglables par petites flèches : colonnes 5 à 12, rangées
  4 à 8. Cette plage est volontairement un peu plus large que celle du jeu :
  relevé sur les 69 niveaux, l'existant va de 7×5 (le tutoriel) à 12×8 (les
  grands mondes), soit 7 à 12 colonnes et 5 à 8 rangées — aucun niveau n'a 11
  colonnes. On laisse descendre jusqu'à 5×4 pour que l'atelier puisse essayer
  plus petit que tout ce qui existe. Défaut 9×6, la taille la plus courante du
  jeu (10 niveaux). À partir de 10 colonnes,
  un rappel doux : le jeu conseille déjà de tourner le téléphone à cette
  taille, et « le nombre de cases est borné par la taille du téléphone »
  (décision du 13/08). On ne bloque pas.
- Rétrécir la grille alors que des objets déborderaient : l'atelier refuse et
  montre lesquels.

### La palette (objets du plateau)
Une rangée d'icônes, celles du jeu. On touche un objet, puis une case : posé.
On touche un objet posé : sa **fiche** s'ouvre (réglages + « Retirer »).

| Objet | Réglages dans la fiche |
|---|---|
| Soleil | direction (0 N, 1 E, 2 S, 3 O), valeur (1 par défaut ; entier ou fraction — soleils multiples et fractionnaires du monde des soleils) |
| Case créole | fraction attendue `need`, porte orientée (aucune / N / E / S / O), écriture affichée `disp` optionnelle (« 0,5 », « 25 % », « 2/4 » — le monde du marché) |
| Roche | aucun réglage (au monde canne elle se dessinera en cannes toute seule : le rendu dépend du monde choisi, comme dans le jeu) |
| Fruit | simple, ou marqué d'une valeur n/d (letchi difficile) |
| Passe étroite | fraction maximale `max` |

### La boîte à outils (pièces)
Un tiroir séparé : Miroir, Prisme ÷2, Prisme ÷3, Lentille +, Loupe ×2, Loupe ×3.
- « Ajouter à la boîte » met la pièce dans la boîte de l'élève ; sa fiche règle
  l'orientation : un bouton **tourne d'un quart de tour** (entrée et sorties
  pivotent ensemble), et une fiche avancée permet de choisir les flèches une à
  une pour les cas tordus.
- Une pièce peut aussi être **posée scellée** sur le plateau (`fixed` — les
  pièces des tunnels) : dans la fiche d'une pièce, « Dans la boîte » / « Scellée
  sur le plateau ».
- La boîte s'affiche comme dans le jeu, avec le compte. Rappel affiché en
  petit : *le surplus fait le casse-tête* (l'original : 6 à 8 pièces pour 3 ou
  4 utiles).

### La fiche du niveau
Un petit formulaire, repliable : **monde** (choix parmi les neuf — il commande
le décor et les fruits), **nom** (contrôle d'unicité contre les 69 noms
existants : le nom est la clé de sauvegarde ET la clé de l'aide-calcul),
**consigne** (`sub` — une question, jamais la solution), **indice** (`hint`,
optionnel). Les points de cours (`dec`) et l'aide-calcul (`CALC`) restent hors
atelier : ils se décident ici, en conception, à l'intégration.

## 6. L'écran Jouer

Le vrai écran du jeu : même plateau, même boîte, mêmes gestes, même
célébration. Deux différences, et deux seulement :

- **Rien n'est enregistré.** Ni victoire, ni fruits, ni cours : la sauvegarde
  du jeu n'existe pas ici (techniquement : la célébration écrit dans un objet
  jetable en mémoire, jamais dans `soley-save-v5`).
- **Après la victoire**, un bandeau d'atelier remplace la fenêtre des petits
  soleils : pièces posées, fruits ramassés X/Y, et deux boutons :
  - **« Garder comme solution de référence »** — accepté seulement si TOUS les
    fruits sont ramassés (l'invariant de la batterie : `sol` = gagne + tous les
    fruits). Attention pédagogique à afficher : la taille de cette solution
    devient le par du défi de maîtrise (☀☀☀ = « au plus N pièces »).
  - **« Garder comme solution minimale »** — une victoire Sans tous les fruits
    (`solMin`) : c'est elle qui prouve que le fruit est hors du chemin gagnant,
    le contrôle de la refonte l'exige.

Les placements sont convertis en `[[ti,x,y],…]` (indice de la pièce dans la
boîte + case), le format exact des `sol` du dépôt.

## 7. Brouillons, export, import

- **Brouillons** : enregistrement automatique à chaque geste dans
  `localStorage['soley-atelier-v1']` ; plusieurs brouillons nommés, liste à
  l'ouverture (« Reprendre », « Dupliquer », « Supprimer »). Rien ne se perd si
  le téléphone se verrouille.
- **Exporter** : un bouton produit le **bloc prêt à coller dans `levels.js`**,
  écrit dans le style maison (constructeurs `b(1,0)`, `s2(1,0,2)`…, mêmes
  champs, même ordre que les entrées existantes), affiché dans une zone de
  texte avec « Copier ». C'est ce bloc que Gwenael envoie ici (audit) puis en
  session Code (intégration + batterie).
  L'export **refuse** s'il manque une solution de référence, et **avertit**
  (sans bloquer) si : nom en collision, pas de `solMin` alors qu'il y a des
  fruits, boîte sans surplus, aucun obstacle.
- **Importer** : coller un bloc dans la même zone pour le rééditer.
- **« Charger un niveau du jeu »** : la liste des 69 niveaux, pour partir d'un
  niveau en ligne et le retoucher. À l'export, si le nom n'a pas changé,
  l'atelier signale que c'est une retouche (le bloc remplacera l'entrée
  existante ; rappel : sauvegardes des élèves conservées, décision du 14/08 —
  pas de renommage).

## 8. Garde-fous

1. **`soley-save-v5` intouchée** — test Playwright obligatoire : construire,
   jouer, GAGNER dans l'atelier, puis vérifier que la clé n'existe pas (ou n'a
   pas bougé d'un octet si elle préexistait). Le test le plus parlant est
   celui-là : préremplir la clé avec une fausse progression AVANT d'ouvrir
   l'atelier, gagner, et vérifier qu'elle est identique à l'octet après. Le
   procédé qui le rend vrai est dans l'annexe.
2. **Modules du jeu inchangés à l'octet** — le vérificateur du lot compare
   `levels.js`, `engine.js`, `render.js`, `ui.js`, `soley.html`, `soley.css`
   avant/après. (Si la construction révèle qu'un crochet minuscule est
   indispensable dans un module, la session s'ARRÊTE et le signale : c'est une
   décision à prendre ici, pas en session.)
3. **Hors des radars** : noindex, hors sitemap, hors catalogue, aucun lien
   entrant sur le site.
4. **L'export ne publie rien** : l'atelier fabrique du texte, jamais de commit.
   Le circuit reste : audit ici → session Code → PR → batterie → Merge de
   Gwenael.

## 9. Ce que le lot 1 ne fait pas (exclusions assumées)

- Pas d'édition des points de cours ni de l'aide-calcul (`COURS`/`CALC`).
- Pas de solveur ni de score de difficulté (le bouton « Mesurer » peut exister
  grisé, avec « bientôt » — à décider, question Q3).
- Pas de version élèves, pas de partage de niveaux par lien.
- Pas de gestion des mondes (créer un monde se fait en session Code).
- Pas d'insertion automatique dans le jeu : l'export est un bloc de texte, un
  humain et une batterie restent entre l'atelier et les élèves.

## 10. Le circuit et la batterie du lot

Spec validée par Gwenael → `PROMPT-session-atelier.md` fourni par Claude →
session Code (construction) → PR **sans fusion** → audit ici → clic Merge.

La batterie du lot exige au minimum :
- Playwright : la page charge sans erreur console ; poser chaque type d'objet ;
  régler une porte, un fruit à valeur, une passe ; jouer et gagner un niveau
  construit dans le test ; enregistrer sol et solMin ; exporter.
- Node : le bloc exporté est **rejoué dans le vrai moteur** (harnais du type
  `canne-niveaux.mjs`) : la sol gagne avec tous les fruits, la solMin gagne.
- Le test sauvegarde (§8.1) et le vérificateur d'intégrité des modules (§8.2).
- Aller-retour : charger « Le tour du champ », exporter sans rien toucher,
  vérifier que le bloc est équivalent au niveau du dépôt.

## 11. Extensions prévues (pas maintenant)

- **« Mesurer »** : quand le solveur du chantier difficulté existera, il
  tournera d'abord côté Node dans la batterie ; un branchement dans l'atelier
  (bouton qui donne G configurations gagnantes / R résistance) viendra en v2.
- **L'atelier des élèves** : dès le lot 1, l'activité « concevez votre
  niveau » marche par l'URL donnée en classe (§3) — concevoir un niveau qui
  exige 1/6 demande de comprendre le sixième plus profondément que le
  résoudre : du pilier Chercher pur. La VERSION élèves (interface simplifiée
  sans sol/solMin/export apparents, partage par code) reste un chantier à
  part, à décider après un essai réel.

## 12. Réponses du 15/08 (v1 → v1.1)

- **Le nom** : « L'atelier Solèy » (`soley-atelier.html`) — accepté avec le
  « ça me va » global.
- **L'accès** : URL cachée seule, aucun lien dans le jeu (choix explicite de
  Gwenael parmi trois options) — gravé au §3. L'entrée visible (sa piste :
  en bas de la liste des mondes) est notée pour la v2.
- **Charger les niveaux existants** : OUI, au lot 1 (recommandation suivie —
  c'est l'outil de la refonte).
- **Bouton « Mesurer »** : rien au lot 1, pas de bouton mort (recommandation
  suivie). Le branchement du solveur viendra en v2 (§11).
- **Calendrier** : lot proposé en session Code Opus dès maintenant (additif,
  très spécifié) ; Fable d'après mercredi réservé aux niveaux eux-mêmes.
  C'est Gwenael qui décide en lançant — ou non — la session avec le prompt.

## 13. Ce que la relecture contre le code a corrigé (v1.1 → v1.2)

Relecture du 15/08 contre `origin/main` = `b05205ce`, en lecture seule : aucun
fichier du dépôt n'a été touché. Tout le reste de la spec a été vérifié exact
(format des niveaux, comptes, règles du moteur, les deux micro-dettes de doc).

1. **Les pièces s'écrivent sur DEUX couches, et la v1.1 les mélangeait.** Elle
   annonçait « pièces `b/s2/s3/mg/x2/x3` » comme si c'était une liste unique.
   En réalité : dans le moteur, le champ `t` d'une pièce vaut `'b'`, `'s2'`,
   `'s3'`, `'m'`, `'x2'`, `'x3'` (relevé sur les 356 pièces de boîte et les 5
   pièces scellées des 69 niveaux) ; mais un niveau s'ÉCRIT dans `levels.js`
   avec des constructeurs, et celui de la lentille s'appelle `mg` — il n'existe
   aucun `m()`. Les deux sont vrais, chacun à sa couche. Le tableau de l'annexe
   les nomme désormais séparément : confondre les deux casse un export dans un
   sens (`m(…)` collé dans `levels.js` plante) comme dans l'autre (`t:'mg'`
   serait ignoré par le moteur).
2. **La plage des grilles.** La v1.1 annonçait « 5 à 12 × 4 à 8, exactement la
   plage des niveaux en ligne » : c'est faux, le relevé donne 7 à 12 colonnes
   et 5 à 8 rangées. La plage 5-12 × 4-8 est CONSERVÉE au §5, mais assumée
   comme plus large que le jeu et non comme son décalque.
3. **Le garde-fou de la sauvegarde n'était pas réalisable tel qu'écrit.**
   `engine.js` lit `soley-save-v5` au CHARGEMENT du module (`let save=loadSave();`)
   : ouvrir la page d'atelier suffit à lire la clé, même sans jouer. Une session
   Code appliquant l'invariant à la lettre aurait pu conclure « il faut modifier
   un module » et s'arrêter comme le prompt le lui demande — sans construire.
   Le procédé additif qui règle les deux sens, lecture ET écriture, est
   maintenant écrit dans l'annexe.

Complété aussi dans l'annexe, parce que rien de tout cela n'y était : la forme
exacte de chaque pièce, la seule façon de faire jouer un niveau d'atelier par
le vrai moteur, et les 48 identifiants HTML que les modules réclament.

---

## Annexe technique pour la session Code

*Tout ce qui suit a été relevé le 15/08 sur `origin/main` = `b05205ce`,
fichier et ligne à l'appui.*

**Format d'un niveau** — les 17 champs, tous vérifiés présents sur les 69, et
aucun champ inconnu :
`{w, name, sub, hint?, dec?, cols, rows, suns:[{x,y,dir,val?}],
targets:[{x,y,need,disp?,porte?}], rocks:[[x,y]], fruits:[[x,y] | [x,y,[n,d]]],
gates:[{x,y,max}]?, fixed:[[pièce,x,y]]?, tools:[pièces], sol:[[ti,x,y]],
solMin?, solB?}`.
Comptes relevés : 77 soleils dont 16 à valeur · 156 cases dont 24 avec `disp`
et 4 avec `porte` · 145 fruits dont 9 à valeur · 16 passes dans 9 niveaux · 3
niveaux à pièces scellées · 13 `solMin`, 1 `solB`, 3 `dec`, 46 `hint`. Les 69
noms sont uniques. Les neuf mondes, dans l'ordre : `lagon, canne, foret,
volcan, pitons, soleils, marche, tunnels, mafate`.

**Les six pièces — deux écritures selon la couche.** C'est le piège n°1 de ce
lot. Dans le MOTEUR, une pièce est un objet dont le champ `t` vaut `'b'`,
`'s2'`, `'s3'`, `'m'`, `'x2'` ou `'x3'`. Dans `levels.js` — donc dans tout bloc
exporté — un niveau s'écrit avec les CONSTRUCTEURS définis en tête du fichier,
et celui de la lentille s'appelle `mg` : il n'existe aucun `m()`. Écrire
`m(…)` dans un export planterait au collage ; écrire `t:'mg'` dans le moteur
serait ignoré.

| Pièce | Type (`t`, moteur) | Constructeur (`levels.js`) | Objet produit | Effet |
|---|---|---|---|---|
| Miroir | `'b'` | `b(in,out)` | `{t:'b', in, out}` | renvoie le rayon, valeur inchangée |
| Prisme ÷2 | `'s2'` | `s2(in,o1,o2)` | `{t:'s2', in, outs:[o1,o2]}` | partage en deux |
| Prisme ÷3 | `'s3'` | `s3(in,o1,o2,o3)` | `{t:'s3', in, outs:[o1,o2,o3]}` | partage en trois |
| Lentille + | `'m'` | **`mg(in1,in2,out)`** | `{t:'m', ins:[in1,in2], out}` | additionne DEUX entrées |
| Loupe ×2 | `'x2'` | `x2(in,out)` | `{t:'x2', in, out}` | double la valeur |
| Loupe ×3 | `'x3'` | `x3(in,out)` | `{t:'x3', in, out}` | triple la valeur |

La lentille exige exactement deux entrées (`engine.js` lit `d.ins[0]` et
`d.ins[1]`) et n'émet qu'une fois les deux rayons arrivés. Une pièce scellée
porte la pièce entière, écrite elle aussi avec son constructeur :
`fixed:[[s2(1,0,2), x, y]]`.

**Règles du moteur** : directions 0 N, 1 E, 2 S, 3 O ; une porte n'accepte que
le rayon qui ENTRE par son côté (`(dir+2)%4 === porte`, `engine.js:416`) et
bloque comme une roche sinon ; une passe laisse passer si `val ≤ max`
(`engine.js:407`) ; une case touchée par deux rayons fait perdre (état
`multi`) ; `simulate()` lit `LV[cur]` et `state.placed` (`engine.js:385-386`).

**Faire jouer un niveau d'atelier par le VRAI moteur.** L'indice du niveau
courant (`cur`) est interne au module : il n'y a qu'un chemin, et il est
additif. `window.SOLEY` expose le tableau `LV` lui-même — l'atelier ajoute son
brouillon à la fin de `LV`, puis appelle `openLevel(LV.length-1)`. `openLevel`
ne contrôle aucune borne et ignore les verrous (c'est voulu, la batterie s'en
sert). Deux précautions : le champ `w` doit être l'un des neuf identifiants de
mondes, sinon `openLevel` plante (`WORLDS.find(…)` puis `w.label`, `ui.js:99`) ;
et le brouillon doit être retiré de `LV` en quittant le mode Jouer.

**Neutraliser la sauvegarde — LE point technique du lot.** `engine.js` ne
touche `localStorage` qu'à deux endroits, tous deux sur la clé `soley-save-v5` :
`loadSave()` la LIT (`engine.js:337`) et `persist()` l'ÉCRIT (`engine.js:341`).
La lecture a lieu au CHARGEMENT du module (`engine.js:343`, `let save=loadSave();`),
donc il ne suffit pas d'éviter de gagner. Le procédé additif, qui ne change pas
un octet des modules : la page d'atelier pose, AVANT les quatre `<script>` du
jeu, un rideau sur `Storage.prototype` — il garde une référence aux méthodes
d'origine, renvoie `null` sur `getItem` de cette seule clé et LÈVE une erreur
sur `setItem` de cette seule clé. **Toutes les autres clés sont déléguées aux
méthodes d'origine** : l'atelier garde donc ses propres brouillons
(`soley-atelier-v1`) et le bandeau de consentement garde les siens. Patcher le
prototype plutôt que redéfinir `window.localStorage` évite en prime la question
de la configurabilité de cette propriété selon les navigateurs.
`persist()` est déjà écrit pour ce cas — `try{…}catch(e){memStore=save;}` — et
bascule tout seul sur son objet mémoire jetable : c'est exactement le
comportement demandé au §6. Résultat : l'atelier ne lit ni n'écrit jamais la
vraie sauvegarde, et le jeu reste intact à l'octet. Si la session Code trouve
un chemin plus simple, qu'elle le décrive dans le compte rendu ; ce qu'elle ne
doit pas faire, c'est modifier `engine.js`.

**La coquille HTML doit être complète.** Les modules appellent
`getElementById` sur 48 identifiants ; 47 existent dans `soley.html`, un seul
(`cpredirebtn`) est créé à la volée. Un identifiant manquant, c'est un
plantage au premier `openLevel`. La liste à reprendre telle quelle :
aproposbtn, aproposcard, aproposok, aproposov, backhome, backlv, board,
boardbox, coursbody, courscard, coursfleche, coursok, coursov, courstitre,
defiline, fruitctr, fsbtn, fsclose, fshelptext, fstoast, hintbody, hintbtn,
hintcard, hintclose, hintov, hometot, introline, lvgrid, lvwblurb, lvwname,
nextbtn, play, playleft, playright, pname, resetbtn, rotatehint, splash,
status, staybtn, stlegende, toolbox, topbar, winmsg, winov, winstars, wlist.

**Détails vérifiés au passage** : au monde `canne`, les roches se dessinent en
cannes toutes seules (`canneSVG`, `render.js:335`) — rien à régler dans la
fiche de la roche, comme l'annonce le §5 ; le conseil « tourne ton téléphone »
se déclenche exactement à `cols>=10` en portrait (`ui.js:120`), ce que le §5
annonçait bien ; la clé de sauvegarde d'un niveau est `monde:nom`
(`engine.js:335`), d'où l'unicité du nom exigée au §5.
