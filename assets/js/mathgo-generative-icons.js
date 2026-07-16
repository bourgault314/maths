(function (global) {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const VERSION = "2026.07.16-truchet";
  const DEFAULT_THEME = Object.freeze({
    card: "#ffffff",
    border: "#d9e5ee",
    muted: "#eef5f9",
    palette: Object.freeze(["#0879d0", "#06a9a3", "#f58220", "#7651b5", "#ef655e", "#e7b416"])
  });

  let instanceCount = 0;
  let fallbackIdentity = "";

  function hashSeed(text) {
    let hash = 2166136261 >>> 0;
    const value = String(text);
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function randomFactory(seedText) {
    let state = hashSeed(seedText) || 1;
    return function () {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function between(rng, min, max) {
    return min + (max - min) * rng();
  }

  function choose(rng, values) {
    return values[Math.floor(rng() * values.length) % values.length];
  }

  function polar(cx, cy, radius, angle) {
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  }

  function pointText(point) {
    return point[0].toFixed(2) + " " + point[1].toFixed(2);
  }

  function svgNode(name, attributes) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes || {}).forEach(function (entry) {
      element.setAttribute(entry[0], String(entry[1]));
    });
    return element;
  }

  function add(parent, name, attributes) {
    const element = svgNode(name, attributes);
    parent.appendChild(element);
    return element;
  }

  function colorAt(theme, index) {
    const palette = theme.palette;
    return palette[((index % palette.length) + palette.length) % palette.length];
  }

  function makeSvg(label, theme, size) {
    const attributes = {
      viewBox: "0 0 160 160",
      role: "img",
      "aria-label": label,
      focusable: "false",
      xmlns: SVG_NS
    };
    if (size) {
      attributes.width = size;
      attributes.height = size;
    }
    const svg = svgNode("svg", attributes);
    add(svg, "rect", {
      x: 5,
      y: 5,
      width: 150,
      height: 150,
      rx: 38,
      fill: theme.card,
      stroke: theme.border,
      "stroke-width": 1.5
    });
    return svg;
  }

  function addClip(svg, id, radius) {
    const defs = add(svg, "defs", {});
    const clip = add(defs, "clipPath", { id: id });
    add(clip, "rect", { x: 9, y: 9, width: 142, height: 142, rx: radius || 34 });
    return add(svg, "g", { "clip-path": "url(#" + id + ")" });
  }

  function drawPetals(svg, rng, uid, theme) {
    const group = addClip(svg, uid + "-clip", 34);
    const cx = 80 + between(rng, -2.5, 2.5);
    const cy = 80 + between(rng, -2.5, 2.5);
    const count = choose(rng, [8, 9, 10, 11]);
    const rotation = between(rng, 0, Math.PI * 2);
    const paletteShift = Math.floor(rng() * theme.palette.length);

    add(group, "circle", {
      cx: cx,
      cy: cy,
      r: between(rng, 53, 61),
      fill: "none",
      stroke: theme.border,
      "stroke-width": 1.2,
      opacity: .7
    });

    for (let index = 0; index < count; index += 1) {
      const base = rotation + index * Math.PI * 2 / count;
      const angle = base + between(rng, -.075, .075);
      const spread = between(rng, .17, .27);
      const inner = between(rng, 13, 20);
      const outer = between(rng, 50, 65);
      const left = polar(cx, cy, inner, angle - spread);
      const leftControlA = polar(cx, cy, between(rng, 28, 35), angle - spread * 1.35);
      const leftControlB = polar(cx, cy, outer * .78, angle - spread * .25);
      const tip = polar(cx, cy, outer, angle);
      const rightControlB = polar(cx, cy, outer * .78, angle + spread * .25);
      const rightControlA = polar(cx, cy, between(rng, 28, 35), angle + spread * 1.35);
      const right = polar(cx, cy, inner, angle + spread);
      const path = [
        "M", pointText(left),
        "C", pointText(leftControlA), pointText(leftControlB), pointText(tip),
        "C", pointText(rightControlB), pointText(rightControlA), pointText(right),
        "Q", pointText(polar(cx, cy, inner * .72, angle)), pointText(left),
        "Z"
      ].join(" ");
      add(group, "path", {
        d: path,
        fill: colorAt(theme, index + paletteShift),
        opacity: between(rng, .66, .88),
        stroke: theme.card,
        "stroke-width": 1.25,
        "stroke-linejoin": "round"
      });
    }

    add(group, "circle", {
      cx: cx,
      cy: cy,
      r: between(rng, 8, 11),
      fill: colorAt(theme, paletteShift + count),
      stroke: theme.card,
      "stroke-width": 2.2
    });
    add(group, "circle", { cx: cx, cy: cy, r: between(rng, 2.4, 4), fill: theme.card });
  }

  function edgePoint(edge, position) {
    const value = 18 + position * 124;
    if (edge === "left") return [18, value];
    if (edge === "right") return [142, value];
    if (edge === "top") return [value, 18];
    return [value, 142];
  }

  function drawWeave(svg, rng, uid, theme) {
    const group = addClip(svg, uid + "-clip", 31);
    const paletteShift = Math.floor(rng() * theme.palette.length);
    const horizontal = 5;
    const vertical = 4;

    add(group, "rect", { x: 11, y: 11, width: 138, height: 138, rx: 31, fill: theme.muted });

    for (let index = 0; index < horizontal; index += 1) {
      const start = edgePoint("left", (index + .55) / horizontal);
      const endPosition = ((index * 2 + Math.floor(rng() * horizontal)) % horizontal + .55) / horizontal;
      const end = edgePoint("right", endPosition);
      const controlA = [between(rng, 49, 72), between(rng, 18, 142)];
      const controlB = [between(rng, 88, 112), between(rng, 18, 142)];
      add(group, "path", {
        d: "M " + pointText(start) + " C " + pointText(controlA) + " " + pointText(controlB) + " " + pointText(end),
        fill: "none",
        stroke: colorAt(theme, paletteShift + index),
        "stroke-width": between(rng, 5.2, 8.5),
        "stroke-linecap": "round",
        opacity: between(rng, .66, .88)
      });
    }

    for (let index = 0; index < vertical; index += 1) {
      const start = edgePoint("top", (index + .55) / vertical);
      const endPosition = ((index * 3 + Math.floor(rng() * vertical)) % vertical + .55) / vertical;
      const end = edgePoint("bottom", endPosition);
      const controlA = [between(rng, 18, 142), between(rng, 48, 70)];
      const controlB = [between(rng, 18, 142), between(rng, 89, 113)];
      add(group, "path", {
        d: "M " + pointText(start) + " C " + pointText(controlA) + " " + pointText(controlB) + " " + pointText(end),
        fill: "none",
        stroke: colorAt(theme, paletteShift + index + 3),
        "stroke-width": between(rng, 3.6, 6.6),
        "stroke-linecap": "round",
        opacity: between(rng, .7, .93)
      });
    }

    const knotCount = 4 + Math.floor(rng() * 3);
    for (let index = 0; index < knotCount; index += 1) {
      add(group, "circle", {
        cx: between(rng, 37, 123),
        cy: between(rng, 37, 123),
        r: between(rng, 2.8, 5.3),
        fill: colorAt(theme, paletteShift + index + 1),
        stroke: theme.card,
        "stroke-width": 1.6
      });
    }
  }

  function drawMosaic(svg, rng, uid, theme) {
    const group = addClip(svg, uid + "-clip", 32);
    const cells = 4;
    const min = 13;
    const max = 147;
    const step = (max - min) / cells;
    const points = [];
    const paletteShift = Math.floor(rng() * theme.palette.length);

    for (let row = 0; row <= cells; row += 1) {
      points[row] = [];
      for (let column = 0; column <= cells; column += 1) {
        const boundaryX = column === 0 || column === cells;
        const boundaryY = row === 0 || row === cells;
        points[row][column] = [
          min + column * step + (boundaryX ? 0 : between(rng, -6.5, 6.5)),
          min + row * step + (boundaryY ? 0 : between(rng, -6.5, 6.5))
        ];
      }
    }

    for (let row = 0; row < cells; row += 1) {
      for (let column = 0; column < cells; column += 1) {
        const polygon = [
          points[row][column],
          points[row][column + 1],
          points[row + 1][column + 1],
          points[row + 1][column]
        ];
        const diagonalBias = (row * 2 + column + Math.floor(rng() * 3)) % theme.palette.length;
        add(group, "polygon", {
          points: polygon.map(pointText).join(" "),
          fill: colorAt(theme, paletteShift + diagonalBias),
          opacity: between(rng, .58, .88),
          stroke: theme.card,
          "stroke-width": between(rng, 2.1, 3.4),
          "stroke-linejoin": "round"
        });
      }
    }

    const accentRow = Math.floor(rng() * cells);
    const accentColumn = Math.floor(rng() * cells);
    const center = [
      (points[accentRow][accentColumn][0] + points[accentRow + 1][accentColumn + 1][0]) / 2,
      (points[accentRow][accentColumn][1] + points[accentRow + 1][accentColumn + 1][1]) / 2
    ];
    add(group, "circle", { cx: center[0], cy: center[1], r: between(rng, 3, 6), fill: theme.card, opacity: .9 });
  }

  function ellipsePath(cx, cy, rx, ry) {
    return [
      "M", (cx - rx).toFixed(2), cy.toFixed(2),
      "A", rx.toFixed(2), ry.toFixed(2), 0, 1, 0, (cx + rx).toFixed(2), cy.toFixed(2),
      "A", rx.toFixed(2), ry.toFixed(2), 0, 1, 0, (cx - rx).toFixed(2), cy.toFixed(2)
    ].join(" ");
  }

  function orbitPosition(cx, cy, rx, ry, rotation, angle) {
    const x = rx * Math.cos(angle);
    const y = ry * Math.sin(angle);
    return [
      cx + x * Math.cos(rotation) - y * Math.sin(rotation),
      cy + x * Math.sin(rotation) + y * Math.cos(rotation)
    ];
  }

  function addGeometricNode(group, type, x, y, size, color, rotation, theme) {
    if (type === 0) {
      add(group, "circle", { cx: x, cy: y, r: size, fill: color, stroke: theme.card, "stroke-width": 1.8 });
      return;
    }
    if (type === 1) {
      add(group, "rect", {
        x: x - size,
        y: y - size,
        width: size * 2,
        height: size * 2,
        rx: size * .28,
        fill: color,
        stroke: theme.card,
        "stroke-width": 1.8,
        transform: "rotate(" + rotation.toFixed(2) + " " + x.toFixed(2) + " " + y.toFixed(2) + ")"
      });
      return;
    }
    add(group, "polygon", {
      points: [[x, y - size * 1.2], [x - size, y + size * .75], [x + size, y + size * .75]].map(pointText).join(" "),
      fill: color,
      stroke: theme.card,
      "stroke-width": 1.8,
      "stroke-linejoin": "round",
      transform: "rotate(" + rotation.toFixed(2) + " " + x.toFixed(2) + " " + y.toFixed(2) + ")"
    });
  }

  function drawOrbits(svg, rng, uid, theme) {
    const group = addClip(svg, uid + "-clip", 34);
    const cx = 80 + between(rng, -3, 3);
    const cy = 80 + between(rng, -3, 3);
    const paletteShift = Math.floor(rng() * theme.palette.length);
    const orbitCount = 4 + Math.floor(rng() * 2);

    add(group, "circle", { cx: cx, cy: cy, r: 59, fill: theme.muted });

    for (let index = 0; index < orbitCount; index += 1) {
      const rx = between(rng, 36, 61);
      const ry = between(rng, 13, 27);
      const rotation = between(rng, 0, 180);
      const color = colorAt(theme, paletteShift + index);
      add(group, "path", {
        d: ellipsePath(cx, cy, rx, ry),
        fill: "none",
        stroke: color,
        "stroke-width": between(rng, 2.7, 5.2),
        "stroke-linecap": "round",
        "stroke-dasharray": between(rng, 30, 70).toFixed(1) + " " + between(rng, 8, 23).toFixed(1),
        "stroke-dashoffset": between(rng, -30, 30).toFixed(1),
        opacity: between(rng, .68, .93),
        transform: "rotate(" + rotation.toFixed(2) + " " + cx.toFixed(2) + " " + cy.toFixed(2) + ")"
      });

      const angle = between(rng, 0, Math.PI * 2);
      const position = orbitPosition(cx, cy, rx, ry, rotation * Math.PI / 180, angle);
      addGeometricNode(
        group,
        index % 3,
        position[0],
        position[1],
        between(rng, 3.8, 6.2),
        colorAt(theme, paletteShift + index + 2),
        rotation + angle * 180 / Math.PI,
        theme
      );
    }

    const coreRotation = between(rng, 0, 45);
    add(group, "rect", {
      x: cx - 9,
      y: cy - 9,
      width: 18,
      height: 18,
      rx: 4,
      fill: colorAt(theme, paletteShift + orbitCount),
      stroke: theme.card,
      "stroke-width": 2.2,
      transform: "rotate(" + coreRotation.toFixed(2) + " " + cx.toFixed(2) + " " + cy.toFixed(2) + ")"
    });
    add(group, "circle", { cx: cx, cy: cy, r: 3, fill: theme.card });
  }

  function drawBloom(svg, rng, uid, theme) {
    const group = addClip(svg, uid + "-clip", 34);
    const cx = 80 + between(rng, -2, 2);
    const cy = 80 + between(rng, -2, 2);
    const count = 30 + Math.floor(rng() * 9);
    const baseAngle = between(rng, 2.24, 2.48);
    const rotation = between(rng, 0, Math.PI * 2);
    const paletteShift = Math.floor(rng() * theme.palette.length);
    const spiralPoints = [];

    for (let index = 0; index < count; index += 1) {
      const radius = 8.4 * Math.sqrt(index + .4);
      const angle = rotation + index * baseAngle + between(rng, -.035, .035);
      spiralPoints.push(polar(cx, cy, radius, angle));
    }

    add(group, "path", {
      d: spiralPoints.map(function (point, index) {
        return (index === 0 ? "M " : "L ") + pointText(point);
      }).join(" "),
      fill: "none",
      stroke: theme.border,
      "stroke-width": 1.1,
      opacity: .7
    });

    spiralPoints.forEach(function (point, index) {
      const progress = index / count;
      const size = Math.max(2.2, 2.8 + progress * 4.4 + between(rng, -.7, .7));
      const color = colorAt(theme, paletteShift + Math.floor(index / 3));
      const type = (index + Math.floor(rng() * 2)) % 3;
      addGeometricNode(group, type, point[0], point[1], size, color, index * baseAngle * 180 / Math.PI, theme);
    });

    add(group, "circle", {
      cx: cx,
      cy: cy,
      r: 5.2,
      fill: colorAt(theme, paletteShift + 1),
      stroke: theme.card,
      "stroke-width": 1.8
    });
  }


  function drawTruchet(svg, rng, uid, theme) {
    const group = addClip(svg, uid + "-clip", 31);
    const cells = 4;
    const min = 16;
    const side = 32;
    const radius = side / 2;
    const max = min + cells * side;
    const paletteShift = Math.floor(rng() * theme.palette.length);
    const orientations = [];
    const segments = [];

    add(group, "rect", { x: 11, y: 11, width: 138, height: 138, rx: 31, fill: theme.muted });

    const grid = add(group, "g", {
      fill: "none",
      stroke: theme.border,
      "stroke-width": .8,
      opacity: .38
    });
    for (let index = 1; index < cells; index += 1) {
      const position = min + index * side;
      add(grid, "path", { d: "M " + position + " " + min + " V " + max });
      add(grid, "path", { d: "M " + min + " " + position + " H " + max });
    }

    function tileParts(column, row, orientation) {
      const x = min + column * side;
      const y = min + row * side;
      if (orientation === 0) {
        return [
          { ports: ["T", "L"], d: "M " + (x + radius) + " " + y + " A " + radius + " " + radius + " 0 0 1 " + x + " " + (y + radius) },
          { ports: ["R", "B"], d: "M " + (x + side) + " " + (y + radius) + " A " + radius + " " + radius + " 0 0 0 " + (x + radius) + " " + (y + side) }
        ];
      }
      return [
        { ports: ["T", "R"], d: "M " + (x + radius) + " " + y + " A " + radius + " " + radius + " 0 0 0 " + (x + side) + " " + (y + radius) },
        { ports: ["L", "B"], d: "M " + x + " " + (y + radius) + " A " + radius + " " + radius + " 0 0 1 " + (x + radius) + " " + (y + side) }
      ];
    }

    for (let row = 0; row < cells; row += 1) {
      orientations[row] = [];
      segments[row] = [];
      for (let column = 0; column < cells; column += 1) {
        const orientation = rng() < .5 ? 0 : 1;
        orientations[row][column] = orientation;
        segments[row][column] = tileParts(column, row, orientation);
      }
    }

    const boundary = [];
    for (let column = 0; column < cells; column += 1) {
      boundary.push([column, 0, "T"], [column, cells - 1, "B"]);
    }
    for (let row = 0; row < cells; row += 1) {
      boundary.push([0, row, "L"], [cells - 1, row, "R"]);
    }

    let cursor = boundary[Math.floor(rng() * boundary.length)].slice();
    const highlighted = new Set();
    const moves = {
      T: [0, -1, "B"],
      R: [1, 0, "L"],
      B: [0, 1, "T"],
      L: [-1, 0, "R"]
    };

    while (cursor[0] >= 0 && cursor[0] < cells && cursor[1] >= 0 && cursor[1] < cells) {
      const column = cursor[0];
      const row = cursor[1];
      const entering = cursor[2];
      const partIndex = segments[row][column].findIndex(function (part) {
        return part.ports.indexOf(entering) !== -1;
      });
      if (partIndex < 0) break;

      const key = column + ":" + row + ":" + partIndex;
      if (highlighted.has(key)) break;
      highlighted.add(key);

      const leaving = segments[row][column][partIndex].ports.find(function (port) {
        return port !== entering;
      });
      const move = moves[leaving];
      cursor = [column + move[0], row + move[1], move[2]];
    }

    for (let row = 0; row < cells; row += 1) {
      for (let column = 0; column < cells; column += 1) {
        segments[row][column].forEach(function (part, partIndex) {
          add(group, "path", {
            d: part.d,
            fill: "none",
            stroke: colorAt(theme, paletteShift + orientations[row][column]),
            "stroke-width": 4.6,
            "stroke-linecap": "round"
          });
          if (highlighted.has(column + ":" + row + ":" + partIndex)) {
            add(group, "path", {
              d: part.d,
              fill: "none",
              stroke: "#f58220",
              "stroke-width": 6.2,
              "stroke-linecap": "round",
              "stroke-linejoin": "round"
            });
          }
        });
      }
    }

    add(group, "rect", {
      x: min,
      y: min,
      width: cells * side,
      height: cells * side,
      fill: "none",
      stroke: theme.border,
      "stroke-width": 1.5
    });
  }

  const FAMILY_DEFINITIONS = [
    {
      id: "truchet",
      name: "Pavage de Truchet",
      note: "quarts de cercle · connexions · hasard",
      rule: "Une grille 4 × 4 est remplie de tuiles orientées au hasard ; chaque trait est un quart de cercle exact dont le rayon vaut la moitié du côté d’une tuile.",
      question: "Quels chemins sortent du cadre et lesquels forment une boucle ?",
      draw: drawTruchet
    },
    {
      id: "petals",
      name: "Rosace indocile",
      note: "rotation · rythme · asymétrie",
      rule: "Une couronne de 8 à 11 pétales partage un même centre ; seuls l’angle, la longueur et la palette varient dans des bornes étroites.",
      question: "Qu’est-ce qui reste invariant malgré les irrégularités ?",
      draw: drawPetals
    },
    {
      id: "weave",
      name: "Tissage affine",
      note: "courbes · correspondances · superposition",
      rule: "Cinq fils horizontaux et quatre fils verticaux relient des bords opposés par des courbes de Bézier contrôlées.",
      question: "Peut-on retrouver quelles extrémités sont reliées ?",
      draw: drawWeave
    },
    {
      id: "mosaic",
      name: "Mosaïque vivante",
      note: "grille · déformation · couleur",
      rule: "Une grille 4 × 4 garde son bord fixe ; chaque point intérieur peut bouger d’au plus 6,5 unités, soit moins d’un cinquième du côté d’une case.",
      question: "Quelle limite empêche les quadrilatères de se croiser ?",
      draw: drawMosaic
    },
    {
      id: "orbits",
      name: "Orbites modulaires",
      note: "cycles · points · transformations",
      rule: "Quatre ou cinq ellipses tournées partagent un centre ; des nœuds suivent leurs cycles et alternent cercle, carré et triangle.",
      question: "Quels cycles et quelles transformations reconnaît-on ?",
      draw: drawOrbits
    },
    {
      id: "bloom",
      name: "Éclosion discrète",
      note: "croissance · angle · échelle",
      rule: "Des formes sont placées sur une spirale en racine carrée avec un angle presque constant et une taille croissante.",
      question: "Comment l’angle fixe produit-il une figure qui ne se répète presque pas ?",
      draw: drawBloom
    }
  ];

  const FAMILIES = Object.freeze(FAMILY_DEFINITIONS.map(function (family) {
    return Object.freeze({
      id: family.id,
      name: family.name,
      note: family.note,
      rule: family.rule,
      question: family.question
    });
  }));

  function normalizeTheme(customTheme) {
    const custom = customTheme || {};
    const palette = Array.isArray(custom.palette) && custom.palette.length >= 3
      ? custom.palette.slice()
      : DEFAULT_THEME.palette.slice();
    return {
      card: custom.card || DEFAULT_THEME.card,
      border: custom.border || DEFAULT_THEME.border,
      muted: custom.muted || DEFAULT_THEME.muted,
      palette: palette
    };
  }

  function dateKey(value) {
    if (typeof value === "string") return value.slice(0, 10);
    const date = value instanceof Date ? value : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function dailySeed(familyId, options) {
    const settings = options || {};
    return [familyId, dateKey(settings.date), settings.identity || "commun", "mathsgo-v1"].join("|");
  }

  function randomIdentity() {
    if (global.crypto && typeof global.crypto.getRandomValues === "function") {
      const values = new Uint32Array(3);
      global.crypto.getRandomValues(values);
      return Array.from(values).map(function (value) { return value.toString(36); }).join("");
    }
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36) + Date.now().toString(36);
  }

  function getOrCreateIdentity(storageKey) {
    const key = storageKey || "mathsgo-generative-identity-v1";
    try {
      const existing = global.localStorage && global.localStorage.getItem(key);
      if (existing) return existing;
      const created = randomIdentity();
      if (global.localStorage) global.localStorage.setItem(key, created);
      return created;
    } catch (error) {
      if (!fallbackIdentity) fallbackIdentity = randomIdentity();
      return fallbackIdentity;
    }
  }

  function findFamily(familyId) {
    return FAMILY_DEFINITIONS.find(function (family) { return family.id === familyId; });
  }

  function createSvg(familyId, options) {
    const family = findFamily(familyId);
    if (!family) throw new Error("Famille d’icône inconnue : " + familyId);

    const settings = options || {};
    const seed = settings.seed || dailySeed(familyId, { date: settings.date, identity: settings.identity });
    const theme = normalizeTheme(settings.theme);
    const label = settings.label || family.name;
    const size = Number.isFinite(settings.size) && settings.size > 0 ? settings.size : null;
    const svg = makeSvg(label, theme, size);
    const uid = "mg-" + familyId + "-" + hashSeed(seed).toString(36) + "-" + (++instanceCount).toString(36);

    svg.setAttribute("data-mathsgo-family", familyId);
    svg.setAttribute("data-mathsgo-seed", seed);
    family.draw(svg, randomFactory(seed), uid, theme);
    return svg;
  }

  function createPersonalDailySvg(familyId, options) {
    const settings = Object.assign({}, options || {});
    const identity = settings.identity || getOrCreateIdentity(settings.storageKey);
    settings.seed = dailySeed(familyId, { date: settings.date, identity: identity });
    return createSvg(familyId, settings);
  }

  function personalDailyFamily(options) {
    const settings = options || {};
    const identity = settings.identity || getOrCreateIdentity(settings.storageKey);
    const seed = ["family", dateKey(settings.date), identity, "mathsgo-v1"].join("|");
    return FAMILIES[hashSeed(seed) % FAMILIES.length];
  }

  function createPersonalDailyIcon(options) {
    const settings = Object.assign({}, options || {});
    const identity = settings.identity || getOrCreateIdentity(settings.storageKey);
    const family = personalDailyFamily({ date: settings.date, identity: identity });
    settings.identity = identity;
    return createPersonalDailySvg(family.id, settings);
  }

  global.MathsGoGenerativeIcons = Object.freeze({
    version: VERSION,
    families: FAMILIES,
    createSvg: createSvg,
    createPersonalDailySvg: createPersonalDailySvg,
    personalDailyFamily: personalDailyFamily,
    createPersonalDailyIcon: createPersonalDailyIcon,
    dailySeed: dailySeed,
    getOrCreateIdentity: getOrCreateIdentity
  });
}(window));
