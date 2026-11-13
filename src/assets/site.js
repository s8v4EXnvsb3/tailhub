(() => {
  const d = document, root = d.documentElement, $ = (s) => d.querySelector(s);
  // theme
  const setTheme = (t) => { root.dataset.theme = t; try { localStorage.setItem('th-theme', t); } catch {} };
  d.querySelectorAll('.tt').forEach((b) => b.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark')));
  // mobile sidebar
  d.querySelectorAll('.burger,.shade').forEach((b) => b.addEventListener('click', () => d.body.classList.toggle('open')));
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') d.body.classList.remove('open'); if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(d.activeElement.tagName)) { e.preventDefault(); $('.sq')?.focus(); } });
  // active link: open its category and scroll it into view
  const cur = $('.side .lk.on');
  if (cur) { cur.closest('details').open = true; cur.scrollIntoView({ block: 'center' }); }
  // sidebar search
  const sq = $('.sq');
  if (sq) sq.addEventListener('input', () => {
    const q = sq.value.trim().toLowerCase();
    d.querySelectorAll('.side details').forEach((det) => {
      let any = 0; det.querySelectorAll('.lk').forEach((a) => { const m = !q || a.dataset.q.includes(q); a.hidden = !m; if (m) any++; });
      det.hidden = !any; if (q) det.open = !!any; else det.open = !!det.querySelector('.lk.on');
    });
  });
  // landing search + category chips
  const hq = $('#q');
  if (hq) {
    const run = () => {
      const q = hq.value.trim().toLowerCase(); let n = 0;
      d.querySelectorAll('.cat').forEach((c) => { let any = 0; c.querySelectorAll('.card').forEach((card) => { const m = !q || card.dataset.q.includes(q); card.hidden = !m; if (m) any++; }); c.hidden = !any; n += any; });
      d.querySelectorAll('.landing-only').forEach((s) => (s.hidden = !!q));
      $('#none').hidden = n > 0;
    };
    hq.addEventListener('input', run);
  }
})();
