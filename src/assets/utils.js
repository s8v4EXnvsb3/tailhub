(() => {
  const T = window.TOOL, $ = (id) => document.getElementById(id);
  const copy = () => $('copy') && ($('copy').onclick = async () => { await navigator.clipboard.writeText($('out').value); $('copy').textContent = 'Copied'; setTimeout(() => ($('copy').textContent = 'Copy result'), 1200); });
  const note = (msg, cls = '') => { const i = $('info'); i.textContent = msg; i.className = 'note ' + cls; };
  const dl = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const fmt = (b) => (b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : (b / 1024).toFixed(1) + ' KB');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const wireDrop = (onFiles) => {
    const d = $('drop'), f = $('file');
    d.onclick = (e) => { if (e.target !== f) f.click(); }; f.onchange = () => { onFiles([...f.files]); f.value = ''; };
    ['dragenter', 'dragover'].forEach((e) => d.addEventListener(e, (ev) => { ev.preventDefault(); d.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((e) => d.addEventListener(e, (ev) => { ev.preventDefault(); d.classList.remove('over'); }));
    d.addEventListener('drop', (ev) => onFiles([...ev.dataTransfer.files]));
  };

  const tools = {
    'word-counter'() {
      const run = () => {
        const t = $('in').value, w = (t.trim().match(/\S+/g) || []).length;
        const s = (t.match(/[^.!?]+[.!?]+/g) || (t.trim() ? [t] : [])).length;
        const p = t.split(/\n\s*\n/).filter((x) => x.trim()).length;
        const items = [['Words', w], ['Characters', t.length], ['No spaces', t.replace(/\s/g, '').length], ['Sentences', s], ['Paragraphs', p], ['Reading time', Math.max(w ? 1 : 0, Math.ceil(w / 220)) + ' min']];
        $('stats').innerHTML = items.map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
      };
      $('in').oninput = run; run();
    },
    'case-converter'() {
      const words = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9\u00C0-\u024F]+/).filter(Boolean);
      const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      const map = {
        'UPPER CASE': (s) => s.toUpperCase(), 'lower case': (s) => s.toLowerCase(),
        'Title Case': (s) => s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()),
        'Sentence case': (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()),
        camelCase: (s) => words(s).map((w, i) => (i ? cap(w) : w.toLowerCase())).join(''),
        PascalCase: (s) => words(s).map(cap).join(''),
        snake_case: (s) => words(s).map((w) => w.toLowerCase()).join('_'),
        'kebab-case': (s) => words(s).map((w) => w.toLowerCase()).join('-'),
        'aLtErNaTiNg': (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join(''),
      };
      $('cases').innerHTML = Object.keys(map).map((k) => `<button class="btn ghost">${k}</button>`).join('');
      $('cases').onclick = (e) => { if (e.target.tagName === 'BUTTON') $('out').value = map[e.target.textContent]($('in').value); };
      copy();
    },
    'remove-duplicate-lines'() {
      $('go').onclick = () => {
        let lines = $('in').value.split(/\r?\n/);
        const before = lines.length;
        if ($('trim').checked) lines = lines.map((l) => l.trim());
        if ($('empty').checked) lines = lines.filter((l) => l !== '');
        const seen = new Set(); lines = lines.filter((l) => { const k = $('ci').checked ? l.toLowerCase() : l; if (seen.has(k)) return false; seen.add(k); return true; });
        if ($('sort').checked) lines.sort((a, b) => a.localeCompare(b));
        $('out').value = lines.join('\n'); note(`${before} lines in → ${lines.length} unique lines out.`, 'ok');
      };
      copy();
    },
    'text-diff'() {
      $('go').onclick = () => {
        const a = $('a').value.split(/(\s+)/), b = $('b').value.split(/(\s+)/);
        if (a.length * b.length > 4e6) { $('out').textContent = 'Texts are too long to compare word-by-word here.'; return; }
        const n = a.length, m = b.length, dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
        for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        let i = 0, j = 0, h = '';
        while (i < n && j < m) {
          if (a[i] === b[j]) { h += esc(a[i]); i++; j++; }
          else if (dp[i + 1][j] >= dp[i][j + 1]) { h += `<del>${esc(a[i++])}</del>`; }
          else { h += `<ins>${esc(b[j++])}</ins>`; }
        }
        while (i < n) h += `<del>${esc(a[i++])}</del>`; while (j < m) h += `<ins>${esc(b[j++])}</ins>`;
        $('out').innerHTML = h || 'No text to compare.';
      };
    },
    'lorem-ipsum-generator'() {
      const W = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
      const r = (n) => W[Math.floor(Math.random() * W.length)];
      const sent = () => { const k = 8 + Math.floor(Math.random() * 10); const s = Array.from({ length: k }, r); s[0] = s[0][0].toUpperCase() + s[0].slice(1); return s.join(' ') + '.'; };
      const para = () => Array.from({ length: 4 + Math.floor(Math.random() * 3) }, sent).join(' ');
      $('go').onclick = () => {
        const n = Math.min(100, Math.max(1, +$('n').value || 1)), u = $('unit').value; let out;
        if (u === 'p') out = Array.from({ length: n }, para).join('\n\n');
        else if (u === 's') out = Array.from({ length: n }, sent).join(' ');
        else out = Array.from({ length: n }, (_, i) => ($('classic').checked && i < W.length ? W[i] : r())).join(' ');
        if ($('classic').checked && u === 'w') out = out.charAt(0).toUpperCase() + out.slice(1);
        else if ($('classic').checked) out = 'Lorem ipsum dolor sit amet, ' + out.charAt(0).toLowerCase() + out.slice(1);
        $('out').value = out;
      };
      $('go').click(); copy();
    },
    'json-formatter'() {
      const run = (min) => { try { const o = JSON.parse($('in').value); $('out').value = min ? JSON.stringify(o) : JSON.stringify(o, null, 2); note('Valid JSON', 'ok'); } catch (e) { $('out').value = ''; note('' + e.message, 'err'); } };
      $('pretty').onclick = () => run(false); $('min').onclick = () => run(true);
      $('copy').onclick = async () => { await navigator.clipboard.writeText($('out').value); $('copy').textContent = 'Copied'; setTimeout(() => ($('copy').textContent = 'Copy'), 1200); };
    },
    'base64-encoder-decoder'() {
      $('enc').onclick = () => { const b = new TextEncoder().encode($('in').value); let s = ''; b.forEach((x) => (s += String.fromCharCode(x))); $('out').value = btoa(s); note('Encoded.', 'ok'); };
      $('dec').onclick = () => { try { const s = atob($('in').value.trim().replace(/-/g, '+').replace(/_/g, '/')); $('out').value = new TextDecoder().decode(Uint8Array.from(s, (c) => c.charCodeAt(0))); note('Decoded.', 'ok'); } catch { $('out').value = ''; note('Not valid Base64.', 'err'); } };
      copy();
    },
    'qr-code-generator'() {
      let svg = '';
      const run = () => {
        const txt = $('in').value || ' ';
        const qr = qrcode(0, $('ecc').value); qr.addData(txt); qr.make();
        svg = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
        $('qr').innerHTML = svg;
      };
      ['in', 'ecc'].forEach((i) => ($(i).oninput = run)); run();
      $('svg').onclick = () => dl(new Blob([svg], { type: 'image/svg+xml' }), 'qrcode.svg');
      $('png').onclick = () => {
        const size = +$('size').value, img = new Image();
        img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, size, size); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, size, size); c.toBlob((b) => dl(b, 'qrcode.png')); };
        img.src = 'data:image/svg+xml;base64,' + btoa(svg);
      };
    },
    'image-compressor'() {
      $('qual').oninput = () => ($('qv').textContent = $('qual').value);
      const extOf = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
      wireDrop(async (files) => {
        for (const f of files.filter((x) => x.type.startsWith('image/'))) {
          const row = document.createElement('div'); row.className = 'res'; row.innerHTML = `<div class="m"><b>${esc(f.name)}</b>Working…</div>`; $('results').prepend(row);
          try {
            const bmp = await createImageBitmap(f); const mw = Math.max(16, +$('maxw').value || bmp.width);
            const sc = Math.min(1, mw / bmp.width), w = Math.round(bmp.width * sc), h = Math.round(bmp.height * sc);
            const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
            const type = $('fmt').value; if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
            x.drawImage(bmp, 0, 0, w, h);
            const blob = await new Promise((r) => c.toBlob(r, type, +$('qual').value / 100));
            const got = blob.type || type, fellBack = got !== type; // Firefox/Safari cannot encode WebP and silently return PNG
            const name = f.name.replace(/\.[^.]+$/, '') + '-compressed.' + (extOf[got] || 'png'), url = URL.createObjectURL(blob);
            const pct = Math.round((1 - blob.size / f.size) * 100);
            row.innerHTML = `<img src="${url}" alt=""><div class="m"><b>${esc(name)}</b>${fmt(f.size)} → ${fmt(blob.size)} (${pct >= 0 ? '−' + pct : '+' + -pct}%) · ${w}×${h}${fellBack ? '<br><span class="note">This browser cannot save ' + esc(extOf[type].toUpperCase()) + ', so it saved ' + esc((extOf[got] || 'png').toUpperCase()) + ' instead. Pick JPG for smaller files.</span>' : ''}</div><a class="btn dl" style="padding:8px 14px" download="${esc(name)}" href="${url}">Download</a>`;
          } catch { row.innerHTML = `<div class="m"><b>${esc(f.name)}</b><span class="note err">Could not read this image.</span></div>`; }
        }
      });
    },
    'pdf-merge'() {
      let files = [];
      const render = () => {
        $('list').innerHTML = files.map((f, i) => `<li><span>${i + 1}. ${esc(f.name)} · ${fmt(f.size)}</span><button data-u="${i}">Up</button><button data-d="${i}">Down</button><button data-x="${i}">Remove</button></li>`).join('');
        $('go').disabled = files.length < 2; note(files.length < 2 ? 'Add at least 2 PDFs.' : `${files.length} files ready.`);
      };
      wireDrop((fs) => { files.push(...fs.filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name))); render(); });
      $('list').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
        if (d.x != null) files.splice(+d.x, 1);
        else if (d.u != null && +d.u > 0) [files[+d.u - 1], files[+d.u]] = [files[+d.u], files[+d.u - 1]];
        else if (d.d != null && +d.d < files.length - 1) [files[+d.d + 1], files[+d.d]] = [files[+d.d], files[+d.d + 1]];
        render(); };
      $('go').onclick = async () => {
        $('go').disabled = true; note('Merging…');
        try {
          const out = await PDFLib.PDFDocument.create();
          for (const f of files) { const src = await PDFLib.PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true }); (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p)); }
          const bytes = await out.save(); dl(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf'); note(`Merged ${out.getPageCount()} pages (${fmt(bytes.length)}).`, 'ok');
        } catch (e) { note('Could not merge — one of the files may be corrupted or password-protected.', 'err'); }
        $('go').disabled = files.length < 2;
      };
      render();
    },
  };
  if (tools[T.slug]) tools[T.slug]();
})();
