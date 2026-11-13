import { chromium } from 'playwright-core';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
let bad = 0;
for (const [s, re] of [['aac-to-mp3', /ffmpeg-core\.wasm/], ['background-remover', /ort-wasm.*asyncify\.wasm/], ['image-compressor', null]]) {
  const p = await (await b.newContext()).newPage(); const hit = []; p.on('request', (r) => /\.wasm/.test(r.url()) && hit.push(r.url()));
  await p.goto(`${base}/${s}/`, { waitUntil: 'networkidle' }); const before = hit.length;
  await p.hover('#drop'); await p.waitForTimeout(1500);
  const ok = re ? before === 0 && hit.some((u) => re.test(u)) : hit.length === 0;
  if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', s, 'wasm before intent:', before, 'after hover:', hit.length);
}
await b.close(); process.exit(bad ? 1 : 0);
