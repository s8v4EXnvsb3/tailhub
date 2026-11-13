// Sends a private Telegram note when a new visitor arrives. Sends country, city and page only. No IP, no file data.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(204).end();
  let path = '/';
  try { const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}; path = String(b.p || '/'); } catch {}
  path = path.replace(/[^a-zA-Z0-9/_\-.]/g, '').slice(0, 80) || '/';
  const dec = (v) => { try { return decodeURIComponent(String(v || '')); } catch { return String(v || ''); } };
  const country = dec(req.headers['x-vercel-ip-country']) || '?', city = dec(req.headers['x-vercel-ip-city']) || 'unknown city';
  const text = `TailHub visitor\n${city}, ${country}\n${path}`;
  try { await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text }) }); } catch {}
  res.status(204).end();
}
