const { chromium } = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CAPTURES = "/tmp/coffres-solo-learning-qa";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function startServer() {
  const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
  const server = http.createServer((request, response) => {
    const clean = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = path.resolve(ROOT, `.${clean.endsWith("/") ? `${clean}index.html` : clean}`);
    if (!file.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(file)) return response.writeHead(404).end("Not found");
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function valueFor(mode, first, second) {
  const high = Math.max(first, second);
  const low = Math.min(first, second);
  if (mode === "sum") return first + second;
  if (mode === "difference") return high - low;
  if (mode === "product") return first * second;
  return high % low === 0 ? high / low : Number.NaN;
}

function neighborPairs() {
  const pairs = [];
  for (let first = 0; first < 16; first += 1) {
    if (first % 4 < 3) pairs.push([first, first + 1]);
    if (first < 12) pairs.push([first, first + 4]);
  }
  return pairs;
}

function solutionFor(state) {
  const pair = neighborPairs().find(([first, second]) => valueFor(state.mode, state.values[first], state.values[second]) === state.target);
  if (!pair) throw new Error(`Aucune solution pour ${state.mode} = ${state.target}`);
  return pair;
}

function wrongPairFor(state) {
  const pair = neighborPairs().find(([first, second]) => valueFor(state.mode, state.values[first], state.values[second]) !== state.target);
  if (!pair) throw new Error(`Aucune paire fausse pour ${state.mode} = ${state.target}`);
  return pair;
}

function equationFor(mode, first, second) {
  const ordered = mode === "difference" || mode === "quotient";
  const left = ordered ? Math.max(first, second) : first;
  const right = ordered ? Math.min(first, second) : second;
  const symbol = { sum: "+", difference: "−", product: "×", quotient: "÷" }[mode];
  return `${left} ${symbol} ${right} = ${valueFor(mode, first, second)}`;
}

async function state(page) {
  return page.evaluate(() => window.MATHSGO_COFFRES_SOLO.getState());
}

// « Sur ton plateau » (11/11/2026) : la copie réduite reprend le plateau courant case par case,
// la solution en vert, l'essai en rouge, et chaque nombre tient dans sa case.
async function assertMiniBoard(page, board, solutionPositions, essaiPositions, label) {
  const mini = await page.evaluate(() => [...document.querySelectorAll("#correction-board .correction-board-grid span")].map(cell => {
    const range = document.createRange();
    range.selectNodeContents(cell);
    const text = range.getBoundingClientRect();
    const box = cell.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(cell).borderLeftWidth);
    return {
      value: Number(cell.textContent),
      solution: cell.classList.contains("solution"),
      essai: cell.classList.contains("essai"),
      margin: Math.min(text.left - (box.left + border), (box.right - border) - text.right),
      border: getComputedStyle(cell).borderTopWidth
    };
  }));
  assert(await page.locator("#correction-board").isVisible(), `${label} : « Sur ton plateau » n'est pas visible.`);
  assert(mini.length === 16, `${label} : le petit plateau n'a pas 16 cases.`);
  assert(JSON.stringify(mini.map(cell => cell.value)) === JSON.stringify(board.values), `${label} : le petit plateau ne recopie pas le plateau joué.`);
  const solutions = mini.flatMap((cell, index) => cell.solution ? [index] : []);
  const essais = mini.flatMap((cell, index) => cell.essai ? [index] : []);
  assert(JSON.stringify(solutions) === JSON.stringify([...solutionPositions].sort((a, b) => a - b)), `${label} : les cases vertes ne sont pas celles de la solution.`);
  assert(JSON.stringify(essais) === JSON.stringify([...essaiPositions].sort((a, b) => a - b)), `${label} : les cases rouges ne sont pas celles de l'essai.`);
  assert(new Set(mini.map(cell => cell.border)).size === 1, `${label} : le vert et le rouge n'ont pas le même contour.`);
  const tight = mini.find(cell => cell.margin < 0.5);
  assert(!tight, `${label} : le nombre ${tight && tight.value} sort de sa case dans le petit plateau.`);
}

async function assertNoHorizontalOverflow(page, label) {
  const measure = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert(measure.scrollWidth <= measure.width, `${label} déborde horizontalement : ${measure.scrollWidth}px pour ${measure.width}px.`);
}

async function assertPointVisual(page, selector, mode, label) {
  const visual = page.locator(selector);
  assert(await visual.isVisible(), `${label} : le schéma de points n’est pas visible.`);

  if (mode === "sum") {
    const data = await visual.evaluate(node => {
      const rows = [...node.querySelectorAll(".quantity-row")];
      const boxes = rows.map(row => {
        const box = row.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, radius: getComputedStyle(row).borderRadius, text: row.textContent.trim() };
      });
      const parts = [...rows[1].querySelectorAll(":scope > .quantity-segment")].map(segment => {
        const box = segment.getBoundingClientRect();
        return { left: box.left, right: box.right, width: box.width, value: Number(getComputedStyle(segment).getPropertyValue("--quantity-value")), dots: segment.querySelectorAll(".quantity-dot").length };
      });
      const marker = node.querySelector(".sum-marker");
      const markerBox = marker.getBoundingClientRect();
      return {
        aria: node.getAttribute("aria-label"), boxes, parts,
        totalDots: rows[0].querySelectorAll(".quantity-dot").length,
        marker: { text: marker.textContent.trim(), left: markerBox.left, right: markerBox.right, bottom: markerBox.bottom, width: markerBox.width }
      };
    });
    assert(data.boxes.length === 2, `${label} : la somme doit avoir deux lignes rectangulaires.`);
    const [totalBox, partsBox] = data.boxes;
    assert(totalBox.radius === "0px" && partsBox.radius === "0px", `${label} : les rectangles de somme n’ont pas des angles droits.`);
    assert(Math.abs(totalBox.bottom - partsBox.top) <= 1, `${label} : les deux lignes de somme ne sont pas collées verticalement.`);
    assert(Math.abs(totalBox.left - partsBox.left) <= 1 && Math.abs(totalBox.width - partsBox.width) <= 1, `${label} : les deux lignes de somme ne sont pas alignées.`);
    assert(!totalBox.text && !partsBox.text, `${label} : du texte apparaît à l’intérieur des rectangles.`);
    assert(data.parts.length === 2, `${label} : les deux quantités de la somme ne sont pas séparées.`);
    const [first, second] = data.parts;
    assert(Math.abs(first.right - second.left) <= 1, `${label} : les deux rectangles de la somme ne sont pas jointifs.`);
    assert(data.totalDots === first.dots + second.dots, `${label} : les points du total ne correspondent pas aux deux quantités.`);
    assert(first.value === first.dots && second.value === second.dots, `${label} : une largeur de rectangle ne correspond pas à son nombre de points.`);
    assert(Math.abs(first.width / second.width - first.value / second.value) <= .08, `${label} : les largeurs de somme ne sont pas proportionnelles.`);
    assert(data.marker.text === `somme = ${data.totalDots}`, `${label} : le repère de somme est inexact.`);
    assert(Math.abs(data.marker.left - totalBox.left) <= 1 && Math.abs(data.marker.width - totalBox.width) <= 1, `${label} : le repère de somme n’est pas aligné sur toute la largeur.`);
    assert(data.marker.bottom <= totalBox.top, `${label} : le repère de somme n’est pas au-dessus du rectangle.`);
    assert(new RegExp(`${first.dots} plus ${second.dots} égale ${data.totalDots}\\.$`).test(data.aria), `${label} : l’équation parlée de la somme manque.`);
  } else if (mode === "difference") {
    const data = await visual.evaluate(node => {
      const upper = node.querySelector(".comparison-upper");
      const known = node.querySelector(".compare-known");
      const marker = node.querySelector(".difference-marker");
      const markerLabel = node.querySelector(".difference-marker-label");
      const box = element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height, radius: getComputedStyle(element).borderRadius, text: element.textContent.trim() };
      };
      return {
        aria: node.getAttribute("aria-label"),
        viewportWidth: innerWidth,
        diagram: box(node.querySelector(".comparison-model")),
        upper: box(upper),
        known: box(known),
        lower: box(node.querySelector(".comparison-lower")),
        marker: {
          ...box(marker),
          borderTop: getComputedStyle(marker).borderTopWidth,
          borderBottom: getComputedStyle(marker).borderBottomWidth,
          hookTop: getComputedStyle(marker, "::before").top,
          hookHeight: getComputedStyle(marker, "::before").height
        },
        markerLabel: {
          ...box(markerLabel),
          near: markerLabel.classList.contains("near"),
          whiteSpace: getComputedStyle(markerLabel).whiteSpace,
          lineHeight: Number.parseFloat(getComputedStyle(markerLabel).lineHeight),
          scrollWidth: markerLabel.scrollWidth
        },
        high: upper.querySelectorAll(".quantity-dot").length,
        low: known.querySelectorAll(".quantity-dot").length,
        unmatched: upper.querySelectorAll(".comparison-unit.unmatched .quantity-dot").length
      };
    });
    assert(data.upper.radius === "0px" && data.known.radius === "0px", `${label} : les rectangles de différence n’ont pas des angles droits.`);
    assert(Math.abs(data.upper.bottom - data.known.top) <= 1, `${label} : les lignes de comparaison ne sont pas collées.`);
    assert(Math.abs(data.upper.left - data.known.left) <= 1, `${label} : les points du bas ne commencent pas sous ceux du haut.`);
    assert(!data.upper.text && !data.known.text, `${label} : du texte apparaît dans les rectangles de comparaison.`);
    assert(data.unmatched === data.high - data.low, `${label} : les points non appariés ne donnent pas la différence.`);
    assert(Math.abs(data.known.width / data.upper.width - data.low / data.high) <= .04, `${label} : la longueur du rectangle inférieur n’est pas proportionnelle.`);
    const expectedMarkerLeft = data.upper.left + data.upper.width * data.low / data.high;
    assert(data.marker.top > data.upper.bottom && data.marker.bottom <= data.lower.bottom + 1, `${label} : le repère de différence n’est pas dans l’espace vide de la ligne inférieure.`);
    assert(data.marker.left >= data.known.right - 1, `${label} : le repère de différence chevauche le rectangle inférieur connu.`);
    assert(Math.abs(data.marker.left - expectedMarkerLeft) <= 1.5 && Math.abs(data.marker.right - data.upper.right) <= 1.5, `${label} : le repère de différence n’est pas aligné sur les points non appariés.`);
    assert(data.marker.borderTop === "2px" && data.marker.borderBottom === "0px" && data.marker.hookTop === "-7px" && data.marker.hookHeight === "7px", `${label} : le crochet de différence n’est pas orienté vers le haut.`);
    assert(data.markerLabel.text === `différence = ${data.unmatched}`, `${label} : le libellé de différence est inexact.`);
    assert(data.markerLabel.whiteSpace === "nowrap" && data.markerLabel.height <= data.markerLabel.lineHeight + 1, `${label} : le libellé de différence passe sur plusieurs lignes.`);
    if (data.markerLabel.near) {
      assert(data.markerLabel.top >= data.marker.bottom + 2 && data.markerLabel.left >= data.known.right - 1, `${label} : le libellé rapproché de différence chevauche le crochet ou la quantité connue.`);
    } else {
      assert(data.markerLabel.top >= data.known.bottom, `${label} : le libellé étroit de différence chevauche le schéma.`);
    }
    assert(data.markerLabel.left >= -1 && data.markerLabel.right <= data.viewportWidth + 1, `${label} : le libellé de différence sort de l’écran.`);
    assert(data.markerLabel.near === (data.unmatched / data.high >= .36), `${label} : le placement rapproché du libellé ne correspond pas à la largeur disponible.`);
    const markerCenter = (data.marker.left + data.marker.right) / 2;
    const labelCenter = (data.markerLabel.left + data.markerLabel.right) / 2;
    assert(Math.abs(labelCenter - markerCenter) <= 1.5 && data.markerLabel.scrollWidth <= data.viewportWidth + 1, `${label} : le libellé de différence n’est pas centré sous son repère.`);
    assert(data.aria.includes("Dans l’espace vide de la ligne inférieure") && data.aria.includes("repère orienté vers le haut"), `${label} : la position du repère manque dans l’alternative accessible.`);
    assert(new RegExp(`${data.high} moins ${data.low} égale ${data.unmatched}\\.$`).test(data.aria), `${label} : l’équation parlée de la différence manque.`);
  } else if (mode === "product") {
    const data = await visual.evaluate(node => {
      const grid = node.querySelector(".demo-dot-grid");
      const columnsMarker = node.querySelector(".dimension-columns");
      const columnsNumber = columnsMarker.querySelector("span");
      const rowsMarker = node.querySelector(".dimension-rows");
      const rowsNumber = rowsMarker.querySelector("span");
      const box = element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const columnsStyle = getComputedStyle(columnsMarker);
      const columnsNumberStyle = getComputedStyle(columnsNumber);
      const columnsStartStyle = getComputedStyle(columnsMarker, "::before");
      const columnsEndStyle = getComputedStyle(columnsMarker, "::after");
      const rowsStyle = getComputedStyle(rowsMarker);
      const numberStyle = getComputedStyle(rowsNumber);
      const bracketStyle = getComputedStyle(rowsMarker, "::before");
      return {
        aria: node.getAttribute("aria-label"),
        grid: box(grid),
        columnsMarker: {
          ...box(columnsMarker), text: columnsMarker.textContent.trim(),
          writingMode: columnsStyle.writingMode, transform: columnsStyle.transform,
          borderTop: columnsStyle.borderTopWidth, borderBottom: columnsStyle.borderBottomWidth
        },
        columnsNumber: { writingMode: columnsNumberStyle.writingMode, transform: columnsNumberStyle.transform },
        columnsCaps: {
          startBottom: columnsStartStyle.bottom, startLeft: columnsStartStyle.left,
          startWidth: columnsStartStyle.width, startHeight: columnsStartStyle.height,
          endBottom: columnsEndStyle.bottom, endRight: columnsEndStyle.right,
          endWidth: columnsEndStyle.width, endHeight: columnsEndStyle.height
        },
        rowsMarker: {
          ...box(rowsMarker), text: rowsMarker.textContent.trim(),
          writingMode: rowsStyle.writingMode, transform: rowsStyle.transform
        },
        rowsNumber: { writingMode: numberStyle.writingMode, transform: numberStyle.transform },
        bracket: {
          top: bracketStyle.top, right: bracketStyle.right, bottom: bracketStyle.bottom,
          width: bracketStyle.width,
          borderTop: bracketStyle.borderTopWidth, borderRight: bracketStyle.borderRightWidth,
          borderBottom: bracketStyle.borderBottomWidth, borderLeft: bracketStyle.borderLeftWidth
        },
        dots: grid.querySelectorAll(".demo-dot").length,
        columns: Number(getComputedStyle(grid).getPropertyValue("--demo-columns"))
      };
    });
    const rows = data.dots / data.columns;
    assert(Number.isInteger(rows), `${label} : le réseau ne contient pas un nombre entier de rangées.`);
    assert(data.columnsMarker.text === String(data.columns), `${label} : le nombre de colonnes est incorrect.`);
    assert(data.rowsMarker.text === String(rows), `${label} : le nombre de rangées est incorrect.`);
    assert(Math.abs(data.columnsMarker.left - data.grid.left) <= 1 && Math.abs(data.columnsMarker.width - data.grid.width) <= 1, `${label} : le repère des colonnes n’est pas aligné au-dessus du réseau.`);
    assert(data.columnsMarker.bottom <= data.grid.top, `${label} : le repère des colonnes n’est pas extérieur au réseau.`);
    assert(data.columnsMarker.writingMode === "horizontal-tb" && data.columnsMarker.transform === "none" && data.columnsNumber.writingMode === "horizontal-tb" && data.columnsNumber.transform === "none", `${label} : le nombre supérieur est tourné.`);
    assert(data.columnsMarker.borderTop === "0px" && data.columnsMarker.borderBottom === "2px" && data.columnsCaps.startBottom === "-6px" && data.columnsCaps.startLeft === "0px" && data.columnsCaps.startWidth === "2px" && data.columnsCaps.startHeight === "6px" && data.columnsCaps.endBottom === "-6px" && data.columnsCaps.endRight === "0px" && data.columnsCaps.endWidth === "2px" && data.columnsCaps.endHeight === "6px", `${label} : les extrémités du crochet supérieur ne sont pas dirigées vers le réseau.`);
    assert(data.rowsMarker.right <= data.grid.left && Math.abs(data.rowsMarker.top - data.grid.top) <= 1 && Math.abs(data.rowsMarker.height - data.grid.height) <= 1, `${label} : le repère des rangées n’est pas aligné sur le côté.`);
    assert(data.rowsMarker.writingMode === "horizontal-tb" && data.rowsMarker.transform === "none" && data.rowsNumber.writingMode === "horizontal-tb" && data.rowsNumber.transform === "none", `${label} : le nombre latéral est tourné.`);
    assert(data.bracket.top === "0px" && data.bracket.right === "0px" && data.bracket.bottom === "0px" && data.bracket.width === "7px", `${label} : le crochet latéral ne couvre pas exactement la hauteur du réseau.`);
    assert(data.bracket.borderTop === "2px" && data.bracket.borderRight === "0px" && data.bracket.borderBottom === "2px" && data.bracket.borderLeft === "2px", `${label} : les extrémités du crochet latéral ne sont pas dirigées vers le réseau.`);
    assert(!/(?:longueur|largeur)/i.test(`${data.columnsMarker.text} ${data.rowsMarker.text}`), `${label} : un mot interdit est écrit dans le repère.`);
    assert(new RegExp(`${rows} fois ${data.columns} égale ${data.dots}\\.$`).test(data.aria), `${label} : l’équation parlée du produit manque.`);
  } else {
    const data = await visual.evaluate(node => {
      const box = element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      return {
        aria: node.getAttribute("aria-label"),
        viewportWidth: innerWidth,
        layoutColumns: getComputedStyle(node.querySelector(".demo-interpretations")).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
        insideCorrection: Boolean(node.closest("#correction-visual")),
        views: [...node.querySelectorAll(".demo-interpretation")].map(view => {
          const bar = view.querySelector(".quotient-bar");
          return {
            label: view.querySelector(".demo-caption").textContent.trim(),
            bar: {
              ...box(bar),
              radius: getComputedStyle(bar).borderRadius,
              text: bar.textContent.trim(),
              groupCount: Number(bar.dataset.groupCount),
              groupSize: Number(bar.dataset.groupSize),
              totalUnits: Number(bar.dataset.totalUnits)
            },
            groups: [...bar.querySelectorAll(":scope > .quotient-bar-group")].map(group => ({
              ...box(group),
              units: [...group.querySelectorAll(":scope > .quotient-bar-unit")].map(unit => ({
                ...box(unit),
                dotWidth: Number.parseFloat(getComputedStyle(unit, "::after").width)
              }))
            }))
          };
        })
      };
    });
    const labels = data.views.map(view => view.label);
    assert(labels.length === 2, `${label} : les deux interprétations du quotient manquent.`);
    // La correction empile toujours les deux interprétations (coffres-learning.css) ; l'aide et le cours passent à deux colonnes au-dessus de 520 px.
    assert(data.layoutColumns === (data.viewportWidth <= 520 || data.insideCorrection ? 1 : 2), `${label} : les interprétations du quotient n’ont pas la disposition attendue à ${data.viewportWidth} px.`);
    const grouping = labels[0].match(/^Grouper : (\d+) paquets de (\d+)$/);
    const sharing = labels[1].match(/^Partager : (\d+) paquets de (\d+)$/);
    assert(grouping, `${label} : le groupement en paquets n’est pas explicite.`);
    assert(sharing, `${label} : le partage en paquets n’est pas explicite.`);
    const expected = [
      { total: Number(grouping[1]) * Number(grouping[2]), groupCount: Number(grouping[1]), groupSize: Number(grouping[2]) },
      { total: Number(sharing[1]) * Number(sharing[2]), groupCount: Number(sharing[1]), groupSize: Number(sharing[2]) }
    ];
    assert(expected[0].total === expected[1].total, `${label} : les deux interprétations ne représentent pas le même total.`);
    data.views.forEach((view, index) => {
      const wanted = expected[index];
      assert(view.bar.radius === "0px", `${label} : la barre ${index + 1} n’a pas des angles droits.`);
      assert(!view.bar.text, `${label} : du texte apparaît à l’intérieur de la barre ${index + 1}.`);
      assert(view.bar.groupCount === wanted.groupCount && view.groups.length === wanted.groupCount, `${label} : la barre ${index + 1} n’a pas le bon nombre de paquets.`);
      assert(view.bar.groupSize === wanted.groupSize && view.groups.every(group => group.units.length === wanted.groupSize), `${label} : un paquet de la barre ${index + 1} n’a pas le bon nombre d’unités.`);
      assert(view.bar.totalUnits === wanted.total && view.groups.reduce((sum, group) => sum + group.units.length, 0) === wanted.total, `${label} : la barre ${index + 1} ne représente pas le total.`);
      assert(view.groups.every(group => group.units.every(unit => unit.width > 0 && unit.dotWidth >= 3)), `${label} : les unités de la barre ${index + 1} ne sont pas visibles.`);
      for (let groupIndex = 1; groupIndex < view.groups.length; groupIndex += 1) {
        assert(Math.abs(view.groups[groupIndex - 1].right - view.groups[groupIndex].left) <= 1, `${label} : les paquets de la barre ${index + 1} ne sont pas jointifs.`);
      }
    });
    assert(data.aria.includes(`Combien de paquets de ${expected[0].groupSize} dans ${expected[0].total} ? ${expected[0].groupCount}.`) && data.aria.includes(`Partager ${expected[1].total} en ${expected[1].groupCount} paquets : ${expected[1].groupSize} dans chacun.`), `${label} : les deux sens du quotient manquent dans l’alternative accessible.`);
    assert(/première barre rectangulaire/i.test(data.aria) && /seconde barre rectangulaire/i.test(data.aria), `${label} : les deux barres ne sont pas décrites dans l’alternative accessible.`);
  }
}

