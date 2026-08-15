import { verifyToken } from '../../lib/discord';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const user = verifyToken(req.cookies.token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const key = `lscsd:profile:${user.id}`;

  // GET — получить профиль
  if (req.method === 'GET') {
    try {
      const data = await kv.get(key);
      res.status(200).json({ profile: data ? JSON.parse(data) : { fullName: '', department: '' } });
    } catch {
      res.status(200).json({ profile: { fullName: '', department: '' } });
    }
    return;
  }

  // POST — сохранить профиль
  if (req.method === 'POST') {
    const { fullName, department } = req.body;
    const current = await kv.get(key);
    const profile = current ? JSON.parse(current) : {};

    if (fullName !== undefined) profile.fullName = fullName;
    if (department !== undefined) profile.department = department;

    await kv.set(key, JSON.stringify(profile));
    res.status(200).json({ success: true, profile });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
