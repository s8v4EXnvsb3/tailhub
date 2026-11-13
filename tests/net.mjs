import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
for (const s of ['background-remover', 'aac-to-mp3', 'speech-to-text']) { const p = await (await b.newContext()).newPage(); const L = []; p.on('response', async (r) => { const n = +(r.headers()['content-length'] || 0); L.push([r.url().replace(/^https?:\/\/[^/]+/, ''), n]); });
  await p.goto('https://tailhub-liard.vercel.app/' + s + '/', { waitUntil: 'networkidle' }); const big = L.filter(([u]) => /vendor|\.wasm/.test(u)); console.log(s, 'requests', L.length, 'vendor/wasm at load:', big.map(([u, n]) => u + ' ' + n).join(', ') || 'none'); }
await b.close();
