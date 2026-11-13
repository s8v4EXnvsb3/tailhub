// Tests every ffmpeg-based tool with a real fixture, then verifies the OUTPUT file with ffprobe.
// usage: node tests/ffmpeg.mjs [baseUrl] [slugFilter]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const only = process.argv[3];
const exe = process.env.BROWSER_EXE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const fx = fs.mkdtempSync(path.join(os.tmpdir(), 'fx-'));
const ff = (...a) => execFileSync('ffmpeg', ['-nostdin', '-y', '-loglevel', 'error', ...a]);
const probe = (f) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f]).toString());

// ---- fixtures (all real files made by ffmpeg)
const A = ['-f', 'lavfi', '-i', 'sine=frequency=440:duration=4:sample_rate=44100'];
const V = ['-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=15:duration=3', ...A.slice(0, 0)];
const F = {};
const mk = (name, args) => { const f = path.join(fx, name); ff(...args, f); F[name.split('.').pop()] = f; return f; };
mk('t.wav', [...A]); mk('t.mp3', [...A, '-c:a', 'libmp3lame']); mk('t.m4a', [...A, '-c:a', 'aac']); mk('t.aac', [...A, '-c:a', 'aac']);
mk('t.flac', [...A]); mk('t.ogg', [...A, '-c:a', 'libvorbis']); mk('t.opus', [...A, '-c:a', 'libopus']);
mk('t.amr', ['-f', 'lavfi', '-i', 'sine=frequency=440:duration=4:sample_rate=8000', '-ac', '1', '-c:a', 'libopencore_amrnb']);
mk('t.wma', [...A, '-c:a', 'wmav2']);
const AV = [...V, '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3:sample_rate=44100', '-shortest'];
mk('t.mp4', [...AV, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac']); mk('t.mov', [...AV, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac']);
mk('t.webm', [...AV, '-c:v', 'libvpx', '-c:a', 'libvorbis']); mk('t.mkv', [...AV, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac']);
mk('t.avi', [...AV, '-c:v', 'mpeg4', '-c:a', 'libmp3lame']);
mk('t.gif', [...V, '-vf', 'fps=10']);

// ---- which fixture each tool gets
const pick = (slug) => {
  if (slug === 'whatsapp-audio-to-mp3') return 'opus';
  if (/^(video|extract-voice)/.test(slug) || /^compress-video|^mute-video/.test(slug)) return 'mp4';
  if (slug === 'compress-audio' || slug === 'iphone-ringtone-maker' || slug === 'mp3-cutter') return 'wav';
  return slug.split('-to-')[0];
};
const { tools } = await import(pathToFileURL(path.resolve('src/tools.mjs')).href);
const list = tools.filter((t) => t.kind === 'ffmpeg' && (!only || t.slug.includes(only)));

const b = await chromium.launch({ executablePath: exe, headless: true });
const ctx = await b.newContext({ acceptDownloads: true });
let pass = 0, fail = 0;
for (const t of list) {
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const ext = pick(t.slug), src = F[ext], t0 = Date.now();
  try {
    if (!src) throw new Error('no fixture for ' + ext);
    await p.goto(`${base}/${t.slug}/`);
    await p.setInputFiles('#file', src);
    if (t.mode === 'ringtone' || t.mode === 'trim') { await p.fill('#start', '1'); await p.fill('#len', '2'); }
    await p.click('#go');
    await p.waitForSelector('#done:not([hidden]), #status.err', { timeout: 170000 });
    if (await p.locator('#status.err').count()) throw new Error('tool error: ' + (await p.innerText('#status')));
    const info = await p.evaluate(async () => { const a = document.querySelector('#done a'); const r = await fetch(a.href); const buf = new Uint8Array(await r.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode(...buf.subarray(i, i + 8192)); return { name: a.download, b64: btoa(s) }; });
    const out = path.join(fx, 'out-' + t.slug + path.extname(info.name)); fs.writeFileSync(out, Buffer.from(info.b64, 'base64'));
    const pr = probe(out), codecs = pr.streams.map((s) => s.codec_name), dur = +pr.format.duration, hasV = pr.streams.some((s) => s.codec_type === 'video'), hasA = pr.streams.some((s) => s.codec_type === 'audio');
    const bad = [];
    const want = { mp3: 'mp3', wav: 'pcm_s16le', gif: 'gif', mp4: 'h264' }[t.out];
    if (t.mode === 'convert' && want && !codecs.some((c) => c.startsWith(want.slice(0, 3)))) bad.push(`codec ${codecs} != ${want}`);
    if (t.out === 'mp3' && hasV) bad.push('mp3 has video stream');
    if (t.out === 'mp4' && !hasV) bad.push('mp4 has no video');
    if (t.mode === 'mute' && hasA) bad.push('audio not removed');
    if (t.mode === 'convert' && t.out === 'mp4' && t.slug !== 'gif-to-mp4' && !hasA) bad.push('mp4 lost audio');
    if (t.mode === 'trim' && !(dur > 1.5 && dur < 2.6)) bad.push('trim duration ' + dur);
    if (t.mode === 'ringtone' && !(dur > 1.5 && dur < 2.6)) bad.push('ringtone duration ' + dur);
    if (t.out === 'mp3' && t.mode === 'convert' && !(dur > 2.5)) bad.push('duration too short ' + dur);
    if (t.mode === 'compress-audio' && !hasA) bad.push('no audio');
    if (t.mode === 'compress-video' && !(hasV && hasA)) bad.push('lost streams');
    if (errs.length) bad.push('JS error: ' + errs[0]);
    const ok = !bad.length; ok ? pass++ : fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${t.slug.padEnd(26)} in=.${ext} -> ${info.name} [${codecs}] ${dur.toFixed(1)}s ${(fs.statSync(out).size / 1024).toFixed(0)}KB ${((Date.now() - t0) / 1000).toFixed(0)}s ${bad.join('; ')}`);
  } catch (e) { fail++; console.log(`FAIL ${t.slug.padEnd(26)} ${e.message.split('\n')[0]}`); }
  await p.close();
}
console.log(`\nffmpeg tools: ${pass} passed, ${fail} failed (of ${list.length})`);
await b.close(); fs.rmSync(fx, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
