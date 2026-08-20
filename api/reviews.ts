import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });

  try {
    if (req.method === 'GET') {
      const { productId } = req.query;
      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: 'Missing productId parameter' });
      }
      const reviews = await prisma.review.findMany({
        where: { productId, isApproved: true },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ reviews });
    }

    if (req.method === 'POST') {
      const { productId, authorName, rating, comment } = req.body || {};
      if (!productId || !authorName || !rating || !comment) {
        return res.status(400).json({ error: 'Missing required review fields' });
      }
      const numRating = parseInt(String(rating), 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      const review = await prisma.review.create({
        data: {
          productId,
          authorName: String(authorName).trim(),
          rating: numRating,
          comment: String(comment).trim(),
          isApproved: false,
        },
      });
      return res.status(200).json({ success: true, review });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[api/reviews] Error:', error?.message || error);
    return res.status(500).json({ error: 'Internal server error', detail: error?.message });
  }
}