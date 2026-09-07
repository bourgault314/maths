import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");
const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");

// Lot serveur B du suivi (06/09/2026).
//
// Ce fichier garde les deux promesses du lot qui se vérifient SANS serveur :
// une restauration gagne contre l'appareil de l'élève (B0), et le verrou
// d'inactivité de la page prof survit au rechargement (B2). Le reste (freins,
// manifeste, mot de passe, .htaccess) est éprouvé par
// `_serveur/tests/lancer.php` et par tests/suivi-htaccess.test.mjs.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) retirer l'incrément d'époque de version_avec_epoque_relevee()
//  b) ne pas appeler version_avec_epoque_relevee() dans restaurer_progression()
//  c) faire repartir creerVeille de l'horloge au démarrage (reprendre → demarrer)
//  d) ne plus ranger l'instant du dernier geste à chaque geste

// ============================================================ B0 — la restauration gagne

// Un parcours où les tables listées sont acquises, à l'époque demandée.
function parcoursAvec(tables, epoque) {
  const parcours = PARCOURS.creerParcours();
  parcours.epoque = epoque;
  tables.forEach((table) => { parcours.tables[table].acquise = "2026-09-06"; });
  return PARCOURS.normaliserParcours(parcours);
}

test("B0 — à époque égale, la fusion ADDITIONNE : c'est le défaut vu en production", () => {
  // Le témoin du défaut, gardé exprès. C'est le comportement voulu du moteur
  // (« on garde le plus avancé des deux »), et c'est pour cela que le correctif
  // devait se faire côté serveur : ce n'est pas la fusion qu'il fallait
  // changer, c'est l'époque qu'il fallait relever.
  const appareil = parcoursAvec([2, 3], 0);
  const restaure = parcoursAvec([], 0);
  assert.deepEqual(PARCOURS.tablesAcquises(PARCOURS.fusionner(appareil, restaure)), [2, 3],
    "à époque égale, les deux tables de l'appareil survivent à une restauration à zéro");
});

test("B0 — une version restaurée à une époque plus haute gagne en bloc", () => {
  const appareil = parcoursAvec([2, 3], 3);
  const restaure = parcoursAvec([], 4);
  const fusion = PARCOURS.fusionner(appareil, restaure);
  assert.deepEqual(PARCOURS.tablesAcquises(fusion), [],
    "l'appareil adopte l'état restauré : zéro table");
  assert.equal(fusion.epoque, 4, "et il adopte aussi son époque");
  // Ce que l'appareil RENVOIE ensuite au serveur, c'est cet état-là : les deux
  // tables ne reviennent plus au tour suivant. C'est tout l'enjeu — le scénario
  // de Gwenaël convergeait vers « deux tables » à force de synchronisations.
  const renvoi = PARCOURS.fusionner(fusion, restaure);
  assert.deepEqual(PARCOURS.tablesAcquises(renvoi), [], "et il ne rend pas les dégâts au tour suivant");
});

test("B0 — le prénom de l'appareil survit à une restauration", () => {
  // « fusionner » garde le prénom du premier même quand une époque gagne :
  // l'élève ne doit pas perdre son prénom parce que le professeur a restauré.
  const appareil = parcoursAvec([2, 3], 3);
  appareil.prenom = "Léa";
  const restaure = parcoursAvec([], 4);
  assert.equal(PARCOURS.fusionner(appareil, restaure).prenom, "Léa");
});

test("B0 — le serveur relève l'époque à la restauration, sous le verrou", () => {
  const progression = lire("_serveur/public/lib/progression.php");
  const prof = lire("_serveur/public/api/prof.php");
  assert.match(progression, /function version_avec_epoque_relevee\(/,
    "lib/progression.php doit porter la fonction qui relève l'époque");
  assert.match(progression, /max\(epoque_de\(\$versJson\), epoque_de\(\$courantJson\)\) \+ 1/,
    "l'époque restaurée doit dépasser les DEUX états en présence, pas seulement l'un");
  assert.match(progression, /filtrer_progression\(\$appli, \$vers\)/,
    "et repasser par le filtre : rien n'entre par cette porte qui n'entrerait pas par l'autre");
  // Dans restaurer_progression(), l'appel doit précéder l'UPDATE : relever
  // l'époque après coup ne servirait à rien.
  const debut = prof.indexOf("function restaurer_progression(");
  assert.ok(debut > 0, "api/prof.php doit définir restaurer_progression()");
  const corps = prof.slice(debut, prof.indexOf("\ntry {", debut));
  const iReleve = corps.indexOf("version_avec_epoque_relevee(");
  const iEcriture = corps.indexOf("UPDATE progressions SET donnees =");
  assert.ok(iReleve > 0, "restaurer_progression() doit relever l'époque de la version restaurée");
  assert.ok(iReleve < iEcriture, "et le faire AVANT d'écrire");
});

test("B0 — Ma classe annonce que l'appareil de l'élève adoptera la version", () => {
  const page = lire("_serveur/public/prof/index.php");
  assert.match(page, /adoptera cette version à sa prochaine connexion/,
    "le message de retour doit dire ce qui va se passer sur la tablette de l'élève");
});

// ============================================================ B2 — le verrou survit au F5

const PAGE = "_serveur/public/prof/index.php";
const page = lire(PAGE);
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = (() => {
  const debut = page.indexOf(BALISE);
  const fin = page.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne de la page prof doit être trouvé");
  return page.slice(debut, fin);
})();

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") {
      profondeur -= 1;
      if (profondeur === 0) return source.slice(position, i + 1);
    }
  }
  throw new Error("bloc non fermé");
}

