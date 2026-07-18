// Serveur statique minimal pour tester le site en local (jamais publié :
// le dossier .claude est exclu de la publication).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const racine = process.argv[2] ?? process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

createServer(async (requete, reponse) => {
  try {
    let chemin = decodeURIComponent(new URL(requete.url, "http://localhost").pathname);
    if (chemin.endsWith("/")) chemin += "index.html";
    const fichier = normalize(join(racine, chemin));
    if (!fichier.startsWith(normalize(racine))) throw new Error("hors racine");
    const contenu = await readFile(fichier);
    reponse.writeHead(200, { "content-type": types[extname(fichier)] ?? "application/octet-stream" });
    reponse.end(contenu);
  } catch {
    reponse.writeHead(404);
    reponse.end("introuvable");
  }
}).listen(8123, () => console.log("serveur statique sur http://localhost:8123"));