async function assertHelpCourseCard(page, mode, label) {
  const data = await page.evaluate(expectedMode => {
    const source = document.querySelector(`#lesson article[data-operation="${expectedMode}"]`);
    const clone = document.querySelector(`#help-visual > article[data-operation="${expectedMode}"]`);
    const cards = [...document.querySelectorAll("#help-visual > article[data-operation]")];
    const convention = document.querySelector(`#help-visual .operation-conventions [data-operation="${expectedMode}"]`);
    return {
      count: cards.length,
      modes: cards.map(card => card.dataset.operation),
      sourceHtml: source?.innerHTML || "",
      cloneHtml: clone?.innerHTML || "",
      cloneText: clone?.innerText || "",
      convention: convention?.textContent.trim() || "",
      order: document.querySelector("#help-visual .operation-order")?.textContent.trim() || ""
    };
  }, mode);
  assert(data.count === 1 && data.modes[0] === mode, `${label} : l’aide n’affiche pas uniquement la carte ${mode}.`);
  assert(data.sourceHtml && data.cloneHtml === data.sourceHtml, `${label} : la carte d’aide diffère de celle du mémo.`);
  const courseSentences = {
    sum: "La somme de 3 et de 2 est 5.",
    difference: "La différence entre 5 et 2 est 3.",
    product: "Le produit de 3 par 4 est 12.",
    quotient: "Le quotient de 8 par 2 est 4."
  };
  assert(data.cloneText.includes(courseSentences[mode]), `${label} : la phrase du cours manque dans l’aide.`);
  if (mode === "difference" || mode === "quotient") {
    assert(data.order === "Tu peux choisir les deux cases dans n’importe quel ordre.", `${label} : la liberté de l’ordre des clics manque.`);
    assert(data.convention.includes("le jeu calcule le plus grand nombre"), `${label} : la convention de calcul manque.`);
  } else {
    assert(!data.order && !data.convention, `${label} : une convention étrangère à ${mode} est affichée.`);
  }
}

