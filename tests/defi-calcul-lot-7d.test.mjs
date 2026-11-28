// Défi calcul, lot 7d « Les derniers modules » (18/11/2026) : M11 « Quotient
// et reste », A9 « Regrouper pour calculer », C4 « Remonter un calcul », M9
// « Distributivité : retrancher » — 8 compétences ; les 125 sont construites.
// Choix de Gwenaël du 18/11 (questions à choix, planches du lot) : la barre
// en parts et le reste (M11), les flèches à l'envers (C4), le rectangle dont
// on retire une bande (M9), le dessin seul (A9). Décisions du lot : M11 au
// CM1 (les deux niveaux) ; un produit par 9, 19, 98 ou 99 n'est jamais dans
// « Distributivité : décomposer ».
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

const espaces = t => String(t).replace(/[\u202f\u00a0]/g, " ");
const NIVEAUX = ["M11-1", "M11-2", "A9-1", "A9-2", "C4-1", "C4-2", "M9-1", "M9-2"];
const TOUS = new Map();
function tous(cle) {
  if (TOUS.has(cle)) return TOUS.get(cle);
  const vus = new Map();
  const {niveau} = CORE.niveauDe(cle);
  for (let graine = 1; graine <= 150; graine += 1) niveau.composer(CORE.mulberry32(graine * 7919 + 3), 80, []).forEach(c => vus.set(c.cle, c));
  niveau.imposes.forEach(c => vus.set(c.cle, c));
  const liste = [...vus.values()];
  TOUS.set(cle, liste);
  return liste;
}
const textesSvg = svg => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => espaces(m[1]));
const ariaDe = svg => espaces((svg.match(/aria-label="([^"]*)"/) || [, ""])[1]);
const ecrite = n => espaces(CORE.formaterNombre(n));
// Le calcul d'un texte, la case remplacée par la réponse : les deux côtés égaux.
function verifie(calcul) {
  const t = espaces(calcul.texte).replace("□", `(${calcul.reponse})`).replace(/ (\d{3})/g, "$1").replace(/(\d),(\d)/g, "$1.$2").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  const [g, d] = t.split("=");
  return Math.abs(Function(`return ${g}`)() - Function(`return ${d}`)()) < 1e-9;
}

test("lot 7d : 8 compétences construites ; les 125 de la carte le sont ; M11 au CM1", () => {
  // (Lot K1b : six étages — le CM1 est l'étage 4, le CM2 le 5, « vers la 6e » le 6.)
  const paliers = {"M11-1": 4, "M11-2": 4, "A9-1": 5, "A9-2": 6, "C4-1": 5, "C4-2": 5, "M9-1": 6, "M9-2": 6};
  NIVEAUX.forEach(cle => {
    const t = CORE.niveauDe(cle);
    assert.ok(t && t.module.construit && t.niveau.apprends, cle);
    assert.equal(t.niveau.palier, paliers[cle], cle);
    assert.equal(t.niveau.type, "P", cle);
  });
  const carte = CORE.carte();
  // (Lot 6 « programmes 2 » : 127 — F9-1 aux bases, F6-2 au CM1.)
  assert.equal(carte.modules.filter(m => m.construit && m.niveaux).reduce((s, m) => s + m.niveaux, 0), 163); // (lot « la 6e complète » : 151 construits et les 12 niveaux encore réservés des modules ouverts — D10 1, D11 2, D12 1, D14 2, F10 2, P1 2, P2 2) // (lot K1b : neuf de plus, 132 avant)
  assert.equal(P.parcoursConstruit(carte).length, 151);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(p => P.parcoursConstruit(carte).filter(c => P.palierDe(carte, c.module, c.niveau) === p).length), [14, 20, 19, 33, 43, 22]);
  // M11 : juste avant « Diviser en décomposant » (un module et son voisin se suivent).
  const o = [...CORE.ORDRE];
  assert.ok(o.indexOf("M11-1") < o.indexOf("M12-1") && o.indexOf("M12-1") < o.indexOf("M11-2") && o.indexOf("M11-2") < o.indexOf("F9-2"));
});

