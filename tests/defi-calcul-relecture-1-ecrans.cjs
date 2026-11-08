// Défi calcul, relecture 1 : le lot « règles communes » (05/11/2026), au
// navigateur, élève connecté (un faux serveur de suivi répond, le bandeau
// « Suivi » est affiché).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   npm install --no-save playwright
//   node tests/defi-calcul-relecture-1-ecrans.cjs
//
// Ce qui est vérifié :
//   outils     Je m'entraîne : les sept outils (perles, glisse-nombres, carré,
//              jetons, bandes, billes, jetons à toucher) finis, rien n'est
//              écrit sous eux qui donne la réponse ; dans J'apprends, la trace
//              reste (le même outil, sans l'option) ;
//   perles     un vrai entraînement (A10-2, au doigt) : avant le geste, ce
//              qu'il reste à faire ; après, plus rien ;
//   ecris      J'écris fini reste à l'écran avec « Suivant » (plus de passage
//              tout seul) ; au téléphone, le travail en haut ;
//   retenir    les 95 « À retenir » : rien ne défile, le calcul seul sur sa
//              ligne, jamais coupé ni plus large que le cadre ;
//   iphone     Safari simulé (100vh plus grand que l'écran visible) : « À
//              retenir » ne rapetisse plus (100svh) ;
//   lecon      J'apprends sur ordinateur : un seul cadre pour toute la leçon ;
//   boutons    le niveau choisi garde un bord de 2 px ;
//   pastilles  le chiffre centré dans son rond ; pendant J'apprends, une seule
//              ligne de pastilles (la séance), le temps nommé au-dessus de la barre.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const AIDES = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_aides.js"));
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"};
const SEULEMENT = process.env.DEFI_CALCUL_SEULEMENT || "";
const CONSTRUITS = CORE.MODULES.filter(fiche => fiche.construit).flatMap(fiche => fiche.niveaux.map(n => `${fiche.id}-${n.n}`));

// SAFARI=1 : le CSS est servi avec 100vh plus grand que l'écran (comme
// Safari sur iPhone, barres affichées) ; 100svh reste la hauteur visible.
function servir({safari = false} = {}) {
  const serveur = http.createServer((requete, reponse) => {
    const chemin = decodeURIComponent(new URL(requete.url, "http://x").pathname);
    const fichier = path.join(RACINE, chemin);
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) {
      reponse.writeHead(404);
      reponse.end();
      return;
    }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    if (safari && fichier.endsWith(".css")) reponse.end(fs.readFileSync(fichier, "utf8").replace(/\b100vh\b/g, "calc(100vh + 180px)"));
    else fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(resolve => serveur.listen(0, "127.0.0.1", () => resolve(serveur)));
}

// Élève connecté, sauf pour le mode professeur (« &prof=1 » : le module
// ouvert en classe, que l'élève connecté ne voit pas).
async function ouvrir(navigateur, base, [largeur, hauteur], requete = "") {
  const eleve = !requete.includes("prof=1");
  const contexte = await navigateur.newContext({viewport: {width: largeur, height: hauteur}, hasTouch: largeur < 700, timezoneId: "Indian/Reunion"});
  const page = await contexte.newPage();
  await page.clock.install({time: new Date("2026-10-12T10:00:00+04:00")});
  const erreurs = [];
  page.on("console", message => { if (message.type() === "error") erreurs.push(message.text()); });
  page.on("pageerror", erreur => erreurs.push(`erreur de page : ${erreur.message}`));
  if (eleve) await page.addInitScript(() => { try { window.sessionStorage.setItem("mathsgo-suivi-code", "7K3M9P"); } catch (_) {} });
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const rendre = donnees => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(donnees)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "4e B"});
    if (corps.lire) return rendre({ok: true, existe: false, revision: 0});
    return rendre({ok: true, revision: 1});
  });
  await page.goto(`${base}/outils/calcul_mental/defi_calcul_modules.html?test${requete}`);
  await page.waitForTimeout(600);
  if (eleve) assert.ok(await page.isVisible("#suivi-repere"), "le bandeau de suivi est affiché");
  return {page, contexte, erreurs};
}