async function auditPointJourney(browser, base, randomValue, expectedMode, errors) {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  page.on("pageerror", error => errors.push(`${expectedMode} : ${error.message}`));
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo`, { waitUntil: "load" });
    await page.evaluate(value => { Math.random = () => value; }, randomValue);
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    assert((await state(page)).mode === expectedMode, `Le scénario déterministe attendu en ${expectedMode} n’est pas obtenu.`);

    await page.locator("#help-button").click();
    await page.waitForFunction(() => document.activeElement.id === "help-title");
    await assertHelpCourseCard(page, expectedMode, `Aide ${expectedMode}`);
    await assertNoHorizontalOverflow(page, `Aide ${expectedMode} à 320 px`);
    const helpMetrics = await page.locator("#help-dialog .help-card").evaluate(card => {
      const actions = card.querySelector(".dialog-actions").getBoundingClientRect();
      const actionButtons = [...card.querySelectorAll(".dialog-actions button")].map(button => {
        const rect = button.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height };
      });
      const content = card.querySelector(".help-operation-grid");
      const title = card.querySelector("#help-title").getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      return {
        cardOverflow: getComputedStyle(card).overflowY,
        contentOverflow: getComputedStyle(content).overflowY,
        contentScrollTop: content.scrollTop,
        contentScrollHeight: content.scrollHeight,
        contentClientHeight: content.clientHeight,
        actionsTop: actions.top,
        actionsBottom: actions.bottom,
        actionsHeight: actions.height,
        actionButtons,
        titleTop: title.top,
        titleBottom: title.bottom,
        cardTop: cardBox.top,
        cardBottom: cardBox.bottom,
        cardScrollTop: card.scrollTop,
        viewportHeight: window.innerHeight
      };
    });
    assert(helpMetrics.cardOverflow === "hidden" && helpMetrics.contentOverflow === "auto", `Aide ${expectedMode} : seul le cours ciblé doit défiler (${JSON.stringify(helpMetrics)}).`);
    assert(helpMetrics.contentScrollTop === 0, `Aide ${expectedMode} : la carte ne commence pas en haut.`);
    assert(helpMetrics.cardScrollTop === 0 && helpMetrics.titleTop >= helpMetrics.cardTop && helpMetrics.titleBottom <= helpMetrics.cardBottom, `Aide ${expectedMode} : le titre du dialogue n’est pas visible (${JSON.stringify(helpMetrics)}).`);
    assert(helpMetrics.actionsHeight > 0 && helpMetrics.actionsTop >= 0 && helpMetrics.actionsBottom <= helpMetrics.viewportHeight + 1 && helpMetrics.actionButtons.every(button => button.height >= 40 && button.top >= 0 && button.bottom <= helpMetrics.viewportHeight + 1), `Aide ${expectedMode} : les deux actions ne restent pas entièrement visibles à 320 × 568 (${JSON.stringify(helpMetrics)}).`);
    if (expectedMode === "product") {
      assert(helpMetrics.contentScrollHeight <= helpMetrics.contentClientHeight + 1, `Aide produit : le cours complet devrait tenir sans défilement à 320 × 568 (${JSON.stringify(helpMetrics)}).`);
    }
    await page.screenshot({ path: path.join(CAPTURES, `aide-${expectedMode}-320.png`) });
    if (helpMetrics.contentScrollHeight > helpMetrics.contentClientHeight + 1) {
      await page.locator("#help-visual").focus();
      await page.keyboard.press("PageDown");
      await page.waitForFunction(() => document.querySelector("#help-visual").scrollTop > 0);
      assert(await page.evaluate(() => document.activeElement.id === "help-visual"), `Aide ${expectedMode} : le cours défilable n’est pas accessible au clavier.`);
      const scrolled = await page.locator("#help-visual").evaluate(content => {
        content.scrollTop = content.scrollHeight;
        return content.scrollTop;
      });
      assert(scrolled > 0, `Aide ${expectedMode} : la carte longue ne peut pas défiler.`);
      assert(await page.locator("#show-solution").isVisible(), `Aide ${expectedMode} : Montrer une solution disparaît après défilement.`);
      await page.screenshot({ path: path.join(CAPTURES, `aide-${expectedMode}-320-bas.png`) });
    }

    const boardBeforeSolution = await state(page);
    const expectedSolution = await page.evaluate(({ mode, target, values }) => window.MATHSGO_COFFRES_SOLO.findSolutionPair(mode, target, values), boardBeforeSolution);
    assert(expectedSolution, `Solution demandée ${expectedMode} : aucune paire du plateau courant n’est trouvée.`);
    assert(neighborPairs().some(([first, second]) => first === expectedSolution.positions[0] && second === expectedSolution.positions[1]), `Solution demandée ${expectedMode} : la paire proposée n’est pas voisine sur le plateau courant.`);
    await page.locator("#show-solution").click();
    await page.waitForFunction(() => document.activeElement.id === "correction-title");
    const boardDuringSolution = await state(page);
    assert(boardDuringSolution.boardId === boardBeforeSolution.boardId && boardDuringSolution.target === boardBeforeSolution.target && JSON.stringify(boardDuringSolution.values) === JSON.stringify(boardBeforeSolution.values), `Solution demandée ${expectedMode} : le plateau a changé avant l’affichage de la paire.`);
    const correctionSentence = await page.locator("#correction-solution").innerText();
    assert(correctionSentence.includes(equationFor(expectedMode, ...expectedSolution.pair)), `Solution demandée ${expectedMode} : la correction ne reprend pas une paire réelle du plateau courant.`);
    await assertPointVisual(page, "#correction-visual .learning-demo", expectedMode, `Solution demandée ${expectedMode}`);
    await page.locator("#close-correction").click();
    await page.locator("#correction-dialog").waitFor({ state: "hidden" });

    const beforeMistake = await state(page);
    assert(beforeMistake.mode === expectedMode, `La solution demandée ne conserve pas ${expectedMode}.`);
    const [wrongFirst, wrongSecond] = wrongPairFor(beforeMistake);
    await page.locator(`.rune[data-index="${wrongFirst}"]`).click();
    await page.locator(`.rune[data-index="${wrongSecond}"]`).click();
    await page.waitForFunction(() => document.activeElement.id === "correction-title");
    assert((await page.locator("#correction-choice").innerText()).startsWith("Ton essai"), `La correction d’erreur ${expectedMode} n’annonce pas le calcul.`);
    await assertPointVisual(page, "#correction-visual .learning-demo", expectedMode, `Correction après erreur ${expectedMode}`);
    const mistakeSolution = await page.evaluate(({ mode, target, values }) => window.MATHSGO_COFFRES_SOLO.findSolutionPair(mode, target, values), beforeMistake);
    await assertMiniBoard(page, beforeMistake, mistakeSolution.positions, [wrongFirst, wrongSecond], `Correction ${expectedMode} à 320 px`);
    await assertNoHorizontalOverflow(page, `Correction ${expectedMode} à 320 px`);
    await page.screenshot({ path: path.join(CAPTURES, `correction-${expectedMode}-320.png`) });
  } finally {
    await page.close();
  }
}

async function auditExtremeVisual(browser, base, { mode, first, second, width, height = 720, capture }, errors) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on("pageerror", error => errors.push(`${mode} ${first}/${second} à ${width}px : ${error.message}`));
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo`, { waitUntil: "load" });
    await page.evaluate(({ nextMode, firstValue, secondValue }) => {
      const stage = document.createElement("main");
      stage.style.cssText = "width:100%;min-height:100vh;padding:8px;";
      const panel = document.createElement("section");
      panel.id = "extreme-preview";
      panel.className = "learning-panel";
      panel.style.cssText = "width:min(100%,620px);margin:0 auto;";
      panel.append(window.MATHSGO_COFFRES_SOLO.createOperationVisual(nextMode, firstValue, secondValue));
      stage.append(panel);
      document.body.replaceChildren(stage);
    }, { nextMode: mode, firstValue: first, secondValue: second });
    await assertPointVisual(page, "#extreme-preview .learning-demo", mode, `${mode} ${first}/${second} à ${width} px`);
    await assertNoHorizontalOverflow(page, `${mode} ${first}/${second} à ${width} px`);
    await page.screenshot({ path: path.join(CAPTURES, capture), fullPage: true });
  } finally {
    await page.close();
  }
}

async function auditProductMemo(browser, base, {
  route, wrapperSelector, gridSelector, markerSelector, numberSelector,
  topMarkerSelector, topNumberSelector, captureSelector, pageName, width
}, errors) {
  const page = await browser.newPage({ viewport: { width, height: width <= 390 ? 844 : 900 } });
  page.on("pageerror", error => errors.push(`${pageName} à ${width}px : ${error.message}`));
  try {
    await page.goto(`${base}${route}`, { waitUntil: "load" });
    await page.locator(wrapperSelector).first().waitFor({ state: "visible" });
    const markers = await page.locator(wrapperSelector).evaluateAll((nodes, selectors) => nodes.map(node => {
      const grid = node.querySelector(selectors.gridSelector);
      const marker = node.querySelector(selectors.markerSelector);
      const number = selectors.numberSelector ? marker.querySelector(selectors.numberSelector) : marker;
      const topMarker = node.querySelector(selectors.topMarkerSelector);
      const topNumber = selectors.topNumberSelector ? topMarker.querySelector(selectors.topNumberSelector) : topMarker;
      const box = element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const markerStyle = getComputedStyle(marker);
      const numberStyle = getComputedStyle(number);
      const bracketStyle = getComputedStyle(marker, "::before");
      const topMarkerStyle = getComputedStyle(topMarker);
      const topNumberStyle = getComputedStyle(topNumber);
      const topStartStyle = getComputedStyle(topMarker, "::before");
      const topEndStyle = getComputedStyle(topMarker, "::after");
      return {
        grid: box(grid),
        topMarker: {
          ...box(topMarker), text: topMarker.textContent.trim(),
          writingMode: topMarkerStyle.writingMode, transform: topMarkerStyle.transform,
          borderTop: topMarkerStyle.borderTopWidth, borderBottom: topMarkerStyle.borderBottomWidth
        },
        topNumber: { writingMode: topNumberStyle.writingMode, transform: topNumberStyle.transform },
        topCaps: {
          startBottom: topStartStyle.bottom, startLeft: topStartStyle.left,
          startWidth: topStartStyle.width, startHeight: topStartStyle.height,
          endBottom: topEndStyle.bottom, endRight: topEndStyle.right,
          endWidth: topEndStyle.width, endHeight: topEndStyle.height
        },
        marker: {
          ...box(marker), text: marker.textContent.trim(),
          writingMode: markerStyle.writingMode, transform: markerStyle.transform
        },
        number: { writingMode: numberStyle.writingMode, transform: numberStyle.transform },
        bracket: {
          top: bracketStyle.top, right: bracketStyle.right, bottom: bracketStyle.bottom,
          width: bracketStyle.width,
          borderTop: bracketStyle.borderTopWidth, borderRight: bracketStyle.borderRightWidth,
          borderBottom: bracketStyle.borderBottomWidth, borderLeft: bracketStyle.borderLeftWidth
        }
      };
    }), { gridSelector, markerSelector, numberSelector, topMarkerSelector, topNumberSelector });

    assert(markers.length === 2, `${pageName} à ${width}px : les deux repères latéraux du produit sont absents.`);
    for (const [index, data] of markers.entries()) {
      const label = `${pageName}, produit ${index + 1} à ${width}px`;
      assert(Math.abs(data.topMarker.left - data.grid.left) <= 1 && Math.abs(data.topMarker.width - data.grid.width) <= 1 && data.topMarker.bottom <= data.grid.top, `${label} : le crochet supérieur n’est pas aligné sur toute la largeur du réseau.`);
      assert(data.topMarker.writingMode === "horizontal-tb" && data.topMarker.transform === "none" && data.topNumber.writingMode === "horizontal-tb" && data.topNumber.transform === "none", `${label} : le nombre ${data.topMarker.text} du haut est tourné.`);
      assert(data.topMarker.borderTop === "0px" && data.topMarker.borderBottom === "2px" && data.topCaps.startBottom === "-6px" && data.topCaps.startLeft === "0px" && data.topCaps.startWidth === "2px" && data.topCaps.startHeight === "6px" && data.topCaps.endBottom === "-6px" && data.topCaps.endRight === "0px" && data.topCaps.endWidth === "2px" && data.topCaps.endHeight === "6px", `${label} : les extrémités du crochet supérieur ne pointent pas vers le réseau.`);
      assert(data.marker.right <= data.grid.left && Math.abs(data.marker.top - data.grid.top) <= 1 && Math.abs(data.marker.height - data.grid.height) <= 1, `${label} : le crochet latéral ne couvre pas exactement la hauteur du réseau.`);
      assert(data.marker.writingMode === "horizontal-tb" && data.marker.transform === "none" && data.number.writingMode === "horizontal-tb" && data.number.transform === "none", `${label} : le nombre ${data.marker.text} est tourné.`);
      assert(data.bracket.top === "0px" && data.bracket.right === "0px" && data.bracket.bottom === "0px" && data.bracket.width === "7px", `${label} : le tracé du crochet n’occupe pas toute la hauteur.`);
      assert(data.bracket.borderTop === "2px" && data.bracket.borderRight === "0px" && data.bracket.borderBottom === "2px" && data.bracket.borderLeft === "2px", `${label} : les deux petits traits ne pointent pas vers le réseau.`);
    }
    await assertNoHorizontalOverflow(page, `${pageName} à ${width}px`);
    await page.locator(captureSelector).screenshot({ path: path.join(CAPTURES, `produit-${pageName}-${width}.png`) });
  } finally {
    await page.close();
  }
}

