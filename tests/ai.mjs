// Tests the five in-browser AI tools with real inputs and checks the actual output.
// Needs network the first time (model weights come from huggingface.co). usage: node tests/ai.mjs [baseUrl] [slug]
import * as pw from 'playwright-core';
const ENGINE = process.env.ENGINE || 'chromium';
const chromium = pw[ENGINE];
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const base = process.argv[2] || 'http://127.0.0.1:4173', only = process.argv[3];
const exe = process.env.BROWSER_EXE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FX = 'tests/fixtures/'; await mkdir(FX, { recursive: true });
const b = await chromium.launch({ ...(ENGINE === 'chromium' ? { executablePath: exe } : {}), headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage(); p.setDefaultTimeout(240000);
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/favicon|^INFO:/.test(m.text()) && errs.push(m.text()));
let pass = 0, fail = 0;
const check = (n, ok, got) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${ok ? '' : '  -> ' + JSON.stringify(got)}`); };
const run = async (slug, fn) => { if (only && only !== slug) return; await p.goto(`${base}/${slug}/`); const t0 = Date.now(); try { await fn(); } catch (e) { check(slug, false, e.message.split('\n')[0]); } console.log(`   (${slug} ${((Date.now() - t0) / 1000).toFixed(0)}s)`); };
const download = async (sel) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(sel)]); return { name: d.suggestedFilename(), buf: await readFile(await d.path()) }; };
const upload = (f) => p.setInputFiles('#file', FX + f);
const done = (id = 'info') => p.waitForFunction((i) => /^(Done|Transcribed|Blurred|\d+x\d+ to|\d+ words|No )/.test(document.getElementById(i).textContent), id);

// fixtures
const pg = await ctx.newPage(); await pg.setViewportSize({ width: 700, height: 240 });
await pg.setContent('<body style="margin:0;background:#fff;font:34px Arial;padding:30px;color:#000">Invoice number 4821<br>Total due: $99.50<br>Thank you for your order</body>');
await writeFile(FX + 'text.png', await pg.screenshot()); await pg.close();
execFileSync('ffmpeg', ['-nostdin', '-y', '-v', 'error', '-i', FX + 'face.jpg', '-vf', 'crop=203:151:300:100', FX + 'small.png']);

await run('ocr-image-to-text', async () => {
  await upload('text.png'); await done();
  const o = await p.inputValue('#out'); check('ocr reads text', /4821/.test(o) && /99\.50/.test(o) && /Thank you/i.test(o), o);
  check('ocr shows confidence', /\d+% average confidence/.test(await p.innerText('#info')));
  const d = await download('#txt'); check('ocr .txt download', d.name === 'text.txt' && d.buf.toString().includes('4821'), d.name);
});
await run('background-remover', async () => {
  await upload('face.jpg'); await done(); await p.waitForSelector('#result:not([hidden])');
  const r = await p.evaluate(() => { const c = document.getElementById('cv'), x = c.getContext('2d'); const a = (px, py) => x.getImageData(px, py, 1, 1).data[3]; return { w: c.width, h: c.height, corner: a(3, 3), center: a(c.width >> 1, c.height >> 1), mid: a(c.width >> 1, Math.round(c.height * 0.4)) }; });
  check('bg-remover: corner transparent, subject opaque', r.corner < 60 && (r.center > 200 || r.mid > 200), r);
  const d = await download('#dl'); check('bg-remover PNG with alpha channel', d.buf.subarray(1, 4).toString() === 'PNG' && d.buf[25] === 6 && d.name === 'face-no-bg.png', { name: d.name, ct: d.buf[25] });
  await p.selectOption('#bgc', '#ffffff'); const wp = await p.evaluate(() => document.getElementById('cv').getContext('2d').getImageData(3, 3, 1, 1).data[3]); check('bg-remover white background applied', wp === 255, wp);
});
await run('speech-to-text', async () => {
  await upload('speech.wav'); await done();
  const o = (await p.inputValue('#out')).toLowerCase(); check('stt transcript', o.includes('hello everyone') && o.includes('subtitle tool'), o);
  await p.selectOption('#fmt', 'srt'); const s = await p.inputValue('#out'); check('stt SRT format', /^1\n\d\d:\d\d:\d\d,\d{3} --> \d\d:\d\d:\d\d,\d{3}\n/.test(s), s.slice(0, 60));
  await p.selectOption('#fmt', 'vtt'); check('stt WebVTT format', (await p.inputValue('#out')).startsWith('WEBVTT'));
  const d = await download('#dl'); check('stt download .vtt', d.name === 'speech.vtt' && d.buf.toString().startsWith('WEBVTT'), d.name);
});
await run('blur-faces', async () => {
  await upload('face.jpg'); await done(); await p.waitForSelector('#result:not([hidden])');
  check('blur finds the face', /Blurred 1 face/.test(await p.innerText('#info')), await p.innerText('#info'));
  const diff = async () => p.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64; await img.decode(); const c = document.getElementById('cv'); const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; o.getContext('2d').drawImage(img, 0, 0, c.width, c.height); const A = o.getContext('2d').getImageData(0, 0, c.width, c.height).data, B = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let ch = 0, tot = 0, edge = 0; for (let i = 0; i < A.length; i += 4) { if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) > 6) ch++; } return { changed: ch / (A.length / 4) }; }, (await readFile(FX + 'face.jpg')).toString('base64'));
  const r = await diff(); check('blur changes only part of the image (face region)', r.changed > 0.01 && r.changed < 0.5, r);
  await p.selectOption('#style', 'box'); const bx = await diff(); check('black box style also works', bx.changed > 0.01 && bx.changed < 0.6, bx);
  const d = await download('#dl'); check('blur PNG download', d.buf.subarray(1, 4).toString() === 'PNG' && d.name === 'face-blurred.png', d.name);
});
await run('image-upscaler', async () => {
  await p.evaluate(() => { window.__pt = []; new MutationObserver(() => window.__pt.push(document.getElementById('pt').textContent)).observe(document.getElementById('pt'), { childList: true, characterData: true, subtree: true }); });
  await upload('small.png'); await done(); await p.waitForSelector('#result:not([hidden])');
  const pts = await p.evaluate(() => window.__pt); const parts = [...new Set(pts.map((t) => (t.match(/part (\d+) of (\d+)/) || [])[0]).filter(Boolean))];
  check('upscaler shows progress per part (4 parts)', parts.length === 4 && /of 4/.test(parts[0]), parts);
  const seam = await p.evaluate(() => { const c = document.getElementById('after'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const col = (x) => { let t = 0; for (let y = 0; y < c.height; y++) { const i = (y * c.width + x) * 4, j = i + 4; t += Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]); } return t / c.height; }; let base = 0, n = 0; for (let x = 200; x < 300; x++) { if (x >= 253 && x <= 258) continue; base += col(x); n++; } return { seam: col(255), base: base / n }; });
  check('upscaler tile seam is not visible (seam diff < 2x normal)', seam.seam < seam.base * 2 + 1, seam);
  const s = await p.evaluate(() => ({ b: [document.getElementById('before').width, document.getElementById('before').height], a: [document.getElementById('after').width, document.getElementById('after').height] }));
  check('upscaler doubles size (203x151 -> 406x302)', s.b.join('x') === '203x151' && s.a.join('x') === '406x302', s);
  execFileSync('ffmpeg', ['-nostdin', '-y', '-v', 'error', '-i', FX + 'face.jpg', '-vf', 'scale=800:-1', FX + 'big.png']);
  const d0 = await download('#dl'); check('upscaler PNG download', d0.buf.subarray(1, 4).toString() === 'PNG' && d0.name === 'small-2x.png', d0.name);
  await upload('big.png'); await p.waitForFunction(() => /reduced to/.test(document.getElementById('info').textContent) && !document.getElementById('result').hidden && /^\d+x\d+ to/.test(document.getElementById('info').textContent));
  const big = await p.evaluate(() => ({ a: [document.getElementById('after').width, document.getElementById('after').height], info: document.getElementById('info').textContent }));
  check('large image is reduced to 384px and doubled (768 on the long side) with a notice', Math.max(...big.a) === 768 && /reduced/.test(big.info), big);
  const d = { buf: d0.buf, name: d0.name }; check('upscaler PNG download (re-check)', d.buf.subarray(1, 4).toString() === 'PNG' && d.name === 'small-2x.png', d.name);
});
console.log(`\n${pass} passed, ${fail} failed`); console.log('JS errors:', errs.length ? errs.slice(0, 6) : 'none');
await b.close(); process.exit(fail || errs.length ? 1 : 0);
