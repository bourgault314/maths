// Défi calcul, lot 7a « Les décimaux (1) » (14/11/2026) : D5 « Compléments
// à l'unité », D6 « Additionner deux décimaux », D7 « Soustraire deux
// décimaux » — les carrés de 100 qui calculent (choix de Gwenaël du 14/11 :
// un seul carré pour les compléments ; la partie décimale seule, les unités
// à part ; l'unité déjà cassée ; une croix par case enlevée).

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");

const NIVEAUX = ["D5-1", "D5-2", "D6-1", "D6-2", "D6-3", "D7-1", "D7-2", "D7-3"];
const VOISINS = ["D1-1", "D1-2", "D1-3", "D3-1", "D3-2", "D3-3", "D4-1", "D4-2", "D4-3"];
const tirage = cle => Array.from({length: 40}, (_, g) => ["valide", "entraine"].flatMap(genre => CORE.genererSerie(cle, {graine: g * 53 + 7, genre}))).flat();
const TIRES = Object.fromEntries([...NIVEAUX, ...VOISINS].map(cle => [cle, tirage(cle)]));
const net = texte => String(texte).replace(/[   ]/g, " ");
const chiffresNonNuls = x => [...CORE.formaterNombre(x).replace(/\D/g, "")].filter(c => c !== "0").length;

test("lot 7a : les 8 niveaux sont construits, à leur place dans le parcours", () => {
  NIVEAUX.forEach(cle => {
    const {niveau} = CORE.niveauDe(cle);
    assert.ok(CORE.moduleDe(cle.split("-")[0]).construit && niveau.apprends, cle);
    assert.ok(CORE.ORDRE.includes(cle), cle);
  });
  assert.deepEqual(CORE.MODULES.filter(f => f.construit).flatMap(f => f.niveaux).length, 127); // (lot 6 « programmes 2 » : F9-1, F6-2) // (lot 7b : D8, D9, M13 ; lot 7c : F4, F9, F11 ; lot 7d : M11, A9, C4, M9)
});

test("lot 7a : chaque calcul est juste, et à sa place (sortes, bornes)", () => {
  NIVEAUX.forEach(cle => {
    TIRES[cle].forEach(c => {
      const d = c.donnees;
      if (c.module === "D5") {
        assert.equal(CORE.exact(d.n + c.reponse), d.cible, c.texte);
        assert.ok(c.reponse > 0 && c.reponse < 1, c.texte);
        assert.equal(CORE.decimalesDe(d.n), cle === "D5-1" ? 1 : 2, `${c.texte} : dixièmes, puis centièmes (un centième non nul)`);
      } else {
        const r = c.module === "D6" ? CORE.exact(d.a + d.b) : CORE.exact(d.a - d.b);
        assert.equal(c.reponse, r, c.texte);
        assert.ok(c.reponse > 0, c.texte);
        assert.ok(d.b < 10 && d.a < 20, `${c.texte} : des nombres sous 10 (sous 20 pour le premier d'une soustraction)`);
        const echange = c.module === "D6" ? d.xa + d.xb >= 100 : d.casse;
        if (cle === "D6-1" || cle === "D7-1") assert.equal(echange, false, `${c.texte} : sans échange`);
        if (cle === "D6-2" || cle === "D7-2") assert.equal(echange, true, `${c.texte} : avec un échange`);
        const centiemes = CORE.decimalesDe(d.a) === 2 || CORE.decimalesDe(d.b) === 2;
        assert.equal(centiemes, ["D6-3", "D7-3"].includes(cle), `${c.texte} : des centièmes au niveau 3 seulement`);
        if (["D6-3", "D7-3"].includes(cle)) assert.notEqual(CORE.decimalesDe(d.a), CORE.decimalesDe(d.b), `${c.texte} : des chiffres après la virgule différents`);
        // Un nombre à un seul chiffre non nul, sans échange : c'est D4.
        // (Une addition : les deux nombres, l'ordre ne compte pas ; une soustraction : ce qu'on retire.)
        // (Lot 6 « programmes 2 » : un entier et un décimal aux dixièmes,
        // 2,3 + 4, dans D6-1 — D4 n'ajoute un entier qu'aux centièmes.)
        const entierEtDecimal = cle === "D6-1" && (Number.isInteger(d.a) || Number.isInteger(d.b)) && Math.max(CORE.decimalesDe(d.a), CORE.decimalesDe(d.b)) === 1;
        if (!echange && !entierEtDecimal) assert.ok(chiffresNonNuls(d.b) >= 2 && (c.module === "D7" || chiffresNonNuls(d.a) >= 2), `${c.texte} : pas un calcul de D4`);
        if (c.module === "D6") assert.ok(d.a < 10, `${c.texte} : chacun des deux termes sous 10`);
      }
    });
    const sortes = CORE.sortesDe(cle);
    assert.ok(sortes.length >= 2 && sortes.length <= 4, `${cle} : 2 à 4 sortes`);
    const vues = new Set(TIRES[cle].map(c => CORE.sorteDe(c)));
    sortes.forEach(s => assert.ok(vues.has(s.n), `${cle} : la sorte « ${s.nom} » se tire`));
  });
});

