const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) });
  await page.goto('http://localhost:5184');
  await page.waitForTimeout(1000);
  console.log('Erros:', JSON.stringify(errors));
  const setas = await page.locator('button').filter({ hasText: '›' }).all();
  console.log('Setas encontradas:', setas.length);
  if (setas.length > 0) {
    await setas[0].click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/header_nav.png', clip: { x: 800, y: 0, width: 480, height: 60 } });
  }
  await browser.close();
})();
