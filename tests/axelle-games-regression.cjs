const {chromium} = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname,"..");
const BASE = "http://127.0.0.1:4182";
const OUTPUT = "/tmp/axelle-games-qa";
fs.mkdirSync(OUTPUT,{recursive:true});

function assert(condition,message) {
  if (!condition) throw new Error(message);
}

function startServer() {
  const mime = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".png":"image/png",".svg":"image/svg+xml"};
  const server = http.createServer((request,response) => {
    const cleanPath = decodeURIComponent(request.url.split("?")[0]);
    const relative = cleanPath.endsWith("/") ? `${cleanPath}index.html` : cleanPath;
    const file = path.join(ROOT,relative);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200,{"Content-Type":mime[path.extname(file)] || "application/octet-stream"});
    fs.createReadStream(file).pipe(response);
  });
  return new Promise(resolve => server.listen(4182,"127.0.0.1",() => resolve(server)));
}

async function auditMobile(page,label,boardSelector) {
  const layout = await page.evaluate(selector => {
    const board = document.querySelector(selector).getBoundingClientRect();
    const bottom = document.querySelector("#bottom-player").getBoundingClientRect();
    return {
      viewportWidth:innerWidth,
      viewportHeight:innerHeight,
      pageWidth:document.documentElement.scrollWidth,
      board:{top:board.top,bottom:board.bottom,width:board.width,height:board.height},
      bottom:{top:bottom.top,bottom:bottom.bottom},
      buttons:[...document.querySelectorAll(`${selector} button`)].map(button => {
        const rect = button.getBoundingClientRect();
        return {width:rect.width,height:rect.height};
      })
    };
  },boardSelector);
  assert(layout.pageWidth <= layout.viewportWidth + 1,`${label} déborde horizontalement : ${JSON.stringify(layout)}.`);
  assert(layout.board.width >= 285,`${label} a un plateau trop petit sur téléphone : ${layout.board.width}px.`);
  assert(layout.board.bottom <= layout.viewportHeight + 1,`${label} ne montre pas tout le plateau sans défilement : bas ${layout.board.bottom}px.`);
  assert(layout.bottom.top < layout.viewportHeight,`${label} ne montre pas le bandeau du joueur du bas.`);
  assert(layout.buttons.every(button => button.width >= 42 && button.height >= 42),`${label} contient une cible tactile trop petite.`);
}