const SORTES_7D = {
  "M11-1": ["le reste", "le reste nul", "le quotient"], "M11-2": ["le reste", "le reste nul", "le quotient"],
  "A9-1": ["trois nombres", "quatre nombres"], "A9-2": ["trois nombres", "quatre nombres"],
  "C4-1": ["× puis −", "× puis +", "+ puis ×", "÷ puis +"], "C4-2": ["× puis +", "× puis −", "+ puis ×"],
  "M9-1": ["× 9", "× 19"], "M9-2": ["× 99", "× 98"]
};
test("lot 7d : chaque calcul est juste, chaque sorte est tirée, 2 à 4 sortes", () => {
  NIVEAUX.forEach(cle => {
    const liste = tous(cle);
    liste.forEach(c => assert.ok(verifie(c), `${cle} : ${c.texte} = ${c.reponse}`));
    const sortes = CORE.sortesDe(cle);
    assert.ok(sortes.length >= 2 && sortes.length <= 4, cle);
    assert.deepEqual(sortes.map(s => s.nom), SORTES_7D[cle], `${cle} : ses sortes`);
    // Tirées par le niveau lui-même, sans compter ses imposés.
    const tires = CORE.niveauDe(cle).niveau.composer(CORE.mulberry32(17), 80, []);
    sortes.forEach(s => assert.ok(tires.some(c => CORE.sorteDe(c) === s.n), `${cle} : la sorte « ${s.nom} » est tirée`));
    // Les imposés couvrent deux sortes différentes.
    const imposes = CORE.niveauDe(cle).niveau.imposes;
    assert.equal(new Set(imposes.map(c => CORE.sorteDe(c))).size, imposes.length, `${cle} : imposés de sortes différentes`);
  });
});

test("lot 7d : les bornes (rapport de Codex du 14/11)", () => {
  // M11 : n = q × d + r, 0 ≤ r < d ; paquets de 2 à 5, puis de 6 à 9 ; 2 à 9 parts.
  ["M11-1", "M11-2"].forEach((cle, i) => tous(cle).forEach(c => {
    const {n, q, d, r} = c.donnees;
    assert.ok(n === q * d + r && r >= 0 && r < d && q >= 2 && q <= 9, c.texte);
    assert.ok(i ? d >= 6 && d <= 9 : d >= 2 && d <= 5, c.texte);
    assert.equal(c.forme === "reste-nul", r === 0, c.texte);
    // Le diviseur à droite du « × » (exemples de réussite CM1, p. 11).
    assert.match(espaces(c.texte), new RegExp(`× ${d} \\+`), c.texte);
  }));
  // La seule réponse 0 de l'appli : le reste nul. (Lot 6 « programmes 2 » :
  // et les × 0 des tables, M4-1.)
  CORE.MODULES.filter(m => m.construit).forEach(m => m.niveaux.forEach(n => {
    if (m.id === "M11" || `${m.id}-${n.n}` === "M4-1") return;
    const serie = CORE.genererSerie(`${m.id}-${n.n}`, {graine: 4});
    assert.ok(serie.every(c => c.reponse !== 0), `${m.id}-${n.n}`);
  }));
  // A9 : trois ou quatre nombres ; chaque paire fait un compte rond, aucun autre.
  tous("A9-1").forEach(c => {
    assert.ok(c.donnees.termes.every(Number.isInteger), c.texte);
    assert.ok(c.donnees.groupes[0] === 100 && c.donnees.groupes.every(g => g % 10 === 0), c.texte);
    assert.ok(c.donnees.termes.length === 3 || c.donnees.paires.length === 2, c.texte);
  });
  tous("A9-2").forEach(c => {
    assert.ok(c.donnees.termes.some(t => !Number.isInteger(t)) && c.donnees.termes.every(t => CORE.decimalesDe(t) <= 1), c.texte);
    assert.ok(c.donnees.groupes.every(Number.isInteger), c.texte);
  });
  ["A9-1", "A9-2"].forEach(cle => tous(cle).forEach(c => {
    const [i, j] = c.donnees.paires[0];
    assert.ok(!(i === 0 && j === 1), `${c.texte} : jamais deux termes voisins au début`);
  }));
  // C4 : deux opérations ; réponse entière au niveau 1, décimale au niveau 2.
  tous("C4-1").forEach(c => assert.ok(Number.isInteger(c.reponse) && c.reponse > 0, c.texte));
  tous("C4-2").forEach(c => assert.ok(!Number.isInteger(c.reponse) && CORE.decimalesDe(c.reponse) <= 2 && c.reponse > 0, c.texte));
  // M9 : × 9 et × 19 ; × 99 et × 98 ; jamais 2, 4, 5, 8 ni une dizaine entière.
  ["M9-1", "M9-2"].forEach((cle, i) => tous(cle).forEach(c => {
    assert.ok((i ? [99, 98] : [9, 19]).includes(c.donnees.m), c.texte);
    assert.ok(![2, 4, 5, 8].includes(c.donnees.n) && c.donnees.n % 10 !== 0, c.texte);
  }));
});