async function auditDuoBarModels(browser, base, width, errors) {
  const page = await browser.newPage({ viewport: { width, height: width <= 390 ? 844 : 900 } });
  page.on("pageerror", error => errors.push(`bordures duo à ${width}px : ${error.message}`));
  try {
    await page.goto(`${base}/outils/club_maths/coffres_magiques.html?mode=duo`, { waitUntil: "load" });
    await page.locator("#rules").waitFor({ state: "visible" });
    const data = await page.evaluate(() => {
      const box = element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
          borderTop: style.borderTopWidth, borderRight: style.borderRightWidth,
          borderBottom: style.borderBottomWidth, borderLeft: style.borderLeftWidth,
          boxShadow: style.boxShadow
        };
      };
      const sumRows = [...document.querySelectorAll(".sum-bar-model .bar-row")];
      const differenceUpper = document.querySelector(".difference-bar-model .bar-row");
      const differenceKnown = document.querySelector(".difference-known");
      const differenceMarker = document.querySelector(".difference-marker");
      const sumMarker = document.querySelector(".sum-marker");
      const divider = [...document.querySelectorAll(".sum-bar-model .bar-row")].at(-1).querySelector(".bar-segment:first-child");
      const conventions = document.querySelector("#rules .operation-conventions");
      const pseudo = (element, selector) => {
        const style = getComputedStyle(element, selector);
        return {
          top: style.top, right: style.right, bottom: style.bottom, left: style.left,
          borderTop: style.borderTopWidth, borderRight: style.borderRightWidth,
          borderBottom: style.borderBottomWidth, borderLeft: style.borderLeftWidth
        };
      };
      return {
        sumRows: sumRows.map(box),
        sumMarker: { ...box(sumMarker), hook: pseudo(sumMarker, "::before") },
        differenceUpper: box(differenceUpper),
        differenceKnown: box(differenceKnown),
        differenceMarker: { ...box(differenceMarker), hook: pseudo(differenceMarker, "::before") },
        divider: box(divider),
        conventions: conventions.innerText.trim()
      };
    });

    assert(data.sumRows.length === 2, `duo à ${width}px : les deux rectangles de somme manquent.`);
    assert(data.sumRows[0].borderTop === "2px" && data.sumRows[0].borderRight === "2px" && data.sumRows[0].borderBottom === "2px" && data.sumRows[0].borderLeft === "2px", `duo à ${width}px : le rectangle total de la somme n’a pas un contour complet.`);
    assert(data.sumRows[1].borderTop === "0px" && data.sumRows[1].borderRight === "2px" && data.sumRows[1].borderBottom === "2px" && data.sumRows[1].borderLeft === "2px", `duo à ${width}px : la ligne des deux parties n’a pas le contour jointif attendu.`);
    assert(Math.abs(data.sumRows[0].bottom - data.sumRows[1].top) <= 1, `duo à ${width}px : les deux lignes de somme ne sont pas collées.`);
    assert(data.divider.borderRight === "2px", `duo à ${width}px : la séparation entre 3 et 2 est absente.`);
    assert(Math.abs(data.sumMarker.left - data.sumRows[0].left) <= 1 && Math.abs(data.sumMarker.right - data.sumRows[0].right) <= 1 && Math.abs(data.sumMarker.bottom - data.sumRows[0].top) <= 1, `duo à ${width}px : le crochet de somme ne couvre pas exactement la barre.`);
    assert(data.sumMarker.hook.bottom === "0px" && data.sumMarker.hook.borderTop === "2px" && data.sumMarker.hook.borderRight === "2px" && data.sumMarker.hook.borderBottom === "0px" && data.sumMarker.hook.borderLeft === "2px", `duo à ${width}px : le crochet de somme n’est pas orienté vers la barre.`);
    assert(data.differenceUpper.borderTop === "2px" && data.differenceUpper.borderRight === "2px" && data.differenceUpper.borderBottom === "2px" && data.differenceUpper.borderLeft === "2px", `duo à ${width}px : la quantité supérieure de différence n’a pas un contour complet.`);
    assert(data.differenceKnown.borderTop === "0px" && data.differenceKnown.borderRight === "2px" && data.differenceKnown.borderBottom === "2px" && data.differenceKnown.borderLeft === "2px", `duo à ${width}px : la quantité inférieure de différence n’a pas le contour jointif attendu.`);
    assert(Math.abs(data.differenceUpper.bottom - data.differenceKnown.top) <= 1, `duo à ${width}px : les deux quantités de différence ne sont pas collées.`);
    assert(Math.abs(data.differenceMarker.left - data.differenceKnown.right) <= 1 && Math.abs(data.differenceMarker.right - data.differenceUpper.right) <= 1 && Math.abs(data.differenceMarker.top - data.differenceUpper.bottom) <= 1, `duo à ${width}px : le crochet de différence n’est pas aligné sur les points sans correspondant.`);
    assert(data.differenceMarker.hook.top === "0px" && data.differenceMarker.hook.borderTop === "0px" && data.differenceMarker.hook.borderRight === "2px" && data.differenceMarker.hook.borderBottom === "2px" && data.differenceMarker.hook.borderLeft === "2px", `duo à ${width}px : le crochet de différence n’est pas orienté vers les points.`);
    assert([...data.sumRows, data.differenceUpper, data.differenceKnown].every(item => item.boxShadow === "none"), `duo à ${width}px : une fausse bordure en ombre interne subsiste.`);
    assert(data.conventions.includes("Tu peux choisir les deux cases dans n’importe quel ordre") && data.conventions.includes("le jeu calcule le plus grand nombre ÷ le plus petit"), `duo à ${width}px : les règles d’ordre compactes manquent.`);
    await assertNoHorizontalOverflow(page, `bordures duo à ${width}px`);
    await page.locator("#rules .operation-visual-card:nth-child(1)").screenshot({ path: path.join(CAPTURES, `bordure-somme-duo-${width}.png`) });
    await page.locator("#rules .operation-visual-card:nth-child(2)").screenshot({ path: path.join(CAPTURES, `bordure-difference-duo-${width}.png`) });
  } finally {
    await page.close();
  }
}

async function auditIntroMemo(browser, base, width, errors) {
  const page = await browser.newPage({ viewport: { width, height: width === 320 ? 568 : width === 390 ? 844 : 768 } });
  page.on("pageerror", error => errors.push(`mémo solo à ${width}px : ${error.message}`));
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo`, { waitUntil: "load" });
    await page.waitForFunction(() => document.activeElement.id === "start-game");
    assert(await page.locator("#lesson .operation-grid").evaluate(grid => grid.scrollTop === 0), `mémo solo à ${width}px : l’introduction ne commence pas en haut.`);
    assert(await page.locator("#lesson .lesson-actions button").count() === 1, `mémo solo à ${width}px : l’introduction propose plusieurs actions équivalentes.`);
    assert(await page.locator("#show-lesson").count() === 0, `mémo solo à ${width}px : le cours complet peut encore être rouvert.`);
    await assertNoHorizontalOverflow(page, `mémo solo initial à ${width}px`);
    await page.screenshot({ path: path.join(CAPTURES, `memo-initial-${width}.png`) });
    const scroll = await page.locator("#lesson .operation-grid").evaluate(grid => {
      const canScroll = grid.scrollHeight > grid.clientHeight + 1;
      grid.scrollTop = grid.scrollHeight;
      return { canScroll, top: grid.scrollTop };
    });
    if (scroll.canScroll) assert(scroll.top > 0, `mémo solo à ${width}px : le contenu long ne défile pas.`);
    assert(await page.locator("#start-game").isVisible(), `mémo solo à ${width}px : J’ai compris, jouer disparaît en bas du cours.`);
    await page.screenshot({ path: path.join(CAPTURES, `memo-bas-${width}.png`) });
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    assert((await state(page)).boardId === 1, `mémo solo à ${width}px : le démarrage ne crée pas exactement le premier plateau.`);
  } finally {
    await page.close();
  }
}

// Grand écran (ordinateur, vidéoprojection) : tout le plateau et ses commandes tiennent sans défilement,
// le cours complet montre ses quatre cartes d'un coup, et une clé gagnée attend le bouton « Coffre suivant ».
async function auditGrandEcran(browser, base, { width, height }, errors) {
  const page = await browser.newPage({ viewport: { width, height } });
  const label = `grand écran ${width} × ${height}`;
  page.on("pageerror", error => errors.push(`${label} : ${error.message}`));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 25), ...args);
  });
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo`, { waitUntil: "load" });
    await page.waitForFunction(() => document.activeElement.id === "start-game");
    const lesson = await page.evaluate(() => {
      const grid = document.querySelector("#lesson .operation-grid");
      const cards = [...document.querySelectorAll("#lesson article[data-operation]")].map(card => card.getBoundingClientRect());
      const button = document.querySelector("#start-game").getBoundingClientRect();
      return { scrollHeight: grid.scrollHeight, clientHeight: grid.clientHeight, cards, buttonBottom: button.bottom, viewportHeight: innerHeight };
    });
    assert(lesson.scrollHeight <= lesson.clientHeight + 1, `${label} : le cours complet devrait montrer ses quatre cartes sans défilement (${lesson.scrollHeight} > ${lesson.clientHeight}).`);
    assert(lesson.cards.length === 4 && lesson.cards.every(card => card.top >= 0 && card.bottom <= lesson.viewportHeight) && lesson.buttonBottom <= lesson.viewportHeight, `${label} : une carte du cours ou le bouton de départ sort de l’écran.`);
    await assertNoHorizontalOverflow(page, `${label} : cours`);
    await page.screenshot({ path: path.join(CAPTURES, `cours-${width}x${height}.png`) });

    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    const layout = await page.evaluate(() => {
      const box = element => element.getBoundingClientRect();
      const board = box(document.querySelector("#board"));
      const toolbar = box(document.querySelector(".solo-toolbar"));
      const challenge = box(document.querySelector(".challenge"));
      const rune = getComputedStyle(document.querySelector(".rune"));
      return { board, toolbar, challenge, runeFont: parseFloat(rune.fontSize), mainBottom: box(document.querySelector("main.solo-page")).bottom, viewportHeight: innerHeight };
    });
    assert(layout.mainBottom <= layout.viewportHeight + 1, `${label} : la carte du plateau dépasse de l’écran (${layout.mainBottom} > ${layout.viewportHeight}).`);
    assert(layout.board.bottom <= layout.viewportHeight && layout.toolbar.bottom <= layout.viewportHeight && layout.toolbar.top >= 0, `${label} : le plateau ou les boutons Aide / Nouvelle partie sortent de l’écran.`);
    assert(layout.board.width >= 500 && Math.abs(layout.board.width - layout.board.height) <= 1, `${label} : le plateau n’occupe pas la hauteur disponible (${layout.board.width} × ${layout.board.height}).`);
    assert(layout.challenge.right <= layout.board.left, `${label} : le défi n’est pas à gauche du plateau.`);
    assert(layout.runeFont >= 48, `${label} : les nombres du plateau restent petits (${layout.runeFont}px).`);
    await page.screenshot({ path: path.join(CAPTURES, `plateau-${width}x${height}.png`) });

    await page.locator("#help-button").click();
    await page.waitForFunction(() => document.activeElement.id === "help-title");
    const help = await page.evaluate(() => {
      const card = document.querySelector("#help-dialog .dialog-card").getBoundingClientRect();
      const actions = [...document.querySelectorAll("#help-dialog .dialog-actions button")].map(button => button.getBoundingClientRect());
      return { width: card.width, top: card.top, bottom: card.bottom, actions, viewportHeight: innerHeight };
    });
    assert(help.width >= 900, `${label} : l’aide reste étroite (${help.width}px).`);
    assert(help.top >= 0 && help.bottom <= help.viewportHeight && help.actions.every(button => button.bottom <= help.viewportHeight), `${label} : l’aide ou ses actions sortent de l’écran.`);
    await page.screenshot({ path: path.join(CAPTURES, `aide-${width}x${height}.png`) });
    await page.keyboard.press("Escape");
    await page.locator("#help-dialog").waitFor({ state: "hidden" });

    const before = await state(page);
    assert(await page.locator("#next-button").isHidden(), `${label} : « Coffre suivant » est visible avant toute réussite.`);
    const [first, second] = solutionFor(before);
    await page.locator(`.rune[data-index="${first}"]`).click();
    await page.locator(`.rune[data-index="${second}"]`).click();
    await page.waitForFunction(expected => window.MATHSGO_COFFRES_SOLO.getState().keys === expected, before.keys + 1);
    await page.waitForFunction(() => document.activeElement.id === "next-button");
    await page.waitForTimeout(120);
    const waiting = await state(page);
    assert(waiting.boardId === before.boardId && waiting.locked, `${label} : le coffre suivant arrive tout seul au lieu d’attendre le bouton.`);
    assert((await page.locator("#status").innerText()).includes("clé gagnée"), `${label} : l’égalité gagnante n’est plus affichée pendant l’attente.`);
    assert((await page.locator("#next-button").innerText()).trim() === "Coffre suivant", `${label} : le libellé du bouton d’attente est incorrect.`);
    await page.screenshot({ path: path.join(CAPTURES, `cle-gagnee-${width}x${height}.png`) });
    await page.keyboard.press("Enter");
    await page.waitForFunction(previous => window.MATHSGO_COFFRES_SOLO.getState().boardId > previous, before.boardId);
    assert(await page.locator("#next-button").isHidden(), `${label} : « Coffre suivant » reste affiché sur le nouveau plateau.`);
    assert((await state(page)).keys === before.keys + 1, `${label} : la clé gagnée n’est pas conservée.`);
    await page.waitForFunction(() => document.activeElement.classList.contains("rune"));
    await assertNoHorizontalOverflow(page, `${label} : plateau`);
  } finally {
    await page.close();
  }
}

