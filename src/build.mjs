import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tools, categories, featured } from './tools.mjs';
import { buildPost, postTitle } from './content.mjs';
import { UI, ffmpegUI, ttsUI } from './ui.mjs';
import { ico, toolIcon, catIcon } from './icons.mjs';

const SITE = 'TailHub';
const URL_BASE = process.env.SITE_URL || 'https://tailhub-liard.vercel.app';
const DATE = '2026-11-13';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const nm = (p) => path.join(root, 'node_modules', p);

fs.mkdirSync(dist, { recursive: true });
for (const f of fs.readdirSync(dist)) fs.rmSync(path.join(dist, f), { recursive: true, force: true }); // keep dist itself: a local preview server may hold it open
fs.cpSync(path.join(root, 'src/assets'), path.join(dist, 'assets'), { recursive: true });
// Everything is self-hosted: no CDN, and single-threaded ffmpeg core needs no COOP/COEP headers.
fs.cpSync(nm('@ffmpeg/ffmpeg/dist/esm'), path.join(dist, 'vendor/ffmpeg'), { recursive: true });
fs.cpSync(nm('@ffmpeg/util/dist/esm'), path.join(dist, 'vendor/ffmpeg-util'), { recursive: true });
fs.mkdirSync(path.join(dist, 'vendor/ffmpeg-core'), { recursive: true });
for (const f of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) fs.copyFileSync(nm('@ffmpeg/core/dist/esm/' + f), path.join(dist, 'vendor/ffmpeg-core', f));
fs.copyFileSync(nm('pdf-lib/dist/pdf-lib.min.js'), path.join(dist, 'vendor/pdf-lib.min.js'));
fs.copyFileSync(nm('qrcode-generator/dist/qrcode.js'), path.join(dist, 'vendor/qrcode.js'));
// AI tool runtimes (all self-hosted; only model weights are fetched at run time)
const cp = (from, to) => { fs.mkdirSync(path.dirname(path.join(dist, to)), { recursive: true }); fs.copyFileSync(nm(from), path.join(dist, to)); };
for (const [pkg, f] of [['ibm-plex-sans', 'ibm-plex-sans-latin-400-normal'], ['ibm-plex-sans', 'ibm-plex-sans-latin-500-normal'], ['ibm-plex-sans', 'ibm-plex-sans-latin-600-normal'], ['ibm-plex-sans', 'ibm-plex-sans-latin-700-normal'], ['ibm-plex-mono', 'ibm-plex-mono-latin-400-normal'], ['ibm-plex-mono', 'ibm-plex-mono-latin-500-normal']]) cp('@fontsource/' + pkg + '/files/' + f + '.woff2', 'assets/fonts/' + f + '.woff2');
cp('@huggingface/transformers/dist/transformers.min.js', 'vendor/transformers/transformers.min.js');
cp('onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.mjs', 'vendor/transformers/ort-wasm-simd-threaded.asyncify.mjs');
cp('onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.wasm', 'vendor/transformers/ort-wasm-simd-threaded.asyncify.wasm');
cp('tesseract.js/dist/tesseract.min.js', 'vendor/tesseract/tesseract.min.js');
cp('tesseract.js/dist/worker.min.js', 'vendor/tesseract/worker.min.js');
for (const f of fs.readdirSync(nm('tesseract.js-core')).filter((x) => /^tesseract-core.*.wasm.js$/.test(x))) cp('tesseract.js-core/' + f, 'vendor/tesseract/' + f);
cp('@mediapipe/tasks-vision/vision_bundle.mjs', 'vendor/mediapipe/vision_bundle.mjs');
cp('@mediapipe/tasks-vision/wasm/vision_wasm_internal.js', 'vendor/mediapipe/wasm/vision_wasm_internal.js');
cp('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'vendor/tesseract/lang/eng.traineddata.gz');
for (const f of ['vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) if (fs.existsSync(nm('@mediapipe/tasks-vision/wasm/' + f))) cp('@mediapipe/tasks-vision/wasm/' + f, 'vendor/mediapipe/wasm/' + f);
cp('@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm', 'vendor/mediapipe/wasm/vision_wasm_internal.wasm');
fs.copyFileSync(path.join(root, 'src/models/blaze_face_short_range.tflite'), path.join(dist, 'vendor/mediapipe/blaze_face_short_range.tflite'));

const write = (rel, html) => { const f = path.join(dist, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cat = Object.fromEntries(categories.map((c) => [c.id, c]));
const bySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));
const toolUrl = (t) => `/${t.slug}/`, postUrl = (t) => `/blog/${t.slug}/`;
const keyOf = (t) => `${t.title} ${t.desc} ${cat[t.category].name}`.toLowerCase();

// ------------------------------------------------------------------ shared chrome
const themeBoot = `<script>try{var t=localStorage.getItem('th-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}</script>`;

function sidebar(activePath) {
  const groups = categories.map((c) => {
    const items = tools.filter((t) => t.category === c.id);
    return `<details><summary>${catIcon(c, 16)}<span>${esc(c.name)}</span><span class="n">${items.length}</span></summary>${items.map((t) => `<a class="lk${toolUrl(t) === activePath ? ' on' : ''}" href="${toolUrl(t)}" data-q="${esc(keyOf(t))}">${esc(t.title)}</a>`).join('')}</details>`;
  }).join('');
  return `<aside class="side" aria-label="All tools"><div class="side-h"><a class="brand" href="/"><span class="logo">${ico('layout-grid', 18)}</span><span class="wm">TailHub</span></a><input class="sq" type="search" placeholder="Search ${tools.length} tools…  ( / )" aria-label="Search tools"></div><nav class="nav-top"><a href="/"${activePath === '/' ? ' class="on"' : ''}>Home</a><a href="/blog/"${activePath.startsWith('/blog') ? ' class="on"' : ''}>Blog</a></nav><div class="side-s">${groups}</div><div class="side-f"><span>${tools.length} free tools</span><span>No uploads</span></div></aside><div class="shade"></div>`;
}

function page({ title, desc, path: p, body, scripts = '', head = '', activePath }) {
  const full = title.includes(SITE) ? title : `${title} | ${SITE}`;
  return `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="preload" href="/assets/fonts/ibm-plex-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin><title>${esc(full)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${URL_BASE}${p}"><meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta name="theme-color" content="#0e0e0f"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23e8590c'/%3E%3Cpath d='M9 10h14M16 10v13' stroke='white' stroke-width='3.2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E">${themeBoot}<link rel="stylesheet" href="/assets/style.css">${head}</head><body>${sidebar(activePath ?? p)}<div class="wrap"><header class="top"><button class="ib burger" aria-label="Open menu">${ico('menu')}</button><a class="brand" href="/"><span class="logo">${ico('layout-grid', 18)}</span><span class="wm">TailHub</span></a><span class="sp"></span><a class="ib" href="/blog/" aria-label="Blog" title="Blog">${ico('book-open')}</a><button class="ib tt" aria-label="Toggle light / dark mode" title="Toggle light / dark mode"><span class="moon">${ico('moon')}</span><span class="sun">${ico('sun')}</span></button></header><main>${body}</main><footer><span>© ${new Date().getFullYear()} ${SITE}. Free online tools that run in your browser. Your files never leave your device.</span><span><a href="/">Tools</a> · <a href="/blog/">Blog</a></span></footer></div><script src="/assets/site.js"></script>${scripts}</body></html>`;
}

const card = (t) => `<a class="card" href="${toolUrl(t)}" data-q="${esc(keyOf(t))}"><span class="ic">${toolIcon(t)}</span><span><b>${esc(t.title)}</b><span class="d">${esc(t.desc)}</span></span></a>`;

// ------------------------------------------------------------------ tool pages
function toolBody(t) {
  const ui = t.kind === 'ffmpeg' ? ffmpegUI(t) : t.kind === 'tts' ? ttsUI(t) : UI[t.slug]();
  const post = buildPost(t);
  const related = tools.filter((x) => x.category === t.category && x.slug !== t.slug).slice(0, 6);
  const faqs = [
    ['Is this tool free?', `Yes. ${t.title} is completely free, with no sign-up, watermark or usage limit.`],
    ['Are my files or text uploaded anywhere?', t.kind === 'tts' ? 'No. Speech is generated by the voices installed on your device. Your text is not sent to a server.' : t.kind === 'ai' ? 'No. The AI model runs inside your browser, so your files are never uploaded. Only the model itself is downloaded the first time, then cached.' : 'No. Everything runs inside your browser. Nothing is uploaded, so your data stays private.'],
    ...(t.kind === 'ffmpeg' ? [['Why is the first run slow?', 'The first time, your browser downloads the conversion engine (about 30 MB). It is cached afterwards, so later runs start straight away.']] : []),
    ...(t.kind === 'ai' ? [['Why is the first run slow?', 'The first time, your browser downloads the AI model (tens of megabytes). It is cached afterwards, so later runs start straight away. Speed after that depends on your device.']] : []),
    ...(t.kind === 'tts' ? [['Why can I not find a voice?', 'Voices come from your operating system and browser. Install the language in your system speech settings, or try Chrome or Edge.']] : []),
  ];
  const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: t.title, description: t.desc, url: URL_BASE + toolUrl(t), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } };
  return `<div class="crumbs"><a href="/">Home</a> / ${esc(cat[t.category].name)} / ${esc(t.title)}</div>
<div class="th"><span class="ic">${toolIcon(t)}</span><div><h1>${esc(t.title)}</h1></div></div><p class="lead">${esc(t.desc)}</p>
<div class="badges"><span class="badge">${ico('lock', 14)}Runs in your browser</span><span class="badge">${ico('user-x', 14)}No sign-up</span><span class="badge">${ico('badge-check', 14)}Free</span></div>
<section class="panel">${ui}</section>
<section class="sec"><h2>How to use ${esc(t.title)}</h2><ol>${post.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><p><a href="${postUrl(t)}" class="lnk"><b>Read the full guide</b>${ico('arrow-right', 15)}</a></p></section>
<section class="sec"><h2>Frequently asked questions</h2>${faqs.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
<section class="sec"><h2>Related tools</h2><div class="grid">${related.map(card).join('')}</div></section>
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

for (const t of tools) {
  const scripts = [`<script>window.TOOL=${JSON.stringify(t).replace(/</g, '\\u003c')}</script>`];
  if (t.kind === 'ffmpeg') scripts.push('<script type="module" src="/assets/ffmpeg-tool.js"></script>');
  else if (t.kind === 'tts') scripts.push('<script src="/assets/tts.js"></script>');
  else if (t.kind === 'ai') { if (t.slug === 'ocr-image-to-text') scripts.push('<script src="/vendor/tesseract/tesseract.min.js"></script>'); scripts.push('<script src="/assets/ai-tools.js"></script>'); }
  else {
    if (t.slug === 'qr-code-generator') scripts.push('<script src="/vendor/qrcode.js"></script>');
    if (['pdf-merge', 'pdf-split', 'image-to-pdf'].includes(t.slug)) scripts.push('<script src="/vendor/pdf-lib.min.js"></script>');
    scripts.push('<script src="/assets/utils.js"></script><script src="/assets/utils2.js"></script>');
  }
  write(`${t.slug}/index.html`, page({ title: t.title + ' (Free Online)', desc: t.desc, path: toolUrl(t), body: toolBody(t), scripts: scripts.join('') }));
}

// ------------------------------------------------------------------ blog
function postBody(t) {
  const p = buildPost(t), title = postTitle(t);
  const related = tools.filter((x) => x.category === t.category && x.slug !== t.slug).slice(0, 4);
  return `<article class="post"><div class="crumbs"><a href="/">Home</a> / <a href="/blog/">Blog</a> / ${esc(t.title)}</div>
<h1>${esc(title)}</h1><div class="meta">${esc(cat[t.category].name)} · Updated ${DATE} · ${Math.max(2, Math.round((p.about.length + p.steps.join('').length + p.tips.join('').length) / 900))} min read</div>
<p><b>${esc(t.desc)}</b></p>
<div class="tcta"><div><b>${esc(t.title)}</b><br><span style="color:var(--mut)">Free, private, no sign-up.</span></div><a class="btn" href="${toolUrl(t)}">Open the tool</a></div>
<h2>What is it?</h2><p>${esc(p.about)}</p>
<h2>How to use ${esc(t.title)}</h2><ol>${p.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<h2>Tips for better results</h2><ul>${p.tips.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
<h2>Common uses</h2><ul>${p.uses.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
<h2>Is it private?</h2><p>${t.kind === 'tts' ? 'Yes. The speech is produced by voices already installed on your device, so your text is never sent to a server.' : t.kind === 'ai' ? 'Yes. The AI model is downloaded once and then runs inside your browser, so the files you choose never leave your device.' : 'Yes. TailHub tools run entirely in your browser using modern web technology. Your files and text never leave your device, and nothing is stored.'}</p>
<div class="tcta"><div><b>Ready to try it?</b></div><a class="btn" href="${toolUrl(t)}">Use ${esc(t.title)}</a></div>
<h2>More guides</h2><div class="grid">${related.map((r) => `<a class="pcard" href="${postUrl(r)}"><b>${esc(r.title)}</b><span>${esc(r.desc)}</span></a>`).join('')}</div></article>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: title, datePublished: DATE, dateModified: DATE, author: { '@type': 'Organization', name: SITE }, mainEntityOfPage: URL_BASE + postUrl(t) })}</script>`;
}
for (const t of tools) write(`blog/${t.slug}/index.html`, page({ title: postTitle(t), desc: `${t.desc} A short guide with steps, tips and common uses.`, path: postUrl(t), body: postBody(t) }));

const blogIndex = `<div class="hero slim"><h1>The ${SITE} blog</h1><p>Practical, plain-English guides for every tool: what it does, how to use it and how to get the best result.</p></div>${categories.map((c) => `<div class="shead"><div><h2>${catIcon(c)}${esc(c.name)}</h2></div></div><div class="grid">${tools.filter((t) => t.category === c.id).map((t) => `<a class="pcard" href="${postUrl(t)}"><b>${esc(postTitle(t))}</b><span>${esc(t.desc)}</span><small>Read guide</small></a>`).join('')}</div>`).join('')}`;
write('blog/index.html', page({ title: 'Blog: Guides for Free Online Tools', desc: `Guides for all ${tools.length} free ${SITE} tools: converters, text to speech, PDF, image, developer and calculator tools.`, path: '/blog/', body: blogIndex }));

// ------------------------------------------------------------------ landing page
const feat = featured.map((s) => bySlug[s]).filter(Boolean);
const landing = `<section class="hero"><h1>Free online tools that run in your browser.</h1>
<p>${tools.length} tools for converting audio and video, reading text aloud, working with PDFs and images, and everyday calculations. No account, no uploads: your files stay on your device.</p>
<div class="search">${ico('search', 18)}<input id="q" type="search" placeholder="Search ${tools.length} tools, e.g. mp3, pdf, qr, password" autofocus aria-label="Search tools"></div>
<ul class="facts"><li><b>${tools.length}</b> tools</li><li><b>${categories.length}</b> categories</li><li>Free, no sign-up</li><li>Files stay on your device</li></ul></section>
<div class="chips landing-only">${categories.map((c) => `<a class="chip" href="#${c.id}">${catIcon(c)}${esc(c.name)}</a>`).join('')}</div>
<section class="landing-only"><div class="shead"><div><h2>Popular</h2><p>The tools people reach for most.</p></div></div><div class="grid">${feat.map(card).join('')}</div></section>
<section class="landing-only sponsors" id="sponsors"><div class="shead"><div><h2>Sponsors</h2><p>Sponsors help keep TailHub free. <span class="adtag">Ad</span></p></div><a class="lnk" href="https://github.com/s8v4EXnvsb3/tailhub/issues/new?title=Sponsor%20TailHub" rel="noopener"><b>Become a sponsor</b>${ico('arrow-right', 15)}</a></div><div class="sgrid">${[1, 2, 3, 4, 5, 6].map((n) => `<a class="slot" href="https://github.com/s8v4EXnvsb3/tailhub/issues/new?title=Sponsor%20TailHub" rel="noopener sponsored"><span class="sn">0${n}</span>${ico('plus', 18)}<b>Your brand here</b><span>Reach people who use free tools every day</span></a>`).join('')}</div></section>
<p id="none" class="note" hidden style="text-align:center;font-size:17px;padding:40px">No tools match your search.</p>
${categories.map((c) => `<section class="cat" id="${c.id}"><div class="shead"><div><h2>${catIcon(c)}${esc(c.name)}</h2><p>${esc(c.blurb)}</p></div></div><div class="grid">${tools.filter((t) => t.category === c.id).map(card).join('')}</div></section>`).join('')}
<section class="landing-only"><div class="shead"><div><h2>How it works</h2></div></div><div class="steps"><div class="step"><i>01</i><b>Pick a tool</b><p>Use the sidebar or search to find what you need.</p></div><div class="step"><i>02</i><b>Add your file or text</b><p>Drop it in. It is processed by your own browser.</p></div><div class="step"><i>03</i><b>Download the result</b><p>Nothing is uploaded, stored or tracked.</p></div></div></section>
<section class="landing-only"><div class="shead"><div><h2>From the blog</h2><p>Guides for getting the most from each tool.</p></div><a href="/blog/" class="lnk"><b>All guides</b>${ico('arrow-right', 15)}</a></div><div class="grid">${feat.slice(0, 4).map((t) => `<a class="pcard" href="${postUrl(t)}"><b>${esc(postTitle(t))}</b><span>${esc(t.desc)}</span><small>Read guide</small></a>`).join('')}</div></section>
<section class="cta landing-only"><h2>Private by design</h2><p style="color:var(--mut);max-width:560px;margin:0 auto">TailHub runs on your device using WebAssembly and modern browser APIs. There are no accounts, no servers processing your files and no limits.</p></section>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE, url: URL_BASE })}</script>`;
write('index.html', page({ title: `${SITE}: ${tools.length} Free Online Tools That Run in Your Browser`, desc: `${tools.length} free tools: MP3 and video converters, text to speech, PDF and image tools, calculators and developer utilities. Private and no sign-up.`, path: '/', body: landing }));

// ------------------------------------------------------------------ 404, sitemap, robots
write('404.html', page({ title: 'Page not found', desc: 'Page not found', path: '/404/', body: `<div class="hero"><h1>404</h1><p>That page does not exist. Try the sidebar or search.</p><a class="btn" href="/">Back to all tools</a></div>` }));
const urls = ['/', '/blog/', ...tools.flatMap((t) => [toolUrl(t), postUrl(t)])];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${URL_BASE}${u}</loc><lastmod>${DATE}</lastmod></url>`).join('')}</urlset>`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${URL_BASE}/sitemap.xml\n`);
console.log(`Built ${tools.length} tools + ${tools.length} blog posts -> dist/`);
