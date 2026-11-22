// Anzan, lot « anzan-cartes » (07/11/2026) : les cartes des grades — une par
// kyu, du 20e au 1er (les images de Gwenaël et leurs dos), puis (lot
// « anzan-dan », même jour) une par dan, du 1er au 20e. Ici, les données
// et les fichiers ; la page elle-même est jouée dans
// tests/flash-anzan-seance.test.mjs (fin d'un passage, collection, fiche).

import assert from "node:assert/strict";
import {existsSync, readFileSync, statSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/flash_anzan_core.js");
const DOSSIER = new URL("../outils/calcul_mental/", import.meta.url);

const NOMS = ["Kaeru", "Usagi", "Suzume", "Tombo", "Kame", "Akabeko", "Shika", "Inoshishi", "Yatagarasu",
  "Kitsune", "Tanuki", "Maneki-neko", "Koinobori", "Fukurō", "Tsuru", "Ryū", "Hō-ō", "Baku", "Shisa", "Kirin"];

const NOMS_DAN = ["Kuma", "Taka", "Kamaitachi", "Namazu", "Shachihoko", "Shishi", "Ōkami", "Raijū", "Ryūme", "Hakutaku",
  "Genbu", "Byakko", "Suzaku", "Seiryū", "Kyūbi", "Kujaku", "Takarabune", "Fujisan", "Hakuryū", "Ōryū"];

test("vingt cartes, du 20e au 1er kyu, dans l'ordre des grades", () => {
  assert.equal(CORE.CARTES_KYU.length, 20);
  assert.deepEqual(CORE.CARTES_KYU.map(c => c.kyu), Array.from({length: 20}, (_, i) => 20 - i));
  assert.deepEqual(CORE.CARTES_KYU.map(c => c.nom), NOMS, "les noms écrits comme sur les cartes");
  for (let n = 1; n <= 20; n += 1) {
    const c = CORE.carteDuGrade(n);
    assert.equal(`${c.kyu}${c.kyu === 1 ? "er" : "e"} kyu`, CORE.nomGrade(n), "le grade n a la carte de son kyu");
  }
  for (const n of [0, 41, 1.5, "3", null]) assert.equal(CORE.carteDuGrade(n), null, String(n));
  assert.ok(Object.isFrozen(CORE.CARTES_KYU) && Object.isFrozen(CORE.CARTES_KYU[0]) && Object.isFrozen(CORE.CARTES_KYU[0].proverbe));
});

test("cartes dan (07/11/2026) : vingt cartes, du 1er au 20e dan, après les kyu ; 40 cartes en tout, une par grade", () => {
  assert.equal(CORE.CARTES_DAN.length, 20);
  assert.deepEqual(CORE.CARTES_DAN.map(c => c.dan), Array.from({length: 20}, (_, i) => i + 1));
  assert.deepEqual(CORE.CARTES_DAN.map(c => c.nom), NOMS_DAN, "les noms écrits comme sur les cartes");
  assert.equal(CORE.CARTES.length, CORE.NB_GRADES);
  for (let n = 21; n <= 40; n += 1) {
    const c = CORE.carteDuGrade(n);
    assert.equal(`${c.dan}${c.dan === 1 ? "er" : "e"} dan`, CORE.nomGrade(n), "le grade n a la carte de son dan");
    assert.equal(CORE.nomCarte(c), `${c.dan}${c.dan === 1 ? "er" : "e"}\u00a0Dan`);
  }
  assert.equal(CORE.nomCarte(CORE.carteDuGrade(1)), "20e\u00a0Kyu");
  assert.deepEqual([CORE.carteDuGrade(3).largeur, CORE.carteDuGrade(3).hauteur], [640, 904]);
  assert.deepEqual([CORE.carteDuGrade(21).largeur, CORE.carteDuGrade(21).hauteur], [640, 984], "le timbre doré est plus haut : sa propre taille");
  assert.ok(Object.isFrozen(CORE.CARTES_DAN) && Object.isFrozen(CORE.CARTES_DAN[0]) && Object.isFrozen(CORE.CARTES_DAN[0].proverbe));
  // Un vrai proverbe par carte, jamais deux fois sur les 40.
  const proverbes = CORE.CARTES.map(c => c.proverbe.japonais);
  assert.equal(new Set(proverbes).size, 40);
});

test("chaque carte a son image (webp de 640 × 904, recadrée sur le timbre, moins de 120 ko) et sa vignette (160 × 226, moins de 16 ko)", () => {
  const taille = buf => {
    // En-tête VP8X d'un webp : largeur et hauteur - 1 sur 24 bits.
    assert.equal(buf.toString("ascii", 0, 4), "RIFF");
    assert.equal(buf.toString("ascii", 8, 12), "WEBP");
    const morceau = buf.toString("ascii", 12, 16);
    if (morceau === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
    if (morceau === "VP8X") return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
    throw new Error(`format webp inattendu : ${morceau}`);
  };
  const vues = new Set();
  for (const c of CORE.CARTES) {
    const dan = Boolean(c.dan);
    for (const [chemin, l, h, max] of [[c.image, 640, dan ? 984 : 904, dan ? 130 : 120], [c.vignette, 160, dan ? 246 : 226, 16]]) {
      assert.match(chemin, /^\.\/anzan-cartes\/(kyu|dan)\d\d-[a-z-]+(-vignette)?\.webp$/);
      assert.ok(!vues.has(chemin), `une image par carte : ${chemin}`);
      vues.add(chemin);
      const url = new URL(chemin, DOSSIER);
      assert.ok(existsSync(url), chemin);
      assert.deepEqual(taille(readFileSync(url)), [l, h], chemin);
      assert.ok(statSync(url).size < max * 1024, `${chemin} : ${statSync(url).size} octets`);
    }
    assert.ok(c.image.includes(dan ? `dan${String(c.dan).padStart(2, "0")}-` : `kyu${String(c.kyu).padStart(2, "0")}-`), c.image);
  }
});

test("le dos : la créature, le message (qui nomme son grade), le proverbe en japonais, sa lecture et sa traduction", () => {
  for (const c of CORE.CARTES) {
    const grade = CORE.nomCarte(c); // insécable : « 8e » ne finit pas une ligne
    assert.ok(c.creature.length > 60, c.nom);
    assert.ok(c.message.includes(grade), `${c.nom} : le message dit « ${grade} »`);
    assert.match(c.proverbe.japonais, /^[　-ヿ一-鿿、，]+$/u, `${c.nom} : le proverbe en japonais`);
    assert.match(c.proverbe.lecture, /^[a-zāēīōū ,]+$/, `${c.nom} : la lecture en lettres latines`);
    assert.ok(c.proverbe.francais.length > 10, c.nom);
    for (const t of [c.creature, c.message, c.proverbe.francais, c.proverbe.idee || "", c.sens]) {
      assert.doesNotMatch(t, /'/, `${c.nom} : apostrophe typographique`);
      assert.doesNotMatch(t, / [:;!?»]|« /, `${c.nom} : espace insécable dans la ponctuation française`);
    }
  }
  // Relecture des images définitives (07/11/2026) : ce qui n'est pas sur la
  // carte n'est pas cité au dos ; ce qui y est (et compte) est dit.
  const carte = nom => CORE.CARTES_KYU.find(c => c.nom === nom);
  assert.doesNotMatch(carte("Kaeru").creature, /lotus|hasu/i, "Kaeru : un nénuphar, pas de lotus");
  assert.match(carte("Hō-ō").creature, /kiri \(paulownia\)/);
  assert.match(carte("Baku").creature, /夢 \(yume\)/);
  assert.match(carte("Yatagarasu").creature, /trois pattes/);
  assert.match(carte("Tsuru").creature, /origami/);
  // Les dan, relus image par image (07/11/2026) : l'élément japonais qu'on
  // voit sur chaque carte est expliqué au dos.
  const dan = nom => CORE.CARTES_DAN.find(c => c.nom === nom);
  assert.match(dan("Kyūbi").creature, /neuf/, "les neuf queues");
  assert.match(dan("Kyūbi").creature, /fuji \(glycine\)/);
  assert.match(dan("Kujaku").creature, /glycine/i);
  assert.match(dan("Seiryū").creature, /cerisier|sakura/i);
  assert.match(dan("Ōryū").creature, /quatre gardiens/);
  assert.match(dan("Takarabune").creature, /宝/);
  assert.match(dan("Taka").creature, /aubergine/);
});

test("la page charge le moteur qui porte les cartes sous une nouvelle version (un navigateur qui a l'ancien en cache le recharge)", () => {
  const page = readFileSync(new URL("flash_anzan.html", DOSSIER), "utf8");
  assert.match(page, /<script src="\.\/flash_anzan_core\.js\?v=20261122-2"><\/script>/);
});
