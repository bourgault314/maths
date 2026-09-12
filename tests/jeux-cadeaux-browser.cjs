const {chromium}=require("playwright");
const fs=require("fs");
const http=require("http");
const path=require("path");
const ROOT=path.resolve(__dirname,"..");
const BASE="http://127.0.0.1:4193";
const OUTPUT="/tmp/jeux-cadeaux-qa";
fs.mkdirSync(OUTPUT,{recursive:true});
function assert(ok,message){if(!ok)throw new Error(message)}
function server(){return new Promise(resolve=>{const s=http.createServer((req,res)=>{const clean=decodeURIComponent(req.url.split("?")[0]);const rel=clean.endsWith("/")?clean+"index.html":clean;const file=path.join(ROOT,rel);if(!file.startsWith(ROOT)||!fs.existsSync(file)){res.writeHead(404).end();return}const ext=path.extname(file);res.writeHead(200,{"Content-Type":ext===".html"?"text/html; charset=utf-8":ext===".js"?"text/javascript; charset=utf-8":ext===".css"?"text/css; charset=utf-8":"application/octet-stream"});fs.createReadStream(file).pipe(res)});s.listen(4193,"127.0.0.1",()=>resolve(s))})}
(async()=>{
  const s=await server();const browser=await chromium.launch({headless:true});const errors=[];
  for(const viewport of [{name:"telephone",width:390,height:844},{name:"tablette",width:820,height:1180},{name:"ordinateur",width:1366,height:768}]){
    const page=await browser.newPage({viewport});page.on("pageerror",e=>errors.push(`${viewport.name}: ${e.message}`));
    await page.goto(`${BASE}/jeux-cadeaux/`,{waitUntil:"networkidle"});
    assert(await page.locator(".game-card").count()===4,`${viewport.name}: quatre cartes attendues`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${viewport.name}: débordement horizontal`);
    await page.screenshot({path:path.join(OUTPUT,`accueil-${viewport.name}.png`),fullPage:true});
    for(const game of ["luciole","dodo","galets","tempo"]){
      await page.locator(`[data-game="${game}"]`).click();
      assert(await page.locator("#stage").isVisible(),`${viewport.name}/${game}: plateau absent`);
      const box=await page.locator("#stage").boundingBox();assert(box.width>=350||viewport.width<400,`${viewport.name}/${game}: plateau trop étroit`);
      await page.screenshot({path:path.join(OUTPUT,`${game}-${viewport.name}.png`),fullPage:true});
      await page.locator("#back").click();
    }
    await page.close();
  }
  const gift=await browser.newPage({viewport:{width:390,height:844}});
  await gift.goto(`${BASE}/jeux-cadeaux/?mode=cadeau&parties=2&jeu=luciole&retour=/`,{waitUntil:"networkidle"});
  assert((await gift.locator("#mode-pill").textContent()).includes("2 parties"),"mode cadeau deux parties absent");
  assert((await gift.locator("#round-label").textContent()).includes("1 / 2"),"compteur de parties absent");
  await gift.close();await browser.close();await new Promise(resolve=>s.close(resolve));
  assert(errors.length===0,errors.join("\n"));console.log(JSON.stringify({ok:true,screenshots:fs.readdirSync(OUTPUT).sort()},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
