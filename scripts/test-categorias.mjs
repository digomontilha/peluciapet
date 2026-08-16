import { chromium, devices } from 'playwright';
const out = 'E:/Repos/pet/peluciapet/.tmp';

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 12'] });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  // Scroll to categorias section
  const heading = p.locator('h2', { hasText: 'Explore por categoria' });
  await heading.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  const box = await p.locator('div.mb-8').first().boundingBox();
  await p.screenshot({
    path: `${out}/categorias-fix-mobile.png`,
    clip: { x: 0, y: Math.max(0, box.y - 20), width: 390, height: box.height + 80 }
  });
  await b.close();
  console.log('done');
})();
