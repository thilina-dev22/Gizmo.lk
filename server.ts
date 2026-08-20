import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { db, ensureTablesExist } from './src/lib/db';
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

// Built-in fallback mock catalog if database is in setup / offline state
let inMemoryProducts = [
  {
    id: "prod-1",
    title: "CyberBass ANC Wireless Earbuds with Touch Display Case",
    slug: "cyberbass-anc-wireless-earbuds",
    description: "Futuristic true wireless earbuds with active noise cancellation, low-latency gaming mode, and a high-definition color touch LCD built into the smart charging case. Control volume, track selection, and equalizer presets directly from your case!",
    category: "Audio",
    sellingPriceLkr: 8950,
    costPriceLkr: 4200,
    sku: "AUD-CYB-001",
    stock: 45,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=800&auto=format&fit=crop",
    ]),
    specs: JSON.stringify({
      "Bluetooth Version": "5.3 Dual-Mode",
      "Active Noise Cancellation": "Up to -35dB",
      "Battery Life": "8 hrs earbuds + 32 hrs case",
      "Display": "1.47-inch TFT Touchscreen",
      "Water Resistance": "IPX5 Splashproof",
    }),
    supplierLink: "https://cjdropshipping.com/product/cyberbass-touch-case-p-1002.html",
    supplierNotes: "Fast dispatch via CJ Packet Express. Average delivery time 7-10 days to LK.",
    isFeatured: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 38,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    title: "Ultra Titanium AMOLED Smartwatch with BT Calling & GPS",
    slug: "ultra-titanium-amoled-smartwatch",
    description: "Rugged aerospace-grade titanium alloy smartwatch featuring a 2.04-inch 60Hz Retina AMOLED display, standalone GPS tracking, Bluetooth HD phone calling, compass, and multi-sport tracking modes.",
    category: "Smartwatches",
    sellingPriceLkr: 14500,
    costPriceLkr: 7800,
    sku: "SW-ULT-002",
    stock: 28,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&auto=format&fit=crop",
    ]),
    specs: JSON.stringify({
      "Display": "2.04-inch HD AMOLED 466x466",
      "Body Material": "Titanium Alloy & Sapphire Glass",
      "Battery": "450mAh (7-10 Days Heavy Use)",
      "Sensors": "SpO2, Heart Rate, ECG, Barometer",
      "Calling": "Dual Mic HD Voice Calling",
    }),
    supplierLink: "https://aliexpress.com/item/ultra-titanium-watch-1005.html",
    supplierNotes: "High conversion product on Facebook Video Ads. High profit margin.",
    isFeatured: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 29,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    title: "4K Dual-Lens AI Car Dashcam with Night Vision & WiFi",
    slug: "4k-dual-lens-ai-car-dashcam",
    description: "Ultra HD 4K front and 1080P rear dual car camera equipped with Sony STARVIS 2 sensor, built-in G-Sensor, GPS logger, 24-hour parking monitor mode, and mobile app instant WiFi video download.",
    category: "Car Gadgets",
    sellingPriceLkr: 18900,
    costPriceLkr: 9500,
    sku: "CAR-DASH-003",
    stock: 18,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508974239320-0a029497e820?q=80&w=800&auto=format&fit=crop",
    ]),
    specs: JSON.stringify({
      "Resolution": "Front 4K (2160P) + Rear 1080P",
      "Sensor": "Sony STARVIS IMX415",
      "Field of View": "170 Wide Angle",
      "Connectivity": "5GHz High-Speed WiFi",
      "Storage": "Supports up to 256GB MicroSD",
    }),
    supplierLink: "https://cjdropshipping.com/product/4k-dashcam-wifi-p-3004.html",
    supplierNotes: "Includes 64GB Kingston C10 SD card in supplier package.",
    isFeatured: true,
    isBestSeller: false,
    rating: 4.7,
    reviewCount: 19,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    title: "Transparent Mechanical Keyboard RGB Gasket Mount (75%)",
    slug: "transparent-mechanical-keyboard-rgb",
    description: "Sleek 75% mechanical keyboard with crystal clear transparent PC casing, custom pre-lubed tactile switches, gasket mount structure for satisfying deep acoustic typing sound, and 19 RGB lighting modes.",
    category: "Computer Accessories",
    sellingPriceLkr: 16500,
    costPriceLkr: 8900,
    sku: "KB-TRN-004",
    stock: 12,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=800&auto=format&fit=crop",
    ]),
    specs: JSON.stringify({
      "Keys": "82 Keys (75% Compact Layout)",
      "Switches": "Hot-swappable Custom Crystal Linear",
      "Connectivity": "Tri-Mode (Bluetooth 5.0 / 2.4Ghz / Type-C)",
      "Battery": "4000mAh Lithium Rechargeable",
    }),
    supplierLink: "https://aliexpress.com/item/transparent-gasket-kb-9021.html",
    supplierNotes: "Includes keycap puller, extra switches, and braided cyan cable.",
    isFeatured: false,
    isBestSeller: true,
    rating: 5.0,
    reviewCount: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-5",
    title: "15W MagSafe Automatic Clamping Car Mount & Wireless Charger",
    slug: "15w-magsafe-car-mount-charger",
    description: "Smart infrared sensor automatic clamping car phone holder with 15W MagSafe wireless fast charging, 360-degree rotation ball joint, and secure air vent twist lock hook.",
    category: "Car Gadgets",
    sellingPriceLkr: 4850,
    costPriceLkr: 2100,
    sku: "CAR-MAG-005",
    stock: 50,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616440342232-1594ad5ec62e?q=80&w=800&auto=format&fit=crop",
    ]),
    specs: JSON.stringify({
      "Output Power": "15W / 10W / 7.5W / 5W",
      "Clamping Mechanism": "Automatic Electric Induction",
      "Input Interface": "USB Type-C",
      "Compatibility": "Universal (iPhone MagSafe & Android Qi)",
    }),
    supplierLink: "https://cjdropshipping.com/product/auto-clamp-magsafe-mount.html",
    supplierNotes: "Best seller item for impulse buying on mobile ads.",
    isFeatured: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 42,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-6",
    title: "10-in-1 Aluminum USB-C Hub Docking Station 4K 60Hz",
    slug: "10-in-1-usb-c-docking-station",
    description: "Premium anodized space gray aluminum USB-C hub with HDMI 4K@60Hz, 100W Power Delivery charging port, Gigabit Ethernet RJ45, SD/TF dual card readers, and 3x USB 3.0 5Gbps ports.",
    category: "Computer Accessories",
    sellingPriceLkr: 9800,
    costPriceLkr: 4600,
    sku: "ACC-DOCK-006",
    stock: 30,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1544652478-6653e09f18a2?q=80&w=800&auto=format&fit=crop",
    ]),
    specs: JSON.stringify({
      "Ports": "HDMI 4K, 100W PD, Gigabit LAN, SD, MicroSD, 3x USB 3.0, 3.5mm Audio",
      "Material": "Heat-Dissipating Aluminum Alloy",
      "Cable Length": "15cm Reinforced Braided Cable",
    }),
    supplierLink: "https://cjdropshipping.com/product/10in1-usbc-dock-505.html",
    supplierNotes: "Supports MacBook M1/M2/M3, Windows laptops, and iPad Pro.",
    isFeatured: false,
    isBestSeller: false,
    rating: 4.6,
    reviewCount: 11,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-7",
    title: "Apex Pro Mini Pocket 4G Smartphone 3-Inch Display",
    slug: "apex-pro-mini-pocket-4g-smartphone",
    description: "Ultra-compact miniature 4G Android smartphone featuring a 3.0-inch touchscreen, dual SIM standby, quad-core processor, 5MP camera, and full Google Play Store access for WhatsApp, YouTube, and banking apps.",
    category: "Smartphones",
    sellingPriceLkr: 22500,
    costPriceLkr: 12500,
    sku: "MOB-MINI-007",
    stock: 10,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop",
    ]),
    specs: JSON.stringify({
      "Screen": "3.0-inch IPS FWVGA Touchscreen",
      "OS": "Android 12",
      "Memory": "4GB RAM + 64GB Storage",
      "Network": "4G LTE Dual Nano SIM",
      "Battery": "2000mAh",
    }),
    supplierLink: "https://aliexpress.com/item/mini-smartphone-4g-889.html",
    supplierNotes: "Extremely popular gadget for tech enthusiasts and kids.",
    isFeatured: true,
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 22,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-8",
    title: "Bone Conduction Open-Ear Sports Headset IPX8 Waterproof",
    slug: "bone-conduction-sports-headset-ipx8",
    description: "Next-gen bone conduction headphones transmitting sound through cheekbones. Features IPX8 100% waterproof rating for swimming, built-in 32GB MP3 storage mode, and 10 hours continuous playtime.",
    category: "Audio",
    sellingPriceLkr: 11200,
    costPriceLkr: 5300,
    sku: "AUD-BONE-008",
    stock: 22,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop",
    ]),
    specs: JSON.stringify({
      "Technology": "9th Gen Bone Conduction Transducer",
      "Waterproof Level": "IPX8 Swim-Ready (Up to 3m depth)",
      "Internal Storage": "32GB (Holds ~8,000 MP3 songs)",
      "Playtime": "10 Hours @ 70% Volume",
    }),
    supplierLink: "https://cjdropshipping.com/product/bone-conduction-ipx8.html",
    supplierNotes: "Comes with earplugs and swim clip strap.",
    isFeatured: false,
    isBestSeller: false,
    rating: 4.7,
    reviewCount: 16,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let inMemoryOrders: any[] = [
  {
    id: "order-seed-1",
    orderNumber: "GZ-88219",
    customerName: "Kusal Perera",
    customerPhone: "0771234567",
    customerEmail: "kusal.p@example.lk",
    address: "No. 45, Galle Road",
    district: "Colombo",
    city: "Colombo 03",
    paymentMethod: "BANK_TRANSFER",
    paymentStatus: "VERIFIED",
    orderStatus: "PROCESSING",
    bankSlipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop",
    subtotalLkr: 8950,
    shippingFeeLkr: 350,
    totalLkr: 9300,
    notes: "Please call before dispatching.",
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        quantity: 1,
        unitPrice: 8950,
        product: inMemoryProducts[0],
      },
    ],
  },
];