const defile = page => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
async function taper(page, nombre) {
  for (const signe of CORE.formaterNombre(nombre).replace(/\s/g, "").replace(".", ",")) await page.click(`#play [data-key="${signe}"]`);
}

// Relecture 2 (08/11/2026) : « Je représente » de M1 se fait par étapes,
// comme J'écris ; puis « Suivant ».
async function representer(page, apprends) {
  const r = apprends.represente;
  if (r.etapes) {
    for (const etape of r.etapes) { await taper(page, etape.reponse); await page.click("#validate"); await page.waitForTimeout(300); }
    await page.waitForTimeout(300);
    await page.click("#validate");
    return;
  }
  await taper(page, r.reponse);
  await page.click("#validate");
}
async function glisser(page, rangee, index, pousser) {
  const g = await page.evaluate(([r, i]) => {
    const perle = document.querySelectorAll(".perles-rangee")[r].querySelectorAll(".perle")[i].getBoundingClientRect();
    const cadre = document.querySelector(".perles-interieur").getBoundingClientRect();
    return {x: perle.left + perle.width / 2, y: perle.top + perle.height / 2, gauche: cadre.left, droite: cadre.right};
  }, [rangee, index]);
  await page.mouse.move(g.x, g.y);
  await page.mouse.down();
  const cible = pousser ? g.gauche - 20 : g.droite + 20;
  for (let pas = 1; pas <= 6; pas += 1) await page.mouse.move(g.x + (cible - g.x) * pas / 6, g.y);
  await page.mouse.up();
  await page.waitForTimeout(300);
}
async function gestesPerles(page, m) {
  const etats = Array.from({length: 10}, (_, r) => Math.max(0, Math.min(10, m.depart - r * 10)));
  for (const geste of m.gestes) {
    const rangee = AIDES.gesteAttendu(etats, geste).rangees[0];
    if (geste > 0) await glisser(page, rangee, etats[rangee] + geste - 1, true);
    else await glisser(page, rangee, etats[rangee] + geste, false);
    etats[rangee] += geste;
  }
}

