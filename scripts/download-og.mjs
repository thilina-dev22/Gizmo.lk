import fs from 'fs';
import path from 'path';

async function downloadOgBanner() {
  const ogUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=85&w=1200&h=630&auto=format&fit=crop';
  const outDir = path.resolve('public', 'images');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, 'og-banner.jpg');
  
  console.log('Downloading OG banner image...');
  const res = await fetch(ogUrl);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(outFile, Buffer.from(buffer));
  console.log(`✅ Saved OG Banner to ${outFile} (${buffer.byteLength} bytes)`);
}

downloadOgBanner().catch(console.error);
