import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FAMILLES_DE_CAS,
  GABARITS_DIVISIBILITE,
  VERSION_GENERATEUR_DIVISIBILITE,
  genererDivisibilite,
} from "./divisibilite.js";
import {
  ecrireValeur,
  memeValeur,
  validerQuestionInstance2,
} from "../../../contrats/src/question-instance-2.js";
import { validerModuleQuestions } from "../../../contrats/src/module-questions.js";
import { MODULE_CRITERES_DIVISIBILITE } from "../../../banque-automatismes/src/modules/criteres-divisibilite/index.js";
import { avancement, moduleParId, notionsPubliees } from "../../../banque-automatismes/src/index.js";

const MODULE = MODULE_CRITERES_DIVISIBILITE;

/** Produit une question depuis un gabarit déclaré de la banque. */
function produire(idGabarit, { graine = "test", famille = "concept", position = 1 } = {}) {
  const gabarit = MODULE.gabarits.find((g) => g.id === idGabarit);
  assert.ok(gabarit, `gabarit « ${idGabarit} » absent de la banque`);
  const notion = MODULE.notions.find((n) => n.id === gabarit.notion);
  return genererDivisibilite({
    graine,
    gabarit: gabarit.generateur.split("/")[1],
    parametres: gabarit.parametres,
    notion: gabarit.notion,
    module: MODULE.id,
    automatismeBO: notion.automatismesBO[0] ?? null,
    famille,
    position,
    versionGabarit: MODULE.version,
  });
}

const TOUS_LES_GABARITS = [
  "multiple-voisin-2", "multiple-voisin-5", "multiple-voisin-5-descendant",
  "multiple-voisin-10", "chiffre-manquant-3", "chiffre-manquant-3-quatre-chiffres",
  "chiffre-manquant-9", "chiffre-manquant-9-quatre-chiffres", "diviseurs-au-clic",
];

describe("divisibilité : contrats et indépendance (§9.1)", () => {
  it("expose sa version et ses gabarits", () => {
    assert.equal(VERSION_GENERATEUR_DIVISIBILITE, 1);
    assert.deepEqual(GABARITS_DIVISIBILITE, ["chiffre-manquant", "multiple-voisin", "diviseurs-au-clic"]);
  });

  it("le module de banque respecte le contrat module-questions/1", () => {
    const { valide, erreurs } = validerModuleQuestions(MODULE);
    assert.ok(valide, `module invalide :\n${erreurs.join("\n")}`);
  });

  it("toute question produite respecte le contrat question-instance/2", () => {
    for (const id of TOUS_LES_GABARITS) {
      for (const famille of FAMILLES_DE_CAS) {
        const question = produire(id, { graine: `contrat-${id}-${famille}`, famille });
        const { valide, erreurs } = validerQuestionInstance2(question);
        assert.ok(valide, `${id} / ${famille} :\n${erreurs.join("\n")}`);
      }
    }
  });

  it("ne contient ni eval, ni Function, ni with, ni Math.random, ni DOM", () => {
    const fichiers = [
      new URL("./divisibilite.js", import.meta.url),
      new URL("../../../banque-automatismes/src/modules/criteres-divisibilite/index.js", import.meta.url),
      new URL("../../../banque-automatismes/src/index.js", import.meta.url),
      new URL("../../../contrats/src/question-instance-2.js", import.meta.url),
      new URL("../../../contrats/src/module-questions.js", import.meta.url),
    ];
    for (const fichier of fichiers) {
      const source = readFileSync(fichier, "utf8");
      // On retire les commentaires : la doctrine y cite ces mots.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n")
        .filter((ligne) => !ligne.trimStart().startsWith("//"))
        .join("\n");
      for (const interdit of ["eval(", "new Function", "Math.random", "document.", "window."]) {
        assert.ok(!code.includes(interdit), `${fichier.pathname} contient « ${interdit} »`);
      }
    }
  });

  it("n'importe jamais le moteur hérité", () => {
    const source = readFileSync(new URL("./divisibilite.js", import.meta.url), "utf8");
    assert.ok(!source.includes("auto/"), "aucun import depuis auto/");
    assert.ok(!source.includes("formula_code"), "aucun formula_code");
  });

  it("refuse un tirage sans graine et un gabarit inconnu", () => {
    assert.throws(() => genererDivisibilite({ gabarit: "multiple-voisin", notion: "critere-5" }), /graine/);
    assert.throws(
      () => genererDivisibilite({ graine: 1, gabarit: "inconnu", notion: "critere-5" }),
      /gabarit inconnu/,
    );
    assert.throws(
      () => genererDivisibilite({ graine: 1, gabarit: "multiple-voisin", notion: "" }),
      /notion/,
    );
  });

  it("refuse un diviseur incompatible avec le gabarit", () => {
    // 2, 5 et 10 : le chiffre des unités admet plusieurs réponses.
    assert.throws(
      () => genererDivisibilite({ graine: 1, gabarit: "chiffre-manquant", notion: "critere-2", parametres: { diviseur: 2 } }),
      /réservé aux critères de 3 et 9/,
    );
    assert.throws(
      () => genererDivisibilite({ graine: 1, gabarit: "multiple-voisin", notion: "critere-3", parametres: { diviseur: 3 } }),
      /prévu pour les critères de 2, 5 et 10/,
    );
    assert.throws(
      () => genererDivisibilite({ graine: 1, gabarit: "multiple-voisin", notion: "critere-7", parametres: { diviseur: 7 } }),
      /diviseur non couvert/,
    );
  });
});

