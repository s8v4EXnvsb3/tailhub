/* Error reporting to Sentry. Sends only message, stack, page path and browser.
   Never sends file names or file contents. Off until DSN is set. */
(() => {
  const DSN = ''; // e.g. https://PUBLICKEY@oNNNN.ingest.sentry.io/PROJECTID
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
