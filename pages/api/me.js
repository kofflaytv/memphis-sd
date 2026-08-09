import { verifyToken } from '../../lib/discord';

export default function handler(req, res) {
  const token = req.cookies.token;
  if (!token) return res.status(200).json({ user: null });
  
  const user = verifyToken(token);
  res.status(200).json({ user: user || null });
}
