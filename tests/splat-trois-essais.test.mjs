/* SPLAT! — « 3 essais, puis la réponse » (05/10/2026, Gwenaël), mondes 1 à 4.
   - À la 3e erreur, la réponse s'écrit tout de suite dans les cases, la carte devient rouge
     (à rejouer à la fin) ; plus de bouton « Voir la réponse » ni « Voir la correction » à côté
     d'un Valider. L'Enquête et le Système proposent ensuite « Voir la correction », comme après
     une réponse juste.
   - Une carte finie (juste, ou réponse écrite) n'a plus de Valider : il restait éteint à côté de
     « Carte suivante » aux mondes 1 et 2, sur ordinateur.
   - Une seule phrase pour les deux outils : « Voilà la réponse. Tu rejoueras cette carte à la fin. »
   - Enquête et Système, ordinateur : la place de la correction est prise dès l'arrivée de la carte
     (le plateau ne grossit plus au moment de la réponse), sauf avec le pavé.
   Les mondes 5 et 6 (equasplat.html) n'ont pas de Valider : rien n'y change. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const splat = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const petit = await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");

/* le texte d'une fonction de premier niveau (splat.html : « }\n » ; Petit SPLAT! : idem) */
function fn(source, nom){
  const debut = source.indexOf(`\nfunction ${nom}(`);
  assert.notEqual(debut, -1, `${nom} introuvable`);
  return source.slice(debut + 1, source.indexOf("\n}\n", debut) + 3);
}

test("monde 1 (Petit SPLAT!) : à la 3e erreur, la réponse s'écrit ; plus de « Voir la réponse »", () => {
  const v = fn(petit, "eleveValider");
  const faux = v.slice(v.indexOf("} else {"));
  assert.match(faux, /eleveEchecs\+\+;\n[\s\S]*?if \(eleveEchecs >= ELEVE_ECHECS_MAX\) \{ eleveMontrerReponse\(main\); return; \}/);
  assert.ok(faux.indexOf("eleveMontrerReponse(main)") < faux.indexOf("const badgeVide"), "avant les messages des 1re et 2e erreurs");
  assert.doesNotMatch(petit, /eleveVoir|eleve-secondaire/, "ni bouton ni style d'un « Voir la réponse »");
  assert.match(petit, /const ELEVE_ECHECS_MAX = 3,/);
});

test("monde 1 : une carte finie n'a plus de Valider (caché, pas retiré : la validation et le pavé le lisent)", () => {
  const v = fn(petit, "eleveValider");
  const juste = v.slice(v.indexOf("if (toutJuste) {"), v.indexOf("} else {"));
  assert.match(juste, /bouton\.disabled = true;\n[\s\S]*?bouton\.hidden = true;/);
  const r = fn(petit, "eleveMontrerReponse");
  assert.match(r, /bouton\.disabled = true;\n\s+bouton\.hidden = true;/);
  assert.match(r, /eleveResultats\[eleveIdx\] = 'ko';/, "la carte reste rouge, à rejouer");
  assert.match(v, /if \(!bouton \|\| bouton\.disabled\) return;/, "un Valider caché ne revalide pas");
});

test("une seule phrase dans les deux outils : « Voilà la réponse. Tu rejoueras cette carte à la fin. »", () => {
  assert.match(fn(petit, "eleveMontrerReponse"), /let texte = 'Voil\\u00e0 la r\\u00e9ponse\. Tu rejoueras cette carte \\u00e0 la fin\.';/);
  assert.match(fn(petit, "eleveMontrerReponse"), /Il fallait \$\{item\.visible\} jeton\$\{item\.visible > 1 \? 's' : ''\}\. Tu rejoueras cette carte \\u00e0 la fin\./);
  assert.match(fn(splat, "eleveMontrerReponse"), /msg\.textContent = "Voil\\u00e0 la r\\u00e9ponse\. Tu rejoueras cette carte \\u00e0 la fin\.";/);
  for (const ancien of ["tu la rejoueras", "tu pourras rejouer cette carte", "ou regarde la correction"]) {
    assert.ok(!petit.includes(ancien) && !splat.includes(ancien), `plus de « ${ancien} »`);
  }
});

test("mondes 2 à 4 (splat.html) : la 3e erreur écrit la réponse, puis le chemin d'une carte juste", () => {
  const v = fn(splat, "eleveValiderSplat");
  assert.match(v, /if\(eleveEchecs >= ELEVE_ECHECS_MAX\)\{ eleveMontrerReponse\(\); return; \}/);
  const r = fn(splat, "eleveMontrerReponse");
  // « Voir la correction » (Enquête, Système) puis « Carte suivante », comme après une réponse juste
  assert.ok(r.indexOf("eleveProposerSchema(bouton)") < r.indexOf('suivant.textContent = "Carte suivante \\u25b6"'));
  const juste = v.slice(v.indexOf("if(toutJuste){"), v.indexOf("}else{"));
  assert.ok(juste.indexOf("eleveProposerSchema(bouton)") < juste.indexOf('suivant.textContent = "Carte suivante \\u25b6"'));
});

test("Enquête et Système, ordinateur : la place de la correction est prise dès l'arrivée de la carte, pas avec le pavé", () => {
  const r = fn(splat, "renderEleveSplat");
  assert.match(r, /document\.getElementById\("eleveValider"\)\.onclick = eleveValiderSplat;\n[\s\S]*?if\(!pave && enquete && eleveCorrectionPasAPas\(card\)\) eleveSchemaReserverOrdinateur\(card\);\n\}\n$/);
  // au téléphone, la fonction ne fait rien (le téléphone a sa propre réserve)
  assert.match(fn(splat, "eleveSchemaReserverOrdinateur"), /if\(!plateau \|\| !card \|\| eleveSchemaTelephone\(\)\) return;/);
  // elle ne fait que grandir le plateau : la seconde réservation (à la réponse) ne change rien
  assert.match(fn(splat, "eleveSchemaReserverOrdinateur"), /if\(cible > r\.height\)\{ plateau\.style\.height = cible \+ "px"; plateau\.style\.minHeight = cible \+ "px"; \}/);
});