test("lot 7d : une échelle par module — aucun calcul commun entre deux niveaux, ni avec un autre niveau de l'appli", () => {
  const ecrit = c => espaces(c.texte);
  const autres = new Map();
  CORE.MODULES.filter(m => m.construit).forEach(m => m.niveaux.forEach(n => {
    const cle = `${m.id}-${n.n}`;
    tous(cle).forEach(c => { if (!autres.has(ecrit(c))) autres.set(ecrit(c), new Set()); autres.get(ecrit(c)).add(cle); });
  }));
  NIVEAUX.forEach(cle => tous(cle).forEach(c => assert.deepEqual([...autres.get(ecrit(c))], [cle], `${c.texte} : dans un seul niveau`)));
  // La règle commune avec « Distributivité : décomposer » (revue au lot 6
  // « programmes », 18/11, puis au lot 6 « programmes 2 », 19/11 : relecture
  // de Codex) : M8 garde tout ce que le programme demande — les × 9 d'un
  // nombre de 11 à 99, 19 × un chiffre, 98 et 99 × 3, 6, 7, 9 (bases), et
  // les 12 produits de 11, 12, 21, 31 par 19, 98, 99 (CM1, avec leurs
  // égalités à trou). M9 prend d'autres facteurs.
  const m8 = new Set(["M8-1", "M8-2"].flatMap(cle => tous(cle).map(c => espaces(c.texte))));
  ["13 × 9 = □", "9 × 46 = □", "19 × 3 = □", "9 × 19 = □"].forEach(t => assert.ok(m8.has(t), `${t} : dans les bases`));
  [98, 99].forEach(x => [3, 6, 7, 9].forEach(y => [`${x} × ${y} = □`, `${y} × ${x} = □`].forEach(t => assert.ok(m8.has(t), `${t} : dans les bases`))));
  const m83 = new Set(tous("M8-3").map(c => espaces(c.texte)));
  [11, 12, 21, 31].forEach(b => [19, 98, 99].forEach(a => {
    [`${a} × ${b} = □`, `${b} × ${a} = □`].forEach(t => assert.ok(m83.has(t), `${t} : au CM1`));
    const morceau = b - b % 10;
    assert.ok(m83.has(`${b} × ${a} = ${morceau} × ${a} + □ × ${a}`), `${b} × ${a} : son égalité à trou`);
  }));
  // M9-1 : × 9 d'un nombre à trois chiffres, × 19 d'un nombre à deux chiffres.
  tous("M9-1").forEach(c => assert.ok(c.donnees.m === 9 ? c.donnees.n > 100 : c.donnees.n > 12 && c.donnees.n < 26 && c.donnees.n !== 21, c.texte));
  // Le même produit écrit autrement (9 × 45 et 45 × 9) : pas ailleurs non plus.
  const produit = c => {
    const m = espaces(c.texte).match(/^(\d+) × (\d+) = □$/);
    return m ? [Number(m[1]), Number(m[2])].sort((a, b) => a - b).join("×") : null;
  };
  const produits = new Map();
  CORE.MODULES.filter(m => m.construit && m.id !== "M9").forEach(m => m.niveaux.forEach(n => tous(`${m.id}-${n.n}`).forEach(c => { const p = produit(c); if (p) produits.set(p, `${m.id}-${n.n}`); })));
  ["M9-1", "M9-2"].forEach(cle => tous(cle).forEach(c => assert.ok(!produits.has(produit(c)), `${c.texte} : aussi dans ${produits.get(produit(c))}`)));
});

