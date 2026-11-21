import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// L'appli « Cours » de l'espace élève (lot « cours-appli », 08/11/2026).
// Le livret de cours de Gwenaël est fabriqué hors du dépôt (son dossier
// « Livret de cours\_moteur », « python build.py site <dépôt> ») : ce fichier
// garde ce que le dépôt en reçoit — les pages du dossier cours/ et le
// catalogue du serveur de suivi — et les quatre promesses du lot :
//  1. rien n'est enregistré de ce que l'élève ouvre (ni serveur, ni compteur,
//     ni stockage du navigateur) ;
//  2. les pages ne sont pas publiques au début (aucun lien du site, noindex) ;
//  3. chaque page a sa barre « ◀ Mes cours » qui ramène à l'espace élève ;
//  4. le catalogue et les pages se tiennent (aucune adresse sans page).

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const catalogue = JSON.parse(lire("_serveur/public/lib/cours.json"));
const MOTIF_CHAPITRE = /^[0-9]e-[A-Z]{2,8}$/;
const MOTIF_FICHE = /^[0-9]e-[A-Z]{2,8}-(?:[0-9]{2}|brevet)$/;
const MOTIF_PAGE = /^\/cours\/[0-9]e\/[0-9]e-[A-Z]{2,8}-(?:[0-9]{2}|brevet|imprimable)\.html$/;

function pagesDuDossier() {
  const pages = [];
  for (const niveau of readdirSync(join(racine, "cours"), { withFileTypes: true })) {
    if (!niveau.isDirectory()) continue;
    for (const f of readdirSync(join(racine, "cours", niveau.name))) pages.push(`/cours/${niveau.name}/${f}`);
  }
  return pages.sort();
}
function adressesDuCatalogue() {
  const adresses = new Set();
  catalogue.chapitres.forEach(c => {
    c.fiches.forEach(f => adresses.add(f.page));
    if (c.brevet) adresses.add(c.brevet.page);
    if (c.imprimable) adresses.add(c.imprimable);
  });
  return [...adresses].sort();
}

test("le catalogue du livret : des identifiants et des adresses de la bonne forme, chaque adresse a sa page, chaque page est au catalogue", () => {
  assert.ok(catalogue.chapitres.length >= 1, "au moins un chapitre");
  const vus = new Set();
  catalogue.chapitres.forEach(c => {
    assert.match(c.id, MOTIF_CHAPITRE, c.id);
    assert.ok(!vus.has(c.id), `${c.id} : une seule fois`);
    vus.add(c.id);
    assert.ok(c.titre && c.chapitre && c.niveau, `${c.id} : titre, chapitre, niveau`);
    c.fiches.forEach((f, i) => {
      assert.match(f.id, MOTIF_FICHE, f.id);
      assert.match(f.page, MOTIF_PAGE, f.page);
      assert.equal(f.n, i + 1, `${c.id} : les fiches numérotées dans l'ordre`);
      assert.equal(typeof f.nouveau, "boolean", `${f.id} : nouveau programme ou non`);
      assert.doesNotMatch(f.h1, /[<>{}]/, `${f.id} : un titre en texte simple`);
    });
    if (c.brevet) { assert.match(c.brevet.id, MOTIF_FICHE); assert.match(c.brevet.page, MOTIF_PAGE); }
    if (c.imprimable) assert.match(c.imprimable, MOTIF_PAGE);
  });
  assert.deepEqual(pagesDuDossier(), adressesDuCatalogue(), "le dossier cours/ et le catalogue disent la même chose");
});

