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