test("lot 7a : une échelle par module, aucun calcul commun avec un voisin (D1, D3, D4)", () => {
  const ou = new Map();
  [...NIVEAUX, ...VOISINS].forEach(cle => TIRES[cle].forEach(c => {
    const t = net(c.texte);
    if (ou.has(t) && ou.get(t) !== cle) assert.fail(`${t} : dans ${ou.get(t)} et ${cle}`);
    ou.set(t, cle);
  }));
  // Le même calcul retourné (4,5 + 1,2 ; 1,2 + 4,5) n'est pas non plus dans deux niveaux de D6.
  const sommes = new Map();
  ["D6-1", "D6-2", "D6-3"].forEach(cle => TIRES[cle].forEach(c => {
    const k = [c.donnees.a, c.donnees.b].sort((x, y) => x - y).join("+");
    if (sommes.has(k)) assert.equal(sommes.get(k), cle, `${c.texte}`);
    sommes.set(k, cle);
  }));
});

test("lot 7a : la leçon (On te montre, Avec le dessin, J'écris) garde une seule sorte, aucun 69 mis en avant", () => {
  NIVEAUX.forEach(cle => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    const sorte = CORE.sorteDansNiveau(cle, a.calculs.montre);
    assert.equal(CORE.sorteDansNiveau(cle, a.calculs.ecris), sorte, `${cle} : J'écris`);
    [a.calculs.montre.texte, a.represente.texte, a.calculs.ecris.texte, a.bilan, ...CORE.niveauDe(cle).niveau.imposes.map(c => c.texte)]
      .forEach(t => assert.doesNotMatch(net(t), /69/, `${cle} : ${t}`));
    // À retenir : une égalité par ligne, la dernière est le calcul de On te montre.
    const lignes = a.bilan.split(/(?<=\.)\s+(?=[A-ZÀ-ÖØ-Þ\d])/).map(t => AIDES.bilanEnDeux(t));
    assert.ok(lignes.every(Boolean), `${cle} : « ${a.bilan} » se lit en lignes`);
    const derniere = net(lignes[lignes.length - 1].calcul);
    assert.equal(derniere, net(`${a.exemple.texte.replace(" = ?", "").replace("?", CORE.formaterNombre(a.exemple.reponse))}${a.exemple.texte.includes("?") ? "" : ` = ${CORE.formaterNombre(a.exemple.reponse)}`}`), `${cle} : la dernière ligne d'À retenir`);
  });
});

test("lot 7a : J'écris se tire sur des calculs qui changent, et redonne la leçon sur son calcul", () => {
  NIVEAUX.forEach(cle => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    const lecon = CORE.ecrisDuCalcul(cle, a.calculs.ecris);
    assert.deepEqual(JSON.parse(JSON.stringify(lecon)), JSON.parse(JSON.stringify(a.ecris)), `${cle} : la recette redonne la leçon`);
    const vus = new Set();
    for (let graine = 1; graine <= 150; graine += 1) {
      const t = CORE.ecrisTire(cle, {graine});
      assert.ok(t, `${cle} : un J'écris tiré (graine ${graine})`);
      assert.equal(t.ecris.etapes.length, a.ecris.etapes.length, `${cle} : autant d'étapes que la leçon`);
      assert.equal(t.ecris.etapes[t.ecris.etapes.length - 1].reponse, t.calcul.reponse);
      t.ecris.etapes.forEach(e => {
        // Chaque étape est juste.
        const [gauche, droite] = net(e.texte).split(" = ");
        const lire = s => Number(s.replace(/ /g, "").replace(",", "."));
        const calcule = expr => {
          const m = /^(.+?) ([+−]) (.+)$/.exec(expr);
          return m ? CORE.exact(m[2] === "+" ? lire(m[1]) + lire(m[3]) : lire(m[1]) - lire(m[3])) : lire(expr);
        };
        if (droite === "□") assert.equal(calcule(gauche), e.reponse, `${cle} : ${e.texte}`);
        else {
          const m = /^(.+?) \+ □$/.exec(gauche);
          assert.ok(m, e.texte);
          assert.equal(CORE.exact(lire(m[1]) + e.reponse), lire(droite), `${cle} : ${e.texte}`);
        }
      });
      vus.add(t.calcul.texte);
    }
    assert.ok(vus.size >= 30, `${cle} : J'écris change (${vus.size} calculs)`);
  });
});