let inMemoryReviews: any[] = [
  {
    id: "rev-1",
    productId: "prod-1",
    authorName: "Dilshan Wickramasinghe",
    rating: 5,
    comment: "Outstanding sound quality and the touch display on the charging case is super futuristic. Battery easily lasts all day!",
    isApproved: true,
    createdAt: new Date().toISOString(),
    product: inMemoryProducts[0],
  },
  {
    id: "rev-2",
    productId: "prod-2",
    authorName: "Anushka Perera",
    rating: 5,
    comment: "The AMOLED display is ultra bright even under direct Colombo sunlight. Bluetooth calling is crystal clear!",
    isApproved: true,
    createdAt: new Date().toISOString(),
    product: inMemoryProducts[1],
  },
];

// Middleware
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

// ==========================================
// 1. PRODUCTS API
// ==========================================

// GET /api/products
app.get(['/api/products', '/products'], async (req, res) => {
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

// GET /api/products/:id
app.get(['/api/products/:id', '/products/:id'], async (req, res) => {
  const { id } = req.params;

  try {
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

// POST /api/products (Admin create/edit)
app.post(['/api/products', '/products'], async (req, res) => {
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

// GET /api/orders
app.get(['/api/orders', '/orders'], async (req, res) => {
  try {
    const { status, id, orderNumber } = req.query;

    if (id || orderNumber) {
      try {
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

// POST /api/orders
app.post(['/api/orders', '/orders'], async (req, res) => {
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

// PATCH /api/orders
app.patch(['/api/orders', '/orders'], async (req, res) => {
  try {
    const { orderId, orderStatus, paymentStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter' });
    }

    const dataToUpdate: any = {};
    if (orderStatus) dataToUpdate.orderStatus = orderStatus;
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

    try {
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

// GET /api/reviews
app.get(['/api/reviews', '/reviews'], async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'Missing productId parameter' });
    }

    try {
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

// POST /api/reviews
app.post(['/api/reviews', '/reviews'], async (req, res) => {
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

// POST /api/admin/login
app.post(['/api/admin/login', '/admin/login'], (req, res) => {
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

// POST /api/admin/logout
app.post(['/api/admin/logout', '/admin/logout'], (req, res) => {
  res.clearCookie('gizmotek_admin_session', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/reviews
app.get(['/api/admin/reviews', '/admin/reviews'], async (req, res) => {
  try {
    try {
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

// PATCH /api/admin/reviews
app.patch(['/api/admin/reviews', '/admin/reviews'], async (req, res) => {
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

// GET /api/admin/export-orders (CSV Download)
app.get(['/api/admin/export-orders', '/admin/export-orders'], async (req, res) => {
  try {
    let ordersList = inMemoryOrders;
    try {
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

// POST /api/payhere/hash
app.post(['/api/payhere/hash', '/payhere/hash'], (req, res) => {
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

// POST /api/payhere/notify
app.post(['/api/payhere/notify', '/payhere/notify'], async (req, res) => {
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

// POST /api/upload-slip
app.post(['/api/upload-slip', '/upload-slip'], upload.single('file'), (req, res) => {
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

// ==========================================
// 7. PRODUCTION STATIC ASSETS & SPA ROUTING
// ==========================================
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.resolve(distPath, 'index.html'));
    }
    next();
  });
}

// Start Server (Standalone Node environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 GizmoTek API Backend running on http://localhost:${PORT}`);
  });
}

export default app;


