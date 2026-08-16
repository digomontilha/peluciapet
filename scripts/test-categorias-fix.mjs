// Screenshot da secao Categorias no mobile pra validar fix do gap
import { chromium } from 'playwright';

const url = 'http://localhost:8080/';
const out = process.argv[2] || 'E:/Repos/pet/peluciapet/.tmp/categorias-fix-v2-mobile.png';

const browser = await chromium.launch();
try {
  // iPhone 12 (390x844) - mesmo viewport que o user mostrou no print
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);

  // Encontra a section "Explore por categoria" e da scroll ate ela
  const h2 = page.locator('h2', { hasText: 'Explore por categoria' });
  await h2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Pega o bbox do bloco pai (container que tem o titulo + botao)
  const block = page.locator('div.flex.items-start.justify-between.gap-3.mb-4').first();
  const box = await block.boundingBox();
  console.log('block bbox:', box);

  // Screenshot do bloco todo
  if (box) {
    // captura um pouco acima pra pegar contexto
    await page.screenshot({
      path: out,
      clip: {
        x: 0,
        y: Math.max(0, box.y - 20),
        width: 390,
        height: Math.min(844, box.height + 40),
      },
    });
  } else {
    await page.screenshot({ path: out, fullPage: false });
  }

  console.log('saved', out);
} finally {
  await browser.close();
}
