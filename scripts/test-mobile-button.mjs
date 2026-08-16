import { chromium, devices } from 'playwright';
const out = 'E:/Repos/pet/peluciapet/.tmp';

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 12'] });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const card = p.locator('div[role=button]').first();
  await card.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  const box = await card.boundingBox();
  await p.screenshot({
    path: `${out}/mobile-fix-card.png`,
    clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 }
  });
  // Also full page
  await p.screenshot({ path: `${out}/mobile-fix-full.png`, fullPage: true });
  await b.close();
  console.log('done');
})();
