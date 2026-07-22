const test = require("node:test");
const assert = require("node:assert/strict");
const dailyVases = require("../assets/js/daily-vase-curves.js");

function independentVolume(profile, start, end, steps = 12000) {
  const width = (end - start) / steps;
  let sum = 0;
  for (let index = 0; index < steps; index += 1) {
    const height = start + (index + 0.5) * width;
    const radius = dailyVases.radiusAt(profile, height);
    sum += Math.PI * radius * radius;
  }
  return sum * width;
}

test("les sept profils restent physiques, positifs et réellement distincts", () => {
  assert.equal(dailyVases.profiles.length, 7);
  const ids = new Set();
  const signatures = new Set();

  dailyVases.profiles.forEach((profile) => {
    ids.add(profile.id);
    const radii = Array.from({ length: 101 }, (_, index) => {
      const radius = dailyVases.radiusAt(profile, index / 100);
      assert.equal(Number.isFinite(radius), true);
      assert.equal(radius > 0, true);
      return radius.toFixed(6);
    });
    signatures.add(radii.join("|"));
  });

  assert.equal(ids.size, 7);
  assert.equal(signatures.size, 7);
});

test("chaque séparation découpe exactement le vase en six volumes égaux", () => {
  dailyVases.profiles.forEach((profile) => {
    const model = dailyVases.buildModel(profile);
    const heights = Array.from({ length: dailyVases.layerCount + 1 }, (_, index) => {
      return model.heightAtVolumeFraction(index / dailyVases.layerCount);
    });
    const independentTotal = independentVolume(profile, 0, 1);

    heights.forEach((height, index) => {
      assert.equal(height >= 0 && height <= 1, true);
      if (index) assert.equal(height > heights[index - 1], true);
    });

    for (let index = 0; index < dailyVases.layerCount; index += 1) {
      const bandVolume = independentVolume(profile, heights[index], heights[index + 1]);
      const relativeError = Math.abs(bandVolume - independentTotal / dailyVases.layerCount)
        / independentTotal;
      assert.equal(relativeError < 2e-6, true, `${profile.id}, couche ${index + 1}: ${relativeError}`);
    }
  });
});

test("tous les points de la courbe h=f(V) correspondent au volume intégré", () => {
  dailyVases.profiles.forEach((profile) => {
    const model = dailyVases.buildModel(profile);
    const samples = dailyVases.curveSamples(profile, 96);
    assert.equal(samples.length, 97);

    samples.forEach((sample, index) => {
      assert.equal(sample.volumeFraction, index / 96);
      const reconstructedVolume = model.volumeFractionAtHeight(sample.height);
      assert.equal(Math.abs(reconstructedVolume - sample.volumeFraction) < 2e-8, true);
      if (index) assert.equal(sample.height > samples[index - 1].height, true);
    });
  });
});

test("le cylindre est le cas proportionnel et sa courbe est une droite", () => {
  dailyVases.curveSamples("cylindre", 60).forEach((sample) => {
    assert.equal(Math.abs(sample.height - sample.volumeFraction) < 1e-12, true);
  });
});

test("l’élargissement et le resserrement donnent les épaisseurs attendues", () => {
  function bandHeights(profileId) {
    const model = dailyVases.buildModel(profileId);
    const boundaries = Array.from({ length: 7 }, (_, index) => {
      return model.heightAtVolumeFraction(index / 6);
    });
    return boundaries.slice(1).map((height, index) => height - boundaries[index]);
  }

  const widening = bandHeights("evasement");
  const narrowing = bandHeights("resserrement");
  for (let index = 1; index < widening.length; index += 1) {
    assert.equal(widening[index] < widening[index - 1], true);
    assert.equal(narrowing[index] > narrowing[index - 1], true);
  }
});

test("l’évasement et le resserrement sont les renversements exacts l’un de l’autre", () => {
  for (let index = 0; index <= 100; index += 1) {
    const height = index / 100;
    assert.equal(
      Math.abs(
        dailyVases.radiusAt("evasement", height)
        - dailyVases.radiusAt("resserrement", 1 - height)
      ) < 1e-12,
      true
    );
  }
});

test("la bouteille garde un corps cylindrique puis un col fin", () => {
  const bodyRadius = dailyVases.radiusAt("bouteille-epaulement", 0.2);
  assert.equal(bodyRadius, dailyVases.radiusAt("bouteille-epaulement", 0.6));
  assert.equal(dailyVases.radiusAt("bouteille-epaulement", 0.85), 0.28);
  assert.equal(dailyVases.radiusAt("bouteille-epaulement", 1), 0.28);

  const model = dailyVases.buildModel("bouteille-epaulement");
  const boundaries = Array.from({ length: 7 }, (_, index) => {
    return model.heightAtVolumeFraction(index / 6);
  });
  const firstFiveHeights = boundaries.slice(1, 6).map((height, index) => {
    return height - boundaries[index];
  });
  firstFiveHeights.forEach((height) => {
    assert.equal(Math.abs(height - firstFiveHeights[0]) < 1e-3, true);
  });
  assert.equal(1 - boundaries[5] > 3 * firstFiveHeights[0], true);
});

test("le SVG est entièrement produit par le profil, ses couches et sa courbe", () => {
  dailyVases.profiles.forEach((profile) => {
    const svg = dailyVases.renderProfile(profile);
    assert.match(svg, new RegExp(`data-mathsgo-vase-profile="${profile.id}"`));
    assert.match(svg, new RegExp(`data-mathsgo-vase-curve="${profile.id}"`));
    assert.equal((svg.match(/data-mathsgo-equal-volume=/g) || []).length, 6);
    assert.equal((svg.match(/data-mathsgo-volume-boundary=/g) || []).length, 5);
    assert.equal((svg.match(/data-mathsgo-volume-point=/g) || []).length, 6);
    assert.equal(svg.includes('stroke-width="2.5"'), false);
    assert.equal(svg.includes("NaN"), false);
    assert.equal(svg.includes("Infinity"), false);
  });
});

test("un nouveau profil apparaît chaque jour puis le cycle de sept jours recommence", () => {
  const selections = Array.from({ length: 8 }, (_, offset) => {
    return dailyVases.selectionForDate(new Date(2026, 0, 1 + offset, 12));
  });
  assert.equal(new Set(selections.slice(0, 7).map(({ index }) => index)).size, 7);
  assert.equal(selections[7].index, selections[0].index);
  assert.throws(() => dailyVases.selectionForDate("pas une date"), /Date quotidienne invalide/);
});
