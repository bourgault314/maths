import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Petit SPLAT! : un QR « je rejoue en ligne » sur chaque fiche classique (26/09/2026).
   Décisions de Gwenaël (questions à choix) : le QR ouvre la VERSION ÉLÈVE des cartes de la
   fiche, et il est TOUJOURS là (pas de case à cocher). Sur ordinateur, on ne scanne pas son
   propre écran : la boîte du QR est aussi un lien. Les livrets gardent leur QR (qr=0). */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const petit = lire("outils/splat_tache_barre.html");
const render = lire("_sources/livret-petit-splat/render.py");

function morceau(debut, fin) {
  const a = petit.indexOf(debut);
  const b = petit.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `morceau introuvable : ${debut}`);
  return petit.slice(a, b);
}

/* adresseEleveFiche, exécutée hors navigateur avec les réglages voulus */
function adresse(reglages, origine = "https://mathsgo.re") {
  const champs = {
    targetVal: { value: reglages.target },
    splatMode: { value: reglages.splats },
    gameMode: { value: reglages.exercise },
    gridSize: { value: reglages.grid || "3x4" },
    espaceSchema: { checked: !!reglages.espace },
  };
  const ctx = vm.createContext({
    URL, URLSearchParams,
    window: { location: { search: reglages.qr ? `?qr=${reglages.qr}` : "" } },
    document: { getElementById: (id) => champs[id] },
    activeSeed: reglages.seed,
    parcoursId: reglages.parcours || "",
    // 26/09/2026 : jetons=0 et sansjetons=N (livrets « je dessine le schéma ») suivent dans le QR
    jetonsAutourCoche: () => reglages.jetons !== "0",
    sansJetonsNombre: reglages.sansjetons || 0,
  });
  vm.runInContext(morceau("const QR_SITE", "function ajouterQrFiche(") +
    "globalThis.__r = { url: adresseEleveFiche(" + JSON.stringify(origine) + "), actif: QR_FICHE_ACTIF };", ctx);
  return ctx.__r;
}

test("le générateur de QR du dépôt est chargé avant l'ouverture de la page", () => {
  assert.match(petit, /<script defer src="\.\.\/auto\/scripts\/vendor\/qrcode-generator\.js"><\/script>/);
  assert.ok(existsSync(new URL("../auto/scripts/vendor/qrcode-generator.js", import.meta.url)));
  // dans <head> et en defer : il s'exécute avant l'événement load, qui dessine la première fiche
  assert.ok(petit.indexOf('src="../auto/scripts/vendor/qrcode-generator.js"') < petit.indexOf("</head>"));
  assert.match(petit, /\nwindow\.onload = \(\) => \{/);
});

test("le QR ouvre les cartes de la fiche en version élève, sur le site", () => {
  const r = adresse({ target: "20", splats: "1", exercise: "find_hidden", seed: "201490" });
  assert.equal(r.url, "https://mathsgo.re/splat/petit/?support=eleve&problem=classic&target=20&splats=1&exercise=find_hidden&seed=201490");
  assert.equal(r.actif, true, "toujours là, sans réglage");
  // l'adresse d'un QR de livret (fiche 4 du monde 1) : la même que celle que l'outil fabrique
  const livret = adresse({ target: "20", splats: "2", exercise: "find_hidden", seed: "347458", espace: true, parcours: "m1e4" });
  assert.equal(livret.url, "https://mathsgo.re/splat/petit/?support=eleve&problem=classic&target=20&splats=2&exercise=find_hidden&seed=347458&espace=1&parcours=m1e4");
});

test("8 ou 9 cases : l'élève rejoue autant de cartes que sur sa feuille", () => {
  assert.match(adresse({ target: "100", splats: "mix", exercise: "mix", seed: "7", grid: "2x4" }).url, /&grid=2x4(&|$)/);
  assert.match(adresse({ target: "50", splats: "1", exercise: "construct", seed: "7", grid: "3x3" }).url, /&grid=3x3(&|$)/);
  assert.doesNotMatch(adresse({ target: "20", splats: "1", exercise: "mix", seed: "7" }).url, /grid=/);
});

test("le lien de l'écran suit le serveur qui sert la page, le QR reste celui du site", () => {
  assert.match(adresse({ target: "20", splats: "1", exercise: "mix", seed: "7" }, "http://127.0.0.1:8123").url,
    /^http:\/\/127\.0\.0\.1:8123\/splat\/petit\/\?support=eleve&/);
  assert.match(petit, /qr\.addData\(adresseEleveFiche\(QR_SITE\), 'Byte'\)/);
  assert.match(petit, /lien\.href = adresseEleveFiche\(window\.location\.origin\);/);
  assert.match(petit, /lien\.target = '_blank';/);
});

test("seulement la fiche imprimée du Petit Splat classique, dans le cadre de consigne", () => {
  assert.match(petit, /if \(!QR_FICHE_ACTIF \|\| isTBI \|\| isEleve \|\| getProblemType\(\) !== 'classic'\) return;/);
  // le cadre de consigne n'existe que sur les pages d'énoncé (pas sur la correction)
  assert.match(petit, /instruction\.innerHTML = getInstructionHtml\(\);\s*ajouterQrFiche\(instruction\);/);
  // même boîte que les livrets : 20 mm, même texte
  assert.match(petit, /\.qr-fiche svg \{ width: 20mm; height: 20mm;/);
  assert.match(petit, /J'ai terminé<br>ma fiche,<em>je rejoue en ligne<\/em>/);
});

test("les livrets gardent leur propre QR : render.py demande qr=0", () => {
  assert.equal(adresse({ target: "20", splats: "1", exercise: "mix", seed: "7", qr: "0" }).actif, false);
  const url = render.slice(render.indexOf('url = (f"{base}/outils/splat_tache_barre.html?support=print'));
  assert.match(url.slice(0, 1200), /\+ "&qr=0"/);   // 1200 : la fiche porte aussi les réglages des livrets « Je fais le schéma »
});

test("jetons=0 et sansjetons=N suivent dans le QR (livrets « Je fais le schéma en barres », 26/09/2026)", () => {
  const f2 = adresse({ target: "20", splats: "mix", exercise: "find_hidden", seed: "1310010", espace: true, jetons: "0", parcours: "m1e5" });
  assert.equal(f2.url, "https://mathsgo.re/splat/petit/?support=eleve&problem=classic&target=20&splats=mix&exercise=find_hidden&seed=1310010&espace=1&jetons=0&parcours=m1e5");
  const f4 = adresse({ target: "20", splats: "mix4", exercise: "find_hidden", seed: "24310055", grid: "3x3", espace: true, sansjetons: 2, parcours: "m1e5" });
  assert.equal(f4.url, "https://mathsgo.re/splat/petit/?support=eleve&problem=classic&target=20&splats=mix4&exercise=find_hidden&seed=24310055&grid=3x3&espace=1&sansjetons=2&parcours=m1e5");
  // sans ces réglages, l'adresse ne change pas
  assert.doesNotMatch(adresse({ target: "20", splats: "1", exercise: "find_hidden", seed: "201490" }).url, /jetons/);
});
