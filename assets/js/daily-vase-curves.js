(function (global) {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const MODEL_RESOLUTION = 4096;
  const CURVE_SAMPLE_COUNT = 48;
  const LAYER_COUNT = 6;
  const PROFILE_SAMPLE_COUNT = 72;
  const COLORS = Object.freeze(["#38bdf8", "#2dd4bf", "#fb923c"]);

  function clampUnit(value) {
    return Math.max(0, Math.min(1, Number(value)));
  }

  const PROFILES = Object.freeze([
    Object.freeze({
      id: "cylindre",
      name: "Cylindre",
      radius: function () { return 0.56; }
    }),
    Object.freeze({
      id: "evasement",
      name: "Vase qui s’élargit",
      radius: function (height) { return 0.30 + 0.52 * clampUnit(height); }
    }),
    Object.freeze({
      id: "resserrement",
      name: "Vase qui se resserre",
      radius: function (height) { return 0.82 - 0.48 * clampUnit(height); }
    }),
    Object.freeze({
      id: "panse-et-col",
      name: "Vase ventru avec un col",
      radius: function (height) {
        const position = clampUnit(height);
        if (position >= 0.88) return 0.31;
        return 0.31 + 0.50 * Math.pow(Math.sin(Math.PI * position / 0.88), 1.4);
      }
    }),
    Object.freeze({
      id: "sablier",
      name: "Vase en sablier",
      radius: function (height) {
        return 0.34 + 0.46 * Math.pow(Math.abs(2 * clampUnit(height) - 1), 1.7);
      }
    }),
    Object.freeze({
      id: "ondule",
      name: "Vase ondulé",
      radius: function (height) {
        return 0.55 + 0.18 * Math.cos(4 * Math.PI * clampUnit(height));
      }
    })
  ]);

  const PROFILE_BY_ID = new Map(PROFILES.map(function (profile) {
    return [profile.id, profile];
  }));
  const MODEL_CACHE = new Map();

  function profileFrom(value) {
    if (typeof value === "number") return PROFILES[value];
    if (typeof value === "string") return PROFILE_BY_ID.get(value);
    if (value && typeof value.radius === "function") return value;
    return undefined;
  }

  function radiusAt(profileValue, height) {
    const profile = profileFrom(profileValue);
    if (!profile) throw new RangeError("Profil de vase inconnu");
    const radius = Number(profile.radius(clampUnit(height)));
    if (!(radius > 0) || !Number.isFinite(radius)) {
      throw new RangeError("Le rayon du vase doit rester strictement positif");
    }
    return radius;
  }

  function buildModel(profileValue, resolutionValue) {
    const profile = profileFrom(profileValue);
    if (!profile) throw new RangeError("Profil de vase inconnu");
    const resolution = resolutionValue === undefined
      ? MODEL_RESOLUTION
      : Math.max(128, Math.trunc(Number(resolutionValue)) || MODEL_RESOLUTION);
    const cacheKey = profile.id + ":" + resolution;
    if (MODEL_CACHE.has(cacheKey)) return MODEL_CACHE.get(cacheKey);

    const step = 1 / resolution;
    const cumulative = new Float64Array(resolution + 1);
    let previousArea = Math.PI * Math.pow(radiusAt(profile, 0), 2);
    let maximumRadius = radiusAt(profile, 0);

    for (let index = 1; index <= resolution; index += 1) {
      const height = index * step;
      const radius = radiusAt(profile, height);
      const area = Math.PI * radius * radius;
      cumulative[index] = cumulative[index - 1] + (previousArea + area) * step / 2;
      previousArea = area;
      maximumRadius = Math.max(maximumRadius, radius);
    }

    const totalVolume = cumulative[resolution];

    function volumeAtHeight(heightValue) {
      const height = clampUnit(heightValue);
      if (height === 1) return totalVolume;
      const position = height * resolution;
      const lowerIndex = Math.floor(position);
      const ratio = position - lowerIndex;
      return cumulative[lowerIndex]
        + (cumulative[lowerIndex + 1] - cumulative[lowerIndex]) * ratio;
    }

    function volumeFractionAtHeight(height) {
      return volumeAtHeight(height) / totalVolume;
    }

    function heightAtVolumeFraction(volumeValue) {
      const volumeFraction = clampUnit(volumeValue);
      if (volumeFraction === 0 || volumeFraction === 1) return volumeFraction;
      const target = volumeFraction * totalVolume;
      let low = 0;
      let high = resolution;
      while (high - low > 1) {
        const middle = (low + high) >> 1;
        if (cumulative[middle] < target) low = middle;
        else high = middle;
      }
      const span = cumulative[high] - cumulative[low];
      const ratio = span > 0 ? (target - cumulative[low]) / span : 0;
      return (low + ratio) / resolution;
    }

    const model = Object.freeze({
      profile: profile,
      resolution: resolution,
      totalVolume: totalVolume,
      maximumRadius: maximumRadius,
      volumeAtHeight: volumeAtHeight,
      volumeFractionAtHeight: volumeFractionAtHeight,
      heightAtVolumeFraction: heightAtVolumeFraction
    });
    MODEL_CACHE.set(cacheKey, model);
    return model;
  }

  function localDayNumber(value) {
    const date = value === undefined ? new Date() : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError("Date quotidienne invalide");
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  }

  function selectionForDate(value) {
    const day = localDayNumber(value);
    const index = ((day % PROFILES.length) + PROFILES.length) % PROFILES.length;
    return Object.freeze({ index: index, profile: PROFILES[index] });
  }

  function number(value) {
    return Number(Number(value).toFixed(2)).toString();
  }

  function samplesBetween(start, end, count) {
    return Array.from({ length: count + 1 }, function (_item, index) {
      return start + (end - start) * index / count;
    });
  }

  function geometryFor(profileValue) {
    const model = buildModel(profileValue);
    const centerX = 24;
    const topY = 4.5;
    const bottomY = 48;
    const halfWidth = 18.5;
    const heightPixels = bottomY - topY;

    function yAt(height) {
      return bottomY - clampUnit(height) * heightPixels;
    }

    function halfWidthAt(height) {
      return halfWidth * radiusAt(model.profile, height) / model.maximumRadius;
    }

    function sidePoint(height, side) {
      return [centerX + side * halfWidthAt(height), yAt(height)];
    }

    function pathForBand(lowerHeight, upperHeight) {
      const segmentCount = Math.max(3, Math.ceil((upperHeight - lowerHeight) * PROFILE_SAMPLE_COUNT));
      const upward = samplesBetween(lowerHeight, upperHeight, segmentCount);
      const downward = upward.slice().reverse();
      const points = upward.map(function (height) { return sidePoint(height, -1); })
        .concat(downward.map(function (height) { return sidePoint(height, 1); }));
      return "M" + points.map(function (point) {
        return number(point[0]) + " " + number(point[1]);
      }).join("L") + "Z";
    }

    function outlinePath() {
      const upward = samplesBetween(0, 1, PROFILE_SAMPLE_COUNT);
      const downward = upward.slice().reverse();
      const points = upward.map(function (height) { return sidePoint(height, -1); })
        .concat(downward.map(function (height) { return sidePoint(height, 1); }));
      return "M" + points.map(function (point) {
        return number(point[0]) + " " + number(point[1]);
      }).join("L") + "Z";
    }

    return Object.freeze({
      model: model,
      centerX: centerX,
      topY: topY,
      bottomY: bottomY,
      yAt: yAt,
      halfWidthAt: halfWidthAt,
      pathForBand: pathForBand,
      outlinePath: outlinePath
    });
  }

  function curveSamples(profileValue, sampleCountValue) {
    const model = buildModel(profileValue);
    const sampleCount = Math.max(12, Math.trunc(Number(sampleCountValue)) || CURVE_SAMPLE_COUNT);
    return Object.freeze(Array.from({ length: sampleCount + 1 }, function (_item, index) {
      const volumeFraction = index / sampleCount;
      return Object.freeze({
        volumeFraction: volumeFraction,
        height: model.heightAtVolumeFraction(volumeFraction)
      });
    }));
  }

  function renderProfile(profileValue) {
    const profile = profileFrom(profileValue);
    if (!profile) throw new RangeError("Profil de vase inconnu");
    const geometry = geometryFor(profile);
    const model = geometry.model;
    const boundaries = Array.from({ length: LAYER_COUNT + 1 }, function (_item, index) {
      return model.heightAtVolumeFraction(index / LAYER_COUNT);
    });

    const bands = Array.from({ length: LAYER_COUNT }, function (_item, index) {
      const lower = boundaries[index];
      const upper = boundaries[index + 1];
      return `<path d="${geometry.pathForBand(lower, upper)}" fill="${COLORS[index % COLORS.length]}" data-mathsgo-equal-volume="${index + 1}"/>`;
    }).join("");

    const separators = boundaries.slice(1, -1).map(function (height, index) {
      const halfWidth = geometry.halfWidthAt(height);
      return `<path d="M${number(geometry.centerX - halfWidth)} ${number(geometry.yAt(height))}H${number(geometry.centerX + halfWidth)}" stroke="#fff" stroke-width="1.05" opacity=".94" data-mathsgo-volume-boundary="${index + 1}"/>`;
    }).join("");

    const plotLeft = 52.5;
    const plotRight = 93;
    const plotBottom = 46.5;
    const plotTop = 6;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;
    const curvePoints = curveSamples(profile).map(function (sample) {
      const x = plotLeft + sample.volumeFraction * plotWidth;
      const y = plotBottom - sample.height * plotHeight;
      return number(x) + "," + number(y);
    }).join(" ");
    const markers = boundaries.slice(1).map(function (height, index) {
      const volumeFraction = (index + 1) / LAYER_COUNT;
      const x = plotLeft + volumeFraction * plotWidth;
      const y = plotBottom - height * plotHeight;
      return `<circle cx="${number(x)}" cy="${number(y)}" r="1.75" data-mathsgo-volume-point="${index + 1}"/>`;
    }).join("");
    return `<svg viewBox="0 0 98 52" aria-hidden="true" data-mathsgo-vase-profile="${profile.id}">`
      + bands
      + separators
      + `<path d="${geometry.outlinePath()}" fill="none" stroke="#0b67b2" stroke-width="1.8" stroke-linejoin="round"/>`
      + `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M51 46.5H94M51 46.5V5" stroke="#475569" stroke-width="1.25"/><path d="m91 43.5 3 3-3 3M48 8l3-3 3 3" stroke="#475569" stroke-width="1.2"/><polyline points="${curvePoints}" stroke="#f58220" stroke-width="2.25" data-mathsgo-vase-curve="${profile.id}"/></g>`
      + `<g fill="#08aaa5" stroke="#fff" stroke-width=".8">${markers}</g>`
      + `<g fill="#475569" font-family="Arial, sans-serif" font-size="6.5" font-style="italic" font-weight="800"><text x="94" y="51">V</text><text x="44.5" y="6">h</text></g>`
      + "</svg>";
  }

  function render(_markup, value) {
    const selection = selectionForDate(value);
    return renderProfile(selection.profile);
  }

  const api = Object.freeze({
    profiles: PROFILES,
    layerCount: LAYER_COUNT,
    localDayNumber: localDayNumber,
    selectionForDate: selectionForDate,
    radiusAt: radiusAt,
    buildModel: buildModel,
    curveSamples: curveSamples,
    renderProfile: renderProfile,
    render: render
  });

  global.MATHSGO_DAILY_VASES = api;
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
