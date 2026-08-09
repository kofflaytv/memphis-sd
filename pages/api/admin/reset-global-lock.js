import { verifyToken } from '../../../lib/discord';
import { kv } from '@vercel/kv';

const ADMINS = ['200102286473691139'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.cookies.token;
  const user = verifyToken(token);
  
  if (!user || !ADMINS.includes(user.id)) {
    return res.status(403).json({ error: 'Нет доступа' });
  }

  await kv.del('fib:global:locked');
  await kv.del('fib:global:requests');
  
  res.status(200).json({ success: true, message: 'Сайт разблокирован!' });
}
