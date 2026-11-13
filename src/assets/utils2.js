(() => {
  const T = window.TOOL, $ = (id) => document.getElementById(id);
  const note = (msg, cls = '') => { const i = $('info'); if (i) { i.textContent = msg; i.className = 'note ' + cls; } };
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const dl = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const fmtB = (b) => (b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : (b / 1024).toFixed(1) + ' KB');
  const copyBtn = () => { const b = $('copy'); if (!b) return; b.onclick = async () => { const o = $('out'); await navigator.clipboard.writeText(o.value ?? o.textContent); const t = b.textContent; b.textContent = 'Copied ✓'; setTimeout(() => (b.textContent = t), 1200); }; };
  const wireDrop = (onFiles) => {
    const d = $('drop'), f = $('file');
    d.onclick = () => f.click(); f.onchange = () => { onFiles([...f.files]); f.value = ''; };
    ['dragenter', 'dragover'].forEach((e) => d.addEventListener(e, (ev) => { ev.preventDefault(); d.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((e) => d.addEventListener(e, (ev) => { ev.preventDefault(); d.classList.remove('over'); }));
    d.addEventListener('drop', (ev) => onFiles([...ev.dataTransfer.files]));
  };
  const readDataURL = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  const on = (ids, fn) => ids.forEach((i) => { const e = $(i); e.addEventListener('input', fn); e.addEventListener('change', fn); });

  const tools = {
    'find-and-replace'() {
      $('go').onclick = () => {
        const t = $('in').value, f = $('find').value; if (!f) return note('Enter something to find.', 'err');
        try {
          const flags = 'g' + ($('cs').checked ? '' : 'i');
          const re = $('regex').checked ? new RegExp(f, flags) : new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
          let n = 0; $('out').value = t.replace(re, (...m) => { n++; const rep = $('rep').value; return $('regex').checked ? rep.replace(/\$(\d+|&)/g, (_, k) => (k === '&' ? m[0] : (m[+k] ?? ''))) : rep; });
          note(`${n} replacement${n === 1 ? '' : 's'} made.`, 'ok');
        } catch (e) { note('Invalid pattern: ' + e.message, 'err'); }
      };
      copyBtn();
    },
    'text-sorter'() {
      $('go').onclick = () => {
        let l = $('in').value.split(/\r?\n/); const m = $('mode').value;
        if (m === 'az') l.sort((a, b) => a.localeCompare(b)); else if (m === 'za') l.sort((a, b) => b.localeCompare(a));
        else if (m === 'len') l.sort((a, b) => a.length - b.length);
        else if (m === 'num') l.sort((a, b) => (parseFloat(a.match(/-?\d+(\.\d+)?/)?.[0]) || 0) - (parseFloat(b.match(/-?\d+(\.\d+)?/)?.[0]) || 0));
        else for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
        $('out').value = l.join('\n');
      };
      copyBtn();
    },
    'reverse-text'() {
      const set = (f) => () => ($('out').value = f($('in').value));
      $('rc').onclick = set((s) => [...s].reverse().join(''));
      $('rw').onclick = set((s) => s.split(/(\s+)/).reverse().join(''));
      $('rl').onclick = set((s) => s.split(/\r?\n/).reverse().join('\n'));
      copyBtn();
    },
    'slug-generator'() {
      $('in').oninput = () => ($('out').value = $('in').value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
      copyBtn();
    },
    'morse-code-translator'() {
      const M = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.', '@': '.--.-.', '-': '-....-', ':': '---...', "'": '.----.' };
      const R = Object.fromEntries(Object.entries(M).map(([k, v]) => [v, k]));
      $('enc').onclick = () => { $('out').value = $('in').value.toLowerCase().split('').map((c) => (c === ' ' ? '/' : M[c] || '')).filter(Boolean).join(' '); };
      $('dec').onclick = () => { $('out').value = $('in').value.trim().split(/\s*\/\s*|\s{3,}/).map((w) => w.split(/\s+/).map((c) => R[c] || '').join('')).join(' '); };
      $('play').onclick = () => {
        const code = ($('out').value || $('in').value).replace(/[^.\-/ ]/g, ''); const ac = new (window.AudioContext || window.webkitAudioContext)(); let t = ac.currentTime + 0.05; const u = 0.08;
        for (const ch of code) {
          if (ch === '.' || ch === '-') { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 650; o.connect(g); g.connect(ac.destination); const d = ch === '.' ? u : u * 3; g.gain.setValueAtTime(0.2, t); g.gain.setValueAtTime(0, t + d); o.start(t); o.stop(t + d); t += d + u; }
          else if (ch === ' ') t += u * 2; else if (ch === '/') t += u * 4;
        }
      };
      copyBtn();
    },
    'binary-text-converter'() {
      const pad = { 2: 8, 8: 3, 10: 3, 16: 2 };
      $('enc').onclick = () => { const b = +$('base').value; $('out').value = [...new TextEncoder().encode($('in').value)].map((x) => x.toString(b).toUpperCase().padStart(pad[b], '0')).join(' '); note('Encoded as UTF-8 bytes.', 'ok'); };
      $('dec').onclick = () => { const b = +$('base').value; try { const bytes = $('in').value.trim().split(/[\s,]+/).filter(Boolean).map((x) => { const n = parseInt(x, b); if (isNaN(n) || n > 255) throw 0; return n; }); $('out').value = new TextDecoder().decode(Uint8Array.from(bytes)); note('Decoded.', 'ok'); } catch { note('Could not decode. Check the base and separate values with spaces.', 'err'); } };
      copyBtn();
    },
    'url-encoder-decoder'() {
      const run = (f, ok) => () => { try { $('out').value = f($('in').value); note(ok, 'ok'); } catch { $('out').value = ''; note('Invalid input.', 'err'); } };
      $('ev').onclick = run(encodeURIComponent, 'Encoded as a value.'); $('ef').onclick = run(encodeURI, 'Encoded as a full URL.'); $('dec').onclick = run(decodeURIComponent, 'Decoded.');
      copyBtn();
    },
    'hash-generator'() {
      const algos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
      $('hashes').innerHTML = algos.map((a) => `<div class="hrow"><b>${a}</b><code id="h-${a}"></code><button class="btn ghost" data-a="${a}">Copy</button></div>`).join('');
      const run = async () => { const d = new TextEncoder().encode($('in').value); for (const a of algos) { const h = await crypto.subtle.digest(a, d); $('h-' + a).textContent = [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join(''); } };
      $('in').oninput = run; run();
      $('hashes').onclick = async (e) => { const b = e.target.closest('button'); if (!b) return; await navigator.clipboard.writeText($('h-' + b.dataset.a).textContent); b.textContent = 'Copied ✓'; setTimeout(() => (b.textContent = 'Copy'), 1200); };
    },
    'jwt-decoder'() {
      const dec = (s) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0))));
      $('in').oninput = () => {
        const p = $('in').value.trim().split('.');
        if (p.length < 2 || !p[0]) { $('hdr').textContent = ''; $('pay').textContent = ''; return note('Paste a token with three dot-separated parts.'); }
        try {
          const h = dec(p[0]), b = dec(p[1]); $('hdr').textContent = JSON.stringify(h, null, 2); $('pay').textContent = JSON.stringify(b, null, 2);
          const parts = []; if (b.iat) parts.push('Issued ' + new Date(b.iat * 1000).toLocaleString());
          if (b.exp) parts.push((b.exp * 1000 < Date.now() ? 'EXPIRED ' : 'Expires ') + new Date(b.exp * 1000).toLocaleString());
          note(parts.join(' · ') || 'Decoded. Signature is not verified.', b.exp && b.exp * 1000 < Date.now() ? 'err' : 'ok');
        } catch { $('hdr').textContent = ''; $('pay').textContent = ''; note('This is not a valid JWT.', 'err'); }
      };
    },
    'regex-tester'() {
      const run = () => {
        const t = $('in').value;
        try {
          const f = $('flags').value.replace(/[^dgimsuy]/g, ''); const re = new RegExp($('pat').value, f.includes('g') ? f : f + 'g');
          if (!$('pat').value) { $('out').innerHTML = esc(t); return note('Enter a pattern.'); }
          let h = '', last = 0, n = 0; for (const m of t.matchAll(re)) { if (m[0] === '') { if (re.lastIndex >= t.length) break; continue; } h += esc(t.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>'; last = m.index + m[0].length; n++; if (n > 5000) break; }
          $('out').innerHTML = h + esc(t.slice(last)); note(`${n} match${n === 1 ? '' : 'es'}`, n ? 'ok' : '');
        } catch (e) { $('out').innerHTML = esc(t); note(e.message, 'err'); }
      };
      on(['pat', 'flags', 'in'], run); run();
    },
    'csv-to-json'() {
      const parse = (s, d) => { const rows = []; let r = [], c = '', q = false; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (q) { if (ch === '"') { if (s[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === d) { r.push(c); c = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s[i + 1] === '\n') i++; r.push(c); c = ''; rows.push(r); r = []; } else c += ch; } if (c !== '' || r.length) { r.push(c); rows.push(r); } return rows.filter((x) => x.some((v) => v !== '')); };
      $('go').onclick = () => {
        const d = $('delim').value === '\\t' ? '\t' : $('delim').value; let rows = parse($('in').value, d);
        if (!rows.length) return note('Paste some CSV first.', 'err');
        const cv = (v) => ($('num').checked && v.trim() !== '' && !isNaN(+v) ? +v : v);
        let out; if ($('hdr').checked) { const h = rows.shift(); out = rows.map((r) => Object.fromEntries(h.map((k, i) => [k, cv(r[i] ?? '')]))); } else out = rows.map((r) => r.map(cv));
        $('out').value = JSON.stringify(out, null, 2); note(`${out.length} row${out.length === 1 ? '' : 's'} converted.`, 'ok');
      };
      copyBtn();
    },
    'json-to-csv'() {
      const q = (v) => { if (v == null) return ''; if (typeof v === 'object') v = JSON.stringify(v); v = String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      $('go').onclick = () => {
        try {
          let d = JSON.parse($('in').value); if (!Array.isArray(d)) d = [d]; const keys = [...new Set(d.flatMap((o) => (o && typeof o === 'object' ? Object.keys(o) : [])))];
          $('out').value = [keys.map(q).join(','), ...d.map((o) => keys.map((k) => q(o?.[k])).join(','))].join('\n'); note(`${d.length} row${d.length === 1 ? '' : 's'}, ${keys.length} columns.`, 'ok');
        } catch (e) { $('out').value = ''; note('Invalid JSON: ' + e.message, 'err'); }
      };
      $('dlcsv').onclick = () => $('out').value && dl(new Blob([$('out').value], { type: 'text/csv' }), 'data.csv');
      copyBtn();
    },
    'timestamp-converter'() {
      const show = (ms) => { const d = new Date(ms); if (isNaN(d)) { $('out').innerHTML = '<span class="note err">Invalid date</span>'; return; } $('out').innerHTML = [['Seconds', Math.floor(ms / 1000)], ['Milliseconds', ms], ['ISO 8601', d.toISOString()], ['UTC', d.toUTCString()], ['Local', d.toString()]].map(([k, v]) => `<div class="hrow"><b>${k}</b><code>${esc(String(v))}</code></div>`).join(''); };
      $('ts').oninput = () => { const v = +$('ts').value; if ($('ts').value.trim() && !isNaN(v)) show(Math.abs(v) < 1e11 ? v * 1000 : v); };
      $('dt').oninput = () => $('dt').value && show(new Date($('dt').value).getTime());
      $('now').onclick = () => { $('ts').value = Math.floor(Date.now() / 1000); show(Date.now()); };
      $('now').click();
    },
    'markdown-previewer'() {
      const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      const render = (md) => { const L = md.split(/\r?\n/); let h = '', i = 0; while (i < L.length) { const l = L[i]; let m;
        if (/^```/.test(l)) { let c = ''; i++; while (i < L.length && !/^```/.test(L[i])) c += L[i++] + '\n'; i++; h += `<pre><code>${esc(c)}</code></pre>`; continue; }
        if ((m = l.match(/^(#{1,6})\s+(.*)/))) { h += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; i++; continue; }
        if (/^(-{3,}|\*{3,})\s*$/.test(l)) { h += '<hr>'; i++; continue; }
        if (/^>\s?/.test(l)) { let q = ''; while (i < L.length && /^>\s?/.test(L[i])) q += L[i++].replace(/^>\s?/, '') + ' '; h += `<blockquote>${inline(q)}</blockquote>`; continue; }
        if (/^\s*[-*+]\s+/.test(l)) { h += '<ul>'; while (i < L.length && /^\s*[-*+]\s+/.test(L[i])) h += `<li>${inline(L[i++].replace(/^\s*[-*+]\s+/, ''))}</li>`; h += '</ul>'; continue; }
        if (/^\s*\d+\.\s+/.test(l)) { h += '<ol>'; while (i < L.length && /^\s*\d+\.\s+/.test(L[i])) h += `<li>${inline(L[i++].replace(/^\s*\d+\.\s+/, ''))}</li>`; h += '</ol>'; continue; }
        if (!l.trim()) { i++; continue; }
        let p = ''; while (i < L.length && L[i].trim() && !/^(#{1,6}\s|```|>|\s*[-*+]\s|\s*\d+\.\s)/.test(L[i])) p += L[i++] + ' '; h += `<p>${inline(p.trim())}</p>`; } return h; };
      $('in').oninput = () => ($('out').innerHTML = render($('in').value));
      $('in').value = '# Hello TailHub\n\nWrite **Markdown** here and see it *live*.\n\n- Fast\n- Private\n- Free\n\n> Everything stays in your browser.\n\n```\nconsole.log("hi");\n```'; $('in').oninput();
    },
    'password-generator'() {
      const sets = { up: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lo: 'abcdefghijklmnopqrstuvwxyz', nu: '0123456789', sy: '!@#$%^&*()-_=+[]{};:,.?/' };
      const rnd = (n) => { const a = new Uint32Array(1), lim = Math.floor(2 ** 32 / n) * n; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; };
      const gen = () => {
        $('lv').textContent = $('len').value; const act = Object.keys(sets).filter((k) => $(k).checked); if (!act.length) return note('Select at least one character type.', 'err');
        const n = +$('len').value, pool = act.map((k) => sets[k]).join(''); const out = act.map((k) => sets[k][rnd(sets[k].length)]);
        while (out.length < n) out.push(pool[rnd(pool.length)]); for (let i = out.length - 1; i > 0; i--) { const j = rnd(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
        $('out').value = out.slice(0, n).join(''); const bits = Math.round(n * Math.log2(pool.length)); note(`~${bits} bits of entropy: ${bits < 50 ? 'weak' : bits < 80 ? 'good' : 'very strong'}`, bits < 50 ? 'err' : 'ok');
      };
      $('go').onclick = gen; $('len').oninput = gen; gen(); copyBtn();
    },
    'uuid-generator'() {
      $('go').onclick = () => { const n = Math.min(500, Math.max(1, +$('n').value || 1)); let l = Array.from({ length: n }, () => crypto.randomUUID()); if ($('nh').checked) l = l.map((x) => x.replace(/-/g, '')); if ($('up').checked) l = l.map((x) => x.toUpperCase()); $('out').value = l.join('\n'); };
      $('go').click(); copyBtn();
    },
    'random-number-generator'() {
      const rnd = (n) => { const a = new Uint32Array(1), lim = Math.floor(2 ** 32 / n) * n; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; };
      $('go').onclick = () => {
        let lo = Math.floor(+$('min').value), hi = Math.floor(+$('max').value), n = Math.min(1000, Math.max(1, +$('n').value || 1)); if (lo > hi) [lo, hi] = [hi, lo]; const span = hi - lo + 1;
        if ($('uniq').checked && n > span) return note(`Only ${span} unique numbers exist in this range.`, 'err');
        const out = [], seen = new Set(); while (out.length < n) { const v = lo + rnd(span); if ($('uniq').checked) { if (seen.has(v)) continue; seen.add(v); } out.push(v); }
        $('out').value = out.join(', '); note('', '');
      };
      $('go').click(); copyBtn();
    },
    'unit-converter'() {
      const U = {
        Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254 },
        Weight: { kg: 1, g: 0.001, mg: 1e-6, tonne: 1000, lb: 0.45359237, oz: 0.028349523125, stone: 6.35029318 },
        Volume: { L: 1, mL: 0.001, 'm³': 1000, 'US gal': 3.785411784, 'US cup': 0.2365882365, 'fl oz (US)': 0.0295735296, 'imp gal': 4.54609, tbsp: 0.0147867648, tsp: 0.00492892159 },
        Speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, knot: 0.514444 },
        Area: { 'm²': 1, 'km²': 1e6, 'cm²': 1e-4, hectare: 1e4, acre: 4046.8564224, 'ft²': 0.09290304, 'in²': 0.00064516, 'mi²': 2589988.110336 },
        Data: { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824 },
        Temperature: { '°C': 1, '°F': 1, K: 1 },
      };
      $('cat').innerHTML = Object.keys(U).map((k) => `<option>${k}</option>`).join('');
      const toC = { '°C': (v) => v, '°F': (v) => (v - 32) * 5 / 9, K: (v) => v - 273.15 }, fromC = { '°C': (v) => v, '°F': (v) => v * 9 / 5 + 32, K: (v) => v + 273.15 };
      const fillU = () => { const k = Object.keys(U[$('cat').value]); $('from').innerHTML = $('to').innerHTML = k.map((x) => `<option>${x}</option>`).join(''); $('to').selectedIndex = Math.min(1, k.length - 1); calc(); };
      const calc = () => { const v = parseFloat($('val').value); if (isNaN(v)) { $('out').textContent = '—'; return; } const c = $('cat').value, f = $('from').value, t = $('to').value; const r = c === 'Temperature' ? fromC[t](toC[f](v)) : (v * U[c][f]) / U[c][t]; $('out').textContent = `${v} ${f} = ${+r.toPrecision(10)} ${t}`; };
      $('cat').onchange = fillU; on(['val', 'from', 'to'], calc);
      $('swap').onclick = () => { const a = $('from').value; $('from').value = $('to').value; $('to').value = a; calc(); };
      fillU();
    },
    'percentage-calculator'() {
      const f = (x) => (isFinite(x) ? +x.toPrecision(10) : '—');
      const run = () => {
        $('r1').textContent = f(($('p1a').value * $('p1b').value) / 100);
        $('r2').textContent = $('p2b').value == 0 ? '—' : f(($('p2a').value / $('p2b').value) * 100) + '%';
        const ch = (($('p3b').value - $('p3a').value) / $('p3a').value) * 100; $('r3').textContent = $('p3a').value == 0 ? '—' : (ch > 0 ? '+' : '') + f(ch) + '%';
      };
      on(['p1a', 'p1b', 'p2a', 'p2b', 'p3a', 'p3b'], run); run();
    },
    'age-calculator'() {
      const today = new Date(); $('at').value = today.toISOString().slice(0, 10);
      const run = () => {
        if (!$('dob').value) { $('out').textContent = 'Pick a date of birth.'; return; } const b = new Date($('dob').value + 'T00:00:00'), a = new Date($('at').value + 'T00:00:00');
        if (a < b) { $('out').innerHTML = '<span class="note err">The date of birth is after the chosen date.</span>'; return; }
        let y = a.getFullYear() - b.getFullYear(), m = a.getMonth() - b.getMonth(), d = a.getDate() - b.getDate();
        if (d < 0) { m--; d += new Date(a.getFullYear(), a.getMonth(), 0).getDate(); } if (m < 0) { y--; m += 12; }
        const days = Math.round((a - b) / 864e5); let nb = new Date(a.getFullYear(), b.getMonth(), b.getDate()); if (nb < a) nb = new Date(a.getFullYear() + 1, b.getMonth(), b.getDate());
        $('out').innerHTML = `<div class="stats"><div class="stat"><b>${y}</b><span>Years</span></div><div class="stat"><b>${m}</b><span>Months</span></div><div class="stat"><b>${d}</b><span>Days</span></div><div class="stat"><b>${days.toLocaleString()}</b><span>Total days</span></div><div class="stat"><b>${Math.round((nb - a) / 864e5)}</b><span>Days to next birthday</span></div></div>`;
      };
      on(['dob', 'at'], run); run();
    },
    'bmi-calculator'() {
      const run = () => {
        const imp = $('sys').value === 'imp'; $('hl').textContent = imp ? 'Height (inches)' : 'Height (cm)'; $('wl').textContent = imp ? 'Weight (lb)' : 'Weight (kg)';
        let h = +$('h').value, w = +$('w').value; if (!h || !w) { $('out').textContent = 'Enter height and weight.'; return; }
        const bmi = imp ? (703 * w) / (h * h) : w / ((h / 100) ** 2); const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese';
        $('out').innerHTML = `<div class="stats"><div class="stat"><b>${bmi.toFixed(1)}</b><span>BMI</span></div><div class="stat"><b>${cat}</b><span>WHO category</span></div></div>`;
      };
      on(['sys', 'h', 'w'], run); run();
    },
    'loan-calculator'() {
      const run = () => {
        const P = +$('amt').value, r = +$('rate').value / 1200, n = Math.round(+$('yrs').value * 12); if (!P || !n) { $('out').textContent = 'Enter amount and term.'; return; }
        const m = r ? (P * r) / (1 - (1 + r) ** -n) : P / n, tot = m * n, c = (x) => x.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
        $('out').innerHTML = `<div class="stats"><div class="stat"><b>${c(m)}</b><span>Monthly payment</span></div><div class="stat"><b>${c(tot)}</b><span>Total repaid</span></div><div class="stat"><b>${c(tot - P)}</b><span>Total interest</span></div></div>`;
      };
      on(['amt', 'rate', 'yrs'], run); run();
    },
    'tip-calculator'() {
      const run = () => {
        const b = +$('bill').value, t = +$('tip').value, p = Math.max(1, Math.floor(+$('ppl').value || 1)), tip = (b * t) / 100, c = (x) => x.toFixed(2);
        $('out').innerHTML = `<div class="stats"><div class="stat"><b>${c(tip)}</b><span>Tip</span></div><div class="stat"><b>${c(b + tip)}</b><span>Total</span></div><div class="stat"><b>${c((b + tip) / p)}</b><span>Per person</span></div></div>`;
      };
      on(['bill', 'tip', 'ppl'], run); run();
    },
    'roman-numeral-converter'() {
      const T2 = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      const toR = (n) => T2.reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
      $('num').oninput = () => { const n = +$('num').value; $('rom').value = n >= 1 && n <= 3999 && Number.isInteger(n) ? toR(n) : ''; note(n && (n < 1 || n > 3999) ? 'Use a whole number from 1 to 3999.' : '', 'err'); };
      $('rom').oninput = () => { const s = $('rom').value.toUpperCase().trim(); if (!s) { $('num').value = ''; return; } let n = 0, i = 0; for (const [v, r] of T2) while (s.startsWith(r, i)) { n += v; i += r.length; } if (i === s.length && toR(n) === s) { $('num').value = n; note(''); } else { $('num').value = ''; note('Not a valid Roman numeral.', 'err'); } };
      $('num').oninput();
    },
    'pomodoro-timer'() {
      let phase = 'work', left = 25 * 60, timer = null; const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      const mins = () => (phase === 'work' ? +$('work').value || 25 : +$('brk').value || 5) * 60;
      const draw = () => { $('time').textContent = fmt(left); $('phase').textContent = phase === 'work' ? 'Focus' : 'Break'; document.title = `${fmt(left)} · ${phase === 'work' ? 'Focus' : 'Break'} | TailHub`; };
      const beep = () => { try { const ac = new AudioContext(), o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.frequency.value = 880; g.gain.value = 0.2; o.start(); o.stop(ac.currentTime + 0.6); } catch {} };
      const next = () => { phase = phase === 'work' ? 'break' : 'work'; left = mins(); draw(); };
      $('start').onclick = () => { if (timer) { clearInterval(timer); timer = null; $('start').textContent = 'Start'; return; } $('start').textContent = 'Pause'; const end = Date.now() + left * 1000; timer = setInterval(() => { left = Math.max(0, Math.round((end - Date.now()) / 1000)); draw(); if (!left) { beep(); next(); clearInterval(timer); timer = null; $('start').click(); } }, 250); };
      $('skip').onclick = () => { next(); }; $('reset').onclick = () => { clearInterval(timer); timer = null; $('start').textContent = 'Start'; phase = 'work'; left = mins(); draw(); };
      on(['work', 'brk'], () => { if (!timer) { left = mins(); draw(); } }); draw();
    },
    'image-to-pdf'() {
      let files = [];
      const render = () => { $('list').innerHTML = files.map((f, i) => `<li><span>${i + 1}. ${esc(f.name)} · ${fmtB(f.size)}</span><button data-u="${i}">↑</button><button data-d="${i}">↓</button><button data-x="${i}">✕</button></li>`).join(''); $('go').disabled = !files.length; note(files.length ? `${files.length} image${files.length > 1 ? 's' : ''} ready.` : 'Add at least one image.'); };
      wireDrop((fs) => { files.push(...fs.filter((f) => /^image\/(jpeg|png|webp|gif|bmp)/.test(f.type))); render(); });
      $('list').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; const d = b.dataset; if (d.x != null) files.splice(+d.x, 1); else if (d.u != null && +d.u > 0) [files[+d.u - 1], files[+d.u]] = [files[+d.u], files[+d.u - 1]]; else if (d.d != null && +d.d < files.length - 1) [files[+d.d + 1], files[+d.d]] = [files[+d.d], files[+d.d + 1]]; render(); };
      $('go').onclick = async () => {
        $('go').disabled = true; note('Building PDF…');
        try {
          const pdf = await PDFLib.PDFDocument.create();
          for (const f of files) {
            let bytes, img; const bmp = await createImageBitmap(f);
            if (f.type === 'image/jpeg') { img = await pdf.embedJpg(await f.arrayBuffer()); } else { const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; c.getContext('2d').drawImage(bmp, 0, 0); bytes = await (await new Promise((r) => c.toBlob(r, 'image/png'))).arrayBuffer(); img = await pdf.embedPng(bytes); }
            let [pw, ph] = $('size').value === 'a4' ? [595.28, 841.89] : [img.width, img.height];
            const page = pdf.addPage([pw, ph]), s = Math.min(pw / img.width, ph / img.height), w = img.width * s, h = img.height * s;
            page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
          }
          const out = await pdf.save(); dl(new Blob([out], { type: 'application/pdf' }), 'images.pdf'); note(`✓ Created a ${files.length}-page PDF (${fmtB(out.length)}).`, 'ok');
        } catch (e) { note('Could not build the PDF: ' + e.message, 'err'); }
        $('go').disabled = !files.length;
      };
      render();
    },
    'pdf-split'() {
      let file = null;
      wireDrop((fs) => { file = fs.find((f) => /\.pdf$/i.test(f.name)); if (file) { $('fname').textContent = `${file.name} · ${fmtB(file.size)}`; $('go').disabled = false; note(''); } });
      $('go').onclick = async () => {
        try {
          const src = await PDFLib.PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true }), total = src.getPageCount(), idx = [];
          for (const part of $('pages').value.split(',').map((x) => x.trim()).filter(Boolean)) { const m = part.match(/^(\d*)\s*-\s*(\d*)$/); if (m) { const a = +m[1] || 1, b = +m[2] || total; for (let i = a; i <= Math.min(b, total); i++) idx.push(i - 1); } else if (/^\d+$/.test(part) && +part >= 1 && +part <= total) idx.push(+part - 1); else throw new Error(`"${part}" is not a valid page or range (the PDF has ${total} pages).`); }
          if (!idx.length) throw new Error('Enter at least one page.');
          const out = await PDFLib.PDFDocument.create(); (await out.copyPages(src, idx)).forEach((p) => out.addPage(p));
          const bytes = await out.save(); dl(new Blob([bytes], { type: 'application/pdf' }), file.name.replace(/\.pdf$/i, '') + '-pages.pdf'); note(`✓ Extracted ${idx.length} page${idx.length > 1 ? 's' : ''} from ${total}.`, 'ok');
        } catch (e) { note(e.message, 'err'); }
      };
    },
    'image-to-base64'() {
      let uri = '';
      const show = () => { $('out').value = uri ? ($('raw').checked ? uri.split(',')[1] : uri) : ''; };
      wireDrop(async (fs) => { const f = fs.find((x) => x.type.startsWith('image/')); if (!f) return; uri = await readDataURL(f); $('prev').src = uri; $('prev').hidden = false; show(); note(`${f.name} · ${fmtB(f.size)} → ${fmtB(uri.length)} of text`, 'ok'); });
      $('raw').onchange = show; copyBtn();
    },
    'color-converter'() {
      const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); if (!/^[0-9a-f]{6}$/i.test(h)) return null; return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
      const rgb2hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]; };
      const hsl2rgb = (h, s, l) => { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)].map((x) => Math.round(x * 255)); };
      const toHex = (rgb) => '#' + rgb.map((x) => x.toString(16).padStart(2, '0')).join('');
      const set = (rgb, skip) => { if (skip !== 'hex') $('hex').value = toHex(rgb); if (skip !== 'rgb') $('rgb').value = `rgb(${rgb.join(', ')})`; const [h, s, l] = rgb2hsl(rgb); if (skip !== 'hsl') $('hsl').value = `hsl(${h}, ${s}%, ${l}%)`; $('pick').value = toHex(rgb); $('sw').style.background = toHex(rgb); };
      $('pick').oninput = () => set(hex2rgb($('pick').value));
      $('hex').oninput = () => { const r = hex2rgb($('hex').value.trim()); if (r) set(r, 'hex'); };
      $('rgb').oninput = () => { const m = $('rgb').value.match(/\d+/g); if (m && m.length >= 3 && m.slice(0, 3).every((x) => +x <= 255)) set(m.slice(0, 3).map(Number), 'rgb'); };
      $('hsl').oninput = () => { const m = $('hsl').value.match(/\d+/g); if (m && m.length >= 3 && +m[0] <= 360 && +m[1] <= 100 && +m[2] <= 100) set(hsl2rgb(+m[0], +m[1], +m[2]), 'hsl'); };
      document.querySelectorAll('[data-cp]').forEach((b) => (b.onclick = async () => { await navigator.clipboard.writeText($(b.dataset.cp).value); b.textContent = 'Copied ✓'; setTimeout(() => (b.textContent = 'Copy'), 1200); }));
      set(hex2rgb('#7c5cff'));
    },
    'css-gradient-generator'() {
      const run = () => { const g = $('type').value === 'linear' ? `linear-gradient(${$('ang').value}deg, ${$('c1').value}, ${$('c2').value})` : `radial-gradient(circle, ${$('c1').value}, ${$('c2').value})`; $('av').textContent = $('ang').value + '°'; $('prev').style.background = g; $('out').value = `background: ${g};`; };
      on(['c1', 'c2', 'ang', 'type'], run); run(); copyBtn();
    },
  };
  if (tools[T.slug]) tools[T.slug]();
})();