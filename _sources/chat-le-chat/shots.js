const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../../outils/chat-cest-toi-le-chat-en-ligne.html');

(async () => {
  const browser = await chromium.launch();

  const sizes = [
    { name: 'ordi-1280x800', w: 1280, h: 800 },
    { name: 'ordi-1440x900', w: 1440, h: 900 },
    { name: 'ordi-1920x1080', w: 1920, h: 1080 },
  ];
  for (const s of sizes) {
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
    await page.goto(URL);
    // l'accueil tient-il sans défilement ? le dernier niveau est-il visible ?
    const metrics = await page.evaluate(() => {
      const last = document.querySelector('[data-level="4"]').getBoundingClientRect();
      return {
        scrollH: document.documentElement.scrollHeight,
        innerH: window.innerHeight,
        lastLevelBottom: Math.round(last.bottom),
      };
    });
    const fits = metrics.lastLevelBottom <= metrics.innerH;
    console.log(`${s.name} : niveau 4 visible sans défiler = ${fits} (bas du bouton ${metrics.lastLevelBottom}px / écran ${metrics.innerH}px, page ${metrics.scrollH}px)`);
    await page.screenshot({ path: `shot2-home-${s.name}.png` });
    await page.click('[data-level="1"]');
    await page.screenshot({ path: `shot2-game-${s.name}.png` });
    await page.close();
  }

  const phones = [
    { name: 'tel-390x844', w: 390, h: 844 },   // iPhone 14/15
    { name: 'tel-360x740', w: 360, h: 740 },   // petit Android
    { name: 'tel-412x915', w: 412, h: 915 },   // grand Android
  ];
  for (const s of phones) {
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, hasTouch: true, isMobile: true });
    await page.goto(URL);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`${s.name} accueil : débordement horizontal = ${overflow}px`);
    await page.screenshot({ path: `shot2-home-${s.name}.png`, fullPage: true });
    await page.tap('[data-level="1"]');
    const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`${s.name} jeu : débordement horizontal = ${overflow2}px`);
    await page.screenshot({ path: `shot2-game-${s.name}.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log('captures terminées');
})().catch(e => { console.error(e); process.exit(1); });
