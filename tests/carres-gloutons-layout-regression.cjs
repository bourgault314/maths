const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = process.env.CARRES_GLOUTONS_CAPTURE_DIR || "/tmp/carres-gloutons-qa";
const VIEWPORTS = [
  { name: "desktop-1366x768", width: 1366, height: 768 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "intermediate-820x700", width: 820, height: 700 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-320x568", width: 320, height: 568 }
];

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function startServer() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.resolve(ROOT, relativePath);

    if (!filePath.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404).end("Not found");
      return;
    }

    response.writeHead(200, { "content-type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
  });

  return new Promise(resolve => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function inspect(page, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${page.serverUrl}/outils/club_maths/carres_gloutons.html`, { waitUntil: "networkidle" });
  await page.locator("#start-game").click();

  const metrics = await page.evaluate(() => {
    const bounds = selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height };
    };

    const game = document.querySelector("#game");
    return {
      viewport: { width: innerWidth, height: innerHeight },
      bodyScrollWidth: document.documentElement.scrollWidth,
      gameClientWidth: game.clientWidth,
      gameScrollWidth: game.scrollWidth,
      game: bounds("#game"),
      titleActions: bounds(".title-actions"),
      dashboard: bounds(".dashboard"),
      status: bounds("#status"),
      board: bounds("#board")
    };
  });

  assert.ok(Math.abs(metrics.board.width - metrics.board.height) <= 1, `${viewport.name}: le plateau doit rester carré`);
  assert.ok(metrics.bodyScrollWidth <= metrics.viewport.width + 1, `${viewport.name}: aucun débordement horizontal de la page`);
  assert.ok(metrics.gameScrollWidth <= metrics.gameClientWidth + 1, `${viewport.name}: aucun débordement horizontal du jeu`);
  assert.ok(metrics.board.left >= -1 && metrics.board.right <= metrics.viewport.width + 1, `${viewport.name}: le plateau reste dans l’écran`);

  if (viewport.width >= 561) {
    assert.ok(metrics.board.bottom <= metrics.viewport.height + 1, `${viewport.name}: le plateau doit être visible sans défilement`);
    assert.ok(metrics.titleActions.bottom <= metrics.viewport.height + 1, `${viewport.name}: les commandes doivent être visibles sans défilement`);
    assert.ok(metrics.dashboard.bottom <= metrics.viewport.height + 1, `${viewport.name}: les scores doivent être visibles sans défilement`);
    assert.ok(metrics.status.bottom <= metrics.viewport.height + 1, `${viewport.name}: l’indication de tour doit être visible sans défilement`);
  }

  await page.screenshot({ path: path.join(OUTPUT, `${viewport.name}.png`) });
  return metrics;
}

async function captureGloubiOnIphone(page) {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.addInitScript(() => { Math.random = () => 0.25; });
  await page.goto(`${page.serverUrl}/outils/club_maths/carres_gloutons.html`, { waitUntil: "networkidle" });
  await page.locator("#start-game").click();

  for (let attempt = 0; attempt < 16 && await page.locator(".ai-marker").count() === 0; attempt += 1) {
    await page.waitForFunction(() => !document.querySelector("#status").classList.contains("ai"), null, { timeout: 8000 });
    await page.evaluate(() => {
      document.querySelector(".edge:not(.taken)")?.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    await page.waitForTimeout(620);
  }

  const marker = page.locator(".ai-marker").first();
  await marker.waitFor({ state: "attached" });
  await page.waitForFunction(() => !document.querySelector("#status").classList.contains("ai"), null, { timeout: 8000 });
  await page.waitForTimeout(400);

  const geometry = await marker.evaluate(node => {
    const box = selector => {
      const bounds = node.querySelector(selector).getBBox();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, right: bounds.x + bounds.width, bottom: bounds.y + bounds.height };
    };
    const children = Array.from(node.children);
    const tongue = node.querySelector(".ai-marker-tongue");
    const mouth = node.querySelector(".ai-marker-mouth");
    return {
      disc: box(".ai-marker-disc"),
      tongue: box(".ai-marker-tongue"),
      mouth: box(".ai-marker-mouth"),
      tongueBeforeMouth: children.indexOf(tongue) < children.indexOf(mouth)
    };
  });

  assert.equal(geometry.tongueBeforeMouth, true, "iPhone : la bouche doit masquer la jonction haute de la langue");
  assert.ok(geometry.tongue.y < geometry.mouth.bottom && geometry.tongue.bottom > geometry.mouth.bottom,
    `iPhone : la langue doit chevaucher la courbe de bouche (${JSON.stringify(geometry)})`);
  assert.ok(geometry.tongue.bottom <= geometry.disc.bottom - 5,
    `iPhone : la langue doit garder de l’air avant le bord du visage (${JSON.stringify(geometry)})`);

  await page.screenshot({ path: path.join(OUTPUT, "gloubi-iphone-402x874-3x.png"), fullPage: true });
  await marker.screenshot({ path: path.join(OUTPUT, "gloubi-visage-iphone-3x.png") });
  return geometry;
}

async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const server = await startServer();
  const address = server.address();
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {})
  });

  try {
    const page = await browser.newPage();
    page.serverUrl = `http://127.0.0.1:${address.port}`;
    const reports = [];

    for (const viewport of VIEWPORTS) reports.push({ name: viewport.name, ...(await inspect(page, viewport)) });

    const iphonePage = await browser.newPage({
      viewport: { width: 402, height: 874 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });
    iphonePage.serverUrl = page.serverUrl;
    const iphoneGloubi = await captureGloubiOnIphone(iphonePage);
    await iphonePage.close();

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`${page.serverUrl}/outils/club_maths/carres_gloutons.html`, { waitUntil: "networkidle" });
    await page.locator("#start-game").click();
    await page.evaluate(() => {
      Object.defineProperty(document.querySelector("#game"), "requestFullscreen", { configurable: true, value: undefined });
      Object.defineProperty(document.querySelector("#game"), "webkitRequestFullscreen", { configurable: true, value: undefined });
    });
    await page.locator("#fullscreen-button").click();
    await page.locator("html.fullscreen-fallback").waitFor();
    const fullscreenBoard = await page.locator("#board").boundingBox();
    await page.screenshot({ path: path.join(OUTPUT, "fullscreen-1366x768.png") });
    assert.ok(fullscreenBoard && Math.abs(fullscreenBoard.width - fullscreenBoard.height) <= 1, `plein écran : le plateau reste carré (${JSON.stringify(fullscreenBoard)})`);
    assert.ok(fullscreenBoard.y + fullscreenBoard.height <= 768 + 1, `plein écran : le plateau reste visible (${JSON.stringify(fullscreenBoard)})`);

    console.log(JSON.stringify({ ok: true, output: OUTPUT, reports, iphoneGloubi }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
