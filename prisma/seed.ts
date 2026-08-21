import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mockProducts = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

async function main() {
  console.log("Seeding GizmoTek.lk database...");

  // Clear existing products and orders
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});

  for (const item of mockProducts) {
    await prisma.product.create({
      data: item,
    });
  }

  // Create a sample seed order for testing admin view
  await prisma.order.create({
    data: {
      orderNumber: "GZ-88219",
      customerName: "Kusal Perera",
      customerPhone: "+94 72 141 0369",
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
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({ where: { sku: "AUD-CYB-001" } }))!.id,
            quantity: 1,
            unitPrice: 8950,
          },
        ],
      },
    },
  });

  console.log("Database seeded successfully with 8 products and 1 sample order!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
