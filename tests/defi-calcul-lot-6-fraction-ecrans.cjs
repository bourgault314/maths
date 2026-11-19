// Défi calcul, lot 6 « fraction à deux cases » (18/11/2026) : la VRAIE page,
// au navigateur, élève connecté (faux serveur de suivi), aux 5 formats
// (390 × 664, 390 × 844, 1366 × 657, 1366 × 768, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-6-fraction-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-6-fraction-ecrans.cjs
//
//   saisie    « 6 × □/□ = 5 » : le numérateur d'abord, Valider descend dans le
//             dénominateur (rien ne compte), puis Bravo ; rien ne bouge
//             pendant la frappe, « Valider » se voit ;
//   toucher   le dénominateur touché d'abord, puis le numérateur ; ⌫ dans un
//             dénominateur vide remonte ; « Effacer » vide les deux ;
//   clavier   « / », Tab, ↑, Entrée ; « 5/0 » : le dénominateur à corriger ;
//   erreurs   6/5, 5/1, 30/1 : la phrase de la cause ; 1/6 : « Ta réponse :
//             1/6 » ; 10/12 : « Bravo ! 10/12 = 5/6. » ;
//   annonce   la fraction cherchée annoncée, avec son dessin (« ?/7 ») ;
//   écrire    J'écris de la leçon : « 3 × □/3 = 2 », puis les deux cases ;
//   test      « Tu connais déjà ? » (mode prof) : la fraction cherchée, juste ;
//   ailleurs  « 15/3 = □ », « 3 × 5/3 = □ », « 4 × 2/3 = □/3 » : une case,
//             comme avant (aucune case de fraction, la touche « , » cachée).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-18";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = process.env.FORMATS ? process.env.FORMATS.split(",").map(x => x.split("x").map(Number)) : [[390, 664], [390, 844], [1366, 657], [1366, 768], [1920, 1080]];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp"};

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

