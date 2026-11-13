const q = document.getElementById('q');
const cards = [...document.querySelectorAll('.card')];
const cats = [...document.querySelectorAll('.cat')];
q.addEventListener('input', () => {
  const v = q.value.trim().toLowerCase();
  cards.forEach((c) => { c.hidden = v && !c.dataset.q.includes(v); });
  cats.forEach((s) => { s.hidden = ![...s.querySelectorAll('.card')].some((c) => !c.hidden); });
  document.getElementById('none').hidden = cats.some((s) => !s.hidden);
});
