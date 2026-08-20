import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Prisma singleton
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// PayHere Config
const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '1211145';
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || '4N6L5k8V1234567890abcdef12345678';
const PAYHERE_MODE = process.env.PAYHERE_MODE || 'sandbox';
const PAYHERE_CHECKOUT_URL =
  PAYHERE_MODE === 'live'
    ? 'https://www.payhere.lk/pay/checkout'
    : 'https://sandbox.payhere.lk/pay/checkout';

function generatePayHereHash(
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string = 'LKR',
  merchantSecret: string = PAYHERE_MERCHANT_SECRET
): string {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const amountFormatted = amount.toFixed(2);
  const hashString = merchantId + orderId + amountFormatted + currency + hashedSecret;

  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
}

function verifyPayHereNotification(
  merchantId: string,
  orderId: string,
  payhereAmount: string,
  payhereCurrency: string,
  statusCode: string,
  md5sig: string,
  merchantSecret: string = PAYHERE_MERCHANT_SECRET
): boolean {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const hashString = merchantId + orderId + payhereAmount + payhereCurrency + statusCode + hashedSecret;
  const expectedMd5 = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();

  return expectedMd5 === md5sig.toUpperCase();
}

const app = express();

// Global Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Multer memory storage for bank slip uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Admin Auth Middleware
const adminAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_authenticated_admin_session_token_2026';
  const adminSession = req.cookies?.gizmotek_admin_session || req.headers['x-admin-session'];

  if (!adminSession || adminSession !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized access. Admin authentication required.' });
  }
  next();
};

const apiRouter = express.Router();

// ==========================================
// 1. PRODUCTS
// ==========================================

apiRouter.get('/products', async (req, res) => {
  const { search = '', category = '', sort = 'newest', featured } = req.query;

  try {
    const where: any = {};

    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { category: { contains: search.trim(), mode: 'insensitive' } },
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

    const products = await prisma.product.findMany({
      where,
      orderBy,
    });

    return res.json({ products: products || [] });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products from database', detail: error?.message });
  }
});

apiRouter.get('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error: any) {
    console.error('Error fetching product by ID:', error);
    return res.status(500).json({ error: 'Failed to fetch product details', detail: error?.message });
  }
});

apiRouter.post('/products', adminAuthMiddleware, async (req, res) => {
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
      return res.status(400).json({ error: 'Missing required product fields (title, category, sellingPriceLkr, sku)' });
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
        : typeof specs === 'object' && specs !== null
        ? JSON.stringify(specs)
        : '{}';

    const product = await prisma.product.upsert({
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
  } catch (error: any) {
    console.error('Error saving product:', error);
    return res.status(500).json({ error: 'Failed to save product in database', detail: error?.message });
  }
});

// ==========================================
// 2. ORDERS
// ==========================================

apiRouter.get('/orders', adminAuthMiddleware, async (req, res) => {
  const { status } = req.query;

  try {
    const where: any = {};
    if (status && status !== 'ALL' && typeof status === 'string') {
      where.orderStatus = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ orders: orders || [] });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders from database', detail: error?.message });
  }
});

apiRouter.get('/orders/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
        ],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ order });
  } catch (error: any) {
    console.error('Error fetching order by ID:', error);
    return res.status(500).json({ error: 'Failed to fetch order details', detail: error?.message });
  }
});

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
      return res.status(400).json({ error: 'Missing required order details' });
    }

    let subtotalLkr = 0;
    const itemsData: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      const unitPrice = product ? product.sellingPriceLkr : 0;
      subtotalLkr += unitPrice * item.quantity;

      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
      });
    }

    const isMetro = district === 'Colombo' || district === 'Gampaha';
    const isFreeShipping = subtotalLkr >= 15000;
    const shippingFeeLkr = isFreeShipping ? 0 : isMetro ? 350 : 500;
    const totalLkr = subtotalLkr + shippingFeeLkr;

    const orderNumber = `GZ-${Math.floor(10000 + Math.random() * 90000)}`;

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
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
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(201).json({ success: true, order: createdOrder });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Failed to create order in database', detail: error?.message });
  }
});

