/* « Le niveau force-t-il sa notion ? » — outil de conception, pas un test.
 *
 * On retire de la BOÎTE toutes les pièces d'un type donné et on redemande au
 * solveur-étalon s'il existe encore une victoire. S'il en existe une, l'élève peut
 * finir le niveau SANS jamais faire le geste que le niveau prétend enseigner.
 *
 * Règle du lot forêt (SOLEY.md §5) : un niveau-DÉCOUVERTE doit devenir INGAGNABLE
 * quand on retire la pièce de sa notion. Ce n'est pas un avis, c'est ce contrôle.
 *
 * Ce qu'il a trouvé le 15/08 : « Recoller les morceaux » — le niveau qui introduit
 * la lentille — se gagnait sans elle de 196 façons, en 3 pièces. La règle qui
 * décide, vérifiée sur les neuf niveaux de la forêt : un niveau force l'addition
 * si et seulement si au moins une de ses cibles ne peut PAS être obtenue par un
 * seul rayon. Une case qui demande 1/1 quand le soleil vaut 1 n'y arrivera jamais,
 * quel que soit le plateau.
 *
 * Usage : node tests/soley/notion-forcee.mjs <monde> <type-de-piece>
 *   node tests/soley/notion-forcee.mjs foret m      (la lentille dans la forêt)
 *
 * Le budget est volontairement bas (800 000) : on cherche l'EXISTENCE d'une
 * victoire, pas une mesure fine. « aucune victoire » sur un budget atteint ne
 * PROUVE rien — la sortie le dit.
 */
import vm from 'node:vm';
import { createGameContext } from './solveur-etalon.mjs';

const [monde, type] = process.argv.slice(2);
const ctx = createGameContext();
const brut = vm.runInContext(`(() => {
  const out = [];
  const cibles = LV.map((l, i) => ({ i, l })).filter(({ l }) => l.w === ${JSON.stringify(monde)});
  for (const { i, l } of cibles) {
    const sans = l.tools.filter(t => t.t !== ${JSON.stringify(type)});
    if (sans.length === l.tools.length) { out.push({ nom: l.name, concerne: false }); continue; }
    const v = { ...l, tools: sans, sol: [], name: l.name + ' [sans ' + ${JSON.stringify(type)} + ']' };
    delete v.solMin;
    LV.push(v);
    let m = null, err = null;
    try { m = SOLVEUR.mesurer(LV.length - 1, { budget: 800000, libre: false }); }
    catch (e) { err = String(e && e.message || e); }
    LV.pop();
    out.push({ nom: l.name, concerne: true, retirees: l.tools.length - sans.length,
      G: m && m.eclaire.G, E: m && m.eclaire.E, prof: m && m.eclaire.prof,
      debord: m && m.eclaire.debord, err });
  }
  return JSON.stringify(out);
})()`, ctx);

const n = (v) => v == null ? '—' : Number(v).toLocaleString('fr-FR');
console.log(`Monde « ${monde} » — peut-on gagner SANS aucune pièce de type « ${type} » ?\n`);
for (const r of JSON.parse(brut)) {
  if (!r.concerne) { console.log(`   ·  ${r.nom.padEnd(26)} pas de pièce « ${type} » dans sa boîte`); continue; }
  if (r.err) { console.log(`   ?  ${r.nom.padEnd(26)} erreur : ${r.err}`); continue; }
  const gagnable = r.G > 0;
  console.log(`  ${gagnable ? 'NON FORCÉ' : 'forcé    '} ${r.nom.padEnd(26)} ` +
    (gagnable ? `${n(r.G)} victoire(s) sans la pièce, en ${r.prof} pièces` : `aucune victoire sur ${n(r.E)} configurations`) +
    (r.debord ? ' [budget atteint]' : ''));
}