// Petit écran : le passage automatique au coffre suivant est conservé, sans bouton d'attente.
async function auditPetitEcranAutomatique(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", error => errors.push(`automatique 390 : ${error.message}`));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 25), ...args);
  });
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo`, { waitUntil: "load" });
    await page.waitForFunction(() => document.activeElement.id === "start-game");
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    const before = await state(page);
    const [first, second] = solutionFor(before);
    await page.locator(`.rune[data-index="${first}"]`).click();
    await page.locator(`.rune[data-index="${second}"]`).click();
    await page.waitForFunction(previous => window.MATHSGO_COFFRES_SOLO.getState().boardId > previous, before.boardId);
    assert(await page.locator("#next-button").isHidden(), "automatique 390 : le bouton « Coffre suivant » apparaît sur téléphone.");
    assert((await state(page)).keys === before.keys + 1, "automatique 390 : la clé gagnée n’est pas conservée.");
    assert(!(await page.locator("#status").innerText()).includes("autre"), "automatique 390 : le repère de la seconde paire s'affiche sur téléphone.");
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------------------------
// Lot 2 : nombre de paires (1 ou 2), vérification bonus sur grand écran, niveau 2 et aides en barres.
// ---------------------------------------------------------------------------------------------

function allSolutions(state) {
  return neighborPairs().filter(([first, second]) => valueFor(state.mode, state.values[first], state.values[second]) === state.target);
}

async function restartUntil(page, predicate, label, tries = 400) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const current = await state(page);
    if (predicate(current)) return current;
    await page.evaluate(() => window.MATHSGO_COFFRES_SOLO.start());
  }
  throw new Error(`${label} : aucun plateau ne remplit la condition après ${tries} parties.`);
}

// Le tirage garantit 1 ou 2 paires voisines gagnantes, jamais plus ; les cibles suivent la table
// des règles du niveau ; aucun repère de paires n'est affiché avant la recherche.
const TARGET_RANGES = {
  1: { sum: [4, 18], difference: [2, 9], product: [4, 100], quotient: [2, 9] },
  2: { sum: [12, 98], difference: [11, 97], product: [22, 200], quotient: [11, 20] },
  3: { sum: [20, 178], difference: [10, 89], product: [36, 297], quotient: [12, 49] }
};
const CELL_RANGES = {
  1: { sum: [2, 9], difference: [2, 18], product: [2, 10], quotient: [2, 81] },
  2: { sum: [2, 89], difference: [2, 99], product: [2, 20], quotient: [2, 200] },
  3: { sum: [10, 89], difference: [10, 99], product: [3, 49], quotient: [3, 300] }
};

async function auditNombreDePaires(browser, base, level, errors) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const label = `paires niveau ${level}`;
  page.on("pageerror", error => errors.push(`${label} : ${error.message}`));
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo${level > 1 ? `&niveau=${level}` : ""}`, { waitUntil: "load" });
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    assert((await page.locator("#pair-count").count()) === 0, `${label} : le repère « 1 paire / 2 paires » est encore dans la page.`);
    const seen = { 1: 0, 2: 0 };
    const modesSeen = new Set();
    for (let board = 0; board < 120; board += 1) {
      const current = await state(page);
      assert(current.level === level, `${label} : le niveau de la partie n'est pas ${level}.`);
      const found = allSolutions(current);
      assert(found.length === 1 || found.length === 2, `${label} : ${found.length} paires gagnantes pour ${current.mode} = ${current.target} (${current.values.join(" ")}).`);
      assert(found.length === current.solutions, `${label} : l'appli annonce ${current.solutions} paire(s) au lieu de ${found.length}.`);
      assert(!(await page.locator("#status").innerText()).includes("autre"), `${label} : la seconde paire est annoncée avant la recherche.`);
      const [cellMinimum, cellMaximum] = CELL_RANGES[level][current.mode];
      current.values.forEach(value => {
        assert(value >= cellMinimum && value <= cellMaximum, `${label} : la case ${value} sort de ${cellMinimum} à ${cellMaximum} (${current.mode}).`);
      });
      const [minimum, maximum] = TARGET_RANGES[level][current.mode];
      assert(current.target >= minimum && current.target <= maximum, `${label} : cible ${current.target} hors des règles du niveau pour ${current.mode}.`);
      if (found.length === 2) {
        const cells = found.flat();
        assert(new Set(cells).size === 4, `${label} : les deux paires partagent une case.`);
        assert(!found[0].some(first => found[1].some(second => Math.abs(Math.floor(first / 4) - Math.floor(second / 4)) + Math.abs((first % 4) - (second % 4)) === 1)), `${label} : les deux paires se touchent.`);
      }
      seen[found.length] += 1;
      modesSeen.add(current.mode);
      await page.evaluate(() => window.MATHSGO_COFFRES_SOLO.start());
    }
    assert(seen[1] > 10 && seen[2] > 10, `${label} : répartition suspecte des paires (${seen[1]} simples, ${seen[2]} doubles).`);
    assert(modesSeen.size === 4, `${label} : les quatre opérations n'ont pas toutes été tirées.`);
  } finally {
    await page.close();
  }
}

// La série de dix clés : 3 additions, 3 soustractions, 2 multiplications, 2 divisions, dont au moins
// deux clés tirées parmi les familles de faits (compléments, doubles, moitiés, × 10, ÷ 10).
async function auditSerieEtFamilles(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const label = "série et familles";
  page.on("pageerror", error => errors.push(`${label} : ${error.message}`));
  try {
    for (const level of [1, 2, 3]) {
      await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo${level > 1 ? `&niveau=${level}` : ""}`, { waitUntil: "load" });
      await page.locator("#start-game").click();
      await page.locator("#lesson").waitFor({ state: "hidden" });
      for (let game = 0; game < 20; game += 1) {
        const current = await state(page);
        const counts = Object.fromEntries(["sum", "difference", "product", "quotient"].map(mode => [mode, current.modes.filter(item => item === mode).length]));
        assert(counts.sum === 3 && counts.difference === 3 && counts.product === 2 && counts.quotient === 2, `${label} niveau ${level} : série ${JSON.stringify(counts)}.`);
        assert(current.familyPlan.filter(Boolean).length === 2, `${label} niveau ${level} : ${current.familyPlan.filter(Boolean).length} familles planifiées.`);
        await page.evaluate(() => window.MATHSGO_COFFRES_SOLO.start());
      }
      // La clé planifiée en famille est bien servie : on joue jusqu'à elle.
      const played = await page.evaluate(() => {
        const api = window.MATHSGO_COFFRES_SOLO;
        api.start();
        const plan = api.getState().familyPlan;
        const families = [];
        for (let key = 0; key < 10; key += 1) {
          const current = api.getState();
          if (plan[key]) families.push(current.family);
          const pair = api.findSolutionPair(current.mode, current.target, current.values);
          document.querySelector(`.rune[data-index="${pair.positions[0]}"]`).click();
          document.querySelector(`.rune[data-index="${pair.positions[1]}"]`).click();
          const next = document.querySelector("#next-button");
          if (!next.hidden) next.click();
        }
        return { families, keys: api.getState().keys };
      });
      assert(played.keys === 10, `${label} niveau ${level} : la partie jouée n'a pas atteint dix clés.`);
      assert(played.families.length === 2 && played.families.every(Boolean), `${label} niveau ${level} : familles servies ${JSON.stringify(played.families)}.`);
    }
  } finally {
    await page.close();
  }
}