test("lot 7d : l'aide ne donne jamais la réponse, la correction la montre (tous les calculs)", () => {
  NIVEAUX.forEach(cle => tous(cle).forEach(c => {
    const aide = CORE.aideDe(c);
    const svg = AIDES.dessinerImage(aide);
    const r = ecrite(c.reponse);
    assert.ok(!textesSvg(svg).some(t => t === r || t.endsWith(`= ${r}`)), `${c.texte} : la réponse sur l'aide`);
    assert.match(ariaDe(svg), /un nombre à trouver/, c.texte);
    // M11, le nombre de parts : la barre n'est pas coupée (on ne compte pas les parts).
    if (c.forme === "quotient") assert.ok(textesSvg(svg).includes(`des parts de ${c.donnees.d}`), c.texte);
    const fin = textesSvg(AIDES.dessinerImage(CORE.imageDe(c)));
    assert.ok(fin.some(t => t === r || t.endsWith(`= ${r}`) || t.startsWith(`${r} × `)), `${c.texte} : la correction`);
    // Lisible en noir et blanc : pas de texte en couleur claire.
    assert.doesNotMatch(svg, /<text[^>]*fill="#(?:9fb6c6|eef4fb|e5f7eb|eaf2ff)"/, c.texte);
  }));
});

test("lot 7d : J'écris — une recette partagée par la leçon et les calculs tirés ; le calcul cherché d'abord ; le dessin se remplit à son étape", () => {
  NIVEAUX.forEach(cle => {
    const lecon = CORE.niveauDe(cle).niveau.apprends;
    const refait = CORE.ecrisDuCalcul(cle, lecon.calculs.ecris);
    assert.deepEqual(refait.etapes.map(e => [espaces(e.texte), e.reponse]), lecon.ecris.etapes.map(e => [espaces(e.texte), e.reponse]), cle);
    for (let g = 1; g <= 60; g += 1) {
      const {calcul, ecris} = CORE.ecrisTire(cle, {graine: g * 31 + 7});
      const t = espaces(calcul.texte);
      assert.ok(espaces(ecris.consigne).startsWith(t.replace(" = □", "").replace("□", "?")), `${cle} : « ${espaces(ecris.consigne)} »`);
      assert.ok(CORE.memeNombre(ecris.etapes[ecris.etapes.length - 1].reponse, calcul.reponse), `${t} : la dernière étape donne la réponse`);
      const svgs = ecris.dessins.map(AIDES.dessinerImage);
      assert.equal(svgs.length, ecris.etapes.length + 1, t);
      // Rien de vert au début ; chaque étape écrit sa réponse sur le dessin.
      assert.doesNotMatch(svgs[0], /#e5f7eb/, `${t} : rien de vert au début`);
      ecris.etapes.forEach((e, j) => {
        const r = ecrite(e.reponse);
        assert.ok(textesSvg(svgs[j + 1]).some(x => x === r || x.endsWith(`= ${r}`) || x === `− ${r}` || x.startsWith(`${r} × `)), `${t} : ${r} s'écrit à l'étape ${j + 1}`);
      });
      // Le dessin garde sa taille d'une étape à l'autre.
      assert.equal(new Set(svgs.map(s => s.match(/viewBox="([^"]+)"/)[1])).size, 1, `${t} : même taille`);
    }
  });
  const e = cle => CORE.niveauDe(cle).niveau.apprends.ecris;
  const lignes = cle => e(cle).etapes.map(x => [espaces(x.texte), x.reponse]);
  assert.equal(espaces(e("M11-1").consigne), "19 = 4 × 4 + ?");
  assert.deepEqual(lignes("M11-1"), [["4 × 4 = □", 16], ["19 − 16 = □", 3]]);
  assert.deepEqual(lignes("A9-1"), [["44 + 56 = □", 100], ["100 + 37 = □", 137]]);
  assert.equal(espaces(e("A9-1").consigne), "44 + 37 + 56 = 44 + 56 + 37");
  assert.equal(espaces(e("C4-1").consigne), "(3 × ?) − 6 = 21");
  assert.deepEqual(lignes("C4-1"), [["21 + 6 = □", 27], ["27 ÷ 3 = □", 9]]);
  assert.deepEqual(lignes("M9-1"), [["112 × 10 = □", 1120], ["1 120 − 112 = □", 1008]]);
  assert.equal(espaces(e("M9-1").consigne), "112 × 9 = 112 × 10 − 112");
  // × 98 : retirer deux fois le nombre (rapport de Codex).
  // (Lot 6 « programmes 2 » : 12 × 98 est rendu à M8-3 ; 14 × 98.)
  const r98 = CORE.ecrisDuCalcul("M9-2", tous("M9-2").find(c => espaces(c.texte) === "14 × 98 = □"));
  assert.deepEqual(r98.etapes.map(x => [espaces(x.texte), x.reponse]), [["14 × 100 = □", 1400], ["2 × 14 = □", 28], ["1 400 − 28 = □", 1372]]);
  // Le nombre de parts : ce qui est dans les parts, puis combien de parts.
  const q = CORE.ecrisDuCalcul("M11-1", tous("M11-1").find(c => espaces(c.texte) === "23 = □ × 5 + 3"));
  assert.deepEqual(q.etapes.map(x => [espaces(x.texte), x.reponse]), [["23 − 3 = □", 20], ["□ × 5 = 20", 4]]);
});

test("lot 7d : les annonces — le reste nul, le nombre de parts, quatre nombres, chaque schéma de C4, × 19, × 98", () => {
  const annonce = (cle, texte) => {
    const c = tous(cle).find(x => espaces(x.texte) === texte);
    assert.ok(c, texte);
    const n = CORE.nouveauteDe(c, cle);
    return espaces(n ? n.texte : CORE.annonceDe(c));
  };
  assert.match(annonce("M11-1", "20 = 4 × 5 + □"), /il reste 0/);
  assert.match(annonce("M11-1", "23 = □ × 5 + 3"), /nombre de paquets/);
  assert.match(annonce("A9-1", "18 + 25 + 82 + 35 = □"), /deux comptes ronds/);
  assert.match(annonce("C4-1", "3 × (2 + □) = 27"), /je remonte avec ÷, puis −/);
  assert.match(annonce("C4-1", "18 = 10 + (□ ÷ 5)"), /je remonte avec −, puis ×/);
  assert.match(annonce("M9-1", "16 × 19 = □"), /20 − 1/);
  assert.match(annonce("M9-2", "14 × 98 = □"), /2 fois le nombre/);
});

test("lot 7d : les erreurs connues, chacune la sienne", () => {
  const cas = [
    ["M11-1", "17 = 3 × 5 + □", 15, 1], ["M11-1", "17 = 3 × 5 + □", 7, 2], ["M11-1", "23 = □ × 5 + 3", 3, 3], ["M11-1", "23 = □ × 5 + 3", 20, 4], ["M11-1", "23 = □ × 5 + 3", 5, 5],
    ["A9-1", "36 + 59 + 64 = □", 100, 2], ["A9-1", "36 + 59 + 64 = □", 123, 1],
    ["C4-1", "(2 × □) − 5 = 23", 41, 1], ["C4-1", "(2 × □) − 5 = 23", 9, 2], ["C4-1", "(2 × □) − 5 = 23", 16.5, 3], ["C4-1", "(2 × □) − 5 = 23", 28, 4],
    ["M9-1", "124 × 9 = □", 1239, 1], ["M9-1", "124 × 9 = □", 1364, 2], ["M9-2", "14 × 98 = □", 1386, 3], ["M9-1", "124 × 9 = □", 1240, 4]
  ];
  cas.forEach(([cle, texte, faux, cause]) => {
    const c = tous(cle).find(x => espaces(x.texte) === texte) || CORE.niveauDe(cle).niveau.imposes.find(x => espaces(x.texte) === texte);
    assert.ok(c, texte);
    const d = CORE.diagnostiquer(c, faux);
    assert.equal(d && d.c, cause, `${texte} → ${faux}`);
  });
  // Les 15 causes nouvelles : la page prof en a 171.
  // (Lot 6 « fraction à deux cases » : 3 de plus, la fraction cherchée — 174.
  // Lot 6 « programmes 2 » : « × 0 : le nombre recopié », dans la liste des
  // faits de M4 — 175.)
  assert.equal(CORE.MODULES.filter(m => m.construit).reduce((s, m) => s + m.erreurs.length, 0), 199); // (lot « la 6e complète » : 24 de plus — D10 3, D11 3, D12 2, D14 2, D16 2, F10 2, F11-3 3, P1 3, P2 4)
});

test("lot 7d : À retenir reprend le calcul de On te montre, une égalité par ligne ; pas de 69", () => {
  NIVEAUX.forEach(cle => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    const montre = espaces(a.represente.texte).replace("□", ecrite(a.represente.reponse));
    const bilan = espaces(a.bilan);
    const [gauche, droite] = [montre.slice(0, montre.lastIndexOf(" = ")), montre.slice(montre.lastIndexOf(" = ") + 3)];
    assert.ok(bilan.includes(gauche) && bilan.includes(droite), `${cle} : « ${bilan} » reprend ${montre}`);
    assert.doesNotMatch(bilan, /69/, cle);
  });
  // Le reste plus petit que le diviseur, dit en mots.
  assert.match(espaces(CORE.niveauDe("M11-1").niveau.apprends.bilan), /^Le reste est plus petit que 5 :/);
});

test("lot 7d : la page — adresses de cache, copie du moteur pour la page prof, VERSION, À retenir coupe aussi devant « ( »", async () => {
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /defi_calcul_core\.js\?v=20261128-1/);
  assert.match(page, /defi_calcul_aides\.js\?v=20261128-1/);
  assert.ok(page.includes("(?=[A-ZÀ-ÖØ-Þ\\d(]|(?:double|moitié) de )"));
  const coeur = await readFile(new URL("../outils/calcul_mental/defi_calcul_core.js", import.meta.url));
  const copie = await readFile(new URL("../_serveur/public/prof/defi_calcul_core.js", import.meta.url));
  assert.ok(coeur.equals(copie), "la copie de la page prof est identique, octet pour octet");
  const version = await readFile(new URL("../_serveur/public/VERSION", import.meta.url), "utf8");
  assert.match(version, /^lot defi-calcul-lot-(?:7d-derniers-modules|6-programmes|6-fraction-deux-cases|6-programmes-2|6-programmes-2-correctif|F4-personne-bloque|F4-correctif|C1-ordre|C2-doubles-moities|C3-exemples|C4a|C4b|C4c|C4d|K1-la-carte|K1b|P1|6e-complete|fractions-6e)$|^lot plus-rapide-A$|^lot mon-espace-B1(?:-liens)?$|^lot ma-liste-B2$|^lot arriver-E$|^lot m-corrige$|^lot aujourdhui-B3$|^lot anzan-bareme-lot-1$/m); // (lots 6 « programmes », « fraction à deux cases » et « programmes 2 » : le cœur change encore ; lot F4 et son correctif : le moteur ; lot C1 : le cœur ; lot C2 : le cœur, la progression en version 11)
});
