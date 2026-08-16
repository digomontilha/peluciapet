import { chromium } from 'playwright';

const url = process.env.URL || 'http://localhost:8080/';
const outDir = 'E:/Repos/pet/peluciapet/.tmp';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);

  const results = [];

  // Test 1: Click no card inteiro abre dialog
  const card = page.locator('[role=button][aria-label^="Ver detalhes de"]').first();
  await card.click();
  await page.waitForTimeout(400);
  const dialogOpen1 = await page.locator('[role=dialog]').isVisible().catch(() => false);
  await page.screenshot({ path: `${outDir}/click-test-1.png` });
  results.push({ test: 'click card body opens dialog', passed: dialogOpen1 });

  // Fecha o dialog
  if (dialogOpen1) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // Test 2: Click no botao "Pedir" NAO abre dialog (abre WhatsApp)
  const pedirBtn = page.locator('button:has-text("Pedir")').first();
  const newPagePromise = ctx.waitForEvent('page', { timeout: 2000 }).catch(() => null);
  await pedirBtn.click();
  const whatsappPage = await newPagePromise;
  const dialogOpen2 = await page.locator('[role=dialog]').isVisible().catch(() => false);
  results.push({
    test: 'click "Pedir" opens WhatsApp, NOT dialog',
    passed: !dialogOpen2 && !!whatsappPage,
    detail: { dialogOpen: dialogOpen2, whatsappOpened: !!whatsappPage }
  });
  if (whatsappPage) await whatsappPage.close();

  // Test 3: Click no coracao NAO abre dialog
  const heartBtn = page.locator('button[aria-label*="favoritos"]').first();
  await heartBtn.click();
  await page.waitForTimeout(300);
  const dialogOpen3 = await page.locator('[role=dialog]').isVisible().catch(() => false);
  results.push({ test: 'click heart does NOT open dialog', passed: !dialogOpen3 });

  // Test 4: Click num color swatch NAO abre dialog
  const swatch = page.locator('button[aria-label^="Selecionar cor"]').first();
  if (await swatch.count() > 0) {
    await swatch.click();
    await page.waitForTimeout(300);
    const dialogOpen4 = await page.locator('[role=dialog]').isVisible().catch(() => false);
    results.push({ test: 'click color swatch does NOT open dialog', passed: !dialogOpen4 });
  }

  // Test 5: Keyboard - Enter no card abre dialog
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await card.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const dialogOpen5 = await page.locator('[role=dialog]').isVisible().catch(() => false);
  results.push({ test: 'keyboard Enter on card opens dialog', passed: dialogOpen5 });

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  const allPassed = results.every(r => r.passed);
  console.log(allPassed ? '\nALL TESTS PASSED' : '\nSOME TESTS FAILED');
  process.exit(allPassed ? 0 : 1);
})();
