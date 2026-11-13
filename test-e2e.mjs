// Headless end-to-end check: node test-e2e.mjs <baseUrl>   (needs playwright-core + Edge/Chrome)
import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const exe = process.env.BROWSER_EXE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const b = await chromium.launch({ executablePath: exe, headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(p.url() + ' :: ' + e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(p.url() + ' :: ' + m.text()));
const log = (...a) => console.log(...a);
const go = (s) => p.goto(`${base}/${s}`);
const val = (id) => p.inputValue('#' + id);
const wav = () => { const sr = 8000, n = sr * 2, buf = Buffer.alloc(44 + n * 2); buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40); for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin(i / 10) * 12000), 44 + i * 2); return buf; };

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const paths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
let bad = 0; for (const u of paths) { const r = await p.goto(base + u); const n = await p.locator('.side .lk').count(); if (!r.ok() || n < 80) { bad++; log('BAD page', u, r.status(), n); } }
log(`pages checked: ${paths.length}, bad: ${bad}`);

await go(''); const t0 = await p.getAttribute('html', 'data-theme'); await p.click('.tt'); const t1 = await p.getAttribute('html', 'data-theme');
await p.reload(); const t2 = await p.getAttribute('html', 'data-theme'); log('theme', t0, '->', t1, '(persisted:', t2 === t1, ')');
await p.fill('.sq', 'pdf'); log('sidebar search "pdf" visible links ->', await p.locator('.side .lk:visible').count());
await p.fill('.sq', ''); await p.fill('#q', 'mp3'); log('landing search mp3 cards ->', await p.locator('.cat .card:visible').count());
await p.setViewportSize({ width: 390, height: 800 }); await p.click('.burger'); log('mobile sidebar open ->', await p.evaluate(() => document.body.classList.contains('open'))); await p.setViewportSize({ width: 1280, height: 900 });

async function ff(slug, name, mime, buf, pre) {
  await go(`${slug}/`); await p.setInputFiles('#file', { name, mimeType: mime, buffer: buf }); if (pre) await pre();
  await p.click('#go'); await p.waitForSelector('#done:not([hidden]), #status.err', { timeout: 150000 });
  log(slug, '->', (await p.innerText('#done').catch(() => '')).replace(/\n/g, ' | ').slice(0, 90) || await p.innerText('#status'));
}
const W = wav();
await ff('wav-to-mp3', 'tone.wav', 'audio/wav', W);
await ff('mp3-cutter', 'tone.wav', 'audio/wav', W, () => p.fill('#len', '1'));
await go('');
const webm = Buffer.from(await p.evaluate(async () => { const c = document.createElement('canvas'); c.width = 320; c.height = 240; const x = c.getContext('2d'); const rec = new MediaRecorder(c.captureStream(15), { mimeType: 'video/webm' }); const ch = []; rec.ondataavailable = (e) => ch.push(e.data); rec.start(); for (let i = 0; i < 20; i++) { x.fillStyle = `hsl(${i * 18},80%,50%)`; x.fillRect(0, 0, 320, 240); await new Promise((r) => setTimeout(r, 70)); } await new Promise((r) => { rec.onstop = r; rec.stop(); }); return Array.from(new Uint8Array(await new Blob(ch).arrayBuffer())); }));
await ff('video-to-gif', 't.webm', 'video/webm', webm);
await ff('mute-video', 't.webm', 'video/webm', webm);

