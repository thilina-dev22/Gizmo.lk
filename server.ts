import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDb, ensureTablesExist } from './src/lib/db';
import {
  PAYHERE_MERCHANT_ID,
  PAYHERE_CHECKOUT_URL,
  generatePayHereHash,
  verifyPayHereNotification,
} from './src/lib/payhere';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

import { inMemoryProducts, inMemoryOrders, inMemoryReviews } from './src/data/mockData';

// Global Express Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Multer memory storage for bank slip uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Admin Authentication Middleware
const adminAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_authenticated_admin_session_token_2026';
  const adminSession = req.cookies?.gizmotek_admin_session || req.headers['x-admin-session'];

  if (!adminSession || adminSession !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized access. Admin authentication required.' });
  }
  next();
};

// Create an isolated router for API endpoints
const apiRouter = express.Router();

// ==========================================
// 1. PRODUCTS API
// ==========================================

// GET /products
apiRouter.get('/products', async (req, res) => {
  const { search = '', category = '', sort = 'newest', featured } = req.query;

  try {
    await ensureTablesExist();
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
    if (sort === 'price-low') {
      orderBy = { sellingPriceLkr: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { sellingPriceLkr: 'desc' };
    } else if (sort === 'bestsellers') {
      orderBy = { isBestSeller: 'desc' };
    }

    const db = await getDb();
    if (db && typeof db.product?.findMany === 'function') {
      const products = await db.product.findMany({
        where,
        orderBy,
      });

      if (products.length > 0) {
        res.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=30');
        return res.json({ products });
      }
    }
  } catch (error: any) {
    // Graceful fallback to in-memory catalog
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

  return res.json({ products: filtered });
});

// GET /products/:id
apiRouter.get('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    if (db && typeof db.product?.findUnique === 'function') {
      const product = await db.product.findUnique({
        where: { id },
      });
      if (product) {
        return res.json({ product });
      }
    }
  } catch (error: any) {}

  const fallbackProd = inMemoryProducts.find((p) => p.id === id || p.slug === id);
  if (fallbackProd) {
    return res.json({ product: fallbackProd });
  }

  return res.status(404).json({ error: 'Product not found' });
});

// POST /products (Admin create/edit)
apiRouter.post('/products', async (req, res) => {
  try {
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
    } = req.body;

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

        return res.json({ success: true, product });
      }
    } catch (dbErr) {}

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
    return res.json({ success: true, product: newProduct });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to save product' });
  }
});

// ==========================================
// 2. ORDERS API
// ==========================================

