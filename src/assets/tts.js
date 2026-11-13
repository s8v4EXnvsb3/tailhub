(() => {
  const T = window.TOOL, $ = (id) => document.getElementById(id);
  const synth = window.speechSynthesis;
  if (!synth) { $('info').textContent = 'Your browser does not support speech synthesis.'; $('info').classList.add('err'); return; }
  let voices = [];
  const langSel = $('lang'), voiceSel = $('voice');
  const curLang = () => (langSel ? langSel.value : T.lang);
  const prefix = () => curLang().split('-')[0].toLowerCase();

  function fill() {
    voices = synth.getVoices();
    { const nm0 = new Intl.DisplayNames(['en'], { type: 'language' }).of(curLang().split(/[-_]/)[0]); document.querySelectorAll('#guide .gl').forEach((e) => (e.textContent = nm0)); }
    const pref = prefix();
    let list = voices.filter((v) => v.lang.toLowerCase().startsWith(pref));
    if (T.lang === 'en-GB' && !langSel) list = voices.filter((v) => v.lang.replace('_', '-').toLowerCase() === 'en-gb');
    voiceSel.innerHTML = '';
    if (!list.length) {
      voiceSel.innerHTML = '<option value="">Default voice</option>';
      const nm = new Intl.DisplayNames(['en'], { type: 'language' }).of(curLang().split(/[-_]/)[0]);
      document.querySelectorAll('#guide .gl').forEach((e) => (e.textContent = nm));
      $('info').textContent = `No ${nm} (${curLang()}) voice is installed on this device. Follow the guide below to add one.`;
      $('info').classList.add('err');
      const g = $('guide'); if (g) g.open = true;
      return;
    }
    $('info').textContent = `${list.length} voice${list.length > 1 ? 's' : ''} available.`; $('info').classList.remove('err');
    list.forEach((v) => { const o = document.createElement('option'); o.value = v.name; o.textContent = `${v.name} (${v.lang})`; voiceSel.appendChild(o); });
  }
  const cp = $('cpset'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText('ms-settings:speech'); cp.textContent = 'Copied'; setTimeout(() => (cp.textContent = 'Copy'), 1200); } catch {} };
  fill(); synth.onvoiceschanged = fill;
  if (langSel) langSel.addEventListener('change', () => { fill(); if (T.samples && T.samples[langSel.value]) $('in').value = T.samples[langSel.value]; });

  $('rate').oninput = (e) => ($('rv').textContent = (+e.target.value).toFixed(1) + 'x');
  $('pitch').oninput = (e) => ($('pv').textContent = (+e.target.value).toFixed(1));

  // Chrome stops long utterances after ~15 s, so speak sentence-sized chunks.
  function chunks(text) { return text.match(/[^.!?।。！？\n]+[.!?।。！？]*\s*/g)?.map((s) => s.trim()).filter(Boolean) || []; }
  $('play').onclick = () => {
    synth.cancel();
    const v = voices.find((x) => x.name === voiceSel.value);
    chunks($('in').value).forEach((s) => {
      const u = new SpeechSynthesisUtterance(s);
      u.lang = v ? v.lang : curLang(); if (v) u.voice = v;
      u.rate = +$('rate').value; u.pitch = +$('pitch').value;
      synth.speak(u);
    });
  };
  $('pause').onclick = () => { if (synth.paused) { synth.resume(); $('pause').textContent = 'Pause'; } else { synth.pause(); $('pause').textContent = 'Resume'; } };
  $('stop').onclick = () => { synth.cancel(); $('pause').textContent = 'Pause'; };
  window.addEventListener('beforeunload', () => synth.cancel());
})();
