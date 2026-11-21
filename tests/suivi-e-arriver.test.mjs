// Lot E « Arriver » (21/11/2026) : l'écran du code et la connexion prof plus
// grands sur ordinateur, l'écran du code en Nunito, et l'icône de l'écran
// d'accueil du téléphone (nom « maths&go », manifeste pour Android).
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";

const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const octets = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url));
const tete = page => page.slice(0, page.indexOf("</head>"));
// Le bloc CSS d'une règle @media donnée (jusqu'à l'accolade qui le ferme).
function bloc(texte, debut) {
  const i = texte.indexOf(debut);
  assert.ok(i >= 0, `bloc introuvable : ${debut}`);
  let n = 0;
  for (let j = texte.indexOf("{", i); j < texte.length; j += 1) {
    if (texte[j] === "{") n += 1;
    if (texte[j] === "}" && --n === 0) return texte.slice(i, j + 1);
  }
  throw new Error("bloc non fermé");
}
// Largeur et hauteur d'un PNG (en-tête IHDR).
function taillePng(chemin) {
  const b = octets(chemin);
  assert.equal(b.subarray(1, 4).toString("ascii"), "PNG", `${chemin} est un PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

test("Mon espace annonce l'icône : nom « maths&go » pour l'iPhone, manifeste pour Android, et rien qui recolore le navigateur", () => {
  const h = tete(lire("_serveur/public/index.php"));
  assert.match(h, /<meta name="apple-mobile-web-app-title" content="maths&amp;go">/);
  assert.match(h, /<link rel="manifest" href="app\.webmanifest">/);
  assert.match(h, /<link rel="apple-touch-icon" href="apple-touch-icon\.png">/);
  // Une barre de navigateur recolorée serait un changement visible non demandé.
  assert.doesNotMatch(h, /name="theme-color"/);
  // L'iPhone ne doit pas être poussé en « app » par la page elle-même.
  assert.doesNotMatch(h, /apple-mobile-web-app-capable|mobile-web-app-capable/);
  // La page prof n'a pas de manifeste : l'icône est celle des élèves.
  assert.doesNotMatch(tete(lire("_serveur/public/prof/index.php")), /rel="manifest"/);
});

test("le manifeste : « maths&go », ouvert dans le navigateur (les applis gardent l'onglet), trois images qui existent à la bonne taille", () => {
  const m = JSON.parse(lire("_serveur/public/app.webmanifest"));
  assert.equal(m.short_name, "maths&go");
  assert.equal(m.display, "browser");
  assert.equal(m.start_url, "./");
  assert.equal(m.scope, "./");
  assert.equal(m.lang, "fr");
  assert.equal(m.theme_color, undefined);
  assert.equal(m.background_color, undefined);
  // Aucune adresse vers un autre site.
  assert.doesNotMatch(JSON.stringify(m), /https?:/);
  const attendues = {"icone-192.png": [192, "any"], "icone-512.png": [512, "any"], "icone-masquable-512.png": [512, "maskable"]};
  assert.deepEqual(m.icons.map(i => i.src).sort(), Object.keys(attendues).sort());
  for (const icone of m.icons) {
    const [cote, usage] = attendues[icone.src];
    assert.equal(icone.sizes, `${cote}x${cote}`);
    assert.equal(icone.type, "image/png");
    assert.equal(icone.purpose, usage);
    assert.ok(existsSync(new URL(`../_serveur/public/${icone.src}`, import.meta.url)), `${icone.src} est dans le dossier du serveur`);
    assert.deepEqual(taillePng(`_serveur/public/${icone.src}`), [cote, cote]);
  }
});

test(".htaccess : le manifeste part avec son vrai type et nosniff", () => {
  const h = lire("_serveur/public/.htaccess");
  assert.match(h, /<IfModule mod_mime\.c>\s*AddType application\/manifest\+json \.webmanifest\s*<\/IfModule>/);
  assert.match(h, /<FilesMatch "\\\.\(js\|css\|webmanifest\)\$">\s*Header set X-Content-Type-Options "nosniff"/);
});

test("écran du code : en Nunito partout ; plus grand à partir de 900 px seulement, sans centrage vertical", () => {
  const p = lire("_serveur/public/index.php");
  assert.match(p, /#ecran-code \{ --sans: "Nunito"[^}]*font-family: var\(--sans\); \}/);
  assert.match(p, /#ecran-code h1 \{ font-family: var\(--sans\); font-weight: 900;/);
  const grand = bloc(p, "@media (min-width: 900px) {\n    #ecran-code {");
  assert.match(grand, /#cases \{ --cec-max: 516px; --cec-ecart: 12px; --cec-hauteur: 84px; --cec-police: 2\.5rem; \}/);
  assert.match(grand, /#ecran-code \.carte \{ max-width: 600px;/);
  assert.match(grand, /#ecran-code h1 \{ font-size: 3rem; \}/);
  assert.match(grand, /#form-code \.actions button \{ min-width: 320px; min-height: 56px;/);
  // Une hauteur fixe, jamais un centrage : le message d'erreur ne fait rien remonter.
  assert.doesNotMatch(grand, /justify-content:\s*center|align-items:\s*center|margin:\s*auto 0|min-height:\s*\d+vh/);
  // Les mesures du téléphone ne changent pas.
  assert.match(p, /#cases \{ --cec-max: 372px; --cec-ecart: 8px; --cec-hauteur: 62px; --cec-police: 1\.75rem;/);
  assert.match(p, /#ecran-code \.carte \{ max-width: 430px; margin: 0 auto; padding: 22px 18px; text-align: left; \}/);
});

test("connexion prof : plus grande à partir de 900 px, resserrée sur un écran bas, toujours en Georgia", () => {
  const p = lire("_serveur/public/prof/index.php");
  const grand = bloc(p, "@media (min-width: 900px) {\n    #ecran-connexion {");
  assert.match(grand, /#ecran-connexion \.carte \{ max-width: 540px;/);
  assert.match(grand, /#ecran-connexion input \{ min-height: 52px;/);
  assert.match(grand, /#ecran-connexion \.actions button \{ min-height: 56px;/);
  assert.doesNotMatch(grand, /Nunito|font-family/);
  const bas = bloc(p, "@media (min-width: 900px) and (max-height: 720px) {\n    #ecran-connexion");
  assert.match(bas, /\.logo-accueil \{ width: 190px;/);
  // Les mesures d'en dessous de 900 px ne changent pas.
  assert.match(p, /#ecran-connexion \.carte \{ max-width: 420px; margin: 0 auto; text-align: left; \}/);
});