const t = async (slug, fn) => { await go(`${slug}/`); try { log(slug, '->', await fn()); } catch (e) { log(slug, 'FAILED', e.message.split('\n')[0]); } };
await t('word-counter', async () => { await p.fill('#in', 'one two three. four'); return (await p.innerText('#stats')).replace(/\n/g, ' '); });
await t('case-converter', async () => { await p.fill('#in', 'hello big world'); await p.click('text=snake_case'); return val('out'); });
await t('find-and-replace', async () => { await p.fill('#in', 'a cat and a Cat'); await p.fill('#find', 'cat'); await p.fill('#rep', 'dog'); await p.click('#go'); return val('out') + ' | ' + await p.innerText('#info'); });
await t('text-sorter', async () => { await p.fill('#in', 'b\nc\na'); await p.click('#go'); return (await val('out')).replace(/\n/g, ','); });
await t('slug-generator', async () => { await p.fill('#in', 'Héllo, Wörld & Co!'); return val('out'); });
await t('morse-code-translator', async () => { await p.fill('#in', 'SOS'); await p.click('#enc'); return val('out'); });
await t('binary-text-converter', async () => { await p.fill('#in', 'Hi'); await p.click('#enc'); return val('out'); });
await t('url-encoder-decoder', async () => { await p.fill('#in', 'a b&c=d/é'); await p.click('#ev'); return val('out'); });
await t('hash-generator', async () => { await p.fill('#in', 'abc'); await p.waitForTimeout(300); return await p.innerText('#h-SHA-256'); });
await t('jwt-decoder', async () => { await p.fill('#in', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3MDAwMDAwMDB9.x'); return (await p.innerText('#pay')).replace(/\s+/g, ' ') + ' | ' + await p.innerText('#info'); });
await t('regex-tester', async () => { await p.fill('#pat', '\\d+'); await p.fill('#in', 'a1 b22 c333'); await p.waitForTimeout(100); return await p.innerText('#info'); });
await t('csv-to-json', async () => { await p.fill('#in', 'name,age\nAda,36\n"Smith, J",5'); await p.click('#go'); return (await val('out')).replace(/\s+/g, ' '); });
await t('json-to-csv', async () => { await p.fill('#in', '[{"a":1,"b":"x,y"},{"a":2,"c":true}]'); await p.click('#go'); return (await val('out')).replace(/\n/g, ' / '); });
await t('timestamp-converter', async () => { await p.fill('#ts', '1700000000'); return (await p.innerText('#out')).replace(/\n/g, ' ').slice(0, 120); });
await t('markdown-previewer', async () => (await p.innerHTML('#out')).slice(0, 80));
await t('password-generator', async () => { const v = await val('out'); return `${v.length} chars; ${await p.innerText('#info')}`; });
await t('uuid-generator', async () => (await val('out')).split('\n').length + ' uuids');
await t('random-number-generator', async () => { await p.fill('#n', '5'); await p.check('#uniq'); await p.click('#go'); return val('out'); });
await t('unit-converter', async () => { await p.fill('#val', '100'); await p.selectOption('#cat', 'Temperature'); await p.selectOption('#from', '°C'); await p.selectOption('#to', '°F'); return await p.innerText('#out'); });
await t('percentage-calculator', async () => `${await p.innerText('#r1')} | ${await p.innerText('#r2')} | ${await p.innerText('#r3')}`);
await t('age-calculator', async () => { await p.fill('#dob', '2000-01-15'); return (await p.innerText('#out')).replace(/\n/g, ' '); });
await t('bmi-calculator', async () => (await p.innerText('#out')).replace(/\n/g, ' '));
await t('loan-calculator', async () => (await p.innerText('#out')).replace(/\n/g, ' '));
await t('tip-calculator', async () => (await p.innerText('#out')).replace(/\n/g, ' '));
await t('roman-numeral-converter', async () => { const a = await val('rom'); await p.fill('#rom', 'MCMXCIV'); return a + ' / ' + await val('num'); });
await t('pomodoro-timer', async () => { await p.click('#start'); await p.waitForTimeout(1300); return await p.innerText('#time'); });
await t('color-converter', async () => { await p.fill('#hex', '#ff0000'); return `${await val('rgb')} ${await val('hsl')}`; });
await t('css-gradient-generator', async () => val('out'));
await t('qr-code-generator', async () => (await p.locator('#qr svg').count()) + ' svg');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');
await t('image-compressor', async () => { await p.setInputFiles('#file', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]); await p.waitForSelector('.res a.dl', { timeout: 8000 }); return (await p.innerText('.res .m')).replace(/\n/g, ' '); });
await t('image-to-base64', async () => { await p.setInputFiles('#file', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]); await p.waitForFunction(() => document.getElementById('out').value.length > 20); return (await val('out')).slice(0, 30); });
let pdfBuf;
await t('image-to-pdf', async () => { await p.setInputFiles('#file', [{ name: 'a.png', mimeType: 'image/png', buffer: png }, { name: 'b.png', mimeType: 'image/png', buffer: png }]); const [d] = await Promise.all([p.waitForEvent('download'), p.click('#go')]); pdfBuf = await readFile(await d.path()); return `${pdfBuf.length} bytes, ${await p.innerText('#info')}`; });
await t('pdf-merge', async () => { await p.setInputFiles('#file', [{ name: 'a.pdf', mimeType: 'application/pdf', buffer: pdfBuf }, { name: 'b.pdf', mimeType: 'application/pdf', buffer: pdfBuf }]); await p.click('#go'); await p.waitForFunction(() => /Merged|Could not|✓/.test(document.getElementById('info').textContent)); return await p.innerText('#info'); });
await t('pdf-split', async () => { await p.setInputFiles('#file', [{ name: 'a.pdf', mimeType: 'application/pdf', buffer: pdfBuf }]); await p.fill('#pages', '2'); await p.click('#go'); await p.waitForFunction(() => document.getElementById('info').textContent.length > 3); return await p.innerText('#info'); });
await t('korean-text-to-speech', async () => (await p.innerText('#info')) + ' | ' + await val('in'));
await t('world-languages-text-to-speech', async () => { await p.selectOption('#lang', 'ru-RU'); return await val('in'); });
log('JS errors:', errs.length ? errs.slice(0, 10) : 'none');
await b.close();
