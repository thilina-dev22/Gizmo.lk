import type { VercelRequest, VercelResponse } from '../src/types/api';
import { getDb, ensureTablesExist, reportDbError } from '../src/lib/db';
import { inMemoryProducts } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-session');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { id, slug, search = '', category = '', sort = 'newest', featured } = req.query;

      // Handle single product query if id/slug passed as query
      if (id || slug) {
        const prodId = String(id || slug);
        try {
          const db = await getDb();
          if (db && typeof db.product?.findFirst === 'function') {
            const product = await db.product.findFirst({
              where: { OR: [{ id: prodId }, { slug: prodId }] },
            });
            if (product) return res.status(200).json({ product });
          }
        } catch (e) {
          reportDbError(e);
        }

        const fallback = inMemoryProducts.find((p) => p.id === prodId || p.slug === prodId);
        if (fallback) return res.status(200).json({ product: fallback });
        return res.status(404).json({ error: 'Product not found' });
      }

      // Handle product list
      try {
        await ensureTablesExist();
        const db = await getDb();
        if (db && typeof db.product?.findMany === 'function') {
          const where: any = {};

          if (search && typeof search === 'string') {
            where.OR = [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ];
          }

          if (category && typeof category === 'string' && category !== 'all') {
            const decodedCat = decodeURIComponent(category).toLowerCase();
            let catKeyword = decodedCat;
            if (decodedCat.includes('smartphone') || decodedCat.includes('mobile')) catKeyword = 'smartphone';
            else if (decodedCat.includes('audio') || decodedCat.includes('earbud')) catKeyword = 'audio';
            else if (decodedCat.includes('smartwatch') || decodedCat.includes('band')) catKeyword = 'smartwatch';
            else if (decodedCat.includes('computer') || decodedCat.includes('pc') || decodedCat.includes('accessories')) catKeyword = 'computer';
            else if (decodedCat.includes('car') || decodedCat.includes('gadget')) catKeyword = 'car';

            where.OR = [
              { category: { contains: category, mode: 'insensitive' } },
              { category: { contains: catKeyword, mode: 'insensitive' } },
            ];
          }

          if (featured === 'true') {
            where.isFeatured = true;
          }

          let orderBy: any = { createdAt: 'desc' };
          if (sort === 'price-low') orderBy = { sellingPriceLkr: 'asc' };
          else if (sort === 'price-high') orderBy = { sellingPriceLkr: 'desc' };
          else if (sort === 'bestsellers') orderBy = { isBestSeller: 'desc' };

          const products = await db.product.findMany({ where, orderBy });
          if (products && products.length > 0) {
            res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=60');
            return res.status(200).json({ products });
          }
        }
      } catch (e) {
        reportDbError(e);
      }

      // In-memory filter fallback
      let filtered = [...inMemoryProducts];
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
      }

      if (category && typeof category === 'string' && category !== 'all') {
        const cat = decodeURIComponent(category).toLowerCase();
        filtered = filtered.filter((p) => p.category.toLowerCase().includes(cat));
      }

      if (featured === 'true') {
        filtered = filtered.filter((p) => p.isFeatured);
      }

      if (sort === 'price-low') {
        filtered.sort((a, b) => a.sellingPriceLkr - b.sellingPriceLkr);
      } else if (sort === 'price-high') {
        filtered.sort((a, b) => b.sellingPriceLkr - a.sellingPriceLkr);
      } else if (sort === 'bestsellers') {
        filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
      }

      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=60');
      return res.status(200).json({ products: filtered });
    }

    if (req.method === 'POST') {
      const {
        title,
        category,
        sellingPriceLkr,
        costPriceLkr,
        sku,
        stock,
        images,
        description,
        specs,
        supplierLink,
        supplierNotes,
        isFeatured,
        isBestSeller,
        rating,
        reviewCount,
      } = req.body || {};

      if (!title || !category || !sellingPriceLkr || !sku) {
        return res.status(400).json({ error: 'Missing required product fields' });
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const imagesJson = Array.isArray(images)
        ? JSON.stringify(images)
        : typeof images === 'string'
        ? images
        : JSON.stringify([]);

      const specsJson =
        typeof specs === 'string'
          ? specs
          : typeof specs === 'object'
          ? JSON.stringify(specs)
          : '{}';

      try {
        const db = await getDb();
        if (db && typeof db.product?.upsert === 'function') {
          const product = await db.product.upsert({
            where: { sku },
            update: {
              title,
              slug,
              category,
              sellingPriceLkr: Number(sellingPriceLkr),
              costPriceLkr: Number(costPriceLkr || 0),
              stock: Number(stock || 0),
              images: imagesJson,
              description: description || '',
              specs: specsJson,
              supplierLink: supplierLink || '',
              supplierNotes: supplierNotes || '',
              isFeatured: Boolean(isFeatured),
              isBestSeller: Boolean(isBestSeller),
              rating: Number(rating || 0),
              reviewCount: Number(reviewCount || 0),
            },
            create: {
              title,
              slug,
              category,
              sellingPriceLkr: Number(sellingPriceLkr),
              costPriceLkr: Number(costPriceLkr || 0),
              sku,
              stock: Number(stock || 0),
              images: imagesJson,
              description: description || '',
              specs: specsJson,
              supplierLink: supplierLink || '',
              supplierNotes: supplierNotes || '',
              isFeatured: Boolean(isFeatured),
              isBestSeller: Boolean(isBestSeller),
              rating: Number(rating || 0),
              reviewCount: Number(reviewCount || 0),
            },
          });

          return res.status(200).json({ success: true, product });
        }
      } catch (e) {}

      const newProduct = {
        id: `prod-${Date.now()}`,
        title,
        slug,
        category,
        sellingPriceLkr: Number(sellingPriceLkr),
        costPriceLkr: Number(costPriceLkr || 0),
        sku,
        stock: Number(stock || 0),
        images: imagesJson,
        description: description || '',
        specs: specsJson,
        supplierLink: supplierLink || '',
        supplierNotes: supplierNotes || '',
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        rating: Number(rating || 0),
        reviewCount: Number(reviewCount || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryProducts.unshift(newProduct);
      return res.status(200).json({ success: true, product: newProduct });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(200).json({ products: inMemoryProducts });
  }
}
