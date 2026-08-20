import type { VercelRequest, VercelResponse } from '../types';
import { getDb } from '../../src/lib/db';
import { inMemoryReviews } from '../../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-session');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      try {
        const db = await getDb();
        if (db && typeof db.review?.findMany === 'function') {
          const reviews = await db.review.findMany({
            include: {
              product: {
                select: { id: true, title: true, images: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          if (reviews && reviews.length > 0) return res.status(200).json({ reviews });
        }
      } catch (e) {}

      return res.status(200).json({ reviews: inMemoryReviews });
    }

    if (req.method === 'PATCH') {
      const { reviewId, action } = req.body || {};

      if (!reviewId || !action) {
        return res.status(400).json({ error: 'Missing reviewId or action parameter' });
      }

      const review = inMemoryReviews.find((r) => r.id === reviewId);
      if (review) {
        if (action === 'approve') {
          review.isApproved = true;
        }
      }

      try {
        const db = await getDb();
        if (db && typeof db.review?.update === 'function') {
          if (action === 'approve') {
            await db.review.update({
              where: { id: reviewId },
              data: { isApproved: true },
            });
          } else if (action === 'decline') {
            await db.review.delete({
              where: { id: reviewId },
            });
          }
        }
      } catch (e) {}

      return res.status(200).json({ success: true, status: String(action).toUpperCase() });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(200).json({ reviews: inMemoryReviews });
  }
}