function findCofferPair(state) {
  const operation = (a,b) => state.mode === "sum" ? a + b : a * b;
  for (let first = 0; first < 16; first += 1) {
    for (const second of [first + 1,first + 4]) {
      if (second >= 16) continue;
      if (second === first + 1 && Math.floor(first / 4) !== Math.floor(second / 4)) continue;
      if (operation(state.values[first],state.values[second]) === state.target) return [first,second];
    }
  }
  throw new Error("Le coffre généré ne contient aucune paire solution.");
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  const errors = [];

  const home = await browser.newPage({viewport:{width:390,height:844}});
  home.on("pageerror",error => errors.push(`Bureau : ${error.message}`));
  await home.goto(`${BASE}/axelle/`,{waitUntil:"networkidle"});
  assert(await home.locator('.quick-games[href="jeux/"]').isVisible(),"Le bouton Jeux à deux n’est pas visible dans l’en-tête du Bureau.");
  const callout = await home.locator('.games-callout[href="jeux/"]').boundingBox();
  assert(callout && callout.y < 844,"La nouvelle rubrique Jeux n’est pas visible dans le premier écran du Bureau.");
  await home.screenshot({path:path.join(OUTPUT,"bureau-mobile.png"),fullPage:true});

  await home.goto(`${BASE}/axelle/jeux/`,{waitUntil:"networkidle"});
  const gameLinks = await home.locator(".games > a").evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname));
  assert(JSON.stringify(gameLinks) === JSON.stringify(["/axelle/jeux/traversee/","/axelle/jeux/pavage/","/axelle/jeux/coffres/"]),`La rubrique ne contient pas exactement les trois jeux attendus : ${gameLinks}.`);
  await home.screenshot({path:path.join(OUTPUT,"jeux-mobile.png"),fullPage:true});
  await home.close();

  const crossing = await browser.newPage({viewport:{width:390,height:844}});
  crossing.on("pageerror",error => errors.push(`Traversée : ${error.message}`));
  await crossing.goto(`${BASE}/axelle/jeux/traversee/`,{waitUntil:"networkidle"});
  await auditMobile(crossing,"La Traversée","#board");
  await crossing.screenshot({path:path.join(OUTPUT,"traversee-mobile.png"),fullPage:true});
  const crossingMoves = [[0,0],[4,0],[0,1],[4,2],[0,2],[4,4],[0,3],[3,0],[0,4]];
  for (const [row,column] of crossingMoves) await crossing.locator(`.hex[data-row="${row}"][data-col="${column}"]`).click();
  await crossing.locator("#result:not([hidden])").waitFor();
  assert((await crossing.locator("#result-title").textContent()).includes("bleu"),"La Traversée ne détecte pas le chemin gagnant bleu.");
  assert(await crossing.locator(".hex.path").count() === 5,"La Traversée ne met pas en évidence le chemin gagnant.");
  await crossing.screenshot({path:path.join(OUTPUT,"traversee-victoire-mobile.png"),fullPage:true});
  await crossing.close();

  const paving = await browser.newPage({viewport:{width:390,height:844}});
  paving.on("pageerror",error => errors.push(`Pavage : ${error.message}`));
  await paving.goto(`${BASE}/axelle/jeux/pavage/`,{waitUntil:"networkidle"});
  await auditMobile(paving,"Pavage duel","#board");
  await paving.locator('.paving-cell[data-row="0"][data-col="0"]').click();
  assert(await paving.locator(".paving-cell.blue").count() === 2,"Le domino bleu n’occupe pas deux cases.");
  assert(await paving.locator("#piece-tools").getAttribute("class").then(value => value.includes("facing-top")),"Les commandes ne se retournent pas vers le joueur du haut.");
  await paving.locator('.piece-choice[data-shape="elbow"]').click();
  await paving.locator("#rotate-piece").click();
  await paving.locator('.paving-cell[data-row="1"][data-col="0"]').click();
  assert(await paving.locator(".paving-cell.coral").count() === 3,"Le triomino corail tourné n’occupe pas trois cases.");
  assert((await paving.locator("#blue-score").textContent()).includes("1 / 6") && (await paving.locator("#coral-score").textContent()).includes("1 / 6"),"Le score des pièces posées n’est pas actualisé.");
  await paving.waitForTimeout(300);
  await paving.screenshot({path:path.join(OUTPUT,"pavage-mobile.png"),fullPage:true});
  await paving.close();

  const coffers = await browser.newPage({viewport:{width:390,height:844}});
  coffers.on("pageerror",error => errors.push(`Coffres : ${error.message}`));
  await coffers.goto(`${BASE}/axelle/jeux/coffres/`,{waitUntil:"networkidle"});
  await auditMobile(coffers,"Coffres magiques","#board");
  const state = await coffers.evaluate(() => window.AXELLE_COFFRES.getState());
  const [first,second] = findCofferPair(state);
  await coffers.locator(`.rune[data-index="${first}"]`).click();
  await coffers.locator(`.rune[data-index="${second}"]`).click();
  assert((await coffers.locator("#blue-score").textContent()).includes("1 / 5"),"Une paire correcte ne donne pas de clé au joueur bleu.");
  await coffers.waitForTimeout(950);
  assert((await coffers.locator("#game-core").getAttribute("class")).includes("facing-top"),"Les nombres ne se retournent pas vers le joueur corail.");
  await coffers.screenshot({path:path.join(OUTPUT,"coffres-tour-corail-mobile.png"),fullPage:true});
  await coffers.close();

  const desktop = await browser.newPage({viewport:{width:1366,height:768}});
  desktop.on("pageerror",error => errors.push(`Bureau : ${error.message}`));
  for (const game of ["traversee","pavage","coffres"]) {
    await desktop.goto(`${BASE}/axelle/jeux/${game}/`,{waitUntil:"networkidle"});
    const width = await desktop.evaluate(() => document.documentElement.scrollWidth);
    assert(width <= 1367,`${game} déborde sur ordinateur.`);
  }
  await desktop.close();

  await browser.close();
  await new Promise(resolve => server.close(resolve));
  assert(errors.length === 0,`Erreurs JavaScript :\n${errors.join("\n")}`);
  console.log(JSON.stringify({ok:true,games:["traversee","pavage","coffres"],viewports:["390x844","1366x768"],screenshots:fs.readdirSync(OUTPUT).sort()},null,2));
})().catch(error => { console.error(error); process.exit(1); });
