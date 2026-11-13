import fs from 'fs'; import path from 'path';
const dist = 'dist', files = []; (function w(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? (f !== 'vendor' && f !== 'assets' && w(p)) : f.endsWith('.html') && files.push(p); } })(dist);
const issues = [], titles = new Map(), descs = new Map(); const urlOf = (f) => { let r = path.relative(dist, f).split(path.sep).join('/'); if (r === '404.html') return '/404/'; return '/' + r.replace('index.html', ''); };
const exists = (u) => { u = u.split('#')[0].split('?')[0]; const q = path.join(dist, u); return fs.existsSync(q) && (!fs.statSync(q).isDirectory() || fs.existsSync(path.join(q, 'index.html'))) || fs.existsSync(path.join(dist, u, 'index.html')); };
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8'), u = urlOf(f), is404 = u === '/404/';
  const t = ((s.match(/<title>(.*?)<\/title>/) || [])[1] || '').split('&amp;').join('&'), d = (s.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (!t || t.length > 70) issues.push([u, 'title length', t.length]); if (!is404 && (d.length < 50 || d.length > 175)) issues.push([u, 'desc length', d.length]);
  (titles.get(t) || titles.set(t, []).get(t)).push(u); (descs.get(d) || descs.set(d, []).get(d)).push(u);
  if ((s.match(/<h1[ >]/g) || []).length !== 1) issues.push([u, 'h1 count']);
  if (!s.includes(`rel="canonical" href="https://tailhub-liard.vercel.app${is404 ? '/404/' : u}"`)) issues.push([u, 'canonical']);
  for (const k of ['og:image', 'twitter:card', 'og:url', 'apple-touch-icon', 'lang="en"']) if (!s.includes(k)) issues.push([u, 'missing ' + k]);
  if ((s.includes('noindex')) !== is404) issues.push([u, 'robots wrong']);
  for (const m of s.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { issues.push([u, 'bad jsonld']); } }
  for (const m of s.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) issues.push([u, 'img no alt']);
  for (const m of s.matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) if (!exists(m[1])) issues.push([u, 'broken link', m[1]]);
}
for (const [k, v] of titles) if (v.length > 1) issues.push(['dup title', k, v.slice(0, 3)]);
for (const [k, v] of descs) if (v.length > 1 && !v.includes('404/')) issues.push(['dup desc', k.slice(0, 50), v.length]);
const sm = fs.readFileSync(dist + '/sitemap.xml', 'utf8'); const locs = [...sm.matchAll(/<loc>https:\/\/tailhub-liard\.vercel\.app([^<]*)<\/loc>/g)].map((m) => m[1]);
for (const f of files) { const u = urlOf(f); if (u !== '/404/' && !locs.includes(u)) issues.push([u, 'not in sitemap']); }
for (const l of locs) if (!exists(l)) issues.push([l, 'sitemap dead']);
console.log('pages', files.length, 'sitemap', locs.length, 'issues', issues.length); console.log(issues.slice(0, 25).map((x) => JSON.stringify(x)).join('\n')); process.exit(issues.length ? 1 : 0);
