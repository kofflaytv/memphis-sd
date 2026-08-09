import { kv } from '@vercel/kv';
import { verifyToken } from '../../lib/discord';

export default async function handler(req, res) {
  const user = verifyToken(req.cookies.token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const today = new Date().toISOString().split('T')[0];
  const [total, todayCount, history] = await Promise.all([
    kv.get('lscsd:stats:total') || 0,
    kv.get(`lscsd:stats:${today}`) || 0,
    kv.lrange(`lscsd:history:${user.id}`, 0, 49)
  ]);

  res.status(200).json({
    total: parseInt(total),
    today: parseInt(todayCount),
    history: history.map(h => { try { return JSON.parse(h); } catch { return h; } })
  });
}