// GET /orders
apiRouter.get('/orders', async (req, res) => {
  try {
    const { status, id, orderNumber } = req.query;

    if (id || orderNumber) {
      try {
        const db = await getDb();
        if (db && typeof db.order?.findFirst === 'function') {
          const order = await db.order.findFirst({
            where: {
              OR: [
                { id: typeof id === 'string' ? id : undefined },
                { orderNumber: typeof orderNumber === 'string' ? orderNumber : undefined },
              ],
            },
            include: {
              items: {
                include: { product: true },
              },
            },
          });
          if (order) return res.json({ order });
        }
      } catch (e) {}

      const found = inMemoryOrders.find((o) => o.id === id || o.orderNumber === (orderNumber || id));
      return res.json({ order: found || inMemoryOrders[0] });
    }

    try {
      const where: any = {};
      if (status && status !== 'ALL' && typeof status === 'string') {
        where.orderStatus = status;
      }

      const db = await getDb();
      if (db && typeof db.order?.findMany === 'function') {
        const orders = await db.order.findMany({
          where,
          include: {
            items: {
              include: { product: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (orders.length > 0) return res.json({ orders });
      }
    } catch (e) {}

    let filtered = [...inMemoryOrders];
    if (status && status !== 'ALL') {
      filtered = filtered.filter((o) => o.orderStatus === status);
    }
    return res.json({ orders: filtered });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /orders
apiRouter.post('/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      address,
      district,
      city,
      paymentMethod,
      bankSlipUrl,
      items,
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !address || !district || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required order information' });
    }

    let subtotalLkr = 0;
    const itemsData: any[] = [];
    const db = await getDb();

    for (const item of items) {
      let product = inMemoryProducts.find((p) => p.id === item.productId);
      try {
        if (db && typeof db.product?.findUnique === 'function') {
          const dbProd = await db.product.findUnique({ where: { id: item.productId } });
          if (dbProd) product = dbProd as any;
        }
      } catch (e) {}

      const unitPrice = product ? product.sellingPriceLkr : 5000;
      subtotalLkr += unitPrice * item.quantity;
      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        product,
      });
    }

    const isMetro = district === 'Colombo' || district === 'Gampaha';
    const isFreeShipping = subtotalLkr >= 15000;
    const shippingFeeLkr = isFreeShipping ? 0 : isMetro ? 350 : 500;
    const totalLkr = subtotalLkr + shippingFeeLkr;

    const orderNumber = `GZ-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      address,
      district,
      city,
      paymentMethod,
      paymentStatus: paymentMethod === 'PAYHERE' ? 'PENDING' : 'UNPAID',
      orderStatus: 'PENDING',
      bankSlipUrl: bankSlipUrl || null,
      subtotalLkr,
      shippingFeeLkr,
      totalLkr,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      items: itemsData,
    };

    try {
      if (db && typeof db.order?.create === 'function') {
        const createdOrder = await db.order.create({
          data: {
            orderNumber,
            customerName,
            customerPhone,
            customerEmail: customerEmail || null,
            address,
            district,
            city,
            paymentMethod,
            paymentStatus: newOrder.paymentStatus,
            orderStatus: newOrder.orderStatus,
            bankSlipUrl: bankSlipUrl || null,
            subtotalLkr,
            shippingFeeLkr,
            totalLkr,
            notes: notes || null,
            items: {
              create: itemsData.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            },
          },
          include: {
            items: {
              include: { product: true },
            },
          },
        });
        inMemoryOrders.unshift(createdOrder);
        return res.json({ success: true, order: createdOrder });
      }
    } catch (e) {}

    inMemoryOrders.unshift(newOrder);
    return res.json({ success: true, order: newOrder });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to submit order' });
  }
});

// PATCH /orders
apiRouter.patch('/orders', async (req, res) => {
  try {
    const { orderId, orderStatus, paymentStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter' });
    }

    const dataToUpdate: any = {};
    if (orderStatus) dataToUpdate.orderStatus = orderStatus;
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

    try {
      const db = await getDb();
      if (db && typeof db.order?.update === 'function') {
        const updatedOrder = await db.order.update({
          where: { id: orderId },
          data: dataToUpdate,
        });
        return res.json({ success: true, order: updatedOrder });
      }
    } catch (e) {}

    const order = inMemoryOrders.find((o) => o.id === orderId);
    if (order) {
      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
    }
    return res.json({ success: true, order });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to update order status' });
  }
});

// ==========================================
// 3. REVIEWS API
// ==========================================

// GET /reviews
apiRouter.get('/reviews', async (req, res) => {
  try {
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
        if (reviews.length > 0) return res.json({ reviews });
      }
    } catch (e) {}

    const reviews = inMemoryReviews.filter((r) => r.productId === productId && r.isApproved);
    return res.json({ reviews });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch reviews' });
  }
});

// POST /reviews
apiRouter.post('/reviews', async (req, res) => {
  try {
    const { productId, authorName, rating, comment } = req.body;

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
        return res.json({ success: true, review });
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
    return res.json({ success: true, review });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to submit review' });
  }
});

// ==========================================
// 4. ADMIN AUTH & REVIEWS MODERATION
// ==========================================

// POST /admin/login
apiRouter.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;

    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'gizmotek2026admin';
    const token = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_authenticated_admin_session_token_2026';

    if (username === validUsername && password === validPassword) {
      res.cookie('gizmotek_admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      return res.json({ success: true, message: 'Authentication successful' });
    }

    return res.status(401).json({ error: 'Invalid admin credentials' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal login error' });
  }
});

// POST /admin/logout
apiRouter.post('/admin/logout', (req, res) => {
  res.clearCookie('gizmotek_admin_session', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /admin/reviews
apiRouter.get('/admin/reviews', async (req, res) => {
  try {
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
        if (reviews.length > 0) return res.json({ reviews });
      }
    } catch (e) {}

    return res.json({ reviews: inMemoryReviews });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch admin reviews' });
  }
});

// PATCH /admin/reviews
apiRouter.patch('/admin/reviews', async (req, res) => {
  try {
    const { reviewId, action } = req.body;

    if (!reviewId || !action) {
      return res.status(400).json({ error: 'Missing reviewId or action parameter' });
    }

    const review = inMemoryReviews.find((r) => r.id === reviewId);
    if (review) {
      if (action === 'approve') {
        review.isApproved = true;
      } else if (action === 'decline') {
        inMemoryReviews = inMemoryReviews.filter((r) => r.id !== reviewId);
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

    return res.json({ success: true, status: action.toUpperCase() });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to process review action' });
  }
});

// GET /admin/export-orders (CSV Download)
apiRouter.get('/admin/export-orders', async (req, res) => {
  try {
    let ordersList = inMemoryOrders;
    try {
      const db = await getDb();
      if (db && typeof db.order?.findMany === 'function') {
        const dbOrders = await db.order.findMany({
          include: {
            items: {
              include: { product: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (dbOrders.length > 0) ordersList = dbOrders as any;
      }
    } catch (e) {}

    const csvRows: string[] = [];
    csvRows.push(
      [
        'Waybill/Order No',
        'Receiver Name',
        'Receiver Contact',
        'Delivery Address',
        'District',
        'City',
        'COD Amount LKR',
        'Payment Method',
        'Order Status',
        'Payment Status',
        'Items Description',
        'Order Date',
        'Courier Remarks',
      ].join(',')
    );

    for (const o of ordersList) {
      const codAmount = o.paymentMethod === 'COD' ? o.totalLkr : 0;
      const itemsDesc = o.items
        ? o.items.map((i: any) => `${i.product?.title || 'Gadget'} (x${i.quantity})`).join(' | ')
        : 'Tech Gadgets';

      const escapeCsv = (val: string | number | null | undefined) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      csvRows.push(
        [
          escapeCsv(o.orderNumber),
          escapeCsv(o.customerName),
          escapeCsv(o.customerPhone),
          escapeCsv(o.address),
          escapeCsv(o.district),
          escapeCsv(o.city),
          escapeCsv(codAmount),
          escapeCsv(o.paymentMethod),
          escapeCsv(o.orderStatus),
          escapeCsv(o.paymentStatus),
          escapeCsv(itemsDesc),
          escapeCsv(new Date(o.createdAt).toLocaleDateString('en-LK')),
          escapeCsv(o.notes || 'Handle with care - Fragile Electronics'),
        ].join(',')
      );
    }

    const csvData = csvRows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=GizmoTek_Orders_${Date.now()}.csv`);
    return res.send(csvData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to export orders CSV' });
  }
});

// ==========================================
// 5. PAYHERE PAYMENT GATEWAY API
// ==========================================

// POST /payhere/hash
apiRouter.post('/payhere/hash', (req, res) => {
  try {
    const {
      orderId,
      orderNumber,
      totalLkr,
      customerName,
      customerPhone,
      customerEmail,
      address,
      city,
      itemsSummary,
    } = req.body;

    if (!orderId || !totalLkr) {
      return res.status(400).json({ error: 'Missing orderId or totalLkr' });
    }

    const nameParts = (customerName || 'Valued Customer').trim().split(' ');
    const firstName = nameParts[0] || 'Valued';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    const hash = generatePayHereHash(
      PAYHERE_MERCHANT_ID,
      orderId,
      Number(totalLkr),
      'LKR'
    );

    const origin = req.headers.origin || 'http://localhost:5173';

    const payherePayload = {
      actionUrl: PAYHERE_CHECKOUT_URL,
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: `${origin}/checkout/success?orderId=${orderId}`,
      cancel_url: `${origin}/checkout`,
      notify_url: `${origin}/api/payhere/notify`,
      order_id: orderId,
      items: itemsSummary || `GizmoTek.lk Order #${orderNumber}`,
      currency: 'LKR',
      amount: Number(totalLkr).toFixed(2),
      first_name: firstName,
      last_name: lastName,
      email: customerEmail || 'customer@gizmotek.lk',
      phone: customerPhone || '0771234567',
      address: address || 'No 123 Main Street',
      city: city || 'Colombo',
      country: 'Sri Lanka',
      hash: hash,
    };

    return res.json({ success: true, payload: payherePayload });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to generate PayHere payment hash' });
  }
});

// POST /payhere/notify
apiRouter.post('/payhere/notify', async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id,
    } = req.body;

    const isValid = verifyPayHereNotification(
      merchant_id || '',
      order_id || '',
      payhere_amount || '',
      payhere_currency || '',
      status_code || '',
      md5sig || ''
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const order = inMemoryOrders.find((o) => o.id === order_id);
    if (order) {
      if (status_code === '2') {
        order.paymentStatus = 'PAID';
        order.orderStatus = 'PROCESSING';
      } else if (status_code === '-1' || status_code === '-2') {
        order.paymentStatus = 'FAILED';
      }
    }

    try {
      const db = await getDb();
      if (db && typeof db.order?.update === 'function') {
        if (status_code === '2') {
          await db.order.update({
            where: { id: order_id },
            data: {
              paymentStatus: 'PAID',
              orderStatus: 'PROCESSING',
              notes: `Paid via PayHere Gateway (Payment ID: ${payment_id})`,
            },
          });
        }
      }
    } catch (e) {}

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal webhook processing error' });
  }
});

// ==========================================
// 6. BANK SLIP UPLOAD API
// ==========================================

// POST /upload-slip
apiRouter.post('/upload-slip', upload.single('file'), (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No slip file attached' });
    }

    const mimeType = file.mimetype || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${file.buffer.toString('base64')}`;

    return res.json({
      url: dataUrl,
      fileName: file.originalname,
      message: 'Bank deposit slip uploaded successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process bank slip image' });
  }
});

// Mount the API Router to BOTH '/api' and '/'
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback for API 404
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl || req.url}` });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global express error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: err?.message || "Internal Server Error" });
  }
});

// Start local dev server if not in Vercel Serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 GizmoTek API Backend running on http://localhost:${PORT}`);
  });
}

export default app;