// Après une erreur (ou « Montrer une solution »), le même nombre et la même opération reviennent
// sur un nouveau plateau, sans toucher au compteur de clés.
async function auditRejouerLeCalcul(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const label = "rejouer le calcul";
  page.on("pageerror", error => errors.push(`${label} : ${error.message}`));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 25), ...args);
  });
  try {
    for (const level of [1, 2, 3]) {
      await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo${level > 1 ? `&niveau=${level}` : ""}`, { waitUntil: "load" });
      await page.locator("#start-game").click();
      await page.locator("#lesson").waitFor({ state: "hidden" });
      for (const mode of ["sum", "difference", "product", "quotient"]) {
        const before = await restartUntil(page, candidate => candidate.mode === mode, `${label} ${mode}`);
        const [wrongFirst, wrongSecond] = wrongPairFor(before);
        await page.locator(`.rune[data-index="${wrongFirst}"]`).click();
        await page.locator(`.rune[data-index="${wrongSecond}"]`).click();
        await page.waitForFunction(() => document.activeElement.id === "correction-title");
        assert((await page.locator("#close-correction").innerText()).trim() === "Nouveau plateau", `${label} : le bouton de la correction a changé.`);
        await page.locator("#close-correction").click();
        await page.locator("#correction-dialog").waitFor({ state: "hidden" });
        const after = await state(page);
        assert(after.boardId > before.boardId, `${label} niveau ${level} ${mode} : le plateau n'a pas changé.`);
        assert(after.mode === mode && after.target === before.target, `${label} niveau ${level} ${mode} : on attendait ${mode} = ${before.target}, on a ${after.mode} = ${after.target}.`);
        assert(after.keys === before.keys, `${label} niveau ${level} ${mode} : le compteur de clés a bougé.`);
        assert(JSON.stringify(after.values) !== JSON.stringify(before.values), `${label} niveau ${level} ${mode} : le plateau est identique.`);
        assert(allSolutions(after).length === after.solutions && after.solutions >= 1, `${label} niveau ${level} ${mode} : le plateau rejoué n'a pas sa solution.`);
        const challenge = (await page.locator("#challenge-text").innerText()).trim();
        assert(challenge.endsWith(String(before.target)), `${label} niveau ${level} ${mode} : le défi affiché est « ${challenge} ».`);

        await page.locator("#help-button").click();
        await page.waitForFunction(() => document.activeElement.id === "help-title");
        await page.locator("#show-solution").click();
        await page.waitForFunction(() => document.activeElement.id === "correction-title");
        await page.locator("#close-correction").click();
        await page.locator("#correction-dialog").waitFor({ state: "hidden" });
        const shown = await state(page);
        assert(shown.mode === mode && shown.target === before.target && shown.keys === before.keys, `${label} niveau ${level} ${mode} : après « Montrer une solution », le calcul a changé.`);
      }
    }
  } finally {
    await page.close();
  }
}

// Grand écran : le repère de la seconde paire n'apparaît qu'après la première réussite, et
// seulement s'il reste une paire ; téléphone : rien, l'enchaînement reste automatique.
async function auditRepereSecondePaire(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const label = "repère seconde paire 1280 × 720";
  page.on("pageerror", error => errors.push(`${label} : ${error.message}`));
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo`, { waitUntil: "load" });
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    for (const expected of [2, 1]) {
      const before = await restartUntil(page, current => allSolutions(current).length === expected, `${label} (${expected} paire${expected > 1 ? "s" : ""})`);
      assert(!(await page.locator("#status").innerText()).includes("autre"), `${label} : le repère est affiché avant la réussite.`);
      const [first] = allSolutions(before);
      await page.locator(`.rune[data-index="${first[0]}"]`).click();
      await page.locator(`.rune[data-index="${first[1]}"]`).click();
      await page.waitForFunction(() => document.activeElement.id === "next-button");
      const status = (await page.locator("#status").innerText()).trim();
      if (expected === 2) {
        assert(status.includes("clé gagnée") && status.endsWith("Bien joué — il y en a une autre !"), `${label} : après la première paire, le message est « ${status} ».`);
        await page.screenshot({ path: path.join(CAPTURES, "repere-seconde-paire-1280x720.png") });
        const [, second] = allSolutions(before);
        await page.locator(`.rune[data-index="${second[0]}"]`).click();
        await page.locator(`.rune[data-index="${second[1]}"]`).click();
        assert((await page.locator("#status").innerText()).trim().endsWith("aussi !"), `${label} : la seconde paire n'est pas confirmée.`);
      } else {
        assert(status.includes("clé gagnée") && !status.includes("autre"), `${label} : avec une seule paire, le message est « ${status} ».`);
      }
      await page.locator("#next-button").click();
      await page.waitForFunction(previous => window.MATHSGO_COFFRES_SOLO.getState().boardId > previous, before.boardId);
    }
  } finally {
    await page.close();
  }
}

// Grand écran : pendant que « Coffre suivant » attend, l'autre paire est confirmée sans clé, une paire fausse dit non.
async function auditVerificationBonus(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const label = "vérification bonus 1280 × 720";
  page.on("pageerror", error => errors.push(`${label} : ${error.message}`));
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo`, { waitUntil: "load" });
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    const before = await restartUntil(page, current => allSolutions(current).length === 2, label);
    const [first, second] = allSolutions(before);
    await page.locator(`.rune[data-index="${first[0]}"]`).click();
    await page.locator(`.rune[data-index="${first[1]}"]`).click();
    await page.waitForFunction(expected => window.MATHSGO_COFFRES_SOLO.getState().keys === expected, before.keys + 1);
    await page.waitForFunction(() => document.activeElement.id === "next-button");
    assert((await state(page)).bonusOpen === true, `${label} : le plateau n'est pas ouvert à la vérification.`);

    await page.locator(`.rune[data-index="${second[0]}"]`).click();
    await page.locator(`.rune[data-index="${second[1]}"]`).click();
    const confirmed = await state(page);
    const confirmedStatus = (await page.locator("#status").innerText()).trim();
    assert(confirmedStatus.endsWith("aussi !") && confirmedStatus.includes(`= ${before.target}`), `${label} : l'autre paire n'est pas confirmée (« ${confirmedStatus} »).`);
    assert(confirmed.keys === before.keys + 1 && confirmed.boardId === before.boardId, `${label} : la seconde paire ajoute une clé ou change le plateau.`);
    assert(await page.locator("#next-button").isVisible(), `${label} : « Coffre suivant » disparaît après la vérification.`);
    assert(await page.locator("#correction-dialog").isHidden(), `${label} : la correction s'ouvre après une paire juste.`);
    assert((await page.locator(".rune.success").count()) === 4, `${label} : les deux paires gagnantes ne sont pas toutes vertes.`);
    await page.screenshot({ path: path.join(CAPTURES, "bonus-autre-paire-1280x720.png") });

    const used = [...first, ...second];
    const wrong = neighborPairs().find(pair => valueFor(before.mode, before.values[pair[0]], before.values[pair[1]]) !== before.target && pair.every(position => !used.includes(position)));
    assert(wrong, `${label} : aucune paire fausse disponible.`);
    await page.locator(`.rune[data-index="${wrong[0]}"]`).click();
    await page.locator(`.rune[data-index="${wrong[1]}"]`).click();
    const refused = await state(page);
    const refusedStatus = (await page.locator("#status").innerText()).trim();
    assert(/: non/.test(refusedStatus), `${label} : la paire fausse n'est pas refusée simplement (« ${refusedStatus} »).`);
    assert(await page.locator("#correction-dialog").isHidden(), `${label} : la correction s'ouvre pendant la vérification bonus.`);
    assert(refused.keys === before.keys + 1 && refused.boardId === before.boardId, `${label} : la paire fausse change la clé ou le plateau.`);
    assert((await page.locator(".rune.failure").count()) === 2 && (await page.locator(".rune.success").count()) === 4, `${label} : les cases gagnantes perdent leur couleur après une paire fausse.`);
    await page.screenshot({ path: path.join(CAPTURES, "bonus-paire-fausse-1280x720.png") });

    await page.locator(`.rune[data-index="${first[0]}"]`).click();
    await page.locator(`.rune[data-index="${first[1]}"]`).click();
    assert((await page.locator("#status").innerText()).includes("déjà trouvée"), `${label} : recliquer la paire gagnante n'est pas signalé.`);

    await page.locator("#next-button").click();
    await page.waitForFunction(previous => window.MATHSGO_COFFRES_SOLO.getState().boardId > previous, before.boardId);
    const after = await state(page);
    assert(after.keys === before.keys + 1 && after.bonusOpen === false, `${label} : le coffre suivant n'arrive pas proprement après la vérification.`);
  } finally {
    await page.close();
  }
}

