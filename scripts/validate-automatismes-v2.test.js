// Le garde-fou du périmètre V2 se teste lui-même : un contrôle qu'on n'a
// jamais vu refuser quelque chose ne prouve rien. Chaque règle est donc
// vérifiée sur un dossier d'essai, et le périmètre réel doit rester propre.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  EXEMPTIONS,
  INTERDITS,
  RACINES_V2,
  analyserPerimetre,
  verifierProvenance,
} from "./validate-automatismes-v2.mjs";

const RACINE_ESSAI = "packages/objets/src";

/** Écrit un fichier d'essai dans un dépôt jetable et analyse ce dépôt. */
function analyserSource(contenu, { nom = "essai.js", exemptions = {} } = {}) {
  const base = mkdtempSync(join(tmpdir(), "mathsgo-v2-"));
  try {
    mkdirSync(join(base, RACINE_ESSAI), { recursive: true });
    writeFileSync(join(base, RACINE_ESSAI, nom), contenu, "utf8");
    return analyserPerimetre({ base, racines: [RACINE_ESSAI], exemptions });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

const motifsDe = (erreurs) => erreurs.map((erreur) => erreur.split(" : ").at(-1));

describe("périmètre déclaré", () => {
  it("couvre le lecteur et les cinq dossiers de la fondation", () => {
    assert.deepEqual(RACINES_V2, [
      "automatismes-v2",
      "packages/contrats/src",
      "packages/moteur-exercices/src",
      "packages/automatismes/src",
      "packages/objets/src",
      "packages/charte/src",
    ]);
  });

  it("le périmètre réel du dépôt ne contient aucun manquement", () => {
    const analyse = analyserPerimetre();
    const provenance = verifierProvenance();
    const erreurs = [...analyse.erreurs, ...provenance.erreurs];
    assert.deepEqual(erreurs, [], erreurs.join("\n"));
    const { fichiers } = analyse;
    assert.ok(fichiers.length > 40, `périmètre étrangement petit : ${fichiers.length} fichiers`);
  });

  it("surveille bien les objets visuels, pas seulement les contrats", () => {
    const { fichiers } = analyserPerimetre();
    assert.ok(fichiers.some((chemin) => chemin.startsWith("automatismes-v2/")));
    assert.ok(fichiers.some((chemin) => chemin.startsWith("packages/objets/src/")));
    assert.ok(fichiers.some((chemin) => chemin.startsWith("packages/charte/src/")));
  });
});

describe("provenance de chaque fichier de production", () => {
  function verifierDepotEssai(fichiers, registre) {
    const base = mkdtempSync(join(tmpdir(), "mathsgo-provenance-"));
    try {
      for (const [nom, contenu] of Object.entries(fichiers)) {
        const chemin = join(base, RACINE_ESSAI, nom);
        mkdirSync(join(chemin, ".."), { recursive: true });
        writeFileSync(chemin, contenu, "utf8");
      }
      return verifierProvenance({ base, racines: [RACINE_ESSAI], registre });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  }

  const origineValide = {
    statut: "original_mathsgo",
    source: "écrit pour le dépôt d'essai",
  };

  it("refuse un nouveau fichier oublié dans le registre", () => {
    const { erreurs } = verifierDepotEssai({ "nouveau.js": "export const x = 1;\n" }, {});
    assert.deepEqual(erreurs, [`${RACINE_ESSAI}/nouveau.js : provenance non déclarée`]);
  });

  it("refuse une déclaration qui désigne un fichier disparu", () => {
    const chemin = `${RACINE_ESSAI}/disparu.js`;
    const { erreurs } = verifierDepotEssai({}, { [chemin]: origineValide });
    assert.deepEqual(erreurs, [`${chemin} : déclaration de provenance fantôme`]);
  });

  it("refuse une déclaration sans statut connu ni source", () => {
    const chemin = `${RACINE_ESSAI}/invalide.js`;
    const { erreurs } = verifierDepotEssai(
      { "invalide.js": "export const x = 1;\n" },
      { [chemin]: { statut: "inconnu", source: "" } },
    );
    assert.deepEqual(erreurs, [
      `${chemin} : statut de provenance inconnu`,
      `${chemin} : source de provenance manquante`,
    ]);
  });

  it("refuse un fichier hérité sans chantier de remplacement", () => {
    const chemin = `${RACINE_ESSAI}/herite.js`;
    const { erreurs } = verifierDepotEssai(
      { "herite.js": "export const x = 1;\n" },
      {
        [chemin]: {
          statut: "herite_doctools",
          source: "archive historique",
        },
      },
    );
    assert.deepEqual(erreurs, [`${chemin} : dette héritée sans remplacement décrit`]);
  });

  it("accepte une déclaration complète et ignore le fichier de test associé", () => {
    const chemin = `${RACINE_ESSAI}/module.js`;
    const { fichiers, erreurs } = verifierDepotEssai(
      {
        "module.js": "export const x = 1;\n",
        "module.test.js": "// suit la provenance de module.js\n",
      },
      { [chemin]: origineValide },
    );
    assert.deepEqual(erreurs, []);
    assert.deepEqual(fichiers, [chemin]);
  });
});

describe("chaque règle refuse ce qu'elle annonce", () => {
  it("refuse un hasard non seedé", () => {
    const { erreurs } = analyserSource("export const x = Math.random();\n");
    assert.deepEqual(motifsDe(erreurs), ["hasard non seedé interdit dans V2"]);
  });

  it("refuse un identifiant historique", () => {
    const { erreurs } = analyserSource('export const source = "dnb_35";\n');
    assert.deepEqual(motifsDe(erreurs), ["identifiant historique interdit dans V2"]);
  });

  it("refuse le mini-langage de calcul d'origine", () => {
    const { erreurs } = analyserSource(`export const champ = "${["formula", "code"].join("_")}";\n`);
    assert.deepEqual(motifsDe(erreurs), ["programme textuel hérité interdit dans V2"]);
  });

  it("refuse l'exécution dynamique", () => {
    const parEval = analyserSource("export const x = eval('1+1');\n");
    const parFonction = analyserSource("export const f = new Function('return 1');\n");
    assert.deepEqual(motifsDe(parEval.erreurs), ["évaluation dynamique interdit dans V2"]);
    assert.deepEqual(motifsDe(parFonction.erreurs), [
      "construction dynamique de fonction interdit dans V2",
    ]);
  });

  it("refuse une dépendance vers studio/ ou auto/", () => {
    const versStudio = analyserSource('import { a } from "../../../studio/components/x.js";\n');
    const versAuto = analyserSource('import { b } from "../../../auto/scripts/y.js";\n');
    assert.deepEqual(motifsDe(versStudio.erreurs), ["dépendance hors du périmètre V2 interdit dans V2"]);
    assert.deepEqual(motifsDe(versAuto.erreurs), ["dépendance hors du périmètre V2 interdit dans V2"]);
  });

  it("laisse passer une importation interne à packages/", () => {
    const { erreurs } = analyserSource('import { COULEURS } from "../../charte/src/charte.js";\n');
    assert.deepEqual(erreurs, []);
  });
});

describe("dispense du registre de provenance", () => {
  const nom = "provenance.js";
  const dispense = { [`${RACINE_ESSAI}/${nom}`]: ["identifiant historique", "programme textuel hérité"] };

  it("le registre peut nommer la dette héritée", () => {
    const source = `export const DETTE = { dnb_35: "${["formula", "code"].join("_")} à retirer" };\n`;
    const { erreurs } = analyserSource(source, { nom, exemptions: dispense });
    assert.deepEqual(erreurs, []);
  });

  it("mais reste soumis aux autres règles", () => {
    const { erreurs } = analyserSource("export const x = Math.random();\n", { nom, exemptions: dispense });
    assert.deepEqual(motifsDe(erreurs), ["hasard non seedé interdit dans V2"]);
  });

  it("les dispenses réelles ne couvrent que ces deux fichiers", () => {
    assert.deepEqual(Object.keys(EXEMPTIONS), [
      "packages/objets/src/provenance.js",
      "packages/objets/src/provenance.test.js",
    ]);
    for (const regles of Object.values(EXEMPTIONS)) {
      assert.deepEqual(regles, ["identifiant historique", "programme textuel hérité"]);
    }
  });

  it("aucune dispense ne porte sur une règle inexistante", () => {
    const noms = INTERDITS.map((interdit) => interdit.nom);
    for (const regles of Object.values(EXEMPTIONS)) {
      for (const regle of regles) assert.ok(noms.includes(regle), `règle inconnue : ${regle}`);
    }
  });
});
