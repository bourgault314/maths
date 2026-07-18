# Audit de provenance du dépôt — 18 juillet 2026

Audit mené en lecture seule sur l'ensemble du dépôt `bourgault314/maths`, en trois volets
parallèles : l'application `auto/`, la fondation V2 (`packages/` + `studio/`), et le reste
(`outils/`, bibliothèques tierces, dossiers annexes).

Ce rapport dit **ce qui a été vérifié** et **ce qui reste supposé**. Il ne conclut rien sur le
plan juridique : ce n'est pas son rôle.

---

## 1. La bonne nouvelle : `outils/` est propre

Les 19 gros fichiers HTML de Gwenaël (594 Ko pour le plus gros) ne contiennent **aucun**
en-tête de licence tiers, aucune mention DocTools ou Hakenholz, aucun code minifié collé.
Les lignes très longues qu'on pouvait suspecter sont des **images PNG en base64** (le logo
maths&go pour l'impression), pas du JavaScript importé.

Les emprunts qui existent sont des **concepts pédagogiques crédités** :

- **SPLAT!** de Steve Wyborney — crédité dans `sheet_generator_schema_partie_tout.html`.
  Réserve : le nom est repris dans 6 fichiers, le crédit n'apparaît qu'à un seul endroit.
- **Yavalath** de Cameron Browne — crédité, avec lien vers l'éditeur.
- **Glisse-nombre** d'Arnaud Durand (mathix.org) — crédité.
- **Abaque de Gerbert** — sources IREM créditées, domaine historique.

## 2. Une seule bibliothèque tierce copiée dans le dépôt

`auto/scripts/vendor/qrcode-generator.js` — Kazuhiko Arase, **licence MIT, en-tête intact**.
Conforme, rien à faire. C'est le seul dossier `vendor/` du dépôt : aucun `node_modules`
versionné, aucun fichier minifié.

Les autres bibliothèques (Tailwind, KaTeX, three.js, pdf.js, Lucide) sont appelées **à distance
par CDN**, jamais recopiées. Une seule n'est pas open source : **GSAP**, utilisée sur une page
(`outils/conversions/conversions_unites_volumes.html`). Licence GreenSock « No Charge »,
a priori compatible avec un usage éducatif — à revoir le jour où le site devient payant.

Aucune trace de **Coopmaths / MathALEA / Sésamath**, qui sont sous AGPL : leur présence aurait
été contaminante pour tout le dépôt. C'est un vrai soulagement.

## 3. Le point sensible : `auto/`

C'est là, et seulement là, que se concentre la dette.

| Constat | Mesure |
| --- | --- |
| Modules `dnb_*` | 43, soit 478 Ko |
| Modules déclarant eux-mêmes `source: "import_dnb_zip"` | 33 |
| Occurrences de `formula_code` | 279, dans 32 fichiers |
| Modules déjà entièrement purgés | 10 |
| Crédit à Éric Hakenholz / DocTools | 2 pages (`auto/index.html`, `studio/automatismes/index.html`) |

### Le plus révélateur n'est pas les énoncés

Les énoncés sont déjà en cours de purge méthodique : 10 modules sont entièrement réécrits,
leurs `statement` vidés et le contenu régénéré côté maths&go depuis
`auto/scripts/shared/pedagogy/`. C'est le bon patron, et il fonctionne.

Le vrai sujet, ce sont les **279 `formula_code`** — le mini-langage de génération d'origine,
conservé tel quel :

```
setNB(1)
idx=RD(5)
p=[1,2,3,3,4,5][idx]
q=[2,3,4,5,5,6][idx]
```

Ce n'est pas du JavaScript. Pour que ces chaînes s'exécutent, `auto/scripts/02-question-engine.js`
(lignes 8-26) **réimplémente l'interpréteur d'origine** : `RD`, `GCD`, `CUT`, `runCode`… et
surtout :

```js
function setNB(n){ return n; }
```

Cette fonction ne fait **rien**. Elle n'existe que pour ne pas casser les chaînes héritées.
C'est la trace la plus nette, et la plus auto-documentée, d'une reprise non transformée.
**C'est par là qu'il faut commencer.**

### Les visuels

Deux styles cohabitent dans `auto/` :

