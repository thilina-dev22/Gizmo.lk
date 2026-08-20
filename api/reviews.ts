import type { VercelRequest, VercelResponse } from '../src/types/api';
import { sendJson } from '../src/types/api';
import { getDb, reportDbError } from '../src/lib/db';
import { inMemoryReviews, inMemoryProducts } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  try {
    if (req.method === 'GET') {
      const { productId } = req.query || {};

      if (!productId || typeof productId !== 'string') {
        return sendJson(res, 400, { error: 'Missing productId parameter' });
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
          if (reviews && reviews.length > 0) return sendJson(res, 200, { reviews });
        }
      } catch (e) {
        reportDbError(e);
      }

      const reviews = inMemoryReviews.filter((r) => r.productId === productId && r.isApproved);
      return sendJson(res, 200, { reviews });
    }

    if (req.method === 'POST') {
      const { productId, authorName, rating, comment } = req.body || {};

      if (!productId || !authorName || !rating || !comment) {
        return sendJson(res, 400, { error: 'Missing required review fields' });
      }

      const numRating = parseInt(String(rating), 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return sendJson(res, 400, { error: 'Rating must be between 1 and 5' });
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
          return sendJson(res, 200, { success: true, review });
        }
      } catch (e) {
        reportDbError(e);
      }

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
      return sendJson(res, 200, { success: true, review });
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return sendJson(res, 200, { reviews: inMemoryReviews });
  }
}
