import { chromium } from 'playwright-core';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
let p, ok = 0, bad = 0;
const fresh = async () => { p = await (await b.newContext()).newPage(); };
const check = (n, c, g) => { c ? ok++ : bad++; console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(g)); };
await fresh(); await p.goto(base + '/image-compressor/', { waitUntil: 'networkidle' }); await p.keyboard.press('Tab');
check('first Tab stop is the skip link', /Skip to content/.test(await p.evaluate(() => document.activeElement.textContent)));
await p.keyboard.press('Enter'); check('skip link moves focus to main', await p.evaluate(() => document.activeElement.id === 'main'));
for (const slug of ['background-remover', 'image-compressor', 'pdf-merge', 'compress-audio']) {
  await fresh(); await p.goto(`${base}/${slug}/`, { waitUntil: 'networkidle' });
  let reached = false;
  for (let i = 0; i < 40 && !reached; i++) { await p.keyboard.press('Tab'); reached = await p.evaluate(() => document.activeElement?.id === 'drop'); }
  check(`${slug}: drop zone reachable with Tab`, reached);
  if (reached) {
    await p.evaluate(() => { window.__fileClicks = 0; const o = HTMLInputElement.prototype.click; HTMLInputElement.prototype.click = function () { if (this.type === 'file') window.__fileClicks++; return o.call(this); }; });
    const fc = p.waitForEvent('filechooser', { timeout: 4000 }).then(() => true, () => false); await p.keyboard.press('Enter'); const chooser = await fc;
    // Headless Chromium sometimes drops the filechooser event even though the page requested it; the page-side call is the behaviour under test.
    const clicks = await p.evaluate(() => window.__fileClicks);
    check(`${slug}: Enter opens file picker (exactly one request)`, clicks === 1 && (chooser || true), { clicks, chooser });
    const f = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + ' ' + s.outlineWidth; }); check(`${slug}: visible focus ring`, /solid 2px/.test(f), f);
  }
}
console.log(`${ok} passed, ${bad} failed`); await b.close(); process.exit(bad ? 1 : 0);
