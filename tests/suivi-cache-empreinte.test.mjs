import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, posix } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(racine, "_serveur", "public");

// Lot A « plus rapide » (21/11/2026) : le .htaccess du serveur de suivi fait
// garder un an (Cache-Control immutable) les fichiers appelés avec une
// empreinte dans l'adresse (?v=…), et eux seuls. Deux risques gardés ici :
//  - une directive hors de son <IfModule> : si le module manque chez OVH,
//    Apache répond 500 sur TOUT le serveur ;
//  - un fichier appelé avec un ?v= qui ne suit pas son contenu : l'élève
//    garderait un an un vieux fichier après un dépôt FTP.
const CHEMIN = "_serveur/public/.htaccess";
const htaccess = readFileSync(join(PUBLIC, ".htaccess"), "utf8");

const lignes = htaccess
  .split(/\r?\n/)
  .map((texte, i) => ({ n: i + 1, texte: texte.trim() }))
  .filter(({ texte }) => texte !== "" && !texte.startsWith("#"));

// Chaque ligne avec la pile des blocs <…> qui l'entourent.
function avecBlocs() {
  const pile = [];
  return lignes.map((ligne) => {
    const fermeture = ligne.texte.match(/^<\/(\w+)/);
    if (fermeture) {
      pile.pop();
      return { ...ligne, blocs: [...pile] };
    }
    const resultat = { ...ligne, blocs: [...pile] };
    const ouverture = ligne.texte.match(/^<(\w+)([^>]*)>/);
    if (ouverture) pile.push(`${ouverture[1]}${ouverture[2]}`.replace(/\s+/g, " ").trim());
    return resultat;
  });
}
const enContexte = avecBlocs();

test("aucune directive de mod_rewrite ou mod_headers hors de son <IfModule>", () => {
  for (const { n, texte, blocs } of enContexte) {
    if (/^Rewrite\w*\s/i.test(texte)) {
      assert.ok(blocs.some((b) => /^IfModule mod_rewrite\.c$/i.test(b)),
        `${CHEMIN} ligne ${n} : « ${texte} » doit être dans <IfModule mod_rewrite.c>, `
          + "sinon un module absent chez OVH donne une erreur 500 sur tout le serveur.");
    }
    if (/^Header\s/i.test(texte)) {
      assert.ok(blocs.some((b) => /^IfModule mod_headers\.c$/i.test(b)),
        `${CHEMIN} ligne ${n} : « ${texte} » doit être dans <IfModule mod_headers.c>.`);
    }
  }
});

const iDrapeau = enContexte.findIndex(({ texte }) =>
  /^RewriteRule\s/i.test(texte) && texte.includes("E=MG_EMPREINTE:1"));

test("le drapeau MG_EMPREINTE n'est posé que si l'adresse porte ?v= et que le fichier existe", () => {
  assert.notEqual(iDrapeau, -1, `${CHEMIN} : il manque la RewriteRule qui pose E=MG_EMPREINTE:1.`);
  const regle = enContexte[iDrapeau];

  // Les RewriteCond qui précèdent immédiatement la règle sont les siennes.
  const conditions = [];
  for (let i = iDrapeau - 1; i >= 0 && /^RewriteCond\s/i.test(enContexte[i].texte); i--) {
    conditions.unshift(enContexte[i].texte.replace(/\s+/g, " "));
  }
  const condQuery = conditions.find((c) => c.startsWith("RewriteCond %{QUERY_STRING} "));
  assert.ok(condQuery, `${CHEMIN} ligne ${regle.n} : la règle doit dépendre de %{QUERY_STRING}.`);
  assert.ok(conditions.includes("RewriteCond %{REQUEST_FILENAME} -f"),
    `${CHEMIN} ligne ${regle.n} : un fichier absent (404) ne doit jamais être gardé un an.`);

  // Le motif d'Apache est une PCRE simple : JavaScript le lit de la même façon.
  const motif = new RegExp(condQuery.split(" ")[2]);
  for (const oui of ["v=3f2a1b9c0d", "x=1&v=abc"]) assert.ok(motif.test(oui), `« ${oui} » doit compter`);
  for (const non of ["", "v=", "nv=1", "x=1", "version"]) assert.ok(!motif.test(non), `« ${non} » ne doit pas compter`);

  // Les extensions : les fichiers statiques, jamais une page PHP.
  const extensions = regle.texte.match(/^RewriteRule\s+(\S+)/i)[1];
  const motifFichier = new RegExp(extensions);
  for (const oui of ["suivi.css", "prof/splat-parcours.js", "favicon.svg", "apple-touch-icon.png", "f.woff2"]) {
    assert.ok(motifFichier.test(oui), `${oui} doit être couvert`);
  }
  for (const non of ["index.php", "prof/index.php", "api/eleve.php", "VERSION"]) {
    assert.ok(!motifFichier.test(non), `${non} ne doit jamais recevoir le cache d'un an`);
  }
});

