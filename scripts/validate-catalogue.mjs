#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "assets/js/catalogue-refonte-data.js"), "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

const catalogue = context.window.MATHSGO_CATALOGUE;
const errors = [];
const validGroups = new Set(["manipuler", "entrainer", "generer", "imprimer", "activites", "cours", "jeux"]);
const domainIds = new Set(catalogue.domains.map(({ id }) => id));
const notionById = new Map(catalogue.notions.map((notion) => [notion.id, notion]));
const collectionIds = new Set((catalogue.collections || []).map(({ id }) => id));
const published = catalogue.resources.filter(({ status }) => status === "published");
const publishedByPath = new Map(published.map((resource) => [resource.path, resource]));
const classifications = catalogue.resourceClassifications || {};

function fail(message) {
  errors.push(message);
}

for (const collection of catalogue.collections || []) {
  if (!collection.hub) {
    fail(`Collection ${collection.id}: aucun hub déclaré`);
    continue;
  }
  const hubPath = path.join(root, "outils", collection.hub);
  if (!fs.existsSync(hubPath)) fail(`Collection ${collection.id}: hub absent « outils/${collection.hub} »`);
}

if (catalogue.schemaVersion !== 5) {
  fail(`Version de schéma attendue : 5 (reçue : ${catalogue.schemaVersion})`);
}

for (const family of catalogue.resourceFamilies || []) {
  if (family.group && !validGroups.has(family.group)) {
    fail(`Famille ${family.id}: groupe inconnu « ${family.group} »`);
  }
  for (const resourcePath of family.paths || []) {
    if (!publishedByPath.has(resourcePath)) {
      fail(`Famille ${family.id}: ressource absente ou non publiée « ${resourcePath} »`);
    }
  }
}

for (const [resourcePath, classification] of Object.entries(classifications)) {
  if (classification.primaryGroup && !validGroups.has(classification.primaryGroup)) {
    fail(`${resourcePath}: groupe principal inconnu « ${classification.primaryGroup} »`);
  }
  if (classification.hiddenFromNotions && !Array.isArray(classification.hiddenFromNotions)) {
    fail(`${resourcePath}: hiddenFromNotions doit être une liste`);
  }
  for (const notionId of classification.hiddenFromNotions || []) {
    if (!notionById.has(notionId)) fail(`${resourcePath}: notion masquée inconnue « ${notionId} »`);
  }
}

for (const resource of catalogue.resources) {
  if (!classifications[resource.path]?.primaryGroup) {
    fail(`${resource.path}: aucun groupe principal explicite`);
  }
}

for (const resource of published) {
  const classification = classifications[resource.path] || {};
  const primaryNotionId = classification.primaryNotion || resource.notions?.[0];
  const primaryNotion = notionById.get(primaryNotionId);

  for (const domainId of resource.domains || []) {
    if (!domainIds.has(domainId)) fail(`${resource.path}: domaine inconnu « ${domainId} »`);
  }
  for (const notionId of resource.notions || []) {
    if (!notionById.has(notionId)) fail(`${resource.path}: notion inconnue « ${notionId} »`);
  }
  for (const collectionId of classification.collections || resource.collections || []) {
    if (!collectionIds.has(collectionId)) fail(`${resource.path}: collection inconnue « ${collectionId} »`);
  }
  if (!primaryNotion) {
    fail(`${resource.path}: aucune notion principale valide`);
  } else if (!(resource.notions || []).includes(primaryNotionId)) {
    fail(`${resource.path}: la notion principale « ${primaryNotionId} » n’est pas déclarée dans la ressource`);
  } else if (!(resource.domains || []).includes(primaryNotion.domain)) {
    fail(`${resource.path}: la notion principale « ${primaryNotionId} » appartient au domaine « ${primaryNotion.domain} », absent de la ressource`);
  }

  const thumbnail = classification.thumbnail || resource.thumbnail;
  if (thumbnail) {
    const thumbnailPath = thumbnail.split("?")[0];
    if (!fs.existsSync(path.join(root, thumbnailPath))) {
      fail(`${resource.path}: miniature absente « ${thumbnailPath} »`);
    }
  }
}

if (errors.length) {
  console.error(`Catalogue invalide (${errors.length} erreur${errors.length > 1 ? "s" : ""}) :`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Catalogue valide : ${published.length} ressources publiées, ${catalogue.notions.length} notions, ${(catalogue.resourceFamilies || []).length} familles.`);