async function ouvrir(nav, base, {largeur, hauteur, adresse = PAGE, eleve = true}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  // (Le mode professeur s'ouvre sans élève connecté.)
  if (eleve) await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), "7K3M9P");
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const h = {"access-control-allow-origin": "*"};
    const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: h, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: {}});
    if (corps.lire) return rendre({ok: true, existe: false, parcours: null, revision: 1});
    return rendre({ok: true, revision: 2});
  });
  await page.goto(base + adresse);
  for (let i = 0; i < 40; i += 1) { await page.clock.runFor(100); await page.waitForTimeout(25); }
  return {page, ctx, erreurs};
}

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(80); };
const appel = (page, nom, ...args) => page.evaluate(([n, a]) => window.__MATHSGO_DEFI_CALCUL_TEST__[n](...a), [nom, args]);
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, s);
async function photo(page, nom) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.screenshot({path: path.join(SORTIE, `${nom}.png`)});
}
async function tient(page, largeur, hauteur) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "pas de défilement de côté");
  if (largeur > 620) {
    const bas = await page.evaluate(() => document.querySelector(".panel:not([hidden])").getBoundingClientRect().bottom);
    assert.ok(bas <= hauteur + .5, `le cadre tient entier (${Math.round(bas)} / ${hauteur})`);
  }
}
const boite = (page, sel) => page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel);
const memePlace = (a, b) => Boolean(a && b) && a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= 1);
const valideSeVoit = page => page.evaluate(() => { const p = document.querySelector(".panel:not([hidden])").getBoundingClientRect(); const v = document.querySelector("#validate").getBoundingClientRect(); return v.bottom <= p.bottom + .5 && v.bottom <= innerHeight + .5; });
// Ce que disent les deux cases : [numérateur, dénominateur, la case active].
const cases = page => page.evaluate(() => {
  const t = id => { const e = document.getElementById(id); return e ? e.textContent.replace(/ /g, "").trim() : null; };
  const active = document.querySelector("#expression .inline-answer.est-active");
  return [t("inline-answer-num"), t("inline-answer-den"), active ? active.dataset.partie : null];
});
// Taper au pavé, et vérifier que rien ne bouge.
async function taper(page, chiffres, nom) {
  const avant = [await boite(page, "#expression"), await boite(page, "#inline-answer-num"), await boite(page, "#inline-answer-den")];
  for (const c of String(chiffres)) {
    await page.click(`#play [data-key="${c}"]`);
    const apres = [await boite(page, "#expression"), await boite(page, "#inline-answer-num"), await boite(page, "#inline-answer-den")];
    avant.forEach((b, i) => { if (b) assert.ok(memePlace(apres[i], b), `${nom} : rien ne bouge pendant la frappe`); });
  }
}
const toucherCase = async (page, partie) => { await page.click(`#inline-answer-${partie}`); await page.waitForTimeout(40); };
async function poser(page, texteCalcul, outil = "aucun", niveau = 2) {
  assert.ok(await appel(page, "poser", "F11", niveau, texteCalcul, outil), `${texteCalcul} : posé`);
  await pause(page, 500);
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };

  for (const [largeur, hauteur] of FORMATS) {
    const f = `${largeur}x${hauteur}`;

    await cas(`${f} : saisie — le numérateur, Valider descend, le dénominateur, Bravo`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await poser(s.page, "6 × □/□ = 5");
      assert.deepEqual(await cases(s.page), ["", "", "num"], "une fraction neuve commence au numérateur");
      assert.equal(await s.page.evaluate(() => document.getElementById("touches").hidden), true, "pas de touche « , »");
      assert.ok(await valideSeVoit(s.page), "« Valider » se voit");
      await tient(s.page, largeur, hauteur);
      await photo(s.page, `${f}-saisie-1-pose`);
      await taper(s.page, "5", "numérateur");
      assert.deepEqual(await cases(s.page), ["5", "", "num"]);
      await s.page.click("#validate");
      await pause(s.page, 300);
      assert.deepEqual(await cases(s.page), ["5", "", "den"], "Valider descend dans la case vide");
      assert.equal(await texte(s.page, "#answer-feedback"), "", "rien ne compte, rien n'est dit");
      assert.equal((await appel(s.page, "entrainement")).total, 0, "aucune réponse enregistrée");
      await photo(s.page, `${f}-saisie-2-descend`);
      await taper(s.page, "6", "dénominateur");
      assert.deepEqual(await cases(s.page), ["5", "6", "den"]);
      assert.ok(await valideSeVoit(s.page));
      await s.page.click("#validate");
      await pause(s.page, 200);
      assert.equal(await texte(s.page, "#answer-feedback"), "Bravo !");
      await photo(s.page, `${f}-saisie-3-bravo`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : toucher — le dénominateur d'abord ; ⌫ remonte ; Effacer vide les deux`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await poser(s.page, "□/□ × 7 = 3");
      await toucherCase(s.page, "den");
      await taper(s.page, "7", "dénominateur d'abord");
      await toucherCase(s.page, "num");
      await taper(s.page, "3", "numérateur ensuite");
      assert.deepEqual(await cases(s.page), ["3", "7", "num"]);
      await taper(s.page, "12", "deux chiffres");
      assert.deepEqual(await cases(s.page), ["31", "7", "num"], "deux chiffres au plus par case");
      await toucherCase(s.page, "den");
      await s.page.click('#play [data-key="backspace"]');
      await s.page.click('#play [data-key="backspace"]');
      assert.deepEqual(await cases(s.page), ["31", "", "num"], "⌫ dans un dénominateur vide remonte au numérateur");
      await s.page.click('#play [data-key="clear"]');
      assert.deepEqual(await cases(s.page), ["", "", "num"]);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    if (largeur > 620) await cas(`${f} : le clavier — « / », Tab, ↑, Entrée ; « 5/0 »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await poser(s.page, "6 × □/□ = 5");
      await s.page.keyboard.press("5");
      await s.page.keyboard.press("/");
      assert.deepEqual(await cases(s.page), ["5", "", "den"]);
      await s.page.keyboard.press("0");
      await s.page.keyboard.press("Enter");
      await pause(s.page, 200);
      assert.equal(await texte(s.page, "#answer-feedback"), "Le dénominateur ne peut pas être 0.");
      assert.equal((await appel(s.page, "entrainement")).total, 0, "rien ne compte");
      await s.page.keyboard.press("Backspace");
      await s.page.keyboard.press("6");
      await s.page.keyboard.press("ArrowUp");
      assert.deepEqual(await cases(s.page), ["5", "6", "num"]);
      await s.page.keyboard.press("Tab");
      assert.deepEqual(await cases(s.page), ["5", "6", "den"]);
      await s.page.keyboard.press("Enter");
      await pause(s.page, 200);
      assert.equal(await texte(s.page, "#answer-feedback"), "Bravo !");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : les erreurs — 6/5, 5/1, 30/1, 1/6 ; 10/12 est juste`, async () => {
      for (const [num, den, attendu] of [
        ["6", "5", /^6 sur 5 : la fraction est à l’envers\. 5 partagé en 6 : 5 ÷ 6 = 5 sur 6\.$/],
        ["5", "1", /^6 × 5 = 30, pas 5\. 5 partagé en 6 : 5 ÷ 6 =/],
        ["30", "1", /^30, c’est 6 × 5\. 5 partagé en 6 : 5 ÷ 6 =/],
        ["1", "6", /^Ta réponse : /],
        ["10", "12", /^Bravo ! /]]) {
        const s = await ouvrir(nav, base, {largeur, hauteur});
        await poser(s.page, "6 × □/□ = 5");
        await taper(s.page, num, `${num}/${den}`);
        await toucherCase(s.page, "den");
        await taper(s.page, den, `${num}/${den}`);
        await s.page.click("#validate");
        await pause(s.page, 300);
        const bulle = await page_bulle(s.page);
        assert.match(bulle, attendu, `${num}/${den} : ${bulle}`);
        if (num === "10") assert.deepEqual(await cases(s.page), ["10", "12", null], "la fraction tapée reste");
        else assert.deepEqual((await cases(s.page)).slice(0, 2), ["5", "6"], `${num}/${den} : la correction écrit 5/6`);
        assert.ok(await valideSeVoit(s.page) || num === "10", `${num}/${den} : « Suivant » se voit`);
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${f}-erreur-${num}-${den}`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      }
    });

    await cas(`${f} : l'annonce de la fraction cherchée, avec son dessin`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      assert.ok(await appel(s.page, "nouveaute", "F11", 2, "fraction cherchée", "image"));
      await pause(s.page, 500);
      assert.match(await texte(s.page, "#annonce"), /^Nouveau : la fraction cherchée, c’est le nombre qui, multiplié par \d, donne \d\.$/);
      const c = await appel(s.page, "calcul");
      const etiquettes = await s.page.evaluate(() => [...document.querySelectorAll("#aide svg text")].map(t => t.textContent));
      assert.ok(!etiquettes.join(" ").includes(c.ecrite), "le dessin ne donne pas la réponse");
      assert.ok(await valideSeVoit(s.page));
      await tient(s.page, largeur, hauteur);
      await photo(s.page, `${f}-annonce`);
      const [a, d] = c.ecrite.split("/");
      await taper(s.page, a, "annonce");
      await toucherCase(s.page, "den");
      await taper(s.page, d, "annonce");
      await s.page.click("#validate");
      await pause(s.page, 200);
      assert.equal(await texte(s.page, "#answer-feedback"), "Bravo !");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : J'écris de la leçon — « 3 × □/3 = 2 », puis les deux cases`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await appel(s.page, "ecrire", "F11", 2, "lecon");
      await pause(s.page, 500);
      const etapes = await appel(s.page, "ecrisEnCours");
      assert.deepEqual(etapes.map(e => e.texte.replace(/[  ]/g, " ")), ["3 × □/3 = 2", "3 × □/□ = 2"]);
      await photo(s.page, `${f}-ecrire-1`);
      await taper(s.page, "2", "J'écris, étape 1");
      await s.page.click("#validate");
      await pause(s.page, 400);
      assert.deepEqual(await cases(s.page), ["", "", "num"], "l'étape 2 : la fraction à deux cases, au numérateur");
      await taper(s.page, "2", "J'écris, étape 2");
      await s.page.click("#validate");
      await pause(s.page, 300);
      assert.deepEqual(await cases(s.page), ["2", "", "den"]);
      await taper(s.page, "3", "J'écris, étape 2");
      await photo(s.page, `${f}-ecrire-2`);
      await s.page.click("#validate");
      await pause(s.page, 400);
      assert.equal(await texte(s.page, "#answer-feedback"), "Bravo !");
      assert.ok(await valideSeVoit(s.page));
      await tient(s.page, largeur, hauteur);
      await photo(s.page, `${f}-ecrire-3-fini`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : « Tu connais déjà ? » (mode prof) — la fraction cherchée`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, adresse: `${PAGE}&prof=1&module=F11&niveau=2`, eleve: false});
      await s.page.getByRole("button", {name: /Tu connais déjà/}).first().click();
      await pause(s.page, 500);
      let vu = false;
      for (let i = 0; i < 8 && !vu; i += 1) {
        const c = await appel(s.page, "calcul");
        if (!c) break;
        if (c.texte.includes("□/□")) {
          vu = true;
          const [a, d] = c.ecrite.split("/");
          await taper(s.page, a, "test");
          await toucherCase(s.page, "den");
          await taper(s.page, d, "test");
          await photo(s.page, `${f}-test`);
          await s.page.click("#validate");
          await pause(s.page, 300);
          assert.equal(await texte(s.page, "#answer-feedback"), "✓ Juste");
        } else {
          for (const k of CORE.formaterNombre(c.reponse)) await s.page.click(`#play [data-key="${k}"]`);
          await s.page.click("#validate");
          await pause(s.page, 1200);
        }
      }
      assert.ok(vu, "le test pose une fraction cherchée");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : ailleurs, une case comme avant`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [t, n] of [["15/3 = □", 2], ["3 × 5/3 = □", 2], ["4 × 2/3 = □/3", 1]]) {
        await poser(s.page, t, "image", n);
        assert.equal(await s.page.evaluate(() => document.querySelectorAll("#expression .inline-answer").length), 1, t);
        assert.equal(await s.page.evaluate(() => document.querySelectorAll("#expression [data-partie]").length), 0, t);
        const c = await appel(s.page, "calcul");
        for (const k of CORE.formaterNombre(c.reponse)) await s.page.click(`#play [data-key="${k}"]`);
        await s.page.click("#validate");
        await pause(s.page, 200);
        assert.equal(await texte(s.page, "#answer-feedback"), "Bravo !", t);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();

// La bulle de retour, lue comme un lecteur d'écran la lit (« 6 sur 5 »)
// puis telle qu'écrite si elle n'a pas de fraction.
function page_bulle(page) {
  return page.evaluate(() => {
    const b = document.getElementById("answer-feedback");
    // (« 5 ÷ 6 = 5/6 » est soudé dans un .dc-soude : on y descend.)
    const lire = n => (n.nodeType === 3 ? n.textContent : n.classList && n.classList.contains("dc-frac")
      ? `${n.querySelector(".dc-frac-num").textContent} sur ${n.querySelector(".dc-frac-den").textContent}`
      : n.classList && n.classList.contains("dc-soude") ? [...n.childNodes].map(lire).join("") : n.textContent);
    return [...b.childNodes].map(lire).join("").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
  });
}
