const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const [name, vp, mobile] of [['desk', { width: 1400, height: 860 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    const page = await browser.newPage({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(name + ': ' + m.text()); });
    page.on('pageerror', e => errs.push(name + ' PAGEERROR: ' + e.message));
    page.on('requestfailed', r => errs.push(name + ' REQFAIL: ' + r.url()));
    await page.goto('http://127.0.0.1:8765/test.html');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${out}/${name}-1-globe.png` });
    const visiblePins = await page.$$eval('.pin:not([hidden])', a => a.length);
    const labeled = await page.$$eval('.pin.labeled:not([hidden])', a => a.map(x => x.textContent));
    console.log(name, 'visible pins', visiblePins, 'labels', labeled.join(', '));
    await page.click('#find');
    await page.fill('#q', 'yosem');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${name}-2-find.png` });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/${name}-3-flying.png` });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${out}/${name}-4-arrive.png` });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${out}/${name}-5-orbit.png` });
    console.log(name, 'in place?', await page.evaluate(() => document.body.classList.contains('in-place')), 'title', await page.textContent('#p-name'));
    if (name === 'phone') { await page.click('#grip'); await page.click('summary >> nth=0'); await page.waitForTimeout(600); await page.screenshot({ path: `${out}/${name}-6-tall.png` }); }
    // related place hop then back to world
    await page.click('#p-related button >> nth=0');
    await page.waitForTimeout(5000);
    console.log(name, 'hopped to', await page.textContent('#p-name'));
    await page.screenshot({ path: `${out}/${name}-7-hop.png` });
    await page.click('#back');
    await page.waitForTimeout(1500);
    console.log(name, 'back on globe', await page.evaluate(() => !document.body.classList.contains('in-place')));
    await page.screenshot({ path: `${out}/${name}-8-back.png` });
    await page.close();
  }
  console.log('ERRORS:\n' + errs.join('\n'));
  await browser.close();
})();