describe("divisibilité : déterminisme (§9.2)", () => {
  it("même graine et mêmes versions : question identique", () => {
    for (const id of TOUS_LES_GABARITS) {
      const un = produire(id, { graine: "graine-fixe" });
      const deux = produire(id, { graine: "graine-fixe" });
      assert.deepEqual(un, deux, id);
    }
  });

  it("graines différentes : questions différentes", () => {
    const vues = new Set();
    for (let i = 0; i < 30; i++) {
      vues.add(JSON.stringify(produire("chiffre-manquant-3", { graine: `v-${i}` }).parametres));
    }
    assert.ok(vues.size > 20, `variété insuffisante : ${vues.size} formes sur 30`);
  });

  it("la position dans la série change la question", () => {
    const a = produire("multiple-voisin-5", { graine: "serie", position: 1 });
    const b = produire("multiple-voisin-5", { graine: "serie", position: 2 });
    assert.notDeepEqual(a.parametres, b.parametres);
  });

  it("porte la traçabilité complète des versions", () => {
    const question = produire("chiffre-manquant-9", { graine: "trace" });
    assert.equal(question.tracabilite.generateur, VERSION_GENERATEUR_DIVISIBILITE);
    assert.equal(question.tracabilite.aleatoire, 1);
    assert.equal(question.tracabilite.graine, "trace");
    assert.equal(question.cible.module, "criteres-divisibilite");
    assert.equal(question.cible.notion, "critere-9");
    assert.equal(question.cible.automatismeBO, "3-09");
  });
});

