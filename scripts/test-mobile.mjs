import { chromium, devices } from 'playwright';

const url = process.env.URL || 'http://localhost:8080/';
const outDir = 'E:/Repos/pet/peluciapet/.tmp';

(async () => {
  const browser = await chromium.launch();
  const out = [];

  // Test in 4 viewport sizes
  const tests = [
    { name: 'tiny (360x500 — like the user screenshot)', ctx: { viewport: { width: 360, height: 500 } } },
    { name: 'iPhone SE (375x667)', ctx: { viewport: { width: 375, height: 667 } } },
    { name: 'iPhone 12 (390x844)', ctx: { ...devices['iPhone 12'] } },
    { name: 'iPad (768x1024)', ctx: { viewport: { width: 768, height: 1024 } } },
    { name: 'Desktop (1280x720)', ctx: { viewport: { width: 1280, height: 720 } } },
  ];

  for (const t of tests) {
    const ctx = await browser.newContext(t.ctx);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);
    const slug = t.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const file = `${outDir}/v2-${slug}.png`;
    await page.screenshot({ path: file, fullPage: false });
    const m = await page.evaluate(() => {
      const hero = document.querySelector('section');
      if (!hero) return null;
      const rect = hero.getBoundingClientRect();
      const h1 = hero.querySelector('h1');
      const h1Rect = h1?.getBoundingClientRect();
      return {
        vw: window.innerWidth,
        vh: window.innerHeight,
        heroHeight: Math.round(rect.height),
        heroPctVh: Math.round((rect.height / window.innerHeight) * 100),
        h1FontSize: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : null,
      };
    });
    out.push({ test: t.name, ...m, file });
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})();
