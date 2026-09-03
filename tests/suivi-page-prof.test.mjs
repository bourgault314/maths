import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = "_serveur/public/prof/index.php";

// Lot 7 du suivi (03/09/2026) — la page « Ma classe » et le papier.
//
// Ce qui est vérifié ici, c'est la LOGIQUE testable de la page : l'ordre et le
// contenu des deux feuilles imprimées, la file de redessin qui empêche un tri
// d'effacer une saisie de prénom en vol, le texte de la confirmation qui donne
// les codes à un collègue, le verrou d'inactivité, et la liste des zones vidées
// à la déconnexion. Le reste (le DOM réellement vide après « Se déconnecter »,
// le retour 35 minutes plus tard, la sortie de l'imprimante) se vérifie à la
// main : c'est dit dans la notice, pas prétendu ici.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) rendre `creerFileRedessin.demander()` inconditionnel → le tri efface la saisie
//  b) remettre le prénom dans la partie « part » de la bandelette → fuite du prénom
//  c) mettre le code dans la souche → la souche redevient un dossier nominatif
//  d) enlever l'adresse ou la consigne de la bandelette
//  e) enlever "corps" ou "fiche-corps" de ZONES_TEXTE
//  f) rendre texteConfirmationPartage() vide pour "ecriture"
//  g) faire dépendre creerVeille d'un compteur au lieu de l'horloge

