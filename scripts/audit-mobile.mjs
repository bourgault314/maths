#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const cataloguePath = path.join(root, "assets/js/catalogue-refonte-data.js");

function loadCatalogue() {
  const source = fs.readFileSync(cataloguePath, "utf8").trim();
  const json = source
    .replace(/^window\.MATHSGO_CATALOGUE\s*=\s*/, "")
    .replace(/;\s*$/, "");
  return JSON.parse(json);
}

function normaliseResourcePath(resourcePath) {
  return resourcePath.endsWith("/") ? `${resourcePath}index.html` : resourcePath;
}

function stripMarkup(value) {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&larr;|&#8592;|&#x2190;/gi, "←")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractStyles(html, resourcePath) {
  const inline = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1])
    .join("\n");
  const linked = [...html.matchAll(/<link\b[^>]*href\s*=\s*["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi)]
    .map((match) => match[1].split("?")[0])
    .filter((href) => !/^(?:https?:)?\/\//i.test(href))
    .map((href) => href.startsWith("/")
      ? path.join(root, href.slice(1))
      : path.resolve(path.dirname(path.join(root, resourcePath)), href))
    .filter((stylesheetPath) => fs.existsSync(stylesheetPath))
    .map((stylesheetPath) => fs.readFileSync(stylesheetPath, "utf8"))
    .join("\n");
  return `${inline}\n${linked}`
    .replace(/data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi, "");
}

function extractAnchors(html) {
  return [...html.matchAll(/<a\b([^>]*)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      attrs: `${match[1]} ${match[3]}`,
      href: match[2],
      text: stripMarkup(match[4]),
    }));
}

function hasParentNavigation(html, anchors) {
  if (/tool-parent-navigation\.js/i.test(html)) return true;
  if (/history\.(?:back|go)\s*\(/i.test(html)) return true;
  return anchors.some(({ attrs, href, text }) => {
    const label = `${attrs} ${text}`.toLowerCase();
    const explicitLabel = /(retour|accueil|menu|sommaire|index|précédent|precedent|←|🏠|⌂)/i.test(label);
    const navigatesElsewhere = href !== "#"
      && !/^javascript:/i.test(href)
      && !/^mailto:/i.test(href);
    return explicitLabel && navigatesElsewhere;
  });
}

function fixedWidthSignals(styles, html) {
  const signals = [];
  for (const match of styles.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
    const selector = match[1].replace(/\s+/g, " ").trim();
    const declarations = match[2];
    if (/(@media|@page|@keyframes|from|to|%$)/i.test(selector)) continue;
    const hasSafety = /max-width\s*:\s*(?:100%|100vw|calc\s*\()/i.test(declarations)
      || /width\s*:\s*(?:min|max|clamp)\s*\(/i.test(declarations);
    for (const width of declarations.matchAll(/(?:^|;)\s*(min-width|width)\s*:\s*(\d{3,4})px\b/gi)) {
      const value = Number(width[2]);
      if (value > 390 && !hasSafety) {
        signals.push(`${selector.slice(0, 70)}: ${width[1]} ${value}px`);
      }
    }
  }

  for (const match of html.matchAll(/<(canvas|table|div|main|section)\b[^>]*\bwidth\s*=\s*["']?(\d{3,4})/gi)) {
    const value = Number(match[2]);
    if (value > 390) signals.push(`<${match[1].toLowerCase()}> width=${value}`);
  }
  return [...new Set(signals)].slice(0, 8);
}

function auditResource(resource) {
  const resourcePath = normaliseResourcePath(resource.path);
  const absolutePath = path.join(root, resourcePath);
  if (!fs.existsSync(absolutePath)) {
    return { ...resource, path: resourcePath, missing: true, issues: ["Fichier absent"] };
  }

  const html = fs.readFileSync(absolutePath, "utf8");
  const styles = extractStyles(html, resourcePath);
  const anchors = extractAnchors(html);
  const viewport = html.match(/<meta\b[^>]*name\s*=\s*["']viewport["'][^>]*>/i)?.[0] ?? "";
  const hasViewport = /width\s*=\s*device-width/i.test(viewport);
  const blocksZoom = /(user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?(?:\D|$))/i.test(viewport);
  const hasNarrowBreakpoint = /@media\s*(?:screen\s+and\s*)?\([^)]*max-width\s*:\s*(?:[3-8]\d{2})px/i.test(styles);
  const hasFluidLayout = /(max-width\s*:\s*100%|width\s*:\s*100%|flex-wrap\s*:\s*wrap|auto-fit|auto-fill|minmax\s*\(|clamp\s*\(|\bvw\b|\bdvw\b)/i.test(styles)
    || /class\s*=\s*["'][^"']*(?:\b(?:sm|md|lg):|\bw-full\b|max-w-)/i.test(html);
  const fixedWidths = fixedWidthSignals(styles, html);
  const parentNavigation = hasParentNavigation(html, anchors);
  const touchAware = /(pointer(?:down|move|up)|touch(?:start|move|end)|touch-action)/i.test(html);
  const preventsTouchScrollEverywhere = /(?:html\s*,\s*body|body)[^{]*\{[^}]*touch-action\s*:\s*none/i.test(styles);
  const issues = [];

  if (!hasViewport) issues.push("Viewport mobile absent");
  if (!parentNavigation) issues.push("Retour vers le menu parent non détecté");
  if (!hasNarrowBreakpoint && !hasFluidLayout) issues.push("Aucun signal de mise en page étroite");
  if (fixedWidths.length) issues.push(`${fixedWidths.length} largeur(s) fixe(s) > 390 px à vérifier`);
  if (blocksZoom) issues.push("Zoom utilisateur désactivé");
  if (preventsTouchScrollEverywhere) issues.push("Défilement tactile global désactivé");

  return {
    id: resource.id,
    title: resource.title,
    path: resourcePath,
    status: resource.status,
    type: resource.type,
    missing: false,
    hasViewport,
    blocksZoom,
    hasNarrowBreakpoint,
    hasFluidLayout,
    parentNavigation,
    touchAware,
    preventsTouchScrollEverywhere,
    fixedWidths,
    issues,
  };
}

function summarise(results) {
  const count = (predicate) => results.filter(predicate).length;
  return {
    audited: results.length,
    published: count((item) => item.status === "published"),
    hidden: count((item) => item.status === "hidden"),
    review: count((item) => item.status === "review"),
    missing: count((item) => item.missing),
    missingViewport: count((item) => !item.missing && !item.hasViewport),
    missingParentNavigation: count((item) => !item.missing && !item.parentNavigation),
    noNarrowLayoutSignal: count((item) => !item.missing && !item.hasNarrowBreakpoint && !item.hasFluidLayout),
    fixedWidthCandidates: count((item) => !item.missing && item.fixedWidths.length > 0),
    blocksZoom: count((item) => !item.missing && item.blocksZoom),
    globalTouchScrollDisabled: count((item) => !item.missing && item.preventsTouchScrollEverywhere),
  };
}

const catalogue = loadCatalogue();
const statusRank = { hidden: 0, review: 1, published: 2 };
const resourcesByPath = new Map();
for (const resource of catalogue.resources) {
  if (!(resource.path.endsWith(".html") || resource.path.endsWith("/"))) continue;
  const resourcePath = normaliseResourcePath(resource.path);
  const previous = resourcesByPath.get(resourcePath);
  if (!previous || (statusRank[resource.status] ?? -1) > (statusRank[previous.status] ?? -1)) {
    resourcesByPath.set(resourcePath, resource);
  }
}
const resources = [...resourcesByPath.values()];
const results = resources.map(auditResource);
const report = { generatedAt: new Date().toISOString(), summary: summarise(results), results };

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  console.log(JSON.stringify(report.summary, null, 2));
  console.log("\nPages à contrôler en priorité :");
  results
    .filter((item) => item.status === "published" && item.issues.length >= 2)
    .sort((a, b) => b.issues.length - a.issues.length || a.path.localeCompare(b.path))
    .forEach((item) => console.log(`- ${item.path}: ${item.issues.join("; ")}`));
}