describe("divisibilité : justesse mathématique (§9.6)", () => {
  it("le chiffre trouvé rend bien le nombre divisible, et c'est le plus petit", () => {
    for (const id of ["chiffre-manquant-3", "chiffre-manquant-9", "chiffre-manquant-3-quatre-chiffres"]) {
      for (let i = 0; i < 40; i++) {
        const q = produire(id, { graine: `juste-${id}-${i}` });
        const { diviseur, masque, nombreComplet } = q.parametres;
        const chiffre = q.reponse.valeur.valeur;
        assert.ok(chiffre >= 0 && chiffre <= 9, `${id} : chiffre hors 0-9`);
        assert.equal(nombreComplet % diviseur, 0, `${id} : ${nombreComplet} non divisible par ${diviseur}`);
        assert.equal(Number(masque.replace("?", String(chiffre))), nombreComplet);
        // Aucun chiffre plus petit ne doit convenir.
        const debutInterdit = masque.indexOf("?") === 0;
        for (let d = debutInterdit ? 1 : 0; d < chiffre; d++) {
          const essai = Number(masque.replace("?", String(d)));
          assert.notEqual(essai % diviseur, 0, `${id} : ${d} convenait aussi et est plus petit`);
        }
      }
    }
  });

  it("le multiple voisin est le bon, dans le bon sens, et strictement", () => {
    for (const id of ["multiple-voisin-2", "multiple-voisin-5", "multiple-voisin-10", "multiple-voisin-5-descendant"]) {
      for (let i = 0; i < 40; i++) {
        const q = produire(id, { graine: `voisin-${id}-${i}` });
        const { diviseur, sens, depart } = q.parametres;
        const reponse = q.reponse.valeur.valeur;
        assert.equal(reponse % diviseur, 0, `${id} : ${reponse} n'est pas multiple de ${diviseur}`);
        assert.ok(reponse > 0, `${id} : multiple positif attendu`);
        if (sens === "superieur") {
          assert.ok(reponse > depart, `${id} : ${reponse} doit dépasser ${depart}`);
          assert.ok(reponse - depart <= diviseur, `${id} : ${reponse} n'est pas le PLUS PETIT au-dessus de ${depart}`);
        } else {
          assert.ok(reponse < depart, `${id} : ${reponse} doit être sous ${depart}`);
          assert.ok(depart - reponse <= diviseur, `${id} : ${reponse} n'est pas le PLUS GRAND sous ${depart}`);
        }
      }
    }
  });

  it("les diviseurs cochés sont exactement les bons — jamais partiels", () => {
    for (let i = 0; i < 60; i++) {
      const q = produire("diviseurs-au-clic", { graine: `div-${i}` });
      const { nombre, proposes } = q.parametres;
      const attendus = q.reponse.valeur.attendus;
      const vrais = proposes.filter((d) => nombre % d === 0);
      assert.deepEqual(attendus, vrais, `${nombre} : sélection incorrecte`);
      assert.ok(attendus.length > 0 && attendus.length < proposes.length, `${nombre} : cas tout-ou-rien inutile`);
      assert.equal(q.reponse.politique.toutOuRien, true);
    }
  });

  it("différencie les critères de 3 et de 9", () => {
    // Un nombre dont la somme est multiple de 3 sans l'être de 9 ne doit
    // jamais compter 9 parmi ses diviseurs.
    let vus = 0;
    for (let i = 0; i < 80; i++) {
      const q = produire("diviseurs-au-clic", { graine: `trois-neuf-${i}`, famille: "piege" });
      const { nombre } = q.parametres;
      if (nombre % 3 === 0 && nombre % 9 !== 0) {
        vus += 1;
        assert.ok(q.reponse.valeur.attendus.includes(3), `${nombre} : 3 doit être coché`);
        assert.ok(!q.reponse.valeur.attendus.includes(9), `${nombre} : 9 ne doit pas être coché`);
      }
    }
    assert.ok(vus > 0, "la famille « piege » doit produire des cas 3-sans-9");
  });

  it("un multiple de 10 est toujours multiple de 2 et de 5", () => {
    for (let i = 0; i < 40; i++) {
      const q = produire("diviseurs-au-clic", { graine: `dix-${i}`, famille: "limite" });
      const { nombre } = q.parametres;
      const attendus = q.reponse.valeur.attendus;
      if (attendus.includes(10)) {
        assert.equal(nombre % 10, 0);
        assert.ok(attendus.includes(2) && attendus.includes(5), `${nombre} : 2 et 5 doivent suivre 10`);
      }
    }
  });

  it("n'utilise jamais 0 comme nombre de départ ni comme multiple", () => {
    for (const id of TOUS_LES_GABARITS) {
      for (let i = 0; i < 20; i++) {
        const q = produire(id, { graine: `zero-${id}-${i}` });
        const nombres = Object.values(q.parametres).filter((v) => typeof v === "number");
        for (const n of nombres) {
          assert.ok(n !== 0 || id === "diviseurs-au-clic", `${id} : 0 rencontré`);
        }
      }
    }
  });
});

describe("divisibilité : modèles d'erreurs (§5.4)", () => {
  it("aucun modèle n'égale la réponse exacte, ni un autre modèle", () => {
    for (const id of TOUS_LES_GABARITS) {
      for (const famille of FAMILLES_DE_CAS) {
        const q = produire(id, { graine: `err-${id}-${famille}`, famille });
        const modeles = q.modelesErreurs ?? [];
        for (const modele of modeles) {
          assert.ok(!memeValeur(modele.valeur, q.reponse.valeur),
            `${id} : le modèle « ${modele.id} » vaut la bonne réponse`);
          assert.ok(modele.message.length > 10, `${id} : message de diagnostic trop court`);
        }
        const cles = modeles.map((m) => ecrireValeur(m.valeur));
        assert.equal(new Set(cles).size, cles.length, `${id} : deux modèles produisent la même valeur`);
      }
    }
  });

  it("respecte le format de la réponse", () => {
    for (const id of TOUS_LES_GABARITS) {
      const q = produire(id, { graine: `format-${id}` });
      for (const modele of q.modelesErreurs ?? []) {
        assert.equal(modele.valeur.type, q.reponse.valeur.type, `${id} : type de modèle incohérent`);
      }
    }
  });

  it("produit au moins un diagnostic par question", () => {
    for (const id of TOUS_LES_GABARITS) {
      const q = produire(id, { graine: `au-moins-${id}` });
      assert.ok((q.modelesErreurs ?? []).length >= 1, `${id} : aucun modèle d'erreur`);
    }
  });

  it("diagnostique la confusion 3 / 9 quand elle est possible", () => {
    let trouve = false;
    for (let i = 0; i < 40 && !trouve; i++) {
      const q = produire("chiffre-manquant-9", { graine: `conf-${i}` });
      trouve = (q.modelesErreurs ?? []).some((m) => m.id === "confusion-3-9");
    }
    assert.ok(trouve, "le modèle « confusion-3-9 » doit apparaître sur le critère de 9");
  });
});

