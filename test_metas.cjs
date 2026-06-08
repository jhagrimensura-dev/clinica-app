const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:5177');

  await page.click('text=Metas');
  await page.waitForTimeout(600);

  // Selecionar dias 4 e 6
  const semanas = await page.locator('.grid.grid-cols-7.gap-1').all();
  const semana2 = semanas[1];
  const dias = await semana2.locator('> div').all();
  await dias[1].click(); // dia 4 (SEG)
  await page.waitForTimeout(300);
  await dias[3].click(); // dia 6 (QUA)
  await page.waitForTimeout(300);

  await page.screenshot({ path: '/tmp/t_selecionados.png' });

  // Verificar HTML atual
  const html = await semana2.innerHTML();
  const dia4 = html.match(/<div[^>]*bg-yellow[^>]*>[\s\S]*?<\/div>/);
  console.log('Dia 4 HTML:', dia4 ? dia4[0].substring(0, 400) : 'não encontrado');

  // Clicar no p.cursor-text do dia 4 para editar
  const editBtn = page.locator('p.cursor-text').first();
  const count = await editBtn.count();
  console.log('p.cursor-text encontrados:', count);

  if (count > 0) {
    await editBtn.click();
    await page.waitForTimeout(200);
    await page.keyboard.type('50000');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/t_vermelho.png' });

    const editBtn2 = page.locator('p.cursor-text').first();
    await editBtn2.click();
    await page.waitForTimeout(200);
    await page.keyboard.type('150000');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/t_verde.png' });
  }

  await browser.close();
  console.log('Concluído');
})();
