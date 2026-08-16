// Debug: card cortado - pega o card individual e mede tudo
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Encontra o card da "Caminha RoundDream" (3o card)
  const card = page.locator('[aria-label*="Caminha RoundDream"]').first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Mede o card e seus elementos internos
  const data = await card.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const imgs = el.querySelectorAll('img');
    const badges = el.querySelectorAll('[class*="absolute"]');
    const out = {
      card: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      images: [],
      absolutes: [],
    };
    imgs.forEach((img) => {
      const ir = img.getBoundingClientRect();
      out.images.push({
        src: img.src.split('/').pop(),
        x: Math.round(ir.x), y: Math.round(ir.y),
        w: Math.round(ir.width), h: Math.round(ir.height),
        overflowsLeft: ir.x < r.x ? Math.round(r.x - ir.x) : 0,
        overflowsRight: ir.right > r.right ? Math.round(ir.right - r.right) : 0,
      });
    });
    badges.forEach((b) => {
      const br = b.getBoundingClientRect();
      out.absolutes.push({
        text: (b.textContent || '').trim().slice(0, 20),
        cls: b.className.slice(0, 80),
        x: Math.round(br.x), y: Math.round(br.y),
        w: Math.round(br.width), h: Math.round(br.height),
        overflowsLeft: br.x < r.x ? Math.round(r.x - br.x) : 0,
        overflowsRight: br.right > r.right ? Math.round(br.right - r.right) : 0,
        overflowsTop: br.y < r.y ? Math.round(r.y - br.y) : 0,
        overflowsBottom: br.bottom > r.bottom ? Math.round(br.bottom - r.bottom) : 0,
      });
    });
    return out;
  });
  console.log(JSON.stringify(data, null, 2));

  // Screenshot focado do card
  const box = await card.boundingBox();
  if (box) {
    await page.screenshot({
      path: 'E:/Repos/pet/peluciapet/.tmp/debug-card-cut.png',
      clip: {
        x: Math.max(0, box.x - 10),
        y: Math.max(0, box.y - 10),
        width: box.width + 20,
        height: box.height + 20,
      },
    });
  }
} finally {
  await browser.close();
}
