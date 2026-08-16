import { chromium } from 'playwright';
const out = 'E:/Repos/pet/peluciapet/.tmp';

(async () => {
  const b = await chromium.launch();
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 720 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const ctx = await b.newContext({ viewport });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}/conv-${name}-full.png`, fullPage: true });
    await p.screenshot({ path: `${out}/conv-${name}-fold.png`, fullPage: false });
    await ctx.close();
  }
  await b.close();
  console.log('done');
})();
