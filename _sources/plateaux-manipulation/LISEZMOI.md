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
