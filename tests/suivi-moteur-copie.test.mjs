import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

// La page « Ma classe » (suivi.mathsgo.re/prof/) lit les progressions avec le
// moteur de « Mon parcours ». Depuis le lot S2 (30/08/2026), elle ne le charge
// plus depuis mathsgo.re : sa politique de contenu n'accepte aucun script d'un
// autre domaine (un tel script s'exécuterait avec les droits de la session du
// professeur). Une COPIE vit donc dans _serveur/public/prof/, servie par
// suivi.mathsgo.re.
//
// La source unique reste l'appli. Ce test échoue dès que l'une des deux bouge
// sans l'autre : tout lot qui touche defi_tables_mon_parcours.js recopie le
// fichier dans _serveur/public/prof/ ET le met dans son dossier à déposer.
const ORIGINAL = "outils/calcul_mental/defi_tables_mon_parcours.js";
const COPIE = "_serveur/public/prof/defi_tables_mon_parcours.js";

test("le moteur servi par suivi.mathsgo.re est la copie exacte de celui de l'appli", () => {
  const original = readFileSync(join(racine, ORIGINAL));
  const copie = readFileSync(join(racine, COPIE));
  assert.ok(original.length > 1000, `${ORIGINAL} doit être le vrai moteur`);
  assert.ok(
    original.equals(copie),
    `${COPIE} diffère de ${ORIGINAL} (${copie.length} contre ${original.length} octets) : `
      + `recopie le fichier (cp ${ORIGINAL} ${COPIE}) et ajoute-le au dossier à déposer.`
  );
});

test("la page prof charge le moteur d'ici, jamais depuis mathsgo.re", () => {
  const page = readFileSync(join(racine, "_serveur/public/prof/index.php"), "utf8");
  assert.match(page, /<script src="defi_tables_mon_parcours\.js\?v=<\?= /,
    "le <script> du moteur doit être relatif, avec une version qui suit le contenu du fichier");
  assert.doesNotMatch(page, /<script[^>]+src="https?:\/\//,
    "aucun script ne doit être chargé depuis un autre domaine");
});

test("chaque script en ligne des pages du serveur porte le nonce de la politique de contenu", () => {
  for (const chemin of ["_serveur/public/index.php", "_serveur/public/prof/index.php"]) {
    const page = readFileSync(join(racine, chemin), "utf8");
    // Les attributs jusqu'au « > » de la balise — sans s'arrêter au « ?> » de PHP.
    const balises = [...page.matchAll(/<script\b((?:\?>|[^>])*?)>/g)];
    const enLigne = balises.filter(([, attributs]) => !/\bsrc=/.test(attributs));
    assert.ok(enLigne.length >= 1, `${chemin} : au moins un script en ligne`);
    for (const [balise, attributs] of enLigne) {
      assert.match(attributs, /nonce="<\?= htmlspecialchars\(\$nonce, ENT_QUOTES\) \?>"/,
        `${chemin} : ${balise} doit porter le nonce, sinon la politique de contenu le bloque`);
    }
    assert.doesNotMatch(page, /\son[a-z]+="/i, `${chemin} : pas d'attribut on…= (interdit par la politique de contenu)`);
  }
});
