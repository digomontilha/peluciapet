// Auditoria mobile: screenshots de cada secao + metricas
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';

const url = 'http://localhost:8080/';
const outDir = 'E:/Repos/pet/peluciapet/.tmp/audit-mobile';
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  // iPhone 12
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  // cap erros de console
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);

  // === Metricas de dobra ===
  const fold = await page.evaluate(() => {
    const vh = window.innerHeight;
    const foldY = vh;
    const elementsAtFold = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < foldY && r.bottom > 0 && r.height > 0) {
        const tag = el.tagName.toLowerCase();
        if (['h1','h2','h3','button','a','img','section','nav'].includes(tag)) {
          elementsAtFold.push({
            tag,
            text: (el.textContent || '').trim().slice(0, 60),
            top: Math.round(r.top),
            height: Math.round(r.height),
          });
        }
      }
    });
    return { vh, foldY, elementsAtFold: elementsAtFold.slice(0, 30) };
  });
  console.log('FOLD:', JSON.stringify(fold, null, 2));

  // === Screenshot de dobra ===
  await page.screenshot({ path: `${outDir}/01-fold.png`, fullPage: false });

  // === Scroll ate cada secao ===
  const sections = [
    { name: 'hero', selector: 'section' },
    { name: 'categorias', selector: 'h2:has-text("Explore por categoria")' },
    { name: 'pills', selector: 'div.flex.gap-2.flex-wrap' },
    { name: 'produtos', selector: 'div.grid' },
    { name: 'beneficios', selector: 'section:has(h2:has-text("Por que escolher"))' },
    { name: 'trust-bar', selector: 'div:has(> div:has-text("Entrega"))' },
    { name: 'footer', selector: 'footer' },
  ];

  for (const s of sections) {
    try {
      const el = page.locator(s.selector).first();
      await el.scrollIntoViewIfNeeded({ timeout: 5000 });
      await page.waitForTimeout(300);
      const box = await el.boundingBox();
      if (box) {
        await page.screenshot({
          path: `${outDir}/02-${s.name}.png`,
          clip: {
            x: 0,
            y: Math.max(0, box.y - 20),
            width: 390,
            height: Math.min(844, box.height + 40),
          },
        });
        console.log(`OK ${s.name}: y=${Math.round(box.y)} h=${Math.round(box.height)}`);
      }
    } catch (e) {
      console.log(`SKIP ${s.name}: ${e.message.split('\n')[0]}`);
    }
  }

  // === Pagina inteira ===
  await page.screenshot({ path: `${outDir}/03-fullpage.png`, fullPage: true });

  // === Metricas de tipografia ===
  const typography = await page.evaluate(() => {
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
      const r = el.getBoundingClientRect();
      const styles = getComputedStyle(el);
      const text = (el.textContent || '').trim().slice(0, 40);
      headings.push({
        tag: el.tagName.toLowerCase(),
        text,
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight,
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
        width: Math.round(r.width),
      });
    });
    return headings;
  });
  console.log('TYPOGRAPHY:', JSON.stringify(typography, null, 2));

  // === Touch targets < 44px ===
  const smallTargets = await page.evaluate(() => {
    const small = [];
    document.querySelectorAll('button, a, [role="button"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
        const text = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30);
        small.push({
          tag: el.tagName.toLowerCase(),
          text,
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
    });
    return small.slice(0, 15);
  });
  console.log('SMALL TARGETS:', JSON.stringify(smallTargets, null, 2));

  // === Largura overflow (horizontal scroll?) ===
  const overflow = await page.evaluate(() => {
    return {
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
      hasOverflowX: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  console.log('OVERFLOW:', JSON.stringify(overflow));

  console.log('=== CONSOLE ERRORS ===');
  consoleErrors.forEach((e) => console.log(e));
} finally {
  await browser.close();
}
console.log('done ->', outDir);