test("une page du livret : autonome, pas d'index, pas de compteur, ni stockage, ni appel réseau ; la barre « ◀ Mes cours » et le chapitre d'où l'on vient", () => {
  for (const adresse of pagesDuDossier()) {
    const html = lire(adresse.slice(1));
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/, `${adresse} : noindex`);
    assert.match(html, /<link rel="icon" href="\/favicon\.ico"/, `${adresse} : l'icône du site`);
    assert.doesNotMatch(html, /<script[^>]*\bsrc=/, `${adresse} : aucun script chargé d'ailleurs`);
    assert.doesNotMatch(html, /compteur\.js|goatcounter/i, `${adresse} : le compteur de visites ne charge pas`);
    assert.doesNotMatch(html, /localStorage|sessionStorage|indexedDB|document\.cookie|fetch\(|XMLHttpRequest|sendBeacon/,
      `${adresse} : rien n'est retenu ni envoyé`);
    assert.match(html, /var SITE = \{"retour": "https:\/\/suivi\.mathsgo\.re\/#cours=", "chapitre": "[0-9]e-[A-Z]{2,8}"\};/,
      `${adresse} : le retour vers l'espace élève`);
    assert.match(html, /function poserBarreCours\(\)/, `${adresse} : la barre`);
    assert.match(html, /\/\^#ch=\(\[0-9\]e-\[A-Z\]\{2,8\}\)\$\//, `${adresse} : le chapitre lu dans l'adresse, vérifié`);
    assert.match(html, /\.barre-cours\{position:sticky;top:0/, `${adresse} : la barre reste collée en haut (choix du 08/11/2026)`);
    // Les liens d'une fiche vers une autre page du livret : des adresses du site.
    for (const [, href] of html.matchAll(/href:'([^']*)'/g)) {
      assert.match(href, MOTIF_PAGE, `${adresse} : lien ${href}`);
      assert.ok(existsSync(join(racine, href.slice(1))), `${adresse} : ${href} existe`);
    }
  }
});

test("le livret n'est pas public au début : aucune page du site ne le cite (catalogue, plan du site, annuaire)", () => {
  for (const fichier of ["sitemap.xml", "assets/js/catalogue-refonte-data.js", "outils/toutes-les-ressources.html", "index.html"]) {
    assert.doesNotMatch(lire(fichier), /\/cours\/[0-9]e\//, `${fichier} ne cite pas le livret`);
  }
});

test("le serveur : l'appli « cours » sans progression ; l'espace élève et Ma classe la montrent à part", () => {
  const applis = lire("_serveur/public/lib/applis.php");
  const bloc = applis.slice(applis.indexOf("    'cours' => ["), applis.indexOf("    'soley' => ["));
  assert.match(bloc, /'reglages' => \['chapitres' => 'cours', 'sans' => 'cours', 'avec' => 'cours'\]/);
  assert.doesNotMatch(bloc, /'par_eleve'/, "lot « cours-appli-3 » : des chapitres en plus pour quelques élèves");
  assert.match(bloc, /'compteur' => null/);
  const parcours = lire("_serveur/public/api/parcours.php");
  const connues = parcours.match(/const APPLIS_CONNUES = \[([^\]]*)\]/)[1];
  assert.doesNotMatch(connues, /'cours'/, "aucune progression « cours » ne s'écrit");
  // Les motifs du serveur sont ceux de ce test (et de l'espace élève).
  const cours = lire("_serveur/public/lib/cours.php");
  assert.match(cours, /const COURS_MOTIF_CHAPITRE = '\/\^\[0-9\]e-\[A-Z\]\{2,8\}\$\/';/);
  assert.match(cours, /const COURS_SITE = 'https:\/\/mathsgo\.re';/);
  const espace = lire("_serveur/public/index.php");
  // La porte « Mes cours » : la première des activités (choix de Gwenaël du 08/11/2026 ; lot B1 : une
  // porte longue, l'ordre des portes ne change plus), posée seulement si un chapitre est ouvert.
  assert.match(espace, /const rang = a => \(a\.cle === "cours" \? 0 : a\.cle === "splat" \? 2 : 1\);/, "la porte, en tête de la liste");
  assert.match(espace, /const visibles = disponibles\.filter\(a => a\.cle !== "cours" \|\| nCours\);/, "pas de porte sans chapitre ouvert");
  assert.match(espace, /if \(appli\.cle === "cours"\) \{ porte\.id = "cours-lien"; porte\.href = "#cours"; \}/, "elle mène à la liste des chapitres, sans billet");
  assert.match(espace, /"cours": '<svg class="icone"/, "son dessin, dans ICONES");
  assert.match(espace, /const ADRESSE_COURS = \/\^https:\\\/\\\/mathsgo\\\.re\\\/cours\\\//, "une adresse de fiche vérifiée");
  const blocEspace = espace.slice(espace.indexOf("// ------------------------------------------- l'appli Cours"), espace.indexOf("// Lot 8 : à la première entrée"));
  assert.ok(blocEspace.length > 1000, "le bloc de l'appli Cours");
  // Lot « cours-ouvertures » (10/11/2026) : une seule demande, celle qui note le jour d'ouverture
  // d'une fiche (api/cours.php) ; toujours rien dans la mémoire du téléphone.
  assert.doesNotMatch(blocEspace, /localStorage|sessionStorage/, "l'appli Cours ne retient rien dans le téléphone");
  assert.deepEqual([...blocEspace.matchAll(/(?:fetch|sendBeacon)\("([^"]*)"/g)].map(m => m[1]), ["api/cours.php", "api/cours.php"],
    "et ne demande rien d'autre que de noter l'ouverture");
  const gabarits = [...blocEspace.matchAll(/innerHTML = `([^`]*)`/g)].map(m => m[1]);
  assert.ok(gabarits.length >= 2, "les gabarits des cartes");
  gabarits.forEach(g => assert.ok([...g.matchAll(/\$\{([^}]*)\}/g)].every(m => ["FLECHE", 'icone("cours")'].includes(m[1])),
    "rien du serveur n'entre en HTML : seuls les dessins de la page (flèche, livre) sont insérés"));
  assert.doesNotMatch(blocEspace, /innerHTML = (?!`)/, "pas d'autre écriture en HTML");
  const prof = lire("_serveur/public/prof/index.php");
  assert.match(prof, /<button type="button" data-appli="cours" aria-pressed="false">Cours<\/button>/);
  assert.match(prof, /\{cle: "cours", nom: "Cours", unite: \["fiche", "fiches"\], sansSuivi: true\}/);
  assert.match(prof, /return APPLIS\.filter\(appli => !appli\.sansSuivi\)\.map\(appli => appli\.cle\);/, "pas de Cours dans le bilan de La classe");
  assert.match(prof, /<script type="application\/json" id="cours-catalogue" nonce="<\?= htmlspecialchars\(\$nonce, ENT_QUOTES\) \?>">/, "le catalogue posé en données, avec le nonce");
  assert.match(espace, /if \(Array\.isArray\(donnees\.cours\)\) copie\.cours = donnees\.cours;/, "la copie de l'onglet garde les chapitres seulement si la classe a l'appli");
});
