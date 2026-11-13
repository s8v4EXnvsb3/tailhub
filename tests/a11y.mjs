import { chromium } from 'playwright-core';
import fs from 'node:fs';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const axe = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const pages = ['/', '/background-remover/', '/speech-to-text/', '/image-upscaler/', '/ocr-image-to-text/', '/compress-audio/', '/pdf-merge/', '/malay-text-to-speech/', '/image-compressor/', '/blog/'];
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const seen = {};
for (const theme of ['dark', 'light']) for (const w of [1280, 390]) {
  const c = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await c.newPage();
  await p.addInitScript((t) => localStorage.setItem('th-theme', t), theme);
  for (const u of pages) {
    const r = await p.goto(base + u); if (!r.ok()) { console.log('SKIP', u, r.status()); continue; }
    await p.waitForTimeout(300); await p.evaluate(axe);
    const res = await p.evaluate(() => axe.run({ runOnly: ['wcag2a', 'wcag2aa', 'best-practice'] }));
    for (const v of res.violations) for (const n of v.nodes) { const k = v.id + ' | ' + n.target.join(' ').slice(0, 70); (seen[k] ||= { id: v.id, impact: v.impact, msg: (n.any[0]?.message || n.failureSummary || '').slice(0, 110), where: new Set() }).where.add(`${theme}${w}${u}`); }
  }
  await c.close();
}
const rows = Object.entries(seen).map(([k, v]) => ({ k, ...v, n: v.where.size })).sort((a, b) => b.n - a.n);
const byId = {}; for (const r of rows) (byId[r.id] ||= []).push(r);
for (const [id, l] of Object.entries(byId)) { console.log(`\n## ${id} (${l[0].impact}) x${l.length}`); for (const r of l.slice(0, 5)) console.log('  ', r.k.split(' | ')[1], '::', r.msg, `[${r.n} pages]`); }
console.log('\ntotal distinct issues', rows.length); await b.close();
