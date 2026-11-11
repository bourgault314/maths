import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Module Attention (vie de classe, 11/11/2026). Deux séances : diaporama (PowerPoint
// et en ligne), fiche à coller, feuille de route. Les vidéos du gorille et du salon ne
// sont pas à nous : elles ne doivent jamais entrer dans le dépôt, la version du site
// les ouvre sur YouTube. Le pensoscope, lui, est à nous et se joue dans la diapo.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");
const DOSSIER = "cps/assets/module-attention";
const page = lire("cps/module-attention.html");
const visionneuse = lire("cps/module-attention-diaporama.html");

function donnees() {
  const m = visionneuse.match(/const SEANCES = (\{.*?\});\n/s);
  assert.ok(m, "les données des séances sont dans la page du diaporama");
  return JSON.parse(m[1]);
}

test("la page propose les six fichiers et le ZIP, et ils existent", () => {
  for (const n of [1, 2]) {
    for (const nom of [`Attention-seance-${n}.pptx`, `Attention-seance-${n}-fiche-a-coller.pdf`, `Attention-seance-${n}-feuille-de-route.pdf`]) {
      assert.ok(page.includes(`assets/module-attention/${nom}`), `${nom} est proposé sur la page`);
      assert.ok(existsSync(join(racine, DOSSIER, nom)), `${nom} existe`);
    }
    assert.ok(page.includes(`module-attention-diaporama.html?seance=${n}`), `séance ${n} : bouton Projeter`);
  }
  assert.ok(existsSync(join(racine, DOSSIER, "module-attention.zip")));
  for (const img of page.matchAll(/src="(assets\/module-attention\/[^"]+)"/g)) {
    assert.ok(existsSync(join(racine, "cps", img[1])), img[1]);
  }
});

test("aucune vidéo sous droits dans le dépôt", () => {
  const trouvees = [];
  (function parcourir(dossier) {
    for (const nom of readdirSync(join(racine, dossier))) {
      const chemin = join(dossier, nom);
      if (statSync(join(racine, chemin)).isDirectory()) parcourir(chemin);
      else if (/video_(singes|salon)|cover_(gorille|salon)\.png/.test(nom)) trouvees.push(chemin);
    }
  })(DOSSIER);
  for (const dossier of ["_sources/module-attention"]) {
    (function parcourir(d) {
      for (const nom of readdirSync(join(racine, d))) {
        const chemin = join(d, nom);
        if (statSync(join(racine, chemin)).isDirectory()) parcourir(chemin);
        else if (/video_(singes|salon)|cover_(gorille|salon)\.png/.test(nom)) trouvees.push(chemin);
      }
    })(dossier);
  }
  assert.deepEqual(trouvees, []);
});

test("le diaporama en ligne a une image par diapo, et ses vidéos tombent sur les bonnes diapos", () => {
  const d = donnees();
  assert.equal(d[1].count, 37);
  assert.equal(d[2].count, 36);
  for (const n of [1, 2]) {
    const images = readdirSync(join(racine, DOSSIER, "diapos", "s" + n)).filter((f) => f.endsWith(".webp")).sort();
    assert.equal(images.length, d[n].count, `séance ${n} : autant d'images que de diapos`);
    assert.equal(images[0], "01.webp");
    assert.equal(d[n].notes.length, d[n].count, `séance ${n} : une note (même vide) par diapo`);
    for (const m of d[n].media) {
      assert.ok(m.slide >= 0 && m.slide < d[n].count);
      if (m.type === "youtube") assert.match(m.url, /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/);
      else assert.ok(existsSync(join(racine, DOSSIER, m.src)), m.src);
    }
  }
  assert.deepEqual(d[1].media.map((m) => m.type), ["youtube"]);
  assert.deepEqual(d[2].media.map((m) => m.type), ["youtube", "video", "video"]);
});

test("le diaporama en ligne n'est pas indexé et ses liens YouTube s'ouvrent à part", () => {
  assert.match(visionneuse, /<meta name="robots" content="noindex, follow">/);
  assert.match(visionneuse, /el\.target = '_blank'; el\.rel = 'noopener';/);
  assert.match(visionneuse, /href="module-attention\.html"/, "retour vers la page du module");
});

test("le catalogue range le module dans Vie de classe › Compétences psychosociales", () => {
  const data = lire("assets/js/catalogue-refonte-data.js");
  assert.match(data, /"cps\/module-attention\.html": \{\s*"primaryNotion": "competences-psychosociales"/);
  assert.match(data, /"id": "cps-module-attention-html"/);
  const outils = JSON.parse(lire("assets/data/catalogue-outils.json"));
  assert.ok(JSON.stringify(outils).includes('"cps/module-attention.html"'), "catalogue-outils.json");
});
