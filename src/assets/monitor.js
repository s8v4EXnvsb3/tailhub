/* Error reporting to Sentry. Sends only message, stack, page path and browser.
   Never sends file names or file contents. Off until DSN is set. */
(() => {
  const DSN = 'https://bfcc4230daa064418952610a37ab34a9@o4512424004419584.ingest.de.sentry.io/4512424012218448'; // e.g. https://PUBLICKEY@oNNNN.ingest.sentry.io/PROJECTID
  const m = DSN.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
  if (!m) return;
  const [, key, host, project] = m;
  const url = `https://${host}/api/${project}/envelope/?sentry_key=${key}&sentry_version=7`;
  const seen = new Set();
  let sent = 0;
  const id = () => crypto.randomUUID().replace(/-/g, '');
  function report(type, value, stack) {
    value = String(value || 'unknown').slice(0, 300);
    const k = type + value;
    if (seen.has(k) || sent >= 5) return; // dedupe, cap per page view
    seen.add(k); sent++;
    const frames = String(stack || '').split('\n').slice(0, 15).map((l) => ({ filename: l.trim().replace(/[?#].*$/, '') }));
    const ev = {
      event_id: id(), timestamp: Date.now() / 1000, platform: 'javascript', level: 'error',
      exception: { values: [{ type, value, stacktrace: { frames: frames.reverse() } }] },
      request: { url: location.origin + location.pathname },
      tags: { page: location.pathname },
    };
    const body = JSON.stringify({ event_id: ev.event_id, sent_at: new Date().toISOString() }) + '\n' +
      JSON.stringify({ type: 'event' }) + '\n' + JSON.stringify(ev);
    try { fetch(url, { method: 'POST', body, keepalive: true, mode: 'cors' }).catch(() => {}); } catch (e) {}
  }
  addEventListener('error', (e) => {
    if (e.target && e.target !== window) return; // skip resource load errors
    report('Error', e.message, e.error && e.error.stack);
  });
  addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    report('UnhandledRejection', r && r.message ? r.message : r, r && r.stack);
  });
  window.__reportError = (msg, stack) => report('ToolError', msg, stack);
})();

/* Visit note: once per browser per day, sends only the page path to our own /api/visit. Skips bots and the owner (open any page with ?owner=1 once). */
(() => {
  try {
    if (location.search.includes('owner=1')) localStorage.setItem('th-owner', '1');
    if (localStorage.getItem('th-owner') || navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent) || !/^https:/.test(location.protocol)) return;
    const day = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('th-seen') === day) return;
    localStorage.setItem('th-seen', day);
    fetch('/api/visit/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ p: location.pathname }), keepalive: true }).catch(() => {});
  } catch {}
})();
