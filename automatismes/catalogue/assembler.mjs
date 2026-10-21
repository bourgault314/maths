import { readFile, readdir, writeFile } from "node:fs/promises";

// Les cartes de famille sont la source du catalogue assemblé.
const dossier = new URL("./", import.meta.url);
const fichiers = (await readdir(dossier)).filter((nom) => /^[A-Z]{2}\d{2}\.json$/.test(nom));
const cartes = await Promise.all(
  fichiers.map(async (nom) => JSON.parse(await readFile(new URL(nom, dossier), "utf8"))),
);

// On conserve l'ordre de l'archive, qui est indépendant des identifiants des formes.
const precedent = JSON.parse(await readFile(new URL("catalogue.json", dossier), "utf8"));
const ordre = new Map(precedent.map((carte, indice) => [carte.id, indice]));
cartes.sort((a, b) => (ordre.get(a.id) ?? Infinity) - (ordre.get(b.id) ?? Infinity));
await writeFile(new URL("catalogue.json", dossier), `${JSON.stringify(cartes, null, 2)}\n`);
console.log(`${cartes.length} familles assemblées.`);
