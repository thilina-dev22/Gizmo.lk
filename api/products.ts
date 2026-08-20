import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    if (req.method === 'GET') {
      const { id, slug, search, category, sort, featured } = req.query;

      if (id || slug) {
        const prodId = String(id || slug);
        const product = await prisma.product.findFirst({
          where: { OR: [{ id: prodId }, { slug: prodId }] },
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        return res.status(200).json({ product });
      }

      const where: any = {};

      if (search && typeof search === 'string' && search.trim()) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category && typeof category === 'string' && category !== 'all') {
        where.category = { contains: decodeURIComponent(category), mode: 'insensitive' };
      }

      if (featured === 'true') {
        where.isFeatured = true;
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'price-low') orderBy = { sellingPriceLkr: 'asc' };
      else if (sort === 'price-high') orderBy = { sellingPriceLkr: 'desc' };
      else if (sort === 'bestsellers') orderBy = { isBestSeller: 'desc' };

      const products = await prisma.product.findMany({ where, orderBy });
      return res.status(200).json({ products });
    }

    if (req.method === 'POST') {
      const {
        title, category, sellingPriceLkr, costPriceLkr, sku, stock,
        images, description, specs, supplierLink, supplierNotes,
        isFeatured, isBestSeller, rating, reviewCount,
      } = req.body || {};

      if (!title || !category || !sellingPriceLkr || !sku) {
        return res.status(400).json({ error: 'Missing required product fields' });
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const imagesJson = Array.isArray(images)
        ? JSON.stringify(images)
        : typeof images === 'string' ? images : JSON.stringify([]);

      const specsJson = typeof specs === 'string'
        ? specs
        : typeof specs === 'object' && specs !== null
        ? JSON.stringify(specs)
        : '{}';

      const product = await prisma.product.upsert({
        where: { sku },
        update: {
          title, slug, category,
          sellingPriceLkr: Number(sellingPriceLkr), costPriceLkr: Number(costPriceLkr || 0),
          stock: Number(stock || 0), images: imagesJson, description: description || '',
          specs: specsJson, supplierLink: supplierLink || '', supplierNotes: supplierNotes || '',
          isFeatured: Boolean(isFeatured), isBestSeller: Boolean(isBestSeller),
          rating: Number(rating || 0), reviewCount: Number(reviewCount || 0),
        },
        create: {
          title, slug, category, sku,
          sellingPriceLkr: Number(sellingPriceLkr), costPriceLkr: Number(costPriceLkr || 0),
          stock: Number(stock || 0), images: imagesJson, description: description || '',
          specs: specsJson, supplierLink: supplierLink || '', supplierNotes: supplierNotes || '',
          isFeatured: Boolean(isFeatured), isBestSeller: Boolean(isBestSeller),
          rating: Number(rating || 0), reviewCount: Number(reviewCount || 0),
        },
      });

      return res.status(200).json({ success: true, product });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[api/products] Error:', error?.message || error);
    return res.status(500).json({ error: 'Internal server error', detail: error?.message });
  }
}