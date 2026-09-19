import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* Le cadre de la case active (pavé tactile et focus clavier) est dessiné DANS la case par
   une ombre intérieure, pas par un « outline » décalé : un outline à −4 px recouvrait le
   trait noir droit de la case (border-right) et laissait le trait gauche (celui de la case
   voisine) apparent → cadre visiblement décalé (vu par Gwenaël sur iPhone, 19/09). */
const classique = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const petit = await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");

test("Splat classique : cadre de la case active en ombre intérieure, plus aucun outline décalé", () => {
  assert.match(classique, /\.eleveCase:focus-within\{box-shadow:inset 0 0 0 3px #60a5fa\}/);
  assert.match(classique, /body\.eleve-pave \.eleveCase\.mg-pave-case-active\{box-shadow:inset 0 0 0 4px #2563eb, inset 0 0 0 999px rgba\(37,99,235,\.08\)\}/);
  assert.doesNotMatch(classique, /\.eleveCase[^{]*\{[^}]*outline-offset/);
  // les traits entre cases restent des border-right de 3 px, visibles des deux côtés du cadre
  assert.match(classique, /\.eleveCase\{[^}]*border-right:3px solid #000/);
});

test("Petit SPLAT! : même correction, y compris la case du total", () => {
  assert.match(petit, /\.eleve-case:focus-within \{ box-shadow: inset 0 0 0 3px #60a5fa; \}/);
  assert.match(petit, /body\.eleve-pave \.eleve-case\.mg-pave-case-active \{ box-shadow: inset 0 0 0 4px var\(--accent\), inset 0 0 0 999px rgba\(37, 99, 235, \.08\); \}/);
  assert.match(petit, /body\.eleve-pave \.total-badge\.eleve-case\.mg-pave-case-active \{ box-shadow: inset 0 0 0 3px var\(--accent\), inset 0 0 0 999px rgba\(37, 99, 235, \.08\); \}/);
  assert.doesNotMatch(petit, /\.eleve-case[^{]*\{[^}]*outline-offset/);
});

/* Une case rouge (réponse fausse) a son rouge peint par le CHAMP, qui remplit toute la case :
   il passait par-dessus l'ombre intérieure et le cadre disparaissait — juste après une erreur,
   et quand l'élève touche une case rouge pour la corriger. Le rouge passe donc dans l'ombre,
   sous le cadre, avec la même couleur que le champ. */
test("case rouge ET active : le cadre reste visible, le rouge ne change pas", () => {
  assert.match(classique, /\.eleveCase\.ko input\.eleveChamp\{background:#fee2e2;color:#b91c1c\}/);
  assert.match(classique, /\.eleveCase\.ko:focus-within\{box-shadow:inset 0 0 0 3px #60a5fa, inset 0 0 0 999px #fee2e2\}/);
  assert.match(classique, /\.eleveCase\.ko:focus-within input\.eleveChamp\{background:transparent\}/);
  assert.match(classique, /body\.eleve-pave \.eleveCase\.ko\.mg-pave-case-active\{box-shadow:inset 0 0 0 4px #2563eb, inset 0 0 0 999px #fee2e2\}/);
  assert.match(classique, /body\.eleve-pave \.eleveCase\.ko\.mg-pave-case-active input\.eleveChamp\{background:transparent\}/);

  assert.match(petit, /\.row-top\.eleve-ko \.eleve-input, \.part-box\.eleve-ko \.eleve-input \{ background: #fee2e2; color: #b91c1c; \}/);
  assert.match(petit, /\.total-badge\.eleve-ko \.eleve-input \{ background: #fee2e2; color: #b91c1c; \}/);
  assert.match(petit, /\.eleve-case\.eleve-ko:focus-within \{ box-shadow: inset 0 0 0 3px #60a5fa, inset 0 0 0 999px #fee2e2; \}/);
  assert.match(petit, /\.eleve-case\.eleve-ko:focus-within \.eleve-input \{ background: transparent; \}/);
  assert.match(petit, /body\.eleve-pave \.eleve-case\.eleve-ko\.mg-pave-case-active \{ box-shadow: inset 0 0 0 4px var\(--accent\), inset 0 0 0 999px #fee2e2; \}/);
  assert.match(petit, /body\.eleve-pave \.total-badge\.eleve-case\.eleve-ko\.mg-pave-case-active \{ box-shadow: inset 0 0 0 3px var\(--accent\), inset 0 0 0 999px #fee2e2; \}/);
  assert.match(petit, /body\.eleve-pave \.eleve-case\.eleve-ko\.mg-pave-case-active \.eleve-input \{ background: transparent; \}/);
});
