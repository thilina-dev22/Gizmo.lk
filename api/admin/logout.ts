import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  res.setHeader('Set-Cookie', 'gizmotek_admin_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}