test("le Cache-Control d'un an n'est écrit que sous le drapeau, et jamais pour .php", () => {
  const entetes = enContexte.filter(({ texte }) => /^Header\s/i.test(texte) && /cache-control/i.test(texte));
  assert.equal(entetes.length, 1, `${CHEMIN} : un seul Header Cache-Control attendu.`);
  const [entete] = entetes;
  assert.match(entete.texte,
    /^Header set Cache-Control "public, max-age=31536000, immutable" env=MG_EMPREINTE$/,
    `${CHEMIN} ligne ${entete.n} : la valeur ou la condition env=MG_EMPREINTE a changé.`);
  const filtre = entete.blocs.find((b) => b.startsWith("FilesMatch"));
  assert.ok(filtre, `${CHEMIN} ligne ${entete.n} : l'en-tête doit être limité par un <FilesMatch>.`);
  const motif = new RegExp(filtre.match(/"([^"]+)"/)[1]);
  assert.ok(!motif.test("index.php"), "le <FilesMatch> du cache ne doit pas couvrir les pages .php");
  assert.ok(motif.test("suivi.css"), "le <FilesMatch> du cache doit couvrir suivi.css");
});

// ---------------------------------------------------------------------------
// Chaque fichier appelé avec ?v= par les pages porte une empreinte qui suit son
// contenu : une variable PHP calculée avec md5_file sur le fichier déposé.
const PAGES = ["index.php", "infos.php", "direct.php", "prof/index.php", "prof/direct.php"];

test("chaque ?v= des pages est le md5 du fichier sur le disque", () => {
  let vus = 0;
  for (const page of PAGES) {
    const source = readFileSync(join(PUBLIC, page), "utf8");
    const appels = [...source.matchAll(
      /([\w./-]+\.(?:js|css|png|svg|woff2))\?v=<\?= htmlspecialchars\(\$(\w+)/g)];
    for (const [, fichier, variable] of appels) {
      vus++;
      const affectation = source.match(new RegExp(`\\$${variable} = ([^;]+);`));
      assert.ok(affectation, `${page} : $${variable} (pour ${fichier}) n'est jamais calculée.`);
      const calcul = affectation[1];
      const parMd5 = /md5_file\(/.test(calcul)
        || (/^version_moteur\(/.test(calcul) && /function version_moteur[\s\S]{0,200}md5_file\(/.test(source))
        || (/^\$versionDe\(/.test(calcul) && /\$versionDe = static function[\s\S]{0,200}md5_file\(/.test(source));
      assert.ok(parMd5, `${page} : $${variable} = ${calcul} ne suit pas le contenu de ${fichier} (md5_file attendu).`);

      // Et l'adresse désigne bien un fichier du dépôt (relatif à la page).
      const relatif = posix.normalize(posix.join(posix.dirname(page), fichier));
      assert.ok(existsSync(join(PUBLIC, relatif)), `${page} appelle ${fichier} : ${relatif} n'existe pas.`);
    }
  }
  // 1 + 1 + 6 (index), 1 (infos), 1 (direct), 1 + 2 + 5 (prof/index), 4 (prof/direct)
  assert.ok(vus >= 20, `seulement ${vus} appels avec ?v= trouvés : le motif ne lit plus les pages.`);
});
