import { verifyToken } from '../../../lib/discord';
import { resetSpam } from '../../../lib/antispam';

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

  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'Укажите Discord ID' });
  }

  await resetSpam(userId);
  
  res.status(200).json({ success: true, message: `Спам-лимит для ${userId} сброшен!` });
}
