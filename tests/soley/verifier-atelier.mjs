// Preuve d'intégrité du lot « L'atelier Solèy » (SPEC-ATELIER-NIVEAUX.md §8.2).
//
//   node tests/soley/verifier-atelier.mjs [ref-git-d-avant-le-lot]
//
// L'invariant central du lot est qu'il est PUREMENT ADDITIF : le jeu ne bouge
// pas d'un octet. Ce vérificateur le prouve en comparant, contre une référence
// git, les six fichiers du jeu, et en listant ce qui a été ajouté.
//
// Référence par défaut : b05205ce (main au moment du lot). Outil de migration :
// il documente CE lot ; une évolution ultérieure du jeu le fera échouer
// légitimement (d'où : pas *.test.mjs, comme verifier-lot-canne.mjs).
//
// MORT LE 15/08/2026, comme prévu (SOLEY.md §6, décision 9 : outils de
// migration morts = archives datées, en place). La PR #369 « Des niveaux qui
// résistent » a modifié `levels.js` (11 niveaux redessinés) et `render.js`
// (badge des fruits peint après les rayons) : les trois contrôles d'octets
// échouent donc désormais, à juste titre. Les autres restent parlants (48
// identifiants, noindex, ordre du rideau de sauvegarde, clé du jeu jamais
// nommée dans atelier.js) et se relancent tels quels.
// Le garde-fou VIVANT du lot, lui, est ailleurs : la batterie de l'atelier
// (tests/soley/test_atelier.py) et le diff de chaque PR.
//
// Lecture normalisée en LF des deux côtés : un poste Windows a des copies de
// travail en CRLF, ce qui ferait échouer une comparaison d'octets bruts.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "b05205ce";

const INTOUCHABLES = [
  "outils/club_maths/soley.html",
  "outils/club_maths/soley/css/soley.css",
  "outils/club_maths/soley/js/levels.js",
  "outils/club_maths/soley/js/engine.js",
  "outils/club_maths/soley/js/render.js",
  "outils/club_maths/soley/js/ui.js"
];
const AJOUTS = [
  "outils/club_maths/soley-atelier.html",
  "outils/club_maths/soley/js/atelier.js"
];

const lf = (t) => t.replace(/\r\n/g, "\n");
const sha = (t) => createHash("sha256").update(t, "utf8").digest("hex").slice(0, 12);
const duDepot = (chemin) =>
  lf(execFileSync("git", ["show", `${REF}:${chemin}`], { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 }));
const duDisque = (chemin) => lf(readFileSync(resolve(racine, chemin), "utf8"));

const echecs = [];
const dire = (ok, texte, detail) => {
  console.log(`[${ok ? "PASS" : "FAIL"}] ${texte}${detail ? " — " + detail : ""}`);
  if (!ok) echecs.push(texte);
};

console.log(`Référence git : ${REF}\n`);

// 1. Les six fichiers du jeu, identiques à l'octet.
for (const chemin of INTOUCHABLES) {
  const avant = duDepot(chemin), apres = duDisque(chemin);
  dire(avant === apres, `intact : ${chemin}`,
    avant === apres ? `${apres.length} octets, sha ${sha(apres)}`
                    : `AVANT ${avant.length} octets / APRÈS ${apres.length} octets`);
}

// 2. Les deux fichiers du lot existent et sont bien NOUVEAUX.
for (const chemin of AJOUTS) {
  dire(existsSync(resolve(racine, chemin)), `ajouté : ${chemin}`);
  let existaitAvant = true;
  try {
    execFileSync("git", ["cat-file", "-e", `${REF}:${chemin}`], { cwd: racine, stdio: "ignore" });
  } catch (e) { existaitAvant = false; }
  dire(!existaitAvant, `nouveau (absent de ${REF}) : ${chemin}`);
}

// 3. Rien d'AUTRE n'a bougé sous outils/club_maths/ : c'est le contrôle qui
//    attrape un fichier oublié, un renommage ou une retouche de côté.
const diff = execFileSync(
  "git", ["diff", "--name-status", REF, "--", "outils/club_maths/"],
  { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 }
).trim();
const lignes = diff ? diff.split(/\n/).map((l) => l.split(/\t/)) : [];
const inattendues = lignes.filter(([etat, chemin]) => !(etat === "A" && AJOUTS.includes(chemin)));
dire(inattendues.length === 0,
  "aucune autre modification sous outils/club_maths/",
  lignes.length ? lignes.map(([e, c]) => `${e} ${c}`).join(" ; ") : "aucun changement");

// 4. Le garde-fou de la sauvegarde tient aussi à la lecture du code : atelier.js
//    ne doit jamais nommer la clé du jeu, c'est le rideau de la page qui agit.
const atelier = duDisque("outils/club_maths/soley/js/atelier.js");
dire(!/['"`]soley-save-v5['"`]/.test(atelier),
  "atelier.js ne manipule jamais la clé « soley-save-v5 » (la citer en commentaire est permis)");
dire(atelier.includes("soley-atelier-v1"),
  "atelier.js utilise bien sa propre clé de brouillons");

// 5. La page est hors des radars et déclare son icône (les deux contrôles de CI
//    qui s'appliquent à toute nouvelle page du dépôt).
const page = duDisque("outils/club_maths/soley-atelier.html");
dire(/<meta name="robots" content="noindex, follow">/.test(page),
  "la page porte le noindex exigé pour toute page hors catalogue");
dire(page.includes('<link rel="icon" href="/favicon.ico" sizes="48x48">') &&
     page.includes('<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">'),
  "la page déclare le bloc d'icônes canonique");
const sitemap = duDisque("sitemap.xml");
dire(!sitemap.includes("soley-atelier"),
  "la page est absente du sitemap");

// 6. La page charge le rideau AVANT les quatre scripts du jeu : si cet ordre
//    s'inverse un jour, la sauvegarde de Gwenaël est lue au chargement.
const posRideau = page.indexOf("Storage.prototype.getItem");
const posLevels = page.indexOf('<script src="soley/js/levels.js">');
const posAtelier = page.indexOf('<script src="soley/js/atelier.js">');
dire(posRideau > 0 && posLevels > posRideau,
  "le rideau de sauvegarde est posé AVANT les scripts du jeu",
  `rideau à ${posRideau}, levels.js à ${posLevels}`);
dire(posAtelier > posLevels,
  "atelier.js est chargé APRÈS les quatre modules du jeu");

// 7. Les 48 identifiants réclamés par les modules sont tous fournis par la page.
const idsReclames = new Set();
for (const chemin of INTOUCHABLES.filter((c) => c.endsWith(".js"))) {
  const src = duDisque(chemin);
  for (const m of src.matchAll(/getElementById\(\s*['"]([^'"]+)['"]/g)) idsReclames.add(m[1]);
}
const idsFournis = new Set([...page.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]));
// cpredirebtn est construit à la volée par engine.js, il n'a pas à figurer dans la page.
const manquants = [...idsReclames].filter((id) => !idsFournis.has(id) && id !== "cpredirebtn");
dire(manquants.length === 0,
  `la page fournit les ${idsReclames.size} identifiants réclamés par les modules`,
  manquants.length ? "manquants : " + manquants.join(", ") : "aucun manquant");

console.log();
if (echecs.length) {
  console.log(`ÉCHEC : ${echecs.length} contrôle(s) en défaut.`);
  process.exit(1);
}
console.log(`TOUT EST VERT — ${INTOUCHABLES.length} fichiers du jeu intacts, ${AJOUTS.length} fichiers ajoutés.`);