// Un outil seul, dans la page, avec ou sans réponse : fini par ses gestes
// attendus (clics, touches), puis ce qui est écrit sous lui.
function outilFini([cle, outil, sansReponse]) {
  const C = window.MATHSGO_DEFI_CALCUL_CORE;
  const A = window.MATHSGO_DEFI_CALCUL_AIDES;
  let calcul = null;
  let m = null;
  for (let graine = 1; graine < 80 && !m; graine += 1) {
    for (const c of C.genererSerie(cle, {graine})) {
      const x = C.manipulationDe(c);
      if (x && x.outil === outil) { calcul = c; m = x; break; }
    }
  }
  if (!m) return {absent: true};
  const zone = document.createElement("div");
  zone.style.width = "360px";
  document.body.append(zone);
  const fabrique = {glisse: A.glisseNombres, toucher: A.toucherCalcul, carre: A.carreManip, jetons: A.jetonsManip, bandes: A.bandesManip, billes: A.billesManip}[outil];
  const outilVu = fabrique(zone, Object.assign({}, m, {sansReponse}));
  const touche = (el, key) => el.dispatchEvent(new KeyboardEvent("keydown", {key, bubbles: true, cancelable: true}));
  for (let garde = 0; garde < 60 && !outilVu.fini; garde += 1) {
    if (outil === "glisse") {
      const barre = zone.querySelector(".place-value-drag-bar");
      for (let i = 0; i < Math.abs(m.decalage); i += 1) touche(barre, m.decalage > 0 ? "ArrowLeft" : "ArrowRight");
      touche(barre, "Enter");
      break;
    } else if (outil === "carre") zone.querySelector(".dc-carre-grand").click();
    else if (outil === "jetons") {
      const echange = zone.querySelector(".dc-jetons-col.a-echanger");
      if (echange) echange.click();
      else zone.querySelector(`.dc-reserve .dc-pion[data-rang="${m.rang}"]`).click();
    } else if (outil === "bandes") touche(zone.querySelector(".dc-bandes-scene"), "Enter");
    else if (outil === "billes") touche(zone.querySelector(".dc-billes-scene"), "Enter");
    else if (outil === "toucher") {
      const jeton = [...zone.querySelectorAll(".dc-jeton[data-index]")].find(j => {
        const ligne = m.lignes.find(l => l.jetons.join(" ") === [...zone.querySelectorAll(".dc-toucher-calcul > .dc-jeton")].map(x => x.textContent).join(" ")) || m.lignes[0];
        const i = Number(j.dataset.index);
        return /\d/.test(j.textContent) && ligne.sous.some(([a, b]) => i >= a && i <= b && !ligne.jetons.slice(a + 1, b).includes("("));
      });
      if (!jeton) break;
      jeton.click();
    }
  }
  const trace = zone.querySelector(".dc-trace");
  const resultat = {fini: Boolean(outilVu.fini), trace: trace ? trace.textContent : "", ok: trace ? trace.querySelectorAll("b.ok").length : 0,
    reponse: C.formaterNombre(calcul.reponse), calcul: calcul.texte,
    entoures: zone.querySelectorAll(".dc-jetons-choisis").length, calcules: zone.querySelectorAll(".dc-jeton.est-trouve").length, chiffres: zone.querySelector(".dc-toucher-calcul") ? zone.querySelector(".dc-toucher-calcul").textContent : ""};
  outilVu.detruire();
  zone.remove();
  return resultat;
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const navigateur = await chromium.launch();
  let echecs = 0;
  const essai = async (nom, corps) => {
    if (SEULEMENT && !nom.startsWith(SEULEMENT)) return;
    try { await corps(); console.log(`ok ${nom}`); } catch (erreur) { echecs += 1; console.log(`ÉCHEC ${nom}\n  ${erreur.message}`); }
  };

  await essai("outils : Je m'entraîne, les sept outils finis ne donnent pas la réponse", async () => {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, [390, 664]);
    const cas = [["M2-1", "glisse"], ["D2-2", "glisse"], ["D1-1", "carre"], ["D4-1", "jetons"], ["D4-3", "jetons"], ["F2-1", "bandes"], ["F1-1", "bandes"], ["F3-1", "billes"], ["C1-1", "toucher"], ["C1-3", "toucher"]];
    for (const [cle, outil] of cas) {
      const sans = await page.evaluate(outilFini, [cle, outil, true]);
      assert.ok(!sans.absent, `${cle} : un calcul avec ${outil}`);
      assert.ok(sans.fini, `${cle} (${outil}) : l'outil se finit`);
      assert.equal(sans.ok, 0, `${cle} (${outil}) : pas d'étape faite écrite sous l'outil (« ${sans.trace} »)`);
      assert.doesNotMatch(sans.trace, new RegExp(`=\\s*${sans.reponse.replace(/[\u202f\u00a0 ]/g, "[\\s\\u202f\\u00a0]?")}\\b`), `${cle} (${outil}) : la réponse n'est pas écrite (${sans.calcul})`);
      if (outil === "toucher") assert.ok(sans.entoures >= 1 && sans.calcules === 0, `${cle} : le calcul touché s'entoure sans son nombre (${sans.entoures} entouré, ${sans.calcules} calculé)`);
      if (outil === "toucher") assert.doesNotMatch(sans.chiffres, new RegExp(`(^|\\D)${sans.reponse}(\\D|$)`), `${cle} : le calcul touché ne donne pas la réponse (« ${sans.chiffres} »)`);
      // Dans J'apprends (sans l'option), l'outil écrit toujours son calcul.
      const avec = await page.evaluate(outilFini, [cle, outil, false]);
      if (outil !== "toucher") assert.ok(avec.ok >= 1, `${cle} (${outil}) : dans J'apprends, la trace reste`);
    }
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  for (const taille of [[390, 664], [1366, 768]]) {
    await essai(`perles ${taille.join("x")} : un vrai entraînement, le boulier ne donne pas la réponse`, async () => {
      // A1-2 (sommes jusqu'à 20) : le boulier à chaque calcul où il est montré.
      const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, "&prof=1&module=A1&niveau=2");
      await page.locator("button:visible", {hasText: "Je m’entraîne"}).first().click();
      await page.waitForTimeout(700);
      let vus = 0;
      for (let i = 0; i < 4; i += 1) {
        const c = await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul());
        const en = await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.entrainement());
        if (en.outil === "manip" && await page.$("#aide .perles-scene")) {
          const m = CORE.manipulationDe(c);
          const avant = await page.evaluate(() => [...document.querySelectorAll("#aide .dc-trace b")].map(b => `${b.className}:${b.textContent}`));
          assert.ok(avant.length >= 1 && avant.every(t => t.startsWith("ici:")), `${c.texte} : avant le geste, ce qu'il reste à faire (${avant})`);
          await gestesPerles(page, m);
          await page.waitForTimeout(400);
          const apres = await page.evaluate(() => document.querySelector("#aide .dc-trace").textContent);
          assert.equal(apres, "", `${c.texte} : après le geste, rien sous le boulier`);
          vus += 1;
        }
        await taper(page, c.reponse);
        await page.click("#validate");
        await page.waitForTimeout(900);
      }
      assert.ok(vus >= 1, "le boulier a été vu");
      assert.deepEqual(erreurs, []);
      await contexte.close();
    });

    await essai(`ecris ${taille.join("x")} : J'écris fini reste à l'écran avec « Suivant »`, async () => {
      const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille);
      for (const cle of ["M1-1", "A8-2"]) {
        const [id, n] = cle.split("-");
        await page.evaluate(([i, k]) => window.__MATHSGO_DEFI_CALCUL_TEST__.apprendre(i, k), [id, Number(n)]);
        await page.waitForTimeout(300);
        const apprends = CORE.niveauDe(cle).niveau.apprends;
        await representer(page, apprends);
        await page.waitForSelector("#question-card.ecrit", {timeout: 8000});
        const consigne = await page.evaluate(() => (document.querySelector("#aide > .consigne") || {}).textContent || "");
        assert.equal(consigne.replace(/[\u202f\u00a0]/g, " "), apprends.ecris.consigne.replace(/[\u202f\u00a0]/g, " "), `${cle} : la ligne du but au-dessus du dessin`);
        for (const etape of apprends.ecris.etapes) {
          await taper(page, etape.reponse);
          await page.click("#validate");
          await page.waitForTimeout(300);
        }
        await page.waitForTimeout(1500);
        assert.ok(await page.isVisible("#question-card.ecrit-fini"), `${cle} : J'écris fini reste à l'écran`);
        assert.equal((await page.textContent("#validate")).trim(), "Suivant", `${cle} : « Suivant »`);
        assert.ok(await page.isVisible("#validate"), `${cle} : « Suivant » se voit`);
        assert.ok(await defile(page) <= 1, `${cle} : rien ne défile`);
        if (taille[0] < 700) {
          const vide = await page.evaluate(() => document.getElementById("aide").getBoundingClientRect().top - document.getElementById("question-card").getBoundingClientRect().top);
          assert.ok(vide < 24, `${cle} : le travail est en haut du cadre (${Math.round(vide)} px au-dessus)`);
        }
        await page.click("#validate");
        await page.waitForTimeout(500);
        assert.ok(await page.isVisible("#result-retenir"), `${cle} : « Suivant » mène à « À retenir »`);
      }
      assert.deepEqual(erreurs, []);
      await contexte.close();
    });

    await essai(`retenir ${taille.join("x")} : les 95 « À retenir », le calcul seul sur sa ligne`, async () => {
      const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille);
      const fautes = [];
      for (const cle of CONSTRUITS) {
        const [id, n] = cle.split("-");
        await page.evaluate(([i, k]) => window.__MATHSGO_DEFI_CALCUL_TEST__.retenir(i, k), [id, Number(n)]);
        await page.waitForTimeout(120);
        const m = await page.evaluate(() => {
          const phrase = document.getElementById("retenir-phrase");
          const calcul = phrase.querySelector(".dc-retenir-calcul");
          const ligne = parseFloat(getComputedStyle(phrase).lineHeight);
          return {defile: document.documentElement.scrollHeight - window.innerHeight,
            // Les calculs restés dans la phrase sont soudés : rien ne dépasse.
            phrase: phrase.scrollWidth - phrase.clientWidth,
            // Une seule ligne : le premier et le dernier morceau de texte du
            // calcul ont la même hauteur (une fraction est plus haute, pas
            // sur une autre ligne).
            calcul: calcul ? (() => {
              const textes = [];
              const marche = document.createTreeWalker(calcul, NodeFilter.SHOW_TEXT);
              while (marche.nextNode()) if (marche.currentNode.textContent.trim() && !marche.currentNode.parentElement.closest(".dc-frac")) textes.push(marche.currentNode);
              const milieu = noeud => { const r = document.createRange(); r.selectNodeContents(noeud); const b = r.getBoundingClientRect(); return (b.top + b.bottom) / 2; };
              const ecart = textes.length > 1 ? Math.abs(milieu(textes[0]) - milieu(textes[textes.length - 1])) : 0;
              return {lignes: ecart > parseFloat(getComputedStyle(calcul).fontSize) * .6 ? 2 : 1, deborde: calcul.scrollWidth - calcul.clientWidth};
            })() : null,
            ligne};
        });
        const attendu = Boolean(AIDES.bilanEnDeux(CORE.niveauDe(cle).niveau.apprends.bilan));
        if (m.defile > 1) fautes.push(`${cle} défile de ${m.defile} px`);
        if (m.phrase > 1) fautes.push(`${cle} : la phrase dépasse de ${m.phrase} px`);
        if (attendu !== Boolean(m.calcul)) fautes.push(`${cle} : calcul sur sa ligne ${Boolean(m.calcul)}, attendu ${attendu}`);
        if (m.calcul && m.calcul.lignes > 1) fautes.push(`${cle} : le calcul tient sur ${m.calcul.lignes} lignes`);
        if (m.calcul && m.calcul.deborde > 1) fautes.push(`${cle} : le calcul dépasse de ${m.calcul.deborde} px`);
      }
      assert.deepEqual(fautes, [], fautes.join(" ; "));
      assert.deepEqual(erreurs, []);
      await contexte.close();
    });
  }

  await essai("iphone 390x664 : Safari simulé, « À retenir » garde la taille d'un écran normal (100svh)", async () => {
    const safari = await servir({safari: true});
    const vu = async adresse => {
      const {page, contexte, erreurs} = await ouvrir(navigateur, adresse, [390, 664]);
      const tailles = {};
      for (const cle of ["A10-2", "M1-1", "D2-1", "F3-1", "A11-3", "M4-2"]) {
        const [id, n] = cle.split("-");
        await page.evaluate(([i, k]) => window.__MATHSGO_DEFI_CALCUL_TEST__.retenir(i, k), [id, Number(n)]);
        await page.waitForTimeout(200);
        tailles[cle] = await page.evaluate(() => [document.documentElement.style.getPropertyValue("--retenir-z") || "1",
          Math.round(document.querySelector("#retenir-image svg").getBoundingClientRect().width)].join(" "));
      }
      assert.deepEqual(erreurs, []);
      await contexte.close();
      return tailles;
    };
    const normal = await vu(base);
    const iphone = await vu(`http://127.0.0.1:${safari.address().port}`);
    safari.close();
    assert.deepEqual(iphone, normal, "Safari : la phrase et le dessin gardent leur taille (échelle, largeur du dessin)");
  });

  await essai("lecon 1366x768 : J'apprends garde un seul cadre, du premier écran à « À retenir »", async () => {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, [1366, 768]);
    const largeur = () => page.evaluate(() => Math.round(document.querySelector(".panel").getBoundingClientRect().width));
    for (const cle of ["A10-2", "M1-1", "D4-1"]) {
      const [id, n] = cle.split("-");
      await page.evaluate(([i, k]) => window.__MATHSGO_DEFI_CALCUL_TEST__.apprendre(i, k), [id, Number(n)]);
      await page.waitForTimeout(400);
      const apprends = CORE.niveauDe(cle).niveau.apprends;
      const vues = [await largeur()];
      if (apprends.manipule && apprends.manipule.outil === "perles") {
        await gestesPerles(page, apprends.manipule);
        await page.waitForTimeout(300);
        vues.push(await largeur());
        await page.click("#validate");
        await page.waitForTimeout(400);
      } else if (apprends.manipule && apprends.manipule.outil === "jetons") {
        await page.click(`.dc-reserve .dc-pion[data-rang="${apprends.manipule.rang}"]`);
        await page.waitForTimeout(300);
        while (await page.$(".dc-jetons-col.a-echanger")) { await page.click(".dc-jetons-col.a-echanger"); await page.waitForTimeout(300); }
        await page.click("#validate");
        await page.waitForTimeout(400);
      }
      vues.push(await largeur());
      await representer(page, apprends);
      await page.waitForSelector("#question-card.ecrit", {timeout: 8000});
      vues.push(await largeur());
      for (const etape of apprends.ecris.etapes) { await taper(page, etape.reponse); await page.click("#validate"); await page.waitForTimeout(300); }
      vues.push(await largeur());
      await page.click("#validate");
      await page.waitForTimeout(500);
      vues.push(await largeur());
      assert.ok(Math.max(...vues) - Math.min(...vues) <= 1, `${cle} : un seul cadre (${vues.join(", ")} px)`);
      assert.ok(await defile(page) <= 1, `${cle} : rien ne défile`);
    }
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  await essai("boutons et pastilles 390x664 : bord de 2 px, chiffre centré", async () => {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, [390, 664], "&prof=1&module=M1");
    await page.locator(".dc-niveaux button").nth(1).click();
    await page.waitForTimeout(200);
    const bords = await page.evaluate(() => [...document.querySelectorAll(".dc-niveaux button")].map(b => `${b.className}:${getComputedStyle(b).borderTopWidth}`));
    assert.ok(bords.length >= 2 && bords.some(b => b.startsWith("ici")), `un niveau choisi (${bords})`);
    bords.forEach(b => assert.match(b, /:2px$/, `même bord pour tous (${b})`));
    await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.apprendre("M1", 1));
    await page.waitForTimeout(300);
    // Une seule ligne de pastilles (celle de la séance) ; le temps en cours
    // se nomme au-dessus de la barre.
    assert.equal(await page.locator("#seance-fil li").count(), 0, "plus de pastilles des temps");
    assert.equal((await page.textContent("#seance-fil b")).trim(), "Je représente");
    const pastilles = await page.evaluate(() => [...document.querySelectorAll(".seance-fil:not([hidden]) li")].map(li => getComputedStyle(li).textBoxTrim));
    assert.ok(pastilles.length >= 3, "des pastilles");
    pastilles.forEach(t => assert.equal(t, "trim-both", "la boîte du chiffre est rognée à sa hauteur"));
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  await navigateur.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} échec(s)`); process.exit(1); }
})().catch(erreur => { console.error(erreur); process.exit(1); });
