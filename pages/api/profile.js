import { verifyToken } from '../../lib/discord';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const user = verifyToken(req.cookies.token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const key = `lscsd:profile:${user.id}`;

  if (req.method === 'GET') {
    try {
      const data = await kv.get(key);
      let profile = { fullName: '', department: '' };
      
      if (data) {
        try {
          profile = typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
          profile = { fullName: '', department: '' };
        }
      }
      
      res.status(200).json({ profile });
    } catch (error) {
      res.status(200).json({ profile: { fullName: '', department: '' } });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { fullName, department } = req.body;
      const data = await kv.get(key);
      let profile = { fullName: '', department: '' };
      
      if (data) {
        try {
          profile = typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
          profile = { fullName: '', department: '' };
        }
      }

      if (fullName !== undefined) profile.fullName = fullName;
      if (department !== undefined) profile.department = department;

      await kv.set(key, JSON.stringify(profile));
      res.status(200).json({ success: true, profile });
    } catch (error) {
      console.error('Profile POST error:', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
