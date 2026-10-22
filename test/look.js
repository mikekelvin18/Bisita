const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const [name, vp, mobile] of [['desk', { width: 1400, height: 860 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    const page = await browser.newPage({ viewport: vp, isMobile: mobile, hasTouch: mobile, locale: 'en-US' });
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(name + ': ' + m.text()); });
    page.on('pageerror', e => errs.push(name + ' PAGEERROR: ' + e.message));
    page.on('requestfailed', r => errs.push(name + ' REQFAIL: ' + r.url()));
    await page.goto('http://127.0.0.1:8765/test.html');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${out}/${name}-L1-look.png` });
    console.log(name, 'cards', await page.$$eval('.card:not([hidden]):not(.compact)', a => a.map(x => x.getAttribute('aria-label')).join(' | ')));
    // drag to look down
    const cx = vp.width / 2, cy = vp.height / 2;
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx, cy - 500, { steps: 10 }); await page.mouse.up();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/${name}-L2-down.png` });
    await page.click('#where-btn'); await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${name}-L3-cities.png` });
    await page.click('#city-list .res >> text=Phoenix'); await page.waitForTimeout(800);
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx, cy + 420, { steps: 10 }); await page.mouse.up();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/${name}-L4-phoenix.png` });
    const card = await page.$('.card:not([hidden])');
    if (card) { const l = await card.getAttribute('aria-label'); await card.click(); await page.waitForTimeout(6000); console.log(name, 'opened from look:', l, '->', await page.textContent('#p-name')); await page.screenshot({ path: `${out}/${name}-L5-place.png` }); }
    await page.click('#back'); await page.waitForTimeout(1200);
    console.log(name, 'back in look', await page.evaluate(() => document.body.classList.contains('look')));
    await page.click('#m-globe'); await page.waitForTimeout(2000);
    await page.screenshot({ path: `${out}/${name}-L6-globe.png` });
    await page.close();
  }
  console.log('ERRORS:\n' + errs.join('\n'));
  await browser.close();
})();
