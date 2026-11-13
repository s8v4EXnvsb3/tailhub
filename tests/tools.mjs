// Tests every non-ffmpeg tool with asserted results, plus site structure, theme, sidebar, icons, TTS guide.
// usage: node tests/tools.mjs [baseUrl]
import * as pw from 'playwright-core';
const ENGINE = process.env.ENGINE || 'chromium';
const chromium = pw[ENGINE];
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const exe = process.env.BROWSER_EXE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const { PDFDocument } = createRequire(import.meta.url)('pdf-lib');
const b = await chromium.launch({ ...(ENGINE === 'chromium' ? { executablePath: exe } : {}), headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, ...(ENGINE === 'chromium' ? { permissions: ['clipboard-read', 'clipboard-write'] } : {}) });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(p.url() + ' :: ' + e.message)); p.on('console', (m) => m.type() === 'error' && !/favicon|voices/.test(m.text()) && errs.push(p.url() + ' :: ' + m.text()));
let pass = 0, fail = 0;
const check = (name, ok, got) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : '  -> got: ' + JSON.stringify(got)}`); };
const go = (s) => p.goto(`${base}/${s}`);
const val = (id) => p.inputValue('#' + id);
const txt = (id) => p.textContent('#' + id);
const t = async (slug, fn) => { await go(`${slug}/`); try { await fn(); } catch (e) { check(slug, false, e.message.split('\n')[0]); } };
const eq = (slug, got, want) => check(slug, got === want, got);
const has = (slug, got, re) => check(slug, re.test(got), got);
const download = async (click) => { const [d] = await Promise.all([p.waitForEvent('download'), click()]); return { name: d.suggestedFilename(), buf: await readFile(await d.path()) }; };

// ---------- structure
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const paths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
const { tools } = await import(pathToFileURL(path.resolve('src/tools.mjs')).href);
let bad = [];
for (const u of paths) {
  const r = await p.goto(base + u); const n = await p.locator('.side .lk').count(); const svg = await p.locator('.side summary svg').count();
  const emoji = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u2B50\u2194-\u21AA\u23E9-\u23FA]/u.test(await p.evaluate(() => document.body.innerText));
  if (!r.ok() || n !== tools.length || svg < 9 || emoji || !(await p.locator('h1').count())) bad.push(`${u} status=${r.status()} links=${n} emoji=${emoji}`);
}
check(`all ${paths.length} pages load, sidebar lists ${tools.length} tools, icons present, no emoji`, !bad.length, bad.slice(0, 5));
await go('');
check('every tool card has an svg icon', (await p.locator('.cat .card').count()) === tools.length && (await p.locator('.cat .card .ic svg').count()) === tools.length);

// ---------- theme + nav
await p.evaluate(() => localStorage.setItem('th-theme', 'dark')); await p.reload();
const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); const [r, g, bl] = bg.match(/\d+/g).map(Number);
check('dark background is neutral (no blue/purple tint)', Math.max(r, g, bl) - Math.min(r, g, bl) <= 4 && r < 30, bg);
await p.click('.tt'); check('toggle -> light', (await p.getAttribute('html', 'data-theme')) === 'light');
await p.reload(); check('light persists after reload', (await p.getAttribute('html', 'data-theme')) === 'light');
await p.click('.tt'); check('toggle -> dark', (await p.getAttribute('html', 'data-theme')) === 'dark');
await p.fill('.sq', 'pdf'); check('sidebar search "pdf"', (await p.locator('.side .lk:visible').count()) >= 3);
await p.fill('.sq', ''); await p.fill('#q', 'mp3'); check('landing search "mp3"', (await p.locator('.cat .card:visible').count()) >= 10);
await p.fill('#q', 'zzzz'); check('landing search no-result message', await p.locator('#none').isVisible());
await p.setViewportSize({ width: 390, height: 800 }); await p.click('.burger'); check('mobile drawer opens', await p.evaluate(() => document.body.classList.contains('open')));
await p.setViewportSize({ width: 1280, height: 900 });

// ---------- TTS pages
// Playwright's WebKit build has no speech engine, so speech tests only run on Chromium and Firefox.
const NOSPEECH = ENGINE === 'webkit';
const tts = NOSPEECH ? [] : tools.filter((x) => x.kind === 'tts');
for (const x of tts) {
  await go(`${x.slug}/`);
  const gt = await p.locator('#guide').textContent(), guide = await p.locator('#guide').count();
  const voices = await p.locator('#voice option').count(); const info = await txt('info'); const open = await p.evaluate(() => document.getElementById('guide').open);
  const noVoice = /No .* voice is installed/.test(info);
  let ok = guide === 1 && gt.includes('ms-settings:speech') && gt.includes('Edge') && gt.includes('macOS') && gt.includes('Android') && gt.includes('iPhone') && (noVoice ? open && info.includes('guide') : voices >= 1);
  if (!x.multi && !gt.includes(new Intl.DisplayNames(['en'], { type: 'language' }).of(x.lang.split(/[-_]/)[0]))) ok = false;
  if (!(await val('in')).length) ok = false;
  check(`tts ${x.slug}: guide present, ${noVoice ? 'no voice -> guide auto-opened' : voices + ' voice(s)'}`, ok, { info, open });
}
if (!NOSPEECH) {
await go('world-languages-text-to-speech/'); const before = await val('in'); await p.selectOption('#lang', 'ru-RU'); const after = await val('in');
check('tts world: changing language swaps sample text and guide name', before !== after && /[А-Яа-я]/.test(after) && (await txt('guide')).includes('Russian'), { after });
await go('korean-text-to-speech/'); await p.click('#cpset'); check('tts guide: copy ms-settings:speech', (await p.evaluate(() => navigator.clipboard.readText())) === 'ms-settings:speech');
await p.evaluate(() => { window.__spoken = []; const o = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = (u) => { window.__spoken.push(u.text); o(u); }; });
await p.click('#play'); check('tts Speak calls speechSynthesis with the text', (await p.evaluate(() => window.__spoken)).join(' ').includes('안녕하세요'));
}

// ---------- text tools
await t('word-counter', async () => { await p.fill('#in', 'one two three. four'); has('word-counter', await txt('stats'), /4[\s\S]*Words|Words[\s\S]*4/i); });
await t('case-converter', async () => { await p.fill('#in', 'hello big world'); for (const [l, w] of [['snake_case', 'hello_big_world'], ['UPPER CASE', 'HELLO BIG WORLD'], ['camelCase', 'helloBigWorld'], ['kebab-case', 'hello-big-world']]) { const btn = p.locator('#cases button', { hasText: l }); if (await btn.count()) { await btn.first().click(); eq('case-converter ' + l, await val('out'), w); } else check('case-converter button ' + l, false, 'missing'); } });
await t('remove-duplicate-lines', async () => { await p.fill('#in', 'a\nb\na\n\nB\nc'); await p.click('#go'); eq('remove-duplicate-lines', (await val('out')).trim(), 'a\nb\nB\nc'); await p.check('#ci'); await p.click('#go'); eq('remove-duplicate-lines (ignore case)', (await val('out')).trim(), 'a\nb\nc'); });
await t('text-diff', async () => { await p.fill('#a', 'the quick brown fox'); await p.fill('#b', 'the slow brown fox'); await p.click('#go'); const h = await p.innerHTML('#out'); check('text-diff', /<del>[^<]*quick/.test(h) && /<ins>[^<]*slow/.test(h), h.slice(0, 120)); });
await t('find-and-replace', async () => { await p.fill('#in', 'a cat and a Cat'); await p.fill('#find', 'cat'); await p.fill('#rep', 'dog'); await p.click('#go'); eq('find-and-replace', await val('out'), 'a dog and a dog'); await p.check('#cs'); await p.click('#go'); eq('find-and-replace (case sensitive)', await val('out'), 'a dog and a Cat'); });
await t('text-sorter', async () => { await p.fill('#in', 'b\nc\na'); await p.click('#go'); eq('text-sorter', await val('out'), 'a\nb\nc'); await p.selectOption('#mode', 'za'); await p.click('#go'); eq('text-sorter Z-A', await val('out'), 'c\nb\na'); });
await t('reverse-text', async () => { await p.fill('#in', 'abc def'); await p.click('#rc'); eq('reverse-text chars', await val('out'), 'fed cba'); await p.click('#rw'); eq('reverse-text words', await val('out'), 'def abc'); });
await t('slug-generator', async () => { await p.fill('#in', 'Héllo, Wörld & Co!'); eq('slug-generator', await val('out'), 'hello-world-and-co'); });
await t('morse-code-translator', async () => { await p.fill('#in', 'SOS'); await p.click('#enc'); eq('morse encode', await val('out'), '... --- ...'); await p.fill('#in', '... --- ...'); await p.click('#dec'); eq('morse decode', await val('out'), 'sos'); });
await t('binary-text-converter', async () => { await p.fill('#in', 'Hi'); await p.click('#enc'); eq('binary encode', await val('out'), '01001000 01101001'); await p.fill('#in', '01001000 01101001'); await p.click('#dec'); eq('binary decode', await val('out'), 'Hi'); await p.selectOption('#base', '16'); await p.fill('#in', 'Hi'); await p.click('#enc'); eq('hex encode', await val('out'), '48 69'); });
// ---------- developer
await t('json-formatter', async () => { await p.fill('#in', '{"a":1,"b":[1,2]}'); await p.click('#pretty'); eq('json-formatter pretty', await val('out'), JSON.stringify({ a: 1, b: [1, 2] }, null, 2)); await p.click('#min'); eq('json-formatter minify', await val('out'), '{"a":1,"b":[1,2]}'); await p.fill('#in', '{bad'); await p.click('#pretty'); has('json-formatter invalid', await txt('info'), /./); });
await t('base64-encoder-decoder', async () => { await p.fill('#in', 'Hello, Wörld ✓'); await p.click('#enc'); const e = await val('out'); eq('base64 encode (utf-8)', e, Buffer.from('Hello, Wörld ✓').toString('base64')); await p.fill('#in', e); await p.click('#dec'); eq('base64 decode', await val('out'), 'Hello, Wörld ✓'); });
await t('url-encoder-decoder', async () => { await p.fill('#in', 'a b&c=d/é'); await p.click('#ev'); eq('url encode', await val('out'), 'a%20b%26c%3Dd%2F%C3%A9'); await p.fill('#in', 'a%20b%26c'); await p.click('#dec'); eq('url decode', await val('out'), 'a b&c'); });
await t('hash-generator', async () => { await p.fill('#in', 'abc'); await p.waitForTimeout(300); eq('sha-256 of abc', await txt('h-SHA-256'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'); eq('sha-1 of abc', await txt('h-SHA-1'), 'a9993e364706816aba3e25717850c26c9cd0d89d'); });
await t('jwt-decoder', async () => { await p.fill('#in', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3MDAwMDAwMDB9.x'); const pay = JSON.parse(await txt('pay')); check('jwt payload', pay.sub === '123' && pay.exp === 1700000000, pay); has('jwt expired flag', await txt('info'), /EXPIRED/); });
await t('regex-tester', async () => { await p.fill('#pat', '\\d+'); await p.fill('#in', 'a1 b22 c333'); await p.waitForTimeout(100); eq('regex match count', await txt('info'), '3 matches'); check('regex highlights', (await p.locator('#out mark').count()) === 3); });
await t('csv-to-json', async () => { await p.fill('#in', 'name,age\nAda,36\n"Smith, J",5'); await p.click('#go'); eq('csv-to-json', JSON.stringify(JSON.parse(await val('out'))), JSON.stringify([{ name: 'Ada', age: 36 }, { name: 'Smith, J', age: 5 }])); });
await t('json-to-csv', async () => { await p.fill('#in', '[{"a":1,"b":"x,y"},{"a":2,"c":true}]'); await p.click('#go'); eq('json-to-csv', await val('out'), 'a,b,c\n1,"x,y",\n2,,true'); const d = await download(() => p.click('#dlcsv')); eq('json-to-csv download', d.name, 'data.csv'); });
await t('timestamp-converter', async () => { await p.fill('#ts', '1700000000'); has('timestamp ISO', await txt('out'), /2023-11-14T22:13:20\.000Z/); });
await t('markdown-previewer', async () => { await p.fill('#in', '# Title\n\n**bold** and `code`\n\n- one\n- two'); await p.waitForTimeout(50); const h = await p.innerHTML('#out'); check('markdown-previewer', /<h1>Title/.test(h) && /<strong>bold/.test(h) && /<code>code/.test(h) && (h.match(/<li>/g) || []).length === 2, h); });
// ---------- generators
await t('qr-code-generator', async () => { check('qr renders svg', (await p.locator('#qr svg').count()) === 1); const png = await download(() => p.click('#png')); check('qr png download', png.buf.subarray(1, 4).toString() === 'PNG', png.name); const svg = await download(() => p.click('#svg')); check('qr svg download', svg.buf.toString().includes('<svg'), svg.name); });
await t('password-generator', async () => { const v = await val('out'); check('password default 16 chars', v.length === 16, v); await p.fill('#len', '40'); await p.dispatchEvent('#len', 'input'); const w = await val('out'); check('password length 40', w.length === 40, w); for (const k of ['up', 'nu', 'sy']) await p.uncheck('#' + k); await p.click('#go'); check('password lowercase only', /^[a-z]{40}$/.test(await val('out'))); });
await t('uuid-generator', async () => { await p.fill('#n', '5'); await p.click('#go'); const l = (await val('out')).split('\n'); check('uuid x5 valid & unique', l.length === 5 && new Set(l).size === 5 && l.every((x) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x)), l); });
await t('random-number-generator', async () => { await p.fill('#n', '10'); await p.fill('#min', '1'); await p.fill('#max', '10'); await p.check('#uniq'); await p.click('#go'); const l = (await val('out')).split(', ').map(Number); check('random unique 1-10 x10', new Set(l).size === 10 && l.every((x) => x >= 1 && x <= 10), l); await p.fill('#n', '11'); await p.click('#go'); has('random impossible unique', await txt('info'), /Only 10/); });
await t('lorem-ipsum-generator', async () => { await p.fill('#n', '2'); await p.selectOption('#unit', 'p'); await p.click('#go'); const o = await val('out'); check('lorem 2 paragraphs, classic start', /^Lorem ipsum/.test(o) && o.split(/\n\s*\n/).length === 2, o.slice(0, 60)); await p.selectOption('#unit', 'w'); await p.fill('#n', '7'); await p.click('#go'); eq('lorem 7 words', (await val('out')).trim().split(/\s+/).length, 7); });
// ---------- calculators
await t('unit-converter', async () => { await p.fill('#val', '100'); await p.selectOption('#cat', 'Temperature'); await p.selectOption('#from', '°C'); await p.selectOption('#to', '°F'); has('100C = 212F', await txt('out'), /212/); await p.selectOption('#cat', 'Length'); await p.selectOption('#from', 'km'); await p.selectOption('#to', 'mile'); has('100 km = 62.137 mile', await txt('out'), /62\.137/); });
await t('percentage-calculator', async () => { eq('15% of 200', await txt('r1'), '30'); eq('30 is 25% of 120', await txt('r2'), '25%'); eq('80 -> 100', await txt('r3'), '+25%'); });
await t('age-calculator', async () => { await p.fill('#dob', '2000-01-15'); await p.fill('#at', '2026-11-13'); await p.waitForTimeout(80); const o = (await txt('out')).replace(/\s+/g, ' '); has('age 26y 9m 29d', o, /26\s*Years\s*9\s*Months\s*29\s*Days/i); });
await t('bmi-calculator', async () => { has('bmi 22.5 normal', await txt('out'), /22\.5[\s\S]*Normal/); await p.selectOption('#sys', 'imp'); await p.fill('#h', '70'); await p.fill('#w', '154'); has('bmi imperial 22.1', await txt('out'), /22\.1/); });
await t('loan-calculator', async () => { has('loan 20000 @6.5% 5y => 391.32', await txt('out'), /391\.32/); });
await t('tip-calculator', async () => { const o = (await txt('out')).replace(/\s+/g, ' '); has('tip 9.00 total 69.00 each 34.50', o, /9\.00[\s\S]*69\.00[\s\S]*34\.50/); });
await t('roman-numeral-converter', async () => { eq('2026 -> MMXXVI', await val('rom'), 'MMXXVI'); await p.fill('#rom', 'MCMXCIV'); eq('MCMXCIV -> 1994', await val('num'), '1994'); await p.fill('#num', '4'); eq('4 -> IV', await val('rom'), 'IV'); await p.fill('#rom', 'IIII'); has('IIII invalid', await txt('info'), /valid/i); });
await t('pomodoro-timer', async () => { await p.click('#start'); await p.waitForTimeout(1500); has('pomodoro counts down', await txt('time'), /^24:5\d$/); await p.click('#start'); eq('pomodoro pause label', await txt('start'), 'Start'); await p.click('#reset'); eq('pomodoro reset', await txt('time'), '25:00'); await p.click('#skip'); eq('pomodoro skip -> break 5:00', await txt('time'), '05:00'); });
// ---------- image / pdf / design
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');
await t('image-compressor', async () => { await p.setInputFiles('#file', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]); await p.waitForSelector('.res a.dl', { timeout: 8000 }); // Playwright's Firefox does not emit a download event for .webp names (PNG/JPG/BIN work), so off Chromium read the link itself.
  const d = ENGINE === 'firefox' ? await p.evaluate(async () => { const a = document.querySelector('.res a.dl'); return { name: a.getAttribute('download'), bytes: Array.from(new Uint8Array(await (await (await fetch(a.href)).blob()).arrayBuffer())) }; }).then((r) => ({ name: r.name, buf: Buffer.from(r.bytes) })) : await download(() => p.click('.res a.dl')); const isWebp = d.buf.subarray(8, 12).toString() === 'WEBP', isPng = d.buf[1] === 0x50; check('image-compressor: file extension matches real content', (/\.webp$/.test(d.name) && isWebp) || (/\.png$/.test(d.name) && isPng), d.name); });
await t('image-to-base64', async () => { await p.setInputFiles('#file', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]); await p.waitForFunction(() => document.getElementById('out').value.length > 20); const o = await val('out'); check('image-to-base64 data URI decodes to the same PNG', o.startsWith('data:image/png;base64,') && Buffer.from(o.split(',')[1], 'base64').equals(png), o.slice(0, 40)); await p.check('#raw'); check('image-to-base64 raw mode', !(await val('out')).startsWith('data:')); });
let pdfBuf;
await t('image-to-pdf', async () => { await p.setInputFiles('#file', [{ name: 'a.png', mimeType: 'image/png', buffer: png }, { name: 'b.png', mimeType: 'image/png', buffer: png }]); const d = await download(() => p.click('#go')); pdfBuf = d.buf; const n = (await PDFDocument.load(d.buf)).getPageCount(); check('image-to-pdf -> valid 2-page PDF', d.buf.subarray(0, 4).toString() === '%PDF' && n === 2, n); });
await t('pdf-merge', async () => { await p.setInputFiles('#file', [{ name: 'a.pdf', mimeType: 'application/pdf', buffer: pdfBuf }, { name: 'b.pdf', mimeType: 'application/pdf', buffer: pdfBuf }]); const d = await download(() => p.click('#go')); eq('pdf-merge 2+2 pages', (await PDFDocument.load(d.buf)).getPageCount(), 4); });
await t('pdf-split', async () => { await p.setInputFiles('#file', [{ name: 'a.pdf', mimeType: 'application/pdf', buffer: pdfBuf }]); await p.fill('#pages', '2'); const d = await download(() => p.click('#go')); eq('pdf-split page 2 only', (await PDFDocument.load(d.buf)).getPageCount(), 1); await p.fill('#pages', '9'); await p.click('#go'); await p.waitForTimeout(200); has('pdf-split out-of-range message', await txt('info'), /not a valid|pages/i); });
await t('color-converter', async () => { await p.fill('#hex', '#ff0000'); eq('hex->rgb', await val('rgb'), 'rgb(255, 0, 0)'); eq('hex->hsl', await val('hsl'), 'hsl(0, 100%, 50%)'); await p.fill('#hsl', 'hsl(120, 100%, 50%)'); eq('hsl->hex', await val('hex'), '#00ff00'); });
await t('css-gradient-generator', async () => { await p.selectOption('#type', 'radial'); has('gradient radial css', await val('out'), /radial-gradient/); await p.selectOption('#type', 'linear'); has('gradient linear css', await val('out'), /linear-gradient\(135deg/); });

console.log(`\n${pass} passed, ${fail} failed`);
console.log('JS errors:', errs.length ? errs.slice(0, 8) : 'none');
await b.close(); process.exit(fail || errs.length ? 1 : 0);
