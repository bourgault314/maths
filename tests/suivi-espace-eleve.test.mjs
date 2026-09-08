import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = join(racine, "_serveur/public/index.php");
const CATALOGUE = join(racine, "_serveur/public/lib/applis.php");
const page = readFileSync(PAGE, "utf8");
const catalogue = readFileSync(CATALOGUE, "utf8");

// Lot « espace élève » (07/09/2026). La page d'accueil des élèves accueillera
// plusieurs activités, puis des liens vers des cours. Trois choses doivent
// tenir dans le temps, et c'est ce que ce fichier garde.

test("« Se déconnecter » est dans l'en-tête, pas au fil de la page", () => {
  const entete = page.match(/<header>[\s\S]*?<\/header>/);
  assert.ok(entete, "la page doit avoir un <header>");
  assert.match(entete[0], /id="changer"[\s\S]*?Se déconnecter/,
    "le bouton doit être dans l'en-tête : plus bas, il passe sous la ligne de flottaison dès qu'il y a plusieurs activités");
  assert.equal((page.match(/id="changer"/g) || []).length, 1, "un seul bouton de déconnexion");
  const principal = page.match(/<main>[\s\S]*?<\/main>/);
  assert.doesNotMatch(principal[0], /id="changer"/, "et nulle part ailleurs");
});

test("l'en-tête ne montre la classe et la sortie qu'à un élève entré", () => {
  assert.match(page, /<div class="entete-droite" id="entete-droite" hidden>/,
    "avant l'entrée du code, il n'y a rien à montrer");
  assert.match(page, /\$\("entete-droite"\)\.hidden = false;/, "l'entrée le montre");
  assert.match(page, /\$\("entete-droite"\)\.hidden = true;/, "la déconnexion le cache");
});

test("la liste des activités est une grille qui s'adapte au nombre d'applis", () => {
  assert.match(page, /grid-template-columns: repeat\(auto-fit, minmax\(\d+px, 1fr\)\)/,
    "une seule mise en page : large à une activité, en colonnes quand il y en a plusieurs — rien à réécrire en ajoutant une appli");
});

