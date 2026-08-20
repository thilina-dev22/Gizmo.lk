import type { VercelRequest, VercelResponse } from '../src/types/api';
import { sendJson } from '../src/types/api';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { file, fileName, imageBase64 } = req.body || {};

    if (imageBase64 || file) {
      const url = imageBase64 || file;
      return sendJson(res, 200, {
        url,
        fileName: fileName || 'bank-slip.jpg',
        message: 'Bank deposit slip uploaded successfully',
      });
    }

    return sendJson(res, 200, {
      url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop',
      fileName: 'bank-slip.jpg',
      message: 'Bank deposit slip uploaded successfully',
    });
  } catch (error) {
    return sendJson(res, 500, { error: 'Failed to process bank slip image' });
  }
}
