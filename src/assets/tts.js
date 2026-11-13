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
    const pref = prefix();
    let list = voices.filter((v) => v.lang.toLowerCase().startsWith(pref));
    if (T.lang === 'en-GB' && !langSel) list = voices.filter((v) => v.lang.replace('_', '-').toLowerCase() === 'en-gb');
    voiceSel.innerHTML = '';
    if (!list.length) {
      voiceSel.innerHTML = '<option value="">Default voice</option>';
      $('info').textContent = `No ${curLang()} voice is installed on this device. Install one in your OS speech settings, or try Chrome/Edge.`;
      $('info').classList.add('err');
      return;
    }
    $('info').textContent = `${list.length} voice${list.length > 1 ? 's' : ''} available.`; $('info').classList.remove('err');
    list.forEach((v) => { const o = document.createElement('option'); o.value = v.name; o.textContent = `${v.name} (${v.lang})`; voiceSel.appendChild(o); });
  }
  fill(); synth.onvoiceschanged = fill;
  if (langSel) langSel.addEventListener('change', fill);

  $('rate').oninput = (e) => ($('rv').textContent = (+e.target.value).toFixed(1) + '×');
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
