import type { VercelRequest, VercelResponse } from './types';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    status: 'online',
    service: 'GizmoTek Sri Lanka E-Commerce API',
    timestamp: new Date().toISOString(),
  });
}
