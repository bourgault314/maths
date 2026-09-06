import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

// Le serveur de suivi porte des mots de passe d'élèves et le jeton de session
// du professeur. Depuis le lot 4 (02/09/2026), son .htaccess renvoie toute
// requête en clair vers HTTPS et interdit config.php (le mot de passe MySQL).
//
// Le fichier déposé chez OVH et celui du dépôt doivent rester le même : ce
// test garde les trois points sur lesquels une retouche se paierait cher.
const CHEMIN = "_serveur/public/.htaccess";
const htaccess = readFileSync(join(racine, CHEMIN), "utf8");

// Les lignes qui comptent pour Apache : ni vides, ni commentaires. On garde le
// numéro d'origine pour que les messages d'échec désignent la bonne ligne.
const lignes = htaccess
  .split(/\r?\n/)
  .map((texte, i) => ({ n: i + 1, texte: texte.trim() }))
  .filter(({ texte }) => texte !== "" && !texte.startsWith("#"));

const estRegle = ({ texte }) => /^RewriteRule\s/i.test(texte);
const iRedirection = lignes.findIndex(
  (ligne) => estRegle(ligne) && ligne.texte.includes("https://suivi.mathsgo.re%{REQUEST_URI}")
);

test("toute requête en clair repart en 301 vers https://suivi.mathsgo.re", () => {
  assert.notEqual(
    iRedirection,
    -1,
    `${CHEMIN} : il manque la RewriteRule vers https://suivi.mathsgo.re%{REQUEST_URI}, `
      + "sans laquelle le site répond encore en HTTP en clair."
  );
  assert.match(
    lignes[iRedirection].texte,
    /\[[^\]]*\bR=301\b[^\]]*\]/,
    `${CHEMIN} ligne ${lignes[iRedirection].n} : la redirection doit être permanente (R=301), `
      + "pour que le navigateur cesse de repasser par HTTP."
  );
});

test("la redirection ne part que si NI %{HTTPS} NI X-Forwarded-Proto ne dit « déjà en HTTPS »", () => {
  assert.notEqual(iRedirection, -1, `${CHEMIN} : redirection HTTPS absente (voir le test précédent).`);

  // Apache n'applique à une RewriteRule que les RewriteCond qui la précèdent
  // immédiatement : on remonte tant que ce sont des RewriteCond.
  const conditions = [];
  for (let i = iRedirection - 1; i >= 0 && /^RewriteCond\s/i.test(lignes[i].texte); i--) {
    conditions.unshift(lignes[i].texte.replace(/\s+/g, " "));
  }

  // Chez OVH, TLS est terminé tantôt sur l'équilibreur (X-Forwarded-Proto),
  // tantôt sur Apache (%{HTTPS}). Avec une seule des deux conditions, la moitié
  // des requêtes déjà en HTTPS seraient redirigées vers elles-mêmes : boucle
  // infinie, et le serveur de suivi devient inaccessible.
  for (const attendue of ["RewriteCond %{HTTPS} !=on", "RewriteCond %{HTTP:X-Forwarded-Proto} !=https"]) {
    assert.ok(
      conditions.includes(attendue),
      `${CHEMIN} ligne ${lignes[iRedirection].n} : « ${attendue} » doit précéder immédiatement la `
        + `redirection. Conditions trouvées : ${conditions.length ? conditions.join(" | ") : "aucune"}. `
        + "Les deux sont nécessaires : avec une seule, une requête déjà en HTTPS est redirigée vers "
        + "elle-même à l'infini."
    );
  }
});

test("rien de ce qui commence par « config » n'est servi, même si PHP tombait", () => {
  // Lot serveur B (constat 6 du 05/09/2026) : <Files "config.php"> ne couvrait
  // QUE ce nom exact. Un « config.php.bak » laissé par un éditeur, un
  // « config.old » rangé à la main avant une modification : chacun sort en
  // clair — avec le mot de passe MySQL dedans — et aucun n'est interprété par
  // PHP. Le motif « ^config » les couvre tous, y compris ceux qu'on n'a pas
  // encore imaginés.
  const bloc = htaccess.match(/<FilesMatch\s+"\^config"\s*>([\s\S]*?)<\/FilesMatch\s*>/i);
  assert.ok(
    bloc,
    `${CHEMIN} : il manque le bloc <FilesMatch "^config">, sans lequel une copie de config.php `
      + "(config.php.bak, config.old, config.php.txt) sort en clair avec le mot de passe MySQL."
  );
  assert.match(
    bloc[1],
    /\bRequire\s+all\s+denied\b/i,
    `${CHEMIN} : le bloc <FilesMatch "^config"> doit contenir « Require all denied ».`
  );
  // Le motif doit bien attraper les quatre noms qui ont motivé le lot.
  const motif = /^config/;
  for (const nom of ["config.php", "config.php.bak", "config.old", "config.php.txt", "config.exemple.php"]) {
    assert.ok(motif.test(nom), `${nom} doit être couvert par « ^config »`);
  }
});

test("menage.php n'est pas ouvrable par le web", () => {
  // Constat 5 : le ménage de fin d'année se lance par la tâche planifiée OVH,
  // en ligne de commande. Il refusait déjà lui-même (404), mais en laissant
  // PHP annoncer sa version au passage ; ici Apache répond 403 sans appeler
  // PHP du tout. La tâche planifiée passe par la ligne de commande : cette
  // règle ne la gêne pas.
  const bloc = htaccess.match(/<Files\s+"menage\.php"\s*>([\s\S]*?)<\/Files\s*>/i);
  assert.ok(bloc, `${CHEMIN} : il manque le bloc <Files "menage.php">.`);
  assert.match(bloc[1], /\bRequire\s+all\s+denied\b/i,
    `${CHEMIN} : le bloc <Files "menage.php"> doit contenir « Require all denied ».`);
});

test("la redirection HTTPS passe avant la règle Authorization", () => {
  const iAuthorization = lignes.findIndex(
    (ligne) => estRegle(ligne) && ligne.texte.includes("HTTP_AUTHORIZATION")
  );
  assert.notEqual(
    iAuthorization,
    -1,
    `${CHEMIN} : la règle qui transmet l'en-tête Authorization à PHP a disparu ; `
      + "sans elle, toute action du professeur répond « session expirée »."
  );
  assert.notEqual(iRedirection, -1, `${CHEMIN} : redirection HTTPS absente (voir le premier test).`);

  // Une requête en clair doit repartir AVANT qu'Apache ne recopie le jeton de
  // session dans l'environnement de PHP : autrement le serveur traiterait une
  // requête dont le jeton a déjà voyagé en clair.
  assert.ok(
    iRedirection < iAuthorization,
    `${CHEMIN} : la redirection HTTPS (ligne ${lignes[iRedirection]?.n}) doit être placée avant la `
      + `règle Authorization (ligne ${lignes[iAuthorization].n}).`
  );
});
