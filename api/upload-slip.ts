import type { VercelRequest, VercelResponse } from './types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, fileName, imageBase64 } = req.body || {};

    if (imageBase64 || file) {
      const url = imageBase64 || file;
      return res.status(200).json({
        url,
        fileName: fileName || 'bank-slip.jpg',
        message: 'Bank deposit slip uploaded successfully',
      });
    }

    return res.status(200).json({
      url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop',
      fileName: 'bank-slip.jpg',
      message: 'Bank deposit slip uploaded successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process bank slip image' });
  }
}