// Le dessin est choisi dans un tableau écrit DANS la page. Rien de ce qui vient
// du serveur ne doit entrer dans la page autrement que par textContent : c'est
// la règle qui protège la page depuis le lot B, et une icône ne l'entame pas.
test("les dessins sont écrits dans la page, jamais construits avec une valeur du serveur", () => {
  assert.match(page, /function icone\(cle\) \{\s*\n\s*return Object\.prototype\.hasOwnProperty\.call\(ICONES, cle\) \? ICONES\[cle\] : ICONE_DEFAUT;/,
    "la clé de l'appli ne sert qu'à choisir dans une liste fermée");
  const innerHTML = page.match(/\.innerHTML = [^\n]*\n?[^\n]*/g) || [];
  for (const ligne of innerHTML) {
    const valeursServeur = ligne.match(/\$\{appli\.(\w+)/g) || [];
    assert.deepEqual(valeursServeur, [], `${ligne.trim()} : aucune valeur du serveur ne s'écrit en HTML`);
  }
  assert.doesNotMatch(page, /<img[^>]+src="https?:\/\//, "aucune image d'un autre domaine (politique de contenu)");
});

test("chaque appli du catalogue a son propre dessin", () => {
  const cles = [...catalogue.matchAll(/^\s{4}'([a-z0-9-]+)' => \[$/gm)].map(m => m[1]);
  assert.ok(cles.length >= 5, "le catalogue doit être lisible ici");
  for (const cle of cles) {
    assert.ok(page.includes(`"${cle}":`),
      `l'appli « ${cle} » n'a pas de dessin dans ICONES : une activité au dessin générique a l'air inachevée. `
      + `Ajoute-le dans _serveur/public/index.php.`);
  }
});

// 07/09/2026 — les activités annoncées. Gwenaël veut que les élèves voient
// arriver ce qui se prépare ; elles s'affichent donc pour toutes les classes,
// sans lien, avec une pastille. Deux choses à tenir : leur ORDRE (le sien) et
// le fait que leur dessin garde ses COULEURS — grisées, les cinq à venir se
// ressemblaient toutes, et c'est justement la couleur qui donne envie.

test("l'ordre d'affichage du catalogue est celui décidé le 07/09/2026", () => {
  const cles = [...catalogue.matchAll(/^\s{4}'([a-z0-9-]+)' => \[$/gm)].map(m => m[1]);
  assert.deepEqual(cles, ["defi-tables", "defi-calcul", "automatismes", "splat-equations", "soley"],
    "l'ordre du tableau CATALOGUE_APPLIS est l'ordre des tuiles chez l'élève");
});

test("les activités pas encore ouvertes sont annoncées à toutes les classes", () => {
  assert.match(catalogue, /foreach \(CATALOGUE_APPLIS as \$cle => \$appli\) \{\s*\n\s*if \(isset\(\$vues\[\$cle\]\) \|\| \(\$appli\['disponible'\] \?\? false\)\) continue;/,
    "une annonce ne dépend pas de la liste de la classe ; une activité ouverte, si");
});

test("une tuile « bientôt » garde son dessin en couleur et porte la pastille", () => {
  assert.doesNotMatch(page, /\.bientot[^{]*\{[^}]*grayscale/,
    "griser le dessin efface le soleil de Solèy et l'orange de Splat");
  assert.match(page, /<span class="pastille">Bientôt<\/span>/, "la pastille dit ce que la couleur ne dit plus");
  assert.match(page, /bloc\.querySelector\("\.texte span"\)\.textContent = appli\.description/,
    "la pastille est un <span> elle aussi : viser celui du texte, pas le premier venu");
});

// -------------------------------------------------------------------------
// Lot « cohérence des sorties » (08/09/2026). Gwenaël a créé cet espace pour
// que ses élèves n'aillent pas sur mathsgo.re ; le pied de page les y renvoyait
// depuis la première version, et la page de confidentialité du site, écrite
// pour un visiteur, les déposait ensuite sur l'accueil du site. Un élève entré
// par son code ne quitte plus son espace, quel que soit le lien cliqué.

const INFOS = join(racine, "_serveur/public/infos.php");
const infos = readFileSync(INFOS, "utf8");

test("le pied de l'espace ne propose qu'une chose, et elle reste dans l'espace", () => {
  const pied = page.match(/<footer>[\s\S]*?<\/footer>/);
  assert.ok(pied, "la page doit avoir un pied");
  const adresses = [...pied[0].matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(adresses, ["infos.php"], "un seul lien, vers la page Infos de l'espace");
  assert.doesNotMatch(page, /https?:\/\/mathsgo\.re/,
    "plus aucune adresse du site dans la page de l'espace élève");
});

test("la page Infos ne fait sortir personne", () => {
  assert.doesNotMatch(infos, /href="https?:\/\//,
    "aucun lien vers un autre domaine : les adresses du site sont écrites en texte");
  assert.match(infos, /href="\.\/"[^>]*>← Retour à mon espace/,
    "le seul bouton ramène à l'espace");
  assert.match(infos, /href="mailto:gwenael@mathsgo\.re/,
    "l'adresse de l'éditeur (obligation légale) ouvre la messagerie de l'appareil, sans quitter la page");
  assert.match(infos, /entetes_page\(\);/,
    "mêmes en-têtes que l'accueil : politique de contenu et Cache-Control: no-store");
  assert.doesNotMatch(infos, /<script/, "pas de script : rien à exécuter sur cette page");
  assert.doesNotMatch(infos, /<img[^>]+src="https?:\/\//,
    "aucune image d'un autre domaine (politique de contenu)");
});

// Le mot « compte » est le cœur du problème signalé par Gwenaël : la page du
// site dit « maths&go ne crée pas de compte élève » à un enfant qui se croit
// connecté à un compte. Ici on dit « espace », et le mot « compte » n'apparaît
// que dans la phrase qui explique que ce n'en est pas un.
test("la page Infos dit « espace », jamais « compte »", () => {
  const corps = infos.slice(infos.indexOf("<body>"));
  const occurrences = corps.match(/\bcomptes?\b/g) || [];
  assert.equal(occurrences.length, 1, `« compte » apparaît ${occurrences.length} fois au lieu d'une`);
  assert.match(corps, /Ce n’est pas un compte : il n’y a pas d’identifiant/,
    "la seule occurrence est celle qui dit que ce n'en est pas un");
  assert.ok(corps.includes("ton espace"), "le mot employé partout ailleurs est « espace »");
});

// Le « précédent » du navigateur après une déconnexion. Chrome ressort une
// page entière de son cache arrière/avant sans réexécuter le script, même en
// « no-store », tant qu'aucun cookie n'entre en jeu — et l'espace n'en pose
// aucun. Ce test EXÉCUTE le gestionnaire tel qu'il est écrit dans la page :
// une assertion sur le texte du fichier décrirait l'intention au lieu de la
// vérifier.
function executerPageshow({persisted, codeEnMemoire}) {
  const debut = page.indexOf("  function revenirAuCode() {");
  assert.ok(debut > 0, "la page doit ranger le ménage dans une fonction");
  const ancre = page.indexOf('window.addEventListener("pageshow"', debut);
  assert.ok(ancre > debut, "la page doit écouter « pageshow »");
  const fin = page.indexOf("\n  });", ancre) + "\n  });".length;
  const source = page.slice(debut, fin);

  const elements = new Map();
  const $ = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        id, hidden: false, textContent: "", value: "", ecouteurs: {},
        focus() {},
        addEventListener(type, fn) { this.ecouteurs[type] = fn; }
      });
    }
    return elements.get(id);
  };
  // L'écran tel qu'il revient du cache : celui du précédent élève.
  $("titre").textContent = "Bonjour Léa";
  $("classe").textContent = "405";
  $("classe").hidden = false;
  $("entete-droite").hidden = false;
  $("applis").textContent = "Défi tables";
  $("code").value = "ABC123";
  $("ecran-code").hidden = true;
  $("ecran-espace").hidden = false;

  let gestionnaire = null;
  const fenetre = {addEventListener(type, fn) { if (type === "pageshow") gestionnaire = fn; }};
  const nettoyer = brut => (brut || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  new Function("$", "window", "ecrireCode", "lireCode", "nettoyer", "afficherErreur", source)(
    $, fenetre, () => {}, () => codeEnMemoire, nettoyer, () => {});
  assert.ok(gestionnaire, "le gestionnaire de « pageshow » doit être posé");
  gestionnaire({persisted});
  return {$, elements};
}

// Le bouton et le retour de cache doivent faire EXACTEMENT le même ménage :
// c'est la raison d'être de la fonction commune. Ce test exécute l'autre
// chemin, celui du bouton, sur le même écran de départ.
test("« Se déconnecter » fait le même ménage que le retour de cache", () => {
  const {$} = executerPageshow({persisted: false, codeEnMemoire: "ABC123"});
  $("changer").ecouteurs.click();
  assert.equal($("ecran-code").hidden, false);
  assert.equal($("ecran-espace").hidden, true);
  assert.equal($("titre").textContent, "Mon espace");
  assert.equal($("classe").textContent, "");
  assert.equal($("entete-droite").hidden, true);
  assert.equal($("applis").textContent, "");
  assert.equal($("code").value, "");
});

test("après « Se déconnecter », le bouton « précédent » ne rouvre pas l'espace", () => {
  const {$} = executerPageshow({persisted: true, codeEnMemoire: ""});
  assert.equal($("ecran-code").hidden, false, "l'écran du code revient");
  assert.equal($("ecran-espace").hidden, true, "l'espace est refermé");
  assert.equal($("titre").textContent, "Mon espace", "le prénom du précédent élève a disparu");
  assert.equal($("classe").textContent, "", "sa classe aussi");
  assert.equal($("classe").hidden, true);
  assert.equal($("entete-droite").hidden, true, "et la sortie n'a plus lieu d'être");
  assert.equal($("applis").textContent, "", "ses activités aussi");
  assert.equal($("code").value, "", "le champ est vide");
});

test("le retour d'un cache ne dérange pas un élève encore identifié", () => {
  const {$} = executerPageshow({persisted: true, codeEnMemoire: "ABC123"});
  assert.equal($("ecran-espace").hidden, false, "l'onglet a encore son code : rien ne bouge");
  assert.equal($("titre").textContent, "Bonjour Léa");
});

test("un affichage ordinaire (pas un retour de cache) ne touche à rien", () => {
  const {$} = executerPageshow({persisted: false, codeEnMemoire: ""});
  assert.equal($("ecran-espace").hidden, false,
    "sans « persisted », le script de la page vient de s'exécuter : c'est lui qui décide");
  assert.equal($("titre").textContent, "Bonjour Léa");
});