test("lot 7a : les carrés qui calculent — un toucher, un morceau ; la bande d'abord pour compléter", () => {
  // Compléter 0,35 : 5 petits carrés, puis 6 bandes.
  const pas = [];
  for (let fait = 0, apres; (apres = AIDES.carreOpGeste(fait, {autre: 65}, "completer", 35)) !== null; fait = apres) pas.push(apres - fait);
  assert.deepEqual(pas, [1, 1, 1, 1, 1, 10, 10, 10, 10, 10, 10]);
  // Ajouter 0,35 : 3 bandes, puis 5 petits carrés.
  const ajout = [];
  for (let fait = 0, apres; (apres = AIDES.carreOpGeste(fait, {autre: 35, dixiemes: 3, centiemes: 5}, "ajouter")) !== null; fait = apres) ajout.push(apres - fait);
  assert.deepEqual(ajout, [10, 10, 10, 1, 1, 1, 1, 1]);
  // Tout fait : refusé.
  assert.equal(AIDES.carreOpGeste(35, {autre: 35, dixiemes: 3, centiemes: 5}, "ajouter"), null);
  // Le dessin : aucun chiffre, un ou deux carrés, la même taille au début et à la fin.
  NIVEAUX.forEach(cle => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    const svgs = a.ecris.dessins.map(AIDES.dessinerImage);
    assert.ok(svgs.every(svg => !/<text/.test(svg)), `${cle} : aucun chiffre sur les carrés`);
    const carres = CORE.moduleDe(cle.split("-")[0]).image(a.calculs.montre).carres;
    assert.equal(carres, cle.startsWith("D5") ? 1 : cle.startsWith("D6") ? 2 : cle === "D7-1" ? 1 : 2, `${cle} : les carrés de On te montre`);
  });
});

test("lot 7a : les erreurs connues sont reconnues, sans jamais tomber sur la bonne réponse", () => {
  const cas = [
    ["D5", CORE.niveauDe("D5-2").niveau.imposes[0], 0.68, 1],   // 0,42 → 0,68 (chaque chiffre complété à 10)
    ["D5", CORE.niveauDe("D5-1").niveau.imposes[0], 7, 2],      // 0,3 + □ = 1 → 7 (la virgule oubliée)
    ["D6", CORE.niveauDe("D6-2").niveau.imposes[1], 15.14, 1],  // 8,6 + 7,8 → 15,14
    ["D6", CORE.niveauDe("D6-2").niveau.imposes[1], 15.4, 2],   // l'échange oublié
    ["D6", CORE.niveauDe("D6-3").niveau.imposes[0], 4.41, 3],  // 4,6 + 0,35 → 4,41 (les chiffres alignés à droite)
    ["D7", CORE.niveauDe("D7-2").niveau.imposes[0], 6.3, 2],    // 6,2 − 0,5 → 6,3 (le petit chiffre retiré du grand)
    ["D7", CORE.niveauDe("D7-2").niveau.imposes[0], 6.7, 1],    // 6,2 − 0,5 → 6,7 (l'unité cassée oubliée)
    ["D7", CORE.niveauDe("D7-3").niveau.imposes[0], 2.42, 3]    // 6,48 − 4,6 → 2,42 (les chiffres alignés à droite)
  ];
  cas.forEach(([module, calcul, faux, cause]) => {
    assert.equal(calcul.module, module);
    const d = CORE.diagnostiquer(calcul, faux);
    assert.ok(d && d.c === cause, `${calcul.texte} → ${faux} : cause ${cause} (${JSON.stringify(d)})`);
    assert.ok(d.texte && !d.texte.includes(CORE.formaterNombre(calcul.reponse)), `${calcul.texte} : la phrase ne donne pas la réponse`);
  });
  NIVEAUX.forEach(cle => TIRES[cle].forEach(c => CORE.moduleDe(c.module).erreurs.forEach(e => assert.equal(e.test(c, c.reponse), false, `${c.texte} : cause ${e.c} sur la bonne réponse`))));
});

test("lot 7a : « Nouveau » pour les sortes qui changent la méthode", () => {
  const annonces = cle => new Set(TIRES[cle].map(c => (CORE.nouveauteDe(c) || {}).texte).filter(Boolean).map(net));
  assert.deepEqual([...annonces("D6-2")], ["Nouveau : 10 dixièmes font 1 unité : le résultat n’a pas de virgule."]);
  assert.equal(annonces("D7-2").size, 2);
  assert.equal(annonces("D7-3").size, 2);
  ["D5-1", "D5-2", "D6-1", "D6-3", "D7-1"].forEach(cle => assert.equal(annonces(cle).size, 0, `${cle} : seuls les nombres changent`));
});