function fonction(nom) {
  const position = script.indexOf(`function ${nom}(`);
  assert.ok(position > 0, `la page doit définir ${nom}()`);
  return blocDepuis(script, position);
}

const creerVeille = new Function(`${fonction("creerVeille")}\nreturn creerVeille;`)();

// Un sessionStorage de poche : ce que l'onglet garde d'un rechargement à l'autre.
function fauxRangement(valeurInitiale) {
  let valeur = valeurInitiale === undefined ? null : valeurInitiale;
  return {
    lire: () => Number(valeur) || 0,
    ecrire: (v) => { valeur = v > 0 ? String(v) : null; },
    contenu: () => valeur,
  };
}

const MINUTE = 60000;
const T0 = 1_000_000_000_000;

test("B2 — chaque geste range l'instant, et le rechargement le relit", () => {
  const rangement = fauxRangement();
  const veille = creerVeille(30 * MINUTE, rangement.lire, rangement.ecrire);
  veille.demarrer(T0);
  assert.equal(rangement.contenu(), String(T0), "la connexion range l'instant");
  veille.geste(T0 + 5 * MINUTE);
  assert.equal(rangement.contenu(), String(T0 + 5 * MINUTE), "et chaque geste le remplace");

  // F5 : une page toute neuve, le même onglet, le même rangement.
  const apresF5 = creerVeille(30 * MINUTE, rangement.lire, rangement.ecrire);
  apresF5.reprendre(T0 + 36 * MINUTE);
  assert.equal(apresF5.doitFermer(T0 + 36 * MINUTE), true,
    "31 minutes après le dernier geste, un F5 doit fermer la session");
});

test("B2 — sans le rangement, le F5 rendait la page à qui la trouvait", () => {
  // Le défaut, gardé en toutes lettres : demarrer() repartait de l'horloge, si
  // bien qu'un rechargement remettait le compteur à zéro et rendait « Mes
  // classes » pendant les quatre heures de la session serveur.
  const rangement = fauxRangement();
  const veille = creerVeille(30 * MINUTE, rangement.lire, rangement.ecrire);
  veille.demarrer(T0);
  const apresF5 = creerVeille(30 * MINUTE, rangement.lire, rangement.ecrire);
  apresF5.demarrer(T0 + 36 * MINUTE); // l'ancien comportement
  assert.equal(apresF5.doitFermer(T0 + 36 * MINUTE), false,
    "témoin : repartir de l'horloge ne ferme rien — c'est exactement le défaut corrigé");
});

test("B2 — un onglet neuf ne ferme rien, et la déconnexion vide le rangement", () => {
  const rangement = fauxRangement();
  const veille = creerVeille(30 * MINUTE, rangement.lire, rangement.ecrire);
  // Aucun instant rangé (premier passage) : on repart de maintenant.
  veille.reprendre(T0);
  assert.equal(veille.doitFermer(T0 + 29 * MINUTE), false);
  assert.equal(veille.doitFermer(T0 + 30 * MINUTE), true);
  veille.arreter();
  assert.equal(rangement.contenu(), null, "la déconnexion efface l'instant du dernier geste");
  assert.equal(veille.doitFermer(T0 + 10 * 3600 * 1000), false, "et plus rien à fermer");
});

test("B2 — la page relit le rangement au démarrage et se déconnecte avant d'afficher", () => {
  assert.match(script, /const CLE_GESTE = "mathsgo-suivi-prof-dernier-geste";/,
    "la clé du dernier geste doit être celle attendue");
  assert.match(script, /sessionStorage\.getItem\(CLE_GESTE\)/, "elle se relit");
  assert.match(script, /sessionStorage\.setItem\(CLE_GESTE, String\(valeur\)\)/, "et elle s'écrit");
  // L'amorce de la page : reprendre(), puis fermer AVANT demarrer().
  const amorce = script.slice(script.lastIndexOf("const avis = lireAvis();"));
  assert.match(amorce, /veille\.reprendre\(Date\.now\(\)\)/, "l'amorce reprend le dernier geste rangé");
  const iFermer = amorce.indexOf("veille.doitFermer(Date.now())");
  const iDemarrer = amorce.indexOf("else demarrer();");
  assert.ok(iFermer > 0 && iDemarrer > iFermer,
    "la décision de fermer doit précéder l'affichage : demarrer() ne part que sinon");
  assert.match(fonction("demarrer"), /veille\.reprendre\(Date\.now\(\)\)/,
    "demarrer() ne doit plus remettre le compteur à zéro");
});

// ============================================================ B9 — actions épinglées

test("B9 — chaque action GitHub est épinglée par SHA de 40 caractères", () => {
  for (const fichier of [".github/workflows/verifications.yml", ".github/workflows/publier.yml"]) {
    const contenu = lire(fichier);
    const usages = [...contenu.matchAll(/^\s*uses:\s*(\S+)/gm)].map((m) => m[1]);
    assert.ok(usages.length > 0, `${fichier} doit employer des actions`);
    for (const usage of usages) {
      assert.match(usage, /@[0-9a-f]{40}$/,
        `${fichier} : « ${usage} » doit être épinglé par SHA — une étiquette « v4 » se déplace, `
          + "et celui qui la déplace exécute son code dans la CI avec le jeton du dépôt.");
    }
  }
});