describe("divisibilité : aides et correction (§9.13)", () => {
  it("propose exactement les trois niveaux d'aide, non vides", () => {
    for (const id of TOUS_LES_GABARITS) {
      const q = produire(id, { graine: `aide-${id}` });
      assert.deepEqual(q.aides.map((a) => a.niveau), [1, 2, 3], id);
      for (const aide of q.aides) {
        assert.ok(aide.blocs[0].contenu.length > 20, `${id} : aide ${aide.niveau} trop courte`);
      }
    }
  });

  it("aucune aide ne contient la correction complète", () => {
    for (const id of TOUS_LES_GABARITS) {
      for (let i = 0; i < 15; i++) {
        const q = produire(id, { graine: `revele-${id}-${i}` });
        const texteAides = q.aides.map((a) => a.blocs.map((b) => b.contenu).join(" ")).join(" ");
        for (const bloc of q.correction) {
          assert.ok(!texteAides.includes(bloc.contenu), `${id} : une aide recopie la correction`);
        }
      }
    }
  });

  it("la correction énonce la réponse et reste vraie", () => {
    for (let i = 0; i < 25; i++) {
      const q = produire("multiple-voisin-5", { graine: `corr-${i}` });
      const reponse = q.reponse.valeur.valeur;
      const texte = q.correction.map((b) => b.contenu).join(" ");
      assert.match(texte, new RegExp(`${reponse / 5}`), "la correction doit montrer le quotient");
      assert.equal(reponse % 5, 0);
    }
  });

  it("aide et question parlent des mêmes valeurs", () => {
    const q = produire("chiffre-manquant-3", { graine: "coherence" });
    const aide3 = q.aides.find((a) => a.niveau === 3).blocs[0].contenu;
    assert.match(aide3, new RegExp(`${q.parametres.sommeConnue}`), "l'aide 3 doit reprendre la somme calculée");
    assert.match(aide3, new RegExp(`${q.parametres.diviseur}`));
  });
});

describe("divisibilité : la banque V2", () => {
  it("retrouve le module par son identifiant canonique et par dnb_08", () => {
    assert.equal(moduleParId("criteres-divisibilite")?.id, "criteres-divisibilite");
    assert.equal(moduleParId("dnb_08")?.id, "criteres-divisibilite");
    assert.equal(moduleParId("inexistant"), null);
  });

  it("garde le code de série permanent du module public", () => {
    assert.equal(MODULE.codeSerie, 9);
    assert.deepEqual(MODULE.legacyIds, ["dnb_08"]);
  });

  it("rattache chaque notion automatisable à un identifiant du BO", () => {
    for (const notion of MODULE.notions) {
      if (!notion.automatise) continue;
      assert.ok(notion.automatismesBO.length > 0, `${notion.id} : aucun identifiant du BO`);
      for (const id of notion.automatismesBO) {
        assert.match(id, /^(CM1|CM2|6|5|4|3)-\d{2}$/, `${notion.id} : identifiant « ${id} » mal formé`);
      }
    }
  });

  it("chaque notion possède au moins un gabarit", () => {
    for (const notion of MODULE.notions) {
      const gabarits = MODULE.gabarits.filter((g) => g.notion === notion.id);
      assert.ok(gabarits.length > 0, `${notion.id} : aucun gabarit`);
    }
  });

  it("RIEN n'est validé : seul Gwenaël peut cocher", () => {
    assert.equal(MODULE.validation.etat, "a-valider");
    for (const notion of MODULE.notions) {
      assert.notEqual(notion.validation.etat, "valide", `${notion.id} : validé sans Gwenaël`);
    }
    for (const gabarit of MODULE.gabarits) {
      assert.notEqual(gabarit.validation.etat, "valide", `${gabarit.id} : validé sans Gwenaël`);
    }
    assert.deepEqual(notionsPubliees(), [], "aucune notion ne doit être publiée");
  });

  it("rend compte de l'avancement", () => {
    const bilan = avancement();
    assert.equal(bilan.modules, 1);
    assert.equal(bilan.notions, 6);
    assert.equal(bilan.valide, 0);
    assert.equal(bilan["a-valider"], 6);
  });

  it("laisse ses questions ouvertes visibles", () => {
    assert.ok(MODULE_CRITERES_DIVISIBILITE.notions.length === 6);
  });
});
