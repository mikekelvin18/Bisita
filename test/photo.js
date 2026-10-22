const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [out, ids] = [process.argv[2], (process.argv[3] || 'Grand Canyon,Zion,Fuji,Dolomites').split(',')];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 820 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/test.html'); await page.waitForTimeout(1500);
  for (const id of ids) {
    await page.click('#find'); await page.fill('#q', id); await page.keyboard.press('Enter');
    await page.waitForTimeout(9000);
    await page.screenshot({ path: `${out}/PH-${id.replace(/ /g,'_')}.png` });
    await page.click('#back'); await page.waitForTimeout(1200);
  }
  console.log('ERR', errs.join('\n')); await browser.close();
})();
