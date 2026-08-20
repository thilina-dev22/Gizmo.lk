import type { VercelRequest, VercelResponse } from '../src/types/api';
import { getDb } from '../src/lib/db';
import { inMemoryReviews, inMemoryProducts } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { productId } = req.query;

      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: 'Missing productId parameter' });
      }

      try {
        const db = await getDb();
        if (db && typeof db.review?.findMany === 'function') {
          const reviews = await db.review.findMany({
            where: {
              productId,
              isApproved: true,
            },
            orderBy: { createdAt: 'desc' },
          });
          if (reviews && reviews.length > 0) return res.status(200).json({ reviews });
        }
      } catch (e) {}

      const reviews = inMemoryReviews.filter((r) => r.productId === productId && r.isApproved);
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

      try {
        const db = await getDb();
        if (db && typeof db.review?.create === 'function') {
          const review = await db.review.create({
            data: {
              productId,
              authorName: authorName.trim(),
              rating: numRating,
              comment: comment.trim(),
              isApproved: false,
            },
          });
          return res.status(200).json({ success: true, review });
        }
      } catch (e) {}

      const review = {
        id: `rev-${Date.now()}`,
        productId,
        authorName: authorName.trim(),
        rating: numRating,
        comment: comment.trim(),
        isApproved: false,
        createdAt: new Date().toISOString(),
        product: inMemoryProducts.find((p) => p.id === productId),
      };
      inMemoryReviews.unshift(review);
      return res.status(200).json({ success: true, review });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(200).json({ reviews: inMemoryReviews });
  }
}
