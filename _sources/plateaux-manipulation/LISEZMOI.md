# Patron du prisme 3-4-5 — archive (retiré du site le 04/09/2026)

Cette page était publiée sous le nom `outils/plateaux_manipulation/prisme345_h6_patron (1).html`
(avec le « (1) » d'un téléchargement), au statut « à relire » dans le catalogue,
et **elle ne fonctionnait pas** : écran vide.

**Pourquoi elle ne marchait pas.** Elle charge `OrbitControls` depuis
`three@0.160.0` — or three ne fournit plus `examples/js/controls/OrbitControls.js`
depuis la version r148. Le navigateur recevait une erreur 404, puis la ligne
`const controls = new THREE.OrbitControls(camera, renderer.domElement);` plantait,
et le script s'arrêtait là : rien n'était dessiné.

**Comment la réparer le jour où tu la reprends.** Deux lignes à changer dans
`<head>` — remplacer les deux `<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/…">`
par les copies locales du dépôt, qui sont déjà là parce qu'une autre page s'en sert :

```html
<script src="../../assets/vendor/three-0.128.0/three.min.js"></script>
<script src="../../assets/vendor/three-0.128.0/OrbitControls.js"></script>
```

(chemins à ajuster selon l'endroit où la page est remise). Vérifié : avec ces deux
lignes, le prisme s'affiche et tourne à la souris.

Pour la remettre en ligne il faudra aussi la redéclarer dans
`assets/js/catalogue-refonte-data.js` (deux endroits : la carte des ressources et
l'index), et bumper le cache-buster du catalogue.

---

# Les deux boîtes à bonbons — archive (retirées du site le 04/09/2026)

`boite_bonbons.html` et `boite_bonbons_3d_toutes_boites.html` étaient publiées au
catalogue (statut « à relire »), reliées depuis aucune page.

**Pourquoi elles sont sorties.** Elles allaient chercher three.js chez `unpkg.com`
**en JavaScript** (`await loadScript('https://unpkg.com/three@0.160.0/…')`), ce
qu'aucune recherche de balises `<script src>` ne voit — c'est l'angle mort du
lot 10, trouvé par Claude Code en relisant la PR #637. Un script venu d'ailleurs
qui s'exécute sur l'origine `mathsgo.re` peut lire les codes et les prénoms rangés
par Défi tables dans le navigateur. Le repli local qu'elles prévoyaient
(`./three.min.js`) n'existait pas : sans internet, pas de 3D.

**Comment les reprendre un jour.** Il faut leur donner une copie de three dans le
dépôt. Attention : elles se servent de `SRGBColorSpace` et de `outputColorSpace`,
qui n'existent pas dans la r128 déjà rapatriée (`assets/vendor/three-0.128.0/`) —
il faudrait donc ajouter `three@0.160.0` et remplacer l'adresse unpkg par le chemin
local, puis redéclarer les pages au catalogue.

**À savoir avant de rouvrir `boite_bonbons_3d_toutes_boites.html` :** elle avait
déjà un défaut à elle, sans rapport avec three. Dès l'ouverture elle affichait son
encadré « 3D indisponible » et lançait `resizeCavaliere is not defined` et
`candyGeo is not defined`. Vérifié le 04/09 : mêmes erreurs avec l'ancienne
version servie depuis unpkg. `boite_bonbons.html`, elle, fonctionnait.
