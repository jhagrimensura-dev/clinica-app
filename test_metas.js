const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('http://localhost:5176');

  // Navegar para Metas
  await page.click('text=Metas');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/test_1_inicial.png' });

  // Clicar em alguns dias (semana 2: dias SEG, TER, QUA, QUI)
  const celulas = await page.locator('.grid.grid-cols-7.gap-1 > div').all();
  
  // Semana 2 = dias 5-11 (índices 7-13 no total de células)
  // Vamos clicar nos dias 4, 5, 6, 7 da segunda semana
  // Cada semana tem 7 células, semana index 1 = células 7-13
  const semanas = await page.locator('.grid.grid-cols-7.gap-1').all();
  console.log('Semanas encontradas:', semanas.length);

  if (semanas.length >= 2) {
    const semana2 = semanas[1];
    const dias2 = await semana2.locator('> div').all();
    console.log('Dias na semana 2:', dias2.length);
    
    // Clicar no dia 5 (índice 1 = SEG)
    await dias2[1].click();
    await page.waitForTimeout(300);
    // Clicar no dia 7 (índice 3 = QUA)  
    await dias2[3].click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: '/tmp/test_2_selecionados.png' });

  // Agora digitar valor no primeiro dia selecionado - abaixo da meta
  // Meta diária com 2 dias = 200000/2 = 100000
  const dash = await page.locator('text=—').first();
  if (await dash.count() > 0) {
    await dash.click();
    await page.waitForTimeout(200);
    await page.keyboard.type('50000');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: '/tmp/test_3_abaixo_meta.png' });

  // Digitar valor acima da meta no segundo dia
  const dashes = await page.locator('text=—').all();
  if (dashes.length > 0) {
    await dashes[0].click();
    await page.waitForTimeout(200);
    await page.keyboard.type('150000');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: '/tmp/test_4_acima_meta.png' });

  await browser.close();
  console.log('Testes concluídos!');
})();
