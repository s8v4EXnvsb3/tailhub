import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tools, categories } from './tools.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const nm = (p) => path.join(root, 'node_modules', p);
const SITE = 'ToolHub';

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
const cp = (from, to) => { fs.mkdirSync(path.dirname(path.join(dist, to)), { recursive: true }); fs.cpSync(from, path.join(dist, to), { recursive: true }); };
const write = (rel, content) => { const f = path.join(dist, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };

// static assets + vendored libs (self-hosted: no CDN, no COOP/COEP needed)
cp(path.join(root, 'src/assets'), 'assets');
cp(nm('@ffmpeg/ffmpeg/dist/esm'), 'vendor/ffmpeg');
cp(nm('@ffmpeg/util/dist/esm'), 'vendor/ffmpeg-util');
cp(nm('@ffmpeg/core/dist/esm/ffmpeg-core.js'), 'vendor/ffmpeg-core/ffmpeg-core.js');
cp(nm('@ffmpeg/core/dist/esm/ffmpeg-core.wasm'), 'vendor/ffmpeg-core/ffmpeg-core.wasm');
cp(nm('pdf-lib/dist/pdf-lib.min.js'), 'vendor/pdf-lib.min.js');
cp(nm('qrcode-generator/dist/qrcode.js'), 'vendor/qrcode.js');
for (const f of fs.readdirSync(path.join(dist, 'vendor/ffmpeg'))) if (f.endsWith('.d.ts') || f.endsWith('.d.mts')) fs.rmSync(path.join(dist, 'vendor/ffmpeg', f));
for (const f of fs.readdirSync(path.join(dist, 'vendor/ffmpeg-util'))) if (f.endsWith('.d.ts')) fs.rmSync(path.join(dist, 'vendor/ffmpeg-util', f));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const href = (t) => `/${t.slug}/`;

const head = (title, desc, extra = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%9A%A1%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="/assets/style.css">${extra}</head><body>`;
const nav = `<header class="nav"><a class="brand" href="/"><span class="logo">⚡</span>${SITE}</a>
<nav><a href="/#convert">Converters</a><a href="/#speech">Speech</a><a href="/#text">Text</a><a href="/#image">Image &amp; PDF</a></nav></header>`;
const foot = `<footer class="foot"><p>${SITE} — free tools that run entirely in your browser. Your files never leave your device.</p></footer>`;

const card = (t) => `<a class="card" href="${href(t)}" data-q="${esc((t.title + ' ' + t.desc).toLowerCase())}"><span class="ico">${t.icon}</span><span class="ct">${esc(t.title)}</span><span class="cd">${esc(t.desc.split('. ')[0].replace(/\.$/, ''))}</span></a>`;

// ---------- Home
const sections = categories.map((c) => {
  const list = tools.filter((t) => t.category === c.id);
  return `<section class="cat" id="${c.id}"><div class="cat-h"><h2>${c.name}</h2><span class="count">${list.length} tools</span></div><p class="blurb">${c.blurb}</p><div class="grid">${list.map(card).join('')}</div></section>`;
}).join('');
write('index.html', head(`${SITE} — Free online audio, video, text & PDF tools`, 'Free browser-based tools: MP4 to MP3, video compressor, text to speech in 15 languages, ringtone maker, QR codes, PDF merge and more. No uploads, no signup.') +
  nav + `<main>
<section class="hero"><div class="pill">${tools.length} free tools · no uploads · no signup</div>
<h1>Every everyday file tool,<br><span class="grad">right in your browser.</span></h1>
<p class="lead">Convert audio and video, compress files, turn text into speech, and more. Everything runs on your device, so your files stay private and nothing waits in a queue.</p>
<div class="search"><input id="q" type="search" placeholder="Search tools — try “mp3”, “hindi”, “pdf”…" autocomplete="off"></div>
<div class="chips">${categories.map((c) => `<a href="#${c.id}">${c.name}</a>`).join('')}</div></section>
<div id="none" class="none" hidden>No tools match your search.</div>
${sections}
<section class="why"><div><h3>🔒 Private</h3><p>Files are processed locally with WebAssembly. Nothing is uploaded.</p></div><div><h3>⚡ Fast</h3><p>No upload or download queue — start converting instantly.</p></div><div><h3>🆓 Free</h3><p>No watermarks, no accounts, no limits on file count.</p></div></section>
</main>${foot}<script src="/assets/home.js"></script></body></html>`);

// ---------- Tool pages
const utilBody = {
  'word-counter': `<textarea id="in" rows="10" placeholder="Type or paste your text…"></textarea><div class="stats" id="stats"></div>`,
  'case-converter': `<textarea id="in" rows="8" placeholder="Type or paste your text…"></textarea><div class="btns" id="cases"></div><textarea id="out" rows="8" readonly placeholder="Result"></textarea><button class="btn ghost" id="copy">Copy result</button>`,
  'remove-duplicate-lines': `<textarea id="in" rows="9" placeholder="One item per line…"></textarea><div class="opts"><label><input type="checkbox" id="trim" checked> Trim spaces</label><label><input type="checkbox" id="ci"> Ignore case</label><label><input type="checkbox" id="sort"> Sort A→Z</label><label><input type="checkbox" id="empty" checked> Remove empty lines</label></div><div class="btns"><button class="btn" id="go">Remove duplicates</button></div><div class="note" id="info"></div><textarea id="out" rows="9" readonly></textarea><button class="btn ghost" id="copy">Copy result</button>`,
  'text-diff': `<div class="two"><div><label class="lbl">Original</label><textarea id="a" rows="9"></textarea></div><div><label class="lbl">Changed</label><textarea id="b" rows="9"></textarea></div></div><div class="btns"><button class="btn" id="go">Compare</button></div><div class="diff" id="out"></div>`,
  'lorem-ipsum-generator': `<div class="opts"><label>Amount <input type="number" id="n" value="3" min="1" max="100"></label><label>Unit <select id="unit"><option value="p">Paragraphs</option><option value="s">Sentences</option><option value="w">Words</option></select></label><label><input type="checkbox" id="classic" checked> Start with “Lorem ipsum”</label></div><div class="btns"><button class="btn" id="go">Generate</button></div><textarea id="out" rows="12" readonly></textarea><button class="btn ghost" id="copy">Copy</button>`,
  'json-formatter': `<textarea id="in" rows="12" placeholder='Paste JSON here, e.g. {"a":1}'></textarea><div class="btns"><button class="btn" id="pretty">Format</button><button class="btn ghost" id="min">Minify</button><button class="btn ghost" id="copy">Copy</button></div><div class="note" id="info"></div><textarea id="out" rows="12" readonly></textarea>`,
  'base64-encoder-decoder': `<textarea id="in" rows="7" placeholder="Text or Base64…"></textarea><div class="btns"><button class="btn" id="enc">Encode →</button><button class="btn ghost" id="dec">← Decode</button><button class="btn ghost" id="copy">Copy result</button></div><div class="note" id="info"></div><textarea id="out" rows="7" readonly></textarea>`,
  'qr-code-generator': `<textarea id="in" rows="3" placeholder="https://example.com or any text">https://example.com</textarea><div class="opts"><label>Size <select id="size"><option>256</option><option selected>512</option><option>1024</option></select></label><label>Error correction <select id="ecc"><option value="L">Low</option><option value="M" selected>Medium</option><option value="Q">Quartile</option><option value="H">High</option></select></label></div><div class="qrbox" id="qr"></div><div class="btns"><button class="btn" id="png">Download PNG</button><button class="btn ghost" id="svg">Download SVG</button></div>`,
  'image-compressor': `<div class="drop" id="drop"><input type="file" id="file" accept="image/*" multiple hidden><div class="drop-i">🖼️</div><b>Choose images</b> or drop them here</div><div class="opts"><label>Format <select id="fmt"><option value="image/jpeg">JPG</option><option value="image/webp" selected>WebP</option><option value="image/png">PNG</option></select></label><label>Quality <input type="range" id="qual" min="30" max="100" value="80"><span id="qv">80</span></label><label>Max width (px) <input type="number" id="maxw" value="1920" min="16"></label></div><div id="results" class="results"></div>`,
  'pdf-merge': `<div class="drop" id="drop"><input type="file" id="file" accept="application/pdf,.pdf" multiple hidden><div class="drop-i">📚</div><b>Choose PDFs</b> or drop them here</div><ul id="list" class="flist"></ul><div class="btns"><button class="btn" id="go" disabled>Merge PDFs</button></div><div class="note" id="info"></div>`,
};

const ffmpegBody = (t) => {
  let opts = '';
  if (t.mode === 'compress-audio') opts = `<div class="opts"><label>Bitrate <select id="bitrate"><option value="64k">64 kbps (smallest)</option><option value="96k">96 kbps</option><option value="128k" selected>128 kbps</option><option value="192k">192 kbps</option></select></label><label>Channels <select id="chan"><option value="">Keep</option><option value="1">Mono</option></select></label></div>`;
  if (t.mode === 'compress-video') opts = `<div class="opts"><label>Max height <select id="height"><option value="">Original</option><option value="1080">1080p</option><option value="720" selected>720p</option><option value="480">480p</option></select></label><span class="note">Target size: ~${t.targetMB} MB</span></div>`;
  if (t.mode === 'ringtone') opts = `<div class="opts"><label>Start (sec) <input type="number" id="start" value="0" min="0" step="0.1"></label><label>Length (sec) <input type="number" id="len" value="30" min="1" max="40" step="0.1"></label></div><audio id="preview" controls class="prev" hidden></audio><div class="note">iPhone ringtones must be 40 seconds or shorter. 30 s is a safe default.</div>`;
  return `<div class="drop" id="drop"><input type="file" id="file" accept="${esc(t.accept)}" hidden><div class="drop-i">${t.icon}</div><b>Choose a file</b> or drop it here<div class="fname" id="fname"></div></div>${opts}
<div class="btns"><button class="btn" id="go" disabled>${t.mode === 'ringtone' ? 'Create ringtone' : t.mode.startsWith('compress') ? 'Compress' : `Convert to ${t.out.toUpperCase()}`}</button></div>
<div class="prog" id="prog" hidden><div class="bar"><i id="barfill"></i></div><div class="note" id="status">Loading engine…</div></div>
<div class="done" id="done" hidden></div>`;
};

const ttsBody = (t) => `<textarea id="in" rows="8" placeholder="Type or paste text…">${esc(t.sample)}</textarea>
<div class="opts">${t.multi ? `<label>Language <select id="lang">${t.multi.map((l) => `<option>${l}</option>`).join('')}</select></label>` : ''}<label>Voice <select id="voice"><option>Loading voices…</option></select></label><label>Speed <input type="range" id="rate" min="0.5" max="2" step="0.1" value="1"><span id="rv">1.0×</span></label><label>Pitch <input type="range" id="pitch" min="0.5" max="2" step="0.1" value="1"><span id="pv">1.0</span></label></div>
<div class="btns"><button class="btn" id="play">▶ Speak</button><button class="btn ghost" id="pause">Pause</button><button class="btn ghost" id="stop">Stop</button></div>
<div class="note" id="info"></div>`;

const FAQ = {
  ffmpeg: [['Is my file uploaded?', 'No. The conversion runs inside your browser using WebAssembly. Your file never leaves your device.'], ['Is there a file size limit?', 'There is no server limit, but browsers cap memory. Files up to about 1 GB usually work on a desktop; large videos take longer.'], ['Why is the first run slower?', 'The conversion engine (about 30 MB) loads once and is then cached by your browser.']],
  tts: [['Which voices are used?', 'Your device’s built-in voices. Quality varies by operating system and browser — Chrome and Edge usually offer the most.'], ['I can’t find a voice for this language', 'Install the language voice in your OS settings (Windows: Settings → Time & language → Speech), then reload the page.'], ['Can I download the audio?', 'Browser speech can’t be saved directly. Use the Speak button, or record system audio.']],
  util: [['Is my data sent anywhere?', 'No. Everything is processed locally in your browser.']],
};

for (const t of tools) {
  const related = tools.filter((x) => x.category === t.category && x.slug !== t.slug).slice(0, 8);
  const body = t.kind === 'ffmpeg' ? ffmpegBody(t) : t.kind === 'tts' ? ttsBody(t) : utilBody[t.slug];
  const faq = FAQ[t.kind].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  const scripts = t.kind === 'ffmpeg' ? '<script type="module" src="/assets/ffmpeg-tool.js"></script>' : t.kind === 'tts' ? '<script src="/assets/tts.js"></script>'
    : `${t.slug === 'pdf-merge' ? '<script src="/vendor/pdf-lib.min.js"></script>' : ''}${t.slug === 'qr-code-generator' ? '<script src="/vendor/qrcode.js"></script>' : ''}<script src="/assets/utils.js"></script>`;
  write(`${t.slug}/index.html`, head(`${t.title} — Free Online | ${SITE}`, t.desc) + nav + `<main class="tool">
<div class="crumb"><a href="/">All tools</a> <span>/</span> ${esc(t.title)}</div>
<h1>${t.icon} ${esc(t.title)}</h1><p class="lead">${esc(t.desc)}</p>
<div class="panel" id="app">${body}</div>
<section class="faq"><h2>FAQ</h2>${faq}</section>
${related.length ? `<section class="related"><h2>More ${categories.find((c) => c.id === t.category).name.toLowerCase()}</h2><div class="grid sm">${related.map(card).join('')}</div></section>` : ''}
</main>${foot}<script>window.TOOL=${JSON.stringify(t).replace(/</g, '\\u003c')};</script>${scripts}</body></html>`);
}

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>/</loc></url>${tools.map((t) => `<url><loc>${href(t)}</loc></url>`).join('')}</urlset>`);
write('robots.txt', 'User-agent: *\nAllow: /\n');
console.log(`built ${tools.length} tool pages`);
