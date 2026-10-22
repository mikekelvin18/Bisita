const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const [name, vp, mobile] of [['desk', { width: 1300, height: 820 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    const page = await browser.newPage({ viewport: vp, isMobile: mobile, hasTouch: mobile, locale: 'en-US' });
    page.on('pageerror', e => errs.push(name + ' PAGEERROR: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    page.on('requestfailed', r => errs.push(name + ' REQFAIL ' + r.url()));
    await page.goto('http://127.0.0.1:8765/test.html');
    await page.waitForTimeout(500);
    // stand in Phoenix, face Zion
    await page.click('#where-btn'); await page.click('#city-list .res >> text=Phoenix'); await page.waitForTimeout(3500);
    await page.screenshot({ path: `${out}/${name}-S1.png` });
    console.log(name, 'focus:', await page.textContent('#f-name'), '|', await page.textContent('#f-meta'));
    const cx = vp.width / 2, cy = vp.height / 2;
    await page.mouse.click(cx, cy); await page.waitForTimeout(500); await page.screenshot({ path: `${out}/${name}-S2a-zoom.png` }); await page.waitForTimeout(4500); console.log(name, "opened", await page.evaluate(() => document.body.classList.contains("in-place"))); await page.click("#back"); await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${name}-S2-revealed.png` });
    console.log(name, 'after tap focus:', await page.textContent('#f-name'));
    // look further down toward Asia
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 200, cy - 350, { steps: 10 }); await page.mouse.up(); await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${name}-S3-down.png` });
    await page.close();
  }
  console.log('ERR', errs.join('\n')); await browser.close();
})();
