/* SPLAT! Enquête — lot « projection » (30/09/2026) : contrôle au NAVIGATEUR, hors CI
   (il lui faut playwright ; « npm run verifier » ne le lance pas).
     node scripts/serve-static.mjs &            (ou tout serveur du dépôt)
     MATHSGO_URL=http://127.0.0.1:4173 node tests/splat-enquete-projection-cadre-regression.cjs
   Pour chacune des adresses ci-dessous (les types de la progression du monde 3), sur chaque
   carte et à chaque appui sur « Étape suivante » : le bas du dessin ①②③ reste dans la scène,
   le plateau ne bouge pas d'une étape à l'autre, la page ne défile pas. Deux fenêtres :
   1400 × 900 (portable) et 1920 × 1080 (tableau).
   Depuis G3 (le pas à pas, 01/10/2026) : jusqu'à 11 appuis par carte ; du schéma vide au dernier
   calcul, le bandeau (TOTAL, petit plateau, phrases) et UNE échelle ne bougent pas ; le dernier
   appui (taches dévoilées, récapitulatif ③) a son propre cadrage, contrôlé à part. */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE = (process.env.MATHSGO_URL ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const OPS = "mul=1&div=1&add=1&sub=1";
const ADRESSES = {
  "2 taches, de plus / de moins": "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=3012&cards=4&unknown=question",
  "2 taches + jetons visibles": "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=50&seed=3012&cards=4&unknown=question",
  "2 taches, fois plus / fois moins, vocabulaire": "mode=C&clues=SENTENCE&splats=2&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&vocab=1&seed=2017&cards=4&unknown=question",
  "indices composés": `mode=C&clues=SENTENCE&splats=2&compose=1&${OPS}&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2118&cards=4&unknown=question`,
  "une référence + jetons visibles": `mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&${OPS}&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=30&totalMax=70&seed=2019&cards=4&unknown=question`,
  "chaîne": `mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&${OPS}&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2116&cards=4&unknown=question`,
  "je complète": `mode=C&clues=SENTENCE&splats=3&structure=COMPLETE&ordre=DESSIN&${OPS}&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2117&cards=4&unknown=question`,
  "unité commune": `mode=C&clues=SENTENCE&splats=3&structure=UNITE&${OPS}&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=90&seed=2124&cards=4&unknown=question`,
  "au hasard, désordre, grands nombres + visibles": `mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESORDRE&${OPS}&deltaMax=25&visibleMin=1&visibleMax=3&totalMin=60&totalMax=120&seed=2119&cards=4&unknown=question`,
  "deux taches réunies + visibles, symboles, lettre": `mode=C&splats=3&structure=HASARD&reunies=1&clues=SYMBOL&${OPS}&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=77&cards=1&unknown=letter`,
  "taches répétées (2 couleurs)": "mode=C&clues=SENTENCE&splats=2&repeat=3&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=34&cards=4&unknown=question",
  "taches répétées (3 couleurs)": `mode=C&clues=SENTENCE&splats=3&structure=HASARD&repeat=3&${OPS}&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=80&seed=2121&cards=4&unknown=question`,
  "sans total": "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=3&cards=4&unknown=question",
  "répétées + sans total + visibles": `mode=C&clues=SENTENCE&splats=2&repeat=3&noTotal=1&${OPS}&deltaMax=20&visibleMin=1&visibleMax=3&totalMin=30&totalMax=70&seed=2024&cards=4&unknown=question`,
};

const mesurer = () => {
  const scene = document.getElementById("mainSvg").getBoundingClientRect();
  const dessin = ["enqueteBarres", "enqueteLigne", "enqueteCalculs"].map((id) => document.getElementById(id)).find(Boolean);
  const plateau = document.getElementById("enqueteProjectionPlateau");
  if(!dessin) return null;
  const r = dessin.getBoundingClientRect(), p = plateau ? plateau.getBoundingClientRect() : null;
  return {
    id: dessin.id, haut: r.top, bas: r.bottom, gauche: r.left, droite: r.right,
    scene: { haut: scene.top, bas: scene.bottom, gauche: scene.left, droite: scene.right },
    basPlateau: p ? p.bottom : null,
    cote: !!plateau && plateau.getAttribute("data-place") === "cote",
    bandeau: !!plateau && plateau.getAttribute("data-place") === "bandeau",
    /* plateau à côté : il reste dans la scène et ne recouvre rien du dessin (le cadre excepté) */
    coteLibre: !p || (p.left >= scene.left - 0.5 && p.right <= scene.right + 0.5 && p.top >= scene.top - 0.5 && p.bottom <= scene.bottom + 0.5
      && Array.from(dessin.querySelectorAll("rect, path, text, line, circle")).filter((n) => n !== dessin.querySelector("rect"))
        .map((n) => n.getBoundingClientRect()).every((b) => b.right <= p.left || b.left >= p.right || b.bottom <= p.top || b.top >= p.bottom)),
    facteurs: `${plateau ? plateau.getAttribute("data-facteur") : ""} / haut ${Math.round(r.top)}`,
    defile: document.documentElement.scrollWidth > innerWidth + 1,
  };
};

(async () => {
  const navigateur = await chromium.launch();
  let etapes = 0, cotes = 0;
  for(const fenetre of [{ width: 1400, height: 900 }, { width: 1920, height: 1080 }]){
    const page = await navigateur.newPage({ viewport: fenetre });
    const erreurs = [];
    page.on("pageerror", (e) => erreurs.push(String(e)));
    for(const [nom, requete] of Object.entries(ADRESSES)){
      await page.goto(`${BASE}/outils/splat.html?${requete}`);
      await page.waitForFunction(() => /Carte 1 /.test(document.getElementById("counter").textContent));
      const cartes = Number(new URLSearchParams(requete).get("cards"));
      for(let c = 1; c <= cartes; c++){
        const facteurs = new Set();
        for(let appui = 0; appui < 12; appui++){
          if(await page.isDisabled("#btnNext")) break;
          await page.click("#btnNext");
          /* l'appui après la dernière étape passe à l'énoncé de la carte suivante */
          const compteur = await page.textContent("#counter");
          if(!compteur.startsWith(`Carte ${c} `)) break;
          const m = await page.evaluate(mesurer);
          if(!m) continue;
          const ou = `${nom}, carte ${c}, ${m.id}, ${fenetre.width} px`;
          etapes++;
          assert.ok(m.bas <= m.scene.bas + 0.5, `${ou} : le dessin dépasse le bas de la scène (${m.bas} > ${m.scene.bas})`);
          assert.ok(m.gauche >= m.scene.gauche - 0.5 && m.droite <= m.scene.droite + 0.5, `${ou} : le dessin dépasse sur le côté`);
          if(m.cote){ assert.ok(m.coteLibre, `${ou} : le plateau à côté recouvre le dessin ou sort de la scène`); cotes++; continue; }
          if(m.basPlateau !== null) assert.ok(m.basPlateau <= m.haut + 0.5, `${ou} : le dessin chevauche le plateau`);
          assert.equal(m.defile, false, `${ou} : la page défile en largeur`);
          if(m.bandeau) facteurs.add(m.facteurs);
        }
        assert.ok(facteurs.size <= 1, `${nom}, carte ${c} : le plateau ou le haut du dessin bougent d'une étape à l'autre (${[...facteurs]})`);
      }
    }
    assert.deepEqual(erreurs, [], "erreurs JavaScript");
    await page.close();
  }
  await navigateur.close();
  assert.ok(etapes > 250, `trop peu d'étapes contrôlées (${etapes})`);
  console.log(`projection de l'Enquête : ${etapes} étapes contrôlées, aucune coupée ; plateau à côté sur ${cotes}.`);
})().catch((e) => { console.error(e); process.exit(1); });