- un style « export machine » (palette figée `#eef5ff`/`#222`, coordonnées à décimales
  flottantes, aucun commentaire) dans 11 modules — corrélé systématiquement avec
  `import_dnb_zip` et les `formula_code` ;
- un style maison, accessible et français (`role="img" aria-label="Solide à reconnaître"`,
  classes sémantiques, palettes travaillées) dans `dnb_20` notamment.

La bibliothèque `auto/scripts/shared/visuals/` (27 composants, registre `MATHSGO_VISUALS`,
messages d'erreur en français) est, elle, **une création maths&go**.

*Réserve honnête : la banque DocTools d'origine n'est pas dans le dépôt. On ne peut donc pas
prouver par comparaison que le style « export machine » en est extrait. La corrélation est
forte, elle reste une inférence.*

### Limite de méthode

L'historique git de `auto/` est aplati (48 commits, tous « Add files via upload »).
**`git blame` ne peut rien dater ni attribuer ici.** Le classement des 43 modules repose donc
uniquement sur trois signaux internes vérifiables : le champ `source`, la présence de
`formula_code`, et le taux d'énoncés vidés.

## 4. La fondation V2 est presque entièrement à nous

Sur les 22 objets de `packages/objets/src/` : **aucun `formula_code`, aucun import vers `auto/`,
aucun SVG copié, aucune liste de distracteurs empruntée.** L'audit a comparé *chaque constante
hexadécimale* de nos objets contre `auto/` et contre `outils/`.

Trois emprunts seulement, tous mineurs, tous des couleurs :

| Fichier | Emprunt | Correctif |
| --- | --- | --- |
| `jetons.js` | 2 aplats (`#2e9e5b`, `#d9584b`) identiques à `relative-tokens.js` de `auto/`, absents de `outils/` | remplacer par des teintes de la charte |
| `thales.js` | 3 couleurs de `COULEURS_THALES` identiques à `thales-configuration.js` de `auto/` | idem — la construction géométrique, elle, est originale |
| `studio/components/pythagore/visuals.js` | 6 teintes de `PYTHAGORE_COLORS` identiques à `03-slideshow.js`, même sémantique | **question ouverte** : viennent-elles d'une version antérieure de PythaBarre ? |

Cas confirmés propres, contre l'intuition : `pourcentages.js` (énoncés retrouvés mot pour mot
dans l'exerciceur de Gwenaël, absents de `auto/`) et `barre-pourcentage.js` (les mentions de
`auto/` dans les commentaires ne sont que des références de besoin).

Cas assumé : **`studio/automatismes/`** se déclare lui-même copie fidèle de `auto/` (encodage
MG1, liste des 43 identifiants). Ce n'est pas une dette à réparer — c'est l'échafaudage
construit exprès pour tester le nouveau menu sur le moteur actuel. Il tombera tout seul à la
migration du moteur.

## 5. Points à clarifier — hors de portée d'un audit de code

Ces questions demandent une réponse de Gwenaël, ou un avis extérieur. Elles sont listées ici
pour ne pas être oubliées, sans dramatisation.

1. **Existe-t-il un écrit d'Éric Hakenholz** autorisant la réutilisation et la republication ?
   Le crédit actuel dit « remerciements pour le partage du fichier » — c'est honnête, mais un
   remerciement n'est pas une licence.
2. **Le dépôt ne déclare aucune licence** : pas de fichier `LICENSE`, pas de champ `license`
   dans `package.json`. À trancher avant toute exploitation commerciale.
3. **Origine des PDF de gabarits** sans source éditable (`outils/SOURCES-GABARITS.md`, 14 fichiers).
4. **Le nom « SPLAT! »** repris dans plusieurs fichiers pour un seul crédit.
5. **GSAP** : seule dépendance non open source (voir §2).
6. **Contributions de Claire Lagarde**, créditée à côté d'Éric Hakenholz : nature non documentée.

## 6. Ce que l'audit conclut

La dette est **réelle, mesurée, et beaucoup plus concentrée qu'on pouvait le craindre** :
elle tient presque entièrement dans les `formula_code` de `auto/` et leur interpréteur.

Tout ce qui a été reconstruit ces dernières semaines — les barres, les jetons, le Splat, les
figures, les solides, Thalès, les pourcentages, Pythagore — appartient à maths&go, à cinq
couleurs près.
