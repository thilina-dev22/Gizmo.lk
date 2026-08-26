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
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateGoogleMerchantFeed() {
  console.log('🛍️ Generating Google Merchant Center RSS 2.0 XML Product Feed for GizmoTek.lk...');

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${products.length} products to export into Google Merchant feed.`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>GizmoTek.lk Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Sri Lanka's premier online store for tech gadgets, smartwatches, wireless earbuds &amp; accessories.</description>
`;

  for (const product of products) {
    let images = [];
    try {
      if (product.images) {
        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsed)) images = parsed;
      }
    } catch {}

    const primaryImage = images[0] || 'https://gizmotek.lk/favicon.svg';
    const productUrl = `${BASE_URL}/products/${product.slug || product.id}`;
    const cleanDesc = product.description
      ? product.description.replace(/<[^>]*>?/gm, '').trim()
      : `${product.title} available with islandwide delivery across Sri Lanka at GizmoTek.lk`;

    let brand = 'GizmoTek';
    if (product.specs) {
      try {
        const parsedSpecs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
        if (parsedSpecs['Brand'] || parsedSpecs['brand']) {
          brand = parsedSpecs['Brand'] || parsedSpecs['brand'];
        }
      } catch {}
    }

    xml += `    <item>
      <g:id>${escapeXml(product.sku || product.id)}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(cleanDesc.slice(0, 5000))}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(primaryImage)}</g:image_link>
`;

    // Additional images (up to 10)
    for (let i = 1; i < Math.min(images.length, 10); i++) {
      if (images[i]) {
        xml += `      <g:additional_image_link>${escapeXml(images[i])}</g:additional_image_link>\n`;
      }
    }

    xml += `      <g:condition>new</g:condition>
      <g:availability>${product.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${product.sellingPriceLkr.toFixed(2)} LKR</g:price>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:product_type>${escapeXml(product.category || 'Electronics')}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>LK</g:country>
        <g:service>Islandwide Courier Delivery</g:service>
        <g:price>450.00 LKR</g:price>
      </g:shipping>
    </item>
`;
  }

  xml += `  </channel>
</rss>`;

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'feed.xml'), xml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'google-merchant-feed.xml'), xml, 'utf8');

  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'feed.xml'), xml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'google-merchant-feed.xml'), xml, 'utf8');
  }

  console.log('✅ Google Merchant Center Product Feed generated successfully at public/feed.xml');
  await prisma.$disconnect();
}

generateGoogleMerchantFeed().catch((err) => {
  console.error('Failed to generate Google Merchant feed:', err);
  process.exit(1);
});
