// Lot E1 de l'optimisation de Défi tables (03/10/2026) : des écrans seulement.
// Décision 4 : « Non, je commence à apprendre » puis « Par quelle table
// veux-tu commencer ? » (et « C'est tout » mène au même choix). Décision 6 :
// une pastille par calcul dans Mes calculs. Décision 8 : « Commencer » sans
// flèche, « Je valide ma table » en bouton rond, « Choisir une activité » en
// lien de 16 px, « ← Ma séance du jour » + CHOISIR UNE ACTIVITÉ, l'ancien menu
// en liste simple. Décision 13 : les perles comptent sur 10. En plus : le fil
// « Ma séance » sur une ligne au téléphone.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

// Le corps d'une fonction de la page, de sa déclaration à son accolade de fin.
function corps(nom) {
  const debut = html.indexOf(`function ${nom}(`);
  assert.ok(debut > 0, `fonction introuvable : ${nom}`);
  const fin = html.indexOf("\n      }\n\n", debut);
  return html.slice(debut, fin + 8);
}

test("décision 4 : « Non, je commence à apprendre » ouvre le choix de la table, la conseillée marquée", () => {
  const decouverte = corps("renderDecouverte");
  assert.match(decouverte, /if \(decouverteChoixTable\) \{\s*renderChoixPremiereTable\(etapes, etat\);\s*return;\s*\}/);
  assert.match(decouverte, /commencer\.textContent = etat\.acquises\.length \? "C’est tout" : "Non, je commence à apprendre";/);
  // Le bouton ouvre le second écran — il ne ferme le premier écran que quand il n'y a plus rien à choisir.
  assert.match(decouverte, /if \(suivante !== null\) \{\s*decouverteChoixTable = true;\s*renderAccueil\(\);[\s\S]*?return;\s*\}\s*fermerDecouverte\(\);\s*renderAccueil\(\);/);
  assert.doesNotMatch(html, /Non, je commence par la table de/);

  const choix = corps("renderChoixPremiereTable");
  assert.match(choix, /const conseillee = PARCOURS\.tableDeSeance\(parcours\);/, "la conseillée est celle du moteur (la 2 pour un élève neuf)");
  assert.match(choix, /\$\("acc-table-titre"\)\.textContent = "Par quelle table veux-tu commencer \?";/);
  assert.match(choix, /`La table de \$\{conseillee\} est conseillée\.`/);
  assert.match(choix, /PARCOURS_TABLES\.forEach\(candidate => \{/, "les neuf tables");
  assert.match(choix, /bouton\.className = acquise \? "is-acquise" : conseil \? "is-conseillee" : "";/);
  assert.match(choix, /petit\.textContent = "conseillée";/);
  // Une table déjà validée est cochée, pas proposée ; une autre ferme le premier écran et devient « ma table ».
  assert.match(choix, /if \(acquise\) bouton\.setAttribute\("aria-disabled", "true"\);\s*else bouton\.addEventListener\("click", \(\) => \{\s*decouverteChoixTable = false;\s*fermerDecouverte\(\);\s*ecrireTableChoisie\(candidate\);\s*renderAccueil\(\);/);
  assert.match(html, /\.decouverte-choix button\.is-conseillee \{ border-color: var\(--blue\);/);
});

test("décision 4 : « C’est tout » sur l’écran de résultat mène au même choix", () => {
  const suite = corps("renderSuiteDecouverte");
  assert.match(suite, /bouton\("C’est tout", "secondary", \(\) => \{\s*if \(PARCOURS\.tableDeSeance\(parcours\) === null\) fermerDecouverte\(\);\s*else decouverteChoixTable = true;\s*backToModes\(\);\s*\}\)/);
  // La validation ratée garde son bouton : elle commence la table ratée.
  assert.match(suite, /bouton\(`Je commence la table de \$\{table\}\u00a0→`, "primary"/);
});

test("décision 6 : Mes calculs, une pastille par calcul, plus de « · » entre deux calculs", () => {
  const detail = corps("renderCalculsDetail");
  // Lot « Mon parcours » (décision 7) : les pastilles sont rangées par jour
  // de retour (« Aujourd'hui », « Demain »…), toujours une par calcul.
  assert.match(detail, /parJour\.get\(dans\)\.forEach\(cle => groupe\.append\(ligneDetail\("", PARCOURS\.libelleFait\(cle\)\)\)\);/);
  assert.match(detail, /zone\.appendChild\(ligneDetail\("mc-detail-liste", "Aucun calcul pour l’instant\."\)\);/);
  // Le seul « · » du détail sépare « 1 à revoir · 7 à faire monter », jamais deux calculs.
  // (Lot « retouches après Mon parcours » : deux fois, « Aujourd'hui » et « Demain ».)
  assert.deepEqual(detail.match(/[a-zA-Z]+\.join\(" · "\)/g), ["sortes.join(\" · \")", "sortes.join(\" · \")"]);
  assert.match(html, /\.mc-detail-jours span \{ display: inline-block; padding: 7px 9px; border: 1\.5px solid currentColor; border-radius: 999px; background: #fff;[^}]*white-space: nowrap;[^}]*\}/, "une pastille ne se coupe jamais");
});

test("décision 8 : « Commencer » sans flèche, « Je passe le test » en bouton rond, « Choisir une activité » en lien de 16 px ; la porte ne les ferme plus", () => {
  const carte = corps("carteDeSeance");
  assert.match(carte, /go\.textContent = reprise \? "Reprendre" : "Commencer";/);
  assert.doesNotMatch(html, /Commencer\\u00a0→/);
  const accueil = corps("renderSeanceAccueil");
  assert.match(html, /const NOM_DU_TEST = "Je passe le test";/);
  assert.match(accueil, /lien\(NOM_DU_TEST, \(\) => launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\), "rond"\);/);
  // Lot « un seul système » : tant que Mes calculs du jour n'était pas joué,
  // les liens étaient fermés. Lot « Mes calculs du jour d'abord » (08/10/2026) :
  // ils restent ouverts et le lancent d'abord.
  assert.doesNotMatch(accueil, /etat\.porte|est-fermee|porte-mot/);
  assert.match(accueil, /lien\("Choisir une activité", \(\) => \{/);
  assert.match(html, /\.seance-liens button \{ min-height: 44px;[^}]*font-size: 1rem;[^}]*text-decoration: underline;/, "le lien : 16 px, souligné");
  assert.match(html, /\.seance-liens button\.rond \{[^}]*border: 2px solid #c5d9e6; border-radius: 999px; background: #fff;[^}]*text-decoration: none; \}/);
});

test("décision 8 : menu ouvert, « ← Ma séance du jour » à gauche et le petit titre CHOISIR UNE ACTIVITÉ", () => {
  const accueil = corps("renderSeanceAccueil");
  assert.match(accueil, /retour\.className = "retour-seance";/);
  assert.match(accueil, /fleche\.setAttribute\("aria-hidden", "true"\);\s*fleche\.textContent = "←";\s*retour\.append\(fleche, "Ma séance du jour"\);/);
  assert.match(accueil, /state\.choisirActivite = false;\s*state\.etapeOuverte = null;\s*renderAccueil\(\);/);
  assert.match(accueil, /titreMenu\.textContent = "Choisir une activité";\s*etapes\.append\(retour, titreMenu\);/);
  assert.doesNotMatch(html, /Revenir à ma séance/);
  assert.match(html, /\.retour-seance \{[^}]*justify-self: start; \}/, "à gauche");
  assert.match(html, /\.titre-menu \{[^}]*text-transform: uppercase; \}/);
});

test("décision 8 : l’ancien menu en liste simple — il lance les mêmes activités, sans rien compter ni conseiller", () => {
  const debut = html.indexOf("        if (!replie && !carteSeance) {");
  const menu = html.slice(debut, html.indexOf("        // « Mes calculs du jour » (lot mémoire)", debut)).replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(menu, /fois|etoile\(|conseillee|reussis|rdv|is-check/);
  assert.equal((menu.match(/points: \[\],/g) || []).length, 4, "J'apprends, Je m'entraîne, Je passe le test, Mon mélange");
  assert.doesNotMatch(menu, /cadenas|montrerMelange|melangeDu/, "lot « un seul système » : plus de cadenas, Mon mélange est libre");
  assert.match(menu, /titre: ligne\.acquise \? "Ma table est passée" : NOM_DU_TEST,/, "« Ma table est passée » reste");
  // Les mêmes lancements qu'avant.
  for (const lancement of [
    /launchFromParcours\(PARCOURS\.configApprends\(table, item\.activite\), "menu"\)/,
    /launchFromParcours\(PARCOURS\.configEntraine\(table, item\.entrainement\), "menu"\)/,
    /launchFromParcours\(PARCOURS\.configValidation\(table, 120\), "menu"\)/,
    /launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\)/,
    /action: \(\) => launchFromParcours\(PARCOURS\.configMelange\(parcours\), "menu"\)/
  ]) assert.match(menu, lancement);
  const bouton = corps("boutonChoix");
  assert.doesNotMatch(bouton, /etat|tag|fois/);
  assert.match(html, /\.choix-activite \{[^}]*grid-template-columns: minmax\(0, 1fr\);/);
});

test("décision 13 : les perles comptent sur 10 — la case 0 × N est donnée, pas comptée", () => {
  const source = corps("activitePerles") + corps("renderLearnProgress");
  const essai = (activite, revelees) => {
    const elements = {"question-count": {texte: "", replaceChildren(...morceaux) { this.texte = morceaux.map(m => typeof m === "string" ? m : m.textContent).join(""); }, set textContent(v) { this.texte = v; }},
      progress: {style: {}}};
    const document = {createElement: () => ({className: "", textContent: ""})};
    const state = {configuration: {mode: "learn", learnActivity: activite}, revealedLearnResults: new Set(revelees), mastered: new Set()};
    new Function("state", "$", "document", "CASES_BANDE", "TOTAL", `${source}\nrenderLearnProgress();`)(state, id => elements[id], document, 11, 10);
    return [elements["question-count"].texte, elements.progress.style.width];
  };
  assert.deepEqual(essai("beads", [0]), ["0 / 10 cases complétées", "0%"], "avant d'avoir touché une perle");
  assert.deepEqual(essai("beads", [0, 1, 2, 3]), ["3 / 10 cases complétées", "30%"]);
  assert.deepEqual(essai("beads", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), ["10 / 10 cases complétées", "100%"]);
  // La bande ne change pas : 11 cases (la bande à trous en montre trois d'office).
  assert.deepEqual(essai("construct", []), ["0 / 11 cases complétées", "0%"]);
  assert.deepEqual(essai("gaps", [0, 5, 10])[0], "3 / 11 cases complétées");
});

test("en plus : le fil « Ma séance » sur une ligne au téléphone", () => {
  assert.match(corps("renderFilSeance"), /titre\.className = "fil-titre";\s*titre\.textContent = "Ma séance";/);
  // Dans le bloc du téléphone (max-width: 520px) : le mot s'efface pendant
  // l'activité (pas sur l'écran de résultat, .centre), traits et ronds plus courts.
  const debut = html.indexOf("    @media (max-width: 520px) {");
  const bloc = html.slice(debut, html.indexOf("\n    }\n", debut));
  assert.match(bloc, /\.seance-fil:not\(\.centre\) > \.fil-titre \{ display: none; \}/);
  assert.match(bloc, /\.seance-fil li \{ width: 22px; height: 22px; \}/);
  assert.match(bloc, /\.seance-fil li \+ li \{ margin-left: 8px; \}/);
  assert.match(bloc, /\.seance-fil li \+ li::before \{ width: 8px; \}/);
  // Le lecteur d'écran entend toujours « Ma séance : étape 3 sur 4 ».
  assert.match(corps("renderFilSeance"), /zone\.setAttribute\("aria-label", `Ma séance : étape/);
});

test("des écrans seulement : les moteurs ne changent pas, leurs numéros de cache non plus", () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261111-1/);
  assert.match(html, /defi_tables_core\.js\?v=20261015-1/);
});
