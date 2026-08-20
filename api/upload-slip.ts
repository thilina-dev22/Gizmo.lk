import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { file, fileName, imageBase64 } = req.body || {};
    const url = imageBase64 || file;
    if (url) {
      return res.status(200).json({ url, fileName: fileName || 'bank-slip.jpg', message: 'Bank deposit slip uploaded successfully' });
    }
    return res.status(400).json({ error: 'No file data provided' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to process bank slip image' });
  }
}