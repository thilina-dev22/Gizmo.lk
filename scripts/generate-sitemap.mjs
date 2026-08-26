import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const prisma = new PrismaClient();
const BASE_URL = 'https://gizmotek.lk';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const STATIC_ROUTES = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/products', changefreq: 'daily', priority: '0.9' },
  { url: '/faq', changefreq: 'weekly', priority: '0.7' },
  { url: '/contact-us', changefreq: 'monthly', priority: '0.6' },
  { url: '/shipping-policy', changefreq: 'monthly', priority: '0.5' },
  { url: '/return-policy', changefreq: 'monthly', priority: '0.5' },
  { url: '/terms-and-conditions', changefreq: 'monthly', priority: '0.5' },
  { url: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
];

const CATEGORIES = [
  'Smartphones',
  'Chargers & Cables',
  'Storage & Pen Drives',
  'Audio',
  'Wearables',
  'Computer Accessories',
  'Outdoor & Gadgets',
];

async function generateSitemap() {
  console.log('🗺️  Generating dynamic XML Sitemap for GizmoTek.lk...');

  let products = [];
  try {
    products = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        images: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`Found ${products.length} products to index in sitemap.`);
  } catch (err) {
    console.warn('Could not fetch products from DB for sitemap:', err.message);
  }

  const currentDate = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  // 1. Static Pages
  for (const route of STATIC_ROUTES) {
    xml += `  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
  }

  // 2. Category Pages
  for (const cat of CATEGORIES) {
    const encodedCat = encodeURIComponent(cat);
    xml += `  <url>
    <loc>${BASE_URL}/products?category=${encodedCat}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
`;
  }

  // 3. Product Pages with Google Image Sitemaps
  for (const prod of products) {
    const productUrl = `${BASE_URL}/products/${prod.slug || prod.id}`;
    const lastmod = prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : currentDate;

    let imageUrl = '';
    try {
      if (prod.images) {
        const parsed = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
        if (Array.isArray(parsed) && parsed.length > 0) {
          imageUrl = parsed[0];
        }
      }
    } catch {}

    xml += `  <url>
    <loc>${productUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>`;

    if (imageUrl) {
      xml += `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(prod.title)}</image:title>
    </image:image>`;
    }

    xml += `
  </url>
`;
  }

  xml += `</urlset>`;

  // Ensure public folder exists
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`✅ Successfully generated sitemap with ${STATIC_ROUTES.length + CATEGORIES.length + products.length} URLs at ${sitemapPath}`);

  // Also write to dist/sitemap.xml if dist exists
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
  }

  await prisma.$disconnect();
}

generateSitemap().catch((err) => {
  console.error('Failed to generate sitemap:', err);
  process.exit(1);
});
