# assets/vendor/ — les bibliothèques du site, copiées ici

Depuis le lot 10 (04/09/2026), aucune page du site ne charge de script depuis un
autre domaine. Les bibliothèques dont les outils ont besoin sont copiées ici et
servies par mathsgo.re.

**Pourquoi.** Le site range les codes et les prénoms de Défi tables dans le
stockage local du navigateur. Ce stockage appartient à l'origine `mathsgo.re` :
tout script chargé par une page du site peut le lire — y compris un script venu
d'ailleurs. Une des pages chargeait `lucide@latest`, c'est-à-dire « la dernière
version, quelle qu'elle soit » : le fichier pouvait changer d'un jour à l'autre
sans que personne ne s'en aperçoive.

**La règle, tenue par `tests/scripts-tiers.test.mjs` :** une page du site ne
charge un script d'un autre domaine que s'il porte un attribut
`integrity="sha384-…"`. Aujourd'hui il n'y en a aucun, et c'est le mieux.

## Ce qu'il y a ici, et d'où ça vient

| Dossier | Version | Origine |
|---|---|---|
| `gsap-3.12.2/` | 3.12.2 | npm `gsap@3.12.2`, `dist/gsap.min.js` |
| `katex-0.16.9/` | 0.16.9 | npm `katex@0.16.9`, `dist/` (js, css, et les polices `.woff2` seulement) |
| `pdfjs-3.4.120/` | 3.4.120 | npm `pdfjs-dist@3.4.120`, `build/pdf.min.js` et `build/pdf.worker.min.js` |
| `three-0.128.0/` | r128 | npm `three@0.128.0`, `build/three.min.js` et `examples/js/controls/OrbitControls.js` |
| `tailwind/` | construit ici | voir ci-dessous |

Les empreintes SHA-256 de ces fichiers sont inscrites dans
`tests/scripts-tiers.test.mjs` : un fichier remplacé ou abîmé fait passer les
tests au rouge. **Pour mettre une bibliothèque à jour : remplacer le fichier,
recalculer l'empreinte (`sha256sum`), corriger la ligne du test, et le dire dans
la notice du lot.**

Les icônes des plateaux de manipulation venaient de `lucide` : elles sont
maintenant écrites directement dans les deux pages qui s'en servent
(`plateaux_manipulation/index.html` et `cubes_construction.html`), sous forme de
`<svg>`. Plus aucun fichier à charger — 365 ko économisés pour 20 icônes.

## `tailwind/tailwind-outils.css` — feuille construite, à reconstruire à la main

Seize pages utilisaient `cdn.tailwindcss.com`, qui télécharge **380 ko de
compilateur** et fabrique les styles dans le navigateur de l'élève, à chaque
ouverture. La feuille qui est ici contient les styles déjà fabriqués, une fois
pour toutes : **43 ko**, et les pages s'affichent même sans internet.

Elle est construite avec l'outil officiel, dans un dossier de passage :

```
npm init -y
npm i -D tailwindcss@3.4.17
# tailwind.config.js : content = la liste des 16 pages (celle du test,
#                      constante PAGES_TAILWIND de tests/scripts-tiers.test.mjs)
printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > entree.css
npx tailwindcss -i entree.css -o tailwind-outils.css --minify
```

**À FAIRE À CHAQUE FOIS qu'une classe Tailwind est ajoutée à l'une des 16 pages :**

1. reconstruire la feuille avec la commande ci-dessus ;
2. remplacer `assets/vendor/tailwind/tailwind-outils.css` ;
3. bumper le `?v=` dans les 16 pages **et** dans `VERSION_TAILWIND`
   (`tests/scripts-tiers.test.mjs`) — format `<mot-du-lot>-AAAAMMJJ-n` ;
4. recalculer l'empreinte SHA-256 et corriger la ligne du test.

Sans l'étape 1, la classe ajoutée n'existe dans aucune feuille et ne fait rien —
c'est le seul piège de cette façon de faire, et il est silencieux.

**Où la placer dans la page :** le lien `<link>` doit rester **le dernier élément
de `<head>`**, après le `<style>` de la page. Le CDN ajoutait ses styles à la fin
de `<head>` une fois le document lu ; en cas d'égalité de priorité, c'était donc
Tailwind qui gagnait. Remonter le lien plus haut inverserait ce rapport de force
et changerait l'apparence des pages. Le test le vérifie.
