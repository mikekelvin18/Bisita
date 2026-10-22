const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://127.0.0.1:8765/test.html'); await page.waitForTimeout(1500);
  for (const q of ['Grand Canyon', 'Yosemite', 'Mount Fuji', 'Santorini', 'Dolomites', 'Taj Mahal']) {
    if (await page.evaluate(() => document.body.classList.contains('in-place'))) { await page.click('#back'); await page.waitForTimeout(800); }
    await page.click('#find'); await page.fill('#q', q); await page.keyboard.press('Enter');
    await page.waitForTimeout(7000);
    await page.screenshot({ path: `${out}/P-${q.replace(/ /g, '_')}.png` });
    console.log(q, await page.textContent('#p-credit'));
  }
  console.log('ERR', errs.join('\n')); await browser.close();
})();
