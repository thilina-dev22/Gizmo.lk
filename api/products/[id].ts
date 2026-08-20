import type { VercelRequest, VercelResponse } from '../types';
import { getDb } from '../../src/lib/db';
import { inMemoryProducts } from '../../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const prodId = String(id || '');

  try {
    const db = await getDb();
    if (db && typeof db.product?.findFirst === 'function') {
      const product = await db.product.findFirst({
        where: { OR: [{ id: prodId }, { slug: prodId }] },
      });
      if (product) return res.status(200).json({ product });
    }
  } catch (error: any) {}

  const fallbackProd = inMemoryProducts.find((p) => p.id === prodId || p.slug === prodId);
  if (fallbackProd) {
    return res.status(200).json({ product: fallbackProd });
  }

  return res.status(404).json({ error: 'Product not found' });
}
