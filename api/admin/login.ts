import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body || {};

    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'gizmotek2026admin';
    const token = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_authenticated_admin_session_token_2026';

    if (username === validUsername && password === validPassword) {
      res.setHeader(
        'Set-Cookie',
        `gizmotek_admin_session=${token}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${
          process.env.NODE_ENV === 'production' ? '; Secure' : ''
        }`
      );
      return res.status(200).json({ success: true, token, message: 'Authentication successful' });
    }

    return res.status(401).json({ error: 'Invalid admin credentials' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal login error' });
  }
}
