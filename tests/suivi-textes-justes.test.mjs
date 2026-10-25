// Lot « serveur pro, 1 : textes justes » (24/10/2026). Les phrases de la page
// professeur et de l'espace élève qui disaient autre chose que ce que fait le
// serveur — inventaire de Claude et de Codex, synthèse du 24/10. Ce fichier
// garde chaque correction : si une ancienne phrase revient, il rougit.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/prof/index.php");
const espace = lire("_serveur/public/index.php");
const infos = lire("_serveur/public/infos.php");

// Les appels de demander(), du nom à la parenthèse qui ferme (chaînes et
// gabarits sautés).
function appelsDeDemander(source) {
  const appels = [];
  const motif = /(?<![\w.])demander\(/g;
  let m;
  while ((m = motif.exec(source))) {
    if (source.slice(m.index - 9, m.index) === "function ") continue;
    if (source.startsWith("demander() {", m.index)) continue;
    let profondeur = 0, guillemet = null, j = m.index + "demander".length;
    for (; j < source.length; j++) {
      const c = source[j];
      if (guillemet) {
        if (c === "\\") { j++; continue; }
        if (c === guillemet) guillemet = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") guillemet = c;
      else if (c === "(") profondeur++;
      else if (c === ")" && --profondeur === 0) break;
    }
    appels.push(source.slice(m.index, j + 1));
  }
  return appels;
}

test("point 1 · évaluations : plus de « rien n'est gardé », la durée dite", () => {
  assert.ok(!page.includes("rien n’est gardé sur le serveur"));
  assert.match(page, /<p>En classe · un passage par élève · réponses effacées au plus tard le lendemain<\/p>/);
});

test("point 2 · la feuille prénom ↔ code n'est plus « le seul papier »", () => {
  assert.ok(!page.includes("seul papier qui associe") && !page.includes("seul papier qui relie"));
  assert.match(page, /Feuille à garder : la liste de toute la classe, prénoms et codes\./);
  assert.match(page, /jette-la à la déchiqueteuse/, "l'idée de la déchiqueteuse reste");
  assert.match(page, /id="imprimer-recap" title="À garder : la liste de toute la classe, avec les prénoms et les codes"/);
});

test("point 3 · fin d'année : pas de sauvegarde promise, « plus tard » ne reporte rien", () => {
  assert.ok(!page.includes("Fais ta sauvegarde"), "le professeur n'a pas de bouton de sauvegarde");
  assert.match(page, /id="echues-plus-tard">Me le rappeler plus tard<\/button>/);
  assert.match(page, /Si tu attends, le ménage automatique de l’été peut `\s*\+ `\$\{plusieurs \? "les" : "la"\} supprimer sans prévenir\.`/);
  assert.match(page, /Imprime avant ce que tu veux garder/);
});

test("point 4 · « rien reçu », pas « rien fait »", () => {
  assert.ok(!/"rien fait"|encore rien fait`/.test(page));
  assert.match(page, /cDate\.textContent = quand \|\| "rien reçu";/);
  assert.match(page, /resumeDeLaClasse\(eleves, aDuTravail, "aucun calcul reçu"\)/, "Anzan compte des calculs");
});

test("point 5 · au téléphone, les colonnes gardent leur période", () => {
  assert.match(page, /cSemaine\.dataset\.libelle = "Cette semaine";/);
  assert.ok(!page.includes('dataset.libelle = "Séances"') && !page.includes('dataset.libelle = "Activité"'));
  assert.equal(page.split('cDate.dataset.libelle = "Dernière activité";').length - 1, 2, "Défi tables et SPLAT!");
});

test("point 6 · chaque fenêtre nomme son geste ; une suppression est en rouge", () => {
  const appels = appelsDeDemander(page);
  assert.ok(appels.length >= 20, `les appels de demander() trouvés (${appels.length})`);
  for (const appel of appels) {
    assert.match(appel, /oui: /, `sans verbe : ${appel.slice(0, 90)}…`);
    if (/^demander\(\s*`?"?(Supprimer|Retirer le temps|Faire repasser|Terminer et effacer|Fermer l’évaluation)/.test(appel)
      || /Supprimer|Désactiver le compte|Retirer le partage/.test((/oui: ([^,}]+)/.exec(appel) || [])[1] || "")) {
      assert.match(appel, /danger: true/, `geste destructeur sans rouge : ${appel.slice(0, 90)}…`);
    }
  }
  const fonction = page.slice(page.indexOf("  function demander(texte, champs, options) {"), page.indexOf("  function montrerSecret("));
  assert.match(fonction, /oui\.textContent = \(options && options\.oui\) \|\| "Confirmer";\s*oui\.className = options && options\.danger \? "danger" : "";/,
    "le bouton reprend le verbe et la couleur à chaque ouverture (une fenêtre rouge ne déteint pas sur la suivante)");
  assert.ok(!page.includes("Vérifie l’aperçu avant de confirmer"));
});

test("point 7 · évaluation : ce qui s'arrête, ce qui s'efface, ce qu'on télécharge", () => {
  assert.match(page, /el\("button", "danger", "Fermer maintenant"\)/);
  assert.match(page, /el\("button", "", "Télécharger les résultats"\)/);
  assert.match(page, /el\("button", "danger", "Terminer et effacer"\)/);
  assert.ok(!page.includes("Télécharger le fichier") && !page.includes('"Fermer l’évaluation"'));
  assert.match(page, /« Terminer et effacer » les efface tout de suite\./);
});

test("point 8 · Anzan : « Imprimer » dit combien de séances il imprime", () => {
  assert.match(page, /id="pa-imprimer">Imprimer ces séances<\/button>/);
  const bloc = page.slice(page.indexOf("  function dessinerParcoursAnzan() {"), page.indexOf("  function fermerParcoursAnzan() {"));
  const libelle = new Function("vu", bloc.match(/\$\("pa-imprimer"\)\.textContent = ([\s\S]*?);\n/)[0].replace('$("pa-imprimer").textContent = ', "return "));
  assert.equal(libelle({seances: [1]}), "Imprimer cette séance");
  assert.equal(libelle({seances: Array(10)}), "Imprimer ces 10 séances");
  assert.equal(libelle({seances: Array(20)}), "Imprimer ces 20 séances", "après « Voir les séances précédentes »");
});

test("point 9 · Ctrl+P sans bouton : la feuille Anzan est citée", () => {
  const note = page.slice(page.indexOf('<div class="note-impression">'), page.indexOf("</div>", page.indexOf('<div class="note-impression">')));
  assert.match(note, /Onglet Élèves/);
  assert.match(note, /Onglet Anzan/);
});

test("côté élève (choix de Gwenaël du 24/10) : la tuile dit ce qui démarre ; Infos parle des réponses gardées", () => {
  assert.ok(!espace.includes("Clique pour commencer") && !espace.includes("Clique pour continuer"));
  assert.match(espace, /etat\.commence \? "Continuer l’évaluation\." : "Commencer l’évaluation\.";/);
  assert.ok(!infos.includes("pas d’horaire"));
  assert.match(infos, /<p>Pendant une évaluation ou une séance en direct, tes réponses et l’heure où tu commences sont gardées le temps que ton professeur les récupère, puis effacées au plus tard le lendemain\.<\/p>/);
  // Choix de Gwenaël : « Qui peut le voir » et « Tout est effacé à la fin de
  // l'année scolaire » ne changent pas.
  assert.match(infos, /<p>Ton professeur\. Et toute personne qui connaît ton code/);
  assert.match(infos, /<p>Tout est effacé à la fin de l’année scolaire\./);
});
