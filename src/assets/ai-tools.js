// AI tools. Everything runs in the browser. Runtimes are self-hosted under /vendor; only model weights are
// downloaded (once, then cached by the browser). Files you choose are never uploaded.
const T = window.TOOL, $ = (id) => document.getElementById(id);
const note = (msg, cls = '') => { const i = $('info'); i.textContent = msg; i.className = 'note ' + cls; };
const fmtB = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
const dl = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
const base = (f) => f.name.replace(/\.[^.]+$/, '');
const busy = (on) => { document.querySelectorAll('.panel button, .panel select, .panel input').forEach((e) => { if (on) { e.dataset.was = e.disabled ? '1' : ''; e.disabled = true; } else if (e.dataset.was !== undefined) { e.disabled = e.dataset.was === '1'; delete e.dataset.was; } }); };
const bar = (frac, text) => { $('prog').hidden = false; $('bar').style.width = Math.round(Math.max(0, Math.min(1, frac)) * 100) + '%'; $('pt').textContent = text || ''; };
const barOff = () => { $('prog').hidden = true; };
const wireDrop = (onFiles) => {
  const d = $('drop'), f = $('file');
  d.onclick = () => f.click(); f.onchange = () => { onFiles([...f.files]); f.value = ''; };
  ['dragenter', 'dragover'].forEach((e) => d.addEventListener(e, (ev) => { ev.preventDefault(); d.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((e) => d.addEventListener(e, (ev) => { ev.preventDefault(); d.classList.remove('over'); }));
  d.addEventListener('drop', (ev) => onFiles([...ev.dataTransfer.files]));
};
const loadBitmap = async (file, maxSide) => {
  const bm = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, maxSide / Math.max(bm.width, bm.height));
  const c = document.createElement('canvas'); c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
  c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
  return { canvas: c, scaled: k < 1, w: bm.width, h: bm.height };
};
const toBlob = (c, type = 'image/png') => new Promise((r) => c.toBlob(r, type));

// ---------- Transformers.js (loaded on demand)
let tfp;
const tf = () => tfp || (tfp = import('/vendor/transformers/transformers.min.js').then((m) => {
  m.env.allowLocalModels = false;
  m.env.backends.onnx.wasm.wasmPaths = '/vendor/transformers/';
  m.env.backends.onnx.wasm.numThreads = 1; // no cross-origin isolation on static hosting
  m.env.backends.onnx.wasm.proxy = true;   // run inference in a worker so the page stays responsive
  return m;
}));
const dlProgress = (label) => { const files = {}; return (e) => {
  if (e.status === 'progress' && e.total) { files[e.file] = { l: e.loaded, t: e.total }; let l = 0, t = 0; for (const k in files) { l += files[k].l; t += files[k].t; } bar(l / t, `${label}: ${fmtB(l)} of ${fmtB(t)}`); }
  else if (e.status === 'ready') bar(1, 'Model ready');
}; };
const fail = (e) => { barOff(); busy(false); note(/fetch|network|load/i.test(String(e)) ? 'Could not download the model. Check your connection and try again. (' + (e.message || e) + ')' : 'Something went wrong: ' + (e.message || e), 'err'); console.error(e); };

const tools = {
  // ======================================================== OCR
  'ocr-image-to-text'() {
    let file = null, worker = null, wlang = '';
    const run = async () => {
      if (!file) return;
      busy(true); $('out').value = ''; note('');
      try {
        const lang = $('lang').value;
        if (!worker || wlang !== lang) {
          if (worker) { await worker.terminate(); worker = null; }
          bar(0.02, 'Loading OCR engine...');
          const opts = { workerPath: '/vendor/tesseract/worker.min.js', corePath: '/vendor/tesseract/', logger: (m) => { if (m.status) bar(m.progress || 0, m.status.charAt(0).toUpperCase() + m.status.slice(1) + '...'); } };
          if (lang === 'eng') opts.langPath = '/vendor/tesseract/lang';
          worker = await Tesseract.createWorker(lang, 1, opts); wlang = lang;
        }
        const t0 = performance.now();
        const { data } = await worker.recognize(file);
        barOff(); $('out').value = data.text.trim();
        const words = (data.text.match(/\S+/g) || []).length;
        note(words ? `${words} words read, ${Math.round(data.confidence)}% average confidence, ${((performance.now() - t0) / 1000).toFixed(1)} s.` : 'No text found. Try a sharper, higher-contrast image or another language.', words ? 'ok' : 'err');
      } catch (e) { fail(e); worker = null; }
      busy(false); $('go').disabled = !file;
    };
    wireDrop((fs) => { const f = fs.find((x) => x.type.startsWith('image/')); if (!f) return note('Choose an image file (JPG, PNG, WebP, BMP).', 'err'); file = f; $('prev').src = URL.createObjectURL(f); $('prev').hidden = false; run(); });
    $('go').onclick = run; $('lang').onchange = run;
    $('copy').onclick = async () => { await navigator.clipboard.writeText($('out').value); $('copy').textContent = 'Copied'; setTimeout(() => ($('copy').textContent = 'Copy text'), 1200); };
    $('txt').onclick = () => $('out').value && dl(new Blob([$('out').value], { type: 'text/plain' }), base(file || { name: 'ocr' }) + '.txt');
  },

  // ======================================================== Background remover
  'background-remover'() {
    let model, proc, res = null, name = 'image';
    const paint = () => {
      if (!res) return;
      const c = $('cv'); c.width = res.width; c.height = res.height; const x = c.getContext('2d');
      const bg = $('bgc').value; if (bg !== 'none') { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
      x.drawImage(res, 0, 0); c.classList.toggle('checker', bg === 'none');
    };
    const run = async (f) => {
      busy(true); $('result').hidden = true; note('');
      try {
        const m = await tf(); bar(0.01, 'Loading model...');
        if (!model) { model = await m.AutoModel.from_pretrained('Xenova/modnet', { dtype: 'q8', device: 'wasm', progress_callback: dlProgress('Downloading model') }); proc = await m.AutoProcessor.from_pretrained('Xenova/modnet'); }
        bar(0.6, 'Removing background...'); await new Promise((r) => setTimeout(r, 30));
        const { canvas, scaled, w, h } = await loadBitmap(f, 2048);
        const img = await m.RawImage.fromCanvas(canvas);
        const { pixel_values } = await proc(img);
        const { output } = await model({ input: pixel_values });
        const mask = await m.RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(canvas.width, canvas.height);
        const x = canvas.getContext('2d'), id = x.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0, n = canvas.width * canvas.height; i < n; i++) id.data[i * 4 + 3] = mask.data[i];
        x.putImageData(id, 0, 0); res = canvas; name = base(f); paint(); $('result').hidden = false; barOff();
        note(`Done${scaled ? ` (image reduced from ${w}x${h} to ${canvas.width}x${canvas.height})` : ''}. Pick a background and download.`, 'ok');
      } catch (e) { fail(e); }
      busy(false);
    };
    wireDrop((fs) => { const f = fs.find((x) => x.type.startsWith('image/')); if (f) run(f); else note('Choose an image file.', 'err'); });
    $('bgc').onchange = paint;
    $('dl').onclick = async () => dl(await toBlob($('cv')), name + '-no-bg.png');
  },

  // ======================================================== Speech to text
  'speech-to-text'() {
    let asr = null, amodel = '', chunks = [], name = 'transcript';
    const LANG = { en: 'english', es: 'spanish', fr: 'french', de: 'german', it: 'italian', pt: 'portuguese', ru: 'russian', ar: 'arabic', hi: 'hindi', zh: 'chinese', ja: 'japanese', ko: 'korean', ms: 'malay', id: 'indonesian', tr: 'turkish', vi: 'vietnamese', nl: 'dutch', pl: 'polish' };
    const ts = (s, comma) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(h)}:${p(m)}:${p(Math.floor(x))}${comma ? ',' : '.'}${p(Math.round((x % 1) * 1000), 3)}`; };
    const render = () => {
      const f = $('fmt').value; const cs = chunks.filter((c) => c.text.trim());
      $('out').value = f === 'txt' ? cs.map((c) => c.text.trim()).join(' ')
        : f === 'srt' ? cs.map((c, i) => `${i + 1}\n${ts(c.start, true)} --> ${ts(c.end, true)}\n${c.text.trim()}\n`).join('\n')
        : 'WEBVTT\n\n' + cs.map((c) => `${ts(c.start)} --> ${ts(c.end)}\n${c.text.trim()}\n`).join('\n');
    };
    const run = async (f) => {
      busy(true); $('out').value = ''; chunks = []; note('');
      try {
        bar(0.02, 'Reading audio...');
        const ac = new AudioContext({ sampleRate: 16000 });
        let au; try { au = await ac.decodeAudioData(await f.arrayBuffer()); } catch { throw new Error('This file has no audio the browser can decode. Try MP3, WAV, M4A, OGG or MP4.'); }
        const n = au.length, data = new Float32Array(n); for (let c = 0; c < au.numberOfChannels; c++) { const ch = au.getChannelData(c); for (let i = 0; i < n; i++) data[i] += ch[i] / au.numberOfChannels; }
        const dur = au.duration; ac.close();
        const m = await tf(), model = $('model').value;
        if (!asr || amodel !== model) { asr = await m.pipeline('automatic-speech-recognition', model, { dtype: 'q8', device: 'wasm', progress_callback: dlProgress('Downloading model') }); amodel = model; }
        const t0 = performance.now(); bar(0.9, `Transcribing ${Math.round(dur)} s of audio. Keep this tab open...`); await new Promise((r) => setTimeout(r, 30));
        const lang = $('lang').value, o = { return_timestamps: true, chunk_length_s: 30, stride_length_s: 5, task: $('tr').checked ? 'translate' : 'transcribe' };
        if (lang !== 'auto') o.language = LANG[lang];
        const r = await asr(data, o);
        chunks = (r.chunks || [{ timestamp: [0, dur], text: r.text }]).map((c) => ({ start: c.timestamp[0] || 0, end: c.timestamp[1] == null ? dur : c.timestamp[1], text: c.text }));
        name = base(f); render(); barOff();
        note(`Transcribed ${Math.round(dur)} s of audio in ${((performance.now() - t0) / 1000).toFixed(1)} s.`, 'ok');
      } catch (e) { fail(e); }
      busy(false);
    };
    if ((navigator.deviceMemory && navigator.deviceMemory <= 4) || /Mobi|Android/i.test(navigator.userAgent)) $('model').value = 'Xenova/whisper-tiny'; // smaller download and memory on phones
    wireDrop((fs) => { const f = fs.find((x) => /^(audio|video)\//.test(x.type) || /\.(mp3|wav|m4a|aac|ogg|opus|flac|mp4|webm|mov)$/i.test(x.name)); if (f) run(f); else note('Choose an audio or video file.', 'err'); });
    $('fmt').onchange = render;
    $('copy').onclick = async () => { await navigator.clipboard.writeText($('out').value); $('copy').textContent = 'Copied'; setTimeout(() => ($('copy').textContent = 'Copy'), 1200); };
    $('dl').onclick = () => $('out').value && dl(new Blob([$('out').value], { type: 'text/plain' }), name + '.' + $('fmt').value);
  },

  // ======================================================== Face blur
  'blur-faces'() {
    let det, orig = null, faces = [], name = 'image';
    const draw = () => {
      if (!orig) return;
      const c = $('cv'); c.width = orig.width; c.height = orig.height; const x = c.getContext('2d'); x.drawImage(orig, 0, 0);
      const style = $('style').value, k = +$('str').value / 50;
      for (const b of faces) {
        const px = b.originX - b.width * 0.15, py = b.originY - b.height * 0.25, w = b.width * 1.3, h = b.height * 1.5;
        x.save(); x.beginPath(); x.ellipse(px + w / 2, py + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); x.clip();
        if (style === 'blur') { x.filter = `blur(${Math.max(4, b.width * 0.12 * k)}px)`; x.drawImage(orig, 0, 0); }
        else if (style === 'pixel') { const s = Math.max(4, Math.round((b.width / 10) * k)); const t = document.createElement('canvas'); t.width = Math.max(1, Math.ceil(w / s)); t.height = Math.max(1, Math.ceil(h / s)); t.getContext('2d').drawImage(orig, px, py, w, h, 0, 0, t.width, t.height); x.imageSmoothingEnabled = false; x.drawImage(t, 0, 0, t.width, t.height, px, py, t.width * s, t.height * s); }
        else { x.fillStyle = '#000'; x.fillRect(px, py, w, h); }
        x.restore();
      }
    };
    const run = async (f) => {
      busy(true); $('result').hidden = true; note('');
      try {
        bar(0.1, 'Loading face detector...');
        if (!det) { const v = await import('/vendor/mediapipe/vision_bundle.mjs'); const fs = await v.FilesetResolver.forVisionTasks('/vendor/mediapipe/wasm'); det = await v.FaceDetector.createFromOptions(fs, { baseOptions: { modelAssetPath: '/vendor/mediapipe/blaze_face_short_range.tflite' }, runningMode: 'IMAGE', minDetectionConfidence: 0.4 }); }
        bar(0.7, 'Finding faces...');
        const { canvas, scaled, w, h } = await loadBitmap(f, 2400); orig = canvas; name = base(f);
        faces = det.detect(canvas).detections.map((d) => d.boundingBox);
        draw(); $('result').hidden = false; barOff();
        note(faces.length ? `Blurred ${faces.length} face${faces.length > 1 ? 's' : ''}${scaled ? ` (image reduced from ${w}x${h})` : ''}. Nothing was uploaded.` : 'No faces found. The detector works best on faces that are front-facing and not tiny.', faces.length ? 'ok' : 'err');
      } catch (e) { fail(e); }
      busy(false);
    };
    wireDrop((fs) => { const f = fs.find((x) => x.type.startsWith('image/')); if (f) run(f); else note('Choose an image file.', 'err'); });
    $('style').onchange = draw; $('str').oninput = draw;
    $('dl').onclick = async () => dl(await toBlob($('cv')), name + '-blurred.png');
  },

  // ======================================================== Upscaler
  'image-upscaler'() {
    let up, name = 'image';
    const MAX = 384;
    const run = async (f) => {
      busy(true); $('result').hidden = true; note('');
      try {
        const m = await tf(); bar(0.01, 'Loading model...');
        if (!up) up = await m.pipeline('image-to-image', 'Xenova/swin2SR-classical-sr-x2-64', { dtype: 'q8', device: 'wasm', progress_callback: dlProgress('Downloading model') });
        const { canvas, scaled, w, h } = await loadBitmap(f, MAX); name = base(f);
        bar(0.7, `Upscaling ${canvas.width}x${canvas.height} to ${canvas.width * 2}x${canvas.height * 2}. This can take a while...`); await new Promise((r) => setTimeout(r, 30));
        const t0 = performance.now(), out = await up(await m.RawImage.fromCanvas(canvas));
        const W = canvas.width * 2, H = canvas.height * 2; // the model pads to a multiple of 8, so crop back to exactly 2x
        const c = $('after'); c.width = W; c.height = H; const id = new ImageData(W, H), ch = out.channels;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (y * out.width + x) * ch, d = (y * W + x) * 4; id.data[d] = out.data[s]; id.data[d + 1] = out.data[s + 1]; id.data[d + 2] = out.data[s + 2]; id.data[d + 3] = 255; }
        c.getContext('2d').putImageData(id, 0, 0);
        const b = $('before'); b.width = canvas.width; b.height = canvas.height; b.getContext('2d').drawImage(canvas, 0, 0);
        $('result').hidden = false; barOff();
        note(`${canvas.width}x${canvas.height} to ${W}x${H} in ${((performance.now() - t0) / 1000).toFixed(1)} s.${scaled ? ` Your ${w}x${h} image was reduced to fit the ${MAX}px limit first.` : ''}`, 'ok');
      } catch (e) { fail(e); }
      busy(false);
    };
    wireDrop((fs) => { const f = fs.find((x) => x.type.startsWith('image/')); if (f) run(f); else note('Choose an image file.', 'err'); });
    $('dl').onclick = async () => dl(await toBlob($('after')), name + '-2x.png');
  },
};
(tools[T.slug] || (() => {}))();
window.__aiReady = true;
