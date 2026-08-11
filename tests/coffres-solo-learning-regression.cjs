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

async function state(page) {
  return page.evaluate(() => window.MATHSGO_COFFRES_SOLO.getState());
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
    assert(data.markerLabel.top >= data.known.bottom && data.markerLabel.left >= -1 && data.markerLabel.right <= data.viewportWidth + 1, `${label} : le libellé de différence chevauche le schéma ou sort de l’écran.`);
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
    assert(data.layoutColumns === (data.viewportWidth <= 520 ? 1 : 2), `${label} : les interprétations du quotient n’ont pas la disposition attendue à ${data.viewportWidth} px.`);
    const grouping = labels[0].match(/^Combien de paquets de (\d+) dans (\d+) \? (\d+)$/);
    const sharing = labels[1].match(/^Partager (\d+) en (\d+) paquets : (\d+) dans chacun$/);
    assert(grouping, `${label} : la recherche du nombre de paquets n’est pas interrogative.`);
    assert(sharing, `${label} : le partage en paquets n’est pas explicite.`);
    const expected = [
      { total: Number(grouping[2]), groupCount: Number(grouping[3]), groupSize: Number(grouping[1]) },
      { total: Number(sharing[1]), groupCount: Number(sharing[2]), groupSize: Number(sharing[3]) }
    ];
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
    assert(data.aria.includes(labels[0]) && data.aria.includes(labels[1]), `${label} : les deux questions du quotient manquent dans l’alternative accessible.`);
    assert(/première barre rectangulaire/i.test(data.aria) && /seconde barre rectangulaire/i.test(data.aria), `${label} : les deux barres ne sont pas décrites dans l’alternative accessible.`);
  }
}

async function auditPointJourney(browser, base, randomValue, expectedMode, errors) {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  page.on("pageerror", error => errors.push(`${expectedMode} : ${error.message}`));
  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html`, { waitUntil: "load" });
    await page.evaluate(value => { Math.random = () => value; }, randomValue);
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });
    assert((await state(page)).mode === expectedMode, `Le scénario déterministe attendu en ${expectedMode} n’est pas obtenu.`);

    await page.locator("#help-button").click();
    await page.waitForFunction(() => document.activeElement.id === "help-title");
    await assertPointVisual(page, "#help-visual .learning-demo", expectedMode, `Aide ${expectedMode}`);
    await assertNoHorizontalOverflow(page, `Aide ${expectedMode} à 320 px`);
    await page.screenshot({ path: path.join(CAPTURES, `aide-${expectedMode}-320.png`) });

    await page.locator("#show-solution").click();
    await page.waitForFunction(() => document.activeElement.id === "correction-title");
    await assertPointVisual(page, "#correction-visual .learning-demo", expectedMode, `Solution demandée ${expectedMode}`);
    await page.locator("#close-correction").click();
    await page.locator("#correction-dialog").waitFor({ state: "hidden" });

    const beforeMistake = await state(page);
    assert(beforeMistake.mode === expectedMode, `La solution demandée ne conserve pas ${expectedMode}.`);
    const [wrongFirst, wrongSecond] = wrongPairFor(beforeMistake);
    await page.locator(`.rune[data-index="${wrongFirst}"]`).click();
    await page.locator(`.rune[data-index="${wrongSecond}"]`).click();
    await page.waitForFunction(() => document.activeElement.id === "correction-title");
    assert((await page.locator("#correction-choice").innerText()).startsWith("Ton choix"), `La correction d’erreur ${expectedMode} n’annonce pas le choix.`);
    await assertPointVisual(page, "#correction-visual .learning-demo", expectedMode, `Correction après erreur ${expectedMode}`);
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
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html`, { waitUntil: "load" });
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
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html`, { waitUntil: "load" });
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
    assert(!(await page.locator("#help-dialog").innerText()).includes("Une paire voisine qui ouvre"), "L’indice révèle déjà la paire solution.");
    assert((await state(page)).boardId === beforeHelp.boardId, "L’ouverture de l’aide change le plateau.");
    assert((await state(page)).keys === beforeHelp.keys, "L’aide offre une clé.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-help"), "Tab ne rejoint pas le premier bouton de l’aide.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "show-solution"), "Tab ne rejoint pas Montrer une solution.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-help"), "Tab ne reboucle pas dans l’aide.");

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
    assert((await page.locator("#correction-solution").innerText()).includes("paire voisine"), "La solution ne désigne pas une paire voisine.");
    assert(await page.locator("#correction-visual .learning-demo[role=img]").isVisible(), "La correction visuelle est absente.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-correction"), "Tab ne rejoint pas l’action de la correction.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-correction"), "Tab sort du dialogue de correction.");
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
    assert((await page.locator("#correction-choice").innerText()).startsWith("Ton choix"), "Le calcul choisi n’est pas annoncé.");
    assert((await state(page)).keys === beforeMistake.keys, "Une paire fausse offre une clé.");
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

    await auditPointJourney(browser, base, .9, "sum", errors);
    await auditPointJourney(browser, base, .2, "difference", errors);
    await auditPointJourney(browser, base, .13, "product", errors);
    await auditPointJourney(browser, base, .1, "quotient", errors);
    await auditExtremeVisual(browser, base, { mode: "difference", first: 12, second: 10, width: 320, capture: "difference-12-10-320.png" }, errors);
    await auditExtremeVisual(browser, base, { mode: "difference", first: 12, second: 11, width: 320, capture: "difference-12-11-320.png" }, errors);
    for (const width of [320, 390, 520, 1366]) {
      await auditExtremeVisual(browser, base, { mode: "quotient", first: 36, second: 6, width, capture: `quotient-36-6-${width}.png` }, errors);
    }
    for (const width of [320, 390, 1366]) {
      await auditExtremeVisual(browser, base, { mode: "product", first: 3, second: 4, width, capture: `produit-dynamique-3-4-${width}.png` }, errors);
    }
    for (const width of [320, 390, 1366]) {
      await auditProductMemo(browser, base, {
        route: "/outils/calcul_mental/coffres_magiques_solo.html",
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
        route: "/outils/club_maths/coffres_magiques.html",
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
      checks: ["repère somme pleine largeur", "différence 12−10 et 12−11 : crochet exact, libellé centré et sur une ligne", "produit solo/duo : nombres droits, crochet supérieur pleine largeur et crochet latéral pleine hauteur à 320/390/1366 px", "quotient 36÷6 : barres empilées jusqu’à 520 px", "rectangles à angles droits", "lignes collées", "aria avec équations parlées", "aide sans révélation", "solution demandée", "correction après erreur", "même opération", "aucune clé offerte", "focus/Tab/Échap", "320/390/520/1366"]
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