// Niveau 2 : aides et corrections en barres, avec les nombres écrits dedans.
async function assertBarVisual(page, selector, mode, label) {
  const visual = page.locator(selector);
  assert(await visual.isVisible(), `${label} : le schéma en barres n'est pas visible.`);
  assert((await visual.locator(".quantity-dot, .demo-dot, .quotient-bar-unit").count()) === 0, `${label} : des points du niveau 1 subsistent dans le schéma du niveau 2.`);
  const box = element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
  };
  if (mode === "sum" || mode === "difference") {
    const data = await visual.evaluate((node, isSum) => {
      const box = element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
      const rows = [...node.querySelectorAll(".bar-row")];
      const parts = [...rows[1].querySelectorAll(":scope > .bar-part")].map(part => {
        const style = getComputedStyle(part);
        const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth);
        return { ...box(part), inner: part.getBoundingClientRect().width - padding, text: part.textContent.trim(), gap: part.classList.contains("bar-gap") };
      });
      const marker = isSum ? node.querySelector(".sum-marker") : node.querySelector(".bar-marker-label");
      const cell = isSum ? null : node.querySelector(".bar-marker-cell");
      return {
        aria: node.closest("[aria-label]").getAttribute("aria-label"),
        diagram: box(node.querySelector(".bar-model")),
        rows: rows.map(row => ({ ...box(row), text: row.textContent.trim(), radius: getComputedStyle(row).borderRadius })),
        parts,
        marker: { ...box(marker), text: marker.textContent.trim() },
        cell: cell ? box(cell) : null,
        viewportWidth: innerWidth
      };
    }, mode === "sum");
    assert(data.rows.length === 2 && data.parts.length === 2, `${label} : la barre doit avoir deux lignes et deux parties.`);
    const total = Number(data.rows[0].text);
    const [first, second] = data.parts.map(part => Number(part.text));
    assert(data.rows.every(row => row.radius === "0px"), `${label} : les barres n'ont pas des angles droits.`);
    assert(Math.abs(data.rows[0].bottom - data.rows[1].top) <= 1 && Math.abs(data.rows[0].width - data.rows[1].width) <= 1, `${label} : les deux lignes ne sont pas collées et alignées.`);
    assert(total === first + second, `${label} : ${first} et ${second} n'écrivent pas ${total}.`);
    // Les largeurs utiles (hors marge intérieure et bordure, qui gardent le petit nombre lisible : 58 + 2) sont proportionnelles.
    assert(Math.abs(data.parts[0].inner / data.parts[1].inner - first / second) <= .1 * Math.max(1, first / second), `${label} : les largeurs ne sont pas proportionnelles (${first} : ${second}).`);
    if (mode === "sum") {
      assert(data.marker.text === `somme = ${total}`, `${label} : le repère de somme est inexact.`);
      assert(Math.abs(data.marker.left - data.rows[0].left) <= 1 && Math.abs(data.marker.width - data.rows[0].width) <= 1 && data.marker.bottom <= data.rows[0].top, `${label} : le repère de somme n'est pas au-dessus de toute la barre.`);
      assert(new RegExp(`${first} plus ${second} égale ${total}\\.$`).test(data.aria), `${label} : l'équation parlée de la somme manque.`);
    } else {
      assert(data.parts[1].gap && !data.parts[0].gap, `${label} : la partie manquante n'est pas hachurée à droite.`);
      assert(data.marker.text === `différence = ${second}`, `${label} : le libellé de différence est inexact.`);
      assert(Math.abs(data.cell.left - data.parts[1].left) <= 3 && Math.abs(data.cell.right - data.parts[1].right) <= 3 && data.cell.top >= data.rows[1].bottom - 1, `${label} : le repère de différence n'est pas sous la partie manquante (${JSON.stringify({ cell: data.cell, gap: data.parts[1], row: data.rows[1] })}).`);
      assert(data.marker.left >= data.diagram.left - 1 && data.marker.right <= data.diagram.right + 1 && data.marker.right <= data.viewportWidth, `${label} : le libellé de différence sort du schéma.`);
      assert(new RegExp(`${total} moins ${first} égale ${second}\\.$`).test(data.aria), `${label} : l'équation parlée de la différence manque.`);
    }
  } else if (mode === "product") {
    const data = await visual.evaluate(node => {
      const box = element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
      const area = node.querySelector(".area-model");
      const style = getComputedStyle(area);
      return {
        aria: node.closest("[aria-label]").getAttribute("aria-label"),
        area: { ...box(area), columns: Number(style.getPropertyValue("--area-columns")), rows: Number(style.getPropertyValue("--area-rows")), unit: parseFloat(style.getPropertyValue("--area-unit")) },
        total: node.querySelector(".area-total").textContent.trim(),
        columnsMarker: { ...box(node.querySelector(".dimension-columns")), text: node.querySelector(".dimension-columns").textContent.trim() },
        rowsMarker: { ...box(node.querySelector(".dimension-rows")), text: node.querySelector(".dimension-rows").textContent.trim() },
        viewportWidth: innerWidth
      };
    });
    assert(Number(data.total) === data.area.columns * data.area.rows, `${label} : le total ${data.total} n'est pas ${data.area.rows} × ${data.area.columns}.`);
    assert(data.columnsMarker.text === String(data.area.columns) && data.rowsMarker.text === String(data.area.rows), `${label} : les dimensions écrites ne correspondent pas au rectangle.`);
    assert(Math.abs((data.area.width - 4) / (data.area.height - 4) - data.area.columns / data.area.rows) <= .06, `${label} : le rectangle n'est pas proportionnel (${data.area.width} × ${data.area.height} pour ${data.area.columns} × ${data.area.rows}).`);
    // coffres-learning.css réduit l'unité de la correction à 10 / 9 / 7 px selon l'écran pour que 20 × 10 tienne.
    assert(data.area.unit >= 7, `${label} : le quadrillage est trop serré (${data.area.unit}px).`);
    assert(Math.abs(data.columnsMarker.left - data.area.left) <= 1 && Math.abs(data.columnsMarker.width - data.area.width) <= 1 && data.columnsMarker.bottom <= data.area.top, `${label} : le repère des colonnes n'est pas aligné sur le rectangle.`);
    assert(data.rowsMarker.right <= data.area.left && Math.abs(data.rowsMarker.top - data.area.top) <= 1 && Math.abs(data.rowsMarker.height - data.area.height) <= 1, `${label} : le repère des rangées n'est pas aligné sur le côté.`);
    assert(data.area.right <= data.viewportWidth, `${label} : le rectangle sort de l'écran.`);
    assert(new RegExp(`${data.area.rows} fois ${data.area.columns} égale ${data.total}\\.$`).test(data.aria), `${label} : l'équation parlée du produit manque.`);
  } else {
    const data = await visual.evaluate(node => {
      const box = element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
      return {
        aria: node.closest("[aria-label]").getAttribute("aria-label"),
        viewportWidth: innerWidth,
        layoutColumns: getComputedStyle(node.querySelector(".demo-interpretations")).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
        insideCorrection: Boolean(node.closest("#correction-visual")),
        views: [...node.querySelectorAll(".demo-interpretation")].map(view => {
          const bar = view.querySelector(".packet-bar");
          return {
            label: view.querySelector(".demo-caption").textContent.trim(),
            marker: view.querySelector(".sum-marker").textContent.trim(),
            bar: { ...box(bar), groupCount: Number(bar.dataset.groupCount), groupSize: Number(bar.dataset.groupSize), totalUnits: Number(bar.dataset.totalUnits) },
            packets: [...bar.querySelectorAll(":scope > .packet")].map(packet => ({ ...box(packet), text: packet.textContent.trim(), fontSize: parseFloat(getComputedStyle(packet).fontSize) }))
          };
        })
      };
    });
    assert(data.views.length === 2, `${label} : les deux interprétations du quotient manquent.`);
    assert(data.layoutColumns === (data.viewportWidth <= 520 || data.insideCorrection ? 1 : 2), `${label} : les interprétations n'ont pas la disposition attendue à ${data.viewportWidth} px.`);
    const grouping = data.views[0].label.match(/^Grouper : (\d+) paquets de (\d+)$/);
    const sharing = data.views[1].label.match(/^Partager : (\d+) paquets de (\d+)$/);
    assert(grouping && sharing, `${label} : les légendes grouper / partager manquent.`);
    data.views.forEach((view, index) => {
      const wanted = index === 0 ? grouping : sharing;
      const count = Number(wanted[1]);
      const size = Number(wanted[2]);
      assert(view.bar.groupCount === count && view.packets.length === count, `${label} : la barre ${index + 1} n'a pas ${count} paquets.`);
      assert(view.bar.groupSize === size && view.packets.every(packet => packet.text === String(size)), `${label} : chaque paquet de la barre ${index + 1} doit porter ${size}.`);
      assert(view.marker === String(count * size) && view.bar.totalUnits === count * size, `${label} : le total au-dessus de la barre ${index + 1} est inexact.`);
      const widths = view.packets.map(packet => packet.width);
      assert(Math.max(...widths) - Math.min(...widths) <= 2, `${label} : les paquets de la barre ${index + 1} n'ont pas la même largeur.`);
      assert(view.packets.every(packet => packet.fontSize >= 9.5), `${label} : un nombre de paquet est illisible (${Math.min(...view.packets.map(packet => packet.fontSize))}px).`);
      assert(view.bar.right <= data.viewportWidth, `${label} : la barre ${index + 1} sort de l'écran.`);
    });
    assert(data.aria.includes(`Combien de paquets de ${grouping[2]} dans ${Number(grouping[1]) * Number(grouping[2])} ? ${grouping[1]}.`), `${label} : le sens « grouper » manque dans l'alternative accessible.`);
  }
}

async function auditNiveauDeux(browser, base, { width, height }, errors) {
  const page = await browser.newPage({ viewport: { width, height } });
  const label = `niveau 2 à ${width} px`;
  page.on("pageerror", error => errors.push(`${label} : ${error.message}`));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 25), ...args);
  });
  const courseSentences = {
    sum: "La somme de 28 et de 7 est 35.",
    difference: "La différence entre 52 et 7 est 45.",
    product: "Le produit de 18 par 4 est 72.",
    quotient: "Le quotient de 72 par 4 est 18."
  };
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo&niveau=2`, { waitUntil: "load" });
    await page.waitForFunction(() => document.activeElement.id === "start-game");
    assert((await page.locator("#lesson .quantity-dot").count()) > 0 && (await page.locator("#lesson .bar-model").count()) === 0, `${label} : le cours complet doit garder ses schémas à points.`);
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    assert((await page.locator("#level-label").innerText()).trim() === "niveau 2", `${label} : la ligne de titre n'annonce pas le niveau 2.`);
    for (const mode of ["sum", "difference", "product", "quotient"]) {
      const current = await restartUntil(page, candidate => candidate.mode === mode, `${label} ${mode}`);
      assert(current.level === 2, `${label} : la partie n'est pas au niveau 2.`);
      await page.locator("#help-button").click();
      await page.waitForFunction(() => document.activeElement.id === "help-title");
      const card = page.locator(`#help-visual > article[data-operation="${mode}"][data-level="2"]`);
      assert(await card.count() === 1, `${label} : l'aide ${mode} n'est pas la carte du niveau 2.`);
      assert((await card.innerText()).includes(courseSentences[mode]), `${label} : la phrase du niveau 2 manque dans l'aide ${mode}.`);
      const sourceTitle = await page.locator(`#lesson article[data-operation="${mode}"] h3`).innerText();
      assert((await card.locator("h3").innerText()) === sourceTitle, `${label} : le titre de l'aide ${mode} diffère du cours.`);
      await assertBarVisual(page, `#help-visual > article[data-operation="${mode}"] .operation-picture`, mode, `Aide niveau 2 ${mode} à ${width} px`);
      await assertNoHorizontalOverflow(page, `${label} : aide ${mode}`);
      const helpBox = await page.locator("#help-dialog .dialog-card").evaluate(node => {
        const rect = node.getBoundingClientRect();
        const actions = [...node.querySelectorAll(".dialog-actions button")].map(button => button.getBoundingClientRect().bottom);
        return { top: rect.top, bottom: rect.bottom, actions, viewportHeight: innerHeight };
      });
      assert(helpBox.top >= 0 && helpBox.actions.every(bottom => bottom <= helpBox.viewportHeight + 1), `${label} : les actions de l'aide ${mode} sortent de l'écran.`);
      await page.screenshot({ path: path.join(CAPTURES, `aide-niveau2-${mode}-${width}.png`) });
      if (mode === "difference" || mode === "quotient") {
        assert((await page.locator("#help-visual .operation-conventions").count()) === 1, `${label} : la convention d'ordre manque dans l'aide ${mode}.`);
      }
      await page.locator("#show-solution").click();
      await page.waitForFunction(() => document.activeElement.id === "correction-title");
      const solution = (await page.locator("#correction-solution").innerText()).trim();
      const expected = allSolutions(current);
      assert(expected.some(pair => solution.includes(equationFor(mode, current.values[pair[0]], current.values[pair[1]]))), `${label} : la correction ${mode} ne reprend pas une paire réelle du plateau.`);
      await assertBarVisual(page, "#correction-visual .learning-demo", mode, `Correction niveau 2 ${mode} à ${width} px`);
      await assertNoHorizontalOverflow(page, `${label} : correction ${mode}`);
      await page.screenshot({ path: path.join(CAPTURES, `correction-niveau2-${mode}-${width}.png`) });
      await page.locator("#close-correction").click();
      await page.locator("#correction-dialog").waitFor({ state: "hidden" });
    }
  } finally {
    await page.close();
  }
}

// Le niveau se choisit dans la fenêtre Solo / Duo et voyage dans l'adresse (?niveau=2).
async function auditChoixDuNiveau(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const label = "choix du niveau";
  page.on("pageerror", error => errors.push(`${label} : ${error.message}`));
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html`, { waitUntil: "load" });
    await page.locator("#mode-dialog:not([hidden])").waitFor();
    const pills = page.locator(".level-choice");
    assert(await pills.count() === 3, `${label} : la fenêtre ne propose pas exactement trois niveaux.`);
    assert(await pills.nth(0).getAttribute("aria-pressed") === "true", `${label} : le niveau 1 n'est pas sélectionné par défaut.`);
    await page.screenshot({ path: path.join(CAPTURES, "fenetre-mode-niveaux-1280.png") });
    await pills.nth(1).click();
    assert(await pills.nth(1).getAttribute("aria-pressed") === "true" && await pills.nth(0).getAttribute("aria-pressed") === "false", `${label} : le clic sur Niveau 2 ne le sélectionne pas.`);
    assert(new URL(page.url()).searchParams.get("niveau") === null, `${label} : un choix provisoire ne doit pas changer l’adresse.`);
    await page.locator("#choose-solo").click();
    await page.locator("#continue-current-mode").click();
    await page.waitForFunction(() => document.activeElement.id === "start-game");
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    assert((await state(page)).level === 2, `${label} : la partie ne démarre pas au niveau 2.`);
    assert((await page.locator("#level-label").innerText()).trim() === "niveau 2", `${label} : la ligne de titre n'indique pas le niveau 2.`);
    assert((await page.locator("#choose-duo").count()) === 1, `${label} : le bouton Duo manque.`);

    // Changer de niveau en cours de partie : Échap abandonne, « Nouvelle partie au niveau 1 » applique.
    const running = await state(page);
    await page.locator("[data-change-mode]").click();
    await page.locator("#mode-dialog:not([hidden])").waitFor();
    await pills.nth(0).click();
    assert((await page.locator("#continue-current-mode").innerText()).trim() === "Nouvelle partie", `${label} : le bouton de reprise n'annonce pas la nouvelle partie.`);
    await page.keyboard.press("Escape");
    await page.locator("#mode-dialog").waitFor({ state: "hidden" });
    const kept = await state(page);
    assert(kept.level === 2 && kept.boardId === running.boardId && new URL(page.url()).searchParams.get("niveau") === "2", `${label} : Échap a changé le niveau ou le plateau.`);
    await page.locator("[data-change-mode]").click();
    await page.locator("#mode-dialog:not([hidden])").waitFor();
    assert(await pills.nth(1).getAttribute("aria-pressed") === "true", `${label} : la fenêtre ne réaffiche pas le niveau de la partie.`);
    await pills.nth(0).click();
    await page.locator("#continue-current-mode").click();
    await page.locator("#mode-dialog").waitFor({ state: "hidden" });
    await page.locator("#start-game").click();
    const restarted = await state(page);
    assert(restarted.level === 1 && restarted.keys === 0 && restarted.boardId > running.boardId, `${label} : la nouvelle partie au niveau 1 n'a pas démarré.`);
    assert(new URL(page.url()).searchParams.get("niveau") === null, `${label} : l'adresse garde ?niveau=2 après retour au niveau 1.`);
    assert((await page.locator("#level-label").innerText()).trim() === "niveau 1", `${label} : la ligne de titre n'est pas revenue au niveau 1.`);
    await page.locator("[data-change-mode]").click();
    await page.locator("#mode-dialog:not([hidden])").waitFor();
    assert((await page.locator("#continue-current-mode").innerText()).trim() === "Continuer", `${label} : sans changement de niveau, le bouton doit proposer de continuer.`);
  } finally {
    await page.close();
  }
}

