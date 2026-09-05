#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve(process.cwd());
const argumentsList = process.argv.slice(2);

function optionValue(name, fallback) {
  const index = argumentsList.indexOf(name);
  return index === -1 || !argumentsList[index + 1] ? fallback : argumentsList[index + 1];
}

const host = optionValue("--host", "127.0.0.1");
const port = Number(optionValue("--port", "4173"));
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);

function insideRoot(filePath) {
  return filePath === root || filePath.startsWith(`${root}${path.sep}`);
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method || "")) {
    sendText(response, 405, "Méthode non autorisée");
    return;
  }

  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(request.url || "/", "http://preview.local").pathname);
  } catch {
    sendText(response, 400, "Adresse invalide");
    return;
  }

  let filePath = path.resolve(root, `.${requestPath}`);
  if (!insideRoot(filePath)) {
    sendText(response, 403, "Accès refusé");
    return;
  }

  try {
    const information = await stat(filePath);
    if (information.isDirectory()) filePath = path.join(filePath, "index.html");
    const fileInformation = await stat(filePath);
    if (!fileInformation.isFile() || !insideRoot(filePath)) throw new Error("not-found");

    response.writeHead(200, {
      "Content-Length": fileInformation.size,
      "Content-Type": contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    sendText(response, 404, "Fichier introuvable");
  }
});

server.on("error", (error) => {
  console.error(`Aperçu impossible : ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Aperçu local disponible sur le port ${port}.`);
});
