import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = "http://127.0.0.1:8124";
const route = "/outils/plateaux_manipulation/moulin_pythagore.html";
const out = "_sources/moulin-pythagore/_controle";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 900 }]) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base + route);
  assert.equal(await page.locator("#puzzleSelect").inputValue(), "quatreIdentiques");
  const order = await page.locator("#puzzleSelect option").evaluateAll(els => els.filter(e => !e.dataset.action).map(e => e.value));
  assert.equal(order.length, 14);
  for (const puzzle of order) {
    await page.selectOption("#puzzleSelect", puzzle);
    assert.equal(await page.locator("#puzzleSelect").inputValue(), puzzle);
    assert.ok(await page.locator("#world").locator("polygon").count() > 0, puzzle);
  }
  for (const puzzle of ["quatreIdentiques", "moulinIsocele"]) {
    await page.selectOption("#puzzleSelect", puzzle);
    const [popup] = await Promise.all([page.waitForEvent("popup"), page.click("#enonce")]);
    popup.on("pageerror", error => errors.push(error.message));
    await popup.locator(".page").last().waitFor();
    assert.equal(await popup.locator(".page").count(), 5);
    assert.equal(await popup.locator(".miniCell").count(), 8);
    assert.equal(await popup.locator(".page").nth(1).locator("h2").innerText(), "Bilan – Moulin de Pythagore");
    await popup.close();
  }
  await page.selectOption("#puzzleSelect", "quatreIdentiques");
  await page.screenshot({ path: out + "/plateau-" + viewport.width + ".png" });
  await page.goto(base + "/outils/plateaux_manipulation/moulin_pythagore_fiches.html");
  const cards = await page.locator('a[href^="fiches_moulin/"]').evaluateAll(els => els.map(e => e.getAttribute("href").match(/moulin-pythagore-([^.?]+)\.pdf/)[1]));
  assert.deepEqual(cards, order);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "le catalogue ne déborde pas");
  await page.screenshot({ path: out + "/fiches-" + viewport.width + ".png", fullPage: true });
  await page.close();
}
await browser.close();
assert.deepEqual(errors, []);
console.log("Ordre, 14 puzzles chargés, fenêtres Fiche et catalogue contrôlés dans Chromium en 390×844 et 1366×900 ; aucune erreur JS.");