(async () => {
  fs.mkdirSync(CAPTURES, { recursive: true });
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {})
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 25), ...args);
  });

  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo`, { waitUntil: "load" });
    await page.waitForFunction(() => document.activeElement.id === "start-game");
    await assertNoHorizontalOverflow(page, "Mémo desktop");
    await page.screenshot({ path: path.join(CAPTURES, "memo-desktop-1366.png") });

    const orientation = await page.locator(".dual-learning-views .dot-array").evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));
    assert(orientation.length === 2, "Les deux réseaux du produit ne sont pas rendus.");
    assert(orientation[0].width > orientation[0].height, "Le réseau 3 × 4 n’est pas orienté sur quatre colonnes.");
    assert(orientation[1].height > orientation[1].width, "Le réseau 4 × 3 n’est pas orienté sur trois colonnes.");

    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoHorizontalOverflow(page, "Mémo 390 px");
    await page.screenshot({ path: path.join(CAPTURES, "memo-mobile-390.png") });
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });

    const beforeHelp = await state(page);
    await page.locator("#help-button").click();
    await page.waitForFunction(() => document.activeElement.id === "help-title");
    assert(await page.locator("#help-dialog").isVisible(), "L’aide ne s’ouvre pas.");
    await assertHelpCourseCard(page, beforeHelp.mode, "Aide mobile");
    assert(!(await page.locator("#help-dialog").innerText()).includes("Une paire voisine qui ouvre"), "L’indice révèle déjà la paire solution.");
    assert((await state(page)).boardId === beforeHelp.boardId, "L’ouverture de l’aide change le plateau.");
    assert((await state(page)).keys === beforeHelp.keys, "L’aide offre une clé.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "help-visual"), "Tab ne rejoint pas la zone de cours de l’aide.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-help"), "Tab ne rejoint pas Retour au plateau.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "show-solution"), "Tab ne rejoint pas Montrer une solution.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "help-visual"), "Tab ne reboucle pas sur la zone de cours.");

    await page.setViewportSize({ width: 320, height: 700 });
    await assertNoHorizontalOverflow(page, "Aide 320 px");
    await page.screenshot({ path: path.join(CAPTURES, "aide-mobile-320.png") });
    await page.keyboard.press("Escape");
    await page.locator("#help-dialog").waitFor({ state: "hidden" });
    await page.waitForFunction(() => document.activeElement.id === "help-button");
    assert((await state(page)).boardId === beforeHelp.boardId, "Fermer un simple indice renouvelle le plateau.");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#help-button").click();
    await page.locator("#show-solution").click();
    await page.waitForFunction(() => document.activeElement.id === "correction-title");
    const duringReveal = await state(page);
    assert(duringReveal.mode === beforeHelp.mode, "La révélation change d’opération avant l’explication.");
    assert(duringReveal.boardId === beforeHelp.boardId, "La révélation change le plateau avant de montrer sa solution.");
    assert(duringReveal.keys === beforeHelp.keys, "La révélation offre une clé.");
    assert(await page.locator("#correction-choice").isHidden(), "Une solution demandée ne doit pas inventer un essai.");
    assert(await page.locator("#correction-visual .learning-demo[role=img]").isVisible(), "La correction visuelle est absente.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.classList.contains("correction-content")), "Tab ne rejoint pas le contenu défilable de la correction.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-correction"), "Tab ne rejoint pas l’action de la correction.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.classList.contains("correction-content")), "Tab sort du dialogue de correction.");
    const revealSolution = await page.evaluate(({ mode, target, values }) => window.MATHSGO_COFFRES_SOLO.findSolutionPair(mode, target, values), duringReveal);
    await assertMiniBoard(page, duringReveal, revealSolution.positions, [], "Solution demandée à 390 px");
    await page.screenshot({ path: path.join(CAPTURES, "solution-mobile-390.png") });
    await page.locator("#close-correction").click();
    await page.waitForFunction(previous => window.MATHSGO_COFFRES_SOLO.getState().boardId > previous, beforeHelp.boardId);
    const afterReveal = await state(page);
    assert(afterReveal.mode === beforeHelp.mode, "Après une solution demandée, l’opération n’est pas conservée.");
    assert(afterReveal.keys === beforeHelp.keys, "Après une solution demandée, une clé a été ajoutée.");
    await page.waitForFunction(() => document.activeElement.id === "help-button");

    const beforeMistake = await state(page);
    const [wrongFirst, wrongSecond] = wrongPairFor(beforeMistake);
    await page.locator(`.rune[data-index="${wrongFirst}"]`).click();
    await page.locator(`.rune[data-index="${wrongSecond}"]`).click();
    await page.waitForFunction(() => document.activeElement.id === "correction-title");
    assert((await page.locator("#correction-choice").innerText()).startsWith("Ton essai"), "Le calcul choisi n’est pas annoncé.");
    assert((await state(page)).keys === beforeMistake.keys, "Une paire fausse offre une clé.");
    const mistakeSolution = await page.evaluate(({ mode, target, values }) => window.MATHSGO_COFFRES_SOLO.findSolutionPair(mode, target, values), beforeMistake);
    await assertMiniBoard(page, beforeMistake, mistakeSolution.positions, [wrongFirst, wrongSecond], "Correction après erreur à 390 px");
    await page.screenshot({ path: path.join(CAPTURES, "correction-erreur-mobile-390.png") });
    await page.keyboard.press("Escape");
    await page.locator("#correction-dialog").waitFor({ state: "hidden" });
    await page.waitForFunction(previous => window.MATHSGO_COFFRES_SOLO.getState().boardId > previous, beforeMistake.boardId);
    const afterMistake = await state(page);
    assert(afterMistake.mode === beforeMistake.mode, "Après une erreur, l’opération n’est pas conservée.");
    assert(afterMistake.keys === beforeMistake.keys, "Après une erreur, une clé a été ajoutée.");
    await page.waitForFunction(index => document.activeElement.dataset.index === String(index), wrongSecond);

    const beforeSuccess = await state(page);
    const [rightFirst, rightSecond] = solutionFor(beforeSuccess);
    await page.locator(`.rune[data-index="${rightFirst}"]`).click();
    await page.locator(`.rune[data-index="${rightSecond}"]`).click();
    await page.waitForFunction(expected => window.MATHSGO_COFFRES_SOLO.getState().keys === expected, beforeSuccess.keys + 1);

    await auditGrandEcran(browser, base, { width: 1280, height: 720 }, errors);
    await auditGrandEcran(browser, base, { width: 1440, height: 900 }, errors);
    await auditPetitEcranAutomatique(browser, base, errors);
    await auditNombreDePaires(browser, base, 1, errors);
    await auditNombreDePaires(browser, base, 2, errors);
    await auditNombreDePaires(browser, base, 3, errors);
    await auditSerieEtFamilles(browser, base, errors);
    await auditRejouerLeCalcul(browser, base, errors);
    await auditRepereSecondePaire(browser, base, errors);
    await auditVerificationBonus(browser, base, errors);
    await auditChoixDuNiveau(browser, base, errors);
    await auditNiveauDeux(browser, base, { width: 1280, height: 720 }, errors);
    await auditNiveauDeux(browser, base, { width: 390, height: 844 }, errors);
    await auditNiveauDeux(browser, base, { width: 320, height: 568 }, errors);
    await auditPointJourney(browser, base, .9, "sum", errors);
    await auditPointJourney(browser, base, .2, "difference", errors);
    await auditPointJourney(browser, base, .13, "product", errors);
    await auditPointJourney(browser, base, .1, "quotient", errors);
    for (const width of [320, 390, 1366]) await auditIntroMemo(browser, base, width, errors);
    await auditExtremeVisual(browser, base, { mode: "difference", first: 12, second: 10, width: 320, capture: "difference-12-10-320.png" }, errors);
    await auditExtremeVisual(browser, base, { mode: "difference", first: 12, second: 11, width: 320, capture: "difference-12-11-320.png" }, errors);
    await auditExtremeVisual(browser, base, { mode: "difference", first: 12, second: 9, width: 320, capture: "difference-12-9-320.png" }, errors);
    await auditExtremeVisual(browser, base, { mode: "difference", first: 12, second: 8, width: 320, capture: "difference-12-8-320.png" }, errors);
    for (const width of [320, 390, 520, 1366]) {
      await auditExtremeVisual(browser, base, { mode: "quotient", first: 36, second: 6, width, capture: `quotient-36-6-${width}.png` }, errors);
    }
    for (const width of [320, 390, 1366]) {
      await auditExtremeVisual(browser, base, { mode: "product", first: 3, second: 4, width, capture: `produit-dynamique-3-4-${width}.png` }, errors);
    }
    for (const width of [320, 390, 1366]) {
      await auditDuoBarModels(browser, base, width, errors);
      await auditProductMemo(browser, base, {
        route: "/outils/calcul_mental/coffres_magiques_solo.html?mode=solo",
        wrapperSelector: ".dual-learning-views .array-dimension-model",
        gridSelector: ".dot-array",
        markerSelector: ".dimension-rows",
        numberSelector: "span",
        topMarkerSelector: ".dimension-columns",
        topNumberSelector: "span",
        captureSelector: "#lesson article:has(.dual-learning-views)",
        pageName: "solo",
        width
      }, errors);
      await auditProductMemo(browser, base, {
        route: "/outils/club_maths/coffres_magiques.html?mode=duo",
        wrapperSelector: ".dual-operation-views .dimensioned-array",
        gridSelector: ".dot-array",
        markerSelector: ".array-dimension-side",
        numberSelector: null,
        topMarkerSelector: ".array-dimension-top",
        topNumberSelector: null,
        captureSelector: "#rules .operation-visual-card:nth-child(3)",
        pageName: "duo",
        width
      }, errors);
    }
    assert(errors.length === 0, `Erreurs JavaScript : ${errors.join(" | ")}`);
    console.log(JSON.stringify({
      ok: true,
      captures: CAPTURES,
      checks: ["bordures réelles somme/différence duo à 320/390/1366 px", "repère somme pleine largeur", "différence 12−10 et 12−11 : crochet exact, libellé centré et sur une ligne", "produit solo/duo : nombres droits, crochet supérieur pleine largeur et crochet latéral pleine hauteur à 320/390/1366 px", "quotient 36÷6 : barres empilées jusqu’à 520 px", "rectangles à angles droits", "lignes collées", "aria avec équations parlées", "aide sans révélation", "solution demandée", "correction après erreur", "même opération", "aucune clé offerte", "focus/Tab/Échap", "320/390/520/1366", "grand écran 1280×720 et 1440×900 : plateau et cours sans défilement, aide ≥ 900 px, clé gagnée qui attend « Coffre suivant »", "téléphone : passage automatique conservé", "tirage : 1 ou 2 paires gagnantes, jamais plus, cibles et cases dans la table des règles (niveaux 1, 2 et 3), aucun repère avant la recherche", "série 3/3/2/2 avec deux clés de familles de faits servies", "après une erreur ou « Montrer une solution » : même nombre, même opération, nouveau plateau, clés inchangées", "grand écran : « Bien joué — il y en a une autre ! » après la première réussite seulement s'il reste une paire ; téléphone : rien", "grand écran : vérification bonus de l’autre paire sans clé, paire fausse refusée sans correction", "niveau 2 : choix dans la fenêtre Solo / Duo, adresse ?niveau=2, aides et corrections en barres à 320/390/1280 px, cours complet inchangé"]
    }, null, 2));
  } finally {
    await page.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
