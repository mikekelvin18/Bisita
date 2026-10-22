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
    await page.click('#where-btn'); await page.click('#city-list .res >> text=Phoenix'); await page.waitForTimeout(6000);
    await page.screenshot({ path: `${out}/${name}-G1-ghost.png` });
    console.log(name, 'focus:', await page.textContent('#f-name'));
    // motion button in a browser without permission
    await page.click('#motion-btn'); await page.waitForTimeout(2500);
    console.log(name, 'toast:', await page.evaluate(() => !document.getElementById('toast').hidden && document.getElementById('toast').textContent));
    await page.screenshot({ path: `${out}/${name}-G2-toast.png` });
    const cx = vp.width / 2, cy = vp.height / 2;
    await page.mouse.click(cx, cy); await page.waitForTimeout(9000);
    console.log(name, 'gallery:', await page.evaluate(() => [document.body.classList.contains('gallery'), document.querySelectorAll('#g-thumbs button').length, document.getElementById('g-cap').textContent]));
    await page.screenshot({ path: `${out}/${name}-G3-gallery.png` });
    await page.click('#g-thumbs button:nth-child(3)'); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${name}-G4-thumb.png` });
    await page.click('#g-3d'); await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/${name}-G5-3d.png` });
    await page.click('#g-3d'); await page.waitForTimeout(500);
    await page.click('#back'); await page.waitForTimeout(1500);
    // turn toward a built landmark: look east-ish and down
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 300, cy - 300, { steps: 10 }); await page.mouse.up(); await page.waitForTimeout(4000);
    await page.screenshot({ path: `${out}/${name}-G6-down.png` });
    await page.close();
  }
  console.log('ERR', errs.join('\n')); await browser.close();
})();
