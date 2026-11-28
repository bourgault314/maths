// Défi calcul, lot 2a : le format définitif de la progression (version 1,
// une boîte par compétence ; version 2 au lot 3 : `t`, plus de `test`), la
// fusion, le rangement par code, et l'hygiène de la page. La séance guidée a
// ses tests dans defi-calcul-seance.test.mjs.

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

import {CLES_DECLAREES, parcoursComplet} from "../scripts/generer-parcours-reference-defi-calcul.mjs";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
// Lot F4 : ces tests suivent le parcours module par module — les tests de
// palier y sont déjà joués (tests/defi-calcul-lot-F4.test.mjs les joue).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});

const CARTE = CORE.carte();
const JOUR = "2026-10-06";
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

function fauxStockage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    cles: () => [...m.keys()],
    brut: k => m.get(k)
  };
}

// Un entraînement réussi (2 justes avec l'outil, 5 sans), ou raté (jamais 5 de suite).
const reponses = reussi => (reussi
  ? [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))]
  : Array.from({length: 20}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"})));
const entrainer = (parcours, module, niveau, {reussi = true, jour = JOUR, causes = {}} = {}) =>
  P.appliquerSerie(parcours, {module, niveau, genre: "entraine", reponses: reponses(reussi), causes}, {aujourdhui: jour, carte: CARTE});

test("les dates : jour local, lundi, délais des boîtes, séances de la semaine", () => {
  assert.equal(P.jourLocal(new Date(2026, 9, 3, 23, 30)), "2026-10-03");
  assert.equal(P.ajouterJours("2026-10-31", 1), "2026-11-01");
  assert.equal(P.ecartJours("2026-10-01", "2026-10-08"), 7);
  assert.equal(P.lundiDe("2026-10-03"), "2026-09-28");
  // Les délais du document : 1, 1, 3, 7, 14 jours.
  assert.deepEqual([1, 2, 3, 4, 5].map(b => P.ecartJours(JOUR, P.echeanceDeBoite(b, JOUR))), [1, 1, 3, 7, 14]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(P.couleurDeBoite), ["gris", "rouge", "bleu", "bleu", "vert", "vert"]);
  const p = sansTestDePalier(P.creerParcours());
  p.seances = ["2026-09-27", "2026-09-28", "2026-10-03", "2026-10-03"];
  // « 3 fois cette semaine » : les séances finies depuis lundi, pas les jours.
  assert.deepEqual(P.bilanSeances(P.normaliserParcours(p), "2026-10-03"), {semaine: 3, aujourdhui: 2});
});

test("la page : au catalogue à sa propre adresse, sans menus pour l'élève, sans rien de Défi tables", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  // Au catalogue depuis le 06/11/2026 (avant d'être finie) ; l'ancien défi
  // chronométré reste à son adresse, hors catalogue et non indexé.
  assert.match(page, /<meta name="robots" content="index, follow, max-image-preview:large">/);
  assert.match(page, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/calcul_mental\/defi_calcul_modules\.html">/);
  assert.match(await lire("../outils/calcul_mental/defi_calcul.html"), /<meta name="robots" content="noindex, follow">/);
  ["defi_calcul_core.js", "defi_calcul_mon_parcours.js", "defi_calcul_aides.js", "defi_calcul.css"].forEach(fichier => {
    assert.match(page, new RegExp(`\\./${fichier.replace(".", "\\.")}\\?v=\\d{8}-\\d+"`), `${fichier} chargé avec son ?v=`);
  });
  assert.doesNotMatch(page, /<script[^>]+src="https?:/, "aucun script d'un autre domaine");
  // Modules lot 3 (décision du 01/11) : M4 renvoie vers Défi tables par
  // un lien, une seule fois ; la page ne charge ni ne lit rien de Défi
  // tables (ni script, ni mémoire).
  assert.equal((page.match(/defi[-_]tables/gi) || []).length, 1, "une seule mention : le lien du renvoi");
  assert.match(page, /lien\.href = "\.\/defi_tables\.html";/);
  assert.equal((page.match(/\.\.\.renvoiTables\(serie\)/g) || []).length, 2, "le renvoi : au bilan de l'entraînement et à la fin de la séance");
  assert.match(page, /lien\.target = "_blank";/, "Défi tables s'ouvre à côté : la séance reste ouverte");
  assert.doesNotMatch(page.replace('lien.href = "./defi_tables.html";', ""), /defi[-_]tables/i, "la page ne charge ni ne nomme rien d'autre de Défi tables");
  // Modules lot 4 (décision du 04/11) : C1 se manipule en touchant le calcul
  // à faire en premier ; J'apprends et l'entraînement passent par le même
  // aiguillage que les perles et le glisse-nombres.
  assert.match(page, /if \(options\.outil === "toucher"\) return AIDES\.toucherCalcul\(zone, options\);/);
  // Modules lot 5 : le carré de 100 (D1), le tableau à jetons (D4) ; les
  // fractions écrites comme au cahier ; la touche « , » cachée quand la case
  // est un numérateur.
  assert.match(page, /if \(options\.outil === "carre"\) return AIDES\.carreManip\(zone, options\);/);
  assert.match(page, /if \(options\.outil === "jetons"\) return AIDES\.jetonsManip\(zone, options\);/);
  // Modules lot 6 : les bandes du site sur la droite graduée (F2, F5, F6, F8) ;
  // le schéma en barres a des parts à compter (le pavé rapetisse avant lui).
  assert.match(page, /if \(options\.outil === "bandes"\) return AIDES\.bandesManip\(zone, options\);/);
  assert.match(page, /image\.matches\("svg\.dc-numeration, svg\.dc-carre, svg\.dc-fractions"\)/);
  assert.match(page, /return AIDES\.noeudsCalcul\(texte, \{caseReponse, insecable, signes: true\}\);/, "le calcul : ses fractions");
  // Relecture 1 (06/11/2026) : la phrase, puis le calcul sur sa ligne ; les
  // deux passent toujours par ecrireTexte (leurs fractions).
  assert.match(page, /AIDES\.ecrireTexte\(\$\("retenir-phrase"\), AIDES\.souderCalculs\(serie\.apprends\.bilan\)\);/, "« À retenir » : ses fractions");
  assert.match(page, /AIDES\.ecrireTexte\(calcul, deux\.calcul\);/, "« À retenir » : les fractions du calcul sur sa ligne");
  // Modules lot 6b : la touche suit le niveau (F3 : le niveau 3 seulement).
  assert.match(page, /\$\("touches"\)\.hidden = !CORE\.virguleDuTexte\(id, texte, niveau\);/);
  assert.match(page, /renderTouches\(question\.calcul\.module, question\.calcul\.texte, question\.calcul\.niveau\);/);
  assert.match(page, /renderTouches\(serie\.module, apprends\.represente\.texte, serie\.niveau\);/);
  // Les billes de F3 (lot 6b).
  assert.match(page, /if \(options\.outil === "billes"\) return AIDES\.billesManip\(zone, options\);/);
  assert.equal((page.match(/state\.manip = creerManip\(\$\("aide"\), options\);/g) || []).length, 2, "Je manipule et l'entraînement");
  assert.equal((page.match(/appli: "defi-calcul"/g) || []).length, 3, "lecture, billet, envoi : appli « defi-calcul »");
  assert.match(page, /\/\/ \[suivi:debut\][\s\S]+\/\/ \[suivi:fin\]/);
  assert.match(page, /MATHSGO_ENTREE/);
  // Les mots de l'élève, repris de Défi tables, des maquettes et des planches de l'étape 5a.
  // Lot K1 « la carte » (planches K0 et K1 validées) : « La carte »,
  // « Commencer », « Je tente », « Étoile gagnée », « Ceinture suivante »…
  ["Comment ça marche", "Mes calculs du jour", "La carte", "Commencer", "Continuer", "Encore une séance", "À demain",
    "Je tente", "J’apprends", "Je m’entraîne encore", "Tente toute la ceinture", "Étoile gagnée", "Étoile suivante", "Ceinture suivante",
    "Arrêter la séance", "Séance terminée", "On continue demain", "Tout est gagné.", "C’est fait.",
    "Deux calculs faux : l’étoile est partie.", "Tu peux la regagner quand tu veux.", "Tes calculs du jour sont faits.",
    "Je recopie cela dans mon cahier.", "Suivi · travail gardé ici", "C’est toujours toi", "Nouveau",
    "Mode professeur", "rien n’est enregistré", "Un autre, pour vérifier.", "Je ne sais pas", "Page ancienne : recharge la page."].forEach(mot => assert.ok(page.includes(mot), mot));
  // Partis avec l'ancien accueil (lot K1).
  ["Ma séance du jour", "Puis j’avance dans mon parcours", "Refaire une séance", "fois cette semaine", "Module solide ★ !", "Pas encore"]
    .forEach(mot => assert.ok(!page.includes(mot), `« ${mot} » est parti`));
  // « Je valide » n'existe plus, pour personne ; l'élève n'a plus de menus dans la page.
  ["Je valide", "Validation", "Juste, mais trop long", "trop lentement", "acc-valide", "Module validé", "validé !"].forEach(mot =>
    assert.equal(page.includes(mot), false, `« ${mot} » ne devrait plus être dans la page`));
  // La pilule du professeur est cachée dans la page telle qu'elle arrive.
  // (Lot K1 : plus de liens du professeur sur l'accueil — toutes les étoiles
  // de la carte lui sont ouvertes.)
  assert.match(page, /<p id="prof-pilule" class="prof-pilule" hidden>/);
  // « Comment ça marche ? » : les cinq lignes validées par Gwenaël le 25/11/2026 (lot K1).
  const notice = page.slice(page.indexOf('<div class="notice">'), page.indexOf("</div>", page.indexOf('<div class="notice">')));
  assert.deepEqual([...notice.matchAll(/<p><b>([^<]+)<\/b>/g)].map(m => m[1].replace(/&nbsp;/g, " ")),
    ["Ma séance.", "Mes calculs du jour.", "Je tente.", "J’apprends.", "Mes ceintures."]);
  // Les restes de Défi tables : plus de « #calculs » dans l'adresse.
  assert.equal(/brut === "calculs"/.test(page), false);
  // Ni code de module ni niveau de classe côté élève : la page ne les écrit nulle part en dur.
  assert.equal(/\b(CM1|CM2|6e|5e|4e|3e)\b/.test(page.replace(/<script[\s\S]*?<\/script>/g, "")), false, "aucun niveau de classe dans la page");
  // Au catalogue et au plan du site à la place de l'ancien Défi calcul
  // (06/11/2026), qui reste en ligne sans avoir bougé.
  const catalogue = await lire("../assets/js/catalogue-refonte-data.js");
  assert.match(catalogue, /"path": "outils\/calcul_mental\/defi_calcul_modules\.html"/);
  assert.doesNotMatch(catalogue, /"path": "outils\/calcul_mental\/defi_calcul\.html"/);
  const plan = await lire("../sitemap.xml");
  assert.match(plan, /defi_calcul_modules\.html/);
  assert.doesNotMatch(plan, /defi_calcul\.html/);
  assert.match(await lire("../outils/calcul_mental/defi_calcul.html"), /const TOTAL = 30;/);
  // Les trois scripts s'installent sous leur nom, sans se marcher dessus.
  for (const [fichier, nom] of [["defi_calcul_core.js", "MATHSGO_DEFI_CALCUL_CORE"], ["defi_calcul_mon_parcours.js", "MATHSGO_DEFI_CALCUL_MON_PARCOURS"], ["defi_calcul_aides.js", "MATHSGO_DEFI_CALCUL_AIDES"]]) {
    assert.ok((await lire(`../outils/calcul_mental/${fichier}`)).includes(`root.${nom} = api`), nom);
  }
});

// ---------------------------------------------------------------- lot 2b
//
// Le serveur apprend Défi calcul (31/10/2026) : ce que lib/applis.php déclare
// doit couvrir ce que le moteur produit, et resumeProf — ce que lisent « Ma
// classe » et la tuile de Mon espace — rend l'état de chaque compétence sans
// que la page touche aux boîtes.

test("lib/applis.php déclare pour « defi-calcul » les clés du moteur, les 74 codes et les numéros de cause, sans mot, le compteur « seances »", async () => {
  const applis = await lire("../_serveur/public/lib/applis.php");
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  assert.match(bloc, /'disponible' => true,/);
  assert.match(bloc, /'url' => 'https:\/\/mathsgo\.re\/outils\/calcul_mental\/defi_calcul_modules\.html',/);
  const cles = bloc.match(/'cles' => \[([\s\S]*?)\],/)[1].match(/'(\w+)'/g).map(c => c.replace(/'/g, ""));
  assert.deepEqual(cles, [...CLES_DECLAREES], "les clés déclarées, dans l'ordre du générateur");
  assert.match(bloc, /'mots' => \[\],/, "aucun mot : le format n'a pas de texte");
  const motifs = [...bloc.matchAll(/'\/(\^[^']+\$)\/'/g)].map(m => new RegExp(m[1]));
  assert.equal(motifs.length, 2, "deux motifs : les codes de module, les numéros de cause");
  P.CODES.forEach(code => assert.ok(motifs[0].test(code), `code non couvert : ${code}`));
  ["A", "A2-3", "ZZ9", "a2", "A20"].forEach(faux => assert.ok(!motifs[0].test(faux), `code accepté à tort : ${faux}`));
  const codesDuMotif = motifs[0].source.replace(/^\^\(\?:|\)\$$/g, "").split("|");
  assert.deepEqual(codesDuMotif, [...P.CODES], "le motif est la liste exacte des codes du moteur, dans son ordre");
  ["1", "12", "0", "99"].forEach(c => assert.ok(motifs[1].test(c)));
  ["123", "abc", "1a", ""].forEach(c => assert.ok(!motifs[1].test(c)));
  assert.match(bloc, /'compteur' => 'seances',/);
  // Lot F1 (07/11/2026) : un seul réglage de classe, le nombre de
  // nouveautés par séance (1 à 3, 1 par défaut).
  // (Lot K1b : six étages — le réglage s'appelle « etage », 6 par défaut ; l'ancien « palier » se relit encore.)
  assert.match(bloc, /'reglages' => \['minutes' => \['choix' => \[10, 15\]\], 'etage' => \['choix' => \[6, 1, 2, 3, 4, 5\]\]\],/, "lot 1 : la durée ; lot K1b : l'étage");
  // (Correctif K1b : « rendu » — l'ancien « palier » que reçoit, à côté d'« etage », une page de version 12 restée ouverte.)
  assert.match(bloc, /'reglages_anciens' => \['palier' => \['vers' => 'etage', 'valeurs' => \[1 => 3, 2 => 4, 3 => 5, 4 => 6\],\s+'rendu' => \[1 => 1, 2 => 1, 3 => 1, 4 => 2, 5 => 3, 6 => 4\]\]\],/);
  assert.match(await lire("../_serveur/public/api/parcours.php"), /const APPLIS_CONNUES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat'\];/);
  assert.match(await lire("../_serveur/public/api/prof.php"), /const APPLIS_PROPOSABLES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat', 'cours'\];/);
  // La référence écrite pour le serveur est bien celle du générateur.
  const ecrite = JSON.parse(await lire("../_serveur/tests/parcours-reference-defi-calcul.json"));
  assert.deepEqual(ecrite, parcoursComplet(), "_serveur/tests/parcours-reference-defi-calcul.json est à regénérer : node scripts/generer-parcours-reference-defi-calcul.mjs --ecrire");
});

test("l'appli : le fil dit « Ma séance », puis l'étape (« Je tente : … ») ; au téléphone, seul le début", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  // (Lot K1 : plus de test de module, plus de « Tu connais déjà ? » ; plus
  // de pastilles numérotées.)
  assert.match(page, /if \(etape\.type === "tente"\) return `Je tente : \$\{nom\}`;/);
  // (Lot P1 : « Toute la ceinture » n'existe plus.)
  assert.doesNotMatch(page, /Toute la ceinture/);
  assert.match(page, /titre\.textContent = "Ma séance";/);
  assert.match(page, /quoi\.className = "quoi";/);
  const css = await lire("../outils/calcul_mental/defi_calcul.css");
  assert.match(css, /#play \.seance-fil\.seance \.quoi \{ display: none; \}/, "au téléphone, la suite du nom disparaît");
});
// 05/11/2026 : sous « J'apprends » (Mon module) et en fin de séance après
// deux entraînements ratés (« Demain, on reprend … »), chaque niveau
// construit a sa phrase — jamais « undefined », jamais « avec la droite »
// quand il n'y a pas de droite.
test("Mon module et la fin de séance : chaque niveau construit dit avec quoi il apprend", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const objet = nom => Function(`return ${page.match(new RegExp(`const ${nom} = Object\\.freeze\\((\\{[\\s\\S]*?\\})\\);`))[1]};`)();
  const detail = objet("DETAIL_APPRENDS");
  const reprise = objet("REPRISE");
  const image = objet("OUTILS_IMAGE");
  // (Lot C4a : les perles, puis le tableau de numération.)
  const outil = a => (a.manipule && a.manipule.outil === "perles" && a.represente.outil === "tableau-rang" ? "perles-tableau" : a.manipule ? a.manipule.outil : image[a.represente.outil] || "aucun");
  const SANS_DROITE = ["C3", "M10", "M12", "D1", "F2", "F5", "F6", "F8", "F1", "F3"];
  CORE.MODULES.filter(m => m.construit).forEach(m => m.niveaux.forEach(n => {
    const cle = outil(n.apprends);
    assert.equal(typeof detail[cle], "string", `${m.id}-${n.n} : J'apprends ${cle}`);
    assert.equal(typeof reprise[cle], "string", `${m.id}-${n.n} : demain, on reprend ${cle}`);
    if (SANS_DROITE.includes(m.id)) assert.notEqual(cle, "aucun", `${m.id}-${n.n} : pas de droite`);
  }));
  assert.equal(detail[outil(CORE.niveauDe("D4-1").niveau.apprends)], "avec le tableau à jetons");
  // (Lot C4d : au-delà de 12 parts, la leçon de « Fractions égales : diviser » a les flèches.)
  assert.equal(reprise[outil(CORE.niveauDe("F6-3").niveau.apprends)], "avec les flèches");
  assert.equal(detail[outil(CORE.niveauDe("F6-3").niveau.apprends)], "avec les flèches en haut et en bas");
  assert.equal(reprise[outil(CORE.niveauDe("F6-2").niveau.apprends)], "avec le schéma en barres");
  assert.equal(detail[outil(CORE.niveauDe("F2-1").niveau.apprends)], "avec les bandes de fractions");
  // Modules lot 6b : F1 les bandes, F3 les billes, puis le schéma (F3-3).
  assert.equal(detail[outil(CORE.niveauDe("F1-1").niveau.apprends)], "avec les bandes de fractions");
  assert.equal(detail[outil(CORE.niveauDe("F3-1").niveau.apprends)], "avec les billes");
  assert.equal(reprise[outil(CORE.niveauDe("F3-2").niveau.apprends)], "avec les billes");
  assert.equal(detail[outil(CORE.niveauDe("F3-3").niveau.apprends)], "avec le schéma en barres");
  // Lot C4a : plus de droite dans « Ajouter, retrancher des dizaines ».
  assert.equal(detail[outil(CORE.niveauDe("A3-1").niveau.apprends)], "avec les perles et le tableau de numération");
  assert.equal(detail[outil(CORE.niveauDe("A3-2").niveau.apprends)], "avec le tableau de numération");
  assert.equal(detail[outil(CORE.niveauDe("M12-1").niveau.apprends)], "avec le tableau de numération");
  assert.match(page, /if \(apprends\.manipule && apprends\.manipule\.outil === "perles" && apprends\.represente\.outil === "tableau-rang"\) return "perles-tableau";/);
});

// Modules lot 6b (05/11/2026, choix de Gwenaël sur la planche avant/après) :
// dans les étapes de J'écris, les fractions s'écrivent à 0,78 de la taille
// du texte (à 0,52, « 1/2 = 50/100 » faisait 11 pixels au téléphone).
test("J'écris : les fractions des étapes se lisent au téléphone", async () => {
  const css = await lire("../outils/calcul_mental/defi_calcul.css");
  assert.match(css, /\.expression\.dc-lignes \.lg \.cel \.dc-frac \{ font-size: \.78em; line-height: 1; \}/);
  // Sur ordinateur : 0,6, et le dessin un peu plus petit (la carte tient à 1366 × 768).
  assert.match(css, /@media \(min-width: 621px\) \{\n  \.expression\.dc-lignes \.lg \.cel \.dc-frac \{ font-size: \.6em; \}/);
  assert.match(css, /\.challenge-playing \.question\.ecrit\.aide-image \.dc-aide svg\.dc-fractions \{ max-height: 20dvh; \}/);
  assert.doesNotMatch(css, /\.challenge-playing \.question\.ecrit\.aide-image \.dc-aide svg\.dc-fractions \{ max-height: 28dvh; \}/);
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /defi_calcul\.css\?v=20261128-1/);
});