apiRouter.patch('/orders', adminAuthMiddleware, async (req, res) => {
  try {
    const { orderId, orderStatus, paymentStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter' });
    }

    const dataToUpdate: any = {};
    if (orderStatus) dataToUpdate.orderStatus = orderStatus;
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: dataToUpdate,
    });

    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return res.status(500).json({ error: 'Failed to update order in database', detail: error?.message });
  }
});

// ==========================================
// 3. REVIEWS
// ==========================================

apiRouter.get('/reviews', async (req, res) => {
  const { productId } = req.query;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Missing productId parameter' });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ reviews: reviews || [] });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews', detail: error?.message });
  }
});

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

    const review = await prisma.review.create({
      data: {
        productId,
        authorName: authorName.trim(),
        rating: numRating,
        comment: comment.trim(),
        isApproved: false,
      },
    });

    return res.status(201).json({ success: true, review });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return res.status(500).json({ error: 'Failed to submit review', detail: error?.message });
  }
});

// ==========================================
// 4. ADMIN
// ==========================================

apiRouter.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'gizmotek2026admin';
  const token = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_authenticated_admin_session_token_2026';

  if (username === validUsername && password === validPassword) {
    res.cookie('gizmotek_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      message: 'Admin authenticated successfully',
    });
  }

  return res.status(401).json({ error: 'Invalid admin credentials' });
});

apiRouter.post('/admin/logout', (req, res) => {
  res.clearCookie('gizmotek_admin_session');
  return res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.get('/admin/reviews', adminAuthMiddleware, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ reviews: reviews || [] });
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews', detail: error?.message });
  }
});

apiRouter.patch('/admin/reviews', adminAuthMiddleware, async (req, res) => {
  try {
    const { reviewId, action } = req.body;

    if (!reviewId || !action) {
      return res.status(400).json({ error: 'Missing reviewId or action' });
    }

    if (action === 'approve') {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { isApproved: true },
      });
      return res.json({ success: true, review: updated });
    } else if (action === 'decline') {
      await prisma.review.delete({
        where: { id: reviewId },
      });
      return res.json({ success: true, message: 'Review deleted' });
    }

    return res.status(400).json({ error: 'Invalid action. Use "approve" or "decline"' });
  } catch (error: any) {
    console.error('Error moderating review:', error);
    return res.status(500).json({ error: 'Failed to moderate review', detail: error?.message });
  }
});

apiRouter.get('/admin/export-orders', adminAuthMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

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

    for (const o of orders) {
      const codAmount = o.paymentMethod === 'COD' ? o.totalLkr : 0;
      const itemsDesc = o.items
        ? o.items.map((i: any) => `${i.product?.title || 'Gadget'} (x${i.quantity})`).join(' | ')
        : 'Tech Gadgets';

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
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
    return res.status(200).send(csvData);
  } catch (error: any) {
    console.error('Error exporting orders CSV:', error);
    return res.status(500).json({ error: 'Failed to export orders CSV' });
  }
});

// ==========================================
// 5. PAYHERE
// ==========================================

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

    const origin = req.headers.origin || 'https://www.gizmotek.lk';

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
    console.error('PayHere hash error:', error);
    return res.status(500).json({ error: 'Failed to generate PayHere payment hash' });
  }
});

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

    if (status_code === '2') {
      await prisma.order.update({
        where: { id: order_id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          notes: `Paid via PayHere Gateway (Payment ID: ${payment_id})`,
        },
      });
    } else if (status_code === '-1' || status_code === '-2') {
      await prisma.order.update({
        where: { id: order_id },
        data: {
          paymentStatus: 'FAILED',
        },
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('PayHere webhook error:', error);
    return res.status(500).json({ error: 'Internal webhook processing error' });
  }
});

// ==========================================
// 6. BANK SLIP UPLOAD
// ==========================================

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

export default app;