const page = readFileSync(join(racine, PAGE), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = (() => {
  const debut = page.indexOf(BALISE);
  const fin = page.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne de la page prof doit être trouvé");
  return page.slice(debut, fin);
})();

// Le texte d'un bloc { … } équilibré à partir d'une position.
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

// La valeur d'une const déclarée dans le script (tableau ou chaîne).
function constante(nom) {
  const position = script.indexOf(`const ${nom} = `);
  assert.ok(position > 0, `la page doit définir ${nom}`);
  const debut = position + `const ${nom} = `.length;
  let i = debut, profondeur = 0, dansTexte = "";
  for (; i < script.length; i += 1) {
    const c = script[i];
    if (dansTexte) { if (c === dansTexte && script[i - 1] !== "\\") dansTexte = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { dansTexte = c; continue; }
    if ("[{(".includes(c)) profondeur += 1;
    else if ("]})".includes(c)) profondeur -= 1;
    else if (c === ";" && profondeur === 0) break;
  }
  return new Function(`return (${script.slice(debut, i)});`)();
}

// ------------------------------------------------------------ un document de poche

function creerElement(tag) {
  return {
    tag,
    className: "",
    hidden: false,
    value: "",
    style: {},
    dataset: {},
    enfants: [],
    _texte: "",
    set textContent(valeur) { this._texte = valeur === null ? "" : String(valeur); this.enfants = []; },
    get textContent() {
      if (this.enfants.length) return this.enfants.map(e => e.textContent).join(" ");
      return this._texte;
    },
    append(...noeuds) { this.enfants.push(...noeuds); },
    appendChild(noeud) { this.enfants.push(noeud); return noeud; },
  };
}

function creerDocument(ids) {
  const noeuds = new Map();
  (ids || []).forEach(id => noeuds.set(id, creerElement("div")));
  return {
    noeuds,
    $: id => {
      if (!noeuds.has(id)) noeuds.set(id, creerElement("div"));
      return noeuds.get(id);
    },
    document: {createElement: tag => creerElement(tag)},
  };
}

const ordreDeLaFeuille = new Function(`${fonction("ordreDeLaFeuille")}\nreturn ordreDeLaFeuille;`)();
const nomAffiche = new Function(`${fonction("nomAffiche")}\nreturn nomAffiche;`)();

function classeDEssai() {
  const codes = ["TDJM2L", "27XCYE", "RKUJ5F", "9K7ZE8", "MMKNRF", "ACUNB9", "RKBKW6", "LKCHEU"];
  return codes.map((code, index) => ({id: 100 + index, code, prenom: "", initiale: "", lu: {acquises: []}}));
}

// dessinerFiche / dessinerBandelettes / dessinerPapier, exécutées telles qu'elles
// sont écrites dans la page, avec un document de poche.
function papierRendu(eleves, droit = "proprietaire") {
  const faux = creerDocument();
  new Function("document", "$", "eleves", "classe", "nomAffiche", "ordreDeLaFeuille", "droitClasse",
    `${fonction("dessinerFiche")}\n${fonction("dessinerBandelettes")}\n${fonction("dessinerPapier")}\n`
    + `${script.slice(script.indexOf("const CONSIGNE_BANDELETTE"), script.indexOf("\n", script.indexOf("const ADRESSE_ELEVE")))}\n`
    + "dessinerPapier();")(
    faux.document, faux.$, eleves, {libelle: "6eB"}, nomAffiche, ordreDeLaFeuille, droit);
  const recap = faux.$("fiche-corps").enfants.map(ligne => ({
    numero: ligne.enfants[0].textContent,
    nom: ligne.enfants[1].textContent,
    code: ligne.enfants[2] ? ligne.enfants[2].textContent : "",
    cellules: ligne.enfants.length,
  }));
  const bandelettes = faux.$("bandelettes-liste").enfants.map(item => {
    const souche = item.enfants.find(e => e.className === "souche");
    const part = item.enfants.find(e => e.className === "part");
    return {souche: souche.textContent, part: part.textContent,
            code: part.enfants.find(e => e.className === "code-ligne").enfants.find(e => e.className === "code").textContent};
  });
  return {recap, bandelettes, faux,
          titreRecap: faux.$("fiche-titre").textContent,
          titreBandelettes: faux.$("bandelettes-titre").textContent,
          ficheCachee: faux.$("fiche").hidden, bandelettesCachees: faux.$("bandelettes").hidden};
}

// ---------------------------------------------------------------- les bandelettes

test("chaque bandelette porte l'adresse, le code et la consigne — et jamais le prénom", () => {
  const eleves = classeDEssai();
  eleves[0].prenom = "Léa"; eleves[0].initiale = "B";
  eleves[3].prenom = "Sam";
  const {bandelettes} = papierRendu(eleves);
  assert.equal(bandelettes.length, 8);
  bandelettes.forEach((bandelette, index) => {
    assert.match(bandelette.part, /suivi\.mathsgo\.re/, `bandelette ${index + 1} : l'adresse`);
    assert.match(bandelette.part, /ton code/, `bandelette ${index + 1} : « ton code »`);
    assert.match(bandelette.part, /Ton code est personnel : ne le prête à personne\./,
      `bandelette ${index + 1} : la consigne`);
    assert.ok(bandelette.part.includes(bandelette.code), `bandelette ${index + 1} : le code`);
  });
  // La partie remise à l'enfant ne dit pas de qui elle est.
  ["Léa", "Sam", "Léa B."].forEach(prenom => {
    bandelettes.forEach((bandelette, index) => {
      assert.ok(!bandelette.part.includes(prenom),
        `bandelette ${index + 1} : « ${prenom} » n'a rien à faire du côté de l'élève`);
    });
  });
});

test("la souche que le professeur garde porte le numéro et le prénom, jamais le code", () => {
  const eleves = classeDEssai();
  eleves[0].prenom = "Léa"; eleves[0].initiale = "B";
  const {bandelettes, recap} = papierRendu(eleves);
  assert.match(bandelettes[0].souche, /n° 1/);
  assert.match(bandelettes[0].souche, /Léa B\./);
  bandelettes.forEach((bandelette, index) => {
    assert.ok(!bandelette.souche.includes(bandelette.code),
      `souche ${index + 1} : une souche perdue ne doit ouvrir aucun compte`);
    assert.match(bandelette.souche, new RegExp(`n° ${index + 1}\\b`));
  });
  // Sans prénom, la souche reste lisible (un tiret) : on distribue par numéro.
  assert.match(bandelettes[1].souche, /—/);
  assert.equal(recap.length, 8);
});

test("bandelettes et feuille prénom ↔ code : même ordre, mêmes numéros", () => {
  const eleves = classeDEssai();
  eleves[2].prenom = "Zoé";
  eleves[6].prenom = "ali";
  const {recap, bandelettes, titreRecap, titreBandelettes} = papierRendu(eleves);
  const attendu = ordreDeLaFeuille(eleves).map(e => e.code);
  assert.deepEqual(recap.map(l => l.code), attendu);
  assert.deepEqual(bandelettes.map(b => b.code), attendu);
  assert.deepEqual(recap.map(l => l.numero), ["1", "2", "3", "4", "5", "6", "7", "8"]);
  bandelettes.forEach((b, i) => assert.match(b.souche, new RegExp(`n° ${i + 1}\\b`)));
  assert.match(titreRecap, /Prénom ↔ code — 6eB/);
  assert.match(titreBandelettes, /Bandelettes à découper — 6eB/);
  // La feuille récapitulative n'a plus de colonne « Découper » : les ciseaux
  // sont passés sur les bandelettes.
  assert.deepEqual([...new Set(recap.map(l => l.cellules))], [3]);
  assert.match(page, /<thead><tr><th>N°<\/th><th>Élève<\/th><th>Code<\/th><\/tr><\/thead>/);
});

test("en lecture seule, aucune des deux feuilles n'est construite", () => {
  const {recap, bandelettes, ficheCachee, bandelettesCachees, titreRecap} =
    papierRendu(classeDEssai(), "lecture");
  assert.equal(recap.length, 0, "pas de feuille prénom ↔ code");
  assert.equal(bandelettes.length, 0, "pas de bandelettes");
  assert.equal(ficheCachee, true);
  assert.equal(bandelettesCachees, true);
  assert.equal(titreRecap, "", "pas même le titre « Codes des élèves » sur une feuille vide");
});

test("la feuille des codes ne sort que par un bouton : Ctrl+P imprime le mode d'emploi", () => {
  assert.match(page, /body\.imprime-recap \.fiche \{ display: block; \}/);
  assert.match(page, /body\.imprime-bandelettes \.bandelettes \{ display: block; \}/);
  assert.match(page, /body:not\(\.imprime-recap\):not\(\.imprime-bandelettes\) \.note-impression \{ display: block; \}/);
  const source = fonction("imprimer");
  assert.match(source, /droitClasse === "lecture"/, "un collègue en lecture seule n'imprime rien");
  assert.match(source, /classList\.add\(classeCss\)/);
  assert.match(source, /afterprint/);
  assert.match(script, /\$\("imprimer-bandelettes"\)\.addEventListener\("click", \(\) => imprimer\("bandelettes"\)\)/);
  assert.match(script, /\$\("imprimer-recap"\)\.addEventListener\("click", \(\) => imprimer\("recap"\)\)/);
});

// ------------------------------------------------- tri pendant une saisie de prénom

const creerFileRedessin = new Function(`${fonction("creerFileRedessin")}\nreturn creerFileRedessin;`)();

test("un tri demandé pendant qu'un prénom part au serveur attend la réponse", () => {
  const dessins = [];
  const file = creerFileRedessin(() => dessins.push(dessins.length + 1));
  // Rien en vol : le tri redessine tout de suite.
  assert.equal(file.demander(), true);
  assert.equal(dessins.length, 1);
  // Une saisie part ; le clic sur l'en-tête de tri ne redessine pas.
  file.debut();
  assert.equal(file.demander(), false);
  assert.equal(dessins.length, 1, "le champ de saisie n'est pas détruit sous les doigts");
  assert.equal(file.enAttente(), true);
  // La réponse arrive : le redessin en attente part, une seule fois.
  file.fin();
  assert.equal(dessins.length, 2);
  assert.equal(file.enAttente(), false);
  assert.equal(file.combien(), 0);
});

test("plusieurs saisies en vol : un seul redessin, à la dernière réponse", () => {
  let dessins = 0;
  const file = creerFileRedessin(() => { dessins += 1; });
  file.debut(); file.debut(); file.debut();
  file.demander(); file.demander(); file.demander();
  assert.equal(dessins, 0);
  file.fin(); assert.equal(dessins, 0);
  file.fin(); assert.equal(dessins, 0);
  file.fin(); assert.equal(dessins, 1);
  // Une réponse de trop ne fait pas descendre le compteur sous zéro.
  file.fin();
  assert.equal(file.combien(), 0);
  assert.equal(dessins, 1);
});

test("les deux commandes de tri et les redessins d'action passent par la file", () => {
  // Le clic sur un en-tête, le menu « Trier par », « Nouveau code » et
  // « Supprimer » : plus aucun dessinerTableau() direct dans un gestionnaire.
  const gestionnaireEntete = blocDepuis(script, script.indexOf('document.querySelectorAll("th button[data-tri]")'));
  assert.match(gestionnaireEntete, /redessin\.demander\(\)/);
  assert.ok(!/dessinerTableau\(\)/.test(gestionnaireEntete), "l'en-tête ne redessine plus directement");
  const gestionnaireMenu = blocDepuis(script, script.indexOf('$("tri").addEventListener("change"'));
  assert.match(gestionnaireMenu, /redessin\.demander\(\)/);
  assert.ok(!/dessinerTableau\(\)/.test(gestionnaireMenu));
  const source = fonction("nommer");
  assert.match(source, /redessin\.debut\(\)/);
  assert.match(source, /redessin\.fin\(\)/);
  // Mise à jour optimiste : le prénom tapé vaut avant la réponse, et revient en
  // arrière si le serveur refuse.
  const avantAppel = source.slice(0, source.indexOf("await api("));
  assert.match(avantAppel, /eleve\.prenom = prenom/, "le prénom est posé AVANT l'appel");
  assert.match(source, /eleve\.prenom = avant\.prenom/, "et remis en place si le serveur refuse");
});

test("« Léa B. » se lit pareil au clavier et dans la liste collée", () => {
  const lireNom = new Function(`${fonction("lireNom")}\nreturn lireNom;`)();
  assert.deepEqual(lireNom("  Léa   B. "), {prenom: "Léa", initiale: "B"});
  assert.deepEqual(lireNom("Sam"), {prenom: "Sam", initiale: ""});
  assert.deepEqual(lireNom(""), {prenom: "", initiale: ""});
  assert.deepEqual(lireNom("Jean Baptiste"), {prenom: "Jean", initiale: "B"});
  // Le collage l'utilise aussi : une seule règle pour les deux chemins.
  const collage = blocDepuis(script, script.indexOf('$("coller-prenoms").addEventListener("click"'));
  assert.match(collage, /lireNom\(prenoms\[index\]\)/);
});

// ------------------------------------------------------- donner les codes à un collègue

const texteConfirmationPartage =
  new Function(`${fonction("texteConfirmationPartage")}\nreturn texteConfirmationPartage;`)();

test("passer un collègue en écriture demande confirmation, en nommant les codes donnés", () => {
  const texte = texteConfirmationPartage("collegue-lecture", "ecriture", 28);
  assert.match(texte, /Autoriser collegue-lecture à modifier cette classe \?/);
  assert.match(texte, /les 28 codes des élèves/);
  assert.match(texte, /on ouvre l’appli comme l’élève/);
  assert.equal(texteConfirmationPartage("x", "ecriture", 1).includes("le code de l’élève"), true);
  assert.match(texteConfirmationPartage("x", "ecriture", 0), /les codes des élèves/);
  // Retirer un droit ne donne rien à personne : pas de question dans ce sens.
  assert.equal(texteConfirmationPartage("collegue", "lecture", 28), "");
});

test("les deux chemins qui donnent l'écriture passent par la confirmation", () => {
  assert.match(fonction("demanderPuisPartager"), /texteConfirmationPartage\(/);
  assert.match(fonction("demanderPuisPartager"), /if \(question && !await demander\(question\)\) return;/);
  const listeur = fonction("chargerPartages");
  assert.match(listeur, /demanderPuisPartager\(partage,/);
  assert.ok(!/=> partager\(partage\.prof_id,/.test(listeur), "plus d'appel direct depuis la liste");
  const ajout = blocDepuis(script, script.indexOf('$("ajouter-partage").addEventListener("click"'));
  assert.match(ajout, /texteConfirmationPartage\(/);
});

// ------------------------------------------------------------- verrou d'inactivité

const creerVeille = new Function(`${fonction("creerVeille")}\nreturn creerVeille;`)();

test("30 minutes sans un geste ferment la session, un geste réarme le verrou", () => {
  const MINUTE = 60000;
  const veille = creerVeille(30 * MINUTE);
  assert.equal(veille.active(), false, "avant la connexion, rien à surveiller");
  assert.equal(veille.doitFermer(1e12), false);
  const t0 = 1_000_000_000_000;
  veille.demarrer(t0);
  assert.equal(veille.doitFermer(t0 + 29 * MINUTE), false);
  assert.equal(veille.doitFermer(t0 + 30 * MINUTE), true);
  // Un geste à la 29e minute repousse l'échéance.
  veille.geste(t0 + 29 * MINUTE);
  assert.equal(veille.doitFermer(t0 + 45 * MINUTE), false);
  assert.equal(veille.doitFermer(t0 + 59 * MINUTE + 1), true);
  // Machine mise en veille trois heures : les minuteurs n'ont pas tourné, mais
  // l'horloge, si. C'est elle qui décide.
  veille.geste(t0);
  assert.equal(veille.doitFermer(t0 + 3 * 3600 * 1000), true);
  // Après la déconnexion, plus rien à fermer (et pas de boucle de rechargement).
  veille.arreter();
  assert.equal(veille.doitFermer(t0 + 10 * 3600 * 1000), false);
});

test("le verrou est armé à la connexion et contrôlé au retour sur l'onglet", () => {
  assert.match(script, /const INACTIVITE_MS = 30 \* 60 \* 1000;/);
  assert.match(script, /veille\.demarrer\(Date\.now\(\)\)/);
  assert.match(fonction("controlerVeille"), /deconnecter\(\{recharger: true, avis: "inactivite"\}\)/);
  assert.match(script, /document\.addEventListener\("visibilitychange"/);
  assert.match(script, /setInterval\(controlerVeille, 60000\)/);
  assert.match(fonction("oublierEtat"), /veille\.arreter\(\)/);
  // Le message survit au rechargement : il est posé avant, lu après.
  assert.match(script, /inactivite: "Tu as été déconnecté après 30 minutes/);
  assert.match(fonction("lireAvis"), /sessionStorage\.removeItem\(CLE_AVIS\)/);
});

// --------------------------------------------------- ce qui reste après « Se déconnecter »

const ZONES_TEXTE = constante("ZONES_TEXTE");
const ZONES_MESSAGE = constante("ZONES_MESSAGE");
const CHAMPS_A_VIDER = constante("CHAMPS_A_VIDER");
const BLOCS_A_CACHER = constante("BLOCS_A_CACHER");

test("viderZones() vide toutes les zones annoncées, referme les boîtes", () => {
  const tous = [...ZONES_TEXTE, ...ZONES_MESSAGE, ...CHAMPS_A_VIDER, ...BLOCS_A_CACHER, "boite", "secret"];
  const faux = creerDocument(tous);
  tous.forEach(id => {
    const noeud = faux.$(id);
    noeud.textContent = "Léa B. A65TV3";
    noeud.value = "A65TV3";
    noeud.hidden = false;
    noeud.open = true;
    noeud.close = () => { noeud.open = false; };
  });
  new Function("$", "ZONES_TEXTE", "ZONES_MESSAGE", "CHAMPS_A_VIDER", "BLOCS_A_CACHER",
    `${fonction("viderZones")}\nviderZones();`)(faux.$, ZONES_TEXTE, ZONES_MESSAGE, CHAMPS_A_VIDER, BLOCS_A_CACHER);
  ZONES_TEXTE.forEach(id => assert.equal(faux.$(id).textContent, "", `${id} vidé`));
  ZONES_MESSAGE.forEach(id => {
    assert.equal(faux.$(id).textContent, "", `${id} vidé`);
    assert.equal(faux.$(id).hidden, true, `${id} masqué`);
  });
  CHAMPS_A_VIDER.forEach(id => assert.equal(faux.$(id).value, "", `${id} vidé`));
  BLOCS_A_CACHER.forEach(id => assert.equal(faux.$(id).hidden, true, `${id} masqué`));
  assert.equal(faux.$("boite").open, false, "la boîte de dialogue est refermée");
  assert.equal(faux.$("secret").open, false, "le mot de passe temporaire ne reste pas affiché");
});

test("toute zone de la page qui reçoit des données est dans la liste à vider", () => {
  // Le garde-fou qui survivra aux lots suivants : si quelqu'un ajoute une
  // liste, un tableau ou un titre rempli par le script, il doit apparaître
  // dans ZONES_TEXTE, sinon les prénoms et les codes y resteront après la
  // déconnexion.
  const conteneurs = [...page.matchAll(/<(ul|tbody|h1|h2)\b[^>]*\bid="([^"]+)"/g)].map(m => m[2]);
  assert.ok(conteneurs.length >= 10, `assez de conteneurs trouvés (${conteneurs.length})`);
  conteneurs.forEach(id => assert.ok(ZONES_TEXTE.includes(id),
    `« ${id} » est rempli par le script : il doit être dans ZONES_TEXTE`));
  const messages = [...page.matchAll(/<p class="message(?: erreur)?"[^>]*\bid="([^"]+)"/g)].map(m => m[1]);
  assert.ok(messages.length >= 6, `assez de zones de message trouvées (${messages.length})`);
  messages.forEach(id => assert.ok(ZONES_MESSAGE.includes(id),
    `« ${id} » peut porter un prénom ou un mot de passe : il doit être dans ZONES_MESSAGE`));
});

test("« Se déconnecter » vide d'abord, prévient le serveur ensuite, puis recharge", () => {
  const source = fonction("deconnecter");
  const posOublier = source.indexOf("oublierEtat()");
  const posVider = source.indexOf("viderZones()");
  const posFermer = source.indexOf("fermerSession(");
  assert.ok(posOublier > 0 && posVider > posOublier && posFermer > posVider,
    "on vide l'état et le document AVANT d'attendre le réseau");
  assert.ok(!/await/.test(source.slice(0, posFermer)), "aucune attente avant d'avoir vidé la page");
  assert.match(script, /\$\("deconnexion"\)\.addEventListener\("click", \(\) => deconnecter\(\{recharger: true\}\)\)/);
  // Réseau coupé : deux essais, puis on le dit au lieu d'avaler l'échec.
  const fermer = fonction("fermerSession");
  assert.match(fermer, /essai < 2/);
  assert.match(script, /"serveur-muet": "Déconnexion faite sur cet appareil/);
  assert.match(source, /poserAvis\("serveur-muet"\)/);
});

test("le mot de passe temporaire d'un collègue ne s'écrit plus dans la page", () => {
  assert.ok(!/messager\([^;]*motdepasse/s.test(script),
    "aucun message de la page ne contient le mot de passe temporaire");
  assert.match(fonction("reinitialiserProf"), /montrerSecret\(/);
  assert.match(blocDepuis(script, script.indexOf('$("ajouter-prof").addEventListener("click"')), /montrerSecret\(/);
  const secret = fonction("montrerSecret");
  assert.match(secret, /setTimeout\(effacer, 120000\)/, "effacé tout seul au bout de deux minutes");
  assert.match(secret, /\$\("secret-note"\)\.onclick = effacer/, "« J’ai noté » l'efface");
  assert.match(secret, /\$\("secret-valeur"\)\.textContent = ""/);
});

test("les boutons qui envoient sont désactivés pendant l'envoi", () => {
  const creerClasse = blocDepuis(script, script.indexOf('$("form-classe").addEventListener("submit"'));
  assert.match(creerClasse, /bouton\.disabled = true/);
  assert.match(creerClasse, /finally \{ bouton\.disabled = false; \}/);
  const ajouter = blocDepuis(script, script.indexOf('$("ajouter").addEventListener("click"'));
  assert.match(ajouter, /bouton\.disabled = true/);
  assert.match(ajouter, /finally \{ bouton\.disabled = false; \}/);
  const voirFiche = fonction("voirFiche");
  assert.match(voirFiche, /bouton\.disabled = true/);
});

// ------------------------------------------------------------------ hors de mathsgo.re

test("la page ne charge plus aucune image de mathsgo.re", () => {
  const balises = [...page.matchAll(/<(img|link)\b[^>]*>/g)].map(m => m[0]);
  balises.forEach(balise => {
    assert.ok(!/https?:\/\//.test(balise), `image ou icône chargée d'ailleurs : ${balise}`);
  });
  assert.match(page, /<img src="\.\.\/mathsgo-logo\.png"/);
  assert.match(page, /<link rel="icon" href="\.\.\/favicon\.ico"/);
  assert.match(page, /<link rel="apple-touch-icon" href="\.\.\/apple-touch-icon\.png"/);
});

// ------------------------------------------------------- l'espace élève, même mot

test("dans l'espace élève, le bouton s'appelle « Se déconnecter » et ne laisse rien", () => {
  const espace = readFileSync(join(racine, "_serveur/public/index.php"), "utf8");
  assert.match(espace, /<button type="button" class="secondaire" id="changer">Se déconnecter<\/button>/,
    "le même mot que dans l’appli (« Ce n’est pas moi » disait autre chose au même endroit)");
  assert.ok(!espace.includes("id=\"changer\">Ce n’est pas moi"), "l'ancien libellé a disparu");
  const debut = espace.indexOf('$("changer").addEventListener("click"');
  assert.ok(debut > 0, "le bouton a son gestionnaire");
  const bloc = espace.slice(debut, espace.indexOf("});", debut));
  ['$("titre").textContent = "Mon espace"', '$("classe").textContent = ""', '$("applis").textContent = ""']
    .forEach(attendu => assert.ok(bloc.includes(attendu),
      `« Se déconnecter » doit aussi nettoyer la page : ${attendu}`));
  // Les icônes et le logo de l'espace élève viennent d'ici, comme pour Ma classe.
  [...espace.matchAll(/<(img|link)\b[^>]*>/g)].map(m => m[0]).forEach(balise => {
    assert.ok(!/https?:\/\//.test(balise), `image ou icône chargée d'ailleurs : ${balise}`);
  });
});
