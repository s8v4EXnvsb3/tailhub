// Headless end-to-end check: node test-e2e.mjs <baseUrl>   (needs playwright-core + Edge/Chrome)
import { chromium } from 'playwright-core';
const base = process.argv[2] || 'http://localhost:4173';
const exe = process.env.BROWSER_EXE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const b = await chromium.launch({ executablePath: exe, headless: true });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

const wav = () => { const sr = 8000, n = sr * 2, buf = Buffer.alloc(44 + n * 2); buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40); for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin(i / 10) * 12000), 44 + i * 2); return buf; };

async function ff(slug, name, mime, buf, pre) {
  await p.goto(`${base}/${slug}/`);
  await p.setInputFiles('#file', { name, mimeType: mime, buffer: buf });
  if (pre) await pre();
  await p.click('#go');
  await p.waitForSelector('#done:not([hidden]), #status.err', { timeout: 120000 });
  const t = await p.innerText('#done').catch(() => '');
  const st = await p.innerText('#status');
  console.log(slug, '→', t.replace(/\n/g, ' | ') || st);
}
await ff('wav-to-mp3', 'tone.wav', 'audio/wav', wav());
await ff('mp3-to-wav', 'tone.wav', 'audio/wav', wav());
await ff('compress-audio', 'tone.wav', 'audio/wav', wav());
await ff('iphone-ringtone-maker', 'tone.wav', 'audio/wav', wav(), () => p.fill('#len', '1'));

// text utils
await p.goto(`${base}/json-formatter/`); await p.fill('#in', '{"a":[1,2]}'); await p.click('#pretty'); console.log('json →', (await p.inputValue('#out')).replace(/\n/g, ' '), '|', await p.innerText('#info'));
await p.goto(`${base}/base64-encoder-decoder/`); await p.fill('#in', 'héllo'); await p.click('#enc'); console.log('b64 →', await p.inputValue('#out'));
await p.goto(`${base}/qr-code-generator/`); console.log('qr svg →', await p.locator('#qr svg').count());
await p.goto(`${base}/word-counter/`); await p.fill('#in', 'one two three. four'); console.log('wc →', (await p.innerText('#stats')).replace(/\n/g, ' '));
await p.goto(`${base}/text-diff/`); await p.fill('#a', 'the cat sat'); await p.fill('#b', 'the dog sat'); await p.click('#go'); console.log('diff →', await p.innerHTML('#out'));
await p.goto(`${base}/hindi-text-to-speech/`); console.log('tts info →', await p.innerText('#info'));
await p.goto(`${base}/`); await p.fill('#q', 'mp3'); console.log('search mp3 visible cards →', await p.locator('.card:visible').count());
console.log('page errors:', errs.length ? errs : 'none');
await b.close();
