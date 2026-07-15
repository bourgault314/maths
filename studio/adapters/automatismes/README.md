# Adaptateur graphique d’Automatismes

Le découpage d’Automatismes est conservé. `/auto` reste responsable des
modules, des banques, de l’aléatoire, des réponses, des corrections et des
identifiants stables.

Ce dossier ne contient que le raccord graphique : une question peut fournir une
définition structurée au pack `studio/components/representation-pack-v1.js`,
et recevoir le SVG officiel correspondant.

Exemple :

```js
const definition = {
  componentId: 'representation.number-line',
  version: 1,
  status: 'validated',
  renderer: 'mathsgo-representation-pack-v1',
  payload: {
    min: -5,
    max: 5,
    step: 1,
    points: [{ value: -2, label: '−2' }]
  }
};

const result = window.MATHSGO_AUTOMATISMES_REPRESENTATIONS.render(definition);
```

## Règle de migration

Le moteur `/auto` ne recopie pas le SVG dans chaque question. Un module finalisé
est raccordé à l’adaptateur, comparé à sa version actuelle, puis migré famille
par famille. Tant que cette équivalence n’est pas vérifiée, l’ancien rendu reste
disponible.
